import type { Debt, RequiredExpense } from "../storage/debtPlannerStorage";

/**
 * "Paid all required" — the payday checkpoint's one-tap happy path. Marks every
 * required item in the given id sets paid, using the SAME paid-state semantics as
 * the Plan tab's per-item toggles (so the two surfaces can never drift):
 *   • expense  → `isPaidThisCycle: true`            (mirrors `handleMarkExpensePaid`)
 *   • debt min → `minimumPaidThisCycle` + `isPaidThisCycle: true`
 *                                                    (mirrors `handleMarkDebtMinimumPaid`)
 * Marking paid also clears any `autopayFailedThisCycle` flag — an item the user is
 * now confirming paid is no longer a reported failure.
 *
 * The id sets are the required-THIS-CYCLE items (derived from the allocation at the
 * call site); selection stays out of this pure mutation so it's trivially testable.
 * Pure + immutable: unmarked items pass through by reference; only marked items are
 * replaced with new objects.
 */
export function bulkMarkRequiredPaid(
    expenses: RequiredExpense[],
    debts: Debt[],
    ids: { expenseIds: string[]; debtIds: string[] }
): { expenses: RequiredExpense[]; debts: Debt[] } {
    const expenseIdSet = new Set(ids.expenseIds);
    const debtIdSet = new Set(ids.debtIds);

    const nextExpenses = expenses.map((expense) =>
        expenseIdSet.has(expense.id)
            ? { ...expense, isPaidThisCycle: true, autopayFailedThisCycle: false }
            : expense
    );

    const nextDebts = debts.map((debt) =>
        debtIdSet.has(debt.id)
            ? {
                  ...debt,
                  minimumPaidThisCycle: true,
                  isPaidThisCycle: true,
                  autopayFailedThisCycle: false,
              }
            : debt
    );

    return { expenses: nextExpenses, debts: nextDebts };
}
