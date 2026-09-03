# Class 1 — THIRD re-audit, fresh auditor, 2026-09-02/03

Target tree: `v1.7-dev` @ `b8ce516c`, clean at start and clean at the end. Under audit: `04798d84` and
`b8ce516c` (round 3, which closed the 11 findings of `CLASS1-REAUDIT-2.md` plus the 3 that had not
closed).

**Method.** Every verdict below was reached by **planting and reading the command's own exit code and
summary line**, never by reading a diff. Plants are written by `class1-reaudit3-probes/plant.py`, which
snapshots the target's exact **bytes**, asserts the plant changed them, and restores in `__exit__` with a
byte-equality assertion. `git checkout --` was never used; `git diff` was never treated as a restore
check. Plants match the target's own line endings (`core.autocrlf=true`; 297 of 848 tracked sources are
CRLF in the worktree).

`scripts/finding-guards.json` was **never opened for writing** — `prove:guards` was run only against a
scratch registry in `class1-reaudit3-probes/` and with `--no-record`. Both tracked JSON files are
**byte-identical to their `HEAD` blobs** (`cmp`, clean). Probes: `class1-reaudit3-probes/`.

⚠️ **Two probe files were corrupted by the shell before they were run, and both were caught by a control
rather than by inspection.** A quoted bash heredoc collapsed `\\s`/`\\(` to `\s`/`\(` inside a `.ts` probe
(caught by a `SyntaxError`), and collapsed `'\\n'` to a real newline inside a `.py`-written probe gate —
which produced a **false "the census does not see a new per-line gate" result**. Re-written with the
`Write` tool, the census **does** see it (R15 below). Every TS/probe-gate file after that point was written
by tool, not heredoc.

**Baseline, this tree, all green:**

```
check-amount-collapse     exit 0  ✅ 0 site(s), all named with a reason (693 files, 60889 lines read)
check-rounding            exit 0  ✅ 94 inline money-rounding expressions (cap 94)
check-sandbox-writes      exit 0  ✅ 24 sanctioned appStore consumers
check-fixture-dates       exit 0  ✅ 220 files · 0 imminent · 120 aged (cap 120) · 127 pinned · 114 non-aging
check-finding-guards      exit 0  ✅ 267 of 268 findings carry a standing guard
check-runner-completeness exit 0  ✅ 84·84 / 66·66 / 8·8
check-store-id-writes     exit 0  ✅ no bare id-keyed row edits across 51 store file(s)
check-local-dates         exit 0  ✅ 43/43 hand-written local parses (pinned, both directions)
check-cap-literals        exit 0  ✅ 27 downward-only cap(s) across 70 scripts
test:wrap-escapes         exit 0  ✅ 6 wrap-sensitive · 11 per-line by design · ⚠️ 11 NOT YET REVIEWED
```

---

# Part 1 — the 11 original findings

| # | subject | verdict |
|---|---|---|
| D1-1 | `check-runner-completeness` · commented-out gate | **CLOSED** *(un-guarded — see R14/N-3)* |
| D1-2 | `check-runner-completeness` · commented-out suite import | **CLOSED**, and now genuinely guarded |
| D1-3 | `check-amount-collapse` · wrapped collapse | **CLOSED** |
| D1-4 | `check-amount-collapse` · every site, not the first | **CLOSED** |
| D1-6 | `check-rounding` · wrapped `Math.round` | **CLOSED** |
| D1-7 | `check-fixture-dates` · wrapped fuse + variable-assigned fuse | **CLOSED**, both spellings |
| D1-8 | `check-sandbox-writes` · wrapped import **and** namespace import | **CLOSED**, both halves |
| D1-9 | `check-finding-guards` · duplicate id under any indent | **CLOSED**, four spellings |
| D1-11 | `test:wrap-escapes` · proofs plant only the caught spelling | **CLOSED** *(one recipe is vacuous — `T1`)* |
| C1-9 | `unreadInputsCopy.test.ts` · wrapped `again above` | **CLOSED** *(two sibling spellings open — N-7)* |
| C2-9 | `debtPrefill.test.ts` · ternary `useState(editing ? …)` | **CLOSED** *(two sibling spellings open — N-8)* |

**11 closed · 0 not closed.**

### D1-1 — CLOSED
Plant: `scripts/run-gates.ts` `'lint:money',` → `// 'lint:money',`.
```
❌ runner completeness: 1 problem(s).
  • [lint:rn] 1 lint script(s) exist in package.json and are in NO chain: lint:money
EXIT=1
```

### D1-2 — CLOSED
Plant: `packages/core/testing/runRegressionTests.ts` → `// import "./testAbuseScenarios";`.
```
❌ runner completeness: 1 problem(s).
  • [test:regression] … packages/core/testing/testAbuseScenarios.ts
EXIT=1
```

### D1-3 — CLOSED
Plant appended to `apps/rn/src/utils/format.ts` (CRLF, matching the file):
`export const __d13 = (raw: string) =>` ⏎ `  parseAmountField(` ⏎ `    raw,` ⏎ `  ) ?? 0;`
```
❌ amount-collapse: 1 problem(s).
  • apps/rn/src/utils/format.ts:72 collapses a parsed amount to 0.
EXIT=1
```
⚡ 72 is the line of the **match**, not of the statement (the plant starts at 70). `R3`'s fix holds.

### D1-4 — CLOSED
Two single-line collapses appended to one file. **Both** are reported — the `break` is gone:
```
  • apps/rn/src/utils/format.ts:71 collapses a parsed amount to 0.
  • apps/rn/src/utils/format.ts:72 collapses a parsed amount to 0.
EXIT=1
```

### D1-6 — CLOSED
A 4-line wrapped `Math.round(` ⏎ `  x * 100,` ⏎ `) / 100` appended to `format.ts`:
`❌ rounding: 95 inline money-rounding expressions; the cap is 94 and it only goes DOWN.` **EXIT=1**

### D1-7 — CLOSED, both spellings
| plant | result |
|---|---|
| A — `dueDate:` ⏎ `  '<today+8>',` | **exit 1** · `format.test.ts:65  dueDate: '2026-09-11'  — fires in 8 day(s)` |
| B — `const plantedDueDate = '<today+8>';` then `{ dueDate: plantedDueDate }` | **exit 1** · `format.test.ts:63  plantedDueDate: '2026-09-11'` |

### D1-8 — CLOSED, both halves
Both prepended to `apps/rn/src/utils/format.ts`, both **exit 1** naming `format.ts:1`: the wrapped
`import {` ⏎ `  appStore,` ⏎ `} from '../store/appStore';`, and `import * as appStoreModule from …`.
⚠️ The reported line is wrong in both cases when a docblock precedes it — that is `N-6`, still open.

### D1-9 — CLOSED, four spellings
Four probe registries were regenerated independently from the tracked 268-entry file
(`p02-registry.py`), each inserting one duplicate id spelled differently, each parsing to 268 unique ids
under `JSON.parse`. All four run through `--registry=`:

| probe registry | result |
|---|---|
| `reg-indent2.json` | **exit 1** · `duplicate id(s) in the registry: S1P1-B1-OWNER` |
| `reg-indent4.json` (D1-9's case) | **exit 1** · same |
| `reg-tab.json` | **exit 1** · same |
| `reg-unicode.json` (`\u0053…`, R8's case) | **exit 1** · same |

And both un-fixes red on the gate's own fixture rows before it reads the registry:
`topLevelKeys` → `/^\s{2}"([^"]+)":/gm` gives
`❌ finding-guards: the duplicate detector is BLIND to the "four-space" case` (exit 1); dropping the
`JSON.parse` decode gives `… BLIND to the "escaped key" case` (exit 1).

### D1-11 — CLOSED
Reverting each of the six gates' own class-1 bound is detected for **five** of them (see `R1`/`N-1`
below for the full table). ⛔ The sixth — `check-store-id-writes` — is **not**, and its recipe is
vacuous: `T1`.

### C1-9 — CLOSED
Plant into `RequiredActionsCard.tsx:159`, the sentence split across a source line break, run under
`npm run test:app`:
```
❌ App-layer regression run failed: Error: FAIL
   [apps/rn/src/components/plan/RequiredActionsCard.tsx: no refusal points "above" at a card that one tap removes]
EXIT=1
```
The detector is asserted on four fixtures every run (`unreadInputsCopy.test.ts:187-199`), and the
production sweep at `:204` calls the **same** `codeLinesOnly` — a genuine production-path fixture.

### C2-9 — CLOSED
Plant into `DebtSheet.tsx:136`, `useState(editing ? String(editing.apr) : '')`:
```
❌ App-layer regression run failed: Error: FAIL
   [no useState in DebtSheet seeds from `editing` … (found 1) (expected 0, got 1)]
EXIT=1
```
Four detector fixtures plus one negative row, all through the same `seedsFromEditing` production uses.

---

# Part 2 — the 15 findings of re-audit 1

| # | subject | verdict |
|---|---|---|
| R1 | no green baseline before the plant | **CLOSED** |
| R2 | joins run away to `MAX_JOIN` | **CLOSED** — there is no join and no `MAX_JOIN` |
| R3 | hit reported at the join's first line | **CLOSED** for the money gates *(sandbox: N-6)* |
| R4 | two correct statements reported as one collapse | ⛔ **NOT CLOSED** — moved from newline-separated to comma-separated siblings |
| R5 | a collapse inside a template interpolation | **CLOSED** *(reopened from the other side — `T3`)* |
| R6 | one `fixture-date-ok:` silences a whole statement | **CLOSED** |
| R7 | a comment supplies the aging key | **CLOSED** |
| R8 | `\uXXXX`-escaped duplicate id invisible | **CLOSED** |
| R9 | namespace import of the singleton admitted | **CLOSED** |
| R10 | `ALLOWED` is identity-free | **CLOSED** *(the empty list is not pinned — `T9`)* |
| R11 | `C2-9`'s pattern has an FN and an FP | **CLOSED** |
| R12 | the concatenated `again above` spelling | **CLOSED** |
| R13 | chain membership by `String.includes` over the whole file | **CLOSED** *(un-guarded — N-3)* |
| R14 | five fixes carry no standing guard | ⛔ **NOT CLOSED** — four are guarded, `D1-1` is not |
| R15 | the harness can only see gates that already adopted the fix | **CLOSED** |

**13 closed · 2 not closed.**

### R1 — CLOSED
Measured as a by-product of the un-fix table below. Reverting `check-rounding`'s bound to `[^\n]` drops
the live count to 93, so the gate is red at **baseline**; the harness scores it
`FAULT-BASELINE-ALREADY-RED` and **exits 1** rather than reporting `MATCHED`:
```
❌ check-rounding.ts            wrapped-plant=FAULT-BASELINE-ALREADY-RED · restored=YES
❌ wrap-escapes: 1 problem(s).
EXIT=1
```

### R2 — CLOSED
`flattenContinuations` is gone; `grep -rn "MAX_JOIN\|MAX_RUN" scripts/` finds **no constant**, only
historical prose. `lib/logicalLines.ts` exports `lineMap` and one string.

**`lineAt` verified independently** (`p11-linemap.ts`) against an oracle that counts newlines:

```
unit offsets:  137 checked, 0 mismatches   (empty · no-newline · LF-only · CRLF-only · trailing-newline
                                            · bare CR · blank runs · lone CR mid-line, at every offset
                                            from -3 to len+3)
tree sweep:    848 files (297 contain CRLF), 6,278,090 offsets, 0 mismatches
```
Named edges on `"aa\nbb\ncc\n"`: `lineAt(0)=1`, `lineAt(2)=1` (**at the newline itself — the line it
ends**), `lineAt(3)=2`, `lineAt(9)=4` (EOF after a trailing newline), `lineAt(999)=4` (clamps),
`lineAt(-1)=1`. On CRLF: `lineAt` at the `\r` and at the `\n` both return the line they end.
**`lineMap` is sound at offset 0, at a newline, at EOF, past EOF, at a negative index, and on CRLF.**

### R3 — CLOSED for the money gates
`D1-3` reports line 72 for a match on line 72; `D1-6`'s and `D1-4`'s printed lines carry the match.
The sandbox drift survives at the same size as re-audit 2 measured it — 4 of 31 (`N-6`).

### R4 — ⛔ NOT CLOSED

The JSX form R4 exhibited **is** closed: its plant, verbatim, into `PaydayGuardianCard.tsx`
(five sibling `<Text>` elements, `parseAmountField(rawA)` in the first and `Number(other) ?? 0` in the
last) now gives **exit 0**. `}`/`{` end the run.

⛔ **The same false positive reappears wherever two sibling expressions are separated by a comma**, which
`[^;{}]` does not stop at. One store, `apps/rn/src/utils/format.ts`; one variable, the separator.

| plant — two individually CORRECT expressions | `check-amount-collapse` |
|---|---|
| array elements: `[` ⏎ `  String(parseAmountField(a)),` ⏎ `  Number(b) ?? 0,` ⏎ `]` | ⛔ **exit 1** · `1 problem(s)` |
| call arguments: `join(String(parseAmountField(a)), Number(b) ?? 0)` | ⛔ **exit 1** |
| ternary arms: `f ? String(parseAmountField(a)) : Number(b) ?? 0` | ⛔ **exit 1** |
| **control** — the same two expressions with a `;` between them | ✅ **exit 0** |

and the same shape on the other money gate:

| plant | `check-rounding` |
|---|---|
| `[` ⏎ `  Math.round(a),` ⏎ `  (b * 100) / 100,` ⏎ `]` | ⛔ **exit 1** · `95 … the cap is 94` |
| `pair(Math.round(a), (b * 100) / 100)` | ⛔ **exit 1** · `95 … the cap is 94` |

Two ASI statements with no semicolons also match (`const __a = parseAmountField(rawA)` ⏎
`const __b = Number(other) ?? 0` → exit 1 at `:71`).

**Mechanism (HYPOTHESIS).** R4's remedy was *"bound the argument class structurally (balanced parens
from the call's own `(`)"*. What shipped bounds it by a **character class** instead, and a character
class can only refuse the separators someone listed. `;` `{` `}` are the separators between
*statements*; `,` and `)` are the separators between *sibling expressions*, and they are just as much a
boundary the pattern must not cross. The window shrank from 200 lines (v1) to 8 lines (v2) to "until the
next `;{}`" (v3), and at every size the defect was the same one: the pattern is allowed to leave the
call it started in.

**Remedy — UNVERIFIED.** The balanced-paren scan R4 asked for: from the head's own `(`, walk to the
matching `)`, then test the suffix. `p08-live-sweep.ts` implements exactly that and reproduces both live
counts (94 and 0) with no character-class bound at all — so the change is measurable against the
current numbers before it is made. Not verified against `check-rounding`'s cap under a formatter change.

### R5 — CLOSED
The re-audit's own plant, appended to `format.ts`:
`` return `${parseAmountField(raw) ?? 0} and ${Math.round(x * 100) / 100}`; ``

| gate | result |
|---|---|
| `check-amount-collapse` | **exit 1** · `format.ts:72 collapses a parsed amount to 0` |
| `check-rounding` | **exit 1** · `95 … the cap is 94` |

⚠️ The **inverse** is now missed — an interpolation inside the call's *arguments*. See `T3`.

### R6 — CLOSED
One store, `format.test.ts`; one variable, which element carries the exemption.

| appended | result |
|---|---|
| control — the comment on its own line above both elements | **exit 1**, naming **both** literals (`:65`, `:66`) |
| plant — `{ dueDate: 'X' }, // fixture-date-ok: …` on element 1, plain element 2 below | **exit 1**, naming **only** element 2 (`:65`) |

The exemption is read from the literal's own physical line and cannot cover a sibling.

### R7 — CLOSED
```ts
const __r7 = [
  // the dueDate:
  '<today+8>',
];
```
→ **exit 0**, `0 imminent · 120 aged · 127 pinned · **115** on non-aging fields`. The 114 → 115 move
proves the literal was read and correctly classified; the comment cannot supply the key.

### R8 — CLOSED
`reg-unicode.json` exits 1 naming the duplicate (Part 1), and the fixture row reds on the un-fix.

### R9 — CLOSED
`import * as appStoreModule from '../store/appStore';` → **exit 1**. `IMPORT`'s namespace branch is
`\*\s*as\s+\w+`, not keyed on the alias.

### R10 — CLOSED
`ALLOWED` is `{}`. R10's own substitution plant — delete the permitted honest predicate, write a
genuinely dishonest collapse in its place:
```diff
-  const n = parsed === null ? 0 : parsed;
+  const n = parsed === null ? -1 : parsed;
+  const __stored = parseAmountField(amount) ?? 0;
```
```
❌ amount-collapse: 1 problem(s).
  • apps/rn/src/components/plan/WindfallSheet.tsx:61 collapses a parsed amount to 0.
EXIT=1
```
⚠️ The empty list is enforced by a docblock and nothing else — `T9`.

**The two rewritten production sites are behaviour-preserving.** Checked, not assumed.
`parseAmountField` is typed `(raw: string) => number | null` and returns `null` for blank,
unparseable, zero and negative (`packages/core/utils/amountField.ts:37-42`) — it cannot return
`undefined`, so `?? 0` and `=== null ? 0 :` agree on every input.

| site | before | after | equal? |
|---|---|---|---|
| `readBackup.ts:231` | `(parse(x) ?? 0) > 0` | `p !== null && p > 0` | `null` → `0>0` = false = false; number → `p>0` both. **Yes** |
| `WindfallSheet.tsx:59-61` `n` | `parse(a) ?? 0` | `p === null ? 0 : p` | **Yes** |
| `WindfallSheet.tsx:61` `validAmount` | `n > 0` | `p !== null && p > 0` | **Yes** |

### R11 — CLOSED
The detector's five fixture rows (four positive spellings plus the R11 false-positive negative) run on
every `test:app`, through the same `seedsFromEditing` the production sweep calls: `44 assertions passed`.

### R12 — CLOSED
`codeLinesOnly` normalises the `' + '` junction and the fixture `CONCAT_FIXTURE` asserts it every run.

### R13 — CLOSED
R13's plant verbatim — `'lint:money',` removed from `GATES` **and** named in a live
`const PARKED_TEMPORARILY = ['lint:money'];` declared **above** the array:
```
❌ runner completeness: 1 problem(s).
  • [lint:rn] 1 lint script(s) exist in package.json and are in NO chain: lint:money
EXIT=1
```
⚠️ My first attempt at this plant put the `const` **inside** the array bounds and scored exit 0 — a
plant that did not plant the defect. Re-run with the declaration outside; the exit-0 row is my error,
not the gate's.

### R14 — ⛔ NOT CLOSED
R14 named five fixes with no standing guard. Four now hold; **`D1-1` does not.**

| fix | un-fix applied to PRODUCTION only | result |
|---|---|---|
| `D1-9` | `topLevelKeys` → the two-space anchor | **exit 1** · `BLIND to the "four-space" case` |
| `C1-9` | (fixture rows present and production-path) | **exit 1** on the plant |
| `C2-9` | (fixture rows present and production-path) | **exit 1** on the plant |
| **`D1-2`** | `importsOf` drops `stripCommentsOnly` | ✅ **exit 1** · `a COMMENTED-OUT import is still counted as wired` |
| ⛔ **`D1-1`** | `runGatesRaw = readFileSync(…)` without `stripCommentsOnly` **+** `// 'lint:money',` | ⛔ **exit 0** · `✅ … 8 tracked · 8 wired` |

`D1-1`'s exact reported defect can be restored by a one-line production edit and the gate prints its
green line. The mechanism is `N-3`, below.

### R15 — CLOSED
A real new per-line gate written into `scripts/` (a `.split('\n')` loop, importing nothing from the
helper, in neither list):
```
❌ wrap-escapes: 1 problem(s).
  • check-zz-reaudit3-probe.ts splits its input into physical lines, does not use lib/logicalLines,
    and is named in neither PER_LINE_OK nor PER_LINE_UNREVIEWED.
EXIT=1
```
⚠️ **A control worth recording, because it looked like a finding.** The first run of this probe scored
**exit 0**. The probe gate had been written through a bash heredoc that collapsed `'\\n'` to a real
newline, so the file did not contain `.split('\n')` at all. Re-written with the `Write` tool, the census
sees it. *(The escape hatch it offers is still unbounded — `N-10`; and a gate that is wrap-sensitive
without splitting lines is still invisible — `T5`.)*

---

# Part 3 — the 11 findings of re-audit 2

| # | subject | verdict |
|---|---|---|
| N-1 | the class guard measures the fix in one gate | **CLOSED** — 5 of 6 now *(the 6th is `T1`)* |
| N-2 | a clock pin inside a comment pins the file | **CLOSED**, including the live `bnpl.spec.ts` |
| N-3 | fixture self-checks assert code production does not run | ⛔ **NOT CLOSED** — 1 of 3 un-fixes caught |
| N-4 | `check-local-dates` blind to the wrapped round-trip | ⛔ **NOT CLOSED** — the argument-list spelling still escapes |
| N-5 | `check-store-id-writes` reds on a wrapped `findIndex` | **CLOSED** *(a block-bodied predicate still reds — `T8`)* |
| N-6 | offending import reported at the docblock's first line | ⛔ **NOT CLOSED** — 4 of 31, unchanged |
| N-7 | `unreadInputsCopy` misses the `{' '}` separator | ⛔ **NOT CLOSED** — `{' '}` closed, `${' '}` and `+ SEP +` open |
| N-8 | `debtPrefill` misses a destructured binding | ⛔ **NOT CLOSED** — destructuring closed, `let` and two-hop open |
| N-9 | `MAX_RUN = 8` is a live blind window | **CLOSED** — the constant and the window are gone |
| N-10 | `PER_LINE_UNREVIEWED` "downward-only" is unenforced | ⛔ **NOT CLOSED** — 11 → 12 with a green tick |
| N-11 | `MIN_CAPS`' ledger note names a deleted constant | **CLOSED** |

**5 closed · 6 not closed.**

### N-1 — CLOSED
One variable per row: each gate's own class-1 bound reverted to a per-physical-line equivalent, nothing
else touched, then `npx tsx scripts/test-wrap-escapes.ts`.

| gate un-fixed | its own row | harness |
|---|---|---|
| `check-amount-collapse` (`[^;{}]`→`[^\n]`) | ❌ `wrapped-plant=FAILED-OPEN` | **exit 1** |
| `check-rounding` (`[^;{}]`→`[^\n]`) | ❌ `wrapped-plant=FAULT-BASELINE-ALREADY-RED` | **exit 1** |
| `check-sandbox-writes` (`\s`→`[ \t]`, `[^}]`→`[^}\n]`) | ❌ `wrapped-plant=FAILED-OPEN` | **exit 1** |
| `check-fixture-dates` (`AGING_KEY`'s `\s*$`→`[ \t]*$`) | ❌ `wrapped-plant=FAILED-OPEN` | **exit 1** |
| `check-local-dates` (`\s*`→`[ \t]*` in the chain) | ❌ `wrapped-plant=FAILED-OPEN` | **exit 1** |
| ⛔ **`check-store-id-writes`** (statement → physical line) | ✅ `wrapped-plant=MATCHED` | ⛔ **exit 0** |

In every red case the un-fixed gate is **green on the clean tree** (checked for three of them), so the
harness is the only thing that sees the regression — which is the property `D1-11` asked for. Five of six
now carry it, against one of four before. The sixth is `T1`.

### N-2 — CLOSED
`CLOCK_PIN` is now tested against `stripCommentsOnly(text)` (`check-fixture-dates.ts:190`).

| plant | result |
|---|---|
| control — `{ dueDate: '<today+8>' }` in `format.test.ts` | **exit 1** · `:63  dueDate: '2026-09-11' — fires in 8 day(s)` |
| plant — the same, preceded by `// currentDate: '2026-01-01' is the pin the sibling suite uses` | **exit 1** · `1 calendar literal(s) cross into the past within 21 days` |
| **the live file** — the same fuse appended to `apps/rn/tests/e2e/bnpl.spec.ts` | **exit 1** |

`bnpl.spec.ts` — the one file in the tree whose docblock narrates the pin it removed, and which
re-audit 2 measured as the single live instance — is back under the gate. Independently re-derived:
`pinned=127` with the pin read from code, and no file's `CLOCK_PIN` exists only in a comment.

### N-3 — ⛔ NOT CLOSED
Round 3 made production call `chainRegion` and `importsOf`. One of the three un-fixes is now caught.

| un-fix (production only; fixtures untouched) | defect re-planted | gate |
|---|---|---|
| ✅ `importsOf` → `r.imports(rawSrc, …)` | `// import "./testAbuseScenarios";` | **exit 1** · `a COMMENTED-OUT import is still counted as wired` |
| ⛔ `const runGates: string \| null = runGatesRaw;` | `'lint:money'` deleted from `GATES` + named in a live const above it | ⛔ **exit 0** · `✅ … 8 tracked · 8 wired` |
| ⛔ `runGatesRaw = readFileSync(…)` (no strip) | `// 'lint:money',` | ⛔ **exit 0** · `✅ … 8 tracked · 8 wired` |

Row 2 also runs the un-fixed gate on the **clean** tree: exit 0, full green summary.
Controls, with production intact: both defects red (Part 1 `D1-1`, Part 2 `R13`).

**Mechanism (HYPOTHESIS).** The import fixture asserts through the seam production uses (`importsOf`
does the stripping), so an edit *inside* it is caught. The chain fixture asserts `chainRegion`'s
**bounds** and nothing asserts that production still calls it, and **no fixture at all covers the
comment-stripping of `run-gates.ts`** — that expression sits bare at `:272`. So `N-3`'s own rule ("the
fixture must exercise the production path") was applied to one of the two seams and to neither of the
two properties `D1-1` names.

**Remedy — UNVERIFIED.** Give the chain half the same shape as the import half: one function
`chainedGates(rawRunGates): Set<string>` that strips **and** slices, called by production and asserted on
a fixture carrying both a `// 'lint:x',` row and an outside-the-array mention. Not verified — the
current error text distinguishes "no `const GATES`" from "no `\n];`", and folding them changes it.

### N-4 — ⛔ NOT CLOSED
`check-local-dates` was moved onto the shared reporting helper and given a recipe. The recipe plants the
**method-chain** wrap — the spelling N-4's second table row measured. Its **third** row is untouched.

One store, `packages/core/utils/percentComplete.ts`; one variable, where the line breaks fall.

| plant | `npx tsx scripts/check-local-dates.ts` |
|---|---|
| control — `d.toISOString().slice(0, 10)` | **exit 1** · `❌ A calendar date routed through UTC` |
| method chain wrapped (**the recipe**) — `d` ⏎ `.toISOString()` ⏎ `.slice(0, 10)` | **exit 1** |
| argument list wrapped, **no** trailing comma — `.slice(` ⏎ `0,` ⏎ `10` ⏎ `)` | **exit 1** |
| ⛔ **argument list wrapped, Prettier's trailing comma** — `.slice(` ⏎ `0,` ⏎ `10,` ⏎ `)` | ⛔ **exit 0** |
| ⛔ `.split(` ⏎ `'T',` ⏎ `)[0]` | ⛔ **exit 0** |

**Mechanism (HYPOTHESIS).** `BANNED` ends `…\s*10\s*\)` — no `,?`. `check-rounding` learned exactly this
lesson in round 1 (*"the `,?` is load-bearing and was missing … when Prettier wraps a call it also adds a
TRAILING COMMA"*, `check-rounding.ts:59-63`) and the lesson stayed in that file's docblock instead of
travelling with the class — which is `class 1`'s own founding sentence, recurring one level up.

**Remedy — UNVERIFIED.** `,?` before each closing paren in `BANNED`, and a second recipe planting the
argument-list wrap. Not verified: `HAND_PARSE` has the same shape and is a pinned both-directions count
(43), so any widening must be re-derived against it first.

### N-5 — CLOSED
One store, `apps/rn/src/store/balanceSelectors.ts`; one variable, the wrapping.

| plant | result |
|---|---|
| control — `rows.findIndex((r) => r.id === id)` on one line | **exit 0** |
| N-5's plant — `rows.findIndex(` ⏎ `  (r) => r.id === id,` ⏎ `)` | **exit 0** ✅ |
| control — a genuine bare `.map` id edit | **exit 1** · `1 bare \`x.id === id\` comparison(s) outside a lookup` |

⛔ The noisy direction is not fully closed: a **block-bodied** predicate still reds — `T8`.

### N-6 — ⛔ NOT CLOSED
`IMPORT` is still `/^\s*import…/gm` over comment-blanked text, and `\s` still runs over the blanks.

Live tree (`p22-attribution.ts`), unchanged from re-audit 2 at the same size:
```
check-sandbox-writes IMPORT: 31 live matches; reported at a line NOT containing "import": 4
    apps/rn/src/analytics/funnel.ts:1     «/**»
    apps/rn/src/app/tutorial.tsx:3        «»
    apps/rn/src/premium/premiumSync.ts:2  «»
    apps/rn/src/store/persistence.ts:6    «»
```
And on the path that actually reds — a wrapped unsanctioned import behind a four-line docblock in
`apps/rn/src/utils/a11y.ts`, with the `import` keyword on physical line **5**:
```
❌ lint:sandbox — 1 unsanctioned reference(s) to the appStore singleton:
   apps/rn/src/utils/a11y.ts:1
EXIT=1
```
The remedy re-audit 2 proposed (`m.index + m[0].indexOf('import')`, or `^[ \t]*`) was not taken.

### N-7 — ⛔ NOT CLOSED
The `{' '}` half is closed; the two spellings N-7's own measurement named are not.

Replica of the shipping `codeLinesOnly` (`p14-detectors.mjs`), then the two survivors confirmed live by
planting into `RequiredActionsCard.tsx` and running `npm run test:app`:

| spelling | replica | `test:app` |
|---|---|---|
| single line | CAUGHT | — |
| split across a source line (C1-9) | CAUGHT | **exit 1** (control, above) |
| `'… again ' + 'above.'` (R12) | CAUGHT | — |
| `{'…again'}{' '}{'above.'}` (N-7's first half) | CAUGHT | — |
| ⛔ `` `set it again${' '}above.` `` | **MISSED** | ⛔ **exit 0** |
| ⛔ `'set it again' + SEP + 'above.'` | **MISSED** | ⛔ **exit 0** |
| ⛔ `` `set it again ${'above'}.` `` | **MISSED** | — |
| ⛔ `{'set it again'}{S}{'above.'}` | **MISSED** | — |
| plain JSX text wrapped by Prettier | CAUGHT | — |

Both live plants print:
```
✓ apps/rn/src/components/plan/RequiredActionsCard.tsx: no refusal points "above" at a card that one tap removes
✅ unread-inputs copy: 34 assertions passed
✅ App-layer regression tests: ALL PASSED.
EXIT=0
```
34 is the clean-run count. The card renders "set it again above" and the assertion that exists to refuse
exactly that prints a tick naming the file.

**Mechanism (HYPOTHESIS).** The new rule `\{\s*(['"`])\s*\1\s*\}` deletes the braces of `{' '}` but the
`$` of `${' '}` is outside the match and survives, so the joined text reads `again$ above`. Each round
has normalised the artefact the previous round's plant exhibited; the property asserted is *what the
reader sees*, and source text has unboundedly many spellings of one rendered sentence. Four rounds, four
spellings, four more found.

**Remedy — UNVERIFIED.** N-7's own: assert on the rendered string, which `test:app` can already produce
for these cards. Failing that, `/again\W+above/i` over the joined code covers `${' '}`, `+ SEP +`,
`${'above'}` and `{S}` in one rule. Not verified — relaxing the needle changes what every other
`includes` assertion in the file sees, so it needs a plant per claim.

### N-8 — ⛔ NOT CLOSED
The destructuring half is closed; the two spellings N-8 itself named are not.
`seedsFromEditing` still matches only `const\s+(\w+)` and `const\s*\{…\}`, one hop.

| spelling | replica | `test:app` |
|---|---|---|
| direct / ternary (C2-9) / hoisted const (R11) / destructured (N-8) | CAUGHT | **exit 1** (C2-9 control) |
| ⛔ `let x = editing ? … ; useState(x)` | **MISSED** | ⛔ **exit 0** |
| ⛔ two-hop `const x = editing?.apr; const y = x; useState(y)` | **MISSED** | ⛔ **exit 0** |
| ⛔ `var` hoist · ⛔ `let { apr } = editing ?? {}` | **MISSED** | — |

Both live plants into `DebtSheet.tsx:136` print:
```
✓ no useState in DebtSheet seeds from `editing` … (found 0) (expected 0, got 0)
✅ bill → debt prefill: 44 assertions passed
✅ App-layer regression tests: ALL PASSED.
EXIT=0
```

**Mechanism (HYPOTHESIS).** N-8's remedy was one regex covering both binder forms **plus one extra
hop**: `/(?:const|let|var)\s+(?:\{[^}]*\}|(\w+))/`. What shipped is a *second* `const`-only regex beside
the first — the enumeration widened by one member rather than by the axis. Binding form and hop count
are two independent axes and only one member of one axis was added.

**Remedy — UNVERIFIED.** As filed. Not verified: widening the binder risks the R11 false positive the
fifth fixture row pins, so it must be re-measured against that row.

### N-9 — CLOSED
`MAX_RUN` does not exist. Nothing rewrites the source, so there is no window to escape. The blindness
that replaced it is bounded by `;{}` instead of by a line count — `T3`.

### N-10 — ⛔ NOT CLOSED
`test-wrap-escapes.ts:154-191` still checks only the **departure** half. One variable — a real new
per-line gate, plus one row added to `PER_LINE_UNREVIEWED`:

```
✅ wrap-escapes: 6 wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect
   · 11 per-line by design · ⚠️ 12 per-line and NOT YET REVIEWED (downward-only).
