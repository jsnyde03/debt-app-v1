# S0 re-verification, pass 2 — the instruments

**Pinned:** `b03e0d3` *(P6.8.9.7.11.18 S0.8 — the seven from re-verify pass 1, and three more found fixing them)*, branch `v1.7-dev`.
**Surface:** `scripts/check-*.ts`, `scripts/lib/stripCode.ts`, `scripts/gateSources.ts`, `scripts/run-gates.ts`,
`apps/rn/src/data/migrationAudit/{invariants,audit.test,hostile.test,corpus,doors}.ts`.
**Bar:** blocker + major only. `minor` appears only where it is the residual of a fix under judgement, or
where I am recording that something measured is **not** a major so pass 3 does not re-open it.

**Result: 0 blockers · 3 majors.**

> ⛔ Every number below came from a probe in the scratchpad that **lifts the instrument's own code out of
> the file at runtime** (`ts.transpileModule` + `new Function`) and runs it against a **TypeScript-parser
> ground truth**, or from running the gate. Nothing is taken from `DEBT_ELEVATION_LOG.md`.
>
> ⚠️ **The ground truth was itself wrong twice before it was trusted, and both errors flattered the
> finding.** My first character mask omitted *trailing* comments (77,384 phantom "lost code" chars), and
> then JSX `{/* … */}` comments (73,905 → **34**). Both were caught by printing the raw-vs-stripped lines
> and looking at them. **No figure in this report was believed until a printed line showed the mechanism.**
> This is the third consecutive round in which a stripper measurement was wrong in the direction of the
> point being made — pass 1's "45× blinder", the fixer's "478,413 chars", and now mine.

---

## Job 1 — the seven pass-1 findings, re-verified

### 1 · `[closes: …]` minted four fabricated closures — **CLOSED**

**What the fix did.** `scripts/check-audit-closure.ts:115-119` adds `stripMarkdownCode()`, blanking
` ``` ` fences and single-backtick inline spans before `CLOSES` (`:96`) scans. Applied at `:123`.

**Measured, by running the gate.** `npm run lint:closure`:

```
✅ [D37]: all 55 high+ findings trace to a closure or a recorded refutation.
   ⚠️ …but 55 of 55 trace ONLY by an unmarked mention (cap 55, downward-only). 0 carry an explicit `[closes: …]` token.
   ⚠️ Of the 48 that DO trace, 48 trace only by an unmarked mention (cap 48, downward-only)
```

**55 of 55** and **48 of 48** — both caps are back at the true totals pass 1 measured with the token set
emptied, and **`explicit.size` is 0**. The three real findings pass 1 found fabricated closures for
(`L0-1` major, `L5-5`, `M2-1` major) are open again.

**Independent probe over the three live `SOURCES`**, lifting `stripMarkdownCode` from the file:

| source | raw `[closes:]` | surviving |
|---|---|---|
| `docs/DEBT_ELEVATION_PLAN.md` | 2 (`ID`, `ID`) | **0** |
| `docs/DEBT_ELEVATION_LOG.md` | 3 (`L5-5 M2-1`, `L0-1`, `…`) | **0** |
| `L9-refutations.md` | 0 | 0 |

**Preserved?** ✅ Yes, and this is the thing that most needed checking: `stripMarkdownCode` blanks **21.7%
of `DEBT_ELEVATION_LOG.md` (380,862 chars)** and **22.4% of the plan**. That is a lot of corpus to make
unreadable. It is safe because the **mention** check — the half that `process.exit(1)`s — reads the
**raw** file at `:167` and `:239` and was not touched. Verified by reading both loops. The gate's `[D37]`
`missing` count is unchanged at 0.

⚠️ **New residual → Job 2 finding 3.** The remedy is a *spelling enumeration of "markdown code"* and is
already short by three.

---

### 2 · the string-literal stripper's backtick runaway → `scripts/lib/stripCode.ts` — **PARTIAL · major**

**What the fix did.** A stateful single-pass scanner (`scripts/lib/stripCode.ts:42-93`), exported as
`stripCommentsAndStrings` / `stripCommentsOnly`. `scripts/check-month-arithmetic.ts:177-224` carries a
**second, hand-duplicated copy** of the same scanner rather than importing it.

**Is the original behaviour gone?** Partly. The comment-vs-string ordering problem is genuinely solved.
**The backtick runaway is not** — it moved from comments into **regex literals**, which the scanner does
not model at all. → **Job 2 finding 1.**

**Did it break anything that was right? Measured over the same 624-file corpus, same ground truth, all four
strippers lifted from their own commits** *(this is the apples-to-apples table pass 1 and the fixer both
lacked)*:

| stripper | plain-code chars blanked | lines | files | template-expr blanked | comment chars left exposed |
|---|---|---|---|---|---|
| `c8d54fa` — comments-only regex *(the state M10 filed)* | **3,453** | 200 | 11 | 292 | 46 |
| `2b10a6c` — strings-first regex *(pass 1's target)* | **11,105** | 458 | 25 | 29,970 | 1,776 |
| **`b03e0d3` — the scanner** *(both copies byte-identical in behaviour)* | **6,966** | 304 | 22 | 30,167 | **329** |

⚠️ **Read this the way the brief demands.** The fix moved the number the right way — 11,105 → 6,966, a 37%
reduction — **and it is still 2.0× the baseline it regressed from.** A metric moving the right way is not
the same as a class being closed, and the docstring at `check-month-arithmetic.ts:158-166` claims the
latter: *"a quote inside a comment is comment text and a `//` inside a string is string text, **by
construction**."* There is a third construct, and it is not modelled.

