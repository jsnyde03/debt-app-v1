import { getDebtsWithDisplayBalances, getCompletedSnowballAmount } from "./getDebtsWithDisplayBalances";
import type { Debt } from "../storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

function debt(overrides: Partial<Debt> & { id: string }): Debt {
    return {
        name: "Test Debt",
        balance: 1000,
        originalBalance: 1000,
        minimumPayment: 50,
        apr: 20,
        dueDate: "2026-06-01",
        originalDueDate: "2026-06-01",
        type: "debt",
        recurrence: "monthly",
        isPaidThisCycle: false,
        minimumPaidThisCycle: false,
        snowballPaidThisCycle: false,
        ...overrides,
    };
}

type Action = { category: string; targetId: string; actualAmount: number };
function snowball(targetId: string, amount: number): Action {
    return { category: "snowball", targetId, actualAmount: amount };
}

function runGetDebtsWithDisplayBalancesTests() {
    // ─── getCompletedSnowballAmount (feeds the rollover balance math) ───
    assertEqual(getCompletedSnowballAmount("d1", []), 0, "no actions → 0");

    assertEqual(
        getCompletedSnowballAmount("d1", [snowball("d1", 40), snowball("d1", 60)]),
        100,
        "sums multiple snowball actions for the debt"
    );

    // Must filter by BOTH category === "snowball" AND targetId — a leak here
    // would corrupt the rollover's balance reduction.
    assertEqual(
        getCompletedSnowballAmount("d1", [
            snowball("d1", 40),
            { category: "emergency", targetId: "d1", actualAmount: 999 },
            snowball("d2", 500),
        ]),
        40,
        "filters by category=snowball AND targetId"
    );

    // ─── display balance + active/paid-off split ───
    // Untouched debt shows its full balance and is active.
    {
        const { debtsWithDisplayBalances, activeDebts, paidOffDebts } =
            getDebtsWithDisplayBalances([debt({ id: "d1", balance: 1000 })], []);
        assertEqual(debtsWithDisplayBalances[0].displayBalance, 1000, "untouched debt shows full balance");
        assertEqual(activeDebts.length, 1, "untouched debt is active");
        assertEqual(paidOffDebts.length, 0, "untouched debt is not paid off");
    }

    // minimumPaidThisCycle subtracts min(minimumPayment, balance).
    {
        const { debtsWithDisplayBalances } = getDebtsWithDisplayBalances(
            [debt({ id: "d1", balance: 1000, minimumPayment: 50, minimumPaidThisCycle: true })],
            []
        );
        assertEqual(debtsWithDisplayBalances[0].displayBalance, 950, "paid minimum reduces display balance");
    }

    // isPaidThisCycle also triggers the minimum subtraction (either flag counts).
    {
        const { debtsWithDisplayBalances } = getDebtsWithDisplayBalances(
            [debt({ id: "d1", balance: 1000, minimumPayment: 50, isPaidThisCycle: true })],
            []
        );
        assertEqual(debtsWithDisplayBalances[0].displayBalance, 950, "isPaidThisCycle also subtracts the minimum");
    }

    // Completed snowball stacks on top of the paid minimum: 1000 − 50 − 200.
    {
        const { debtsWithDisplayBalances } = getDebtsWithDisplayBalances(
            [debt({ id: "d1", balance: 1000, minimumPayment: 50, minimumPaidThisCycle: true })],
            [snowball("d1", 200)]
        );
        assertEqual(debtsWithDisplayBalances[0].displayBalance, 750, "snowball stacks on the paid minimum");
    }

    // Over-payment clamps to 0 (never negative) and lands in paid-off.
    {
        const { debtsWithDisplayBalances, activeDebts, paidOffDebts } = getDebtsWithDisplayBalances(
            [debt({ id: "d1", balance: 100 })],
            [snowball("d1", 250)]
        );
        assertEqual(debtsWithDisplayBalances[0].displayBalance, 0, "over-payment clamps at 0");
        assertEqual(activeDebts.length, 0, "fully-paid debt is not active");
        assertEqual(paidOffDebts.length, 1, "fully-paid debt is paid off");
    }

    // minimumPayment > balance → the paid minimum is capped at the balance, so
    // the display balance is 0, not negative.
    {
        const { debtsWithDisplayBalances } = getDebtsWithDisplayBalances(
            [debt({ id: "d1", balance: 30, minimumPayment: 50, minimumPaidThisCycle: true })],
            []
        );
        assertEqual(debtsWithDisplayBalances[0].displayBalance, 0, "minimum capped at balance → 0, not negative");
    }

    // Result is rounded to cents (1000 − 199.999 = 800.001 → 800).
    {
        const { debtsWithDisplayBalances } = getDebtsWithDisplayBalances(
            [debt({ id: "d1", balance: 1000 })],
            [snowball("d1", 199.999)]
        );
        assertEqual(debtsWithDisplayBalances[0].displayBalance, 800, "display balance is rounded to cents");
    }

    // Mixed list splits active vs paid-off correctly.
    {
        const { activeDebts, paidOffDebts } = getDebtsWithDisplayBalances(
            [debt({ id: "active", balance: 500 }), debt({ id: "done", balance: 100 })],
            [snowball("done", 100)]
        );
        assertEqual(activeDebts.length, 1, "mixed list: one active");
        assertEqual(activeDebts[0].id, "active", "active debt identified");
        assertEqual(paidOffDebts.length, 1, "mixed list: one paid off");
        assertEqual(paidOffDebts[0].id, "done", "paid-off debt identified");
    }

    console.log("✅ getDebtsWithDisplayBalances regression tests passed.");
}

runGetDebtsWithDisplayBalancesTests();
