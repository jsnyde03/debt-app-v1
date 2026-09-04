# Class 1 — re-audit 5 (fresh auditor)

Target: branch `v1.7-dev` at `21e835dd` (clean at start). Round 5 = commits `72d644c2..HEAD` (28 commits).
Prior findings under audit, cumulative per `[D79]` step c: **67** — 11 originals, `R1`–`R15`, `N-1`–`N-11`,
`T1`–`T14`, `U1`–`U16`.

Written incrementally to disk as each measurement lands. Probes in `class1-reaudit5-probes/`.

**Method.** Every verdict is a plant against the live gate, byte-mode (`open(path,'rb')`/`'wb'`), with a
clean baseline run before the plant and a `cmp`-verified restore after it. `class1-reaudit5-probes/plant.py`
is the driver: it saves a byte copy, applies the plant, and `cmp`s the restore — it raises
`PLANT-DID-NOT-APPLY` if the needle was absent, so a plant that never landed cannot be read as "not
caught". `git checkout --` was never used. Nothing was committed.

---

## Part 1 — the 19 findings round 5 claims to have closed

### `U1` / `R5` / `T3` — the `${…}` half is genuinely CLOSED; three of U1's four named spellings are NOT

**⚠️ Round 5 has no `U1` commit.** `scripts/lib/logicalLines.ts` was not touched
(`git log -1 -- scripts/lib/logicalLines.ts` → `9c526e4b`, round 4). U1's remedy said *"`findCalls` must
not choose its own stripper"*; what was actually done is the other half — `scripts/lib/stripCode.ts:139`
now tracks `${…}` inside a template literal and leaves the interpolation **unblanked**, with brace depth
counted. `findCalls` still calls `stripCommentsAndStrings` itself and still gates on
`structure[open] === '('` (`logicalLines.ts:91`, `:96`) — but the structure text it builds no longer
blanks the interpolation, so the effect is the same for the main spelling.

**Measured** (`class1-reaudit5-probes/b1-u1.py`; baseline
`✅ amount-collapse: 0 site(s) … (696 files, 61351 lines read)`, every restore `cmp`-clean):

| plant appended to `AffordabilityCard.tsx` | `npx tsx scripts/check-amount-collapse.ts` |
|---|---|
| `parseAmountField(amount) ?? 0` *(control)* | `❌ … 1 problem(s). • …:324 collapses a parsed amount to 0.` |
| `` `x ${parseAmountField(amount) ?? 0}` `` — **R5/T3's shape** | `❌ … 1 problem(s).` ✅ **CLOSED** |
| `` `x ${parseAmountField(\n  amount,\n) ?? 0}` `` — wrapped *inside* the interpolation | `❌ … 1 problem(s).` ✅ |
| `` `x ${parseAmountField(amount) ?? 0}` + '('  `` — unbalanced paren in a sibling string | `❌ … 1 problem(s).` ✅ |
| `parseAmountField?.(amount) ?? 0` | **`✅ amount-collapse: 0 site(s)`** ⛔ **still blind** |
| `parseAmountField<number>(amount) ?? 0` | **`✅ amount-collapse: 0 site(s)`** ⛔ **still blind** |
| `(parseAmountField(amount)) ?? 0` | **`✅ amount-collapse: 0 site(s)`** ⛔ **still blind** |

`R5` → **CLOSED**. `T3` → **CLOSED**. `U1` → **PARTIALLY CLOSED**, filed below as `V1`.

### `U2` — the false positive it named is CLOSED; the interim bound it shipped opens a BLIND spot

`scripts/check-glossary.ts:113` now takes its quoted fragments from `stringLiterals()` (real extents from
the scanner) and keeps the JSX rule as a regex **bounded to `MAX_JSX_FRAGMENT_LINES = 2` newlines**.

**Measured (`class1-reaudit5-probes/p1-glossary-jsx.ts` + plants into `GraduationCards.tsx`).**

