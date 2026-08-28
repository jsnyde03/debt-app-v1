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
| **A1** - `cannotAmortize` vs. the shrinking minimum sum | **CLOSED** | Restored the pre-fix body (`monthlyPaymentTotal = sum of active minimums + extra`, `96d1f11`'s exact text) and re-pointed the call at `monthlyExtraPayment`. `test:regression` EXIT=1. **Printed with the defect live:** `date= "Unable to estimate"  months= 5`, while `buildPayoffTrajectory` on the same inputs clears at **30** - pass 3's description reproduces exactly. Restored to EXIT=0. |
| **A2** - `buildCycleSnapshot` sums the unscaled BNPL minimum | **CLOSED** (helper) - but see finding **A-F1** | Replaced `effectiveMinimumInWindow(debt, windowStartISO, windowEndISO)` with `debt.minimumPayment`. `test:regression` EXIT=1 on the registered token: `FAIL [History reports the money the rollover actually deducted (S1P3-A2)]: expected 200, got 100`. The control assertion above it (`actuallyPaidDown === 200`, pinned to what the rollover really deducts) fires **first and passes**, so the token line is the one that carries the finding. The same defect restored at the CALL site instead of the helper is silent - see A-F1. |
| **A4** - `bnplMonthlyEquivalentMinimum` gated on `type` while the per-cycle seams gated on `isInstallmentNative` | **CLOSED** | Reverted `hasKnownBnplCadence` to `return isInstallmentNative(debt)`. `test:regression` EXIT=1. Relaxing the two earlier `S1P3-A4` assertions and re-running reds the **registered** line on its own: `FAIL [...and PAID DOWN by the same amount, so reserve and paydown stay in lockstep (S1P3-A4)]: expected 200, got 100`. Printed with the defect live: `inWindow= 0`, `reserved= 100`. **Reachability of the named door re-checked against current code:** `packages/core/imports/debtCsv.ts:232` makes `dueDate` **required**, so every CSV-imported BNPL satisfies the new `hasKnownBnplCadence`. |

### (b) `S1P3-*` guard entries whose guard or guarded code is in `packages/core/**` or `apps/rn/tests/**`

| entry | guard file | verdict | measurement |
|---|---|---|---|
| `S1P3-A1-BUDGET` | `packages/core/debt/testDebtProjection.ts` | **CLOSED** | Token line (`the debt-free DATE and the payoff CHART agree on the same plan`) reds **on its own** once the two earlier `S1P3-A1` assertions are relaxed: `expected 5, received 30`. |
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
| `S1P3-B2-APRBOUND` | `apps/rn/tests/e2e/amount-guards.spec.ts` | **CLOSED** | Deleted `if (aprN > 100) return setError(FORM_ERRORS.aprOutOfRange);` from `DebtSheet.tsx:230`. The registered token line - `expect(page.getByText('Enter an APR between 0 and 100.')).toBeVisible()` - is the line that reds. |
| `S1P3-D3-5` | `apps/rn/tests/e2e/on-plan-streak.spec.ts` | **CLOSED**, with a caveat | Lowered `ON_PLAN_STREAK_MIN` to 1. The test reds - but at `:33` (the absence assertion), **not** at the registered token `:32` (`progress-hero-journey` toBeVisible), which passes. The token is a **presence** pin: it reds only through `lint:finding-guards` if the positive-first line the fix ADDED is deleted. That is the correct thing to pin for this fix, and it is worth saying out loud that the line itself never reds behaviourally. |
| `S1P3-D3-8` | `apps/rn/tests/e2e/bnpl.spec.ts` | **CLOSED** | Planted the calendar subtotal to `formatCurrency(0)`. The registered regex line `:87` reds. **And the neighbouring `C-6 control` in `trust-claims.spec.ts` stayed GREEN through the same plant** - which is exactly the gap D3-8 was filed to close, measured rather than assumed. |
| `S1P3-B4-E2E` | `apps/rn/tests/e2e/data-recovery.spec.ts` | see (c) below | |
| `S1P3-C7-LOSSES` / `S1P3-C7B-CLOUDDOOR` | `apps/rn/src/data/readBackup.test.ts` | **ROUTED AWAY** - guard file and guarded code are both lane B | listed so pass 5 can see they were consciously routed, not missed. |


---

## 3. Findings tally by origin

_(at end)_

---

## 4. Swept and found clean — BY PATH

_(at end)_

---

## 5. Measured, and NOT a defect

_(at end)_

---

## 6. NOT REACHED — by path

_(at end)_
