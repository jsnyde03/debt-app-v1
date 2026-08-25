import { monthDate, monthShortLabel, monthYearLabel } from './monthLabels';

/**
 * P6.8.9.7.11.11 — the payoff chart's month step.
 *
 * ⛔ **The clamp already existed and was already tested when this shipped wrong.** What was missing was
 * the CALL: `TrajectoryChart` stepped with `setMonth`, which overflows a short target month forward, so
 * a user whose `paycheck.currentDate` fell on the 29th–31st read a month LATER than their own plan on the
 * scrub readout, the minimums-only date, the axis ticks and both StrategyCompare columns.
 *
 * ⚠️ Which is why these cases assert the LABEL a user reads rather than the helper's return value. A
 * test on the helper passes whether or not this file calls it, and that is the exact failure mode that
 * let the defect live in a repo whose own comment described it.
 */

let passed = 0;

function eq<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) {
    throw new Error(`FAIL [${label}] expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  passed++;
  console.log(`  ✓ ${label}`);
}

export default function run() {
  console.log('Running payoff month-label tests...');

  // The 31st, month by month. Overflowed, month 1 reads Mar and February never appears at all.
  eq(monthYearLabel('2026-01-31', 1), 'Feb 2026', 'a 31st start: month 1 is February');
  eq(monthYearLabel('2026-01-31', 2), 'Mar 2026', 'a 31st start: month 2 is March');
  eq(monthYearLabel('2026-01-31', 3), 'Apr 2026', 'a 31st start: month 3 is April');

  // Every month of a year from the 31st, so no short month is skipped and none is named twice.
  const fromThe31st = Array.from({ length: 12 }, (_, i) => monthShortLabel('2026-01-31', i + 1));
  eq(
    fromThe31st.join(' '),
    'Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec Jan',
    'a 31st start walks twelve consecutive months with no repeat and no gap'
  );

  // The 29th and 30th reach only February, and both read March when unclamped.
  eq(monthYearLabel('2026-01-29', 1), 'Feb 2026', 'a 29th start: month 1 is February');
  eq(monthYearLabel('2026-01-30', 1), 'Feb 2026', 'a 30th start: month 1 is February');
  eq(monthYearLabel('2024-01-31', 1), 'Feb 2024', 'a leap February is still February');

  // A day every month carries must be untouched — the clamp may not move a date that was already right.
  eq(monthYearLabel('2026-01-15', 1), 'Feb 2026', 'a mid-month start is unchanged');
  eq(monthYearLabel('2026-01-15', 0), 'Jan 2026', 'month 0 is the start month itself');

  // The year ticks read `getMonth() === 0` off this Date, so the January it finds must be a real one.
  eq(monthDate('2026-01-31', 12).getMonth(), 0, 'twelve months from a January lands in January');
  eq(monthDate('2026-01-31', 12).getFullYear(), 2027, 'and in the following year');
  eq(monthDate('2026-12-31', 1).getFullYear(), 2027, 'the step crosses a year boundary');

  console.log(`✅ All payoff month-label tests passed (${passed}).`);
}
