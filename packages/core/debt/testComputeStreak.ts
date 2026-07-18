import { computeStreak, isCycleOnPlan } from "./computeStreak";
import type { PayCycleSnapshot } from "@core/storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

// allRequiredMet -> a snapshot; other fields don't affect the streak.
function cycle(allRequiredMet: boolean): PayCycleSnapshot {
    return {
        cycleEndDate: "2026-01-15",
        totalDebtBalance: 1000,
        totalPaidThisCycle: 0,
        allRequiredMet,
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
    };
}

function runComputeStreakTests() {
    // Empty history -> 0.
    assertEqual(computeStreak([]), 0, "empty history streak is 0");

    // A run of on-plan cycles -> full count.
    assertEqual(
        computeStreak([cycle(true), cycle(true), cycle(true)]),
        3,
        "all-on-plan run counts every cycle"
    );

    // A broken streak: only the most-recent consecutive run counts.
    // [ok, MISS, ok, ok] (oldest-first) -> most recent two qualify -> 2.
    assertEqual(
        computeStreak([cycle(true), cycle(false), cycle(true), cycle(true)]),
        2,
        "streak counts only the most-recent consecutive run"
    );

    // Most recent cycle broke the streak -> 0 even if older ones qualified.
    assertEqual(
        computeStreak([cycle(true), cycle(true), cycle(false)]),
        0,
        "a broken most-recent cycle resets the streak to 0"
    );

    // On-plan = completed everything required and affordable.
    assertEqual(isCycleOnPlan(cycle(true)), true, "all affordable required met is on plan");

    // Leaving an affordable required action unpaid breaks the streak.
    assertEqual(isCycleOnPlan(cycle(false)), false, "an affordable required action skipped is off plan");

    // Recommended extras have ZERO bearing: an on-plan cycle with no extra paid
    // still counts (the whole point of the v1.5 rewrite).
    assertEqual(
        isCycleOnPlan({ ...cycle(true), totalPaidThisCycle: 0 }),
        true,
        "recommended extras do not affect the on-plan determination"
    );

    // Legacy snapshot (pre-v1.5, no allRequiredMet) defaults to on-plan so a fix
    // never retroactively zeroes an existing user's streak.
    const legacy: PayCycleSnapshot = {
        cycleEndDate: "2026-01-15",
        totalDebtBalance: 1000,
        totalPaidThisCycle: 0,
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
    };
    assertEqual(computeStreak([legacy]), 1, "legacy snapshot without allRequiredMet qualifies (on-plan default)");

    console.log("✅ Streak regression tests passed.");
}

runComputeStreakTests();
