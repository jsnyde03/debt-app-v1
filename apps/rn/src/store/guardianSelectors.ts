import { buildGuardianBrief, type GuardianBrief, type GuardianState } from '@core/guardian/buildGuardianBrief';
import { scoreCalibration, type CalibrationScore } from '@core/guardian/calibrationScore';
import { ESTIMATE_AGING_DAYS, ESTIMATE_STALE_DAYS, type EstimateStaleness } from '@core/debt/projectCurrentBalance';

import type { DebtStore } from '@/data/models';

import { classifyFreshness, daysBetweenISO, deriveConfidenceContext } from './guardianPredictionCore';
import { selectDeployedToSavings, selectDiscretionary, selectExtraToDebt, selectHeldReserve, selectLiquidCushion } from './planSelectors';
import { rankDebts, selectCashTimeline } from './payoffSelectors';
import { selectAllocation, selectPaycheckMissed } from './selectors';

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

export type { CalibrationScore };

/**
 * §2.9 calibration scorecard (2.4.9) — the Guardian's proven accuracy for the user's CURRENT regime
 * (debt vs debt-free, never blended), off the CONFIRMED cycle history. Runs SILENTLY every cycle (the
 * substrate stamps predictions + folds outcomes at rollover); `score.proven` (n ≥ N) gates whether the
 * surface shows a number or the §2.0.d day-one-protection state — never an apology, never a hollow
 * pre-proof figure. Fixed income counts only genuine risk-events (F-trust #5). Premium value; the
 * surface (2.4.9.6) applies the tier gate.
 */
export function selectCalibrationScore(store: DebtStore): CalibrationScore {
  const debtFree = store.debts.filter((d) => d.balance > 0).length === 0;
  return scoreCalibration(store.cycleHistory, {
    incomeVaries: store.paycheck.incomeVaries === true,
    debtFree,
    missedCycleEndDates: store.missedArrivals,
  });
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
 * `null` before there's a plan. It PERSISTS past debt-free (2.4.8 graduation): the framing shifts from
 * cushion-vs-debt to cushion-vs-savings (the spare now tops up the emergency fund / goals / wealth), so
 * the premium headline keeps running instead of going dark exactly when the user has earned it.
 */
export function selectPaydayGuardian(store: DebtStore): GuardianBrief | null {
  const allocation = selectAllocation(store);
  if (!allocation) return null;
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  // 2.4.8 — the Guardian no longer nulls at debt-free; it re-targets the spare to savings/wealth.
  const debtFree = liveDebts.length === 0;

  const cycles = selectCashTimeline(store, 3);
  if (cycles.length === 0) return null;

  // The nearest upcoming cycle that isn't clear — the proactive forewarning ("next month looks tight").
  const upcoming = cycles.slice(1).find((c) => c.cushionStatus !== 'stable');

  // Where the spare lands. WITH debt: the focus is the debt the ACTUAL allocation sends the extra to
  // FIRST (2.4.6.1.4), not a fresh `rankDebts` (the engine ranks AFTER paid minimums / skips cleared
  // debts, so a raw re-rank can name the wrong debt). DEBT-FREE: the first "put to work" bucket names
  // the savings destination (EF → goals), so the copy reads "toward your Emergency Fund".
  const snowballItems = allocation.allocations.filter((a) => a.category === 'snowball');
  const savingsItems = allocation.allocations.filter(
    (a) => a.category === 'starter_emergency' || a.category === 'emergency' || a.category === 'optional_goal',
  );
  const focusDebtName = debtFree
    ? undefined
    : (snowballItems[0] && store.debts.find((d) => d.id === (snowballItems[0].debtId ?? snowballItems[0].targetId))?.name) ||
      rankDebts(liveDebts, store.payoffStrategy)[0]?.name;
  const deployTargetName = debtFree
    ? (savingsItems[0] && store.goals.find((g) => g.id === savingsItems[0].goalId)?.name) || undefined
    : undefined;

  return buildGuardianBrief({
    isPremium: store.subscriptionPlan === 'premium',
    debtFree,
    // The user's cushion line — premium is held to it; for free it's the healthy line they're not on.
    floor: store.cushionFloor ?? 200,
    // Headroom after every obligation drives the band (a choice to deploy isn't a risk). The plan
    // reserves the floor for premium (effectivePaycheckBuffer), so `kept` = the protected cushion.
    discretionary: selectDiscretionary(allocation),
    kept: selectLiquidCushion(allocation),
    heldReserve: selectHeldReserve(allocation),
    // The "deployed" figure: extra-to-debt while owing, spare-to-savings once debt-free (2.4.8).
    deployedToDebt: debtFree ? selectDeployedToSavings(allocation) : selectExtraToDebt(allocation),
    // The extra fills targets in order, so it spans >1 when it exceeds the first target's need.
    deploySpread: debtFree ? savingsItems.length > 1 : snowballItems.length > 1,
    shortfall: allocation.shortfall,
    focusDebtName,
    deployTargetName,
    lookahead: upcoming
      ? { status: upcoming.cushionStatus, cushion: upcoming.endingBalance, label: shortDate(upcoming.cycleStart) }
      : undefined,
    priorBand: store.priorGuardianBand,
    // §2.3.1 (2.4.7.7): a missed paycheck pauses deploy + reframes the read honestly (no phantom clear).
    pausedDeploy: selectPaycheckMissed(store),
    // §2.0.d voice gate (2.4.6.1.3): read-freshness (all tiers — a stale read is honestly deferred) +
    // the live learning holdbacks (premium only — free doesn't act/learn, so no learning hedge).
    confidence: {
      freshness: selectReadFreshness(store),
      ...(store.subscriptionPlan === 'premium' ? deriveConfidenceContext(store) : {}),
    },
  });
}
