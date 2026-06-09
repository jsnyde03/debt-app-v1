import { useState } from "react";
import type { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import type {
    Debt,
    RequiredExpense,
    RecommendationOverride,
} from "@/lib/storage/debtPlannerStorage";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

type RecommendedCategory = "emergency" | "snowball" | "optional_goal";

type Goal = {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    type: "emergency" | "savings";
};

type CompletedRecommendedAction = {
    targetId: string;
    label: string;
    category: RecommendedCategory;
    recommendedAmount: number;
    actualAmount: number;
    paymentSource?: "paycheck" | "external";
};

type ResultsSectionProps = {
    result: AllocationResult | null;
    requiredExpenses: RequiredExpense[];
    debts: Debt[];
    goals: Goal[];
    completedRecommendedActions: CompletedRecommendedAction[];
    recommendationOverrides: RecommendationOverride[];
    currentDate: string;
    payoffStrategy: "snowball" | "avalanche";
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
    goals,
    completedRecommendedActions,
    recommendationOverrides,
    currentDate,
    payoffStrategy,
    onMarkExpensePaid,
    onMarkDebtMinimumPaid,
    onMarkRecommendedAction,
    onRecommendationOverrideChange,
}: ResultsSectionProps) {
    const [showAllRequiredActions, setShowAllRequiredActions] =
        useState(false);

    const [requiredExpanded, setRequiredExpanded] = useState(true);

    const [recommendedExpanded, setRecommendedExpanded] = useState(false);

    const [completedExpanded, setCompletedExpanded] = useState(false);

    const [showAllRecommendedActions, setShowAllRecommendedActions] =
        useState(false);

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

    const completedSnowballAmountsByDebtId = completedRecommendedActions
        .filter((action) => action.category === "snowball")
        .reduce<Record<string, number>>((map, action) => {
            map[action.targetId] = roundMoney(
                (map[action.targetId] ?? 0) + action.actualAmount
            );

            return map;
        }, {});

    const adjustedActiveDebts = debts
        .map((debt) => ({
            ...debt,
            balance: roundMoney(
                Math.max(
                    0,
                    debt.balance -
                    (completedSnowballAmountsByDebtId[debt.id] ?? 0)
                )
            ),
        }))
        .filter((debt) => debt.balance > 0)
        .sort((a, b) => {
            if (payoffStrategy === "avalanche") {
                if (b.apr !== a.apr) {
                    return b.apr - a.apr;
                }

                return a.balance - b.balance;
            }

            return a.balance - b.balance;
        });

    const activeSnowballRecommendationActions = adjustedActiveDebts.map(
        (debt) => ({
            category: "snowball" as const,
            targetId: debt.id,
            debtId: debt.id,
            label: `Extra payment to ${debt.name}`,
            amount: debt.balance,
        })
    );

    const recommendedActions = [
        ...result.allocations.filter((item) => item.category === "emergency"),
        ...activeSnowballRecommendationActions,
    ];

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

    const requiredTotal = unpaidRequiredActions.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    const completedRecommendedTotal = completedRecommendedActions.filter((action) => action.paymentSource !== "external").reduce((sum, action) => sum + action.actualAmount, 0);

    const flexibleCashAvailable = roundMoney(
        Math.max(
            0,
            result.paycheckAmount -
            result.totalRequired -
            result.livingExpenseReserve -
            bufferTotal -
            completedRecommendedTotal
        )
    );

    function getRecommendationMaxAmount(
        item: AllocationResult["allocations"][number]
    ) {
        if (!item.targetId) {
            return item.amount;
        }

        if (item.category === "snowball") {
            const debt = debts.find(
                (debtItem) => debtItem.id === item.targetId
            );

            if (!debt) {
                return item.amount;
            }

            return roundMoney(Math.max(0, debt.balance));
        }

        if (item.category === "emergency" || item.category === "optional_goal") {
            const goal = goals.find(
                (goalItem) => goalItem.id === item.targetId
            );

            if (!goal) {
                return item.amount;
            }

            return roundMoney(
                Math.max(0, goal.targetAmount - goal.currentAmount)
            );
        }

        return item.amount;
    }

    function getRecommendationOverrideAmount(
        targetId: string,
        category: RecommendedCategory
    ) {
        if (category !== "emergency" && category !== "snowball") {
            return undefined;
        }

        return recommendationOverrides.find(
            (override) =>
                override.targetId === targetId &&
                override.category === category
        )?.amount;
    }

    const activeRecommendedDisplayActions: RecommendedDisplayAction[] = [];

    let remainingRecommendationCapacity = flexibleCashAvailable;

    for (const item of recommendedActions) {
        if (remainingRecommendationCapacity <= 0) {
            break;
        }

        if (!isRecommendedCategory(item.category) || !item.targetId) {
            continue;
        }

        const key = `active-${getRecommendedKey(item)}`;
        const maxAmount = getRecommendationMaxAmount(item);

        const overrideAmount = getRecommendationOverrideAmount(
            item.targetId,
            item.category
        );

        const amount = roundMoney(
            Math.min(
                overrideAmount ?? maxAmount,
                maxAmount,
                remainingRecommendationCapacity
            )
        );

        if (amount <= 0) {
            continue;
        }

        activeRecommendedDisplayActions.push({
            key,
            label: item.label,
            category: item.category,
            targetId: item.targetId,
            recommendedAmount: maxAmount,
            actualAmount: amount,
            isCompleted: false,
        });

        remainingRecommendationCapacity = roundMoney(
            remainingRecommendationCapacity - amount
        );
    }

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

    const remainingCashToComeOut = roundMoney(
        Math.max(0, requiredTotal + displayedRecommendedTotal)
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

        return (
            <div
                key={`${item.category}-${item.targetId ?? index}`}
                className={[
                    "saved-item",
                    isPaid ? "completed-item" : "",
                    overdue ? "overdue-item" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
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
                            if (
                                item.category === "expense" ||
                                item.category === "autopay_expense"
                            ) {
                                if (item.targetId) {
                                    onMarkExpensePaid(item.targetId);
                                }

                                return;
                            }

                            if (
                                item.category === "minimum_debt" ||
                                item.category === "autopay_debt"
                            ) {
                                const debtId = item.debtId ?? item.targetId;

                                if (debtId) {
                                    onMarkDebtMinimumPaid(debtId);
                                }
                            }
                        }}
                    >
                        {isPaid ? "Undo" : "Mark Paid"}
                    </button>
                </div>
            </div>
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

        return (
            <div
                key={action.key}
                className={[
                    "saved-item",
                    "recommended-card",
                    options?.isFocusTarget ? "focus-target-card" : "",
                    action.isCompleted ? "completed-action completed-item" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
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
                    <strong className="saved-amount recommended-amount">
                        {formatCurrency(
                            action.isCompleted
                                ? action.actualAmount
                                : getEditedActualAmount()
                        )}
                    </strong>

                    {!action.isCompleted && !isEditing && (
                        <button
                            type="button"
                            className="text-action-button"
                            onClick={() => {
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
                                onMarkRecommendedAction(
                                    action.targetId,
                                    action.label,
                                    action.category,
                                    action.recommendedAmount,
                                    roundMoney(action.actualAmount),
                                    "external"
                                );
                            }}
                        >
                            Paid Outside Paycheck
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <section className="card plan-dashboard">
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

            <div className="execution-summary-strip">
                <div>
                    <span>Required</span>
                    <strong>{formatCurrency(requiredTotal)}</strong>
                </div>

                <div>
                    <span>Recommended</span>
                    <strong>
                        {formatCurrency(displayedRecommendedTotal)}
                    </strong>
                </div>

                <div>
                    <span>Safe Cash</span>
                    <strong>{formatCurrency(flexibleCashAvailable)}</strong>
                </div>

                <div>
                    <span>Status</span>
                    <strong>
                        {hasOverdueItems
                            ? "Overdue"
                            : result.shortfall > 0
                                ? "Short"
                                : "On Track"}
                    </strong>
                </div>
            </div>

            <div className="plan-dashboard-section">
                <button
                    type="button"
                    className="section-collapse-button"
                    onClick={() =>
                        setRequiredExpanded((current) => !current)
                    }
                >
                    <div className="section-collapse-left">
                        <h2>Required Actions</h2>

                        <span className="section-count-pill">
                            {unpaidRequiredActions.length}
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

                {requiredExpanded && (
                    <>
                        {unpaidRequiredActions.length === 0 ? (
                            <p className="empty-state success-empty-state">
                                You&apos;re caught up for this paycheck. No
                                unpaid required actions remain.
                            </p>
                        ) : (
                            visibleRequiredActions.map((item, index) =>
                                renderRequiredAction(item, index)
                            )
                        )}

                        {hiddenRequiredCount > 0 && (
                            <button
                                type="button"
                                className="text-action-button show-more-inline"
                                onClick={() =>
                                    setShowAllRequiredActions(true)
                                }
                            >
                                View {hiddenRequiredCount} more required
                                actions.
                            </button>
                        )}

                        {showAllRequiredActions &&
                            unpaidRequiredActions.length > 6 && (
                                <button
                                    type="button"
                                    className="text-action-button show-more-inline"
                                    onClick={() =>
                                        setShowAllRequiredActions(false)
                                    }
                                >
                                    Show fewer required actions.
                                </button>
                            )}
                    </>
                )}
            </div>

            <div className="plan-dashboard-section recommended-section">
                <button
                    type="button"
                    className="section-collapse-button recommended-collapse"
                    onClick={() =>
                        setRecommendedExpanded((current) => !current)
                    }
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

                {recommendedExpanded && (
                    <>
                        {displayedRecommendedActions.length === 0 ? (
                            <p className="empty-state">
                                No emergency fund or extra debt payment
                                recommendation available this pay cycle.
                            </p>
                        ) : (
                            <>
                                <div className="focus-card">
                                    <div className="focus-badge">
                                        Focus Target
                                    </div>

                                    {renderRecommendedAction(
                                        visibleRecommendedActions[0],
                                        {
                                            isFocusTarget: true,
                                        }
                                    )}
                                </div>

                                {visibleRecommendedActions.length > 1 && (
                                    <div className="secondary-recommendations">
                                        {visibleRecommendedActions
                                            .slice(1)
                                            .map((item) =>
                                                renderRecommendedAction(item)
                                            )}
                                    </div>
                                )}

                                {hiddenRecommendedCount > 0 && (
                                    <button
                                        type="button"
                                        className="text-action-button show-more-inline"
                                        onClick={() =>
                                            setShowAllRecommendedActions(true)
                                        }
                                    >
                                        View {hiddenRecommendedCount} more
                                        recommended actions.
                                    </button>
                                )}

                                {showAllRecommendedActions &&
                                    displayedRecommendedActions.length > 5 && (
                                        <button
                                            type="button"
                                            className="text-action-button show-more-inline"
                                            onClick={() =>
                                                setShowAllRecommendedActions(
                                                    false
                                                )
                                            }
                                        >
                                            Show fewer recommended actions.
                                        </button>
                                    )}
                            </>
                        )}
                    </>
                )}
            </div>

            {completedRequiredActions.length > 0 && (
                <div className="plan-dashboard-section completed-section">
                    <button
                        type="button"
                        className="section-collapse-button"
                        onClick={() =>
                            setCompletedExpanded((current) => !current)
                        }
                    >
                        <div className="section-collapse-left">
                            <h2>Completed This Cycle</h2>

                            <span className="section-count-pill">
                                {completedRequiredActions.length}
                            </span>
                        </div>

                        <span
                            className={
                                completedExpanded
                                    ? "collapse-chevron expanded"
                                    : "collapse-chevron"
                            }
                        >
                            ▼
                        </span>
                    </button>

                    {completedExpanded && (
                        <div className="required-actions-list">
                            {completedRequiredActions.map((item, index) =>
                                renderRequiredAction(item, index)
                            )}
                        </div>
                    )}
                </div>
            )}

            {optionalGoalActions.length > 0 && (
                <div className="plan-dashboard-section">
                    <h2>Optional Goals</h2>

                    <p className="empty-state">
                        These are optional savings contributions after required
                        payments and debt payoff recommendations.
                    </p>

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
                </div>
            )}
        </section>
    );
}
