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

/**
 * Pay Cycle History rows, most-recent-first. B.8 ships this UNGATED (free surface); the tier-aware
 * slice (free lock + Premium 6-cycle cap + Premium+ full history) wires in at Phase C with the
 * revenue spine — see V17_PLAN. Snapshots are appended chronologically by the rollover handler.
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
