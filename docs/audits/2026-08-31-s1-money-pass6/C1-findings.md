# C1 findings — plan cards, money, payday (pass 6)

Lane C1. Subject: `apps/rn/src/components/plan/`, `money/`, `payday/` — 51 files.

## C1-1 — `major` · "set it again **above**" survives the acknowledgement, and after it there is nothing above

**Origin:** `stale-read` (`PaydayGuardianCard.tsx`, `RequiredActionsCard.tsx`, `AffordabilityCard.tsx`).

**User-facing consequence.** Three cards on Today tell the user to fix an unreadable amount by setting it
"again **above**". The only affordance that names *which* amount could not be read — `DataRepairsCard` — is
rendered into Today's ack slot at the very top, and it is gated on **unacknowledged** repairs. One "Got it"
tap removes it permanently. The suppression it explains does **not** clear. From that tap on, the user sees
a Guardian card that refuses its verdict, a Required list that says it is incomplete, and an affordability
answer that refuses to answer — all three pointing at a control that is no longer on the screen, and none of
them naming the figure to re-enter.

**File and line.**
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx:208-209` — *"An amount this paycheck has to cover
  could not be read … set it again above and this comes back."*
- `apps/rn/src/components/plan/RequiredActionsCard.tsx:153-154` — *"… set it again above and it comes back."*
- `apps/rn/src/components/plan/AffordabilityCard.tsx:233-234` — *"… set it again above and I can tell you."*
- `apps/rn/src/app/(tabs)/index.tsx:222` — `const dataRepairs = isExample ? [] : store.pendingDataRepairs.filter((r) => !r.acknowledged);`
- `apps/rn/src/app/(tabs)/index.tsx:589-595` — `{activeAck === 'data-repairs' ? <DataRepairsCard … onAck={() => store_.getState().acknowledgeDataRepairs()} …>`

**The measurement.** One store, one variable: a debt whose `minimumPayment` was repaired, so
`store.pendingDataRepairs = [{ entity:'debt', id:'d1', field:'minimumPayment', kind:'repaired', acknowledged:? }]`.

| `acknowledged` | `dataRepairs.length` (index.tsx:222) | `DataRepairsCard` renders | `mayClaim(store,'required-plan')` (trustSelectors.ts:277-279) | the three sentences |
|---|---|---|---|---|
| `false` | 1 | **yes**, above `{content}` (line 737) | `false` | shown — and "above" is true |
| `true` | 0 | **no** | `false` | shown — and "above" is **empty** |

`mayClaim` is `!store.pendingDataRepairs.some((r) => poisons(r, claim))` — `poisons`
(`trustSelectors.ts:245-251`) never reads `r.acknowledged`. This is deliberate and documented at
`index.tsx:243` (*"the record itself survives the ack so the trust guards elsewhere keep working"*) and at
`trustSelectors.ts:361-364` (`A-J2-1`). Only `clearResuppliedRepairs`' signal 1 (the field's value moved) or
signal 2 (the row is gone) clears a field repair — `trustSelectors.ts:432-438`. **Both correct; the copy is
what did not follow.**

**Mechanism, as a hypothesis.** The sentence was written against the render in which the repairs card is
still up, and the ack was treated as a dismissal of a notification rather than as the removal of the only
place the missing figure is named. The three sentences carry a *positional* claim ("above") about a sibling
whose lifetime is governed by a different predicate (`!acknowledged`) from the one that governs theirs
(`pendingDataRepairs.some(poisons)`). Two predicates over one record is the same shape as
`RequiredActionsCard`'s own `[B5]`.

**Remedy — UNVERIFIED.** Do not change the guard. Either (a) name the figure in the sentence itself, using
`unreadFieldsFor` / the repair's own row name, so the instruction does not depend on a sibling being
mounted; or (b) route these three sentences through a shared producer that also decides whether "above" is
currently true. ⚠️ **Do not make `mayClaim` read `acknowledged`** — that is `A-J2-1` verbatim and it restored
*"every balance is cleared"* over debts still owed.

## C1-2 — `minor` · the verdict is spoken on two branches of four; the free tier's one number and the unread-inputs refusal are both silent on iOS

**Origin:** `stale-read` (`apps/rn/src/components/plan/AffordabilityCard.tsx`).

**User-facing consequence.** A VoiceOver user types a purchase amount. If they are premium and the plan is
readable, the verdict is announced. If they are **free**, the one line they get — *"You have about $750 spare
this paycheck."* — is announced by nothing. If an amount could not be read, the refusal — *"…so I'd be
answering off a plan that's missing something"* — is announced by nothing either. Both are the state the
docblock says this design exists to prevent.

**File and line.** `apps/rn/src/components/plan/AffordabilityCard.tsx:156-164`

```
const verdictLine =
  result && isPremium && !unreadPlanInputs   // ← the gate
    ? …                                       //   3 premium sentences
    : null;
const liveProps = useLiveAnnouncement(verdictLine);
```

**The measurement.** `useLiveAnnouncement` (`apps/rn/src/utils/a11y.ts:167-175`) has two channels:

```
if (!message || message === spoken.current) return;   // line 170 — the announce() path
…
return { accessibilityLiveRegion: 'polite', 'aria-live': 'polite' };  // line 174
```

`accessibilityLiveRegion` is Android-only in React Native and `aria-live` is react-native-web only, so on
iOS the **only** channel is the `announce()` at line 172 — and `!message` short-circuits it. Four render
branches sit inside the `liveProps` wrapper (`:227-300`): `!result` (hint), `unreadPlanInputs` (`:232`),
`!isPremium` (`:238`), and the premium verdicts (`:241`, `:251`). `verdictLine` is non-null for exactly the
last one. Branches 2 and 3 change the drawn answer and announce nothing.

**Mechanism, as a hypothesis.** `verdictLine` is doing two jobs — it is both the *string the premium branch
renders* and the *string that gets announced* — and the premium/trust gate that correctly belongs to the
first job was inherited by the second. The file's own docblock (`:130-134`) states the invariant as *"the
spoken answer and the drawn answer cannot come apart"*; that holds only while the drawn answer is the
premium verdict. ⚠️ **This is a carried premise that has decayed**: the `unreadPlanInputs` branch was added
later (`G-4`, `:136-153`) and it re-opened the case the docblock closed.

**Remedy — UNVERIFIED.** Announce the sentence that is actually rendered, not the premium verdict: derive one
`spokenLine` alongside the branch selection (covering the unread and free lines) and pass that to
`useLiveAnnouncement`. ⚠️ Do **not** announce the `!result` hint — it does not change when the user types, so
it would be a no-op at best and a repeat at worst.

## C1-3 — `blocker` · `PlanHero` states "On track · debt-free by \<date\>" on the store where the Guardian card directly beneath it refuses to state anything

**Origin:** `stale-read` (`apps/rn/src/components/plan/PlanHero.tsx`).

**User-facing consequence.** `PlanHero` is the first card on Today and the loudest thing on the screen: a
40pt paycheck figure, a green check, and the line *"On track · debt-free by Jun 2028"*. It has **no trust
gate of any kind**. On the store `S1.11.4.2 / C4-7` was fixed for — one debt whose `minimumPayment` or
`balance` the reader could not read — the hero states a verdict and a **date**, the `PaydayGuardianCard`
rendered 20 lines below it says *"One amount is missing"*, and `RequiredActionsCard` says the list is
incomplete. ⛔ **The card that was fixed is below the card that was not, and the unfixed one is the one the
user reads first.** This is `C4-7`'s finding with the surfaces swapped: there, the two surfaces *outside* the
app refused while the in-app card asserted; here the in-app card refuses while the hero above it asserts.

**File and line.**
- `apps/rn/src/components/plan/PlanHero.tsx:130-136` — `statusLabel` / `reassurance`, the verdict + date.
- `apps/rn/src/components/plan/PlanHero.tsx:239-242` — rendered with `check-circle` in success green.
- `apps/rn/src/app/(tabs)/index.tsx:335-343` — the call site. Props are `summary`, `recommended`,
  `nextPaycheckDate`, `windfall`, and three callbacks. **No `unreadPlanInputs`, no `mayClaim`.**
  `grep -n "mayClaim" index.tsx` returns exactly three lines: the import (`:71`) and the two card props
  (`:364`, `:540`). The hero is not one of them.

**The measurement.** Two independent doors, and **both bias the date EARLY** — the same known direction
`G-4` argued makes a caption insufficient and requires replacing the claim.

1. `apps/rn/src/store/planSelectors.ts:113` — `const liveDebts = store.debts.filter((d) => d.balance > 0);`
   A repaired balance is `0`, so the debt is **dropped from the projection entirely**. `projectDebtPayoff`
   runs over a smaller portfolio → an earlier date. This is verbatim the mechanism `trustSelectors.ts:213-222`
   records for `G-4` (*"the allocation engine skips a debt with no balance left to pay"*), which is why
   `balance` was added to the `'required-plan'` route.
2. `apps/rn/src/store/planSelectors.ts:118` —
   `monthlyExtraPayment: selectExtraToDebt(steady ?? allocation) * payCyclesPerMonth(...)`.
   A lost `minimumPayment` removes the obligation from the allocation, so `selectExtraToDebt` is **larger**
   than the truth → a larger extra payment → an earlier date again.

And the verdict beside it: `planSelectors.ts:444` —
`status: overdue ? 'overdue' : shortfall > 0 ? 'short' : 'on-track'`. An obligation that left the plan
produces no unfunded item, so `shortfall` is honestly `0` about arrays that are wrong and the hero reads
**on-track**, in `onNavy.essential` green, with a `check-circle`.

The state is reachable: `selectPlanState` (`planSelectors.ts:343-353`) returns `'normal'` whenever
`debtLiveness(store) === 'has-debt'`, which holds with **one** readable debt beside the unread one — so the
whole ordinary Today renders, hero included. `debtLiveness` is the store-level question and
`trustSelectors.ts:220-222` already records that it *"cannot catch this one — both worlds are `has-debt`"*.

**Mechanism, as a hypothesis.** The trust work routed the claim to the components whose *named* sentence was
the reported one (`"You're caught up"`, `"Apply the spare $1,800"`, `"Yes — you'd still hold $300"`) and
`PlanHero`'s sentence is neither a dollar figure nor the word "clear" — it is a **status word and a date**,
so it did not match the shape anybody was grepping for. The lane's own history says this is the recurring
miss: *the verdict goes with the figures, and findings keep failing to name it.* `PlanHero` is the member of
the class where the verdict is **all** there is.

**Remedy — UNVERIFIED, and it is not a caption.** `G-4`'s rule applies: the date is wrong in a known
direction and the word beside it is a verdict, so both must be withheld rather than asterisked. Pass
`unreadPlanInputs={!mayClaim(store, 'required-plan')}` from `index.tsx:335` and, when set, drop the
`· debt-free by …` clause and replace `statusLabel` with a non-verdict ("Some amounts are missing"),
neutral-toned, no `check-circle`. ⚠️ **Do not null the summary** — `index.tsx` renders the whole
`allocation && summary` branch off it and nulling removes Today rather than making it honest, which is the
mistake `PaydayGuardianCard.tsx:139-140` records. ⚠️ **The segments and the paycheck total are a separate
question** and should be decided separately: they are a partition of `paycheckAmount`, which is a number the
user typed, not one the reader lost.

## C1-4 — `blocker` · the payday sheet reads **"All confirmed paid"** about a bill the user just marked *"Didn't pay"*, and shows **$0.00** for a $350 rent

**Origin:** `stale-read` (`apps/rn/src/components/payday/PaydayCaptureSheet.tsx`).

**User-facing consequence.** On the one screen whose own comment says its job is *"to establish ground
truth"* (`:286-287`), a bill the expense reserve pre-funded renders its **paycheck contribution** instead of
the **bill**. In the fully-covered case that figure is `$0.00`. The user taps the row to say they did not pay
it, the row's pill correctly flips to *"Didn't pay"* — and the carry-forward summary reports **"All confirmed
paid"**, because the carry it sums is `$0`. The same bill reads `$350.00` on Today, twelve inches above.

**File and line.** `apps/rn/src/components/payday/PaydayCaptureSheet.tsx`
- `:306` — `<Text …>{formatCurrency(row.item.amount)}</Text>` — the row's amount in "Which expenses got paid?"
- `:147-150` — `carryForward` sums `row.item.amount` for rows marked not-paid
- `:225-229` — `requiredSub = hasAdjustedRequired ? (carryForward > 0 ? '…carries' : 'All confirmed paid') : …`
- `:311-315` — the `carryForward > 0` gate on the "*$X carries to next cycle*" line
- `:161` — `capturedTotal = (hasAdjustedRequired ? Math.max(0, requiredTotal - carryForward) : requiredTotal) + plannedTotal`

**The measurement.** One store, one variable — the expense reserve pot. Taken from the **engine's own
standing test**, `packages/core/engine/testExpenseReserve.ts:82-91`, which asserts exactly this row:

```
const r = alloc({ expenseReservePot: 350 });          // one required expense: rent 350
rent.amount          === 0                             // "it contributes 0 from this paycheck"
rent.reserveCovered  === 350                           // "and names the reserve's 350"
rent.amount + rent.reserveCovered === 350              // "the two sum to the real bill"
```

| surface | what it prints for that row |
|---|---|
| `RequiredActionsCard.tsx:387` | `formatCurrency(item.amount + reserveCovered)` → **$350.00**, plus *"$350.00 from your reserve"* (`:380`) |
| `PaydayCaptureSheet.tsx:306` | `formatCurrency(row.item.amount)` → **$0.00**, no caption |

Then, in the sheet, tap the row → `requiredPaid[rentId] = false`, `hasAdjustedRequired = true`:

- `carryForward` = `0 + 0` = **0**
- `:311` `carryForward > 0` → **false** → the *"carries to next cycle"* line does **not render**
- `:228` → `requiredSub` = **`'All confirmed paid'`**, shown on the main sheet at `:375` the moment the
  user taps Done and comes back from the screen where they said the opposite.

The partial case is the same defect with a smaller number: pot `300` against rent `350` gives
`amount = 50`, so marking it unpaid announces **"$50.00 carries to next cycle"** about a **$350** bill —
understated by the whole reserve share.

⚠️ **The DATA is correct.** `decisionsFrom` (`:189-200`) writes `expensePaid[id] = false` off `requiredPaid`,
not off `carryForward`, so the reconciliation carries the right bill forward. Only the sentences are wrong —
which is this lane's exact shape: a true number becoming a false sentence.

**Mechanism, as a hypothesis.** `[T6.6 · L4-6]` fixed this class in `RequiredActionsCard` — its comment at
`:250-257` states the rule (*"the header and the rows under it are DIFFERENT QUANTITIES"*, and the row must
headline `amount + reserveCovered`) — and the fix reached the reported card and stopped. `PaydayCaptureSheet`
consumes the **same `RequiredRow[]`, from the same `selectRequiredRows` call** (`index.tsx:144`, passed at
`:748`), and was never visited. This is pass 4's measured class verbatim: *the fix reached the reported
instance and left a sibling asserting on the same store.* ⚠️ The `capturedTotal`/`requiredTotal` arithmetic
is **internally consistent** (`allocatePaycheck.ts:330-353` — `owedFromPaycheck` nets the reserve draw out of
`totalRequired` too), which is why nothing reconciliation-tested caught it.

**Remedy — UNVERIFIED, and two parts that must go together.**
1. `:306` render `item.amount + (item.reserveCovered ?? 0)` and add `RequiredActionsCard`'s caption, so the
   row names the bill.
2. ⛔ **`carryForward` must NOT simply switch to the same sum.** `capturedTotal` (`:161`) subtracts it from
   `requiredTotal`, which is net of the reserve — subtracting a gross carry from a net total would
   under-report the capture by the reserve share, i.e. the mirror of this bug. The two need separate
   figures: a **gross** carry for the sentence at `:313`/`:228`, and the existing **net** one for `:161`.
   ⚠️ Whichever way it lands, `:228`'s `'All confirmed paid'` must key on *"did the user mark any row
   unpaid"* (`preMarkAllPaid` / the `requiredPaid` map), never on a dollar sum — a verdict about the user's
   own answers should not be derived from money at all.

## C1-5 — `minor` · the payday sheet prints a raw ISO date — "Due 2026-08-15" — while Today prints "Due Aug 15"

**Origin:** `stale-read` (`apps/rn/src/components/payday/PaydayCaptureSheet.tsx`).

**User-facing consequence.** Every bill row on the payday "Which expenses got paid?" list is subtitled with
an unformatted ISO date.

**File and line.** `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:301-303`

```
: row.view.dueDate
  ? `Due ${row.view.dueDate}`      // ← raw
  : PAYCHECK_SEGMENT.required
```

**The measurement.** `view.dueDate` is assigned verbatim from the model:
`packages/core/debt/deriveRequiredActionView.ts:82` — `const dueDate = expense?.dueDate ?? debt?.dueDate;`
and those are date-only ISO strings throughout the store (`planSelectors.ts:158-160`,
`recoverySelectors.ts:15`). The sibling surface formats it: `RequiredActionsCard.tsx:365` renders
`Due {shortDate(dueDate)}` → *"Due Aug 15"*. **This file already has the identical helper** at `:36-39` and
already calls it eleven lines above, at `:340` (`verified {shortDate(v.lastVerifiedDate)}`).

**Mechanism, as a hypothesis.** The helper was added for the balance-check screen and the required-row
subtitle was written against `view.dueDate` (a field of the derived *view*, which looks pre-formatted)
rather than against `row.dueDate` (the field `RequiredActionsCard` formats). Two same-named fields on one
row, one of them a display field by naming convention only.

**Remedy — VERIFIED as a one-line substitution:** `` `Due ${shortDate(row.view.dueDate)}` ``. `shortDate`
at `:36-39` already handles `undefined` (returns `'a while ago'`) — ⚠️ **that fallback is wrong for a due
date**, so keep the existing `row.view.dueDate ?` guard around the call rather than relying on it.

## C1-6 — `major` · the extra-payment box is the one money input in the payday sheet that round-trips through a parser, and `?? 0` re-collapses the distinction `amountField.ts` exists to keep

**Origin:** `stale-read` (`apps/rn/src/components/payday/PaydayCaptureSheet.tsx`).

**User-facing consequence.** Editing an extra payment on payday, an entry that does not parse is recorded as
**$0.00** rather than refused — the payment the user meant to log is captured as nothing, and it is that
figure the Interest-Saved Ledger and the Drift Tracker are fed.

**File and line.** `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:433-440`

```
<TextInput
  autoFocus
  keyboardType="decimal-pad"
  value={String(amount)}                                                     // ← parsed number back in
  onChangeText={(t) => setOverride(key, { actualAmount: parseNonNegativeAmount(t) ?? 0 })}
```

**The measurement.** `parseNonNegativeAmount` (`packages/core/utils/amountField.ts:67-73`) returns `null`
for **both** blank and unparseable — deliberately, and the docblock at `:60-66` says why: *"Blank returns
`null` so the caller can keep whatever it was showing… clearing a pre-filled balance used to confirm the
debt at zero."* The `?? 0` at `:437` maps that `null` straight back to `0`. That is the same collapse
`amountField.ts:47-52` records as a shipped defect (*"`Number(raw) || 0` collapsed them, so a mistyped
`"5,5"` APR became 0%"*).

**This file gets it right three times out of four.** Every other money input here stores the raw string and
parses once, at commit:

| input | line | shape |
|---|---|---|
| balance check | `:343-349` | `value={balanceEdits[id] ?? ''}`, raw string kept; parsed at `:137` with `typed ?? v.currentBalance` — **correct fallback** |
| surprise outflow | `:473-482` | `value={surpriseAmount}`, raw string kept; parsed at `:219` |
| extra payment | **`:433-440`** | **parsed on every keystroke, the parsed number echoed back as `value`** |

It is also the only money input in the file that does not use `sanitizeAmountInput`
(`amountField.ts:110-118`), which exists specifically so a controlled money box *"can tolerate half-typed
states (`"12."`) that no parser would accept"* — the docblock's own words, and the docblock's own recorded
failure was a hand-rolled sanitiser wrong *"by a factor of 100."*

**Mechanism, as a hypothesis.** Two hypotheses, and I am marking which I measured:

- ⭐ **Measured, from the source:** the `?? 0` is a caller-side re-collapse of a distinction the shared
  parser was written to preserve. This is the class, and it is real regardless of keyboard.
- ⚠️ **NOT measured — a hypothesis about typing.** Because `value` is the *parsed* number, a half-typed
  `"12."` has no representation: `String(parseNonNegativeAmount("12.") ?? 0)` is `"12"`. Whether the user
  actually loses the decimal point depends on React Native's controlled-`TextInput` diffing (the prop does
  not change from `"12"` to `"12"`, so native text may not be re-set), and I did not run it. ⛔ **Do not
  write this half into a fix note as fact** — rule IV: a finding that arrives with a mechanism still needs
  measuring, and this one has not been.

**Remedy — UNVERIFIED.** Move this input to the shape the other three already use: hold the raw string in
component state through `sanitizeAmountInput`, and parse once on blur/commit with an explicit branch on
`null` (keep the previous amount, or mark the row skipped) rather than `?? 0`. ⚠️ A minimal `?? 0` → `?? amount`
patch is **not** sufficient — it leaves the parsed number as the `value`, which is the half I could not
measure and would be shipping on a guess.

## C1-7 — `minor` · the confirm button says "You followed the plan" while submitting a surprise outflow the user just typed

**Origin:** `stale-read` (`apps/rn/src/components/payday/PaydayCaptureSheet.tsx`).

**User-facing consequence.** A user who changed nothing about the plan but entered *"Anything unexpected
come out?" → $200* taps a button labelled **"You followed the plan"**, and that tap is what records the
$200 surprise outflow.

**File and line.** `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:486`

```
<Button label={hasAdjustedRequired || extrasAdjusted ? 'Confirm what you paid' : 'You followed the plan'} onPress={handleCapture} />
```

**The measurement.** The label reads two flags — `hasAdjustedRequired` (`:102`, set by `toggleRequired` /
`toggleMarkAllRequired`) and `extrasAdjusted` (`:155-158`, over the `overrides` map). `surpriseAmount`
(`:100`) is in neither. `handleCapture` (`:219-222`) reads it and passes it as `onCapture`'s third argument,
so it is submitted by the same tap.

**Mechanism, as a hypothesis.** The surprise field was added later — `[P6.8.7e.2 · C1]`, and its comment at
`:464-470` says the finding was that *nothing in production ever handed them a `surpriseOutflow`*, i.e. the
work was about wiring the callback. The label's condition is an enumeration of the two things that could
change *before* that field existed, and a third was added without joining it. Same shape as
`PaydayGuardianCard.tsx:240-243`'s round-6 note: an enumerated tail that stopped matching its own members.

**Remedy — VERIFIED as a condition change:** add `|| parseNonNegativeAmount(surpriseAmount) != null` (not
`|| !!surpriseAmount` — a field holding `"$"` or `"."` parses to nothing and submits nothing, so it should
not flip the label either).

## C1-8 — `minor` · `[L1-15]` retired the word "safe" from the deferral heading and left it in three siblings, including the free tier's sales pitch

**Origin:** `stale-read` (`RecoveryPlanSection.tsx`, `PaydayGuardianCard.tsx`).

**User-facing consequence.** A user who is short this paycheck is told the app knows which bills *"can
safely wait"* — a claim about late fees, biller policy and credit reporting that the app has no access to.
`[L1-15]` measured exactly this and changed the heading; the sentences around it still say it, and the
loudest of them is the one shown to the **free** tier, before any caveat exists on screen.

**File and line.**
- `apps/rn/src/components/plan/RecoveryPlanSection.tsx:114` — the FIXED heading: `CAN WAIT IN YOUR PLAN`,
  with `:107-113` recording why: *"'safe' is a claim about consequences it has no access to… a heading that
  needs the disclaimer to be true is a heading that arrives first and wrong."*
- `apps/rn/src/components/plan/RecoveryPlanSection.tsx:152` — the same component, 38 lines below:
  *"Nothing here can **safely wait** this paycheck…"* ⚠️ and this branch renders when `safeToDefer.length === 0`,
  which is the one branch where the `:115-117` biller caveat does **not** render.
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx:261` — the free-tier invite:
  *"Premium builds you a catch-up plan — what to cover first, and what (if anything) can **safely wait**."*
- `apps/rn/src/store/tutorialPath.ts:149` — the walkthrough beat body: *"…what has to be covered now, and
  what can **safely wait**."* (outside my manifest; listed because it is the same string.)

**The measurement.** `grep -rn "safely wait\|SAFE TO DEFER" apps/rn/src packages/core` over the whole tree,
not a directory list. Four user-facing hits + two comments. One of the four was fixed.

**Mechanism, as a hypothesis.** `[L1-15]` was reported against the heading, and the heading is what a
reviewer looking at the Recovery section sees first. The other three are a *caption in the empty branch*, a
*paywall pitch on a different card*, and a *tutorial script in the store layer* — three different files and
three different jobs, sharing only the word. Iterating the member, not the class.

**Remedy — UNVERIFIED.** Replace all three with the wording the heading already settled on ("can wait in
your plan"), and check that the promise and the surface still agree: ⚠️ `sandboxScenarios.ts:108-109` and
`tutorialPath.ts:87-88` record that this exact pair *already* went out of sync once — the beat promised
"what can safely wait" over a card reading "Nothing here can safely wait" — so changing one of these strings
without the other has a measured precedent of breaking the walkthrough.

## C1-9 — `minor` · tapping "Keep essential" silently discards every deferral the user had ticked

**Origin:** `stale-read` (`apps/rn/src/components/plan/RecoveryPlanSection.tsx`).

**User-facing consequence.** On the shortfall recovery plan the user unticks the app's suggestions and ticks
the bills they actually want to move. They then tap **"Keep essential"** on a different row. Every tick they
made is replaced by the app's suggested set, the running gap line and the button count change under them,
and nothing says why.

**File and line.** `apps/rn/src/components/plan/RecoveryPlanSection.tsx:30-35`

```
const itemsKey = plan.safeToDefer.map((i) => i.id).join(',');
const [checked, setChecked] = useState<Set<string>>(() => new Set(plan.suggestedDeferIds));
useEffect(() => {
  setChecked(new Set(plan.suggestedDeferIds));
}, [itemsKey]);
```

**The measurement.** `onKeepEssential(item.id)` (`:135`) marks the obligation essential in the store, which
removes it from `plan.safeToDefer` — `packages/core/recovery/buildRecoveryPlan.ts:64` builds `safeToDefer`
from the classified set, and `recoverySelectors.ts:40` records that a non-deferrable obligation goes to
cover-now. So `itemsKey` changes, the effect fires, and `checked` is **reassigned wholesale** to
`plan.suggestedDeferIds`. Downstream in the same render: `closed` (`:37`), `remaining` (`:38`), `covered`
(`:39`), `count` (`:40`), the gap sentence (`:150-158`) and the button label (`:163`) all move with it.

**Mechanism, as a hypothesis.** The effect's own comment says *"re-seed whenever the plan's deferrable set
changes (e.g. after an apply)"* — apply is the case it was written for, and after an apply the deferred rows
genuinely leave the list so re-seeding is right. **"Keep essential" is the second member of that class and
it is the one where the user's selection is still live.** A predicate that says *"the set changed"* cannot
tell "I just acted on these" from "I just removed an unrelated one".

**Remedy — UNVERIFIED.** Re-seed by *intersection* rather than by replacement: keep `checked ∩ safeToDefer`
and add nothing, so removing a row drops only that row. ⚠️ That changes the after-apply behaviour too (the
applied rows leave the list and the intersection empties, which is the same result) — but it should be
measured on the apply path before shipping, since a partial apply leaves rows behind.

## C1-10 — `blocker` · the Windfall Autopilot itemises where a bonus lands on a plan it knows is missing an obligation — same class as C1-3, second file

**Origin:** `stale-read` (`apps/rn/src/components/plan/WindfallSheet.tsx`).

**User-facing consequence.** A premium user enters a $500 bonus and the sheet says
**"HERE'S HOW THE APP WILL ROUTE $500 — Covers your expenses & essentials first $0 · Extra to your debt
$500"**, then offers **Confirm**. On a store carrying an unread `minimumPayment` or `balance`, the
obligation is not in the allocation, so the `bills` bucket is understated and the `debt` bucket absorbs the
difference: the app itemises, in a checklist with a shield and a check-circle, sending the whole bonus past
a bill it cannot see.

**File and line.** `apps/rn/src/components/plan/WindfallSheet.tsx:99-115` (the routing block) and `:63-68`
(`submit` → `setWindfall(n)`). There is no `mayClaim` / `unreadPlanInputs` anywhere in the file —
`grep -n "mayClaim\|unread" WindfallSheet.tsx` returns nothing.

**The measurement.** `selectWindfallSplit` (`apps/rn/src/store/guardianSelectors.ts:614-639`) is a **diff of
two allocations**:

```
const withAlloc    = selectAllocation({ ...store, windfall: amount });
const withoutAlloc = selectAllocation({ ...store, windfall: 0 });
… bucket.amount = sum(withAlloc, categories) - sum(withoutAlloc, categories)
```

Both runs are over the *same* store, so a debt whose `minimumPayment` repaired to `$0` is absent from both
and contributes `0` to the `bills` bucket. The conservation pass at `:627-632` then attributes the
**absorbed remainder** to `bills` — which is the right rule and is exactly what would have surfaced the
missing obligation *if the engine had known about it*. It cannot, so every dollar that should have gone to
that bill flows to whichever bucket the waterfall reaches next.

⚠️ **One premise I checked and it was fine:** the sheet pre-fills from the existing `current` windfall
(`:47`), and I expected a double-count against a store that already carries it. It does not —
`selectWindfallSplit` overrides `windfall` on both branches (`:616-617`).

**Mechanism, as a hypothesis.** The same one as `C1-3`: the trust routing landed on the three surfaces whose
reported sentence contained a verdict word or a named dollar figure, and this one is a *table*. `C-4`'s
distinction applies and points at suppression, not a caption: the sheet's whole premium value proposition is
*"the app does the work, you confirm"* (`:36-39`), and Confirm **spends** the money.

**Remedy — UNVERIFIED.** Withhold the itemised split when `!mayClaim(store, 'required-plan')` and say why,
in the voice `AffordabilityCard.tsx:232-235` already established. ⚠️ **Keep the Add path working** — the
windfall itself is not a claim, it is a number the user typed, and `:120-121` records that free users get it
routed with no gate at all; suppressing the *addition* would remove a working feature to fix a false
sentence.

### C1-1, addendum (read after `DataRepairsCard.tsx` / `dataRepairsCopy.ts`)

`DataRepairsCard.tsx:23-25` states the reason the card exists in exactly the terms that make C1-1 a defect:
*"**It names the items**, because the user is the only one who knows the real number. A card saying 'some
amounts could not be read' would be technically honest and useless — they cannot tell a repaired balance
from a real one by looking, so **without the names there is nothing they can act on**."*

`repairBlocks` (`dataRepairsCopy.ts:158-167`) renders one line per repair via `describeRepair` —
*"Chase card — the balance"*. That is the only place in the app those names appear on Today. After
`acknowledgeDataRepairs()` the card unmounts (`index.tsx:222`, `:589`) and the three plan-card sentences
that remain are the *"technically honest and useless"* version this file's own docblock rejects — plus a
direction ("above") to the card that just left.

## C1-11 — `minor` · the income-floor card shows a **trending-up** arrow while asking the user to LOWER their floor

**Origin:** `stale-read` (`apps/rn/src/components/plan/LeanSuggestionCard.tsx`).

**User-facing consequence.** On the "lower your floor" nudge — *"Your income has been running closer to
$1,900 lately. **Lower** your floor to match what you can count on"* — the card is headed by an accent
`trending-up` arrow. The glyph is the only thing on the card that reads at a glance, and it says the
opposite of the sentence.

**File and line.** `apps/rn/src/components/plan/LeanSuggestionCard.tsx:33`

```
const up = nudge.direction === 'up';                          // :23 — the direction IS computed
…
<AppIcon name="trending-up" size={20} color={c.accent.primary} />   // :33 — and never used here
```

**The measurement.** `up` is read at `:25` (which `detail` sentence) and at `:31` (the a11y group label —
*"Raise your income floor"* vs *"Adjust your income floor"*). It is **not** read at `:33`. The copy, the
spoken label and the glyph are three renderings of one fact, and two of them branch.

**Mechanism, as a hypothesis.** The card was built for the raise case (`§2.3` income learning, the
"put a little more to work" story), the down direction was added to the copy and the a11y label, and the
icon — which is not a string and so is invisible to any copy review or `lint:money`-style gate — was not on
the list of things to branch. `DataRepairsCard.tsx:86-88` records the identical class one directory over:
*"a two-way `=== 'lost' ? … : …` would have handed it `healing`, the mended-amount icon, which is the
opposite claim."*

**Remedy — VERIFIED as a substitution:** `name={up ? 'trending-up' : 'trending-down'}`. ⚠️ Check the colour
too — `c.accent.primary` on a `trending-down` glyph is fine (this is a *refinement*, not a loss), but do not
reach for `accent.danger`: the card's own docblock (`:17`) says *"calm register (it's a gentle refinement,
not an alarm)"*.

## C1-12 — `minor` · the clear-cycle proof strip reports the match count without the under-warned figure the scorecard says must never be hidden

**Origin:** `stale-read` (`apps/rn/src/components/plan/GuardianProofStrip.tsx`).

**User-facing consequence.** On a clear cycle the Guardian card's footer shows **"Reads matched · 8/10"**.
The two misses are not characterised. If they were **under-warnings** — *"said you'd hold, you dipped below"*
— that is the direction the scorecard's design says is un-spinnable, and the surface the user actually reads
every payday is the one that omits it.

**File and line.**
- `apps/rn/src/components/plan/GuardianProofStrip.tsx:23` —
  `if (pow.score.proven && pow.score.matchRate != null) chips.push(\`Reads matched · ${pow.score.matches}/${pow.score.n}\`);`
- `apps/rn/src/components/plan/GuardianScorecard.tsx:14` — the rule: *"shows false-clear ('Under-warned') and
  false-tight ('Over-cautious') **SEPARATELY (never one blended %)**"*
- `GuardianScorecard.tsx:15-16` — *"a bad-record line **OWNS the un-spinnable direction** (false-clear:
  'I've under-warned')"*, rendered at `:57-62`/`:82-84`.

**The measurement.** `pow.score` is the same `CalibrationScore` the scorecard receives — it carries
`falseClears` and `falseTights` (`GuardianScorecard.tsx:78-79`). The strip reads three fields of it
(`proven`, `matchRate`, `matches`, `n`) and neither error field. The strip renders under
`isPremium && !stale && brief.state === 'clear' && proofOfWork`
(`PaydayGuardianCard.tsx:244`, `:559`) — the clear cycle, which is the cycle an under-warning is about.

⚠️ **The narrower reading, stated honestly:** `8/10` is a *fraction*, not the *blended percentage* the
scorecard's rule literally forbids, and the adjacent *"See your forecast →"* link does open the full
scorecard (`GuardianProofStrip.tsx:15` says so). So this is the softer version of the defect, not the
defect the rule names. I am reporting it because the rule's stated *reason* — do not let one number hide a
false-clear — applies unchanged, and the strip is the higher-traffic surface.

**Remedy — UNVERIFIED, and it may be a product call rather than a bug.** Either suppress the chip while
`score.falseClears > 0` (leaving the streak and to-debt chips), or append the direction
(*"Reads matched · 8/10 · 2 under-warned"*). ⛔ Do **not** switch it to a percentage — that is the shape
`GuardianScorecard.tsx:14` explicitly rules out.

## C1-13 — `minor` · a hard-coded `rgba(37,99,235,0.06)` focus tint on the Recommended card cannot follow the theme

**Origin:** `stale-read` (`apps/rn/src/components/plan/RecommendedActionsCard.tsx`).

**File and line.** `apps/rn/src/components/plan/RecommendedActionsCard.tsx:100` —
`focus ? { backgroundColor: 'rgba(37,99,235,0.06)' } : null`, applied to the first (focus) row.

**The measurement.** Every other colour in the file resolves through `useAppColors()` (`:95`, `:101`,
`:105`, `:113`). This literal is the light-theme accent blue at 6%; in dark it is a blue wash over
`Card tone="accent"`'s dark surface rather than the intended lift. `SpokenForSheet.tsx:310` records the same
class with the measurement already done for a sibling: *"it was `'#fff'`, which is 5.80:1 in light and
**2.72:1 in dark**… A literal cannot flip with the theme."*

**Mechanism, as a hypothesis.** A focus tint is a *background*, not text, so it fails no contrast gate and
no `lint` rule in this repo appears to look for raw `rgba(` in a StyleSheet — I did not find one, and did
not run any lint (constraint).

**Remedy — UNVERIFIED:** move it to a theme token beside the other `accentSoft`-family values. ⚠️ It is not
simply `c.accent.accentSoft` — that token is used at full strength for chips
(`PaydayGuardianCard.tsx:320`), and this row wants a 6% wash; substituting the chip token would visibly
change the card.

## C1-14 — `minor` · the affordability bar's two figures are hidden from VoiceOver, and on the `short` verdict the card's sentence does not carry either of them

**Origin:** `stale-read` (`apps/rn/src/components/plan/AffordabilityImpactBar.tsx`).

**User-facing consequence.** A VoiceOver user asks whether they can afford a $650 purchase and is told
*"Not this paycheck — you'd come up about $150 short."* The bar beside it says **"$0 left"** and
**"your $200 line"**; neither reaches the accessibility tree, so the user never learns where the purchase
would leave them, only how far short the purchase itself is.

**File and line.** `apps/rn/src/components/plan/AffordabilityImpactBar.tsx:52` —
`<View style={styles.wrap} {...decorative}>` wraps **both** the track and the labels (`:58-65`), so
`formatWhole(after)` and `formatWhole(floor)` are inside the hidden subtree.

**The measurement.** `decorative` is `{ 'aria-hidden': true }` (`apps/rn/src/utils/a11y.ts:53`), and
`:33-36` confirms it hides on **every** platform (RN expands `aria-hidden` to
`accessibilityElementsHidden` + `importantForAccessibility`). So the docblock's premise at `:19` — *"The
card's textual read stays as the a11y source"* — is the load-bearing claim. Checked against the three
verdict sentences at `AffordabilityCard.tsx:156-163`:

| verdict | `verdictLine` | carries `after`? | carries `floor`? |
|---|---|---|---|
| `comfortable` | *"Yes — you'd still hold about {cushionAfter}."* | ✅ | n/a (it clears) |
| `tight` | *"…you'd dip to about {cushionAfter}, below your {floor} line."* | ✅ | ✅ |
| **`short`** | *"Not this paycheck — you'd come up about **{shortBy}** short."* | ❌ | ❌ |

The bar renders on all three (`AffordabilityCard.tsx:248` for `short`, `:259` for the other two).

**Mechanism, as a hypothesis.** The `decorative` decision was made once for the component, and the
"textual read is the a11y source" check was done against the branch the bar was designed for (a cushion
carving toward the line — `comfortable`/`tight`). `short` renders the same bar with a *different* sentence
beside it, and that sentence is about the purchase rather than about the cushion. Judge the condition the
consumer evaluates, not the example beside it.

⚠️ **This is the class `PaydayGuardianCard.tsx:289-294` already closed once**, in its own words: *"the
cushion bar and its legend are both `decorative` — correctly, since a swatch-keyed legend is a visual index
into a canvas — but that left the held-reserve, cushion and to-debt figures existing NOWHERE in the
accessibility tree."* The remedy there was to put the figures in the card's group label. The same remedy was
not applied to this bar.

**Remedy — UNVERIFIED.** Do not un-decorate the bar (the labels are a visual index into a canvas, exactly as
the Guardian's legend is). Extend the `short` sentence, or add the two figures to the card's read, the way
`PaydayGuardianCard.tsx:295-302` does. ⚠️ Whatever is added must be part of what
`useLiveAnnouncement` speaks — see `C1-2`; adding it to a static label alone would not be announced when the
user types.

## C1-15 — `blocker` · the Cash Runway receipt understates "Expenses & essentials" by exactly the top-up the user just made — on the screen and the store `D2-1` measured

**Origin:** `stale-read` (`apps/rn/src/components/plan/CashRunwayChart.tsx`).

**User-facing consequence.** After taking the Guardian's *"Move $50 from your emergency fund"* one-tap, the
user opens **See your forecast →**. The receipt for **"This paycheck"** reads:

```
Income                   +$2,000
Expenses & essentials    −$1,800      ← their rent is $1,850
Left after essentials      $200
```

The three numbers reconcile (`2000 − 1800 = 200`) because the middle one is **derived by subtraction from
the value it is supposed to explain**. The one line that names what the user's money is going out on is
$50 low, and it is low by precisely the amount they moved out of their emergency fund.

**File and line.** `apps/rn/src/components/plan/CashRunwayChart.tsx:100-102`

```
const income     = cy.paycheckAmount;
const essentials = Math.max(0, cy.paycheckAmount - cy.net);   // ← derived, not read
const room       = cy.net;
```
rendered at `:207-216` (`Income` / `Expenses & essentials` / `Left after essentials`).

**The measurement.** One store, one variable — whether the top-up has been applied.
`packages/core/timeline/buildMultiCycleTimeline.ts`:

```
:344  function cycleNet(r) { return r.paycheckAmount - r.totalRequired - r.livingExpenseReserve; }
:146  const cycle0Net = cycleNet(result) + Math.max(0, appliedTopUpSurplus);
:153  paycheckAmount: result.paycheckAmount,      // ← does NOT include the surplus
```

So for cycle 0:

`paycheckAmount − net  =  totalRequired + livingExpenseReserve − appliedTopUpSurplus`

| | `appliedTopUpSurplus` | `cy.net` | `essentials` rendered | true required + living |
|---|---|---|---|---|
| before the tap | 0 | 150 | **$1,850** ✅ | 1,850 |
| after the tap | 50 | 200 | **$1,800** ⛔ | 1,850 |

Figures are `D2-1`'s own, quoted from `buildMultiCycleTimeline.ts:78-84`: *"premium, $2,000, rent $1,850…
the card turned **Clear** after its own one-tap offer, and its 'See forecast' button opened this timeline on
cycle 0."* **That is this screen, reached by this button, on this store.**

⚠️ **Only cycle 0 is affected** — projected cycles use `projNet = cycleNet(projResult)` with no surplus
(`:221`), and `:86-88` says the omission there is deliberate. Cycle 0 is also the default selection whenever
nothing is under the line (`CashRunwayChart.tsx:60-61`), and it is the one labelled **"This paycheck"**
(`:202`).

⚠️ **The clamp is what hides the extreme case.** `Math.max(0, …)` at `:101` means that if the surplus ever
exceeded required + living, the receipt would print `−$0` and stop adding up rather than showing a negative.
I did not find a path that reaches it (a top-up is sized to `floor − cushion`), so I am reporting the clamp
as a *concealer* of this defect, **not** as a defect I measured.

**Mechanism, as a hypothesis.** `D2-1` correctly folded the top-up into `net`, because `net` is what the
*band* is computed from and the money genuinely is in checking. This consumer never read `net` as "headroom"
— it reads it as the third term of an accounting identity and back-solves the second. One field acquired a
second meaning and a downstream subtraction inherited it. ⚡ This is the two-producer disagreement visible
from the side that did not move: `buildMultiCycleTimeline` changed, `CashRunwayChart` did not, and the
symptom appears in `CashRunwayChart`.

**Remedy — UNVERIFIED.** `essentials` must be **read**, not derived: `TimelineCycle` already has
`paycheckAmount` and the allocation behind it has `totalRequired` and `livingExpenseReserve`, so carry an
explicit `essentials` (or `requiredPlusLiving`) field on `TimelineCycle` and render that. ⚠️ **Then the three
rows will no longer sum**, by exactly the surplus — which is correct and must be *stated*, not hidden: the
receipt needs a fourth line naming the moved cash (*"+ $50 moved from Emergency fund"*), or the `Income` row
must say it includes it. ⛔ Do **not** fix this by removing the surplus from `net` — that re-opens `D2-1`,
whose whole finding was that the card and this timeline disagreed about the band.

## C1-16 — `minor` · "This paycheck didn't arrive" commits on toggle while every other field on the same sheet waits for Save

**Origin:** `stale-read` (`apps/rn/src/components/plan/PaycheckSheet.tsx`).

**User-facing consequence.** The paycheck sheet is a form with a **"Save paycheck"** button. One control on
it — the switch that declares a missed paycheck — writes to the store the instant it is flipped. Flipping
it pauses the Guardian's extra payoff and reframes the whole Today read; closing the sheet without saving
does **not** undo it, and nothing on screen says the change already landed.

**File and line.** `apps/rn/src/components/plan/PaycheckSheet.tsx:157-163`

```
<SwitchRow
  label="This paycheck didn’t arrive"
  value={missed}
  onValueChange={(v) => (v ? store_.getState().declareMissedPaycheck() : store_.getState().undoMissedPaycheck())}
/>
```

**The measurement.** Every other field is staged in component state and committed once, in `submit()`
(`:50-82`): `amount` (`:32`), `payCycle` (`:33`), `firstDay`/`secondDay`/`payDay` (`:34-36`), `varies`
(`:42`), `lean` (`:43`). `submit` calls `updatePaycheck(...)` then `onClose()`. This switch reads
`selectPaycheckMissed(s.store)` live (`:30`) and writes on change — no staging, no dependence on `submit`.
The consequence is named by `guardianSelectors.ts:867` — `pausedDeploy: selectPaycheckMissed(store)` — and
by `buildGuardianBrief.ts:237-242`, which swaps the card's whole title to *"A paycheck didn't land"* and
pauses extra payoff.

**Mechanism, as a hypothesis.** The switch is a *declaration about this cycle* rather than a *field of the
paycheck record*, and it has its own store actions, so it was wired to them directly. That is defensible as
a model choice; what makes it a defect is that it is rendered inside a `FormSheet` with a submit button —
the affordance whose whole meaning is that nothing is committed yet.

**Remedy — UNVERIFIED, and it may be a product call.** Either stage it like every sibling and apply it in
`submit`, or keep the immediate write and make it visibly not part of the form (its own section, outside
the submit group, with the effect stated). ⚠️ Do not simply move it into `submit`: the sheet is reachable
from the `no-paycheck` `PromptCard` (`index.tsx:296-304`), where a user may open it, flip this, and close
via the backdrop — staging would then silently discard a declaration they meant to make.

## C1-17 — `minor` · the BNPL month subtotal at the horizon boundary states a partial month as the month's total

**Origin:** `stale-read` (`apps/rn/src/components/money/BnplCalendarSection.tsx`).

**User-facing consequence.** The last month shown in the BNPL calendar reads e.g. **"February 2027 · $78.86
· 1 payment"** when February actually holds two installments. The month header is a subtotal *for a month*,
and the boundary month's rows are cut mid-month by a rolling day-of-month cutoff.

**File and line.** `apps/rn/src/components/money/BnplCalendarSection.tsx:96-104`

```
const cutoff = addMonths(currentDate, HORIZON_MONTHS);   // :96 — a DAY, not a month boundary
const within = listed.filter((e) => e.date < cutoff);    // :102
const groups = groupByMonth(within);                     // :104 — grouped AFTER the cut
```

and the header at `:113-115`: `{formatCurrency(g.subtotal)} · {g.entries.length} payments`, where
`g.subtotal` is summed in `groupByMonth` (`:53`) over `within` only.

**The measurement.** `currentDate = 2026-08-15` gives `cutoff = addMonthsISO(..., 6) = 2027-02-15`. A
biweekly plan with installments on `2027-02-03` and `2027-02-17`: the 3rd is in `within`, the 17th is not.
The `February 2027` group therefore reports **1 payment** and the 3rd's amount alone. The `+ N more
installments beyond 6 months` line (`:131-135`) is separately accurate — the 17th *is* beyond six months
from the 15th — so nothing on screen contradicts anything; the month header is simply describing a set
whose edge the user cannot see.

**Mechanism, as a hypothesis.** The horizon is a *duration* and the grouping is *calendar months*; they are
composed cut-then-group, so the last group inherits the cut. Same class as this file's own `[C-6]` header —
*"Nothing here is arithmetically false; the COMPLETENESS is"* (`:72-73`) — arriving through the horizon door
rather than the unread-field door.

**Remedy — UNVERIFIED.** Round the cutoff to a month boundary so no group is ever partial, **or** mark the
boundary group (*"February 2027 · $78.86 · 1 payment shown"*). ⚠️ The first changes what `moreCount` counts
and makes `beyond ${HORIZON_MONTHS} months` inexact; the second is smaller and leaves both existing
sentences true.

## C1-18 — `minor` · `RESERVE_OPACITY` is declared twice, in two files, and one of them documents that it must match the other

**Origin:** `stale-read` (`PaydayGuardianCard.tsx`, `CushionBarChart.tsx`).

**User-facing consequence (if it drifts).** The Guardian card's "Safety net" legend swatch and the tinted
reserve zone of the bar it keys into would render at different opacities, breaking the swatch-to-zone
mapping that is the legend's entire function.

**File and line.**
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx:25-28` — `const RESERVE_OPACITY = 0.5;` with the
  comment *"The safety-net swatch **matches the bar's tinted reserve zone** (cushion color at this
  opacity)."*
- `apps/rn/src/components/plan/CushionBarChart.tsx:7-9` — `const RESERVE_OPACITY = 0.5;`

**The measurement.** Both are `0.5` today, both are module-private consts, neither imports the other, and
the card's comment asserts an equality no compiler can check. Consumed at `PaydayGuardianCard.tsx:621`
(the legend dot) and `CushionBarChart.tsx:73` (the Skia rect).

**Mechanism, as a hypothesis.** The bar and its legend live in different files because the chart must stay
hook-free to lazy-load under `WithSkiaWeb` (`CushionBarCanvas.web.tsx:12`), and the constant was duplicated
rather than exported to keep that boundary clean. ⚠️ **This is currently correct** — I am reporting a drift
hazard the code itself names, not a live defect.

**Remedy — UNVERIFIED.** Export it from `CushionBarChart.tsx` and import it in the card, **or** move it to
`@/theme`. ⚠️ Check the web path before choosing the first: the card must not end up statically importing
the chart module and defeating the lazy CanvasKit load, which is the reason the two files are separate at
all.

## C1-19 — `minor` · the capture build's auto-confirm marks itself fired before it fires, so any re-render inside the 2-second window cancels it permanently

**Origin:** `stale-read` (`apps/rn/src/components/plan/useCaptureAutoConfirm.ts`).

**User-facing consequence.** In a `CAPTURE_DEMO` build — the one that records the App Preview — the closing
beat's *"Confirm — it's paid off"* may never be pressed, so the finale never plays and the asset ships
without the moment it exists to show. That is the exact failure the hook's own docblock (`:25-28`) says it
was written to fix.

**File and line.** `apps/rn/src/components/plan/useCaptureAutoConfirm.ts:63-69`

```
useEffect(() => {
  if (!CAPTURE_DEMO || !active || fired.current) return;
  if (stage !== finalStage || debt === undefined) return;
  fired.current = true;                                       // <- set at SCHEDULE time
  const t = setTimeout(() => confirmRef.current(debt), 2000);
  return () => clearTimeout(t);                               // <- cleanup cancels it
}, [active, stage, finalStage, debt]);
```

**The measurement — from the source, and this half is certain.** `fired.current` is assigned before the
timer resolves, and the cleanup cancels the timer on any dependency change. So if the effect re-runs at any
point inside the 2000 ms window, the cleanup clears the pending timer and the re-run returns early at
`fired.current` — **the confirm is cancelled and never rescheduled.** The guard's stated intent (`:52-54`,
*"Once per run"*) is satisfied; the action is lost along with it.

