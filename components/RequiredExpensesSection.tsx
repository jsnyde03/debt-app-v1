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
}

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
    const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
    const [expensePage, setExpensePage] = useState(1);
    const [showExpensePresets, setShowExpensePresets] = useState(false);

    const filteredExpenses = expenses.filter((expense) => expense.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()));
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

    function handleAddExpense() {
        onAddExpense();
        setShowAddExpenseModal(false);
    }

    function renderExpense(expense: RequiredExpense) {
        const isEditing = editingExpenseId === expense.id;

        if (isEditing) {
            return (
                <div
                    key={expense.id}
                    className="saved-item compact-debt-edit-card compact-debt-edit-card"
                >
                    <div className="saved-title">{expense.name}</div>

                    <div className="compact-debt-edit-grid">
                        <div className="field">
                            <label>Amount</label>

                            <input
                                type="number"
                                value={editAmount}
                                onChange={(event) => setEditAmount(event.target.value)}
                            />
                        </div>

                        <div className="field">
                            <label>Due Date</label>

                            <input
                                type="date"
                                value={editDueDate}
                                onChange={(event) => setEditDueDate(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="debt-edit-actions">
                        <button
                            type="button"
                            className="text-action-button danger-action"
                            onClick={() => {
                                onRemoveExpense(expense.id);
                                cancelEditing();
                            }}
                        >
                            Remove
                        </button>

                        <div className="debt-edit-actions-right">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={cancelEditing}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="add-button debt-save-button"
                                onClick={() => saveEditing(expense.id)}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <button
                key={expense.id}
                type="button"
                className="saved-item saved-item-button"
                onClick={() => startEditing(expense)}
            >
                <div className="saved-item-left">
                    <div className="saved-title">
                        {expense.name}
                        {expense.isPaidThisCycle ? "✔" : ""}
                    </div>

                    <div className="saved-meta">
                        Due {expense.dueDate} · {formatRecurrence(expense.recurrence)} ·{" "}
                        {(expense.expenseType ?? "fixed") === "fixed"
                            ? "Fixed"
                            : "Variable"}
                    </div>
                </div>

                <div className="saved-item-right">
                    <strong className="saved-amount">
                        {formatCurrency(expense.amount)}
                    </strong>

                    <span className="row-chevron">›</span>
                </div>
            </button>
        );
    }

    return (
        <>
            <section className="card">
                <div className="section-heading-row">
                    <div>
                        <h2>Required Expenses</h2>

                        <p className="section-collapse-subtitle">
                            Bills and required expenses due each cycle.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-button compact-add-button"
                        onClick={() => setShowAddExpenseModal(true)}
                    >
                        + Add
                    </button>
                </div>

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
                    visibleExpenses.map(renderExpense)
                )}

                {filteredExpenses.length > pageSize && (
                    <div className="pagination-actions pagination-compact">
                        <button
                            type="button"
                            className="text-action-button"
                            disabled={expensePage <= 1}
                            onClick={() => setExpensePage((current) => Math.max(1, current - 1))}
                        >
                            ‹
                        </button>

                        <span className="pagination-status">
                            Page {expensePage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            className="text-action-button"
                            disabled={expensePage >= totalPages}
                            onClick={() => setExpensePage((current) => Math.min(totalPages, current + 1))}
                        >
                            ›
                        </button>
                    </div>
                )}
            </section>

            {showAddExpenseModal && (
                <div
                    className="center-modal-overlay"
                    onClick={() => setShowAddExpenseModal(false)}
                >
                    <div
                        className="center-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="center-modal-header">
                            <div>
                                <h2>Add Expense</h2>
                                <p>Add a required bill or payment.</p>
                            </div>

                            <button
                                type="button"
                                className="text-action-button"
                                onClick={() => setShowAddExpenseModal(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="form-grid">
                            <div className="field">
                                <button
                                    type="button"
                                    className="secondary-button preset-toggle-button"
                                    onClick={() => setShowExpensePresets((current) => !current)}
                                >
                                    {showExpensePresets
                                        ? "Hide Common Expenses"
                                        : "Choose A Common Expense"}
                                </button>

                                {showExpensePresets && (
                                    <div className="preset-grid compact-preset-grid">
                                        {requiredExpensePresets.map((preset) => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                className="preset-pill compact-preset-pill"
                                                onClick={() => {
                                                    onExpenseNameChange(preset.name);
                                                    onExpenseTypeChange(preset.expenseType);
                                                    onExpenseRecurrenceChange(preset.recurrence);
                                                    setShowExpensePresets(false);
                                                }}
                                            >
                                                {preset.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="field">
                                <label>Expense Name</label>

                                <input
                                    type="text"
                                    placeholder="Rent, phone, utilities"
                                    value={expenseName}
                                    onChange={(event) => onExpenseNameChange(event.target.value)}
                                />

                                {expenseErrors.name && (
                                    <p className="validation-error">
                                        {expenseErrors.name}
                                    </p>
                                )}
                            </div>

                            <div className="field">
                                <label>Amount Due</label>

                                <input
                                    type="number"
                                    placeholder="Amount Due"
                                    value={expenseAmount}
                                    onChange={(event) => onExpenseAmountChange(event.target.value)}
                                />

                                {expenseErrors.amount && (
                                    <p className="validation-error">
                                        {expenseErrors.amount}
                                    </p>
                                )}
                            </div>

                            <div className="field">
                                <label>Due Date</label>

                                <input
                                    type="date"
                                    placeholder="Ex. 01/01/2026"
                                    value={expenseDueDate}
                                    onChange={(event) => onExpenseDueDateChange(event.target.value)}
                                />

                                {expenseErrors.amount && (
                                    <p className="validation-error">
                                        {expenseErrors.dueDate}
                                    </p>
                                )}
                            </div>

                            <div className="field">
                                <label>Recurrence</label>

                                <select
                                    value={expenseRecurrence}
                                    onChange={(event) => onExpenseRecurrenceChange(event.target.value as Recurrence)}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Every 2 Weeks</option>
                                    <option value="per-paycheck">Every Paycheck</option>
                                    <option value="one-time">One Time</option>
                                </select>
                            </div>

                            <div className="field">
                                <label>Expense Type</label>

                                <select
                                    value={expenseType}
                                    onChange={(event) => onExpenseTypeChange(event.target.value as "fixed" | "variable")}
                                >
                                    <option value="fixed">Fixed</option>
                                    <option value="variable">Variable</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                className="add-button modal-primary-action"
                                onClick={handleAddExpense}
                            >
                                Add Required Expense
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}