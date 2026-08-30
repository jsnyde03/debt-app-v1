import { buildPayoffTrajectory, type DebtClearPoint, simulatePayoff, type TrajectoryPoint } from '@core/debt/buildPayoffTrajectory';
import { computeInterestSaved, type InterestSaved } from '@core/debt/computeInterestSaved';
import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';
import type { TimelineCycle } from '@core/timeline/buildMultiCycleTimeline';
import type { TimelineItem } from '@core/timeline/buildTimelineItems';

import type { Debt, DebtStore, PayoffStrategy } from '@/data/models';

import { selectDebtFreeBand, selectDebtFreeDate, selectExtraToDebt, type DebtFreeBand } from './planSelectors';
import { buildForecastCycles } from './forecastCycles';
import { effectivePaycheckBuffer, selectAllocation, selectSteadyStateAllocation } from './selectors';

export type { TrajectoryPoint, DebtClearPoint, InterestSaved, TimelineCycle, TimelineItem };

/**
 * The near-term cash-cushion forecast — the next few pay cycles' ending balance + a stable/tight/
 * pressure health flag. Distinct from the payoff trajectory (this = "will I be tight next month?",
 * that = "when am I free?"). Built on the tested `@core/timeline` engine. `[]` if no plan yet.
 */
export function selectCashTimeline(store: DebtStore, maxCycles = 5): TimelineCycle[] {
  const allocation = selectAllocation(store);
  if (!allocation) return [];
  // Delegates to the shared forecast builder (2.4.7.5) — same state-threaded / valley-on-lean projection
  // the §2.5 water-fill runs on, so display and prefund can't diverge.
  return buildForecastCycles(store, allocation, effectivePaycheckBuffer(store), maxCycles);
}

export interface PayoffView {
  hasDebts: boolean;
  debtFreeDate: string | null;
  interestSaved: InterestSaved;
  monthlyExtra: number;
  snowball: TrajectoryPoint[];
  avalanche: TrajectoryPoint[];
  /** Per-debt clear-months for each strategy — the "Visa gone — Aug 2027" trajectory waypoints. */
  snowballClears: DebtClearPoint[];
  avalancheClears: DebtClearPoint[];
  /** The minimum-payments-only curve — the "vs. minimums" ghost on the trajectory chart. */
  minimums: TrajectoryPoint[];
  /** VIS-5 — the lean/safe-floor payoff curve (variable income only); empty when there's no band. */
  lean: TrajectoryPoint[];
  /** VIS-5 — typical/lean debt-free dates + whether to show the cone (variable income, dates differ). */
  band: DebtFreeBand;
  order: Debt[];
  focus: Debt | null;
}

/**
 * ⛔ **S1.12.5.4 [pass-5 `C5-1`] — THE WHOLE VIEW IS GAGGED, BECAUSE GATING PROPS ONE BY ONE LEFT A
 * DIFFERENT DEBT-FREE DATE ON THE SAME SCREEN.**
 *
 * ⚡ Pass-4 `C4-9` gated four hand-listed props on Progress — `debtFreeDate`, `interestSaved`, the hero
 * percentage and its journey line — and passed the rest of `view` to the chart untouched. Measured with
 * one card's balance unreadable: the hero read **"—"** and *"Some balances couldn't be read"*, the "Your
 * plan" legend printed no date, **and the Safe-floor row printed "June 2026" against a true "November
 * 2026"** — five months early. ⛔ **The only debt-free date left on the screen was the one the design calls
 * *"the honest floor for a variable earner"*, and it credited the user with a card they still owed in full.**
 *
 * ⚠️ The plotted curve, its `$k` gridline labels, the waypoints, the scrub readout and the What-If row were
 * all reading the same repaired `$0`.
 *
 * ⭐ **Every key is written out, and that is the point.** A new `PayoffView` field does not compile until
 * someone decides whether it is balance-derived — which is the check a hand-written prop list at a call
 * site can never make. ⛔ The four props `C4-9` gated were correct and incomplete; the class is *"which of
 * these figures are derived from a balance the app could not read"*, and it is answerable here and nowhere
 * else.
 */
