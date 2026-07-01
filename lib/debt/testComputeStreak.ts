import { computeStreak } from "./computeStreak";
import type { PayCycleSnapshot } from "../storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

// paid/required -> a snapshot; other fields don't affect the streak.
function cycle(paid: number, required: number): PayCycleSnapshot {
    return {
        cycleEndDate: "2026-01-15",
        totalDebtBalance: 1000,
        totalPaidThisCycle: paid,
        recommendedThisCycle: required,
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
    };
}

function runComputeStreakTests() {
    // Empty history -> 0.
    assertEqual(computeStreak([]), 0, "empty history streak is 0");

    // A run of qualifying cycles -> full count.
    assertEqual(
        computeStreak([cycle(200, 150), cycle(200, 200), cycle(300, 250)]),
        3,
        "all-qualifying run counts every cycle"
    );

    // A broken streak: only the most-recent consecutive run counts.
    // [ok, MISS, ok, ok] (oldest-first) -> most recent two qualify -> 2.
    assertEqual(
        computeStreak([cycle(200, 150), cycle(100, 200), cycle(200, 200), cycle(300, 250)]),
        2,
        "streak counts only the most-recent consecutive run"
    );

    // Most recent cycle broke the streak -> 0 even if older ones qualified.
    assertEqual(
        computeStreak([cycle(200, 150), cycle(200, 150), cycle(100, 200)]),
        0,
        "a broken most-recent cycle resets the streak to 0"
    );

    // Exactly meeting the requirement qualifies (>=, not >).
    assertEqual(computeStreak([cycle(150, 150)]), 1, "paying exactly the required amount qualifies");

    // Plan asked for nothing extra -> qualifies even with 0 paid.
    assertEqual(computeStreak([cycle(0, 0)]), 1, "a zero-required cycle qualifies");

    // Legacy snapshot missing recommendedThisCycle (undefined -> 0) qualifies.
    const legacy: PayCycleSnapshot = {
        cycleEndDate: "2026-01-15",
        totalDebtBalance: 1000,
        totalPaidThisCycle: 0,
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
    };
    assertEqual(computeStreak([legacy]), 1, "legacy snapshot without required field qualifies");

    console.log("✅ Streak regression tests passed.");
}

runComputeStreakTests();
