# D1 — gates and suites (pass 6)

Lane D1. Subject: every instrument whose job is to report the tree green.
Origins in this manifest: 24 `instrument`, 3 `neighbour`.

## D1-1 — `major` — `check-conflict-markers` only reports a conflict when BOTH the open and close markers survive, so a *partially resolved* conflict is invisible

**Origin:** `instrument` (`scripts/check-conflict-markers.ts`).

**User-facing consequence.** The defect this gate was built for is `S1.12.11`: five tracked files carried
conflict markers for 177 commits, the root Next app could not parse, and its whole e2e suite was
un-runnable while 42 gates read green. The **most common** way a conflict is half-fixed is that someone
deletes the `<<<<<<< HEAD` line (or the `>>>>>>> branch` line) and stops — the file still holds both sides
of the conflict and still does not parse. That state ships with `lint:conflict-markers` printing ✅.

**File and line.** `scripts/check-conflict-markers.ts:76`

```ts
if (!(OPEN.test(text) && CLOSE.test(text))) continue;
```

The per-line loop on 77–79 (which does test `MID`) is only reached *after* this gate, so `MID` can never
be the thing that reports a file.

**The measurement.** One tracked file, `packages/core/testing/testCadenceIdentity.ts`, three plants,
`npx tsx scripts/check-conflict-markers.ts` run directly (exit code read from `$?`, not through a pipe):

| plant | markers appended | exit | printed |
|---|---|---|---|
| control (no plant) | none | **0** | `✅ conflict markers: none in 982 tracked file(s) of 1326 [read 173350 lines, floor 161685]` |
| 1 (positive control) | `<<<<<<<` + `=======` + `>>>>>>>` | **1** | red, names the file |
| 2 | `=======` + `>>>>>>>` only | **0** | `✅ conflict markers: none in 982 tracked file(s) of 1326 [read 173354 lines, floor 161685]` |
| 3 | `<<<<<<<` + `=======` only | **0** | `✅ conflict markers: none in 982 tracked file(s) of 1326 [read 173354 lines, floor 161685]` |

⚠️ The scan-floor line **rose** under plants 2 and 3 (173350 → 173354): the gate demonstrably *read* the
planted bytes and still called the tree clean, so this is not a population/blinding failure — it is the
predicate.

- `plant-applied`: yes — verified by the `read` count moving, and by plant 1 (same insertion point,
  one extra line) redding.
- `planted exit`: 0 · `control exit`: 0 · positive-control exit: 1
- `reason`: gate exits 0 and prints "none in 982 tracked file(s)".

**Mechanism (hypothesis).** `OPEN.test(text) && CLOSE.test(text)` was written as a cheap pre-filter to
avoid splitting every one of 982 files, and the conjunction was chosen because a *fresh* git conflict
always has all three. It encodes "an untouched conflict" where the docblock claims "an unresolved
conflict". A half-resolved conflict is strictly more likely to survive review than a fresh one, because
the file *looks* like someone dealt with it.

**Remedy — UNVERIFIED.** Changing the pre-filter to `if (!(OPEN.test(text) || CLOSE.test(text) || MID.test(text))) continue;`
would reach the per-line loop for all three shapes. ⚠️ I did not measure the false-positive cost, and it
is real and specific: `MID` is `^=======` with 'm', and a bare `=======` line is ordinary in prose and in
ASCII-art separators. `.md` is already in `SKIP_EXT`, but `.txt`, `.yml` and `.json` are not. **Do not
apply this without first running it over the 982-file population and reading the hit list** — the
weaker-but-safe variant is `OPEN || CLOSE` (both are 7-char runs that essentially never occur otherwise),
which catches both plants above and adds no `=======` noise.

## D1-2 — `major` — `check-runner-completeness`'s git pathspecs cannot match a test file at the top level of either root, so `D5-12`'s own defect is still reachable

**Origin:** `instrument` (`scripts/check-runner-completeness.ts`).

