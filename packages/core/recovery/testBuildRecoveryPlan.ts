/**
 * §2.6 reconciliation tests for the Recovery Plan engine — largest-first ranking, the minimal suggested
 * defer set + running gap-close, the closeable/residual honesty branch, and the money/edge guards.
 */
import { buildRecoveryPlan, type RecoveryCandidate } from "@core/recovery/buildRecoveryPlan";

function assertEq(actual: unknown, expected: unknown, label: string) {
	if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`FAIL [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function assertTrue(cond: boolean, label: string) {
	if (!cond) throw new Error(`FAIL [${label}]`);
}

const D = (id: string, amount: number): RecoveryCandidate => ({ id, name: id, amount });

// Ranked largest-first; the minimal prefix that first covers the gap is "suggested".
{
	// gap 30; deferrable 16 + 12 + 9 = 37. Largest-first: 16, 12, 9. 16 < 30, +12 = 28 < 30, +9 = 37 ≥ 30.
	const plan = buildRecoveryPlan({ gap: 30, deferrable: [D("gym", 9), D("netflix", 16), D("news", 12)] });
	assertEq(plan.safeToDefer.map((i) => i.id), ["netflix", "news", "gym"], "ranked largest-first");
	assertEq(plan.safeToDefer.map((i) => i.suggested), [true, true, true], "all three needed to cross the gap");
	assertEq(plan.suggestedDeferIds, ["netflix", "news", "gym"], "suggested set = the covering prefix");
	assertEq(plan.safeToDefer.map((i) => i.cumulativeClosed), [16, 28, 30], "running close caps at the gap (28→30, not 37)");
	assertTrue(plan.closeable, "37 deferrable ≥ 30 gap → closeable");
	assertEq(plan.residualGap, 0, "closeable → no residual");
}

// A single large defer covers the gap → only it is suggested; the rest are optional.
{
	const plan = buildRecoveryPlan({ gap: 20, deferrable: [D("big", 50), D("small", 10)] });
	assertEq(plan.suggestedDeferIds, ["big"], "the $50 alone covers the $20 gap");
	assertEq(plan.safeToDefer.map((i) => i.suggested), [true, false], "the small one is not needed");
}

// Un-closeable: deferring EVERYTHING deferrable still leaves a residual → honest branch.
{
	const plan = buildRecoveryPlan({ gap: 100, deferrable: [D("a", 20), D("b", 15)] });
	assertTrue(!plan.closeable, "35 deferrable < 100 gap → not closeable");
	assertEq(plan.residualGap, 65, "residual = 100 − 35");
	assertEq(plan.suggestedDeferIds, ["a", "b"], "suggest deferring all, but it still won't close");
}

// No deferrable at all → un-closeable, residual = full gap.
{
	const plan = buildRecoveryPlan({ gap: 40, deferrable: [] });
	assertTrue(!plan.closeable, "no deferrable → not closeable");
	assertEq(plan.residualGap, 40, "residual = the whole gap");
	assertEq(plan.suggestedDeferIds, [], "nothing to suggest");
}

// No gap (defensive) → closeable, nothing suggested, no residual.
{
	const plan = buildRecoveryPlan({ gap: 0, deferrable: [D("x", 10)] });
	assertTrue(plan.closeable, "gap 0 → trivially closeable");
	assertEq(plan.suggestedDeferIds, [], "gap 0 → suggest nothing");
	assertEq(plan.residualGap, 0, "gap 0 → no residual");
}

// A defer that exactly equals the gap closes it (epsilon-safe, no float dust).
{
	const plan = buildRecoveryPlan({ gap: 15, deferrable: [D("exact", 15)] });
	assertTrue(plan.closeable, "exact match closes the gap");
	assertEq(plan.suggestedDeferIds, ["exact"], "the exact-match defer is suggested");
	assertEq(plan.residualGap, 0, "exact match → no residual");
}

// coverNow (essentials) passes through untouched; non-positive deferrable amounts are dropped.
{
	const plan = buildRecoveryPlan({ gap: 10, deferrable: [D("z", 0), D("y", 12)], essential: [D("rent", 1200)] });
	assertEq(plan.coverNow.map((i) => i.id), ["rent"], "essentials pass through as cover-now");
	assertEq(plan.safeToDefer.map((i) => i.id), ["y"], "a $0 deferrable is dropped");
}

console.log("✅ §2.6 buildRecoveryPlan tests passed.");
