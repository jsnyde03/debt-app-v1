import { buildAmortizationSchedule, type AmortizationSchedule } from '@core/debt/buildAmortizationSchedule';
import { buildPayoffTrajectory, type TrajectoryPoint } from '@core/debt/buildPayoffTrajectory';
import { buildExtraPaymentAllocationPlan, type ExtraPaymentAllocationItem } from '@core/debt/extraPaymentPlan';
import { projectDebtPayoff } from '@core/debt/projectDebtPayoff';
import { buildSmartInsights, type SmartInsight } from '@core/insights/buildSmartInsights';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import type { Debt, DebtStore, PayoffStrategy } from '@/data/models';

import { selectExtraToDebt } from './planSelectors';
import { rankDebts } from './payoffSelectors';
import { selectAllocation, type Allocation } from './selectors';

export type { SmartInsight, AmortizationSchedule, ExtraPaymentAllocationItem };

/**
 * The shared derivation layer for the free analysis tools (What-If · Forecast · Smart Insights ·
 * Amortization). Ports the projection logic the old Capacitor `SnowballSection` computed inline in
 * render; each function is a pure `(store) => view` selector built only on the tested `@core`
 * engines, matching the `payoffSelectors`/`planSelectors` pattern. Call these in render off the
 * stable store ref (never inside a zustand selector — they build fresh objects each call).
 *
 * The debt basis is `store.debts.filter(balance > 0)` throughout — the SAME basis the shipped
 * payoff view + trajectory chart use, so What-If's baseline debt-free date lines up with the
 * trajectory endpoint it's paired with (rather than re-deriving a completed-payments basis the
 * shipped RN selectors deliberately don't model).
 */

/** The common plan figures every analysis selector needs, derived once from the allocation. */
interface PlanBasis {
  liveDebts: Debt[];
  allocation: Allocation | null;
  /** Recommended extra to debt, per PAY CYCLE (feeds per-cycle consumers: buffer, safe-extra). */
  perCycleExtra: number;
  /** Recommended extra to debt, per MONTH (feeds all month-stepped projections). */
  monthlyExtra: number;
  /** This cycle's cash cushion after the recommended plan (safe extra − shortfall). */
  projectedBuffer: number;
  currentDate: string;
  strategy: PayoffStrategy;
}

function derivePlanBasis(store: DebtStore): PlanBasis {
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  const allocation = selectAllocation(store);
  const perCycleExtra = allocation ? selectExtraToDebt(allocation) : 0;
  const monthlyExtra = perCycleExtra * payCyclesPerMonth(store.paycheck.payCycle);
  const projectedBuffer = perCycleExtra - (allocation?.shortfall ?? 0);
  return {
    liveDebts,
    allocation,
    perCycleExtra,
    monthlyExtra,
    projectedBuffer,
    currentDate: store.paycheck.currentDate,
    strategy: store.payoffStrategy,
  };
}

// ── Strategy comparison (snowball vs. avalanche) ─────────────────────────────────
// Shared by What-If ("Recommended" resolution) and Smart Insights (its interest/date inputs).

export interface StrategyComparison {
  canEstimate: boolean;
  snowballDate: string;
  avalancheDate: string;
  snowballInterest: number;
  avalancheInterest: number;
  snowballMonths: number;
  avalancheMonths: number;
  /** Which finishes sooner (null when they tie or can't be estimated). */
  fasterStrategy: PayoffStrategy | null;
  /** Which pays less total interest (null when they tie or can't be estimated). */
  lowerInterestStrategy: PayoffStrategy | null;
  /** The one to recommend: lower-interest, else faster, else the user's current pick. */
  recommendedStrategy: PayoffStrategy;
  interestDifference: number;
  monthDifference: number;
}

