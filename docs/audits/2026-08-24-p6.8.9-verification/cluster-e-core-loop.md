# P6.8.9.2 — independent verification, cluster **e (THE CORE LOOP)**

> Verifier did not build any of these fixes. Target branch `v1.7-dev`, working tree at `8e4540a`
> (+ one unrelated modification to `apps/rn/tests/shots/p6.8-matrix.shot.ts`).
> Finding text: `docs/audits/2026-08-21-p6.8-finish/SYNTHESIS.md` + `refutations/R3-journey.md`.
> Log account: `docs/DEBT_ELEVATION_LOG.md:98-292`.
>
> ⚠️ **Note on the brief:** `BRIEF.md` does not exist at the path I was given. The only copy in the tree is
> `docs/audits/2026-08-21-p6.8-finish/docs/audits/2026-08-24-p6.8.9-verification/BRIEF.md` — an untracked
> nested duplicate written from the wrong cwd (`git status` shows `?? docs/audits/2026-08-21-p6.8-finish/docs/`).
> I read that copy and followed it. **The verification folder at the intended path did not exist until this file.**

---

## B2 — the celebration a free user could never see

**VERDICT: `CLOSED`**

### 1 · Is the observation closed?

**Yes.** The finding's observation — *`PaidOffBeat`/`PaidOffFinale` render only from `celebration`, set only
by `confirmPayoff` ← `PayoffInvitationCard` ← `selectProvisionalPayoffs`, which returns `[]` for free* — no
longer describes the code.

- The overlay state is no longer component state: `apps/rn/src/app/(tabs)/index.tsx:191` —
  `const celebration: Celebration | null = store.pendingPayoff;` — **read, never set** on this screen.
  (Before: `git show a9ff1fc -- 'apps/rn/src/app/(tabs)/index.tsx'` shows the deleted
  `const [celebration, setCelebration] = useState<Celebration | null>(null)`.)
- The payload is stamped by the store transform that moved the balance:
  `apps/rn/src/store/store.ts:43-47` `withPayoffCelebration(before, next)` → `apps/rn/src/store/payoffCelebration.ts:22-57`
  `detectPayoff`.
- It is wrapped around **all four** balance-moving actions, verified individually:
  `store.ts:409` (`updateDebt`, balance edit), `store.ts:418` (`verifyDebtBalance`), `store.ts:432`
  (`verifyDebtBalances`, the batch), `store.ts:600` (`logManualPayment`).
- **The tier line is genuinely untouched**, which is the correct outcome, not a shortfall:
  `index.tsx:183` still calls `selectProvisionalPayoffs(store, isPremium)` and
  `store/balanceSelectors.ts:112-116` still returns `[]` for free. The free user reaches the moment through
  `logManualPayment`, not through the estimator.

**The line that now produces the correct behaviour for a free user:** `store.ts:600` — `logManualPayment`
routed through `withPayoffCelebration`, with the render at `index.tsx:542-554`.

### 2 · What the site ALSO did — and does it still?

The site (`confirmPayoff` at old `index.tsx:184`) did **three** things beyond "set a flag":