**Would anything catch it un-fixing?** No. `grep -rn` finds no test over any of these four gates. But the
*gates themselves* are green — `lint:month-arithmetic` (628 files), `lint:destructive` (7/7),
`lint:sandbox` (24), `lint:apostrophes` (0 baselined) all pass, and **0 live sites are hidden** (measured,
below).

---

### 3 · the 4th `\r` site is `check-audit-closure` itself; 30 sites → `split(/\r?\n/)` — **CLOSED**

**Reproduced, both directions, with the parsers lifted verbatim:**

```
b03e0d3  split(/\r?\n/)   LF   :  [D37] findings=117 high+=55   P6.8 findings=170 high+=87
b03e0d3  split(/\r?\n/)   CRLF :  [D37] findings=117 high+=55   P6.8 findings=170 high+=87
2b10a6c  split('\n')      LF   :  [D37] findings=117 high+=55   P6.8 findings=170 high+=87
2b10a6c  split('\n')      CRLF :  [D37] findings=  0 high+= 0   P6.8 findings=156 high+=78
```

Pass 1's finding reproduces exactly (117 → 0) and **is closed**: the CRLF corpus now parses identically to
the LF one.

**Was the sweep complete?** ✅ **Measured whole, not sampled.** Every `.split(` in `scripts/` — **59 call
sites**, listed in full — carries `/\r?\n/`, `sep`, `'.'`, `'|'`, `'/'`, `'\0'`, `/^---$/m` or `/\s+/`.
**There is no `split('\n')`, `split("\n")`, `split(/\n/)`, `split('\r\n')`, `endsWith('\n')` or `readLines`
left anywhere in `scripts/`, `apps/`, `packages/` or `.github/`** (`git grep`, whole result counted).

**Two remaining `$`-anchored sites checked individually, and both are safe:**

- `scripts/check-maestro-selectors.ts:100` — `raw.split(/^---$/m)` over the **raw** yaml. Safe, and for a
  reason worth writing down: **with the `m` flag, JS `$` matches before `\r` as well as `\n`** (`\r` is a
  LineTerminator), which is exactly why the *un*-flagged `/\/\/.*$/` failed and this does not. Measured on
  all **14** `.maestro` flows: doc-split and `yaml.load` step counts **identical under CRLF, 14/14, 0
  throws**.
- `scripts/coverage-model.ts:153` — over `split(/\r?\n/)` at `:150`. Unchanged since pass 1.

**Did the sweep break anything on an LF tree?** No — `'\n'` and `/\r?\n/` are identical over LF text, and I
ran six gates plus `npm run test:app` green. **Line-count preservation measured, not assumed:** over 621
TS/TSX files, `stripCommentsAndStrings` and `stripCommentsOnly` both produce **exactly** the raw file's
line count — **0 drifts** — so the `code[i] ?? ''` indexing in `check-destructive-writes.ts:134`,
`check-sandbox-writes.ts:124` and `check-apostrophes.ts:228` cannot silently yield `''`. Same for all 16
Swift files (0 mismatches).

---

### 4 · the `//`-inside-a-string truncation in three gates — **PARTIAL · major**

**Closed for the three named.** `check-destructive-writes.ts:126`, `check-sandbox-writes.ts:119` and
`check-apostrophes.ts:219` now call the scanner.

**Each of the four gates uses the RIGHT function — verified by measuring, not by reading the comment**
(attack point 2). Ground truth built with the TS parser, per line, over `apps/rn/src` (378 files):

| gate | function | ground-truth hits | gate hits | **HIDDEN** | **EXTRA** |
|---|---|---|---|---|---|
| `check-destructive-writes` (`importStore` identifier, code) | `stripCommentsAndStrings` ✅ | 10 | 10 | **0** | **0** |
| `check-sandbox-writes` (`from '…/appStore'`, a **string**) | `stripCommentsOnly` ✅ | 31 | 31 | **0** | **0** |
| `check-apostrophes` (Swift copy **inside** strings) | `stripCommentsOnly` ✅ | — | — | same hit list as the old per-line strip on all 16 files | — |
| `check-month-arithmetic` (`setMonth` etc., code) | own copy, blanks strings ✅ | 0 in `ROOTS` | 0 | **0** | **0** |

The `check-sandbox-writes` choice is the one that could have gone silently wrong — its `IMPORT` regex
(`:100`) matches a string literal — and the docstring at `:113-118` records that the wrong choice *was*
made first and was caught by `lint:rn`. **Confirmed correct as shipped.**

