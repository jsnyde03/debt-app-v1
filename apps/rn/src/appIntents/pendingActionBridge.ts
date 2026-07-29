import type { PendingActionBridge } from './pendingActionBridge.types';

/**
 * Web / Android no-op — AppIntents + the App-Group queue are iOS-only. The native implementation is
 * `pendingActionBridge.native.ts`. tsc resolves THIS base file, so it exports everything the drain needs.
 */
export const pendingActionBridge: PendingActionBridge = {
  read: () => null,
  clear: () => {},
};
