# M2 — JOURNEY COMPLETION

> Lens M2 of the P6.8 pre-release audit. Repo `debt-app-v1`, branch `v1.7-dev`, commit `dd80f70`.
> **Question: is anything MISSING.** External reference: a real user's arc, walked end to end —
> first launch → onboarding handoff → first ordinary day → first payday → first shortfall →
> a surprise expense → first payoff → debt-free → the things that happen in between.
>
> Method: trace each arc step in source; where a still helps, read the matrix frame
> (`apps/rn/capture-ref/p6.8/phone/light/*.png`). Findings only — nothing fixed.
> `[STRUCTURAL]` = fixing it would ADD capability, so it is 🎯's scope call, not a defect.

_In progress — appended as the arc is walked._

---

## Findings

### M2-1
**Severity:** major · **[STRUCTURAL]**
**Arc step:** 9 — they miss a paycheck / come back after a lapse
**What the user needs:** a way to say "I've been away, catch my plan up to today."
**What exists:** the plan only advances through `rolloverPayCycle()`, and in the whole RN app that has
**exactly one caller** — the Today nudge card at `apps/rn/src/app/(tabs)/index.tsx:619`, which renders only
when `payday.isAwaitingRollover` is true. `isPaydayAwaitingRollover`
(`packages/core/debt/shouldPromptPaydayCapture.ts`) requires `lastHandledPaydayDate === nextPaycheckDate` —
i.e. the user must have already *handled* this payday in-app. Meanwhile the capture prompt itself expires:
`shouldPromptPaydayCapture` returns false once `daysAfter(nextPaycheckDate, today) > payCycle + 7`
(`apps/rn/src/hooks/use-payday-capture.ts:13-15`).
**Gap:** a user who doesn't open the app for one cycle + 8 days lands in a state where **neither** the
capture sheet **nor** the rollover nudge can fire — Today renders a frozen plan headed "THIS PAYCHECK ·
<a date in the past>" (`PlanHero.tsx:143`) with no control anywhere in the app that advances it, and
`syncNotifications` (which only re-derives on enable / paycheck edit / rollover) has already fired its last
two reminders, so the app never speaks again either. There is no "catch up" path and no other rollover door
— More has no "Start next pay cycle" row (`apps/rn/src/app/more.tsx:166-328`), despite the core module's own
comment claiming that control is "otherwise buried in settings."
**Confidence:** high

### M2-2
**Severity:** major
**Arc step:** 4 — their first payday
**What the user needs:** to be able to come back to the payday capture after putting it off.
**What exists:** `usePaydayCapture` exposes `open()` (`apps/rn/src/hooks/use-payday-capture.ts:78`) —
**it has no caller anywhere in `src/` or `e2e/`.** The sheet's own "Skip this payday" button
(`components/payday/PaydayCaptureSheet.tsx:438`) calls `onDismiss` → `markHandled()`, which persists
`lastHandledPaydayDate` so `shouldPromptPaydayCapture` is false for that payday **forever**.
**Gap:** the app's single most important recurring moment is a one-shot: tap "Skip this payday" once and
the only way back into capture for that cycle is to roll the cycle forward without ever capturing it —
the manual re-open the hook was built for was never wired to a control.
**Confidence:** high

### M2-3
**Severity:** minor
**Arc step:** 4 — first payday, the skip branch
**What the user needs:** the app to describe what actually happened.
**What exists:** after "Skip this payday", `isAwaitingRollover` flips true and Today renders
*"**Payday logged.** Start your next pay cycle to apply this cycle's payments and get your next plan."*
(`apps/rn/src/app/(tabs)/index.tsx:616-617`).
**Gap:** the user explicitly declined to log the payday and the app tells them it was logged — the one
sentence they get after skipping is the one thing that is not true, and it invites them to roll a cycle
forward on the strength of it.
**Confidence:** high

### M2-4
**Severity:** major · **[STRUCTURAL]**
**Arc step:** 3 / 9 — the ordinary day, and coming back
**What the user needs:** to be told when payday and bills are coming, since the whole product is a
return-on-payday loop.
**What exists:** `prefs.notificationsEnabled` defaults to **false** (`apps/rn/src/data/defaults.ts:50`) and
the only writer in the entire app is the More → Preferences switch (`apps/rn/src/app/more.tsx:264`).
Onboarding's four steps never mention reminders; nothing on Today, Money or Progress points at the switch.
**Gap:** every re-engagement mechanism the app has — paycheck-eve, payday-morning capture, bills-due, the
Guardian risk push — is behind an off-by-default toggle three levels deep that the product never once
offers, so the default user's app is silent between launches they have to remember to make.
**Confidence:** high

