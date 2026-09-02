# B1 — selectors lane · pass 7 findings

Subject: what the stored number is turned into before a screen sees it.
Manifest: ROUTING-B1.txt (40 files, 7,282 lines). Branch v1.7-dev.

## B1-1 — `blocker` · `selectSaveForItOptions` paces the save plan off the PARTITION TOTAL while the card that opens it prints SPENDABLE — a $835/paycheck promise out of $675

**Origin:** `fix-churn` (`apps/rn/src/store/guardianSelectors.ts`).

**User-facing consequence.** The affordability card shows the user **$675** as this paycheck's spare —
`AffordabilityImpactBar before={result.discretionaryNow}` on the premium short branch
(`AffordabilityCard.tsx:251`), and the sentence *"You have about $675 spare this paycheck"* verbatim on the
free branch (`:241`) — and, because the purchase is SHORT, offers **Save for it** (`:252`). The sheet that opens states
*"**$835**/paycheck · 3 paychecks · ready by **Oct 30**"* — a pace **$160 larger than the spare cash the
same screen just quoted**, and a date derived from it. Tapping *Start saving* writes that number into the
store as the goal's `priorityPerPaycheck` (`SaveForItSheet.tsx:109`), so it is not only a false sentence:
the engine is then asked to reserve $835 a paycheck, before debt, out of $675 of actually-spendable cash.
`SaveForItSheet.tsx:43`'s own docblock says *"No path promises a date the engine won't keep."*

**File and line.**
- `apps/rn/src/store/guardianSelectors.ts:725` — `const discretionary = base ? selectDiscretionary(base) : 0;`
- against `apps/rn/src/store/guardianSelectors.ts:512` — `selectSpendable(base) + …`, 213 lines above, in the same file.
- `apps/rn/src/store/planSelectors.ts:143-164` — `selectSpendable`'s docblock is the record of this exact defect (T4.1b) at its first site.

**Measurement.** One store, one variable (`expenseReserve.contribution.amount = 175`); probe
`b1-probes/p1-saveforit.ts`, run under `tsx` from `apps/rn`, exit 0. Store: premium · $1,200 monthly
paycheck · rent $350 due in-cycle · electric $120 due after the next payday · no debts · floor $200.
Purchase $2,500.

```
selectDiscretionary      = 850
selectSpendable          = 675     (difference = expenseReserveHeld 175)

-- the card the sheet is opened FROM --
verdict                  = short
discretionaryNow (shown) = 675

-- the sheet it opens --
fast       perPaycheck=835 paychecks=3 readyBy=2026-10-30
balanced   perPaycheck=420 paychecks=6 readyBy=2027-01-28

-- the same formula on the SPENDABLE figure --
fast  perPaycheck=625 paychecks=4
```

The `fast` pace is 835 against a spendable 675; the honest answer is 625 over 4 paychecks, and the ready-by
date is one whole pay cycle early.

**Mechanism, as a HYPOTHESIS.** T4.1b introduced `selectSpendable` and converted **one** call site —
`selectAffordability` — because that was the site the finding named (`guardianSelectors.ts:488-491`:
*"This card prints the figure to the user"*). `selectSaveForItOptions` prints a figure to the user too, off
the same purchase, on the sheet that card opens, and it was never converted. This is the
*"the fix reached the reported instance and left a sibling asserting on the same store"* class, with the
sibling **in the same file**. The three deliberate `selectDiscretionary` keeps (`:302`, `:351`, `:372`,
`:829`) are all BAND/holds-line questions and carry explicit notes saying why; `:725` carries no note at
all — it is the one site in the file where the choice was never argued.

**Why no instrument saw it.** `affordability.test.ts:45-68` builds the reserve-bearing fixture
(`withReserve`) and asserts the card/hero relationship on it — then calls `selectSaveForItOptions(s, 2500)`
at `:128` on the **plain** `s`, which holds no reserve. The one fixture that can discriminate is never
handed to the selector that is wrong.

**Remedy — UNVERIFIED.** Read `selectSpendable(base)` at `:725`, and consider adding the top-up surplus the
card adds at `:512` (a second, smaller divergence: the sheet does not see money the user already moved). I
have not run this change; `guardianSelectors.ts:334-345` records that flipping a call site between these
two moved 347 of 1,820 allocations at a *different* site, so the blast radius of even a one-word change
here must be measured before it is taken.

