import type { LegacyStoreCandidate } from './webkitLocalStorage';

/**
 * 5.1b.3 — what the legacy read found, and what it could not see.
 *
 * The shape lives in its own module so the native reader and its web counterpart share ONE definition
 * rather than two that agree until they don't — the drift class T8 spent a day on.
 *
 * ⛔ Every field that distinguishes **"there is nothing"** from **"I could not look"** is here on
 * purpose. `store: null` alone is ambiguous, and acting on the wrong reading is how a bridge skips a
 * real user's data: `truncated` says a cap or an unrecognised container shape stopped the search,
 * `visited` says whether the walk ran at all, and `opened[].error` says a database was found and
 * refused. `hydrate` already draws this distinction one layer up; this keeps it drawn one layer down.
 */
export interface LegacyReadReport {
  /** `false` on web, where there is no container to read and no legacy install to upgrade from. */
  supported: boolean;
  /** The derived `Library/WebKit` path, or `null` when the cache path was not the documented shape. */
  webkitRoot: string | null;
  /** Directories the walk actually visited — `0` with no candidates means the tree was not there. */
  visited: number;
  /** ⛔ A cap stopped the search, or the root could not be derived: the result is a floor, not an answer. */
  truncated: boolean;
  /** Every localStorage database found, before any of them were opened. */
  candidates: string[];
  /** One row per database opened, including the ones that failed and why. */
  opened: { path: string; rows: number; legacyKeys: number; error?: string }[];
  /** The database judged to be ours, decoded — or `null` when none held a `debtPlanner.*` key. */
  store: LegacyStoreCandidate | null;
  /**
   * Rows that would not decode **in the database judged to be ours — or across all candidates when none
   * was judged ours.** Non-zero means the migration is INCOMPLETE, and because P6.8.9.7.6 wired this to a
   * user-facing line, it has to mean exactly that.
   *
   * ⛔ **Two failure directions, and the second is the one that costs data.** Summing across every
   * candidate tells an upgrader whose container holds a second app's database that they lost rows that
   * were never theirs. But attributing to the pick and reporting **zero** when there is no pick is worse:
   * the case with no pick includes the user's own database opening with **every row undecodable**, which
   * `migrateFromLegacy` then reads as *a fresh install*. This counter is the only evidence left.
   * So: attribute when there is something to attribute to, and otherwise report everything.
   * (P6.8.9.7.10 · C-1 → P6.8.9.7.11.9 · C-1.)
   */
  droppedRows: number;
  /**
   * The same count across the candidates that were NOT picked. Diagnostics only — never shown to a user,
   * because rows in someone else's database are not their loss. Kept because it is genuinely useful when
   * `pickLegacyStore` chose wrong, which is the failure this separation makes visible instead of hiding.
   *
   * ⚠️ **Optional deliberately.** `droppedRows` is required because it is a claim to the user and every
   * producer owes it; this one is a debugging aid, and absent means "not measured" rather than "zero".
   * Making it required would force a meaningless value into every construction site, most of which never exercise it.
   */
  droppedRowsOtherCandidates?: number;
}

/**
 * A one-line summary for the on-device probe readout and the Maestro assertion.
 *
 * ⚠️ Written as a single flat string on purpose: a Maestro flow asserts on rendered text, and a value
 * spread across several elements is a selector that breaks when the layout moves. The `keys=` figure is
 * the one that matters — it is the count the bridge would migrate.
 */
export function summariseLegacyRead(report: LegacyReadReport): string {
  if (!report.supported) return 'legacy-read: unsupported';
  const keys = report.store ? Object.keys(report.store.items).length : 0;
  return [
    `legacy-read: found=${report.candidates.length}`,
    `opened=${report.opened.length}`,
    `keys=${keys}`,
    `dropped=${report.droppedRows}`,
    `visited=${report.visited}`,
    `truncated=${report.truncated ? 'yes' : 'no'}`,
  ].join(' ');
}
