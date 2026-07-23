/**
 * Reconciliation tests for the 2.4.D.4 prediction orchestration. Self-contained (tsx-runnable). Tests
 * the PURE pieces — the stamp decision, the confidence-context derivation, and the rollover reconcile;
 * the full `computeCyclePrediction`/`selectPaydayGuardian` mapping is covered by the app e2e.
 */
import type { PayCycleSnapshot } from '@core/storage/debtPlannerStorage';

import type { CyclePrediction, DebtStore } from '@/data/models';

import { applyStampDecision, classifyFreshness, daysBetweenISO, deriveConfidenceContext, reconcileClosingCycle } from './guardianPredictionCore';
import { incrementGenuineCycle, recordCycleIncome } from './substrateProducers';

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) console.log(`  ✓ ${name}`);
  else {
    failures++;
    console.error(`  ✗ ${name}`);
  }
}

const PRED = (over: Partial<CyclePrediction> = {}): CyclePrediction => ({
  forCycleEndDate: '2026-08-06',
  predictedCushion: 300,
  predictedState: 'clear',
  predictedShortfall: 0,
  predictedConfidenceContext: { discoveryHoldbackActive: false, coldStartHoldbackActive: false, provisional: false },
  plannedIncome: 2000,
  ...over,
});

function makeStore(over: Partial<DebtStore> = {}): DebtStore {
  return {
    paycheck: { amount: '2000', currentDate: '2026-07-23', nextPaycheckDate: '2026-08-06', incomeVaries: false, leanAmount: 0 },
    genuineCycleCount: 5,
    incomeActualsLog: [],
    surpriseOutflowLog: [],
    missedArrivals: [],
    currentCyclePrediction: null,
    ...over,
  } as unknown as DebtStore;
}

console.log('Running 2.4.D.4 prediction-orchestration tests...');

// ── applyStampDecision ──
check('fresh stamp when none exists', applyStampDecision(makeStore(), PRED()).currentCyclePrediction?.forCycleEndDate === '2026-08-06');
check('null read → no-op (no stamp)', applyStampDecision(makeStore(), null).currentCyclePrediction === null);

const stamped = makeStore({ currentCyclePrediction: PRED() });
check('same cycle, no material change → idempotent (unchanged reference)', applyStampDecision(stamped, PRED()).currentCyclePrediction === stamped.currentCyclePrediction);

const restamp = applyStampDecision(stamped, PRED({ predictedState: 'tight' }));
check('same cycle, material change (state flip) → re-stamp + restampedMidCycle', restamp.currentCyclePrediction?.predictedState === 'tight' && restamp.currentCyclePrediction?.restampedMidCycle === true);

const cushionMove = applyStampDecision(stamped, PRED({ predictedCushion: 320 }));
check('same cycle, ≥$1 cushion move → re-stamp (disturbed)', cushionMove.currentCyclePrediction?.restampedMidCycle === true);

const newCycle = applyStampDecision(stamped, PRED({ forCycleEndDate: '2026-08-20', predictedState: 'tight' }));
check('a DIFFERENT cycle → fresh stamp, NOT marked disturbed', newCycle.currentCyclePrediction?.forCycleEndDate === '2026-08-20' && !newCycle.currentCyclePrediction?.restampedMidCycle);

// ── deriveConfidenceContext ──
check('fixed income, ≥3 genuine cycles → no holdbacks, not provisional', (() => {
  const c = deriveConfidenceContext(makeStore({ genuineCycleCount: 5 }));
  return !c.discoveryHoldbackActive && !c.coldStartHoldbackActive && !c.provisional;
})());
check('new user (<3 genuine cycles) → discovery active + provisional', (() => {
  const c = deriveConfidenceContext(makeStore({ genuineCycleCount: 1 }));
  return c.discoveryHoldbackActive && c.provisional;
})());
check('fixed income NEVER triggers cold-start (masked)', !deriveConfidenceContext(makeStore({ genuineCycleCount: 5, paycheck: { incomeVaries: false, leanAmount: 1500 } as DebtStore['paycheck'] })).coldStartHoldbackActive);
check('variable income, <4 lean-confirming actuals → cold-start active', (() => {
  const store = makeStore({
    genuineCycleCount: 5,
    paycheck: { incomeVaries: true, leanAmount: 1500 } as DebtStore['paycheck'],
    incomeActualsLog: [{ cycleEndDate: 'a', plannedIncome: 1500, actualIncome: 1600 }] as DebtStore['incomeActualsLog'],
  });
  return deriveConfidenceContext(store).coldStartHoldbackActive;
})());
check('variable income, ≥4 lean-confirming actuals → cold-start released', (() => {
  const log = [1600, 1550, 1700, 1520].map((a, i) => ({ cycleEndDate: `c${i}`, plannedIncome: 1500, actualIncome: a }));
  const store = makeStore({
    genuineCycleCount: 5,
    paycheck: { incomeVaries: true, leanAmount: 1500 } as DebtStore['paycheck'],
    incomeActualsLog: log as DebtStore['incomeActualsLog'],
  });
  return !deriveConfidenceContext(store).coldStartHoldbackActive;
})());

