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

const native = requireNativeModule<NativeLiveActivity>('LiveActivity');

export const liveActivityBridge: LiveActivityBridge = {
  areActivitiesEnabled: () => {
    try {
      return native.areActivitiesEnabled();
    } catch {
      return false;
    }
  },
  start: (content) => {
    try {
      native.startActivity(content);
    } catch {
      /* best-effort */
    }
  },
  update: (content) => {
    try {
      native.updateActivity(content);
    } catch {
      /* best-effort */
    }
  },
  end: () => {
    try {
      native.endActivity();
    } catch {
      /* best-effort */
    }
  },
};
