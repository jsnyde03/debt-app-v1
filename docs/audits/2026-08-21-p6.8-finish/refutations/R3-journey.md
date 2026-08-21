# R3 — JOURNEY & REACHABILITY (refutation)

> Refuter R3 of the P6.8 audit. Repo `debt-app-v1`, branch `v1.7-dev`.
> Target: the "X has no caller / Y is unreachable" cluster in `slices/M2-journey.md`
> (M2-5, M2-2, M2-6, M2-7, M2-1, M2-9).
> ⛔ Default is REFUTED. A finding survives only where I actively failed to break it.
> **Method:** every claim attacked by (a) whole-repo grep including `node_modules`, `ios/`,
> `apps/rn/modules|targets|plugins` (Swift), the legacy Capacitor tree at the repo root, and both
> e2e suites; (b) looking for prop-threading from a parent rather than a direct call; (c) looking
> for an iOS-only entry point (App Intent, widget, Live Activity, Siri, context menu); (d) asking
> whether a spec drives the path, since a spec that drives it proves a caller exists.

---

## R3-M2-5 — the payoff celebration is unreachable for a free user

**Verdict:** **CONFIRMED** (mechanism accurate as written; one detail is *worse* than the slice says)

**Every caller I found:**
- `setCelebration` — **3 sites, all in one file**: `apps/rn/src/app/(tabs)/index.tsx:179` (the `useState`
  declaration), `:184` (inside `confirmPayoff`), `:497` / `:501` (both `onDismiss` → `null`).
  Whole-repo grep **including `node_modules`** returned exactly two files: `index.tsx` and the M2 slice
  itself. There is no second writer anywhere in the tree.
- `confirmPayoff` — **2 callers**: `index.tsx:484` (`PayoffInvitationCard.onConfirm`) and `index.tsx:192`
  (`useCaptureAutoConfirm(provisionalPayoffs[0], confirmPayoff)` — inert outside a `CAPTURE_DEMO`
  marketing build, and it feeds off the *same* `provisionalPayoffs` array, so it inherits the premium gate
  rather than bypassing it).
- `PaidOffBeat` / `PaidOffFinale` — imported at `index.tsx:18-19`, rendered at `:491` and `:501`, and
  **nowhere else**. Not in `progress.tsx`, not in the tutorial sandbox, not in any sheet.
- `selectProvisionalPayoffs` — 1 caller, `index.tsx:175`. Definition `store/balanceSelectors.ts:112-116`:
  `if (!isPremium) return [];`. `isPremium` derives from `subscriptionPlan === 'premium'`;
  `data/defaults.ts:46` ships `subscriptionPlan: 'free'`.

**How I tried to break it:**
1. **A selector watching `debts` for a zero-crossing.** `store/celebrationSelectors.ts` — read in full — is
   pure read-layer (`selectPaidOffDebts`, `isLastLiveDebt`, `selectCelebrationStats`). Nothing in it fires a
   beat; `isLastLiveDebt` is called *by* `confirmPayoff`, not by anything watching state.
2. **The rollover milestone engine.** `store/payday.ts:128` is the closest thing to a zero-crossing watcher —
   and it explicitly **excludes** the one crossing that matters:
   `const crossedPortfolio = portfolioResult.milestones.find((m) => m.threshold < 100);`
   `store/milestoneCross.test.ts:45` pins it: *"100% never sets a milestone (finale owns debt-free)."*
   So the 100% moment is deliberately handed to a path a free user cannot reach. This **strengthens** the
   finding rather than breaking it: the code has consciously vacated the crossing.
   The per-debt `computeMilestones` result (which does carry `isPaidOff: true` at 100%) is consumed at
   `payday.ts:160` for `milestoneMaxProgress` only — the `isPaidOff` flag reaches no UI.
3. **iOS-only entry.** Every Swift surface in the tree: `plugins/app-intents-swift/{LogPaymentIntent,
   SiriQueryIntents}.swift`, `modules/live-activity/ios/PaydayLandedIntent.swift`,
   `targets/widget/*.swift`. The intents queue exactly **two** action kinds into the App Group —
   `"log-payment"` (`LogPaymentIntent.swift:88`) and `"payday-landed"`
   (`PaydayLandedIntent.swift:24`) — drained by `src/appIntents/drainPendingActions.ts` into
   `logManualPayment` / `applyPaydayLandedIntent`. **Neither touches `celebration`.** `logManualPayment`
   (`store/store.ts:523-540`) clamps the balance with `Math.max(0, …)` and returns; it sets
   `intentRollback`, nothing else. So the *one* iOS-native way to pay a debt to zero is also silent.