**User-facing consequence.** This gate exists because *"`npm run test:app` → EXIT 0, ✅ App-layer
regression tests: ALL PASSED"* was printed over a tracked test file that throws on its first line, and
because **30 registered guard proofs run `test:app`** — such a guard scores `failed-open` and reads as
*dead* rather than as *unexecuted*. That exact state is still reachable today for any test file placed
directly in `apps/rn/src/` or directly in `packages/core/`.

**File and line.** `scripts/check-runner-completeness.ts:80` and `:89`

```ts
pathspecs: ['apps/rn/src/**/*.test.ts', 'apps/rn/src/**/*.test.tsx'],
pathspecs: ['packages/core/**/test[A-Z]*.ts'],
```

In a git pathspec `*` already matches `/`, so `**/` is `*/` — it **requires a literal slash**, i.e. at
least one intervening directory. There is no floor on `tracked.length` (only a `=== 0` guard at :109), so
a member that never joins the population is silently absent.

**The measurement.** `git ls-files --others --exclude-standard` with the gate's own pathspecs, over two
probe files, then end-to-end with `git add -N` so `git ls-files` (what the gate calls) lists them:

```
git ls-files -o 'apps/rn/src/**/*.test.ts'      → apps/rn/src/zzprobe.test.ts NOT matched (rc=1)
git ls-files -o 'apps/rn/src/*.test.ts'         → apps/rn/src/zzprobe.test.ts matched     (rc=0)
git ls-files -o 'packages/core/**/test[A-Z]*.ts' → packages/core/testZzProbe.ts NOT matched (rc=1)
git ls-files -o 'packages/core/*test[A-Z]*.ts'   → packages/core/testZzProbe.ts matched     (rc=0)
```

End-to-end, `npx tsx scripts/check-runner-completeness.ts` (exit read from `$?`):

| state | exit | printed |
|---|---|---|
| control, no plant | **0** | `✅ … test:app: 77 tracked · 77 wired · test:regression: 65 tracked · 65 wired` |
| plant B1 — `apps/rn/src/store/zzHoleNested.test.ts`, tracked, unwired (positive control) | **1** | names the file |
| plant B2 — `apps/rn/src/zzHole.test.ts`, tracked, unwired | **0** | `✅ … test:app: 77 tracked · 77 wired · …` |

⚠️ Under B2 the tracked count printed **77, unchanged**. The file was not merely excused — it was never
counted, so nothing in the green line differs from the clean tree.

- `plant-applied`: yes — `git ls-files | grep zzHole` listed both files; B1 (same content, one directory
  deeper) redded.
- `planted exit`: 0 · `control exit`: 0 · positive-control exit: 1
- `reason`: gate exits 0 and prints `77 tracked · 77 wired`.

**Mechanism (hypothesis).** `**/` was written with **shell/`minimatch` semantics** in mind, where `**`
matches zero or more path segments. Git's pathspec wildmatch is invoked without `WM_PATHNAME`, so `*`
already crosses `/` and the extra `*` adds nothing while the `/` becomes a hard requirement — the pattern
means *strictly deeper than the root*, which is the opposite of what was intended. The gate's own docblock
argues at length against counts and for set inclusion, and the set it includes over is the thing that is
short.

**Is it reachable today?** Nothing currently sits at either level (`apps/rn/src/` has **0** files directly
in it; `packages/core/` has one, `tsconfig.json`), so this is latent, not live. ⚠️ That is exactly the
`D5-13` shape the gate's own docblock names: *"a floor sees the population shrink; it is structurally blind
to a file that never joins."*

**Remedy — UNVERIFIED.** Dropping the `**` (`'apps/rn/src/*.test.ts'`, `'packages/core/*test[A-Z]*.ts'`)
matches both the current 77/65 and the top-level probes — measured above at the `git ls-files` layer only,
not through the gate. ⚠️ A second, independent hardening is what the gate has no substitute for: a
**pinned** `tracked.length` per runner (`!==`, the `MIN_CAPS` idiom this repo already uses), so a member
leaving *or never joining* the population reds. I did not measure either change through the gate.

## D1-3 — `major` — both assertions guarding `endingBalance ≥ 0` are spelled `x < 0`, which is `false` for `NaN`, so the whole regression runner prints ✅ over a `NaN` cycle balance

