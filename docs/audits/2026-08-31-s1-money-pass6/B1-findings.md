# S1 money pass 6 — lane B1 findings (selectors, guardians, trust)

Subject: `apps/rn/src/store/` selector/guardian/trust modules. 40 files.

## B1-1 — blocker — the once-ever debt-free FINALE is stamped over an unread balance, survives the gag, and fires when the user answers the repair card

**Origin:** `apps/rn/src/store/payoffCelebration.ts` (`stale-read`) · `apps/rn/src/store/celebrationSelectors.ts` (`stale-read`) · `apps/rn/src/store/store.ts` (not on my manifest — the wiring).

**User-facing consequence.** A user restores a backup with one unreadable balance, pays off their other
card, then does exactly what the repair card asks — retypes the lost number. The moment they save it, the
**full-screen once-ever "you are debt-free" finale fires**, over a $12,000 card they still owe in full and
have just re-entered, reading **"$15,000 paid off · 1 debt"**. It fires once and it cannot be got back.

**File and line.**
- `apps/rn/src/store/payoffCelebration.ts:45` — `const liveAfter = after.filter((d) => d.balance > 0); if (liveAfter.length === 0) return { kind: 'finale' };`
- `apps/rn/src/store/store.ts:65-71` — `withPayoffCelebration` persists that record into `store.pendingPayoff`.
- `apps/rn/src/store/celebrationSelectors.ts:159` — `if (pending.kind === 'finale') return mayClaim(store, 'debt-balances') ? pending : null;`
- `apps/rn/src/store/store.ts:817` — the ONLY clear of `pendingPayoff` is `acknowledgePayoff`.

**The measurement.** Through the real wired store (`createDebtStore()`), one variable — Chase's balance was
lost on import and repaired to `0`; Amex read fine:

```
START  liveness=has-debt mayClaim=false pendingPayoff=null

AFTER paying Amex $400 (logManualPayment)
  pendingPayoff      : {"kind":"finale"}
  selectCelebration  : null            <- the gag works, at this instant

AFTER re-entering Chase = $12,000 (updateDebt)
  pendingDataRepairs : []
  liveness           : has-debt
  mayClaim(balances) : true
  Chase balance      : 12000
  pendingPayoff      : {"kind":"finale"}   <- never re-examined
  selectCelebration  : {"kind":"finale"}   <- FIRES
  celebrationStats   : {"totalPaid":15000,"debtsCleared":1,"monthsToFreedom":null}
```

**Mechanism (hypothesis).** `celebrationSelectors.ts:141-145` argues *"The gate is on the READ, never on
`detectPayoff` … the record is stamped and this withholds the render — so the moment is still there when
the user re-enters the number and [C1]'s reset path clears the repair."* That reasoning assumes the stamped
record is CORRECT and merely early. It is not: `liveAfter.length === 0` is `balance > 0` membership over a
list in which the unread debt sits at a repaired `0`, so **the unread debt is the reason the finale
condition was met at all**. Answering the repair is exactly the event that both (a) makes the record false
in a way now visible and (b) lifts the gag that was hiding it. The gag is a deferral, and the thing being
deferred is a wrong answer. This is `C4-2`'s class — *every existing guard covered the AMOUNT and none
covered the MEMBERSHIP* — inside the celebration path rather than the trophy shelf.

⚠️ `detectPayoff` is the one liveness site the ledger records as covered-by-the-render
(`check-trust-claims.ts:447`: *"the render is gated by `selectCelebration` (pass-2 `C3`)"*). Measured, the
render gate is a **delay**, not a filter, because the record outlives the condition it was gated on.

⚠️ **The standing test stops one assertion short, and that is why this is still open.**
`apps/rn/src/store/trustSelectors.test.ts:332-344` builds this exact store (`migrated(['n/a', 400])`, the
lost balance beside a readable one), asserts `pendingPayoff?.kind === 'finale'` — *"the crossing is
STAMPED — never gate detection"* — and then asserts `selectCelebration(pending) === null`. It never runs
the store forward through the repair being answered, which is the only moment the record becomes visible.
The suite is green and the defect is one action away from its last assertion.

