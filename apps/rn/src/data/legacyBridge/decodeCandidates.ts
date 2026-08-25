import { attributeDroppedRows, pickLegacyStore, type LegacyStoreCandidate } from './webkitLocalStorage';
import type { LegacyReadReport } from './report';

/**
 * ⛔ **[P6.8.9.7.11.13.7 · J1-5] THE DECISION MOVED HERE BECAUSE NOTHING COULD REACH IT WHERE IT WAS.**
 *
 * `attributeDroppedRows` and `pickLegacyStore` are pure and covered — and their **call site** lived in
 * `readLegacyStores.ts`, which imports `expo-file-system` and `expo-sqlite` and therefore cannot be loaded
 * by the app-layer runner at all. `realContainer.test.ts` re-implements the read path over `node:sqlite`
 * for exactly that reason. So the three lines that decide *which number becomes a user-facing claim* were
 * executed by nothing off a device: reverting them to the pre-`.11.4` `report.droppedRows += result.dropped`
 * left **every suite in this repo green**.
 *
 * ⚡ **That is `.11.11`'s lesson one layer up — a tested helper is not a used helper** — and the fix is the
 * same shape `findLegacyStores` already uses: the I/O is injected, so the decision runs anywhere.
 * `readLegacyStores` keeps only what genuinely needs a device.
 *
 * ⚠️ The whole partial report is returned and `Object.assign`ed by the caller rather than copied field by
 * field, so there is no per-field wiring left to get wrong.
 */

/** What opening one candidate database yields — the device half's output, and this module's only input. */
export interface OpenedCandidate {
  path: string;
  rows: number;
  legacyKeys: number;
  error?: string;
  /** Present only when the database decoded. */
  items?: Record<string, string>;
  /** Rows that would not decode. ⚠️ Rides WITH the candidate so it can be attributed after the pick. */
  dropped?: number;
}

export type ReadOneDatabase = (sourceUri: string, index: number) => Promise<OpenedCandidate>;

export type DecodedCandidates = Pick<LegacyReadReport, 'opened' | 'store' | 'droppedRows' | 'droppedRowsOtherCandidates'>;

export async function decodeCandidates(candidates: readonly string[], readOne: ReadOneDatabase): Promise<DecodedCandidates> {
  // `dropped` rides WITH the candidate so the count can be attributed to whichever database is picked.
  // Summing it across all of them (the first cut) reports another app's undecodable rows as the user's.
  const decoded: (LegacyStoreCandidate & { dropped: number })[] = [];
  const opened: DecodedCandidates['opened'] = [];

  for (let i = 0; i < candidates.length; i++) {
    const result = await readOne(candidates[i], i);
    opened.push({
      path: result.path,
      rows: result.rows,
      legacyKeys: result.legacyKeys,
      ...(result.error ? { error: result.error } : {}),
    });
    if (result.items) decoded.push({ path: result.path, items: result.items, dropped: result.dropped ?? 0 });
  }

  const store = pickLegacyStore(decoded);
  /**
   * ⛔ **ATTRIBUTED AFTER THE PICK, NOT SUMMED BEFORE IT.** [P6.8.9.7.11.4] `droppedRows` feeds a
   * user-facing repair line — *"N row(s) of your old data could not be read and were not carried over"* —
   * and it was the total across every candidate database, computed before `pickLegacyStore` decided which
   * one was the user's. The decode counts **any** undecodable row with no `debtPlanner.*` filter, so an
   * upgrader whose WebKit container holds a second app's database was told they had lost data they never
   * had.
   *
   * ⚠️ **And reporting zero when there is no pick is worse**, which is why `attributeDroppedRows` falls
   * back to the total: the no-pick case includes the user's own database opening with every row
   * undecodable, and this counter is then the only evidence anything was there.
   */
  return { opened, store, ...attributeDroppedRows(decoded, store?.path) };
}
