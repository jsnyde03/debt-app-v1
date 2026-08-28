# S1 pass 4 — auditor **A**: the money engine, and the specs that claim to guard it

**Route:** `ROUTING-A.txt` — 60 files, 7,351 lines. `packages/core/**` + `apps/rn/tests/**`.
**Pin:** `e65f9c7`. **Branch:** `v1.7-dev`.

## Method / isolation

All plants were run in an **isolated detached worktree** at the pin:

```
git -C /c/Users/Jason/debt-app-v1 worktree add --detach /c/Users/Jason/audit-a-wt e65f9c7
```

`node_modules` was junctioned in from the main checkout (read-only use). **No file in
`/c/Users/Jason/debt-app-v1` was edited, committed or pushed.** Verification of that is at the
bottom of this file.

Baseline in the worktree, before any plant:

```
npx tsx packages/core/testing/runRegressionTests   → EXIT=0, "✅ All regression tests passed."
```

---

## 1. Findings

### A-F1 — `buildCycleSnapshot`'s pay-cycle window is an OPTIONAL parameter, and dropping it at the only shipping caller is silent across all three suites

- **severity:** `major`
- **user-facing consequence:** the next edit that touches `applyRollover`'s snapshot call can silently
  re-introduce blocker `A2` — History telling a user who paid $200 that they paid $100 — with
  `test:regression`, `test:app` and `test:scenarios` all green.
- **file:** `packages/core/history/buildCycleSnapshot.ts:33-34` (the optional `windowStartISO?` /
  `windowEndISO?`) · consumer `apps/rn/src/store/payday.ts:93-95`
- **origin:** `packages/core/history/buildCycleSnapshot.ts` → **fix-churn** (`ROUTING-ORIGINS.tsv`)
- **measurement (plant, isolated worktree at `e65f9c7`):** deleted the two window arguments from the
  `buildCycleSnapshot({...})` call in `apps/rn/src/store/payday.ts` — nothing else — and ran all three
  suites:

```
npx tsx packages/core/testing/runRegressionTests   → EXIT=0
npx tsx apps/rn/src/testing/runAppTests.ts         → EXIT=0
npx tsx apps/rn/src/testing/runScenarioTests.ts    → EXIT=0
```

  The registered guard `S1P3-A2-INWINDOW` lives in `packages/core/testing/testPayCycleHistoryRegression.ts`
  and calls `buildCycleSnapshot` **with** the window itself, so it is pinned to the helper's behaviour and
  is structurally incapable of seeing the caller stop passing it. Un-fixing the *helper* reds it (measured
  below, verdict `CLOSED`); un-fixing the *call* does not. This is the `D3-3` shape the brief names —
  the token is right about the line that COMPUTES and blind to the line that USES.
- **remedy (hypothesis, not verified):** make the two fields **required** on the `buildCycleSnapshot`
  input type. Both live callers already have the dates in scope (`payday.ts` passes them; the only other
  caller is the excluded legacy `app/page.tsx`, see §5). A required field turns the deletion into a
  typecheck error, which is the only guard that cannot be routed around. If a required field is judged too
  invasive, the weaker alternative is an app-layer test that drives `applyRollover` over a biweekly BNPL in
  a monthly window and asserts the snapshot total equals the balance delta — but note that a test is what
  already failed here.


### A-F2 — `sanitizeAmountInput` does NOT keep "only the first point", its docblock says it does, and the one test row is the single member of the class where the regex happens to work

- **severity:** `major`
- **user-facing consequence:** pasting a multi-point string (e.g. `1.2.3.4`) into What-If's extra-payment
  box leaves `1.2.34` sitting in the field while the projection silently simulates **$0 extra**, so the
  dashed "with extra" curve and the date under it are the un-boosted plan shown beneath a number the user
  just entered.
- **file:** `packages/core/utils/amountField.ts:93` (the regex) · docblock claim at `:87-88` · the test that
  cannot see it at `packages/core/utils/testAmountField.ts:98-102` · consumer
  `apps/rn/src/components/payoff/WhatIfControls.tsx:70-72` (`const v = Number(clean) || 0;`) and `:54`
  (`const value = Number(extra) || 0;`)
- **origin:** `packages/core/utils/amountField.ts` → **fix-churn** · `testAmountField.ts` → **fix-churn**
- **measurement (printed values, worktree at `e65f9c7`):**

```
"12..5"    -> sanitize= "12.5"     Number(s)= 12.5     <- the ONLY row the test asserts
"1.2.3"    -> sanitize= "1.23"     Number(s)= 1.23     <- silently a DIFFERENT number, not NaN
"1.2.3.4"  -> sanitize= "1.2.34"   Number(s)= NaN      <- two points survive
"1..2..3"  -> sanitize= "1..2.3"   Number(s)= NaN      <- three points survive
"..."      -> sanitize= ".."       Number(s)= NaN
"12.5."    -> sanitize= "12.5"     Number(s)= 12.5
"1e5"      -> sanitize= "15"       Number(s)= 15       (parseAmountField("1e5") = 100000 — they disagree)
```

  The docblock at `:87-88` states: *"⚠️ **Only the FIRST point survives.** Keeping every point lets `"12..5"`
  through, and `Number("12..5")` is `NaN`, which callers' `|| 0` then read as **zero**"*. **Measured, that
  invariant does not hold**, and the exact `NaN → || 0 → $0` failure it names is still reachable. The
  mechanism: `/(\..*)\./g` removes **one** point per non-overlapping match and the greedy `.*` makes the
  match span to the *last* point, so a run of ≥3 points leaves ≥2 behind.
- **the test picked the working member** (reading rule 2): the loop's only multi-point row is `'12..5'`,
  and the property assertion is literally `assert(!Number.isNaN(Number(sanitizeAmountInput('12..5'))),
  'no surviving string parses to NaN')` — a class-level sentence pinned to one input. `S1P3-M4`'s
  registered token (`assert(Number(sanitizeAmountInput('12.50')) === 12.5,`) is a *different* line again
  and is about the hundredfold bug, not about points.
- **also measured, and separate:** `"1.2.3"` → `"1.23"` parses fine as **1.23**, which is not the number the
  user typed and not refused anywhere. `Number.isNaN` cannot see that one at all.
- **remedy (hypothesis, not verified):** replace the collapse with one that is not order-dependent — e.g.
  split on `.`, keep the first segment plus the joined remainder (`const [h, ...t] = digits.split('.');
  return t.length ? h + '.' + t.join('') : h;`) — and turn `testAmountField.ts`'s single row into a table
  covering `'1.2.3'`, `'1.2.3.4'`, `'...'`, `'1..2..3'`, asserting **`(s.match(/\./g) ?? []).length <= 1`**
  as the property rather than `!Number.isNaN` on one input. ⚠️ Unverified: the `'12.'` row must keep
  passing (a trailing point is a required half-typed state), so the property is *at most one point*, not
  *parses to a finite number*.


