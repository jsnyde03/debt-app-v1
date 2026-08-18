import { applyPaydayCapture } from '@core/debt/applyPaydayCapture';
import { applyRolloverPayment } from '@core/debt/applyRolloverPayment';
import { applyRequiredReconciliation, type RequiredReconciliation } from '@core/debt/bulkMarkRequired';
import { computeMilestones } from '@core/debt/computeMilestones';
import { getCompletedSnowballAmount } from '@core/debt/getDebtsWithDisplayBalances';
import { reconcileAutopayForRollover } from '@core/debt/reconcileAutopay';
import { buildCycleSnapshot } from '@core/history/buildCycleSnapshot';
import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';
import { rolloverDebts, rolloverRequiredExpenses } from '@core/recurrence/rolloverPayCycle';

import type { CompletedRecommendedAction, DebtStore, SurpriseOutflow } from '@/data/models';

import { deriveConfidenceContext } from './guardianPredictionCore';
import { reconcileClosingCycle, stampCyclePrediction } from './guardianPrediction';
import { selectHeldReserve } from './planSelectors';
import { selectAllocation, type Allocation } from './selectors';
import { incrementGenuineCycle, recordCycleIncome, recordSurpriseOutflow } from './substrateProducers';

/** Optional actuals the user reports at the payday check-in (2.4.D.3). Absent → fixed income records
 *  deterministically (actual = planned); variable income with no actual is skipped. */
export type PaydayActuals = {
  actualIncome?: number;
  missed?: boolean;
  surpriseOutflow?: SurpriseOutflow;
};

/**
 * Money-critical payday state transitions, ported faithfully from the Capacitor
 * `handlePaydayCapture` / `handleRolloverPayCycle`. Kept as pure `DebtStore → DebtStore`
 * functions (no RN imports) so they're node-unit-testable against the shared `@core` engine.
 */

/**
 * Apply a payday capture: move the confirmed extras into goals + completed-recommended, and mark the
 * required bills/minimums per the reconciliation (the happy path passes all-paid decisions).
 */
export function applyCapture(
  store: DebtStore,
  items: CompletedRecommendedAction[],
  requiredDecisions: RequiredReconciliation,
  actuals?: PaydayActuals,
): DebtStore {
  const { nextGoals, nextCompleted } = applyPaydayCapture(items, store.goals, store.completedRecommendedActions);
  const { expenses, debts } = applyRequiredReconciliation(store.requiredExpenses, store.debts, requiredDecisions);
  let next: DebtStore = {
    ...store,
    goals: nextGoals,
    completedRecommendedActions: nextCompleted,
    requiredExpenses: expenses,
    debts,
  };
  // 2.4.D.3: record the cycle's actuals at the check-in (the touchpoint where the user reports what
  // happened). cycleEndDate = the current payday (this cycle's close). Fixed income records
  // deterministically even with no `actuals`; a surprise outflow / missed arrival records when reported.
  const cycleEndDate = store.paycheck.nextPaycheckDate;
  next = recordCycleIncome(next, cycleEndDate, { actualIncome: actuals?.actualIncome, missed: actuals?.missed });
  if (actuals?.surpriseOutflow) next = recordSurpriseOutflow(next, actuals.surpriseOutflow);
  return next;
}

/**
 * Roll the pay cycle forward: reconcile untouched autopay → snapshot the closing cycle → apply this
 * cycle's payments → recompute milestone high-water marks → roll debts + expenses to the next cycle →
 * advance the payday. (Notifications / app-review / the celebration overlay are B.9.) The
 * `lastHandledPaydayDate` self-clears because the payday date advances past it.
 */
