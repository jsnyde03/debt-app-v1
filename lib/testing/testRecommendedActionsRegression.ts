import {
    computeFlexibleCash,
    computeCompletedSnowballByDebt,
    computeCompletedRecommendedTotal,
    buildActiveRecommendedActions,
} from "../engine/recommendedActions";
import type { CompletedRecommendedAction, Goal } from "../storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (actual !== expected) {
        throw new Error(`FAIL [${msg}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    console.log(`  ✓ ${msg}`);
}

function assertApprox(actual: number, expected: number, msg: string, tolerance = 0.01) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`FAIL [${msg}]: expected ~${expected}, got ${actual}`);
    }
    console.log(`  ✓ ${msg}`);
}

type FakeAllocationItem = {
    category: string;
    label: string;
    amount: number;
    targetId?: string;
    debtId?: string;
};

function makeItem(overrides: Partial<FakeAllocationItem>): FakeAllocationItem {
    return {
        category: "snowball",
        label: "Extra payment",
        amount: 200,
        targetId: "d1",
        ...overrides,
    };
}

function makeGoal(overrides: Partial<Goal> & { id: string }): Goal {
    return {
        id: overrides.id,
        name: overrides.name ?? "Test Goal",
        targetAmount: overrides.targetAmount ?? 1000,
        currentAmount: overrides.currentAmount ?? 0,
        type: overrides.type ?? "emergency",
    };
}

// --- computeFlexibleCash ---

function testFlexibleCash_basic() {
    const result = computeFlexibleCash({
        paycheckAmount: 2400,
        totalRequired: 1000,
        livingExpenseReserve: 300,
        bufferTotal: 50,
        completedRecommendedTotal: 100,
    });
    assertEqual(result, 950, "basic flexible cash formula");
}

function testFlexibleCash_neverNegative() {
    const result = computeFlexibleCash({
        paycheckAmount: 1000,
        totalRequired: 1500,
        livingExpenseReserve: 0,
        bufferTotal: 0,
        completedRecommendedTotal: 0,
    });
    assertEqual(result, 0, "flexible cash cannot go below zero");
}

function testFlexibleCash_allZeroCosts() {
    const result = computeFlexibleCash({
        paycheckAmount: 2000,
        totalRequired: 0,
        livingExpenseReserve: 0,
        bufferTotal: 0,
        completedRecommendedTotal: 0,
    });
    assertEqual(result, 2000, "flexible cash equals paycheck when no costs");
}

function testFlexibleCash_exactlyZeroWhenBreakEven() {
    const result = computeFlexibleCash({
        paycheckAmount: 1000,
        totalRequired: 800,
        livingExpenseReserve: 100,
        bufferTotal: 50,
        completedRecommendedTotal: 50,
    });
    assertEqual(result, 0, "flexible cash is zero at break-even");
}

function testFlexibleCash_completedActionsReduceCapacity() {
    const base = computeFlexibleCash({
        paycheckAmount: 2400,
        totalRequired: 1000,
        livingExpenseReserve: 200,
        bufferTotal: 50,
        completedRecommendedTotal: 0,
    });
    const afterAction = computeFlexibleCash({
        paycheckAmount: 2400,
        totalRequired: 1000,
        livingExpenseReserve: 200,
        bufferTotal: 50,
        completedRecommendedTotal: 200,
    });
    assertEqual(base - afterAction, 200, "completed paycheck actions reduce flexible cash by that amount");
}

// --- computeCompletedRecommendedTotal ---

function testCompletedTotal_excludesExternalPayments() {
    const actions: CompletedRecommendedAction[] = [
        { targetId: "g1", label: "Emergency Fund", category: "emergency", recommendedAmount: 100, actualAmount: 100, paymentSource: "paycheck" },
        { targetId: "g1", label: "Emergency Fund", category: "emergency", recommendedAmount: 200, actualAmount: 200, paymentSource: "external" },
    ];
    const total = computeCompletedRecommendedTotal(actions);
    assertEqual(total, 100, "external payments are excluded from total that reduces flex cash");
}

function testCompletedTotal_includesAllNonExternal() {
    const actions: CompletedRecommendedAction[] = [
        { targetId: "d1", label: "Extra to Visa", category: "snowball", recommendedAmount: 150, actualAmount: 150, paymentSource: "paycheck" },
        { targetId: "g1", label: "Emergency Fund", category: "emergency", recommendedAmount: 75, actualAmount: 75, paymentSource: "paycheck" },
        { targetId: "g2", label: "Optional Goal", category: "optional_goal", recommendedAmount: 50, actualAmount: 50 },
    ];
    const total = computeCompletedRecommendedTotal(actions);
    assertEqual(total, 275, "all non-external actions sum into the total");
}

function testCompletedTotal_emptyArrayIsZero() {
    assertEqual(computeCompletedRecommendedTotal([]), 0, "empty completed actions = zero total");
}

// --- computeCompletedSnowballByDebt ---

function testSnowballByDebt_groupsMultipleActionsForSameDebt() {
    const actions: CompletedRecommendedAction[] = [
        { targetId: "d1", label: "Extra to Visa", category: "snowball", recommendedAmount: 100, actualAmount: 100, paymentSource: "paycheck" },
        { targetId: "d1", label: "Extra to Visa", category: "snowball", recommendedAmount: 50, actualAmount: 50, paymentSource: "paycheck" },
        { targetId: "d2", label: "Extra to Car", category: "snowball", recommendedAmount: 200, actualAmount: 200, paymentSource: "paycheck" },
    ];
    const map = computeCompletedSnowballByDebt(actions);
    assertEqual(map["d1"], 150, "two snowball payments for d1 are summed");
    assertEqual(map["d2"], 200, "d2 snowball is separate");
}

function testSnowballByDebt_ignoresNonSnowball() {
    const actions: CompletedRecommendedAction[] = [
        { targetId: "g1", label: "Emergency Fund", category: "emergency", recommendedAmount: 300, actualAmount: 300, paymentSource: "paycheck" },
        { targetId: "d1", label: "Extra to Visa", category: "snowball", recommendedAmount: 100, actualAmount: 100, paymentSource: "paycheck" },
    ];
    const map = computeCompletedSnowballByDebt(actions);
    assertEqual(Object.keys(map).length, 1, "only snowball category creates an entry");
    assertEqual(map["g1"], undefined, "emergency action is not in the snowball map");
}

function testSnowballByDebt_emptyReturnsEmptyMap() {
    const map = computeCompletedSnowballByDebt([]);
    assertEqual(Object.keys(map).length, 0, "empty actions yields empty snowball map");
}

// --- buildActiveRecommendedActions ---

function testActiveRecommendations_capacityCapsSingleAction() {
    const actions = buildActiveRecommendedActions({
        recommendedActions: [makeItem({ amount: 500 })] as never,
        flexibleCashAvailable: 200,
        goals: [],
    });
    assertEqual(actions.length, 1, "one recommendation returned");
    assertEqual(actions[0].actualAmount, 200, "recommendation capped at flexible cash");
    assertEqual(actions[0].recommendedAmount, 500, "recommendedAmount reflects full engine amount");
}

function testActiveRecommendations_noActionsWhenZeroCapacity() {
    const actions = buildActiveRecommendedActions({
        recommendedActions: [makeItem({ amount: 300 })] as never,
        flexibleCashAvailable: 0,
        goals: [],
    });
    assertEqual(actions.length, 0, "no recommendations when flexible cash is zero");
}

function testActiveRecommendations_stopsWhenCapacityExhausted() {
    const actions = buildActiveRecommendedActions({
        recommendedActions: [
            makeItem({ targetId: "d1", label: "Extra to Visa", amount: 300 }),
            makeItem({ targetId: "d2", label: "Extra to Car", amount: 200 }),
        ] as never,
        flexibleCashAvailable: 300,
        goals: [],
    });
    assertEqual(actions.length, 1, "second recommendation skipped when first consumed all capacity");
    assertEqual(actions[0].targetId, "d1", "first recommendation was for d1");
}

function testActiveRecommendations_splitsCapacityAcrossMultiple() {
    const actions = buildActiveRecommendedActions({
        recommendedActions: [
            makeItem({ targetId: "d1", label: "Extra to Visa", amount: 200 }),
            makeItem({ targetId: "d2", label: "Extra to Car", amount: 200 }),
        ] as never,
        flexibleCashAvailable: 350,
        goals: [],
    });
    assertEqual(actions.length, 2, "both recommendations fit within capacity");
    assertEqual(actions[0].actualAmount, 200, "first gets full amount");
    assertEqual(actions[1].actualAmount, 150, "second gets remainder of capacity");
}

function testActiveRecommendations_goalCapsAtRemainder() {
    const goal = makeGoal({ id: "g1", name: "Emergency Fund", targetAmount: 500, currentAmount: 350, type: "emergency" });
    const actions = buildActiveRecommendedActions({
        recommendedActions: [
            makeItem({ category: "emergency", targetId: "g1", label: "Emergency Fund", amount: 300 }),
        ] as never,
        flexibleCashAvailable: 400,
        goals: [goal],
    });
    assertEqual(actions.length, 1, "one recommendation for goal");
    // Goal has $150 remaining — amount capped even though flexCash allows $400
    assertEqual(actions[0].actualAmount, 150, "emergency recommendation capped at goal remainder");
    assertEqual(actions[0].recommendedAmount, 150, "recommendedAmount reflects remaining goal amount");
}

function testActiveRecommendations_goalAlreadyFull_skipped() {
    const goal = makeGoal({ id: "g1", targetAmount: 500, currentAmount: 500, type: "emergency" });
    const actions = buildActiveRecommendedActions({
        recommendedActions: [
            makeItem({ category: "emergency", targetId: "g1", label: "Emergency Fund", amount: 200 }),
        ] as never,
        flexibleCashAvailable: 400,
        goals: [goal],
    });
    assertEqual(actions.length, 0, "fully funded goal produces no recommendation (amount = 0)");
}

function testActiveRecommendations_skipsItemsWithoutTargetId() {
    const noTarget = { category: "snowball", label: "Orphan", amount: 100 };
    const actions = buildActiveRecommendedActions({
        recommendedActions: [noTarget, makeItem({ targetId: "d1" })] as never,
        flexibleCashAvailable: 500,
        goals: [],
    });
    assertEqual(actions.length, 1, "item without targetId is skipped");
    assertEqual(actions[0].targetId, "d1", "the item with targetId d1 is included");
}

function testActiveRecommendations_overrideAmountIsRespected() {
    const actions = buildActiveRecommendedActions({
        recommendedActions: [makeItem({ targetId: "d1", amount: 300 })] as never,
        flexibleCashAvailable: 500,
        goals: [],
        recommendationOverrides: [{ targetId: "d1", category: "snowball", amount: 100 }],
    });
    assertEqual(actions[0].actualAmount, 100, "override amount is used instead of max amount");
}

function testActiveRecommendations_overrideCannotExceedMaxAmount() {
    // Override requests $400 but engine only allocated $200 for this debt
    const actions = buildActiveRecommendedActions({
        recommendedActions: [makeItem({ targetId: "d1", amount: 200 })] as never,
        flexibleCashAvailable: 500,
        goals: [],
        recommendationOverrides: [{ targetId: "d1", category: "snowball", amount: 400 }],
    });
    // min(override=400, maxAmount=200, capacity=500) = 200
    assertEqual(actions[0].actualAmount, 200, "override cannot exceed the engine's max amount");
}

function testActiveRecommendations_multipleCompletedActionsReduceCapacity() {
    // If $300 is already marked paid, flexible cash has already been reduced.
    // That reduction shows up in the flexibleCashAvailable value passed in.
    // This test verifies two recommendations can be served within remaining capacity.
    const flexCash = computeFlexibleCash({
        paycheckAmount: 2400,
        totalRequired: 1000,
        livingExpenseReserve: 200,
        bufferTotal: 50,
        completedRecommendedTotal: 850, // already marked $850 paid
    });
    // 2400 - 1000 - 200 - 50 - 850 = 300
    assertApprox(flexCash, 300, "flexible cash correctly accounts for completed actions");
    const actions = buildActiveRecommendedActions({
        recommendedActions: [
            makeItem({ targetId: "d1", label: "Extra to Visa", amount: 200 }),
            makeItem({ targetId: "d2", label: "Extra to Car", amount: 200 }),
        ] as never,
        flexibleCashAvailable: flexCash,
        goals: [],
    });
    assertEqual(actions.length, 2, "two recommendations fit within remaining $300");
    assertApprox(actions[0].actualAmount + actions[1].actualAmount, 300, "total recommendations equal available flex cash");
}

export function runRecommendedActionsRegressionTests() {
    console.log("Running recommended actions regression tests...");

    testFlexibleCash_basic();
    testFlexibleCash_neverNegative();
    testFlexibleCash_allZeroCosts();
    testFlexibleCash_exactlyZeroWhenBreakEven();
    testFlexibleCash_completedActionsReduceCapacity();

    testCompletedTotal_excludesExternalPayments();
    testCompletedTotal_includesAllNonExternal();
    testCompletedTotal_emptyArrayIsZero();

    testSnowballByDebt_groupsMultipleActionsForSameDebt();
    testSnowballByDebt_ignoresNonSnowball();
    testSnowballByDebt_emptyReturnsEmptyMap();

    testActiveRecommendations_capacityCapsSingleAction();
    testActiveRecommendations_noActionsWhenZeroCapacity();
    testActiveRecommendations_stopsWhenCapacityExhausted();
    testActiveRecommendations_splitsCapacityAcrossMultiple();
    testActiveRecommendations_goalCapsAtRemainder();
    testActiveRecommendations_goalAlreadyFull_skipped();
    testActiveRecommendations_skipsItemsWithoutTargetId();
    testActiveRecommendations_overrideAmountIsRespected();
    testActiveRecommendations_overrideCannotExceedMaxAmount();
    testActiveRecommendations_multipleCompletedActionsReduceCapacity();

    console.log("✅ All recommended actions regression tests passed.");
}

runRecommendedActionsRegressionTests();
