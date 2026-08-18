import { payCyclesPerMonth } from '@core/payCycle/payCyclesPerMonth';

import type { DebtStore } from '@/data/models';
import { monthlyEquivalent } from '@/utils/format';

import { selectDiscretionary, sumCategory } from './planSelectors';
import { effectivePaycheckBuffer, selectAllocation, selectExpenseReserveContribution, selectExpenseReservePot } from './selectors';

/**
 * 3.8 — the READ side of the expense reserve, in one place.
 *
 * ⚠️ The smoothing math below used to live inline in `money.tsx`, computed for the Expenses hero alone.
 * That was survivable while nothing else read it; 3.8's offer needs the same number, and a second
 * derivation is how "two places, one rule" starts — the failure mode that produced three separate defects
 * in Wave A. One owner, both callers.
 */

export interface RecurringSmoothed {
  /** Every recurring expense expressed as a monthly figure and summed. */
  monthlyTotal: number;
  /** That load spread evenly over the paychecks in a month — the RECOMMENDATION, never an outcome. */
  perPaycheckTotal: number;
  cyclesPerMonth: number;
}

/**
 * The whole recurring load — rent + utilities + subscriptions + everything else — smoothed to a
 * per-paycheck figure. ⚠️ Rent is an EXAMPLE, never the case: this has always summed every recurring
 * expense, so any wording or test phrased around a single bill is describing a special case.
 *
 * ⚠️ Reads raw `amount`, NOT `resolveTrialAmounts`. Deliberate: it is what the Expenses hero has always
 * shown, and diverging here would put a different number on the offer than on the hero — the exact
 * two-records-of-one-thing split 3.8 exists to close. Whether a smoothed reserve should target the
 * post-trial price is a real question, and it belongs to the wording/cohesion gate, not to a silent
 * change made in passing.
 */
export function selectRecurringSmoothed(store: DebtStore): RecurringSmoothed {
  const cyclesPerMonth = payCyclesPerMonth(store.paycheck.payCycle);
  const perCycle = cyclesPerMonth > 0 ? cyclesPerMonth : 1;
  const monthlyTotal = store.requiredExpenses
    .filter((e) => e.recurrence !== 'one-time')
    .reduce((sum, e) => sum + monthlyEquivalent(e.amount, e.recurrence, cyclesPerMonth), 0);
  return { monthlyTotal, perPaycheckTotal: monthlyTotal / perCycle, cyclesPerMonth: perCycle };
}

/**
 * 3.8.4 — what is ACTUALLY set aside right now, and the number the Expenses hero shows.
 *
 * ⚠️ NOT `expenseReserve.balance`. The balance is last cycle's carry-in: it does not include what the user
 * set aside from THIS paycheck (that folds in at rollover), and it still contains what this cycle's bills
 * have already drawn. A hero reading it would sit at `$0` immediately after the user reserved $175 — the
 * app failing to record the habit it just coached, which is the whole defect 3.8 exists to fix.
 *
 * So: the pot after this cycle's draw, plus what this paycheck actually held. Both come from the
 * allocation, already clamped — never re-derived here.
 */
export function selectExpenseReserveNow(store: DebtStore): number {
  const allocation = selectAllocation(store);
  if (!allocation) return selectExpenseReservePot(store);
  return Math.round((allocation.expenseReservePotAfterDraw + allocation.expenseReserveHeld) * 100) / 100;
}

export interface ExpenseReserveOffer {
  /** The smoothed per-paycheck share of the recurring load — what a full contribution would be. */
  recommended: number;
  /** What THIS paycheck can actually spare, after obligations, everyday spending and the cushion floor. */
  spare: number;
  /** What is actually offered: `min(recommended, spare)`, less anything already set aside this cycle. */
  offer: number;
  /** Already set aside from this paycheck (cycle-keyed). */
  alreadyReserved: number;
  /**
   * ⛔ [A3.6] The offer reaches the full smoothed recommendation. FALSE means the offer is CAPPED by what
   * the paycheck can spare — and copy must then state what it actually does, never promise the whole
   * figure. Offering "$175" and reserving $60 is the promise-an-outcome-deliver-less shape that has now
   * shipped twice in this app (a proxy gate, and a `Math.min`'d resource).
   */
  coversRecommendation: boolean;
  /** The pot if the user takes this offer — what the Money hero will read. */
  potAfter: number;
}

/**
 * 3.8.3 — the offer, and it is NEVER required.
 *
 * The plan is correct at every contribution level including zero: the reserve changes what the paycheck
 * holds back, not whether the plan is valid. So this is an offer, and the only hard rule is that it may
 * never promise more than the paycheck can spare.
 *
 * `null` when there is nothing to offer — no plan yet, no recurring load, a shortfall (the paycheck cannot
 * cover this cycle's own obligations, so setting money aside for the next one would be advice to go short),
 * or nothing left after the floor.
 */
export function selectExpenseReserveOffer(store: DebtStore): ExpenseReserveOffer | null {
  const allocation = selectAllocation(store);
  if (!allocation) return null;
  // A shortfall means this cycle's own bills are not covered. Reserving for a future one first is exactly
  // the "coaches a habit the plan does not take" defect, pointed the other way.
  if (allocation.shortfall > 0) return null;

  const round = (n: number) => Math.round(n * 100) / 100;
  const { perPaycheckTotal } = selectRecurringSmoothed(store);
  const recommended = round(perPaycheckTotal);
  if (recommended <= 0) return null;

  const alreadyReserved = round(selectExpenseReserveContribution(store));
  // What the engine would actually let us hold: discretionary less the cushion floor it has already taken,
  // plus whatever is currently held (so an existing contribution does not read as unavailable to itself).
  // ⚠️ Measured against the engine's clamp rather than derived from the floor — the waterfall composes
  // through `effectivePaycheckBuffer` and is not predictable by reading.
  const spare = round(
    Math.max(0, selectDiscretionary(allocation) - sumCategory(allocation, 'cushion_buffer')) + alreadyReserved,
  );
  if (spare <= 0) return null;

  const target = round(Math.min(recommended, spare));
  const offer = round(Math.max(0, target - alreadyReserved));

  return {
    recommended,
    spare,
    offer,
    alreadyReserved,
    coversRecommendation: target >= recommended,
    potAfter: round(selectExpenseReservePot(store) + target),
  };
}

/** Kept adjacent so a reader sees the floor this offer must never breach in the same file. */
export const expenseReserveFloor = effectivePaycheckBuffer;
