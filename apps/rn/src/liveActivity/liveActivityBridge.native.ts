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
  // ⛔ [.5.4f · `C3-5`] — `AsyncFunction`s in Swift: each resolves with whether ActivityKit took the call.
  startActivity(content: PaydayActivityContent): Promise<boolean>;
  updateActivity(content: PaydayActivityContent): Promise<boolean>;
  endActivity(): Promise<boolean>;
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
  // ⛔ [.5.4f · pass-7 `C3-5`] — still never throws into the app, but a swallowed failure now answers `false`
  // instead of reading as success. Swallowing an error and REPORTING SUCCESS are two different things, and
  // only the second was the defect (`widgetStorage.native.ts` says the same of the widget's twin).
  start: async (content) => {
    try {
      return await native().startActivity(content);
    } catch {
      return false;
    }
  },
  update: async (content) => {
    try {
      return await native().updateActivity(content);
    } catch {
      return false;
    }
  },
  end: async () => {
    try {
      return await native().endActivity();
    } catch {
      return false;
    }
  },
};
