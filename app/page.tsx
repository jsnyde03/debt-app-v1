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

import { type RecommendationOverride, type Debt, type RequiredExpense, type RequiredExpenseCategory } from "@/lib/storage/debtPlannerStorage";
import { calculateMonthlyInterest } from "@/lib/debt/calculateMonthlyInterest";
import { downloadBackup, readBackupFile } from "@/lib/storage/backup";
import { parseDebtCsv } from "@/lib/imports/debtCsv";
import type { LivingExpense } from "@/lib/types/livingExpense";
import { livingExpensePresets } from "@/lib/constants/livingExpensePresets";
import { LivingExpensesSection } from "@/components/LivingExpensesSection";
import { applyDemoPlannerStateToStorage } from "@/lib/testing/seedPlannerState";
import { StatusBar, Style } from "@capacitor/status-bar";
import { TimelineSection } from "@/components/TimelineSection";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { UpgradeSection } from "@/components/UpgradeSection";
import { initializeRevenueCat, getSubscriptionPlan, restorePurchases, purchasePremium, resetRevenueCatUserForTesting, getPremiumPackageInfo, type PremiumPackageInfo } from "@/lib/subscription/revenueCat";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { scheduleNotifications, cancelAllNotifications, requestNotificationPermission, hasNotificationPermission } from "@/lib/notifications/scheduleNotifications";
import { incrementRolloverCount, maybeRequestAppReview } from "@/lib/review/requestAppReview";
import { AppSkeleton } from "@/components/AppSkeleton";
import { PullToRefresh } from "@/components/PullToRefresh";
import { AppLockScreen } from "@/components/AppLockScreen";
import { useAppLock } from "@/lib/hooks/useAppLock";
import { Home as HomeIcon, CreditCard, TrendingUp, Target, Sun, Moon, Settings, Wallet } from "@/lib/icons";

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
    paymentSource?: "paycheck" | "external";
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
        case "quarterly":
            return "Quarterly";
        case "annually":
            return "Yearly";
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

function getDebtDisplayBalance(debt: Debt, completedSnowballAmount: number) {
    const paidMinimumAmount = debt.minimumPaidThisCycle || debt.isPaidThisCycle
        ? Math.min(debt.minimumPayment, debt.balance)
        : 0;

    return roundMoney(Math.max(0, debt.balance - paidMinimumAmount - completedSnowballAmount));
}

function formatLastSaved(value: string) {
    const savedAt = new Date(value);

    if (Number.isNaN(savedAt.getTime())) {
        return "Saved locally";
    }

    return `Saved locally · ${savedAt.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    })}`;
}

