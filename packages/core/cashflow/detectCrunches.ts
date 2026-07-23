/**
 * §2.5 crunch detection (2.4.7.3) — the first stage of the cash-flow brain.
 *
 * Walks the forecast's UN-CLAMPED cross-cycle running balance (`carriedBalance`, 2.4.D.6) and finds each
 * **crunch segment**: a maximal run of consecutive cycles whose retained balance dips BELOW the floor.
 * For each, the **trough deficit** = `floor − min(balance in the segment)` — the depth the water-fill
 * (2.4.7.4) must pre-fund from earlier surplus.
 *
 * Because `carriedBalance` excludes deploy (it's `startingBalance + Σ net`), the crunch track is
 * deploy-INDEPENDENT → this is a single deterministic pass, no iteration (round-6 correctness).
 */

export interface CrunchSegment {
	/** First cycle index (into the balances array) in the below-floor run. */
	startIndex: number;
	/** Last cycle index (inclusive) in the run. */
	endIndex: number;
	/** The cycle index with the lowest balance in the run (the trough). */
	troughIndex: number;
	/** `floor − troughBalance`, rounded, always > 0 (the segment's max depth below the floor). */
	troughDeficit: number;
}

function roundMoney(n: number): number {
	return Math.round(n * 100) / 100;
}

/**
 * @param carriedBalances the per-cycle un-clamped retained balance (`TimelineCycle.carriedBalance`)
 * @param floor the protected cushion line
 */
export function detectCrunches(carriedBalances: number[], floor: number): CrunchSegment[] {
	const f = Number.isFinite(floor) ? floor : 0;
	const segments: CrunchSegment[] = [];

	let start = -1;
	let troughIndex = -1;
	let troughBalance = Infinity;

	const flush = (endIndex: number) => {
		if (start < 0) return;
		segments.push({ startIndex: start, endIndex, troughIndex, troughDeficit: roundMoney(f - troughBalance) });
		start = -1;
		troughIndex = -1;
		troughBalance = Infinity;
	};

	for (let i = 0; i < carriedBalances.length; i++) {
		const bal = carriedBalances[i];
		const below = Number.isFinite(bal) && bal < f;
		if (below) {
			if (start < 0) start = i;
			if (bal < troughBalance) {
				troughBalance = bal;
				troughIndex = i;
			}
		} else {
			flush(i - 1);
		}
	}
	flush(carriedBalances.length - 1);

	return segments;
}
