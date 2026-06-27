import { useState } from "react";
import type { LivingExpense } from "@/lib/types/livingExpense";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";

type LivingExpensesSectionProps = {
    livingExpenses: LivingExpense[];
    onLivingExpensesChange: (expenses: LivingExpense[]) => void;
};

export function LivingExpensesSection({ livingExpenses, onLivingExpensesChange }: LivingExpensesSectionProps) {

    const [showManageModal, setShowManageModal] = useState(false);
    const enabledExpenses = livingExpenses.filter((expense) => expense.enabled);
    const enabledTotal = enabledExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    function updateExpense(id: string, updates: Partial<Pick<LivingExpense, "amount" | "enabled">>) {
        onLivingExpensesChange(livingExpenses.map((expense) => expense.id === id ? { ...expense, ...updates } : expense));
    }

    return (
        <>
            <section className="card living-expenses-summary-card bills-polish-card">
                <div className="section-heading-row">
                    <div>
                        <h2>Living Expenses</h2>
                        <p className="section-collapse-subtitle">
                            Reserve everyday spending before recommendations.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-button compact-add-button bills-add-button"
                        onClick={() => {
                            triggerLightHaptic();
                            setShowManageModal(true);}}
                    >
                        Manage
                    </button>
                </div>


                <div className="summary-card living-summary-card">
                    <span>Reserved This Paycheck</span>
                    <strong>{formatCurrency(enabledTotal)}</strong>

                    <p className="living-summary-meta">
                        {enabledExpenses.length === 0
                            ? "No living expenses included."
                            : `${enabledExpenses.length}
                        ${enabledExpenses.length === 1
                                ? "category"
                                : "categories"
                            } included.`}
                    </p>
                </div>
            </section>

            {showManageModal && (
                <div
                    className="center-modal-overlay"
                    onClick={() => setShowManageModal(false)}
                >
                    <div
                        className="center-modal bills-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="center-modal-header">
                            <div>
                                <h2>Living Expenses</h2>

                                <p>Choose everyday spending to reserve from flexible cash.</p>
                            </div>

                            <button
                                type="button"
                                className="text-action-list"
                                onClick={() => {
                                    triggerLightHaptic();
                                    setShowManageModal(false);}}
                            >
                                Close
                            </button>
                        </div>

                        <div className="required-actions-list">
                            {livingExpenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="saved-item living-expense-editor-row"
                                >
                                    <div className="saved-item-left">
                                        <div className="saved-title">
                                            {expense.name}
                                        </div>

                                        <div className={
                                            expense.enabled
                                                ? "saved-meta living-status-enabled"
                                                : "saved-meta living-status-disabled"
                                        }
                                        >
                                            {expense.enabled
                                                ? "Reserved From Flexible Cash"
                                                : "Not Included"}
                                        </div>
                                    </div>

                                    <div className="saved-item-right">
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={expense.amount === 0 ? "" : expense.amount}
                                            placeholder="0"
                                            onChange={(event) => updateExpense(expense.id, {
                                                amount: Number(event.target.value || 0),
                                            })}
                                            className="living-expense-amount-input"
                                        />

                                        <button
                                            type="button"
                                            className={expense.enabled ? "action-pill-completed" : "action-pill"}
                                            onClick={() => {
                                                triggerMediumHaptic();
                                                updateExpense(expense.id, {
                                                enabled: !expense.enabled,
                                            });
                                        }}
                                        >
                                            {expense.enabled ? "On" : "Off"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}