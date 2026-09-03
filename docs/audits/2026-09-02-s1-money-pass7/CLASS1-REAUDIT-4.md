# Class 1 — re-audit 4 (fresh auditor)

Target: branch `v1.7-dev` at `fcd954d6` (clean). Round 4 = commits `87fb7b3b`, `c227a539`, `fcd954d6`.
Prior findings under audit: 11 originals (`D1-findings.md`, `C1-findings.md`, `C2-findings.md`),
15 (`CLASS1-REAUDIT.md`), 11 (`CLASS1-REAUDIT-2.md`), 14 (`CLASS1-REAUDIT-3.md`) = **51**.

Written incrementally. Probes live in `class1-reaudit4-probes/`.

---

## Part 0 — inventory in progress

**First measurement (probe `class1-reaudit4-probes/p1-findcalls.ts`):**

```
plain                calls=1 collapses=1
nested               calls=1 collapses=1
object arg           calls=1 collapses=1
wrapped+comma        calls=1 collapses=1
TEMPLATE INTERP      calls=0 collapses=0     <-- R5 shape
paren in string      calls=1 collapses=1
regex literal arg    calls=1 collapses=1
optional call        calls=0 collapses=0
generic              calls=0 collapses=0
unbalanced           calls=0 collapses=0
jsx slash before     calls=1 collapses=1

find arrow             exempt=true  chain=[find]
findIndex block        exempt=true  chain=[findIndex]
optional find          exempt=false  chain=[<anon>]     <-- false positive at cap 0
generic find           exempt=false  chain=[<anon>]     <-- false positive at cap 0
bare map (should hit)  exempt=false  chain=[<anon> > map]
findLast               exempt=true  chain=[findLast]
deep nest 7            exempt=true  chain=[find]
```

---

## Part 1 — are the 51 prior findings still closed?

