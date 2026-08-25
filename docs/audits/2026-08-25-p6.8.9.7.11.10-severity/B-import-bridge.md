# B — CSV import, backup/restore, and the v1.6 legacy bridge

Independent audit per `docs/audits/2026-08-25-p6.8.9.7.11.10-severity/BRIEF.md`.
**Range for Job 1** `4877d90..01fc7ec` · **surface for Job 2** the whole of
`apps/rn/src/data/legacyBridge/`, `apps/rn/src/data/backup.ts` / `readBackup.ts` /
`detectBackupFormat.ts` / `cloudBackup.ts`, `packages/core/imports/`, and the import and restore doors
end to end.

Nothing was run. Read-only inspection only, as the brief requires. Sections are appended as each is
finished.

---

# Job 1 — do the fixes close their findings?

| # | fix | verdict |
|---|---|---|
| J1-1 | `debtCsv.ts` — APR parsed directly instead of through `parseOptionalAmount` | `CLOSED` |
| J1-2 | `testDebtCsv.ts` — the `$` / `,` / negative-APR assertions | `PARTIAL` · **major** |
| J1-3 | `webkitLocalStorage.ts` — `attributeDroppedRows` inverted for the no-pick case | `PARTIAL` · **major** |
| J1-4 | `webkitLocalStorage.ts` — `pickLegacyStore`'s docblock re-attached | `CLOSED` |
| J1-5 | `webkitLocalStorage.test.ts` — the inverted attribution assertions | `PARTIAL` · **major** |
| J1-6 | `report.ts` — the "seven fixtures" count | `CLOSED` |
| J1-7 | `ImportDebtsSheet.tsx` — the false provenance claim | `CLOSED` |

---

## J1-1 — `debtCsv.ts`: the APR is parsed here now, not borrowed from the money parser

`packages/core/imports/debtCsv.ts:276-290`.

### Is the original behaviour gone?

Both findings it targets are closed, at the code:

- **`"$"`, `","`, `"$,"`, `"$ ,"` (C-2).** `:279` now strips the trailing `%`, then `[,\s$]`, and `:280`
  makes an empty result `NaN` rather than handing `""` to `parseOptionalAmount`'s
  `if (cleaned === '') return 0` (`packages/core/utils/amountField.ts:55`). `:281` refuses the row with
  *"could not read APR"*. The silent 0% is gone for all four of the characters that can empty the cell,
  not one.
- **`"-5"` (C-5).** `:280` keeps `Number("-5") = -5`, which is finite, so `:281` does not fire; `:286`
  assigns it and `:287`'s new `apr < 0` sends it to *"APR must be between 0 and 100 — got -5."* The
  message is now the true one.

### Did it preserve what the site did right? — enumerated, both directions

The old path was `parseOptionalAmount(rawTrimmed.replace(/%$/,"").trim())`, i.e. `Number` over
`normalize` = `replace(/[,\s$]/g,'')` (`packages/core/utils/amountField.ts:28,53-57`). The new `aprText`
at `:279` applies **exactly the same two strips in the same order**, so the *string* handed to `Number`
is byte-identical to the old one. The only changed behaviour is what happens to the two results
`parseOptionalAmount` collapsed into `null`:

| input | before | now |
|---|---|---|
| `""` / whitespace-only | `0` | `0` — `:286` short-circuits on `rawTrimmed === ""`, `:281`'s guard is skipped |
| `19.99` · `19.99%` · `19.99 %` · `$19.99` · `1,9.99` | accepted, same value | accepted, same value |
| `abc` · `Infinity` · `1%2` · `%19.99` | refused, unreadable | refused, unreadable (`Number.isFinite` refuses `Infinity` at `:281` exactly as `amountField.ts:57` did) |
| `%` | refused, unreadable | refused, unreadable |
| `150` | out of range | out of range |
| **`$` `,` `$,` `$%`** | **imported at 0%** | refused, unreadable — the fix |
| **`-5`** | refused, *unreadable* | refused, *out of range* — the fix |

**Nothing moved from refused to accepted.** The accept set is unchanged; the refuse set gained the four
empty-after-strip cells; one refusal message changed. This is the narrowest shape the two findings admit,
and it is the opposite of the over-matching that the brief warns cost both prior rounds — I looked for
one and there is none here.

