import { createStore } from 'zustand/vanilla';

import type { RequiredReconciliation } from '@core/debt/bulkMarkRequired';

import { createDefaultStore } from '@/data/defaults';
import { runMigrations } from '@/data/migrations';
import {
  CURRENT_STORE_VERSION,
  type CompletedRecommendedAction,
  type Debt,
  type DebtStore,
  type Goal,
  type LivingExpense,
  type PaycheckConfig,
  type PayoffStrategy,
  type Preferences,
  type RequiredExpense,
  type SubscriptionPlan,
} from '@/data/models';
import type { StorageAdapter } from '@/storage/adapter';

import { recordDriftBaseline } from './drift';
import { stampCyclePrediction } from './guardianPrediction';
import { applyCapture, applyRollover, type PaydayActuals } from './payday';
import { recordMissedArrival, stampInputsFresh, stampOnboardedAt } from './substrateProducers';

/**
 * The app-wide state: the persisted `store` blob + hydration lifecycle + the mutating actions.
 * Every action swaps in a new `store` object (immutable update) so the persistence subscription and
 * React selectors fire. Mirrors Freedom's store shape; entities come from the shared `@core` schema.
 */
export interface DebtAppState {
  store: DebtStore;
  isHydrated: boolean;
  isSaving: boolean;

  // Lifecycle
  hydrate(adapter: StorageAdapter): Promise<void>;
  save(adapter: StorageAdapter): Promise<void>;
  reset(): void;

  // Paycheck / strategy
  updatePaycheck(updates: Partial<PaycheckConfig>): void;
  setPayoffStrategy(strategy: PayoffStrategy): void;

  // Debts
  addDebt(debt: Debt): void;
  updateDebt(id: string, updates: Partial<Debt>): void;
  removeDebt(id: string): void;
  // Projection auto-maintenance (2.3): re-anchor a debt's verified balance (confirm/correct/manual
  // update) — the ONLY path that moves `balance` deliberately. `verifyDebtBalances` is the batch used
  // by the Payday Autopilot confirm-all step.
  verifyDebtBalance(id: string, verifiedBalance: number, verifiedDate: string): void;
  verifyDebtBalances(entries: { id: string; balance: number }[], verifiedDate: string): void;

  // Required expenses (bills)
  addExpense(expense: RequiredExpense): void;
  updateExpense(id: string, updates: Partial<RequiredExpense>): void;
  removeExpense(id: string): void;

  // Goals
  addGoal(goal: Goal): void;
  updateGoal(id: string, updates: Partial<Goal>): void;
  removeGoal(id: string): void;

  // Living expenses (everyday-spending reserve)
  addLivingExpense(expense: LivingExpense): void;
  updateLivingExpense(id: string, updates: Partial<LivingExpense>): void;
  removeLivingExpense(id: string): void;

  // Mark-paid (this cycle)
  markExpensePaid(id: string, paid: boolean): void;
  markDebtMinimumPaid(id: string, paid: boolean): void;
  toggleRecommendedDone(action: CompletedRecommendedAction, done: boolean): void;

  // Payday Autopilot: capture the paycheck, roll the cycle forward, track the handled payday
  capturePayday(items: CompletedRecommendedAction[], requiredDecisions: RequiredReconciliation, actuals?: PaydayActuals): void;
  rolloverPayCycle(): void;
  setLastHandledPayday(date: string): void;
  markReviewPrompted(): void;
  setWindfall(amount: number): void;

  // Prefs / subscription / onboarding
  updatePrefs(updates: Partial<Preferences>): void;
  setSubscriptionPlan(plan: SubscriptionPlan): void;
  setCushionFloor(floor: number): void;
  completeOnboarding(): void;
  /** 2.4.D.4 — stamp/refresh the current cycle's Guardian prediction (app-open cycle-detect). */
  refreshCyclePrediction(): void;
  /** §2.3.1 (2.4.7.7) — report / un-report that THIS cycle's paycheck didn't arrive (paused-deploy). */
  declareMissedPaycheck(): void;
  undoMissedPaycheck(): void;

  // Import (shared by JSON import + iCloud restore + the Phase-D data bridge)
  importStore(store: DebtStore): void;
}

/** Stable identity for a completed recommended action (dedup key for toggle). */
const recKey = (a: CompletedRecommendedAction) => `${a.category}:${a.targetId}:${a.paymentSource ?? 'paycheck'}`;

