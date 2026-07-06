import { useState } from "react";
import { triggerLightHaptic, triggerMediumHaptic } from "@/lib/mobile/haptics";
import { formatDisplayAmount } from "@/lib/utils/formatDisplayAmount";
import type { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import type {
    Debt,
    RequiredExpense,
} from "@/lib/storage/debtPlannerStorage";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { computeCycleDelta } from "@/lib/debt/computeCycleDelta";
import type { CompletedRecommendedAction, PayCycleSnapshot } from "@/lib/storage/debtPlannerStorage";
import { TrendingDown, TrendingUp } from "@/lib/icons";
import { SwipeActionCard } from "./SwipeActionCard";
import { CompletedActionsList } from "./Results/CompletedActionsList";
import { OptionalGoalsList } from "./Results/OptionalGoalsList";
import {
    computeFlexibleCash,
    computeCompletedRecommendedTotal,
    type ActiveRecommendedAction,
} from "@/lib/engine/recommendedActions";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

type RecommendedCategory = "emergency" | "snowball" | "optional_goal";

type ResultsSectionProps = {
    result: AllocationResult | null;
    requiredExpenses: RequiredExpense[];
    debts: Debt[];
    /** The cycle's active recommended actions — computed once in page.tsx via
     *  selectActiveRecommendedActions so the Plan tab and the payday capture sheet
     *  share one source of truth. */
    activeRecommendedActions: ActiveRecommendedAction[];
    completedRecommendedActions: CompletedRecommendedAction[];
    currentDate: string;
    debtFreeDate?: string | null;
    previousSnapshot?: PayCycleSnapshot | null;
    onMarkExpensePaid: (id: string) => void;
    onMarkDebtMinimumPaid: (id: string) => void;
    onMarkDebtSnowballPaid: (id: string) => void;
    onRecommendationOverrideChange: (
        targetId: string,
        category: "emergency" | "snowball",
        amount: number
    ) => void;
    onMarkRecommendedAction: (
        targetId: string,
        label: string,
        category: RecommendedCategory,
        recommendedAmount: number,
        actualAmount: number,
        paymentSource?: "paycheck" | "external"
    ) => void;
};

type RecommendedDisplayAction = {
    key: string;
    label: string;
    category: RecommendedCategory;
    targetId: string;
    recommendedAmount: number;
    actualAmount: number;
    isCompleted: boolean;
    paymentSource?: "paycheck" | "external";
};

function roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
}

function isOverdue(dueDate: string, currentDate: string) {
    return (
        new Date(`${dueDate}T00:00:00`) <
        new Date(`${currentDate}T00:00:00`)
    );
}

function isRecommendedCategory(
    category: string
): category is RecommendedCategory {
    return (
        category === "emergency" ||
        category === "snowball" ||
        category === "optional_goal"
    );
}

function getRecommendedKey(item: {
    category: string;
    targetId?: string;
    label: string;
}) {
    return `${item.category}-${item.targetId ?? "none"}-${item.label}`;
}

