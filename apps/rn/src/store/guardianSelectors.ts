import { buildGuardianBrief, type GuardianBrief, type GuardianState } from '@core/guardian/buildGuardianBrief';
import { ESTIMATE_AGING_DAYS, ESTIMATE_STALE_DAYS, type EstimateStaleness } from '@core/debt/projectCurrentBalance';

import type { DebtStore } from '@/data/models';

import { classifyFreshness, daysBetweenISO, deriveConfidenceContext } from './guardianPredictionCore';
import { selectDiscretionary, selectExtraToDebt, selectLiquidCushion } from './planSelectors';
import { rankDebts, selectCashTimeline } from './payoffSelectors';
import { selectAllocation } from './selectors';

export type { GuardianBrief, GuardianState };

/**
 * §2.0 read-freshness (2.4.D.7) — how stale THIS read's inputs are, off the store-level `inputsAsOf`
 * stamp, NOT per-debt `lastVerifiedDate`. This is the seam that stops a rolled-over / auto-maintained
 * debt (whose `lastVerifiedDate` deliberately ages) from tripping the Guardian's staleness hedge: as
 * long as the user recently touched real inputs, the read stays fresh. Same day-thresholds as per-debt
 * staleness. The §2.0 voice-hedge / hard cutoff (buildGuardianBrief) consumes this at 2.4.6.1.3.
 */
export function selectReadFreshness(store: DebtStore, asOfDate?: string): EstimateStaleness {
  const today = asOfDate ?? store.paycheck.currentDate;
  return classifyFreshness(daysBetweenISO(store.inputsAsOf, today), ESTIMATE_AGING_DAYS, ESTIMATE_STALE_DAYS);
}

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

  // The nearest upcoming cycle that isn't clear — the proactive forewarning ("next month looks tight").
  const upcoming = cycles.slice(1).find((c) => c.cushionStatus !== 'stable');

  // Focus = the debt the ACTUAL allocation sends the extra to FIRST (2.4.6.1.4), not a fresh `rankDebts`
  // — the engine ranks AFTER this cycle's paid minimums / skips already-cleared debts, so a raw re-rank
  // can name the wrong debt. Fall back to the raw rank only when nothing deploys (copy doesn't use it then).
  const snowballItems = allocation.allocations.filter((a) => a.category === 'snowball');
  const focusDebtName =
    (snowballItems[0] && store.debts.find((d) => d.id === (snowballItems[0].debtId ?? snowballItems[0].targetId))?.name) ||
    rankDebts(liveDebts, store.payoffStrategy)[0]?.name;

  return buildGuardianBrief({
    isPremium: store.subscriptionPlan === 'premium',
    // The user's cushion line — premium is held to it; for free it's the healthy line they're not on.
    floor: store.cushionFloor ?? 200,
    // Headroom after every obligation drives the band (a choice to deploy to debt isn't a risk). The
    // plan reserves the floor for premium (effectivePaycheckBuffer), so `kept` = the protected cushion.
    discretionary: selectDiscretionary(allocation),
    kept: selectLiquidCushion(allocation),
    deployedToDebt: selectExtraToDebt(allocation),
    // The extra fills debts in strategy order, so it spans >1 when it exceeds the focus debt's balance.
    deploySpread: snowballItems.length > 1,
    shortfall: allocation.shortfall,
    focusDebtName,
    lookahead: upcoming
      ? { status: upcoming.cushionStatus, cushion: upcoming.endingBalance, label: shortDate(upcoming.cycleStart) }
      : undefined,
    priorBand: store.priorGuardianBand,
    // §2.0.d voice gate (2.4.6.1.3): read-freshness (all tiers — a stale read is honestly deferred) +
    // the live learning holdbacks (premium only — free doesn't act/learn, so no learning hedge).
    confidence: {
      freshness: selectReadFreshness(store),
      ...(store.subscriptionPlan === 'premium' ? deriveConfidenceContext(store) : {}),
    },
  });
}
