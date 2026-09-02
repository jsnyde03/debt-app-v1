import { runMigrations } from '@/data/migrations';
import { selectAllocation } from '@/store/selectors';
function storeWith(minimumPayment: unknown) {
  const raw: any = {
    storeVersion: 12,
    paycheck: { amount: '2000', payCycle: 'biweekly', nextPaycheckDate: '2026-09-15', currentDate: '2026-09-02', semiMonthlyFirstDay: '1', semiMonthlySecondDay: '15', monthlyPayDay: '1', incomeVaries: false, leanAmount: 0, typicalAmount: 0 },
    payoffStrategy: 'snowball',
    debts: [
      { id: 'd1', name: 'Visa', balance: 3000, minimumPayment: 60, apr: 22, type: 'credit_card' },
      { id: 'd2', name: 'Car loan', balance: 18000, minimumPayment, apr: 6, type: 'auto' },
    ],
    requiredExpenses: [{ id: 'r1', name: 'Rent', amount: 400, dueDate: '2026-09-05', recurrence: 'monthly' }],
    livingExpenses: [], goals: [], cushionFloor: 200, subscriptionPlan: 'premium', prefs: { onboardingComplete: true },
  };
  return runMigrations(raw);
}
for (const min of [500, '--'] as const) {
  const s: any = storeWith(min);
  const a: any = selectAllocation(s);
  console.log('\nmin =', JSON.stringify(min), '-> stored', s.debts[1].minimumPayment);
  console.log('  debts        =', JSON.stringify(s.debts));
  console.log('  totalRequired=', a?.totalRequired, ' paycheckAmount=', a?.paycheckAmount, ' remaining=', a?.remaining, ' shortfall=', a?.shortfall);
  console.log('  allocations  =', JSON.stringify(a?.allocations?.map((x: any) => ({ c: x.category, amt: x.amount, t: x.targetId }))));
}
