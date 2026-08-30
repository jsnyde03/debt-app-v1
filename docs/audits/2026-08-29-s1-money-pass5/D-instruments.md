# Lane D — the instruments — PASS 5 findings

**Auditor:** D. **Target:** `65566a09b96cdad8072261ac4a710ee1733be467` on `v1.7-dev`.
**Worktree:** `C:\Users\Jason\audit-p5-d` (detached, removed at end).
**Manifest:** `ROUTING-D.txt`, 50 files. Origin split: instrument 24 · s0-first-look 17 · off-surface 6 · neighbour 3.

⚠️ This file is APPENDED to as work proceeds. Findings appear in the order they were measured,
not in severity order. The summary tables are at the bottom.

---

## Log

- [init] File created before any measurement, per constraint 7.

---

## D5-1 — `major` — 66 of 66 registry proofs read "never run", and no gate can see it

**origin:** `instrument` (`scripts/prove-guards.ts`, `scripts/check-finding-guards.ts`, `scripts/finding-guards.json`)
**file/line:** `scripts/prove-guards.ts:69` (`measured?` / `sha?`), `:169` (the only reader), `:443–450` (the only writer);
`scripts/check-finding-guards.ts:145` (`MAX_UNPROVEN = 119`), `:405–408` (the printed line).

### The measurement

```
$ npm run --silent prove:guards -- --list      EXIT=0
  proven by plant : 66
     S1P2-B1-REASON               test:gate-plants  (never run)
     ... [all 66 rows]
  never tested    : 120
$ grep -c "never run" → 66          # every proof row
$ grep -cE "\(20[0-9]{2}-"  → 0     # no row carries a measured date
```

Registry scan (`scratchpad/reg.cjs`, run in the worktree):
`entries 186 · with proof 66 · never-measured proofs 66 · guardOnly 0 · unguarded 1`.

Consumer scan for the freshness fields:

```
$ grep -rn "\.measured\|proof\.sha\|--record" scripts .github package.json | grep -v finding-guards.json
scripts/prove-guards.ts:69   (the docstring)
scripts/prove-guards.ts:169  (--list display only)
scripts/prove-guards.ts:447  (written by --record)
```

`--record` is invoked by nothing — no npm script, no workflow. `prove:guards --all` is in **no chain**:
`scripts/run-gates.ts:86` chains `prove:guards:selftest` only, and `grep -rn "prove:guards" *.yml` returns
nothing under `.github/`.

### The consequence

`lint:finding-guards` prints, on its green path, *"66 carry a re-runnable proof … 119 never tested (cap 119)"*.
A reader takes the 66 as the drained half of the evidence backlog. **It is not.** `proven` in that gate means
*a JSON block exists and its anchors still match once* — the file's own comment at `:402` says so — and the
`MAX_UNPROVEN` ratchet therefore **drains as JSON is authored, not as proofs are executed.** Zero of the 186
entries carries a recorded execution on any sha. So the exact condition `prove-guards.ts:8` was written to end —
*"until a guard is proven to red, `CLOSED` and `OPEN` are indistinguishable in the record"* — **still holds for
all 186 entries**, now wearing a stronger label. Who meets it: the next auditor who reads "66 proven" as 66
closures and does not re-derive them.

### The mechanism, as a hypothesis

The freshness fields were designed (`--record`) but never wired to a consumer, so the one number that would
distinguish *authored* from *executed* is write-only and unread. Nothing red-flags a proof that has never run
because no gate reads `measured`.

### Remedy — **NOT verified**

Split the counter: `proven` (has `measured` + a `sha` reachable from HEAD) vs `authored` (block exists, never
run), ratchet each separately, and put `prove:guards --all` behind a cheap subset in the chain. ⚠️ Unverified,
and it has a known cost: `--all` includes 11 playwright proofs and a `typecheck`, so it is not a lint-chain
link as it stands. Do not adopt without measuring the runtime.

---

## D5-2 — `minor` — two producers of "never tested" disagree by one (120 vs 119)

**origin:** `instrument`
**file/line:** `scripts/prove-guards.ts:162` — `untested = ids.filter(id => !proof && !guardOnly)`;
`scripts/check-finding-guards.ts:207–212` — `if (e.unguarded) { …; continue; }` before the bucket.

**Measurement:** `prove:guards --list` prints `never tested : 120`; `lint:finding-guards` prints
`119 never tested (cap 119)`. Both EXIT=0. The delta is exactly `GAP-14`, the one `unguarded` entry, which
`prove-guards.ts` counts as untested and `check-finding-guards.ts` excludes.

**Consequence:** the D4-6 class in miniature — one question, two implementations. A human who lowers
`MAX_UNPROVEN` to the number `--list` showed them reds the gate.

**Mechanism (hypothesis):** `prove-guards.ts`'s three buckets were written from `proof`/`guardOnly` alone and
never taught about the third state `check-finding-guards.ts` has (`unguarded`).

**Remedy — NOT verified:** exclude `unguarded` in `prove-guards.ts:162`, or import the bucketing from one module
the way `verdict()` and `planEdit()` already are.

---

## D5-3 — `major` — the playwright "something is already serving" fault is blind to `run:`-form proofs

**origin:** `instrument`
**file/line:** `scripts/prove-guards.ts:220` — `if ((p.cmd ?? []).includes('playwright')) { … }`

### The plant, and the control on the verifier

Crafted registry (`scripts/__audit-p5d.json`, deleted after; `--registry=` is the file's own designed
plantability idiom). Two entries, identical un-fix — an anchor that matches **0×** so both must fault, the
only question being *which* fault fires first. `proveOne`'s order is: `run|cmd` missing → target exists/clean
→ **port check** → anchor count. A listener was bound on :4319 (`net.createServer().listen(4319)`, pid 23220,
confirmed by `netstat -ano`).

| entry | proof form | fault printed | EXIT |
|---|---|---|---|
| `PW-CMD` (control) | `cmd: ["npx","playwright","test","--config",…]` | `something is already listening on :4319, and this proof runs playwright.` | 1 |
| `PW-RUN` (subject) | `run: "test:e2e:trust-claims"` | `the anchor matches 0× … this proof is VOID` | 1 |

The subject **reached the anchor check**, so the port check did not fire for it. Listener killed in the same
step; `netstat | grep -c 4319` → `0` afterwards. `git status --porcelain` in the worktree: empty, and
`git diff -- scripts/__fixtures__/` is empty, so the fixture was restored.

### Who is affected — counted by id, and this is a lower bound

Registry entries whose proof is playwright by way of an npm script rather than an argv:

- `S1P4-C4-8-SINGULAR` → `run: "test:e2e:trust-claims"`
- `S1P4-A-F5-PATHS` → `run: "test:e2e:amount-guards"`

Both npm scripts are `playwright test --config apps/rn/playwright.config.ts …`, i.e. the same config whose
`reuseExistingServer: !process.env.CI` (`apps/rn/playwright.config.ts:52`) is the entire reason the fault
exists. ⚠️ **Lower bound:** the set is "npm scripts that transitively run playwright", which nothing in the
tree enumerates; I read `package.json`'s script table by hand.

### The consequence

With a stale `serve` on :4319 — *not hypothetical; pass 4 found two, from Aug 8 and Aug 10* — these two
proofs are run against a pre-plant bundle. `withPlant.status === 0`, so `verdict()` returns `failed-open`
and the harness reports **a working guard as dead**. Who meets it: the session that then "repairs" a guard
that was never broken, i.e. pass 4's own most expensive failure mode.

