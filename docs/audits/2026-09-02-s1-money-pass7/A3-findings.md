# A3 — pass 7 findings (engine rest: cashflow, forecast, payCycle, guardian, income, recurrence)

## A3-1 — `blocker` · the in-window minimum is scaled TWICE in the shipping app, so a weekly debt makes `shortfall` print $750 on a paycheck that covers everything

**User-facing consequence.** A user with one weekly-recurrence debt (min $50) and a $500 monthly
paycheck is told **"This paycheck comes up $750 short"** — on the Guardian card, the Live Activity,
the home-screen widget and the paywall lead — *while the same allocation shows a $250 "Extra payment"
line*. Everything due was funded. The number is invented.

**File and line.**
- `packages/core/engine/allocatePaycheck.ts:391-392` — `minimumDueInWindow` = `min(effectiveMinimumInWindow(debt, currentDate, nextPaycheckDate), balance)`, feeding `debtMinimumRequiredTotal` (394), `paidDebtMinimumTotal` (413), `unpaidRequiredTotal` (448) → `shortfall` (456), and `paidTowardDebt` (466).
- `apps/rn/src/store/selectors.ts:65` — the ONLY production caller already passes `scaleBnplMinimumsForWindow(store.debts, currentDate, nextPaycheckDate)`.
- `packages/core/debt/bnplInstallment.ts:179-198` — `hasKnownBnplCadence` no longer gates on `type === 'bnpl'` (S1.13.7.7 `A3-1`), so this now fires on **plain debts**.

**Measurement** (`docs/audits/2026-09-02-s1-money-pass7/A3-probes/p2-doublescale.ts`, one store, one
variable = the debt's `recurrence`; window `2026-09-01 → 2026-10-01`, paycheck $500):

```
weekly plain debt, min $50, balance $2000, due 2026-09-02
  stored minimumPayment       = 50
  scaled minimumPayment (app) = 250      <- selectors.ts:65
  effMinInWindow(stored)      = 250
  effMinInWindow(scaled)      = 1250     <- allocatePaycheck.ts:392 re-scales
  totalRequired               = 1250
  shortfall                   = 750      <- PRINTED TO THE USER
  allocations: minimum_debt:250  snowball:250
  unfundedRequiredItems: (none)

monthly plain debt, min $100 (control)
  scaled = 100, effMin(scaled) = 100, totalRequired = 100, shortfall = 0
```

⚠️ **The paydown side is correct**, which is what makes this purely a false statement rather than lost
money: `apps/rn/src/store/payday.ts:100-108` passes the **unscaled** `reconciledDebts` to
`applyRolloverPayment`, so the balance drops by $250 — matching the `minimum_debt:250` row, not the
$1250 the same cycle claimed was required.

⚠️ **A BNPL does NOT reproduce it** — measured in the same probe: `bnplInstallmentAmount` reads
`scheduledPaymentAmount`, which the scaler does not touch, so `effMinInWindow(scaled) = 300 = correct`.
The defect is confined to the path the `S1.13.7.7`/`S1.13.7.10` widening opened: a **non-BNPL** debt
whose `recurrence` is shorter than the pay cycle, where `bnplInstallmentAmount` falls back to
`minimumPayment` — the very field `scaleBnplMinimumsForWindow` overwrote.

**Mechanism (HYPOTHESIS).** `S1.13.7.10` added `minimumDueInWindow` inside the allocator on the
argument that the allocator "did not read `effectiveMinimumInWindow`". It did not need to: its one
production caller had already applied the same multiplier to `minimumPayment` at the engine boundary.
Widening `hasKnownBnplCadence` off the `type` gate then made the scaler and the allocator BOTH fire on
plain debts, and because the scaler writes its result into the field the multiplier is read from, the
two compose multiplicatively (n × n × installment) instead of agreeing.

**Remedy — UNVERIFIED.** Either (a) drop `minimumDueInWindow` back to
`Math.min(debt.minimumPayment, debt.balance)` inside `allocatePaycheck` and let the boundary scaler
remain the single producer, or (b) delete `scaleBnplMinimumsForWindow` from `selectors.ts:65` and let
the allocator own it. **(b) is the riskier of the two** — `scaleBnplMinimumsForWindow` returns scaled
debts that `selectors.ts` may pass on to other consumers. Neither has been run. ⚠️ The fix must be
checked against a debt whose `minimumPayment` was scaled **and** carries `scheduledPaymentAmount`,
since the two branches of `bnplInstallmentAmount` behave differently under the scaler.

## A3-2 — `major` · the guard for `A3-4` runs the allocator on a path production never takes, and asserts one field of it

**User-facing consequence.** None directly — but this is the instrument that is supposed to stand
between the user and `A3-1`, and it is green over it. `S1P6-A3-4-DEBTCADENCE` is registered, current
(neither `allocatePaycheck.ts` nor `testAllocation.ts` has moved since its `sha` `c450d891`), and it
**passes** while the shipping app prints a $750 shortfall that does not exist.

**File and line.** `packages/core/engine/testAllocation.ts:342-368` (`weeklyDebtUnderMonthly`) ·
`scripts/finding-guards.json` → `S1P6-A3-4-DEBTCADENCE` · the fixture's sole assertion is
`assertMoney(weeklyDebtUnderMonthly.totalRequired, 200, …)` at 364-368.

**Measurement.** The guard proof itself was executed (and the tree restored afterwards — see below):

```
npm run prove:guards -- --id=S1P6-A3-4-DEBTCADENCE
  ✅ S1P6-A3-4-DEBTCADENCE  plant-applied=YES · planted=exit 1 · control=exit 0 · reason=MATCHED
```

Then the same fixture, re-run verbatim and printed in full
(`A3-probes/p3-test-fixture.ts`) — the fields the test does **not** assert on:

```
totalRequired (the ONLY assertion) = 200
allocations:
    minimum_debt     50    | Pay minimum on Weekly loan
    cushion_buffer   50    | Keep cash buffer
    snowball         1950  | Extra payment to Weekly loan
    true_leftover    950   | Leftover cash
unfundedRequiredItems: []
SUM minimum_debt = 50  vs totalRequired = 200  DELTA = 150
```

Two things the assertion cannot see:

1. **The fixture contradicts itself.** The allocator asserts $200 is required and then allocates $50
   as a minimum, reclassifying the other $150 as discretionary `snowball` with no
   `unfundedRequiredItems` row. `allocatePaycheck.ts:545-547` still computes the ALLOCATION as
   `Math.min(debt.minimumPayment, remainingDebtBalance)` — `S1.13.7.10`'s fix reached the four TOTALS
   (`394`, `413`, `448`, `466`) and not the loop that spends the money.
2. **It is not the production path.** The one production caller
   (`apps/rn/src/store/selectors.ts:65`) pre-applies `scaleBnplMinimumsForWindow`; this fixture passes
   raw store debts. So the fixture's `$50` reads correct-ish while the app's `$1250` is the real number
   (A3-1), and no assertion in the file exercises the composition.

**Mechanism (HYPOTHESIS).** The guard's `unfix` is `minimumDueInWindow` → `Math.min(debt.minimumPayment,
debt.balance)`. That plant reds because it moves `totalRequired` from 200 to 50 — the *one asserted
scalar*. Any defect that leaves `totalRequired` at 200 while the allocation, the unfunded list or the
production scaling are wrong is structurally invisible to it. ⚠️ **And the plant is the exact shape of
A3-1's remedy (a)**: the correct repair for the shipping app would RED this guard, which is how the
guard would be discovered to be asserting on the wrong side of the seam.

**Remedy — UNVERIFIED.** Assert on `allocations` (`minimum_debt` sum) and `unfundedRequiredItems`, not
only `totalRequired`, and add a fixture that composes `scaleBnplMinimumsForWindow` → `allocatePaycheck`
exactly as `selectors.ts:65` does. Not run.

---

## A3-3 — `minor` · `prove:guards` prints a false instruction: draining the authored ratchet does NOT red `lint:finding-guards`

**User-facing consequence.** Operator-facing, not user-facing. Every `prove:guards` run tells the
operator to edit a cap in `scripts/check-finding-guards.ts` "in this same edit", on the stated threat
that the gate is otherwise red. Following it would lower a ratchet for no reason.

**File and line.** `scripts/prove-guards.ts` — the post-execution summary block (the text
`set \`MAX_AUTHORED = 10\` in scripts/check-finding-guards.ts, in this same edit. / ⚠️ Until you do,
lint:finding-guards reds, and so does every gate that runs it as a control.`).

