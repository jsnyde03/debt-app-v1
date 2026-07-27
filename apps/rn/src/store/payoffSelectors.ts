import { buildPayoffTrajectory, type TrajectoryPoint } from '@core/debt/buildPayoffTrajectory';
import type { DriftResult } from '@core/debt/computeDrift';
import { computeInterestSaved, type InterestSaved } from '@core/debt/computeInterestSaved';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
import type { TimelineCycle } from '@core/timeline/buildMultiCycleTimeline';
import type { TimelineItem } from '@core/timeline/buildTimelineItems';

import type { Debt, DebtStore, PayoffStrategy } from '@/data/models';

import { selectDebtFreeDate, selectExtraToDebt } from './planSelectors';
import { buildForecastCycles } from './forecastCycles';
import { effectivePaycheckBuffer, selectAllocation, selectSteadyStateAllocation } from './selectors';

export type { TrajectoryPoint, InterestSaved, DriftResult, TimelineCycle, TimelineItem };

/**
 * The near-term cash-cushion forecast — the next few pay cycles' ending balance + a stable/tight/
 * pressure health flag. Distinct from the payoff trajectory (this = "will I be tight next month?",
 * that = "when am I free?"). Built on the tested `@core/timeline` engine. `[]` if no plan yet.
 */
export function selectCashTimeline(store: DebtStore, maxCycles = 5): TimelineCycle[] {
  const allocation = selectAllocation(store);
  if (!allocation) return [];
  // Delegates to the shared forecast builder (2.4.7.5) — same state-threaded / valley-on-lean projection
  // the §2.5 water-fill runs on, so display and prefund can't diverge.
  return buildForecastCycles(store, allocation, effectivePaycheckBuffer(store), maxCycles);
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
export function rankDebts(debts: Debt[], strategy: PayoffStrategy): Debt[] {
  return [...debts].sort((a, b) => (strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr));
}

/** Everything the (free) Payoff tab renders, derived from the store + the shared `@core` engine. */
export function selectPayoffView(store: DebtStore): PayoffView {
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  const allocation = selectAllocation(store);
  // MF.4 (audit #5): project on the STEADY-STATE deploy (temporary cold-start holdbacks stripped) so the
  // payoff date / trajectory / interest-saved aren't extrapolated off a 3-cycle cold-start dampener.
  const steady = selectSteadyStateAllocation(store);
  const monthlyExtra = steady ? selectExtraToDebt(steady) * payCyclesPerMonth(store.paycheck.payCycle) : 0;
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
