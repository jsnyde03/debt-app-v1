import type { CyclePrediction, CycleOutcome, PayCycleSnapshot } from "@core/storage/debtPlannerStorage";

import { CALIBRATION_MIN_N, classifyCycle, reachedFloor, scoreCalibration, type CalibrationOptions } from "./calibrationScore";

function assertEqual<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  console.log(`  ✓ ${label}`);
}

/** Build a gradeable snapshot: a prediction whose cushion is `pred`, a confirmed outcome that held
 *  `act`, at `floor`. Overrides let a test flip regime / confirmation / disturbance / provisional. */
function snap(
  id: string,
  pred: number,
  act: number,
  floor: number,
  over: { predOver?: Partial<CyclePrediction>; outOver?: Partial<CycleOutcome>; disturbed?: boolean } = {},
): PayCycleSnapshot {
  const prediction: CyclePrediction = {
    forCycleEndDate: id,
    predictedCushion: pred,
    predictedState: "clear",
    predictedShortfall: 0,
    predictedConfidenceContext: { discoveryHoldbackActive: false, coldStartHoldbackActive: false, provisional: false },
    plannedIncome: 2000,
    floor,
    ...over.predOver,
  };
  const outcome: CycleOutcome = { actualIncome: 2000, actualCushionHeld: act, outcomeConfirmed: true, ...over.outOver };
  return {
    cycleEndDate: id,
    totalDebtBalance: 0,
    totalPaidThisCycle: 0,
    completedRecommendedActions: [],
    payoffStrategy: "snowball",
    prediction,
    outcome,
    disturbed: over.disturbed,
  };
}

const VARIABLE: CalibrationOptions = { incomeVaries: true };

