import type { SubscriptionPlan } from '@/data/models';

import type { PremiumFeature } from './features';

/**
 * The single gating primitive (one-tier model): Premium unlocks every premium feature; free gets
 * none of them. Kept pure so it can move to `@core` when the portfolio-subscription entitlement is
 * built (2.7). The `feature` arg is retained for call-site clarity and future per-feature nuance.
 */
export function hasFeatureAccess(plan: SubscriptionPlan, _feature: PremiumFeature): boolean {
  return plan === 'premium';
}
