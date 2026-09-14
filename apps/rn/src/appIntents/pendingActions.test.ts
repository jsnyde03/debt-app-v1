import { drainPendingActions } from './drainPendingActions';
import type { PendingActionBridge } from './pendingActionBridge.types';
import {
  applyPendingActions,
  parsePendingActions,
  type PendingActionApi,
} from './pendingActions';
import { createDefaultStore } from '@/data/defaults';
import { runMigrations } from '@/data/migrations';
import type { DebtStore } from '@/data/models';
import { APPLIED_INTENT_CAP, appliedIntentIdsOf, withAppliedIntent } from '@/store/appliedIntents';
import { createDebtStore } from '@/store/store';

/**
 * 3.5.3.5 — the AppIntent → store bridge core: defensive parse · apply-dispatches-store-actions · drain.
 * Throw-based; runs via `npm run test:app`.
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

/** A stub store surface that counts dispatches. */
function stubApi() {
  const calls: string[] = [];
  const api: PendingActionApi = {
    applyPaydayLandedIntent: () => calls.push('applyPaydayLandedIntent'),
    logManualPayment: (debtId, amount) => calls.push(`logManualPayment:${debtId}:${amount}`),
  };
  return { api, calls };
}

// ── parsePendingActions (defensive) ─────────────────────────────────────────────
eq(parsePendingActions(null).length, 0, 'parse: null → []');
eq(parsePendingActions('not json').length, 0, 'parse: bad JSON string → []');
eq(parsePendingActions('{}').length, 0, 'parse: non-array JSON → []');
eq(parsePendingActions([{ kind: 'nope', id: '1' }]).length, 0, 'parse: unknown kind → dropped');
eq(parsePendingActions([{ kind: 'payday-landed' }]).length, 0, 'parse: missing id → dropped');
eq(parsePendingActions([null, 3, 'x', { kind: 'payday-landed', id: 'a' }]).length, 1, 'parse: mixed junk → keeps the valid one');
eq(parsePendingActions([{ kind: 'payday-landed', id: 'a' }, { kind: 'payday-landed', id: 'a' }]).length, 1, 'parse: dedupe by id');
{
  // A JSON string (the real App-Group shape) parses to the typed action.
  const parsed = parsePendingActions(JSON.stringify([{ kind: 'payday-landed', id: 'x1' }]));
  eq(parsed.length, 1, 'parse: JSON-string array → 1');
  eq(parsed[0].kind, 'payday-landed', 'parse: kind preserved');
}

// ── applyPendingActions (dispatches the real store action) ───────────────────────
{
  const { api, calls } = stubApi();
  const applied = applyPendingActions(parsePendingActions([{ kind: 'payday-landed', id: 'a' }]), api);
  eq(calls.length, 1, 'apply: payday-landed dispatches applyPaydayLandedIntent once');
  eq(calls[0], 'applyPaydayLandedIntent', 'apply: correct action (the Undo-aware roll)');
  eq(applied.length, 1, 'apply: returns the applied action');
}

// ── drainPendingActions (read → parse → apply → clear) ───────────────────────────
{
  const { api, calls } = stubApi();
  let cleared = false;
  const bridge: PendingActionBridge = {
    read: () => JSON.stringify([{ kind: 'payday-landed', id: 'a' }]),
    clear: () => { cleared = true; },
  };
  const applied = drainPendingActions(bridge, api);
  eq(applied.length, 1, 'drain: applied 1');
  eq(calls.length, 1, 'drain: dispatched the store action');
  assert(cleared, 'drain: cleared the queue after applying');
}
{
  // Empty queue → no dispatch, no clear (nothing to do).
  const { api, calls } = stubApi();
  let cleared = false;
  const applied = drainPendingActions({ read: () => null, clear: () => { cleared = true; } }, api);
  eq(applied.length, 0, 'drain: empty → nothing applied');
  eq(calls.length, 0, 'drain: empty → no dispatch');
  assert(!cleared, 'drain: empty → no clear');
}
{
  // A throwing bridge is swallowed (best-effort) — never crashes the app.
  const { api } = stubApi();
  const applied = drainPendingActions({ read: () => { throw new Error('boom'); }, clear: () => {} }, api);
  eq(applied.length, 0, 'drain: a throwing bridge is caught → []');
}

