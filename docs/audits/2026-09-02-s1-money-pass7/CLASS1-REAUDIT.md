# Class 1 re-audit — fresh auditor, 2026-09-02

Target tree: `v1.7-dev` @ `6cf2ac6a`, clean at start and clean at finish. Under audit:
`5af743b7..HEAD` (`150f8518`, `46d5ca99`, `6cf2ac6a`).

**Method.** Every verdict below was reached by **planting the original defect and reading the gate's
own summary line and exit code**. No verdict was reached by reading a diff. Every plant was restored
from a copy taken *after* the plant and verified with `cmp`; `git checkout --` was never used.
⚠️ `git status --porcelain` is clean at the end, and `cmp` against the `HEAD` blob is **not** a valid
restore check in this repo — `core.autocrlf=true`, so five of the touched files are CRLF in the
worktree and LF in the blob and will always "differ". The `cmp`-against-my-own-copy result is the one
that counts, and it passed on every file.

Probes written for this re-audit: `class1-reaudit-probes/`. `scripts/finding-guards.json` was never
written (verified byte-identical); `npm run prove:guards` was never run.

**Baseline restored and re-verified at the end** — `check-amount-collapse` 2 sites / 60,880 lines,
`check-rounding` 94 (cap 94), `check-sandbox-writes` 24 sanctioned, `check-fixture-dates` 0 imminent
/ 121 aged / 114 non-aging, `check-runner-completeness` 84·84 / 66·66 / 8·8, `check-finding-guards`
267 of 268, `test:wrap-escapes` 4/4, `test:app` exit 0.

---

## Part 1 — are the 11 actually closed?

| # | subject | verdict |
|---|---|---|
| D1-1 | `check-runner-completeness` · commented-out gate | **CLOSED** |
| D1-2 | `check-runner-completeness` · commented-out suite import | **CLOSED** |
| D1-3 | `check-amount-collapse` · wrapped collapse | **CLOSED** |
| D1-4 | `check-amount-collapse` · second site in an `ALLOWED` file | **CLOSED** (narrowed, not eliminated — R10) |
| D1-6 | `check-rounding` · wrapped `Math.round` | **CLOSED** |
| D1-7 | `check-fixture-dates` · wrapped fuse + variable-assigned fuse | **CLOSED** |
| D1-8 | `check-sandbox-writes` · wrapped import **or a namespace import** | **NOT CLOSED** — the namespace half still escapes |
| D1-9 | `check-finding-guards` · duplicate id under a 4-space indent | **CLOSED** (new sibling spelling open — R8) |
| D1-11 | `test:wrap-escapes` · proofs plant only the caught spelling | **CLOSED** for the 4 covered gates (R1, R14, R15) |
| C1-9 | `unreadInputsCopy.test.ts` · wrapped `again above` | **CLOSED** (sibling spelling open — R12) |
| C2-9 | `debtPrefill.test.ts` · ternary `useState(editing ? …)` | **CLOSED** (FP + FN open — R11) |

**10 closed · 1 not closed.**

### D1-1 — CLOSED

Plant: `scripts/run-gates.ts:42` `    'lint:money',` → `    // 'lint:money',`.

```
❌ runner completeness: 1 problem(s).
  • [lint:rn] 1 lint script(s) exist in package.json and are in NO chain:
          lint:money
EXIT=1
```
Baseline before the plant: exit 0, `✅ runner completeness: … 8 tracked · 8 wired`. Restore `cmp`
clean.

### D1-2 — CLOSED

Plant: `packages/core/testing/runRegressionTests.ts:6` → `// import "./testAbuseScenarios";`.

```
❌ runner completeness: 1 problem(s).
  • [test:regression] 1 tracked test file(s) are in the tree and in NO runner:
          packages/core/testing/testAbuseScenarios.ts
EXIT=1
```
Restore `cmp` clean.

### D1-3 — CLOSED

Plant appended to `apps/rn/src/utils/format.ts` (CRLF, matching the file):

```ts
const plantWrapped =
    parseAmountField(
      raw,
    ) ?? 0;
```
```
❌ amount-collapse: 1 problem(s).
  • apps/rn/src/utils/format.ts:70 collapses a parsed amount to 0.
EXIT=1
```

### D1-4 — CLOSED (but see R10)

Plant: a second `const plantedStored = parseAmountField(amount) ?? 0;` inserted at
`WindfallSheet.tsx:53`, the file that holds the one permitted predicate.

```
❌ amount-collapse: 1 problem(s).
  • apps/rn/src/components/plan/WindfallSheet.tsx has 2 collapse(s) and ALLOWED permits 1.
EXIT=1
```
The finding as reported — *a second collapse added to a permitted file is admitted silently* — is
refused. The permission is now count-granular rather than file-granular. It is still not
site-granular, and R10 measures what that admits.

### D1-6 — CLOSED

Plant appended to `format.ts` in the shape Prettier actually emits (trailing comma):

```ts
function plantRound(x: number) {
  return (
    Math.round(
      x * 100,
    ) / 100
  );
}
```
```
❌ rounding: 95 inline money-rounding expressions; the cap is 94 and it only goes DOWN.
EXIT=1
```
The D1-6 "secondary, read not planted" half — *two copies on one physical line count as one* — is
also closed: the planted run lists `guardianSelectors.ts` twice for two distinct expressions.

### D1-7 — CLOSED, both spellings, and on CRLF

| plant into `apps/rn/src/utils/format.test.ts` | result |
|---|---|
| A — wrapped `dueDate:` ⏎ `'2026-09-10',` | **exit 1** · `format.test.ts:64  dueDate: '2026-09-10'  — fires in 8 day(s)` |
| B — `const plantedDueDate = '2026-09-10';` then `{ dueDate: plantedDueDate }` | **exit 1** · `format.test.ts:63  plantedDueDate: '2026-09-10'  — fires in 8 day(s)` |
| A again, on a **CRLF** file (`apps/rn/src/data/cloudBackupMessages.test.ts`) | **exit 1** · `:176  dueDate: '2026-09-10'  — fires in 8 day(s)` |

Both are refused rather than filed under `non-aging`, which is the specific claim the finding made.

### D1-8 — **NOT CLOSED**

