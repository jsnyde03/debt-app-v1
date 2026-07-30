import {
  HARNESS_SCENARIO_IDS,
  harnessScenario,
  publishSandbox,
  resolveScenario,
  unpublishSandbox,
} from '@/store/sandboxHarness';
import { personaScenario } from '@/store/sandboxScenarios';
import { createSandboxStore } from '@/store/sandboxStore';

/**
 * 3.5.0.7 — the e2e/QA harness seam.
 *
 * What matters here is the SHAPE of the seam, not just that it works: a test may name a state and read a
 * snapshot, and may NOT reach the store's actions. That asymmetry is what stops a tutorial e2e from
 * passing while the real interaction is broken — if a test could mutate the sandbox directly it could
 * manufacture the state it then asserts on.
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

type HarnessGlobal = { __debtSandboxHarness?: { scenarioId?: string; snapshot?: () => unknown } };

function run() {
  console.log('3.5.0.7 — sandbox harness seam (scenario selection · read-only snapshot)...');

  // ── Resolution: named ids map to real scenarios; anything else is refused. ────────────────────
  assert(HARNESS_SCENARIO_IDS.length === 3, 'every named state is addressable by a harness id');
  for (const id of HARNESS_SCENARIO_IDS) {
    const sc = resolveScenario(id);
    assert(sc !== null, `"${id}" resolves to a real scenario`);
    eq(sc!.id, id, `…and keeps its id`);
  }
  eq(resolveScenario('nope'), null, 'an unknown id resolves to null (caller keeps its own default)');
  eq(resolveScenario(undefined), null, 'no request → null, so a real user build is unaffected');

  // The ceiling passes through, so a test can drive the tutorial's own bound.
  const withCeiling = resolveScenario('persona-clear', { maxGenuineCycles: 3 });
  eq(withCeiling!.maxGenuineCycles, 3, 'the harness can request the tutorial ceiling');

  // ── Selection: nothing requested by default; a request is honoured. ───────────────────────────
  const g = globalThis as typeof globalThis & HarnessGlobal;
  eq(harnessScenario(), null, 'with nothing requested, the harness imposes no scenario');
  g.__debtSandboxHarness = { scenarioId: 'persona-at-risk' };
  eq(harnessScenario()?.id, 'persona-at-risk', 'a requested scenario is handed back to the tutorial');

  // ── Snapshot: read-only, and it reflects the LIVE sandbox rather than a copy taken at publish. ─
  const sandbox = createSandboxStore(personaScenario('clear'));
  publishSandbox(sandbox, 'persona-clear');
  const snap = g.__debtSandboxHarness!.snapshot!;
  const before = snap() as { cushionFloor: number; cycle: number };
  eq(before.cushionFloor, 200, 'the snapshot reads the sandbox\'s real floor');

  sandbox.getState().setCushionFloor(325);
  const after = snap() as { cushionFloor: number };
  eq(after.cushionFloor, 325, '…and tracks it live (a test sees what the interaction actually did)');

  // The seam exposes no way to MUTATE — a test can observe, not manufacture.
  const exposed = Object.keys(g.__debtSandboxHarness!);
  assert(
    exposed.every((k) => k === 'scenarioId' || k === 'snapshot'),
    'the harness exposes ONLY selection + snapshot — no store actions to fake a state with',
  );

  unpublishSandbox();
  eq(g.__debtSandboxHarness!.snapshot, undefined, 'unpublishing clears it (no snapshot outlives its sandbox)');

  // Leave the global clean for any later suite.
  delete (g as HarnessGlobal).__debtSandboxHarness;

  console.log(`✅ sandbox harness: ${passed} assertions passed.\n`);
}

run();
