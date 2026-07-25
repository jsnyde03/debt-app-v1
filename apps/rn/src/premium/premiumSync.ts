import { useEffect } from 'react';

import { appStore } from '@/store/appStore';

import { getPurchasesClient, isPremiumActive } from './purchases';
import { initPurchases } from './purchasesClient';

/**
 * Drives the store's `subscriptionPlan` from RevenueCat's `premium` entitlement. Call once at the app
 * root. On web / local dev the client stays detached (see `purchasesClient`), so this is inert and the
 * store's plan — including the dev "Simulate Premium" toggle — stands untouched.
 *
 * A failed fetch never *downgrades*: we only write a plan on a definitive customerInfo result
 * (RevenueCat returns its offline cache when there's no network, so a real paying user keeps premium),
 * and the listener keeps the store in sync across renewal/expiry/restore.
 */
export function useInitPremium(): void {
  useEffect(() => {
    initPurchases();
    const client = getPurchasesClient();
    if (!client) return; // web / dev / no SDK → the current store plan stands

    let cancelled = false;
    const apply = (info: Parameters<typeof isPremiumActive>[0]) =>
      appStore.getState().setSubscriptionPlan(isPremiumActive(info) ? 'premium' : 'free');

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
  }, []);
}
