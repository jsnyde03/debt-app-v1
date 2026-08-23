import {
  decodeCloudBackup,
  encodeCloudBackup,
  plaintextCloudCodec,
  type CloudBackupCodec,
} from '@/data/cloudBackup';
import type { DebtStore } from '@/data/models';
import { reportError } from '@/utils/reportError';

import type { CloudBackupProvider } from './provider';

/**
 * P6.3.3.4 — orchestration over a {@link CloudBackupProvider}.
 *
 * ⛔ **Pure of any native import** — the provider is injected — so every branch below is unit-testable
 * against a fake, with no device and no entitlement. That is the whole reason the seam exists.
 *
 * ⛔ **Every entry point is non-throwing and returns a tagged outcome.** A failed backup or restore must
 * never crash the app and must never touch local data: quarantine-don't-destroy, the doctrine `hydrate`,
 * `migrateFromLegacy` and `readBackup` already follow. Nothing here writes to the store — `restoreFromCloud`
 * hands back a migrated store and the CALLER decides, which is what keeps consent in the UI layer.
 */

export type CloudBackupOutcome = { ok: true; at: string } | { ok: false; reason: 'unavailable' | 'error' };

/** {@link backupToCloud}'s outcomes plus the one only the remote-aware guard can produce. */
export type GuardedBackupOutcome = CloudBackupOutcome | { ok: false; reason: 'remote-unclaimed'; remoteAt: string };

export type CloudRestoreOutcome =
  | { ok: true; store: DebtStore; at: string | null }
  | { ok: false; reason: 'unavailable' | 'no-backup' | 'error'; message?: string };

export interface CloudBackupStatus {
  available: boolean;
  lastBackupAt: string | null;
}

/**
 * Encode with the active codec and write. Gated on availability so an offline device is not an error.
 *
 * ⛔ **This overwrites the remote unconditionally — it is the mechanism B3 is about, not the guard.**
 * Every caller that is not a deliberate, informed "replace it" must go through {@link backupToCloudGuarded}.
 *
 * ⚠️ **`at` is the file's OBSERVED mtime, not our clock**, re-read with `stat()` after the write. Those two
 * are not the same number, and the difference matters: `at` is what {@link inspectRemote} compares against
 * later, so recording a local timestamp here would make this install fail to recognise its own backup and
 * refuse every subsequent one. The clock is the fallback only for a provider whose `stat` comes back null
 * after a successful write.
 */
export async function backupToCloud(
  store: DebtStore,
  provider: CloudBackupProvider,
  codec: CloudBackupCodec = plaintextCloudCodec,
  opts?: { now?: Date },
): Promise<CloudBackupOutcome> {
  try {
    if (!(await provider.isAvailable())) return { ok: false, reason: 'unavailable' };
    const now = opts?.now ?? new Date();
    await provider.write(encodeCloudBackup(store, codec, { now }));
    const written = await provider.stat().catch((error: unknown) => {
      // A stat failure after a successful write is not a failed backup — the bytes are there. Fall back
      // to the clock and let the next successful stat re-anchor the ledger.
      reportError(error, { seam: 'cloud-backup', op: 'stat-after-write' });
      return null;
    });
    return { ok: true, at: written?.modifiedAt ?? now.toISOString() };
  } catch (error) {
    reportError(error, { seam: 'cloud-backup', op: 'write' });
    return { ok: false, reason: 'error' };
  }
}

/**
 * ⛔ **THE REMOTE-AWARE HALF OF THE CLOBBER GUARD (P6.8.7d.1, finding B3 / M3-3).**
 *
 * `shouldAutoBackup` refuses three LOCAL states. It cannot refuse the one that actually destroys data,
 * because it never looks at iCloud: a fully onboarded user with backup on is permitted to overwrite a
 * remote made by another device, or by the install they are trying to recover — including the one they
 * declined at first launch, which the sheet is at that moment advertising as *"Last backed up …"*.
 *
 * The question this answers is the one nothing in the app asked: **is the thing in iCloud something this
 * install has accounted for?** Accounted-for means we wrote it, or we restored from it — recorded as
 * `prefs.cloudBackupRemoteAt`, the file's mtime at the moment we last saw it.
 *
 * ⚠️ It compares mtimes rather than contents deliberately. `stat()` is a metadata read that works on a
 * file iCloud has not downloaded yet; `read()` on iOS triggers a sync and polls for up to ~4.2 s, which is
 * not something the app-backgrounding path can afford. The failure direction is also the safe one: a
 * mtime that moved for a reason other than a foreign write makes us ASK, and asking never destroys.
 */
