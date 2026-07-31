import { appStore } from '@/store/appStore';
import { personaScenario } from '@/store/sandboxScenarios';
import { createSandboxStore } from '@/store/sandboxStore';
import { createDebtStore } from '@/store/store';

/**
 * 3.5.3.0 — the active-store rewire.
 *
 * The React wiring itself is proven by the e2e (Today rendering under a provider). What's pinned HERE is
 * the invariant the whole rewire exists to protect, in a form a unit test can hold: a write aimed at a
 * sandbox must not move the real store, and the two must stay genuinely separate instances.
 *
 * Worth stating why this matters more than a typical refactor test: the failure mode isn't a crash, it's
 * a tutorial quietly editing someone's real money. That kind of bug shows up as a support ticket months
 * later, if ever — so it gets an explicit assertion rather than trust.
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

function run() {
  console.log('3.5.3.0 — active-store rewire (real plan stays untouched under a sandbox)...');

  const sandbox = createSandboxStore(personaScenario('clear'));

  // The invariant: driving the sandbox — the same calls Today's converted write sites now make —
  // leaves the real store's data identity untouched.
  const realBefore = appStore.getState().store;
  const realFloorBefore = realBefore.cushionFloor;
  const realDebtsBefore = realBefore.debts.length;

  sandbox.getState().setCushionFloor(375);
  sandbox.getState().setLastHandledPayday('2026-03-02'); // the usePaydayCapture hazard, exercised
  sandbox.getState().markExpensePaid('nope', true);
  sandbox.getState().updatePrefs({ tutorialSeen: 'premium' });

  assert(appStore.getState().store === realBefore, 'the real store blob identity never changed');
  eq(appStore.getState().store.cushionFloor, realFloorBefore, '…its cushion floor is untouched');
  eq(appStore.getState().store.debts.length, realDebtsBefore, '…its debts are untouched');
  eq(appStore.getState().store.lastHandledPaydayDate, realBefore.lastHandledPaydayDate, '…and its payday tracking is untouched');

  // …while the sandbox itself DID take every one of those writes (else the test proves nothing).
  eq(sandbox.getState().store.cushionFloor, 375, 'the sandbox took the floor write');
  eq(sandbox.getState().store.lastHandledPaydayDate, '2026-03-02', '…and the payday write');
  eq(sandbox.getState().store.prefs.tutorialSeen, 'premium', '…and the prefs write');

  // Separate instances, not two views of one thing.
  assert(sandbox !== appStore, 'the sandbox is a distinct store instance');
  const other = createDebtStore();
  other.getState().setCushionFloor(925);
  eq(appStore.getState().store.cushionFloor, realFloorBefore, 'any non-singleton instance is likewise isolated');

  console.log(`✅ active-store rewire: ${passed} assertions passed.\n`);
}

run();
