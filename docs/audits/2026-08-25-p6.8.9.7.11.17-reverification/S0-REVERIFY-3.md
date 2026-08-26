# S0 re-verification, pass 3 — the instruments

**Pinned:** `1782769` *(P6.8.9.7.11.18 S0.10 — pass 2's three, and all three were the same mistake)*, branch `v1.7-dev`.
**Surface:** `scripts/check-*.ts`, `scripts/lib/stripCode.ts`, `scripts/gateSources.ts`, `scripts/run-gates.ts`,
`apps/rn/src/data/migrationAudit/*`.
**Bar:** blocker + major. `minor` appears only where I am recording that something measured is **not** a
major, so pass 4 does not re-open it.

> ⛔ **THE MEASUREMENT RULE, OBEYED.** Every number below is either a **gate verdict** — the set of
> `file:line` a gate's own pattern matches — or a character-level comparison against a **TypeScript-parser
> ground truth** with the known-and-intended classes (string bodies, regex bodies, template-expression
> code) excluded *by name* rather than counted. **No figure here is "characters blanked."** Three people
> in a row measured that, and all three were measuring the fix.
>
> The ground truth was proved non-trivial before it was believed (`scratchpad/s0p3/truthsanity.mjs`): it
> blanks line, block, **trailing** and **JSX** comments, string and template bodies and regex bodies, and
> leaves template-**expression** code standing.

---

## Result

**0 blockers · 0 majors.** Six `minor`s, each recorded with the measurement that keeps it minor.

---

## Job 1 — did pass 2's three close?

### 1 · `stripCode.ts` did not model regex literals — **CLOSED**, measured as a 3.5× improvement

`scripts/lib/stripCode.ts:135-162` adds the regex branch; `:65-67` `regexMayFollow`; `:69`
`KEYWORD_BEFORE_REGEX`; `:77-78` the `lastSignificant` state.

**The decisive test — does any gate's own pattern lose a line it used to match?** Every gate's hit set
computed twice over its own corpus, once with the **pre-diff** stripper lifted from `b03e0d3` and once with
the shipped one (`scratchpad/s0p3/gatehits.mjs`, `swift.mjs`):

| gate | old hits | new hits | **LOST** | **GAINED** |
|---|---|---|---|---|
| `check-month-arithmetic` (695 files) | 2 | 2 | **0** | **0** |
| `check-destructive-writes` (378) | 10 | 10 | **0** | **0** |
| `check-sandbox-writes` (378) | 31 | 31 | **0** | **0** |
| `check-local-dates` (587) | 42 | 42 | **0** | **0** |
| `check-glossary` (517) | 30 | 30 | **0** | **0** |
| `check-press-opacity` (378) | 0 | 0 | **0** | **0** |
| `check-native-a11y-props` (448) | 20 | 20 | **0** | **0** |
| `check-money-format` (517) | 20 | 20 | **0** | **0** |
| `check-copy-owners` (4 pairings) | 4/4 pass | 4/4 pass | **0** | **0** |
| `check-apostrophes` — Swift (16 files) | 1 | 1 | **0** | **0** |

**Not one gate's verdict moved.** `EXEMPT` lists were deliberately **not** applied — a superset can only
over-report a difference, never hide one. The Swift half is byte-identical: **0 changed lines in 16 files**.

**And against the parser, both scanners scored on the same corpus** (`scratchpad/s0p3/oldvsnew.mjs`, 626
files; the template-expression class excluded by name because both scanners blank it by design):

| | plain code wrongly blanked | over lines | comment chars wrongly exposed |
|---|---|---|---|
| **pre-diff `b03e0d3`** | 8,030 | 335 | 11,457 |
| **shipped `1782769`** | **2,314** | **108** | **869** |

⚡ **3.5× less blind and 13× less noisy.** Of the 2,314 residual, **2,230 chars are pre-existing** — the
nested-template desync pass 2 already recorded (`scripts/maestro-results.mjs` and friends). **The new
heuristic's own damage is 84 characters over 10 lines**, itemised as `minor` 1.

`stripCommentsOnly` is now **exactly right**: **0** plain-code characters lost anywhere in the 626-file
corpus, against the parser (`scratchpad/s0p3/scannervstruth-Only.txt`). Every one of the 30 lines it now
blanks that it used to leave standing is a **real comment**, and every one of the 5 lines it now leaves
standing that it used to blank is **real code** — printed and read one by one, not counted.

**Reach, measured** (`scratchpad/s0p3/regexreach.mjs`): of the **570** regex literals the TypeScript parser
finds in the corpus, the heuristic recognises **568**. The two it misses are
`scripts/strings-inventory.ts:167` (→ `minor` 2) and `scripts/stamp-coverage.ts:333` (the pre-existing
nested-template desync). Neither loses a gate a line.

---

### 2 · the remedy reached 3 of 9 strippers — **CLOSED**, and every variant verified by measurement

All nine now delegate. Verified in **code**, not in prose — the docblocks quote the retired pattern, which
is what produced the fixer's own false "all six unconverted" result:

```
$ grep -n "^const stripComments\|^function stripComments\|stripCommentsOnly(src)\|stripCommentsAndStrings(raw)" scripts/*.ts
```

`check-copy-owners.ts:78` · `check-glossary.ts:69-71` · `check-local-dates.ts:61-63` ·
`check-money-format.ts:91-93` · `check-native-a11y-props.ts:87-89` · `check-press-opacity.ts:65-67` all
call the shared module; `check-month-arithmetic.ts:175` calls `stripCommentsAndStrings` directly and its
68-line copy is gone; `check-destructive-writes.ts:37`, `check-sandbox-writes.ts:25`,
`check-apostrophes.ts:27` import it as before. **`(^|[^:])\/\/` survives in `scripts/` only inside
docblocks describing why it was retired.**

**Attack point 2 — is the variant right for each?** Measured by swapping each gate to the *other* variant
and diffing its hit set (`scratchpad/s0p3/variants.mjs`):

| gate | shipped | if given the wrong variant |
|---|---|---|
| `check-sandbox-writes` | `Only` | ⛔ **31 → 0. Totally blind** — the import PATH is a string |
| `check-local-dates` | `Only` | ⛔ **42 → 0. Totally blind** — the banned form lives in a string |
| `check-glossary` | `Only` | ⛔ **30 → 0. Totally blind** — it reads copy |
| `check-money-format` | `Only` | ⛔ **20 → 0. Totally blind** — `$${` is inside a template |
| `check-destructive-writes` | `AndStrings` | 1 **false** hit (`storeActions.test.ts:422`) |
| `check-copy-owners` | `Only` | ⛔ **a false RED** — see `minor` 4 |
| `check-month-arithmetic` | `AndStrings` | inert today (0 hits either way outside the legacy tree) |
| `check-press-opacity` · `check-native-a11y-props` | `Only` | inert today (0 lost, 0 gained) |
| `check-apostrophes` (Swift) | `Only` | it scans copy inside strings — `Only` is the only possible choice |

**All nine are correct.** Four would have gone *silently* blind on the wrong choice, and those four are the
ones the fixer got right.

**Which hit-lists did the fixer NOT re-measure?** His log table (`DEBT_ELEVATION_LOG.md:598+`) carries four
gate classes: `setMonth`, `new Date(`, `importStore`, `appStore` import path — i.e.
`check-month-arithmetic`, `check-local-dates`, `check-destructive-writes`, `check-sandbox-writes`. **Six
gates changed behaviour in this diff with no hit-list in the log:** the four newly-converted ones he did
not name (`check-glossary`, `check-money-format`, `check-press-opacity`, `check-native-a11y-props`),
`check-copy-owners`, and — the one that is easy to miss because the diff does not touch its file —
**`check-apostrophes`**, whose Swift half changed underneath it when the shared module gained the regex
branch. **All six measured above: 0 LOST, 0 GAINED.**

---

### 3 · `stripMarkdownCode` knew 1 of 4 spellings, and the gate printed a live token — **CLOSED**

`scripts/check-audit-closure.ts:124-135` now blanks ` ``` ` fences, `~~~` fences, four-space-indented
blocks and inline spans of **any** backtick run length. `:212` and `:279` print
`[closes: THE-ID-HERE]   (e.g. <real id>)`.

**Measured, 25 spellings through the lifted function** (`scratchpad/s0p3/markdown.mjs`):

| written as | verdict | correct? |
|---|---|---|
| plain text · a bullet · a 2- or 3-space nested bullet | **counts** | ✅ |
| table cell · blockquote prose · `<details>` body | **counts** | ✅ |
| inline span · double-backtick span · ` ``` ` fence · fence with a language tag · `~~~` fence · fence indented 1–3 spaces · 4-space-indented block | **blanked** | ✅ |
| **the D37 remediation exactly as printed** (6-space indent) | **blanked** | ✅ **the fix works** |
| blockquoted fence · HTML `<code>` · HTML `<pre>` · HTML comment · unclosed fence at EOF | counts | → `minor` 3 |
| **4+-space nested bullet** | blanked | → `minor` 3 (fails *safe*) |

**Attack point 5 — does `[closes: THE-ID-HERE]` register?** As the D37 branch prints it (six spaces of
indent) — **no, it is blanked.** Pasted un-indented it registers `THE-ID-HERE` in `explicit`, and that is
**inert**: `explicit` is read only as `explicit.has(id)` at `:189` and `:270` against real finding ids
(`grep -n explicit scripts/check-audit-closure.ts` → 6 sites, all listed). The one visible effect is the
printed `${explicit.size}` at `:219`. ⚠️ **The P6.8 branch at `:279` prints its remediation with only TWO
spaces of indent**, so *that* one would register if pasted — same inert consequence, and noted so the
asymmetry is not mistaken for coverage.

**Any other place the gate emits a live token?** `grep -n "closes:" scripts/*.ts` → 7 hits, all listed:
`:68` `:96` `:199` `:212` `:219` `:269` `:279`. The two remediation lines are the only emissions, and both
now carry the placeholder. The **real** id is printed outside the brackets (`(e.g. …)`) and at `:192`
`:205` `:276` — those feed the *mention* set, not the token set, which pass 1 already settled as the
weaker, deliberately-capped half.

**Live exposure of the residual spellings, counted in both SOURCES** (`scratchpad/s0p3/fences.mjs`):
`<code>` **0** · `<pre>` **0** · HTML comments **0** · blockquoted fences **0** · `~~~` fences **0** ·
unclosed fence at EOF **false** in both files. And the fence pairing was checked against a CommonMark-style
line state machine over all **24,110** lines of the two sources: **0 lines where the machine says "code"
and `stripMarkdownCode` says "prose."** The admitting direction has **no live foothold**.

---

## Job 2 — sweep for blocker + major. **0 blockers · 0 majors**

I went looking for the sixth short enumeration. The strongest candidate is `minor` 6, and it is a minor
because the class it appears to leave open is guarded one level down — measured, not assumed.

### `minor` 1 — the `}`/`>` mis-guess blanks real JSX, 84 characters over 10 lines

`regexMayFollow` (`stripCode.ts:66`) treats `}`, `>`, `+`, `-`, `*`, `<` as *regex may follow*. In JSX that
is wrong twice per line: `<Foo bar={x} />` and `</Text>` both put a `/` after one of those characters, and
when a second `/` appears later on the same line the scanner reads everything between as a regex body and
blanks it. **Measured, whole corpus, old-vs-new-vs-parser** (`scratchpad/s0p3/newonly.mjs`):

```
apps/rn/src/components/money/BillBreakdownSheet.tsx:84   ...{formatWhole(cat.perPaycheck)}/         /Text>
apps/rn/src/components/progress/CashFlowSection.tsx:80   ...<CushionBars … floor={floor} /                     />}</View>
apps/rn/src/app/more.tsx:377                             ...{APP_VERSION}</            />
```

**8 JSX lines (78 chars) + 2 `.cjs` shebangs (`#!/usr/bin/env node` → `#!/   /bin/env node`, 6 chars).**

**Why this is not a major:** the same measurement shows the change is a **3.5× net improvement** (8,030 →
2,314 plain-code chars lost), **no gate's hit set moves** (table in Job 1 · 1), and `apps/rn/src` — where
all 8 JSX lines live — is walked with `stripCommentsAndStrings` by exactly two gates, neither of whose
target classes (`importStore`, `setMonth`/`new Date(y, m±n, d.getDate())`) can plausibly be written inside
a JSX closing tag. Pass 2 filed the regex gap `major` at **6,966 chars over 304 lines**; this is **1.2% of
that**, in the opposite direction of travel. Filing it `major` would be manufacturing one.

⚠️ **Recorded because it is the one direction that grew**, and because `stripCode.ts:21-22` names JSX text
as unmodelled without saying that it also *damages* it.

### `minor` 2 — `KEYWORD_BEFORE_REGEX` is dead code

`stripCode.ts:135` tests `KEYWORD_BEFORE_REGEX` against `src.slice(i - 12, i)` with the pattern
`` /\b(return|typeof|…)$/ ``. The slice ends at the `/`, so for the normal spelling `return /re/` it ends
**with a space** and the `$` anchor cannot match. Measured directly (`scratchpad/s0p3/keyword.mjs`):

```
slice before the "/" of "return /"    = "return "    -> keyword branch fires: false
slice before the "/" of "return/"     = "return"     -> keyword branch fires: true
slice before the "/" of "typeof /"    = "typeof "    -> keyword branch fires: false
```

**Decisive test — neuter the branch entirely and re-strip the corpus: `0 of 626` files change output.**
The keyword set has never once decided anything.

**Live consequence: one regex literal.** `scripts/strings-inventory.ts:167` —
`return /^[a-z][a-z0-9]*([-_][a-z0-9]+)+$/.test(t);` — is not recognised, so its body is left as code. Its
body contains no quote or backtick, so the runaway does not open; `check-month-arithmetic` scans that file
and its hit list is unchanged. **1 of 570 regex literals, inert.** The fix is one character
(`` /…)\s*$/ ``), and it is worth taking because the *class* it guards — a regex after a keyword — is the
one where a backtick would reopen the exact runaway `S0.8b` was written to kill.