// ── log-payment variant (3.5.5) ─────────────────────────────────────────────────
eq(parsePendingActions([{ kind: 'log-payment', id: 'p1', debtId: 'd0', amount: 200 }]).length, 1, 'parse: valid log-payment kept');
eq(parsePendingActions([{ kind: 'log-payment', id: 'p1', debtId: 'd0' }]).length, 0, 'parse: log-payment missing amount → dropped');
eq(parsePendingActions([{ kind: 'log-payment', id: 'p1', amount: 200 }]).length, 0, 'parse: log-payment missing debtId → dropped');
eq(parsePendingActions([{ kind: 'log-payment', id: 'p1', debtId: 'd0', amount: 0 }]).length, 0, 'parse: log-payment non-positive amount → dropped');
eq(parsePendingActions([{ kind: 'log-payment', id: 'p1', debtId: 'd0', amount: 'x' }]).length, 0, 'parse: log-payment non-number amount → dropped');
{
  const parsed = parsePendingActions([{ kind: 'log-payment', id: 'p1', debtId: 'visa', amount: 150.5 }]);
  const a = parsed[0];
  assert(a.kind === 'log-payment' && a.debtId === 'visa' && a.amount === 150.5, 'parse: log-payment fields preserved');
}
{
  const { api, calls } = stubApi();
  applyPendingActions(parsePendingActions([{ kind: 'log-payment', id: 'p1', debtId: 'visa', amount: 150 }]), api);
  eq(calls[0], 'logManualPayment:visa:150', 'apply: log-payment dispatches logManualPayment(debtId, amount)');
}
{
  // A mixed queue applies both, in order.
  const { calls } = (() => {
    const s = stubApi();
    applyPendingActions(
      parsePendingActions([
        { kind: 'payday-landed', id: 'a' },
        { kind: 'log-payment', id: 'b', debtId: 'car', amount: 90 },
      ]),
      s.api,
    );
    return s;
  })();
  eq(calls.length, 2, 'apply: mixed queue applies both');
  eq(calls[1], 'logManualPayment:car:90', 'apply: order preserved');
}

