import { buildDriftBaseline, shouldReAnchor } from '@core/debt/computeDrift';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import { todayLocalISO } from '@/data/defaults';
import type { DebtStore } from '@/data/models';

import { selectDebtFreeDate, selectExtraToDebt } from './planSelectors';
import { selectAllocation } from './selectors';

/**
 * Record / re-anchor the Drift Tracker baseline (v1.7 Phase C.4.2). Recording MUST start in v1.7 —
 * a baseline can be stamped but never backfilled (docs/V17_DRIFT_TRACKER_SPEC.md §5). Called after
 * plan-establishing / materially-changing mutations (onboarding, debt +/−, paycheck, strategy,
 * rollover). Pure `DebtStore → DebtStore`:
 *   - no plan yet (no active debt or no paycheck) → leave the baseline untouched;
 *   - else freeze a fresh baseline ONLY when the change is material (`shouldReAnchor`), so normal
 *     cycle progression + small edits keep measuring pure adherence to the frozen plan.
 */
export function recordDriftBaseline(store: DebtStore): DebtStore {
  const hasPlan = store.debts.some((d) => d.balance > 0) && Number(store.paycheck.amount) > 0;
  if (!hasPlan) return store;

  const allocation = selectAllocation(store);
  const monthlyExtra = allocation ? selectExtraToDebt(allocation) * payCyclesPerMonth(store.paycheck.payCycle) : 0;

  // debtCount = the plan's debt array length (add/remove signal), so paying a debt to $0 doesn't re-anchor.
  if (!shouldReAnchor(store.driftBaseline, { debtCount: store.debts.length, monthlyExtraPayment: monthlyExtra, payoffStrategy: store.payoffStrategy })) {
    return store;
  }

  const baseline = buildDriftBaseline({
    anchorDate: todayLocalISO(), // the real date this plan is frozen (drift measures elapsed time from here)
    debts: store.debts,
    payoffStrategy: store.payoffStrategy,
    monthlyExtraPayment: monthlyExtra,
    projectedDebtFreeDate: selectDebtFreeDate(store, allocation) ?? 'Unable to estimate',
  });
  return { ...store, driftBaseline: baseline };
}
