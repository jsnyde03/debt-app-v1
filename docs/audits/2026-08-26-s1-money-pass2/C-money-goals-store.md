# AUDITOR C — job ③: `money.tsx`, goals, the store, and the unswept

**Pin:** `4b58d75` · branch `v1.7-dev`. Read-only. No source file touched.

**Scope measured, not assumed.** `npm run lint:s1-coverage -- --report` → **188 surface files · 116
unswept** (`partial` counted as unswept). Counted whole, the 116 break down as
**61 `apps/rn/src/store/*` · 51 `apps/rn/tests/e2e/*` · 3 `apps/rn/src/app/*` · 1 `apps/rn/src/data/*`**
— so **62 of the 116 are my ground**, and I pointed there first, then at the *changed* parts of
`money.tsx` (`r10 · s1p1`), `obligationForm.ts`, `guardianSelectors.ts` and `store.ts` (`partial`).

## 1. Result

| severity | n | |
|---|---|---|
| **blocker** | **3** | C2 · C3 · C4 |
| **major** | **1** | C1 |
| **minor** | 3 | m1 · m2 · m3 |

**One sentence for 🎯:** ⛔ **B1's rule — *never state a number about money the app could not read* — is
enforced on the field it was found on and nowhere else, and the three places it is missing are the
goals row (*"$1,000 left"* over an unreadable balance), the full-screen debt-free finale, and a debt
whose unreadable MINIMUM makes Today say *"You're caught up for this paycheck"* in success green over
an unpaid card; **S1 does not converge on this pass.**

⚡ **All four findings are one shape, and it is the shape pass 1 already named twice.** B1 gave the
question one owner and wired it to four claim sites. **There are more than four claim sites, and more
than one repairable field.** C1 is the same seam pointed the other way: the guard, once raised, can
never come down. ⚠️ Every finding below was measured by executing the shipped code, not read off it —
the values printed are real output.

⚠️ **Where I pointed, and why.** The brief's measurement held again: **4 of 4 findings came off
`never`-swept files** (`trustSelectors.ts`, `payoffCelebration.ts`, `planSelectors.ts`) or off the
**changed** lines of a twice-swept one (`money.tsx:1008/1044`). Nothing came out of the parts of
`money.tsx` two rounds had already read.

## 2. Sweep — blocker + major

### C1 · **major** · the trust guard has NO reset path, so a user who does what the repairs card asks is permanently denied the debt-free state

**User-facing consequence.** A person who imports a file with one unreadable balance, retypes it as the
card tells them to, and then genuinely pays off every debt, is shown the *broken-plan* Money screen
(`$0 · remaining across 0 debts`, a Snowball/Avalanche toggle, "Your debts are listed in payoff order"
above an empty list), loses the Progress trophy shelf, and never gets the graduation banner on Today —
**for the life of the install, with no way to clear it.**

**Mechanism.** `apps/rn/src/store/trustSelectors.ts:41-45` and `:56-58` read
`store.pendingDataRepairs` and test only `entity`/`field`/`kind`. Nothing ever REMOVES an entry:
`grep -rn "pendingDataRepairs" apps/rn/src packages` returns **exactly two mutation sites** —
`apps/rn/src/data/migrations.ts:418` (`mergeRepairs`, a union that only ever grows) and
`apps/rn/src/store/store.ts:795`, which **marks `acknowledged: true` and never empties** (its own
comment at `:788-793` says "MARKS, NEVER EMPTIES" — correct for the card, but the guards do not read
`acknowledged`, so the mark changes nothing for them). Correcting the debt writes `debts[].balance`
and touches no repair record. `migrations.ts:407-418` then merges the pending list forward on every
subsequent load, so the record survives persistence round-trips.

**Measured** (probe run under `apps/rn` with `npx tsx`, printing real values):

