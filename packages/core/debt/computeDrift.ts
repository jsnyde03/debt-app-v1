import { buildPayoffTrajectory, type PayoffSimDebt, type TrajectoryPoint } from "./buildPayoffTrajectory";

/**
 * Drift Tracker core (v1.7 Phase C.4) — the premium_plus accountability carrot.
 *
 * Headline: "you're ~N days behind the plan the engine authored for you." Computed by diffing the
 * live debt balance against a FROZEN projected baseline (not cycle-over-cycle — that's
 * computeCycleDelta). Pure + engine-adjacent (layers on buildPayoffTrajectory's existing output, no
 * engine change) → reconciliation-tested (testComputeDrift.ts). Lives in packages/core → portable to
 * RN verbatim; the test is the parity oracle. See docs/V17_DRIFT_TRACKER_SPEC.md.
 */

const DAYS_PER_MONTH = 365.25 / 12; // 30.4375
/** Within this band of the plan counts as "on track" (tunable; validate in real use). */
export const DRIFT_TOLERANCE_DAYS = 14;

/** The frozen plan baseline, persisted under `driftBaseline` (schema v3). */
export interface DriftBaseline {
  anchorDate: string; // when frozen (plan-start / last re-anchor), YYYY-MM-DD
  anchorBalance: number;
  debtCount: number; // # of debts in the plan at anchor (array length — the add/remove re-anchor trigger; NOT active-only, so paying a debt to $0 doesn't re-anchor)
  payoffStrategy: "snowball" | "avalanche";
  extraPayment: number; // planned per-cycle (monthly-equiv) extra at anchor
  projectedPoints: TrajectoryPoint[]; // frozen projected balance-by-month from the anchor
  projectedDebtFreeDate: string; // frozen headline date
}

export type DriftStatus = "ahead" | "on_track" | "behind";

export interface DriftResult {
  /** Horizontal gap in days: >0 = behind the plan, <0 = ahead, 0 = exactly on plan. */
  daysBehind: number;
  /** Vertical gap in dollars today: >0 = owe more than planned, <0 = less. */
  dollarsBehind: number;
  /** What the baseline projected the balance would be as of `currentDate`. */
  projectedBalanceToday: number;
  onTrack: boolean;
  status: DriftStatus;
}

/**
 * ISO (YYYY-MM-DD) day difference b − a. Parsed as UTC so the count is pure day arithmetic — no DST
 * wobble and timezone-independent (drift must read the same everywhere), and deterministic in tests.
 */
function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(`${aIso}T00:00:00Z`);
  const b = Date.parse(`${bIso}T00:00:00Z`);
  return (b - a) / (1000 * 60 * 60 * 24);
}

/** Projected balance at a fractional month, linearly interpolated across the frozen points. */
function balanceAtMonth(points: TrajectoryPoint[], month: number): number {
  if (points.length === 0) return 0;
  if (month <= points[0].month) return points[0].balance;
  const last = points[points.length - 1];
  if (month >= last.month) return last.balance;
  for (let i = 1; i < points.length; i++) {
    if (month <= points[i].month) {
      const lo = points[i - 1];
      const hi = points[i];
      const span = hi.month - lo.month || 1;
      const t = (month - lo.month) / span;
      return lo.balance + t * (hi.balance - lo.balance);
    }
  }
  return last.balance;
}

/** The (fractional) month at which the plan projected reaching `balance`. Monotonic-decreasing balance. */
function monthAtBalance(points: TrajectoryPoint[], balance: number): number {
  if (points.length === 0) return 0;
  if (balance >= points[0].balance) return points[0].month; // at/above the start → month 0
  const last = points[points.length - 1];
  if (balance <= last.balance) return last.month; // at/below the floor (usually 0) → payoff month
  for (let i = 1; i < points.length; i++) {
    const lo = points[i - 1];
    const hi = points[i];
    // balance is between hi.balance (lower) and lo.balance (higher)
    if (balance >= hi.balance) {
      const span = lo.balance - hi.balance || 1;
      const t = (lo.balance - balance) / span; // 0 at lo.month, 1 at hi.month
      return lo.month + t * (hi.month - lo.month);
    }
  }
  return last.month;
}