The finding's title names **two** escapes: *"a Prettier-wrapped `import {\n appStore,\n}` — **or a
namespace import** — leaks the real store past the guard."* One was fixed.

| plant prepended to `apps/rn/src/utils/format.ts` | `npx tsx scripts/check-sandbox-writes.ts` |
|---|---|
| A — `import {`⏎`  appStore,`⏎`} from '@/store/appStore';` | **exit 1** · `❌ lint:sandbox — 1 unsanctioned reference(s)… apps/rn/src/utils/format.ts:1` |
| **B — `import * as appStoreModule from '@/store/appStore';`** ⏎ `const leaked = appStoreModule.appStore;` | **exit 0** · `✅ lint:sandbox — 24 sanctioned appStore consumers, no unsanctioned ones.` |

The sanctioned count staying at **24** shows the file was walked and produced no match — the same
evidence the original finding used. `IMPORT` at `scripts/check-sandbox-writes.ts:108` is unchanged
from the reported version except for what it is tested against; the second pattern the finding's
remedy names (`import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]*appStore['"]`) was not added, and the
commit message does not claim it was. See R9.

### D1-9 — CLOSED

Registries regenerated by `class1-reaudit-probes/r-mkreg.py` (the fixer's `d1-probes/reg-*.json`
were not committed). Both hold 269 key lines parsing to 268 unique ids; the tracked registry was
never opened for writing.

| probe | result |
|---|---|
| `reg-indent2.json` | **exit 1** · `duplicate id(s) in the registry: S1P1-B1-OWNER — JSON.parse keeps only the LAST…` |
| **`reg-indent4.json`** | **exit 1** · same message, duplicate named |

The 4-space registry — silent under the old `\s{2}` anchor — now reds naming the duplicate. The
`\s+` false-positive hazard the remedy warned about did not materialise: nested `"at"`/`"find"`/
`"replace"` keys are not reported. A third spelling is open — R8.

### D1-11 — CLOSED for its four gates

Planted at the granularity that matters: **one** gate silently reverted to physical-line matching
while keeping the `logicalLines` import (so it stays in the derived population) and staying **green
on the clean tree**:

```ts
// scripts/check-sandbox-writes.ts:133, planted
for (const ll of stripCommentsOnly(source).split('\n').map((t, k) => ({ line: k + 1, text: t }))) {
```
```
npx tsx scripts/check-sandbox-writes.ts   → exit 0 ✅ 24 sanctioned appStore consumers
npx tsx scripts/test-wrap-escapes.ts      → exit 1
  ❌ check-sandbox-writes.ts      wrapped-plant=FAILED-OPEN · restored=YES
```
The harness catches a per-gate regression the gate's own run cannot show. Its chain membership is
itself guarded: deleting `'test:wrap-escapes',` from `run-gates.ts` reds `check-finding-guards`
(`S1P7-CLASS1-LOGICALJOIN — the guard is gone from scripts/run-gates.ts`). ⚠️ It is **not** caught by
`check-runner-completeness`, whose unchained sweep filters `n.startsWith('lint:')` and therefore
never considers a `test:` gate — measured, exit 0 with the line removed.

Three separate holes in the same instrument are R1, R14 and R15.

### C1-9 — CLOSED

Plant in `RequiredActionsCard.tsx:159`, the same site the finding used — the phrase split across a
source line break inside the template literal:

```
❌ App-layer regression run failed: Error: FAIL
   [apps/rn/src/components/plan/RequiredActionsCard.tsx: no refusal points "above" at a card that one tap removes]
EXIT=1
```
Baseline before and after: `✅ unread-inputs copy: 30 assertions passed`, `test:app` exit 0. R12 is
the spelling that still escapes.

### C2-9 — CLOSED

Plant B from the finding, inserted after `DebtSheet.tsx:162`:

```ts
const [plantB, setPlantB] = useState(editing ? String(editing.apr) : '');
```
```
❌ App-layer regression run failed: Error: FAIL
   [no useState in DebtSheet seeds from `editing` … (found 1) (expected 0, got 1)]
EXIT=1
```
R11 measures a false negative and a false positive in the widened pattern.

---

## Part 2 — the `MAX_INLINE_ROUNDING` 93 → 94 raise, verified independently

A downward-only ratchet was raised. The claim is that the instrument got sharper while the code did
not change. **The claim holds.** Verified without reusing the fixer's probe, by running a 2×2 over
the same population (`class1-reaudit-probes/r-rounding-delta.ts`):

```
A old-scan/old-regex (pre-fix instrument) = 93
B old-scan/new-regex (regex only)        = 93
C logical/old-regex  (scan only)         = 94
D logical/new-regex  (SHIPPED)           = 94

per-file A -> D differences:
  packages/core/testing/testFullAppRegression.ts: A=3 D=4 (+1)
```

Three independent confirmations:

1. **Exactly one site moved**, in exactly one file. Nothing was lost in the swap.
2. The new member is real and pre-existing — `packages/core/testing/testFullAppRegression.ts:58-60`,
   a tab-indented `Math.round(`⏎`  … * 100`⏎`) / 100`. It carries **no** trailing comma, so it was
   recovered by the logical-line change alone; the `,?` added **0** sites to the tree (row B = row A).
3. `git diff --stat 5af743b7..HEAD -- apps packages` touches only `debtPrefill.test.ts` and
   `unreadInputsCopy.test.ts`, +30/−2 lines, neither of which contains a `Math.round`. The fixer did
   not add the 94th copy and then raise the cap to cover it.

The raise is justified. `MIN_CAPS` 27 → 28 in `check-cap-literals` is the mechanical consequence of
adding `MAX_JOIN`, and is not a slackening.

---

# New findings created or left open by these fixes

## R1 — `major` · `test:wrap-escapes` never establishes a green baseline, so a gate that was ALREADY red scores `MATCHED` — the class guard is a pass that cannot fail

**Instrument-facing consequence.** The one instrument written to prove the class stays closed reports
`✅ … each red on the WRAPPED spelling of its own defect` and exits 0 over a gate that has been
reverted to the exact D1-8 defect. Every future pass reads that line as "class 1 is still closed".

**File and line.** `scripts/test-wrap-escapes.ts:139-145` — the verdict ladder — and `:70`, the
`reason` regex for `check-sandbox-writes`:

```ts
reason: /appStore|singleton|sanctioned/i,
…
if (!applied) verdict = 'PLANT-NOT-APPLIED';
else if (r.code === 0) verdict = 'FAILED-OPEN';
else if (!named) verdict = 'RED-FOR-THE-WRONG-REASON';
else verdict = 'MATCHED';
```
There is no run of the gate **before** the plant, so `r.code !== 0` cannot distinguish *"the plant
made it red"* from *"it was red already"*. `/appStore|singleton|sanctioned/i` matches the gate's own
success line (`24 **sanctioned** appStore consumers`) and its stale-entry message.

**The measurement.** Two variables, changed one at a time, then together.

| state of `scripts/check-sandbox-writes.ts` | gate itself | `npx tsx scripts/test-wrap-escapes.ts` |
|---|---|---|
| baseline | exit 0 · `✅ 24 sanctioned…` | exit 0 · `✅ check-sandbox-writes.ts wrapped-plant=MATCHED` |
| **un-fixed only** (per-physical-line loop, import kept) | exit 0 · `✅ 24 sanctioned…` | **exit 1** · `❌ … wrapped-plant=FAILED-OPEN` — correct |
| **stale `ALLOWED` entry only** (`'apps/rn/src/utils/format.ts'` added) | exit 1 · `❌ 1 STALE allow-list entr(y/ies)` | **exit 0** · `✅ … wrapped-plant=MATCHED` |
| **both** — un-fixed **and** red for the unrelated reason | exit 1 · stale-entry message | **exit 0** · `✅ wrap-escapes: 4 wrap-sensitive gate(s), each red on the WRAPPED spelling of its own defect.` |

The last row is the finding: `D1-8` is reopened in the tree, and the guard written for `D1-11` says
it is closed.

**Mechanism (HYPOTHESIS).** The 2×2 in `prove-guards.ts` runs a control; this harness copied the
plant/restore/verdict shape and dropped the control. The `reason` regexes were then written by
grepping the gate's failure text, and the sandbox gate's failure text and success text share their
vocabulary — nothing in the verdict ladder notices, because the ladder assumes a red run is caused by
the plant.

⚠️ The same exposure exists for `check-rounding`: its `reason` (`/inline money-rounding expressions/`)
appears in the gate's **✅ line as well as its ❌ line**, so any pre-existing red that quotes the count
would satisfy it. Not separately planted — the mechanism is the ladder, not the regex.

**Remedy — UNVERIFIED.** Run the gate before the plant and require `code === 0`; score
`ALREADY-RED` otherwise. And require the reason to match text that only a *failing* run emits — best
derived by diffing the pre-plant and post-plant output rather than by a regex someone chose.

## R2 — `major` · `logicalLines` joins every JSX `return (` and every function with a return-type annotation, so joins RUN AWAY to `MAX_JOIN` in the live population — including the exact site the docblock says it fixed

**Instrument-facing consequence.** `MAX_JOIN` is documented as *"a runaway stop, not a tuning dial"*
whose value *"sits above the measured maximum with headroom and is asserted by the self-test, which
fails if any join reaches it."* Four joins in the live population **reach it**. The stop is load-
bearing, not spare, and everything R3 and R4 measure follows from this.

**File and line.** `scripts/lib/logicalLines.ts:57-71` (the `MAX_JOIN` docblock) and `:78`:

```ts
const OPENS_BODY = /(?:\)|=>|\belse\b|\btry\b|\bdo\b|\bfinally\b)\s*\{$/;
```

Two shapes defeat it. `return (` opens a paren that only closes at the end of a JSX tree hundreds of
lines later, and no rule ends the join. And a TypeScript signature ending in a return-type
annotation — `export function selectTightTopUp(store: DebtStore): TightTopUp | null {` — does not end
in `)` `{`, so `OPENS_BODY` does not fire and the whole body joins.

**The measurement** (`class1-reaudit-probes/r-joins.ts`, `r-joins2.ts`, `r-unit.ts`):

| population | files | widest join | joins reaching `MAX_JOIN` (200) | joins > 40 |
|---|---|---|---|---|
| all tracked `*.ts`/`*.tsx` | 837 | **200** @ `apps/rn/src/components/payoff/TrajectoryChart.tsx:378` | **4** | 128 |
| `check-rounding`'s population | 627 | **200**, same file | **2** | 93 |
| `check-amount-collapse`'s population | 697 | **200**, same file | **4** | 100 |

The two runaways in the money population are:

```
RUNAWAY apps/rn/src/components/payoff/TrajectoryChart.tsx:378 span=200
RUNAWAY apps/rn/src/components/plan/PaydayGuardianCard.tsx:278 span=200
```

⚡ `PaydayGuardianCard.tsx:278` is the **exact line** the docblock cites as the runaway it fixed:
*"Putting `{` in `CONTINUES` for all statements re-opened the runaway at 330 lines in JSX — a defect
300 lines below `PaydayGuardianCard.tsx:278` would be reported at 278 … Scoping to the import
satisfies both."* It is still 278. The join is now truncated at 200 instead of 330 by the cap; the
runaway was capped, not closed. Both sites are `return (` at that line — confirmed by `sed -n 278p`
and `sed -n 378p` respectively (`    return (` in both).

The docblock's own measurement — *"the widest GENUINE join is 125 … only 11 joins exceed 40 and 1
exceeds 100"* — does not reproduce on any of the three populations above. The claimed self-test lives
in `class1-probes/p1-logical-lines.ts`, which is in `docs/`, is in no chain, and is therefore not a
standing assertion of anything.

**Mechanism (HYPOTHESIS).** `OPENS_BODY` was derived from the shapes that appeared in whatever the
first draft was measured against. `return (` is not a body opener by that rule and never can be — the
paren is a genuine grouping paren — so the only thing that ends a JSX return is the cap. The 695-file
figure in the docblock does not match any of the three populations these gates actually use (627,
697, 837), which is consistent with the measurement having been taken over a narrower set than the
gates read.