| plant | `npx tsx scripts/check-glossary.ts` |
|---|---|
| `export const warn = "don't stop";` + a bare `crunch` identifier — **U2's exact plant** | `✅ glossary: no retired words in copy` ✅ **CLOSED** |
| `export const crunch = 1;` (the docblock's declared-exempt identifier) | `✅` ✅ |
| `` `v ${o.crunch}` `` — a `crunch` **property named inside an interpolation** | **`❌ glossary: 1 retired word(s)`** ⛔ new false positive — `V2` |
| `` `v ${b ? 'crunch' : ''}` `` (true positive, for contrast) | `❌` — correct |
| `breathing room` inside the 3-newline JSX prose block at `GraduationCards.tsx:51` | **`✅ glossary: no retired words in copy`** ⛔ **BLIND — `V3`** |
| the same phrase in a one-line JSX node in the same file *(control)* | `❌ glossary: 1 … "breathing room" → use "cushion"` |

`U2` → **CLOSED as filed**, with two new findings from its own remedy: `V2` (noise) and `V3` (blindness).

### `U13` — the `\n` escape is fixed and the `expect` string is no longer FAULT-satisfiable

`S1P7-CLASS1-LOGICALJOIN`'s `proof.unfix[0].replace` now reads `"      if (structure[i] === '\n') break;\n…"`
in the JSON source, so the first escape survives into TypeScript as the two-character `\n`, and `expect`
was changed from *"did not red for the WRAPPED spelling"* to **`FAILED-OPEN`**, which a
`FAULT-BASELINE-ALREADY-RED` line does not contain. Re-derived by running the proof — see Part 3.
⚠️ The **second half** of `U13`'s remedy (*"the staleness check should track every path in
`proof.unfix[].at`, not only `entry.file`"*) needed no work — it was already true when `U13` was filed. See
the non-defect section.

### ⚠️ The brief's own commit range omits round 5's first two commits

`CLASS1-REAUDIT-5-BRIEF.md` says round 5 is *"commits from `72d644c2` through the head"*. `72d644c2` is
itself a round-5 commit — *"Restore check-runner-completeness: `e5b6a120` shipped a plant"* — and
`e5b6a120`, *"round 5 (wip): U1/R5/T3 root fix + U13 guard repair"*, is its **parent**. So the range the
fixer handed the auditor **excludes the entire `U1`/`R5`/`T3` fix and the `U13` repair**. Round 5 is
`fcd954d6..HEAD`, 30 commits. Both excluded commits were audited anyway.

### The premise holds — 51 of 51 gates green on the clean tree

`npm run lint:rn` (`class1-reaudit5-probes/baseline-lint-rn.txt`) reports
`❌ lint:rn — 1 of 51 gates FAILED: lint:amount-collapse`. ⚠️ **That one red is this audit's own
contamination** — the run was started in the background and a plant of mine was on
`AffordabilityCard.tsx` while `lint:amount-collapse` executed. `npx tsx scripts/check-amount-collapse.ts`
on the clean tree prints `✅ amount-collapse: 0 site(s) …` (measured four separate times as the baseline of
the `U1` probe). Every other gate printed green, and `run-gates.ts:191` does `process.exit(1)`, so the
chain does propagate. `U7` is therefore **CLOSED**: `lint:finding-guards` is green at
`2 of them STALE (cap 8)`, and its `✅` is now derived from `problems.length` (`check-finding-guards.ts:731`).

### The 12 round-5 registry proofs — 8 re-run and all 8 HOLD

`npx tsx scripts/prove-guards.ts --no-record --id=…` (`class1-reaudit5-probes/proofs-cheap.txt`):

```
✅ S1P7-U7-VERDICT-MARK       plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ S1P7-U2-STRING-EXTENTS     plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ S1P7-U4-CONTRAST-COMMENTS  plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ S1P7-U6-CLAMPED-DAY        plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ S1P7-U8-COMPOSITION-PINNED plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ S1P7-U9-SEED-CLOSURE       plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ S1P7-U11-WELDED-TOKEN      plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ S1P7-U15-PLANT-SAFETY      plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
```

⚠️ **`--no-record` was required.** Recording is the *default* (`prove-guards.ts:684`), so a bare re-run
would have rewritten `measured`/`sha` on twelve registry entries — a re-audit is not allowed to launder the
staleness it is measuring. The four whose `run` is `test:wrap-escapes` (`U5` `U10` `U12` `U16`) are recorded
separately below.

⚠️ **There is no registry entry for `U1`, `U3`, `U13` or `U14`.** `U14` was folded into
`S1P7-U5-REASON-VACUITY`'s `what` and `U13` into `S1P7-CLASS1-LOGICALJOIN`'s repaired `replace`, which is
defensible. `U1` has none, and that is `V1`'s second half.

---

# NEW findings

## `V1` — `major` · the fix that finally closed `R5` after three close/re-open cycles is guarded by **nothing**: disable it and all 51 gates stay green

**Consequence.** `R5` (an interpolated money defect invisible to both money gates) was filed in re-audit 1,
"closed" in round 3, re-opened in round 4 (`U1`), and closed for real in round 5 by 12 lines in
`scripts/lib/stripCode.ts`. **Disable those 12 lines and nothing in the repository notices.** The defect
with the worst recurrence record in this cluster carries the weakest instrument: none. `U1`'s own remedy
said *"Add a `${…}`-shaped plant recipe to `test-wrap-escapes.ts` for both money gates, since neither
current recipe would have caught this"* — that half was not done, and no registry entry covers it either.

**File:line.** `scripts/lib/stripCode.ts:155` — the `quote === '\`' && src[i] === '$' && src[i+1] === '{'`
branch. The recipes that should cover it: `scripts/test-wrap-escapes.ts:114` (`check-amount-collapse.ts`)
and `:121` (`check-rounding.ts`) — both plant only a **line-wrapped** call.

**Measurement.** A one-token un-fix, byte-mode, restore `cmp`-clean: `if (quote ===` → `if (false && quote ===`.

| gate | clean | un-fixed |
|---|---|---|
| `lint:strip-code` | `✅ stripCode: 35 assertions over 11 constructs` | **`✅ stripCode: 35 assertions over 11 constructs`** |
| `lint:amount-collapse` | `✅ 0 site(s) … 61351 lines read` | **`✅ 0 site(s) … 61371 lines read`** |
| `lint:rounding` | `✅ 94 inline money-rounding expressions (cap 94)` | **`✅ 94 … (cap 94)`** |
| `lint:glossary` | `✅ no retired words in copy (6 banned)` | **`✅ no retired words in copy (6 banned)`** |

`scripts/test-strip-code.ts` holds no interpolation assertion at all. Its `MULTILINE` fixture contains a
`` `tpl ${a} tail` `` line but only asserts *length and line-count preservation* over it, which the un-fix
does not change. `stringLiterals`' four new assertions cover an apostrophe, a spanning template and a
comment — none an interpolation.

**Plus three spellings still blind** (`class1-reaudit5-probes/b1-u1.py`, table in Part 1):
`parseAmountField?.(amount) ?? 0`, `parseAmountField<number>(amount) ?? 0` and
`(parseAmountField(amount)) ?? 0` each print `✅ amount-collapse: 0 site(s)`. All three were named in `U1`
and in its remedy (*"widen the callee patterns to admit `?.(` and a generic argument list"*); `PARSER_CALL`
(`check-amount-collapse.ts:56`) and `ROUND_CALL` (`check-rounding.ts:66`) are byte-identical to round 4.
`f?.(x)` is valid TypeScript on a non-nullable callee and compiles today, so it is a live one-character
un-fix route for the whole `D1-3` family.

**Mechanism (HYPOTHESIS).** Round 5 fixed `U1` in its *first* commit, `e5b6a120`, before the guard batch
existed — and `e5b6a120` is the commit the brief's own range excludes. The 11 later guards were scoped from
`CLASS1-REAUDIT-4.md`'s finding list, and `U1` had already left it. The instrument was scoped from the
list, not from the diff.

**Remedy (UNVERIFIED).** (a) Add two assertions to `test-strip-code.ts` — an interpolation's contents must
survive **both** exports, and `findCalls` must find a call written inside one; (b) add a `${…}` recipe to
both money gates in `test-wrap-escapes.ts`; (c) register `S1P7-U1-INTERPOLATION-IS-CODE` with the un-fix
above and `run: lint:strip-code`, once (a) exists to make it red; (d) widen `PARSER_CALL`/`ROUND_CALL` to
admit `?.(` and a generic argument list, and admit a closing paren between `argsEnd` and `AFTER`.

## `V2` — `minor` · `check-glossary` reds on a `crunch` **property named inside a template interpolation** — `U2`'s noisy direction at a new address

**Consequence.** `check-glossary` still has no cap and no allow-list (`problems.length > 0` → exit 1), so
this is a red tree over correct code. `stringLiterals()` returns each template literal **including its
`${…}` contents verbatim** — because `scan()` deliberately does not blank an interpolation (that is `V1`'s
fix) and `text: src.slice(opened, i)` slices raw source. An identifier inside an interpolation is therefore
matched against retired-*copy* patterns.

**File:line.** `scripts/lib/stripCode.ts:171` (`literals?.push({ text: src.slice(opened, i), … })`) feeding
`scripts/check-glossary.ts:113`.

**Measurement.** Plants appended to `apps/rn/src/components/plan/GraduationCards.tsx`, restores `cmp`-clean:

| plant | `check-glossary` |
|---|---|
| a `crunch` property read inside an interpolation | `❌ glossary: 1 retired word(s) … "Crunch" → use GUARDIAN_STATE_LABEL` |
| `export const crunch = 1;` — the same identifier **not** interpolated *(control)* | `✅ glossary: no retired words in copy` |
| `export const __g4 = "don't stop";` + a `crunch2` identifier — **`U2`'s exact plant** *(control)* | `✅` |
| an interpolated string **literal** `'crunch'` (a true positive, for contrast) | `❌` — correct |

The gate's own docblock declares this exempt (*"Identifiers are likewise fine"*), and `U2` recorded that
`CashRunwaySkiaChart.tsx:23` already ships a `crunch: boolean` field — so reading it inside a template is
one refactor away, not a contrived spelling.

**Mechanism (HYPOTHESIS).** Two correct decisions collide. `V1` needs an interpolation to be *code*, so a
money defect inside one is visible; `U2` needs a literal's *extent*, so copy is bounded. `stringLiterals`
takes the extent and hands back the code inside it, so for this one consumer the interpolation is copy
again. Nothing in `stripCode.ts` records that its two exports now disagree about what a template literal
contains.

**Remedy (UNVERIFIED).** Have `scan` record the interpolation spans it skipped alongside `text`, and give
`stringLiterals` a variant that blanks them — the scanner already knows both boundaries. Fixture both
directions: an interpolated identifier is not copy; an interpolated string literal still is.

## `V3` — `major` · `MAX_JSX_FRAGMENT_LINES = 2` re-opens `T6` for JSX text: a retired phrase **wrapped between its two words** is invisible, and the harness recipe cannot see it

**Consequence.** ⛔ **`T6`'s own motivating case is green again.** `T6` moved this gate to whole-file
because *"four of the five retired terms are two-word phrases, and an ordinary JSX text wrap between the two
words defeated every one"*. A JSX text node whose content occupies two physical lines carries **three**
newlines inside the `>…<` match — one after the opening tag, one between the text lines, one before the
closing tag — so a bound of 2 rejects it. **Every wrapped JSX text node in the repo is out of the
population**, including the eight blocks of shipped prose listed below. And `test:wrap-escapes` reports the
gate fixed, because its recipe plants a wrapped **template literal**, which `stringLiterals` handles with no
line bound at all.

**File:line.** `scripts/check-glossary.ts:110` (`const MAX_JSX_FRAGMENT_LINES = 2;`) and `:116`
(the `continue` on newline count).

**Measurement.** `class1-reaudit5-probes/p1-glossary-jsx.ts` re-implements the gate's roots, file filter and
JSX regex and reports what the bound rejects:

```
JSX candidates total=1972  rejectedOnSpan=118
--- prose-shaped rejected (8) ---
  apps/rn/src/app/more.tsx:561                             nl=3  "All debts, expenses, goals, and settings will be permanently erased — …"
  apps/rn/src/components/DataResetScreen.tsx:80            nl=3  "Something was wrong with the file, so the app started fresh. …"
  apps/rn/src/components/entities/ImportDebtsSheet.tsx:129 nl=3  "Columns: name, balance, minimumPayment, apr, dueDate. …"
  apps/rn/src/components/more/CloudBackupSheet.tsx:127     nl=3  "This device hasn't restored that backup, so it may be from another device …"
  apps/rn/src/components/plan/GraduationCards.tsx:51       nl=3  "Financial Freedom picks up where this leaves off — …"
  apps/rn/src/components/plan/GuardianScorecard.tsx:47     nl=3  "I've set your line aside on every paycheck since the first one. …"
  apps/rn/src/components/plan/PaydayGuardianCard.tsx:457   nl=3  "One of your savings amounts couldn't be read, so there may be a better pot …"
  apps/rn/src/components/plan/RequiredActionsCard.tsx:169  nl=3  "Rent, utilities, subscriptions — anything that comes out every cycle. …"
```

`RequiredActionsCard.tsx` is the file `C1-9` and `R12` were filed against, and `PaydayGuardianCard.tsx` is
the payday sheet this whole surface is about. Then planted, restores `cmp`-clean:

| plant into `GraduationCards.tsx` | `check-glossary` |
|---|---|
| `breathing room` inserted **inside** the `nl=3` prose block at `:51` | **`✅ glossary: no retired words in copy (6 banned).`** |
| `breathing room` in the one-line `<Text>` at `:49` *(control)* | `❌ glossary: 1 … GraduationCards.tsx:49  "breathing room" → use "cushion"` |

And `T6`'s own spelling, decisively (`class1-reaudit5-probes/b7-jsxwrap.py`):

| plant | `check-glossary` |
|---|---|
| `<Text>your breathing room this month</Text>` — one line *(control)* | `❌ … :71  "breathing room" → use "cushion"` |
| a `<Text>` whose content is **wrapped between the two words** — `T6`'s case | **`✅ glossary: no retired words in copy (6 banned).`** ⛔ |
| the same `<Text>` with the phrase on **one** content line | `❌ … :72` — so the bound, not the element, is the discriminator |
| the same phrase in a wrapped **template literal** — the `test:wrap-escapes` recipe | `❌ … :71` — which is why the harness still reads `MATCHED` |

**Mechanism (HYPOTHESIS).** The bound was chosen against the *noise* measurement (1,809 welded JSX
fragments) and never checked against the *signal*. Its stated justification is arithmetically wrong: *"A
Prettier wrap of a two-word phrase spans one [newline]"* counts the break between the words and forgets the
two breaks the enclosing tags contribute, so the shape the docblock says the bound admits is the shape it
rejects. Measured above, both directions. The docblock states the enabling half and states no cost — the
same stated-mechanism-without-a-counter-measurement shape this class keeps paying for, and the counter
here was one plant away.

**Remedy (UNVERIFIED).** The line bound is the wrong instrument for the observed noise — the 1,809 welds
came from `>` being the comparison operator and the tail of `=>`, not from long text. Reject a candidate
whose content carries code punctuation (`;` `=` `{` `}` `(` `)`), or whose opening `>` is shown to be an
operator by `stripCommentsAndStrings`, and drop the newline bound. Interim, still measured: raise the bound
to the longest prose block in the tree and add a fixture asserting all eight blocks above are **in** the
population, so the next narrowing reds.
## `V4` — `blocker` · `preflightRestore` overwrites a TRACKED file with an UNTRACKED sidecar's bytes and deletes the evidence — and it runs inside `npm run lint:rn`. **Measured destroying uncommitted work.**

**Consequence.** `U15`'s remedy chose *restore* over *refuse*, and the docblock states the reason
(*"a harness that merely refuses to start leaves the planted file in the tree for `git add -A`"*) without
measuring the cost of restoring the **wrong** bytes. The cost is silent loss of uncommitted work in tracked
production source, on an ordinary sequence: kill a harness, keep working, run the lint chain.

**File:line.** `scripts/lib/plantSafety.ts:104–109` — `writeFileSync(absTarget, original, 'utf8')` guarded
only by `readFileSync(absTarget) !== original`, i.e. *"the target differs from the sidecar"*, which is true
of a developer's edit exactly as it is of a plant. Callers: `scripts/test-wrap-escapes.ts:38` (chained at
`run-gates.ts:162`, so it is in `lint:rn` and in `validate:release:rn`) and `scripts/prove-guards.ts:310`.

