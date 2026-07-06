import { useState } from "react";
import { createPortal } from "react-dom";
import type { CompletedRecommendedAction, Debt } from "@/lib/storage/debtPlannerStorage";
import type { allocatePaycheck } from "@/lib/engine/allocatePaycheck";
import { projectDebtPayoff } from "@/lib/debt/projectDebtPayoff";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { hasFeatureAccess } from "@/lib/subscription/hasFeatureAccess";
import type { SubscriptionPlan } from "@/lib/subscription/plans";
import { projectForecast } from "@/lib/forecast/projectForecast";
import { buildSmartInsights } from "@/lib/insights/buildSmartInsights";
import { buildPayoffTrajectory } from "@/lib/debt/buildPayoffTrajectory";
import { buildAmortizationSchedule } from "@/lib/debt/buildAmortizationSchedule";
import { AmortizationCalendar } from "./AmortizationCalendar";
import { getPortalTarget } from "@/lib/dom/getPortalTarget";
import { triggerLightHaptic } from "@/lib/mobile/haptics";

type AllocationResult = ReturnType<typeof allocatePaycheck>;

type DebtWithDisplayBalance = Debt & {
	displayBalance?: number;
}

type SnowballSectionProps = {
	debts: DebtWithDisplayBalance[];
	result: AllocationResult | null;
	completedRecommendedActions: CompletedRecommendedAction[];
	payoffStrategy: "snowball" | "avalanche";
	currentDate: string;
	subscriptionPlan: SubscriptionPlan;
	onUpgradeClick: () => void;
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
	subscriptionPlan,
	onUpgradeClick,
	setPayoffStrategy,
}: SnowballSectionProps) {
	const [showPayoffOrder, setShowPayoffOrder] = useState(false);
	const payoffOrderPageSize = 10;
	const [payoffOrderVisibleCount, setPayoffOrderVisibleCount] = useState(payoffOrderPageSize);
	const [simulationExtraPayment, setSimulationExtraPayment] = useState("100");
	const [simulationStrategy, setSimulationStrategy] = useState<"recommended" | "snowball" | "avalanche">("recommended")
	const [expandedPremiumSection, setExpandedPremiumSection] = useState<"insights" | "comparison" | "simulation" | "forecast">("insights");
	const [showSchedule, setShowSchedule] = useState(false);

	const canViewAmortization = hasFeatureAccess(subscriptionPlan, "amortization_schedule");
	const canViewStrategyComparison = hasFeatureAccess(subscriptionPlan, "strategy_comparison");
	const canViewWhatIfScenarios = hasFeatureAccess(subscriptionPlan, "what_if_scenarios");
	const canViewForecasting = hasFeatureAccess(subscriptionPlan, "forecasting");
	const canViewSmartInsights = hasFeatureAccess(subscriptionPlan, "smart_insights");

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
			balance: Math.max(0, (debt.displayBalance ?? debt.balance) - completedAmountForDebt),
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

	const visiblePayoffOrder = payoffOrder.slice(0, payoffOrderVisibleCount);

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

	// Amortization "lite" (v1.5): a month-by-month schedule for the FOCUS debt
	// only, paid at its minimum + the recommended snowball extra. Built on the
	// shared engine so it reconciles with projectDebtPayoff. The full/all-debts
	// calendar lands with the Premium+ tier in v1.6.
	const focusDebtStartingBalance = currentTarget
		? currentTarget.displayBalance ?? currentTarget.balance
		: 0;
	const focusDebtMonthlyPayment = currentTarget
		? currentTarget.minimumPayment + remainingSnowballExtra
		: 0;
	const focusDebtSchedule = currentTarget
		? buildAmortizationSchedule({
			balance: focusDebtStartingBalance,
			apr: currentTarget.type === "bnpl" ? 0 : currentTarget.apr,
			monthlyPayment: focusDebtMonthlyPayment,
		})
		: null;

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

	const actualCanBeEstimated =
		hasCalculatedPlan &&
		actualProjection.estimatedDebtFreeDate !== "Unable to estimate";

	const recommendedCanBeEstimated =
		hasCalculatedPlan &&
		recommendedProjection.estimatedDebtFreeDate !== "Unable to estimate";

	const parsedSimulationExtraPayment = Number(simulationExtraPayment) || 0;

	const snowballComparisonProjection = projectDebtPayoff({
		debts: debtsAfterCompletedPayments,
		monthlyExtraPayment: remainingSnowballExtra,
		strategy: "snowball",
		startDate: currentDate,
	});

	const avalancheComparisonProjection = projectDebtPayoff({
		debts: debtsAfterCompletedPayments,
		monthlyExtraPayment: remainingSnowballExtra,
		strategy: "avalanche",
		startDate: currentDate,
	});

	const comparisonCanBeEstimated = hasCalculatedPlan && snowballComparisonProjection.estimatedDebtFreeDate !== "Unable to estimate" && avalancheComparisonProjection.estimatedDebtFreeDate !== "Unable to estimate";

	const fasterStrategy =
		comparisonCanBeEstimated && snowballComparisonProjection.monthsToDebtFree !== avalancheComparisonProjection.monthsToDebtFree
			? snowballComparisonProjection.monthsToDebtFree < avalancheComparisonProjection.monthsToDebtFree
				? "snowball"
				: "avalanche"
			: null;

	const lowerInterestStrategy =
		comparisonCanBeEstimated && snowballComparisonProjection.totalInterestPaid !== avalancheComparisonProjection.totalInterestPaid
			? snowballComparisonProjection.totalInterestPaid < avalancheComparisonProjection.totalInterestPaid
				? "snowball"
				: "avalanche"
			: null;

	const projectedInterestSavings = Math.max(0, snowballComparisonProjection.totalInterestPaid - avalancheComparisonProjection.totalInterestPaid);
	const projectedMonthDifference = Math.abs(snowballComparisonProjection.monthsToDebtFree - avalancheComparisonProjection.monthsToDebtFree);

	const snowballTrajectory = comparisonCanBeEstimated
		? buildPayoffTrajectory({ debts: debtsAfterCompletedPayments, monthlyExtraPayment: remainingSnowballExtra, strategy: "snowball" })
		: [];
	const avalancheTrajectory = comparisonCanBeEstimated
		? buildPayoffTrajectory({ debts: debtsAfterCompletedPayments, monthlyExtraPayment: remainingSnowballExtra, strategy: "avalanche" })
		: [];
	const showTrajectoryChart = comparisonCanBeEstimated && snowballTrajectory.length > 1;
	const trajectoryMaxMonth = showTrajectoryChart
		? Math.max(snowballTrajectory[snowballTrajectory.length - 1].month, avalancheTrajectory.length > 0 ? avalancheTrajectory[avalancheTrajectory.length - 1].month : 0, 1)
		: 1;
	const trajectoryMaxBalance = showTrajectoryChart ? Math.max(snowballTrajectory[0].balance, 1) : 1;
	const trajectoryToX = (m: number) => 10 + (m / trajectoryMaxMonth) * 280;
	const trajectoryToY = (b: number) => 10 + (1 - Math.max(0, b) / trajectoryMaxBalance) * 78;
	const snowballSvgPoints = showTrajectoryChart
		? snowballTrajectory.map(p => `${trajectoryToX(p.month).toFixed(1)},${trajectoryToY(p.balance).toFixed(1)}`).join(" ")
		: "";
	const avalancheSvgPoints = showTrajectoryChart && avalancheTrajectory.length > 0
		? avalancheTrajectory.map(p => `${trajectoryToX(p.month).toFixed(1)},${trajectoryToY(p.balance).toFixed(1)}`).join(" ")
		: "";

	const recommendedStrategy =
		projectedInterestSavings >= 75 || fasterStrategy === "avalanche"
			? "avalanche"
			: "snowball";

	const recommendedSimulationStrategy = lowerInterestStrategy ?? fasterStrategy ?? payoffStrategy;

	const effectiveSimulationStrategy =
		simulationStrategy === "recommended"
			? recommendedSimulationStrategy
			: simulationStrategy;



	const projectedBuffer = remainingSnowballExtra - (result?.shortfall ?? 0);

	const smartInsights = buildSmartInsights({
		safeExtraPayment: remainingSnowballExtra,
		projectedBuffer,
		debts: debtsAfterCompletedPayments,
		snowballDebtFreeDate: snowballComparisonProjection.estimatedDebtFreeDate,
		avalancheDebtFreeDate: avalancheComparisonProjection.estimatedDebtFreeDate,
		snowballInterest: snowballComparisonProjection.totalInterestPaid,
		avalancheInterest: avalancheComparisonProjection.totalInterestPaid,
	});

	const whatIfBaselineProjection = projectDebtPayoff({
		debts: debtsAfterCompletedPayments,
		monthlyExtraPayment: remainingSnowballExtra,
		strategy: effectiveSimulationStrategy,
		startDate: currentDate,
	});

	const simulatedSnowballProjection =
		projectDebtPayoff({
			debts: debtsAfterCompletedPayments,
			monthlyExtraPayment: remainingSnowballExtra + parsedSimulationExtraPayment,
			strategy: effectiveSimulationStrategy,
			startDate: currentDate,
		});

	const simulationCanBeEstimated = hasCalculatedPlan && simulatedSnowballProjection.estimatedDebtFreeDate !== "Unable to estimate" && whatIfBaselineProjection.estimatedDebtFreeDate !== "Unable to estimate";

	const simulatedInterestSaved =
		simulationCanBeEstimated
			? Math.max(0, whatIfBaselineProjection.totalInterestPaid - simulatedSnowballProjection.totalInterestPaid)
			: 0;

	const simulatedMonthsSaved =
		simulationCanBeEstimated
			? Math.max(0, whatIfBaselineProjection.monthsToDebtFree - simulatedSnowballProjection.monthsToDebtFree)
			: 0;

	const simulatedDaysSaved = simulatedMonthsSaved * 30;

	const totalDebtBalance = debtsAfterCompletedPayments.reduce((sum, debt) => sum + debt.balance, 0);

	const totalMinimumPayment = debtsAfterCompletedPayments.reduce((sum, debt) => sum + Math.min(debt.minimumPayment, debt.balance), 0);
	const projectedBufferLift = Math.min(75, Math.max(0, totalMinimumPayment * 0.05));
	const forecastMonths = projectForecast({
		startingSafeCash: projectedBuffer,
		startingDebtBalance: totalDebtBalance,
		monthlyDebtReduction: remainingSnowballExtra,
		months: 3,
		bufferTrendPerMonth: projectedBufferLift,
		requiredPaymentCount: result?.allocations.filter((item) => item.category === "expense" || item.category === "minimum_debt").length ?? 0,
		monthlyMinimumTotal: debtsAfterCompletedPayments.reduce((sum, debt) => sum + Math.min(debt.minimumPayment, debt.balance), 0),
		nextDebtName: payoffOrder[0]?.name,
		nextDebtMinimum: payoffOrder[0]?.minimumPayment,
	})
	const simulationTargetDebt =
		effectiveSimulationStrategy === "avalanche"
			? [...debtsAfterCompletedPayments].sort((a, b) => {
				if (b.apr !== a.apr) {
					return b.apr - a.apr;
				}

				return a.balance - b.balance;
			})[0]
			: [...debtsAfterCompletedPayments].sort((a, b) => a.balance - b.balance)[0];

	const simulationExtraAllocationPlan = buildExtraPaymentAllocationPlan({
		debts: debtsAfterCompletedPayments,
		amount: parsedSimulationExtraPayment,
		strategy: effectiveSimulationStrategy,
	});

	const snowballIsFaster = fasterStrategy === "snowball";
	const avalancheIsFaster = fasterStrategy === "avalanche";
	const snowballHasLowerInterest = lowerInterestStrategy === "snowball";
	const avalancheHasLowerInterest = lowerInterestStrategy === "avalanche";

	function buildExtraPaymentAllocationPlan({ debts, amount, strategy }: { debts: DebtWithDisplayBalance[]; amount: number; strategy: "snowball" | "avalanche" }) {
		let remainingAmount = Math.max(0, amount);

		const orderedDebts = [...debts].filter((debt) => debt.balance > 0).sort((a, b) => {
			if (strategy === "avalanche") {
				if (b.apr !== a.apr) {
					return b.apr - a.apr;
				}

				return a.balance - b.balance;
			}

			return a.balance - b.balance;
		});

		return orderedDebts.map((debt) => {
			if (remainingAmount <= 0) {
				return null;
			}

			const amountToApply = Math.min(remainingAmount, debt.balance);
			remainingAmount -= amountToApply;

			return {
				debtId: debt.id,
				debtName: debt.name,
				amount: amountToApply,
				remainingBalanceAfterPayment: Math.max(0, debt.balance - amountToApply),
				isPaidOff: amountToApply >= debt.balance,
			};
		}).filter((item): item is NonNullable<typeof item> => item !== null);
	}

	function getInsightMeta(severity: "good" | "warning" | "risk", title: string) {
		if (severity === "risk") {
			return {
				icon: "⚠",
				label: "Risk",
			};
		}

		if (severity === "warning") {
			return {
				icon: "🎯",
				label: "Warning",
			};
		}

		if (title.toLowerCase().includes("interest")) {
			return {
				icon: "📈",
				label: "Impact",
			};
		}

		if (title.toLowerCase().includes("extra")) {
			return {
				icon: "💵",
				label: "Opportunity",
			};
		}

		if (title.toLowerCase().includes("progress")) {
			return {
				icon: "🛡",
				label: "On Track",
			};
		}

		return {
			icon: "✅",
			label: "Good",
		};
	}


	return (
		<section className="card payoff-shell">
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

					{subscriptionPlan !== "premium" && (
						<button
							type="button"
							className="primary-button upgrade-preview-button"
							onClick={() => {
								triggerLightHaptic();
								onUpgradeClick();
							}}
						>
							View Premium
						</button>
					)}
				</div>
			) : (
				<div className="payoff-tab-layout">
					<div className="payoff-summary-col">

					<div className="payoff-focus-strip payoff-focus-premium-lite">
						<div className="payoff-focus-copy">
							<span>Focus Debt</span>
							<strong>{currentTarget.name}</strong>
							<small>Highest Priority Target</small>
						</div>

						<div className="payoff-focus-amount">
							<span>Remaining</span>
							<strong>{formatCurrency(currentTarget.displayBalance ?? currentTarget.balance)}</strong>
						</div>

						<button
							type="button"
							className="payoff-focus-schedule-button"
							onClick={() => {
								triggerLightHaptic();

								if (!canViewAmortization) {
									onUpgradeClick();
									return;
								}

								setShowSchedule(true);
							}}
						>
							<span>View Schedule</span>
							{!canViewAmortization && (
								<span className="premium-pill">Premium</span>
							)}
						</button>
					</div>

					{showSchedule && focusDebtSchedule && typeof document !== "undefined" &&
						createPortal(
							// Portal OUT of the Payoff tab's transformed ancestor
							// (.tab-content-transition) so the position:fixed overlay is
							// viewport-relative (fixes the off-screen sheet on phones) —
							// but into <main class="app dark-theme"> rather than <body>, so
							// it stays inside the theme scope (the .dark-theme CSS is
							// descendant-scoped; portaling to <body> escaped it and rendered
							// light). Mirrors where HistorySection already renders.
							<AmortizationCalendar
								debtName={currentTarget.name}
								startingBalance={focusDebtStartingBalance}
								monthlyPayment={focusDebtMonthlyPayment}
								startDate={currentDate}
								schedule={focusDebtSchedule}
								canAccess={canViewAmortization}
								onUpgrade={() => {
									setShowSchedule(false);
									onUpgradeClick();
								}}
								onClose={() => setShowSchedule(false)}
							/>,
							getPortalTarget()
						)}

					<div className="payoff-strategy-selector compact-payoff-strategy">
						<div className="strategy-buttons">
							<button
								type="button"
								className={
									payoffStrategy === "snowball"
										? "strategy-button-active"
										: "strategy-button"
								}
								onClick={() => {
									triggerLightHaptic(); setPayoffStrategy("snowball");
								}}
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
								onClick={() => { triggerLightHaptic(); setPayoffStrategy("avalanche"); }}
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
					{showTrajectoryChart && (
						<div className="trajectory-chart-card">
							<div className="trajectory-chart-header">
								<span>Payoff Trajectory</span>
								<div className="trajectory-legend">
									<span className="trajectory-legend-item">
										<span className="trajectory-legend-dot trajectory-legend-dot-snowball" />
										Snowball
									</span>
									<span className="trajectory-legend-item">
										<span className="trajectory-legend-dot trajectory-legend-dot-avalanche" />
										Avalanche
									</span>
								</div>
							</div>
							<svg viewBox="0 0 300 98" width="100%" aria-label="Debt payoff trajectory" role="img" className="trajectory-svg">
								<line x1="10" y1="88" x2="290" y2="88" stroke="rgba(148,163,184,0.18)" strokeWidth="1" />
								{avalancheSvgPoints && (
									<polyline
										className="trajectory-line trajectory-line-avalanche"
										pathLength={1}
										points={avalancheSvgPoints}
										fill="none"
										stroke="#a855f7"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
										opacity="0.7"
									/>
								)}
								<polyline
									className="trajectory-line trajectory-line-snowball"
									pathLength={1}
									points={snowballSvgPoints}
									fill="none"
									stroke="#2563eb"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</div>
					)}

					{canViewForecasting && canViewSmartInsights && canViewWhatIfScenarios && (
						<div className="premium-payoff-hero">
							<div>
								<span className="premium-eyebrow">👑 Premium</span>
								<h3>Smart insights. Stronger outcomes.</h3>
								<p>
									Guidance to help you protect cash flow, compare payoff strategies, and accelerate debt freedom.
								</p>
							</div>
						</div>
					)}
					</div>

					<div className="payoff-detail-col">
					<div
						className="strategy-comparison-card premium-collapsible-header"
						onClick={() => {
							triggerLightHaptic();

							if (!canViewSmartInsights) {
								onUpgradeClick();
								return;
							}

							setExpandedPremiumSection(expandedPremiumSection === "insights" ? "comparison" : "insights");
						}}
					>
						<div className="strategy-comparison-header">
							<div>
								<h3>Smart Insights</h3>
								<p>Personalized guidance based on your cash flow and payoff activity.</p>
							</div>
							{!canViewSmartInsights && (

								<span className="premium-pill">Premium</span>
							)}
						</div>
						{expandedPremiumSection === "insights" && (
							<>

								{canViewSmartInsights ? (
									<div className="smart-insight-list">
										{smartInsights.map((insight) => {
											const meta = getInsightMeta(insight.severity, insight.title);

											return (
												<div
													key={insight.title}
													className={`smart-insight-card ${insight.severity}`}
												>
													<div className="smart-insight-topline">
														<span className="smart-insight-icon">
															{meta.icon}
														</span>
														<div>
															<strong>{insight.title}</strong>
															<span className={`insight-chip ${insight.severity}`}>
																{meta.label}
															</span>
														</div>
													</div>

													<p>{insight.message}</p>

													{insight.action && (
														<small>{insight.action}</small>
													)}
												</div>
											);
										})}
										<div className="premium-momentum-card">
											<span>👑</span>
											<div>
												<strong>Keep going - consistency wins</strong>
												<p>
													Your plan is built to protect today and improve your tomorrow.
												</p>
											</div>
										</div>
									</div>
								) : (
									<div className="premium-locked-preview premium-blur-preview">
										<strong>Unlock Smart Insights.</strong>
										<p>
											Premium will provide guidance based on your current paycheck plan, cash pressure, and payoff strategy.
										</p>

										<button
											type="button"
											className="primary-button upgrade-preview-button"
											onClick={onUpgradeClick}
										>
											View Premium
										</button>
									</div>
								)}

							</>
						)}

					</div>

					<div className="strategy-comparison-card premium-module-shell">
						<div
							className="strategy-comparison-header premium-collapsible-header"
							onClick={() => {
								triggerLightHaptic();

								if (!canViewStrategyComparison) {
									onUpgradeClick();
									return;
								}

								setExpandedPremiumSection(
									expandedPremiumSection === "comparison"
										? "simulation"
										: "comparison"
								);
							}}
						>
							<div>
								<h3>Strategy Comparison</h3>

								<p>Compare snowball and avalanche outcomes using your current plan.</p>
							</div>

							{!canViewStrategyComparison && (
								<span className="premium-pill">Premium</span>
							)}
						</div>
						{expandedPremiumSection === "comparison" && (
							<>

								{canViewStrategyComparison ? (
									comparisonCanBeEstimated ? (
										<>
											<div className="strategy-comparison-grid premium-strategy-grid">
												<div
													className={`strategy-comparison-option premium-strategy-option ${snowballIsFaster || snowballHasLowerInterest ? "winner" : ""}`}
												>
													<div className="stategy-option-topline">
														<span>Snowball</span>

														{(snowballIsFaster || snowballHasLowerInterest) && (
															<em>Winner</em>
														)}
													</div>

													<strong>
														{snowballComparisonProjection.estimatedDebtFreeDate}
													</strong>

													<small>
														Interest:{" "}
														{formatCurrency(snowballComparisonProjection.totalInterestPaid)}
													</small>
												</div>

												<div
													className={`strategy-comparison-option premium-strategy-option ${avalancheIsFaster || avalancheHasLowerInterest ? "winner" : ""}`}
												>
													<div className="strategy-option-topline">
														<span>Avalanche</span>

														{(avalancheIsFaster || avalancheHasLowerInterest) && (
															<em>Winner</em>
														)}

													</div>

													<strong>
														{avalancheComparisonProjection.estimatedDebtFreeDate}
													</strong>

													<small>
														Interest:{" "}
														{formatCurrency(avalancheComparisonProjection.totalInterestPaid)}
													</small>
												</div>
											</div>

											<div className="strategy-comparison-callout">
												{fasterStrategy ? (
													<span>
														Faster Payoff:{" "}
														<strong>
															{fasterStrategy === "snowball" ? "Snowball" : "Avalanche"}
														</strong>
													</span>
												) : (
													<span>Both strategies project the same payoff month.</span>
												)}

												{lowerInterestStrategy && (
													<span>
														Lower Interest:{" "}
														<strong>
															{lowerInterestStrategy === "snowball" ? "Snowball" : "Avalanche"}
														</strong>
													</span>
												)}
											</div>

											<div className="strategy-guidance-card premium-strategy-guidance">
												<h4>
													Recommended Strategy:{" "}
													{recommendedStrategy === "avalanche" ? "Avalanche" : "Snowball"}
												</h4>

												<p>
													{recommendedStrategy === "avalanche"
														? `Avalanche currently appears stronger because it could save about ${formatCurrency(projectedInterestSavings)} in projected interest${fasterStrategy === "avalanche" && projectedMonthDifference > 0 ? ` and reduce the payoff timeline by about ${projectedMonthDifference} month${projectedMonthDifference === 1 ? "" : "s"}` : ""}.`
														: "Snowball may currently be easier to sustain because the projected interest difference is relatively small and quicker wins can help maintain momentum."}
												</p>

												<p>
													{recommendedStrategy === "avalanche"
														? "Reducing high APR balances first may improve long-term financial stability."
														: "Use snowball when motivation and visible progress matter more than interest optimization."}
												</p>
											</div>
										</>
									) : (
										<p className="empty-state">
											Strategy comparison is unavailable until your debts can be estimated from the current plan.
										</p>
									)
								) : (
									<div className="premium-locked-preview">
										<strong>Unlock strategy comparison.</strong>
										<p>
											Premium will compare snowball and avalanche side-by-side, including payoff timing and estimated interest.
										</p>

										<button
											type="button"
											className="primary-button upgrade-preview-button"
											onClick={onUpgradeClick}
										>
											View Premium
										</button>
									</div>
								)}
							</>
						)}
					</div>

					<div className="strategy-comparison-card what-if-premium-shell premium-module-shell">
						<div
							className="strategy-comparison-header premium-collapsible-header"
							onClick={() => {
								triggerLightHaptic();

								if (!canViewWhatIfScenarios) {
									onUpgradeClick();
									return;
								}

								setExpandedPremiumSection(
									expandedPremiumSection === "simulation"
										? "forecast"
										: "simulation"
								);
							}}
						>
							<div>
								<h3>What-If Simulation</h3>

								<p>
									See how extra monthly payments could accelerate debt payoff.
								</p>
							</div>

							{!canViewWhatIfScenarios && (
								<span className="premium-pill">
									Premium
								</span>
							)}
						</div>

						{expandedPremiumSection === "simulation" && (
							<>

								{canViewWhatIfScenarios ? (
									<>
										<div className="simulation-strategy-row">
											<button
												type="button"
												className={
													simulationStrategy === "recommended"
														? "simulation-strategy-pill active recommended-active"
														: "simulation-strategy-pill"
												}
												onClick={() => { triggerLightHaptic(); setSimulationStrategy("recommended"); }}
											>
												Recommended
											</button>

											<button
												type="button"
												className={
													simulationStrategy === "snowball"
														? "simulation-strategy-pill active"
														: "simulation-strategy-pill"
												}
												onClick={() => { triggerLightHaptic(); setSimulationStrategy("snowball"); }}
											>
												Snowball
											</button>

											<button
												type="button"
												className={
													simulationStrategy === "avalanche"
														? "simulation-strategy-pill active"
														: "simulation-strategy-pill"
												}
												onClick={() => { triggerLightHaptic(); setSimulationStrategy("avalanche"); }}
											>
												Avalanche
											</button>
										</div>
										<div className="what-if-input-row">
											<label>
												Extra Monthly Payment
											</label>

											<input
												type="number"
												min="0"
												step="1"
												value={
													simulationExtraPayment
												}
												onChange={(event) => setSimulationExtraPayment(event.target.value)}
											/>

											<div className="simulation-quick-actions">
												{[50, 100, 500, 1000].map((amount) => (
													<button
														key={amount}
														type="button"
														className="simulation-quick-chip"
														onClick={() => {
															triggerLightHaptic();
															setSimulationExtraPayment(amount.toString());
														}}
													>
														+${amount}
													</button>
												))}

											</div>
										</div>

										{simulationCanBeEstimated ? (
											<>
												<div className="premium-what-if-result-stack">
													<div className="strategy-comparison-option premium-what-if-result-card">
														<div className="premium-what-if-glow" />

														<span className="premium-what-if-date-label">
															New Debt-Free Date
														</span>

														<strong className="premium-what-if-date">
															{
																simulatedSnowballProjection.estimatedDebtFreeDate
															}
														</strong>

														{simulatedMonthsSaved > 0 && (
															<>
																<div className="premium-what-if-months-saved">
																	{simulatedMonthsSaved} month{simulatedMonthsSaved === 1 ? "" : "s"} earlier
																</div>
																<div className="premium-what-if-days-saved">
																	Estimated {simulatedDaysSaved} days faster
																</div>
															</>
														)}
													</div>
													{parsedSimulationExtraPayment > 0 && (
														<>
															<div className="premium-what-if-savings-row">
																<span className="premium-what-if-savings-label">
																	Projected Interest saved:
																</span>

																<strong className="premium-what-if-savings-value">
																	{formatCurrency(simulatedInterestSaved)}
																</strong>
															</div>

															<div className="what-if-guidance premium-what-if-guidance">
																<p>
																	{parsedSimulationExtraPayment >= 100
																		? `An extra ${formatCurrency(parsedSimulationExtraPayment)}/month could meaningfully accelerate debt payoff and reduce long-term interest pressure.`
																		: "Smaller extra payments still improve payoff momentum over time."}
																</p>

																<p className="premium-ai-insight">
																	{effectiveSimulationStrategy === "avalanche"
																		? "Your highest APR debt is currently creating the most long-term interest pressure."
																		: "Faster small wins may improve motivation and payment consistency."}
																</p>

																{remainingSnowballExtra < 100 && (
																	<p>
																		Current projections still show tighter-than-recommended cash reserves during upcoming cycles.
																	</p>
																)}
															</div>
														</>
													)}
												</div>

												{parsedSimulationExtraPayment <= 0 && (
													<p className="empty-state">
														Enter an extra monthly payment to simulate payoff acceleration.
													</p>
												)}

												{simulationTargetDebt && (
													<div className="simulation-target-card premium-simulation-card">
														<div className="simulation-target-header">
															<div className="simulation-target-heading">
																Apply extra to:
															</div>

															<span className="simulation-strategy-chip">
																{effectiveSimulationStrategy === "avalanche" ? "Highest APR" : "Smallest Balance"}
															</span>
														</div>

														<div className="simulation-allocation-list">
															{simulationExtraAllocationPlan.map((item) => (
																<div
																	key={item.debtId}
																	className="simulation-allocation-item"
																>
																	<div>
																		<div className="simulation-target-name">
																			{item.debtName}
																		</div>

																		<div className="simulation-target-meta">
																			{item.isPaidOff
																				? "Paid off by this extra payment"
																				: `${formatCurrency(item.remainingBalanceAfterPayment)} remaining after payment`}
																		</div>
																	</div>

																	<div className="simulation-extra-payment">
																		+{formatCurrency(item.amount)}
																	</div>
																</div>
															))}
														</div>

														<p className="simulation-target-reason">
															{effectiveSimulationStrategy === "avalanche"
																? "Highest APR balances are prioritized first to reduce long-term interest costs faster."
																: "Smallest balances are prioritized first to create faster visible progress."}
														</p>
													</div>
												)}

											</>
										) : (
											<p className="empty-state">
												Simulation unavailable until payoff projections can be estimated.
											</p>
										)}
									</>
								) : (
									<div className="premium-locked-preview">
										<strong>
											Unlock what-if scenarios
										</strong>

										<p>
											Premium simulations show how extra monthly payments could reduce payoff time and estimated interest.
										</p>

										<button
											type="button"
											className="primary-button upgrade-preview-button"
											onClick={() => { triggerLightHaptic(); onUpgradeClick(); }}
										>
											View Premium
										</button>
									</div>
								)}
							</>
						)}
					</div>

					<div className="strategy-comparison-card premium-forecast-section premium-module-shell">
						<div className="premium-forecast-orb" />
						<div
							className="strategy-comparison-header premium-collapsible-header"
							onClick={() => {
								triggerLightHaptic();

								if (!canViewForecasting) {
									onUpgradeClick();
									return;
								}

								setExpandedPremiumSection(
									expandedPremiumSection === "forecast"
										? "insights"
										: "forecast"
								);
							}}
						>
							<div>
								<h3>Forecast</h3>
								<p>See upcoming financial pressure, recovery timing, and recommended actions before problems compound.</p>
							</div>

							{!canViewForecasting && (
								<span className="premium-pill">
									Premium
								</span>
							)}
						</div>

						{expandedPremiumSection === "forecast" && (
							<>

								{canViewForecasting ? (
									<div className="forecast-list">
										<div className="forecast-summary-strip">
											<div className="forecast-summary-label">
												3-Month Outlook
											</div>

											<div className="forecast-summary-grid">
												<div className="forecast-summary-item">
													<span>Cushion Trend</span>

													<strong>+{formatCurrency(forecastMonths[forecastMonths.length - 1].projectedSafeCash - forecastMonths[0].projectedSafeCash)}</strong>
												</div>

												<div className="forecast-summary-item">
													<span>Debt Reduction</span>
													<strong>-{formatCurrency(totalDebtBalance - forecastMonths[forecastMonths.length - 1].projectedDebtBalance)}</strong>
												</div>
											</div>

											<div className="forecast-summary-status">
												{forecastMonths.some((m) => m.status === "recovery")
													? "Cash recovery required in upcoming cycles"
													: forecastMonths.some((m) => m.status === "pressure")
													? "Elevated cash pressure projected ahead"
													: forecastMonths.some((m) => m.status === "tight")
													? "Cash flow may be tight in upcoming cycles"
													: "Healthy payoff momentum projected"}
											</div>
										</div>
										<div className="forecast-status-bars">
											{forecastMonths.map((month) => (
												<div key={month.monthLabel} className="forecast-status-bar-item">
													<span className="forecast-status-bar-month">{month.monthLabel}</span>
													<div className="forecast-status-bar-track">
														<div
															className={`forecast-status-bar-fill forecast-status-bar-fill-${month.status}`}
															style={{ width: `${Math.min(100, Math.max(0, (month.projectedSafeCash / 400) * 100))}%` }}
														/>
													</div>
													<span className={`forecast-status-bar-label forecast-status-bar-label-${month.status}`}>
														{month.status === "stable" ? "Stable" : month.status === "tight" ? "Tight" : month.status === "pressure" ? "Pressure" : "Critical"}
													</span>
												</div>
											))}
										</div>

										{forecastMonths.map((month, index) => (
											<div
												key={month.monthLabel}
												className={`forecast-card forecast-card-${month.status} ${index === 0 ? "forecast-card-featured" : ""}`}
											>
												<div className={`forecast-card-header forecast-${month.status}`}>
													<strong>
														{month.monthLabel}
													</strong>

													<span
														className={`forecast-status ${month.status}`}
													>
														{month.status === "stable"
															? "Healthy Outlook"
															: month.status === "tight"
																? "Cash Tightness"
																: month.status === "pressure"
																	? "High Risk"
																	: "Critical Pressure"}
													</span>
												</div>

												<div className="forecast-metrics">
													<div>
														<span>
															Projected Cushion
														</span>

														<strong>
															{formatCurrency(month.projectedSafeCash)}
														</strong>
													</div>

													<div>
														<span>
															Debt Balance
														</span>

														<strong>
															{formatCurrency(month.projectedDebtBalance)}
														</strong>
													</div>
												</div>

												<div className={`forecast-mood forecast-mood-${month.status}`}>
													{month.status === "stable"
														? "You are projected to maintain a safe financial buffer."
														: month.status === "tight"
															? "This cycle may require tighter spending control."
															: month.status === "pressure"
																? "Debt and expense pressure are increasing noticeably."
																: "Immediate spending adjustments are strongly recommended."}
												</div>

												<div className="forecast-intelligence">
													<div className="forecast-intelligence-label">
														Recommended Action
													</div>

													<p className="forecast-action">
														{month.recommendedAction}
													</p>
												</div>

												{month.status !== "stable" && month.riskDrivers.length > 0 && (
													<div className="forecast-drivers">
														<h5>
															Pressure Drivers
														</h5>

														<ul>
															{month.riskDrivers.map((driver) => <li key={driver}>{driver}</li>)}
														</ul>
													</div>
												)}

												{month.recoveryMonth && month.status !== "stable" && (
													<p className="forecast-recovery">
														Safer cash flow expected by{" "}
														<strong>
															{month.recoveryMonth}
														</strong>
													</p>
												)}

												{month.recoveryTrend && month.status !== "stable" && (
													<p className="forecast-recovery">
														{month.recoveryTrend}
													</p>
												)}

												{month.status !== "stable" && month.reliefPoint && (
													<div className="forecast-relief">
														<div className="forecast-relief-label">
															Upcoming Relief
														</div>
														<p>
															{month.reliefPoint}
														</p>
													</div>
												)}
											</div>
										))}
									</div>
								) : (
									<div className="premium-locked-preview">
										<strong>
											Unlock forecasting
										</strong>

										<p>
											Premium forecasting explains upcoming cash pressure, risk drivers, recovery timing, and future payoff relief.
										</p>

										<button
											type="button"
											className="primary-button upgrade-preview-button"
											onClick={onUpgradeClick}
										>
											View Premium
										</button>
									</div>
								)}
							</>
						)}
					</div>

					<div className="debt-group">
						<button
							type="button"
							className="section-collapse-button payoff-order-toggle"
							onClick={() => { triggerLightHaptic(); setShowPayoffOrder((current) => !current); }}
						>
							<div className="section-collapse-left">
								<div>
									<h2>Payoff Order</h2>
									<p className="section-collapse-subtitle">Debts ranked by your chosen strategy.</p>
								</div>
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
									<div
										key={debt.id}
										className={`saved-item debt-list-item payoff-order-item ${index === 0 ? "payoff-order-focus" : ""}`}
									>
										<div className="payoff-order-rank">
											#{index + 1}
										</div>

										<div className="saved-item-left payoff-order-main">
											<div className="saved-title">
												{debt.name}
											</div>

											<div className="payoff-order-meta-row">
												<span>Min {formatCurrency(debt.minimumPayment)}</span>

												{debt.apr > 0 && (
													<span>APR {debt.apr}%</span>
												)}
											</div>
										</div>

										<div className="saved-item-right payoff-order-balance">
											<strong className="saved-amount">
												{formatCurrency(debt.displayBalance ?? debt.balance)}
											</strong>
										</div>
									</div>
								))}

								{payoffOrder.length > payoffOrderVisibleCount && (
									<div className="load-more-actions">
										<button
											type="button"
											className="load-more-button"
											onClick={() => {
												triggerLightHaptic();
												setPayoffOrderVisibleCount((current) =>
													current + payoffOrderPageSize
												);
											}}
										>
											Load More
										</button>
									</div>
								)}
							</>
						)}
					</div>
					</div>{/* end payoff-detail-col */}
				</div>
			)}
		</section>
	);
}
