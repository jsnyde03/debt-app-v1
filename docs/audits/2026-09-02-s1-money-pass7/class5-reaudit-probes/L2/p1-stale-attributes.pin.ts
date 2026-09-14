/**
 * L2 probe P1 (pin ea3f5e0e). Run: copy to apps/rn/src/__probe_L2_p1.ts in the worktree, `npx tsx src/__probe_L2_p1.ts`.
 *
 * Question: the Live Activity's `paydayDateISO` is an ATTRIBUTE (fixed for the activity's life), and since 3066026a the
 * "Payday landed" button queues that attribute. `decideLiveActivityAction` answers a changed payday with `update`, not
 * a restart. So after an in-window payday edit, does the Lock Screen tap name a payday the plan no longer has?
 */
import { parseLocalDate, toLocalISODate } from '@core/utils/localDate';

import { drainPendingActions } from '@/appIntents/drainPendingActions';
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import type { LiveActivityBridge } from '@/liveActivity/liveActivityBridge.types';
import { startLiveActivitySync } from '@/liveActivity/liveActivitySync';
import type { PaydayActivityContent } from '@/liveActivity/paydayActivityContent';
import { createDebtStore } from '@/store/store';

function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

const today = createDefaultStore().paycheck.currentDate;

/** liveActivitySync.test.ts's seed, with payday TOMORROW (inside the window). */
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

function bridgeStub() {
  const calls: string[] = [];
  const activity: { attributesPayday: string | null; state: PaydayActivityContent | null } = { attributesPayday: null, state: null };
  const bridge: LiveActivityBridge = {
    areActivitiesEnabled: () => true,
    // Mirrors LiveActivityModule.swift: start requests a NEW activity whose attributes carry content.paydayDateISO;
    // update pushes ContentState only (toState() drops paydayDateISO), so the attributes do not move.
    start: async (c) => { calls.push(`start(${c.paydayDateISO})`); activity.attributesPayday = c.paydayDateISO; activity.state = c; return true; },
    update: async (c) => { calls.push(`update(${c.paydayDateISO})`); activity.state = c; return true; },
    end: async () => { calls.push('end'); activity.attributesPayday = null; activity.state = null; return true; },
  };
  return { bridge, calls, activity };
}

const settle = () => new Promise((r) => setTimeout(r, 30));

async function run(label: string, correctTo: string | null, tapWith: (a: { attributesPayday: string | null; state: PaydayActivityContent | null }) => string | undefined) {
  const store = createDebtStore({ now: () => today });
  store.setState({ store: seed() } as never);
  const { bridge, calls, activity } = bridgeStub();
  await startLiveActivitySync(store, bridge, 0);
  if (correctTo) {
    // PaycheckSheet.submit writes exactly these two dates (currentDate: todayLocalISO(), nextPaycheckDate: nextDate).
    store.getState().updatePaycheck({ currentDate: today, nextPaycheckDate: correctTo });
    await settle();
  }
  const buttonVisible = activity.state?.daysUntilPayday === 0; // PaydayLiveActivity.swift: `state.daysUntilPayday == 0`
  const tapDate = tapWith(activity);
  const before = store.getState().store.cycleHistory.length;
  let queue: string | null = JSON.stringify([tapDate === undefined ? { kind: 'payday-landed', id: 'tap-1' } : { kind: 'payday-landed', id: 'tap-1', paydayDateISO: tapDate }]);
  drainPendingActions({ read: () => queue, clear: () => { queue = null; } }, store.getState());
  const after = store.getState().store.cycleHistory.length;
  console.log(JSON.stringify({
    label,
    calls,
    attributesPayday: activity.attributesPayday,
    statePayday: activity.state?.paydayDateISO,
    daysUntilPayday: activity.state?.daysUntilPayday,
    buttonVisible,
    planNextPayday: before === after ? store.getState().store.paycheck.nextPaycheckDate : '(rolled)',
    tapDate,
    rolled: after - before,
  }));
}

(async () => {
  console.log('today =', today);
  // CONTROL A — no edit; payday is tomorrow, so the button is not shown and a tap for tomorrow is (correctly) early.
  await run('control-no-edit', null, (a) => a.attributesPayday ?? undefined);
  // CONTROL B — the payday corrected to today, tap carries the date the plan has: rolls once.
  await run('control-tap-names-plan-payday', today, () => today);
  // SUBJECT — the payday corrected to today; the tap carries what the Swift button queues: context.attributes.paydayDateISO.
  await run('subject-tap-names-attribute', today, (a) => a.attributesPayday ?? undefined);
})().catch((e) => { console.error(e); process.exit(1); });