```
A. after import   : balances= [ 0 ] repairs= [{"entity":"debt","id":"d0","name":"Card 0","field":"balance","kind":"lost"}]
                    hasUnreadDebtBalances = true   planState = debt-free-unverified      ← correct
B. after "Got it" : hasUnreadDebtBalances = true   planState = debt-free-unverified      ← correct
C. balance retyped (1200) : hasUnreadDebtBalances = true   planState = normal
D. debt paid to 0 : hasUnreadDebtBalances = true   planState = debt-free-unverified      ← WRONG
E. after reload   : repairs= [{...,"field":"balance","kind":"lost","acknowledged":true}]
                    hasUnreadDebtBalances = true   planState = debt-free-unverified      ← WRONG, forever
```

Row **D** is a portfolio the app read perfectly and the user paid off. Four consumers act on it:
`planSelectors.ts:347` (Today's `isDebtFree` at `index.tsx:303` → `GraduationBanner` +
`FreedomNextChapterCard` never render), `money.tsx:371-372` (`allCleared` false → the hero and
strategy block the file's own comment calls *"the single worst screen in the product"* when wrong),
`progress.tsx:173` (`PaidOffArchive` trophy shelf never renders), and `money.tsx:972` for goals.

**Would anything catch it?** **No.** `apps/rn/src/store/trustSelectors.test.ts` is the guard and it
picks the member of the class that works (reading rule 2): all four debt fixtures assert on a store
**straight out of `runMigrations`**, never on a store whose balance was subsequently corrected. Its
"control" case (`:66-70`, `migrated([0,0])`) proves a store with *no repair record* still celebrates —
which is a different claim. Nothing in the repo asserts the guard ever LIFTS.

**Confidence: high** — measured end-to-end, and the absence of a removal path is a whole-repo grep,
not a reading.

---

### C2 · **blocker** · the goals guard was narrowed to `targetAmount` on both consumers, so a goal whose SAVED amount could not be read prints a false remainder and a false "% funded"

**User-facing consequence.** A goal whose `currentAmount` could not be read renders
*"House Fund · Savings · **$1,000.00 left**"* with an empty progress bar and **no caption**, one inch
under a hero reading *"$1,000 saved of $3,000 target · **33% funded**"* with a filled bar — every one
of those numbers wrong about money the app has already recorded that it could not read, and permanent
(see C1).

**Mechanism.** `apps/rn/src/store/trustSelectors.ts:50-58` is deliberately **not** field-specific, and
its own docblock states why: *"**both** sides of that comparison are money fields that repair to `0`."*
Both consumers in `money.tsx` then re-narrow it to one side:

- `apps/rn/src/app/(tabs)/money.tsx:1008` — `const targetUnread = unreadGoals && goals.some((g) => g.targetAmount === 0);`
- `apps/rn/src/app/(tabs)/money.tsx:1044` — `const targetUnreadable = unreadGoals && g.targetAmount === 0;`

`currentAmount` **is** a repaired required field — `apps/rn/src/data/migrations.ts:263-270` passes
`['targetAmount', 'currentAmount']` to `repairMoneyFields` — so an unreadable saved balance repairs to
`0` and satisfies neither predicate. The row then falls through to
`formatCurrency(Math.max(0, g.targetAmount - g.currentAmount))` at `money.tsx:1075`, which prints the
**entire target** as a remainder, and the hero at `:1013-1018` prints `Math.round(overall * 100)`
computed from a `totalSaved` that is missing the goal's real money.

⚡ **This is AS-2 mirrored.** AS-2's own comment says *"The guard was on the badge and absent from the
sentence beside it."* Here the guard is on one FIELD and absent from its twin — and
`trustSelectors.ts` had already written down that there are two.

**Measured** (probe under `apps/rn`, real `runMigrations` output, real render expressions):

```
goals       = [{"n":"House Fund","t":1000,"c":0},{"n":"Car","t":2000,"c":1000}]
repairs     = [{"entity":"goal","id":"g1","name":"House Fund","field":"currentAmount","kind":"lost"}]
unreadGoals = true    targetUnread (money.tsx:1008) = false
HERO        = "$1000 saved of $3000 target" · "33% funded" · bar shown = true
ROW House Fund  => "$1000.00 left"  badge=-  progress=0    caption=(none)
ROW Car         => "$1000.00 left"  badge=-  progress=0.5  caption=(none)
CARD        = ["An amount could not be read", "…until you set it again.", ["House Fund — currentAmount"]]
```

The Today card **does** say the amount could not be read; Money then states a specific dollar figure
that contradicts it. Note also that the two rows print the identical string `$1000.00 left` for
completely different states — reading rule 10's shape, on this very screen.

**Would anything catch it?** **No, and the guard that exists picks the member of the class that
works.** `apps/rn/tests/e2e/goal-row-saved.spec.ts:75-95` is the AS-2 guard and its fixture is
`pendingDataRepairs: [{ entity:'goal', id:'g-unread', name:'House Fund', field:'targetAmount', kind:'lost' }]`
with `targetAmount: 0, currentAmount: 500` — the one field of the two the code checks.
`trustSelectors.test.ts:104-110` exercises only the selector (`'wat'` as a **target**), never a render.
`grep -rn "field: 'currentAmount'" apps/rn/src apps/rn/tests` returns **exactly one** hit —
`apps/rn/src/data/migrations.test.ts:114`, which asserts the repair RECORD is written and never
reaches a render. Nothing tests what Money prints for it.

**Confidence: high** — measured end to end from `runMigrations`, and the narrowing is two literal
`g.targetAmount === 0` expressions.


---

### C3 · **blocker** · B1's owner was wired to three claim sites and NOT to the fourth — the full-screen debt-free FINALE still fires over debts the app could not read

**User-facing consequence.** A user who imports a file with one unreadable balance and then clears the
debts the app *can* read gets the once-ever full-screen finale — **"$0 balance · You're debt-free ·
$12,400 paid off · 2 debts · 12 months"** — over a $12,000 card they still owe; dismissing it spends
the moment, and Today's own calm banner is refusing the identical claim at that same instant.

**Mechanism.** `detectPayoff` (`apps/rn/src/store/payoffCelebration.ts:41-45`) declares the finale on
`after.filter((d) => d.balance > 0).length === 0` — the same `balance > 0` predicate B1 established is
**not** a safe proxy for "cleared", because a repair writes a real `0`. `withPayoffCelebration`
(`store.ts:63-69`) stamps it from four ordinary free-tier paths (`updateDebt` `:473`,
`verifyDebtBalance` `:482`, `verifyDebtBalances` `:496`, `logManualPayment` `:658`). The render at
`apps/rn/src/app/(tabs)/index.tsx:563-565` gates on `celebration?.kind === 'finale'` **and nothing
else** — `grep -rn "pendingPayoff" apps/rn/src` returns 4 non-test lines and none of them mentions
`hasUnreadDebtBalances`. B1 wired the owner into `planSelectors.ts:347`, `money.tsx:371`,
`money.tsx:972` and `progress.tsx:173`; the finale is the claim site it did not reach.

**Measured** (probe under `apps/rn`, real `runMigrations` + the real `detectPayoff`):

```
balances     = Chase (unreadable)=0, Visa=400          (originalBalance 12000 / 400)
unreadDebts  = true
planState    = normal                                  ← B1 correct, banner refused
--- user logs the final payment on Visa ---
detectPayoff = {"kind":"finale"}                       ← gated ONLY on kind at index.tsx:564
finale stats = {"totalPaid":12400,"debtsCleared":2,"monthsToFreedom":12}
planState now= debt-free-unverified                    ← Today refuses the banner …
```

⛔ The last two lines are the same store at the same instant: **the app refuses the sentence in the
calm banner and asserts it full-screen, three lines apart** — the exact defect B1's docblock describes
(*"One tab apart, on one store, the app both refused and asserted the same sentence"*), unfixed on the
loudest surface. `selectCelebrationStats` (`celebrationSelectors.ts:60-63`) also counts the unread
debt in `debtsCleared` and folds its `originalBalance` into `totalPaid`.

**Would anything catch it?** **No.** `trustSelectors.test.ts` covers `selectPlanState` only; there is
no assertion anywhere that ties `pendingPayoff` to `hasUnreadDebtBalances`.
`grep -rn "pendingPayoff" apps/rn/tests` returns **4** hits, counted whole: one prose comment in
`celebration.spec.ts:121` and three in `shots/p6.8-matrix.shot.ts` that SEED `pendingPayoff` for a
screenshot — none is an assertion, and none involves a repair record. `store.ts:63`'s own docblock enumerates what the
finale must survive and does not mention repairs.

**Confidence: high** — measured with the shipped functions, no reconstruction.


---

### C4 · **blocker** · a debt whose MINIMUM PAYMENT could not be read vanishes from the plan, and Today prints B5's exact sentence in success green over it

**User-facing consequence.** A debt whose `minimumPayment` repaired to `0` shows *"$0.00/mo"* on Money
with no caption, produces **no** required-action row and **no** unfunded item, so Today tells the user
**"You're caught up for this paycheck."** in success green while a $5,000 card's minimum is due in four
days and the plan has reserved nothing for it — a missed payment and a credit hit.

**Mechanism.** `migrations.ts:212-247` repairs an unreadable `minimumPayment` to `0` (it is in the
`required` list for debts). `allocatePaycheck` only emits an allocation when `coveredAmount > 0 ||
potShare > 0` and only emits an `unfundedRequiredItem` for a remainder, so an obligation of **$0** is
in neither array. `countOutstandingRequired` (`planSelectors.ts:271-276`) — B5's owner, and correct —
is therefore handed two empty sets and honestly returns `0`, and
`RequiredActionsCard.tsx:136-138` renders the green sentence. The trust guard does not fire:
`hasUnreadDebtBalances` is field-specific to `balance` (`trustSelectors.ts:41-45`), correctly, and
**no guard covers `minimumPayment`** — the field that decides what the plan pays.

**Measured** (probe under `apps/rn`; the only difference between the two runs is the raw
`minimumPayment` value in the imported blob):

```
--- minimumPayment READABLE (150)
   money row   : Chase  $5000 · 22% APR   amount="$150.00/mo"
   required    : [["Pay minimum on Chase",150,false],["Pay Rent",900,true]]
   outstanding : 1                    → Today: count pill = 1
   repairs     : none
--- minimumPayment UNREADABLE ("n/a")
   money row   : Chase  $5000 · 22% APR   amount="$0.00/mo"     ← false, uncaptioned
   required    : [["Pay Rent",900,true]]                        ← the minimum is GONE
   outstanding : 0                    → Today: >>> "You’re caught up for this paycheck." (success green)
   repairs     : Chase/minimumPayment
   hasUnreadDebtBalances (B1 owner) = false
```

⛔ This is **B5's sentence, through a different door**. B5's remedy is intact — the count is right about
the arrays it is given; the arrays are wrong. `planSelectors.ts:264`'s own comment already states the
rule this violates: *"Any caller that hands this function an emptied array is asserting the user owes
nothing."* Here the **engine** empties it, for a reason nothing checks.

**Would anything catch it?** **No.** `grep -rn "minimumPayment" apps/rn/tests` returns **78** hits,
counted whole: every one is either a numeric seed (`minimumPayment: 150`), a CSV header, or prose —
**not one seeds an unreadable value or a repair record.** `migrations.test.ts`'s tables assert the
repair record is written, never what the plan then does with the `0`. `no-bills-branch.spec.ts` and the B5 guards exercise the shortfall and no-bills branches,
not a repaired minimum.

**Confidence: high** — measured, single-variable A/B through the real import path.


**⚡ C4 is one member of a class, and the class was enumerated by MEASURING every repaired field, not
by listing spellings.** `repairMoneyFields` is called four times (`migrations.ts:212, 248, 249,
263`). Same probe shape, same import path:

```
expense amount READABLE (120)  | Electric=120 | rows=[Pay Electric 120, Pay minimum on Chase 150, Pay Rent 900] | outstanding=2
expense amount UNREADABLE      | Electric=0   | rows=[Pay minimum on Chase 150, Pay Rent 900]                   | outstanding=1
                                              ^ the bill is gone from the plan; Money still lists it at "$0.00"
apr READABLE (24)              | money row meta = "$5,000.00 · 24% APR"
apr UNREADABLE                 | money row meta = "$5,000.00 ·  0% APR"
```

⛔ The APR line is the app doing, on the import path, exactly what `FORM_ERRORS.aprInvalid`
(`obligationForm.ts:104-106`) exists to refuse on the form path — its own comment: *"`Number(apr) || 0`
treated 'left blank' and 'unreadable' as the same answer and planned an interest-free payoff on a card
that charges."* The form refuses it; `readMoney` writes it. **One rule, two answers.**


---

## Minors

- **m1 — the repairs card prints raw schema keys to the user.** Measured output of `repairBlocks` on a
  store with six repairs: `"Chase — minimumPayment"`, `"Chase — apr"`, `"Rent — amount"`,
  `"House Fund — targetAmount"`, `"House Fund — currentAmount"`, and — for the one field that was given
  a sentence — `"House Fund — the per-paycheck amount could not be read, so it is no longer funded ahead
  of your debt"`. `dataRepairsCopy.ts:33` is `${repair.name} — ${repair.field}` and `migrations.ts`
  pushes the schema key. The mechanism for a human string already exists and was applied to one field of
  six. Minor because the actionable half (the item's name) is correct and no number is wrong.
- **m2 — a stale mechanism in a fix's own docblock.** `money.tsx:1064-1066` claims *"a negative
  `applyTightTopUp` (an undo) can push `currentAmount` past the target on its own."* Measured: that path
  no longer exists — B3 replaced it in the same commit range, and `undoTightTopUp` returns exactly the
  entry's own `amount` (probe in §3: S1 and S2 land back on 70/50 exactly, and a second undo is a
  no-op). The M2 finding still stands via `GoalSheet.submit()` validating target and current
  independently; the mechanism cited beside it is dead. Reading rule 1, inside the fix range.
- **m3 — `unreadGoals` is store-wide, so a repair on goal A can caption goal B.** `money.tsx:1044`
  conjoins a store-wide predicate with a per-goal test; a second goal legitimately holding
  `targetAmount: 0` (unreachable from `GoalSheet`, reachable by import) would wear *"Target could not be
  read"* because a different goal was repaired. No wrong number.

## 3. Measured, and NOT a defect

- **M1's partition fix holds, and the receipt reconciles to the cent.** Five recurring bills — one
  `housing`, one `subscriptions`, one with an **absent** category, one `'fitness'` (unrecognised), one
  `'MEDICAL'` (wrong case) — through the real `resolveBillCategory` and the real
  `selectRecurringSmoothed`: all three unreadable ones map to `other`; **5 of 5 rows render**; receipt
  sum `762.31` equals hero `perPaycheckTotal` `762.31`. The `ORDER.map()` shape survives, but it is now
  a partition because `'other'` is a real member of `BILL_CATEGORY_ORDER` — reading rule 4 satisfied by
  construction, not by a longer list.
- **B3's top-up conservation holds under every sequence I could reach.** Measured on a real
  `createDebtStore()`: guardian $70 from S1, then affordability $50 from S2, gives `amount: 120` and two
  entries; `undoTightTopUp('guardian')` returns 70 **to S1** and leaves the affordability entry intact;
  a second identical undo is a **no-op** (the "$50 invented from nothing" variant is closed by
  construction); `undoTightTopUp('affordability')` restores S2. The same-source-different-goal case (a
  capped draw re-offered on a second goal) produces **two `guardian` entries** and undoes them LIFO,
  20 to S2 then 70 to S1, back to the exact starting balances. `buildCycleTopUp`'s derived `amount`
  tracked the sum at every step. **Not a defect** — I looked for the two-entries-one-source case
  specifically and it conserves.
- **B2's `intentRollback` invalidation has no bypass in the app.** The class rule at `store.ts:339`
  fires on any patch that moves `store` without naming `intentRollback`. The one seam it cannot reach is
  `api.setState`, which `store.ts:301` documents as unwrapped — `grep -rn "setState" apps/rn/src`
  returns 22 non-test lines and **none writes `store` on the real singleton**
  (`_layout.tsx:74/253/266` write only lifecycle/error fields; every other hit is `sandboxStore`,
  `coachMarks`, `coachMarkProbe`, or prose). Hydrate at `store.ts:394` goes through the wrapper and
  correctly clears the snapshot.
- **`view.order` and `paidOff` are disjoint and exhaustive.** `money.tsx:378` sums
  `selectDebtBalanceView(...).currentBalance` over `view.order`, while `paidOff` is `balance <= 0`.
  `selectPayoffView` (`payoffSelectors.ts:53`) builds `order` from `debts.filter(d => d.balance > 0)`,
  so no debt is counted twice or dropped, on either tier. Checked specifically because the premium
  projection can drive `currentBalance` to 0 while the anchor is positive — that debt stays in `order`
  and contributes 0, which is correct.
- **`selectPlanState`'s `'debt-free-unverified'` really is unrepresentable-by-accident.** Only
  `index.tsx:303` consumes `'debt-free'`, so a screen that forgets to ask gets a state it does not
  handle. The design is sound; C3 is a claim site that never asked this selector at all.

## 4. Could not determine

- **Whether C1's permanent suppression has any intended escape other than "Delete all data."**
  `reset()` (`store.ts:425-428`) installs `createDefaultStore()`, whose `pendingDataRepairs` is `[]`
  (`defaults.ts:44`) — so wiping the portfolio is the only path I found that clears the guard. I found
  no decision record either way. **What would settle it:** the intended lifecycle of a
  `pendingDataRepairs` entry after the user has corrected the field — either a repair is retired when
  its `entity|id|field` is next written with a readable value, or it is deliberately permanent, in which
  case C1's consequence is a chosen cost and should be written down as one.
- **Whether the two-`guardian`-entries state (measured clean, §3) is reachable in the product.** It
  requires `selectTightTopUp` to re-offer after a capped draw and pick a *different* goal.
  `pickTopUpGoal`'s selection rule sits above the range of `guardianSelectors.ts` I read in full. It
  conserves either way, so this is curiosity, not risk. **What would settle it:** reading
  `pickTopUpGoal` and confirming whether a drained goal drops out of the candidate set.

## 5. Swept and found clean — BY PATH

Every path I opened. A line range means that is all I read.

**Read end to end, nothing found:**

- `apps/rn/src/store/selectors.ts`
- `apps/rn/src/store/balanceSelectors.ts`
- `apps/rn/src/store/payoffSelectors.ts`
- `apps/rn/src/store/expenseReserveSelectors.ts`
- `apps/rn/src/store/analysisSelectors.ts`
- `apps/rn/src/store/recoverySelectors.ts`
- `apps/rn/src/store/historySelectors.ts`
- `apps/rn/src/store/projectedIncome.ts`
- `apps/rn/src/store/forecastCycles.ts`
- `apps/rn/src/store/incomeLearning.ts`
- `apps/rn/src/store/paycheckForm.ts`
- `apps/rn/src/store/payday.ts`
- `apps/rn/src/store/substrateProducers.ts`
- `apps/rn/src/store/persistence.ts`
- `apps/rn/src/store/looksLikeDebt.ts`
- `apps/rn/src/store/debtIds.ts`
- `apps/rn/src/store/boundedRun.ts`
- `apps/rn/src/store/drift.ts`
- `apps/rn/src/store/realWriteGuard.ts`
- `apps/rn/src/store/appStore.ts`
- `apps/rn/src/store/useAppStore.ts`
- `apps/rn/src/store/topUpSelectors.ts`
- `apps/rn/src/store/obligationForm.ts`
- `apps/rn/src/store/celebrationSelectors.ts`
- `apps/rn/src/data/defaults.ts`
- `apps/rn/src/components/plan/dataRepairsCopy.ts`
- `apps/rn/src/components/plan/DataRepairsCard.tsx`

**Read end to end and carrying a finding:**

- `apps/rn/src/app/(tabs)/money.tsx` — **C2**, m2, m3
- `apps/rn/src/store/trustSelectors.ts` — **C1**
- `apps/rn/src/store/trustSelectors.test.ts` — the guard that picked the working member (C1, C2)
- `apps/rn/src/store/payoffCelebration.ts` — **C3**
- `apps/rn/src/store/planSelectors.ts` — **C4**'s count is correct; its inputs are not

**Read in part:**

- `apps/rn/src/store/store.ts` — lines `1-140`, `300-360`, `465-660`, `775-916`: the `set` wrapper,
  every debt/expense/goal/living action, `markExpensePaid`, `deferExpense`, `toggleRecommendedDone`,
  `applyTightTopUp`, `undoTightTopUp`, `setExpenseReserveContribution`, `importStore`,
  `acknowledgeDataRepairs`. **Not read:** `360-465` (hydrate/save/reset/paycheck) and `660-775`.
- `apps/rn/src/store/guardianSelectors.ts` — `180-360` only (`selectAppliedTopUp`, `appliedTopUp`,
  `selectTightTopUp`, `selectTrialConversion`, `selectBnplBetweenPaycheck`). The rest is auditor D's.
- `apps/rn/src/data/migrations.ts` — `105-180` (`repairMoneyFields`), `240-300` (its four call sites),
  `405-434` (`mergeRepairs`).
- `apps/rn/src/store/greeting.ts` — the head; the strings belong to the wording gate.
- `apps/rn/src/store/guardianSubjects.ts` — the head only.
- `apps/rn/src/components/entities/GoalSheet.tsx` — `95-155` (`submit`, `remove`). `parseAmountField`
  makes `targetAmount > 0` an invariant of the form path, which is what makes C2's `=== 0` test
  meaningful at all.
- `apps/rn/src/components/entities/ExpenseSheet.tsx` — the AS-1 diff hunk only; auditor A owns the
  verdict.
- `apps/rn/src/components/plan/RequiredActionsCard.tsx` — `85-145` (the `outstanding` branch).
- `apps/rn/src/app/(tabs)/progress.tsx` — `155-200` (the `hasUnreadDebtBalances` branch).
- `apps/rn/src/app/(tabs)/index.tsx` — `285-330` and `552-572` **only**, as claim sites for C1 and C3.
  The file is auditor D's and I did not sweep it.
- `apps/rn/tests/e2e/goal-row-saved.spec.ts` — read end to end, as C2's would-anything-catch-it, not as
  a guard audit (auditor B's job).

**Not opened — still unswept on my ground, for the next pass.** `apps/rn/src/store/guardianPrediction.ts`,
`guardianPredictionCore.ts`, `guardianSubjects.ts` (beyond the head), `onboardingFinish.ts`,
`paywallLead.ts`, `StoreContext.tsx`, `sandboxStore.ts`, `sandboxScenarios.ts`, `tutorial*.ts`,
`coachMarks.ts`, `demo*.ts`, and every `*.test.ts` in `apps/rn/src/store/` except
`trustSelectors.test.ts`.