**⚠️ The reachability is a HYPOTHESIS and I did not measure it.** `debt` is `provisionalPayoffs[0]`
(`index.tsx:207`), and `selectProvisionalPayoffs` returns `store.debts.filter(...)`
(`balanceSelectors.ts:115-119`) — the elements are the store's own `Debt` objects, so the reference is
stable **unless `store.debts` is rebuilt**. Whether the demo script rebuilds it during the closing beat's
two seconds is something I would have to run the demo to know, and running it is outside this pass. ⛔ Do
not report "the App Preview is broken" on the strength of this; report that the guard has a
cancel-without-reschedule window.

**Remedy — UNVERIFIED.** Set `fired.current = true` **inside** the timeout callback, and take `debt` out of
the dependency array in favour of a ref — the hook already does exactly this for `confirm` at `:56-59`, for
the identical reason, and its comment states the rule. ⚠️ Moving the flag alone is not enough: without the
dep change a re-render still cancels the timer, it just reschedules and pushes the confirm later than
`CONFIRM_AFTER_MS`, which `:15-18` says the cut's timing is already tight against.

## C1-20 — `minor` · "ready by" counts paychecks from **today** instead of from the next payday, so the date is wrong by however far into the cycle the user is

**Origin:** `stale-read` (`apps/rn/src/components/plan/SaveForItSheet.tsx`, and the identical copy in
`guardianSelectors.ts`).

