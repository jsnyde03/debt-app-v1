/**
 * §2.3 income learning (2.4.7.8) — suggest a refined `lean` (the conservative income floor the plan runs
 * on) from the confirmed income actuals. Pure + deterministic → unit-tested. NEVER applied silently: the
 * caller surfaces this as a suggest-and-confirm nudge.
 *
 * The model (spec §2.3, CORRECTED low-N F6 + the round-6 handoff-smoothing minor):
 *  - **Below N=12 actuals** — a low percentile of 4–6 points ≈ the raw min (noisy), so DON'T use a
 *    percentile. Use a **shrinkage floor**: `typical × (1 − HAIRCUT)` (a stable conservative estimate).
 *  - **At N≥12** — enough data for a **low quantile** (12th percentile, linear interpolation).
 *  - **Smoothed handoff** — blend shrinkage→percentile over a window ABOVE N=12 so the lean (and thus the
 *    whole plan) doesn't lurch at the 12th confirmed paycheck.
 *  - **Outlier-robust by construction** — a percentile ignores a single wild high/low, and the shrinkage
 *    floor is typical-anchored; combined with the confirm-required nudge, one bad entry can't move lean.
 *  - Missed arrivals ($0) are NOT in the actuals log (they're recorded on the arrival axis, §2.3.1), so
 *    they never drag the estimate — the caller passes only real income actuals.
 */

/** [BUILD] tunables (Phase 6). */
export const LEARNING_N = 12; // actuals needed before trusting a percentile
export const SHRINKAGE_HAIRCUT = 0.15; // below N: lean = typical × (1 − 0.15)
export const LOW_PERCENTILE = 0.12; // at N≥12: the 12th percentile
export const HANDOFF_SPAN = 6; // cycles over which shrinkage→percentile blends (N=12 → N=18)

function roundMoney(n: number): number {
	return Math.round(n * 100) / 100;
}

/** Linear-interpolated quantile of a SORTED ascending array. */
function quantile(sortedAsc: number[], q: number): number {
	if (sortedAsc.length === 0) return 0;
	if (sortedAsc.length === 1) return sortedAsc[0];
	const pos = (sortedAsc.length - 1) * Math.min(1, Math.max(0, q));
	const lo = Math.floor(pos);
	const hi = Math.ceil(pos);
	if (lo === hi) return sortedAsc[lo];
	return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (pos - lo);
}

export interface LeanSuggestion {
	/** The suggested conservative income floor. */
	suggestedLean: number;
	/** How many confirmed actuals informed it. */
	n: number;
}

/**
 * @param actuals confirmed per-cycle income actuals (real arrivals only; misses excluded upstream)
 * @param typical the user's entered "typical" income (the anchor for the low-N shrinkage floor)
 * @param currentLean the current lean (returned unchanged when there's nothing to learn yet)
 */
export function suggestLean(actuals: number[], typical: number, currentLean: number): LeanSuggestion {
	const clean = actuals.filter((a) => Number.isFinite(a) && a > 0);
	const n = clean.length;
	if (n === 0) return { suggestedLean: roundMoney(currentLean), n: 0 };

	const sorted = [...clean].sort((a, b) => a - b);
	const typicalAnchor = Number.isFinite(typical) && typical > 0 ? typical : sorted[sorted.length - 1];

	// The two estimators.
	const shrinkage = roundMoney(typicalAnchor * (1 - SHRINKAGE_HAIRCUT));
	const percentile = roundMoney(quantile(sorted, LOW_PERCENTILE));

	// Blend weight: 0 below N (pure shrinkage), ramping to 1 over HANDOFF_SPAN cycles above N (pure
	// percentile) — the smoothed handoff so lean doesn't jump at exactly the 12th paycheck.
	const w = Math.min(1, Math.max(0, (n - LEARNING_N) / HANDOFF_SPAN));
	const suggestedLean = roundMoney((1 - w) * shrinkage + w * percentile);

	return { suggestedLean, n };
}
