import { requireNativeModule } from 'expo-modules-core';

import type { PaydayActivityContent } from './paydayActivityContent';
import type { LiveActivityBridge } from './liveActivityBridge.types';

/**
 * iOS ActivityKit bridge — thin JS over the `LiveActivity` local Expo module (`modules/live-activity`).
 * Every call is wrapped so a native throw (module unavailable on an old build, Live Activities disabled,
 * a request failure) can never escape into the RN global handler — the countdown is best-effort chrome.
 */
interface NativeLiveActivity {
  areActivitiesEnabled(): boolean;
  startActivity(content: PaydayActivityContent): void;
  updateActivity(content: PaydayActivityContent): void;
  endActivity(): void;
}

// Lazily resolved on FIRST use, never at import. Metro web picks the no-op base `liveActivityBridge.ts`,
// but expo-router's per-route web chunking can still pull THIS `.native` file into a route bundle; a
// top-level `requireNativeModule` there hard-crashes the whole screen (it took out /more once). Deferring
// the lookup makes importing this module always safe — only an actual call (which web never makes) touches
// native. See feedback_platform_split_reexport_gap.
let _native: NativeLiveActivity | null = null;
function native(): NativeLiveActivity {
  return (_native ??= requireNativeModule<NativeLiveActivity>('LiveActivity'));
}

export const liveActivityBridge: LiveActivityBridge = {
  areActivitiesEnabled: () => {
    try {
      return native().areActivitiesEnabled();
    } catch {
      return false;
    }
  },
  start: (content) => {
    try {
      native().startActivity(content);
    } catch {
      /* best-effort */
    }
  },
  update: (content) => {
    try {
      native().updateActivity(content);
    } catch {
      /* best-effort */
    }
  },
  end: () => {
    try {
      native().endActivity();
    } catch {
      /* best-effort */
    }
  },
};
