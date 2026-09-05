import { applyRolloverPayment } from "@core/debt/applyRolloverPayment";
import { buildCycleSnapshot } from "@core/history/buildCycleSnapshot";
import {
    selectVisibleHistory,
    PREMIUM_HISTORY_CAP,
} from "@core/history/selectVisibleHistory";
import type {
    CompletedRecommendedAction,
    Debt,
    PayCycleSnapshot,
} from "@core/storage/debtPlannerStorage";

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
        // ⛔ S1.11.5.4 [pass-4 `A-F1`] — the window is REQUIRED now. This row and the two below do not
        // test it; a cycle always has one, and a type that let a caller omit it is exactly what let the
        // only shipping call drop it with all three suites green.
        windowStartISO: "2026-06-01",
        windowEndISO: "2026-06-15",
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
        windowStartISO: "2026-06-01",
        windowEndISO: "2026-06-15",
    });

    assertEqual(result.totalPaidThisCycle, 125, "paid = minimum (25) + snowball (100); emergency savings excluded");
    assertEqual(result.allRequiredMet, false, "carries allRequiredMet=false when an affordable required item was skipped");
}

function testBuildSnapshot_crossCadenceBnplUsesTheInWindowMinimum() {
    // ⛔ S1P3-A2 — THE SNAPSHOT MUST REPORT THE SAME MONEY THE ROLLOVER DEDUCTS.
    // A biweekly BNPL under a monthly paycheck charges TWICE in one window. The allocator reserves the
    // full in-window amount and `applyRolloverPayment` pays the balance down by it — this function
    // summed the raw per-installment `minimumPayment` instead, so a user whose plan asked for $200, and
    // whose balance fell by exactly $200, was told on History that they paid $100.
    // ⚠️ Every prior fixture in this file is `type: "debt", recurrence: "monthly"` — the one member of
    // the class where scaled and unscaled agree exactly, which is why nothing red (reading rule 2).
    const bnpl: Debt = {
        id: "klarna",
        name: "Klarna sofa",
        balance: 400,
        minimumPayment: 100,
        dueDate: "2026-01-05",
        apr: 0,
        type: "bnpl",
        recurrence: "biweekly",
        scheduledPaymentAmount: 100,
        remainingPayments: 4,
        minimumPaidThisCycle: true,
    };
    const WINDOW_START = "2026-01-01";
    const WINDOW_END = "2026-02-01";

    const withWindow = buildCycleSnapshot({
        cycleEndDate: WINDOW_END,
        debts: [bnpl],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        allRequiredMet: true,
        windowStartISO: WINDOW_START,
        windowEndISO: WINDOW_END,
    });

    // ⛔ Pinned to what the ROLLOVER actually does, not to a literal — the two must not drift apart
    // again. A literal 200 would pass if both sides broke together.
    const afterRollover = applyRolloverPayment(
        bnpl,
        0,
        "monthly",
        WINDOW_START,
        WINDOW_END
    );
    const actuallyPaidDown = roundTo2(bnpl.balance - afterRollover.balance);

    assertEqual(actuallyPaidDown, 200, "two biweekly installments fall in a monthly window (control)");
    assertEqual(
        withWindow.totalPaidThisCycle,
        actuallyPaidDown,
        "History reports the money the rollover actually deducted (S1P3-A2)"
    );

    // ⚠️ The non-BNPL path must be untouched by the scaling — the control for the opposite direction.
    /**
     * ⛔ **THE CONTROL USED TO EXERCISE NOTHING.** [class 4 · `A3-14`] Its fixture is due `2026-06-01`
     * while the window is `2026-01-01 → 2026-02-01` — **five months outside it** — so no installment
     * fell inside and the in-window scaling never engaged. A row named *"unchanged by in-window
     * scaling"* that ran with the scaling switched off by its own dates.
     *
     * ⚠️ The due date is inside the window now, and a WEEKLY sibling is asserted beside it — without
     * one, "unchanged" is indistinguishable from "never reached".
     */
    const monthly: Debt = { ...debt("card", 1000), dueDate: WINDOW_START, minimumPaidThisCycle: true, minimumPayment: 100 };
    const monthlySnapshot = buildCycleSnapshot({
        cycleEndDate: WINDOW_END,
        debts: [monthly],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        allRequiredMet: true,
        windowStartISO: WINDOW_START,
        windowEndISO: WINDOW_END,
    });
    assertEqual(monthlySnapshot.totalPaidThisCycle, 100, "a monthly debt is unchanged by in-window scaling");

    /**
     * ⛔ **THE SIBLING THAT MAKES THE ROW ABOVE MEAN SOMETHING.** [class 4 · `A3-14`]
     *
     * *"Unchanged"* is only a claim if something else in the same shape DOES change. A weekly debt in the
     * same window charges every week, so History must report the full in-window paydown — the `S1P3-A2`
     * rule that reserve and paydown are one producer. Without this row the control above passes equally
     * well over a scaling that has been deleted.
     */
    const weekly: Debt = {
        ...debt("weekly-loan", 1000),
        dueDate: WINDOW_START,
        recurrence: "weekly",
        minimumPaidThisCycle: true,
        minimumPayment: 25,
    };
    const weeklySnapshot = buildCycleSnapshot({
        cycleEndDate: WINDOW_END,
        debts: [weekly],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        allRequiredMet: true,
        windowStartISO: WINDOW_START,
        windowEndISO: WINDOW_END,
    });
    assertEqual(
        weeklySnapshot.totalPaidThisCycle,
        125,
        "⛔ A3-14 — a WEEKLY debt reports its full in-window paydown (5 × $25 in a 31-day window), so 'unchanged' above is a claim rather than an artefact",
    );
}

function roundTo2(n: number) {
    return Math.round(n * 100) / 100;
}

function testBuildSnapshot_emptyState() {
    const result = buildCycleSnapshot({
        cycleEndDate: "2026-06-15",
        debts: [],
        completedRecommendedActions: [],
        payoffStrategy: "snowball",
        allRequiredMet: true,
        windowStartISO: "2026-06-01",
        windowEndISO: "2026-06-15",
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
    testBuildSnapshot_crossCadenceBnplUsesTheInWindowMinimum();
    testBuildSnapshot_emptyState();
    testVisibleHistory_premiumCapsAtSix();
    testVisibleHistory_premiumPlusUncapped();
    testVisibleHistory_underCapReturnsAll();
    testVisibleHistory_emptyHistory();

    console.log("✅ All pay cycle history regression tests passed.");
}

runPayCycleHistoryRegressionTests();
