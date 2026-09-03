# Class 1 — SECOND re-audit, fresh auditor, 2026-09-02

Target tree: `v1.7-dev` @ `71e247d6`, clean at start. Under audit: `cc178530` and `71e247d6`
(round 2, which closed the 15 findings of `CLASS1-REAUDIT.md`).

**Method.** Every verdict below was reached by **planting and reading the gate's own summary line and
exit code**, never by reading a diff. Every plant was written by a Python helper
(`class1-reaudit2-probes/plant.py`) that snapshots the file's exact **bytes** first, asserts the plant
changed them, and restores in a `finally` block with a byte-equality check — `git checkout --` was
never used and `git diff` was never treated as a restore check. Plants match the target file's own
line endings (`core.autocrlf=true`; several targets are CRLF in the worktree and LF in the blob).

`scripts/finding-guards.json` was never opened for writing; `npm run prove:guards` was never run.
Probes: `class1-reaudit2-probes/`.

**Baseline, this tree, all green:**

```
check-amount-collapse    exit 0  ✅ 2 site(s) … (693 files, 60881 lines read)
check-rounding           exit 0  ✅ 94 inline money-rounding expressions (cap 94)
check-sandbox-writes     exit 0  ✅ 24 sanctioned appStore consumers
check-fixture-dates      exit 0  ✅ 0 imminent · 120 aged (cap 120) · 127 pinned · 114 non-aging
check-finding-guards     exit 0  ✅ 267 of 268 findings carry a standing guard
check-runner-completeness exit 0 ✅ 84·84 / 66·66 / 8·8
test:wrap-escapes        exit 0  ✅ 4 wrap-sensitive · 12 per-line by design · ⚠️ 12 NOT YET REVIEWED
```

Restore integrity: `git status --porcelain` names only this file and `class1-reaudit2-probes/` at the
end. `scripts/finding-guards.json` is **byte-identical to the `HEAD` blob** (`cmp`, clean).
One plant crashed its own harness mid-run before the restore step (a Python `cp1252` stdout error);
the file was repaired by stripping the exact appended bytes and re-verified, and every probe after
that point restores in a `finally`.

---

# Part 1 — the 11 original findings

| # | subject | verdict |
|---|---|---|
| D1-1 | `check-runner-completeness` · commented-out gate | **CLOSED** |
| D1-2 | `check-runner-completeness` · commented-out suite import | **CLOSED** |
| D1-3 | `check-amount-collapse` · wrapped collapse | **CLOSED** |
| D1-4 | `check-amount-collapse` · second site in an `ALLOWED` file | **CLOSED** *(the substitution half is still open — R10)* |
| D1-6 | `check-rounding` · wrapped `Math.round` | **CLOSED** *(bounded — N-9)* |
| D1-7 | `check-fixture-dates` · wrapped fuse + variable-assigned fuse | **CLOSED**, both spellings, on LF and CRLF |
| D1-8 | `check-sandbox-writes` · wrapped import **and** namespace import | **CLOSED** — both halves |
| D1-9 | `check-finding-guards` · duplicate id under a 4-space indent | **CLOSED** |
| D1-11 | `test:wrap-escapes` · proofs plant only the caught spelling | **CLOSED** *(and hollow for 3 of 4 gates — N-1)* |
| C1-9 | `unreadInputsCopy.test.ts` · wrapped `again above` | **CLOSED** *(a sibling spelling is open — N-7)* |
| C2-9 | `debtPrefill.test.ts` · ternary `useState(editing ? …)` | **CLOSED** *(a sibling spelling is open — N-8)* |

**11 closed · 0 not closed.**

### D1-1 — CLOSED
Plant: `scripts/run-gates.ts:42` `    'lint:money',` → `    // 'lint:money',`.
```
❌ runner completeness: 1 problem(s).
  • [lint:rn] 1 lint script(s) exist in package.json and are in NO chain:
          lint:money
EXIT=1
```

### D1-2 — CLOSED
Plant: `packages/core/testing/runRegressionTests.ts:6` → `// import "./testAbuseScenarios";`.
```
❌ runner completeness: 1 problem(s).
  • [test:regression] 1 tracked test file(s) are in the tree and in NO runner:
          packages/core/testing/testAbuseScenarios.ts
EXIT=1
```

### D1-3 — CLOSED
Plant appended to `apps/rn/src/utils/format.ts` (**CRLF**, matching the file), lines 70–74:
```ts
export const __d13 = (raw: string) =>
  parseAmountField(
    raw,
  ) ?? 0;
```
```
❌ amount-collapse: 1 problem(s).
  • apps/rn/src/utils/format.ts:72 collapses a parsed amount to 0.
EXIT=1
```
⚡ **72 is the line of the MATCH**, not of the statement — `parseAmountField(` is physical line 72
(the file is 69 lines; the plant starts at 70). R3's fix holds here.

### D1-4 — CLOSED
Plant: a second `const __d14Planted = parseAmountField(amount) ?? 0;` appended to `WindfallSheet.tsx`.
```
❌ amount-collapse: 1 problem(s).
  • apps/rn/src/components/plan/WindfallSheet.tsx's collapses are not the ones ALLOWED argues for.
        permitted: ["parseAmountField(amount) ?? 0"]
        found    : ["parseAmountField(amount) ?? 0","parseAmountField(amount) ?? 0"]
EXIT=1
```

### D1-6 — CLOSED
Plant appended to `format.ts` in Prettier's shape (trailing comma), 6 lines:
```
❌ rounding: 95 inline money-rounding expressions; the cap is 94 and it only goes DOWN.
EXIT=1
```
The printed sites carry the **right** physical lines — `guardianSelectors.ts:302`, `:373`, `:378`,
which `grep -n "Math\.round"` confirms exactly. R3's 17-of-94 drift is gone.

### D1-7 — CLOSED, both spellings, LF and CRLF
| plant | result |
|---|---|
| A — wrapped `dueDate:` ⏎ `'2026-09-10',` into `format.test.ts` (LF) | **exit 1** · `format.test.ts:65  dueDate: '2026-09-10'  — fires in 8 day(s)` |
| B — `const plantedDueDate = '2026-09-10';` then `{ dueDate: plantedDueDate }` | **exit 1** · `format.test.ts:63  plantedDueDate: '2026-09-10'` |
| A again on a **CRLF** file (`apps/rn/src/data/cloudBackupMessages.test.ts`) | **exit 1** · `:177  dueDate: '2026-09-10'` |

⚠️ A control worth recording: the same wrapped shape with a variable named `__d17b` (no aging key in
its name) is correctly **not** a hit — `non-aging` moved 114 → 115. The gate keys on the *name*, which
is what `D1-7`'s remedy specified.

### D1-8 — CLOSED, and R9's namespace half with it
Both prepended to `apps/rn/src/utils/format.ts`:
| plant | result |
|---|---|
| A — `import {`⏎`  appStore,`⏎`} from '../store/appStore';` | **exit 1** · `format.ts:1 import {    appStore,  } from '../store/appStore'` |
| **B — `import * as appStoreModule from '../store/appStore';`** | **exit 1** · `format.ts:1 import * as appStoreModule from '../store/appStore'` |

`IMPORT` at `check-sandbox-writes.ts:118` now carries both alternations, and the namespace branch is
`\*\s*as\s+\w+` — general, not keyed on the alias containing `appStore`.

### D1-9 — CLOSED, and R8 with it
Registries regenerated independently (`p08-mkreg.py`) from the tracked 268-entry file by inserting one
duplicate entry, spelled four ways. All four parse to 268 unique ids. The tracked registry was never
opened for writing.

