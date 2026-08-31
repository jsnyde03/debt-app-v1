# A2 — packages/core/debt (the debt engine)

Pass 6 blind adversarial audit. Lane A2. 54 files.

## A2-1 — `blocker` — the per-debt Payoff-schedule sheet says a debt "never gets paid off" while the app's own headline date and payoff chart clear it

**Origin:** `packages/core/debt/buildAmortizationSchedule.ts` — `stale-read`.

**User-facing consequence.** A user opens a debt's *Payoff schedule* sheet and reads, in place of the
schedule:

> **"At $50.00/mo the interest outpaces the balance, so this debt never gets paid off. Increasing the
> payment fixes it."**

(`apps/rn/src/components/entities/AmortizationView.tsx:66-70`.) On the Payoff screen one tap away, the
same store's headline reads **February 2029** and the payoff chart descends to `{month: 30, balance: 0}`.
Both are computed from the same debts. The sheet is the false one — the plan really does clear this debt,
because the freed car-loan minimum rolls onto it (the defining snowball/avalanche mechanic).

**File and line.** `packages/core/debt/buildAmortizationSchedule.ts:61` —

```ts
if (monthlyPayment <= calculateMonthlyInterest(balance, apr)) {
    return { rows, totalInterest: 0, totalPaid: 0, monthsToPayoff: 0, payoffPossible: false };
}
```

Called from `apps/rn/src/store/analysisSelectors.ts:183` (`selectDebtAmortization`), which passes
**`baseMonthly + (isFocus ? monthlyExtra : 0)`** — i.e. a NON-focus debt is amortised against its own
minimum alone, with none of the portfolio budget.

**The measurement.** One store, the portfolio `cannotAmortize.ts`'s own docblock names (`$2,000` car @ 5%
min $500 + `$10,000` Visa @ 25% min $50), `monthlyExtraPayment: 0`, avalanche, `startDate 2026-08-31`:

```
HEADLINE date       : February 2029 months: 30      (projectDebtPayoff)
CHART last point    : {"month":30,"balance":0} points: 31   (buildPayoffTrajectory)
cannotAmortize(port): false
VISA sheet          : {"payoffPossible":false,"rows":0,"monthsToPayoff":0,"totalInterest":0,"totalPaid":0}
```

Visa monthly interest = `10000 × 0.25/12` = **$208.33** against its own **$50** minimum, so the sheet's
guard fires; the plan's budget is **$550**, so `cannotAmortize` does not.

**Mechanism (hypothesis).** `cannotAmortize.ts` was extracted in `S1.11.4.5` to be the ONE producer of the
negative-amortisation judgment "for the date and the chart both", and its docblock states the
`monthlyBudget > 0` half is "load-bearing and must not be dropped". **`buildAmortizationSchedule` is a
third producer that was never collapsed into it** — it does not import `cannotAmortize`, it re-derives the
comparison inline, and it is missing that half. Its own comment at line 19-20 claims it "mirrors
projectDebtPayoff's `cannotAmortize`", which is a carried premise: `projectDebtPayoff` has called the
shared function since `S1.11.4.5` and this file still has not. The measured drop-out of the missing half:
`cannotAmortize([{balance:500,apr:0}], 0)` returns **`false`** (payable) while
`buildAmortizationSchedule({balance:500, apr:0, monthlyPayment:0})` returns **`payoffPossible: false`** —
the same two-producer disagreement the extraction was written to end.

⚠️ The deeper half of the hypothesis is that the guard is asking the wrong question at all: this sheet
renders a debt inside a snowball/avalanche plan, where a debt's *own* minimum is never what pays it off.
`selectDebtAmortization` gives the extra only to `isFocus`, so **every non-focus debt whose minimum is
below its own interest** — the ordinary low-minimum high-APR card sitting second in the order — gets this
copy. That is a class, not this instance.

