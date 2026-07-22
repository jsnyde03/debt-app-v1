import type { CushionStatus } from "@core/timeline/buildMultiCycleTimeline";

/**
 * Payday Cushion Guardian core (v1.7 Phase 2.4) — the premium headline. Answers the one question the
 * free plan deliberately doesn't: **"am I going to make it THIS paycheck?"** — from the SAME projected
 * cushion the cash-flow bars already show (so the two never disagree).
 *
 * Hard requirement (the Guardian runs on a PROJECTION): frame as tight-cycle RISK + a safe move, with
 * every dollar HEDGED ("about $X") and user-correctable — NEVER a false-precise "$X short" verdict. A
 * wrong alarm destroys trust worse than no feature. Pure + deterministic → reconciliation-tested.
 */

export type GuardianState = "clear" | "tight" | "at-risk";

export interface GuardianBrief {
  state: GuardianState;
  /** Short banner label — the answer at a glance. */
  title: string;
  /** The hedged, risk-framed read of this paycheck. Contains "about $X", never an exact verdict. */
  detail: string;
  /** The single safe move. */
  safeMove: string;
  /** Optional forewarning of the nearest upcoming non-clear cycle (the proactive, un-chattable value). */
  lookahead?: string;
}

export interface GuardianInput {
  /** This cycle's projected ending cushion (cash left after everything required) — the headline number. */
  thisCushion: number;
  /** This cycle's cushion band, from the SAME `toCushionStatus` the timeline bars use (coherence). */
  thisStatus: CushionStatus;
  /** Amount the paycheck can't cover of what's required this cycle (>0 = an acute shortfall). */
  shortfall: number;
  /** Cash safely available for extra debt payoff this cycle (the surplus side). */
  safeExtra: number;
  /** The strategy's focus debt name, for the surplus "best move". */
  focusDebtName?: string;
  /** The nearest upcoming cycle that isn't clear — the forewarning ("next month looks tight"). */
  lookahead?: { status: CushionStatus; cushion: number; label: string };
}

/** CushionStatus → the Guardian's user-facing band. Same thresholds, warmer vocabulary. */
function toState(status: CushionStatus): GuardianState {
  return status === "stable" ? "clear" : status === "tight" ? "tight" : "at-risk";
}

/**
 * Hedge a dollar amount so the projection never reads as false precision: rounded to the nearest $10
 * (nearest $5 under $100) and always spoken as "about $X". This is the load-bearing trust move.
 */
function about(n: number): string {
  const v = Math.max(0, n);
  const step = v < 100 ? 5 : 10;
  return `about $${(Math.round(v / step) * step).toLocaleString("en-US")}`;
}

export function buildGuardianBrief(input: GuardianInput): GuardianBrief {
  const { thisCushion, thisStatus, shortfall, safeExtra, focusDebtName, lookahead } = input;

  // An acute shortfall (the paycheck can't cover required) always wins the read — the sharpest risk.
  const state: GuardianState = shortfall > 0 ? "at-risk" : toState(thisStatus);

  const look =
    lookahead && lookahead.status !== "stable"
      ? `Heads up: ${lookahead.label} looks ${lookahead.status === "pressure" ? "tight" : "a little tight"} — ${about(lookahead.cushion)} of cushion. Worth planning for now.`
      : undefined;

  if (shortfall > 0) {
    return {
      state,
      title: "This paycheck is stretched",
      detail: `This paycheck comes up ${about(shortfall)} short of everything due this cycle — a genuinely tight one.`,
      safeMove: "Safe move: cover required bills and minimums first, and hold off on any extra debt payoff until next payday.",
      lookahead: look,
    };
  }

  if (state === "at-risk") {
    return {
      state,
      title: "Covered — but very tight",
      detail: `You'll cover everything this paycheck, but only ${about(thisCushion)} is left over. One surprise could make it tight.`,
      safeMove: "Safe move: keep that as cushion this cycle — skip extra payoff until your next paycheck lands.",
      lookahead: look,
    };
  }

  if (state === "tight") {
    return {
      state,
      title: "On track — a little tight",
      detail: `You're on track this paycheck with ${about(thisCushion)} of cushion after everything required — just a bit snug.`,
      safeMove: "Safe move: go easy on extra debt payoff this cycle so a surprise can't push you short.",
      lookahead: look,
    };
  }

  // Clear — the surplus side.
  if (safeExtra > 0) {
    const target = focusDebtName ? ` toward ${focusDebtName}` : " toward your focus debt";
    return {
      state,
      title: "You're clear this paycheck",
      detail: `You've got ${about(thisCushion)} of room after everything required — a comfortable cushion.`,
      safeMove: `Best move: ${about(safeExtra)}${target} keeps you ahead, and still leaves your cushion intact.`,
      lookahead: look,
    };
  }
  return {
    state,
    title: "You're clear this paycheck",
    detail: `Everything required is covered with ${about(thisCushion)} of cushion — nicely on plan.`,
    safeMove: "Nothing extra needed this cycle. Staying current is the win.",
    lookahead: look,
  };
}