### A-F3 — `bnplInstallmentsInWindow` accepts a `windowStartISO` and **never reads it**, so every installment a BNPL missed before the window opens is counted as due in the CURRENT pay cycle

- **severity:** `blocker`
- **user-facing consequence:** a user who enters or imports a Klarna/Affirm plan whose "Next payment"
  date is in the past is told on the Today card that the plan's **entire $1,200 balance** must be held
  back out of this one $2,000 paycheck — against a real in-window charge of $300 — and one payday
  capture then zeroes the whole balance and files it in History as $1,200 paid down.
- **file:** `packages/core/debt/bnplInstallment.ts:128-147` (`bnplInstallmentsInWindow`; `windowStartISO`
  is a declared parameter and appears nowhere in the body) · docstring claiming `[start, end)` at
  `:77-86` · reached by `apps/rn/src/store/selectors.ts:65`, `recoverySelectors.ts:50`,
  `guardianSelectors.ts:394`, `buildMultiCycleTimeline.ts:137,197`, and by
  `effectiveMinimumInWindow` → `applyRolloverPayment` / `buildCycleSnapshot`
- **origin:** `packages/core/debt/bnplInstallment.ts` → **fix-churn** (`ROUTING-ORIGINS.tsv`) — the file
  pass 3's `A4` fix rewrote
- **measurement (printed values, isolated worktree at `e65f9c7`, no source edited):**

  Core — the parameter is inert. Same debt, same window end, three different window *starts*:

```
in-window(start=2026-08-01, end=2026-09-01) = 3
in-window(start=2026-08-25, end=2026-09-01) = 3     <- only Aug 29 is inside this window
in-window(start=2099-01-01, end=2026-09-01) = 3     <- start is absurd; the answer does not move
```

  Core — a fallback biweekly BNPL, $100 installment, $1,200 balance, `dueDate: 2026-02-01`, window
  `2026-08-01 → 2026-09-01`:

```
hasKnownBnplCadence                            = true
bnplInstallmentsInWindow                       = 16
effectiveMinimumInWindow                       = 1200      (min(16 x 100, balance))
scaleBnplMinimumForWindow(...).minimumPayment  = 1200
applyRolloverPayment(minimumPaidThisCycle) -> balance = 0
```

  App layer — `selectAllocation(...).totalRequired`, monthly earner, $2,000 income, one BNPL, nothing
  else in the plan. Only the stored `dueDate` differs between rows:

```
dueDate=2026-08-01  totalRequired=300     <- the value `bnplCadence.test.ts` asserts
dueDate=2026-02-01  totalRequired=1200
dueDate=2025-08-01  totalRequired=1200
```

- **reachability, checked against current code rather than assumed:**
  - `packages/core/imports/debtCsv.ts:226-233` validates `dueDate` for **shape and calendar validity
    only** — `2026-02-01` imports clean. There is no "must be in the future" check, and `:311` copies the
    same value into `originalDueDate`.
  - `apps/rn/src/components/ui/DateField.tsx` passes **no `minimumDate`** to the platform picker, and
    `DebtSheet.tsx:354` labels the field **"Next payment"** — a past date is one scroll away in the add
    form.
  - The steady state is safe and that is why this hides: `applyRollover` advances `paycheck.currentDate`
    and the debts' due dates in the **same** call (`payday.ts:147,178` + `rolloverDebts`), so a date can
    only fall behind the window by arriving behind it.
- **why the existing tests cannot see it** (brief reading rule 2): every window row in
  `testBnplInstallment.ts:95-101,119-125` and every store row in `apps/rn/src/store/bnplCadence.test.ts`
  uses `dueDate === windowStart` (`2026-08-01`). The one row that varies the relationship —
  `:100`, `("2026-08-01","2026-07-15") → 0` — moves the **end** before the due date, never the **start**
  after it. The class is "due date outside the window"; the tests picked only the member on the far side.
- **remedy (hypothesis, not verified):** the honest reading of the docstring is to skip occurrences that
  fall before `windowStartISO` — advance `due` while `due < start` without counting, then count from
  there — which makes `windowStartISO` load-bearing and turns the row above into 2 charges, not 16.
  ⚠️ **Unverified and it is a money-semantics call, not a mechanical one:** the opposite reading is that a
  genuinely overdue plan *is* all due now, in which case the fix belongs at the **entry** seams (refuse or
  roll forward a past `dueDate` on import and on save) and this function should assert its precondition.
  ⛔ Both readings agree the current state is wrong, because the function's own contract says
  `[start, end)` and one of the two bounds is dead. Whichever is chosen, `testBnplInstallment.ts` needs a
  row with `dueDate < windowStart`; there is none today.


### A-F4 — the debt-free DATE and the payoff CHART still disagree on whether an ordinary card amortizes: `A1`'s fix aligned the two guards' FORM and left their PHASE different

- **severity:** `blocker`
- **user-facing consequence:** a user with a $6,379 card at 25.22% APR paying its $136 minimum reads
  **"September 2043"** as their debt-free date on the Payoff screen and, in the same selector's output
  rendered directly beneath it, a payoff curve that is **a single point at the full balance and never
  descends** — the app telling them in a picture that this plan will never pay the card off, and dropping
  the "Visa gone" waypoint and the vs-minimums gap with it.
- **file:** `packages/core/debt/projectDebtPayoff.ts:147` (the guard runs **before** the month's interest
  is accrued at `:157-169`) vs. `packages/core/debt/buildPayoffTrajectory.ts:88-97` (the same guard runs
  **after** the accrual at `:76-85`) · both surface through `apps/rn/src/store/payoffSelectors.ts:68-74,87-101`,
  which returns `debtFreeDate` and `snowball`/`minimums` in **one object**
- **origin:** `packages/core/debt/projectDebtPayoff.ts` → **fix-churn** (`ROUTING-ORIGINS.tsv`).
  ⚠️ `buildPayoffTrajectory.ts` is **not on any lane's manifest** — it is the other half of a two-producer
  pair and pass 4 routed only one half.
- **measurement (differential fuzz + printed values, isolated worktree at `e65f9c7`, no source edited):**

  4,000 pseudo-random plans (1–3 debts, mixed `debt`/`bnpl`, mixed cadence, extra ∈ {0,25,100,400}, both
  strategies) run through **both** engines and compared on payability and month count:

```
checked=4000  disagreements=6
  DATE=205mo  CHART=flat@0 bal 6379.24   extra=0  avalanche  ["debt/monthly bal 6379.24 min 136 apr 25.22"]
  DATE=417mo  CHART=flat@0 bal 7833.66   extra=100 snowball  ["debt/monthly bal 7833.66 min 96.37 apr 30.08"]
  DATE=161mo  CHART=flat@0 bal 27934.90  extra=0  snowball   [one-time BNPL + 2 cards]
```

  ⛔ **Every disagreement runs the same direction: the DATE clears and the CHART never does.** The
  mechanism, printed on the first plan:

