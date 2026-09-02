/* B1 probe 2 — does selectExpenseReserveOffer's `spare` double-count the contribution already inside
   `selectDiscretionary`, and does `potAfter` then promise a pot the engine will not hold? */
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectExpenseReserveOffer, selectExpenseReserveNow, selectRecurringSmoothed } from '@/store/expenseReserveSelectors';
import { selectDiscretionary, sumCategory } from '@/store/planSelectors';
import { selectAllocation, selectExpenseReserveContribution } from '@/store/selectors';

const s = createDefaultStore();
function mk(contribution: number): DebtStore {
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    cushionFloor: 200,
    paycheck: { ...s.paycheck, amount: '1200', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts: [],
    requiredExpenses: [
      { id: 'rent', name: 'rent', amount: 350, dueDate: '2026-08-06', recurrence: 'monthly', category: 'housing' },
      { id: 'ins', name: 'insurance', amount: 700, dueDate: '2026-09-20', recurrence: 'monthly', category: 'housing' },
    ],
    goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
    expenseReserve: { balance: 0, contribution: { forCycle: '2026-09-01', amount: contribution } },
  } as unknown as DebtStore;
}

function show(label: string, st: DebtStore) {
  const a = selectAllocation(st)!;
  const already = selectExpenseReserveContribution(st);
  const disc = selectDiscretionary(a);
  const cb = sumCategory(a, 'cushion_buffer');
  const er = sumCategory(a, 'expense_reserve');
  console.log(`\n== ${label} ==`);
  console.log(`  stored contribution      = ${already}`);
  console.log(`  allocation.expenseReserveHeld = ${(a as any).expenseReserveHeld}`);
  console.log(`  bucket expense_reserve   = ${er}`);
  console.log(`  bucket cushion_buffer    = ${cb}`);
  console.log(`  selectDiscretionary      = ${disc}   (already contains expense_reserve ${er})`);
  console.log(`  formula spare = max(0,disc-cb)+already = ${Math.max(0, disc - cb)} + ${already} = ${Math.round((Math.max(0,disc-cb)+already)*100)/100}`);
  console.log(`  true ceiling  = disc - cb              = ${Math.round((disc-cb)*100)/100}`);
  const offer = selectExpenseReserveOffer(st);
  console.log(`  selectRecurringSmoothed.perPaycheckTotal = ${selectRecurringSmoothed(st).perPaycheckTotal}`);
  console.log(`  OFFER =`, offer);
  console.log(`  selectExpenseReserveNow (what the Money hero reads) = ${selectExpenseReserveNow(st)}`);
}

show('A · $175 already reserved', mk(175));
// Now take the offer that A produced: set the contribution to alreadyReserved + offer, and re-read.
const a0 = selectExpenseReserveOffer(mk(175))!;
const taken = Math.round((175 + a0.offer) * 100) / 100;
console.log(`\n>>> the user TAKES the offer: contribution 175 -> ${taken}; the offer promised potAfter = ${a0.potAfter}`);
show(`B · after taking it (contribution ${taken})`, mk(taken));