4. **The tutorial.** `sandboxBeats.ts` has no payoff beat (grep for `payoff|celebration|PaidOff` returns one
   unrelated comment). `finaleOnly` in `tutorialSelectors.ts:67` is the *tutorial's* last step, not the
   payoff finale — a false-friend name that could have rescued this and does not.
5. **A test that drives the free path.** `apps/rn/tests/e2e/celebration.spec.ts:31` and `:69` seed
   `subscriptionPlan: 'premium'` for every case; `:88`'s archive case seeds debts already at `balance: 0`
   (the steady state, not the beat). The slice's ⚡ is correct — **no test exercises a free payoff.**
6. **A different confirm path.** `verifyDebtBalance` has 3 non-test callers: `index.tsx:183` (inside
   `confirmPayoff`), `index.tsx:638` (`verifyDebtBalances`, the payday-capture batch), and `money.tsx:493`
   (the debt-row caption re-verify). The latter two set a balance to whatever the user types — **including
   0** — and fire no celebration.

**One correction that makes it worse, not better.** `index.tsx:283` states the design intent as *"the
one-time celebration spectacle stays Phase 3 (**gated on confirmed-$0**)."* A free user typing 0 into
`DebtSheet`, or `verifyDebtBalance(id, 0)` from the payday capture's balance check, **is** a confirmed $0 —
it is the most confirmed $0 in the product. The gate the comment describes is not the gate that shipped;
what shipped is gated on *premium projection + confirm*, which is a strictly narrower thing.

**If CONFIRMED — what does a real user lose?** The whole emotional terminus of the product. A free user
who clears every debt they own gets: a Money "PAID OFF" section, a Progress debt-free hero + `PaidOffArchive`,
Today's `GraduationBanner` + `FreedomNextChapterCard` (`index.tsx:293-303`, correctly ungated), and a
"Payment logged" ack with Undo. What they never get, at any point in the arc, is the **one-time spectacle**:
`PaidOffBeat` per debt, and `PaidOffFinale` — the navy takeover, the gold ring sweep, the confetti, the
count-up trio, the share card, the opt-in chime (`more.tsx:306`). A premium user who logs their own final
payment instead of waiting for the projection to notice gets the same silence. The most-photographed screen
in the app fires only for a premium user who lets the estimate get there first and then taps Confirm.

**Residual doubt:** two, both small. (a) I could not run a device build; if some native module fires the
finale outside React state I would have seen it in the Swift, and I did not — `modules/finale-haptics` is
imported only by `PaidOffFinale.tsx` itself. (b) Whether the premium-only invitation is the *intended* tier
line is 🎯's call — but note that even accepting that line, the **premium manual-payment path is silent too**,
which no tier argument covers.

---

## R3-M2-2 — `usePaydayCapture.open()` has no caller; "Skip this payday" is a one-shot

**Verdict:** **CONFIRMED** — and it is a *two-generation* omission, not a v1.7 regression

**Every caller I found:** **none.**
- `usePaydayCapture` is called once in the whole RN app: `apps/rn/src/app/(tabs)/index.tsx:171`, into a
  local `payday`. Every use of that object: `:614` `payday.isAwaitingRollover`, `:632` `payday.isOpen`,
  `:641` `payday.completeCapture()`, `:650` `payday.dismiss`, `:651` `payday.close`. **`payday.open` appears
  nowhere.** Greps run: `\.open\(\)` across `apps/rn/src`, `apps/rn/tests`, `tests/` gives zero hits;
  `payday\.open` gives zero; and there is no destructure of the hook to hide behind (`const payday = ...`
  is the only binding).
- ⚡ **The legacy v1.6 Capacitor surface has the identical hole.** `lib/hooks/usePaydayCapture.ts:95-96`
  ships the same `open()` with the comment *"Manually open the sheet (e.g. from that affordance)"* — and
  `app/page.tsx`, its only consumer, uses `completeCapture` (`:513`), `isAwaitingRollover` (`:1158`),
  `isOpen` (`:1497`), `dismiss` (`:1504`), `close` (`:1505`) and **never `open`**. "That affordance" has
  never existed in either codebase.

