# S1 · money · PASS 7 — lane **C2** findings

Subject: the rest of the components — payoff, progress, entities, onboarding, more, UI primitives.
Manifest: `ROUTING-C2.txt` — 72 files · 8.2k lines.
Tree: `v1.7-dev` @ `e5ecc7b6`.

---

## C2-1 — `blocker` · the pass-6 `C2-1` fix reached the arm it was reported on and left the backstop making the same false claim

**Origin:** `fix-churn` · `apps/rn/src/components/payoff/compareStrategies.ts`

**User-facing consequence.** On the Strategy compare card (Payoff), the takeaway line reads
**"These two clear your debts in a different order."** for a user whose two strategies clear the same
debts **in the same order**. That is the one sentence on the card whose whole job is to name what
actually differs — naming a difference that is not there. It is the *identical* false sentence that
pass-6 `C2-1` was raised about; the fix gated line 135 and left line 147 ungated.

**File and line.**
- `apps/rn/src/components/payoff/compareStrategies.ts:147` — `if (parts.length === 0) return 'These two clear your debts in a different order.';`
- `apps/rn/src/components/payoff/compareStrategies.ts:100-103` — `orderDiffers()`, the gate the fix added, called **only** from line 135.
- Rendered at `apps/rn/src/components/payoff/StrategyCompare.tsx:60-62` (`testID="strategy-compare-takeaway"`).

**MEASUREMENT.** Runner driving the real module (`buildStrategyComparison` + `comparisonTakeaway`), one
store: three debts, `Visa` clears month 5 under both, `Card` clears month 30 (snowball) / 28 (avalanche),
a third debt never clears inside the 600-month horizon so **neither** curve reaches zero.

```
snowball order   : Visa|Card
avalanche order  : Visa|Card      <- IDENTICAL
differs          : true
debtFreeMonth s/a: null null
finishSooner     : null
firstWinSooner   : 0
TAKEAWAY         : "These two clear your debts in a different order."
```

The order is byte-identical and the sentence says it changed.

**Mechanism (HYPOTHESIS).** `parts` is left empty on exactly two conditions: (a) `sClears === aClears`
with `finishSooner === null`, i.e. *neither* plan reaches zero, and (b) `firstWinSooner` is `null` or `0`.
`differs` (line 76) compares `name@month`, so it is still true when the same sequence lands on different
months. The docblock at lines 144-145 asserts *"Whatever is true here, the ORDER differs — that is what
`differs` means when the dates cannot be compared"* — **that premise is false**, and it is a carried
comment, not a measurement: `differs` means the `name@month` key differs, which the month alone can
satisfy. The 600-month horizon is real (`packages/core/debt/buildPayoffTrajectory.ts:83`) and the
"neither side clears" branch is already acknowledged reachable by the suite's own case at
`compareStrategies.test.ts:145-162`.

**Why the existing tests are green over it.** `compareStrategies.test.ts:145-162` exercises the backstop
with clear sequences `card` vs `loan` — an order that genuinely *does* differ — so it asserts the sentence
where it happens to be true. `compareStrategies.test.ts:184-204`, the regression test written *for*
pass-6 `C2-1`, pins the same-order/different-month store but with **both** curves reaching zero, so the
`finishSooner` branch fills `parts` and the backstop is never reached. Neither test crosses the two
conditions. This is the "iterate the class, never the member" shape from the brief.

**Remedy — UNVERIFIED.** Gate line 147 the same way line 135 is gated: return the different-order sentence
only when `orderDiffers(cmp)`, and otherwise state what is actually true of this store (the same debts
clear in the same order, on different months, with neither plan reaching zero inside the projection). Any
replacement sentence needs asserting positively — suppressing the false one can produce a different false
one. Not applied; pass 7 does not fix.

## C2-2 — `minor` · the What-If sentence says "then hits Visa" when the extra clears Visa outright — the `m6` class, un-iterated

**Origin:** `stale-read` · `apps/rn/src/components/payoff/whereText.ts`

**User-facing consequence.** On the Payoff card's What-If simulator, the "where the money goes" line is
identical whether the extra **dents** the second debt or **clears** it. A user whose $350 extra pays off
both of their debts is told the second one is merely *"hit"*. This is the same class `m6` was raised
about — *"the strongest thing the simulator can say, described as if it merely made a dent"* — reached
at the second allocation row instead of the first.

**File and line.** `apps/rn/src/components/payoff/whereText.ts:23`
`if (first.isPaidOff && second) return \`Pays off your ${first.debtName}, then hits ${second.debtName}\`;`
— the branch reads `second`'s *existence* and never `second.isPaidOff`. Rendered at
`apps/rn/src/components/payoff/WhatIfControls.tsx:117`.