**Measurement — on a real orphan this session produced, not a synthetic one.**
`prove:guards` was stopped mid-proof. Its signal handler worked: the planted tracked file came back clean.
What it left behind was `packages/core/utils/percentComplete.ts.plant-backup` and its
`.plant-owner`, with the target already restored:

```
?? packages/core/utils/percentComplete.ts.plant-backup
?? packages/core/utils/percentComplete.ts.plant-backup.plant-owner
```

Then one edit to the target — the developer's own work — and the **production** `preflightRestore`
(`class1-reaudit5-probes/p5-orphan.ts`):

```
sidecar present : true
owner pid       : 11868  alive=false  (a dead owner makes the sidecar "abandoned")
target === sidecar before the edit : false
target length before : 2300
recovered by pre-flight: ["packages/core/utils/percentComplete.ts"]
target length after  : 2217
sidecar still on disk: false  owner mark: false
edit survived: False
```

**83 bytes of uncommitted work in a tracked file, gone, and the sidecar that would have shown what
happened deleted in the same pass.** The target was byte-identical to `HEAD` before the edit, so the
sidecar carried nothing that needed recovering — there was no plant to undo.

**Mechanism (HYPOTHESIS).** The pre-flight infers *"this file is planted"* from *"a sidecar exists and the
file differs from it"*. Those are not the same proposition: the sidecar records the tree at plant time, and
any later change to the target — a plant, a `git pull`, an editor save, a rebase — satisfies the test
identically. The liveness marks (`PLANT_SAFETY_LIVE`, the owner PID) only distinguish a *live* plant from
an *abandoned* one; nothing distinguishes an abandoned plant from an abandoned sidecar beside an
already-clean file, which is the state the session's own kill produced. `git status` is used to find
sidecars but never consulted about the target it is about to overwrite.

**Remedy (UNVERIFIED).** The information needed is already in hand and free: compare the target against
`HEAD` before writing. If the target is **clean** relative to `HEAD`, there is no plant — drop the sidecar
and write nothing. If the target is dirty, write only when the current bytes are the *plant* the harness
would have made, and otherwise refuse loudly, naming the sidecar and leaving both files alone (the
`git add -A` hazard is answered by `check-committed-secrets --working-tree`'s existing shape: a gate that
refuses a dirty tracked file, not a pre-flight that mutates one). At minimum, print a unified diff of what
is about to be discarded and keep the sidecar until the run completes cleanly.

## `V5` — `major` · `U4` recurs at `check-contrast`'s SECOND matcher: the ink scan reads the RAW file, so a comment naming a hex literal reds the gate — created in the same commit that migrated it

**Consequence.** `check-contrast` exits 1 with `✗ … paints ink as the literal '#123456'` over a **comment**.
No cap, no allow-list. `U4` filed this exact defect against `textUses`; the fix went into `paintableText()`
and `textUses` alone, while `U10`'s fix in the same round moved `INK_LITERAL` to whole-file `matchAll`
without stripping — so the migration `U4` blamed for widening `textUses` was repeated verbatim at the
second matcher. `U10`'s own lesson is the one that was missed: *budget the enumeration, not the list, and
a file is an enumeration too.*

**File:line.** `scripts/check-contrast.ts:436` — `const code = readFileSync(file, 'utf8');` inside the
`INK_LITERAL` loop, where `textUses` at `:197` calls `paintableText(file)` (which strips) 240 lines above.

**Measurement.** Plants appended to `apps/rn/src/components/plan/PaydayGuardianCard.tsx`, restores
`cmp`-clean, baseline `check-contrast: every rendered token pair clears its floor. [read 32328 lines, floor 30711]`:

| plant | `npx tsx scripts/check-contrast.ts` |
|---|---|
| `// A doc comment that merely NAMES a hex ink: color: '#123456'` | **`check-contrast: 1 failing pair(s)` · `✗ …:726 paints ink as the literal '#123456'`** |
| a `const __pal = [` / `  // the CTA fill color:` / `  '#123456',` / `];` — the word `color:` in a comment, the hex on the **next** line | **`check-contrast: 1 failing pair(s)` · `✗ …:727`** |
| the same array with the comment reworded to `// the CTA fill token` *(control)* | `check-contrast: every rendered token pair clears its floor.` |
| `export const __wrapContrast = { color:\n  c.accent.brand }` — `U4`'s own comment plant against `textUses` | `✅` — `U4` is closed **there** |

The second row is the migration-attributable half, and it is the same shape `U4` recorded: pre-`U10` the
per-line application could not join a comment on one line to code on the next.

**Mechanism (HYPOTHESIS).** The ink scan's docblock explains why it reads raw source —
*"`withoutGradients` blanks any bracketed span containing a hex literal … so the ink scan reads the raw
line"* — and that reason is about `withoutGradients`, not about comments. The two are independent
transforms; `stripCommentsOnly` is length- and line-preserving and leaves gradient arrays untouched. The
docblock's stated reason for reading raw was carried into the migration as though it forbade stripping.

**Remedy (UNVERIFIED).** `const code = paintableText(file);` in the ink loop — the named function `U4`
created for exactly this, which also folds the ink scan into `SCAN_GATE`'s floor. Then add a
`sameLine`/`plant` pair to `check-contrast`'s recipe #2 for the comment direction (`expect: 'green'`), so
the third matcher's turn cannot be silent.

## `V6` — `major` · `U8`'s occurrence-counting pin is satisfied by a decoy string literal: `D1-1` and `D1-2` each re-open GREEN in two edits. `N-3`'s mechanism at its FIFTH recurrence.

**Consequence.** Both un-fixes `U8` named are still one-liners, now needing one extra line each. The gate
prints a full green over a `lint:money` that has silently left the chain, and over a regression suite that
is no longer imported into its runner.

**File:line.** `scripts/check-runner-completeness.ts:348` —
`if (selfSrc.split(site).length - 1 < 2)`. The pin counts occurrences of its own literal in its own
comment-stripped source; a string literal anywhere in the file is an occurrence.

**Measurement** (`class1-reaudit5-probes/b2-u8.py`; every restore `cmp`-clean).
Baseline: `✅ runner completeness: every tracked test file is wired into its runner (test:app: 84 tracked · 84 wired · test:regression: 66 tracked · 66 wired · package.json (npm script map): 9 tracked · 9 wired).`