| property it had | still present? | proof |
|---|---|---|
| **beat-vs-finale decided on what remains live** (`isLastLiveDebt(store.debts, d.id)`) | ✅ | `payoffCelebration.ts:44-46` decides on `after.filter(balance > 0).length === 0`, which is strictly more correct on a batch. Pinned: `payoffCelebration.test.ts:63` and `:110` (*"clearing the last two at once is ONE finale"*). |
| **the payload captured from the BEFORE state** — `d.originalBalance`, `d.minimumPayment`, and the next-ranked debt computed on the pre-clear array | ✅ | `payoffCelebration.ts:27` takes `before` explicitly; `:50-56` reads `subject.originalBalance` / `subject.minimumPayment` and ranks `liveAfter`. Pinned to the exact figures at `payoffCelebration.test.ts:50-54` (`amount 1200`, `freed 75`, `nextDebtName 'Debt b'`) and the null case at `:120`. **This is the property most likely to have been lost in the move, and it is the one the test file spends the most asserts on.** |
| **`verifyDebtBalance(id, 0, currentDate)` — the confirmed-$0 re-anchor** | ✅ | `index.tsx:195` still calls it; `confirmPayoff` is now that call and nothing else. |
| **the premium invitation still fires the beat** | ✅ | `celebration.spec.ts:40-63` — the four pre-existing premium tests (`per-debt beat`, `grand finale`, both themes) drive the real `Confirm … paid off` button. They pass only if the premium path still reaches the overlay through the *new* mechanism, since the old one is deleted. |
| **`useCaptureAutoConfirm` (the CAPTURE_DEMO App-Preview build) still produces a celebration** | ✅ | `index.tsx:199` unchanged, and it feeds `confirmPayoff`, which still reaches the crossing. |
| **the overlay's rank in the Today ack ordering** | ✅ | `index.tsx:232-282` — `dataRepairs` still outranks it (`:232`), and it still suppresses the ack slot (`:259`). |
| **old blobs must hydrate** (the field is now persisted) | ✅ | `data/migrations.ts:165-166` returns `{ ...base, ...r }` with `base = createDefaultStore()` (`:129`), and `data/defaults.ts:49` seeds `pendingPayoff: null` — so a pre-fix blob gets `null`, exactly as `pendingMilestone` (`defaults.ts:46`) already did. No `storeVersion` bump is needed and none was taken. |

**One property is NEW rather than preserved, and it is pinned:** persistence across a reload —
`celebration.spec.ts:214-233` asserts the beat survives `page.reload()` and stays gone after
`acknowledgePayoff`.

### 3 · Was the implied remedy right?

**No — and the builder caught it.** B2 as written (*"free users can never see the celebration"*) implies
*remove the tier gate*. `store/balanceSelectors.ts:112-116` is still `if (!isPremium) return []`, and that
is correct: removing it would have given away the premium estimator **and** still left every non-estimator
path (a typed balance, a logged payment, a batch re-verify) silent. The real cause was the **event**, not
the tier. This is the finding's stated mechanism being wrong while the observation held — the case my
assignment flagged — and the shipped fix addresses the real cause.

**Would the tests have failed on the original defect?** Yes, decisively:
`celebration.spec.ts:183` (free user, two debts, clears one by logging a payment → expects `Keep going`)
and `:200` (free, last debt → expects `Continue`) are unreachable under the old wiring, because
`selectProvisionalPayoffs` returns `[]` and nothing else could set `celebration`. And `:193` asserts the
invitation is **absent** first, so the spec cannot pass by quietly making a paid feature free.
⚠️ These two seed `debts: [...]` with real balances — **not** the `debts: []` zero-state my brief warns about.

### ⚠️ Residual, unpinned (not a regression — a gap in the new mechanism)

`store.ts:44` — `if (next.pendingPayoff) return next;` — an unacknowledged pending beat **swallows a later
crossing**. Reachable: clear the second-to-last debt from Money (`money.tsx:516` `verifyDebtBalance`, or
`debt-log-payment`), then clear the last one, without ever visiting Today. `pendingPayoff` still holds the
beat, so the **once-ever finale never fires and can never be recovered** — nothing re-derives it, and
`acknowledgePayoff` (`store.ts:724`) just nulls the field. `payoffCelebration.ts:38-40`'s comment claims
*"the second crossing will still be there in `debts` for the finale check"*; **there is no such later
check** — the code and its own comment disagree. On Today this cannot happen (`PaidOffBeat` is a `Modal`,
`PaidOffBeat.tsx:104`), which is why it is a new-path edge rather than a regression: under the old wiring
the free user got nothing at all here. **No test covers two crossings in separate actions** —
`payoffCelebration.test.ts` only covers two crossings in *one* action (`:110`), and `withPayoffCelebration`'s
early-return has no unit test at all.

---

## C1 — the absorb path has no user entry point

