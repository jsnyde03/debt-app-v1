# S0 guard inventory — pass 4, job ③ ([D67])

**Pinned:** `613adf2`, branch `v1.7-dev`.
**Surface:** every finding closed on the S0 surface — `scripts/check-*.ts`, `scripts/lib/stripCode.ts`,
`scripts/gateSources.ts`, `scripts/run-gates.ts`, `apps/rn/src/data/migrationAudit/*`, plus the two
`.11.17` auditor files the brief names (`E-gates-instruments.md`, `C-import-bridge-backup.md`).
**Bar:** not blocker/major. ⛔ **A job-③ row is not a defect.** The code was measured *correct*; a `GAP`
records that **nothing standing would catch it regressing.** This file is a build list for S0.13.

> ⛔ **The criterion I applied, stated once.** For each closed finding I asked the question passes 1–3
> asked: **would anything red if the FIX were reverted?** — not the weaker *"would the gate catch the class
> today."* Where a gate's own arithmetic reds on the defect class but its own source can be reverted
> silently, the row says so and the structural half is filed once as **GAP-16**, not repeated eleven times.
>
> ⛔ **Everything below marked "measured" was run at `613adf2`.** Where I could force the regression I did
> — the strippers were swapped, the markdown stripper was reverted to its first cut and then removed
> entirely, the `importStore` regex was reverted to its pre-M11 call shape, the goal stand-down was
> simulated away, and one prose mention plus one fabricated token were appended to scratch copies of the
> ledger. **Twenty probe runs across six scripts, all under `scratchpad/p4b/`, none in the repo tree.**

---

## Result

**37 findings · 11 guarded · 18 gaps · 8 n/a.**

⚡ **[D67]'s two expected gaps: one confirmed and made worse, one PART-REFUTED — both by measurement.**
*"`stripMarkdownCode` covers four spellings"* is a real GAP, and worse than named: **removing the function
entirely mints 4 fabricated closure ids and `lint:closure` stays GREEN**, because a fabricated closure
*lowers* the untokenised count while the caps are upper bounds (`GAP-4`).
*"each of the nine gates uses the right variant"* is **not one gap — it is seven, and three gates refute
it.** Blinded to a stripper that blanks the whole file, `check-sandbox-writes` reds (`24 STALE`, exit 1),
`check-destructive-writes` reds (`6 ALLOWED entries`, exit 1) and `check-copy-owners` reds (`4 closures no
longer wired`, exit 1). **The other seven report a pass while reading nothing** — three of them printing a
reassuring number that is false as printed.

⚡ **The single highest-value gap is not on [D67]'s list: `GAP-1`.** Invariant ⑨ is reachable *only*
because of a 10-line loop at `corpus.ts:206-215`, and **deleting that loop restores the original defect
with the whole repo green** — the corpus shrinks 542 → 522 and the only floor is `cases.length < 100`.

⚡ **And one mechanism nobody has recorded before:** the cap in `check-audit-closure` reds on a prose
rescue *(measured: one line naming `M1-3` → exit 1)* — but **each fabricated `[closes: …]` token buys one
unit of headroom against that same guard.** With one fabricated token in place, the rescue that redded on
its own passes. The guard erodes by exactly the mechanism it was built beside.

---

## The enumeration — budgeted, not listed

⚠️ **This project's summaries have under-counted on five consecutive items, so nothing below comes from a
summary.** I worked the six source files, took every heading that asserts a closure, and counted them
before deduplicating.

