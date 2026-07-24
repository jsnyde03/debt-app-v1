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

import type { CyclePrediction, DebtStore } from '@/data/models';

import { applyStampDecision, deriveConfidenceContext } from './guardianPredictionCore';
import { selectPaydayGuardian } from './guardianSelectors';
import { selectAllocation } from './selectors';

export { reconcileClosingCycle } from './guardianPredictionCore';

/**
 * Pure-ish: the Guardian's prediction for the CURRENT cycle, or null when there's no read (no plan / no
 * income). It PERSISTS past debt-free (2.4.8) — the brief keeps running with the spare re-targeted to
 * savings, so calibration + income-learning don't stop the moment the user graduates. Reads the same
 * brief the card shows so the stamped prediction can't diverge; `debtFree` marks the target regime.
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
    // §2.7 graduation (2.4.8) — record the target regime so 2.4.9 grades debt vs debt-free separately.
    debtFree: brief.debtFree === true,
    // §2.9 calibration (2.4.9) — the floor this read assumed, so the scorecard grades floor-breach
    // against the line at prediction time (the user can move it later).
    floor: brief.floor,
  };
}

/**
 * Stamp the current-cycle prediction (the two-touchpoint "start" stamp + the app-open/onboarding/
 * post-rollover entry paths all route through this). Idempotent when nothing material changed.
 */
export function stampCyclePrediction(store: DebtStore): DebtStore {
  return applyStampDecision(store, computeCyclePrediction(store));
}