### M2-5
**Severity:** blocker
**Arc step:** 7 / 8 — their first paid-off debt, and debt-free
**What the user needs:** the app to celebrate the moment they clear a debt — the emotional payoff the
whole product is built toward.
**What exists:** `PaidOffBeat` and `PaidOffFinale` are rendered from exactly one state variable,
`celebration` (`apps/rn/src/app/(tabs)/index.tsx:179`), and the **only** thing that sets it is
`confirmPayoff()` (`:180-190`). `confirmPayoff` has two callers: `PayoffInvitationCard.onConfirm`
(`:488`) and `useCaptureAutoConfirm` (`:193`, inert unless `CAPTURE_DEMO` — a marketing-capture build).
The invitation card is driven by `selectProvisionalPayoffs(store, isPremium)`, which
**returns `[]` for free** and, for premium, requires `isDebtProjectedPaidOff` =
`debt.balance > 0 && projectCurrentBalance(...) <= 0`
(`packages/core/debt/projectCurrentBalance.ts:113`) — i.e. the stored anchor must still be positive
while the *estimate* has crossed zero.
**Gap:** every ordinary way a person actually clears a debt bypasses the celebration entirely —
`logManualPayment` clamps the balance to 0 (`store.ts:524-531`), `verifyDebtBalance(id, 0)` from the
payday capture's balance check, and editing the balance to 0 in `DebtSheet` all leave `celebration`
null, so **a free user can pay off every debt they own and never see the beat or the finale**, and a
premium user who logs the final payment themselves gets the same silence. The spectacle fires only on
a premium projection-detected payoff the user then confirms.

⚠️ **Not the same as "silence."** The steady state is handled well — Money grows a PAID OFF section,
Progress swaps to the DEBT-FREE hero plus `PaidOffArchive`, Today gains `GraduationBanner` +
`FreedomNextChapterCard`, and `logManualPayment` posts a "Payment logged — I updated your balance" ack
with Undo (`index.tsx:558-560`). What never fires is the **one-time spectacle** the product is built
toward. ⚡ `tests/e2e/celebration.spec.ts` seeds `subscriptionPlan: 'premium'` + a provisional payoff for
every celebration case — the free payoff path is exercised nowhere, which is why a green suite has never
noticed.
**Confidence:** high

### M2-6
**Severity:** major · **[STRUCTURAL]**
**Arc step:** 6 — a surprise expense (the absorb path)
**What the user needs:** somewhere to say "something unexpected came out this cycle."
**What exists:** the whole substrate is built — `PaydayActuals`
(`apps/rn/src/store/payday.ts:21-25`) carries `actualIncome`, `missed` and `surpriseOutflow`;
`applyCapture` records all three (`:55-57`); `recordSurpriseOutflow`
(`store/substrateProducers.ts:74-79`) un-attests bills and raises `pendingReserveWalkback`; Today
renders the walk-back ack ("A surprise bill came up — I've restored your safety net for now",
`index.tsx:546`) and the release ack that says "your safety net was there when a surprise came up"
(`:528`). **But `capturePayday` is called with two arguments** — `store_.getState().capturePayday(items,
decisions)` (`index.tsx:640`) — and `PaydayCaptureSheet.onCapture` is typed with only
`(items, requiredDecisions)` (`PaydayCaptureSheet.tsx:73`). Grep confirms `surpriseOutflow` is
constructed nowhere in app code outside `sandboxBeats.ts` (the tutorial) and tests.
**Gap:** the absorb path has **no user entry point at all** — the safety net can only be drawn on by
the scripted walkthrough, so the two acks Today is built to show can never fire for a real user, and
the Guardian's outcome reconciliation (`guardianPredictionCore.ts:87`) always sees zero surprises.
**Confidence:** high