**User-facing consequence.** The Save-for-it sign-off sheet — the one whose docblock says *"No path
promises a date the engine won't keep"* (`:43`) — labels each option **"4 paychecks · ready by Dec 12"**.
The date is computed as `currentDate + n × cycleLength`, but the n-th paycheck lands at
`nextPaycheckDate + (n−1) × cycleLength`. The two differ by how far into the current cycle the user is
opening the sheet, which is **0 to 29 days** for a monthly payer.

**File and line.** Two byte-identical private copies of one helper:
- `apps/rn/src/components/plan/SaveForItSheet.tsx:24-29` (used for the **custom** pace, `:79`)
- `apps/rn/src/store/guardianSelectors.ts:698-703` (used for **fast** and **balanced**, `:734`, `:740`)

```
function addPaychecks(iso, payCycle, n) {
  const days = payCycle === 'weekly' ? 7 : payCycle === 'biweekly' ? 14 : payCycle === 'semimonthly' ? 15 : 30;
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + days * n);
  return toLocalISODate(d);
}
```
called as `addPaychecks(store.paycheck.currentDate, ...)` at `SaveForItSheet.tsx:79` and
`addPaychecks(today, ...)` at `guardianSelectors.ts:727`/`:734`/`:740`, where `today` is
`store.paycheck.currentDate`.

