/* C1 pass-7 probe 7: PaydayCaptureSheet's required-row header figure vs its own sub-line.
 * ONE store, ONE variable = whether an expense reserve pre-funds part of a bill.
 * `requiredTotal` is the prop index.tsx passes (allocation.totalRequired) and is rendered at :440;
 * `requiredSub` at :274 renders selectRequiredSplit(...).paidGross. */
import { runMigrations } from '@/data/migrations';
import { selectAllocation } from '@/store/selectors';
import { selectRequiredRows, selectRequiredSplit, requiredRowId } from '@/store/planSelectors';

function store(reserveBalance: number) {
  const raw: any = {
    storeVersion: 12,
    paycheck: { amount: '2000', payCycle: 'biweekly', nextPaycheckDate: '2026-09-15', currentDate: '2026-09-02', semiMonthlyFirstDay: '1', semiMonthlySecondDay: '15', monthlyPayDay: '1', incomeVaries: false, leanAmount: 0, typicalAmount: 0 },
    payoffStrategy: 'snowball',
    debts: [{ id: 'd1', name: 'Visa', balance: 3000, minimumPayment: 60, apr: 22, type: 'debt', recurrence: 'monthly', dueDate: '2026-09-10' }],
    requiredExpenses: [{ id: 'r1', name: 'Rent', amount: 350, dueDate: '2026-09-05', recurrence: 'monthly' }],
    livingExpenses: [], goals: [], cushionFloor: 200, subscriptionPlan: 'premium', prefs: { onboardingComplete: true },
    ...(reserveBalance > 0 ? { expenseReserve: { balance: reserveBalance } } : {}),
  };
  return runMigrations(raw);
}

for (const reserve of [0, 350]) {
  const s: any = store(reserve);
  const alloc: any = selectAllocation(s);
  const rows: any = selectRequiredRows(s, alloc);
  const allPaid: Record<string, boolean> = {};
  for (const r of rows) { const id = requiredRowId(r); if (id) allPaid[id] = true; }
  const split = selectRequiredSplit(rows, allPaid);
  console.log(`\n======== expenseReserve.balance = ${reserve}`);
  console.log('  rows =', rows.map((r: any) => `${r.item.label}: amount=${r.item.amount} reserveCovered=${r.item.reserveCovered ?? 0}`).join(' | '));
  console.log('  HEADER figure  :440  formatCurrency(requiredTotal) =', alloc.totalRequired);
  console.log('  SUB line       :274  paidGross                     =', split.paidGross);
  console.log('  (net paid)                                        =', split.paid);
  console.log(alloc.totalRequired === split.paidGross ? '  -> AGREE' : '  >>> HEADER AND ITS OWN SUB-LINE DISAGREE <<<');
}
