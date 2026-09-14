import { appStore } from '@/store/appStore';
import { reportError } from '@/utils/reportError';

import { pendingActionBridge } from './pendingActionBridge';
import type { PendingActionBridge } from './pendingActionBridge.types';
import { applyPendingActions, parsePendingActions, type PendingAction, type PendingActionApi } from './pendingActions';

/**
 * Drain queued AppIntent actions from the App Group and apply them to the store — called at launch and on
 * return-to-foreground (3.5.3.5). Read → parse → apply → clear, fully guarded so a native/store hiccup can
 * never crash the app. The applied actions flow through the normal store subscription, so the widget +
 * Live Activity refresh for free. Returns the applied actions (for tests / a future Undo). No-op on web
 * (the bridge reads null → nothing to do). `bridge`/`api` are injectable for tests.
 *
 * ⛔ [.5.7.4a-1] The clear is best-effort and swallows its failure, so an entry can outlive this drain. Exactly-once
 * therefore lives in the STORE, not here: each action carries its id and the store records it in the same write as the
 * effect (`store/appliedIntents.ts`). Clearing before applying would lose a payment on a crash in between.
 */
export function drainPendingActions(
  bridge: PendingActionBridge = pendingActionBridge,
  api: PendingActionApi = appStore.getState(),
): PendingAction[] {
  try {
    const actions = parsePendingActions(bridge.read());
    if (actions.length === 0) return [];
    const applied = applyPendingActions(actions, api);
    bridge.clear();
    return applied;
  } catch (error) {
    reportError(error, { subsystem: 'appIntents', operation: 'drain' });
    return [];
  }
}
