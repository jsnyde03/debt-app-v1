import { applyCapture, applyRollover } from '@/store/payday';

import { createDefaultStore } from '@/data/defaults';
import { selectBillsAttestation, selectPaydayGuardian, selectReserveRelease, selectReserveWalkback } from '@/store/guardianSelectors';
import { recordSurpriseOutflow } from '@/store/substrateProducers';
import { runMigrations } from '@/data/migrations';
import { CURRENT_STORE_VERSION, type DebtStore } from '@/data/models';
import { createDebtStore } from '@/store/store';

/**
 * RS.3 — comprehensive break-it coverage for the STORE ACTIONS + money-critical TRANSITIONS: capture,
 * rollover, missed/undo, lean, top-up, risk-notified, the cushion-floor clamp, and the migration/import
 * path. Exercises the actual wired zustand actions (via `createDebtStore()`) plus the pure `applyCapture`/
 * `applyRollover`/`runMigrations` transitions with adversarial / empty / boundary / double-apply inputs.
 * Throw-based (the runner aggregates); run via `npm run test:app`.
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
function throws(fn: () => unknown, label: string) {
  try {
    fn();
  } catch {
    passed++;
    console.log(`  ✓ ${label}`);
    return;
  }
  throw new Error(`FAIL [${label}] — expected a throw`);
}

/** A plan-ready store: positive paycheck, one debt, an EF goal, onboarded. */
function plan(over: Partial<DebtStore> = {}): DebtStore {
  const s = createDefaultStore();
  const today = s.paycheck.currentDate;
  return {
    ...s,
    subscriptionPlan: 'premium',
    paycheck: { ...s.paycheck, amount: '2000' },
    debts: [
      { id: 'd0', name: 'Card', balance: 5000, minimumPayment: 100, apr: 20, dueDate: today, type: 'debt', recurrence: 'monthly', balanceAsOfDate: today, lastVerifiedDate: today, originalBalance: 5000 } as DebtStore['debts'][number],
    ],
    goals: [{ id: 'g0', name: 'Emergency Fund', type: 'emergency', currentAmount: 500, targetAmount: 5000 }],
    prefs: { ...s.prefs, onboardingComplete: true },
    ...over,
  };
}

/** A wired store instance seeded with a plan blob. */
function inst(over: Partial<DebtStore> = {}) {
  const s = createDebtStore();
  s.setState({ store: plan(over) });
  return s;
}
const emptyRecon = { expensePaid: {}, debtPaid: {} };