**But the remedy reached 3 of 9 strippers.** → **Job 2 finding 2.**

---

### 5 · `selfCheck()` proved `verdict()` throws but not that it is CALLED — **CLOSED**

**What the fix did.** `apps/rn/src/data/migrationAudit/audit.test.ts:187-192` reads `__filename` and
asserts `/\n\s*verdict\(rows, drift, byCause\.size\);/`.

**It runs.** `npm run test:app`, output line 1517:
`✓ self-check: the invariants fire (1 on a poisoned outcome), the verdict throws, and run() still calls it`
— so `__filename` resolves under `tsx` and the assertion passes.

**Attack point 8 — does it red on correct code? Measured: no.**

- **No prettier in this repo** — no dependency in either `package.json`, no `.prettierrc`, no
  `prettier.config.*`.
- **No line-length rule** — `npx eslint --print-config` on the file itself: `max-len: undefined`,
  `@stylistic/max-len: undefined`. Nothing will split the call across lines.
- A rename of `rows` / `drift` / `byCause` would red it falsely — but all three are locals of `run()` in
  the same 200-line file, and the thrown message names the exact expected text. `minor`.

**Is the disarm still one line? Measured: no, and this is the part I expected to file and could not.**

| disarm | caught by |
|---|---|
| delete the call | ✅ the new assertion |
| `// verdict(rows, …);` | ✅ the assertion — `\n\s*` cannot match `//` |
| `if (0) verdict(rows, …);` on one line | ✅ the assertion — the line no longer starts with `verdict` |
| **insert `return;` above the call** | ✅ **`no-unreachable`**, which `print-config` shows enabled at severity `1`, run as `eslint . --max-warnings=0` (`apps/rn/package.json:15`) — so a warning **fails `lint:rn`** |
| move it into a dead function | ✅ the compiler — `drift` and `byCause` are locals of `run()` |
| wrap in `if (process.env.X) { … }` on separate lines | ❌ — but that is two added lines and reads as deliberate |

**Verdict: CLOSED.** Pass 1's finding 5 is genuinely retired, and the one-line-disarm class with it. Stated
plainly so pass 3 does not re-file it: **I went looking for the "text is not execution" recurrence here and
the eslint interaction closes it.**

---

### 6 · invariant ⑨ was unreachable on all 554 cases — **CLOSED (reachability) · CLOSED-UNPINNED (⑨'s own deletion)**

**Reachability, measured by running the real doors over the real corpus** (`corpus.ts` → `importDoor` /
`webkitDoor` → `priorityGoalIsCapped`):

```
cases: 542   invariants: 9
outcomes=1084  withStore=1084  goalsIsArray=1084
goal rows reaching `priority === true`  : 1010     (was 0 at 2b10a6c)
...and past the undefined/null guard    : 1008
...and violating (pace not > 0)         : 0
pace values seen on priority goals: [["150 (number)",1006],["undefined",2],["99 (number)",2]]
```

**0 → 1,008 evaluations of ⑨'s actual predicate.** Finding 6's core complaint is closed: the rule is no
longer a judgement with no input. `npm run test:app` confirms `542 cases × 2 doors, 1084 outcomes, 9
invariants each` and `✓ the healthy control survives both doors with its income intact`.

**Attack point 5 — did the second goal change what the other 520 cases test? Measured: no.**
`g2` carries `priorityPerPaycheck: 150`, a *positive* pace, so `migrations.ts:278`'s guard `continue`s and
the stand-down never touches it: **1,006 of 1,010 priority rows come out as `priority: true, pace: 150`**,
i.e. the healthy shape, unchanged case to case. `damageNested` still hits `[0]` for `['goals',
'targetAmount']` / `['goals','currentAmount']` — correct, because `[0]` is the emergency fund those two
fields belong to; the new pace axis is written as a **separate loop targeting `[1]` explicitly**
(`corpus.ts:200-213`), which is why it works. Case count 522 → 542 = exactly `DAMAGE_NAMES.length` (20). No
invariant reads a goal count. **Nothing was masked: 0 violations before and after.**

**Attack point 6 — the `migrations.ts` stand-down, every spelling traced through the real import door:**

