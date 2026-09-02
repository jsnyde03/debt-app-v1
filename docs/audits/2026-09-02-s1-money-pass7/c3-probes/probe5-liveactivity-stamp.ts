import { parseLocalDate, toLocalISODate } from '@core/utils/localDate';
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { createDebtStore } from '@/store/store';
import { startLiveActivitySync } from '@/liveActivity/liveActivitySync';
import type { LiveActivityBridge } from '@/liveActivity/liveActivityBridge.types';
import { buildPaydayActivityContent, type PaydayActivityContent } from '@/liveActivity/paydayActivityContent';

function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso); d.setDate(d.getDate() + days); return toLocalISODate(d);
}
function seed(): DebtStore {
  const s = createDefaultStore();
  const currentDate = '2026-03-02';
  return {
    ...s, subscriptionPlan: 'premium', genuineCycleCount: 6,
    paycheck: { ...s.paycheck, payCycle: 'biweekly', amount: '3000', currentDate, nextPaycheckDate: addDays(currentDate, 2) },
    requiredExpenses: [{ id: 'e0', name: 'Bill', amount: 300, dueDate: currentDate, recurrence: 'monthly' } as never],
    prefs: { ...s.prefs, paydayLiveActivityEnabled: true, onboardingComplete: true },
  };
}
const BIG_BILL = { id: 'e1', name: 'Extra', amount: 5200, dueDate: '2026-03-02', recurrence: 'monthly' } as never;
const tick = () => new Promise((r) => setTimeout(r, 1100));

/** The bridge, exactly as `liveActivityBridge.native.ts` presents it: every method returns VOID and
 *  swallows its own native throw, so the manager cannot tell a landed call from a dropped one. */
function makeBridge(fail: 'start' | 'update') {
  const onScreen: PaydayActivityContent[] = [];
  const attempted: string[] = [];
  const bridge: LiveActivityBridge = {
    areActivitiesEnabled: () => true,
    start: (c) => { attempted.push('start'); if (fail !== 'start') onScreen.push(c); },
    update: (c) => { attempted.push('update'); if (fail !== 'update') onScreen.push(c); },
    end: () => { attempted.push('end'); },
  };
  return { bridge, onScreen, attempted };
}

async function caseUpdateFails() {
  console.log('\n=== CASE A — start lands, one update is dropped by native, then the store settles ===');
  const store = createDebtStore();
  store.setState({ store: seed() } as never);
  const { bridge, onScreen, attempted } = makeBridge('update');
  startLiveActivitySync(store, bridge);
  console.log('launch          : attempted', JSON.stringify(attempted));

  store.getState().addExpense(BIG_BILL);
  await tick();
  console.log('bill added      : attempted', JSON.stringify(attempted));

  // The store settles: a committed change that does not move the content (the usual case).
  store.getState().setCushionFloor(400); await tick();
  store.getState().markReviewPrompted();  await tick();
  console.log('store settles   : attempted', JSON.stringify(attempted));

  const truth = buildPaydayActivityContent(store.getState().store)!;
  console.log('  STORE says      :', JSON.stringify({ state: truth.guardianState, title: truth.title, line: truth.line }));
  console.log('  LOCK SCREEN says:', JSON.stringify({ state: onScreen.at(-1)!.guardianState, title: onScreen.at(-1)!.title, line: onScreen.at(-1)!.line }));
}

async function caseStartFails() {
  console.log('\n=== CASE B — the ActivityKit start request is refused (native swallowed it) ===');
  const store = createDebtStore();
  store.setState({ store: seed() } as never);
  const { bridge, onScreen, attempted } = makeBridge('start');
  startLiveActivitySync(store, bridge);
  store.getState().addExpense(BIG_BILL); await tick();
  store.getState().setCushionFloor(400); await tick();
  console.log('attempted        :', JSON.stringify(attempted));
  console.log('  starts re-tried:', attempted.filter((a) => a === 'start').length - 1);
  console.log('  on the Lock Screen:', onScreen.length, 'payload(s) — the countdown never appears');
}

void (async () => { await caseUpdateFails(); await caseStartFails(); })();