| source | rows that assert a closure on the S0 surface | count |
|---|---|---|
| `S0-REVERIFY-1.md` job 1 | S0.1 · S0.2 · S0.2b (`PENDING_DELETION`) · S0.3 (`CALL`) · S0.3 (the `\r` strip) · S0.4 · S0.5 · S0.6 | **8** |
| `S0-REVERIFY-1.md` job 2 | findings 1–7 | **7** |
| `S0-REVERIFY-2.md` job 1 | finding 8 (`corpus.ts`'s raw NUL) — the one not carried from pass 1 | **1** |
| `S0-REVERIFY-2.md` job 2 | findings 1–3 | **3** |
| `S0-REVERIFY-3.md` job 2 | `minor` 1–6 — **open, not closed** | **6** |
| the pass-4 fix range (`b2a8aac`) | attack point 5's residual, the two-space remediation indent | **1** |
| `E-gates-instruments.md` job 1 | `.11.12.11` · `.11.12`/B-J2-3 · `.11.13.3` · `.11.12.12` · `.11.12.13` · `.11.12.14` · `.11.13.4`'s shape | **7** |
| `E-gates-instruments.md` job 2 | 1 · 1b · 2 · 3 · 4 | **5** |
| `C-import-bridge-backup.md` | B-J2-3 · job 2 finding 3 · job 2 finding 4 | **3** |
| **raw total** | | **41** |

**Deduplicated to 33 distinct closures.** The collapses, named so the count can be audited: `E-J2-1`→S0.2 ·
`E-J2-1b`→S0.3 · `E-J2-2`→S0.4 · `E-J2-3`/`.11.12.14`→S0.1 · `C-B-J2-3`+`C-J2-3`→S0.6 · `C-J2-4`→S0.5 ·
`R1-J2-2`≡`R2-J2-1` · `R1-J2-4`≡`R2-J2-2` (each pass-1 major was re-filed by pass 2 as the same class).
**Four rows were then ADDED** that no source file files as a finding but that this job exists to surface:
the `MAX_UNTOKENISED` and `HOSTILE_FLOOR` constants' own downward-only rules, the absence of any test over
`scripts/`, and `lint:gate-freshness`'s absence from every automated chain. **37 rows follow.**

---

## The guard table

⛔ **`GUARDED` requires a named assertion**, not a file. Each row says which assertion carries it and
whether an **earlier assertion in the same test reds first** — a test that reds early never exercises its
later assertions.

### GUARDED — 11

| # | finding | closed at | the guard | reds on the ORIGINAL defect? | verdict |
|---|---|---|---|---|---|
| 1 | **S0.1 · M12** — a postmortem ABOUT ids counted as the closure FOR them | `2b10a6c` | `scripts/check-audit-closure.ts:271` `p68Untokenised.length > MAX_UNTOKENISED.p68` → `:286` `process.exit(1)`; registered `scripts/run-gates.ts:44`, CI `.github/workflows/web-e2e.yml:92` | ✅ **Measured.** I appended one line of prose naming `M1-3` (a currently-missing P6.8 major) to a scratch copy of the log: `❌ P6.8 untokenised-closure cap: 49 … (cap 48)`, **exit 1**. The `[D37]` branch at `:200` cannot be exercised — `missing` is 0 and untokenised already sits at 55 = cap. **Earlier assertion:** `:190` (`missing.length > 0`) reds first only when a finding is *un*traceable, the opposite direction; it does not pre-empt this. | `GUARDED` |
| 2 | **S0.2b** — `PENDING_DELETION` outliving its reason | `2b10a6c` | `scripts/check-month-arithmetic.ts:192-197` — `existsSync` over the four legacy paths → `process.exit(1)` | ✅ The class is *the exemption going stale invisibly*; the assert reds the day P6.11 deletes the tree. **Earlier assertion:** none — the `if` at `:193` is the first exit path in the file (`process.exit(1)` at `:197`). ⚠️ It runs **before** the real-hit report at `:201`, so on that day an operator with a genuine offending site sees only the exemption error (pass 1's `minor`, unchanged). | `GUARDED` |
| 3 | **S0.4 · M13** / `.11.12 · B-J2-3` / `E-J2-2` — the migration audit computed a verdict and discarded it | `2b10a6c` + `b03e0d3` | `apps/rn/src/data/migrationAudit/audit.test.ts:188-192` — reads `__filename`, asserts `/\n\s*verdict\(rows, drift, byCause\.size\);/`; called from `:41`, invoked at `apps/rn/src/testing/runAppTests.ts:229`, CI `web-e2e.yml:103` | ✅ Three assertions carry **different** halves: `:150-152` the invariants fire · `:160-162` and `:170-172` `verdict()` throws on a violation and on drift · `:188-192` `run()` still calls it. The `.11.12` defect (report-only) is carried by `:160`; the S0.4b defect (the call deleted) by `:188`. **Earlier assertion:** `:150` fires first, but only if the invariants themselves are gutted, so it masks neither. | `GUARDED` |
| 4 | **S0.5 · M14** / `C-J2-4` — a wholly-refused corpus was the pass condition | `2b10a6c` | `apps/rn/src/data/migrationAudit/hostile.test.ts:106-109` — `openedFile >= HOSTILE_FLOOR && openedKeys >= HOSTILE_FLOOR` | ✅ The original defect is *32 cases that stop being recognised*; that drives `openedFile` to 0 and `assert` throws. **Earlier assertion:** `:54` (`CASES.length >= 20`) and `:64` (per-case blob) both run first — and neither fires here, because the fixture file is intact and only the *doors* stop opening. That is precisely the distinction `:90-94` documents. Correctly ordered. | `GUARDED` |
| 5 | **S0.6 · M16** / `C-J2-3` / `C-B-J2-3` — deleting the goal stand-down violated none of the invariants | `2b10a6c` + `b03e0d3` | `invariants.ts:214-230` (⑨) firing into `audit.test.ts:119-124` (`verdict()` throws) | ✅ **Measured** (`p4b/probe1.ts`). The corpus reaches the branch — 20 pace-axis cases — and as shipped `goals[1]` emerges `priority:false` with the pace deleted, `checkAll` = `[]`. With the stand-down simulated away, ⑨ returns `goals[1] is priority with priorityPerPaycheck -1 — reads as UNCAPPED` (likewise for `0` and `""`), `rows` is non-empty, `verdict()` throws. **Earlier assertion:** `:37` (`cases.length < 100`) and `:69-71` (the healthy control) both run first and both pass, so `:119` is genuinely reached. | `GUARDED` |
| 6 | **`R1-J2-4`/`R2-J2-2`, gate 1 of 3** — `check-sandbox-writes` carrying the right stripper variant | `b03e0d3` | `scripts/check-sandbox-writes.ts:135` (`stale`) → `:152-157` `process.exit(1)`; registered `run-gates.ts:46` | ✅ **Measured, by blinding it.** Shipped: `✅ 24 sanctioned appStore consumers`. Swapped to `stripCommentsAndStrings`: `❌ 24 STALE allow-list entr(y/ies)`, **exit 1**. Blanked entirely: identical. **Earlier assertion:** `:137` short-circuits to `exit(0)` only when `offenders` **and** `stale` are both empty, so the stale branch is not pre-empted. `:115-118` records this wrong pick being made once and caught by `lint:rn` — reproduced. | `GUARDED` |
| 7 | **gate 2 of 3** — `check-destructive-writes` carrying the right variant | `b03e0d3` | `scripts/check-destructive-writes.ts:159-174` — declared `sites` vs. actual, failing in **both** directions | ⚠️ **Measured, and it is half a guard.** Blanked entirely: `❌ 6 ALLOWED entr(y/ies) no longer match the code` (`store.ts sanctioned: 2 found: 0` …), **exit 1**. Swapped to the *wrong variant* (`stripCommentsOnly`) it stays `✅ 7/7`. So it catches total blindness, not the specific mis-pick. **Earlier assertion:** `:142` (offenders) reds first only when an *unsanctioned* site exists; a blinded run has none, so `:163` carries it. | `GUARDED` |
| 8 | **gate 3 of 3** — `check-copy-owners` carrying the right variant | `b03e0d3` | `scripts/check-copy-owners.ts:101` `process.exit(1)` | ⚠️ **Measured: blanked entirely → `❌ copy owners: 4 closure(s) no longer wired to their owner`, exit 1.** It self-guards because it is the one **must-contain** gate in the set — which is also why pass 3's `minor` 4 calls its polarity backwards: leaving *more* text in makes it *easier* to pass, so it guards the blind direction and not the permissive one. | `GUARDED` |
| 9 | **`.11.12.11 · D-J2-2`** — a required `ready` field that gated nothing | `.11.12.11` | `npm run typecheck:tests` (`package.json:48`) inside `typecheck` (`:49`), CI `web-e2e.yml:89`; `apps/rn/tsconfig.tests.json` present at the pin | ✅ `SURFACES` is annotated `Surface[]`, so an entry missing `ready` is TS2741 **at the object literal**; the original defect was nine such entries. **Earlier assertion:** none — `tsc` reports every error, so nothing reds first. | `GUARDED` |
| 10 | **`.11.13.3`** — a cast that only compiled because nothing typechecked | `.11.13.3` | the same `typecheck:tests` project; `apps/rn/tests/embed/zero-egress.spec.ts` is in its include set | ✅ Reverting the cast is a type error in a project CI compiles. Same no-earlier-assertion property. | `GUARDED` |
| 11 | **`.11.12.12 · D-J2-3`** — a FILE-level allow-list admitted a second unguarded `importStore` | `.11.12.12` | `scripts/check-destructive-writes.ts:159-174`, registered `run-gates.ts:45`, CI `web-e2e.yml:92` | ✅ For the **class**: a second call in a sanctioned file makes `actual = 2` vs `declared = 1` → exit 1; a removed one makes `actual = 0` → exit 1. ⚠️ For the fix's **own removal** there is nothing — `GAP-16`. **Earlier assertion:** `:142` (offenders) fires only on an unsanctioned file. | `GUARDED` |

### GAP — 18, ordered by what they protect

⛔ **Each row's last column is the assertion S0.13 has to build.** It is written to be buildable, not to
be a complaint.

| # | finding | closed at | why nothing standing catches it | what the guard would have to assert |
|---|---|---|---|---|
| **GAP-1** | **S0.6b / `R1-J2-6`** — invariant ⑨ was unreachable on all 554 cases; the fix was a 10-line loop in the corpus | `b03e0d3` | **Measured:** `corpus.ts:206-215` is the *only* thing that puts a damaged pace on a goal whose pace governs (`goals[1]`, not `[0]` — `[0]` is the exempt emergency fund). Delete that loop and the corpus goes 542 → 522, ⑨ evaluates nothing again, and the only floor is `audit.test.ts:37` (`cases.length < 100`). **The whole repo stays green.** This is the highest-value gap in the file: the branch it protects is the one `migrations.ts:228` calls *"the only finding in that pass that reaches a user's money."* | A **reachability floor** in `audit.test.ts`: count outcomes in which a goal row reaches ⑨'s predicate (`priority === true` and a defined pace) and assert `>= 1000` (pass 2 measured 1,008). Downward-only, same shape as `HOSTILE_FLOOR`. |
| **GAP-2** | **`R2-J1-6`'s named residual** — deleting `priorityGoalIsCapped` (or any invariant) from `INVARIANTS` | `b03e0d3`, recorded `CLOSED-UNPINNED` | **Measured at `613adf2`:** `grep -rn INVARIANTS apps/rn/src` → 6 sites; `INVARIANTS.length` is **printed** at `audit.test.ts:61` and `hostile.test.ts:81` and **asserted nowhere**. And `selfCheck`'s poisoned outcome carries `store: null`, so 8 of 9 invariants short-circuit — the suite's own line reads `(1 on a poisoned outcome)`. **The self-check covers 1 of 9.** | One purpose-built poisoned outcome **per invariant**, asserting each fires; plus `INVARIANTS.length >= 9` as a downward-only floor. That turns `selfCheck`'s 1-of-9 into 9-of-9 and is the same block, extended. |
| **GAP-3** | **`.11.12 · C-B-J2-3`** — `moneyKeepsItsType` looked at no goal field | `.11.12` | `invariants.ts:100` `GOAL_MONEY_FIELDS` and `:120` `check(o.store.goals, 'goals', GOAL_MONEY_FIELDS)` catch nothing on the live corpus (the suite is green), so **deleting them is silent** — the same shape as GAP-2, and named separately because it is the field list `.11.12` added and the one both real goal-money defects lived behind. | The GAP-2 harness, with one of its poisoned outcomes carrying a **string** `goals[0].targetAmount` — the exact probe `C-import-bridge-backup.md:270-271` ran once by hand. |
| **GAP-4** | **S0.1b / `R1-J2-1` / `R2-J2-3` / `.11.12.14`** — `stripMarkdownCode`, and the four spellings of "markdown code" | `b03e0d3` + `1782769` | ⚡ **[D67] named this as an expected gap. It is worse than named, and both halves are measured.** ① Reverting to the first cut (` ``` ` fences + single-backtick spans only) mints **0** tokens today — zero live exposure, so the regression is *silent*. ② **Removing `stripMarkdownCode` entirely mints 4 fabricated closure ids** (`L5-5 M2-1 L0-1 …`) **and `lint:closure` stays green**, because a fabricated closure *lowers* the untokenised count and the caps are upper bounds. ③ ⚡ **New, and measured:** one plain-text `[closes: M2-1]` takes the P6.8 count 48 → 47, i.e. **each fabricated token buys one unit of headroom against the guard in GUARDED-1** — with it in place, the prose rescue that redded on its own now passes (`48 ≤ 48`, exit 0). | A fixture string carrying the token in **every** spelling — plain, bullet, table cell, blockquote, ` ``` `, `~~~`, indented, inline spans of 1–3 backticks, `<code>`, `<pre>`, HTML comment — asserting `explicit` is exactly the set of the plain ones. Plus a **downward-only assertion on `explicit.size`** so a newly-minted token cannot silently buy cap headroom. |
| **GAP-5** | **the pass-4 fix itself (`b2a8aac`)** — the P6.8 remediation line's six-space indent | `b2a8aac` | Nothing reads the gate's own stderr. Reverting `:283` to two spaces restores the finding pass 3 filed at attack point 5, and no test, gate or CI step observes it. *(Pass 3 rated the consequence inert; that is a severity judgement, not a guard.)* | The GAP-4 fixture, extended: run the gate's own two remediation strings through `stripMarkdownCode` and assert both are blanked. |
| **GAP-6** | **`MAX_UNTOKENISED` is "downward only"** *(added row — no source file files this)* | — | `scripts/check-audit-closure.ts:145-149` states the rule in a docstring: *"Raising either number to make a gate pass is the defect this gate exists to catch."* **Nothing enforces it.** The comparison is `>` (`:200`, `:271`), so a cap raised by hand is indistinguishable from a cap that was always that size. | Fail when `d37Untokenised.length < MAX_UNTOKENISED.d37` with *"lower the cap"* — the same one-line ratchet `E-gates-instruments.md:229-238` prescribes for `HAND_PARSE_BASELINE`. It makes the cap self-ratcheting instead of self-described. |
| **GAP-7** | **`HOSTILE_FLOOR` is "downward only"** *(added row)* | — | `hostile.test.ts:27-32` says *"Never raise it to make a run pass"* — but the failure mode is the reverse: **lowering** it to absorb a fixture that stopped opening. `CASES.length` is 32 and the floor is 32, so any lowering is pure slack, and nothing compares the two. | `HOSTILE_FLOOR === CASES.length` while the corpus is intended to open wholly, or a committed floor record the test compares against. |
| **GAP-8** | **`R1-J2-4`/`R2-J2-2`, gates 4–10 of 10** — the remaining strip-using gates carrying the right variant | `b03e0d3` | ⚡ **[D67]'s second expected gap, and it is not one gap — it is six.** **Measured, every gate blinded to a stripper that blanks the file:** `check-glossary` ✅ green · `check-money-format` ✅ green · `check-local-dates` ✅ green · `check-press-opacity` ✅ green · `check-native-a11y-props` ✅ green · `check-apostrophes` ✅ green · `check-month-arithmetic` ✅ green. **Seven of ten report a pass while reading nothing.** ⚠️ Three of them print a number that is *false as printed*: `local dates: … 0/41 hand-written local parses (not rising)`, `press opacity: 377 files, every control state on a token`, `month arithmetic: 628 files, no setMonth/…`. | A **hit floor** per gate — the count each gate finds today, asserted downward-only, exactly as `check-destructive-writes` already does per file (`:159-174`). A gate that finds nothing has either fixed the class or gone blind, and only the gate can tell you which. |
| **GAP-9** | **`R1-J2-2` / `R2-J2-1`** — `stripCode.ts` modelling regex literals | `1782769` | **Measured at `613adf2`: `scripts/lib/stripCode.ts` has no test.** `grep` over every `*.test.ts(x)`, `*.spec.ts` and `test*.ts` in the repo → **0** references to it or to either export. Pass 3's decisive result — 0 LOST / 0 GAINED across ten gates under both strippers — means the gates' verdicts are *insensitive* to the regex branch today, so reverting it is silent by construction. | A unit test over `lib/stripCode.ts` with the corpus's own constructs — a regex after `=`/`(`/`,`/`return`, a backtick **inside** a regex body, `a / b / c`, `{a:1}.a / 2 / 3`, a JSX closing tag, a shebang — asserting exact output, plus the invariant pass 3 leaned on implicitly: **line count and line length are preserved.** |
| **GAP-10** | **S0.2 · M10 / `E-J2-1`** — `check-month-arithmetic`'s five spellings and `constructorOverflow` | `2b10a6c` | Pass 1 measured **0 live sites** in the three added spellings, so reverting `BANNED` to the two-spelling form changes no verdict. No test exists over the gate. | A fixture corpus in the gate's own test: one line per banned spelling (`setMonth`, `setUTCMonth`, `setFullYear`, `setUTCFullYear`, the overflowing `new Date(y, m±n, d.getDate())`) asserted to flag, and the exempt idioms (`addMonths.ts:25`'s day-`1`, `:27`'s day-`0`, `clampDay`) asserted to stay clean. |
| **GAP-11** | **S0.3 · M11 / `E-J2-1b`** — `check-destructive-writes` matching the **identifier** rather than a call shape | `2b10a6c` | ⚡ **Measured, not inferred.** I reverted `CALL` (`:115`) to the pre-M11 call shape `/(?<![\w$])importStore\s*\(/` and ran the gate: **`✅ 7/7 importStore sites sanctioned across 6 files`, exit 0.** The identifier widening is silently revertible. | The same fixture idea: a scratch file declaring `importStore?.()`, `const alias = importStore`, `obj['importStore']()` and `importStore.call(…)`, asserted to be counted — the four spellings `:100-114`'s docstring tabulates. |
| **GAP-12** | **S0.3 / `R1-J2-3`** — the `\r` sweep; 30 sites moved to `split(/\r?\n/)` | `b03e0d3` | **Measured:** no lint rule, eslint rule or gate bans `split('\n')` anywhere in the repo (0 hits for such a rule; the sweep itself is 0 hits, which is the *state*, not a *guard*). ⚠️ And **CI is `ubuntu-latest`** (`.github/workflows/web-e2e.yml:45`), an LF-only tree — so a reintroduced `split('\n')` or unflagged `.*$` **cannot** red in CI even in principle. It reds only on a Windows clone, which is where the defect was found. | An eslint `no-restricted-syntax` rule (or a one-screen gate) banning `split('\n')`, `split("\n")`, `split(/\n/)` and `/…\.\*\$/` without the `m` flag across `scripts/`, `apps/`, `packages/` and `.github/`. |
| **GAP-13** | **`R1-J2-7`** — `gateSources.ts` fingerprinting the four legacy trees | `b03e0d3` | Removing a root does not red anything standing: it changes the fingerprint, `lint:gate-freshness` reds **once**, and the next `gate:record` writes the new fingerprint and it is green forever after. Compounded by GAP-14. | `fingerprintSources().fileCount >= 789` as a downward-only floor — or, better, an assertion that **every directory any registered gate walks is inside `ROOTS`**, which is the actual invariant `:59-77` is trying to state. |
| **GAP-14** | **`lint:gate-freshness` runs in no automated chain** *(added row)* | — | **Measured:** it is absent from `run-gates.ts:32-58` (23 gates, deliberately — `check-gate-freshness.ts:4-10` explains the deadlock), absent from `validate:release:rn` (`package.json:50`), and absent from `.github/workflows/web-e2e.yml`. **The instrument that decides whether every other instrument's green describes this tree is invoked by hand only.** [D49]'s own failure mode — three sessions recording a green from memory — is unguarded against by anything except a human remembering to type it. | A CI step that runs `lint:gate-freshness` **after** `gate:record`, or a release-checklist gate that reds when the recorded fingerprint is older than `HEAD`'s. *(The deadlock argument rules it out of `lint:rn`, not out of CI.)* |
| **GAP-15** | **`.11.12.13 · D-J2-4`** — `strings-inventory --gate` discarding its own self-check | `.11.12.13` | `scripts/strings-inventory.ts:526-532` re-tests `badOrigins` and exits 1 **before** the `✅` at `:534` and the `process.exit(0)` at `:537`. `npm run lint:copy` is green today with `16 baselined` and **`badOrigins` empty**, so deleting the re-test changes no verdict. Nothing else observes it. | A `--self-test` mode (or a fixture run) that plants one bad origin and asserts `--gate` exits 1 — the `test-stamp-coverage.ts` pattern, one file over. |
| **GAP-16** | **no test exists over any gate on the S0 surface** *(added row — the structural half of eleven rows above)* | — | **Measured:** `scripts/` contains exactly **one** tested file — `stamp-coverage.ts`, via `scripts/test-stamp-coverage.ts` (`npm run test:stamp`, in `validate:release:rn` and CI `web-e2e.yml:97`), which plants inputs *and* reports `plant-applied=YES\|NO`. **None of the 23 registered gates, nor `lib/stripCode.ts`, `gateSources.ts` or `run-gates.ts`, has anything equivalent.** Every gate's own logic can therefore be reverted, narrowed or deleted with the whole repo green. | ⚡ **The pattern already exists in this repo and is the cheapest thing on this list to copy:** `test-stamp-coverage.ts`'s planted-input harness, applied per gate, with `plant-applied` reported so a plant that never landed cannot read as a blind gate. This single build subsumes GAP-9, GAP-10, GAP-11 and GAP-15. |
| **GAP-17** | **the rise-only baselines** — `HAND_PARSE_BASELINE`, `BARE_ANNOUNCE_BASELINE`, `apostrophe-baseline.json` | various | Each fires only on a **rise**: `check-local-dates.ts:107` is `if (handParseCount > HAND_PARSE_BASELINE)`; `check-native-a11y-props.ts:192` compares against a per-file baseline; `check-apostrophes.ts:300-302` computes `stale` and **only prints it**. Ground gained is silently re-spendable, and a baseline regenerated wider makes a red gate green with nothing objecting. ⚠️ `lint:apostrophes` reports `0 baselined` at the pin, so its baseline currently guards nothing either way. | Fail on the **fall** as well — *"you removed hand-parses, lower the baseline"* — and for the JSON baselines, refuse a regeneration that grows the set unless an explicit flag is passed. *(The cap half of this overlaps auditor A's job ② and is stated here only as it bears on the guard inventory.)* |
| **GAP-18** | **`R2-J1-8`** — `corpus.ts`'s raw NUL byte | `b03e0d3` | Closed by escaping, not by deletion. **Measured at `613adf2`: 0 raw NULs in `corpus.ts`, `DEBT_ELEVATION_LOG.md`, `DEBT_ELEVATION_PLAN.md` and `hostile-v16-cases.json`.** Nothing scans for them — and this class has already recurred once, the commit that removed one introducing another into the log. | A one-line gate: no committed `.ts`/`.md`/`.json` file contains a raw `U+0000`. Lowest value on this list and the cheapest to build. |

⚠️ **Written from experience, twice over now:** the first draft of this very row put a raw `U+0000` into
this report. Caught by counting bytes before saving. **`b03e0d3` did the same thing while documenting the
same removal** — the class has now recurred three times and every instance was in the prose describing it.

### N/A — 8

| # | finding | why there is nothing to guard |
|---|---|---|
| 1 | **`.11.13.4`'s shape** — *"a guard whose precondition another layer already enforces"* | `NOT-A-DEFECT`. The one candidate, `packages/core/debt/originalBalanceHighWater.ts:52`, was measured load-bearing — and it is pinned on both sides by `packages/core/debt/testOriginalBalanceHighWater.ts:68` (*"an unstamped debt seeds from its balance"*) and `:70` (*"a $0 unstamped debt is left alone"*). Nothing was closed, so nothing can regress. |
| 2 | **`E-J2-4`** — `debtPlannerStorage.ts`'s `originalBalance` docstring | **Not the S0 surface.** It is app code, filed by E under the escalated-comment clause as *"adjacent to my surface."* Recorded so pass 5 can see it was enumerated and deliberately excluded, not missed. |
| 3–8 | **pass 3's `minor` 1–6** — the JSX/`}` mis-guess · `KEYWORD_BEFORE_REGEX` dead code · `stripMarkdownCode` short by four · `check-copy-owners`' wrong stated reason · the stale `gate-status.json` at `1782769` · the corpus's key axis drawn from the artefact under test | **Open, not closed.** [D67] asks for a guard behind a *closure*; these six are recorded observations with no fix to protect. ⚠️ Two have since acquired a home here anyway: `minor` 3's residual is `GAP-4`, and `minor` 6's *"guarded one level down"* argument rests on `mapLegacyStore.test.ts:114-152` and `:209-223`, which **are** standing assertions — so if S3 ever closes `minor` 6, its guard already exists and should be cited rather than rebuilt. |

---

## Verified rather than inherited — [D67]'s four expected `GUARDED`s

⚠️ **The brief asked for these four to be opened rather than inherited. Two hold as stated; two split.**

| [D67] said | measured verdict |
|---|---|
| **invariant ⑨** is guarded | ⚠️ **Splits three ways.** The *branch it judges* is guarded — `GUARDED-5`, measured. **⑨'s own reachability is not** (`GAP-1`, new here). **⑨'s own deletion is not** (`GAP-2`; pass 2 recorded this half as `CLOSED-UNPINNED`). |
| **`HOSTILE_FLOOR`** is guarded | ✅ Holds — `GUARDED-4`, and the two earlier assertions in the same test were checked and do not pre-empt it. The constant's own downward-only rule is `GAP-7`. |
| **`selfCheck`** is guarded | ✅ Holds — `GUARDED-3`, the strongest guard on this surface: three independent assertions, one of which reads the file's own source to see a missing **call**. ⚠️ **Residual, named:** nothing asserts that `run()` still calls `selfCheck()` at `:41`; the guard cannot guard its own invocation. |
| **the caps** are guarded | ⚠️ **Splits, and measured in both directions.** The **rescue** direction reds (`GUARDED-1` — exit 1 on one line of prose). The **fabrication** direction does not (`GAP-4`), and each fabricated token buys a unit of headroom against the rescue guard. The cap's own downward-only rule is `GAP-6`. |

---

## Swept and found clean — the guard surface

Pass 5 ratchets off this list. Everything here was **opened and read at `613adf2`**, not inherited.

- **`apps/rn/src/testing/runAppTests.ts`** — the migration-audit layer is wired: `:229` `audit.test`,
  `:233` `interruption.test`, `:238` `hostile.test`, `:242` `cutoverFiles.test`, all `.default()`-invoked,
  so a throw becomes a non-zero exit.
- **`scripts/run-gates.ts:32-58`** — 23 gates (1 eslint + 22 `lint:*`); all ten strip-using gates are
  registered. `:68` `res.status === 0`, `:85` `process.exit(1)`. No gate registered twice, none missing.
- **`.github/workflows/web-e2e.yml:89-145`** — the every-push chain is `typecheck` · `lint:rn` ·
  `test:stamp` · `test:regression` · `test:app` · `test:scenarios` · `test:e2e:rn` · `test:e2e:embed`,
  i.e. every link of `validate:release:rn` except `gate:record`. **The only registered npm gates absent
  from both this and `lint:rn` are `lint:gate-freshness`** (`GAP-14`) **and `lint:webkit`** (the retired
  legacy lane).
- **`apps/rn/tsconfig.tests.json` exists at the pin** and `typecheck:tests` is inside `typecheck`
  (`package.json:48-49`), which CI runs — so `GUARDED-9` and `GUARDED-10` are live, not aspirational.
- **`invariants.ts:232-242`** — nine invariants; `checkAll` (`:244-246`) maps all nine. None is commented
  out or unreachable in the array.
- **`hostile.test.ts:35-38`** — `assert` throws rather than counting; `passed++` is a report, not a gate.
  `:54`, `:64`, `:106`, `:111`, `:112` are the five assertions and each was read for ordering.
- **`audit.test.ts:37`** — the generator floor (`cases.length < 100`) throws at **module scope**, before
  `run()`, so an emptied corpus cannot reach any later assertion.
- **Raw NUL bytes: 0** in `corpus.ts`, `DEBT_ELEVATION_LOG.md`, `DEBT_ELEVATION_PLAN.md` and
  `hostile-v16-cases.json` — counted byte-wise, not with `grep` (which reports line counts here and looks
  like a finding).
- **Gates run green on this tree while writing this file:** `lint:closure` (`55 of 55`, `48 of 48`,
  `0 explicit`) · `lint:destructive` (7/7) · `lint:sandbox` (24) · `lint:apostrophes` (0 baselined) ·
  `lint:local-dates` (41/41) · `lint:a11y-props` · `lint:copy` (16 baselined).
- **`scripts/test-stamp-coverage.ts` is the one existing planted-input harness over a `scripts/` file**,
  and it is registered (`package.json:57`, CI `web-e2e.yml:97`). It reports `plant-applied=YES|NO` beside
  every scenario. It is the template `GAP-16` should copy.

---

## Could not determine

- **Whether any of the seven blind-green gates (`GAP-8`) would red on a *partially* wrong stripper rather
  than a fully blinded one.** I measured the extreme — blank everything — because it is the only
  unambiguous probe, and pass 3 measured the specific mis-pick (31→0 / 42→0 / 30→0 / 20→0), which agrees.
  Neither of us measured a stripper that is *subtly* wrong, and that is the realistic regression.
- **Whether `selfCheck()`'s own invocation at `audit.test.ts:41` could be removed without anyone
  noticing.** No instrument sees it. Recorded as an observation rather than a gap because [D67]'s subject
  is closed *findings*, and none was ever filed against it.
- **Whether `MAX_UNTOKENISED` has ever been raised.** `git log -p` on the constant would answer it; the
  read-only scope and the brief's cwd-drift trap made a confident history claim more risk than value, and
  the answer does not change the gap.

---

## Count

**37 findings · 11 guarded · 18 gaps · 8 n/a.**

**The gaps, ordered by what they protect:**

| what it protects | gaps |
|---|---|
| **the user's money at the v1.6→v1.7 boundary** | `GAP-1` (⑨'s reachability) · `GAP-2` (any invariant's deletion) · `GAP-3` (the goal money fields) |
| **the closure ledger — i.e. P6.8.9's exit criterion** | `GAP-4` (fabricated tokens, and the cap headroom they buy) · `GAP-5` (the pass-4 fix itself) · `GAP-6` (the cap's downward-only rule) |
| **the corpus that proves a hostile restore is safe** | `GAP-7` (`HOSTILE_FLOOR`'s downward-only rule) |
| **every class the ten strip-using gates exist for** | `GAP-8` (seven of ten green while blind) · `GAP-9` (`stripCode.ts` untested) · `GAP-10` (month arithmetic) · `GAP-11` (the `importStore` identifier) · `GAP-12` (the `\r` sweep, invisible to an LF-only CI) |
| **whether any recorded green describes the tree it claims** | `GAP-13` (`ROOTS`) · `GAP-14` (`lint:gate-freshness` in no chain) |
| **the gates' own source** | `GAP-16` (no planted-input harness over any S0 gate — **subsumes GAP-9, -10, -11, -15**) · `GAP-15` (`strings-inventory`'s self-check) · `GAP-17` (rise-only baselines) |
| **the ledger's readability** | `GAP-18` (raw NULs) |

⚡ **If S0.13 builds one thing, build `GAP-16`** — a planted-input harness per gate, copying
`test-stamp-coverage.ts`. It closes four of the eighteen outright and gives the rest somewhere to live.
⚡ **If it builds two, add `GAP-1`** — a ten-line reachability floor in front of the only branch on this
surface that reaches a user's money.