Two residues, both **minor** and recorded rather than filed:

- `parseOptionalAmount` is still imported at `packages/core/imports/debtCsv.ts:4` and no longer called.
  Neither tsconfig sets `noUnusedLocals` (root, `apps/rn/tsconfig.json`, `packages/core/tsconfig.json`),
  so nothing goes red. Dead import, no behaviour.
- `apr` is now a bare `Number` result, so `"0x14"` still reads as 20 and `"-0"` still passes `apr < 0`.
  Both were equally true before this diff (`amountField.ts:56` is also `Number`), so neither is a
  regression of this change.

### Would anything catch it un-fixing?

Yes, in one direction and partly in the other. `packages/core/imports/testDebtCsv.ts:267` (`"$"`) and
`:276-284` (`-5`) both go red on the pre-fix code, and the file is registered at
`packages/core/testing/runRegressionTests.ts:40` (`npm run test:regression`, inside
`validate:release:rn`); `assert` throws at `testDebtCsv.ts:21-24`. The gaps are J1-2.

### Verdict — J1-1: `CLOSED`

---

## J1-2 — `testDebtCsv.ts`: two of the three new APR cells are unreachable, and the loop hides it

`packages/core/imports/testDebtCsv.ts:262-269`.

```ts
for (const cell of ["$", ",", "$,"]) {
  const r = parse(`${HEADER}\nVisa,2400,75,${cell},2026-09-01`);
  eq(r.debts.length, 0, `an APR cell of "${cell}" is unreadable, NOT a blank 0%`);
}
```

The cell is interpolated **raw into a CSV line**, and two of the three cells contain a comma, which
`parseCsvLine` (`packages/core/imports/debtCsv.ts:80-84`) reads as a field separator. The row is
six fields wide against a five-column header (`:166-169`), so the columns shift:

| cell | the line actually parsed | `row.apr` | `row.duedate` | why the row is refused |
|---|---|---|---|---|
| `$` | `Visa,2400,75,$,2026-09-01` | `"$"` | `2026-09-01` | **the APR** — the intended assertion |
| `,` | `Visa,2400,75,,,2026-09-01` | `""` | `""` | `dueDate is required` (`debtCsv.ts:232-235`) |
| `$,` | `Visa,2400,75,$,,2026-09-01` | `"$"` | `""` | `dueDate is required` — the dueDate check at `:226-235` runs **before** the APR check at `:276` |

For the `,` case the APR cell under test is not even `","` — it is blank, which the parser is
*supposed* to accept as 0%. Both of those assertions pass on the base commit with the defect fully
present, and would pass with the APR block deleted outright. The comment above them
(`:262-266`) states the finding — *"guarding only the `%` case left `"$"` and `","` importing as a
silent 0%"* — and the `","` half of that sentence is pinned by nothing.

A literal comma in an APR cell is only expressible quoted (`Visa,2400,75,",",2026-09-01`), which
`parseCsvLine:69-78` does handle, so the input is real and the fix does handle it — the test just
never reaches it.

**What survives:** the `"$"` iteration is genuine and does go red on the base code (`"$"` →
`normalize` → `""` → `parseOptionalAmount` returns `0` → the row imports), so the headline class is
still gated. The `-5` assertion at `:276-284` and the spaces-are-blank assertion at `:271-275` are
both non-vacuous and correctly reached.

**Severity: major.** *If a later change reintroduces the blank-contract for a comma- or `$,`-shaped
APR cell, two of the three assertions written to catch exactly that would still report green, so a
card that charges interest can once again be imported and planned at 0%.*

### Verdict — J1-2: `PARTIAL` · **major**

---

## J1-4 — `pickLegacyStore`'s docblock is back on `pickLegacyStore`

`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:222-233`.

The block *"Choose the v1.6 store from everything the probe opened…"* — including the load-bearing
sentence that `null` **must not** be confused with "the read failed" — now sits immediately above
`export function pickLegacyStore` at `:233`, and `attributeDroppedRows`'s own block at `:192-210` sits
above `:211`. Both functions are documented as themselves. Nothing else in the file moved.

Nothing would catch it un-fixing: `scripts/check-comment-convention.ts` polices meta-commentary and
stale counts, not orphaned blocks. That is the same `CLOSED-UNPINNED` shape the prior round recorded,
and the added note at `:229-231` (*"third instance"*) is accurate.

