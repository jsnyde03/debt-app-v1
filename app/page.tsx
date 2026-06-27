"use client";

import { useMemo, useEffect, useState, type ChangeEvent } from "react";
import { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import { getNextPaycheckDate } from "@/lib/payCycle/getNextPaycheckDate";
import type { Recurrence } from "@/lib/types/recurrence";
import "./styles/00-theme-and-base.css";
import "./styles/01-payoff-goals.css";
import "./styles/02-overdue-pagination-nav.css";
import "./styles/03-nav-results-modals.css";
import "./styles/04-debt-modals-focus.css";
import "./styles/05-timeline-whatif.css";
import "./styles/06-forecast-and-payoff-shell.css";
import "./styles/07-premium-upgrade.css";
import "./styles/08-dark-theme-polish.css";
import "./styles/09-anim-swipe-media-misc.css";
import "./styles/10-onboarding.css";

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
import { applyRolloverPayment } from "@/lib/debt/applyRolloverPayment";
import { downloadBackup, readBackupFile } from "@/lib/storage/backup";
import { parseDebtCsv } from "@/lib/imports/debtCsv";
import type { LivingExpense } from "@/lib/types/livingExpense";
import { livingExpensePresets } from "@/lib/constants/livingExpensePresets";
import { LivingExpensesSection } from "@/components/LivingExpensesSection";
import { applyDemoPlannerStateToStorage } from "@/lib/testing/seedPlannerState";
import { TimelineSection } from "@/components/TimelineSection";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { UpgradeSection } from "@/components/UpgradeSection";
import { initializeRevenueCat, getSubscriptionPlan, restorePurchases, purchasePremium, resetRevenueCatUserForTesting, getPremiumPackageInfo, type PremiumPackageInfo } from "@/lib/subscription/revenueCat";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { scheduleNotifications, cancelAllNotifications, requestNotificationPermission, hasNotificationPermission } from "@/lib/notifications/scheduleNotifications";
import { incrementRolloverCount, maybeRequestAppReview } from "@/lib/review/requestAppReview";
import { AppSkeleton } from "@/components/AppSkeleton";
import { PullToRefresh } from "@/components/PullToRefresh";
import { loadStoredState } from "@/lib/storage/loadStoredState";
import { useDarkMode } from "@/lib/hooks/useDarkMode";
import { useGoals, type Goal } from "@/lib/hooks/useGoals";
import { useRequiredExpenses } from "@/lib/hooks/useRequiredExpenses";
import { useDebts } from "@/lib/hooks/useDebts";
import { usePayCycleSettings, getCurrentDate } from "@/lib/hooks/usePayCycleSettings";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useNotificationsSetting } from "@/lib/hooks/useNotificationsSetting";
import { AppLockScreen } from "@/components/AppLockScreen";
import { useAppLock } from "@/lib/hooks/useAppLock";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { OnboardingFlow } from "@/components/Onboarding/OnboardingFlow";
import { Home as HomeIcon, CreditCard, TrendingUp, Target, Sun, Moon, Settings, Wallet } from "@/lib/icons";

