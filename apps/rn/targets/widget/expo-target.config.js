/**
 * WidgetKit target for the Debt-Free-Date widget (3.5.4). `@bacons/apple-targets` links this folder as
 * an Xcode app-extension target during `expo prebuild` (CNG) — the Swift lives here, outside `ios/`.
 *
 * App Group entitlement declared EXPLICITLY below (do NOT remove): the main app + this widget must
 * share the `group.com.jasonsnyder.debtplanner` UserDefaults suite the JS bridge writes to.
 * ⚠️ `@bacons/apple-targets` only applies its App-Group "auto-mirror" when `entitlements` is ALREADY
 * truthy — WITHOUT this key the widget ships with NO App Group entitlement, `UserDefaults(suiteName:)`
 * returns a private empty store on device, and the widget shows its empty state forever (Freedom's
 * 2026-07-15 device bug). Must stay in lock-step with `app.json` ios.entitlements + `DebtProvider.swift`.
 *
 * `colors` generate `Assets.xcassets` colorsets available in Swift as `Color("Name")` — the app's
 * navy/blue + gold brand (mirrors `src/theme/colors.ts`).
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = () => ({
  type: 'widget',
  name: 'DebtWidget', // MUST match WIDGET_KIND in src/widget/widgetKeys.ts (ExtensionStorage.reloadWidget)
  displayName: 'Debt-Free Date',
  // Explicit bundle id (a leading dot appends to the main app id) → deterministic for signing + the
  // Apple-portal App ID registration: com.jasonsnyder.debtplanner.widget
  bundleIdentifier: '.widget',
  // Lock-screen accessory widgets need iOS 16; the Live Activity (3.5.3) batches in at 16.1.
  deploymentTarget: '16.1',
  // ActivityKit is REQUIRED for the Payday Countdown Live Activity (3.5.3) that joins this bundle —
  // `import ActivityKit` in PaydayLiveActivity.swift needs it linked. (SwiftUI/WidgetKit are implicit.)
  frameworks: ['ActivityKit'],
  // REQUIRED — see the header note. Shares the app's suite so the widget can read what JS writes.
  entitlements: {
    'com.apple.security.application-groups': ['group.com.jasonsnyder.debtplanner'],
  },
  colors: {
    WidgetBackground: { light: '#EEF1F6', dark: '#0A0F1E' },
    BrandInk: { light: '#10264F', dark: '#EAF0FA' },
    BrandMuted: { light: '#68758B', dark: '#8496B2' },
    BrandGold: { light: '#DCA01F', dark: '#F7CF5F' },
    BrandBlue: { light: '#2F66EA', dark: '#5B9DFF' },
    BrandSuccess: { light: '#0E8A5F', dark: '#34D399' },
    // The Payday Live Activity's at-risk state dot (3.5.3) — mirrors the app's accent.danger.
    BrandDanger: { light: '#DC2626', dark: '#FB7185' },
    RingTrack: { light: '#E0E6EF', dark: '#22304A' },
    CardBackground: { light: '#FFFFFF', dark: '#121A2E' },
  },
});