export default function Home() {

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
    const [expenseCategory, setExpenseCategory] = useState<RequiredExpenseCategory>("other");
    const [expenseIsAutopay, setExpenseIsAutopay] = useState(false);
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

    const [debtIsAutopay, setDebtIsAutopay] = useState(false);

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

    const [recommendationOverrides, setRecommendationOverrides] = useState<RecommendationOverride[]>([]);

    const [activeTab, setActiveTab] = useState<
        "plan" | "bills" | "snowball" | "goals"
    >("plan");

    const [billsView, setBillsView] = useState<"expenses" | "debts" | null>(
        null
    );

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

    const { appLockEnabled, setAppLockEnabled, isUnlocked, requestUnlock } = useAppLock();

    const [isDemoMode] = useState(() =>
        loadStoredState("debtPlanner.isDemoMode", false)
    );

    const [lastSavedAt, setLastSavedAt] = useState(() =>
        loadStoredState("debtPlanner.lastSavedAt", "")
    );
    const [statusMessage, setStatusMessage] = useState("");

    const [isMounted, setIsMounted] = useState(false);
    const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>("free");
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [premiumPackageInfo, setPremiumPackageInfo] = useState<PremiumPackageInfo | null>(null);
    const [purchaseStatus, setPurchaseStatus] = useState("");
    const [notificationsEnabled, setNotificationsEnabled] = useState(() =>
        loadStoredState("debtPlanner.notificationsEnabled", false)
    );

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

    const debtsWithDisplayBalances = debts.map((debt) => ({

        ...debt,
        displayBalance: getDebtDisplayBalance(debt, getCompletedRecommendedAmountForDebt(debt.id)),
    }));

    const activeDebts = debtsWithDisplayBalances.filter((debt) => debt.displayBalance > 0);
    const paidOffDebts = debtsWithDisplayBalances.filter((debt) => debt.displayBalance <= 0);

    useEffect(() => {
        localStorage.setItem("debtPlanner.livingExpenses", JSON.stringify(livingExpenses));
    }, [livingExpenses]);

    useEffect(() => {
        if (!showUpgrade || premiumPackageInfo) return;

        void getPremiumPackageInfo().then(setPremiumPackageInfo);
    }, [showUpgrade, premiumPackageInfo]);


    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setIsMounted(true);
        }, 0);

        async function loadSubscription() {
            try {
                if (process.env.NODE_ENV === "development") {
                    const mock = localStorage.getItem("debtPlanner.mockSubscription");
                    if (mock === "premium") {
                        setSubscriptionPlan("premium");

                        if (notificationsEnabled && nextPaycheckDate) {
                            const permitted = await hasNotificationPermission();
                            if (permitted) {
                                void scheduleNotifications({ nextPaycheckDate, requiredExpenses });
                            } else {
                                setNotificationsEnabled(false);
                            }
                        }

                        return;
                    }
                }

                await initializeRevenueCat();

                const plan = await getSubscriptionPlan();
                setSubscriptionPlan(plan);
                console.log("Loaded subscription plan:", plan);

                if (plan === "premium" && notificationsEnabled && nextPaycheckDate) {
                    const permitted = await hasNotificationPermission();
                    if (permitted) {
                        void scheduleNotifications({ nextPaycheckDate, requiredExpenses });
                    } else {
                        setNotificationsEnabled(false);
                    }
                }
            } catch (error) {
                console.log("RevenueCat init failed", error)
            }
        }

        void loadSubscription();

        return () => window.clearTimeout(timeout);
    }, []);

    useEffect(() => {
        if (!statusMessage) return;

        const timeout = window.setTimeout(() => {
            setStatusMessage("");
        }, 2200);

        return () => window.clearTimeout(timeout);
    }, [statusMessage]);

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
        localStorage.setItem("debtPlanner.notificationsEnabled", JSON.stringify(notificationsEnabled));
    }, [notificationsEnabled]);

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

    useEffect(() => {
        if (!isMounted) return;

        const savedAt = new Date().toISOString();
        setLastSavedAt(savedAt);
        localStorage.setItem("debtPlanner.lastSavedAt", JSON.stringify(savedAt));
    }, [
        isMounted,
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
        darkMode,
    ]);

    useEffect(() => {
        StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);

        StatusBar.setStyle({
            style: darkMode ? Style.Dark : Style.Light,
        }).catch(() => undefined);

        StatusBar.setBackgroundColor({ color: darkMode ? "#07111f" : "#eef3f8", }).catch(() => undefined);
    }, [darkMode]);

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
            lastSavedAt,
        };
    }

    function saveResetSnapshot(overrides?: {
        requiredExpenses?: RequiredExpense[];
        debts?: Debt[];
        goals?: Goal[];
        completedRecommendedActions?: CompletedRecommendedAction[];
    }) {
        if (typeof window === "undefined") return;

        const snapshot = {
            amount,
            payCycle,
            semiMonthlyFirstDay,
            semiMonthlySecondDay,
            monthlyPayDay,
            currentDate,
            nextPaycheckDate,
            requiredExpenses: overrides?.requiredExpenses ?? requiredExpenses,
            livingExpenses,
            debts: overrides?.debts ?? debts,
            goals: overrides?.goals ?? goals,
            completedRecommendedActions:
                overrides?.completedRecommendedActions ?? completedRecommendedActions,
            payoffStrategy,
            lastSavedAt,
        };

        window.localStorage.setItem(
            "debtPlanner.resetSnapshot",
            JSON.stringify(snapshot)
        );
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
        setStatusMessage("Plan updated");

        if (notificationsEnabled && subscriptionPlan === "premium") {
            void scheduleNotifications({ nextPaycheckDate, requiredExpenses });
        }
    }

    async function handleNotificationsToggle() {
        triggerLightHaptic();

        if (notificationsEnabled) {
            await cancelAllNotifications();
            setNotificationsEnabled(false);
        } else {
            const granted = await requestNotificationPermission();
            if (granted) {
                setNotificationsEnabled(true);
                if (nextPaycheckDate) {
                    void scheduleNotifications({ nextPaycheckDate, requiredExpenses });
                }
            }
        }
    }

    async function handlePullToRefresh() {
        await new Promise((resolve) => window.setTimeout(resolve, 450));

        const savedAt = new Date().toISOString();
        setLastSavedAt(savedAt);
        localStorage.setItem("debtPlanner.lastSavedAt", JSON.stringify(savedAt));
        setStatusMessage("Up to date");
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
                isAutopay: debtIsAutopay,
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
        setDebtIsAutopay(false);
    }

    function handleUpdateDebt(
        id: string,
        updates: Partial<
            Pick<Debt, "balance" | "minimumPayment" | "dueDate" | "apr" | "isAutopay" | "recurrence">
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

    function handleMarkDebtMinimumPaid(id: string) {
        setDebts((current) => {
            const nextDebts = current.map((debt) => {
                const currentlyPaid =
                    debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false;

                return debt.id === id
                    ? {
                        ...debt,
                        minimumPaidThisCycle: !currentlyPaid,
                        isPaidThisCycle: !currentlyPaid,
                    }
                    : debt;
            });

            saveResetSnapshot({ debts: nextDebts });

            return nextDebts;
        });
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

    function handleMarkRecommendedAction(targetId: string, label: string, category: "emergency" | "snowball" | "optional_goal", recommendedAmount: number, actualAmount: number, paymentSource: "paycheck" | "external" = "paycheck") {
        const existingAction = completedRecommendedActions.find((action) => action.targetId === targetId && action.label === label && action.category === category);

        if (existingAction) {
            const nextGoals =
                category === "emergency" || category === "optional_goal"
                    ? goals.map((goal) =>
                        goal.id === targetId
                            ? {
                                ...goal,
                                currentAmount: roundMoney(
                                    Math.max(0, goal.currentAmount - existingAction.actualAmount)
                                ),
                            }
                            : goal
                    )
                    : goals;

            const nextCompletedRecommendedActions = completedRecommendedActions.filter(
                (action) => !(action.targetId === targetId && action.label === label && action.category === category)
            );

            setGoals(nextGoals);
            setCompletedRecommendedActions(nextCompletedRecommendedActions);

            saveResetSnapshot({
                goals: nextGoals,
                completedRecommendedActions: nextCompletedRecommendedActions,
            });

            return;
        }

        let safeActualAmount = roundMoney(actualAmount);
        let nextGoals = goals;

        if (category === "emergency" || category === "optional_goal") {
            const goal = goals.find((item) => item.id === targetId);

            if (goal) {
                const remainingGoalAmount = roundMoney(Math.max(0, goal.targetAmount - goal.currentAmount));

                safeActualAmount = roundMoney(Math.min(safeActualAmount, remainingGoalAmount));

                nextGoals = goals.map((item) => item.id === targetId ? {
                    ...item,
                    currentAmount: roundMoney(Math.min(item.targetAmount, item.currentAmount + safeActualAmount)),
                } : item);
            }
        }

        const nextCompletedRecommendedActions = [
            ...completedRecommendedActions,
            {
                targetId,
                label,
                category,
                recommendedAmount,
                actualAmount: safeActualAmount,
                paymentSource,
            },
        ];

        setGoals(nextGoals);
        setCompletedRecommendedActions(nextCompletedRecommendedActions);

        saveResetSnapshot({
            goals: nextGoals,
            completedRecommendedActions: nextCompletedRecommendedActions,
        });
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
        const backup = loadStoredState<ReturnType<typeof buildBackupData> | null>(
            "debtPlanner.resetSnapshot",
            null
        );

        const today = getCurrentDate();

        if (!backup) {
            setCurrentDate(today);
            setStatusMessage("Reset to today");
            return;
        }

        const nextDate = getNextPaycheckDate({
            payCycle: backup.payCycle ?? payCycle,
            currentDate: today,
            semiMonthlyFirstDay: Number(
                backup.semiMonthlyFirstDay ?? semiMonthlyFirstDay
            ),
            semiMonthlySecondDay: Number(
                backup.semiMonthlySecondDay ?? semiMonthlySecondDay
            ),
            monthlyPayDay: Number(backup.monthlyPayDay ?? monthlyPayDay),
        });

        setAmount(String(backup.amount ?? ""));
        setPayCycle(backup.payCycle ?? payCycle);
        setSemiMonthlyFirstDay(String(backup.semiMonthlyFirstDay ?? semiMonthlyFirstDay));
        setSemiMonthlySecondDay(String(backup.semiMonthlySecondDay ?? semiMonthlySecondDay));
        setMonthlyPayDay(String(backup.monthlyPayDay ?? monthlyPayDay));
        setRequiredExpenses(backup.requiredExpenses ?? []);
        setLivingExpenses(backup.livingExpenses ?? livingExpenses);
        setDebts(backup.debts ?? []);
        setGoals(backup.goals ?? []);
        setCompletedRecommendedActions(backup.completedRecommendedActions ?? []);
        setPayoffStrategy(backup.payoffStrategy ?? payoffStrategy);
        setCurrentDate(today);
        setNextPaycheckDate(nextDate);
        setStatusMessage("Restored last safe snapshot");
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
                monthlyPayDay: Number(backup.monthlyPayDay ?? 1),
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

            setStatusMessage("Backup imported successfully");
        } catch {
            alert("Unable to import backup file.");
        }

        event.target.value = "";
    }

    async function handleRolloverPayCycle() {
        saveResetSnapshot();

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

            if (notificationsEnabled && subscriptionPlan === "premium") {
                const rolledExpenses = rolloverRequiredExpenses(requiredExpenses, nextPaycheckDate);
                void scheduleNotifications({ nextPaycheckDate: followingPaycheckDate, requiredExpenses: rolledExpenses });
            }
        }

        incrementRolloverCount();
        void maybeRequestAppReview();
    }

    function handlePopulateDemoData() {
        applyDemoPlannerStateToStorage(window.localStorage);
        window.location.reload();
    }

    function handleExitDemoMode() {
        window.localStorage.clear();
        window.location.reload();
    }

    if (!isMounted) {
        return <AppSkeleton darkMode={darkMode} />;
    }

    if (!isUnlocked) {
        return <AppLockScreen darkMode={darkMode} onUnlock={requestUnlock} />;
    }


    return (
        <main className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
            <PullToRefresh className="app-content" onRefresh={handlePullToRefresh}>
                {process.env.NODE_ENV === "development" && (
                    <button
                        type="button"
                        className="dev-populate-button"
                        onClick={handlePopulateDemoData}
                    >
                        Populate Demo Data
                    </button>
                )}
                {isDemoMode && (
                    <div className="demo-mode-banner" role="status">
                        <span>Demo Mode — viewing sample data</span>
                        <button
                            type="button"
                            className="demo-mode-exit-button"
                            onClick={() => {
                                triggerLightHaptic();
                                handleExitDemoMode();
                            }}
                        >
                            Start My Own Plan
                        </button>
                    </div>
                )}
                <section className="hero">
                    <h1>Debt Planner</h1>
                    <p>Enter a paycheck and see exactly what to do next.</p>
                    {lastSavedAt && (
                        <p className="last-saved-indicator">
                            {formatLastSaved(lastSavedAt)}
                        </p>
                    )}
                    {statusMessage && (
                        <div className="save-status-toast" role="status" aria-live="polite">
                            {statusMessage}
                        </div>
                    )}

                    <button
                        type="button"
                        className="theme-toggle"
                        aria-label={darkMode ? "Switch To Light Mode" : "Switch To Dark Mode"}
                        onClick={() => {
                            triggerLightHaptic();
                            setDarkMode((current) => !current);
                        }
                        }
                    >
                        {darkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
                    </button>

                    {process.env.NEXT_PUBLIC_DEV_MODE === "true" && (
                        <button
                            type="button"
                            className="rc-reset-button"
                            onClick={async () => {
                                try {
                                    triggerLightHaptic();

                                    const plan = await resetRevenueCatUserForTesting();

                                    setSubscriptionPlan(plan);
                                    setPurchaseStatus(`RevenueCat reset.  Current plan: ${plan}`);
                                    setShowUpgrade(false);
                                } catch (error) {
                                    setPurchaseStatus(error instanceof Error ? error.message : "RevenueCat reset failed.");
                                }
                            }}
                        >
                            RC Reset
                        </button>
                    )}
                </section>

                {activeTab === "plan" && (
                    <>
                        <div className="plan-toolbar">
                            <button
                                type="button"
                                className="settings-icon-button"
                                aria-label="Open Plan Settings"
                                onClick={() => {
                                    triggerLightHaptic();
                                    setShowPlanSettings(true);
                                }}
                            >
                                <Settings size={20} aria-hidden="true" />
                            </button>
                        </div>

                        <ResultsSection
                            result={result}
                            requiredExpenses={requiredExpenses}
                            debts={debts}
                            goals={goals}
                            payoffStrategy={payoffStrategy}
                            completedRecommendedActions={
                                completedRecommendedActions
                            }
                            currentDate={currentDate}
                            onMarkExpensePaid={handleMarkExpensePaid}
                            onMarkDebtMinimumPaid={handleMarkDebtMinimumPaid}
                            onMarkDebtSnowballPaid={handleMarkDebtSnowballPaid}
                            onMarkRecommendedAction={handleMarkRecommendedAction}
                            recommendationOverrides={recommendationOverrides}
                            onRecommendationOverrideChange={(
                                targetId,
                                category,
                                amount
                            ) => {
                                setRecommendationOverrides((current) => {
                                    const filtered = current.filter((override) => !(override.targetId === targetId && override.category === category));

                                    return [
                                        ...filtered,
                                        {
                                            targetId,
                                            category,
                                            amount,
                                        },
                                    ];
                                });
                            }}


                        />

                        <TimelineSection
                            result={result}
                            requiredExpenses={requiredExpenses}
                            debts={debts}
                            completedRecommendedActions={completedRecommendedActions}
                            currentDate={currentDate}
                            nextPaycheckDate={nextPaycheckDate}
                        />
                    </>
                )}

                {activeTab === "snowball" && (

                    <>
                        <SnowballSection
                            debts={debtsWithDisplayBalances}
                            result={result}
                            completedRecommendedActions={completedRecommendedActions}
                            payoffStrategy={payoffStrategy}
                            currentDate={currentDate}
                            subscriptionPlan={subscriptionPlan}
                            onUpgradeClick={() => {
                                setShowUpgrade(true);

                            }}
                            setPayoffStrategy={setPayoffStrategy}
                        />

                        {showUpgrade && (
                            <>
                                <UpgradeSection
                                    packageInfo={premiumPackageInfo}
                                    onClose={() => setShowUpgrade(false)}
                                    onUpgradeClick={async () => {
                                        setPurchaseStatus("Starting purchase...");
                                        try {
                                            const plan = await purchasePremium();
                                            setSubscriptionPlan(plan);

                                            if (plan === "premium") {
                                                setPurchaseStatus("Premium unlocked.");
                                                setShowUpgrade(false);
                                            } else {
                                                setPurchaseStatus("Premium did not unlock.");
                                            }
                                        } catch (error) {
                                            setPurchaseStatus(error instanceof Error ? error.message : "Purchase failed.");
                                        }
                                    }}

                                    onRestoreClick={async () => {
                                        try {
                                            const plan = await restorePurchases();

                                            setSubscriptionPlan(plan);

                                            if (plan === "premium") {
                                                setPurchaseStatus("Purchases restored.");
                                                setShowUpgrade(false);
                                            } else {
                                                setPurchaseStatus("No purchases found.");
                                            }
                                        } catch (error) {
                                            setPurchaseStatus(error instanceof Error ? error.message : "Restore failed");
                                        }
                                    }}


                                />
                                {purchaseStatus && (
                                    <p className="status-message">
                                        {purchaseStatus}
                                    </p>
                                )}
                            </>
                        )}
                    </>
                )}

                {activeTab === "bills" && (
                    <div className="mobile-section-switcher">
                        <button
                            type="button"
                            className={
                                billsView === "expenses"
                                    ? "mobile-section-switcher-button active"
                                    : "mobile-section-switcher-button"
                            }
                            onClick={() => {
                                triggerLightHaptic();
                                setBillsView("expenses");
                            }}
                        >
                            <Wallet size={18} aria-hidden="true" />
                            Expenses
                        </button>

                        <button
                            type="button"
                            className={
                                billsView === "debts"
                                    ? "mobile-section-switcher-button active"
                                    : "mobile-section-switcher-button"
                            }
                            onClick={() => {
                                triggerLightHaptic();
                                setBillsView("debts");
                            }}
                        >
                            <CreditCard size={18} aria-hidden="true" />
                            Debts
                        </button>
                    </div>
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
                            expenseCategory={expenseCategory}
                            expenseIsAutopay={expenseIsAutopay}
                            formatRecurrence={formatRecurrence}
                            onExpenseNameChange={setExpenseName}
                            onExpenseAmountChange={setExpenseAmount}
                            onExpenseDueDateChange={setExpenseDueDate}
                            onExpenseRecurrenceChange={setExpenseRecurrence}
                            onExpenseTypeChange={setExpenseType}
                            onExpenseCategoryChange={setExpenseCategory}
                            onExpenseIsAutopayChange={setExpenseIsAutopay}
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
                        debtIsAutopay={debtIsAutopay}
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
                        onDebtIsAutopayChange={setDebtIsAutopay}
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
            </PullToRefresh>

            <nav className="bottom-nav">
                <button
                    type="button"
                    className={
                        activeTab === "plan"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => {
                        triggerLightHaptic();
                        setActiveTab("plan");
                    }}
                >
                    <HomeIcon size={20} aria-hidden="true" />
                    <small>Plan</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "bills"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => {
                        triggerLightHaptic();
                        setActiveTab("bills");
                        setBillsView((current) => current ?? "expenses");
                    }}
                >
                    <CreditCard size={20} aria-hidden="true" />
                    <small>Bills</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "snowball"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => {
                        triggerLightHaptic();
                        setActiveTab("snowball");
                    }}
                >
                    <TrendingUp size={20} aria-hidden="true" />
                    <small>Payoff</small>
                </button>

                <button
                    type="button"
                    className={
                        activeTab === "goals"
                            ? "bottom-nav-item active"
                            : "bottom-nav-item"
                    }
                    onClick={() => {
                        triggerLightHaptic();
                        setActiveTab("goals");
                    }}
                >
                    <Target size={20} aria-hidden="true" />
                    <small>Goals</small>
                </button>
            </nav>

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
                            <div>
                                <h2>{isFirstRunSetup ? "Create Your First Plan" : "Plan Settings"}</h2>
                                {!isFirstRunSetup && (
                                    <p className="section-collapse-subtitle">
                                        Adjust paycheck, pay cycle, and plan settings.
                                    </p>
                                )}
                            </div>

                            {!isFirstRunSetup && (
                                <button
                                    type="button"
                                    className="text-action-button"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        setShowPlanSettings(false);
                                    }}
                                >
                                    Close
                                </button>
                            )}
                        </div>

                        {isFirstRunSetup && (
                            <p className="setup-hint">
                                Enter your paycheck to create your first
                                plan.
                            </p>
                        )}

                        {isFirstRunSetup && (
                            <div className="setup-badge">
                                First Time Setup
                            </div>
                        )}

                        {isFirstRunSetup && (
                            <div className="first-run-import-row">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        handlePopulateDemoData();
                                    }}
                                >
                                    Try with Sample Data
                                </button>

                                <label className="secondary-button import-button">
                                    Import Backup
                                    <input
                                        type="file"
                                        accept="json,application/json"
                                        onChange={handleImportBackup}
                                        hidden
                                    />
                                </label>
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
                            onImportBackup={handleImportBackup}
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

                        {!isFirstRunSetup && (
                            <div className="card notifications-settings-card">
                                <div className="notifications-settings-row">
                                    <div>
                                        <h3>Notifications</h3>
                                        <p className="section-collapse-subtitle">
                                            Paycheck-eve reminder and upcoming bill alerts.
                                        </p>
                                    </div>

                                    {subscriptionPlan === "premium" ? (
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={notificationsEnabled}
                                            className={notificationsEnabled ? "toggle-button toggle-on" : "toggle-button toggle-off"}
                                            onClick={handleNotificationsToggle}
                                            aria-label={notificationsEnabled ? "Disable notifications" : "Enable notifications"}
                                        >
                                            <span className="toggle-thumb" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="premium-pill"
                                            onClick={() => {
                                                triggerLightHaptic();
                                                setShowUpgrade(true);
                                                setActiveTab("snowball");
                                                setShowPlanSettings(false);
                                            }}
                                        >
                                            Premium
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isFirstRunSetup && (
                            <div className="card notifications-settings-card">
                                <div className="notifications-settings-row">
                                    <div>
                                        <h3>App Lock</h3>
                                        <p className="section-collapse-subtitle">
                                            Require Face ID or Touch ID to open the app.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={appLockEnabled}
                                        className={appLockEnabled ? "toggle-button toggle-on" : "toggle-button toggle-off"}
                                        onClick={() => {
                                            triggerLightHaptic();
                                            setAppLockEnabled(!appLockEnabled);
                                        }}
                                        aria-label={appLockEnabled ? "Disable app lock" : "Enable app lock"}
                                    >
                                        <span className="toggle-thumb" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="settings-legal-row">
                            <a
                                href="https://github.com/jsnyde03/debt-planner-stie/blob/main/privacy.html"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="legal-link"
                            >
                                Privacy Policy
                            </a>
                            <span className="legal-separator">·</span>
                            <a
                                href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="legal-link"
                            >
                                Terms of Use
                            </a>
                            <span className="legal-separator">·</span>
                            <a
                                href="https://github.com/jsnyde03/debt-planner-stie/blob/main/Paycheck%20Debt%20Planner%20Support"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="legal-link"
                            >
                                Support
                            </a>
                            <span className="legal-separator">·</span>
                            <a
                                href="https://apps.apple.com/account/subscriptions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="legal-link"
                            >
                                Manage Subscription
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
