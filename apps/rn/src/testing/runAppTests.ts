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

  // 3.5.3.1 — Payday Countdown Live Activity pure derivation (premium/toggle/window gates · countdown).
  await import('../liveActivity/paydayActivityContent.test');

  // 3.5.3.5 — the AppIntent → store bridge core (defensive parse · apply-dispatch · drain).
  await import('../appIntents/pendingActions.test');

  // 3.6.6 — the ⌘N add-debt bus latch (held-then-delivered-once).
  await import('../keyCommands/keyCommandBus.test');

  // VIS-5 — the variable-income debt-free band (typical/lean two-run derivation).
  await import('../store/debtFreeBand.test');

  // RS.3 — store actions + money-critical transitions (capture · rollover · missed/undo · lean ·
  // top-up · risk-notified · floor clamp · migration/import path), with break-it inputs.
  await import('../store/storeActions.test');

  // RS.5 — persistence + migration lifecycle (first-launch seed · clean/upgrade hydrate · corrupt →
  // quarantine → fresh · malformed-nested · save · migration structural edges). ASYNC → default-exports
  // its runner (the store lifecycle is async; top-level await is unavailable under the cjs transform).
  await (await import('../store/persistenceLifecycle.test')).default();

  // §2.6 Recovery Plan — the selector split (essential/deferrable + minimums) + defer action loop.
  await import('../store/recoverySelectors.test');

  // MF.4 (audit #5) — the debt-free projection runs on the steady-state (holdback-stripped) deploy.
  await import('../store/steadyStateProjection.test');

  // §2.7.4 — the in-window BNPL cadence scaling flows through the allocation + the lookahead timeline.
  await import('../store/bnplCadence.test');

  // §2.9 — the Can-I-Afford-This? selectors (verdict + honest impact + save-for-it options).
  await import('../store/affordability.test');

  // VIS-6 — the Windfall Autopilot split (marginal diff · money conservation · multi-bucket routing).
  await import('../store/windfallSplit.test');

  // §3.3.1 — the debt-paid-off celebration read layer (vanquished archive · finale detector · stat-trio).
  await import('../store/celebrationSelectors.test');

  // §3.3.2 — the portfolio milestone-cross capture at rollover (crossing · 100%-excluded · dedup).
  await import('../store/milestoneCross.test');

  // §3.3.3 — the premium Guardian proof-of-work read (held streak · cumulative-to-debt · gating).
  await import('../store/proofOfWork.test');

  // §3.5.1 — the iOS widget App-Group bridge (snapshot builder + startWidgetSync mirror/idempotency).
  await import('../widget/widgetSync.test');

  // 3.5.0.1 — the tutorial/demo SANDBOX store: frozen-clock determinism + the three isolation
  // guarantees (no durable write · no real-store disturbance · shipped logic runs verbatim). ASYNC →
  // default-exports its runner (it awaits the persistence bootstrap + the autosave debounce).
  await (await import('../store/sandboxStore.test')).default();

  // 3.5.0.3 — the scenario scripts: each named state READS as its name through the real Guardian
  // engine, the personal seed stands on the user's own numbers, and every build is deterministic.
  await import('../store/sandboxScenarios.test');

  // 3.5.0.4 — the scripted payday beats: absorb + release are produced by the REAL rollover, the
  // tutorial ceiling can cross the discovery gate, and the demo's day-one bound still cannot.
  await import('../store/sandboxBeats.test');

  // 3.5.0.7 — the e2e/QA harness seam: scenario selection + a READ-ONLY snapshot (no store actions,
  // so a tutorial e2e can't manufacture the state it then asserts on).
  await import('../store/sandboxHarness.test');

  // 3.5.1 — the tutorial invitation matrix: which audiences are offered which run. The v1.6-upgrade and
  // free→premium cases fail SILENTLY (nobody reports an offer they never got), so they're pinned here.
  await import('../store/tutorialSelectors.test');

  // 3.5.2 — the tutorial PATH: stepping bounds, interrupt-resume clamping, and the per-step
  // announcement (the step change is motion-only, so that string IS the signal for VoiceOver).
  await import('../store/tutorialPath.test');

  // 3.5.3.0 — the active-store rewire's invariant: a write aimed at a sandbox must never move the real
  // store. The failure mode is a tutorial silently editing real money, so it gets an explicit assert.
  await import('../store/storeContext.test');

  // 3.5.5.3 — a coach-mark is offered ONCE, and every failure here is silent: nobody reports a hint
  // they never saw, or one that came back. The two session fences (walkthrough, demo) are pinned too —
  // the demo one also keeps a sandbox from writing to the real store.
  await import('../store/coachMarks.test');

  // 3.5.3.3.1 — the spotlight's scroll geometry. Every wrong answer here is silent (a beat describing
  // something hidden behind its own dock), so it's pinned away from React.
  await import('../hooks/spotlight.test');

  // 3.5.3.9 — THE ARC INVARIANT: every beat's seeded state renders the subject that beat
  // coaches. Replaces the runtime degraded path, which answered this at runtime and oscillated doing it.
  await import('../store/guardianSubjects.test');

  // 3.5.4.1 — a demo is a bounded run to every fence, and `end()` cannot publish a split frame.
  await import('../store/demoSession.test');

  // 3.5.4.9 — the funnel seam sends nothing without a sink, and honours opt-out at the choke point.
  await import('../analytics/funnel.test');

  // (RS.6+ app-layer suites are appended here as they land.)

  console.log('\n✅ App-layer regression tests: ALL PASSED.\n');
}

main().catch((err) => {
  console.error('\n❌ App-layer regression run failed:', err);
  process.exit(1);
});