**Origin:** `instrument` (`packages/core/testing/testMultiCycleTimelineRegression.ts`,
`packages/core/testing/runRegressionTests.ts`).

**User-facing consequence.** `endingBalance` is what `TimelineLedger.tsx:77` and `:93` render for each
projected pay cycle — in the visible chip **and** in the row's `accessibilityLabel` (`…, ends ${formatWhole(cycle.endingBalance)}`).
`formatWhole` (`apps/rn/src/utils/format.ts:15`) coerces a non-finite input to `0`, so a `NaN`
`endingBalance` does **not** render as `NaN` — it renders as **`$0`**, silently, sighted and to VoiceOver.
The user is told a cycle ends with zero cash when the app has no idea what it ends with. It also seeds the
next cycle's starting balance (the field's own docblock says so), so the false `$0` propagates forward.

**File and line.** Two sites, one condition, both in `testMultiCycleTimelineRegression.ts`:

- `:30` — `function assertAtLeast(actual, min, label) { if (actual < min) throw … }`, called at `:625`
  as `assertAtLeast(cycle1.endingBalance, 0, "endingBalance stays clamped ≥0 (the dip it would hide)")`
- `:494` — `if (cycle.endingBalance < 0) throw new Error('FAIL [S1.12.9]: endingBalance must still clamp …')`
  inside `testTightCycleStatesItsDipAndStillCarriesZero`

- `:520` — `if (cycle0.endingBalance < 0) throw new Error('FAIL [Cycle ending balance]: expected >= 0 …')`
  inside `testCycleEndingBalanceMatchesPaycheckMinusDeductions`

⛔ **All THREE sites that guard `endingBalance >= 0` are spelled `x < 0`, independently written, in one
file.** `:34` `assertAtMost` (`if (actual > max) throw`) has the same property.

⚠️ **Two spellings of one comparison live in this repo and only one is `NaN`-safe.** `testStressScenarios.ts:23`
and `testFullAppRegression.ts:27` write `assertGreaterThan` as `if (!(actual > expected)) throw` — which
**does** throw on `NaN`. The multi-cycle suite writes the same idea as `if (actual < min) throw`, which does
not. `assertMoney` (six private copies across the suites) is also `NaN`-safe, because `NaN !== NaN`.

**The measurement.** Plant in the producer `packages/core/timeline/buildMultiCycleTimeline.ts:331`
`getEndingBalance`, replacing `return Math.max(0, items[items.length - 1].runningCash);` with

```ts
const rawZZ = items[items.length - 1].runningCash;
return rawZZ < 0 ? Number.NaN : Math.max(0, rawZZ);   // NaN on exactly the branch the clamp guards
```

| state | command | exit | printed |
|---|---|---|---|
| control | suite via probe runner | **0** | `✅ Multi-cycle timeline regression tests passed.` |
| positive control — clamp **removed** (`return items[…].runningCash;`) | suite via probe runner | **1** | `Error: FAIL [S1.12.9]: endingBalance must still clamp — it seeds the next cycle. cycle 2026-06-01 = -300` at `testMultiCycleTimelineRegression.ts:495` |
| **NaN plant** | suite via probe runner | **0** | `✅ Multi-cycle timeline regression tests passed.` |
| **NaN plant** | `npx tsx packages/core/testing/runRegressionTests.ts` (the `test:regression` runner, all 66 modules) | **0** | `✅ All regression tests passed.` |

- `plant-applied`: yes — `grep -c rawZZ` returned 2 while planted, 0 after restore; the positive control
  used the same edit site and redded at the named line.
- `planted exit`: 0 · `control exit`: 0 · positive-control exit: 1
- `reason`: `test:regression` exits 0 printing `✅ All regression tests passed.`

⚠️ **Reading the output, not the exit code, is what showed the positive control was sound**: `| tail -5`
on the failing run printed only `cjs/loader` stack frames and read like a module-resolution error. The
assertion message was 9 lines up. Recorded because this brief warns about exactly that.

