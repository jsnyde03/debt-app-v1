# C — CSV import and the legacy bridge

Independent re-verification, per `docs/audits/2026-08-25-p6.8.9.7.11.9-reverification/BRIEF.md`.

**Range** `3dc3c22..4877d90` · **subject** 7 files, 157 insertions / 14 deletions.

| file | hunk-group |
|---|---|
| `packages/core/imports/debtCsv.ts` | C-A — the APR percent-sign re-fix |
| `packages/core/imports/testDebtCsv.ts` | C-B — the new APR assertions |
| `apps/rn/src/components/entities/ImportDebtsSheet.tsx` | C-C — the date-format caption |
| `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts` | C-D — `attributeDroppedRows` extracted |
| `apps/rn/src/data/legacyBridge/readLegacyStores.ts` | C-E — attribution after the pick |
| `apps/rn/src/data/legacyBridge/report.ts` | C-F — the field's contract |
| `apps/rn/src/data/legacyBridge/webkitLocalStorage.test.ts` | C-G — the new attribution assertions |

Sections are appended as each group is finished. Nothing here was run — read-only inspection only,
as the brief requires.

---

## C-A — `debtCsv.ts`: one trailing `%`, and the two messages

`packages/core/imports/debtCsv.ts:253-281`.

### What changed

`packages/core/imports/debtCsv.ts:265-267` replaces a global `%` strip with a single trailing-sign
strip plus a "stripped to empty is not blank" guard, and `:274-281` splits the one refusal branch into
two, choosing the message from the parse rather than from a second `Number()` re-read.

### 1. Does it preserve what the site did before?

Enumerated in both directions against the base (`git show 3dc3c22:packages/core/imports/debtCsv.ts`,
`const apr = parseOptionalAmount(rawApr.replace(/%/g, ""))`):

**Newly REFUSED (was accepted):**

| cell | before | now |
|---|---|---|
| `%` | `""` -> `parseOptionalAmount` returns `0` (`packages/core/utils/amountField.ts:55`) -> imports at **0% APR** | `null` -> row refused. **Correct — this is the fix.** |
| `1%2` | `"12"` -> imports at **12%** | `null` -> row refused. **Correct.** |
| `%19.99` (percent-first, written that way in tr/fa locales) | `19.99` | refused |
| `19.99%%`, `19%.99`, any non-trailing sign | stripped and accepted | refused |

**Newly ACCEPTED (was refused):** none. The accept set strictly narrowed.

The percent-first narrowing is defensible for the shipping storefronts — `packages/core/utils/amountField.ts:21`
pins the app to US/CA/AU/NZ, all of which write `19.99%` — but it is a real narrowing that no comment
mentions and no test covers, so it is recorded rather than waved through.

**Preserved and verified:** blank -> `0` (`packages/core/imports/debtCsv.ts:267` short-circuits only when `rawTrimmed !== ""`, so `""`
still reaches `parseOptionalAmount("")` -> `0`); `19.99%` -> `19.99`; `19.99 %` -> the trailing strip
then `.trim()` at `:266` leaves `"19.99"`; `$19.99%` -> `normalize` strips `$`; `150` -> out of range;
`abc` -> unreadable.

### 2. Environments

No date, no timezone, no locale formatting. The new `— got ${apr}` at `:279` interpolates a JS number,
so it prints `1000` with no separator in every locale — consistent with the rest of the file's messages.
Pure `packages/core`, so identical on iOS and RNW.

### 3. Helper contracts

`parseOptionalAmount`'s contract is stated at `packages/core/utils/amountField.ts:49-51`: blank is `0`,
unparseable is `null`. The change reads it correctly for the `%` path. **It does not read it fully for
the other stripped characters** — see the defect below.

### 5-7. Findings

**DEFECT 1 (medium) — `normalize` still strips a cell to blank, and the guard does not see it.**
`packages/core/imports/debtCsv.ts:267` guards only the emptiness produced by removing the trailing `%`.
`parseOptionalAmount` then calls `normalize` (`packages/core/utils/amountField.ts:28`), which strips
`,`, whitespace **and `$`** — so an APR cell of `"$"`, `","`, `"$,"` or `"$ ,"` still cleans to `""`
and returns `0`. That is the identical silent-zero the hunk exists to close: a currency-formatted
empty APR column exports as `$` from a spreadsheet and imports as a 0% card.
The docblock at `:254` states the general rule — *"a cell that strips to nothing is UNREADABLE, not
blank"* — and the code delivers it for exactly one of the four stripped characters. **The comment
overclaims what the line does.** Nothing in `packages/core/imports/testDebtCsv.ts` covers `"$"` as an
APR.

