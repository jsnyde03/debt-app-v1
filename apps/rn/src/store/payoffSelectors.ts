import { buildPayoffTrajectory, type TrajectoryPoint } from '@core/debt/buildPayoffTrajectory';
import { computeInterestSaved, type InterestSaved } from '@core/debt/computeInterestSaved';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import type { Debt, DebtStore, PayoffStrategy } from '@/data/models';

import { selectDebtFreeDate, selectExtraToDebt } from './planSelectors';
import { selectAllocation } from './selectors';

export type { TrajectoryPoint, InterestSaved };

export interface PayoffView {
  hasDebts: boolean;
  debtFreeDate: string | null;
  interestSaved: InterestSaved;
  monthlyExtra: number;
  snowball: TrajectoryPoint[];
  avalanche: TrajectoryPoint[];
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

  const order = rankDebts(liveDebts, store.payoffStrategy);
  return {
    hasDebts: liveDebts.length > 0,
    debtFreeDate: selectDebtFreeDate(store, allocation),
    interestSaved,
    monthlyExtra,
    snowball,
    avalanche,
    order,
    focus: order[0] ?? null,
  };
}
