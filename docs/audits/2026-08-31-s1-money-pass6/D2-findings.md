# D2 findings — proof machinery and ledgers (pass 6)

## D2-1 — `measured`/`sha` never expire: 30 of 85 "EXECUTED" proofs were measured against a tree the target file has since left

**Severity:** major · **Origin:** `instrument` (`scripts/finding-guards.json`, `scripts/check-finding-guards.ts`)

**Consequence.** `lint:finding-guards` prints `proof: 85 EXECUTED …` and `prove:guards --list` prints
`<id> <cmd> (2026-08-30 @ 995946ca)` — read by a human as *"this guard was proven to red on this code."*
For 30 of the 85 it means *"…on code that has since been rewritten."* This is the pass-4 defect
(`lint:finding-guards` read as a closure proof for three passes) one level up: `measured` is now written,
and it is now the thing that decays.

**File and line.** `scripts/check-finding-guards.ts:330-358` (the only validation of a `proof` block is
`anchorCount(...) !== 1`); `scripts/prove-guards.ts:170-176` (`--list` prints `measured @ sha` with no
freshness test); the `MAX_AUTHORED` ceiling at `check-finding-guards.ts:188` is drained by
`prove-guards.ts:470-491` and **nothing ever pushes an entry back into `authored`.**

**Measurement.** For every entry carrying `proof.measured` + `proof.sha`, ran
`git log --oneline <sha>..HEAD -- <unfix.at>`. Non-empty for **30 entries**. Printed values, worst first:

```
S1P5-D5-9-CAPWRAP    scripts/check-finding-guards.ts   measured@b9ee9f90 (2026-08-30)  11 commits since
S1P4-D4-10-POINTER   package.json                      measured@995946ca (2026-08-30)   6 commits since
S1P4-C4-3-BOTHDIR..  scripts/check-trust-claims.ts     measured@995946ca (2026-08-30)   5 commits since
S1P3-G-LIVENESSLE..  scripts/check-trust-claims.ts     measured@995946ca (2026-08-30)   5 commits since
S1P4-C4-4-POPULAT..  scripts/check-trust-claims.ts     measured@2b438abb (2026-08-30)   4 commits since
S1P5-D5-13-DERIVEDPOP scripts/check-trust-claims.ts    measured@2b438abb (2026-08-30)   4 commits since
S1P4-D4-11-REACHABLE scripts/audit-route.ts            measured@995946ca (2026-08-30)   3 commits since
… 23 more at 1–2 commits
```
Registry totals measured the same run: **217 entries · 1 unguarded · 97 with a proof · 85 executed ·
12 authored-never-run · 0 guardOnly · 119 token-only.** Anchors: **0 VOID, 0 missing targets, 0 no-op
un-fixes** — the static half is clean, which is exactly why the stale half is invisible.

**Mechanism (hypothesis).** The anchor check is a *substring* test on one line. A file can be rewritten
around an anchor — the guard's assertion moved, weakened, or its consumer changed — while the anchored
string survives verbatim, so `anchorCount === 1` holds and the entry keeps its `EXECUTED` badge. The
ratchet is one-way by construction: `MAX_AUTHORED` only falls, so a recorded execution is permanent.
Nothing compares `proof.sha` to the target's last-touched commit.

**Control — and it weakens the claim honestly.** I re-ran **2 of the 30** stale entries with
`npm run prove:guards -- --id=S1P4-D4-10-POINTER,S1P4-D4-11-REACHABLE --no-record` (exit **0**):

```
✅ S1P4-D4-10-POINTER    plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
✅ S1P4-D4-11-REACHABLE  plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
```
`--no-record` was used and `cmp` confirms `scripts/finding-guards.json` was not written. **Both still
hold.** So this finding is NOT "30 dead guards" — it is that **the ledger cannot tell a held proof from a
stale one, and the only way to find out is to re-run it.** That is precisely the state
`prove:guards`'s own header calls out for the token: *"until a guard is proven to red, CLOSED and OPEN
are indistinguishable in the record."* `measured`/`sha` were added to end that, and they end it only for
the sha they were written on.

**Remedy (UNVERIFIED).** In `check-finding-guards.ts`, beside the anchor check, compare
`git log <proof.sha>..HEAD -- <u.at>` and bucket a proof whose target moved as `authored` (re-run needed)
rather than `proven`. ⚠️ Unverified, and it would red `lint:finding-guards` immediately at 30 over a
`MAX_AUTHORED` of 12 — the correct direction, but it is a triage decision, not a drop-in.

---

## D2-2 — every plant rewrites its whole target to LF: 60 of 62 proof targets are CRLF on disk, and one plant changed 202 of 203 lines

**Severity:** minor · **Origin:** `instrument` (`scripts/lib/anchor.ts`)

**Consequence.** A `prove:guards` plant claims to restore *one* defect. Measured, it restores one defect
**and converts the entire file from CRLF to LF**, so the planted run is handed a file in which almost
every line differs from the committed one. Every red it produces is attributed by `verdict()` on the
`expect` string alone; if a gate ever reports per-line or per-file diffs, or a formatter check lands, all
60 proofs red together for a reason that is not the defect. A run killed mid-plant (SIGINT, not an
exception — the `finally` at `prove-guards.ts:302` does not cover it) leaves a whole-file diff behind.