**VERDICT: `PARTIAL`** *(the `surpriseOutflow` half is closed and pinned; the `actualIncome` half of the
same finding is still open — by an explicit, filed 🎯 scope decision, not by oversight)*

### 1 · Is the observation closed?

**Half of it.** C1's text names **two** dead inputs: *"`surpriseOutflow`/`actualIncome` exist only in the
tutorial. Two safety-net acks Today is built to render can never fire"*, and R3 adds
`LeanSuggestionCard`.

**`surpriseOutflow` — closed.** The production call site that R3 measured as two-argument is now
three-argument: `apps/rn/src/app/(tabs)/index.tsx:716-729` — `onCapture={(items, decisions, surpriseOutflow) => …
capturePayday(items, decisions, surpriseOutflow != null ? { surpriseOutflow: { cycleEndDate: store.paycheck.nextPaycheckDate, amount: surpriseOutflow } } : undefined)`.
The user-facing control exists: `components/payday/PaydayCaptureSheet.tsx:470-482`, *"Anything unexpected
come out?"*, `testID="payday-surprise-amount"`. It flows to the engine unchanged —
`store.ts:156` (signature), `store/payday.ts:57` `if (actuals?.surpriseOutflow) next = recordSurpriseOutflow(…)`,
`store/substrateProducers.ts:74-80`. **The engine was not touched, which is what the row asked for.**

Both downstream consumers R3 named as dead are now reachable:
- the walk-back ack — `substrateProducers.ts:79` sets `pendingReserveWalkback: true`, read at
  `guardianSelectors.ts:186`. ⚠️ Still requires `subscriptionPlan === 'premium'` **and** a prior
  `billsAttested` — pre-existing gates, not introduced here.
- the release ack's **`tapped`** branch — `payday.ts:222-235` `computeReserveRelease` sums
  `surpriseOutflowLog`, rendered at `index.tsx:583-585`. Before this fix the log was always empty in
  production, so `tapped` was always `false` and the *"your safety net was there when a surprise came up"*
  string could not render outside the tutorial. It can now.

**`actualIncome` — still open, and `LeanSuggestionCard` is still unreachable by construction.**
`store/substrateProducers.ts:60` is unchanged: `if (store.paycheck.incomeVaries && opts?.actualIncome === undefined) return store;`
and `index.tsx:716-729` supplies **only** `surpriseOutflow`, never `actualIncome` — so `incomeActualsLog`
still cannot grow for a variable-income user, and `store/incomeLearning.ts:23-26`'s
`incomeVaries === true && incomeActualsLog.length >= 3` remains mutually exclusive in production.
**Filed, not lost:** `docs/DEBT_ELEVATION_PLAN.md:500-506` carries it as a `[DECISION]` under P6.10 with the
consequence stated in writing (*"`LeanSuggestionCard` stays unreachable"*). ✅ **The log's account and the
code agree here** — `DEBT_ELEVATION_LOG.md:203-207` records 🎯 taking the surprise-outflow half only.

### 2 · What the site ALSO did — and does it still?

The site is `handleCapture` (`PaydayCaptureSheet.tsx:201-223`) and Today's `onCapture` closure
(`index.tsx:716-738`). Both are on the core loop's single most consequential press.

| property it had | still present? | proof |
|---|---|---|
| **double-fire guard** (`if (captured) return`) | ✅ | `PaydayCaptureSheet.tsx:202` |
| **the success beat + haptic + the 1300 ms hold before the sheet commits** | ✅ | `:220-222` — `haptics.success()`, `setCaptured(true)`, `setTimeout(…, 1300)`. The new argument is computed *inside* that same call, so it cannot change the timing. |
| **`payday.completeCapture()` after the store write** | ✅ | `index.tsx:730` |
| **the once-ever review prompt, gated on `cycleHistory.length >= 2 && !reviewPrompted`** | ✅ | `index.tsx:733-737`, and it reads `store_.getState().store` *after* the capture, so it still sees the post-capture cycle count |
| **`onVerifyBalances` — the premium stale-balance re-verify batch** | ✅ | `index.tsx:715`, prop unchanged |
| **the extras/required override model** (`buildPaydayCaptureItems`, `decisionsFrom`) | ✅ | `PaydayCaptureSheet.tsx:203-215`, untouched by the diff |