```
plan: $6,379.24 Visa @ 25.22% APR, $136 minimum, no extra payment
  monthlyBudget                      = 136.00
  interest on the CURRENT balance    = 134.07  -> projectDebtPayoff's cannotAmortize: false
  balance after this month's accrual = 6513.31
  interest on the ACCRUED balance    = 136.89  -> buildPayoffTrajectory's break:       true

  projectDebtPayoff  -> estimatedDebtFreeDate = "September 2043"  monthsToDebtFree = 205
  simulatePayoff     -> points = [{"month":0,"balance":6379.24}]  clears = []
```

  ⚡ **The two engines' month bodies are otherwise identical** — both accrue, then pay minimums, then roll
  the freed budget onto the target. Only the negative-amortization guard is evaluated at a different point
  in the month: `projectDebtPayoff` tests the interest on the balance it is **about to** accrue,
  `buildPayoffTrajectory` tests the interest on the balance it **has already** accrued. Since accrual only
  raises the balance, the chart's test is strictly the harsher one, so the chart bails on a band of plans
  the date engine amortizes. The band is `budget/(1+apr/1200) ≤ monthlyInterest < budget` — for a 25% card
  that is a **2% window**, and a minimum set at ~2% of balance is the ordinary credit-card shape, which is
  why a random sweep lands in it.
- **which producer is wrong:** the **chart**. The date engine's own simulation runs the plan to zero at
  month 205, so the balance genuinely does fall ($1.93 in month 1). ⚠️ Stated as an observation, not a
  reading: `payoffSelectors.ts` applies **no** guard against a degenerate one-point trajectory — the
  `debtFreeDate` string and the one-point `snowball` array are returned side by side at `:87-101`.
- **relationship to pass 3's `A1`:** this is `A1`'s class with the two producers' roles swapped. `A1`'s
  fix corrected `cannotAmortize`'s **operand** (budget, not the shrinking minimum sum) so the two guards
  now compute the same expression, and its own comment says so — *"this is the second producer of one
  fact being brought into line with the first."* They still are not one producer, and the half that was
  not brought into line is **when** the expression is evaluated. ⛔ This is the brief's reading rule 13
  measured: correcting the losing copy left two producers. **`A1`'s verdict is therefore `PARTIAL`, not
  `CLOSED`.**
- ⭐ **The assertion that would catch this ALREADY EXISTS and is green over the defect.**
  `testDebtProjection.ts:394-400` is literally the differential row - *"the debt-free DATE and the payoff
  CHART agree on the same plan (S1P3-A1)"*, comparing `trajectory.find(p => p.balance <= 0.01)?.month`
  against `monthsToDebtFree`. ⛔ It is pinned to **one plan** - the $2,000 car loan at 5% plus the
  $10,000 Visa at 25%, whose interest is nowhere near its budget - so the class-level sentence in its
  label reports on that member only. Run against the $6,379/25.22%/$136 plan the same expression is
  `assertEqual(undefined, 205)`. ⚡ This is brief reading rule 2 exactly: the guard is the right guard,
  aimed at the one input where the two producers happen to agree.
- **remedy (hypothesis, not verified):** make it literally one producer — export the guard from one
  module (e.g. `cannotAmortize(debts, monthlyBudget)` out of `projectDebtPayoff.ts`) and have
  `buildPayoffTrajectory` call it at the **same point in the month body**, before the accrual. ⚠️
  Unverified and it changes chart output on the boundary band, so `testDebtProjection.ts`'s `S1P3-A1`
  block needs a row asserting the two engines agree on a plan **inside** the band (the $6,379/25.22%/$136
  plan above), not only on `A1`'s original car-loan-plus-Visa plan, which sits far outside it. A
  differential row — *"for this plan, `estimatedDebtFreeDate !== UNPAYABLE` iff the trajectory reaches
  zero"* — is the assertion that would have caught both halves.


### A-F5 — pass-3 `B2` was fixed at BOTH RN hand-entry paths and guarded at only one: the onboarding APR bound can be deleted and nothing in the tree reds

- **severity:** `major`
- **user-facing consequence:** the guard that stops a user's **first** debt being saved at `2599%` APR —
  the figure every projection on their first screen is then built from — can be removed by an ordinary
  edit with 325 e2e tests, three unit suites and every lint gate still green, which is how `B2` ships a
  second time.
- **file:** the unguarded bound is `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:70-73` ·
  the guard that exists is `apps/rn/tests/e2e/amount-guards.spec.ts:108-125` (`S1P3-B2-APRBOUND`), and it
  drives only the `DebtSheet` path via `add-choice-debt`
- **origin:** `apps/rn/tests/e2e/amount-guards.spec.ts` → **fix-churn** (mine) ·
  `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx` → **first-look** (lane C)
- **measurement (search + plant, isolated worktree at `e65f9c7`):**

  **The behaviour is fixed at both sites** — enumerated over the whole repo, not a directory list:

```
apps/rn/src/components/entities/DebtSheet.tsx:230        if (aprN > 100) return setError(FORM_ERRORS.aprOutOfRange);
apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:70   if (aprN > 100) {
packages/core/debt/parseDebtFormValues.ts:47             ... || apr > 100)        (legacy tree)
packages/core/imports/debtCsv.ts:287                     if (apr < 0 || apr > 100)
```

  **Nothing exercises the onboarding one.** Every occurrence of its testID in the repo, `node_modules`
  and `.git` excluded — count printed rather than headed, per brief reading rule 5:

```
./apps/rn/.maestro/01-launch-smoke.yaml:94        id: "field-onboarding-apr"     ← types "26.99", a VALID rate
./apps/rn/dist/…/index-….js                       ← the built bundle
./apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:200
(count: 3)
```

  No Playwright spec fills it; `apps/rn/tests` contains the string zero times. The only assertion on the
  error copy anywhere is `amount-guards.spec.ts:121`, inside the `DebtSheet` test.

  **Then the plant.** Deleted the four lines at `:70-73` — the bound and nothing else — rebuilt `dist/`
  from scratch and ran the **entire** RN e2e suite plus all three unit suites:

```
CI=1 npx playwright test --config apps/rn/playwright.config.ts     -> 325 passed (9.6m)   EXIT=0
npx tsx packages/core/testing/runRegressionTests.ts                -> EXIT=0
npx tsx apps/rn/src/testing/runAppTests.ts                         -> EXIT=0
npx tsx apps/rn/src/testing/runScenarioTests.ts                    -> EXIT=0
```

- **why the existing guard cannot see it:** `amount-guards.spec.ts`'s `openAddDebt` helper goes
  `/money` → `money-add` → `add-choice-debt`, which mounts `DebtSheet`. The onboarding form is a
  different component, reached only before `onboardingComplete`, and every scenario in the suite seeds
  `prefs.onboardingComplete: true`. ⚠️ This is the shape pass 3 named in `B2`'s own write-up one level up
  — *"a unit test asserted this bound and passed, because `parseDebtFormValues`' only live consumer is
  the legacy root tree; the guard travelled with v1.6 and never crossed"* — recurring at the e2e layer.
  ⛔ **`lint:finding-guards` reports `S1P3-B2-APRBOUND` green, and it is green about the site that is
  covered.** Green ≠ guarded, for the half that is not.
