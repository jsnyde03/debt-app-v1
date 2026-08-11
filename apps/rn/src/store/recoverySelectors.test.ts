import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectRecoveryPlan } from '@/store/recoverySelectors';
import { createDebtStore } from '@/store/store';

/**
 * §2.6 (2.6.4) — the Recovery Plan selector + defer action on the real app layer. Proves a shortfall
 * store yields the right cover-now/safe-to-defer split (category classification + debt-minimums
 * essential), the engine ranking flows through, and deferring a bill honestly shrinks the gap until
 * recovery clears. Throw-based; run via `npm run test:app`.
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

/** paycheck 850 vs required 896 (rent 800 + netflix 16 + music 30 + card min 50) → a $46 shortfall.
 *  netflix + music are `subscriptions` (deferrable); rent is `housing` + card-min are essential. */
function shortfallStore(over: Partial<DebtStore> = {}): DebtStore {
  const s = createDefaultStore();
  const today = s.paycheck.currentDate;
  return {
    ...s,
    subscriptionPlan: 'premium',
    paycheck: { ...s.paycheck, amount: '850' },
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 800, dueDate: today, recurrence: 'monthly', category: 'housing' },
      { id: 'netflix', name: 'Netflix', amount: 16, dueDate: today, recurrence: 'monthly', category: 'subscriptions' },
      { id: 'music', name: 'Music', amount: 30, dueDate: today, recurrence: 'monthly', category: 'subscriptions' },
    ],
    debts: [{ id: 'card', name: 'Card', balance: 5000, minimumPayment: 50, apr: 20, dueDate: today, type: 'debt', recurrence: 'monthly' }],
    prefs: { ...s.prefs, onboardingComplete: true },
    ...over,
  };
}

