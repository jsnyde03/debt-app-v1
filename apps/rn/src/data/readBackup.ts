import { parseBackupValue, type BackupParseFailure } from './backup';
import { detectBackupFormat, type BackupKind } from './detectBackupFormat';
import { LEGACY_KEY_PREFIX } from './legacyBridge/webkitLocalStorage';
import { mapLegacyStore, type LegacyMapReport } from './legacyBridge/mapLegacyStore';
import { runMigrations } from './migrations';
import { type DebtStore } from './models';

/**
 * 5.8.3 — the import ROUTER: text in, a migrated store out, or an honest refusal.
 *
 * ⛔ Nothing here writes. The caller decides whether to commit the returned store, which is what lets
 * 5.8.4 confirm with the user BEFORE `importStore` replaces their portfolio. Separating "can I read this"
 * from "shall I apply it" is the whole reason the pre-5.8 path was dangerous: it did both in one tap.
 *
 * Parses ONCE and passes the parsed value down (5.8.2's after-scan) — `detectBackupText` and `parseBackup`
 * each parse, and chaining them would run `JSON.parse` over a user's file three times.
 *
 * The three readers:
 *   - `envelope` → 5.8.1's `parseBackupValue`, then `runMigrations`.
 *   - `raw-v17`  → straight to `runMigrations` (it IS a store; that is the pre-5.8 export).
 *   - `v16-file` → the adapter below, then `mapLegacyStore`, then `runMigrations`.
 */

export type ReadBackupFailure = BackupParseFailure | 'unrecognised' | 'unreadable';

export interface ReadBackupSuccess {
  ok: true;
  kind: BackupKind;
  /** Migrated to `CURRENT_STORE_VERSION` and ready to commit — but NOT committed. */
  store: DebtStore;
  /** Present only for `v16-file`: what was mapped, dropped, unknown or unparseable. Drives 5.8.4. */
  legacy?: LegacyMapReport;
}

export interface ReadBackupFailureResult {
  ok: false;
  kind: BackupKind;
  reason: ReadBackupFailure;
  message: string;
}

export type ReadBackupResult = ReadBackupSuccess | ReadBackupFailureResult;

const NOT_JSON = "That file isn’t readable as a backup.";
const UNRECOGNISED = "That isn’t a Debt Planner backup.";
const UNREADABLE = "That backup couldn’t be read.";

/**
 * v1.6 file metadata — describes the FILE, not the user. Skipped before mapping so they do not surface as
 * `unknown` keys, which would make a perfectly healthy import look like it had encountered something it
 * did not understand. ⚠️ Deliberately NOT added to `mapLegacyStore`'s own `DROPPED` table: these are never
 * `localStorage` keys, and teaching the WebKit-door mapping about file-only fields would be a lie about
 * where they come from.
 */
const V16_FILE_METADATA = new Set(['version', 'exportedAt']);

/**
 * A v1.6 backup file is the same data as v1.6's `localStorage`, in one flat object instead of many keys.
 * So it is re-encoded into the key/JSON-string shape `mapLegacyStore` already consumes rather than given a
 * second translation to keep in sync — the WebKit door and the file door are one problem, and 5.2 already
 * solved it. ⚠️ v1.6 wrote every key through `JSON.stringify`, so the values must be re-encoded, not
 * passed through: the mapper parses what it is given.
 */
export function v16FileToLegacyItems(file: Record<string, unknown>): Record<string, string> {
  const items: Record<string, string> = {};
  for (const [key, value] of Object.entries(file)) {
    if (V16_FILE_METADATA.has(key)) continue;
    if (value === undefined) continue;
    items[`${LEGACY_KEY_PREFIX}${key}`] = JSON.stringify(value);
  }
  return items;
}

export function readBackup(raw: string): ReadBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, kind: 'unrecognised', reason: 'not-json', message: NOT_JSON };
  }

  const { kind, detail } = detectBackupFormat(parsed);

  switch (kind) {
    case 'envelope': {
      const result = parseBackupValue(parsed);
      if (!result.ok) return { ok: false, kind, reason: result.reason, message: result.message };
      return migrated(kind, result.envelope.store);
    }

    case 'raw-v17':
      return migrated(kind, parsed);

    case 'v16-file': {
      const items = v16FileToLegacyItems(parsed as Record<string, unknown>);
      const { partial, report } = mapLegacyStore(items);
      return migrated(kind, partial, report);
    }

    default:
      return { ok: false, kind: 'unrecognised', reason: 'unrecognised', message: `${UNRECOGNISED} (${detail})` };
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const SOURCE: Record<BackupKind, string> = {
  envelope: 'This backup',
  'raw-v17': 'This backup',
  'v16-file': 'This backup, from an older version of Debt Planner,',
  unrecognised: 'This backup',
};

/**
 * The one-line summary shown before the user commits to a destructive replace (5.8.4).
 *
 * ⛔ It counts what is in the MIGRATED store, not what was in the file. That distinction is the point: if
 * a v1.6 file's debts failed to map, this says "no debts" and the user gets to stop — whereas counting
 * the file's own array would report the debts as present right up until they vanished. The summary has to
 * describe what will actually land, or it is reassurance rather than information.
 */
export function describeBackup(result: ReadBackupSuccess): string {
  const { store } = result;
  const parts = [
    plural(store.debts?.length ?? 0, 'debt', 'debts'),
    plural((store.requiredExpenses?.length ?? 0) + (store.livingExpenses?.length ?? 0), 'expense', 'expenses'),
    plural(store.goals?.length ?? 0, 'goal', 'goals'),
  ];
  const contents = `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  const dropped = result.legacy?.dropped.length ?? 0;
  const skipped = dropped > 0 ? ` ${plural(dropped, 'item', 'items')} the current version no longer uses won’t come across.` : '';
  return `${SOURCE[result.kind]} has ${contents}.${skipped}`;
}

/**
 * ⛔ EVERY path migrates through here, and every path is wrapped.
 *
 * Detection proves a blob's SHAPE at the top level; it proves nothing about what is inside. `runMigrations`
 * reaches into the payload — `(r.debts ?? base.debts).map(...)` — so an envelope whose `store.debts` is a
 * string throws a `TypeError` from deep inside the migration, not a refusal. Unwrapped, that surfaces as a
 * crash on a screen whose entire job is to be safe with a file the user found somewhere. A recognised
 * format is not a trusted one.
 */
/**
 * ⛔ A restored portfolio implies a user who has ALREADY onboarded — found on a real device (🎯).
 *
 * v1.6's `buildBackupData()` never emitted `hasCompletedOnboarding`, so a genuine v1.6 backup file cannot
 * carry it. `mapLegacyStore` therefore lands `onboardingComplete: false`, and the route guard in
 * `_layout.tsx` (`Stack.Protected guard={!onboardingComplete}`) sends the user straight to onboarding —
 * **with their data imported but entirely invisible behind the gate.** It reads as "the import did
 * nothing", which is the worst possible way for a successful restore to present.
 *
 * ⚠️ Inferred from CONTENT, not assumed from the act of importing. An empty backup restores an empty app
 * and must still onboard — otherwise a user who exported before setting anything up gets dropped into a
 * blank Today with no way back to the setup flow. The signal is a portfolio existing at all.
 */
function migrated(kind: BackupKind, value: unknown, legacy?: LegacyMapReport): ReadBackupResult {
  try {
    return { ok: true, kind, store: runMigrations(value), ...(legacy ? { legacy } : {}) };
  } catch {
    return { ok: false, kind, reason: 'unreadable', message: UNREADABLE };
  }
}