**Mechanism (hypothesis).** `assertAtLeast`/`assertAtMost` were written as the *negation of the failure*
(`throw when it is out of range`) rather than as the *negation of the success* (`throw when it is not in
range`). For a total order those are the same statement; IEEE-754 comparison is not a total order, and
every relational operator involving `NaN` is `false`, so "throw when out of range" silently means "accept
anything unordered". The `:494` site is hand-written and independently reached the same spelling, which
suggests this is the natural way to write it rather than a one-off slip.

**Remedy — UNVERIFIED.** Invert every one-sided comparison to the `!(…)` form already used by the sibling
suites — `if (!(actual >= min)) throw`, `if (!(actual <= max)) throw`, `if (!(cycle.endingBalance >= 0)) throw` —
which throws on `NaN`. ⚠️ **Iterate the class, not these three sites**: the same `x < y` / `x > y` throw
shape should be swept across every suite (this lane also saw it named for `Math.abs(a-b) > tol` in
`testDebtMathRegression.ts:16`, `testForecastRegression.ts:12`, `testRecommendedActionsRegression.ts:17`).
⭐ **A stronger and cheaper remedy is the one the repo already prefers**: a single owned assertion module
instead of six hand-copied `assertMoney`/`assertAtLeast` families — the "two producers of one fact" collapse
`check-rounding.ts`'s own docblock argues for. I measured neither.

## D1-4 — `major` — three of the migration audit's nine invariants go **vacuous over the whole 542-case corpus** if a door stops supplying an optional field, and every self-check still reports all nine firing

**Origin:** `instrument` (`apps/rn/src/data/migrationAudit/audit.test.ts`,
`apps/rn/src/data/migrationAudit/invariants.ts`).

**User-facing consequence.** This is the harness whose stated job is *"can the migration lose or corrupt
data?"* — a regression here is **data loss on upgrade**, and `runAppTests.ts:…` says so on the line that
imports it (*"⛔ Gates: a regression here is data loss on upgrade"*). Invariant ② (`nothingSilentlyDropped`)
is the accounting oracle: it is the only thing that distinguishes *"we decided to drop this key"* from
*"we never thought about this key"*, which look identical in the resulting store. It can be turned into a
no-op over every one of the 1,084 outcomes without any instrument in the tree noticing.

**File and line.**

- `apps/rn/src/data/migrationAudit/invariants.ts:60` — `if (!o.accounting) return null;`
- `:203` — `if (!o.store || o.second === undefined || o.second === null) return null;` (⑦ `idempotent`)
- `:215` — `if (!o.store || !o.second) return null;` (⑧ `repairsAreNotRepeated`)
- `apps/rn/src/data/migrationAudit/doors.ts:101` — the only producer of `accounting`; `:63` (`importDoor`)
  never sets it at all.
- `audit.test.ts:278–316` (`checkEveryInvariantFires`) proves each invariant fires **on a synthetic
  `POISONS` outcome that supplies these fields by hand** — never on a real door outcome.

**The measurement.** `npm run test:app` (exit read from `$?`), four states:

| state | exit | printed |
|---|---|---|
| control | **0** | `✓ self-check: all 9 invariants fire (10 poisons, one per invariant)…` · `migration audit — 542 cases × 2 doors, 1084 outcomes, 9 invariants each` · `✅ migration audit complete.` · `✅ App-layer regression tests: ALL PASSED.` |
| **A** — `webkitDoor` stops returning `accounting` **and** `second` | **0** | byte-identical summary to the control, including `9 invariants each` and the self-check line |
| **B** (positive control) — a real accounting defect (`total: …length + 1`), field still returned | **1** | `21 × nothing-silently-dropped ← webkit · debts`, `20 × … requiredExpenses`, `20 × … livingExpenses`, `20 × … goals`, `20 × … cycleHistory` |
| **C** — **the same defect as B**, with `accounting` dropped from the outcome | **0** | `✅ migration audit complete.` · `✅ App-layer regression tests: ALL PASSED.` |

⚡ **B vs. C is the whole finding**: one identical corruption, caught when the field is present, silent when
it is absent — and the *absence* is what nothing checks.

