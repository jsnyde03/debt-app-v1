import { useEffect, useState } from "react";
import { loadStoredState } from "@/lib/storage/loadStoredState";
import type { RequiredExpense, RequiredExpenseCategory } from "@/lib/storage/debtPlannerStorage";
import type { Recurrence } from "@/lib/types/recurrence";
import { triggerErrorHaptic } from "@/lib/mobile/haptics";

export function useRequiredExpenses(saveResetSnapshot: (overrides?: { requiredExpenses?: RequiredExpense[] }) => void) {
    const [requiredExpenses, setRequiredExpenses] = useState<RequiredExpense[]>(
        () => loadStoredState("debtPlanner.requiredExpenses", [])
    );

    const [expenseName, setExpenseName] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseDueDate, setExpenseDueDate] = useState("");
    const [expenseRecurrence, setExpenseRecurrence] =
        useState<Recurrence>("monthly");
    const [expenseType, setExpenseType] = useState<"fixed" | "variable">("fixed");
    const [expenseCategory, setExpenseCategory] = useState<RequiredExpenseCategory>("other");
    const [expenseIsAutopay, setExpenseIsAutopay] = useState(false);

    const [expenseErrors, setExpenseErrors] = useState<{
        name?: string;
        amount?: string;
        dueDate?: string;
    }>({});

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.requiredExpenses",
            JSON.stringify(requiredExpenses)
        );
    }, [requiredExpenses]);

    function handleAddExpense() {
        const nextAmount = Number(expenseAmount);
        const trimmedName = expenseName.trim();

        const nextErrors: typeof expenseErrors = {};

        if (!trimmedName) nextErrors.name = "Expense name is required.";
        if (!nextAmount || nextAmount <= 0) {
            nextErrors.amount = "Amount must be greater than 0.";
        }
        if (!expenseDueDate) nextErrors.dueDate = "Due date is required.";

        if (Object.keys(nextErrors).length > 0) {
            setExpenseErrors(nextErrors);
            void triggerErrorHaptic();
            return;
        }

        setExpenseErrors({});

        setRequiredExpenses((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                name: trimmedName,
                amount: nextAmount,
                dueDate: expenseDueDate,
                originalDueDate: expenseDueDate,
                recurrence: expenseRecurrence,
                expenseType,
                category: expenseCategory,
                isAutopay: expenseIsAutopay,
                isPaidThisCycle: false,
            },
        ]);

        setExpenseName("");
        setExpenseAmount("");
        setExpenseDueDate("");
        setExpenseRecurrence("monthly");
        setExpenseType("fixed");
        setExpenseCategory("other");
        setExpenseIsAutopay(false);
    }

    function handleUpdateExpense(
        id: string,
        updates: Partial<Pick<RequiredExpense, "amount" | "dueDate" | "recurrence" | "expenseType" | "category" | "isAutopay">>
    ) {
        setRequiredExpenses((current) =>
            current.map((expense) =>
                expense.id === id ? { ...expense, ...updates } : expense
            )
        );
    }

    function handleRemoveExpense(id: string) {
        setRequiredExpenses((current) =>
            current.filter((expense) => expense.id !== id)
        );
    }

    function restoreExpense(expense: RequiredExpense) {
        setRequiredExpenses((current) => [...current, expense]);
    }

    function handleMarkExpensePaid(id: string) {
        setRequiredExpenses((current) => {
            const nextRequiredExpenses = current.map((expense) =>
                expense.id === id
                    ? {
                        ...expense,
                        isPaidThisCycle: !expense.isPaidThisCycle,
                    }
                    : expense
            );

            saveResetSnapshot({ requiredExpenses: nextRequiredExpenses });

            return nextRequiredExpenses;
        });
    }

    return {
        requiredExpenses,
        setRequiredExpenses,
        expenseName,
        setExpenseName,
        expenseAmount,
        setExpenseAmount,
        expenseDueDate,
        setExpenseDueDate,
        expenseRecurrence,
        setExpenseRecurrence,
        expenseType,
        setExpenseType,
        expenseCategory,
        setExpenseCategory,
        expenseIsAutopay,
        setExpenseIsAutopay,
        expenseErrors,
        handleAddExpense,
        handleUpdateExpense,
        handleRemoveExpense,
        restoreExpense,
        handleMarkExpensePaid,
    };
}
