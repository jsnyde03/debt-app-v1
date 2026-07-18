import { bulkMarkRequiredPaid, applyRequiredReconciliation } from "./bulkMarkRequired";
import type { RequiredExpense, Debt } from "@core/storage/debtPlannerStorage";

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`FAIL [${msg}]`);
    console.log(`  ✓ ${msg}`);
}

function expense(overrides: Partial<RequiredExpense>): RequiredExpense {
    return {
        id: "e",
        name: "Internet",
        amount: 80,
        dueDate: "2026-01-10",
        recurrence: "monthly",
        isPaidThisCycle: false,
        ...overrides,
    };
}

function debtItem(overrides: Partial<Debt>): Debt {
    return {
        id: "d",
        name: "Card",
        balance: 500,
        minimumPayment: 25,
        dueDate: "2026-01-10",
        apr: 20,
        type: "debt",
        recurrence: "monthly",
        minimumPaidThisCycle: false,
        ...overrides,
    };
}

function testMarksExpensesInSet() {
    const { expenses } = bulkMarkRequiredPaid(
        [expense({ id: "a" }), expense({ id: "b" })],
        [],
        { expenseIds: ["a"], debtIds: [] }
    );
    assert(expenses[0].isPaidThisCycle === true, "expense in the set is marked paid");
    assert(expenses[1].isPaidThisCycle !== true, "expense NOT in the set is left unpaid");
}

function testMarksDebtMinimumsBothFlags() {
    const { debts } = bulkMarkRequiredPaid([], [debtItem({ id: "d1" })], {
        expenseIds: [],
        debtIds: ["d1"],
    });
    assert(debts[0].minimumPaidThisCycle === true, "debt minimum marked (minimumPaidThisCycle) — mirrors the toggle");
    assert(debts[0].isPaidThisCycle === true, "debt also sets legacy isPaidThisCycle (matches handleMarkDebtMinimumPaid)");
}

function testClearsFailedFlagOnMark() {
    const { expenses, debts } = bulkMarkRequiredPaid(
        [expense({ id: "e1", isAutopay: true, autopayFailedThisCycle: true })],
        [debtItem({ id: "d1", isAutopay: true, autopayFailedThisCycle: true })],
        { expenseIds: ["e1"], debtIds: ["d1"] }
    );
    assert(expenses[0].autopayFailedThisCycle === false, "marking paid clears a prior autopay-failed flag (expense)");
    assert(debts[0].autopayFailedThisCycle === false, "marking paid clears a prior autopay-failed flag (debt)");
}

function testIdempotentOnAlreadyPaid() {
    const { expenses } = bulkMarkRequiredPaid([expense({ id: "e1", isPaidThisCycle: true })], [], {
        expenseIds: ["e1"],
        debtIds: [],
    });
    assert(expenses[0].isPaidThisCycle === true, "already-paid item stays paid (idempotent)");
}

function testEmptySetIsNoOpByReference() {
    const original = [expense({ id: "e1" })];
    const { expenses } = bulkMarkRequiredPaid(original, [], { expenseIds: [], debtIds: [] });
    assert(expenses[0] === original[0], "unmarked item passes through by reference (no needless object churn)");
}

function testDoesNotMutateInput() {
    const input = expense({ id: "e1", isPaidThisCycle: false });
    bulkMarkRequiredPaid([input], [], { expenseIds: ["e1"], debtIds: [] });
    assert(input.isPaidThisCycle === false, "input object is not mutated (pure)");
}

// ── applyRequiredReconciliation (the itemized [Adjust] path) ──

function testReconcilePaidMarksPaid() {
    const { expenses, debts } = applyRequiredReconciliation(
        [expense({ id: "e1", isAutopay: true, autopayFailedThisCycle: true })],
        [debtItem({ id: "d1" })],
        { expensePaid: { e1: true }, debtPaid: { d1: true } }
    );
    assert(expenses[0].isPaidThisCycle === true && expenses[0].autopayFailedThisCycle === false, "paid expense → marked paid + failed flag cleared");
    assert(debts[0].minimumPaidThisCycle === true && debts[0].isPaidThisCycle === true, "paid debt → both flags set");
}

function testReconcileUnpaidAutopayFlagsFailed() {
    const { expenses, debts } = applyRequiredReconciliation(
        [expense({ id: "e1", isAutopay: true })],
        [debtItem({ id: "d1", isAutopay: true })],
        { expensePaid: { e1: false }, debtPaid: { d1: false } }
    );
    assert(expenses[0].autopayFailedThisCycle === true && expenses[0].isPaidThisCycle === false, "unpaid AUTOPAY expense → flagged failed, stays owed");
    assert(debts[0].autopayFailedThisCycle === true && debts[0].minimumPaidThisCycle === false, "unpaid AUTOPAY debt → flagged failed, stays owed");
}

function testReconcileUnpaidManualJustUnpaid() {
    const { expenses } = applyRequiredReconciliation(
        [expense({ id: "e1", isAutopay: false })],
        [],
        { expensePaid: { e1: false }, debtPaid: {} }
    );
    assert(expenses[0].isPaidThisCycle === false && expenses[0].autopayFailedThisCycle === undefined, "unpaid MANUAL expense → just unpaid, no failed flag");
}

function testReconcileUntouchedByReference() {
    const orig = expense({ id: "e1" });
    const { expenses } = applyRequiredReconciliation([orig], [], { expensePaid: {}, debtPaid: {} });
    assert(expenses[0] === orig, "item not in the decision map passes through by reference");
}

export function runBulkMarkRequiredTests() {
    console.log("Running bulk-mark-required tests...");

    testMarksExpensesInSet();
    testMarksDebtMinimumsBothFlags();
    testClearsFailedFlagOnMark();
    testIdempotentOnAlreadyPaid();
    testEmptySetIsNoOpByReference();
    testDoesNotMutateInput();

    testReconcilePaidMarksPaid();
    testReconcileUnpaidAutopayFlagsFailed();
    testReconcileUnpaidManualJustUnpaid();
    testReconcileUntouchedByReference();

    console.log("✅ All bulk-mark-required tests passed.");
}

runBulkMarkRequiredTests();
