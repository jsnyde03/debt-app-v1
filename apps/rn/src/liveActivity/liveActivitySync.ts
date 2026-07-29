import { appStore } from '@/store/appStore';
import type { DebtStoreInstance } from '@/store/store';
import { reportError } from '@/utils/reportError';

import { liveActivityBridge } from './liveActivityBridge';
import type { LiveActivityBridge } from './liveActivityBridge.types';
import { decideLiveActivityAction } from './paydayActivityContent';

/**
 * Drives the Payday Countdown Live Activity's lifecycle off the live store (3.5.3.3). On each committed
 * change it reconciles "what the store implies" (premium + within the ~3-day window + the Guardian read)
 * against "what's live" via the pure `decideLiveActivityAction`, and applies start/update/end through the
 * platform bridge (native ActivityKit / web no-op). The countdown ticks day-granular; the read refreshes
 * whenever the app runs (no push this version).
 *
 * Same guards as `widgetSync`: a debounce (coalesce rapid edits), a change-gate inside the reconciler
 * (skip a redundant update), and per-store idempotency. Injectable (`store`/`bridge`) + no `react-native`
 * import so it stays node-testable; the reconciliation logic itself is unit-tested in `paydayActivityContent`.
 */
const SYNC_DEBOUNCE_MS = 1000;
const started = new WeakSet<object>();

export function startLiveActivitySync(
  store: DebtStoreInstance = appStore,
  bridge: LiveActivityBridge = liveActivityBridge,
): void {
  if (started.has(store)) return;
  started.add(store);

  // Nothing to manage if the OS/user has Live Activities off (also the web no-op path → early out).
  if (!bridge.areActivitiesEnabled()) return;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let lastKey: string | null = null;

  const evaluate = () => {
    try {
      const action = decideLiveActivityAction(store.getState().store, running, lastKey);
      switch (action.kind) {
        case 'start':
          bridge.start(action.content);
          running = true;
          lastKey = action.key;
          break;
        case 'update':
          bridge.update(action.content);
          lastKey = action.key;
          break;
        case 'end':
          bridge.end();
          running = false;
          lastKey = null;
          break;
        case 'none':
          break;
      }
    } catch (error) {
      reportError(error, { subsystem: 'liveActivity', operation: 'sync' });
    }
  };

  // Reconcile once at launch (catch up to the current window), then on every committed store change.
  evaluate();

  store.subscribe((state, prev) => {
    if (state.store === prev.store) return; // ignore isHydrated/isSaving lifecycle toggles
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      evaluate();
    }, SYNC_DEBOUNCE_MS);
  });
}
