"use client";

import { useMemo, useEffect, useState, type ChangeEvent } from "react";
import { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import {
    getNextPaycheckDate,
    type PayCycle,
} from "@/lib/payCycle/getNextPaycheckDate";
import type { Recurrence } from "@/lib/types/recurrence";
import "./page.css";

import { ResultsSection } from "@/components/ResultsSection";
import { GoalsSection } from "@/components/GoalsSection";
import { RequiredExpensesSection } from "@/components/RequiredExpensesSection";
import { DebtsSection } from "@/components/DebtsSection";
import { PaycheckSection } from "@/components/PaycheckSection";
import { SnowballSection } from "@/components/SnowballSection";

import {
    rolloverDebts,
    rolloverRequiredExpenses,
} from "@/lib/recurrence/rolloverPayCycle";

import type { Debt, RequiredExpense } from "@/lib/storage/debtPlannerStorage";
import { calculateMonthlyInterest } from "@/lib/debt/calculateMonthlyInterest";
import { downloadBackup, readBackupFile } from "@/lib/storage/backup";
import { parseDebtCsv } from "@/lib/imports/debtCsv";
import type { LivingExpense } from "@/lib/types/livingExpense";
import { livingExpensePresets } from "@/lib/constants/livingExpensePresets";
import { LivingExpensesSection } from "@/components/LivingExpensesSection";
import { applyDemoPlannerStateToStorage } from "@/lib/testing/seedPlannerState";

type Goal = {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    originalCurrentAmount?: number;
    type: "emergency" | "savings";
};

type CompletedRecommendedAction = {
    targetId: string;
    label: string;
    category: "emergency" | "snowball" | "optional_goal";
    recommendedAmount: number;
    actualAmount: number;
};

function getCurrentDate() {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), today.getDate())
        .toISOString()
        .slice(0, 10);
}

function formatRecurrence(recurrence: Recurrence) {
    switch (recurrence) {
        case "one-time":
            return "One-time";
        case "weekly":
            return "Weekly";
        case "biweekly":
            return "Every 2 weeks";
        case "per-paycheck":
            return "Every paycheck";
        case "monthly":
        default:
            return "Monthly";
    }
}

function loadStoredState<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;

    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;

    try {
        return JSON.parse(stored) as T;
    } catch {
        return fallback;
    }
}

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

