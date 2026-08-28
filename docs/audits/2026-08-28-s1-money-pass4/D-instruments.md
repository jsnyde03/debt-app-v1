# S1 pass 4 — auditor D — THE INSTRUMENTS

**Pin:** `e65f9c7` · **route:** `ROUTING-D.txt`, 40 files / 10,629 lines — all of `scripts/`
plus the repo-root config no surface owns.

**Isolation.** Every plant in this report was run in an isolated detached worktree at the pin,
`C:\Users\Jason\audit-d-wt` (`git worktree add --detach … e65f9c7`), with `node_modules` and
`apps/rn/node_modules` junctioned from the main checkout. **No source file in
`C:\Users\Jason\debt-app-v1` was edited, committed or pushed.** The closing
`git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 -- apps packages scripts` check is recorded at
the end of this file.

> Status: IN PROGRESS — written incrementally.

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

---

## 2. Closure verdicts

_(appended as confirmed)_

---

## 3. Findings tally by origin

_(at the end)_

---

## 4. Swept and found clean — BY PATH

_(at the end)_

---

## 5. Measured, and NOT a defect

_(at the end)_

---

## 6. Not reached — BY PATH

_(at the end)_
