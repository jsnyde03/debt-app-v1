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

/** ⛔ [pass-5 B5-11] `remote-unreadable` is distinct from `unavailable`: the user IS signed in. */
export type CloudBackupOutcomeKind = 'ok' | 'unavailable' | 'no-backup' | 'error' | 'remote-unclaimed' | 'remote-unreadable';

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
/**
 * ⛔ [pass-5 `B5-11`] The honest sentence for *"you are signed in and iCloud will not tell us when this
 * backup was written."* It states what is true and what the app did, and asks for nothing — because
 * there is nothing the user can do. ⭐ Their data is untouched: the guard refuses rather than overwrites.
 */
export const REMOTE_UNREADABLE =
  'iCloud isn’t reporting when this backup was last written, so it wasn’t replaced. Your data is safe — try again later.';

export function cloudBackupMessage(action: CloudBackupActionLike, success: string): string {
  const { result, message } = action;
  if (result === 'ok') return success;
  if (result === 'remote-unclaimed') return REMOTE_UNCLAIMED;
  if (message) return message;
  if (result === 'no-backup') return NO_BACKUP_YET;
  /**
   * ⛔ **S1.12.5.8 [pass-5 `B5-11`]** — `'remote-unreadable'` is NOT `'unavailable'`. The user is signed
   * in; iCloud simply will not report the backup's timestamp. Telling them to sign in names an action
   * they have already taken and cannot repeat, forever.
   */
  if (result === 'remote-unreadable') return REMOTE_UNREADABLE;
  if (result === 'unavailable') return SIGN_IN_TO_ICLOUD;
  return GENERIC_FAILURE;
}

/**
 * ⛔ **THE RESTORE CONFIRM'S DISCLOSURE SLOT, AS A PURE DECISION.** [S1.11.5.2 · pass-4 `C4-6`]
 *
 * ⚡ **`C-7b`'s disclosure could be RACED.** `openRestoreConfirm` renders the confirm synchronously and
 * starts the iCloud read afterwards, so the confirm's first frame carried `preview === null` and the slot
 * drew **nothing** — byte-identical to the un-fixed state. The confirm button was `disabled={busy !== null}`
 * and the pre-read never set `busy`, and there was no spinner, so the window was invisible. Over a network
 * round-trip that is hundreds of milliseconds to seconds, on the one screen where a second tap destroys
 * data.
 *
 * ⛔ **It lives here rather than in the JSX for the reason this file already exists.** `CloudBackupSheet`'s
 * `ready` branch is unreachable to every automated test in the repo — on web the provider is the
 * unavailable stub by construction — and *"the computed diagnosis is dropped at the last layer"* survived
 * thirteen lenses because of it. A three-way choice written as nested ternaries in that branch is
 * un-assertable; written here it is a table.
 *
 * ⚠️ **Three states, and the third one is the folded-in half.** *"I could not read it"* used to be
 * **silence** — the slot simply drew nothing on the failure path — and suppressing a false statement to
 * produce no statement is the same defect one step quieter.
 */
export type RestoreDisclosure =
  | { kind: 'reading'; text: string }
  | { kind: 'contents'; text: string }
  | { kind: 'unreadable'; text: string };

export const RESTORE_READING = 'Reading the backup…';
export const RESTORE_UNREADABLE = 'I couldn’t read the backup to tell you what’s in it.';

export function restoreDisclosure(previewing: boolean, preview: string | null): RestoreDisclosure {
  // ⛔ `previewing` OUTRANKS a stale `preview`: re-opening the confirm clears the description and starts a
  // new read, and showing the previous backup's contents over a read in flight is a claim about the wrong
  // file.
  if (previewing) return { kind: 'reading', text: RESTORE_READING };
  if (preview) return { kind: 'contents', text: preview };
  return { kind: 'unreadable', text: RESTORE_UNREADABLE };
}

/**
 * ⛔ **AND THE COMMIT GATE, BESIDE THE WORDS, BECAUSE THEY ARE ONE DECISION.** The confirm may not be
 * committed while the disclosure is unknown. ⚠️ `previewing`, never `busy: 'restore'` — that would label
 * the state *"we are overwriting your device"* while we are only reading it. ⭐ The failure path is
 * deliberately NOT blocked: the read returned nothing, the slot says so, and the unconditional danger
 * sentence stands on its own — *"a slow or unavailable iCloud never blocks a restore the user has asked
 * for"* is the standing decision, and it survives.
 */
export function restoreConfirmDisabled(busy: unknown, previewing: boolean): boolean {
  return busy !== null || previewing;
}
