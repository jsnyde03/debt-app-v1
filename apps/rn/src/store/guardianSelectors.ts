import { buildGuardianBrief, type GuardianBrief, type GuardianState } from '@core/guardian/buildGuardianBrief';
import { scoreCalibration, type CalibrationScore } from '@core/guardian/calibrationScore';
import { decideRiskNotification, type NotifyDecision } from '@core/guardian/notificationDecision';
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

export type { NotifyDecision };

/**
 * §2.8 (2.4.10) — should a proactive RISK push fire for the current cycle? Premium-only ("watches every
 * paycheck" is premium value). Pass the PROJECTED store (the premium read). Off the Guardian band + the
 * notify substrate (`currentCycleNotifyState` + `pushLog`); `now` is injected (no clock in a selector).
 */
export function selectRiskNotification(store: DebtStore, now: string): NotifyDecision {
  if (store.subscriptionPlan !== 'premium') return { fire: false, level: 'clear', reason: 'not-risk' };
  const brief = selectPaydayGuardian(store);
  return decideRiskNotification({
    band: brief?.state ?? 'clear',
    cycleEndDate: store.paycheck.nextPaycheckDate,
    lastNotified: store.currentCycleNotifyState,
    pushLog: store.pushLog,
    now,
  });
}

/**
 * §2.8 reconcile-to-clear (2.4.10.2) — the user got a risk heads-up for THIS cycle, but the read now
 * reconciles to clear. Acknowledge it in-app ("good news — looks clear after all") so a heads-up that
 * didn't pan out never reads as cried-wolf. Pass the projected store; premium-only.
 */
export function selectRiskAcknowledgment(store: DebtStore): boolean {
  if (store.subscriptionPlan !== 'premium') return false;
  const notified = store.currentCycleNotifyState;
  if (!notified || notified.forCycleEndDate !== store.paycheck.nextPaycheckDate) return false;
  return selectPaydayGuardian(store)?.state === 'clear';
}

export interface ReserveRelease {
  tapped: boolean;
  covered: number;
  /** Where the freed reserve now goes to work — the focus debt, or "your savings" once debt-free. */
  targetName: string;
}

/**
 * §2.0.c settling-in reserve release (2.4.11.4b) — the one-time insurance-framed acknowledgment shown
 * when the settling-in reserve has just freed (the held → free transition is detected + stamped at
 * rollover). Premium only; `null` until a release is pending, and after the user dismisses it.
 */
export function selectReserveRelease(store: DebtStore): ReserveRelease | null {
  if (store.subscriptionPlan !== 'premium') return null;
  const pending = store.pendingReserveRelease;
  if (!pending) return null;
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  const focus = liveDebts.length > 0 ? rankDebts(liveDebts, store.payoffStrategy)[0]?.name : undefined;
  const targetName = liveDebts.length === 0 ? 'your savings' : focus ? `your ${focus}` : 'your debt';
  return { tapped: pending.tapped, covered: pending.covered, targetName };
}

/**
 * §2.0.c "bills complete" attestation affordance (2.4.11.4c) — show it while a DISCOVERY safety net is
 * being held (premium): the user can confirm their bills are all entered to hold a reduced reserve.
 * `attested` reflects the current state so the card's copy reads confirm-vs-undo.
 */
export function selectBillsAttestation(store: DebtStore): { show: boolean; attested: boolean } {
  if (store.subscriptionPlan !== 'premium') return { show: false, attested: false };
  return { show: deriveConfidenceContext(store).discoveryHoldbackActive === true, attested: store.billsAttested === true };
}

/** §2.0.c attestation walk-back notice (2.4.11.4c) — a surprise restored the safety net after the user
 *  attested. Premium; false until pending / after dismiss. */
export function selectReserveWalkback(store: DebtStore): boolean {
  return store.subscriptionPlan === 'premium' && store.pendingReserveWalkback === true;
}

export interface TrialConversion {
  id: string;
  name: string;
  fullAmount: number;
  /** Short cadence suffix for "$X{/mo}". */
  cadence: string;
}

/** §2.5 (2.5.4) short cadence label for the trial-conversion card ("$15.99/mo"). */
function cadenceLabel(recurrence: string): string {
  switch (recurrence) {
    case 'weekly': return '/wk';
    case 'biweekly': return '/2wks';
    case 'per-paycheck': return '/paycheck';
    case 'quarterly': return '/qtr';
    case 'annually': return '/yr';
    case 'monthly': return '/mo';
    default: return '';
  }
}

