import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectAffordability, selectSaveForItOptions } from '@/store/guardianSelectors';

/**
 * §2.9 Can-I-Afford-This? — the app-layer selectors over the engine. The pure verdict + priority-goal
 * math are unit-tested in core; this proves `selectAffordability` (verdict + honest debt impact off the
 * real allocation) and `selectSaveForItOptions` (the paced sinking-fund options) on a seeded store.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

// $2000 paycheck, one big debt (min $100) → discretionary = 2000 - 100 = $1900 above obligations; floor $200.
function store(): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    cushionFloor: 200,
    paycheck: { ...s.paycheck, amount: '2000', payCycle: 'monthly', currentDate: '2026-08-01', nextPaycheckDate: '2026-09-01' },
    debts: [{ id: 'card', name: 'Card', balance: 8000, minimumPayment: 100, apr: 22, dueDate: '2026-08-10', type: 'debt', recurrence: 'monthly', balanceAsOfDate: '2026-08-01' }],
    requiredExpenses: [],
    goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

function run() {
  console.log('Running affordability selectors (2.9) tests...');
  const s = store();

  // Verdicts against $1900 discretionary, $200 floor.
  assert(selectAffordability(s, 500)?.verdict === 'comfortable', '$500 → comfortable (cushion $1400 ≥ floor)');
  assert(selectAffordability(s, 1800)?.verdict === 'tight', '$1800 → tight (cushion $100 < floor $200)');
  const short = selectAffordability(s, 2500);
  assert(short?.verdict === 'short', '$2500 → short (exceeds $1900)');
  assert(short?.shortBy === 600, '…short by $600');

  // The honest debt impact: a comfortable purchase displaces money that would have gone to the snowball.
  assert((selectAffordability(s, 500)?.extraToDebtDelta ?? 0) > 0, 'a purchase reduces what reaches debt this paycheck (extraToDebtDelta > 0)');

  // Save-for-it options for a short purchase: prioritized paces + a debt-first path.
  const opts = selectSaveForItOptions(s, 2500);
  assert(opts.some((o) => o.key === 'fast' && o.prioritize && (o.perPaycheck ?? 0) > 0 && o.paychecks != null), 'a prioritized "fast" option with a real per-paycheck pace + ready date');
  assert(opts.some((o) => o.key === 'debtFirst' && !o.prioritize && o.readyBy == null), 'a debt-first option (no priority, no firm date)');
  assert(opts.length >= 2, 'at least fast + debt-first are offered');

  console.log(`✅ Affordability selectors (2.9) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
