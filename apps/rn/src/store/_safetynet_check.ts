import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { withProjectedBalances } from '@/store/balanceSelectors';

function make(genuineCycleCount: number): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount,
    cushionFloor: 200,
    paycheck: { ...s.paycheck, amount: '2000', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts: [{ id: 'card', name: 'Card', balance: 5000, minimumPayment: 100, apr: 20, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
    requiredExpenses: [{ id: 'rent', name: 'Rent', amount: 500, dueDate: '2026-08-05', recurrence: 'monthly' }],
    goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

for (const n of [0, 6]) {
  const store = make(n);
  const brief = selectPaydayGuardian(withProjectedBalances(store, true));
  console.log(`genuineCycleCount=${n} (${n < 4 ? 'COLD-START' : 'established'}) → Safety net (heldReserve) = $${brief?.heldReserve ?? 'null'}`);
}
