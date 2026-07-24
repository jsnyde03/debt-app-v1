import type { EstimateStaleness } from "@core/debt/projectCurrentBalance";
import type { CushionStatus } from "@core/timeline/buildMultiCycleTimeline";
import { computeState } from "@core/guardian/computeState";

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
  /** The §2.0 held reserve WITHIN the cushion (discovery + prefunded) — the "set aside" zone the bar
   *  names on the protected side (§2.0.c). ≤ `cushion`; 0 when nothing is held back. */
  heldReserve: number;
  /** The user's cushion line. */
  floor: number;
  /** Whether the cushion reached the floor. */
  reachedFloor: boolean;
  /** §2.0.d — the inputs are too old for a confident read; the card renders this as a neutral
   *  "refresh your numbers" state rather than a color-coded verdict (2.4.6.1.5). */
  staleAdvisory?: boolean;
  /** §2.3.1 (2.4.7.7) — a scheduled paycheck didn't land, so deploy is paused; the card renders a
   *  neutral "income paused" posture, never a phantom-income clear. */
  pausedDeploy?: boolean;
}

/**
 * §2.0.d confidence signals for the voice gate — the freshness of THIS read's inputs + which
 * uncertainty holdbacks are live. The brief spends at most ONE hedge, on the dominant live signal.
 */
export interface GuardianConfidence {
  /** Read-level input freshness (store-level `inputsAsOf`, NOT per-debt staleness). 'stale' → hard cutoff. */
  freshness?: EstimateStaleness;
  /** Bill-completeness unproven (first N genuine cycles) — a premium learning hedge. */
  discoveryHoldbackActive?: boolean;
  /** A variable-income lean not yet confirmed from the low side — a premium learning hedge. */
  coldStartHoldbackActive?: boolean;
}

export interface GuardianInput {
  isPremium: boolean;
  floor: number;
  /** Cash after every obligation (bills + minimums + living) — the headroom that drives the band. */
  discretionary: number;
  /** The liquid cushion the plan KEEPS (all protected buckets) — what the floor protects. */
  kept: number;
  /** The held-reserve portion of `kept` (discovery + prefunded) — the "set aside" bar zone. Default 0. */
  heldReserve?: number;
  /** Extra deployed to debt this cycle (the snowball). */
  deployedToDebt: number;
  /** True when the extra spans more than one debt (fills the focus, then rolls onward). */
  deploySpread: boolean;
  /** Amount the paycheck can't cover of what's required this cycle (>0 = an acute shortfall). */
  shortfall: number;
  focusDebtName?: string;
  lookahead?: { status: CushionStatus; cushion: number; label: string };
  /** The persisted prior band (2.4.6.1.2) — enables hysteresis so the card's state can't flap. */
  priorBand?: GuardianState | null;
  /** §2.0.d voice-gate signals (2.4.6.1.3) — drives the one-hedge budget + the stale hard-cutoff. */
  confidence?: GuardianConfidence;
  /** §2.3.1 (2.4.7.7) — the scheduled paycheck for this cycle was reported missed ($0 arrival). Deploy
   *  pauses and the read is reframed honestly, never a phantom-income clear. */
  pausedDeploy?: boolean;
}

