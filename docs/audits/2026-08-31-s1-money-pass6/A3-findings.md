# A3 findings — money engine minus debt (packages/core)

Lane A3 · pass 6 · manifest 77 files. Origins from ROUTING-ORIGINS.tsv.

## A3-1 — `blocker` — A weekly/biweekly DEBT that is not a BNPL reserves one payment of three, and the engine offers the rest to the snowball

**Origin:** `packages/core/engine/allocatePaycheck.ts` · `fix-churn`

**User-facing consequence.** A monthly-paid user enters a loan they repay **every two weeks** — an
option `DebtSheet.tsx:395` offers on an ordinary debt (`weekly` · `biweekly` · `per-paycheck` are all in
its `Recurrence` picker). Three payments of $100 fall inside their monthly cycle. The app reserves
**$100**, reports **$0 shortfall**, and recommends putting **$250 of the remainder as an extra payment
toward that same debt** — money that is already owed as the next two instalments. Two weeks later the
payment they were told they could afford to make extra is the payment they cannot make.

⚠️ **This is NOT the BNPL case, and that is the point.** `type: 'bnpl'` is handled: the RN engine
boundary (`apps/rn/src/store/selectors.ts:65`) runs every debt through
`scaleBnplMinimumsForWindow`, which multiplies the minimum by the in-window instalment count. That seam
gates on `debt.type === "bnpl"` (`packages/core/debt/bnplInstallment.ts:142-149`,
`hasKnownBnplCadence`), so **a non-BNPL debt with the identical cadence falls straight through it.**

**File and line.**

- `packages/core/engine/allocatePaycheck.ts:332-338` — the debt branch filters on the single stored
  `dueDate` and never calls `occurrencesThisCycle`:
  ```ts
  const upcomingMinimums = debts
      .filter((debt) => isDueBeforeNextPaycheck(debt.dueDate))
      .sort(...);
  ```
  The expense branch sixty lines above (`:266-303`) runs its list through `occurrencesThisCycle` and
  expands one entry per occurrence. `Debt` declares a `recurrence` field (`:28`) that this branch
  never reads.
- `packages/core/debt/bnplInstallment.ts:142-149` — the compensating seam's gate:
  `debt.type === "bnpl" && ... && bnplInstallmentAmount(debt) > 0`.
- `apps/rn/src/store/selectors.ts:63-65` — the comment at the boundary states the exclusion as
  intended: *"A no-op for aligned cadences **+ non-BNPL**."* Accurate about the code; the population it
  leaves out is the finding.

**The measurement.** Monthly payer, cycle `[2026-05-01, 2026-06-01)`, paycheck **$400**, floor $50. One
debt, $900 balance, $100 per payment, first due `2026-05-02` → **three payments in the cycle** (05-02 ·
05-16 · 05-30 = $300). Run through the exact boundary the app uses (`scaleBnplMinimumsForWindow` then
`allocatePaycheck`), varying **only** `type` and `recurrence`:

| `type` | `recurrence` | scaled minimum | `totalRequired` | `shortfall` | snowball offered |
|---|---|---|---|---|---|
| `bnpl` | `biweekly` | **$300** | **$300** ✅ | $0 | $50 |
| `debt` | `biweekly` | $100 ⛔ | **$100** ⛔ | $0 | **$250** ⛔ |
| `debt` | `weekly` | $100 ⛔ | **$100** ⛔ (truth $500) | $0 | **$250** ⛔ |
| `debt` | `per-paycheck` | $100 ✅ | $100 ✅ | $0 | $250 ✅ |

The first two rows differ in **one field the user picks from a dropdown**, and the answer moves by $200.
The `per-paycheck` row is correct as it stands — "every paycheck" IS once per cycle — so the defect is
exactly `weekly` and `biweekly` on a non-BNPL debt, wherever the pay cycle is longer than the debt's
period (a semimonthly or monthly payer).

**Mechanism (hypothesis).** `occurrencesThisCycle`'s own `[A2]` docstring in `allocatePaycheck.ts:226`
describes this behaviour verbatim — *"a WEEKLY bill under a monthly payer answers 4, and the allocator
was reserving for one of them ... the Guardian called a paycheck clear while three of the four
occurrences were unfunded"* — and its fix landed on the `expenses` producer only. The debt side was
then patched separately and later, by the §2.7.4 BNPL seam, which was scoped to the product surface
that motivated it (pay-in-4) rather than to the cadence. Two fixes for one class, and the intersection
they leave open is a plain debt on a sub-cycle schedule. Stated as a hypothesis: I have not found a
record deciding that a non-BNPL biweekly debt should reserve once.

