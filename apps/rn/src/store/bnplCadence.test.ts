import { createDefaultStore } from '@/data/defaults';
import type { Debt, DebtStore } from '@/data/models';
import { selectAllocation } from '@/store/selectors';
import { selectCashTimeline } from '@/store/payoffSelectors';
import { selectBnplBetweenPaycheck } from '@/store/guardianSelectors';

/**
 * §2.7.4 Guardian-aware cadence — the integration check that the in-window BNPL scaling actually flows
 * through `selectAllocation` (the Today card) and `selectCashTimeline` (the lookahead). A monthly-paid
 * user with a biweekly BNPL pays ~2 installments before their next paycheck, but the single-due-date
 * allocator counts one; the scaling reflects the full outflow. A biweekly-PAID user (cadence aligned)
 * is the control — exactly one charge per cycle, so nothing changes.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

// One installment-native biweekly BNPL ($100 × 4), due at the cycle start so it charges repeatedly.
const BNPL: Debt = {
  id: 'b0', name: 'Klarna', balance: 400, originalBalance: 400, minimumPayment: 100, apr: 0,
  dueDate: '2026-08-01', type: 'bnpl', bnplProvider: 'Klarna', scheduledPaymentAmount: 100,
  remainingPayments: 4, recurrence: 'biweekly', balanceAsOfDate: '2026-08-01',
};

function storeWith(payCycle: 'monthly' | 'biweekly', nextPaycheckDate: string): DebtStore {
  const s = createDefaultStore();
  return {
    ...s,
    subscriptionPlan: 'premium',
    genuineCycleCount: 6,
    cushionFloor: 200,
    paycheck: { ...s.paycheck, amount: '2000', payCycle, currentDate: '2026-08-01', nextPaycheckDate },
    debts: [BNPL],
    requiredExpenses: [],
    goals: [],
    prefs: { ...s.prefs, onboardingComplete: true },
  };
}

function run() {
  console.log('Running BNPL cadence integration (2.7.4) tests...');

  // Monthly paycheck: Aug 1 → Sep 1 holds 3 biweekly charges (Aug 1/15/29) → the effective required
  // reflects 3 × $100, capped at the $400 balance = $300 (vs the naive single $100).
  const monthly = selectAllocation(storeWith('monthly', '2026-09-01'));
  assert(monthly !== null, 'monthly allocation resolves');
  assert(monthly!.totalRequired === 300, `monthly-paid + biweekly BNPL reserves the FULL in-window outflow ($300, not $100) — got ${monthly!.totalRequired}`);

  // Biweekly paycheck (aligned): Aug 1 → Aug 15 holds exactly one charge → $100, unchanged.
  const biweekly = selectAllocation(storeWith('biweekly', '2026-08-15'));
  assert(biweekly !== null, 'biweekly allocation resolves');
  assert(biweekly!.totalRequired === 100, `biweekly-paid + biweekly BNPL is unchanged (one charge per cycle, $100) — got ${biweekly!.totalRequired}`);

  // The lookahead timeline also reflects the heavier BNPL outflow for the monthly earner: with the same
  // $2000 income, the monthly-paid user's projected cushion runs tighter than the aligned biweekly one.
  const monthlyTL = selectCashTimeline(storeWith('monthly', '2026-09-01'), 3);
  const biweeklyTL = selectCashTimeline(storeWith('biweekly', '2026-08-15'), 3);
  assert(monthlyTL.length > 0 && biweeklyTL.length > 0, 'both timelines build');
  assert(
    monthlyTL[0].net < biweeklyTL[0].net,
    `the monthly earner's cycle-0 net is tighter (more BNPL outflow): ${monthlyTL[0].net} < ${biweeklyTL[0].net}`,
  );
  // Re-scan Finding 1 — cycle 0's endingBalance (the Cash Flow bar/value) must ALSO reflect the scaled
  // BNPL outflow, not just net; pre-fix cycle 0 subtracted only one installment → this would have been
  // equal, overstating the monthly earner's cushion.
  assert(
    monthlyTL[0].endingBalance < biweeklyTL[0].endingBalance,
    `cycle-0 endingBalance reflects the scaled BNPL outflow: ${monthlyTL[0].endingBalance} < ${biweeklyTL[0].endingBalance}`,
  );

  // 2.7.4.3 — the between-paycheck heads-up names the lumpy BNPL for the monthly earner, and stays quiet
  // for the aligned biweekly-paid case (one charge per cycle → not lumpy).
  const headsUp = selectBnplBetweenPaycheck(storeWith('monthly', '2026-09-01'));
  assert(headsUp !== null && /Klarna/.test(headsUp) && /before your next paycheck/.test(headsUp), `monthly earner gets a named BNPL heads-up — got ${JSON.stringify(headsUp)}`);
  assert(selectBnplBetweenPaycheck(storeWith('biweekly', '2026-08-15')) === null, 'aligned biweekly-paid case has no between-paycheck heads-up');

  console.log(`✅ BNPL cadence integration (2.7.4) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