**The property most at risk, and it is the one the tests are built around:** *an ordinary payday must
record nothing.* A naive fix (`parseFloat(surpriseAmount) || 0`, or sending `0` on blank) would have
written a surprise-of-nothing on **every** capture — and `computeReserveRelease` (`payday.ts:228-232`) sums
that log while `guardianPredictionCore.ts:87-90` reconciles the Guardian's own predictions against it. The
code refuses it twice: `PaydayCaptureSheet.tsx:219,222` sends `undefined` unless `surprise > 0`, and
`substrateProducers.ts:75` refuses again (`if (!(outflow.amount > 0)) return store`).
**Pinned:** `apps/rn/tests/e2e/absorb-entry.spec.ts:70-86` — *"a payday with nothing unexpected logs nothing
at all"*, and it waits for `lastHandledPaydayDate` to be stamped **before** asserting the absence
(`:76-84`), which is the `absence-assertions-pass-before-render` trap handled correctly.

**Garbage input is handled by B1's shared parser, not a hand-written guard:**
`PaydayCaptureSheet.tsx:219` uses `parseNonNegativeAmount` from `packages/core/utils/amountField.ts:69-74`,
which returns `null` for `"abc"`/`"Infinity"` and strips grouping commas. So `"1,200"` logs **1200**, not
`NaN` and not `1`.

### 3 · Was the implied remedy right?

**Yes, and the scoping is the interesting part.** The remedy implied by C1 — *give it a user entry point,
don't touch the engine* — is exactly what shipped, and it is the right shape: `store/payday.ts` and
`store/substrateProducers.ts` are unmodified.

⚠️ **One judgement I would flag rather than overturn.** The field is unlabelled by tier and unconditional,
but its most visible consequence (the walk-back ack) is premium-gated at `guardianSelectors.ts:186` and
the release ack at `:134`. **A free user can now log a surprise and see no acknowledgement of it at all** —
the value lands only in `computeReserveRelease`/`guardianPredictionCore`, both premium reads. That is not
a defect against C1 as chartered, but it is the same shape as B2's finding (a built response the majority
tier cannot reach) arriving one layer down, and no test asserts anything about the free user's view of it.

**Would the tests have failed on the original defect?** Yes. `absorb-entry.spec.ts:41-61` asserts
`surpriseOutflowLog` is empty **first** (`:51`) and then exactly `length 1` with `amount === 180` after the
capture — against the pre-fix two-argument call it polls to 0 and times out. It asserts on the **store**,
not the screen, which is the distinction that matters: a spec proving "the field accepts a number" would
pass against a version where the value went nowhere.
⚠️ Both specs seed a real plan via `scenario()` with a payday landing today (`absorb-entry.spec.ts:23-33`)
— **not** a `debts: []` zero-state.

### ⚠️ Unpinned

- **Nothing gates the `actualIncome` half from being forgotten.** The plan row is prose; no test asserts
  `incomeActualsLog` stays empty for a variable-income user, so nothing will *tell* anyone at P6.10.
- **No visual/layout coverage of the new field.** It is inserted between the scroll body and the action
  buttons (`PaydayCaptureSheet.tsx:469-482`) inside a `KeyboardAvoidingView` — the one place in the app
  where an added row can push the primary button under the keyboard at 402 pt with large text. The p6.8
  shot matrix does not shoot the open capture sheet.

---

## C2 — `usePaydayCapture.open()` has no caller

**VERDICT: `CLOSED`**

### 1 · Is the observation closed?

**Yes, and this is the cleanest of the four.** R3's claim was *"every caller I found: **none**"* — `payday.open`
appeared nowhere in `apps/rn/src`, `apps/rn/tests` or `tests/`.