**DEFECT 2 (low, but it is the same class the hunk claims to have fixed) — a negative APR is now
reported as unreadable.** `parseOptionalAmount` returns `null` for any `n < 0`
(`packages/core/utils/amountField.ts:57`). So `-5` takes the `apr === null` branch at
`packages/core/imports/debtCsv.ts:274` and the user is told *"could not read APR "-5" — leave it blank
for 0%."* Before this diff, the message was chosen by re-parsing (`Number("-5")` is finite), which
produced *"APR must be between 0 and 100"* — the **accurate** message for `-5`.
The docblock at `:272` asserts *"`apr === null` IS unreadable; `apr > 100` IS out of range"*. That is
false: `null` also carries the entire negative range. The change removed a false message on `%` and
introduced a false message on `-5`. **REGRESSION**, narrow but real, and unpinned in either direction.

**What is now possible that nothing checks:** the accept-set narrowing above (`%19.99`, `19.99%%`) is
observable only by a user pasting such a cell; no assertion, gate or e2e names it.

### Verdict — C-A: `DEFECT`

Correct on the two inputs it targets, and both of them are now pinned. But the fix is partial in one
direction (`"$"` -> 0%) and the message split regresses in the other (`-5` reported as unreadable),
and its own docblock states both properties as guarantees it does not deliver.

---

## C-B — `testDebtCsv.ts`: the three new APR assertions

`packages/core/imports/testDebtCsv.ts:244-267`.

### 5. Would each new assertion fail on the defect it claims to pin?

| assertion | what it measures | fails on the defect? |
|---|---|---|
| `packages/core/imports/testDebtCsv.ts:252` — `eq(r.debts.length, 0, ...)` for `apr = "%"` | the row is refused | **Yes.** With the base code `"%"` -> `""` -> `0` and the row imports, so `debts.length` is `1`. |
| `:253-256` — `errors.some(e => e.includes("could not read APR"))` | the message is the unreadable one, not the range one | **Yes**, and it is the discriminating half: the base emitted *"must be between 0 and 100"* here. |
| `:259-260` — `eq(r.debts.length, 0, ...)` for `apr = "1%2"` | a mid-string `%` does not concatenate | **Yes.** Base imported it at 12%. |
| `:264-266` — `19.99 %` accepted with value `19.99` | the preserved property | Yes for an over-strip that also removed the space handling. |

**Not vacuous.** `debts.length === 0` could be true for an unrelated refusal (a bad name, balance or
date), but the positive control is present two blocks up: `:240-242` parses the same row with
`apr = 19.99%` and asserts `errors.length === 0` and one debt. Every other cell in the fixture is
therefore proven acceptable, so the zero is attributable to the APR cell.

**The naive over-fix is excluded.** The obvious minimal change — keep the global `%` strip and add
"stripped to empty means null" — would pass `:252` and `:253` but **fails** `:259`, because `"1%2"`
still cleans to `"12"`. The pair discriminates; either test alone would not.

**Registered:** `packages/core/testing/runRegressionTests.ts:40` imports `@core/imports/testDebtCsv`,
which is `npm run test:regression`, inside `validate:release:rn`. It goes red — `assert` throws
(`packages/core/imports/testDebtCsv.ts:21`).

### 7. Gaps these leave open

- `:259` asserts only the count, not the message. A future change that refused `1%2` with the *range*
  message would keep this green — the exact confusion `:253` was written to catch, one input along.
- Nothing covers **DEFECT 1** of C-A (`apr = "$"` -> silent 0%) or **DEFECT 2** (`apr = "-5"` reported
  as unreadable). Both are one-line additions to this same block.
- Nothing covers the new `— got ${apr}` suffix; the pre-existing `:151` assertion only matches the
  substring `between 0 and 100`.

### Verdict — C-B: `SOUND`

The assertions are real, discriminating, non-vacuous, and registered in the aggregate run. They pin
the two inputs the fix targets and leave the two inputs the fix got wrong unpinned.

