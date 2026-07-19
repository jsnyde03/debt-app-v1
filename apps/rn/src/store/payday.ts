import { applyPaydayCapture } from '@core/debt/applyPaydayCapture';
import { applyRolloverPayment } from '@core/debt/applyRolloverPayment';
import { applyRequiredReconciliation, type RequiredReconciliation } from '@core/debt/bulkMarkRequired';
import { computeMilestones } from '@core/debt/computeMilestones';
import { getCompletedSnowballAmount } from '@core/debt/getDebtsWithDisplayBalances';
import { reconcileAutopayForRollover } from '@core/debt/reconcileAutopay';
import { buildCycleSnapshot } from '@core/history/buildCycleSnapshot';
import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';
import { rolloverDebts, rolloverRequiredExpenses } from '@core/recurrence/rolloverPayCycle';

import type { CompletedRecommendedAction, DebtStore } from '@/data/models';

import { selectAllocation } from './selectors';

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
): DebtStore {
  const { nextGoals, nextCompleted } = applyPaydayCapture(items, store.goals, store.completedRecommendedActions);
  const { expenses, debts } = applyRequiredReconciliation(store.requiredExpenses, store.debts, requiredDecisions);
  return {
    ...store,
    goals: nextGoals,
    completedRecommendedActions: nextCompleted,
    requiredExpenses: expenses,
    debts,
  };
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

  const rolledDebts = rolloverDebts(debtsAfter, nextPaycheckDate);
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

  return {
    ...store,
    requiredExpenses: rolledExpenses,
    debts: rolledDebts,
    completedRecommendedActions: [],
    cycleHistory: [...store.cycleHistory, snapshot],
    milestoneMaxProgress: milestoneResult.nextMaxProgressByDebt,
    paycheck: { ...store.paycheck, currentDate: nextPaycheckDate, nextPaycheckDate: followingPaycheckDate },
  };
}
