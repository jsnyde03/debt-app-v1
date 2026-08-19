import { getNextPaycheckDate, type PayCycle } from '@core/payCycle/getNextPaycheckDate';

import { todayLocalISO } from '@/data/defaults';

/**
 * W1 — the paycheck form's shared definition, owned once.
 *
 * ⚠️ **It was written TWICE, verbatim.** `PaycheckStep` (onboarding) and `PaycheckSheet` (the Plan-tab
 * edit) are the same form with different chrome, and they carried **~13 identical strings** — the whole
 * cycle list including its sublabel, every field label and placeholder, and two validation messages —
 * plus `computeNext` and `formatDate` as byte-equivalent copies. The audit's duplicate sweep is what
 * surfaced it; nothing else would have, because they agreed.
 *
 * ⚡ **They had already begun to diverge**, which is the argument against leaving agreeing copies alone:
 * the identical "no amount entered" condition read *"Enter your paycheck amount to continue."* in
 * onboarding and *"Enter your paycheck amount."* in the sheet. That one is **kept per-host on purpose**
 * (see `ownError` below) — a step in a flow may legitimately say "to continue" where a sheet may not.
 * The point is that it is now a stated difference rather than an accident.
 *
 * **What belongs here vs. what stays local:** this owns what the two hosts must AGREE on. Chrome that
 * differs by context — the step's Continue/Skip, the sheet's title/subtitle/submit label and its
 * "This paycheck didn't arrive" affordance — stays in each component, because those are genuinely
 * different jobs rather than one job written twice.
 */

/**
 * The pay cycles a user may choose. ⚠️ The `sublabel` is load-bearing copy, not decoration — semi-monthly
 * is the one cycle whose meaning is not obvious from its name, so it ships its own example.
 */
export const PAY_CYCLE_OPTIONS: { value: PayCycle; label: string; sublabel?: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'semimonthly', label: 'Semi-Monthly', sublabel: 'e.g. 1st & 15th' },
  { value: 'monthly', label: 'Monthly' },
];

/** Field labels + placeholders both hosts render. */
export const PAYCHECK_FIELDS = {
  amount: { label: 'Paycheck amount', placeholder: 'e.g. 1500' },
  varies: { label: 'Income varies' },
  lean: { label: 'The amount you can count on', placeholder: 'e.g. 1200' },
  firstPayday: { label: 'First payday', placeholder: '1' },
  secondPayday: { label: 'Second payday', placeholder: '15' },
  monthlyPayday: { label: 'Payday (day of month)', placeholder: '1' },
} as const;

/**
 * The explanation under the lean-floor field. Body copy rather than a label, and it was the last string
 * still written twice after the field copy was extracted — which is why the T2 baseline shrinking is the
 * check that found it, not the eye.
 */
// ⛔ [L1-18] "never breaks it" was false in the one case this field exists for: the plan runs on the LEAN
// floor, so a paycheck lighter than the floor itself breaks it exactly as any other shortfall would. The
// absolute was doing the reassurance the honest sentence does anyway.
export const PAYCHECK_LEAN_HELP = 'Your plan runs on this floor, so a lighter-than-usual paycheck won’t throw it off.';

/** The two group headings both hosts render above the cycle picker and the computed preview. */
export const PAYCHECK_SECTIONS = {
  cycle: 'Pay cycle',
  next: 'Next paycheck',
} as const;

/**
 * Validation copy both hosts share. ⚠️ The amount-missing message is deliberately NOT here — it is the
 * one that already differed, and it differs for a defensible reason. Each host keeps its own.
 */
export const PAYCHECK_ERRORS = {
  leanRequired: 'Enter the amount you can count on.',
  leanAboveTypical: 'Your lean paycheck should be no more than a typical one.',
  paydayRequired: 'Enter which day of the month you get paid.',
  paydayRange: 'Use a day between 1 and 31.',
  paydaySame: 'Your two paydays must be different days.',
} as const;

/** What the preview shows when the cycle's day inputs do not yet describe a payday. */
export const PAYCHECK_NO_DATE = '—';

/**
 * The next payday for a cycle, or `null` when the day inputs do not describe one.
 *
 * ⛔ **It used to fall back to BIWEEKLY, and that silently corrupted the user's first fact about
 * themselves.** Pick Semi-monthly, leave "First payday" empty, and `getNextPaycheckDate` threw — the
 * catch then returned today + 14 days, which the preview card rendered with full confidence and
 * Continue wrote to the store, so the plan was stored as `semimonthly` with a blank day and a
 * biweekly-derived date. Measured: with days that cannot coincide with today + 14, four of six invalid
 * inputs produced that fallback.
 *
 * ⚠️ The fallback was defended as protecting the preview from blanking mid-keystroke. Measured, that
 * case barely exists — `Number("1")` is a valid day, so a half-typed entry does not throw; only an
 * empty field, an out-of-range day or two identical semi-monthly days do. And a confidently WRONG date
 * is not a gentler failure than a dash. `null` is the honest answer, and the hosts render it as one.
 */
export function nextPaycheckFrom(
  payCycle: PayCycle,
  firstDay: string,
  secondDay: string,
  payDay: string,
): string | null {
  try {
    return getNextPaycheckDate({
      payCycle,
      currentDate: todayLocalISO(),
      semiMonthlyFirstDay: Number(firstDay),
      semiMonthlySecondDay: Number(secondDay),
      monthlyPayDay: Number(payDay),
    });
  } catch {
    return null;
  }
}

/**
 * Why the day inputs do not describe a payday, as a message — or `null` when they are fine.
 *
 * Shared because BOTH hosts must refuse the same input for the same stated reason: this file exists
 * because they were written twice and had already begun to diverge, and a validation rule living in two
 * places is that defect waiting to happen again. Weekly/bi-weekly need no day, so they never error.
 */
export function paydayFieldError(payCycle: PayCycle, firstDay: string, secondDay: string, payDay: string): string | null {
  const bad = (v: string) => !v.trim() || !Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > 31;
  if (payCycle === 'monthly') {
    if (!payDay.trim()) return PAYCHECK_ERRORS.paydayRequired;
    return bad(payDay) ? PAYCHECK_ERRORS.paydayRange : null;
  }
  if (payCycle === 'semimonthly') {
    if (!firstDay.trim() || !secondDay.trim()) return PAYCHECK_ERRORS.paydayRequired;
    if (bad(firstDay) || bad(secondDay)) return PAYCHECK_ERRORS.paydayRange;
    if (Number(firstDay) === Number(secondDay)) return PAYCHECK_ERRORS.paydaySame;
  }
  return null;
}

/** `2026-08-12` → `Wed, Aug 12`, or a dash when there is no date yet. Local-noon-safe: a bare
 *  `new Date(iso)` parses as UTC and can land a day early west of Greenwich. */
export function formatPaycheckDate(iso: string | null): string {
  if (!iso) return PAYCHECK_NO_DATE;
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
