// PremiumFeature is the set of independently gated capabilities -
// hasFeatureAccess(plan, feature) is the only place that should ever
// decide free vs. premium for one of these. Don't add a value here
// unless something actually calls hasFeatureAccess with it.
export type PremiumFeature =
    | "forecasting"
    | "strategy_comparison"
    | "what_if_scenarios"
    | "smart_insights"
    | "notifications";

export const premiumFeatureLabels: Record<PremiumFeature, string> = {
    forecasting: "Smart Forecasting",
    strategy_comparison: "Payoff Guidance",
    what_if_scenarios: "What Changes If...",
    smart_insights: "Adaptive Recommendations",
    notifications: "Local Reminders",
};

// Marketing copy for the upgrade screen. "Interest Reduction Insights"
// describes a real benefit (Strategy Comparison shows the interest
// difference between snowball/avalanche), but it has no independent
// gate of its own - it's delivered as part of strategy_comparison, not
// a separately checked PremiumFeature. Kept separate from
// premiumFeatureLabels so the paywall's marketing list and the actual
// gating enum can't silently drift apart again.
export const premiumMarketingHighlights: string[] = [
    premiumFeatureLabels.forecasting,
    premiumFeatureLabels.strategy_comparison,
    "Interest Reduction Insights",
    premiumFeatureLabels.what_if_scenarios,
    premiumFeatureLabels.smart_insights,
];
