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
 * ⛔ **THE category a bill is RENDERED under — every list that groups `requiredExpenses` goes through
 * this.** [S1 · pass 1 · M1] Money's grouped list and its "where it goes" receipt were both built by
 * `BILL_CATEGORY_ORDER.map()` + `filter(e => e.category === category)`, which ENUMERATES a menu instead
 * of PARTITIONING the input: a bill whose `category` is absent or unrecognised matched no bucket and
 * rendered nowhere — uneditable, undeletable, invisible to search — **while still being reserved from
 * every paycheck**, so the hero read "$436 recommended" over rows summing to $386.
 *
 * `category` is schema-optional (`debtPlannerStorage.ts`) and **no migration backfills it**; the import
 * doors (`readBackup.ts` — `raw-v17` hands arbitrary JSON straight to `runMigrations`, `v16-file` maps
 * `requiredExpenses` as a straight key copy) do no field-level validation, so both the absent and the
 * unknown-string cases reach the store intact. v1.6's own list item rendered `category ?? "other"`.
 *
 * ⚡ `'other'` is a REAL member of `BILL_CATEGORY_ORDER`, so resolving into it **partitions by
 * construction** — a trailing "everything not matched above" group would be a second bucket meaning the
 * same thing. ⛔ Not for `billCategoryOptions()`: a PICKER is an enumeration by definition, and that is
 * the distinction any future gate for this class has to make.
 */
export function resolveBillCategory(e: { category?: RequiredExpenseCategory }): RequiredExpenseCategory {
  return e.category != null && BILL_CATEGORY_ORDER.includes(e.category) ? e.category : 'other';
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
  // B1 — an OPTIONAL field still has to refuse a typed value it cannot read. `Number(apr) || 0` treated
  // "left blank" and "unreadable" as the same answer and planned an interest-free payoff on a card that
  // charges, so the two are separated and only the second one stops the form.
  aprInvalid: 'Enter the APR as a number, or leave it blank.',
  /**
   * ⛔ **THE ONLY APR PATH THAT ENFORCED NOTHING, UP TO 999999%.** [S1.10.6.6 · pass-3 B2]
   *
   * ⚡ Four ways an APR reaches the store. The CSV import (`debtCsv.ts:287`), the statement scanner
   * (`parseStatementText.ts:113`) and the v1.6 form (`parseDebtFormValues.ts:47`) all bound it to `0–100`.
   * The two RN hand-entry paths tested only *"did it parse"*. So `2599` — the commonest slip on a
   * `decimal-pad` field labelled *"APR %"*, a missing decimal point in `25.99` — was saved and planned
   * against as **2599%**: a $5,000 card accruing **$10,829.17 of interest a month**, ranked first under
   * avalanche, with a debt-free date and an *"interest saved"* figure computed from it.
   *
   * ⚡ **A test asserted this bound and passed**, because `parseDebtFormValues`' only live consumer is the
   * LEGACY root tree. The guard and its green test travelled with v1.6 and never crossed to RN — while RN
   * kept the error string for the same field and narrowed what triggers it to *"unparseable"*.
   *
   * ⚠️ **The bound belongs where the rate is ENTERED, never in `parseOptionalAmount`** — that parser serves
   * every money field in the app and must not learn about percentages, which is the argument `debtCsv.ts`
   * already makes for itself. ⚠️ And a comma slip (`"5,5"` → `55`) lands *inside* a plausible range and is
   * the decided answer, pinned by name in `testAmountField.ts` — which is what makes this bound load-bearing
   * rather than optional: nothing downstream questions 55%.
   */
  aprOutOfRange: 'Enter an APR between 0 and 100.',
} as const;
