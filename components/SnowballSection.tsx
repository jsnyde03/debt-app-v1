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
    const [showAdvancedProjection, setShowAdvancedProjection] = useState(false);

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
    const totalPayoffPages = Math.max(1, Math.ceil(payoffOrder.length / payoffOrderPageSize));
    const visiblePayoffOrder = payoffOrder.slice((payoffOrderPage - 1) * payoffOrderPageSize, payoffOrderPage * payoffOrderPageSize);

    const snowballAllocations =
        result?.allocations.filter((item) => item.category === "snowball") ?? [];

    const currentTarget = payoffOrder[0];

    const completedSnowballExtra = completedRecommendedActions
        .filter((action) => action.category === "snowball")
        .reduce((sum, action) => sum + action.actualAmount, 0);

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
        hasCalculatedPlan && baselineProjection.estimatedDebtFreeDate !== "Unable to estimate";

    const actualCanBeEstimated =
        hasCalculatedPlan && actualProjection.estimatedDebtFreeDate !== "Unable to estimate";

    const recommendedCanBeEstimated =
        hasCalculatedPlan && recommendedProjection.estimatedDebtFreeDate !== "Unable to estimate";


    const actualInterestSaved =
        baselineCanBeEstimated && actualCanBeEstimated
            ? Math.max(
                0,
                baselineProjection.totalInterestPaid -
                actualProjection.totalInterestPaid
            )
            : null;

    const additionalRecommendedInterestSavings =
        actualCanBeEstimated && recommendedCanBeEstimated
            ? Math.max(
                0,
                actualProjection.totalInterestPaid -
                recommendedProjection.totalInterestPaid
            )
            : null;

    return (
        <section className="card">
            <h2>Debt Payoff Plan</h2>

            {!currentTarget ? (
                <p className="empty-state">No active debts added yet.</p>
            ) : (
                <>
                    <div className="snowball-target">
                        <p className="empty-state">Current Target</p>
                        <h3>{currentTarget.name}</h3>
                        <p>
                            Balance:{" "}
                            <strong>{formatCurrency(currentTarget.balance)}</strong>
                        </p>
                    </div>

                    <div className="payoff-strategy-selector">
                        <label>Payoff Strategy</label>

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
                                ? "Snowball prioritizes the smallest balance first for faster psychological wins."
                                : "Avalanche prioritizes the highest APR debts first to reduce long-term interest paid."}
                        </p>
                    </div>
            
                <div className="debt-group">
                        <h3>Projected Payoff</h3>

                        <div className="debt-summary-grid">
                            <div className="summary-card payoff-date-card">
                                <span>Debt Free</span>

                                <strong className="payoff-date-value">{actualProjection.estimatedDebtFreeDate}</strong>
                            </div>

                            <div className="summary-card payoff-date-card">
                                <span>With Recommendation</span>

                                <strong className="payoff-date-value">{recommendedProjection.estimatedDebtFreeDate}</strong>
                            </div>

                            <div className="summary-card">
                                <span>Interest Paid</span>
                                <strong>{hasCalculatedPlan && actualCanBeEstimated
                                            ? formatCurrency(actualProjection.totalInterestPaid)
                                            : "—"}
                                </strong>
                            </div>

                            <div className="summary-card">
                                <span>Interest Saved</span>
                                <strong>{actualInterestSaved === null ? "—" : formatCurrency(actualInterestSaved)}</strong>
                            </div>
                        </div>
                    </div>

                {/*    <button
                        type="button"
                        className="collapsible-header"
                        onClick={() => setShowAdvancedProjection((current) => !current)}
                    >
                        <span>Advanced Projection Details</span>

                        <span>{showAdvancedProjection ? "-" : "+"}</span>
                    </button>

                    {showAdvancedProjection && (
                        <>
                            <div className="saved-item">
                                <div>
                                    <div className="saved-title">
                                        Completed Extra Debt Payments
                                    </div>

                                    <div className="saved-meta">
                                        Extra payments already marked paid this cycle.
                                    </div>

                                    <div className="saved-amount">
                                        {formatCurrency(completedSnowballExtra)}
                                    </div>
                                </div>

                                <div className="saved-item">
                                    <div>
                                        <div className="saved-title">
                                            Additional Interest Savings Available
                                        </div>

                                        <div className="saved-meta">
                                            Extra interest savings if you pay the current recommendation.
                                        </div>

                                        <div className="saved-amount">
                                            {additionalRecommendedInterestSavings === null ? "—" : formatCurrency(additionalRecommendedInterestSavings)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )} */}
                    <div className="debt-group">
                        <button
                            type="button"
                            className="collapsible-header"
                            onClick={() => setShowPayoffOrder((current) => !current)}
                        >
                            <span>Payoff Order ({payoffOrder.length})</span>
                            <span>{showPayoffOrder ? "-" : "+"}</span>
                        </button>

                        {showPayoffOrder && (
                            <>
                                {visiblePayoffOrder.map((debt, index) => (
                                    <div key={debt.id} className="saved-item">
                                        <div>
                                            <div className="saved-title">
                                                #
                                                {(payoffOrderPage - 1) * payoffOrderPageSize + index + 1}{" "}
                                                {debt.name}
                                            </div>
                                            <div className="saved-meta">
                                                Balance {formatCurrency(debt.balance)} · Min{" "}
                                                {formatCurrency(debt.minimumPayment)} · APR{" "}
                                                {debt.apr}%
                                            </div>
                                        </div>

                                        <div className="saved-amount">
                                            {formatCurrency(debt.balance)}
                                        </div>
                                    </div>
                                ))}

                                {payoffOrder.length > payoffOrderPageSize && (
                                    <div className="pagination-actions">
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            disabled={payoffOrderPage === 1}
                                            onClick={() => setPayoffOrderPage((current) => Math.max(1, current - 1))}
                                        >
                                            Previous
                                        </button>

                                        <span className="pagination-status">Page {payoffOrderPage} of {totalPayoffPages}</span>

                                        <button
                                            type="button"
                                            className="secondary-button"
                                            disabled={payoffOrderPage === totalPayoffPages}
                                            onClick={() => setPayoffOrderPage((current) => Math.min(totalPayoffPages, current + 1))}
                                        >
                                            Next
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
