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

/** Per-item paid decision from the payday checkpoint's Adjust view, keyed by the
 *  underlying expense / debt id. Items NOT in a map are left untouched (they
 *  weren't part of this cycle's required set). */
export type RequiredReconciliation = {
    expensePaid: Record<string, boolean>;
    debtPaid: Record<string, boolean>;
};

/**
 * Apply the itemized [Adjust] decisions to the required bills + debt minimums:
 *   • paid  → mark paid (same flags as the toggle) and clear any failed flag.
 *   • unpaid AUTOPAY → mark it failed (`autopayFailedThisCycle`) so it stays owed
 *     AND is exempt from the rollover auto-reconcile (the user reported it didn't run).
 *   • unpaid MANUAL → left unpaid/owed, no flags.
 * Pure + immutable; items outside the decision maps pass through by reference.
 */
export function applyRequiredReconciliation(
    expenses: RequiredExpense[],
    debts: Debt[],
    decisions: RequiredReconciliation
): { expenses: RequiredExpense[]; debts: Debt[] } {
    const nextExpenses = expenses.map((expense) => {
        if (!(expense.id in decisions.expensePaid)) return expense;
        if (decisions.expensePaid[expense.id]) {
            return { ...expense, isPaidThisCycle: true, autopayFailedThisCycle: false };
        }
        return expense.isAutopay
            ? { ...expense, isPaidThisCycle: false, autopayFailedThisCycle: true }
            : { ...expense, isPaidThisCycle: false };
    });

    const nextDebts = debts.map((debt) => {
        if (!(debt.id in decisions.debtPaid)) return debt;
        if (decisions.debtPaid[debt.id]) {
            return {
                ...debt,
                minimumPaidThisCycle: true,
                isPaidThisCycle: true,
                autopayFailedThisCycle: false,
            };
        }
        return debt.isAutopay
            ? {
                  ...debt,
                  minimumPaidThisCycle: false,
                  isPaidThisCycle: false,
                  autopayFailedThisCycle: true,
              }
            : { ...debt, minimumPaidThisCycle: false, isPaidThisCycle: false };
    });

    return { expenses: nextExpenses, debts: nextDebts };
}
