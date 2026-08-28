# S1 pass 4 — auditor D — THE INSTRUMENTS

**Pin:** `e65f9c7` · **route:** `ROUTING-D.txt`, 40 files / 10,629 lines — all of `scripts/`
plus the repo-root config no surface owns.

**Isolation.** ⚠️ **A full CLONE, not a linked worktree** — `C:/Users/Jason/audit-d-clone` at `e65f9c7`.
That is deliberate, and it is this report's own finding `D4-2`: `test:gate-plants` dies with an uncaught
`ENOENT` inside a linked worktree, because `.git` there is a file rather than a directory, so 10 of its 21
scenarios cannot run in the environment the audit protocol otherwise mandates. **No source file in
`C:/Users/Jason/debt-app-v1` was edited, committed or pushed**; the closing check is at the end of this
file. Every plant below was applied in the clone, measured, then reverted with `git checkout --`, with
`git status --porcelain` read after each one.

**Memory discipline (resume protocol).** `NODE_OPTIONS="--max-old-space-size=1536"` on every `node` /
`npm` / `npx` call in this report, no exceptions. No whole-monorepo typecheck was run; `typecheck:scripts`
was run alone with `--incremental false --pretty false` and did **not** OOM (§5.2). No server was started
and port 4319 was never bound.

**This is a RESUME.** `D4-1` and `D4-2` were measured before the first dispatch died to host memory
exhaustion; they stand unchanged and unrenumbered. Everything from `D4-3` on, and the whole of §2–§6, is
this run. Per the resume protocol the entire route was **re-swept**, because the dead run left §4 empty
and an unevidenced sweep is not a sweep.

**Work done:** six full `test:gate-plants` runs (one baseline, five plants) · `test:regression` under a
plant · a scoped `tsc -p scripts/tsconfig.json` in three states · `audit-route.ts --check` in two ·
~30 single-gate runs · **30 plants across 15 files**, plus two files created and deleted.

---

## 1. Findings

### D4-1 — `major` · `S1P2-B1-REASON` is STILL guard-only after the D3-3 fix that was raised about it

**Origin:** `instrument` (`scripts/test-gate-plants.ts`, `scripts/check-finding-guards.ts`).
**User-facing consequence:** the one instrument in the tree that proves a gate fails *closed* can be
silently reverted to scoring a gate green when it reds for the wrong reason — so the next
green `test:gate-plants` line stops meaning what it says, and a blind money gate ships behind it.

**What pass 3's `D3-3` said:** `S1P2-B1-REASON` named the line that *computes* the check
(`const rightReason = …`) rather than the line that *uses* it, so the entry was green with B-1's own
defect restored. The fixing session re-pointed the token and added a declaration-vs-use check.

**Where it landed.** `scripts/finding-guards.json` → `S1P2-B1-REASON.token` is now
`"if (!ok) failures++;"` — `scripts/test-gate-plants.ts:555`. The line that actually *uses*
`rightReason` is line 554:

```ts
const rightReason = !s.expect || withPlant.out.includes(s.expect);          // 553  computes
const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0 && rightReason;  // 554  USES
if (!ok) failures++;                                                        // 555  the token
```

**The measurement (plant, in the clone at the pin).** Deleted `&& rightReason` from line 554 —
B-1's defect verbatim — and left everything else alone:

```
grep -n 'PLANT B-1' scripts/test-gate-plants.ts
  554:    const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0; // PLANT B-1 un-fix
npm run lint:finding-guards   →  rc=0
  ✅ finding-guards: 150 of 151 findings carry a standing guard
npx tsc --noEmit -p scripts/tsconfig.json  →  rc=0   (the now-unused local does not red typecheck)
npm run test:gate-plants                   →  no scenario attributable to the un-fix redded
```

⛔ **The token survived its own un-fix.** The re-point moved the token one line *further away* from
the use, not onto it.

**Why the new D3-3 check cannot see it, and this is the interesting half.**
`check-finding-guards.ts:208-224` only fires when the token's line matches
`/^\s*(?:export\s+)?(?:const|let|var|(?:async\s+)?function)\s+([A-Za-z_$][\w$]*)/`. Line 555 is an
`if`, so the check never runs. And the *correct* target — line 554 — **is itself a `const`
declaration whose name `ok` is used on line 555**, so pointing the token there would make the D3-3
check red the entry. ⚡ **The D3-3 remedy made the right line untargetable and the entry was moved to
a wrong one that the remedy is structurally blind to.** That is reading rule 8 (observation, premise
and remedy fail independently) and rule 13 (correcting the losing copy buys the next recurrence).

**Remedy, as a hypothesis (not verified):** point the token at the *expression*, not the line —
`"&& rightReason"`. `present()` gives it a trailing word boundary and no leading one, so it reds on
the un-fix. Separately, the D3-3 check is narrower than its own class: extend it beyond
declaration-shaped token lines, e.g. red when the token line contains no identifier that any *other*
code line defines (an "is this line downstream of the thing being guarded" test), or require that
tokens for a boolean-composition fix name the operand.

---

### D4-2 — `minor` · `test:gate-plants` crashes in a linked git worktree, which is the environment the audit protocol mandates

**Origin:** `instrument` (`scripts/test-gate-plants.ts:535`).
**Consequence:** not user-facing. The harness dies with an uncaught `ENOENT` and 10 of its 21
scenarios never run; the failure is loud, so nothing goes green while doing less.

`const tmpIndex = …; copyFileSync(join(REPO_ROOT, '.git', 'index'), tmpIndex)` assumes `.git` is a
directory. In a linked worktree `.git` is a **file** holding `gitdir: …`.

**The measurement.** In `C:\Users\Jason\audit-d-wt` (worktree at the pin):

```
npm run test:gate-plants  → 11 scenarios green, then
Error: ENOENT: no such file or directory, copyfile 'C:\Users\Jason\audit-d-wt\.git\index' -> …
    at test-gate-plants.ts:535
```

The same command in a full clone at the same pin runs all 21 green. ⚠️ The brief tells every auditor
to plant "in an isolated git worktree at the pin"; in that environment this harness cannot run, and
the crash reads as a broken harness rather than as "these 10 gates are unverified here".

**Remedy hypothesis:** resolve the index path from git —
`execFileSync('git', ['rev-parse', '--git-path', 'index'])` — instead of `join(REPO_ROOT, '.git', 'index')`.

### D4-3 — `major` · `lint:trust-claims`' "tests do not count as consumers" is false for `packages/**`, this repo's biggest test corpus

**Origin:** `instrument` (`scripts/check-trust-claims.ts:54`).
**User-facing consequence:** a `MoneyClaim` route can lose its last real production caller with
`lint:trust-claims` green — so the app resumes printing *"0% APR"* on a card charging 22% and
*"$0.00/mo"* on one demanding $150, which is pass-3 blocker `C-1` verbatim, behind the very gate
written to make `C-1` impossible.

**The claim.** The gate's own docblock, check 1: *"Every `MoneyClaim` is consumed in production.
⚠️ Tests do not count as consumers: `trustSelectors.test.ts` asserted `mayClaim(…, 'row-figures')
=== false` and passed, because the selector was correct and unused."*

**The implementation** (`check-trust-claims.ts:54`):

```ts
const isTest = (rel: string) => /\.test\.tsx?$/.test(rel) || rel.startsWith('apps/rn/tests/');
const inScope = (rel: string) => rel.startsWith('apps/rn/src/') || rel.startsWith('packages/');
```

⛔ **`packages/core` does not use `.test.ts`.** Its convention is `testXxx.ts` — `testDebtProjection.ts`,
`testBnplInstallment.ts`, `testPayCycleHistoryRegression.ts`, `testAmountField.ts`, … **40+ tracked
files**, plus the whole of `packages/core/testing/`. `inScope` admits all of them and `isTest` classifies
every one as **production**.

**The measurement (plant, clone at the pin).** Two steps, so the second is decisive rather than suggestive.

1. Remove the only production consumer of `'goal-amounts'` — the four `rowFieldUnread` calls in
   `apps/rn/src/app/(tabs)/money.tsx` — by renaming the literal:

```
❌ trust claims: 5 problem(s)
  ✗ [claim] 'goal-amounts' is declared in apps/rn/src/store/trustSelectors.ts and asked by NO production file.
  ✗ [route] … asks claim 'goal-amountsZZ', which is not a MoneyClaim   ×4
```
   The `C-1` guard fires. Good.

2. Leave that in place and append **to a test file** —
   `packages/core/debt/testDebtProjection.ts` — `const _plantClaim = 'goal-amounts';`:

```
❌ trust claims: 4 problem(s)
  ✗ [route] … asks claim 'goal-amountsZZ', which is not a MoneyClaim   ×4
```

⛔ **The `[claim]` failure is GONE.** One string literal in a `packages/core` test satisfied *"asked by a
production file"*. The four remaining rows are the rename artefact, not the finding; with a cleaner
plant that keeps the call literals valid, the gate is fully green over a claim no production code asks.

