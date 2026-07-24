import { Linking } from 'react-native';

/** The Financial Freedom app's custom URL scheme (its app.json `scheme: "ffp"`) — opens the app
 *  directly when it's installed on the device. */
const FREEDOM_SCHEME_URL = 'ffp://';

/** App Store fallback when Financial Freedom isn't installed. [BUILD] the exact product URL is owned by
 *  Jason (no numeric App Store ID lives in either repo) — this search URL is a safe, non-broken interim
 *  until it's swapped for the real product link. */
const FREEDOM_STORE_URL = 'https://apps.apple.com/search?term=Financial%20Freedom%20Planner';

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