export type RemoteClaim =
  /** Nothing in iCloud — there is no copy to lose. */
  | { state: 'none' }
  /** The remote is the one this install last wrote or restored from. Overwriting it loses nothing new. */
  | { state: 'ours'; at: string }
  /** Something is in iCloud that this install has never accounted for. **Overwriting it destroys data.** */
  | { state: 'unclaimed'; at: string }
  /** iCloud could not be reached, so the question is unanswered — which is NOT the same as "none". */
  | { state: 'unknown' };

/**
 * ⚠️ Takes the CLAIMED mtime, not the store. The UI needs this answer while rendering a sheet, where the
 * only thing it can cheaply read is one preference — and a function that needed a whole `DebtStore` would
 * have pushed the caller toward the singleton, which is the seam R4's demo leak came through.
 */
export async function inspectRemote(
  provider: CloudBackupProvider,
  claimedAt: string | null | undefined,
): Promise<RemoteClaim> {
  try {
    if (!(await provider.isAvailable())) return { state: 'unknown' };
    const meta = await provider.stat();
    if (meta === null) return { state: 'none' };
    // ⛔ `===`, not "newer than". A remote written by another device can carry an OLDER mtime than ours
    // (clock skew, a device that was offline) and it is still a copy we have never seen. "Newer wins" is
    // how sync systems lose data; "is this the exact file I accounted for" is the question with an answer.
    // ⚠️ An absent claim must never match an absent mtime — `stat` returning null already means `none`.
    return claimedAt != null && claimedAt === meta.modifiedAt
      ? { state: 'ours', at: meta.modifiedAt }
      : { state: 'unclaimed', at: meta.modifiedAt };
  } catch (error) {
    reportError(error, { seam: 'cloud-backup', op: 'inspect' });
    return { state: 'unknown' };
  }
}

/**
 * Back up **unless doing so would destroy a copy this install has never accounted for.**
 *
 * ⛔ Every implicit backup goes through here: the app-backgrounding hook, and turning the toggle ON —
 * which is the exact tap B3 is about. A `remote-unclaimed` refusal is not a failure to report as an
 * error; it is the guard working, and the caller's job is to put the choice in front of the user rather
 * than to retry.
 *
 * ⚠️ An `unknown` remote (iCloud unreachable) is allowed through to `backupToCloud`, which refuses it at
 * the availability check and returns `unavailable`. It must NOT be treated as `none`.
 */
export async function backupToCloudGuarded(
  store: DebtStore,
  provider: CloudBackupProvider,
  codec: CloudBackupCodec = plaintextCloudCodec,
  opts?: { now?: Date },
): Promise<GuardedBackupOutcome> {
  const claim = await inspectRemote(provider, store.prefs?.cloudBackupRemoteAt);
  if (claim.state === 'unclaimed') return { ok: false, reason: 'remote-unclaimed', remoteAt: claim.at };
  return backupToCloud(store, provider, codec, opts);
}

/**
 * Read + decode. Returns the MIGRATED store; never commits it.
 *
 * ⚠️ `no-backup` and `error` are deliberately different outcomes. "There is nothing in iCloud yet" is the
 * normal state for every user who has not backed up, and reporting it as a failure would make the honest
 * empty case look broken — the same distinction `hydrate` draws between an empty read and a failed one.
 */
export async function restoreFromCloud(
  provider: CloudBackupProvider,
  codecs?: readonly CloudBackupCodec[],
): Promise<CloudRestoreOutcome> {
  try {
    if (!(await provider.isAvailable())) return { ok: false, reason: 'unavailable' };
    // ⛔ Stat BEFORE the read, not after (P6.8.7d.1). If the file changes underneath us, the earlier mtime
    // makes the NEXT `inspectRemote` say `unclaimed` and ask — while the later one would say `ours` and
    // silently overwrite a copy we never actually read. Both orderings are one line; only one is safe.
    const before = await provider.stat().catch(() => null);
    const raw = await provider.read();
    if (raw === null) return { ok: false, reason: 'no-backup' };
    const decoded = decodeCloudBackup(raw, codecs);
    if (!decoded.ok) {
      reportError(new Error(decoded.message), { seam: 'cloud-backup', op: 'decode', outcome: decoded.reason });
      return { ok: false, reason: 'error', message: decoded.message };
    }
    // ⚠️ The CALLER must persist this as `prefs.cloudBackupRemoteAt` — and must do it AFTER `importStore`,
    // which replaces prefs wholesale with the backup's own (one-generation-stale) copy of the field.
    return { ok: true, store: decoded.store, at: before?.modifiedAt ?? null };
  } catch (error) {
    reportError(error, { seam: 'cloud-backup', op: 'read' });
    return { ok: false, reason: 'error' };
  }
}

