# C — import, the legacy bridge, migration, backup and restore

Independent re-verification per `docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/BRIEF.md`.
**Fix range** `6736a64..c8d54fa` · branch `v1.7-dev`.

**Surface read:** `apps/rn/src/data/migrations.ts` · `legacyBridge/` (all modules) ·
`readBackup.ts` · `detectBackupFormat.ts` · `backup.ts` · `formatBackupTime.ts` ·
`migrationAudit/` (doors, invariants, corpus, the three test harnesses, the new hostile fixture) ·
`components/more/BackupSheets.tsx` · `CloudBackupSheet.tsx` · `components/DataResetScreen.tsx` ·
`components/entities/ImportDebtsSheet.tsx` · `components/plan/RecoveryPlanSection.tsx` ·
`store/persistence.ts` · `store/store.ts`'s `importStore` · `store/persistenceLifecycle.test.ts` ·
`storage/cloudBackup/service.ts` · `packages/core/imports/debtCsv.ts` + `testDebtCsv.ts` ·
`tests/e2e/{data-recovery,recovery,backup}.spec.ts`.

**Nothing in the repo was edited.** Every "measured" claim below came from a throwaway script in the
scratchpad run with `npx tsx` from `apps/rn`, importing the real modules. No gate and no suite was run.

⚠️ **One correction to the assignment:** there is no `apps/rn/src/imports/debtCsv.ts`. The CSV parser is
`packages/core/imports/debtCsv.ts`, and **`git diff 6736a64..c8d54fa -- packages/core/imports/` is empty** —
the whole CSV path is unchanged by this fix range. Its findings (`B-J1-1`, `B-J1-2`) were closed at an
earlier step; I re-measured them anyway and they hold (see Job 1, last section).

---

# Job 1 — the fixes, re-verified

| # | subject | verdict |
|---|---|---|
| `.11.13.6` | the `readBackup` poisoned corpus, 3 → 7 | **`CLOSED`** — measured, all 7 open the door |
| `.11.13.5` | the migration that changed the plan and said nothing | **`CLOSED`** |
| `.11.13.8` | the card that named an action the app did not have | **`CLOSED`** |
| `.11.13.7` | the `droppedRows` decision nothing could reach | **`PARTIAL`** · **major** (→ J2-1) |
| A-J2-3 | `runMigrations` throws on a `null` goal row | **`CLOSED`** |
| B-J2-1 | a restore on the data-reset screen leaves the error | **`CLOSED`** |
| B-J2-2 | the destructive file restore never showed the date | **`CLOSED`** (introduces J2-2) |
| B-J2-3 | the migration audit cannot see goal money | **`PARTIAL`** · **major** (→ J2-3) |
| B-J1-1 / B-J1-2 | the CSV APR cells | **`ALREADY-CLOSED-ELSEWHERE`** — re-measured, hold |

---

## `.11.13.6` — the `readBackup` poisoned corpus — `CLOSED` (measured)

**Original finding.** `readBackup.test.ts`'s poisoned corpus carried `debts` only, so the class
`.11.12.2` fixed (a non-object row inside *any* of the four lists) was pinned by one member. The fixer
then reported against himself that his **first cut of the new fixtures was vacuous**: without
`debts: []` they were `unrecognised` and refused before `runMigrations` ran, so *"does not throw"* was
asserted over a door that never opened.

**The brief required proof, not inference.** I fed all seven entries of the `poisoned` array at
`apps/rn/src/data/readBackup.test.ts:175-192` through the real `detectBackupFormat` → `readBackup`
path and printed the branch each took and whether assertion 3 (`result.ok`-conditional, `:207-209`)
executes:

| fixture | detected as | `result.ok` | assertion 3 |
|---|---|---|---|
| envelope with a string `debts` | `envelope` | true | **runs** — `debt/(whole list unreadable)` |
| raw-v17 with a poisoned debt | `raw-v17` | true | **runs** — `debt/(a row could not be read)` |
| raw-v17 with a poisoned **GOAL** | `raw-v17` | true | **runs** — `goal/(a row could not be read)` |
| raw-v17 with a poisoned required expense | `raw-v17` | true | **runs** — `requiredExpense/…` |
| raw-v17 with a poisoned living expense | `raw-v17` | true | **runs** — `livingExpense/…` |
| raw-v17, every list poisoned at once | `raw-v17` | true | **runs** — 4 repairs, one per entity |
| v1.6 file with a string `debts` | `v16-file` | true | **runs** — `debt/(whole list unreadable)` |

