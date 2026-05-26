import { useState } from "react";
import type { RequiredExpense } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { requiredExpensePresets } from "@/lib/constants/requiredExpensePresets";

type RequiredExpensesSectionProps = {
    expenses: RequiredExpense[];
    expenseName: string;
    expenseAmount: string;
    expenseDueDate: string;
    expenseRecurrence: Recurrence;
    expenseType: "fixed" | "variable";
    expenseErrors: {
        name?: string;
        amount?: string;
        dueDate?: string;
    }

    formatRecurrence: (recurrence: Recurrence) => string;

    onExpenseNameChange: (value: string) => void;
    onExpenseAmountChange: (value: string) => void;
    onExpenseDueDateChange: (value: string) => void;
    onExpenseRecurrenceChange: (value: Recurrence) => void;
    onExpenseTypeChange: (value: "fixed" | "variable") => void;

    onAddExpense: () => void;

    onRemoveExpense: (id: string) => void;

    onUpdateExpense: (
        id: string,
        updates: Partial<Pick<RequiredExpense, "amount" | "dueDate">>
    ) => void;
};

export function RequiredExpensesSection({
    expenses,
    expenseName,
    expenseAmount,
    expenseDueDate,
    expenseRecurrence,
    expenseType,
    expenseErrors,
    formatRecurrence,
    onExpenseNameChange,
    onExpenseAmountChange,
    onExpenseDueDateChange,
    onExpenseRecurrenceChange,
    onExpenseTypeChange,
    onAddExpense,
    onRemoveExpense,
    onUpdateExpense,
}: RequiredExpensesSectionProps) {
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
    const [expensePage, setExpensePage] = useState(1);
    const filteredExpenses = expenses.filter((expense) => expense.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
    const visibleExpenses = filteredExpenses.slice((expensePage - 1) * pageSize, expensePage * pageSize); 

    function startEditing(expense: RequiredExpense) {
        setEditingExpenseId(expense.id);
        setEditAmount(String(expense.amount));
        setEditDueDate(expense.dueDate);
    }

    function cancelEditing() {
        setEditingExpenseId(null);
        setEditAmount("");
        setEditDueDate("");
    }

    function saveEditing(id: string) {
        const amount = Number(editAmount);

        if (!amount || amount <= 0 || !editDueDate) {
            return;
        }

        onUpdateExpense(id, {
            amount,
            dueDate: editDueDate,
        });

        cancelEditing();
    }

    return (
        <section className="card">
            <h2>Required Expenses</h2>

            <button
                type="button"
                className="collapsible-header"
                onClick={() => setShowAddExpenseForm((current) => !current)}
            >
                <span>{showAddExpenseForm ? "- Add Expense" : "+ Add Expense"}</span>
            </button>

            {showAddExpenseForm && (
                <div className="form-grid">
                    <div className="field">
                        <label>Common Bills</label>

                        <div className="preset-grid">
                            {requiredExpensePresets.map((preset) => (
                                <button
                                    key={preset.name}
                                    type="button"
                                    className="preset-pill"
                                    onClick={() => {
                                        onExpenseNameChange(preset.name);
                                        onExpenseTypeChange(preset.expenseType);
                                        onExpenseRecurrenceChange(preset.recurrence);
                                    }}
                                >
                                    {preset.name}
                                </button>
                                )
                            )}
                        </div>
                    </div>
                    <div className="field">
                        <label>Expense name</label>

                        <input
                            type="text"
                            placeholder="Rent, phone, utilities"
                            value={expenseName}
                            onChange={(e) => onExpenseNameChange(e.target.value)}
                        />
                        {expenseErrors.name && (<p className="validation-error">{expenseErrors.name}</p>)}
                    </div>

                    <div className="field">
                        <label>Amount due</label>

                        <input
                            type="number"
                            placeholder="Amount due"
                            value={expenseAmount}
                            onChange={(e) => onExpenseAmountChange(e.target.value)}
                        />
                        {expenseErrors.amount && (<p className="validation-error">{expenseErrors.amount}</p>)}
                    </div>

                    <div className="field">
                        <label>Due date</label>

                        <input
                            type="date"
                            value={expenseDueDate}
                            onChange={(e) => onExpenseDueDateChange(e.target.value)}
                        />
                        {expenseErrors.dueDate && (<p className="validation-error">{expenseErrors.dueDate}</p>)}
                    </div>

                    <div className="field">
                        <label>Recurrence</label>

                        <select
                            value={expenseRecurrence}
                            onChange={(e) =>
                                onExpenseRecurrenceChange(e.target.value as Recurrence)
                            }
                        >
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="biweekly">Every 2 weeks</option>
                            <option value="per-paycheck">Every paycheck</option>
                            <option value="one-time">One-time</option>
                        </select>
                    </div>

                    <div className="field">
                        <label>Expense Type</label>

                        <select value={expenseType} onChange={(e) => onExpenseTypeChange(e.target.value as "fixed" | "variable")}>
                            <option value="fixed">Fixed</option>
                            <option value="variable">Variable</option>
                        </select>
                    </div>


                    <button className="add-button" onClick={onAddExpense}>
                        Add Required Expense
                    </button>
                </div>
            )}

            <div className="expense-controls">
                <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setExpensePage(1);
                    }}
                    
                />
            </div>

            {filteredExpenses.length === 0 ? (
                <p className="empty-state">No required expenses added yet.</p>
            ) : (
                visibleExpenses.map((expense) => {
                    const isEditing = editingExpenseId === expense.id;

                    return (
                        <div key={expense.id} className="saved-item">
                            {isEditing ? (
                                <>
                                    <div className="field">
                                        <label>Amount due</label>

                                        <input
                                            type="number"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                        />
                                    </div>

                                    <div className="field">
                                        <label>Due date</label>

                                        <input
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) => setEditDueDate(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        className="secondary-button"
                                        onClick={() => saveEditing(expense.id)}
                                    >
                                        Save
                                    </button>

                                    <button
                                        className="secondary-button"
                                        onClick={cancelEditing}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <div className="saved-title">
                                            {expense.name}
                                            {expense.isPaidThisCycle ? " ✓" : ""}
                                        </div>

                                        <div className="saved-meta">
                                            Due {expense.dueDate} ·{" "}
                                            {formatRecurrence(expense.recurrence)} ·{" "}
                                            {(expense.expenseType ?? "fixed") === "fixed" ? "Fixed" : "Variable"}
                                        </div>
                                    </div>

                                    <div className="saved-amount">{formatCurrency(expense.amount)}</div>

                                    <div className="saved-actions">
                                        <button
                                            className="text-action-button"
                                            onClick={() => startEditing(expense)}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            className="text-action-button danger-action"
                                            onClick={() => onRemoveExpense(expense.id)}
                                        >
                                            Remove
                                        </button>

                                    </div>

                                </>
                            )}
                        </div>
                    );
                })
            )}

            {filteredExpenses.length > pageSize && (
                    <div className="pagination-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            disabled={expensePage === 1}
                            onClick={() => setExpensePage((current) => Math.max(1, current - 1))}
                        >
                            Previous
                        </button>

                        <span className="pagination-status">
                            Page {expensePage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            className="secondary-button"
                            disabled={expensePage === totalPages}
                            onClick={() => setExpensePage((current) => Math.min(totalPages, current + 1))}
                        >
                            Next
                        </button>
                    </div>
                )}
        </section>
    );
}
