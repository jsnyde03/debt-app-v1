import { createDefaultStore } from '@/data/defaults';
import type { DebtStore } from '@/data/models';
import { selectBillsAttestation, selectPaydayGuardian, selectReserveRelease, selectReserveWalkback } from '@/store/guardianSelectors';
import { createDebtStore } from '@/store/store';

/**
 * SCENARIO TEST — a new premium user's safety-net lifecycle (the 2.4.11.4b/4c journey), end-to-end.
 *
 * Scenario tests differ from the app-layer regression suites: instead of asserting one function in
 * isolation, they drive a REAL store through a realistic multi-step user journey (onboard → cycle →
 * capture → rollover …) and assert the reads + persisted state evolve correctly at each beat — catching
 * the composition bugs that only surface when the substrate, actions, and selectors run together over
 * time. Throw-based; run via `npm run test:scenarios`.
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

/** A plan-ready PREMIUM store at genuineCycleCount 0 (a brand-new user), the cold-start starting point. */
function newPremiumPlan(): DebtStore {
  const s = createDefaultStore();
  const today = s.paycheck.currentDate;
  return {
    ...s,
    subscriptionPlan: 'premium',
    paycheck: { ...s.paycheck, amount: '2000' },
    debts: [{ id: 'd0', name: 'Card', balance: 5000, minimumPayment: 100, apr: 20, dueDate: today, type: 'debt', recurrence: 'monthly', balanceAsOfDate: today, lastVerifiedDate: today, originalBalance: 5000 } as DebtStore['debts'][number]],
    genuineCycleCount: 0,
    prefs: { ...s.prefs, onboardingComplete: false },
  };
}

function run() {
  console.log('Scenario: new premium user — the safety-net lifecycle (2.4.11.4b/4c)...');

  const app = createDebtStore();
  app.setState({ store: newPremiumPlan() });
  app.getState().completeOnboarding();

  // ── Cycle 1 (genuineCycleCount 0): the safety net is held; the attestation affordance shows. ──
  const netHeld = selectPaydayGuardian(app.getState().store)?.heldReserve ?? 0;
  assert(netHeld > 0, 'cold-start cycle 1 → a safety net is held');
  eq(selectBillsAttestation(app.getState().store).show, true, '…the "bills complete" affordance shows');
  eq(selectReserveRelease(app.getState().store), null, '…no release yet (still held)');

  // ── Attest → the safety net shrinks (never to zero). ──
  app.getState().setBillsAttested(true);
  const netAttested = selectPaydayGuardian(app.getState().store)?.heldReserve ?? 0;
  assert(netAttested > 0 && netAttested < netHeld, 'attesting bills → a SMALLER (not zero) safety net');

  // ── A surprise bill at the payday check-in → the attestation walks back. ──
  const cycle1 = app.getState().store.paycheck.nextPaycheckDate;
  app.getState().capturePayday([], { expensePaid: {}, debtPaid: {} }, { surpriseOutflow: { cycleEndDate: cycle1, amount: 90 } as DebtStore['surpriseOutflowLog'][number] });
  eq(app.getState().store.billsAttested, false, 'a surprise after attesting → un-attests (hold restored)');
  eq(selectReserveWalkback(app.getState().store), true, '…and surfaces the walk-back notice');
  app.getState().acknowledgeReserveWalkback();
  eq(app.getState().store.pendingReserveWalkback, null, '…dismissible');

  // ── Roll forward. Still held at cycles 1 and 2 (< the discovery gate of 3). ──
  app.getState().rolloverPayCycle(); // genuineCycleCount → 1
  app.getState().rolloverPayCycle(); // → 2
  eq(app.getState().store.genuineCycleCount, 2, 'two rollovers → genuineCycleCount 2');
  assert((selectPaydayGuardian(app.getState().store)?.heldReserve ?? 0) > 0, '…still held at cycle 2');
  eq(app.getState().store.pendingReserveRelease ?? null, null, '…no release yet');

  // ── The 3rd rollover crosses the discovery gate → the safety net RELEASES (insurance moment). ──
  app.getState().rolloverPayCycle(); // → 3
  eq(app.getState().store.genuineCycleCount, 3, 'third rollover → genuineCycleCount 3');
  const release = selectReserveRelease(app.getState().store);
  assert(release !== null, 'crossing the discovery gate → the safety-net RELEASE fires');
  eq(release?.tapped, true, '…tapped (a surprise drew on it during the hold)');
  eq(release?.covered, 90, '…covered = the surprise sum ($90)');
  assert((selectPaydayGuardian(app.getState().store)?.heldReserve ?? 0) === 0, '…and the safety net is no longer held');

  console.log(`✅ Safety-net lifecycle scenario passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
