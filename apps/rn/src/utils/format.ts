import type { Recurrence } from '@core/types/recurrence';

/**
 * Whole-dollar currency (no cents) — for big summary/hero figures where cents read as noise.
 *
 * ⭐ **The whole/cents rule that pairs this with `formatCurrency` is stated ONCE, in
 * `@core/utils/formatCurrency`.** Read it before choosing between them, and before adding a third
 * formatter — there were nine, and `lint:money` now exists to keep it at two.
 *
 * ⚠️ **This does NOT clamp negatives** (`formatWhole(-45)` → `-$45`), deliberately. The seven hand-rolled
 * copies T6.4 deleted mostly did, which is why swapping them in was measured per call site rather than
 * done as a replace: a clamp is a decision about the VALUE and belongs to the selector that produces it.
 */
export function formatWhole(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(safe);
}

const MONTHLY_FACTOR: Record<Exclude<Recurrence, 'per-paycheck' | 'one-time'>, number> = {
  monthly: 1,
  weekly: 52 / 12,
  biweekly: 26 / 12,
  quarterly: 1 / 3,
  annually: 1 / 12,
};

/**
 * A bill's cost normalized to a per-month figure, so bills on different cadences sum honestly into
 * one "$X/mo" total. `per-paycheck` scales by how many paychecks land in a month; `one-time` is not
 * a recurring monthly cost, so it contributes 0 to the monthly total (it still lists as a row).
 */
export function monthlyEquivalent(amount: number, recurrence: Recurrence, cyclesPerMonth: number): number {
  if (recurrence === 'one-time') return 0;
  if (recurrence === 'per-paycheck') return amount * cyclesPerMonth;
  return amount * MONTHLY_FACTOR[recurrence];
}