**Remedy — NOT VERIFIED.** The membership question belongs in `detectPayoff`, but `detectPayoff` takes
`Debt[]` and has no store, so it cannot ask `partitionDebts`. Two candidate shapes, neither built or run:
(a) `withPayoffCelebration` downgrades a `finale` to a `beat` (or stamps nothing) when
`hasUnreadDebtBalances(next)`; (b) `selectCelebration` re-validates a stored `finale` against
`debtLiveness(store) === 'debt-free'` rather than only against `mayClaim`. ⚠️ (b) alone would still leave a
stale `finale` for a user who is genuinely debt-free later, and (a) risks the *"crossing never detected
again"* loss `store.ts:48-60` records. Triage should measure both against `payoffCelebration.test.ts` and
`storeActions.test.ts`.

## B1-2 — major — `selectCelebrationStats.totalPaid` sums EVERY debt's `originalBalance`, live ones included, while `debtsCleared` beside it counts only the guarded partition

**Origin:** `apps/rn/src/store/celebrationSelectors.ts` — `stale-read`.

**User-facing consequence.** The finale's headline trio can print a total that includes debt the user still
owes. In B1-1's store it read **"$15,000 paid off · 1 debt"** — $15,000 is Chase's $12,000 original plus
Amex's $3,000, of which only Amex was ever cleared.

**File and line.** `apps/rn/src/store/celebrationSelectors.ts:101` —
`const totalPaid = round2(debts.reduce((sum, d) => sum + (d.originalBalance ?? Math.max(0, d.balance)), 0));`
against line 106's `const cleared = clearedDebts(store);` and line 115's `debtsCleared: cleared.length`.

**The measurement.** Two stores. First, B1-1's, through the real wired store:
`celebrationStats : {"totalPaid":15000,"debtsCleared":1,"monthsToFreedom":null}` — one cleared $3,000 debt
and one live $12,000 debt. Second, `celebrationSelectors.test.ts`'s **own** `paidOffClaimClass` fixture,
run verbatim:

```
UNREAD (the suite's own fixture): totalPaid=18000  debtsCleared=0  shelf=0  isLastLiveDebt(a1)=false
CONTROL                        : totalPaid=18000  debtsCleared=0  shelf=0  isLastLiveDebt(a1)=false
```

$18,000 "paid off" beside "0 debts cleared", on a store where nothing is cleared — and identically in both
worlds, because `totalPaid` never asks about cleared-ness at all.

⚠️ **The suite walks the class and this is not one of the surfaces.** `celebrationSelectors.test.ts:112-118`
declares `SURFACES` as the trophy shelf, `debtsCleared`, and `isLastLiveDebt`, with the docblock
*"THE ASSERTION WALKS THE SURFACES, because fixing the one that was reported is what produced this round."*
`totalPaid` — the figure the finale prints as its headline, and the one `C-4`'s docblock names
(*"the finale states '$12,400 paid off', which `selectCelebrationStats` sums from exactly that field"*) —
is the fourth surface and is absent from the list.

**Mechanism (hypothesis).** `C4-2` moved `debtsCleared` onto `clearedDebts(store)` — the guarded partition —
and left `totalPaid` on the raw `store.debts` reduce one line above it. The docblock at line 92 still says
*"Total originally owed across all debts (the sum paid off)"*, which is only the same quantity when every
debt is cleared. That is true at a genuine finale and false at every other moment this object can be read,
which B1-1 shows is reachable.

**Remedy — NOT VERIFIED.** Sum over `cleared` rather than `debts`, so the two fields describe one
population. ⚠️ Unmeasured against the finale's own copy: at a true finale `cleared` is every debt, so the
headline number should be unchanged — but that is the assertion to run, not to assume.
## B1-3 — blocker — the What-If projection is NOT gagged, so the Progress chart prints an ungated debt-free date on the same card whose own legend it just suppressed

**Origin:** `apps/rn/src/store/analysisSelectors.ts` — **`fix-churn`** (swept, then rewritten).

**User-facing consequence.** On a portfolio with one unreadable balance, the Progress trajectory card's
*"Your plan"* legend correctly prints nothing — and the *"With extra"* legend one row below it prints
**"Sep 2026"**, a debt-free date computed off a portfolio missing $12,000. Four months early, on the same
card, three lines apart, on a screen that has already told the user it could not read a balance.