### Verdict — J1-4: `CLOSED` (unpinned — no gate can see it)

---

## J1-6 — `report.ts`: the stale fixture count

`apps/rn/src/data/legacyBridge/report.ts:47` now reads *"every construction site, most of which never
exercise it"* — no number, so nothing to go stale. The nine sites the prior round counted are still
nine (`migrateFromLegacy.test.ts:45`, `interruption.test.ts:46,130,152`,
`persistenceLifecycle.test.ts:239,276,308`, plus the two production producers
`readLegacyStores.web.ts:22` and `data/migrationAudit/doors.ts:41`), and the new wording is true of all
of them.

### Verdict — J1-6: `CLOSED`

---

## J1-7 — `ImportDebtsSheet.tsx`: the provenance claim

`apps/rn/src/components/entities/ImportDebtsSheet.tsx:125-126` now reads *"`site/support.html` states
the same rule"* — present tense, no history. It is true: `site/support.html:286` says *"Dates must be
written as `YYYY-MM-DD` (for example `2026-09-01`)"*. The false *"has said this since it was written"*
is gone. The user-facing caption at `:128-131` is unchanged and still matches the parser
(`debtCsv.ts:226-235`).

### Verdict — J1-7: `CLOSED`

---

## J1-3 — `attributeDroppedRows` now reports everything when nothing is picked

`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:203-220`.

### Is the original behaviour gone?

The arithmetic half is, exactly. `:215-216` computes the total and returns
`{ droppedRows: total, droppedRowsOtherCandidates: 0 }` when `pickedPath === undefined`; the picked
branch at `:217-219` is unchanged in result (`total - droppedRows` is the same complement the old loop
accumulated). Conservation still holds in both branches, empty input still returns `{0,0}`, and the
function is still pure and order-independent.

### But the finding had two halves, and the second one is untouched

C-1's sentence was *"the `null`-pick case now reports zero loss, **and the field that holds the real
number is read by nothing**."* The fix moved the number into `droppedRows`, and the docblock it wrote
claims the payoff at `:207-209`: *"`droppedRows` is the only number left saying anything was lost …
a data-loss signal fails SAFE by reporting."*

**In a shipping build it reports to nobody.** `droppedRows` has exactly two readers in the repo:

1. `apps/rn/src/store/persistence.ts:154` — inside `describeMigrationLosses`, which is called only at
   `:201`, on the `outcome.migrated === true` branch. When no store is picked,
   `migrateFromLegacy` returns `migrated: false` (`apps/rn/src/data/legacyBridge/migrateFromLegacy.ts:127-147`)
   and `persistence.ts:177-196` returns before `:201` is reached. The user is told nothing.
2. `apps/rn/src/data/legacyBridge/report.ts:66` — `summariseLegacyRead`, rendered only by
   `apps/rn/src/components/more/LegacyBridgeProbeReadout.tsx:39`, mounted only behind
   `qaEnabled()` (`apps/rn/src/app/more.tsx:384`). `QA_TOOLS` is flipped false at P6.17
   (`apps/rn/src/config/qa.ts:9,23-24`) and `__DEV__` is false in a production export, so this readout
   does not exist in the build where it matters.

The Sentry breadcrumbs for the non-terminal skip list `truncated`, `visited`, `candidates` and
`refused` and **not** this (`apps/rn/src/store/persistence.ts:187-193`) — and the no-pick decode-failure
case is `terminal: true`, so `reportError` is not even called (`:186`). The value now lands in a field
that, on the one path the fix exists for, no shipping surface reads.

### What the change does to inputs the finding never mentioned

Checked for the over-match both prior rounds were caught by. The picked branch is bit-identical, so the
migrated path — the only path that reaches a user — is unaffected in both directions. The one new
behaviour is on the QA readout: a genuine fresh v1.7 install whose container happens to hold **another
app's** WebKit database with undecodable rows now prints `dropped=N` instead of `dropped=0`. That is
C-1's original false positive, reinstated — but confined to a developer surface that ships disabled, so
it is a diagnostic cost, not a user-facing one. It is the right trade; it is just not free, and nothing
beside the code says so.

### ⛔ The field's own contract now contradicts the code, and it is the load-bearing kind