**Measurement.** With the ratchet in exactly the state that message describes:

```
$ npm run prove:guards -- --id=S1P6-A3-4-DEBTCADENCE
  📌 recorded 1 execution(s). 10 proof(s) remain never-executed —
     set `MAX_AUTHORED = 10` … ⚠️ Until you do, lint:finding-guards reds …

$ npm run lint:finding-guards
EXIT=0
✅ finding-guards: 266 of 267 findings carry a standing guard; 1 unguarded (cap 1, downward-only).
   proof: 137 EXECUTED · 7 of them STALE (cap 8) · 10 authored but never run (cap 10) · …
```

**Mechanism (HYPOTHESIS).** The BRIEF already records this claim as false in the `prove-guards.ts`
*docblock*: the authored counter is a **ceiling**, deliberately, so `10 (cap 10)` is at the ceiling and
green. The same stale premise also lives in the tool's **runtime output**, where it is read far more
often than the docblock — so fixing only the comment leaves the operator-facing copy of it standing.

**Also measured, incidentally:** running `prove:guards` **writes to a tracked file** —
`scripts/finding-guards.json`'s `proof.sha` was rewritten `c450d891` → `e5ecc7b6`. The BRIEF instructs
auditors to run this command; auditors are also told to leave the tree clean. Restored here by
reverting that one string and confirming `git status --porcelain scripts/finding-guards.json` prints
nothing.