| plant | `npx tsx scripts/check-runner-completeness.ts` |
|---|---|
| `'lint:money',` → `// 'lint:money',` in `run-gates.ts` *(the real defect, control)* | `❌ runner completeness: 1 problem(s). … lint:money` |
| the same defect **plus** `chainedGatesFrom(runGatesFile)` → `chainRegion(runGatesFile)` **plus** `const __decoy = 'chainedGatesFrom(runGatesFile)';` | **`✅ runner completeness: every tracked test file is wired into its runner …`** ⛔ **`D1-1` re-opened** |
| `import "./testPlannerStateHardening";` commented out in `runRegressionTests.ts` *(control)* | `❌ … packages/core/testing/testPlannerStateHardening.ts` |
| the same defect **plus** `const imported = wiredIn(r);` → `r.imports(readFileSync(…), r.runner)` **plus** `const __decoy2 = 'const imported = wiredIn(r);';` | **`✅ runner completeness: every tracked test file is wired into its runner …`** ⛔ **`D1-2` re-opened** |

**Mechanism (HYPOTHESIS).** The pin's own docblock records that `includes` was satisfied by the pin's array
literal and that counting fixed it — *"Two occurrences are required: the pin's own literal, and the call."*
That is a statement about a **population of exactly two**, held by a check that counts an unbounded one.
The class's own standing rule applies to the pin as much as to a gate: *a count nobody bounds is slack.*
The deeper point is the one `U8`'s docblock already concedes — *"a composition cannot be closed from inside
the file that composes it"* — and it is right, so a self-read count was never going to be the instrument.

**Remedy (UNVERIFIED).** Take the pin out of the file it is about. `check-gate-sources.ts` already reads
other gates' sources, and `test-gate-plants.ts` already plants against `lint:runner-completeness`: add a
scenario there that applies each un-fix **and** its defect and requires a red, which is a measurement rather
than a spelling check and is immune to a decoy. If the pin stays, require the count to be **exactly** the
number of declared sites (`=== 2`), so a decoy reds it in the noisy direction instead of the blind one.

## `V7` — `major` · `check-finding-guards` reports a DELETED guard as present when its token survives in a block comment opened mid-line — and `joinedCode`'s docblock claims the opposite

**Consequence.** The gate that decides whether every finding in this audit is closed can be satisfied by a
comment. `lint:finding-guards` prints `✅ finding-guards: 279 of 280 findings carry a standing guard` and
exits 0 over a guard that is gone. Its ordinary-block-comment control correctly reds with
`the guard token appears … ONLY IN A COMMENT`, so the comment-vs-code distinction exists and is right — it
just does not hold for one spelling of a comment.

**File:line.** `scripts/lib/joinedCode.ts:52` — `isCode()`:
`const startsBlock = t.startsWith('/*') && !t.includes('*/');`. Consumers: `check-finding-guards.ts:237`
(`presentInCode`) and `:399` (`declLine`), and — new in round 5 — `unreadInputsCopy.test.ts:53` through
`codeText`, so the RN release suite inherits it.

⚠️ **`joinedCode.ts:33`'s own header asserts the opposite:** *"BLOCK-COMMENT STATE IS TRACKED, not guessed
from the line's first characters."* It is guessed from the line's first characters. The paragraph below it
explains why a line must *begin* a block (a string literal holding the delimiter broke the first cut) and
states no cost for the case the rule then misses.

**Measurement** (`S1-M9-GUARDIAN`, token `it is NOT called the emergency fund`, one occurrence in
`apps/rn/src/store/guardianSelectors.test.ts`; every restore `cmp`-clean):

| plant | `npx tsx scripts/check-finding-guards.ts` |
|---|---|
| baseline | `✅ finding-guards: 279 of 280 … ` exit 0 |
| the token replaced in the assertion — the guard genuinely gone | `⛔ 278 of 280` · `❌ 2 problem(s).` · `• S1-M9-GUARDIAN — the guard is gone from …` exit 1 |
| …plus the token re-introduced inside `const __x = 1; /* opens a block mid-line` … `*/` | **`✅ finding-guards: 279 of 280 …` exit 0** ⛔ |
| …plus the token inside an **ordinary** block comment *(control)* | `⛔ 278 of 280` · `• S1-M9-GUARDIAN — the guard token appears … ONLY IN A COMMENT` exit 1 |

**Mechanism (HYPOTHESIS).** `isCode` decides "am I inside a block comment" from each line's first
characters, so a `/*` that opens after any other token on its line is never seen, `state.inBlock` stays
`false`, and every line of that comment's body is read as code. ⚠️ **This is pre-existing, not
round-5-introduced** — round 4's `presentInCode` carried the identical predicate. What round 5 changed is
the blast radius: the heuristic moved into a shared producer and gained a second consumer in the RN release
suite, and it acquired a docblock stating it is not a heuristic.

**Remedy (UNVERIFIED).** `joinCodeLines` should drop comments through `stripCommentsOnly` — the repo's one
real scanner, which tracks this correctly and is length- and line-preserving, so `lineAt` is unaffected —
and then join. That is the same *one producer* argument that created `joinedCode`, applied one level down;
it also removes the string-literal-delimiter special case the current predicate exists to dodge. Add both
comment spellings as fixtures in `test-strip-code.ts` or a new `test-joined-code.ts`, since nothing in the
repo tests `joinedCode` directly today.

## `V8` — `minor` · `clampedDay()` exempts a `getDate()` inside **any** call, so three genuinely unclamped day slots now pass `check-month-arithmetic`

**Consequence.** The blind direction of `U6`'s fix. A `new Date(y, m + 1, day)` whose day overflows a short
month is the original blocker's own shape, and three spellings of it are now exempt.

**File:line.** `scripts/check-month-arithmetic.ts:157–169` (`clampedDay`) — the test is *"the innermost
enclosing `(` is preceded by an identifier character"*, i.e. **a call**, with no notion of *which* call.
`Math.min` is the clamp; nothing checks for it.

**Measurement** (`class1-reaudit5-probes/b3-u6.py`, plants appended to
`packages/core/utils/percentComplete.ts`, restores `cmp`-clean; baseline
`✅ month arithmetic: 707 files, no … overflowing`):

| day slot inside `new Date(d.getFullYear(), d.getMonth() + 1, …)` | result |
|---|---|
| `d.getDate()` *(control)* | `❌ …percentComplete.ts:40: …` exit 1 |
| `Math.min(d.getDate(), 28)` — `U6`'s fix | `✅` exit 0 — correct |
| **`Math.max(1, d.getDate())`** — clamps the lower bound, overflows the upper | **`✅` exit 0** ⛔ |
| **`Number(d.getDate())`** | **`✅` exit 0** ⛔ |
| **`__id(d.getDate())`** with `const __id = (n: number) => n` | **`✅` exit 0** ⛔ |
| `(d.getDate())` — grouping parens, documented as *not* a clamp | `❌ …:40` exit 1 — correct |

`Math.max(1, …)` is the realistic one: guarding the *lower* bound is an ordinary thing to write and it does
nothing about the overflow this gate exists for.

**Mechanism (HYPOTHESIS).** `U6`'s remedy as filed says *"exempt a day slot whose `getDate()` is an
argument of `Math.min` **(or of any call)**"* — the parenthesis is the whole finding. The docblock
implements the parenthesis and argues for it (*"`Math.min(`, `clampDay(`, `Math.max(` all qualify"*), which
names `Math.max` as qualifying without noticing that `Math.max` does not clamp the direction the gate
checks. A contingent choice written in as a law — Law III.

**Remedy (UNVERIFIED).** Exempt on the callee, not on the presence of one: a day slot is clamped when its
`getDate()` is an argument of `Math.min`, or of a call whose name matches `/clamp/i`, and otherwise it is
not. Add all three rows above to `test-gate-plants.ts`'s `constructorOverflow` scenarios so the exemption
carries its own negative cases.

## `V9` — `minor` · `U9`'s exemption is keyed on the NAME `seed`, so three real defect spellings are now invisible

**Consequence.** `test:app` is a release gate with `eq(fromEditing.length, 0)` and no allow-list. The
`C2-9`/`R11`/`N-8` defect — a `useState` initialiser that reads `editing` and therefore ignores a prefill —
becomes invisible if the binding is called `seed`.

**File:line.** `apps/rn/src/components/entities/debtPrefill.test.ts:201` (`const EXCLUDED = new Set(['seed']);`)
and `:207` (`if (derived.has(b.name) || EXCLUDED.has(b.name)) continue;`).

**Measurement** — the production function sliced verbatim out of the test file
(`class1-reaudit5-probes/p3-gen.py` writes `sliced-seeds.ts`; `p3-prefill.ts` runs it), so it cannot drift:

```
ok   want=0 got=0  SANCTIONED direct (the shipped shape)
ok   want=0 got=0  SANCTIONED one hop through seed (U9 fix)
ok   want=1 got=1  DEFECT hoisted off editing (R11)
FAIL want=1 got=0  DEFECT hoisted off editing, BINDING NAMED seed
FAIL want=1 got=0  DEFECT: sanctioned seed, plus a SECOND seed hoisted off editing in a nested scope
ok   want=1 got=1  DEFECT destructured off editing (N-8)
FAIL want=1 got=0  DEFECT destructured off editing, RENAMED to seed
```

