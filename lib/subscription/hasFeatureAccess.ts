import type { PremiumFeature } from "./features";
import type { SubscriptionPlan } from "./plans";

export function hasFeatureAccess(plan: SubscriptionPlan, feature: PremiumFeature) {
    if (plan === "premium") {
        return true;
    }

    switch (feature) {
        case "forecasting":
        case "strategy_comparison":
        case "what_if_scenarios":
        case "smart_insights":
            return false;

        default:
            return false;
    }
}