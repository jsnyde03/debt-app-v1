import type { Recurrence } from '@core/types/recurrence';

/** Whole-dollar currency (no cents) — for big summary/hero figures where cents read as noise. */
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