**Remedy — UNVERIFIED.** Do not simply swap in `cannotAmortize`: it would return the same verdict for the
same single-debt input, because the input is the problem. The class fix is to decide what this sheet is
*for* — a single-debt "if you only ever paid this minimum" schedule (in which case the copy is honest and
the two screens must be reconciled in COPY, not in math) or this debt's slice of the plan (in which case
`selectDebtAmortization` must be handed the portfolio budget the plan actually spends on it). Triage
should route this with `A2-2`, since both are the same missing collapse.

## A2-2 — `blocker` — after an extra payment on a BNPL, renaming the plan silently rewrites its balance by up to half an installment, in either direction

**Origin:** `packages/core/debt/applyRolloverPayment.ts` — `stale-read` (the write-back seam
`apps/rn/src/store/store.ts:482` is the co-conspirator).

**User-facing consequence.** A user puts an extra $60 on a $400 Klarna 4-pay this cycle. The plan's real
remaining balance is **$240**. They later open the debt and change *anything at all* — the name, the
provider, the due date — and the stored balance becomes **$200**. **$40 of debt is deleted** and never
appears again; the app then tells them they are $40 further along than they are, and the payoff date,
the chart, the journey ring and History all move with it. Put an extra **$40** on instead and the error
runs the other way: a true **$260** is rewritten to **$300** — $40 of debt invented.

**File and line.** `packages/core/debt/applyRolloverPayment.ts:17` —

```ts
const remaining = Math.max(0, Math.round(debt.balance / (debt.scheduledPaymentAmount as number)));
```

`Math.round`, on a ratio that an extra payment makes fractional. The result is persisted
(`apps/rn/src/store/payday.ts:103` maps `applyRolloverPayment` over the debts and writes `debtsAfter`),
and `apps/rn/src/store/store.ts:482` runs `normalizeBnplInstallment({ ...existing, ...updates })` on
**every** `updateDebt`, which re-derives `balance := scheduledPaymentAmount × remainingPayments`
(`packages/core/debt/bnplInstallment.ts:49`).

**The measurement.** One store — Klarna, `$400`, `scheduledPaymentAmount: 100`, `remainingPayments: 4`,
`recurrence: biweekly`, window `2026-08-28 → 2026-09-11`, minimum paid:

```
start: balance=$400 (4 x $100)

extra $40 paid:
  persisted after rollover : balance=$260  remainingPayments=3  "payment 2 of 4"
  after ANY updateDebt     : balance=$300   <-- delta $40.00

extra $60 paid:
  persisted after rollover : balance=$240  remainingPayments=2  "payment 3 of 4"
  after ANY updateDebt     : balance=$200   <-- delta $-40.00
```

The same rounding also breaks the BNPL calendar *before* any edit: at `$240`/`remaining 2`,
`buildBnplSchedule` emits **2 rows totalling $200** against a $240 balance, captioned *"payment 3 of 4"*.
At `$260`/`remaining 3` it emits **3 rows totalling $300** against $260.

**Mechanism (hypothesis).** `bnplInstallment.ts`'s own header states the invariant that makes this safe:
*"when installment data exists, balance can't drift from scheduled × remaining because it's derived."*
That invariant holds only while the **balance moves in whole installments**, which is exactly what an
extra snowball payment breaks — and `applyRolloverPayment` accepts `completedSnowballAmount` as its
second parameter, so the two halves of the file are in contradiction. `Math.round` then makes the derived
count the *nearest* whole installment rather than the *ceiling*, so a residue below half an installment
is rounded away and one above it is rounded up; `normalizeBnplInstallment` afterwards treats the count as
the truth and rewrites the balance to match. `bnplPaymentsRemaining` (line 63) carries the identical
`Math.round`, so the "N of M" caption on Money and in the calendar drifts with it.

⚠️ A BNPL is the smallest-balance debt in most portfolios, so snowball puts the extra there **first** —
this is the default path, not a corner. `roundMoney` is not a defence: the residue is dollars, not cents.