`apps/rn/src/data/legacyBridge/report.ts:31-37` was **not** updated by this commit (only `:47` was). It
still declares:

> *"Rows that would not decode in **the database judged to be ours**. … ⛔ **It used to be the sum across
> EVERY candidate** … told the upgrader *"N row(s) of your old data could not be read"* when nothing of
> theirs was lost. (P6.8.9.7.10 · C-1.)"*

On the no-pick path `droppedRows` is now precisely "the sum across every candidate", i.e. the thing the
docblock names as the defect. Meanwhile the fix's own comment
(`webkitLocalStorage.ts:203-209`) argues that this number ought to be surfaced. A maintainer who acts on
that argument — wiring `droppedRows` into the skipped-migration path, which is the only way the "fails
SAFE by reporting" claim becomes true — will read `report.ts:31-37` as assurance that the number is
already attributed to the user, and will ship C-1's false claim back to the upgrader verbatim.

**Severity: major.** *The field that decides whether an upgrader is told "N rows of your old data could
not be read" is now documented as meaning one thing and computed as meaning another, so the next person
to surface it will tell a fresh-install user they lost data that was never theirs.*

### Would anything catch it un-fixing?

`apps/rn/src/data/legacyBridge/webkitLocalStorage.test.ts:215-216` pins the inversion of the pure
function and does go red on the previous code. Nothing pins the wiring — see J1-5.

### Verdict — J1-3: `PARTIAL` · **major**

---

## J1-5 — the attribution assertions, and the call site that still has no test

`apps/rn/src/data/legacyBridge/webkitLocalStorage.test.ts:200-222`.

### Do they fail on the defect they name?

For the pure function, yes. `:215` (`none.droppedRows === 9`) and `:216`
(`none.droppedRowsOtherCandidates === 0`) both assert the *opposite* values from the code at
`4877d90`, so a revert of `webkitLocalStorage.ts:215-216` goes red. `:206-207` still discriminate the
picked case (2 and 7 are distinct, and neither is the sum). `:220` is a live positive control. The file
is registered at `apps/rn/src/testing/runAppTests.ts:149`, inside `npm run test:app` and
`validate:release:rn`, and `assert` throws (`:33-36`).

### The class it exists for still lives at an untested call site

`apps/rn/src/data/legacyBridge/readLegacyStores.ts` has **no test in the repo**. The directory holds
`findLegacyStores.test.ts`, `mapLegacyStore.test.ts`, `migrateFromLegacy.test.ts`,
`realContainer.test.ts` and `webkitLocalStorage.test.ts`, and `runAppTests.ts:149-176` registers exactly
those; `realContainer.test.ts:5-7` re-implements the read path over `node:sqlite` rather than importing
`readLegacyStores`, because that module pulls `expo-file-system`/`expo-sqlite`. So
`readLegacyStores.ts:159-171` — the three lines that decide *which* number becomes the user-facing claim —
are executed by nothing off a device. Revert them to the pre-`.11.4` `report.droppedRows += result.dropped ?? 0`
inside the loop and every suite in this repo stays green, including all five assertions added here.
This is C-G's finding unchanged, one round later.

### And the new header states a property the wiring does not deliver

`:194-199` says *"This counter is then the only evidence anything was lost, so suppressing it trades a
measured false positive for an unmeasured false negative — on data nobody can get back."* Per J1-3, on
that path the counter is evidence nothing reads: `describeMigrationLosses` is not called, no breadcrumb
carries it, and the probe that prints it ships disabled. The assertion label at `:215` —
*"every drop is REPORTED"* — describes a reporting that does not occur.

**Severity: major.** *The one number that says an upgrader's v1.6 data did not come across is computed
by an assertion-covered helper and consumed by an assertion-free call site, so the false user-facing
claim this whole line of work exists to prevent can be reintroduced with every gate green.*

### Verdict — J1-5: `PARTIAL` · **major**

---

# Job 2 — the major+ sweep

Surfaces read in full: `apps/rn/src/data/legacyBridge/` (all 11 modules), `apps/rn/src/data/backup.ts`,
`readBackup.ts`, `detectBackupFormat.ts`, `cloudBackup.ts`, `backupFile.ts`/`.web.ts`,
`csvImportFile.ts`/`.web.ts`, `migrations.ts`, `migrationAudit/` (doors, invariants, corpus),
`packages/core/imports/`, `packages/core/utils/amountField.ts`, and the doors end to end —
`ImportDebtsSheet.tsx`, `BackupSheets.tsx`, `CloudBackupSheet.tsx`, `DataResetScreen.tsx`,
`app/_layout.tsx`'s launch restore offer, `store/persistence.ts` and `store/store.ts`'s `importStore`.

