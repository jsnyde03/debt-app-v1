"use client";

import { useMemo, useEffect, useRef, useState, type ChangeEvent } from "react";
import { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import { getNextPaycheckDate } from "@/lib/payCycle/getNextPaycheckDate";
import { payCyclesPerMonth } from "@/lib/payCycle/payCyclesPerMonth";
import { computeInterestSaved, type InterestSaved } from "@/lib/debt/computeInterestSaved";
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
import { PlanSettingsSheet } from "@/components/PlanSettings/PlanSettingsSheet";
import { SnowballSection } from "@/components/SnowballSection";

import {
    rolloverDebts,
    rolloverRequiredExpenses,
} from "@/lib/recurrence/rolloverPayCycle";

import { type CompletedRecommendedAction, type RecommendationOverride, type Debt, type RequiredExpense } from "@/lib/storage/debtPlannerStorage";
import { applyRolloverPayment } from "@/lib/debt/applyRolloverPayment";
import { markGoal, unmarkGoal } from "@/lib/debt/reconcileGoalAmount";
import { computeMilestones } from "@/lib/debt/computeMilestones";
import { computeStreak } from "@/lib/debt/computeStreak";
import { MilestoneBadge, type MilestoneCelebration } from "@/components/MilestoneBadge";
import { projectDebtPayoff } from "@/lib/debt/projectDebtPayoff";
import { downloadBackup, readBackupFile } from "@/lib/storage/backup";
import { getDebtsWithDisplayBalances, getCompletedSnowballAmount } from "@/lib/debt/getDebtsWithDisplayBalances";
import { selectActiveRecommendedActions } from "@/lib/debt/selectActiveRecommendedActions";
import { applyPaydayCapture } from "@/lib/debt/applyPaydayCapture";
import { upsertCompletedAction } from "@/lib/debt/mergeCompletedAction";
import { usePaydayCapture } from "@/lib/hooks/usePaydayCapture";
import { getPortalTarget } from "@/lib/dom/getPortalTarget";
import { PaydayCaptureSheet } from "@/components/PaydayCaptureSheet";
import { createPortal } from "react-dom";
import { useLivingExpenses } from "@/lib/hooks/useLivingExpenses";
import { livingExpensePresets } from "@/lib/constants/livingExpensePresets";
import { LivingExpensesSection } from "@/components/LivingExpensesSection";
import { applyDemoPlannerStateToStorage } from "@/lib/testing/seedPlannerState";
import { TimelineSection } from "@/components/TimelineSection";
import { UpgradeSection } from "@/components/UpgradeSection";
import { restorePurchases, purchasePremium, resetRevenueCatUserForTesting, getPremiumPackageInfo, type PremiumPackageInfo } from "@/lib/subscription/revenueCat";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { scheduleNotifications } from "@/lib/notifications/scheduleNotifications";
import { incrementRolloverCount, maybeRequestAppReview } from "@/lib/review/requestAppReview";
import { AppSkeleton } from "@/components/AppSkeleton";
import { AppHeader } from "@/components/AppHeader";
import { AppNav } from "@/components/AppNav";
import { PullToRefresh } from "@/components/PullToRefresh";
import { readKeyValue, writeKey } from "@/lib/storage/safeStorage";
import { usePersistedState } from "@/lib/storage/usePersistedState";
import { migrateState } from "@/lib/storage/migrateState";
import { StorageCorruptionBanner } from "@/components/StorageCorruptionBanner";
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
import { usePayCycleHistory } from "@/lib/hooks/usePayCycleHistory";
import { buildCycleSnapshot } from "@/lib/history/buildCycleSnapshot";
import { HistorySection } from "@/components/HistorySection";
import { OnboardingFlow } from "@/components/Onboarding/OnboardingFlow";
import { CreditCard, Settings, Wallet } from "@/lib/icons";

// Run storage schema migrations once, at module load, before any hook reads a
// persisted key. No-op under SSR (no localStorage) and idempotent.
migrateState();

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

    const { livingExpenses, setLivingExpenses } = useLivingExpenses();

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
    // Track the tab-switch direction for the slide transition. Uses the React
    // "store info from previous renders" pattern (a guarded setState during
    // render) rather than a ref read/written mid-render — same result, no ref.
    const [prevTab, setPrevTab] = useState<"plan" | "bills" | "snowball" | "goals">("plan");
    const [tabDirection, setTabDirection] = useState<"forward" | "backward">("forward");
    if (prevTab !== activeTab) {
        setTabDirection(tabOrder[activeTab] >= tabOrder[prevTab] ? "forward" : "backward");
        setPrevTab(activeTab);
    }

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
        handleImportCsv,
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

    const { debtsWithDisplayBalances, activeDebts, paidOffDebts } =
        getDebtsWithDisplayBalances(debts, completedRecommendedActions);

    const debtFreeDate = useMemo(() => {
        const liveDebts = debts.filter(d => d.balance > 0);
        if (!result || liveDebts.length === 0) return null;
        const snowballTotal = result.allocations
            .filter(a => a.category === "snowball")
            .reduce((sum, a) => sum + a.amount, 0);
        const cycleMultiplier = payCyclesPerMonth(payCycle);
        const { estimatedDebtFreeDate } = projectDebtPayoff({
            debts: liveDebts,
            monthlyExtraPayment: snowballTotal * cycleMultiplier,
            strategy: payoffStrategy,
            startDate: currentDate,
        });
        return estimatedDebtFreeDate === "Unable to estimate" ? null : estimatedDebtFreeDate;
    }, [result, debts, payoffStrategy, currentDate, payCycle]);

    // Interest-Saved Momentum Ledger — what the current plan saves vs. minimums.
    const interestSaved = useMemo((): InterestSaved => {
        const liveDebts = debts.filter((d) => d.balance > 0);
        if (!result || liveDebts.length === 0) return { kind: "none" };
        const snowballTotal = result.allocations
            .filter((a) => a.category === "snowball")
            .reduce((sum, a) => sum + a.amount, 0);
        const monthlyExtraPayment = snowballTotal * payCyclesPerMonth(payCycle);
        return computeInterestSaved({
            debts: liveDebts,
            monthlyExtraPayment,
            strategy: payoffStrategy,
            startDate: currentDate,
        });
    }, [result, debts, payoffStrategy, currentDate, payCycle]);

    const heroSubtitle = useMemo(() => {
        // No plan yet (no paycheck entered) — the only true "enter a paycheck" state.
        if (!result) {
            return "Enter a paycheck and see exactly what to do next.";
        }
        // Paycheck IS set but nothing is left to pay: debt-free (balances cleared)
        // or no debts entered yet. Previously both fell through to "Enter a
        // paycheck…", which was wrong once a paycheck existed.
        if (debts.filter(d => d.balance > 0).length === 0) {
            return debts.length > 0
                ? "You're debt-free — every balance is cleared. Keep the momentum going."
                : "Add a debt to see exactly what to pay each paycheck.";
        }
        if (result.shortfall > 0) {
            return "Tight cycle — protect your minimums first.";
        }
        if (debtFreeDate) {
            // Lead with the uncopyable job — "what to pay THIS paycheck" — and keep the
            // debt-free date as reassurance, not the headline (v1.6 hero reposition: the
            // payday-allocation engine is the differentiator, not the generic debt-free date).
            return `Here's exactly what to pay this paycheck — on track to be debt-free by ${debtFreeDate}.`;
        }
        return "Here's what to do this paycheck.";
    }, [result, debts, debtFreeDate]);

    // Single source of truth for the cycle's recommended allocation — fed to both
    // ResultsSection (the Plan tab) and the Payday Autopilot capture sheet so they
    // can never drift. Empty until a paycheck/plan exists.
    const activeRecommendedActions = useMemo(
        () =>
            result
                ? selectActiveRecommendedActions({
                    result,
                    debts,
                    goals,
                    payoffStrategy,
                    recommendationOverrides,
                    completedRecommendedActions,
                })
                : [],
        [result, debts, goals, payoffStrategy, recommendationOverrides, completedRecommendedActions]
    );

    // Payday Autopilot — detection + capture sheet state (the narrow hook).
    const paydayCapture = usePaydayCapture({
        nextPaycheckDate,
        payCycle,
        hasCapturablePlan: activeRecommendedActions.length > 0,
    });

    // Bulk-apply a payday capture in ONE state update (looping the single-mark
    // handler would setState off stale closures), then mark the payday handled.
    function handlePaydayCapture(items: CompletedRecommendedAction[]) {
        const { nextGoals, nextCompleted } = applyPaydayCapture(
            items,
            goals,
            completedRecommendedActions
        );
        setGoals(nextGoals);
        setCompletedRecommendedActions(nextCompleted);
        saveResetSnapshot({
            goals: nextGoals,
            completedRecommendedActions: nextCompleted,
        });
        paydayCapture.completeCapture();
    }

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
        // Autosave-timestamp side-effect: this effect's job is to persist the
        // "last saved" time to localStorage (an external system — the rule's
        // first sanctioned use) whenever tracked data changes; setLastSavedAt
        // only mirrors that write into the indicator, and lastSavedAt is not in
        // the dep array, so there is no cascading re-render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    function handleMarkRecommendedAction(targetId: string, label: string, category: "emergency" | "snowball" | "optional_goal", recommendedAmount: number, actualAmount: number, paymentSource: "paycheck" | "external" = "paycheck", isUnmark: boolean = false) {
        // UNMARK: reverse a specific completed contribution. Matched on
        // paymentSource too, so un-marking a paycheck row never touches a
        // same-goal external contribution (or vice-versa). Intent is passed
        // explicitly (the tapped row's `isCompleted`) rather than inferred from a
        // key match — inference was the v1.6 collision bug, where tapping a
        // re-recommended remainder un-marked its completed partial.
        if (isUnmark) {
            const existingAction = completedRecommendedActions.find(
                (action) => action.targetId === targetId && action.label === label && action.category === category && action.paymentSource === paymentSource
            );

            if (!existingAction) {
                return;
            }

            const nextGoals =
                category === "emergency" || category === "optional_goal"
                    ? goals.map((goal) =>
                        goal.id === targetId
                            ? {
                                ...goal,
                                currentAmount: unmarkGoal(goal.currentAmount, existingAction.actualAmount),
                            }
                            : goal
                    )
                    : goals;

            const nextCompletedRecommendedActions = completedRecommendedActions.filter(
                (action) => !(action.targetId === targetId && action.label === label && action.category === category && action.paymentSource === paymentSource)
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
                // markGoal clamps to the goal's remaining room and returns the
                // exact currentAmount delta; unmark subtracts that same stored
                // amount, so the two are exact inverses even when the goal is
                // over-funded (see reconcileGoalAmount.ts — the old inline
                // `min(targetAmount, …)` here destroyed over-funded excess).
                const { appliedAmount, nextCurrentAmount } = markGoal(
                    goal.currentAmount,
                    goal.targetAmount,
                    actualAmount
                );

                safeActualAmount = appliedAmount;

                nextGoals = goals.map((item) => item.id === targetId ? {
                    ...item,
                    currentAmount: nextCurrentAmount,
                } : item);
            }
        }

        // Accumulate into any existing same-(target|label|category|source)
        // contribution rather than appending a colliding duplicate, so a partial
        // and its re-recommended remainder fold into one entry (see
        // upsertCompletedAction — the v1.6 capture-collision fix).
        const nextCompletedRecommendedActions = upsertCompletedAction(completedRecommendedActions, {
            targetId,
            label,
            category,
            recommendedAmount,
            actualAmount: safeActualAmount,
            paymentSource,
        });

        setGoals(nextGoals);
        setCompletedRecommendedActions(nextCompletedRecommendedActions);

        saveResetSnapshot({
            goals: nextGoals,
            completedRecommendedActions: nextCompletedRecommendedActions,
        });
    }

    function handleResetToToday() {
        // Close settings so you land on the freshly reset plan (matches Calculate Plan).
        setShowPlanSettings(false);
        setShowDeleteConfirm(false);

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
        // Close settings so you land on the new cycle's plan (and any milestone
        // celebration shows over the plan, not the settings sheet).
        setShowPlanSettings(false);
        setShowDeleteConfirm(false);
        saveResetSnapshot();

        // Record the cycle that's ending BEFORE any mutation - capture
        // pre-rollover debts and completed actions so the snapshot reflects
        // where the user actually was when this cycle closed.
        // On plan = the user left no AFFORDABLE required action unpaid (the
        // engine counts fully-coverable-but-unpaid required items). If result is
        // unavailable, don't punish the streak (default on-plan).
        const allRequiredMet = (result?.affordableUnpaidRequiredCount ?? 0) === 0;

        recordCycleSnapshot(
            buildCycleSnapshot({
                cycleEndDate: nextPaycheckDate,
                debts,
                completedRecommendedActions,
                payoffStrategy,
                allRequiredMet,
            })
        );

        // Apply this cycle's payments once, so we can both persist the new
        // balances AND detect any milestone thresholds crossed by them.
        const debtsAfterPayment = debts.map((debt) => ({
            before: debt,
            after: applyRolloverPayment(
                debt,
                getCompletedSnowballAmount(debt.id, completedRecommendedActions),
                payCycle
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

    function handleSelectTab(tab: "plan" | "bills" | "snowball" | "goals") {
        triggerLightHaptic();
        // Leaving via the nav closes the settings panel, so you land on the tab
        // (not back inside the focused settings view).
        setShowPlanSettings(false);
        setActiveTab(tab);
        if (tab === "bills") setBillsView((current) => current ?? "expenses");
    }

    function handleToggleSettings() {
        triggerLightHaptic();
        setShowPlanSettings((open) => !open);
    }

    function handleCloseSheet() {
        triggerLightHaptic();
        setShowPlanSettings(false);
        setShowDeleteConfirm(false);
    }

    async function handleDevRcReset() {
        try {
            triggerLightHaptic();

            const plan = await resetRevenueCatUserForTesting();

            setSubscriptionPlan(plan);
            setPurchaseStatus(`RevenueCat reset.  Current plan: ${plan}`);
            setShowUpgrade(false);
        } catch (error) {
            setPurchaseStatus(error instanceof Error ? error.message : "RevenueCat reset failed.");
        }
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
                <AppHeader
                    activeTab={activeTab}
                    heroSubtitle={heroSubtitle}
                    lastSavedAt={lastSavedAt}
                    statusMessage={statusMessage}
                    isToastExiting={isToastExiting}
                    onDevRcReset={handleDevRcReset}
                />

                <PlanSettingsSheet
                    showPlanSettings={showPlanSettings}
                    onCloseSheet={handleCloseSheet}
                    isFirstRunSetup={isFirstRunSetup}
                    onClose={() => setShowPlanSettings(false)}
                    onOpenHistory={() => {
                        setShowPlanSettings(false);
                        setShowHistory(true);
                    }}
                    amount={amount}
                    payCycle={payCycle}
                    semiMonthlyFirstDay={semiMonthlyFirstDay}
                    semiMonthlySecondDay={semiMonthlySecondDay}
                    monthlyPayDay={monthlyPayDay}
                    nextPaycheckDate={nextPaycheckDate}
                    currentDate={currentDate}
                    onAmountChange={setAmount}
                    onPayCycleChange={setPayCycle}
                    onNextPaycheckDateChange={setNextPaycheckDate}
                    onSemiMonthlyFirstDayChange={setSemiMonthlyFirstDay}
                    onSemiMonthlySecondDayChange={setSemiMonthlySecondDay}
                    onMonthlyPayDayChange={setMonthlyPayDay}
                    onCalculate={handleCalculate}
                    onRolloverPayCycle={handleRolloverPayCycle}
                    onResetToToday={handleResetToToday}
                    onExportBackup={handleExportBackup}
                    onImportBackup={handleImportBackup}
                    onPopulateDemoData={handlePopulateDemoData}
                    showWindfall={showWindfall}
                    setShowWindfall={setShowWindfall}
                    windfallInput={windfallInput}
                    setWindfallInput={setWindfallInput}
                    setAmount={setAmount}
                    setStatusMessage={setStatusMessage}
                    themePreference={themePreference}
                    setThemePreference={setThemePreference}
                    notificationsEnabled={notificationsEnabled}
                    onNotificationsToggle={handleNotificationsToggle}
                    appLockEnabled={appLockEnabled}
                    setAppLockEnabled={setAppLockEnabled}
                    showDeleteConfirm={showDeleteConfirm}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                    onDeleteAll={handleExitDemoMode}
                />

                <div key={activeTab} className="tab-content-transition" data-direction={tabDirection} style={showPlanSettings ? { display: "none" } : undefined} role="region" aria-label={activeTab === "plan" ? "Plan" : activeTab === "bills" ? "Bills" : activeTab === "snowball" ? "Payoff" : "Goals"}>
                {activeTab === "plan" && (
                    <>
                        <div className="plan-toolbar">
                            <button
                                type="button"
                                className="settings-icon-button"
                                aria-label="Open Plan Settings"
                                aria-expanded={showPlanSettings}
                                onClick={() => {
                                    triggerLightHaptic();
                                    setShowPlanSettings((open) => !open);
                                }}
                            >
                                <Settings size={20} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="plan-tab-grid">
                            {paydayCapture.isAwaitingRollover && (
                                <div className="card payday-rollover-nudge">
                                    <p className="first-debt-prompt-text">
                                        Payday logged. Start your next pay cycle to apply this cycle&apos;s payments and get your next plan.
                                    </p>
                                    <button
                                        type="button"
                                        className="primary-plan-button"
                                        onClick={() => {
                                            triggerMediumHaptic();
                                            handleRolloverPayCycle();
                                        }}
                                    >
                                        Start Next Pay Cycle
                                    </button>
                                </div>
                            )}

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

                            {result !== null && debts.length === 0 && (
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
                                activeRecommendedActions={activeRecommendedActions}
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
                            interestSaved={interestSaved}
                            payoffStrategy={payoffStrategy}
                            payCycle={payCycle}
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
                            onImportDebtsCsv={handleImportCsv}
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

            <AppNav
                activeTab={activeTab}
                showPlanSettings={showPlanSettings}
                onSelectTab={handleSelectTab}
                onToggleSettings={handleToggleSettings}
            />

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

            {paydayCapture.isOpen && typeof document !== "undefined" &&
                createPortal(
                    <PaydayCaptureSheet
                        activeRecommendedActions={activeRecommendedActions}
                        onCapture={handlePaydayCapture}
                        onDismiss={paydayCapture.dismiss}
                        onClose={paydayCapture.close}
                    />,
                    getPortalTarget()
                )}
        </main>
    );
}