**Remedy — UNVERIFIED.** End a join at a line whose stripped text is `return (` (or, generally, when
the next line's first non-space character opens a JSX element), and add `\w\s*\{$`-style handling for
annotated signatures. Then assert the cap is unreached from **inside `lint:rn`**, not from a probe in
`docs/`. Not verified: tightening `OPENS_BODY` risks re-breaking `D1-8`'s wrapped import, which is
the failure the current shape was arrived at by.

## R3 — `major` · a hit inside a join is reported at the join's first line, so 17 of 94 live rounding sites print the wrong `path:line` — worst by 39 lines

**Instrument-facing consequence.** `logicalLines`' contract says the joined text is *"tagged with the
**first** physical line number, so a hit still reports the right `path:line`."* For 18% of the live
`lint:rounding` population that sentence is false. Somebody sent to `guardianSelectors.ts:480` to
remove a rounding copy finds a line with no `Math.round` on it.

**File and line.** `scripts/lib/logicalLines.ts:134` (`out.push({ line: start + 1, … })`) consumed at
`scripts/check-rounding.ts:88`, `check-amount-collapse.ts:87`, `check-sandbox-writes.ts:136`,
`check-fixture-dates.ts:158`.

**The measurement** (`class1-reaudit-probes/r-linedrift.ts`, over `check-rounding`'s exact
population and pattern):

```
rounding sites=94 · reported at the WRONG physical line=17 · worst drift=+39
  (apps/rn/src/store/guardianSelectors.ts reported:480 actual:519)
```

Corroborated independently by the planted D1-6 run, which printed `guardianSelectors.ts:361` **twice**
for expressions that `grep -n "Math.round"` places at physical lines **373 and 378**, and
`guardianSelectors.ts:296` for one at **302**.

**Mechanism (HYPOTHESIS).** The tag is correct for the model the helper documents — one wrapped
*statement* — and wrong for what it actually produces once R2's runaway is included, which is one
*block*. The two are the same object only while joins stay short.

**Remedy — UNVERIFIED.** Emit a per-line offset map alongside the joined text and derive the line
from the match index, the way `check-cap-literals` does over the whole file. Not verified: the joined
text is `parts.join(' ')`, so one character of the join does not correspond to one character of the
source once CRLF `\r`s are in the parts (see R2's sample output) — the map has to be built during the
walk, not reconstructed afterwards.

## R4 — `major` · joining removes the newline that bounded the pattern, so two unrelated correct statements are reported as one collapse — the exact false positive `D1-3`'s remedy was warned about

**Instrument-facing consequence.** `lint:amount-collapse` reds on honest code. The escape route it
offers is `ALLOWED`, so the pressure is to write a file-wide permission for a defect that is not
there — which then covers the real one when it arrives.

**File and line.** `scripts/check-amount-collapse.ts:44` and its new docblock at `:79-85`:

```ts
const COLLAPSE = /\b(parseAmountField|parseNonNegativeAmount|parseOptionalAmount)\s*\([^\n]*?\)\s*\?\?\s*0/;
```
> *"The regex is deliberately unchanged: a joined logical line contains no newline, so `[^\n]*?` still bounds it."*

That is backwards. `[^\n]*?` was bounded **by** the newline; joining deletes it, so the class now
spans everything inside a join.

**The measurement.** Plant into `apps/rn/src/components/plan/PaydayGuardianCard.tsx`, immediately
after `<Card testID="payday-guardian-card">` — two individually correct statements, five lines apart,
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
  • apps/rn/src/components/plan/PaydayGuardianCard.tsx:222 collapses a parsed amount to 0.
EXIT=1
```
Reported at **222** — `    return (` — which is **62 lines above** the planted code, so R3 compounds
it. Baseline before and after: exit 0, 2 sites. No such pair exists in the tree today, so this is
latent, not live.

D1-3's own remedy paragraph names this: *"the argument class must not be so permissive that it spans
past its own `)` into a later `?? 0` on an unrelated statement — the precise false-positive
`check-cap-literals.ts:74-77` records hitting on its first run."*

**Mechanism (HYPOTHESIS).** `[^\n]` and `[^;]` were doing two jobs — expressing the argument class,
and bounding the span — and only the first was noticed when the input changed from a physical line to
a join. `check-rounding`'s `[^;]*?` survives better only because a joined *statement* usually contains
one `;`; inside a JSX return (R2) it does not.

**Remedy — UNVERIFIED.** Bound the argument class structurally (balanced parens) rather than by a
character that the join no longer contains. Not verified, and it interacts with R2: while a join can
be a 200-line block, no character-class bound is safe.

## R5 — `major` · `blankStrings: true` blanks template-literal INTERPOLATIONS, which are code — a collapse and a rounding copy inside `${…}` were caught before the fix and are invisible after it

**Instrument-facing consequence.** Two money gates lost coverage of a construct they had. A
`${parseAmountField(raw) ?? 0}` inside a rendered string is exactly where a `$0.00` the user reads
comes from.

**File and line.** `scripts/check-amount-collapse.ts:86` and `scripts/check-rounding.ts:86`, both
`logicalLines(source, { blankStrings: true })`, resolving to `stripCommentsAndStrings`
(`scripts/lib/stripCode.ts:96-118`), which blanks everything between backticks including `${…}`.
Pre-fix, both gates read `stripCommentsOnly(...)` — string contents survived.

**The measurement.** One store, `apps/rn/src/utils/format.ts`; one plant carrying both defects:

```ts
export function plantTpl(raw: string, x: number) {
  return `${parseAmountField(raw) ?? 0} and ${Math.round(x * 100) / 100}`;
}
```

| | result |
|---|---|
| `npx tsx scripts/check-amount-collapse.ts` | **exit 0** · `✅ amount-collapse: 2 site(s) … 60883 lines read` |
| `npx tsx scripts/check-rounding.ts` | **exit 0** · `✅ rounding: 94 … (cap 94) … [read 52132 lines]` |

Both scan counts rose (60,880 → 60,883 and 52,129 → 52,132), so the lines were read and matched
nothing. Then, on the same planted file (`class1-reaudit-probes/r-prefix-vs-post.ts`):

```
apps/rn/src/utils/format.ts
  PRE-FIX  (stripCommentsOnly, per physical line): collapse=1 rounding=1
  SHIPPED  (logicalLines blankStrings:true)       : collapse=0 rounding=0
```

**No live site was lost** — the rounding 2×2 in Part 2 shows exactly one file moving, and upward. So
this is a latent regression, not a live one.

**Mechanism (HYPOTHESIS).** `blankStrings` was chosen so *"a banned form quoted inside a string is not
a hit"* — correct for a quoted example in a docblock, wrong for a template interpolation, which is
the one string form whose braces contain live code. `stripCode` does not distinguish them; its
header enumerates *"the three string forms"* as one construct.

**Remedy — UNVERIFIED.** Blank template *text* but not `${…}` bodies. Not verified: the scanner
tracks nesting by character and `${` re-enters code that may itself contain a template, so this is a
change to `stripCode`'s state machine, which four other gates depend on.

## R6 — `major` · a `fixture-date-ok:` exemption now silences every literal in the same joined logical line, so one exemption hides a live 21-day fuse and the gate prints `0 imminent fuses`

**Instrument-facing consequence.** This is the half of `lint:fixture-dates` described as *"always
fatal, never capped … the half that fires BEFORE the damage."* An exemption written honestly for one
literal now covers up to 199 physical lines of other literals, and the failure is announced as a
success.

**File and line.** `scripts/check-fixture-dates.ts:160`:

```ts
for (const ll of logicalLines(text, { keepComments: true })) {
  const line = ll.text;
  …
  // ⚠️ An exemption is per-line and must say why …
  if (/fixture-date-ok:/.test(line)) continue;
```
The comment still says *per-line*; `line` is now the join. An array literal is one join (`[` opens
depth), so the whole fixture list is one unit.

**The measurement.** One store, `apps/rn/src/utils/format.test.ts`; one variable, whether the first
element carries the exemption. Today is 2026-09-02; `'2026-09-10'` is 8 days out, inside
`IMMINENT_DAYS = 21`.

| appended | `npx tsx scripts/check-fixture-dates.ts` |
|---|---|
| **control** — the array, no comment | **exit 1** · `apps/rn/src/utils/format.test.ts:63  dueDate: '2026-09-10'  — fires in 8 day(s)` |
| **plant** — `// fixture-date-ok: the launch date is the subject of this test` appended to the FIRST element only | **exit 0** · `✅ fixture-dates: … · 0 imminent fuses · 121 aged … · 114 on non-aging fields.` |

```
const plantFixtures = [
  { dueDate: '2026-01-01' }, // fixture-date-ok: the launch date is the subject of this test
  { dueDate: '2026-09-10' },
];
```
The control proves the checker sees the subject in this file. Under the pre-fix per-physical-line
loop the second element was a separate line and would have been refused.

**Mechanism (HYPOTHESIS).** The exemption test and the literal scan were one loop over one physical
line, so "the line the exemption is on" and "the line the literal is on" were the same object by
construction. Changing the loop's unit silently widened the exemption's scope, because nothing in the
code names the exemption's intended scope independently of the loop.

**Remedy — UNVERIFIED.** Keep the exemption per **physical** line: resolve each match's own physical
line (which R3's offset map would also provide) and test `fixture-date-ok:` against that line only.
Not verified — it depends on R3 being fixed first, since the helper does not currently expose which
physical line a match came from.

## R7 — `minor` · `keepComments` plus joining lets a COMMENT supply the aging key for a literal on a later physical line

**Instrument-facing consequence.** A bare date string in an array — `non-aging` under the pre-fix
gate — is now refused as an imminent `dueDate` fuse because a comment two lines above ends with
`dueDate:`. A false red on a deterministic fixture is the failure `check-fixture-dates.ts:114-127`
records the first cut of this gate making.

**File and line.** `scripts/check-fixture-dates.ts:160` (`keepComments: true`) feeding `:164-166`
(`const before = line.slice(0, m.index); AGING_KEY.exec(before)`).

**The measurement.** Appended to `apps/rn/src/utils/format.test.ts`:

```ts
const plantStrings = [
  // the dueDate:
  '2026-09-10',
];
```
```
❌ fixture-dates: 1 calendar literal(s) cross into the past within 21 days.
  apps/rn/src/utils/format.test.ts:63  dueDate: '2026-09-10'  — fires in 8 day(s)
EXIT=1
```
No aging key exists in the code; the key came from a comment. (Separately verified as **not** a
regression: a date literal inside a plain comment was a hit before the fix too, because the pre-fix
loop also read raw text — `// … dueDate: '2026-09-10' …` reds identically. Only the *cross-line*
form is new.)

**Mechanism (HYPOTHESIS).** `keepComments` was added for one purpose — keeping the `fixture-date-ok:`
escape hatch visible — and its second effect, putting comment prose into the same string the aging-key
regex is anchored against, was not separated from it.

**Remedy — UNVERIFIED.** Decide the aging key on the **stripped** text at the literal's own physical
line while testing the exemption on the raw text (i.e. two different views, which the helper already
computes internally as `structure` and `visible`). Not verified against the 121 aged / 114 non-aging
baseline.

## R8 — `major` · `topLevelKeys` decodes JSON string escapes differently from `JSON.parse`, so a duplicate id spelled with `\uXXXX` is invisible — `D1-9`'s defect in a third spelling

**Instrument-facing consequence.** The duplicate-id detector exists because *"`JSON.parse` silently
keeps the LAST of any repeated id … one finding is silently untracked."* A duplicate that
`JSON.parse` collapses is still not reported, so a registered closure's guard can still be silently
overwritten while the ledger reads `CLOSED`.

**File and line.** `scripts/check-finding-guards.ts:254-259`:

```ts
} else if (c === '\\') {
  escaped = true;
} else if (c === '"') { … }
…
if (escaped) { escaped = false; current += c; }
```
`\uXXXX` yields the six characters `u`,`0`,`0`,`3`,`1` … not the code point. `\n` yields `n`, not a
newline. `JSON.parse` decodes all of them.

**The measurement.** A registry byte-identical to the two in `D1-9` except that the duplicate's second
character is written as a `\u` escape (`"S1P1-B1-OWNER"`), generated by
`class1-reaudit-probes/r-mkreg.py`. All three hold 269 key lines parsing to **268** unique ids.

| probe registry | `npx tsx scripts/check-finding-guards.ts --registry=…` |
|---|---|
| `reg-indent2.json` (control) | **exit 1** · `duplicate id(s) in the registry: S1P1-B1-OWNER` |
| `reg-indent4.json` (D1-9's own case) | **exit 1** · `duplicate id(s) in the registry: S1P1-B1-OWNER` |
| **`reg-unicode.json`** | **exit 0** · `✅ finding-guards: 267 of 268 findings carry a standing guard` — no duplicate mentioned |

The tracked `scripts/finding-guards.json` was not opened for writing; verified byte-identical to the
`HEAD` blob afterwards.

**Mechanism (HYPOTHESIS).** The scanner was written to find *where* the keys are (depth and quoting),
which it now does correctly, and its output is then compared *as strings* against what `JSON.parse`
produced. Two decoders for one fact — the shape this gate's own neighbours are ratcheting against.

**Remedy — UNVERIFIED.** Do not hand-decode: capture each key's raw span and run `JSON.parse` on the
quoted span (`JSON.parse('"' + span + '"')`) so exactly one decoder exists. Not verified against the
268-entry tracked registry.

## R9 — `major` · `lint:sandbox` still admits a namespace import of the singleton, which is half of `D1-8` as filed

**User-facing consequence.** The one the gate's header states: *"A component that reaches the
`appStore` singleton instead reads scripted money and mutates the user's REAL plan — silently … A user
edited an expense inside the demo from TestFlight and the write landed on their own plan."* The READ
half is not refused by `realWriteGuard`, so a demo component with a namespace import renders the real
user's balances.

**File and line.** `scripts/check-sandbox-writes.ts:108` — one pattern, named-import shaped:

```ts
const IMPORT = /^\s*import\s*\{[^}]*\bappStore\b[^}]*\}\s*from\s*['"][^'"]*appStore['"]/;
```

**The measurement.** See D1-8 above: plant B, `import * as appStoreModule from '@/store/appStore';`
plus `const leaked = appStoreModule.appStore;`, exit 0, sanctioned count unchanged at 24, with plant A
as the control proving the file is walked. Live instances: zero — the original finding's sweep found
none and nothing in the class-1 commits touched `apps/rn/src` other than two test files.

**Mechanism (HYPOTHESIS).** Class 1 was triaged as *one* mechanism ("laid out rather than what it
means"), and D1-8's namespace half is a different mechanism (a second *form*, not a second *layout*)
sharing a finding id. The fix addressed the class the triage named; the half that fell outside it went
with the id and was reported closed.

**Remedy — UNVERIFIED.** Add the second pattern the finding's remedy names,
`import\s+\*\s+as\s+\w+\s+from\s+['"][^'"]*appStore['"]`, and a `test:wrap-escapes`-style plant for
it. Not verified: the header records that any change to this gate's scanning path must be re-run
against the **stale-entry** check as well as the offender check.

## R10 — `major` · `ALLOWED`'s new per-file `sites` count is a ratchet against ADDITION only — substituting a dishonest collapse for the permitted honest one keeps the count at 1 and stays green

**Instrument-facing consequence.** `D1-4`'s stated defect — *"a genuinely dishonest collapse … added
anywhere in `WindfallSheet.tsx` … is admitted silently"* — is still reachable, in one extra edit. The
permission's written reason (*"consumed by `validAmount = n > 0` on the next line … Nothing stores `n`
while it is zero"*) is then a false statement about the site it is covering.

**File and line.** `scripts/check-amount-collapse.ts:53-66` (`ALLOWED` keyed by file, valued by a
count) and `:113-121` (`if (n > entry.sites)`).

**The measurement.** One store, `WindfallSheet.tsx`. One variable: whether the count stays at 1.

| state | gate |
|---|---|
| baseline | exit 0 · `✅ amount-collapse: 2 site(s) … 60880 lines read` |
| add a second collapse (D1-4's plant) | **exit 1** · `WindfallSheet.tsx has 2 collapse(s) and ALLOWED permits 1.` |
| **substitute** — `:52` `?? 0` → `?? -1`, plus `const storedDishonest = parseAmountField(amount) ?? 0;` at `:60`, stored and never compared to 0 | **exit 0** · `✅ amount-collapse: 2 site(s), all named with a reason (694 files, 60881 lines read)` |

The scan count 60,880 → 60,881 confirms the planted line was read.

**Mechanism (HYPOTHESIS).** The finding's remedy paragraph considered and rejected a per-line key
("the ledger churns on every unrelated edit above the site") and settled on a count. A count is
identity-free: it enforces *how many* the file may have, never *which*. The reasons in `ALLOWED` are
still line-specific prose enforced over a cardinality.

**Remedy — UNVERIFIED.** Key on a normalised source snippet of the permitted site — the option the
original finding names as *"a design decision, not a patch"* — so replacing the site invalidates the
permission. Not verified against the two live entries.

## R11 — `major` · `C2-9`'s widened pattern has both a measured false negative and a measured false positive, and the source is read with comments intact

**Instrument-facing consequence.** The cap-of-zero exists *"so a FUTURE field cannot slip through."*
One ordinary refactor slips through; and one ordinary explanatory comment reds correct code, whose
only fix is to delete the comment — *"a guard that reds on its own documentation gets deleted rather
than obeyed"* (`stripCode.ts` header).

**File and line.** `apps/rn/src/components/entities/debtPrefill.test.ts:152-153`:

```ts
const sheet = readFileSync(join(__dirname, 'DebtSheet.tsx'), 'utf8');
const fromEditing = sheet.match(/useState\([^;]*?\bediting\b/g) ?? [];
```
`readFileSync` raw — no `stripCommentsOnly`, in a class whose other two fixes (`D1-1`, `D1-2`) are
exactly "blank comments before matching".

**The measurements.** One store, `DebtSheet.tsx`. Runner `npm run test:app`. Baseline: 39 assertions,
`test:app` exit 0.

| plant | result |
|---|---|
| control (`useState(editing ? String(editing.apr) : '')`, from the finding) | **exit 1** · `FAIL [no useState in DebtSheet seeds from \`editing\` … (found 1) (expected 0, got 1)]` |
| **FALSE NEGATIVE** — the same defect, initialiser hoisted:<br>`const plantedInitialApr = editing ? String(editing.apr) : '';`<br>`const [plantC, setPlantC] = useState(plantedInitialApr);` | **exit 0** · `✓ no useState in DebtSheet seeds from \`editing\` … (found 0)` · `✅ bill → debt prefill: 39 assertions passed` |
| **FALSE POSITIVE** — correct code, `useState(` wrapped by Prettier with an explanatory comment inside:<br>`const [apr, setApr] = useState(`<br>`  // an editing debt reaches this through \`seed\`, never through the prop`<br>`  seed?.apr != null ? String(seed.apr) : '',`<br>`);` | **exit 1** · `FAIL [… (found 1) (expected 0, got 1)]` |

The false-positive row is the one that will be met first: it is what Prettier produces the moment that
initialiser grows, and this repo comments densely.

**Mechanism (HYPOTHESIS).** The widening moved the pattern from *shape* (`editing?.`) to *proximity*
(`editing` anywhere before the next `;`). Proximity is defeated by moving the expression out (false
negative) and satisfied by any prose in between (false positive). The docblock argues `[^;]*?` bounds
the match "to one statement" — true, and a statement now includes its comments.

**Remedy — UNVERIFIED.** Strip comments before matching (the class's own lesson), and assert on the
*initial values of the state hooks* rather than on the text between `useState(` and `editing` —
e.g. refuse any `useState` initialiser expression that references `editing`, resolved through local
`const` bindings. Not verified: resolving bindings is a parse, not a regex, and the file currently
takes neither.

## R12 — `major` · `C1-9`'s needle still misses the concatenated spelling — 30 assertions green over a card that renders "set it again above"

**User-facing consequence.** `S1.13.7.8`'s finding verbatim: a card telling the user to *"set it again
above"* about a card one "Got it" tap removes.

**File and line.** `apps/rn/src/components/plan/unreadInputsCopy.test.ts:59` (`.map((line) =>
line.trim())`) and `:156` (`code.includes('again above')`). Trimming fixes the wrap; it does not
normalise anything between the two words.

**The measurement.** One store, `RequiredActionsCard.tsx:159`. Controls are D1-9's/C1-9's own rows
above: the one-line spelling and the wrapped spelling both red.

| plant | `npm run test:app` |
|---|---|
| wrapped (the fixed case) | **exit 1** · `FAIL [RequiredActionsCard.tsx: no refusal points "above" …]` |
| **concatenated** — <code>… incomplete — set it again \` +</code><br><code>&nbsp;&nbsp;\`above.\`</code> | **exit 0** · `✅ unread-inputs copy: 30 assertions passed` · `✅ App-layer regression tests: ALL PASSED.` |

Assertion count identical in both directions — the "a check that cannot fail" signature.

**Mechanism (HYPOTHESIS).** The fix normalised the one whitespace artefact the finding exhibited
(leading indentation) rather than the property the assertion names (the *rendered* phrase). Anything
that lands between the two words — a quote, a `+`, a `{' '}` JSX separator — still defeats it.

**Remedy — UNVERIFIED.** Match `/again\W+above/i` over the joined code, or better, assert on the
*string the component renders* rather than on its source text. Not verified: the finding notes that
relaxing this needle changes what every other `includes` assertion in the file sees, and the rule is
plant once per claim.

## R13 — `major` · `check-runner-completeness` still decides chain membership with `String.includes` over the file text, so a gate deleted from `GATES` but named in any live string counts as chained

**Instrument-facing consequence.** The fix closed the *comment* spelling and the docblock claims the
stricter reading — *"a gate named only inside a docblock no longer counts as chained. That is the
correct reading — a mention is not an execution."* The mention/execution gap is only closed for
mentions in comments. `lint:money` can leave `lint:rn` entirely and the gate stays green.

**File and line.** `scripts/check-runner-completeness.ts:206` and `:207-211`:

```ts
const runGates = stripCommentsOnly(readFileSync(join(REPO_ROOT, 'scripts/run-gates.ts'), 'utf8'));
const unchained = Object.keys(pkg.scripts)
  .filter((n) => n.startsWith('lint:'))
  …
  .filter((n) => !runGates.includes(`'${n}'`));
```

**The measurement.** One store, `scripts/run-gates.ts`. Controls established above: the line deleted
reds, the line commented reds.

| state | `npx tsx scripts/check-runner-completeness.ts` |
|---|---|
| baseline | exit 0 · `✅ … 8 tracked · 8 wired` |
| `    'lint:money',` deleted from `GATES` (control, D1-1) | **exit 1** · `1 lint script(s) exist in package.json and are in NO chain: lint:money` |
| **plant** — deleted from `GATES` **and** `const PARKED_TEMPORARILY = ['lint:money'];` added above it | **exit 0** · `✅ runner completeness: … 8 tracked · 8 wired` |

`GATES` is documented at `run-gates.ts:28-30` as *"the only copy"*, so the gate genuinely does not run.
Parking a temporarily-disabled gate in a named list is an ordinary way to do this.

⚠️ **Related, measured, and worth knowing:** the unchained sweep filters `n.startsWith('lint:')`, so
`test:`-prefixed gates are outside it. Removing `'test:wrap-escapes',` from `GATES` leaves
`check-runner-completeness` at **exit 0** — it is caught instead by `check-finding-guards`
(`S1P7-CLASS1-LOGICALJOIN — the guard is gone from scripts/run-gates.ts`), i.e. by a registry token,
not by the runner-completeness instrument.

**Mechanism (HYPOTHESIS).** The remedy the finding offered had two halves — *"strip comments before
the membership test; **better**, parse `GATES` by evaluating/importing `run-gates.ts`'s array rather
than grepping it"* — and only the first was taken. The first is the cheap one and it addresses the
spelling that was reported.

**Remedy — UNVERIFIED.** `import('./run-gates.ts')` (or export `GATES`) and test membership of the
array. Not verified: importing `run-gates.ts` runs it unless the array is split into a module, which
is a small refactor of the chain runner.

## R14 — `major` · five of the eleven fixes carry no standing guard at all — `S1P7-CLASS1-LOGICALJOIN` names six findings and `test:wrap-escapes` covers four gates

**Instrument-facing consequence.** `D1-1`, `D1-2`, `D1-9`, `C1-9` and `C2-9` can be un-fixed and
nothing reds. `check-finding-guards` will keep printing `267 of 268 findings carry a standing guard`,
because these five are not entries in the registry — the count cannot show a finding that never
joined.

**File and line.** `scripts/finding-guards.json` → `S1P7-CLASS1-LOGICALJOIN.what` names
*"pass-7 D1-3 / D1-4 / D1-6 / D1-7 / D1-8 / D1-11 (6 majors, one mechanism)"* and its `unfix` is a
single edit to `scripts/lib/logicalLines.ts`. `scripts/test-wrap-escapes.ts:83-85` derives its
population as `scripts/check-*.ts` importing `./lib/logicalLines`.

**The measurement.**

```
grep -l "lib/logicalLines" scripts/*.ts
  check-amount-collapse.ts  check-cap-literals.ts  check-fixture-dates.ts  check-rounding.ts
  check-sandbox-writes.ts   check-scan-floors.ts   run-gates.ts            test-wrap-escapes.ts

npx tsx scripts/test-wrap-escapes.ts
  ✅ wrap-escapes: 4 wrap-sensitive gate(s) …          ← check-amount-collapse, check-fixture-dates,
                                                          check-rounding, check-sandbox-writes
grep -c logicalLines scripts/check-runner-completeness.ts  → 0
grep -c logicalLines scripts/check-finding-guards.ts       → 0
```
A registry scan for any entry naming `D1-1`, `D1-2`, `D1-9`, `C1-9`, `C2-9` or `logicalLines` returns
exactly two entries: `S1P6-D2-8-SCRIPTSRUNNER` (a pass-6 entry, different subject) and
`S1P7-CLASS1-LOGICALJOIN`.

The un-fixability is demonstrated by construction: the `topLevelKeys` un-fix (revert to
`/^\s{2}"([^"]+)":/gm`), the `codeLinesOnly` un-fix (delete `.map((line) => line.trim())`) and the
`stripCommentsOnly` un-fix in `check-runner-completeness` each restore the original defect, and no
registered proof, no `test:gate-plants` scenario and no `test:wrap-escapes` recipe exercises any of
them.

**Mechanism (HYPOTHESIS).** The class was guarded at the level the class was *named* — the shared
helper — and the five fixes that did not go through the helper fell outside the guard while being
reported inside the class. This is `D1-11`'s own mechanism one level up: the guard covers the members
the fix's mechanism already reached.

**Remedy — UNVERIFIED.** Register a guard per fixed matcher, not per mechanism: five entries with
`unfix` edits naming the exact reverted line, `run` pointing at `lint:runner-completeness`,
`lint:finding-guards` and `test:app`. Not verified: `MIN_ENTRIES` moves 268 → 273 and
`prove:guards` must execute five new proofs, which the ledger's `MAX_UNPROVEN`/never-executed
ratchets will move.

## R15 — `minor` · `test:wrap-escapes` can only ever detect the four fixed gates regressing, never the class recurring in a new gate

**Instrument-facing consequence.** The stated design is *"a new gate cannot join unproven."* What is
true is the converse: a new gate cannot join **unless it imports the helper**. A gate written the way
all six were — `for (const line of text.split('\n'))` — is not in the population, has no recipe, and
the harness stays green at 4. The recurrence shape this file was built for is the one it cannot see.

**File and line.** `scripts/test-wrap-escapes.ts:83-85`:

```ts
const wrapSensitive = readdirSync(SCRIPTS)
  .filter((f) => /^check-.*\.ts$/.test(f))
  .filter((f) => /from '\.\/lib\/logicalLines'/.test(readFileSync(join(SCRIPTS, f), 'utf8')));
```
Three independent narrowings: the `check-` prefix (excludes `test-*.ts` and anything outside
`scripts/`, e.g. the two `apps/rn/src/**` specs class 1 also fixed); the import; and the exact
single-quoted spelling of the path.

**The measurement.** `wrapSensitive.length` is **4** while class 1 fixed **8** distinct matchers.
Two known layout-sensitive gates sit outside it today: `check-runner-completeness.ts` (D1-1/D1-2, 0
occurrences of `logicalLines`) and `check-cap-literals.ts`, the gate that found the original `D5-9`
escape — it matches whole-file and so needs no helper, and is therefore certified by nothing here.
There is also no floor on `wrapSensitive.length`: the file exits 0 with any population size ≥ 0
provided no recipe is orphaned, which is pass-6 `D2-3`'s *"a check whose population can go quietly
empty"*. (Partial protection exists: an orphaned recipe is reported, so all four could not leave
silently in one edit.)

**Mechanism (HYPOTHESIS).** Deriving the population from an import is a real improvement over a typed
list, and it makes membership depend on having already adopted the fix. The property that actually
defines the population — *this gate matches source text with a regex* — is not what is being measured.

**Remedy — UNVERIFIED.** Derive the population from the property instead: every `scripts/check-*.ts`
(and every `*.test.ts` that reads source with `readFileSync`) that calls `.split('\n')` or
`.split(/\r?\n/)` on file text must either import the helper or carry a named exemption; and add a
`MIN` floor on the population. Not verified: `.split('\n')` has legitimate non-matching uses
(reading `git ls-files` output is one, in this very file) so the detector needs its own controls
before it can gate.

---

## Method notes

- Every plant was written with the target file's own line endings (five of the touched files are
  CRLF in the worktree, LF in the blob under `core.autocrlf=true`).
- Restores were taken from a copy made **after** the plant and verified with `cmp` against that copy;
  `git checkout --` was not used, and `git diff` was not treated as a restore check.
- `npx tsx <gate>` was invoked directly and its own exit code read (`echo EXIT=$?` immediately after),
  never a pipeline's; where output was filtered, `${PIPESTATUS[0]}` was read.
- `npm run prove:guards` was **not** run; `scripts/finding-guards.json` is byte-identical to `HEAD`.
- `scripts/run-gates.ts` was executed once by accident early on and produced no writes; all its
  effects were reverted and verified.
- Probes written: `class1-reaudit-probes/{r-rounding-delta,r-joins,r-joins2,r-linedrift,r-unit,
  r-prefix-vs-post}.ts` and `r-mkreg.py`. The three ~345 KB probe registries `r-mkreg.py` emits were
  deleted after use; re-run it to reproduce R8 and D1-9.