⚠️ **Two of the three are blocked in `DebtSheet.tsx` specifically, by TypeScript rather than by the guard:**
a second top-level `const seed` would be a redeclaration, and the pin
`/const seed = editing \?\? prefill \?\? null;/` requires the sanctioned one to be there. The **nested-scope**
row is legal TypeScript and passes both the pin and the detector, and `DebtSheet.tsx` is the only file
scanned, so that is the live route. `const { apr: seed } = editing ?? {}` is the shape most likely to be
written by accident: renaming a binding to `seed` while still reading `editing` is precisely the
half-finished refactor the docblock's own advice invites.

**Mechanism (HYPOTHESIS).** The docblock says *"⚠️ **Not a hole.** `seed` is still pinned by the assertion
below, so the one identifier allowed to derive from `editing` is itself guarded."* The pin asserts the
**presence** of one declaration; it says nothing about a **second** binding of that name, and nothing at all
about scope. A carried reason, one round old.

**Remedy (UNVERIFIED).** Exempt the sanctioned **shape**, not the name: put a binding in `EXCLUDED` only
when its initialiser matches the merge (`editing ?? prefill`), so a `seed` that reads `editing` alone stays a
hit. Add the three failing rows above as fixtures — the exemption's negative cases, which is what `R11`'s
lesson asks for and what `U9`'s three new rows still do not cover.
---

## Part 1 (continued) — the other 48 prior findings

⚠️ Re-verification was **targeted at the files round 5 changed**, which is where question 2 lives.
26 files moved; the gates and producers among them are `check-amount-collapse`, `check-cap-literals`,
`check-contrast`, `check-finding-guards`, `check-glossary`, `check-month-arithmetic`,
`check-runner-completeness`, `check-store-id-writes`, `lib/stripCode`, `lib/joinedCode` (new),
`lib/plantSafety` (new), `prove-guards`, `run-gates`, `test-wrap-escapes`, `test-strip-code`,
`finding-guards.json`, `debtPrefill.test.ts` and `unreadInputsCopy.test.ts`. Findings whose gate is
**untouched** since round 4 certified them (`check-fixture-dates`, `check-sandbox-writes`,
`check-local-dates`, `lib/logicalLines`) were not re-planted; that is a stated limit of this pass, not a
verdict.

| # | plant / probe this round | result | verdict |
|---|---|---|---|
| D1-1 | `'lint:money',` → `// 'lint:money',` in `run-gates.ts` | `❌ runner completeness: 1 problem(s). … lint:money` | **CLOSED** ⚠️ re-openable — `V6` |
| D1-2 | `import "./testPlannerStateHardening";` commented out | `❌ … packages/core/testing/testPlannerStateHardening.ts` | **CLOSED** ⚠️ re-openable — `V6` |
| D1-3 · D1-4 | wrapped `parseAmountField(\n raw,\n) ?? 0` into `AffordabilityCard.tsx` | `❌ amount-collapse: 1 problem(s). • …:324 collapses a parsed amount to 0.` | **CLOSED** |
| D1-6 | `MAX_INLINE_ROUNDING` still `94`, pinned with `!==`; clean run prints `✅ rounding: 94 … (cap 94, downward-only)` | — | **CLOSED** ⚠️ unguarded against the `${…}` regression — `V1` |
| D1-7 | not re-planted (`check-fixture-dates` untouched since round 4); its `test:wrap-escapes` recipe ran `MATCHED` with a `sameLine` companion | `✅ check-fixture-dates.ts wrapped-plant=MATCHED` | **CLOSED (harness)** |
| D1-8 | not re-planted (`check-sandbox-writes` untouched); recipe `MATCHED` + `sameLine` | `✅ check-sandbox-writes.ts wrapped-plant=MATCHED` | **CLOSED (harness)** |
| D1-9 | duplicate `"S1P1-B1-OWNER"` key added to a registry that grew 268 → 280 | `⛔ finding-guards: 279 of 280 …` then `❌ finding-guards: 1 problem(s).` | **CLOSED** |
| D1-11 | the harness is derived and grew: `11 wrap-sensitive gate(s) · 12 matcher recipes`, census over every `check-*.ts` | `✅ wrap-escapes: …` | **CLOSED** |
| C1-9 · R12 · N-7 | the producer was **replaced** (`codeLinesOnly = codeText` from `lib/joinedCode`). Its junction table is byte-identical to the deleted local copy, and the five junction rules survive in `JUNCTIONS` in the same order (`${' '}` before `{' '}`). Measured: 0 of 279 registry tokens change presence under the shared producer | `p4-joined.ts`: `FOUND ONLY PER PHYSICAL LINE = 0` | **CLOSED** ⚠️ its comment predicate is `V7` |
| C2-9 · R11 · N-8 | the sliced production detector over 7 spellings | 4 of 7 as specified, 3 false negatives | **CLOSED as filed** ⚠️ `V9` |
| R1 | a red baseline is still a FAULT: `before.code !== 0` → `FAULT-BASELINE-ALREADY-RED` at `test-wrap-escapes.ts:589` | `S1P7-U11`'s own `what` records this firing three times this round | **CLOSED** |
| R2 · R3 · N-9 | `findCalls` balances parentheses; no join, no flatten, no window. `lint:rounding` reports `94` and names real lines | `✅ rounding: 94 … (cap 94)` | **CLOSED** |
| R4 · T2 | `parseAmountField(amount);` then `0 ?? 0;`, and two correct sibling arguments | `✅ amount-collapse: 0 site(s)` | **CLOSED** |
| **R5** · **T3** | `` `x ${parseAmountField(amount) ?? 0}` `` and the same wrapped inside the interpolation | `❌ amount-collapse: 1 problem(s).` both | **CLOSED at last** ⚠️ unguarded — `V1` |
| R6 · R7 · N-2 · T12 | not re-planted; `check-fixture-dates` untouched, clean run prints `0 imminent fuses · 120 aged (cap 120) · [read 22846 lines, floor 21640]` | — | **CLOSED (unchanged)** |
| R8 | see `D1-9` | `❌ … duplicate id(s)` | **CLOSED** |
| R9 · N-6 | not re-planted; `check-sandbox-writes` untouched, `✅ 24 sanctioned appStore consumers` | — | **CLOSED (unchanged)** |
| R10 · T9 | `ALLOWED` is still empty and still enforced (`check-amount-collapse.ts:187`) | `✅ amount-collapse: 0 site(s), all named with a reason` | **CLOSED** |
| R13 · N-3 | see `V6` — the two routes `N-3` imagined are caught, and two more re-open with a decoy | — | **CLOSED as filed** ⚠️ `V6` |
| R14 | `S1P7-CLASS1-LOGICALJOIN`'s proof is repaired (`U13`) and its `expect` is `FAILED-OPEN`; the harness stands at 12 recipes | — | **CLOSED** |
| R15 · T5 · T10 · N-10 | see the census section below | | |
| N-1 | the flattening is still deleted; `grep -rn "flatten" scripts/lib/logicalLines.ts` returns only the historical table | — | **CLOSED** |
| N-4 | not re-planted (`check-local-dates` untouched); recipe `MATCHED` | `✅ check-local-dates.ts wrapped-plant=MATCHED` | **CLOSED** |
| N-5 · T8 | wrapped block-bodied `rows.findIndex((r) => { return r.id === id; })` after the `BY_ID`/`BY_ID_G` collapse | `✅ store id writes: no bare id-keyed row edits across 51 store file(s)` — and the control `rows.map((r) => (r.id === id ? r : r))` gives `❌ … 1 bare \`x.id === id\` comparison(s) outside a lookup` | **CLOSED** |
| N-11 | `MIN_CAPS` 28 → **29**; lowered to 28 by hand | `❌ cap literals: 1 derived ratchet(s).` — pinned both directions; clean run `✅ cap literals: 29 downward-only cap(s) across 73 scripts` | **CLOSED** ⚠️ its ledger note — `V10` |
| T1 · U14 | `check-store-id-writes`' recipe is still `expect: 'green'`, and the summary now separates the directions | `10 red on the WRAPPED spelling …, 2 GREEN on correct code a formatter produced` | **CLOSED** |
| T4 · U3 | `grep -n "IS_LOOKUP\|WITHIN_STATEMENT" scripts/` → nothing; `BY_ID_G` declared once; `SEP` gone from `check-glossary.ts` | — | **CLOSED** |
| T6 · U2 | `U2`'s own three-line plant now green; a retired phrase in a one-line JSX node still red | — | **CLOSED** ⚠️ `V2` `V3` |
| T7 · U4 | `U4`'s comment plant against `textUses` stays green | `check-contrast: every rendered token pair clears its floor.` | **CLOSED for `textUses`** ⛔ recurs at the ink matcher — `V5` |
| T11 | `grep -rln "flatten" scripts/check-*.ts` → the same 4 historical mentions, no `[^;{}]` bound anywhere | — | **CLOSED** |
| T13 · U15 | `lib/plantSafety.ts` exists, is chained (`run-gates.ts:162`), and its layers were observed working: a kill of `prove:guards` mid-proof left the tracked file **clean** | — | **CLOSED** ⛔ and its remedy introduced `V4` |
| T14 | `codeText`'s junction fixtures still hold; the negative row still does not weld | `test:app` green on the clean tree | **CLOSED** |
| U1 · U5 – U16 | see Part 1 above and the registry re-runs | | 15 closed, `U1` partial |