**Why reading missed it.** The docblock states the exclusion and the exclusion is real for `apps/rn` —
the half the auditor's eye lands on. `inScope` was widened to `packages/` and `isTest` was not, in the
same file. Reading rule 4: judge the condition the consumer evaluates, not the example the docblock cited.

**Remedy, as a hypothesis (not verified):** widen `isTest` to the corpus `inScope` actually admits —
`/(^|\/)test[A-Z]/.test(basename)`, `/\/testing\//`, `/\.test\.tsx?$/`, `apps/rn/tests/`. ⚠️ Verify the
widening does not *shrink* check 3's ledger population into hiding a real money surface: the same
`isTest` gates the ledger, so files that stop being "production" also stop being ledgerable. Better,
and testable: derive the test set from what the test runners actually execute
(`packages/core/testing/runRegressionTests`, `apps/rn/src/testing/runAppTests.ts`) rather than from a
path shape — those two files are the authoritative list and both are on this route.

---

### D4-4 — `major` · BOTH of `check-trust-claims.ts`'s registered guards survive their own un-fix — `S1P3-D3-CAPS` and `S1P3-G-LIVENESSLEDGER` are GUARD-ONLY

**Origin:** `instrument` (`scripts/check-trust-claims.ts:182-183, 261`; `scripts/finding-guards.json`).
**User-facing consequence:** the three downward-only ratchets on the app's only money-trust ledger can be
returned to no-ops in a one-line edit with `lint:trust-claims` **and** `lint:finding-guards` both green —
so unguarded money surfaces re-accumulate silently, and the next *"Groceries · $0"* / *"0% APR"* screen
ships behind a ledger that stopped counting.

**What the two entries claim.** `S1P3-D3-CAPS`: *"check-trust-claims.ts shipped with MAX_EXEMPT/MAX_OPEN
computed as `Object.keys(X).length`, so both downward-only caps were VACUOUS … Now literals, and
plant-verified by adding a row above the cap."* `S1P3-G-LIVENESSLEDGER`: *"cap downward-only … counts
exact in BOTH directions."* Their tokens are `"This cap only goes DOWN."` (the failure **message**) and
`"if (livenessTotal > MAX_LIVENESS_SITES) {"` (the **comparison**, not the cap).

⛔ **Neither token is the constant.** Reverting `MAX_EXEMPT`/`MAX_OPEN`/`MAX_LIVENESS_SITES` to derived
expressions leaves the message and the comparison byte-identical.

**The measurement — a clean A/B in the clone at the pin, one variable.** The tree was first put into the
state the caps exist to refuse, with **no other rule broken**: `apps/rn/src/widget/snapshot.ts` was made
genuinely stop asking the trust module (import path changed) and declared as a second `EXEMPT` row, and a
real second `balance > 0` site was added to `apps/rn/src/store/drift.ts` with its ledger row raised 1→2.

**A · caps as shipped (literals)** — `npm run lint:trust-claims` **EXIT=1**, and the only two failures are
the caps:

```
❌ trust claims: 2 problem(s)
  ✗ [ledger]   MAX_EXEMPT is 1 and EXEMPT holds 2.               This cap only goes DOWN.
  ✗ [liveness] MAX_LIVENESS_SITES is 13 and the ledger holds 14. This cap only goes DOWN.
```

**B · same tree, caps un-fixed to derived** — the entire un-fix is three constants:

```ts
const MAX_EXEMPT = Object.keys(EXEMPT).length;
const MAX_OPEN   = Object.keys(OPEN).length;
const MAX_LIVENESS_SITES = Object.values(LIVENESS_OPEN).reduce((x, r) => x + r.sites, 0);
```

```
npm run lint:trust-claims   EXIT=0
  ✅ trust claims: 4 claims all consumed in production …
     ⚠️ 14 liveness re-derivation(s) … cap 14 — …
npm run lint:finding-guards EXIT=0
  ✅ finding-guards: 150 of 151 findings carry a standing guard
grep -c "This cap only goes DOWN."                  scripts/check-trust-claims.ts → 3
grep -c "if (livenessTotal > MAX_LIVENESS_SITES) {" scripts/check-trust-claims.ts → 1
```

⛔ **Fully green over 2 exemptions against a cap of 1 and 14 sites against a cap of 13.** The green line
even prints `cap 14` — the vacuity is legible in the gate's own success sentence and nothing reads it.
⚡ `S1P3-D3-CAPS` exists **for this exact defect**, and its guard cannot see the defect return.

**And nothing behavioural covers it either.** `scripts/test-gate-plants.ts` carries 21 scenarios over
11 gates (`grep -n "gate: '"`); **`lint:trust-claims` is not one of them.** So the token is the only guard
there is, and the token is a message string.

