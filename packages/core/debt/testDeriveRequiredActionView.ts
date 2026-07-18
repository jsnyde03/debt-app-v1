import { deriveRequiredActionView, isOverdue } from "./deriveRequiredActionView";
import type { RequiredExpense, Debt } from "@core/storage/debtPlannerStorage";

function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`FAIL [${msg}]`);
    console.log(`  ✓ ${msg}`);
}

const NOW = "2026-01-15";

function expense(overrides: Partial<RequiredExpense>): RequiredExpense {
    return {
        id: "e1",
        name: "Internet",
        amount: 80,
        dueDate: "2026-01-20",
        recurrence: "monthly",
        isPaidThisCycle: false,
        ...overrides,
    };
}

function debtItem(overrides: Partial<Debt>): Debt {
    return {
        id: "d1",
        name: "Card",
        balance: 500,
        minimumPayment: 25,
        dueDate: "2026-01-20",
        apr: 20,
        type: "debt",
        recurrence: "monthly",
        minimumPaidThisCycle: false,
        ...overrides,
    };
}

function testExpensePaidState() {
    const unpaid = deriveRequiredActionView(
        { category: "expense", targetId: "e1", label: "Pay Internet", amount: 80 },
        [expense({ id: "e1", isPaidThisCycle: false })],
        [],
        NOW
    );
    assert(unpaid.isPaid === false && unpaid.isAutopay === false, "unpaid manual expense → isPaid false, not autopay");

    const paid = deriveRequiredActionView(
        { category: "expense", targetId: "e1", label: "Pay Internet", amount: 80 },
        [expense({ id: "e1", isPaidThisCycle: true })],
        [],
        NOW
    );
    assert(paid.isPaid === true, "paid expense → isPaid true");
    assert(paid.expense?.id === "e1", "resolves the underlying expense");
}

function testAutopayCategory() {
    const view = deriveRequiredActionView(
        { category: "autopay_expense", targetId: "e1", label: "Pay Internet", amount: 80 },
        [expense({ id: "e1", isAutopay: true })],
        [],
        NOW
    );
    assert(view.isAutopay === true, "autopay_expense category → isAutopay true");
}

function testPresumedPaidState() {
    const duetoday = deriveRequiredActionView(
        { category: "autopay_expense", targetId: "e1", label: "Pay Internet", amount: 80 },
        [expense({ id: "e1", isAutopay: true, dueDate: "2026-01-10" })],
        [],
        NOW
    );
    assert(duetoday.presumedPaid === true, "autopay past-due → presumedPaid true (shows Auto-paid)");

    const upcoming = deriveRequiredActionView(
        { category: "autopay_expense", targetId: "e1", label: "Pay Internet", amount: 80 },
        [expense({ id: "e1", isAutopay: true, dueDate: "2026-01-25" })],
        [],
        NOW
    );
    assert(upcoming.presumedPaid === false, "autopay not-yet-due → presumedPaid false (shows Autopay)");

    const manual = deriveRequiredActionView(
        { category: "expense", targetId: "e1", label: "Pay Internet", amount: 80 },
        [expense({ id: "e1", isAutopay: false, dueDate: "2026-01-10" })],
        [],
        NOW
    );
    assert(manual.presumedPaid === false, "manual bill → never presumedPaid");
}

function testDebtMinimumFlags() {
    const legacy = deriveRequiredActionView(
        { category: "minimum_debt", targetId: "d1", debtId: "d1", label: "Pay minimum on Card", amount: 25 },
        [],
        [debtItem({ id: "d1", minimumPaidThisCycle: undefined, isPaidThisCycle: true })],
        NOW
    );
    assert(legacy.isPaid === true, "debt paid via legacy isPaidThisCycle when minimumPaidThisCycle absent");

    const modern = deriveRequiredActionView(
        { category: "autopay_debt", targetId: "d1", debtId: "d1", label: "Pay minimum on Card", amount: 25 },
        [],
        [debtItem({ id: "d1", minimumPaidThisCycle: true, isAutopay: true })],
        NOW
    );
    assert(modern.isPaid === true && modern.isAutopay === true, "autopay debt paid via minimumPaidThisCycle + isAutopay");
    assert(modern.debt?.id === "d1", "resolves the underlying debt (via debtId)");
}

function testOverdueOnlyWhenUnpaid() {
    const overdueUnpaid = deriveRequiredActionView(
        { category: "expense", targetId: "e1", label: "Pay Internet", amount: 80 },
        [expense({ id: "e1", dueDate: "2026-01-10", isPaidThisCycle: false })],
        [],
        NOW
    );
    assert(overdueUnpaid.overdue === true, "past-due + unpaid → overdue");

    const overduePaid = deriveRequiredActionView(
        { category: "expense", targetId: "e1", label: "Pay Internet", amount: 80 },
        [expense({ id: "e1", dueDate: "2026-01-10", isPaidThisCycle: true })],
        [],
        NOW
    );
    assert(overduePaid.overdue === false, "past-due but PAID → not overdue");

    assert(isOverdue("2026-01-10", NOW) === true && isOverdue("2026-01-20", NOW) === false, "isOverdue compares dates correctly");
}

function testPresumedPaidAutopayNotOverdue() {
    const presumed = deriveRequiredActionView(
        { category: "autopay_expense", targetId: "e1", label: "x", amount: 80 },
        [expense({ id: "e1", isAutopay: true, dueDate: "2026-01-10", isPaidThisCycle: false })],
        [],
        NOW
    );
    assert(presumed.overdue === false, "presumed-paid autopay (past due) is NOT overdue — hero won't false-alarm");
    assert(presumed.autopayFailed === false, "a healthy autopay is NOT flagged failed (still presents as autopay)");

    const failed = deriveRequiredActionView(
        { category: "autopay_expense", targetId: "e1", label: "x", amount: 80 },
        [expense({ id: "e1", isAutopay: true, dueDate: "2026-01-10", autopayFailedThisCycle: true })],
        [],
        NOW
    );
    assert(failed.overdue === true, "a FAILED autopay past due IS overdue (correctly needs attention)");
    assert(failed.autopayFailed === true && failed.isAutopay === true, "a FAILED autopay is flagged failed BUT keeps isAutopay (resumes autopay next cycle)");
}

function testMissingItemDoesNotCrash() {
    const view = deriveRequiredActionView(
        { category: "expense", targetId: "gone", label: "Pay X", amount: 10 },
        [],
        [],
        NOW
    );
    assert(view.isPaid === false && view.overdue === false && view.expense === undefined, "unresolved item → safe defaults, no crash");
}

export function runDeriveRequiredActionViewTests() {
    console.log("Running derive-required-action-view tests...");

    testExpensePaidState();
    testAutopayCategory();
    testPresumedPaidState();
    testDebtMinimumFlags();
    testOverdueOnlyWhenUnpaid();
    testPresumedPaidAutopayNotOverdue();
    testMissingItemDoesNotCrash();

    console.log("✅ All derive-required-action-view tests passed.");
}

runDeriveRequiredActionViewTests();