export function createDebtStore() {
  return createStore<DebtAppState>((set, get) => ({
    store: createDefaultStore(),
    isHydrated: false,
    isSaving: false,

    async hydrate(adapter) {
      const raw = await adapter.read();
      if (raw === null) {
        // First launch — keep defaults, seed the blob.
        set({ isHydrated: true });
        await adapter.write(get().store);
        return;
      }
      try {
        const migrated = runMigrations(raw);
        const upgraded = (raw as Partial<DebtStore>).storeVersion !== CURRENT_STORE_VERSION;
        set({ store: migrated, isHydrated: true });
        if (upgraded) await adapter.write(get().store);
      } catch {
        // Corrupt / unmigratable: quarantine the bytes, start fresh, overwrite (never write bad data back).
        await adapter.quarantine?.(JSON.stringify(raw), 'migration-failed');
        set({ isHydrated: true });
        await adapter.write(get().store);
      }
    },

    async save(adapter) {
      set({ isSaving: true });
      try {
        await adapter.write(get().store);
      } finally {
        set({ isSaving: false });
      }
    },

    reset() {
      // "Reset all data": fresh defaults, stay hydrated (onboardingComplete=false → the gate returns
      // to onboarding). Autosave persists it.
      set({ store: createDefaultStore(), isHydrated: true });
    },

    updatePaycheck(updates) {
      // A genuine income edit → stamp read-freshness (2.4.D.3a).
      set((s) => ({ store: stampInputsFresh(recordDriftBaseline({ ...s.store, paycheck: { ...s.store.paycheck, ...updates } })) }));
    },
    setPayoffStrategy(strategy) {
      set((s) => ({ store: recordDriftBaseline({ ...s.store, payoffStrategy: strategy }) }));
    },

    addDebt(debt) {
      // A new debt's balance is verified NOW (the user just entered a real number) → stamp both dates.
      set((s) => {
        const now = s.store.paycheck.currentDate;
        return {
          store: stampInputsFresh(recordDriftBaseline({
            ...s.store,
            debts: [
              ...s.store.debts,
              { ...debt, lastVerifiedDate: debt.lastVerifiedDate ?? now, balanceAsOfDate: debt.balanceAsOfDate ?? now },
            ],
          })),
        };
      });
    },
    updateDebt(id, updates) {
      set((s) => {
        // Editing the balance IS a verification — the user typed a real number → re-anchor BOTH the
        // as-of date and the user-confirmation date (unless the caller already set them). Other edits
        // leave the dates alone.
        const now = s.store.paycheck.currentDate;
        const isBalanceEdit = updates.balance !== undefined;
        const stamped = isBalanceEdit
          ? {
              ...updates,
              lastVerifiedDate: updates.lastVerifiedDate ?? now,
              balanceAsOfDate: updates.balanceAsOfDate ?? now,
            }
          : updates;
        const next = { ...s.store, debts: s.store.debts.map((d) => (d.id === id ? { ...d, ...stamped } : d)) };
        // Field-discriminated read-freshness stamp: a balance edit is a genuine input edit (2.4.D.3a);
        // other debt edits (name, APR, due date) are not.
        return { store: isBalanceEdit ? stampInputsFresh(next) : next };
      });
    },
    removeDebt(id) {
      set((s) => ({ store: stampInputsFresh(recordDriftBaseline({ ...s.store, debts: s.store.debts.filter((d) => d.id !== id) })) }));
    },
    verifyDebtBalance(id, verifiedBalance, verifiedDate) {
      const balance = Math.max(0, Math.round(verifiedBalance * 100) / 100);
      set((s) => ({
        store: stampInputsFresh({
          ...s.store,
          debts: s.store.debts.map((d) =>
            d.id === id ? { ...d, balance, lastVerifiedDate: verifiedDate, balanceAsOfDate: verifiedDate } : d
          ),
        }),
      }));
    },
    verifyDebtBalances(entries, verifiedDate) {
      const next = new Map(entries.map((e) => [e.id, Math.max(0, Math.round(e.balance * 100) / 100)]));
      set((s) => ({
        store: stampInputsFresh({
          ...s.store,
          debts: s.store.debts.map((d) =>
            next.has(d.id)
              ? { ...d, balance: next.get(d.id)!, lastVerifiedDate: verifiedDate, balanceAsOfDate: verifiedDate }
              : d
          ),
        }),
      }));
    },

    addExpense(expense) {
      set((s) => ({ store: stampInputsFresh({ ...s.store, requiredExpenses: [...s.store.requiredExpenses, expense] }) }));
    },
    updateExpense(id, updates) {
      set((s) => ({
        store: stampInputsFresh({
          ...s.store,
          requiredExpenses: s.store.requiredExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }),
      }));
    },
    removeExpense(id) {
      set((s) => ({
        store: stampInputsFresh({ ...s.store, requiredExpenses: s.store.requiredExpenses.filter((e) => e.id !== id) }),
      }));
    },

    addGoal(goal) {
      set((s) => ({ store: { ...s.store, goals: [...s.store.goals, goal] } }));
    },
    updateGoal(id, updates) {
      set((s) => ({
        store: { ...s.store, goals: s.store.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) },
      }));
    },
    removeGoal(id) {
      set((s) => ({ store: { ...s.store, goals: s.store.goals.filter((g) => g.id !== id) } }));
    },

    addLivingExpense(expense) {
      set((s) => ({ store: stampInputsFresh({ ...s.store, livingExpenses: [...s.store.livingExpenses, expense] }) }));
    },
    updateLivingExpense(id, updates) {
      set((s) => ({
        store: stampInputsFresh({ ...s.store, livingExpenses: s.store.livingExpenses.map((e) => (e.id === id ? { ...e, ...updates } : e)) }),
      }));
    },
    removeLivingExpense(id) {
      set((s) => ({ store: stampInputsFresh({ ...s.store, livingExpenses: s.store.livingExpenses.filter((e) => e.id !== id) }) }));
    },

    markExpensePaid(id, paid) {
      set((s) => ({
        store: {
          ...s.store,
          requiredExpenses: s.store.requiredExpenses.map((e) => (e.id === id ? { ...e, isPaidThisCycle: paid } : e)),
        },
      }));
    },
    markDebtMinimumPaid(id, paid) {
      set((s) => ({
        store: {
          ...s.store,
          debts: s.store.debts.map((d) => (d.id === id ? { ...d, minimumPaidThisCycle: paid } : d)),
        },
      }));
    },
    toggleRecommendedDone(action, done) {
      set((s) => {
        const existing = s.store.completedRecommendedActions;
        const next = done
          ? existing.some((a) => recKey(a) === recKey(action))
            ? existing
            : [...existing, action]
          : existing.filter((a) => recKey(a) !== recKey(action));
        return { store: { ...s.store, completedRecommendedActions: next } };
      });
    },

    capturePayday(items, requiredDecisions, actuals) {
      set((s) => ({ store: applyCapture(s.store, items, requiredDecisions, actuals) }));
    },
    rolloverPayCycle() {
      // Re-check the baseline at the cycle boundary — establishes one for pre-drift users and catches
      // any material change since the last anchor (no-op when nothing material changed).
      set((s) => ({ store: recordDriftBaseline(applyRollover(s.store)) }));
    },
    setLastHandledPayday(date) {
      set((s) => ({ store: { ...s.store, lastHandledPaydayDate: date } }));
    },
    markReviewPrompted() {
      set((s) => ({ store: { ...s.store, reviewPrompted: true } }));
    },
    setWindfall(amount) {
      // A one-time this-cycle bump — does NOT re-baseline drift (it clears on rollover; the baseline holds).
      set((s) => ({ store: { ...s.store, windfall: Math.max(0, amount) } }));
    },

    updatePrefs(updates) {
      set((s) => ({ store: { ...s.store, prefs: { ...s.store.prefs, ...updates } } }));
    },
    setSubscriptionPlan(plan) {
      set((s) => ({ store: { ...s.store, subscriptionPlan: plan } }));
    },
    setCushionFloor(floor) {
      // Clamp to a sane, snapped range — the "alert line" a user would actually set. Guard NaN → 200.
      const safe = Number.isFinite(floor) ? floor : 200;
      const snapped = Math.round(Math.max(0, Math.min(1000, safe)) / 25) * 25;
      set((s) => ({ store: { ...s.store, cushionFloor: snapped } }));
    },
    completeOnboarding() {
      // Plan-establish point — freeze the first drift baseline if the plan is ready, stamp the
      // bill-completeness baseline `onboardedAt` (2.4.D.3, set once), and stamp the first cycle's
      // Guardian prediction (2.4.D.4 onboarding-mid-cycle entry path; no-op until a plan exists).
      set((s) => ({
        store: stampCyclePrediction(
          stampOnboardedAt(recordDriftBaseline({ ...s.store, prefs: { ...s.store.prefs, onboardingComplete: true } })),
        ),
      }));
    },
    refreshCyclePrediction() {
      // App-open / cycle-detect entry path (2.4.D.4): stamp the current cycle's prediction if unstamped,
      // or re-stamp + mark disturbed on a material change. Idempotent, so it's safe to call on mount.
      set((s) => ({ store: stampCyclePrediction(s.store) }));
    },
    declareMissedPaycheck() {
      // §2.3.1 (2.4.7.7): mark THIS cycle's paycheck (keyed by nextPaycheckDate) as a missed arrival →
      // paused-deploy. A rollover advances the date, so the pause auto-resumes on the next real paycheck.
      set((s) => ({ store: recordMissedArrival(s.store, s.store.paycheck.nextPaycheckDate) }));
    },
    undoMissedPaycheck() {
      set((s) => ({
        store: { ...s.store, missedArrivals: s.store.missedArrivals.filter((d) => d !== s.store.paycheck.nextPaycheckDate) },
      }));
    },

    importStore(store) {
      // Route EVERY import through the migration merge (2.4.D, round-6 data #3). It's idempotent, so
      // callers that already pre-migrate (JSON restore) are unaffected; it hardens the future raw
      // callers the interface advertises (iCloud restore, the Phase-D data bridge) so an unmigrated
      // blob can't land the v5 substrate fields `undefined` (NaN `genuineCycleCount`, broken staleness).
      set({ store: runMigrations(store) });
    },
  }));
}

export type DebtStoreInstance = ReturnType<typeof createDebtStore>;