- `plant-applied`: yes — `grep -n "length + 1"` and `grep -n "void accounting"` confirmed each edit landed;
  B redded from the same edit site.
- `planted exit`: 0 (A and C) · `control exit`: 0 · positive-control exit: 1
- `reason`: `test:app` exits 0 printing `✅ App-layer regression tests: ALL PASSED.` and
  `✓ self-check: all 9 invariants fire`.

⚠️ **Already true on the clean tree, at half strength:** `importDoor` (`doors.ts:63`) never returns
`accounting`, so invariant ② is a no-op for **542 of the 1,084 outcomes today**, while the summary line
reads `1084 outcomes, 9 invariants each`. That sentence is not true of the tree it is printed over.

**Mechanism (hypothesis).** `DoorOutcome` declares `accounting?` and `second?` as **optional**, and each
invariant's `return null` on absence was written as *"this oracle does not apply to this door"* — a
correct reading of the type. The self-check was then built to prove the invariants can fire, and it does
that by constructing outcomes itself, so it is structurally blind to whether the *real* producers still
supply the inputs those invariants need. The optionality is what makes "not applicable" and "silently
disabled" the same value.

**Remedy — UNVERIFIED.** A per-door **reachability floor**, asserted in `run()` over the outcomes actually
collected — e.g. count how many outcomes carried `accounting` and how many carried `second`, and throw
below a pinned figure — is the same `MIN_POPULATION` / "corpus is not vacuous" idiom this file already
applies to the healthy control and to invariant ⑨'s `paceCases.length === 0` check. ⚠️ It should be
**pinned per door, not summed**, or `importDoor`'s permanent zero absorbs `webkitDoor`'s collapse.
I did not implement or measure it.


## D1-5 — `major` — `testAllocationsAppearAfterExpensesAndDebts` executes **zero assertions on the current tree**: its whole body is behind `if (snowballIndex !== -1)` and `snowballIndex` is `-1`

**Origin:** `instrument` (`packages/core/testing/testTimelineRegression.ts`).

⚠️ **Found in the GREEN state, not by a plant** — the brief's converse rule. A plant cannot see this,
because the test does not fail; it does nothing.

**User-facing consequence.** This is the only test in the timeline regression suite that pins the ORDER of
the Today timeline — the sequence of rows a user reads down to see where their paycheck goes, and the
sequence `runningCash` is computed along. A sort-order regression that put an allocation above the bills it
is funded from would change every `runningCash` figure on the screen, and nothing in this suite would red.

**File and line.** `packages/core/testing/testTimelineRegression.ts:381-402`

    const snowballIndex = timeline.findIndex((i) => i.type === "snowball");
    ...
    if (snowballIndex !== -1) {          // <- -1 today, so nothing below ever runs
      if (expenseIndex !== -1 && snowballIndex <= expenseIndex) throw ...
      if (debtIndex   !== -1 && snowballIndex <= debtIndex)     throw ...
    }

Three nested existence guards and **no vacuity assertion** — contrast `testRunningCashStatesTheShortfall`
40 lines above, which does exactly the right thing: `if (!last) throw new Error("FAIL [S1.12.9]: the
timeline is empty, so the assertion below would be vacuous.")`.

**The measurement.** The test's own fixture, replayed verbatim through `allocatePaycheck` +
`buildTimelineItems` (probe, exit 0):

    snowballIndex = -1
    expenseIndex  = 1
    debtIndex     = 2
    types: paycheck, expense, minimum_debt

and the engine result it was built from:

    allocations: [ Pay Rent $500 (expense) | Pay minimum on Visa $20 (minimum_debt)
                 | Extra payment to Visa $180 (snowball) | Leftover cash $800 (true_leftover) ]
    full timeline: [ paycheck "Paycheck Received" | expense "Pay Rent" | minimum_debt "Pay minimum on Visa" ]

