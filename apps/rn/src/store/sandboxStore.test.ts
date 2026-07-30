import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';

import type { DebtStore } from '@/data/models';
import { appStore } from '@/store/appStore';
import {
  createSandboxBase,
  createSandboxStore,
  isSandboxStore,
  seedSandbox,
  SANDBOX_MAX_GENUINE_CYCLES,
  SANDBOX_MAX_HISTORY,
  type SandboxScenario,
} from '@/store/sandboxStore';
import { selectGuardianProofOfWork, selectPaydayGuardian } from '@/store/guardianSelectors';
import { deriveConfidenceContext } from '@/store/guardianPredictionCore';
import { bootstrapPersistence } from '@/store/persistence';
import { createDebtStore } from '@/store/store';
import type { StorageAdapter } from '@/storage/adapter';

/**
 * 3.5.0.1 — the SANDBOX STORE factory: determinism + the three isolation guarantees.
 *
 * This is the substrate every other Phase-3.5 step stands on, so the load-bearing assertions here are
 * the NEGATIVE ones: a sandbox must not reach durable storage, must not disturb the real `appStore`,
 * and must not drift with the wall clock. The positive half asserts the payoff — a sandbox IS a real
 * store, so the shipped selectors and actions run against it verbatim (the tutorial drives the real
 * engine, not a mock of it).
 *
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

/** A counting adapter: proves whether ANY durable read/write was attempted. */
class SpyAdapter implements StorageAdapter {
  reads = 0;
  writes = 0;
  async read() {
    this.reads++;
    return null;
  }
  async write() {
    this.writes++;
  }
}

/** A plan-ready premium scenario — enough money shape for the Guardian to produce a real read. */
const SCENARIO: SandboxScenario = {
  id: 'test-clear',
  label: 'Test — a clear cycle',
  baseDate: '2026-03-02',
  build: (base): DebtStore => ({
    ...base,
    subscriptionPlan: 'premium',
    paycheck: { ...base.paycheck, amount: '2000' },
    debts: [
      {
        id: 'd0',
        name: 'Card',
        balance: 5000,
        minimumPayment: 100,
        apr: 20,
        dueDate: base.paycheck.currentDate,
        type: 'debt',
        recurrence: 'monthly',
        balanceAsOfDate: base.paycheck.currentDate,
        lastVerifiedDate: base.paycheck.currentDate,
        originalBalance: 5000,
      } as DebtStore['debts'][number],
    ],
    prefs: { ...base.prefs, onboardingComplete: true },
  }),
};

