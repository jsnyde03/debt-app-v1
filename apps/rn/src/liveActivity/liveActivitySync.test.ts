import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseLocalDate, toLocalISODate } from '@core/utils/localDate';

import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { createDebtStore } from '@/store/store';

import { liveActivityBridge as webBridge } from './liveActivityBridge';
import type { LiveActivityBridge } from './liveActivityBridge.types';
import { startLiveActivitySync } from './liveActivitySync';
import { buildPaydayActivityContent, type PaydayActivityContent } from './paydayActivityContent';

/**
 * ⛔ **[.5.4f · pass-7 `C3-5` + `C3-6`] — THE LIFECYCLE MANAGER, DRIVEN THROUGH A BRIDGE THAT CAN SAY NO.**
 *
 * `paydayActivityContent.test.ts` pins the pure decision and stops one call short of the Lock Screen; nothing
 * had ever run `startLiveActivitySync` itself. The stub bridge below keeps a `lock` — what the Lock Screen is
 * showing — and refuses on demand, so every assertion compares the LOCK SCREEN with the STORE rather than the
 * manager's belief with itself. ⚠️ The native half (Swift answering `Bool`) cannot run here: it is gated by
 * source below and compiled by `native-e2e`; how often ActivityKit refuses is a device row.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}
function eq<T>(a: T, b: T, label: string) {
  assert(a === b, `${label} (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

function addDays(iso: string, days: number): string {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

/** Premium, toggle on, payday in two days — inside the countdown's window, and a read that is "clear". */
function seed(): DebtStore {
  const s = createDefaultStore();
  const { currentDate } = s.paycheck;
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    paycheck: { ...s.paycheck, payCycle: 'biweekly', amount: '3000', nextPaycheckDate: addDays(currentDate, 2) },
    requiredExpenses: [{ id: 'e0', name: 'Bill', amount: 300, dueDate: currentDate, recurrence: 'monthly' } as never],
    prefs: { ...s.prefs, paydayLiveActivityEnabled: true, onboardingComplete: true },
  };
}

function liveStore() {
  const store = createDebtStore();
  store.setState({ store: seed() } as never);
  return store;
}

/** A bill big enough to turn the read from "clear" to "short" — the content moves. */
function addBigBill(store: ReturnType<typeof createDebtStore>) {
  const { currentDate } = store.getState().store.paycheck;
  store.getState().addExpense({ id: 'e1', name: 'Extra', amount: 5200, dueDate: currentDate, recurrence: 'monthly' } as never);
}

function stubBridge() {
  const lock: { screen: PaydayActivityContent | null } = { screen: null };
  const calls: string[] = [];
  const refuse = { start: 0, update: 0, end: 0 };
  let enabled = true;
  const bridge: LiveActivityBridge = {
    areActivitiesEnabled: () => enabled,
    start: async (c) => {
      calls.push('start');
      if (refuse.start > 0 && refuse.start--) return false;
      lock.screen = c;
      return true;
    },
    update: async (c) => {
      calls.push('update');
      if (refuse.update > 0 && refuse.update--) return false;
      lock.screen = c;
      return true;
    },
    end: async () => {
      calls.push('end');
      if (refuse.end > 0 && refuse.end--) return false;
      lock.screen = null;
      return true;
    },
  };
  return { bridge, lock, calls, refuse, setEnabled: (v: boolean) => (enabled = v) };
}

const settle = () => new Promise((r) => setTimeout(r, 20));
const said = (c: PaydayActivityContent | null) => (c ? `${c.guardianState} · ${c.title} · ${c.line}` : '(nothing)');
const truth = (store: ReturnType<typeof createDebtStore>) => said(buildPaydayActivityContent(store.getState().store));