**7 of 7 open the door.** The self-report is accurate in both directions — the defect was real and it
is gone.

**Preserved?** The refusal corpus at `:145-157` still refuses all seven of its members, and the
rescued-subset fixture at `:216-226` is still refused. `debts: []` is the only field added, and an empty
array is already the healthy shape for the three lists not under test in each row — so nothing moved
from refused to accepted.

**Pinned?** `readBackup.test.ts:208` — *"imports what it can AND reports the loss"* — is the **only**
assertion in this block that can see the class. `:205` (`does NOT throw`) cannot: `readBackup` catches
and returns a failure result (`readBackup.ts:185-187`), so it stays green with the drop removed. The
earlier-red risk is real and named in the fixer's entry: `.11.12.2`'s per-entity assertions at
`persistenceLifecycle.test.ts:229-241` fire first on a whole-seam mutation, so only an entity-scoped
plant reaches `:208`.

### Verdict — `.11.13.6`: `CLOSED`

---

## `.11.13.5` — the migration that changed the plan and said nothing — `CLOSED`

**Original finding.** A store an earlier build wrote carries `priority: true` with
`priorityPerPaycheck: 0`. A finite `0` produces **no repair record**, so the stand-down loop at
`apps/rn/src/data/migrations.ts:258-318` stood the goal down — correctly — and emitted nothing.

**Measured, end to end through the real `runMigrations`:**

```
in   goals[0] = { priority:true, priorityPerPaycheck:0, type:'savings', targetAmount:5000, … }
out  priority = false · priorityPerPaycheck = undefined
     dataRepairs = [{ entity:'goal', id:'g1', name:'Roof', kind:'lost',
       field:'the per-paycheck amount could not be read, so it is no longer funded ahead of your debt' }]
     pendingDataRepairs carries the same single entry
```

**Preserved?** Three directions checked, all measured.
- *Idempotence.* Re-running `runMigrations` on that output gives `dataRepairs: []` and leaves
  `pendingDataRepairs` at **1** — merged, not stacked — so `repairsAreNotRepeated`
  (`invariants.ts:174-179`) still holds and the card cannot nag twice.
- *The recovered case is not swept in.* `migrations.ts:308-317` still keys off the **value**, not the
  record, so a pace of `'200'` that recovers correctly is untouched — the over-match `.11.9 · B-1`
  found. Pinned by the paired assertions at `persistenceLifecycle.test.ts:624-625`.
- *THE emergency fund.* `fundsAsSinkingFund(goal, primaryEmergencyGoal(goals))` at `migrations.ts:272`
  still decides `governed`, so the *"no longer funded ahead of your debt"* clause is withheld where it
  would be false.

**Pinned?** Two layers, and I name which assertion carries it.
- `apps/rn/src/store/persistenceLifecycle.test.ts:666` —
  `eq(legacyZero.pendingDataRepairs.length, 1, …)`. This is the **inverted** assertion; the original
  defect makes it `0`, so it reds. The two before it (`:655`, `:656` — priority `false` and the cleared
  pace) describe behaviour that was already correct, so neither fires first and masks it.
- `apps/rn/tests/e2e/data-recovery.spec.ts:289-304` — the only thing proving the record reaches a
  screen. Its first assertion (`data-repairs-ack` visible) would **also** red on the original defect
  (no card at all), so the later `no longer funded ahead of your debt` line never runs on that plant —
  but both reds are the same finding, so no assertion rides along dead.

### Verdict — `.11.13.5`: `CLOSED`

---

## `.11.13.8` — the card that named an action the app did not have — `CLOSED`

**Original finding (J1-4).** *"Your plan is running without it until you set it again"* was spoken over
every repair record, including records with no id and no name and therefore nothing to open. The
finding named **one** producer (the goal pace) of what turned out to be a five-member class.

**Enumeration re-counted from the repo, not taken from the log's table.** `git grep` for
`repairs.push(` and `push({ entity` across `apps/rn/src` and `packages/core`, excluding tests, returns
exactly five call sites — no sixth:

| site | record | openable? |
|---|---|---|
| `apps/rn/src/data/migrations.ts:83` | `(whole list unreadable)` — `id:''`, `name:''` | ⛔ no |
| `apps/rn/src/data/migrations.ts:109` | `(a row could not be read)` — `id:''`, `name:''` | ⛔ no |
| `apps/rn/src/data/migrations.ts:118` | a named field on a named row | ✅ yes |
| `apps/rn/src/data/migrations.ts:298` | the goal stand-down sentence | ✅ yes (since `.11.13.4`) |
| `apps/rn/src/store/persistence.ts:134` | `entity:'migration'`, `id:''`, `name:''` | ⛔ no |