**How I tried to break it:**
1. **A prop threaded from a parent.** There is no parent: the hook is called *in* the screen that renders
   the sheet, and the sheet's props are all wired inline at `index.tsx:631-651`.
2. **An iOS entry.** Both App-Intent kinds (`"payday-landed"`, `"log-payment"`) drain into store actions,
   not into screen state — `drainPendingActions` cannot reach a `useState` inside Today. There is no
   deep-link route for the sheet (`apps/rn/src/app/` has a `tutorial.tsx` deep link and nothing equivalent
   for payday), and no notification-response listener anywhere in `apps/rn/src`.
3. **A QA door.** `components/more/LiveActivityQA.tsx:71` calls `applyPaydayLandedIntent()` — that is a
   *rollover*, not the capture sheet, and the whole block is behind `QA_TOOLS` and is *"removed ... before
   submission"* (`more.tsx:376`).
4. **A test that drives it.** `apps/rn/tests/e2e/` has no payday-capture re-entry spec; the legacy
   `tests/e2e/planner-payday-capture.spec.ts` drives the auto-open path only.

**One thing the slice does not say, and it matters for severity.** The two dismiss doors are *not*
symmetric, and only one is fatal:
- `onClose` calls `payday.close()` which sets `closedForPayday`, **component state**. Gone on the next cold
  start, so the backdrop / X / swipe-down is fully recoverable.
- `onDismiss` calls `payday.dismiss()` which calls `markHandled()` which persists
  `lastHandledPaydayDate = nextPaycheckDate`. `shouldPromptPaydayCapture` then short-circuits on
  `lastHandledPaydayDate === nextPaycheckDate` forever, and only `applyRollover` (`store/payday.ts:174`)
  ever advances `nextPaycheckDate` past it.
  The **only** control wired to `onDismiss` is the text button **"Skip this payday"**
  (`PaydayCaptureSheet.tsx:438`).

**If CONFIRMED — what does a real user lose?** One tap on a low-emphasis text button, at the busiest moment
of their month, permanently forfeits that cycle's reconciliation: the "you followed the plan / confirm what
you paid" record, the required-bill decisions, the premium stale-balance re-verify batch
(`onVerifyBalances`), the capture-success beat, and the review prompt. They are not *stranded* — `dismiss`
flips `isAwaitingRollover` true, so Today offers "Start next pay cycle" — but rolling forward from there
applies the plan **as planned**, so whatever actually happened that cycle is never recorded, and
`cycleHistory` / the Guardian's proof-of-work carry a plan-shaped cycle instead of a real one. There is no
"actually, let me log it" anywhere in the product.

**Residual doubt:** low. The one thing I cannot rule out from source is a gesture I did not think to grep —
but the sheet is `visible={payday.isOpen}`, `isOpen = manualOpen || autoOpen`, and `setManualOpen(true)` is
reachable only through the returned `open`, which nothing holds a reference to. It is a closed loop.

---

## R3-M2-6 / R3-M2-7 — the absorb path and the income-actuals path have no user entry point

