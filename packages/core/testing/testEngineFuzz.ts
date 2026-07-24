/**
 * RS.4 — adversarial / fuzz sweep over the NEWEST cash-flow-brain + income engine fns (`detectCrunches`,
 * `waterFill`, `suggestLean`), which had little/no break-it coverage. Proves the defensive guards hold:
 * bad numbers (NaN / Infinity / -Inf / negative / huge / fractional) and degenerate shapes (empty /
 * single / all-below-floor) never crash, never leak a non-finite output, and keep the documented
 * invariants. Throw-based; registered in `runRegressionTests`.
 */

import { detectCrunches } from "@core/cashflow/detectCrunches";
import { waterFill } from "@core/cashflow/waterFill";
import { suggestLean } from "@core/income/suggestLean";

let passed = 0;
function assertTrue(value: boolean, label: string) {
	if (!value) throw new Error(`FAIL [${label}]`);
	passed++;
}
function assertEqual<T>(actual: T, expected: T, label: string) {
	assertTrue(actual === expected, `${label} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`);
}
function noThrow(fn: () => void, label: string) {
	try {
		fn();
	} catch (e) {
		throw new Error(`FAIL [${label}] — threw ${(e as Error).message}`);
	}
	passed++;
}

// The break-it number menagerie + degenerate arrays reused across fns.
const BAD_NUMS = [NaN, Infinity, -Infinity, -1000, 0, 1e12, 0.001, -0];
const BAD_ARRAYS: number[][] = [
	[],
	[NaN],
	[Infinity, -Infinity, NaN],
	[100, NaN, -50, Infinity, 300],
	[-500, -400, -300],           // all below any positive floor
	[1e12, -1e12, 1e12],          // huge swings
	[50],                         // single
	[200, 200, 200, 200],         // flat at floor
];

function runEngineFuzzTests() {
	// ── detectCrunches: never crash, valid indices, positive trough deficits, finite output ──
	for (const arr of BAD_ARRAYS) {
		for (const floor of [200, 0, -100, NaN, Infinity]) {
			let segs!: ReturnType<typeof detectCrunches>;
			noThrow(() => { segs = detectCrunches(arr, floor); }, `detectCrunches(${JSON.stringify(arr)}, ${floor}) no crash`);
			for (const s of segs) {
				assertTrue(s.startIndex >= 0 && s.startIndex <= s.endIndex && s.endIndex < arr.length, "detectCrunches segment indices in range");
				assertTrue(s.troughIndex >= s.startIndex && s.troughIndex <= s.endIndex, "detectCrunches trough within segment");
				assertTrue(Number.isFinite(s.troughDeficit) && s.troughDeficit > 0, "detectCrunches troughDeficit finite + positive");
			}
		}
	}
	// A NaN/Infinity balance is never "below floor" (guarded) → excluded from any segment.
	assertEqual(detectCrunches([NaN, Infinity, -Infinity], 200).length, 0, "non-finite balances never form a crunch");
	// A clean below-floor run is detected with the right depth.
	const seg = detectCrunches([500, 150, 100, 400], 200);
	assertEqual(seg.length, 1, "one contiguous below-floor run → one segment");
	assertEqual(seg[0].troughDeficit, 100, "trough deficit = floor − min balance (200 − 100)");

	// ── waterFill: finite outputs, reserveByCycle aligned, non-negative reserves + deficit ──
	for (const arr of BAD_ARRAYS) {
		for (const floor of [200, 0, -100, NaN, Infinity]) {
			let r!: ReturnType<typeof waterFill>;
			noThrow(() => { r = waterFill(arr, floor); }, `waterFill(${JSON.stringify(arr)}, ${floor}) no crash`);
			assertEqual(r.reserveByCycle.length, arr.length, "waterFill reserveByCycle length === input length");
			assertTrue(Number.isFinite(r.prefundedReserve) && r.prefundedReserve >= 0, "waterFill prefundedReserve finite + non-negative");
			assertTrue(Number.isFinite(r.structuralDeficit) && r.structuralDeficit >= 0, "waterFill structuralDeficit finite + non-negative");
			assertTrue(r.reserveByCycle.every((x) => Number.isFinite(x) && x >= 0), "waterFill every per-cycle reserve finite + non-negative");
		}
	}
	// Empty forecast → all-zero, no segments.
	const empty = waterFill([], 200);
	assertEqual(empty.prefundedReserve, 0, "waterFill([]) prefundedReserve 0");
	assertEqual(empty.structuralDeficit, 0, "waterFill([]) structuralDeficit 0");
	assertEqual(empty.segments.length, 0, "waterFill([]) no segments");
	// A looming crunch drives the cap to 0 → hold all surplus (reserve, don't deploy early).
	const looming = waterFill([1000, 100], 200); // cycle 1 dips below floor
	assertTrue(looming.reserveByCycle[0] > 0, "surplus held back ahead of a coming crunch (cap→0)");

	// ── suggestLean: only finite-positive actuals count; empty → currentLean unchanged; finite output ──
	for (const typical of BAD_NUMS) {
		for (const lean of BAD_NUMS) {
			for (const arr of BAD_ARRAYS) {
				let r!: ReturnType<typeof suggestLean>;
				noThrow(() => { r = suggestLean(arr, typical, lean); }, "suggestLean no crash");
				assertTrue(Number.isFinite(r.suggestedLean), "suggestLean suggestedLean finite (never NaN/Inf)");
				assertTrue(r.n === arr.filter((a) => Number.isFinite(a) && a > 0).length, "suggestLean n counts only finite-positive actuals");
			}
		}
	}
	// No usable actuals → returns the current lean untouched (rounded), n=0.
	assertEqual(suggestLean([NaN, -5, 0, Infinity], 3000, 1500).suggestedLean, 1500, "no usable actuals → currentLean unchanged");
	assertEqual(suggestLean([], 3000, 1500).n, 0, "empty actuals → n 0");
	// Low-N shrinkage floor = typical × (1 − haircut) when a valid typical is present.
	assertEqual(suggestLean([2000, 2100, 1950], 3000, 0).suggestedLean, 2550, "low-N shrinkage = typical × 0.85 (3000 → 2550)");
	// Single actual, no valid typical → anchors to the max of the actuals (not a crash / not 0).
	assertTrue(suggestLean([1800], NaN, 0).suggestedLean > 0, "single actual + bad typical → positive suggestion (anchored to actual)");

	console.log(`✅ Engine fuzz (RS.4) tests passed (${passed} asserts).`);
}

runEngineFuzzTests();