## B1-2 — `blocker` · the expense-reserve offer counts the existing contribution TWICE, so it offers money the engine cannot hold and then says it holds the full recommendation

**Origin:** `stale-read` (`apps/rn/src/store/expenseReserveSelectors.ts`).

**User-facing consequence.** With $175 already set by, the "Spoken for" sheet offers **"Set by $650.00"**.
The user taps it. The engine holds **$650 in total**, not $175 + $650 — so **$175 the app said would be set
aside for their upcoming bills is not**. Worse, the offer then **re-arms**, and on the second pass it takes
the confident copy branch: *"Set by $225.00 for your upcoming expenses?"* / *"That's the **full $1,050.00**
your expenses average out to."* — a completeness claim about a reserve the engine is clamping at $650.
`SpokenForSheet.tsx:97-99` names this exact shape as the defect it exists to refuse: *"promising $231 and
reserving $150 is the promise-an-outcome-deliver-less defect this app has already shipped twice."*

**File and line.** `apps/rn/src/store/expenseReserveSelectors.ts:127-129`

```ts
const spare = round(
  Math.max(0, selectDiscretionary(allocation) - sumCategory(allocation, 'cushion_buffer')) + alreadyReserved,
);
```

`selectDiscretionary` is the PARTITION TOTAL — `planSelectors.ts:146-151` states that
`sum(ALL_BUCKETS) === discretionary`, and `expense_reserve` is one of those buckets. So the contribution
already held **is inside `selectDiscretionary`**, and `+ alreadyReserved` adds it a second time. The
comment beside it (*"plus whatever is currently held, so an existing contribution does not read as
unavailable to itself"*) is a carried premise that is false of the expression it explains.
Consumer chain: `(tabs)/index.tsx:218` → `SpokenForSheet.tsx:115` `onReserve(offer.alreadyReserved + offer.offer)`
→ `store.ts:1019 setExpenseReserveContribution`.

**Measurement.** One store, one variable (the stored contribution); probe `b1-probes/p2-reserve-offer.ts`,
run under `tsx` from `apps/rn`, exit 0. Store: premium · $1,200 monthly · rent $350 due in-cycle ·
insurance $700 due 2026-09-20 (so it lifts the smoothed recommendation without touching this cycle's
obligations) · floor $200 · no debts.

```
== A · $175 already reserved ==
  allocation.expenseReserveHeld = 175      bucket cushion_buffer = 200
  selectDiscretionary      = 850   (already contains expense_reserve 175)
  formula spare = max(0,disc-cb)+already = 650 + 175 = 825
  true ceiling  = disc - cb              = 650
  OFFER = { recommended: 1050, spare: 825, offer: 650, alreadyReserved: 175,
            coversRecommendation: false, potAfter: 825 }

>>> the user TAKES the offer: contribution 175 -> 825; the offer promised potAfter = 825

== B · after taking it (contribution 825) ==
  allocation.expenseReserveHeld = 650            <-- not 825
  formula spare = 650 + 825 = 1475               <-- true ceiling still 650
  OFFER = { recommended: 1050, spare: 1475, offer: 225, alreadyReserved: 825,
            coversRecommendation: true, potAfter: 1050 }
  selectExpenseReserveNow (what the Money hero reads) = 650
```

Two false statements fall out of one expression. `potAfter` — whose own comment is *"the pot if the user
takes this offer — **what the Money hero will read**"* — says **825**; `selectExpenseReserveNow`, which its
own docblock calls *"the number the Expenses hero shows"*, reads **650**. Two producers of one sentence,
disagreeing by exactly `alreadyReserved`. And `coversRecommendation` flips to **true** at a target the
engine will not hold.

**Mechanism, as a HYPOTHESIS.** `spare` was written to answer *"what can the engine hold in total"* and was
derived by reading the floor out of the partition, but `alreadyReserved` was then added under the
assumption that `selectDiscretionary` had already had it removed. It has not — the reserve is a member of
`PROTECTED_CUSHION_CATEGORIES` and stays inside the partition total. The error is invisible whenever
`alreadyReserved === 0`, which is every fixture in `expenseReserve.test.ts` (see B1-3).

**Remedy — UNVERIFIED.** Drop `+ alreadyReserved` from `:128`. `offer = max(0, target - alreadyReserved)`
already subtracts it once at `:133`, so the cap and the delta are then consistent. I have not applied or
run this; the second-order effect on `potAfter` and on `coversRecommendation`'s copy branch is unmeasured.

## B1-3 — `major` · `expenseReserve.test.ts` asserts "offering the number must reserve exactly that number" and only ever runs it with **zero** already reserved

**Origin:** `stale-read` (`apps/rn/src/store/expenseReserve.test.ts`) — the instrument for B1-2.

**Consequence.** The one assertion written to catch a broken reserve promise cannot see B1-2. It reports
green while covering only the half of the input space in which the defect is arithmetically absent.
Run on 2026-09-02 from `apps/rn`: `npx tsx src/store/expenseReserve.test.ts` -> **exit 0**,
`✅ 3.8 expense reserve: 46 assertions passed.`

**File and line.** `apps/rn/src/store/expenseReserve.test.ts:82-89`

```ts
const thin = selectExpenseReserveOffer(store({ paycheck: { ...store().paycheck, amount: '550' } }))!;
...
const thinStore = store({ paycheck: {...}, expenseReserve: held(thin.offer) });
eq(selectAllocation(thinStore)!.expenseReserveHeld, thin.offer, '…and the engine holds exactly what was offered');
```

**Measurement.** The `thin` store carries no `expenseReserve`, so `alreadyReserved` is `0` and therefore
`target === offer` and `spare`'s `+ alreadyReserved` term is `+0`. Every one of the four offer assertions
(`:79`, `:80`, `:83`, `:84`) and both engine checks (`:87`, `:89`) run on a store with no prior
contribution. Probe `p2-reserve-offer.ts` runs the same assertion's shape with `alreadyReserved = 175` and
gets `expenseReserveHeld = 650` against an offered total of `825` — the assertion's own claim, false.

**Mechanism, as a HYPOTHESIS.** `held(n)` is the fixture helper for "a contribution exists", and the offer
block never composes it with the offer block's own store — the reserve-bearing fixtures live in a different
block (`:98-105`). This is the *check that cannot fail* shape: the assertion is exactly right, and the one
input that would exercise it is not in the set.

**Remedy — UNVERIFIED.** Add one case: take `selectExpenseReserveOffer` on a store already holding a
contribution, set `expenseReserve` to `alreadyReserved + offer` (what `SpokenForSheet.tsx:115` writes), and
assert `expenseReserveHeld === alreadyReserved + offer`. Unrun — under the current code it should red, and
that should be confirmed before it is added.

## B1-4 — `blocker` · A1's netting reached the band and stopped: `PlanSummary.shortfall`/`.status`, `paywallLead` and `selectRecoveryPlan` still read the RAW shortfall, so Today says "Short this paycheck" while the Guardian beside it says clear

**Origin:** `fix-churn` (`planSelectors.ts`) · `stale-read` (`paywallLead.ts`, `recoverySelectors.ts`).

**User-facing consequence.** A premium user is $210 short, takes the Guardian's own one-tap and moves $500
from Vacation. The Guardian card turns **clear**. On the same screen, PlanHero's status line reads
**"Short this paycheck"** in amber, and the Guardian card — headline clear — renders a **Recovery Plan**
telling them to defer bills to close a $210 gap they have already closed. If they then open the paywall,
its opening line is *"This paycheck comes up **$210** short."* followed by *"Recovery Plan is the guided
catch-up for a cycle like this one."* — selling a feature against a gap the app's own band says is gone,
on the one surface where the app asks for their money.

`topUpSelectors.ts:56-58` states the settled rule verbatim: *"THE TOP-UP IS NETTED AGAINST THE SHORTFALL
EXACTLY ONCE, AND **EVERY READ TAKES THE RESULT**."* 🎯 2026-08-26.

**File and line.**
- `apps/rn/src/store/planSelectors.ts:463` — `const shortfall = allocation.shortfall ?? 0;` (raw)
- `apps/rn/src/store/planSelectors.ts:508` — `status: overdue ? 'overdue' : shortfall > 0 ? 'short' : 'on-track'` (raw)
  — while `:488-493`, **twenty lines above in the same function**, nets it for `cushionStatus`.
- `apps/rn/src/store/paywallLead.ts:66` — `if (summary.shortfall > 0)` (raw)
- `apps/rn/src/store/recoverySelectors.ts:28-29` — `const gap = allocation.shortfall ?? 0; if (gap <= 0) return null;` (raw)
- Renders: `PlanHero.tsx:151-156` (`statusLabel`), `paywall.tsx:146`, `index.tsx:157` →
  `PaydayGuardianCard.tsx:442` (`isPremium && recovery`, **no band gate**).

**Measurement.** One store, one variable (`cycleTopUp.amount`); probes `b1-probes/p3-netted-shortfall.ts`
and `p4-recovery-raw.ts`, run under `tsx` from `apps/rn`, both exit 0.

```
=== cycleTopUp = none ===                     === cycleTopUp = 400 ===
  allocation.shortfall (raw)   = 150            allocation.shortfall (raw)   = 150
  nettedTopUp residual/surplus = 150 / 0        nettedTopUp residual/surplus = 0 / 250
  Guardian band (brief.state)  = at-risk        Guardian band (brief.state)  = clear
  PlanSummary.cushionStatus    = pressure       PlanSummary.cushionStatus    = stable
  PlanSummary.shortfall        = 150            PlanSummary.shortfall        = 150     <-- unchanged
  PlanSummary.status           = short          PlanSummary.status           = short   <-- unchanged
  PlanHero statusLabel         = "Short this…"  PlanHero statusLabel         = "Short this paycheck"
  paywall lead.fact  = "…comes up $150 short."  paywall lead.fact  = "…comes up $150 short."
```

and, on a second store (raw shortfall 210, top-up 500 → residual 0):

```
selectRecoveryPlan = {"gap":210,…,"closeable":false,"residualGap":210}   <-- identical with and without the $500
```

**One returned object contradicts itself:** `PlanSummary` carries `cushionStatus: 'stable'` (netted) beside
`status: 'short'` (raw), and `PlanHero` reads the second.

**Mechanism, as a HYPOTHESIS.** `nettedTopUp` was created (S1.9.3 A1) to be the one owner, and its own
docblock enumerates the three producers it was written for — *"the card, `selectPlanSummary` and the
forecast"*. In `selectPlanSummary` it was wired to **`cushionStatus` only**; `shortfall` and `status` sat
three lines below and were not touched. `paywallLead` and `selectRecoveryPlan` consume the same quantity
one and two hops downstream and were never enumerated at all. `selectTightTopUp` (`guardianSelectors.ts:364-370`)
carries an explicit note saying it takes the residual *"not the raw engine figure"* for precisely this
reason — the reasoning exists in the tree and reached three of six readers.

**Remedy — UNVERIFIED, and one call site must NOT change.** `PlanHero.tsx:99` computes
`required = requiredTotal − shortfall` as a **partition** segment, and its own docblock says the
conservation invariant depends on that subtraction; feeding it a netted figure would break the bar. So a
blanket swap of `PlanSummary.shortfall` is wrong. The narrower candidate is to net `status` (and
`paywallLead`'s branch, and `selectRecoveryPlan`'s gate) while leaving the partition arithmetic on the raw
engine figure — i.e. `PlanSummary` needs both numbers, distinguishable by name. I have neither implemented
nor run this; per the brief, more than half of pre-authored remedies do not survive contact, and this one
touches a conservation invariant.

## B1-5 — `blocker` · an `originalBalance` repair on a CLEARED debt can never be answered, so every progress figure in the app is withheld for the life of the install

**Origin:** `fix-churn` (`apps/rn/src/store/trustSelectors.ts`) · surfaces in `celebrationSelectors.ts`, `payoffSelectors.ts`.

**User-facing consequence.** A user restores a backup in which one **already-paid-off** debt's starting
balance could not be read. The repairs card tells them *"Chase — **the starting balance** couldn't be read.
Your plan is running without it **until you set it again**."* **There is no control anywhere in the app
that sets it.** `mayClaim(store, 'debt-balances')` is therefore `false` forever, and it gates:

- the Progress ring — `progress.tsx:290/352-357`: a permanent **"—"** where the percentage goes;
- the whole payoff view — `progress.tsx:111` `gagBalanceDerived`: **no debt-free date, no trajectory, no
  per-debt clear waypoints, no interest-saved, no safe-floor band**, permanently;
- the Home Screen widget — `widget/snapshot.ts:216-240`: date, `pctLabel` and `remaining` all **"—"**;
- the once-ever debt-free finale — `celebrationSelectors.ts:171`.

This is blocker `C1` (`trustSelectors.ts:384-398`) verbatim — *"for the life of the install, with no way to
clear it"* — on a field `C1`'s three signals do not reach.

**File and line.**
- `apps/rn/src/store/trustSelectors.ts:510-512` — `answerableByEdit` returns `true` here (entity `debt`,
  non-empty `id`, not a whole-row loss), so `clearResuppliedRepairs:469`'s acknowledgement branch is
  **not** taken and the record can only be cleared by signal 1, *the named field's value moved*.
- `apps/rn/src/store/trustSelectors.ts:553-559` — `answerBalanceRepairs` filters `r.field === 'balance'`
  exactly, so re-confirming the balance does not clear it either.
- `apps/rn/src/components/entities/DebtSheet.tsx:78, 237, 283-296` — `originalBalance` is stamped **only on
  add** and is explicitly excluded from the prefill; `submit()`'s `fields` object has no such key, and
  `updateDebt` never receives one.
- `apps/rn/src/store/store.ts:512-520` — the only writer on the edit path is `raiseOriginalBalance`, a
  **high-water mark**: on a cleared debt (`balance: 0`) there is nothing to raise to.
- `apps/rn/src/components/plan/dataRepairsCopy.ts:161, 173` — `actionable = answerableByEdit`, so this
  repair takes the *"until you set it again"* branch rather than the *"there is nothing to reopen for it"*
  branch that exists for exactly this case.

**Measurement.** Probe `b1-probes/p5-originalbalance-repair.ts`, driving the **real wired store**
(`createDebtStore()`), so `clearResuppliedRepairs` runs in the `set` wrapper. One store: Chase genuinely
paid off (`balance: 0`, balance read fine) with `{entity:'debt', id:'chase', field:'originalBalance',
kind:'lost'}`, beside a live Amex. Exit 0.

```
answerableByEdit(repair) = true   <- true => the ack branch is NOT taken
0 · seeded                              repairs=["originalBalance"]      mayClaim=false  chase.originalBalance=0
1 · edited the debt through the form    repairs=["originalBalance"]      mayClaim=false  chase.originalBalance=0
2 · acknowledged the repairs card       repairs=["originalBalance(ack)"] mayClaim=false  chase.originalBalance=0
3 · re-verified the $0 balance          repairs=["originalBalance(ack)"] mayClaim=false  chase.originalBalance=0
4 · edited the OTHER debt               repairs=["originalBalance(ack)"] mayClaim=false  chase.originalBalance=0

  selectPaidOffDebts(Chase).amount = null
  selectCelebrationStats.totalPaid = 0
  progress ring / payoff view / widget gate mayClaim(debt-balances) = false

⭐ CONTROL — same repair, LIVE balance, one balance edit:
   repairs = []  originalBalance = 600  mayClaim = true
```

The control is what makes the rows above mean something: the probe **can** observe a repair clearing, and
the mechanism is exactly the high-water raise — which a $0 balance cannot trigger.

**Mechanism, as a HYPOTHESIS.** `answerableByEdit` was narrowed at `B5-7` from *"does the repair carry a
name"* to *"does the repair name a row you can open"* (`:500-504`: *"the question is asked of the `id`,
which is what identifies a row you can open"*). The question the consumers actually need is *"is there a
control that writes this FIELD"*, and for every other routed field the two coincide because the debt form
has a control for it. `originalBalance` is the one routed field with **no control**, so the row-level
question answers `true` about a field-level impossibility — the same row-vs-field confusion `B5-7`'s own
docblock is about, one axis over. On a live debt the high-water raise papers over it; on a cleared debt
nothing does.

**Remedy — UNVERIFIED, and the obvious one is wrong.** Making `answerableByEdit` return `false` for
`originalBalance` would route it to `clearResuppliedRepairs:469`'s `!r.acknowledged` — i.e. one *"Got it"*
tap would clear it — and that is `A-J2-1` (*the ack hides the CARD, it does not un-repair the DATA*) on a
field the finale sums from. A field-level answerability question, separate from the row-level one, plus a
copy branch that says what a user can actually do, is the shape I would test first. Neither written nor
run.

### B1-5 · corroboration — the enumeration that already ran, and what it counted

`DataRepairsCard.tsx:38-46` records the previous pass at this exact class:

> ⛔ **"UNTIL YOU SET IT AGAIN" WAS FALSE FOR THREE OF THE FIVE PRODUCERS OF A REPAIR RECORD.**
> [P6.8.9.7.11.13.8 · J1-4] … ⚡ **Enumerated from the producers, not from the audit's list.**
> ⚠️ **The pace half of this closed differently** — at `.11.13.4`, by making the promise TRUE:
> `GoalSheet` now writes `priorityPerPaycheck`, so a stood-down goal has a route.

`J1-4` enumerated over **record shapes** (whole-list · whole-row · `migration` count) and, separately,
noticed one **field** with no writer (`priorityPerPaycheck`) and gave it one. It never turned that second
observation into the general question — *does a control exist that writes this field?* — asked of all 15
routed fields. Of the ten that name a real row, `debt.originalBalance` is the only one still without a
writer, and it is the one member left. `plan`-entity repairs carry `id: ''` (`migrations.ts:299`), so
`answerableByEdit` is `false` for them and the acknowledgement is their exit by design.

## B1-6 — `major` · `trustSelectors.test.ts` gates that every repairable field is ROUTED and never that any routed field can be ANSWERED — the C1 block runs one field

**Origin:** `fix-churn` (`apps/rn/src/store/trustSelectors.test.ts`) — the instrument for B1-5.

**Consequence.** The suite's strongest gate proves a *completeness* property in one direction only. A field
that is routed but has no answer path passes every assertion in the file, so B1-5 shipped with 15 fields
under a gate whose failure message is about routing.

**File and line.**
- `apps/rn/src/store/trustSelectors.test.ts:219-301` — the completeness gate. It asserts, in both
  directions, that every entry of `REPAIRABLE_MONEY_FIELDS` is named by a claim (or recorded in
  `CATCH_ALL_IS_THE_DECISION`) and that no claim routes a field the repair layer cannot write.
  **There is no third loop asking whether the field can be un-repaired.**
- `apps/rn/src/store/trustSelectors.test.ts:406-442` — the C1 block, *"a repair is a question, and nothing
  could answer it"*. Every fixture in it varies `balance`: `updateDebt('d0', { balance: 1200 })` (`:420`),
  `verifyDebtBalance('d0', 0, DAY)` (`:437`), `verifyDebtBalances([...])` (`:440`).
- `:472-517` and `:519-561` cover the two record-shape classes (blank name; whole-row / whole-list /
  `migration`) — again over shapes, never over fields.

**Measurement.** `REPAIRABLE_MONEY_FIELDS` (`migrations.ts:262-268`) declares 15 fields, and `:277`
asserts that count. Ten of them name a real row. Grepping every write site: `debt.balance`,
`minimumPayment`, `apr`, `scheduledPaymentAmount` are written by `DebtSheet.submit()`'s `fields`
(`DebtSheet.tsx:254-266, 283-295`); `requiredExpense.amount`, `livingExpense.amount`,
`goal.targetAmount`, `goal.currentAmount` by their sheets; `goal.priorityPerPaycheck` by
`GoalSheet.tsx:137` (added at `.11.13.4` for this reason). **`debt.originalBalance` is written at
`DebtSheet.tsx:237` on ADD only** and is explicitly skipped from the prefill at `:78`. Probe
`p5-originalbalance-repair.ts` drives the real store through every door and the repair survives all of
them; the control shows the probe can see one clear.

I have **not** planted an error to prove this file reds — the finding is not *"the check failed to catch"*
but *"the check does not ask"*, which is read off the file's own loops, and the C1 block's three fixtures
are enumerable by eye.

**Mechanism, as a HYPOTHESIS.** The completeness gate was written at pass 2 (`C2`/`C4`) against the failure
*"the rule was wired to a subset of fields"*. Answerability arrived separately, at `C1`, as a story about
one field (`balance`) and later about record shapes. The two never met, so the file has a per-field gate
for routing and a per-shape gate for answering, and the cell where they cross — *a routed field on a real
row with no writer* — is checked by neither.

**Remedy — UNVERIFIED.** A third loop over `REPAIRABLE_MONEY_FIELDS`, in the same style as the routing
gate: for each row-naming field, seed the repair, drive the app's own write action, and assert the record
clears — failing with a message that names the field and asks for a control or an explicit
`NO_CONTROL_EXISTS` record with a reason (mirroring `CATCH_ALL_IS_THE_DECISION`). Unrun; under the current
code it should red on `debt.originalBalance` and that should be confirmed before the loop is trusted.

### B1-4 · the sharpest pair, measured on the suite's own fixture

`guardianSelectors.test.ts:369-370` defines `cycle(short, topUp)`. On **`cycle(400, 200)`** — its own
`⭐ A1 control` store — the suite asserts at `:418-419`:

```ts
assert(!!brief?.detail?.includes('$200'), '⛔ A1 — the shortfall named is what is STILL short');
assert(!brief?.detail?.includes('$400'), '…never the gap before the money the user already moved');
```

Probe `b1-probes/p6-fourth-seam.ts`, exit 0, on that same store:

```
Guardian card detail  = "You’re about $200 short of the expenses due before your next paycheck — this one needs a plan."
paywall lead.fact     = "This paycheck comes up $400 short."
```

**$400 is the exact string the suite forbids the card from printing, printed by the paywall, on the same
store, about the same gap.**

And on **`cycle(50, 200)`** — where `:439` asserts the band is `tight`, i.e. the obligations *are* met:

```
  card / summary.cushionStatus / forecast[0].cushionStatus = tight · tight · tight   agree? = true
  summary.status        = short          PlanHero statusLabel = "Short this paycheck"
  summary.shortfall     = 50             paywall lead.fact    = "This paycheck comes up $50 short."
  selectRecoveryPlan gap = 50
```

## B1-7 — `major` · the "three producers must agree" invariant compares three fields of an object that carries a fourth, contradicting one

**Origin:** `stale-read` (`apps/rn/src/store/guardianSelectors.test.ts`) — the instrument for B1-4.

**Consequence.** The suite's strongest cross-seam gate holds `PlanSummary` in its hand, reads
`.cushionStatus` off it, and does not read `.status` — which is the field `PlanHero` renders. It reports
agreement while the object it just built disagrees with itself.

**File and line.** `apps/rn/src/store/guardianSelectors.test.ts:471-479`

```ts
const bands = (st: DebtStore) => {
  const a = selectAllocation(st)!;
  return {
    card: toCushionStatus(selectPaydayGuardian(st)!.state),
    summary: selectPlanSummary(st, a, selectRequiredRows(st, a)).cushionStatus,
    forecast: selectCashTimeline(st)[0]?.cushionStatus,
  };
};
```

and `:373-379`, the A1 block's `reads()`, which enumerates `band · holdsLine · verdict · shortBy · spare`
— five reads of this money, none of them `summary.status`, `paywallLead` or `selectRecoveryPlan`.

**Measurement.** Probe `p6-fourth-seam.ts` copies the suite's `store()` (`:26-72`) and `cycle()`
(`:369-370`) helpers verbatim and prints both sets side by side; output above. On `cycle(50, 200)` the
three compared values agree at `tight` while `summary.status` — from the **same call** — is `short`.
`npm run test:app` was run on this tree first: **exit 0, "App-layer regression tests: ALL PASSED."**

**Mechanism, as a HYPOTHESIS.** `bands()` was written to compare the three producers `computeState`'s
docblock names, and it selects the one field of `PlanSummary` that is *about the band*. `status` is also
about the band — `PlanHero.tsx:144-156` colours the hero from `summary.status` exactly as it would from
`cushionStatus` — but it was never in `computeState`'s enumeration, because it is derived from `shortfall`
rather than from `computeState`. The gate inherited the producer list from the docblock rather than
deriving it from *what reads this money*, which is the failure its own comment (`:462-465`) predicts:
*"a test that pins three bands goes green again the moment a fourth reader of this money is added without
asking."* The fourth reader was not added — it was there first.

**Remedy — UNVERIFIED.** Add `status` (and, on a store with a shortfall, `paywallLead(summary, …).fact`
and `!!selectRecoveryPlan(st)`) to `bands()`'s returned object and to the `agree()` set, mapped into one
vocabulary. Under the current code that should red on `cycle(50, 200)`; I have not run it, and it should be
confirmed to red before it is trusted.

---

## Findings SPLIT BY ORIGIN

Manifest: 40 files · 7,282 lines. Origin mix in `ROUTING-ORIGINS.tsv`: **8 `fix-churn` · 2 `neighbour` ·
30 `stale-read`** (no `instrument`-origin file is routed to B1 — the instruments below are test files whose
routed origin is `fix-churn` or `stale-read`).

| origin | files in manifest | findings | blocker | major | minor |
|---|---|---|---|---|---|
| **`fix-churn`** | 8 | **4** — B1-1, B1-4 (part), B1-5, B1-6 | 3 | 1 | 0 |
| **`stale-read`** | 30 | **4** — B1-2, B1-3, B1-4 (part), B1-7 | 1 | 3 | 0 |
| **`neighbour`** | 2 | 0 | 0 | 0 | 0 |
| **total** | 40 | **7** | **4** | **3** | **0** |

*(B1-4 spans both: `planSelectors.ts` is `fix-churn`, `paywallLead.ts` and `recoverySelectors.ts` are
`stale-read`. It is counted once in the total and shown in both rows above.)*

**By finding:**

| id | severity | origin | file |
|---|---|---|---|
| B1-1 | blocker | `fix-churn` | `store/guardianSelectors.ts:725` |
| B1-2 | blocker | `stale-read` | `store/expenseReserveSelectors.ts:127-129` |
| B1-3 | major | `stale-read` | `store/expenseReserve.test.ts:82-89` |
| B1-4 | blocker | `fix-churn` + `stale-read` | `store/planSelectors.ts:463,508` · `store/paywallLead.ts:66` · `store/recoverySelectors.ts:28` |
| B1-5 | blocker | `fix-churn` | `store/trustSelectors.ts:510-512, 553-559` |
| B1-6 | major | `fix-churn` | `store/trustSelectors.test.ts:219-301, 406-442` |
| B1-7 | major | `stale-read` | `store/guardianSelectors.test.ts:471-479` |

**The `neighbour` files** (`tutorialSelectors.ts`, `tutorialSelectors.test.ts`) were read in full. They
carry no money claim — the tutorial invitation matrix is a tier/prefs decision — and the two-producer
question that origin exists to expose (`prefs.tutorialSeen` vs the dropped `guardianIntroSeen`) is closed
by construction at 5.6, asserted at `tutorialSelectors.test.ts:91-95`. Nothing to report.

## What was measured, and the state of the tree

- `npm run test:app` from `apps/rn`: **exit 0**, `✅ App-layer regression tests: ALL PASSED.` Every finding
  below sits under that green.
- `npx tsx src/store/expenseReserve.test.ts`: **exit 0**, 46 assertions.
- Six probes, all exit 0, under `--max-old-space-size=1536`, no OOM:
  `b1-probes/p1-saveforit.ts` · `p2-reserve-offer.ts` · `p3-netted-shortfall.ts` · `p4-recovery-raw.ts` ·
  `p5-originalbalance-repair.ts` · `p6-fourth-seam.ts`. They are read-only: they build stores in memory and
  print. **Nothing outside `docs/audits/2026-09-02-s1-money-pass7/` was written, no source was edited, and
  no plant was applied — so there is no restore to verify.**
- No sub-agents were spawned. No typecheck, no lint, no Playwright, no server.

## Two things I looked at and did NOT report, recorded so the next pass does not re-spend the time

- **`rowFieldUnread` / `anyRowFieldUnread` diverge from `poisons` on a whole-row loss** whose entity the
  claim does not route (`trustSelectors.ts:350, 372` short-circuit on `isWholeRowLossField` before the
  routing intersection is consulted). Every live call site passes a claim that *does* route its entity
  (`selectCelebration`, `savingsPoolIncomplete`, `selectPaidOffDebts`, `money.tsx:588`), so today the
  divergence can only over-suppress, never over-claim. Worth a guard, not a finding.
- **`selectPayoffView` has four consumers and only `progress.tsx:111` applies `gagBalanceDerived`.** I
  checked the other three rather than reporting them: `widget/snapshot.ts:220` has its own, *wider* guard
  (`mayClaim('debt-balances') && mayClaim('row-figures')`, `:216`); `money.tsx:234` is lane C's;
  `CompletionStep.tsx:36` runs at onboarding completion, where a repaired store is not reachable by any
  path I could construct. `progress.tsx`'s `ringA11y` (`:315-319`) does state *"no milestones reached yet ·
  next milestone 25%"* while the percentage itself is withheld — that file is **lane C's** (`fix-churn`),
  and it is flagged here only so it is not lost between manifests.