### M2-7
**Severity:** major · **[STRUCTURAL]**
**Arc step:** 9 — variable income ("I got paid less this time")
**What the user needs:** to report what actually landed, when their pay varies.
**What exists:** `recordCycleIncome` deliberately writes nothing when income is variable and no actual
is reported — `if (store.paycheck.incomeVaries && opts?.actualIncome === undefined) return store;`
(`store/substrateProducers.ts:60`). No UI ever supplies `actualIncome` (same missing third argument as
M2-6). `selectLeanSuggestion` requires `incomeVaries` **and** `incomeActualsLog.length >= 3`
(`store/incomeLearning.ts:22-26`).
**Gap:** `incomeActualsLog` is permanently empty for exactly the users the feature was built for, so the
premium income-learning nudge (`LeanSuggestionCard`, wired at `index.tsx:421`) can never render in
production, and §2.0's lean-verification confidence signal (`guardianPredictionCore.ts:38`) always
reads zero confirmations. This is the same class as the 3.7.A9 defect the `PaycheckSheet` comment
records — a flag six engine modules read and nothing writes — one layer further in.
**Confidence:** high

### M2-8
**Severity:** major · **[STRUCTURAL]**
**Arc step:** 9 — they get paid early or late
**What the user needs:** to tell the app when their next payday actually is.
**What exists:** nothing sets `nextPaycheckDate` directly. For weekly and biweekly,
`getNextPaycheckDate` returns `currentDate + 7/14` unconditionally
(`packages/core/payCycle/getNextPaycheckDate.ts:33-43`), and `PaycheckSheet.submit()` writes
`currentDate: todayLocalISO()` (`components/plan/PaycheckSheet.tsx:66`). The sheet renders the next
payday as **read-only display text** in a card (`:144-147`) — there is no date field, and the day-of-month
fields exist only for semimonthly/monthly.
**Gap:** a weekly/biweekly user whose payday drifts (paid early before a holiday, a late direct deposit,
or simply having set the app up on a Wednesday when they're paid Friday) has no control that says
"my next payday is X"; the only workaround is to reopen the paycheck sheet **on** the real payday and
re-save, which silently re-anchors the cycle 14 days from that moment — and nothing in the app tells
them that is the move.
**Confidence:** high

### M2-9
**Severity:** major
**Arc step:** 2 → 3 — the handoff out of onboarding, into the first ordinary day
**What the user needs:** to be told that a plan built from one debt and no bills is not yet their real
plan — i.e. "now add your bills."
**What exists:** onboarding takes **one** debt *or* **one** bill
(`components/onboarding/FirstDebtOrBillStep.tsx:111-112`). Today handles one of those two branches:
`planState === 'no-debts'` renders "Add your first debt" (`app/(tabs)/index.tsx:437-449`). **There is no
symmetric branch for "no bills"** — grep for "your bills" / "first bill" / "no bills" across `apps/rn/src`
returns zero product copy. The Expenses empty state ("Build your paycheck plan", `money.tsx:664`) only
exists once the user has navigated to Money → Expenses on their own.
**Gap:** the debt-first user lands on a Guardian that reads "Looks clear this paycheck" over a *Flexible*
figure that is their entire paycheck minus one minimum, because the app has no idea they owe rent — and
the only mechanism that hedges this, the discovery holdback plus the "bills complete" attestation
(`store/selectors.ts:49-51`, `guardianSelectors.ts:168`), is **premium-only: "free deploys undampened."**
So the free user's very first Guardian read is the most over-confident one they will ever get, and
nothing anywhere invites them to fix it.
**Confidence:** high

### M2-10
**Severity:** minor · **[STRUCTURAL]**
**Arc step:** 5 — their first shortfall, on the free tier
**What the user needs:** something to *do* when the cycle is short.
**What exists:** `recovery = isPremium ? selectRecoveryPlan(engineStore) : null`
(`app/(tabs)/index.tsx:147`); `tightTopUp` is premium-gated (`guardianSelectors`); `onDefer` /
`onKeepEssential` are only reachable through `RecoveryPlanSection`, which only renders under
`isPremium && recovery` (`PaydayGuardianCard.tsx:342-346`). A free user in shortfall gets the Guardian's
`brief.detail`, a `PremiumInvite` reading "Premium builds you a catch-up plan…"
(`PaydayGuardianCard.tsx:173`), and the unfunded list captioned "Short this paycheck — cover these from
savings or your next paycheck" (`RequiredActionsCard.tsx:124-126`).
**Gap:** at the single worst moment in the user's month, the free tier offers a diagnosis and a sales
pitch and **no action of any kind** — deferring a bill, the top-up, and the catch-up plan are all behind
the wall. Flagged as a scope call, not a defect: this may be the intended tier line (it is P1's price
test), but as a *journey*, step 5 has no free path onward.
**Confidence:** high

### M2-11
**Severity:** minor
**Arc step:** 3 — the ordinary day; two ways to record a payment
**What the user needs:** to know which of two controls to use, and what each one does to their balance.
**What exists:** two mechanisms with different consequences and no explanation of the difference.
(a) `RecommendedActionsCard`'s toggle records a completed recommended action
(`index.tsx:459-465`) — it does **not** move the balance; the money is applied at rollover.
(b) `LogPaymentSheet` calls `logManualPayment`, which reduces the balance immediately and re-anchors the
verified date (`store/store.ts:524-540`). Meanwhile the Guardian's own instruction — "Apply the spare
$1,350 toward Card when you're ready" (`brief.safeMove`, rendered as plain text at
`PaydayGuardianCard.tsx:318`) — **carries no control at all**, and the sheet that would carry out that
instruction lives two tabs away inside the *Edit debt* sheet.
**Gap:** the app names the move, then makes the user find the door for it themselves, and offers two
doors that behave differently without saying so.
**Confidence:** medium