**Three of five.** The log's table is correct.

**Preserved?** The named-loss path keeps the actionable wording, and the icon condition was inverted to
test for `recovered` so the new `unrecoverable` block defaults to the warning glyph rather than
`healing` — the change that would otherwise have handed a loss the mended-amount icon.

**Pinned?** `apps/rn/tests/e2e/data-recovery.spec.ts:318-328`. The load-bearing assertions are `:324`
(the honest sentence present) and `:328` (`until you set it again` → count 0). `:328` is an absence
assertion and is correctly ordered **after** `:324` proves the card rendered — this repo has twice
shipped a `toHaveCount(0)` that was true of a blank page, and that shape is not repeated here.

### Verdict — `.11.13.8`: `CLOSED`

---

## `.11.13.7` — the `droppedRows` decision nothing could reach — `PARTIAL` · **major**

**Original finding (J1-5).** `attributeDroppedRows` and `pickLegacyStore` are pure and covered; their
**call site** lived in `readLegacyStores.ts`, which imports `expo-file-system`/`expo-sqlite` and
therefore cannot be loaded by the app-layer runner. Reverting the three attribution lines left every
suite green.

**What the fix did.** `apps/rn/src/data/legacyBridge/decodeCandidates.ts` — the loop, the pick and the
attribution with `readOne` injected; `readLegacyStores.ts:155` reduced to
`Object.assign(report, await decodeCandidates(walk.candidates, readOneDatabase))`.
`decodeCandidates.test.ts` (registered at `runAppTests.ts:172`) drives the real wiring with 14
assertions, including the no-pick case at `:70-81` asserting `droppedRows === 8`.

**Is the behaviour pinned now?** Yes for the *decision*. Both directions the finding named are
asserted, and each has its own case so the first plant does not mask the second (`:48` for the
false-positive direction, `:79` for the false-negative one).

**⛔ But the finding's own consequence is untouched, and I measured it.** `decodeCandidates.test.ts:66-68`
states the reason the no-pick branch reports everything: *"the no-pick case includes the user's own
database opening with every row undecodable — `migrateFromLegacy` then reads that as a fresh install,
and this counter is the only evidence anything was there."* **Nothing acts on the counter.** See Job 2
finding 1 — that is where the severity sits, and it is unchanged by this fix.

**One residue on the wiring itself:** `readLegacyStores.ts` is still loadable by no suite in the repo,
so the one line at `:155` remains unpinned. It is one line instead of three and it is a whole-object
assign rather than four field copies, which is the narrowest the shape admits — recorded, not filed.

### Verdict — `.11.13.7`: `PARTIAL` · **major** (the severity is carried by J2-1, not double-counted)

---

## A-J2-3 — `runMigrations` throws on a `null` goal row — `CLOSED`

`migrations.ts:108-111` drops any row that is not a plain object at the one seam all four lists pass
through, and records `(a row could not be read)`. **Measured:** a `raw-v17` blob with `goals: [null]`
returns `ok: true` with one `goal` repair rather than throwing; a blob with all four lists poisoned
returns four repairs, one per entity.

**Pinned?** `persistenceLifecycle.test.ts:259` — `eq(a.quarantines.length, 0, …)` — asserts the
**hydrate** door specifically, which is the branch that used to quarantine the whole portfolio and set
`data-reset`. It reds on the original defect. `:235` (`every dropped row is REPORTED, by entity`) is
the assertion that catches a fix that drops silently, which is how the *first* cut of this fix failed.

### Verdict — A-J2-3: `CLOSED`

---

## B-J2-1 — a restore on the data-reset screen — `CLOSED`

Fixed **inside `importStore`**, not at the call site: `apps/rn/src/store/store.ts:836` —
`if (get().storageError === 'data-reset') set({ storageError: null });`

**Preserved?** The over-match to look for was `read-failed`, and it is not present: the guard is
`=== 'data-reset'` only, and `persistenceLifecycle.test.ts:143` asserts an import does **not** clear
`read-failed` — correct, because `bootstrapPersistence` installs no autosave on that path
(`persistence.ts:73-76`), so the banner is the only signal that nothing is being written down. I
checked the other five `importStore` callers (`_layout.tsx:228`, `DataResetScreen.tsx:92`,
`BackupSheets.tsx:164`, `use-cloud-backup.ts:159`, `persistence.ts:203`): none of them can run while
`storageError` is `data-reset` except the two on that screen, so the clear cannot fire where it would
hide a live error.

