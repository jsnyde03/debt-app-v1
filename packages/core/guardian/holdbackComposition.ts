/**
 * §2.0.b holdback composition (v1.7 · 2.4.6.1.1 · round-6 correctness F1). The Guardian may hold cash
 * back for up to three reasons at once — a pre-funded reserve for a known future crunch (§2.5), and the
 * two uncertainty reserves (discovery + cold-start, §2.0). This composes them into ONE `combinedHoldback`
 * with a hard CLAMP so the held buckets can never exceed above-floor headroom (without the clamp, buckets
 * 1+2+3 over-sum `discretionary` and the §2.2 partition invariant breaks — the exact launch-window bug).
 *
 * Collision rule: `prefundedReserve` (a real dated need) WINS; the uncertainty buffer takes only the
 * remaining above-floor headroom. Discovery vs cold-start compose by `max` (same kind of caution — don't
 * double-charge a week-one variable user), which the caller passes as the two operands.
 */

/**
 * §2.0.b holdback FRACTIONS ([BUILD] tunables, Phase 6). Each uncertainty reserve is a fraction of
 * above-floor headroom: discovery (bill-completeness unproven) holds more; cold-start (lean unverified,
 * variable income) a touch less. They compose by `max` (same kind of caution — not summed), so a
 * week-one variable user is charged the larger of the two, never both.
 */
export const DISCOVERY_HOLDBACK_FRACTION = 0.4;
export const COLDSTART_HOLDBACK_FRACTION = 0.25;

export interface HoldbackInput {
	/** Cash earmarked THIS cycle for a specific future crunch (§2.5 water-fill output). */
	prefundedReserve: number;
	/** The §2.0 discovery reserve (bill-completeness unproven). */
	discoveryHoldback: number;
	/** The §2.0 cold-start reserve (lean unverified; 0 for fixed income). */
	coldStartHoldback: number;
	/** Cash after every obligation (income − required − living), clamped ≥0. */
	discretionary: number;
	/** The user's protected floor. */
	floor: number;
}

/** The clamped, composed holdback (≥0, never exceeds `discretionary − floor`). */
export function combinedHoldback(input: HoldbackInput): number {
	const aboveFloor = Math.max(0, input.discretionary - input.floor);
	// prefunded wins the collision, capped at the available headroom.
	const prefunded = Math.max(0, Math.min(input.prefundedReserve, aboveFloor));
	// the uncertainty buffer (discovery vs cold-start compose by max) takes only the remainder.
	const uncertainty = Math.max(0, input.discoveryHoldback, input.coldStartHoldback);
	return prefunded + Math.min(uncertainty, aboveFloor - prefunded);
}

/** The deployable-to-debt amount after protecting the floor + all held reserves: the §2.0.b headline. */
export function computeDeploy(discretionary: number, floor: number, combined: number): number {
	return Math.max(0, discretionary - floor - combined);
}
