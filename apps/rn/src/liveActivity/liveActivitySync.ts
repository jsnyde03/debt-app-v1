import { appStore } from '@/store/appStore';
import { isSandboxStore } from '@/store/sandboxStore';
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
 * (skip a redundant update), and per-store idempotency. Injectable (`store`/`bridge`/`debounceMs`) + no
 * `react-native` import so it stays node-testable — `liveActivitySync.test.ts` drives it with a stub bridge.
 */
const SYNC_DEBOUNCE_MS = 1000;
const started = new WeakSet<object>();

export function startLiveActivitySync(
  store: DebtStoreInstance = appStore,
  bridge: LiveActivityBridge = liveActivityBridge,
  /** Injectable for the same reason as `widgetSync`'s: a retry is only observable ACROSS syncs. */
  debounceMs: number = SYNC_DEBOUNCE_MS,
): Promise<void> {
  // 3.5.0.6 — a tutorial payday must never start a real Lock Screen Live Activity.
  if (isSandboxStore(store)) {
    reportError(new Error('startLiveActivitySync called with a SANDBOX store — refusing'), { seam: 'liveActivitySync' });
    return Promise.resolve();
  }
  if (started.has(store)) return Promise.resolve();
  started.add(store);

  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let lastKey: string | null = null;

  // ⛔ [.5.4f · pass-7 `C3-5`] — STAMP ONLY WHAT LANDED. `running` and `lastKey` are this manager's belief
  // about the Lock Screen, and they used to be stamped on the ATTEMPT: one refused `start` left `running`
  // true, so the session sent `update` to an activity that never existed; one dropped `update` stamped its
  // key, so the next unchanged read was gated out and the Lock Screen said "Looks clear" over "$2,500 short"
  // until something else moved. `widgetSync` was fixed for exactly this in pass 6 and this twin was not.
  const reconcile = async () => {
    try {
      // ⛔ [.5.4f · `C3-5` adjacent] — asked on EVERY reconcile, not once at launch. It used to gate the
      // subscription itself, so a user who turned Live Activities on mid-session got no countdown until a
      // relaunch. Turning them off ends every activity, so the belief resets with it.
      if (!bridge.areActivitiesEnabled()) {
        running = false;
        lastKey = null;
        return;
      }
      const action = decideLiveActivityAction(store.getState().store, running, lastKey);
      switch (action.kind) {
        case 'start':
          if (await bridge.start(action.content)) {
            running = true;
            lastKey = action.key;
          }
          break;
        case 'update':
          if (await bridge.update(action.content)) {
            lastKey = action.key;
          } else {
            // Nothing live took the update — dismissed, ended by the system, or the bridge threw. Believing
            // it is still running would send every later update to nothing; the next change starts one.
            running = false;
            lastKey = null;
          }
          break;
        case 'end':
          // ⛔ [.5.4f · pass-7 `C3-6`] — a refused `end` keeps `running`, so the next change ends it again
          // rather than leaving pass-3 `D3-2`'s false payload on the Lock Screen with nothing left to end it.
          if (await bridge.end()) {
            running = false;
            lastKey = null;
          }
          break;
        case 'none':
          break;
      }
    } catch (error) {
      reportError(error, { subsystem: 'liveActivity', operation: 'sync' });
    }
  };

  // One reconcile at a time: the bridge is async now, and a change arriving while a `start` is in flight
  // would otherwise read `running === false` and start a second activity. It is re-run once instead.
  let inFlight: Promise<void> | null = null;
  let again = false;
  const evaluate = (): Promise<void> => {
    if (inFlight) {
      again = true;
      return inFlight;
    }
    inFlight = (async () => {
      do {
        again = false;
        await reconcile();
      } while (again);
    })().finally(() => {
      inFlight = null;
    });
    return inFlight;
  };

  store.subscribe((state, prev) => {
    if (state.store === prev.store) return; // ignore isHydrated/isSaving lifecycle toggles
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void evaluate();
    }, debounceMs);
  });

  // Reconcile once at launch (catch up to the current window), then on every committed store change.
  return evaluate();
}