function run() {
  console.log('Running Recovery Plan (2.6.4) tests...');

  // No shortfall → no recovery.
  eq(selectRecoveryPlan(shortfallStore({ paycheck: { ...createDefaultStore().paycheck, amount: '5000' } })), null, 'no shortfall → null');

  // The shortfall store → the plan.
  const plan = selectRecoveryPlan(shortfallStore());
  assert(plan !== null, 'shortfall → a plan');
  if (plan) {
    eq(plan.gap, 46, 'gap = the allocation shortfall (896 − 850)');
    eq(plan.coverNow.map((i) => i.id).sort().join(','), 'card,rent', 'cover-now = essentials (rent) + the debt minimum');
    eq(plan.coverNow.find((i) => i.id === 'card')?.amount, 50, 'debt minimum is essential (cover-now), amount = the minimum');
    eq(plan.safeToDefer.map((i) => i.id).join(','), 'music,netflix', 'safe-to-defer = deferrable, ranked largest-first (music 30, netflix 16)');
    eq(plan.suggestedDeferIds.join(','), 'music,netflix', 'both needed to cross the $46 gap');
    eq(plan.closeable, true, 'deferrable 46 ≥ gap 46 → closeable');
    eq(plan.residualGap, 0, 'closeable → no residual');
  }

  // A per-bill override wins — flip rent (housing) to deferrable and it joins safe-to-defer (shortfall kept).
  const today = createDefaultStore().paycheck.currentDate;
  const overridden = selectRecoveryPlan(shortfallStore({
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 800, dueDate: today, recurrence: 'monthly', category: 'housing', deferability: 'deferrable' },
      { id: 'netflix', name: 'Netflix', amount: 16, dueDate: today, recurrence: 'monthly', category: 'subscriptions' },
      { id: 'music', name: 'Music', amount: 30, dueDate: today, recurrence: 'monthly', category: 'subscriptions' },
    ],
  }));
  assert(!!overridden?.safeToDefer.some((i) => i.id === 'rent'), 'a deferability override moves an essential-category bill to safe-to-defer');
  assert(!overridden?.coverNow.some((i) => i.id === 'rent'), '…and the overridden rent leaves cover-now');

  // MF.1 (audit #3): an `other`/uncategorized bill defaults to ESSENTIAL — never pre-suggested to defer.
  const otherBill = selectRecoveryPlan(shortfallStore({
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 800, dueDate: today, recurrence: 'monthly', category: 'housing' },
      { id: 'misc', name: 'Misc', amount: 60, dueDate: today, recurrence: 'monthly', category: 'other' },
    ],
  }));
  assert(!!otherBill?.coverNow.some((i) => i.id === 'misc'), "an `other` bill defaults to essential (cover-now), never safe-to-defer");
  assert(!otherBill?.safeToDefer.some((i) => i.id === 'misc'), "…and is not offered for deferral");

  // MF.1 (audit #1): an AUTOPAY bill can't be deferred → cover-now, never safe-to-defer (even if subscriptions).
  const autopayBill = selectRecoveryPlan(shortfallStore({
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 800, dueDate: today, recurrence: 'monthly', category: 'housing' },
      { id: 'auto', name: 'Streaming', amount: 60, dueDate: today, recurrence: 'monthly', category: 'subscriptions', isAutopay: true },
    ],
  }));
  assert(!autopayBill?.safeToDefer.some((i) => i.id === 'auto'), 'an autopay subscription is excluded from safe-to-defer (the charge fires regardless)');
  assert(!!autopayBill?.coverNow.some((i) => i.id === 'auto'), '…and lands in cover-now instead');

  // The defer action honestly moves the due date to next payday + shrinks the gap on recompute.
  const s = createDebtStore();
  s.setState({ store: shortfallStore() });
  const nextPayday = s.getState().store.paycheck.nextPaycheckDate;
  s.getState().deferExpense('music');
  eq(s.getState().store.requiredExpenses.find((e) => e.id === 'music')?.dueDate, nextPayday, 'deferExpense → due date moves to next payday');
  eq(selectRecoveryPlan(s.getState().store)?.gap, 16, 'after deferring music ($30) → gap shrinks 46 → 16');
  s.getState().deferExpense('netflix');
  eq(selectRecoveryPlan(s.getState().store), null, 'after deferring netflix too → gap closed, recovery clears');

  // MF.1: setDeferability is a pure classification change — it must NOT re-stamp read-freshness.
  const s2 = createDebtStore();
  s2.setState({ store: shortfallStore() });
  const beforeStamp = s2.getState().store.inputsAsOf;
  s2.setState({ store: { ...s2.getState().store, inputsAsOf: '2020-01-01' } }); // artificially age it
  s2.getState().setDeferability('netflix', 'essential');
  eq(s2.getState().store.requiredExpenses.find((e) => e.id === 'netflix')?.deferability, 'essential', 'setDeferability sets the override');
  eq(s2.getState().store.inputsAsOf, '2020-01-01', '…without re-stamping read-freshness (stale stays stale)');
  void beforeStamp;

  // ── 3.7.A3.7 [D25] — an applied affordability purchase is safe to defer, and says so ──
  // ⚠️ The honesty ledger filed this backwards ("uncategorized → deferrable, so a couch reads as a
  // deferrable bill"). The real default is ESSENTIAL, so a "New couch" applied to the paycheck was as
  // un-cuttable as the rent: Recovery would sooner defer Netflix AND the music subscription than touch
  // it. [D25] gives the purchase an explicit `discretionary` category, deferrable by stated rule.
  {
    const today = createDefaultStore().paycheck.currentDate;
    const couch = { id: 'purchase-1', name: 'New couch', amount: 40, dueDate: today, recurrence: 'one-time' as const };
    const withCouch = shortfallStore({
      requiredExpenses: [
        ...shortfallStore().requiredExpenses,
        { ...couch, category: 'discretionary' as const },
      ],
    });
    const plan = selectRecoveryPlan(withCouch);
    assert(!!plan?.safeToDefer.some((c) => c.id === 'purchase-1'), 'A3.7 — an applied purchase is offered as safe-to-defer');
    assert(!plan?.coverNow.some((c) => c.id === 'purchase-1'), '…and is not filed as cover-now beside the rent');

    // The pre-[D25] shape, pinned so a dropped `category` can never silently regress it.
    const uncategorized = shortfallStore({
      requiredExpenses: [...shortfallStore().requiredExpenses, couch],
    });
    const stale = selectRecoveryPlan(uncategorized);
    assert(!!stale?.coverNow.some((c) => c.id === 'purchase-1'), '…while an UNcategorized one-off is still essential (the unknown-default guard stands)');
  }

  console.log(`✅ Recovery Plan (2.6.4 + MF.1) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