**File and line.**
- `apps/rn/src/store/analysisSelectors.ts:46` — `const liveDebts = store.debts.filter((d) => d.balance > 0);` inside `derivePlanBasis`, the basis for `selectWhatIf`, `selectWhatIfBaseline` and `selectDebtAmortization`.
- `apps/rn/src/app/(tabs)/progress.tsx:125-126` — `whatIfBaseline` / `whatIf` are computed off `engineStore` and never passed through `gagBalanceDerived` or `mayClaim`; line 395 hands `whatIf={whatIf}` to the chart raw, twelve lines after line 392 gates `debtFreeDate={mayStateBalances ? view.debtFreeDate : null}`.
- `apps/rn/src/components/payoff/TrajectoryChart.tsx:573-577` — renders `whatIf.simulatedDate` + `deltaSuffix(whatIf.interestSaved, whatIf.monthsSaved, 'sooner')`.

**The measurement.** One store, one variable — Chase's balance lost on import and repaired to `0`, beside a
$4,000 Amex; the user has typed `+$200/mo`:

```
── TRUE  (Chase $12,000 readable)
  GAGGED "Your plan" legend date : January 2027
  UNGATED "With extra" date      : January 2027

── LOST  (Chase repaired to $0, repair recorded)
  GAGGED "Your plan" legend date : null          <- correctly suppressed
  GAGGED interestSaved           : {"kind":"none"}
  UNGATED "With extra" date      : September 2026 <- FOUR MONTHS EARLY, printed
  UNGATED whereText              : "Goes straight to your Amex"
```

And the underlying figures, with no extra typed at all:

```
                          TRUE            LOST
payoffView.debtFreeDate   January 2027    September 2026
planSummary.debtFreeDate  January 2027    September 2026
whatIf.baselineDate       January 2027    September 2026
interestSaved             $12,282.84      $3,202.31
mayClaim(debt-balances)   true            false
```

**Mechanism (hypothesis).** `C5-1` gagged the whole `PayoffView` at the source precisely because gating
props one at a time left a different debt-free date on the same screen. `gagBalanceDerived`'s docblock
argues *"a new `PayoffView` field does not compile until someone decides whether it is balance-derived"* —
which is true and is scoped to `PayoffView`. `WhatIfResult` is a **different object from a different
selector**, reaching the same chart through a sibling prop, so it was never in the gag's type surface. The
class is *"which figures on this screen are derived from a balance the app could not read"*, and the answer
is two objects, not one.

⚠️ `check-trust-claims.ts:443` ledgers `analysisSelectors.ts` at 1 liveness site with
`why: 'the analysis debt basis; never mentions the trust module'` — the row is accurate and its
consequence had not been measured. This measures it.

⚠️ **Sibling on the same basis, not separately measured:** `selectDebtAmortization`
(`analysisSelectors.ts:174-176`) resolves `debtId` against the same `liveDebts`, so an unread debt returns
`null` and its amortization sheet has nothing to show — a silent absence rather than a false figure.

**Remedy — NOT VERIFIED.** The shape that matches `C5-1` is a `gagWhatIf(result)` beside
`gagBalanceDerived`, writing every `WhatIfResult` key out so a new field must be classified, applied at
`progress.tsx:126` under the same `mayClaim(store, 'debt-balances')` condition. ⚠️ Unmeasured: whether the
chart renders acceptably with `simulatedTrajectory: []` and `canEstimate: false`, and whether
`WhatIfControls`' *"Can't estimate a payoff date with the current plan."* is the right sentence for
*"a balance could not be read"* — it says the wrong thing about why.

## B1-4 — major — `liveDebts`' docblock claims `lint:trust-claims` REDS on a re-derivation; the gate deliberately does not, and 22 re-derivations stand

**Origin:** `apps/rn/src/store/trustSelectors.ts` — `stale-read`; `scripts/check-trust-claims.ts` — `instrument`.

**User-facing consequence.** None directly. The cost is to the next author: the owner module tells them a
gate is enforcing single-ownership of the liveness expression, so re-spelling `balance > 0` is safe to
assume caught. It is not, and B1-1 and B1-3 are both re-derivations that shipped.

**File and line.** `apps/rn/src/store/trustSelectors.ts:97-99`:

> *"The debts with money still on them. ⛔ **THE ONLY PLACE THIS EXPRESSION IS WRITTEN.** Every other site
> asks the owner, and `lint:trust-claims` reds on a re-derivation…"*

Against `scripts/check-trust-claims.ts:395-400`, which records the opposite decision by measurement:

> *"the obvious gate — ban the expression — was written, measured and thrown away… **An unsatisfiable rule
> is `B1` all over again**"*

and `:441-477`, where `LIVENESS_OPEN` is a **ledger of 15 files / 22 sites** with `MAX_LIVENESS_SITES = 22`,
whose own contract states *"A row here is NOT a verdict of 'defect'"*.

**The measurement.** The gate's green line, quoted from its own source at `:588`:
`⚠️ ${livenessTotal} liveness re-derivation(s) … cap ${MAX_LIVENESS_SITES}` — 22, cap 22. Three of the
ledgered files are in this lane's manifest and each writes the expression the docblock says is written in
exactly one place: `planSelectors.ts:113`, `payoffSelectors.ts:98`, `analysisSelectors.ts:46`. The gate reds
only when a file's count **changes**, never when a re-derivation exists.

**Mechanism (hypothesis).** The docblock was written at `S1.10.6.9`, when the intended remedy was a ban; the
ban was measured (`git grep` → 40+, most of them correct `packages/core` amortization loops) and replaced
with a ledger at the same sub-step. The sentence describing the abandoned design stayed. *A comment is a
carried premise and decays like a carried number* — this one decayed inside the owner module the whole
cluster points new authors at.

**Remedy — NOT VERIFIED.** Restate the sentence as what the gate does: *"`lint:trust-claims` LEDGERS every
re-derivation in `apps/rn/src` — it does not ban them, and a new one reds only by not being on the ledger."*
⚠️ Wording only; no code change, and no test would move.
## B1-5 — blocker — the expense-reserve offer states *"the full $X your expenses average out to"* off a bill amount the app could not read, on a store whose own guard says it may not

**Origin:** `apps/rn/src/store/expenseReserveSelectors.ts` — `stale-read`.

**User-facing consequence.** A user whose imported file lost one bill's amount taps *"Spoken for"* on Today
and is told **"That's the full $415.38 your expenses average out to."** and offered a *"Set by $415.38"*
button — against a true $535.38. They set aside **$120 per paycheck too little** for bills that will still
arrive, and the sentence explicitly asserts the figure is the *full* one. On the Money tab, one tab away,
the same number carries an unread caption.

**File and line.**
- `apps/rn/src/store/expenseReserveSelectors.ts:40-42` — `store.requiredExpenses.filter(...).reduce((sum, e) => sum + monthlyEquivalent(e.amount, ...), 0)` — the raw `amount`, which a repair sets to `0`.
- `apps/rn/src/store/expenseReserveSelectors.ts:118-119` — `selectExpenseReserveOffer` takes `perPaycheckTotal` as `recommended`.
- `apps/rn/src/app/(tabs)/index.tsx:217` and `:791` — `selectExpenseReserveOffer(store)` computed and passed to `SpokenForSheet` with no trust argument.
- `apps/rn/src/components/plan/SpokenForSheet.tsx:86-100` — prints `offer.recommended` and `offer.offer`. **The file contains no `mayClaim` / `rowFieldUnread` / `anyRowFieldUnread` call at any line.**
- The guarded twin: `apps/rn/src/app/(tabs)/money.tsx:735-736` computes `anyRowFieldUnread(billsStore, 'row-figures', 'requiredExpense', 'amount')` **beside** its own `selectRecurringSmoothed(billsStore)` call.