**The measurement — two independent errors, running in opposite directions.**

1. **The origin.** Monthly payer, cycle starts day 0, `currentDate` = day 20, `nextPaycheckDate` = day 30,
   `n = 4`.
   - rendered: `20 + 4 × 30` = **day 140**
   - true (the 4th paycheck): `30 + 3 × 30` = **day 120**
   - **20 days late.** The error is exactly `currentDate − cycleStart`, so it is 0 only when the sheet is
     opened on payday itself. `store.paycheck.nextPaycheckDate` — the field `PlanHero.tsx:161` renders as
     *"THIS PAYCHECK · Sep 14"* — is not read here.
2. **The cadence approximation.** `30` for monthly and `15` for semimonthly are not month lengths.
   24 semimonthly paychecks = 12 calendar months = 365 days; this yields `24 × 15 = 360`. **5 days early
   per year**, growing with `n`. Meanwhile the app owns a real cadence engine —
   `@core/payCycle/getNextPaycheckDate`, used by `PaycheckSheet.tsx:48` via `nextPaycheckFrom`, and
   `payCyclesPerMonth`, used by `planSelectors.ts:118` — and neither is consulted.

⚠️ Error 1 dominates for small `n` and runs **late** (under-promising, the safe direction); error 2 grows
with `n` and runs **early**. They partially cancel, which is presumably why neither has been noticed.

