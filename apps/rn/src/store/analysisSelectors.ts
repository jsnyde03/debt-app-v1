import { bnplMonthlyEquivalentMinimum } from '@core/debt/bnplPayoffPace';
import { buildAmortizationSchedule, type AmortizationSchedule } from '@core/debt/buildAmortizationSchedule';
import { buildPayoffTrajectory, type TrajectoryPoint } from '@core/debt/buildPayoffTrajectory';
import { buildExtraPaymentAllocationPlan, type ExtraPaymentAllocationItem } from '@core/debt/extraPaymentPlan';
import { DEBT_FREE_DATE_UNPAYABLE, projectDebtPayoff } from '@core/debt/projectDebtPayoff';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import type { Debt, DebtStore, PayoffStrategy } from '@/data/models';

import { selectExtraToDebt } from './planSelectors';
import { rankDebts } from './payoffSelectors';
import { selectAllocation, selectSteadyStateAllocation, type Allocation } from './selectors';

export type { AmortizationSchedule, ExtraPaymentAllocationItem };

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
  /** ⛔ [pass-5 A5-1] the user's real pay cadence — `per-paycheck` is one installment per CYCLE. */
  cyclesPerMonth: number;
}

function derivePlanBasis(store: DebtStore): PlanBasis {
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  const allocation = selectAllocation(store);
  const perCycleExtra = allocation ? selectExtraToDebt(allocation) : 0;
  // MF.4 (completed in round-2): month-stepped PROJECTIONS (What-If baseline, trajectory, amortization)
  // run on the STEADY-STATE deploy — same as the Payoff tab — so a cold-start discovery hold isn't
  // extrapolated across years and the What-If baseline date matches the Payoff endpoint. `perCycleExtra`
  // / `projectedBuffer` stay on the dampened allocation (they're this-cycle figures).
  const steady = selectSteadyStateAllocation(store);
  const cyclesPerMonth = payCyclesPerMonth(store.paycheck.payCycle);
  const monthlyExtra = (steady ? selectExtraToDebt(steady) : 0) * cyclesPerMonth;
  const projectedBuffer = perCycleExtra - (allocation?.shortfall ?? 0);
  return {
    liveDebts,
    allocation,
    perCycleExtra,
    monthlyExtra,
    projectedBuffer,
    currentDate: store.paycheck.currentDate,
    strategy: store.payoffStrategy,
    cyclesPerMonth,
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
/** PERF-2: the What-If BASELINE payoff (no extra) — invariant of the extra input, so the caller memoizes
 *  it on the store and passes it into `selectWhatIf`, keeping a keystroke to a single (simulated) sim. */
export function selectWhatIfBaseline(store: DebtStore): ReturnType<typeof projectDebtPayoff> {
  const { liveDebts, monthlyExtra, currentDate, strategy, cyclesPerMonth } = derivePlanBasis(store);
  return projectDebtPayoff({ debts: liveDebts, monthlyExtraPayment: monthlyExtra, strategy, startDate: currentDate, cyclesPerMonth });
}

export function selectWhatIf(store: DebtStore, extraMonthly: number, baseline?: ReturnType<typeof projectDebtPayoff>): WhatIfResult {
  const { liveDebts, monthlyExtra, currentDate, strategy, cyclesPerMonth } = derivePlanBasis(store);
  const extra = Math.max(0, extraMonthly);

  // PERF-2: reuse a precomputed baseline (memoized off the store) when given; compute it only as a fallback.
  const base = baseline ?? projectDebtPayoff({ debts: liveDebts, monthlyExtraPayment: monthlyExtra, strategy, startDate: currentDate, cyclesPerMonth });
  const simulated = projectDebtPayoff({ debts: liveDebts, monthlyExtraPayment: monthlyExtra + extra, strategy, startDate: currentDate, cyclesPerMonth });

  const canEstimate =
    liveDebts.length > 0 &&
    // [P6.4.4 · L6-6] The sentinel, not a literal — a typo here fails OPEN and calls an unpayable plan payable.
    base.estimatedDebtFreeDate !== DEBT_FREE_DATE_UNPAYABLE &&
    simulated.estimatedDebtFreeDate !== DEBT_FREE_DATE_UNPAYABLE;

  const monthsSaved = canEstimate ? Math.max(0, base.monthsToDebtFree - simulated.monthsToDebtFree) : 0;
  const interestSaved = canEstimate ? Math.max(0, base.totalInterestPaid - simulated.totalInterestPaid) : 0;

  const allocation = buildExtraPaymentAllocationPlan({ debts: liveDebts, amount: extra, strategy });
  // Only build the overlay curve when there's a real extra to visualize (else it duplicates the plan line).
  const simulatedTrajectory =
    extra > 0 && liveDebts.length > 0
      ? buildPayoffTrajectory({ debts: liveDebts, monthlyExtraPayment: monthlyExtra + extra, strategy, cyclesPerMonth })
      : [];

  return {
    canEstimate,
    baselineDate: canEstimate ? base.estimatedDebtFreeDate : null,
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

// Smart Insights: intentionally NOT surfaced (2.2.5 scrapped, Jason 2026-07-22). `buildSmartInsights`
// is weak "smart text" — most of it duplicates Today (cushion status → hero; safe-extra → Recommended
// Actions) and the reshape audit demoted it BECAUSE it's LLM-commodity. Its one additive nugget
// (near-payoff "upcoming relief") is delivered by the premium Cushion Guardian (2.4, the real
// stateful/proactive version) + the Phase-3 trajectory waypoints (visual).
//
// Forecast: intentionally NOT surfaced either (2.2.3, Jason 2026-07-22). The shipped Cash-Flow
// "Cushion" view (`selectCashTimeline`, per-pay-cycle ending balance + stable/tight/pressure) already
// delivers the free forecast job at a higher bar than the old monthly `projectForecast`.

// ── Amortization schedule (per debt) ─────────────────────────────────────────────

export interface DebtAmortization {
  debt: Debt;
  schedule: AmortizationSchedule;
  /** The monthly payment the schedule assumes: minimum + (if this is the focus debt) the extra. */
  monthlyPayment: number;
  isFocus: boolean;
  /**
   * The extra actually folded into `monthlyPayment` — 0 for every non-focus debt, AND for a focus debt
   * whose steady-state plan has nothing spare. ⛔ [L3-4] Copy describing what the payment is MADE OF must
   * branch on this, never on `isFocus`: being first in payoff order does not mean any extra reaches you,
   * and the users for whom this is 0 are exactly the tight ones such a sentence would lie to.
   */
  monthlyExtra: number;
  /** First month of the schedule — row N's date = this + N months (for the sheet's month labels). */
  startDate: string;
}

/** A single debt's month-by-month payoff schedule at its minimum + (if it's the focus) the extra. */
export function selectDebtAmortization(store: DebtStore, debtId: string): DebtAmortization | null {
  const { liveDebts, monthlyExtra, strategy, currentDate, cyclesPerMonth } = derivePlanBasis(store);
  const debt = liveDebts.find((d) => d.id === debtId);
  if (!debt) return null;
  const isFocus = rankDebts(liveDebts, strategy)[0]?.id === debt.id;
  // Only the focus debt receives the recommended extra; others amortize at their minimum. A BNPL pays
  // per-installment at its cadence → use the monthly equivalent so this per-debt schedule agrees with the
  // headline debt-free date, the payoff chart, and the BNPL calendar (after-scan AS.5).
  const baseMonthly = debt.type === 'bnpl' ? bnplMonthlyEquivalentMinimum(debt, cyclesPerMonth) : debt.minimumPayment;
  const monthlyPayment = baseMonthly + (isFocus ? monthlyExtra : 0);
  const schedule = buildAmortizationSchedule({
    balance: debt.balance,
    // BNPL carries no interest — mirror the old app's `apr: 0` so the schedule reconciles.
    apr: debt.type === 'bnpl' ? 0 : debt.apr,
    monthlyPayment,
  });
  return {
    debt,
    schedule,
    monthlyPayment,
    isFocus,
    monthlyExtra: isFocus ? monthlyExtra : 0,
    startDate: currentDate,
  };
}
