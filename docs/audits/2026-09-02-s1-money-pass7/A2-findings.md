# A2 findings — S1 money pass 7 (debt engine: payoff, amortisation, ids, balances)

Lane A2 · 55 files · 6,390 lines · all exit-bearing.
Origins in lane: 47 stale-read · 7 fix-churn · 1 first-look. (No instrument/neighbour files routed to A2.)

⚠️ **Severity is stated ONCE per finding, in its `##` heading, in the brief's exact form.** The
"Findings SPLIT BY ORIGIN" roll-up at the end restates those same values and introduces no new ones;
deriving the counts from the headings and from the roll-up must give the same answer, and it does:
**3 blockers · 2 majors · 5 minors · 10 total.**

---

## A2-1 — `blocker` · the window scaling is applied TWICE to any debt without `scheduledPaymentAmount`, so `totalRequired` doubles/triples (a plain weekly debt is required at its whole balance)

**Origin:** `fix-churn` (`packages/core/debt/bnplInstallment.ts`) — the second half is `S1.13.7.10`'s own repair in `allocatePaycheck.ts`.

**User-facing consequence.** On the Plan tab, a $1,000 card with a **$100 weekly** minimum against a
$2,000 monthly paycheck is reported as requiring **$1,000 this paycheck**. The true in-window demand is
**$500** (5 × $100). The Guardian holds $500 of the user's money that nothing is owed, the extra-payment
recommendation is starved by the same $500, and the required row states a figure the user's own
statement contradicts. A fallback BNPL (`type: bnpl`, no installment columns — the CSV-import and
pre-2.7.2-backup shape the file itself documents at `bnplInstallment.ts:148-153`) is required at **$900**
against a true **$300**.

**File and line.**
- `packages/core/debt/bnplInstallment.ts:154-158` — `bnplInstallmentAmount` falls back to `debt.minimumPayment`.
- `packages/core/debt/bnplInstallment.ts:312-318` — `scaleBnplMinimumForWindow` **writes** `minimumPayment`.
- `apps/rn/src/store/selectors.ts:65` — passes the already-scaled list into `allocatePaycheck`.
- `packages/core/engine/allocatePaycheck.ts:391-392` — `minimumDueInWindow` scales again, off the overwritten field.

**MEASUREMENT** (`docs/audits/2026-09-02-s1-money-pass7/_a2probe1.ts` / `_a2probe2.ts`, run under
`--max-old-space-size=1536`, deleted after; one store, one variable = `debt.recurrence` / the presence of
`scheduledPaymentAmount`). Window `2026-08-01 → 2026-09-01`:

```
--- ONE plain WEEKLY debt (balance 1000, minimumPayment 100) ---
bnplInstallmentsInWindow       = 5
effectiveMinimumInWindow(raw)  = 500      <- the correct answer
after selectors.ts:65 scaling  = minimumPayment 500
allocator minimumDueInWindow   = 1000     <- 5 x 500, clamped at the balance

--- fallback BIWEEKLY bnpl (balance 1200, minimumPayment 100, no installment fields) ---
effectiveMinimumInWindow(raw)  = 300      <- the correct answer
after scaling  minimumPayment  = 300
allocator minimumDueInWindow   = 900      <- 3 x 300

--- installment-native BIWEEKLY bnpl (scheduledPaymentAmount 100) — CONTROL ---
effectiveMinimumInWindow(raw)  = 300
after scaling  minimumPayment  = 300
allocator minimumDueInWindow   = 300      <- correct; the control isolates the cause
```

End-to-end through the real engine, same debt, only the scaling seam varied:

```
[UNSCALED store list]                          totalRequired=500
[SCALED, as selectors.ts:65 actually passes]   totalRequired=1000
```

**Mechanism, stated as a HYPOTHESIS.** `scaleBnplMinimumForWindow` is **not idempotent for a debt that
carries its per-charge amount in `minimumPayment`**, because that is the field it overwrites *and* the
field `bnplInstallmentAmount` reads back. For an installment-native BNPL the read (`scheduledPaymentAmount`)
and the write (`minimumPayment`) are different fields, so composing the transform is safe — which is why
every fixture in `testBnplInstallment.ts` that exercises the composition is installment-native and the
class stayed invisible. `S1.13.7.10` closed pass-6's `A3-4` by making the allocator call
`effectiveMinimumInWindow`, but the allocator's input had **already** been through
`scaleBnplMinimumsForWindow` at `selectors.ts:65`, so the "ONE producer" is now applied twice in series.
`bnplInstallment.ts:270` calls itself *"the ONE producer of this number"*; it has one producer and two
sequential consumers, which is not the same property.

**Blast radius (hypothesis, not measured):** `buildMultiCycleTimeline.ts:160/223` and
`recoverySelectors.ts:50` also scale before handing debts on; if any downstream of those also calls
`effectiveMinimumInWindow`, the same doubling applies to the forecast and the recovery plan.

