import { useState } from "react";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { useScrollFabVisible } from "@/lib/mobile/useScrollFabVisible";
import { Wallet } from "@/lib/icons";
import type { RequiredExpense, RequiredExpenseCategory } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { ExpenseListItem, requiredExpenseCategoryOptions } from "./RequiredExpenses/ExpenseListItem";
import { AddExpenseModal } from "./RequiredExpenses/AddExpenseModal";

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
    const pageSize = 10;
    const [expenseVisibleCount, setExpenseVisibleCount] = useState(pageSize);
    const showFab = useScrollFabVisible();

    const filteredExpenses = expenses.filter((expense) => {
        const matchesSearch = expense.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase());
        const matchesCategory = selectedCategory === "all" || (expense.category ?? "other") === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const visibleExpenses = filteredExpenses.slice(0, expenseVisibleCount);

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
                            setExpenseVisibleCount(pageSize);
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
                                setExpenseVisibleCount(pageSize);
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
                                    setExpenseVisibleCount(pageSize);
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredExpenses.length === 0 ? (
                    <div className="empty-debt-state compact-empty-state">
                        <Wallet size={48} className="empty-state-icon" aria-hidden="true" />
                        <strong>No Bills Added Yet.</strong>
                        <p>No required expenses added yet.</p>
                    </div>
                ) : (
                    visibleExpenses.map((expense) => (
                        <ExpenseListItem
                            key={expense.id}
                            expense={expense}
                            isEditing={editingExpenseId === expense.id}
                            formatRecurrence={formatRecurrence}
                            editAmount={editAmount}
                            editDueDate={editDueDate}
                            editRecurrence={editRecurrence}
                            editExpenseType={editExpenseType}
                            editCategory={editCategory}
                            editIsAutopay={editIsAutopay}
                            onEditAmountChange={setEditAmount}
                            onEditDueDateChange={setEditDueDate}
                            onEditRecurrenceChange={setEditRecurrence}
                            onEditExpenseTypeChange={setEditExpenseType}
                            onEditCategoryChange={setEditCategory}
                            onEditIsAutopayChange={setEditIsAutopay}
                            onStartEditing={startEditing}
                            onCancelEditing={cancelEditing}
                            onSaveEditing={saveEditing}
                            onRemoveExpense={onRemoveExpense}
                        />
                    ))
                )}

                {filteredExpenses.length > expenseVisibleCount && (
                    <div className="load-more-actions">
                        <button
                            type="button"
                            className="load-more-button"
                            onClick={() => {
                                triggerLightHaptic();
                                setExpenseVisibleCount((current) => current + pageSize);
                            }}
                        >
                            Load More
                        </button>
                    </div>
                )}
            </section>

            {showAddExpenseModal && (
                <AddExpenseModal
                    expenseName={expenseName}
                    expenseAmount={expenseAmount}
                    expenseDueDate={expenseDueDate}
                    expenseRecurrence={expenseRecurrence}
                    expenseType={expenseType}
                    expenseCategory={expenseCategory}
                    expenseIsAutopay={expenseIsAutopay}
                    expenseErrors={expenseErrors}
                    onExpenseNameChange={onExpenseNameChange}
                    onExpenseAmountChange={onExpenseAmountChange}
                    onExpenseDueDateChange={onExpenseDueDateChange}
                    onExpenseRecurrenceChange={onExpenseRecurrenceChange}
                    onExpenseTypeChange={onExpenseTypeChange}
                    onExpenseCategoryChange={onExpenseCategoryChange}
                    onExpenseIsAutopayChange={onExpenseIsAutopayChange}
                    onAdd={handleAddExpense}
                    onClose={() => setShowAddExpenseModal(false)}
                />
            )}

            {showFab && !showAddExpenseModal && (
                <button
                    type="button"
                    className="add-button floating-add-button bills-add-button"
                    onClick={() => {
                        triggerLightHaptic();
                        setShowAddExpenseModal(true);
                    }}
                    aria-label="Add Required Expense"
                >
                    + Add
                </button>
            )}
        </>
    );
}