| pace in | `priority` out | pace out | inv ⑨ | repair record |
|---|---|---|---|---|
| `-1` | **false** | deleted | – | `lost` · *"…could not be read, so it is no longer funded ahead of your debt"* |
| `0`, `-0` | false | deleted | – | same |
| `NaN`, `Infinity`, `-Infinity` | false | deleted | – | same |
| `null`, `"0"`, `"abc"`, `true`, `{}` | false | deleted | – | same |
| `"150"` | **true** | `150` | – | `recovered` · field `priorityPerPaycheck` *(B-1's rule preserved — a successful recovery does NOT stand the goal down)* |
| `1e12`, `0.0001` | true | kept | – | none *(the user's own number)* |
| `undefined` | true | absent | – | none *(deliberate — "fund it fully")* |

✅ **The repair record IS written for every newly-caught case.** ✅ **`typeof pace !== 'number'` is
belt-and-braces rather than load-bearing** — `repairMoneyFields` (`migrations.ts:215-221`) runs first over
`['targetAmount','currentAmount','priorityPerPaycheck']` and `readMoney` (`:56-65`) normalises every
non-finite and non-numeric value to a finite number before the loop sees it. ✅
`fundsAsSinkingFund` / `governed` still behaves for the second, `savings`-typed goal: it is governed, so
`priority` is set false and the sentence names the consequence.

**Is the fix pinned?** ✅ **Yes, and this is the link that matters.** Revert `pace > 0` to `!== 0` and the
corpus case `goals[1].priorityPerPaycheck:negative` emerges as `priority: true, priorityPerPaycheck: -1`;
`priorityGoalIsCapped` run directly on that outcome returns
`VIOLATION: goals[0] is priority with priorityPerPaycheck -1 — reads as UNCAPPED`, `rows` becomes
non-empty, and `verdict()` throws. **Inverting ⑨'s `!(pace > 0)` now also reds**, on all 1,006 healthy
rows — which it could not do at `2b10a6c`.

⚠️ **Named residual, `CLOSED-UNPINNED` and deliberately NOT filed as a major.** **Deleting**
`priorityGoalIsCapped` from `INVARIANTS` (`invariants.ts:232-242`) still leaves everything green:
`INVARIANTS.length` is **printed** at `audit.test.ts:61` and `hostile.test.ts:81` and **asserted nowhere**
(`grep -rn INVARIANTS apps/rn/src` → 6 sites, all listed, none an assertion), and `selfCheck`'s poisoned
outcome carries `store: null`, so 8 of 9 invariants short-circuit and only `neverThrows` fires. **This is
true of 8 of the 9 invariants and of every gate in `scripts/`** — pass 1 recorded exactly that shape as
`CLOSED-UNPINNED` context rather than as nine separate majors, and filing it now would be padding.
The specific thing finding 6 filed — ⑨ evaluating nothing — is measured closed.

---

### 7 · `PENDING_DELETION` read four trees `gateSources.ts` did not fingerprint — **CLOSED**

`scripts/gateSources.ts:59-77` adds `app`, `components`, `lib`, `tests` to `ROOTS`.

**Measured, attack point 7:**

- **File count 689 → 789.** The four trees contribute **99 tracked source-extension files**
  (`app` 3 · `components` 37 · `lib` 29 · `tests` 30).
- **Nothing gitignored or generated is pulled in.** `git status --porcelain --ignored -- app components lib
  tests` returns **62** entries, **all `.png`** under `tests/visual/`, and `.png` is not in `SOURCE_EXT`.
  **Source-extension ignored files: 0.** `skipDir` already excludes `node_modules`, `dist`, `dist-embed`,
  `_site`, `test-results`, `playwright-report` and dot-directories, and none of the four roots contains any
  of them.
- **The fingerprint is stable.** The only `.json` under the four roots is
  `tests/e2e/fixtures/backup-import.json`, a committed fixture. `git status` on the four roots is empty.
- **`npm run lint:gate-freshness` runs green** — `the recorded pass still describes this tree (b03e0d3 ·
  789 source files)`.

⚠️ Not re-litigated: `gateSources.ts:16-21`'s "exclusion list, not inclusion list" standard is still
formally violated by `ROOTS` being an inclusion list. That was pass 1's framing of *why* the four trees
were missed; adding them fixes the instance, not the shape, and the file already documents the one
accepted residue (`docs/`). No new residue found.

---

### 8 · `corpus.ts`'s raw NUL byte escaped — **CLOSED, and the trap moved into the log**

`apps/rn/src/data/migrationAudit/corpus.ts` now holds **0 raw NUL bytes**; `grep -c priorityPerPaycheck`
returns **5** where pass 1 got a silent `0`. ✅

⛔ **But `docs/DEBT_ELEVATION_LOG.md` now holds one** — introduced by `b03e0d3` (`c8d54fa` 0 · `2b10a6c`
0 · `b03e0d3` **1**). It is at **`docs/DEBT_ELEVATION_LOG.md:580`**, and the line is:

> `  hostile unicode string; escaped as <U+0000>, identical at runtime, file is text again.`

The sentence announcing that the file is text again is written on the line that makes a *different* file
binary. `rg` on the log returns `binary file matches (found "\0" byte around offset 37065)` and **prints no
line** — so every future `rg`/`grep` over the project's ledger, which is also a `check-audit-closure`
`SOURCE`, silently loses 22,859 lines.

**Severity: `minor`, and stated as such deliberately.** Every gate reads it with `readFileSync` and is
unaffected — pass 1 rated the identical mechanism `minor` for exactly this reason, and rating it `major`
here would be inconsistent. It is the highest-value one-character fix in this report.

---

## Job 2 — sweep for blocker + major. **0 blockers · 3 majors**

### 1. `stripCode.ts` does not model regex literals, so the backtick runaway it was written to eliminate is still live — **major**

**User-facing consequence:** the gate that exists so a future month-step cannot ship a wrong debt-free date
still cannot see **6,966 characters of real code across 304 lines in 22 files** — including **1,454 chars of
`check-audit-closure.ts` and 1,719 of `surface-inventory.ts`** — so a `new Date(y, m + n, d.getDate())`
written on any of those lines is invisible and a user reads a wrong month on the debt-free hero, a chart
pill or a schedule row.

**Mechanism — three unmodelled constructs, each printed.** `scripts/lib/stripCode.ts:42-93` (and its copy
at `scripts/check-month-arithmetic.ts:177-224`) tracks comments, `'`, `"` and `` ` ``. It does **not** track
regex literals, so a quote or a backtick *inside a regex* opens a string.

**(a) a backtick in a regex opens a template literal that runs to the next backtick — across lines.** This
is the runaway the docstring at `check-month-arithmetic.ts:157-166` says is eliminated:

```
  117 RAW |    .replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, ' '))
  118 RAW |    .replace(/`[^`\n]*`/g, (m) => m.replace(/[^\n]/g, ' '));
  118 OUT |    .replace(/`  `\n]*`
  121 RAW |const explicit = new Set<string>();
  121 OUT |
  123 RAW |  for (const m of stripMarkdownCode(readFileSync(src, 'utf8')).matchAll(CLOSES)) {
  123 OUT |
```

`scripts/check-audit-closure.ts:118` opens it; **lines 118–197 are blanked.** Reproduced identically at
`scripts/surface-inventory.ts:143` (`` /`\$(?!\{)/ ``, lines 143–213),
`scripts/check-maestro-selectors.ts:83` (`` /`\$\{[^}]+\}\.\s*\$\{/ ``, lines 83–128),
`scripts/stamp-coverage.ts:246`, `scripts/check-local-dates.ts:79` (`` /new Date\(\s*[`'"]…/ ``, lines
79–106).

**(b) a quote in a regex blanks the rest of the line** — `apps/rn/src/hooks/spotlight.test.ts:68`:

```
   68 RAW |  const REGISTERED = [...sources.matchAll(/<TutorialTarget\b[^<]*?\sid="([^"]+)"/g)].map((m) => m[1]);
   68 OUT |  const REGISTERED = [...sources.matchAll(/<TutorialTarget\b[^<]*?\sid="   "]+)"
```

**(c) a regex ending in `\/` is read as the start of a `//` comment** —
`apps/rn/src/analytics/funnel.test.ts:67` and `apps/rn/src/hooks/spotlight.test.ts:63`:

```
   67 RAW |    src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
   67 OUT |    src.replace(/\/\*[\s\S]*?\*\
```

**And a fourth, in the opposite direction: 329 comment characters are left EXPOSED as code** —
`check-maestro-selectors.ts` (131), `coverage-model.ts` (92), `stamp-coverage.ts` (63),
`check-audit-closure.ts` (35), `strings-inventory.ts` (8) — because the desynchronised template state
swallows the `//`. That is the direction `lib/stripCode.ts:19-21` says must never happen (*"a guard that
reds on its own documentation gets deleted rather than obeyed"*). It reds nothing **today** (measured: 0
false positives), but the mechanism for it is live.

**Is anything hidden today? No — measured, whole corpus, no sampling.** Gate output vs a TypeScript-parser
ground truth, line by line: `check-month-arithmetic` **agree 0 · hidden 0 · extra 0** over its 624-file
`ROOTS` *(the only two live sites are in the legacy tree, correctly reported-not-failed)*;
`check-destructive-writes` **agree 10 · hidden 0 · extra 0**; `check-sandbox-writes` **agree 31 · hidden 0 ·
extra 0**. **A reach gap, not a live hole — the same standing on which M10, M11, E's finding 1b and pass 1's
findings 2 and 4 were each filed `major`.**

⚠️ **Also unchanged by the fix: 30,167 characters of template-EXPRESSION code are still blanked** (29,970
at `2b10a6c`, 292 before S0.2). `` `${new Date(y, m + 1, d.getDate())}` `` is not judged by the month gate,
and was before S0.2.

**Confidence:** measured four ways — all four strippers lifted from their own commits and run over one
shared corpus with one shared mask; every mechanism confirmed by printing the raw and stripped line; the
ground truth corrected twice before it was believed.

**Would anything catch it?** No. No test covers any of the four gates, and the direction is silence.

---

### 2. The `//`-in-a-string remedy reached **3 of 9** strippers, and the month gate holds a **copy** rather than the shared module — **major**

**User-facing consequence:** six gates — including the one that stops a calendar date being routed through
UTC and shown a day early in Sydney, and the one that stops a hand-rolled `$${…}` money render shipping —
still truncate a line at a `//` inside a string, so an offending site written on such a line is not
counted; and any future correction to `scripts/lib/stripCode.ts` will not reach `check-month-arithmetic`,
which holds its own copy.

**Mechanism.** There are **nine** comment strippers in `scripts/`, enumerated whole (`grep` for
`function strip|const stripComments|stripCommentsOnly|stripCommentsAndStrings`, every result counted):

| stripper | state at `b03e0d3` |
|---|---|
| `scripts/lib/stripCode.ts:26` / `:38` | ✅ the scanner |
| `check-destructive-writes.ts:37` | ✅ imports it |
| `check-sandbox-writes.ts:25` | ✅ imports it |
| `check-apostrophes.ts:27` | ✅ imports it |
| `check-month-arithmetic.ts:177` | ⚠️ **a hand-duplicated copy of the scanner** — 47 lines, not an import |
| `check-local-dates.ts:57` | ⛔ `(^\|[^:])\/\/[^\n]*` |
| `check-glossary.ts:66` | ⛔ same |
| `check-press-opacity.ts:60` | ⛔ same |
| `check-native-a11y-props.ts:83` | ⛔ same |
| `check-money-format.ts:87` | ⛔ same |
| `check-copy-owners.ts:76` | ⛔ same |

All six ⛔ rows are `(^|[^:])\/\/[^\n]*` — **the `[^:]` `https://` patch that `lib/stripCode.ts:16-17`
explicitly calls out as inadequate** (*"it addressed the symptom in URLs and left every other string
open"*) — in the same commit that says so. Five of the six are registered gates in `run-gates.ts`;
`check-copy-owners` is `lint:copy-owners`.

**Measured, over the 517-file corpus those six actually walk** (`packages/core` + `apps/rn/src`), against
the TypeScript ground truth:

| gate | plain-code chars blanked | lines | files |
|---|---|---|---|
| `check-local-dates` · `check-glossary` · `check-press-opacity` · `check-native-a11y-props` · `check-money-format` | **16** | **2** | 2 |
| `check-copy-owners` | 0 *(it blanks to shorter text and is used with `.includes()`, not per line)* | 0 | 0 |

The two lines are `apps/rn/src/analytics/funnel.test.ts:67` and `apps/rn/src/hooks/spotlight.test.ts:63`,
both regex literals, and **neither carries any of the six gates' target classes — 0 live sites hidden.**

⚠️ **State the residual honestly: on their own corpus these six are far less blind than the shipped scanner
is on `scripts/` (16 chars vs 6,966).** The finding is not that they are catastrophic. It is that
**the class was declared closed and closed for one third of its members**, that the enumeration was
`grep`-able in ten seconds, and that this repo has now had an enumeration come up short **five** times —
`setMonth` spellings, `importStore` call shapes, `$-anchored` regexes, `\r` sites, and now strippers.
`check-glossary.ts:60-64` and `check-money-format.ts:82-86` each *document* the trade-off (*"over-stripping
can only cause a MISS, never a false alarm"*) — a documented miss is still a miss, and it is the exact
sentence M10 was filed against.

**Confidence:** measured — every stripper lifted from its own file at runtime and run over the corpus its
gate walks; all six verified to preserve file length exactly, so line indexing is sound.

**Would anything catch it?** No — no test covers any of the nine, and a fix to `lib/stripCode.ts` provably
cannot reach seven of them.

---

### 3. `stripMarkdownCode` is a spelling enumeration of "markdown code", and the gate's own error message prints a token in a spelling it does not recognise — **major**

**User-facing consequence:** a `[closes: ID]` token written inside an indented code block, a `~~~` fence or
a ``` ``…`` ``` double span — all of which are markdown **code** by the convention this gate documents —
still mints a machine-checkable closure, so a real blocker or major finding reads as closed to the
instrument that decides P6.8.9's exit criterion; and because `.11.19` is chartered to *"delete the cap and
require the token"*, the terminal state arrives over findings nobody examined.

**Mechanism.** `scripts/check-audit-closure.ts:115-119` blanks exactly two shapes: ` ``` ` fences and
`` `…` `` single-backtick spans. Its docstring (`:110-113`) states the rule as *"anything inside markdown
code — a fenced block or an inline span — is quoted, so it is an example and does not count."* Measured by
running the lifted function on each spelling:

| written as | markdown code? | `stripMarkdownCode` |
|---|---|---|
| plain text | no | **counts** ✅ correct |
| `` `[closes: A-2]` `` inline span | yes | blanked ✅ |
| ` ``` ` fence, with or without a language tag | yes | blanked ✅ |
| **`~~~` fence** | **yes** | ⛔ **counts** |
| **4-space-indented code block** | **yes** | ⛔ **counts** |
| ``` ``[closes: A-10]`` ``` double-backtick span | **yes** | ⛔ **counts** |
| HTML comment `<!-- … -->` | (invisible prose) | ⛔ counts |
| table cell · blockquote | no | counts — correct |

⚡ **And the trigger is mechanical rather than hypothetical: the gate itself prints the token indented.**
`check-audit-closure.ts:189-192` writes the remediation instruction as

```
  A mention is not a closure. Record it where the closure IS, with the explicit token:
      [closes: L0-1]
```

— six spaces of indent. This project pastes gate output into `DEBT_ELEVATION_LOG.md`, which **is** a
closure `SOURCE`. Paste that error verbatim, unfenced, and the id the gate happened to name is now
machine-checkably closed. **That is M12's shape a fifth time: the documentation of the instrument counted
as a use of it — this time produced by the instrument's own instruction.**

**Live exposure, measured in the two live sources:** `~~~` fences **0** · ``` ``double spans`` ``` **0** ·
**4-space-indented lines 133** (plan 31 · log 102). Many of those 133 are list continuations rather than
code blocks — **and the gate cannot tell the difference either, which is the finding.**

⚠️ **The opposite direction was also measured and it fails SAFE.** A real record can be hidden by a lone
backtick either side of it on one line, or by an odd ` ``` ` shifting the fence pairing — both were
reproduced. Hiding a real record *inflates* the untokenised count, which reds the `>` cap. Only the
admitting direction deflates it, and only the admitting direction is filed here.

**Confidence:** measured — 11 spellings run through the lifted `stripMarkdownCode`, both directions, plus
the live sources counted.

**Would anything catch it?** No. `grep -rn` for `check-audit-closure` across `scripts`, `apps`, `packages`,
`.github` and `package.json` returns 7 hits and **not one is a test** — unchanged from pass 1.

---

## Measured, and NOT a major — recorded so pass 3 does not re-open them

- **`selfCheck`'s source self-assertion is sound.** Job 1 · 5. No prettier, no `max-len`, and
  `no-unreachable` at `--max-warnings=0` closes the `return;` disarm. I went looking for the recurrence and
  it is not there.
- **Invariant ⑨ can still be deleted with the repo green.** Job 1 · 6. True of 8 of the 9 invariants and of
  every gate in `scripts/`; pass 1 recorded this shape as `CLOSED-UNPINNED` rather than as a finding, and
  so do I.
- **The stand-down's user-facing sentence for a NEGATIVE pace.** `-1` produces
  *"the per-paycheck amount could not be read"* — but `-1` was read perfectly well; only its *value* was
  nonsensical. **`minor`, because it is not reachable from the app:** `parseAmountField`
  (`packages/core/utils/amountField.ts:38-42`) returns `null` for zero or negative and `GoalSheet.tsx:102`
  refuses on `null`, so only a hand-edited or third-party backup can carry it — and the half of the
  sentence that describes the *consequence* (*"no longer funded ahead of your debt"*) is true.
- **`priorityPerPaycheck: 1e12` survives as an effectively-uncapped pace.** Not a defect: it is a positive
  finite number the user's own field could hold, and every money field has the same property.
- **`docs/DEBT_ELEVATION_LOG.md:580`'s raw NUL.** Job 1 · 8. `minor` — no gate is affected.
- **`check-audit-closure.ts:92-93` still overclaims** (*"A NEW finding that lands without a token reds
  immediately"* — it does not; the check is `>` against a cap). Pass 1's `minor`, unchanged, and now with
  **zero** slack rather than 2 and 1, since both caps sit at the true totals.

---

## Swept and found clean — at the blocker/major bar

⛔ **This is pass 1's list PLUS what pass 2 added.** Pass 1's entries are carried forward unchanged unless
`b03e0d3` edited the file, in which case the changed part was re-checked and is re-listed here.

### Carried forward from pass 1 (not re-walked)

`MAX_UNTOKENISED`'s derivation · `check-month-arithmetic`'s ban correctness (17 synthetic cases,
`dateArgs` depth tracking, `EXEMPT`, the 5 spellings) · `PENDING_DELETION`'s self-retiring `existsSync` ·
`ROOTS` coverage and the `apps/rn/core` symlink · `run-gates.ts`'s 23-gate registry · `HOSTILE_FLOOR = 32`
and its `assert` · `doors.ts` driving the real exported functions · `check-sandbox-writes`'s `IMPORT`
shape-enumeration residual (`minor`) and its `0 stale` sweep · `invariants.ts` ⑨'s predicate against all
three consumers of `priorityPerPaycheck` · the "538 log lines rescued 0 ids" non-regression.
Also everything on `.11.17`'s clean lists in `E-gates-instruments.md` and `C-import-bridge-backup.md`.

### Added by pass 2

**Instruments — run on this tree**

- `npm run lint:closure` — green; **`0 carry an explicit token`**, caps `55 of 55` and `48 of 48`.
- `npm run lint:month-arithmetic` — green; **628 files** (627 + `lib/stripCode.ts`); legacy tree reports
  the same 2 sites, not failed.
- `npm run lint:destructive` — green, `7/7 importStore sites sanctioned across 6 files`.
- `npm run lint:sandbox` — green, `24 sanctioned appStore consumers`.
- `npm run lint:apostrophes` — green, `0 baselined`.
- `npm run lint:gate-freshness` — green, `b03e0d3 · 789 source files`.
- `npm run test:app` — green; `542 cases × 2 doors, 1084 outcomes, 9 invariants each` · `0 disagreed` ·
  `✓ the healthy control survives both doors with its income intact` · `32/32 file · 32/32 webkit` ·
  `✓ self-check: … and run() still calls it` (output line 1517).

**The scanner, `scripts/lib/stripCode.ts` — everything except the regex-literal class**

- **Comment blanking is total: `0` comment characters left exposed** across 378 `apps/rn/src` files in
  both modes. *(The 329 exposures in Job 2 finding 1 are all in `scripts/`, all downstream of a regex
  runaway.)*
- **Line count and line length are preserved exactly** — 621 TS/TSX files and 16 Swift files, **0 drifts**,
  in both modes. The `code[i] ?? ''` indexing in all four gates is therefore sound.
- **`'` and `"` cannot cross a newline** (`stripCode.ts:81`) — verified, so a JSX apostrophe or an
  unterminated string damages at most one line. **0 plain-code characters lost to a JSX apostrophe anywhere
  in `apps/rn/src`** — and the reason is a pleasing interaction: `check-apostrophes` has driven straight
  apostrophes out of copy, and `’` is not a delimiter.
- **An unterminated string at EOF** blanks to EOF and stops. **A `<!--` in a `.tsx`** is inert to the
  scanner (it is not `//` or `/*`). **A comment inside a template expression** is blanked with the literal
  — under-reach, not code loss.
- **Nested template literals desynchronise the scanner** (`apps/rn/src/app/(tabs)/progress.tsx:229`,
  `scripts/stamp-coverage.ts:246`) — measured, and the desync **re-synchronises within the line** in every
  live instance; net plain-code loss from it across `apps/rn/src` is **0**.

**Each gate uses the right stripper — measured, not read**

- `check-destructive-writes` → `stripCommentsAndStrings`: **10 ground-truth hits, 10 gate hits, 0 hidden,
  0 extra.**
- `check-sandbox-writes` → `stripCommentsOnly`: **31 / 31 / 0 / 0.** The import PATH survives, which is the
  thing the wrong choice would have destroyed.
- `check-apostrophes` (Swift) → `stripCommentsOnly`: identical hit list to the old per-line strip on all
  **16** Swift files; **0 line-count mismatches**; **0 raw strings (`#"…"#`)** anywhere, so Swift's
  non-JS escaping rules never engage; **every file's backtick count is EVEN**, so Swift's escaped-keyword
  syntax cannot open a runaway; the 4 files with `/* … */` show no divergence.
- `check-month-arithmetic` → its own scanner copy, blanks strings: correct choice, **0 hidden, 0 extra**
  over 624 files.

**The `\r?\n` sweep**

- **Complete for `scripts/`, counted whole:** all **59** `.split(` sites listed and classified; **0**
  remaining `split('\n')` / `split("\n")` / `split(/\n/)` / `split('\r\n')` / `endsWith('\n')` /
  `readLines` in `scripts`, `apps`, `packages` or `.github`.
- **`check-audit-closure` under CRLF: 117 findings / 55 high+ and 170 / 87 — identical to LF.**
- **`check-maestro-selectors.ts:100`'s `/^---$/m` is CRLF-safe** — because JS treats `\r` as a
  LineTerminator under the `m` flag. Measured on 14/14 flows: same doc split, same `yaml.load` step counts,
  0 throws.
- **No gate behaves differently on an LF tree**, by construction and by six green runs.

**`gateSources.ts` after the four new roots**

- 689 → **789** files; +99 tracked source files; **0** ignored or generated files pulled in (the 62 ignored
  entries under the new roots are all `.png`); the only `.json` is a committed fixture; freshness green and
  the fingerprint stable.

**`corpus.ts` / `migrations.ts` / `invariants.ts`**

- **The second goal did not change what the other 520 cases test**: 1,006 of 1,010 priority rows come out
  in the healthy shape (`priority: true, pace: 150`); `damageNested`'s `[0]`-only behaviour is still
  correct for `['goals','targetAmount']` / `['goals','currentAmount']`; the pace axis is a separate loop
  targeting `[1]`; 522 + 20 = 542 exactly; **0 violations before and after**, nothing masked.
- **`control:healthy` still asserts what it should** — both doors produce a store and
  `paycheck.amount === '2100'` (`audit.test.ts:68-71`).
- **Every pace spelling traced end-to-end through the real import door** — 15 values, table above. The
  repair record is written in every newly-caught case; `"150"` still recovers rather than standing the goal
  down; `fundsAsSinkingFund` still governs the second goal.
- **`corpus.ts` is text to `grep` again** — 0 raw NULs, `grep -c priorityPerPaycheck` returns 5.

---

## Could not determine

- **Whether the fixed `stripCode` scanner would blank a live `setMonth` site under some future edit.**
  I measured the present tree: 0 hidden. The 304 blanked lines are a standing invitation, not a live hole,
  and only writing code on one of them would settle it.
- **Whether any recorded green in `gate-status.json`'s history came from a CRLF tree.** Pass 1 could not
  settle this either; the fix makes it moot going forward.
- **Whether the six unconverted strippers hide anything on a CRLF checkout.** Their regexes are
  whole-file `[^\n]*` forms rather than `.*$`, so they do not carry the `\r` class — but I measured them on
  the LF tree only.
- **Whether `.11.19`'s hand-written tokens will land in a spelling `stripMarkdownCode` recognises.** That
  is a convention decision for whoever writes them, not something the code can settle — but the gate's own
  error message currently prints one that it would not recognise.
