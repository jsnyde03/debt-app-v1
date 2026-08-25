# S0 re-verification, pass 1 — the instruments

**Pinned:** `2b10a6c` *(P6.8.9.7.11.18 S0 — the instruments, and three defects found by fixing them)*, branch `v1.7-dev`.
**Surface:** `scripts/check-*.ts`, `scripts/run-gates.ts`, `apps/rn/src/data/migrationAudit/{invariants,audit.test,hostile.test,corpus}.ts`.
**Bar:** blocker + major only. `minor` is recorded only where it is the residual of a fix under judgement.

> ⛔ Every number below was produced by a probe in the scratchpad that reproduces the instrument's own
> parsers and regexes, or by running the gate. Nothing is taken from `DEBT_ELEVATION_LOG.md`.

---

## Job 1 — the six fixes, re-verified

### S0.1 · M12 — `check-audit-closure`: explicit `[closes: ID]` + downward-only caps — **CLOSED, but the new mechanism has already reproduced the defect it closed — see Job 2 finding 1**

**Is the original behaviour gone?** No, and by design — the file says so at `:90-94`: *"The token does not
replace the mention check — it RATCHETS it."* The mention check (`:141-145`, `:214-219`) is unchanged and
still what `exit(1)` turns on for `[D37]`. What is new is a second, stricter number.

**Are the caps true at `2b10a6c`?** ✅ **Reproduced.** `MAX_UNTOKENISED = { d37: 55, p68: 48 }`
(`scripts/check-audit-closure.ts:108`). My probe, running the gate's own parser and both of its regexes over
the same three `SOURCES`:

| | measured |
|---|---|
| `[D37]` high+ findings, unique | **55** · missing (untraceable) **0** |
| `[D37]` untokenised **if the token set were empty** | **55** — the cap exactly |
| P6.8 high+ | **87** · traced **48** |
| P6.8 untokenised **if the token set were empty** | **48** — the cap exactly |

So neither cap is padded: both start at *everything*, as the docstring claims (`:88`). `npm run lint:closure`
on this tree prints `53 of 55` and `47 of 48`, i.e. the caps carry 2 and 1 of slack — **because three tokens
already exist, and none of them is a closure. That is Job 2 finding 1.**

**Would anything red if it were reverted?** The **caps** would: deleting `MAX_UNTOKENISED` / the two
`process.exit(1)` blocks at `:159-171` and `:226-237` leaves the gate green, because the counts are under the
caps today. So the cap code is *unpinned* — no test, no plant, no fixture asserts on `check-audit-closure`'s
output at all (`grep -rn "check-audit-closure" scripts apps packages --include=*.ts` → 1 site, the file
itself; `package.json:38` `lint:closure`). Reverting the token half is silent. ⚠️ **This is M13's shape one
instrument over, and it is not filed as a new major only because `run-gates.ts` still executes the script and
the `[D37]` `missing` gate — the one that can red — is untouched.**

**Docstring vs. code — `:92-93` overclaims.** It says *"A NEW finding that lands without a token reds
immediately."* It does not: the check is `>` against a cap that today sits **2** above the `[D37]` count and
**1** above the P6.8 count, so two new untokenised `[D37]` findings and one new P6.8 one are absorbed
silently. `minor` on its own; recorded because it is the sentence a future reader will trust instead of
re-measuring.

---

### S0.2 · M10 — `check-month-arithmetic`: 5 spellings, string literals stripped first, `PENDING_DELETION` — **the ban is CLOSED and correct; the STRIPPER is a regression — see Job 2 finding 2**

**Is the original behaviour gone?** ✅ Yes for the class that was filed. Measured with a synthetic harness
running the file's own `BANNED`, `DAY_CARRIES_SOURCE`, `dateArgs`, `constructorOverflow` and `stripComments`
verbatim — **17 mainline cases, 17 correct** (10 must-flag, 7 must-stay-clean):

| flags correctly | stays clean correctly |
|---|---|
| the original blocker verbatim · `setUTCMonth` · `d?.setMonth(…)` · year-step Feb-29 · extra time args · nested call with its own comma · inside a JSX attribute · two calls on one minified line · a comma inside a string in an argument · **`const s = 'a // b'; d.setMonth(…)`** *(the exact M10 case)* | `addMonths.ts:25`'s day-`1` idiom · `:27`'s day-`0` idiom · `getNextPaycheckDate`'s `clampDay(…)` · `DateField.tsx:41`'s 1-based conversion · a plain date clone · the ban NAMED in a line comment · the ban NAMED in a string |

**Did it break anything that was right?** ⛔ **Yes — see Job 2 finding 2.** The new string-literal pass took
the gate from **257** to **11,694** blanked characters of real code.

**Are `constructorOverflow` / `dateArgs` sound?** Yes, on everything I could construct. `dateArgs` tracks
depth so `d.getMonth()`'s own parens do not split; `matchAll` handles many calls per line; string contents
are already blank so a `,` or `(` inside a literal cannot reach it; a `new Date(…)` nested inside another
call parses correctly. **Unbalanced on the line ⇒ `null` ⇒ skipped**, which is stated at `:122`.

**Residuals, measured — the named one is NOT the only one.** `:103-106` names exactly one *(a
pre-extracted day variable)*. My harness found **five** more, each confirmed by running the code:

| residual | named? | live sites |
|---|---|---|
| pre-extracted day variable | ✅ `:103-106` | 0 |
| **multi-line `new Date(` call** | only in an inline comment at `:122`, not in the residual list | **0** *(measured: **0** multi-line `new Date(` calls in the whole scanned corpus; no prettier in this repo)* |
| **`d.setMonth?.(…)`** — the optional CALL | ❌ | 0 |
| **`d['setMonth'](…)`** — computed | ❌ | 0 |
| **inside a template expression** — `` `${new Date(y, m+1, d.getDate())}` `` | ❌ **new in this commit** | 0 |
| **anything after an unpaired backtick in a doc comment** | ❌ **new in this commit** | 0 — but 488 lines are blind |