**A second, smaller half in the same three lines.** All three caps compare with `>` where the sibling
gate uses `!==`. `check-finding-guards.ts`'s own docblock names the consequence: *"`MAX_UNGUARDED` was
`>`, so it acquires the identical slack the moment one backlog entry is guarded."* Here: fix one liveness
site → total 12, cap stays 13, **green with no demand to lower it** → a new site can then be added back
to any ledgered row and the total returns to 13, still green. The ratchet un-ratchets on its first
success. (Not separately planted; it follows from the operator, and the sibling's own measurement.)

**Remedy, as a hypothesis (not verified):** (1) re-point both tokens at the **constants** —
`"const MAX_LIVENESS_SITES = 13"` and `"const MAX_EXEMPT = 1"` — a token naming a literal cannot survive
the literal becoming an expression, and neither is declaration-shaped-with-a-use so the D3-3 check will
not red them; (2) switch the three comparisons to `!==` with the two-sided message the sibling already
writes; (3) add a `lint:trust-claims` scenario to `test-gate-plants.ts` — it is the only gate in the
S1 money cluster with no plant at all, and a plant is what would have caught this without a token at all.

---

### D4-5 — `major` · `lint:ci-chain` cannot tell a step that RUNS from a step that is merely PRESENT — `if: false` and `continue-on-error: true` both pass

**Origin:** `instrument` (`scripts/check-ci-chain.ts:57-65`).
**User-facing consequence:** the marketing embed can be deployed from a CI run that never executed the
embed suite — `[W1-3]` verbatim — because `embed-pages.yml`'s `[D44]` guard trusts a green `web-e2e`,
and `web-e2e` goes green with the embed step disabled by one word that `lint:ci-chain` blesses.

**The gate's own claim** (its success line): *"all 8 gating links of `validate:release:rn` **run** in
`.github/workflows/web-e2e.yml`."* What it measures is that the string `npm run <link>` appears on a
`run:` line:

```ts
const ciRuns = new Set(
  workflow.split(/\r?\n/)
    .filter((l) => /^\s*run:\s/.test(l) || /^\s{8,}npm run /.test(l))
    .flatMap((l) => [...l.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1])),
);
```

Nothing reads the step's `if:` or `continue-on-error:`.

**The measurement — four plants on the embed step of `web-e2e.yml`, in the clone at the pin.**

| plant | `npm run lint:ci-chain` | |
|---|---|---|
| step **deleted** | **EXIT=1** — `[missing] validate:release:rn runs \`npm run test:e2e:embed\` and … does not` | ✅ the guard works |
| `run:` line **commented out** | **EXIT=1**, same message | ✅ the prose trap holds |
| **`if: false`** added to the step | **EXIT=0** — *"all 8 gating links … run in …"* | ⛔ |
| **`continue-on-error: true`** added | **EXIT=0** — same green sentence | ⛔ |

⛔ **The green sentence is a false statement in the last two rows.** The step is in the file, it never
gates, and the gate written to stop exactly that says all eight links run.

**Why this is the class the file was written for.** Its docblock: *"the header's own remedy was a
sentence … and a documentation rule is exactly what failed the first time."* The rewrite replaced the
sentence with a check on **presence**, and presence was never the property that failed — `[W1-3]` was
three links **absent**, and absence is the one spelling of *"does not run"* this catches. Reading rule 4:
it judges the example the finding cited, not the condition CI evaluates.

**Closure verdict impact:** `S1P3-CI-CHAIN` is **PARTIAL** — the named `[W1-3]` instance is genuinely
guarded (plant 1 and 2 red), and two sibling instances of the same class are not. ⚠️ Separately its token
`"problems.push("` is generic — it occurs **5** times in the file and survives any neutering of the
comparison that keeps the reporting code; only the plants above say anything about behaviour, and there
is no `test:gate-plants` scenario for `lint:ci-chain`.

**Remedy, as a hypothesis (not verified):** parse the workflow with the `yaml` dependency the repo
already has (`devDependencies.yaml ^2.9.0`), walk `jobs.*.steps[]`, and require for each link a step that
runs it **with no `if:` and no `continue-on-error: true`** — or, if the job itself is conditional, that
the job's `if:` is absent too. A line-regex over a YAML file cannot express "this step executes"; the
parser can. ⚠️ Verify the parse against the `run: |` multi-line block at line 67, which the current
regex reaches through its `\s{8,}npm run` arm.

---

### D4-6 — `blocker` (instrument) · `rightReason` is the ONLY thing guarding pass-3 `D3-3`, and deleting it prints `reason=WRONG` beside a green tick while the harness announces "all 21 gates fail closed"

**Origin:** `instrument` (`scripts/test-gate-plants.ts:553-559`, `scripts/check-finding-guards.ts:208-224`).
**User-facing consequence:** the whole `test:gate-plants` harness — the only instrument in the tree that
proves a gate fails **closed**, and the last link of `lint:rn` — can be turned into a scenario counter
that scores every gate green regardless of *why* it redded, with `lint:rn`, `lint:finding-guards` and
`test:gate-plants` all exit 0. Every money gate behind it then reports green with no one able to tell
whether it still refuses anything.

⚠️ **This is `D4-1` continued, and it is the half that makes `D4-1` a blocker rather than a curiosity.**
`D4-1` established that `S1P2-B1-REASON`'s token survives the deletion of `&& rightReason`. This
establishes **what that deletion switches off**.

**Step 1 — what `rightReason` is actually protecting.** Neuter pass-3 `D3-3`'s entire remedy — the
declaration-vs-use check in `check-finding-guards.ts` — with its registered token
(`"if (usedElsewhere) {"`) left in place: `if (decl) {` → `if (false && decl) {`.

```
grep -c "if (usedElsewhere) {" scripts/check-finding-guards.ts   → 1     (token intact)
npm run lint:finding-guards                                       → EXIT 0
npm run test:gate-plants                                          → EXIT 1
  ❌ lint:finding-guards [D3-3]  plant-applied=YES · planted=exit 1 · control=exit 0 · reason=WRONG
❌ test:gate-plants — 2 of 21 scenarios failed.
```

⚡ **The un-fix is caught only by `reason=WRONG`.** `planted=exit 1` and `control=exit 0` are both
satisfied — the gate still reds on the D3-3 fixture, just for an unrelated reason. The `expect` string
comparison is the entire discriminator.

**Step 2 — compose it with `D4-1`.** Keep the D3-3 neuter and additionally apply `D4-1`'s un-fix,
which is one clause on one line of `test-gate-plants.ts:554`:

```ts
const ok = planted && withPlant.status !== 0 && withoutPlant.status === 0;   // && rightReason deleted
```

```
grep -c "if (!ok) failures++;" scripts/test-gate-plants.ts        → 1     (S1P2-B1-REASON's token intact)
grep -c "if (usedElsewhere) {" scripts/check-finding-guards.ts     → 1     (S1P3-D3-3-DECLTOKEN's token intact)
npm run lint:finding-guards                                        → EXIT 0
npm run test:gate-plants                                           → EXIT 0
  ✅ lint:finding-guards [D3-3]  plant-applied=YES · planted=exit 1 · control=exit 0 · reason=WRONG
✅ test:gate-plants — all 21 gates fail closed on a planted defect.
```

⛔ **The harness prints `reason=WRONG` next to a ✅ and then states that all 21 gates fail closed.** It
contradicts itself on one line and exits 0. This is the *"a gate reporting green while doing less than it
claims"* class the brief predicts a fourth consecutive instance of — inside the instrument built to
detect that class, reached by a **two-line** edit that no gate in the tree refuses.

**Why the chain has no independent link.** `S1P3-D3-3-DECLTOKEN`'s behavioural guard is the
`lint:finding-guards [D3-3]` scenario. That scenario's verdict depends entirely on `rightReason`.
`rightReason`'s only guard is `S1P2-B1-REASON`, which `D4-1` measured **guard-only**. Three registered
guards in a row and the load-bearing one is a token that survives its own un-fix.

**Remedy, as a hypothesis (not verified):** ① `D4-1`'s re-point (`"&& rightReason"`) is necessary but not
sufficient — it protects one clause with one token. ② Make the verdict structurally inseparable from the
print: derive the tick from a single `verdict()` that returns the reason, and **assert in the harness's
own post-flight that no line printing `reason=WRONG` carries a ✅** — a self-check in the shape
`S1P3-SELFCHECK-CALL` already established at module scope, which is the one idiom here that survives its
own call being deleted. ③ Add a `test:gate-plants` scenario over `test-gate-plants.ts` itself: a plant
whose expected output deliberately does not match, asserting the harness reports it as a failure. Nothing
currently plants against the planter.

---

### D4-7 — `major` · `audit-route.ts` emits `first-look` for S1 and never for S0 — **49 never-swept S0 files are in no lane of this round**

**Origin:** `instrument` (`scripts/audit-route.ts:271-283`).
**User-facing consequence:** not user-facing directly; it is the *"where nobody has looked"* measurement
this whole audit is steered by, and it is wrong by 49 files. S0 is recorded **converged** while more than
half of its inventory has never been read by any pass, and no route will ever send an auditor there —
including `apps/rn/src/data/migrationAudit/run.ts`, whose two test modules **are** on this route as
`instrument`, so pass 4 audits the tests and nobody audits the subject.

**The file's own taxonomy** (docblock): *"`first-look` — on the surface, **never swept by any pass**."*

**The implementation applies it to one surface:**

```ts
for (const f of inv.files) {                       // the REQUESTED surface (s1)
  if (inv.unswept.has(f)) origin.set(f, 'first-look');
  else if (changed.has(f)) origin.set(f, 'fix-churn');
}
for (const f of s0.files) {
  if (changed.has(f)) origin.set(f, 'instrument');  // ⛔ no unswept arm
}
```

S1's unswept files are routed whether or not they changed. S0's unswept files are routed **only if they
changed** — and "changed" is the definition of a *different* origin.

**The measurement (this round's own committed artefacts, no plant needed).**

```
S0-SURFACE-INVENTORY.md   → 109 files on the S0 surface · 47 swept · 62 unswept
ROUTING-ORIGINS.tsv       → 217 routed rows
of the 62 S0-unswept files: 13 routed (because they also changed) · 49 NOT ROUTED
```

Named, first ten of the 49: `apps/rn/app.json` · `apps/rn/eslint.config.mjs` ·
`apps/rn/playwright.embed.config.ts` · `apps/rn/playwright.shots.config.ts` ·
`apps/rn/scripts/copy-canvaskit.mjs` · `apps/rn/src/data/migrationAudit/cutoverFiles.test.ts` ·
`apps/rn/src/data/migrationAudit/interruption.test.ts` · **`apps/rn/src/data/migrationAudit/run.ts`** ·
`apps/rn/src/testing/runScenarioTests.ts` ·
`apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts`.

**Why the totality proof does not see it.** The `owed` assertion — the one the docblock calls *"the
assertion the other four cannot make"* — is `[...changed].filter(f => !NOT_CODE.test(f) && !laneOf.has(f))`.
It is quantified over **`changed`**. A never-swept, never-changed file is not in `changed`, so the proof
that *"a route that undercounts is this project's oldest defect"* cannot express this undercount. ⚡ It is
the same shape as the `off-surface` discovery in the paragraph above it: *a file whose home is a surface
nobody reads.*

⚠️ **This is a measurement of coverage, not a claim that bugs are there.** It is offered because the brief
states the variable is *where the auditor points*, and 49 files of the instrument surface have never been
pointed at while S0 is recorded closed.

**Remedy, as a hypothesis (not verified):** give the S0 loop the same unswept arm —
`if (s0.unswept.has(f)) origin.set(f, 'first-look'); else if (changed.has(f)) origin.set(f, 'instrument');`
— and widen `owed` from `changed` to `changed ∪ everyInventory'sUnswept`, so the totality proof is
quantified over the union the taxonomy names rather than over one of its two terms. ⚠️ Verify the volume
before adopting: this adds ~49 files to a route, so it may need to land as a declared multi-pass backlog
rather than as one round's route — but it should be *counted* either way, and today it is not.

---

### D4-8 — `major` · `lint:trust-claims`' claim-site ledger cannot tell a MENTION from a USE, and prints *"every money surface … asks the guard"* over pass-3 blocker `D3-1` restored

**Origin:** `instrument` (`scripts/check-trust-claims.ts:190`).
**User-facing consequence:** the Home-Screen / Lock-Screen widget can go back to saying *"Debt-free · 100%
· $0"* over balances the app returned `debt-free-unverified` about — pass-3 blocker `D3-1` verbatim — while
`lint:trust-claims` exits 0 and states in its own success line that every money surface asks the guard.

**The line that decides membership of the ledger's population:**

```ts
if (src.includes('trustSelectors') || src.includes('dataRepairsCopy')) continue;
```

A file *mentions* the module → it is removed from the population entirely. Nothing checks that the money
this particular file prints is behind a call.

**The measurement (plant, clone at the pin).** `apps/rn/src/widget/snapshot.ts` — **`D3-1`'s own file** —
holds two `mayClaim` calls: the payload gate at line 68 and the balance gate at line 129. The realistic
regression is losing **one**, so the import stays used and the file still mentions the module:

```ts
// const mayStateBalances = mayClaim(store, 'debt-balances');
   const mayStateBalances = true;      // D3-1's defect, restored
```

```
npm run lint:trust-claims   EXIT=0
  ✅ trust claims: 4 claims all consumed in production (debt-balances→1 · goal-amounts→1 · required-plan→5 · row-figures→5)
     ⭐ 0 claim sites open — every money surface that reads the user's entities asks the guard.
npm run lint:finding-guards EXIT=0
```

⛔ **`⭐ 0 claim sites open — every money surface … asks the guard` is a false sentence while that plant is
in.** ⚡ And the drop is *visible* in the same line — `debt-balances→2` became `debt-balances→1` — with
nothing comparing it to anything. A consumer count is printed and never floored.

**Stronger form, for completeness:** deleting **both** calls and leaving only
`import { mayClaim } from '@/store/trustSelectors';` also leaves the gate at EXIT=0
(`debt-balances→1 · required-plan→4`), which is `tested-helper-is-not-a-used-helper` exactly.

⚠️ **Scoped honestly:** the gate's docblock does declare the file-level limit — *"a file that imports the
module can still ask the wrong question"*. What is **not** declared is the ⭐ line, which asserts the
opposite as a fact; `assert-the-honest-state-by-name` is about the sentence, and this sentence is wrong.
⚠️ `D3-1`'s **behavioural** guard is `S1P3-D3-1-WIDGET` in `apps/rn/src/widget/widgetSync.test.ts` —
**lane C, not tested here.** This finding is about the instrument, not about `D3-1`'s closure.

**Remedy, as a hypothesis (not verified):** ① floor the per-claim consumer counts the green line already
prints (`debt-balances → 2`), in a ledger with the same both-directions exactness check 4 uses — a claim
losing a caller then reds instead of being printed; ② replace `src.includes('trustSelectors')` with a
count of actual `mayClaim|rowFieldUnread|anyRowFieldUnread` **call** matches (the `CALL` regex at line 91
already exists in this file) so a mention is not a use; ③ soften the ⭐ line to what is measured —
*"0 money-printing files never reference the guard"* — since that is the claim the code supports.

---

### D4-9 — `major` · `lint:scan-floors`, the gate written to close the "eighth gate somebody writes next week", does not see a strip-using gate written with double quotes or one directory down

**Origin:** `instrument` (`scripts/check-scan-floors.ts:57-60`).
**User-facing consequence:** a new money gate can ship reporting ✅ while reading **zero** lines — the
GAP-8 state that seven live gates were measured in — because the instrument that is supposed to force it
to carry a floor cannot see it.

**The gate's own purpose**, first paragraph: *"[the seven floors] fix seven files. It does nothing about
**the eighth gate somebody writes next week**, which will import `stripCode` and inherit the identical
hole."* Its detector:

```ts
const consumers = readdirSync(SCRIPTS)                       // NOT recursive
  .filter((f) => f.endsWith('.ts') && f !== 'check-scan-floors.ts')
  .filter((f) => /from '\.\/lib\/stripCode(\.ts)?'/.test(readFileSync(join(SCRIPTS, f), 'utf8')));
```

⛔ **Single quotes only, and `scripts/` only.** Its own docblock records the first version of this line
missing `check-trust-claims.ts` over the `.ts` spelling and calls that *"the undercount class this repo has
now measured seven times, arriving inside the instrument written to close it."* The fix widened the
enumeration by one spelling instead of matching the condition.

**The measurement (plant, clone at the pin).** Two files added, each importing the stripper and using it,
neither carrying `SCAN_GATE`, `scanned()` or `assertScanFloor()`:

| file | import spelling |
|---|---|
| `scripts/check-plant-gate.ts` | `from "./lib/stripCode"` — **double quotes** |
| `scripts/lib/plantNested.ts` | `from './stripCode'` — **one directory down** |

```
before:  ✅ scan floors: 13 strip-using gate(s) — 7 floored, 6 exempt by a measured reason, none stale.
after:   ✅ scan floors: 13 strip-using gate(s) — 7 floored, 6 exempt by a measured reason, none stale.   EXIT=0
```

⛔ **Byte-identical green, and the count did not move** — so the number in the success sentence is blind
to the same thing the check is.

**Why double quotes is not a hypothetical.** This repo mixes styles: `scripts/check-webkit-flex-controls.ts`
imports with `"node:fs"` throughout, and `packages/core/testing/testPayCycleHistoryRegression.ts` — on this
route — uses double quotes for every import. And `scripts/lib/` already holds two of the fixing session's
own new modules (`scanFloor.ts`, `stripMarkdown.ts`), so "a helper one directory down" is where this
cluster has been putting new code.

**Remedy, as a hypothesis (not verified):** stop matching the import *text*. Resolve the consumers the way
the runtime does — walk `scripts/**/*.ts` recursively and test for `stripCommentsOnly|stripCommentsAndStrings`
being **imported** (parse the import statements with the `typescript` module the repo already depends on,
as `check-apostrophes.ts` and `check-money-format.ts` both do), or invert it: have `lib/stripCode.ts` itself
register its caller and have `assertScanFloor` refuse a gate that stripped without registering — the
`scanned()` accumulator already has the hook. ⚠️ Verify the count moves from 13 when the plants are
re-applied; a widened regex that still reports 13 has not been tested.

---

### D4-10 — `major` · `S1P3-G6-SCRIPTSREACH` is GUARD-ONLY: the token pins `include` and reach is `include` **minus `exclude`**

**Origin:** `off-surface` (`scripts/tsconfig.json`), guard registered in `scripts/finding-guards.json`.
**User-facing consequence:** `npm run typecheck` can be returned to green with the `G-6` aliases deleted
and `check-trust-claims.ts` — the gate that stops *"0% APR"* on a card charging 22% — dropped out of the
compiler's program entirely. `validate:release:rn` then opens with a green `typecheck` over a release
whose money gate is uncompiled, which is exactly the state `G-6` was found in.

**What the entry claims:** *"G-6's naive over-fix, found by planting it: `npm run typecheck` can also be
made green by NARROWING `scripts/tsconfig.json`'s include until the app source stops being reachable …
⛔ A typecheck-based plant structurally CANNOT catch this one: the over-fix makes typecheck PASS. **The
token is the config's REACH rather than its aliases.**"* Token: `"include": ["**/*.ts"]`.

⛔ **A tsconfig's reach is `include` minus `exclude`, and the token pins one of the two terms.**

**The measurement — two plants, clone at the pin.**

**A · the fix reverted (`paths` deleted, `"baseUrl": ".."` token kept):**

```
npx tsc --noEmit --incremental false --pretty false -p scripts/tsconfig.json   EXIT=2
  apps/rn/src/data/defaults.ts(1,37): error TS2307: Cannot find module '@core/payCycle/getNextPaycheckDate' …
  … 18 errors — G-6's own figure, reproduced
npm run lint:finding-guards   EXIT=0
```
✅ so `S1P3-G6-SCRIPTSTYPES`' subject **is** guarded — by `typecheck:scripts`, not by its token.

**B · the same revert plus the over-fix, one word in a sibling key:**

```jsonc
"include": ["**/*.ts"],
"exclude": ["node_modules", "check-trust-claims.ts"]
```

```
npx tsc --noEmit -p scripts/tsconfig.json      EXIT=0   (0 errors)
grep -c '"include": ["**/*.ts"]'  scripts/tsconfig.json → 1   (token intact)
grep -c '"baseUrl": ".."'          scripts/tsconfig.json → 1   (token intact)
npm run lint:finding-guards                     EXIT=0
npm run lint:gate-sources                       EXIT=0
```

⛔ **Green everywhere.** The aliases are gone, the C-1 gate is out of the program, and the entry written
specifically to make this over-fix visible sees nothing — because the string it names never changed.

**Remedy, as a hypothesis (not verified):** a token cannot express *"the reach did not shrink."* Register
the property instead: add a `test:gate-plants` scenario, or a two-line assertion in `check-gate-sources.ts`,
that runs `tsc --showConfig -p scripts/tsconfig.json` and asserts the resolved `files[]` still contains
`check-trust-claims.ts` (and every other `scripts/check-*.ts`). That is the same *"read the resolved thing,
not the source text"* move `lint:ci-chain` needs in `D4-5`, and `--showConfig` gives it for free.

---

### D4-11 — `minor` · three of `audit-route.ts`'s five "set identity" assertions are unreachable, and two of the three numbers in its success line are constants

**Origin:** `instrument` (`scripts/audit-route.ts:288-296`).
**Consequence:** not user-facing and nothing is blinded — the reachable checks (`missing`, `owed`, and the
inner `die`) carry the file. But the success line advertises measurements that are not measurements, in
the file whose own docblock records shipping *"a check that could not fail"* one commit earlier.

```ts
for (const [f, o] of [...origin].sort(…)) {
  const lane = LANES.find((l) => l.match(f, o));
  if (!lane) die(`"${f}" reached no lane — the catch-all is broken.`);   // ← always fires first
  if (laneOf.has(f)) die(`"${f}" was routed twice.`);                    // ← Map keys are unique
  laneOf.set(f, lane.id); byLane.get(lane.id)!.push(f);
}
const unrouted   = [...origin.keys()].filter((f) => !laneOf.has(f));     // always []
const duplicated = routedCount !== new Set(laneOf.keys()).size;          // always false
…
if (routedCount !== origin.size) die(…);                                 // always equal
```

Every key of `origin` is either given a lane or killed by the inner `die`, and `origin` is a `Map`, so
`unrouted`, `duplicated` and `routedCount !== origin.size` cannot be anything but empty / false / false.

**The measurement.** Narrow lane D's catch-all from `match: () => true` to
`match: (f) => f.startsWith('scripts/')` — the state `unrouted` exists to report:

```
npx tsx scripts/audit-route.ts --surface=s1 --since=96d1f11 --check   EXIT=1
❌ audit-route: ".gitattributes" reached no lane — the catch-all is broken.
```

The **inner** `die` fires; execution never reaches the `unrouted` block. There is no tree state that
reaches it.

**And the line it feeds** — `217 routed · 0 unrouted · 0 duplicated · 0 missing on disk` — reports two
constants beside one measurement. ⚠️ A reader treating *"0 unrouted · 0 duplicated"* as evidence the route
is total is reading nothing; the totality proof is `owed`, which the line does not mention.

**Remedy, as a hypothesis (not verified):** delete the three dead checks (the inner `die` already covers
the first, and a `Map` covers the second), and print what `owed` proves instead —
`N routed · every changed non-prose file accounted for · M excluded by NOT_CODE`. ⚠️ See `D4-7`: `owed`'s
quantifier is `changed`, so that sentence is true of changed files only and should say so.

---

### D4-12 — `minor` · `REVERIFY4-2`'s registry entry claims `lint:finding-guards` now reds on its un-fix; measured, it does not

**Origin:** `instrument` (`scripts/finding-guards.json` → `REVERIFY4-2`).
**Consequence:** not user-facing, and nothing is blinded — `test:gate-plants [D3-4-blob]` does catch it.
What is wrong is the **ledger's own account of why it is closed**, which is what a future session reads
before deciding whether the behavioural plant is still needed.

**The claim.** `REVERIFY4-2.what`: *"after `.6.5.4`'s registry-wide re-point, `lint:finding-guards` **now
reds too** (the token names the `visit(...)` line the un-fix removes)"*. Token:
`"if (size <= 8 * 1024 * 1024) visit(specs[i], buf.toString("`.

**The measurement.** The un-fix I ran for `D3-4` restores the defect *without touching that line* — the
blob machinery stays, and the callback reads the working tree instead of the bytes it was handed:

```ts
(spec, blobText) => {
  const rel = spec.slice(prefix.length);
  let text = '';
  try { text = readFileSync(join(REPO_ROOT, rel), 'utf8'); } catch { text = ''; }
  void blobText;                      // ← the defect: list from git, content from disk
```

```
npm run lint:secrets          EXIT=0
npm run lint:finding-guards   EXIT=0        ← the entry claims this reds
npm run test:gate-plants      EXIT=1  ❌ lint:secrets [D3-4-blob] … planted=exit 0  (FAILED OPEN)
```

⛔ **The token holds only against the *deletion* spelling of the un-fix**, not against the defect. Reading
rule 4 — the entry judged the example (deleting `eachBlob`) rather than the condition (where the bytes
come from). ⚡ This is one more link in `D4-6`'s chain: the only guard that actually holds here is a
`test:gate-plants` scenario, and `D4-6` shows that harness can be defanged in two lines with everything
green.

**Remedy, as a hypothesis (not verified):** drop the *"lint:finding-guards now reds too"* sentence from
the entry — it is a carried premise, and it will be read as a reason the plant is redundant. The honest
text is *"the token pins the batch read; the behaviour is pinned ONLY by `test:gate-plants [D3-4-blob]`."*

---

### D4-13 — `minor` · `REVERIFY4-3`'s guard PRINTS, it does not RED — re-stated, and still true at this pin

**Origin:** `instrument` (`scripts/strings-inventory.ts:581-588`). ⚠️ Not a new finding: the brief lists
this as a standing S0 caveat *to be re-stated rather than assumed*. Re-measured at `e65f9c7`:

```ts
const stale = [...baseline].filter((b) => !gateFindings.some((f) => f.text === b));
if (stale.length) {
  console.log(`   ⚠️  ${stale.length} baselined phrase(s) no longer duplicate — each is a standing`);
  …                                       // console.log — no process.exit
}
```

`console.log`, no exit. A stale baselined phrase is still a standing permission to re-duplicate, reported
and not refused. ⚠️ The direction is **deliberate and argued** (a gate that reds on progress gets
reverted), so this is a re-statement, not a re-opening. The baseline holds **3** entries against
`MAX_DUP_BASELINED = 3`, and the cap is `>`, so a fall to 2 leaves one silent slot — the same `>`-vs-`!==`
slack recorded in `D4-4`.

---

---

## 2. Closure verdicts

⛔ **Every row below is a plant, not a reading.** Where a verdict says CLOSED, the defect was restored in
the clone at the pin and the named instrument was watched. `EXIT=` figures are the command's own status,
read from `$?` on a redirected run — never a pipeline's.

### 2a · Pass-3 findings in lane D

| id | sev (pass 3) | verdict | the measurement |
|---|---|---|---|
| **A3** | major | **CLOSED** | Un-fixed the tracked half of `lint:secrets --working-tree` (`const modified = run(['diff',…])` → `const modified: string[] = []`), leaving the registered token line untouched. `lint:secrets` **EXIT 0** · `lint:secrets:authoring` **EXIT 0** · `lint:finding-guards` **EXIT 0** · `test:gate-plants` **EXIT 1** — `❌ lint:secrets [A3-modified-tracked] … planted=exit 0` = *the gate FAILED OPEN*. ⚠️ The token is **not** what holds this; the scenario is. |
| **B1** | major | **CLOSED — both halves, separately** | ① *cross-line half:* `wholeFile: true` → `undefined` on the Intl entry (token `if (!wholeFile) continue;` still present, count 1). `lint:money` EXIT 0, `lint:finding-guards` EXIT 0, `test:gate-plants` → `❌ lint:money [B1-multiline-intl] … planted=exit 0`. ② *pattern half:* the pattern reverted to the paren-counted `new Intl.NumberFormat([^)]*)…style:` form. `lint:money` EXIT 0, `lint:finding-guards` EXIT 0, `test:gate-plants` → `❌ lint:money [B1-multiline-intl] … planted=exit 0`. **Either half alone defeats the gate, and the plant catches both.** |
| **D3-3** | major | **CLOSED — but see `D4-6`** | `if (decl) {` → `if (false && decl) {` in `check-finding-guards.ts`, token `if (usedElsewhere) {` intact. `lint:finding-guards` EXIT 0; `test:gate-plants` EXIT 1 — `❌ lint:finding-guards [D3-3] … planted=exit 1 · control=exit 0 · reason=WRONG`. ⛔ The scenario catches it **only** through `rightReason`; compose `D4-1`'s un-fix and it goes green. |
| **D3-4** | major | **CLOSED** | Content read from the working tree instead of the git blob, list still from git. `lint:secrets` EXIT 0 (printing its unchanged green sentence) · `lint:finding-guards` EXIT 0 · `test:gate-plants` → `❌ lint:secrets [D3-4-blob] … planted=exit 0`. ⚠️ See `D4-12`: the registry's claim that `lint:finding-guards` also reds is false for this spelling. |
| **G-6** | found by enumeration | **PARTIAL** | Aliases removed → `npx tsc --noEmit -p scripts/tsconfig.json` **EXIT 2**, 18 × `TS2307` — G-6's own figure, reproduced; so the named instance is guarded by `typecheck:scripts`, which `validate:release:rn` and `web-e2e.yml` both run. ⛔ The **over-fix** the second entry exists to catch is reachable with both tokens intact → `D4-10`. |
| **is `MAX_OPEN = 0` real?** | — | **YES, verified** | Made `apps/rn/src/widget/snapshot.ts` genuinely stop asking the module: the gate red until the file was declared in `EXEMPT`/`OPEN`, so the ledger is live in the arrival direction. `Object.keys(OPEN).length > MAX_OPEN` with `MAX_OPEN = 0` cannot admit a row. ⚠️ But `MAX_EXEMPT` and `MAX_LIVENESS_SITES` can be made vacuous with every guard green → `D4-4`, and the population that feeds `OPEN` cannot tell a mention from a use → `D4-8`. |
| **`m3` — the one deferral** | minor | **I AGREE it is out of scope for 2.0 — measured, not conceded** | `docs/DEBT_ELEVATION_PLAN.md` P6.21 fixes 2.0 availability at **US · CA · AU · NZ** (🎯 2026-08-20) and states *"£/€ storefronts are OUT of 2.0"*. `apps/rn/src/app/paywall.tsx:91` derives the symbol as `priceString.replace(/[\d.,\s ]/g, '') || '$'`, which on those four storefronts yields `$` · `CA$` · `A$` · `NZ$` — **correct in all four** — and all four use a period decimal, so `.toFixed(2)` is right too. Every row `m3` cites (`¥` has no minor units · `€` symbol placement · `kr` separator) needs a storefront 2.0 does not ship to. ⚠️ **One residual, stated rather than implied:** nothing in the tree enforces the availability list — it is an ASC setting and a plan line. Widening availability makes `m3` live with **no code change and no gate**. That belongs on the P6.21 checklist, not in S1. |
| A1 · A2 · A4 · B2 · B3 · B4 · B7 · C-1…C-7b · D3-1 · D3-2 · A5 · B5 · B6 · C m1–m7 · D3-5 · D3-6 · D3-7 · D3-8 · G-1…G-5 | — | **not in lane D** | Their files route to A/B/C. `D3-6` is `apps/rn/src/appIntents/drainPendingActions.ts` (lane C). ⚠️ `A2`'s **guard file** is on this route and is verified below. |

### 2b · The 18 `S1P3-*` guard entries whose guard file is on `ROUTING-D.txt`

*(35 of the 53 sit in lanes A/B/C and are not mine. The split is a lookup: `entry.file ∈ ROUTING-D.txt`.)*

| entry | verdict | the measurement |
|---|---|---|
| `S1P3-A2-INWINDOW` | **CLOSED** | Un-fixed `buildCycleSnapshot` (`effectiveMinimumInWindow(…)` → `debt.minimumPayment`). `npm run test:regression` **EXIT 1**: `Error: FAIL [History reports the money the rollover actually deducted (S1P3-A2)]: expected 200, got 100`. ⭐ Reading rule 6 checked — the control `assertEqual(actuallyPaidDown, 200, …)` sits **before** it and passed, so the named assertion is the one carrying the finding. |
| `S1P3-C1-GATE` | **PARTIAL** | Reds correctly when a claim loses its production consumer (`[claim] 'goal-amounts' … asked by NO production file`). Blind to a `packages/**` test standing in as that consumer → `D4-3`. |
| `S1P3-D3-CAPS` | ⛔ **GUARD-ONLY** | `MAX_EXEMPT`/`MAX_OPEN` reverted to `Object.keys(X).length`; the ledger holds 2 against a cap of 1; `lint:trust-claims` **EXIT 0**, `lint:finding-guards` **EXIT 0**, token present ×3 → `D4-4`. |
| `S1P3-G-LIVENESSLEDGER` | ⛔ **GUARD-ONLY** | `MAX_LIVENESS_SITES` reverted to a derived sum; 14 sites against a cap of 13; both gates **EXIT 0**, token present ×1; the green line prints `cap 14` → `D4-4`. |
| `S1P3-G6-SCRIPTSTYPES` | **CLOSED** | `paths` deleted, `"baseUrl": ".."` kept → `tsc -p scripts/tsconfig.json` **EXIT 2**, 18 errors. Held by `typecheck:scripts`, not by the token. |
| `S1P3-G6-SCRIPTSREACH` | ⛔ **GUARD-ONLY** | `paths` deleted **plus** `"exclude": ["node_modules", "check-trust-claims.ts"]` → `tsc` **EXIT 0 / 0 errors**, both tokens present, `lint:finding-guards` and `lint:gate-sources` **EXIT 0** → `D4-10`. |
| `S1P3-B1-INTLPATTERN` | **CLOSED** | Pattern reverted → `❌ lint:money [B1-multiline-intl] … planted=exit 0` (FAILED OPEN). |
| `S1P3-B1-CROSSLINE` | **CLOSED** *(token not load-bearing)* | `wholeFile` neutered with the token line untouched → `lint:finding-guards` EXIT 0, and the plant scenario caught it. The entry's claim *"proven independently load-bearing"* is true of the **behaviour**; the **token** survives. |
| `S1P3-A3-TRACKEDHALF` | **CLOSED** *(token not load-bearing)* | As row `A3` above. |
| `S1P3-A3-EDITPLANT` | **CLOSED** | The `A3-modified-tracked` scenario is what caught the `A3` un-fix; removing it removes the token, and `MIN_SCENARIOS = 21` reds independently. |
| `S1P3-A3-RESTOREASSERT` | **CLOSED** | Neutered `restoreEdits()` to a no-op → `❌ test:gate-plants — scripts/__fixtures__/authoring-plant-target.md was NOT restored after its edit-plant: M …`, run exited 1. |
| `S1P3-D3-3-DECLTOKEN` | **CLOSED — but see `D4-6`** | As row `D3-3`. |
| `S1P3-D3-3-PLANT` | **CLOSED — but see `D4-6`** | The scenario fired on the decl-check neuter (`reason=WRONG`) and is silenced by `D4-1`'s un-fix. |
| `S1P3-D3-4-BLOBPLANT` | **CLOSED** | As row `D3-4` — the only instrument that saw the revert. |
| `S1P3-D3-4-STAGEMECH` | **CLOSED** | The `stageIndex` mechanism is what lets that plant discriminate a blob read from a file read; it runs every pass (`git(['add','--',f.at])` under `GIT_INDEX_FILE`) and the discrimination was demonstrated by the row above. ⭐ Verified non-destructive: `git status --porcelain` was clean after every harness run. |
| `S1P3-EDIT-PREFLIGHT` | **CLOSED** | Both refusals fire, before any scenario runs. Target dirtied → `❌ … is already modified; the restore would be ambiguous.` (EXIT 1). Target removed → `❌ … is missing; an edit-plant has nothing to edit.` (EXIT 1). |
| `S1P3-SELFCHECK-CALL` | **CLOSED** | Deleted `selfCheck();` from `run()` → importing the module throws `FAIL [audit: run() no longer calls selfCheck() — the migration audit runs with no proof it can detect anything]` (EXIT 1). Re-run with the **naive over-fix** (`// selfCheck();`) → identical throw. Both spellings caught, at module scope. |
| `S1P3-CI-CHAIN` | **PARTIAL** | Step deleted → EXIT 1 with the right message; `run:` line commented → EXIT 1. `if: false` → **EXIT 0**; `continue-on-error: true` → **EXIT 0** → `D4-5`. |

⚠️ **The pattern across 2b, stated once because it recurs:** in **five** of these entries
(`B1-CROSSLINE`, `A3-TRACKEDHALF`, `D3-4` via `REVERIFY4-2`, `D3-CAPS`, `G-LIVENESSLEDGER`) the registered
**token** survives its own un-fix. Three of the five are rescued by a `test:gate-plants` scenario; two are
rescued by nothing. ⛔ **`lint:finding-guards` exited 0 over every single un-fix in this report.** It is a
deletion detector, and it is being read as a closure proof.

---

## 3. Findings tally by origin

Origins are the lookup in `ROUTING-ORIGINS.tsv`, not my judgement. ⚠️ **Lane D contains no `first-look`
and no `fix-churn` files at all** — its 40 files are 33 `instrument` + 7 `off-surface` — so two of the
four buckets are structurally empty on this route and their zeros are not a result.

| origin | blocker | major | minor | total |
|---|---|---|---|---|
| **first-look** | 0 | 0 | 0 | **0** *(no first-look file on this route)* |
| **fix-churn** | 0 | 0 | 0 | **0** *(no fix-churn file on this route)* |
| **instrument** | 1 | 7 | 4 | **12** |
| **off-surface** | 0 | 1 | 0 | **1** |
| **total** | **1** | **8** | **4** | **13** |

- **blocker (1):** `D4-6` — instrument.
- **major (8):** `D4-1` · `D4-3` · `D4-4` · `D4-5` · `D4-7` · `D4-8` · `D4-9` (instrument, 7) ·
  `D4-10` (off-surface, 1 — `scripts/tsconfig.json`).
- **minor (4):** `D4-2` · `D4-11` · `D4-12` · `D4-13` — all instrument.

⚠️ `D4-1` and `D4-2` are the two findings that survived the dead run; they are re-stated unchanged and
counted once. `D4-6` is `D4-1`'s consequence measured, not a re-count of it.

⚡ **Twelve of the thirteen are in the instruments**, which is what the brief predicted and what the origin
split exists to make visible: the app's own defect count is not moving here, and the checking code's is.

---

## 4. Swept and found clean — BY PATH

⛔ **A sweep is recorded against BYTES.** Where a file was read only through its `96d1f11..e65f9c7` diff,
that is said. For an `instrument` file the diff **is** everything written since the pin — but it is not
the whole file, and §6 names what was left.

### 4a · Read in full, and clean — no blocker or major

| path | lines | what I looked for and did not find |
|---|---|---|
| `scripts/lib/scanFloor.ts` | 90 | A floor that cannot fire. `accumulated` is per-gate and additive; a gate that never calls `scanned()` observes 0 and reds; `assertScanFloor` reds on a **missing** ledger entry as well as on a low count. The 5% margin is argued and measured in the ledger header. Clean. |
| `scripts/lib/stripMarkdown.ts` | 47 | All four spellings present. `CLOSURE_REMEDIATION_LINE` is **exported**, so the guard consumes the string the gate prints — the two-producers trap avoided deliberately. Clean. |
| `scripts/test-strip-code.ts` | 122 | Vacuity. All three non-vacuity controls present (A&S changes the fixture · ONLY changes it · the two differ), plus per-line length preservation. The two known misparses are pinned as behaviour, not endorsed. Clean. |
| `scripts/test-closure-stripper.ts` | 139 | Vacuity. Asserts **every** token is present in the raw fixture *before* stripping, then 4 survive / 6 blanked, then `after.size === 4` exactly. The HTML scope guard strips first — a mention is not a use. Clean; one nit in §5. |
| `scripts/test-line-endings.ts` | 99 | The vacuous-normalisation trap its own docblock records. Non-vacuity controls present (`crlfCount >= 5`, no bare LF, `crlf !== lf`) plus a discriminating control (`naive !== safe`). Fixture measured at **288 bytes, 8 CRLF, 0 bare LF**. Clean. |
| `scripts/check-control-chars.ts` | 103 | Scope. Population is `git ls-files --cached --others --exclude-standard`, so it covers the untracked file a control run proved it used to miss. `isControl` is a code-point test, not a literal class. Clean; one nit in §5. |
| `scripts/check-gate-sources.ts` | 128 | Both directions present — orphan, stale exemption, and redundant exemption. Every `EXCUSED` prefix carries a reason. Clean. |
| `scripts/run-gates.ts` | 133 | The `&&` short-circuit is gone; `res.status === 0` (not `!== 0`) so a signal death is a failure, and the reasoning is written out. Every gate runs; the summary names each failure. Clean. |
| `scripts/gate-scan-floors.json` | 7 entries | Every floor carries `measured`, `measuredCount` and a `why`; all are 95% of a measured figure. Clean. |
| `.gitattributes` | 1 | `scripts/__fixtures__/crlf-source.ts.txt -text -diff` — path-anchored, and verified working: the fixture's 8 CRLF survived checkout in a fresh clone. Clean. |
| `.gitignore` | 59 | `scripts/__gate_plant_*` added, and it matches what the harness actually writes — observed mid-run: `scripts/__gate_plant_staged__.ts`. ⚠️ The harness also writes `docs/audits/__gate_plant_unused__.md`, which that line does **not** cover; it is removed by the `finally`, and no run in this audit stranded it. Clean, narrowly. |
| `package.json` (repo root) | 130 | Every `lint:*`/`test:*` script cross-checked against `run-gates.ts`'s `GATES` list programmatically. 36 gates wired, 0 orphans. The 12 scripts not in the list are the four suites, the two wrappers, `gate-freshness` (deliberate, documented), `secrets:authoring` (deliberate, documented) and `lint:webkit` (§5). Clean. |
| `scripts/__fixtures__/crlf-source.ts.txt` | 288 B | Read as bytes. Carries a line comment, a `//` inside a string, a block comment and a regex whose slash is not a comment — it exercises the branches `test-line-endings` asserts on. Clean. |

### 4b · Read in full, and NOT clean

Listed so the sweep record is complete; each carries a finding above.
`scripts/check-trust-claims.ts` (313 · `D4-3` `D4-4` `D4-8`) · `scripts/check-finding-guards.ts`
(294 · `D4-1` `D4-6`) · `scripts/audit-route.ts` (364 · `D4-7` `D4-11`) · `scripts/check-ci-chain.ts`
(103 · `D4-5`) · `scripts/check-scan-floors.ts` (112 · `D4-9`) · `scripts/tsconfig.json` (51 · `D4-10`).

### 4c · Read through the fix-range diff only, and clean in what changed

| path | diff | verdict on the change |
|---|---|---|
| `scripts/check-glossary.ts` | +11 | Scan-floor wiring, correct shape — `scanned` inside the strip helper, `assertScanFloor` immediately before the success line. |
| `scripts/check-local-dates.ts` | +32 | Scan-floor wiring **plus** a fall-check making `HAND_PARSE_BASELINE` exact in both directions. The direction argument is stated. |
| `scripts/check-month-arithmetic.ts` | +12 | Scan-floor wiring, aliased `scanned as scanLines` because a local `scanned` already held a FILE count — the collision was noticed, not tripped over. |
| `scripts/check-press-opacity.ts` | +12 | Same wiring, same alias, same reason. |
| `scripts/check-native-a11y-props.ts` | +58 | Same wiring; the remainder is EXEMPT rows. |
| `scripts/check-apostrophes.ts` | +48 | `MAX_BASELINED = 0` enforced on **both** the `--baseline` write path and the recorded-file read path. That is GAP-17's real half, and *"fail on the fall"* was correctly refused with the reason. |
| `scripts/check-audit-closure.ts` | +29 | `stripMarkdownCode` extracted so it can be tested; the remediation line now comes from the exported constant rather than a copy. |
| `scripts/check-copy-owners.ts` | +15 | One `C-7b` pairing added, with the reason a structural check is the only thing that can reach that screen. |
| `scripts/strings-inventory.ts` | +53 | `MAX_DUP_BASELINED` on both paths; control-character escaping written as a **code-point** test rather than a literal class — the precise mistake that reintroduced the defect last time. |
| `scripts/check-committed-secrets.ts` | +9 | Docblock only (the `D3-4` explanation). The tracked-half code it describes predates this range. |
| `scripts/surface-coverage.ts` | +2 | `'s1p3'` added to `SWEPT_CLAIMS`. |
| `apps/rn/src/testing/runAppTests.ts` | +8 | Two suites registered (`guardianTrust.test`, `createAdapter.test`) — real registrations, not comments. |
| `apps/rn/src/data/migrationAudit/audit.test.ts` | +187 | The poison ledger is keyed off `INVARIANTS` in **both** directions, with a clean control per poison, each checked against **its own** invariant rather than through `checkAll`. Floor `INVARIANTS.length < 9`. Its module-scope self-call check is plant-verified CLOSED in §2b. Clean. |
| `apps/rn/src/data/migrationAudit/hostile.test.ts` | +66 | `HOSTILE_FLOOR` replaced by a **derived** floor plus a named ledger, exact in both directions; `GAP-7`'s proposed equality assertion correctly refused with the reason, and the `notReaching` keying was itself plant-corrected. Clean. |
| `packages/core/testing/testPayCycleHistoryRegression.ts` | +72 | Pinned to `applyRolloverPayment`'s actual result rather than a literal, with a passing control before the load-bearing assertion and a non-BNPL control after. Plant-verified in §2b. Clean. |
| `scripts/surface-coverage.s0.json` | +36 | The new `scripts/*.ts` rows, all `"never"` — honest. ⚠️ And see `D4-7` for what `"never"` buys them. |
| `scripts/finding-guards.json` | +397 | All 53 `S1P3-*` entries enumerated programmatically, not by eye; the 18 in lane read in full. |

---

## 5. Measured, and NOT a defect

1. **`lint:webkit` is RED at this pin and in no live chain.** Measured: `npm run lint:webkit` → **EXIT 1**,
   `app/page.tsx:1653  <button> uses flex/grid class ".premium-pill"`. Reachable only from root
   `npm run lint`, which appears only in the retired `validate:release:legacy`; `lint:rn` does not carry
   it and `web-e2e.yml` runs `lint:rn`. ⛔ **Not re-opened:** rated major and then **retracted** in
   `docs/audits/2026-08-25-…/SUMMARY.md:173`, recorded at `S0-REVERIFY-4.md:490`, and standing on
   `DEBT_ELEVATION_BACKLOG.md:212` against **P6.11**, which deletes its whole subject. Re-stated with the
   measurement so pass 5 does not rediscover it.
2. **`typecheck:scripts` does not OOM.** `NODE_OPTIONS=--max-old-space-size=1536 npx tsc --noEmit
   --incremental false --pretty false -p scripts/tsconfig.json` → **EXIT 0, 0 errors**, twice, in this
   clone. Auditor C's `Fatal process out of memory: Zone` was **host** pressure from three concurrent
   auditors on a 6 GB box, not a property of this project. Recorded because the resume protocol asks.
3. **The two `*-SURFACE-INVENTORY.md` files show `M` after any coverage-gate run, and it is an EOL
   artefact, not a change.** `surface-coverage.ts:679` regenerates them unconditionally with `\n` while
   `core.autocrlf` checked them out CRLF. Measured: `git diff --numstat` is **empty** for both. The
   regeneration is deliberate (*"so the doc can never disagree with the data"*). ⚠️ It does mean a Windows
   `lint:rn` leaves a dirty tree, which `lint:secrets --working-tree` then scans — noise, not a hole.
4. **`test:gate-plants` is non-destructive to a real index.** `stageIndex` copies `.git/index` into
   `os.tmpdir()` and sets `GIT_INDEX_FILE`. Measured across **six** full harness runs in the clone:
   `git status --porcelain` over `apps packages scripts` was empty after every one. The single exception
   was the run where I deliberately neutered `restoreEdits`, which the harness's own post-flight reported
   and which I then reverted — that is the guard working, not a leak.
5. **`check-finding-guards.ts` and `check-committed-secrets.ts` use `!==` on their caps** — both
   directions, with the two-sided message. They are **not** in the `>`-slack class `D4-4` names; that
   class is `check-trust-claims.ts` (×3) and `strings-inventory.ts` (×1, `MAX_DUP_BASELINED = 3` against a
   baseline of exactly 3).
6. **`hostile.test.ts`'s floor is derived, not typed** — `CASES.length - Object.keys(EXPECTED_REFUSED).length`
   — so `GAP-7`'s proposed `HOSTILE_FLOOR === CASES.length`, which the brief flags as a remedy that would
   have introduced a defect, was refused with a written reason, and the ledger is exact in both directions.
7. **`audit-route.ts` reproduces this round's own manifests.** `npx tsx scripts/audit-route.ts
   --surface=s1 --since=96d1f11 --check` → `217 routed · 0 unrouted · 0 duplicated · 0 missing on disk` ·
   `125 first-look · 48 fix-churn · 33 instrument · 11 off-surface` · `D: 40 files (7 off-surface · 33
   instrument)`, identical to the committed `ROUTING-D.txt` and `ROUTING-ORIGINS.tsv`. The route is
   reproducible from the committed generator. *(What it does not cover is `D4-7`; what two of those three
   zeros mean is `D4-11`.)*
8. **`test-closure-stripper.ts`'s `SOURCES` is a second copy of `check-audit-closure.ts`'s `SOURCES`** —
   both list the same three files today, verified line by line. Two producers of one fact, this repo's
   most-repeated shape — but the drift direction is safe: if the gate gains a source the stripper test
   does not, the test's HTML scope guard simply stops covering it, which loses coverage rather than
   minting a closure. Recorded so pass 5 need not re-derive it; not rated a defect.
9. **`check-control-chars.ts`'s success line says *"tracked text files"* while it scans tracked **and**
   untracked.** The sentence understates what was done; the scan is wider than advertised, not narrower.
   No instrument blinded.
10. **`lint:secrets:authoring` is deliberately outside `lint:rn`**, with the reason written into the file
    (*"making untracked files gate the tree"* is a gate nobody can satisfy). Not an omission.
11. **`m3`'s deferral is sound for 2.0's declared availability** — the measurement is in §2a, and the one
    residual (nothing in the tree enforces the availability list) is named there.
12. **Two producers of "what is a control character"** — `check-control-chars.ts` allows TAB/LF/CR while
    `strings-inventory.ts:688` escapes CR as well. Checked: the divergence is in the safe direction (the
    escaper is stricter than the gate), and a CR inside a markdown table cell would be wrong anyway.

---

## 6. Not reached — BY PATH

⛔ Silence reads as swept, so every stretch I did not cover is named.

| path | what was NOT read | why it matters |
|---|---|---|
| `scripts/surface-coverage.s1.json` | **the whole file** — 443 changed lines of claim rows | The `fix-churn` bucket's premise lives here. I did not verify that any file claiming `s1p3` was actually read by pass 3, and the brief states the coverage instrument is structurally blind to bytes changing under a recorded claim. **This is the largest unread stretch on the route.** |
| `scripts/check-webkit-flex-controls.ts` | its **+35-line diff**; only the 60-line header was read | The gate is RED at the pin and in no live chain (§5). Its diff is unaudited by anyone this round. |
| `scripts/strings-inventory.ts` | ~657 of 710 lines — only the +53 diff | The bucketing, the duplicate detector and the unclassified self-check were not read. |
| `scripts/surface-coverage.ts` | ~550 of 697 lines — I read the surface/claims resolution (460-530) and the inventory writer (640-697) | `SURFACES`, `excluded`, the routing validation and `runCompleteness()` were not read. Both coverage gates and `lint:surface-complete` were RUN and are green — that is an exit code, not a sweep. |
| `scripts/test-gate-plants.ts` | ~lines 1-130 and 250-440 — the scenario **bodies**. The harness (440-612) was read in full and all 21 `gate:` labels enumerated | I did not check, per scenario, that each plant body is the defect its `why` describes. `D4-6` shows the verdict logic is one weak point; the bodies are the other half and are unread. |
| `scripts/check-money-format.ts` | lines 1-70 — roots, `EXEMPT`, `isTestHarness` | The scan half (70-206) was read in full and both B1 halves were plant-verified. |
| `scripts/check-committed-secrets.ts` | lines 1-128 and 175-210 — `PATTERNS`, `SELF`, the exemption loader | The revision scan and the authoring mode were read in full and plant-verified. |
| `scripts/check-apostrophes.ts` · `check-audit-closure.ts` · `check-glossary.ts` · `check-local-dates.ts` · `check-month-arithmetic.ts` · `check-native-a11y-props.ts` · `check-press-opacity.ts` · `check-copy-owners.ts` | everything outside the fix-range diff — **~1,650 lines** | `instrument`-origin files whose change since the pin is small and identically wired; their bodies carry prior passes' verdicts against bytes that, for these files, largely did not move. |
| `scripts/finding-guards.json` | the `what` text of the **35** entries outside lane D | Enumerated and lane-assigned programmatically; not read. |
| `scripts/surface-coverage.s0.json` | everything outside its +36 diff | |
| **the 35 `S1P3-*` entries in lanes A/B/C** | **not tested at all** | Lanes A, B and C own them. ⚠️ **5 of my 18 had a token that survived its own un-fix.** The base rate on the other 35 is unlikely to be zero, and nothing in this report says anything about them. |
| **the 49 never-swept S0 files** of `D4-7` | not read | They are in no lane. Naming them is the finding. |
| `apps/rn/src/data/migrationAudit/{run,invariants,corpus,doors}.ts` | not read | Not on the route. `run.ts` is S0-unswept **and** unrouted — `D4-7`. |
| `.github/workflows/*` beyond `web-e2e.yml`'s step list | not read | `embed-pages.yml`'s `[D44]` guard is cited by `D4-5` from `check-ci-chain.ts`'s docblock, not read at source. |
| `scripts/lib/stripCode.ts` | not read | Not on the route (unchanged since the pin), though eleven gates and three of my findings route through it. |

---

## Closing verification

Run at the end of this report, after the last plant was reverted.

```
$ git -C /c/Users/Jason/audit-d-clone status --porcelain
                                                       (empty)
$ git -C /c/Users/Jason/audit-d-clone diff e65f9c7 --stat
                                                       (empty)
$ ls scripts/__gate_plant_* docs/audits/__gate_plant_* apps/rn/core
                                                       none
$ git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 -- apps packages scripts | wc -c
0
$ git -C /c/Users/Jason/debt-app-v1 status --porcelain
 M docs/audits/2026-08-28-s1-money-pass4/D-instruments.md      ← this file, the deliverable
$ netstat -ano | grep :4319
                                                       4319 free
```

⚠️ `git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 --stat` outside this audit directory shows
`CLAUDE.md`, `docs/DEBT_ELEVATION_LOG.md` and `docs/DEBT_ELEVATION_PLAN.md` — those are the two commits the
orchestrating session made after the pin (`HEAD` is now `fabbb9f`), not edits of mine. **The source trees
are 0 bytes off `e65f9c7`.**

⚠️ One environment note for whoever runs this next: `C:/Users/Jason/audit-d-clone/node_modules` resolves
to the live repo's copy (`tsx` loaded from `C:/Users/Jason/debt-app-v1/node_modules/tsx` in every stack
trace above). That is read-only in this report and nothing was installed — but it means the clone is not
dependency-isolated, and an `npm install` there would write into the live tree.
