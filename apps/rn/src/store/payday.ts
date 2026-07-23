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

import { selectAllocation } from './selectors';
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

  // Record the closing cycle BEFORE mutating (reflects where the user actually was).
  const snapshot = buildCycleSnapshot({
    cycleEndDate: nextPaycheckDate,
    debts: reconciledDebts,
    completedRecommendedActions: store.completedRecommendedActions,
    payoffStrategy: store.payoffStrategy,
    allRequiredMet,
  });

  // Apply this cycle's payments once (so we persist new balances AND detect milestone crossings).
  const debtsAfter = reconciledDebts.map((debt) =>
    applyRolloverPayment(debt, getCompletedSnowballAmount(debt.id, store.completedRecommendedActions), payCycle),
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
  // only; seeded/imported cycles never reach here, so they can't inflate it).
  const rolled: DebtStore = {
    ...store,
    requiredExpenses: rolledExpenses,
    debts: rolledDebts,
    completedRecommendedActions: [],
    cycleHistory: [...store.cycleHistory, snapshot],
    milestoneMaxProgress: milestoneResult.nextMaxProgressByDebt,
    windfall: 0, // one-time extra income was for the closing cycle only
    paycheck: { ...store.paycheck, currentDate: nextPaycheckDate, nextPaycheckDate: followingPaycheckDate },
  };
  return incrementGenuineCycle(rolled);
}
