import { selectActiveRecommendedActions } from "./selectActiveRecommendedActions";
import type { allocatePaycheck } from "@core/engine/allocatePaycheck";
import type { Debt, CompletedRecommendedAction } from "@core/storage/debtPlannerStorage";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(`${label} failed. Expected ${String(expected)}, received ${String(actual)}`);
    }
}

function debt(over: Partial<Debt> & { id: string }): Debt {
    return {
        name: "Debt", balance: 500, minimumPayment: 25, dueDate: "2026-06-01",
        apr: 20, type: "debt", recurrence: "monthly", ...over,
    };
}

// A result whose only lever the selector reads is flexible cash: paycheck minus
// required/reserve/buffer/completed. No emergency/leftover allocations here, so
// snowball recommendations come purely from the debts.
function makeResult(over: Partial<AllocationResult> = {}): AllocationResult {
    return {
        paycheckAmount: 2000, totalRequired: 0, livingExpenseReserve: 0,
        allocations: [], unfundedRequiredItems: [], remaining: 0, shortfall: 0,
        affordableUnpaidRequiredCount: 0, ...over,
    };
}

function run() {
    // ── single debt, ample cash → one snowball action for the full balance ──
    {
        const actions = selectActiveRecommendedActions({
            result: makeResult(), debts: [debt({ id: "visa", name: "Visa", balance: 500 })],
            goals: [], payoffStrategy: "snowball", recommendationOverrides: [], completedRecommendedActions: [],
        });
        assertEqual(actions.length, 1, "single debt → one recommendation");
        assertEqual(actions[0].targetId, "visa", "targets the debt");
        assertEqual(actions[0].category, "snowball", "snowball category");
        assertEqual(actions[0].recommendedAmount, 500, "recommended = full balance");
        assertEqual(actions[0].actualAmount, 500, "ample cash funds the full balance");
        assertEqual(actions[0].label, "Extra payment to Visa", "label from debt name");
    }

    // ── snowball orders by ascending balance ──
    {
        const actions = selectActiveRecommendedActions({
            result: makeResult(),
            debts: [debt({ id: "big", balance: 800 }), debt({ id: "small", balance: 200 })],
            goals: [], payoffStrategy: "snowball", recommendationOverrides: [], completedRecommendedActions: [],
        });
        assertEqual(actions[0].targetId, "small", "snowball: smallest balance first");
        assertEqual(actions[1].targetId, "big", "snowball: larger balance second");
    }

    // ── avalanche orders by descending APR ──
    {
        const actions = selectActiveRecommendedActions({
            result: makeResult(),
            debts: [debt({ id: "lo", balance: 300, apr: 10 }), debt({ id: "hi", balance: 300, apr: 25 })],
            goals: [], payoffStrategy: "avalanche", recommendationOverrides: [], completedRecommendedActions: [],
        });
        assertEqual(actions[0].targetId, "hi", "avalanche: highest APR first");
    }

    // ── flexible cash caps the funded amount ──
    {
        // paycheck 100, nothing else → flexible cash = 100; a 500 debt gets 100.
        const actions = selectActiveRecommendedActions({
            result: makeResult({ paycheckAmount: 100 }),
            debts: [debt({ id: "visa", balance: 500 })],
            goals: [], payoffStrategy: "snowball", recommendationOverrides: [], completedRecommendedActions: [],
        });
        assertEqual(actions[0].recommendedAmount, 500, "recommended is still the full balance");
        assertEqual(actions[0].actualAmount, 100, "actual is capped at available flexible cash");
    }

    // ── completed snowball this cycle reduces the debt's remaining balance ──
    {
        const completed: CompletedRecommendedAction[] = [
            { targetId: "visa", label: "Extra payment to Visa", category: "snowball", recommendedAmount: 200, actualAmount: 200, paymentSource: "paycheck" },
        ];
        const actions = selectActiveRecommendedActions({
            result: makeResult(), debts: [debt({ id: "visa", name: "Visa", balance: 500 })],
            goals: [], payoffStrategy: "snowball", recommendationOverrides: [], completedRecommendedActions: completed,
        });
        // 500 balance − 200 already paid = 300 remaining recommended.
        assertEqual(actions[0].recommendedAmount, 300, "remaining balance nets out completed snowball");
    }

    console.log("✅ selectActiveRecommendedActions regression tests passed.");
}

run();
