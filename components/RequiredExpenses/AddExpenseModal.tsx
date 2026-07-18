import { useState } from "react";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import type { RequiredExpenseCategory } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@core/types/recurrence";
import { requiredExpensePresets } from "@core/constants/requiredExpensePresets";
import { requiredExpenseCategoryOptions } from "./ExpenseListItem";

type AddExpenseModalProps = {
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
    };

    onExpenseNameChange: (value: string) => void;
    onExpenseAmountChange: (value: string) => void;
    onExpenseDueDateChange: (value: string) => void;
    onExpenseRecurrenceChange: (value: Recurrence) => void;
    onExpenseTypeChange: (value: "fixed" | "variable") => void;
    onExpenseCategoryChange: (value: RequiredExpenseCategory) => void;
    onExpenseIsAutopayChange: (value: boolean) => void;
    onAdd: () => void;
    onClose: () => void;
};

export function AddExpenseModal({
    expenseName,
    expenseAmount,
    expenseDueDate,
    expenseRecurrence,
    expenseType,
    expenseCategory,
    expenseIsAutopay,
    expenseErrors,
    onExpenseNameChange,
    onExpenseAmountChange,
    onExpenseDueDateChange,
    onExpenseRecurrenceChange,
    onExpenseTypeChange,
    onExpenseCategoryChange,
    onExpenseIsAutopayChange,
    onAdd,
    onClose,
}: AddExpenseModalProps) {
    const [showExpensePresets, setShowExpensePresets] = useState(false);

    return (
        <div
            className="center-modal-overlay"
            onClick={() => {
                triggerLightHaptic();
                onClose();
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
                            onClose();
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
                                setShowExpensePresets((current) => !current);
                            }}
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
                            type="text"
                            inputMode="decimal"
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

                        <div className="date-input-wrapper">
                            <input
                                type="date"
                                value={expenseDueDate}
                                onChange={(event) => onExpenseDueDateChange(event.target.value)}
                            />
                            {!expenseDueDate && (
                                <span className="date-input-placeholder">MM/DD/YYYY</span>
                            )}
                        </div>

                        {expenseErrors.dueDate && (
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
                            onAdd();
                        }}
                    >
                        Add Required Expense
                    </button>
                </div>
            </div>
        </div>
    );
}
