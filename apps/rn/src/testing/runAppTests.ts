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

  // P6.8.9.7.11.12.10 (audit C-D) — the Progress hero's journey line. The whole matrix, because the ONE
  // shape where the defect was invisible (nothing paid yet, so the two totals agree) is also the only
  // shape anyone had pictured.
  await import('../store/journeySelectors.test');

  // P6.8.7g.5 (audit C7 / [D59]) — the strategy comparison. The cases are the MEASURED portfolios from
  // the evidence folder, including the one where both strategies produce exactly the same plan.
  await import('../components/payoff/compareStrategies.test');

  // P6.8.7g.4 (audit P1-3) — the payoff chart's x-domain. Half the cases pin properties the pre-clamp
  // expression got RIGHT: the lean cone's reach, and the never-pays-off fallback.
  await import('../components/payoff/trajectoryDomain.test');

  // S1.11.3.4 (pass-3 m6) — where the simulated extra goes. Extracted out of `WhatIfControls.tsx` to be
  // testable at all: the rule was a closure in a file the runner cannot load, so its only guard was a
  // token proving the sentence exists.
  await import('../components/payoff/whereText.test');

  // P6.8.9.7.11.11 (audit C-E) — the chart's month step. The clamp existed and was tested while this
  // called `setMonth`, so these pin the LABEL a user reads, not the helper's return value.
  await (await import('../components/payoff/monthLabels.test')).default();

  // P6.8.9.7.11.12 (audit A-J2-2) — the repairs card's words. A recovery and a loss are opposite events
  // and the card spoke the loss sentence over both, while nothing asserted a single string it rendered.
  await (await import('../components/plan/dataRepairsCopy.test')).default();

  // P6.8.9.7.11.14.1 (audit P1-4) — the name-list truncation that replaced the shortfall card's bare
  // `.join(' · ')`. The `max + 1` boundary is the one that matters: truncating there hides a name and
  // shows "+1 more" in its place, which is longer.
  await import('../utils/format.test');

  // P6.8.7g.2 (audit C8) — debt id minting. The batch case is new: `newDebtId` derives uniqueness from
  // the ids that exist, so a loop over an unchanged list hands out the same id every time.
  await import('../store/debtIds.test');

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

  // P6.8.7e.1 [B2/M2-5] — the payoff crossing. ⛔ The beat and the finale were wired to the premium
  // estimator NOTICING a payoff rather than to the payoff, so a free user could clear every debt they
  // owned and see neither. The over-firing guard matters as much as the fix: a finale on every batch
  // re-verify would turn a once-ever moment into noise.
  await (await import('../store/payoffCelebration.test')).default();

  // §3.3.3 — the premium Guardian proof-of-work read (held streak · cumulative-to-debt · gating).
  await import('../store/proofOfWork.test');

  // S1.10.6.9 [G-1…G-5] — the Guardian's five reads of a repairable balance. Every case is a PAIR: the
  // damaged store against a truth control, because a repaired `0` and a real `0` are the same number and
  // the store carries the only thing that separates them. G-1 is the one that inverted the app's own
  // honesty scorecard from its worst record to a perfect one.
  await import('../store/guardianTrust.test');

  /**
   * ⛔ **S1.12.5.1 [pass-5 D5-4] — A UNIT'S OWN SUITE RUNS BEFORE THE CROSS-SURFACE SWEEP THAT COVERS IT.**
   *
   * `requiredPlanTrust.test` walks EVERY surface that states the required plan, `paywallLead` among them.
   * This runner is sequential `await import()` and an assert throws, so restoring `paywallLead.ts`'s own
   * defect used to red the sweep at file 131 and `paywallLead.test` at file 295 **never ran** — its
   * registered proof (`S1P3-C5-PAYWALL`) redded for the sweep's reason and was unattributable. Measured
   * the first time that proof was ever executed.
   *
   * ⚠️ **Nothing is weakened: the sweep still runs and still asserts every surface.** Only the order moved,
   * and it moved to the general rule — **assert the unit before the sweep built on top of it**, so a
   * failure names the narrowest thing that broke.
   */
  // S1.12.5.3 [pass-5 A5-2 · B5-4] - the money formatters' first test. The Number.isFinite guard
  // with the highest fan-in in the tree survived its own un-fix in all four gates that run.
  await import('../utils/moneyFormatters.test');

  await import('../store/paywallLead.test');

  // S1.11.4.2 [pass-4 C4-7] — the SIBLING claim, asserted over its surfaces as a class rather than at the
  // one mount a finding named. `D3-2` wired `'required-plan'` into the Lock Screen and Siri and left the
  // in-app card saying "the spare $1,800" against a true $300; this walks every surface that states it.
  await import('../store/requiredPlanTrust.test');

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

  // [R4] …and the half that rewire never had: the real store must REFUSE a write while a sandbox is
  // mounted, not report one after it lands. The reporting version shipped, and a user's real plan was
  // edited from inside the demo before Sentry described it.
  await import('../store/realWriteGuard.test');

  // 3.5.5.3 — a coach-mark is offered ONCE, and every failure here is silent: nobody reports a hint
  // they never saw, or one that came back. The two session fences (walkthrough, demo) are pinned too —
  // the demo one also keeps a sandbox from writing to the real store.
  await import('../store/coachMarks.test');
  await import('../store/looksLikeDebt.test');

  // 5.1a — the WebKit localStorage decode, the half of the v1.6 migration bridge that is provable off
  // a device. Every failure here is silent AND irreversible: a wrong encoding sniff migrates mojibake
  // over someone's real portfolio, and the one place it would surface is a real upgraded phone.
  await import('../data/legacyBridge/webkitLocalStorage.test');

  // P6.8.9.7.11.13.7 (audit J1-5) — the CALL SITE of that decode: which candidate is picked, and whose
  // undecodable rows become the user-facing loss. It lived in `readLegacyStores.ts`, which pulls
  // `expo-file-system`/`expo-sqlite` and cannot be loaded here, so reverting it left every suite green.
  await (await import('../data/legacyBridge/decodeCandidates.test')).default();

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
  // ⛔ S1.10.6.4 [B4] — the first unit test either storage adapter has ever had.
  await (await import('../storage/createAdapter.test')).default();

  // P6.8.7d.3 [M3-5] — what the iCloud sheet SAYS about each outcome. ⛔ The sheet's `ready` branch is
  // unreachable to Playwright (the web provider is the unavailable stub), so this pure mapping is the only
  // testable part of the screen — and "the computed diagnosis is dropped at the last layer" is exactly the
  // class that hid there through thirteen lenses.
  await (await import('../data/cloudBackupMessages.test')).default();

  // 5.8.3 — the import router + the v1.6 file adapter. ⭐ The headline is that a REAL v1.6 backup's income
  // and dates now LAND; the pre-5.8 path blanked them while looking like it had worked.
  await import('../data/readBackup.test');

  // P6.8.9.7.11.18 · S1.1 — `readMoney`'s classification table, through `runMigrations`. ⛔ Gates round-4
  // blocker #1: `Number('')` is `0`, so a blank balance was stamped `recovered` and Money congratulated
  // over debts still owed. Every prior test of this class picked `null`, the member that worked.
  await (await import('../data/migrations.test')).default();

  // P6.8.9.7.11.18 · S1.5 — the ONE owner of "may the app claim this money is cleared". ⛔ Gates pass-1
  // blocker B1: the whole app had two trust guards, both in money.tsx, while Today and Progress made the
  // same claim with none. Asserts the three screens AGREE on one store, in both directions.
  await (await import('../store/trustSelectors.test')).default();

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
  // ⚠️ `paywallLead.test` now runs EARLIER, above `requiredPlanTrust.test` — see the note there (D5-4).
  await import('../premium/introOffer.test');
  await import('../store/glossary.test');

  // (RS.6+ app-layer suites are appended here as they land.)

  console.log('\n✅ App-layer regression tests: ALL PASSED.\n');
}

main().catch((err) => {
  console.error('\n❌ App-layer regression run failed:', err);
  process.exit(1);
});
