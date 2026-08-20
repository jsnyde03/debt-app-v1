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

export type CloudRestoreOutcome =
  | { ok: true; store: DebtStore }
  | { ok: false; reason: 'unavailable' | 'no-backup' | 'error'; message?: string };

export interface CloudBackupStatus {
  available: boolean;
  lastBackupAt: string | null;
}

/** Encode with the active codec and write. Gated on availability so an offline device is not an error. */
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
    return { ok: true, at: now.toISOString() };
  } catch (error) {
    reportError(error, { seam: 'cloud-backup', op: 'write' });
    return { ok: false, reason: 'error' };
  }
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
    const raw = await provider.read();
    if (raw === null) return { ok: false, reason: 'no-backup' };
    const decoded = decodeCloudBackup(raw, codecs);
    if (!decoded.ok) {
      reportError(new Error(decoded.message), { seam: 'cloud-backup', op: 'decode', outcome: decoded.reason });
      return { ok: false, reason: 'error', message: decoded.message };
    }
    return { ok: true, store: decoded.store };
  } catch (error) {
    reportError(error, { seam: 'cloud-backup', op: 'read' });
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
