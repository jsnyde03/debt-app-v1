"use client";

import { useMemo, useEffect, useRef, useState, type ChangeEvent } from "react";
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
import { computeMilestones } from "@/lib/debt/computeMilestones";
import { computeStreak } from "@/lib/debt/computeStreak";
import { MilestoneBadge, type MilestoneCelebration } from "@/components/MilestoneBadge";
import { projectDebtPayoff } from "@/lib/debt/projectDebtPayoff";
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
import { readKeyValue, writeKey } from "@/lib/storage/safeStorage";
import { usePersistedState } from "@/lib/storage/usePersistedState";
import { migrateState } from "@/lib/storage/migrateState";
import { StorageCorruptionBanner } from "@/components/StorageCorruptionBanner";
import { useDarkMode, type ThemePreference } from "@/lib/hooks/useDarkMode";
import { useGoals, type Goal } from "@/lib/hooks/useGoals";
import { useRequiredExpenses } from "@/lib/hooks/useRequiredExpenses";
import { useDebts } from "@/lib/hooks/useDebts";
import { usePayCycleSettings, getCurrentDate } from "@/lib/hooks/usePayCycleSettings";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { useNotificationsSetting } from "@/lib/hooks/useNotificationsSetting";
import { AppLockScreen } from "@/components/AppLockScreen";
import { useAppLock } from "@/lib/hooks/useAppLock";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { usePayCycleHistory } from "@/lib/hooks/usePayCycleHistory";
import { buildCycleSnapshot } from "@/lib/history/buildCycleSnapshot";
import { HistorySection } from "@/components/HistorySection";
import { OnboardingFlow } from "@/components/Onboarding/OnboardingFlow";
import { Home as HomeIcon, CreditCard, TrendingUp, Target, Settings, Wallet, ChevronRight } from "@/lib/icons";

