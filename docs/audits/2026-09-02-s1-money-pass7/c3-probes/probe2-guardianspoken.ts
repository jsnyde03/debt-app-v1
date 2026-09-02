import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { buildWidgetSnapshot } from '@/widget/snapshot';
import { mayClaim } from '@/store/trustSelectors';

function store(debts: unknown[], premium = false): DebtStore {
  return runMigrations({
    version: 8, subscriptionPlan: premium ? 'premium' : 'free', genuineCycleCount: 6,
    paycheck: { amount: '2000', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
    debts, prefs: { onboardingComplete: true },
  });
}
const cases: [string, DebtStore][] = [
  ['FREE, all readable', store([{ id: 'a', name: 'Visa', balance: 6000, originalBalance: 8000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' }], false)],
  ['PREMIUM, all readable', store([{ id: 'a', name: 'Visa', balance: 6000, originalBalance: 8000, minimumPayment: 100, apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' }], true)],
  ['PREMIUM, minimumPayment unread', store([{ id: 'a', name: 'Visa', balance: 6000, originalBalance: 8000, minimumPayment: 'n/a', apr: 20, dueDate: '2026-03-10', type: 'debt', recurrence: 'monthly' }], true)],
];
for (const [label, s] of cases) {
  const snap = buildWidgetSnapshot(s, 1);
  console.log(`${label}
  subscriptionPlan   = ${s.subscriptionPlan}
  mayClaim(required) = ${mayClaim(s, 'required-plan')}
  snap.isPremium     = ${snap.isPremium}
  snap.guardianSpoken= ${JSON.stringify(snap.guardianSpoken)}
  -> PaycheckCheckIntent branch: ${snap.guardianSpoken === '' ? 'PREMIUM UPSELL' : 'speaks the read'}`);
}