| probe registry | result |
|---|---|
| `reg-indent2.json` | **exit 1** · `duplicate id(s) in the registry: S1P1-B1-OWNER` |
| `reg-indent4.json` (D1-9's case) | **exit 1** · same |
| `reg-tab.json` | **exit 1** · same |
| **`reg-unicode.json`** (`"S1P1-B1-OWNER"`, R8's case) | **exit 1** · same |

### D1-11 — CLOSED (see N-1 for what it does not measure)
Un-fix: `check-sandbox-writes.ts` reverted to matching **one physical line at a time**, keeping the
`logicalLines` import so it stays in the derived population, and compiling (`stripCommentsOnly` added
as a second import). The gate stays **green on the clean tree** — exactly the silent regression D1-11
describes:
```
un-fixed gate on the clean tree   EXIT=0  ✅ lint:sandbox — 24 sanctioned appStore consumers…
npx tsx scripts/test-wrap-escapes.ts  EXIT=1
  ❌ check-sandbox-writes.ts      wrapped-plant=FAILED-OPEN · restored=YES
  • check-sandbox-writes.ts did not red for the WRAPPED spelling of its defect (FAILED-OPEN).
```
⚠️ **Two earlier attempts at this un-fix did not compile** (`TransformError: Unterminated string
literal`, then `ReferenceError: stripCommentsOnly is not defined`) and the harness scored them
`FAULT-BASELINE-ALREADY-RED` — a red for the wrong reason wearing a finding's face. Only the third,
compiling revert measures anything, and it is the one reported here.

### C1-9 — CLOSED
Plant into `RequiredActionsCard.tsx:159` — the sentence split across a source line break:
```
❌ App-layer regression run failed: Error: FAIL
   [apps/rn/src/components/plan/RequiredActionsCard.tsx: no refusal points "above" …]
EXIT=1
```
And the detector is now asserted on fixtures: dropping `.map((line) => line.trim())` reds with
`FAIL [the detector sees the phrase WRAPPED across a source line (C1-9)]`.

### C2-9 — CLOSED
Plant into `DebtSheet.tsx:136`, `useState(editing ? String(editing.apr) : '')`:
```
❌ FAIL [no useState in DebtSheet seeds from `editing` … (found 1) (expected 0, got 1)]
EXIT=1
```
Narrowing the pattern back to `/useState\(\s*editing\??\./g` reds with
`FAIL [detector: the sibling-sheet ternary spelling (C2-9) (expected 1, got 0)]`.

---

# Part 2 — the 15 re-audit findings

| # | subject | verdict |
|---|---|---|
| R1 | no green baseline before the plant | **CLOSED** |
| R2 | joins run away to `MAX_JOIN` | **CLOSED** — there is no join; the widest run is 8, by construction |
| R3 | hit reported at the join's first line | **CLOSED** for the money gates *(a smaller drift survives in `check-sandbox-writes` — N-6)* |
| R4 | two correct statements reported as one collapse | ⛔ **NOT CLOSED** |
| R5 | `blankStrings` blanks `${…}` interpolations | **CLOSED** |
| R6 | one `fixture-date-ok:` silences a whole statement | **CLOSED** |
| R7 | a comment supplies the aging key | **CLOSED** |
| R8 | `\uXXXX`-escaped duplicate id invisible | **CLOSED** |
| R9 | namespace import of the singleton admitted | **CLOSED** |
| R10 | `ALLOWED` ratchets against addition only | ⛔ **NOT CLOSED** |
| R11 | `C2-9`'s pattern has an FN and an FP | **CLOSED**, both halves |
| R12 | the concatenated `again above` spelling | **CLOSED** *(a spelling R12 itself named is open — N-7)* |
| R13 | chain membership by `String.includes` over the whole file | **CLOSED** *(and un-guarded — N-3)* |
| R14 | five fixes carry no standing guard | ⛔ **NOT CLOSED** — three are now guarded, `D1-1` and `D1-2` are not |
| R15 | the harness can only see gates that already adopted the fix | **CLOSED** *(the opt-out it offers is unbounded — N-10)* |

**12 closed · 3 not closed.**

### R1 — CLOSED

Two variables, moved together, exactly as R1's own 2×2 did: `check-sandbox-writes.ts` given a stale
`ALLOWED` entry (red for an unrelated reason) **and** reverted to per-physical-line matching.

```
== stale-only
   gate           EXIT=1  ❌ lint:sandbox — 1 STALE allow-list entr(y/ies)…
   wrap-escapes   EXIT=1  ❌ check-sandbox-writes.ts  wrapped-plant=FAULT-BASELINE-ALREADY-RED
== stale + un-fixed
   gate           EXIT=1
   wrap-escapes   EXIT=1  ❌ check-sandbox-writes.ts  wrapped-plant=FAULT-BASELINE-ALREADY-RED
```

R1's last row — the one that printed a green tick over a reopened `D1-8` — now exits 1.

### R2 — CLOSED, and the numbers are worth recording

`flattenContinuations` does not join, so there is no `MAX_JOIN`. Measured over **all 842 tracked
`*.ts`/`*.tsx` files** (`p20-invariants.ts`):

```
length mismatches      = 0
lineAt disagreements   = 0     (every line start in every file, plus the EOF offset)
stray CR mid-statement = 0
widest flatten run     = 8     (MAX_RUN = 8)
run-length histogram (physical lines per flattened group, >1 only):
  2: 957   3: 868   4: 854   5: 865   6: 469   7: 336   8: 1773
```

⚠️ **1,773 groups sit exactly at the cap.** The bound is not headroom; it is load-bearing on every
JSX file in the tree. That is what N-9 measures, and it is what keeps R4 alive.

### R3 — CLOSED for the money gates

The whole-tree sweep above found **zero** `lineAt` disagreements. Independently, over each gate's own
pattern and population (`p23-r3.ts`), asking whether the reported physical line actually carries the
match:

```
rounding:       matches=95  reported at a line NOT containing "Math.round" = 0
collapse:       matches=5   reported at a line NOT containing "parse"      = 0
sandbox-import: matches=31  reported at a line NOT containing "import"     = 4
```

R3's own measurement was 17 of 94 wrong for `check-rounding`; it is now 0 of 94. The four sandbox rows
are a different, smaller mechanism — N-6.

### R4 — ⛔ NOT CLOSED

`check-amount-collapse.ts:63`'s new docblock claims:

> *"`[^\n]*?` still means "within one statement", and that is only true because the scan FLATTENS
> rather than JOINS — a statement-ending newline survives, so this cannot reach across two statements."*

**That is false inside a JSX block.** `depth > 0` holds for the whole of a `return (` tree, so the
newlines that end JSX sibling statements are flattened too — up to `MAX_RUN` of them.

**The measurement.** R4's own plant, verbatim, inserted after `PaydayGuardianCard.tsx:223`
`<Card testID="payday-guardian-card">` — two individually **correct** statements five lines apart,
neither of which collapses anything:

```tsx
<Text>{String(parseAmountField(rawA))}</Text>
<Text>a</Text>
<Text>b</Text>
<Text>c</Text>
<Text>{Number(other) ?? 0}</Text>
```
```
❌ amount-collapse: 1 problem(s).
  • apps/rn/src/components/plan/PaydayGuardianCard.tsx:224 collapses a parsed amount to 0.
EXIT=1
```

With the two statements adjacent (2 lines apart): same result, same line. Baseline before and after
each plant: exit 0, 2 sites.

⚡ What changed is only the **window**. R4 measured this across a 200-line join and reported it 62
lines above the plant; it is now bounded to 8 physical lines and reported at the match's own line 224.
The false positive itself — *"`lint:amount-collapse` reds on honest code"*, whose only escape route is
a file-wide `ALLOWED` entry that then covers the real collapse when it arrives — is unchanged. No such
pair exists in the tree today, so it stays latent.

**Mechanism (HYPOTHESIS).** The docblock's claim assumes "a flattened newline was a continuation" and
"a surviving newline ended a statement" are the same distinction. They are not: the flattener's only
test for *continuation* is unbalanced brackets or a trailing operator, and a JSX subtree satisfies the
first for its whole length. Every newline inside it is flattened regardless of whether it ended a
statement.

**Remedy — UNVERIFIED.** Bound the argument class structurally (balanced parens from the call's own
`(`) rather than by a character the flattener may have removed; or end a run at a line whose stripped
text is `return (` or whose next line opens a JSX element. Not verified — the second interacts with
`D1-8`'s wrapped import, which is the shape `OPENS_BODY` was arrived at by.

### R5 — CLOSED

One plant carrying both defects inside a template interpolation, appended to `format.ts`:

```ts
export function __r5(raw: string, x: number) {
  return `${parseAmountField(raw) ?? 0} and ${Math.round(x * 100) / 100}`;
}
```

| gate | result |
|---|---|
| `check-amount-collapse` | **exit 1** · `format.ts:72 collapses a parsed amount to 0` |
| `check-rounding` | **exit 1** · 95 > cap 94 |

### R6 — CLOSED

One store (`format.test.ts`), one variable (whether the first element carries the exemption):

| appended | result |
|---|---|
| control — the two-element array, no comment | **exit 1** · `:65  dueDate: '2026-09-10' — fires in 8 day(s)` |
| plant — `// fixture-date-ok: …` on the **first** element only | **exit 1**, still naming the second element |

The exemption is now read from `srcLines[flat.lineAt(m.index) - 1]` — the literal's **own physical
line** — so it can no longer cover a sibling.

### R7 — CLOSED

```ts
const __r7 = [
  // the dueDate:
  '2026-09-10',
];
```

→ **exit 0**, `0 imminent fuses · 120 aged · 127 pinned · 115 on non-aging fields`. The comment is
blanked in the matched text, so it cannot supply the aging key; `non-aging` 114 → 115 shows the
literal was read and correctly classified.

### R8 — CLOSED

See D1-9 above: `reg-unicode.json` now exits 1 naming the duplicate. Reverting the single decoding
line reds immediately:

```
❌ finding-guards: the duplicate detector is BLIND to the "escaped key" case.
EXIT=1
```

### R9 — CLOSED

See D1-8 plant B. `IMPORT`'s namespace branch is `\*\s*as\s+\w+`, so it does not depend on the alias
happening to contain `appStore`.

### R10 — ⛔ NOT CLOSED

The fix replaced the per-file **count** with a per-file list of permitted **expressions**
(`ALLOWED[rel].expect`, whitespace-normalised). R10's defect is that the permission is
*identity-free*; a normalised expression string is identity-free in exactly the same way a count is.

**The measurement.** One store, `WindfallSheet.tsx`. One variable: whether the permitted honest
predicate is still the thing the written reason describes.

```diff
-  const n = parseAmountField(amount) ?? 0;
+  const n = parseAmountField(amount) ?? -1;
+  const __stored = parseAmountField(amount) ?? 0;
```

`ALLOWED`'s reason on file is *"a PREDICATE: `const n = parse(...) ?? 0` is consumed by
`validAmount = n > 0` on the next line … Nothing stores `n` while it is zero."* After the plant that
sentence is false of every collapse in the file: `n` no longer collapses, and `__stored` is stored and
never compared to zero — R10's *"genuinely dishonest collapse"*.

```
✅ amount-collapse: 2 site(s), all named with a reason (693 files, 60882 lines read).
EXIT=0
```

Baseline is **60,881** lines; **60,882** confirms the planted line was read. The `expect` comparison
saw `["parseAmountField(amount) ?? 0"]` both before and after, because that is the same string at a
different site.

**Mechanism (HYPOTHESIS).** The remedy moved the pin from cardinality to *text*, and the reasons in
`ALLOWED` are arguments about a **site** — where the value goes next. Neither a count nor a
whitespace-normalised expression carries a location, so any edit preserving the multiset of expression
strings preserves the permission. `norm()` deliberately erases formatting, which also erases the only
remaining thing that could tell two occurrences apart.

**Remedy — UNVERIFIED.** Pin what the reason actually argues about: the permitted statement **plus the
statement that consumes it** (`n > 0`), or an anchor naming the enclosing declaration. Not verified
against the two live entries, and it re-introduces the churn the original finding rejected — which is
why R10 called this *"a design decision, not a patch"*.

### R11 — CLOSED, both halves

| | |
|---|---|
| **FN** — hoisted initialiser, planted live in `DebtSheet.tsx` | **exit 1** · `FAIL [no useState in DebtSheet seeds from \`editing\` … (found 1)]` |
| **FP** — correct code, `useState(` wrapped with an explanatory comment inside, planted live | **exit 0** · `✓ … (found 0) (expected 0, got 0)` · `✅ bill → debt prefill: 43 assertions passed` |
| detector un-fix — delete the hoisted half | **exit 1** · `FAIL [detector: a HOISTED initialiser (R11) (expected 1, got 0)]` |

### R12 — CLOSED

Un-fixing the normalisation reds with its own reason:
`FAIL [the detector sees the phrase CONCATENATED across two literals (R12)]`.
A spelling R12's own mechanism paragraph names is still open — N-7.

### R13 — CLOSED

R13's plant verbatim — `'lint:money',` deleted from `GATES` **and** named in a live
`const PARKED_TEMPORARILY = ['lint:money'];` above it:

```
❌ runner completeness: 1 problem(s).
  • [lint:rn] 1 lint script(s) exist in package.json and are in NO chain: lint:money
EXIT=1
```

Nothing guards that fix — N-3.

### R14 — ⛔ NOT CLOSED

R14 named five fixes with no standing guard: `D1-1`, `D1-2`, `D1-9`, `C1-9`, `C2-9`. Round 2 answered
with per-run **fixture self-checks** rather than registry entries (`MIN_ENTRIES` stayed 268, not the
273 R14's remedy projected). Three of the five are now genuinely guarded; **two are not.**

| fix | un-fix applied | result |
|---|---|---|
| `D1-9` | `topLevelKeys` → `/^\s{2}"([^"]+)":/gm` | **exit 1** · `the duplicate detector is BLIND to the "four-space" case` |
| `C1-9` | drop `.map((line) => line.trim())` | **exit 1** · `FAIL [the detector sees the phrase WRAPPED across a source line (C1-9)]` |
| `C2-9` | narrow the direct pattern back | **exit 1** · `FAIL [detector: the sibling-sheet ternary spelling (C2-9)]` |
| **`D1-1`** | drop `stripCommentsOnly` on `run-gates.ts` **+** `// 'lint:money',` | ⛔ **exit 0** · `✅ runner completeness: … 8 tracked · 8 wired` |
| **`D1-2`** | drop `stripCommentsOnly` on the runner **+** `// import "./testAbuseScenarios";` | ⛔ **exit 0** · `✅ runner completeness: … 66 tracked · 66 wired` |

Both un-fixes restore the exact reported defect and the gate prints its green line. The mechanism —
two fixture self-checks that do not exercise the production path — is **N-3**.

### R15 — CLOSED

The census does derive the population from the property rather than from the import. Measured with a
real new gate (`scripts/check-zz-reaudit-probe.ts`, written per-physical-line the way all six class-1
members were, then deleted; the tree is clean):

```
### A new per-line check-*.ts, in NEITHER list
   EXIT=1
      • check-zz-reaudit-probe.ts splits its input into physical lines, does not use lib/logicalLines,
        and is named in neither PER_LINE_OK nor PER_LINE_UNREVIEWED.
```

The escape hatch it offers is unbounded — N-10.

---

# Part 3 — the count changes, re-derived independently

Every number moved by round 2 was re-derived without reusing the fixer's probes. **All five are
correct.** One recorded *justification* is stale (N-11).

### `MAX_INLINE_ROUNDING` 93 → 94 — correct

A 2×2 over `check-rounding`'s exact population and both regexes (`p15-rounding-2x2.ts`):

```
A per-physical-line / OLD regex (the pre-fix instrument) = 93
B per-physical-line / NEW regex (`,?` only)              = 93
C whole-file NOT flattened / NEW regex                   = 94
D SHIPPED: flattened / NEW regex                         = 94

per-file A -> D differences:
  packages/core/testing/testFullAppRegression.ts: A=3 D=4
per-file C -> D differences (does FLATTENING add anything?):
  NONE — flattening changes no count anywhere in the population.
```

Exactly one site moved, in exactly one file, and it is real and pre-existing. ⚠️ **The C-vs-D row is
the one worth keeping**: the recovery comes entirely from abandoning the per-physical-line split, and
**not at all** from the flattening. That is the measurement N-1 turns on.

### `MAX_AGED_FIXTURE_DATES` 121 → 120 and `pinned` 129 → 127 — correct

Re-derived by re-running the gate's own classification with comments KEPT and BLANKED
(`p18-fixture-counts.ts`):

```
files=220
comments BLANKED (shipped): aged=120 pinned=127 nonAging=114 imminent=0
comments KEPT (v1 fix)    : aged=121 pinned=129 nonAging=114 imminent=0

aged present only with comments KEPT:
  apps/rn/tests/e2e/helpers/seed.ts:18 dueDate: '2026-07-01'
pinned present only with comments KEPT:
  apps/rn/tests/e2e/bnpl.spec.ts:17 currentDate: '2026-07-01'
  apps/rn/tests/e2e/bnpl.spec.ts:17 nextPaycheckDate: '2026-08-01'
```

−1 and −2 exactly, each one a calendar literal inside a docblock. The recorded justification is right.
⚡ The same run surfaced N-2.

### `MIN_ENTRIES` 267 → 268 — correct

`json.load(scripts/finding-guards.json)` → **268** top-level ids, `S1P7-CLASS1-LOGICALJOIN` among
them. The tracked file was never opened for writing (`cmp` against the `HEAD` blob is clean).

### `MIN_CAPS` 27 → 28 — the number is correct, the note is stale

`npx tsx scripts/check-cap-literals.ts` → `✅ cap literals: 28 downward-only cap(s) across 70 scripts`,
and `MIN_CAPS` is `!==`-pinned, so 28 is measured rather than asserted. But the ledger comment reads:

```
// ⚠️ 27 → 28 at S1.13.7.12.6: `MAX_JOIN` in `lib/logicalLines.ts`, the join runaway stop (class 1).
```

`grep -rn "MAX_JOIN" scripts/` returns **exactly one hit — that comment.** The constant it names was
deleted in round 2 and replaced by `MAX_RUN`. See N-11.

---

# Part 4 — things attacked and found SOUND

Recorded because a negative result measured is worth more than an unexamined suspicion.

- **Length preservation.** `flattenContinuations(src).text.length === src.length` on **842/842**
  tracked `*.ts`/`*.tsx`. CRLF included: on a CRLF file the `\r` **and** the `\n` are both replaced by
  spaces (`"const a = foo(    x,  );\r\n"`), and no run leaves a bare `\r` mid-statement anywhere in
  the tree (0 occurrences).
- **`lineAt`.** Zero disagreements over every line start in every tracked file. At a flattened newline
  it returns the line that newline *ended*; at EOF it returns the last line; past EOF it clamps;
  `lineAt(-1)` returns 1. No crash, no off-by-one.
- **Template literals, regex literals, JSX, unbalanced brackets** (`p33-flatten-unit.ts`): none throw,
  none break length. A template at depth 0 is left alone; a template inside a call has its newlines
  flattened (harmless for every current consumer — all four match single-quoted or code tokens). A
  regex body containing `[('"]` is blanked in the *structure* pass, so bracket counting is unaffected.
  An unbalanced open bracket welds at most `MAX_RUN` lines and then resets, because `depth` is
  re-initialised at each run start. A NUL byte passes through untouched.
- **`check-amount-collapse`'s `SELF` set.** Measured what it hides (`p46-self.ts`): three matches —
  the gate's own two `ALLOWED.expect` strings and `test-wrap-escapes.ts`'s plant recipe. Neither file
  imports `amountField`, so no production money path is excluded. **Sound.**
- **`debtPrefill.test.ts`'s deep relative import** `'../../../../../scripts/lib/stripCode'`. Resolves
  to `<root>/scripts/lib/stripCode`. Verified under every runner and typechecker:
  `npm run typecheck` (all four projects) **exit 0**; `npm --prefix apps/rn run lint` (eslint,
  `--max-warnings=0`) **exit 0**; `lint:import-graph` **exit 0** (`23 assertions · 2569 resolved edges
  across 842 source files`); `test:app` **exit 0**; `test:scenarios` **exit 0**. And tsc really reads
  the file — planting `const __typeErr: number = 'not a number';` yields
  `src/components/entities/debtPrefill.test.ts(235,7): error TS2322`. **Sound.**
- **`check-native-a11y-props`, the census's flagged prime suspect.** Measured, not reasoned: the
  banned-prop matcher keys on a single identifier, which a formatter cannot split. A JSX prop with its
  value wrapped over four lines still reds (`SaveFailedBanner.tsx:76: accessibilityState`), as does a
  wrapped `announceForAccessibility(` call. **Not a member of the class.** The census's `⚠️ likeliest
  genuine member` annotation on it is wrong; the genuine member is `check-store-id-writes` (N-5).

---

# New findings created or left open by round 2

Eleven. Severity is in each heading.

## N-1 — `major` · three of `test:wrap-escapes`' four recipes stay green with the shared helper's flattening REMOVED, so the class guard measures the fix in exactly one gate

**Instrument-facing consequence.** `test:wrap-escapes` prints
`✅ 4 wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect` and that sentence is
true for three of them **whether or not class 1 is fixed**. The registered guard
`S1P7-CLASS1-LOGICALJOIN` — whose `proof.unfix` is a one-line edit to `scripts/lib/logicalLines.ts`
and whose `run` is `test:wrap-escapes` — is carried by a single gate. Delete `check-amount-collapse`'s
recipe, or change its `[^\n]*?` to `[^;]*?`, and the class's entire standing proof becomes vacuous
while the harness still reports 4/4.

**File and line.** `scripts/lib/logicalLines.ts:120` (`const text = chars.join('');`) and the four
recipes at `scripts/test-wrap-escapes.ts:58-79`, against the patterns they exercise:
`check-rounding.ts:64` `[^;]*?`, `check-sandbox-writes.ts:118` `[^}]*`,
`check-amount-collapse.ts:63` `[^\n]*?`.

**The measurement.** One variable: `flattenContinuations` reduced to a no-op that returns the
un-flattened comment-stripped source (`const text = visibleSrc;`) — same length, same `lineAt`, same
comment blanking, no flattening at all.

```
PLANT: flattenContinuations is a NO-OP
  check-amount-collapse    EXIT=0  ✅ 2 site(s) … (693 files, 60881 lines read)
  check-rounding           EXIT=0  ✅ 94 inline money-rounding expressions (cap 94)
  check-sandbox-writes     EXIT=0  ✅ 24 sanctioned appStore consumers
  check-fixture-dates      EXIT=0  ✅ 0 imminent · 120 aged · 127 pinned · 114 non-aging
  test:wrap-escapes        EXIT=1
      ❌ check-amount-collapse.ts     wrapped-plant=FAILED-OPEN · restored=YES
      ✅ check-fixture-dates.ts       wrapped-plant=MATCHED · restored=YES
      ✅ check-rounding.ts            wrapped-plant=MATCHED · restored=YES
      ✅ check-sandbox-writes.ts      wrapped-plant=MATCHED · restored=YES
```

The **registered** un-fix (`const open = depth > 0 || CONTINUES.test(…)` → `const open = false;`)
gives the identical result — one `FAILED-OPEN`, three `MATCHED`.

⚡ Corroborated from the other direction by Part 3's 2×2: with flattening removed, **every one of the
four gates' live counts is unchanged** (94, 120/127/114, 24, 2). The flattening currently recovers
zero sites anywhere in the tree.

⚠️ **Stated precisely, because the two halves are not equivalent.** The harness DOES catch a gate
reverting to per-physical-line matching — measured under D1-11 above: `FAILED-OPEN`, exit 1. What it
does not catch is the **flattening** being removed while a whole-file scan stays, which for three of
the four gates is everything the shared helper contributes.

**Mechanism (HYPOTHESIS).** The class-1 fix moved two things at once — the scan unit went from *one
physical line* to *the whole file*, and continuation newlines began to be blanked. Only the first is
load-bearing for a pattern whose character class already crosses newlines, and `[^;]`, `[^}]` and
`[^'\n]`-free patterns all do: a JavaScript negated class matches `\n`. `check-amount-collapse` is the
only gate whose class (`[^\n]*?`) excludes the newline, so it is the only one that can tell the two
changes apart. The recipes were written from the defect's *spelling* rather than from the mechanism,
so nothing in the harness notices — and `MAX_RUN`, `CONTINUES`, `OPENS_BODY`, `IS_IMPORT` and
`bracketDelta` are, on today's tree, load-bearing for exactly one gate while three others pay their
false-positive cost (R4, N-9).

**Remedy — UNVERIFIED.** Give the harness a control: run each recipe a second time with the helper
neutralised and require the verdict to *flip* — a recipe that MATCHES under both is proving something
else and should say so. Not verified: neutralising the helper from inside the harness needs an env
switch in `logicalLines.ts`, which is production code the harness would then depend on.

## N-2 — `major` · a `currentDate: '…'` written inside a COMMENT clock-pins the whole file, so every calendar fuse in it is filed under `pinned` and never refused — and one live file is pinned by a docblock describing a pin it REMOVED

**User-facing consequence.** `A1-4` verbatim: on a date nobody is watching a fixture crosses into the
past, `isOverdue` flips, and every spec inheriting it changes branch with no line of test code edited
and nothing red. The imminent half is the one described as *"always fatal, never capped … the half
that fires BEFORE the damage."*

**File and line.** `scripts/check-fixture-dates.ts:148` and `:172`:

```ts
const CLOCK_PIN = /currentDate\s*:\s*'\d{4}-\d{2}-\d{2}'/;
…
const isPinned = CLOCK_PIN.test(text);   // `text` is RAW — comments intact
```

Round 2 deliberately stopped matching literals in comments (that is the whole of the 121→120 and
129→127 justification, and it is why `R7` is closed). The **pin test was not moved with it**.

**The measurement.** One store, `apps/rn/src/utils/format.test.ts`; one variable, the comment.

| appended | `npx tsx scripts/check-fixture-dates.ts` |
|---|---|
| **control** — `const __cp = { dueDate: '2026-09-10' };` | **exit 1** · `format.test.ts:63  dueDate: '2026-09-10'  — fires in 8 day(s)` |
| **plant** — the same, preceded by `// currentDate: '2026-01-01' is the pin the sibling suite uses` | **exit 0** · `0 imminent fuses · 120 aged · **128** in clock-pinned files · 114 non-aging` |
| **plant B** — the same prose in a `/** … */` block comment | **exit 0** · identical, `128` pinned |

`pinned` 127 → 128 is the load-bearing evidence: the literal was read, classified as aging, and then
filed in the one bucket the gate never refuses.

⚡ **This is live, not latent.** `p18-fixture-counts.ts` swept the gate's own 220-file population for
files whose `CLOCK_PIN` exists *only* inside a comment:

```
files whose CLOCK_PIN exists ONLY in a comment:
  apps/rn/tests/e2e/bnpl.spec.ts
```

That file's dates were converted to `day(n)` — it has **no** clock pin — and the only text matching
`CLOCK_PIN` is `bnpl.spec.ts:17`, a docblock sentence recording the pin that was *removed*:
*"They used to be literals (`currentDate: '2026-07-01'`, `nextPaycheckDate: '2026-08-01'`), which made
this suite a time bomb."* Planting an 8-day `dueDate` fuse there:

```
✅ fixture-dates: 220 test-shaped file(s) scanned · 0 imminent fuses · 120 aged … · 128 in clock-pinned
   files (deterministic) · 114 on non-aging fields.
EXIT=0
```

Control: the same literal in `apps/rn/tests/e2e/celebration.spec.ts` (no such prose) → **exit 1**,
`celebration.spec.ts:242  dueDate: '2026-09-10'  — fires in 8 day(s)`.

So the one file in the tree whose docblock *narrates* the exact time-bomb failure this gate exists to
prevent is the one file the gate has stopped watching.

**Mechanism (HYPOTHESIS).** `isPinned` and the literal scan were one loop over one text before round
2. Blanking comments for the literal scan split them into two views of the file, and only the view
that was the subject of `R7` moved. `CLOCK_PIN` is also the coarsest signal in the gate — one match
silences a whole file — so it is the worst place for the two views to diverge.

**Remedy — UNVERIFIED.** Test `CLOCK_PIN` against `stripCommentsOnly(text)`, the same text the literal
scan reads. Measured consequence of that change, from `p18-fixture-counts.ts`: `bnpl.spec.ts` leaves
the pinned bucket and contributes 0 literals, so no count moves — but this is unverified against the
gate itself, and `pinned` is not a ratcheted number, so the sweep should be re-run before the change.

## N-3 — `major` · both of `check-runner-completeness`'s new fixture self-checks assert code the production path does not run, so `D1-1`, `D1-2` and `R13` are all un-fixable with the gate green

**Instrument-facing consequence.** This is R14's finding, re-created inside R14's own fix. The gate
now prints two "asserted on fixtures every run" blocks whose docblocks claim they close
`D1-1`/`D1-2`/`R13`; all three defects can be restored, one line each, and the gate exits 0.

**File and line.** `scripts/check-runner-completeness.ts`.

- `chainRegion()` is defined at `:217` and has **exactly one caller in the repo** — the fixture at
  `:232` (`grep -n chainRegion scripts/*.ts` returns those two lines and nothing else). Production
  re-implements the same three lines inline at `:257-267`:

```ts
const gatesStart = runGatesRaw.indexOf('const GATES');
const gatesEnd = gatesStart === -1 ? -1 : runGatesRaw.indexOf('\n];', gatesStart);
…
const runGates = runGatesRaw.slice(gatesStart, gatesEnd);
```

- The import fixture at `:243-244` supplies its own stripping:

```ts
const live = reg.imports(stripCommentsOnly('import "./testThing";'), reg.runner);
const commented = reg.imports(stripCommentsOnly('// import "./testThing";'), reg.runner);
```

so it asserts that `stripCode` blanks a comment, not that production hands `r.imports` stripped text.

**The measurement.** Three un-fixes, each paired with the defect it re-enables.

| un-fix (production only; the fixture is untouched) | defect re-planted | gate |
|---|---|---|
| `const runGates = runGatesRaw;` (drop the region slice) | `'lint:money',` deleted from `GATES` + `const PARKED_TEMPORARILY = ['lint:money'];` | **exit 0** · `✅ … 8 tracked · 8 wired` |
| `runGatesRaw = readFileSync(…)` (drop `stripCommentsOnly`) | `// 'lint:money',` | **exit 0** · `✅ … 8 tracked · 8 wired` |
| `r.imports(readFileSync(…))` (drop `stripCommentsOnly`) | `// import "./testAbuseScenarios";` | **exit 0** · `✅ … 66 tracked · 66 wired` |

Row 1 also runs the un-fixed gate on the **clean** tree: `exit 0`, full green summary — so nothing in
the gate notices its region test has become the whole file until a defect is actually written.

Controls (already established in Part 1): each defect alone, with production intact, reds.

**Mechanism (HYPOTHESIS).** The fixture was written against a helper that was extracted *for the
fixture*. Extracting a function to test it and then leaving the original expression in place is the
`tested-helper-is-not-a-used-helper` shape — the clamp existed, was correct and was tested while the
defect shipped, because what was missing was the call. The import fixture is the same shape one layer
out: the seam under test was moved into the fixture's own argument.

**Remedy — UNVERIFIED.** Call `chainRegion(runGatesRaw)` from production and delete the inline copy;
and have the import fixture strip nothing — pass the raw fixture text through the same
`stripCommentsOnly(readFileSync(...))` expression production uses, e.g. by extracting
`importsFrom(runner, rawText)` and asserting on that. Not verified: `chainRegion` returns `null` where
production has a distinct error message for each missing bound, so the failure text changes.

## N-4 — `major` · `check-local-dates` sits in `PER_LINE_OK` with a reason that is factually wrong, and is measurably blind to the wrapped spelling of the UTC round-trip it exists to refuse

**User-facing consequence.** The gate's own words: *"A calendar date routed through UTC (off by one
east of UTC)"*. A due date one day wrong is the class this gate is the only guard for.

**File and line.** `scripts/test-wrap-escapes.ts:113` — the census row:

> `'check-local-dates.ts': 'matches a single call expression by name, and reports the line a human must edit; the class-1 escape needs a call ARGUMENT to wrap, which this does not read.'`

and `scripts/check-local-dates.ts:43`, which **does** read call arguments and **does** span a method
chain:

```ts
const BANNED = /toISOString\(\)\s*\.\s*(slice|substring|substr)\s*\(\s*0\s*,\s*10\s*\)|…/;
```

consumed per physical line at `:99-102` (`stripComments(raw).split(/\r?\n/).forEach(…)`).

**The measurement.** One store, `apps/rn/src/utils/format.ts`; one variable, the line wrapping.

| plant | `npx tsx scripts/check-local-dates.ts` |
|---|---|
| control — `const __ctl = (d: Date) => d.toISOString().slice(0, 10);` | **exit 1** · `❌ A calendar date routed through UTC (off by one east of UTC): apps\rn\src\utils\format.ts:71` |
| **method chain wrapped** — `d`⏎`  .toISOString()`⏎`  .slice(0, 10);` | **exit 0** · `✅ local dates: no UTC round-trips … [read 52094 lines]` |
| **argument list wrapped** — `d.toISOString().slice(`⏎`  0,`⏎`  10,`⏎`);` | **exit 0** · `✅ … [read 52095 lines]` |

The scan counts rising confirm both plants were read and matched nothing. Both spellings are ordinary
Prettier output the moment the receiver expression grows past the print width.

A second `PER_LINE_OK` row is wrong the same way. `'check-press-opacity.ts': 'matches a JSX prop on
its own line; the prop cannot be split without the value moving with it.'` — the subject is a
**style-object property**, its pattern is `/opacity:[^;\n]*\b(pressed|hovered|disabled)\b[^;\n]*?\b0?\.\d+/`
(`check-press-opacity.ts:48`), and **the gate's own docblock contradicts the census row**: *"A ternary
split across lines by the formatter is the known blind spot."* Measured:

| plant into `SaveFailedBanner.tsx` | result |
|---|---|
| `({ opacity: pressed ? 0.7 : 1 })` | **exit 1** |
| the same ternary wrapped over three lines | **exit 0** · `✅ press opacity: 399 files, every control state on a token.` |

**Mechanism (HYPOTHESIS).** The twelve `PER_LINE_OK` reasons were written in one pass from what each
gate is *about* rather than from what its regex *spans*. The two that are wrong are the two whose
subject is a phrase ("a UTC round-trip", "a state-dependent opacity") rather than a token — and the
`check-press-opacity` row was written without reading the docblock twenty lines above the pattern,
which already said the opposite. This is the enumerated-list failure the class-1 evidence names as
law II: a written list of reasons becomes the thing the next reader trusts instead of the code.

**Remedy — UNVERIFIED.** Derive the exemption rather than write it: a gate qualifies for `PER_LINE_OK`
only if every pattern it applies per line is a single token with no quantifier that can span
whitespace — checkable mechanically from the regex sources. Then fix the two: `check-local-dates`
should use the helper (its patterns are 3–5 lines, inside `MAX_RUN`); `check-press-opacity` should
either use it or have its docblock's admission promoted into the census row.

## N-5 — `major` · `check-store-id-writes`, held in `PER_LINE_UNREVIEWED`, reds on an ordinary Prettier-wrapped `findIndex` — at a cap of 0, with no exemption list

**Instrument-facing consequence.** The noisy direction of class 1, with no escape route.
`MAX_BARE_ID_WRITES = 0` and there is no `ALLOWED` map, so the only ways past a false positive are to
un-wrap the code or to weaken the gate — and *"a guard that reds on its own documentation gets deleted
rather than obeyed"* applies just as well to a guard that reds on Prettier's output.

**File and line.** `scripts/check-store-id-writes.ts:45-47` and `:73-78`:

```ts
const BY_ID = /\b\w+\.id\s*===\s*id\b/;
const IS_LOOKUP = /\.(find|findIndex|some|filter)\s*\(/;
…
code.split('\n').forEach((line, i) => {
  if (!BY_ID.test(line)) return;
  if (IS_LOOKUP.test(line)) return;      // ← both must land on the SAME physical line
  sites.push(…);
});
```

**The measurement.** One store, `apps/rn/src/store/balanceSelectors.ts`; one variable, the wrapping.

| plant | `npx tsx scripts/check-store-id-writes.ts` |
|---|---|
| control — `return rows.findIndex((r) => r.id === id);` | **exit 0** · `✅ store id writes: no bare id-keyed row edits across 51 store file(s)` |
| **the same lookup, wrapped** — `rows.findIndex(`⏎`  (r) => r.id === id,`⏎`);` | **exit 1** · `❌ store id writes: 1 bare \`x.id === id\` comparison(s) outside a lookup; the cap is 0 and it only goes DOWN.` ⏎ `apps/rn/src/store/balanceSelectors.ts:133: (r) => r.id === id,` |

Nothing about the code changed except where the line breaks fall.

**Mechanism (HYPOTHESIS).** The gate encodes a two-token *relationship* — a comparison and the lookup
that legitimises it — as co-occurrence on one physical line. That is class 1 exactly, but the
asymmetry runs the other way from the six members already fixed: those went blind, this one goes
noisy, which is why it never surfaced as a missed defect. The census's annotation put the suspicion on
`check-native-a11y-props` (Part 4 measures that one as sound) and left this row unmarked.

**Remedy — UNVERIFIED.** Use the shared helper: a wrapped `findIndex(` and its predicate flatten into
one run well inside `MAX_RUN = 8`, which restores the co-occurrence the gate assumes. Not verified —
`MAX_BARE_ID_WRITES = 0` means any change to the scan unit must be re-derived over the 51 store files
before it is trusted, and N-9's blind window applies to a lookup whose predicate is long.

## N-6 — `minor` · `check-sandbox-writes` reports an offending import at the first line of the docblock above it, because `^\s*import` lets `\s*` run over blanked comments

**Instrument-facing consequence.** R3's consequence — *"somebody sent to `path:line` finds a line with
nothing on it"* — surviving in the one gate whose message is an instruction to go and edit a line. It
is `minor` rather than `major` because the printed snippet (`m[0].trim()`) still identifies the site,
and the drift is bounded by the length of the leading comment run.

**File and line.** `scripts/check-sandbox-writes.ts:118` and `:148`:

```ts
const IMPORT = /^\s*import\s*(?:\{[^}]*\bappStore\b[^}]*\}|\*\s*as\s+\w+)\s*from\s*['"][^'"]*appStore['"]/gm;
…
offenders.push({ file: rel, line: flat.lineAt(m.index), … });
```

Comments are blanked to **spaces**, `\s` matches a space and a newline alike, and the `m` flag lets
`^` anchor at the start of the blanked docblock. `m.index` is therefore the first blanked character,
not the `import`.

**The measurement.** Over the live tree (`p23-r3.ts`), 4 of the 31 files this pattern matches report a
line that contains no `import`:

```
sandbox-import: matches=31  reported at a line NOT containing "import" = 4
   apps/rn/src/analytics/funnel.ts:1     «/**»
   apps/rn/src/app/tutorial.tsx:3        «»
   apps/rn/src/premium/premiumSync.ts:2  «»
   apps/rn/src/store/persistence.ts:6    «»
```

And on the path that actually reds — a wrapped, unsanctioned import prepended to
`apps/rn/src/utils/a11y.ts` behind a four-line docblock, so the `import` is at physical line 5:

```
❌ lint:sandbox — 1 unsanctioned reference(s) to the appStore singleton:
   apps/rn/src/utils/a11y.ts:1
     import {   appStore, } from '../store/appStore'
```

All four live instances are in `ALLOWED`, so none is printed today.

**Mechanism (HYPOTHESIS).** `stripCode`'s stated guarantee is that *line count and every line's length
are preserved, so a hit still reports the right `path:line`* — true of the text, but not of a match
whose own start is inside the blanked region. `^\s*` was written to allow indentation; blanking turned
whole comments into indentation.

**Remedy — UNVERIFIED.** Anchor the report on the `import` keyword — `m.index + m[0].indexOf('import')`
— or tighten `^\s*` to `^[ \t]*`. The second is likely to change nothing else, but neither is verified
against the stale-entry check, which the gate's header requires to be re-run on any scanning change.

## N-7 — `major` · `unreadInputsCopy`'s needle still misses the `{' '}` JSX separator — the spelling R12's own mechanism paragraph names — and 33 assertions pass over a card rendering "set it again above"

**User-facing consequence.** `S1.13.7.8` verbatim: a card telling the user to *"set it again above"*
about a card one "Got it" tap removes.

**File and line.** `apps/rn/src/components/plan/unreadInputsCopy.test.ts:70`:

```ts
.replace(/['"`]\s*\+\s*['"`]/g, '');
```

R12's mechanism paragraph reads: *"Anything that lands between the two words — a quote, a `+`, a
`{' '}` JSX separator — still defeats it."* The fix normalises the first two.

**The measurement.** One store, `RequiredActionsCard.tsx:159`, the site both C1-9 and R12 used.
Runner `npm run test:app`.

| plant | result |
|---|---|
| control — the phrase split across a source line break (C1-9's spelling) | **exit 1** · `❌ App-layer regression run failed: Error: FAIL [apps/rn/src/components/plan/RequiredActionsCard.tsx: no refusal points "above" at a card that one tap removes]` |
| **plant** — `<>{\`… set it again\`}{' '}{\`above. …\`}</>` | **exit 0** · `✓ apps/rn/src/components/plan/RequiredActionsCard.tsx: no refusal points "above" …` · `✅ unread-inputs copy: 33 assertions passed` · `✅ App-layer regression tests: ALL PASSED.` |

The card renders "set it again above" and the assertion that exists to refuse exactly that prints a
tick naming the file.

Two further spellings escape the same way (`p28-c19.mjs`, replica of `codeLinesOnly`): a
`${' '}` interpolation, and concatenation through a named separator const. Both `MISSED`.

**Mechanism (HYPOTHESIS).** Each round has normalised the artefact the previous round's plant
exhibited — indentation, then the `'` + `'` junction — rather than the property the assertion names,
which is *what the reader sees*. Source text has unboundedly many spellings of one rendered sentence;
enumerating them converges no faster than the authors invent them. This is the D1-8 shape (*"the
finding's title names two escapes, one was fixed"*) with the second escape sitting in the finding's
mechanism paragraph instead of its title.

**Remedy — UNVERIFIED.** Stop matching source text: assert on the string the component renders, which
`test:app` can already produce for these cards. Failing that, `/again\W+above/i` over the joined code
covers `{' '}`, `${' '}` and `+ SEP +` in one rule. Not verified — R12 records that relaxing this
needle changes what every other `includes` assertion in the file sees, so it needs a plant per claim.

## N-8 — `major` · `debtPrefill`'s detector misses a `useState` initialiser that reaches `editing` through a DESTRUCTURED binding

**User-facing consequence.** `C2-9`'s: `DebtSheet` seeded from `editing` instead of `seed`, so on an
EDIT the two are identical and every test passes, and only a **prefilled add** — a bill converted to a
debt — silently drops the prefill.

**File and line.** `apps/rn/src/components/entities/debtPrefill.test.ts:177-179`:

```ts
const hoisted = [...src.matchAll(/const\s+(\w+)\s*=\s*[^;]*\bediting\b[^;]*;/g)]
```

`const\s+(\w+)` requires a word character immediately after `const`, so a destructuring pattern (`{`)
never matches — and `let` never matches either.

**The measurement.** One store, `DebtSheet.tsx:136`. Runner `npm run test:app`.

| plant replacing `const [apr, setApr] = useState(seed?.apr != null ? …)` | result |
|---|---|
| control (C2-9) — `useState(editing ? String(editing.apr) : '')` | **exit 1** · `FAIL [no useState in DebtSheet seeds from \`editing\` … (found 1) (expected 0, got 1)]` |
| control (R11) — hoisted `const __init = editing ? … ; useState(__init)` | **exit 1** · same |
| **plant** — `const { apr: __edApr } = editing ?? ({} as { apr?: number });`⏎`const [apr, setApr] = useState(__edApr != null ? String(__edApr) : '');` | **exit 0** · `✓ … (found 0) (expected 0, got 0)` · `✅ bill → debt prefill: 43 assertions passed` |

Two further spellings escape (`p31-r11.mjs`, replica of `seedsFromEditing`): `let` in place of `const`,
and a two-hop `const x = editing?.apr; const y = x; useState(y);`.

**Mechanism (HYPOTHESIS).** Each round has widened the pattern by one binding *form* — direct, then
ternary, then a single `const` hop. The property being asserted is "no state hook's initial value is
derived from `editing`", which is a dataflow question; a regex over binding forms can only ever
enumerate the forms someone has already thought of, which is `D1-11`'s blind-spot argument applied to
a detector instead of a plant.

**Remedy — UNVERIFIED.** R11's own remedy still stands and was not taken: resolve the initialiser
through local bindings, which is a parse rather than a regex. A cheaper intermediate that covers all
three misses: capture the binding name with `/(?:const|let|var)\s+(?:\{[^}]*\}|(\w+))/` and follow one
extra hop. Not verified — widening the binder pattern risks the R11 false positive the fixture now
pins, so it must be re-measured against that row.

## N-9 — `major` · `MAX_RUN = 8` is a live blind window: a collapse wrapped over 10 physical lines escapes `check-amount-collapse` entirely, and 1,026 call expressions in the tree already span ≥ 9 lines

**Instrument-facing consequence.** The helper's docblock states the cost — *"a wrapped call spread
over more than `MAX_RUN` lines is not detected"* — and justifies it as unreachable: *"Real wrapped
calls are 2–5 physical lines — the four plants this class proves are 3, 3, 3 and 4."* The population
says otherwise.

**File and line.** `scripts/lib/logicalLines.ts:66` (`const MAX_RUN = 8;`) and the loop's break at
`:104` (`i - runStart + 1 >= MAX_RUN`).

**The measurement, part 1 — reachability.** Every `ident( … )` paren group in `apps/rn`, `packages`
and `scripts`, measured on comment- and string-blanked text (`p34-maxrun.ts`):

```
multi-line call expressions: 3042 across 697 files
calls spanning >= 9 lines (INVISIBLE past MAX_RUN = 8): 1026
  apps/rn/src/app/(tabs)/index.tsx:570   span=10  provisionalPayoffs.map(
  apps/rn/src/app/(tabs)/index.tsx:987   span=16  useStore(
  apps/rn/src/app/(tabs)/index.tsx:1050  span=15  useEffect(
  …
…of which the head name is money- or import-shaped: 3
  apps/rn/src/app/(tabs)/money.tsx:1366              span=10  MoneyHero(
  apps/rn/src/data/backup.test.ts:188                span=10  parseBackup(
  packages/core/engine/allocatePaycheck.ts:650       span=10  roundMoney(
```

**The measurement, part 2 — the escape.** One store, `apps/rn/src/utils/format.ts`; one variable, how
wide the argument list is wrapped.

| plant | `check-rounding` | `check-amount-collapse` |
|---|---|---|
| control — a 3-line `Math.round(` and a 3-line `parseAmountField(…) ?? 0` | **exit 1** | **exit 1** |
| **10-line argument lists, same two defects** | **exit 1** | ⛔ **exit 0** · `✅ 2 site(s) … 60906 lines read` |

Baseline is 60,881 lines; **60,906** confirms the 25 planted lines were read and matched nothing.
`check-rounding` survives only because `[^;]*?` crosses the newline the flattener left behind — the
same accident N-1 measures, here working in the gate's favour.

**Mechanism (HYPOTHESIS).** `MAX_RUN` was set from the *plants* (3, 3, 3, 4) rather than from the
population, and the population it must survive is not "calls people wrap" but "calls Prettier wraps",
which is a function of print width and argument length. The 1,773 groups sitting exactly at the cap
(Part 2, R2) say the bound is being hit constantly rather than never.

**Remedy — UNVERIFIED.** The bound cannot simply be raised — R4 is the reason it exists, and widening
it widens R4's false-positive window in step. The two have to be separated: end a run at a JSX element
boundary (which is what actually needs bounding) and let a genuine bracketed continuation run to its
matching close. Not verified, and it is the same change R4's remedy needs.

## N-10 — `minor` · `PER_LINE_UNREVIEWED` is labelled "downward-only" on every run and nothing enforces it

**Instrument-facing consequence.** The census's stated contract is *"the harness reds if it GROWS, and
each entry leaves only by being reviewed into `PER_LINE_OK` with a reason, or fixed."* The list is the
only escape hatch a new per-line gate has, so an unbounded one is a self-service exemption printed as
a ratchet.

**File and line.** `scripts/test-wrap-escapes.ts:128-142` (the `Set`) and `:159-166`, which is the only
check applied to it — it reds when an entry *stops* splitting lines, never when one is added. There is
no pinned count, unlike `MIN_CAPS` (`!==`, `check-cap-literals.ts:131`), `MAX_UNGUARDED` or
`MIN_ENTRIES`.

**The measurement.**

| plant | result |
|---|---|
| move `check-apostrophes.ts` from `PER_LINE_OK` back into `PER_LINE_UNREVIEWED` (11 / 13) | **exit 0** · `✅ wrap-escapes: 4 wrap-sensitive gate(s) … · 11 per-line by design · ⚠️ 13 per-line and NOT YET REVIEWED (downward-only).` |
| a brand-new per-line `check-*.ts` in neither list | **exit 1** — correctly caught |
| the same new gate with one line added to `PER_LINE_UNREVIEWED` (12 / 13) | **exit 0** · `⚠️ 13 per-line and NOT YET REVIEWED (downward-only).` |

The harness prints a number that has gone up, beside the word "downward-only", beside a green tick.

**Mechanism (HYPOTHESIS).** The downward-only property was written into the docblock at the same time
as the stale-entry check, and the stale-entry check is the *departure* half of the ratchet; the
*arrival* half was never written because at authoring time the list was being filled, not defended.
This is `check-cap-literals`' own `MIN_CAPS` lesson — *"a floor sees a collapse; it cannot see one
member walk away"* — in mirror image.

**Remedy — UNVERIFIED.** Pin the size with `!==`, the `MIN_CAPS` idiom, so adding a row costs a second
edit and shows up in review. Trivial, but unverified — and it should land together with a floor on
`wrapSensitive.length`, which R15 named and which is still absent (the harness exits 0 for any
population ≥ 0 provided no recipe is orphaned).

## N-11 — `minor` · `MIN_CAPS`' ledger note names `MAX_JOIN`, a constant round 2 deleted

**Instrument-facing consequence.** `MIN_CAPS` is `!==`-pinned precisely so that a cap leaving the
population is visible. The number is right; the sentence recording *which* cap it counts points at
something that no longer exists, so the next person to move this number is reading a false record.

**File and line.** `scripts/check-cap-literals.ts:130`:

```ts
// ⚠️ 27 → 28 at S1.13.7.12.6: `MAX_JOIN` in `lib/logicalLines.ts`, the join runaway stop (class 1).
```

**The measurement.** `grep -rn "MAX_JOIN" scripts/` returns **one hit — that comment**. The constant it
describes was replaced by `MAX_RUN` (`scripts/lib/logicalLines.ts:66`) in the same round-2 redesign
that removed joining. The gate itself is green and correct:
`✅ cap literals: 28 downward-only cap(s) across 70 scripts are literals.`

**Mechanism (HYPOTHESIS).** The ledger comment was written in round 1 against `MAX_JOIN` and the
round-2 rename replaced the constant without revisiting the note that records it — the count stayed
28, so the pinned check never asked.

**Remedy — UNVERIFIED.** Rename in the comment. Unverified only in the sense that nothing was run
after changing it.

---

## Method notes

- Every plant was written by `class1-reaudit2-probes/plant.py`, which snapshots the target's exact
  **bytes**, asserts the plant changed them, and restores in a `finally` with a byte-equality check.
  `git checkout --` was never used; `git diff` was never treated as a restore check.
- Plants match the target's own line endings. `core.autocrlf=true` and the targets are mixed:
  `format.ts`, `WindfallSheet.tsx`, `DebtSheet.tsx`, `logicalLines.ts` are CRLF in the worktree;
  `format.test.ts`, `a11y.ts`, `check-sandbox-writes.ts`, `RequiredActionsCard.tsx` are LF.
- Each command's **own** exit code was read (`subprocess.run(...).returncode`), never a pipeline's.
- Two probe attempts produced control characters rather than the intended text — a Python non-raw
  string turned `\bediting\b` into backspaces, and a shell heredoc collapsed `\\n` to a real newline
  inside a JS string literal. Both were caught because the anchor assertion failed and because the
  first "new gate is invisible to the census" result contradicted a direct test of the detector
  regex; the census result was re-measured with a fixture written by file, and the corrected answer
  (**exit 1**, the census does see it) is what is reported in R15.
- `npm run prove:guards` was **not** run. `scripts/finding-guards.json` is byte-identical to the
  `HEAD` blob (`cmp`, clean).
- Baseline re-verified at the end: `check-amount-collapse` 2 sites / 60,881 lines · `check-rounding`
  94 (cap 94) · `check-sandbox-writes` 24 sanctioned · `check-fixture-dates` 0 imminent / 120 aged /
  127 pinned / 114 non-aging · `check-finding-guards` 267 of 268 · `check-runner-completeness`
  84·84 / 66·66 / 8·8 · `check-store-id-writes`, `check-local-dates`, `check-press-opacity`,
  `check-native-a11y-props` all exit 0 · `test:wrap-escapes` 4/4 · `npm run typecheck` exit 0 ·
  `test:app` exit 0 · `test:scenarios` exit 0.
- Probes: `class1-reaudit2-probes/` (`plant.py`, `_boot.py`, `p01`–`p47`). The four ~1 MB probe
  registries `p08-mkreg.py` emits are left in place; re-run it to regenerate them.
