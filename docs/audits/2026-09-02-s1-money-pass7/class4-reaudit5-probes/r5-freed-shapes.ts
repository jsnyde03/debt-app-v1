import { detectPayoff } from '@/store/payoffCelebration';
import type { Debt } from '@/data/models';

const base = {
  id: 'a', name: 'Subject', balance: 600, minimumPayment: 50, apr: 0,
  dueDate: '2026-09-01', isPaidThisCycle: false,
} as unknown as Debt;
const other = { ...base, id: 'b', name: 'Other', balance: 3000 } as Debt;

const RECS = ['one-time','monthly','weekly','biweekly','per-paycheck','quarterly','annually'];
console.log('type\trecurrence\tcyclesPerMonth\tfreed');
for (const type of ['debt', 'bnpl']) {
  for (const r of RECS) {
    for (const cpm of [1, 2.17]) {
      const cleared = { ...base, type, recurrence: r } as unknown as Debt;
      const before = [cleared, other];
      const after = [{ ...cleared, balance: 0 } as Debt, other];
      const res = detectPayoff(before, after, 'avalanche', new Set<string>(), cpm);
      console.log(`${type}\t${r}\t${cpm}\t${res && res.kind === 'beat' ? res.freed : String(res && res.kind)}`);
    }
  }
}
