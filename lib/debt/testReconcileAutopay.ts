import { isAutopayPresumedPaid, reconcileAutopayForRollover } from "./reconcileAutopay";
import { rolloverRequiredExpenses, rolloverDebts } from "@core/recurrence/rolloverPayCycle";
import type { RequiredExpense, Debt } from "@/lib/storage/debtPlannerStorage";

function toDate(date: string) {
    return new Date(`${date}T00:00:00`);
}

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

const ASOF = "2026-01-15"; // "today" at rollover — Jan 10 due dates have passed.

function testPresumedPaidPredicate() {
    assert(
        isAutopayPresumedPaid({ isAutopay: true, dueDate: "2026-01-10" }, ASOF),
        "autopay + due date passed + not failed → presumed paid"
    );
    assert(
        !isAutopayPresumedPaid({ isAutopay: true, dueDate: "2026-01-20" }, ASOF),
        "autopay not yet due (due > asOf) → NOT presumed paid"
    );
    assert(
        !isAutopayPresumedPaid({ isAutopay: true, dueDate: "2026-01-10", autopayFailedThisCycle: true }, ASOF),
        "autopay flagged failed → NOT presumed paid (stays owed)"
    );
    assert(
        !isAutopayPresumedPaid({ isAutopay: false, dueDate: "2026-01-10" }, ASOF),
        "non-autopay past-due → NOT presumed (needs a real manual mark)"
    );
    assert(
        isAutopayPresumedPaid({ isAutopay: true, dueDate: "2026-01-15" }, ASOF),
        "autopay due exactly on asOf date → presumed paid (boundary: on-or-before)"
    );
}

function testExpenseReconcile() {
    // The headline bug fix: a forgotten autopay bill is reconciled, not left to rot.
    const { expenses } = reconcileAutopayForRollover(
        [expense({ isAutopay: true, dueDate: "2026-01-10", isPaidThisCycle: false })],
        [],
        ASOF
    );
    assert(expenses[0].isPaidThisCycle === true, "unpaid past-due autopay expense → marked paid before rollover");
}

function testFailedAutopayStaysOwed() {
    const { expenses } = reconcileAutopayForRollover(
        [expense({ isAutopay: true, dueDate: "2026-01-10", autopayFailedThisCycle: true })],
        [],
        ASOF
    );
    assert(expenses[0].isPaidThisCycle !== true, "failed autopay expense stays unpaid (user reported it didn't go through)");
}

function testManualUnpaidUntouched() {
    const { expenses } = reconcileAutopayForRollover(
        [expense({ isAutopay: false, dueDate: "2026-01-10", isPaidThisCycle: false })],
        [],
        ASOF
    );
    assert(expenses[0].isPaidThisCycle !== true, "manual unpaid bill is NEVER auto-marked (only the user confirms manual bills)");
}

function testFutureAutopayUntouched() {
    const { expenses } = reconcileAutopayForRollover(
        [expense({ isAutopay: true, dueDate: "2026-02-20", isPaidThisCycle: false })],
        [],
        ASOF
    );
    assert(expenses[0].isPaidThisCycle !== true, "autopay not yet due → left unpaid (hasn't run yet)");
}

function testIdempotentOnPaid() {
    const already = expense({ isAutopay: true, dueDate: "2026-01-10", isPaidThisCycle: true });
    const { expenses } = reconcileAutopayForRollover([already], [], ASOF);
    assert(expenses[0] === already, "already-paid autopay passes through unchanged (idempotent, same ref)");
}

function testDebtMinimumReconcile() {
    const { debts } = reconcileAutopayForRollover(
        [],
        [debtItem({ isAutopay: true, dueDate: "2026-01-10", minimumPaidThisCycle: false })],
        ASOF
    );
    assert(
        debts[0].minimumPaidThisCycle === true,
        "unpaid past-due autopay debt → minimum marked paid (so BOTH the due-date advance AND balance deduction fire)"
    );
}