EXIT=0
```
The harness prints a number that has just gone **up**, beside the words "downward-only", beside a green
tick. No `!==` pin, unlike `MIN_CAPS` / `MAX_UNGUARDED` / `MIN_ENTRIES`.

### N-11 — CLOSED
`check-cap-literals.ts:131-135` now records `27 → 28 … then 28 → 27 in the same sub-step`, and
`MIN_CAPS = 27` against 27 observed. `MAX_JOIN` and `MAX_RUN` are both absent from the code.

---

# Part 4 — every count that moved, re-derived independently

All six are **correct**. Derivations in `p08-live-sweep.ts` and `p18-counts.ts`, neither reusing the
fixer's probes.

| constant | pinned | re-derived | how |
|---|---|---|---|
| `MIN_CAPS` | **27** | **27** | `DECL` over `git ls-files scripts/*.ts`, comment-stripped. `MAX_JOIN` absent, `MAX_RUN` absent — the lower is a departure, which is the one honest reason |
| `MAX_AGED_FIXTURE_DATES` | **120** | **120** | the gate's classification re-implemented from scratch over its own 220-file population: `imminent=0 aged=120 pinned=127 nonAging=114` |
| `HAND_PARSE_BASELINE` | **43** | **43** | per-**match** 43 · per-**line** 39 · lines carrying two matches **4** → 39 + 4 = 43, no remainder. The four are `guardianPredictionCore.ts:18`, `recoverySelectors.ts:15`, `deriveRequiredActionView.ts:49`, `buildMultiCycleTimeline.ts:290` — exactly the four the docblock names |
| `MAX_INLINE_ROUNDING` | **94** | **94** | a **balanced-paren** scan (walk from `Math.round(` to its matching `)`, then test the suffix) over the gate's own population — no character-class bound at all. 94, and **0** of them carry a brace inside the arguments |
| `MIN_ENTRIES` | **268** | **268** | `json.load` of the tracked registry. The file was never opened for writing (`cmp` against the `HEAD` blob is clean) |
| `fixture-dates` scan floor | **21,640** of 22,779 | **21,640** | 22,779 × 0.95 = 21,640.05 → 21,640, the `_README` margin |

⚠️ The `check-amount-collapse` population moved `60,881 → 60,889` lines. **+8 is the two `R10`
rewrites** (+5 in `WindfallSheet.tsx`, +3 in `readBackup.ts`), and the site count moved `2 → 0`.

---

# Part 5 — attacked and found SOUND

Recorded because a measured negative is worth more than an unexamined suspicion.

- **`lineMap`.** 6,278,090 offsets across 848 tracked files, 0 mismatches against an independent
  newline-counting oracle; plus 137 hand-built edge offsets over 12 pathological inputs. Correct at
  offset 0, at a newline (returns the line it ends), at EOF, past EOF (clamps), at −1 (returns 1), and on
  CRLF (both the `\r` and the `\n` belong to the line they end). **No off-by-one anywhere.**
- **The two `R10` rewrites are behaviour-preserving.** Proved from `parseAmountField`'s type
  (`number | null`, never `undefined`, never `0`) rather than assumed — table under `R10` above.
- **`MAX_INLINE_ROUNDING = 94` and `0 collapse sites` survive a bound-free scan.** A balanced-paren
  walk finds the same 94 and the same 0, and finds **no** live site that `[^;{}]` misses. `T3`'s
  blindness is real but **latent**, not live.
- **The `check-finding-guards` duplicate fixture is production-path.** `topLevelKeys` is the same
  function the registry sweep at `:336` uses, and the fixture block runs **before** the registry is read,
  so it fails closed. Both un-fixes red on it.
- **The `unreadInputsCopy` and `debtPrefill` fixtures are production-path.** Both call the same
  `codeLinesOnly` / `seedsFromEditing` the file sweeps with; neither supplies its own pre-processing (the
  shape that made `N-3` vacuous). `debtPrefill` additionally carries a **negative** row.
- **`check-sandbox-writes` has no scan floor, and that is measured rather than assumed.**
  `check-scan-floors.ts:35` exempts it with a re-taken measurement: under a blanked stripper all 24
  `ALLOWED` entries report stale and the gate exits 1. Verified the exemption is not stale.
- **`prove:guards` batch ≡ solo, and a mid-batch fault restores the earlier plant.** See `T13`.

---

# New findings

Fourteen. Severity is in each heading.

## T1 — `major` · `check-store-id-writes`' plant recipe cannot fail: revert the gate to per-physical-line and the harness still prints `✅ 6 wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect`

**Instrument-facing consequence.** `S1P7-CLASS1-LOGICALJOIN`'s standing proof is `test:wrap-escapes`, and
its green sentence is a claim about six gates. For one of them the sentence is true **whether or not that
gate is fixed** — which is `D1-11`'s own defect ("the proof plants the ONE spelling the gate already
catches") committed inside `D1-11`'s fix, one round after `N-1` found it in three of four recipes.

**File and line.** `scripts/test-wrap-escapes.ts:86-99` — the recipe — against
`scripts/check-store-id-writes.ts:91-101`, the statement window it is supposed to exercise.

```ts
plant: [
  'export const __wrapBareId = (rows: { id: string }[], id: string) =>',
  '  rows.map((r) =>',
  '    r.id === id ? r : r,',
  '  );',
].join('\n'),
```

**The measurement.** One variable: `const statement = code.slice(start, end)` replaced by the physical
line containing the match — i.e. the gate reverted to exactly the shape `N-5` measured. Nothing else
touched.

```
=== UN-FIX check-store-id-writes.ts   wrap-escapes EXIT=0
    ✅ check-amount-collapse.ts     wrapped-plant=MATCHED · restored=YES
    ✅ check-fixture-dates.ts       wrapped-plant=MATCHED · restored=YES
    ✅ check-local-dates.ts         wrapped-plant=MATCHED · restored=YES
    ✅ check-rounding.ts            wrapped-plant=MATCHED · restored=YES
    ✅ check-sandbox-writes.ts      wrapped-plant=MATCHED · restored=YES
    ✅ check-store-id-writes.ts     wrapped-plant=MATCHED · restored=YES
    ✅ wrap-escapes: 6 wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect
       · 11 per-line by design · ⚠️ 11 per-line and NOT YET REVIEWED (downward-only).
    [the un-fixed gate alone EXIT=0] ✅ store id writes: no bare id-keyed row edits across 51 store file(s)
```
Controls: the same un-fix applied to each of the other five gates gives `FAILED-OPEN` (×4) or
`FAULT-BASELINE-ALREADY-RED` (×1) and **exit 1** every time (table under `N-1`).

**Mechanism (HYPOTHESIS).** This gate's class-1 defect runs in the **noisy** direction — `N-5` was a
false *positive* on a wrapped `findIndex` — but the recipe plants a **true positive**, a bare `.map` id
edit. `IS_LOOKUP` does not list `.map`, so no exemption is ever consulted and the line
`    r.id === id ? r : r,` matches `BY_ID` on its own. The recipe therefore exercises the half that was
never broken. The recipe's own comment says as much (*"N-5 proved the mirror — that a wrapped
`findIndex`, which is CORRECT code, no longer reds"*) and then plants the mirror's other side anyway,
because `Recipe` can only express *"the gate must RED"*.

**Remedy — UNVERIFIED.** `Recipe` needs a second, inverted form: a plant of correct wrapped code that
the gate must **stay green** on (`wrapped-clean-plant=STAYED-GREEN`). For this gate that is
`rows.findIndex(` ⏎ `  (r) => r.id === id,` ⏎ `);` — measured **exit 0** today and **exit 1** under the
per-line revert, so it discriminates. Not verified: it changes the harness's verdict vocabulary, and
`FAULT-BASELINE-ALREADY-RED` semantics have to be defined for the inverted case.

## T2 — `major` · `[^;{}]` does not stop at a comma, so both money gates report two individually correct sibling expressions as one defect — `R4`'s false positive, re-created at a third window size

Measurements, mechanism and remedy are in **Part 2 → R4** above; this heading exists so the finding is
counted as new work created by round 3 rather than only as a re-opened row.

Consequence, stated: `check-amount-collapse` reds on honest code with **no escape route at all** now that
`ALLOWED` is empty and the docblock forbids re-adding an entry; `check-rounding` reds by pushing a
downward-only cap over its pin, whose only documented fix is *"lower it in the same edit that removes a
copy"* — over code that has no copy to remove. Latent (no such pair exists in the tree today: the
balanced-paren sweep agrees with both live counts) but reachable by any ordinary refactor that puts a
parsed amount and an unrelated `?? 0` in one array literal.

## T3 — `major` · a brace anywhere inside the call's arguments blinds both money gates — including `R5`'s own defect, re-opened from the other side

**User-facing consequence.** `C1-6` verbatim: an amount that does not parse is recorded as `$0.00`
rather than refused, and that figure feeds the Interest-Saved Ledger and the Drift Tracker. For
`check-rounding` it is `A5-4`: a second producer of money rounding that the cap cannot see.

**File and line.** `scripts/check-amount-collapse.ts:61` and `scripts/check-rounding.ts:64` — both bound
the argument region with `[^;{}]*?`.

**The measurement.** One store, `apps/rn/src/utils/format.ts`; one variable, whether the argument list
contains a brace. The `lines read` count moves on every row, which is what proves the plant was read.

| plant | `check-amount-collapse` | `check-rounding` |
|---|---|---|
| control — `parseAmountField(raw) ?? 0` | **exit 1** | — |
| control — `Math.round(x * 100) / 100` | — | **exit 1** · 95 > 94 |
| ⛔ `parseAmountField(pick(raw, { trim: true })) ?? 0` | ⛔ **exit 0** · 60,892 lines read | — |
| ⛔ `` parseAmountField(`${raw}`) ?? 0 `` | ⛔ **exit 0** · 60,890 lines read | — |
| ⛔ `parseAmountField(rows.map((r) => { return r; }).join('')) ?? 0` | ⛔ **exit 0** · 60,891 | — |
| ⛔ `Math.round(rate({ apr: o.apr }) * 100) / 100` | — | ⛔ **exit 0** · 94 |
| ⛔ `` Math.round(Number(`${s}`) * 100) / 100 `` | — | ⛔ **exit 0** · 94 |

⚡ Row 4 is **`R5` re-opened.** `R5` was *"a collapse inside a template literal was caught before the v1
fix and invisible after it"*, and it was closed by restoring string contents to the scanned text. The
same collapse, with the template literal moved from **around** the expression to **inside** the
arguments, is invisible again — by a different mechanism, in the same round that certified `R5` closed.

**Mechanism (HYPOTHESIS).** `{` and `}` were chosen because they *"open or close a block or an object"*,
which is true of statement structure and false of expression structure: an object literal argument, a
template interpolation and an arrow block body all put braces **inside** one expression. The bound is
therefore two different rules wearing one character class — "do not leave the statement" (`;`) and "do
not leave the block" (`{}`) — and the second one cuts across the thing being matched. This is the third
consecutive round in which the argument region was bounded by a *character* rather than by *brackets*.

**Remedy — UNVERIFIED.** The balanced-paren walk in `p08-live-sweep.ts` — it reproduces both live counts
exactly (94 and 0) with no character bound, so it can be swapped in and the numbers checked before the
change is trusted. It also closes `T2`. Not verified against `check-rounding`'s cap under CI's LF
checkout, and not against `SELF`'s two exempted files.

## T4 — `major` · the shared helper's replacement export `WITHIN_STATEMENT` has ZERO consumers, and `test:wrap-escapes`' population no longer means "wrap-sensitive"

**Instrument-facing consequence.** `N-1` killed `flattenContinuations` for being inert. The same commit
shipped a second inert export in the same file, with a docblock that claims the opposite:
*"⛔ **THE BOUND EVERY WRAP-SENSITIVE PATTERN USES, so it is written once rather than re-derived per
gate.**"* Six gates re-derive `[^;{}]` inline; two of them (`check-sandbox-writes`,
`check-fixture-dates`) do not use that bound at all.

**File and line.** `scripts/lib/logicalLines.ts:73`.

**The measurement.**
```
$ git grep -n WITHIN_STATEMENT -- '*.ts' '*.tsx' '*.json' '*.md'
scripts/lib/logicalLines.ts:73:export const WITHIN_STATEMENT = '[^;{}]*?';
```
One occurrence in the repository — its own definition. With its value replaced by the literal string
`'THIS_IS_NOT_A_REGEX_BOUND_AT_ALL'`:
```
check-amount-collapse EXIT=0   check-rounding EXIT=0   check-sandbox-writes EXIT=0
check-fixture-dates   EXIT=0   check-local-dates EXIT=0  check-store-id-writes EXIT=0
test:wrap-escapes     EXIT=0   npm run typecheck EXIT=0
```

⚡ **The second half is the one that matters.** `test-wrap-escapes.ts:111` derives the wrap-sensitive
population from *"imports `./lib/logicalLines`"*, and after round 3 the only thing importable is
`lineMap` — **a line-number utility**. So the population now means *"reports a `path:line` from an
offset"*, which is neither necessary nor sufficient for wrap-sensitivity. The docblock's promise (*"a
gate joins this harness by importing the helper"*) describes a property the helper no longer has.

**Mechanism (HYPOTHESIS).** The constant was extracted so that the bound would be written once, and then
each gate's pattern was edited in place with the literal instead — the same
`tested-helper-is-not-a-used-helper` shape as `N-3`, one file over, and the same one `N-1` measured in
`flattenContinuations`. Nothing detects it because `check-cap-literals` counts `MAX_`/`MIN_` constants
only, and no gate looks for unused exports in `scripts/lib`.

**Remedy — UNVERIFIED.** Either use it (each pattern built with `new RegExp(… + WITHIN_STATEMENT + …)`,
which also makes `T3`'s fix one edit rather than six) or delete it and re-derive the harness population
from the property that actually matters. Not verified — building the patterns dynamically loses the
literal-regex form `check-gate-sources` and the registry `unfix` anchors are written against.

## T5 — `major` · a genuinely wrap-sensitive new gate that never splits lines is invisible to `test:wrap-escapes` **and** to both census lists

**Instrument-facing consequence.** `R15`'s finding was *"the harness can only see gates that already
adopted the fix"*, and the census answered it for gates that **split lines**. A gate written the way
round 3 says gates should now be written — `matchAll` over the whole file with a statement bound,
reporting an offset — is in neither population, so it can be added with a wrong bound and nothing asks.

**File and line.** `scripts/test-wrap-escapes.ts:109-111` (the import-derived population) and `:138-143`
(the `.split('\n')`-derived census).

**The measurement.** A real gate written into `scripts/check-zz-reaudit3-probe3.ts` (written by tool, not
heredoc): `const BANNED = /zzzNeverAppears\s*\([^;{}]*?\)\s*\?\?\s*0/g;` over `matchAll`, reporting
`m.index`, importing nothing from `lib/logicalLines`, never calling `.split`.

```
✅ wrap-escapes: 6 wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect
   · 11 per-line by design · ⚠️ 11 per-line and NOT YET REVIEWED (downward-only).
EXIT=0
```
Control (same file, `.split('\n')` added): **exit 1**, named correctly — so the census works, it just
does not cover this shape.

**Mechanism (HYPOTHESIS).** Both populations are proxies for "this gate matches source text and could be
defeated by a formatter", and both were written when *per-line splitting* was the only known spelling of
the defect. Round 3 introduced a second spelling — a character-class bound — and did not extend either
proxy to it. `R15`'s own sentence applies verbatim to its own fix.

**Remedy — UNVERIFIED.** Add a third candidate rule: any `check-*.ts` whose source contains a regex with
a negated character class used as an unbounded-length bound (`[^…]*` / `[^…]*?`) is wrap-sensitive and
must carry a recipe or a reason. Checkable mechanically from the regex literals. Not verified — it will
sweep in gates whose negated classes are not span bounds, so the exemption list will grow before it
shrinks.

## T6 — `major` · two more `PER_LINE_OK` reasons are factually wrong, and one of them exempts the gate whose ORIGINAL BLOCKER is a wrapped call

**User-facing consequence.** `check-month-arithmetic` exists because *"Jan 31 + 1 month is Feb 28, not
Mar 3, and month-and-year output shows the difference."* `check-glossary` exists to keep retired
vocabulary out of copy the user reads. Both escape by line-wrapping.

**File and line.** `scripts/test-wrap-escapes.ts:130` and `:127`:

> `'check-month-arithmetic.ts': 'matches a method NAME on a date object; the argument list is not part of the subject.'`
> `'check-glossary.ts': 'compares one rendered sentence at a time; a wrapped sentence is not a different sentence to a reader.'`

Both are false of the code. `check-month-arithmetic.ts:116-134` carries a **second** detector,
`constructorOverflow`, whose whole subject is the argument list — `dateArgs` parses `new Date(`'s
arguments and returns `null` on unbalanced parens, with its own comment: *"unbalanced on this line — a
multi-line call, not judged here."* `check-glossary.ts:79-86`'s `copyFragments` matches
`>[^<>{}]{2,}<` and `` `[^`]*` `` **per physical line**, so a JSX text node or template literal that
spans lines yields no fragment at all.

**The measurement.** One store per gate, one variable — where the line breaks fall.

| `check-month-arithmetic`, into `packages/core/utils/percentComplete.ts` | result |
|---|---|
| control — `new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())` on one line | **exit 1** · `A date stepped by months …` |
| ⛔ the **same call**, Prettier-wrapped over four lines with a trailing comma | ⛔ **exit 0** |
| control — `d.setMonth(d.getMonth() + 1)` | **exit 1** |

Row 2 is the original blocker's spelling verbatim (the docblock names it:
`new Date(d.getFullYear(), d.getMonth() + n, d.getDate())`).

| `check-glossary`, into `PaydayGuardianCard.tsx` | result |
|---|---|
| control — `<Text>You have some breathing room this month.</Text>` on one line | **exit 1** · `1 retired word(s) back in user-facing copy` |
| ⛔ the **same copy** as Prettier writes it: `<Text>` ⏎ `  You have some breathing room this month.` ⏎ `</Text>` | ⛔ **exit 0** · `✅ glossary: no retired words in copy (6 banned)` |
| ⛔ a template literal broken across two lines | ⛔ **exit 0** |

⚡ Row 2 is not an exotic spelling — it is what Prettier produces for **any** JSX text longer than the
print width, which is most user-facing copy in the tree.

**Mechanism (HYPOTHESIS).** `N-4` diagnosed the first two wrong rows as *"written from what each gate is
about rather than from what its regex spans"*, and the round-3 edit fixed the **two rows N-4 named** and
re-read none of the other nine. Four of eleven rows are now measured false. This is the enumeration
failure the class-1 evidence calls law II: a written list becomes what the next reader trusts instead of
the code, and correcting the named instances leaves the class.

**Remedy — UNVERIFIED.** `N-4`'s remedy, which was not taken: derive the exemption rather than write it —
a gate qualifies for `PER_LINE_OK` only if every pattern it applies per line is a single token with no
quantifier that can span whitespace, checkable from the regex sources. Not verified: `check-glossary`'s
`>[^<>{}]{2,}<` would fail that test and it is genuinely hard to fix per-line, so the derivation will
produce work, not just a cleaner list.

## T7 — `major` · two of the eleven `PER_LINE_UNREVIEWED` gates are measured genuine class members, and one of them lets a WCAG-AA failure ship

**Consequence.** `check-contrast`'s `never-text` exemption on `accent.brand` says its foreground is
checked separately; if the token is painted as ink the gate must red. A wrapped use escapes, the
exemption survives, and the contrast pair is never computed. `check-trust-claims`'s liveness ledger
declares its per-file counts **EXACT**; a wrapped comparison silently leaves the ledger.

**File and line.** `scripts/check-contrast.ts:158-171` (`textUses`, per physical line, consumed at
`:242-249`) and `scripts/check-trust-claims.ts:433-439` (`LIVENESS_RE` per physical line, `sites` pinned
per file).

**The measurement.**

| `check-contrast`, into `PaydayGuardianCard.tsx` | result |
|---|---|
| control — `{ color: c.accent.brand }` on one line | **exit 1** · `check-contrast: 1 failing pair(s)` |
| ⛔ `{` ⏎ `  color:` ⏎ `    c.accent.brand,` ⏎ `}` | ⛔ **exit 0** · `every rendered token pair clears its floor` |
| ⛔ `color: on` ⏎ `  ? c.accent.brand` ⏎ `  : c.text.primary` | ⛔ **exit 0** |

| `check-trust-claims`, into `apps/rn/src/store/drift.ts` | result |
|---|---|
| control — one more `d.balance <= 0` on one line | **exit 1** · `trust claims: 1 problem(s)` |
| ⛔ the same comparison wrapped after the operator | ⛔ **exit 0** · `✅ trust claims: 4 claims all consumed in production` |

Row 3 of the contrast table is ordinary Prettier output for a state ternary — the exact shape whose
sibling (`check-press-opacity`) round 3 rewrote a census row about.

**Mechanism (HYPOTHESIS).** `PER_LINE_UNREVIEWED` was created to hold the ~20 candidates the census
found so the class-1 fix could ship without reviewing them all, and nothing has reviewed one since. The
list has been printed on every run for two rounds with the word "downward-only" beside it; that is the
whole of the review. `N-5` is the one member that was measured, and it was a genuine defect; two more
sampled here are genuine defects.

**Remedy — UNVERIFIED.** Review the list, not the number: two of the two sampled are real, so the prior
on the remaining nine is not low. Both fixes are the same shape as `N-4`'s — match over the file with a
statement bound rather than per line — and both are cap-pinned (`AA_TEXT` failures, `sites` counts
exact), so each must be re-derived over its population first.

## T8 — `major` · `check-store-id-writes` still reds on an ordinary block-bodied lookup predicate, at a cap of 0 with no allow-list

**Instrument-facing consequence.** `N-5`'s consequence, unchanged for a second spelling: correct code is
unshippable and the only ways past are to un-wrap it or weaken the gate.

**File and line.** `scripts/check-store-id-writes.ts:92-100`. The statement window is
`max(last ';', last '{', last '}') + 1 … min(next ';', next '{', next '}')`, so **an arrow function's
own body brace becomes the window's start** and `IS_LOOKUP` never sees the `findIndex(` that
legitimises the comparison.

**The measurement.** One store, `apps/rn/src/store/balanceSelectors.ts`.

| plant | result |
|---|---|
| `rows.findIndex((r) => r.id === id)` | **exit 0** |
| `rows.findIndex(` ⏎ `  (r) => r.id === id,` ⏎ `)` (N-5's case) | **exit 0** |
| ⛔ `rows.findIndex((r) => {` ⏎ `  return r.id === id;` ⏎ `})` | ⛔ **exit 1** · `balanceSelectors.ts:133: return r.id === id` |
| ⛔ `rows.filter((r) => {` ⏎ `  const hit = r.id === id;` ⏎ `  return hit;` ⏎ `})` | ⛔ **exit 1** · `:133: const hit = r.id === id` |
| control — `rows.find((r) => r.id === id) ?? null` inside a block body | **exit 0** |

No such site exists in the 51 store files today (baseline green), so it is latent.

**Mechanism (HYPOTHESIS).** `N-5`'s remedy said *"a wrapped `findIndex(` and its predicate flatten into
one run"* — a claim about **line** grouping. What shipped groups by `;{}` instead, which is a different
unit, and a predicate written as a block is separated from its lookup by a `{` rather than by a newline.
The fix was measured against the spelling in the finding and not against the axis the finding was on
(*"a two-token relationship encoded as co-occurrence in one unit"* — any unit).

**Remedy — UNVERIFIED.** Walk outward from the match to the enclosing **call**, by matching parens, and
test `IS_LOOKUP` against its head — the same balanced-paren primitive `T2`/`T3` need. Not verified:
`MAX_BARE_ID_WRITES = 0` means any scan-unit change must be re-derived over the 51 store files first.

## T9 — `minor` · the empty `ALLOWED` is enforced by prose only, and the gate's own runtime message tells the developer to do the thing the docblock forbids

**Instrument-facing consequence.** `R10` was closed by making the permission list empty and writing
*"⚠️ **Adding an entry here re-opens `R10` by construction.**"* Nothing enforces it, and the message a
developer actually sees when the gate reds instructs them to add one.

**File and line.** `scripts/check-amount-collapse.ts:84` (the empty map), `:81-82` (the prohibition), and
`:135` — the text printed on every failure:

> `add this file to ALLOWED in scripts/check-amount-collapse.ts with the reason zero is honest here.`

**The measurement.** Two lines re-added to `ALLOWED`, plus `R10`'s own dishonest-collapse plant in
`WindfallSheet.tsx`:
```
✅ amount-collapse: 1 site(s), all named with a reason (693 files, 60891 lines read).
EXIT=0
```
`R10` is live again, exactly as filed. `npx tsx scripts/check-cap-literals.ts` is unmoved
(`✅ 27 downward-only cap(s)`) — `ALLOWED` is not a cap, so nothing counts it.

**Mechanism (HYPOTHESIS).** The fix converted a *guarded* exemption into an *absent* one, and absence has
no ratchet: `MIN_CAPS`, `MAX_UNGUARDED` and `MIN_ENTRIES` all exist because this repo has learned that a
number nobody pins drifts. `ALLOWED` went from 2 entries to 0 without acquiring the pin, and the failure
message was not re-read when the policy changed.

**Remedy — UNVERIFIED.** `const MAX_ALLOWED_COLLAPSES = 0;` pinned with `!==` against
`Object.keys(ALLOWED).length` (which also puts it in `check-cap-literals`' population, so `MIN_CAPS`
moves 27 → 28), and rewrite `:135` to say "branch on the null" only. Not verified — moving `MIN_CAPS`
is a two-file edit and this pass did not run it.

## T10 — `minor` · the census classifies a gate by its COMMENTS, so a docblock mentioning `.split('\n')` demands a review row for a gate that never splits a line

**Instrument-facing consequence.** The noisy half of `R7`/`N-2`'s mechanism — a comment supplying a
signal that should come from code — recurring in the instrument written to police the class. A gate
whose docblock *explains why it avoids per-line matching* is told to justify per-line matching.

**File and line.** `scripts/test-wrap-escapes.ts:138-143` — `readFileSync(...)` with no strip, then
`/\.split\((?:'\\n'|\/\\r\?\\n\/)\)/.test(src)`.

**The measurement.** A probe gate that matches with `matchAll` over the whole file and never splits, whose
docblock reads *"an earlier draft used src.split('\n') and it was wrong to"*:
```
❌ wrap-escapes: 1 problem(s).
  • check-zz-reaudit3-probe5.ts splits its input into physical lines, does not use lib/logicalLines,
    and is named in neither PER_LINE_OK nor PER_LINE_UNREVIEWED.
EXIT=1
```
Control: the identical gate without that sentence in its comment → **exit 0** (`T5`).

⚡ It also fires in the **blind** direction for the same reason: the phrase is what the census keys on,
so a gate that splits lines by some other spelling (`split(/\n/)`, `split(EOL)`, `readLines(...)`) is in
neither population and reds nothing. Not measured here; stated as the symmetric consequence.

**Mechanism (HYPOTHESIS).** Every other consumer of source text in `scripts/` blanks comments first —
`stripCode.ts` exists for exactly this and four of the six class-1 gates import it. The census was
written as a `readdirSync` filter rather than as a gate, so it inherited none of the file-reading
conventions the gates it polices are held to.

**Remedy — UNVERIFIED.** `stripCommentsOnly` before the test, and derive the candidate rule from the AST
shape rather than one literal spelling. Not verified: stripping may remove the *only* mention in a gate
whose split is genuinely inside a comment-heavy region, so the 11 + 11 rows must be re-derived after the
change and any that leave the lists explained.

## T11 — `minor` · four gates carry docblocks asserting a flattening that no longer exists, and one of them states the wrong bound for its own pattern one line above the pattern

**Instrument-facing consequence.** `findings-cite-comments-as-evidence`: the next reader of these files
is told the scan flattens continuation newlines, that flattening is what makes the bound safe, and — in
one case — that the bound is `[^\n]`. All three are false of the shipped code, and two re-audits have
now been sent to the wrong mechanism by exactly this kind of sentence.

**File and line.** Seven statements across four files. The sharpest:

- `scripts/check-amount-collapse.ts:56-59`, immediately above `COLLAPSE`:
  > *"⚠️ **`[^\n]*?` still means "within one statement", and that is only true because the scan FLATTENS
  > rather than JOINS** — a statement-ending newline survives, so this cannot reach across two
  > statements."*

  The pattern on line 61 is `[^;{}]*?`; nothing flattens; and the claim it makes ("cannot reach across
  two statements") is measurably false of the shipped bound — `T2`.
- `scripts/check-amount-collapse.ts:117-125` — *"FLATTENED IN PLACE, NOT JOINED … Flattening preserves
  length, so the offset gives the line of the MATCH"*. The offset gives the line of the match because
  **nothing rewrites the text at all**.
- `scripts/check-rounding.ts:86-92` and `:103` — *"FLATTENED, NOT JOINED"*, *"the matcher now runs over
  LOGICAL lines"*.
- `scripts/check-sandbox-writes.ts:118-119` — *"`m` is required because the scan flattens rather than
  joins … a flattened import is one line."* `m` is required because `IMPORT` is `^`-anchored over a
  multi-line file.
- `scripts/check-fixture-dates.ts:168` and `:177` — *"THE MATCHING IS DONE ON FLATTENED,
  COMMENT-BLANKED TEXT"*, *"the flattened comment-blanked text"*.

**The measurement.** `grep -rn "flatten\|FLATTEN" scripts/check-*.ts` returns 7 statements in these four
files (plus one legitimate historical note in `check-cap-literals.ts` and one unrelated hit in
`check-a11y-collapse.ts`). `git grep flattenContinuations` returns nothing.

**Mechanism (HYPOTHESIS).** `deletions-must-be-silent` in reverse: round 3's commit message documents the
deletion thoroughly and `lib/logicalLines.ts`'s own header was rewritten, but the six call sites were
edited for their *pattern* and not for the prose wrapped around it. Nothing checks a docblock against the
line beneath it, and `check-comment-convention` polices form rather than truth.

**Remedy — UNVERIFIED.** Rewrite the seven statements. Cheap, and unverified only in the sense that
nothing was run afterwards.

## T12 — `minor` · `check-fixture-dates` is the only wrap-sensitive gate whose green line does not say what it read, and it imports `scanNote` without calling it

**Instrument-facing consequence.** This gate was given a scan floor in round 3 *after being measured
failing open*, and the floor is the only thing standing between "0 imminent fuses" and "nothing was
looked at". Its headroom (22,779 observed against a 21,640 floor) is invisible on the line a reader
actually sees, so the floor closing on its own count would surface as a sudden red rather than as a
number drifting.

**File and line.** `scripts/check-fixture-dates.ts:46` imports `scanNote`; `:250` assigns
`const observedScan = assertScanFloor(SCAN_GATE);`; `:252-256`'s `console.log` never uses either.

**The measurement.**
```
$ grep -n observedScan scripts/check-fixture-dates.ts
250:const observedScan = assertScanFloor(SCAN_GATE);

check-amount-collapse   ✅ … (693 files, 60889 lines read). [read 60889 lines, floor 56210]
check-rounding          ✅ … [read 52193 lines, floor 47719]
check-local-dates       ✅ … [read 52113 lines, floor 46223]
check-store-id-writes   ✅ … [read 3778 lines, floor 3589]
check-fixture-dates     ✅ … 114 on non-aging fields.          ← no scan note
```

**Mechanism (HYPOTHESIS).** The floor was wired in the same edit that added a long green summary line,
and `scanNote` was imported in anticipation and never appended. `assertScanFloor`'s return value being
assigned-and-unused is the tell, and neither `typecheck` nor `lint:rn` reaches `scripts/` with
`noUnusedLocals` — which is `D1-19`, still open.

**Remedy — UNVERIFIED.** Append `${scanNote(SCAN_GATE, observedScan)}` to the green line. Unverified only
in the sense that nothing was re-run.

## T13 — `minor` · `D2-4c` is REFUTED as filed and its mechanism is confirmed-but-unreachable: every `fault()` sits outside the plant window, and nothing keeps the next one out

**Verdict on the standing question.** `[D77]` does not need to move on the evidence as filed.

**File and line.** `scripts/prove-guards.ts:376-411` — the plant is written inside a `try` whose
`finally` restores; `:138-141` — `fault` is `process.exit(1)`, which does **not** run pending `finally`
blocks.

**The measurement, part 1 — the filed reproduction, refuted.** A three-entry hermetic batch against a
scratch registry (`--registry=…/probe-registry.json --no-record`; the tracked registry was never
opened), where the middle entry's anchor matches 0× and therefore faults:
```
✅ PROBE-A          plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
❌ prove:guards — HARNESS FAULT on PROBE-B-FAULTS, so there is no verdict here:
   the anchor matches 0× in packages/core/utils/percentComplete.ts: "NO_SUCH_ANCHOR_HERE"

$ git status --porcelain
?? docs/audits/2026-09-02-s1-money-pass7/class1-reaudit3-probes/
```
The tree is clean; `PROBE-A`'s plant was restored. `PROBE-C` never ran, so it could not be corrupted.

**The measurement, part 2 — batch ≢ solo, refuted for these entries.**
```
SOLO  A : ✅ planted=exit 1 · control=exit 0 · reason=MATCHED
SOLO  C : ✅ planted=exit 1 · control=exit 0 · reason=MATCHED
BATCH A,C: ✅ A … MATCHED   ✅ C … MATCHED
```
Identical verdicts. *(Re-audit 2 and `S1.13.7.12.3a` both attributed the earlier batch/solo anomalies to
a dying Playwright web server, and this tree's `faultOnDeadServer` refuses a verdict in that case.)*

**The measurement, part 3 — the mechanism, confirmed.** One variable: an artificial
`fault(id, 'ARTIFICIAL FAULT after the plant was written')` inserted between the `writeFileSync` and the
`finally`, gated on an env var so the un-instrumented path is unchanged.
```
❌ prove:guards — HARNESS FAULT on PROBE-A, so there is no verdict here:
   ARTIFICIAL FAULT after the plant was written
EXIT=1
>>> PROBE_A_PLANT still on disk after the fault: True
>>> git status of the target: 'M packages/core/utils/percentComplete.ts'
```
So `D2-4c`'s **mechanism is real**: any `fault()` reachable while the plant is on disk leaves it there,
git-dirty, with nothing in the output saying so. What is not real is a **reachable instance**: reading
`proveOne`, every `fault()` call is either before the write (`existsSync`, `gitStatus`, anchor count,
no-op un-fix) or after the restore (`faultOnDeadServer` ×2), and `run()` is documented and coded never to
throw. A `throw` would be safe — `finally` runs for throws.

**Mechanism (HYPOTHESIS) for the original observation.** The two files `D2-4c` names
(`readBackup.ts`, then `check-runner-completeness.ts`) are consistent with a run **killed** rather than
faulted — Ctrl-C, or the abnormal Windows terminations `prove-guards.ts:180-190` documents this machine
producing (`0xC0000409`, `0x80000003`), neither of which runs a `finally` either. That is not
distinguishable from a `fault()` by looking at the tree afterwards, which is why it read as one.

**Remedy — UNVERIFIED.** Make the restore not depend on the process surviving: write the originals to a
sidecar before planting and have the **pre-flight** of the next run offer to restore from it (the
`.wrapescape-backup` idiom `test-wrap-escapes.ts:239-273` already uses), plus a `process.on('SIGINT')`
and `process.on('exit')` restore. Not verified. **Second, cheaper half:** since the mechanism is a
one-line trap for whoever next adds a `fault()` to that window, `fault` should refuse to exit while a
plant is outstanding — e.g. a module-level `outstanding` map that `fault` drains before `process.exit`.

## T14 — `minor` · `unreadInputsCopy`'s four detector fixtures are all positive, so a normalisation that welds every sentence together would pass them

**Instrument-facing consequence.** The sibling detector (`debtPrefill`) carries a **negative** row
asserting that correct code is not a hit, and its docblock says why: *"the last row is the one that
matters most … a detector that reds on a comment inside a wrapped `useState` gets its comment deleted
rather than obeyed."* `unreadInputsCopy` has no such row. Its four fixtures all assert
`codeLinesOnly(X).includes('again above')` is **true**, so the degenerate normaliser
`s => 'again above'` passes all four.

**File and line.** `apps/rn/src/components/plan/unreadInputsCopy.test.ts:187-199`.

**The measurement.** Read, not planted — the four `assert(...includes('again above'))` calls at `:187`,
`:189`, `:193`, `:198` carry no complementary `assert(!...)`. The live sweep at `:204` would then report
every scanned file as an offender, so the *suite* would red — but for a reason that names the files
rather than the detector, which is the diagnosis cost `plant-both-directions` was written about.

**Mechanism (HYPOTHESIS).** Three rounds each added the fixture for the spelling that had just escaped,
and each addition was in the same direction; nobody added the row for the direction that has not yet
failed. `N-7`'s remedy (`/again\W+above/i`) is precisely a widening, and it will be applied against a
fixture set that cannot detect over-widening.

**Remedy — UNVERIFIED.** One row: a clean sentence that must **not** be a hit — the shape
`{'…set the amount above'} … {'try again'}`, two unrelated phrases the join must not weld. Unverified,
and it must be written before `N-7`'s widening, not after.

---

## Method notes

- Every plant was written by `class1-reaudit3-probes/plant.py`, which snapshots the target's **bytes**,
  asserts the plant changed them, and restores with a byte-equality assertion in `__exit__`.
  `git checkout --` was never used; `git diff` was never treated as a restore check. Every file this
  audit planted into was verified clean at the end (26 files, `git diff --quiet` each), and both tracked
  JSON files are byte-identical to their `HEAD` blobs by `cmp`.
- Each command's **own** exit code was read (`subprocess.run(...).returncode`), never a pipeline's.
- ⚠️ **Three probe-authoring faults, all caught by an assertion or a control, none by inspection.** A
  Python non-raw string turned `\b` into a backspace (caught by the anchor assertion). A quoted bash
  heredoc collapsed `\\s`/`\\(` in a `.ts` probe (caught by a `SyntaxError`) and `'\\n'` in a probe gate
  — the last produced a **false finding** ("the census cannot see a new per-line gate") that survived
  until the control was run. Every probe file after that point was written with the `Write` tool.
- ⚠️ **One plant did not plant its defect and read as a gate failure.** `R13`'s plant, written with the
  `PARKED_TEMPORARILY` const *inside* the `GATES` array bounds, scored exit 0. Re-run with the
  declaration outside the array, the gate reds. Reported as my error, in place, rather than deleted.
- `npm run prove:guards` was run **only** with `--registry=` pointing at a scratch registry inside the
  probe directory and `--no-record`. `scripts/finding-guards.json` was never opened for writing.
- Three temporary `scripts/check-zz-reaudit3-probe*.ts` gates were created and deleted; each deletion was
  asserted before the next step.
- Baseline re-verified at the end: all 13 gates green, `test:wrap-escapes` exit 0, `npm run typecheck`
  exit 0, `npm run test:app` exit 0 (run 6 times under plants), `git status --porcelain` naming only
  `class1-reaudit3-probes/`.
- Probes: `class1-reaudit3-probes/` (`plant.py`, `p01`–`p22`, four probe registries, three probe-gate
  sources). The registry probes are regenerated by `p02-registry.py`.