**Method.** Every verdict below was reached by **planting** and reading the gate's own summary line and
exit code, or by a probe that runs the production code path. Nothing was concluded from a diff or a
docblock. Every plant was written byte-wise (`open(path,'rb')` / `'wb'`, so CRLF survives — a first
attempt with Python's default text mode silently rewrote a whole file to LF and `cmp` caught it), and
every restore was verified with `cmp` against a copy taken before the plant. Where `git checkout --` was
used it was only on a file with no uncommitted change, and the result was still `cmp`-verified.

**48 CLOSED · 3 NOT CLOSED (`R5`, `T3`, `T13`).**

### The 11 originals

| # | plant | result | verdict |
|---|---|---|---|
| D1-1 | `'lint:money',` → `// 'lint:money',` in `run-gates.ts` `GATES` | `❌ runner completeness: 1 problem(s). … lint:money` | **CLOSED** ⚠️ see `U8` |
| D1-2 | `import "./testPlannerStateHardening";` commented out in `runRegressionTests.ts` | `❌ runner completeness: 1 problem(s). … packages/core/testing/testPlannerStateHardening.ts` | **CLOSED** ⚠️ see `U8` |
| D1-3 | wrapped `parseAmountField(\n raw,\n) ?? 0` into `percentComplete.ts` | `❌ amount-collapse … percentComplete.ts:41 collapses a parsed amount to 0.` | **CLOSED** |
| D1-4 | two collapses in one file (`AffordabilityCard.tsx`) | `❌ amount-collapse: 2 problem(s).` — both reported, no `break` | **CLOSED** |
| D1-6 | wrapped `Math.round(\n x * 100,\n) / 100` | `❌ rounding: 95 inline money-rounding expressions; the cap is 94` | **CLOSED** |
| D1-7 | (a) wrapped `dueDate:\n '2026-09-11'` · (b) `const __dueDate =\n '2026-09-11';` | both `❌ fixture-dates: 1 calendar literal(s) cross into the past within 21 days.` | **CLOSED** |
| D1-8 | wrapped `import {\n appStore,\n} from '../store/appStore'` | `❌ lint:sandbox — 1 unsanctioned reference(s) to the appStore singleton` | **CLOSED** |
| D1-9 | duplicate id at 2-space, 4-space **and** tab indent in `finding-guards.json` | all three `❌ finding-guards: … duplicate id(s) in the registry: S1P1-B1-OWNER` | **CLOSED** |
| D1-11 | the harness exists and is derived: 10 recipes, census over every `check-*.ts` | `✅ wrap-escapes: 10 wrap-sensitive gate(s)`; a new unclassified gate reds | **CLOSED** ⚠️ see `U5` `U16` |
| C1-9 | wrapped `set it again` / `above.` into `RequiredActionsCard.tsx`, `npm run test:app` | exit **1** (control plant `const __x = 'nothing to see here';` exit **0**) | **CLOSED** |
| C2-9 | `useState(editing ? String(editing.apr) : '')` into `DebtSheet.tsx`, `npm run test:app` | exit **1** (control exit **0**) | **CLOSED** |

### `CLASS1-REAUDIT.md` — R1…R15

| # | plant / probe | result | verdict |
|---|---|---|---|
| R1 | `MAX_INLINE_ROUNDING` 94 → 93 (an unrelated red), then `test:wrap-escapes` | `❌ check-rounding.ts wrapped-plant=FAULT-BASELINE-ALREADY-RED` | **CLOSED** |
| R2 | joining/flattening deleted: `lineMap` + `findCalls` + `enclosingCall` are the whole API; `MAX_JOIN`/`MAX_RUN` exist only in the historical docblock | a 263-line `Math.round(` call is still found (see `N-9`) — there is no window to run away | **CLOSED** |
| R3 | `p10-r3.ts` re-runs the gate's own three steps over all 94 live sites and checks each reported line really contains `Math.round` | `94 live rounding sites; 0 report a line that does NOT contain Math.round` (was 17 of 94 wrong) | **CLOSED** |
| R4 | two independent correct statements in one file: `parseAmountField(amount);` then `0 ?? 0;` | `✅ amount-collapse: 0 site(s)` — not merged | **CLOSED** |
| R5 | ``const __p = `x ${parseAmountField(amount) ?? 0}`;`` | **`✅ amount-collapse: 0 site(s)`** — and 26 of 164 live `Math.round(` are unreadable for the same reason | **NOT CLOSED — see `U1`** |
| R6 | two imminent literals, the first carrying `// fixture-date-ok:` | `❌ fixture-dates: **1** calendar literal(s)` — the exemption silences only its own line | **CLOSED** |
| R7 | `// dueDate:` in a comment, literal on the next line | exit **0**: `✅ fixture-dates: 220 test-shaped file(s) scanned · 0 imminent fuses · 120 aged … (cap 120)` — the comment supplies no aging key, so the literal lands in `non-aging` instead of becoming a fuse | **CLOSED** |
| R8 | duplicate id spelled `"S1P1-B1-OWNER"` | `❌ finding-guards: … duplicate id(s) in the registry: S1P1-B1-OWNER` | **CLOSED** |
| R9 | `import * as __ns from '../store/appStore';` | `❌ lint:sandbox — 1 unsanctioned reference(s) to the appStore singleton` | **CLOSED** |
| R10 | see `T9` — the substitution attack is unreachable because `ALLOWED` is empty and enforced | `❌ amount-collapse: ALLOWED is not empty. ⛔ R10 —` | **CLOSED** |
| R11 | hoisted `const __q = editing ? … ; useState(__q)` into `DebtSheet.tsx` | `test:app` exit **1**; the R11 false-positive fixture row still passes | **CLOSED** ⚠️ see `U9` |
| R12 | `` `… set it again ` + `above.` `` into `RequiredActionsCard.tsx` | `test:app` exit **1** | **CLOSED** |
| R13 | `'lint:money',` removed from `GATES` **and** `const __note = 'lint:money';` added below the array | `❌ runner completeness: 1 problem(s). … lint:money` | **CLOSED** |
| R14 | the class carries `S1P7-CLASS1-LOGICALJOIN` (naming all six D1 findings) plus a live harness: reverting `check-store-id-writes`, or any of the four migrated gates, reds `test:wrap-escapes` | measured in `T1`, `T5`, `N-10` and the four discrimination runs | **CLOSED** ⚠️ its recorded proof is vacuous — `U13` |
| R15 | new `scripts/check-zzcensus.ts` (a gate that never splits a line, classified nowhere) | `❌ wrap-escapes: 1 problem(s). • check-zzcensus.ts does not use lib/logicalLines and is named in NONE of PER_LINE_OK…` | **CLOSED** |

### `CLASS1-REAUDIT-2.md` — N-1…N-11

| # | plant / probe | result | verdict |
|---|---|---|---|
| N-1 | the flattening it measured inert is **deleted**, so the finding is closed by removal. Re-run as a discrimination test on the four gates round 4 migrated: each gate restored to `87fb7b3b` with its own recipe snippet appended | all four exit **0** pre-round-4, all four exit **1** at `HEAD` for the named reason | **CLOSED** |
| N-2 | `// … currentDate: '2020-01-01'` in a comment above an imminent `dueDate` | `❌ fixture-dates: 1 calendar literal(s) cross into the past within 21 days.` — a commented pin does not pin | **CLOSED** |
| N-3 | see `U8`: the two named un-fixes are caught | but two others are not — `D1-1` and `D1-2` re-open green | **CLOSED as filed** ⚠️ `U8` |
| N-4 | three spellings into `percentComplete.ts`: chain wrapped at the dot · `.slice(\n 0,\n 10,\n)` · `.split(\n 'T',\n)[0]` | all three `❌ A calendar date routed through UTC` | **CLOSED** |
| N-5 | wrapped `rows.findIndex(\n (r) => r.id === id,\n)` — correct code | `✅ store id writes: no bare id-keyed row edits across 51 store file(s)` | **CLOSED** |
| N-6 | `import { appStore } …` preceded by a three-line docblock | reported at `a11y.ts:181`, which is the import's real line (the docblock is 177–180) | **CLOSED** |
| N-7 | `{' '}` · `${' '}` · `+ SEP +` into `RequiredActionsCard.tsx` | `test:app` exit **1** for all three | **CLOSED** |
| N-8 | destructured `const { apr: __ap } = editing ?? {}` · `let` binding · two hops | `test:app` exit **1** for all three | **CLOSED** ⚠️ see `U9` |
| N-9 | a `Math.round(` whose argument list spans **263 physical lines** | `❌ rounding: 95 inline money-rounding expressions` — no window at all | **CLOSED** |
| N-10 | a real new per-line gate **plus** its `PER_LINE_UNREVIEWED` row (17 → 18) | `❌ wrap-escapes: 1 problem(s). • PER_LINE_UNREVIEWED holds 18 gate(s) and the pin is 17.` | **CLOSED** |
| N-11 | `MIN_CAPS`' ledger note now reads *"27 → 28 … `MAX_UNREVIEWED` in `test-wrap-escapes.ts`"*; `MAX_JOIN` appears nowhere outside `logicalLines.ts`'s historical table | `✅ cap literals: 28 downward-only cap(s) across 70 scripts are literals`, and the round-4 diff adds exactly one cap | **CLOSED** |

### `CLASS1-REAUDIT-3.md` — T1…T14

| # | plant / probe | result | verdict |
|---|---|---|---|
| T1 | `check-store-id-writes.ts` reverted to `b8ce516c` (the pre-`T8` version), then `test:wrap-escapes` | `❌ check-store-id-writes.ts wrapped-plant=FALSE-POSITIVE-ON-CORRECT-CODE` — the recipe can now fail | **CLOSED** ⚠️ see `U14` |
| T2 | `fn(parseAmountField(amount), other ?? 0)` — two correct sibling arguments | `✅ amount-collapse: 0 site(s)` — not merged across the comma | **CLOSED** |
| T3 | (a) `parseAmountField({ raw: amount }) ?? 0` · (b) `Math.round(fn({ a: x }) * 100) / 100` | (a) `❌ … collapses a parsed amount to 0` · (b) `❌ rounding: 95 …` — the brace half is closed | **NOT CLOSED** — the `${…}` half of the same finding is still blind (`U1`) |
| T4 | `WITHIN_STATEMENT` is gone from `lib/logicalLines.ts` | `grep` returns nothing | **CLOSED** ⚠️ three new dead constants — `U3` |
| T5 | a new `check-*.ts` that never splits a line and is classified nowhere | `❌ wrap-escapes … named in NONE of PER_LINE_OK, PER_LINE_KNOWN_BLIND or PER_LINE_UNREVIEWED` | **CLOSED** |
| T6 | `check-glossary` and `check-month-arithmetic` migrated; their recipes discriminate against the `87fb7b3b` versions | pre-round-4 exit **0**, `HEAD` exit **1** (`your breathing room this month` / `percentComplete.ts:… new Date(`) | **CLOSED** ⚠️ `U2` `U6` |
| T7 | `check-contrast` and `check-trust-claims` migrated; recipes discriminate the same way | pre-round-4 exit **0**, `HEAD` exit **1** (`accent.brand … never-text` / `[liveness] drift.ts is ledgered at 1 site(s) and holds 2`) | **CLOSED** ⚠️ a third member is still on the list — `U11`; and `check-contrast` keeps a per-line matcher — `U10` |
| T8 | `rows.findIndex((r) => {\n return r.id === id;\n })` — a block-bodied lookup | `✅ store id writes: no bare id-keyed row edits`; the control `rows.map((r) => (r.id === id ? r : r))` gives `❌ … 1 bare \`x.id === id\` comparison(s) outside a lookup` | **CLOSED** |
| T9 | one entry added to `ALLOWED` in `check-amount-collapse.ts` | `❌ amount-collapse: ALLOWED is not empty. ⛔ R10 —` | **CLOSED** |
| T10 | the census population is `readdirSync(SCRIPTS).filter(/^check-.*\.ts$/)`, not a comment predicate; verified by `T5`'s plant | `❌ wrap-escapes` names the new gate | **CLOSED** |
| T11 | `grep -rln flatten scripts/check-*.ts` → 4 files, all historical or unrelated (`check-a11y-collapse` is about *iOS* flattening; `check-amount-collapse`, `check-cap-literals`, `check-scan-floors` narrate the deleted mechanism as history). No `[^;{}]` bound survives. | — | **CLOSED** |
| T12 | `npx tsx scripts/check-fixture-dates.ts` | `✅ fixture-dates: 220 test-shaped file(s) … 114 on non-aging fields. **[read 22838 lines, floor 21640]**` — `scanNote` is called | **CLOSED** |
| T13 | `grep -n "SIGINT\|process.on\|outstanding\|sidecar" scripts/prove-guards.ts scripts/test-wrap-escapes.ts` → **nothing**; `prove-guards.ts` last touched at `01677ecc`, before round 4 | and the mechanism fired: an interrupted `test:wrap-escapes` left `M apps/rn/src/utils/a11y.ts` + `?? …a11y.ts.wrapescape-backup` | **NOT CLOSED — see `U15`** |
| T14 | the negative row exists; measured against the production `codeLinesOnly` (`p9-unread.ts`) and against `test:app` | 5 positive junction fixtures weld, the shipped negative row does not, and the `test:app` control plant exits 0 | **CLOSED** |

### Counts re-derived independently (round 4 item 9)

| constant | claimed | measured | verdict |
|---|---|---|---|
| `MIN_CAPS` | 28 | `✅ cap literals: 28 downward-only cap(s) across 70 scripts`; the round-4 diff adds exactly one cap (`MAX_UNREVIEWED`), 27 → 28 | correct, justification correct |
| `MAX_AGED_FIXTURE_DATES` | 120 | `120 aged literal(s) … (cap 120)` — exact. ⚠️ Set in **round 2** (`cc178530`), not round 4; the comparison is `>` only, so the cap can carry slack if the count falls | correct |
| `HAND_PARSE_BASELINE` | 43 | `43/43 hand-written local parses (pinned, both directions)` | correct |
| `MAX_INLINE_ROUNDING` | 94 | 94, re-derived by an independent re-implementation over `git ls-files` (`p10-r3.ts`); pinned with `!==` so both directions red | correct — but see `U1`: 26 further occurrences are outside the population |
| `MIN_ENTRIES` | 268 | `json.load(finding-guards.json)` → 268 keys | correct |
| fixture-dates scan floor | 21,640 | ledger records `measuredCount: 22779` on 2026-09-02; 22,779 × 0.95 = 21,640.05 → 21,640. Observed today 22,838 | correct |
| `MAX_UNREVIEWED` | 17 | the set literal holds exactly 17 names and the run prints `⚠️ 17 per-line and NOT YET REVIEWED` | arithmetically correct; **4 of the 17 are mis-classified — `U12`** |

### Measured and NOT a defect — recorded so the next round does not re-derive it

- **`check-trust-claims`' liveness whole-file count equals the per-line count for the right reason, not
  by luck.** `p6-liveness.ts` re-implements the gate's scope (312 files: `apps/rn/src/**`, minus tests and
  the trust module) and counts both ways: `WHOLE-FILE total = 22`, `PER-LINE total = 22`, ledger cap 22,
  and **zero matches contain a newline** — there is no wrapped comparison in the tree today, so the two
  numbers agree because no site distinguishes them. The pattern's `\s*` only ever spans whitespace, so
  the false-positive surface the migration opened is a wrapped comparison, which is a true positive.