⚡ **The engine produces a `snowball` allocation of $180 and `buildTimelineItems` does not emit it as an
item.** The test's own comment states the opposite premise — *"Snowball/emergency allocations are dated at
nextPaycheckDate, so they must sort after all expenses and debt minimums"* — so the docblock is a carried
premise the code no longer supports.

- Not a plant: `control exit` 0, and the finding is that the guarded block is unreachable in the passing
  state. `snowballIndex === -1` means zero assertions execute, so the test cannot fail for any sort order.

⛔ **AND IT IS PERMANENTLY VACUOUS, NOT INCIDENTALLY SO.** `testFullAppRegression.ts:376–380`
(`testTimelineAllocationItemsAllPresent`) asserts the product rule directly:

```
assertEqual(plannedTypes.has("snowball"), false, "Unconfirmed snowball allocation does not appear in timeline");
```

with the comment *"Emergency, snowball, and optional_goal allocations … only appear in the timeline once
the user has actually marked them paid via `completedRecommendedActions` — they should not appear as
planned items just because `allocatePaycheck` recommended them."* The fixture in `testAllocationsAppear…`
passes **no** `completedRecommendedActions`, so `snowballIndex` can never be anything but `-1` for it. The
test is not merely vacuous today — it is unsatisfiable by construction, and the sibling suite pins the very
rule that makes it so.

**Mechanism (hypothesis).** The `!== -1` guards were written defensively so the test would not crash on
fixtures where an item is absent. They convert *"the item I am asserting about is missing"* — the strongest
possible signal — into *silence*. The test's own comment (*"Snowball/emergency allocations are dated at
nextPaycheckDate, so they must sort after all expenses and debt minimums"*) describes a timeline that
included planned allocations; the rule changed, the assertion could no longer fire, and the `if` absorbed
the change instead of reporting it. **A comment is a carried premise and decays like a carried number** —
and here a *second* suite already carries the sentence that falsifies it.

**Remedy — UNVERIFIED.** The guards are not the whole fix, because removing them turns the test red for a
reason the product deliberately chose. The fixture has to be given `completedRecommendedActions` for the
snowball (the only state in which the row exists), *then* the `if (x !== -1)` guards replaced with explicit
throws — the idiom `testRunningCashStatesTheShortfall` already uses in this file. ⚠️ Doing only the guard
half reds the tree over a correct product rule, which is the fastest way to get the assertion loosened
again. I measured neither variant.

---

## D1-6 — `major` — the "Import/export abuse" case in `testAbuseScenarios.ts` exercises **no product code at all**; it asserts that `JSON.parse(JSON.stringify(x))` works

**Origin:** `instrument` (`packages/core/testing/testAbuseScenarios.ts`).

