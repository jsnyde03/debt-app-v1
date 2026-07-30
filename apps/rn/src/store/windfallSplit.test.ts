import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectWindfallSplit } from '@/store/guardianSelectors';

/**
 * VIS-6 Windfall Autopilot — the marginal split of a one-time windfall across the plan's buckets. The
 * split is a diff of two allocation runs (with vs without the windfall); because paid-required + living
 * reserve are windfall-independent, the bucket deltas must sum EXACTLY to the windfall (money conserved).
 * These lock that invariant + the multi-bucket routing + the non-positive/degenerate guards.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

// Base paycheck only partly reaches the starter EF, so a windfall spills into EF AND extra debt.
function store(): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    cushionFloor: 200,
    paycheck: { ...s.paycheck, amount: '1500', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts: [{ id: 'card', name: 'Card', balance: 8000, minimumPayment: 200, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
    goals: [{ id: 'ef', name: 'Emergency fund', targetAmount: 3000, currentAmount: 0, type: 'emergency' }],
    livingExpenses: [{ id: 'l0', name: 'Living', amount: 800, enabled: true }],
    requiredExpenses: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

function run() {
  console.log('Running Windfall Autopilot split (VIS-6) tests...');
  const s = store();

  const split = selectWindfallSplit(s, 1000);
  assert(split != null, '$1000 windfall yields a split');
  const sum = split!.items.reduce((a, it) => a + it.amount, 0);
  assert(Math.abs(sum - 1000) < 0.5, `bucket deltas sum to the windfall (money conserved) — got ${sum}`);
  assert(split!.items.length >= 2, 'this scenario routes across multiple buckets');
  assert(split!.items.some((it) => it.key === 'emergency' && it.amount > 0), 'part lands in the emergency fund');
  assert(split!.items.some((it) => it.key === 'debt' && it.amount > 0), 'part lands as extra to debt');
  assert(split!.items.every((it) => it.amount >= 0.5), 'no near-zero noise buckets');

  // A healthy plan whose base already funds the EF routes the whole windfall to debt (single bucket, honest).
  const funded: DebtStore = { ...s, paycheck: { ...s.paycheck, amount: '2600' }, livingExpenses: [] };
  const fundedSplit = selectWindfallSplit(funded, 1000);
  assert((fundedSplit?.items.find((it) => it.key === 'debt')?.amount ?? 0) > 900, 'when the base already covers the EF, the windfall goes to debt');

  // Ordering: bills (a caveat) always lead; otherwise largest destination first.
  assert(split!.items[0].amount >= split!.items[split!.items.length - 1].amount || split!.items[0].key === 'bills', 'ordered largest-first (bills excepted)');

  // Guards: non-positive amount + no-plan → null.
  assert(selectWindfallSplit(s, 0) === null, 'zero amount → null');
  assert(selectWindfallSplit(s, -50) === null, 'negative amount → null');
  const noPlan: DebtStore = { ...s, paycheck: { ...s.paycheck, amount: '0' } };
  assert(selectWindfallSplit(noPlan, 1000) === null, 'no positive paycheck → null (no plan to route into)');

  console.log(`✅ Windfall Autopilot split (VIS-6) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