- **relationship to pass 3's `B2`:** the defect is genuinely **CLOSED** — both hand-entry paths now bound
  the rate, and `DebtSheet` covers add *and* edit through one `editing` prop (§5.6), so pass 3's
  *"add/edit form"* is one site, not two. What is `PARTIAL` is the **protection**, which is why this is
  filed as a finding of mine rather than as an `OPEN` verdict on `B2`.
- **remedy (hypothesis, not verified):** add one test to `amount-guards.spec.ts` that seeds
  `prefs.onboardingComplete: false`, reaches the first-debt step, fills `field-onboarding-apr` with
  `2599`, and — following this file's own stated standard — asserts **what landed in the store**, not
  that an error appeared: `debts` must not grow, and `Enter an APR between 0 and 100.` must be visible.
  ⚠️ Unverified: the onboarding flow is 4 steps and the paycheck step comes first, so the test needs the
  navigation `tests/e2e/onboarding-flow.spec.ts:33` already performs for the legacy tree; whether that
  drives cleanly on RN web at this pin was **not** measured. A weaker but certain alternative is a
  `check-*` gate asserting that every site matching `aprN > 100` carries a registered guard token — but a
  behavioural test is what this file exists to be.

  ⛔ **325 of 325 e2e tests and all three unit suites green with the bound gone.** Not one assertion in
  the tree touches it. **Restore verified:** `git checkout --`, then `git status --porcelain` empty and
  `:70` reads `if (aprN > 100) {` again.


---

## 2. Closure verdicts

**How every verdict below was reached:** the defect was **restored** in the isolated worktree at the pin
and the registered guard was **watched**. Where the registered token sits *behind* an earlier assertion in
the same block, the earlier assertion was **relaxed** and the run repeated, so the verdict is about the
**registered line**, not about the block (brief reading rule 6). Every restore was reverted and
`git status --porcelain` confirmed empty before the next one.

### (a) pass-3 ids in my lane