**And the restore is durable.** `runMigrations` always produces a fresh `prefs` object, so
`state.store.prefs !== prev.store.prefs` at `persistence.ts:100` is always true after an import — the
write is **immediate**, not debounced. A force-quit inside the debounce window cannot lose a restore.
(Read, not measured on device.)

**Pinned?** `apps/rn/tests/e2e/data-recovery.spec.ts:216-259`. The load-bearing assertion is `:246`,
`expect(getByTestId('data-reset')).toHaveCount(0)`, and it reds on the original defect — the panel
stays mounted. Every assertion before it passes on the defect, so nothing reds earlier. The spec polls
storage rather than navigating, because `seedCorrupt` uses `addInitScript` and a `goto` re-injects the
corrupt bytes; I confirmed that is what `seedCorrupt` does.

### Verdict — B-J2-1: `CLOSED`

---

## B-J2-2 — the destructive file restore never showed the backup's date — `CLOSED`

`readBackup.ts:103` and `:115` carry `exportedAt` onto `ReadBackupSuccess`; `describeBackup` appends
`Saved <formatBackupTime(…)>.` at `:150`; `BackupSheets.tsx:178` renders it on the *"Replace your
data?"* sheet whose subtitle is *"This overwrites everything currently in the app. It can't be undone."*
`backup.ts:43`'s docstring is now true. `formatBackupTime` was lifted out of `CloudBackupSheet.tsx`
into `apps/rn/src/data/formatBackupTime.ts` so both doors format identically.

**Preserved?** Measured across all three kinds. An envelope with **no** `exportedAt` lands `''` at
`backup.ts:198`, which is falsy at `readBackup.ts:183`, so the field is omitted and the sentence claims
no date — *"This backup has 0 debts, 0 expenses and 0 goals."* A bare `raw-v17` store likewise carries
none. Nothing is invented in the absent case.

**Pinned?** `readBackup.test.ts:288-319`, three blocks, one per kind. `:294`
(`text.includes('Saved')`) carries the finding; `:292` fires first on the original defect, which is the
same finding one layer earlier. `apps/rn/tests/e2e/backup.spec.ts:120` asserts `Saved` reaches the real
confirm sheet.


⚠️ **The same change introduced a new defect on the same screen — Job 2 finding 2.**

### Verdict — B-J2-2: `CLOSED`

---

## B-J2-3 — the migration audit cannot see goal money — `PARTIAL` · **major**

**What the fix did, and it is real.** `invariants.ts:90` adds
`GOAL_MONEY_FIELDS = ['targetAmount','currentAmount','priorityPerPaycheck']` and `:110` runs the check
over `o.store.goals`. `corpus.ts:63` corrects the healthy goal from the never-persisted `target` to the
shape v1.6 actually stores, and `:179-180` adds `goals[0].targetAmount` and `goals[0].currentAmount` to
the nested-damage axis.

**Measured:**
- **60 of 522** generated cases now target a goal (20 top-level × `goals`, 20 × `targetAmount`,
  20 × `currentAmount`), where before there were 20 that could not touch a money field.
- **50 of 522** produce a `goal` repair record — the corpus really is damaging goal money.
- `moneyKeepsItsType` fires correctly on a string goal `targetAmount` **and** on a string
  `priorityPerPaycheck`: `probe → goals[0].targetAmount is string ("1000")`.

**⛔ But the branch where both real money defects lived is still judged by nothing** — see Job 2
finding 3. Deleting the entire goal stand-down loop produces **zero** invariant violations, measured.
And `invariants.ts:86-88`'s stated reason for not putting the pace in the corpus —
*"not reachable through either audited door today — it is a v1.7 field and both doors take v1.6
shapes"* — is **false as measured**: the `goal-pace-unreadable-on-a-priority-goal` fixture in
`hostile-v16-cases.json` reaches the stand-down through **both** doors, and a hand-planted pace in a
v1.6-shaped blob passes straight through `mapLegacyStore`'s `goals: 'goals'`.

### Verdict — B-J2-3: `PARTIAL` · **major**

---

## B-J1-1 / B-J1-2 — the CSV APR cells — `ALREADY-CLOSED-ELSEWHERE`

Closed before `6736a64` (`git diff 6736a64..c8d54fa -- packages/core/imports/` is empty). Re-measured
through the real `parseDebtCsvText` because the prior finding was that two of three assertions were
vacuous:

| APR cell | outcome |
|---|---|
| `$` | refused — *"could not read APR"* |
| `","` (quoted, as `testDebtCsv.ts:275` now writes it) | refused — *"could not read APR"* |
| `"$,"` (quoted) | refused — *"could not read APR"* |
| `,` **unquoted** (the old vacuous form) | refused — *"dueDate is required"* — the column shift, confirmed |
| spaces only | accepted at 0% |
| `-5` | refused — *"APR must be between 0 and 100"* |

`testDebtCsv.ts:274-282` now asserts **the reason**, not just the refusal, so the column-shift
masking cannot come back. Verdict holds.

---

# Job 2 — sweep for blocker + major

**Four findings, all `major`. No blocker.** Finding 1 is a blocker if a single unmeasurable
precondition turns out to be true on a device; the promotion condition is stated in the finding.

---

### 1. A WebKit container that opens cleanly and decodes to nothing is called "a fresh install", and the counter that says otherwise is read by no one — **major**

**User-facing consequence:** An upgrader whose v1.6 database opens but whose rows do not decode is told
nothing, has their empty v1.7 store written over the one condition the retry depends on, and their
entire v1.6 portfolio becomes permanently unreachable while the app behaves as though they had just
installed it.

**Mechanism — measured, not read.** `isConfirmedFreshInstall`
(`apps/rn/src/data/legacyBridge/migrateFromLegacy.ts:82-96`) consults `truncated`, `visited`,
`opened.length === candidates.length` and `opened.every(o => !o.error)`. It consults **neither
`droppedRows` nor `opened[].rows`**. I drove the real `decodeCandidates` → `migrateFromLegacy` chain
with one candidate that opens without error, reports 22 rows and decodes 0 of them:

```
decodeCandidates => {"opened":[{"path":"/c/db.sqlite3","rows":22,"legacyKeys":0}],
                     "store":null,"droppedRows":22,"droppedRowsOtherCandidates":0}
isConfirmedFreshInstall(report) = true
migrateFromLegacy       => { migrated:false, reason:"no v1.6 store in this container (a fresh install)",
                             terminal:true }
```

A genuinely empty container (0 rows, 0 dropped) produces **byte-identical** `migrated`/`reason`/
`terminal`. The two are distinguishable only by `rows` and `droppedRows`, and nothing looks at either.

The consequence chain, verified in `apps/rn/src/store/persistence.ts`: `terminal: true` → `:195`
returns `{ seed: true }` → `hydrate` seeds an empty store → `adapter.read()` is no longer `null` → the
bridge, whose idempotence is structural, never runs again. And because `terminal` is true, `:186`'s
`reportError` breadcrumb is **skipped**, so there is not even a Sentry signal. `describeMigrationLosses`
(`persistence.ts:132-156`), the only consumer of `droppedRows`, is called at `:201` on the
`migrated === true` branch only — so on the one path this counter exists for, it reaches nobody.
The one other renderer, `summariseLegacyRead` (`report.ts:70`) via `LegacyBridgeProbeReadout`
(`more.tsx:435`), is behind `qaEnabled()` at `more.tsx:384`; after the P6.17 `QA_TOOLS` flip
(`config/qa.ts:9,24`) and in any production web export where `__DEV__` is false, it does not exist.

**Confidence: measured for the code path; the trigger needs a device.** `decodeWebKitValue` returns
`null` only when `toBytes` recognises none of `Uint8Array` / `ArrayBuffer` / `number[]` and the value is
not a string (`webkitLocalStorage.ts:46-52,142-147`). I read the **real** captured iOS 26.2 container
through `node:sqlite`:

```
rows in ItemTable: 22 · value column representations: {"Uint8Array":22} · keys: {"string":22}
decoded keys: 22 · legacy keys: 22 · DROPPED: 0
IF the driver returned BLOBs as {type:"Buffer",data:[…]} → decoded keys: 0 · dropped: 22
```

So under `node:sqlite` there is no loss — and **the failure, if the on-device driver's BLOB
representation differs, is all-or-nothing**, because the representation is a property of the driver and
not of the row. That is exactly the input shape that triggers this branch. Nothing in the repo pins
`expo-sqlite`'s BLOB return type: `realContainer.test.ts` re-implements the read over `node:sqlite`
precisely because the expo modules cannot be loaded off-device.

