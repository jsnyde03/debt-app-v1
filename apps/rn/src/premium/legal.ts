/**
 * Legal/support URLs surfaced on the paywall (Apple Guideline 3.1.2 requires tappable Terms of Use +
 * Privacy Policy links on the purchase screen) and the More tab. Single source of truth so the two
 * never drift. These are the URLs the live v1.6 app already uses / that are configured in App Store
 * Connect.
 *
 * - Terms of Use = Apple's **Standard EULA** — valid as long as App Store Connect → App Information →
 *   License Agreement is "Standard Apple License Agreement".
 * - Privacy Policy + Support are the developer's own hosted pages (also the ones in App Store Connect).
 */
export const TERMS_OF_USE_URL =
  'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export const PRIVACY_POLICY_URL = 'https://jsnyde03.github.io/debt-planner-site/privacy.html';

export const SUPPORT_URL = 'https://jsnyde03.github.io/debt-planner-site/support.html';

/** Apple's manage-subscriptions deep link (used by the More tab). */
export const MANAGE_SUBSCRIPTION_URL = 'https://apps.apple.com/account/subscriptions';
