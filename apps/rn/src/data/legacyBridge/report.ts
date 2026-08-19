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
  /** Rows that would not decode and were dropped. Non-zero means the migration is INCOMPLETE. */
  droppedRows: number;
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
