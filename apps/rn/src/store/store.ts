import { createStore } from 'zustand/vanilla';

import { isInstallmentNative, normalizeBnplInstallment } from '@core/debt/bnplInstallment';
import { raiseOriginalBalance } from '@core/debt/originalBalanceHighWater';
import type { RequiredReconciliation } from '@core/debt/bulkMarkRequired';
import type { GuardianBand } from '@core/storage/debtPlannerStorage';

import { createDefaultStore, todayLocalISO } from '@/data/defaults';
import { runMigrations } from '@/data/migrations';
import {
  CURRENT_STORE_VERSION,
  type CompletedRecommendedAction,
  type CycleTopUpEntry,
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
import { reportError } from '@/utils/reportError';

import { recordDriftBaseline } from './drift';
import { buildCycleTopUp, topUpEntries } from './topUpSelectors';
import { stampCyclePrediction } from './guardianPrediction';
import { applyCapture, applyRollover, type PaydayActuals } from './payday';
import { detectPayoff } from './payoffCelebration';
import { recordMissedArrival, stampInputsFresh, stampOnboardedAt } from './substrateProducers';

/**
 * P6.8.7e.1 [B2 / M2-5] — stamp a pending celebration onto any transform that moved a balance.
 *
 * ⛔ **Wrapped around the four actions that can move a balance to zero, not bolted onto the one the
 * premium invitation happened to call.** That single wiring is what made the product's emotional terminus
 * a premium feature by accident: the beat fired from `confirmPayoff`, reachable only via
 * `selectProvisionalPayoffs`, which returns `[]` for free. The event to watch is the CROSSING.
 *
 * ⚠️ An existing pending payoff is not overwritten by another of the same rank: if the user clears a debt
 * and then edits another before Today has rendered the beat, the first moment is the one they earned.
 *
 * ⛔ **BUT A FINALE OUTRANKS A PENDING BEAT, AND GETTING THAT WRONG LOST THE FINALE FOREVER.** Found by the
 * P6.8.9.2 verification. This function used to return early on ANY `next.pendingPayoff`, and the comment
 * that justified it claimed *"the second crossing will still be there in `debts` for the finale check."*
 * **There is no such check.** `detectPayoff` is TRANSITION-based — it requires `crossed.length > 0` — so:
 *
 *   1. clear debt A  → beat stamped for A
 *   2. clear debt B  *before Today renders* → early return; **B's crossing is never detected**
 *   3. acknowledge the beat → `pendingPayoff` cleared
 *   4. no future transition can ever cross again (`liveBefore.length === 0` → `null`), so the once-ever
 *      **finale is unreachable for the rest of the app's life.**
 *
 * ⚡ This is the product's emotional terminus, it fires once, and the user cannot get it back — which is
 * exactly the class this repo has measured three defects in, every one of them found only by changing code.
 * A beat superseded by the finale loses nothing: the finale is the bigger moment and contains it.
 *
 * ⚠️ `detectPayoff` now runs on every balance-moving transform rather than being short-circuited. It is a
 * single pass over `debts`; the early return was never load-bearing for cost.
 */
function withPayoffCelebration(before: DebtStore, next: DebtStore): DebtStore {
  const payoff = detectPayoff(before.debts, next.debts, next.payoffStrategy);
  if (!payoff) return next;
  // Keep what is already pending UNLESS this transition is the finale and the pending one is not.
  if (next.pendingPayoff && !(payoff.kind === 'finale' && next.pendingPayoff.kind !== 'finale')) return next;
  return { ...next, pendingPayoff: payoff };
}

/**
 * The app-wide state: the persisted `store` blob + hydration lifecycle + the mutating actions.
 * Every action swaps in a new `store` object (immutable update) so the persistence subscription and
 * React selectors fire. Mirrors Freedom's store shape; entities come from the shared `@core` schema.
 */
export interface DebtAppState {
  store: DebtStore;
  isHydrated: boolean;
  isSaving: boolean;
  /** Transient (NOT persisted): is the active premium the one-time Lifetime purchase vs a subscription?
   *  Recomputed from the RevenueCat entitlement each launch by premiumSync — so it can't be stomped by
   *  hydrate and needs no migration. */
  premiumIsLifetime: boolean;
  /** 3.7.A5 — has RevenueCat actually ANSWERED this launch? Transient, like the flag above.
   *
   *  ⚠️ `premiumIsLifetime` defaults to false and is only ever set from the entitlement callback, so
   *  "not answered yet" and "answered: not Lifetime" were indistinguishable. On a cold OFFLINE launch
   *  `getCustomerInfo()` rejects into a catch that deliberately does not downgrade — which means the
   *  flag stays false for the WHOLE session, and a Lifetime owner was shown subscription wording plus a
   *  "Manage Subscription" link into an empty App Store page. Four surfaces read this pair; the honest
   *  third state is "we don't know yet", and it must never claim either kind. */
  premiumResolved: boolean;
  /** 3.5.3.5 / 3.5.5 — the pre-mutation store snapshot for a one-tap Undo of an AppIntent-driven change
   *  (a payday-landed roll, or a logged payment), tagged by `kind` so the Today card words it right.
   *  Transient (never persisted; resets to null each launch → the Undo is session-brief); null when
   *  there's nothing to undo. */
  intentRollback: { store: DebtStore; kind: 'payday-landed' | 'log-payment' } | null;
  /** Durable storage is not answering. Transient (never persisted), and the two halves are NOT the same
   *  severity:
   *
   *  `'read-failed'` — we could not read the blob at all. ⛔ This is NOT "there is no data": a read that
   *  THREW tells us only that we could not see it, so falling through to defaults and saving them would
   *  destroy a healthy store. The app shows a retry surface and autosave is never installed.
   *
   *  `'save-failed'` — the store is loaded and correct on screen, but a write did not land. Non-blocking:
   *  the user keeps working and is told once, because the alternative is editing all evening and losing
   *  it at next launch. Cleared by the next write that succeeds.
   *
   *  `'data-reset'` — the blob was there and could not be migrated, so it was quarantined and the app
   *  started from defaults. ⛔ **This is the one that used to say nothing at all.** `createDefaultStore()`
   *  has `onboardingComplete: false`, so the user was routed into first-run onboarding with every debt,
   *  bill and goal gone from the screen and the app cheerfully asking them to set up — indistinguishable,
   *  from where they stood, from a fresh install. Blocking, because a message the size of this event does
   *  not belong beside a setup form. */
  storageError: 'read-failed' | 'save-failed' | 'data-reset' | null;

  // Lifecycle
  /**
   * Load the persisted blob into the store.
   *
   * ⛔ `opts.seed === false` means **do not write defaults on an empty read** (W1-6). The v1.6 bridge is
   * gated on storage being empty, so seeding is what makes a skipped migration permanent — and the caller
   * is the only one that knows whether the bridge reached a conclusion.
   */
  hydrate(adapter: StorageAdapter, opts?: { seed?: boolean }): Promise<void>;
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
  /**
   * 3.7.A10.2 — move a mis-filed obligation from `requiredExpenses` into `debts`, in ONE write.
   *
   * Two writes would leave a window where the money exists twice (still reserved as an expense, already
   * projected as a debt) or not at all — and this runs on the user's real plan, where a half-applied
   * move is worse than the mistake it corrects.
   */
  convertExpenseToDebt(expenseId: string, debt: Debt): void;

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
  /** §2.6 Recovery — defer a bill to next cycle: move its due date to the next payday so it's no longer
   *  owed this cycle (honest — next cycle carries it; the forecast reflects it). */
  deferExpense(id: string): void;
  /** §2.6 Recovery — the per-bill essential/deferrable override. A pure classification change, so it does
   *  NOT re-stamp read-freshness (MF.1: `updateExpense` would, making a stale read look fresh). */
  setDeferability(id: string, deferability: 'essential' | 'deferrable'): void;
  markDebtMinimumPaid(id: string, paid: boolean): void;
  toggleRecommendedDone(action: CompletedRecommendedAction, done: boolean): void;

  // Payday Autopilot: capture the paycheck, roll the cycle forward, track the handled payday
  capturePayday(items: CompletedRecommendedAction[], requiredDecisions: RequiredReconciliation, actuals?: PaydayActuals): void;
  rolloverPayCycle(): void;
  /** 3.5.3.5 — apply a "Payday landed" AppIntent: snapshot the pre-roll store for Undo, then roll the
   *  cycle exactly as `rolloverPayCycle`. */
  applyPaydayLandedIntent(): void;
  /** 3.5.5 — log a manual payment against a debt (reduce its balance by `amount`, re-anchor its verified
   *  date to today), with Undo. The ONE mutation shared by the in-app "Log payment" action AND the voice
   *  log-a-payment intent — reuses the `verifyDebtBalance` anchoring. No-op on a bad id / non-positive amount. */
  logManualPayment(debtId: string, amount: number): void;
  /** 3.5.3.5 / 3.5.5 — undo the last AppIntent-driven mutation (roll / logged payment); no-op if none. */
  undoIntentAction(): void;
  /** Keep the mutation and clear the Undo affordance. */
  dismissIntentRollback(): void;
  setLastHandledPayday(date: string): void;
  markReviewPrompted(): void;
  setWindfall(amount: number): void;

  // Prefs / subscription / onboarding
  updatePrefs(updates: Partial<Preferences>): void;
  setSubscriptionPlan(plan: SubscriptionPlan): void;
  /** 3.7.A5 — sets `premiumIsLifetime` AND marks the entitlement resolved: the only call site is the
   *  RevenueCat callback, so answering is exactly what this action means. */
  setPremiumIsLifetime(isLifetime: boolean): void;
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
  /** 3.3.2 — clear a just-crossed portfolio milestone after its celebratory ack. */
  acknowledgeMilestone(): void;
  /** P6.8.7e.1 [B2] — the paid-off beat / debt-free finale has been seen. */
  acknowledgePayoff(): void;
  acknowledgeDataRepairs(): void;
  /** §2.0.c (2.4.11.4b) — dismiss the settling-in-reserve release acknowledgment. */
  acknowledgeReserveRelease(): void;
  /** §2.0.c (2.4.11.4c) — the user attests their regular bills are all entered (true) / retracts it
   *  (false), which reduces / restores the discovery safety-net reserve. */
  setBillsAttested(value: boolean): void;
  /** §2.0.c (2.4.11.4c) — dismiss the attestation walk-back notice. */
  acknowledgeReserveWalkback(): void;
  /** §2.10 tight-case (2.4.11.2) — hold this cycle's line by moving `amount` from a savings/EF goal to
   *  checking: reduce the goal + record the top-up for the current cycle. */
  applyTightTopUp(source: CycleTopUpEntry['source'], goalId: string, amount: number): void;
  /** ⛔ S1.5.3 [B3] — reverse THIS source's own entry, read from the store. Never a negative apply.
   *  ⛔ S1.9.1 [D2-2] — pass `draw` when the caller is showing ONE cover rather than the source's running
   *  total: the entry accumulates, so the default (whole entry) hands back every draw this source made.
   *  The Guardian card reads its number from the entry and wants the default; the affordability card
   *  shows a single purchase's cover and must pass it, or its Undo returns more than it said it would. */
  undoTightTopUp(source: CycleTopUpEntry['source'], draw?: { goalId: string; amount: number }): void;
  /** 3.8 — SET this cycle's expense-reserve contribution to `amount` (not add to it). Idempotent by
   *  design: the user acts on a single recommended "reserve $X" offer, and an accumulating action would
   *  silently double the hold on a double-tap. `0` clears it. Never required — the plan is correct at
   *  every contribution level, including none. */
  setExpenseReserveContribution(amount: number): void;

  // Import (shared by JSON import + iCloud restore + the Phase-D data bridge)
  importStore(store: DebtStore): void;
}
/** Stable identity for a completed recommended action (dedup key for toggle). */
const recKey = (a: CompletedRecommendedAction) => `${a.category}:${a.targetId}:${a.paymentSource ?? 'paycheck'}`;

/**
 * ⛔ S1.5.3 [B4] — THE ONE OWNER OF "a debt is arriving from a form, prepare it for the store."
 *
 * A debt's balance is verified NOW (the user just typed a real number), so both dates stamp; an
 * installment-native BNPL has its balance and minimum DERIVED from scheduled × remaining (2.7.2); and
 * `originalBalance` seeds from the first entered balance so every debt row can show a momentum bar —
 * skipped for BNPL, which shows "X of N" rather than a bar.
 *
 * ⚠️ `convertExpenseToDebt` used to reproduce this **minus the normalisation**, and said why:
 * *"a conversion never arrives in that shape (an expense has no installment schedule to derive from)."*
 * **That premise is false.** `DebtSheet`'s type picker is on screen during a conversion, so a user can
 * convert a bill into a BNPL — and the same sheet's `convertingExpenseId` used to leak into a plain add,
 * which routed ordinary new debts down the un-normalised path. Measured: the same 4×$50 input stored as
 * **$200 via `addDebt` and $0 via `convertExpenseToDebt`**, and a $0 balance files the debt the user just
 * added under PAID OFF. Sharing the preparation is what makes the two paths incapable of disagreeing.
 */
function prepareNewDebt(debt: Debt, now: string): Debt {
  return normalizeBnplInstallment({
    ...debt,
    originalBalance: debt.originalBalance ?? (isInstallmentNative(debt) ? undefined : debt.balance),
    lastVerifiedDate: debt.lastVerifiedDate ?? now,
    balanceAsOfDate: debt.balanceAsOfDate ?? now,
  });
}

/**
 * Build a store instance.
 *
 * `opts.now` (3.5.0.1) injects the wall clock the drift baseline anchors to; it defaults to the real
 * one, so the app and every existing test are unaffected. The Phase-3.5 sandbox passes its scenario's
 * frozen base date so a scripted rollover stays deterministic and its drift read stays sane.
 *
 * `opts.bound` (3.5.0.2) is an invariant applied to `store` on EVERY mutation, before it lands. Undefined
 * for the real app (zero overhead, zero behavior change); the sandbox passes the cold-start honesty
 * bounds so no sequence of scripted actions can reach a matured Guardian a day-one user couldn't have.
 * Enforcing it here rather than at the call sites is what makes the bound hold "by construction" — an
 * action added later is covered without anyone remembering to clamp it. See `sandboxStore.ts`.
 *
 * `opts.refuse` [R4] is a VETO on `store` mutations, consulted on every action before the write lands.
 * Only the real singleton passes one (`realWriteGuard.refuseRealStoreWrite`), and it drops any write to
 * the user's plan made while a sandbox subtree is on screen. It sits HERE, in the same wrapper as
 * `bound`, for the same reason: an action added later is covered without anyone remembering — which is
 * precisely what the reporting backstop it replaces could not do, because it ran after the fact.
 */
export function createDebtStore(opts?: {
  now?: () => string;
  bound?: (store: DebtStore) => DebtStore;
  refuse?: (prev: DebtStore, next: DebtStore) => boolean;
}) {
  // Named `clock`, not `now` — several actions already bind a local `now` to the store's own
  // `paycheck.currentDate`, which is a different notion of "today" (see the drift.ts note).
  const clock = opts?.now ?? todayLocalISO;
  const bound = opts?.bound;
  const refuse = opts?.refuse;
  return createStore<DebtAppState>((rawSet, get) => {
    // Wrap the actions' `set` so the bound runs inside the SAME update (one render, no correction
    // flash). `api.setState` is deliberately left unwrapped — external seeding goes through
    // `seedSandbox`, which applies the same bound itself.
    //
    // [R4] `refuse` runs in the same wrapper, AFTER `bound` — the veto must judge the value that would
    // actually land, not the pre-clamp one. Returning the state unchanged is how a `set` is dropped:
    // zustand compares by reference, so no subscriber is notified and nothing re-renders.
    //
    // ⛔ S1.5.3 [B2] — AND IT IS NO LONGER CONDITIONAL ON `bound || refuse`. It used to fall through to
    // the raw setter when neither was supplied, which is every `createDebtStore()` in every test; a rule
    // enforced here has to hold for the store a test builds or it is not testable. Both extra branches
    // are no-ops when their input is absent.
    const set: typeof rawSet = ((partial: unknown, replace?: boolean) =>
      (rawSet as (p: unknown, r?: boolean) => void)((state: DebtAppState) => {
        const next = typeof partial === 'function' ? (partial as (s: DebtAppState) => unknown)(state) : partial;
        let patch = next as Partial<DebtAppState> | null;
        if (bound && patch && patch.store) patch = { ...patch, store: bound(patch.store) };
        if (refuse && patch && patch.store && refuse(state.store, patch.store)) return state;
        //
        // ⛔ S1.5.3 [B2] — A STORE WRITE THAT IS NOT THE INTENT'S OWN INVALIDATES THE UNDO SNAPSHOT.
        //
        // `intentRollback` snapshots the ENTIRE `DebtStore` and `undoIntentAction` restores the whole
        // thing. Nothing ever cleared it — `grep -n intentRollback` returned seven lines and they were
        // the complete set: two writers, two clearers, the type and the initial value. So after logging a
        // payment, everything the user did next was destroyed the moment they tapped an **Undo** whose
        // card promises only to undo the payment. Measured: a debt, a goal, a bill and a strategy change,
        // gone, with no confirm and no re-undo — and PERSISTED, because `persistence.ts` schedules a
        // write whenever `state.store` changes by reference.
        //
        // ⛔ **The remedy is deliberately not "clear it in every other action"** — that is a list, and a
        // list is what left `importStore` and `reset()` as two more doors onto the same snapshot (restore
        // a backup, return to Today, tap Undo, and the freshly-restored portfolio is replaced by the
        // pre-restore one). The rule is a CLASS: the two writers set `store` and `intentRollback` in the
        // SAME patch, so any patch that moves `store` WITHOUT mentioning `intentRollback` is by
        // definition somebody else's write, and the snapshot it would restore is already stale.
        //
        // ⚠️ Keyed on `patch.store !== state.store`, not on `patch.store` being present: an action that
        // returns the store unchanged by reference has not moved anything, and the persistence
        // subscription draws exactly the same line.
        if (patch && patch.store && patch.store !== state.store && state.intentRollback && !('intentRollback' in patch)) {
          patch = { ...patch, intentRollback: null };
        }
        return patch;
      }, replace)) as typeof rawSet;

    return {
    store: createDefaultStore(),
    isHydrated: false,
    isSaving: false,
    premiumIsLifetime: false,
    premiumResolved: false,
    intentRollback: null,
    storageError: null,

    async hydrate(adapter, hydrateOpts) {
      let raw: unknown | null;
      try {
        raw = await adapter.read();
      } catch (error) {
        // ⛔ The read THREW — do not fall through to the first-launch branch below. "Nothing is stored"
        // and "I could not look" are different facts, and only one of them makes it safe to seed and
        // write defaults. Treating them alike would overwrite a healthy blob with an empty store on a
        // transient failure (a locked keychain right after boot is the ordinary case). So: declare
        // hydration RESOLVED — nothing must sit on a blank screen forever — record why, and let the
        // layout offer a retry. `bootstrapPersistence` reads this and never installs autosave.
        reportError(error, { seam: 'persistence' });
        set({ isHydrated: true, storageError: 'read-failed' });
        return;
      }
      if (raw === null) {
        // ⛔ W1-6 — the v1.6 bridge ran and could not tell whether there is anything to migrate, so this
        // launch must NOT write. The bridge is gated on `read() === null`; one seed makes that false
        // forever and strands a real v1.6 portfolio that is still sitting on disk. Running the session on
        // unpersisted defaults is safe — the first real change installs autosave and writes then, which
        // is the user choosing to start fresh rather than us choosing it for them.
        if (hydrateOpts?.seed === false) {
          set({ isHydrated: true });
          return;
        }
        // First launch — keep defaults, seed the blob.
        //
        // ⛔ **Deliberately NOT `data-reset`, and the reason is a limit rather than a choice.** An MMKV
        // file that was lost or truncated to nothing also lands here, producing an outcome identical to
        // the quarantine branch below but with no preserved bytes — so this branch cannot tell a genuine
        // first launch from a total loss. Any marker durable enough to survive that (the Keychain) also
        // survives a deliberate delete-and-reinstall, and would then tell someone who erased the app
        // themselves that their data was lost. Saying nothing here is the lesser wrong of the two.
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
        // ⛔ `storageError` is set BEFORE the write, and it is the whole point of this branch. Without it
        // the user lands in onboarding having lost everything, with nothing on screen saying so — the
        // quiet version of the loudest event this app can have.
        set({ isHydrated: true, storageError: 'data-reset' });
        await adapter.write(get().store);
      }
    },

    async save(adapter) {
      set({ isSaving: true });
      try {
        await adapter.write(get().store);
        // Recovered: a later write landing means the earlier failure was transient, and leaving the
        // warning up after that would train the user to ignore it.
        if (get().storageError === 'save-failed') set({ storageError: null });
      } catch (error) {
        // A write that fails silently is the worst shape this can take — the change is on screen, so
        // the user believes it is kept, and finds out at next launch. Autosave calls this through a
        // `void` chain, so without this catch the rejection is unhandled and NOTHING is said.
        reportError(error, { seam: 'persistence' });
        set({ storageError: 'save-failed' });
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
      set((s) => ({ store: stampInputsFresh(recordDriftBaseline({ ...s.store, paycheck: { ...s.store.paycheck, ...updates } }, 'user', clock)) }));
    },
    setPayoffStrategy(strategy) {
      set((s) => ({ store: recordDriftBaseline({ ...s.store, payoffStrategy: strategy }, 'user', clock) }));
    },

    addDebt(debt) {
      set((s) => ({
        store: stampInputsFresh(recordDriftBaseline({
          ...s.store,
          debts: [...s.store.debts, prepareNewDebt(debt, s.store.paycheck.currentDate)],
        }, 'user', clock)),
      }));
    },
    updateDebt(id, updates) {
      set((s) => {
        const now = s.store.paycheck.currentDate;
        const existing = s.store.debts.find((d) => d.id === id);
        // Merge, then reconcile an installment-native BNPL: a scheduled/remaining edit re-derives
        // balance + minimum from scheduled × remaining (2.7.2). A no-op for every other debt.
        const merged = existing ? normalizeBnplInstallment({ ...existing, ...updates }) : null;
        // Editing the balance IS a verification — a real number typed directly OR produced by a BNPL
        // terms edit → re-anchor BOTH the as-of and user-confirmation dates (unless the caller set
        // them). Other edits (name, APR, due date) leave the dates alone.
        const balanceChanged = !!existing && !!merged && merged.balance !== existing.balance;
        const isBalanceEdit = updates.balance !== undefined || balanceChanged;
        // [P6.8.9.7.11.15 · D62] `originalBalance` is a HIGH-WATER MARK, and THIS is the path that made
        // it wrong: a user who corrects a typo — $500 entered, $5,000 meant — left the stamp behind and
        // the ring read 0% for the rest of that debt's life. The rule lives in `raiseOriginalBalance`,
        // never inline; six writers already disagreed about this field.
        const stamped = merged
          ? isBalanceEdit
            ? raiseOriginalBalance({ ...merged, lastVerifiedDate: updates.lastVerifiedDate ?? now, balanceAsOfDate: updates.balanceAsOfDate ?? now })
            : merged
          : null;
        const next = { ...s.store, debts: s.store.debts.map((d) => (d.id === id && stamped ? stamped : d)) };
        // Field-discriminated read-freshness stamp: a balance edit is a genuine input edit (2.4.D.3a);
        // other debt edits (name, APR, due date) are not.
        // P6.8.7e.1 [B2] — a balance typed straight to $0 is a payoff too. This is the path a FREE user
        // actually takes, and it is the one `selectProvisionalPayoffs` never covered.
        return { store: withPayoffCelebration(s.store, isBalanceEdit ? stampInputsFresh(next) : next) };
      });
    },
    removeDebt(id) {
      set((s) => ({ store: stampInputsFresh(recordDriftBaseline({ ...s.store, debts: s.store.debts.filter((d) => d.id !== id) }, 'user', clock)) }));
    },
    verifyDebtBalance(id, verifiedBalance, verifiedDate) {
      const balance = Math.max(0, Math.round(verifiedBalance * 100) / 100);
      set((s) => ({
        store: withPayoffCelebration(
          s.store,
          stampInputsFresh({
            ...s.store,
            debts: s.store.debts.map((d) =>
              d.id === id ? raiseOriginalBalance({ ...d, balance, lastVerifiedDate: verifiedDate, balanceAsOfDate: verifiedDate }) : d
            ),
          }),
        ),
      }));
    },
    verifyDebtBalances(entries, verifiedDate) {
      const next = new Map(entries.map((e) => [e.id, Math.max(0, Math.round(e.balance * 100) / 100)]));
      set((s) => ({
        store: withPayoffCelebration(
          s.store,
          stampInputsFresh({
            ...s.store,
            // ⚠️ [D62] This is the batch `verifyDebtBalances`, and it is the flow the app ASKS people to
            // use — so the high-water raise matters most here, not least.
            debts: s.store.debts.map((d) =>
              next.has(d.id)
                ? raiseOriginalBalance({ ...d, balance: next.get(d.id)!, lastVerifiedDate: verifiedDate, balanceAsOfDate: verifiedDate })
                : d
            ),
          }),
        ),
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
    convertExpenseToDebt(expenseId, debt) {
      // ⛔ S1.5.3 [B4] — `prepareNewDebt` and `recordDriftBaseline` are SHARED with `addDebt` now, not
      // reproduced. This action deletes a bill, so the only thing that may ever route a caller here is a
      // real conversion: `convertingExpenseId` now lives inside `money.tsx`'s `sheet` state, so it is born
      // and dies with the sheet instead of outliving it.
      set((s) => ({
        store: stampInputsFresh(recordDriftBaseline({
          ...s.store,
          debts: [...s.store.debts, prepareNewDebt(debt, s.store.paycheck.currentDate)],
          requiredExpenses: s.store.requiredExpenses.filter((e) => e.id !== expenseId),
        }, 'user', clock)),
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
          // Marking paid also clears a reported autopay failure, exactly as the payday checkpoint's
          // `applyRequiredReconciliation` does — an item the user is now confirming paid is no longer a
          // reported failure. Nothing else clears it (the rollover doesn't), so leaving it set kept the
          // row "Overdue" while struck through and permanently blocked `isAutopayPresumedPaid`.
          // Un-marking does NOT re-flag: reporting a failed autopay is the checkpoint's job, not an undo's.
          requiredExpenses: s.store.requiredExpenses.map((e) =>
            e.id === id ? { ...e, isPaidThisCycle: paid, ...(paid ? { autopayFailedThisCycle: false } : {}) } : e,
          ),
        },
      }));
    },
    deferExpense(id) {
      set((s) => {
        // Move the due date to the next payday → it belongs to next cycle (a bill due ON the next
        // payday is not "due before" it, so it drops out of this cycle's obligations). Honest defer.
        const nextPayday = s.store.paycheck.nextPaycheckDate;
        return {
          store: stampInputsFresh({
            ...s.store,
            requiredExpenses: s.store.requiredExpenses.map((e) =>
              e.id === id ? { ...e, dueDate: nextPayday, isPaidThisCycle: false } : e,
            ),
          }),
        };
      });
    },
    setDeferability(id, deferability) {
      // MF.1: a pure classification toggle — NO stampInputsFresh (a deferability change must not make a
      // stale read look fresh and silence the §2.0 staleness hedge).
      set((s) => ({
        store: {
          ...s.store,
          requiredExpenses: s.store.requiredExpenses.map((e) => (e.id === id ? { ...e, deferability } : e)),
        },
      }));
    },
    markDebtMinimumPaid(id, paid) {
      set((s) => ({
        store: {
          ...s.store,
          // Clears a reported autopay failure on mark-paid — see `markExpensePaid` for why.
          // ⚠️ Deliberately does NOT set `isPaidThisCycle`: [D2] reserves that for paid IN FULL, and a
          // covered minimum is not that. Core's bulk paths still set both (pre-[D2] semantics, inert —
          // no debt reader keys on `isPaidThisCycle` alone) → the Phase-6 financial-correctness gate.
          debts: s.store.debts.map((d) =>
            d.id === id ? { ...d, minimumPaidThisCycle: paid, ...(paid ? { autopayFailedThisCycle: false } : {}) } : d,
          ),
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
      set((s) => ({ store: recordDriftBaseline(applyRollover(s.store), 'user', clock) }));
    },
    applyPaydayLandedIntent() {
      // 3.5.3.5 — same roll as rolloverPayCycle, but stash the pre-roll store first so the Today card can
      // offer a one-tap Undo (an accidental Live-Activity tap is fully reversible).
      set((s) => ({ intentRollback: { store: s.store, kind: 'payday-landed' }, store: recordDriftBaseline(applyRollover(s.store), 'user', clock) }));
    },
    logManualPayment(debtId, amount) {
      // 3.5.5 — reduce the debt's balance by `amount` + re-anchor its verified date to today (the same
      // deliberate-balance-move transform as verifyDebtBalance), snapshotting first for Undo.
      set((s) => {
        const debt = s.store.debts.find((d) => d.id === debtId);
        if (!debt || !(amount > 0)) return {};
        const date = s.store.paycheck.currentDate;
        const balance = Math.max(0, Math.round((debt.balance - amount) * 100) / 100);
        return {
          intentRollback: { store: s.store, kind: 'log-payment' },
          // P6.8.7e.1 [B2] — the final payment clearing a debt is the most literal payoff there is.
          // ⚠️ `intentRollback` snapshots the store BEFORE this, so an Undo takes the celebration back
          // with it — correct, since undoing the payment un-does the payoff it was celebrating.
          store: withPayoffCelebration(
            s.store,
            stampInputsFresh({
              ...s.store,
              debts: s.store.debts.map((d) =>
                d.id === debtId ? { ...d, balance, lastVerifiedDate: date, balanceAsOfDate: date } : d,
              ),
            }),
          ),
        };
      });
    },
    undoIntentAction() {
      set((s) => (s.intentRollback ? { store: s.intentRollback.store, intentRollback: null } : {}));
    },
    dismissIntentRollback() {
      set({ intentRollback: null });
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
    setPremiumIsLifetime(isLifetime) {
      // 3.7.A5 — resolved is set HERE rather than by a second action, so the two can never disagree:
      // reaching this line IS RevenueCat having answered.
      set({ premiumIsLifetime: isLifetime, premiumResolved: true });
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
          stampOnboardedAt(recordDriftBaseline({ ...s.store, prefs: { ...s.store.prefs, onboardingComplete: true } }, 'user', clock)),
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
            clock,
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
    acknowledgeMilestone() {
      // 3.3.2: the user saw the portfolio milestone-cross beat — clear it (one-time moment).
      set((s) => ({ store: { ...s.store, pendingMilestone: null } }));
    },
    acknowledgePayoff() {
      // P6.8.7e.1 [B2]: the user saw the paid-off beat or the debt-free finale — clear it. ⚠️ It is
      // PERSISTED rather than component state, so a payoff confirmed seconds before the app is
      // backgrounded still gets its moment on the next launch instead of being lost with the screen.
      set((s) => ({ store: { ...s.store, pendingPayoff: null } }));
    },
    acknowledgeDataRepairs() {
      // P6.8.7c.2 (B4/M3-2): the user has now SEEN which amounts could not be read. ⛔ The only thing that
      // acknowledges this list — a save must not, because a save is what erases `dataRepairs` and that
      // erasure is why the repairs were invisible in the first place.
      //
      // ⛔ **MARKS, NEVER EMPTIES.** [P6.8.9.7.11.10 · A-J2-1] Emptying it took the card away *and* the
      // two guards that read it — `money.tsx`'s `unreadDebts` and `unreadGoals` — while the repaired `0`s
      // stayed forever. One tap therefore restored **"Every balance cleared"** over debts still owed. The
      // ack is about the CARD; the data is still unread, and everything asking "is this number
      // trustworthy" must keep getting the same answer it got before the tap.
      set((s) => ({
        store: { ...s.store, pendingDataRepairs: s.store.pendingDataRepairs.map((r) => ({ ...r, acknowledged: true })) },
      }));
    },
    applyTightTopUp(source, goalId, amount) {
      // §2.10 (2.4.11.2): the user moved money from savings to hold this cycle's line — draw it down from
      // the goal + record it, cycle-keyed. The plan refills the goal next cycle via the waterfall, so this
      // self-corrects.
      //
      // ⛔ S1.5.3 [B3] — ONE ENTRY PER SOURCE, and the entry records what ACTUALLY LEFT THE GOAL.
      // The old shape accumulated a single `amount` and kept only the most recent `goalId`, so the second
      // of two flows overwrote the first's source and one Undo handed both draws back to the wrong goal.
      // It also recorded the full requested `amount` while the goal itself clamped at 0, which credited
      // the cushion with money that never moved.
      set((s) => {
        if (!(amount > 0)) return {};
        const forCycle = s.store.paycheck.nextPaycheckDate;
        const goal = s.store.goals.find((g) => g.id === goalId);
        // ⚠️ A goal that does not exist supplies nothing. The old code recorded the amount anyway.
        const drawn = goal ? Math.round(Math.min(amount, Math.max(0, goal.currentAmount)) * 100) / 100 : 0;
        if (drawn <= 0) return {};
        const prior = topUpEntries(s.store).filter((e) => e.source !== source);
        const mine = topUpEntries(s.store).find((e) => e.source === source);
        // Re-tapping the same source accumulates within that source, and stays on ITS goal.
        const entries: CycleTopUpEntry[] = [
          ...prior,
          mine && mine.goalId === goalId
            ? { ...mine, amount: Math.round((mine.amount + drawn) * 100) / 100 }
            : { source, goalId, amount: drawn },
          // A same-source re-tap against a DIFFERENT goal keeps the earlier draw as its own entry, so its
          // money still knows where to go home to.
          ...(mine && mine.goalId !== goalId ? [mine] : []),
        ];
        return {
          store: {
            ...s.store,
            goals: s.store.goals.map((g) =>
              g.id === goalId ? { ...g, currentAmount: Math.round((g.currentAmount - drawn) * 100) / 100 } : g,
            ),
            cycleTopUp: buildCycleTopUp(forCycle, entries),
          },
        };
      });
    },
    undoTightTopUp(source, draw) {
      // ⛔ S1.5.3 [B3] — REMOVE THIS SOURCE'S OWN ENTRY and return its money to the goal it came from.
      //
      // Both undos used to be spelled `applyTightTopUp(goalId, -amount)`, reading the goal and the amount
      // from whatever the CALLER happened to be holding — the store for one, React state for the other.
      // That is why a second undo could invent $50: the affordability card's `applied.cover` survived the
      // Guardian having already reversed the draw, and a negative "apply" subtracted from a shared
      // accumulator rather than clearing anything. Reading the entry from the store makes a second undo a
      // no-op by construction.
      //
      // ⛔ S1.9.1 [D2-2] — AND ONE ENTRY IS NOT ONE DRAW. [B3] gave each SOURCE its own entry and, in the
      // same move, made a source's second cover indistinguishable from its first: the entry accumulates
      // (`applyTightTopUp` above, deliberately), so removing it whole reverses draws the caller never
      // offered to reverse. The affordability card shows one purchase's cover and the store handed back
      // the cycle's — $50 then $30 returned **$80**, silently un-covering the earlier purchase. The
      // Guardian card reads its number FROM this entry (`selectAppliedTopUp`), so whole-entry is exactly
      // right there and stays the default; a caller that shows ONE draw passes that draw and gets it back.
      //
      // ⚠️ The direction: the amount returned is `min(asked, held)`, never the caller's number alone —
      // component state can outlive the entry, and [B3]'s no-op-on-repeat guarantee is what that protects.
      set((s) => {
        const forCycle = s.store.paycheck.nextPaycheckDate;
        const entries = topUpEntries(s.store);
        // A same-source re-tap against a DIFFERENT goal is its own entry, so a partial undo has to match
        // the goal too — otherwise it returns this draw's dollars to the earlier draw's goal.
        const mine = draw
          ? entries.find((e) => e.source === source && e.goalId === draw.goalId)
          : entries.find((e) => e.source === source);
        if (!mine) return {};
        const returned = draw ? Math.round(Math.min(Math.max(0, draw.amount), mine.amount) * 100) / 100 : mine.amount;
        if (!(returned > 0)) return {};
        const remaining = Math.round((mine.amount - returned) * 100) / 100;
        const rest = entries.flatMap((e) => (e !== mine ? [e] : remaining > 0 ? [{ ...e, amount: remaining }] : []));
        return {
          store: {
            ...s.store,
            goals: s.store.goals.map((g) =>
              g.id === mine.goalId ? { ...g, currentAmount: Math.round((g.currentAmount + returned) * 100) / 100 } : g,
            ),
            cycleTopUp: buildCycleTopUp(forCycle, rest),
          },
        };
      });
    },

    setExpenseReserveContribution(amount) {
      // 3.8 — the user chose to hold `amount` of THIS paycheck for upcoming recurring expenses. SET, not
      // add (see the interface note). Cycle-keyed to `nextPaycheckDate` exactly like `cycleTopUp`, so a
      // contribution left over from a cycle that already rolled can never re-hold cash in this one.
      set((s) => {
        const forCycle = s.store.paycheck.nextPaycheckDate;
        const next = Math.max(0, Math.round(amount * 100) / 100);
        const prior = s.store.expenseReserve;
        return {
          store: {
            ...s.store,
            expenseReserve: {
              // The pot itself is untouched here: contributing is a decision about THIS paycheck, and the
              // money only joins the balance when the cycle actually closes (`applyRollover`). Crediting
              // the balance now would let the same dollars be both held this cycle and spendable as pot.
              balance: Math.max(0, prior?.balance ?? 0),
              ...(next > 0 ? { contribution: { forCycle, amount: next } } : {}),
            },
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
      /**
       * ⛔ **A SUCCESSFUL IMPORT UN-DECLARES THE RESET IT DISPROVES.** [P6.8.9.7.11.12 · B-J2-1]
       * `DataResetScreen` IS the whole tree while this reads `data-reset` — `_layout` returns it instead
       * of the navigator — so restoring a backup file from that screen closed the sheet onto the same
       * full-screen *"We couldn't open your saved plan"* panel, with no sign the restore worked and the
       * only way onward labelled **"Start fresh"**. The most likely reading was that the import failed,
       * and the button offered meant the opposite of what they had just done.
       *
       * ⚠️ **Here rather than at the call site**, so no future import door can forget it — the same shape
       * as a successful save clearing `save-failed` in `persist`. The iCloud button on that screen already
       * called `onStartFresh()` afterwards; the file button did not, and nothing made them agree.
       *
       * ⛔ **`read-failed` is deliberately NOT cleared.** It says storage cannot be read, `bootstrapPersistence`
       * installs no autosave on that path, and an import into memory does not make the disk readable —
       * clearing it would hide the fact that nothing the user does is being written down.
       */
      if (get().storageError === 'data-reset') set({ storageError: null });
    },
    };
  });
}

export type DebtStoreInstance = ReturnType<typeof createDebtStore>;
