import type { SubscriptionPlan } from '@/data/models';

/**
 * 3.7.A5 — what KIND of premium is active, as one rule instead of a ternary copied onto every surface.
 *
 * The pair (`subscriptionPlan`, `premiumIsLifetime`) has always had three meaningful states, but only
 * two were ever rendered. `premiumIsLifetime` is transient, defaults to `false`, and is set only from
 * RevenueCat's entitlement callback — so "not answered yet" was indistinguishable from "answered: this
 * is a subscription". On a cold OFFLINE launch `getCustomerInfo()` rejects into a catch that
 * deliberately does not downgrade, which means it is never answered *for the whole session*: a Lifetime
 * owner got subscription wording and a "Manage Subscription" link into an empty App Store page.
 *
 * The honest third state is `unresolved` — premium is active (the persisted plan says so and we must
 * not downgrade), but which kind is unknown. It claims neither, and it offers no manage link, because
 * a dead link is worse than a missing one.
 */
export type PremiumKind = 'none' | 'unresolved' | 'lifetime' | 'subscription';

export function premiumKind(input: {
  plan: SubscriptionPlan;
  premiumResolved: boolean;
  premiumIsLifetime: boolean;
}): PremiumKind {
  if (input.plan !== 'premium') return 'none';
  if (!input.premiumResolved) return 'unresolved';
  return input.premiumIsLifetime ? 'lifetime' : 'subscription';
}

/**
 * Is there a real App Store subscription to manage? ONLY a resolved, non-Lifetime premium. A free user,
 * a Lifetime owner (a non-consumable — the subscriptions page would be empty, R2.3) and an unresolved
 * entitlement all get no link.
 */
export function canManageSubscription(kind: PremiumKind): boolean {
  return kind === 'subscription';
}
