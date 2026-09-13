import type { LiveActivityBridge } from './liveActivityBridge.types';

/**
 * Web / Android no-op bridge — Live Activities are iOS-only. The native implementation is
 * `liveActivityBridge.native.ts` (Metro's `.native` extension wins on device). tsc resolves THIS base
 * file, so it must export everything the sync manager imports.
 *
 * ⛔ [.5.4f · `C3-5`] — `true`, not `false`, for the reason `writeWidgetSnapshot`'s web stub gives: there is
 * no activity on this platform, so "the Lock Screen is as current as it can be" is the honest answer, and
 * `false` would turn every store change into a retry. (`areActivitiesEnabled` is `false` here, so the
 * manager never calls these — the QA screen is the only other caller.)
 */
export const liveActivityBridge: LiveActivityBridge = {
  areActivitiesEnabled: () => false,
  start: async () => true,
  update: async () => true,
  end: async () => true,
};