⚠️ **One premise I checked and it held.** I expected the sheet's custom path and the selector's fast/balanced
paths to disagree, since each has its own copy of the helper. They do not — the two functions are byte
identical today. **The duplication is a live drift hazard, not a live disagreement**, and it is the same
shape as `C1-18`.

**Mechanism, as a hypothesis.** "Ready by" is presentation arithmetic, and it was written where it was
needed rather than asked of the module that owns pay cadence. The `currentDate` origin looks correct in the
case the author would naturally have had in mind — the sheet reached on payday, straight off the Guardian
card, where the two formulations coincide exactly.

**Remedy — UNVERIFIED.** Delete both copies and route through the pay-cycle module, anchored on
`nextPaycheckDate` rather than `currentDate`. ⚠️ Do **not** patch only the origin: fixing error 1 alone
removes the cancellation and makes the long-horizon dates read *earlier* than today, which is the
over-promise direction the sheet's docblock rules out. Both halves move together or neither does.

## C1-21 — `minor` · `FIELD_LABEL`'s docblock claims the compiler gates it. `Record<string, string>` gates nothing; a runtime test does the work

**Origin:** `fix-churn` (`apps/rn/src/components/plan/dataRepairsCopy.ts`) · `stale-read`
(`dataRepairsCopy.test.ts`).

