# Lane A — the money engine and the specs that claim to guard it

**Auditor:** A (fresh eyes) · **Pass 5** · target `65566a09b96cdad8072261ac4a710ee1733be467` on `v1.7-dev`
**Manifest:** `ROUTING-A.txt`, 108 files. Origins from `ROUTING-ORIGINS.tsv`.

Findings are appended in the order they were measured. Counts in this file are **lower bounds**
(site enumeration in this repo has come in short on eight consecutive items).

---

## Log

- Started. Worktree setup pending.

---

## Findings

### Setup and method (recorded before the findings, so the reds below can be read)

Worktree: `git worktree add --detach C:\Users\Jason\audit-p5-a 65566a09` + junctions for
`node_modules`, `apps/rn/node_modules`.

⚠️ **The pass-4 worktree recipe is incomplete and `npm run test:app` cannot run without the third
junction.** `apps/rn/core` is a **gitignored** link to `packages/core` (root `.gitignore:56-57`,
created by `apps/rn/metro.config.js` at Metro startup). `git ls-files apps/rn/core` → empty, so a
detached worktree does not get it, and `apps/rn/tsconfig.json:12` maps `@core/* → ./core/*`.
`npm run test:app` in a fresh worktree dies at `Cannot find module '@core/payCycle/getNextPaycheckDate'`
**after printing 60 green `✓` lines** — an exit-1 that looks like a test failure and is not.
Fixed locally with `mklink /J apps\rn\core packages\core`. **Recorded so the next pass adds it to the
recipe** (and so a reader of a truncated log does not mistake it for a red).

⚠️ **Shell note, cost me one plant.** Git Bash on Windows (MSYS) rewrites an argument beginning `//`
to `/`. Plant `P2` first went in as `/ plant: guard removed` and produced `ERROR: Unterminated regular
expression`, which reads exactly like a real red. **Never use a `//` comment as plant text here.**

**Baselines, all green at `65566a09`:**

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx packages/core/testing/runRegressionTests
✅ All regression tests passed.                                   EXIT=0   (756 lines)
$ NODE_OPTIONS=--max-old-space-size=1536 npm run test:app
✅ App-layer regression tests: ALL PASSED.                        EXIT=0   (2185 lines)
$ NODE_OPTIONS=--max-old-space-size=1536 npm run test:scenarios
✅ Scenario tests: ALL PASSED.                                    EXIT=0
```

⚠️ **`runRegressionTests` is FAIL-FAST** — the first failing assert throws and the process dies, so a
planted red proves the *first* instrument that sees the defect and says nothing about the rest.
Every red below is quoted with the assertion text that produced it, per "a red is not evidence until
you know which claim produced it."

**Plant protocol used for every plant below:** `cp` pre-image → mutate with a Python UTF-8 rewrite →
`cp` post-image → assert the bytes actually changed (a no-op plant is reported as `NO-OP`, never as a
pass) → run the suite(s) → restore from the pre-image → `diff` restored vs pre-image → `git status
--porcelain <file>` must be empty. Every line below carries `restore=OK gitdirty=0`.

---

## ✅ Closed on measurement — recorded so nobody re-files them

**`A-F4` (pass 4's blocker) is genuinely closed, and it survives its own un-fix.**

```
$ npx tsx scripts/prove-guards.ts --id=S1P4-A-F4-ONEGUARD
  ✅ S1P4-A-F4-ONEGUARD  plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
EXIT=0
```

I did not stop at the registered token. I re-planted the **real** un-fix — moved
`cannotAmortize(pool, monthlyBudget)` from before the accrual loop to after it in
`buildPayoffTrajectory.ts:92` (the exact pass-4 defect, not the registry's synthetic edit):

```
PLANT-P10 rc=1 restore=OK gitdirty=0
Error: ⛔ A-F4 · the reported plan: $6,379.24 @ 25.22%, $136 min — the DATE says payable and the
        CHART says unpayable; they are one fact failed. Expected true, received false
```

And I measured the pair directly rather than trusting either. Two differential probes over the two
producers (`projectDebtPayoff` = the debt-free DATE, `simulatePayoff` = the CHART), comparing both
*whether* the plan clears and *which month* it clears in:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe1.ts   # 4,000 non-BNPL plans
checked 4000 disagree 0                                              EXIT=0
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe2.ts   # 6,000 plans, 50% BNPL,
                                                                     # all 7 recurrences incl. one-time
disagree 0 of 6000                                                   EXIT=0
```

⚠️ **This is a lower bound on agreement, not a proof of it.** The probes sample; they do not
enumerate. What would make it checkable is the differential itself living in `test:regression` —
it does not (see `A5-4`).

**Also planted and correctly caught** (regression suite, first-failing assert quoted):

| plant | file:line | mutation | result |
|---|---|---|---|
| `P1` | `payCycle/payCyclesPerMonth.ts:18` | biweekly `26/12` → `2` | red · *"biweekly = 26/12 failed. Expected 2.1666…, received 2"* |
| `P2` | `debt/cannotAmortize.ts:65` | drop `monthlyBudget <= 0` half | red · *"one-time BNPL clears the month it lands (B1) failed. Expected 1, received 0"* |
| `P3` | `debt/bnplPayoffPace.ts:43` | drop the cadence factor | red · *"biweekly BNPL rated at its true monthly rate (B1) failed. Expected 2, received 4"* |
| `P4` | `utils/addMonths.ts:28` | drop the short-month clamp | red · *"Jan 31 monthly clamps to Feb 28 (not Mar 3) failed. Expected 2026-02-28, received 2026-03-03"* |
| `P5` | `debt/applyDebtPaymentProjection.ts:11` | drop the payment cap | red · *"single month payment is capped at balance failed. Expected \$50, received \$100"* |
| `P6` | `debt/projectCurrentBalance.ts:84` | drop the partial-month interest | red · *"partial month accrues prorated interest only … expected ~1004.93, got 1000"* |

