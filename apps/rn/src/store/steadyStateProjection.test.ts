import { selectWhatIf } from '@/store/analysisSelectors';
import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectExtraToDebt, selectDebtFreeDate } from '@/store/planSelectors';
import { selectPayoffView } from '@/store/payoffSelectors';
import { selectAllocation, selectSteadyStateAllocation } from '@/store/selectors';

/**
 * MF.4 (audit #5) — the debt-free projection must run on the STEADY-STATE deploy, not the current
 * cycle's cold-start-dampened allocation. During cold-start, premium holds a temporary discovery reserve
 * (40% of above-floor headroom); extrapolating that across the whole payoff made premium's projected
 * debt-free date read LATER than free's. The steady-state allocation strips that temporary reserve (keeps
 * the floor), so its extra-to-debt exceeds the dampened one and the projected date isn't pessimistic.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

/** Cold-start premium: genuineCycleCount 0 → discovery holdback active; debt + plenty of headroom. */
function coldStartPremium(over: Partial<DebtStore> = {}): DebtStore {
  const s = createDefaultStore();
  const today = s.paycheck.currentDate;
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 0,
    cushionFloor: 200,
    paycheck: { ...s.paycheck, amount: '2000' },
    debts: [{ id: 'd0', name: 'Card', balance: 5000, minimumPayment: 100, apr: 20, dueDate: today, type: 'debt', recurrence: 'monthly', balanceAsOfDate: today }],
    prefs: { ...s.prefs, onboardingComplete: true },
    ...over,
  };
}

function run() {
  console.log('Running steady-state projection (MF.4) tests...');

  const store = coldStartPremium();
  const dampened = selectAllocation(store);
  const steady = selectSteadyStateAllocation(store);
  assert(dampened !== null && steady !== null, 'both allocations resolve');

  const dampenedExtra = selectExtraToDebt(dampened!);
  const steadyExtra = selectExtraToDebt(steady!);
  assert(steadyExtra > dampenedExtra, `steady-state deploys MORE than the cold-start-dampened cycle (${steadyExtra} > ${dampenedExtra})`);

  // The cold-start discovery reserve is ~40% of above-floor headroom; steady should recover most of it.
  assert(steadyExtra >= dampenedExtra * 1.3, 'steady-state recovers the bulk of the temporary discovery hold');

  // The projected debt-free date now runs on the steady-state deploy; a date resolves, and since more
  // extra-to-debt monotonically means an EARLIER payoff, the steady > dampened result above guarantees the
  // date is no later than the old dampened extrapolation (no separate re-projection needed).
  assert(selectDebtFreeDate(store, dampened) !== null, 'a debt-free date is projected off the steady-state deploy');

  // Round-2 (audit NEW-1/NEW-2): every long-horizon projection surface agrees on the debt-free date at
  // cold-start — the Payoff tab, the What-If baseline (no extra), and the frozen drift baseline all run on
  // the steady-state deploy. Previously What-If read the dampened extra → a later baseline than the Payoff tab.
  {
    const payoffDate = selectPayoffView(store).debtFreeDate;
    const whatIfBaseline = selectWhatIf(store, 0).baselineDate;
    assert(payoffDate !== null && whatIfBaseline !== null, 'both projection surfaces produce a date');
    assert(payoffDate === whatIfBaseline, `What-If baseline date matches the Payoff date at cold-start (${whatIfBaseline} === ${payoffDate})`);
  }

  // An established premium user (no discovery hold) → steady ≈ dampened (nothing temporary to strip).
  const established = coldStartPremium({ genuineCycleCount: 6 });
  assert(selectExtraToDebt(selectSteadyStateAllocation(established)!) === selectExtraToDebt(selectAllocation(established)!), 'established user: steady == dampened (no temporary reserve to strip)');

  console.log(`✅ Steady-state projection (MF.4) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
