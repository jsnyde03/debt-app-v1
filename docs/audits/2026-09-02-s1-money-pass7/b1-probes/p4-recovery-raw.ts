/* B1 probe 4 — the other RAW-shortfall readers on the same store as p3. */
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectRecoveryPlan } from '@/store/recoverySelectors';
import { selectExpenseReserveOffer } from '@/store/expenseReserveSelectors';
import { selectAllocation } from '@/store/selectors';
import { nettedTopUp } from '@/store/topUpSelectors';

const s0 = createDefaultStore();
function mk(topUp?: number): DebtStore {
  return {
    ...s0, subscriptionPlan: 'premium', genuineCycleCount: 6, cushionFloor: 200,
    paycheck: { ...s0.paycheck, amount: '2000', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts: [],
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 2150, dueDate: '2026-08-05', recurrence: 'monthly' },
      { id: 'net', name: 'Internet', amount: 60, dueDate: '2026-08-20', recurrence: 'monthly' },
    ],
    goals: [{ id: 'vac', name: 'Vacation', targetAmount: 1000, currentAmount: 900, type: 'savings' }],
    prefs: { ...s0.prefs, onboardingComplete: true },
    ...(topUp ? { cycleTopUp: { forCycle: '2026-09-01', amount: topUp, goalId: 'vac' } } : {}),
  } as unknown as DebtStore;
}
for (const t of [undefined, 500]) {
  const st = mk(t);
  const a = selectAllocation(st)!;
  const n = nettedTopUp(st, a.shortfall);
  const plan = selectRecoveryPlan(st);
  console.log(`\n=== cycleTopUp = ${t ?? 'none'} · raw shortfall ${a.shortfall} · residual ${n.residual} ===`);
  console.log('  selectRecoveryPlan =', plan ? JSON.stringify({ gap: (plan as any).gap, ...(plan as any) }).slice(0, 400) : null);
  console.log('  selectExpenseReserveOffer =', selectExpenseReserveOffer(st));
}
