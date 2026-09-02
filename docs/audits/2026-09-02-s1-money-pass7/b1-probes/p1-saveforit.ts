/* B1 probe 1 — does selectSaveForItOptions read the partition total while the card beside it reads spendable? */
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectAffordability, selectSaveForItOptions } from '@/store/guardianSelectors';
import { selectDiscretionary, selectSpendable, selectPlanSummary, selectRequiredRows } from '@/store/planSelectors';
import { selectAllocation } from '@/store/selectors';

const s = createDefaultStore();
const base: DebtStore = {
  ...s,
  subscriptionPlan: 'premium',
  genuineCycleCount: 6,
  cushionFloor: 200,
  paycheck: { ...s.paycheck, amount: '1200', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
  debts: [],
  requiredExpenses: [
    { id: 'rent', name: 'rent', amount: 350, dueDate: '2026-08-06', recurrence: 'monthly', category: 'housing' },
    { id: 'elec', name: 'elec', amount: 120, dueDate: '2026-09-20', recurrence: 'monthly', category: 'housing' },
  ],
  goals: [],
  prefs: { ...s.prefs, onboardingComplete: true },
  expenseReserve: { balance: 0, contribution: { forCycle: '2026-09-01', amount: 175 } },
} as unknown as DebtStore;

const alloc = selectAllocation(base)!;
const summary = selectPlanSummary(base, alloc, selectRequiredRows(base, alloc));
console.log('paycheck                 =', alloc.paycheckAmount);
console.log('expenseReserveHeld       =', (alloc as any).expenseReserveHeld);
console.log('summary.billsReserve     =', summary.billsReserve);
console.log('selectDiscretionary      =', selectDiscretionary(alloc));
console.log('selectSpendable          =', selectSpendable(alloc));

const PURCHASE = 2500;
const aff = selectAffordability(base, PURCHASE)!;
console.log('\n-- the card the sheet is opened FROM --');
console.log('verdict                  =', aff.verdict);
console.log('discretionaryNow (shown) =', aff.discretionaryNow);

console.log('\n-- the sheet it opens --');
for (const o of selectSaveForItOptions(base, PURCHASE)) {
  console.log(`${o.key.padEnd(10)} perPaycheck=${o.perPaycheck} paychecks=${o.paychecks} readyBy=${o.readyBy}`);
}

// What the same math produces off the figure the card printed.
const d = selectSpendable(alloc);
const nTrue = Math.max(1, Math.ceil(PURCHASE / d));
const perTrue = Math.ceil((PURCHASE / nTrue) / 5) * 5;
console.log('\n-- the same formula on the SPENDABLE figure --');
console.log(`fast  perPaycheck=${perTrue} paychecks=${nTrue}`);