**Three findings at `blocker` or `major`. No blocker.** Everything else I looked at in these surfaces
held: the copy-then-open discipline in `readLegacyStores.ts:51-109` (including the `-wal`/`-shm`
siblings and the per-candidate cache names), `pickLegacyStore`'s contents-not-path rule, the
detect-then-read split, the two-tap confirm on every destructive replace, the B3 unclaimed-remote fork
in `cloudBackup/service.ts:100-140`, `mintDebtIds`' batch accumulator, and the `refuseRealStoreWrite`
veto's coverage of every import door I could reach.

---

## J2-1 — a restore on the data-reset screen leaves the user staring at the error it just fixed

`apps/rn/src/components/more/BackupSheets.tsx:115-119` ·
`apps/rn/src/components/DataResetScreen.tsx:100-113` · `apps/rn/src/app/_layout.tsx:262-269`.

`DataResetScreen` is the whole tree when `storageError === 'data-reset'` — `_layout.tsx:262-269`
returns it *instead of* the navigator. It hosts `ImportBackupSheet` at `DataResetScreen.tsx:113` with
`onClose={() => setImporting(false)}`, and the sheet's commit is:

```ts
function replace() {
  if (!found) return;
  appStore.getState().importStore(found.store);
  onClose();
}
```

`importStore` is the only thing that runs. **`storageError` is never cleared**, so the sheet closes and
the user is returned to the same full-screen panel reading *"We couldn't open your saved plan · Something
was wrong with the file, so the app started fresh"* — same three buttons, no confirmation that anything
was restored, and the only way forward labelled **"Start fresh"** (`DataResetScreen.tsx:106-111`). The
iCloud button five lines above it gets this right: it calls `onStartFresh()` after the import (`:96`),
which is what clears `storageError`.

The data is not lost — `bootstrapPersistence` installs autosave on this path (it returns early only for
`'read-failed'`, `persistence.ts:73-76`) and `importStore` replaces `prefs`, which takes the
write-immediately branch at `:103-108`. The damage is entirely in what the user is told and what they will
do about it: the most likely reading of that screen is that the import failed, and the button offered to
them is the one whose name means the opposite of what they just did.

**Nothing covers it.** `apps/rn/tests/e2e/data-recovery.spec.ts:58-84` asserts the screen appears, that
the copy does not claim deletion, that `data-reset-import` is *visible*, and that `data-reset-continue`
dismisses it — it never opens the sheet. `apps/rn/tests/e2e/backup.spec.ts` drives the import only from
`/more` (`openImport` at `:50-53` navigates to `/more`). The one combination of the two — a restore
*from* the reset screen — is exercised by no spec in `apps/rn/tests/e2e/`.

**Severity: major.** *A user who restores their backup from the "we couldn't open your saved plan"
screen is returned to that same screen with no sign the restore worked, and the only way onward is a
button labelled "Start fresh".*

---

## J2-2 — the destructive restore never shows the backup's date, and the code says it does

`apps/rn/src/data/backup.ts:43-44` · `apps/rn/src/data/readBackup.ts:88,122-133` ·
`apps/rn/src/components/more/BackupSheets.tsx:121-136`.

`BackupEnvelope.exportedAt` is documented as:

```ts
/** ISO timestamp of the export. Surfaced to the user before a destructive restore (5.8.4). */
exportedAt: string;
```

It is not. `serializeBackup` writes it (`backup.ts:95`), `parseBackupValue` carries it into the returned
envelope (`:176`) — and then `readBackup.ts:88` passes only `result.envelope.store` on, so `exportedAt`
is dropped at that line and never reaches `ReadBackupSuccess`. A repo-wide grep for `exportedAt` outside
tests returns five hits: the type, the writer, the parser, `detectBackupFormat.ts:44`'s v1.6 marker check
and `readBackup.ts:55`'s metadata skip list. **No renderer.**

What the confirm screen actually shows before an irreversible replace is `describeBackup`
(`readBackup.ts:122-133`) — entity counts and nothing else:

