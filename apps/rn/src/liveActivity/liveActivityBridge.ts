import type { LiveActivityBridge } from './liveActivityBridge.types';

/**
 * Web / Android no-op bridge — Live Activities are iOS-only. The native implementation is
 * `liveActivityBridge.native.ts` (Metro's `.native` extension wins on device). tsc resolves THIS base
 * file, so it must export everything the sync manager imports.
 */
export const liveActivityBridge: LiveActivityBridge = {
  areActivitiesEnabled: () => false,
  start: () => {},
  update: () => {},
  end: () => {},
};