- **`unreadInputsCopy`'s `codeLinesOnly` is sound in every direction probed.** `p9-unread.ts` runs the
  production function (sliced verbatim out of the test file) over all five junction fixtures plus three
  negatives. The only weld beyond the fixtures is two *adjacent* JSX literals
  (`<Text>{'try again'}{'above the fold'}</Text>`), which the docblock declares intentional:
  *"they are adjacent **on screen**, which is the only place the refusal matters."*
- **`check-native-a11y-props` is not a class-1 member** (`U12` has the measurement) — a bare prop
  identifier cannot be split by a formatter.
- **`findCalls` handles nesting, an object argument, a trailing comma, a paren inside a string, a paren
  inside a regex literal, and an unbalanced call** correctly (`p1-findcalls.ts`): the first five are
  found, and the unbalanced one is refused rather than guessed.
- **`enclosingCall`'s 6-level cap in `check-store-id-writes` is exact, and it is not binding on this
  tree.** `p11-depthcap.ts` wraps a `r.id === id` comparison in *n* intervening calls inside a
  `rows.find((r) => …)` predicate:

  ```
  wrappers=5  exempt=true   chain=[f4 > f3 > f2 > f1 > f0 > find]
  wrappers=6  exempt=false  chain=[f5 > f4 > f3 > f2 > f1 > f0]
  ```

  So six or more intervening calls lose the exemption and produce a false positive at a cap of 0 — a real
  boundary, with no instance in `apps/rn/src/store` today (the gate is green at 0). Worth noting rather
  than filing: the fix is a `while` instead of a `for`, since the walk terminates on its own.

---

# NEW findings

## U1 — `major` · `findCalls` re-opens `R5` by re-blanking strings inside itself — a collapse or a rounding copy written in a template interpolation is invisible to BOTH money gates, and each gate's docblock claims the opposite one line above the call

**Consequence.** `check-amount-collapse` prints `✅ … 0 site(s)` over a planted
`parseAmountField(amount) ?? 0` written inside a template interpolation. `check-rounding`'s pinned
population of 94 excludes **26 of the 164 `Math.round(` occurrences in the tree** for the same reason.
`R5` was filed in re-audit 1, fixed in round 3 by moving both gates onto `stripCommentsOnly`, certified
closed in re-audit 3, and round 4 undid it *inside the new helper* — the third close/re-open cycle for
this one defect.

**File:line.** `scripts/lib/logicalLines.ts:96` (`const structure = stripCommentsAndStrings(code);`)
and `:102` (`if (structure[open] !== '(') continue;`).

**Measurement.** Plants appended one at a time to `apps/rn/src/components/plan/AffordabilityCard.tsx`
(tracked, not in `SELF`); restore `cmp`-verified byte-identical after the last one.

| plant | `npm run lint:amount-collapse` |
|---|---|
| `const __p = parseAmountField(amount) ?? 0;`  *(control)* | `❌ amount-collapse: 1 problem(s).` |
| ``const __p = `x ${parseAmountField(amount) ?? 0}`;`` | **`✅ amount-collapse: 0 site(s), all named with a reason (693 files, 61015 lines read).`** |
| `const __p = parseAmountField?.(amount) ?? 0;` | **`✅ amount-collapse: 0 site(s)`** |
| `const __p = parseAmountField<number>(amount) ?? 0;` | **`✅ amount-collapse: 0 site(s)`** |
| `const __p = (parseAmountField(amount)) ?? 0;` | **`✅ amount-collapse: 0 site(s)`** |