**User-facing consequence (if the claim is believed).** A new repairable money field added to
`migrations.ts` without a `FIELD_LABEL` entry prints its **schema key** to the user — *"Chase —
minimumPayment"* — which is `S1.9.7 / C-m1` verbatim. The docblock tells the next author the compiler will
stop them. It will not.

**File and line.** `apps/rn/src/components/plan/dataRepairsCopy.ts:37-42`

```
 * ⚠️ **A map, and it is EXHAUSTIVE over what `migrations.ts` can repair** — the same compiler-as-gate move
 * `ENTITY_NOUN` above earned at P6.8.9.7.2 … **A new repairable field must be named for the user or it
 * does not compile.**
 */
export const FIELD_LABEL: Record<string, string> = { … };
```

**The measurement.** Compare the two maps in the same file:

| | declared type | does the compiler gate it? |
|---|---|---|
| `ENTITY_NOUN` (`:24`) | `Record<Exclude<DataRepair['entity'], 'migration'>, string>` | **yes** — a missing key is a type error, which is what `:19-22` records happening when `goal` was added |
| `FIELD_LABEL` (`:42`) | `Record<string, string>` | **no** — every key set satisfies it, including the empty one |

The exhaustiveness is enforced instead by `dataRepairsCopy.test.ts:194-207`, at runtime:
`for (const f of repairable) assert(!!FIELD_LABEL[f], …)` plus the reverse staleness loop at `:204-206`.
That suite **is** wired in — `apps/rn/src/testing/runAppTests.ts:80` imports and calls it — so the property
is genuinely guarded today. ⚠️ **Nothing is unprotected; the stated mechanism is simply not the one
protecting it**, and the consumers fall back silently when it fails: `describeRepair` uses
`FIELD_LABEL[repair.field] ?? repair.field` (`:98`) and `unreadRowCaption` uses `FIELD_LABEL[f] ?? f`
(`:79`).

