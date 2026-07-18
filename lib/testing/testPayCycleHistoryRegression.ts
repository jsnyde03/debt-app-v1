import { buildCycleSnapshot } from "@core/history/buildCycleSnapshot";
import {
    selectVisibleHistory,
    PREMIUM_HISTORY_CAP,
} from "@core/history/selectVisibleHistory";
import type {
    CompletedRecommendedAction,
    Debt,
    PayCycleSnapshot,
} from "@/lib/storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (actual !== expected) {
        throw new Error(`FAIL [${msg}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    console.log(`  ✓ ${msg}`);
}

function debt(id: string, balance: number): Debt {
    return {
        id,
        name: id,
        balance,
        minimumPayment: 25,
        dueDate: "2026-06-01",
        apr: 20,
        type: "debt",
        recurrence: "monthly",
    };
}

function action(actualAmount: number): CompletedRecommendedAction {
    return {
        targetId: "x",
        label: "Pay",
        category: "snowball",
        recommendedAmount: actualAmount,
        actualAmount,
    };
}

function snapshot(cycleEndDate: string): PayCycleSnapshot {
    return {
        cycleEndDate,
        totalDebtBalance: 0,
        totalPaidThisCycle: 0,
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
    };
}

// --- buildCycleSnapshot ---

function testBuildSnapshot_correctTotals() {
    const result = buildCycleSnapshot({
        cycleEndDate: "2026-06-15",
        debts: [debt("a", 500), debt("b", 900.5)],
        completedRecommendedActions: [action(100), action(50.25)],
        payoffStrategy: "avalanche",
        allRequiredMet: true,
    });

    assertEqual(result.cycleEndDate, "2026-06-15", "snapshot carries cycleEndDate");
    assertEqual(result.totalDebtBalance, 1400.5, "totalDebtBalance sums all debt balances");
    // No minimums marked paid here, so paid-toward-debt = the snowball extras.
    assertEqual(result.totalPaidThisCycle, 150.25, "totalPaidThisCycle = paid minimums + snowball extras");
    assertEqual(result.allRequiredMet, true, "snapshot carries allRequiredMet");
    assertEqual(result.payoffStrategy, "avalanche", "snapshot carries payoffStrategy");
    assertEqual(result.completedRecommendedActions.length, 2, "snapshot keeps the completed actions");
}

function testBuildSnapshot_paidTowardDebtExcludesSavings() {
    // A paid minimum ($25) + a snowball extra ($100) count toward debt; an
    // emergency-fund contribution ($200) is savings and must NOT (the F5 fix).
    const paidDebt: Debt = { ...debt("a", 500), minimumPaidThisCycle: true };
    const result = buildCycleSnapshot({
        cycleEndDate: "2026-06-15",
        debts: [paidDebt, debt("b", 900)],
        completedRecommendedActions: [
            { targetId: "a", label: "Extra", category: "snowball", recommendedAmount: 100, actualAmount: 100 },
            { targetId: "ef", label: "Emergency", category: "emergency", recommendedAmount: 200, actualAmount: 200 },
        ],
        payoffStrategy: "snowball",
        allRequiredMet: false,
    });

    assertEqual(result.totalPaidThisCycle, 125, "paid = minimum (25) + snowball (100); emergency savings excluded");
    assertEqual(result.allRequiredMet, false, "carries allRequiredMet=false when an affordable required item was skipped");
}

function testBuildSnapshot_emptyState() {
    const result = buildCycleSnapshot({
        cycleEndDate: "2026-06-15",
        debts: [],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        allRequiredMet: true,
    });

    assertEqual(result.totalDebtBalance, 0, "no debts → 0 balance");
    assertEqual(result.totalPaidThisCycle, 0, "no actions → 0 paid");
}

// --- selectVisibleHistory (tier-aware cap) ---

function buildHistory(count: number): PayCycleSnapshot[] {
    // Oldest-first, the order the hook stores them in.
    return Array.from({ length: count }, (_, i) => snapshot(`2026-${String(i + 1).padStart(2, "0")}-01`));
}

function testVisibleHistory_premiumCapsAtSix() {
    const history = buildHistory(8);
    const visible = selectVisibleHistory(history, "premium");
    assertEqual(visible.length, PREMIUM_HISTORY_CAP, "premium sees exactly 6 cycles");
    // Most-recent-first: the newest stored (08) should be first.
    assertEqual(visible[0].cycleEndDate, "2026-08-01", "premium sees the 6 MOST RECENT, newest first");
    assertEqual(visible[5].cycleEndDate, "2026-03-01", "premium's oldest visible is the 6th-newest");
}

function testVisibleHistory_premiumPlusUncapped() {
    const history = buildHistory(8);
    const visible = selectVisibleHistory(history, "premium_plus");
    assertEqual(visible.length, 8, "premium_plus sees all cycles");
    assertEqual(visible[0].cycleEndDate, "2026-08-01", "premium_plus is also newest-first");
}

function testVisibleHistory_underCapReturnsAll() {
    const history = buildHistory(3);
    assertEqual(selectVisibleHistory(history, "premium").length, 3, "under the cap, premium sees all 3");
}

function testVisibleHistory_emptyHistory() {
    assertEqual(selectVisibleHistory([], "premium").length, 0, "empty history → empty for premium");
    assertEqual(selectVisibleHistory([], "premium_plus").length, 0, "empty history → empty for premium_plus");
}

export function runPayCycleHistoryRegressionTests() {
    console.log("Running pay cycle history regression tests...");

    testBuildSnapshot_correctTotals();
    testBuildSnapshot_paidTowardDebtExcludesSavings();
    testBuildSnapshot_emptyState();
    testVisibleHistory_premiumCapsAtSix();
    testVisibleHistory_premiumPlusUncapped();
    testVisibleHistory_underCapReturnsAll();
    testVisibleHistory_emptyHistory();

    console.log("✅ All pay cycle history regression tests passed.");
}

runPayCycleHistoryRegressionTests();
