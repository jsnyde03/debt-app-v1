# AUDITOR A — pass 3 · THE MONEY ENGINE (`packages/core`)

**Pin:** `96d1f11` · branch `v1.7-dev` · ships as `2.0.0`.
**Route:** `ROUTING-A.txt` — 75 files · 7,177 lines.
**Read-only.** No source file was created, edited or deleted; every probe was written to the system
scratchpad, never into the repo.

**STATUS: COMPLETE.** **3 blockers · 1 major · 1 minor.** Every number below was **printed** from a
running probe or a gate; nothing is described from a reading without saying so.

| severity | id | one line |
|---|---|---|
| **blocker** | **A1** | `cannotAmortize` re-checks against the SHRINKING active-minimum sum, not the constant budget the loop spends — an ordinary car-loan-plus-credit-card plan reports **"Unable to estimate"** (hero: `—`) while the chart under it clears in 30 months. |
| **blocker** | **A2** | `buildCycleSnapshot` sums the UNSCALED BNPL minimum — History prints *"$100.00 paid"* for a cycle in which the plan asked for $200 and the balance fell $200. |
| **blocker** | **A4** | `bnplMonthlyEquivalentMinimum` is gated on `type === 'bnpl'` while every per-cycle seam is gated on `isInstallmentNative` — a CSV-imported biweekly BNPL is charted at 6 months and paid down at 12. |
| **major** | **A3** | `test:gate-plants`' `lint:secrets` scenario plants an UNTRACKED file, so the modified-tracked half added in this fix range stays green when un-fixed. Measured 2×2 + control. |
| **minor** | **A5** | `getDebtsWithDisplayBalances.ts:26` uses `||` where the other 11 pair-readers use `??`; v1.6-web only, and `bulkMarkRequired.ts`'s docblock says otherwise. |

⚠️ **A1, A2 and A4 are all in `packages/core/{debt,history}` — ground the coverage instrument itself
marks `⛔ never`.** `docs/audits/2026-08-26-s1-money/S1-SURFACE-INVENTORY.md:372-455` classifies every one
of these files that way, and the only mentions anywhere in pass 1's or pass 2's four reports are two
passing references in pass 1's `D-plan-cards-guardian.md` (`:274` cites `computeMilestones.ts:2`'s
threshold constant; `:318` says `buildRecoveryPlan.ts` is *"not on"* that route). ⚡ **The brief's one
number predicted this for the fourth time.**

⚠️ **All three blockers survive the full suite.** `npm run test:regression` and `npm run test:app` are
both green at this pin with every one of them reproduced live in the same tree — see §4 item 12.

---

## 0. What this route actually is, measured before reading any of it

⚠️ **Not all 75 files are on the shipping surface.** `2.0.0` ships `apps/rn`; the repo root still carries
the v1.6 web app (`app/`, `lib/`, `components/`). Every finding below states which app can reach it,
because that is the difference between a `blocker` and a note.

Importer census — every one of the 75 route files, every importer, no `head`:

```
node <scratch>/reach.mjs      # regex over apps/ packages/ app/ lib/ components/ scripts/ tests/
files with zero importers: 0 of 75
```

**Reachable from `apps/rn` (the shipping app) — the money the 2.0.0 user reads:**
`waterFill` · `detectCrunches` *(via waterFill)* · `applyPaydayCapture` · `applyRolloverPayment` ·
`bnplInstallment` · `bnplPayoffPace` · `bnplProviders` · `bnplSchedule` · `buildAmortizationSchedule` ·
`buildPaydayCaptureItems` · `buildPayoffTrajectory` · `bulkMarkRequired` · `calculateMonthlyInterest` ·
`computeDrift` · `computeInterestSaved` · `computeMilestones` · `computeStreak` ·
`deriveRequiredActionView` · `extraPaymentPlan` · `getDebtsWithDisplayBalances` ·
`originalBalanceHighWater` · `projectCurrentBalance` · `projectDebtPayoff` · `reconcileAutopay` ·
`reconcileGoalAmount` *(via applyPaydayCapture)* · `selectActiveRecommendedActions` ·
`shouldPromptPaydayCapture` · `mergeCompletedAction` *(via applyPaydayCapture)* ·
`applyDebtPaymentProjection` *(via projectCurrentBalance / buildAmortizationSchedule)* ·
`buildCycleSnapshot` · `suggestLean` · `effectiveObligationAmount` · `buildRecoveryPlan` ·
`buildTimelineItems` · `types/livingExpense` · `types/recurrence`.

**NOT reachable from `apps/rn` — v1.6-web and/or core-test only** *(printed, not assumed)*:

| file | only importers |
|---|---|
| `constants/livingExpensePresets.ts` | `app/page.tsx`, `lib/hooks/useLivingExpenses.ts` |
| `constants/requiredExpensePresets.ts` | `components/RequiredExpenses/AddExpenseModal.tsx` |
| `forecast/projectForecast.ts` | `components/SnowballSection.tsx` + `packages/core/testing/*` |
| `forecast/getForecastStatus.ts`, `forecast/types.ts` | `forecast/projectForecast.ts` + core tests |
| `insights/buildSmartInsights.ts` | `components/SnowballSection.tsx` + core tests |
| `history/selectVisibleHistory.ts` | `lib/hooks/usePayCycleHistory.ts` + core tests |
| `debt/parseDebtFormValues.ts` | `components/DebtsSection.tsx` |
| `debt/computeCycleDelta.ts` | `components/ResultsSection.tsx` |

