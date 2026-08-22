import { readBackup, type ReadBackupResult } from './readBackup';
import { serializeBackup } from './backup';
import type { DebtStore } from './models';

/**
 * P6.3.3.2 — the blob written to the app's PRIVATE iCloud container.
 *
 * ⛔ **This layer owns the CODEC and nothing else.** It wraps the existing 5.8.1 backup envelope
 * (`serializeBackup`) in a small versioned CLOUD envelope carrying a `codec` id, and on the way back it
 * hands the inner payload straight to `readBackup`. It does not parse a store, does not migrate, and does
 * not decide what a backup is — the same discipline `backupFile.ts` states for the file door: *"the file
 * layer moves bytes and nothing else."* A second opinion on the format is exactly how the accept-any-object
 * defect got in, and iCloud is the third door onto one importer, not a third importer.
 *
 * ⚠️ Ported from `FinancialFreedom/src/data/cloudBackup.ts`, whose codec seam is the reusable part. Two
 * deliberate divergences: Freedom's decoder calls `parseBackup` (envelope only, no migration) where this
 * calls `readBackup` (migrates, and refuses with the same messages the Import sheet already shows); and
 * the cloud envelope here is versioned separately from the payload for the same reason 5.8.1 split
 * `formatVersion` from `storeVersion` — *"can this build read the wrapper"* and *"how far forward must the
 * contents be migrated"* are different questions.
 *
 * ⛔ **[D40]: no passphrase, and the codec seam is why that is reversible.** v1.0 ships `plaintext` — the
 * app-private container is encrypted by Apple at rest and in transit, is sandboxed to this app under one
 * Apple ID, and is unreadable by us. A future passphrase-derived codec registers a new `id` here and
 * `decodeCloudBackup` dispatches to it with **no change to the provider, the service or the UI**; blobs
 * written by the old codec stay decodable because the id is persisted in the envelope. What a passphrase
 * would add today is a permanent unrecoverable-backup failure mode, which is the trade [D40] declined.
 */

export const CLOUD_BACKUP_FORMAT = 'debt-planner-cloud-backup';
export const CLOUD_BACKUP_FORMAT_VERSION = 1;

/**
 * Transforms the plaintext backup payload ↔ the bytes stored in iCloud. v1.0 = identity.
 *
 * ⚠️ The `id` is persisted, so it is a wire value: renaming one breaks every blob already written with it.
 */
export interface CloudBackupCodec {
  readonly id: string;
  encodePayload(plaintext: string): string;
  decodePayload(encoded: string): string;
}

/** v1.0 codec: no app-level encryption — see [D40] above. */
export const plaintextCloudCodec: CloudBackupCodec = {
  id: 'plaintext',
  encodePayload: (plaintext) => plaintext,
  decodePayload: (encoded) => encoded,
};

/** Codecs this build can DECODE. A future codec is appended here before it is ever used to encode. */
export const CLOUD_CODECS: readonly CloudBackupCodec[] = [plaintextCloudCodec];

interface CloudEnvelope {
  cloudFormat: typeof CLOUD_BACKUP_FORMAT;
  cloudFormatVersion: number;
  codec: string;
  payload: string;
}

/**
 * ⚠️ `now` is injected rather than read from the clock, so a test asserts a value instead of a range —
 * the same reason `serializeBackup` takes it.
 */
export function encodeCloudBackup(
  store: DebtStore,
  codec: CloudBackupCodec = plaintextCloudCodec,
  opts?: { now?: Date },
): string {
  const envelope: CloudEnvelope = {
    cloudFormat: CLOUD_BACKUP_FORMAT,
    cloudFormatVersion: CLOUD_BACKUP_FORMAT_VERSION,
    codec: codec.id,
    payload: codec.encodePayload(serializeBackup(store, opts)),
  };
  return JSON.stringify(envelope);
}

/** Shown when the container holds a file we did not write, or wrote in a way this build cannot read. */
const NOT_A_CLOUD_BACKUP = "That iCloud file isn’t a Debt Planner backup.";
const NO_CODEC = 'That backup was made by a newer version of Debt Planner.';

/**
 * Parse the cloud envelope, decode the payload, and hand it to `readBackup`.
 *
 * ⛔ **Never throws.** It returns the same tagged `ReadBackupResult` the Import sheet already consumes, so
 * a corrupt or foreign blob leaves local data untouched — quarantine-don't-destroy, the doctrine `hydrate`
 * and `migrateFromLegacy` already follow. Nothing here mutates a store.
 *
 * ⚠️ A cloud blob written by a FUTURE codec is refused with "newer version", not treated as corruption:
 * that is the honest message, and it is the one case where telling the user to update is the actual fix.
 */
export function decodeCloudBackup(
  raw: string,
  codecs: readonly CloudBackupCodec[] = CLOUD_CODECS,
): ReadBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, kind: 'unrecognised', reason: 'not-json', message: NOT_A_CLOUD_BACKUP };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, kind: 'unrecognised', reason: 'unrecognised', message: NOT_A_CLOUD_BACKUP };
  }

  const envelope = parsed as Partial<CloudEnvelope>;
  if (
    envelope.cloudFormat !== CLOUD_BACKUP_FORMAT ||
    typeof envelope.payload !== 'string' ||
    typeof envelope.codec !== 'string'
  ) {
    return { ok: false, kind: 'unrecognised', reason: 'unrecognised', message: NOT_A_CLOUD_BACKUP };
  }

  // ⚠️ Guard the wrapper's version BEFORE its shape, exactly as `parseBackupValue` does: a newer cloud
  // envelope is ALLOWED to look malformed to us, and "update the app" is the honest reading of that.
  if (
    typeof envelope.cloudFormatVersion !== 'number' ||
    envelope.cloudFormatVersion > CLOUD_BACKUP_FORMAT_VERSION
  ) {
    return { ok: false, kind: 'unrecognised', reason: 'too-new', message: NO_CODEC };
  }

  const codec = codecs.find((c) => c.id === envelope.codec);
  if (!codec) return { ok: false, kind: 'unrecognised', reason: 'too-new', message: NO_CODEC };

  let payload: string;
  try {
    payload = codec.decodePayload(envelope.payload);
  } catch {
    return { ok: false, kind: 'unrecognised', reason: 'unreadable', message: NO_CODEC };
  }

  return readBackup(payload);
}
