/**
 * v1.7 Payday Guardian prediction — the PURE core (2.4.D.4). No selector / RN imports (type-only), so
 * it's node-unit-testable in isolation. `guardianPrediction.ts` adds the selector-dependent
 * `computeCyclePrediction`/`stampCyclePrediction` on top of these.
 */

import type { EstimateStaleness } from '@core/debt/projectCurrentBalance';
import type { PayCycleSnapshot } from '@core/storage/debtPlannerStorage';

import type { CyclePrediction, DebtStore } from '@/data/models';

/** [BUILD] tunables (Phase 6) — the discovery window + the cold-start lean-confirmation count. */
export const DISCOVERY_CYCLES = 3;
export const COLDSTART_CONFIRMATIONS = 4;

/** Whole days from ISO `a` to ISO `b` (local midnight), floored, never negative below 0 handled by caller. */
export function daysBetweenISO(a: string, b: string): number {
  const ms = new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime();
  return Math.floor(ms / 86_400_000);
}

/**
 * §2.0 read-freshness — classify how stale THIS read's inputs are from the day-count, using the SAME
 * thresholds as per-debt staleness (injected so this stays selector-free / tsx-testable). The wrapper
 * `selectReadFreshness` (guardianSelectors.ts) feeds it `inputsAsOf` + the ESTIMATE_* constants.
 */
export function classifyFreshness(daysSinceInputs: number, agingDays: number, staleDays: number): EstimateStaleness {
  const d = Math.max(0, daysSinceInputs);
  return d >= staleDays ? 'stale' : d >= agingDays ? 'aging' : 'fresh';
}

/** §2.0.e — which holdbacks WOULD be active this read, derived from the substrate signals. */
export function deriveConfidenceContext(store: DebtStore): CyclePrediction['predictedConfidenceContext'] {
  const discoveryHoldbackActive = store.genuineCycleCount < DISCOVERY_CYCLES;
  // Fixed income → cold-start is N/A (masked, §2.0.a) → treated as satisfied. Variable → count the
  // actuals that confirmed the lean FROM THE LOW SIDE (met-or-exceeded it).
  const leanConfirms = store.paycheck.incomeVaries
    ? store.incomeActualsLog.filter((a) => a.actualIncome >= (store.paycheck.leanAmount || 0)).length
    : COLDSTART_CONFIRMATIONS;
  const coldStartHoldbackActive = store.paycheck.incomeVaries && leanConfirms < COLDSTART_CONFIRMATIONS;
  return {
    discoveryHoldbackActive,
    coldStartHoldbackActive,
    provisional: discoveryHoldbackActive || coldStartHoldbackActive,
  };
}

/** A material change worth re-stamping for (state flip or a ≥$1 cushion/shortfall move). [BUILD]-tunable. */
export function materiallyDiffers(a: CyclePrediction, b: CyclePrediction): boolean {
  return (
    a.predictedState !== b.predictedState ||
    Math.abs(a.predictedCushion - b.predictedCushion) >= 1 ||
    Math.abs(a.predictedShortfall - b.predictedShortfall) >= 1
  );
}

/**
 * The pure fresh/re-stamp/idempotent stamp decision. `next` = the freshly-computed prediction (or null
 * when there's no read):
 *  - no prediction, or one for an OLD cycle → stamp fresh.
 *  - a same-cycle prediction that materially changed → re-stamp + mark `restampedMidCycle` (→ disturbed).
 *  - otherwise idempotent (no-op) — safe to call on every app-open/render.
 */
export function applyStampDecision(store: DebtStore, next: CyclePrediction | null): DebtStore {
  if (!next) return store;
  const prev = store.currentCyclePrediction;
  if (prev && prev.forCycleEndDate === next.forCycleEndDate) {
    if (!materiallyDiffers(prev, next)) return store;
    return { ...store, currentCyclePrediction: { ...next, restampedMidCycle: true } };
  }
  return { ...store, currentCyclePrediction: next };
}

/**
 * At rollover, fold the in-flight prediction + its reconciled outcome into the CLOSING cycle's snapshot.
 * Only reconciles when the in-flight prediction is FOR this closing cycle (else leaves it un-graded).
 * First-order outcome reconciliation: actual income moves the cushion; a surprise outflow reduces it;
 * a missed arrival zeroes income. The §2.9 scorecard refines/consumes it.
 */
export function reconcileClosingCycle(store: DebtStore, snapshot: PayCycleSnapshot): PayCycleSnapshot {
  const prediction = store.currentCyclePrediction;
  if (!prediction || prediction.forCycleEndDate !== snapshot.cycleEndDate) return snapshot;

  const missed = store.missedArrivals.includes(snapshot.cycleEndDate);
  const logged = store.incomeActualsLog.find((a) => a.cycleEndDate === snapshot.cycleEndDate);
  const actualIncome = missed ? 0 : logged?.actualIncome ?? prediction.plannedIncome;
  const surprise = store.surpriseOutflowLog
    .filter((o) => o.cycleEndDate === snapshot.cycleEndDate)
    .reduce((sum, o) => sum + o.amount, 0);
  const actualCushionHeld = Math.max(0, prediction.predictedCushion + (actualIncome - prediction.plannedIncome) - surprise);

  // §2.10 (2.4.11.2 after-scan): a cycle the user held by TOPPING UP from savings is a user intervention,
  // not a clean prediction test — exclude it from calibration (mark `disturbed`), same as a re-stamp.
  const toppedUp = store.cycleTopUp?.forCycle === snapshot.cycleEndDate;

  return {
    ...snapshot,
    prediction,
    outcome: { actualIncome, actualCushionHeld, outcomeConfirmed: true },
    disturbed: (prediction.restampedMidCycle ?? false) || toppedUp,
  };
}