// ── ⛔ [.5.7.4a-1] AN ENTRY THAT OUTLIVES ITS DRAIN — through the REAL store ─────────────────────────────────
//
// Every block above runs against `stubApi`, which counts calls. A stub cannot see a guard that lives on the mutation,
// and no fixture's `clear` ever failed, so a Siri payment applied twice on a swallowed clear with every test green.
// These drive `createDebtStore` through the real drain, over a bridge whose `clear` throws and is swallowed exactly as
// `pendingActionBridge.native.ts` does. ⚠️ The doors are the class the store's set wrapper covers — every write that
// replaces the store — and each row is preceded by a control proving its entry really moves the figures.
{
  type RealStore = ReturnType<typeof createDebtStore>;
  const realStore = (): RealStore => {
    const s = createDebtStore();
    const base = createDefaultStore();
    s.setState({
      store: {
        ...base,
        prefs: { ...base.prefs, onboardingComplete: true },
        // Payday is today, so a roll is due and the payday rows are not refused for arriving early.
        paycheck: { ...base.paycheck, nextPaycheckDate: base.paycheck.currentDate },
        debts: [
          { id: 'd0', name: 'Visa', balance: 5000, minimumPayment: 100, apr: 20, dueDate: base.paycheck.currentDate, type: 'debt', recurrence: 'monthly' },
        ] as DebtStore['debts'],
      },
    });
    return s;
  };
  const stuckQueue = (entries: unknown[]): PendingActionBridge => {
    const payload = JSON.stringify(entries);
    return {
      read: () => payload,
      clear: () => {
        try {
          throw new Error('App Group unavailable');
        } catch {
          /* swallowed, exactly as the native bridge does */
        }
      },
    };
  };
  const balanceOf = (s: RealStore) => s.getState().store.debts.find((d) => d.id === 'd0')?.balance ?? null;
  const figures = (s: RealStore) => {
    const st = s.getState().store;
    return JSON.stringify({ balance: balanceOf(s), payday: st.paycheck.nextPaycheckDate, cycles: st.cycleHistory.length });
  };

  const KINDS = [
    { kind: 'log-payment', entry: { kind: 'log-payment', id: 'siri-1', debtId: 'd0', amount: 250 } },
    { kind: 'payday-landed', entry: { kind: 'payday-landed', id: 'tap-1' } },
  ];
  const DOORS: { name: string; between: (s: RealStore, before: DebtStore) => void; kinds?: string[] }[] = [
    { name: 'a second drain (return to foreground)', between: () => {} },
    { name: 'Undo', between: (s) => s.getState().undoIntentAction() },
    { name: 'restoring a backup taken before the drain', between: (s, before) => s.getState().importStore(before) },
    // ⚠️ Payday only: a fresh store has no `d0`, so a replayed payment is a no-op with or without the record — a row
    // that could not fail.
    { name: 'Delete all data (reset)', between: (s) => s.getState().reset(), kinds: ['payday-landed'] },
  ];

  for (const { kind, entry } of KINDS) {
    const control = realStore();
    const untouched = figures(control);
    drainPendingActions(stuckQueue([entry]), control.getState());
    assert(figures(control) !== untouched, `4a-1 control — a queued ${kind} applies on its first drain`);

    for (const door of DOORS) {
      if (door.kinds && !door.kinds.includes(kind)) continue;
      const s = realStore();
      const before = s.getState().store;
      const bridge = stuckQueue([entry]);
      drainPendingActions(bridge, s.getState());
      door.between(s, before);
      const settled = figures(s);
      drainPendingActions(bridge, s.getState());
      eq(figures(s), settled, `⛔ 4a-1 — a ${kind} that outlives its drain is not applied again after ${door.name}`);
    }
  }

  // ⭐ The over-fix this must not become: two Siri payments with two ids ARE two payments (pass-6 C3-6's asymmetry).
  {
    const s = realStore();
    drainPendingActions(stuckQueue([{ kind: 'log-payment', id: 'siri-1', debtId: 'd0', amount: 250 }]), s.getState());
    drainPendingActions(stuckQueue([{ kind: 'log-payment', id: 'siri-2', debtId: 'd0', amount: 250 }]), s.getState());
    eq(balanceOf(s), 4500, '⭐ 4a-1 control — two queued payments with two ids both apply');
  }

  // An unreadable record never swallows a real payment. ⛔ A bare string answers `includes` by substring.
  for (const corrupt of ['siri-1', { 'siri-1': true }, [7, null]]) {
    const s = realStore();
    s.setState({ store: { ...s.getState().store, appliedIntentIds: corrupt as unknown as string[] } });
    drainPendingActions(stuckQueue([{ kind: 'log-payment', id: 'siri-1', debtId: 'd0', amount: 250 }]), s.getState());
    eq(balanceOf(s), 4750, `⛔ 4a-1 — an unreadable record (${JSON.stringify(corrupt)}) does not skip the payment`);
  }

  // The record is capped (newest kept) and survives a relaunch through `runMigrations`.
  {
    let st = createDefaultStore();
    for (let i = 0; i < APPLIED_INTENT_CAP + 10; i++) st = withAppliedIntent(st, `id-${i}`);
    const ids = appliedIntentIdsOf(st);
    eq(ids.length, APPLIED_INTENT_CAP, '4a-1 — the record is capped');
    eq(ids[ids.length - 1], `id-${APPLIED_INTENT_CAP + 9}`, '4a-1 — …keeping the newest');
    assert(!ids.includes('id-0'), '4a-1 — …and dropping the oldest');
    const relaunched = runMigrations(JSON.parse(JSON.stringify(st)));
    eq(appliedIntentIdsOf(relaunched).join(','), ids.join(','), '⛔ 4a-1 — the record survives a relaunch');
  }
}

