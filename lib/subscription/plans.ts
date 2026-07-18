export type SubscriptionPlan =
    | "free"
    | "premium"
    | "premium_plus";

export const DEFAULT_PLAN: SubscriptionPlan = "free";

// Premium+ is a real, gateable tier in code (see hasFeatureAccess) but is NOT
// sold yet — the 3-tier product ships in v1.7. Until then, ALL user-facing
// Premium+ messaging must stay hidden (e.g. the Pay Cycle History "upgrade to
// Premium+ for your full history" upsell) so we never reference a tier a user
// can't buy. Flip to true when v1.7 ships the tier, and the messaging returns.
export const PREMIUM_PLUS_AVAILABLE = false;
