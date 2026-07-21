import { buildPayoffTrajectory, type TrajectoryPoint } from '@core/debt/buildPayoffTrajectory';
import { computeDrift, type DriftResult } from '@core/debt/computeDrift';
import { computeInterestSaved, type InterestSaved } from '@core/debt/computeInterestSaved';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
import { buildMultiCycleTimeline, type TimelineCycle } from '@core/timeline/buildMultiCycleTimeline';
import type { TimelineItem } from '@core/timeline/buildTimelineItems';

import { todayLocalISO } from '@/data/defaults';
import type { Debt, DebtStore, PayoffStrategy } from '@/data/models';

import { selectDebtFreeDate, selectExtraToDebt } from './planSelectors';
import { selectAllocation } from './selectors';

export type { TrajectoryPoint, InterestSaved, DriftResult, TimelineCycle, TimelineItem };

/**
 * The near-term cash-cushion forecast — the next few pay cycles' ending balance + a stable/tight/
 * pressure health flag. Distinct from the payoff trajectory (this = "will I be tight next month?",
 * that = "when am I free?"). Built on the tested `@core/timeline` engine. `[]` if no plan yet.
 */
export function selectCashTimeline(store: DebtStore, maxCycles = 5): TimelineCycle[] {
  const allocation = selectAllocation(store);
  if (!allocation) return [];
  return buildMultiCycleTimeline({
    result: allocation,
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
    maxCycles,
  });
}

/**
 * Drift of the live debt balance against the frozen baseline (the Premium carrot on Payoff).
 * Returns null → the "building your drift history…" empty state. Call in render off the stable store
 * ref (it builds a fresh object each call — never inside a zustand selector, per the loop lesson).
 */
export function selectDrift(store: DebtStore): DriftResult | null {
  const currentBalance = store.debts.filter((d) => d.balance > 0).reduce((s, d) => s + d.balance, 0);
  return computeDrift(store.driftBaseline, { currentDate: todayLocalISO(), currentBalance });
}

export interface PayoffView {
  hasDebts: boolean;
  debtFreeDate: string | null;
  interestSaved: InterestSaved;
  monthlyExtra: number;
  snowball: TrajectoryPoint[];
  avalanche: TrajectoryPoint[];
  /** The minimum-payments-only curve — the "vs. minimums" ghost on the trajectory chart. */
  minimums: TrajectoryPoint[];
  order: Debt[];
  focus: Debt | null;
}

/** Rank live debts by the chosen strategy (snowball = smallest balance · avalanche = highest APR). */
function rankDebts(debts: Debt[], strategy: PayoffStrategy): Debt[] {
  return [...debts].sort((a, b) => (strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr));
}

/** Everything the (free) Payoff tab renders, derived from the store + the shared `@core` engine. */
export function selectPayoffView(store: DebtStore): PayoffView {
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  const allocation = selectAllocation(store);
  const monthlyExtra = allocation ? selectExtraToDebt(allocation) * payCyclesPerMonth(store.paycheck.payCycle) : 0;
  const startDate = store.paycheck.currentDate;

  const interestSaved: InterestSaved =
    liveDebts.length > 0
      ? computeInterestSaved({ debts: store.debts, monthlyExtraPayment: monthlyExtra, strategy: store.payoffStrategy, startDate })
      : { kind: 'none' };

  const snowball = liveDebts.length > 0 ? buildPayoffTrajectory({ debts: store.debts, monthlyExtraPayment: monthlyExtra, strategy: 'snowball' }) : [];
  const avalanche = liveDebts.length > 0 ? buildPayoffTrajectory({ debts: store.debts, monthlyExtraPayment: monthlyExtra, strategy: 'avalanche' }) : [];
  // The minimums-only baseline (no extra) — pays off later (or, when interest outruns minimums,
  // never), so it trails above/beyond the active plan: the visible "vs. minimums" gap.
  const minimums = liveDebts.length > 0 ? buildPayoffTrajectory({ debts: store.debts, monthlyExtraPayment: 0, strategy: store.payoffStrategy }) : [];

  const order = rankDebts(liveDebts, store.payoffStrategy);
  return {
    hasDebts: liveDebts.length > 0,
    debtFreeDate: selectDebtFreeDate(store, allocation),
    interestSaved,
    monthlyExtra,
    snowball,
    avalanche,
    minimums,
    order,
    focus: order[0] ?? null,
  };
}