function testDebtFailedAndManual() {
    const { debts } = reconcileAutopayForRollover(
        [],
        [
            debtItem({ id: "failed", isAutopay: true, dueDate: "2026-01-10", autopayFailedThisCycle: true }),
            debtItem({ id: "manual", isAutopay: false, dueDate: "2026-01-10" }),
        ],
        ASOF
    );
    assert(debts[0].minimumPaidThisCycle !== true, "failed autopay debt minimum stays owed");
    assert(debts[1].minimumPaidThisCycle !== true, "manual debt minimum never auto-marked");
}

// ── Jason's condition (Option A gate): an autopay item LEFT UNTOUCHED in the
// required list must NOT show as overdue next cycle. Prove the full logic path
// reconcile → rollover, for both a bill and a debt, plus the contrast cases.
const ASOF_ROLL = "2026-01-15"; // "today" at rollover
const NEXT_PAYDAY = "2026-01-29"; // the new cycle's plan date

function testUntouchedAutopayBillNotOverdueNextCycle() {
    const autopayBill = expense({
        id: "e1",
        isAutopay: true,
        dueDate: "2026-01-10",
        originalDueDate: "2026-01-10",
        isPaidThisCycle: false, // user never tapped it — it just sat in the list
    });

    const { expenses } = reconcileAutopayForRollover([autopayBill], [], ASOF_ROLL);
    const rolled = rolloverRequiredExpenses(expenses, NEXT_PAYDAY);

    assert(
        toDate(rolled[0].dueDate) >= toDate(NEXT_PAYDAY),
        "untouched autopay BILL advances to next cycle (future due date, NOT overdue)"
    );
    assert(rolled[0].isPaidThisCycle === false, "…and resets to unpaid for the fresh cycle");
}

function testUntouchedAutopayDebtNotOverdueNextCycle() {
    const autopayDebt = debtItem({
        id: "d1",
        isAutopay: true,
        dueDate: "2026-01-10",
        originalDueDate: "2026-01-10",
        minimumPaidThisCycle: false,
    });

    const { debts } = reconcileAutopayForRollover([], [autopayDebt], ASOF_ROLL);
    const rolled = rolloverDebts(debts, NEXT_PAYDAY);

    assert(
        toDate(rolled[0].dueDate) >= toDate(NEXT_PAYDAY),
        "untouched autopay DEBT minimum advances to next cycle (NOT overdue)"
    );
}

function testFailedAutopayStillCarriesOwed() {
    // The deliberate exception: a user-reported failure SHOULD stay owed/overdue.
    const failed = expense({
        id: "e1",
        isAutopay: true,
        dueDate: "2026-01-10",
        autopayFailedThisCycle: true,
        isPaidThisCycle: false,
    });

    const { expenses } = reconcileAutopayForRollover([failed], [], ASOF_ROLL);
    const rolled = rolloverRequiredExpenses(expenses, NEXT_PAYDAY);

    assert(
        rolled[0].dueDate === "2026-01-10",
        "a FAILED autopay keeps its past due date (correctly still owed/overdue)"
    );
}

function testManualBillStillCarriesOverdue() {
    // Unchanged behavior for manual bills — they still carry as owed until paid.
    const manual = expense({ id: "e1", isAutopay: false, dueDate: "2026-01-10", isPaidThisCycle: false });
    const rolled = rolloverRequiredExpenses(manual ? [manual] : [], NEXT_PAYDAY);
    assert(rolled[0].dueDate === "2026-01-10", "manual unpaid bill still carries its due date (unchanged)");
}

export function runReconcileAutopayTests() {
    console.log("Running autopay-reconcile tests...");

    testPresumedPaidPredicate();
    testExpenseReconcile();
    testFailedAutopayStaysOwed();
    testManualUnpaidUntouched();
    testFutureAutopayUntouched();
    testIdempotentOnPaid();
    testDebtMinimumReconcile();
    testDebtFailedAndManual();

    // Jason's Option-A condition — reconcile → rollover, end to end:
    testUntouchedAutopayBillNotOverdueNextCycle();
    testUntouchedAutopayDebtNotOverdueNextCycle();
    testFailedAutopayStillCarriesOwed();
    testManualBillStillCarriesOverdue();

    console.log("✅ All autopay-reconcile tests passed.");
}

runReconcileAutopayTests();
