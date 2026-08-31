# S0 surface inventory — which pass actually swept which file

> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s0-coverage` writes it from
> `scripts/surface-coverage.s0.json`. [D69] needs *"first look"* to be a lookup rather than an
> auditor's claim; this is the lookup.
>
> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**
> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being
> measured wrong — see the docstring in `scripts/surface-coverage.ts`.

**127 files on the S0 surface · 75 swept · 52 unswept.**

`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.

| file | swept by |
|---|---|
| `apps/rn/app.json` | ⛔ **partial** |
| `apps/rn/eslint.config.mjs` | ⛔ **partial** |
| `apps/rn/playwright.config.ts` | s1p2 |
| `apps/rn/playwright.embed.config.ts` | s1p5 |
| `apps/rn/playwright.shots.config.ts` | s1p5 |
| `apps/rn/scripts/copy-canvaskit.mjs` | s1p5 |
| `apps/rn/src/data/migrationAudit/audit.test.ts` | p1 · p3 · s1p1 · s1p2 · s1p4 |
| `apps/rn/src/data/migrationAudit/corpus.ts` | p1 · p2 · p3 |
| `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts` | ⛔ **partial** |
| `apps/rn/src/data/migrationAudit/doors.ts` | p1 · p3 |
| `apps/rn/src/data/migrationAudit/hostile.test.ts` | p1 · p3 · s1p1 · s1p2 · s1p4 |
| `apps/rn/src/data/migrationAudit/interruption.test.ts` | ⛔ **partial** |
| `apps/rn/src/data/migrationAudit/invariants.ts` | p1 · p3 · s1p1 · s1p2 · s1p5 |
| `apps/rn/src/data/migrationAudit/run.ts` | s1p5 |
| `apps/rn/src/testing/runAppTests.ts` | s1p2 · s1p4 · s1p5 |
| `apps/rn/src/testing/runScenarioTests.ts` | ⛔ **partial** |
| `apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/add-chooser.shot.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/demo-beats.shot.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/explore-demo.shot.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/floor-impact.shot.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/guardian-spacing.shot.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/misfiled-hint.shot.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/money-sections.shot.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/p6.8-a11y.shot.ts` | ⛔ **partial** |
| `apps/rn/tests/shots/p6.8-matrix.shot.ts` | s1p2 |
| `apps/rn/tests/shots/phase35-themes.shot.ts` | ⛔ **partial** |
| `packages/core/testing/assertNumeric.ts` | ⛔ **never** |
| `packages/core/testing/runRegressionTests.ts` | s1p2 |
| `packages/core/testing/seedPlannerState.ts` | ⛔ **partial** |
| `packages/core/testing/simSmokeSeed.ts` | ⛔ **partial** |
| `packages/core/testing/testAbuseScenarios.ts` | ⛔ **partial** |
| `packages/core/testing/testAprMath.ts` | ⛔ **partial** |
| `packages/core/testing/testCadenceIdentity.ts` | ⛔ **never** |
| `packages/core/testing/testDebtMathRegression.ts` | ⛔ **partial** |
| `packages/core/testing/testDemoModeSeed.ts` | ⛔ **partial** |
| `packages/core/testing/testEngineFuzz.ts` | s1p5 |
| `packages/core/testing/testFinalLaunchRegression.ts` | ⛔ **partial** |
| `packages/core/testing/testForecastRegression.ts` | ⛔ **partial** |
| `packages/core/testing/testFullAppRegression.ts` | ⛔ **partial** |
| `packages/core/testing/testMultiCycleTimelineRegression.ts` | ⛔ **partial** |
| `packages/core/testing/testPayCycleHistoryRegression.ts` | never · s1p4 |
| `packages/core/testing/testPlannerStateHardening.ts` | ⛔ **partial** |
| `packages/core/testing/testRecommendedActionsRegression.ts` | ⛔ **partial** |
| `packages/core/testing/testSafeStorage.ts` | ⛔ **partial** |
| `packages/core/testing/testStressScenarios.ts` | ⛔ **partial** |
| `packages/core/testing/testSubscriptionGating.ts` | ⛔ **partial** |
| `packages/core/testing/testTimelineRegression.ts` | ⛔ **partial** |
| `packages/core/testing/testV11Regression.ts` | ⛔ **partial** |
| `scripts/apostrophe-baseline.json` | p4 |
| `scripts/audit-route.ts` | s1p4 · s1p5 |
| `scripts/audit-sublanes.ts` | ⛔ **never** |
| `scripts/begin-gate-run.ts` | s1p1 · s1p2 |
| `scripts/check-a11y-collapse.ts` | p4 |
| `scripts/check-apostrophes.ts` | p3 · partial |
| `scripts/check-audit-closure.ts` | p2 · p3 · p4 · s1p1 · s1p2 · partial |
| `scripts/check-cap-literals.ts` | s1p5 |
| `scripts/check-ci-chain.ts` | s1p5 |
| `scripts/check-comment-convention.ts` | r17 |
| `scripts/check-committed-secrets.ts` | p4 · s1p1 · s1p2 · partial |
| `scripts/check-conflict-markers.ts` | ⛔ **never** |
| `scripts/check-contrast.ts` | p4 |
| `scripts/check-control-chars.ts` | never · s1p4 |
| `scripts/check-copy-owners.ts` | p3 · partial |
| `scripts/check-destructive-writes.ts` | p1 · p3 |
| `scripts/check-finding-guards.ts` | s1p1 · s1p2 · s1p4 · s1p5 |
| `scripts/check-fixture-dates.ts` | ⛔ **never** |
| `scripts/check-gate-freshness.ts` | p4 |
| `scripts/check-gate-sources.ts` | s1p4 · s1p5 |
| `scripts/check-glossary.ts` | p3 · partial |
| `scripts/check-icon-glyphs.ts` | r17 |
| `scripts/check-local-dates.ts` | p3 · r17 · partial |
| `scripts/check-maestro-selectors.ts` | p2 · p3 |
| `scripts/check-money-format.ts` | p3 · partial |
| `scripts/check-month-arithmetic.ts` | p1 · p2 · p3 · partial |
| `scripts/check-native-a11y-props.ts` | p3 · partial |
| `scripts/check-pass-coverage.ts` | ⛔ **never** |
| `scripts/check-press-opacity.ts` | p3 · r17 · partial |
| `scripts/check-restore-doors.ts` | s1p5 |
| `scripts/check-rn-style-divergence.ts` | r17 |
| `scripts/check-rounding.ts` | ⛔ **never** |
| `scripts/check-runner-completeness.ts` | ⛔ **never** |
| `scripts/check-sandbox-writes.ts` | p1 · p3 |
| `scripts/check-scan-floors.ts` | never · s1p4 |
| `scripts/check-trust-claims.ts` | s1p4 · s1p5 |
| `scripts/check-type-scale.ts` | p4 · s1p1 · s1p2 |
| `scripts/check-webkit-flex-controls.ts` | r17 · partial |
| `scripts/collect-lane-diagnostics.mjs` | ⛔ **partial** |
| `scripts/compare-ios-screenshots.mjs` | ⛔ **partial** |
| `scripts/conform-app-preview.sh` | ⛔ **partial** |
| `scripts/coverage-model.ts` | p1 |
| `scripts/coverage-split.ts` | p1 |
| `scripts/duplicate-copy-baseline.json` | p4 · s1p2 |
| `scripts/e2e-fresh-rn.cjs` | s1p5 |
| `scripts/e2e-fresh.cjs` | s1p5 |
| `scripts/finding-guards.json` | s1p1 · s1p2 · s1p5 |
| `scripts/gate-scan-floors.json` | s1p4 · s1p5 |
| `scripts/gateSources.ts` | p2 · p3 · s1p1 · s1p2 |
| `scripts/lib/anchor.ts` | s1p5 |
| `scripts/lib/guardBuckets.ts` | ⛔ **never** |
| `scripts/lib/importGraph.ts` | ⛔ **partial** |
| `scripts/lib/moneyClaim.ts` | ⛔ **never** |
| `scripts/lib/scanFloor.ts` | never · s1p4 |
| `scripts/lib/stripCode.ts` | p2 · p3 |
| `scripts/lib/stripMarkdown.ts` | never · s1p4 |
| `scripts/lib/verdict.ts` | s1p5 |
| `scripts/maestro-results.mjs` | ⛔ **partial** |
| `scripts/make-cutover-backups.ts` | s1p5 |
| `scripts/preflight-native-lane.ts` | p4 · s1p1 · s1p2 |
| `scripts/preflight-xcuitest-target.ts` | ⛔ **partial** |
| `scripts/prove-guards.ts` | s1p5 |
| `scripts/record-reads.ts` | ⛔ **never** |
| `scripts/run-gates.ts` | p1 · p3 · s1p1 · s1p2 · s1p4 · s1p5 |
| `scripts/secrets-exemptions.json` | s1p5 |
| `scripts/stamp-coverage.ts` | p2 |
| `scripts/strings-inventory.ts` | p4 · r17 · s1p1 · s1p2 · partial |
| `scripts/surface-coverage.ts` | s1p1 · s1p2 · s1p5 |
| `scripts/surface-inventory.ts` | ⛔ **partial** |
| `scripts/test-closure-stripper.ts` | never · s1p4 |
| `scripts/test-conform-assertions.sh` | ⛔ **partial** |
| `scripts/test-gate-plants.ts` | s1p1 · s1p2 · partial |
| `scripts/test-import-graph.ts` | ⛔ **partial** |
| `scripts/test-line-endings.ts` | never · s1p4 |
| `scripts/test-stamp-coverage.ts` | s1p5 |
| `scripts/test-strip-code.ts` | never · s1p4 |
| `scripts/webkit-flex-controls-baseline.json` | p4 |
| `scripts/write-gate-status.ts` | p4 · s1p1 · s1p2 |

## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]

- `apps/rn/app.json`
- `apps/rn/eslint.config.mjs`
- `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts`
- `apps/rn/src/data/migrationAudit/interruption.test.ts`
- `apps/rn/src/testing/runScenarioTests.ts`
- `apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts`
- `apps/rn/tests/shots/add-chooser.shot.ts`
- `apps/rn/tests/shots/demo-beats.shot.ts`
- `apps/rn/tests/shots/explore-demo.shot.ts`
- `apps/rn/tests/shots/floor-impact.shot.ts`
- `apps/rn/tests/shots/guardian-spacing.shot.ts`
- `apps/rn/tests/shots/misfiled-hint.shot.ts`
- `apps/rn/tests/shots/money-sections.shot.ts`
- `apps/rn/tests/shots/p6.8-a11y.shot.ts`
- `apps/rn/tests/shots/phase35-themes.shot.ts`
- `packages/core/testing/assertNumeric.ts`
- `packages/core/testing/seedPlannerState.ts`
- `packages/core/testing/simSmokeSeed.ts`
- `packages/core/testing/testAbuseScenarios.ts`
- `packages/core/testing/testAprMath.ts`
- `packages/core/testing/testCadenceIdentity.ts`
- `packages/core/testing/testDebtMathRegression.ts`
- `packages/core/testing/testDemoModeSeed.ts`
- `packages/core/testing/testFinalLaunchRegression.ts`
- `packages/core/testing/testForecastRegression.ts`
- `packages/core/testing/testFullAppRegression.ts`
- `packages/core/testing/testMultiCycleTimelineRegression.ts`
- `packages/core/testing/testPlannerStateHardening.ts`
- `packages/core/testing/testRecommendedActionsRegression.ts`
- `packages/core/testing/testSafeStorage.ts`
- `packages/core/testing/testStressScenarios.ts`
- `packages/core/testing/testSubscriptionGating.ts`
- `packages/core/testing/testTimelineRegression.ts`
- `packages/core/testing/testV11Regression.ts`
- `scripts/audit-sublanes.ts`
- `scripts/check-conflict-markers.ts`
- `scripts/check-fixture-dates.ts`
- `scripts/check-pass-coverage.ts`
- `scripts/check-rounding.ts`
- `scripts/check-runner-completeness.ts`
- `scripts/collect-lane-diagnostics.mjs`
- `scripts/compare-ios-screenshots.mjs`
- `scripts/conform-app-preview.sh`
- `scripts/lib/guardBuckets.ts`
- `scripts/lib/importGraph.ts`
- `scripts/lib/moneyClaim.ts`
- `scripts/maestro-results.mjs`
- `scripts/preflight-xcuitest-target.ts`
- `scripts/record-reads.ts`
- `scripts/surface-inventory.ts`
- `scripts/test-conform-assertions.sh`
- `scripts/test-import-graph.ts`

<!-- claims-sha256: b3ff545fb1049634 -->