**Counts re-derived independently.**

| constant | value | measured | verdict |
|---|---|---|---|
| `MIN_ENTRIES` | 280 | `json.load(finding-guards.json)` → 280 keys; 12 new since `72d644c2` | correct — ⚠️ ledger note wrong, `V10` |
| `MAX_UNGUARDED` | 1 | `279 of 280 … 1 unguarded` — exact | correct |
| `MAX_STALE_PROOFS` | 8 | `2 of them STALE (cap 8)`, both `audit-route.ts`, both pre-round-4 | correct; the 9 round-4 staleness was drained |
| `MAX_AUTHORED` | 10 | `10 authored but never run (cap 10)` — exact, zero headroom | correct |
| `MAX_UNPROVEN` | 119 | `119 never tested (cap 119)`; 150 EXECUTED + 10 + 0 + 119 + 1 = 280 | correct |
| `MIN_CAPS` | 29 | `✅ cap literals: 29 downward-only cap(s) across 73 scripts`; 28 → 29 is `MAX_JSX_FRAGMENT_LINES` | correct, justification correct |
| `MAX_UNREVIEWED` | 12 | the set literal holds 12 names and the run prints `⚠️ 12 per-line and NOT YET REVIEWED` | correct; 17 → 12 accounted for |
| `MAX_INLINE_ROUNDING` | 94 | `✅ rounding: 94 … (cap 94)`; `!==`, so both directions red | correct — ⚠️ the population changed under it (`V1`) and the number did not move, which `U1` predicted |
| contrast scan floor | 30,711 | ledger `measuredCount: 32328`; × 0.95 = 30,711.6 → 30,711. Observed 32,328 | correct |
## `V10` — `minor` · `MIN_ENTRIES`' ledger note records `268 → 269` while the constant is `280`, so the one audit trail on a downward-only floor is off by eleven

**Consequence.** `MIN_ENTRIES` is a floor whose whole justification is the two-line-edit friction
`check-cap-literals.ts:126` names it for: *"`check-finding-guards.ts`'s `MIN_ENTRIES` documents it."* The
note is the documentation, and it names one of the twelve entries added and the wrong arithmetic. A reader
auditing the floor sees a claim that does not reconcile with the value, and nothing mechanical compares
them — `check-cap-literals` reads cap **literals**, not the prose beside them.

**File:line.** `scripts/check-finding-guards.ts:146` — `// ⚠️ 268 → 269 at S1.13.7.12.6 round 5:
`S1P7-U7-VERDICT-MARK`, the guard on this file's own verdict mark.` above `const MIN_ENTRIES = 280;`.

**Measurement.** `json.load(scripts/finding-guards.json)` → **280** keys. Diffed against
`git show 72d644c2:scripts/finding-guards.json` → **12** new ids: `S1P7-U7-VERDICT-MARK`,
`S1P7-U2-STRING-EXTENTS`, `S1P7-U4-CONTRAST-COMMENTS`, `S1P7-U5-REASON-VACUITY`, `S1P7-U6-CLAMPED-DAY`,
`S1P7-U8-COMPOSITION-PINNED`, `S1P7-U9-SEED-CLOSURE`, `S1P7-U10-INK-WHOLE-FILE`, `S1P7-U11-WELDED-TOKEN`,
`S1P7-U12-CENSUS-BOTH-HELPERS`, `S1P7-U15-PLANT-SAFETY`, `S1P7-U16-SAMELINE-DERIVED`. `268 + 12 = 280`, so
the **value** is right. Round 5's own commit messages say *"11 registry entries"* and *"all 11 round-5
proofs recorded"*; there are twelve, each carrying a `proof` — which matches
`150 EXECUTED` (was 138 at round 4, `+12`).

**Mechanism (HYPOTHESIS).** `MIN_ENTRIES` was raised once per commit as the batch landed and the note was
written on the first raise, when the count really was 269. The remaining eleven raises moved the number and
not the note — the same *edit the value, leave the sentence* shape as `U14` and `U16`, in the file that
carries those findings' neighbours.

**Remedy (UNVERIFIED).** Replace the two hand-written increments with one line naming the round and the
delta (`268 → 280 at round 5: the twelve class-1 re-audit-4 guards`), and — since this is the third
instance of a ledger note going stale against its own constant this cluster — have `check-cap-literals`
require every `MIN_*`/`MAX_*` literal it finds to be preceded within three lines by a comment containing
its own current value. That makes the note mechanical instead of aspirational.

## `V11` — `minor` · `U16`'s same-line coverage check is keyed on the GATE while its population is per-MATCHER — `U10`'s exact mistake, latent

**Consequence.** None today, and one recipe from now. `U10` is the finding that *"one recipe per FILE
cannot see a second matcher"*, and its fix made `RECIPES` `Recipe | Recipe[]` so the population became
per-matcher. `U16`'s enforcement, added in the same round, waves a matcher through on a **file-level** fact.

**File:line.** `scripts/test-wrap-escapes.ts:511` —
`if (recipe.expect === 'green' || recipe.sameLine || sameLineCovered.has(gate)) continue;`
inside `for (const [n, recipe] of recipesFor(gate).entries())`.

**Measurement.** `sameLineCovered` (derived at `:481`) resolves to five gate files:
`check-glossary.ts`, `check-local-dates.ts`, `check-month-arithmetic.ts`, `check-store-id-writes.ts`,
`check-runner-completeness.ts`. The only gate with more than one recipe today is `check-contrast.ts`, and it
is **not** in that set — both of its matchers carry their own `sameLine`, so nothing is currently waved
through. Add a second matcher to any gate that *is* in the set — `check-glossary` is the obvious candidate,
since `V3` argues its JSX rule should become a second matcher — and one `test:gate-plants` scenario silences
the requirement for both.

**Mechanism (HYPOTHESIS).** `sameLinePlantedElsewhere()` can only return gate **files**, because that is
what `package.json` maps a script to. The loop was written around what the helper could produce rather than
around the unit the enclosing iteration walks. `U10`'s sentence — *budget the enumeration, not the list, and
a file is an enumeration too* — is in this file's own docblock, 200 lines above.

**Remedy (UNVERIFIED).** Accept the file-level fact only for a gate with exactly one recipe:
`(recipesFor(gate).length === 1 && sameLineCovered.has(gate))`. A multi-matcher gate then has to say, per
matcher, who plants its ordinary spelling.
## `V12` — `minor` · the census's ratchet is one-sided: `PER_LINE_UNREVIEWED` is pinned at 12 while `PER_LINE_OK` is unbounded and self-certifying