---

## C-C — `ImportDebtsSheet.tsx`: the date format in the in-app copy

`apps/rn/src/components/entities/ImportDebtsSheet.tsx:118-131`.

### 1. Is the new claim true of the parser?

Yes. `packages/core/imports/debtCsv.ts:232-235` refuses a row with no `dueDate`, and `:226-231`
refuses anything that is not `^\d{4}-\d{2}-\d{2}$` **and** does not survive
`toLocalISODate(parseLocalDate(...))`. So `9/1/2026` refuses every row, and before this hunk the
caption at `apps/rn/src/components/entities/ImportDebtsSheet.tsx:129` listed the column names and nothing about their format. The copy now matches the
code. The placeholder at `apps/rn/src/components/entities/ImportDebtsSheet.tsx:36` already showed `2026-09-01`, so this states in words what the
placeholder only implied.

Nothing else the caption said was dropped: the column list and the "APR can be left blank for 0%"
sentence are both still present at `:129-131`.

### 2. Environments

The JSX text spans two source lines (`:129-130`); JSX collapses the newline plus indentation to a
single space, so it renders as one sentence — confirmed in the local web bundle, which contains the
flattened literal (`apps/rn/dist/_expo/static/js/web/index-*.js`, gitignored per `.gitignore:53`,
so evidence only, not an artifact of the commit). No platform-divergent props, no `fontScale`
dependency, no measurement. Colour comes from `c.text.secondary` and `textStyles.caption`, both
unchanged, so `lint:contrast` and `lint:type-scale` see the same pair they already passed. The sheet
body is inside a `ScrollView` (`apps/rn/src/components/ui/FormSheet.tsx:164`), so the extra line
scrolls rather than pushing the input off a 402x874 viewport.

### 4. Side effects

None — a static string in a render body.

### 6-7. What would catch a regression?

**Nothing.** `apps/rn/tests/e2e/csv-import.spec.ts` is unchanged in this range and never reads the
caption; its locators are `csv-import-input`, `-summary`, `-skipped`, `-error`, `-file`, `-back`
(`apps/rn/tests/e2e/csv-import.spec.ts:31,55,88,100,111`). No `strings-inventory`/`check-copy-owners`
pairing names this file (`scripts/check-copy-owners.ts:41-70` lists only the three onboarding sites).
Deleting the sentence goes green everywhere. The missing test is one line in the existing
`paste()` flow: assert the sheet's caption contains `YYYY-MM-DD` before filling the input.

### A false claim in the comment

`apps/rn/src/components/entities/ImportDebtsSheet.tsx:125` states *"`site/support.html` has said this
since it was written"*. It has not. The sentence *"Dates must be written as `YYYY-MM-DD`"* is
`site/support.html:286`, and `git log -S "YYYY-MM-DD" -- site/support.html` returns exactly one
commit: **`3dc3c22`** — the base of this very diff, i.e. the immediately preceding pass. The file
itself dates to `4d48ec8` (v1.4). The support page and the app copy were out of step for **one
commit**, not for the life of the site. The rationale for the change is unaffected; the historical
claim beside it is wrong, and it is the kind that decays with nothing edited.

### Verdict — C-C: `SOUND-UNPINNED`

The copy is accurate, complete and safely rendered on both platforms. Nothing in the repo would
notice its removal, and the docblock beside it carries a provenance claim that the history contradicts.

---

## C-D — `webkitLocalStorage.ts`: `attributeDroppedRows` extracted

`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:199-224`.

### The function itself

`:213-224` is pure, allocation-free, order-independent and total: every element lands in exactly one
of the two accumulators, so `droppedRows + droppedRowsOtherCandidates` always equals the input sum.
Empty input returns `{0, 0}`. It honours the extraction claim at `:203-208` — nothing about it needs
a device.

Two contract notes, both low-risk but neither stated:

- **It matches on the path STRING, not on the candidate object** (`:220`). The caller has the picked
  object in hand and passes `report.store?.path`
  (`apps/rn/src/data/legacyBridge/readLegacyStores.ts:169`). If the walk ever yields the same
  `sourceUri` twice, both entries are attributed to the user. `readLegacyStores.ts:59-60` records
  that the two WebKit layouts share the *basename* `localstorage.sqlite3` — the full uri differs, so
  this is not currently reachable, but the function is a public export and the invariant is unwritten.