**MEASUREMENT.** One store, two live debts (`Store card` $200 @ 26.99%, `Medical` $150 @ 0%), driven
through the real `buildExtraPaymentAllocationPlan` and the real `whereText`. The What-If extra is
uncapped by design (`WhatIfControls.tsx:31-33`) and the slider's own floor max is **$500**
(`analysisSelectors.ts:139` — `Math.min(5000, Math.max(500, …))`), so every value below is on the slider.

```
extra=$300   Medical paid=true  · Store card remainingAfter=50  paid=false
             SENTENCE: "Pays off your Medical, then hits Store card"
extra=$350   Medical paid=true  · Store card remainingAfter=0   paid=TRUE
             SENTENCE: "Pays off your Medical, then hits Store card"   <- IDENTICAL
extra=$500   Medical paid=true  · Store card remainingAfter=0   paid=TRUE
             SENTENCE: "Pays off your Medical, then hits Store card"   <- IDENTICAL
```

The sentence cannot distinguish "clears one and dents the other" from "clears the user's entire debt".

**Mechanism (HYPOTHESIS).** `buildExtraPaymentAllocationPlan` (`packages/core/debt/extraPaymentPlan.ts:43-58`)
emits rows in payoff order and only the **last** row can be partial, so `second.isPaidOff` is a live,
readable fact at line 23 and is simply not consulted. `whereText.test.ts` asserts four branches
(lines 40-58) and **none** of them sets `isPaidOff: true` on the second item, so the case is not covered
by the test written specifically to make this rule falsifiable.

**Not raised higher because** the sentence is true, not false — "hits" is satisfied by a payment that
clears the debt. It is imprecise on a line every What-If user meets.