**Corroborating instrument gap.** `packages/core/engine/testAllocation.ts:295-385` is the `[A2]` block,
and **every one of its three cases passes `debts: []`.** Its section comment claims the class
(*"Sub-cycle obligations occur MORE THAN ONCE inside one pay cycle ... `recurrence` was on the type and
read by nobody"*) while the fixtures only ever exercise expenses — the "ask which member of its class a
test picked" shape. See A3-4.

**Remedy — NOT verified.** Routing `upcomingMinimums` through `occurrencesThisCycle` is the obvious
move and is **not safe as written**: `paidTowardDebt(debt.id)` (`:410`) reconciles allocations by
`debtId`, so synthetic `d1__occ1` ids would break the balance reconciliation the expense branch has no
analogue for. The alternative — widening `hasKnownBnplCadence` past `type === "bnpl"` — changes a
function whose whole name says BNPL and whose `remainingPayments` cap has no meaning for a revolving
debt. Triage must pick the seam before it picks the code.

---


## A3-2 — `blocker` — A weekly or biweekly BILL under a monthly payer: ticking one occurrence marks all of them paid, and the other occurrence rows cannot be ticked at all

**Origin:** `packages/core/engine/allocatePaycheck.ts` · `fix-churn` (consumers: `apps/rn/src/store/store.ts`, `apps/rn/src/app/(tabs)/index.tsx`)

**User-facing consequence.** A monthly payer with a genuine weekly $100 bill sees five "Pay Groceries"
rows for the cycle. **Ticking the first one makes all five disappear and removes $500 from "Leftover
cash"** — the user paid $100 and the app books $500 as spent. **Tapping any of the other four rows does
nothing at all**: the tick does not stick, on every tap, forever.

**File and line.**

- `packages/core/engine/allocatePaycheck.ts:266-289` — the expansion spreads the parent row, so
  `isPaidThisCycle` is copied onto every synthetic occurrence:

  ```ts
  return Array.from({ length: times }, (_, i) => {
      if (i === 0) return expense;
      ...
      return { ...expense, id: `${expense.id}__occ${i}`, dueDate: localISODate(when) };
  });
  ```

  The comment directly above claims the distinct id prevents exactly this — *"reusing the original
  would mark every occurrence paid when one of them was"* — but the **id** is what differs; the flag's
  **value** is copied. A carried premise that the code does not have.
- `apps/rn/src/store/store.ts:601-614` — `markExpensePaid(id, paid)` maps `s.store.requiredExpenses`
  on `e.id === id`. `e1__occ1` is in no store, so the write is a **silent no-op** (no throw, no log).
  `apps/rn/src/app/(tabs)/index.tsx:87-90` passes `row.item.targetId` straight in.
  `deferExpense` (`store.ts:615-628`) is a no-op on the same ids.

**The measurement.** Monthly payer, cycle `[2026-05-01, 2026-06-01)`, paycheck **$1000**, one `weekly`
$100 bill first due `2026-05-02` (5 occurrences: 05-02 · 09 · 16 · 23 · 30), `isPaidThisCycle: true` on
the one stored row:

```
totalRequired: 500
allocations: ["Keep cash buffer=50", "Leftover cash=450"]
affordableUnpaidRequiredCount: 0
```

Five occurrences deducted as already-paid off one tick; leftover reads **$450** where the truth is $850.
With the flag `false`, the same run reports five rows carrying `targetId` `e1`, `e1__occ1` ... `e1__occ4`;
only the first resolves in the store. (`e1__occ2` is visible in A3-1's control row above.)

**Mechanism (hypothesis).** This is `S1.12.5.5` / pass-5 `A5-5`, whose docstring **in this same file**
names both symptoms — *"the paid flag spreads onto all three occurrences and all three are deducted"*
and *"a phantom obligation `e1__occ2` that exists in no store"*. **The fix was
`if (recurrence === "per-paycheck") return 1;` — one line, one member.** `weekly` and `biweekly` still
expand, so they still carry the whole defect wherever the pay cycle is longer than the bill's period
(semimonthly and monthly payers). Hypothesis: the class was closed at the member reported, not at the
expansion.

**Remedy — NOT verified.** Two incompatible directions exist and only a decision picks one: either the
store gains per-occurrence paid state (an id the tick can reach), or the expansion collapses to one row
carrying `amount x occurrences` — which the `[A2]` comment explicitly argues against (*"a single row
carrying 4x the money would fund 'Groceries' all-or-nothing"*). **Do not apply A3-1's remedy and this
one independently — they are the same expansion.**

---

## A3-3 — `major` — `markExpensePaid` / `deferExpense` accept an id that matches no row and report success

**Origin:** `apps/rn/src/store/store.ts` (consumer of `packages/core/engine/allocatePaycheck.ts` · `fix-churn`)

**User-facing consequence.** The general case behind A3-2: any caller can hand these actions an id that
is not in the store and the app behaves as though the write landed. The user taps, the row does not
change, and nothing anywhere says why.

**File and line.** `apps/rn/src/store/store.ts:601-614` (`markExpensePaid`) and `:615-628`
(`deferExpense`) — both are `.map(e => e.id === id ? ... : e)` with **no `find` first and no branch for
zero matches**. `apps/rn/src/store/storeContext.test.ts:43` already calls
`sandbox.getState().markExpensePaid('nope', true)` — the unmatched-id case is **exercised by an existing
test**, which asserts only that the *other* store is untouched. The silence is currently a tested
property rather than a caught one.

**The measurement.** By reading, not by running: `.map` over an array containing no `e.id === 'e1__occ1'`
returns a new array that is element-wise identical, `set` fires, subscribers re-render, and no return
value distinguishes a miss from a hit. A3-2's five-row case is the live instance.

**Mechanism (hypothesis).** The actions were written when every `targetId` was a stored id; the
occurrence expansion introduced ids that are not, and nothing between the two validates the boundary.

**Remedy — NOT verified.** A dev-mode throw or a boolean return would make A3-2 loud rather than silent,
but it is a **symptom guard, not the fix** — and making it throw before A3-2 is resolved would crash the
Today tab on a real user's weekly bill. Sequence matters: fix the id, then close the hole.

---
## A3-4 — `major` — The `[A2]` sub-cycle test block passes `debts: []` in every case, so it green-lights a class it only exercises on one branch

**Origin:** `packages/core/engine/testAllocation.ts` · `stale-read`

**User-facing consequence.** None directly — this is the instrument that would have caught A3-1 and
cannot. It is why a $200 under-reserve has been shippable since the `[A2]` fix landed.

**File and line.** `packages/core/engine/testAllocation.ts:295-385`. Three fixtures —
`weeklyUnderMonthly` (`:303`), `biweeklyUnderMonthly` (`:329`), `monthlyStaysOnce` (`:356`) — and all
three carry `debts: []`. The block's own header (`:295-302`) states the claim at class scope:

> `[A2] Sub-cycle obligations occur MORE THAN ONCE inside one pay cycle. The allocator filtered on a
> single dueDate and summed amount once ... **`recurrence` was on the type and read by nobody.**`

`recurrence` is *still* on `Debt` and *still* read by nobody in this file, and no assertion in the block
can see that.

**The measurement.** `grep -c 'debts: \[\]'` inside `:295-385` returns 3; the block contains no debt
fixture of any cadence. Adding a `type: 'debt', recurrence: 'biweekly'` debt to `weeklyUnderMonthly`'s
shape and asserting `totalRequired` at the true three-occurrence figure fails on the current tree — that
is A3-1's table, which was produced through the same entry point this file uses. The assertion labels
are accurate about what they test ("a weekly **bill**"); the *section comment* is what over-claims.

**Mechanism (hypothesis).** The `[A2]` work fixed the expense branch and wrote the tests against what it
fixed. The comment was written to describe the defect class, the fixtures to describe the fix, and
nothing since has re-read one against the other.

**Remedy — NOT verified.** Adding the missing arity is the obvious step, but it will fail on the
current tree, so it is A3-1's fix and cannot land before it. **Do not narrow the comment to match the
fixtures** — that would close the only record that the class is wider than the fix.

---

## A3-5 — `blocker` — Restoring a backup whose payday has gone stale makes the app report $0 of bills due and recommend the whole paycheck to debt

**Origin:** `packages/core/payCycle/rollPaydayToFuture.ts` · `stale-read` (consumers: `apps/rn/src/store/store.ts`, `app/page.tsx`)

**User-facing consequence.** A user restores a backup made three months ago. The app opens with
`nextPaycheckDate` still set to the backup's payday, in the past. Every bill and minimum whose due date
is *after* that stale date now falls outside "this cycle", so Today shows **no obligations at all**,
`totalRequired` reads **$0**, and the plan recommends sending **$1,450 of a $1,500 paycheck** to debt —
with $1,370 of rent, internet and minimums actually due. **No prompt fires to correct it**: the payday
capture sheet is suppressed by its own staleness guard.

**File and line.**

- `packages/core/payCycle/rollPaydayToFuture.ts:15-32` — the function written for exactly this. Its
  docstring: *"Used on backup import: a backup's `nextPaycheckDate` reflects when the backup was made
  and is often in the past."*
- `app/page.tsx:803` — **the only caller**, and it is the legacy Next root that `P6.11` deletes.
- `apps/rn/src/store/store.ts:954-959` — `importStore`, the RN app's single import door ("shared by
  JSON import + iCloud restore + the Phase-D data bridge"), does `set({ store: runMigrations(store) })`
  and nothing else. `grep -n nextPaycheckDate apps/rn/src/data/migrations.ts` returns **no lines**, so
  the migration merge does not repair it either.
- `apps/rn/src/hooks/use-payday-capture.ts:13-14, 62` — the safety net that does not catch it:
  `recencyWindowDays(payCycle) = CYCLE_DAYS[payCycle] + 7`, i.e. **21 days for a biweekly payer**, and
  `shouldPromptPaydayCapture` (`packages/core/debt/shouldPromptPaydayCapture.ts:37`) returns `false`
  once `daysAfter(nextPaycheckDate, today) > maxRecencyDays`. A 101-day-stale payday is far outside it.

**The measurement.** Backup made 2026-05-20 by a biweekly payer (`nextPaycheckDate: 2026-05-22`),
restored 2026-08-31. Bills: Rent $1,200 due 09-01, Internet $80 due 09-05; Visa minimum $90 due 09-10.
Paycheck $1,500.

```
RESTORED AS-IS (nextPaycheckDate = 2026-05-22)
  totalRequired: 0    shortfall: 0
  allocations: cushion_buffer:Keep cash buffer=$50 | snowball:Extra payment to Visa=$1450

AFTER rollPaydayToFuture -> 2026-09-11
  totalRequired: 1370  shortfall: 0
  allocations: expense:Pay Rent=$1200 | expense:Pay Internet=$80
             | minimum_debt:Pay minimum on Visa=$90 | cushion_buffer:$50 | snowball:$80
```

The same store, the same day, the same helper that already exists in `packages/core` — **$1,450 of
recommended extra payment versus $80.**

**Mechanism (hypothesis).** `rollPaydayToFuture` was written against the legacy root's import path and
wired there. When the RN app grew its own import door it inherited the store shape but not the
roll-forward, and the RN-side mitigation that was written instead (`recencyWindowDays`) addresses a
different symptom — *whether to open the capture sheet* — not *whether the cycle boundary is valid*.
Stated as a hypothesis: I have not read the RN restore's own tests, so it is possible a caller upstream
of `importStore` rolls the date. `grep` finds `rollPaydayToFuture` in no file under `apps/`.

**Remedy — NOT verified.** Calling `rollPaydayToFuture` inside `importStore` looks right and is
**exactly the shape pass 5 warns about**: `importStore` is also the iCloud-restore and legacy-bridge
door, and the legacy bridge migrates a *live* v1.6 install whose payday is legitimately today's — where
`getNextPaycheckDate`'s strictly-future contract would push it a full cycle forward and skip a payday.
The guard `nextPaycheckDate >= todayISO → unchanged` covers that, but it has not been run against the
bridge's fixtures here. Verify against `apps/rn/src/data/legacyBridge/` before applying.

---

## A3-6 — `minor` — `waterFill`'s `structuralDeficit` sums per-segment troughs on a series that is already cumulative, so it overstates the unavoidable gap

**Origin:** `packages/core/cashflow/waterFill.ts` · `stale-read`

**User-facing consequence.** **None today** — `structuralDeficit` is computed, cached and returned but
rendered nowhere: `grep` finds it only in `apps/rn/src/store/selectors.ts:117` (a docstring), the core
tests, and the fuzz harness. It is filed because the value is wrong, the docstring asserts it is right,
and a screen rendering "you are $250 short no matter what" when the answer is $150 is one import away.

**File and line.** `packages/core/cashflow/waterFill.ts:55` —
```ts
const structuralDeficit = roundMoney(segments.reduce((s, seg) => s + seg.troughDeficit, 0));
```
The docstring above it (`:8-13`) states the model and its own premise in the same breath:
*"`carriedBalance` is the un-clamped **CUMULATIVE** running balance (`startingBalance + Σ net`), so
preceding surplus is already carried into every later balance"* … *"Total structural deficit = the sum
of the crunch segments' trough deficits."* **The first sentence is what makes the second wrong**: on a
cumulative series, cash added at cycle 0 lifts every later balance, so the deficits of two separate
below-floor runs are not additive.

**The measurement.** `carriedBalances = [500, 100, 600, 50, 700]`, floor `200`. Two segments
(idx 1, deficit $100; idx 3, deficit $150).

```
structuralDeficit (as reported):            250
global trough deficit (floor - min):        150
after injecting 250 at cycle 0: [750,350,850,300,950] -> segments: []
after injecting 150 at cycle 0: [650,250,750,200,850] -> segments: []
```

**$150 of outside cash clears every below-floor cycle. The function reports $250.** The overstatement
is `Σ troughDeficit − max troughDeficit`, and it grows with the number of separate dips.

⚠️ Same file, second-order: `detectCrunches.ts:270` treats a non-finite balance as *not below floor*, so
a `NaN` cycle **ends a segment**. Measured on `[500, 100, NaN, 50, 700]`: two segments, `structuralDeficit`
$250 — where the same run with a real below-floor value at index 2 would be one segment. A NaN therefore
inflates the figure rather than being neutral, which is the opposite of the parity `waterFill.ts:202-205`
deliberately establishes for `suffixMinCap`.

**Mechanism (hypothesis).** `testWaterFill.ts:47-52` asserts the summing directly — *"two separate
below-floor dips → their deficits SUM (no false-clear from a single source cycle appearing to cover
both)"*. That comment is reasoning about **reserve sourcing** (can one surplus cycle fund two crunches),
which is a different question from **how much money is unavoidably missing**. The hypothesis is that the
right answer to the sourcing question was written into the field that answers the magnitude question.

**Remedy — NOT verified.** `max` over the segments' trough deficits matches the injection test above,
but it would red `testWaterFill.ts:51`, and I have not established which of the two questions §2.4.7.4
intends this field to answer. **This needs the spec read, not a one-line change** — and note that
`prefundedReserve`, the output that *is* user-facing, is unaffected: `suffixMinCap` is computed
independently and was correct on every case measured.

---

## A3-7 — `minor` — `packages/core/forecast/*` is reachable from no shipping surface, is exercised by `test:regression`, and states a claim that inverts when its input goes negative

**Origin:** `packages/core/forecast/{projectForecast,types,getForecastStatus}.ts` · `stale-read`

**User-facing consequence.** None on `apps/rn`. It is filed as the `formatDisplayAmount` shape, which
this repo has already been bitten by once: a money module that survives the `P6.11` deletion of the
legacy root, is asserted-on by a gate that will keep passing, and carries a hole an RN screen would
inherit whole on the day it imports it.

**File and line.**

- Reachability, measured: `grep -rl '@core/forecast/...' apps/rn/src` returns **0 files** for all three
  modules. The only non-test importer in the tree is `components/SnowballSection.tsx:10, 290` — the
  legacy Next root. `apps/rn/src/store/analysisSelectors.ts:151` records the replacement in a comment:
  *"delivers the free forecast job at a higher bar than the old monthly `projectForecast`."*
- `packages/core/testing/testForecastRegression.ts` runs under `test:regression`
  (`package.json:85`), which is in **both** `validate:release:rn` and `validate:release:legacy`.
- `packages/core/forecast/projectForecast.ts:63-68` — the claim that inverts:
  ```ts
  recoveryTrend:
      projectedSafeCash < 200
          ? index === months - 1
              ? "Recovery is not currently projected within the visible forecast window."
              : "Cash pressure is projected to gradually improve across upcoming cycles."
          : "Projected cushion remains within a healthier range."
  ```
  The branch is keyed on the **row's own cash level and its position in the array**, never on the sign
  of `bufferTrendPerMonth`. With a negative trend every non-final row asserts improvement while the
  series declines. Same file `:26-33`: `recoveryMonth` is stamped onto **every** row from the first
  index whose projection clears $200, so a declining series labels rows with a recovery month that has
  already passed relative to them.

**The measurement.** By reading, and bounded honestly: the defect is **not reachable from the live
caller.** `components/SnowballSection.tsx:289` computes
`projectedBufferLift = Math.min(75, Math.max(0, totalMinimumPayment * 0.05))`, which cannot be negative,
so no user meets the inverted claim today. What is measured is the *shape*: a public export in
`packages/core` whose correctness rests entirely on a clamp living in one call site on a surface
scheduled for deletion.

⚠️ Second, on the D3 mandate's "does anything migrate" question: `projectedBufferLift` is a
**fabricated trend** — 5% of the total minimum payment, capped at $75, presented to the user as a
monthly cushion improvement with a named recovery month. It has no basis in the user's cashflow. It
does **not** migrate (`analysisSelectors` replaced it), and it is recorded here only so the deletion is
not read as losing a capability.

**Mechanism (hypothesis).** The RN app built its own forecast and the core module was left in place
rather than deleted with its consumer, because `P6.11` is scoped to the repo root and this file is not
at the repo root. The gate kept running because nothing tells `test:regression` which of its subjects
are still reachable.

**Remedy — NOT verified.** Deleting the three modules with `P6.11` is the obvious move and I have not
checked whether `docs/` or a plan item promises this module to a later phase. If it is kept, the
`recoveryTrend` branch needs the trend's sign, not the row's index — but writing that fix while nothing
consumes it adds an untested branch to dead code.

---
## A3-8 — `major` — `P6.11` deletes `lib/`, and `test:regression` — which is inside `validate:release:rn` — imports four files out of it

**Origin:** `packages/core/testing/testSafeStorage.ts`, `packages/core/testing/testSubscriptionGating.ts` · `s0-first-look`; `packages/core/history/selectVisibleHistory.ts` · `stale-read`

**User-facing consequence.** None directly. It is filed under the brief's D3 mandate item 2 — *"evidence
it is still live … which would make its deletion in `P6.11` a bigger change than the plan assumes."*
`P6.11` is currently a deletion of a surface the shipping app does not use; measured, it is also a
**break of the RN release gate**, and the failure lands at module-resolution time on a runner that
imports 66 suites, so it takes the whole of `test:regression` with it.

**File and line.** Every `@/`-rooted import inside `packages/core` (the alias `tsconfig.json:22` maps to
the **repo root**, `"@/*": ["./*"]`):

| importer | imports | resolves to |
|---|---|---|
| `packages/core/testing/runRegressionTests.ts:39` | `@/lib/storage/testMigrateOriginalBalance` | `lib/storage/testMigrateOriginalBalance.ts` |
| `packages/core/testing/testSafeStorage.ts:8-9` | `@/lib/storage/safeStorage`, `@/lib/storage/migrateState` | `lib/storage/{safeStorage,migrateState}.ts` |
| `packages/core/testing/testSubscriptionGating.ts:1-2` | `@/lib/subscription/hasFeatureAccess`, `@/lib/subscription/features` | `lib/subscription/{hasFeatureAccess,features}.ts` |
| `packages/core/history/selectVisibleHistory.ts:2-3` | `@/lib/subscription/plans`, `@/lib/subscription/hasFeatureAccess` | `lib/subscription/{plans,hasFeatureAccess}.ts` |

All five target files exist and are **tracked by git** (`git ls-files lib/subscription lib/storage`).
`packages/core/testing/runRegressionTests.ts:64,66` registers the two test files, and `package.json:85`
defines `test:regression` as `tsx packages/core/testing/runRegressionTests`, which
`package.json:76` (`validate:release:rn`) and `:78` (`validate:release:legacy`) both run.

**The measurement.** `grep -rn 'from "@/' packages/core` returns exactly the four files above and no
others — so this is the complete population, not a sample. The runner's own line 39 is the sharpest of
them: the gate's entry point reaches into the surface being deleted.

⚠️ **A second, quieter half — the same specifier means two different files.** `apps/rn/tsconfig.json:13`
maps `"@/*": ["./src/*"]`, so `@/lib/subscription/plans` read from the RN project would resolve to
`apps/rn/src/lib/subscription/plans` — which **does not exist** (`ls` errors). Nothing catches it
because `apps/rn/tsconfig.json:17` excludes `./core` (the `packages/core` link) from the RN typecheck,
so `selectVisibleHistory.ts` is compiled only by the root project, under the other meaning of `@/`.
`selectVisibleHistory` has **0 importers in `apps/rn/src`** today; the day one screen imports it, the
module resolves to nothing and the alias is the reason.

**Mechanism (hypothesis).** `packages/core` was extracted from the legacy root and these five edges were
not cut with it — plausibly because the root tsconfig resolves them and the root typecheck is green, so
nothing ever asked whether a *shared* package may depend on an *app*. The direction of the dependency is
the defect; the deletion just makes it visible.

**Remedy — NOT verified.** The obvious move is to relocate the five targets into `packages/core` before
`P6.11` runs. **The subscription three are not obviously relocatable**: `apps/rn` has its own premium
layer (`apps/rn/src/premium/`), so moving `hasFeatureAccess` into core could create the two-producer
disagreement this repo has been bitten by repeatedly. I have not read `apps/rn/src/premium/` and cannot
say whether core needs its own copy, the RN one, or neither. **What is verified is the dependency list
above** — that is what triage should plan against.

---

## A3-9 — `blocker` — With no "typical income" entered, `suggestLean` anchors the conservative income FLOOR to the single HIGHEST paycheck ever recorded — one mistyped confirm sets the plan's income to $42,500

**Origin:** `packages/core/income/suggestLean.ts` · `stale-read`

**User-facing consequence.** A variable-income user whose stored `typicalAmount` is blank confirms three
paychecks: $1,000, $1,000, and a mistyped $50,000 (`5000` with a stuck key — or a bonus, a tax refund,
a double-pay month). The app offers them a suggested income floor of **$42,500**. `lean` is the number
the entire plan runs on — the allocation, the cushion, the Guardian band, the debt-free date — so
accepting the nudge tells the app the user reliably clears forty-two thousand dollars a paycheck. The
same store **with** a typical entered answers **$1,020**.

**File and line.** `packages/core/income/suggestLean.ts:117` —
```ts
const typicalAnchor = Number.isFinite(typical) && typical > 0 ? typical : sorted[sorted.length - 1];
```
`sorted` is ascending (`:116`), so the fallback is the **maximum**. It is then haircut by 15% (`:120`)
and, below `LEARNING_N = 12`, is the entire answer (`w = 0` at `:125`).

**The measurement.** Four runs, varying only what the docstring says cannot matter:

```
3 actuals [1000,1000,50000], NO typical              -> { suggestedLean: 42500, n: 3 }
3 actuals [1000,1000,50000], typical 1200            -> { suggestedLean:  1020, n: 3 }
N=12: eleven 1000s + one 5000, no typical            -> { suggestedLean:  4250, n: 12 }
N=18: seventeen 1000s + one 5000, no typical         -> { suggestedLean:  1000, n: 18 }
```

The third row is the important one: **at exactly `N = LEARNING_N` the blend weight is still 0**
(`(12−12)/6 = 0`, pinned by `testSuggestLean.ts:51` as *"exactly N=12 → still shrinkage (w=0), no
lurch"*), so a full year of confirmed paychecks does not rescue it. Only at N ≥ 18 does the percentile
take over and the answer become correct.

⛔ **This directly contradicts the file's own docstring** (`:70-71`): *"Outlier-robust by construction —
a percentile ignores a single wild high/low, and the shrinkage floor is typical-anchored; combined with
the confirm-required nudge, **one bad entry can't move lean**."* One bad entry moves lean by 42×.

**The condition is reachable.** `apps/rn/src/store/incomeLearning.ts:29` calls
`suggestLean(actuals, Number(store.paycheck.typicalAmount) || 0, currentLean)`. **`|| 0` is the door**:
blank, non-numeric, and a genuine `0` all arrive as `0`, fail `typical > 0`, and take the max branch.
It needs no corrupt store — only a user who never filled in "typical". ⚠️ `store.windfall` is
deliberately excluded from `actuals` (`debtPlannerStorage.ts:190-192`), so a *declared* one-off cannot
reach here — but a typo at the payday confirm is not a windfall, and neither is a real bonus paycheck.

**And the instrument confirms the shape rather than the behaviour.** `packages/core/income/testSuggestLean.ts`
contains both halves of this and they do not meet:

- `:26` — `assertMoney(suggestLean([2000, 2100, 1900], 0, 1500).suggestedLean, 1785, "N<12, no typical → max(2100) × 0.85")`.
  The max branch is **asserted as intended**, on a fixture whose actuals span 1900–2100. On that
  cluster, anchoring to the max is indistinguishable from anchoring to the mean — the member of the
  class with no outlier in it.
- `:36-39` — the outlier-robustness assertion, `"a wild high entry can't inflate lean (percentile
  ignores it)"`, run on **26 actuals plus 50000**. N = 27, deep in the percentile regime, which is the
  one regime where the claim is true.

Together they read as "the fallback is intended AND outliers cannot inflate lean", and the intersection
— an outlier in the low-N regime — is run by neither.

**Mechanism (hypothesis).** The fallback looks written as a divide-by-nothing defence (`sorted` is
non-empty by `:114`, so any element would do) rather than as an estimator, and it inherited the
docstring's robustness claim by proximity. Stated as a hypothesis: I have not found a record choosing
the max deliberately, and `:26`'s label describes the behaviour without arguing for it.

**Remedy — NOT verified.** A conservative fallback (the median, or the low quantile the function already
computes) matches the file's stated model, and **it will red `testSuggestLean.ts:26`** — which is the
assertion that has to be re-decided, not routed around. ⚠️ Two things I did not check and triage must:
whether the confirm flow lets a user accept this in one tap (the docstring promises *"NEVER applied
silently"* and I read only the call site), and whether `incomeLearning.ts`'s `|| 0` should be
distinguishing blank from zero at all — that door is the cheaper fix and closes the reachable half
without touching the estimator.

---

## A3-10 — `minor` — `cyclesPerYear`'s `?? 12` fallback cannot fire, and `computeState` silently substitutes a $200 floor for a user who chose $0

**Origin:** `packages/core/payCycle/cyclesPerYear.ts`, `packages/core/guardian/computeState.ts` · `stale-read`

**User-facing consequence.** For the second half: a user who sets their cushion floor to $0 — "I don't
want money held back" — is graded against **$200** anyway. At $150 of headroom the Guardian reads
`tight`; at $99 it reads `at-risk`. The band drives every word of the Guardian's copy
(`buildMultiCycleTimeline.ts:32`: *"EVERY WORD A USER READS OR HEARS IS KEYED OFF THIS FIELD"*), so the
app warns about a line the user explicitly declined.

**File and line.**

- `packages/core/guardian/computeState.ts:32` and `:44`, the same expression twice:
  ```ts
  const f = Number.isFinite(floor) && floor > 0 ? floor : 200;
  ```
  `floor > 0` conflates *"absent / broken"* with *"the user chose zero"*. `0` is a legitimate value of
  this field in a way that `NaN` is not, and the `> 0` test cannot tell them apart.
  `calibrationScore.ts:96` carries the same literal (`p.floor ?? 200`) but uses `??`, which correctly
  keeps a stored `0` — so **two files in this lane disagree about what a $0 floor means.**
- `packages/core/payCycle/cyclesPerYear.ts:19` — `return CYCLES_PER_YEAR[payCycle] ?? 12;` over a
  `Record<PayCycle, number>` that is **total** over the union (`:11-16`, all four members present).
  The `?? 12` can never be reached from a typed caller: a check that cannot fail, reading exactly like
  a check. Harmless here — flagged because the brief names this class and because its sibling
  `payCyclesPerMonth.ts:14-23` deliberately uses an exhaustive `switch` with no fallback, so the two
  spellings of the same table disagree about whether a default is wanted.

**The measurement.** By reading. `computeState(150, 0)` → `f = 200` → `150 < 200` → `"tight"`;
`computeState(150, 150)` → `"clear"`. `cyclesPerYear`: the record literal at `:11-16` lists `weekly`,
`biweekly`, `semimonthly`, `monthly` — the complete `PayCycle` union from
`getNextPaycheckDate.ts:3` — so no key is absent.

⚠️ **Not measured: whether a $0 floor is reachable from the UI.** `effectivePaycheckBuffer(store)`
supplies it and I did not read that function or the settings form. If $0 is refused at input, this half
is inert and only the two-files-disagree half stands.

**Mechanism (hypothesis).** `200` is the app's default floor, and `floor > 0 ? floor : 200` is the
shape a "default when unset" guard takes when the field is optional. It was written before `0` became a
value the user could mean, and `calibrationScore`'s `??` is what the same intent looks like written
later.

**Remedy — NOT verified.** `Number.isFinite(floor) && floor >= 0 ? floor : 200` matches
`calibrationScore`'s reading and is a one-character change, but it changes the band for anyone whose
stored floor is `0` **because it was never set** rather than because they chose it — which is the
migration question, not a code question. Establish whether a stored `0` can mean "unset" first.

⛔ **Checked after writing the above, and it changes the finding — recorded rather than deleted.**
`packages/core/guardian/testComputeState.ts:41` asserts the substitution as **intended**:
`check("non-positive floor falls back to 200", computeState(300, 0) === "clear" && computeState(150, 0) === "tight")`.
So the `> 0` branch is a tested decision in `computeState`, not an oversight, and this is **not** a
"fix the operator" finding. What survives, and what triage should take:

1. **`calibrationScore.ts:96` uses `??`, which keeps a stored `0`.** Two files in this lane apply
   different rules to the same persisted field, so a user with a `0` floor is *graded* against $0 and
   *banded* against $200 — the scorecard and the card can disagree about whether the same cycle held.
   That disagreement is not asserted anywhere and is the part with no owner.
2. **A third site copies the `computeState` rule by hand**: `buildGuardianBrief.ts:178`,
   `const floor = safeAmount(input.floor) || 200;` — `||`, not the `> 0` test and not `??`. It also
   feeds `reachedFloor = kept >= floor - 1` (`:194`) and the `amt(floor)` printed in four copy branches,
   so the substituted $200 is a number the user *reads*, not only one the band uses.
3. **Whether a $0 floor is reachable from the UI is still unmeasured** — see the warning above.

Downgraded in confidence, not withdrawn: three producers, three spellings, one persisted field.

---
## A3-11 — `blocker` — Hysteresis can hold the band at `tight` while headroom is ABOVE the floor, and the tight branch then prints "$230 … a little under your $200 line" beside a "To debt $30" bar it says does not exist

**Origin:** `packages/core/guardian/buildGuardianBrief.ts` · `stale-read` (with `packages/core/guardian/computeState.ts` · `stale-read`)

**User-facing consequence.** A premium user whose last cycle was bad opens the Payday Guardian card on
a cycle where they have **$230 of headroom against a $200 line** — genuinely above it — and reads:

> **A little tight this paycheck**
> You're covered this paycheck — **$230** after everything required, **a little under your $200 line**,
> so I'm **holding all of it as your cushion**.
> *Nothing extra goes out this paycheck — your cushion rebuilds next paycheck.*

Three claims, three false: $230 is **$30 over** the line, not under it; the plan is **not** holding all
of it; and something **does** go out — the card draws a **"To debt $30"** legend and stat tile
immediately beneath the sentence denying it, and reads the same string to VoiceOver.

**File and line.**

- `packages/core/guardian/computeState.ts:39-56` — with a `priorBand`, the returned band is no longer a
  function of `discretionary < floor`. `:50` and `:55` both require `d > f + HYSTERESIS_BAND` to release
  upward, so the whole window `floor < d ≤ floor + 50` returns `"tight"` **while `d` exceeds `floor`**.
- `packages/core/guardian/buildGuardianBrief.ts:317-335` — the `state !== "clear"` branch, whose copy is
  written against `baseState`'s meaning of tight:
  ```ts
  detail: `You’re covered this paycheck — ${amt(discretionary)} after everything required, ${
      state === "at-risk" ? "under" : "a little under"
  } your ${amt(floor)} line, so I’m holding all of it as your cushion.`,
  safeMove: `Nothing extra goes out this paycheck — your cushion rebuilds next paycheck.`,
  ```
  The word **"under" is a literal**, not a comparison, and `...viz` (`:222`) spreads
  `deployedToDebt` through **unchanged**. Contrast `:243` — the `pausedDeploy` branch, which makes the
  identical claim and *does* override it: `deployedToDebt: 0`. **One of the two branches that deny a
  deploy zeroes the field; the other does not.**
- Both halves are live: `apps/rn/src/store/guardianSelectors.ts:861` passes
  `priorBand: store.priorGuardianBand`, and `apps/rn/src/components/plan/PaydayGuardianCard.tsx:160,
  297, 351, 373` gate the payoff legend, the a11y label, the bar fraction and the stat tile on
  `brief.deployedToDebt > 0`.

**The measurement.** `HYSTERESIS_BAND = 50`, floor `$200`, discretionary `$230`, `priorBand: "at-risk"`.
`allocatePaycheck` on a $1,230 paycheck with $1,000 of rent and `paycheckBuffer: 200`:

```
computeState(230, 200)             -> clear
computeState(230, 200, 'at-risk')  -> tight        <- the only variable
allocator: expense=$1000 | cushion_buffer=$200 | snowball=$30

state       : tight
title       : A little tight this paycheck
detail      : You're covered this paycheck — $230 after everything required, a little under
              your $200 line, so I'm holding all of it as your cushion.
safeMove    : Nothing extra goes out this paycheck — your cushion rebuilds next paycheck.
viz cushion : 200   viz deployedToDebt : 30   floor : 200
```

The whole window is `200 < d ≤ 250` after an at-risk or tight prior band, and the allocator deploys
exactly `d − floor` into it — so the contradiction's size is `d − floor`, up to **$50**, and the "under
your line" sentence is wrong for every dollar of it.

**Mechanism (hypothesis).** `computeState`'s hysteresis (round-4 F4) was added *after* the brief's copy
was written. The copy is correct for `baseState`, where `tight` does mean `discretionary < floor` by
construction; hysteresis breaks that identity by design and nothing re-read the sentences that depended
on it. This is the class the brief names — *"a contingent fact about one caller's arithmetic does not
survive as a law"* — recorded in this very file at `:180-206` about the shortfall branch, and the same
carried premise is still load-bearing thirty lines below the note that names it.

**Remedy — NOT verified.** Three separate things are wrong and a single change fixes at most two:
(1) the "under" literal should be a comparison against `floor`; (2) `deployedToDebt` in this branch
should follow `pausedDeploy`'s precedent and be zeroed — **but only if the copy is the truth**, and it
may be the allocator that should not deploy while the band reads tight, which is a *behaviour* change
and not a copy change; (3) the hysteresis window may simply not want the tight *copy*. Do not pick by
reading — the state and the money disagree here, and which one is authoritative is a decision.

⚠️ **And when it is fixed, run the changed spec GREEN and read its output.** A fixture at
`discretionary = floor` satisfies "not under the line" **and** produces `deployedToDebt = 0`, so it
passes on both the broken and the fixed tree. The discriminating fixture is strictly inside
`floor < d ≤ floor + HYSTERESIS_BAND` with a non-zero prior band.

⛔ **Which of the two is authoritative is already half-answered, and it is not the copy.**
`packages/core/guardian/testComputeState.ts:33` asserts the state machine's side **by name**:

```ts
check("tight stays tight while ≤ floor+BAND (no flap)", computeState(230, 200, "tight") === "tight");
```

That is this finding's exact input — `discretionary 230`, `floor 200`, band `tight` — pinned as
*intended*, with "no flap" as the stated reason. **So the band is correct and the sentence is wrong**:
`buildGuardianBrief`'s tight branch may not say "under your line", may not say "holding all of it", and
may not pass `deployedToDebt` through unchanged. `testComputeState.ts` has an assertion for the state at
this exact point and `testBuildGuardianBrief.ts` has none for the copy at it — which is why one half of
the pair moved and the other did not. Measured: see **A3-14**.

---
## A3-12 — `blocker` — Scan-to-prefill accepts a date that does not exist, and it silently becomes a date in the NEXT month — so the debt drops out of the cycle and the whole paycheck is offered to the snowball

**Origin:** `packages/core/scan/parseStatementText.ts` · `off-surface`

**User-facing consequence.** A user scans a Chase statement. OCR reads the due date `02/28` as `02/30`
(or `04/30` as `04/31` — a 0/8 or 0/1 confusion, the two commonest OCR digit errors). The parser accepts
it, the sheet prefills it, the user taps save. From then on **every date comparison in the app reads
that debt as due on March 2**, not in February at all. On the February cycle the app reports
**$0 required** and recommends **$950 of a $1,000 paycheck as an extra payment** — while the $45 Chase
minimum is due inside that cycle. It is not an error state anywhere: nothing is `NaN`, nothing is
flagged, the debt just quietly belongs to the wrong month.

**File and line.** `packages/core/scan/parseStatementText.ts:154-179`, `toIsoDate`:
```ts
if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31) return `${year}-${pad(mo)}-${pad(day)}`;
...
if (mo && day >= 1 && day <= 31) return `${year}-${pad(mo)}-${pad(day)}`;
```
`day <= 31` is a **shape** check. It does not ask how many days the month has, and both branches carry
it. There is no re-serialise-and-compare.

⛔ **The sibling door was fixed for exactly this, and the fix did not travel.** `packages/core/imports/debtCsv.ts:213-215`:
```ts
const dueDateValid =
    !!dueDate && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && toLocalISODate(parseLocalDate(dueDate)) === dueDate;
```
with the comment three lines above naming **this exact input**: *"The calendar check is not redundant
with the shape check: `2026-02-30` matches the pattern and is not a day. Re-serialising and comparing is
what catches a rolled-over date."* Two text→Debt parsers, one guarded and one not — and
`parseStatementText.ts:101` names `debtCsv` as *"the precedent this mirrors"*.

**The measurement.** Four scanned statements, identical but for the due-date line:

```
"Payment Due Date 02/30/2026"       -> "2026-02-30" -> parseLocalDate = Mon Mar 02 2026 -> round-trip 2026-03-02
"Payment Due Date 13/01/2026"       -> undefined  (month 13 IS caught)
"Payment Due Date February 31, 2026"-> "2026-02-31" -> parseLocalDate = Tue Mar 03 2026 -> round-trip 2026-03-03
"Payment Due Date 04/31/2026"       -> "2026-04-31" -> parseLocalDate = Fri May 01 2026 -> round-trip 2026-05-01
```

Then through the allocator — monthly payer, cycle `[2026-02-01, 2026-03-01)`, paycheck $1,000, one
$1,240 Chase debt with a $45 minimum due `2026-02-30`:

```
totalRequired = 0
allocations: cushion_buffer=$50 | snowball=$950
```

⚠️ **Note the direction, because it is worse than the CSV case the fix was written for.** The CSV
importer's comment predicts `NaN` — a loud failure. Here `parseLocalDate` **succeeds** and returns a
real `Date` in the following month, so nothing downstream can detect it. A silent wrong month beats a
`NaN` for damage.

**Reachability.** Live on both scan doors: `apps/rn/src/app/(tabs)/money.tsx:324` (free
scan-to-prefill → `openEditor({ prefill: parsed })`) and
`apps/rn/src/components/entities/DebtSheet.tsx:161` (premium re-scan). The free door prefills `dueDate`
into the sheet for the user to confirm — and the string they are asked to confirm is `2026-02-30`, which
looks like the date they expect, not like March 2.

**Mechanism (hypothesis).** `debtCsv`'s calendar check was added by `P6.8.9.7.4` against a CSV row; the
scan parser was written to the same *shape* of contract (text → fields) but its own date normaliser
predates or postdates that fix without inheriting it. `toIsoDate` also constructs the string by
`pad()`-ing rather than by round-tripping a `Date`, so there is no point at which a `Date` object could
have disagreed. This is the "iterate the class, never the member" shape with the two members in
different directories.

**Remedy — NOT verified.** Applying `debtCsv`'s round-trip to `toIsoDate`'s two return points is the
obvious move, and I have not checked what the sheet does with `dueDate: undefined` — a prefill that
drops the date is the intended "just isn't prefilled" behaviour per the module docstring (`:99-102`),
but `money.tsx:325` gates the whole sheet on `balance == null && minimumPayment == null && !name`, so
the date's absence does not suppress the prefill and the user is asked for it. Verify that path before
applying.

---

## A3-13 — `minor` — The CSV importer refuses `quarterly` / `annually` on a debt that the app's own debt sheet offers, on a premise another core file has already measured false

**Origin:** `packages/core/imports/debtCsv.ts` · `neighbour`

**User-facing consequence.** A user with a quarterly student loan or an annual insurance-financed debt
adds it by hand without difficulty, and their CSV import of the same debt is **skipped** with
*"recurrence must be one-time, weekly, biweekly, per-paycheck, or monthly"*. The FAQ's promise that
"rows with missing required fields will be skipped with a count shown" reads as a data problem, and the
data is fine.

**File and line.** `packages/core/imports/debtCsv.ts:42` —
```ts
const allowedRecurrences: Recurrence[] = ["one-time", "weekly", "biweekly", "per-paycheck", "monthly"];
```
and the docstring above it (`:37-41`) states the premise:

> *"Narrower than the `Recurrence` union, deliberately. A debt is terminating by definition, so its
> cadence describes the repayment rhythm; **the quarterly/annual members exist for bills.**"*

**The measurement.** Two producers contradict that sentence:

- `apps/rn/src/components/entities/DebtSheet.tsx:40` —
  `recurrenceOptions(['monthly','weekly','biweekly','per-paycheck','quarterly','annually'])`, fed to the
  **plain-debt** recurrence picker at `:395`. Both refused values are on screen.
- `packages/core/types/recurrence.ts:42-47` — `debtAmountSuffix`'s docstring documents a **measured**
  case of the thing the comment says does not exist: *"a **quarterly** student loan read **$600/mo**, a
  12x overstatement."* That defect was found on a quarterly *debt*, in this repo.

So the CSV parser's narrowing rests on a claim the type file next door has already disproved with a
worked example.

**Mechanism (hypothesis).** The narrowing was written when `Recurrence` was shared between bills and
debts and the CSV author reasoned about which members made sense; `DebtSheet` later offered the full set
(or already did) and no gate compares the two lists — `allowedRecurrences` is a private literal, and the
picker's list is another private literal, so the disagreement has no owner.

**Remedy — NOT verified.** Widening `allowedRecurrences` to the full union is one line and is
**probably wrong on its own**: `one-time` is in the CSV list and *not* in the sheet's, so the two lists
disagree in both directions and simply unioning them would let a CSV express something the sheet cannot
edit afterwards. The real remedy is one owner for "cadences a DEBT may have", next to
`CADENCE_SUFFIX` — which is where `debtAmountSuffix` already lives for the same reason.

---
## A3-14 — `major` — `testBuildGuardianBrief.ts` never passes a `priorBand`, and its one `tight` fixture is the single arity where both of the tight branch's claims happen to be true

**Origin:** `packages/core/guardian/testBuildGuardianBrief.ts` · `stale-read`

**User-facing consequence.** None directly. It is the instrument that lets A3-11 ship, and it is the
brief's *"ask which member of its class a test picked"* shape exactly: the fixture is not merely thin,
it is **the one member of the class that cannot fail.**

**File and line.**

- `packages/core/guardian/testBuildGuardianBrief.ts:51-54` — the whole tight case:
  ```ts
  const tight = buildGuardianBrief(input({ discretionary: 150, kept: 150, deployedToDebt: 0, floor: 200 }));
  assertEqual(tight.state, "tight", "headroom under the line → tight");
  assertTrue(/holding all of it as your cushion/i.test(tight.detail), "tight premium keeps everything, deploys nothing");
  assertTrue(/covered this paycheck/i.test(tight.detail) && /rebuilds next paycheck/i.test(tight.safeMove ?? ""), "…");
  ```
  `discretionary 150 < floor 200` makes *"a little under your $200 line"* true, and
  `deployedToDebt: 0` makes *"holding all of it"* / *"nothing extra goes out"* true. **Both of the
  branch's false claims are true of this one input**, so the assertions pass over the defect and would
  pass over it after any fix.
- `grep -c priorBand packages/core/guardian/testBuildGuardianBrief.ts` → **0**. The
  `input()` helper (`:12-14`) does not supply one and no case overrides it, so **every one of the
  file's ~25 briefs is built stateless** — the hysteresis dimension that `computeState` exists to
  provide is absent from the copy layer entirely.
- The default fixture is `discretionary: 210, kept: 200, deployedToDebt: 10, floor: 200` (`:13`) — i.e.
  the *clear* side of the same boundary. Add `priorBand: 'tight'` to that untouched default and the band
  flips to `tight` while `deployedToDebt` stays `10`, which is A3-11 in one word.

**The measurement.** Every `deployedToDebt` value in the file, listed: `10, 10, 2660, 40, 40, 160, 0,
NaN, 6, 96, 2, 80, 160, 160, 10, 40, 500, 0`. The **only** two zeros are the two tight cases (`:51`
plain, `:186` debt-free), and they are the only two cases whose `discretionary` is below `floor`.
Non-zero deploy and a non-clear band never co-occur in any fixture — which is precisely the state
hysteresis produces and the only state in which the tight copy is wrong.

⚠️ **`:117-120` proves the file knows how to make this assertion.** The `pausedDeploy` case passes
`deployedToDebt: 80` and then asserts `assertEqual(paused.deployedToDebt, 0, "paused: deploy to debt is
0 (never planned on phantom income)")` — the exact shape the tight branch needs and does not have. One
of the two branches that deny a deploy is pinned; the other is not.

**Mechanism (hypothesis).** The tight fixture was written against `baseState`'s definition of tight,
where `discretionary < floor` and a zero deploy are the same fact. Hysteresis broke that coupling in
`computeState` and was tested *there* (`testComputeState.ts:33`, by name) but the brief's fixtures were
never revisited, because from the copy layer nothing looked like it had changed.

**Remedy — NOT verified.** A fixture inside `floor < discretionary ≤ floor + HYSTERESIS_BAND` with
`priorBand: 'tight'` and a non-zero `deployedToDebt` is the discriminating case, and **it will fail on
the current tree** — so it is A3-11's fix and cannot land before the decision A3-11 describes. ⚠️ When
it does: run it green and read the output, not the exit code. An assertion written as
`!/holding all of it/.test(detail)` is satisfied by a brief that says nothing at all, and the
`pausedDeploy` branch above shows the file already returns briefs whose `detail` is a different sentence
entirely.

---
## A3-15 — `major` — `optional_goal`'s membership in the §2.2 partition is guarded by nothing: both reconciliation files derive their bucket set from the lists they check, and neither ever funds that bucket

**Origin:** `packages/core/guardian/testGuardianPartition.ts` · `stale-read` (with `packages/core/engine/testExpenseReserve.ts` · `stale-read`)

**User-facing consequence.** None directly. The §2.2 partition is what stops held money being counted
as both cushion and put-to-work — the "F3 cushion lie" the bucket split was created to kill — and
`allocatePaycheck.ts:70-77` names this reconciliation as the reason a category's list membership *"is
not optional"*. For `optional_goal` — every savings goal in the app — that guard does not exist.

**File and line.**

- `packages/core/engine/allocatePaycheck.ts:70-77` — the claim: *"`testGuardianPartition` reconciles
  PROTECTED + PUT_TO_WORK as EXHAUSTIVE of discretionary, so a category in neither list silently breaks
  the partition."*
- The subject is derived from the object, in **both** files that make the assertion:
  `packages/core/guardian/testGuardianPartition.ts:21` and
  `packages/core/engine/testExpenseReserve.ts:55`, identically:
  ```ts
  const DISCRETIONARY_BUCKETS = [...PROTECTED_CUSHION_CATEGORIES, ...PUT_TO_WORK_CATEGORIES] as AllocationCategory[];
  ```
  Removing a name from a list removes it from the sum **and** from what the sum is compared against, so
  the reconciliation bites only when a fixture actually puts money in the removed bucket. A category
  added to a list is self-satisfying: it appears on both sides of the equation at once.
- Neither file can produce an `optional_goal` row. `testGuardianPartition.ts:23-54` (`alloc`) passes
  `goals: []` unconditionally; its `EF()` helper (`:185`) builds only `type: "emergency"` goals;
  `testExpenseReserve.ts:34-47` (`alloc`) passes `goals: []` too.

**The measurement.** Two parts.

*(a) The population.* `grep -rl PUT_TO_WORK_CATEGORIES` over the repo returns exactly two test files —
`testGuardianPartition.ts` and `testExpenseReserve.ts` — and `grep -c '"savings"'` returns **0** in
both. There is no third reconciliation site.

*(b) What the missing fixture would have caught.* One `type: "savings"` goal, $2,000 paycheck, no
obligations, $200 floor:

```
allocations: cushion_buffer=$200 | optional_goal=$600 | true_leftover=$1200
discretionary                : 2000
sum(ALL buckets)             : 2000   -> partition HOLDS
sum(ALL minus optional_goal) : 1400   -> partition BREAKS
```

The second line is what deleting `optional_goal` from `PUT_TO_WORK_CATEGORIES` does — **$600 of the
user's money vanishing from the partition** — and it only reds on a fixture that funds the bucket. Since
neither file has one, that deletion is green today.

⛔ **Correction, recorded rather than quietly dropped.** I first wrote this finding naming **two**
uncovered categories, `expense_reserve` and `optional_goal`, because neither is funded anywhere in
`testGuardianPartition.ts`. **`expense_reserve` is in fact guarded** — by the *other* file:
`testExpenseReserve.ts:101-108` funds it (`expenseReserveContribution: 175`) and then asserts
`sum(held, ALL_BUCKETS) === discretionary(held)`, so removing it from `PROTECTED_CUSHION_CATEGORIES`
reds that line. What is wrong there is only the **docstring's citation**: `allocatePaycheck.ts:75`
credits `testGuardianPartition` for a property a different file actually holds, so a reader deleting or
narrowing `testExpenseReserve` would not know they were removing the partition's only cover for that
bucket. `optional_goal` is the category with no cover at all.

**Mechanism (hypothesis).** The two reconciliation files were each written for the feature that
motivated them — the holdback composition and the 3.8 reserve — and each incidentally covers the buckets
its own feature funds. Nothing owns the question *"is every discretionary category funded by at least
one reconciled fixture?"*, so coverage is a side effect of what happened to be built, and the
`optional_goal` rung (§2.9) was added to the union and to `PUT_TO_WORK_CATEGORIES` without one.

**Remedy — NOT verified.** Two changes, and only the second is the real one:

1. A fixture in `testGuardianPartition.ts` with a `type: "savings"` goal, reconciled like the others.
   Cheap, and it closes today's hole. Fix `allocatePaycheck.ts:75` to name both files while there.
2. **Declare the bucket set independently of the two lists**, so a union member reaching neither list
   fails regardless of fixtures. Without this the hole reopens with the next category. ⚠️ I have not
   established the mechanism: a runtime enumeration of `AllocationCategory` does not exist, so this is
   likely a type-level exhaustiveness check in `allocatePaycheck.ts` rather than an assertion in a test
   — a different edit in a different file, and one I have not confirmed TypeScript expresses cleanly
   over two `as const satisfies` arrays.

⚠️ **And whichever is done: plant it.** Deleting `optional_goal` from `PUT_TO_WORK_CATEGORIES` must red
the suite. That is the only thing that distinguishes a guard from a restatement, and for this bucket the
files are currently a restatement.

---
## A3-16 — `major` — The subscription-gating suite in the RN release gate tests a feature matrix the RN app does not have, and its "catches an unwired feature" claim is unenforceable in either surface

**Origin:** `packages/core/testing/testSubscriptionGating.ts` · `s0-first-look`

**User-facing consequence.** None directly. It is filed because of what it is *believed* to prove:
`test:regression` is inside `validate:release:rn` (`package.json:76`), and this is the only suite in
that gate whose subject is "what does a paying user get". It is evidence about a surface `P6.11`
deletes, and it is read as evidence about the shipping app.

**File and line.** Three separate ways this suite falls short, in order of how load-bearing they are.

**(1) It tests a gating mechanism `apps/rn` does not use.** Measured:
`grep -rn "hasFeatureAccess\|PremiumFeature" apps/rn/src` returns **zero lines**. The shipping app gates
with a plain boolean on the store — `store.subscriptionPlan === 'premium'`, at 11 non-test sites
(`(tabs)/index.tsx:133`, `money.tsx:350`, `progress.tsx:99`, `cushion-forecast.tsx:26`,
`paywall.tsx:128`, `DebtSheet.tsx:110`, `AffordabilityCard.tsx:44`, `SaveForItSheet.tsx:58`,
`WindfallSheet.tsx:46`, …) plus its own `apps/rn/src/premium/` layer (`premiumKind.ts` and friends).
There is no `PremiumFeature` union in the RN app and no `premium_plus` tier reachable from it. So this
suite's seven-feature matrix describes the **legacy root only**.

**(2) Its stated purpose is not enforceable.** `packages/core/testing/testSubscriptionGating.ts:53-65`:

> *"Every PremiumFeature must be wired into the free/premium/premium_plus matrix. **If a future feature
> is added without being listed here, that's a real gating bug this test exists to catch immediately**,
> not discover after release."*
> ```ts
> const ALL_PREMIUM_FEATURES: PremiumFeature[] = [ "forecasting", ... ];
> ```

A `PremiumFeature[]` annotation checks that every element **is** a `PremiumFeature`; it does not check
that every `PremiumFeature` **is** an element. Adding an eighth member to the union at
`lib/subscription/features.ts:5-12` and not to this array compiles clean and the suite stays green —
the exact opposite of what the comment promises. ⚠️ **The enforceable pattern is in the file the test
imports from**: `features.ts:21` declares `premiumFeatureLabels: Record<PremiumFeature, string>`, which
*is* total and *does* red on a new member. The test could have derived its list from
`Object.keys(premiumFeatureLabels)` and did not.

**(3) The failure it names cannot occur anyway.** `lib/subscription/hasFeatureAccess.ts:13-23` has **no
per-feature table**: `premium_plus → true`, `premium → !premiumPlusOnlyFeatures.includes(feature)`,
`free → false`. It is total over any string typed as a `PremiumFeature`, so an "unwired" feature is not
a reachable state. The comment describes a matrix implementation that this function is not.

**The measurement.** `grep` counts, stated so they are checkable:
`hasFeatureAccess|PremiumFeature` in `apps/rn/src` → **0**; `subscriptionPlan === 'premium'` in
`apps/rn/src` (non-test) → **11**; members of the `PremiumFeature` union (`features.ts:5-12`) → **7**;
elements of `ALL_PREMIUM_FEATURES` (`testSubscriptionGating.ts:57-65`) → **7**. The two 7s agree
**today**; nothing makes them agree tomorrow.

**Compounding with A3-8.** This same file imports `@/lib/subscription/hasFeatureAccess` and
`@/lib/subscription/features` — i.e. it is one of the four files whose dependency `P6.11` deletes. So
the suite (a) breaks the RN release gate when the root goes, and (b) proves nothing about the RN app
either way. **Both facts point the same direction and neither is a reason to keep it running.**

**Mechanism (hypothesis).** The matrix and its test were written for the legacy Next app, where a
feature-keyed gate was the design. The RN rewrite chose a single premium boolean and never needed the
union; the suite stayed registered in `runRegressionTests.ts:64` because nothing tells the runner which
of its subjects are still reachable — the same cause as A3-7.

**Remedy — NOT verified.** Retiring it with `P6.11` is the coherent move and I have **not** established
that nothing else depends on the union: `premiumMarketingHighlights` (`features.ts:38-43`) feeds the
paywall's copy, and if the RN paywall reads it, the module survives the deletion and the test's subject
becomes real again. ⚠️ **Check that before deleting**, and note the ordering: if `premium_plus` is ever
made purchasable in the RN app it will need a gate, and this file is the closest thing to a record of
what that tier was supposed to withhold — worth reading before it is dropped, not after.

---
## A3-17 — `major` — Eight release-gate assertions named "backup …" test `JSON.stringify` on an object literal and touch no backup code at all

**Origin:** `packages/core/testing/testPlannerStateHardening.ts`, `packages/core/testing/testFinalLaunchRegression.ts` · `s0-first-look`

**User-facing consequence.** None directly. It is filed because of what these assertions are *read as*:
`test:regression` sits inside `validate:release:rn` (`package.json:76`), and eight of its assertions
carry the word "backup" while proving a property of the JavaScript engine. Backup/restore is the one
path in this app where a defect loses a user's whole portfolio — and A3-5 is a live restore defect that
this gate had no chance of seeing.

**File and line.** The same block, written twice.

- `packages/core/testing/testPlannerStateHardening.ts:143-176` — five assertions:
  ```ts
  const backupPayload = { version: 1, amount: "1500", payoffStrategy: "snowball", requiredExpenses: expenses, debts, goals: [], completedRecommendedActions: [ … ] };
  const restored = JSON.parse(JSON.stringify(backupPayload));
  assertEqual(restored.amount, "1500", "backup amount roundtrip");
  assertEqual(restored.payoffStrategy, "snowball", "backup strategy roundtrip");
  assertEqual(restored.debts[0].id, "card", "backup debt ID roundtrip");
  assertEqual(restored.completedRecommendedActions[0].targetId, "paypal-2", "backup completed action target ID roundtrip");
  assertMoney(restored.completedRecommendedActions[0].actualAmount, 100, "backup completed action amount roundtrip");
  ```
- `packages/core/testing/testFinalLaunchRegression.ts:196-227` — three more, same shape:
  *"backup preserves paid expense state"*, *"backup preserves paid debt minimum state"*,
  *"backup preserves completed recommendation amount"*.

**The measurement.** The two files' complete import lists:

| file | imports |
|---|---|
| `testPlannerStateHardening.ts:1-6` | `allocatePaycheck`, `rolloverDebts`, `rolloverRequiredExpenses`, types |
| `testFinalLaunchRegression.ts:1-6` | `allocatePaycheck`, `rolloverDebts`, `rolloverRequiredExpenses`, types |

**Neither imports a backup module.** `backupPayload` is an object literal declared four lines above the
assertion; `JSON.parse(JSON.stringify(x))` returning `x`'s values is a property of the runtime. There is
no serialiser, no reader, no version field handling, no migration — and there is a real one to point at:
`apps/rn/src/data/backup.ts`, `readBackup.ts`, `detectBackupFormat.ts`.

⚠️ **And even the accidental property is tested on the safe member.** The genuine round-trip hazard in
this codebase is named in `packages/core/utils/amountField.ts:5-9`: *"`JSON.stringify` serialises `NaN`
and `Infinity` alike as `null`. A debt whose balance reads `null` is loaded as `0` … `money.tsx` files
every debt with `balance <= 0` under the literal header `PAID OFF`."* Every value in both fixtures is a
finite number or a plain string, so the one input class that does not survive `JSON.stringify` is in
neither. `testAmountField.ts:79-82` **does** test it properly (`assert(n != null && JSON.parse(JSON.stringify({ n })).n === n, …)`)
— so the correct pattern is in the repo already, one directory away.

**Mechanism (hypothesis).** These read like placeholders that hardened into assertions: someone wanted
the launch suite to say something about backup, wrote the shape of the check before the backup module
was importable from `packages/core` (it lives in `apps/rn/src/data/`, which core cannot import — the
same boundary `debtCsv.ts:10-14` describes for `File`), and the placeholder was never replaced. The
duplication across two files suggests it was copied rather than reasoned about the second time.

**Remedy — NOT verified.** Deleting the eight assertions is honest and loses nothing measurable. Moving
them to a real round-trip is the better answer and **has a boundary problem I have not solved**:
`packages/core` cannot import `apps/rn/src/data/backup.ts`, so the test has to live on the RN side
(`test:app`), not in `test:regression` — which changes which gate covers it. ⚠️ Whichever is chosen,
the replacement must include a **non-finite** fixture (`NaN` / `Infinity` balance), because that is the
input the current pair is blind to and the one `amountField.ts` says destroys a portfolio.

---
## A3-18 — `blocker` — On the LAST payment of every debt the cycle ledger charges the full stated minimum instead of the balance, and a test asserts the wrong number as correct

**Origin:** `packages/core/timeline/buildTimelineItems.ts` · `fix-churn` (asserted by `packages/core/testing/testV11Regression.ts` · `s0-first-look`)

**User-facing consequence.** A user's Visa is down to **$20** against a stated **$75** minimum — the
last payment on that card, which every debt reaches exactly once. Today says *"Pay minimum on Visa
**$20**"*. The Progress tab's cycle ledger, one tab away, says *"Pay minimum on Visa **$75**"* and
draws a running balance **$55 lower**, and the cycle's `endingBalance` inherits it. Two figures for one
payment, both labelled with the same words, on the payment the user is most likely to look at twice.

**File and line.**

- `packages/core/timeline/buildTimelineItems.ts:98` — `amount: debt.minimumPayment`, the **raw stored
  field**, with no balance cap. The guard two lines above (`:91`) is
  `if (debt.balance <= 0 && !paidThisCycle) continue;` — it drops a **zero** balance and lets every
  balance *between* zero and the minimum through at the full minimum.
- `packages/core/engine/allocatePaycheck.ts:344-347, 499-501` — the engine caps it, twice:
  `Math.min(debt.minimumPayment, debt.balance)` in `debtMinimumRequiredTotal`, and
  `Math.min(debt.minimumPayment, remainingDebtBalance)` when allocating. `buildCycleSnapshot.ts:74-77`
  caps it too (`Math.min(effectiveMinimumInWindow(...), debt.balance)`, with the comment *"`Math.min(…,
  balance)` is kept for the NON-BNPL path, which the helper does not cap"*). **Three producers cap it;
  the ledger does not.**

**The measurement.** One debt, `balance: 20`, `minimumPayment: 75`, unpaid, due inside the cycle;
$1,000 paycheck, no buffer:

```
ENGINE  totalRequired: 20
ENGINE  allocations  : minimum_debt:Pay minimum on Visa=$20 | true_leftover:Leftover cash=$980

LEDGER rows:
   paycheck       Paycheck Received       amount=$1000  runningCash=$1000
   minimum_debt   Pay minimum on Visa     amount=$75    runningCash=$925
```

And it propagates into the forecast — `buildMultiCycleTimeline` on the same store:

```
cycle 0  endingBalance : 925   <- getEndingBalance(), i.e. the LEDGER's last runningCash
cycle 0  net           : 980   <- cycleNet(), i.e. the ENGINE's totalRequired
cycle 0  carriedBalance: 980
disagreement: 55
```

`endingBalance` seeds the next cycle's starting balance (`buildMultiCycleTimeline.ts:331-339`, whose own
comment says so), so the understatement carries forward, while `net`/`carriedBalance` — what the
water-fill reads — carry the correct figure. **The two halves of the same cycle object disagree by the
overstatement.**

⛔ **And the wrong number is pinned as correct.** `packages/core/testing/testV11Regression.ts:114-115`:
```ts
assertEqual(visaItem.amount, 75, "Timeline shows the full planned minimum payment amount");
assertEqual(visaItem.runningCash, 925, "Debt minimum reduces timeline cash regardless of paid status");
```
on a fixture declared four lines earlier with `balance: 20, minimumPayment: 75` (`:74-76`). The word
**"planned"** is what makes the label false: the plan is $20. The fixture was evidently built to test
*"a paid minimum still appears in the ledger"* and the balance-below-minimum arity came along for free,
unnoticed, and got an expectation written around it.

**Mechanism (hypothesis).** `buildTimelineItems` reads the raw store rows rather than the allocation for
required items — deliberately, so a *paid* obligation still renders (`:70-73`, `:87-91`) — and that
reading skipped the cap the allocation applies. The `balance <= 0` guard suggests the author was
thinking about "is this debt still live", which is a different question from "how much is owed this
cycle". Stated as a hypothesis: I have not found a record choosing to show the stated minimum over the
amount owed.

**Remedy — NOT verified.** `Math.min(debt.minimumPayment, debt.balance)` at `:98` matches all three
other producers and is one line — and **it will red `testV11Regression.ts:114-115`**, which is the
assertion that has to be re-decided rather than routed around. ⚠️ Two things to check first, both of
which pass-5's lessons say a remedy of this shape gets wrong: (1) the **paid** branch — for a debt
already paid this cycle the honest figure may be what was actually paid, not either of these, and
`buildCycleSnapshot` uses `effectiveMinimumInWindow` there rather than the raw field; (2) **BNPL** —
`buildMultiCycleTimeline.ts:137` hands this function `scaleBnplMinimumsForWindow(debts, …)`, whose
scaled minimum is *already* capped at the balance (`bnplInstallment.ts:268`), so a second cap is inert
for BNPL but the interaction should be run, not reasoned about.

---
