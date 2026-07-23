/**
 * §2.5 backward water-fill (2.4.7.4) — stage two of the cash-flow brain, consuming the crunch segments
 * from `detectCrunches`.
 *
 * **The model (round-6 correctness F2 — net-of-consumption, NO double-count).** `carriedBalance` is the
 * un-clamped CUMULATIVE running balance (`startingBalance + Σ net`), so preceding surplus is *already*
 * carried into every later balance. Two consequences:
 *
 *  1. **Structural deficit = the below-floor trough depth, directly.** Where `carriedBalance` dips below
 *     the floor, no amount of *holding surplus back* can lift it (that surplus is already counted) — it's
 *     a genuine cash shortfall. Total structural deficit = the sum of the crunch segments' trough
 *     deficits. (Trying to "cover" it from preceding surplus is the exact double-count F2 kills.)
 *
 *  2. **The reserve is a DEPLOY cap, attributed nearest the constraint.** The plan wants to deploy surplus
 *     to debt, but cumulative deploy through cycle k must never exceed `carriedBalance_k − floor` (or the
 *     actual balance breaches the floor at k). We deploy as EARLY as possible (pay debt sooner) and hold
 *     the remainder back in the cycles NEAREST each binding constraint (a later surplus cycle is the
 *     nearer source for a later tight/crunch cycle — the spec's per-segment, not-global, cap). A looming
 *     crunch drives the cap to 0 (hold everything; never add to a coming shortfall).
 *
 * `prefundedReserve` (cycle 0's held-back share) is the actionable output → feeds `allocatePaycheck`'s
 * `prefundedReserve` param (2.4.7.5). `reserveByCycle` drives the forecast's "held for an upcoming tight
 * cycle" display. Pure + deploy-independent → deterministic, single forward pass after the suffix-min.
 *
 * Cold-start note (§2.5 allow-and-down-qualify): the water-fill still sources from a cold-start-window
 * surplus cycle (excluding it would shrink sources and manufacture a false-alarm) — the "on track to be
 * covered, not covered" down-qualification is a DISPLAY flag applied by the caller, not an algorithm change.
 */

import { detectCrunches, type CrunchSegment } from "@core/cashflow/detectCrunches";

function roundMoney(n: number): number {
	return Math.round(n * 100) / 100;
}

export interface WaterFillResult {
	/** Cycle 0's held-back surplus — the actionable `prefundedReserve` for THIS paycheck's allocation. */
	prefundedReserve: number;
	/** Total below-floor exposure no reserve can cover (sum of crunch trough deficits), honestly reported. */
	structuralDeficit: number;
	/** Per-cycle held-back reserve, index-aligned with `carriedBalances` (drives the forecast display). */
	reserveByCycle: number[];
	/** The crunch segments (pass-through from detection, for the caller's forewarning/display). */
	segments: CrunchSegment[];
}

/**
 * @param carriedBalances the forecast's un-clamped `carriedBalance` per cycle (`TimelineCycle.carriedBalance`)
 * @param floor the protected cushion line
 */
export function waterFill(carriedBalances: number[], floor: number): WaterFillResult {
	const f = Number.isFinite(floor) ? floor : 0;
	const n = carriedBalances.length;
	const segments = detectCrunches(carriedBalances, f);
	const structuralDeficit = roundMoney(segments.reduce((s, seg) => s + seg.troughDeficit, 0));

	// Sparable surplus per cycle (above the floor) — the pool a cycle *could* deploy.
	const surplus = carriedBalances.map((b) => (Number.isFinite(b) ? Math.max(0, b - f) : 0));

	// The binding deploy cap at cycle k = the tightest (bal_j − floor) for j ≥ k, floored at 0. A future
	// crunch (bal_j < floor) drives it to 0 → hold everything from here on.
	const suffixMinCap = new Array<number>(n).fill(0);
	let running = Infinity;
	for (let k = n - 1; k >= 0; k--) {
		running = Math.min(running, carriedBalances[k] - f);
		suffixMinCap[k] = Math.max(0, running);
	}

	// Deploy greedily early (respecting the cap), reserve the rest — so held-back cash lands in the
	// cycles nearest each constraint, not globally.
	const reserveByCycle = new Array<number>(n).fill(0);
	let cumDeploy = 0;
	for (let k = 0; k < n; k++) {
		const deployNow = Math.max(0, Math.min(surplus[k], roundMoney(suffixMinCap[k] - cumDeploy)));
		cumDeploy = roundMoney(cumDeploy + deployNow);
		reserveByCycle[k] = roundMoney(surplus[k] - deployNow);
	}

	return { prefundedReserve: reserveByCycle[0] ?? 0, structuralDeficit, reserveByCycle, segments };
}
