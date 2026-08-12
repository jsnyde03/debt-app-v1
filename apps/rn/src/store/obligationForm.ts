import type { Recurrence } from '@core/types/recurrence';

import type { RequiredExpenseCategory } from '@/data/models';

/**
 * W1 — the words the obligation forms must AGREE on, owned once.
 *
 * ⛔ **This exists because they had already stopped agreeing.** `one-time` shipped with **two
 * user-facing spellings**: `ExpenseSheet` offered *"One time"* while `DebtSheet`'s BNPL cadence and
 * Money's section header both said *"One-time"*. A user set a bill to one and the next screen filed it
 * under the other. Settled here as **"One-time"** — two of the three sites already said it, and it is the
 * correct adjectival form. ⚠️ The *choice* is flagged to the wording/voice gate; the *single authority*
 * is not up for debate.
 *
 * ⚡ **Labels are shared; which options a form OFFERS is not.** That distinction is the whole design.
 * `DebtSheet` lists six recurrences and deliberately omits `one-time` (a debt is terminating by
 * definition); `ExpenseSheet` lists seven and includes it. Extracting one shared *array* would have
 * silently added an option to the debt form — a product change nobody asked for. So this owns a
 * `Record<Recurrence, string>` of labels, and each form keeps its own ordered list of values.
 */

/** One label per recurrence value, everywhere it is shown. */
export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  'monthly': 'Monthly',
  'weekly': 'Weekly',
  'biweekly': 'Every 2 weeks',
  'per-paycheck': 'Every paycheck',
  'quarterly': 'Quarterly',
  'annually': 'Yearly',
  'one-time': 'One-time',
};

/** Build a picker's options from the values THAT form offers, in the order it offers them. */
export function recurrenceOptions(values: Recurrence[]): { value: Recurrence; label: string }[] {
  return values.map((value) => ({ value, label: RECURRENCE_LABEL[value] }));
}

/**
 * Bill categories — one order and one label set, read by Money's grouped list and by `ExpenseSheet`'s
 * picker. They were two records that happened to agree.
 */
export const BILL_CATEGORY_ORDER: RequiredExpenseCategory[] = [
  'housing',
  'utilities',
  'insurance',
  'subscriptions',
  // [D25] — also the only forward way a user can mark a NON-subscription deferrable; Recovery's
  // "Keep essential" toggle only ever moves a bill the other way.
  'discretionary',
  'medical',
  'other',
];

export const BILL_CATEGORY_LABEL: Record<RequiredExpenseCategory, string> = {
  housing: 'Housing',
  utilities: 'Utilities',
  insurance: 'Insurance',
  subscriptions: 'Subscriptions',
  discretionary: 'Discretionary',
  medical: 'Medical',
  other: 'Other',
};

/** The picker's options, in `BILL_CATEGORY_ORDER`. */
export function billCategoryOptions(): { value: RequiredExpenseCategory; label: string }[] {
  return BILL_CATEGORY_ORDER.map((value) => ({ value, label: BILL_CATEGORY_LABEL[value] }));
}

/**
 * Validation messages the entity sheets share.
 *
 * Five sheets each wrote their own *"Enter a name."*, and the onboarding first-debt step wrote a third
 * copy of the balance/minimum pair. They agreed — which is exactly how the recurrence labels looked
 * until they did not.
 */
export const FORM_ERRORS = {
  nameRequired: 'Enter a name.',
  amountPositive: 'Enter an amount greater than 0.',
  balanceRequired: 'Enter the current balance.',
  minimumRequired: 'Enter the minimum payment.',
} as const;
