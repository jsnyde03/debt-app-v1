import { buildDriftBaseline, shouldReAnchor } from '@core/debt/computeDrift';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import { todayLocalISO } from '@/data/defaults';
import type { DebtStore } from '@/data/models';

import { selectDebtFreeDate, selectExtraToDebt } from './planSelectors';
import { selectAllocation, selectSteadyStateAllocation } from './selectors';

/**
 * Record / re-anchor the Drift Tracker baseline (v1.7 Phase C.4.2). Recording MUST start in v1.7 —
 * a baseline can be stamped but never backfilled (docs/V17_DRIFT_TRACKER_SPEC.md §5). Called after
 * plan-establishing / materially-changing mutations (onboarding, debt +/−, paycheck, strategy,
 * rollover). Pure `DebtStore → DebtStore`:
 *   - no plan yet (no active debt or no paycheck) → leave the baseline untouched;
 *   - else freeze a fresh baseline ONLY when the change is material (`shouldReAnchor`), so normal
 *     cycle progression + small edits keep measuring pure adherence to the frozen plan.
 *
 * `source` (2.4.D.5 · v6 §3.3 · round-6 data B2): a **learning-driven** lean nudge (the app refined
 * its income estimate, 2.4.7) is a MEASUREMENT change — it must NOT re-anchor, else "days ahead/behind"
 * resets with no behavior change. A **user-driven** edit is a PLAN change → re-anchors normally
 * (the default; every current caller is user-driven). The learning consumer arrives with 2.4.7.
 *
 * `now` (3.5.0.1): the wall clock, injectable. It defaults to `todayLocalISO` — the real app's behavior
 * is unchanged — but the Phase-3.5 sandbox binds it to the scenario's frozen base date. Without this,
 * ANY action that re-anchors (rollover, add/remove debt, onboarding) would stamp `anchorDate` with the
 * real today against a scenario dated months away, making the tutorial's drift read nonsense AND its
 * replay non-deterministic. NOTE: `paycheck.currentDate` is deliberately NOT used here — it only
 * advances at onboarding/edit/rollover, so it can lag real today by a cycle; drift must measure elapsed
 * REAL time from when the plan was frozen.
 */
export function recordDriftBaseline(
  store: DebtStore,
  source: 'user' | 'learning' = 'user',
  now: () => string = todayLocalISO,
): DebtStore {
  // Learning refines how we READ income, not the plan the user committed to → preserve the baseline.
  if (source === 'learning') return store;

  const hasPlan = store.debts.some((d) => d.balance > 0) && Number(store.paycheck.amount) > 0;
  if (!hasPlan) return store;

  const allocation = selectAllocation(store);
  // MF.4 (completed in round-2): the frozen baseline's trajectory + its `monthlyExtra` + its headline
  // `projectedDebtFreeDate` (which selectDebtFreeDate now computes STEADY) must all agree, so this uses
  // the steady-state deploy too. Without it the frozen curve bottomed out LATER than its own headline
  // date (a cold-start desync the MF.4 date-change introduced), and shouldReAnchor keyed off a dampened
  // extra that drifts as the cold-start hold releases (a spurious re-anchor).
  const steady = selectSteadyStateAllocation(store);
  const monthlyExtra = steady ? selectExtraToDebt(steady) * payCyclesPerMonth(store.paycheck.payCycle) : 0;

  // debtCount = the plan's debt array length (add/remove signal), so paying a debt to $0 doesn't re-anchor.
  if (!shouldReAnchor(store.driftBaseline, { debtCount: store.debts.length, monthlyExtraPayment: monthlyExtra, payoffStrategy: store.payoffStrategy })) {
    return store;
  }

  const baseline = buildDriftBaseline({
    anchorDate: now(), // the real date this plan is frozen (drift measures elapsed time from here)
    debts: store.debts,
    payoffStrategy: store.payoffStrategy,
    monthlyExtraPayment: monthlyExtra,
    projectedDebtFreeDate: selectDebtFreeDate(store, allocation) ?? 'Unable to estimate',
  });
  return { ...store, driftBaseline: baseline };
}