// ── reconcileClosingCycle ──
const SNAP = (over: Partial<PayCycleSnapshot> = {}): PayCycleSnapshot => ({
  cycleEndDate: '2026-08-06',
  totalDebtBalance: 10000,
  totalPaidThisCycle: 500,
  completedRecommendedActions: [],
  payoffStrategy: 'snowball',
  ...over,
});

const noPred = reconcileClosingCycle(makeStore(), SNAP());
check('no in-flight prediction → snapshot untouched (un-graded)', noPred.prediction === undefined && noPred.outcome === undefined);

const wrongCycle = reconcileClosingCycle(makeStore({ currentCyclePrediction: PRED({ forCycleEndDate: '2026-09-01' }) }), SNAP());
check('prediction for a DIFFERENT cycle → snapshot untouched', wrongCycle.prediction === undefined);

const clean = reconcileClosingCycle(
  makeStore({
    currentCyclePrediction: PRED(),
    incomeActualsLog: [{ cycleEndDate: '2026-08-06', plannedIncome: 2000, actualIncome: 2000 }] as DebtStore['incomeActualsLog'],
  }),
  SNAP(),
);
check('matching cycle → folds prediction + outcome, cushion held == predicted when actual==planned', clean.prediction?.predictedCushion === 300 && clean.outcome?.actualCushionHeld === 300 && clean.outcome?.outcomeConfirmed === true);

const shorted = reconcileClosingCycle(
  makeStore({
    currentCyclePrediction: PRED(),
    incomeActualsLog: [{ cycleEndDate: '2026-08-06', plannedIncome: 2000, actualIncome: 1700 }] as DebtStore['incomeActualsLog'],
  }),
  SNAP(),
);
check('actual income below planned → held cushion drops by the shortfall (300 − 300 = 0)', shorted.outcome?.actualCushionHeld === 0);

const surprised = reconcileClosingCycle(
  makeStore({
    currentCyclePrediction: PRED(),
    incomeActualsLog: [{ cycleEndDate: '2026-08-06', plannedIncome: 2000, actualIncome: 2000 }] as DebtStore['incomeActualsLog'],
    surpriseOutflowLog: [{ cycleEndDate: '2026-08-06', amount: 120 }] as DebtStore['surpriseOutflowLog'],
  }),
  SNAP(),
);
check('a surprise outflow reduces the held cushion (300 − 120 = 180)', surprised.outcome?.actualCushionHeld === 180);

const missed = reconcileClosingCycle(
  makeStore({ currentCyclePrediction: PRED(), missedArrivals: ['2026-08-06'] }),
  SNAP(),
);
check('a missed arrival → actualIncome 0 (cushion floored at 0, not negative)', missed.outcome?.actualIncome === 0 && missed.outcome?.actualCushionHeld === 0);

const disturbed = reconcileClosingCycle(makeStore({ currentCyclePrediction: PRED({ restampedMidCycle: true }) }), SNAP());
check('a re-stamped prediction → snapshot.disturbed = true', disturbed.disturbed === true);

// ── 2.4.D.7 §2.0 seams: read-freshness (off inputsAsOf) + substrate de-gate ──
check('classifyFreshness: <30 days → fresh', classifyFreshness(10, 30, 45) === 'fresh');
check('classifyFreshness: 30–44 days → aging', classifyFreshness(30, 30, 45) === 'aging' && classifyFreshness(44, 30, 45) === 'aging');
check('classifyFreshness: ≥45 days → stale', classifyFreshness(45, 30, 45) === 'stale');
check('classifyFreshness: negative day count floored to fresh', classifyFreshness(-5, 30, 45) === 'fresh');
check('daysBetweenISO computes whole-day span', daysBetweenISO('2026-06-01', '2026-07-16') === 45);
// Read-freshness keys off inputsAsOf, NOT lastVerifiedDate: a rolled-over debt with an OLD
// lastVerifiedDate but a RECENT inputsAsOf must read fresh (the 2.1↔2.3 reconciliation).
check('recent inputsAsOf → fresh even if a debt would be stale by lastVerifiedDate', classifyFreshness(daysBetweenISO('2026-07-20', '2026-07-23'), 30, 45) === 'fresh');
// Substrate de-gate: the RECORDING producers never gate on debts — they feed a debt-free store.
const debtFree = incrementGenuineCycle(makeStore({ genuineCycleCount: 4 } as Partial<DebtStore>));
check('genuineCycleCount increments on a debt-free store (substrate de-gated)', debtFree.genuineCycleCount === 5);
const debtFreeIncome = recordCycleIncome(makeStore(), '2026-08-06');
check('income-actuals record on a debt-free store (substrate de-gated)', debtFreeIncome.incomeActualsLog.length === 1);

if (failures === 0) console.log('✅ All 2.4.D.4 + D.7 prediction/seam tests passed.');
else {
  console.error(`❌ ${failures} prediction-orchestration test(s) failed.`);
  process.exit(1);
}