export default function Home() {

    const importEnabled = process.env.NODE_ENV === "development";
    const [amount, setAmount] = useState(() =>
        loadStoredState("debtPlanner.amount", "")
    );

    const [livingExpenses, setLivingExpenses] = useState<LivingExpense[]>(() =>
        loadStoredState("debtPlanner.livingExpenses", livingExpensePresets.map((expense, index) => ({
            ...expense,
            id: `living-${index}`,
        }))
        )
    );

    const hasConfiguredPaycheck = amount !== "" && Number(amount) > 0;


    const [currentDate, setCurrentDate] = useState(() =>
        loadStoredState("debtPlanner.currentDate", getCurrentDate())
    );

    const [nextPaycheckDate, setNextPaycheckDate] = useState(() =>
        loadStoredState("debtPlanner.nextPaycheckDate", getNextPaycheckDate({
            payCycle: "biweekly",
            currentDate: getCurrentDate(),
        })));

    const [payCycle, setPayCycle] = useState<PayCycle>(() =>
        loadStoredState("debtPlanner.payCycle", "biweekly")
    );

    const [semiMonthlyFirstDay, setSemiMonthlyFirstDay] = useState(() =>
        loadStoredState("debtPlanner.semiMonthlyFirstDay", "1")
    );

    const [semiMonthlySecondDay, setSemiMonthlySecondDay] = useState(() =>
        loadStoredState("debtPlanner.semiMonthlySecondDay", "15")
    );

    const [monthlyPayDay, setMonthlyPayDay] = useState(() =>
        loadStoredState("debtPlanner.monthlyPayDay", "1")
    );

    const [requiredExpenses, setRequiredExpenses] = useState<RequiredExpense[]>(
        () => loadStoredState("debtPlanner.requiredExpenses", [])
    );

    const [expenseName, setExpenseName] = useState("");
    const [expenseAmount, setExpenseAmount] = useState("");
    const [expenseDueDate, setExpenseDueDate] = useState("");
    const [expenseRecurrence, setExpenseRecurrence] =
        useState<Recurrence>("monthly");
    const [expenseType, setExpenseType] = useState<"fixed" | "variable">("fixed");

    const [debts, setDebts] = useState<Debt[]>(() =>
        loadStoredState("debtPlanner.debts", [])
    );

    const [debtName, setDebtName] = useState("");
    const [debtBalance, setDebtBalance] = useState("");
    const [debtMinimumPayment, setDebtMinimumPayment] = useState("");
    const [debtDueDate, setDebtDueDate] = useState("");
    const [debtApr, setDebtApr] = useState("");
    const [debtType, setDebtType] = useState<"debt" | "bnpl">("debt");
    const [debtRecurrence, setDebtRecurrence] =
        useState<Recurrence>("monthly");

    const [debtRemainingPayments, setDebtRemainingPayments] = useState("");
    const [debtScheduledPaymentAmount, setDebtScheduledPaymentAmount] =
        useState("");

    const [goals, setGoals] = useState<Goal[]>(() =>
        loadStoredState("debtPlanner.goals", [])
    );

    const [goalName, setGoalName] = useState("Starter Emergency Fund");
    const [goalTargetAmount, setGoalTargetAmount] = useState("1000");
    const [goalCurrentAmount, setGoalCurrentAmount] = useState("");
    const [goalType, setGoalType] = useState<"emergency" | "savings">(
        "emergency"
    );

    const [completedRecommendedActions, setCompletedRecommendedActions] =
        useState<CompletedRecommendedAction[]>(() =>
            loadStoredState("debtPlanner.completedRecommendedActions", [])
        );

    const [activeTab, setActiveTab] = useState<
        "plan" | "bills" | "snowball" | "goals"
    >("plan");

    const [billsView, setBillsView] = useState<"expenses" | "debts" | null>(
        null
    );

    const [showBillsMenu, setShowBillsMenu] = useState(false);
    const [showPlanSettings, setShowPlanSettings] = useState(
        () => !hasConfiguredPaycheck
    );
    const [isFirstRunSetup, setIsFirstRunSetup] = useState(
        () => !hasConfiguredPaycheck
    );

    const [debtErrors, setDebtErrors] = useState<{
        name?: string;
        balance?: string;
        minimumPayment?: string;
        dueDate?: string;
        apr?: string;
    }>({});

    const [debtWarnings, setDebtWarnings] = useState<{
        minimumPayment?: string;
    }>({});

    const [expenseErrors, setExpenseErrors] = useState<{
        name?: string;
        amount?: string;
        dueDate?: string;
    }>({});

    const [goalErrors, setGoalErrors] = useState<{
        name?: string;
        targetAmount?: string;
    }>({});

    const [payoffStrategy, setPayoffStrategy] = useState<
        "snowball" | "avalanche"
    >(() => loadStoredState("debtPlanner.payoffStrategy", "snowball"));

    const [darkMode, setDarkMode] = useState(() => loadStoredState("debtPlanner.darkMode", false));

    const [isMounted, setIsMounted] = useState(false);

    function hasValidPayCycleInputs() {
        if (payCycle === "semimonthly") {
            const first = Number(semiMonthlyFirstDay);
            const second = Number(semiMonthlySecondDay);

            return (
                first >= 1 &&
                first <= 31 &&
                second >= 1 &&
                second <= 31 &&
                first !== second
            );
        }

        if (payCycle === "monthly") {
            const day = Number(monthlyPayDay);
            return day >= 1 && day <= 31;
        }

        return true;
    }

    const result = useMemo(() => {
        const value = Number(amount);

        if (!value || value <= 0 || !nextPaycheckDate) {
            return null;
        }

        return allocatePaycheck({
            paycheckAmount: value,
            currentDate,
            nextPaycheckDate,
            expenses: requiredExpenses,
            livingExpenses,
            debts,
            goals,
            strategy: payoffStrategy,
            paycheckBuffer: 50
        });
    }, [
        amount,
        currentDate,
        nextPaycheckDate,
        requiredExpenses,
        livingExpenses,
        debts,
        goals,
        payoffStrategy,
    ]);

    const activeDebts = debts.filter((debt) => debt.balance > 0);
    const paidOffDebts = debts.filter((debt) => debt.balance <= 0);

    useEffect(() => {
        localStorage.setItem("debtPlanner.livingExpenses", JSON.stringify(livingExpenses));
    }, [livingExpenses]);


    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setIsMounted(true);
        }, 0);



        return () => window.clearTimeout(timeout);
    }, []);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.completedRecommendedActions",
            JSON.stringify(completedRecommendedActions)
        );
    }, [completedRecommendedActions]);

    useEffect(() => {
        localStorage.setItem("debtPlanner.darkMode", JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem("debtPlanner.amount", JSON.stringify(amount));
    }, [amount]);

    useEffect(() => {
        localStorage.setItem("debtPlanner.payCycle", JSON.stringify(payCycle));
    }, [payCycle]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.semiMonthlyFirstDay",
            JSON.stringify(semiMonthlyFirstDay)
        );
    }, [semiMonthlyFirstDay]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.semiMonthlySecondDay",
            JSON.stringify(semiMonthlySecondDay)
        );
    }, [semiMonthlySecondDay]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.monthlyPayDay",
            JSON.stringify(monthlyPayDay)
        );
    }, [monthlyPayDay]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.currentDate",
            JSON.stringify(currentDate)
        );
    }, [currentDate]);

    useEffect(() => {
        localStorage.setItem("debtPlanner.nextPaycheckDate", JSON.stringify(nextPaycheckDate));
    }, [nextPaycheckDate]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.requiredExpenses",
            JSON.stringify(requiredExpenses)
        );
    }, [requiredExpenses]);

    useEffect(() => {
        localStorage.setItem("debtPlanner.debts", JSON.stringify(debts));
    }, [debts]);

    useEffect(() => {
        localStorage.setItem("debtPlanner.goals", JSON.stringify(goals));
    }, [goals]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.payoffStrategy",
            JSON.stringify(payoffStrategy)
        );
    }, [payoffStrategy]);

    function buildBackupData() {
        return {
            version: 1,
            exportedAt: new Date().toISOString(),

            amount,
            payCycle,
            semiMonthlyFirstDay,
            semiMonthlySecondDay,
            monthlyPayDay,

            currentDate,
            nextPaycheckDate,

            requiredExpenses,
            livingExpenses,
            debts,
            goals,

            completedRecommendedActions,
            payoffStrategy,
        };
    }

    async function handleImportDebtsCsv(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
            const importResult = await parseDebtCsv(file);

            if (importResult.debts.length > 0) {
                setDebts((current) => [...current, ...importResult.debts]);
            }

            if (importResult.errors.length > 0) {
                alert(
                    `Imported ${importResult.debts.length} debts with ${importResult.errors.length
                    } skipped rows.\n\n${importResult.errors
                        .slice(0, 5)
                        .join("\n")}`
                );
            } else {
                alert(`Imported ${importResult.debts.length} debts.`);
            }
        } catch {
            alert("Unable to import debt CSV.");
        }

        event.target.value = "";
    }

    function handleCalculate() {
        const value = Number(amount);

        if (!value || value <= 0 || !nextPaycheckDate || nextPaycheckDate <= currentDate) {
            return;
        }


        setIsFirstRunSetup(false);
        setShowPlanSettings(false);
        setActiveTab("plan");
    }

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
                isPaidThisCycle: false,
            },
        ]);

        setExpenseName("");
        setExpenseAmount("");
        setExpenseDueDate("");
        setExpenseRecurrence("monthly");
        setExpenseType("fixed");
    }

    function handleUpdateExpense(
        id: string,
        updates: Partial<Pick<RequiredExpense, "amount" | "dueDate">>
    ) {
        setRequiredExpenses((current) =>
            current.map((expense) =>
                expense.id === id ? { ...expense, ...updates } : expense
            )
        );
    }

    function handleAddDebt() {
        const balance = Number(debtBalance);
        const minimumPayment = Number(debtMinimumPayment);
        const apr = Number(debtApr || 0);
        const trimmedName = debtName.trim();

        const nextErrors: typeof debtErrors = {};
        const nextWarnings: typeof debtWarnings = {};

        if (!trimmedName) nextErrors.name = "Debt name is required.";
        if (!balance || balance <= 0) {
            nextErrors.balance = "Balance must be greater than zero.";
        }

        if (!minimumPayment || minimumPayment <= 0) {
            nextErrors.minimumPayment =
                "Minimum payment must be greater than zero.";
        }

        if (balance > 0 && minimumPayment > balance) {
            nextErrors.minimumPayment = "Minimum payment must not exceed balance.";
        }

        if (!debtDueDate) nextErrors.dueDate = "Due date is required.";

        if (apr < 0 || apr > 100) {
            nextErrors.apr = "APR must be between 0 and 100.";
        }

        const estimatedMonthlyInterest = (balance * (apr / 100)) / 12;

        if (apr > 0 && minimumPayment <= estimatedMonthlyInterest) {
            nextWarnings.minimumPayment =
                "Minimum payment may not cover monthly interest. Balance may increase unless extra is paid.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setDebtErrors(nextErrors);
            setDebtWarnings(nextWarnings);
            return;
        }

        setDebtErrors({});
        setDebtWarnings(nextWarnings);

        setDebts((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                name: trimmedName,
                balance,
                originalBalance: balance,
                minimumPayment,
                dueDate: debtDueDate,
                originalDueDate: debtDueDate,
                apr,
                type: debtType,
                recurrence: debtRecurrence,
                remainingPayments:
                    debtType === "bnpl" && debtRemainingPayments
                        ? Number(debtRemainingPayments)
                        : undefined,
                scheduledPaymentAmount:
                    debtType === "bnpl" && debtScheduledPaymentAmount
                        ? Number(debtScheduledPaymentAmount)
                        : undefined,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
            },
        ]);

        setDebtName("");
        setDebtBalance("");
        setDebtMinimumPayment("");
        setDebtDueDate("");
        setDebtApr("");
        setDebtType("debt");
        setDebtRecurrence("monthly");
        setDebtRemainingPayments("");
        setDebtScheduledPaymentAmount("");
    }

    function handleUpdateDebt(
        id: string,
        updates: Partial<
            Pick<Debt, "balance" | "minimumPayment" | "dueDate" | "apr">
        >
    ) {
        setDebts((current) =>
            current.map((debt) =>
                debt.id === id ? { ...debt, ...updates } : debt
            )
        );
    }

    function handleAddGoal() {
        const targetAmount = Number(goalTargetAmount);
        const currentAmount = Number(goalCurrentAmount || 0);
        const trimmedName = goalName.trim();

        const nextErrors: typeof goalErrors = {};

        if (!trimmedName) nextErrors.name = "Goal name is required.";

        if (!targetAmount || targetAmount <= 0) {
            nextErrors.targetAmount = "Target amount must be greater than 0.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setGoalErrors(nextErrors);
            return;
        }

        setGoalErrors({});

        setGoals((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                name: trimmedName,
                targetAmount,
                currentAmount,
                originalCurrentAmount: currentAmount,
                type: goalType,
            },
        ]);

        setGoalName("");
        setGoalTargetAmount("");
        setGoalCurrentAmount("");
        setGoalType("savings");
    }

    function handleUpdateGoal(
        id: string,
        updates: Partial<Pick<Goal, "targetAmount" | "currentAmount">>
    ) {
        setGoals((current) =>
            current.map((goal) =>
                goal.id === id ? { ...goal, ...updates } : goal
            )
        );
    }

    function handleRemoveExpense(id: string) {
        setRequiredExpenses((current) =>
            current.filter((expense) => expense.id !== id)
        );
    }

    function handleRemoveDebt(id: string) {
        setDebts((current) => current.filter((debt) => debt.id !== id));
    }

    function handleRemoveGoal(id: string) {
        setGoals((current) => current.filter((goal) => goal.id !== id));
    }

    function handleMarkExpensePaid(id: string) {
        setRequiredExpenses((current) =>
            current.map((expense) =>
                expense.id === id
                    ? {
                        ...expense,
                        isPaidThisCycle: !expense.isPaidThisCycle,
                    }
                    : expense
            )
        );
    }

    function handleMarkDebtMinimumPaid(id: string) {
        setDebts((current) =>
            current.map((debt) => {
                const currentlyPaid =
                    debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;

                return debt.id === id
                    ? {
                        ...debt,
                        minimumPaidThisCycle: !currentlyPaid,
                        isPaidThisCycle: !currentlyPaid,
                    }
                    : debt;
            })
        );
    }

    function handleMarkDebtSnowballPaid(id: string) {
        setDebts((current) =>
            current.map((debt) =>
                debt.id === id
                    ? {
                        ...debt,
                        snowballPaidThisCycle: !debt.snowballPaidThisCycle,
                    }
                    : debt
            )
        );
    }

    function handleMarkRecommendedAction(targetId: string, label: string, category: "emergency" | "snowball" | "optional_goal", recommendedAmount: number, actualAmount: number) {
        const existingAction = completedRecommendedActions.find((action) => action.targetId === targetId && action.label === label && action.category === category);

        if (existingAction) {
            if (category === "emergency" || category === "optional_goal") {
                setGoals((current) => current.map((goal) => goal.id === targetId ? {
                    ...goal,
                    currentAmount: roundMoney(Math.max(0, goal.currentAmount - existingAction.actualAmount)),
                } : goal));
            }

            setCompletedRecommendedActions((current) => current.filter((action) => !(action.targetId === targetId && action.label === label && action.category === category)));

            return;
        }

        let safeActualAmount = roundMoney(actualAmount);

        if (category === "emergency" || category === "optional_goal") {
            const goal = goals.find((item) => item.id === targetId);

            if (goal) {
                const remainingGoalAmount = roundMoney(Math.max(0, goal.targetAmount - goal.currentAmount));

                safeActualAmount = roundMoney(Math.min(safeActualAmount, remainingGoalAmount));

                setGoals((current) => current.map((item) => item.id === targetId ? {
                    ...item,
                    currentAmount: roundMoney(Math.min(item.targetAmount, item.currentAmount + safeActualAmount)),
                } : item));
            }
        }

        setCompletedRecommendedActions((current) => [
            ...current,
            {
                targetId,
                label,
                category,
                recommendedAmount,
                actualAmount: safeActualAmount,
            },
        ]);

    }

    function getCompletedRecommendedAmountForDebt(debtId: string) {
        return completedRecommendedActions
            .filter(
                (action) =>
                    action.category === "snowball" && action.targetId === debtId
            )
            .reduce((sum, action) => sum + action.actualAmount, 0);
    }

    function handleResetToToday() {
        setCurrentDate(getCurrentDate());

        setRequiredExpenses((current) =>
            current.map((expense) => ({
                ...expense,
                dueDate: expense.originalDueDate ?? expense.dueDate,
                isPaidThisCycle: false,
            }))
        );

        setDebts((current) =>
            current.map((debt) => ({
                ...debt,
                balance: debt.originalBalance ?? debt.balance,
                dueDate: debt.originalDueDate ?? debt.dueDate,
                minimumPaidThisCycle: false,
                snowballPaidThisCycle: false,
                isPaidThisCycle: false,
            }))
        );

        setGoals((current) =>
            current.map((goal) => ({
                ...goal,
                currentAmount: goal.originalCurrentAmount ?? goal.currentAmount,
            }))
        );

        setCompletedRecommendedActions([]);
    }

    function handleExportBackup() {
        downloadBackup(buildBackupData());
    }

    async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        try {
            const backup = await readBackupFile(file);

            setAmount(String(backup.amount ?? ""));
            setPayCycle(backup.payCycle ?? "biweekly");
            setSemiMonthlyFirstDay(String(backup.semiMonthlyFirstDay ?? 1));
            setSemiMonthlySecondDay(String(backup.semiMonthlySecondDay ?? 15));
            setMonthlyPayDay(String(backup.monthlyPayDay ?? 1));
            setCurrentDate(backup.currentDate ?? getCurrentDate());
            setNextPaycheckDate(backup.nextPaycheckDate ?? getNextPaycheckDate({
                payCycle: backup.payCycle ?? "biweekly",
                currentDate: backup.currentDate ?? getCurrentDate(),
                semiMonthlyFirstDay: Number(backup.semiMonthlyFirstDay ?? 1),
                semiMonthlySecondDay: Number(backup.semiMonthlySecondDay ?? 15),
                monthlyPayDay: Number(monthlyPayDay ?? 1),
            }));
            setRequiredExpenses(backup.requiredExpenses ?? []);
            setLivingExpenses(backup.livingExpenses ?? livingExpensePresets.map((expense, index) => ({
                ...expense,
                id: `living-${index}`,
            })));
            setDebts(backup.debts ?? []);
            setGoals(backup.goals ?? []);
            setCompletedRecommendedActions(
                backup.completedRecommendedActions ?? []
            );
            setPayoffStrategy(backup.payoffStrategy ?? "snowball");

            alert("Backup imported successfully.");
        } catch {
            alert("Unable to import backup file.");
        }

        event.target.value = "";
    }

    function handleRolloverPayCycle() {

        setDebts((current) =>
            rolloverDebts(
                current.map((debt) => {
                    if (debt.balance <= 0) {
                        return debt;
                    }

                    const minimumWasPaid =
                        debt.minimumPaidThisCycle ??
                        debt.isPaidThisCycle ??
                        false;

                    const completedSnowballAmount =
                        getCompletedRecommendedAmountForDebt(debt.id);

                    const interest = calculateMonthlyInterest(
                        debt.balance,
                        debt.apr
                    );

                    const balanceWithInterest = roundMoney(
                        debt.balance + interest
                    );

                    const minimumPaymentAmount = minimumWasPaid
                        ? Math.min(debt.minimumPayment, balanceWithInterest)
                        : 0;

                    const totalPayment = roundMoney(
                        minimumPaymentAmount + completedSnowballAmount
                    );

                    return {
                        ...debt,
                        balance: roundMoney(
                            Math.max(0, balanceWithInterest - totalPayment)
                        ),
                    };
                }),
                nextPaycheckDate
            )
        );

        setRequiredExpenses((current) =>
            rolloverRequiredExpenses(current, nextPaycheckDate)
        );

        setCompletedRecommendedActions([]);

        if (nextPaycheckDate) {
            const nextCycleStart = nextPaycheckDate;

            const followingPaycheckDate = getNextPaycheckDate({
                payCycle,
                currentDate: nextCycleStart,
                semiMonthlyFirstDay: Number(semiMonthlyFirstDay),
                semiMonthlySecondDay: Number(semiMonthlySecondDay),
                monthlyPayDay: Number(monthlyPayDay),
            });

            setCurrentDate(nextCycleStart);
            setNextPaycheckDate(followingPaycheckDate);
        }


    }

    function handlePopulateDemoData() {
        applyDemoPlannerStateToStorage(window.localStorage);
        window.location.reload();
    }

    if (!isMounted) {
        return null;
    }


    return (
        <main className={`app ${darkMode ? "dark-theme" : ""}`}>
            <div className="app-content">
                {process.env.NODE_ENV === "development" && (
                    <button
                        type="button"
                        className="dev-populate-button"
                        onClick={handlePopulateDemoData}
                    >
                        Populate Demo Data
                    </button>
                )}
                <section className="hero">
                    <h1>Debt Planner</h1>
                    <p>Enter a paycheck and see exactly what to do next.</p>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setDarkMode((current) => !current)}
                    >
                        {darkMode ? "Light Mode" : "Dark Mode"}
                    </button>
                </section>

                {activeTab === "plan" && (
                    <>
                        <div className="plan-toolbar">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setShowPlanSettings(true)}
                            >
                                Plan Settings
                            </button>
                        </div>

                        <ResultsSection
                            result={result}
                            requiredExpenses={requiredExpenses}
                            debts={debts}
                            goals={goals}
                            completedRecommendedActions={
                                completedRecommendedActions
                            }
                            currentDate={currentDate}
                            onMarkExpensePaid={handleMarkExpensePaid}
                            onMarkDebtMinimumPaid={handleMarkDebtMinimumPaid}
                            onMarkDebtSnowballPaid={handleMarkDebtSnowballPaid}
                            onMarkRecommendedAction={handleMarkRecommendedAction}
                        />
                    </>
                )}

                {activeTab === "snowball" && (
                    <SnowballSection
                        debts={debts}
                        result={result}
                        completedRecommendedActions={completedRecommendedActions}
                        payoffStrategy={payoffStrategy}
                        currentDate={currentDate}
                        setPayoffStrategy={setPayoffStrategy}
                    />
                )}

                {activeTab === "bills" && billsView === "expenses" && (
                    <>
                        <RequiredExpensesSection
                            expenses={requiredExpenses}
                            expenseName={expenseName}
                            expenseAmount={expenseAmount}
                            expenseDueDate={expenseDueDate}
                            expenseRecurrence={expenseRecurrence}
                            expenseType={expenseType}
                            formatRecurrence={formatRecurrence}
                            onExpenseNameChange={setExpenseName}
                            onExpenseAmountChange={setExpenseAmount}
                            onExpenseDueDateChange={setExpenseDueDate}
                            onExpenseRecurrenceChange={setExpenseRecurrence}
                            onExpenseTypeChange={setExpenseType}
                            onAddExpense={handleAddExpense}
                            onRemoveExpense={handleRemoveExpense}
                            onUpdateExpense={handleUpdateExpense}
                            expenseErrors={expenseErrors}
                        />

                        <LivingExpensesSection
                            livingExpenses={livingExpenses}
                            onLivingExpensesChange={setLivingExpenses}
                        />
                    </>
                )}

                {activeTab === "bills" && billsView === "debts" && (
                    <DebtsSection
                        activeDebts={activeDebts}
                        paidOffDebts={paidOffDebts}
                        debtName={debtName}
                        debtBalance={debtBalance}
                        debtMinimumPayment={debtMinimumPayment}
                        debtApr={debtApr}
                        debtDueDate={debtDueDate}
                        debtType={debtType}
                        debtRecurrence={debtRecurrence}
                        formatRecurrence={formatRecurrence}
                        debtRemainingPayments={debtRemainingPayments}
                        debtScheduledPaymentAmount={debtScheduledPaymentAmount}
                        onDebtRemainingPaymentsChange={
                            setDebtRemainingPayments
                        }
                        onDebtScheduledPaymentAmountChange={
                            setDebtScheduledPaymentAmount
                        }
                        onDebtNameChange={setDebtName}
                        onDebtBalanceChange={setDebtBalance}
                        onDebtMinimumPaymentChange={setDebtMinimumPayment}
                        onDebtAprChange={setDebtApr}
                        onDebtDueDateChange={setDebtDueDate}
                        onDebtTypeChange={setDebtType}
                        onDebtRecurrenceChange={setDebtRecurrence}
                        onImportDebtsCsv={handleImportDebtsCsv}
                        onAddDebt={handleAddDebt}
                        onRemoveDebt={handleRemoveDebt}
                        onUpdateDebt={handleUpdateDebt}
                        debtErrors={debtErrors}
                        debtWarnings={debtWarnings}
                    />
                )}

                {activeTab === "goals" && (
                    <GoalsSection
                        goals={goals}
                        goalName={goalName}
                        goalTargetAmount={goalTargetAmount}
                        goalCurrentAmount={goalCurrentAmount}
                        goalType={goalType}
                        goalErrors={goalErrors}
                        onGoalNameChange={setGoalName}
                        onGoalTargetAmountChange={setGoalTargetAmount}
                        onGoalCurrentAmountChange={setGoalCurrentAmount}
                        onGoalTypeChange={setGoalType}
                        onAddGoal={handleAddGoal}
                        onRemoveGoal={handleRemoveGoal}
                        onUpdateGoal={handleUpdateGoal}
                    />
                )}
            </div>

            <nav className="bottom-nav">
                <button
                    type="button"
                    className={
                        activeTab === "plan"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => setActiveTab("plan")}
                >
                    <span>🏠</span>
                    <small>Plan</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "bills"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => setShowBillsMenu((current) => !current)}
                >
                    <span>💳</span>
                    <small>Bills</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "snowball"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => setActiveTab("snowball")}
                >
                    <span>📈</span>
                    <small>Payoff</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "goals"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => setActiveTab("goals")}
                >
                    <span>🎯</span>
                    <small>Goals</small>
                </button>
            </nav>

            {showBillsMenu && (
                <div className="bottom-sheet-menu">
                    <button
                        type="button"
                        className={
                            billsView === "expenses"
                                ? "bottom-sheet-option active"
                                : "bottom-sheet-option"
                        }
                        onClick={() => {
                            setActiveTab("bills");
                            setBillsView("expenses");
                            setShowBillsMenu(false);
                        }}
                    >
                        <span>💷</span>
                        <small>Expenses</small>
                    </button>

                    <button
                        type="button"
                        className={
                            billsView === "debts"
                                ? "bottom-sheet-option active"
                                : "bottom-sheet-option"
                        }
                        onClick={() => {
                            setActiveTab("bills");
                            setBillsView("debts");
                            setShowBillsMenu(false);
                        }}
                    >
                        <span>💳</span>
                        <small>Debts</small>
                    </button>
                </div>
            )}

            {showPlanSettings && (
                <div
                    className="settings-overlay"
                    onClick={() => {
                        if (!isFirstRunSetup) {
                            setShowPlanSettings(false);
                        }
                    }}
                >
                    <div
                        className="settings-sheet"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="settings-sheet-header">
                            <h2>Plan Settings</h2>

                            {!isFirstRunSetup && (
                                <button
                                    type="button"
                                    className="text-action-button"
                                    onClick={() => setShowPlanSettings(false)}
                                >
                                    Close
                                </button>
                            )}
                        </div>

                        {isFirstRunSetup && (
                            <p className="setup-hint">
                                Enter your paycheck amount to create your first
                                plan.
                            </p>
                        )}

                        {isFirstRunSetup && (
                            <div className="setup-badge">
                                First Time Setup
                            </div>
                        )}

                        <PaycheckSection
                            amount={amount}
                            payCycle={payCycle}
                            semiMonthlyFirstDay={semiMonthlyFirstDay}
                            semiMonthlySecondDay={semiMonthlySecondDay}
                            monthlyPayDay={monthlyPayDay}
                            nextPaycheckDate={nextPaycheckDate}
                            currentDate={currentDate}
                            showAdminActions={!isFirstRunSetup}
                            onExportBackup={handleExportBackup}
                            onImportBackup={importEnabled ? handleImportBackup : undefined}
                            onAmountChange={setAmount}
                            onPayCycleChange={setPayCycle}
                            onNextPayCheckDateChange={setNextPaycheckDate}
                            onSemiMonthlyFirstDayChange={
                                setSemiMonthlyFirstDay
                            }
                            onSemiMonthlySecondDayChange={
                                setSemiMonthlySecondDay
                            }
                            onMonthlyPayDayChange={setMonthlyPayDay}
                            onCalculate={handleCalculate}
                            onRolloverPayCycle={handleRolloverPayCycle}
                            onResetToToday={handleResetToToday}
                        />
                    </div>
                </div>
            )}
        </main>
    );
}
