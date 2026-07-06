import {
    buildPaydayCaptureItems,
    captureKey,
    type RecommendedActionInput,
} from "./buildPaydayCaptureItems";
import { markGoal, unmarkGoal } from "./reconcileGoalAmount";
import { computeCompletedRecommendedTotal } from "../engine/recommendedActions";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
    }
}

const PLAN: RecommendedActionInput[] = [
    { targetId: "visa", label: "Extra to Visa", category: "snowball", recommendedAmount: 300 },
    { targetId: "emg", label: "Add to Emergency Fund", category: "emergency", recommendedAmount: 100 },
    { targetId: "vac", label: "Add to Vacation", category: "optional_goal", recommendedAmount: 50 },
];

function runPaydayCaptureTests() {
    // ─── one-tap "I followed the plan": actual === recommended, all paycheck ───
    {
        const items = buildPaydayCaptureItems(PLAN, []);
        assertEqual(items.length, 3, "one-tap: captures every not-yet-done action");
        for (const it of items) {
            assertEqual(it.actualAmount, it.recommendedAmount, `one-tap: ${it.label} actual === recommended`);
            assertEqual(it.paymentSource, "paycheck", `one-tap: ${it.label} defaults to paycheck`);
        }
    }

    // ─── idempotent: already-captured actions are skipped (no double count) ───
    {
        const alreadyDone = [{ targetId: "visa", label: "Extra to Visa", category: "snowball" as const }];
        const items = buildPaydayCaptureItems(PLAN, alreadyDone);
        assertEqual(items.length, 2, "skips the already-captured Visa action");
        assertEqual(items.some((i) => i.targetId === "visa"), false, "Visa is not re-captured");
    }

    // ─── adjust: per-item real amount override ───
    {
        const items = buildPaydayCaptureItems(PLAN, [], {
            [captureKey(PLAN[0])]: { actualAmount: 175 },
        });
        const visa = items.find((i) => i.targetId === "visa")!;
        assertEqual(visa.actualAmount, 175, "override sets the real actual amount");
        assertEqual(visa.recommendedAmount, 300, "override preserves the recommended amount (for drift)");
    }

    // ─── external: paid from elsewhere → paymentSource external ───
    {
        const items = buildPaydayCaptureItems(PLAN, [], {
            [captureKey(PLAN[1])]: { external: true },
        });
        const emg = items.find((i) => i.targetId === "emg")!;
        assertEqual(emg.paymentSource, "external", "external toggle sets paymentSource");
    }

    // ─── INTEGRATION: external is excluded from the flex-cash total ───
    {
        // Visa 300 + Emergency 100 (external) + Vacation 50 → cash total excludes the 100.
        const items = buildPaydayCaptureItems(PLAN, [], {
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
        const items = buildPaydayCaptureItems(PLAN, []);
        assertEqual(computeCompletedRecommendedTotal(items), 450, "all-paycheck capture counts the full 450");
    }

    // ─── INTEGRATION: a captured GOAL action reconciles (rides step 1.4) ───
    // Capture the emergency-goal action for 100 against a goal at 200/1000, then
    // unmark it — currentAmount must return exactly to 200 (no balance drift).
    {
        const items = buildPaydayCaptureItems(
            [{ targetId: "emg", label: "Add to Emergency Fund", category: "emergency", recommendedAmount: 100 }],
            []
        );
        const captured = items[0];
        const { appliedAmount, nextCurrentAmount } = markGoal(200, 1000, captured.actualAmount);
        assertEqual(nextCurrentAmount, 300, "captured goal action funds the goal (+100)");
        assertEqual(unmarkGoal(nextCurrentAmount, appliedAmount), 200, "un-capturing reconciles the goal exactly");
    }

    console.log("✅ Payday Autopilot capture regression tests passed.");
}

runPaydayCaptureTests();