> *"This backup has 4 debts, 3 expenses and 1 goal."*

That sentence is identical for a backup exported this morning and one exported in March, and the sheet's
subtitle beside it is *"This overwrites everything currently in the app. It can't be undone."*
(`BackupSheets.tsx:126`). The iCloud door does this correctly — `CloudBackupSheet.tsx:90-101` puts
`formatBackupTime(...)` on screen before its confirm — so the app has both the value and the formatter,
and the file door is the one that drops it.

**Severity: major.** *A user restoring a saved backup file over a live portfolio is shown only entity
counts, so a months-old backup and this morning's are indistinguishable at the one screen standing
between them and an irreversible overwrite.*

---

## J2-3 — the migration audit cannot see goal money, which is where the last money defect was

`apps/rn/src/data/migrationAudit/invariants.ts:76,93-99` ·
`apps/rn/src/data/migrationAudit/corpus.ts:59,164-172` · `apps/rn/src/data/migrations.ts:170-176`.

`moneyKeepsItsType` is the invariant whose docblock says it exists because *"`runMigrations` performs NO
type validation … the question this settles is whether anything ENFORCES that at the boundary."* It
checks three collections:

```ts
check(o.store.debts, 'debts');
check(o.store.requiredExpenses, 'requiredExpenses');
check(o.store.livingExpenses, 'livingExpenses');
```

**`goals` is absent**, and so are its money field names: `MONEY_FIELDS` at `:76` is
`['balance','minimumPayment','apr','amount']`, none of which a goal carries. Goals hold `targetAmount`,
`currentAmount` and `priorityPerPaycheck` (`migrations.ts:170-176`).

The corpus is blind in the same place, twice over. The healthy goal is
`{ id: 'g1', name: 'Emergency fund', target: 1000 }` (`corpus.ts:59`) — `target`, not `targetAmount`, no
`type`, no `priorityPerPaycheck` — and the nested-damage list at `corpus.ts:164-172` covers
`debts[0].{balance,minimumPayment,apr,dueDate,id}` and `requiredExpenses[0].{amount,dueDate}` and
nothing else. So no case in the generated corpus ever puts a damaged value in a goal money field, and no
invariant would look at it if one did. The stand-down loop at `migrations.ts:214-232` is likewise never
entered by any corpus case.

This is the exact class the repo has already been bitten by, twice, in this same file.
`migrations.ts:159-166` records that *"goals fell through `...r` untouched"* — B1's other half, found by a
later verification — and `:177-196` records that the first repair of it *"left the harm exactly where it
was"* because `0` is the uncapped value, calling it **"the only finding in that pass that reaches a
user's money."** Both were found by people reading, not by the audit; and the audit still could not find
either one today. Remove `'priorityPerPaycheck'` from `migrations.ts:173`, or drop `goals` from
`repairMoneyFields` entirely, and the migration audit inside `npm run test:app` reports zero violations.

**Severity: major.** *The adversarial corpus that exists to prove a restore cannot corrupt the user's
money runs to completion without ever looking at a goal, so the pace that decides how much of every
paycheck is taken away from their debt is unguarded by the one instrument built to guard it.*

---

## Checked and clear

- **`readLegacyStores.ts` I/O.** Copy-before-open, `-wal`/`-shm` carried with the same basename,
  per-candidate names so two `localstorage.sqlite3` files cannot overwrite each other, cache not
  documents, `finally` cleanup of both the copy and its sidecars, and no throw path (`:51-110`).
- **`decodeWebKitValue`'s sniff** (`webkitLocalStorage.ts:142-158`): JSON-parse discrimination first,
  NUL tiebreak only in the corner where JSON cannot separate them, odd length short-circuits UTF-16.
  Total, and `decodeUtf8` yields U+FFFD rather than throwing.
- **`detectBackupFormat`** — all three formats self-identifying; `looksLikeV16` requires both marker
  fields *and* a v1.6-only pay field *and* the absence of both v1.7 structural fields; `looksLikeRawV17`
  requires all three together. The refuse-when-unsure asymmetry at `:6-10` is delivered by the code.
- **`readBackup`'s single parse and total `migrated()` wrapper** (`:74-103,157-163`) — all three readers
  go through the same try/catch, so a recognised-but-hostile payload refuses rather than crashing the
  sheet.
