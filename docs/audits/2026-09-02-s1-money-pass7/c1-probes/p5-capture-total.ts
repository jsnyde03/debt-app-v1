/* C1 pass-7 probe 5: PaydayCaptureSheet's "Payday captured $X" figure.
 * ONE store. ONE variable = which of the two branches at PaydayCaptureSheet.tsx:201 computes the total,
 * i.e. whether the user went through "Adjust". The ANSWERS are identical in both runs: everything paid. */
import { runMigrations } from '@/data/migrations';
import { selectAllocation } from '@/store/selectors';
import { selectRequiredRows, selectRequiredSplit, requiredRowId } from '@/store/planSelectors';

function store(paidThisCycle: boolean) {
  const raw: any = {
    storeVersion: 12,
    paycheck: { amount: '2000', payCycle: 'biweekly', nextPaycheckDate: '2026-09-15', currentDate: '2026-09-02', semiMonthlyFirstDay: '1', semiMonthlySecondDay: '15', monthlyPayDay: '1', incomeVaries: false, leanAmount: 0, typicalAmount: 0 },
    payoffStrategy: 'snowball',
    debts: [{ id: 'd1', name: 'Visa', balance: 3000, minimumPayment: 60, apr: 22, type: 'debt', recurrence: 'monthly', dueDate: '2026-09-10' }],
    requiredExpenses: [
      { id: 'r1', name: 'Rent', amount: 400, dueDate: '2026-09-05', recurrence: 'monthly' },
      { id: 'r2', name: 'Phone', amount: 90, dueDate: '2026-09-08', recurrence: 'monthly', isPaidThisCycle: paidThisCycle },
    ],
    livingExpenses: [], goals: [], cushionFloor: 200, subscriptionPlan: 'premium', prefs: { onboardingComplete: true },
  };
  return runMigrations(raw);
}

for (const paid of [false, true]) {
  const s: any = store(paid);
  const alloc: any = selectAllocation(s);
  const rows: any = selectRequiredRows(s, alloc);
  // "Mark all paid" (PaydayCaptureSheet.tsx:219-226) — every row true.
  const allPaid: Record<string, boolean> = {};
  for (const r of rows) { const id = requiredRowId(r); if (id) allPaid[id] = true; }
  const split = selectRequiredSplit(rows, allPaid);

  // PaydayCaptureSheet.tsx:201, both branches. plannedTotal = 0 (no recommended actions in this fixture).
  const plannedTotal = 0;
  const capturedNoAdjust = alloc.totalRequired + plannedTotal;      // hasAdjustedRequired === false
  const capturedAfterAdjust = split.paid + plannedTotal;            // hasAdjustedRequired === true

  console.log(`\n======== r2 "Phone" isPaidThisCycle = ${paid}`);
  console.log('  rows in the sheet             =', rows.map((r: any) => `${r.item.label} $${r.item.amount}`).join(' | '));
  console.log('  requiredTotal (allocation)    =', alloc.totalRequired);
  console.log('  requiredPaidTotal (all rows)  =', split.paid, ' gross =', split.paidGross);
  console.log('  "Payday captured" — Confirm directly       =', capturedNoAdjust);
  console.log('  "Payday captured" — Adjust > Mark all paid =', capturedAfterAdjust);
  console.log('  requiredSub line (gross)                   =', `${split.paidGross} paid`);
  console.log(capturedNoAdjust === capturedAfterAdjust ? '  -> AGREE' : '  >>> TWO DIFFERENT NUMBERS FOR THE SAME ANSWERS <<<');
}