**Remedy — UNVERIFIED.** Either (a) delete the `selectors.ts:65` / timeline pre-scaling now that the
allocator reads the producer itself, or (b) make `scaleBnplMinimumForWindow` idempotent by stamping
`scheduledPaymentAmount` (or a separate `perChargeAmount`) rather than overwriting the field it reads.
Both are hypotheses: (a) may starve consumers of the scaled list that do **not** call the producer, and
(b) changes what `isInstallmentNative` reports about a debt. **Neither was tried.** Whichever is chosen,
the regression must be a fixture **without** `scheduledPaymentAmount` — every existing composition
fixture has it.

**⚡ ADDENDUM — pass-6's `A3-4` is re-created by `A3-4`'s own fix, in the mirror direction.** `A3-4`
measured *"RESERVE $50 against PAYDOWN $200"*. `apps/rn/src/store/payday.ts:103` passes the **unscaled**
store debt to `applyRolloverPayment`, while `apps/rn/src/store/selectors.ts:65` passes the **scaled** list
to the allocator. Same debt, same window (`_a2probe3.ts`):

```
RESERVE (allocation totalRequired, scaled list as selectors.ts:65 passes) = 1000
PAYDOWN (payday.ts:103, unscaled store debt)                              = 500
producer effectiveMinimumInWindow(unscaled)                               = 500
```

The two sides are **$500 apart on one $1,000 debt**, and the producer agrees with the paydown, not the
reserve. `apps/rn/src/store/recoverySelectors.ts:50-52` scales once and reads `scaled.minimumPayment`
directly — it reports **$500**, so the recovery plan and the Plan tab now state different "essential"
totals for the same cycle. `packages/core/timeline/buildMultiCycleTimeline.ts:223-227` feeds
`scaledProjDebts` into `allocatePaycheck` for **every projected cycle**, so the hypothesis is that the
debt-free date and payoff trajectory carry the same doubling — **not measured**.

---

## A2-2 — `major` · the two "a plain debt is never scaled" controls are vacuous — they vary alignment, not type, and the rule they assert has been false since `A3-1`

**Origin:** `fix-churn` (`packages/core/debt/testBnplInstallment.ts`).

**User-facing consequence.** Indirect but load-bearing: these are the only two rows standing between the
engine and A2-1's class. They report green while asserting a rule the file itself contradicts 55 lines
earlier, so nothing in the suite covers what the widened predicate now does to a plain debt's minimum.

**File and line.**
- `packages/core/debt/testBnplInstallment.ts:195` — `assertTrue(scaleBnplMinimumForWindow(plain, "2026-08-01", "2026-09-01") === plain, "a plain debt is never scaled")`
- `packages/core/debt/testBnplInstallment.ts:237-238` — the comment: *"it must not reach a plain debt at all."*
- `packages/core/debt/testBnplInstallment.ts:241` — `effectiveMinimumInWindow(plain, …) === plain.minimumPayment`, *"a plain debt's in-window minimum is its stored minimum (control)"*.
- `plain` is defined at `:93` and inherits `recurrence: "monthly"` from the `debt()` factory at `:33`.
- Contradicted in the same file at `:140`, which asserts a **weekly plain debt** counts **5** charges.

**MEASUREMENT** (`_a2probe4.ts`; one store, one variable = `recurrence`, everything else held at the
fixture's own values):

```
control fixture recurrence           = monthly
scale(plainMonthly) === plainMonthly = true      <- what :195 asserts
effMin(plainMonthly)                 = 50 (stored 50 )   <- what :241 asserts

scale(plainWeekly) === plainWeekly   = false     <- :195's stated rule, falsified
scale(plainWeekly).minimumPayment    = 250
effMin(plainWeekly)                  = 250 (stored 50 )  <- :241's stated rule, falsified
```

**Mechanism, stated as a HYPOTHESIS.** Both rows were written when `hasKnownBnplCadence` still gated on
`debt.type === "bnpl"`, so `type` and `recurrence` were confounded in the fixture and either reading of
the assertion label was true. `S1.13.7.7`'s `A3-1` removed the type gate (`bnplInstallment.ts:194-196`
now tests only `dueDate` + a positive installment amount) — which changed **which property the control is
controlling for** without changing the row or its label. The rows stayed green because the fixture is
monthly and an aligned cadence holds ≤1 charge, i.e. the `n <= 1` early return at
`bnplInstallment.ts:315` is what makes them pass, not anything about `type`. This is the pattern the
brief names: the fix reached the reported instance and left a sibling asserting on the same store.

**Remedy — UNVERIFIED.** Restate both labels as what they measure (*"an ALIGNED debt is not scaled"*) and
add the missing member of the class — a plain **weekly** debt, asserted through the **composed** path
(scale, then `effectiveMinimumInWindow`), which is the fixture shape A2-1 shows nothing currently covers.
Not tried; changing the fixture in place would change which member of the class the row covers, which
`:228-229` explicitly warns against.

---

## A2-3 — `minor` · pass-6 `A2-8`'s caption fix was iterated to fallback BNPLs but not to the plain debts `A3-1` widened into, so a sub-window plain debt shows a multiplied amount bare

**Origin:** `fix-churn` (`packages/core/debt/deriveRequiredActionView.ts`).