export function applyRollover(store: DebtStore): DebtStore {
  const { nextPaycheckDate, payCycle } = store.paycheck;

  // Autopay left untouched at the checkpoint is presumed to have run by payday → reconcile to
  // explicit paid flags BEFORE the rollover math, so it pays down + advances (never rots forward).
  const { expenses: reconciledExpenses, debts: reconciledDebts } = reconcileAutopayForRollover(
    store.requiredExpenses,
    store.debts,
    nextPaycheckDate,
  );

  // On-plan = no AFFORDABLE required action left unpaid this cycle (default on-plan if unavailable).
  const allocation = selectAllocation(store);
  const allRequiredMet = (allocation?.affordableUnpaidRequiredCount ?? 0) === 0;

  // Record the closing cycle BEFORE mutating (reflects where the user actually was), then fold the
  // in-flight prediction + its reconciled outcome into it (2.4.D.4 two-touchpoint reconcile).
  const snapshot = reconcileClosingCycle(
    store,
    buildCycleSnapshot({
      cycleEndDate: nextPaycheckDate,
      debts: reconciledDebts,
      completedRecommendedActions: store.completedRecommendedActions,
      payoffStrategy: store.payoffStrategy,
      allRequiredMet,
    }),
  );

  // Apply this cycle's payments once (so we persist new balances AND detect milestone crossings). Pass
  // the pay-cycle window so a cross-cadence BNPL pays down by the same in-window installment count the
  // allocator reserved (after-scan AS.2) — cash-out and paydown stay in lockstep.
  const debtsAfter = reconciledDebts.map((debt) =>
    applyRolloverPayment(
      debt,
      getCompletedSnowballAmount(debt.id, store.completedRecommendedActions),
      payCycle,
      store.paycheck.currentDate,
      nextPaycheckDate,
    ),
  );

  const milestoneResult = computeMilestones({
    debts: reconciledDebts.map((before, i) => ({
      id: before.id,
      name: before.name,
      originalBalance: before.originalBalance,
      previousBalance: before.balance,
      currentBalance: debtsAfter[i].balance,
    })),
    maxProgressByDebt: store.milestoneMaxProgress,
  });

  // 3.3.2 — the PORTFOLIO milestone (25/50/75% of total debt paid → the mid-journey beat). Reuse the same
  // crossing+dedup engine on a synthetic aggregate; 100% is debt-free → owned by the payoff finale, excluded.
  const totalOriginal = reconciledDebts.reduce((sum, d) => sum + (d.originalBalance ?? d.balance), 0);
  const totalBefore = reconciledDebts.reduce((sum, d) => sum + d.balance, 0);
  const totalAfter = debtsAfter.reduce((sum, d) => sum + d.balance, 0);
  const portfolioResult = computeMilestones({
    debts: [{ id: '__portfolio__', name: 'Portfolio', originalBalance: totalOriginal, previousBalance: totalBefore, currentBalance: totalAfter }],
    maxProgressByDebt: { __portfolio__: store.portfolioMaxProgress ?? 0 },
  });
  const crossedPortfolio = portfolioResult.milestones.find((m) => m.threshold < 100);

  // Balances are now current as-of this rollover → advance the projection anchor (`balanceAsOfDate`)
  // so the premium estimate doesn't re-apply this cycle's paydown (the double-count). `lastVerifiedDate`
  // (last USER confirmation) is deliberately NOT touched — a rollover is a computed estimate, so the
  // debt can still go "verify soon" until the user actually confirms it against a statement.
  const rolledDebts = rolloverDebts(debtsAfter, nextPaycheckDate).map((d) => ({
    ...d,
    balanceAsOfDate: nextPaycheckDate,
  }));
  const rolledExpenses = rolloverRequiredExpenses(reconciledExpenses, nextPaycheckDate);

  const followingPaycheckDate = nextPaycheckDate
    ? getNextPaycheckDate({
        payCycle,
        currentDate: nextPaycheckDate,
        semiMonthlyFirstDay: Number(store.paycheck.semiMonthlyFirstDay),
        semiMonthlySecondDay: Number(store.paycheck.semiMonthlySecondDay),
        monthlyPayDay: Number(store.paycheck.monthlyPayDay),
      })
    : nextPaycheckDate;

  // 2.4.D.3b: a genuine lived cycle just closed → bump the bill-completeness counter (real rollovers
  // only; seeded/imported cycles never reach here, so they can't inflate it). 2.4.D.4: the folded
  // prediction is now on the closing snapshot, so clear the in-flight carrier and re-stamp for the NEW
  // cycle off the rolled store (the second touchpoint's "start" stamp for cycle N+1).
  const rolled: DebtStore = {
    ...store,
    requiredExpenses: rolledExpenses,
    debts: rolledDebts,
    completedRecommendedActions: [],
    cycleHistory: [...store.cycleHistory, snapshot],
    milestoneMaxProgress: milestoneResult.nextMaxProgressByDebt,
    portfolioMaxProgress: portfolioResult.nextMaxProgressByDebt['__portfolio__'] ?? store.portfolioMaxProgress ?? 0,
    pendingMilestone: crossedPortfolio
      ? { threshold: crossedPortfolio.threshold as 25 | 50 | 75, progressPercent: Math.round(crossedPortfolio.progressPercent) }
      : store.pendingMilestone,
    windfall: 0, // one-time extra income was for the closing cycle only
    // 3.8 — the pot moves HERE and only here: the closing cycle's draw comes out, the set-aside the user
    // actually held goes in. ⚠️ Both numbers come from `allocation`, the same object the user was shown
    // all cycle — never re-derived. Re-deriving is how the plan and the persisted balance drift apart.
    expenseReserve: nextExpenseReserve(store, allocation),
    currentCyclePrediction: null,
    // 2.4.6.1.2: the closing cycle's band becomes the NEW cycle's prior, for cross-cycle hysteresis
    // (so the state doesn't flap on a value hovering at a boundary). Persisted + reloaded across rollover.
    priorGuardianBand: store.currentCyclePrediction?.predictedState ?? store.priorGuardianBand,
    paycheck: { ...store.paycheck, currentDate: nextPaycheckDate, nextPaycheckDate: followingPaycheckDate },
  };
  // §2.0.c settling-in reserve release (2.4.11.4b): the reserve just freed if it was held as of the last
  // rollover but isn't after this one (the discovery-cycle gate crossed, or the lean got confirmed at the
  // preceding capture). Fire a one-time insurance ack, branched on whether a surprise drew on it while held.
  const incremented = incrementGenuineCycle(rolled);
  const wasHeld = store.priorReserveHeld ?? deriveConfidenceContext(store).provisional;
  const nowHeld = deriveConfidenceContext(incremented).provisional;
  const released = wasHeld && !nowHeld && !incremented.pendingReserveRelease;
  const withReserve: DebtStore = {
    ...incremented,
    priorReserveHeld: nowHeld,
    ...(released ? { pendingReserveRelease: computeReserveRelease(store) } : {}),
  };
  return stampCyclePrediction(withReserve);
}

