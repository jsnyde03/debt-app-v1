/**
 * Web stub for the native RevenueCat client. On web (and the tsx/e2e harness) there's no IAP SDK, so
 * `initPurchases` is a no-op: the facade stays detached, `getPurchasesClient()` returns null, and the
 * paywall renders its static-price fallback. Mirrors the `scan.web.ts` platform-split pattern.
 *
 * Re-export note: this file must expose the SAME public surface as `purchasesClient.ts` — currently
 * just `initPurchases` — so a web/native import resolves identically (see the platform-split re-export
 * lesson). Add any new native-client export here too.
 */
export function initPurchases(): void {
  // no-op on web
}
