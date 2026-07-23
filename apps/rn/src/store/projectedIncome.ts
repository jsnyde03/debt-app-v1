import type { PaycheckConfig } from '@/data/models';

/**
 * The income the MULTI-CYCLE forecast projects FUTURE cycles on (2.4.7.2 / §2.3 "valley-into-forecast").
 * Variable income plans on the **lean** — the conservative floor you can count on — not the entered or
 * typical amount, so a low/lumpy month actually reaches the forecast (and the water-fill can see the
 * valley). Fixed income projects on the entered amount. Cycle 0 always uses the ACTUAL current paycheck
 * (`result.paycheckAmount`); this is only the recurring projection input.
 *
 * Pure + selector-free (imports only the type) so it stays unit-testable. Falls back to the entered
 * amount when `incomeVaries` is set but no lean is entered yet, so the forecast never projects on $0.
 */
export function projectedIncome(paycheck: PaycheckConfig): number {
  const base = Number(paycheck.amount) || 0;
  if (!paycheck.incomeVaries) return base;
  const lean = Number(paycheck.leanAmount) || 0;
  return lean > 0 ? lean : base;
}