**Verdict M2-6** (`surpriseOutflow`, the absorb path): **CONFIRMED**
**Verdict M2-7** (`actualIncome` and `LeanSuggestionCard`): **CONFIRMED**
**Verdict on the shared framing** ("PaydayActuals — surpriseOutflow, actualIncome, missed — is constructed
only in the tutorial sandbox and tests"): **MECHANISM WRONG on one of the three axes. `missed` HAS a
shipped user door.**

**Every caller I found — `capturePayday(items, decisions, actuals)`:**
- `apps/rn/src/app/(tabs)/index.tsx:640` — `capturePayday(items, decisions)`, **two arguments**. The only
  production call. `PaydayCaptureSheet`'s `onCapture` prop is typed `(items, requiredDecisions)`
  (`PaydayCaptureSheet.tsx:73`), so the sheet *cannot* supply a third even if the screen wanted one.
- `apps/rn/src/store/sandboxBeats.ts:79-82` — the tutorial, which passes `{ surpriseOutflow: ... }`.
- `apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts:60` — a test scenario.

**Every caller — `recordSurpriseOutflow`:** `store/payday.ts:57` (guarded by `if (actuals?.surpriseOutflow)`,
which production never satisfies) and `store/sandboxBeats.ts:51` (direct, on the **sandbox** store). Two
callers, zero user-reachable.

**Every writer of `incomeActualsLog`:** exactly one — `store/substrateProducers.ts:66`, inside
`recordCycleIncome`, whose line 60 reads
`if (store.paycheck.incomeVaries && opts?.actualIncome === undefined) return store;`.
Since production always passes `actualIncome: undefined`, **the log can only ever grow for fixed-income
users** (where `actual` defaults to `planned`). `selectLeanSuggestion` (`store/incomeLearning.ts:23-26`)
requires `incomeVaries === true` **and** `incomeActualsLog.length >= 3`. Those two conditions are mutually
exclusive in production. `LeanSuggestionCard` (`index.tsx:421-427`) is **unreachable by construction**, not
merely un-seeded.

**How I tried to break it:**
1. **A field in the capture sheet.** Grepped `PaydayCaptureSheet.tsx` for
   `income|Income|surprise|Surprise|unexpected` — **zero hits**. The sheet collects planned-payment
   confirmations and required-bill decisions and nothing else.
2. **A different door for a surprise expense.** No caller of `recordSurpriseOutflow` outside the two above.
   Adding an expense in Money writes `requiredExpenses`, not `surpriseOutflowLog`, so it does not un-attest
   or trigger the walk-back.
3. **iOS.** Neither queued intent kind carries an amount-with-a-reason that could become a surprise outflow;
   `"log-payment"` routes to `logManualPayment` (a debt payment).
4. ⚡ **`missed` — and this one broke.** `PaydayActuals.missed` routes to `recordMissedArrival`
   (`substrateProducers.ts:58`). **The same producer has an independent, shipped user control**:
   `store.ts:592-596` `declareMissedPaycheck()` calls `recordMissedArrival(store, paycheck.nextPaycheckDate)`,
   wired to the "This paycheck didn't arrive" `SwitchRow` at `components/plan/PaycheckSheet.tsx:152-158` —
   the very control M2-15 documents as *real and correct*. So the missed-arrival axis is **reachable**; only
   `surpriseOutflow` and `actualIncome` are not. M2-6's sentence naming all three is true of the *struct* and
   false of the third axis's *effect*, which is why M2-6 and M2-15 read as contradicting each other.

**If CONFIRMED — what does a real user lose?**
- **M2-6:** the entire safety-net *story*. `pendingReserveWalkback` can never be set outside the tutorial, so
  Today's *"A surprise bill came up — I've restored your safety net for now"* (`index.tsx:546`) and the
  release ack *"your safety net was there when a surprise came up"* (`:528`) are two written, styled, shipped
  cards no user can ever cause. The bills-completeness attestation can be *given* but never *walked back*, so
  an over-confident "bills complete" is permanent. And `guardianPredictionCore.ts:87`'s outcome
  reconciliation subtracts a surprise total that is always 0 — the Guardian grades its own predictions
  against a world where nothing unexpected ever happens.
- **M2-7:** the variable-income user — the *only* user the feature targets — gets `leanConfirms = 0` forever
  (`guardianPredictionCore.ts:38`), so the cold-start confidence signal never matures and the premium
  income-learning nudge never appears. They are also the users required to enter a lean figure
  (`PaycheckSheet.tsx:60-63`) for a learning loop that then never runs.

**Residual doubt:** low for `surpriseOutflow` (two callers, both accounted for). Slightly higher on M2-7's
*breadth*: a fixed-income user's `incomeActualsLog` does fill, so the outcome reconciliation is not
universally blind — it is blind exactly where income varies.

---

## R3-M2-1 — a user away one cycle + 8 days cannot advance the plan

**Verdict:** **MECHANISM WRONG IN ONE CLAUSE, OBSERVATION HOLDS**

**Every caller I found:**
- `rolloverPayCycle()` — **one** product caller, `apps/rn/src/app/(tabs)/index.tsx:619`
  ("Start next pay cycle"), rendered only under `payday.isAwaitingRollover`. Plus
  `testing/scenarios/guardianColdStartLifecycle.scenario.ts:67,68,74`.
- ⚡ **A SECOND rollover door exists and the slice misses it:** `applyPaydayLandedIntent()`
  (`store.ts:519-523`) runs *"the same roll as rolloverPayCycle"*. Callers:
  `appIntents/pendingActions.ts:71` (draining the iOS `"payday-landed"` action queued by
  `modules/live-activity/ios/PaydayLandedIntent.swift:24` and its byte-identical widget copy) and
  `components/more/LiveActivityQA.tsx:71` (QA-only, stripped with `QA_TOOLS`).
- The gate functions are exactly as the slice describes.
  `shouldPromptPaydayCapture` (`packages/core/debt/shouldPromptPaydayCapture.ts:29-39`) returns false past
  `maxRecencyDays` = cycle + 7 (`hooks/use-payday-capture.ts:13-15`); `isPaydayAwaitingRollover` (`:53-60`)
  returns `lastHandledPaydayDate === nextPaycheckDate`, which a user who never opened the app cannot satisfy.

**How I tried to break it — and what happened:**
1. **The iOS door.** I expected `PaydayLandedIntent` to rescue the stranded user. It does not, for two
   independent reasons.
   (a) **It is not a Siri / Shortcuts phrase.** `plugins/app-intents-swift/SiriQueryIntents.swift:101-144`
   registers exactly four `AppShortcut`s — `DebtFreeDateIntent`, `RemainingDebtIntent`,
   `PaycheckCheckIntent`, `LogPaymentIntent`. `PaydayLandedIntent` is **not** among them, despite its own
   header claiming it is *"available to Shortcuts / Siri"*. It is a `LiveActivityIntent`; its only real
   surface is the button on the Live Activity.
   (b) ⛔ **And the Live Activity can never start.** `shouldRunPaydayActivity`
   (`liveActivity/paydayActivityContent.ts:104-110`) computes
   `days = wholeDaysBetween(paycheck.currentDate, paycheck.nextPaycheckDate)` and returns false when
   `days > PAYDAY_ACTIVITY_WINDOW_DAYS` (**3**, `liveActivityKeys.ts:17`). But `currentDate` is the *cycle
   anchor*, not real today — its only writers are `payday.ts:143/174` (rollover sets
   `currentDate = nextPaycheckDate`), `PaycheckSheet.tsx:67` and `PaycheckStep.tsx:62` (both set
   `currentDate = todayLocalISO()` **and** recompute `nextPaycheckDate` a full cycle out). **Nothing advances
   `currentDate` day by day**, so that gap is always the whole pay cycle — 7, 14, ~15 or ~31 — and never
   3 or fewer. See the bonus finding below.
2. **A "catch up" control.** Grepped `catch up|been away|welcome back` across `apps/rn/src`; the only hit is
   `RequiredActionsCard.tsx:106` ("You're caught up for this paycheck"), unrelated. More has no rollover row,
   confirming the slice.
3. **A notification that could re-enter.** No `addNotificationResponseReceivedListener` anywhere in
   `apps/rn/src`; `useNotificationSync` re-derives on `[enabled, nextPaycheckDate, billsSignature]`, and for
   a frozen plan `nextPaycheckDate` never changes — so the reminder set is never rebuilt. (And
   `prefs.notificationsEnabled` defaults false, per M2-4.)
4. ⚡ **The clause that broke.** The slice says *"no control anywhere in the app that advances it."*
   **`PaycheckSheet`'s "Save paycheck" does advance it.** `submit()` (`PaycheckSheet.tsx:65-72`) writes
   `currentDate: todayLocalISO()` **and** `nextPaycheckDate: nextDate`, where
   `nextDate = nextPaycheckFrom(...)` resolves to `getNextPaycheckDate({ currentDate: todayLocalISO() })`
   (`store/paycheckForm.ts:100-106`). Re-saving the paycheck therefore moves the payday into the future,
   un-freezes `PlanHero`'s header, re-arms `shouldPromptPaydayCapture` for the *next* payday and re-runs
   `syncNotifications`. The plan is recoverable — from behind a pencil icon on the Today hero, with nothing
   in the product saying so.

**So what actually survives:** the **cycle** cannot be advanced; only the **date** can. The lapsed user's
missed cycle is never closed — `applyRollover` never runs, so that cycle's payments are never applied to
balances, `cycleHistory` never gets the snapshot, `genuineCycleCount` does not increment, milestone
high-water marks are not recomputed, and `recordDriftBaseline` is not re-anchored. Worse, the escape hatch
makes the app *look* correct again while making the missed cycle **unrecoverable** — the date it would have
been keyed to is gone.

**If CONFIRMED — what does a real user lose?** Exactly the user this product is for: someone who fell off
for a month. They open the app to a plan headed with a past date — no prompt, no nudge, no notification —
and the only door back is a paycheck-settings form they have no reason to open. If they find it, the app
quietly skips their missed cycle rather than reconciling it.

**Residual doubt:** medium-low on the observation; higher on my Live Activity claim (1b), which is source-only
and deserves a device check — if I am wrong about `currentDate`, a premium user with the toggle on does have
a rollover button on their Lock Screen. I found no writer that would make me wrong, and the unit test
covering it (`liveActivity/paydayActivityContent.test.ts:39-40`) hand-builds gaps of **2 and 3 days**, a
shape production never produces.

---

## ⚠️ BONUS (out of lens, found while attacking M2-1) — the Payday Countdown Live Activity can never start

`shouldRunPaydayActivity` gates on `wholeDaysBetween(paycheck.currentDate, paycheck.nextPaycheckDate) <= 3`.
Every writer of that pair sets them a **full pay cycle apart** (`payday.ts:174`, `PaycheckSheet.tsx:66-68`,
`PaycheckStep.tsx:62`), and nothing advances `currentDate` between rollovers, so the minimum possible gap is
7 days (weekly). The gate is false for every real store, in every tier, with the toggle on. Consequences:
the Live Activity never appears, `PaydayLandedIntent` never gets a surface, and the More "Payday countdown"
switch (`more.tsx:302-303`) is a preference that changes nothing. `paydayActivityContent.test.ts` is green
because it hand-builds a 2-day gap. **Not mine to fix and not in M2's lens — handing to whoever owns the
native/iOS slice, and to P6.14 device QA.**

---

## R3-M2-9 — onboarding takes one debt OR one bill; Today has a no-debts branch and no no-bills branch

**Verdict:** **CONFIRMED**

**Every caller I found (the asymmetry, stated as callers):**
- The fork: `components/onboarding/FirstDebtOrBillStep.tsx:110-118` — a two-option `SegmentedToggle`
  ("Debt" / "Expense"), one entry, then done. The whole onboarding is four steps —
  `app/onboarding.tsx:38-42` mounts `WelcomeStep`, `PaycheckStep`, `FirstDebtOrBillStep`, `CompletionStep`
  — and **none of the later ones mentions bills**: `CompletionStep`'s three stats are privacy, editability
  and "free to use" (`CompletionStep.tsx:18-23`).
- The type itself is asymmetric: `PlanState = 'no-paycheck' | 'no-debts' | 'debt-free' | 'normal'`
  (`store/planSelectors.ts:296`). **There is no `'no-bills'` member to branch on.** The one branch that
  exists is `index.tsx:434-449` (`planState === 'no-debts'` → the "Add your first debt" `PromptCard`).
- Product copy: grepped `first bill|your bills|no bills|add a bill|add your bill` (case-insensitive) across
  **all** of `apps/rn/src` — **zero product strings**. The four hits are comments and test assertions
  (`cutoverFiles.test.ts:13`, `expenseReserve.test.ts:112`, `sandboxScenarios.ts:203`,
  `tutorialPath.test.ts:107`).
- The only bill invitation in the product is `money.tsx:659-668` — `EmptyState` "Build your paycheck plan" —
  and it renders only once the user has navigated Money → Expenses on their own.

**How I tried to break it:**
1. **A different empty-state on Today.** `RequiredActionsCard` has no "you have no bills" state. Its only
   zero branch is `RequiredActionsCard.tsx:105-107`, which renders **"You're caught up for this paycheck."**
   in `accent.success` green. ⚡ **That is worse than the absence of a prompt** — the bills-less user's Today
   actively *affirms* them for a paycheck they have not told the app about.
2. **A coach mark / first-run overlay pointing at bills.** None. `store/coachMarkCopy.ts:24-43` is the whole
   inventory — exactly three ids: `payoff-schedule`, `debt-row-actions`, `trajectory-scrub`. Nothing targets
   Money → Expenses.
3. **The Guardian saying it.** No Guardian copy names missing bills. The mechanism that *would* hedge it is
   the discovery holdback + attestation — and both are premium: `store/selectors.ts:49-52`
   (`const isPremium = …; const confidence = isPremium ? deriveConfidenceContext(store) : null;`) under the
   comment *"free deploys undampened"*, and `guardianSelectors.ts:166-168`
   (`if (store.subscriptionPlan !== 'premium') return { show: false, attested: false };`). **The slice's
   premium-gate claim verifies exactly.**
4. **A test that seeds it.** `apps/rn/tests/e2e/earlyjourney.spec.ts` exists, but nothing drives a free store
   with a debt and zero bills through Today. (The slice's own "what I could not judge" asked a refuter to
   seed exactly that; I read the gates rather than running the seed, so the *rendered figure* is still
   unverified — see residual doubt.)

**If CONFIRMED — what does a real user lose?** The debt-first free user's first-ever Guardian read is
computed as if rent does not exist, is undampened because dampening is premium, and is stated in green. The
app then offers them no route to the fact that would correct it. Every downstream number they see for that
first cycle — Flexible, deploy-to-debt, the debt-free date — is built on an income with no housing in it,
and the product's only correction lives on a tab they have not been sent to.

**Residual doubt:** I verified the *gates* in source but did not run a seeded free store to read the rendered
Flexible figure, so "the most over-confident read they will ever get" is a sound inference, not a measured
one. If a visual lens can capture `phone/light` Today with `{debt: 1, expenses: []}` on free, that closes it.

---

## Survivors, ranked by what the user never sees

| # | Finding | Verdict | What is never seen |
|---|---|---|---|
| **1** | **M2-5** | **CONFIRMED** (blocker stands) | **The payoff beat and the debt-free finale — the product's entire emotional terminus.** Free: never, on any path. Premium: only if the *estimate* notices the payoff before the user does. The 100% crossing was deliberately vacated by the milestone engine in the finale's favour (`payday.ts:128`), so nothing else covers it. |
| **2** | **M2-6** | **CONFIRMED** | **The whole absorb / safety-net story.** Two written-and-styled Today acks (`index.tsx:528, :546`) that no real user can cause; an attestation that can be given but never walked back; a Guardian that reconciles its own predictions against a world with zero surprises. |
| **3** | **M2-1** | **OBSERVATION HOLDS, one clause wrong** | **A closed cycle after a lapse.** The date *can* be un-frozen (re-save the paycheck sheet — the slice says nothing can), but the missed cycle can never be reconciled, and the escape hatch destroys it silently. No prompt, no nudge, no notification points at any of it. |
| **4** | **M2-9** | **CONFIRMED** | **Any invitation to add bills.** No `'no-bills'` plan state exists; `PlanState` has no member for it and the repo has zero product strings for it. The bills-less user instead gets green **"You're caught up for this paycheck."** |
| **5** | **M2-2** | **CONFIRMED** | **A second chance at payday capture.** One tap on "Skip this payday" persists `lastHandledPaydayDate` and the `open()` built for re-entry has had no caller in *two generations* of this app (RN **and** the v1.6 Capacitor tree). |
| **6** | **M2-7** | **CONFIRMED** | **The premium income-learning nudge, for the only users it targets.** `LeanSuggestionCard` is unreachable by construction: its two conditions (`incomeVaries` and `log.length >= 3`) are mutually exclusive in production. |
| **—** | *M2-6/7 shared framing* | **MECHANISM WRONG (partial)** | `missed` is **not** unreachable — `declareMissedPaycheck()` (`store.ts:592`) reaches the same `recordMissedArrival` producer from the `PaycheckSheet` switch. Only `surpriseOutflow` and `actualIncome` have no door. |
| **+** | *bonus, out of lens* | **new** | **The Payday Countdown Live Activity can never start** — its 3-day window is measured against the cycle anchor, which is always a full cycle from payday. The Lock-Screen surface, its "Payday landed" button, and the More toggle that enables it are all dead. |

**Nothing in this cluster refuted.** That is the unusual result here, given that "no caller" claims refute
more often than any other class — so it is worth naming *why* they held: every one of these paths is gated by
a **pure function of persisted state** (`isPremium`, `incomeVaries`, `lastHandledPaydayDate`, `planState`),
not by a dynamic dispatch, a threaded prop or a platform-specific entry. There was nowhere for a hidden
caller to hide. The two places a caller *could* have hidden — the App Intents queue and the Live Activity —
I opened, and both turned out to be narrower than they look (two action kinds; a window that never opens).
