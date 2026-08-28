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
