import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { buildWidgetSnapshot } from '@/widget/snapshot';
import { partitionDebts, mayClaim } from '@/store/trustSelectors';
import { formatWhole } from '@/utils/format';

function store(debts: unknown[], premium = false): DebtStore {
  return runMigrations({
    version: 8,
    subscriptionPlan: premium ? 'premium' : 'free',
    genuineCycleCount: 6,
    paycheck: { amount: '2000', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
    debts,
    prefs: { onboardingComplete: true },
  });
}

const s = store([
  { id: 'a', name: 'Chase', balance: 'n/a', originalBalance: 12000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' },
  { id: 'b', name: 'Visa', balance: 4000, originalBalance: 4000, minimumPayment: 80, apr: 19, dueDate: '2026-03-12', type: 'debt', recurrence: 'monthly' },
], true);

console.log('pendingDataRepairs =', JSON.stringify(s.pendingDataRepairs));
console.log("mayClaim('debt-balances') =", mayClaim(s, 'debt-balances'));
console.log("mayClaim('row-figures')   =", mayClaim(s, 'row-figures'));
const p = partitionDebts(s);
console.log('partition.live         =', p.live.map((d) => `${d.name}:${d.balance}`));
console.log('partition.unreadBalance=', p.unreadBalance.map((d) => `${d.name}:${d.balance}`));
const snap = buildWidgetSnapshot(s, 1);
console.log('snap.remaining     =', JSON.stringify(snap.remaining));
console.log('snap.debtFreeDate  =', JSON.stringify(snap.debtFreeDate));
console.log('snap.pctLabel      =', JSON.stringify(snap.pctLabel));
console.log('snap.balancesUnread=', snap.balancesUnread);
console.log('snap.debtsJson     =', snap.debtsJson);
console.log('formatWhole(0)     =', JSON.stringify(formatWhole(0)));