**The measurement.** One store through `runMigrations` (the door a user's file comes in), one variable —
Electric's amount readable vs. unparseable, biweekly pay:

```
── TRUE  (Electric $260 read)
  mayClaim(required-plan): true      anyRowFieldUnread: false
  monthlyTotal 1160   perPaycheckTotal 535.38
  offer.recommended 535.38  offer 535.38  coversRecommendation true
  prints: "That’s the full $535.38 your expenses average out to."

── LOST  (Electric repaired to $0, repair recorded)
  mayClaim(required-plan): false     anyRowFieldUnread: true
  monthlyTotal 900    perPaycheckTotal 415.38
  offer.recommended 415.38  offer 415.38  coversRecommendation true
  prints: "That’s the full $415.38 your expenses average out to."
```

⚠️ `coversRecommendation` stays **true** in the damaged world, so the copy takes the *confident* branch —
the branch whose whole job is to say the offer is complete.

**Mechanism (hypothesis).** `'required-plan'` routes `requiredExpense: ['amount']` precisely because a
repaired `$0` obligation leaves the plan silently, and `mayClaim` returns `false` on this store. The Today
consumers that ask it are `PaydayGuardianCard` (`index.tsx:364`) and `RequiredActionsCard`
(`index.tsx:540`); `selectExpenseReserveOffer` was added at 3.8 as a third consumer of the same arrays and
was not enrolled. `expenseReserveSelectors.ts`'s own header says it exists because *"a second derivation is
how 'two places, one rule' starts"* — the derivation was unified and the **guard** was not: Money's copy of
the figure asks, Today's does not.

⚠️ **Why `check-trust-claims.ts` cannot see it.** The ledger's population is *prints money AND reads an
entity list* — `SpokenForSheet.tsx` is handed an `ExpenseReserveOffer` object and never touches
`store.requiredExpenses`, so `READS_ENTITIES` does not match and the file is not considered. That is the
architectural narrowing the gate documents as deliberate (*"a component handed `PaidOffDebt[]` … is
downstream of a guard that has already sanitised its props"*) — the premise being that the producer
sanitises. Here the producer does not, so the narrowing exempts the render and nothing checks the producer.

**Remedy — NOT VERIFIED.** Two shapes, and they are not equivalent:
(a) `selectExpenseReserveOffer` returns `null` when
`anyRowFieldUnread(store, 'row-figures', 'requiredExpense', 'amount')` — suppresses the offer entirely,
which `C-4`'s rule argues against for a figure that is the user's own money;
(b) the offer carries an `amountsUnread: boolean` field, hoisted **outside** any nested object (the
`C4-5` shape), and the sheet captions instead of asserting *"the full"*.
⚠️ (b) is the shape that matches the standing decisions, and neither is built. Whichever is chosen, the
copy at `SpokenForSheet.tsx:92` is the string that must change — *"the full"* is the false word, not the
number alone.

---

# Measured and NOT a defect — recorded so triage does not re-chase

- **Windfall split conservation.** `selectWindfallSplit` drops any bucket rounding below `$1`
  (`guardianSelectors.ts:634`), which would break the *"money conserved, always"* claim for a negative
  bucket delta. **Searched 5,184 splits** across tier × paycheck × cold-start × debt × living × bill × goal
  × windfall amount: `0 did not conserve`. The rounding is safe on every shape reachable this way.
- **`selectProvisionalPayoffs` (`balanceSelectors.ts:115`) cannot fire on a repaired balance.**
  `isDebtProjectedPaidOff` (`packages/core/debt/projectCurrentBalance.ts:114`) opens with `debt.balance > 0`,
  so a debt repaired to `0` is never offered the *"you crushed it — confirm to celebrate"* invitation. The
  path from an unread balance → a confirmed payoff → the permanent trophy shelf is closed here.
- **The widget payload is gated.** `widget/snapshot.ts:161` computes `mayStateBalances` and every
  balance-derived field (`debtFreeDate`, `pctPaid`, `pctLabel`, `remaining`) takes it;
  `buildGuardianSpoken` (`:68`) returns `''` on `!mayClaim(store, 'required-plan')`. Re-checked because
  `check-trust-claims.ts:461` records this site's coverage as *"unmeasured"*.
- **The Recovery Plan is gated, transitively.** `selectRecoveryPlan` skips `d.balance <= 0`
  (`recoverySelectors.ts:47`, a ledgered re-derivation), but its only production consumer renders inside
  `PaydayGuardianCard`, whose `unreadPlanInputs` early-return (`PaydayGuardianCard.tsx:206`) replaces the
  whole card — recovery section included — before `recovery` is read.
- **`money.tsx`'s `PayoffView` is not a gap.** `money.tsx:217` takes an ungagged `selectPayoffView(store)`
  and reads only `view.order` and `view.focus` — the two fields `gagBalanceDerived` deliberately passes
  through as readable without reading a balance.
