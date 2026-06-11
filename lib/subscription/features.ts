export type PremiumFeature =
    | "forecasting"
    | "strategy_comparison"
    | "interest_savings"
    | "what_if_scenarios"
    | "smart_insights";

export const premiumFeatureLabels: Record<PremiumFeature, string> = {
    forecasting: "Smart Forecasting",
    strategy_comparison: "Payoff Guidance",
    interest_savings: "Interest Reduction Insights",
    what_if_scenarios: "What Changes If...",
    smart_insights: "Adaptive Recommendations",
};