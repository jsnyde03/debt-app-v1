# D3 — legacy Next root (`app/`, `components/`, `lib/`, `tests/`) — pass 6 findings

## ⚠️ SCOPE OF THIS LANE — read before treating brevity as a clean bill of health

`D3` ran under the **reduced mandate** written into `BRIEF.md` §"`D3` only". The 26 files on
`ROUTING-D3.txt` are the legacy Next/Capacitor surface at the repo root. `P6.11` deletes them, the
shipping app is `apps/rn`, and **none of the 26 are among the coverage exit's 446 money-bearing
files.** So this lane did **not** perform a line-for-line adversarial read.

**What this lane DID do:**

1. A **repo-wide `S1.12.11` shape check** — merge-conflict markers across every tracked file under
   `app/ components/ lib/ tests/` (118 tracked files, not just my 26), and repo-wide excluding
   `docs/`.
2. A **liveness sweep** — root `package.json` scripts, `next.config.ts`, `capacitor.config.ts`,
   `playwright.config.ts`, all five `.github/workflows/*.yml`, `codemagic.yaml`, root/`packages/core`
   `tsconfig.json`, and an import-direction search for anything outside the legacy root that reaches
   into it (`@/components`, `@/lib`, `@/app`, relative climbs).
3. A **migration read** — full reads of the money-bearing files on the manifest whose logic,
   formatters, rounding or copy could have been inherited by `apps/rn`, with the RN sibling opened
   side-by-side wherever a claim looked shared.

**What this lane DELIBERATELY DID NOT DO, and where the risk therefore sits:**

- No line-for-line correctness read of the presentational-only `components/*Section.tsx` shells that
  carried no arithmetic, no formatter and no money copy — these were skimmed for money tokens
  (`toFixed`, `Math.round`, `/ 100`, `$`, `interest`, `apr`, `payoff`, `%`) and opened only when a
  token hit. **Files skimmed-not-read are absent from `READ-D3.txt` by design.**
- No execution of the root `test:e2e` Playwright suite (forbidden by the brief), so
  `tests/e2e/planner-empty-state.spec.ts` was read but **never run**. Whether it currently passes is
  unmeasured by this lane.
- No `next build`, no root `eslint`, no whole-monorepo typecheck (forbidden by the brief). **The
  claim "the legacy root still compiles" is NOT established by this lane** — and see `D3-1`, which
  is about exactly that gap.
- No read of legacy files outside the 26-file manifest except where a liveness edge pointed at one.

**Consequence for triage:** a low finding count here means *this surface was not swept*, not *this
surface is clean*. Everything below is either a migration risk or a liveness/deletion-blast-radius
fact.

### ⚠️ `READ-D3.txt` holds **15** paths, and only **7** of them are from my 26-file manifest

That is deliberate and the shortfall is the point of the reduced mandate — but the list is also
**strict**, which matters because `[D69]` is a lookup against exactly these claims. A file is on it
only if I read the **whole** file. Files I read *substantial windows of* while chasing a specific
claim, and which are therefore **NOT** on the list even though findings below cite them by line, are:
`apps/rn/src/components/payday/PaydayCaptureSheet.tsx`, `apps/rn/src/store/planSelectors.ts`,
`packages/core/engine/allocatePaycheck.ts`, `apps/rn/src/components/payoff/trajectoryDomain.ts`,
`apps/rn/src/components/entities/ImportDebtsSheet.tsx`, `components/ResultsSection.tsx`,
`packages/core/history/selectVisibleHistory.ts`, `scripts/check-month-arithmetic.ts`, root
`tsconfig.json`. **Treat every one of those as unswept.** Six manifest files were only
token-skimmed, and `app/page.tsx` (1,516 lines) and `components/SnowballSection.tsx` (1,361 lines) —
the two largest and most money-dense files I hold — **were never read at all.**

---

## D3-1 — **YES, this surface is still live: the shipping release gate compiles AND executes legacy-root `lib/`, and `P6.11`'s written scope does not name it**

