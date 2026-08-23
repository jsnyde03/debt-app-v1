/**
 * P6.8.7d.3 [M3-5] — what the iCloud sheet SAYS about an outcome, as a pure function.
 *
 * ⛔ It lives here, apart from the sheet, for one reason: **the sheet's `ready` branch is unreachable to
 * every automated test in this repo.** On web the provider is the unavailable stub by construction, so
 * Playwright can only ever see the "sign in to iCloud" dead end — which is precisely how a message-mapping
 * defect survived a 13-lens audit. A pure module is the only part of this screen a test can actually hold.
 *
 * ⚠️ No `react-native` import may enter this file, or `test:app` (plain node, no RN mocks) stops loading it.
 */

export type CloudBackupOutcomeKind = 'ok' | 'unavailable' | 'no-backup' | 'error' | 'remote-unclaimed';

export interface CloudBackupActionLike {
  result: CloudBackupOutcomeKind;
  /** The diagnosis the layer below computed, when it had one. */
  message?: string;
}

/**
 * Turn a service-layer failure into the action the UI consumes.
 *
 * ⛔ **This exists so that carrying the diagnosis is not something anyone has to remember.** M3-5 was one
 * line — `return result.reason` — dropping one field, and it survived thirteen lenses because nothing
 * anywhere asserted that the field arrived. A hand-written object literal at each call site is an
 * omission waiting to happen again; a shared constructor is a thing a test can hold.
 */
export function toCloudAction(outcome: { reason: CloudBackupOutcomeKind; message?: string }): CloudBackupActionLike {
  return { result: outcome.reason, message: outcome.message };
}

/** The generic line. ⚠️ It is a FALLBACK now, not the answer to every failure. */
export const GENERIC_FAILURE = "That didn’t work. Your data on this device is unchanged.";
export const NO_BACKUP_YET = 'There is no backup in iCloud yet.';
export const SIGN_IN_TO_ICLOUD = 'Sign in to iCloud on this device to use backup.';
export const REMOTE_UNCLAIMED = 'iCloud already has a backup that this device hasn’t seen. Choose which copy to keep.';

/**
 * ⛔ **Order is the whole finding.**
 *
 * 1. Success speaks for itself.
 * 2. `remote-unclaimed` is checked BEFORE the message, because it is not a failure — it is the B3 guard
 *    declining to destroy a copy, and any wording that reads as an error pushes the user to retry until
 *    it succeeds.
 * 3. Then the SPECIFIC diagnosis, if the decoder computed one. This is the step that did not exist:
 *    `restoreFromCloud` carried an exact message and the screen dropped it, so *"That iCloud file isn't a
 *    Debt Planner backup"* and *"…made by a newer version. Update the app"* both rendered as one generic
 *    sentence — a user told nothing about a condition the code had diagnosed precisely.
 * 4. Only then the per-reason fallbacks.
 */
export function cloudBackupMessage(action: CloudBackupActionLike, success: string): string {
  const { result, message } = action;
  if (result === 'ok') return success;
  if (result === 'remote-unclaimed') return REMOTE_UNCLAIMED;
  if (message) return message;
  if (result === 'no-backup') return NO_BACKUP_YET;
  if (result === 'unavailable') return SIGN_IN_TO_ICLOUD;
  return GENERIC_FAILURE;
}
