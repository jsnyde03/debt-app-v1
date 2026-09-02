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
  /** ⛔ C3-12 — returns whether the write LANDED; `lastKey` is stamped only when it did. */
  write: (snapshot: WidgetSnapshot) => boolean = writeWidgetSnapshot,
  now: () => number = () => Date.now(),
  /**
   * ⛔ [S1.13.7.11 · pass-6 `C3-12`] — injectable for the same reason `write` and `now` are: the retry
   * this finding is about is only observable ACROSS syncs, and a 1s debounce is not something a
   * synchronous unit test can wait out. The default is the production policy and no caller passes it.
   */
  debounceMs: number = SYNC_DEBOUNCE_MS,
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
      // ⛔ [S1.13.7.11 · pass-6 C3-12] — STAMP ONLY ON SUCCESS. This used to stamp first and then write,
      // so one failed App-Group write froze the widget and Siri on the previous figures for the rest of
      // the session: every later sync computed the same material payload, matched `lastKey` and returned
      // before writing. The user saw a debt total silently out of date on the one surface they never open
      // the app to check. A miss now simply leaves the key unstamped, so the next sync retries.
      if (write(snapshot)) lastKey = key;
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
    }, debounceMs);
  });
}
