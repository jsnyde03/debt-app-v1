import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPlanSummary, selectRequiredRows, selectPlanState } from '@/store/planSelectors';
import { selectAllocation } from '@/store/selectors';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
import { mayClaim } from '@/store/trustSelectors';

const OLD = '2025-04-02';
function aged(ov: Record<string, unknown>): DebtStore {
  const st = runMigrations({
    version: 8, subscriptionPlan: 'premium', genuineCycleCount: 6,
    paycheck: { amount: '2200', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16', payCycle: 'biweekly' },
    debts: [{ id: 'a', name: 'Chase', balance: 400, originalBalance: 12000, minimumPayment: 120, apr: 29.99, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly', ...ov }],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: '2026-03-05', recurrence: 'monthly' }],
    prefs: { onboardingComplete: true },
  });
  return { ...st, debts: st.debts.map((d) => ({ ...d, lastVerifiedDate: OLD, balanceAsOfDate: OLD })) };
}

for (const [label, ov] of [
  ['CONTROL — every field readable', {}],
  ['apr unreadable', { apr: 'n/a' }],
] as [string, Record<string, unknown>][]) {
  const store = aged(ov);
  // index.tsx:141-149, verbatim.
  const engineStore = withProjectedBalances(store, true);
  const allocation = selectAllocation(engineStore);
  const requiredRows = allocation ? selectRequiredRows(engineStore, allocation) : [];
  const summary = allocation ? selectPlanSummary(engineStore, allocation, requiredRows) : null;
  const guardian = selectPaydayGuardian(engineStore);
  console.log(`${label}
  repairs                     = ${JSON.stringify(store.pendingDataRepairs.map((r) => r.field))}
  mayClaim('required-plan')   = ${mayClaim(store, 'required-plan')}  <- PlanHero's ONLY guard (unreadPlanInputs)
  mayClaim('row-figures')     = ${mayClaim(store, 'row-figures')}
  projected Chase balance     = ${engineStore.debts[0].balance.toFixed(2)}
  planState                   = ${selectPlanState(engineStore, allocation)}
  summary.totalRequired       = ${summary?.totalRequired}
  summary.toDebt              = ${summary?.toDebt}
  summary.spare/leftover      = ${JSON.stringify(summary ? Object.fromEntries(Object.entries(summary).filter(([k]) => /spare|left|extra|deploy|cushion/i.test(k))) : null)}
  guardian.deployedToDebt     = ${guardian?.deployedToDebt}`);
}