### M2-12
**Severity:** minor
**Arc step:** 3 — reaching "Log a payment" at all
**What the user needs:** the cross-platform door to `LogPaymentSheet` to be visible when they open it.
**What exists:** the row is real and is passed from Money (`money.tsx:316, 410`) and rendered in
`DebtSheet`'s `footerAccessory` **above** "View payoff schedule"
(`components/entities/DebtSheet.tsx:272-281`). In the matrix frame
`phone/light/sheet-debt-sheet-edit.png` the row is **not visible**: the `payoff-schedule` coach-mark card
("See the whole payoff / Got it") occupies exactly that band of the sheet.
**Gap:** the fix for "a primary action with no cross-platform path" is, on first open, covered by a
coach mark pointing at the row below it — so the first time a user opens an existing debt, the door
3.5.5.4 added is the one thing they cannot see. Handing to the visual lenses for the geometry;
flagged here because the affected control is a primary action.
**Confidence:** medium

### M2-13
**Severity:** minor · **[STRUCTURAL]**
**Arc step:** 9 — "am I actually better off than last month?"
**What the user needs:** a plan-vs-actual read, not just an actual-vs-actual one.
**What exists:** `recordDriftBaseline` (`store/drift.ts`) is wired into onboarding, edits and rollover
and writes `store.driftBaseline`. **Nothing reads it.** `computeDrift`
(`packages/core/debt/computeDrift.ts:93`) — the "you're ~N days behind the plan the engine authored for
you" headline that `docs/V17_DRIFT_TRACKER_SPEC.md` calls "the deepest, least-copyable moat" — has zero
callers in `apps/rn/src`. The spec's §5 explicitly says v1.7 ships "the recording **and** a graceful
'building your drift history…' empty state"; §7 places it on the payoff/Progress trajectory chart.
Progress (`app/(tabs)/progress.tsx`) shows % paid, the projected debt-free date, cash flow and the
trajectory — all forward-looking or cumulative-total; `History` shows per-cycle balance deltas.
**Gap:** the recording half shipped and the reading half did not, so the question the arc asks — *am I
ahead or behind where I said I'd be* — has no answer anywhere in the product, and the baseline has been
silently accumulating against a screen that was never built.
**Confidence:** high