**Severity:** `major` · **Origin:** `off-surface` (the legacy `lib/` files) reaching `instrument`
(`packages/core/testing/*`). **This is the single most valuable thing this lane returns.**

**User-facing consequence.** None today. The consequence is to `P6.11`: the plan's "Remaining" list at
`docs/DEBT_ELEVATION_PLAN.md:283` enumerates what deleting the root retires — *"retires
`validate:release:legacy`, the root Next lint, the legacy demo-mode test references,
`tests/visual/*.cjs`, one of the two screenshot mechanisms"* — and **does not mention that
`packages/core`, the shared engine the shipping RN app links, imports seven files out of the legacy
root.** Deleting the tree without that edit does not merely retire a dead lane; it makes
`npm run typecheck` and `npm run test:regression` fail, and those are steps at
`.github/workflows/web-e2e.yml:89` and `:100` — the workflow that runs on **every push and pull
request** — as well as two steps of `validate:release:rn`. `P6.12` exists as the catch-all guard, but
it catches this *after* the deletion commit rather than sizing it beforehand, which is the opposite of
🎯's stated reason for scheduling `P6.11` last (*"I do not want to take any chances at all of us
deleting something from legacy that is still needed but missed"*).

**File and line — the eight edges, all measured, not inferred:**

| consumer (shared / shipping side) | line | legacy-root file it pulls |
|---|---|---|
| `packages/core/tsconfig.json` | 31 | `"@/*": ["../../*"]` — the alias that makes all of this resolve |
| `packages/core/history/selectVisibleHistory.ts` | 2 | `lib/subscription/plans.ts` |
| `packages/core/history/selectVisibleHistory.ts` | 3 | `lib/subscription/hasFeatureAccess.ts` |
| `packages/core/testing/testSubscriptionGating.ts` | 1 | `lib/subscription/hasFeatureAccess.ts` |
| `packages/core/testing/testSubscriptionGating.ts` | 2 | `lib/subscription/features.ts` |
| `packages/core/testing/testSafeStorage.ts` | 8 | `lib/storage/safeStorage.ts` |
| `packages/core/testing/testSafeStorage.ts` | 9 | `lib/storage/migrateState.ts` |
| `packages/core/testing/runRegressionTests.ts` | 39 | `lib/storage/testMigrateOriginalBalance.ts` |

Transitive closure inside the legacy root, followed by hand:
`lib/storage/testMigrateOriginalBalance.ts:1` → `lib/storage/migrateState.ts:1` →
`lib/storage/safeStorage.ts:1` → **`lib/analytics/track.ts`**. Reachable set = **7 files**:
`lib/subscription/{plans,features,hasFeatureAccess}.ts`,
`lib/storage/{testMigrateOriginalBalance,migrateState,safeStorage}.ts`, `lib/analytics/track.ts`.

**Measurement — both gate steps run, each command's own exit code read directly, no pipe:**

```
node --max-old-space-size=1536 ./node_modules/typescript/bin/tsc --noEmit -p packages/core/tsconfig.json
  -> typecheck_core_exit=0

node --max-old-space-size=1536 ./node_modules/tsx/dist/cli.mjs packages/core/testing/runRegressionTests
  -> regression_exit=0
```

The regression run's own stdout proves the legacy files **execute**, not merely typecheck:

```
line 319:  OK  originalBalance backfill regression tests passed.   <- lib/storage/testMigrateOriginalBalance.ts
line 685:      Running subscription gating regression tests...     <- lib/subscription/hasFeatureAccess.ts
line 709:  OK  All subscription gating regression tests passed.    (23 assertions, counted in the output)
```

