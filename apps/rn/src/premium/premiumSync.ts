import { useEffect } from 'react';

import { appStore } from '@/store/appStore';
import { useAppStore } from '@/store/useAppStore';

import { getPurchasesClient, isLifetimeActive, isPremiumActive, type CustomerInfoLike } from './purchases';
import { initPurchases } from './purchasesClient';

/**
 * Drives the store's `subscriptionPlan` (+ the transient `premiumIsLifetime`) from RevenueCat's
 * `premium` entitlement. Call once at the app root. On web / local dev the client stays detached (see
 * `purchasesClient`), so this is inert and the store's plan — including the dev "Simulate Premium"
 * toggle — stands untouched.
 *
 * A2: the sync WAITS for `isHydrated` before applying, because `hydrate` replaces the whole store
 * object (incl. `subscriptionPlan`) — applying earlier could be clobbered back to the persisted `free`.
 * A failed fetch never *downgrades* (RevenueCat returns its offline cache on no network); the listener
 * keeps the store in sync across renewal/expiry/restore.
 */
export function useInitPremium(): void {
  const isHydrated = useAppStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return; // apply entitlement only after hydrate, so it can't be stomped (A2)
    initPurchases();
    const client = getPurchasesClient();
    if (!client) return; // web / dev / no SDK → the current store plan stands

    let cancelled = false;
    const apply = (info: CustomerInfoLike | null) => {
      const s = appStore.getState();
      s.setSubscriptionPlan(isPremiumActive(info) ? 'premium' : 'free');
      s.setPremiumIsLifetime(isLifetimeActive(info));
    };

    void client
      .getCustomerInfo()
      .then((info) => {
        if (!cancelled) apply(info);
      })
      .catch(() => {
        /* offline / error → leave the current (possibly persisted) plan; never downgrade on a failure */
      });

    const unsubscribe = client.addListener((info) => {
      if (!cancelled) apply(info);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isHydrated]);
}
