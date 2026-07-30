import { appStore } from '@/store/appStore';
import { isSandboxStore } from '@/store/sandboxStore';
import type { DebtStoreInstance } from '@/store/store';
import { reportError } from '@/utils/reportError';

import { buildWidgetSnapshot, type WidgetSnapshot } from './snapshot';
import { writeWidgetSnapshot } from './widgetStorage';

/**
 * Mirrors the live debt summary to the iOS widget's App-Group container on every committed data change.
 *
 * Two guards keep us inside WidgetKit's daily reload budget: a debounce (coalesces rapid edits) and a
 * change-gate on the material payload (skips the write when nothing the user would see moved). The
 * timestamp is excluded from the gate so a no-op edit doesn't burn a reload for a new clock read.
 *
 * Idempotent per store (safe to call twice). `write`/`now` are injectable for tests; the default
 * `write` is the platform-split writer (native → ExtensionStorage, web/Android → no-op). `react-native`
 * is intentionally kept out so this stays node-testable — platform gating lives in `writeWidgetSnapshot`.
 */

const SYNC_DEBOUNCE_MS = 1000;
const started = new WeakSet<object>();

export function startWidgetSync(
  store: DebtStoreInstance = appStore,
  write: (snapshot: WidgetSnapshot) => void = writeWidgetSnapshot,
  now: () => number = () => Date.now(),
): void {
  // 3.5.0.6 — the tutorial's scripted money must never reach the user's Home Screen widget.
  if (isSandboxStore(store)) {
    reportError(new Error('startWidgetSync called with a SANDBOX store — refusing'), { seam: 'widgetSync' });
    return;
  }
  if (started.has(store)) return;
  started.add(store);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastKey: string | null = null;

  const sync = () => {
    // Guard the whole body: this runs from a debounced setTimeout + the store subscription, where an
    // unhandled throw (e.g. a selector error) would escape into the RN global handler.
    try {
      const snapshot = buildWidgetSnapshot(store.getState().store, now());
      // Change-gate on everything but the timestamp.
      const { updatedAt: _omit, ...material } = snapshot;
      const key = JSON.stringify(material);
      if (key === lastKey) return;
      lastKey = key;
      write(snapshot);
    } catch (error) {
      reportError(error, { subsystem: 'widget', operation: 'sync' });
    }
  };

  // Initial mirror at launch (the store is hydrated by the time persistence bootstraps and calls this).
  sync();

  store.subscribe((state, prev) => {
    if (state.store === prev.store) return; // ignore isHydrated/isSaving lifecycle toggles
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      sync();
    }, SYNC_DEBOUNCE_MS);
  });
}
