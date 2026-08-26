import { allocatePaycheck } from '@core/engine/allocatePaycheck';
import { buildMultiCycleTimeline, type TimelineCycle } from '@core/timeline/buildMultiCycleTimeline';

import type { DebtStore } from '@/data/models';

import { projectedIncome } from './projectedIncome';
import { nettedTopUp } from './topUpSelectors';

/**
 * The shared multi-cycle forecast builder — the single place that maps a store + a cycle-0 allocation
 * into the projected timeline (state-threaded, valley-on-lean). Extracted so both `selectCashTimeline`
 * (display) and `selectPrefundedReserve` (the §2.5 water-fill input) build it identically, and so
 * `paycheckBuffer` is passed in (keeping this module free of a `selectors` import → no cycle).
 */
export function buildForecastCycles(
  store: DebtStore,
  result: ReturnType<typeof allocatePaycheck>,
  paycheckBuffer: number,
  maxCycles: number,
): TimelineCycle[] {
  return buildMultiCycleTimeline({
    // ⛔ S1.9.6 [D2-1] — asked of the ONE owner, so this producer's band and the card's cannot come apart.
    appliedTopUpSurplus: nettedTopUp(store, result.shortfall).surplus,
    result,
    requiredExpenses: store.requiredExpenses,
    debts: store.debts,
    goals: store.goals,
    livingExpenses: store.livingExpenses,
    completedRecommendedActions: store.completedRecommendedActions,
    currentDate: store.paycheck.currentDate,
    nextPaycheckDate: store.paycheck.nextPaycheckDate,
    payCycleConfig: {
      payCycle: store.paycheck.payCycle,
      semiMonthlyFirstDay: Number(store.paycheck.semiMonthlyFirstDay) || undefined,
      semiMonthlySecondDay: Number(store.paycheck.semiMonthlySecondDay) || undefined,
      monthlyPayDay: Number(store.paycheck.monthlyPayDay) || undefined,
    },
    strategy: store.payoffStrategy,
    paycheckBuffer,
    maxCycles,
    projectedPaycheckAmount: projectedIncome(store.paycheck),
  });
}
