/**
 * The ONE Guardian state machine (v1.7 · 2.4.6.1.2 · round-4 F4). Every producer — the card
 * (`buildGuardianBrief`), the forecast (`buildMultiCycleTimeline`), and `selectPlanSummary` — must
 * derive its band from THIS function so they can never disagree (the card said "clear" while its own
 * lookahead said "tight" — the exact contradiction F4 kills).
 *
 * Driven by floor-relative HEADROOM (`discretionary` = cash after every obligation), NOT post-buffer
 * `endingBalance` or a `paycheck × 0.1` threshold: sending money to debt is a choice, not a risk, so the
 * band tracks what's left after obligations vs. the user's floor.
 *   - at-risk: critically little headroom (below half the floor — replaces the old hardcoded `< 100`).
 *   - tight:   covered, but under the floor.
 *   - clear:   at or above the floor.
 *
 * Hysteresis (round-4 F4): downward moves are immediate (safety first), but moving UP a band requires
 * clearing the threshold by `HYSTERESIS_BAND`, so a value hovering on a boundary doesn't flap the state
 * cycle-to-cycle. Pass the persisted `priorBand` to enable it; omit it for a stateless (first) read.
 */

import type { GuardianState } from "./buildGuardianBrief";

/** [BUILD] tunables (Phase 6). */
export const HYSTERESIS_BAND = 50;
export const AT_RISK_FRACTION = 0.5;

function sanitize(discretionary: number): number {
	return Number.isFinite(discretionary) ? Math.max(0, discretionary) : 0;
}

/** The band with no hysteresis — the pure floor-relative classification. */
export function baseState(discretionary: number, floor: number): GuardianState {
	const d = sanitize(discretionary);
	const f = Number.isFinite(floor) && floor > 0 ? floor : 200;
	if (d < f * AT_RISK_FRACTION) return "at-risk";
	if (d < f) return "tight";
	return "clear";
}

/** The unified band, with hysteresis when `priorBand` is supplied. */
export function computeState(discretionary: number, floor: number, priorBand?: GuardianState | null): GuardianState {
	const base = baseState(discretionary, floor);
	if (!priorBand || priorBand === base) return base;

	const d = sanitize(discretionary);
	const f = Number.isFinite(floor) && floor > 0 ? floor : 200;
	const atRiskLine = f * AT_RISK_FRACTION;

	if (priorBand === "at-risk") {
		// Exit at-risk only when clearly above the at-risk line; then exit tight→clear only above floor+band.
		if (d <= atRiskLine + HYSTERESIS_BAND) return "at-risk";
		return d > f + HYSTERESIS_BAND ? "clear" : "tight";
	}
	if (priorBand === "tight") {
		// Drop to at-risk immediately if breached; exit up to clear only clearly above the floor.
		if (d < atRiskLine) return "at-risk";
		return d > f + HYSTERESIS_BAND ? "clear" : "tight";
	}
	// priorBand === "clear": worsening is immediate (no upward move to guard).
	return base;
}
