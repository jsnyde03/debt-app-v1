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

  // 3.7.B.1 — the paid-required-row re-add, on BOTH paid-state shapes. A pre-[D2] debt carrying only
  // `isPaidThisCycle` was dropped by the allocator and not re-added, so the row vanished from Today.
  await import('../store/planSelectors.test');

  // 3.7.B.2 (F10.1) — Today's time-aware greeting: every band boundary + the name normalisation.
  await import('../store/greeting.test');

  // MF.4 (audit #5) — the debt-free projection runs on the steady-state (holdback-stripped) deploy.
  await import('../store/steadyStateProjection.test');

  // §2.7.4 — the in-window BNPL cadence scaling flows through the allocation + the lookahead timeline.
  await import('../store/bnplCadence.test');

  // §2.9 — the Can-I-Afford-This? selectors (verdict + honest impact + save-for-it options).
  await import('../store/affordability.test');

  // VIS-6 — the Windfall Autopilot split (marginal diff · money conservation · multi-bucket routing).
  await import('../store/windfallSplit.test');

  // 3.8 — the expense reserve above the engine: the cycle-keyed contribution, the hero's "set aside right
  // now" figure, the capped offer [A3.6], the rollover fold, and the category-list memberships.
  await import('../store/expenseReserve.test');

  // §3.3.1 — the debt-paid-off celebration read layer (paid off archive · finale detector · stat-trio).
  await import('../store/celebrationSelectors.test');

  // §3.3.2 — the portfolio milestone-cross capture at rollover (crossing · 100%-excluded · dedup).
  await import('../store/milestoneCross.test');

  // §3.3.3 — the premium Guardian proof-of-work read (held streak · cumulative-to-debt · gating).
  await import('../store/proofOfWork.test');

  // 3.7.A5 — which KIND of premium is active, incl. the "RevenueCat hasn't answered" third state that
  // four surfaces used to render as "subscription". Nothing covered the Lifetime row before this.
  await import('../premium/premiumKind.test');

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
  await import('../store/looksLikeDebt.test');

  // 5.1a — the WebKit localStorage decode, the half of the v1.6 migration bridge that is provable off
  // a device. Every failure here is silent AND irreversible: a wrong encoding sniff migrates mojibake
  // over someone's real portfolio, and the one place it would surface is a real upgraded phone.
  await import('../data/legacyBridge/webkitLocalStorage.test');

  // 5.1b.2 — finding those databases in our own container. The caps are the point: a walk that stops
  // quietly looks exactly like a container with nothing in it, and "nothing there" is the answer that
  // makes the bridge skip a real user's data.
  await import('../data/legacyBridge/findLegacyStores.test');

  // 5.2 — the v1.6 → v1.7 key mapping. The `unknown` assertion is the load-bearing one: a real v1.6 key
  // this mapper has never heard of is data about to be silently dropped during someone's upgrade.
  await import('../data/legacyBridge/mapLegacyStore.test');

  // 5.1b/5.2 — the whole read path against a REAL v1.6 container captured from an iOS 26.2 simulator.
  // ⛔ It pins the WAL defect: WebKit had not checkpointed, so the main .sqlite3 holds no ItemTable at
  // all and copying it alone reads ZERO keys. Every synthetic test passed while that was true.
  await import('../data/legacyBridge/realContainer.test');

  // 5.3 — the bridge. Idempotence is STRUCTURAL (it runs only when RN storage is empty), and the
  // riskiest assertion is that a TRUNCATED search is never mistaken for a fresh install — that
  // confusion is how a migration silently skips someone's whole portfolio.
  await (await import('../data/legacyBridge/migrateFromLegacy.test')).default();

  // 5.8.1 — the backup FILE envelope. The pre-5.8 importer accepted ANY JSON object and wrote it over
  // the user's portfolio; these assertions are the refusal. ⚠️ This surface had ZERO RN coverage — the
  // only backup test in the repo is on the legacy tree, which 5.5.1 deletes.
  await import('../data/backup.test');

  // 5.8.2 — format detection. All three recognised formats are self-identifying; everything else is
  // refused. ⛔ The asymmetry is the design: a false negative annoys, a false positive destroys.
  await import('../data/detectBackupFormat.test');

  // P6.3.3.2 — the CLOUD envelope + codec. ⛔ This is the one backup door with no human in it: no file to
  // open, no paste to eyeball, no picker to cancel. The foreign-blob assertion is written against a
  // payload that WOULD be valid, because the first version passed with the marker check deleted.
  await import('../data/cloudBackup.test');

  // P6.5 — the Sentry breadcrumb scrub. ⛔ Sentry's touch integration records accessibility labels, and
  // Debt builds those out of the user's balances — so this is the difference between [D41] being true and
  // a crash on the Money tab shipping someone's real money to a third party.
  await import('../utils/scrubBreadcrumb.test');

  // P6.3.3.4 — the cloud service, against a fake provider. ⛔ The clobber guard is the subject: an
  // automatic backup that fires on a not-yet-onboarded or just-reset store overwrites the good remote
  // with nothing, and the user finds out on the day they needed it.
  await (await import('../storage/cloudBackup/service.test')).default();

  // 5.8.3 — the import router + the v1.6 file adapter. ⭐ The headline is that a REAL v1.6 backup's income
  // and dates now LAND; the pre-5.8 path blanked them while looking like it had worked.
  await import('../data/readBackup.test');

  // 5.10 — the adversarial migration audit. 482 generated cases × 2 real doors × 8 invariants, plus the
  // differential oracle. ⛔ Gates: a regression here is data loss on upgrade.
  await (await import('../data/migrationAudit/audit.test')).default();

  // 5.10.4 — interruption + the quarantine's last copy. The bridge's structural-idempotence claim had
  // never been tested against an actual interruption.
  await (await import('../data/migrationAudit/interruption.test')).default();

  // 5.10.5 — hostile v1.6 states the combinatorial generator cannot produce (multi-field interactions,
  // structurally different plausible users, v1.6-only historical shapes). Agent-GENERATED inputs, judged
  // by the same invariants — an input the harness judges cannot be wrong the expensive way.
  await (await import('../data/migrationAudit/hostile.test')).default();

  // 5.11 — the cutover backup files 🎯 measures the device session against. A typo in one turns a real
  // migration failure into "the fixture was wrong", so the figures on the tick-list are asserted here.
  await (await import('../data/migrationAudit/cutoverFiles.test')).default();

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

  // T3.4 — the pay-cycle day fields are never guessed at: no date and a stated reason, never a
  // biweekly-derived date the user did not choose.
  await import('../store/paycheckForm.test');

  // T3B (L5-11) — the onboarding finish line is a ladder of real facts, never a generic reassurance.
  await import('../store/onboardingFinish.test');

  // T3B (L5-12) — the paywall leads with the reader's own money, and cannot re-introduce the two claims
  // this screen already retired (L1-2 autopilot, L1-3 the unconditional cushion hold).
  await import('../store/paywallLead.test');
  await import('../premium/introOffer.test');
  await import('../store/glossary.test');

  // (RS.6+ app-layer suites are appended here as they land.)

  console.log('\n✅ App-layer regression tests: ALL PASSED.\n');
}

main().catch((err) => {
  console.error('\n❌ App-layer regression run failed:', err);
  process.exit(1);
});
