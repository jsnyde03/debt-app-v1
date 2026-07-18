import { useEffect, useRef, useState } from "react";
import type { RequiredExpense, RequiredExpenseCategory } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@core/types/recurrence";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { triggerMediumHaptic } from "@/lib/mobile/haptics";
import { Home, Zap, Shield, Tv, Pill, Bookmark, Check, ChevronRight } from "@/lib/icons";
import type { ReactNode } from "react";

export const requiredExpenseCategoryOptions: {
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

export function formatRequiredExpenseCategory(category?: RequiredExpenseCategory) {
    return (
        requiredExpenseCategoryOptions.find((option) => option.value === (category ?? "other"))?.label ?? "Other");
}

export function getRequiredExpenseCategoryIcon(category?: RequiredExpenseCategory): ReactNode {
    switch (category) {
        case "housing":
            return <Home size={12} aria-hidden="true" />;
        case "utilities":
            return <Zap size={12} aria-hidden="true" />;
        case "insurance":
            return <Shield size={12} aria-hidden="true" />;
        case "subscriptions":
            return <Tv size={12} aria-hidden="true" />;
        case "medical":
            return <Pill size={12} aria-hidden="true" />;
        default:
            return <Bookmark size={12} aria-hidden="true" />;
    }
}

type ExpenseListItemProps = {
    expense: RequiredExpense;
    isEditing: boolean;
    formatRecurrence: (recurrence: Recurrence) => string;

    editAmount: string;
    editDueDate: string;
    editRecurrence: Recurrence;
    editExpenseType: "fixed" | "variable";
    editCategory: RequiredExpenseCategory;
    editIsAutopay: boolean;

    onEditAmountChange: (value: string) => void;
    onEditDueDateChange: (value: string) => void;
    onEditRecurrenceChange: (value: Recurrence) => void;
    onEditExpenseTypeChange: (value: "fixed" | "variable") => void;
    onEditCategoryChange: (value: RequiredExpenseCategory) => void;
    onEditIsAutopayChange: (value: boolean) => void;

    onStartEditing: (expense: RequiredExpense) => void;
    onCancelEditing: () => void;
    onSaveEditing: (id: string) => void;
    onRemoveExpense: (id: string) => void;
};

export function ExpenseListItem({
    expense,
    isEditing,
    formatRecurrence,
    editAmount,
    editDueDate,
    editRecurrence,
    editExpenseType,
    editCategory,
    editIsAutopay,
    onEditAmountChange,
    onEditDueDateChange,
    onEditRecurrenceChange,
    onEditExpenseTypeChange,
    onEditCategoryChange,
    onEditIsAutopayChange,
    onStartEditing,
    onCancelEditing,
    onSaveEditing,
    onRemoveExpense,
}: ExpenseListItemProps) {
    const [isAnimatingPaid, setIsAnimatingPaid] = useState(false);
    const prevIsPaid = useRef(expense.isPaidThisCycle ?? false);

    useEffect(() => {
        const isPaid = expense.isPaidThisCycle ?? false;
        const wasUnpaid = !prevIsPaid.current;
        prevIsPaid.current = isPaid;
        if (isPaid && wasUnpaid) {
            setIsAnimatingPaid(true);
            const t = window.setTimeout(() => setIsAnimatingPaid(false), 400);
            return () => window.clearTimeout(t);
        }
    }, [expense.isPaidThisCycle]);

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
                            onChange={(event) => onEditAmountChange(event.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label>Due Date</label>

                        <input
                            type="date"
                            value={editDueDate}
                            onChange={(event) => onEditDueDateChange(event.target.value)}
                        />
                    </div>
                </div>

                <details className="debt-advanced-edit">
                    <summary>Advanced</summary>

                    <div className="compact-expense-edit-grid advanced-grid">
                        <div className="field">
                            <label>Recurrence</label>
                            <select
                                value={editRecurrence}
                                onChange={(event) => onEditRecurrenceChange(event.target.value as Recurrence)}
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
                                onChange={(event) => onEditExpenseTypeChange(event.target.value as "fixed" | "variable")}
                            >
                                <option value="fixed">Fixed</option>
                                <option value="variable">Variable</option>
                            </select>
                        </div>

                        <div className="field">
                            <label>Category</label>
                            <select
                                value={editCategory}
                                onChange={(event) => onEditCategoryChange(event.target.value as RequiredExpenseCategory)}
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
                                    onChange={(event) => onEditIsAutopayChange(event.target.checked)}
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
                            triggerMediumHaptic();
                            onRemoveExpense(expense.id);
                            onCancelEditing();
                        }}
                    >
                        Remove
                    </button>

                    <div className="debt-edit-actions-right">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onCancelEditing}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="add-button debt-save-button"
                            onClick={() => onSaveEditing(expense.id)}
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
            className={`saved-item saved-item-button required-expense-row ${expense.isPaidThisCycle ? "required-expense-row-paid" : ""} ${isAnimatingPaid ? "animating-paid" : ""}`}
            onClick={() => onStartEditing(expense)}
        >
            <div className="saved-item-left">
                <div className="saved-title">
                    {expense.name}
                    {expense.isPaidThisCycle && <Check size={14} className="paid-off-icon" aria-hidden="true" />}
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

                <ChevronRight size={18} className="row-chevron" aria-hidden="true" />
            </div>
        </button>
    );
}
