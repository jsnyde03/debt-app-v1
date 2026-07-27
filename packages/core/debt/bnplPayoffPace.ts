/**
 * Shared BNPL cadence math for the monthly payoff engines (`projectDebtPayoff` = the debt-free DATE,
 * `buildPayoffTrajectory` = the payoff CHART). Both render on the same Payoff/What-If screen, so they
 * MUST rate BNPL the same way or the date and the chart contradict each other (round-2 R2.1).
 *
 * A BNPL's `minimumPayment` is its per-INSTALLMENT amount at its `recurrence` cadence, so a biweekly
 * pay-in-4 really costs ~2.17× its installment per month. A monthly payoff loop pays each debt once per
 * month, so a BNPL must be scaled to its monthly equivalent. A ONE-TIME (pay-in-30) BNPL is not a
 * recurring minimum at all — it's a single lump cleared the month it lands, and it must be EXCLUDED from
 * the recurring monthly budget (else its balance re-appears as phantom "freed" cash every later month,
 * over-accelerating the other debts — round-2 R2.2). Callers use `isOneTimeBnplLump` to keep it out of
 * `totalMinimums` while still giving it a month-1 clearing payment.
 */

type BnplShape = { type?: string; recurrence?: string; balance: number; minimumPayment: number };

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

// Installments-per-month by cadence. (per-paycheck has no pay-cycle here → assume biweekly, the common
// case; threading the user's real pay cycle is a backlog item.)
const BNPL_MONTHLY_FACTOR: Record<string, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  'per-paycheck': 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  annually: 1 / 12,
};

/** A one-time (pay-in-30) BNPL — a single lump, not a recurring minimum. Excluded from the recurring
 *  payoff budget by callers; cleared in its due month via its month-1 payment. */
export function isOneTimeBnplLump(debt: BnplShape): boolean {
  return debt.type === 'bnpl' && debt.recurrence === 'one-time';
}

/** The monthly-equivalent minimum for a BNPL: installment × installments-per-month, or the whole balance
 *  as a one-shot for a one-time plan. Non-BNPL debts are unaffected (callers keep their own minimum). */
export function bnplMonthlyEquivalentMinimum(debt: BnplShape): number {
  if (isOneTimeBnplLump(debt)) return roundMoney(debt.balance);
  const factor = BNPL_MONTHLY_FACTOR[debt.recurrence ?? 'monthly'] ?? 1;
  return roundMoney(debt.minimumPayment * factor);
}