**Consequence.** The cheapest way to make `test:wrap-escapes` green over a new per-line gate is to write a
sentence about it. `N-10` pinned the *honest* bucket (*"an unreviewed list that can grow is not a backlog,
it is a parking space"*) and left the *certified* bucket with no cap, no departure check, and no
measurement requirement — and `T6`, `N-4` and `U12` between them measured **8** of those sentences false.

**File:line.** `scripts/test-wrap-escapes.ts:320` (`const PER_LINE_OK: Record<string, string>`), `:441`
(`if (gate in PER_LINE_OK) continue;`). Compare `:418` (`MAX_UNREVIEWED = 12`) and the two departure checks
at `:442` and `:450`, which exist for `PER_LINE_KNOWN_BLIND` and `PER_LINE_UNREVIEWED` and for nothing else.

**Measurement** (`class1-reaudit5-probes/b5-census.py`; `check-zzcensus.ts` created and deleted, the census
file restored `cmp`-clean):

| tree | `npx tsx scripts/test-wrap-escapes.ts` |
|---|---|
| clean | `✅ wrap-escapes: 11 wrap-sensitive gate(s) · 12 matcher recipes … 13 per-line by design … ⚠️ 12 per-line and NOT YET REVIEWED` |
| plus a new gate that splits lines and is classified nowhere — `R15`/`T5` | `❌ wrap-escapes: 1 problem(s). • check-zzcensus.ts does not use lib/logicalLines and is named in NONE of PER_LINE_OK, PER_LINE_KNOWN_BLIND or PER_LINE_UNREVIEWED` |
| **plus one `PER_LINE_OK` row reading `'no reason at all, just a sentence nobody measured'`** | **`✅ wrap-escapes: … 14 per-line by design …` exit 0** |
| after cleanup | `✅ … 13 per-line by design …` |

`R15`, `T5`, `T10` and `N-10` are therefore **CLOSED** — the arrival half reds and the population is every
`check-*.ts`. What is not closed is the asymmetry: the count moved `13 → 14` on the green path and nothing
objected.

**Mechanism (HYPOTHESIS).** `PER_LINE_OK` is the census's designed escape hatch, and a hatch needs a reason
rather than a cap — that is a defensible position. What makes it a finding is that this cluster has already
priced the reasons: 4 of 11 written reasons false (`T6`, `N-4`), then 4 more of 17 (`U12`), the last of them
written *three lines below the note recording the first four*. A hatch whose contents are wrong 40 % of the
time is not held by its reason.

**Remedy (UNVERIFIED).** Give `PER_LINE_OK` the same two instruments its siblings have: a pinned count
(`MAX_PER_LINE_OK`, lowered whenever a gate migrates to the shared helper) and a departure check — a row
naming a gate that has become wrap-sensitive, or that no longer exists, should red. Neither proves a reason
true, but both make adding one a two-line edit that a reviewer sees, which is the friction `MIN_ENTRIES`
already relies on.
---

## Measured and NOT a defect — recorded so round 6 does not re-derive it

- **`U13`'s second remedy half was already true when it was filed, and round 5 correctly did nothing.**
  `U13` said *"the staleness check should track every path in `proof.unfix[].at`, not only `entry.file`"*.
  It already did: `git show fcd954d6:scripts/check-finding-guards.ts` line 614 is
  `for (const t of [...new Set((p.unfix ?? []).map((u) => u.at))])`, unchanged at round 4's own head. The
  stated mechanism (*"the staleness check tracks `run-gates.ts` while the proof operates on
  `logicalLines.ts`"*) was wrong; the observation (`entry.file` and the un-fix target disagree) was right and
  harmless. **`U13`'s recommendation stood while its mechanism did not** — Law IV, fifth instance in this
  cluster. ⚠️ What is *not* tracked is `entry.file` itself, i.e. the file whose token is the guard. Round 5
  did not narrow anything: it was never tracked.
- **The `U7` verdict-mark fix is real and its guard discriminates.** `verdictMark(problemCount)` is a pure
  function with an inline self-test over `[0, 1, 9]` (`check-finding-guards.ts:704`), the informational
  block is buffered into `report[]` and flushed at `:709` after every check has run, and the red mark is
  `⛔` rather than `✅` so grepping for `✅` finds nothing on a red run. `S1P7-U7-VERDICT-MARK`'s un-fix
  (`return problemCount ? MARK_BAD : MARK_OK;` → `return MARK_OK;`) reds it by name, re-run and confirmed.
- **`U2`'s own plant no longer reds.** `export const warn = "don't stop";` beside a `crunch` identifier —
  the exact three lines that redded a green tree in round 4 — prints
  `✅ glossary: no retired words in copy (6 banned).` `stringLiterals()` gives each fragment a real extent,
  and `test-strip-code.ts` holds the apostrophe case in both directions.
- **`U15`'s in-process layers work as described.** A live plant is left alone: `armPlant` writes both a
  `.plant-backup` sidecar **and** a `.plant-backup.plant-owner` holding the owner PID before the plant, and
  exports the sidecar path through `PLANT_SAFETY_LIVE` so a child gate process inherits it. Observed
  directly — during `prove:guards`' four wrap-escapes proofs `git status` showed the target modified with
  both sidecars beside it, and the nested `test:wrap-escapes` pre-flight did **not** revert its parent's
  plant. `test:plant-safety` passes 16 assertions and is chained at `run-gates.ts:160`.
- **`U16`'s coverage claim is now derived rather than written.** `sameLinePlantedElsewhere()`
  (`test-wrap-escapes.ts:481`) reads `test-gate-plants.ts` for `gate: 'lint:…'` and resolves each through
  `package.json`'s script map to a `check-*.ts` filename, so renaming a script moves the set with it. Seven
  recipes carry their own `sameLine` and five gates are covered by `test:gate-plants`; the enforcement loop
  at `:504` fails the file for any `expect:'red'` recipe in neither. The clean run prints
  `7 also planted UNWRAPPED here, 5 by test:gate-plants`.
- **`U14` is closed and the summary line is now honest.** `✅ wrap-escapes: 11 wrap-sensitive gate(s) · 12
  matcher recipes — 10 red on the WRAPPED spelling of their own defect, 2 GREEN on correct code a formatter
  produced …`, counted from `exercised` (the recipes actually run) rather than from `wrapSensitive.length`.
  `check-store-id-writes` and `check-finding-guards` are the two `expect: 'green'` rows.
- **`U3` is closed.** `grep -n "IS_LOOKUP" scripts/` returns nothing; `BY_ID` is gone and `BY_ID_G` is
  declared once with its own `g` flag (`check-store-id-writes.ts:52`); `const SEP = /[\/]/;` is gone from
  `check-glossary.ts`. The `:91` paragraph now names `LOOKUP_NAMES` and lists all six members.
- **`U12`'s four measured-immune gates moved with their measurements.** `check-native-a11y-props.ts`,
  `check-a11y-collapse.ts`, `check-type-scale.ts` and `check-webkit-flex-controls.ts` are in `PER_LINE_OK`
  with the reasons `U12` measured (identifier subject · `ts.createSourceFile`), `PER_LINE_UNREVIEWED` is 12
  and `MAX_UNREVIEWED = 12`, `PER_LINE_KNOWN_BLIND` is empty, and `check-finding-guards.ts` left the
  unreviewed list by joining `wrapSensitive` — the census is keyed on `logicalLines|joinedCode`, so adopting
  either helper enrols a gate.
- **The `U11` producer merge did not regress `check-finding-guards`' population.** Over all 280 registry
  entries, `joinCodeLines` + `normaliseFragment` finds every token that a per-physical-line scan finds —
  `FOUND ONLY PER PHYSICAL LINE = 0` — so no guard was lost to the join
  (`class1-reaudit5-probes/p4-joined.ts`). ⚠️ The `268 → 260` and emoji-desync defects `joinedCode`'s own
  docblock records were real and are fixed: `build()` indexes by code **unit**, and `normaliseFragment`
  runs the needle through the same producer as the haystack.
- **The `unreadInputsCopy` producer swap did not lose a single junction.** `codeLinesOnly` is now
  `codeText` from `lib/joinedCode`; the local copy is deleted. Measured through real `npm run test:app`
  exit codes with the plant in a real consumer (`RequiredActionsCard.tsx`, 4 mentions of
  `unreadPlanInputs`), every restore `cmp`-clean (`class1-reaudit5-probes/b6-unread.py`):

  | plant | `test:app` |
  |---|---|
  | an unrelated const *(control)* | exit **0** |
  | `'try again'` and `'above the fold'` as two separate statements — `T14`'s negative | exit **0** |
  | `C1-9` — a template literal wrapped between the two words | exit **1** |
  | `R12` — two literals joined by `+` | exit **1** |
  | `N-7` — a `${' '}` interpolation between the words | exit **1** |
  | `N-7` — two literals joined by a named separator | exit **1** |
  | `R12` — a `{' '}` JSX separator between the words | exit **1** |

  Five junction spellings refused, both controls clean. `C1-9`, `R12`, `N-7` and `T14` are closed **after**
  the producer changed, which is the question the swap raised.
- **The census's arrival half reds, and the population really is every `check-*.ts`.** A new
  `scripts/check-zzcensus.ts` that splits its input into lines and is classified nowhere gives
  `❌ wrap-escapes: 1 problem(s). • check-zzcensus.ts does not use lib/logicalLines and is named in NONE of
  PER_LINE_OK, PER_LINE_KNOWN_BLIND or PER_LINE_UNREVIEWED` — so `R15`, `T5`, `T10` and `N-10` hold. What the
  same probe also found is `V12`.
- **`check-runner-completeness`' composition survives the obvious single-edit un-fixes.** Dropping
  `stripCommentsOnly` from inside `wiredIn` or `chainedGatesFrom` is caught by the two fixtures at `:285`
  and `:360` (a gate commented out inside `GATES`; a commented-out `import` in a runner), so the pin is not
  the only thing holding them.
---

## Summary

**Of the 67 prior findings: 66 CLOSED · 1 NOT CLOSED (`U1`).**

`R5` and `T3` — the pair that survived three close/re-open cycles — are genuinely closed, and `T13`/`U15`'s
remedy is on disk and working. `U1` is closed in its main mechanism and open in the three spellings it also
named (`?.(`, a generic argument list, an extra paren), and the fix that closed it is guarded by nothing.

**12 NEW findings: 1 `blocker` · 5 `major` · 6 `minor`.**

| severity | ids |
|---|---|
| `blocker` | `V4` |
| `major` | `V1` `V3` `V5` `V6` `V7` |
| `minor` | `V2` `V8` `V9` `V10` `V11` `V12` |

| id | one line |
|---|---|
| `V4` | `preflightRestore` overwrote 83 bytes of uncommitted work in a tracked file and deleted the sidecar; it runs inside `lint:rn` |
| `V1` | disabling the `${…}` fix that closed `R5`/`T3`/`U1` leaves all 51 gates green; three of `U1`'s four spellings still blind |
| `V3` | `MAX_JSX_FRAGMENT_LINES = 2` re-opens `T6` — a retired phrase wrapped between its two words in JSX is green, and the harness recipe cannot see it |
| `V5` | `U4` recurs at `check-contrast`'s ink matcher — a comment naming a hex literal reds the gate |
| `V6` | `U8`'s pin is satisfied by a decoy string literal; `D1-1` and `D1-2` re-open green in two edits each |
| `V7` | a deleted guard reads as present when its token sits in a block comment opened mid-line |
| `V2` | `check-glossary` reds on a `crunch` property named inside a template interpolation |
| `V8` | `clampedDay()` exempts `Math.max(1, d.getDate())`, `Number(…)` and any other call |
| `V9` | `U9`'s exemption is keyed on the name `seed`, hiding three real defect spellings |
| `V10` | `MIN_ENTRIES`' ledger note says `268 → 269` beside a constant of `280` |
| `V11` | `U16`'s same-line check is keyed on the gate while its population is per-matcher |
| `V12` | the census pins its unreviewed backlog at 12 and leaves `PER_LINE_OK` unbounded and self-certifying |

⚡ **The one pattern across the twelve, and it is not the same one as round 4's.** Round 4's pattern was
*a fix applied to the instance the finding named, at one of the places the mechanism lives.* Round 5 largely
stopped doing that — `U10` migrated both matchers, `U16` derived its coverage set, `U12` measured before
labelling, `U8` conceded that a composition cannot be closed from inside itself. **Six of the twelve
findings here are instead the remedy's own cost, unmeasured:**

- `U2`'s bound on JSX span stopped the noise and re-opened `T6`'s own case, plus eight paragraphs of shipped copy (`V3`).
- `U2`'s string extents made an interpolated identifier into copy (`V2`).
- `U15`'s choice of *restore over refuse* destroyed uncommitted work (`V4`).
- `U6`'s *"or of any call"* exempted three unclamped days (`V8`).
- `U9`'s name-keyed exclusion hid three defect spellings (`V9`).
- `U10`'s whole-file migration carried `U4`'s defect to the second matcher (`V5`).

Every one of those six is a **stated remedy with its enabling half measured and its cost not measured.**
`U2`'s docblock says *"A Prettier wrap of a two-word phrase spans one"* and nothing about a paragraph.
`plantSafety`'s says *"refusing leaves the planted file in the tree"* and nothing about restoring the wrong
bytes. `U6`'s says *"`Math.min(`, `clampDay(`, `Math.max(` all qualify"* — naming the counter-example as a
feature. This cluster has a rule for the direction it keeps missing (Law IV: *a finding that arrives with a
mechanism still needs measuring*); it does not yet have one for **its own fixes**, and the shape is the
same: ⚡ **a remedy arrives with a stated trade-off, and only the side that motivated it gets measured.**

**The other direction — instruments.** Two of the five majors are not defects in a gate but **absences of
one**: `V1` (the highest-recurrence defect in the cluster has no guard) and `V6` (the pin that stands in for
one is satisfiable by a literal). Round 5 recorded 12 proofs and re-ran them; **the fix that mattered most
was in the commit before the batch and got none.** ⛔ The scoping rule that produced that is worth naming:
the guard batch was derived from the previous round's **finding list**, and `U1` had already left it. A
round's guards should be derived from its **diff**.

## Method notes

- Tree state: `v1.7-dev` @ `21e835dd`, clean at start and clean at finish. `git status --short` at the end
  shows only `CLASS1-REAUDIT-5.md` and `class1-reaudit5-probes/`. Nothing was committed.
- Every gate verdict is a real run of the shipping gate with a clean baseline immediately before the plant
  and a `cmp`-verified restore immediately after. `class1-reaudit5-probes/plant.py` is the driver; it raises
  `PLANT-DID-NOT-APPLY` when the needle is absent and `RESTORE-FAILED` when `cmp` disagrees, so neither
  failure can be read as a result. `git checkout --` was never used.
- ⚠️ **All plants byte-mode** (`open(path,'rb')` / `'wb'`). No restore ever failed `cmp`.
- ⚠️ **Backslashes and `$`** were written through `chr(92)` / `chr(36)` / `chr(39)` placeholders rather than
  into a heredoc — `U13`'s corruption class, third appearance in this audit's tooling. One long
  findings-file append also had to move from a shell heredoc to a file write.
- ⚠️ **`--no-record`** on every `prove:guards` invocation. Recording is the *default*
  (`prove-guards.ts:684`), and a re-audit that re-stamps `measured`/`sha` launders the staleness it exists
  to measure.
- ⛔ **One measurement of my own was invalid and was redone.** The first *"deleted guard in a mid-line block
  comment"* run used a needle (`and it is NOT called the emergency fund`) that is not the registry token
  (`it is NOT called the emergency fund`) and I had not yet checked how many times it occurred. The rerun
  reports the occurrence count, plants the exact token, and adds the ordinary-block-comment **control** that
  turns `V7` from "it went green" into "it went green here and red there." Without the control the finding
  would have been unfalsifiable.
- ⚠️ **The initial `npm run lint:rn` baseline was contaminated by my own plant** — it ran in the background
  while a probe had `AffordabilityCard.tsx` modified, so it reports `1 of 51 gates FAILED: lint:amount-collapse`.
  That gate was separately measured green on the clean tree four times. Lesson recorded rather than hidden:
  a plant harness and a chain run cannot share a working tree.
- ⛔ **Three of the twelve round-5 registry proofs were NOT re-run in full**: `S1P7-U10-INK-WHOLE-FILE`,
  `S1P7-U12-CENSUS-BOTH-HELPERS` and `S1P7-U16-SAMELINE-DERIVED`, whose `run` is `test:wrap-escapes` at
  roughly ten minutes per invocation and two invocations per proof. `S1P7-U5-REASON-VACUITY`, on the same
  harness, was re-run and holds. The three fixes were verified **directly** instead — `U10` by planting a
  wrapped and a same-line ink literal, `U12` and `U16` by reading the derivations and the census's own
  output — which measures the fix but not the proof's discrimination. That is a stated gap.
- ⚠️ **Not re-planted**, because their gate has not moved since round 4 certified them: `D1-7`, `D1-8`,
  `R6`, `R7`, `R9`, `N-2`, `N-4`, `N-6`, `T12`. Each ran `MATCHED` in `test:wrap-escapes` on the clean tree.
- ⛔ **`V4`'s precondition happened to me twice, and the second time is worth recording as a measurement.**
  A confirmatory `npm run lint:rn` was killed by a 10-minute tool timeout while `test:wrap-escapes` had
  `apps/rn/src/store/guardianSelectors.test.ts` planted. `git status --short` immediately afterwards:

  ```
   M apps/rn/src/store/guardianSelectors.test.ts
  ?? apps/rn/src/store/guardianSelectors.test.ts.plant-backup
  ?? apps/rn/src/store/guardianSelectors.test.ts.plant-backup.plant-owner
  ```

  ⚠️ **A tool timeout is a `SIGTERM` to the shell, not to `tsx`, so neither the harness's `finally` nor
  `armPlant`'s signal handlers ran** — which is `T13`/`U15`'s exact mechanism, still live for the
  process-killed-outright case that the pre-flight (and only the pre-flight) covers. Restored by hand from
  the harness's own `.plant-backup`, byte-mode, `cmp`-verified, both sidecars removed;
  `git status --short` and `git diff --stat` are clean. ⚡ **This is the honest half of `V4`: the pre-flight
  is genuinely the only thing that recovers this state — which is why the fix must be to make it refuse to
  guess, not to remove it.**
- ⚠️ **`test:wrap-escapes` alone does not fit in ten minutes**, and it is chained in both `lint:rn` and
  `validate:release:rn`. Twelve recipes × up to three gate invocations each, every invocation a fresh
  `npx tsx`. The confirmatory full-chain run was therefore not completed; the premise rests on the earlier
  full run (every gate green except the one this audit contaminated) plus per-gate baselines taken
  immediately before each of the ~40 plants in this pass.
- Node heap capped at 1536 MB on every long run (`NODE_OPTIONS=--max-old-space-size=1536`). No OOM.
- Probes: `class1-reaudit5-probes/` — `plant.py` (the plant/restore/`cmp` driver) · `b1-u1.py`
  `b2-u8.py` `b3-u6.py` `b4-carryover.py` `b5-census.py` `b6-unread.py` `b7-jsxwrap.py` ·
  `p1-glossary-jsx.ts` `p3-gen.py` `p3-prefill.ts` `sliced-seeds.ts` (generated) `p4-joined.ts`
  `p5-orphan.ts` · captured output in `baseline-lint-rn.txt` `proofs-cheap.txt` `proofs-wrap.txt`
  `census-out.txt` `final-lint-rn.txt` (the timed-out run). `p3` slices its subject out of the production
  file programmatically rather than retyping it; `p5` runs the production `preflightRestore` against a real
  orphan this session produced rather than a synthetic one. Every `b*.py` is re-runnable and idempotent —
  `b1` was re-run from the recorded file at the end of the pass and reproduced its table exactly.
- ⚠️ The driver's byte copies (`class1-reaudit5-probes/backups/`) were deleted at the end: every restore was
  already `cmp`-verified, and leaving 616 KB of duplicated production source under `docs/` is one
  `git add -A` away from being mistaken for content.