// Run storage schema migrations once, at module load, before any hook reads a
// persisted key. No-op under SSR (no localStorage) and idempotent.
migrateState();

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

    const [livingExpenses, setLivingExpenses] = usePersistedState<LivingExpense[]>(
        "debtPlanner.livingExpenses",
        livingExpensePresets.map((expense, index) => ({
            ...expense,
            id: `living-${index}`,
        }))
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

    const { darkMode, themePreference, setThemePreference } = useDarkMode();

    const [completedRecommendedActions, setCompletedRecommendedActions] =
        usePersistedState<CompletedRecommendedAction[]>(
            "debtPlanner.completedRecommendedActions",
            []
        );

    const [recommendationOverrides, setRecommendationOverrides] = useState<RecommendationOverride[]>([]);

    const [activeTab, setActiveTab] = useState<
        "plan" | "bills" | "snowball" | "goals"
    >("plan");
    const tabOrder = { plan: 0, bills: 1, snowball: 2, goals: 3 } as const;
    const prevTabRef = useRef<"plan" | "bills" | "snowball" | "goals">("plan");
    const tabDirection = tabOrder[activeTab] >= tabOrder[prevTabRef.current] ? "forward" : "backward";
    prevTabRef.current = activeTab;

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
    const [showHistory, setShowHistory] = useState(false);
    const [milestoneCelebration, setMilestoneCelebration] = useState<MilestoneCelebration | null>(null);
    const [isToastExiting, setIsToastExiting] = useState(false);
    const [showWindfall, setShowWindfall] = useState(false);
    const [windfallInput, setWindfallInput] = useState("");
    const [pendingUndo, setPendingUndo] = useState<{ type: "debt"; item: Debt } | { type: "expense"; item: RequiredExpense } | null>(null);
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [payoffStrategy, setPayoffStrategy] = usePersistedState<
        "snowball" | "avalanche"
    >("debtPlanner.payoffStrategy", "snowball");

    const { appLockEnabled, setAppLockEnabled, isUnlocked, requestUnlock } = useAppLock();
    const { hasCompletedOnboarding } = useOnboarding();

    const [isDemoMode] = useState(() =>
        readKeyValue("debtPlanner.isDemoMode", false)
    );

    const [lastSavedAt, setLastSavedAt] = useState(() =>
        readKeyValue("debtPlanner.lastSavedAt", "")
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
        restoreExpense,
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
        restoreDebt,
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

    const {
        cycleHistory,
        recordCycleSnapshot,
        visibleHistory,
        previousSnapshot,
        canAccessHistory,
        isHistoryCapped,
    } = usePayCycleHistory(subscriptionPlan);

    const currentStreak = computeStreak(cycleHistory);

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

        writeKey("debtPlanner.resetSnapshot", snapshot);
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

    const debtFreeDate = useMemo(() => {
        const liveDebts = debts.filter(d => d.balance > 0);
        if (!result || liveDebts.length === 0) return null;
        const snowballTotal = result.allocations
            .filter(a => a.category === "snowball")
            .reduce((sum, a) => sum + a.amount, 0);
        const cycleMultiplier = payCycle === "weekly" ? 4 : payCycle === "monthly" ? 1 : 2;
        const { estimatedDebtFreeDate } = projectDebtPayoff({
            debts: liveDebts,
            monthlyExtraPayment: snowballTotal * cycleMultiplier,
            strategy: payoffStrategy,
            startDate: currentDate,
        });
        return estimatedDebtFreeDate === "Unable to estimate" ? null : estimatedDebtFreeDate;
    }, [result, debts, payoffStrategy, currentDate, payCycle]);

    const heroSubtitle = useMemo(() => {
        if (!result || debts.filter(d => d.balance > 0).length === 0) {
            return "Enter a paycheck and see exactly what to do next.";
        }
        if (result.shortfall > 0) {
            return "Tight cycle — protect your minimums first.";
        }
        if (debtFreeDate) {
            return `You're on track to be debt-free by ${debtFreeDate}.`;
        }
        return "Here's what to do this paycheck.";
    }, [result, debts, debtFreeDate]);

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

        const exitTimer = window.setTimeout(() => setIsToastExiting(true), 2020);
        const clearTimer = window.setTimeout(() => {
            setStatusMessage("");
            setIsToastExiting(false);
        }, 2200);

        return () => {
            window.clearTimeout(exitTimer);
            window.clearTimeout(clearTimer);
        };
    }, [statusMessage]);

    useEffect(() => {
        if (!isMounted) return;

        const savedAt = new Date().toISOString();
        setLastSavedAt(savedAt);
        writeKey("debtPlanner.lastSavedAt", savedAt);
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
                void triggerMediumHaptic();
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
        writeKey("debtPlanner.lastSavedAt", savedAt);
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
        const backup = readKeyValue<ReturnType<typeof buildBackupData> | null>(
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

            void triggerMediumHaptic();
            setStatusMessage("Backup imported successfully");
        } catch {
            alert("Unable to import backup file.");
        }

        event.target.value = "";
    }

    function handleRemoveDebtWithUndo(id: string) {
        const debt = debts.find((d) => d.id === id);
        if (!debt) { handleRemoveDebt(id); return; }
        handleRemoveDebt(id);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setPendingUndo({ type: "debt", item: debt });
        undoTimerRef.current = setTimeout(() => setPendingUndo(null), 5000);
    }

    function handleRemoveExpenseWithUndo(id: string) {
        const expense = requiredExpenses.find((e) => e.id === id);
        if (!expense) { handleRemoveExpense(id); return; }
        handleRemoveExpense(id);
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        setPendingUndo({ type: "expense", item: expense });
        undoTimerRef.current = setTimeout(() => setPendingUndo(null), 5000);
    }

    function handleUndo() {
        if (!pendingUndo) return;
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        if (pendingUndo.type === "debt") restoreDebt(pendingUndo.item);
        else restoreExpense(pendingUndo.item);
        setPendingUndo(null);
    }

    async function handleRolloverPayCycle() {
        triggerMediumHaptic();
        saveResetSnapshot();

        // Record the cycle that's ending BEFORE any mutation - capture
        // pre-rollover debts and completed actions so the snapshot reflects
        // where the user actually was when this cycle closed.
        // What the plan asked the user to contribute this cycle (snowball +
        // emergency + optional-goal allocations) - the Streak's "did you stay
        // on plan" bar against totalPaidThisCycle.
        const recommendedThisCycle = (result?.allocations ?? [])
            .filter(
                (allocation) =>
                    allocation.category === "snowball" ||
                    allocation.category === "emergency" ||
                    allocation.category === "optional_goal"
            )
            .reduce((sum, allocation) => sum + allocation.amount, 0);

        recordCycleSnapshot(
            buildCycleSnapshot({
                cycleEndDate: nextPaycheckDate,
                debts,
                completedRecommendedActions,
                payoffStrategy,
                recommendedThisCycle,
            })
        );

        // Apply this cycle's payments once, so we can both persist the new
        // balances AND detect any milestone thresholds crossed by them.
        const debtsAfterPayment = debts.map((debt) => ({
            before: debt,
            after: applyRolloverPayment(
                debt,
                getCompletedRecommendedAmountForDebt(debt.id)
            ),
        }));

        const milestoneResult = computeMilestones({
            debts: debtsAfterPayment.map(({ before, after }) => ({
                id: before.id,
                name: before.name,
                originalBalance: before.originalBalance,
                previousBalance: before.balance,
                currentBalance: after.balance,
            })),
        });

        setDebts(
            rolloverDebts(
                debtsAfterPayment.map(({ after }) => after),
                nextPaycheckDate
            )
        );

        // Surface the single most significant celebration this rollover earned:
        // debt-free > a debt fully paid > the highest progress threshold.
        const paidOffMilestone = milestoneResult.milestones.find(
            (milestone) => milestone.isPaidOff
        );
        const topProgressMilestone = milestoneResult.milestones
            .filter((milestone) => !milestone.isPaidOff)
            .reduce<(typeof milestoneResult.milestones)[number] | null>(
                (best, milestone) =>
                    !best || milestone.threshold > best.threshold ? milestone : best,
                null
            );

        if (milestoneResult.newlyAllPaidOff) {
            setMilestoneCelebration({ kind: "debt-free" });
        } else if (paidOffMilestone) {
            setMilestoneCelebration({
                kind: "paid-off",
                debtName: paidOffMilestone.debtName,
            });
        } else if (topProgressMilestone) {
            setMilestoneCelebration({
                kind: "progress",
                debtName: topProgressMilestone.debtName,
                threshold: topProgressMilestone.threshold as 25 | 50 | 75,
                progressPercent: topProgressMilestone.progressPercent,
            });
        }

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

                <StorageCorruptionBanner />

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
                <section className={activeTab === "plan" ? "hero" : "hero hero-page"} aria-label="Page header">
                    {activeTab === "plan" ? (
                        <>
                            <h1>Debt Planner</h1>
                            <p>{heroSubtitle}</p>
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
                        <div className={`save-status-toast${isToastExiting ? " exiting" : ""}`} role="status" aria-live="polite">
                            {statusMessage}
                        </div>
                    )}

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

                <div key={activeTab} className="tab-content-transition" data-direction={tabDirection} role="region" aria-label={activeTab === "plan" ? "Plan" : activeTab === "bills" ? "Bills" : activeTab === "snowball" ? "Payoff" : "Goals"}>
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
                            {currentStreak > 0 && (
                                <div
                                    className="streak-stat"
                                    role="status"
                                    aria-label={`On-plan streak: ${currentStreak} ${currentStreak === 1 ? "cycle" : "cycles"} in a row`}
                                >
                                    <span className="streak-stat-flame" aria-hidden="true">🔥</span>
                                    <span className="streak-stat-count">{currentStreak}</span>
                                    <span className="streak-stat-label">
                                        {currentStreak === 1 ? "cycle" : "cycles"} on plan in a row
                                    </span>
                                </div>
                            )}

                            {result !== null && activeDebts.length === 0 && (
                                <div className="card first-debt-prompt">
                                    <p className="first-debt-prompt-text">
                                        Your debt-free date is waiting. Add your first debt to see exactly what to do this paycheck.
                                    </p>
                                    <button
                                        type="button"
                                        className="primary-plan-button"
                                        onClick={() => {
                                            triggerLightHaptic();
                                            setActiveTab("bills");
                                        }}
                                    >
                                        Add First Debt
                                    </button>
                                </div>
                            )}

                            <ResultsSection
                                result={result}
                                requiredExpenses={requiredExpenses}
                                debts={debts}
                                goals={goals}
                                payoffStrategy={payoffStrategy}
                                debtFreeDate={debtFreeDate}
                                previousSnapshot={previousSnapshot}
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
                            onRemoveExpense={handleRemoveExpenseWithUndo}
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
                            onRemoveDebt={handleRemoveDebtWithUndo}
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

            {pendingUndo && (
                <div className="undo-toast" role="status" aria-live="polite">
                    <span>{pendingUndo.type === "debt" ? "Debt removed." : "Bill removed."}</span>
                    <button type="button" className="undo-toast-button" onClick={handleUndo}>
                        Undo
                    </button>
                </div>
            )}

            <nav className="bottom-nav" aria-label="Main navigation">
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

            <nav className="sidebar-nav" aria-label="Main navigation">
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
                            <div className="card windfall-card">
                                {showWindfall ? (
                                    <div className="windfall-form">
                                        <p className="windfall-label">Got a bonus or extra cash? Add it to this paycheck.</p>
                                        <div className="windfall-input-row">
                                            <input
                                                type="text"
                                                inputMode="decimal"
                                                className="windfall-input"
                                                placeholder="0.00"
                                                value={windfallInput}
                                                onChange={e => setWindfallInput(e.target.value)}
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                className="primary-plan-button"
                                                onClick={() => {
                                                    const extra = parseFloat(windfallInput);
                                                    if (!extra || extra <= 0) return;
                                                    triggerMediumHaptic();
                                                    setAmount(prev => String(Math.round((Number(prev) + extra) * 100) / 100));
                                                    setWindfallInput("");
                                                    setShowWindfall(false);
                                                    setShowPlanSettings(false);
                                                    setStatusMessage(`Added $${extra.toFixed(2)} windfall to this paycheck.`);
                                                }}
                                            >
                                                Apply
                                            </button>
                                            <button
                                                type="button"
                                                className="secondary-button"
                                                onClick={() => { setShowWindfall(false); setWindfallInput(""); }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="windfall-trigger-button"
                                        onClick={() => { triggerLightHaptic(); setShowWindfall(true); }}
                                    >
                                        <span className="windfall-trigger-icon">💰</span>
                                        <span>Got extra money this paycheck?</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {!isFirstRunSetup && (
                            <button
                                type="button"
                                className="card settings-nav-row"
                                onClick={() => {
                                    triggerLightHaptic();
                                    setShowPlanSettings(false);
                                    setShowHistory(true);
                                }}
                                aria-label="View Pay Cycle History"
                            >
                                <div>
                                    <h3>Pay Cycle History</h3>
                                    <p className="section-collapse-subtitle">
                                        Look back at your finished pay cycles.
                                    </p>
                                </div>
                                <ChevronRight size={20} aria-hidden="true" />
                            </button>
                        )}

                        {!isFirstRunSetup && (
                            <div className="card notifications-settings-card">
                                <div className="notifications-settings-row">
                                    <div>
                                        <h3>Appearance</h3>
                                    </div>
                                    <div className="theme-selector" role="group" aria-label="Theme preference">
                                        {(["system", "light", "dark"] as ThemePreference[]).map((pref) => (
                                            <button
                                                key={pref}
                                                type="button"
                                                className={`theme-selector-pill${themePreference === pref ? " theme-selector-pill-active" : ""}`}
                                                onClick={() => { triggerLightHaptic(); setThemePreference(pref); }}
                                                aria-pressed={themePreference === pref}
                                            >
                                                {pref === "system" ? "Auto" : pref === "light" ? "Light" : "Dark"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

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
                                            All debts, bills, goals, and settings will be permanently erased. This cannot be undone.
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
                                        aria-label="Delete all data — permanently erase all debts, bills, goals, and settings"
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

                        <p className="settings-privacy-note">
                            Your data stays on this device — nothing is uploaded or shared.
                        </p>

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

            {showHistory && (
                <HistorySection
                    visibleHistory={visibleHistory}
                    canAccessHistory={canAccessHistory}
                    isHistoryCapped={isHistoryCapped}
                    onUpgrade={() => {
                        setShowHistory(false);
                        setShowUpgrade(true);
                    }}
                    onClose={() => setShowHistory(false)}
                />
            )}

            {milestoneCelebration && (
                <MilestoneBadge
                    celebration={milestoneCelebration}
                    onDismiss={() => setMilestoneCelebration(null)}
                />
            )}
        </main>
    );
}
