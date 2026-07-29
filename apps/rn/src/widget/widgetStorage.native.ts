import type { ExtensionStorage as ExtensionStorageType } from '@bacons/apple-targets';
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
// ENG-2: `@bacons/apple-targets` dereferences the global `expo` object at IMPORT — so it's pulled in via a
// lazy require (not a top-level import), matching the codebase's "never touch native at module scope" rule.
// Guards against an accidental web-chunk load of this `.native` file throwing at import. See
// feedback_native_tsx_leaks_to_web.
let appleTargets: typeof import('@bacons/apple-targets') | null = null;
function targets(): typeof import('@bacons/apple-targets') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate lazy native import (see above)
  return (appleTargets ??= require('@bacons/apple-targets'));
}

let storage: ExtensionStorageType | null = null;

function getStorage(): ExtensionStorageType | null {
  if (storage) return storage;
  if (Platform.OS !== 'ios') return null;
  try {
    storage = new (targets().ExtensionStorage)(WIDGET_APP_GROUP);
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
    targets().ExtensionStorage.reloadWidget(WIDGET_KIND);
  } catch (error) {
    // A widget write (incl. the lazy construct) must NEVER affect the app — swallow + report.
    reportError(error, { subsystem: 'widget', operation: 'write' });
  }
}