### The mechanism, as a hypothesis

The predicate was written against the shape of the proofs that existed when it was written — the nine
`npx playwright …` argv proofs — and the two npm-script proofs (`S1P4-*`, added later, in pass 4's own
fixing) are a form the predicate's author had not seen. Nothing tests the predicate, so adding the new
form was silent.

### Remedy — **NOT verified**

Resolve `p.run` through `package.json`'s `scripts` and test the resolved command string for `playwright`
as well as the argv. ⚠️ **Unverified, and it is not sufficient on its own**: a script that chains
(`a && b`) or delegates via `npm --prefix` still hides the word. The checkable version of the question is
"does this command bind :4319", which the harness could answer by refusing to run **any** proof while
:4319 is listening — a strictly larger and cheaper rule than enumerating spellings. ⛔ An enumeration of
spellings has failed in this repo six times; do not ship the `includes('playwright')` widening as the fix.

---

## D5-4 — `major` — `S1P3-A4-CADENCE`'s registered proof is unattributable: an earlier assertion in the same file reds first

**origin:** `instrument` (`scripts/finding-guards.json`, entry `S1P3-A4-CADENCE`)
**file/line:** `packages/core/debt/testBnplInstallment.ts:155` (the assertion that fires) vs `:176` (the
registered guard). Proof lives in `scripts/finding-guards.json`, `S1P3-A4-CADENCE.proof`.

### The measurement — the first time this proof has ever been executed

```
$ npx tsx scripts/prove-guards.ts --id=…,S1P3-A4-CADENCE,…            EXIT=1
  ❌ S1P3-A4-CADENCE   plant-applied=YES · planted=exit 1 · control=exit 0 · reason=WRONG
       ⛔ it redded, but not for "S1P3-A4" — the red is not attributable to this defect.
         │ Error: FAIL [⛔ A-F3 — a plan six months behind is due THREE charges this cycle,
         │              not its whole $1,200 balance]: expected 300, got 100
```

Seven siblings in the same batch (`S1P4-A-F2-ATMOSTONEPOINT`, `S1P4-A-F3-WINDOWSTART`,
`S1P4-A-F4-ONEGUARD`, `S1P3-A1-BUDGET`, `S1P3-A2-INWINDOW`, `S1P3-A5`, `S1P3-M4`) came back
`reason=MATCHED`, so this is not a broken harness — it is this entry.

### Re-run with the assertion above it relaxed (BRIEF rule 5)

Plant applied by hand (`hasKnownBnplCadence` → `isInstallmentNative` at `bnplInstallment.ts:242`, anchor
count 1), then `testBnplInstallment.ts:155–156` prefixed `//RELAXED_BY_AUDIT`:

```
$ npx tsx packages/core/testing/runRegressionTests            REGEXIT=1
Error: FAIL […and PAID DOWN by the same amount, so reserve and paydown stay in lockstep (S1P3-A4)]:
        expected 200, got 100
```

**So the guard itself is sound and load-bearing** — the registered token's own line (`:176`) is what
fires — and lines `:174`/`:175` pass under the plant, exactly as the entry's `what` claims. What is
defective is the **proof**, not the guard: as recorded it can never satisfy its own `expect`.

Restore verified: both files copied after the plant, restored from pre-plant copies, `diff` clean on both
(`D1=0 D2=0`), `git status --porcelain` empty, and the control run is green
(`✅ All regression tests passed.`, `CONTROL_EXIT=0`).

### The consequence

`npm run prove:guards -- --all` — the command `check-finding-guards.ts:407` prints on its green path as
the way to drain the 119-entry backlog — **cannot pass at this commit.** The one entry that has to be
re-derived is invisible because nothing in any chain executes proofs, so the drain path was broken and
green at the same time. Who meets it: the first session that tries to drain the backlog and reads a red
`--all` as "the harness is broken."

### The mechanism, as a hypothesis

`runRegressionTests` is import-driven and `assertEqual` **throws**, so a suite run stops at the first
failing assertion. `S1P3-A4-CADENCE`'s un-fix widens a gate two assertion-blocks upstream of its own
guard, so `A-F3`'s row at `:155` — added *later*, in pass 4's `S1.11.5.1` — now sits between the plant
and the assertion the proof names. ⚠️ Hypothesis, not measured: the proof was recorded before `A-F3`'s
rows existed, and nothing re-checks a recorded `expect` when a new assertion is inserted upstream of it.

### The class, and what would make it checkable

This is **not** a property of one entry. Any proof whose command is a fail-fast suite is attributable only
while no earlier assertion reacts to the same plant. **38 of the 66 proofs run such a suite**
(`test:app` 30, `test:regression` 8) — a **lower bound**, since I did not check whether
`test:gate-plants`, `lint:*` or `typecheck` stop at first failure. Reading cannot tell you which ones are
safe; only executing can.

What would make completeness checkable: have `verdict()` distinguish *"the expect string appeared"* from
*"the expect string appeared **in the failing assertion**"*, or make the runner report every failure
rather than the first. As it stands, an entry passes `reason=MATCHED` if its `expect` merely occurs
anywhere in the output — including in a passing line — which is a second, unmeasured way to be green.

### Remedy — **NOT verified**

Re-derive `S1P3-A4-CADENCE`'s un-fix so that no earlier assertion reacts to it, **or** point its `run` at
a narrower command. ⚠️ Do **not** "fix" it by relaxing `A-F3:155`: that assertion is itself a registered
guard (`S1P4-A-F3-WINDOWSTART`, measured MATCHED in the same batch), so weakening it trades one closure
for another. I did not verify any re-derivation.

---

## D5-5 — `major` — `verdict()`'s `wrong-reason` check is VACUOUS for 26 of the 50 checkable proofs: the `expect` string is already in the GREEN output

**origin:** `instrument`
**file/line:** `scripts/lib/verdict.ts:58` — `if (expect && !withPlant.out.includes(expect)) failed.push('wrong-reason');`

### What the check claims

`prove-guards.ts:67` — *"the planted run's output must contain this, so the red is **attributable to THIS defect**."*
`verdict.ts` exists because `D4-6` let a tick and a printed reason disagree; the whole file is the repair.

### The measurement — the check cannot fail for half the registry

Green runs captured for every command I could run (`lint:copy · lint:import-graph · lint:line-endings ·
lint:trust-claims · lint:gate-sources · lint:restore-doors · lint:cap-literals · lint:money ·
lint:destructive`, all EXIT=0; `test:regression` EXIT=0; `test:app` EXIT=0 after creating
`apps/rn/core`). Then, for every proof whose command I had a green capture of, asked whether the green
output already contains the proof's `expect` (`scratchpad`/`vac.cjs`):

```
checked against a GREEN run: 50
VACUOUS (expect already present in the green output): 26
not checked (no green capture): 16      # 11 playwright · 2 test:gate-plants · 2 typecheck · 1 audit-route
```

The cause is mechanical: these suites print `✓ <assertion label>` for every **passing** assertion, and
`expect` is that label. E.g. `S1P4-A-F2-ATMOSTONEPOINT`'s `expect` is
`"at most one may survive"`, which occurs at lines **361–363 of a 756-line fully green
`test:regression`** as `✓ ⛔ A-F2 · "12..5" → "12.5" keeps 1 point(s); at most one may survive`.

### The plant — constructing the defect the check claims to catch