/**
 * Compute drift of the live balance against the frozen baseline.
 * Returns null when there's no usable baseline (new user / pre-v1.7) → the UI shows the
 * "building your drift history…" empty state.
 */
export function computeDrift(
  baseline: DriftBaseline | null | undefined,
  now: { currentDate: string; currentBalance: number },
): DriftResult | null {
  if (!baseline || baseline.projectedPoints.length === 0) return null;

  const monthsElapsed = Math.max(0, daysBetween(baseline.anchorDate, now.currentDate) / DAYS_PER_MONTH);
  const projectedBalanceToday = balanceAtMonth(baseline.projectedPoints, monthsElapsed);
  const dollarsBehind = round2(now.currentBalance - projectedBalanceToday);

  // Where the plan expected today's actual balance to occur, vs. where we actually are in time.
  const monthForActual = monthAtBalance(baseline.projectedPoints, now.currentBalance);
  const daysBehind = Math.round((monthsElapsed - monthForActual) * DAYS_PER_MONTH);

  const status: DriftStatus =
    daysBehind > DRIFT_TOLERANCE_DAYS ? "behind" : daysBehind < -DRIFT_TOLERANCE_DAYS ? "ahead" : "on_track";

  return { daysBehind, dollarsBehind, projectedBalanceToday: round2(projectedBalanceToday), onTrack: status === "on_track", status };
}

/**
 * Freeze a new baseline from the current plan (call on plan-establish + each re-anchor). The projected
 * trajectory is the engine's existing month-by-month output; the debt-free date is passed in (the
 * caller has the computed `result` in scope) so this stays a thin, engine-adjacent recorder.
 */
export function buildDriftBaseline(input: {
  anchorDate: string;
  // 3.7.A6a — the SIBLING's exported shape, not a private narrower copy. This array is handed straight
  // to `buildPayoffTrajectory`, which needs `recurrence` to rate BNPL by cadence; the old local type
  // omitted it, so dropping the field would have type-checked clean.
  debts: PayoffSimDebt[];
  payoffStrategy: "snowball" | "avalanche";
  monthlyExtraPayment: number;
  projectedDebtFreeDate: string;
  /** ⛔ [pass-5 A5-1] required — see `bnplMonthlyEquivalentMinimum`. */
  cyclesPerMonth: number;
}): DriftBaseline {
  const anchorBalance = input.debts.filter((d) => d.balance > 0).reduce((s, d) => s + d.balance, 0);
  return {
    anchorDate: input.anchorDate,
    anchorBalance: round2(anchorBalance),
    debtCount: input.debts.length, // array length — add/remove signal (paying to $0 keeps the debt in the plan)
    payoffStrategy: input.payoffStrategy,
    extraPayment: input.monthlyExtraPayment,
    projectedPoints: buildPayoffTrajectory({
      debts: input.debts,
      monthlyExtraPayment: input.monthlyExtraPayment,
      strategy: input.payoffStrategy,
      cyclesPerMonth: input.cyclesPerMonth,
    }),
    projectedDebtFreeDate: input.projectedDebtFreeDate,
  };
}

/**
 * Whether a plan change is "material" enough to re-anchor the baseline (§4): a debt added/removed, a
 * strategy switch, or a planned-extra change beyond ±threshold (paycheck-driven). Compares the current
 * plan against the FROZEN baseline's own state — normal cycle progression + small edits do NOT
 * re-anchor, so between re-anchors drift measures pure adherence.
 */
export function shouldReAnchor(
  baseline: DriftBaseline | null | undefined,
  next: { debtCount: number; monthlyExtraPayment: number; payoffStrategy: "snowball" | "avalanche" },
  thresholdPct = 0.1,
): boolean {
  if (!baseline) return true; // no baseline yet → establish one
  if (next.debtCount !== baseline.debtCount) return true; // debt added/removed
  if (next.payoffStrategy !== baseline.payoffStrategy) return true; // strategy switch → new trajectory
  const base = baseline.extraPayment;
  if (base <= 0) return next.monthlyExtraPayment > 0; // 0→something is material
  return Math.abs(next.monthlyExtraPayment - base) / base > thresholdPct;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
