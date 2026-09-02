import { runMigrations } from '@/data/migrations';
import { rowFieldUnread } from '@/store/trustSelectors';
import { formatWhole } from '@/utils/format';

const store = runMigrations({
  version: 8, subscriptionPlan: 'free', genuineCycleCount: 6,
  paycheck: { amount: '2000', currentDate: '2026-03-02', nextPaycheckDate: '2026-03-16' },
  goals: [
    { id: 'g1', name: 'House Fund', targetAmount: 'n/a', currentAmount: 500, type: 'savings' },
    { id: 'g2', name: 'Car Fund', targetAmount: 'n/a', currentAmount: 300, type: 'savings' },
    { id: 'g3', name: 'Vacation', targetAmount: 2000, currentAmount: 200, type: 'savings' },
  ],
  prefs: { onboardingComplete: true },
});
const goals = store.goals;
const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
// money.tsx:1234-1235, verbatim.
const targetUnread = goals.some((g) => rowFieldUnread(store, 'goal-amounts', 'goal', g.id, 'targetAmount'));
const savedUnread = goals.some((g) => rowFieldUnread(store, 'goal-amounts', 'goal', g.id, 'currentAmount'));
const unreadTargets = goals.filter((g) => rowFieldUnread(store, 'goal-amounts', 'goal', g.id, 'targetAmount'));
console.log('repairs                =', JSON.stringify(store.pendingDataRepairs.map((r) => `${r.id}:${r.field}`)));
console.log('goals with an UNREAD target =', unreadTargets.length, JSON.stringify(unreadTargets.map((g) => g.name)));
console.log('targetUnread / savedUnread  =', targetUnread, '/', savedUnread);
// money.tsx:1241-1248, verbatim.
console.log('hero value ->', JSON.stringify(savedUnread ? 'Some amounts unread' : formatWhole(totalSaved)));
console.log('hero sub   ->', JSON.stringify(savedUnread ? 'set them again and your total comes back' : targetUnread ? 'saved — one target could not be read' : 'saved of $X target'));
