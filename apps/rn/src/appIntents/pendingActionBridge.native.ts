import { requireNativeModule } from 'expo-modules-core';

import type { PendingActionBridge } from './pendingActionBridge.types';

/**
 * iOS App-Group queue bridge — reads/clears what `PaydayLandedIntent` wrote (3.5.3.5), via the same
 * `LiveActivity` module. Every call is guarded so a native throw can never escape into the RN handler;
 * `read` returns the queued actions as a JSON string (`parsePendingActions` handles it) or null.
 */
interface NativeLiveActivity {
  readPendingActions(): string;
  clearPendingActions(): void;
}

// Lazily resolved on first use, never at import — see liveActivityBridge.native.ts for why a top-level
// requireNativeModule in a `.native` file can hard-crash a web route chunk. feedback_platform_split_reexport_gap.
let _native: NativeLiveActivity | null = null;
function native(): NativeLiveActivity {
  return (_native ??= requireNativeModule<NativeLiveActivity>('LiveActivity'));
}

export const pendingActionBridge: PendingActionBridge = {
  read: () => {
    try {
      return native().readPendingActions();
    } catch {
      return null;
    }
  },
  clear: () => {
    try {
      native().clearPendingActions();
    } catch {
      /* best-effort */
    }
  },
};