- The caller now exists: `apps/rn/src/app/(tabs)/index.tsx:691-696` —
  `<Button label="Review this payday first" variant="text" testID="payday-reopen" onPress={payday.open} />`.
- It is placed on the **awaiting-rollover card** (`index.tsx:670`, `payday.isAwaitingRollover`), which is
  the one surface reached from **both** dismiss doors — and, critically, from the *fatal* one:
  `dismiss()` → `markHandled()` → `setLastHandledPayday` (`hooks/use-payday-capture.ts:79-82, 66-68`)
  makes `shouldPromptPaydayCapture` short-circuit, while `isPaydayAwaitingRollover(today, nextPaycheckDate, lastHandled)`
  (`:63`) becomes **true** on exactly that state. So the door opens precisely where the user is stranded.
- The mechanism works: `isOpen = manualOpen || autoOpen` (`use-payday-capture.ts:62`) and
  `open: () => setManualOpen(true)` (`:73`). `manualOpen` bypasses the `autoOpen` short-circuit entirely,
  so the persisted `lastHandledPaydayDate` cannot block it.

### 2 · What the site ALSO did — and does it still?

The site is the awaiting-rollover nudge card, whose **whole job** is the roll-forward.

| property it had | still present? | proof |
|---|---|---|
| **"Start next pay cycle" → `rolloverPayCycle()`** — the card's primary action and the only rollover door in the app | ✅ | `index.tsx:678`, byte-identical across the change (`git show d78fdb5 -- 'apps/rn/src/app/(tabs)/index.tsx'`) |
| **the sentence explaining what rollover DOES** (*"apply this cycle's payments and get your next plan"*) | ✅ **reworded, not dropped** | `index.tsx:676` — *"Ready for your next pay cycle. Starting it applies this cycle's payments and builds your next plan."* Only the false half (*"Payday logged."*) was removed. |
| **`close()` still un-does a manual open** | ✅ | `use-payday-capture.ts:69-72` `closeForThisPayday` sets `manualOpen = false` **and** `closedForPayday`, so re-opening then closing does not lock the user out or re-trigger the auto-open |
| **`completeCapture()` / `dismiss()` from the re-opened sheet still stamp the cycle** | ✅ | `use-payday-capture.ts:76-85`, unchanged; `index.tsx:730` still calls `payday.completeCapture()` |
| **the sandbox-isolation fix this hook exists to hold** (reads and writes go to the *same* store, so the tutorial cannot stamp the real `lastHandledPaydayDate`) | ✅ | `use-payday-capture.ts:44-46` `useActiveStore()` untouched; `open()` writes no store state at all |

**The property a fix here could most easily have broken is the copy assertion's own honesty**, and the
build caught it: `payday-reopen.spec.ts:110-124` anchors on **"Start next pay cycle"**, not on
`payday-reopen`. Anchoring on the button under test would have made the copy spec red when the *button*
was removed — reporting a copy regression that had not happened. That is the correct discrimination and it
is documented in the spec itself at `:119-121`.

### 3 · Was the implied remedy right?

**Yes** — *"give `open()` a caller, on the surface both doors lead to"* is the fix, and it is one button.
The **C3 fold instruction from SYNTHESIS was correctly refused**: `DEBT_ELEVATION_PLAN.md:575-576` records
that C2 re-opens capture for the *current* cycle while C3 is a cycle already stepped past, so no amount of
re-opening reaches it → deferred to 2.1 rather than "folded" quietly meaning "done." **I verified this is
a real distinction, not an excuse:** `open()` sets a component flag; nothing in `use-payday-capture.ts`
touches `applyRollover` or a past cycle.

**Would the tests have failed on the original defect?** Yes, all three, and they drive the **fatal** door
deliberately: `payday-reopen.spec.ts:50-79` skips, asserts `lastHandledPaydayDate` is stamped (`:62-70` —
which is what stops the spec passing against the always-recoverable backdrop path), then requires
`payday-reopen` to be visible and to re-open the sheet — **and again after a full `page.reload()`**
(`:75-78`), which is the assertion that proves the *persisted* door reopens. `:84-106` then proves the
second visit is a real capture (a surprise reaches `surpriseOutflowLog`), not a cosmetic re-render.
Against the pre-fix tree there is no `payday-reopen` element at all. ⚠️ All three seed a full plan via
`scenario()` (`:37-48`) — no `debts: []` zero-state.

