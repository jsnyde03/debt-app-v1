import { createStore } from 'zustand/vanilla';

import type { RequiredReconciliation } from '@core/debt/bulkMarkRequired';
import type { GuardianBand } from '@core/storage/debtPlannerStorage';

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
  /** §2.3 (2.4.7.8) — apply / dismiss a learned income-floor (lean) suggestion. */
  applyLeanSuggestion(lean: number): void;
  dismissLeanSuggestion(value: number): void;
  /** §2.8 (2.4.10.3) — record that a proactive risk push fired for a cycle: stamp the notify-state +
   *  append the push-log (bounded). Called ONLY when a push actually delivered (never on web). */
  applyRiskNotified(cycleEndDate: string, level: GuardianBand, nowISO: string): void;
  /** §2.8 (2.4.10.2) — dismiss the reconcile-to-clear acknowledgment (clears the current-cycle notify-state). */
  acknowledgeRiskCleared(): void;
  /** §2.0.c (2.4.11.4b) — dismiss the settling-in-reserve release acknowledgment. */
  acknowledgeReserveRelease(): void;
  /** §2.0.c (2.4.11.4c) — the user attests their regular bills are all entered (true) / retracts it
   *  (false), which reduces / restores the discovery safety-net reserve. */
  setBillsAttested(value: boolean): void;
  /** §2.0.c (2.4.11.4c) — dismiss the attestation walk-back notice. */
  acknowledgeReserveWalkback(): void;
  /** §2.10 tight-case (2.4.11.2) — hold this cycle's line by moving `amount` from a savings/EF goal to
   *  checking: reduce the goal + record the top-up for the current cycle. */
  applyTightTopUp(goalId: string, amount: number): void;

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
    applyLeanSuggestion(lean) {
      // §2.3 (2.4.7.8): refine the lean from confirmed actuals. Route through the `'learning'` drift
      // source (a no-op passthrough) so this MEASUREMENT change does NOT re-anchor the drift baseline —
      // "days ahead/behind" must not reset just because the app learned the income floor (2.4.D.5).
      set((s) => ({
        store: stampInputsFresh(
          recordDriftBaseline(
            { ...s.store, paycheck: { ...s.store.paycheck, leanAmount: lean }, dismissedLeanSuggestion: undefined },
            'learning',
          ),
        ),
      }));
    },
    dismissLeanSuggestion(value) {
      set((s) => ({ store: { ...s.store, dismissedLeanSuggestion: value } }));
    },
    applyRiskNotified(cycleEndDate, level, nowISO) {
      // §2.8 (2.4.10.3): a risk push went out — stamp the current-cycle notify-state (so we don't
      // re-fire the same read) + append the timestamp for the rolling-window cap. Bounded to the last
      // 24 entries (well past the ≤2/month cap window; keeps the persisted log from growing forever).
      set((s) => ({
        store: {
          ...s.store,
          currentCycleNotifyState: { forCycleEndDate: cycleEndDate, notifiedRiskLevel: level },
          pushLog: [...s.store.pushLog, nowISO].slice(-24),
        },
      }));
    },
    acknowledgeRiskCleared() {
      // §2.8 (2.4.10.2): the user saw the "looks clear after all" acknowledgment — clear the notify-state
      // so it doesn't re-show. The freq-cap (push-log) still guards against re-pushing this cycle.
      set((s) => ({ store: { ...s.store, currentCycleNotifyState: null } }));
    },
    acknowledgeReserveRelease() {
      // §2.0.c (2.4.11.4b): the user saw the settling-in-reserve release ack — clear it (one-time moment).
      set((s) => ({ store: { ...s.store, pendingReserveRelease: null } }));
    },
    setBillsAttested(value) {
      // §2.0.c (2.4.11.4c): attesting reduces the discovery reserve; retracting restores it.
      set((s) => ({ store: { ...s.store, billsAttested: value } }));
    },
    acknowledgeReserveWalkback() {
      set((s) => ({ store: { ...s.store, pendingReserveWalkback: null } }));
    },
    applyTightTopUp(goalId, amount) {
      // §2.10 (2.4.11.2): the user moved `amount` from savings to hold this cycle's line — draw it down
      // from the goal + record the top-up (cycle-keyed). The plan refills the goal next cycle via the
      // waterfall, so this self-corrects. `cycleTopUp` accumulates if they top up more than once.
      set((s) => {
        const forCycle = s.store.paycheck.nextPaycheckDate;
        const prior = s.store.cycleTopUp?.forCycle === forCycle ? s.store.cycleTopUp.amount : 0;
        return {
          store: {
            ...s.store,
            goals: s.store.goals.map((g) =>
              g.id === goalId ? { ...g, currentAmount: Math.max(0, Math.round((g.currentAmount - amount) * 100) / 100) } : g,
            ),
            cycleTopUp: { forCycle, amount: Math.round((prior + amount) * 100) / 100 },
          },
        };
      });
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
