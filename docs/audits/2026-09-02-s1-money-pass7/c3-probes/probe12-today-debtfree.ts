import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPlanState } from '@/store/planSelectors';
import { selectAllocation } from '@/store/selectors';
import { selectProvisionalPayoffs } from '@/store/balanceSelectors';
import { buildWidgetSnapshot } from '@/widget/snapshot';
import { debtLiveness } from '@/store/trustSelectors';

const OLD = process.env.C3_ASOF ?? '2025-04-02';
function aged(premium: boolean): DebtStore {
  const st = runMigrations({
    version: 8, subscriptionPlan: premium ? 'premium' : 'free', genuineCycleCount: 6,
    paycheck: { amount: '2200', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16', payCycle: 'biweekly' },
    debts: [{ id: 'a', name: 'Chase', balance: Number(process.env.C3_BAL ?? 400), originalBalance: 12000, minimumPayment: Number(process.env.C3_MIN ?? 120), apr: 0, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' }],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: '2026-03-05', recurrence: 'monthly' }],
    prefs: { onboardingComplete: true },
  });
  return { ...st, debts: st.debts.map((d) => ({ ...d, lastVerifiedDate: OLD, balanceAsOfDate: OLD })) };
}

for (const premium of [false, true]) {
  const store = aged(premium);
  // index.tsx:141-143, verbatim: the PROJECTED store is what selectPlanState is asked about.
  const engineStore = withProjectedBalances(store, premium);
  const allocation = selectAllocation(engineStore);
  const snap = buildWidgetSnapshot(store, 1);
  console.log(`${premium ? 'PREMIUM' : 'FREE (control)'}
  CONFIRMED balance (store.debts[0].balance) = $${store.debts[0].balance}
  PROJECTED balance (engineStore)            = $${engineStore.debts[0].balance.toFixed(2)}
  pendingDataRepairs                         = ${JSON.stringify(store.pendingDataRepairs)}
  debtLiveness(engineStore)                  = ${debtLiveness(engineStore)}
  debtLiveness(store)      [the anchors]     = ${debtLiveness(store)}
  Today  selectPlanState(engineStore, alloc) = ${selectPlanState(engineStore, allocation)}
  provisional payoffs offered                = ${JSON.stringify(selectProvisionalPayoffs(store, premium).map((d: { name: string }) => d.name))}
  WIDGET debtFreeDate / remaining            = ${JSON.stringify(snap.debtFreeDate)} / ${JSON.stringify(snap.remaining)}`);
}