⚡ **The optional-call residual is the finding this same commit fixed in a sibling gate.**
`check-destructive-writes.ts:113` was rewritten to match the **identifier** precisely because
*"enumerating call SHAPES is the wrong game… the enumeration has been short every single time."*
`BANNED` (`:84`) is still a call-shape enumeration, in the same commit, by the same hand. `minor` on its
own — nobody optional-calls a built-in `Date` method — recorded because the asymmetry is the tell.

**One false positive found, not live:** `new Date(y, month - 1, parsed.getDate())` — a 1-based→0-based
conversion whose day happens to come from a `Date` — flags. `DateField.tsx:41` escapes only because its day
is a plain variable. Zero live sites.

**`PENDING_DELETION` self-retirement — verified by running it.** `npm run lint:month-arithmetic` prints
`627 files` clean plus `legacy tree (98 files …): 2 unconverted site(s)` —
`components/AmortizationCalendar.tsx:24` and `components/Onboarding/FirstDebtOrBillStep.tsx:15`, exactly the
two `.11.17 · B` named. My independent TypeScript-parser ground truth over the same 726 files finds
**exactly those two and no others**, so the gate has **no false positive and no live miss today**. The
`existsSync` assertion at `:201-207` does fire — but note it runs **before** the real-hit report at `:210`,
so on the day P6.11 lands, an operator with a genuine offending site sees only the exemption error. `minor`.