**User-facing consequence.** A required row reads **"Pay minimum on Card · $500.00"** for a debt the user
entered with a **$100** minimum, and offers no reason. That is verbatim the consequence
`deriveRequiredActionView.ts:116-121` describes for a fallback BNPL — *"the row said $200 where the plan
says $100 and offered no reason"* — now reachable on a plain debt.

**File and line.** `packages/core/debt/deriveRequiredActionView.ts:128-133` — the `scheduled` gate:

```ts
const scheduled =
    typeof debt?.scheduledPaymentAmount === "number" && debt.scheduledPaymentAmount > 0
        ? debt.scheduledPaymentAmount
        : debt?.type === "bnpl"          // <- the surviving type gate
          ? debt.minimumPayment
          : undefined;
```

**MEASUREMENT** (`_a2probe5.ts`; one store, one variable = `debt.type`):

```
Card   (type=debt) row amount $500, stored minimum $100 -> installments = undefined
Klarna (type=bnpl) row amount $300, stored minimum $100 -> installments = { count: 3, each: 100 }
```

**Mechanism, stated as a HYPOTHESIS.** `A2-8`'s remedy replaced *one* type-shaped gate
(`scheduledPaymentAmount` present) with *another* (`type === "bnpl"`), while `A3-1` — landed in the same
triage — removed the type gate from the producer that does the multiplying
(`hasKnownBnplCadence`, `bnplInstallment.ts:179-198`). The explaining side is therefore one class
narrower than the multiplying side again, for the same structural reason `A2-8` recorded. The rule
`bnplInstallment.ts:148-153` states — *"what this plan charges once"* is `scheduledPaymentAmount ?? minimumPayment`
— is stated at its producer and re-derived here with an extra condition, which is the two-producer shape.

⚠️ **And it is pinned by an assertion.** `testDeriveRequiredActionView.ts:189-192` asserts
`installments === undefined` for a plain debt with `minimumPayment: 100` on a row of `amount: 400` —
i.e. it states the un-fixed behaviour as the requirement. Filed separately as **A2-8**.

**Remedy — UNVERIFIED.** Drop `debt?.type === "bnpl"` so the fallback branch is `debt?.minimumPayment`,
matching `bnplInstallmentAmount` exactly, and gate the whole caption on the same `hasKnownBnplCadence`
the multiplier uses. Not tried. ⚠️ **The row's `item.amount` is itself wrong under A2-1** — fixing this
caption without fixing A2-1 would print an honest-looking *"10 × $100"* over a figure that should be
*"5 × $100"*, which is the worse failure.

---

## A2-4 — `minor` · the safety argument justifying `A3-1`'s widening is a carried premise, and it is now measurably false

**Origin:** `fix-churn` (`packages/core/debt/bnplInstallment.ts`).

**User-facing consequence.** None directly. It is the comment a future fixer will read before deciding
whether widening the predicate was safe, and it says the disagreement A2-1 measures cannot exist.

**File and line.** `packages/core/debt/bnplInstallment.ts:187-191`:

> *"Safe to widen because both consumers share one producer: the allocator's RESERVE and
> `applyRolloverPayment`'s PAYDOWN both read `effectiveMinimumInWindow`, so they move together or not at
> all — the drift AS.2 records is **structurally unavailable here**."*

**MEASUREMENT.** A2-1's addendum, same window, same debt: **RESERVE 1000 / PAYDOWN 500.** The drift is
not structurally unavailable; it is present, on the exact shape the widening admitted. A second carried
claim in the same block — *"an absent `remainingPayments` is an unknown cap (`Infinity`), which is right
for a plain debt"* — is true of the loop but is what lets a weekly plain debt count 5 charges against a
`minimumPayment` that the scaler has already multiplied.

**Mechanism, stated as a HYPOTHESIS.** The comment was true of the *symbols* (both sides do call
`effectiveMinimumInWindow`) and false of the *values*, because one side's input has been rewritten by
`scaleBnplMinimumForWindow` on the way in. The claim was checkable by grep and was checked that way; it
was not checkable by grep and was not checked by measurement. The brief's own rule — *"a comment is a
carried premise and decays like a carried number"* — applies to this comment.

**Remedy — UNVERIFIED.** Restate the block against what was measured once A2-1 is triaged; the sentence
should name the *composition* (scale-then-produce), not the shared symbol. Not tried.

---

## A2-5 — `minor` · a drift baseline for a plan that cannot amortize is a single point, and drift then reports "N days behind" = days elapsed, forever, no matter what the user pays

**Origin:** `stale-read` (`packages/core/debt/computeDrift.ts`, `buildPayoffTrajectory.ts`).

**Reachability, stated up front.** `computeDrift` has **no consumer in the shipping app** —
`grep` for `daysBehind` / `DriftResult` outside `packages/core/debt/` returns only its own test. What
**is** wired is `apps/rn/src/store/drift.ts:58`, which builds and **persists** the baseline into the
store (`models.ts:409`, schema v3). So the defective baseline is being written to real user blobs today
and the false headline arrives the day the reader ships. Rated at the lower severity on that basis; it becomes the top severity
the moment anything renders `daysBehind`.

**User-facing consequence (when rendered).** A premium_plus user with a maxed card is told *"you're 181
days behind your plan"* on a day they are **$3,000 ahead of where they started**, and the number is
identical whether they paid $3,000, paid nothing, or borrowed $1,000 more.