Crafted registry (`--registry=`, this file's own designed plantability), one entry carrying **A-F2's
`expect`** over an **entirely unrelated un-fix**: `packages/core/testing/seedPlannerState.ts`,
`amount: "1950"` → `amount: "1951"`, which reds `testDemoModeSeed` — the **last** suite in
`runRegressionTests`, ~390 lines after A-F2's `✓` line prints.

```
$ npx tsx scripts/prove-guards.ts --registry=scripts/__audit-p5d.json --id=VACUOUS-DEMO
  ✅ VACUOUS-DEMO               plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED

✅ prove:guards — 1 guard(s) red on their own defect, and the control is green.
EXIT=0
```

**A red produced by a defect in a different file, in a different subsystem, was certified as
`reason=MATCHED` and announced as *"red on their own defect."*** Restore verified: `diff` against the
pre-plant copy `DIFF=0`, `git status --porcelain` empty, crafted registry deleted.

### The 26 (ids, not a list — and a lower bound)

`S1P4-A-F2-ATMOSTONEPOINT · S1P4-A-F3-WINDOWSTART · S1P4-F-B3-TWOEVENTS · S1P4-C4-5-ARITY ·
S1P4-C4-1-COUNT · S1P4-C4-2-MEMBERSHIP · S1P4-C4-7-SURFACES · S1P3-A2-INWINDOW · S1P3-A4-CADENCE ·
S1P3-C5-PAYWALL · S1P3-D3-1-WIDGET · S1P3-D3-2-SPOKEN · S1P3-B3-UNKNOWN · S1P3-C7-LOSSES ·
S1P3-C7B-CLOUDDOOR · S1P3-G1-CALIBRATION · S1P3-G2-RESERVETARGET · S1P3-G3-GUARDIANREGIME ·
S1P3-G4-PLANROUTE · S1P3-M1 · S1P3-D3-7 · S1P3-M4 · S1P3-M2 · S1P3-M6 · S1P4-F-B4-CLASS ·
S1P4-ACK-DOES-NOT-VERIFY`

⚠️ **Lower bound.** 16 proofs were not checkable (no green capture: 11 playwright, 2 `test:gate-plants`,
2 `typecheck`, 1 `audit-route`), and two of the shortest `expect` strings — `"B3"` and `"S1P3-A4"` — are
substrings that could match on many more lines than the one intended.

### The consequence

Two of the harness's four failure modes are load-bearing (`failed-open`, `control-red`) and the third
(`wrong-reason`) is decorative for at least half the registry. What that permits: a plant that reds the
suite **for any reason at all** — an unrelated regression, a broken import, a fixture drift — is recorded
as proof that this finding's guard holds. Who meets it: the session that drains the 119 backlog by
`--record`-ing green verdicts, producing a registry that says *proven* about guards nobody exercised.

⚠️ It also composes with **D5-4**: for a fail-fast suite, whether `expect` is vacuous depends on whether
the plant's red lands **before or after** the `✓` line that carries the same text. `S1P3-A4-CADENCE`
appears on both lists — its red happened to land upstream of its own `✓`, which is the only reason
`wrong-reason` fired there at all. **The check's outcome is a function of assertion order, not of
attribution.**

### The mechanism, as a hypothesis

`verdict()` was written against `test:gate-plants`, whose gates print a diagnostic **only** when they red;
under that assumption `out.includes(expect)` is a sound attribution test. The `prove:guards` callers pass
suite runners that print every label on the passing path too, and the predicate was carried across
unchanged. ⚠️ Hypothesis. What is measured is the observation, not the history.

### Remedy — **NOT verified**

Pass `withoutPlant.out` into `verdict()` and add a fifth failure, e.g. `vacuous-expect`, when the CONTROL
output already contains `expect` — the check that the `expect` string discriminates at all. I measured its
discriminating power but not the fix: **it would red 26 of the 66 registered proofs**, which is the honest
size of the repair, not a one-liner. A weaker variant (match only lines carrying a failure marker) reuses
the `named` filter already at `prove-guards.ts:437` and would need the same measurement. ⛔ Neither is
verified, and `verdict()`'s own module-scope self-check would need a new row per
`plant-both-directions` — its six rows pass a red-`out` that contains `expect` and never a green one, so
**no existing row can see this**.

---

## D5-6 — `major` — a GREEN `lint:rn` leaves the tree dirty, and `git diff` cannot see what changed

**origin:** `instrument`
**file/line:** `scripts/surface-coverage.ts:679` — `writeFileSync(INVENTORY, \`${lines.join('\n')}\n\`, 'utf8')`.
Reached by `lint:s0-coverage` and `lint:s1-coverage`, both chained in `scripts/run-gates.ts:52–53`.

### The measurement

From a clean worktree, each gate run on its own, tree reset between:

```
lint:s0-coverage      EXIT=0  dirty=[ M docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-SURFACE-INVENTORY.md]
lint:s1-coverage      EXIT=0  dirty=[ M docs/audits/2026-08-26-s1-money/S1-SURFACE-INVENTORY.md]
lint:surface-complete EXIT=0  dirty=[]
lint:coverage         EXIT=0  dirty=[]
lint:closure          EXIT=0  dirty=[]
lint:copy             EXIT=0  dirty=[]
lint:apostrophes      EXIT=0  dirty=[]
```

`test:gate-plants` also leaves it (it invokes `lint:s1-coverage` in two scenarios).

The change, byte-measured (`before` = checked out, `after` = post-gate):

```
before CR 566  LF 566  len 33382
after  CR   0  LF 566  len 32816
equal after CRLF-normalise: True
first byte diff at 55
```

`core.autocrlf=true` and `.gitattributes` holds one unrelated line, so the file checks out **CRLF** and the
gate rewrites it **LF**. Content is otherwise identical — so **`git diff` reports nothing while
`git status --porcelain` reports `M`**, verified in both orders (running `git diff` first does not clear it).

### The consequence

1. A **fully green** `npm run lint:rn` ends with a dirty tree, every time, on any CRLF checkout.
2. The two commands a session uses to answer *"did I leave something behind?"* disagree: `status` says yes,
   `diff` says nothing. That is the exact camouflage a **left-behind plant** needs — and this round's brief
   opens by noting pass 4's own fixing *"produced a plant script that left a file planted."*
3. The habitual response to unexplained dirt is `git checkout -- .`, which is this repo's recorded
   `verify-the-restore-not-just-the-plant` trap: it discards uncommitted work along with the noise.
4. ⚠️ **CI can never see it.** CI checks out LF, so writing `'\n'` is a byte no-op there. This is
   `anchor.ts`'s own documented shape — *"an instrument that is green where it is run and red where it
   matters"* — running in the other direction: **dirty where it is run, invisible where it is checked.**

Who meets it: every session that runs the gate chain on Windows, which per this repo's history is all of
them.

### The mechanism, as a hypothesis

`surface-coverage.ts` regenerates its inventory unconditionally on every run and writes LF, while the file
is committed and checked out CRLF. Nothing compares the new text against the file on disk before writing,
so there is no "unchanged → do not write" path. ⚠️ Hypothesis: I did not test whether a
write-only-if-changed guard was ever present.

### Remedy — **NOT verified**

Read the existing file, compare **after normalising both sides to LF** (`scripts/lib/anchor.ts` already
exports `lf()`, one producer), and skip the write when equal. ⚠️ Unverified. ⛔ Do **not** "fix" it by
adding the two inventories to `.gitattributes` as `-text`: that makes the committed bytes machine-dependent,
which is the class `lint:line-endings` exists to refuse.

---

## D5-7 — `minor` — 11 of `test:gate-plants`' 23 scenarios carry no `expect`, so `wrong-reason` cannot fire for them

**origin:** `instrument` · **file/line:** `scripts/test-gate-plants.ts` (scenario table); `scripts/lib/verdict.ts:58,60`

**Measurement** — the green run, `npm run test:gate-plants`, EXIT=0, `✅ … all 23 gates fail closed`:
12 rows print `· reason=MATCHED`; **11 rows print no `reason=` at all** —
`lint:month-arithmetic` (×5 incl. its four variants), `lint:local-dates`, `lint:glossary`,
`lint:a11y-props`, `lint:type-scale`, `lint:destructive`, `lint:copy [GAP-15-self-check]`.

`verdict.ts:60` — `const reason = expect ? … : null` — so an absent `expect` prints nothing and
`wrong-reason` is skipped by design (`verdict.ts:94`, *"no expect means no reason check"*).

**Consequence:** for those 11 the harness proves only *"the gate exited non-zero under the plant"*, not
*"for this defect"* — the very distinction the file's headline (`D4-6`) is about. A gate that started
redding for an unrelated reason (a parse error in the scratch file, a missing dependency) reads identical.
Combined with **D5-5**, at least **11 of 23** gate-plant scenarios and **26 of 50** guard proofs have no
working attribution check. ⚠️ Both counts are lower bounds.

**Mechanism (hypothesis):** `expect` was added later than the first scenarios and back-filled only where
someone happened to touch the row; the type makes it optional (`expect?`) in `test-gate-plants.ts`, so
nothing pushes back.

**Remedy — NOT verified:** make `expect` required and back-fill the 11. ⚠️ Unmeasured cost: I did not check
that all 11 gates print a stable, distinctive diagnostic to key on, and per **D5-5** a back-filled `expect`
is worthless if the same string also appears on the green path.

---

## Verifying `scripts/audit-route.ts`'s repair (asked for explicitly)

**The repair holds, and it is reproducible.** Regenerated the whole route into a scratch directory at the
pin and diffed against the committed manifests:

```
$ npx tsx scripts/audit-route.ts --surface=s1 --since=e65f9c7 --out=docs/audits/__p5d-regen   EXIT=0
   393 routed · 0 missing on disk · every CHANGED tracked file since e65f9c7 is accounted for (23 excluded…)
   by origin: 68 first-look · 33 fix-churn · 24 instrument · 12 off-surface · 207 neighbour · 49 s0-first-look
ROUTING-A: IDENTICAL   ROUTING-B: IDENTICAL   ROUTING-C: IDENTICAL   ROUTING-D: IDENTICAL
ORIGINS.tsv: IDENTICAL
```

`s0-first-look` is emitted (49, of which 17 in lane D), so `D4-7` is closed. The `--check` proof
(`S1P4-D4-11-REACHABLE`) was executed and came back `reason=MATCHED`. Scratch dir removed; tree clean.

Also verified: the S1 inventory it parses is **current** at this pin — re-running `lint:s1-coverage`
changes only line endings (`equal after CRLF-normalise: True`, see **D5-6**), so the route is not reading
a stale surface today. ⚠️ Nothing *checks* that: `readInventory` validates the file against its own stated
totals, never against the tree. A stale inventory routes a stale surface silently.

---

## D5-8 — `major` — `neighbour` is seeded by `changed` alone, so 72 files adjacent to NEVER-SWEPT files reach no lane

**origin:** `instrument`
**file/line:** `scripts/audit-route.ts:341` — `const { consumers, siblings } = neighbourhood(graph, changed, sourceFiles);`

### The measurement

Re-ran `buildImportGraph` / `neighbourhood` directly (a scratch `scripts/__p5d-nb.mjs`, deleted after; tree
verified clean), once with the route's own seed and once seeded with the S1 `first-look` set:

```
S1 inventory files       : 478
first-look (unswept)     : 68        # on the surface, never swept by ANY pass
changed since pin        : 98
neighbourhood(changed)   : consumers 101  siblings 139     ← what the route uses
neighbourhood(firstLook) : consumers  95  siblings 120
FILES REACHABLE FROM A first-look FILE BUT ROUTED TO NOBODY: 72
```

The 72 are money screens. First 10 by path:
`apps/rn/src/components/AppLockGate.tsx · components/more-button.tsx ·
components/onboarding/CompletionStep.tsx · components/onboarding/WelcomeStep.tsx ·
components/plan/GraduationCards.tsx · components/plan/LeanSuggestionCard.tsx ·
components/plan/MilestoneAckCard.tsx · components/plan/PaidOffBeat.tsx ·
components/plan/PayoffInvitationCard.tsx · **components/plan/PlanHero.tsx**` — and further down
`components/plan/RecoveryPlanSection.tsx`, `components/progress/TimelineLedger.tsx`,
`components/progress/CashFlowSection.tsx`.

### The consequence

`A-F4` was: *a two-producer disagreement is half-routed by construction, because every bucket is a
predicate on CHANGED.* The repair added a fifth origin — and **seeded it with `changed`**, so the identical
half-blindness survives on the other axis. A file that has **never been swept by any pass** does not pull
its neighbourhood in, so a disagreement between a never-swept producer and a swept-unchanged sibling is
still invisible from the side that did not move. Who meets it: the reader of *"393 files · 0 unrouted ·
0 owed"* who takes that as coverage. The route's own success line is narrower and honest — *"every
**CHANGED** tracked file … is accounted for"* — but the dispatch, the brief and the manifests are what an
auditor reads.

### The mechanism, as a hypothesis

`neighbourhood()`'s seed parameter took the name of the thing that motivated it (`changed`) rather than
"the files this round is reading", and `first-look` was added to the origin table in the same commit range
without revisiting the seed. ⚠️ Hypothesis; the observation is the 72.

### Two more things it still cannot see (measured, lower severity)

1. **Uncommitted work.** `changedSince` runs `git diff --name-only --diff-filter=d <since>..HEAD`
   (`audit-route.ts:177`) — the committed tree. A route generated mid-fix routes nothing not yet committed.
2. **Non-TypeScript code can never be a graph node.** The graph is `git ls-files '*.ts' '*.tsx'`
   (`:335`). **36 tracked `.mjs`/`.cjs`/`.js`/`.sh` files** can therefore be neither a neighbour nor pull
   one — including six in this lane's own manifest (`scripts/e2e-fresh.cjs`, `scripts/e2e-fresh-rn.cjs`,
   `scripts/collect-lane-diagnostics.mjs`, `scripts/maestro-results.mjs`,
   `scripts/compare-ios-screenshots.mjs`, `apps/rn/scripts/copy-canvaskit.mjs`). They reach a lane only by
   `changed`/`off-surface`. ⚠️ The docstring states the `.ts`/`.tsx` restriction; it does not state the
   count, and a stated restriction with no number is not a measured blind spot.

