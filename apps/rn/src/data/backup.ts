import { CURRENT_STORE_VERSION, type DebtStore } from './models';

/**
 * The backup FILE format (5.8.1) — a versioned, app-marked envelope around the store.
 *
 * ⛔ Why this exists at all: before 5.8 the export was an inline `JSON.stringify(store)` with no marker
 * of any kind, and the import was `JSON.parse` → `runMigrations` → `importStore`. `runMigrations` rejects
 * only non-objects, so an empty object, a `package.json` and another app's export were all ACCEPTED and
 * REPLACED the user's portfolio (measured, 5.8 before-scan). A format marker is what lets the importer
 * refuse rather than guess, and the guessing is destructive.
 *
 * The store lives under `store`, NESTED — never spread across the envelope. Spreading would let a future
 * store field collide with an envelope field, and the collision would be silent in exactly the direction
 * that matters (an envelope key winning over real user data).
 *
 * `parseBackup` NEVER throws. It returns a tagged result, so a bad file leaves the current data untouched
 * (quarantine-don't-destroy, the same doctrine `hydrate` and `migrateFromLegacy` already follow). The
 * caller decides what to do; nothing here mutates a store.
 *
 * ⚠️ This module handles the ENVELOPE only. Recognising the two OTHER shapes a user can hand us — a raw
 * v1.7 store (the pre-5.8 clipboard export, already in testers' hands) and a v1.6 `debt-planner-backup`
 * file — is 5.8.2's detection layer, which sits in FRONT of this. Keeping detection out of here means the
 * envelope path has exactly one meaning and cannot be loosened by a future format's needs.
 */

export const BACKUP_FORMAT = 'debt-planner-backup';

/**
 * Envelope version — bumped only when the ENVELOPE's own shape changes, never when the store shape does
 * (that is `storeVersion`, migrated by `runMigrations`). The two version numbers answer different
 * questions: this one is "can this build read the wrapper", `storeVersion` is "how far forward must the
 * contents be migrated".
 */
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  /** Human marker, so someone looking at the raw file knows what app made it. Not read for decisions. */
  app: string;
  /** ISO timestamp of the export. Surfaced to the user before a destructive restore (5.8.4). */
  exportedAt: string;
  /**
   * The store's own schema version, lifted OUT of the payload so it is readable without trusting the
   * payload. This is what makes a forward-incompatible refusal possible — see `parseBackup`.
   */
  storeVersion: number;
  store: DebtStore;
}

export const BACKUP_APP_NAME = 'Debt Planner';

/** Tagged parse result — deliberately mirrors the legacy bridge's report style: a reason, never a throw. */
export type BackupParseResult =
  | { ok: true; envelope: BackupEnvelope }
  | { ok: false; reason: BackupParseFailure; message: string };

export type BackupParseFailure =
  /** Not JSON at all. */
  | 'not-json'
  /** Parsed, but carries no `debt-planner-backup` marker — could be anything, so we refuse to guess. */
  | 'not-a-backup'
  /** Our format, but from a build newer than this one. Refused, NOT downgraded. */
  | 'too-new'
  /** Our format and our version, but structurally broken (no `store` object). */
  | 'malformed';

/**
 * Serialize a store to the backup file's text. `now` is injected rather than read from the clock so the
 * output is deterministic under test — the same reason the store's date handling takes an explicit date.
 */
export function serializeBackup(store: DebtStore, opts?: { now?: Date }): string {
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    app: BACKUP_APP_NAME,
    exportedAt: (opts?.now ?? new Date()).toISOString(),
    storeVersion: store.storeVersion ?? CURRENT_STORE_VERSION,
    store,
  };
  return JSON.stringify(envelope, null, 2);
}

/** True when `raw` carries our envelope marker — 5.8.2's detection layer dispatches on this. */
export function isBackupEnvelope(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
  return (parsed as Partial<BackupEnvelope>).format === BACKUP_FORMAT;
}

const NOT_JSON = "That file isn't readable as a backup.";
const NOT_A_BACKUP = "That isn't a Debt Planner backup.";
const TOO_NEW = 'That backup was made by a newer version of Debt Planner. Update the app, then try again.';
const MALFORMED = "That backup is incomplete and can't be restored.";

/**
 * Parse the envelope. Does NOT migrate — `runMigrations` runs at the import boundary, so this stays a
 * pure format concern and the migration keeps its single call path.
 *
 * ⛔ A backup from a NEWER build is refused rather than migrated. `runMigrations` only moves forward: it
 * merges an unknown blob onto CURRENT defaults, so a future store would be silently stripped of whatever
 * this build does not know about — and the user would be looking at a restore that appeared to succeed.
 * Refusing is recoverable (update the app); a silent partial restore over their real data is not. This is
 * the same failure shape the 5.8 before-scan measured on v1.6 files, where `payCycle` "survived" only by
 * matching a default and thereby certified a restore that had dropped the income.
 */
export function parseBackup(raw: string): BackupParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'not-json', message: NOT_JSON };
  }

  if (!isBackupEnvelope(parsed)) {
    return { ok: false, reason: 'not-a-backup', message: NOT_A_BACKUP };
  }

  const env = parsed as Partial<BackupEnvelope>;

  // Guard the version BEFORE the shape: a newer envelope is allowed to look malformed to us, and
  // "update the app" is the honest message for it, where "incomplete" would send the user hunting a
  // corruption that isn't there.
  if (typeof env.formatVersion !== 'number' || env.formatVersion > BACKUP_FORMAT_VERSION) {
    return { ok: false, reason: 'too-new', message: TOO_NEW };
  }

  if (!env.store || typeof env.store !== 'object' || Array.isArray(env.store)) {
    return { ok: false, reason: 'malformed', message: MALFORMED };
  }

  // The store's OWN version can also outrun this build even when the envelope doesn't — the envelope
  // changes rarely, the store shape changes every phase. Read it from the payload when the envelope
  // omits it, so a hand-edited file can't slip a future store past the check by deleting one field.
  const storeVersion =
    typeof env.storeVersion === 'number'
      ? env.storeVersion
      : typeof (env.store as Partial<DebtStore>).storeVersion === 'number'
        ? (env.store as DebtStore).storeVersion
        : CURRENT_STORE_VERSION;

  if (storeVersion > CURRENT_STORE_VERSION) {
    return { ok: false, reason: 'too-new', message: TOO_NEW };
  }

  return {
    ok: true,
    envelope: {
      format: BACKUP_FORMAT,
      formatVersion: env.formatVersion,
      app: typeof env.app === 'string' ? env.app : BACKUP_APP_NAME,
      exportedAt: typeof env.exportedAt === 'string' ? env.exportedAt : '',
      storeVersion,
      store: env.store as DebtStore,
    },
  };
}
