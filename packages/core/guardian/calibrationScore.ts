/**
 * v1.7 Payday Guardian — the CALIBRATION scoring core (§2.9, 2.4.9). Pure + selector-free (type-only
 * imports) → node-unit-testable. Grades the Guardian's past reads against what actually happened, the
 * HONEST way (the audit flagged a naive scorecard as net-negative), on the model locked with Jason:
 *
 *  • FLOOR-BREACH ON THE CUSHION (2.4.9 model): a read "held" if its cushion reached the floor. Compare
 *    the PREDICTED hold vs the ACTUAL hold (each vs the floor THAT prediction assumed):
 *      - false_clear: predicted it would hold, it actually dipped below the line — the miss we OWN.
 *      - false_tight: warned it wouldn't hold, it actually did — over-caution.
 *      - match:       both agree.
 *  • Excludes cycles the score can't fairly grade: unconfirmed / disturbed (re-stamped mid-cycle) /
 *    provisional (deliberately-cautious cold-start reads) / MISSED paychecks (a no-show ≠ a bad read).
 *  • Grades ONE regime at a time — debt vs debt-free never blend (2.4.8 `prediction.debtFree`).
 *  • FIXED income: the cushion holds by construction (income doesn't vary), so a plain match-rate would
 *    grade ~100% and prove nothing (F-trust #5). Count only genuine RISK-EVENT cycles — a surprise
 *    moved the cushion, or the read itself called a below-floor cycle. Under the gate → no number
 *    (the caller shows the day-one-protection state instead). Same metric, filtered.
 */

import type { PayCycleSnapshot } from "@core/storage/debtPlannerStorage";

/** "Reached the floor" tolerance — mirrors buildGuardianBrief's `reachedFloor` (kept ≥ floor − 1). */
const FLOOR_TOLERANCE = 1;

/** Proven-accuracy gate ≡ §2.0.a lean-verification N (ONE canonical signal, not a 5th axis). */
export const CALIBRATION_MIN_N = 4;

export type CalibrationVerdict = "match" | "false_clear" | "false_tight";

export interface CalibrationScore {
  /** Gradeable cycles counted (after every exclusion + the fixed-income risk-event filter). */
  n: number;
  matches: number;
  falseClears: number;
  falseTights: number;
  /** matches / n, or null when n === 0 (nothing to show). */
  matchRate: number | null;
  /** The dominant error direction — drives the honest copy branch. Ties resolve to `false_clear`
   *  (the one direction the honesty spine won't let us spin as "just over-cautious"). */
  dominantError: "false_clear" | "false_tight" | null;
  /** n ≥ the gate — the scorecard may show a number; else the caller shows the day-one state. */
  proven: boolean;
}

export interface CalibrationOptions {
  /** The user's income regime. Fixed income filters to genuine risk-event cycles only (F-trust #5). */
  incomeVaries: boolean;
  /** Grade ONLY this debt regime (never blend, 2.4.8). Defaults to the debt regime (false). */
  debtFree?: boolean;
  /** Cycle-end dates the paycheck never arrived for — excluded (a no-show ≠ a prediction miss, §2.4.7.7(a)). */
  missedCycleEndDates?: readonly string[];
}

export function reachedFloor(cushion: number, floor: number): boolean {
  return cushion >= floor - FLOOR_TOLERANCE;
}

/** Classify ONE closed cycle's predicted cushion vs its confirmed outcome (floor-breach model). */
export function classifyCycle(predictedCushion: number, actualCushionHeld: number, floor: number): CalibrationVerdict {
  const predictedHold = reachedFloor(predictedCushion, floor);
  const actualHold = reachedFloor(actualCushionHeld, floor);
  if (predictedHold === actualHold) return "match";
  return predictedHold ? "false_clear" : "false_tight";
}

/** A snapshot the score can FAIRLY grade in the requested regime (confirmed, undisturbed, committed,
 *  not a missed paycheck, same debt-regime). */
function isGradeable(s: PayCycleSnapshot, wantDebtFree: boolean, missed: ReadonlySet<string>): boolean {
  const p = s.prediction;
  const o = s.outcome;
  if (!p || !o || !o.outcomeConfirmed) return false;
  if (s.disturbed) return false; // re-stamped mid-cycle (§3.2)
  if (p.restampedMidCycle) return false; // belt-and-suspenders (the disturbed flag mirrors this)
  if (p.predictedConfidenceContext?.provisional) return false; // deliberately-cautious cold-start read
  if (missed.has(s.cycleEndDate)) return false; // the paycheck never arrived (§2.4.7.7(a))
  if ((p.debtFree ?? false) !== wantDebtFree) return false; // never blend regimes (2.4.8)
  return true;
}

/**
 * Score the Guardian's calibration over the cycle history (newest-agnostic — order doesn't matter).
 * Returns the counts + the honest match-rate + the dominant-error direction + the proven gate.
 */
export function scoreCalibration(history: readonly PayCycleSnapshot[], opts: CalibrationOptions): CalibrationScore {
  const wantDebtFree = opts.debtFree ?? false;
  const missed = new Set(opts.missedCycleEndDates ?? []);

  let matches = 0;
  let falseClears = 0;
  let falseTights = 0;

  for (const s of history) {
    if (!isGradeable(s, wantDebtFree, missed)) continue;
    const p = s.prediction!;
    const o = s.outcome!;
    const floor = p.floor ?? 200; // pre-2.4.9 predictions stored no floor → the default line
    const predictedHold = reachedFloor(p.predictedCushion, floor);

    // Fixed income: the cushion holds by construction unless something real happened — a surprise moved
    // it off the predicted amount, or the read itself called a below-floor cycle. Count only those, so
    // the score can't inflate itself on tautological "matches" (F-trust #5).
    if (!opts.incomeVaries) {
      const surpriseMoved = Math.abs(o.actualCushionHeld - p.predictedCushion) >= 1;
      const calledRisk = !predictedHold;
      if (!surpriseMoved && !calledRisk) continue;
    }

    const verdict = classifyCycle(p.predictedCushion, o.actualCushionHeld, floor);
    if (verdict === "match") matches += 1;
    else if (verdict === "false_clear") falseClears += 1;
    else falseTights += 1;
  }

  const n = matches + falseClears + falseTights;
  const dominantError: CalibrationScore["dominantError"] =
    falseClears === 0 && falseTights === 0
      ? null
      : falseClears >= falseTights // tie → own the false-clear (the un-spinnable direction)
        ? "false_clear"
        : "false_tight";

  return {
    n,
    matches,
    falseClears,
    falseTights,
    matchRate: n === 0 ? null : matches / n,
    dominantError,
    proven: n >= CALIBRATION_MIN_N,
  };
}
