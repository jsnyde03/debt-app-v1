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

/** paycheck 850 vs required 896 (rent 800 + netflix 16 + gym 30 + card min 50) → a $46 shortfall. */
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
      { id: 'gym', name: 'Gym', amount: 30, dueDate: today, recurrence: 'monthly', category: 'other' },
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
    eq(plan.safeToDefer.map((i) => i.id).join(','), 'gym,netflix', 'safe-to-defer = deferrable, ranked largest-first (gym 30, netflix 16)');
    eq(plan.suggestedDeferIds.join(','), 'gym,netflix', 'both needed to cross the $46 gap');
    eq(plan.closeable, true, 'deferrable 46 ≥ gap 46 → closeable');
    eq(plan.residualGap, 0, 'closeable → no residual');
  }

  // A per-bill override wins — flip rent (housing) to deferrable and it joins safe-to-defer (shortfall kept).
  const today = createDefaultStore().paycheck.currentDate;
  const overridden = selectRecoveryPlan(shortfallStore({
    requiredExpenses: [
      { id: 'rent', name: 'Rent', amount: 800, dueDate: today, recurrence: 'monthly', category: 'housing', deferability: 'deferrable' },
      { id: 'netflix', name: 'Netflix', amount: 16, dueDate: today, recurrence: 'monthly', category: 'subscriptions' },
      { id: 'gym', name: 'Gym', amount: 30, dueDate: today, recurrence: 'monthly', category: 'other' },
    ],
  }));
  assert(!!overridden?.safeToDefer.some((i) => i.id === 'rent'), 'a deferability override moves an essential-category bill to safe-to-defer');
  assert(!overridden?.coverNow.some((i) => i.id === 'rent'), '…and the overridden rent leaves cover-now');

  // The defer action honestly moves the due date to next payday + shrinks the gap on recompute.
  const s = createDebtStore();
  s.setState({ store: shortfallStore() });
  const nextPayday = s.getState().store.paycheck.nextPaycheckDate;
  s.getState().deferExpense('gym');
  eq(s.getState().store.requiredExpenses.find((e) => e.id === 'gym')?.dueDate, nextPayday, 'deferExpense → due date moves to next payday');
  eq(selectRecoveryPlan(s.getState().store)?.gap, 16, 'after deferring gym ($30) → gap shrinks 46 → 16');
  s.getState().deferExpense('netflix');
  eq(selectRecoveryPlan(s.getState().store), null, 'after deferring netflix too → gap closed, recovery clears');

  console.log(`✅ Recovery Plan (2.6.4) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
