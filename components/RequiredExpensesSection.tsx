import { useState } from "react";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import type { RequiredExpense, RequiredExpenseCategory } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { requiredExpensePresets } from "@/lib/constants/requiredExpensePresets";

const requiredExpenseCategoryOptions: {
    value: RequiredExpenseCategory;
    label: string;
}[] = [
        { value: "housing", label: "Housing" },
        { value: "utilities", label: "Utilities" },
        { value: "insurance", label: "Insurance" },
        { value: "subscriptions", label: "Subscriptions" },
        { value: "medical", label: "Medical" },
        { value: "other", label: "Other" },
    ];

function formatRequiredExpenseCategory(category?: RequiredExpenseCategory) {
    return (
        requiredExpenseCategoryOptions.find((option) => option.value === (category ?? "other"))?.label ?? "Other");
}

function getRequiredExpenseCategoryIcon(category?: RequiredExpenseCategory) {
    switch (category) {
        case "housing":
            return "🏠";
        case "utilities":
            return "💡";
        case "insurance":
            return "🩺";
        case "subscriptions":
            return "📺";
        case "medical":
            return "💊";
        default:
            return "📌";
    }
}

type RequiredExpensesSectionProps = {
    expenses: RequiredExpense[];
    expenseName: string;
    expenseAmount: string;
    expenseDueDate: string;
    expenseRecurrence: Recurrence;
    expenseType: "fixed" | "variable";
    expenseCategory: RequiredExpenseCategory;
    expenseIsAutopay: boolean;
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
    onExpenseCategoryChange: (value: RequiredExpenseCategory) => void;
    onExpenseIsAutopayChange: (value: boolean) => void;
    onAddExpense: () => void;
    onRemoveExpense: (id: string) => void;
    onUpdateExpense: (
        id: string,
        updates: Partial<Pick<RequiredExpense, "amount" | "dueDate" | "recurrence" | "expenseType" | "category" | "isAutopay">>
    ) => void;
}