/**
 * §2.5 trial conversion (2.5.4) — the first trial obligation whose intro period has ENDED (its
 * `fullChargeDate` has arrived), still flagged `isTrial`. Once a trial converts, the resolver bills the
 * full price forever — correct if the user KEPT it, wrong (a phantom bill) if they CANCELLED. This drives
 * the Today "keep it or cancel it?" card that resolves the ambiguity, so it's NOT premium-gated: a
 * cancelled trial would otherwise pollute the free forecast too. Returns null when nothing has converted.
 */
export function selectTrialConversion(store: DebtStore): TrialConversion | null {
  const today = store.paycheck.currentDate;
  const conv = store.requiredExpenses.find(
    (e) => e.isTrial && e.fullAmount != null && Number.isFinite(e.fullAmount) && !!e.fullChargeDate && e.fullChargeDate <= today,
  );
  if (!conv || conv.fullAmount == null) return null;
  return { id: conv.id, name: conv.name, fullAmount: conv.fullAmount, cadence: cadenceLabel(conv.recurrence) };
}

export interface TightTopUp {
  gap: number;
  available: number;
  topUp: number;
  goalId: string;
  goalName: string;
}

/** The top-up already applied for the CURRENT cycle (cycle-keyed → a stale one self-corrects). */
function appliedTopUp(store: DebtStore): number {
  return store.cycleTopUp?.forCycle === store.paycheck.nextPaycheckDate ? Math.max(0, store.cycleTopUp.amount) : 0;
}

/**
 * §2.10 tight-case one-tap (2.4.11.2) — when the cushion is under the floor but obligations are covered
 * (tight), and the user has savings to tap, the smallest move that HOLDS the line: move `topUp` from
 * `goalName` to checking. Premium only; `null` when not tight, already at/above the line (incl. after a
 * top-up), or there's no savings balance to draw from (→ the honest "rebuilds next paycheck" state).
 */
export function selectTightTopUp(store: DebtStore): TightTopUp | null {
  if (store.subscriptionPlan !== 'premium') return null;
  const allocation = selectAllocation(store);
  if (!allocation || allocation.shortfall > 0) return null;
  const floor = store.cushionFloor ?? 200;
  const cushion = selectDiscretionary(allocation) + appliedTopUp(store);
  const gap = Math.round((floor - cushion) * 100) / 100;
  if (gap <= 0) return null; // at or above the line already
  const goal = store.goals.find((g) => (g.type === 'emergency' || g.type === 'savings') && g.currentAmount > 0);
  if (!goal) return null;
  const topUp = Math.round(Math.min(gap, goal.currentAmount) * 100) / 100;
  if (topUp <= 0) return null;
  return { gap, available: goal.currentAmount, topUp, goalId: goal.id, goalName: goal.name };
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

  // §2.1 advice boundary (2.4.11.4a): the spare-to-debt move is a genuine EF-vs-debt tradeoff (→ a
  // two-sided-with-a-why voice) when a debt is live AND an emergency fund is underfunded AND the user
  // hasn't opted out via "savings elsewhere". Otherwise it's mechanical (single decisive voice).
  const efGoal = store.goals.find(
    (g) => g.type === 'emergency' && g.currentAmount < (g.targetAmount ?? Number.POSITIVE_INFINITY),
  );
  const deployTradeoff = !debtFree && !store.prefs.hasSavingsElsewhere && !!efGoal;

  // §2.10 tight-case top-up (2.4.11.2): cash the user moved from savings to hold the line THIS cycle
  // lifts the effective cushion (it's really in checking now) — so the read reflects the held line.
  const topUp = appliedTopUp(store);

  return buildGuardianBrief({
    isPremium: store.subscriptionPlan === 'premium',
    debtFree,
    // The user's cushion line — premium is held to it; for free it's the healthy line they're not on.
    floor: store.cushionFloor ?? 200,
    // Headroom after every obligation drives the band (a choice to deploy isn't a risk). The plan
    // reserves the floor for premium (effectivePaycheckBuffer), so `kept` = the protected cushion.
    discretionary: selectDiscretionary(allocation) + topUp,
    kept: selectLiquidCushion(allocation) + topUp,
    toppedUp: topUp > 0,
    heldReserve: selectHeldReserve(allocation),
    // The "deployed" figure: extra-to-debt while owing, spare-to-savings once debt-free (2.4.8).
    deployedToDebt: debtFree ? selectDeployedToSavings(allocation) : selectExtraToDebt(allocation),
    // The extra fills targets in order, so it spans >1 when it exceeds the first target's need.
    deploySpread: debtFree ? savingsItems.length > 1 : snowballItems.length > 1,
    shortfall: allocation.shortfall,
    focusDebtName,
    deployTargetName,
    deployTradeoff,
    tradeoffTargetName: efGoal?.name,
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
