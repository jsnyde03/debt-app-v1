import { useState } from "react";
import type { Debt } from "@/lib/storage/debtPlannerStorage";
import type { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import { projectDebtPayoff } from "@/lib/debt/projectDebtPayoff";
import { formatCurrency } from "@/lib/utils/formatCurrency";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

type CompletedRecommendedAction = {
    targetId: string;
    label: string;
    category: "emergency" | "snowball" | "optional_goal";
    recommendedAmount: number;
    actualAmount: number;
};

type SnowballSectionProps = {
    debts: Debt[];
    result: AllocationResult | null;
    completedRecommendedActions: CompletedRecommendedAction[];
    payoffStrategy: "snowball" | "avalanche";
    currentDate: string;
    setPayoffStrategy: React.Dispatch<
        React.SetStateAction<"snowball" | "avalanche">
    >;
};

export function SnowballSection({
    debts,
    result,
    completedRecommendedActions,
    payoffStrategy,
    currentDate,
    setPayoffStrategy,
}: SnowballSectionProps) {
    const [showPayoffOrder, setShowPayoffOrder] = useState(false);
    const [payoffOrderPage, setPayoffOrderPage] = useState(1);

    const debtsAfterCompletedPayments = debts.map((debt) => {
        const completedAmountForDebt = completedRecommendedActions
            .filter(
                (action) =>
                    action.category === "snowball" &&
                    action.targetId === debt.id
            )
            .reduce((sum, action) => sum + action.actualAmount, 0);

        return {
            ...debt,
            balance: Math.max(0, debt.balance - completedAmountForDebt),
        };
    });

    const payoffOrder = [...debtsAfterCompletedPayments]
        .filter((debt) => debt.balance > 0)
        .sort((a, b) => {
            if (payoffStrategy === "avalanche") {
                return b.apr - a.apr;
            }

            return a.balance - b.balance;
        });

    const payoffOrderPageSize = 10;
    const totalPayoffPages = Math.max(
        1,
        Math.ceil(payoffOrder.length / payoffOrderPageSize)
    );
    const visiblePayoffOrder = payoffOrder.slice(
        (payoffOrderPage - 1) * payoffOrderPageSize,
        payoffOrderPage * payoffOrderPageSize
    );

    const snowballAllocations =
        result?.allocations.filter((item) => item.category === "snowball") ?? [];

    const currentTarget = payoffOrder[0];

    const remainingSnowballExtra = snowballAllocations.reduce((sum, item) => {
        const completedForItem = completedRecommendedActions
            .filter(
                (action) =>
                    action.category === "snowball" &&
                    action.targetId === item.targetId &&
                    action.label === item.label
            )
            .reduce(
                (completedSum, action) => completedSum + action.actualAmount,
                0
            );

        return sum + Math.max(0, item.amount - completedForItem);
    }, 0);

    const hasCalculatedPlan = result !== null;

    const baselineProjection = projectDebtPayoff({
        debts,
        monthlyExtraPayment: 0,
        strategy: payoffStrategy,
        startDate: currentDate,
    });

    const actualProjection = projectDebtPayoff({
        debts: debtsAfterCompletedPayments,
        monthlyExtraPayment: 0,
        strategy: payoffStrategy,
        startDate: currentDate,
    });

    const recommendedProjection = projectDebtPayoff({
        debts: debtsAfterCompletedPayments,
        monthlyExtraPayment: remainingSnowballExtra,
        strategy: payoffStrategy,
        startDate: currentDate,
    });

    const baselineCanBeEstimated =
        hasCalculatedPlan &&
        baselineProjection.estimatedDebtFreeDate !== "Unable to estimate";

    const actualCanBeEstimated =
        hasCalculatedPlan &&
        actualProjection.estimatedDebtFreeDate !== "Unable to estimate";

    const recommendedCanBeEstimated =
        hasCalculatedPlan &&
        recommendedProjection.estimatedDebtFreeDate !== "Unable to estimate";

    const actualInterestSaved =
        baselineCanBeEstimated && actualCanBeEstimated
            ? Math.max(
                0,
                baselineProjection.totalInterestPaid -
                actualProjection.totalInterestPaid
            )
            : null;

    return (
        <section className="card">
            <div className="section-heading-row">
                <div>
                    <h2>Payoff</h2>

                    <p className="section-collapse-subtitle">
                        Debt-free timeline and order.
                    </p>
                </div>
            </div>

            {!currentTarget ? (
                <div className="empty-debt-state compact-empty-state">
                    <strong>No Active Debts Yet.</strong>
                    <p>Add debts to see your payoff order and projected timeline.</p>
                </div>
            ) : (
                <>
                    <div className="payoff-focus-strip">
                        <div>
                            <span>Current Target</span>
                            <strong>{currentTarget.name}</strong>
                        </div>

                        <strong>{formatCurrency(currentTarget.balance)} left</strong>
                    </div>

                    <div className="payoff-strategy-selector compact-payoff-strategy">
                        <div className="strategy-buttons">
                            <button
                                type="button"
                                className={
                                    payoffStrategy === "snowball"
                                        ? "strategy-button-active"
                                        : "strategy-button"
                                }
                                onClick={() => setPayoffStrategy("snowball")}
                            >
                                Snowball
                            </button>

                            <button
                                type="button"
                                className={
                                    payoffStrategy === "avalanche"
                                        ? "strategy-button-active"
                                        : "strategy-button"
                                }
                                onClick={() => setPayoffStrategy("avalanche")}
                            >
                                Avalanche
                            </button>
                        </div>

                        <p className="strategy-description">
                            {payoffStrategy === "snowball"
                                ? "Smallest balance first."
                                : "Highest APR first."}
                        </p>
                    </div>

                    <div className="payoff-summary-strip">
                        <div>
                            <span>Debt Free</span>
                            <strong>
                                {actualCanBeEstimated
                                    ? actualProjection.estimatedDebtFreeDate
                                    : "—"}
                            </strong>
                        </div>

                        {/*          
                        <div>
                            <span>Interest</span>
                            <strong>
                                {hasCalculatedPlan && actualCanBeEstimated
                                    ? formatCurrency(actualProjection.totalInterestPaid)
                                    : "—"}
                            </strong>
                        </div>

                        <div>
                            <span>Saved</span>
                            <strong>
                                {actualInterestSaved === null
                                    ? "—"
                                    : formatCurrency(actualInterestSaved)}
                            </strong>
                        </div>
                        */}
                    </div>

                    {recommendedCanBeEstimated && remainingSnowballExtra > 0 && (
                        <div className="payoff-recommendation-strip">
                            <span>With current recommendation</span>
                            <strong>{recommendedProjection.estimatedDebtFreeDate}</strong>
                        </div>
                    )}

                    <div className="debt-group">
                        <button
                            type="button"
                            className="section-collapse-button"
                            onClick={() => setShowPayoffOrder((current) => !current)}
                        >
                            <div className="section-collapse-left">
                                <h2>Payoff Order</h2>
                                <span className="section-count-pill">
                                    {payoffOrder.length}
                                </span>
                            </div>

                            <span className="collapse-chevron">
                                {showPayoffOrder ? "▲" : "▼"}
                            </span>
                        </button>

                        {showPayoffOrder && (
                            <>
                                {visiblePayoffOrder.map((debt, index) => (
                                    <div key={debt.id} className="saved-item debt-list-item">
                                        <div className="saved-item-left">
                                            <div className="saved-title">
                                                #
                                                {(payoffOrderPage - 1) *
                                                    payoffOrderPageSize +
                                                    index +
                                                    1}{" "}
                                                {debt.name}
                                            </div>

                                            <div className="saved-meta">
                                                Min {formatCurrency(debt.minimumPayment)} · APR{" "}
                                                {debt.apr}%
                                            </div>
                                        </div>

                                        <div className="saved-item-right">
                                            <strong className="saved-amount">
                                                {formatCurrency(debt.balance)}
                                            </strong>
                                        </div>
                                    </div>
                                ))}

                                {payoffOrder.length > payoffOrderPageSize && (
                                    <div className="pagination-actions pagination-compact">
                                        <button
                                            type="button"
                                            className="text-action-button"
                                            disabled={payoffOrderPage <= 1}
                                            onClick={() =>
                                                setPayoffOrderPage((current) =>
                                                    Math.max(1, current - 1)
                                                )
                                            }
                                        >
                                            ‹
                                        </button>

                                        <span className="pagination-status">
                                            Page {payoffOrderPage} of {totalPayoffPages}
                                        </span>

                                        <button
                                            type="button"
                                            className="text-action-button"
                                            disabled={payoffOrderPage >= totalPayoffPages}
                                            onClick={() =>
                                                setPayoffOrderPage((current) =>
                                                    Math.min(totalPayoffPages, current + 1)
                                                )
                                            }
                                        >
                                            ›
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}