/**
 * P6.8.7d.2 [C9] — **erase the remote copy, so "Delete all data" is TRUE.**
 *
 * ⛔ `unavailable` is a REFUSAL, not a success. The unavailable provider's `delete()` resolves happily on
 * web, Android and a signed-out device, so a caller that only looked for a throw would report "your iCloud
 * backup is gone" to a user whose backup is untouched — the same lie the finding is about, one layer up.
 * The availability check is what makes a resolved delete mean something.
 *
 * ⚠️ **The one operation here that is not quarantine-don't-destroy**, and deliberately: every other path in
 * this file protects the user's data from being lost, and this one exists because they asked for it to be.
 */
export type CloudDeleteOutcome = { ok: true } | { ok: false; reason: 'unavailable' | 'error' };

export async function deleteCloudBackup(provider: CloudBackupProvider): Promise<CloudDeleteOutcome> {
  try {
    if (!(await provider.isAvailable())) return { ok: false, reason: 'unavailable' };
    await provider.delete();
    return { ok: true };
  } catch (error) {
    reportError(error, { seam: 'cloud-backup', op: 'delete' });
    return { ok: false, reason: 'error' };
  }
}

/** Availability + last-backup time for the status row. An error is reported and read as unavailable. */
export async function getCloudBackupStatus(provider: CloudBackupProvider): Promise<CloudBackupStatus> {
  try {
    if (!(await provider.isAvailable())) return { available: false, lastBackupAt: null };
    const meta = await provider.stat();
    return { available: true, lastBackupAt: meta?.modifiedAt ?? null };
  } catch (error) {
    reportError(error, { seam: 'cloud-backup', op: 'stat' });
    return { available: false, lastBackupAt: null };
  }
}

/**
 * ⛔ **THE CLOBBER GUARD — the most expensive lesson in Freedom's version of this feature.**
 *
 * An automatic backup that fires on any store is a data-loss mechanism wearing a data-protection label. It
 * has to refuse three states, and each one was found the hard way:
 *
 * 1. **Not onboarded** — backing up a half-entered or empty plan overwrites the good remote with nothing.
 *    This is also the post-"Delete all data" state, which is precisely when iCloud is the user's last copy.
 * 2. **A declined restore** — the user was offered their backup on this install and said "Not now". If the
 *    app then backs up the bare local plan, that remote is gone and "restore later from More" has quietly
 *    become impossible. The decline must suppress auto-backup for the session.
 * 3. **Backup turned off** — [D47]: default OFF, so the check is `=== true`, never truthiness on an absent
 *    field. An older store has no `cloudBackupEnabled` key at all, and `undefined` must read as OFF.
 *
 * ⚠️ Manual "Back up now" deliberately does NOT pass through here: the user is standing in front of it and
 * has said what they want. This guards the AUTOMATIC path, where nobody is watching.
 *
 * ⛔ **It is only HALF the guard, and the missing half is the one that destroyed data (B3).** Every clause
 * above reasons about the LOCAL store; none of them can see what is in iCloud. R1 measured the fix both
 * audit lenses proposed — routing the toggle-on through here — and at that moment `cloudBackupEnabled` has
 * just been set `true` and the user is necessarily onboarded, so this returns **`true` and permits the
 * clobber anyway.** The remote half is {@link inspectRemote} / {@link backupToCloudGuarded}, and an
 * implicit backup needs BOTH.
 */
export function shouldAutoBackup(store: DebtStore, opts: { declinedRestore: boolean }): boolean {
  if (opts.declinedRestore) return false;
  if (store.prefs?.cloudBackupEnabled !== true) return false;
  return isOnboarded(store);
}

/**
 * Whether this install has a committed plan. Read from the persisted onboarding flag rather than from the
 * presence of debts — a user can legitimately have zero debts and still have onboarded, and treating that
 * as "fresh" would both suppress their backups and re-offer a restore they already declined.
 */
export function isOnboarded(store: DebtStore): boolean {
  return store.prefs?.onboardingComplete === true;
}
