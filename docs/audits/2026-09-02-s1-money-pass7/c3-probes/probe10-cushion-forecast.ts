import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectCashTimeline } from '@/store/payoffSelectors';
import { effectivePaycheckBuffer, selectWaterFillPlan } from '@/store/selectors';
import { mayClaim } from '@/store/trustSelectors';
import { formatWhole } from '@/utils/format';

function s(ov: Record<string, unknown>): DebtStore {
  return runMigrations({
    version: 8, subscriptionPlan: 'premium', genuineCycleCount: 6,
    paycheck: { amount: '2200', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16', payCycle: 'biweekly' },
    debts: [{ id: 'a', name: 'Chase', balance: 9000, originalBalance: 12000, minimumPayment: 1500, apr: 24, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly', ...ov }],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: '2026-03-05', recurrence: 'monthly' }],
    prefs: { onboardingComplete: true },
  });
}

for (const [label, ov] of [
  ['CONTROL — every field readable', {}],
  ['minimumPayment unreadable', { minimumPayment: 'n/a' }],
  ['apr unreadable', { apr: 'n/a' }],
] as [string, Record<string, unknown>][]) {
  const store = s(ov);
  // cushion-forecast.tsx:26-30, verbatim. NOTE: the route asks no trust question at all.
  const engineStore = withProjectedBalances(store, true);
  const cycles = selectCashTimeline(engineStore, 6);
  const plan = selectWaterFillPlan(engineStore);
  const floor = effectivePaycheckBuffer(engineStore);
  console.log(`${label}
  repairs                   = ${JSON.stringify(store.pendingDataRepairs.map((r) => r.field))}
  mayClaim('required-plan') = ${mayClaim(store, 'required-plan')}   <- what the ENTRY card on Today asks
  mayClaim('row-figures')   = ${mayClaim(store, 'row-figures')}
  guard on this route       = NONE
  floor line               -> ${formatWhole(floor)}
  runway endingBalance/cy  -> ${JSON.stringify(cycles.map((cy) => formatWhole(cy.endingBalance)))}
  runway guardianState/cy  -> ${JSON.stringify(cycles.map((cy) => cy.guardianState))}
  water-fill total to debt -> ${formatWhole((plan?.rungs ?? []).reduce((a: number, r: { amount?: number }) => a + (r.amount ?? 0), 0))}`);
}