/** Project both strategies at the recommended monthly extra and compare them. */
export function selectStrategyComparison(store: DebtStore): StrategyComparison {
  const { liveDebts, monthlyExtra, currentDate, strategy } = derivePlanBasis(store);

  const project = (s: PayoffStrategy) =>
    projectDebtPayoff({ debts: liveDebts, monthlyExtraPayment: monthlyExtra, strategy: s, startDate: currentDate });

  const snowball = project('snowball');
  const avalanche = project('avalanche');
  const canEstimate =
    liveDebts.length > 0 &&
    snowball.estimatedDebtFreeDate !== 'Unable to estimate' &&
    avalanche.estimatedDebtFreeDate !== 'Unable to estimate';

  const fasterStrategy =
    canEstimate && snowball.monthsToDebtFree !== avalanche.monthsToDebtFree
      ? snowball.monthsToDebtFree < avalanche.monthsToDebtFree
        ? 'snowball'
        : 'avalanche'
      : null;

  const lowerInterestStrategy =
    canEstimate && snowball.totalInterestPaid !== avalanche.totalInterestPaid
      ? snowball.totalInterestPaid < avalanche.totalInterestPaid
        ? 'snowball'
        : 'avalanche'
      : null;

  return {
    canEstimate,
    snowballDate: snowball.estimatedDebtFreeDate,
    avalancheDate: avalanche.estimatedDebtFreeDate,
    snowballInterest: snowball.totalInterestPaid,
    avalancheInterest: avalanche.totalInterestPaid,
    snowballMonths: snowball.monthsToDebtFree,
    avalancheMonths: avalanche.monthsToDebtFree,
    fasterStrategy,
    lowerInterestStrategy,
    recommendedStrategy: lowerInterestStrategy ?? fasterStrategy ?? strategy,
    interestDifference: Math.abs(snowball.totalInterestPaid - avalanche.totalInterestPaid),
    monthDifference: Math.abs(snowball.monthsToDebtFree - avalanche.monthsToDebtFree),
  };
}

// ── What-If simulator ────────────────────────────────────────────────────────────

export interface WhatIfResult {
  /** False → the "can't estimate yet" empty state (no plan, or a debt that never amortizes). */
  canEstimate: boolean;
  /** Debt-free date under the current plan (no extra) — the "before". */
  baselineDate: string | null;
  /** Debt-free date with the simulated extra added — the "after". */
  simulatedDate: string | null;
  monthsSaved: number;
  daysSaved: number;
  interestSaved: number;
  /** Where the simulated extra lands, debt by debt (in the plan's payoff order). */
  allocation: ExtraPaymentAllocationItem[];
  /** The debt the first simulated dollar hits (for the "applies to X" line). */
  targetDebtName: string | null;
  /** The simulated payoff curve (extra applied) — overlaid on the trajectory chart to show the shift. */
  simulatedTrajectory: TrajectoryPoint[];
  /** Suggested top of the What-If slider — a nice round value scaled to the plan, so the range is useful. */
  sliderMax: number;
}

/**
 * Simulate an EXTRA MONTHLY payment on top of the current plan. `extraMonthly` is already a monthly
 * figure (the input is "Extra Monthly Payment"), added to the monthly base directly. Runs under the
 * store's current payoff strategy — the same strategy the trajectory it overlays is drawn in — so
 * the "with extra" curve is an honest apples-to-apples shift of the plan, not a strategy swap.
 */
