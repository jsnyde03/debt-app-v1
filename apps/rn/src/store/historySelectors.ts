import { dayBefore } from '@core/utils/dayBefore';

import type { DebtStore, PayCycleSnapshot } from '@/data/models';

/** One finished pay cycle, shaped for the History list. */
export interface HistoryRow {
  key: string;
  /** The cycle's actual last day (the stored `cycleEndDate` is the next payday, an exclusive bound). */
  endDate: string;
  totalDebtBalance: number;
  totalPaidThisCycle: number;
  /** Debt change vs the chronologically-previous cycle: <0 = debt fell (progress), >0 = debt rose. */
  debtDelta: number;
}

/** The progress-anchor stat for the History header — total money put toward debt across all cycles. */
export interface HistorySummary {
  /** Money the user actually paid toward debt, summed across every recorded cycle. */
  paidDown: number;
  cycleCount: number;
}

/**
 * ⛔ **THE ONE OWNER OF "MONEY PUT TOWARD DEBT ACROSS THE HISTORY."** [S1.10.6.2 · pass-3 C-3]
 *
 * ⚡ **`guardianSelectors`' `totalToDebt` was already this expression**, and History had a second, different
 * one under the same word — the two-producers shape all three of `S1.10.6.1`'s blockers turned out to be.
 * Both callers now read this, so they cannot disagree.
 */
export function sumPaidToDebt(history: readonly PayCycleSnapshot[]): number {
  return Math.round(history.reduce((sum, s) => sum + Math.max(0, s.totalPaidThisCycle), 0) * 100) / 100;
}

/**
 * Total "how far you've come" across the whole (uncapped) history.
 *
 * ⛔ **DEBT REDUCTION AND MONEY PAID ARE DIFFERENT QUANTITIES, and this printed the first under the second
 * one's name.** [S1.10.6.2 · pass-3 C-3] It was `max(0, oldest.totalDebtBalance − newest.totalDebtBalance)`
 * — its own docstring said *"debt reduction"* — rendered by `history.tsx` as *"$2,923 **paid down** across
 * 3 cycles"* in success green. ⚡ **Measured end to end on a real store: delete a debt (a duplicated CSV
 * row, a card transferred away) and the app congratulates the user for $2,923 they never paid, three
 * inches above its own per-row *"$0 paid"*.** It diverges on every path that moves a balance without a
 * payment — `removeDebt` inflates it, `addDebt` zeroes it through the `max(0, …)` and hides real progress.
 *
 * ⚠️ **The remedy was checked separately from the premise, and the two candidates are not equivalent.**
 * Summing `totalPaidThisCycle` is *payments recorded*, so it excludes interest and can read LOWER than the
 * balance drop beside it; keeping the subtraction and renaming it *"less debt than when you started"* is
 * literally true and still credits a deletion to the user's effort on a screen whose job is congratulating
 * them. ⛔ The quantity that matches what the sentence MEANS is the money they paid, and it is immune to
 * both `addDebt` and `removeDebt` — so the subtraction goes, rather than the word.
 */
export function selectHistorySummary(store: DebtStore): HistorySummary {
  const h = store.cycleHistory; // chronological (oldest first)
  return { paidDown: sumPaidToDebt(h), cycleCount: h.length };
}

/**
 * Pay Cycle History rows, most-recent-first. **UNGATED + uncapped** — the 2026-07-21 premium reshape
 * makes history a generous FREE surface (no Premium cap / Premium+ full-history split; that old
 * tier plan is retired). Snapshots are appended chronologically by the rollover handler.
 */
export function selectHistoryRows(store: DebtStore): HistoryRow[] {
  const chronological = store.cycleHistory;
  return chronological
    .map((snapshot, index) => {
      const prior: PayCycleSnapshot | undefined = chronological[index - 1];
      return {
        key: `${snapshot.cycleEndDate}-${index}`,
        endDate: dayBefore(snapshot.cycleEndDate),
        totalDebtBalance: snapshot.totalDebtBalance,
        totalPaidThisCycle: snapshot.totalPaidThisCycle,
        debtDelta: prior ? snapshot.totalDebtBalance - prior.totalDebtBalance : 0,
      };
    })
    .reverse();
}
