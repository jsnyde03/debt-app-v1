import { applyPaydayCapture } from "./applyPaydayCapture";
import type { Goal, CompletedRecommendedAction } from "@core/storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
    }
}

function goal(over: Partial<Goal> & { id: string }): Goal {
    return { name: "Goal", targetAmount: 1000, currentAmount: 0, type: "savings", ...over };
}
function item(over: Partial<CompletedRecommendedAction> & { targetId: string }): CompletedRecommendedAction {
    return { label: "Extra", category: "emergency", recommendedAmount: 100, actualAmount: 100, paymentSource: "paycheck", ...over };
}

function run() {
    // ── single goal capture funds the goal + records the action ──
    {
        const { nextGoals, nextCompleted } = applyPaydayCapture(
            [item({ targetId: "g", actualAmount: 100 })],
            [goal({ id: "g", currentAmount: 0 })],
            []
        );
        assertEqual(nextGoals[0].currentAmount, 100, "goal funded by the captured amount");
        assertEqual(nextCompleted.length, 1, "one action captured");
        assertEqual(nextCompleted[0].actualAmount, 100, "stores the applied amount");
    }

    // ── snowball action has no goal side-effect ──
    {
        const { nextGoals, nextCompleted } = applyPaydayCapture(
            [item({ targetId: "d1", category: "snowball", actualAmount: 200 })],
            [goal({ id: "g", currentAmount: 50 })],
            []
        );
        assertEqual(nextGoals[0].currentAmount, 50, "snowball capture leaves goals untouched");
        assertEqual(nextCompleted[0].actualAmount, 200, "snowball action recorded as-is");
    }

    // ── THE reason this exists: multiple actions on the SAME goal accumulate in
    //    ONE pass (a naive loop over the single-mark handler would drop all but one) ──
    {
        const { nextGoals } = applyPaydayCapture(
            [
                item({ targetId: "g", actualAmount: 100 }),
                item({ targetId: "g", label: "Extra 2", actualAmount: 150 }),
            ],
            [goal({ id: "g", currentAmount: 0, targetAmount: 1000 })],
            []
        );
        assertEqual(nextGoals[0].currentAmount, 250, "both fundings apply in one pass (100 + 150)");
    }

    // ── over-room capture clamps (reconciliation-safe) ──
    {
        const { nextGoals, nextCompleted } = applyPaydayCapture(
            [item({ targetId: "g", actualAmount: 300 })],
            [goal({ id: "g", currentAmount: 900, targetAmount: 1000 })],
            []
        );
        assertEqual(nextGoals[0].currentAmount, 1000, "goal caps at target");
        assertEqual(nextCompleted[0].actualAmount, 100, "stores only the applied (clamped) amount");
    }

    // ── external payment still funds the goal (only excluded from CASH downstream) ──
    {
        const { nextGoals } = applyPaydayCapture(
            [item({ targetId: "g", actualAmount: 100, paymentSource: "external" })],
            [goal({ id: "g", currentAmount: 0 })],
            []
        );
        assertEqual(nextGoals[0].currentAmount, 100, "external capture still funds the goal");
    }

    // ── appends to existing completed actions ──
    {
        const existing = item({ targetId: "old", label: "Old" });
        const { nextCompleted } = applyPaydayCapture(
            [item({ targetId: "g" })],
            [goal({ id: "g" })],
            [existing]
        );
        assertEqual(nextCompleted.length, 2, "captured actions append to the existing list");
    }

    console.log("✅ applyPaydayCapture regression tests passed.");
}

run();