### M2-14
**Severity:** minor · **[STRUCTURAL]**
**Arc step:** 9 — they add a second job
**What the user needs:** to model recurring extra income.
**What exists:** exactly one income model — a single `paycheck` (amount, cycle, optional lean) — plus
`store.windfall`, a **one-off** cleared on every rollover ("one-time extra income was for the closing
cycle only", `store/payday.ts:~166`), surfaced as "Add extra income" on the hero
(`PlanHero.tsx:230-234`).
**Gap:** a second income stream can only be expressed by inflating the single paycheck figure — which
then also misstates the pay cycle it lands on — or by re-entering a windfall every single cycle by hand.
Noted as an honest capability boundary rather than a defect.
**Confidence:** high

### M2-15
**Severity:** minor
**Arc step:** 9 — they miss a paycheck (the affordance that *does* exist)
**What the user needs:** to find "my paycheck didn't arrive" at the moment it doesn't arrive.
**What exists:** the control is real and correct — a `SwitchRow` labelled "This paycheck didn't arrive"
→ `declareMissedPaycheck()` / `undoMissedPaycheck()` (`components/plan/PaycheckSheet.tsx:152-158`),
which pauses Guardian deploy and auto-resumes on rollover. Its **only** door is the pencil on the Today
hero that opens *Paycheck & pay cycle* — a sheet subtitled "Your income and when it lands — the
foundation of every plan" and framed as a settings edit.
**Gap:** a per-cycle *event* ("this one didn't come") is filed inside the form for standing *setup*, so
the user in the situation it was built for has no reason to look there; and unlike every other field in
that sheet the switch writes **immediately**, bypassing "Save paycheck", so it silently behaves
differently from its neighbours.
**Confidence:** medium

### M2-16
**Severity:** minor
**Arc step:** 9 — they want to change strategy
**What the user needs:** what snowball vs avalanche costs *them*, at the moment they choose.
**What exists:** the `SegmentedToggle` on Money writes `setPayoffStrategy` immediately
(`app/(tabs)/money.tsx:356-368`), captioned only with the generic rule ("Smallest balance first — quick
wins" / "Highest APR first — least interest"). The actual comparison — both trajectories drawn together,
the active one bold and the alternative a ghost line, with "~$X, Y months saved"
(`components/payoff/TrajectoryChart.tsx:31-34, 133, 436-437`) — lives on **Progress**, a different tab,
and Money never points at it.
**Gap:** the decision is taken on the screen that has none of the evidence, and the screen that has the
evidence has no switch.
**Confidence:** medium

### M2-17 (instrument, not product)
**Severity:** major
**Arc step:** 1–2 — first launch and onboarding
**What the user needs:** n/a — this is a hole in what four lenses are reading.
**What exists:** `tests/shots/p6.8-matrix.shot.ts:107` declares
`{ name: 'onboarding', goto: '/onboarding', seedOver: { prefs: { onboardingComplete: false } } }`, but
**every `*onboarding*.png` in the matrix renders Today, not onboarding** — verified across
`phone/light`, `phone/light/textscale-2x` and `ipad-portrait/dark`. The frames show the paycheck hero,
the Guardian card and the tutorial-invite card, and `selectTutorialInvite` requires
`prefs.onboardingComplete` — so the seed override demonstrably did not apply.
**Gap:** the matrix contains **zero** onboarding frames (30 slots × light/dark/viewport/textscale are all
duplicates of Today), so O1 (whose whole subject is first run) and V1–V4 are blind to the first screens
any user ever sees, while the matrix README lists onboarding as covered.
**Confidence:** high

---

## What I could not judge

- **Whether the payday-capture skip is recoverable in practice on device.** `open()` has no caller in the
  tree I can see (M2-2), but an AppIntent / widget / Live Activity deep link could conceivably re-enter
  it; I traced `drainPendingActions` and `pendingActions.ts` and found only `payday-landed` and
  `log-payment`, neither of which opens the sheet. **P6.14 device row** if it matters.
- **Whether M2-9's over-confident first Guardian read is as stark as the code says.** I traced the tier
  gate ("free deploys undampened", `store/selectors.ts:49-51`) but did not run a seeded free store with a
  debt and zero bills to see the actual rendered figure. A refuter should seed exactly that.
- **First launch itself.** Cold start, the splash, the storage-error and app-lock gates in front of
  onboarding — I read `_layout.tsx` but the matrix has no frames of any of it (M2-17), and O1 owns the
  depth here regardless.
- **Whether the deferred-capability findings are v2.0 scope.** M2-6/7/8/13/14 are all "the substrate
  shipped, the surface didn't". Several read as deliberately staged (the drift spec is explicit about
  its phase). Judging *whether they should ship* is 🎯's call, not mine.
- **Motion and timing on any of these beats.** Stills only; no instrument. **P6.14.**

## The structural list — for 🎯's scope call

`M2-1` · `M2-4` · `M2-6` · `M2-7` · `M2-8` · `M2-10` · `M2-13` · `M2-14`

⚠️ **`M2-5` is deliberately NOT on this list.** The beat and the finale are both **built and wired**;
what is missing is a call to `setCelebration` on the paths a real user actually takes. That corrects a
defect rather than adding capability — but it touches the store→celebration seam, so it is worth 🎯
seeing even though it is not a scope call.
