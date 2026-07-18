import {
    buildPaydayCaptureItems,
    captureKey,
    type RecommendedActionInput,
} from "./buildPaydayCaptureItems";
import { upsertCompletedAction } from "./mergeCompletedAction";
import { markGoal, unmarkGoal } from "./reconcileGoalAmount";
import { computeCompletedRecommendedTotal } from "@/lib/engine/recommendedActions";
import type { CompletedRecommendedAction } from "@/lib/storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
    }
}

const PLAN: RecommendedActionInput[] = [
    { targetId: "visa", label: "Extra to Visa", category: "snowball", recommendedAmount: 300, actualAmount: 300 },
    { targetId: "emg", label: "Add to Emergency Fund", category: "emergency", recommendedAmount: 100, actualAmount: 100 },
    { targetId: "vac", label: "Add to Vacation", category: "optional_goal", recommendedAmount: 50, actualAmount: 50 },
];

function runPaydayCaptureTests() {
    // ─── one-tap "I followed the plan": actual === recommended, all paycheck ───
    {
        const items = buildPaydayCaptureItems(PLAN);
        assertEqual(items.length, 3, "one-tap: captures every active action");
        for (const it of items) {
            assertEqual(it.actualAmount, it.recommendedAmount, `one-tap: ${it.label} actual === recommended`);
            assertEqual(it.paymentSource, "paycheck", `one-tap: ${it.label} defaults to paycheck`);
        }
    }

    // ─── two amounts: default paid = the cycle's actualAmount (capacity-limited),
    //     NOT recommendedAmount (the full payoff room) — matches the Plan tab ───
    {
        const items = buildPaydayCaptureItems(
            [{ targetId: "visa", label: "Extra to Visa", category: "snowball", recommendedAmount: 500, actualAmount: 200 }]
        );
        assertEqual(items[0].recommendedAmount, 500, "stores the full payoff room as recommendedAmount");
        assertEqual(items[0].actualAmount, 200, "default paid = the capacity-limited cycle recommendation");
    }

    // ─── v1.6 collision regression (the HIGH silent-skip fix): the active list is
    //     already the net-REMAINING recommendation, so every item is captured — a
    //     re-recommended remainder is NEVER dropped just because a same-key partial
    //     was completed earlier. (The old `alreadyCompleted` skip did exactly that.)
    {
        const remainderItems = buildPaydayCaptureItems(
            [{ targetId: "visa", label: "Extra to Visa", category: "snowball", recommendedAmount: 300, actualAmount: 200 }]
        );
        assertEqual(remainderItems.length, 1, "remainder is captured, not silently skipped");

        // …and it ACCUMULATES into the completed partial rather than colliding:
        const partial: CompletedRecommendedAction = {
            targetId: "visa", label: "Extra to Visa", category: "snowball",
            recommendedAmount: 300, actualAmount: 100, paymentSource: "paycheck",
        };
        const merged = upsertCompletedAction([partial], remainderItems[0]);
        assertEqual(merged.length, 1, "remainder folds into the partial (no colliding duplicate)");
        assertEqual(merged[0].actualAmount, 300, "actualAmount accumulates (100 partial + 200 remainder)");
        assertEqual(merged[0].recommendedAmount, 300, "recommendedAmount stays the full payoff room");
    }

    // ─── a paycheck contribution stays DISTINCT from an external one to the same
    //     goal (external must remain excluded from the paycheck cash total) ───
    {
        const external: CompletedRecommendedAction = {
            targetId: "emg", label: "Add to Emergency Fund", category: "emergency",
            recommendedAmount: 500, actualAmount: 75, paymentSource: "external",
        };
        const paycheckItem: CompletedRecommendedAction = {
            targetId: "emg", label: "Add to Emergency Fund", category: "emergency",
            recommendedAmount: 500, actualAmount: 425, paymentSource: "paycheck",
        };
        const merged = upsertCompletedAction([external], paycheckItem);
        assertEqual(merged.length, 2, "paycheck contribution stays separate from the external one");
        assertEqual(computeCompletedRecommendedTotal(merged), 425, "only the paycheck 425 counts against cash");
    }

    // ─── adjust: per-item real amount override ───
    {
        const items = buildPaydayCaptureItems(PLAN, {
            [captureKey(PLAN[0])]: { actualAmount: 175 },
        });
        const visa = items.find((i) => i.targetId === "visa")!;
        assertEqual(visa.actualAmount, 175, "override sets the real actual amount");
        assertEqual(visa.recommendedAmount, 300, "override preserves the recommended amount (for drift)");
    }

    // ─── external: paid from elsewhere → paymentSource external ───
    {
        const items = buildPaydayCaptureItems(PLAN, {
            [captureKey(PLAN[1])]: { external: true },
        });
        const emg = items.find((i) => i.targetId === "emg")!;
        assertEqual(emg.paymentSource, "external", "external toggle sets paymentSource");
    }

    // ─── INTEGRATION: external is excluded from the flex-cash total ───
    {
        // Visa 300 + Emergency 100 (external) + Vacation 50 → cash total excludes the 100.
        const items = buildPaydayCaptureItems(PLAN, {
            [captureKey(PLAN[1])]: { external: true },
        });
        assertEqual(
            computeCompletedRecommendedTotal(items),
            350,
            "external payment is excluded from the paycheck cash total (300 + 50)"
        );
    }
    {
        // one-tap (all paycheck) → full 450 counts against cash.
        const items = buildPaydayCaptureItems(PLAN);
        assertEqual(computeCompletedRecommendedTotal(items), 450, "all-paycheck capture counts the full 450");
    }

    // ─── INTEGRATION: a captured GOAL action reconciles (rides step 1.4) ───
    // Capture the emergency-goal action for 100 against a goal at 200/1000, then
    // unmark it — currentAmount must return exactly to 200 (no balance drift).
    {
        const items = buildPaydayCaptureItems(
            [{ targetId: "emg", label: "Add to Emergency Fund", category: "emergency", recommendedAmount: 100, actualAmount: 100 }]
        );
        const captured = items[0];
        const { appliedAmount, nextCurrentAmount } = markGoal(200, 1000, captured.actualAmount);
        assertEqual(nextCurrentAmount, 300, "captured goal action funds the goal (+100)");
        assertEqual(unmarkGoal(nextCurrentAmount, appliedAmount), 200, "un-capturing reconciles the goal exactly");
    }

    console.log("✅ Payday Autopilot capture regression tests passed.");
}

runPaydayCaptureTests();
