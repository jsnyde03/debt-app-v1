/**
 * Reconciliation tests for §2.5 crunch detection (2.4.7.3). Asserts segments are the maximal below-floor
 * runs, the trough is the minimum in each run, and the deficit = floor − trough.
 */
import { detectCrunches, type CrunchSegment } from "@core/cashflow/detectCrunches";

function assert(cond: boolean, label: string) {
	if (!cond) throw new Error(`FAIL [${label}]`);
}
function assertEqual<T>(a: T, b: T, label: string) {
	if (a !== b) throw new Error(`FAIL [${label}]: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
function only(segs: CrunchSegment[], label: string): CrunchSegment {
	assertEqual(segs.length, 1, `${label} (exactly one segment)`);
	return segs[0];
}

const FLOOR = 200;

// No crunch — everything at or above the floor.
assertEqual(detectCrunches([500, 300, 200, 250], FLOOR).length, 0, "no crunch when all >= floor");

// The floor itself is not a crunch (strictly below only).
assertEqual(detectCrunches([200, 200, 200], FLOOR).length, 0, "exactly at the floor is not a crunch");

// One multi-cycle crunch, trough in the middle.
{
	const s = only(detectCrunches([500, 150, 80, 160, 400], FLOOR), "single crunch");
	assertEqual(s.startIndex, 1, "starts at the first below-floor cycle");
	assertEqual(s.endIndex, 3, "ends at the last below-floor cycle");
	assertEqual(s.troughIndex, 2, "trough is the deepest cycle (80)");
	assertEqual(s.troughDeficit, 120, "deficit = floor(200) − trough(80)");
}

// Two separate crunches split by a recovery above the floor.
{
	const segs = detectCrunches([100, 300, 50, 250], FLOOR);
	assertEqual(segs.length, 2, "two separate crunch segments");
	assertEqual(segs[0].startIndex, 0, "first crunch at index 0");
	assertEqual(segs[0].troughDeficit, 100, "first deficit = 200 − 100");
	assertEqual(segs[1].startIndex, 2, "second crunch at index 2");
	assertEqual(segs[1].troughDeficit, 150, "second deficit = 200 − 50");
}

// A crunch that runs to the end of the horizon flushes correctly.
{
	const s = only(detectCrunches([400, 180, 90], FLOOR), "crunch to end-of-horizon");
	assertEqual(s.endIndex, 2, "closes at the last cycle");
	assertEqual(s.troughDeficit, 110, "deficit = 200 − 90");
}

// Single-cycle crunch.
{
	const s = only(detectCrunches([300, 10, 300], FLOOR), "single-cycle crunch");
	assertEqual(s.startIndex, 1, "start == end for a one-cycle dip");
	assertEqual(s.endIndex, 1, "start == end for a one-cycle dip");
	assertEqual(s.troughDeficit, 190, "deficit = 200 − 10");
}

// A negative (un-clamped) balance — a genuine deep crunch — is handled, not erased.
{
	const s = only(detectCrunches([500, -50], FLOOR), "negative-balance crunch");
	assertEqual(s.troughDeficit, 250, "deficit = 200 − (−50) = 250");
}

assert(true, "reached the end");
console.log("✅ Crunch-detection (2.4.7.3) tests passed.");