- **`dropped` is not purely "undecodable".** It is computed as
  `rows.length - Object.keys(items).length` (`apps/rn/src/data/legacyBridge/readLegacyStores.ts:92`),
  and `decodeItemTable` also collapses duplicate keys and skips empty ones
  (`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:165-175`). Any of those becomes a
  *"row of your old data could not be read"* in front of the user. Pre-existing, unchanged by this
  diff, and now more visible because this hunk exists to make that number mean exactly one thing.

### REGRESSION — `pickLegacyStore` lost its docblock

At the base, `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts` had the block *"Choose the v1.6
store from everything the probe opened…"* immediately above `export function pickLegacyStore`
(`git show 3dc3c22:apps/rn/src/data/legacyBridge/webkitLocalStorage.ts`, lines 192-199 of that
revision — block then declaration, adjacent).

The new function was inserted **between them**. The file now reads:

- `:192-198` — the `pickLegacyStore` docblock
- `:199-212` — the `attributeDroppedRows` docblock
- `:213` — `export function attributeDroppedRows(`
- `:226` — `export function pickLegacyStore<T extends LegacyStoreCandidate>(...)`, with **no
  docblock of its own**

TypeScript attaches leading doc comments to the declaration that follows them, so the paragraph
explaining *why ranking on legacy-key count is safe* and — the load-bearing part — that
*`null` MUST NOT be confused with "the read failed"* is now attached to the attribution helper, and
`pickLegacyStore` is undocumented. This is the brief's own flagship class in its purest form: the
comment beside `:213` does not describe the line beside it. `lint:comments`
(`scripts/check-comment-convention.ts`) polices meta-commentary and counts, not orphaned blocks, so
nothing goes red.

The displaced sentence also matters for C-E below: it is the one place that says a `null` pick means
"nothing of ours was here", and the new code at `:220` now reads that same `null` as "nothing of ours
was lost", which is a different claim.

### Verdict — C-D: `REGRESSION`

The function is correct. The insertion point detached a docblock from its subject, leaving the two
functions documented as each other — documentation-level, not behavioural, and invisible to every gate.

---

## C-E — `readLegacyStores.ts`: attribute after the pick

`apps/rn/src/data/legacyBridge/readLegacyStores.ts:143-171`.

### 1. The fix is real, and its blast radius is narrower than the comment says

The defect being fixed is genuine. `apps/rn/src/store/persistence.ts:154-155` turns `droppedRows` into
*"N row(s) of your old data could not be read and were not carried over"*, and the base summed
`result.dropped` across every candidate. `decodeItemTable` applies no `debtPlanner.*` filter
(`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:165-175`), so a second app's undecodable rows
were reported as the user's. Attributing after `pickLegacyStore` (`:159-170`) fixes that case exactly.

But the comment at `:161-167` says the old value *"told the upgrader"* the false number in the
second-database case, and that is only true when **a store was picked**. When `report.store` is
`null`, `migrateFromLegacy` returns `migrated: false`
(`apps/rn/src/data/legacyBridge/migrateFromLegacy.ts:127-146`), and
`apps/rn/src/store/persistence.ts:177-196` returns before `describeMigrationLosses` is ever called
(`:201`). So the user-facing line only exists on a successful migration, where the picked database is
by definition theirs. The fix is correct; the scenario it claims to have been showing users is one of
the two, not both.

### 7. What the change made possible — and nothing notices

**The `null`-pick case now reports zero loss where it used to report the real count.**
`attributeDroppedRows(decoded, undefined)` sends **everything** to the other-candidates bucket
(`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:220`). Walk the case:

1. The user's own v1.6 database opens cleanly, `ItemTable` returns 22 rows, and every one of them
   fails `decodeWebKitValue`. `decodeItemTable` returns `{}`, `dropped` is 22
   (`apps/rn/src/data/legacyBridge/readLegacyStores.ts:92`).
2. `countLegacyKeys` is `0`, so `pickLegacyStore` returns `null`
   (`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:226-236` — `count > bestCount` needs at
   least one).
