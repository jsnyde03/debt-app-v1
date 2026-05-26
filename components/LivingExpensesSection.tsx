import type { LivingExpense } from "@/lib/types/livingExpense";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type LivingExpensesSectionProps = {
    livingExpenses: LivingExpense[];
    onLivingExpensesChange: (expenses: LivingExpense[]) => void;
};

export function LivingExpensesSection({ livingExpenses, onLivingExpensesChange }: LivingExpensesSectionProps) {
    const enabledTotal = livingExpenses.filter((expense) => expense.enabled).reduce((sum, expense) => sum + expense.amount, 0);

    function updateExpense(id: string, updates: Partial<Pick<LivingExpense, "amount" | "enabled">>) {
        onLivingExpensesChange(livingExpenses.map((expense) => expense.id === id ? { ...expense, ...updates } : expense));
    }

    return (
        <section className="card">
            <h2>Living Expenses</h2>

            <p className="empty-state">
                Reserve cash for groceries, transportation, and everday spending before debt recommendations are calculated.
            </p>

            <div className="summary-card">
                <span>Reserved This Paycheck</span>
                <strong>{formatCurrency(enabledTotal)}</strong>
            </div>

            <div className="required-actions-list">
                {livingExpenses.map((expense) => (
                    <div key={expense.id} className="saved-item">
                        <div className="saved-item-left">
                            <div className="saved-title">{expense.name}</div>

                            <div className="saved-meta">
                                {expense.enabled
                                    ? "Reserved from flexible cash"
                                    : "Not included"}
                            </div>
                        </div>

                        <div className="saved-item-right">
                            <input
                                type="number"
                                value={expense.amount}
                                min="0"
                                onChange={(event) => updateExpense(expense.id, {
                                    amount: Number(event.target.value || 0),
                                })}
                                className="living-expense-amount-input"
                            />

                            <button
                                type="button"
                                className={expense.enabled
                                    ? "action-pill completed"
                                    : "action-pill"
                                }
                                onClick={() => updateExpense(expense.id, {
                                    enabled: !expense.enabled,
                                })}
                            >
                                {expense.enabled ? "On" : "Off"}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}