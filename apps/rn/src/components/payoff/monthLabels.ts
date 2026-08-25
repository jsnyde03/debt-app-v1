import { addMonthsToDate } from '@core/utils/addMonths';
import { parseLocalDate } from '@core/utils/localDate';

/**
 * The month a point on the payoff chart lands in, and the two ways it is written.
 *
 * Pulled out of `TrajectoryChart` so it can be pinned. It was a closure over `startDate` inside the
 * component, which is a shape no node test can reach, and that is why the audit that found the overflow
 * below could also report that nothing tested the dates it produced.
 *
 * ⛔ `startDate` is the user's `paycheck.currentDate`, so it sits on the 29th–31st for a large share of
 * users — every one of whom saw a month LATER than their plan computes while this stepped with
 * `setMonth`. The clamp is `@core/utils/addMonths`; `scripts/check-month-arithmetic.ts` keeps it.
 */
export function monthDate(startISO: string, months: number): Date {
  return addMonthsToDate(parseLocalDate(startISO), months);
}

/** `Feb 2026` — the scrub readout, the minimums-only date, and both StrategyCompare columns. */
export function monthYearLabel(startISO: string, months: number): string {
  return monthDate(startISO, months).toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

/** `Feb` — the fallback x-axis ticks, used when the span carries too few Januaries to label years. */
export function monthShortLabel(startISO: string, months: number): string {
  return monthDate(startISO, months).toLocaleString('en-US', { month: 'short' });
}