⚠️ **`packages/core/forecast/` is NOT the forecast the 2.0.0 user sees.** That one is
`apps/rn/src/store/forecastCycles.ts` (auditor D2-1's fix site), which imports nothing from
`packages/core/forecast`. Anyone reading the route name alone would get this backwards.

---


## 1. FINDINGS

### A1 — `blocker` · `packages/core/debt/projectDebtPayoff.ts:75-91` (`cannotAmortize`)

> **A user with a car loan and a credit card is told the app cannot estimate a debt-free date at all —
> the Progress hero prints `—` — while the trajectory chart directly beneath it draws that same plan
> reaching zero in 30 months.**

**The defect.** `cannotAmortize` is re-evaluated at the top of **every** month of the projection loop, and
it sums the minimums of only the debts **still live at that moment** (`:79` `debts.filter(d => d.balance > 0)`,
`:87`). But the loop does not spend that number — it spends `monthlyBudget` (`:131-135`), a **constant**
that keeps a paid-off debt's freed minimum in the pool, which is the defining mechanic the file's own
comment at `:123-128` describes. So the instant the first debt clears, the guard starts comparing the
remaining debt's interest against a payment total that no longer includes the money actually being paid,
and bails out of a plan that amortizes fine.

⚡ **The sibling simulation in the same directory already has the correct form.**
`buildPayoffTrajectory.ts:91` is `if (monthlyBudget > 0 && totalInterest >= monthlyBudget) break;` — the
**constant** budget. Two producers of one fact, in one directory, with two different guards.

**Measured — the same $550/month, only the LABEL on $500 of it differs:**

```
npx tsx --tsconfig tsconfig.json <scratch>/p6.ts
$500 labelled MINIMUM  -> {"date":"Unable to estimate","months":5,"interest":0}
$500 labelled EXTRA    -> {"date":"July 2028","months":30,"interest":4019.18}
```

*(debts: `Car loan` $2,000 @ 5%, `Visa` $10,000 @ 25%; in the first the car's $500 is its `minimumPayment`,
in the second it is `monthlyExtraPayment` with the car's minimum at `0`. The payment schedule is identical.)*

**And an independent hand-simulation of the loop's own payment rules with NO bail-out agrees with the
second answer, not the first:**

```
npx tsx --tsconfig tsconfig.json <scratch>/p2.ts
== projectDebtPayoff, snowball, extra 0
 "monthsToDebtFree": 5, "estimatedDebtFreeDate": "Unable to estimate", "totalInterestPaid": 0
== the same plan, actually simulated (no mid-loop bail-out)
{"months":30,"interestTotal":4019.18,"remaining":[{"b":0,...},{"b":0,...}]}
```

**Measured at the APP level, through the real selectors on a real `DebtStore`** *(`createDefaultStore()`,
`onboardingComplete`, the two debts above, four paycheck sizes)*:

```
cd apps/rn && npx tsx --tsconfig tsconfig.json <scratch>/p5.ts
paycheck=$275/cycle   monthlyExtra=0.00
   HERO progress-hero-date = "—"   | plan curve reaches ZERO at month 30 | interestSaved=none | minimums curve zero at 30
paycheck=$300/cycle   monthlyExtra=0.00
   HERO progress-hero-date = "—"   | plan curve reaches ZERO at month 30 | interestSaved=none | minimums curve zero at 30
paycheck=$400/cycle   monthlyExtra=0.00
   HERO progress-hero-date = "—"   | plan curve reaches ZERO at month 30 | interestSaved=none | minimums curve zero at 30
paycheck=$1600/cycle  monthlyExtra=2166.67
   HERO progress-hero-date = "January 2027" | plan curve zero at month 5 | interestSaved=payoff-enabling | minimums curve zero at 30
```

`progress.tsx:300` renders `{view.debtFreeDate ?? '—'}` into `testID="progress-hero-date"`, and
`progress.tsx:262` drops the *"debt-free projected …"* clause out of the hero's accessibility label
entirely. The chart on the same screen is `view.snowball`, which reaches zero at month 30.

**Second consequence of the same line — a false sentence, not just a withheld one.** At
`paycheck=$1600` the app has `interestSaved.kind === 'payoff-enabling'`, whose contract
(`computeInterestSaved.ts:9-13`) is *"minimum payments alone would **NEVER** clear the debt."* They clear
it in 30 months — the app's own `minimums` curve in the same `PayoffView` object says so.
`TrajectoryChart.tsx:305-308` then prints the legend row **"Minimum payments · Not with minimums"**
beside a ghost curve the user can watch touch zero, and `:552-554` suppresses the `deltaSuffix`, so the
genuine claim — 30 months → 5 months — is never made at all.

```
cd apps/rn && npx tsx --tsconfig tsconfig.json <scratch>/p4.ts
interestSaved         = {"kind":"payoff-enabling","debtFreeDate":"January 2027"}
minimums ghost curve  = 31 points; reaches ZERO at month 30 ; last = {"month":30,"balance":0}
legend "Minimum payments" row label = "Not with minimums"
```

**⛔ Reading rule 2 — which member of the class did the tests pick?** *Every* fixture that exercises this
branch anywhere in the repo is **single-debt**, and a single-debt plan is precisely the one shape where
the shrinking active-minimum sum and the constant budget are equal, because nothing is ever freed.
The whole result, counted, not `head`-ed — **5 of 5**:

| fixture | debts |
|---|---|
| `packages/core/debt/testDebtProjection.ts:166-189` "Impossible Debt" | **1** |
| `packages/core/testing/testDebtMathRegression.ts:182-195` `testProjectDebtPayoff_cannotAmortize` | **1** |
| `packages/core/debt/testComputeInterestSaved.ts:66-79` "payoff-enabling" | **1** |
| `packages/core/testing/testAbuseScenarios.ts:259-282` "Toxic Debt" | **1** |
| `packages/core/testing/testStressScenarios.ts:214-237` "Toxic Card" | **1** |

**Remedy.** In `cannotAmortize`, compare the live interest against the **constant** budget the loop
actually spends, i.e. the same `monthlyBudget` computed at `:131-135`, and carry
`buildPayoffTrajectory.ts:91`'s `monthlyBudget > 0` half of the condition with it — a `0 >= 0` guard is
what broke that curve in round 3 (its comment at `:86-89`). ⚠️ Do **not** just pass `monthlyBudget` in
blindly: `monthlyBudget` excludes one-time BNPL lumps' minimums while today's `monthlyPaymentTotal`
includes them, so the BNPL-lump fixtures need re-measuring against the new condition, not re-reading.
And add a **two-debt** fixture to each of the five tables above — one where a debt clears and frees a
minimum — because none of them can currently fail.

**⛔ Direction of the justification, and why the opposite does not apply.** The claim is *"the date is
wrong and the chart is right"*, not merely *"they disagree"*. The chart is right because the payment
schedule it simulates is the one `projectDebtPayoff`'s **own loop body** executes — freed minimums are
really applied at `:191-193` — and an independent third simulation written from the loop's rules with no
guard at all lands on the identical `30 months / $4,019.18`. The opposite remedy (make the chart bail out
too) would have to assert that a plan paying $550/month against $242/month of interest does not amortize,
which is arithmetically false and which `projectDebtPayoff` itself contradicts the moment the same $500
is relabelled `monthlyExtraPayment`.

---

### A1 — addendum · the sharpest instance of reading rule 2 in the repo

**`packages/core/debt/testFreedMinimumRoll.ts` is the test written for the exact mechanic A1 breaks** —
the freed minimum rolling onto the next target — and it is the one file that asserts
`projectDebtPayoff` and `buildPayoffTrajectory` agree. Its header comment (`:12-15`) says:

> *"Two 0%-APR debts, no extra. … **0% APR keeps the arithmetic exact.**"*

⚡ **At 0% APR, `monthlyInterestTotal` is 0 and `cannotAmortize` returns `0 >= 100` — false, always.** The
guard the finding is about is unreachable in the fixture chosen to prove the mechanic it corrupts, and the
reason it was chosen is stated in the comment.

**Measured — the SAME fixture shape, one field changed (`apr: 0 → 25` on the surviving debt), both of the
file's own assertions re-run:**

```
npx tsx --tsconfig tsconfig.json <scratch>/p10.ts
projectDebtPayoff      -> {"date":"Unable to estimate","months":1,"order":["A"]}
buildPayoffTrajectory  -> last point {"month":60,"balance":0}  reaches zero: true
```

The file's `"trajectory reaches zero"` assertion is **true** and the date says **"Unable to estimate"** —
the two producers this file exists to reconcile, contradicting each other, one field away from its own
fixture. ⛔ **Reading rule 6 — which assertion carries it, and does an earlier one fire first?**
Neither: `:37`/`:38` (trajectory) and `:28` (the date) are independent assertions on independent values,
and at 0% APR all four pass. Nothing in the file reds before the contradiction, because at its chosen
input there is no contradiction.

⚠️ **And the whole suite is green at this pin, with the defect present:**

```
npm run test:regression
✅ All regression tests passed.
```

---

### A2 — `blocker` · `packages/core/history/buildCycleSnapshot.ts:36-38`

> **A user whose plan told them to pay $200 to their Klarna sofa this cycle, and whose balance dropped by
> exactly $200, is told on the History screen that they paid $100.**

**The defect.** `paidMinimums` sums `Math.min(debt.minimumPayment, debt.balance)` — the **stored
per-installment** amount. Every other seam in the cycle uses the **window-scaled** minimum: the allocator
(`apps/rn/src/store/selectors.ts:65` `scaleBnplMinimumsForWindow`), the forecast
(`buildMultiCycleTimeline.ts:137,197`), the recovery plan (`recoverySelectors.ts:50`) and the rollover's
own paydown (`applyRolloverPayment.ts:48-57` `effectiveMinimum`). §2.7.4's whole point is that a biweekly
BNPL under a monthly paycheck charges **twice** in one window. The snapshot is the one place that never
got the memo.

**Measured — one rollover, real store, real `applyRollover`:**

```
cd apps/rn && npx tsx --tsconfig tsconfig.json <scratch>/p7.ts
balance BEFORE rollover      = 400
balance AFTER  rollover      = 200
ACTUAL paid down this cycle  = 200
snapshot.totalPaidThisCycle  = 100    <- history.tsx:86 renders `${formatCurrency(...)} paid`
remainingPayments after      = 2
```

**And the plan really did ask for $200 — the allocation the user was shown all cycle:**

```
cd apps/rn && npx tsx --tsconfig tsconfig.json <scratch>/p8b.ts
 "allocations": [
  { "label": "Pay minimum on Klarna sofa", "amount": 200, "category": "minimum_debt", ... },
```

*(store: monthly paycheck `2026-01-01 → 2026-02-01`; one installment-native BNPL, `recurrence: 'biweekly'`,
`dueDate 2026-01-05`, `scheduledPaymentAmount 100`, `remainingPayments 4`, `balance 400`, marked paid.
Two installments — Jan 5 and Jan 19 — fall in the window.)*

**Where the wrong number is read.** Two places, both user-facing, counted whole:

| site | what it says |
|---|---|
| `apps/rn/src/app/history.tsx:86` | `{formatCurrency(row.totalPaidThisCycle)} paid` on every history row |
| `apps/rn/src/store/guardianSelectors.ts:88` | `totalToDebt` — sums `totalPaidThisCycle` across all history |

`components/HistorySection.tsx:123` is the v1.6-web third site; it is not on the 2.0.0 surface.

**Remedy.** `buildCycleSnapshot` must be given the same in-window effective minimum
`applyRolloverPayment` deducts. The cleanest form is to pass the pay-cycle window into
`buildCycleSnapshot` and reuse `bnplInstallmentsInWindow` — `payday.ts:86-92` already has
`store.paycheck.currentDate` and `nextPaycheckDate` in scope at that call, and passes both of them to
`applyRolloverPayment` at `:99-105`. ⚠️ It must be the same **capped** value
(`min(n × scheduled, balance)`), or a final short installment over-reports instead.

**⛔ Direction of the justification, and why the opposite does not apply.** The claim is that the
**snapshot** is wrong, not that the rollover over-pays. The rollover is right because the allocator
reserved $200 of this paycheck for this debt and the user was shown that row — printed above — so $200
genuinely left the account; a rollover that paid down only $100 would leave the balance $100 high forever,
which is the exact defect `applyRolloverPayment.ts:43-47` (after-scan AS.2) was written to close. Making
the *allocator* stop scaling instead would re-open §2.7.4 and under-reserve a real charge, which is the
dangerous direction. Only the summary line is wrong.

**⛔ Reading rule 2 — which member of the class did the tests pick?** `testBnplInstallment.ts:102-106`
tests the window scaling itself thoroughly (4 assertions, both directions). No test anywhere pairs it with
`buildCycleSnapshot`. The whole result of `grep -rn "buildCycleSnapshot" --include=*.ts --include=*.tsx
apps packages app lib components scripts` is **10 lines / 5 call sites**: `payday.ts:86` (the shipping
one), `app/page.tsx:907` (v1.6-web), and `testPayCycleHistoryRegression.ts:55,76,92` — and that regression
file's only debt fixture is `type: "debt", recurrence: "monthly"` (`:27-28`), i.e. the one member of the
class where scaled and unscaled agree. **Zero BNPL fixtures reach this function.**

---

### A3 — `major` · `scripts/test-gate-plants.ts:161-183` + `scripts/finding-guards.json` `S1P1-M10-AUTHORING`

> **The one instrument that proves `lint:secrets:authoring` still refuses a credential cannot see the
> half of it that catches a credential typed into a file that already exists — so that half can be
> deleted, and every gate in the repo stays green while an auditor's own DSN goes to a public repo.**

**Context.** Pass 2's auditor A filed `--working-tree` never reading a MODIFIED TRACKED file as §5 item 5
(`minor`). ⚡ **It was FIXED inside this fix range** — `check-committed-secrets.ts:230` now adds
`const modified = run(['diff', '-z', '--name-only', 'HEAD']);`, and its own docblock (`:214-217`) says the
tracked half is *"the more likely one, and it was the one missing."* **The fix works; the plant does not
cover it.**

**Measured — a self-contained probe repo (`<scratch>/probe-repo`), the shipped script copied in verbatim,
its real `secrets-exemptions.json` and that file's exemption targets, 2×2 plus a control:**

```
== 1. FIXED script · plant = MODIFIED TRACKED file (the [S1.9.5] class)
❌ committed secrets: 1 credential(s) are in a PUBLIC repository.
  [working tree] src/tracked.ts:2                                    exit=1
== 2. FIXED script · plant = UNTRACKED file (the harness's own scenario)
❌ committed secrets: 1 credential(s) are in a PUBLIC repository.
  [working tree] docs/audits/__gate_plant_report__.md:1              exit=1
== 3. UN-FIXED script · plant = MODIFIED TRACKED file
✅ committed secrets: none across 3 tracked files …                  exit=0   ⛔ THE FINDING
== 4. UN-FIXED script · plant = UNTRACKED file (the harness's own scenario)
❌ committed secrets: 1 credential(s) are in a PUBLIC repository.
  [working tree] docs/audits/__gate_plant_report__.md:1              exit=1
== 5. UN-FIXED script · no plant (control)
✅ committed secrets: none across 3 tracked files …                  exit=0
```

*The un-fix is the minimal restoration of the original defect —
`const modified = run([…]) → const modified: string[] = []` — applied by a script that **verifies the
needle is gone and the replacement is present** before the run (`<scratch>/unfix.mjs`; it printed
`needle still present after write? false` / `un-fix line present after write? true`).*

**Row 4 is the whole finding.** The harness's scenario is `at: 'docs/audits/__gate_plant_report__.md'`,
and its comment says *"UNTRACKED, which is the whole point"*. That was correct when the branch only read
`--others`. It now means the plant reds on the un-fixed script for the **wrong half**, so
`test:gate-plants` scores the scenario a pass either way and the tracked half is unpinned.
`finding-guards.json`'s `S1P1-M10-AUTHORING` token is `"if (WORKING_TREE) {"` — present in both
columns — and its own `what` field states *"the behavioural proof is the test:gate-plants scenario"*.
**Counted whole: `grep -n "S1.9.5\|modified-but-tracked\|MODIFIED-BUT-TRACKED\|--name-only"
scripts/finding-guards.json` returns ZERO lines across all 95 entries.** Nothing anywhere pins it.

**Remedy.** Add a second scenario to `B1_SCENARIOS` whose plant is an **edit to a tracked file**. The
harness already has the mechanism — `also` creates extra files, and the `expect` field would be
`working tree` with the tracked path. ⚠️ The plant body must stay assembled at runtime for the reason
`:166-174` gives, and the file must be one the committed scan already covers so the control is honest.
Then give it its own `finding-guards.json` entry whose token is the line that would have to
change — `run(['diff', '-z', '--name-only', 'HEAD'])` — not `if (WORKING_TREE) {`, which is exactly the
substitution `S1.9.4` already made once for this same entry.

**⛔ Direction of the justification, and why the opposite does not apply.** The claim is about the
**plant**, not the gate: rows 1 and 2 show the shipped gate catches both halves, so no credential is
currently unguarded and this is not a blocker. The opposite reading — *"the tracked half is covered
because `S1P1-M10-AUTHORING` is green"* — is the precise failure pass 2's `B-1` measured on seven
entries, and row 3 refutes it with a printed `exit=0`.

**Note on scope.** This is `scripts/`, i.e. S0 ground, and it is here because the brief assigns A the
S0-guard standing re-checks and because the fix landed **inside pass 3's fix range**. Auditor D owns the
rest of `test-gate-plants.ts`.

### A4 — `blocker` · `packages/core/debt/bnplPayoffPace.ts:40-44` (`bnplMonthlyEquivalentMinimum`)

> **A user who imported a biweekly Klarna plan from a CSV is shown a payoff chart and a debt-free date
> that clear it in 6 months, while the plan the same app runs reserves and pays down exactly half that
> each month — 12 months.**

**The defect is a GATE MISMATCH, and it is one line.** `bnplMonthlyEquivalentMinimum` rates a BNPL at
`minimumPayment × BNPL_MONTHLY_FACTOR[recurrence]` for **any** debt with `type === 'bnpl'` — there is no
`isInstallmentNative` check on it. Every **per-cycle** seam that has to agree with it *is* gated on
`isInstallmentNative`:

| seam | gate | what it does to a fallback BNPL |
|---|---|---|
| `bnplInstallment.ts:111` `scaleBnplMinimumForWindow` | `if (!isInstallmentNative(debt)) return debt;` | **no scaling** |
| `bnplInstallment.ts:88` `bnplInstallmentsInWindow` | `if (!isInstallmentNative(debt)) return 0;` | **0 installments** |
| `applyRolloverPayment.ts:48-57` `effectiveMinimum` | `isInstallmentNative(debt) && window…` | **1 × minimum** |
| `bnplPayoffPace.ts:40` `bnplMonthlyEquivalentMinimum` | **none** | **2.17 × minimum** |

**A "fallback BNPL"** — `type: 'bnpl'` with no `scheduledPaymentAmount`/`remainingPayments` — is a
**supported, documented state**: `migrations.ts:27-28` says *"A BNPL missing either field is left
untouched (the balance+minimum fallback path)"*, and `bnplInstallment.ts:23-25` says the same.

**Measured — the same debt, one pair of fields present or absent, everything else identical:**

```
cd apps/rn && npx tsx --tsconfig tsconfig.json <scratch>/p14.ts
installment fields present = TRUE
   PLAN says reserve this cycle        : $200
   ROLLOVER pays the balance down by   : $200.00
   bnplMonthlyEquivalentMinimum        : $216.67/month  <- what the payoff engines use
   payoff CHART clears $1,200 in       : 6 month(s)
   at the rate the plan actually moves : 6.0 month(s)      ← agree

installment fields present = FALSE
   PLAN says reserve this cycle        : $100
   ROLLOVER pays the balance down by   : $100.00
   bnplMonthlyEquivalentMinimum        : $216.67/month
   payoff CHART clears $1,200 in       : 6 month(s)
   at the rate the plan actually moves : 12.0 month(s)     ⛔ 2× apart
```

*(store: monthly paycheck `2026-01-01 → 2026-02-01`, `$260`, one BNPL `recurrence: 'biweekly'`,
`balance 1200`, `minimumPayment 100`, `apr 0`. The paycheck is sized so there is no snowball extra to
muddy the comparison.)*

**Reachable, and by a door in the shipping app.** `packages/core/imports/debtCsv.ts:314-315` writes
`remainingPayments`/`scheduledPaymentAmount` only when the columns are present — `toCount` returns
`undefined` for a missing or blank cell and its docblock says so explicitly (*"a debt missing it falls
through to the balance+minimum path"*) — while `:297` accepts `recurrence: biweekly` and `:291` accepts
`type: bnpl`. That parser is wired into `apps/rn/src/components/entities/ImportDebtsSheet.tsx:53`. A
restored pre-2.7.2 backup is the second door. ⚠️ The RN `DebtSheet` is **not** a door: `:200-201` refuses
a BNPL without both fields.

**Remedy.** Gate the two on the same predicate. The cheaper and safer half is
`bnplMonthlyEquivalentMinimum`: return `debt.minimumPayment` unscaled when
`!isInstallmentNative(debt)`, so the payoff engines rate a BNPL at exactly the rate the plan reserves and
the rollover pays. ⚠️ **That leaves the under-reserve open** — a genuinely biweekly plan really does
charge ~2.17×/month, which is what §2.7.4 exists to say — so the fuller fix is to make
`bnplInstallmentsInWindow` work off `recurrence` + `dueDate` alone (it needs `remainingPayments` only as
a **cap**, and an unknown cap is `Infinity`, not `0`). That is a product call about reserving against a
cadence the app cannot verify, and it belongs to 🎯.

**⛔ Direction of the justification, and why the opposite does not apply.** What I can settle is that
**one number the user reads is wrong by 2×, whichever seam moves** — the chart and the date come from
`bnplMonthlyEquivalentMinimum`, the reserve and the balance come from the `isInstallmentNative` seams,
and the two are printed above disagreeing on one debt. What I did **not** settle is which is the truth:
if the plan really is biweekly then the payoff engine is right and the *reserve* is short $100 a month
(the §2.7.4 defect, still open for this shape); if the cadence cannot be trusted without installment data
then the reserve is right and the *date* is optimistic by half. ⛔ It is not "they disagree and it does
not matter": both readings put a false number on a screen, and they put it on different screens.

---

### A5 — `minor` · `packages/core/debt/getDebtsWithDisplayBalances.ts:26`

**`||` where every other reader of this pair uses `??`, and a docblock that says otherwise.**
`bulkMarkRequired.ts:15-20` states, as a measurement: *"no debt reader in either tree keys on
`isPaidThisCycle` alone, they all fall back (`minimumPaidThisCycle ?? isPaidThisCycle`)"*. Counted whole —
`grep -rn "minimumPaidThisCycle" apps/rn/src packages/core --include=*.ts --include=*.tsx` minus tests,
**14 non-test lines mention the field. One of them is the `bulkMarkRequired.ts:19` docblock quoted above;
one (`buildMultiCycleTimeline.ts:326`) reads the field alone as `?? false`; the remaining 12 read THE
PAIR — and 11 of the 12 use `??`:**

```
packages/core/debt/getDebtsWithDisplayBalances.ts:26   debt.minimumPaidThisCycle || debt.isPaidThisCycle
```
*(the eleven: `planSelectors.ts:189`, `recoverySelectors.ts:46`, `applyRolloverPayment.ts:41`,
`deriveRequiredActionView.ts:80`, `reconcileAutopay.ts:52`, `allocatePaycheck.ts:340,371,388`,
`buildCycleSnapshot.ts:37`, `rolloverPayCycle.ts:110`, `buildTimelineItems.ts:89`.)*

**Measured, at the one input the two spellings disagree about** — `minimumPaidThisCycle: false` with
`isPaidThisCycle: true`, which `store.ts:642` (`markDebtMinimumPaid(id, false)` writes **only**
`minimumPaidThisCycle`) produces on any debt the payday checkpoint had marked with both flags:

```
npx tsx --tsconfig tsconfig.json <scratch>/p12.ts
false ||  true = true     <- getDebtsWithDisplayBalances.ts:26
false ??  true = false    <- the other 12 readers

getDebtsWithDisplayBalances -> displayBalance     = 900   (balance is 1000)
deriveRequiredActionView    -> isPaid             = false
buildCycleSnapshot          -> totalPaidThisCycle = 0
applyRolloverPayment        -> balance after roll = 1000
```

**`minor`, and only because of reachability: `getDebtsWithDisplayBalances` is not on the 2.0.0 surface.**
Printed — the only importers are `app/page.tsx:44,351` (v1.6-web) and its own test; `apps/rn/src/store/
payday.ts:5` imports `getCompletedSnowballAmount` from the same module and **not** this function. If the
v1.6 tree outlives 5.5.1, or if anything in `apps/rn` ever imports it, this becomes a `major` — a debt row
showing $900 for a debt the plan, the snapshot and the rollover all treat as $1,000 unpaid.

**Remedy.** `??`, matching the other eleven. And correct the `bulkMarkRequired.ts` docblock — its claim
covers *"either tree"*, and in the other tree it is false.

---

## 2. STANDING RE-CHECKS

⛔ **A re-read is not a re-verification.** Every `CLOSED` below has a printed measurement beside it.
⚠️ Pass 2's auditor A issued 23 verdicts over `scripts/` and `apps/rn/src/store`. **This pass's route is
the engine**, so I re-verified only the ids the brief assigns me (the two open S0 caveats), the ids whose
fix landed in `packages/core` or `scripts` **inside the fix range**, and the instruments. Everything else
is named as not re-verified rather than left silent.

| id | verdict | the measurement |
|---|---|---|
| `REVERIFY4-2` — `lint:secrets` unpinned (`--working-tree` never read a MODIFIED TRACKED file) | **CLOSED** | The 2×2 in `A3`: FIXED script + modified tracked plant → `exit=1`, naming `src/tracked.ts:2`. The fix is `check-committed-secrets.ts:230`. ⚠️ **But see `A3`** — the *plant* still only covers the untracked half. |
| `REVERIFY4-3` — the duplicate-copy stale-baseline guard **PRINTS, it does not RED** | **CLOSED, caveat RE-STATED and still true** | `strings-inventory.ts:551-556` is `console.log`, inside the branch that ends `process.exit(0)`. Today the report is empty because there is no drift: `npm run lint:copy` → `✅ duplicate copy: no new cross-file phrases (3 baselined).` · `exit=0`. **3 baselined, 0 stale.** The caveat is unchanged: a baseline that goes stale is reported, never enforced. |
| pass-2 A §5 item 4 — `PAYCHECK_SEGMENT.required`'s docstring no longer described the number it labels | **CLOSED** | Both halves. `packages/core/copy/vocabulary.ts:47-51` (in the fix range) now reads *"**What the paycheck FUNDED toward bills + minimums this cycle — not what is owed.**"* with the `Required $1,000 / $1,280 owed` case spelled out; and `PlanHero.tsx:80-83` carries the companion note (*"The gap itself is not this bar's job … `statusLabel` renders 'Short this paycheck' directly beneath"*). The remedy asked for exactly these two. |
| pass-2 A §5 item 5 — `--working-tree` never reads a modified tracked file | **CLOSED** | Same measurement as `REVERIFY4-2`. |
| pass-2 A §5 item 7 — the four `Routing` values S1 computes are never printed | **CLOSED** | `surface-coverage.ts:631-647` now groups `routed` by target under `--report`. Measured: `npm run lint:s1-coverage -- --report` prints **5 routing groups** — `→ routed to none (3)`, `s0 (41)`, `s2 (1)`, `s3 (39)`, `s4 (46)` — each line carrying the file and its `why`. |
| pass-2 `D2-1` — the ONE band's three producers | **CLOSED at the engine half**, and re-measured at the change | `buildMultiCycleTimeline.ts:75-90,144-146` is the only `packages/core` file the fix range touched. Re-measured on auditor D's own fixture through the real selectors (`<scratch>/p9.ts`): before the move all three read `tight`; after the card's own `$50`, cycle 0 is `stable` and cycles 1–4 are byte-identical to the no-top-up store (`tight/stable/tight/stable`). The `CYCLE 0 ONLY` property holds for `net`, `cushionStatus` and `guardianState`. ⚠️ **It does NOT hold for `carriedBalance`** — see §4 item 2, where I measured that and concluded it is correct. |
| `REVERIFY4-1`, `REVERIFY4-4`, `REVERIFY4-5` · pass-1 `B1`–`B5`, `M1`–`M10`, `AS-1/2/3` · pass-2 `A1`, `B-1`, `C1`, `C2`, `C3`, `C4`, `D2-2`, `D2-3` | **NOT RE-VERIFIED BY ME** | Their fix sites are `apps/rn/src/{store,app,components,data}`, `apps/rn/tests/e2e` and `scripts/check-finding-guards.ts` — auditors B, C and D's routes this pass. I opened none of them except where a route file imports them. ⛔ Recorded so pass 4 does not read silence as coverage. |

### The instruments — quoted, never typed

```
npm run lint:s1-coverage      ✅ s1-coverage: 470 surface files classified · 331 unswept.
npm run lint:s0-coverage      ✅ s0-coverage: 97 surface files classified · 50 unswept.
npm run lint:finding-guards   ✅ finding-guards: 79 of 95 findings carry a standing guard; 16 unguarded (cap 16, downward-only).
npm run lint:surface-complete ✅ surface-complete: every tracked source file is under a surface root (1207 tracked, 11 trees skipped by name).
npm run lint:secrets          ✅ committed secrets: none across 1206 tracked files in index+HEAD (4 shapes checked, 2 exemption(s), cap 2).
npm run lint:copy             ✅ duplicate copy: no new cross-file phrases (3 baselined).
npm run test:regression       ✅ All regression tests passed.
npm run test:app              ✅ App-layer regression tests: ALL PASSED.
npm run lint:gate-freshness   recorded: 818f934 · 2026-08-26T21:52:39Z · 807 files
                              now:      815 files · fingerprint differs        ⛔ RED, and correct.
```

⚡ **All five headline numbers match the brief exactly** — `470/331`, `97/50`, `95/79/16`, `1207`, `2 of 2`.
Nothing decayed between the brief being written and this run. ⛔ **`lint:gate-freshness` is RED and I did
not quote a green.** The recorded record describes `818f934`; source has moved. Per [D74] that is the
expected mid-audit state.

⛔ **NOT run, deliberately:** `lint:rn` and `test:gate-plants` (they write
`apps/rn/src/__gate_plant__.{ts,tsx}` and the scenarios' plant files into the repo — constraint 1),
`test:e2e:*` (writes `apps/rn/dist/`), `validate:release:rn`, `gate:record`, `test:scenarios`.
⚠️ `A3`'s plant matrix was run against a **copy** of the script in a scratchpad git repo, never against
this tree — `git status` after every command in this report showed only my own report file (plus three
`docs/DEBT_ELEVATION_*.md` edits made by a concurrent agent, which I did not touch).

---

## 3. SWEPT AND FOUND CLEAN — BY PATH

⛔ **What I actually opened, so pass 4 extends rather than re-reads.** Everything here was read at this
pin. `(full)` = whole file. `(at …)` = only the named lines.

### `packages/core` — SOURCE. All 45 non-test route files were opened; 44 in full.

**`debt/` — all 29 source files** *(the route lists 53 `debt/` files; 24 are tests)*
`applyDebtPaymentProjection.ts` · `applyPaydayCapture.ts` · `applyRolloverPayment.ts` ·
`bnplInstallment.ts` · `bnplPayoffPace.ts` · `bnplProviders.ts` · `bnplSchedule.ts` ·
`buildAmortizationSchedule.ts` · `buildPaydayCaptureItems.ts` · `buildPayoffTrajectory.ts` ·
`bulkMarkRequired.ts` · `calculateMonthlyInterest.ts` · `computeCycleDelta.ts` · `computeDrift.ts` ·
`computeInterestSaved.ts` · `computeMilestones.ts` · `computeStreak.ts` · `deriveRequiredActionView.ts` ·
`extraPaymentPlan.ts` · `getDebtsWithDisplayBalances.ts` · `mergeCompletedAction.ts` ·
`originalBalanceHighWater.ts` · `parseDebtFormValues.ts` · `projectCurrentBalance.ts` ·
`projectDebtPayoff.ts` · `reconcileAutopay.ts` · `reconcileGoalAmount.ts` ·
`selectActiveRecommendedActions.ts` · `shouldPromptPaydayCapture.ts` — **all (full)**.

**the rest of the route's source**
- `cashflow/detectCrunches.ts`, `cashflow/waterFill.ts` — (full)
- `constants/livingExpensePresets.ts`, `constants/requiredExpensePresets.ts` — (full)
- `forecast/getForecastStatus.ts`, `forecast/types.ts` — (full) · `forecast/projectForecast.ts` *(at `:1-70`)*
- `history/buildCycleSnapshot.ts`, `history/selectVisibleHistory.ts` — (full)
- `income/suggestLean.ts` — (full)
- `insights/buildSmartInsights.ts` — (full)
- `obligations/effectiveObligationAmount.ts` — (full)
- `recovery/buildRecoveryPlan.ts` — (full)
- `timeline/buildTimelineItems.ts` — (full)
- `types/livingExpense.ts`, `types/recurrence.ts` — (full)

### `packages/core` — TESTS (13 of the route's 30)

- `cashflow/testDetectCrunches.ts` — (full) · `cashflow/testWaterFill.ts` — (full)
- `debt/testFreedMinimumRoll.ts` — (full) · `debt/testComputeCycleDelta.ts` — (full) ·
  `debt/testComputeStreak.ts` — (full)
- `debt/testProjectionAccuracy.ts` *(at `:1-80`, `:138-262` — every `projectDebtPayoff` fixture)*
- `debt/testDebtProjection.ts` *(at `:82-130`, `:160-200`, plus all 15 `projectDebtPayoff({` sites enumerated)*
- `debt/testComputeInterestSaved.ts` *(at `:55-91`)*
- `income/testSuggestLean.ts` *(at `:1-30`)*
- `debt/testBnplInstallment.ts` *(at `:102-106` — the window-scaling block)*
- `debt/testAmortizationSchedule.ts` *(at `:138-158`)* · `debt/testBuildPayoffTrajectory.ts` *(at `:87-150`)* ·
  `debt/testProjectCurrentBalance.ts` *(at `:76-83`)*

### Outside the route, opened to settle a claim in a finding

- `packages/core/timeline/buildMultiCycleTimeline.ts` *(at `:72-90`, `:120-230`, `:265-300`, `:326`)* — **the fix range**
- `packages/core/copy/vocabulary.ts` *(at `:44-52`)* — **the fix range**
- `packages/core/testing/runRegressionTests.ts` — (full) · `packages/core/testing/testDebtMathRegression.ts` *(at `:180-200`)* ·
  `testAbuseScenarios.ts` *(at `:258-290`)* · `testStressScenarios.ts` *(at `:213-240`)* ·
  `testPayCycleHistoryRegression.ts` *(grep-level — the fixture's `type`/`recurrence`)*
- `packages/core/imports/debtCsv.ts` *(at `:108-135`, `:290-325`)*
- `apps/rn/src/store/payoffSelectors.ts` — (full) · `apps/rn/src/store/payday.ts` *(at `:60-175`)* ·
  `apps/rn/src/store/drift.ts` — (full) · `apps/rn/src/store/forecastCycles.ts` *(at `:1-30`)* ·
  `apps/rn/src/store/topUpSelectors.ts` *(at `:60-130`)* · `apps/rn/src/store/store.ts` *(at `:795-875`)* ·
  `apps/rn/src/store/selectors.ts` *(grep-level — the water-fill + BNPL-scaling wiring)* ·
  `apps/rn/src/store/analysisSelectors.ts` *(at `:105-135`)* ·
  `apps/rn/src/store/guardianSelectors.test.ts` *(at `:1-90`, `:440-525` — the D2-1 block)*
- `apps/rn/src/components/payoff/TrajectoryChart.tsx` *(at `:180-210`, `:290-320`, `:527-600`)* ·
  `apps/rn/src/components/plan/PlanHero.tsx` *(at `:75-95`)* ·
  `apps/rn/src/components/entities/DebtSheet.tsx` *(at `:130-240`)*
- `apps/rn/src/app/(tabs)/progress.tsx` *(grep-level — every `debtFreeDate` site)* ·
  `apps/rn/src/app/history.tsx` *(at `:86`)*
- `apps/rn/src/data/migrations.ts` *(at `:18-40`, `:205-270`)*
- `scripts/check-committed-secrets.ts` *(at `:1-24`, `:105-140`, `:184-250`)* ·
  `scripts/test-gate-plants.ts` *(at `:40-185`)* · `scripts/finding-guards.json` *(at `:218-245`, plus a
  full-file grep)* · `scripts/strings-inventory.ts` *(at `:485-575`)* ·
  `scripts/surface-coverage.ts` *(at `:625-660`, plus a full-file grep for `routed`)* ·
  `scripts/runRegressionTests` registry — every route test file checked for registration, mechanically
- **The ratchet:** `docs/audits/2026-08-26-s1-money-pass2/A-fixes.md` *(the outline + §5, §6, §7 in full)* ·
  `docs/audits/2026-08-26-s1-money/A-fixes.md` *(outline + every `packages/core` mention)* ·
  this pass's `BRIEF.md` (full) and `ROUTING-A.txt` (full)

### ⛔ IN MY MANIFEST AND **NOT REACHED** — 17 test files

Every one is **registered** in `packages/core/testing/runRegressionTests.ts` (checked mechanically —
`route test files: 30 · NOT imported by runRegressionTests.ts: 0`) and **passes** at this pin
(`npm run test:regression` → `✅ All regression tests passed.`), so they run. **I did not read their
assertions**, which is the thing that matters for reading rules 2, 6 and 7.

```
packages/core/debt/testApplyPaydayCapture.ts          packages/core/debt/testPaydayCapture.ts
packages/core/debt/testBnplSchedule.ts                packages/core/debt/testReconcileAutopay.ts
packages/core/debt/testBulkMarkRequired.ts            packages/core/debt/testSelectActiveRecommendedActions.ts
packages/core/debt/testComputeDrift.ts                packages/core/debt/testShouldPromptPaydayCapture.ts
packages/core/debt/testComputeMilestones.ts           packages/core/obligations/testClassifyDeferability.ts
packages/core/debt/testDeriveRequiredActionView.ts    packages/core/obligations/testEffectiveObligationAmount.ts
packages/core/debt/testGetDebtsWithDisplayBalances.ts packages/core/recovery/testBuildRecoveryPlan.ts
packages/core/debt/testGoalReconciliation.ts          packages/core/debt/testParseDebtFormValues.ts
packages/core/debt/testOriginalBalanceHighWater.ts
```
*(17 = the route's 30 test files minus the 13 listed above. `income/testSuggestLean.ts` counts as READ —
only `:1-30` of it, which is the shrinkage/percentile split.)*

⚠️ **Where the risk sits in that list.** `testDeriveRequiredActionView.ts` (210 lines) covers the
function behind *"You're caught up for this paycheck"* — pass 2's `C4` class — and
`testComputeMilestones.ts` (159 lines) covers the once-ever celebration thresholds. **Those two are the
ones I would point pass 4 at first.**

**Also not reached in `packages/core` (outside my manifest, named because a finding leans on them):**
`engine/allocatePaycheck.ts`, `engine/recommendedActions.ts`, `guardian/*`, `payCycle/*`,
`recurrence/rolloverPayCycle.ts`, `storage/debtPlannerStorage.ts`, `utils/*` — all ratcheted by earlier
passes or on auditor B's route.

---

## 4. MEASURED, AND NOT A DEFECT

⛔ Recorded so pass 4 does not spend a day on the same suspicion. Each entry says what looked wrong and
what the measurement said.

**1. `packages/core/forecast/` is dead weight on the 2.0.0 surface, not a wrong forecast.**
The route's name invites the reading that `projectForecast.ts` is the cushion forecast a user sees. It is
not: `grep -rn "core/forecast|projectForecast" apps/rn/src` returns **one line, and it is a comment** —
`analysisSelectors.ts:147` (*"…at a higher bar than the old monthly `projectForecast`"*). Its only real
importer is `components/SnowballSection.tsx` (v1.6-web). So `projectForecast.ts:28,41` calling
`new Date()` — a non-deterministic wall-clock read inside a money projection — is **not a 2.0.0 defect**.
⚠️ It would become one the moment anything in `apps/rn` imported it.

**2. `appliedTopUpSurplus` DOES reach every projected `carriedBalance`, and that is correct.**
`buildMultiCycleTimeline.ts:146` adds the surplus to `cycle0Net`, and `:147` does
`carriedBalance += cycle0Net` — a **cumulative** running total, so cycles 1..n all carry the `+$50`. The
parameter's own docblock says *"CYCLE 0 ONLY"*, and D2-1's test asserts that only through `cushionStatus`
(driven by `projNet`, not `carriedBalance`), so this looked like the over-fix the test was written to
catch. Measured on auditor D's fixture:

```
cd apps/rn && npx tsx --tsconfig tsconfig.json <scratch>/p9.ts
== BEFORE                                   == AFTER  $50 top-up (goal debited)
 cycle status   net     carried              cycle status   net     carried
   0   tight    150.00   350.00                0   stable   200.00   400.00
   1   stable  2000.00  2350.00                1   stable  2000.00  2400.00
   2   tight    150.00  2500.00                2   tight    150.00  2550.00
   3   stable  2000.00  4500.00                3   stable  2000.00  4550.00
   4   tight    150.00  4650.00                4   tight    150.00  4700.00
 waterFill prefundedReserve = 0  structuralDeficit = 0  segments = []
```

**Not a defect: `carriedBalance` is the CHECKING balance and the money really is in checking.** The
top-up debits the goal (`store.ts:857-859` writes `currentAmount − drawn`), so the pot moved rather than
appeared; and because `currentAmount` is now $50 lower, any later cycle with spare deploys $50 more into
it, pulling `carriedBalance` back down through `projNet`. The `+$50` persists only while the plan
genuinely cannot refill the fund — which is the truth about that user's checking account.
⚠️ **The docblock's `CYCLE 0 ONLY` is about `net`, not about the cumulative total**, and reading it as
covering `carriedBalance` is what made this look wrong.

**3. `projectCurrentBalance` propagates `NaN`, and `NaN` cannot reach it.**
Printed (`<scratch>/p11.ts`): `apr NaN → NaN`, `minimumPayment NaN → NaN`, `balance NaN → NaN`
(`Math.max(0, NaN)` is `NaN` and `NaN <= 0` is `false`, so the `anchor <= 0` early return does not fire).
**But all three fields are repaired at hydration**: `migrations.ts:224` declares
`debt: { required: ['balance', 'minimumPayment', 'apr'], … }`, `repairMoneyFields` runs over it, and
`readMoney` (`:70-71`) accepts a number only when `Number.isFinite`. The only remaining door would be an
in-memory value the store itself creates, and I found none. **No finding — recorded because it is one
`REPAIRABLE_MONEY_FIELDS` edit away from being one.**

**4. The far-future anchor produces an absurd balance, and no reachable input produces it.**
Same probe: an anchor 100 years stale at 25% APR with a $100 minimum projects to
**$289,610,672,118,638.10**, and an anchor of `0001-01-01` to `2.06e+221`. The loop at
`projectCurrentBalance.ts:79` has no month cap. ⚠️ **It terminates and never hangs** — the worst case
above ran in **12 ms** — and a garbage anchor string returns the anchor untouched (`daysBetween` returns
`0` on `NaN`, so `totalMonths <= 0`). `balanceAsOfDate` is written only by `migrations.ts:254` (defaults
to `lastVerifiedDate`, itself defaulting to `paycheck.currentDate`) and by `payday.ts:133` (the rollover,
always `nextPaycheckDate`). **No input produces a decade-stale anchor**, and the projection is
premium-gated. Recorded, not filed.

**5. `buildTimelineItems.ts:98` uses the UNSCALED BNPL minimum — and its callers scale first.**
This looked like `A2` again. It is not: `buildMultiCycleTimeline.ts:137` and `:211` both pass
`scaleBnplMinimumsForWindow(debts, …)`, so the ledger rows and `endingBalance` see the scaled figure.
Read at `:120-230`; the comment at `:130-133` says the same. **`buildCycleSnapshot` is the only
un-scaled caller — that is `A2`, and it is the whole of it.**

**6. `payoffOrder` dedups by `debt.name`, and nothing on the 2.0.0 surface reads it.**
`projectDebtPayoff.ts:179,214` are `if (newBalance === 0 && !payoffOrder.includes(debt.name))`, so two
debts both called *"Visa"* yield one entry. Counted whole: `grep -rn "payoffOrder"` over `apps/rn/src`
and `packages/core`, outside tests, returns **only the four lines inside `projectDebtPayoff.ts` itself**.
The RN app never reads the field. **No user-facing consequence in 2.0.0.**

**7. `buildSmartInsights` branches on the raw interest totals, including the unpayable SENTINEL — and it
is v1.6-web only.** `computeInterestSaved.ts:25-28` states the rule (*"branch on that flag, never on a
raw `0` interest total"*). `buildSmartInsights.ts:103` is `if (avalancheInterest < snowballInterest)`, and
`components/SnowballSection.tsx:251-252` passes `totalInterestPaid` straight in — while `:202` guards the
*neighbouring* comparison with `comparisonCanBeEstimated`. So an unpayable **avalanche** (sentinel `0`)
beside a payable snowball would print *"Using avalanche instead of snowball could reduce total interest by
about $X"* about a plan that never clears. ⛔ **I could not produce that input** — every asymmetric fixture
I tried had both strategies agree (`<scratch>/p15.ts`: snowball `$2,448.75`, avalanche `$2,418.97`, both
payable, correct insight). Filed here rather than in §1 because the only importer is
`components/SnowballSection.tsx`, **not on the 2.0.0 surface**, and because I have a mechanism and no
producing input. ⚠️ **`A1`'s remedy makes this strictly less likely**: a `cannotAmortize` driven by the
constant budget is strategy-independent for the whole horizon, and this shape closes with it.

**8. `waterFill` / `detectCrunches`' non-finite guards are untested, and unreachable.**
`waterFill.ts:52,58,65-68` and `detectCrunches.ts:33,50` all guard `Number.isFinite`, and
`testWaterFill.ts` / `testDetectCrunches.ts` — both read in full, 7 and 6 scenarios — contain **no**
`NaN`/`Infinity` case. The input is `TimelineCycle.carriedBalance`, built from repaired money fields
(item 3 above). **Defensive code with no producing input; not a finding.**

**9. `computeDrift` is never called in the shipping app.**
`grep -rn "computeDrift|selectDrift" apps/rn/src` returns only `drift.ts:1`, importing
`buildDriftBaseline` and `shouldReAnchor`. The baseline is **recorded** and never **read** — deliberately;
`drift.ts:12-14` says *"Recording MUST start in v1.7 — a baseline can be stamped but never backfilled"*.
So `computeDrift.ts:70-86`'s `monthAtBalance` assuming a monotonic-decreasing curve (false under negative
amortization) has **no 2.0.0 consequence**. ⚠️ It becomes one the day the Drift Tracker UI ships — and
note `drift.ts:63` persists the literal string `"Unable to estimate"` into `projectedDebtFreeDate`, which
`A1` makes far more common than anyone intended.

**10. `bulkMarkRequiredPaid` writing both flags is inert — re-measured, and the docblock is right except
in one tree.** Its claim at `:15-20` holds for `apps/rn` + `packages/core`: 11 of 11 pair-readers use
`??`. The single `||` is `getDebtsWithDisplayBalances.ts:26`, v1.6-web only — filed as `A5`.

**11. All 30 route test files are registered and run.** Checked mechanically against
`packages/core/testing/runRegressionTests.ts`: `route test files: 30 · NOT imported by
runRegressionTests.ts: 0 (none)`. **No orphaned suite on this route.** The six route source files with no
test importing them directly are `constants/livingExpensePresets.ts`,
`constants/requiredExpensePresets.ts`, `debt/bnplPayoffPace.ts`, `debt/bnplProviders.ts`,
`forecast/types.ts` and `types/recurrence.ts`. Four are data tables and a type union; ⚠️
**`bnplPayoffPace.ts` is not, and it is the file `A4` is about.** Its `BNPL_MONTHLY_FACTOR` table has no
direct test — it is exercised only through `projectDebtPayoff` / `buildPayoffTrajectory` fixtures.

**12. The whole suite is green with `A1`, `A2` and `A4` present.**
`npm run test:regression` → `✅ All regression tests passed.` and `npm run test:app` →
`✅ App-layer regression tests: ALL PASSED.`, at `96d1f11`, with all three defects reproduced live in the
same tree minutes earlier. **That is the finding-shaped half of this entry**, and it is why `A1`'s
rule-2 table matters more than its line number.
