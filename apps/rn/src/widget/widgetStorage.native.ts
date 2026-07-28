import { ExtensionStorage } from '@bacons/apple-targets';
import { Platform } from 'react-native';

import { reportError } from '@/utils/reportError';

import type { WidgetSnapshot } from './snapshot';
// Import the ids from the dedicated `./widgetKeys` — NOT `./widgetStorage`, which on device resolves
// back to THIS file (`.native` wins), making the binding a circular self-re-export that stack-overflows
// on first read (the empty-widget root cause). See widgetKeys.ts.
import { WIDGET_APP_GROUP, WIDGET_KIND, WIDGET_SNAPSHOT_KEY } from './widgetKeys';

/**
 * Native widget bridge (iOS only). `ExtensionStorage` (from `@bacons/apple-targets`) writes the
 * snapshot into the App-Group `UserDefaults` suite as JSON under `WIDGET_SNAPSHOT_KEY`; the Swift
 * widget decodes exactly that. `reloadWidget(kind)` nudges WidgetKit to refresh the timeline. WidgetKit
 * is iOS-only — on Android (a later track) `storage` stays null and this no-ops; the base `.ts` sibling
 * covers web. Re-exports the shared ids so importers get them from either variant (the platform-split
 * re-export gap — see feedback_platform_split_reexport_gap).
 */
export { WIDGET_APP_GROUP, WIDGET_KIND, WIDGET_SNAPSHOT_KEY } from './widgetKeys';

// Constructed LAZILY (not at module load) so a native-constructor throw can't crash the import graph at
// launch. Construct inside try/catch and NEVER cache a `null` — a transient failure retries next call
// instead of poisoning the write for the whole session. `null` = unavailable.
let storage: ExtensionStorage | null = null;

function getStorage(): ExtensionStorage | null {
  if (storage) return storage;
  if (Platform.OS !== 'ios') return null;
  try {
    storage = new ExtensionStorage(WIDGET_APP_GROUP);
  } catch (error) {
    reportError(error, { subsystem: 'widget', operation: 'construct' });
    storage = null; // retry next call, don't cache the failure
  }
  return storage;
}

export function writeWidgetSnapshot(snapshot: WidgetSnapshot): void {
  try {
    const store = getStorage();
    if (!store) return;
    // `set` routes a plain object through `setObject` → JSONSerialization into the shared suite.
    store.set(WIDGET_SNAPSHOT_KEY, snapshot as unknown as Record<string, string | number>);
    ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch (error) {
    // A widget write (incl. the lazy construct) must NEVER affect the app — swallow + report.
    reportError(error, { subsystem: 'widget', operation: 'write' });
  }
}