**Would anything catch it?** No. **Every** `LegacyReadReport` fixture in the repo hard-codes
`droppedRows: 0` — `migrateFromLegacy.test.ts:45`, `interruption.test.ts:46,130,152`,
`persistenceLifecycle.test.ts:377,414,446`, `migrationAudit/doors.ts:41`,
`readLegacyStores.web.ts:22`. `interruption.test.ts:141-155` is the file that pins the
terminal/non-terminal split, and its "clean" fixture is `candidates: []`, `opened: []` — the case where
nothing was found at all, not the case where something was found and yielded nothing. There is no
fixture anywhere with `rows > 0` and `dropped === rows`.

**Promote to `blocker` if** a real `expo-sqlite` read on an upgraded device returns `ItemTable.value` as
anything other than a `Uint8Array`/`ArrayBuffer`/number array. That is one `console.log` on the existing
device probe.

---

### 2. The confirm screen in front of an irreversible overwrite invents a date for a file whose date it could not read — **major**

**User-facing consequence:** A user restoring over a live portfolio is told *"Saved recently"* — or a
specific wrong date — about a backup whose timestamp the app could not read at all, on the one screen
standing between them and an unrecoverable overwrite.

**Mechanism.** `formatBackupTime` (`apps/rn/src/data/formatBackupTime.ts:16`) returns the literal
string `'recently'` when the ISO does not parse. That fallback was written for
`CloudBackupSheet`, where the input is a filesystem mtime and always valid. `describeBackup`
(`readBackup.ts:150`) now routes an **arbitrary user-supplied file's** `exportedAt` through the same
function. Measured:

| `exportedAt` in the file | the sentence on the *"Replace your data?"* sheet |
|---|---|
| `"garbage"` / `"yesterday"` / `"not-a-date"` / `"2026-13-45"` | `… Saved recently.` |
| `"0"` | `… Saved 1/1/2000 at 12:00 AM.` — a **specific** wrong date |
| absent | `…` (no claim — correct) |

Both doors reach it. `detectBackupFormat.ts:44` requires only `typeof o.exportedAt === 'string'` to call
a blob a v1.6 file, and `backup.ts:198` carries any string through for an envelope; only the empty
string is filtered, at `readBackup.ts:183`.

⚡ **The module's own docstring forbids exactly this.** `readBackup.ts:43-45`: *"absent means absent. A
bare `raw-v17` store is not an envelope and carries no date; **inventing one would be a claim about a
file nothing knows anything about, on the screen where being wrong is least recoverable**."* The absent
case obeys that rule; the unparseable case does not.

**Confidence: measured.**

**Would anything catch it?** No. `readBackup.test.ts:288-319` covers a valid envelope date, a valid v1.6
date and the absent case. There is no unparseable-date case, and `formatBackupTime` has no test file of
its own — `git grep formatBackupTime` returns three files, none of them a test.

*(Not a blocker: it needs a hand-edited, third-party or corrupted file, since both versions of this app
write `new Date().toISOString()`. But that population is precisely the one `readBackup` exists for.)*

---

### 3. Deleting the goal stand-down — "the only finding in that pass that reaches a user's money" — violates none of the eight invariants — **major**

**User-facing consequence:** The instrument built to prove a restore cannot corrupt the user's money
runs 554 cases across two doors and still cannot see the branch that decides whether every spare dollar
of a paycheck is redirected away from their debt, so that defect can be reintroduced with the whole
audit green.

**Mechanism — measured.** `migrations.ts:258-318` stands a goal down when
`priority === true && priorityPerPaycheck === 0`, because `0` is the **uncapped** value
(`migrations.ts:222-234` cites `allocatePaycheck.ts:632` and `recommendedActions.ts:80`). The hostile
fixture `goal-pace-unreadable-on-a-priority-goal` **does** reach that branch — through both doors:

```
in   goals[0] = { …, priority:true, priorityPerPaycheck:"not a number" }
out  goals[0] = { …, priority:false }   (both import and webkit doors, identical)
     repair: 'the per-paycheck amount could not be read, so it is no longer funded ahead of your debt'
```

I then simulated the un-fix — the loop deleted, so `priority` stays `true` and `priorityPerPaycheck`
stays at the repaired `0` — and ran `checkAll` over it:

```
as shipped, violations: []
with the stand-down DELETED, violations: 0  []
goal after the simulated un-fix => { …, "priority":true, "priorityPerPaycheck":0 }
```

`moneyKeepsItsType` passes because `0` is a finite number. `idempotent` and `repairsAreNotRepeated`
pass because the second pass over a finite `0` records nothing. **Zero of eight fire.**

