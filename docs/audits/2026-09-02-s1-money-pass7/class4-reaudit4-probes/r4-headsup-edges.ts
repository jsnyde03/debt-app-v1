/**
 * R4 probe — attack the round-3 heads-up sentence at the edges round 3 did not sample.
 *   const reserved = Math.min(effectiveMinimumInWindow(d, start, end), d.balance);
 *   const count    = Math.ceil(reserved / each);
 *   `Heads up — ${count} ${provider} payments totalling about ${formatWhole(reserved)} land ...`
 *
 * Truth model, stated independently of the code under test: full charges of `each` land until the
 * balance runs out, then a short final one. So the charges that ACTUALLY land in the window are
 *   min(nInWindow, ceil(balance/each))   and they total   min(nInWindow*each, balance).
 */
import { createDefaultStore } from '@/data/defaults';
import type { Debt, DebtStore } from '@/data/models';
import { effectiveMinimumInWindow, bnplInstallmentsInWindow, bnplInstallmentAmount } from '@core/debt/bnplInstallment';
import { selectBnplBetweenPaycheck } from '@/store/guardianSelectors';

const CURRENT = '2026-08-03';
const NEXT = '2026-08-31';
const DUE = '2026-08-06';

const mk = (over: Partial<Debt> = {}): Debt =>
  ({
    id: 'd1', name: 'Car Loan', balance: 5000, minimumPayment: 50, apr: 10,
    dueDate: DUE, type: 'debt', recurrence: 'weekly', ...over,
  }) as unknown as Debt;

function storeWith(debt: Debt): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    paycheck: { ...s.paycheck, amount: '3000', payCycle: 'monthly', currentDate: CURRENT, nextPaycheckDate: NEXT },
    debts: [debt], requiredExpenses: [], livingExpenses: [], goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  } as DebtStore;
}

interface Row { label: string; debt: Debt }
const rows: Row[] = [];
// fractional `each` — a plan of 3 x $33.33, and other non-terminating splits
for (const each of [33.33, 16.67, 12.49, 41.66, 8.33, 24.99, 66.67, 3.33]) {
  rows.push({ label: `each=$${each} · big balance`, debt: mk({ minimumPayment: each, balance: 5000 }) });
  rows.push({ label: `each=$${each} · balance=3x each`, debt: mk({ minimumPayment: each, balance: Math.round(each * 3 * 100) / 100 }) });
  rows.push({ label: `each=$${each} · balance=2x each`, debt: mk({ minimumPayment: each, balance: Math.round(each * 2 * 100) / 100 }) });
}
// cents balances against a whole `each`
for (const balance of [75.49, 75.5, 75.51, 99.99, 100.01, 149.5, 149.49, 0.5, 50.5]) {
  rows.push({ label: `each=$50 · balance=$${balance}`, debt: mk({ minimumPayment: 50, balance }) });
}
// `each` larger than the balance
rows.push({ label: 'each=$500 · balance=$120', debt: mk({ minimumPayment: 500, balance: 120 }) });
rows.push({ label: 'each=$500 · balance=$1200', debt: mk({ minimumPayment: 500, balance: 1200 }) });
// one-time BNPL
rows.push({ label: 'one-time BNPL · bal $5000', debt: mk({ type: 'bnpl', recurrence: 'one-time', bnplProvider: 'Klarna', scheduledPaymentAmount: 50, remainingPayments: 4, balance: 5000 } as Partial<Debt>) });
// installment-native where scheduled != minimum
rows.push({ label: 'native sched=$80 min=$50 bal=$5000', debt: mk({ type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: 80, remainingPayments: 10, balance: 5000 } as Partial<Debt>) });
rows.push({ label: 'native sched=$80 min=$50 bal=$180', debt: mk({ type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: 80, remainingPayments: 10, balance: 180 } as Partial<Debt>) });
// remainingPayments capping below the cadence count
rows.push({ label: 'native sched=$50 remaining=3 bal=$5000', debt: mk({ type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: 50, remainingPayments: 3, balance: 5000 } as Partial<Debt>) });

console.log('case | nWin | each | balance | reserved | TRUE lands/total | SAID count/total | verdict');
let countWrong = 0, totalWrong = 0;
for (const { label, debt } of rows) {
  const each = bnplInstallmentAmount(debt);
  const nWin = bnplInstallmentsInWindow(debt, CURRENT, NEXT);
  const reserved = Math.min(effectiveMinimumInWindow(debt, CURRENT, NEXT), debt.balance);
  const trueLands = Math.min(Math.max(1, nWin), Math.ceil(Math.round(debt.balance * 100) / 100 / each));
  const trueTotal = Math.round(Math.min(Math.max(1, nWin) * each, debt.balance) * 100) / 100;
  const line = selectBnplBetweenPaycheck(storeWith(debt));
  const m = line?.match(/— (\d+) .* totalling about \$([\d,]+) /);
  const saidCount = m ? Number(m[1]) : null;
  const saidTotal = m ? Number(m[2].replace(/,/g, '')) : null;
  const cBad = saidCount !== null && saidCount !== trueLands;
  const tBad = saidTotal !== null && Math.abs(saidTotal - trueTotal) >= 0.5;
  if (cBad) countWrong++;
  if (tBad) totalWrong++;
  console.log(
    `${label.padEnd(34)} | ${String(nWin).padStart(2)} | ${String(each).padStart(6)} | ${String(debt.balance).padStart(7)} | ` +
      `${String(reserved).padStart(8)} | ${trueLands} / $${trueTotal} | ${saidCount ?? '-'} / ${saidTotal !== null ? '$' + saidTotal : '-'} | ` +
      `${line === null ? 'SILENT' : (cBad ? 'COUNT-WRONG ' : '') + (tBad ? 'TOTAL-WRONG' : '') || 'ok'}`,
  );
}
console.log(`\ncount wrong: ${countWrong}   total wrong (>= $0.50): ${totalWrong}`);
