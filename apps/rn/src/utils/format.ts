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

/** A truncated name list plus the count it left out. `more === 0` means `shown` is the whole list. */
export interface NameSummary {
  shown: string;
  more: number;
}

/**
 * [P6.8.9.7.11.14.1 · audit P1-4] Entity names as a readable list rather than a run-on paragraph.
 *
 * ⛔ **The defect this exists to stop was a bare `.join(' · ')` on the shortfall card** — at 40
 * obligations it rendered 23 generic names across four lines with a total welded onto the end, on the one
 * surface that speaks to someone who is short this paycheck. Nothing downstream truncates, so the fix has
 * to be at the point the string is built.
 *
 * ⚠️ **Truncation only starts when it actually SAVES something.** At `max + 1` names, *"+1 more"* is
 * longer than the name it hides and tells the reader strictly less, so the whole list is shown instead —
 * `more` is 0 and the caller renders no overflow affordance. Pinned; it is the case an off-by-one gets
 * wrong in the direction nobody looks at.
 *
 * ⚠️ **`max` is a count of names, not of characters.** A caller with a hard line budget wants a smaller
 * `max`, not a change here — this helper knows nothing about the type scale, and guessing at it is how a
 * formatter starts disagreeing with the layout it serves.
 */
export function summariseNames(names: readonly string[], max: number): NameSummary {
  if (max < 1 || names.length <= max + 1) return { shown: names.join(' · '), more: 0 };
  return { shown: names.slice(0, max).join(' · '), more: names.length - max };
}