### ⚠️ Unpinned residuals (neither is a regression)

- **The re-entry button is also offered after a SUCCESSFUL capture** — `isAwaitingRollover` is true after
  `completeCapture()` too (`use-payday-capture.ts:63,83-85`), so a user who already captured can re-open
  and confirm again. `selectRecommendedActions` nets out `completedRecommendedActions`
  (`planSelectors.ts:285-293` → `selectActiveRecommendedActions.ts:48-52`), so this reads as *"I paid more"*
  rather than as a double-count — but **no test covers the re-open-after-capture path**; both specs drive
  the skip door.
- **The button can render while the sheet cannot.** The card is unconditional on `isAwaitingRollover`
  (`index.tsx:670`) while `PaydayCaptureSheet` renders only under `allocation && summary`
  (`index.tsx:706-709`). In that state the press is silent. Narrow (it needs a landed payday with no
  allocation) and pre-existing in shape, but nothing asserts it.

---

## C5 — no "no-bills" branch

**VERDICT: `CLOSED`** *(observation closed and pinned — but see the reachability correction below: the
log's own account of WHO hits the false line is understated, and the realistic path is untested)*

### 1 · Is the observation closed?

**Yes, in both halves — and the finding's stated harm really was wrong. I verified the refutation myself
rather than accepting the log's.**

**R3's claim** (`refutations/R3-journey.md:311-314`): the debt-first, bills-less user is shown
*"You're caught up for this paycheck"* in success green, *"worse than the absence of a prompt."*

**Independently checked:** `apps/rn/src/store/planSelectors.ts:17` —
`const REQUIRED_CATEGORIES = ['expense', 'minimum_debt', 'autopay_expense', 'autopay_debt']` — and
`:166` builds a row from every allocation item in that set. So a debt-first user's minimum **is** a
required row; `RequiredActionsCard.tsx:76` computes
`outstanding = rows.filter((r) => !rowHandledNow(r)).length + unfunded.length` and `:122` gates the whole
zero-state on `outstanding === 0`. **On arrival, that user sees rows, not the green line.** R3's
explanation is refuted; the observation (*there is no no-bills branch*) survives. This is the audit's own
standing pattern landing a fifth time, and the builder found it by measuring.

**Both resulting defects are addressed:**

1. **The absence of a prompt** — `apps/rn/src/app/(tabs)/index.tsx:464-474`:
   `{planState !== 'no-debts' && store.requiredExpenses.length === 0 ? <PromptCard title="Add your bills" … onCta={() => setAddBillOpen(true)} />}`,
   with the sheet at `index.tsx:765`. It opens **in place** (no bounce to Money), mirroring the existing
   no-debts prompt at `:477-490`, and the two are mutually exclusive by construction, so an empty plan is
   asked for a debt first.
2. **The false statement** — `components/plan/RequiredActionsCard.tsx:122-135`: the zero-state now forks on
   `hasAnyBills`. `:124` keeps *"You're caught up for this paycheck."* for a user who has bills; `:126-134`
   renders *"You haven't added any bills yet."* + the consequence (*"this plan treats all of it as
   spendable"*) + an **Add a bill** button for one who does not.

⭐ **The signal is right and this is the sharpest judgement in the item.** `hasAnyBills` is passed from the
**store** (`index.tsx:507` — `hasAnyBills={store.requiredExpenses.length > 0}`), not derived from `rows`.
`rows.length === 0` would have been wrong: a plan can hold bills with none due this cycle, and that user
genuinely *is* caught up. Telling them they had added no bills would have replaced one false statement
with another.

### 2 · What the site ALSO did — and does it still?

The zero-branch's other job is to make a **true, reassuring** statement to the user who has bills and has
paid them. **A fix that simply deleted the green line would have closed the finding and removed that.**

| property it had | still present? | proof |
|---|---|---|
| **"You're caught up for this paycheck." for a user with bills** | ✅ | `RequiredActionsCard.tsx:124`, and pinned by `apps/rn/tests/e2e/no-bills-branch.spec.ts:64-83` — *"a user WITH bills, all handled, is still told they are caught up"*, which also asserts `required-no-bills` has count 0. **This is the test that stops the delete-the-line fix from passing**, and it is the one the brief's cluster-f precedent (V2-6's proxy assertion) predicts would be missing. It is not missing. |
| **the outstanding-count pill** | ✅ | `:108`, unchanged and still gated `outstanding > 0` |
| **bucketing / swipe-delete / paid-this-visit pinning** | ✅ | `:74-96, 138+` untouched by the change; the fork is additive inside the existing `outstanding === 0` block |
| **`RequiredActionsCard` has exactly one caller**, so the two new props cannot strand another render site | ✅ | grep: `index.tsx:29` (import) and `:502` (only usage) |
| **the "Add your bills" prompt must not fire inside the tutorial sandbox** (it is *not* inside a `TutorialFence`, so it would shift the coach-mark stage) | ✅ **safe, by the sandbox's data** | `store/sandboxScenarios.ts:273` always seeds `billsFrom(...)` (`:214-223`), so `requiredExpenses.length === 0` is never true there. ⚠️ **Unasserted** — this holds by the scenario's shape, not by a gate. |

### 3 · Was the implied remedy right?

**The defect was right, the stated harm was wrong, and the remedy split in two** — which the SYNTHESIS row
did not anticipate (*"likely a branch + copy, not engine work"* is true of half of it). Both halves shipped
and no engine code was touched.

**Would the tests have failed on the original defect?** Yes.
`no-bills-branch.spec.ts:33-41` (the debt-first prompt) has nothing to find in the pre-fix tree — the
`PromptCard` did not exist. `:46-58` asserts `required-no-bills` visible **and** *"caught up"* absent, where
the pre-fix code rendered *"caught up"* unconditionally at `outstanding === 0`. Both use a preceding render
barrier (`getByText('Required actions')`) before any absence assertion — the
`absence-assertions-pass-before-render` trap handled correctly.

### ⛔ The one thing I disagree with the log about — reachability

`DEBT_ELEVATION_LOG.md:106-107` and `no-bills-branch.spec.ts:44-45` both call the false-affirmation case
*"a rarer user — nothing due at all, and no bills configured."* **It is not rare.**
`RequiredActionsCard.tsx:76` counts only rows where `!rowHandledNow(r)`, and
`planSelectors.ts:242-244` defines `rowHandledNow` as `r.view.isPaid || (r.isAutopay && r.view.presumedPaid && !r.view.autopayFailed)`.
So an ordinary debt-first user reaches `outstanding === 0` with `hasAnyBills === false` **the moment they
check off their minimum** — or *immediately*, with no interaction at all, if that minimum is on **autopay**.
R3's observation was closer to correct than the correction credits; what was wrong was only *"on arrival."*

**This does not change the verdict — the shipped branch covers those users identically — but it does mean
the pinned case is the degenerate one.** Both specs that exercise the zero-branch
(`no-bills-branch.spec.ts:47` and `:70`) seed **`debts: []`**, which is the zero-state my brief warns
about: onboarding takes one debt **or** one bill (`components/onboarding/FirstDebtOrBillStep.tsx`), so
`debts: [] && requiredExpenses: []` is not even reachable through onboarding. **No test drives the
realistic path — a live debt whose only required row is paid or on autopay, with no bills.** It exercises
the same two lines, so a regression there would still red `:46-58`; but nobody has verified what that
user's Today actually looks like, and the `Add your bills` prompt and the no-bills zero-state would then
render *together*, which no frame or spec has ever shown.
