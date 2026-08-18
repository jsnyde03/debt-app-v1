import { GUARDIAN_STATE_LABEL, PAYCHECK_SEGMENT } from '@core/copy/vocabulary';

/**
 * T4.5 (audit L1-7) — the Guardian's three cash states have ONE set of words.
 *
 * ⚠️ **This lives as a unit assertion because the e2e CANNOT see it.** The first attempt pinned
 * `getByText('Crunch')` on `/cushion-forecast`, and a plant restoring "Crunch" **passed** — that spec's
 * fixture has no under-the-line cycle (its own comment says so), so no `at-risk` band ever renders and the
 * assertion could not fail. *A fixture chosen for convenience decides which defects a guard can see.*
 *
 * `CashRunwayChart` assigns `STATE_LABEL = GUARDIAN_STATE_LABEL` directly — a one-line alias `tsc` checks —
 * so pinning the constant pins what that chart renders. ⚠️ The component itself is NOT imported here: this
 * runner is plain `tsx`, and pulling in `react-native/index.js` fails esbuild's transform.
 */

let passed = 0;
function assert(cond: boolean, label: string) {
  if (!cond) throw new Error(`FAIL [${label}]`);
  passed++;
  console.log(`  ✓ ${label}`);
}

function run() {
  console.log('Running glossary (T4.5) tests...');

  assert(GUARDIAN_STATE_LABEL.clear === 'Clear', 'clear → "Clear"');
  assert(GUARDIAN_STATE_LABEL.tight === 'Tight', 'tight → "Tight"');
  assert(GUARDIAN_STATE_LABEL['at-risk'] === 'Very tight', 'at-risk → "Very tight" (was "Crunch", a fourth name)');

  const all = Object.values(GUARDIAN_STATE_LABEL).join(' | ').toLowerCase();
  for (const dead of ['crunch', 'short', 'at-risk']) {
    assert(!all.includes(dead), `retired state word "${dead}" is gone from the labels`);
  }

  // ⛔ A shortfall is NOT one of these states — see the note on GUARDIAN_STATE_LABEL. The "short" check
  // above is what keeps the two conditions from being merged into one word.
  // The paycheck taxonomy stays distinct from the state words.
  assert(!Object.values(PAYCHECK_SEGMENT).some((v) => (Object.values(GUARDIAN_STATE_LABEL) as string[]).includes(v)),
    'no word is both a paycheck segment and a cash state');

  console.log(`✅ Glossary (T4.5) tests passed (${passed} asserts).`);
}

try {
  run();
} catch (err) {
  console.error(`❌ ${(err as Error).message}`);
  process.exitCode = 1;
  throw err;
}