// ── ⛔ [.5.7.4a.3 · pass-6 C3-6] ONE ROLL PER PAYDAY THE TAP NAMED — through the REAL store ────────────────────────────
//
// Two Lock Screen taps rolled the plan two cycles, and the guard written for it (`lastHandledPaydayDate`) never fired on a
// second tap. Every date below is derived from the store and its injected clock — no calendar literal, so nothing here
// burns as the real date moves.
{
  type RealStore = ReturnType<typeof createDebtStore>;
  const base = createDefaultStore();
  const today = base.paycheck.currentDate;
  const future = base.paycheck.nextPaycheckDate;
  const storeOn = (payday: string, clock: string): RealStore => {
    const s = createDebtStore({ now: () => clock });
    s.setState({
      store: { ...base, prefs: { ...base.prefs, onboardingComplete: true }, paycheck: { ...base.paycheck, nextPaycheckDate: payday } },
    });
    return s;
  };
  const drain = (s: RealStore, entries: unknown[]) => {
    let queue: string | null = JSON.stringify(entries);
    drainPendingActions({ read: () => queue, clear: () => { queue = null; } }, s.getState());
  };
  const tap = (id: string, paydayDateISO?: string) =>
    paydayDateISO === undefined ? { kind: 'payday-landed', id } : { kind: 'payday-landed', id, paydayDateISO };
  const cycles = (s: RealStore) => s.getState().store.cycleHistory.length;

  assert(future > today, 'C3-6 control — the default next payday is after today, so "before payday" is a real state here');

  {
    const s = storeOn(today, today);
    drain(s, [tap('t1', today)]);
    eq(cycles(s), 1, 'C3-6 control — one Lock Screen tap on payday rolls the plan once');
  }
  {
    const s = storeOn(today, today);
    drain(s, [tap('t1', today), tap('t2', today)]);
    eq(cycles(s), 1, '⛔ C3-6 — two Lock Screen taps for one payday, in one drain, roll the plan ONCE');
  }
  {
    const s = storeOn(today, today);
    drain(s, [tap('t1', today)]);
    drain(s, [tap('t2', today)]);
    eq(cycles(s), 1, '⛔ C3-6 — a second tap in a later drain names a payday the plan has already left');
  }
  {
    // ⚡ The fixture that separates the dated rule from a real-date rule: both taps are drained only once the NEXT payday
    // has arrived, so after the first roll the clock has reached the new payday too. A clock-only rule rolls twice.
    const probe = storeOn(today, today);
    drain(probe, [tap('p', today)]);
    const following = probe.getState().store.paycheck.nextPaycheckDate;
    const s = storeOn(today, following);
    drain(s, [tap('t1', today), tap('t2', today)]);
    eq(cycles(s), 1, '⛔ C3-6 — two taps for one payday, drained after the next payday arrived, still roll once');
  }
  {
    const s = storeOn(future, today);
    drain(s, [tap('t1', today)]);
    eq(cycles(s), 0, '⛔ C3-6 — a tap naming a payday other than the next one on the plan rolls nothing');
  }
  {
    const s = storeOn(future, today);
    drain(s, [tap('u1')]);
    eq(cycles(s), 0, '⛔ C3-6 — an undated intent before payday rolls nothing');
  }
  {
    const s = storeOn(today, today);
    drain(s, [tap('u1'), tap('u2')]);
    eq(cycles(s), 1, 'C3-6 — undated intents on payday roll the plan once');
  }
  {
    // 🎯 2026-09-14 — capture and "Skip this payday" stamp the payday without rolling; Today then offers the roll.
    const s = storeOn(today, today);
    s.getState().setLastHandledPayday(today);
    drain(s, [tap('t1', today)]);
    eq(cycles(s), 1, '⛔ C3-6 — after an in-app capture or skip, a Lock Screen tap rolls the cycle Today offers');
  }

  {
    const [dated] = parsePendingActions([{ kind: 'payday-landed', id: 'd1', paydayDateISO: today }]);
    assert(dated?.kind === 'payday-landed' && dated.paydayDateISO === today, 'C3-6 — parse: a dated payday-landed keeps its date');
    const [undated] = parsePendingActions([{ kind: 'payday-landed', id: 'd2' }]);
    assert(undated?.kind === 'payday-landed' && undated.paydayDateISO === undefined, 'C3-6 — parse: an undated payday-landed stays undated');
  }
  for (const bad of [today.split('-').join('/'), 12, null, '']) {
    eq(
      parsePendingActions([{ kind: 'payday-landed', id: 'd3', paydayDateISO: bad }]).length,
      0,
      `⛔ C3-6 — parse: an unreadable payday date (${JSON.stringify(bad)}) drops the entry rather than rolling undated`,
    );
  }
}

console.log(`\n  pendingActions (AppIntent bridge): ${passed} assertions passed\n`);
