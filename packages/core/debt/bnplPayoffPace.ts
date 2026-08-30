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

/**
 * Installments-per-month by cadence.
 *
 * ⛔ **S1.12.5.5 [pass-5 `A5-1`] — `per-paycheck` IS NOT A FORTNIGHT, AND ASSUMING IT WAS PUT A FALSE
 * DEBT-FREE DATE ON THE SCREEN.**
 *
 * ⚡ This map hardcoded `26 / 12` for `per-paycheck` under a comment calling the real fix *"a backlog
 * item"*. Measured: a **monthly**-paid user with a `per-paycheck` BNPL is shown a debt-free date of
 * **July 2026**, over a chart that agrees with it, while the app's own rollover does not clear the
 * balance until **January 2027** — 2.17× out. A **weekly** payer gets it wrong the other way: told six
 * months, actually 2.8. Both shapes are reachable from the DebtSheet picker and from the CSV importer.
 *
 * ⚠️ **`per-paycheck` is deliberately absent from this map now** rather than carrying a wrong number.
 * It has no cadence of its own — it is one installment per PAY CYCLE, whatever that cycle is — so it is
 * resolved from `cyclesPerMonth` below. A map entry would be a value that looks right at every call site
 * and is right at none of them.
 */
const BNPL_MONTHLY_FACTOR: Record<string, number> = {
  weekly: 52 / 12,
  biweekly: 26 / 12,
  monthly: 1,
  quarterly: 1 / 3,
  annually: 1 / 12,
};

/** A one-time (pay-in-30) BNPL — a single lump, not a recurring minimum. Excluded from the recurring
 *  payoff budget by callers; cleared in its due month via its month-1 payment. */
export function isOneTimeBnplLump(debt: BnplShape): boolean {
  return debt.type === 'bnpl' && debt.recurrence === 'one-time';
}

/**
 * The monthly-equivalent minimum for a BNPL: installment × installments-per-month, or the whole balance
 * as a one-shot for a one-time plan. Non-BNPL debts are unaffected (callers keep their own minimum).
 *
 * ⛔ **`cyclesPerMonth` IS REQUIRED [pass-5 `A5-1`], and that is the guard.** It is only ever read for a
 * `per-paycheck` plan — but making it optional would leave every unthreaded call site silently on the old
 * biweekly assumption, which is exactly the state this finding describes. A required parameter turns each
 * one into a typecheck error, and a typecheck error is the only guard that cannot be routed around.
 *
 * ⚠️ Pass `payCyclesPerMonth(store.paycheck.payCycle)` — the same value `format.ts`'s `monthlyEquivalent`
 * already takes, from the same place. This function was the last producer disagreeing with it.
 */
export function bnplMonthlyEquivalentMinimum(debt: BnplShape, cyclesPerMonth: number): number {
  if (isOneTimeBnplLump(debt)) return roundMoney(debt.balance);
  const recurrence = debt.recurrence ?? 'monthly';
  // ⛔ One installment per PAY CYCLE — the user's real cadence, not a fortnight. See the map above.
  const factor = recurrence === 'per-paycheck' ? cyclesPerMonth : (BNPL_MONTHLY_FACTOR[recurrence] ?? 1);
  return roundMoney(debt.minimumPayment * factor);
}
