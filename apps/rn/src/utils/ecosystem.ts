import { Linking } from 'react-native';

/** The Financial Freedom app's custom URL scheme (its app.json `scheme: "ffp"`) — opens the app
 *  directly when it's installed on the device. */
const FREEDOM_SCHEME_URL = 'ffp://';

/** App Store fallback when Financial Freedom isn't installed — the real product page (Jason-confirmed
 *  2026-07-24). An https App Store link opens the App Store app directly on iOS. */
const FREEDOM_STORE_URL = 'https://apps.apple.com/us/app/freedom-date-fire-planner/id6789297671';

/**
 * 3.5.7.7 — **this app's own App Store page** (🎯 Jason 2026-08-17), for the marketing embed's one CTA.
 *
 * ⚠️ THE LISTING NAME IS NOT THE APP'S NAME. The store says **"Paycheck Debt Planner"**; the product
 * calls itself **"Debt Planner"** on the home screen and in every string it owns. The divergence is
 * deliberate and stays — which is exactly why the CTA's label names the **destination** ("Get it on the
 * App Store") rather than either name ([D34], 🎯 2026-08-17). Nothing has to reconcile them.
 *
 * ⛔ It lives here rather than inline in the dock because a store URL is the kind of fact that gets
 * pasted into a second place the day someone needs it in a footer.
 */
export const APP_STORE_URL = 'https://apps.apple.com/us/app/paycheck-debt-planner/id6773201250';

/**
 * Graduation handoff (2.4.8) — open Financial Freedom if installed, else its App Store page. This is the
 * debt app's first cross-app link and the ecosystem on-ramp: a convenient next step once debt-free,
 * never required. `canOpenURL` is deliberately NOT used (a custom scheme needs `LSApplicationQueriesSchemes`
 * on iOS or it always reports false) — attempting `openURL` and catching the reject is the no-native-config
 * path. The real device handoff is verified in Phase 6 (browser can't exercise a URL scheme).
 */
export async function openFinancialFreedom(): Promise<void> {
  try {
    await Linking.openURL(FREEDOM_SCHEME_URL);
  } catch {
    try {
      await Linking.openURL(FREEDOM_STORE_URL);
    } catch {
      // Both failed (no handler / offline) — nothing actionable; leave the user where they are.
    }
  }
}
