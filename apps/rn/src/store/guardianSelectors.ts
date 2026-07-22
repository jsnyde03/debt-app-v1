import { buildGuardianBrief, type GuardianBrief, type GuardianState } from '@core/guardian/buildGuardianBrief';

import type { DebtStore } from '@/data/models';

import { selectExtraToDebt } from './planSelectors';
import { rankDebts, selectCashTimeline } from './payoffSelectors';
import { selectAllocation } from './selectors';

export type { GuardianBrief, GuardianState };

/** "Aug 5" — mirrors the cash-flow bars' label so the Guardian's lookahead reads consistently. */
function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The Payday Cushion Guardian for THIS paycheck (2.4) — the premium headline "am I going to make it
 * this paycheck?". Reads the SAME projected cushion the cash-flow bars show (`selectCashTimeline`
 * cycle 0), so the Guardian never contradicts them. Pass the PROJECTED store (premium) so the read is
 * off where the user actually is; on the raw store it answers off the last-verified anchor (free).
 * `null` before there's a plan or once debt-free (the cushion-vs-debt framing no longer applies).
 */
export function selectPaydayGuardian(store: DebtStore): GuardianBrief | null {
  const allocation = selectAllocation(store);
  if (!allocation) return null;
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  if (liveDebts.length === 0) return null;

  const cycles = selectCashTimeline(store, 3);
  if (cycles.length === 0) return null;
  const thisCycle = cycles[0];

  // The nearest upcoming cycle that isn't clear — the proactive forewarning ("next month looks tight").
  const upcoming = cycles.slice(1).find((c) => c.cushionStatus !== 'stable');

  return buildGuardianBrief({
    thisCushion: thisCycle.endingBalance,
    thisStatus: thisCycle.cushionStatus,
    shortfall: allocation.shortfall,
    safeExtra: selectExtraToDebt(allocation),
    focusDebtName: rankDebts(liveDebts, store.payoffStrategy)[0]?.name,
    lookahead: upcoming
      ? { status: upcoming.cushionStatus, cushion: upcoming.endingBalance, label: shortDate(upcoming.cycleStart) }
      : undefined,
  });
}