**File and line.**
- `packages/core/debt/buildPayoffTrajectory.ts:83, 98` — `cannotAmortize` breaks **before** month 1 pushes a point, so `points === [{month: 0, balance: startingBalance}]`.
- `packages/core/debt/computeDrift.ts:70-86` — `monthAtBalance` on a one-point array returns `points[0].month` (0) on every branch.
- `packages/core/debt/computeDrift.ts:105` — `daysBehind = round((monthsElapsed − 0) × 30.4375)` = elapsed days.

**MEASUREMENT** (`_a2probe6.ts`; one store = one $12,000 Visa @ 27.99% APR, $100/mo minimum, $0 extra;
one variable = `currentBalance`; anchor `2026-01-01`, current `2026-07-01`):

```
projectedPoints = [{"month":0,"balance":12000}]
anchorBalance   = 12000
currentBalance 12000 -> daysBehind=181 dollarsBehind=0     status=behind projectedToday=12000
currentBalance 11000 -> daysBehind=181 dollarsBehind=-1000 status=behind projectedToday=12000
currentBalance  9000 -> daysBehind=181 dollarsBehind=-3000 status=behind projectedToday=12000
currentBalance 13000 -> daysBehind=181 dollarsBehind=1000  status=behind projectedToday=12000
```

⚡ `daysBehind` **does not vary with the balance at all** — the two halves of the same result
contradict each other (`−$3,000` = ahead in dollars, `behind` in days) and the days figure grows without
bound as the anchor recedes.

**Mechanism, stated as a HYPOTHESIS.** `computeDrift` assumes `projectedPoints` describes a descending
curve; `buildPayoffTrajectory` is documented to return that curve, and for a non-amortizing plan it
returns a degenerate one-element array instead — a shape `computeDrift`'s only guard
(`projectedPoints.length === 0 → null`, `:97`) does not recognise. `testComputeDrift.ts:85` asserts
`built.projectedPoints.length > 1` on an amortizing fixture ($5,000 @ 20% with $300 extra), so the file
knows the property matters and never exercises the case where it fails. The `grew` row at `:62-64` even
asserts the value **181** — for the *legitimate* "balance rose past the anchor" reason — which is why the
degenerate case produces a number the suite has already blessed.

**Remedy — UNVERIFIED.** Treat `projectedPoints.length < 2` the same as empty (return `null`, showing the
"building your drift history" empty state) rather than reporting against a flat line; or have
`buildDriftBaseline` refuse to freeze a baseline it cannot project. Not tried. ⚠️ A remedy that only
changes `computeDrift` leaves the degenerate baselines already persisted in v3 blobs.

---

## A2-6 — `blocker` · `bnplPaymentsTotal` is the FOURTH producer of the installment count and it still uses `round` where the other three use `ceil` — the "of N" denominator SHRINKS as the plan is paid, and a payment vanishes from the count

**Origin:** `stale-read` (`packages/core/debt/bnplInstallment.ts`), with `packages/core/debt/originalBalanceHighWater.ts` and `packages/core/debt/testOriginalBalanceHighWater.ts`.

**User-facing consequence.** On a $440 Klarna plan of $100 biweekly installments, the Money row and the
BNPL calendar report:

- before any payment: *"payment 1 of 5"*
- after the **first** $100 payment: *"payment 1 of 5"* → *"payment **1 of 4**"* — the same ordinal again,
  and one whole installment has disappeared from the plan
- `money.tsx:625` prints `${bnplTotal − bnplRemaining} of ${bnplTotal} paid`, which after that first
  payment reads **"0 of 4 paid"** — the exact string pass-4 blocker `C4-1` was filed for, from a
  different cause
- the user makes **five** payments and the app never once says *"5 of 5"*

**File and line.**
- `packages/core/debt/bnplInstallment.ts:132` — `Math.round(basis / scheduled)`, against `Math.ceil` at `:85`, `:100` and in `applyRolloverPayment.ts:19`.
- `packages/core/debt/bnplInstallment.ts:99` claims the opposite: *"`ceil`, so the three producers of this count agree exactly."* There are **four**.
- Rendered at `apps/rn/src/components/money/BnplCalendarSection.tsx:134` and `apps/rn/src/app/(tabs)/money.tsx:610, 625`.

**MEASUREMENT** (`_a2probe7.ts`; ONE store = one Klarna plan, `scheduledPaymentAmount: 100`,
`originalBalance: 440`, biweekly; ONE variable = `balance`, stepped down by one installment; every value
passed through the real `raiseOriginalBalance` → `normalizeBnplInstallment` → `buildBnplSchedule` chain):

```
plan: $440 on a $100 biweekly installment schedule (true total = ceil(440/100) = 5)
balance 440 | remaining=5 | bnplPaymentsTotal=5 | ceil(original/scheduled)=5 | caption "payment 1 of 5"
balance 340 | remaining=4 | bnplPaymentsTotal=4 | ceil(original/scheduled)=5 | caption "payment 1 of 4"
balance 240 | remaining=3 | bnplPaymentsTotal=4 | ceil(original/scheduled)=5 | caption "payment 2 of 4"
balance 140 | remaining=2 | bnplPaymentsTotal=4 | ceil(original/scheduled)=5 | caption "payment 3 of 4"
balance  40 | remaining=1 | bnplPaymentsTotal=4 | ceil(original/scheduled)=5 | caption "payment 4 of 4"
```