- **`parseBackupValue`'s too-new guard** (`backup.ts:148-168`) — version before shape, and the store's own
  version read from the payload when the envelope omits it, so deleting one field cannot slip a future
  store past. (The `raw-v17` branch has no equivalent check, but a raw store is by definition a pre-5.8
  export and cannot carry a future `storeVersion` without hand-editing — noted, not filed.)
- **`cloudBackup/service.ts`** — `stat` before `read` on restore, `===` rather than "newer than" in
  `inspectRemote`, `unknown` never collapsed into `none`, `replaceUnclaimed` reachable from exactly one
  button that has just shown the other copy's date, and `deleteCloudBackup` refusing on an unavailable
  provider rather than reporting a delete that did not happen.
- **`mintDebtIds`** (`store/debtIds.ts:29-38`) — the accumulator makes a batch unique against both the
  existing portfolio and itself, and `addDebt` (`store/store.ts:383-403`) does not re-stamp the id.
- **Sandbox containment of the import doors** — `ImportDebtsSheet` writes through `useActiveStore()`;
  `ImportBackupSheet`'s bare `appStore` write is safe because `/more` is withheld during a bounded run and
  `DataResetScreen` returns before the `StoreProvider` at `_layout.tsx:303`, so `sandboxDepth` is 0 on
  both of its paths.
- **The v1.6 file door's loss reporting.** I chased the asymmetry — `describeBackup` counts
  `legacy.dropped` while `describeMigrationLosses` (`persistence.ts:132-156`) deliberately excludes it and
  counts `unknown`+`unparseable` instead — and it is not reachable as a defect: `v16FileToLegacyItems`
  re-encodes every value with `JSON.stringify` (`readBackup.ts:64-72`), so `unparseable` is structurally
  impossible on that door, and none of v1.6's `buildBackupData()` keys (pinned field-for-field at
  `apps/rn/tests/e2e/backup.spec.ts:26-42`) lands in `DROPPED` or in `unknown`. Both counters are `0` for
  every real v1.6 file. Recorded because the two doors genuinely do report opposite sets, and a v1.6-era
  file carrying an unmapped key would surface it.
- **CSV column shifts.** An unquoted comma inside any cell shifts the row, and every shift I constructed
  lands a non-date in `dueDate` and is refused by `debtCsv.ts:226-231` before any money is accepted.
- **BOM and line endings.** A UTF-8 BOM is stripped by `trim()` (U+FEFF is `WhiteSpace` in ECMA-262), and
  a classic-Mac `\r`-only file collapses to one line and is refused with the header message rather than
  misread.

## Could not determine

- **Whether a real iOS WebKit container can produce the total-decode-failure that J1-3 turns on.**
  `decodeWebKitValue` returns `null` only for a value that is neither a string, a `Uint8Array`, an
  `ArrayBuffer` nor a number array (`webkitLocalStorage.ts:46-52,142-147`), and `ItemTable.key` is TEXT,
  so every mechanism I can name for *"the database opens and decodes to nothing"* needs a driver
  behaviour I cannot observe from here. `realContainer.test.ts` exercises the captured iOS 26.2 container
  but asserts nothing about `dropped`, and the brief forbids running it. **If it is unreachable, J1-3's
  fix is harmless and its docblock is still wrong. If it is reachable, `isConfirmedFreshInstall`
  (`migrateFromLegacy.ts:82-96`) consults neither `droppedRows` nor `opened[].rows`, so such a container
  is classified terminal, the retry is consumed, and the v1.6 portfolio is stranded — with `droppedRows`
  now correctly non-zero and read by nothing.** That branch is the one thing on this surface I would want
  measured on a device before ship.
- **How the CSV sheet's caption and the `n rows skipped` block wrap at the largest Dynamic Type sizes.**
  `fontScale` is pinned to 1 on react-native-web and no captured frame in `apps/rn/capture-ref/` shows
  either sheet.
- **Whether `expo-document-picker`'s `copyToCacheDirectory` survives an iCloud Drive provider for the CSV
  door.** `csvImportFile.ts:39-53` is native-only and `csvImportFile.web.ts` returns `ok: false`, so no
  suite in the repo reaches it. The module's own docblock names this as a P6.14 device row; I confirmed
  it is still unreached.