**Mechanism, as a hypothesis.** The paragraph was written by analogy to `ENTITY_NOUN` immediately above it —
the analogy is drawn explicitly in the text — and the analogy does not hold, because entities are a closed
union in `DataRepair` while repairable field names are strings assembled from
`REPAIRABLE_MONEY_FIELDS`'s per-entity lists. The comment describes the fix the author reached for, not the
one that landed.

**Remedy — UNVERIFIED, and there are two directions.** Either (a) correct the comment to say the **test** is
the gate, naming it — cheapest, and honest; or (b) make the claim true by deriving the key type from
`REPAIRABLE_MONEY_FIELDS` (e.g. a union of its list members) so the record really is exhaustive, and keep
the test for the reverse staleness check the compiler still cannot do. ⚠️ (b) touches `migrations.ts`'s
declaration shape; `scripts/finding-guards.json:760` records that pass-4 already hit collateral damage
around `dataRepairsCopy.test.ts:199`'s hard-coded count (**and that the same count is duplicated in
`trustSelectors.test.ts` with an identical message**), so changing this area reds two suites at once and the
attribution gets hard.

---

## Lane C1 — the round, split by origin

**Coverage: 51 of 51 manifest files read** (`READ-C1.txt`, verified with `comm` against `ROUTING-C1.txt` —
no file listed that is not in the manifest, no manifest file unread, every path tracked by git).

