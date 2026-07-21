import { useAppStore } from '@/store/useAppStore';

import type { PremiumFeature } from './features';
import { hasFeatureAccess } from './hasFeatureAccess';

/** Reactive feature gate — re-renders when the plan changes (e.g. the dev "Simulate Premium" toggle). */
export function useHasFeature(feature: PremiumFeature): boolean {
  const plan = useAppStore((s) => s.store.subscriptionPlan);
  return hasFeatureAccess(plan, feature);
}

/** Convenience for "is the user on the Premium tier" (not tied to a specific feature). */
export function useIsPremium(): boolean {
  return useAppStore((s) => s.store.subscriptionPlan === 'premium');
}
