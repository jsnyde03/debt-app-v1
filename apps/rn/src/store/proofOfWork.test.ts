import { createDefaultStore } from '@/data/defaults';
import type { DebtStore, PayCycleSnapshot } from '@/data/models';
import { selectGuardianProofOfWork } from '@/store/guardianSelectors';

/**
 * 3.3.3.1 — the premium Guardian proof-of-work read: the held-your-line streak (consecutive confirmed
 * cycles the cushion reached the floor), cumulative-to-debt (Σ totalPaidThisCycle), premium-gated.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function snap(held: number, floor: number, paid: number, confirmed = true): PayCycleSnapshot {
  return {
    cycleEndDate: '2026-08-01',
    totalDebtBalance: 5000,
    totalPaidThisCycle: paid,
    completedRecommendedActions: [],
    payoffStrategy: 'snowball',
    prediction: {
      forCycleEndDate: '2026-08-01',
      predictedCushion: held,
      predictedState: 'clear',
      predictedShortfall: 0,
      predictedConfidenceContext: { discoveryHoldbackActive: false, coldStartHoldbackActive: false, provisional: false },
      plannedIncome: 2000,
      floor,
    },
    outcome: { actualIncome: 2000, actualCushionHeld: held, outcomeConfirmed: confirmed },
  };
}

function storeWith(history: PayCycleSnapshot[], plan: 'free' | 'premium' = 'premium'): DebtStore {
  return { ...createDefaultStore(), subscriptionPlan: plan, cycleHistory: history };
}

function run() {
  console.log('Running Guardian proof-of-work (3.3.3.1) tests...');

  // [held, MISS(50<200), held, held] oldest→newest — walking back stops at the miss 3 cycles ago.
  const pow = selectGuardianProofOfWork(storeWith([snap(300, 200, 500), snap(50, 200, 400), snap(300, 200, 600), snap(400, 200, 700)]))!;
  assert(pow != null, 'premium with history → a proof-of-work read');
  assert(pow.heldStreak === 2, `2 held running (the miss breaks it further back) — got ${pow.heldStreak}`);
  assert(pow.totalToDebt === 2200, `Σ to debt = 500+400+600+700 — got ${pow.totalToDebt}`);
  assert(pow.cyclesRun === 4, `4 cycles run — got ${pow.cyclesRun}`);
  assert(pow.score != null, 'the scorecard is carried for the trust line');

  assert(selectGuardianProofOfWork(storeWith([snap(300, 200, 500)], 'free')) === null, 'free → null (the automation is the premium job)');
  assert(selectGuardianProofOfWork(storeWith([])) === null, 'no history → null');

  // An unconfirmed most-recent cycle isn't gradeable → the streak is 0 (never over-claims).
  const unconf = selectGuardianProofOfWork(storeWith([snap(300, 200, 500), snap(300, 200, 500, false)]))!;
  assert(unconf.heldStreak === 0, 'an unconfirmed most-recent cycle → streak 0 (honest)');

  console.log(`✅ Guardian proof-of-work (3.3.3.1) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