3. `isConfirmedFreshInstall` is **true** — not truncated, `visited > 0`, every candidate opened, no
   errors (`apps/rn/src/data/legacyBridge/migrateFromLegacy.ts:82-96`) — so the outcome is
   `terminal: true`, *"a fresh install"*, the retry is consumed and the v1.6 data is abandoned. No
   `reportError` fires either: `apps/rn/src/store/persistence.ts:186` guards it on `!outcome.terminal`.
4. `droppedRows` — the one number that said "22 rows of this container did not decode" — is now `0`.

The signal survives only in `droppedRowsOtherCandidates`, and **nothing reads that field.**
`summariseLegacyRead` prints `dropped=${report.droppedRows}` and nothing else
(`apps/rn/src/data/legacyBridge/report.ts:62-69`); the Sentry breadcrumbs list `truncated`, `visited`,
`candidates`, `refused` and not this (`apps/rn/src/store/persistence.ts:187-193`); a repo-wide grep for
`droppedRowsOtherCandidates` returns only the producer, the type and the new test. So the QA probe
line for a total decode failure now reads `dropped=0`, indistinguishable from a genuine fresh install —
the precise distinction `apps/rn/src/data/legacyBridge/report.ts:9-13` says every field in this
interface exists to preserve.

The same erasure applies, more narrowly, to a **losing candidate that was still ours**:
`pickLegacyStore`'s own docblock anticipates *"a partially-written one loses to a complete one"*
(text now at `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:192-198`). Rows dropped from that
partial copy are the user's, and they are now filed under "everyone else's" and never shown.

The change traded a measured false positive for an unmeasured false negative. Only the false positive
was tested.

### Other checks

- **Preserved:** `report.opened` still gets a row per candidate including errors (`:148-153`); the
  per-candidate `dropped` still comes from `result.dropped ?? 0` (`:155`); `pickLegacyStore(decoded)`
  still receives objects satisfying `LegacyStoreCandidate` — the extra `dropped` member is fine under
  the generic `T extends LegacyStoreCandidate` at
  `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:226`.
- **Ordering:** the accumulation moved from inside the loop (`:150` at base) to after it (`:169`). A
  throw part-way through the loop now yields `droppedRows: 0` instead of a partial count. `readOneDatabase`
  catches its own failures and returns a record (`:98-99`), so this is theoretical.
- **Environments:** device-only file; `readLegacyStores.web.ts:22` is the web counterpart and is
  untouched, so it keeps `droppedRows: 0` and omits the new optional field — consistent with the
  "absent means not measured" contract.
- **Side effects:** none added; the function still never throws and still returns a report.

### 6. What would catch a regression in this wiring?

**Nothing.** There is no `readLegacyStores.test.ts` in
`apps/rn/src/data/legacyBridge/` (the directory holds `findLegacyStores.test.ts`,
`mapLegacyStore.test.ts`, `migrateFromLegacy.test.ts`, `realContainer.test.ts`,
`webkitLocalStorage.test.ts` and no test for this module), and `apps/rn/src/testing/runAppTests.ts:149-168`
registers exactly those five. Deleting `:169-171` and leaving `droppedRows` at its initialised `0`
(`:125`) keeps every suite green, because all seven report fixtures hard-code `droppedRows: 0`. The
extraction in C-D made the *arithmetic* visible; the *wiring* that calls it is as unpinned as it was
before.

### Verdict — C-E: `REGRESSION`

The named defect is fixed. In exchange, a total-decode-failure — the case where the number mattered
most and where the bridge silently classifies the container as a fresh install — now reports zero
loss, and the field created to hold that number reaches no consumer, no readout and no breadcrumb.

---

## C-F — `report.ts`: the field's contract

`apps/rn/src/data/legacyBridge/report.ts:30-49`.

### `droppedRows` (`:39`) — the rewritten docblock

The first sentence is now accurate to the code: *"Rows that would not decode in the database judged to
be ours"* is exactly what `attributeDroppedRows` computes
(`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:220`).

The second is a claim the code no longer supports: *"Non-zero means the migration is INCOMPLETE — …it
has to mean exactly that."* Non-zero still implies incomplete. **Zero no longer implies complete**, and
that is the reading a caller takes from a field documented this emphatically. Per C-E, a container whose
only database decoded to nothing reports `droppedRows: 0` and is then classified as a fresh install.
The docblock does not mention the `null`-pick case at all, and it is the case the change altered most.