export function ResultsSection({
    result,
    requiredExpenses,
    debts,
    activeRecommendedActions,
    completedRecommendedActions,
    currentDate,
    debtFreeDate,
    previousSnapshot,
    onMarkExpensePaid,
    onMarkDebtMinimumPaid,
    onMarkRecommendedAction,
    onRecommendationOverrideChange,
}: ResultsSectionProps) {
    // On iPad (≥834px) the tall canvas has room, so show the full action lists
    // instead of the phone's "Show N More" cap — a dead click where there's space
    // (2.15.2). Read at init (not via a post-mount effect): this component mounts
    // client-only, behind the app's isMounted/AppSkeleton gate, so reading
    // matchMedia in the initializer is hydration-safe on the static export.
    const [showAllRequiredActions, setShowAllRequiredActions] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(min-width: 834px)").matches
    );

    const [requiredExpanded, setRequiredExpanded] = useState(true);

    const [recommendedExpanded, setRecommendedExpanded] = useState(false);

    const [completedExpanded, setCompletedExpanded] = useState(false);

    const [showAllRecommendedActions, setShowAllRecommendedActions] = useState(
        () => typeof window !== "undefined" && window.matchMedia("(min-width: 834px)").matches
    );

    const [editingRecommendedKey, setEditingRecommendedKey] =
        useState<string | null>(null);

    const [editedRecommendedAmounts, setEditedRecommendedAmounts] = useState<
        Record<string, string>
    >({});

    const [recommendedAmountErrors, setRecommendedAmountErrors] = useState<
        Record<string, string>
    >({});

    if (!result) {
        return null;
    }

    const requiredActions = result.allocations.filter(
        (item) =>
            item.category === "expense" ||
            item.category === "minimum_debt" ||
            item.category === "autopay_expense" ||
            item.category === "autopay_debt"
    );

    const optionalGoalActions = result.allocations.filter(
        (item) => item.category === "optional_goal"
    );

    const unpaidRequiredActions = requiredActions.filter((item) => {
        const expense =
            item.category === "expense" || item.category === "autopay_expense"
                ? requiredExpenses.find(
                    (expenseItem) => expenseItem.id === item.targetId
                )
                : undefined;

        const debt =
            item.category === "minimum_debt" ||
                item.category === "autopay_debt"
                ? debts.find(
                    (debtItem) =>
                        debtItem.id === (item.debtId ?? item.targetId)
                )
                : undefined;

        const isPaid =
            item.category === "expense" || item.category === "autopay_expense"
                ? expense?.isPaidThisCycle ?? false
                : debt?.minimumPaidThisCycle ??
                debt?.isPaidThisCycle ??
                false;

        return !isPaid;
    });

    const completedRequiredActions = [
        ...requiredExpenses
            .filter((expense) => expense.isPaidThisCycle)
            .map((expense) => ({
                label: `Pay ${expense.name}`,
                amount: expense.amount,
                category: expense.isAutopay
                    ? ("autopay_expense" as const)
                    : ("expense" as const),
                targetId: expense.id,
            })),

        ...debts
            .filter(
                (debt) => debt.minimumPaidThisCycle ?? debt.isPaidThisCycle
            )
            .map((debt) => ({
                label: `Pay minimum on ${debt.name}`,
                amount: debt.minimumPayment,
                category: debt.isAutopay
                    ? ("autopay_debt" as const)
                    : ("minimum_debt" as const),
                targetId: debt.id,
                debtId: debt.id,
            })),
    ];

    // Required obligations the paycheck can't cover this cycle. The engine
    // computes these but they were never rendered, so a cash-strapped user saw
    // a false "You're caught up" while still owing them. Surface them.
    const unfundedRequiredItems = result.unfundedRequiredItems ?? [];
    const unfundedRequiredTotal = unfundedRequiredItems.reduce(
        (sum, item) => sum + item.amount,
        0
    );
    const hasAnyRequiredOutstanding =
        unpaidRequiredActions.length > 0 || unfundedRequiredItems.length > 0;

    const visibleRequiredActions = showAllRequiredActions
        ? unpaidRequiredActions
        : unpaidRequiredActions.slice(0, 6);

    const hiddenRequiredCount = Math.max(
        0,
        unpaidRequiredActions.length - visibleRequiredActions.length
    );

    const bufferActions = result.allocations.filter(
        (item) =>
            item.category === "leftover" && item.label === "Keep cash buffer"
    );

    const bufferTotal = bufferActions.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    const completedRecommendedDisplayActions: RecommendedDisplayAction[] =
        completedRecommendedActions.map((action) => ({
            key: `completed-${action.category}-${action.targetId}-${action.label}`,
            label: action.label,
            category: action.category,
            targetId: action.targetId,
            recommendedAmount: action.recommendedAmount,
            actualAmount: action.actualAmount,
            isCompleted: true,
            paymentSource: action.paymentSource,
        }));

    // Full unpaid obligation = the affordable (allocated) portion + the portion
    // the paycheck can't cover, so the "Required $X" headline reflects the whole
    // amount owed, not just what fits in this paycheck.
    const requiredTotal =
        unpaidRequiredActions.reduce((sum, item) => sum + item.amount, 0) +
        unfundedRequiredTotal;

    const completedRecommendedTotal = computeCompletedRecommendedTotal(completedRecommendedActions);

    const flexibleCashAvailable = computeFlexibleCash({
        paycheckAmount: result.paycheckAmount,
        totalRequired: result.totalRequired,
        livingExpenseReserve: result.livingExpenseReserve,
        bufferTotal,
        completedRecommendedTotal,
    });

    // The active recommended actions are computed ONCE in page.tsx
    // (selectActiveRecommendedActions) and passed in, so the Plan tab and the
    // payday capture sheet render the identical plan — no drift.
    const activeRecommendedDisplayActions: RecommendedDisplayAction[] =
        activeRecommendedActions.map((action) => ({
            key: action.key,
            label: action.label,
            category: action.category,
            targetId: action.targetId,
            recommendedAmount: action.recommendedAmount,
            actualAmount: action.actualAmount,
            isCompleted: false,
        }));

    const displayedRecommendedActions = [
        ...completedRecommendedDisplayActions,
        ...activeRecommendedDisplayActions,
    ];

    const visibleRecommendedActions = showAllRecommendedActions
        ? displayedRecommendedActions
        : displayedRecommendedActions.slice(0, 5);

    const hiddenRecommendedCount = Math.max(
        0,
        displayedRecommendedActions.length - visibleRecommendedActions.length
    );

    const displayedRecommendedTotal = displayedRecommendedActions.reduce(
        (sum, action) => sum + action.actualAmount,
        0
    );

    const hasOverdueItems = requiredActions.some((item) => {
        const expense =
            item.category === "expense" || item.category === "autopay_expense"
                ? requiredExpenses.find(
                    (expense) => expense.id === item.targetId
                )
                : undefined;

        const debt =
            item.category === "minimum_debt" ||
                item.category === "autopay_debt"
                ? debts.find((debt) => debt.id === item.targetId)
                : undefined;

        const dueDate = expense?.dueDate ?? debt?.dueDate;

        const isPaid =
            item.category === "expense" || item.category === "autopay_expense"
                ? expense?.isPaidThisCycle ?? false
                : debt?.minimumPaidThisCycle ??
                debt?.isPaidThisCycle ??
                false;

        return dueDate && !isPaid ? isOverdue(dueDate, currentDate) : false;
    });

    function renderRequiredAction(
        item: AllocationResult["allocations"][number],
        index: number
    ) {
        const expense =
            item.category === "expense" || item.category === "autopay_expense"
                ? requiredExpenses.find(
                    (expenseItem) => expenseItem.id === item.targetId
                )
                : undefined;

        const debt =
            item.category === "minimum_debt" ||
                item.category === "autopay_debt"
                ? debts.find(
                    (debtItem) =>
                        debtItem.id === (item.debtId ?? item.targetId)
                )
                : undefined;

        const isPaid =
            item.category === "expense" || item.category === "autopay_expense"
                ? expense?.isPaidThisCycle ?? false
                : debt?.minimumPaidThisCycle ??
                debt?.isPaidThisCycle ??
                false;

        const dueDate = expense?.dueDate ?? debt?.dueDate;

        const overdue =
            dueDate && !isPaid ? isOverdue(dueDate, currentDate) : false;

        const isAutopay =
            item.category === "autopay_expense" ||
            item.category === "autopay_debt";

        function handleRequiredActionToggle() {
            if (item.category === "expense" || item.category === "autopay_expense") {
                if (item.targetId) {
                    onMarkExpensePaid(item.targetId);
                }

                return;
            }

            if (item.category === "minimum_debt" || item.category === "autopay_debt") {
                const debtId = item.debtId ?? item.targetId;

                if (debtId) {
                    onMarkDebtMinimumPaid(debtId);
                }
            }
        }

        return (
            <SwipeActionCard
                key={`${item.category}-${item.targetId ?? index}`}
                className={[
                    "saved-item",
                    isPaid ? "completed-item" : "",
                    overdue ? "overdue-item" : "",
                ].filter(Boolean).join(" ")}

                leftAction={
                    !isPaid
                        ? {
                            label: "Mark Paid",
                            tone: "positive",
                            onTrigger: handleRequiredActionToggle,
                        }
                        : undefined
                }

                rightAction={
                    isPaid
                        ? {
                            label: "Undo",
                            tone: "warning",
                            onTrigger: handleRequiredActionToggle,
                        }
                        : undefined
                }

            >
                <div className="saved-item-left">
                    <div className="saved-title">
                        {item.label}
                        {isAutopay && (
                            <span className="autopay-pill">Autopay</span>
                        )}
                    </div>

                    {overdue && (
                        <div className="status-chip overdue">Overdue</div>
                    )}

                    <div className="saved-meta">
                        {dueDate ? `Due ${dueDate}` : "Required Payment"}
                    </div>
                </div>

                <div className="saved-item-right">
                    <strong className="saved-amount">
                        {formatCurrency(item.amount)}
                    </strong>

                    <button
                        type="button"
                        className={
                            isPaid ? "action-pill completed" : "action-pill"
                        }
                        onClick={() => {
                            triggerMediumHaptic();
                            handleRequiredActionToggle();
                        }}
                    >
                        {isPaid ? "Undo" : "Mark Paid"}
                    </button>
                </div>
            </SwipeActionCard>
        );
    }

    function renderRecommendedAction(
        action: RecommendedDisplayAction,
        options?: {
            isFocusTarget?: boolean;
        }
    ) {
        const isEditing = editingRecommendedKey === action.key;

        function updateEditedAmount(value: string) {
            setEditedRecommendedAmounts((current) => ({
                ...current,
                [action.key]: value,
            }));

            setRecommendedAmountErrors((current) => ({
                ...current,
                [action.key]: "",
            }));
        }

        function getEditedActualAmount() {
            const editedAmount = editedRecommendedAmounts[action.key];

            if (editedAmount === undefined || editedAmount === "") {
                return action.actualAmount;
            }

            return Number(editedAmount);
        }

        function handleSubmitRecommendedAction() {
            const amount = getEditedActualAmount();

            if (!amount || amount <= 0) {
                setRecommendedAmountErrors((current) => ({
                    ...current,
                    [action.key]: "Enter an amount greater than $0.",
                }));

                return;
            }

            if (amount > flexibleCashAvailable) {
                setRecommendedAmountErrors((current) => ({
                    ...current,
                    [action.key]:
                        "Amount cannot exceed available flexible cash.",
                }));

                return;
            }

            if (amount > action.recommendedAmount) {
                setRecommendedAmountErrors((current) => ({
                    ...current,
                    [action.key]: "Amount cannot exceed this target.",
                }));

                return;
            }

            if (
                action.category === "emergency" ||
                action.category === "snowball"
            ) {
                onRecommendationOverrideChange(
                    action.targetId,
                    action.category,
                    roundMoney(amount)
                );
            }

            setEditingRecommendedKey(null);
        }

        function handleRecommendedPrimaryAction() {
            if (action.isCompleted) {
                onMarkRecommendedAction(
                    action.targetId,
                    action.label,
                    action.category,
                    action.recommendedAmount,
                    action.actualAmount
                );

                return;
            }

            onMarkRecommendedAction(
                action.targetId,
                action.label,
                action.category,
                action.recommendedAmount,
                roundMoney(action.actualAmount)
            );
        }

        function handleRecommendedOutsidePaycheck() {
            onMarkRecommendedAction(
                action.targetId,
                action.label,
                action.category,
                action.recommendedAmount,
                roundMoney(action.actualAmount),
                "external"
            );
        }

        return (
            <SwipeActionCard
                key={action.key}
                className={[
                    "saved-item",
                    "recommended-card",
                    options?.isFocusTarget ? "focus-target-card" : "",
                    action.isCompleted ? "completed-action completed-item" : "",
                ].filter(Boolean).join(" ")}
                disabled={isEditing}
                leftAction={!action.isCompleted
                    ? {
                        label: action.category === "emergency" || action.category === "optional_goal"
                            ? "Mark Saved"
                            : "Mark Paid",
                        tone: "positive",
                        onTrigger: handleRecommendedPrimaryAction,
                    }
                    : undefined
                }
                rightAction={action.isCompleted
                    ? {
                        label: "Undo",
                        tone: "warning",
                        onTrigger: handleRecommendedPrimaryAction,
                    }
                    : {
                        label: "Outside",
                        tone: "warning",
                        onTrigger: handleRecommendedOutsidePaycheck,
                    }   
                }
            >
                <div className="saved-item-left">
                    <div className="saved-title">{action.label}</div>

                    <div className="saved-meta">
                        {action.isCompleted
                            ? action.paymentSource === "external"
                                ? "Completed with outside money"
                                : "Completed this cycle"
                            : "Suggested for this cycle"}
                    </div>

                    <strong className="recommended-inline-amount">
                        {formatCurrency(action.isCompleted
                            ? action.actualAmount
                            : getEditedActualAmount()
                        )}
                    </strong>

                    {!action.isCompleted && isEditing && (
                        <div className="recommended-edit-row">
                            <input
                                type="number"
                                min="0"
                                max={action.recommendedAmount}
                                step="0.01"
                                value={
                                    editedRecommendedAmounts[action.key] ??
                                    String(action.actualAmount)
                                }
                                onChange={(event) =>
                                    updateEditedAmount(event.target.value)
                                }
                                className="recommended-edit-input"
                            />
                        </div>
                    )}

                    {!action.isCompleted && isEditing && (
                        <div className="recommended-edit-actions">
                            <button
                                type="button"
                                className="text-action-button"
                                onClick={() => {
                                    setEditingRecommendedKey(null);
                                    setEditedRecommendedAmounts((current) => {
                                        const next = { ...current };
                                        delete next[action.key];
                                        return next;
                                    });
                                    setRecommendedAmountErrors((current) => {
                                        const next = { ...current };
                                        delete next[action.key];
                                        return next;
                                    });
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="text-action-button"
                                onClick={handleSubmitRecommendedAction}
                            >
                                Save
                            </button>
                        </div>
                    )}

                    {recommendedAmountErrors[action.key] && (
                        <p className="validation-error">
                            {recommendedAmountErrors[action.key]}
                        </p>
                    )}
                </div>

                <div className="saved-item-right">

                    {!action.isCompleted && !isEditing && (action.category === "emergency" || action.category === "snowball") && (
                        <button
                            type="button"
                            className="text-action-button"
                            onClick={() => {
                                triggerLightHaptic();
                                setEditingRecommendedKey(action.key);
                                setEditedRecommendedAmounts((current) => ({
                                    ...current,
                                    [action.key]: String(action.actualAmount),
                                }));
                            }}
                        >
                            Edit
                        </button>
                    )}

                    <button
                        type="button"
                        className={
                            action.isCompleted
                                ? "action-pill completed"
                                : "action-pill"
                        }
                        onClick={() => {
                            triggerMediumHaptic();
                            handleRecommendedPrimaryAction();
                        }}
                    >
                        {action.isCompleted
                            ? "Undo"
                            : action.category === "emergency" ||
                                action.category === "optional_goal"
                                ? "Mark Saved"
                                : "Mark Paid"
                        }
                    </button>

                    {!action.isCompleted && (
                        <button
                            type="button"
                            className="text-action-button"
                            onClick={() => {
                                triggerMediumHaptic();
                                handleRecommendedOutsidePaycheck();
                                
                            }}
                        >
                            Outside Paycheck
                        </button>
                    )}
                </div>
            </SwipeActionCard>
        );
    }

    return (
        <section className="card plan-dashboard plan-dark-polish">
            <div className="plan-dashboard-header">
                <div>
                    <h2>This Paycheck</h2>

                    <p
                        className={
                            hasOverdueItems || result.shortfall > 0
                                ? "status-warning"
                                : "status-good"
                        }
                    >
                        {hasOverdueItems
                            ? "You have overdue payments requiring attention."
                            : result.shortfall > 0
                                ? `You're short ${formatCurrency(
                                    result.shortfall
                                )} this cycle.`
                                : "You're on track this cycle."}
                    </p>
                </div>
            </div>

            <div className="execution-summary-strip" aria-live="polite" aria-label="Paycheck summary">
                <div>
                    <span>Required</span>
                    <strong>
                        {(() => { const { dollars, cents } = formatDisplayAmount(requiredTotal); return <><span className="display-amount-symbol">$</span>{dollars}<span className="display-amount-cents">.{cents}</span></>; })()}
                    </strong>
                </div>

                <div>
                    <span>Extra Payoff</span>
                    <strong>
                        {(() => { const { dollars, cents } = formatDisplayAmount(displayedRecommendedTotal); return <><span className="display-amount-symbol">$</span>{dollars}<span className="display-amount-cents">.{cents}</span></>; })()}
                    </strong>
                </div>

                <div>
                    <span>Remaining Cushion</span>
                    <strong>
                        {(() => { const { dollars, cents } = formatDisplayAmount(flexibleCashAvailable); return <><span className="display-amount-symbol">$</span>{dollars}<span className="display-amount-cents">.{cents}</span></>; })()}
                    </strong>
                </div>

                <div className="strip-cell-debt-free">
                    <span>Debt-Free</span>
                    <strong>
                        {debtFreeDate ?? (debts.some(d => d.balance > 0) ? "—" : "Add debts")}
                    </strong>
                </div>
            </div>

            {(() => {
                // Since-Last-Cycle delta (#13): how total debt moved vs the
                // last recorded cycle. Nothing shown until a cycle exists.
                const currentTotalDebt = debts.reduce(
                    (sum, debt) => sum + debt.balance,
                    0
                );
                const cycleDelta = computeCycleDelta(
                    previousSnapshot,
                    currentTotalDebt
                );

                if (!cycleDelta) {
                    return null;
                }

                const fell = cycleDelta.direction === "down";

                return (
                    <div
                        className={`summary-strip-delta summary-strip-delta-${cycleDelta.direction}`}
                        role="status"
                        aria-label={`Since your last cycle, total debt ${fell ? "fell" : "rose"} by ${formatCurrency(cycleDelta.amount)}`}
                    >
                        {fell ? (
                            <TrendingDown size={15} aria-hidden="true" />
                        ) : (
                            <TrendingUp size={15} aria-hidden="true" />
                        )}
                        <span className="summary-strip-delta-amount">
                            {formatCurrency(cycleDelta.amount)}
                        </span>
                        <span className="summary-strip-delta-label">
                            {fell ? "paid down since last cycle" : "since last cycle"}
                        </span>
                    </div>
                );
            })()}

            <div className="plan-dashboard-section">
                <button
                    type="button"
                    className="section-collapse-button"
                    onClick={() => {
                        triggerLightHaptic();
                        setRequiredExpanded((current) => !current);
                    }}

                >
                    <div className="section-collapse-left">
                        <div>
                            <h2>Required Actions</h2>
                            <p className="section-collapse-subtitle">Bills and minimums due this paycheck.</p>
                        </div>

                        <span className="section-count-pill">
                            {unpaidRequiredActions.length + unfundedRequiredItems.length}
                        </span>
                    </div>

                    <span
                        className={
                            requiredExpanded
                                ? "collapse-chevron expanded"
                                : "collapse-chevron"
                        }
                    >
                        ▼
                    </span>
                </button>

                <div
                    className={
                        requiredExpanded
                            ? "plan-section-body expanded"
                            : "plan-section-body collapsed"
                    }
                    aria-hidden={!requiredExpanded}
                >
                    {!hasAnyRequiredOutstanding ? (
                        <p className="empty-state success-empty-state">
                            You&apos;re caught up for this paycheck. No unpaid required actions remain.
                        </p>
                    ) : (
                        visibleRequiredActions.map((item, index) => renderRequiredAction(item, index))
                    )}

                    {hiddenRequiredCount > 0 && (
                        <button
                            type="button"
                            className="text-action-button show-more-inline"
                            onClick={() => {
                                triggerLightHaptic();
                                setShowAllRequiredActions(true);
                            }}
                        >
                            Show {hiddenRequiredCount} More
                        </button>
                    )}

                    {showAllRequiredActions && unpaidRequiredActions.length > 6 && (
                        <button
                            type="button"
                            className="text-action-button show-more-inline"
                            onClick={() => {
                                triggerLightHaptic();
                                setShowAllRequiredActions(false);
                            }}
                        >
                            Show fewer required actions.
                        </button>
                    )}

                    {unfundedRequiredItems.length > 0 && (
                        <div
                            className="unfunded-required-block"
                            role="group"
                            aria-label="Not covered by this paycheck"
                        >
                            <p className="unfunded-required-note">
                                Your paycheck can&apos;t cover these this cycle
                                {result.shortfall > 0
                                    ? ` — you're short ${formatCurrency(result.shortfall)}`
                                    : ""}
                                . Cover them from savings or your next paycheck.
                            </p>
                            {unfundedRequiredItems.map((item, index) => (
                                <div
                                    key={`unfunded-${item.debtId ?? item.label}-${index}`}
                                    className="required-shortfall-row"
                                >
                                    <span className="required-shortfall-label">
                                        {item.label}
                                    </span>
                                    <span className="required-shortfall-amount">
                                        {formatCurrency(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="plan-dashboard-section recommended-section">
                <button
                    type="button"
                    className="section-collapse-button recommended-collapse"
                    onClick={() => {
                        triggerLightHaptic();
                        setRecommendedExpanded((current) => !current);
                    }}
                >
                    <div className="section-collapse-left">
                        <div>
                            <h2>
                                Recommended Actions
                                <span className="section-count-pill">
                                    {displayedRecommendedActions.length}
                                </span>
                            </h2>

                            <p className="section-collapse-subtitle">
                                Best next move for this paycheck.
                            </p>
                        </div>
                    </div>

                    <span
                        className={
                            recommendedExpanded
                                ? "collapse-chevron expanded"
                                : "collapse-chevron"
                        }
                    >
                        ▼
                    </span>
                </button>

                <div
                    className={
                        recommendedExpanded
                            ? "plan-section-body expanded"
                            : "plan-section-body collapsed"
                    }
                    aria-hidden={!recommendedExpanded}
                >
                    {displayedRecommendedActions.length === 0 ? (
                        <p className="empty-state">
                            No emergency fund or extra debt payment recommendation available this pay cycle.
                        </p>
                    ) : (
                        <>
                            <div className="focus-card">
                                {renderRecommendedAction(visibleRecommendedActions[0], {
                                    isFocusTarget: true,
                                })}
                            </div>

                            {visibleRecommendedActions.length > 1 && (
                                <div className="secondary-recommendations">
                                    {visibleRecommendedActions.slice(1).map((item) => renderRecommendedAction(item))}
                                </div>
                            )}

                            {hiddenRecommendedCount > 0 && (
                                <button
                                    type="button"
                                    className="text-action-button show-more-inline"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        setShowAllRecommendedActions(true);
                                    }}
                                >
                                    Show {hiddenRecommendedCount} More
                                </button>
                            )}

                            {showAllRecommendedActions && displayedRecommendedActions.length > 5 && (
                                <button
                                    type="button"
                                    className="text-action-button show-more-inline"
                                    onClick={() => {
                                        triggerLightHaptic();
                                        setShowAllRecommendedActions(false);
                                    }}
                                >
                                    Show fewer recommended actions.
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {completedRequiredActions.length > 0 && (
                <CompletedActionsList
                    count={completedRequiredActions.length}
                    isExpanded={completedExpanded}
                    onToggleExpanded={() => setCompletedExpanded((current) => !current)}
                >
                    {completedRequiredActions.map((item, index) => renderRequiredAction(item, index))}
                </CompletedActionsList>
            )}

            {optionalGoalActions.length > 0 && (
                <OptionalGoalsList>
                    {optionalGoalActions.map((item) => {
                        if (
                            !isRecommendedCategory(item.category) ||
                            !item.targetId
                        ) {
                            return null;
                        }

                        return renderRecommendedAction({
                            key: `optional-${getRecommendedKey(item)}`,
                            label: item.label,
                            category: item.category,
                            targetId: item.targetId,
                            recommendedAmount: item.amount,
                            actualAmount: item.amount,
                            isCompleted: false,
                        });
                    })}
                </OptionalGoalsList>
            )}
        </section>
    );
}