**And the generated corpus never enters the branch at all** — measured: **0 of 522** cases produce a
goal carrying `priorityPerPaycheck`, and **0 of 522** hit the stand-down. The reason is written into
`invariants.ts:86-88`: *"`priorityPerPaycheck` … is not reachable through either audited door today —
it is a v1.7 field and both doors take v1.6 shapes."* **That premise is false**, and it is
load-bearing — it is the stated justification for `corpus.ts:176-181` not adding the field to the
nested-damage axis. `mapLegacyStore` carries `goals` straight across, so a goal object in a v1.6-shaped
blob passes any field it likes through both doors; the hostile fixture proves it, one directory over.

**Confidence: measured.**

**Would anything catch it?** Only `persistenceLifecycle.test.ts:655-670` and
`data-recovery.spec.ts:289-304`, both written by hand for this specific defect — which is the same
situation `migrations.ts:202-212` records for the *previous* two goal-money defects: *"both found by
people reading rather than by this."* The instrument still has not found one.

---

### 4. `hostile.test.ts` has no non-vacuity control, and it is the one harness whose corpus can be refused wholesale — **major**

**User-facing consequence:** The adversarial suite that judges 32 hand-built hostile v1.6 states can be
reduced to testing nothing by any tightening of `detectBackupFormat` or `mapLegacyStore`, and it will
report *"32 states × 2 doors × 8 invariants"* passing while every case was refused at the door.

**Mechanism.** `apps/rn/src/data/migrationAudit/hostile.test.ts:44-75` has two floors —
`CASES.length >= 20` at `:47` and *"has a blob"* at `:53` — and then `assert(violations.length === 0)`
at `:72`. Every invariant in `checkAll` short-circuits on `!o.store` (`invariants.ts:60,93,121,163,175`),
and `importDoor`/`webkitDoor` set `store: null, refused: true` when the door declines
(`doors.ts:58,87`). **A refused corpus produces zero violations, which is the pass condition.** The
`drift` counter at `:61` is likewise gated on `viaFile.store && viaKeys.store`.

Its sibling `audit.test.ts:62-68` has exactly this control — `if (!controlFile.store) throw new
Error('FAIL [the healthy control was REFUSED by the import door — the corpus is vacuous]')` — with the
comment *"A corpus that refuses EVERYTHING satisfies every invariant vacuously."* `hostile.test.ts` has
none.

**Confidence: measured — and the corpus is NOT vacuous today.** I fed all 32 fixtures through the real
detection path and both doors:

```
branch tally: {"v16-file":32}
importDoor produced a store for 32/32; refused 0
webkitDoor produced a store for 32/32
violations across hostile corpus: 0
```

So this is a missing guard, not a live blindness. It is filed as `major` under the brief's own rule —
*a gate or test that cannot catch the class it exists for* — because this repo has now shipped that
exact shape three times (`.11.13.4`, `.11.13.6`, and the `route-smoke` fixture), and `.11.13.6`'s
version of it was a **refusal at `detectBackupFormat`**, which is the same door these 32 fixtures pass
through.

---

## Swept and found clean

At the blocker/major bar, in my surface. Extending last round's ratchet — none of these overlap it.

- **`detectBackupFormat.ts` against a truncated file.** Measured at 25 / 50 / 90 / 99.9 % truncation of
  a real `serializeBackup` output: **refused as `not-json` at every cut.** No partial parse, no partial
  restore.
- **A backup from a NEWER version.** Measured: an envelope with `storeVersion: CURRENT + 5` is refused
  `too-new`; `formatVersion: 2` is refused `too-new`; the version guard runs before the shape guard, so
  a future envelope cannot be reported as "incomplete". *(A hand-built bare `raw-v17` with a future
  `storeVersion` is still accepted and stamped down to 7 with unknown fields carried by `...r` —
  measured. Not filed: no build of this app has ever written that shape, and the pre-5.8 clipboard
  export is by definition older, not newer. Recorded so the next round need not re-derive it.)*
- **Right shape, wrong `storeVersion`.** An envelope declaring `storeVersion: 1` migrates forward to 7
  correctly; `parseBackupValue` reads the store's own version when the envelope omits it
  (`backup.ts:181-186`), so deleting one field cannot slip a future store past.
- **Two restores in a row / a double-tapped "Replace my data".** `runMigrations` is idempotent on its
  own output (`idempotent` + `repairsAreNotRepeated` invariants, both green across 554 cases), and
  `pendingDataRepairs` is deduped by `entity|id|field` at `migrations.ts:354-365`, so a second commit
  cannot stack a repair.