### `droppedRowsOtherCandidates` (`:49`) — the claim the repo does not deliver

`:41-43` states the field is *"genuinely useful when `pickLegacyStore` chose wrong, which is the
failure this separation makes visible instead of hiding."*

**It makes nothing visible.** The field is written once
(`apps/rn/src/data/legacyBridge/readLegacyStores.ts:171`) and read nowhere. It is absent from
`summariseLegacyRead` — the only renderer of any of this — which prints
`dropped=${report.droppedRows}` and five other figures and stops (`:62-69`). It is absent from the
`legacy-bridge` breadcrumbs (`apps/rn/src/store/persistence.ts:187-193`). It is absent from the probe
readout, which shows only the summary string
(`apps/rn/src/components/more/LegacyBridgeProbeReadout.tsx:39`). Its only other appearance in the repo
is the new test. A diagnostic that no diagnostic surface prints is a value moved out of a user's way
and into nobody's — the separation **hides** the count rather than making it visible, which is the
opposite of what the docblock says. One line in `summariseLegacyRead` would make the claim true.

### `:45-47` — the optionality rationale, and its count

The reasoning for `?` is sound in itself: a required field forces a meaningless value into every
producer. The count is wrong in the direction that matters. Making it required would touch not only the
seven **test** fixtures (`apps/rn/src/data/legacyBridge/migrateFromLegacy.test.ts:45`,
`apps/rn/src/data/migrationAudit/interruption.test.ts:46,130,152`,
`apps/rn/src/store/persistenceLifecycle.test.ts:239,276,308`) but two **production** producers:
`apps/rn/src/data/legacyBridge/readLegacyStores.web.ts:22` and
`apps/rn/src/data/migrationAudit/doors.ts:41`, both of which build a whole `LegacyReadReport` literal.
Nine sites, described as seven fixtures.

