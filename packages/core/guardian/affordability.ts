/**
 * §2.9 Can-I-Afford-This? — the inverse Guardian's PURE verdict. Given this paycheck's discretionary
 * headroom (cash above every obligation — `selectDiscretionary`) and the user's cushion floor, decide
 * whether a one-off purchase of `amount` is comfortable, tight, or short. It's the Guardian's own
 * cushion model run backwards: the Guardian asks "will my plan hold?"; this asks "can I add this and
 * still hold my line?". Pure + deterministic → reconciliation-tested; the app selector feeds it the
 * engine's discretionary number so premium holdbacks are already reflected.
 */

export type AffordabilityVerdict = "comfortable" | "tight" | "short";

export interface AffordabilityResult {
	verdict: AffordabilityVerdict;
	/** Cushion left after the purchase, floored at 0 (a `short` result reports the gap via `shortBy`). */
	cushionAfter: number;
	/** How much the purchase exceeds the discretionary headroom (>0 only when `short`). */
	shortBy: number;
}

function roundMoney(n: number): number {
	return Math.round(n * 100) / 100;
}

/**
 * @param discretionary this paycheck's cash above all obligations (bills + minimums + living)
 * @param amount        the one-off purchase being considered
 * @param floor         the user's cushion line — a purchase that dips below it is "tight", not comfortable
 */
export function computeAffordability(discretionary: number, amount: number, floor: number): AffordabilityResult {
	const d = Number.isFinite(discretionary) ? Math.max(0, discretionary) : 0;
	const f = Number.isFinite(floor) ? Math.max(0, floor) : 0;
	const after = roundMoney(d - amount);

	if (after < 0) {
		// The purchase exceeds even the obligations-covered headroom — you'd come up short on the essentials.
		return { verdict: "short", cushionAfter: 0, shortBy: roundMoney(-after) };
	}
	if (after < f) {
		// Bills are still covered, but the purchase eats into the protected cushion line.
		return { verdict: "tight", cushionAfter: after, shortBy: 0 };
	}
	// Comfortable — the purchase comes out of genuinely spare cash, floor intact.
	return { verdict: "comfortable", cushionAfter: after, shortBy: 0 };
}