**Remedy — UNVERIFIED.** `Math.ceil` fixes the direction of the calendar and the caption but does **not**
fix the balance rewrite: `ceil(240/100) = 3` → `normalizeBnplInstallment` would write `$300`, inventing
$40. The real question is which of `balance` and `remainingPayments` is canonical once they can disagree,
and `bnplInstallment.ts` currently answers *both* (the header says the installment fields are canonical;
`bnplPaymentsRemaining` says the balance is). Triage should decide that, not patch the rounding.

## A2-3 — `major` — the BNPL calendar shows one installment of four for a `per-paycheck` plan, and captions it "payment 1 of 4"

**Origin:** `packages/core/debt/bnplSchedule.ts` — `stale-read`.

**User-facing consequence.** The consolidated *"when do my BNPL hit?"* calendar — whose stated job is
"every upcoming installment, sorted by date" — lists **one $100 charge** for a `per-paycheck` Klarna plan
that still owes $400 over four installments, and labels that single row **"payment 1 of 4"**. Three
charges the user has committed to, and which the allocator reserves against, are simply absent from the
screen built to show them.

**File and line.** `packages/core/debt/bnplSchedule.ts:56-58` —

```ts
const next = advanceDueDateOnce(due, d.recurrence);
if (next === due) break; // one-time / per-paycheck — a single installment
due = next;
```

**The measurement.** One store — the Klarna above with `recurrence: 'per-paycheck'`, `balance: 400`,
`remainingPayments: 4`, `fromISO: 2026-09-01`:

```
rows: 1  [{"date":"2026-09-04","amount":100,"paymentNumber":1,"totalPayments":4}]
bnplPaymentsRemaining = 4   bnplPaymentsTotal = 4
```

**Mechanism (hypothesis).** The `next === due` break is correct for `one-time` — one charge is all there
is — and was written for it; `per-paycheck` was folded in behind the same condition because
`advanceDueDateOnce` cannot advance it without knowing the user's pay cycle. But `per-paycheck` is a
genuine recurring cadence: `bnplPayoffPace.ts` resolves it from `cyclesPerMonth` precisely *because*
`S1.12.5.5` measured that treating it as anything fixed puts a false debt-free date on the screen, and
that file's own note says a `per-paycheck` plan is "one installment per PAY CYCLE, whatever that cycle
is". `buildBnplSchedule` takes no pay-cycle argument at all, so it has no way to step one — which makes
the omission structural rather than a missed branch. The class to check in triage: **`per-paycheck` is
resolved from the pay cycle in the payoff engines and collapsed to "does not recur" in the calendar and
in `bnplInstallmentsInWindow`'s skip loop** (`bnplInstallment.ts:207`, which returns 0 for a
`per-paycheck` plan whose due date has fallen behind the window).

**Remedy — UNVERIFIED.** Threading `payCycle` into `buildBnplSchedule` and stepping by
`getNextPaycheckDate` would enumerate the rows, but I did not measure whether the calendar's callers hold
the pay cycle, nor whether the same change is safe inside `bnplInstallmentsInWindow`'s termination guard
— where `next === due` is what stops an infinite loop, and the comment at line 205 says so.

## A2-4 — `minor` — the debt-free DATE and the payoff CHART have different tolerances to a missing `apr`, on the one pair `S1.11.4.5` collapsed so they could not disagree

**Origin:** `packages/core/debt/projectDebtPayoff.ts` — `fix-churn` (and `buildPayoffTrajectory.ts`,
`fix-churn`).

**User-facing consequence.** If a debt ever reaches the engines with a non-finite `apr`, the headline
reads **"September 2026 · 1 month"** over a chart that says the same debt takes **50 months** — the exact
date-vs-chart contradiction `A-F4` was filed for, from a different input.