**File and line.** `scripts/lib/anchor.ts:45-50` — `planEdit` builds `next` from `body = lf(text)`, so the
returned text is LF for the whole file, not just at the anchor. `prove-guards.ts:297` writes it verbatim.

**Measurement.** Over all 97 proof blocks: **62 distinct un-fix targets, 60 of them contain `\r\n` on
disk** (`core.autocrlf=true` here). Concrete, `S1P2-B1-REASON` → `scripts/lib/verdict.ts`:

```
anchorCount = 1
original bytes = 12677   planted bytes = 12511
original lines = 203     lines differing original vs planted = 202
original has CRLF: true   planted has CRLF: false
```

**Mechanism (hypothesis).** `lf()` was introduced to make anchor *comparison* line-ending agnostic
(`anchor.ts:2-22`, the six-red-CI-pushes fix). The docstring at `anchor.ts:41-44` states the whole-file
normalisation is deliberate ("a plant that wrote back CRLF on one machine and LF on another would make
the *restore* platform-dependent"), but the restore in `prove-guards.ts:265-267` writes the captured
original bytes back, so the restore was never platform-dependent — the stated reason does not describe
the code that consumes it. ⚠️ Stated as a hypothesis: the comment is a carried premise, and I did not
find a caller for which the LF write-back is load-bearing.

**Measured non-consequence, stated so it is not over-claimed.** No gate in `package.json` currently
asserts file line endings (`lint:line-endings` tests the *stripper* against a `-text`-pinned fixture,
`scripts/test-line-endings.ts:37-52`), so today no proof reds for this reason. This is a latent property,
not an active false red.

**Remedy (UNVERIFIED).** Splice the replacement into the ORIGINAL text using the offset found in the
normalised body, so only the anchor's bytes change. Unverified.

---

## D2-3 — PLANTED: a blind money predicate collapses the route from 446 to 72 money-bearing files and `audit:route-check` still exits 0 with a ⭐

**Severity:** major · **Origin:** `instrument` (`scripts/audit-route.ts`, `scripts/lib/moneyClaim.ts`)

**Consequence.** The route is what a dispatch is built from — twelve manifests and a brief that says
*"620 files · 0 unrouted · 0 owed."* If `carriesMoneyClaim` goes blind, the router hands the lanes a
short route and announces `⭐ exit reachable: all N money-bearing file(s) … are in a lane` with a
green tick. The pass is then run to completion against a population that was silently gutted, and the
only instrument that can see it (`audit:read-coverage`) runs **at the exit**, after every lane has
finished. This is the same shape as `lint:finding-guards` being read as a closure proof — a green that
means "nothing was looked at."

**File and line.** `scripts/audit-route.ts:429-435` (`owed`, the `--unread-pass` completeness check) and
`scripts/audit-route.ts:549-560` (`owedByExit`, the `--exit-pass` check added today). **Both evaluate
`carriesMoneyClaim(f)` on the assertion side and are checked against a seed
(`seedStaleRead`, `audit-route.ts:408-415`) that evaluates the same predicate.** There is no
`MIN_MONEY_BEARING`-style floor anywhere in `audit-route.ts`.

**Measurement — planted.**
- `plant-applied`: YES. `scripts/lib/moneyClaim.ts:38`, `MONEY_RE` mutated so 42 of the 43 money words
  cannot match (`join('|')` → `join('D2PLANTZZZ|')` with a leading marker; `afford` survived the join,
  so the plant is *partial* and the result below is a lower bound on the damage).
- `planted exit` (`npm run audit:route-check`): **0** — green. Printed values, control → planted:

```
⭐ exit reachable:      446  →   72   money-bearing files the s1p6 exit demands
routed:                 622  →  499
by origin, stale-read:  338  →   51
lane A / B / C:     192/150/202 → 120/132/169
```
- `control exit` (same command, predicate restored): **0**, `446` money-bearing, `622` routed.
- **The control on the verifier:** the SAME plant, same moment, run against the sibling consumer —
  `npm run audit:read-coverage` exited **1**: *"only 72 of 484 file(s) read as money-bearing, and the
  floor is 424. The predicate has gone blind."* So the defect is real and detectable; `audit-route.ts`
  is the half that cannot see it.
- `reason`: the route's totality assertions filter their population by the predicate under test, so
  shrinking the predicate shrinks the demand and the supply together.
- **Restore verified:** restored from a copy taken AFTER the plant, `cmp` clean, `grep -c D2PLANTZZZ`
  = 0, `git status --porcelain -- scripts/lib/moneyClaim.ts` empty.

**Mechanism (hypothesis).** `check-pass-coverage.ts:94-110` documents this exact failure — *"If
`carriesMoneyClaim` ever goes blind … the exit reports every pass fully covered"* — and floors it at
`MIN_MONEY_BEARING = 424`. `S1.13.3` then extracted the predicate into `lib/moneyClaim.ts` so the router
and the exit would agree, and **the router got the predicate without getting the floor.** The
`--exit-pass` docblock (`audit-route.ts:533-547`) argues the check escapes the tautology class because
*"the population is the EXIT'S OWN, read from the claims JSON"* — that answers the *file-list* half
(markdown vs JSON, which `[D5-10]`'s stamp already pins) and leaves the *filter* half, which is the half
that moved here.

**Remedy (UNVERIFIED).** Import `MIN_MONEY_BEARING` — or a shared floor from `lib/moneyClaim.ts` — into
`audit-route.ts` and red when `exitPopulation.filter(carriesMoneyClaim).length` falls below it, so the
⭐ line cannot be printed over a collapsed population. Unverified; the floor's value is a second copy of
a number and should probably live beside the predicate, not in two callers.

---

## D2-4 — PLANTED: pass 6 cannot record its own coverage — `s1p6` is not in the claim vocabulary, so `lint:s1-coverage` reds on the file `record-reads` writes

**Severity:** blocker (of the pass's own exit; not of user money) · **Origin:** `instrument`
(`scripts/surface-coverage.ts` — `neighbour`/`instrument`; `scripts/record-reads.ts` — `s0-first-look`)

**Consequence.** The documented exit sequence for this pass is
`audit:record-reads` → `lint:s1-coverage` → `audit:read-coverage`
(`record-reads.ts:178-183` prints it as *"NEXT, AND NOT OPTIONAL"*). Step 1 writes the string `s1p6`
into `scripts/surface-coverage.s1.json`. Step 2 rejects every one of those entries, exits 1, and — because
it exits before the inventory write (`surface-coverage.ts:714-746`) — never restamps the inventory. Step 3
never runs, and `audit-route.ts:184-200` then refuses the inventory as STALE. **The pass records its
reads and then cannot close.** Every one of the twelve lanes' read-lists is affected at once.

**File and line.** `scripts/surface-coverage.ts:124` —
`const SWEPT_CLAIMS = ['p1','p2','p3','p4','g4','r10','r17','s1p1','s1p2','s1p3','s1p4','s1p5'] as const;`
The list stops at `s1p5`. `scripts/record-reads.ts:154` writes `claims[f] = [...list, pass].sort()` with
`pass` = `s1p6` (pinned in `package.json:49`, `audit:record-reads … --pass=s1p6`).

**Measurement — planted.**
- `plant-applied`: YES. Copied `scripts/surface-coverage.s1.json`, appended `s1p6` to exactly one entry
  (`apps/rn/src/analytics/funnel.test.ts` → `["s1p3","s1p4","s1p6"]`) — the literal edit `record-reads`
  performs — and handed it to the gate through its own `--claims=` plant seam.
- `planted exit`: **1**.
  `❌ s1-coverage: 1 claim value(s) outside the vocabulary.  apps/rn/src/analytics/funnel.test.ts → "s1p6"`
- `control exit`: **0** — same command against the real claims file:
  `✅ s1-coverage: 484 surface files classified · 69 unswept.`
- `reason`: `VALID_CLAIMS` (`surface-coverage.ts:125`) has no `s1p6`, and `badClaims` (`:610-623`) exits
  before anything is counted or written.
- Vocabulary census, both claims files, measured: s0 = `partial:54 s1p2:21 s1p5:26 p1:11 p3:20 s1p1:16
  s1p4:17 p2:7 never:17 p4:12 r17:7`; s1 = `s1p3:210 s1p4:106 s1p2:98 s1p5:88 r10:3 s1p1:62 partial:77
  never:151 r17:12`. **0 values outside the vocabulary today** — the gate is green precisely because
  nothing has recorded pass 6 yet.
- **Restore verified:** the probe claims file was written into this audit directory and deleted;
  `git status --porcelain -- scripts/` is empty and the real claims file was never opened for writing.

**Mechanism (hypothesis).** `record-reads.ts` is new today and was written against
`check-pass-coverage.ts`, which takes `--pass` as a free string and never validates it. The vocabulary
allow-list lives in a third file (`surface-coverage.ts`) that `record-reads.ts` neither imports nor
mentions. This is the two-producers shape the round has been collapsing everywhere else — *what is a
valid pass id* is stated once in `SWEPT_CLAIMS` and once implicitly by whatever `--pass` is handed — and
`lib/moneyClaim.ts` is the precedent for how it gets fixed.

**Remedy (UNVERIFIED).** Add `'s1p6'` to `SWEPT_CLAIMS`. ⚠️ That fixes this instance and not the class:
`s1p7`, `s2p1` and every future pass id re-open it. Better — and unverified — is for `record-reads.ts`
to import the vocabulary and refuse an unknown `--pass` **before** it writes, so the failure lands at the
step that can still be corrected instead of one step downstream on 446 entries at once.

---

## D2-5 — PLANTED: a suite's load-bearing control row can be deleted and BOTH gates stay green — `lint:import-graph` has no floor on its own assertion count

**Severity:** major · **Origin:** `s0-first-look` (`scripts/test-import-graph.ts`)

**Consequence.** `test-import-graph.ts` is the only thing pinning the `neighbour` origin — the origin that
routed **80 files** into this pass's lanes and that exists because `A-F4`'s sibling producer reached nobody.
Its rows can be deleted one at a time with `lint:import-graph` printing ✅ and `lint:finding-guards`
printing ✅. The suite reports a *count* of assertions and floors nothing, so *"21 assertions"* becoming
*"20 assertions"* is a green line, not a red one.

**File and line.** `scripts/test-import-graph.ts:24-29` (`passed` is incremented and printed, never
compared) and `:110-120` (the only exit condition is `failures.length > 0`). Contrast
`test-gate-plants.ts:555` (`MIN_SCENARIOS`), `check-finding-guards.ts:142` (`MIN_ENTRIES`),
`check-pass-coverage.ts:103` (`MIN_MONEY_BEARING`) — every sibling instrument carries a population floor.

**Measurement — two plants.**

Plant 1 — delete the three `A-F4` hop rows (`:85-87`):
- `plant-applied`: YES (`git status --porcelain` = ` M scripts/test-import-graph.ts`)
- `planted exit` `lint:import-graph`: **0** — `✅ import graph: 18 assertions · 2341 resolved edges`
- second instrument, same plant: `lint:finding-guards` exit **1** —
  `S1P4-A-F4-NEIGHBOUR — the guard is gone … no "hop 2 — the producer that did NOT change is routed"`
- `reason`: the registry token happens to name the **hop-2** row specifically.

Plant 2 — delete **only** `:86`, the row the docblock at `:66-71` calls the reason both halves exist
(*"a neighbourhood that returned everything would satisfy the first on its own"*):
- `plant-applied`: YES
- `planted exit` `lint:import-graph`: **0** — `✅ import graph: 20 assertions · 2341 resolved edges`
- `planted exit` `lint:finding-guards`: **0** — `✅ finding-guards: 216 of 217 findings carry a standing
  guard … 85 EXECUTED · 12 authored (cap 12) · 0 guard-only (cap 0) · 119 never tested (cap 119)`
- `control exit`: **0**, `✅ import graph: 21 assertions`.
- `reason`: **fully silent in both gates.** `S1P4-A-F4-NEIGHBOUR`'s token pins one of the three rows; the
  other two, including the non-vacuity control, are pinned by nothing.
- **Restore verified** after each plant: `cmp` against a copy taken AFTER, `grep -c D2PLANTZZZ` = 0,
  `git status --porcelain -- scripts/` empty.

**Mechanism (hypothesis).** A guard token is a *deletion detector for one line* — the registry's own
framing. A suite of N independent rows therefore needs N tokens or one count floor, and it has one token.
`check-scan-floors.ts` would have demanded a floor here, but its population is *"scripts importing
`./lib/stripCode`"* (`check-scan-floors.ts:9-11`) and this file does not, so the class-closing gate does
not reach it.

**Remedy (UNVERIFIED).** Add a downward-only `MIN_ASSERTIONS` beside `passed`, in the `MIN_SCENARIOS`
idiom. Unverified, and it is the instance fix — the class is *"a self-written suite with no floor on its
own row count,"* and `check-scan-floors.ts`'s population is the natural place to widen.

---

## D2-6 — `audit-sublanes.ts` inherits D2-3's blind spot: the 12-way split's `⭐ exit reachable` is filtered by the predicate it is checking, with no floor

**Severity:** major · **Origin:** `s0-first-look` (`scripts/audit-sublanes.ts`, written today)

**Consequence.** The sub-lane split is what twelve auditors were actually handed. Its exit assertion
prints `⭐ exit reachable: all N money-bearing file(s) are in a sub-lane.` If `carriesMoneyClaim` goes
blind, `N` collapses and the line stays green and starred — the same failure D2-3 measures one level up,
so **both** halves of the dispatch chain go quiet together and the only floor is at the far end of the
pass.

**File and line.** `scripts/audit-sublanes.ts:142` —
`const exitPopulation = new Set(Object.keys(claims).filter(carriesMoneyClaim));` — and `:183`,
`exit: files.filter((f) => exitPopulation.has(f)).length`, compared at `:198`
(`if (totalExit !== exitPopulation.size)`). Both sides of that comparison are filtered by the same
predicate. There is no `MIN_MONEY_BEARING` equivalent anywhere in the file.

**Measurement.** Not separately planted — the predicate is the single import at `:42` and the plant in
D2-3 is the same edit. Structurally: shrinking `carriesMoneyClaim` shrinks `exitPopulation` and every
`r.exit` by the identical set, so `totalExit === exitPopulation.size` is preserved. Stated as
**derived from D2-3's measurement, not independently measured** — the honest label.

**What the check DOES catch, so the finding is not over-claimed.** `:191` (`totalFiles !== grandTotal`)
and `:198` compare the on-disk parent manifests against the claims JSON, which are genuinely two
producers. A sub-lane spec edit that drops a file reds. The hole is only the predicate axis.

**Second, smaller hole in the same file.** `assigned` (`:161`) is re-created inside the per-parent loop,
so the duplicate refusal at `:166` is **per parent**. A file listed in two different `ROUTING-<parent>.txt`
manifests is counted twice by both `grandTotal` and `totalFiles`, so `:191` cannot see it; `:198` catches
it only if the file is money-bearing. `audit-route.ts:508` currently makes cross-parent duplicates
impossible, so this is latent, not live.

**Remedy (UNVERIFIED).** Same as D2-3 — a shared floor beside the predicate, asserted by every consumer.
Unverified.

---

## D2-7 — `MIN_SCENARIOS` is a `<` floor in the harness that plants the `<`-floor defect elsewhere

**Severity:** minor · **Origin:** `instrument` (`scripts/test-gate-plants.ts`)

**Consequence.** Latent slack. `test-gate-plants.ts:733` reads `if (SCENARIOS.length < MIN_SCENARIOS)`,
so scenarios may be **added** without the floor following. Once the count is above the floor, that gap is
room a later deletion hides in — which is `[M8]` verbatim, the defect this same file plants against
`check-finding-guards.ts` in its `lint:finding-guards [M8]` scenario (`:304-314`, expect
`"Entries were REMOVED"`), and which `check-finding-guards.ts:390` fixed for itself by moving to `!==`
with the recorded reasoning *"a floor that trails the count is slack a deletion can hide in."*

**File and line.** `scripts/test-gate-plants.ts:555` (`const MIN_SCENARIOS = 24;`) and `:733`.

**Measurement.** Counted by hand against the source: 11 scenarios before `...B1_SCENARIOS`
(`:362-497`), 11 in `B1_SCENARIOS` (`:144-359`), 2 after (`:511-550`) = **24**, and `MIN_SCENARIOS = 24`.
**The slack is 0 today**, so nothing is currently hidden and this is not planted — a plant would have to
first add a scenario, which is a change to the subject rather than a measurement of it. Reported as the
class recurring, not as a live hole.

**Mechanism (hypothesis).** `MIN_SCENARIOS`'s own comment cites `MIN_CHECKS` in
`preflight-native-lane.ts` as its model, and `MIN_CHECKS` predates the `[M8]` strictness decision. The
`[M8]` fix was applied to the file that was found, not to the class — `iterate-the-class` in the
instruments.

**Remedy (UNVERIFIED).** `!==` with the two-directional message `check-finding-guards.ts:390-399` already
writes. Unverified; it makes adding a scenario a two-line edit, which that file argues is the feature.

---

## D2-8 — `lint:runner-completeness` closes "a test in no runner" for two trees and is blind to `scripts/`, where a live instance sits

**Severity:** major · **Origin:** `instrument` (`scripts/check-runner-completeness.ts`) · `s0-first-look` (`scripts/test-conform-assertions.sh`)

**Consequence.** `D5-12`'s measurement was *"a file throwing on line 1, wired into nothing, and `npm run test:app` printed ✅ ALL PASSED."* The gate written to end that reads two pathspec sets and neither covers `scripts/`, which is where **six of the repo's eight test-shaped instrument files live** — including the harnesses that certify every other gate. A test there can be added, or stop being run, with `lint:rn` green.

**File and line.** `scripts/check-runner-completeness.ts:76-89` — `RUNNERS` is `['apps/rn/src/**/*.test.ts', 'apps/rn/src/**/*.test.tsx']` and `['packages/core/**/test[A-Z]*.ts']`. `scripts/test-gate-plants.ts:180-185` plants its proof of this gate into `apps/rn/src/store/__gate_plant_unwired__.test.ts` — inside one of the two covered populations, so the scenario cannot discover the third (`ASK WHICH MEMBER OF ITS CLASS A TEST PICKED`).

**Measurement.** Enumerated `git ls-files 'scripts/test-*' 'scripts/*compare*'` and asked of each basename whether `package.json` names it:

```
WIRED    scripts/test-closure-stripper.ts      (lint:closure-stripper)
WIRED    scripts/test-gate-plants.ts           (test:gate-plants)
WIRED    scripts/test-import-graph.ts          (lint:import-graph)
WIRED    scripts/test-line-endings.ts          (lint:line-endings)
WIRED    scripts/test-stamp-coverage.ts        (test:stamp)
WIRED    scripts/test-strip-code.ts            (lint:strip-code)
UNWIRED  scripts/test-conform-assertions.sh
UNWIRED  scripts/compare-ios-screenshots.mjs
```
Widened to every reference in the tree: `git grep -l test-conform-assertions.sh` returns **9 tracked files, all of them prose** — `docs/DEBT_ELEVATION_LOG.md`, four audit manifests and three inventories. **No workflow, no `package.json` script, no other script.** Same for `compare-ios-screenshots.mjs` (8 files, all prose or routing manifests).

**And the un-wired test is the one whose docstring says it must be run.** `scripts/test-conform-assertions.sh:12-14`: *"a guard whose success is indistinguishable from its failure cannot be reviewed by reading it. **It has to be run.**"* It was written after `conform-app-preview.sh`'s black-frame check *"aborted the build by passing"* — and it is executed by nothing. I ran it by hand: exit **0**, `✅ conform assertions: 5 passed.` So it works; nothing runs it. `conform-app-preview.sh` itself IS live (`.github/workflows/app-preview.yml`), which is what makes the gap material rather than academic.

**Mechanism (hypothesis).** `RUNNERS` is an enumeration of *runner + pathspec* pairs, and this project's recorded oldest defect is that an enumeration is blind to what it omits (`audit-route.ts:8-12`). The two pairs describe the two trees that have runners; `scripts/` has no runner — its "runner" is `package.json`'s script map — so the shape did not fit and the population was left out rather than modelled.

**Remedy (UNVERIFIED).** Add a third `RUNNERS` entry whose "runner" is `package.json` and whose pathspec is `scripts/test-*.{ts,sh,mjs}`, matching on basename presence in the script map. Unverified, and it will red immediately on the two files above — which is the point.

---

## D2-9 — `compare-ios-screenshots.mjs` auto-captures a missing baseline and passes, its baselines live in the tree `P6.11` deletes, and its only documented invocation has the arguments backwards

**Severity:** major · **Origin:** `s0-first-look` (`scripts/compare-ios-screenshots.mjs`)

**Consequence.** Three compounding facts, each measured:

1. **A missing baseline is captured and passes** — `compare-ios-screenshots.mjs:55-61`. `currents.length === 0` reds (`:42-45`), but `compared === 0` does not: with every baseline absent the script prints `0 compared · N new baseline(s).` and exits **0**. There is no floor on `compared`, so the gate cannot tell "no regression" from "no baseline to regress against."
2. **The baselines are in the tree scheduled for deletion.** `BASELINE_DIR = "tests/ios-baselines"` (`:22`); `git ls-files tests/ios-baselines` = **4 PNGs**. `surface-coverage.ts:397` lists `tests` in `NOT_SOURCE` as *"legacy Next surface — deleted at P6.11."* When `P6.11` runs, fact 1 turns this gate into a permanent silent pass rather than a red.
3. **Nothing runs it, and the one document that describes how has it wrong.** `git grep -l compare-ios-screenshots.mjs` → 8 tracked files, all prose/routing. `docs/IOS_SIM_SMOKE.md:50` writes the call as `scripts/compare-ios-screenshots.mjs baseline/ artifacts/ --threshold 0.1` — but the script's signature is `[currentDir] [baselineDir]` (`:21-22`), so those are **reversed** (it would treat the committed baselines as the fresh capture), and `--threshold` is parsed by nothing; `PIXEL_THRESHOLD`/`MAX_DIFF_RATIO` are literals at `:24-25`.

**Measurement.** As cited above — file/line reads plus `git ls-files` and `git grep -l` over tracked files only. Not planted: an unrun gate has no exit code to plant against, and creating a run for it would be a fix.

**Mechanism (hypothesis).** Bootstrap-on-first-run is a reasonable ergonomic for a gate a human babysits and a fail-open for a gate in CI. It was written for the first case (`docs/IOS_SIM_SMOKE.md`'s manual smoke test) and the wiring never landed, so the ergonomic is now the whole behaviour.

**Remedy (UNVERIFIED).** Either delete it with the legacy tree at `P6.11`, or move the baselines out of `tests/` and add a `MIN_COMPARED` floor plus an explicit `--bootstrap` flag so an unattended run cannot capture. Unverified — and which of the two is a scope decision, not a code one.

---

## D2-10 — `D5-14`'s fixture fix reached `cycleHistory` and left two siblings: `completedRecommendedActions` and `lastSavedAt` still never reach the v1.7 cutover envelope

**Severity:** minor · **Origin:** `instrument` (`scripts/make-cutover-backups.ts`)

**Consequence.** `docs/cutover/v17-envelope.json` is the round-trip fixture for the new build — what a device session proves a real portfolio survives on. It is missing a live `DebtStore` field, so the round trip cannot fail on that field, and `cutoverFiles.test.ts` asserts three things about the envelope and none of them is field coverage.

**File and line.** `scripts/make-cutover-backups.ts:90-126` — `v17Envelope()` copies fields off `v16Populated()` one at a time. `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts:116-123` is the whole v17 block: `store !== null`, `checkAll(...).length === 0`, `paycheck.amount === '3247'`.

**Measurement.** Field sets read from the committed fixtures:

```
v16-populated keys : amount, completedRecommendedActions, currentDate, cycleHistory, debts, exportedAt,
                     goals, lastSavedAt, livingExpenses, monthlyPayDay, nextPaycheckDate, payCycle,
                     payoffStrategy, requiredExpenses, semiMonthlyFirstDay, semiMonthlySecondDay, version
v17.store keys     : cycleHistory, debts, goals, livingExpenses, paycheck, payoffStrategy, prefs,
                     requiredExpenses, storeVersion

v16 fields reaching NEITHER v17.store NOR v17.store.paycheck:  completedRecommendedActions, lastSavedAt
```
`completedRecommendedActions` is a real store field — `apps/rn/src/data/defaults.ts:41` — and the v16 block of the test asserts it is an array (`cutoverFiles.test.ts:34`), so the two fixtures disagree about whether it matters.

**Mechanism (hypothesis).** The `D5-14` docblock (`make-cutover-backups.ts:114-121`) states the class exactly — *"`v17Envelope()` copies fields off `v16Populated()` one at a time, so a field added to the v1.6 fixture does not reach the v1.7 one"* — and then fixes the one member that was reported. `ITERATE THE CLASS, NEVER THE MEMBER YOU FOUND`, in the fix for a finding about exactly this.

**Remedy (UNVERIFIED).** Build the envelope's `store` by *spreading* the v1.6 portfolio and overriding only the fields whose shape genuinely changes, then assert in `cutoverFiles.test.ts` that the envelope's key set covers `createDefaultStore()`'s. Unverified — `lastSavedAt` may legitimately not belong in a v1.7 envelope, and that is a judgement about the format, not a bug I measured.

---

## D2-11 — `audit-sublanes.ts` has no `package.json` entry, so the 12-way split that produced this dispatch is invoked only from a docstring

**Severity:** minor · **Origin:** `s0-first-look` (`scripts/audit-sublanes.ts`, `scripts/make-cutover-backups.ts`)

**Consequence.** `audit-route.ts` and `record-reads.ts` are pinned as `audit:route-check` and `audit:record-reads` — with their flags (`--since`, `--unread-pass=s1p5`, `--exit-pass=s1p6`, `--pass=s1p6`, `--dir=…`) fixed in `package.json:48-49`, which is how a re-run reproduces a dispatch. `audit-sublanes.ts` — the file that decided what all twelve auditors were handed — has no such entry, so its invocation lives only in its own header (`:34-36`) and its `--dir` is retyped each time. A sub-lane manifest cannot be regenerated by anyone who has not read the file.

**File and line.** `package.json:5-88` — `grep -c audit-sublanes.ts package.json` = **0**; `grep -c make-cutover-backups.ts package.json` = **0**. For contrast, `record-reads.ts`, `audit-route.ts` and `surface-inventory.ts` all return 1.

**Measurement.** As above, plus the reference sweep in D2-8: `audit-sublanes.ts` is named by `docs/DEBT_ELEVATION_LOG.md`, this round's `BRIEF.md`, two routing manifests and the S0 inventory — prose only.

**Related, and worth a triage line rather than its own finding:** this lane's dispatch prose named `scripts/check-pass-coverage.ts` as one of my files. It is **not** in `ROUTING-D2.txt` — `audit-sublanes.ts:113-114` routes `^scripts/check-.*\.ts$` to **D1**. I read it anyway (it is the other consumer of `carriesMoneyClaim` and D2-3 needed the control), and it is on `READ-D2.txt` honestly. But a dispatch that names files by hand beside a generated manifest is two producers of one fact, which is the shape `audit-route.ts`'s own header exists to refuse.

**Remedy (UNVERIFIED).** Add `"audit:sublanes": "tsx scripts/audit-sublanes.ts --dir=<this round's dir>"` alongside its siblings, and write the lane manifests from the script rather than from the brief. Unverified.

---

## D2-12 — `surface-inventory.ts`'s scope note carries two stale premises about `formatDisplayAmount`

**Severity:** minor · **Origin:** `s0-first-look` (`scripts/surface-inventory.ts`)

**Consequence.** The cohesion inventory's header tells a reader which money formatters are in scope and why one is not. Both halves of that sentence have decayed, and it is the sentence an auditor reads before deciding not to look at a formatter.

**File and line.** `scripts/surface-inventory.ts:16-17`: *"`formatDisplayAmount` is NOT tracked here and is NOT dead: it serves the legacy Capacitor/Next root surface (`components/ResultsSection.tsx`) **only**, and dies with that tree at **5.5.1**."*

**Measurement.**
- **The item number is renumbered.** `scripts/check-audit-closure.ts:364` records *"and more die with **P6.11.1** (the legacy-tree deletion, **formerly numbered 5.5.1**)."* `5.5.1` still appears in five tracked scripts (`check-money-format.ts:30`, `check-rounding.ts:62`, `preflight-native-lane.ts:522`, `preflight-xcuitest-target.ts:16`, and this file).
- **"serves the legacy root only" is now half-true.** `formatDisplayAmount` lives at `packages/core/utils/formatDisplayAmount.ts` — inside `packages/core`, an **S1 root** (`surface-coverage.ts:265`) — and since pass 5 it is guarded by an RN-app test, `apps/rn/src/utils/moneyFormatters.test.ts:20,41,90,104`, and named in `check-trust-claims.ts:221`'s `FORMAT_MODULES`. Pass 5's `S1.12.5.3` found it *"rendering `NaN.N` with no guard at all."* The production RN app still does not call it, so the *mechanism* stands; the *scope* claim no longer does.

**Mechanism (hypothesis).** A comment is a carried premise and decays like a carried number. This one was written when `packages/core` was not an S1 root and before a fifth formatter was found in it.

**Remedy (UNVERIFIED).** Re-word to *"reached by no RN route, so it is absent from the per-route table; it is on the S1 surface and guarded by `moneyFormatters.test.ts`"*, and sweep `5.5.1` → `P6.11.1` across the five scripts. Unverified.

---

## D2-13 — PROBED: `junitFound` means "some file had bytes", not "a flow ran" — two empty reports or one zero-testcase report both read `true`, and the stall refusal never fires

**Severity:** major · **Origin:** `s0-first-look` (`scripts/maestro-results.mjs`)

**Consequence.** `scripts/stamp-coverage.ts:177-178` refuses to write coverage on `junitFound: false`, calling it *"the iOS-driver stall, and it has burned two full cycles already."* That refusal is the only thing standing between a stalled native lane and the coverage record. It is reachable from fewer stall shapes than its own docstring claims.

**File and line.** `scripts/maestro-results.mjs:78-80, 110` —
`const xml = paths.map((p) => readFileSync(p,'utf8')).join('\n');` … `junitFound: Boolean(xml)`.
The join inserts a `'\n'` between reports, so **two empty files produce a truthy string**. And any well-formed report is truthy regardless of how many `<testcase>` elements it holds. `collect-lane-diagnostics.mjs:45-48` sets `TIERS.iphone.junit` to a **two-element array** — the multi-report shape is the live one for the iPhone tier.

**Measurement — probed by importing `buildResults` directly against synthetic reports in a temp dir:**

```
no report files at all                       junitFound=false  totals={pass:0,fail:0,skipped:0}  flows=0
one report file, 0 bytes                     junitFound=false  totals={pass:0,fail:0,skipped:0}  flows=0
TWO report files, both 0 bytes               junitFound=TRUE   totals={pass:0,fail:0,skipped:0}  flows=0
one report, well-formed, ZERO testcases      junitFound=TRUE   totals={pass:0,fail:0,skipped:0}  flows=0
CONTROL: one report, one passing testcase    junitFound=true   totals={pass:1,fail:0,skipped:0}  flows=1
```
`parseJunit('<testsuites><testsuite tests="0"/></testsuites>')` → `[]`. In the two TRUE rows `renderSummary` (`:117-133`) prints `### iphone tier — 0 passed · 0 failed · 0 skipped` with an **empty table and no warning**, because the ⛔ *"No JUnit report was produced — no flow ran"* banner is gated on `!r.junitFound`. Nothing written; nothing in the repo modified.

**And the test picked the member that cannot fail.** `scripts/test-stamp-coverage.ts:188` builds its driver-stall fixture as `results('iphone', [], { junitFound: false })` — the flag is **hand-set on a synthetic object**. The suite proves the consumer's branch and never once asks whether `buildResults` can produce `false` from a stalled report. That is `ASK WHICH MEMBER OF ITS CLASS A TEST PICKED`, on the producer/consumer seam.

**Mechanism (hypothesis).** `junitFound` was written when `junitPath` was a single path, where `Boolean(readFileSync(p))` really did mean "the file had content". `4.1.7` then split flow `09` into its own invocation and `junitPath` became a list — `maestro-results.mjs:73-77` documents that change and fixes the *case* enumeration, not the *presence* flag that the same `join` now feeds.

**Remedy (UNVERIFIED).** Derive it from what was parsed rather than from bytes: `junitFound: paths.length > 0 && cases.length > 0`, or keep the byte check and add `flowsRan: cases.length > 0` for `stamp-coverage.ts` to refuse on. Unverified — and either way `test-stamp-coverage.ts` should build its stall fixture by running `buildResults` over a real stalled report instead of asserting the flag by hand.

---

## D2-14 — `preflight:xcuitest`'s only fixture is the legacy Capacitor project, and its written expiry plan is enforced by nothing

**Severity:** minor · **Origin:** `s0-first-look` (`scripts/preflight-xcuitest-target.ts`)

**Consequence.** The pre-flight exists because *"the native lane costs ~22 minutes and its characteristic failure is an unexplained timeout twenty minutes downstream"* (`:4-5`). Its input is a file in the tree `P6.11` deletes. When that tree goes, `readFileSync(FIXTURE)` at `:41` throws an uncaught ENOENT before a single `check()` runs — so the instrument that exists to convert a 22-minute mystery into a local error becomes a stack trace, and the sequencing (delete the legacy tree, then discover this) means it happens at the worst moment.

**File and line.** `scripts/preflight-xcuitest-target.ts:30`
(`const FIXTURE = join(REPO_ROOT, 'ios/App/App.xcodeproj/project.pbxproj')`) and `:15-16`, which already
states the remedy: *"It dies at 5.5.1 — when it goes, vendor a copy under `scripts/fixtures/`."*

**Measurement.**
- `git ls-files ios/App/App.xcodeproj/project.pbxproj` → tracked; `git ls-files ios | wc -l` → **25**.
- `surface-coverage.ts:386` lists `ios` in `NOT_SOURCE`; `:394-397` lists `app`, `components`, `lib`,
  `tests` as *"legacy Next surface — deleted at P6.11."*
- The `NOT_SOURCE` staleness ratchet (`surface-coverage.ts:429-438`) **does** red when a skipped
  directory disappears — so the deletion is not silent in general. What it cannot see is that two
  instruments read *inputs* out of those trees: this fixture, and `compare-ios-screenshots.mjs`'s
  baselines (D2-9 fact 2). Neither consumer is named anywhere the deletion would reach.
- `preflight:xcuitest` is in `package.json:84` and in **no workflow and not in `run-gates.ts`** — by
  design, per its own header (*"LOCAL PRE-FLIGHT … It runs on Windows"*), which is why this is minor:
  the failure lands on a human at a keyboard, not on CI.

**Also, and it is the D2-5 class again:** the file prints `${ok.length} structural checks pass` (`:250`)
and floors nothing. Its own docblock cites the count as evidence — *"⚡ **31 checks passed on that exact
project**"* (`:79`) — so the number is read as meaning something while nothing asserts it.

**Mechanism (hypothesis).** The fixture was chosen because it is the only real `project.pbxproj` in the
repo (`:204-209` explains the same scarcity for schemes). The expiry was noticed and written into a
comment, which is the form this project has repeatedly measured as not surviving.

**Remedy (UNVERIFIED).** Vendor the fixture under `scripts/__fixtures__/` now, as the header already
says, and add `MIN_CHECKS` beside `ok.length`. Unverified.
