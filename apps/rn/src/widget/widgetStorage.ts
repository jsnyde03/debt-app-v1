import type { WidgetSnapshot } from './snapshot';

// Shared identifiers live in the dedicated `./widgetKeys` module — NOT defined here — so the `.native`
// variant can import them without `./widgetStorage` resolving back to itself on device (the
// self-referential circular re-export that stack-overflows; see widgetKeys.ts).
export { WIDGET_APP_GROUP, WIDGET_KIND, WIDGET_SNAPSHOT_KEY } from './widgetKeys';

/**
 * No-op on web / non-iOS (no App Group, no WidgetKit). The `.native` variant writes the snapshot to the
 * App-Group `UserDefaults` suite and asks WidgetKit to reload the timeline.
 */
/**
 * ⛔ C3-12 — `true`, not `false`: there is no widget on this platform, so "the snapshot is as current as it
 * can be" is the honest answer. Returning `false` would make `widgetSync` re-write on every store change
 * forever, which is a busy-loop rather than a retry.
 */
export function writeWidgetSnapshot(_snapshot: WidgetSnapshot): boolean {
  return true;
}