export function selectWhatIf(store: DebtStore, extraMonthly: number): WhatIfResult {
  const { liveDebts, monthlyExtra, currentDate, strategy } = derivePlanBasis(store);
  const extra = Math.max(0, extraMonthly);

  const baseline = projectDebtPayoff({ debts: liveDebts, monthlyExtraPayment: monthlyExtra, strategy, startDate: currentDate });
  const simulated = projectDebtPayoff({ debts: liveDebts, monthlyExtraPayment: monthlyExtra + extra, strategy, startDate: currentDate });

  const canEstimate =
    liveDebts.length > 0 &&
    baseline.estimatedDebtFreeDate !== 'Unable to estimate' &&
    simulated.estimatedDebtFreeDate !== 'Unable to estimate';

  const monthsSaved = canEstimate ? Math.max(0, baseline.monthsToDebtFree - simulated.monthsToDebtFree) : 0;
  const interestSaved = canEstimate ? Math.max(0, baseline.totalInterestPaid - simulated.totalInterestPaid) : 0;

  const allocation = buildExtraPaymentAllocationPlan({ debts: liveDebts, amount: extra, strategy });
  // Only build the overlay curve when there's a real extra to visualize (else it duplicates the plan line).
  const simulatedTrajectory =
    extra > 0 && liveDebts.length > 0
      ? buildPayoffTrajectory({ debts: liveDebts, monthlyExtraPayment: monthlyExtra + extra, strategy })
      : [];

  return {
    canEstimate,
    baselineDate: canEstimate ? baseline.estimatedDebtFreeDate : null,
    simulatedDate: canEstimate ? simulated.estimatedDebtFreeDate : null,
    monthsSaved,
    daysSaved: monthsSaved * 30,
    interestSaved,
    allocation,
    targetDebtName: allocation[0]?.debtName ?? rankDebts(liveDebts, strategy)[0]?.name ?? null,
    simulatedTrajectory,
    // Scale the slider to the plan (≈3× the current extra), floor $500, cap $5k, rounded to $100.
    sliderMax: Math.min(5000, Math.max(500, Math.ceil((monthlyExtra * 3) / 100) * 100)),
  };
}

// ── Smart Insights ───────────────────────────────────────────────────────────────

/** The prioritized guidance list (the free pull-readout; the premium Guardian is the push layer). */
export function selectSmartInsights(store: DebtStore): SmartInsight[] {
  const { liveDebts, perCycleExtra, projectedBuffer } = derivePlanBasis(store);
  if (liveDebts.length === 0) return [];
  const comparison = selectStrategyComparison(store);
  return buildSmartInsights({
    safeExtraPayment: perCycleExtra,
    projectedBuffer,
    debts: liveDebts,
    snowballDebtFreeDate: comparison.snowballDate,
    avalancheDebtFreeDate: comparison.avalancheDate,
    snowballInterest: comparison.snowballInterest,
    avalancheInterest: comparison.avalancheInterest,
  });
}

// Forecast: intentionally NOT surfaced. The shipped Cash-Flow "Cushion" view (`selectCashTimeline`,
// per-pay-cycle ending balance + stable/tight/pressure) already delivers the free forecast job at a
// higher bar than the old monthly `projectForecast` — a separate module would duplicate it (2.2.3
// before-scan, Jason 2026-07-22). `projectForecast`'s only distinct bit (upcoming relief) is routed
// to Smart Insights (2.2.5) + the Phase-3 trajectory waypoints + the premium Guardian (2.4).

// ── Amortization schedule (per debt) ─────────────────────────────────────────────

export interface DebtAmortization {
  debt: Debt;
  schedule: AmortizationSchedule;
  /** The monthly payment the schedule assumes: minimum + (if this is the focus debt) the extra. */
  monthlyPayment: number;
  isFocus: boolean;
  /** First month of the schedule — row N's date = this + N months (for the sheet's month labels). */
  startDate: string;
}

/** A single debt's month-by-month payoff schedule at its minimum + (if it's the focus) the extra. */
export function selectDebtAmortization(store: DebtStore, debtId: string): DebtAmortization | null {
  const { liveDebts, monthlyExtra, strategy, currentDate } = derivePlanBasis(store);
  const debt = liveDebts.find((d) => d.id === debtId);
  if (!debt) return null;
  const isFocus = rankDebts(liveDebts, strategy)[0]?.id === debt.id;
  // Only the focus debt receives the recommended extra; others amortize at their minimum.
  const monthlyPayment = debt.minimumPayment + (isFocus ? monthlyExtra : 0);
  const schedule = buildAmortizationSchedule({
    balance: debt.balance,
    // BNPL carries no interest — mirror the old app's `apr: 0` so the schedule reconciles.
    apr: debt.type === 'bnpl' ? 0 : debt.apr,
    monthlyPayment,
  });
  return { debt, schedule, monthlyPayment, isFocus, startDate: currentDate };
}