**Remedy — UNVERIFIED.** Print the ceiling honestly ("10 of a cap of 10 — raise the cap only when
authoring an 11th") and drop the "reds" claim. Not run.

## A3-4 — `blocker` · A3-1's inflated `totalRequired` propagates into the forecast's `essentials`, `net` and `carriedBalance`, so the cash-runway receipt and the crunch detector run on it too

**User-facing consequence.** The same weekly debt makes the Cash Runway receipt print
**"Expenses & essentials −$1,250"** against a $250 obligation, and drives the forecast band, the
carried-balance track and therefore `detectCrunches` / the §2.5 water-fill off a number that is $1,000
too large. The forecast's own ledger, on the same screen, itemizes **$250**.

**File and line.**
- `packages/core/timeline/buildMultiCycleTimeline.ts:184` — `essentials: result.totalRequired + result.livingExpenseReserve`
- `:374-376` — `cycleNet(r) = r.paycheckAmount - r.totalRequired - r.livingExpenseReserve` → `net` (`:186`, `:265`), `carriedBalance` (`:170`, `:248`), and the band via `computeState(Math.max(0, cycle0Net), …)` (`:171`, `:249`)
- `:223-235` — projected cycles pass `scaleBnplMinimumsForWindow(projDebts, …)` into `allocatePaycheck`, so **every projected cycle double-scales too**, not only cycle 0.

**Measurement** (`A3-probes/p4-forecast.ts`; $3,000 paycheck, floor $200, window `2026-09-01 →
2026-10-01`, one weekly debt min $50 / balance $2,000, scaled exactly as `selectors.ts:65` does):

```
allocator totalRequired = 1250   shortfall = 0
cycle.essentials        = 1250      <- the receipt line
cycle.net               = 1750      <- band + water-fill substrate
cycle.carriedBalance    = 1950
cycle.endingBalance     = 2550      <- built from the ledger rows
ledger rows:
   paycheck      3000  run: 3000
   minimum_debt   250  run: 2750    <- the SAME cycle's own row says 250
   buffer         200  run: 2550
IDENTITY paycheck - essentials = 1750   vs endingBalance 2550     (an $800 gap)
```

**Mechanism (HYPOTHESIS).** `essentials` and `cycleNet` were deliberately changed to CARRY
`totalRequired` rather than back-solve it (`C1-15`, `:40-52`) — the right call, and it is what makes
A3-1 arrive here undiluted. The ledger row (`buildTimelineItems.ts:109`) reads
`Math.min(debt.minimumPayment, debt.balance)` off the **already-scaled** debt and is therefore correct,
which is precisely why the two disagree by the extra multiplication.

**Remedy — UNVERIFIED.** Fixing A3-1 at `allocatePaycheck.ts:392` fixes every consumer here at once;
no change is needed in this file. ⚠️ **Do not "fix" `essentials` locally** — back-solving it is the
defect `C1-15` closed. Not run.

---

## A3-5 — `major` · the forecast ledger itemizes a sub-cycle bill ONCE while the engine reserves for every occurrence, so the rows do not add up to the totals printed beside them

**User-facing consequence.** A user with a weekly $50 grocery bill and a monthly paycheck sees **one
"Pay Groceries $50" row** in the cash-runway ledger while the same cycle's "Expenses & essentials"
reads **$250** and the running balance ends **$200 higher** than the engine's own net. The ledger is
the screen that is supposed to explain where the money went, and $200 of it is unexplained.

**File and line.** `packages/core/timeline/buildTimelineItems.ts:71-85` — the loop iterates
`requiredExpenses` (the raw store list) and pushes one row at `expense.amount`. `allocatePaycheck.ts:303-326`
expands the same list into ONE ENTRY PER OCCURRENCE for the reserve. Two producers, one window — the
exact shape the `[A2]` block at `allocatePaycheck.ts:236-246` exists to remove.

**Measurement** (`A3-probes/p5-ledger-expense.ts`; one $50 bill, $3,000 paycheck, buffer $50, window
`2026-09-01 → 2026-10-01`. **One variable: `recurrence`.**):

```
recurrence=weekly            recurrence=monthly (control)
  totalRequired  = 250         totalRequired  = 50
  essentials     = 250         essentials     = 50
  expense ROWS   = 1 / $50     expense ROWS   = 1 / $50
  net            = 2750        net            = 2950
  endingBalance  = 2900        endingBalance  = 2900
  GAP vs net     = +150        GAP vs net     = -50   (structural: the $50 cushion row)
```

Relative to the monthly control the weekly case's `endingBalance` overstates by exactly **$200** — the
four occurrences the ledger never draws. `endingBalance` then seeds the next cycle's starting balance
(`getEndingBalance`, `:361-369`).

⚠️ **The same loop also ignores 3.8's reserve draw.** `allocatePaycheck` emits `amount: 0 /
reserveCovered: N` for a bill the pot covers in full (`:504-518`); this row prints the gross
`expense.amount` regardless, so a pot-covered bill is deducted from `runningCash` a second time. Not
separately measured.

**Mechanism (HYPOTHESIS).** `S1.12.5.5`/`[A2]` taught the ALLOCATOR about sub-cycle cadence and the
debt row was later capped to the balance (`A3-18`, `:99-109`), but the expense row was never taught
either fact — it still assumes `one obligation = one row = its stored amount`.

**Remedy — UNVERIFIED.** Build the expense rows from `result.allocations` (categories `expense` /
`autopay_expense`, which already carry `targetId`, the per-occurrence amount and `reserveCovered`)
instead of re-walking `requiredExpenses`. ⚠️ That changes what a PAID-but-not-due bill renders as —
line 73 deliberately keeps rows for `paidThisCycle` items the allocator drops — so the paid branch has
to be kept explicitly. Not run.

## A3-6 — `blocker` · an un-ticked SUB-CYCLE bill is carried forward un-advanced, so its reserve grows every cycle without bound ($250 → $450 → $650)

**User-facing consequence.** A user with a weekly $50 grocery bill who simply never taps the "paid"
tick is told their required total is **$250**, then **$450**, then **$650** for the same one bill —
and Today grows from 5 rows to 13, all named "Pay Groceries". Four more cycles and the app declares a
shortfall on a paycheck that covers everything. The user owes $50 a week; the app says they owe
thirteen weeks of it at once.

**File and line.** `packages/core/recurrence/rolloverPayCycle.ts:84-87`

```ts
// Unpaid obligations carry into the new cycle unchanged (still owed).
if (!expense.isPaidThisCycle) {
    return [{ ...expense, isPaidThisCycle: false }];
}
```

— composed with `packages/core/engine/allocatePaycheck.ts:247-297` (`occurrencesThisCycle`, which
counts every step of the cadence from the STORED `dueDate` to `nextPaycheckDate`) and `:303-326` (the
per-occurrence expansion).

**Measurement** (`A3-probes/p6-unpaid-carry.ts`; one $50 bill, $1,000 monthly paycheck, paydays on the
1st, **three real `rolloverRequiredExpenses` rollovers with nothing ticked**. ONE variable:
`recurrence`):

```
recurrence=weekly
  cycle 0 [2026-09-01 -> 2026-10-01] storedDue=2026-09-02  totalRequired=$250  rows=5
  cycle 1 [2026-10-01 -> 2026-11-01] storedDue=2026-09-02  totalRequired=$450  rows=9
  cycle 2 [2026-11-01 -> 2026-12-01] storedDue=2026-09-02  totalRequired=$650  rows=13

recurrence=monthly (control)
  cycle 0/1/2                        storedDue=2026-09-02  totalRequired=$50   rows=1
```

`storedDue` never moves in either case — that is the carry-forward rule working as written. The
monthly control is flat because `occurrencesThisCycle` returns 1 for a cadence at-or-above the cycle
length; the weekly case multiplies by a window that gets one month longer every cycle.

**Mechanism (HYPOTHESIS).** The carry-forward rule ("an unpaid bill is still owed, so do not advance
it") predates `[A2]`'s per-occurrence expansion. For a cadence at or above the pay cycle, "unpaid" and
"one occurrence" mean the same thing, so freezing `dueDate` is a true statement about one debt. For a
sub-cycle cadence, freezing `dueDate` while the window keeps advancing makes the arrears
**re-counted**, not carried — the same shape as `bnplInstallmentsInWindow`'s `windowStartISO` fix
(`bnplInstallment.ts:222-245`), where every occurrence a plan missed BEFORE the window opened was
counted as due in the current cycle, and 🎯 decided on 2026-08-29 to honour the window instead.

⚠️ **Ticking does not close it either.** The parent flag is set only by the row whose id has no
`__occ` suffix (`apps/rn/src/store/store.ts:653-661`); `paidOccurrences` is cleared at rollover
(`apps/rn/src/store/payday.ts:165`). So a user who ticks occurrences 1-4 but not the first one gets
the same unbounded growth with four ticks a cycle recorded and discarded.

**Remedy — UNVERIFIED.** Apply `bnplInstallmentsInWindow`'s already-decided rule to the bill counter:
clamp the expansion's start to the window start (`currentDate`) rather than the stored `dueDate`, so a
sub-cycle bill can never charge more than its cadence fits in ONE window. ⚠️ **Do not simply advance
the unpaid `dueDate` at rollover** — that would delete a genuine monthly arrear, which the current
rule exists to preserve. And ⚠️ **the two counters must not diverge**: `bnplCadence.test.ts` already
refuses a fix that makes `occurrencesThisCycle` and `effectiveMinimumInWindow` disagree over one
window (see `allocatePaycheck.ts:385-389`). Not run.

## A3-7 — `major` · the §2.2 partition invariant is BROKEN by any sub-cycle debt, and `testGuardianPartition` cannot see it because every debt fixture in the file has `minimumPayment: 0`

**User-facing consequence.** The reconciliation that exists so *"the lie can't hide in a wrong total"*
(`testGuardianPartition.ts:1-6`) passes while the buckets and the discretionary total disagree by
**$200–$250** on one weekly debt. Downstream, `selectDiscretionary` and the cushion bar are drawn from
one side of that identity and the Guardian's headroom from the other.

**File and line.** `packages/core/guardian/testGuardianPartition.ts` — every debt fixture:
`:101` `minimumPayment: 0`, `:250` `minimumPayment: 0`, both `recurrence: "monthly"`. The invariant is
`sumBuckets(r, DISCRETIONARY_BUCKETS) === discretionaryOf(r)` (`:117-119`, `:125`, `:141`, `:157`,
`:173`, `:178`, `:226`, `:263`).

**Measurement** (`A3-probes/p7-partition.ts` — the file's own `sumBuckets` / `discretionaryOf`, one
debt, $500 paycheck, $50 buffer, window `2026-06-01 → 2026-07-01`):

```
monthly, minimumPayment 0   (the fixture's own arity)
   totalRequired=0     Σbuckets=500  discretionary=500   PARTITION HOLDS
monthly, minimumPayment 100 (control)
   totalRequired=100   Σbuckets=400  discretionary=400   PARTITION HOLDS
weekly,  minimumPayment 50, unscaled
   totalRequired=250   Σbuckets=450  discretionary=250   PARTITION BROKEN by $200
weekly,  minimumPayment 50, SCALED as the app does
   totalRequired=1250  Σbuckets=250  discretionary=0     PARTITION BROKEN by $250
```

**Mechanism (HYPOTHESIS).** `minimumPayment: 0` fails `hasKnownBnplCadence`'s third clause
(`bnplInstallment.ts:196`, `bnplInstallmentAmount(debt) > 0`), so `effectiveMinimumInWindow` short-circuits
to the stored minimum and the two producers inside `allocatePaycheck` — `minimumDueInWindow` for the
totals (`:391`) and `debt.minimumPayment` for the allocation (`:545`) — are trivially equal. A monthly
debt with a real minimum is also equal (one occurrence). **The only fixture arity that separates them is
a sub-cycle cadence with a positive minimum, and this file has none.** `A3-15` widened this file's
CATEGORY coverage in pass 6 and made it exhaustive by construction; the FIXTURE dimension was not
widened with it.

**Remedy — UNVERIFIED.** Add a weekly-debt fixture with a positive minimum to the partition block, and
one that composes `scaleBnplMinimumsForWindow` the way `selectors.ts:65` does. ⚠️ Expect it to red
until A3-1 is fixed — that is the point, and it means the fixture must be added in the same edit as the
fix, not before. Not run.

## A3-8 — `minor` · `GUARDIAN_STATE_LABEL`'s docblock — the rule "A SHORTFALL IS NOT ONE OF THESE" — is orphaned onto `PRIVACY_CLAIM`, 65 lines from the constant it governs

**User-facing consequence.** None directly. It is a load-bearing rule that has detached from its
subject: the next reader of `GUARDIAN_STATE_LABEL` (`:167-171`) sees an undocumented three-key map,
and the rule that a shortfall must NOT be folded into `at-risk` reads as a note about the privacy
claim.

**File and line.** `packages/core/copy/vocabulary.ts:102-111` — a `/** … */` block opening *"The
Guardian's three cash states, as the user reads them (T4.5 / audit L1-7)"* and carrying *"⛔ **A
SHORTFALL IS NOT ONE OF THESE.**"* — immediately followed at `:112-125` by a second `/** … */` block
about `PRIVACY_CLAIM`, then `export const PRIVACY_CLAIM` at `:126`. `GUARDIAN_STATE_LABEL` is declared
at `:167` with no docblock at all.

**Measurement.** Read directly: two consecutive block comments precede one declaration; `sed -n
'100,130p'` shows `FROM_RESERVE_CAPTION` at `:100`, the Guardian-states block at `:102-111`, the
privacy block at `:112-125`, `PRIVACY_CLAIM` at `:126`, and no comment between `:166` and `:167`.
`git log` attributes the `PRIVACY_CLAIM` block to a later commit than `3783e30d` ("T4.5: one set of
words for the cash states"), which introduced the orphaned block.

**Mechanism (HYPOTHESIS).** `PRIVACY_CLAIM` (T8) was inserted directly beneath T4.5's docblock rather
than beneath its constant, and `GUARDIAN_STATE_LABEL` was later moved down past `REPLACE_DATA_ACTION`
without its comment. ⚠️ Adjacent to A3-1: the rule that got orphaned is exactly the one
`buildGuardianBrief.ts:212` implements (`shortfall > 0 ? "at-risk" : computeState(…)`) — the place a
shortfall and a band are already deliberately entangled.

**Remedy — UNVERIFIED.** Move `:102-111` to sit directly above `:167`. Not run. ⚠️ `lint:comments`
exists (`scripts/check-comment-convention.ts`) and did not object; whether it can see an orphaned
docblock was NOT measured, so do not assume it is a gate gap without planting one.

## A3-9 — `major` · `testFullAppRegression`'s largest section (22 of 70 assertions, 13 of 34 tests) covers a feature the shipping app deliberately never calls

**User-facing consequence.** Operator-facing. The suite named *"Full app regression"* runs inside
`test:regression`, which gates every push, and its single biggest block cannot regress anything a user
can reach — while the sections that CAN (allocation, rollover) are the thinner ones and, per A3-2 /
A3-6 / A3-7, are exercised only on the arity where the defects hide.

**File and line.** `packages/core/testing/testFullAppRegression.ts:476-628` (§3 SMART INSIGHTS, 13
test functions, `:646-655` in the runner) against `apps/rn/src/store/analysisSelectors.ts:143`:

> `// Smart Insights: intentionally NOT surfaced (2.2.5 scrapped, Jason 2026-07-22). buildSmartInsights …`

**Measurement.** Assertions per section, counted from the file's own banners:

```
   3  helpers
  16  1. ALLOCATION ENGINE
  14  2. TIMELINE SNAPSHOT
  22  3. SMART INSIGHTS          <- 31% of the suite
  12  4. ROLLOVER PAY CYCLE
   6  5. INTEGRATION
  ---
  73 total (70 excluding the 3 in helpers)
```

`grep -rn buildSmartInsights` over `apps/`, `app/`, `lib/`, `components/`, `packages/` returns exactly
two non-test consumers: `analysisSelectors.ts:143` (a comment saying it is not surfaced) and
`components/SnowballSection.tsx:245` — the legacy Next root that `P6.11` deletes.

⚠️ **And the rollover section pins A3-6's defect as correct, on the one cadence where it is:**
`:672-682` `testRolloverUnpaidExpenseDoesNotAdvanceDueDate` asserts *"Unpaid monthly expense keeps
original due date"*. Nothing in the file supplies a `weekly` / `biweekly` / `per-paycheck` expense to
the rollover at all — the same missing-arity shape as A3-2 and A3-7, in a third file.

**Mechanism (HYPOTHESIS).** §3 was written before 2.2.5 was scrapped (2026-07-22) and was never
removed with the feature, because deleting tests looks like losing coverage. `check-runner-completeness`
and `lint:s1-coverage` count files and runners, not whether a covered symbol is reachable from a
screen — so a suite can stay "complete" while a third of it is aimed at nothing.

**Remedy — UNVERIFIED.** ⚠️ **Do not simply delete §3** — `S1P6-A3-17-REALBACKUP` records the rule
this repo settled on: real coverage of the true path lands FIRST, then the fake is removed with a
pointer at each site. Here the true path is the allocation/rollover coverage the missing cadence arity
would add (A3-2, A3-6, A3-7). Not run.

## A3-10 — `minor` · the `Debt` type's own docblock still states the `originalBalance` BNPL carve-out that the SAME COMMIT measured false and removed

**User-facing consequence.** None yet. It is a live instruction to reproduce a closed defect: the next
author who adds an `originalBalance` writer reads the rule where a rule belongs — on the field's type
declaration — and is told to carve out installment-native BNPL. `D62` closed the journey-ring defect
that carve-out caused.

**File and line.** `packages/core/storage/debtPlannerStorage.ts:57-60`:

> *"⚠️ **Raised only through `raiseOriginalBalance`** … ⛔ **An installment-native BNPL is carved out and
> stays undefined** — `bnplPaymentsTotal` divides this to say "payment 2 of 4", and filling it there
> changes the count."*

against `packages/core/debt/originalBalanceHighWater.ts:19-31`:

> *"## ⚠️ ONE RULE, INCLUDING BNPL — and the case for exempting it was measured false … Measured across
> the lifecycle — fresh, half-paid, and a plan corrected 2→4 — the count a user reads is either unchanged
> or **more** correct with a stamp than without one … Reading that exemption as being about
> `bnplPaymentsTotal` is an inference, and it was wrong."*

**Measurement.** Both files were last touched by the **same commit**:

```
5a5fa8c6  2026-08-25  P6.8.9.7.11.15 - originalBalance becomes a high-water mark,
                      and the carve-out I recommended was wrong
   -- packages/core/debt/originalBalanceHighWater.ts
   -- packages/core/storage/debtPlannerStorage.ts
```

The commit that refuted the carve-out edited the type file and left the carve-out sentence standing in
it. Behaviour follows the NEW rule everywhere measured: `bnplPaymentsTotal` is
`max(remaining, basis/scheduled)` (`bnplInstallment.ts:128-133`), `migrations.ts:354` and
`store.ts:518/551/571` call `raiseOriginalBalance` with no type test, and `imports/debtCsv.ts:344`
stamps `originalBalance: declaredBalance` for `bnpl` rows too. **Only the docblock disagrees.**

**Mechanism (HYPOTHESIS).** The `Debt` type's docblock is the canonical statement of the field's rule
and was written before `P6.8.9.7.11.15`; the fix rewrote the helper's docblock (where the reasoning
lives) and the type's paragraph about *"raised only through `raiseOriginalBalance`"* survived with its
now-contradicted second half attached.

**Remedy — UNVERIFIED.** Replace `:57-60`'s carve-out sentence with a pointer to
`originalBalanceHighWater.ts`. ⚠️ Note `apps/rn/src/store/store.ts`'s `addDebt` still skips BNPL for
its own (different, correct) reason — declining a momentum BAR, not protecting the count
(`originalBalanceHighWater.ts:29-31`) — so do not "align" that site while fixing the comment. Not run.

---

## A3-11 — `minor` · `debtCsv`'s recurrence rejection message names five of the seven cadences it accepts, omitting the two that `S1.13.7.7 [A3-13]` had just added

**User-facing consequence.** A user whose CSV has an unrecognised recurrence (`yearly`, `fortnightly`)
is shown the list of valid values, and that list is missing `quarterly` and `annually` — the two the
importer was widened to accept precisely because refusing them meant *"the two doors into one store
disagreeing about what a debt can be"*. So a quarterly loan is now importable and the error message
tells the user it is not.

**File and line.** `packages/core/imports/debtCsv.ts:319-322`

```ts
if (!isValidRecurrence(recurrence)) {
    errors.push(`Row ${rowNumber}: recurrence must be one-time, weekly, biweekly, per-paycheck, or monthly`);
```

against `:51-59` `allowedRecurrences = ["one-time","weekly","biweekly","per-paycheck","monthly","quarterly","annually"]`.

**Measurement.** `allowedRecurrences.length === 7`; the message enumerates **5**. The two missing are
exactly the two the docblock at `:38-50` records as added by `S1.13.7.7 [pass-6 A3-13]`.

**Mechanism (HYPOTHESIS).** The fix widened the array and the predicate reads the array, so the accept
path was correct and no test could see the message. The message is a hand-written second copy of the
same enumeration — the class this repo names *"budget the enumeration, not the list"* — and no gate
compares a rejection string to the list it describes.

⚠️ **And its test cannot see it:** `packages/core/imports/testDebtCsv.ts` covers this branch with
`eq(r.debts.length, 0, "a cadence that is not a Recurrence at all is still refused")` — the refusal, not
the message — while the neighbouring `quarterly` row (added by the same fix) asserts the ACCEPT side.
Same shape as A3-2: the fixture reads one side of the pair.

**Remedy — UNVERIFIED.** Build the message from `allowedRecurrences.join(", ")` so the two cannot
diverge again. Not run.

## A3-12 — `major` · the cadence-identity matrix — the instrument written to close the cadence CLASS — walks 28 pairs and passes `debts: []` to every one of them

**User-facing consequence.** Operator-facing, and it is why A3-1 and A3-6 are still open. This file's
own docblock states its purpose: *"a test that walks every recurrence against every pay cycle closes
the class, and a new cadence joins it for free."* It closes the class **on the bill branch only**.
`recurrence` is a field of `Debt` as well, and `S1.13.7.10 [A3-4]` already recorded that exact
oversight one file over — then fixed one fixture in `testAllocation.ts` and left this matrix untouched.

**File and line.** `packages/core/testing/testCadenceIdentity.ts` — all three `allocatePaycheck` calls
pass `debts: []`: `:56-65` (identity 1, per-paycheck × 4 cycles), `:101-110` (the control),
`:125-134` (the 7 × 4 matrix). The one debt-shaped object in the file (`:80`) goes to
`bnplMonthlyEquivalentMinimum`, not to the allocator.

**Measurement.** `grep -c "debts: \[\]"` over the file returns 3 — one per `allocatePaycheck` call.
And adding the missing arity is **still not sufficient**, which is the sharper half:

```
matrix assertion  (:135-144):  Σ allocations for the item, must be a whole multiple of the bill
A3-4's assertion  (testAllocation.ts:364):  totalRequired, on one weekly DEBT

measured, one weekly debt min $50 / balance $2000, monthly cycle (A3-probes/p3-test-fixture.ts):
   Σ allocations (minimum_debt) = 50     <- a whole multiple of 50: the matrix would PASS
   totalRequired                = 200    <- A3-4's fixture asserts this and PASSES
   DELTA                        = 150    <- no assertion anywhere reads both
```

**Mechanism (HYPOTHESIS).** The two cadence instruments each read exactly one side of the
allocator's internal disagreement — the matrix reads `allocations`, `A3-4`'s fixture reads
`totalRequired` — and nothing in either file compares them. So both can be green with the two
producers $150 apart, which is A3-1's precondition.

**Remedy — UNVERIFIED.** Extend the matrix's inner loop to run each pair a second time with the item as
a **debt** (`minimumPayment` positive), and assert the identity that actually binds them:
`Σ allocations[minimum_debt|autopay_debt] + Σ unfundedRequiredItems === debtMinimumRequiredTotal`.
⚠️ It will red until A3-1 is fixed, so it lands in the same edit. Not run.

## A3-13 — `minor` · `testEngineFuzz` still documents `suggestLean`'s fallback as "the MAX of the actuals" — the pass-6 blocker `A3-9` — and its assertion cannot tell the two apart

**User-facing consequence.** None directly. It is a carried premise that describes a **fixed defect as
the intended behaviour**, in the adversarial suite for that exact function — so a future reader
restoring "the documented behaviour" would restore the $42,500 lean.

**File and line.** `packages/core/testing/testEngineFuzz.ts:99-100`

```ts
// Single actual, no valid typical → anchors to the max of the actuals (not a crash / not 0).
assertTrue(suggestLean([1800], NaN, 0).suggestedLean > 0, "single actual + bad typical → positive suggestion (anchored to actual)");
```

against `packages/core/income/suggestLean.ts:59-74`, whose docblock records the change:
*"⛔ S1.13.7.3 [pass-6 A3-9] — THE FALLBACK WAS THE MAXIMUM … The median is what 'typical' means."*

**Measurement** (`A3-probes/p8-fuzzcomment.ts`):

```
suggestLean([1800], NaN, 0)            = 1530   <- the fuzz file's own arity: max == median == 1800,
                                                   so `> 0` cannot distinguish the two rules
suggestLean([1000,1000,50000], NaN, 0) = 850    <- median 1000 x 0.85; the MAX rule the comment
                                                   describes would give 42500
```

`git log -1`: `testEngineFuzz.ts` last moved **2026-07-24** (`dbcffc01`); `suggestLean.ts` last moved
**2026-08-31** (`dfb5281e`, the A3-9 fix). The fuzz file predates the fix and was not revisited.

**Mechanism (HYPOTHESIS).** `A3-9`'s fix updated the producer and `testSuggestLean.ts` (which asserted
the defect by name) but did not sweep the second file covering the same function. The comment survived
because the assertion beneath it is `> 0` — a shape check that is true under both rules, so the fix
could not red it and nothing pointed at the file.

