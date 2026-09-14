/**
 * L1 probe 7 — Money's debt list for a premium debt that PROJECTS to $0 (unconfirmed).
 * `money.tsx:383` renders `active = view.order` where `view = selectPayoffView(withProjectedBalances(store, premium))`
 * (ranks `balance > 0` on the PROJECTION, `payoffSelectors.ts:132`), and `:393-394` render BALANCE UNREAD / PAID OFF
 * from `partitionDebts(store)` on the RAW store. Is every debt in exactly one section?
 * Run from <tree>/apps/rn:  npx tsx --tsconfig <tree>/apps/rn/tsconfig.json <this file>
 */
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectPayoffView } from '@/store/payoffSelectors';
import { partitionDebts } from '@/store/trustSelectors';

const DAY = '2026-08-26';
const NEXT = '2026-09-09';
const ANCHOR = '2026-05-01';
function store(plan: 'premium' | 'free'): DebtStore {
  const s = runMigrations({
    version: 8,
    paycheck: { amount: '2500', currentDate: DAY, nextPaycheckDate: NEXT },
    debts: [
      { id: 'x', name: 'StoreCard', balance: 100, originalBalance: 800, minimumPayment: 120, apr: 20, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: ANCHOR, lastVerifiedDate: ANCHOR },
      { id: 'y', name: 'Visa', balance: 3000, originalBalance: 3500, minimumPayment: 90, apr: 18, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
      { id: 'z', name: 'OldLoan', balance: 0, originalBalance: 500, minimumPayment: 50, apr: 5, dueDate: DAY, type: 'debt', recurrence: 'monthly', balanceAsOfDate: DAY, lastVerifiedDate: DAY },
    ],
    requiredExpenses: [{ id: 'e0', name: 'Rent', amount: 900, dueDate: DAY, recurrence: 'monthly', category: 'housing' }],
    cushionFloor: 200,
    prefs: { onboardingComplete: true },
  });
  return { ...s, subscriptionPlan: plan };
}
for (const plan of ['premium', 'free'] as const) {
  const s = store(plan);
  const view = selectPayoffView(withProjectedBalances(s, plan === 'premium'));
  const { cleared, unreadBalance } = partitionDebts(s);
  const sections = { active: view.order.map((d) => d.id), unread: unreadBalance.map((d) => d.id), paidOff: cleared.map((d) => d.id) };
  const shown = [...sections.active, ...sections.unread, ...sections.paidOff];
  const missing = s.debts.map((d) => d.id).filter((id) => !shown.includes(id));
  const doubled = shown.filter((id, i) => shown.indexOf(id) !== i);
  console.log(JSON.stringify({ plan, sections, missing, doubled }));
}