type CompletedRecommendedAction = {
    targetId: string;
    label: string;
    category: "emergency" | "snowball" | "optional_goal";
    recommendedAmount: number;
    actualAmount: number;
    paymentSource?: "paycheck" | "external";
};

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

    const {
        amount, setAmount,
        currentDate, setCurrentDate,
        nextPaycheckDate, setNextPaycheckDate,
        payCycle, setPayCycle,
        semiMonthlyFirstDay, setSemiMonthlyFirstDay,
        semiMonthlySecondDay, setSemiMonthlySecondDay,
        monthlyPayDay, setMonthlyPayDay,
    } = usePayCycleSettings();

    const [livingExpenses, setLivingExpenses] = useState<LivingExpense[]>(() =>
        loadStoredState("debtPlanner.livingExpenses", livingExpensePresets.map((expense, index) => ({
            ...expense,
            id: `living-${index}`,
        }))
        )
    );

    const hasConfiguredPaycheck = amount !== "" && Number(amount) > 0;

    const {
        goals, setGoals,
        goalName, setGoalName,
        goalTargetAmount, setGoalTargetAmount,
        goalCurrentAmount, setGoalCurrentAmount,
        goalType, setGoalType,
        goalErrors,
        handleAddGoal,
        handleUpdateGoal,
        handleRemoveGoal,
    } = useGoals();

    const { darkMode, setDarkMode } = useDarkMode();

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
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [payoffStrategy, setPayoffStrategy] = useState<
        "snowball" | "avalanche"
    >(() => loadStoredState("debtPlanner.payoffStrategy", "snowball"));

    const { appLockEnabled, setAppLockEnabled, isUnlocked, requestUnlock } = useAppLock();
    const { hasCompletedOnboarding } = useOnboarding();

    const [isDemoMode] = useState(() =>
        loadStoredState("debtPlanner.isDemoMode", false)
    );

    const [lastSavedAt, setLastSavedAt] = useState(() =>
        loadStoredState("debtPlanner.lastSavedAt", "")
    );
    const [statusMessage, setStatusMessage] = useState("");

    const [isMounted, setIsMounted] = useState(false);

    const {
        requiredExpenses, setRequiredExpenses,
        expenseName, setExpenseName,
        expenseAmount, setExpenseAmount,
        expenseDueDate, setExpenseDueDate,
        expenseRecurrence, setExpenseRecurrence,
        expenseType, setExpenseType,
        expenseCategory, setExpenseCategory,
        expenseIsAutopay, setExpenseIsAutopay,
        expenseErrors,
        handleAddExpense,
        handleUpdateExpense,
        handleRemoveExpense,
        handleMarkExpensePaid,
    } = useRequiredExpenses(saveResetSnapshot);

    const {
        debts, setDebts,
        debtName, setDebtName,
        debtBalance, setDebtBalance,
        debtMinimumPayment, setDebtMinimumPayment,
        debtDueDate, setDebtDueDate,
        debtApr, setDebtApr,
        debtType, setDebtType,
        debtRecurrence, setDebtRecurrence,
        debtIsAutopay, setDebtIsAutopay,
        debtRemainingPayments, setDebtRemainingPayments,
        debtScheduledPaymentAmount, setDebtScheduledPaymentAmount,
        debtErrors,
        debtWarnings,
        handleAddDebt,
        handleUpdateDebt,
        handleRemoveDebt,
        handleMarkDebtMinimumPaid,
        handleMarkDebtSnowballPaid,
    } = useDebts(saveResetSnapshot);

    const {
        notificationsEnabled, setNotificationsEnabled,
        handleNotificationsToggle,
    } = useNotificationsSetting(nextPaycheckDate, requiredExpenses);

    const {
        subscriptionPlan, setSubscriptionPlan,
        showUpgrade, setShowUpgrade,
        purchaseStatus, setPurchaseStatus,
    } = useSubscription(notificationsEnabled, nextPaycheckDate, requiredExpenses, setNotificationsEnabled);

    const [premiumPackageInfo, setPremiumPackageInfo] = useState<PremiumPackageInfo | null>(null);

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
        setShowDeleteConfirm(false);
        setActiveTab("plan");
        setStatusMessage("Plan updated");

        if (notificationsEnabled) {
            void scheduleNotifications({ nextPaycheckDate, requiredExpenses });
        }
    }

    async function handlePullToRefresh() {
        await new Promise((resolve) => window.setTimeout(resolve, 450));

        const savedAt = new Date().toISOString();
        setLastSavedAt(savedAt);
        localStorage.setItem("debtPlanner.lastSavedAt", JSON.stringify(savedAt));
        setStatusMessage("Up to date");
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
        triggerMediumHaptic();
        saveResetSnapshot();

        setDebts((current) =>
            rolloverDebts(
                current.map((debt) =>
                    applyRolloverPayment(
                        debt,
                        getCompletedRecommendedAmountForDebt(debt.id)
                    )
                ),
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

            if (notificationsEnabled) {
                const rolledExpenses = rolloverRequiredExpenses(requiredExpenses, nextPaycheckDate);
                void scheduleNotifications({ nextPaycheckDate: followingPaycheckDate, requiredExpenses: rolledExpenses });
            }
        }

        incrementRolloverCount();
        void maybeRequestAppReview();
        setStatusMessage("Cycle complete — great work!");
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

    if (!hasCompletedOnboarding && !isDemoMode) {
        return (
            <main className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
                <OnboardingFlow />
            </main>
        );
    }

    return (
        <main className={`app ${darkMode ? "dark-theme" : "light-theme"}`}>
            <PullToRefresh className="app-content" onRefresh={handlePullToRefresh}>

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
                <section className={activeTab === "plan" ? "hero" : "hero hero-page"}>
                    {activeTab === "plan" ? (
                        <>
                            <h1>Debt Planner</h1>
                            <p>Enter a paycheck and see exactly what to do next.</p>
                        </>
                    ) : activeTab === "bills" ? (
                        <>
                            <h1 className="page-heading">Bills</h1>
                            <p className="page-subheading">Manage recurring expenses and debts.</p>
                        </>
                    ) : activeTab === "snowball" ? (
                        <>
                            <h1 className="page-heading">Payoff</h1>
                            <p className="page-subheading">Optimize your debt payoff strategy.</p>
                        </>
                    ) : activeTab === "goals" ? (
                        <>
                            <h1 className="page-heading">Goals</h1>
                            <p className="page-subheading">Track savings goals and emergency funds.</p>
                        </>
                    ) : null}
                    {lastSavedAt && activeTab === "plan" && (
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

                <div key={activeTab} className="tab-content-transition">
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

                        <div className="plan-tab-grid">
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
                                goals={goals}
                                livingExpenses={livingExpenses}
                                completedRecommendedActions={completedRecommendedActions}
                                currentDate={currentDate}
                                nextPaycheckDate={nextPaycheckDate}
                                payCycleConfig={{
                                    payCycle,
                                    semiMonthlyFirstDay: semiMonthlyFirstDay ? Number(semiMonthlyFirstDay) : undefined,
                                    semiMonthlySecondDay: semiMonthlySecondDay ? Number(semiMonthlySecondDay) : undefined,
                                    monthlyPayDay: monthlyPayDay ? Number(monthlyPayDay) : undefined,
                                }}
                                strategy={payoffStrategy}
                            />
                        </div>
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
                    <div className="bills-tab-content" data-bills-view={billsView ?? "expenses"}>
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

                        <div className="bills-expenses-col">
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
                        </div>

                        <div className="bills-debts-col">
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
                        </div>
                    </div>
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

            <nav className="sidebar-nav">
                <div className="sidebar-logo" aria-hidden="true">
                    <TrendingUp size={20} />
                </div>
                <button
                    type="button"
                    className={activeTab === "plan" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                    onClick={() => { triggerLightHaptic(); setActiveTab("plan"); }}
                >
                    <HomeIcon size={22} aria-hidden="true" />
                    <small>Plan</small>
                </button>
                <button
                    type="button"
                    className={activeTab === "bills" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                    onClick={() => { triggerLightHaptic(); setActiveTab("bills"); setBillsView((c) => c ?? "expenses"); }}
                >
                    <CreditCard size={22} aria-hidden="true" />
                    <small>Bills</small>
                </button>
                <button
                    type="button"
                    className={activeTab === "snowball" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                    onClick={() => { triggerLightHaptic(); setActiveTab("snowball"); }}
                >
                    <TrendingUp size={22} aria-hidden="true" />
                    <small>Payoff</small>
                </button>
                <button
                    type="button"
                    className={activeTab === "goals" ? "sidebar-nav-item active" : "sidebar-nav-item"}
                    onClick={() => { triggerLightHaptic(); setActiveTab("goals"); }}
                >
                    <Target size={22} aria-hidden="true" />
                    <small>Goals</small>
                </button>
                <button
                    type="button"
                    className="sidebar-nav-item sidebar-settings-btn"
                    aria-label="Open Plan Settings"
                    onClick={() => { triggerLightHaptic(); setShowPlanSettings(true); }}
                >
                    <Settings size={22} aria-hidden="true" />
                    <small>Settings</small>
                </button>
            </nav>

            {showPlanSettings && (
                <div
                    className="settings-overlay"
                    onClick={() => {
                        if (!isFirstRunSetup) {
                            setShowPlanSettings(false);
                                setShowDeleteConfirm(false);
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
                                        setShowDeleteConfirm(false);
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
                                </div>
                            </div>
                        )}

                        {!isFirstRunSetup && (
                            <div className="card notifications-settings-card">
                                <div className="notifications-settings-row">
                                    <div>
                                        <h3>App Lock</h3>
                                        <p className="section-collapse-subtitle">
                                            Require Face ID, Touch ID, or your device passcode to open the app.
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

                        {!isFirstRunSetup && (
                            <div className="settings-danger-zone">
                                {showDeleteConfirm ? (
                                    <div className="delete-confirm-row">
                                        <p className="delete-confirm-text">
                                            This will permanently erase all your debts, expenses, goals, and settings. It cannot be undone.
                                        </p>
                                        <div className="delete-confirm-actions">
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() => setShowDeleteConfirm(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="danger-destructive-button"
                                                onClick={() => {
                                                    triggerMediumHaptic();
                                                    handleExitDemoMode();
                                                }}
                                            >
                                                Delete Everything
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="danger-text-button"
                                        onClick={() => {
                                            triggerLightHaptic();
                                            setShowDeleteConfirm(true);
                                        }}
                                    >
                                        Delete All Data
                                    </button>
                                )}
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
