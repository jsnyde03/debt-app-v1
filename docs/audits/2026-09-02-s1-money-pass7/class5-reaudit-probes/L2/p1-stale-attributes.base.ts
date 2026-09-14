/**
 * L2 probe P1 at BASE c7df99c2. Run: copy to apps/rn/src/__probe_L2_p1.ts in the -base worktree.
 *
 * At the base the Swift button queued `PaydayLandedIntent()` — no date — and `applyPaydayLandedIntent` took no argument.
 * Same edit as the pin probe; the tap is what the base binary queued.
 */
import { parseLocalDate, toLocalISODate } from '@core/utils/localDate';

import { drainPendingActions } from '@/appIntents/drainPendingActions';
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { decideLiveActivityAction } from '@/liveActivity/paydayActivityContent';
import { createDebtStore } from '@/store/store';

function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}
const today = createDefaultStore().paycheck.currentDate;
function seed(): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    paycheck: { ...s.paycheck, payCycle: 'biweekly', amount: '3000', currentDate: today, nextPaycheckDate: addDays(today, 1) },
    requiredExpenses: [{ id: 'e0', name: 'Bill', amount: 300, dueDate: today, recurrence: 'monthly' } as never],
    prefs: { ...s.prefs, paydayLiveActivityEnabled: true, onboardingComplete: true },
  };
}

const store = createDebtStore({ now: () => today });
store.setState({ store: seed() } as never);
const first = decideLiveActivityAction(store.getState().store, false, null);
const key = first.kind === 'start' ? first.key : null;
store.getState().updatePaycheck({ currentDate: today, nextPaycheckDate: today });
const second = decideLiveActivityAction(store.getState().store, true, key);
const before = store.getState().store.cycleHistory.length;
let queue: string | null = JSON.stringify([{ kind: 'payday-landed', id: 'tap-1' }]);
drainPendingActions({ read: () => queue, clear: () => { queue = null; } }, store.getState());
console.log(JSON.stringify({
  today,
  first: first.kind,
  firstPayday: first.kind === 'start' ? first.content.paydayDateISO : null,
  second: second.kind,
  secondPayday: second.kind === 'update' || second.kind === 'start' ? second.content.paydayDateISO : null,
  secondDays: second.kind === 'update' || second.kind === 'start' ? second.content.daysUntilPayday : null,
  rolled: store.getState().store.cycleHistory.length - before,
}));