**Remedy — UNVERIFIED.** Read `second.isPaidOff` and say so ("Pays off your Medical *and* your Store
card"), and add the missing row to `whereText.test.ts`. The replacement must be asserted positively —
per the brief, suppressing one imprecise sentence has produced a different one here before. Not applied.

## C2-3 — `blocker` · the payoff schedule promises "as your other debts clear" to a user with no other debts and no extra

**Origin:** `fix-churn` · `apps/rn/src/components/entities/AmortizationView.tsx`

**User-facing consequence.** On the Payoff schedule screen (`app/schedule/[id].tsx`, and the iPad Money
detail pane), a user whose *only* debt cannot amortize at its minimum is told **"Your plan puts more
toward it as your other debts clear."** They have no other debts, and their plan sends **$0** extra. The
app promises money that does not exist, on the one screen a person in that position opens to find out
what happens next. This is `A2-1`'s own class — a portfolio-wide claim made from a single-debt
simulation — recurring in the sentence that was written to fix it.

**File and line.** `apps/rn/src/components/entities/AmortizationView.tsx:82-85`. The branch is gated on
`payoffPossible` alone (`:66`); `amort.isFocus` and `amort.monthlyExtra` are both on the object in scope
(`analysisSelectors.ts:189-196`) and neither is consulted.

**MEASUREMENT.** One store, driven through the real `selectDebtAmortization`. Income $1,400 biweekly;
living expenses Rent $1,500 / Groceries $700 / Car $600; **one** debt — `Store card` $5,000 @ 29.99%,
minimum $25 (monthly interest $124.96).

```
live debts     : 1   (the ONLY debt)
isFocus        : true
monthlyPayment : 25
monthlyExtra   : 0
payoffPossible : false

RENDERED: "At $25/mo alone, the interest outpaces the balance — this debt doesn't come down
           on its own. Your plan puts more toward it as your other debts clear."
```

The same sentence is produced on a zero-income single-debt store (`monthlyExtra: 0`, `isFocus: true`).

**Mechanism (HYPOTHESIS).** `payoffPossible: false` means only *"not at this payment"*. The `A2-1` fix
correctly narrowed the claim's scope and then attached an unconditional consolation to it. The rollover
it promises exists only when there IS a later debt to clear — i.e. when `isFocus` is false, or when
`liveDebts.length > 1`. For the focus debt of a one-debt plan both are false, and `monthlyExtra` is `0`,
so nothing more is coming from anywhere. This is the memory-file shape *assert the honest state by name*:
suppressing a false statement produced a different one.

**Reachability.** `isFocus` is `rankDebts(liveDebts, strategy)[0]` (`analysisSelectors.ts:177`), so a
single-debt store always makes that debt the focus. `monthlyExtra` is `0` whenever the steady-state
allocation has nothing spare — the exact condition under which a minimum sits below its interest.

**Remedy — UNVERIFIED.** Read `isFocus` / `monthlyExtra` (already on `amort`) and say what is true of
*this* store: the rollover sentence only where a later debt can supply one; otherwise the honest state
(the payment does not cover the interest and the plan has nothing spare to add). The replacement must be
asserted positively in a test — this branch has now produced two different wrong sentences, and nothing
in the tree asserts either string. Not applied.

## C2-4 — `minor` · the APR field is the only money field on the debt form that does not clear its own error

**Origin:** `fix-churn` · `apps/rn/src/components/entities/DebtSheet.tsx`

**User-facing consequence.** A user who types an APR of `150`, taps **Add debt**, reads *"Enter an APR
between 0 and 100."* and then corrects the APR to `15` still sees the error. It clears if they touch
**any other field** — name, balance, minimum, or Type — but not the one the message is about. The error
is cleared by everything except the correction.

**File and line.** `apps/rn/src/components/entities/DebtSheet.tsx:440`
`<TextField testID="field-debt-apr" … onChangeText={setApr} … />`
Compare its three siblings, all of which clear:
- `:390` name — `onChangeText={(t) => { setName(t); setError(''); }}`
- `:414` balance — same shape
- `:439` minimum — same shape
- `:181-182` `onTypeChange` — `setError('')`

**MEASUREMENT.** Read, not run — this is a state-handler asymmetry visible in one file, and the two
error strings it strands are `FORM_ERRORS.aprOutOfRange` = *"Enter an APR between 0 and 100."*
(`obligationForm.ts:127`, raised at `DebtSheet.tsx:281`) and `FORM_ERRORS.aprInvalid` = *"Enter the APR
as a number, or leave it blank."* (`obligationForm.ts:106`, raised at `DebtSheet.tsx:277`). Both are
reachable only from the APR field, and the APR field is the only one that cannot dismiss them.

**Mechanism (HYPOTHESIS).** `setApr` is passed as the handler directly rather than being wrapped like
its three neighbours. The APR validation (`:277`, `:281`) was added by `[S1.10.6.6 · B2]` after the
`setError('')` wrapping pattern was already established on the other fields, and the handler was not
brought along with it.

**Remedy — UNVERIFIED.** Wrap it as its siblings are: `onChangeText={(t) => { setApr(t); setError(''); }}`.
Not applied.

## C2-5 — `minor` · the ledger's screen-reader label drops "from savings", so an external row sounds like an unexplained flat balance

**Origin:** `stale-read` · `apps/rn/src/components/progress/TimelineLedger.tsx`

**User-facing consequence.** In the per-cycle "where every dollar went" ledger, a row funded from savings
prints `−$200` next to a running balance that **does not move** — and the visible caption *"from savings"*
is what explains that. A VoiceOver user hears `"Vacation, −$200, balance $500"` followed by the next row's
`"…, balance $500"` with no explanation, on the screen whose entire job is to account for every dollar.

**File and line.**
- `apps/rn/src/components/progress/TimelineLedger.tsx:111` — the row's `accessibilityLabel`:
  `` `${item.label}, ${signed}, balance ${formatCurrency(item.runningCash)}` `` — `item.isExternal` is not read.
- `:119` — the visible qualifier: `{item.isExternal ? <Text …>from savings</Text> : null}`.
- The row is `accessible` (`:111`), which collapses the children into one utterance and lets the explicit
  label replace the composed one, so the `from savings` `Text` is not announced.

**MEASUREMENT.** Read against the producer, not run. `packages/core/timeline/buildTimelineItems.ts:165`
— `if (item.type !== "paycheck" && !item.isExternal) { runningCash = … - item.amount }`. So for an
external item the emitted `runningCash` is **identical to the previous row's**, while `TimelineLedger.tsx:108`
renders `signed = "−" + formatCurrency(item.amount)` for it unconditionally. The visible caption is the only
thing reconciling the two, and it is exactly what the a11y label omits.

**Mechanism (HYPOTHESIS).** The label was written from the two fields the row always has (`label`,
`amount`, `runningCash`); `isExternal` is optional on the item type (`buildTimelineItems.ts:23` —
`isExternal?: boolean`) and was added to the visual row without being carried into the utterance.

**Remedy — UNVERIFIED.** Append the qualifier to the label when `item.isExternal` is set, matching the
visible text. Not applied.

## C2-6 — `minor` · two more money-entry paths do not clear the APR error, and only one of the three enforces "minimum can't exceed the balance"

**Origin:** `stale-read` (`FirstDebtOrBillStep.tsx`) · `fix-churn` (`DebtSheet.tsx`) — the class C2-4 belongs to

**User-facing consequence (two parts).**

**(a) The stale APR error is a class, not one site.** `C2-4`'s defect repeats verbatim on the user's
**first** debt: `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:200` —
`<TextField testID="field-onboarding-apr" … onChangeText={setApr} …>` — while every other field on that
same step wraps with `setError('')` (`:165-168` name, `:178-181` balance, `:191-194` minimum,
`:141-144` the Debt/Expense toggle, `:209-212` amount). Fixing only the site `C2-4` names would leave
onboarding — the more consequential of the two — with the same dead correction.

**(b) The `minimum > balance` refusal did not travel with the APR bound it was written beside.**
`[S1.10.6.6 · B2]` swept the `apr > 100` bound across the entry paths, and the two lines sit adjacent in
the debt sheet:
```
DebtSheet.tsx:281   if (aprN > 100) return setError(FORM_ERRORS.aprOutOfRange);
DebtSheet.tsx:282   if (minimumN > balanceN) return setError('Minimum payment can’t exceed the balance.');
```
`FirstDebtOrBillStep.tsx:70` carries the APR bound and **not** the minimum bound.
`packages/core/imports/debtCsv.ts` (the CSV import) bounds the APR at `:309` and never compares the
minimum to the balance. Of the three live RN entry paths, one refuses the input and two accept it. The
only other site holding the rule is `packages/core/debt/parseDebtFormValues.ts:47`, whose sole consumer
is the legacy root `components/DebtsSection.tsx` — the surface `P6.11` deletes.

**MEASUREMENT (of part b's blast radius, so it is not overstated).** One store, `Store card` balance
$200, due inside cycle 0, income $1,500 biweekly, driven through the real `selectCashTimeline`:

```
minimumPayment=$50  -> row "Pay minimum on Store card = 50"   endingBalance 1400
minimumPayment=$500 -> row "Pay minimum on Store card = 200"  endingBalance 1250
```

**The engine caps the reserve at the balance**, so no money is over-reserved and this is *not* a blocker.
What is stored is a `minimumPayment` the debt sheet would refuse, on the two paths that do not check it.
No summing consumer of the raw field was found (`grep` for `reduce`/`+=` over `debt.minimumPayment` in
`apps/rn/src` returns nothing), so the uncapped-consumer risk is **unverified rather than refuted**.

**Mechanism (HYPOTHESIS).** Both halves are the same shape: a rule was applied at the site a finding
named and not at its siblings. For (a) the `setError('')` wrapping predates the APR validation and was
never retro-fitted to the APR handler on either form; for (b) the class sweep that carried `apr > 100`
to onboarding and the CSV parser stopped one line short.

**Remedy — UNVERIFIED.** (a) wrap both APR handlers as their siblings are. (b) decide whether the rule is
real; if it is, it belongs in one shared validator the three paths call, not a fourth hand-written copy.
Not applied.

## C2-7 — `blocker` · the last onboarding screen states a paycheck date to a user who skipped the paycheck step, from a biweekly default they never chose

**Origin:** `stale-read` · `apps/rn/src/components/onboarding/CompletionStep.tsx`

**User-facing consequence.** A user taps **"Skip for now"** on the paycheck step (`onboarding.tsx:40`)
and **"Skip, I'll add later"** on the debt step (`:41`). The final screen — the highest-visibility screen
in the app — greets them with **"Your next paycheck lands Wed, Sep 16"** and *"Here's what it has to
cover, and what's left after."* They gave the app no amount, no pay cycle and no payday. The date is
`today + 14` from a biweekly default they were never asked to confirm, presented as a fact about them.

**File and line.**
- `apps/rn/src/components/onboarding/CompletionStep.tsx:37, 60-61` — `finishLine(debtFreeDate, store.paycheck.nextPaycheckDate)`, rendered as the title and body.
- `apps/rn/src/store/onboardingFinish.ts:26-31` — the second rung fires on `if (nextPaycheckDate)`, which is a **date string that is never empty**.
- `apps/rn/src/data/defaults.ts:25` — `nextPaycheckDate: getNextPaycheckDate({ payCycle: 'biweekly', currentDate })`.

**MEASUREMENT.** The skip-skip store is exactly `createDefaultStore()` — neither skip path writes
anything (`PaycheckStep.tsx:86` and `FirstDebtOrBillStep.tsx:116` call `onSkip` only). Driven through
the real `finishLine` and the real `selectPayoffView`:

```
paycheck.amount           : ""            (never entered)
paycheck.payCycle         : biweekly      (never chosen — the default)
paycheck.nextPaycheckDate : 2026-09-16    (currentDate + 14, biweekly)
paycheck.currentDate      : 2026-09-02
debts                     : 0
debtFreeDate              : null

RENDERED:
  title: "Your next paycheck lands Wed, Sep 16"
  body : "Here's what it has to cover, and what's left after. Add a debt any time
          and you'll get a debt-free date too."
```

**Mechanism (HYPOTHESIS).** `onboardingFinish.ts`'s ladder treats `nextPaycheckDate` as evidence the
user supplied a pay cycle. It is not — the field is seeded on every fresh store, so the rung's guard can
never be false and **the honest third rung ("Your plan is ready · Add your paycheck and what you owe")
is unreachable in the shipping app**. That third rung is written for exactly this user and cannot be
shown to them. This is `T3B`/`L5-11`'s own intent inverted by the store's default rather than by the
ladder's logic.

**Corroborating precedent in the repo.** `apps/rn/src/store/paycheckForm.ts:78-92` condemns this exact
value: *"It used to fall back to BIWEEKLY, and that silently corrupted the user's first fact about
themselves… a confidently WRONG date is not a gentler failure than a dash."* That fix removed the
fallback from the form; the same fallback still reaches the user through the default store.

**Alternative reading, stated so triage can decide.** If the app is considered to be *proposing* a
biweekly schedule rather than reporting one, this is `minor` copy. The reason it is filed as `blocker`
is that the sentence is declarative about the user's own money (`"Your next paycheck lands …"`) and the
body promises a breakdown of an amount the store holds as `""`.

**Remedy — UNVERIFIED.** Gate the second rung on something the user actually supplied — a non-empty
`paycheck.amount`, or an explicit "the pay cycle was confirmed" flag — so the third rung becomes
reachable for a skip-skip user. A test should assert the third rung's *string* on a `createDefaultStore()`
input; nothing currently does. Not applied.

**Amendment to C2-6 (same class, third member — filed here rather than as a new number so the class is
counted once).** `apps/rn/src/components/entities/GoalSheet.tsx:163` —
`<TextField label="Current amount saved" … onChangeText={setCurrent} …>` — is the third site with a bare
setter, and it strands `'Enter what you have saved so far, or leave it blank.'` (`GoalSheet.tsx:104`),
an error raised *by that field*. Its four siblings on the same sheet all wrap (`:161` name, `:162`
target, `:185` the priority switch, `:190` the pace). **The class is now three sheets — debt, onboarding
debt, goal — and in each one the stranded message belongs to the very field that cannot clear it.** A
fix that touches only `DebtSheet.tsx:440` leaves two.

## C2-8 — `minor` · "Enter a name." turns the AMOUNT box red on two expense sheets — every error lands on one field regardless of which field is wrong

**Origin:** `stale-read` · `apps/rn/src/components/entities/ExpenseSheet.tsx`, `LivingExpenseSheet.tsx`

**User-facing consequence.** Add an expense, leave the Name blank, tap **Add expense**: the **Amount**
field's border goes red and the caption under *Amount* reads **"Enter a name."** The Name field — the
one that is actually wrong — is untouched. On `ExpenseSheet` the same slot also receives *"Enter the
full price after the trial."* and *"Enter when the full price starts (YYYY-MM-DD)."*, both of which
belong to controls further down the sheet.

**File and line.**
- `apps/rn/src/components/entities/ExpenseSheet.tsx:109` — the amount field is the **only** render site
  for `error`: `error={error || undefined}`. The sheet has no standalone error `Text` (contrast
  `DebtSheet.tsx:446` and `GoalSheet.tsx:197`, which both render one).
  Errors routed into it: `:56` `FORM_ERRORS.nameRequired`, `:62` amount-now, `:63` full price, `:65`
  full-price date, `:67` `FORM_ERRORS.amountPositive`.
- `apps/rn/src/components/entities/LivingExpenseSheet.tsx:192` — same shape;
  `FORM_ERRORS.nameRequired` (`:158`) and `FORM_ERRORS.amountPositive` (`:160`) share one slot.

**MEASUREMENT.** Read against the primitive rather than run, because the rendering is the claim:
`apps/rn/src/components/ui/TextField.tsx:78` sets `borderColor: error ? c.accent.danger : c.border.control`
and `:83-84` prints the string in `c.accent.danger` **beneath that field**. So the string is not merely
misplaced — the failure treatment is applied to a field the user filled in correctly. `TextField`'s own
docblock (`:39-49`) records that this treatment was already once measured as saying the wrong thing about
the user's entry.

**Mechanism (HYPOTHESIS).** Both sheets have a single `error` state and no dedicated error slot, so the
handful of messages the submit path can raise were routed to whichever field was closest to hand — the
amount field, which is also the one most of them are about. The two sheets that *do* have a standalone
slot show the intended pattern.

**Remedy — UNVERIFIED.** Either give these two sheets the standalone error `Text` their siblings have,
or route each message to the field it names. Not applied.

## C2-9 — `major` · the pass-6 `C2-3` guard sees exactly one spelling of the defect, and the sibling sheets in its own directory use the other

**Origin:** `first-look` · `apps/rn/src/components/entities/debtPrefill.test.ts`

**What is claimed vs what is done.** The assertion's own label is
*"no useState in DebtSheet seeds from `editing` — it seeds from `seed`, so a prefill is honoured"*
(`debtPrefill.test.ts:253-257`), with a stated cap of **zero** and a stated reason: *"Matched by text with
a cap of zero rather than by naming the four fields — the four were what was left over last time somebody
named the fields."* The check is one regex, `/useState\(\s*editing\??\./g` (`:252`), which matches only
`useState(editing.` and `useState(editing?.`. **The same defect written as
`useState(editing ? String(editing.x) : '')` is invisible to it** — and that is the spelling used by the
two sheets sitting beside it in the same directory:
- `apps/rn/src/components/entities/GoalSheet.tsx:26` — `useState(editing ? String(editing.targetAmount) : '')`
- `apps/rn/src/components/entities/ExpenseSheet.tsx:33` — `useState(editing ? String(editing.amount) : '')`

So the cap-of-zero, which exists precisely so a *future* field cannot slip through, does not cover the
form a developer copying the neighbouring sheet would most naturally write.

**MEASUREMENT — planted both directions, control read first.** Runner:
`npx tsx src/components/entities/debtPrefill.test.ts` from `apps/rn`, exit code read directly (no pipe to
`tail` for the verdict).

```
CONTROL (unmodified)   : 39 assertions passed · exit 0
PLANT A  const [plantA, setPlantA] = useState(editing?.apr);
                       : exit 1 — FAIL [no useState in DebtSheet seeds from `editing` … (found 1) (expected 0, got 1)]
PLANT B  const [plantB, setPlantB] = useState(editing ? String(editing.apr) : '');
                       : 39 assertions passed · exit 0     <-- SAME DEFECT, NOT SEEN
```

Plant A proves the checker can see the file and reds for the right reason (the brief's "prove your checker
can SEE the subject"). Plant B is the identical defect — a control seeded from `editing`, so a prefill is
discarded — in the sibling sheets' spelling, and the suite is green over it.

**Mechanism (HYPOTHESIS).** The regex encodes the shape of the four fields that were actually wrong when
it was written (`seed?.x` / `editing?.x`), not the property it names. `useState(editing ? … : …)` is a
member of the population it claims to bound, and the population was never enumerated — the same
`audit-site-lists-undercount` shape the file's own docblock is arguing against one paragraph earlier.

**Restore verified.** `DebtSheet.tsx` was copied to a scratchpad backup *before* the first plant and
restored *from that copy*; `cmp` reports byte-identical and `git status --porcelain` on the path is empty.
⚠️ Worth recording: an intermediate restore written by a Python round-trip silently converted the whole
file from CRLF to LF while `git diff --stat` showed **no content diff** — only `cmp` and `file` caught it.
The re-run after the byte-exact restore is green (39 assertions, exit 0).

**Remedy — UNVERIFIED.** Widen the pattern to any `useState(` initialiser whose first identifier is
`editing` (e.g. `/useState\(\s*editing\b/g`), and add `PLANT B`'s exact line as a documented negative case
so the widening cannot regress. Verify by re-planting both A and B. Not applied.

## C2-10 — `minor` · the data-reset screen's `allowRealStoreWrite` wrapper is inert, and its stated mechanism is false

**Origin:** `stale-read` · `apps/rn/src/components/DataResetScreen.tsx`

**User-facing consequence.** None directly — this is a stale premise on a recovery screen. It is filed
because it is a live invitation to propagate a false rule: the two recovery doors on this one screen
disagree about whether the `[R4]` guard applies to them, and the comment tells the next reader that the
unwrapped one is broken.

**File and line.** `apps/rn/src/components/DataResetScreen.tsx:106-113`:
```
// [R4] Declared, for the same reason the launch-time offer is: this fires while the store
// is a not-yet-onboarded default, which is precisely the audience a demo sandbox is
// admitted for, so an undeclared write here would be refused.
allowRealStoreWrite(() => { appStore.getState().importStore(cloud); … });
```
The sibling door on the same screen — **"Import a backup file"** (`:118-123`) → `ImportBackupSheet`
(`:131`) → `BackupSheets.tsx:164` `appStore.getState().importStore(found.store)` — is **not** wrapped.

**MEASUREMENT (structural, traced through the render tree).** `refuseRealStoreWrite` refuses **only**
when `sandboxDepth > 0` (`apps/rn/src/store/realWriteGuard.ts:136` — `if (sandboxDepth === 0) return false;`).
`sandboxDepth` is incremented by exactly one caller, `enterSandboxScope()` at
`apps/rn/src/store/StoreContext.tsx:80` (grep over `apps/rn/src` returns that one call site plus the
definition). `DataResetScreen` is rendered from `apps/rn/src/app/_layout.tsx:279-286`, an **early return
that sits above** the `GestureHandlerRootView` / `ThemeProvider` / provider tree at `:292` onward. No
provider — and therefore no sandbox scope — can be mounted while this screen is on screen, so
`sandboxDepth` is `0` and the wrapper changes nothing.

The unwrapped sibling is the control: if the premise were true, "Import a backup file" on this same
screen would silently drop the user's restore, and it does not.

**Mechanism (HYPOTHESIS).** The comment reasons from *audience* — "a not-yet-onboarded default store is
the audience a demo sandbox is admitted for" — but the guard keys on *mount depth*, not on the store's
contents. The two are different questions and only one of them is what `realWriteGuard` asks.

**Remedy — UNVERIFIED.** Either drop the wrapper and the comment, or (if it is wanted as belt-and-braces)
correct the comment to say so and apply it to both doors. What must not happen is the comment being read
as a rule and copied onto `BackupSheets.tsx:164`, which would put a synchronous-only guard around a call
reached from paths where it is meaningless. Not applied.

## C2-11 — `minor` · `Select` announces every option as a plain button, so a screen-reader user cannot hear which recurrence or category is already set

**Origin:** `stale-read` · `apps/rn/src/components/ui/Select.tsx`

**User-facing consequence.** Open the **Recurrence**, **Category**, **Type** or **Provider** picker on any
money sheet with VoiceOver on and every row reads *"Monthly, button" · "Weekly, button" · …*. Which one
is currently set is conveyed only by an accent-coloured label and a check glyph — both purely visual. On
a debt or expense sheet, recurrence is what decides when the obligation is reserved from a paycheck.

**File and line.** `apps/rn/src/components/ui/Select.tsx:184-194` — each option is
`accessibilityRole="button"` with no checked/selected state; the selection is expressed at `:192`
(`color: o.value === value ? c.accent.primary : c.text.primary`) and `:193`
(`<AppIcon name="check" …/>`). `apps/rn/src/components/ui/AppIcon.tsx:11-13` renders a bare
`MaterialIcons` with **no accessibility props at all**, so the check contributes nothing to the tree.

**MEASUREMENT (population, derived two ways).** This is the un-swept member of a class that was already
swept once. `apps/rn/src/utils/a11y.ts:101-110` records the sweep: *"`a11ySelected` is RETIRED, and all
six of its callers now use `a11yChecked` with a corrected ROLE."* `grep -rl a11yChecked apps/rn/src`
returns 7 files — `paywall.tsx`, `PaydayCaptureSheet.tsx`, `RecoveryPlanSection.tsx`, `SaveForItSheet.tsx`,
`CheckCircle.tsx`, `RadioGroup.tsx`, `SegmentedToggle.tsx` — and **`Select.tsx` is not among them.**
`grep -rn '<Select' apps/rn/src` returns **8 call sites across the three entity sheets**
(`DebtSheet.tsx`, `ExpenseSheet.tsx`, `GoalSheet.tsx`), i.e. every money form in the app. The population
was "the six files that called the retired helper", not "the single-choice controls", so a control that
never called it was outside the sweep by construction.

`SegmentedToggle.tsx:192-208` is the same defect already diagnosed and fixed, with the reasoning written
out: *"a single-choice set of 2–3 options IS a radio group"*, and `aria-selected` on a `button` is
ignored. `Select`'s modal list is a single-choice set of 2–7 options and is still a row of buttons.

**Mechanism (HYPOTHESIS).** `Select` renders its options inside a `Modal` rather than inline, so it does
not look like the segmented/radio controls the a11y pass was aimed at, and the check glyph makes the
selection *look* stated. The role fix `SegmentedToggle` documents (`radiogroup` + `radio` + `a11yChecked`)
applies unchanged here.

**Remedy — UNVERIFIED.** Give the option list `accessibilityRole="radiogroup"`, each option
`accessibilityRole="radio"` and `{...a11yChecked(o.value === value)}`, matching `RadioGroup.tsx:245-246`.
Not applied.

---

# Report — SPLIT BY ORIGIN

**Coverage: 72 of 72 manifest files opened and read** (`READ-C2.txt`; `comm` against `ROUTING-C2.txt`
returns empty). 83 lines are listed there: the 72 in the manifest plus 11 out-of-lane files opened to
measure a claim against its producer (`payoffSelectors.ts`, `analysisSelectors.ts`, `planSelectors.ts`,
`extraPaymentPlan.ts`, `buildTimelineItems.ts`, `amountField.ts`, `logPaymentCopy.ts`,
`cloudBackupMessages.ts`, `onboardingFinish.ts`, `realWriteGuard.ts`, `forecastCycles.ts`,
`defaults.ts`, `_layout.tsx`).

## Totals

| | blocker | major | minor | **total** |
|---|---|---|---|---|
| **all** | **3** | **1** | **7** | **11** |

## By origin

| origin | files in manifest | blocker | major | minor | findings |
|---|---|---|---|---|---|
| `fix-churn` | 8 | 2 | 0 | 1 | C2-1, C2-3, C2-4 |
| `stale-read` | 58 | 1 | 0 | 6 | C2-2, C2-5, C2-6 (+amendment), C2-7, C2-8, C2-10, C2-11 |
| `first-look` | 1 | 0 | 1 | 0 | C2-9 |
| `neighbour` | 5 | 0 | 0 | 0 | — |
| `instrument` | **0** | — | — | — | — |

⚠️ **The brief asked this lane to weight `instrument` heavily and there is not one `instrument`-origin
file in `ROUTING-C2.txt`.** The one instrument finding here (`C2-9`) is on a `first-look` test file. If
the dispatch intended C2 to carry instrument coverage, the routing did not deliver it.

⚠️ **`fix-churn` is 11% of this lane's files and produced 27% of its findings, including two of the three
blockers.** Both blockers are the *same shape*: a pass-6 fix applied at the site the finding named and
not at its sibling (`C2-1`: `orderDiffers` gates line 135 and not line 147; `C2-3`: `A2-1` narrowed one
claim and attached a new unconditional one). `C2-4`/`C2-6` are a third instance across three sheets.

## Measured and found SOUND — negatives worth not re-measuring

These were driven through the real modules and did **not** produce a finding. Recorded so a later pass
does not spend the same time:

1. **The debt-free pill and the endpoint bead agree.** 400 random portfolios through the real
   `selectPayoffView`: `shortDate(view.debtFreeDate)` vs `monthYearLabel(startDate, active.find(p => p.balance<=0).month)`
   — **0 mismatches**, control `bothPresent=400 / bothNull=0` (a null-vs-null vacuous pass was ruled out
   explicitly). `selectDebtFreeDate` and `simulatePayoff` both read the steady-state extra
   (`planSelectors.ts:179-186`), so the two producers on that card do not disagree.
2. **`ListRow`'s pass-6 `C2-5` progress clamp is correct.** `ListRow.tsx:137` puts the `Number.isFinite`
   test *before* the `Math.max`, which is the fix `NaN` defeats.
3. **A zero-payment BNPL cannot be created.** `DebtSheet.tsx:252` uses `parseAmountField`, which returns
   `null` for `0` (`amountField.ts:42`), so `remainingPayments: 0` → a `$0` balance debt is unreachable.
4. **`"NEXT 1 PAY CYCLES"` is unreachable** from `CashFlowSection.tsx:70`. `selectCashTimeline` returned
   exactly **5** cycles on all four pay cycles (weekly / biweekly / semimonthly / monthly).
5. **The cone cannot be drawn past the frame.** `trajectoryDomain` uses `clearMonth(cone) ?? 0`, which
   would strand a never-clearing lean curve outside the plot — but `planSelectors.ts:215` sets
   `hasBand` only when `lean != null`, and the drawn lean curve runs on the *steady-state* extra, which
   is ≥ the dampened extra the band's date is computed from. The direction is safe.
6. **`previewRestore` cannot strand the iCloud restore confirm.** `use-cloud-backup.ts:227-231` resets
   `previewing` in a `finally`, so a throw cannot leave the confirm permanently un-committable.
7. **`PaidOffArchive`'s `null` total is honoured downstream.** `ShareCard.tsx:67` gates on
   `totalPaid != null && > 0`, so pass-3 `C-4`'s "don't fabricate a sum" contract survives into the
   image that leaves the device.

## Notes for triage

- **`C2-4`, `C2-6` and its amendment are ONE class across three sheets** (`DebtSheet.tsx:440`,
  `FirstDebtOrBillStep.tsx:200`, `GoalSheet.tsx:163`). Fix by class.
- **`C2-8` is a second class across two sheets** (`ExpenseSheet.tsx:109`, `LivingExpenseSheet.tsx:192`).
- **`C2-9` names the exact plant to re-run** (`PLANT B`) after the widening, in both directions.
- **A concurrent lane has a live plant in the tree**: `scripts/surface-coverage.ts` currently carries
  `to: 's9'` (was `'s4'`) and `if (false && badRoutes.length)`. Not this lane's; **not touched**, and
  flagged so it is not committed by accident.