**User-facing consequence.** None directly — the consequence is coverage that does not exist. This block is
the only import/export coverage in the file whose whole subject is *abuse scenarios*, and it reads as a
guard on the backup/restore identity path (*"backup preserves debt ID"*, *"backup preserves completed
action target ID"*). A reader auditing what covers the restore door would count it. It can never red for
any change to this repo.

**File and line.** `packages/core/testing/testAbuseScenarios.ts:283-306`

    const bigBackup = { debts: Array.from({length: 100}, ...), completedRecommendedActions: [ ... ] };
    const restoredBackup = JSON.parse(JSON.stringify(bigBackup));
    assertEqual(restoredBackup.debts[87].id, "debt-88", "backup preserves debt ID");
    assertEqual(restoredBackup.completedRecommendedActions[0].targetId, "debt-88",
                "backup preserves completed action target ID");

**The measurement.** The file imports exactly two symbols — `allocatePaycheck` and `projectDebtPayoff`
(`:1-2`) — and **neither appears in this block**. Every identifier in it is a literal, a local, or a JS
global (`Array`, `JSON`). The file contains no import of any backup, import, export, migration or
serialization module. The values asserted (`debt-88` at index 87) are the ones the literal three lines
above was constructed to contain.

- Not a plant: it is unplantable by construction, which is the finding. Any plant in the real
  backup/restore path (`apps/rn/src/data/backup.ts`, `readBackup.ts`, `cloudBackup.ts`,
  `migrationAudit/doors.ts`) leaves this block untouched because it references none of them.

**Mechanism (hypothesis).** The block was written to model *"a big backup round-trips"* and the round-trip
was stubbed with `JSON.parse(JSON.stringify(...))` as a stand-in for the real door, with the intention of
swapping in the real one later. The stand-in and the subject then became the same object, so the assertion
compares the literal to itself.

**Remedy — UNVERIFIED.** Either route the fixture through a real door — `packages/core` cannot import
`apps/rn`, so the honest options are to move the case to `apps/rn/src/data/backup.test.ts` (which already
runs under `test:app`) or to delete it and record that `packages/core` has no backup surface — or, if it
stays, name it for what it tests. ⚠️ Deleting it without moving it removes a line people believe is
coverage, so the accompanying record matters more than the code change.

---

## D1-7 — `minor` — `testCadenceIdentity`'s matrix walks a **hand-typed** list of recurrences under a docblock claiming a new cadence is covered automatically

**Origin:** `instrument` (`packages/core/testing/testCadenceIdentity.ts`).

**User-facing consequence.** None today. The claim is what is wrong: a `Recurrence` member added later is
**not** covered until someone edits this file, and the docblock says the opposite, so a reviewer adding a
cadence has a written reason not to look.

**File and line.** `packages/core/testing/testCadenceIdentity.ts:47`

    const RECURRENCES: Recurrence[] = ["one-time","weekly","biweekly","per-paycheck","monthly","quarterly","annually"];

against the block comment at `:124` — *"AND THE MATRIX IS WALKED, so a cadence added later is covered
without anyone remembering."* A TypeScript union has no runtime members, so `Recurrence[]` annotates the
literal without constraining it to be exhaustive.

**The measurement.** `packages/core/types/recurrence.ts` declares 7 union members and, three lines below,
`export const CADENCE_SUFFIX: Record<Recurrence, string>` — **an exhaustive runtime record the compiler
already forces to cover every member**, with its own docblock saying so: *"It lives beside the type so a
new `Recurrence` member cannot be added without the compiler asking what it is called on screen."* The two
lists agree today at 7 = 7, so there is no live gap. `CYCLES` (`:40`) is the same shape against `PayCycle`'s
4 members.

**Mechanism (hypothesis).** The comment describes the *inner* loop correctly — the matrix walks whatever is
in `RECURRENCES` x `CYCLES` — and was read as covering the outer question of whether the list is complete.
The exhaustive record that would make the claim true already exists in the same module the file imports its
`Recurrence` type from.

**Remedy — UNVERIFIED.** `const RECURRENCES = Object.keys(CADENCE_SUFFIX) as Recurrence[];` makes the
docblock's claim true by construction, because `Record<Recurrence, string>` is compiler-checked for
exhaustiveness. ⚠️ It adds an import from `@core/types/recurrence` to this suite; I did not compile it.
`PayCycle` has no equivalent runtime record that I found, so `CYCLES` would need one before the same move
works there.


---

## D1-8 — `major` — nothing asserts that `run-gates.ts`'s `GATES` list is complete: a gate script in the tree and in no chain is silently unexecuted, and there is a live instance

**Origin:** `instrument` (`scripts/run-gates.ts`).

**User-facing consequence.** `lint:rn` is the gate a human runs and CI runs, and its own header says the
`GATES` array is *"the only copy"* of the gate list. A gate that leaves that array — or never joins it —
stops running with no signal at all. ⛔ **`run-gates.ts`'s own docstring records this exact failure
happening**: `test:gate-plants` was *"THE ONLY THING IN THE TREE ASSERTING A GATE FAILS CLOSED, and it was
in no chain at all: not here, not `validate:release:rn`, not CI"*, while *"all FIFTEEN of S0's majors were
gates reporting green while doing less than they claimed."*

⚡ **The asymmetry is the finding.** `S1.12.5.4 [pass-5 D5-12]` built `check-runner-completeness` on exactly
this argument for **test files** — *"a test file in the tree and in NO runner is silently unexecuted … the
gap is not a missing test, it is that nothing would notice one"* — and **the identical argument for gate
scripts has no instrument.**

**File and line.** `scripts/run-gates.ts:32–140` — `const GATES: {…}[] = [ … ]`, a hard-coded literal array
of 41 npm script names. Nothing in `scripts/` reads it: `git grep -ln "run-gates" -- scripts/` returns
`audit-sublanes.ts` and `check-scan-floors.ts`, and the latter only names the file inside a comment about
docblocks quoting import paths. `check-ci-chain.ts` (`lint:ci-chain`) checks one level up — that CI runs
every link of `validate:release:rn` — and never opens `run-gates.ts`.

**The measurement — the class.** Planted `scripts/check-zzprobe.ts`, a gate that unconditionally
`process.exit(1)`s, present in `scripts/` and named by no chain. Then ran every gate that walks `scripts/`
or reads the chain (exit codes read directly, no pipe):

| gate | exit |
|---|---|
| `check-cap-literals` (walks `scripts/**/*.ts`) | **0** |
| `check-scan-floors` (walks `scripts/**/*.ts`) | **0** |
| `check-gate-sources` (git-tracked vs fingerprinted) | **0** |
| `check-runner-completeness` (runners vs test files) | **0** |
| `check-ci-chain` (CI vs `validate:release:rn`) | **0** |
| **the probe itself, run directly** | **1** — `❌ zzprobe: this gate always fails.` |

- `plant-applied`: yes — `ls -l scripts/check-zzprobe.ts` before the runs, and the probe redded when
  invoked directly, so it is a gate that cannot pass.
- `planted exit`: 0 (all five) · `control exit`: 0 · positive-control exit: 1 (the probe itself)
- `reason`: every gate that could have seen it exits 0. ⚠️ `npm run lint:rn` itself was **not** run — the
  round's constraints forbid it — but it cannot see this by construction: it iterates its own literal
  array, and the probe is not in it.

**The measurement — the live instance.** `package.json` declares **46** `lint:*`/`prove:*` scripts; **41**
are named in `GATES`. The five that are not:

```
lint:rn                 the runner itself
lint:gate-freshness     deliberate, documented (GAP-14), and lint:finding-guards prints it as the one unguarded entry
prove:guards            the per-id form; prove:guards:selftest IS in GATES
lint:secrets:authoring  a --working-tree variant of lint:secrets, which IS in GATES
lint:webkit             tsx scripts/check-webkit-flex-controls.ts   <- in NO chain
```

⚠️ **`lint:webkit` is already on the backlog and is NOT being re-filed as a new defect**:
`docs/DEBT_ELEVATION_BACKLOG.md:212` reads *"🔴 `lint:webkit` IS RED RIGHT NOW AND IN NO LIVE CHAIN —
delete it with the tree, or wire it."* It is cited here as evidence that **the class has already fired and
was found by an audit rather than by an instrument**, which is the whole argument `D5-12` made for tests.
`git grep` confirms no reference to it in `.github/`, and `validate:release:rn` does not name it.

**Mechanism (hypothesis).** `GATES` was extracted from a 22-link `&&` string in `package.json` precisely
because *"a 22-link one-liner is unreadable and unreviewable — which is part of how the `&&` went
unnoticed."* Moving the list into TypeScript made it readable and made it a **second producer of one fact**:
`package.json` says which gates exist, `run-gates.ts` says which gates run, and the two are held together
by nothing. The file's header calls the array *"the only copy"*, which is true of the ordering and false of
the membership.

**Remedy — UNVERIFIED.** The `check-runner-completeness` shape, transposed: derive the population from
`package.json`'s `lint:*` keys, assert set inclusion against `GATES`, and carry a named
`DELIBERATE_OMISSIONS` map with a reason per entry — the idiom `check-ci-chain.ts:34` already uses for
`gate:begin`/`gate:record`. ⚠️ Four of the five above are legitimate omissions and would need entries on
day one, so the check ships with a four-row exemption list; that is the same trade `check-ci-chain` and
`check-gate-sources` already took, and both make the exemption **self-ratcheting** (a stale entry reds).
I did not implement or measure it.
