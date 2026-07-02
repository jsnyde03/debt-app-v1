import { rolloverRequiredExpenses, rolloverDebts } from "./rolloverPayCycle";
import type { RequiredExpense, Debt } from "../storage/debtPlannerStorage";

function assertEqual<T>(actual: T, expected: T, label: string) {
    if (actual !== expected) {
        throw new Error(
            `${label} failed. Expected ${String(expected)}, received ${String(actual)}`
        );
    }
}

function expense(overrides: Partial<RequiredExpense>): RequiredExpense {
    return {
        id: "e",
        name: "Rent",
        amount: 1000,
        dueDate: "2026-01-31",
        recurrence: "monthly",
        isPaidThisCycle: true,
        ...overrides,
    };
}

function debtItem(overrides: Partial<Debt>): Debt {
    return {
        id: "d",
        name: "Card",
        balance: 500,
        minimumPayment: 25,
        dueDate: "2026-01-31",
        apr: 20,
        type: "debt",
        recurrence: "monthly",
        minimumPaidThisCycle: true,
        ...overrides,
    };
}

function runRolloverDueDateTests() {
    // The bug: Jan 31 monthly used to overflow to Mar 3, skipping February
    // entirely (a missed bill in a bill-reminder app). Now clamps to Feb 28.
    const jan31 = rolloverRequiredExpenses(
        [expense({ dueDate: "2026-01-31", originalDueDate: "2026-01-31" })],
        "2026-02-13"
    );
    assertEqual(jan31[0].dueDate, "2026-02-28", "Jan 31 monthly clamps to Feb 28 (not Mar 3)");

    // No drift: a Feb-28 occurrence whose original anchor is the 31st returns to
    // Mar 31, rather than sticking on the 28th forever.
    const feb28 = rolloverRequiredExpenses(
        [expense({ dueDate: "2026-02-28", originalDueDate: "2026-01-31" })],
        "2026-03-13"
    );
    assertEqual(feb28[0].dueDate, "2026-03-31", "anchor recovers the 31st after February (no drift)");

    // 30th behaves the same through February.
    const jan30 = rolloverRequiredExpenses(
        [expense({ dueDate: "2026-01-30", originalDueDate: "2026-01-30" })],
        "2026-02-05"
    );
    assertEqual(jan30[0].dueDate, "2026-02-28", "Jan 30 monthly clamps to Feb 28");

    // Debts get the same treatment.
    const debtRoll = rolloverDebts(
        [debtItem({ dueDate: "2026-01-31", originalDueDate: "2026-01-31" })],
        "2026-02-13"
    );
    assertEqual(debtRoll[0].dueDate, "2026-02-28", "debt Jan 31 monthly clamps to Feb 28");

    // A normal mid-month date is unaffected.
    const mid = rolloverRequiredExpenses(
        [expense({ dueDate: "2026-01-15", originalDueDate: "2026-01-15" })],
        "2026-02-13"
    );
    assertEqual(mid[0].dueDate, "2026-02-15", "mid-month date advances normally");

    // Unpaid obligations keep their (overdue) due date rather than advancing.
    const unpaid = rolloverRequiredExpenses(
        [expense({ dueDate: "2026-01-31", isPaidThisCycle: false })],
        "2026-02-13"
    );
    assertEqual(unpaid[0].dueDate, "2026-01-31", "unpaid expense retains its overdue due date");

    console.log("✅ Rollover due-date (EOM clamp) regression tests passed.");
}

runRolloverDueDateTests();
