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
  varies: { label: 'My income varies' },
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
export const PAYCHECK_LEAN_HELP = 'Your plan runs on this floor, so a lighter paycheck never breaks it.';

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
} as const;

/**
 * The next payday for a cycle, falling back to biweekly when the day inputs do not parse.
 *
 * The `catch` is the honest half: a half-typed "1" in a semi-monthly day field throws inside
 * `getNextPaycheckDate`, and a form that blanks its own preview mid-keystroke reads as broken.
 */
export function nextPaycheckFrom(
  payCycle: PayCycle,
  firstDay: string,
  secondDay: string,
  payDay: string,
): string {
  const currentDate = todayLocalISO();
  try {
    return getNextPaycheckDate({
      payCycle,
      currentDate,
      semiMonthlyFirstDay: Number(firstDay),
      semiMonthlySecondDay: Number(secondDay),
      monthlyPayDay: Number(payDay),
    });
  } catch {
    return getNextPaycheckDate({ payCycle: 'biweekly', currentDate });
  }
}

/** `2026-08-12` → `Wed, Aug 12`. Local-noon-safe: a bare `new Date(iso)` parses as UTC and can land a
 *  day early west of Greenwich. */
export function formatPaycheckDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
