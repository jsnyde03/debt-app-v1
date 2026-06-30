import { premiumPlusOnlyFeatures, type PremiumFeature } from "./features";
import type { SubscriptionPlan } from "./plans";

// Single source of truth for free vs. premium vs. premium+ gating.
// - premium_plus: every feature.
// - premium: every feature EXCEPT the Premium+-exclusive ones.
// - free: nothing.
//
// NOTE (v1.5): premium_plus is a real, gateable tier here, but it is
// not yet purchasable - the RevenueCat product wiring lands in v1.6.
// Gating is correct and forward-compatible now; real buyers can only
// reach premium_plus features once v1.6 ships the product.
export function hasFeatureAccess(plan: SubscriptionPlan, feature: PremiumFeature): boolean {
    if (plan === "premium_plus") {
        return true;
    }

    if (plan === "premium") {
        return !premiumPlusOnlyFeatures.includes(feature);
    }

    return false;
}
