/**
 * Widget-bridge identifiers (App Group · WidgetKit kind · suite key) in a DEDICATED, NON platform-split
 * module.
 *
 * ⚠️ They MUST live here, NOT in `widgetStorage.ts` — on a native build Metro resolves `./widgetStorage`
 * to `widgetStorage.native.ts` (the `.native` extension wins for EVERY importer, including that file
 * itself). So `widgetStorage.native.ts` importing these from `./widgetStorage` would import them from
 * ITSELF: a circular self-re-export with no real definition → reading `WIDGET_APP_GROUP` recurses and
 * stack-overflows on first read (inside `new ExtensionStorage(...)` at launch), which throws, silently
 * kills the widget write, and leaves the widget empty on device. (Freedom root-caused this 2026-07-16.)
 * A plain constants module has no platform variant, so it can never self-resolve. See
 * `feedback_platform_split_reexport_gap`.
 *
 * MUST match `app.json` ios.entitlements + the Swift widget's App-Group id + kind.
 */
export const WIDGET_APP_GROUP = 'group.com.jasonsnyder.debtplanner';
export const WIDGET_KIND = 'DebtWidget';
export const WIDGET_SNAPSHOT_KEY = 'debtSnapshot';
