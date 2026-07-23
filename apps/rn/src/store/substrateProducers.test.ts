/**
 * Reconciliation tests for the 2.4.D.3 substrate producers. Self-contained (no zustand, no `@/`
 * value imports) so it runs under `npx tsx apps/rn/src/store/substrateProducers.test.ts`.
 * Starts the RN app-layer test pattern (Debt RN had zero tests — Phase 4 formalizes a runner).
 */
import type { DebtStore } from '@/data/models';
import {
  stampInputsFresh,
  incrementGenuineCycle,
  recordMissedArrival,
  recordCycleIncome,
  recordSurpriseOutflow,
  stampOnboardedAt,
} from './substrateProducers';

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}`);
  }
}

/** Minimal DebtStore for the fields the producers touch (cast — the producers read a known subset). */
function makeStore(overrides: Partial<DebtStore> = {}): DebtStore {
  return {
    paycheck: { amount: '2000', currentDate: '2026-07-23', incomeVaries: false, nextPaycheckDate: '2026-08-06' },
    inputsAsOf: '2026-06-01',
    genuineCycleCount: 0,
    onboardedAt: null,
    incomeActualsLog: [],
    surpriseOutflowLog: [],
    missedArrivals: [],
    currentCyclePrediction: null,
    windfall: 0,
    ...overrides,
  } as unknown as DebtStore;
}

console.log('Running 2.4.D.3 substrate-producer tests...');

// 3a — inputsAsOf freshness
check('stampInputsFresh sets inputsAsOf to currentDate', stampInputsFresh(makeStore()).inputsAsOf === '2026-07-23');

// 3b — genuineCycleCount
check('incrementGenuineCycle bumps the count', incrementGenuineCycle(makeStore({ genuineCycleCount: 2 })).genuineCycleCount === 3);

// 3f — missed arrival
const miss1 = recordMissedArrival(makeStore(), '2026-08-06');
check('recordMissedArrival appends the cycle date', miss1.missedArrivals.length === 1 && miss1.missedArrivals[0] === '2026-08-06');
check('recordMissedArrival is idempotent per cycle', recordMissedArrival(miss1, '2026-08-06').missedArrivals.length === 1);

// 3c/3e — income actuals
const fixed = recordCycleIncome(makeStore(), '2026-08-06');
check('fixed income → actual defaults to planned (paycheck.amount)', fixed.incomeActualsLog[0]?.actualIncome === 2000 && fixed.incomeActualsLog[0]?.plannedIncome === 2000);

const varSkip = recordCycleIncome(makeStore({ paycheck: { amount: '2000', currentDate: '2026-07-23', incomeVaries: true, nextPaycheckDate: '2026-08-06' } as DebtStore['paycheck'] }), '2026-08-06');
check('variable income with NO reported actual → skipped (no fabricated actual)', varSkip.incomeActualsLog.length === 0);

const varReported = recordCycleIncome(makeStore({ paycheck: { amount: '2000', currentDate: '2026-07-23', incomeVaries: true, nextPaycheckDate: '2026-08-06' } as DebtStore['paycheck'] }), '2026-08-06', { actualIncome: 1650 });
check('variable income with a reported actual → recorded (1650 vs planned 2000)', varReported.incomeActualsLog[0]?.actualIncome === 1650 && varReported.incomeActualsLog[0]?.plannedIncome === 2000);

const withWindfall = recordCycleIncome(makeStore({ windfall: 500 }), '2026-08-06');
check('windfall is EXCLUDED from the recorded actual', withWindfall.incomeActualsLog[0]?.actualIncome === 2000);

const plannedFromPrediction = recordCycleIncome(
  makeStore({ currentCyclePrediction: { plannedIncome: 1800 } as DebtStore['currentCyclePrediction'] }),
  '2026-08-06',
  { actualIncome: 1750 },
);
check('planned comes from the stamped prediction when present', plannedFromPrediction.incomeActualsLog[0]?.plannedIncome === 1800);

const recaptured = recordCycleIncome(fixed, '2026-08-06', { actualIncome: 1900 });
check('re-capture for the same cycle REPLACES (no duplicate)', recaptured.incomeActualsLog.length === 1 && recaptured.incomeActualsLog[0]?.actualIncome === 1900);

const missedViaIncome = recordCycleIncome(makeStore(), '2026-08-06', { missed: true });
check('missed=true routes to the arrival axis, NOT a $0 income-actual', missedViaIncome.incomeActualsLog.length === 0 && missedViaIncome.missedArrivals[0] === '2026-08-06');

// 3d — surprise outflow
const outflow = recordSurpriseOutflow(makeStore(), { cycleEndDate: '2026-08-06', amount: 240, note: 'car repair' });
check('recordSurpriseOutflow appends a positive outflow', outflow.surpriseOutflowLog.length === 1 && outflow.surpriseOutflowLog[0]?.amount === 240);
check('recordSurpriseOutflow ignores a non-positive amount', recordSurpriseOutflow(makeStore(), { cycleEndDate: '2026-08-06', amount: 0 }).surpriseOutflowLog.length === 0);

// onboardedAt
const onboarded = stampOnboardedAt(makeStore());
check('stampOnboardedAt sets onboardedAt to currentDate when null', onboarded.onboardedAt === '2026-07-23');
check('stampOnboardedAt does NOT overwrite an existing stamp', stampOnboardedAt(makeStore({ onboardedAt: '2025-01-01' })).onboardedAt === '2025-01-01');

if (failures === 0) console.log('✅ All 2.4.D.3 substrate-producer tests passed.');
else {
  console.error(`❌ ${failures} substrate-producer test(s) failed.`);
  process.exit(1);
}