export function gagBalanceDerived(view: PayoffView): PayoffView {
  return {
    // Readable without reading any balance: that debts EXIST, what the user typed as extra, and the
    // ordering/focus the row-level guards already gag figure-by-figure on Money.
    hasDebts: view.hasDebts,
    monthlyExtra: view.monthlyExtra,
    order: view.order,
    focus: view.focus,
    // Every one of these is a projection off balances, and at least one balance is a repaired `$0`.
    debtFreeDate: null,
    interestSaved: { kind: 'none' },
    snowball: [],
    avalanche: [],
    snowballClears: [],
    avalancheClears: [],
    minimums: [],
    lean: [],
    // ⚠️ `hasBand: false` is what removes the Safe-floor ROW, not just its date — a row reading
    // "Safe-floor —" would still assert that a floor had been computed.
    band: { typical: null, lean: null, hasBand: false },
  };
}

/** Rank live debts by the chosen strategy (snowball = smallest balance · avalanche = highest APR). */
export function rankDebts(debts: Debt[], strategy: PayoffStrategy): Debt[] {
  return [...debts].sort((a, b) => (strategy === 'snowball' ? a.balance - b.balance : b.apr - a.apr));
}

/** Everything the (free) Payoff tab renders, derived from the store + the shared `@core` engine. */
export function selectPayoffView(store: DebtStore): PayoffView {
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  const allocation = selectAllocation(store);
  // MF.4 (audit #5): project on the STEADY-STATE deploy (temporary cold-start holdbacks stripped) so the
  // payoff date / trajectory / interest-saved aren't extrapolated off a 3-cycle cold-start dampener.
  const steady = selectSteadyStateAllocation(store);
  const monthlyExtra = steady ? selectExtraToDebt(steady) * payCyclesPerMonth(store.paycheck.payCycle) : 0;
  const startDate = store.paycheck.currentDate;
  // ⛔ [pass-5 A5-1] every month-stepped projection below rates a `per-paycheck` BNPL by THIS, not by a fortnight.
  const cyclesPerMonth = payCyclesPerMonth(store.paycheck.payCycle);

  const interestSaved: InterestSaved =
    liveDebts.length > 0
      ? computeInterestSaved({ debts: store.debts, monthlyExtraPayment: monthlyExtra, strategy: store.payoffStrategy, startDate, cyclesPerMonth })
      : { kind: 'none' };

  const snowballSim = liveDebts.length > 0 ? simulatePayoff({ debts: store.debts, monthlyExtraPayment: monthlyExtra, strategy: 'snowball', cyclesPerMonth }) : { points: [], clears: [] };
  const avalancheSim = liveDebts.length > 0 ? simulatePayoff({ debts: store.debts, monthlyExtraPayment: monthlyExtra, strategy: 'avalanche', cyclesPerMonth }) : { points: [], clears: [] };
  const snowball = snowballSim.points;
  const avalanche = avalancheSim.points;
  // The minimums-only baseline (no extra) — pays off later (or, when interest outruns minimums,
  // never), so it trails above/beyond the active plan: the visible "vs. minimums" gap.
  const minimums = liveDebts.length > 0 ? buildPayoffTrajectory({ debts: store.debts, monthlyExtraPayment: 0, strategy: store.payoffStrategy, cyclesPerMonth }) : [];

  // VIS-5 — the lean/safe-floor curve for a variable-income user: the SAME plan run on the lean income,
  // so it pays off later (the cone's upper edge). Only computed when there's a real band.
  const band = selectDebtFreeBand(store);
  let lean: TrajectoryPoint[] = [];
  if (band.hasBand && liveDebts.length > 0) {
    const leanStore: DebtStore = { ...store, paycheck: { ...store.paycheck, amount: String(store.paycheck.leanAmount) } };
    const leanSteady = selectSteadyStateAllocation(leanStore);
    const leanExtra = leanSteady ? selectExtraToDebt(leanSteady) * payCyclesPerMonth(store.paycheck.payCycle) : 0;
    lean = buildPayoffTrajectory({ debts: store.debts, monthlyExtraPayment: leanExtra, strategy: store.payoffStrategy, cyclesPerMonth });
  }

  const order = rankDebts(liveDebts, store.payoffStrategy);
  return {
    hasDebts: liveDebts.length > 0,
    debtFreeDate: selectDebtFreeDate(store, allocation),
    interestSaved,
    monthlyExtra,
    snowball,
    avalanche,
    snowballClears: snowballSim.clears,
    avalancheClears: avalancheSim.clears,
    minimums,
    lean,
    band,
    order,
    focus: order[0] ?? null,
  };
}
