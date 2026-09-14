/**
 * L2 probes P2 + P3. Run: copy to apps/rn/src/__probe_L2_p2.ts in a worktree, `npx tsx src/__probe_L2_p2.ts`.
 * At BASE (c7df99c2) `@/store/appliedIntents` does not exist; run with BASE=1 and the record-dependent parts are skipped.
 *
 * P2: what happens at APPLIED_INTENT_CAP — does eviction re-open a replay? A queue whose clear is swallowed (the
 *     mechanism `.5.7.4a-1` exists for) keeps growing, so every new intent pushes an older, still-queued id out.
 * P3: `carryAppliedIntents` claims it keeps "every id the outgoing store had recorded". A restore whose backup carries
 *     ids the current store does not have appends them as NEWEST and slices, evicting the outgoing ids.
 */
import { drainPendingActions } from '@/appIntents/drainPendingActions';
import type { PendingActionBridge } from '@/appIntents/pendingActionBridge.types';
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { createDebtStore } from '@/store/store';

const BASE = process.env.BASE === '1';

function realStore() {
  const s = createDebtStore();
  const base = createDefaultStore();
  s.setState({
    store: {
      ...base,
      prefs: { ...base.prefs, onboardingComplete: true },
      debts: [{ id: 'd0', name: 'Visa', balance: 5000, minimumPayment: 100, apr: 20, dueDate: base.paycheck.currentDate, type: 'debt', recurrence: 'monthly' }] as DebtStore['debts'],
    },
  });
  return s;
}
const stuck = (entries: unknown[]): PendingActionBridge => {
  const payload = JSON.stringify(entries);
  return { read: () => payload, clear: () => { try { throw new Error('App Group unavailable'); } catch { /* swallowed */ } } };
};
const pay = (id: string) => ({ kind: 'log-payment', id, debtId: 'd0', amount: 1 });
const bal = (s: ReturnType<typeof realStore>) => s.getState().store.debts.find((d) => d.id === 'd0')!.balance;

for (const n of [50, 51, 60]) {
  const s = realStore();
  const q = stuck(Array.from({ length: n }, (_, i) => pay(`siri-${i}`)));
  drainPendingActions(q, s.getState());
  const afterFirst = bal(s);
  drainPendingActions(q, s.getState());
  const afterSecond = bal(s);
  drainPendingActions(q, s.getState());
  console.log(JSON.stringify({ probe: 'P2', queued: n, payments: n, expected: 5000 - n, afterFirst, afterSecond, afterThird: bal(s) }));
}

// P2b — the realistic growth shape: one stuck clear, then one new Siri payment per drain. Payments made: k. Taken: ?
{
  const s = realStore();
  const entries: unknown[] = [];
  for (let k = 1; k <= 55; k++) {
    entries.push(pay(`siri-${k}`));
    drainPendingActions(stuck(entries), s.getState());
  }
  console.log(JSON.stringify({ probe: 'P2b', paymentsMade: 55, dollarsTaken: 5000 - bal(s) }));
}

if (!BASE) {
  (async () => {
    const { APPLIED_INTENT_CAP, appliedIntentIdsOf } = await import('@/store/appliedIntents');
    // P3 — a backup carrying k ids the live store does not have; the live store's newest id belongs to an entry still queued.
    for (const k of [0, 1, APPLIED_INTENT_CAP]) {
      const s = realStore();
      const live = Array.from({ length: APPLIED_INTENT_CAP - 1 }, (_, i) => `old-${i}`);
      s.setState({ store: { ...s.getState().store, appliedIntentIds: live } });
      const q = stuck([pay('siri-latest')]);
      drainPendingActions(q, s.getState()); // applied + recorded (newest)
      const backup: DebtStore = { ...s.getState().store, appliedIntentIds: Array.from({ length: k }, (_, i) => `other-${i}`) };
      s.getState().importStore(backup);
      const restored = bal(s);
      const kept = appliedIntentIdsOf(s.getState().store).includes('siri-latest');
      drainPendingActions(q, s.getState());
      console.log(JSON.stringify({ probe: 'P3', backupOnlyIds: k, keptLatest: kept, balanceAfterRestore: restored, balanceAfterNextDrain: bal(s) }));
    }
  })().catch((e) => { console.error(e); process.exit(1); });
}