| severity | n |
|---|---|
| `blocker` | **4** — C1-3, C1-4, C1-10, C1-15 |
| `major` | **2** — C1-1, C1-6 |
| `minor` | **15** |

| origin | files in manifest | findings |
|---|---|---|
| `stale-read` | 40 | **21** |
| `neighbour` | 10 | **0** |
| `fix-churn` | 1 (`dataRepairsCopy.ts`) | 1 (C1-21, shared with a `stale-read` file) |

⚠️ **The `neighbour` bucket produced nothing, and that is a result rather than an omission.** All ten
(`CoachMarkLayer`, the four `Demo*`, the three `Tutorial*`, `MeshGradientCanvas`, `tutorialStage`) were read
in full. `CoachMarkLayer.tsx` in particular carries eight prior findings' worth of correction and I could
not falsify any of them — I specifically checked whether `calloutOnScreen` (`:450-452`) is a check that
cannot fail, and it is not: the above-branch clamp guarantees the first conjunct, but the second genuinely
rejects the sheet-transient rect the docblock cites.

### The class that keeps recurring on this surface

**Four of the twenty-one are one class: a trust guard reached the card whose sentence was reported, and
stopped.** `mayClaim(store, 'required-plan')` is wired into exactly three places in the app
(`index.tsx:364`, `:540`, `AffordabilityCard.tsx:154`). It is **not** wired into `PlanHero` — the first card
on Today, which states a status word and a debt-free **date** (C1-3) — nor into `WindfallSheet`, which
itemises where a bonus lands and offers a Confirm that spends it (C1-10). Both were read against the same
poisoned store the fixed cards refuse on. `C1-4` and `C1-15` are the same shape one layer down: a figure was
corrected in `RequiredActionsCard` / for the Guardian band, and a sibling consuming the identical data
(`PaydayCaptureSheet`, `CashRunwayChart`) was never visited.

### Premises I checked that turned out to be FALSE (recorded so nobody re-runs them)

- **`AffordabilityCard` reads the real store and writes the sandbox.** No — `useAppStore` resolves through
  `StoreContext` (`useAppStore.ts:18`), so both sides are the active store.
- **`displayCushion` can go negative and print "-$50" labelled Cushion.** No — `heldReserve` is clamped to
  `kept` at `buildGuardianBrief.ts:183`.
- **"Set it again above" points at nothing because the repairs card is at `index.tsx:590`.** Half wrong —
  the ack slot renders above `{content}` (`:737`), so the direction is right *while the card is up*. The
  defect is what survives the ack (C1-1).
- **`FloorImpactBar`'s else-branch prints a negative "more held back".** No — `freed = Math.max(0, before −
  after)` at `index.tsx:928`, so the branches partition on sign.
- **`decorative` is web-only, so the cushion figures double-speak on iOS.** No — `a11y.ts:33-36` records
  that RN expands `aria-hidden` itself.
- **`selectWindfallSplit` double-counts an existing windfall when the sheet pre-fills.** No — it overrides
  `windfall` on both diff branches (`guardianSelectors.ts:616-617`).
- **`CashRunwayChart`'s "I'm setting aside $X" is a recommendation stated as an action.** No —
  `prefundedReserve` is genuinely injected into `allocatePaycheck` (`selectors.ts:80`).
- **The celebration surfaces state paid-off figures over unread balances.** No — `selectCelebration`
  (`celebrationSelectors.ts:156-167`) gates the finale portfolio-wide and the beat per-row, and
  `PaidOffBeat`'s `amountPaidOff` is already `null` when `originalBalance` was lost.
- **`SaveForItSheet`'s custom "ready by" disagrees with the selector's.** No — the two `addPaychecks`
  helpers are byte identical. They are both wrong the same way instead (C1-20).
