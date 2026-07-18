import type { Debt, RequiredExpense } from "@core/storage/debtPlannerStorage";

function toDate(date: string) {
    return new Date(`${date}T00:00:00`);
}

/**
 * An autopay item is presumed to have run once its due date has arrived (on or
 * before `asOfDate`) — autopay needs no manual tap. The presumption holds unless
 * the user explicitly flagged it failed at the payday check-in
 * (`autopayFailedThisCycle`). Non-autopay items are never presumed paid.
 *
 * Pure + shared: the payday reconciliation view uses it to show an autopay item's
 * TRUE current state, and `reconcileAutopayForRollover` uses it to resolve that
 * state into explicit paid flags before the cycle turns.
 */
export function isAutopayPresumedPaid(
    item: { isAutopay?: boolean; dueDate: string; autopayFailedThisCycle?: boolean },
    asOfDate: string
): boolean {
    return (
        item.isAutopay === true &&
        item.autopayFailedThisCycle !== true &&
        toDate(item.dueDate) <= toDate(asOfDate)
    );
}

/**
 * Resolve the autopay presumption into EXPLICIT paid flags just before a rollover,
 * so the existing rollover (due-date advance) AND balance math (applyRolloverPayment)
 * both read real flags — the presumption is computed in ONE place, never duplicated
 * across the two money paths (which is how a "due date advanced but balance never
 * reduced" bug would sneak in). A still-unpaid autopay bill / debt minimum whose due
 * date has passed is marked paid; a failed or not-yet-due autopay, and every manual
 * item, is left untouched. Idempotent — already-paid items pass through unchanged.
 *
 * This is the fix for the root-cause bug: autopay bills that pay-and-get-forgotten
 * used to carry into the next cycle as false-overdue (rollover ignored `isAutopay`).
 */
export function reconcileAutopayForRollover(
    expenses: RequiredExpense[],
    debts: Debt[],
    asOfDate: string
): { expenses: RequiredExpense[]; debts: Debt[] } {
    const reconciledExpenses = expenses.map((expense) => {
        if (expense.isPaidThisCycle) return expense;
        if (!isAutopayPresumedPaid(expense, asOfDate)) return expense;
        return { ...expense, isPaidThisCycle: true };
    });

    const reconciledDebts = debts.map((debt) => {
        const minimumWasPaid = debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;
        if (minimumWasPaid) return debt;
        if (!isAutopayPresumedPaid(debt, asOfDate)) return debt;
        return { ...debt, minimumPaidThisCycle: true };
    });

    return { expenses: reconciledExpenses, debts: reconciledDebts };
}