export function RequiredExpensesSection({
    expenses,
    expenseName,
    expenseAmount,
    expenseDueDate,
    expenseRecurrence,
    expenseType,
    expenseCategory,
    expenseIsAutopay,
    expenseErrors,
    formatRecurrence,
    onExpenseNameChange,
    onExpenseAmountChange,
    onExpenseDueDateChange,
    onExpenseRecurrenceChange,
    onExpenseTypeChange,
    onExpenseCategoryChange,
    onExpenseIsAutopayChange,
    onAddExpense,
    onRemoveExpense,
    onUpdateExpense,
}: RequiredExpensesSectionProps) {
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editRecurrence, setEditRecurrence] = useState<Recurrence>("monthly");
    const [editExpenseType, setEditExpenseType] = useState<"fixed" | "variable">("fixed");
    const [editCategory, setEditCategory] = useState<RequiredExpenseCategory>("other");
    const [editIsAutopay, setEditIsAutopay] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<RequiredExpenseCategory | "all">("all");
    const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
    const [expensePage, setExpensePage] = useState(1);
    const [showExpensePresets, setShowExpensePresets] = useState(false);

    const filteredExpenses = expenses.filter((expense) => {
        const matchesSearch = expense.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase());
        const matchesCategory = selectedCategory === "all" || (expense.category ?? "other") === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
    const visibleExpenses = filteredExpenses.slice((expensePage - 1) * pageSize, expensePage * pageSize);

    function startEditing(expense: RequiredExpense) {
        triggerLightHaptic();
        setEditingExpenseId(expense.id);
        setEditAmount(String(expense.amount));
        setEditDueDate(expense.dueDate);
        setEditRecurrence(expense.recurrence);
        setEditExpenseType(expense.expenseType ?? "fixed");
        setEditCategory(expense.category ?? "other");
        setEditIsAutopay(expense.isAutopay ?? false);
    }

    function cancelEditing() {
        triggerLightHaptic();
        setEditingExpenseId(null);
        setEditAmount("");
        setEditDueDate("");
        setEditRecurrence("monthly");
        setEditExpenseType("fixed");
        setEditCategory("other");
        setEditIsAutopay(false);
    }

    function saveEditing(id: string) {
        const amount = Number(editAmount);

        if (!amount || amount <= 0 || !editDueDate) {
            return;
        }

        onUpdateExpense(id, {
            amount,
            dueDate: editDueDate,
            recurrence: editRecurrence,
            expenseType: editExpenseType,
            category: editCategory,
            isAutopay: editIsAutopay,
        });

        triggerMediumHaptic();
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
                    className="saved-item debt-edit-card compact-debt-edit-card"
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

                    <details className="debt-advanced-edit">
                        <summary>Advanced</summary>

                        <div className="compact-expense-edit-grid advanced-grid">
                            <div className="field">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    value={editDueDate}
                                    onChange={(event) => setEditDueDate(event.target.value)}
                                />
                            </div>

                            <div className="field">
                                <label>Recurrence</label>
                                <select
                                    value={editRecurrence}
                                    onChange={(event) => setEditRecurrence(event.target.value as Recurrence)}
                                >
                                    <option value="one-time">One Time</option>
                                    <option value="per-paycheck">Every Paycheck</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Every 2 Weeks</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="annually">Yearly</option>
                                </select>
                            </div>

                            <div className="field">
                                <label>Type</label>
                                <select
                                    value={editExpenseType}
                                    onChange={(event) => setEditExpenseType(event.target.value as "fixed" | "variable")}
                                >
                                    <option value="fixed">Fixed</option>
                                    <option value="variable">Variable</option>
                                </select>
                            </div>

                            <div className="field">
                                <label>Category</label>
                                <select
                                    value={editCategory}
                                    onChange={(event) => setEditCategory(event.target.value as RequiredExpenseCategory)}
                                >
                                    {requiredExpenseCategoryOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="field checkbox-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={editIsAutopay}
                                        onChange={(event) => setEditIsAutopay(event.target.checked)}
                                    />
                                    Autopay
                                </label>
                            </div>
                        </div>
                    </details>

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
                className={`saved-item saved-item-button required-expense-row ${expense.isPaidThisCycle ? "required-expense-row-paid" : ""}`}
                onClick={() => startEditing(expense)}
            >
                <div className="saved-item-left">
                    <div className="saved-title">
                        {expense.name}
                        {expense.isPaidThisCycle ? "✔" : ""}
                        {expense.isAutopay && <span className="autopay-pill">Autopay</span>}
                        <span className="category-pill">
                            <span className="category-pill-icon">
                                {getRequiredExpenseCategoryIcon(expense.category)}
                            </span>

                            {formatRequiredExpenseCategory(expense.category)}
                        </span>
                    </div>

                    <div className="saved-meta">
                        Due {expense.dueDate} · {formatRecurrence(expense.recurrence)} ·{" "}
                        {(expense.expenseType ?? "fixed") === "fixed"
                            ? "Fixed"
                            : "Variable"}{" "}
                        · {formatRequiredExpenseCategory(expense.category)}
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
            <section className="card required-expenses-card bills-polish-card">
                <div className="section-heading-row">
                    <div>
                        <h2>Required Expenses</h2>

                        <p className="section-collapse-subtitle">
                            Bills and required expenses due each cycle.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-button compact-add-button bills-add-button"
                        onClick={() => {
                            triggerLightHaptic();
                            setShowAddExpenseModal(true);
                        }}
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

                    <div className="category-filter-row">
                        <button
                            type="button"
                            className={
                                selectedCategory === "all"
                                    ? "category-filter-pill active"
                                    : "category-filter-pill"
                            }
                            onClick={() => {
                                triggerLightHaptic();
                                setSelectedCategory("all");
                                setExpensePage(1);
                            }}
                        >
                            All
                        </button>

                        {requiredExpenseCategoryOptions.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={
                                    selectedCategory === option.value
                                        ? "category-filter-pill active"
                                        : "category-filter-pill"
                                }
                                onClick={() => {
                                    triggerLightHaptic();
                                    setSelectedCategory(option.value);
                                    setExpensePage(1);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
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
                    onClick={() => {
                        triggerLightHaptic();
                        setShowAddExpenseModal(false);
                    }}
                >
                    <div
                        className="center-modal bills-modal"
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
                                onClick={() => {
                                    triggerLightHaptic();
                                    setShowAddExpenseModal(false);
                                }}
                            >
                                Close
                            </button>
                        </div>

                        <div className="form-grid">
                            <div className="field">
                                <button
                                    type="button"
                                    className="secondary-button preset-toggle-button"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        setShowExpensePresets((current) => !current)}}
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
                                                    triggerLightHaptic();
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

                            <div className="field">
                                <label>Category</label>

                                <select
                                    value={expenseCategory}
                                    onChange={(event) => onExpenseCategoryChange(event.target.value as RequiredExpenseCategory)}
                                >
                                    {requiredExpenseCategoryOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="field checkbox-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={expenseIsAutopay}
                                        onChange={(event) => onExpenseIsAutopayChange(event.target.checked)}
                                    />
                                    Autopay
                                </label>
                            </div>

                            <button
                                type="button"
                                className="add-button modal-primary-action"
                                onClick={() => {
                                    triggerMediumHaptic();
                                    handleAddExpense();}}
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