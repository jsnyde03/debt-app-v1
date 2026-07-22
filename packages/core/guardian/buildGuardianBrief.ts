import type { CushionStatus } from "@core/timeline/buildMultiCycleTimeline";

/**
 * Payday Cushion Guardian core (v1.7 Phase 2.4) — the premium headline, and now an ACTOR, not a
 * narrator. Premium reserves the user's **cushion floor** before any extra debt payoff, so the plan it
 * shows is already the safe one; this brief states what the Guardian DID ("held your cushion at your
 * line", "paused extra payoff") and hands the viz numbers to the cushion bar. The effort it removes —
 * deciding every cycle how much to hold vs. pay — is the premium value; a chat can't reshape your plan.
 *
 * Hard requirement (it runs on a PROJECTION): risk-framed + hedged ("about $X"), never a false-precise
 * verdict. It only ever reallocates DISCRETIONARY money (extra payoff / optional goals); it never cuts
 * an obligation to fake a cushion. Pure + deterministic → reconciliation-tested.
 */

export type GuardianState = "clear" | "tight" | "at-risk";

export interface GuardianBrief {
  state: GuardianState;
  title: string;
  detail: string;
  /** The action / next step (premium only; free gets the value-led invitation from the card). */
  safeMove?: string;
  /** Forewarning of the nearest upcoming non-clear cycle (the proactive, un-chattable value). */
  lookahead?: string;
  // ── viz numbers for the cushion bar (exact; the copy hedges, the bar is proportional) ──
  /** This cycle's protected cushion (premium: held to the floor; free: the base plan's cushion). */
  cushion: number;
  /** Extra cash the plan sends to debt this cycle after protecting the cushion. */
  deployedToDebt: number;
  /** The user's cushion line. */
  floor: number;
  /** Whether the cushion reached the floor. */
  reachedFloor: boolean;
}

export interface GuardianInput {
  isPremium: boolean;
  floor: number;
  /** Cash after every obligation (bills + minimums + living) — the headroom that drives the band. */
  discretionary: number;
  /** The liquid cushion the plan KEEPS (buffer + leftover) — what the floor protects. */
  kept: number;
  /** Extra deployed to debt this cycle (the snowball). */
  deployedToDebt: number;
  /** Amount the paycheck can't cover of what's required this cycle (>0 = an acute shortfall). */
  shortfall: number;
  focusDebtName?: string;
  lookahead?: { status: CushionStatus; cushion: number; label: string };
}

/** A finite, non-negative number or 0 — the guard against `$NaN`/`$Infinity` ever reaching a screen. */
function money(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Hedge a dollar amount so a projection never reads as false precision (and never NaN). */
function about(n: number): string {
  const v = money(n);
  const step = v < 100 ? 5 : 10;
  return `about $${(Math.round(v / step) * step).toLocaleString("en-US")}`;
}
/** Bare hedged figure (no "about" prefix) for mid-sentence use. */
function amt(n: number): string {
  return about(n).replace("about $", "$");
}

export function buildGuardianBrief(input: GuardianInput): GuardianBrief {
  const { isPremium, focusDebtName, lookahead } = input;
  // Sanitize every number up front — a bad upstream value must degrade to a safe read, never `$NaN`.
  const floor = money(input.floor) || 200;
  const discretionary = money(input.discretionary);
  const kept = money(input.kept);
  const deployedToDebt = money(input.deployedToDebt);
  const shortfall = money(input.shortfall);

  // The band is driven by HEADROOM (cash after every obligation), not by how much you keep vs. deploy —
  // sending money to debt is a choice, not a risk. Same for free and premium (the split differs, the
  // headroom doesn't). at-risk (red): can't cover obligations, or critically little left. tight (amber):
  // covered, but under your line. clear (slate): covered with your full cushion intact.
  const state: GuardianState =
    shortfall > 0 || discretionary < 100 ? "at-risk" : discretionary < floor ? "tight" : "clear";
  const reachedFloor = kept >= floor - 1;

  const look =
    lookahead && lookahead.status !== "stable"
      ? `Heads up: ${lookahead.label} looks ${lookahead.status === "pressure" ? "tight" : "a little tight"} — ${about(lookahead.cushion)} of cushion. Worth planning for now.`
      : undefined;

  const viz = { cushion: kept, deployedToDebt, floor, reachedFloor };
  const focus = focusDebtName ? ` to ${focusDebtName}` : " to your focus debt";

  if (!isPremium) {
    // Free: the honest read for this paycheck (the value-led taste) — no action claimed. The card
    // supplies the "Premium holds you at your line" invitation; the bar shows the kept cushion vs. the line.
    return {
      state,
      title: state === "clear" ? "You're covered this paycheck" : state === "tight" ? "A little tight this paycheck" : "Tight this paycheck",
      detail: `You've got ${about(discretionary)} after everything required this paycheck${state === "clear" ? "." : ` — under a healthy ${amt(floor)}.`}`,
      lookahead: undefined, // watching ahead is part of the premium value
      ...viz,
    };
  }

  // Premium — the Guardian acted.
  if (shortfall > 0) {
    return {
      state,
      title: "This paycheck is stretched",
      detail: `This paycheck comes up ${about(shortfall)} short of everything due this cycle — a genuinely tight one.`,
      safeMove: "I've paused all extra payoff. Cover required bills and minimums first; anything you can add goes straight to safety.",
      lookahead: look,
      ...viz,
    };
  }
  if (state !== "clear") {
    // Covered, but the headroom is under the line — keep all of it, deploy nothing.
    return {
      state,
      title: state === "at-risk" ? "Very tight this paycheck" : "A little tight this paycheck",
      detail: `About ${amt(discretionary)} is left after everything required — under your ${amt(floor)} line, so I'm keeping all of it as cushion.`,
      safeMove: "Nothing extra goes out this cycle. Extra payoff resumes once you're back above your line.",
      lookahead: look,
      ...viz,
    };
  }
  // Clear — floor held; deploy the spare (if any) to debt.
  if (deployedToDebt <= 0) {
    return {
      state,
      title: "You're covered this paycheck",
      detail: `About ${amt(discretionary)} after everything required, all held as your cushion — right at your ${amt(floor)} line.`,
      safeMove: "Nudge your line down anytime to send more toward debt.",
      lookahead: look,
      ...viz,
    };
  }
  return {
    state,
    title: "You're covered this paycheck",
    detail: `About ${amt(discretionary)} after everything required. I'm holding ${amt(kept)} as your cushion and sending the spare ${amt(deployedToDebt)}${focus}.`,
    safeMove: `Mark the ${amt(deployedToDebt)} payment when you're ready — your ${amt(floor)} cushion stays protected either way.`,
    lookahead: look,
    ...viz,
  };
}