**Remedy — UNVERIFIED.** Correct the comment to "the median", and strengthen the row to the arity that
separates them — the `[1000, 1000, 50000]` case is already in `testSuggestLean.ts:40`, so a fuzz row
here should assert the *property* (the suggestion never exceeds the median of the actuals) rather than
duplicate that fixture. Not run.

## A3-14 — `major` · History's "a monthly debt is unchanged by in-window scaling" control never exercises the scaling — its fixture is due five months outside the window

**User-facing consequence.** Operator-facing. This is the paired control for `S1P3-A2` — the blocker
where History told a user who paid $200 that they paid $100 — and it is the row that is supposed to
catch the fix over-correcting in the other direction. It passes on a code path that does no counting
at all, so an over-scaling regression on ordinary monthly debts would not red it.

**File and line.** `packages/core/testing/testPayCycleHistoryRegression.ts:151-162`. The `monthly`
fixture is spread from the file's `debt()` helper (`:20-31`), whose `dueDate` is `"2026-06-01"`, while
the window is `WINDOW_START = "2026-01-01"` / `WINDOW_END = "2026-02-01"` (`:120-121`).

**Measurement** (`A3-probes/p9-history-control.ts`, the fixture copied verbatim):

```
window                       = 2026-01-01 -> 2026-02-01
fixture dueDate              = 2026-06-01   (FIVE MONTHS AFTER the window ends)
bnplInstallmentsInWindow     = 0            <- ZERO occurrences in the window
effectiveMinimumInWindow     = 100          <- from Math.max(1, 0), not from counting
snapshot totalPaidThisCycle  = 100          <- the asserted value

--- the same fixture with dueDate 2026-01-05 (inside the window)
bnplInstallmentsInWindow     = 1
effectiveMinimumInWindow     = 100
```

