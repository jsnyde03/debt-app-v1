/**
 * SCENARIO test runner — the RN-side journey suite, a peer to the app-layer regression runner
 * (`runAppTests`). Where regression asserts one function in isolation, a scenario drives a REAL store
 * through a realistic multi-step user journey and asserts the reads + persisted state evolve correctly
 * over time — catching composition bugs that only surface when the substrate, actions, and selectors
 * run together. Run from `apps/rn` under `tsx` (`npm run test:scenarios`); each `*.scenario.ts`
 * self-runs on import (asserts throw / `process.exit(1)` on failure).
 */

async function main() {
  console.log('\n▶ Running SCENARIO tests (multi-step user journeys)...\n');

  await import('./scenarios/guardianColdStartLifecycle.scenario');

  // (New scenarios are appended here as they land — graduation, shortfall→recovery, variable-income, …)

  console.log('\n✅ Scenario tests: ALL PASSED.\n');
}

main().catch((err) => {
  console.error('\n❌ Scenario run failed:', err);
  process.exit(1);
});