- **A restore interrupted mid-write.** `runMigrations` always allocates a fresh `prefs`, so
  `persistence.ts:103`'s prefs branch fires on every `importStore` and the write is **immediate rather
  than debounced** — a force-quit inside the 500 ms window cannot lose a restore. The legacy bridge
  writes the blob *before* importing (`persistence.ts:202-203`), so a crash between them leaves storage
  correct and the source untouched; `interruption.test.ts:64-84` pins both halves.
- **An iCloud copy arriving while a local write is in flight.** `restoreFromCloud` stats **before** it
  reads (`cloudBackup/service.ts:164-165`), so a file that changes underneath the read leaves the
  *earlier* mtime as the claim — which makes the next `inspectRemote` say `unclaimed` and **ask**,
  rather than say `ours` and silently overwrite. `inspectRemote` compares with `===` and never
  collapses `unknown` into `none`.
- **The v1.6 bridge is non-destructive by construction.** `readLegacyStores.ts:52-111` copies each
  database aside with its `-wal`/`-shm` siblings under a per-candidate name, opens the copy, and
  deletes copy and sidecars in a `finally`; nothing writes to, deletes or opens the source. Re-read in
  full after the `decodeCandidates` extraction — the extraction moved only the loop, and
  `readOneDatabase`'s error paths are unchanged.
- **`decodeCandidates` conservation.** Measured across the five cases in its test plus my own: the
  picked count plus the other-candidates count always equals the total, empty input returns `{0,0}`,
  and a candidate that never decoded contributes nothing.
- **The CSV import door end to end.** `ImportDebtsSheet.tsx` parses first and applies on a second tap;
  ids are minted at apply, not at preview (`:74-82`), through `mintDebtIds`'s batch accumulator;
  `addDebt` per row rather than a bulk write, so BNPL normalisation and id stamping keep one owner. The
  date-format rule is stated in the sheet's own caption (`:128-131`). Writes go through
  `useActiveStore()`, so a demo cannot reach the real store.
- **`describeStoreContents` as one owner for both doors.** The export sheet and the import confirm now
  count identically (`backup.ts:114-122`), and the sentence carries counts, never amounts — checked
  against the comment's own reason.
- **`RecoveryPlanSection`'s cover-now truncation.** `summariseNames` is used at the render site
  (`:45`), the `Pressable` is `disabled` when there is nothing behind it, and it is pinned by both a
  unit test (`utils/format.test.ts`) and an e2e that asserts the **11th name** is absent rather than a
  length (`recovery.spec.ts:45-68`, assertion at `:63`) — the non-vacuous form.
- **Test registration.** `decodeCandidates.test`, `hostile.test`, `audit.test`, `interruption.test`,
  `readBackup.test`, `realContainer.test` are all registered in `runAppTests.ts` (`:172,186,225,229,233,238`).
  No new file was added and left unregistered.

---

## Could not determine

- **Whether `expo-sqlite` on a real device returns `ItemTable.value` as a `Uint8Array`.** This is the
  single precondition that decides whether finding 1 is a `major` or a `blocker`. `realContainer.test.ts`
  reads the captured container through `node:sqlite` (which returns `Uint8Array`, measured), and
  `readLegacyStores.ts` cannot be loaded by any suite. **One log line on the existing device probe
  answers it**, and it is the thing I would most want measured before ship.
- **The iOS `Save as a file` export path.** `BACKUP_FILE_SUPPORTED` is `false` in `backupFile.web.ts`,
  so the web suite only ever exercises the clipboard branch — `backup.spec.ts:166` asserts
  `form-sheet-submit` reads *"Copy to clipboard"*, which is the **web** primary. The iOS primary
  (`exportBackupFile` → `Sharing.shareAsync`) has no testID and no spec, before or after this change.
  Not a regression; an untested shipping path.
- **`expo-document-picker`'s `copyToCacheDirectory` against an iCloud Drive provider**, for both the
  CSV and the backup file doors. `csvImportFile.ts` / `backupFile.ts` are native-only and their `.web.ts`
  forks return `ok: false`, so nothing in the repo reaches either. Confirmed still unreached — the
  module's own docblock names it as a P6.14 device row.
- **How the confirm sentence wraps at the largest Dynamic Type sizes** now that it carries a date as
  well as counts. `fontScale` is pinned to 1 on react-native-web and no captured frame in
  `apps/rn/capture-ref/` shows either backup sheet.