### Remedy — **NOT verified**

Seed `neighbourhood()` with `changed ∪ first-look ∪ s0-first-look` — i.e. everything this round reads —
rather than `changed`. ⚠️ **Unverified, and the cost is real:** it adds ~72 files to a 393-file round
(+18%), and the file's own header already prices the neighbourhood at ~3.7× the changed set. Whether that
is worth it is a dispatch decision, not a code fix. ⛔ Do not adopt it silently: it changes the size of
every future round.

---

## D5-9 — `major` — `lint:cap-literals` is blind to a derived cap written across two lines, and its own floor absorbs the loss

**origin:** `instrument`
**file/line:** `scripts/check-cap-literals.ts:59` (`DECL`, single-line by construction) and `:100`
(`MIN_CAPS = 15` against 18 observed).

### The control on the verifier, then the subject

Both plants on `scripts/check-finding-guards.ts:145`, `const MAX_UNPROVEN = 119;` → a cap derived from the
population it caps, valued so every other gate stays green (`186 - 67 = 119`).

**Control — single line** (the exact `D4-4` shape this gate was built for):

```
const MAX_UNPROVEN = Object.keys(registry).length - 67;
$ npm run lint:cap-literals                                            EXIT=1
  • scripts/check-finding-guards.ts — MAX_UNPROVEN is "Object.keys(registry).length - 67", not a literal.
$ npm run lint:finding-guards                                          EXIT=0   ← still green, as expected
```

