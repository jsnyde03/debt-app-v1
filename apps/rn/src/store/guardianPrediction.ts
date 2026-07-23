/**
 * v1.7 Payday Cushion Guardian — the PREDICTION-stamp side of the two-touchpoint capture (2.4.D.4).
 *
 * Stamp the Guardian's read for the current cycle at cycle-START (into `store.currentCyclePrediction`)
 * via an explicit store mutation — NEVER inside a selector (round-4 F5 / round-6: no selector
 * side-effects). At rollover the in-flight prediction is folded into the CLOSING cycle's snapshot with
 * its reconciled outcome (`reconcileClosingCycle`), and a fresh prediction is stamped for the new cycle.
 *
 * The pure decision/reconcile logic lives in `guardianPredictionCore.ts` (selector-free, unit-tested);
 * this file adds the two functions that need the Guardian selectors.
 */

import { ESTIMATE_AGING_DAYS, ESTIMATE_STALE_DAYS, type EstimateStaleness } from '@core/debt/projectCurrentBalance';

import type { CyclePrediction, DebtStore } from '@/data/models';

import { applyStampDecision, classifyFreshness, daysBetweenISO, deriveConfidenceContext } from './guardianPredictionCore';
import { selectPaydayGuardian } from './guardianSelectors';
import { selectAllocation } from './selectors';

export { reconcileClosingCycle } from './guardianPredictionCore';

/**
 * §2.0 read-freshness (2.4.D.7) — how stale THIS read's inputs are, off the store-level `inputsAsOf`
 * stamp, NOT per-debt `lastVerifiedDate`. This is the seam that stops a rolled-over / auto-maintained
 * debt (whose `lastVerifiedDate` deliberately ages) from tripping the Guardian's staleness hedge: as
 * long as the user recently touched real inputs, the read stays fresh. Same day-thresholds as per-debt
 * staleness. The §2.0 voice-hedge / hard cutoff consumes this at 2.4.6.1.
 */
export function selectReadFreshness(store: DebtStore, asOfDate?: string): EstimateStaleness {
  const today = asOfDate ?? store.paycheck.currentDate;
  return classifyFreshness(daysBetweenISO(store.inputsAsOf, today), ESTIMATE_AGING_DAYS, ESTIMATE_STALE_DAYS);
}

/**
 * Pure-ish: the Guardian's prediction for the CURRENT cycle, or null when there's no read (no plan / no
 * income / debt-free). Reads the same brief the card shows so the stamped prediction can't diverge.
 */
export function computeCyclePrediction(store: DebtStore): CyclePrediction | null {
  const brief = selectPaydayGuardian(store);
  if (!brief) return null;
  const allocation = selectAllocation(store);
  const plannedIncome = store.paycheck.incomeVaries
    ? store.paycheck.leanAmount || 0
    : Number(store.paycheck.amount) || 0;
  return {
    forCycleEndDate: store.paycheck.nextPaycheckDate,
    predictedCushion: brief.cushion,
    predictedState: brief.state,
    predictedShortfall: allocation?.shortfall ?? 0,
    predictedConfidenceContext: deriveConfidenceContext(store),
    plannedIncome,
  };
}

/**
 * Stamp the current-cycle prediction (the two-touchpoint "start" stamp + the app-open/onboarding/
 * post-rollover entry paths all route through this). Idempotent when nothing material changed.
 */
export function stampCyclePrediction(store: DebtStore): DebtStore {
  return applyStampDecision(store, computeCyclePrediction(store));
}
