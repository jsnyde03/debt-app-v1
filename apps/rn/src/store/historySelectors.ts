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

/** The progress-anchor stat for the History header — total debt paid down across all recorded cycles. */
export interface HistorySummary {
  /** Debt reduction from the oldest recorded cycle to the newest (0 if <2 cycles or debt grew net). */
  paidDown: number;
  cycleCount: number;
}

/** Total "how far you've come" across the whole (uncapped) history. */
export function selectHistorySummary(store: DebtStore): HistorySummary {
  const h = store.cycleHistory; // chronological (oldest first)
  const cycleCount = h.length;
  const paidDown = cycleCount >= 2 ? Math.max(0, h[0].totalDebtBalance - h[cycleCount - 1].totalDebtBalance) : 0;
  return { paidDown, cycleCount };
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