**Subject — the identical derivation, wrapped:**

```
const MAX_UNPROVEN =
  Object.keys(registry).length - 67;
$ npm run lint:cap-literals    EXIT=0
✅ cap literals: 17 downward-only cap(s) across 57 scripts are literals. [read 7342 lines, floor 6475]
$ npm run lint:finding-guards  EXIT=0
```

⚡ **Note the 17.** The green baseline is *18* caps. The wrap did not merely hide the derivation — it
removed the declaration from the gate's population entirely, and the gate printed a **smaller number
beside a ✅**. `MIN_CAPS = 15` has three units of slack, so the loss is absorbed silently.

Restore verified: file copied after the plant, restored from the pre-plant copy, `diff` clean (`DIFF=0`),
`git status --porcelain` empty.

### The consequence

The one gate standing between this repo and *"a cap derived from the list it caps"* — a class it records
being hit **twice in one file** — can be defeated by a line wrap, which is what a formatter does
unprompted to a long declaration. And the tell (`caps` dropping) is inside the slack of its own floor.
Who meets it: the next `D4-4`, arriving as a prettier reflow rather than as an edit anyone reviews.

### Scope, counted by id and a lower bound

`grep -rnE "^\s*(export\s+)?const\s+(MAX|MIN)_[A-Z0-9_]+" scripts --include=*.ts` → **18**, and **0** are
currently multi-line, so there is **no live derived cap today**. What is live is the blindness.

⚠️ The population is also chosen by name prefix. A real ratchet in the same tree sits outside it:
`scripts/check-trust-claims.ts:460`, `const CLAIM_CONSUMER_FLOOR: Record<string, number> = { … }` — a
downward/exact ledger whose own docblock (`D4-8`) says *"EXACT in both directions"*. Its values are
literals today, so again: the blindness is live, the defect is not. `MIN_CAPS`, `*_FLOOR`, `*_LIMIT`,
`*_BUDGET` are each a spelling this gate does not read. ⛔ Per BRIEF rule 2, do not repair this by
enumerating more prefixes.

### The mechanism, as a hypothesis

`DECL` was written as a line regex because the gate scans `text.split('\n')` (`:82`), and every cap in the
tree at authoring time fitted on one line. The `caps` counter — the thing that would notice the population
shrinking — was floored with slack rather than pinned, unlike `check-finding-guards.ts`'s `MIN_ENTRIES`,
which uses **strict equality** for exactly this reason and says so at `:326–340`.

### Remedy — **NOT verified**

Two independent changes, both unverified: (a) match the declaration against the whole stripped text with a
`;`-terminated, newline-crossing pattern rather than per line; (b) pin `MIN_CAPS` with `!==` the way
`MIN_ENTRIES` is pinned, so a declaration leaving the population reds instead of being absorbed. ⚠️ (b)
alone would have caught this plant and (a) alone would too — I did not measure either as implemented, and
(b) adds the two-line-edit friction the sibling gate documents as a feature.

---

## D5-10 — `major` — a REJECTED `lint:s1-coverage` still rewrites the inventory, and `audit-route` routes from it at exit 0

**origin:** `instrument`
**file/line:** `scripts/surface-coverage.ts:679` (the `writeFileSync`) sits **before** `:681`
(`if (missing.length || stale.length) … process.exit(1)`). Consumer: `scripts/audit-route.ts:143`
(`readInventory`), which validates the file only against **its own stated totals**.

### The plant

