import { describeStoreContents, parseBackupValue, type BackupParseFailure } from './backup';
import { detectBackupFormat, type BackupKind } from './detectBackupFormat';
import { formatBackupTime } from './formatBackupTime';
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
  /**
   * When the file was exported, if it says.
   *
   * ⛔ **`BackupEnvelope.exportedAt` claimed to be *"surfaced to the user before a destructive restore"*
   * and was dropped one line into this module.** [P6.8.9.7.11.12 · B-J2-2] The writer wrote it, the parser
   * carried it, and then only `envelope.store` was passed on — so the screen standing between a live
   * portfolio and an irreversible overwrite showed entity counts, which read identically for a backup made
   * this morning and one made in March.
   *
   * ⚠️ **Optional, and absent means absent.** A bare `raw-v17` store is not an envelope and carries no
   * date; inventing one would be a claim about a file nothing knows anything about, on the screen where
   * being wrong is least recoverable.
   */
  exportedAt?: string;
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
      return migrated(kind, result.envelope.store, undefined, result.envelope.exportedAt);
    }

    case 'raw-v17':
      return migrated(kind, parsed);

    case 'v16-file': {
      const file = parsed as Record<string, unknown>;
      const items = v16FileToLegacyItems(file);
      const { partial, report } = mapLegacyStore(items);
      // ⚠️ `detectBackupFormat` requires a string `exportedAt` to call a file `v16-file` at all, so this is
      // always present on this branch — read defensively regardless, because the two checks live apart.
      return migrated(kind, partial, report, typeof file.exportedAt === 'string' ? file.exportedAt : undefined);
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
  const contents = describeStoreContents(result.store);
  const dropped = result.legacy?.dropped.length ?? 0;
  const skipped = dropped > 0 ? ` ${plural(dropped, 'item', 'items')} the current version no longer uses won’t come across.` : '';
  /**
   * ⛔ **WHEN, not just what.** [P6.8.9.7.11.12 · B-J2-2] The counts are identical for a backup exported
   * this morning and one exported in March, and this sentence is the last thing a person reads before an
   * irreversible overwrite of a live portfolio. ⚠️ Omitted entirely when the file does not say — see
   * `ReadBackupSuccess.exportedAt`.
   */
  const saved = result.exportedAt ? ` Saved ${formatBackupTime(result.exportedAt)}.` : '';
  return `${SOURCE[result.kind]} has ${contents}.${saved}${skipped}${describeLosses(result.store)}`;
}

/**
 * ⛔ **WHAT COULD NOT BE READ, AT THE POINT OF NO RETURN.** [S1.10.6.4 · pass-3 C-7]
 *
 * ⚡ **The sentence was byte-identical for an intact backup and one this very reader had just recorded
 * three losses on** — a balance, a whole debt row and a goal's saved amount — and the user learned about
 * them only on Today, *after* their live portfolio was gone. ⛔ This is `B-J2-2`'s own finding one field
 * further on, and the answer was not merely available: **it is already inside the object being described**
 * (`result.store.pendingDataRepairs`). `skipped`, three lines up, covers the one loss class that is benign.
 *
 * ⚠️ **One clause, not the raw repair list.** `dataRepairsCopy` already turns repairs into human sentences
 * and pass-2 `m1` recorded that even that path still printed schema keys; naming a count is what this
 * screen needs, and the card that follows the restore names the fields.
 *
 * ⚠️ **A `recovered` repair is excluded**, for the reason `trustSelectors` gives in both directions: its
 * value is exactly right and only its format was wrong, so counting it here would warn about money the
 * restore will carry across perfectly.
 */
/**
 * ⛔ **THE SAME SENTENCE FOR THE OTHER RESTORE DOOR.** [S1.10.6.4 · pass-3 C-7b]
 *
 * The iCloud sheet has no file envelope — no `exportedAt`, no legacy `dropped` list — so it cannot call
 * `describeBackup`. It has the migrated store, which is where the two parts that matter come from. ⚠️ One
 * owner rather than a second copy of the wording: the two doors are the finding's own *"do not fix one
 * without the other"*, and a second implementation is how they would drift apart again.
 */
export function describeRestorePreview(store: DebtStore): string {
  return `This backup has ${describeStoreContents(store)}.${describeLosses(store)}`;
}

/**
 * ⛔ **THE OTHER HALF OF THE SENTENCE, AND NO DOOR SAID IT.** [S1.11.4.3 · pass-4 `C4-11`]
 *
 * ⚡ `describeBackup` and `describeRestorePreview` both describe **what is being written**. Neither says a
 * word about **what is being overwritten**, and one of the four doors fires at launch over a store the
 * user has already typed into: `_layout.tsx`'s one-shot offer is gated on `!isOnboarded`, which is exactly
 * `prefs.onboardingComplete === true`, and `onboarding.tsx` records that the four steps *"write to the
 * store as they go"* while only `CompletionStep` completes. `step` is React state, so a user who enters
 * their paycheck and first debt, is interrupted, and reopens the app arrives back at step 0 with **both
 * already persisted and `onboardingComplete` still false** — and taps *Restore* on an Alert that mentions
 * neither side.
 *
 * ⚠️ **Empty string when there is nothing to lose, and that is not a nicety.** Door 4 renders over a
 * `data-reset` store, which is `createDefaultStore()` — appending *"this will replace 0 debts"* there
 * would be a warning about nothing, and a warning that cries wolf on the common path is how the real one
 * stops being read.
 *
 * ⚠️ **Names only what is actually there.** `describeStoreContents` is right for a backup, where *"0
 * goals"* is information about the file; it is wrong here, where the sentence is a list of what the user
 * stands to lose.
 */
export function describeLocalOverwrite(store: DebtStore): string {
  const expenses = store.requiredExpenses.length + store.livingExpenses.length;
  const hasPaycheck = Number(store.paycheck.amount) > 0;
  const parts = [
    hasPaycheck ? 'the paycheck' : '',
    store.debts.length > 0 ? plural(store.debts.length, 'debt', 'debts') : '',
    expenses > 0 ? plural(expenses, 'expense', 'expenses') : '',
    store.goals.length > 0 ? plural(store.goals.length, 'goal', 'goals') : '',
  ].filter(Boolean);
  if (parts.length === 0) return '';
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
  return ` This replaces ${list} you have already entered on this device.`;
}

export function describeLosses(store: DebtStore): string {
  const lost = store.pendingDataRepairs.filter((r) => r.kind !== 'recovered');
  if (lost.length === 0) return '';
  const rows = lost.filter((r) => r.field.startsWith('(')).length;
  const fields = lost.length - rows;
  const parts = [
    fields > 0 ? plural(fields, 'amount', 'amounts') : '',
    rows > 0 ? plural(rows, 'whole row', 'whole rows') : '',
  ].filter(Boolean);
  return ` ⚠️ ${parts.join(' and ')} in this backup could not be read.`;
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
function migrated(kind: BackupKind, value: unknown, legacy?: LegacyMapReport, exportedAt?: string): ReadBackupResult {
  try {
    return {
      ok: true,
      kind,
      store: runMigrations(value),
      ...(legacy ? { legacy } : {}),
      ...(exportedAt ? { exportedAt } : {}),
    };
  } catch {
    return { ok: false, kind, reason: 'unreadable', message: UNREADABLE };
  }
}
