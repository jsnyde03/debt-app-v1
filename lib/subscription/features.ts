export type PremiumFeature =
    | "forecasting"
    | "strategy_comparison"
    | "interest_savings"
    | "what_if_scenarios";

export const premiumFeatureLabels: Record<PremiumFeature, string> = {
    forecasting: "Forecasting",
    strategy_comparison: "Strategy Comparison",
    interest_savings: "Interest Savings",
    what_if_scenarios: "What-If Scenarios",
};