Removed one entry from the claims file — `packages/core/debt/bnplInstallment.ts` out of
`scripts/surface-coverage.s1.json` (an `off-surface` file in this lane's own manifest).

```
$ npm run lint:s1-coverage                                   GATE_EXIT=1
❌ s1-coverage: the recorded claims do not describe the S1 surface.
  UNCLASSIFIED  packages/core/debt/bnplInstallment.ts — new on the surface; record who swept it, or "never"
```

The gate **rejected** the tree. It had already written the inventory:

```
S1-SURFACE-INVENTORY.md:11   **478 files on the S1 surface · 409 swept · 69 unswept.**   (was 68)
S1-SURFACE-INVENTORY.md:388  | `packages/core/debt/bnplInstallment.ts` | ⛔ **unknown** |
S1-SURFACE-INVENTORY.md:562  - `packages/core/debt/bnplInstallment.ts`   ← the Unswept section
```

Then the consumer, unchanged, on that same tree:

```
$ npx tsx scripts/audit-route.ts --surface=s1 --since=e65f9c7 --check      AUDITROUTE_EXIT=0
✅ audit-route S1 since e65f9c7
   by origin: 69 first-look · 32 fix-churn · … · 49 s0-first-look
   A: 108 files (17 first-look · 9 fix-churn · …)
```

**Exit 0**, a clean ✅, and a file that a pass had swept is now routed **`first-look`**. Restore verified:
both files restored from pre-plant copies, `diff` clean (`D1=0 D2=0`), tree clean.

### The consequence, and its direction

`readInventory`'s consistency check is *internal* — parsed rows vs. the totals line the same generator
wrote — so a rejected inventory is perfectly self-consistent and passes. And the corruption moves in the
**dangerous direction**: `unknown` is an `UNSWEPT_CLAIM`, so the file becomes `first-look`, and under
**[D69] a first-look finding does not restart the convergence count.** A claims file that drifts, or a
gate run that is red and ignored, therefore makes convergence *easier* to declare, not harder — while every
number on the route's success line stays green.

⚠️ Composes with **D5-6**: because these gates rewrite the inventory on *every* run including green ones,
a session has no signal that distinguishes "the inventory moved" from the constant line-ending churn.

### The mechanism, as a hypothesis

The write was placed early so the inventory always reflects the walk ("the doc can never disagree with the
data", `:664`). The `missing`/`stale` refusal was added later and below it. Nothing declares that the
artifact is only valid on the green path, and the consumer has no way to ask. ⚠️ Hypothesis on the
ordering's history; the behaviour is measured.

### Remedy — **NOT verified**

Move the `writeFileSync` **below** the `missing`/`stale` refusal so a rejected tree leaves the previous
inventory intact, **and** have the generator stamp the inventory with the sha + a `status: green` line that
`readInventory` requires. ⚠️ Neither measured. ⛔ The first half alone is not sufficient: it leaves a
**stale** inventory on disk instead of a wrong one, and `audit-route` cannot tell those apart either — see
the note under the `audit-route` verification above.

---

## D5-11 — `minor` — `check-gate-sources.ts` names an assertion that does not exist (and the copy it guards is fine anyway)

**origin:** `instrument` · **file/line:** `scripts/check-gate-sources.ts:31–32`

```ts
/** The extensions `gateSources` treats as source. Kept in sync by the assertion at the bottom. */
const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.yml', '.yaml']);
```

**Measurement:** `grep -n "SOURCE_EXT" scripts/check-gate-sources.ts` → `:32` (declaration) and `:81`
(its only use). **There is no assertion at the bottom, or anywhere.** It is a second literal copy of
`scripts/gateSources.ts:83`; the two are byte-identical today.

**Then I checked whether it matters** (BRIEF: *check whether the code still does what you think it does*).
Planted the dangerous direction — narrowed `gateSources.ts`'s set by dropping `.yml`/`.yaml`:

```
$ npm run lint:gate-sources                                            EXIT=1
❌ gate sources: 1 problem(s).
  • 28 tracked source file(s) are in NO gateSources root and carry no exemption:
      .github/actions/rn-ios-sim-build/action.yml … .github/workflows/embed-pages.yml …
```

**The orphan check (direction 1) covers it.** So the consequence is a **carried premise**, not a hole: a
reader who trusts the sentence believes a sync check exists and would not think to plant the divergence —
and this is the file whose neighbours (`F-B1`, `A-F1`) are exactly that failure. Restore verified
(`D=0`, tree clean).

**Remedy — NOT verified:** delete the clause, or import the set from `gateSources.ts` so there is one
producer. ⚠️ Importing changes `check-gate-sources.ts`'s module graph; I did not measure whether that
disturbs `lint:import-graph` or the scan floors.

---

## D5-12 — `major` — a test file in the tree but in no runner is silently unexecuted, and `test:app` prints "ALL PASSED" over it

**origin:** `instrument`
**file/line:** `apps/rn/src/testing/runAppTests.ts` — a hand-maintained list of `await import(...)` calls;
its header says *"New app-layer tests: add the file + one line here."* Same shape at
`packages/core/testing/runRegressionTests.ts:1–66` (static `import "…"` lines).

### The plant

Wrote a new, unconditionally failing test file into the tree and added it to **no** runner:

```
apps/rn/src/store/__auditP5D.test.ts
  throw new Error('FAIL [auditor-D plant]: this test file executes and fails, if anything runs it.');

$ npm run test:app          EXIT=0    →  ✅ App-layer regression tests: ALL PASSED.
$ npm run typecheck:tests   EXIT=0
```

**Exit 0, "ALL PASSED", with a file in the tree that throws on the first line.** File removed; tree clean.

### There is no live gap — the gap is that nothing would notice one

Measured both enumerations against the tree:

```
apps/rn/src  *.test.ts tracked : 73    await import() in runAppTests : 73   in neither runner: 0
packages/core test* modules    : 64    static imports in runner      : 65   in no runner:      0
```

Both are complete **today**. And `grep -rln "runAppTests" scripts .github` returns only
`finding-guards.json` and `surface-coverage.s0.json` — **no gate binds either list to the tree.** The
standing control is a sentence in a docstring, and `check-ci-chain.ts:15–17` is this repo's own written
verdict on that: *"the header's own remedy was a sentence … and a documentation rule is exactly what
failed the first time."*

### The consequence

`[M5]`, at file granularity: *an instrument in no chain is unexecuted*. A new money test that nobody wires
in passes review, ships, and asserts nothing — and it composes with everything above, because **30 of the
66 registered guard proofs run `test:app`** and **8 run `test:regression`**. A guard whose test file left
the runner would score `failed-open` and be read as a dead guard rather than as an unexecuted one.

### The mechanism, as a hypothesis

The runner's ordering is load-bearing (the header says the sequential `await import()` form exists so
"per-file order [is] honored"), so a glob was presumably rejected in favour of an explicit list — and the
completeness half was left to prose. ⚠️ Hypothesis.

### Remedy — **NOT verified**

A gate asserting `git ls-files 'apps/rn/src/**/*.test.ts'` ⊆ the runner's `await import()` set, and the
same for `packages/core`; it needs no glob-import and keeps the ordering. ⚠️ Unverified, and the parse has
the usual hazard — my own measurement matched on basename, which would collide on two same-named test
files in different directories. **What would make it checkable** is exactly this gate; what it must not be
is a count, since a count with slack is `D5-9`.

---

## D5-13 — `major` — the trust ledger's population is an enumeration of four formatter names, and a fifth exists in the tree

**origin:** `instrument`
**file/line:** `scripts/check-trust-claims.ts:199` —
`const PRINTS_MONEY = /\b(formatCurrency|formatWhole|formatMoney|formatCompactMoney)\s*\(/;`
and `:279` — `if (!PRINTS_MONEY.test(src) || !READS_ENTITIES.test(src)) continue;`

### The plant and its control

New file `apps/rn/src/store/__auditP5DMoney.ts`, in scope (`apps/rn/src/`), `git add -N` so
`trackedSources()` sees it. It sums `store.debts[].balance`, formats it, and **never asks
`trustSelectors`** — the exact defect the ledger exists to refuse.

| version | formatter | `lint:trust-claims` |
|---|---|---|
| **subject** | `formatDisplayAmount` (`packages/core/utils/formatDisplayAmount.ts`) | **EXIT=0** — `✅ trust claims … ⭐ 0 claim sites open — all **7** money-printing files … call the guard (floor 6)` |
| **control** | `formatWhole` | **EXIT=1** — `✗ [ledger] apps/rn/src/store/__auditP5DMoney.ts reads the user's entity lists and prints money without asking trustSelectors.` |

The population line still read **7** under the subject: the file was never *considered*, so it was never
unguarded. Cleanup verified: `git rm --cached` + delete, `git status --porcelain` empty.

### Why the floor cannot save it

`MIN_POPULATION = 6` (`:306`) is checked with `<`. A floor sees the population **shrink**; it is
structurally blind to a money file that never joins it. The file's own comment says so — *"A floor, not an
exact count … What it catches is the failure being guarded: total blinding takes it to ~0"* — which is
true and is a different failure from this one.

### The consequence

A new money surface can state a figure derived from balances the app may not have read, and
`lint:trust-claims` prints *"all 7 money-printing files … call the guard"* over it. That sentence is the
one `check-trust-claims.ts` exists to make true. Who meets it: the user, reading a total the app was not
entitled to state — one file away from a blocker.

⚠️ **No live defect today.** `grep -rln formatDisplayAmount` → `components/ResultsSection.tsx` (the LEGACY
Next tree, explicitly out of scope at `:110`) and its own definition. What is live is the blindness.

⚠️ **Count as a lower bound.** I enumerated formatters by reading `apps/rn/src/utils/format.ts` and
`packages/core/utils/format*.ts` — which is itself an enumeration, and the one spelling neither of us can
see is a component that interpolates a number directly (`` `$${x.toFixed(2)}` ``). ⛔ BRIEF rule 2: **do not
repair this by adding `formatDisplayAmount` to the regex.**

### The mechanism, as a hypothesis

The regex was written from the formatters the money screens used at authoring time;
`formatDisplayAmount` lives in `packages/core/utils/` and is used only by the legacy tree, so it was
outside the author's field of view. ⚠️ Hypothesis.

### Remedy — **NOT verified**

Invert the population the way `audit-route.ts` inverts its enumeration: consider **every** in-scope file
that reads entity lists, and require each to either ask the guard or carry a ledger row saying it prints
no money — so a new formatter costs a ledger line rather than being invisible. ⚠️ Unverified and expensive:
`READS_ENTITIES` alone matches far more than 7 files, so this trades a silent hole for a large one-time
ledger. A cheaper unverified middle: derive `PRINTS_MONEY` from the exported names of the format modules
rather than from a literal list, which at least fails loudly when a formatter is added.

---

## D5-14 — `minor` — the v1.7 cutover envelope carries no cycle history, which is the hazard its own header names

**origin:** `s0-first-look` ([D69] exempt from the count, not from the fix)
**file/line:** `scripts/make-cutover-backups.ts:90–117` (`v17Envelope()`); consumer
`apps/rn/src/data/migrationAudit/cutoverFiles.test.ts:116–121`.

**Measurement:**

```
$ grep -c cycleHistory docs/cutover/v16-populated.json   → 1
$ grep -c cycleHistory docs/cutover/v17-envelope.json    → 0
```

`v17Envelope()` copies eight fields off `v16Populated()` and omits `cycleHistory` and
`completedRecommendedActions`. The v1.7 store type has the field
(`apps/rn/src/data/models.ts:320  cycleHistory: PayCycleSnapshot[]`).

And the assertions differ in kind. On the v1.6 path the test checks **values**:

```
cutoverFiles.test.ts:68  assert(s.cycleHistory.length === 2, '2 cycle snapshots land');
cutoverFiles.test.ts:70  typeof s.cycleHistory[0]?.cycleEndDate === 'string' && … totalPaidThisCycle === 'number'
```

On the v1.7 round trip it checks only existence:

```
cutoverFiles.test.ts:120  assert(viaFile.store !== null, 'v17-envelope imports');
cutoverFiles.test.ts:121  assert(checkAll(viaFile).length === 0, 'v17-envelope: no invariant violations');
```

**Consequence:** the export→import round trip on the new build never carries History, so nothing exercises
it there — and the file's own header names exactly this: *"a hand-typed portfolio is how a cutover test
quietly ends up exercising three debts and no history."* It also repeats the header's second lesson —
*"the tests did not catch it because they asserted `goals.length === 1` — a COUNT"* — on the half that was
written later. Who meets it: a cutover tester whose History renders empty or wrong on the new build, with
the fixture and the test both green.

**Mechanism (hypothesis):** `v17Envelope()` was written to exercise the *importer's envelope shape*, and
the field list was drawn from what the importer needed rather than from what the store holds. ⚠️ Hypothesis.

**Remedy — NOT verified:** carry `cycleHistory` (and `completedRecommendedActions`) into the v1.7 `store`,
and assert their values on the round trip the way `:68–70` does on the v1.6 path. ⚠️ I did not check that
the v1.7 importer accepts `cycleHistory` in the envelope — if it does not, the fixture is right and the
gap is in the importer, which is a different and larger finding.

---

## Addendum to D5-3 — the port fault reads ONE config

`prove-guards.ts:221` derives the port from `apps/rn/playwright.config.ts` alone (`PORT = 4319`). The
repo has **three** playwright configs on **two** ports: `playwright.config.ts` and
`playwright.shots.config.ts` both use **4319**, `playwright.embed.config.ts` uses **4320**
(`apps/rn/playwright.embed.config.ts:39`), and all three set `reuseExistingServer: !process.env.CI`.
No registry proof currently runs `test:e2e:embed`, so **this half is not live** — but it is the same
single-spelling assumption as the `cmd`-only predicate, and it argues the same way for the remedy stated
under D5-3: refuse on **any** listening playwright port rather than enumerate.

---

## D5-4 (continued) — the other two, found by the same execution

**51 of the 66 registered proofs were executed, for the first time by anyone.** 48 held. **Three came back
`reason=WRONG`**, all by the same mechanism — an earlier assertion in the same suite reacts to the plant
and aborts before the guard's own assertion runs.

| id | command | the assertion that actually fired |
|---|---|---|
| `S1P3-A4-CADENCE` | `test:regression` | `FAIL [A-F3 — a plan six months behind is due THREE charges this cycle, not its whole $1,200 balance]: expected 300, got 100` |
| `S1P3-C5-PAYWALL` | `test:app` | `FAIL [Paywall, the lead — states NOTHING while an obligation this paycheck must cover went unread (expected null, got "You have $0 cushion this paycheck.")]` |
| `S1P3-G5-SAVINGSPOOL` | `test:app` | `FAIL [C4-5, TWO pots one unread — the caption is a fact about the STORE and does not depend on there being an offer (expected true, got false)]` |

⚡ **All three interlopers are pass-4 assertions** (`A-F3` is `S1.11.5.1`; `C4-5` is `S1P4-C4-5-ARITY`,
which I executed and which **holds**). Consistent with D5-4's hypothesis: each proof was recorded before
the assertion that now sits between the plant and its target. `S1P3-C5-PAYWALL` and `S1P3-G5-SAVINGSPOOL`
were **not** further isolated — I relaxed the upstream assertion only for `S1P3-A4-CADENCE` — so for those
two I have measured that the proof is unattributable and **not** whether the guard beneath it holds.
⚠️ Treat them as unproven, not as dead.

---

# Summary

## By severity and origin

| | `instrument` | `s0-first-look` | `off-surface` | `neighbour` | **total** |
|---|---|---|---|---|---|
| **blocker** | 0 | 0 | 0 | 0 | **0** |
| **major** | 10 | 0 | 0 | 0 | **10** |
| **minor** | 3 | 1 | 0 | 0 | **4** |
| **total** | **13** | **1** | **0** | **0** | **14** |

⚠️ **Every count in this report is a lower bound**, and this one especially: the `off-surface` and
`neighbour` files in my manifest got the least attention (see *Not covered* below), so their zeros mean
"not found by me", not "clean".

| id | sev | origin | one line |
|---|---|---|---|
| **D5-1** | major | instrument | 66 of 66 proofs read "never run"; nothing reads `measured`/`sha`; `prove:guards --all` is in no chain, so `MAX_UNPROVEN` drains as JSON is authored |
| **D5-2** | minor | instrument | two producers of "never tested" disagree — `--list` says 120, the gate says 119 |
| **D5-3** | major | instrument | the "something is already serving" fault covers `cmd:` proofs only; 2 live `run:` playwright proofs bypass it |
| **D5-4** | major | instrument | 3 of 51 executed proofs red for the wrong reason; `prove:guards --all` cannot pass at this commit |
| **D5-5** | major | instrument | `wrong-reason` is vacuous for 26 of 50 checkable proofs — an unrelated plant scored a green tick with `reason=MATCHED` |
| **D5-6** | major | instrument | a fully green `lint:rn` leaves the tree dirty, and `git diff` shows nothing |
| **D5-7** | minor | instrument | 11 of 23 `test:gate-plants` scenarios carry no `expect` |
| **D5-8** | major | instrument | `neighbour` is seeded by `changed` alone — 72 files adjacent to never-swept files reach no lane |
| **D5-9** | major | instrument | `lint:cap-literals` is blind to a wrapped derived cap, and its floor absorbs the population drop |
| **D5-10** | major | instrument | a REJECTED `lint:s1-coverage` still writes the inventory; `audit-route` routes from it at exit 0, upgrading a swept file to `first-look` |
| **D5-11** | minor | instrument | `check-gate-sources.ts` cites a sync assertion that does not exist (the direction that matters is covered anyway) |
| **D5-12** | major | instrument | a test file in no runner is silently unexecuted; `test:app` printed ALL PASSED over a file that throws |
| **D5-13** | major | instrument | the trust ledger's population is a 4-name formatter enumeration; a fifth formatter exists in the tree |
| **D5-14** | minor | s0-first-look | the v1.7 cutover envelope carries no cycle history — the hazard its own header names |

## Every instrument exercised: what I planted, did it red, for the right reason?

| instrument | plant | redded? | right reason? |
|---|---|---|---|
| `prove:guards` (registry, 51 entries) | each entry's own recorded un-fix | 51/51 red under plant, 51/51 green control | **48 yes / 3 no** (`reason=WRONG`) → **D5-4** |
| `prove:guards` port fault | `run:`-form playwright proof + a listener on :4319 | **no** (fell through to the anchor check) | n/a → **D5-3**. Control (`cmd:` form) faulted correctly |
| `verdict()` reason check | an unrelated defect carrying another finding's `expect` | redded | **NO — scored a green tick with `reason=MATCHED`** → **D5-5** |
| `prove:guards --selftest` | ran as shipped, inside `lint:rn`'s chain | n/a | passes; its 3 rows exercise `failed-open` and two-edits-one-file |
| `lint:cap-literals` | single-line derived cap | **yes**, named the constant | yes (this is the control) |
| `lint:cap-literals` | **the same cap, wrapped to two lines** | **no** — green, and the count fell 18 to 17 | n/a → **D5-9** |
| `lint:finding-guards` | derived cap in its own source | no (correct — not its job) | confirms why `lint:cap-literals` exists |
| `lint:gate-sources` | narrowed `gateSources.SOURCE_EXT` (dropped `.yml`) | **yes**, 28 orphans named | yes → refutes the exploitability half of **D5-11** |
| `lint:s1-coverage` | removed one entry from the claims file | **yes**, `UNCLASSIFIED` | yes — **but it wrote the inventory anyway** → **D5-10** |
| `audit-route.ts --check` | consumer of the above, on the rejected inventory | **no** — exit 0, `69 first-look` | n/a → **D5-10** |
| `audit-route.ts` | regenerated the whole route and diffed the manifests | n/a | **repair verified**: A/B/C/D + ORIGINS.tsv all IDENTICAL, `s0-first-look` emitted |
| `lint:trust-claims` | a new money file using `formatWhole`, no guard | **yes**, named the file (control) | yes |
| `lint:trust-claims` | **the same file using `formatDisplayAmount`** | **no** — green, population still 7 | n/a → **D5-13** |
| `test:app` | a `*.test.ts` in the tree, in no runner, that throws | **no** — green, ALL PASSED | n/a → **D5-12** |
| `test:gate-plants` | ran as shipped | green, "all 23 gates fail closed", exit 0 | 12/23 rows print `reason=`; 11 print none → **D5-7**. Leaves the tree dirty → **D5-6** |
| the 7 coverage/closure/copy gates | run from a clean tree, tree reset between each | all exit 0 | only `lint:s0-coverage` and `lint:s1-coverage` dirty the tree → **D5-6** |
| `check-ci-chain.ts` | read only — its `isGating` self-check covers the four `D4-5` spellings; `web-e2e.yml` is one job, no `needs`, `branches: ["**"]` | — | no finding |
| `check-restore-doors.ts` | read only — 4 doors, floor 4, **no slack** | — | no finding |
| `check-trust-claims.ts` caps | read only — `MAX_EXEMPT=1` / `MAX_OPEN=0` literal; `MIN_POPULATION=6` vs 7 (one unit of slack, self-documented) | — | the slack is real but only sees shrinkage → **D5-13** is the live half |
| `test-gate-plants.ts` `MIN_SCENARIOS` | read only — 23 vs 23, **no slack** | — | no finding |

## Proof that the main tree is untouched

```
$ git -C /c/Users/Jason/debt-app-v1 status --porcelain
 M docs/DEBT_ELEVATION_PLAN.md
?? docs/audits/2026-08-29-s1-money-pass5/A-engine.md
?? docs/audits/2026-08-29-s1-money-pass5/B-store-storage.md
?? docs/audits/2026-08-29-s1-money-pass5/C-screens.md
?? docs/audits/2026-08-29-s1-money-pass5/D-instruments.md
?? docs/audits/2026-08-29-s1-money-pass5/DISPATCH.md
```

⚠️ Stated exactly: **the `M` line and all five `??` entries except my own `D-instruments.md` were already
present when I started** — I captured `git status --porcelain` as my second tool call and it showed the
identical set. The only line I am responsible for is `?? .../D-instruments.md`. Every plant ran in the
detached worktree at `C:\Users\Jason\audit-p5-d`, whose final `git status --porcelain` is **empty**.

## Not covered — said out loud, so the zeros above do not imply coverage

**Proofs not executed (15 of 66):** the 11 `npx playwright ...` entries (each needs a cold `expo export`,
about two minutes, twice per proof); `S1P4-A-F1-WINDOWREQUIRED` (`run: typecheck` — a WHOLE-MONOREPO
typecheck, refused by this round's rule 3, which is itself worth noting: a registered proof whose command
the round's own resource rules forbid); `S1P3-B6` (`typecheck:rn`); and the two `test:gate-plants` proofs
(`S1P2-B1-REASON`, `S1P4-D4-12-LEDGERCLAIM`, about 50 s per gate run).

**Files in my manifest I did not read, or read only structurally:**

- `app/page.tsx` (1,758 lines, `off-surface`) — **not read.** The legacy Next money page. It is
  `off-surface` precisely because no inventory owns it; that hole is unclosed by me.
- `components/SnowballSection.tsx` (1,361), `components/AmortizationCalendar.tsx` (207),
  `components/PayoffInterestSavedCard.tsx` (44) — **all three `neighbour` files, not read.**
- `scripts/strings-inventory.ts` (721) and `scripts/test-gate-plants.ts` (674) — grep level only
  (caps, floors, exit paths); no plant against `strings-inventory`.
- `scripts/check-scan-floors.ts`, `check-destructive-writes.ts`, `check-local-dates.ts`,
  `scripts/lib/importGraph.ts`, `scripts/test-import-graph.ts`, `scripts/test-line-endings.ts`,
  `packages/core/testing/testPayCycleHistoryRegression.ts` — read at grep level, **no plants**.
- `s0-first-look`, unread: `apps/rn/app.json`, `apps/rn/eslint.config.mjs`,
  `scripts/collect-lane-diagnostics.mjs`, `scripts/compare-ios-screenshots.mjs`,
  `scripts/conform-app-preview.sh`, `scripts/test-conform-assertions.sh`, `scripts/maestro-results.mjs`,
  `scripts/preflight-xcuitest-target.ts`, `scripts/surface-inventory.ts`. **Nine files no pass has ever
  swept, and this one did not either.**
- `npm run lint:rn` was **never run end to end** (40 gates, and `test:gate-plants` alone is about 50 s), so
  I have no statement about the chain as a whole beyond the individual gates listed above.

**No OOM occurred.** Every node/tsx invocation ran under `NODE_OPTIONS=--max-old-space-size=1536`.

## What would make completeness checkable here

Three findings (**D5-9**, **D5-12**, **D5-13**) are one shape: *an instrument's population is an
enumeration, and nothing red-flags a member that never joins it.* No count catches that — a floor sees
shrinkage only, and **D5-9** shows a count with slack does not even see that. The checkable form is the
inversion `audit-route.ts` already uses: enumerate what is ACCOUNTED FOR and refuse the remainder. One
pattern, three sites, cheaper to state once than to re-derive per gate.