`scripts/check-comment-convention.ts:60-72` names this exact form — *"a count is an assertion that goes
stale the moment anyone adds a member"* — but its `COUNTS` patterns require one of `call sites |
members | published values | instances | fences`, and this says `fixtures`, so the gate stays green on a
count that is already off.

### Verdict — C-F: `SOUND-UNPINNED`

The type change is correct and safe: an optional additive field breaks no producer, and `typecheck`
covers the shape. Two of the three claims written beside it — that zero means a complete migration, and
that the new field makes a mis-pick visible — are not delivered by any code in the repo, and no test or
gate reads the field at all.

---

## C-G — `webkitLocalStorage.test.ts`: the attribution assertions

`apps/rn/src/data/legacyBridge/webkitLocalStorage.test.ts:192-220`.

### 5. Name the assertion, state what it measures

| line | assertion | measures |
|---|---|---|
| `:206` | `eq(ours.droppedRows, 2, …)` | the picked path's own drops, not the sum |
| `:207` | `eq(ours.droppedRowsOtherCandidates, 7, …)` | the complement is retained, not discarded |
| `:211` | `eq(none.droppedRows, 0, …)` | `undefined` pick attributes nothing to the user |
| `:212` | `eq(none.droppedRowsOtherCandidates, 9, …)` | totals conserved |
| `:216-219` | one-candidate case still returns `3` | the ordinary upgrade path |

None is vacuous — `attributeDroppedRows` is a pure function called directly, `2` and `7` are distinct
so a swap or a sum (`9`) fails, and `:216` is a positive control proving the ordinary path is not
merely returning zero. `assert` throws on failure
(`apps/rn/src/data/legacyBridge/webkitLocalStorage.test.ts:33-36`), and
the file is registered at `apps/rn/src/testing/runAppTests.ts:149`, inside `npm run test:app` and
`validate:release:rn`. It **would** go red.

### The defect it names is not the defect it can fail on

The block header at `:194-199` states the defect precisely: *"it was summed across every candidate
database BEFORE `pickLegacyStore` decided which one was the user's."* That summing lived in
`readLegacyStores.ts` (`report.droppedRows += result.dropped ?? 0` at the base). This test does not
import `readLegacyStores`, and no test does — the directory has no test for that module and
`apps/rn/src/testing/runAppTests.ts:149-168` registers five legacy-bridge tests, none of them for it.

Reintroduce the defect — revert `apps/rn/src/data/legacyBridge/readLegacyStores.ts:169-171` to a sum
inside the loop and leave `attributeDroppedRows` exported and unused — and **every assertion here
still passes**. The extraction made the arithmetic visible; the assertions cover the arithmetic, and the
defect was never in the arithmetic. `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:203-208`
claims the extraction answers *"what could see this"*; what it produced is a test that sees the helper
and still cannot see the call site.

### One assertion label states a consequence that does not exist

`:211` reads *"no database judged ours → the user is told of NO loss, not of nine rows"*. When no
database is judged ours the user is told **nothing at all**: `report.store === null` makes
`migrateFromLegacy` return `migrated: false`
(`apps/rn/src/data/legacyBridge/migrateFromLegacy.ts:127-146`), and
`apps/rn/src/store/persistence.ts:177-196` returns before `describeMigrationLosses` runs at `:201`.
The label describes a user-facing comparison that no code path can produce, and the value it pins is
the one C-E identifies as the lost signal.

### Verdict — C-G: `WEAK-TEST`

Well-formed, non-vacuous, registered and red-capable against its own subject — but it cannot fail on the
defect its own header names, because that defect lives in an untested call site the test never loads.

---

## Tally

| hunk-group | verdict |
|---|---|
| C-A `debtCsv.ts` — APR percent-sign re-fix | `DEFECT` |
| C-B `testDebtCsv.ts` — new APR assertions | `SOUND` |
| C-C `ImportDebtsSheet.tsx` — date-format caption | `SOUND-UNPINNED` |
| C-D `webkitLocalStorage.ts` — `attributeDroppedRows` | `REGRESSION` |
| C-E `readLegacyStores.ts` — attribute after the pick | `REGRESSION` |
| C-F `report.ts` — the field's contract | `SOUND-UNPINNED` |
| C-G `webkitLocalStorage.test.ts` — attribution assertions | `WEAK-TEST` |

**Defects and regressions, severity order**

1. **The `null`-pick case now reports zero loss, and the field that holds the real number is read by
   nothing.** `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:220` ·
   `apps/rn/src/data/legacyBridge/readLegacyStores.ts:169-171` ·
   `apps/rn/src/data/legacyBridge/report.ts:41-43,49`. Trigger: a container whose only database opens
   cleanly and decodes to nothing.
2. **`apr = "$"` (or `","`) still imports as a silent 0%** while the docblock says a cell that strips
   to nothing is unreadable. `packages/core/imports/debtCsv.ts:254,267` ·
   `packages/core/utils/amountField.ts:28,55`.
3. **`pickLegacyStore` lost its docblock to the insertion.**
   `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:192-198` now precedes `:213`
   `attributeDroppedRows`; `:226` `pickLegacyStore` has none.
4. **The new test cannot fail on the defect its header names**, because the defect was in an untested
   call site. `apps/rn/src/data/legacyBridge/webkitLocalStorage.test.ts:194-199,200-220`.
5. **`apr = "-5"` is now reported as unreadable instead of out of range**, contradicting the docblock
   beside it. `packages/core/imports/debtCsv.ts:272,274`.
6. **False provenance claim:** *"`site/support.html` has said this since it was written"* —
   `apps/rn/src/components/entities/ImportDebtsSheet.tsx:125`; the sentence at `site/support.html:286`
   was added in `3dc3c22`, the base of this diff.
7. **A stale code count:** *"seven fixtures"* at `apps/rn/src/data/legacyBridge/report.ts:47`; making
   the field required would touch nine sites, two of them production
   (`apps/rn/src/data/legacyBridge/readLegacyStores.web.ts:22`,
   `apps/rn/src/data/migrationAudit/doors.ts:41`).

**Could not determine**

- Whether a real iOS 26.x WebKit container can produce a whole-database decode failure (finding 1's
  trigger) — `apps/rn/src/data/legacyBridge/realContainer.test.ts` exercises the captured container
  but asserts nothing about `dropped`, and the brief forbids running it.
- Whether the caption at `apps/rn/src/components/entities/ImportDebtsSheet.tsx:129-131` wraps
  acceptably at the largest Dynamic Type sizes on device: `fontScale` is pinned to 1 on
  react-native-web, and no captured frame in `apps/rn/capture-ref/p6.8/` shows this sheet.