function runCalibrationTests() {
  console.log("Running Guardian calibration scoring (2.4.9) tests...");

  // ── The classify primitive (floor-breach model) ──
  assertEqual(classifyCycle(250, 250, 200), "match", "predicted hold + actual hold → match");
  assertEqual(classifyCycle(250, 120, 200), "false_clear", "predicted hold + actual breach → false_clear (the owned miss)");
  assertEqual(classifyCycle(120, 250, 200), "false_tight", "predicted breach + actual hold → false_tight (over-caution)");
  assertEqual(classifyCycle(120, 120, 200), "match", "predicted breach + actual breach → match (correctly called the tight cycle)");
  assertEqual(reachedFloor(199, 200), true, "floor tolerance: cushion at floor−1 counts as reached");
  assertEqual(reachedFloor(198, 200), false, "floor tolerance: cushion at floor−2 is a breach");

  // ── Aggregate (variable income counts every gradeable cycle) ──
  const mixed = scoreCalibration(
    [snap("a", 250, 250, 200), snap("b", 250, 100, 200), snap("c", 100, 250, 200), snap("d", 300, 300, 200)],
    VARIABLE,
  );
  assertEqual(mixed.n, 4, "all 4 gradeable cycles counted");
  assertEqual(mixed.matches, 2, "2 matches");
  assertEqual(mixed.falseClears, 1, "1 false-clear");
  assertEqual(mixed.falseTights, 1, "1 false-tight");
  assertEqual(mixed.matchRate, 0.5, "matchRate = matches / n");
  assertEqual(mixed.dominantError, "false_clear", "equal errors → own the false-clear (un-spinnable direction)");
  assertEqual(mixed.proven, true, "n=4 ≥ gate → proven");

  // dominant-error direction
  const clearHeavy = scoreCalibration([snap("a", 250, 100, 200), snap("b", 250, 90, 200), snap("c", 100, 250, 200)], VARIABLE);
  assertEqual(clearHeavy.dominantError, "false_clear", "false-clear-heavy → dominant false_clear");
  const tightHeavy = scoreCalibration([snap("a", 100, 250, 200), snap("b", 90, 250, 200), snap("c", 250, 100, 200)], VARIABLE);
  assertEqual(tightHeavy.dominantError, "false_tight", "false-tight-heavy → dominant false_tight");
  const perfect = scoreCalibration([snap("a", 250, 250, 200), snap("b", 300, 300, 200)], VARIABLE);
  assertEqual(perfect.dominantError, null, "no errors → dominantError null");
  assertEqual(perfect.matchRate, 1, "no errors → matchRate 1");

  // gate
  assertEqual(scoreCalibration([snap("a", 250, 250, 200)], VARIABLE).proven, false, `n<${CALIBRATION_MIN_N} → not proven`);
  assertEqual(scoreCalibration([], VARIABLE).matchRate, null, "empty history → matchRate null");

  // ── Exclusions: unconfirmed / disturbed / restamped / provisional / missed ──
  assertEqual(scoreCalibration([snap("a", 250, 100, 200, { outOver: { outcomeConfirmed: false } })], VARIABLE).n, 0, "unconfirmed outcome excluded");
  assertEqual(scoreCalibration([snap("a", 250, 100, 200, { disturbed: true })], VARIABLE).n, 0, "disturbed cycle excluded (§3.2)");
  assertEqual(scoreCalibration([snap("a", 250, 100, 200, { predOver: { restampedMidCycle: true } })], VARIABLE).n, 0, "restamped-mid-cycle excluded");
  assertEqual(
    scoreCalibration(
      [snap("a", 250, 100, 200, { predOver: { predictedConfidenceContext: { discoveryHoldbackActive: true, coldStartHoldbackActive: false, provisional: true } } })],
      VARIABLE,
    ).n,
    0,
    "provisional (cold-start) read excluded — grades committed reads, not caution",
  );
  assertEqual(
    scoreCalibration([snap("a", 250, 100, 200)], { incomeVaries: true, missedCycleEndDates: ["a"] }).n,
    0,
    "missed paycheck excluded (a no-show ≠ a prediction miss, §2.4.7.7a)",
  );

  // ── Segment by regime (2.4.8): debt vs debt-free never blend ──
  const both = [snap("debt", 250, 100, 200, { predOver: { debtFree: false } }), snap("free", 250, 100, 200, { predOver: { debtFree: true } })];
  assertEqual(scoreCalibration(both, { incomeVaries: true }).n, 1, "default regime = debt → only the debt cycle");
  assertEqual(scoreCalibration(both, { incomeVaries: true, debtFree: true }).n, 1, "debtFree regime → only the debt-free cycle");
  assertEqual(scoreCalibration(both, { incomeVaries: true, debtFree: true }).falseClears, 1, "…and it's graded (false-clear)");

  // ── Fixed income (F-trust #5): only genuine risk-events count ──
  const FIXED: CalibrationOptions = { incomeVaries: false };
  assertEqual(scoreCalibration([snap("a", 250, 250, 200)], FIXED).n, 0, "fixed income + no surprise + predicted hold → NOT counted (tautological)");
  assertEqual(scoreCalibration([snap("a", 250, 120, 200)], FIXED).n, 1, "fixed income + a surprise moved the cushion → counted");
  assertEqual(scoreCalibration([snap("a", 250, 120, 200)], FIXED).falseClears, 1, "…and graded as a false-clear (surprise breached the floor)");
  assertEqual(scoreCalibration([snap("a", 150, 150, 200)], FIXED).n, 1, "fixed income + the read itself called a below-floor cycle → counted");
  assertEqual(scoreCalibration([snap("a", 150, 150, 200)], FIXED).matches, 1, "…and it matched (correctly called tight)");

  // ── Floor default: a pre-2.4.9 prediction with no stored floor falls back to $200 ──
  assertEqual(scoreCalibration([snap("a", 250, 150, 200, { predOver: { floor: undefined } })], VARIABLE).falseClears, 1, "no stored floor → default $200 line, still grades (250 hold → 150 breach)");

  console.log("✅ Guardian calibration scoring (2.4.9) tests passed.");
}

runCalibrationTests();
