# S0 surface inventory — which pass actually swept which file

> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s0-coverage` writes it from
> `scripts/surface-coverage.s0.json`. [D69] needs *"first look"* to be a lookup rather than an
> auditor's claim; this is the lookup.
>
> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**
> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being
> measured wrong — see the docstring in `scripts/surface-coverage.ts`.

**91 files on the S0 surface · 43 swept · 48 unswept.**

`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.

| file | swept by |
|---|---|
| `apps/rn/src/data/migrationAudit/audit.test.ts` | p1 · p3 · s1p1 |
| `apps/rn/src/data/migrationAudit/corpus.ts` | p1 · p2 · p3 |
| `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts` | ⛔ **never** |
| `apps/rn/src/data/migrationAudit/doors.ts` | p1 · p3 |
| `apps/rn/src/data/migrationAudit/hostile.test.ts` | p1 · p3 · s1p1 |
| `apps/rn/src/data/migrationAudit/interruption.test.ts` | ⛔ **never** |
| `apps/rn/src/data/migrationAudit/invariants.ts` | p1 · p3 · s1p1 |
| `apps/rn/src/data/migrationAudit/run.ts` | ⛔ **never** |
| `apps/rn/src/testing/runAppTests.ts` | ⛔ **never** |
| `apps/rn/src/testing/runScenarioTests.ts` | ⛔ **never** |
| `apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts` | ⛔ **never** |
| `apps/rn/tests/shots/add-chooser.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/demo-beats.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/explore-demo.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/floor-impact.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/guardian-spacing.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/misfiled-hint.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/money-sections.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/p6.8-a11y.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/p6.8-matrix.shot.ts` | ⛔ **never** |
| `apps/rn/tests/shots/phase35-themes.shot.ts` | ⛔ **never** |
| `packages/core/testing/runRegressionTests.ts` | ⛔ **never** |
| `packages/core/testing/seedPlannerState.ts` | ⛔ **never** |
| `packages/core/testing/simSmokeSeed.ts` | ⛔ **never** |
| `packages/core/testing/testAbuseScenarios.ts` | ⛔ **never** |
| `packages/core/testing/testAprMath.ts` | ⛔ **never** |
| `packages/core/testing/testDebtMathRegression.ts` | ⛔ **never** |
| `packages/core/testing/testDemoModeSeed.ts` | ⛔ **never** |
| `packages/core/testing/testEngineFuzz.ts` | ⛔ **never** |
| `packages/core/testing/testFinalLaunchRegression.ts` | ⛔ **never** |
| `packages/core/testing/testForecastRegression.ts` | ⛔ **never** |
| `packages/core/testing/testFullAppRegression.ts` | ⛔ **never** |
| `packages/core/testing/testMultiCycleTimelineRegression.ts` | ⛔ **never** |
| `packages/core/testing/testPayCycleHistoryRegression.ts` | ⛔ **never** |
| `packages/core/testing/testPlannerStateHardening.ts` | ⛔ **never** |
| `packages/core/testing/testRecommendedActionsRegression.ts` | ⛔ **never** |
| `packages/core/testing/testSafeStorage.ts` | ⛔ **never** |
| `packages/core/testing/testStressScenarios.ts` | ⛔ **never** |
| `packages/core/testing/testSubscriptionGating.ts` | ⛔ **never** |
| `packages/core/testing/testTimelineRegression.ts` | ⛔ **never** |
| `packages/core/testing/testV11Regression.ts` | ⛔ **never** |
| `scripts/apostrophe-baseline.json` | p4 |
| `scripts/begin-gate-run.ts` | never · s1p1 |
| `scripts/check-a11y-collapse.ts` | p4 |
| `scripts/check-apostrophes.ts` | p3 |
| `scripts/check-audit-closure.ts` | p2 · p3 · p4 · s1p1 |
| `scripts/check-comment-convention.ts` | r17 |
| `scripts/check-committed-secrets.ts` | p4 · s1p1 |
| `scripts/check-contrast.ts` | p4 |
| `scripts/check-copy-owners.ts` | p3 |
| `scripts/check-destructive-writes.ts` | p1 · p3 |
| `scripts/check-finding-guards.ts` | never · s1p1 |
| `scripts/check-gate-freshness.ts` | p4 |
| `scripts/check-glossary.ts` | p3 |
| `scripts/check-icon-glyphs.ts` | r17 |
| `scripts/check-local-dates.ts` | p3 · r17 |
| `scripts/check-maestro-selectors.ts` | p2 · p3 |
| `scripts/check-money-format.ts` | p3 |
| `scripts/check-month-arithmetic.ts` | p1 · p2 · p3 |
| `scripts/check-native-a11y-props.ts` | p3 |
| `scripts/check-press-opacity.ts` | p3 · r17 |
| `scripts/check-rn-style-divergence.ts` | r17 |
| `scripts/check-sandbox-writes.ts` | p1 · p3 |
| `scripts/check-type-scale.ts` | p4 · s1p1 |
| `scripts/check-webkit-flex-controls.ts` | r17 |
| `scripts/collect-lane-diagnostics.mjs` | ⛔ **never** |
| `scripts/compare-ios-screenshots.mjs` | ⛔ **never** |
| `scripts/conform-app-preview.sh` | ⛔ **never** |
| `scripts/coverage-model.ts` | p1 |
| `scripts/coverage-split.ts` | p1 |
| `scripts/duplicate-copy-baseline.json` | p4 |
| `scripts/e2e-fresh-rn.cjs` | ⛔ **never** |
| `scripts/e2e-fresh.cjs` | ⛔ **never** |
| `scripts/finding-guards.json` | never · s1p1 |
| `scripts/gateSources.ts` | p2 · p3 · s1p1 |
| `scripts/lib/stripCode.ts` | p2 · p3 |
| `scripts/maestro-results.mjs` | ⛔ **never** |
| `scripts/make-cutover-backups.ts` | ⛔ **never** |
| `scripts/preflight-native-lane.ts` | p4 · s1p1 |
| `scripts/preflight-xcuitest-target.ts` | ⛔ **never** |
| `scripts/run-gates.ts` | p1 · p3 · s1p1 |
| `scripts/secrets-exemptions.json` | ⛔ **never** |
| `scripts/stamp-coverage.ts` | p2 |
| `scripts/strings-inventory.ts` | p4 · r17 · s1p1 |
| `scripts/surface-coverage.ts` | never · s1p1 |
| `scripts/surface-inventory.ts` | ⛔ **never** |
| `scripts/test-conform-assertions.sh` | ⛔ **never** |
| `scripts/test-gate-plants.ts` | never · s1p1 |
| `scripts/test-stamp-coverage.ts` | ⛔ **never** |
| `scripts/webkit-flex-controls-baseline.json` | p4 |
| `scripts/write-gate-status.ts` | p4 · s1p1 |

## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]

- `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts`
- `apps/rn/src/data/migrationAudit/interruption.test.ts`
- `apps/rn/src/data/migrationAudit/run.ts`
- `apps/rn/src/testing/runAppTests.ts`
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
- `apps/rn/tests/shots/p6.8-matrix.shot.ts`
- `apps/rn/tests/shots/phase35-themes.shot.ts`
- `packages/core/testing/runRegressionTests.ts`
- `packages/core/testing/seedPlannerState.ts`
- `packages/core/testing/simSmokeSeed.ts`
- `packages/core/testing/testAbuseScenarios.ts`
- `packages/core/testing/testAprMath.ts`
- `packages/core/testing/testDebtMathRegression.ts`
- `packages/core/testing/testDemoModeSeed.ts`
- `packages/core/testing/testEngineFuzz.ts`
- `packages/core/testing/testFinalLaunchRegression.ts`
- `packages/core/testing/testForecastRegression.ts`
- `packages/core/testing/testFullAppRegression.ts`
- `packages/core/testing/testMultiCycleTimelineRegression.ts`
- `packages/core/testing/testPayCycleHistoryRegression.ts`
- `packages/core/testing/testPlannerStateHardening.ts`
- `packages/core/testing/testRecommendedActionsRegression.ts`
- `packages/core/testing/testSafeStorage.ts`
- `packages/core/testing/testStressScenarios.ts`
- `packages/core/testing/testSubscriptionGating.ts`
- `packages/core/testing/testTimelineRegression.ts`
- `packages/core/testing/testV11Regression.ts`
- `scripts/collect-lane-diagnostics.mjs`
- `scripts/compare-ios-screenshots.mjs`
- `scripts/conform-app-preview.sh`
- `scripts/e2e-fresh-rn.cjs`
- `scripts/e2e-fresh.cjs`
- `scripts/maestro-results.mjs`
- `scripts/make-cutover-backups.ts`
- `scripts/preflight-xcuitest-target.ts`
- `scripts/secrets-exemptions.json`
- `scripts/surface-inventory.ts`
- `scripts/test-conform-assertions.sh`
- `scripts/test-stamp-coverage.ts`