/**
 * 3.8 — roll the expense reserve across a cycle boundary: `balance − drawn + held`.
 *
 * ⛔ This is the whole conservation invariant in one line, and both halves are load-bearing. Honour only
 * the hold and the pot grows without ever paying a bill; honour only the draw and it empties without ever
 * being filled. `drawn` is what the cycle's obligations consumed; `held` is what the paycheck ACTUALLY set
 * aside after the engine's clamp — not what was requested, or the pot would be credited money that never
 * existed.
 *
 * `contribution` is dropped on the way out: it has been folded into `balance`, and it is cycle-keyed
 * anyway, so leaving it would only be a stale record of a cycle that has closed.
 *
 * A null allocation (no paycheck set) leaves the reserve untouched — there was no cycle to draw from.
 */
function nextExpenseReserve(store: DebtStore, allocation: Allocation | null): DebtStore['expenseReserve'] {
  const round = (n: number) => Math.round(n * 100) / 100;
  const prior = store.expenseReserve;
  if (!allocation) return prior;
  const balance = round(Math.max(0, (prior?.balance ?? 0) - allocation.expenseReserveDrawn + allocation.expenseReserveHeld));
  // Nothing held, nothing carried, nothing drawn → stay absent rather than persisting an empty record, so
  // a user who never touches the feature keeps a store indistinguishable from a pre-3.8 one.
  if (balance === 0 && !prior) return undefined;
  return { balance };
}

/** The settling-in reserve's release ack (2.4.11.4b): `tapped` = a surprise outflow drew on the reserve
 *  during the hold window; `covered` = the sum of those surprises, capped at the reserve that was held.
 *  MF.5 (audit #6): the old version summed the ENTIRE surprise log uncapped and set `tapped` on any
 *  surprise — so it could claim the safety net "covered a $300 surprise" over a $50 held reserve, and
 *  credit it for surprises the ordinary cushion absorbed. Now: scope to surprises logged since onboarding,
 *  and credit the reserve only up to what it actually held (0 held → nothing "covered" → the neutral branch). */
function computeReserveRelease(store: DebtStore): { tapped: boolean; covered: number } {
  const round = (n: number) => Math.round(n * 100) / 100;
  const alloc = selectAllocation(store);
  const heldReserve = alloc ? round(selectHeldReserve(alloc)) : 0;
  const since = store.onboardedAt ?? '';
  const surpriseSum = round(
    (store.surpriseOutflowLog ?? [])
      .filter((o) => o.cycleEndDate >= since)
      .reduce((s, o) => s + Math.max(0, o.amount), 0),
  );
  const covered = round(Math.min(surpriseSum, heldReserve));
  return { tapped: covered > 0, covered };
}
