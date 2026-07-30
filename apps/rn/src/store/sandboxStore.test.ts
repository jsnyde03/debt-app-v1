import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';

import type { DebtStore } from '@/data/models';
import { appStore } from '@/store/appStore';
import {
  createSandboxBase,
  createSandboxStore,
  isSandboxStore,
  seedSandbox,
  type SandboxScenario,
} from '@/store/sandboxStore';
import { selectPaydayGuardian } from '@/store/guardianSelectors';
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

  // ── The payoff: a sandbox IS a real store, so shipped logic runs against it verbatim. ─────────
  const guardian = selectPaydayGuardian(b.getState().store);
  assert(guardian !== null, 'the shipped Guardian selector produces a real read off the sandbox');
  b.getState().setCushionFloor(1_000_000);
  eq(b.getState().store.cushionFloor, 1000, '…and the real setCushionFloor clamp applies (no forked logic)');

  console.log(`✅ sandbox store: ${passed} assertions passed.\n`);
}

export default run;
