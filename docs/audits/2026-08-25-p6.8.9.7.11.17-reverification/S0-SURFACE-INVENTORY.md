# S0 surface inventory — which pass actually swept which file

> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s0-coverage` writes it from
> `scripts/s0-surface-coverage.json`. [D69] needs *"first look"* to be a lookup rather than an
> auditor's claim; this is the lookup.
>
> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**
> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being
> measured wrong — see the docstring in `scripts/s0-surface-coverage.ts`.

**58 files on the S0 surface · 38 swept · 20 unswept.**

`p1`–`p4` an S0 pass · `g4` the guard inventory · `r17` the earlier `.11.17` round · `never` / `unknown` unswept.

| file | swept by |
|---|---|
| `apps/rn/src/data/migrationAudit/audit.test.ts` | p1 · p3 |
| `apps/rn/src/data/migrationAudit/corpus.ts` | p1 · p2 · p3 |
| `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts` | ⛔ **never** |
| `apps/rn/src/data/migrationAudit/doors.ts` | p1 · p3 |
| `apps/rn/src/data/migrationAudit/hostile.test.ts` | p1 · p3 |
| `apps/rn/src/data/migrationAudit/interruption.test.ts` | ⛔ **never** |
| `apps/rn/src/data/migrationAudit/invariants.ts` | p1 · p3 |
| `apps/rn/src/data/migrationAudit/run.ts` | ⛔ **never** |
| `scripts/apostrophe-baseline.json` | p4 |
| `scripts/begin-gate-run.ts` | ⛔ **never** |
| `scripts/check-a11y-collapse.ts` | p4 |
| `scripts/check-apostrophes.ts` | p3 |
| `scripts/check-audit-closure.ts` | p2 · p3 · p4 |
| `scripts/check-comment-convention.ts` | r17 |
| `scripts/check-committed-secrets.ts` | p4 |
| `scripts/check-contrast.ts` | p4 |
| `scripts/check-copy-owners.ts` | p3 |
| `scripts/check-destructive-writes.ts` | p1 · p3 |
| `scripts/check-finding-guards.ts` | ⛔ **never** |
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
| `scripts/check-type-scale.ts` | p4 |
| `scripts/check-webkit-flex-controls.ts` | r17 |
| `scripts/collect-lane-diagnostics.mjs` | ⛔ **never** |
| `scripts/compare-ios-screenshots.mjs` | ⛔ **never** |
| `scripts/conform-app-preview.sh` | ⛔ **never** |
| `scripts/coverage-model.ts` | p1 |
| `scripts/coverage-split.ts` | p1 |
| `scripts/duplicate-copy-baseline.json` | p4 |
| `scripts/e2e-fresh-rn.cjs` | ⛔ **never** |
| `scripts/e2e-fresh.cjs` | ⛔ **never** |
| `scripts/finding-guards.json` | ⛔ **never** |
| `scripts/gateSources.ts` | p2 · p3 |
| `scripts/lib/stripCode.ts` | p2 · p3 |
| `scripts/maestro-results.mjs` | ⛔ **never** |
| `scripts/make-cutover-backups.ts` | ⛔ **never** |
| `scripts/preflight-native-lane.ts` | p4 |
| `scripts/preflight-xcuitest-target.ts` | ⛔ **never** |
| `scripts/run-gates.ts` | p1 · p3 |
| `scripts/s0-surface-coverage.ts` | ⛔ **never** |
| `scripts/secrets-exemptions.json` | ⛔ **never** |
| `scripts/stamp-coverage.ts` | p2 |
| `scripts/strings-inventory.ts` | p4 · r17 |
| `scripts/surface-inventory.ts` | ⛔ **never** |
| `scripts/test-conform-assertions.sh` | ⛔ **never** |
| `scripts/test-gate-plants.ts` | ⛔ **never** |
| `scripts/test-stamp-coverage.ts` | ⛔ **never** |
| `scripts/webkit-flex-controls-baseline.json` | p4 |
| `scripts/write-gate-status.ts` | p4 |

## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]

- `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts`
- `apps/rn/src/data/migrationAudit/interruption.test.ts`
- `apps/rn/src/data/migrationAudit/run.ts`
- `scripts/begin-gate-run.ts`
- `scripts/check-finding-guards.ts`
- `scripts/collect-lane-diagnostics.mjs`
- `scripts/compare-ios-screenshots.mjs`
- `scripts/conform-app-preview.sh`
- `scripts/e2e-fresh-rn.cjs`
- `scripts/e2e-fresh.cjs`
- `scripts/finding-guards.json`
- `scripts/maestro-results.mjs`
- `scripts/make-cutover-backups.ts`
- `scripts/preflight-xcuitest-target.ts`
- `scripts/s0-surface-coverage.ts`
- `scripts/secrets-exemptions.json`
- `scripts/surface-inventory.ts`
- `scripts/test-conform-assertions.sh`
- `scripts/test-gate-plants.ts`
- `scripts/test-stamp-coverage.ts`