**ROOTS coverage, re-measured after the S0.2 addition.** `apps/rn/core` is a **symlink to
`packages/core`** (`ls -la apps/rn` — `core -> …/packages/core`), so it is already covered. What is still
outside every root: `capacitor.config.ts`, `next.config.ts`, `playwright.config.ts`,
`playwright.history.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `apps/rn/{app.config,babel.config,metro.config,index}.js`,
`apps/rn/plugins/*.js`, `apps/rn/scripts/*.mjs`, `apps/rn/modules/`, `ios/*.swift`. **Grepped all of them for
`setMonth|setUTCMonth|setFullYear|getMonth()`: 0 hits.** Clean at this bar.

**Would anything red if the ban were reverted?** **No.** There is no test over `check-month-arithmetic`, and
there are **0 live sites** in the three added spellings, so reverting `BANNED` to the two-spelling form is
silent. Same for `constructorOverflow`. The gate's arming is unpinned exactly as M13 describes for
`audit.test.ts` — and here there is not even a `selfCheck()`.

---

### S0.3 · M11 — `check-destructive-writes`: identifier match, and the `\r` strip on three gates — **CLOSED for M11; the `\r` fix is CORRECT but INCOMPLETE — see Job 2 findings 3 and 4**

**Is the original behaviour gone?** ✅ Yes. `CALL = /(?<![\w$])importStore(?![\w$])/`
(`scripts/check-destructive-writes.ts:114`) matches the identifier, so all four spellings the docstring
tabulates — `?.(`, aliased, computed, `.call(` — now hit. `npm run lint:destructive` prints
`7/7 importStore sites sanctioned across 6 files`, and `ALLOWED` (`:51-73`) sums to **2+1+1+1+1+1 = 7**, so
the per-site counts and the found map agree exactly.

**Did the widening break anything that was right?** No. The widening plus the newly-working `^\s*\*` strip
net to the same 7. A real `importStore(` call cannot begin with `*`, so the doc-comment strip that started
working on CRLF files cannot hide one.

**The `\r` mechanism is correct as stated.** Verified: JS `.` does not match `\r`, and `$` without the `m`
flag sits only at end-of-input, so `/\/\/.*$/` and `/^\s*\*.*$/` fail outright on a CRLF line rather than
matching less. `packages/core` measured **92 CRLF / 47 LF** (139 files) — the "66%" claim reproduces.
`apps/rn/src` is **29 / 349**, `scripts` **6 / 30**.

**Would anything red if it were reverted?** **No** — no test touches any of the three gates, and there are
**0 live sites** in the four newly-matched spellings, so reverting `CALL` to the call-shape pattern is
silent. Reverting the three `\r` strips is silent too: it only restores an over-match, and the gates are at
0 offenders either way. **All three fixes are unpinned by construction.**

---

### S0.4 · M13 — `audit.test.ts`: `verdict()` extracted + `selfCheck()` — **NOT CLOSED. The disarm got CHEAPER — see Job 2 finding 5**

`selfCheck()` (`apps/rn/src/data/migrationAudit/audit.test.ts:138-174`) runs — confirmed in a real
`npm run test:app`, which prints
`✓ self-check: the invariants fire (1 on a poisoned outcome) and the verdict throws` at output line 1517.
It proves ① the invariants fire and ② `verdict()` throws on both a violation and a drift.

⛔ **It does not prove `verdict()` is CALLED.** Job 2 finding 5.

⚠️ **Named honestly, second residual:** the self-check's poisoned outcome carries `store: null`, so **1 of
9** invariants can fire on it (`neverThrows`); the other eight short-circuit on `!o.store`. The printed
sentence *"the invariants fire"* is true of one ninth of them, and it can never exercise ⑨.

---

### S0.5 · M14 — `hostile.test.ts`: `HOSTILE_FLOOR` — **CLOSED**

**Is 32 right?** ✅ Reproduced: `__fixtures__/hostile-v16-cases.json` holds exactly **32** cases (counted,
ids listed), and a real run prints `doors opened: 32/32 file · 32/32 webkit · 0 refused by both`.

**Does it gate?** ✅ `assert` throws (`:35-38`), `run()` is `await`ed at `runAppTests.ts:238`, and the
assertion at `:106-109` is `openedFile >= 32 && openedKeys >= 32`. Drop one fixture from being recognised
and it reds — which is the door M14 named.

**"A case that opens but is immediately refused downstream"** — not reachable in these doors.
`viaFile.store` is set only inside `if (result.ok)` (`doors.ts:54-56`) and `viaKeys.store` only inside
`if (outcome.migrated && migrated)` (`doors.ts:83-85`); the refusal paths set `store = null` and
`refused = true`. There is no third state where a store is produced and then discarded, so "opened" does
mean "the migration logic ran". ✅

**Would anything red if it were reverted?** No — deleting the assert is silent at 32/32. Unpinned, like the
rest.

⚠️ **One docstring/code contradiction.** `:100-102` says *"Deliberately NOT 'all 32 must open'"* — but with
`CASES.length === 32` and `HOSTILE_FLOOR === 32`, all 32 **must** open today. The statement is only true of
*future* additions. `minor`; recorded because it is the sentence a reader will trust when a fixture starts
being refused.

**Cross-cover, in its favour:** `hostile.test.ts` has no `selfCheck()` of its own, but it shares
`invariants.ts` with `audit.test.ts`, whose `selfCheck()` proves the invariants fire. That half is covered.

---

### S0.6 · M16 — `invariants.ts` invariant ⑨ `priorityGoalIsCapped` — **the RULE is right and closes the C-3 mechanism; the CORPUS half of M16 is untouched — see Job 2 finding 6**

**Is `!(pace > 0)` right?** ✅ **Both consumers verified, and a third found.**

| consumer | reads | agrees with `!(pace > 0)`? |
|---|---|---|
| `packages/core/engine/allocatePaycheck.ts:635` | `goal.priorityPerPaycheck != null && … > 0 ? pace : Infinity`, inside a loop that `continue`s on `goal.priority !== true` (`:632`) | ✅ exactly |
| `packages/core/engine/recommendedActions.ts:80` | `goal.priority === true && … != null && … > 0` | ✅ exactly |
| **third consumer — `apps/rn/src/components/entities/GoalSheet.tsx:38` / `:109`** | reads the field for the edit form and writes it back; **no `> 0` semantics of its own** | ✅ not a semantic consumer — it neither treats another value as uncapped nor can produce one that survives a door *(`migrations.ts:259` stands `0` down on every read)* |

So `!(pace > 0)` — which flags `0`, negatives, `NaN` and non-numbers — is the right predicate, and the
negative half is genuinely load-bearing rather than defensive: **`migrations.ts:259` matches
`priorityPerPaycheck !== 0` strictly, so a negative pace is NOT stood down** and would emerge with
`priority: true`. Invariant ⑨ is the only thing that would notice.

**Does it false-positive?** ✅ **No, and the docstring's stated reason at `:209-212` is TRUE as measured.**
`migrations.ts:274` — `delete goal.priorityPerPaycheck;` — sits **outside** the `if (governed)` at `:273`, so
both branches delete the field, and `:224` (`pace === undefined → return`) then skips. Verified against both
corpora: **0 false positives on 522 generated cases and 0 on 32 hostile cases**, and the real run is green at
9 invariants.

**Would anything red if it were reverted?** ⛔ **No — see Job 2 finding 6. It is unreachable on every one of
the 554 cases.**

---

## Job 2 — the sweep. **0 blockers · 6 majors**

### 1. The `[closes: …]` mechanism built to stop a postmortem counting as a closure is **already minting closures from a postmortem about itself** — **major · the fourth carry**

**User-facing consequence:** three real blocker/major findings — including `L0-1`, a **major**
(*"25 of 39 e2e specs seed a plan with NO bills"*) — now read as **machine-checkably closed** to the
instrument that decides P6.8.9's exit criterion, on the strength of a syntax example and a table row
describing a test plant. `.11.19` is chartered to drive both caps to 0 and then *"delete the cap and require
the token"*; every token minted this way makes that terminal state arrive over findings nobody examined.

**Mechanism — measured, with the gate's own regex.** `scripts/check-audit-closure.ts:96-102` scans the three
`SOURCES` for `\[closes:\s*([^\]]+)\]` and adds every whitespace-separated token to `explicit`. There is **no
code-fence awareness, no id validation, and no requirement that the line say anything else.** The four
tokens on this tree are:

| where | what the line actually is | tokens minted |
|---|---|---|
| `docs/DEBT_ELEVATION_LOG.md:174` | *"an explicit closure token `[closes: L5-5 M2-1]` read from the three closure SOURCES…"* — **the syntax example** | `L5-5`, `M2-1` |
| `docs/DEBT_ELEVATION_LOG.md:229` | a results-table row: *"`[closes: L0-1]` appended to the log (the escape route works) \| verified by `tail` \| **55 → 54 untokenised, 0 → 1 explicit**"* — **the description of the S0.1 test plant** | `L0-1` |
| `docs/DEBT_ELEVATION_PLAN.md:33` | *"⚡ **S0.1 built the mechanism** (`[closes: ID]`, both caps downward-only)"* — **the placeholder** | `ID` |

**Measured effect** — probe reproducing `:96-102`, `:118-148` and `:180-225` verbatim:

```
explicit token ids: [ 'ID', 'L5-5', 'M2-1', 'L0-1' ]
d37 untokenised WITH tokens: 53   IF NO TOKENS: 55   rescued: [ 'L0-1', 'L5-5' ]
p68 untokenised WITH tokens: 47   IF NO TOKENS: 48   rescued: [ 'M2-1 (M2-journey, major)' ]
```

`L0-1` is `docs/audits/2026-08-17-v1.7-audit-gate/findings/L0-scripted.md:11`, **Severity: major**. `L5-5` is
`L5-states-firstrun.md:60`. `M2-1` is `docs/audits/2026-08-21-p6.8-finish/slices/M2-journey.md:18`,
**major**. **Zero of the four tokens is a closure. Three of them move the number.**

⚡ **This is M12 verbatim, one mechanism over.** M12: *"the instrument counts a postmortem ABOUT twelve ids
as the closure trace FOR them… the gate's count went 39 → 51 → 39 inside one commit range, and the second
move was made by the documentation of the first."* Here the counts went **55 → 53** and **48 → 47**, and both
moves were made by the documentation of the remedy. **The cluster's own prediction, landing a fourth time.**

**Is the token a real weakening versus the prose it replaced?** ⛔ **No — stated plainly so pass 2 does not
over-read this.** A prose mention of `L0-1` anywhere in 22,000 lines already counted; a token is strictly
stronger. The finding is **not** that the token is weaker. It is that the token was shipped as
*"machine-checkable"* and **its first four instances are not**, that nothing in the gate can tell the
difference, and that the cap is being ratcheted down against exactly this number. `:84-88` already concedes
the point for prose; it does not concede it for the token, and the token needs it more.

**Confidence:** measured twice — `npm run lint:closure` on this tree (`53 of 55` · `47 of 48` · `4 carry an
explicit token`), and an independent probe.

**Would anything catch it?** No. `grep -rn` for `check-audit-closure` / `lint:closure` across `scripts`,
`apps`, `packages`, `.github` and `package.json` returns **7** hits and **not one is a test**:
`package.json:28`, `run-gates.ts:44`, `gateSources.ts:31`, `scripts/tsconfig.json:13`,
`write-gate-status.ts:14`, and the file's own `:14` and `:319`.

**Not a regression I can find, and worth recording so pass 2 skips it:** the 538 log lines this commit added
rescued **0** additional P6.8 ids. Measured by running the same parser against `c8d54fa`'s three sources and
against this tree's: `[D37] 55 high+, 0 untraceable | P6.8 87 high+, 48 traced, 39 untraceable` — **identical
on both commits.** `.11.17` finding 3's second-order worry did not materialise here.

---

### 2. The stripper added to close M10 made `check-month-arithmetic` **45× blinder** — **major · the fix is the regression**

**User-facing consequence:** the gate that exists so a future month-step cannot ship a wrong debt-free date
now cannot see **488 lines of real code across 29 files** — including **1,044 characters of its own body** —
so a `new Date(y, m + n, d.getDate())` written on any of those lines is invisible, and a user reads a
debt-free month, a chart pill or a schedule row naming the wrong month.

**Mechanism — measured against a TypeScript-parser ground truth over the same 726 files the gate walks.**
`scripts/check-month-arithmetic.ts:166` adds a string-literal pass whose **backtick alternative has no
newline exclusion**. Doc comments here are dense with backticks, so an unpaired one pairs with a backtick
many lines later and the whole span is blanked.

Worked example printed by the probe — `apps/rn/src/data/detectBackupFormat.ts`, **one pass-1 match spanning
lines 17–38, 1,005 characters**, opening on a backtick inside the module docstring:

```
26 RAW  |export type BackupKind = 'envelope' | 'v16-file' | 'raw-v17' | 'unrecognised';
26 GATE |
28 RAW  |export interface BackupDetection {
28 GATE |
34 RAW  |const isPlainObject = (value: unknown): value is Record<string, unknown> =>
34 GATE |
```

**The trade, measured** — code characters the stripper blanks that a TypeScript parser calls executable:

| stripper | blanked code chars | lines | files |
|---|---|---|---|
| `c8d54fa` — comments only (**the state M10 filed as `major`**) | **257** | 17 | 12 |
| **`2b10a6c` — as shipped** | **11,694** | **488** | **29** |
| the same regex with the backtick alternative newline-bounded | 498 | 26 | 18 |

Worst files: `scripts/surface-inventory.ts` (1,719 chars), `apps/rn/src/store/demoSession.ts` (1,138),
`scripts/coverage-model.ts` (1,060), **`scripts/check-month-arithmetic.ts` itself (1,044)**,
`apps/rn/src/widget/snapshot.ts` (967), `scripts/stamp-coverage.ts` (900),
`apps/rn/src/app/(tabs)/_layout.tsx` (847), `scripts/maestro-results.mjs` (831).

**A second new blind spot in the same pass:** a template **expression** is blanked with its literal, so
`` const s = `${new Date(y, m + 1, d.getDate()).toISOString()}`; `` is no longer judged. Confirmed by the
synthetic harness. Before this commit it was.

**Is anything hidden today?** **No.** The ground-truth comparison finds the same **2** offending sites the
gate reports (`components/AmortizationCalendar.tsx:24`,
`components/Onboarding/FirstDebtOrBillStep.tsx:15`), and only 3 date-shaped lines are fully blanked — all
three are comments or a `console.error` string inside `check-month-arithmetic.ts` itself. **A reach gap, not
a live hole — exactly the standing on which M10, M11 and E's finding 1b were each filed `major`.**

**Confidence:** measured twice over the whole corpus, with the gate's regexes lifted from the file at
runtime rather than retyped.

**Would anything catch it?** No — no test touches this gate, and the direction is silence.

---

### 3. **The fourth `\r` site is `check-audit-closure` itself** — on a fresh Windows clone it prints *"all 0 high+ findings trace"* and exits 0 — **major**

**User-facing consequence:** the traceability gate standing behind *"every blocker/major finding is closed"*
— the half of the file that `process.exit(1)`s — parses **zero** findings from a CRLF corpus and reports a
green on nothing, so a release can be signed off against an instrument that examined no findings at all.

**Mechanism — measured.** `scripts/check-audit-closure.ts:123` and `:187` end their heading regexes with
`(.*)$`, over lines from `split('\n')` (`:122`, `:185`). `.` does not match `\r`; `$` without `m` sits only
at end-of-input. Reproducing both parsers verbatim over the real corpora, once as-is and once
CRLF-converted:

```
corpus LF  : [D37] findings=117 high+=55   P6.8 findings=170 high+=87
corpus CRLF: [D37] findings=0   high+=0    P6.8 findings=156 high+=78
```

`[D37]` loses **all 117**, then prints `✅ [D37]: all 0 high+ findings trace…` and exits 0. The severity
regexes (`:128`, `:199`) carry no `$`, which is why nothing else notices. P6.8 survives partially —
`\s*[—–·-]?\s*` absorbs the `\r` for headings with nothing after the id — and still loses **14 findings, 9
of them high+**.

**Is CRLF reachable?** ✅ **Measured, not inferred.** `git config core.autocrlf` → **`true`**, and there is
**no `.gitattributes`**. The blob is LF and the working tree is LF, but a checkout converts:

```
f=docs/audits/2026-08-17-v1.7-audit-gate/findings/L0-scripted.md
blob CR bytes:       0
worktree CR bytes:   0
worktree LF bytes: 103
git checkout-index → CR bytes: 103      # what a fresh clone on this machine writes
```

So **any fresh clone on Windows produces the failing state.** CI is `ubuntu-latest`, where `autocrlf`
defaults to false, so the CI lane is safe — the exposure is the local `run-gates` lane, which is the lane
`gate:record` writes `gate-status.json` from.

**`coverage-model.ts:154` — `.11.17`'s candidate — verdict CONFIRMED, reason CORRECTED.** It is **not** a
`\r` site: `:150` is `raw.split(/\r?\n/)`, so the `\r` is gone before `/^#{2,3}\s+(.*)$/` runs. *(The regex
itself does fail on a CRLF heading — measured `NO MATCH` — so the split is what saves it, not the regex.)*
⚠️ But `.11.17`'s stated reason, *"judged not-a-gate"*, is **false**: `coverage-model.ts` is imported by
`coverage-split.ts:39`, which is `lint:coverage`, gate **15 of 22** in `run-gates.ts:49`. Right verdict,
wrong premise.

**The class, counted whole rather than sampled.** Every `.*$`-anchored regex in `scripts/`: **4** —
`check-apostrophes.ts:223` ✅fixed · `check-destructive-writes.ts:132` ✅fixed ·
`check-sandbox-writes.ts:120` ✅fixed · `coverage-model.ts:154` ✅not-a-site. I then read **every** `$/` in
`scripts/` (46 hits), **every** `.split(` (47 hits) and **every** `endsWith(` (22 hits): the only remaining
line-anchored regexes applied to `split('\n')` lines are `check-audit-closure.ts:123` and `:187`. **That is
the complete class.**

---

### 4. The `//`-inside-a-string truncation — **the exact defect M10 named** — is still live in the three gates the same commit edited on the adjacent line — **major**

**User-facing consequence:** a new unsanctioned caller of `importStore` — the one operation that replaces
the user's entire portfolio and cannot be undone — written on a line that also carries a URL in a string
literal is not counted, and the gate whose own docstring says *"**What it must never do is under-match**"*
stays green.

**Mechanism.** `check-destructive-writes.ts:132`, `check-sandbox-writes.ts:120` and
`check-apostrophes.ts:223` all strip `//` **without stripping string literals first**:

```ts
const line = raw.replace(/\r$/, '').replace(/\/\/.*$/, '').replace(/^\s*\*.*$/, '');
```

That is byte-for-byte the defect `.11.17 · B` filed as M10, and the one
`check-month-arithmetic.ts:160-168` now carries a nine-line docstring about: *"a `//` inside a string blanked
the REST OF THE LINE, taking a real call with it… The `[^:]` guard was there to spare `https://`, which
addressed the symptom in URLs and left every other string open."* ⚡ **These three do not even have the
`[^:]` guard**, so a bare `https://` truncates them where it would not truncate the month gate's old form.
All four lines were edited in the same commit.

**Measured, whole corpus, no sampling:**

| gate | files scanned | lines truncated by a `//` inside a string | of those, hiding the gate's own identifier |
|---|---|---|---|
| `check-destructive-writes` (`apps/rn/src`, non-test) | 311 | **11** | **0** |
| `check-sandbox-writes` (same root) | 311 | **11** | **0** |
| `check-apostrophes` (`apps/rn/{plugins,targets,modules}` + `ios`) | 19 swift | **4** | **0** |

**A reach gap, not a live hole** — the same standing as E's finding 1b, which was filed `major` with 0 live
sites and which this very fix closed.

**Would anything catch it?** No. The count check at `check-destructive-writes.ts:130-146` compares against
the same `found` map, so an unmatched line is invisible in both directions.

---

### 5. `selfCheck()` proves `verdict()` **throws**; nothing proves it is **called** — and the disarm got **cheaper**, from four lines to one — **major**

**User-facing consequence:** the adversarial corpus that exists to prove a v1.6→v1.7 upgrade cannot corrupt
someone's balances can be returned to report-only by deleting **one line**, and the run will then print
`✓ self-check: the invariants fire … and the verdict throws` immediately before printing `⛔ N violations`
and exiting 0 — a *reassurance* where `.11.12` had only silence.

**Mechanism.** `apps/rn/src/data/migrationAudit/audit.test.ts:102` — `verdict(rows, drift, byCause.size);` —
is the **only** place `verdict()` is reached from real data. `selfCheck()` (`:138-174`) calls `verdict()`
**directly** at `:155` and `:165`, so it is satisfied whether or not `:102` exists. Delete `:102` and:

- `selfCheck()` at `:40` still runs and still prints its success line;
- `rows` is read only at `:74`, `:82`, `:90` and `:102` — all three survivors are `console.log`;
- `runAppTests.ts:229` calls `.default()` and would notice the *export* vanishing, not the *call*;
- `hostile.test.ts` throws on `invariants.ts`, not on this file's verdict.

**Nothing reds.** `grep` for `verdict` and `selfCheck` across `apps/rn/src/data/migrationAudit/`,
`apps/rn/src/testing/` and `apps/rn/tests/` returns **no reference outside `audit.test.ts`** — both exports
are used only by their own module.

⚡ **`tested-helper-is-not-a-used-helper`, and this is the memory's own sentence:** *"the clamp existed, was
correct and was tested while the defect shipped; what was missing was the call."* M13's remedy built the
tested helper and left the call unpinned. `:135` claims *"Deleting the throw at `verdict` now reds link ②.
Deleting this block is no longer four lines"* — true, and it guards the deletion nobody would make. The
**cheapest** disarm went from **4 lines** (`.11.17`'s measurement) to **1**.

**Confidence:** structural, and certain — the only consumer of `rows`/`drift` outside `console.log` is `:102`.
⚠️ **Not planted.** This round is read-only, so I did not delete the line and run the suite; the claim rests
on the reference count, which I did measure.

**Second, smaller residual, named rather than folded away:** the self-check's poisoned outcome sets
`store: null`, and eight of the nine invariants short-circuit on `!o.store` (`invariants.ts:103, 131, 141,
148, 173, 185, 215` and the `accounting` guard at `:60`). The real run confirms it —
`the invariants fire (**1** on a poisoned outcome)`. So the line that says *"the invariants fire"* proves
**one ninth** of them, and can never exercise ⑨.

---

### 6. Invariant ⑨ cannot fire on **any** of the 554 cases — it can be deleted, inverted or broken with the whole repo green, and `corpus.ts` was never touched — **major**

**User-facing consequence:** the branch `migrations.ts:228` calls *"the only finding in that pass that
reaches a user's money"* — the one that decides whether every spare dollar of a paycheck is redirected away
from the user's debt — is still proven by **zero** of the audit's 554 cases. The rule that judges it exists,
is correct, and is never evaluated, so a later edit that breaks it changes nothing anyone can see.

**Mechanism — measured, no execution needed for the generated half.**

- **Generated corpus, 522 cases.** `corpus.ts:63`'s base goal is
  `{ id: 'g1', name: 'Emergency fund', targetAmount: 1000, currentAmount: 250, type: 'emergency' }` — **no
  `priority` field at all.** The nested damage axis (`corpus.ts:168-181`) is `['goals','targetAmount']` and
  `['goals','currentAmount']`. **`corpus.ts` contains the string `priority` exactly 0 times** and
  `priorityPerPaycheck` 0 times. So `invariants.ts:222` (`if (g.priority !== true) return;`) returns on
  **1,044 of 1,044** generated outcomes.
- **Hostile corpus, 32 cases.** Exactly **one** goal row in the whole fixture file carries either field:
  `goal-pace-unreadable-on-a-priority-goal → goals[0] { priority: true, priorityPerPaycheck: "not a number",
  type: "savings" }`. `type: 'savings'` makes it `governed`, so `migrations.ts:273-274` sets
  `priority = false` **and** deletes the pace — which is precisely what `.11.17 · C` measured
  (`out goals[0] = { …, priority:false }`). ⑨ returns at its first guard there too.

⇒ **`bad.push` at `invariants.ts:226` is unreachable on every case in both corpora.** Inverting `!(pace > 0)`
to `pace > 0`, inverting the priority guard, or deleting `priorityGoalIsCapped` from `INVARIANTS` (`:241`)
all leave `npm run test:app` green; the only visible change is the console line `9 invariants` becoming `8`,
which nothing asserts.

⚡ **M16's own stated mechanism is half-closed.** The finding was: *the false comment "not reachable through
either door" was load-bearing — it justified `corpus.ts:176-181` not adding the field, so 0 of 522 cases hit
the stand-down.* This commit **corrected the comment** (`invariants.ts:86-98`, and correctly) and **added the
rule** — but `corpus.ts` is **not in the commit's file list**, and it is still **0 of 522**. The comment was
the evidence; the corpus was the consequence, and only the evidence was fixed.

⚠️ **What IS genuinely closed, stated fairly:** the un-fix `.11.17 · C` simulated — delete the stand-down
loop so a goal keeps `priority: true` with a pace repaired to `0` — **would now red**, because ⑨ fires on
`!(0 > 0)`. Reintroducing *that specific defect* is caught. What is not caught is a defect in ⑨ itself, and
nothing proves ⑨ ever runs.

**Confidence:** measured — fixture file enumerated in full (32 cases, 1 priority goal), `corpus.ts` read in
full, both consumers of the field read in full, and the real `npm run test:app` output captured
(`522 cases × 2 doors, 1044 outcomes, 9 invariants each` · `32/32` · green).

⚠️ **And `corpus.ts` is invisible to `grep`.** `corpus.ts:105`'s `unicode` damage embeds a literal **NUL
byte** (`'🧾💸� ünïcødé'` — byte 4525 of 8193, verified: removing NULs shortens the file by exactly 1
byte). `grep`/ripgrep classify the file as binary and **skip it silently** — my own first sweep for
`priorityPerPaycheck` returned nothing from it with no warning, and `grep -c` reported `0` where the honest
answer is *"not searched"*. No **gate** is affected (they all use `readFileSync`), so this is `minor` — but
it is a live trap for every future grep-driven audit of this exact file, which is the file two rounds have
now reasoned about from its comments instead of its contents. `truncated-search-hides-a-class`, with the
truncation inside the corpus rather than the command.

---

### 7. `PENDING_DELETION` made `check-month-arithmetic` read four trees that `gateSources.ts` does not fingerprint — so P6.11's deletion reds the gate while `lint:gate-freshness` still calls the recorded pass fresh — **major**

**User-facing consequence:** on the day P6.11 deletes the legacy tree, `npm run lint:rn` reds and
`npm run lint:gate-freshness` reports the previous green as still describing the tree — so a build can be
cut against a recorded pass that is no longer true, which is precisely the failure [D49] was written after
(*"the gate was red from `f4e5e11` to 2026-08-20 while three sessions recorded it green"*).

**Mechanism.** S0.2 added `PENDING_DELETION = [app, components, lib, tests]`
(`check-month-arithmetic.ts:52-57`) and an `existsSync` assertion that **exits 1** when any of them stops
existing (`:201-207`) — the self-retiring exemption, which is a good design. But `gateSources.ts:52-62`
fingerprints `apps/rn`, `packages/core`, `scripts`, `apps/rn/.maestro`, `.github/workflows`,
`.github/actions` plus four repo-root files. **None of the four new trees is in it**, and the deletion of a
directory outside the roots changes neither `sourceHash` nor `fileCount` (`gate-status.json` records
`fileCount: 689`, all from the fingerprinted set).

⛔ **And `gateSources.ts:16-21` states the opposite standard for itself:** *"SCOPE IS AN EXCLUSION LIST, NOT
AN INCLUSION LIST — [W1-4]. An inclusion list fails silent… An exclusion list fails safe."* Its `ROOTS` **is**
an inclusion list at the top level; the exclusion logic lives only in `skipDir` *inside* those roots. It
documents exactly one residue — `docs/` at `:31-36`, accepted deliberately and stated. **This new one is not
documented and it fails silent**, which is the direction that file says it must never fail.

**Confidence:** read, both files in full, and confirmed against the recorded `gate-status.json`. **Not
executed** — I did not delete a tree to watch the freshness check pass, so the last link is structural.

**Narrow trigger, stated fairly:** only *deletion* of one of the four flips the verdict (an added `setMonth`
in the legacy tree is report-only, `:218-223`). The remedy is one line — add the four to `ROOTS`, or record
their existence in the fingerprint.

**Interaction with finding 1, worth naming for pass 2:** the documented `docs/` residue means a
`[closes: …]` token written into `DEBT_ELEVATION_LOG.md` changes `lint:closure`'s numbers **without**
invalidating a recorded green. Combined, the two make the closure cap the one gate number that can move
while freshness says nothing moved.

---

## Swept and found clean — at the blocker/major bar

Each was read in full or measured this round; none produced a blocker or major. **This list is the ratchet:
pass 2 should extend it, not re-walk it.** Everything here is *additional to* `.11.17`'s clean lists in
`E-gates-instruments.md` and `C-import-bridge-backup.md`, which I did not repeat.

**Instruments — behaviour, verified by running them**

- **`npm run lint:closure`** — runs green: `[D37] all 55 high+ trace` · `53 of 55 untokenised (cap 55)` ·
  `P6.8 39 of 87 in no ledger` · `47 of 48 untokenised (cap 48)` · `P6.4 62 findings, 0 in no ledger`.
- **`npm run lint:month-arithmetic`** — green: `627 files` clean, legacy tree `98 files, 2 unconverted
  site(s), reported not failed`.
- **`npm run lint:destructive`** — green: `7/7 importStore sites sanctioned across 6 files`.
  `ALLOWED`'s per-site counts sum to exactly 7 (2+1+1+1+1+1) — the D-J2-3 per-site binding holds.
- **`npm run lint:sandbox`** — green: `24 sanctioned appStore consumers, no unsanctioned ones`, `0 stale`.
- **`npm run lint:apostrophes`** — green: `0 baselined`.
- **`npm run test:app`** — green: `migration audit — 522 cases × 2 doors, 1044 outcomes, 9 invariants each`
  · `differential — 522 produced a store through BOTH doors, 0 disagreed` · `✓ the healthy control
  survives both doors with its income intact` · `5.10.5 — 32 states × 2 doors × 9 invariants`,
  `doors opened: 32/32 file · 32/32 webkit · 0 refused by both` · `✓ self-check: the invariants fire (1 on a
  poisoned outcome) and the verdict throws` (output line 1517, i.e. `selfCheck` genuinely executes).

**`MAX_UNTOKENISED`, reproduced independently**

- Both caps are the **true totals** at `2b10a6c`, not padded: with the token set emptied, `[D37]` is 55/55
  and P6.8 is 48/48 — the cap values exactly. Measured with the gate's own parsers.
- The **downward-only discipline is real but has slack**: the check is `>`, so the `[D37]` cap absorbs **2**
  new untokenised findings and the P6.8 cap **1** before reddening. `:92-93`'s *"A NEW finding that lands
  without a token reds immediately"* is therefore false as written (`minor`).
- **Writing a token for an id that was never closed is trivially possible and completely unvalidated** — no
  id check, no code-fence awareness, no closure-marker requirement. Recorded as finding 1 rather than as a
  separate weakening, because the prose mention it replaces was *weaker*, not stronger.

**`check-month-arithmetic` — correctness of the ban itself**

- 17 mainline synthetic cases, **17 correct** (table in Job 1 · S0.2), running the file's own regexes.
- A TypeScript-parser ground truth over the same **726** files finds **exactly the 2** sites the gate
  reports and no others — **0 false positives, 0 live misses**.
- `dateArgs`'s depth tracking: nested calls, multiple `new Date(` per line, a `new Date` inside another
  call, JSX attributes, and 4+ argument forms all parse correctly.
- **Multi-line `new Date(` calls: 0 in the entire scanned corpus** (measured by brace-matching across
  newlines), and there is no prettier/`printWidth` in this repo to create them. The residual is real and is
  named at `:122`; it is not live.
- `EXEMPT`'s single entry resolves (`packages/core/utils/addMonths.ts`), and the exemption is honoured on
  both the main scan and the legacy scan.

**Scope / roots**

- **`apps/rn/core` is a symlink to `packages/core`** (`core -> /c/Users/Jason/debt-app-v1/packages/core`) —
  already covered by `ROOTS`, not a second tree. `git ls-files apps/rn/core` returns 0.
- Live source outside every `check-month-arithmetic` root: `capacitor.config.ts`, `next.config.ts`,
  `playwright.config.ts`, `playwright.history.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`,
  `apps/rn/{app.config,babel.config,metro.config,index}.js`, `apps/rn/plugins/*.js` (7),
  `apps/rn/scripts/*.mjs`, `apps/rn/modules/`, `ios/*.swift` (15). **Grepped all of them for
  `setMonth|setUTCMonth|setFullYear|getMonth()`: 0 hits.** Clean.
- `packages/` contains only `packages/core`; `apps/rn/dist-embed` is build output.

**`run-gates.ts` — the registry, re-derived rather than re-read**

- `package.json` declares **25** `lint:*` scripts. `run-gates.ts:33-58` registers **22** of them plus the
  RN eslint run = **23 gates**. The three unregistered are `lint:rn` (the wrapper itself), `lint:webkit`
  and `lint:gate-freshness` — both documented, both correctly outside. **No drift in either direction.**
- ⚠️ **Correcting `.11.17`:** `coverage-model.ts` **is** gate code — `coverage-split.ts:39` imports it and
  `lint:coverage` is gate 15. Its `\r`-safety comes from `:150`'s `split(/\r?\n/)`, not from being
  un-gated.

**The three `\r` fixes, and the class around them**

- The stated mechanism is exact: `.` does not match `\r`, `$` without `m` sits only at end-of-input, so
  `/\/\/.*$/` and `/^\s*\*.*$/` **fail outright** rather than matching less. Verified.
- Line endings measured, not assumed: `packages/core` **92 CRLF / 47 LF**; `apps/rn/src` **29 / 349**;
  `scripts` **6 / 30**; `ios` **1 / 2**; all 8 `[D37]` findings files, all 13 P6.8 slices and all 3 closure
  `SOURCES` are **LF today**.
- The class enumerated whole, not sampled: every `.*$` regex in `scripts/` (**4**), every `$/` (**46**),
  every `.split(` (**47**), every `endsWith(` (**22**). Only finding 3's two lines remain.

**The migration-audit harnesses**

- **Invariant ⑨'s predicate is right and its no-false-positive claim is true as measured** — the
  `delete goal.priorityPerPaycheck` at `migrations.ts:274` is outside the `if (governed)` at `:273`, so both
  branches clear the field. 0 false positives across 522 + 32 cases.
- **All three consumers of `priorityPerPaycheck` enumerated** (not two): `allocatePaycheck.ts:635`,
  `recommendedActions.ts:80`, and `GoalSheet.tsx:38`/`:109`. The first two agree with `!(pace > 0)` exactly;
  the third has no `> 0` semantics and cannot produce a store that survives a door.
- **`HOSTILE_FLOOR` gates for real** — `assert` throws, `run()` is awaited at `runAppTests.ts:238`, and
  32/32 is reproduced by a live run. "Opens but refused downstream" is not a reachable state: `doors.ts:54`
  and `:83` set `store` only inside the success branch.
- **`doors.ts` drives the real exported functions**, as its `:14-19` docstring claims — `readBackup`,
  `runMigrations`, `migrateFromLegacy` — no reconstruction.
- **`corpus.ts` read in full.** 20 damage transforms (`absent … utcMidnightDate`), 1 healthy control, the
  top-level cross product plus 9 nested `[array, field]` pairs; the goal money pair added at `.11.12` is
  present. 522 cases reproduces.

**`check-sandbox-writes` — the named residual, `minor` and stated with its reason**

- `IMPORT` (`:100`) is an **import-shape enumeration**, the same game S0.3 abandoned next door. It does not
  match `import * as x from '…/appStore'`, a default import, a dynamic `await import('…/appStore')`, or a
  re-export chain whose specifier does not end in `appStore`. **Measured: every one of the live import
  sites uses the single named-import form**, so 0 divergent sites; and unlike `importStore` there is a
  second, runtime layer (`realWriteGuard.ts`, with its own suite). `minor` — an import statement's shape
  space is small and closed, where a call's is not.
- The staleness sweep at `:130-132` is live and reports `0 stale`, so the `waiting-lists-decay-one-way`
  hazard it names is currently clean.

**Not a regression, checked because `.11.17` predicted one**

- The **538 log lines** this commit added rescued **0** additional P6.8 ids: running the same parser against
  `c8d54fa`'s three sources and this tree's gives `39 untraceable` both times. `.11.17` finding 3's
  second-order worry (*"a gate whose corpus grows by quoting the ledger it checks will keep doing this"*)
  did **not** materialise here.

---

## Could not determine

- **Whether deleting `audit.test.ts:102` really leaves everything green.** The round is read-only, so
  finding 5 rests on a complete reference count (`verdict`/`selfCheck` have no consumer outside their own
  module) rather than on a planted deletion. **One plant settles it**, and it is the thing I would most want
  measured before this is called closed.
- **Whether `lint:gate-freshness` really reports fresh after a legacy-tree deletion.** Finding 7's last link
  is structural — I did not delete `components/` to watch it. Deleting one file from the fingerprinted set
  and one from `PENDING_DELETION` and comparing the two verdicts would settle it in a minute.
- **What `.11.19` intends the caps to mean once tokens are written by hand.** If tokens are written into the
  log the way the first four were — in prose about the work rather than on the line that closes something —
  the caps reach 0 with nothing proven. That is a scoping decision for whoever owns `.11.19`, not a defect I
  can settle from the code.
- **Whether any of `L0-1`, `L5-5` or `M2-1` is in fact closed.** I established only that the *evidence*
  currently recorded for them is fabricated. Settling whether they are open needs the code, exactly as
  `.11.17` said of the 39.
- **Whether the CRLF exposure in finding 3 has ever actually fired.** I proved a fresh Windows checkout
  produces CRLF and that CRLF zeroes the `[D37]` parse; I did not establish whether any recorded green in
  `gate-status.json`'s history was produced from such a tree.
