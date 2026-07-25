import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

import {
  setPurchasesClient,
  type CustomerInfoLike,
  type PackageLike,
  type PurchaseResult,
} from './purchases';

/**
 * Wires the real RevenueCat backend into the purchases facade. Kept separate from `purchases.ts`
 * (which stays import-light/testable) because importing `react-native-purchases` pulls in a native
 * TurboModule that can't load in the tsx/web environment — the same native-vs-pure split as
 * `scan.ts`/`scan.web.ts`. The `.web.ts` sibling stubs `initPurchases` so web/e2e never touch the SDK.
 *
 * Key handling: `appl_…` is the RevenueCat *public* Apple SDK key (not a secret — safe in the bundle,
 * same as the live Capacitor app hardcodes). It's read from `EXPO_PUBLIC_RC_IOS_KEY` when set, else
 * falls back to the known Debt project key, so a real build always configures even before the RN app
 * has its own CI env wired. `__DEV__` builds stay DETACHED on purpose, so the dev "Simulate Premium"
 * toggle — not a real sandbox entitlement — remains authoritative during development.
 */

// The live Debt RevenueCat project's public Apple SDK key (from the Capacitor app's revenueCat.ts).
const DEBT_RC_IOS_KEY = 'appl_XUWODZnbbJFPbdMTgBTyKNAGGyp';

let configured = false;

export function initPurchases(): void {
  if (configured) return;
  // Dev builds use the Simulate Premium toggle, never the real SDK, so entitlement sync can't stomp it.
  if (__DEV__) return;
  // IAP is iOS-only for now (Android gets its own first-class pass at v1.8). No SDK on web.
  if (Platform.OS !== 'ios') return;

  const apiKey = process.env.EXPO_PUBLIC_RC_IOS_KEY ?? DEBT_RC_IOS_KEY;

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
  configured = true;

  setPurchasesClient({
    getCustomerInfo: () => Purchases.getCustomerInfo(),
    async getDefaultPackages(): Promise<PackageLike[]> {
      const offerings = await Purchases.getOfferings();
      // The current offering carries the Monthly/Annual/Lifetime packages (§4c of the setup doc).
      return offerings.current?.availablePackages ?? [];
    },
    async purchase(pkg: PackageLike): Promise<PurchaseResult> {
      try {
        // PackageLike is a structural subset of the SDK's PurchasesPackage; the object handed to
        // purchase() always originates from getDefaultPackages(), so it IS a real package.
        const { customerInfo } = await Purchases.purchasePackage(
          pkg as unknown as Parameters<typeof Purchases.purchasePackage>[0],
        );
        return { customerInfo, userCancelled: false };
      } catch (error: unknown) {
        // A user backing out of Apple's sheet is the expected non-error path, flagged by the SDK.
        if (error && typeof error === 'object' && (error as { userCancelled?: boolean }).userCancelled) {
          return { customerInfo: null, userCancelled: true };
        }
        throw error;
      }
    },
    restore: () => Purchases.restorePurchases(),
    addListener(listener: (info: CustomerInfoLike) => void): () => void {
      Purchases.addCustomerInfoUpdateListener(listener);
      return () => Purchases.removeCustomerInfoUpdateListener(listener);
    },
  });
}