Both arities produce 100, so the assertion is true either way — but only the second one is the claim
its label makes.

**Mechanism (HYPOTHESIS).** `effectiveMinimumInWindow` floors the count with
`Math.max(1, bnplInstallmentsInWindow(...))` (`bnplInstallment.ts:295`), so a debt with **zero**
in-window occurrences still returns one installment. The control fixture reuses a shared `debt()`
helper whose date was written for a June window and never re-checked against the January window the
BNPL case introduced beside it. ⚠️ The BNPL half of the same test IS strong — it pins
`withWindow.totalPaidThisCycle` to what `applyRolloverPayment` actually deducted rather than to a
literal (`:133-149`), which is the right shape; only the control is weak.

⚠️ **Related, NOT claimed as reachable:** the `Math.max(1, ...)` floor means
`applyRolloverPayment` would deduct a full minimum from a debt with no charge in the window. I checked
the two write paths for `minimumPaidThisCycle` — the Today tick (`apps/rn/src/app/(tabs)/index.tsx:91`,
fed from the allocator's in-window rows) and `reconcileAutopay` (gated `dueDate <= asOfDate`) — and
neither can flag a not-yet-due debt, so I could not reach it. Stated so the next round does not
re-derive it.

**Remedy — UNVERIFIED.** Give the control a `dueDate` inside `[WINDOW_START, WINDOW_END)` and pin it,
like the BNPL half, to `applyRolloverPayment`'s actual paydown rather than the literal `100`. Not run.

## A3-15 — `minor` · `selectVisibleHistory` still implements the RETIRED Premium history cap, and `test:regression` still pins it — two producers of "how many cycles does a user see" that disagree

**User-facing consequence.** None today (nothing shipping calls it). It is a retired product decision
kept alive by a push gate: the shared engine says *"Premium sees the last 6 cycles; Premium+ sees them
all"* and the shipping app says history is *"UNGATED + uncapped"*. A future wiring of the core helper —
the natural move, since it is the one in `packages/core` with tests — silently deletes history rows
from every premium user.

**File and line.**
- `packages/core/history/selectVisibleHistory.ts:5-24` — `PREMIUM_HISTORY_CAP = 6`, `hasFeatureAccess(plan, "unlimited_history")`, `.slice(0, PREMIUM_HISTORY_CAP)`.
- `apps/rn/src/store/historySelectors.ts:57-75` — *"Pay Cycle History rows, most-recent-first. **UNGATED + uncapped** — the 2026-07-21 premium reshape makes history a generous FREE surface (no Premium cap / Premium+ full-history split; that old tier plan is retired)."* Returns the whole list reversed.
- `packages/core/testing/testPayCycleHistoryRegression.ts:191-215` — four tests, seven assertions, pinning the cap ("premium sees exactly 6 cycles"), reached from `runRegressionTests.ts` and therefore from `test:regression`.

**Measurement.**

```
grep -rn "unlimited_history|PREMIUM_HISTORY_CAP" apps/rn/src   ->  (no matches)
                                        lib/               ->  lib/hooks/usePayCycleHistory.ts, lib/subscription/features.ts
grep -rn "selectVisibleHistory" apps app components lib apps/rn
   ->  lib/hooks/usePayCycleHistory.ts:10,38   (the legacy root ONLY)
ls apps/rn/src/lib/subscription                              ->  (does not exist)
```

So the cap's only consumer is the surface `P6.11` deletes, the RN tree carries no `unlimited_history`
feature at all, and the two producers of the same user-facing quantity give 6 and ∞.

⚠️ **And `packages/core` cannot be typechecked without the tree that dies.**
`packages/core/tsconfig.json` aliases `"@/*": ["../../*"]` for exactly this; three core files import
`@/lib/*` — `selectVisibleHistory.ts:2-3`, `testSafeStorage.ts:8-9`, `testSubscriptionGating.ts:20-21`
— and two of the three are in `runRegressionTests.ts` (`:66`, `:68`). The tsconfig's own comment already
names this ("three files import `@/lib/*` … Both this alias and those dependencies go at 5.5.1"), so the
count is **accurate, not stale** — I checked, and report it here only because `selectVisibleHistory` is a
money-bearing engine module rather than a test, and its removal is a product decision, not a cleanup.

**Mechanism (HYPOTHESIS).** The 2026-07-21 premium reshape retired the tier split at the surface that
was being rebuilt (RN) and left the engine module, its feature flag and its regression coverage in
place, because nothing in the RN tree imports them and no gate asks whether a core export has a live
consumer.

**Remedy — UNVERIFIED.** A 🎯 call, not a code fix: either the cap is retired (delete
`selectVisibleHistory` + its four regression tests with `P6.11`) or it is not (wire it into
`selectHistoryRows`). ⚠️ Deleting it also removes `packages/core`'s only non-test `@/lib` import,
which is a prerequisite for `P6.11` rather than a consequence of it. Not run.

---

# Report — split by origin

| finding | severity | origin | primary file |
|---|---|---|---|
| `A3-1` | `blocker` | `fix-churn` | `packages/core/engine/allocatePaycheck.ts` |
| `A3-2` | `major` | `fix-churn` | `packages/core/engine/testAllocation.ts` |
| `A3-3` | `minor` | `instrument` | `scripts/prove-guards.ts` |
| `A3-4` | `blocker` | `fix-churn` | `packages/core/timeline/buildMultiCycleTimeline.ts` |
| `A3-5` | `major` | `fix-churn` | `packages/core/timeline/buildTimelineItems.ts` |
| `A3-6` | `blocker` | `stale-read` | `packages/core/recurrence/rolloverPayCycle.ts` |
| `A3-7` | `major` | `fix-churn` | `packages/core/guardian/testGuardianPartition.ts` |
| `A3-8` | `minor` | `fix-churn` | `packages/core/copy/vocabulary.ts` |
| `A3-9` | `major` | `s0-first-look` | `packages/core/testing/testFullAppRegression.ts` |
| `A3-10` | `minor` | `stale-read` | `packages/core/storage/debtPlannerStorage.ts` |
| `A3-11` | `minor` | `off-surface` | `packages/core/imports/debtCsv.ts` |
| `A3-12` | `major` | `s0-first-look` | `packages/core/testing/testCadenceIdentity.ts` |
| `A3-13` | `minor` | `neighbour` | `packages/core/testing/testEngineFuzz.ts` |
| `A3-14` | `major` | `neighbour` | `packages/core/testing/testPayCycleHistoryRegression.ts` |
| `A3-15` | `minor` | `stale-read` | `packages/core/history/selectVisibleHistory.ts` |

**By origin** — `fix-churn` **6** · `stale-read` **3** · `s0-first-look` **2** · `neighbour` **2** · `instrument` **1** · `off-surface` **1**

**By severity** — `blocker` **3** · `major` **6** · `minor` **6**