async function run() {
  console.log('3.5.0.1 — sandbox store (determinism + isolation)...');

  // ── The brand: only the factory makes a sandbox. ──────────────────────────────────────────────
  const sandbox = createSandboxStore(SCENARIO);
  eq(isSandboxStore(sandbox), true, 'the factory brands its instance as a sandbox');
  eq(isSandboxStore(appStore), false, 'the real appStore singleton is NOT a sandbox');
  eq(isSandboxStore(createDebtStore()), false, 'a bare createDebtStore() is NOT a sandbox');

  // ── Guarantee 1/2: durable storage is unreachable, even when mis-wired. ───────────────────────
  const spy = new SpyAdapter();
  await sandbox.getState().hydrate(spy);
  await sandbox.getState().save(spy);
  eq(spy.reads, 0, 'a neutered hydrate() never reads the adapter');
  eq(spy.writes, 0, 'a neutered save() never writes the adapter');

  // The real mis-wire this defends against: handing a sandbox to the persistence bootstrap.
  await bootstrapPersistence(spy, sandbox);
  sandbox.getState().setCushionFloor(400);
  await new Promise((r) => setTimeout(r, 600)); // past the 500ms autosave debounce
  eq(spy.writes, 0, 'bootstrapPersistence(adapter, sandbox) writes NOTHING, even after a mutation');

  // ── Guarantee 3: the user's real plan is untouched by anything the sandbox does. ──────────────
  const realBefore = appStore.getState().store;
  sandbox.getState().addDebt({
    id: 'sandbox-only',
    name: 'Tutorial card',
    balance: 999,
    minimumPayment: 25,
    apr: 0,
    dueDate: SCENARIO.baseDate,
    type: 'debt',
    recurrence: 'monthly',
  } as DebtStore['debts'][number]);
  assert(appStore.getState().store === realBefore, 'sandbox mutations leave the real appStore identity untouched');
  eq(appStore.getState().store.debts.length, realBefore.debts.length, '…and add no debt to the real plan');
  eq(sandbox.getState().store.debts.length, 2, '…while the sandbox itself did take the debt');

  // ── Determinism: the clock is frozen, so two runs are identical whatever day it is. ───────────
  const base = createSandboxBase('2026-03-02');
  eq(base.paycheck.currentDate, '2026-03-02', 'createSandboxBase pins currentDate to the frozen base date');
  eq(base.inputsAsOf, '2026-03-02', '…and pins inputsAsOf to it (no live-clock read-freshness)');
  eq(
    base.paycheck.nextPaycheckDate,
    getNextPaycheckDate({ payCycle: base.paycheck.payCycle, currentDate: '2026-03-02' }),
    '…and derives nextPaycheckDate from the frozen date, not today',
  );

  const a = createSandboxStore(SCENARIO);
  const b = createSandboxStore(SCENARIO);
  // `assert`, not `eq` — an inequality here would dump two full store blobs into the runner log.
  const opening = JSON.stringify(b.getState().store);
  assert(JSON.stringify(a.getState().store) === opening, 'two sandboxes from one scenario open byte-identical');

  // Re-seeding is the tutorial's "start over" / the demo's loop restart.
  a.getState().setCushionFloor(975);
  a.getState().removeDebt('d0');
  assert(JSON.stringify(a.getState().store) !== opening, 'a driven sandbox diverges');
  seedSandbox(a, SCENARIO);
  assert(
    JSON.stringify(a.getState().store) === opening,
    're-seeding restores the exact opening state (replay is byte-deterministic)',
  );
  eq(a.getState().isHydrated, true, '…and leaves the sandbox hydrated (the shipped isHydrated gates pass)');
  eq(a.getState().intentRollback, null, '…with transient Undo state cleared');

  // ── The frozen clock: re-anchoring actions must NOT stamp the real today. ────────────────────
  // Caught in the 3.5.0.1 after-scan: `recordDriftBaseline` reads the wall clock, and it fires on
  // rollover / add-remove-debt / onboarding. Un-frozen, a scenario dated months back would anchor to
  // real today and read as wildly ahead/behind — nonsense in a tutorial, and non-deterministic.
  const drifted = createSandboxStore(SCENARIO);
  drifted.getState().completeOnboarding();
  eq(
    drifted.getState().store.driftBaseline?.anchorDate,
    SCENARIO.baseDate,
    'completeOnboarding anchors drift to the FROZEN base date, not the real today',
  );
  drifted.getState().rolloverPayCycle();
  const anchorAfterRoll = drifted.getState().store.driftBaseline?.anchorDate;
  assert(
    anchorAfterRoll === SCENARIO.baseDate,
    'a scripted rollover keeps the frozen anchor (no wall-clock leak into a driven sandbox)',
  );

  // Re-seeding to a scenario with a DIFFERENT base date re-points the clock too.
  const later: SandboxScenario = { ...SCENARIO, id: 'test-later', baseDate: '2026-09-07' };
  seedSandbox(drifted, later);
  drifted.getState().completeOnboarding();
  eq(
    drifted.getState().store.driftBaseline?.anchorDate,
    '2026-09-07',
    're-seeding to another base date re-points the frozen clock',
  );

  // The real store is untouched by all of this — its clock is still the wall clock.
  const real = createDebtStore();
  real.setState({ store: SCENARIO.build(createSandboxBase(SCENARIO.baseDate)) });
  real.getState().completeOnboarding();
  assert(
    real.getState().store.driftBaseline?.anchorDate !== SCENARIO.baseDate,
    'a NON-sandbox store still anchors to the real wall clock (default behavior unchanged)',
  );

  // ── 3.5.0.2 — the cold-start honesty ceiling holds BY CONSTRUCTION. ──────────────────────────
  // The point: the demo must never depict a Guardian a day-one user could not have. The before-scan
  // found three independent maturity channels, so all three are asserted — driven, not just seeded.
  const aged = createSandboxStore(SCENARIO);
  aged.getState().completeOnboarding();
  for (let i = 0; i < 8; i++) aged.getState().rolloverPayCycle();

  const s = aged.getState().store;
  eq(s.genuineCycleCount, SANDBOX_MAX_GENUINE_CYCLES, '8 scripted rollovers cannot push genuineCycleCount past the cap');
  assert(s.cycleHistory.length <= SANDBOX_MAX_HISTORY, '…nor build a multi-cycle cycleHistory');
  assert(s.incomeActualsLog.length <= SANDBOX_MAX_HISTORY, '…nor accumulate lean confirmations');
  eq(s.onboardedAt, SCENARIO.baseDate, '…and "day one" never drifts off the frozen base date');
  eq(s.inputsAsOf, s.paycheck.currentDate, '…and the read never ages into a staleness hedge');

  // Channel 1 — the safety net is still held (discovery holdback never retires).
  eq(
    deriveConfidenceContext(s).discoveryHoldbackActive,
    true,
    'the discovery holdback is STILL active after 8 rollovers (the safety net cannot mature away)',
  );

  // Channel 2 — the proof strip cannot claim a track record the user has not earned.
  const pow = selectGuardianProofOfWork(s);
  assert(
    pow === null || pow.heldStreak <= SANDBOX_MAX_HISTORY,
    'the proof-of-work strip cannot announce a multi-paycheck held streak on a day-one demo',
  );

  // Channel 3 — a variable-income scenario cannot clear the cold-start holdback either.
  const varying = createSandboxStore({
    ...SCENARIO,
    id: 'test-variable',
    build: (base) => {
      const built = SCENARIO.build(base);
      return { ...built, paycheck: { ...built.paycheck, incomeVaries: true, leanAmount: 1500, typicalAmount: 2000 } };
    },
  });
  varying.getState().completeOnboarding();
  for (let i = 0; i < 8; i++) varying.getState().rolloverPayCycle();
  eq(
    deriveConfidenceContext(varying.getState().store).coldStartHoldbackActive,
    true,
    'variable income: the cold-start holdback also survives 8 rollovers (leanConfirms capped)',
  );

  // The ceiling also binds the SEED — `setState` bypasses the actions' wrapped `set`.
  const matured = createSandboxStore({
    ...SCENARIO,
    id: 'test-matured-seed',
    build: (base) => ({
      ...SCENARIO.build(base),
      genuineCycleCount: 6,
      cycleHistory: [{ cycleEndDate: base.paycheck.currentDate, totalPaidThisCycle: 100 }] as DebtStore['cycleHistory'],
    }),
  });
  eq(
    matured.getState().store.genuineCycleCount,
    SANDBOX_MAX_GENUINE_CYCLES,
    'a scenario cannot SEED a matured Guardian past the ceiling either',
  );

  // …and neither can a direct `setState`, the other door into the store (3.5.0.2 after-scan).
  matured.setState({ store: { ...matured.getState().store, genuineCycleCount: 9 } });
  eq(
    matured.getState().store.genuineCycleCount,
    SANDBOX_MAX_GENUINE_CYCLES,
    'a direct sandbox.setState is bounded too (every write door goes through the ceiling)',
  );

  // And the real app is untouched: no bound, so a real store matures normally.
  const realAged = createDebtStore();
  realAged.setState({ store: { ...SCENARIO.build(createSandboxBase(SCENARIO.baseDate)), genuineCycleCount: 6 } });
  realAged.getState().setPayoffStrategy('avalanche');
  eq(realAged.getState().store.genuineCycleCount, 6, 'a NON-sandbox store is NOT bounded (real maturity is untouched)');

  // ── The payoff: a sandbox IS a real store, so shipped logic runs against it verbatim. ─────────
  const guardian = selectPaydayGuardian(b.getState().store);
  assert(guardian !== null, 'the shipped Guardian selector produces a real read off the sandbox');
  b.getState().setCushionFloor(1_000_000);
  eq(b.getState().store.cushionFloor, 1000, '…and the real setCushionFloor clamp applies (no forked logic)');

  // 3.5.0.5 — the tutorial's "drag your line" beat routes through THIS setter, so the snap-to-$25 the
  // user is being taught is the app's own rule, not a reimplementation that could drift from it.
  b.getState().setCushionFloor(213);
  eq(b.getState().store.cushionFloor, 225, 'the sandbox floor snaps to $25 exactly as the real app does');
  const realFloorBefore = appStore.getState().store.cushionFloor;
  b.getState().setCushionFloor(375);
  eq(appStore.getState().store.cushionFloor, realFloorBefore, '…while the user\'s REAL cushion line never moves');

  console.log(`✅ sandbox store: ${passed} assertions passed.\n`);
}

export default run;