export default async function runLiveActivitySyncCases(): Promise<void> {
  console.log('\n▶ liveActivitySync — stamp only what landed (.5.4f · C3-5 · C3-6)');

  // ── C3-5 case A: one update is dropped, then the store settles on a commit that does not move the read ──
  {
    const store = liveStore();
    const { bridge, lock, calls, refuse } = stubBridge();
    await startLiveActivitySync(store, bridge, 0);
    eq(said(lock.screen), truth(store), 'the launch start lands and the Lock Screen carries the store’s read');
    const before = said(lock.screen);

    refuse.update = 1;
    addBigBill(store);
    await settle();
    assert(truth(store) !== before, '⭐ the fixture really moved the read (or the rest proves nothing)');
    eq(said(lock.screen), before, '…the update was attempted and dropped, so the Lock Screen is behind the store');

    store.getState().setCushionFloor(400);
    await settle();
    eq(said(lock.screen), truth(store), '⛔ C3-5 — the next commit catches the Lock Screen up instead of being gated out by a key the dropped update stamped');
    assert(calls.includes('update'), '…and the dropped call really was an update');
  }

  // ⭐ CONTROL — a landed update is still gated: an unchanged read issues no call.
  {
    const store = liveStore();
    const { bridge, calls } = stubBridge();
    await startLiveActivitySync(store, bridge, 0);
    addBigBill(store);
    await settle();
    const after = calls.length;
    store.getState().setCushionFloor(400);
    await settle();
    store.getState().markReviewPrompted();
    await settle();
    eq(calls.length, after, '⭐ control — once the update landed, commits that do not move the read issue no call (the gate holds)');
  }

  // ── C3-5 case B: the start request is refused ──
  {
    const store = liveStore();
    const { bridge, lock, calls, refuse } = stubBridge();
    refuse.start = 1;
    await startLiveActivitySync(store, bridge, 0);
    eq(lock.screen, null, 'the refused start put nothing on the Lock Screen');
    store.getState().markReviewPrompted();
    await settle();
    eq(calls.join(','), 'start,start', '⛔ C3-5 — a refused start is RETRIED as a start, never followed by updates to an activity that does not exist');
    eq(said(lock.screen), truth(store), '…and the retry puts the store’s read on the Lock Screen');
  }

  // ── C3-6: a refused end. pass-3 D3-2's fix ENDS the activity; the end has to land for that to reach the screen ──
  {
    const store = liveStore();
    const { bridge, lock, calls, refuse } = stubBridge();
    await startLiveActivitySync(store, bridge, 0);
    refuse.end = 1;
    store.getState().updatePrefs({ paydayLiveActivityEnabled: false });
    await settle();
    assert(lock.screen !== null, 'the end was refused, so the old payload is still on the Lock Screen');
    store.getState().markReviewPrompted();
    await settle();
    eq(calls.filter((c) => c === 'end').length, 2, '⛔ C3-6 — a refused end keeps the activity believed live, so the next commit ends it again');
    eq(lock.screen, null, '…and the Lock Screen is cleared');
    const after = calls.length;
    store.getState().setCushionFloor(400);
    await settle();
    eq(calls.length, after, '⭐ control — once the end landed, nothing further is sent');
  }

  // ── C3-5 adjacent: Live Activities turned ON mid-session ──
  {
    const store = liveStore();
    const { bridge, lock, calls, setEnabled } = stubBridge();
    setEnabled(false);
    await startLiveActivitySync(store, bridge, 0);
    eq(calls.length, 0, 'disabled at launch — nothing is sent');
    setEnabled(true);
    store.getState().markReviewPrompted();
    await settle();
    eq(said(lock.screen), truth(store), '⛔ enabling mid-session starts the countdown on the next commit, not the next launch');
  }

  // ── The bridge is async now: a commit while the launch start is in flight must not start a second activity ──
  {
    const store = liveStore();
    const stub = stubBridge();
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    const slow: LiveActivityBridge = { ...stub.bridge, start: async (c) => { await gate; return stub.bridge.start(c); } };
    const launched = startLiveActivitySync(store, slow, 0);
    store.getState().markReviewPrompted();
    await settle();
    release();
    await launched;
    await settle();
    eq(stub.calls.filter((c) => c === 'start').length, 1, '⛔ a commit during an in-flight start re-runs after it, and does not start a second activity');
  }

  // Idempotent per store.
  {
    const store = liveStore();
    const { bridge, calls } = stubBridge();
    await startLiveActivitySync(store, bridge, 0);
    const after = calls.length;
    await startLiveActivitySync(store, bridge, 0);
    eq(calls.length, after, 'a second startLiveActivitySync on the same store is a no-op');
  }

  // ── The web stub answers TRUE: there is nothing to retry on a platform with no activity ──
  eq(webBridge.areActivitiesEnabled(), false, 'web — Live Activities are never enabled');
  eq(await webBridge.start(buildPaydayActivityContent(seed())!), true, '⛔ web — start answers true (false would be a retry on every change)');
  eq(await webBridge.update(buildPaydayActivityContent(seed())!), true, '…update answers true');
  eq(await webBridge.end(), true, '…end answers true');

  // ── The native half, by source: it cannot run here ──
  {
    const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const js = readFileSync(join(SRC, 'src/liveActivity/liveActivityBridge.native.ts'), 'utf8');
    const swift = readFileSync(join(SRC, 'modules/live-activity/ios/LiveActivityModule.swift'), 'utf8');
    for (const [method, native] of [['start', 'startActivity'], ['update', 'updateActivity'], ['end', 'endActivity']] as const) {
      const body = new RegExp(`\\b${method}: async \\([^)]*\\) => \\{\\s*try \\{\\s*return await native\\(\\)\\.${native}\\([^)]*\\);\\s*\\} catch \\{\\s*return false;`);
      assert(body.test(js), `⛔ native JS — ${method} returns what the module answered, and false from its catch`);
      assert(new RegExp(`AsyncFunction\\("${native}"\\)[^\\n]*async -> Bool in`).test(swift), `⛔ Swift — ${native} is an async function that answers Bool (a sync Function returns before ActivityKit runs)`);
    }
  }

  console.log(`✅ liveActivitySync — ${passed} assertions`);
}