**File and line.** `packages/core/debt/projectDebtPayoff.ts:109` — `apr: debt.type === "bnpl" ? 0 :
debt.apr` (raw) — against `packages/core/debt/buildPayoffTrajectory.ts:54` — `apr: d.type === "bnpl" ? 0
: (d.apr ?? 0)`.

**The measurement.** One debt, `$5,000`, `minimumPayment: 100`, snowball, no extra:

```
apr=undefined  DATE="September 2026" (1mo, interest=NaN)  CHART clears at month 50 balance 0
apr=NaN        DATE="September 2026" (1mo, interest=NaN)  CHART clears at month 600 balance NaN
```

`?? 0` saves the chart from `undefined` and not from `NaN`; `projectDebtPayoff` has neither. The "1 month"
is not a rounding artefact — `calculateMonthlyInterest` returns `NaN` (its guard is `apr <= 0`, false for
`NaN`), the balance becomes `NaN`, `projectedDebts.some(d => d.balance > 0)` is then `false`, and the
`while` exits after one iteration with `months = 1`.

**Reachability — I could not reach it, and I checked the three doors.** `parseDebtFormValues.ts:24`
requires `Number.isFinite`; `debtCsv.ts:281` refuses a non-finite APR by name
(*"could not read APR … leave it blank for 0%"*); and `apr` is in `REPAIRABLE_MONEY_FIELDS.debt.required`
(`apps/rn/src/data/migrations.ts:247`), so a restored blob repairs it to `0`. **So this is filed as a
latent divergence, not a live defect** — but it is a divergence between the two functions that
`cannotAmortize.ts`'s docblock says exist as one producer specifically so *"the date and the chart"*
cannot disagree, and their guards against the same missing field are three different strengths (none,
`?? 0`, and `Number.isFinite` upstream). The class worth checking in triage is which *other* fields the
two engines read with different nullish tolerance.

**Remedy — UNVERIFIED.** Not `?? 0` on both: that makes an unreadable rate silently 0%, which
`debtCsv.ts:237`'s comment calls out as *"a wrong PLAN, which is worse than a skipped row"*. The two
engines agreeing matters more than which way they agree.

## A2-5 — `minor` — `computeDrift` is called by nothing in the shipping app, while `buildDriftBaseline` writes up to 601 points into persisted storage on every re-anchor

**Origin:** `packages/core/debt/computeDrift.ts` — `fix-churn`.