**Why not a major:** 569 of 570 regexes are recognised without it, the single miss carries no quote or
backtick, and no gate's hit list moves.

### `minor` 3 — `stripMarkdownCode` is still an enumeration, and it is now short by four

Still admitted as prose: a **blockquoted fence** (`> ``` ` — the `^[ \t]*` prefix does not allow `>`),
**HTML `<code>`**, **HTML `<pre>`**, an **HTML comment**, and everything after an **unclosed fence at
EOF**. Live exposure in both SOURCES: **0 of each** (counted above). The **hiding** direction is live —
**133 lines** blanked across the two sources (plan 31 · log 102), 79 of them ordinary 4+-indented nested
bullets such as `DEBT_ELEVATION_LOG.md:9067-9074` — and it **fails safe**: hiding a real record inflates
the untokenised count, which reds a `>` cap sitting at the true total. Verified end-to-end: `npm run
lint:closure` is green with `55 of 55`, `48 of 48`, `0 carry an explicit token`.

⚠️ **The live risk is `.11.19`'s, and it is a convention risk, not a code one:** a token written on a
4+-indented nested bullet — a shape this log uses 79 times — will be blanked, and the author will be told
to record a closure they already recorded. Loud, not silent.

### `minor` 4 — `check-copy-owners` has the right variant for the wrong stated reason, and it is the one gate whose polarity is inverted

`check-copy-owners.ts:74-78` says *"`stripCommentsOnly`, because this gate reads copy INSIDE the strings."*
**It does not.** It asserts that a file still *reads a constant* (`PRIVACY_CLAIM.atEntry`) — a code
expression — via `src.includes(owner)`. The sentence is carried over from the five gates that genuinely do
read copy.

⚡ **And the variant is nonetheless correct, for a reason worth writing down.** Measured
(`scratchpad/s0p3/copyowners.mjs`): `WelcomeStep.tsx:32` reads the owner inside a **template-literal
expression** — `` body: `No account needed — and ${PRIVACY_CLAIM.noSelling}.` `` — which
`stripCommentsAndStrings` blanks (the known template-expression class). Choosing it would have turned
`lint:copy-owners` **red on a correctly-wired site**. Shipped: 4/4 pairings pass, and the *documented*
attack is closed:

```
PLANT (owner only in a COMMENT — the attack the docstring names):  gate PASSES: false ✅
PLANT (owner only in a STRING, code usage deleted):                gate PASSES: true  ⚠️
```

**The residual:** this is the only *must-contain* gate in the set, so the shared module's asymmetry rule
(*"blind is worse, so leave the text alone"*) is **backwards for it** — leaving more text in makes it
easier to pass. **Not a major:** no string literal in any of the four files contains an owner expression
(measured), and the realistic re-open — deleting the usage — still reds the gate.

### `minor` 5 — the pinned commit ships a `gate-status.json` that describes the *previous* tree

`git show 1782769:gate-status.json` records `sha b03e0d3` · `sourceHash eb0ca0c9…` · `dirty: false`, while
`1782769` itself changed **nine files under `scripts/`**, which `gateSources.ts:55` fingerprints.
`gate-status.json` is not itself fingerprinted (`gateSources.ts:84` — *"the record this check writes"*) and
`docs/` is the accepted residue, so the working tree's source fingerprint **is** `1782769`'s: the running
gate reports `045a310…`. **`eb0ca0c9… ≠ 045a310…`, so `lint:gate-freshness` was RED at the pinned commit
as committed.** The in-flight run has since rewritten the record and the gate is green, twice in a row,
`789 source files`, with its own `dirty: true` caveat printed.

**Why this is not a major: the instrument did exactly what [D49] built it to do.** It is recorded so that
nobody reads `gate-status.json` at `1782769` and quotes a green over the nine-gate change.

### `minor` 6 — the migration-audit corpus draws its KEY axis from the artefact under test

Attack point 7, and the closest thing to a sixth short enumeration. `corpus.ts:177` builds every case from
`topKeys = [...V16_DIRECT_KEYS, ...V16_PAYCHECK_KEYS]`, and those two lists are byte-identical to
`mapLegacyStore.ts`'s own `DIRECT` and `PAYCHECK` tables. `damageKey` and `damageNested` mutate values;
neither ever introduces a key name. **So the corpus can only ever produce keys the mapper already knows.**

**Measured, by running the real `mapLegacyStore` over all 542 generated cases**
(`scratchpad/s0p3/buckets.mjs`):

```
cases=542   distinct legacy keys the corpus can produce: 17
buckets across the whole corpus:  mapped 8153 · dropped 0 · unknown 0 · unparseable 0 · quarantined 0
cases with a NON-EMPTY bucket:    mapped 542 · dropped 0 · unknown 0 · unparseable 0 · quarantined 0
```

Same for the hostile fixture: **32 cases, 15 distinct keys, all inside the mapper's tables, `unknown` 0.**

So invariant ② `nothingSilentlyDropped` (`invariants.ts:59-66`) is evaluated 542 times and **never once
sees a key in any bucket but `mapped`** — including `unknown`, which `mapLegacyStore.ts:19-21` calls *"the
dangerous one… loses data in exactly the way nobody notices."* The audit's own boast — *"the coverage is
not limited by what I happened to think of"* — is true of the damage axis and **false of the key axis**.

⛔ **And it is a `minor`, not a major, because the class is guarded one level down — measured, not
assumed.** `apps/rn/src/data/legacyBridge/mapLegacyStore.test.ts` covers all four buckets directly with
explicit assertions: `:114` an unrecognised key is reported (`unknown`), `:117-120` two deliberate drops
with reasons, `:136` an unparseable **mapped** value, `:144-152` a `__corrupt__` key carried to quarantine,
`:98-105` all three `darkMode` shapes, and `:209-223` the **real captured container's 22 keys** asserting
`ZERO unknown keys` and `mapped + dropped === 22`. The gap is that `mapLegacyStore.test.ts:204-206` hands
the *user-key* coverage job to 5.10 (*"Those are 5.10's job"*) and 5.10 does not do it — a comment pointing
at a harness that does not run that case.

**Attack point 7's question answered directly:** `importDoor` reports a store only when the real
`readBackup` returns `ok`; `webkitDoor` reports one only when the real `migrateFromLegacy` returns
`migrated && store`. Neither reconstructs the thing it audits. The one honest "success on an input it did
not process" shape — `migrated: true` with `mapped: []` — is **pinned against the healthy control**
(`audit.test.ts:68-71` asserts the store exists through *both* doors and that `paycheck.amount === '2100'`),
so a bridge that carried nothing reds the suite.

---

## Measured, and NOT a defect — recorded so pass 4 does not re-open them

- **`}` as *regex may follow*.** The docstring calls `({a:1}/x/g)` its known miss. Measured: that shape
  does not occur; the shape that does is JSX, and it costs 84 characters (`minor` 1). Division is safe —
  `a / b / c`, `arr[0] / arr[1] / 2`, `(a + b) / 2`, `c ? a : b / 2 / 3`, `{a:1}.a / 2 / 3` and
  `total/count` all survive intact (`scratchpad/s0p3/plants.mjs`, printed raw-vs-stripped).
- **`i++ / total / 2` IS mis-read** — `+` is in the set — and blanks `total`. **0 occurrences in the
  corpus**; recorded because it is the one non-JSX division shape the heuristic gets wrong.
- **A regex after `)` (`if (x) /re/.test(y)`) and after an ASI newline are not recognised.** Both resolve
  to *leave the text alone*, which is the safe direction; **0 occurrences** among the 570 literals.
- **The month gate lost 68 lines and nothing else went with them.** Attack point 3: `npm run
  lint:month-arithmetic` reports **628 files** and the identical legacy block —
  `components\AmortizationCalendar.tsx:24` and `components\Onboarding\FirstDebtOrBillStep.tsx:15`,
  *reported not failed* — exactly as at `b03e0d3`. Hit-set diff over 695 files: **2 → 2, 0 lost, 0
  gained.** The only behavioural difference between the deleted copy and the shared module is that the
  shared one preserves `\r` (`stripCode.ts:74`) where the copy blanked it — inert under `split(/\r?\n/)`,
  and strictly better under CRLF.
- **`explicit.size` at `:219` is a printed number, not a gate input.** A junk id can inflate it; nothing
  decides on it.
- **`gateSources.ts` was not touched by this diff** and its pass-2 clean verdict carries forward: `789
  source files`, freshness green on two consecutive no-op runs, fingerprint stable.
- **`run-gates.ts` was not touched**: 23 gates (1 eslint + 22 `lint:*`), and **all ten** strip-using gates
  are registered — `a11y-props`, `local-dates`, `month-arithmetic`, `glossary`, `money`, `apostrophes`,
  `destructive`, `sandbox`, `press-opacity`, `copy-owners`.
- **`npm run test:app` green**, unchanged from pass 2: `542 cases × 2 doors, 1084 outcomes, 9 invariants
  each` · `542 produced a store through BOTH doors, 0 disagreed` · `✓ the healthy control survives both
  doors with its income intact` · `32/32 file · 32/32 webkit · 0 refused by both` · `✓ self-check: … and
  run() still calls it`.
- **`docs/DEBT_ELEVATION_LOG.md`'s raw NUL is gone.** Pass 2's `minor` 8 — the log is greppable again
  (`fences.mjs` reads all 22,939 lines as text; `rg` no longer reports a binary match).

---

## Swept and found clean — at the blocker/major bar

⛔ **This is passes 1 + 2's list PLUS pass 3's.** Pass 1's and 2's entries are carried forward unchanged
**except where `1782769` edited the file** — nine gates plus `lib/stripCode.ts` — in which case the changed
part was re-measured and is re-listed here.

### Carried forward from pass 1 (not re-walked)

`MAX_UNTOKENISED`'s derivation · `check-month-arithmetic`'s ban correctness (17 synthetic cases,
`dateArgs` depth tracking, `EXEMPT`, the 5 spellings) · `PENDING_DELETION`'s self-retiring `existsSync` ·
`ROOTS` coverage and the `apps/rn/core` symlink · `run-gates.ts`'s 23-gate registry · `HOSTILE_FLOOR = 32`
and its `assert` · `doors.ts` driving the real exported functions · `check-sandbox-writes`'s `IMPORT`
shape-enumeration residual (`minor`) and its `0 stale` sweep · `invariants.ts` ⑨'s predicate against all
three consumers of `priorityPerPaycheck` · the "538 log lines rescued 0 ids" non-regression. Also
everything on `.11.17`'s clean lists in `E-gates-instruments.md` and `C-import-bridge-backup.md`.

### Carried forward from pass 2 (not re-walked, because `1782769` did not touch them)

`gateSources.ts` after the four new roots (689 → 789 files, +99 tracked, 0 ignored/generated pulled in, the
62 ignored entries all `.png`, the only `.json` a committed fixture) · the complete `\r?\n` sweep (59
`.split(` sites classified, 0 `split('\n')` left anywhere, `check-maestro-selectors.ts:100`'s `/^---$/m`
CRLF-safe on 14/14 flows) · `check-audit-closure` under CRLF (117/55 and 170/87, identical to LF) ·
`corpus.ts` free of raw NULs · the second goal not disturbing the other 520 cases · every pace spelling
traced end-to-end through the real import door · `control:healthy` asserting what it should ·
`selfCheck()`'s source self-assertion and the `no-unreachable` interaction that closes the one-line
disarm · invariant ⑨'s 1,008 live evaluations.

### Added by pass 3

**The scanner, re-measured because the file changed**

- **Every gate verdict is unchanged by the diff** — 10 gates, hit sets computed under both strippers,
  **0 LOST / 0 GAINED** (table in Job 1 · 1). This is the decisive test, and it is the whole answer.
- **Scored against the parser, the scanner improved 3.5× on blindness and 13× on noise** (8,030 → 2,314
  plain-code chars; 11,457 → 869 comment chars exposed), with the template-expression class excluded by
  name rather than counted.
- **`stripCommentsOnly` loses 0 plain-code characters** across 626 files. All 30 lines it newly blanks are
  real comments; all 5 it newly exposes are real code.
- **568 of 570 regex literals are recognised**; the 2 misses are named, and neither can open a runaway.
- **Division, JSX, ASI, shebangs, escaped `/`, quotes-inside-regexes and backticks-inside-regexes** all
  planted and printed raw-vs-stripped (`plants.mjs`); the only mis-guesses that survive are `minor` 1's.
- **Line count and line length are still preserved** — implicit in every measurement above, since all of
  them index by line and none reported a drift.

**The nine gates**

- **All nine delegate to `lib/stripCode.ts`**, verified in code rather than in the docblocks that quote
  the retired pattern. No hand-copy remains.
- **Every variant is correct, measured by swapping it**: four gates would go totally blind on
  `stripCommentsAndStrings` (sandbox 31→0, local-dates 42→0, glossary 30→0, money-format 20→0), one would
  false-red (`copy-owners`), one would gain a false hit (`destructive`), three are inert.
- **The six gates whose hit lists the fixer's log does not carry** were all measured: 0 LOST, 0 GAINED.
- **`check-month-arithmetic` is behaviourally identical** at `b03e0d3` and `1782769`: 628 files, same 2
  legacy sites reported-not-failed, same hit set.
- **The Swift half of `check-apostrophes` is byte-identical**: 16 files, 0 changed lines, 0 raw strings,
  0 odd backtick counts, 0 Swift regex literals.

**`check-audit-closure`**

- **25 markdown spellings run through the lifted `stripMarkdownCode`**, both directions; the four the fix
  targeted are closed, and the D37 remediation as actually printed is blanked.
- **Fence pairing agrees with a CommonMark state machine on 0 disagreements over 24,110 lines** of the two
  live sources; no unclosed fence at EOF in either.
- **The admitting spellings have zero live foothold**: 0 `<code>`, 0 `<pre>`, 0 HTML comments, 0
  blockquoted fences, 0 `~~~` fences in either source.
- **`explicit` is read only via `.has(realId)`** — 6 sites, all listed — so a placeholder id cannot change
  a verdict.
- **`npm run lint:closure` green**: `55 of 55`, `48 of 48`, `0 carry an explicit token`, `missing = 0`.

**Instruments — run on this tree**

`lint:month-arithmetic` · `lint:local-dates` · `lint:glossary` · `lint:money` · `lint:press-opacity` ·
`lint:a11y-props` · `lint:copy-owners` · `lint:closure` · `lint:destructive` · `lint:sandbox` ·
`lint:apostrophes` · `lint:gate-freshness` (×2) — **all twelve green**, plus `npm run test:app` green.

**The migration-audit layer**

- **`doors.ts` cannot report a store it did not get**: both doors return the real exported functions'
  results, and the healthy control asserts a live field through both.
- **`migrateFromLegacy`'s success path is honest** — `migrated: true` requires `report.store !== null` and
  a `runMigrations` that did not throw; every other exit returns `skipped(reason)` with the reason
  distinguishing *a conclusion* from *a failure to look* (`isConfirmedFreshInstall`).
- **The corpus's key universe is 17 keys and the hostile fixture's is 15**, both subsets of the mapper's
  own tables — recorded as `minor` 6, with `mapLegacyStore.test.ts`'s direct bucket coverage as the reason
  it is not a major.

---

## Could not determine

- **Whether a future edit will land a `setMonth` or an `importStore` on one of the 10 lines the JSX
  mis-guess blanks.** I measured the present tree: 0 hidden. Only writing code on one of those lines would
  settle it.
- **Whether `.11.19`'s hand-written tokens will land on 4+-indented bullets.** The gate cannot decide it;
  the convention can. It fails loud either way.
- **Whether a real v1.6 container holds a key outside `mapLegacyStore`'s tables.** The captured container
  says no for its 22 keys, and that container is the SIM_SMOKE seeder's. Only a second capture from a real
  user's device settles it, and nothing in this repo can produce one.