Live population loss for `check-rounding` (`class1-reaudit4-probes/p3-live-blind.ts`, which re-implements
the gate's own three steps and reports which candidates `findCalls` drops):

```
Math.round( textual occurrences : 164
  skipped: '(' blanked by strip : 26      <-- every one of them inside a `${…}`
  skipped: unbalanced            : 0
  reached depth-scan OK          : 138
```

The 26 dropped sites are real code:
`apps/rn/src/app/(tabs)/index.tsx:1036` `` const dims = `${Math.round(screenW)}x${Math.round(screenH)}`; `` ·
`apps/rn/src/components/plan/TutorialOverlay.tsx:199` and `:349`–`:352` (four and eight in one
interpolation each) · `apps/rn/src/app/(tabs)/progress.tsx:353` `` format={(n) => `${Math.round(n)}%`} `` ·
`apps/rn/src/components/payoff/TrajectoryChart.tsx:102` · plus 5 in Playwright specs.
**None is a `* 100) / 100` site today**, so the pinned number 94 is not currently wrong — the *population*
is, and the cap cannot ratchet over a class it never reads.

Mechanism printed directly (`class1-reaudit4-probes/p2-strip.ts`):

```
RAW    : const s = `v ${parseAmountField(raw) ?? 0}`;
ALL    : const s = `                               `;
CMTONLY: const s = `v ${parseAmountField(raw) ?? 0}`;
```

**Mechanism (HYPOTHESIS).** Both gates deliberately hand `findCalls` text produced by
`stripCommentsOnly`, and both docblocks say why — `check-amount-collapse.ts:118`: *"⚠️ **Strings are NOT
blanked** (`R5`): `stripCommentsAndStrings` blanks `${…}` interpolations, which are code, so a collapse
inside a template literal was caught before the v1 fix and invisible after it."* `findCalls` then calls
`stripCommentsAndStrings(code)` on that same text to build `structure`, and **gates every candidate on
`structure[open] === '('`**. `stripCode`'s scanner has no `${…}` handling at all: on a backtick it blanks
every character to the closing backtick. So the callee's `(` is a space in `structure`, the candidate is
`continue`d, and the caller's decision about strings is silently overridden by the helper's own.

Three further green plants above are separate blind spots of the same helper: `f?.(x)` and `f<T>(x)` are
never matched because the callee regexes require the `(` to be the last character consumed
(`check-amount-collapse.ts:61`, `check-rounding.ts:76`), and `(f(x)) ?? 0` puts a `)` between `argsEnd`
and the `??` that `AFTER` anchors on.

**Remedy (UNVERIFIED).** `findCalls` must not choose its own stripper — take the structure text as a
parameter, or strip comments only, so the caller's `R5` decision holds. Separately widen the callee
patterns to admit `?.(` and a generic argument list. Add a `${…}`-shaped plant recipe to
`test-wrap-escapes.ts` for both money gates, since neither current recipe would have caught this.

## U2 — `major` · `check-glossary`'s whole-file migration turns 1,818 fragments of pure CODE into "user-facing copy", and a planted apostrophe reds a green tree at a cap of zero with no allow-list

**Consequence.** This is class 1's noisy direction, the one with no escape route: `check-glossary` has no
allow-list and no cap — `problems.length > 0` exits 1. Ordinary correct code now reds it.

**File:line.** `scripts/check-glossary.ts:92` (`copyFragments`, now `text.matchAll` over the whole file)
and `:110` (the per-fragment loop). Migrated in `c227a539`; the pre-migration body was
`copyFragments(line)` with `line.match(re)`, so every fragment was bounded by a newline.

**Measurement.** Baseline: `✅ glossary: no retired words in copy (6 banned). [read 26611 lines, floor 24467]`.
Plant appended to `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx` — three lines of ordinary code
containing no retired copy: an English contraction inside a double-quoted string, and a bare `crunch`
identifier of exactly the kind the gate's own docblock declares exempt (*"Identifiers are likewise
fine"*; that same file already ships `points: { x: number; y: number; crunch: boolean }[]` at `:23`):

```ts
export const warn = "don't stop";
export const crunch = 1;
export const other = 'x';
```
```
❌ glossary: 1 retired word(s) back in user-facing copy.
      't stop"; export const crunch = 1; export const other = '
```

Control — the same three lines with the apostrophe removed and `crunch` renamed `crunchCount`:
`✅ glossary: no retired words in copy (6 banned).` Restore `cmp` byte-identical.

Population exposure (`class1-reaudit4-probes/p5-glossary-kinds.ts`, using the gate's own roots, own file
filter and own four fragment regexes):

```
sq : total=6023 multiline=0    maxSpan=0
dq : total=1861 multiline=1    maxSpan=5    packages/core/imports/debtCsv.ts:87
                                            "'; index += 1; continue; } if (char === '"
bt : total=565  multiline=8    maxSpan=4
jsx: total=1976 multiline=1809 maxSpan=39   apps/rn/src/components/plan/CoachMarkLayer.tsx:268
                                            "> 0) return null; if (!active || !rect) return null; const copy = COACH_MARKS[active]; …"
```

**1,818 of 10,425 fragments (17 %) now span more than one physical line**, and the largest is **39 lines
of executable code** being matched against retired-*copy* patterns. One weld is already live in the tree
with no plant at all: the `dq` fragment at `packages/core/imports/debtCsv.ts:87` is a `"` inside a
single-quoted CSV-parser literal, welding five lines of parser code into one "fragment".

**Mechanism (HYPOTHESIS).** `'[^']*'`, `"[^"]*"`, `` `[^`]*` `` and `>[^<>{}]{2,}<` were written for a
per-line application in which the newline was the implicit terminator. Over the whole file each runs to
the next matching delimiter *anywhere*: an apostrophe inside a double-quoted string opens a single-quote
fragment that closes on the next unrelated `'`, and a `>` — comparison operator, generic close, or the
`>` of `=>` — opens a "JSX text" fragment that closes on the next `<`. The `flat` whitespace collapse at
`:113` then makes the welded code read as one sentence, which is what the retired-word patterns are
applied to. The migration docblock states the enabling half of this (*"These fragment patterns already
cross newlines … it was the per-line application that stopped them"*) and states no cost.

**Remedy (UNVERIFIED).** Keep the whole-file scan — it is what closed `T6` — but bound each fragment to a
real string/JSX extent using `stripCode`'s scanner, which already tracks which construct it is inside,
instead of a delimiter-pair regex. Cheaper interim: refuse a fragment whose newline span exceeds 1–2,
which still covers a Prettier wrap of a two-word phrase and rejects a 39-line weld.

## U3 — `minor` · round 4 left three dead constants, one of them `T4`'s own shape (a replacement export with zero consumers) recurring in the commit that closed `T4`

**Consequence.** `T4` was filed because `WITHIN_STATEMENT` had zero consumers, so the gate's stated
mechanism described code nothing ran. Round 4 deleted that one and left three more, and one of them is
named in a mechanism paragraph as the thing doing the work.

**File:line.**
- `scripts/check-store-id-writes.ts:51` — `const IS_LOOKUP = /\.(find|findIndex|some|filter)\s*\(/;`
  declared, never read. The comment at `:84` says *"`BY_ID` says 'this compares an id' and `IS_LOOKUP`
  says '…as part of a find/filter, which is fine'"*. The live exemption is `LOOKUP_NAMES` at `:50`,
  holding **six** names (`find`, `findIndex`, `some`, `filter`, `findLast`, `findLastIndex`) against the
  dead regex's four — so the paragraph both names the wrong constant and understates the exemption.
- `scripts/check-store-id-writes.ts:47` — `BY_ID` exists only to be re-spelled as `BY_ID_G` at `:49`.
- `scripts/check-glossary.ts:28` — `const SEP = /[\/]/;` has no consumers.

**Measurement.** `grep -rn "IS_LOOKUP\|BY_ID\b" scripts/` → 4 hits: the two declarations, one
`BY_ID.source`, one comment. `grep -n "SEP" scripts/check-glossary.ts` → 1 hit, the declaration.

**Mechanism (HYPOTHESIS).** `T4`'s remedy replaced the heuristic without sweeping the constants that
supported it, and nothing in the repo lints `scripts/` for unused module-level bindings (`D1-19`: the
root `lint` that could reports such things as a warning and exits 0).

**Remedy (UNVERIFIED).** Delete all three, and rewrite the `:84` paragraph to name `LOOKUP_NAMES` and
its six members.

## U4 — `major` · `check-contrast`'s `textUses` reads the RAW file, so a COMMENT paints a token — and the whole-file migration widened that from "a comment line" to "a comment line plus the next code line"

**Consequence.** `check-contrast` exits 1 with `✗ exemption broken: \`accent.brand\` is declared
never-text but is painted as a foreground at …` over code that paints nothing. No cap, no allow-list.
The `never-text` exemption's stated mechanism (`scripts/check-contrast.ts:116`) is *"Verified from
source on every run: the first `color:` consumer that appears fails the gate rather than inheriting the
exemption"* — a comment is not a consumer.

**File:line.** `scripts/check-contrast.ts:175` — `const code = readFileSync(file, 'utf8');`, with no
`stripCommentsOnly`. Every sibling gate in this class strips first, and `stripCode.ts`'s own header
gives the reason: *"a guard that reds on its own documentation gets deleted rather than obeyed."*

**Measurement.** Baseline `check-contrast: every rendered token pair clears its floor.`
Plants appended to `apps/rn/src/components/plan/PaydayGuardianCard.tsx`, restore `cmp`-verified.

| plant | result |
|---|---|
| `// A doc comment that merely NAMES the banned pairing: color: c.accent.brand` | `✗ exemption broken … PaydayGuardianCard.tsx:727` |
| a `const __palette = [` / `  // the CTA fill color:` / `  c.accent.brand,` / `];` | `✗ exemption broken … PaydayGuardianCard.tsx:728` |
| the same array with the comment reworded to `// the CTA fill token` *(control)* | `check-contrast: every rendered token pair clears its floor.` |

The **second** plant is the migration-attributable half: the word `color:` is in a comment on one line
and the token is real code on the *next*, so the pre-`c227a539` per-line matcher could not have joined
them. The pattern's `\s*` now does.

**Mechanism (HYPOTHESIS).** `T7`'s fix replaced `.split(/\r?\n/).forEach(… pattern.test(line))` with
`code.matchAll(wide)` over the file, which is right for the wrapped-prop escape it was written for. The
input was left as raw source, so `\bcolor\s*[:=]\s*\{?\s*c\.accent\.brand` can now start inside a
comment and finish in code across the intervening newline.

**Remedy (UNVERIFIED).** Strip with `stripCommentsOnly` before `matchAll` (strings must survive —
`color="…"` spellings are checked elsewhere in this file). That closes both the one-line and the
cross-line spellings at once.

## U5 — `major` · six of the nine red plant recipes' `reason` regexes match the gate's own GREEN output, so `RED-FOR-THE-WRONG-REASON` — the verdict added because *"it redded, but not for your defect"* — is unreachable for two thirds of the harness

**Consequence.** `test-wrap-escapes.ts` scores a recipe `MATCHED` when the gate exits non-zero **and**
`recipe.reason.test(output)`. For six recipes the second condition tests nothing about the defect: it
matches boilerplate the gate prints on every run, pass or fail. A plant that reds its gate through a
side channel — a scan-floor assertion, a different check inside a multi-check gate, a parse fault —
scores `MATCHED`. That is `R1`/`T1`'s shape ("a check that cannot fail") recurring inside the harness
written to close it, at a third location.

**File:line.** `scripts/test-wrap-escapes.ts:76–162`, the `reason` field of each recipe.

**Measurement.** `class1-reaudit4-probes/p7-reason-vacuity.ts` runs each gate on the clean tree and
applies its own recipe's `reason` regex to the **green** output:

```
check-amount-collapse      reason matches its OWN GREEN output = no
check-rounding             reason matches its OWN GREEN output = YES  ("inline money-rounding expressions")
check-sandbox-writes       reason matches its OWN GREEN output = YES  ("sanctioned")
check-local-dates          reason matches its OWN GREEN output = no
check-month-arithmetic     reason matches its OWN GREEN output = YES  ("setMonth")
check-glossary             reason matches its OWN GREEN output = YES  ("retired word")
check-contrast             reason matches its OWN GREEN output = YES  ("contrast")
check-trust-claims         reason matches its OWN GREEN output = YES  ("liveness")
check-fixture-dates        reason matches its OWN GREEN output = no
```

`check-contrast` is the extreme case: the alternation contains the bare word `contrast`, which is in
this gate's name and therefore in every line it prints.

**Mechanism (HYPOTHESIS).** Each `reason` was written by reading the gate's failure message, and a
gate's failure message repeats its own subject — `❌ glossary: N retired word(s)…`,
`check-contrast: N failing pair(s)`, `❌ rounding: N inline money-rounding expressions`. Nothing checks
that the phrase is absent from a passing run, so the regexes drifted into naming the gate rather than
the defect.

**Remedy (UNVERIFIED).** Assert at harness start that no recipe's `reason` matches its own gate's
baseline output — the baseline run already happens at `:340`, so the check is one line and it fails
loudly on exactly the six above. Then narrow each regex to the site-specific half of the failure
(e.g. `/exemption broken: `accent\.brand`/`, `/your breathing room/`, `/percentComplete\.ts:\d+: new Date\(/`).

*(Measured and NOT a defect, recorded so it is not re-derived: all four newly-migrated gates' recipes
DISCRIMINATE. With `git show 87fb7b3b:scripts/<gate>.ts` restored over each gate and the recipe's exact
snippet appended to its exact target, every one exits **0**; against `HEAD` every one exits **1** for
the named reason — `glossary` `your breathing room this month`, `contrast` `accent.brand … never-text`,
`trust-claims` `[liveness] drift.ts is ledgered at 1 site(s) and holds 2`, `month-arithmetic`
`percentComplete.ts:… new Date(`. So the plants do plant the spelling their gate would actually miss.)*

## U6 — `minor` · `check-month-arithmetic` reds on the clamping idiom its own docblock endorses, and the whole-file migration extends that to the wrapped spelling

**Consequence.** Inlining `clampDay` — the helper `getNextPaycheckDate.ts` uses, which the gate's
docblock calls *"the same trick that makes `addMonths` correct"* — makes the gate refuse correct code,
in both the same-line and the wrapped spelling. No cap, no allow-list.

**File:line.** `scripts/check-month-arithmetic.ts:145–152` (`constructorOverflow`): the discriminator
is `DAY_CARRIES_SOURCE.test(day)`, i.e. *`getDate()` appears anywhere in the day slot* — including
inside a `Math.min(…)` that clamps it.

**Measurement.** Baseline `✅ month arithmetic: 704 files, no … overflowing`. Plants appended to
`packages/core/utils/percentComplete.ts`, restore `cmp`-verified:

```ts
// wrapped
export const __clamped = (d: Date) =>
  new Date(
    d.getFullYear(),
    d.getMonth() + 1,
    Math.min(d.getDate(), new Date(d.getFullYear(), d.getMonth() + 2, 0).getDate()),
  );
```
```
❌ A date stepped by months with setMonth/setFullYear (overflows a short month forward):
  packages\core\utils\percentComplete.ts:42: new Date(
```
The same expression on one line reds identically (`:41`), so the false positive itself is **pre-existing
and was left open**; what round 4 added is that a Prettier-wrapped instance now reaches it —
`dateArgs` used to `return null` on an unbalanced line, which silently exempted every multi-line
constructor.

**Mechanism (HYPOTHESIS).** The docblock's four named non-defects are all avoided because the day slot
is a *bare identifier* or a *helper call*. The one shape it does not consider is the clamp written
inline, where `getDate()` is present but bounded — and `DAY_CARRIES_SOURCE` is a substring test with no
notion of what encloses it.

**Remedy (UNVERIFIED).** Exempt a day slot whose `getDate()` is an argument of `Math.min` (or of any
call), which is the written definition of "clamped to the target month before construction".

## U7 — `blocker` · `lint:finding-guards` is RED on the clean tree at `fcd954d6` — round 4's own edits made **9** executed proofs stale against a ceiling of 8, and the chain that runs it is `lint:rn`

**Consequence.** `npm run lint:finding-guards` exits **1** on the committed tree with no plant of any
kind. It is chained at `scripts/run-gates.ts:83`, so `lint:rn` cannot pass. The gate's own closing line
is `[D67]: a closed finding needs a standing guard, or it is not closed` — the instrument that decides
whether *any* of the 51 prior findings is closed is itself failing, and it was committed that way.

**File:line.** `scripts/check-finding-guards.ts` (stale ceiling), `scripts/finding-guards.json`
(the 11 stale proof records).

**Measurement.** `git status --short` shows only this audit's untracked files. Then:

```
$ npx tsx scripts/check-finding-guards.ts
✅ finding-guards: 267 of 268 findings carry a standing guard; 1 unguarded (cap 1, downward-only).
   proof: 138 EXECUTED · 11 of them STALE (cap 8) · 10 authored but never run (cap 10) · …
     stale: S1P4-C4-3-BOTHDIRECTIONS   — scripts/check-trust-claims.ts        moved since e2dcc6b2
     stale: S1P4-C4-4-POPULATION       — scripts/check-trust-claims.ts        moved since e2dcc6b2
     stale: S1P3-D3-CAPS               — scripts/check-trust-claims.ts        moved since e2dcc6b2
     stale: S1P3-G-LIVENESSLEDGER      — scripts/check-trust-claims.ts        moved since e2dcc6b2
     stale: S1P5-D5-13-DERIVEDPOP      — scripts/check-trust-claims.ts        moved since e2dcc6b2
     stale: S1P5-D5-12-RUNNERSET       — scripts/check-runner-completeness.ts moved since 06e1f922
     stale: S1P5-D5-9-CAPWRAP          — scripts/check-cap-literals.ts        moved since 06e1f922
     stale: S1P5-A5-4-ROUNDINGCAP      — scripts/check-rounding.ts            moved since 40122b91
     stale: S1P6-B2-2-EXEMPTION-REASON — scripts/check-sandbox-writes.ts      moved since 40122b91
     stale: S1-ROUTE-STALE-READ        — scripts/audit-route.ts               moved since f7e39483
     stale: S1-ROUTE-EXIT-REACHABLE    — scripts/audit-route.ts               moved since f7e39483

❌ finding-guards: 1 problem(s).
  • 11 executed proof(s) were measured against a tree their target has since left, and the ceiling is 8.
EXIT=1
```

Attribution, measured with `git log --oneline -1 -- <file>`:

| stale target | proofs | last touched by |
|---|---|---|
| `scripts/check-trust-claims.ts` | 5 | `c227a539` — round 4 |
| `scripts/check-runner-completeness.ts` | 1 | `fcd954d6` — round 4 |
| `scripts/check-cap-literals.ts` | 1 | `fcd954d6` — round 4 |
| `scripts/check-rounding.ts` | 1 | `fcd954d6` — round 4 |
| `scripts/check-sandbox-writes.ts` | 1 | `fcd954d6` — round 4 |
| `scripts/audit-route.ts` | 2 | `a881e957` — pre-round-4 |

**9 of the 11 went stale in round 4's own two commits.** Without them the count is 2, comfortably under
the ceiling of 8. `git log` also confirms the recorded SHAs are round-3/round-4-era
(`40122b91` = "class 1 round 3 (wip): delete the flattening", `06e1f922` = "re-point PAYCHECKSTR's
anchor after R10's branch fix").

**Mechanism (HYPOTHESIS).** `prove:guards --record` pins each proof to the blob SHA of its target. Round
4 edited five proven gate files across two commits and did not re-run the proofs, so every proof against
those files decayed at once. The ceiling of 8 is a ratchet on exactly this, and it was passed rather
than lowered. The reason it was not noticed is the same shape the round is about: the gate prints a `✅`
summary line **before** the `❌` verdict (`D1-10`, `minor`, still open — both lines appear in the output
above), so a run read by eye or grepped for `✅` looks green.

**Remedy (UNVERIFIED).** `npm run prove:guards -- --id=S1P4-C4-3-BOTHDIRECTIONS,…` `--record` for the
nine, then confirm the count returns to 2 and lower the ceiling. Longer term the `✅`-before-verdict
ordering (`D1-10`) should be fixed, because it is what let a red gate read as green.

## U8 — `major` · `check-runner-completeness`'s new "production values" assertions do not link the two values they assert, so `D1-1` and `D1-2` are each re-openable by a one-line edit with the gate GREEN

**Consequence.** Round 4's item 6 claims the gate now *"asserts its production values (`runGatesRaw !==
runGatesFile`, and the chain region is a proper subset)"* and names the two un-fixes it closes. Both
named un-fixes are indeed caught. A third and a fourth, one line each, are not — and they re-open
`D1-1` and `D1-2` verbatim. This is `N-3`'s mechanism (*"a self-check that exercises the helper says
nothing about whether the shipping code uses its result"*) at its **fourth** recurrence.

**File:line.** `scripts/check-runner-completeness.ts:274` (`const runGates = chainRegion(runGatesRaw);`)
and `:145` (`const imported = importsOf(r, readFileSync(…));`). The assertions are at `:291` and `:300`.

**Measurement (both un-fixes applied one at a time, with the real defect planted, restore `cmp`-verified).**

*D1-1.* Control first — on the HEAD gate, commenting `'lint:money',` out of `GATES` in
`scripts/run-gates.ts` gives `❌ runner completeness: 1 problem(s). … lint:money`. Then change one
identifier:

```diff
-const runGates = chainRegion(runGatesRaw);
+const runGates = chainRegion(runGatesFile);
```
```
✅ runner completeness: every tracked test file is wired into its runner
   (test:app: 84 tracked · 84 wired · test:regression: 66 tracked · 66 wired · package.json: 8 tracked · 8 wired).
```
`lint:money` has silently left the chain and the gate is green. Both round-4 assertions still hold:
`runGatesRaw` is still computed and still differs from `runGatesFile`, and `runGates` is still shorter
than `runGatesRaw`. Nothing asserts that `runGates` was *derived from* `runGatesRaw`.

*D1-2.* Control — commenting `import "./testPlannerStateHardening";` out of
`packages/core/testing/runRegressionTests.ts` gives
`❌ runner completeness: 1 problem(s). … packages/core/testing/testPlannerStateHardening.ts`. Then:

```diff
-const imported = importsOf(r, readFileSync(join(REPO_ROOT, r.runner), 'utf8'));
+const imported = r.imports(readFileSync(join(REPO_ROOT, r.runner), 'utf8'), r.runner);
```
```
✅ runner completeness: every tracked test file is wired into its runner (… 66 tracked · 66 wired …).
```
The `importsOf` fixture at `:259` still passes — it calls `importsOf` directly — while production no
longer does.

**Mechanism (HYPOTHESIS).** Both assertions are facts about *individual variables*
(`runGatesRaw` is stripped; `runGates` is shorter than `runGatesRaw`) rather than about the *dataflow*
between them. Round 3 asserted the helpers, round 4 asserted two of the values; neither asserts that the
value the gate ultimately searches came out of the stripped, region-bounded pipeline. Each round closed
the un-fix route it had just imagined.

**Remedy (UNVERIFIED).** Assert the composition end to end rather than the parts: derive the searched
text once through a single named function and assert *its output* over a synthetic `run-gates.ts` /
runner text containing a commented-out member — i.e. move the existing fixtures up to the level of the
function production actually calls, so there is only one path and the fixture is on it.

## U9 — `major` · round 4's multi-hop closure in `debtPrefill.test.ts` makes the sanctioned `seed` merge a false positive one hop out, and the suite's single negative row does not exercise the hop

**Consequence.** `test:app` is a release gate with `eq(fromEditing.length, 0, …)` and no allow-list.
`DebtSheet.tsx`'s sanctioned shape is `const seed = editing ?? prefill ?? null;` then
`useState(seed?.apr …)`. Hoisting that initialiser into a named const — an ordinary refactor of
**correct** code that still honours the prefill — is reported as a defect.

**File:line.** `apps/rn/src/components/entities/debtPrefill.test.ts:183–192` (the 3-pass closure) and
`:208` (`.filter((name) => name !== 'seed')`).

**Measurement.** `class1-reaudit4-probes/p8-prefill.ts` extracts `seedsFromEditing` **verbatim** from the
test file at `fcd954d6` (programmatically sliced out of the source, not retyped) and runs it:

```
ok   want=0 got=0  SANCTIONED direct (the shipped shape)
FAIL want=0 got=1  SANCTIONED one hop through seed
FAIL want=0 got=1  SANCTIONED two hops through seed
ok   want=1 got=1  DEFECT hoisted off editing (R11)
ok   want=1 got=1  DEFECT three hops (one past the 3-pass cap)
```

"one hop through seed" is:

```ts
const seed = editing ?? prefill ?? null;
const apr = seed?.apr != null ? String(seed.apr) : '';
const [a, setA] = useState(apr);
```

**Mechanism (HYPOTHESIS).** `N-8`'s fix replaced a one-hop rule with a transitive closure
(`fromDerived` over `derived`), but the `seed` exemption stayed a **single name filter** applied after
the closure. `seed` enters `derived` (its initialiser mentions `editing`), `apr` then enters because its
initialiser mentions `seed`, and only `seed` itself is filtered out. The exemption is one hop deep while
the detector is now unbounded.

The reason no fixture catches it: the one negative row
(`'detector: correct code with a comment inside a wrapped useState is NOT a hit (R11 false positive)'`)
writes `useState(seed?.apr …)` **inline**, so it never crosses a hop. `R11`'s own lesson —
*"the last row is the one that matters most: it asserts correct code stays CLEAN"* — was carried
forward as one row and not re-derived for the new mechanism.

**Remedy (UNVERIFIED).** Seed the exclusion into the closure rather than filtering after it: start
`derived` with `seed` marked as *excluded*, and do not propagate through an excluded binding. Add a
negative fixture row for the hopped sanctioned shape above.

## U10 — `major` · `check-contrast` holds a SECOND, still-per-line matcher (`INK_LITERAL`), and the census can no longer see it because the gate now counts as wrap-sensitive

**Consequence.** A hard-coded ink written the way Prettier emits it walks straight past the gate that
exists to refuse it — the `D1-3`/`D1-6`/`T7` escape, live, inside the file round 4 migrated. And it is
invisible to the census by construction: `check-contrast.ts` imports `lib/logicalLines`, so
`test-wrap-escapes.ts` puts it in `wrapSensitive` and never asks it for a `PER_LINE_OK` reason. Its one
recipe exercises `textUses` and nothing else. `T5` said *"a genuinely wrap-sensitive gate that never
splits lines is invisible to both census lists"*; this is the mirror — a per-line matcher hidden inside a
gate the census counts as fixed.

**File:line.** `scripts/check-contrast.ts:383` — `readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => { … line.matchAll(INK_LITERAL) … })`, with
`INK_LITERAL = /\bcolor\s*[:=]\s*['"](#[0-9a-fA-F]{3,8}|white|black)['"]/g` at `:358`. The `\s*` already
crosses a newline; only the per-line application stops it — verbatim the sentence `textUses` 200 lines
above now carries as its own fix.

**Measurement.** Plants appended to `apps/rn/src/components/plan/PaydayGuardianCard.tsx`, restore
`cmp`-verified.

| plant | `check-contrast` |
|---|---|
| `export const __ink1 = { color: '#123456' };` | `check-contrast: 1 failing pair(s)` · `✗ …:727 paints ink as the literal '#123456'` |
| the same object with the value wrapped:<br>`export const __ink2 = {` / `  color:` / `    '#123456',` / `};` | **`check-contrast: every rendered token pair clears its floor.`** (exit 0) |

A repo-wide survey of the ten wrap-sensitive gates for residual per-line matchers over source content
finds exactly this one: `check-month-arithmetic:200` is `BANNED` on a method *name* (documented, and a
name cannot wrap), `check-local-dates:120` and `check-fixture-dates:179` split lines only for reporting
and for the `fixture-date-ok:` exemption respectively.

**Mechanism (HYPOTHESIS).** `T7` was filed against `textUses` specifically, and the fix was applied to
`textUses` specifically. The gate holds three scans; the census's unit is the FILE, so once one scan was
migrated the file left the reviewable population entirely. The class's own standing rule — *budget the
enumeration, not the list* — applies inside a file as much as across a repo.

**Remedy (UNVERIFIED).** Move the `INK_LITERAL` scan onto `matchAll` over the file with `lineMap` for
attribution, exactly as `textUses` now is; and add a second recipe (or a second `reason`) so
`test-wrap-escapes` covers both matchers rather than one per gate. Structurally: make the recipe map
keyed on *matcher*, not on *file*.

## U11 — `major` · `check-finding-guards`, sitting in `PER_LINE_UNREVIEWED`, is a measured genuine class member: Prettier wrapping a guard's token string makes it report `the guard is gone` over correct code

**Consequence.** `T7` closed by fixing the two `PER_LINE_UNREVIEWED` gates it had measured, and round 4
emptied `PER_LINE_KNOWN_BLIND` to zero. The list still holds a member, and it is the gate that decides
whether every finding in this audit is closed. The failure is the noisy direction — a correct guard
reported missing — and `unguarded` is capped at 1 with no allow-list.

**File:line.** `scripts/check-finding-guards.ts:218` (`presentInCode`, `for (const raw of text.split('\n'))`)
and `:391` (`text.split(/\r?\n/).find((l) => present(l, e.token!) …)`).

**Measurement.** Registry entry `S1P1-B1-OWNER`, whose token is
`Today must NOT reach the debt-free celebration`, guarded at
`apps/rn/src/store/trustSelectors.test.ts:150`:

```ts
eq(state, 'debt-free-unverified', '⛔ B1 — Today must NOT reach the debt-free celebration');
```

Plant — the same assertion with the message wrapped the way Prettier wraps a long string, nothing else
changed:

```ts
eq(state, 'debt-free-unverified', '⛔ B1 — Today must NOT reach the debt-free ' +
      'celebration');
```
```
✅ finding-guards: 266 of 268 findings carry a standing guard; 1 unguarded (cap 1, downward-only).
❌ finding-guards: 3 problem(s).
  • S1P1-B1-OWNER — the guard is gone from apps/rn/src/store/trustSelectors.test.ts:
    no "Today must NOT reach the debt-free celebration"
```
(266, down from 267; the third problem is `U7`'s pre-existing stale-proof failure.) Restore
`cmp`-verified byte-identical.

**Mechanism (HYPOTHESIS).** A guard token is a *sentence*, which is the single most wrappable thing in
the repo, and both `presentInCode` and the declaration check ask whether it appears on one physical
line. The assertion survives, the guard is intact, and the gate says the finding has come un-closed.

**Remedy (UNVERIFIED).** Match the token over the file with the concatenation junctions normalised —
`unreadInputsCopy.test.ts`'s `codeLinesOnly` already does exactly this and is the obvious producer to
reuse — then use `lineMap` for the reported line.

## U12 — `minor` · the census's own annotation names the wrong gate as *"the likeliest genuine member"*, and three of the 17 unreviewed gates are structurally immune, so `MAX_UNREVIEWED = 17` counts things that can never leave it by being reviewed

**Consequence.** The green line prints `⚠️ 17 per-line and NOT YET REVIEWED (downward-only)` every run.
For at least four of the seventeen the sentence is false, and the one annotated as most likely to be a
class member is measurably not one — while `check-finding-guards`, annotated with nothing, is (`U11`).
A backlog whose members are mis-labelled is a backlog nobody can drain, and its pin becomes permanent.

**File:line.** `scripts/test-wrap-escapes.ts:238–241` — the comment
*"⚠️ Matches JSX props, whose VALUES wrap readily — the likeliest genuine member of the class here"*
above `'check-native-a11y-props.ts'`.

**Measurement.**

*The annotated candidate is immune.* Plants into `apps/rn/src/components/plan/PaydayGuardianCard.tsx`:

| plant | `check-native-a11y-props` |
|---|---|
| `export const __p1 = <View accessibilityValue={{ now: 1 }} />;` | `❌ … :727: accessibilityValue` |
| the same prop wrapped over five lines | `❌ … :729: accessibilityValue` |

Both red. `BANNED` matches a bare prop **identifier**, and an identifier is the one construct a
formatter cannot split — the gate's subject is per-line by nature, which is a `PER_LINE_OK` reason, not
an unreviewed row.

*Three more are structurally immune.* `grep -c createSourceFile` over the seventeen:
`check-a11y-collapse.ts`, `check-type-scale.ts` and `check-webkit-flex-controls.ts` each parse with the
TypeScript compiler (`ts.createSourceFile(…, ts.ScriptKind.TSX)`), so formatting is invisible to them by
construction. None of the three splits its input into lines at all.

**Mechanism (HYPOTHESIS).** `T5`'s fix inverted the census — *"the population is now every
`check-*.ts`"* — which is correct, and then routed everything unexamined into a single bucket labelled
"per-line and not yet reviewed". The label describes how the *previous* census selected members, not
what these gates do. The annotation on `check-native-a11y-props` was written from reading rather than
measuring, which is the failure mode `T6` and `N-4` already recorded (*"4 of 11 reasons written from
reading turned out false"*) — recorded, then repeated three lines below the note recording it
(`'Listed rather than reasoned about — 4 of 11 reasons written from reading turned out false (T6, N-4)'`).

**Remedy (UNVERIFIED).** Move the four measured-immune gates into `PER_LINE_OK` with the reasons above
(identifier subject · AST parse), lower `MAX_UNREVIEWED` to 13 and `MIN_CAPS` stays 28; and move
`check-finding-guards.ts` from `PER_LINE_UNREVIEWED` into `PER_LINE_KNOWN_BLIND` with `U11`'s
measurement, which is the state that list was created to hold.

## U13 — `major` · the ONE registry guard covering the whole class-1 fix is proved by a SYNTAX ERROR: its recorded un-fix injects a raw newline into a string literal, every gate fails to compile, and the harness's `FAULT` verdict happens to contain the proof's `expect` string

**Consequence.** `S1P7-CLASS1-LOGICALJOIN` is the standing guard for `D1-3` `D1-4` `D1-6` `D1-7` `D1-8`
`D1-11` — six majors, one entry, and `R14`'s remedy. Running its proof does not measure that the class
is closed. It measures that TypeScript refuses to parse the file. `R1`'s own fix put a baseline run in
the harness precisely so *"a red baseline is a FAULT, never a verdict"* — and this proof's `expect`
string is satisfied by exactly that FAULT.

**File:line.** `scripts/finding-guards.json`, entry `S1P7-CLASS1-LOGICALJOIN`, `proof.unfix[0].replace`.
The JSON source reads:

```json
"replace": "      if (structure[i] === '\n') break;\n      if (structure[i] === '(') depth++;"
```

Both `\n` are JSON escapes, so both decode to real newlines. The first one was meant to survive into the
TypeScript source as the two-character escape `\n` and needed to be written `\\n`.

**Measurement.** The un-fix applied programmatically from the registry itself (`json.load` → `str.replace`
with the recorded `find`/`replace`, so the bytes are the registry's, not retyped):

```
DECODED replace = "      if (structure[i] === '\n') break;\n      if (structure[i] === '(') depth++;"

scripts/lib/logicalLines.ts after the un-fix:
  101:      if (structure[i] === '
  102: ') break;
  103:      if (structure[i] === '(') depth++;

$ npx tsx scripts/check-rounding.ts
Error: Transform failed with 1 error:
  C:\Users\Jason\debt-app-v1\scripts\lib\logicalLines.ts:101:28: ERROR: Unterminated string literal
```

With that un-fix in place, `npm run test:wrap-escapes`:

```
EXIT=1
matches of the registry expect string ("did not red for the WRAPPED spelling"): 10
  ❌ check-amount-collapse.ts     wrapped-plant=FAULT-BASELINE-ALREADY-RED · restored=YES
  ❌ check-contrast.ts            wrapped-plant=FAULT-BASELINE-ALREADY-RED · restored=YES
  ❌ check-fixture-dates.ts       wrapped-plant=FAULT-BASELINE-ALREADY-RED · restored=YES
```

All ten gates fault; the phrase the proof looks for appears ten times; the proof passes. Restore
`cmp`-verified byte-identical.

**A second, latent half.** The entry's `file` is `scripts/run-gates.ts`, so the staleness check tracks
`run-gates.ts` while the proof operates on `scripts/lib/logicalLines.ts`. `logicalLines.ts` happens not
to have moved since the recorded `sha` `9c526e4b` (`git diff --stat 9c526e4b..HEAD -- scripts/lib/logicalLines.ts`
is empty), so the proof is not stale today — but if it moved, nothing would say so. The proofs that DID
go stale (`U7`) are the ones whose `file` is the thing that changed.

**Mechanism (HYPOTHESIS).** The escape was written by hand (or by a script) into JSON, where one level of
backslash is consumed by the JSON decoder before the string reaches the file. This repo's own record
lists *"collapsed `\n` escapes"* among the four invisible corruptions scripted edits have already
injected into this code. The reason it was never noticed is the `expect` mechanism: it is a substring
test over the harness's whole output, and the harness's FAULT message is worded with the same phrase as
its FAILED-OPEN message, so a compile error and a genuine blindness are indistinguishable to it.

**Remedy (UNVERIFIED).** Write `\\n` in the JSON, then re-run the proof and confirm the verdicts read
`FAILED-OPEN`, not `FAULT-BASELINE-ALREADY-RED`. Separately, `prove-guards.ts` should refuse a verdict
whose run output contains `FAULT-` at all — the same rule `R1` put inside the harness, one level up —
and the staleness check should track every path in `proof.unfix[].at`, not only `entry.file`.

## U14 — `minor` · `test:wrap-escapes` prints *"10 wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect"* while one of the ten is an `expect: 'green'` recipe that must NOT red

**Consequence.** `T1` was filed because that exact sentence was printed over a gate whose recipe proved
nothing. Round 4 fixed the recipe and left the sentence, so the green line still asserts something false
about `check-store-id-writes` — and the per-gate line for it also reads `wrapped-plant=MATCHED`, with no
indication that MATCHED there means "stayed green".

**File:line.** `scripts/test-wrap-escapes.ts:398` (the summary) and `:361` (the per-gate result line).

**Measurement.** On the clean tree:

```
  ✅ check-store-id-writes.ts     wrapped-plant=MATCHED · restored=YES
✅ wrap-escapes: 10 wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect · 9 per-line by design · ⛔ 0 MEASURED BLIND, awaiting fix · ⚠️ 17 per-line and NOT YET REVIEWED (downward-only).
```

`scripts/test-wrap-escapes.ts:114` sets `expect: 'green'` for that gate, and `:352` scores it
`MATCHED` when `r.code === 0`.

**Mechanism (HYPOTHESIS).** `expect` was added to the recipe type and to the verdict switch; the two
places that *describe* the result were not updated with it.

**Remedy (UNVERIFIED).** Count the two directions separately — *"N red on the wrapped spelling · M green
on correct wrapped code"* — and print `stayed-green` rather than `MATCHED` for an `expect: 'green'` row.

## U15 — `minor` · `T13`'s remedy was never implemented, and its mechanism fired in this audit: an interrupted `test:wrap-escapes` left a plant and a `.wrapescape-backup` in the working tree

**Consequence.** Round 4's commit message records all fourteen `T` findings closed. `T13`'s remedy —
*"make the restore not depend on the process surviving … a `process.on('SIGINT')` and `process.on('exit')`
restore … `fault` should refuse to exit while a plant is outstanding"* — is absent from both harnesses.
A killed run leaves modified production source behind, which the next gate run then reads as the tree.

**File:line.** `scripts/prove-guards.ts` — `grep -n "SIGINT\|process.on\|outstanding\|sidecar"` returns
**nothing**; the file's last commit is `01677ecc`, before round 4.
`scripts/test-wrap-escapes.ts:330–357` — the plant is written inside a `try`/`finally`, and `finally`
does not run on a signal.

**Measurement.** A `npm run test:wrap-escapes` run in this audit was killed at a 2-minute tool timeout.
Immediately afterwards:

```
$ git status --short
 M apps/rn/src/utils/a11y.ts
?? apps/rn/src/utils/a11y.ts.wrapescape-backup
```

The plant (`check-glossary`'s wrapped retired phrase) was still on disk in a tracked production file.
Restored from the harness's own `.wrapescape-backup` and `cmp`-verified against a copy taken before the
session touched the file.

**Mechanism (HYPOTHESIS).** Exactly as `T13` states it: the restore lives in a `finally`, and neither a
signal nor `process.exit` runs one. `T13` measured this in `prove-guards.ts` and named
`test-wrap-escapes.ts`'s `.wrapescape-backup` as the *idiom to copy* — the backup file is written, so
recovery is possible, but nothing performs it, and round 4 added five more recipes (ten targets) without
adding the pre-flight that would use them.

**Remedy (UNVERIFIED).** As `T13` filed it, plus the half its own text points at: a pre-flight in both
harnesses that finds any `*.wrapescape-backup` / sidecar left in the tree and restores from it before
starting, refusing to run until the tree is clean.

## U16 — `minor` · `test-wrap-escapes.ts` justifies planting only the wrapped spelling by saying the same-line one *"is already covered by `test:gate-plants`"* — and it is not, for 6 of the 10 gates

**Consequence.** For six wrap-sensitive gates, **no harness in the repo plants the same-line spelling of
their defect.** A gate that loses the ordinary spelling — by a widened `AFTER` regex, a mis-edited
callee pattern, or a second matcher going blind (`U10` is exactly that) — is caught by nothing, and the
stated reason for not covering it is false.

**File:line.** `scripts/test-wrap-escapes.ts:15–16` — *"⚠️ **Each plant is the WRAPPED spelling only.**
The same-line spelling is already covered by `test:gate-plants`; planting it again here would re-measure
the half that was never broken."*

**Measurement.** Every gate `scripts/test-gate-plants.ts` runs, extracted from the file:

```
lint:cap-literals  lint:destructive  lint:glossary  lint:local-dates
lint:month-arithmetic  lint:runner-completeness  lint:store-id-writes  lint:type-scale
```

The ten `wrapSensitive` gates are `check-amount-collapse`, `check-contrast`, `check-fixture-dates`,
`check-glossary`, `check-local-dates`, `check-month-arithmetic`, `check-rounding`,
`check-sandbox-writes`, `check-store-id-writes`, `check-trust-claims`. Intersection: **4 covered**
(glossary, local-dates, month-arithmetic, store-id-writes). **6 not covered**: `amount-collapse`,
`contrast`, `fixture-dates`, `rounding`, `sandbox-writes`, `trust-claims`.

**Mechanism (HYPOTHESIS).** The sentence was true when the harness held four recipes — three of which
`test:gate-plants` did cover. Round 3 and round 4 added six more recipes and did not re-check the
sentence, which is the same *carried premise* shape as `T6`'s and `N-4`'s false `PER_LINE_OK` reasons.

**Remedy (UNVERIFIED).** Either add same-line scenarios to `test:gate-plants` for the six, or assert the
claim mechanically — derive `test-gate-plants`' covered set and fail if a `wrapSensitive` gate is in
neither harness's same-line coverage. The second is the one this repo's own rule prefers: a written
reason is a claim, and this class has now paid four times for believing one.

---

## Summary

**Of the 51 prior findings: 48 CLOSED, 3 NOT CLOSED** — `R5` (`U1`), `T3`'s `${…}` half (`U1`),
`T13` (`U15`).

**16 NEW findings: 1 `blocker` · 9 `major` · 6 `minor`.**

| severity | ids |
|---|---|
| `blocker` | `U7` |
| `major` | `U1` `U2` `U4` `U5` `U8` `U9` `U10` `U11` `U13` |
| `minor` | `U3` `U6` `U12` `U14` `U15` `U16` |

⚠️ **The round's premise does not hold: `fcd954d6` does not pass all 50 gates.**
`npm run lint:finding-guards` exits 1 on the clean tree (`U7`), it is chained at `run-gates.ts:83`, and
its `✅` line prints before its `❌` verdict — so a run read by eye, or grepped for `✅`, looks green.

⚡ **The one pattern across the sixteen.** Nine of them are a *fix applied to the instance the finding
named, at one of the places the mechanism lives*:

- `R5` was fixed in both money gates' callers and re-broken inside the shared helper they call (`U1`).
- `T7` was fixed in `check-contrast`'s `textUses` and left in the same file's `INK_LITERAL` (`U10`).
- `N-3` closed the two un-fix routes it had imagined and left two more, one line each (`U8`).
- `N-8`'s closure made the `seed` exemption one hop shallower than the detector (`U9`).
- `T4` deleted the dead constant it named and left three siblings (`U3`).
- `T7`'s two measured members were fixed while a third sat unmeasured on the same list (`U11`).
- `R1`'s "a FAULT is never a verdict" rule was put inside the harness and not in the proof that runs it
  (`U13`).
- `T1`'s recipe semantics were fixed and the sentence describing them was not (`U14`).
- `T6`/`N-4`'s "a written reason is a claim" lesson was recorded and then a new false reason was written
  three lines below the note recording it (`U12`, `U16`).

**Two directions are worth separating for the next round.** The *blind* half is now mostly one thing —
`findCalls` re-blanking strings (`U1`), which is a two-line fix and closes `R5`, `T3` and 26 unreadable
live sites at once. The *noisy* half is four independent false positives on correct code
(`U2` `U4` `U6` `U9`), all created by moving a per-line matcher to whole-file without also bounding what
"the whole file" means, and every one of them at a cap of zero with no allow-list.

---

## Method notes

- Tree state: `v1.7-dev` @ `fcd954d6`, clean at start and clean at finish. `git status --short` shows
  only `docs/audits/2026-09-02-s1-money-pass7/CLASS1-REAUDIT-4.md` and
  `docs/audits/2026-09-02-s1-money-pass7/class1-reaudit4-probes/`. Nothing was committed.
- `npm run prove:guards` was **never run**. `scripts/finding-guards.json` was planted four times
  (duplicate ids) and restored each time; `cmp` against a pre-plant copy is clean.
- ⚠️ **A byte-mode plant helper was necessary.** The first plant used Python's default text mode, which
  read CRLF as `\n` and wrote LF — silently converting a whole tracked file's line endings. `cmp` caught
  it at "char 43, line 1"; `git diff` would not have shown it as anything but a whole-file change. Every
  later plant used `open(path,'rb')`/`'wb'`.
- ⚠️ **Backslashes do not survive into a shell heredoc reliably here.** Three probes were written with
  `\\n` and arrived as a real newline, producing "Unterminated regular expression" and "Unterminated
  string literal" at load. Probes were regenerated with a `@BS` placeholder substituted for `chr(92)` in
  Python. This is the same corruption class as `U13`, arriving in this audit's own tooling.
- ⚠️ **An interrupted `npm run test:wrap-escapes` leaves a plant in a tracked file** — see `U15`. If a
  run of that harness is killed, check `git status` and restore from the `.wrapescape-backup` it leaves
  beside the target.
- Probes: `class1-reaudit4-probes/` — `p1-findcalls.ts` `p2-strip.ts` `p3-live-blind.ts`
  `p4-glossary-fragments.ts` `p5-glossary-kinds.ts` `p6-liveness.ts` `p7-reason-vacuity.ts`
  `p8-prefill.ts` `p9-unread.ts` `p10-r3.ts` `p11-depthcap.ts`, plus `driver.ts` (the plant/restore/`cmp`
  runner) and `batch1.ts` `batch2.ts`. `p8` and `p9` slice their subject **out of the production file
  programmatically** rather than retyping it, so they cannot drift from what ships.
- `test:app` runs in ~18 s, so every detector verdict is a real `npm run test:app` exit code with a green
  control plant, not a re-implementation.