**User-facing consequence.** None visible — and that is the finding. The Drift Tracker headline the file
documents (*"you're ~N days behind the plan the engine authored for you"*, the "premium_plus
accountability carrot") is computed nowhere a user can see. What DOES ship is the write half: every
re-anchor persists a frozen `projectedPoints` array that nothing reads.

**File and line.** `packages/core/debt/computeDrift.ts:93` (`computeDrift`) and `:137`
(`buildDriftBaseline` → `buildPayoffTrajectory`). The only app import is
`apps/rn/src/store/drift.ts:1`, and it takes **`buildDriftBaseline` and `shouldReAnchor` only**.

**The measurement.** Repo-wide, `computeDrift(` appears in `packages/core/debt/computeDrift.ts` (the
definition) and `packages/core/debt/testComputeDrift.ts` (its test) — and in no component, selector or
screen in either tree. `daysBehind` has **zero occurrences anywhere under `apps/rn/src`**. Meanwhile one
ordinary debt (`$22,000` Visa @ 24.99%, `$500` minimum, no extra) produces:

```
projectedPoints length: 122 | JSON bytes of baseline: 4979
```

and `buildPayoffTrajectory`'s horizon is 600, so a longer plan writes proportionally more. `drift.ts:54`
re-anchors on any debt add/remove, strategy switch, or >10% extra-payment change.

**Mechanism (hypothesis).** The baseline recorder (§3.5) shipped and the reader (§C.4) did not, so the
file's header — which describes the feature in the present tense and points at
`docs/V17_DRIFT_TRACKER_SPEC.md` — is a carried premise about a surface that does not exist yet. The
secondary effect is that `computeDrift`'s test is the only thing exercising it, so its behaviour at the
edges is unpinned by any consumer: with an unparseable `anchorDate` it returns
`{daysBehind: NaN, dollarsBehind: <full balance>, projectedBalanceToday: 0, onTrack: true, status:
"on_track"}` — `daysBetween` here has no `Number.isNaN` guard, though the sibling `projectCurrentBalance.ts:31`
does. That will be a live defect on the day the reader is wired, and it will read *"on track"* while
printing `NaN`.

**Remedy — UNVERIFIED.** Either wire the reader or stop persisting the payload; I did not measure whether
anything else (a future screen, a backup fixture, a gate) depends on `projectedPoints` being present.

## A2-6 — `major` — every tolerance assertion in the debt engine's tests passes silently on `NaN`, and prints a green tick over it (PLANTED)

**Origin:** `packages/core/debt/testProjectCurrentBalance.ts` (`fix-churn`) and
`packages/core/debt/testComputeDrift.ts` (`fix-churn`); the same shape recurs in
`packages/core/testing/testDebtMathRegression.ts`, `testForecastRegression.ts`,
`testRecommendedActionsRegression.ts` and `packages/core/payCycle/testPayCyclesPerMonth.ts`.

**User-facing consequence.** A regression suite that exists to keep `$NaN` off the money screen cannot
see `$NaN`. `apps/rn/src/data/migrations.ts`'s own docblock calls a `$NaN` on the money screen *"the
loudest possible version of the quiet defect blocker #1 was"* — and the gate over the premium projected
balance reports **`✓`** for it.

**File and line.**

```ts
// packages/core/debt/testProjectCurrentBalance.ts:19-24
function assertApprox(actual: number, expected: number, label: string, tolerance = 0.05) {
  if (Math.abs(actual - expected) > tolerance) { throw ... }
  console.log(`  ✓ ${label}`);
}
// packages/core/debt/testComputeDrift.ts:8-12  — same shape, no tick
```

`Math.abs(NaN - x) > tol` is `NaN > tol`, which is **`false`**, so the throw is unreachable for any
`NaN` actual and the tick prints.

**The measurement — planted, run green-then-red, output read (not exit code).**

*Plant 1.* `packages/core/debt/projectCurrentBalance.ts:86`,
`return roundMoney(Math.max(0, balance));` → `return Number.NaN;`. Plant verified present by `grep`.
Running `packages/core/debt/testProjectCurrentBalance.ts`:

```
  ✓ partial month accrues prorated interest only (balance ticks up mid-month)
  ✓ one whole month applies a full interest+minimum step, then prorates the remainder
Error: FAIL [negative amortization: balance grows when interest exceeds the minimum ...]: expected true
```

**Both money assertions that reach the plant print `✓` over `NaN`.** The four before them return through
early guards and never reach it. The suite reds only at the *seventh* assertion — and only because that
one is `assertTrue(negAm > 10000)`, a comparison rather than the tolerance form. `assertApprox(negAm,
10154.69, "negative-amortization projected value")` on the very next line would not have.

*Plant 2.* `packages/core/debt/computeDrift.ts:105`,
`const daysBehind = Math.round(...)` → `const daysBehind = Number.NaN;`. Running
`packages/core/debt/testComputeDrift.ts`:

```
Error: status behind failed. Expected behind, received on_track
    at runComputeDriftTests (.../testComputeDrift.ts:44:3)
```

Line 44 is reached, so **line 43 — `assertClose(behind.daysBehind, 59, 1, "days behind (positive)")`, the
assertion whose label is literally about `daysBehind` — did not fire.** What caught it was the derived
`status`, and only because `NaN > 14` and `NaN < -14` are both false so it falls through to `on_track`.
⚠️ The comment at `testComputeDrift.ts:59` claims the `grew` case proves the value is *"never
NaN/negative-month"*; the assertion under that claim (line 61) is the same NaN-blind `assertClose`.

**Restores verified.** Both files restored from a copy taken after the plant; `cmp` reports identical and
`git status --porcelain` is empty for both.

**Mechanism (hypothesis).** The tolerance form was written for float drift, where `>` is the right
comparison, and `NaN` was never in scope — but `NaN` is the failure mode this repo actually keeps hitting
(five formatters in pass 5, `readMoney`'s whole existence, `parseDebtFormValues`' docblock). The class is
"every comparison-based assertion in the suite fails open on NaN"; `assertEqual`/`assertMoney`, which use
`!==`, are NaN-safe by accident of operator choice rather than by design, which is why the two forms
coexist without anyone noticing the asymmetry.

**Remedy — UNVERIFIED.** Adding `if (!Number.isFinite(actual)) throw` to each helper is the obvious move,
but there are at least six copies of the helper in three directories and I did not check whether any
current test legitimately asserts on a non-finite value. This is a by-class fix (`S1.13.7`), not a
by-file one — and the right shape is probably one shared assertion module, since the six copies are how
the asymmetry survived.

## A2-7 — `major` — the amortisation↔payoff reconciliation gate can only ever run the arity where the two engines agree

**Origin:** `packages/core/debt/testAmortizationSchedule.ts` — `fix-churn`.

**User-facing consequence.** The gate that exists to prove the per-debt schedule reconciles with the
debt-free date reports green over `A2-1`, in which they contradict each other on the screen.

**File and line.** `packages/core/debt/testAmortizationSchedule.ts:42-75` and `:150-160`.

**The measurement.** All five reconciliation cases are **single-debt**, and every one passes
`monthlyPayment: testCase.minimumPayment + testCase.extra` — i.e. the schedule is always handed the
payment `projectDebtPayoff` pours onto its one, necessarily-focus debt:

```ts
const reconciliationCases = [
  { balance: 5000,    apr: 22,    minimumPayment: 100, extra: 300  },
  { balance: 12000,   apr: 27.99, minimumPayment: 250, extra: 150  },
  { balance: 800,     apr: 15,    minimumPayment: 40,  extra: 0    },
  { balance: 3200.55, apr: 19.49, minimumPayment: 75,  extra: 425  },
  { balance: 20000,   apr: 6.5,   minimumPayment: 300, extra: 1000 },
];
```

`selectDebtAmortization` gives the extra to `isFocus` **only**, so the member of the class that fails —
a **non-focus** debt, handed its own minimum with none of the portfolio budget — is not in the list.
The negative-amortisation case at line 139-160 is the same shape: a **single** `$10,000 @ 35% / $10`
debt, where the portfolio budget *is* that debt's minimum, so `cannotAmortize` and
`buildAmortizationSchedule` are asked the identical question and necessarily agree. Add one more debt
whose freed minimum rolls over and they diverge — measured in `A2-1`.

**Mechanism (hypothesis).** With one debt, `monthlyBudget === minimum + extra === monthlyPayment`, so the
two producers are fed the same number and the reconciliation is an identity. The gate reads as
*"the finance-math invariant"* (its own comment: *"the non-negotiable reconciliation the v1.5 plan
requires"*) while measuring a tautology. The multi-debt arity is where the third producer's missing
`monthlyBudget > 0` half and its per-debt budget both bite, and it is exactly the arity absent.

**Remedy — UNVERIFIED.** Adding a two-debt case would red the suite immediately — which is correct, but
it reds on `A2-1`, so the test change and the engine decision have to land together. Do not add the case
without deciding `A2-1` first.

## A2-8 — `minor` — the "2 × $100" explanation is gated on `scheduledPaymentAmount` while the doubling that needs explaining is gated on cadence, so a fallback BNPL shows the doubled amount bare

**Origin:** `packages/core/debt/deriveRequiredActionView.ts` — `stale-read`; the test that misses it,
`testDeriveRequiredActionView.ts`, is `first-look`.

**User-facing consequence.** A CSV-imported (or pre-2.7.2 restored) biweekly Klarna plan the user knows
as a **$100** payment appears on the plan as a required row for **$200**, with nothing saying why. The
identical plan carrying installment columns says *"2 × $100"*. `3.7.A4` exists precisely because *"the
figure is right and the row said nothing about why"* — and it fixed that for one of the two shapes.

**File and line.** `packages/core/debt/deriveRequiredActionView.ts:115-122` —

```ts
const scheduled = debt?.scheduledPaymentAmount;
if (typeof scheduled === "number" && scheduled > 0 && item.amount > scheduled) { ... }
```

against the producer of the doubling, `packages/core/debt/bnplInstallment.ts:264` —
`if (!hasKnownBnplCadence(debt)) return debt;` — where `hasKnownBnplCadence` (line 142) accepts
`minimumPayment` in place of `scheduledPaymentAmount` **on purpose** (`S1P3-A4`, 🎯 2026-08-26).

**The measurement.** One plan, `$1,200` biweekly Klarna, `minimumPayment: 100`, window
`2026-08-01 → 2026-08-28`, varying only whether the installment columns exist:

```
installment-native:
  hasKnownBnplCadence = true
  row amount reserved = $200  (stored minimum $100, scaled to $200)
  caption             = {"count":2,"each":100}
FALLBACK (no installment fields):
  hasKnownBnplCadence = true
  row amount reserved = $200  (stored minimum $100, scaled to $200)
  caption             = undefined
```

**Mechanism (hypothesis).** `S1P3-A4` widened the RESERVE from `isInstallmentNative` to
`hasKnownBnplCadence` and `bnplInstallment.ts:117` introduced `bnplInstallmentAmount` — *"the
per-installment amount, for an installment-native BNPL **or a fallback one**"* — as the one producer of
"what this plan charges once". `deriveRequiredActionView` reads the raw field instead of calling it, so
the caption stayed on the narrow predicate while the number it captions moved to the wide one. This is
the same shape as `C-6`'s open half, which `bnplInstallment.ts:84` records as a filter that was *"one
field short"*. **This is the guard's exact class:** the finding said name every field the derivation
reads at the producer, and here the producer exists and the reader did not call it.

⚠️ `testDeriveRequiredActionView.ts:173-193` cannot see this: every fixture in
`testBnplInstallmentBreakdown` carries `scheduledPaymentAmount: 100`, so the member of the class with no
installment columns — the one `testBnplInstallment.ts:169` separately asserts IS scaled to $200 — is
never run through the caption.

**Remedy — UNVERIFIED.** Calling `bnplInstallmentAmount` here is the shape the producer/reader split
suggests, but that function is not exported today, and I did not measure whether widening the caption
introduces a false "N × $X" on a plan whose `minimumPayment` happens to divide the row amount for an
unrelated reason.

## A2-9 — `minor` — `getDebtsWithDisplayBalances.ts` says P6.11 deletes it; P6.11 deletes `app/`, and this file is in `packages/core`

**Origin:** `packages/core/debt/getDebtsWithDisplayBalances.ts` — `stale-read`.

**User-facing consequence.** None directly. It matters because the claim is what closes an open
money-semantics question: the header at line 42-43 says *"This module is legacy-only and P6.11 deletes
it, so nothing ships on the answer either way"* — the answer being which record wins when
`minimumPaidThisCycle: false` sits beside `isPaidThisCycle: true`. If the premise is wrong, the deferral
is unsupported.

**File and line.** `packages/core/debt/getDebtsWithDisplayBalances.ts:42-43`.

**The measurement.** Repo-wide, this file has two exports with different reach:

```
getDebtsWithDisplayBalances  -> app/page.tsx:347                      (legacy only)
getCompletedSnowballAmount   -> app/page.tsx:44
                             -> apps/rn/src/store/payday.ts:5,105     (the SHIPPING rollover)
```

`apps/rn/src/store/payday.ts:105` passes it straight into `applyRolloverPayment`, so it is on the money
path of the shipping app. And the BRIEF's own scope note says `P6.11` deletes the legacy Next surface —
`app/`, `components/`, `lib/`, `tests/` — which does not include `packages/core/debt/`.

**Mechanism (hypothesis).** The claim is true of the *function* whose `||` the paragraph is about and
false of the *file* it is written on, and the sentence names the file (*"this module"*). Two consequences
if it is left: the `||`-vs-`??` question is filed against a deletion that will not happen, and when
`app/page.tsx` goes the dead half of this file stays because its comment says something else already
handles it.

**Remedy — UNVERIFIED.** A wording correction, and possibly a re-open of the P6.10 filing — but whether
the semantics question genuinely dies with `app/page.tsx` depends on whether the RN tree ever grows a
display-balance derivation, which I did not measure.

---

## Lane A2 — coverage and totals

**Files read: 54 of 54** (`READ-A2.txt`; every path git-tracked, verified with `git ls-files
--error-unmatch`).

| severity | count | ids |
|---|---|---|
| blocker | 2 | A2-1, A2-2 |
| major | 3 | A2-3, A2-6, A2-7 |
| minor | 4 | A2-4, A2-5, A2-8, A2-9 |

**Split by origin** (from `ROUTING-ORIGINS.tsv`; a finding is filed against the file whose line it names):

| origin | files in manifest | findings |
|---|---|---|
| `stale-read` | 36 | **5** — A2-1, A2-2, A2-3, A2-8, A2-9 |
| `fix-churn` | 16 | **4** — A2-4, A2-5, A2-6, A2-7 |
| `first-look` | 2 | 0 filed against them; both (`testDeriveRequiredActionView.ts`, `testReconcileAutopay.ts`) were read, and the first is cited as the blind spot in A2-8 |

⚠️ Read the split the way the brief asks: **every finding against product code is `stale-read`** — files
money-bearing since pass 2 that no dispatched pass had re-read — and **every finding against an
instrument is `fix-churn`**, i.e. checking code the fixing itself rewrote. The app's own defects and the
instruments' regressions are cleanly separated here, and a flat total of 9 would hide that.

**Already-fixed check.** `S1P5-CADENCE-IDENTITY` (the `per-paycheck`/`cyclesPerMonth` guard) was proved
rather than read: `npm run prove:guards -- --id=S1P5-CADENCE-IDENTITY` → `plant-applied=YES ·
planted=exit 1 · control=exit 0 · reason=MATCHED`. **No finding is filed on it** — every test in this
lane passes `cyclesPerMonth: 26/12` and never a `per-paycheck` BNPL, which looked like a hole and is
covered by `packages/core/testing/testCadenceIdentity.ts`. ⚠️ That run mutates
`scripts/finding-guards.json` (it stamps `measured`/`sha`); it was restored with `git checkout --` and
`git status --porcelain` is empty for it.

**Plants, and their restores.** Two files were planted in and restored from a copy taken after the
plant: `packages/core/debt/computeDrift.ts` and `packages/core/debt/projectCurrentBalance.ts`. Both `cmp`
identical to the pre-plant copy; `git status --porcelain` empty; and
`testComputeDrift`, `testProjectCurrentBalance`, `testAmortizationSchedule`, `testDebtProjection`,
`testBnplInstallment` all re-run at **exit 0** afterwards.

**No OOM.** Every probe ran under `tsx` with no heap override; the largest working set was a 601-month
simulation. Nothing in this lane needed a monorepo typecheck, Playwright, or `lint:rn`.