function run() {
  console.log('Running store-action (RS.3) tests...');

  // ── capturePayday: records the cycle's actuals ──
  {
    const s = plan();
    const cycle = s.paycheck.nextPaycheckDate;
    const captured = applyCapture(s, [], emptyRecon); // fixed income, no actuals → deterministic
    eq(captured.incomeActualsLog.length, 1, 'capture (fixed, no actuals) → 1 income-actual logged');
    eq(captured.incomeActualsLog[0].actualIncome, 2000, '…actual defaults to the planned amount');
    eq(captured.incomeActualsLog[0].cycleEndDate, cycle, '…keyed to this cycle');

    const withActual = applyCapture(s, [], emptyRecon, { actualIncome: 1800 });
    eq(withActual.incomeActualsLog[0].actualIncome, 1800, 'capture with a reported actual → records it');

    const missed = applyCapture(s, [], emptyRecon, { missed: true });
    eq(missed.incomeActualsLog.length, 0, 'capture missed → NO income-actual (not a low-earning cycle)');
    assert(missed.missedArrivals.includes(cycle), '…recorded on the arrival axis instead');

    const outflow = applyCapture(s, [], emptyRecon, { surpriseOutflow: { cycleEndDate: cycle, amount: 120, note: 'car' } as DebtStore['surpriseOutflowLog'][number] });
    eq(outflow.surpriseOutflowLog.length, 1, 'capture with a surprise outflow → logged');
    const zeroOut = applyCapture(s, [], emptyRecon, { surpriseOutflow: { cycleEndDate: cycle, amount: 0 } as DebtStore['surpriseOutflowLog'][number] });
    eq(zeroOut.surpriseOutflowLog.length, 0, 'non-positive outflow → ignored (no crash)');

    // re-capture the same cycle REPLACES (a correction, not a duplicate)
    const recaptured = applyCapture(applyCapture(s, [], emptyRecon), [], emptyRecon, { actualIncome: 1500 });
    eq(recaptured.incomeActualsLog.length, 1, 're-capture same cycle → replaces, still 1 entry');
    eq(recaptured.incomeActualsLog[0].actualIncome, 1500, '…with the corrected value');

    // variable income with no reported actual → skip (can't fabricate)
    const varStore = plan({ paycheck: { ...s.paycheck, incomeVaries: true } });
    eq(applyCapture(varStore, [], emptyRecon).incomeActualsLog.length, 0, 'variable income, no actual → skipped');
  }

  // ── rolloverPayCycle: the cycle boundary transition ──
  {
    const s = inst({ windfall: 300, completedRecommendedActions: [{ targetId: 'd0', label: 'Snowball', category: 'snowball', recommendedAmount: 100, actualAmount: 100 }] });
    const before = s.getState().store;
    const prevNext = before.paycheck.nextPaycheckDate;
    s.getState().rolloverPayCycle();
    const after = s.getState().store;
    eq(after.paycheck.currentDate, prevNext, 'rollover advances currentDate to the old payday');
    assert(after.paycheck.nextPaycheckDate !== prevNext, '…and advances nextPaycheckDate');
    eq(after.genuineCycleCount, before.genuineCycleCount + 1, '…increments the genuine-cycle counter');
    eq(after.windfall ?? 0, 0, '…clears the one-time windfall');
    eq(after.completedRecommendedActions.length, 0, '…resets completed actions for the new cycle');
    eq(after.cycleHistory.length, before.cycleHistory.length + 1, '…appends a closing-cycle snapshot');

    // double-apply (state-machine abuse) must not crash and must advance monotonically
    s.getState().rolloverPayCycle();
    eq(s.getState().store.genuineCycleCount, before.genuineCycleCount + 2, 'double rollover → counter advances again (no crash)');
    eq(s.getState().store.cycleHistory.length, before.cycleHistory.length + 2, '…second snapshot appended');
  }

  // ── missed / undo ──
  {
    const s = inst();
    const cycle = s.getState().store.paycheck.nextPaycheckDate;
    s.getState().declareMissedPaycheck();
    assert(s.getState().store.missedArrivals.includes(cycle), 'declareMissedPaycheck → marks THIS cycle');
    s.getState().declareMissedPaycheck();
    eq(s.getState().store.missedArrivals.length, 1, '…idempotent (declaring twice keeps one)');
    s.getState().undoMissedPaycheck();
    eq(s.getState().store.missedArrivals.length, 0, 'undoMissedPaycheck → clears it');
  }

  // ── lean suggestion ──
  {
    const s = inst({ dismissedLeanSuggestion: 1400 });
    s.getState().applyLeanSuggestion(1600);
    eq(s.getState().store.paycheck.leanAmount, 1600, 'applyLeanSuggestion → sets the lean floor');
    eq(s.getState().store.dismissedLeanSuggestion, undefined, '…and clears any prior dismissal');
    s.getState().dismissLeanSuggestion(1550);
    eq(s.getState().store.dismissedLeanSuggestion, 1550, 'dismissLeanSuggestion → records the dismissed value');
  }

  // ── tight top-up (2.4.11.2) ──
  {
    const s = inst();
    const cycle = s.getState().store.paycheck.nextPaycheckDate;
    s.getState().applyTightTopUp('g0', 200);
    eq(s.getState().store.goals[0].currentAmount, 300, 'applyTightTopUp → draws the amount from the goal');
    eq(s.getState().store.cycleTopUp?.amount, 200, '…records the cycle top-up');
    eq(s.getState().store.cycleTopUp?.forCycle, cycle, '…keyed to this cycle');
    s.getState().applyTightTopUp('g0', 100);
    eq(s.getState().store.cycleTopUp?.amount, 300, 'repeat top-up same cycle → accumulates');
    // over-draw clamps the goal at zero (break-it: amount > balance)
    s.getState().applyTightTopUp('g0', 99999);
    eq(s.getState().store.goals[0].currentAmount, 0, 'over-draw → goal clamped at 0 (never negative)');
  }

  // ── risk-notified (2.4.10) ──
  {
    const s = inst();
    const cycle = s.getState().store.paycheck.nextPaycheckDate;
    s.getState().applyRiskNotified(cycle, 'at-risk', '2026-07-24T10:00:00Z');
    eq(s.getState().store.currentCycleNotifyState?.notifiedRiskLevel, 'at-risk', 'applyRiskNotified → stamps the notify-state');
    eq(s.getState().store.pushLog.length, 1, '…appends the push-log timestamp');
    // bounded to the last 24 (break-it: hammer it)
    for (let i = 0; i < 30; i++) s.getState().applyRiskNotified(cycle, 'at-risk', `2026-07-24T10:${String(i).padStart(2, '0')}:00Z`);
    eq(s.getState().store.pushLog.length, 24, 'push-log bounded to 24 (never grows unbounded)');
    s.getState().acknowledgeRiskCleared();
    eq(s.getState().store.currentCycleNotifyState, null, 'acknowledgeRiskCleared → clears the notify-state');
  }

  // ── setCushionFloor: clamp + snap + NaN guard ──
  {
    const s = inst();
    s.getState().setCushionFloor(213);
    eq(s.getState().store.cushionFloor, 225, 'floor 213 → snapped to the nearest 25');
    s.getState().setCushionFloor(99999);
    eq(s.getState().store.cushionFloor, 1000, 'floor above the cap → clamped to 1000');
    s.getState().setCushionFloor(-50);
    eq(s.getState().store.cushionFloor, 0, 'negative floor → clamped to 0');
    s.getState().setCushionFloor(NaN);
    eq(s.getState().store.cushionFloor, 200, 'NaN floor → guarded to the 200 default');
    s.getState().setCushionFloor(Infinity);
    eq(s.getState().store.cushionFloor, 200, 'Infinity floor → guarded to 200');
  }

  // ── setWindfall: non-negative ──
  {
    const s = inst();
    s.getState().setWindfall(-500);
    eq(s.getState().store.windfall, 0, 'negative windfall → clamped to 0');
    s.getState().setWindfall(250);
    eq(s.getState().store.windfall, 250, 'positive windfall → kept');
  }

  // ── verifyDebtBalance(s): the money-critical re-anchor — clamp + round + date stamp (RS.4 fold-in) ──
  {
    const s = inst();
    s.getState().verifyDebtBalance('d0', -300, '2026-08-01');
    eq(s.getState().store.debts[0].balance, 0, 'verifyDebtBalance → negative clamped to 0');
    eq(s.getState().store.debts[0].lastVerifiedDate, '2026-08-01', '…stamps the confirmation date');
    eq(s.getState().store.debts[0].balanceAsOfDate, '2026-08-01', '…and the projection anchor date');
    s.getState().verifyDebtBalance('d0', 1234.567, '2026-08-01');
    eq(s.getState().store.debts[0].balance, 1234.57, '…fractional cents rounded to 2dp');
    // batch path clamps per-entry; an unknown id is a no-op (no crash)
    s.getState().verifyDebtBalances([{ id: 'd0', balance: -9 }, { id: 'ghost', balance: 500 }], '2026-08-02');
    eq(s.getState().store.debts[0].balance, 0, 'verifyDebtBalances → per-entry clamp');
    eq(s.getState().store.debts.length, 1, '…unknown id ignored (no phantom debt)');
  }

  // ── 2.4.11.4b — safety-net (settling-in reserve) RELEASE at rollover ──
  {
    // A near-established premium user (genuineCycleCount 2 < the discovery gate of 3 → reserve held);
    // one rollover crosses the gate → the held→free release fires.
    const released = applyRollover(plan({ genuineCycleCount: 2, priorReserveHeld: true }));
    assert(released.pendingReserveRelease != null, 'reserve held→free at rollover → a release is pending');
    eq(released.pendingReserveRelease?.tapped, false, '…no surprise outflow → not tapped');
    assert(selectReserveRelease(released) !== null, 'selectReserveRelease surfaces it (premium)');
    eq(selectReserveRelease({ ...released, subscriptionPlan: 'free' }), null, 'free tier → no release ack');

    // acknowledge clears it (one-time moment)
    const s = createDebtStore();
    s.setState({ store: released });
    s.getState().acknowledgeReserveRelease();
    eq(s.getState().store.pendingReserveRelease, null, 'acknowledgeReserveRelease → clears it');

    // a surprise outflow during the hold window → tapped, covered = the sum
    const tapped = applyRollover(plan({ genuineCycleCount: 2, priorReserveHeld: true, surpriseOutflowLog: [{ cycleEndDate: '2026-07-01', amount: 120 } as DebtStore['surpriseOutflowLog'][number]] }));
    eq(tapped.pendingReserveRelease?.tapped, true, 'a surprise during the hold → tapped');
    eq(tapped.pendingReserveRelease?.covered, 120, '…covered = the surprise sum');

    // an established user (reserve never held) → no false release on rollover
    const established = applyRollover(plan({ genuineCycleCount: 6, priorReserveHeld: false }));
    eq(established.pendingReserveRelease ?? null, null, 'established (no reserve) → no false release');
  }

  // ── 2.4.11.4c — "bills complete" attestation + surprise-outflow walk-back ──
  {
    // A discovery-hold scenario (genuineCycleCount 1 < the gate of 3): attesting reduces the safety net.
    const held = plan({ genuineCycleCount: 1 });
    const netUnattested = selectPaydayGuardian(held)?.heldReserve ?? 0;
    const netAttested = selectPaydayGuardian({ ...held, billsAttested: true })?.heldReserve ?? 0;
    assert(netUnattested > 0, 'discovery hold → a safety net is held');
    assert(netAttested < netUnattested && netAttested > 0, 'attesting bills → a SMALLER (not zero) safety net');

    // the affordance shows during a discovery hold (premium) + reflects the attested state
    eq(selectBillsAttestation(held).show, true, 'discovery hold (premium) → the attestation affordance shows');
    eq(selectBillsAttestation({ ...held, subscriptionPlan: 'free' }).show, false, 'free → no attestation affordance');
    eq(selectBillsAttestation({ ...held, billsAttested: true }).attested, true, '…reflects the attested state');

    // walk-back: a surprise outflow AFTER attesting restores the hold + flags the notice
    const walked = recordSurpriseOutflow({ ...held, billsAttested: true }, { cycleEndDate: '2026-07-01', amount: 90 } as DebtStore['surpriseOutflowLog'][number]);
    eq(walked.billsAttested, false, 'surprise after attesting → un-attests (restores the full hold)');
    eq(walked.pendingReserveWalkback, true, '…and flags the walk-back notice');
    eq(selectReserveWalkback(walked), true, 'selectReserveWalkback surfaces it (premium)');
    const noWalk = recordSurpriseOutflow(held, { cycleEndDate: '2026-07-01', amount: 90 } as DebtStore['surpriseOutflowLog'][number]);
    eq(noWalk.pendingReserveWalkback ?? null, null, 'surprise WITHOUT a prior attestation → no walk-back');

    // actions
    const s = createDebtStore();
    s.setState({ store: { ...held, pendingReserveWalkback: true } });
    s.getState().setBillsAttested(true);
    eq(s.getState().store.billsAttested, true, 'setBillsAttested → sets it');
    s.getState().acknowledgeReserveWalkback();
    eq(s.getState().store.pendingReserveWalkback, null, 'acknowledgeReserveWalkback → clears it');
  }

  // ── reset ──
  {
    const s = inst({ debts: plan().debts });
    s.getState().reset();
    eq(s.getState().store.debts.length, 0, 'reset → clears entities');
    eq(s.getState().store.prefs.onboardingComplete, false, '…and returns to onboarding');
    eq(s.getState().isHydrated, true, '…staying hydrated');
  }

  // ── migrations path (break-it: corrupt / partial / idempotent) ──
  {
    throws(() => runMigrations(null), 'runMigrations(null) → throws (caller quarantines)');
    throws(() => runMigrations([1, 2, 3]), 'runMigrations(array) → throws');
    throws(() => runMigrations('nope'), 'runMigrations(string) → throws');

    // a partial pre-v5 blob backfills the substrate fields to safe defaults
    const partial = { paycheck: { amount: '1500', payCycle: 'biweekly' }, debts: [{ id: 'x', name: 'Old', balance: 900, minimumPayment: 25, apr: 15, dueDate: '2026-07-01', type: 'debt', recurrence: 'monthly' }] };
    const m = runMigrations(partial as unknown);
    eq(m.storeVersion, CURRENT_STORE_VERSION, 'partial blob → stamped to the current version');
    eq(m.genuineCycleCount, 0, '…genuineCycleCount backfilled to 0');
    assert(Array.isArray(m.missedArrivals) && m.missedArrivals.length === 0, '…missedArrivals backfilled to []');
    assert(typeof m.inputsAsOf === 'string' && m.inputsAsOf.length > 0, '…inputsAsOf backfilled to a date');
    assert(!!m.debts[0].lastVerifiedDate && !!m.debts[0].balanceAsOfDate, '…debt projection dates backfilled');
    eq(m.paycheck.amount, '1500', '…preserves the persisted paycheck amount');

    // idempotent — re-migrating a migrated blob is a no-op on the version/fields
    const twice = runMigrations(m);
    eq(twice.storeVersion, CURRENT_STORE_VERSION, 'runMigrations is idempotent (version stable)');
    eq(twice.genuineCycleCount, m.genuineCycleCount, '…fields stable on re-migrate');

    // importStore routes a raw blob through migration (no undefined substrate fields)
    const s = createDebtStore();
    s.getState().importStore(partial as unknown as DebtStore);
    eq(s.getState().store.storeVersion, CURRENT_STORE_VERSION, 'importStore → routes through migration');
    eq(s.getState().store.genuineCycleCount, 0, '…substrate fields safe, never undefined');
  }

  // 3.5.5 — logManualPayment (money mutation) + the shared intent-rollback Undo.
  {
    const s = inst(); // debt d0 @ balance 5000
    const today = s.getState().store.paycheck.currentDate;
    s.getState().logManualPayment('d0', 1200);
    const d = s.getState().store.debts.find((x) => x.id === 'd0')!;
    eq(d.balance, 3800, 'logManualPayment: balance reduced by the amount');
    eq(d.lastVerifiedDate, today, '…re-anchors the verified date to today');
    assert(s.getState().intentRollback?.kind === 'log-payment', '…sets the log-payment Undo snapshot');

    s.getState().undoIntentAction();
    eq(s.getState().store.debts.find((x) => x.id === 'd0')!.balance, 5000, 'undoIntentAction: restores the pre-payment balance');
    eq(s.getState().intentRollback, null, '…clears the rollback');

    // clamp + guards
    const s2 = inst();
    s2.getState().logManualPayment('d0', 999999); // overpay
    eq(s2.getState().store.debts.find((x) => x.id === 'd0')!.balance, 0, 'logManualPayment: overpay clamps to 0 (never negative)');
    const s3 = inst();
    const before = s3.getState().store;
    s3.getState().logManualPayment('nope', 100); // bad id → no-op
    s3.getState().logManualPayment('d0', -50); // non-positive → no-op
    assert(s3.getState().store === before && s3.getState().intentRollback === null, 'logManualPayment: bad id / non-positive amount → no-op');
  }

  console.log(`✅ Store-action (RS.3) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