/** A finite, non-negative number or 0 — the guard against `$NaN`/`$Infinity` ever reaching a screen. */
function money(n: number): number {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Hedge a dollar amount so a projection never reads as false precision (and never NaN). A NONZERO
 *  amount never rounds down to "$0" (2.4.6.1.4 — the Guardian must not claim it's sending nothing when
 *  it's sending a few dollars); it floors to the smallest hedge unit instead. */
function about(n: number): string {
  const v = money(n);
  const step = v < 100 ? 5 : 10;
  const rounded = Math.round(v / step) * step;
  const display = v > 0 ? Math.max(step, rounded) : rounded;
  return `about $${display.toLocaleString("en-US")}`;
}
/** Bare hedged figure (no "about" prefix) for mid-sentence use. */
function amt(n: number): string {
  return about(n).replace("about $", "$");
}

/**
 * §2.0.d hedge budget — return the SINGLE hedge sentence for the dominant *live* uncertainty, or null.
 * Priority: stale-inputs > lean-unverified > unproven-accuracy. ('stale' is handled by the caller as a
 * hard cutoff, so this only ever sees the softer 'aging' freshness.) 'fresh' inputs never hedge — the
 * auto-maintained-and-recent read stays fully decisive (the 2.1↔2.3 reconciliation). The learning
 * hedges (cold-start / discovery) describe the premium ACTING, so they're premium-only.
 */
function pickHedge(isPremium: boolean, c?: GuardianConfidence): string | null {
  if (!c) return null;
  if (c.freshness === "aging") return "These figures are from a little while ago — a quick refresh keeps this exact.";
  if (!isPremium) return null;
  if (c.coldStartHoldbackActive) return "I'm planning from the low side while I learn what your paychecks reliably clear.";
  if (c.discoveryHoldbackActive) return "I'm keeping a little extra set aside while I get to know your bills.";
  return null;
}

/** Append the one selected hedge to a brief's detail (voice budget spent once, §2.0.d). */
function withHedge(brief: GuardianBrief, hedge: string | null): GuardianBrief {
  return hedge ? { ...brief, detail: `${brief.detail} ${hedge}` } : brief;
}

export function buildGuardianBrief(input: GuardianInput): GuardianBrief {
  const { isPremium, focusDebtName, deploySpread, lookahead } = input;
  // Sanitize every number up front — a bad upstream value must degrade to a safe read, never `$NaN`.
  const floor = money(input.floor) || 200;
  const discretionary = money(input.discretionary);
  const kept = money(input.kept);
  // The held reserve is a portion of the kept cushion — never more than it (a bad upstream value can't
  // make the "set aside" zone exceed the cushion it lives inside).
  const heldReserve = Math.min(money(input.heldReserve ?? 0), kept);
  const deployedToDebt = money(input.deployedToDebt);
  const shortfall = money(input.shortfall);

  // The band is driven by HEADROOM (cash after every obligation), not by how much you keep vs. deploy —
  // sending money to debt is a choice, not a risk. Same for free and premium (the split differs, the
  // headroom doesn't). at-risk (red): can't cover obligations, or critically little left. tight (amber):
  // covered, but under your line. clear (slate): covered with your full cushion intact.
  // The ONE state machine (2.4.6.1.2): floor-relative headroom + hysteresis via the prior band. A
  // shortfall drives `discretionary` to 0 → at-risk, so it needs no separate branch here (the copy
  // below still keys off `shortfall` for its wording).
  const state: GuardianState = computeState(discretionary, floor, input.priorBand);
  const reachedFloor = kept >= floor - 1;

  const look =
    lookahead && lookahead.status !== "stable"
      ? `Heads up: ${lookahead.label} looks ${lookahead.status === "pressure" ? "tight" : "a little tight"} — ${about(lookahead.cushion)} of cushion. Worth planning for now.`
      : undefined;

  const viz = { cushion: kept, deployedToDebt, heldReserve, floor, reachedFloor };

  // §2.3.1 paused-deploy (2.4.7.7) — a scheduled paycheck was reported missed. This supersedes every
  // other read (a missed check with the plan still assuming income is the structural phantom-income
  // false-clear the confidence layer can't even hedge): deploy pauses, the floor still protects, and
  // the copy says so honestly. Obligations still surface elsewhere; income resuming clears it.
  if (input.pausedDeploy) {
    return {
      state,
      title: "A paycheck didn't land",
      detail:
        "It looks like this paycheck didn't come through. I've paused moving money to debt and I'm protecting your cushion until your income resumes.",
      safeMove: isPremium
        ? "Cover essentials from your cushion if you need to — extra payoff stays paused until your next paycheck lands."
        : undefined,
      pausedDeploy: true,
      ...viz,
      deployedToDebt: 0,
    };
  }

  // §2.0.d hard cutoff — inputs too old for a confident read. Supersedes EVERY read (free + premium,
  // clear + shortfall): the honest move is to stop asserting a verdict and ask for a refresh. The state
  // still rides through for the bar's proportions, but `staleAdvisory` tells the card to render it
  // neutrally (2.4.6.1.5) instead of as a green/amber/red verdict.
  if (input.confidence?.freshness === "stale") {
    return {
      state,
      title: "Let's refresh your numbers",
      detail:
        "Your paycheck, bills, or balances are more than a few weeks old, so I can't tell you if you'll make it this paycheck with confidence.",
      safeMove: isPremium ? "Update your numbers and I'll plan from where you actually are." : undefined,
      staleAdvisory: true,
      ...viz,
    };
  }

  const hedge = pickHedge(isPremium, input.confidence);

  // Where the extra actually lands: a single debt names it; a spread fills the focus first, then rolls.
  const dest = !focusDebtName
    ? "toward debt"
    : deploySpread
      ? `across your debts, starting with ${focusDebtName}`
      : `toward ${focusDebtName}`;

  if (!isPremium) {
    // Free: the honest read for this paycheck (the value-led taste) — no action claimed. The card
    // supplies the "Premium holds you at your line" invitation; the bar shows the kept cushion vs. the line.
    return withHedge(
      {
        state,
        title: state === "clear" ? "Looks clear this paycheck" : state === "tight" ? "A little tight this paycheck" : "Tight this paycheck",
        detail: `You've got ${about(discretionary)} after everything required this paycheck${state === "clear" ? "." : " — a bit tight this one, so keep an eye on the essentials."}`,
        lookahead: undefined, // watching ahead is part of the premium value
        ...viz,
      },
      hedge,
    );
  }

  // Premium — the Guardian acted.
  if (shortfall > 0) {
    return {
      state,
      title: "This paycheck won't cover everything",
      detail: `You're about ${amt(shortfall)} short of the bills and minimums due before your next paycheck — this one needs a plan.`,
      safeMove: "Cover the essentials first — housing, utilities, food. Extra payoff is paused, and any income you can add this cycle helps the most.",
      lookahead: look,
      ...viz,
    };
  }
  if (state !== "clear") {
    // Covered, but the headroom is under the line — keep all of it, deploy nothing.
    return withHedge(
      {
        state,
        title: state === "at-risk" ? "Very tight this paycheck" : "A little tight this paycheck",
        detail: `About ${amt(discretionary)} is left after everything required — under your ${amt(floor)} line, so I'm keeping all of it as cushion.`,
        safeMove: "Nothing extra goes out this cycle. Extra payoff resumes once you're back above your line.",
        lookahead: look,
        ...viz,
      },
      hedge,
    );
  }
  // Clear — floor held; deploy the spare (if any) to debt.
  if (deployedToDebt <= 0) {
    return withHedge(
      {
        state,
        title: "Looks clear this paycheck",
        detail: `About ${amt(discretionary)} after everything required — this paycheck keeps all of it as your cushion, right at your ${amt(floor)} line.`,
        safeMove: "Nudge your line down anytime to free up more for debt.",
        lookahead: look,
        ...viz,
      },
      hedge,
    );
  }
  return withHedge(
    {
      state,
      title: "Looks clear this paycheck",
      detail: `About ${amt(discretionary)} after everything required. I've set this paycheck to keep ${amt(kept)} as your cushion and put the spare ${amt(deployedToDebt)} ${dest}.`,
      safeMove: `Mark ${deploySpread ? "the extra payments" : `the ${amt(deployedToDebt)} payment`} when you're ready — your ${amt(floor)} cushion stays protected either way.`,
      lookahead: look,
      ...viz,
    },
    hedge,
  );
}
