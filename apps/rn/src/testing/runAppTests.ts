/**
 * v1.7 APP-LAYER regression runner (RS.1) — the RN-side counterpart to the core
 * `packages/core/testing/runRegressionTests`. Imports every app-layer `*.test.ts`; each self-runs on
 * import (asserts throw / `process.exit(1)` on failure), so any failure fails this runner too.
 *
 * Run from `apps/rn` under `tsx` (`npm run test:app`) so the RN tsconfig aliases (`@/`, `@core`) resolve.
 * The store + selectors are PURE (zero `react-native`/`expo` runtime imports), so no vitest / RN mocks
 * are needed — one consistent tsx test idiom across core + app-layer. New app-layer tests: add the file
 * + one line here.
 *
 * Sequential `await import()` (not static imports) so the header/footer + per-file order are honored.
 */

async function main() {
  console.log('\n▶ Running APP-LAYER regression tests (RS.1)...\n');

  // §2.4.D substrate + prediction pipeline (pure producers / orchestration).
  await import('../store/substrateProducers.test');
  await import('../store/projectedIncome.test');
  await import('../store/guardianPrediction.test');

  // RS.2 — Guardian selectors (states × tier × regime + break-it).
  await import('../store/guardianSelectors.test');

  // RS.3 — store actions + money-critical transitions (capture · rollover · missed/undo · lean ·
  // top-up · risk-notified · floor clamp · migration/import path), with break-it inputs.
  await import('../store/storeActions.test');

  // RS.5 — persistence + migration lifecycle (first-launch seed · clean/upgrade hydrate · corrupt →
  // quarantine → fresh · malformed-nested · save · migration structural edges). ASYNC → default-exports
  // its runner (the store lifecycle is async; top-level await is unavailable under the cjs transform).
  await (await import('../store/persistenceLifecycle.test')).default();

  // §2.6 Recovery Plan — the selector split (essential/deferrable + minimums) + defer action loop.
  await import('../store/recoverySelectors.test');

  // (RS.6+ app-layer suites are appended here as they land.)

  console.log('\n✅ App-layer regression tests: ALL PASSED.\n');
}

main().catch((err) => {
  console.error('\n❌ App-layer regression run failed:', err);
  process.exit(1);
});