| id | verdict | measurement |
|---|---|---|
| **A1** - `cannotAmortize` vs. the shrinking minimum sum | **PARTIAL** - see **A-F4** | Restored the pre-fix body (`monthlyPaymentTotal = sum of active minimums + extra`, `96d1f11`'s exact text) and re-pointed the call at `monthlyExtraPayment`. `test:regression` EXIT=1. **Printed with the defect live:** `date= "Unable to estimate"  months= 5`, while `buildPayoffTrajectory` on the same inputs clears at **30** - pass 3's description reproduces exactly. Restored to EXIT=0. **The named instance is fixed.** A sibling instance of the same class is not: the two engines evaluate the same guard at a DIFFERENT PHASE of the month, and a 4,000-plan differential sweep found 6 plans where the date clears and the chart never does - finding **A-F4**. |
| **A2** - `buildCycleSnapshot` sums the unscaled BNPL minimum | **CLOSED** (helper) - but see finding **A-F1** | Replaced `effectiveMinimumInWindow(debt, windowStartISO, windowEndISO)` with `debt.minimumPayment`. `test:regression` EXIT=1 on the registered token: `FAIL [History reports the money the rollover actually deducted (S1P3-A2)]: expected 200, got 100`. The control assertion above it (`actuallyPaidDown === 200`, pinned to what the rollover really deducts) fires **first and passes**, so the token line is the one that carries the finding. The same defect restored at the CALL site instead of the helper is silent - see A-F1. |
| **A4** - `bnplMonthlyEquivalentMinimum` gated on `type` while the per-cycle seams gated on `isInstallmentNative` | **CLOSED** | Reverted `hasKnownBnplCadence` to `return isInstallmentNative(debt)`. `test:regression` EXIT=1. Relaxing the two earlier `S1P3-A4` assertions and re-running reds the **registered** line on its own: `FAIL [...and PAID DOWN by the same amount, so reserve and paydown stay in lockstep (S1P3-A4)]: expected 200, got 100`. Printed with the defect live: `inWindow= 0`, `reserved= 100`. **Reachability of the named door re-checked against current code:** `packages/core/imports/debtCsv.ts:232` makes `dueDate` **required**, so every CSV-imported BNPL satisfies the new `hasKnownBnplCadence`. |

### (b) `S1P3-*` guard entries whose guard or guarded code is in `packages/core/**` or `apps/rn/tests/**`

| entry | guard file | verdict | measurement |
|---|---|---|---|
| `S1P3-A1-BUDGET` | `packages/core/debt/testDebtProjection.ts` | **CLOSED** for the operand, blind to the phase | Token line (`the debt-free DATE and the payoff CHART agree on the same plan`) reds **on its own** once the two earlier `S1P3-A1` assertions are relaxed: `expected 5, received 30`. ⚠️ Its plan (car loan + Visa) sits far outside the boundary band, so the block is green over **A-F4** - it pins the operand, not the agreement. |
| `S1P3-A2-INWINDOW` | `packages/core/testing/testPayCycleHistoryRegression.ts` | **CLOSED** for the helper - **GUARD-ONLY for the call** | Reds `expected 200, got 100` on the helper un-fix. Survives the caller un-fix silently across all three suites - finding **A-F1**. |
| `S1P3-A4-CADENCE` | `packages/core/debt/testBnplInstallment.ts` | **CLOSED** | See A4 above - token line reds on its own. |
| `S1P3-A5` | `packages/core/debt/testGetDebtsWithDisplayBalances.ts` | **CLOSED** (a guarded *refusal*) | A5's fix was to **refuse** the proposed `??`. Applied the refused remedy (`||` to `??`): `test:regression` EXIT=1 on the registered token - `isPaidThisCycle also subtracts the minimum failed. Expected 950, received 1000`. The `debt()` helper defaults `minimumPaidThisCycle: false`, so `false ?? true` is `false`. The refusal is real and it is guarded. |
| `S1P3-M4` | `packages/core/utils/testAmountField.ts` | **CLOSED** | Restored the `[^0-9]` strip. Relaxing the table loop, the registered token reds on its own: `FAIL [a typed decimal keeps its value, not 100x it]`; printed with the defect live: `"12.50" -> "1250"`, `"0.75" -> "075"`, `"$45.99" -> "4599"`. The fix is closed and the file still carries finding **A-F2** - a different member of the same class. |
| `S1P3-B1-SWEEP` | `packages/core/insights/buildSmartInsights.ts` | **CLOSED** | Restored the hand-rolled `Intl.NumberFormat(...).format(Math.max(0, ...))`. **Two** gates red: `lint:money` EXIT=1 naming the restored line, and `lint:finding-guards` EXIT=1 naming `S1P3-B1-SWEEP` by id. Baseline for both was EXIT=0. |
| `S1P3-C1-ROWFIGURES` | `apps/rn/tests/e2e/trust-claims.spec.ts` | **CLOSED** | Planted `rowFieldUnread` to `return false`. The registered token line reds with the row's real accessible name printed: `"Chase card, $5,000 . 0% APR, The minimum payment and the interest rate could not be read, $0/mo"`. Note the caption **survives** the plant - the suppression and the caption are separate producers - so the positive assertions above it pass and the registered line is genuinely the one exercised. |
| `S1P3-C2-SUMS` | `apps/rn/tests/e2e/trust-claims.spec.ts` | **CLOSED** | Planted `anyRowFieldUnread` to `return false`. Two earlier assertions red first; relaxed them and the registered `living-reserve-headline` line reds on its own - **printed headline text: `$120`**, over a true reserve of at least $520. |
| `S1P3-C3-QUANTITY` | `apps/rn/tests/e2e/trust-claims.spec.ts` | **CLOSED** | Restored `selectHistorySummary`'s `max(0, oldest.totalDebtBalance - newest.totalDebtBalance)`. The registered token names the **control** test, and that test reds at `expect(page.getByText('$350')).toBeVisible()` (the defect computes $200 from the balance drop, not the $350 actually paid). The C-3 defect test also reds, at its positive assertion. |
| `S1P3-C4-ARCHIVE` | `apps/rn/tests/e2e/trust-claims.spec.ts` | **CLOSED** | Planted `rowFieldUnread` to `return false`. The registered token - an **absence** assertion, `expect(page.getByText('$0 paid off')).toHaveCount(0)` - is the line that reds, and the positive `DEBTS PAID OFF` above it passes first. Brief reading rule 7 satisfied in practice, not only on paper. |
| `S1P3-C6-CALENDAR` | `apps/rn/tests/e2e/trust-claims.spec.ts` | **CLOSED** | Same plant. The positive at `:261` reds first, so the registered absence assertion was relaxed into reach: it then reds on its own - `expect(getByText(/1 payment/)).toHaveCount(0)` -> **Received: 1**. |
| `S1P3-B2-APRBOUND` | `apps/rn/tests/e2e/amount-guards.spec.ts` | **PARTIAL** - see **A-F5** | Deleted `if (aprN > 100) return setError(FORM_ERRORS.aprOutOfRange);` from `DebtSheet.tsx:230`. The registered token line - `expect(page.getByText('Enter an APR between 0 and 100.')).toBeVisible()` - is the line that reds, so the **DebtSheet** site (add AND edit, one component) is genuinely guarded. ⛔ The SECOND RN hand-entry path is not: deleting `FirstDebtOrBillStep.tsx:70-73` leaves **325/325 e2e and all three unit suites green** - finding **A-F5**. `B2`'s BEHAVIOUR is closed at both sites; its PROTECTION is partial. |
| `S1P3-D3-5` | `apps/rn/tests/e2e/on-plan-streak.spec.ts` | **CLOSED**, with a caveat | Lowered `ON_PLAN_STREAK_MIN` to 1. The test reds - but at `:33` (the absence assertion), **not** at the registered token `:32` (`progress-hero-journey` toBeVisible), which passes. The token is a **presence** pin: it reds only through `lint:finding-guards` if the positive-first line the fix ADDED is deleted. That is the correct thing to pin for this fix, and it is worth saying out loud that the line itself never reds behaviourally. |
| `S1P3-D3-8` | `apps/rn/tests/e2e/bnpl.spec.ts` | **CLOSED** | Planted the calendar subtotal to `formatCurrency(0)`. The registered regex line `:87` reds. **And the neighbouring `C-6 control` in `trust-claims.spec.ts` stayed GREEN through the same plant** - which is exactly the gap D3-8 was filed to close, measured rather than assumed. |
| `S1P3-B4-E2E` | `apps/rn/tests/e2e/data-recovery.spec.ts` | **CLOSED** - see (c) below | |
| `S1P3-C7-LOSSES` / `S1P3-C7B-CLOUDDOOR` | `apps/rn/src/data/readBackup.test.ts` | **ROUTED AWAY** - guard file and guarded code are both lane B | listed so pass 5 can see they were consciously routed, not missed. |


### (c) `S1P3-B4-E2E` — the one guard whose measurement needs the browser

| entry | guard file | verdict | measurement |
|---|---|---|---|
| `S1P3-B4-E2E` | `apps/rn/tests/e2e/data-recovery.spec.ts:105` | **CLOSED** | Measured with a real plant and a **fresh** export, not a reading. |

**Baseline first, at the pin, with `dist/` deleted and rebuilt** (`CI=1` → `reuseExistingServer:false`, so
the bundle cannot be a stale one — the trap the config's own header documents):

```
rm -rf apps/rn/dist
CI=1 npx playwright test --config apps/rn/playwright.config.ts data-recovery.spec.ts
→ 21 passed (2.1m)
```

**Then B4's defect restored** in `apps/rn/src/storage/createAdapter.web.ts:60-63` — the `JSON.parse`
`catch` changed from `return raw;` back to `return null;`, one line, nothing else — `dist/` deleted again
and re-exported:

```
[desktop-chrome] data-recovery.spec.ts:105 › B4 · TRUNCATED bytes are quarantined too   FAILED
  Error: expect(locator).toBeVisible() failed
  Locator: getByTestId('data-reset')      Expected: visible   Error: element(s) not found
  at data-recovery.spec.ts:115:48
[desktop-chrome] data-recovery.spec.ts:90  › a corrupt store does NOT drop the user…    passed
1 failed, 1 passed
```

⚡ **Two things worth stating separately, because they are the two ways this verdict could have been
wrong:**

1. **It reds on the FIRST assertion in the block** (`:115`, the *positive* `data-reset` visibility), not
   on the absence assertion at `:119` — so brief reading rule 7 is satisfied in practice and the pass is
   not the vacuous "`toHaveCount(0)` is true of a page that never rendered." The registered token is the
   line that actually carries the finding.
2. ⭐ **The valid-JSON control at `:90` stayed GREEN through the same plant.** That is `B4`'s own thesis
   measured rather than assumed: `JSON.stringify('this is not a store')` is the one member of the class
   the two adapters agreed on, the whole suite rested on it, and it is blind to the defect. The
   `seedTruncated` fixture is the member that sees it, and it was added **beside** the old one rather
   than replacing it.

**Restore verified:** `git checkout -- apps/rn/src/storage/createAdapter.web.ts`, then
`git status --porcelain` shows no tracked modification and `:62` reads `return raw;` again.


---

## 3. Findings tally by origin

Origins are looked up in `ROUTING-ORIGINS.tsv`, not judged. My route's own split is
**45 first-look · 14 fix-churn · 1 off-surface**.

| origin | blocker | major | minor | total | the findings |
|---|---|---|---|---|---|
| **first-look** | 0 | 1 | 0 | **1** | `A-F5` — the file it names, `FirstDebtOrBillStep.tsx`, is lane C first-look; the GUARD that should cover it, `amount-guards.spec.ts`, is mine |
| **fix-churn** | 2 | 2 | 0 | **4** | `A-F3` `A-F4` (blockers) · `A-F1` `A-F2` (majors) |
| **instrument** | 0 | 0 | 0 | **0** | none on my route — `ROUTING-ORIGINS.tsv` assigns no `instrument` file to lane A |
| **off-surface** | 0 | 0 | 0 | **0** | my one off-surface file, `apps/rn/tests/e2e/data-recovery.spec.ts`, was **executed** (21/21 green at the pin) and plant-verified — see §2(c). No defect in it. |
| **total** | **2** | **3** | **0** | **5** | |

⭐ **All four of my own-route findings sit in `fix-churn`, and my route holds only 14 fix-churn files out
of 60.** Four findings from 23% of the files; **45 first-look files produced nothing.** The brief's
reading rule 11 — *the fix is the most likely place for the next defect* — is the whole result of this
route, measured again.

⚠️ **A structural note about the route itself, offered as an observation rather than a finding.**
`audit-route.ts` routes files **changed since the pin**. `A-F4` is a disagreement between
`projectDebtPayoff.ts` (changed → routed to me) and `buildPayoffTrajectory.ts` (**unchanged → routed to
nobody**). ⛔ **A change-based route is structurally half-blind to the two-producer shape** — the very
shape the brief calls this repo's most-repeated — because a fix that touches one producer routes one
producer, and the disagreement is only visible from the side that moved.

---

## 4. Swept and found clean — BY PATH

**What "swept" means in each row.** Every file was opened and read at `e65f9c7` in
`/c/Users/Jason/audit-a-wt`. Where a row says **executed**, the file was additionally *run*. Where it
says **scanned**, a machine pass was applied on top of the read — described under the e2e table.
⚠️ Files carrying a finding appear in §1 and are **not** claimed clean here.

### `packages/core/**` — production (9 files, all read in full)

| path | origin | swept | verdict |
|---|---|---|---|
| `debt/applyRolloverPayment.ts` | fix-churn | read in full · executed | clean. The `S1P3-A2` one-producer claim at `:48-51` is **true as written** — it calls `effectiveMinimumInWindow` rather than re-deriving. Its interest phase (`min(effectiveMinimum, balanceWithInterest)`) differs from the snapshot's (`min(…, debt.balance)`); reachable only when `minimum > balance`, where both clamp to the balance and agree. |
| `debt/bnplInstallment.ts` | fix-churn | read in full · probed | ⛔ carries **`A-F3`**. The rest measured correct: `isInstallmentNative`, `normalizeBnplInstallment`, `bnplPaymentsRemaining/Total`, and the `Infinity`-cap reasoning. |
| `debt/bulkMarkRequired.ts` | fix-churn | read in full | clean. Its header is the pass-3 `A5` correction ledger; every claim was checked against `getDebtsWithDisplayBalances.ts` and holds — including its self-correction that *"no reader in either tree"* over-reached by one site. |
| `debt/getDebtsWithDisplayBalances.ts` | fix-churn | read in full · plant (§2) | clean. The `||`-not-`??` refusal is real and it is guarded. |
| `debt/projectDebtPayoff.ts` | fix-churn | read in full · 4,000-plan differential | ⛔ carries **`A-F4`**. |
| `forecast/projectForecast.ts` | fix-churn | read in full · consumers enumerated | clean — **legacy-only**, see §5. Its docblock claims the dropped clamp is *"provably dead"*; every caller was enumerated and it is. |
| `history/buildCycleSnapshot.ts` | fix-churn | read in full · plant | ⛔ carries **`A-F1`**. |
| `insights/buildSmartInsights.ts` | fix-churn | read in full · every branch checked | clean — legacy-only (§5). The clamp-is-dead claim was verified branch by branch rather than read; all six money expressions are provably non-negative. |
| `utils/amountField.ts` | fix-churn | read in full · printed values | ⛔ carries **`A-F2`**. The three parsers themselves are clean — blank / unparseable / out-of-range are genuinely distinguishable channels. |

### `packages/core/**` — the specs (20 files)

All 20 read: the 17 marked *full* line by line, the 3 marked *outlined* by every assertion label plus a
full read of the blocks carrying registered guards. **All 20 executed** under
`npx tsx packages/core/testing/runRegressionTests` → EXIT=0 at the pin.

| path | read | note |
|---|---|---|
| `debt/testDebtProjection.ts` | outlined + the `S1P3-A1` block in full | ⚠️ the differential row exists and is aimed at a plan outside the failing band — **`A-F4`** |
| `debt/testBnplInstallment.ts` | full | ⚠️ every window row uses `dueDate === windowStart`; the one varying row moves the END — **`A-F3`** |
| `utils/testAmountField.ts` | full | ⚠️ the multi-point class has exactly one row — **`A-F2`** |
| `debt/testGetDebtsWithDisplayBalances.ts` | full | clean — pins the `A5` domain-OR by behaviour, not by field |
| `debt/testOriginalBalanceHighWater.ts` | full | clean, and unusually good: it asserts **the count a user reads**, not the field, and says why that distinction is the finding |
| `debt/testComputeMilestones.ts` | full | clean — high-water re-cross, legacy-no-`originalBalance`, and the false debt-free case all covered |
| `debt/testGoalReconciliation.ts` | full | clean — carries a real 6 × 2 × 5 invariant sweep of `unmark(mark(x)) === x` |
| `recovery/testBuildRecoveryPlan.ts` | full | clean — closeable and residual asserted in both directions |
| `debt/testPaydayCapture.ts` | full | clean — the external-vs-paycheck split is asserted on the **cash total**, not on the flag |
| `debt/testApplyPaydayCapture.ts` | full | clean |
| `debt/testBulkMarkRequired.ts` | full | clean — both writers, both directions, reference identity |
| `debt/testSelectActiveRecommendedActions.ts` | full | clean |
| `debt/testBnplSchedule.ts` | full | clean — the fallback BNPL's `0/0` and the past-installment drop are both pinned |
| `debt/testComputeDrift.ts` | full | clean — ahead / behind / on-track / grew-past-anchor all covered |
| `debt/testShouldPromptPaydayCapture.ts` | full | clean — the recency window is asserted on both sides (21d prompts, 22d does not) |
| `debt/testParseDebtFormValues.ts` | full | clean — `APR exactly 100 accepted` and `minimum == balance accepted` are the boundary rows |
| `debt/testReconcileAutopay.ts` | outlined | clean — the failed / manual / not-yet-due contrast cases are all present |
| `debt/testDeriveRequiredActionView.ts` | outlined | clean — the BNPL breakdown **refuses** to claim `N × $X` when the final installment is balance-capped, which is the correct refusal |
| `obligations/testEffectiveObligationAmount.ts` | full | clean — the non-finite `fullAmount` guard is pinned |
| `obligations/testClassifyDeferability.ts` | full | clean — its header carries an explicit correction of its own earlier wrong claim |

### `apps/rn/tests/e2e/**` — 31 specs

⭐ **A machine pass was run over all 31**, splitting each file into `test()` blocks and flagging any block
whose first absence assertion (`toHaveCount(0)`, `not.toBeVisible`, `not.toHaveAccessibleName`,
`toBeHidden`) precedes every positive one — brief reading rule 7, the class that has shipped green over a
planted bug twice in this repo.

```
specs scanned: 31   blocks flagged: 5
  data-recovery.spec.ts:179 · :195 · :221 · on-plan-streak.spec.ts:23 · variable-income.spec.ts:79
```

⛔ **All 5 flags were FALSE, and each was checked by reading rather than reported as a count.** Three were
my splitter mis-attributing a block boundary; one (`on-plan-streak:23`) is `D3-5`'s own fix and carries
both the positive-first line and a comment forbidding the "fix" of adding a second absence assertion; one
was my positive-matcher missing `toHaveValue`. ⚡ **Running the control on the verifier is what turned 5
findings into 0** — a flag over a file the checker mis-parsed looks exactly like a real finding.

**Result: no unguarded absence assertion on any of the 31 specs on my route**, and zero
`test.skip` / `test.fixme` / `test.only` anywhere in `apps/rn/tests/e2e/`.

| path | origin | how swept |
|---|---|---|
| `data-recovery.spec.ts` | **off-surface** | read (helpers + every flagged block + the `B4` block in full) · **EXECUTED, 21/21 green at the pin** · **plant-verified** (§2c) |
| `amount-guards.spec.ts` | fix-churn | read in full · `S1P3-B2-APRBOUND` plant-verified · ⚠️ its coverage gap is **`A-F5`** |
| `on-plan-streak.spec.ts` | fix-churn | read in full · `S1P3-D3-5` plant-verified |
| `trust-claims.spec.ts` | first-look | read 130/280 (`C-1`, `C-1 control`, the three `C-2` blocks) · six registered guards plant-verified in §2(b) |
| `bnpl.spec.ts` | first-look | read in full · `S1P3-D3-8` plant-verified |
| `payoff-schedule.spec.ts` | first-look | read in full |
| `strategy-compare.spec.ts` | first-look | read in full |
| `trajectory-domain.spec.ts` | first-look | read in full |
| `saveforit-pace.spec.ts` | first-look | read in full |
| `vis5-cone.spec.ts` | first-look | read in full |
| `sheet-remove.spec.ts` | first-look | read in full |
| `a11y-row-labels.spec.ts` | first-look | read in full |
| `ack-coordinator.spec.ts` | first-look | read in full |
| `blur-glass.spec.ts` | first-look | read in full |
| `proofofwork.spec.ts` | first-look | read in full |
| `enh-audit-screens.spec.ts` | first-look | read in full — 10 of its 11 tests are **capture-only by design**, see §5 |
| `absorb-entry.spec.ts` | first-look | read 60/87 |
| `money-add-chooser.spec.ts` | first-look | read 60/116 |
| `swipe-delete.spec.ts` | first-look | read 60/116 |
| `variable-income.spec.ts` | first-look | read (the flagged block in full) |
| `a11y-axe` · `analytics-optout` · `celebration` · `earlyjourney` · `greeting` · `hero-date-fit` · `ipad-layouts` · `payday-reopen` · `premium-entry` · `spoken-state` · `trajectory-interactivity` | first-look | **docblock read + machine-scanned + executed** in the full-suite run. ⚠️ **Not read line by line — see §6.** |

**Baselines established at the pin, in the worktree, before any plant:**

```
npx tsx packages/core/testing/runRegressionTests   → EXIT=0  "✅ All regression tests passed."
npx tsx apps/rn/src/testing/runAppTests.ts         → EXIT=0  "✅ App-layer regression tests: ALL PASSED."
npx tsx apps/rn/src/testing/runScenarioTests.ts    → EXIT=0  "✅ Scenario tests: ALL PASSED."
CI=1 npx playwright test … data-recovery.spec.ts   → 21 passed (2.1m), against a FRESHLY rebuilt dist/
```

⛔ **All three unit suites are green at the pin while `A-F3` and `A-F4` are both live in
`packages/core`.** That is not a footnote — it is the measurement saying these two are invisible to the
suite that owns them, and it is why both are stated as blockers rather than as code smells.

---

## 5. Measured, and NOT a defect

1. **`buildCycleSnapshot` can report MORE than the balance fell, and that is the contract.**
   Measured — a $100 debt, its $80 minimum paid, plus a $50 recorded snowball:
   `balance 100 → 0` (paydown $100) while `snapshot.totalPaidThisCycle = 130`. That reads like `A2`'s
   invariant broken in the other direction and it is not: `historySelectors.ts:46` states it outright —
   *"Summing `totalPaidThisCycle` is **payments recorded**, so it excludes interest and can read LOWER
   than the balance drop."* The snapshot answers *what did the user pay*, not *what did the balance do*,
   and `PaydayCaptureSheet.tsx:437` lets the user type the real figure. ⚠️ Recorded so pass 5 does not
   re-open it: **beat it with a measurement, not a reading.**
2. **`projectForecast.ts` and `buildSmartInsights.ts` are LEGACY-ONLY.** Every production consumer was
   enumerated: both are imported by `components/SnowballSection.tsx` — the Capacitor tree — and by nothing
   under `apps/rn`. `analysisSelectors.ts:139` says outright that Smart Insights is *"intentionally NOT
   surfaced (2.2.5 scrapped, Jason 2026-07-22)."* ⚡ **Pass-3 `B1`'s fix is real, and its user-facing
   consequence is confined to a surface 2.0 does not ship.** Not a defect and not an argument against the
   fix — `lint:money` should still cover the file — but it is worth knowing what the closure bought.
3. **`buildSmartInsights`' "the clamp is dead by construction" claim is TRUE, checked branch by branch.**
   All six money expressions reaching `formatInsightCurrency` are provably non-negative:
   `Math.abs(projectedBuffer)` and `|pb| + 200` (`:44,:48`) · `min(safeExtra, 200 − pb)` behind
   `amountToHold > 0` (`:53,:58`) · `pb` itself in branches gated `pb ∈ [0,200)` and `pb ≥ 200` · `gap`
   behind `Math.max(0, …)` (`:88`) · `snowballInterest − avalancheInterest` behind
   `avalancheInterest < snowballInterest` (`:105`). Brief reading rule 1 forbids citing a docblock as
   proof; this one was checked, and it is right.
4. **`enh-audit-screens.spec.ts`'s 10 screenshot tests assert nothing, deliberately.** Its own header:
   *"Not a pass/fail spec — it just captures."* The 11th (the Notifications toggle) is a real assertion.
   A capture harness that does not pretend to be a gate is not a blinded gate.
5. **`bnplInstallmentsInWindow`'s `Infinity` cap does not hang.** With `remainingPayments` absent the loop
   is bounded by the window end, not by the cap — 16 iterations for a 6-month-stale biweekly plan, 348 for
   a 6-year-stale weekly one. The defect in `A-F3` is the **count**, not a spin.
6. **The `DebtSheet` APR bound covers ADD and EDIT with one line.** `money.tsx:330,461` and
   `index.tsx:789` all mount the same `DebtSheet` with an `editing` prop, so pass-3 `B2`'s *"add/edit
   form"* is one site rather than two, and `DebtSheet.tsx:230` is it. The genuinely separate second RN
   hand-entry path is the onboarding form — that is `A-F5`.
7. **The `payoff-schedule` and `strategy-compare` specs already close the traps they were written for**,
   and are worth not re-litigating: `strategy-compare` pins a *shape* regex after `text.length > 0`
   shipped the literal string `"."` on 16 of 960 portfolios, and forbids any `$|interest|cheaper|save` in
   the takeaway per `[D59]`; `payoff-schedule` refuses to assert viewport coordinates and explains why the
   earlier draft's `y + height <= viewportH` passed by accident.

---

## 6. NOT REACHED — by path

⛔ Silence reads as swept, so this is stated by path.

1. **Eleven route specs were read only by docblock + machine scan, not line by line:**
   `a11y-axe.spec.ts` (229 lines) · `celebration.spec.ts` (233) · `analytics-optout.spec.ts` ·
   `earlyjourney.spec.ts` · `greeting.spec.ts` · `hero-date-fit.spec.ts` · `ipad-layouts.spec.ts` ·
   `payday-reopen.spec.ts` · `premium-entry.spec.ts` · `spoken-state.spec.ts` ·
   `trajectory-interactivity.spec.ts`. All eleven were covered by the absence-assertion scan and all were
   executed in the full-suite run, and none is a money-figure spec — but **a line-by-line read would ask
   the question the scan cannot: which member of its class each one picked.** They are the natural first
   target for pass 5's auditor A.
2. **Partial reads, named with the fraction:** `trust-claims.spec.ts` 130/280 (the `C-3`…`C-6` blocks were
   plant-verified in §2(b) but not re-read this pass) · `data-recovery.spec.ts` ~300/673 read, though
   **all 21 of its tests were executed** · `absorb-entry` 60/87 · `money-add-chooser` 60/116 ·
   `swipe-delete` 60/116.
3. **`testReconcileAutopay.ts` and `testDeriveRequiredActionView.ts` were outlined by assertion label, not
   read line by line** — 434 lines between them. Every assertion label was read and the contrast cases are
   present; their fixture bodies were not audited for the picked-the-working-member shape.
4. ⛔ **No whole-monorepo typecheck was run, per RESUME-PROTOCOL rule 3, so no finding here is
   typecheck-backed.** `A-F1`'s proposed remedy — making the window fields required — is exactly the kind
   of claim a scoped `tsc -p` would settle, and it was not run. It is stated as a hypothesis for that
   reason.
5. **The Maestro lane was not run.** `apps/rn/.maestro/01-launch-smoke.yaml` was **read** — it is the only
   thing in the tree that touches `field-onboarding-apr`, and it types the valid `26.99` — but no
   simulator or device flow was executed.
6. **Files a finding depends on but which are NOT on my route, and are therefore not swept:**
   `packages/core/debt/buildPayoffTrajectory.ts` · `packages/core/debt/bnplPayoffPace.ts` ·
   `packages/core/debt/calculateMonthlyInterest.ts` · `packages/core/recurrence/rolloverPayCycle.ts` ·
   `packages/core/imports/debtCsv.ts` · `apps/rn/src/components/ui/DateField.tsx` ·
   `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx` · `apps/rn/src/store/payoffSelectors.ts` ·
   `apps/rn/src/store/selectors.ts`. Each was read **only** at the lines a finding depends on.

---

## Isolation and restore — verified, not assumed

Every plant in this report was applied in the detached worktree `/c/Users/Jason/audit-a-wt` at `e65f9c7`
and reverted with `git checkout --` before the next one, each restore confirmed with
`git status --porcelain`. **No file in `/c/Users/Jason/debt-app-v1` was edited, committed or pushed
outside this `docs/audits/` report.** Final verification is at the very bottom.


### Final verification

```
# the worktree every plant ran in — clean, and still at the pin
git -C /c/Users/Jason/audit-a-wt status --porcelain     -> (empty)
git -C /c/Users/Jason/audit-a-wt rev-parse HEAD         -> e65f9c7861737829f0ffb1fa3f36d5f73d54b567

# the live repo — 0 bytes off the pin across every source tree
git -C /c/Users/Jason/debt-app-v1 diff --stat e65f9c7 -- apps packages scripts   -> (empty)
git -C /c/Users/Jason/debt-app-v1 status --porcelain    -> only docs/audits/**/*.md (this report)

# RESUME-PROTOCOL rule 4 — no server left listening
netstat -ano | grep 4319 | grep LISTENING              -> none; 4319 is free
```

⚠️ **Both plants that touched files outside `packages/core` are named here so they can be re-checked:**
`apps/rn/src/storage/createAdapter.web.ts` (§2c, `B4`) and
`apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx` (`A-F5`). Both were reverted with
`git checkout --` **and the revert was verified by re-reading the restored line**, not by assuming the
command worked.

**Every plant, in order, each reverted before the next:**
`projectDebtPayoff.ts` (`A1`) · `bnplInstallment.ts` (`A4`) · `buildCycleSnapshot.ts` (`A2`) ·
`apps/rn/src/store/payday.ts` (`A-F1`) · `getDebtsWithDisplayBalances.ts` (`A5`) · `amountField.ts` (`M4`) ·
`buildSmartInsights.ts` (`B1`) · `trustSelectors` (`C-1`/`C-2`/`C-4`/`C-6`) · `selectHistorySummary` (`C-3`) ·
`DebtSheet.tsx` (`B2`) · `ON_PLAN_STREAK_MIN` (`D3-5`) · the BNPL calendar subtotal (`D3-8`) ·
`createAdapter.web.ts` (`B4`) · `FirstDebtOrBillStep.tsx` (`A-F5`).

### RESUME-PROTOCOL compliance

| rule | how it was met |
|---|---|
| 1 · `--max-old-space-size=1536` everywhere | every `node`/`npx` invocation in this report carried it |
| 2 · an OOM is a finding, never a retry | **no OOM occurred this run.** ⚠️ Worth recording anyway: free memory was measured at **706 MB of 6,111 MB** before the first e2e attempt — the condition that ended the first dispatch. The Playwright work was therefore **serialised**, one command at a time, with nothing else running |
| 3 · never a whole-monorepo typecheck | none run — see §6.4 for what that costs `A-F1` |
| 4 · kill every server started | Playwright owned the lifecycle (`CI=1` → `reuseExistingServer:false`); 4319 verified free after each of the three runs |
| 5 · no sub-agents | none spawned |
| 6 · keep writing incrementally | `A-F3` and `A-F4` were each appended to this file the moment they were measured, before the next probe |
| 7 · stay in your own tree | all work in `/c/Users/Jason/audit-a-wt` |
| 8 · verify every restore | `git status --porcelain` after each, plus a re-read of the restored line for the two app-tree plants |
