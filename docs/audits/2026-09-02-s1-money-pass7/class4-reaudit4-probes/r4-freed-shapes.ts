/**
 * R4 — attack R3-4's fix at the shapes its guard does not iterate.
 * The guard covers monthly / weekly / biweekly / BNPL-weekly, all with cyclesPerMonth = 1.
 * It does NOT cover `one-time` (where bnplMonthlyEquivalentMinimum returns the whole BALANCE)
 * nor `per-paycheck` (the ONLY recurrence for which cyclesPerMonth is read at all).
 */
import type { Debt } from '@/data/models';
import { detectPayoff } from '@/store/payoffCelebration';
import { bnplMonthlyEquivalentMinimum } from '@core/debt/bnplPayoffPace';

const mk = (over: Partial<Debt>): Debt =>
  ({ id: 'a', name: 'Klarna order', balance: 600, originalBalance: 600, minimumPayment: 50, apr: 0,
     type: 'debt', recurrence: 'monthly', dueDate: '2026-08-06', ...over } as unknown as Debt);

const shapes: [string, Partial<Debt>, number][] = [
  ['monthly plain (control)', { recurrence: 'monthly' }, 1],
  ['weekly plain', { recurrence: 'weekly' }, 1],
  ['ONE-TIME BNPL bal $600 min $600', { type: 'bnpl', bnplProvider: 'Klarna', recurrence: 'one-time', minimumPayment: 600 } as Partial<Debt>, 1],
  ['ONE-TIME BNPL bal $600 min $50', { type: 'bnpl', bnplProvider: 'Klarna', recurrence: 'one-time', minimumPayment: 50 } as Partial<Debt>, 1],
  ['ONE-TIME plain bal $600 min $50', { type: 'debt', recurrence: 'one-time', minimumPayment: 50 } as Partial<Debt>, 1],
  ['per-paycheck · monthly payer', { recurrence: 'per-paycheck' } as Partial<Debt>, 1],
  ['per-paycheck · weekly payer', { recurrence: 'per-paycheck' } as Partial<Debt>, 52 / 12],
  ['per-paycheck · biweekly payer', { recurrence: 'per-paycheck' } as Partial<Debt>, 26 / 12],
  ['quarterly plain', { recurrence: 'quarterly' } as Partial<Debt>, 1],
  ['annually plain', { recurrence: 'annually' } as Partial<Debt>, 1],
];

console.log('shape | OLD freed (minimumPayment) | NEW freed | rendered');
for (const [label, over, cpm] of shapes) {
  const cleared = mk(over);
  const before = [cleared, mk({ id: 'b', name: 'Next debt', balance: 3000, minimumPayment: 100 })];
  const after = [{ ...cleared, balance: 0 }, before[1]];
  const r = detectPayoff(before, after, 'avalanche', new Set(), cpm);
  const freed = r?.kind === 'beat' ? r.freed : null;
  console.log(
    `${label.padEnd(34)} | $${String(cleared.minimumPayment).padStart(7)} | $${String(freed).padStart(8)} | ` +
      `"Freed $${freed}/mo now flows to Next debt."  (direct producer: ${bnplMonthlyEquivalentMinimum(cleared as never, cpm)})`,
  );
}
