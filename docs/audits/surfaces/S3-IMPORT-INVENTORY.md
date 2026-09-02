# S3 surface inventory — backup · restore · import

> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s3-coverage` writes it from
> `scripts/surface-coverage.s3.json`. [D69] needs *"first look"* to be a lookup rather than an
> auditor's claim; this is the lookup.
>
> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**
> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being
> measured wrong — see the docstring in `scripts/surface-coverage.ts`.

**39 files on the S3 surface · 0 swept · 39 unswept.**

`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.

| file | swept by |
|---|---|
| `apps/rn/src/data/backup.test.ts` | ⛔ **never** |
| `apps/rn/src/data/backup.ts` | ⛔ **never** |
| `apps/rn/src/data/backupFile.ts` | ⛔ **never** |
| `apps/rn/src/data/backupFile.web.ts` | ⛔ **never** |
| `apps/rn/src/data/cloudBackup.test.ts` | ⛔ **never** |
| `apps/rn/src/data/cloudBackup.ts` | ⛔ **never** |
| `apps/rn/src/data/cloudBackupMessages.test.ts` | ⛔ **never** |
| `apps/rn/src/data/cloudBackupMessages.ts` | ⛔ **never** |
| `apps/rn/src/data/csvImportFile.ts` | ⛔ **never** |
| `apps/rn/src/data/csvImportFile.web.ts` | ⛔ **never** |
| `apps/rn/src/data/detectBackupFormat.test.ts` | ⛔ **never** |
| `apps/rn/src/data/detectBackupFormat.ts` | ⛔ **never** |
| `apps/rn/src/data/formatBackupTime.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/decodeCandidates.test.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/decodeCandidates.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/findLegacyStores.test.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/findLegacyStores.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/mapLegacyStore.test.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/mapLegacyStore.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/migrateFromLegacy.test.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/migrateFromLegacy.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/originalBalance.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/readLegacyStores.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/readLegacyStores.web.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/realContainer.test.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/report.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/webkitLocalStorage.test.ts` | ⛔ **never** |
| `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts` | ⛔ **never** |
| `apps/rn/src/data/readBackup.test.ts` | ⛔ **never** |
| `apps/rn/src/data/readBackup.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/backup.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/csv-import.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/data-recovery.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/delete-all-data.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/scan.spec.ts` | ⛔ **never** |
| `packages/core/imports/debtCsv.ts` | ⛔ **never** |
| `packages/core/imports/testDebtCsv.ts` | ⛔ **never** |
| `packages/core/scan/parseStatementText.ts` | ⛔ **never** |
| `packages/core/scan/testParseStatementText.ts` | ⛔ **never** |

## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]

- `apps/rn/src/data/backup.test.ts`
- `apps/rn/src/data/backup.ts`
- `apps/rn/src/data/backupFile.ts`
- `apps/rn/src/data/backupFile.web.ts`
- `apps/rn/src/data/cloudBackup.test.ts`
- `apps/rn/src/data/cloudBackup.ts`
- `apps/rn/src/data/cloudBackupMessages.test.ts`
- `apps/rn/src/data/cloudBackupMessages.ts`
- `apps/rn/src/data/csvImportFile.ts`
- `apps/rn/src/data/csvImportFile.web.ts`
- `apps/rn/src/data/detectBackupFormat.test.ts`
- `apps/rn/src/data/detectBackupFormat.ts`
- `apps/rn/src/data/formatBackupTime.ts`
- `apps/rn/src/data/legacyBridge/decodeCandidates.test.ts`
- `apps/rn/src/data/legacyBridge/decodeCandidates.ts`
- `apps/rn/src/data/legacyBridge/findLegacyStores.test.ts`
- `apps/rn/src/data/legacyBridge/findLegacyStores.ts`
- `apps/rn/src/data/legacyBridge/mapLegacyStore.test.ts`
- `apps/rn/src/data/legacyBridge/mapLegacyStore.ts`
- `apps/rn/src/data/legacyBridge/migrateFromLegacy.test.ts`
- `apps/rn/src/data/legacyBridge/migrateFromLegacy.ts`
- `apps/rn/src/data/legacyBridge/originalBalance.ts`
- `apps/rn/src/data/legacyBridge/readLegacyStores.ts`
- `apps/rn/src/data/legacyBridge/readLegacyStores.web.ts`
- `apps/rn/src/data/legacyBridge/realContainer.test.ts`
- `apps/rn/src/data/legacyBridge/report.ts`
- `apps/rn/src/data/legacyBridge/webkitLocalStorage.test.ts`
- `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts`
- `apps/rn/src/data/readBackup.test.ts`
- `apps/rn/src/data/readBackup.ts`
- `apps/rn/tests/e2e/backup.spec.ts`
- `apps/rn/tests/e2e/csv-import.spec.ts`
- `apps/rn/tests/e2e/data-recovery.spec.ts`
- `apps/rn/tests/e2e/delete-all-data.spec.ts`
- `apps/rn/tests/e2e/scan.spec.ts`
- `packages/core/imports/debtCsv.ts`
- `packages/core/imports/testDebtCsv.ts`
- `packages/core/scan/parseStatementText.ts`
- `packages/core/scan/testParseStatementText.ts`

<!-- claims-sha256: 53a336ffe4cb9441 -->