⚡ The **denominator moves** — 5, then 4 for the rest of the plan's life — and `paymentNumber` repeats
**1** across a real payment.

**Severity note.** The false figure is a payment count, not a dollar amount. Rated at the top severity on this
project's own precedent: `C4-1` — *"a Klarna 4-pay with two installments already paid printed '$200.00 ·
**0 of 2** paid' … against a true **2 of 4**"* — is recorded as a pass-4 **blocker**, and
`bnplInstallment.ts:111-113` states the rule that the count is a claim of the same kind as money.

**Mechanism, stated as a HYPOTHESIS.** `S1.13.7.6` moved the *remaining* count to `ceil` (balance
canonical) at three sites and left `bnplPaymentsTotal`'s `round` untouched, because under the OLD canon —
`balance := scheduled × remaining` — the ratio was always a whole number and `round` and `ceil` could not
disagree. That premise is what the same fix deleted. It survives verbatim in two docstrings
(`originalBalanceHighWater.ts:24` and `testOriginalBalanceHighWater.ts:79`, both: *"`balance` is
`scheduled × remaining`"*), and those docstrings are the argument for the `max(remaining, basis/scheduled)`
shape that produces the shrinking denominator. `bnplPaymentsRemaining` moving to `ceil` while the total
stayed on `round` is what lets `remaining > round(basis/scheduled)` at the top of the plan and
`remaining < it` later — so `max` returns `remaining` at first (5) and the rounded basis afterwards (4).
Every BNPL fixture in `testOriginalBalanceHighWater.ts:82-103` and `testBnplInstallment.ts` uses a balance
that is an exact multiple of the installment, so nothing in the suite can see it.

**Remedy — UNVERIFIED.** Change `:132` to `Math.ceil(basis / scheduled)`, making all four producers one
rule. **Not tried, and it has a stated risk:** `testOriginalBalanceHighWater.ts:102` asserts *"reads 'of
4', never 'of 6'"* on a fixture where basis and scheduled divide exactly, so `ceil` should leave it at 4 —
but that has not been run, and the brief's rule that more than half of pre-authored remedies do not
survive contact applies. The regression must be a fixture whose `originalBalance` is **not** a multiple of
`scheduledPaymentAmount`; there is not one anywhere in the tree.

---

## A2-7 — `minor` · `debtPlannerStorage.ts` states that an installment-native BNPL is "carved out and stays undefined" from `originalBalance`; every live writer stamps it

**Origin:** `neighbour`-shaped, filed under `stale-read` (`packages/core/debt/originalBalanceHighWater.ts` is the A2 file; the false claim lives in `packages/core/storage/debtPlannerStorage.ts`).

**User-facing consequence.** None directly. It is the field's own type declaration — the first thing a
reader consults before touching the BNPL count — and it states the opposite rule from the helper it names
in the sentence before.

**File and line.**
- `packages/core/storage/debtPlannerStorage.ts:57-58`: *"⛔ An installment-native BNPL is **carved out and stays undefined**."*
- `packages/core/debt/originalBalanceHighWater.ts:19-31`: *"⚠️ **ONE RULE, INCLUDING BNPL — and the case for exempting it was measured false** … ⛔ **`addDebt` skips BNPL for a different reason than it appears to.**"*
- `packages/core/debt/bnplInstallment.ts:123`: *"⛔ Do NOT exempt BNPL from `raiseOriginalBalance`."*

**MEASUREMENT.** Every live writer of the field, enumerated by `grep -rn raiseOriginalBalance` over the
repo root (no directory list):

```
apps/rn/src/data/migrations.ts:354   raiseOriginalBalance(normalizeBnplInstallment({...}))   <- every debt, on every hydrate
apps/rn/src/store/store.ts:518       raiseOriginalBalance({...merged, ...})                  <- updateDebt
apps/rn/src/store/store.ts:551       raiseOriginalBalance({...d, balance, ...})              <- verifyDebtBalances
apps/rn/src/store/store.ts:571       raiseOriginalBalance({...d, balance: next.get(d.id)!})  <- bulk verify
```

None is type-gated. `_a2probe7.ts` confirms it end to end: a `type: "bnpl"` debt with
`scheduledPaymentAmount` set comes back from `raiseOriginalBalance` **stamped**, and the count is then
derived from the stamp.

**Mechanism, stated as a HYPOTHESIS.** The carve-out was real when the comment was written (`addDebt`'s
own exemption); `.11.15`/`D62` centralised the rule and `originalBalanceHighWater.ts` records the
exemption being re-examined and refuted — but the *field's* docstring was never revisited, so the tree now
holds both the refuted claim and its refutation, in files that cite each other.

**Remedy — UNVERIFIED.** Delete the carve-out sentence from `debtPlannerStorage.ts:57-58` and point at
`originalBalanceHighWater.ts` as the single owner of the rule. Not tried. ⚠️ Triage should treat this
together with A2-6: the same retired premise (*"`balance` is `scheduled × remaining`"*) is what both the
carve-out argument and the `round` denominator rest on.

---

## A2-8 — `major` · the plain-debt half of `A2-8`'s caption defect is PINNED BY AN ASSERTION that states the un-fixed behaviour as the requirement

**Origin:** `stale-read` (`packages/core/debt/testDeriveRequiredActionView.ts`). This is A2-3's instrument half, filed separately because the remedy is different.

**User-facing consequence.** Indirect: a triage that fixes A2-3 will red this row and may read the red
as its own regression rather than as the assertion being wrong.

**File and line.** `packages/core/debt/testDeriveRequiredActionView.ts:189-192`:

```ts
assert(
    deriveRequiredActionView({ category: "minimum_debt", targetId: "d1", debtId: "d1",
        label: "Pay minimum on Card", amount: 400 }, [], [debtItem({ id: "d1", minimumPayment: 100 })], NOW).installments === undefined,
    "a plain debt has no installments to break down",
);
```

**MEASUREMENT.** The fixture is a plain debt with `minimumPayment: 100` and a row `amount: 400` — a 4×
row. `_a2probe5.ts` reproduces the same input and prints `installments = undefined`. Since `A3-1`
(`bnplInstallment.ts:179-198`) a plain **weekly** debt is exactly how a row reaches 4×
(`_a2probe4.ts`: `scale(plainWeekly).minimumPayment = 250` from a stored 50). So the assertion's fixture
is now reachable in the shipping app and the assertion says the bare figure is correct.

**Mechanism, stated as a HYPOTHESIS.** When the row was written, no producer could put a multiplied
amount on a plain debt's row, so `amount: 400` against `minimumPayment: 100` was an impossible input and
`undefined` was the only honest answer. `A3-1` made the input reachable without touching the assertion —
the same "a fix changed which property the control controls for" shape as A2-2, one file over. Two
independent rows in two files now assert that the widened predicate does not reach plain debts.

**Remedy — UNVERIFIED.** Re-aim the row at what it actually protects (*a debt with no cadence, and
therefore no scaling, states no breakdown*) and add the reachable case as its own assertion. Not tried.

---

## A2-9 — `blocker` · `verifyDebtBalance`/`verifyDebtBalances` skip `normalizeBnplInstallment`, so the BNPL calendar keeps listing installments the user has already paid — a $200 plan prints $400 of upcoming charges

**Origin:** `fix-churn` (`packages/core/debt/bnplSchedule.ts` reads the stale field; `packages/core/debt/bnplInstallment.ts` owns the reconciliation the write path skips).

**User-facing consequence.** A Klarna 4-pay of $100 whose statement balance the user confirms as **$200**:

- the Money row reads **"$200.00 · 2 of 4 paid · interest-free"** — correct
- the **UPCOMING BNPL INSTALLMENTS** calendar on the same screen lists **four** rows of $100, captioned
  *"payment 1 of 4"* … *"payment 4 of 4"*, with a month subtotal printed as a real dollar figure
  (`BnplCalendarSection.tsx:127-129`, `formatCurrency(g.subtotal)`)

So one screen shows **$400 of scheduled charges against a $200 debt**, and two payments the user has
already made are listed as still upcoming. ⚠️ **This is the flow the app asks people to use** — the same
argument `originalBalanceHighWater.ts:16-17` makes about `verifyDebtBalances`.

**File and line.**
- `apps/rn/src/store/store.ts:545-552` (`verifyDebtBalance`) and `:566-573` (`verifyDebtBalances`) — both write a new `balance` through `raiseOriginalBalance` only. Neither calls `normalizeBnplInstallment`.
- `apps/rn/src/store/store.ts:506` (`updateDebt`) — **does** call it, on the same store, for the same field.
- `packages/core/debt/bnplSchedule.ts:57` — `const remaining = d.remainingPayments as number;` reads the **stored** count, while `:56` `bnplPaymentsTotal(d)` derives from the **balance**. Two producers, one row.

**MEASUREMENT** (`_a2probe9.ts`; ONE store = one Klarna plan; ONE variable = whether the verified balance
is passed through `normalizeBnplInstallment`; the write expression is copied from `store.ts:551`):

```
BEFORE — as written by addDebt
  stored remainingPayments = 4 | bnplPaymentsRemaining(balance-derived) = 4 | bnplPaymentsTotal = 4
  money.tsx row  : "0 of 4 paid"
  BNPL calendar  : 4 rows -> 2026-08-01#1/4, 2026-08-15#2/4, 2026-08-29#3/4, 2026-09-12#4/4

AFTER  — user verifies the statement balance as $200 (store.ts:551, no normalize)
  stored remainingPayments = 4 | bnplPaymentsRemaining(balance-derived) = 2 | bnplPaymentsTotal = 4
  money.tsx row  : "2 of 4 paid"
  BNPL calendar  : 4 rows -> 2026-08-01#1/4, 2026-08-15#2/4, 2026-08-29#3/4, 2026-09-12#4/4   <- $400

CONTROL — the same verified balance PUT THROUGH normalizeBnplInstallment
  (what updateDebt at store.ts:506 would have produced)
  stored remainingPayments = 2 | bnplPaymentsRemaining(balance-derived) = 2 | bnplPaymentsTotal = 4
  money.tsx row  : "2 of 4 paid"
  BNPL calendar  : 2 rows -> 2026-08-01#3/4, 2026-08-15#4/4                                   <- $200
```

⚡ The control isolates the cause exactly: one call, on the same object, changes the calendar from four
rows to two and the captions from *"1 of 4"* to *"3 of 4"*.

**Mechanism, stated as a HYPOTHESIS.** Before `S1.13.7.6`'s decision the count was canonical and the
balance derived from it, so a write path that changed only the **balance** could not desynchronise the
pair — there was nothing to re-derive. Making the balance canonical inverted that: `remainingPayments`
became a **derived** field, and every write path that touches `balance` now owes a re-derivation.
`updateDebt` got one (`store.ts:506`); the two `verify*` paths, which are *also* balance writers, did
not. `applyRolloverPayment.ts:15-21`'s `syncBnplRemaining` was added for the rollover for exactly this
reason — so the class was identified and two of its four members were fixed. `bnplSchedule.ts` is the
only reader that still trusts the stored field; `bnplPaymentsRemaining`, `bnplPaymentsTotal` and
`syncBnplRemaining` all derive.

**Remedy — UNVERIFIED.** Two candidates, and they differ:
(a) wrap both `verify*` writes in `normalizeBnplInstallment` the way `updateDebt` does — smallest change,
but it leaves `bnplSchedule.ts:57` trusting a field any future writer can stale again;
(b) change `bnplSchedule.ts:57` to `bnplPaymentsRemaining(d) ?? 0`, making the schedule derive like every
other reader — which closes the class rather than the member.
**Neither was tried.** (b) changes the loop bound for every existing plan and would need the
exact-multiple assumption in `testBnplSchedule.ts:22-26` checked first; that fixture is
`balance: 200, remainingPayments: 2`, where the two producers agree, so it cannot see the difference
either way.

---

## A2-10 — `minor` · `buildAmortizationSchedule` is the THIRD copy of the negative-amortization guard, in the same directory as the fix whose comment says a third copy must not exist

**Origin:** `stale-read` (`packages/core/debt/buildAmortizationSchedule.ts`, `packages/core/debt/cannotAmortize.ts`).

**User-facing consequence.** None measured today — see below. The consequence the class carries when the
copies diverge is the one `cannotAmortize.ts:28-30` records: a debt-free date printed above a curve that
never descends, or a per-debt amortization sheet that says "cannot be paid off" over a headline saying
it can.

**File and line.** `packages/core/debt/buildAmortizationSchedule.ts:58-69`:

```ts
if (monthlyPayment <= calculateMonthlyInterest(balance, apr)) { … payoffPossible: false … }
```

`:24-25` and `:59-60` claim it *"mirrors projectDebtPayoff's cannotAmortize"* and *"bails out the same
way projectDebtPayoff does"*. It does not call it. `packages/core/debt/cannotAmortize.ts:32-34` states
the rule this violates: *"it is one function called at ONE point in the month body … **and not a third
corrected copy.** Every fix in this round has collapsed a pair to a single producer rather than
correcting the loser, because correcting the loser is what buys the next round's recurrence."*

**MEASUREMENT — and it does NOT currently diverge; that is the honest result** (`_a2probe8.ts`, 5,000
pseudo-random single-debt plans, balance in [200, 30200), apr in [0, 35), min in [10, 710), seeded
`20260902`, comparing `schedule.payoffPossible` against
`date.estimatedDebtFreeDate !== DEBT_FREE_DATE_UNPAYABLE`):

```
checked 5000 single-debt plans; DISAGREEMENTS on payoffPossible = 0
```

**Mechanism, stated as a HYPOTHESIS.** The two agree today because both evaluate the test **before** the
month's accrual and, for a single debt at a fixed payment, a plan that amortizes at month 0 amortizes at
every later month — so the WHEN dimension that produced `A-F4`'s 2% band is unavailable to this copy.
That is a property of the current call site (`analysisSelectors.ts:173-187` passes one debt and a fixed
`monthlyPayment`), not of the expression: `cannotAmortize`'s `monthlyBudget <= 0 → false` half — which
`cannotAmortize.ts:36-38` calls *"load-bearing and must not be dropped"* — is **absent** here, so the two
already disagree on the `payment === 0, apr === 0` input, and a future multi-debt or freed-minimum caller
would re-open the whole band.

**Instrument gap, measured.** `testDebtProjection.ts:420-467` sweeps the disagreement band across the
DATE and the CHART with a straddle control, and `testAmortizationSchedule.ts:139-160` checks the
amortization schedule against the date engine at exactly **one** point (`$10,000 @ 35%, $10 min`) — far
outside the band. So the third producer is covered by one far-field sample while the other two get a
seven-row sweep.

**Remedy — UNVERIFIED.** Call `cannotAmortize([{ balance, apr }], monthlyPayment)` at
`buildAmortizationSchedule.ts:61`. **Not tried, and it is not a pure refactor:** it changes the
`monthlyPayment === 0` case from `payoffPossible: false` to a 600-month spin, so the `monthlyBudget <= 0`
half has to be reasoned about at this call site before the swap. Adding the band rows from
`testDebtProjection.ts:420-428` to `testAmortizationSchedule.ts` is the cheaper first step and is
independent of the swap.

---

# Findings SPLIT BY ORIGIN

Lane A2's manifest is **47 `stale-read` · 7 `fix-churn` · 1 `first-look`**. No `instrument`,
`neighbour` or `off-surface` file was routed here.

| origin | blocker | major | minor | total |
|---|---|---|---|---|
| **`fix-churn`** | **2** (A2-1, A2-9) | **1** (A2-2) | **2** (A2-3, A2-4) | **5** |
| **`stale-read`** | **1** (A2-6) | **1** (A2-8) | **3** (A2-5, A2-7, A2-10) | **5** |
| **`first-look`** | 0 | 0 | 0 | **0** |
| **total** | **3** | **2** | **5** | **10** |

### `fix-churn` — 5 findings (2 blockers · 1 major · 2 minors)

Every one of the five is **a defect in a repair landed since pass 6**, and four of them are the *same
shape*: a fix removed a `type === "bnpl"` gate, or inverted the balance/count canon, at the producer —
and a sibling reader, writer, or control kept the old premise.

- **A2-1** `blocker` — `S1.13.7.10`'s repair of `A3-4` composes with the pre-existing `selectors.ts:65` scaling: `totalRequired` **1000 against a true 500**, and `A3-4`'s own reserve/paydown split reappears mirrored (**RESERVE 1000 / PAYDOWN 500**).
- **A2-9** `blocker` — `S1.13.7.6`'s balance-canonical decision made `remainingPayments` derived; two of four balance-writers were given the re-derivation, the two `verify*` paths were not. **$400 of listed installments against a $200 plan.**
- **A2-2** `major` — the two controls that would have caught A2-1's class assert `type`, vary `recurrence`, and pass on the `n <= 1` early return.
- **A2-3** `minor` — `A2-8`'s caption fix iterated to fallback BNPLs but not to the plain debts `A3-1` widened into.
- **A2-4** `minor` — the safety argument for `A3-1`'s widening, still stated as fact in the code, measured false.

### `stale-read` — 5 findings (1 blocker · 1 major · 3 minors)

- **A2-6** `blocker` — `bnplPaymentsTotal`'s `round` against three producers' `ceil`; the "of N" denominator **falls 5 → 4** on the first payment and a payment vanishes from the count.
- **A2-8** `major` — the plain-debt half of A2-3 is pinned by an assertion stating the un-fixed behaviour as the requirement.
- **A2-5** `minor` — a non-amortizing plan freezes a one-point drift baseline; drift then reports days-elapsed as days-behind forever, regardless of what the user pays. **No app consumer today**, but the baseline is persisted.
- **A2-7** `minor` — `debtPlannerStorage.ts`'s `originalBalance` docstring states a BNPL carve-out that all four live writers contradict.
- **A2-10** `minor` — a third copy of the negative-amortization guard; **0 disagreements measured over 5,000 plans**, so it is filed as structure, not as a live defect.

### `first-look` — 0 findings

`packages/core/debt/debtPrefillFromExpense.ts` was read in full. Its exhaustiveness gate
(`EXPENSE_FIELDS_DROPPED`, keyed on `Exclude<keyof RequiredExpense, CarriedFromExpense>`) was checked
against its own claim: `typecheck:core` exists (`package.json:80`), is inside `npm run typecheck`
(`:83`), and CI runs the unprefixed form deliberately (`.github/workflows/web-e2e.yml:83-89`). The claim
*"there is no spelling of 'I forgot' that compiles"* holds as far as the wiring goes. **Nothing found.**

---

## Coverage + method

- **55 of 55** lane files opened and read in full. `READ-A2.txt` is 55 lines, matches `ROUTING-A2.txt` exactly with no extras (`comm` empty both directions), and every path passes `git ls-files --error-unmatch`.
- Ten cross-lane files were read **in part** to trace producers: `allocatePaycheck.ts`, `selectors.ts`, `payday.ts`, `store.ts`, `analysisSelectors.ts`, `recoverySelectors.ts`, `buildMultiCycleTimeline.ts`, `debtPlannerStorage.ts`, `BnplCalendarSection.tsx`, `money.tsx`. **They are deliberately NOT in `READ-A2.txt`** — the brief's rule is that a short honest list beats a long one, and none of them was read end to end.
- Every measurement came from a **runner FILE** under `--max-old-space-size=1536`, never `node -e` / `tsx -e`. No OOM. The nine probe files (`_a2probe1.ts` … `_a2probe9.ts`) were deleted after the run; nothing outside this directory was written, and no server was started.
- `npm run test:regression` (`tsx packages/core/testing/runRegressionTests`) was run once and its **own exit code read: `EXIT=0`**, 799 lines, `✅ All regression tests passed.` Every finding above is against a **green** suite.
- Nothing was fixed. Every remedy is marked **UNVERIFIED** and none was applied.