| `P10` | `debt/buildPayoffTrajectory.ts:92` | move the guard back after accrual (`A-F4`'s un-fix) | red · *"⛔ A-F4 · the DATE says payable and the CHART says unpayable"* |
| `P11` | `debt/computeDrift.ts:105` | flip the drift sign | red · *"days behind (positive) failed. Expected ~59 (±1), received -59"* |
| `P12` | `debt/reconcileAutopay.ts:23` | drop the `autopayFailedThisCycle` half | red · *"autopay flagged failed → NOT presumed paid (stays owed)"* |
| `P13` | `obligations/classifyDeferability.ts:20` | default to `deferrable` | red · *"housing → essential: expected essential, got deferrable"* |
| `P14` | `obligations/effectiveObligationAmount.ts:19` | `>=` → `>` on the kick-in date | red · *"trial on kick-in date → full amount: expected 40, got 0"* |
| `P15` | `debt/originalBalanceHighWater.ts:46` | stop raising on an upward correction | red · *"a balance corrected ABOVE the stamp raises it — got 500, expected 5000"* |
| `P16` | `debt/getDebtsWithDisplayBalances.ts:45` | `\|\|` → `??` (pass-3 `A5`'s refused remedy) | red · *"isPaidThisCycle also subtracts the minimum: expected 950, received 1000"* |
| `P17` | `debt/computeStreak.ts:12` | legacy default `true` → `false` | red · *"legacy snapshot without allRequiredMet qualifies: expected 1, received 0"* |
| `P18` | `cashflow/waterFill.ts:79` | never hold back | red · *"surplus held back ahead of a coming crunch (cap→0)"* |
| `P19` | `debt/extraPaymentPlan.ts:55` | `>=` → `>` on `isPaidOff` | red · *"[SmallDebt is paid off]: expected true, got false"* |
| `P20` | `debt/computeInterestSaved.ts:51` | drop the unpayable sentinel branch | red · *"plan still unpayable → none: expected none, received payoff-enabling"* |
| `P22` | `debt/applyRolloverPayment.ts:73` | accrue interest on BNPL | red · *"rollover: BNPL deducts payment with zero interest despite nonzero APR: expected ~300, got 308.33"* |
| `P23` | `guardian/holdbackComposition.ts:55` | drop the headroom clamp | red · *"over headroom → clamped to above-floor: expected $100, got $140"* |
| `P24` | `history/buildCycleSnapshot.ts:75` | re-derive from raw `minimumPayment` (`A2`'s un-fix) | red · *"History reports the money the rollover actually deducted (S1P3-A2): expected 200, got 100"* |
| `P25` | `debt/buildPaydayCaptureItems.ts:63` | ignore the per-item override | red · *"override sets the real actual amount: expected 175, received 300"* |
| `P26` | `engine/emergencyFund.ts:42` | identity → type comparison | red · *"[A-J2-4] a second emergency goal is FUNDED, not starved at $0: expected $800, received $0"* |
| `P28` | `debt/computeMilestones.ts:80` | drop the `priorMax` half | red · reg *"no re-fire past a crossed threshold"* AND app *"an already-celebrated threshold does not re-fire"* |
| `P29` | `payCycle/getNextPaycheckDate.ts:43` | biweekly `+14` → `+15` | red · *"biweekly next paycheck: expected 2026-05-15, received 2026-05-16"* |

**`A-F1` (the window args) is closed and the type really is the guard.** I deleted `windowStartISO` /
`windowEndISO` from the only shipping call (`apps/rn/src/store/payday.ts:86`) and typechecked **only**
the RN project, per the no-monorepo-typecheck rule:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npm run typecheck:rn      # baseline
EXIT=0
$ (with the two lines deleted)                                     TCRN_EXIT=2
src/store/payday.ts(86,24): error TS2345: … is not assignable to parameter of type
  '{ …; windowStartISO: string; windowEndISO: string; }'
RESTORE=OK · gitdirty 0
```

⚠️ **`A-F2` (`sanitizeAmountInput`) is closed with a real property, not another row.**
`testAmountField.ts:124-134` loops nine point-shaped inputs asserting `points <= 1` **plus three
controls** that a point-deleting sanitizer would fail. That is the shape reading rule 3 asks for.

⚠️ **One plant of mine was a NO-OP and I am recording it rather than counting it.** `P9` changed
`calculateMonthlyInterest`'s `balance <= 0 || apr <= 0` to `< 0`; with `apr === 0` the rate is `0` and
with `balance === 0` the product is `0`, so the mutation is behaviour-preserving. Its green is **not**
evidence of a coverage gap. `P27` (deleting Sezzle from `BNPL_PROVIDERS`) was also discarded — removing
a provider from the single owner keeps the picker and the scanner in agreement, so it is a data change
and not a defect.

⛔ **And one plant leaked, which is worth more than the plant.** My batch runner was killed by a
2-minute tool timeout *between* mutating `getNextPaycheckDate.ts` and restoring it, so the NEXT plant
(`P28`) ran on a tree still carrying `P29`'s mutation and reported a red — **"biweekly next paycheck
failed", a claim `P28` has nothing to do with.** Both were re-run clean and both reds above are the
re-runs. *A red is not evidence until you know which claim produced it*, measured on myself.

---

## Findings

### `A5-1` · **blocker** · a `per-paycheck` BNPL's debt-free date is wrong by the user's pay cadence

**Origin:** `packages/core/debt/bnplPayoffPace.ts` — **neighbour** (it did not change; its consumers did).
**File:** `packages/core/debt/bnplPayoffPace.ts:23-30` (`BNPL_MONTHLY_FACTOR`), consumed at
`projectDebtPayoff.ts:97`, `buildPayoffTrajectory.ts:47` and `projectCurrentBalance.ts:74`.

**User-facing consequence.** A monthly-paid user with a `per-paycheck` BNPL of $100 × 12 ($1,200) is
shown a debt-free date of **July 2026** on the Payoff screen, over a chart that reaches zero at the same
month — while the balance the app itself maintains does not reach $0 until **January 2027**. Six months,
on the app's headline claim about the user's own plan, with the chart agreeing so nothing on screen
disputes it. A weekly-paid user gets the same wrong date in the opposite direction (told six months,
actually ~2.8).

**Measurement.** `probe4.ts` runs the two producers side by side: `projectDebtPayoff` /
`simulatePayoff` (what the app SAYS) against real pay-cycle stepping through `applyRolloverPayment` +
`rolloverDebts` (what the app DOES to the balance):

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe4.ts        EXIT=0
payCycle=monthly      engineRate=$216.67 | SAID 6 mo (July 2026) chart=6 | DID 12 cycles -> 2027-01-15 (~12.0 mo)
payCycle=weekly       engineRate=$216.67 | SAID 6 mo (July 2026) chart=6 | DID 12 cycles -> 2026-04-09 (~2.8 mo)
payCycle=semimonthly  engineRate=$216.67 | SAID 6 mo (July 2026) chart=6 | DID 12 cycles -> 2026-07-15 (~5.9 mo)
payCycle=biweekly     engineRate=$216.67 | SAID 6 mo (July 2026) chart=6 | DID 12 cycles -> 2026-07-02 (~5.5 mo)
```

The engine's rate is the same $216.67/month in all four rows — **it cannot vary, because the pay cycle
is not in scope where it is computed.** The seam that moves the balance charges exactly one installment
per pay cycle, which is what `per-paycheck` means.

**Reachability, checked rather than assumed.** `apps/rn/src/components/entities/DebtSheet.tsx:39` offers
`per-paycheck` in the debt recurrence picker, and `packages/core/imports/debtCsv.ts:42` accepts it on
import. Both are one tap / one column away.

**Mechanism, stated as a hypothesis.** `BNPL_MONTHLY_FACTOR['per-paycheck'] = 26/12` is a *constant*
standing in for a *user variable*. Its own comment says so — *"per-paycheck has no pay-cycle here →
assume biweekly, the common case; threading the user's real pay cycle is a backlog item"* — so the
premise is written down; what was never measured is its SIZE against the app's other producer of the
same number. Every one of the three consumers already has the real cadence available one frame up
(`payoffSelectors.ts:60`, `analysisSelectors.ts:52` and `planSelectors.ts:118` all call
`payCyclesPerMonth(store.paycheck.payCycle)` on the line that computes the extra).

**Remedy — direction verified arithmetically, implementation NOT verified.** I measured two candidates
rather than proposing one:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe5.ts        EXIT=0
payCycle=weekly       actual≈2.8mo | shipped=6 | candA(factor 1)=12 | candB(cyclesPerYear/12)=3
payCycle=biweekly     actual≈5.5mo | shipped=6 | candA(factor 1)=12 | candB(cyclesPerYear/12)=6
payCycle=semimonthly  actual≈5.9mo | shipped=6 | candA(factor 1)=12 | candB(cyclesPerYear/12)=6
payCycle=monthly      actual≈12.0mo | shipped=6 | candA(factor 1)=12 | candB(cyclesPerYear/12)=12
```

⛔ **Candidate A — deleting the `'per-paycheck'` key so the `?? 1` fallback applies — is WRONG in three
of four cadences and makes the common (biweekly) case worse than today.** It is the obvious one-line
fix and it introduces a defect; that is the shape pass 4 measured in five of its own remedies.
**Candidate B — rate `per-paycheck` at `cyclesPerYear(payCycle) / 12`** — matches the app's own paydown
in all four. But it is a **signature change**: `bnplMonthlyEquivalentMinimum` takes only a debt, so the
pay cycle has to be threaded through `projectDebtPayoff`, `simulatePayoff`/`buildPayoffTrajectory` and
`projectCurrentBalance` and out to their callers. **I did not implement or test that, so the remedy is
NOT VERIFIED.** The arithmetic is verified; the wiring is not.

⚠️ **What would make this class checkable rather than enumerable.** The engine and the rollover are two
producers of "what does this plan cost per month", and nothing compares them. `cyclesPerYear.ts`
already does exactly this reconciliation **for interest** and says so in its header — *"sums, over a
year of rollovers, to exactly `balance * apr`"*. The same year-of-rollovers identity for the PAYMENT
side, over every `Recurrence` × every `PayCycle` (7 × 4 = 28 pairs), is a test rather than a list, and
it would have caught this without anyone naming `per-paycheck`. I have not written it.

### `A5-2` · **major** · `formatCurrency`'s non-finite guard survives its own un-fix in every suite

**Origin:** `packages/core/utils/formatCurrency.ts` — **neighbour**.
**File:** `packages/core/utils/formatCurrency.ts:43`.

**What this guard is.** Its own header calls it the root fix that let **T6.4 collapse seven local money
formatters** — *"`LeanSuggestionCard`'s rendered `$-45` and `$NaN`, and `paywallLead`'s (behind the live
public embed) had quietly dropped its `Number.isFinite` guard."* Every money string in the app now comes
through this one line. It is the highest-fan-in money guard in the tree.

**User-facing consequence if it regresses.** The rendered strings, measured on both sides:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe6.ts        EXIT=0
=== SHIPPED (guard present)          === GUARD REMOVED
       NaN -> $0                            NaN -> $NaN
  Infinity -> $0                       Infinity -> $∞
 -Infinity -> $0                      -Infinity -> -$∞
       -45 -> -$45                          -45 -> -$45      (unchanged — the clamp is correctly NOT here)
   1240.37 -> $1,240.37                 1240.37 -> $1,240.37
```

**The measurement — the un-fix is invisible to everything that runs.** `const safe =
Number.isFinite(amount) ? amount : 0;` → `const safe = amount;`:

```
PLANT-P7 reg=0 app=0 scenarios=0 restore=OK gitdirty=0
$ NODE_OPTIONS=--max-old-space-size=1536 npm run lint:money        LINTMONEY_EXIT=0
✅ money-format: no hand-rolled currency formatters (4 shapes checked). [read 25493 lines, floor 23983]
```

Four green gates over a build that renders `$NaN`. `test:regression`, `test:app`, `test:scenarios` and
`lint:money` — and `lint:money`'s registered guard `S1P3-B1-SWEEP` is, on inspection of
`scripts/finding-guards.json:1432`, pinned to `buildSmartInsights.ts`'s *call site*, not to this
function's behaviour. It is green about the thing it covers.

**Mechanism, stated as a hypothesis.** The T6.4 sweep moved the correctness to one owner and moved the
*test* nowhere — the seven deleted copies had no tests either, so collapsing them collapsed a coverage
of zero into a coverage of zero at a single point of far higher blast radius. `lint:money` was written
to stop the formatters MULTIPLYING; nothing was written to stop the survivor from being edited.

**⚠️ And a live spec is already reasoning from the unguarded premise.**
`apps/rn/tests/e2e/bnpl.spec.ts:83-85` **narrows its own assertion** on it: *"Two of the three failure
modes it names are impossible — `formatCurrency` is defensive and can return neither `""` nor `"$NaN"`
(`packages/core/utils/formatCurrency.ts:42`) — while the one that IS reachable … Hence `[1-9]`."* That
is a carried premise doing load-bearing work in a weaker regex, with nothing holding the premise up.

**Remedy — NOT VERIFIED (I did not write it).** The shape that would close it is a unit assertion beside
the existing money tests: `formatCurrency(NaN)`, `formatCurrency(Infinity)` and `formatCurrency(-Infinity)`
each `=== '$0'`, **plus a control** that `formatCurrency(-45) === '-$45'` — without the control, a
remedy that re-adds a `Math.max(0, …)` clamp would pass while re-introducing the *"hide money"*
behaviour this file's own header refuses. ⚠️ I did not write or run it, so it is a hypothesis.

**Minor, same file, folded in here rather than filed twice.** Line 42's comment says the guard shows
*"$0.00"*. It shows **`$0`** — `minimumFractionDigits: 0`, set eleven lines below, is what changed and
the comment did not. Nothing depends on it; it is quoted only because it is the exact *"a comment is a
carried premise"* shape, found inside the file that states the money-precision rule for the whole app.

---

### `A5-3` · **major** · the statement scanner's `0–100` APR bound cannot fire, and one real layout is misread by 100 points

**Origin:** `packages/core/scan/parseStatementText.ts` — **neighbour**.
**File:** `packages/core/scan/parseStatementText.ts:108-113`.

**The check that cannot fail.** Line 113 reads
`const apr = Number.isFinite(aprNum) && aprNum >= 0 && aprNum <= 100 ? aprNum : undefined;`
— but both capture groups four lines above are `(\d{1,2}(?:\.\d{1,2})?)`. **Two integer digits.** The
largest value the expression can produce is `99.99`, so `aprNum <= 100` is true for every input the
regex can match. It reads exactly like the scanner's rate bound and it has never rejected anything.

**Measured, not reasoned** — deleting the bound is invisible to all three suites:

```
PLANT-P31  packages/core/scan/parseStatementText.ts:113
           `aprNum >= 0 && aprNum <= 100` -> `aprNum >= 0`
PLANT-P31 reg=0 app=0 scenarios=0 restore=OK gitdirty=0
```

**⚠️ And a live spec cites it as one of three enforcing paths.** `apps/rn/tests/e2e/amount-guards.spec.ts:98-99`:
*"The CSV import, **the statement scanner** and the v1.6 form all bound the rate to `0–100`; the two RN
hand-entry paths tested only 'did it parse'."* The CSV bound is real and reds when planted (`P30`, below).
The scanner's is not. A premise carried into a finding's population count.

**The user-facing half — and it is a false number, not just dead code.** The second pattern,
`/(\d{1,2}(?:\.\d{1,2})?)\s*%\s*(?:apr|annual percentage rate)/i`, is unanchored on its left, so on a
three-integer-digit rate it slides one digit right and matches the tail:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe7.ts        EXIT=0
"Purchase APR 24.99%"            -> {... "apr":24.99 ...}
"Purchase APR 129.99%"           -> {... apr ABSENT ...}          (safe: refused)
"Annual Percentage Rate 399.00%" -> {... apr ABSENT ...}          (safe: refused)
"129.99% APR"                    -> {... "apr":29.99 ...}         ⛔ 100 points low, silently
```

A premium user scans a statement whose rate is printed **before** the letters APR — the layout this
file's own comment names as supported (*"'Purchase APR 24.99%' or '24.99% APR'"*) — and the debt is
prefilled at `29.99`. At a $500 balance that is $12.50 of monthly interest instead of $54.16; the
payoff order, the debt-free date and the interest-saved ledger are all computed from it, and nothing on
screen marks the figure as inferred.

**Severity, argued rather than asserted.** I hold this at **major** rather than blocker for two reasons
I can name: the user sees and confirms the prefilled field before it is saved, and a >100% APR on a
*credit-card statement* is uncommon in the shipped markets (US · CA · AU · NZ) — though payday and
title lending in those same markets routinely exceeds it and is exactly the kind of debt this app is
for. **If either of those two premises is wrong, this is a blocker.** I did not measure how often the
`{rate}% APR` layout occurs in real statements; that is the open half.

**Mechanism, stated as a hypothesis.** The bound and the regex were written as one guard by two
different means, and the tighter of the two — the regex width — silently subsumed the other. The
`<= 100` was then quoted as the enforcement in a spec header, so the redundancy read as belt-and-braces
rather than as a dead branch. ⛔ The hypothesis is that the regex width was chosen to avoid matching
stray numbers, not as a rate bound at all.

**Remedy — VERIFIED for the behaviour measured, not for the scan flow end-to-end.** Widen both captures
to `\d{1,3}` and left-anchor the trailing-label pattern so it cannot start mid-number, leaving line
113's bound to do the rejecting:

```
/(?:purchase apr|annual percentage rate|interest rate|apr)[^\n\d]{0,25}(\d{1,3}(?:\.\d{1,2})?)\s*%/i,
/(?<![\d.])(\d{1,3}(?:\.\d{1,2})?)\s*%\s*(?:apr|annual percentage rate)/i,
```

Measured with it applied:

```
"Purchase APR 24.99%"  -> apr 24.99      (unchanged — the control)
"129.99% APR"          -> apr ABSENT     (the false 29.99 becomes an honest refusal)
$ npx tsx packages/core/testing/runRegressionTests    REG_EXIT=0  "✅ All regression tests passed."
$ npm run lint:scan-floors   BASE_EXIT=0 / REMEDY_EXIT=0  (15 gates, 9 floored, 6 exempt, none stale)
RESTORE=OK · DIRTY=0
```

⚠️ **What I did NOT verify:** the premium scan flow's e2e specs (they need the ~2-minute `expo export`
web build, which I did not run — see "not reached" below), and whether any real OCR text elsewhere in
the corpus now matches a three-digit number it previously skipped. The unit behaviour and the
regression suite are verified; the flow is not.

---

### `A5-4` · **minor** · eighteen private copies of `roundMoney` beside the exported owner

**Origin:** spread across **neighbour** and **fix-churn** files in this lane.
**Files:** `packages/core/utils/money.ts:1` is the owner. Eighteen other definitions:

```
$ grep -rn "function roundMoney" --include=*.ts --include=*.tsx . | grep -v node_modules
19 definitions · 1 exported (utils/money.ts) · 18 private
apps/rn/src/store/balanceSelectors.ts:42   packages/core/cashflow/detectCrunches.ts:24
packages/core/cashflow/waterFill.ts:32     packages/core/debt/applyDebtPaymentProjection.ts:3
packages/core/debt/applyRolloverPayment.ts:6  packages/core/debt/bnplInstallment.ts:5
packages/core/debt/bnplPayoffPace.ts:17    packages/core/debt/buildAmortizationSchedule.ts:28
packages/core/debt/calculateMonthlyInterest.ts:32  packages/core/debt/extraPaymentPlan.ts:1
packages/core/debt/projectCurrentBalance.ts:20  packages/core/debt/projectDebtPayoff.ts:52
packages/core/engine/recommendedActions.ts:24  packages/core/forecast/projectForecast.ts:118
packages/core/guardian/affordability.ts:20  packages/core/history/buildCycleSnapshot.ts:8
packages/core/income/suggestLean.ts:24     packages/core/recovery/buildRecoveryPlan.ts:13
```

**Measured: all nineteen bodies are `Math.round(x * 100) / 100`, character-for-character.** So there is
**no live defect** and this is a minor. It is filed because it is the exact shape this repo has paid for
three times in three passes — `A1`, `A2` and `A-F4` were each *"two producers of one fact"* — and
`cannotAmortize.ts:32-34` states the rule the fixing itself adopted: *"Every fix in this round has
collapsed a pair to a single producer rather than correcting the loser, because correcting the loser is
what buys the next round's recurrence."* The money engine currently carries eighteen un-collapsed pairs
of its most basic operation, and **seven other files already import the owner**
(`computeInterestSaved`, `getDebtsWithDisplayBalances`, `reconcileGoalAmount`,
`selectActiveRecommendedActions`, `testComputeInterestSaved`, and two legacy-tree consumers), so the
codebase disagrees with itself about which is the convention.

**Count is a LOWER BOUND** and I want to say how it could stop being one: I matched the literal string
`function roundMoney`. A copy named `round2`, `money`, or written inline as an arrow constant would not
appear — and `computeDrift.ts:163` **is** exactly that (`function round2`), which is a nineteenth copy I
found only by reading the file. **What would make this checkable is a lint over the expression
`Math.round(… * 100) / 100` rather than over the identifier**, with `utils/money.ts` as the sole
exemption — the same shape `lint:money` already has for formatters and `check-local-dates.ts` has for
`toISOString`. Neither exists for rounding.

**Remedy — NOT VERIFIED.** Collapsing eighteen call sites is mechanical and I did not do it; per the
repo's own note, a mechanical script once deleted 489 lines while reporting success. The cheaper first
move is the lint, so the count cannot grow while the collapse is scheduled.

---

### `A5-5` · **blocker** · an "Every paycheck" bill is charged THREE times to a monthly-paid user, and the app declares a shortfall that does not exist

**Origin:** `packages/core/engine/allocatePaycheck.ts` — **neighbour** (it did not change this window; its
consumers did).
**File:** `packages/core/engine/allocatePaycheck.ts:227-250` (`occurrencesThisCycle`), line **240**:

```ts
const stepDays = recurrence === "weekly" ? 7 : 14; // biweekly and per-paycheck both step a fortnight
```

`per-paycheck` is not a fortnight. It is **one occurrence per pay cycle**, whatever the cycle is — that
is what the label says (`apps/rn/src/store/obligationForm.ts:27` renders it *"Every paycheck"*) and what
the rest of the repo already implements: `rolloverPayCycle.ts:64-66` re-anchors a `per-paycheck` due date
to `nextPlanDate` on every rollover (exactly one per cycle), and `apps/rn/src/utils/format.ts:34` prices
it as `amount * cyclesPerMonth` — **the user's real cadence, read from the store.** `allocatePaycheck` is
the only producer that hardcodes a fortnight, and it is the one that decides what the paycheck can cover.

**User-facing consequence.** A monthly-paid user with one $200 bill set to "Every paycheck":

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe10.ts        EXIT=0
=== SHIPPED · monthly payer · $500 paycheck · one $200 "Every paycheck" bill
  shortfall = 100
  unfunded  = [{"label":"Finish Groceries","amount":100,"category":"expense","targetId":"e1__occ2"}]
  expense   Pay Groceries $200
  expense   Pay Groceries $200
  expense   Pay Groceries (partial) $100
=== CORRECTED
  shortfall = 0
  unfunded  = []
  expense          Pay Groceries $200
  cushion_buffer   Keep cash buffer $50
  true_leftover    Leftover cash $250
```

**The app tells a person who has $250 spare that they are $100 short**, lists their grocery bill three
times, and names a phantom obligation `e1__occ2` that does not exist in their store. On a healthier
paycheck the same expansion silently eats the cushion instead:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe9.ts        EXIT=0
monthly payer · $4,000 paycheck · the same bill, MARKED PAID
  SHIPPED    true_leftover  "Leftover cash $3350"
  CORRECTED  true_leftover  "Leftover cash $3750"
```

$400 of the user's money missing from the readout, with no row anywhere accounting for it — the paid
flag is spread onto all three occurrences, so all three are deducted from `remaining`.

**Scale by cadence, measured** (`probe8.ts`, one $200 "Every paycheck" bill, truth is 1 row / $200):

```
payCycle=weekly       window 2026-08-03->2026-08-10   rows=1  reserved=$200   ✅
payCycle=biweekly     window 2026-08-03->2026-08-17   rows=1  reserved=$200   ✅
payCycle=semimonthly  window 2026-08-01->2026-08-16   rows=2  reserved=$400   ⛔ 2×
payCycle=monthly      window 2026-08-01->2026-09-01   rows=3  reserved=$600   ⛔ 3×
```

Weekly and biweekly are correct **by accident** — a 7- or 14-day window admits exactly one fortnight
step. Every longer pay cycle is wrong, and by more the longer it is.

**Reachability, checked rather than assumed.** `apps/rn/src/components/entities/ExpenseSheet.tsx:21`
offers `per-paycheck` in the bill recurrence picker; `obligationForm.ts:27` labels it *"Every paycheck"*.
Semimonthly and monthly are both offered pay cadences (`getNextPaycheckDate.ts:3`). No import, no
migration, no unusual data — one picker choice by a user who is paid monthly.

**Mechanism, stated as a hypothesis.** This is the **same defect as `A5-1` in a second file**: a cadence
whose period is a *user variable* was given a *constant* standing in for the common case, and the
comment on the line records the assumption rather than flagging it (*"biweekly and per-paycheck both
step a fortnight"*). ⛔ The `[A2]` docblock four lines above states the rule this violates — *"Counted by
stepping the real calendar rather than dividing days by a nominal period"* — and `per-paycheck` is
precisely the cadence with no calendar period to step. `nextPaycheckDate` is already a parameter of this
function, so the correct answer was in scope on the same line.

**And nothing in the tree has an opinion about it.** I ran the correction as an experiment before
writing it up, to find out whether the current behaviour is *deliberate and asserted* or merely
unexamined:

```
PLANT-R3  allocatePaycheck.ts:230-240 · add `per-paycheck` to the return-1 list
PLANT-R3 reg=0 app=0 scenarios=0 restore=OK gitdirty=0
```

All three suites green **with the behaviour changed**, so the fortnight step is asserted nowhere. It is
not a tested trade-off; it is a blind spot in both directions.

**Remedy — VERIFIED at the engine level, NOT verified in the app.** Add `per-paycheck` to the
"cadences at or above the cycle length can only land once" branch at `allocatePaycheck.ts:230-236`:

```ts
recurrence === "one-time" || recurrence === "monthly" ||
recurrence === "quarterly" || recurrence === "annually" ||
recurrence === "per-paycheck"
```

Measured with it applied: all four cadences return one row at $200 (probe8), the false shortfall becomes
$0 (probe10), the missing $400 comes back (probe9), the **control holds** — a genuinely weekly bill for a
monthly payer still expands to 5 rows — and `test:regression`, `test:app` and `test:scenarios` are all
green (`R3`, above). ⚠️ **What I did NOT verify:** the RN e2e / screenshot suites (I did not run the web
export — see "not reached"), and whether any screen renders a count of occurrences that a reader has
learned to expect at the inflated number. ⚠️ Note also that the remedy is **correct only because the
window is one pay cycle**; if `occurrencesThisCycle` is ever reused over a multi-cycle window the
`return 1` becomes wrong for `per-paycheck` exactly as it already would for `monthly`.

⚠️ **What would make this checkable rather than enumerable.** `per-paycheck` now has **four** producers
of "how often does this charge": `allocatePaycheck.ts:240` (fortnight), `bnplPayoffPace.ts:26`
(fortnight), `rolloverPayCycle.ts:64` (once per cycle) and `format.ts:34` (once per cycle). Two say one
thing and two say the other. A single exported `occurrencesPerCycle(recurrence, payCycle)` — with the
year-of-cycles identity from `A5-1` as its test — is what collapses the four; naming `per-paycheck` at
each site is what leaves the fifth for the next pass.

---

### `A5-6` · **major** · the forecast's cross-cadence BNPL scaling (`AS.3`) is asserted by nothing, and its removal changes what the user is shown

**Origin:** `packages/core/timeline/buildMultiCycleTimeline.ts` — **neighbour**.
**File:** `packages/core/timeline/buildMultiCycleTimeline.ts:197`.

**What the line claims.** Its own comment (`:193-196`, and again at `:281-283`): *"reflect the FULL
in-window BNPL outflow (a biweekly BNPL charges ~2× before a monthly paycheck) for this cycle's
allocation + items"* … *"else the forecast keeps charging a biweekly BNPL long after its balance should
have cleared (after-scan AS.3)."* A named, previously-fixed defect.

**The measurement.** Deleting the scaling from the **projected** cycles is invisible to every suite:

```
PLANT-P46  buildMultiCycleTimeline.ts:197
           `scaleBnplMinimumsForWindow(projDebts, cycleWindowStart, projNextDate)` -> `projDebts`
PLANT-P46 reg=0 app=0 scenarios=0 restore=OK gitdirty=0
```

…while changing the numbers a user reads. A biweekly Klarna ($100 × 24) under a monthly $1,600 paycheck
with $1,200 rent:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe15.ts        EXIT=0
=== SHIPPED
  2026-09-01 proj=true net=200 ending=150 items=[… | Pay minimum on Klarna $200 | Cushion $50]
  2026-10-01 proj=true net=200 ending=150 items=[… | Pay minimum on Klarna $200 | Cushion $50]
=== AS.3 UN-FIXED
  2026-09-01 proj=true net=300 ending=250 items=[… | Pay minimum on Klarna $100 | Cushion $50]
  2026-10-01 proj=true net=300 ending=250 items=[… | Pay minimum on Klarna $100 | Cushion $50]
```

Every projected cycle's ending balance would read **$100 too high** — cash the user has already
committed to Klarna, shown to them as cushion, on the screen whose job is to say what is coming.

**⚠️ Cycle 0's scaling (`:137`) is a SEPARATE call and I did not plant it.** It is a different line with
its own after-scan note (*"re-scan Finding 1"*). Treat the coverage claim here as being about `:197`
only — the count is a lower bound at one.

**Mechanism, stated as a hypothesis.** The AS.3 fix landed as three coordinated call sites (`:137`,
`:197`, `:282`) inside a 341-line builder that has **no direct unit test of its own** in the projected
path — `testMultiCycleTimelineRegression.ts` reconciles cycle-0 items against the single-cycle builder
and checks structural invariants (`endingBalance` equals the last item's `runningCash`, non-negativity),
but no assertion in it uses a BNPL whose cadence differs from the pay cycle. The fix was verified by
its author against the case, and the case never became a row.

⛔ **How I nearly filed this wrong, recorded because it is the reading-rule-3 trap.** My first two
fixtures gave *identical* output on both sides and I was about to write "the line may be dead." They
used a $3,000 paycheck — which lets the snowball rung clear the whole BNPL in cycle 0, so no projected
cycle ever held a BNPL to scale. **The fixture picked the member of its class where the code path does
not exist at all.** Only a paycheck tight enough for the debt to survive the projection reaches the
line. Whoever writes the guard needs that constraint stated, or they will write the same green test.

**Remedy — NOT VERIFIED (I did not write it).** The shape is a row in
`testMultiCycleTimelineRegression.ts` using the probe15 fixture above and asserting the projected
cycle's Klarna item is `$200`, **with a control** that a cadence-aligned BNPL (biweekly plan, biweekly
payer) is *not* scaled — without the control, a "scale everything by the window" regression passes.
I have not written or run it.

---

### `A5-7` · **minor** · the forecast ledger shows `$0` where the user is $800 in the hole, and the assertion over it cannot fail

**Origin:** `packages/core/timeline/buildTimelineItems.ts` — **neighbour**.
**File:** `packages/core/timeline/buildTimelineItems.ts:160`; the assertion at
`packages/core/testing/testFullAppRegression.ts:273-278` (and again at `:725-728`).

**Measured.** `runningCash: Math.max(0, runningCash)`:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx zz-audit/probe11.ts        EXIT=0
allocatePaycheck shortfall = 800          ← the engine knows
  Paycheck Received   amount=$900    REPORTED runningCash=$900   TRUE=$900
  Pay Rent            amount=$1200   REPORTED runningCash=$0     TRUE=$-300
  Pay Power           amount=$300    REPORTED runningCash=$0     TRUE=$-600
  Pay Phone           amount=$200    REPORTED runningCash=$0     TRUE=$-800
```

`apps/rn/src/components/progress/TimelineLedger.tsx:124` renders that field directly, and `:111` puts it
in the accessibility label — so a screen-reader user hears *"Pay Phone, −$200, balance $0"* on the row
where they are $800 short. Three identical red `$0`s stand in for −$300 / −$600 / −$800.

**⚠️ This is deliberate and asserted — which is why it is filed as a decision to re-open, not a bug.**
`testMultiCycleTimelineRegression.ts:398` states it outright: *"Regardless of how tight the budget is,
`runningCash` must be clamped at 0, never negative."* Removing the clamp reds that row (`R6`: `reg=1`,
*"FAIL [Running cash never negative]: went negative at 'Pay Rent': -700"*). So the clamp is a choice
someone made and defended.

⛔ **But it contradicts a rule this codebase states for itself, in the money file with the widest reach.**
`packages/core/utils/formatCurrency.ts:21-23`: *"**A negative clamp is NOT a formatting rule.** Several
of those locals did `Math.max(0, n)`, which silently turns −$45 into $0 — the exact 'hide money'
behaviour the comment below refuses. If a value cannot legitimately go negative, clamp it at the
SELECTOR; **if it can, show it**."* Here it demonstrably can: `allocatePaycheck` returns
`shortfall = 800` from the same inputs, and `buildMultiCycleTimeline`'s own `carriedBalance` is kept
**un-clamped** on purpose for exactly this reason (`:38-42`: *"so a genuine future crunch … is visible
instead of erased by the `endingBalance` max(0,·) clamp"*). Two fields in adjacent modules, one showing
the hole and one hiding it.

**And the second-order half.** `testFullAppRegression.ts:273` frames its loop as a property of the
money — *"Running cash should only ever be >= 0 throughout"* — over a value that cannot be negative by
construction. It reads as a solvency check across the whole timeline and is a restatement of line 160.
The sibling at `testMultiCycleTimelineRegression.ts:398` says *"must be clamped at 0"*, which is
honest. **The same check, described truthfully in one file and as a money property in the other.**

**⚠️ I would file this as a blocker if the clamp were unintentional.** It is not, so the call belongs to
whoever owns the decision: the number shown is false, the app knows the true one, and the app's own
doctrine says show it.

**Remedy — NOT VERIFIED, and deliberately not proposed as code.** Removing the clamp reds two registered
assertions and changes a rendered field in two components (`TimelineLedger.tsx`, `TimelineSection.tsx`),
including a `low` colour threshold at `< 100` that a negative would also trip. That is a product
decision plus a display pass, not a one-line fix, and a remedy written from here would be the shape
pass 4 measured five times.

---

## Summary — by severity AND by origin

| id | sev | subject | file | origin |
|---|---|---|---|---|
| `A5-1` | **blocker** | a `per-paycheck` BNPL's debt-free date is wrong by the pay cadence (2.17× for a monthly payer) | `packages/core/debt/bnplPayoffPace.ts:23-30` | neighbour |
| `A5-5` | **blocker** | an "Every paycheck" bill is charged 3× to a monthly payer; a $100 shortfall is declared over $250 of spare cash | `packages/core/engine/allocatePaycheck.ts:240` | neighbour |
| `A5-2` | major | `formatCurrency`'s `Number.isFinite` guard survives its own un-fix in all four gates that run | `packages/core/utils/formatCurrency.ts:43` | neighbour |
| `A5-3` | major | the scanner's `0–100` APR bound cannot fire; `"129.99% APR"` is read as `29.99` | `packages/core/scan/parseStatementText.ts:108-113` | neighbour |
| `A5-6` | major | the forecast's cross-cadence BNPL scaling (`AS.3`) is asserted by nothing; its removal moves every projected cycle's cushion by $100 | `packages/core/timeline/buildMultiCycleTimeline.ts:197` | neighbour |
| `A5-4` | minor | eighteen private, currently-identical copies of `roundMoney` beside the exported owner | `packages/core/utils/money.ts` + 18 sites | neighbour · fix-churn |
| `A5-7` | minor | the ledger shows `$0` where the user is $800 short, and the assertion over it cannot fail | `packages/core/timeline/buildTimelineItems.ts:160` | neighbour |

**By severity:** 2 blocker · 3 major · 2 minor.
**By origin:** **neighbour 7** · fix-churn 1 (shared with `A5-4`) · first-look **0** · s0-first-look **0**.

⛔ **Every finding in this lane is `neighbour`, so [D69] exempts none of them from the convergence
count.** That is itself the round's headline for lane A: the brief predicted the new origins would
dominate, and in the money engine it is specifically the **did-not-change-but-shares-a-consumer** files
that carried everything. `A5-1` and `A5-5` are the *same defect in two files* — a cadence whose period is
a user variable, replaced by a biweekly constant — found from opposite ends of the import graph, and
neither file moved.

⚠️ **Both counts are LOWER BOUNDS.** I enumerated by planting, and a plant only measures what I thought
to mutate. What would make lane A's coverage checkable rather than countable is the year-of-cycles
payment identity described under `A5-1`: it is one test over 7 × 4 cadence pairs and it would have found
`A5-1` and `A5-5` without either being named.

### The plant ledger

**39 plants logged.** 33 red (listed above) · **4 survived** · 1 no-op (`P9`) · 1 discarded as not a
defect (`P27`).

| survived | subject | status |
|---|---|---|
| `P7` | `formatCurrency`'s non-finite guard | → `A5-2` |
| `P31` | the scanner's APR upper bound | → `A5-3` |
| `P46` | `AS.3`'s projected-cycle BNPL scaling | → `A5-6` |
| `P8` | `plural`'s `n === 1` → `n === 0` | ⚠️ **NOT a finding — unmeasured.** Its registered guard is `S1P4-C4-8-SINGULAR`, run by `test:e2e:trust-claims`, which I did not run. Green across the three suites I *could* run is the expected result and proves nothing either way. |

**A 33-of-39 red rate is high**, and it is the honest headline about `packages/core`: the month-stepped
payoff engine, the rollover, the guardian composition, the milestone/streak/drift math and the
obligation classifiers are all genuinely pinned, several by assertions that name the original defect in
their failure message. `A-F1`, `A-F2` and `A-F4` are all really closed, verified past their registry
tokens. **The gaps are not in the arithmetic — they are at the two edges: what a cadence means, and what
happens to a guard nobody wrote a row for.**

---

## ⚠️ What I did NOT reach, named rather than implied

1. ⛔ **I ran ZERO Playwright specs.** All **14 e2e specs and 9 `.shot.ts` files** in my manifest —
   `first-look` and `s0-first-look`, never swept by any pass — were **read, not run, and never
   planted against.** `apps/rn/playwright.config.ts:44` builds `dist/` with `expo export --clear`
   (its own `timeout: 300_000`) and then holds a `serve` process; on this box that is the OOM risk the
   protocol names and a server I would have to guarantee killing. **This is the largest hole in my pass,
   and it is exactly where reading is weakest:** this project's record is that reading has never found
   the vacuous-check class and planting has found it every time. What I did instead was grep every
   `toHaveCount(0)` in the lane and read the ones with no positive anchor — `analytics-optout.spec.ts:33`,
   `greeting.spec.ts:72` and `progress-hero-journey.spec.ts:154,199` all carry an explicit
   positive-first anchor with a comment saying why. **That is evidence the authors know the rule, not
   evidence the specs are sound.**
2. **Cycle 0's BNPL scaling** (`buildMultiCycleTimeline.ts:137`) — a separate call from `A5-6`'s, not
   planted. `A5-6`'s coverage claim covers `:197` only.
3. **Read but never planted:** `copy/vocabulary.ts`, `storage/debtPlannerStorage.ts`,
   `debt/selectActiveRecommendedActions.ts`, `debt/bnplSchedule.ts`, `testing/seedPlannerState.ts`,
   `testing/simSmokeSeed.ts`.
4. **The `packages/core/**/test*.ts` files were exercised, not audited.** Every red above came out of
   them, so they are alive; I did not read each one asking *"which member of its class did this fixture
   pick"*. `testEngineFuzz.ts` I did read in full — it is honestly scoped (its shape-only asserts are
   backed by concrete-value rows at `:57-61`, `:76-81`, `:95-100`, and `P18` reds on line 81).
5. **`npm run typecheck:core` / `typecheck:tests` / `typecheck:scripts` were never run.** I ran only
   `typecheck:rn`, for the `A-F1` re-verification. No monorepo typecheck was run, per the protocol.
6. **No OOM occurred**, so there is no OOM finding. Every node/tsx invocation carried
   `NODE_OPTIONS=--max-old-space-size=1536`. No server was started, so none was left running.

---

## Proof the main tree is untouched

Everything above ran in a detached worktree at `C:\Users\Jason\audit-p5-a` (removed at the end of the
pass). The only file I wrote under `C:\Users\Jason\debt-app-v1` is this one.

```
$ git -C /c/Users/Jason/debt-app-v1 status --porcelain
?? docs/audits/2026-08-29-s1-money-pass5/A-engine.md
?? docs/audits/2026-08-29-s1-money-pass5/DISPATCH.md
```

⚠️ **`DISPATCH.md` is not mine.** It was already untracked in the main tree when I started — the
opening `git status --porcelain` (before my first write) returned it. Recorded so nobody reads it as a
stray from this lane.

### Final tree state, taken after the worktree was removed

The block above was captured mid-pass. Here is the closing state, and it has more rows in it because
**lanes B, C and D are writing their own findings files into the same directory concurrently**:

```
$ git -C /c/Users/Jason/debt-app-v1 worktree remove --force /c/Users/Jason/audit-p5-a
REMOVE_EXIT=0
$ git -C /c/Users/Jason/debt-app-v1 status --porcelain
 M docs/DEBT_ELEVATION_PLAN.md
?? docs/audits/2026-08-29-s1-money-pass5/A-engine.md
?? docs/audits/2026-08-29-s1-money-pass5/B-store-storage.md
?? docs/audits/2026-08-29-s1-money-pass5/C-screens.md
?? docs/audits/2026-08-29-s1-money-pass5/D-instruments.md
?? docs/audits/2026-08-29-s1-money-pass5/DISPATCH.md
STATUS_EXIT=0
$ git -C /c/Users/Jason/debt-app-v1 log --oneline -1
65566a09 Pass 5 is routed and briefed, and it stops there for a fresh session
```

⛔ **Of those six rows, exactly one is mine: `A-engine.md`.** `DISPATCH.md` and
`docs/DEBT_ELEVATION_PLAN.md` were not written by this lane, and `B-`/`C-`/`D-` belong to the other
three auditors. **No source file is modified, nothing is staged, nothing is committed, HEAD is
unmoved.** Every plant restored (verified by `diff` against a post-mutation copy, then
`git status --porcelain <file>`, on all 39 — `restore=OK gitdirty=0` on every line).

⚠️ **Worktree teardown, recorded because it is a foot-gun on Windows.** I removed the three `node_modules`
/ `core` **junctions with `rmdir` BEFORE** `git worktree remove --force`, and verified the targets
survived (`739` entries in the main `node_modules`, `607` in `apps/rn/node_modules`, `apps/rn/core`
still present). A recursive delete that follows a junction would have taken the main checkout's
dependencies with it. The next pass's recipe should say so.
