/**
 * R3 probe — the R2-5 class at two sites the class never enumerated.
 * `payoffCelebration.detectPayoff` sets `freed: subject.minimumPayment` and it is rendered as
 * `freedPerMonth`: "Freed $X/mo now flows to <next>" (PaidOffBeat.tsx:132), spoken at :100,
 * and put on a ShareCard at :152. `minimumPayment` is the PER-INSTALLMENT figure.
 */
import type { Debt } from '@/data/models';
import { detectPayoff } from '@/store/payoffCelebration';
import { bnplMonthlyEquivalentMinimum } from '@core/debt/bnplPayoffPace';

const mk = (over: Partial<Debt>): Debt =>
  ({
    id: 'd1', name: 'Card', balance: 500, minimumPayment: 50, apr: 0,
    dueDate: '2026-08-06', type: 'debt', recurrence: 'monthly', ...over,
  }) as unknown as Debt;
const other = mk({ id: 'd2', name: 'Next debt', balance: 900 });

const CPM = 1; // a MONTHLY payer — cyclesPerMonth = 1
const shapes: [string, Debt][] = [
  ['plain · monthly (control)', mk({})],
  ['plain · weekly', mk({ recurrence: 'weekly' })],
  ['plain · biweekly', mk({ recurrence: 'biweekly' })],
  ['BNPL · weekly', mk({ type: 'bnpl', bnplProvider: 'Klarna', recurrence: 'weekly' })],
  ['BNPL · weekly, sched 80 ≠ min 50', mk({ type: 'bnpl', bnplProvider: 'Klarna', recurrence: 'weekly', scheduledPaymentAmount: 80, remainingPayments: 6 } as Partial<Debt>)],
];

console.log('shape                              | says freed /mo | truly freed /mo | factor');
for (const [label, d] of shapes) {
  const before = [d, other];
  const after = [{ ...d, balance: 0 }, other];
  const beat = detectPayoff(before, after, 'snowball', new Set<string>());
  const says = beat && beat.kind === 'beat' ? beat.freed : null;
  const truly = bnplMonthlyEquivalentMinimum(d as never, CPM);
  const factor = says ? (truly / says).toFixed(2) : '-';
  console.log(`${label.padEnd(34)} | $${String(says).padStart(13)} | $${String(truly).padStart(14)} | ${factor}x`);
}