`package.json`'s `"typecheck"` = `typecheck:core && typecheck:rn && typecheck:scripts &&
typecheck:tests`, so `web-e2e.yml:89`'s `npm run typecheck` includes the `packages/core` project
above. `package.json`'s `"validate:release:rn"` contains both `npm run typecheck` and
`npm run test:regression`.

**Mechanism, as a hypothesis.** The coupling is *known* but its owner is the wrong document. It is
written down twice — `packages/core/tsconfig.json:26-31` (*"three files import `@/lib/*` from the
Capacitor tree at the repo root … Both this alias and those dependencies go at 5.5.1"*) and root
`tsconfig.json`'s comment (*"nothing under `app/`, `components/` or `lib/` imports it (verified
5.1b)"* — which asserts the **opposite direction** and therefore does not cover this at all). I
hypothesise the plan row never absorbed it because `5.5.1` was renumbered to `P6.11` and the note
stayed attached to the old id — exactly the failure mode `.github/workflows/legacy-container-capture.yml:44`
documents in its own words: *"That tree then moved a whole phase to P6.11, and the deferral silently
moved with it."* ⚠️ Separately, `packages/core/tsconfig.json:14` states the count as **"three
files"**; I counted **four** (`selectVisibleHistory.ts` sits outside `testing/` and appears to have
been tallied with the engine). A comment is a carried premise, and this one is stale by one.

**Remedy — NOT VERIFIED, and deliberately not attempted.** Two shapes exist and they are not
equivalent: (a) *move* the four reached modules into `packages/core` before `P6.11` and drop the
`@/*` alias, preserving the assertions; or (b) *delete* them with the tree, correct only if those
assertions are agreed dead (see `D3-2`). Choosing (b) silently, by deleting the tree, is the outcome
this finding exists to prevent. **What is verified is only the premise: the eight edges above exist
and both gate steps traverse them today.**

---

## D3-2 — the live `test:regression` gate spends 23 assertions certifying a **three-tier** subscription product the shipping app no longer has

**Severity:** `minor` · **Origin:** `off-surface` / `neighbour` — a two-producer disagreement visible
from the side that did not move.

**User-facing consequence.** None directly. The consequence is to a reader of the gate: on every push
`web-e2e.yml:100` prints `All subscription gating regression tests passed.` — a line that, inside the
gate for the RN app, reads as *premium gating is regression-tested*. What it actually certifies is
`lib/subscription/hasFeatureAccess.ts`, whose `premium_plus` tier **does not exist in the shipping
app**.

**File and line — the two producers, read side by side:**

- `lib/subscription/plans.ts:1-4` — `export type SubscriptionPlan = "free" | "premium" | "premium_plus";`
- `apps/rn/src/data/models.ts:47` — `export type SubscriptionPlan = 'free' | 'premium';`, with
  `models.ts:45` stating it outright: *"The old `premium_plus` tier is gone; gating is a uniform inline
  `subscriptionPlan === 'premium'`."*

**Measurement.** From the regression stdout, lines 686–708: 7 `free plan denied`, 7 `premium plan
granted/denied`, 7 `premium_plus plan granted`, 2 explicit Premium+-split assertions — **23 total, of
which 9 name `premium_plus` directly** and the other 14 assert a `premium`-vs-`premium_plus` split
that has one member in the shipping app. `grep -rn "premium_plus" apps/rn/src` returns **exactly one
hit, and it is the comment at `models.ts:45` saying the tier is gone.** `hasFeatureAccess` and
`premiumPlusOnlyFeatures` appear in **zero** files under `apps/rn/src`.
`packages/core/history/selectVisibleHistory.ts` — on the *shared engine*, not in the legacy tree — is
typed on the 3-tier plan and has exactly one non-test consumer, `lib/hooks/usePayCycleHistory.ts:10`,
which `P6.11` deletes. After `P6.11` that `packages/core` module has no consumer at all.

⚠️ **Stated precisely, because the over-claim is tempting:** this is **not** "RN premium gating is
untested" — `apps/rn/src/premium/premiumKind.test.ts` and `perMonthAnchor.test.ts` exist, and this
lane did not read them. The finding is narrower and it is about the *instrument*: the assertions
carrying the words "subscription gating" in the shipping gate's output describe a product shape that
was retired.

**Mechanism, as a hypothesis.** `premium_plus` was built as forward-compatible gating
(`hasFeatureAccess.ts:4-11` and `plans.ts:7-12` both say the tier is real in code but unpurchasable
until v1.7), the RN rewrite then dropped the tier, and these tests moved into `packages/core` during
the engine extraction without anyone re-asking whether their subject had survived. **Unverified:** I
did not trace when `testSubscriptionGating.ts` was moved.

**Remedy — NOT VERIFIED.** This is a *decision*, not a fix, and it belongs with `D3-1`'s (a)-vs-(b):
if `premium_plus` is genuinely dead, `selectVisibleHistory.ts` and `testSubscriptionGating.ts` are
deletions rather than migrations and `P6.11` gets simpler; if v1.7 still intends the tier they are
migrations and must move into `packages/core` off the `@/*` alias. ⛔ **Do not decide it from this
finding alone** — `lib/subscription/plans.ts:12` holds `PREMIUM_PLUS_AVAILABLE = false` with the
comment *"Flip to true when v1.7 ships the tier"*, and this repo is v1.7.

---

## D3-3 — **the migrating defect: `S1.10.6.7.4`'s benefit-claim rounding fix reached ONE of the formatter's two definitions**. The legacy copy still rounds a savings claim in the app's own favour

**Severity:** `minor` *(false money, but on a surface no shipping build reaches — see "why not major"
below)* · **Origin:** `neighbour` — the legacy consumer that did not move, of a `packages/core`
producer that did.

**User-facing consequence.** On the legacy planner's free headline card, a plan that saves **30
months** is stated as **"3 years"** — half a year of payoff the plan does not deliver, on the exact
line a user reads to decide whether the extra payment is worth making. The overstatement runs up to
**+5 months** for any `monthsSaved` in `{30..35, 42..47, 54..59, …}`.

**File and line.**

- `components/PayoffInterestSavedCard.tsx:4-7` — the defect:
  ```ts
  function formatMonths(months: number): string {
      if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
      return `${Math.round(months / 12)} years`;
  }
  ```
- `components/PayoffInterestSavedCard.tsx:37` — the call site, rendering `interestSaved.monthsSaved`.
- `apps/rn/src/components/payoff/trajectoryDomain.ts:111-114` — the **same function, already fixed**,
  byte-for-byte identical except `Math.floor`, and its docblock at `:100-106` names this exact
  arithmetic: *"`Math.round(30 / 12)` is `3`, so '30 months saved' was stated as **'3 years'** against
  a true 2.5 … on the line a user reads to decide whether the extra payment is worth making."*

**Measurement — the class was iterated, not the member.** `grep -rn "function formatMonths\|const
formatMonths" --include=*.ts --include=*.tsx . --exclude-dir=node_modules` returns **exactly two
definitions in the repository**:

```
apps/rn/src/components/payoff/trajectoryDomain.ts:111   -> Math.floor   (fixed, and tested)
components/PayoffInterestSavedCard.tsx:4                -> Math.round   (unfixed)
```

Widening to every rounding on a duration claim
(`Math.round(` filtered to month/year/saved/`/ 12` contexts, `.test.` excluded) returns five more
hits, and none of them is a benefit claim: `money.tsx:1220` (`% funded`),
`TrajectoryChart.tsx:282` (an axis stride), `calculateMonthlyInterest.ts:33` (cents),
`computeDrift.ts:105` (days behind), plus the RN docblock itself. **The class has two members and one
is unfixed.**

The two consumers read the **same shared producer**, which is what makes this a migration finding
rather than a legacy curio: `packages/core/debt/computeInterestSaved.ts:61-68` computes
`monthsSaved`, `components/PayoffInterestSavedCard.tsx:37` renders it through the rounding copy, and
`apps/rn/src/components/payoff/TrajectoryChart.tsx:67,69` renders it through the flooring copy — so
one `monthsSaved` value has two different spoken answers depending on which app is running.

RN's fix is guarded and the guard is real, which is worth stating because it bounds the risk of
re-migration: `apps/rn/src/components/payoff/trajectoryDomain.test.ts:159` asserts
`stated <= m / 12` — *"never more than the true"* — a property assertion rather than an example, so a
future re-introduction of `round` on the RN side reds.

**Mechanism, as a hypothesis.** `formatMonths` was extracted out of `TrajectoryChart.tsx` into
`trajectoryDomain.ts` specifically so it could be reached by the node test runner (its docblock says
so), and the fix was applied at the extraction site. The legacy card holds a private, unexported,
never-imported copy of the same six lines — invisible to a search for the *symbol's consumers*, and
findable only by searching for the *definition*. I hypothesise the pass-3 fix searched call sites of
the extracted function. **Unverified:** I did not read the `S1.10.6.7.4` fix commit.

**Why not `major`/`blocker`.** The false claim is real, but I could find no shipping path that renders
it: `codemagic.yaml` builds `apps/rn` only (`working_directory: apps/rn`, `expo prebuild`,
`bundle_identifier: com.jasonsnyder.debtplanner`), `web-e2e.yml` no longer builds the legacy app (its
own header at `:19` says *"It used to gate the LEGACY Capacitor/Next app"*), and the one workflow that
still runs `npm run build` — `legacy-container-capture.yml:110` — checks out `v1.6-dev`, not this
tree, and is documented as spent and unrunnable. **A reader who disagrees with that reasoning should
raise this to `major`; the arithmetic is not in dispute.**

**Remedy — NOT VERIFIED, and there are two and they are not the same.** (a) If `P6.11` deletes
`components/PayoffInterestSavedCard.tsx`, this closes itself and needs nothing. (b) If any of this
card's copy is being *ported* into RN before the deletion, the port must take
`trajectoryDomain.ts`'s `formatMonths`, not this file's. ⛔ **Do not "fix" the legacy file by
changing `round` to `floor` in isolation** — that spends a triage slot on bytes scheduled for
deletion, and it is the shape of remedy the brief records as having introduced the defect it
described five times in pass 5.

---

## D3-4 — the `S1.12.11` conflict-marker gate requires the OPEN **and** CLOSE markers to BOTH be present, so a half-resolved conflict — the most common leftover — reads green

**Severity:** `major` — *"an instrument reports green while doing less than it claims."*
**Origin:** `instrument` (the checking code the fixing itself wrote).

**First, the answer to what this lane was actually sent to check: there is NO `S1.12.11`-shape
breakage in the tree today.** Measured two ways, each command's own exit code read:

```
git grep -c -E "^<<<<<<< |^>>>>>>> |^=======$" -- app components lib tests
  -> git_grep_exit=1   (rg/git-grep convention: 1 == no match), 0 files listed
     population: 118 tracked files under app/ components/ lib/ tests/ — the whole legacy root,
     not merely my 26

node --max-old-space-size=1536 ./node_modules/tsx/dist/cli.mjs scripts/check-conflict-markers.ts
  -> conflict_gate_exit=0
     "✅ conflict markers: none in 982 tracked file(s) of 1326 [read 173374 lines, floor 161685]"
```

**The finding is about the gate that returned that green.**

**User-facing consequence.** None directly; the consequence is that the guard built in response to
*"42 gates read green over a tree containing `<<<<<<<`"* can itself read green over a tree containing
`>>>>>>>`. The class it was written to end is not fully ended.

**File and line.** `scripts/check-conflict-markers.ts:76`:

```ts
if (!(OPEN.test(text) && CLOSE.test(text))) continue;
```

The conjunction is the whole finding. A file is examined line-by-line (`:77-79`) **only if it holds
both an opening and a closing marker**. Any file holding one of the three markers alone is skipped
before a single line is looked at.

**Measurement.** Because twelve lanes are reading this same working tree concurrently, I did **not**
plant into a tracked file — a plant would have poisoned another lane's read mid-round. Instead I
replicated `:49-51` and `:76-79` **verbatim** into a scratchpad script and ran five synthetic file
bodies through it. The control discriminates, which is the property that makes the other four rows
mean anything:

```
FLAGGED   A. full conflict (the S1.12.11 shape)          [contains a marker line: true]
PASSES    B. OPEN + MID, CLOSE deleted (half-resolved)   [contains a marker line: true]
PASSES    C. OPEN only, both other markers deleted       [contains a marker line: true]
PASSES    D. MID + CLOSE, OPEN deleted                   [contains a marker line: true]
PASSES    E. clean file (control)                        [contains a marker line: false]
```

**Row D is the realistic one, and it is worth naming precisely.** The ordinary way a conflict gets
half-resolved is that someone keeps the upper side, deletes `<<<<<<< HEAD` and `=======`, and leaves
the trailing `>>>>>>> branch` behind. That file has a line beginning `>>>>>>> ` — which is a syntax
error in every language in this repo, exactly as `<<<<<<<` was in `app/page.tsx` — and this gate
passes it. The gate's own failure text at `:97` shows the author had this user in mind: *"⛔ Resolve
the conflict — do not delete the markers and keep both sides."* The check does not cover the case the
message warns about.

**The gate is live**, which is what makes this `major` rather than a curio: `scripts/run-gates.ts:104`
lists `'lint:conflict-markers'` in the runner that `npm run lint:rn` executes, and `lint:rn` is a step
of both `validate:release:rn` and `.github/workflows/web-e2e.yml:92`.

**Mechanism, as a hypothesis.** `MID` (`=======`) genuinely needs a companion — seven equals signs at
line start is a legitimate ASCII divider and would false-positive constantly — and I hypothesise the
pairing requirement was written for `MID` and then applied to the whole file as one condition, rather
than per-marker. `OPEN` and `CLOSE` need no such companion: seven `<` or `>` at line start followed by
a space or EOL is not legitimate source in any language here. **Unverified:** I did not check the
gate's history for whether `MID` was the motivating case.

**Remedy — NOT VERIFIED, and stated as the shape rather than the diff.** The pairing requirement
appears to belong on `MID` alone, not on the file: flag on `OPEN` or `CLOSE` unconditionally, and
require the pair only before flagging a bare `MID`. ⚠️ **This must be planted before it is believed** —
this lane measured the predicate, not the gate, and `scripts/test-gate-plants.ts` exists for exactly
this. ⛔ **The plant must be run in both directions** (a `>>>>>>>`-only file must red, a file with a
legitimate `=======` divider must stay green), or the fix trades this hole for a false-positive that
will get the marker check disabled. `scripts/lib/scanFloor`'s floor (`161685`) is unaffected either
way — the change is to the predicate, not the population.

---

## D3-5 — the payday "confirm what you paid" caption subtracts two totals built from **different populations**, unclamped, and prints a NEGATIVE amount as money the user *paid*. The expression is shared verbatim by the legacy sheet and the **shipping RN sheet**

**Severity:** `major`, and **`blocker` if the reachability hypothesis below is confirmed** — *"the app
states something false about the user's money."* I did **not** build the store that produces it (see
"what is NOT measured"), so I am not claiming `blocker` on my own authority.
**Origin:** `neighbour` — found from the legacy side; the live instance is in `apps/rn`.

**User-facing consequence.** On the payday checkpoint — the one screen whose job is to establish
ground truth about what the user actually paid — the subtitle can read **`-$150 paid · $200
carries`**. A negative figure labelled *paid* is not a rounding imprecision; it is the app telling the
user it recorded them paying minus one hundred and fifty dollars.

**File and line — one expression, two files, and it is byte-identical:**

- `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:226-227` **(the shipping app)**
  ```ts
  const requiredSub = hasAdjustedRequired
    ? carryForward > 0
      ? `${formatCurrency(requiredTotal - carryForward)} paid · ${formatCurrency(carryForward)} carries`
  ```
- `components/PaydayCaptureSheet.tsx:323-324` **(legacy, on my manifest)** — the same two lines.
- `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:161` — **the clamp, 66 lines earlier, on the
  same subtraction**:
  ```ts
  const capturedTotal = (hasAdjustedRequired ? Math.max(0, requiredTotal - carryForward) : requiredTotal) + plannedTotal;
  ```
  The author of `:161` evidently believed `requiredTotal - carryForward` can go below zero. `:227`
  did not get the same treatment. **This is the one-of-two-siblings shape again, and this time both
  siblings are in the same file.**

**Measurement — printed values, one variable, from the real `formatCurrency`:**

```
requiredTotal=50   carryForward=200  ->  "-$150 paid · $200 carries"
requiredTotal=0    carryForward=200  ->  "-$200 paid · $200 carries"
requiredTotal=120  carryForward=320  ->  "-$200 paid · $320 carries"
requiredTotal=500  carryForward=500  ->  "$0 paid · $500 carries"      (control: boundary is fine)
requiredTotal=500  carryForward=200  ->  "$300 paid · $200 carries"    (control: normal case is fine)
clamped sibling (line 161) at the same inputs: "$0"
```

`packages/core/utils/formatCurrency.ts` does **not** hide the sign, and that is deliberate — its own
header at `:21-23` says so: *"⚠️ **A negative clamp is NOT a formatting rule.** … If a value cannot
legitimately go negative, clamp it at the SELECTOR; if it can, show it."* Neither branch of that rule
was taken here: the value is not clamped, and it is shown under a label that makes the sign a false
statement rather than an informative one.

**Mechanism, as a hypothesis — the two operands have different populations, and I traced both:**

`requiredTotal` is `allocation.totalRequired` (`apps/rn/src/app/(tabs)/index.tsx:749` →
`apps/rn/src/store/planSelectors.ts:436`), which is
`packages/core/engine/allocatePaycheck.ts:350-352` — a sum over `upcomingExpenses` +
`upcomingMinimums`. Both are filtered **by due date**: `upcomingMinimums` at `:333-334` is
`debts.filter((debt) => isDueBeforeNextPaycheck(debt.dueDate))`.

`carryForward` (`PaydayCaptureSheet.tsx:147-150`) sums `row.item.amount` over **`requiredRows`**,
which is `selectRequiredRows` (`planSelectors.ts:155-194`) — the allocation's required rows **plus a
re-add block at `:181-192`** that pulls already-paid items straight off the store:

```ts
...store.requiredExpenses.filter((e) => e.isPaidThisCycle && !shownExpenses.has(e.id))
...store.debts.filter((d) => (d.minimumPaidThisCycle ?? d.isPaidThisCycle) && d.balance > 0 && !shownDebts.has(d.id))
```

⚡ **Neither re-add filter carries the due-date test that `totalRequired`'s population carries.** So an
item **paid early — marked paid this cycle, but due after the next paycheck** — becomes a row whose
amount is in `carryForward`'s population and **not** in `requiredTotal`'s. Every such row is rendered
as a tappable `accessibilityRole="checkbox"` calling `toggleRequired(id)`
(`PaydayCaptureSheet.tsx:269-277`), and unchecking one sets `requiredPaid[id] = false`, which is
exactly `carryForward`'s condition at `:149`. Enough of them, and the subtraction crosses zero.

⚠️ **I deliberately checked the tempting wrong premise first.** `planSelectors.ts:171` states *"The
allocation drops items already PAID this cycle"*, which reads as though `totalRequired` excludes paid
items and would make the subtraction unbounded far more easily. **That is not what the allocator
does:** `allocatePaycheck.ts:350` sums the `upcoming*` arrays, which contain paid and unpaid alike —
the paid/unpaid split happens *later*, at `:361-372` and `:393-398`, into `paidRequiredTotal` and
`unpaidRequiredTotal`, neither of which is what the sheet receives. So the gap is **not** "paid items
are missing from `requiredTotal`"; it is narrower and it is only the **due-date** disagreement. A
comment is a carried premise, and acting on this one would have produced a finding with the wrong
mechanism and the wrong remedy.

**⛔ What is NOT measured, stated so triage does not inherit a claim I did not make.** I did not
construct a `DebtStore` with a paid-early item and drive the sheet, so I have **not** observed
`-$150 paid` on a rendered screen — I have observed that the expression prints it for inputs the two
populations permit, and that the populations differ in the way described. The remaining question is
purely whether a required item can hold `isPaidThisCycle === true` while
`isDueBeforeNextPaycheck(dueDate) === false`. **That is one fixture, and it is the whole finding.**
Building it was out of scope for a reduced-mandate lane on a tree scheduled for deletion, and it is
squarely in scope for whichever lane owns `apps/rn/src/store/planSelectors.ts`.

**Remedy — NOT VERIFIED, and the obvious one is wrong.** ⛔ **Do not wrap `:227` in `Math.max(0, …)`.**
That is the exact move `formatCurrency`'s header forbids (*"silently turns −$45 into $0 — the exact
'hide money' behaviour"*), and it would make the caption read `$0 paid` while the user is looking at
rows they marked paid — trading a visibly-false number for an invisibly-false one. If the fixture
confirms reachability, the fix belongs at the **selector**: either `carryForward` sums only rows whose
amounts are in `totalRequired`'s population, or `requiredTotal` is recomputed from `requiredRows` so
the two operands share one population. ⚠️ The second is likely the smaller change and the more
dangerous one — `requiredTotal` is also read by `PlanHero.tsx:64,83`, which does its own
`Math.max(0, summary.requiredTotal - summary.shortfall)` and whose docblock at `:67-75` records a
conservation property that a redefinition would silently break.

---

## Checked and NOT a finding — recorded so triage does not re-spend the lookup

Four things this lane went looking for turned out to be already handled. Each is written down because
"pass 6 didn't report it" and "pass 6 checked it and it was fine" are different facts, and pass 4 lost
four findings' worth of triage time to the difference.

1. **`setMonth` month-overflow in the legacy tree — already scanned, reported, and self-retiring.**
   `components/AmortizationCalendar.tsx:24` does `base.setMonth(base.getMonth() + monthOffset)`, the
   banned overflow spelling. `scripts/check-month-arithmetic.ts` already covers it by a deliberate
   design I could not improve on: the legacy root is in a `PENDING_DELETION` root list that is
   **scanned and reported but not failed**, and the paths are asserted to *exist*, so `P6.11` deleting
   the tree turns the gate red until the exemption is removed. Run this session:
   ```
   month_arith_exit=0
   ⚠️  legacy tree (98 files, P6.11 deletes it): 2 unconverted site(s), reported not failed:
      components\AmortizationCalendar.tsx:24: base.setMonth(base.getMonth() + monthOffset);
      components\Onboarding\FirstDebtOrBillStep.tsx:15: d.setMonth(d.getMonth() + 1);
   ```
   ⭐ This is the pattern the `D3-1` coupling should have used and did not: an exemption that carries
   its own expiry assertion.
2. **The `debtCsv.ts` "earliest deadline in the whole audit" is CLOSED.** The plan warns that
   `packages/core/imports/debtCsv.ts`'s *"only consumer today is the tree that dies"*. That is no
   longer true: `apps/rn/src/components/entities/ImportDebtsSheet.tsx:2,53` is a live RN caller and
   `packages/core/imports/testDebtCsv.ts` is its test. `lib/hooks/useDebts.ts:195` is now the second
   caller, not the only one. **The rescue landed; the deadline can be struck.**
3. **`ImportDebtsSheet.tsx:53`'s `makeId: () => ''` is deliberate, not a defect.** It looks alarming
   beside `useDebts.ts:196`'s `crypto.randomUUID()`, but the comment above it and `apply()` at `:75-78`
   show ids are minted at APPLY via `mintDebtIds(...)` against `reservedDebtIds(state.store)` — the
   preview intentionally consumes none.
4. **No hand-rolled money formatter on the legacy money surface.** `Intl.NumberFormat` /
   `toLocaleString` / `toFixed` across `app/ components/ lib/` returns three hits, and two are SVG
   path coordinates (`SnowballSection.tsx:225,228`). ⚠️ The third is a real one and is **off my
   manifest**: `components/PlanSettings/PlanSettingsBody.tsx:188` builds a money string by hand —
   `` `Added $${extra.toFixed(2)} windfall to this paycheck.` `` — which is the T6.4 "never hand-roll a
   money formatter" shape and would render `$100.00` where `formatCurrency` renders `$100`. Legacy
   only, deleted at `P6.11`, and correctly outside `lint:money`'s roots
   (`scripts/check-money-format.ts:31` scopes to `packages/core` + `apps/rn/src`). **Recorded, not
   raised.**
