# O1 — ONBOARDING & FIRST RUN

> **Lens O1** of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Scope: the first five minutes. Cold start → Welcome → Paycheck → First Debt/Bill → Completion → Today,
> plus the demo door, odd input, abandonment/return, and the handoff.
>
> Written incrementally. Findings only — nothing fixed.

**Surface read:**
- `apps/rn/src/app/onboarding.tsx`
- `apps/rn/src/components/onboarding/{OnboardingLayout,WelcomeStep,PaycheckStep,FirstDebtOrBillStep,CompletionStep}.tsx`
- `apps/rn/src/store/onboardingFinish.ts`
- frames: `apps/rn/capture-ref/p6.8/{phone-small,phone,split-view,ipad-portrait,ipad-landscape}/{light,dark}/onboarding.png`

---

## Findings

### O1-1
**Severity:** blocker
**Step:** the whole surface (instrument) · **Evidence:** `apps/rn/capture-ref/p6.8/*/*/onboarding.png` (all 10) · `apps/rn/capture-ref/p6.8/phone/*/textscale-{1.35x,2x}-onboarding.png` (4) · `apps/rn/capture-ref/p6.8-a11y/onboarding.txt` · `apps/rn/tests/shots/p6.8-matrix.shot.ts:107` · `apps/rn/src/data/migrations.ts:112-122,173`
**Finding:** **Every "onboarding" frame in the P6.8 matrix is a screenshot of Today, not of onboarding** — `runMigrations`' `inferOnboarding` promotes `onboardingComplete` to `true` whenever the blob has income AND an obligation, which the matrix seed always has (`scenario()` = `paycheck '2000'` + one debt + one bill), so the explicit `prefs.onboardingComplete: false` in `seedOver` is silently overridden, the route guard closes `/onboarding`, and expo-router falls through to `(tabs)`.
**Why it costs:** V1 (theme parity), V2 (size class), V3 (Dynamic Type) and V4 (state coverage) each believe they have judged onboarding at 5 widths × 2 themes; **all four have judged Today twice**. A1's onboarding a11y tree is Today's tree (it names "Payday Guardian", the affordability card and the tab bar). This is the exact instrument failure the README says the matrix was built to prevent — and it did not even report a hole, because the shot *succeeded*. The 15 frames read as coverage.
**Confidence:** high — the frames show the Today hero, the Guardian card and the tab bar; `inferOnboarding`'s own doc says it "only ever promotes", and an explicit `false` is not exempted (only an explicit `true` is honoured, at `migrations.ts:117`).

### O1-2
**Severity:** major
**Step:** all four (abandonment/return) · **Evidence:** `apps/rn/src/app/onboarding.tsx:18` · `PaycheckStep.tsx:21-34` · `FirstDebtOrBillStep.tsx:30-36,59-71` · `store/store.ts:309-329`
**Finding:** The step index is component-local `useState(0)` and nothing persists it, while each step's data is written to the durable store as you leave it — so an interrupted onboarding resumes at Welcome with **empty fields over already-saved data**, and re-walking step 2 appends a **second copy** of the same debt (`addDebt` unconditionally appends; the id is `debt-${Date.now()}`).
**Why it costs:** A user who quits after adding one debt but with no paycheck (or who chose Expense) comes back to Welcome, re-types "Visa Card", and lands on Today owing Visa twice. Nothing on any screen tells them the first one was kept.
**Confidence:** high — `addDebt` has no de-duplication, and `PaycheckStep`/`FirstDebtOrBillStep` initialise every field from `''` rather than from the store.

### O1-3
**Severity:** major
**Step:** Completion (skipped entirely) · **Evidence:** `apps/rn/src/data/migrations.ts:112-122` · `CompletionStep.tsx:32,48-53`
**Finding:** The corollary of O1-1 in the product: a user who force-quits **after** "Add & Continue" on step 3 — i.e. standing on the Completion screen — relaunches with income + an obligation, so `inferOnboarding` marks them complete and the route guard drops them straight into Today. They never see the completion screen again.
**Why it costs:** They lose the one moment the flow was designed around — *"You could be debt-free by {date}"* (`onboardingFinish.ts:19-24`), the only aspirational payoff for the work they just did — and the optional display-name field, which is the only place the app asks. Neither is re-offered anywhere in the flow. `prefs.onboardingComplete` is therefore **not** the gate the plan says it is; the real gate is "has income and an obligation".
**Confidence:** medium-high — the mechanism is certain; whether a real user lingers on Completion long enough to be interrupted is a frequency question, not a correctness one.

> **Note on evidence.** Because of O1-1 there is no usable frame of onboarding in `capture-ref/`, so I
> rendered the surface myself against the same `apps/rn/dist` the matrix was shot from (served on :4321,
> seeded with a genuinely COLD store — `paycheck.amount: ''`, `debts: []`, so `inferOnboarding` cannot
> promote). Frames referenced below as `scratch:o1/frames/...`. The same seed reaches Welcome at all five
> widths and both themes, which is itself the proof of O1-1's mechanism.

### O1-4
**Severity:** major · **[STRUCTURAL]**
**Step:** 2 · Paycheck · **Evidence:** `PaycheckStep.tsx:123-153` · `@core/payCycle/getNextPaycheckDate.ts:34-44` · `PaycheckSheet.tsx:47,122-141` · frame `scratch:o1/frames/phone/light/1-paycheck.png`
**Finding:** **Weekly and bi-weekly users are never asked when they get paid.** Those two cycles derive the next payday as `today + 7` / `today + 14`; only semi-monthly and monthly get day fields. Bi-weekly is the pre-selected default, and the step still shows a confident `NEXT PAYCHECK · Fri, Sep 4` card for a date the user never supplied and has no field to correct — in `PaycheckSheet` either, which recomputes the same offset on every save.
**Why it costs:** The screen is titled *"When do you get paid?"* and never asks. A bi-weekly user is on average ~7 days wrong (uniform 0–13), which is the horizon the entire Guardian runs on: which bills are "due this paycheck", what is safe to spend, when the payday-capture sheet fires. The app's core claim is computed against a date it guessed.
**Confidence:** high on the mechanism (the function has no anchor input and neither host offers one); the *severity* depends on how much the wrong horizon moves the plan, which is P6.10's arithmetic to settle.

### O1-5
**Severity:** major
**Step:** 4 · Completion · **Evidence:** `data/defaults.ts:20-25` · `store/onboardingFinish.ts:26-31` · frame `scratch:o1/frames/phone/light/3-completion.png`
**Finding:** Skip both questions and the finish line still declares **"Your next paycheck lands Fri, Sep 4"** — because `createDefaultStore()` pre-seeds `nextPaycheckDate = getNextPaycheckDate('biweekly', today)`, so `finishLine`'s second rung fires for a user who entered nothing. The captured frame is a run where I tapped *Skip for now* and *Skip, I'll add later*.
**Why it costs:** `onboardingFinish.ts`'s own docstring is *"a LADDER OF REAL FACTS — never a content-free reassurance… Each rung states something true of THIS user."* Rung 2 states a **fabricated** fact to the one user who supplied none, which is worse than the "You're all set" it replaced. The third rung, *"Your plan is ready"*, is **unreachable dead code** — `nextPaycheckDate` is never empty in any real store.
**Confidence:** high — rendered and photographed.

### O1-6
**Severity:** major
**Step:** all four · **Evidence:** `OnboardingLayout.tsx:22-41` vs `components/screen.tsx:48-55` + `hooks/use-layout.ts:32` · frames `scratch:o1/frames/ipad-landscape/*/0-welcome.png`, `ipad-portrait/*`
**Finding:** `OnboardingLayout` is a hand-rolled scaffold that never uses `Screen`, so it is **the only surface in the app with no iPad width cap** — at 1194pt the hero badge is stranded top-left, one sentence spans 1150pt, and "Get started" is a 1150pt-wide button over an empty middle third.
**Why it costs:** These are the first four screens an iPad user ever sees, and they are the four that look unfinished; every screen they reach afterwards is centred and capped (`maxContentWidth`, `TwoColumn`, Progress's 980). It reads as a phone app that was never opened on the device.
**Confidence:** high — rendered at 834 and 1194 in both themes; the cap's absence is visible in the source.

### O1-7
**Severity:** major
**Step:** 1 · Welcome (and all four) · **Evidence:** `OnboardingLayout.tsx:36,39` · `components/ui/Button.tsx:79-86` · frames `scratch:o1/frames/phone-small/light/0-welcome.png`, `scratch:o1/frames/scale/welcome-2x.png`
**Finding:** The value proposition is three feature rows in a scroller with **`showsVerticalScrollIndicator={false}`** under a sticky CTA stack that has no height budget. At 320×568 only **one of the three** rows is visible and the second is cut mid-row; at 2× text the two buttons alone take roughly two-thirds of the screen, each wrapping to 2–3 lines (`Button` sets `minHeight` but no `numberOfLines` and **no `maxFontSizeMultiplier`** — so unlike most hero numbers in this app, nothing clamps it).
**Why it costs:** On the narrowest shipping width, and at large type, the screen that has to earn the next tap shows one reason out of three and gives no visual cue that more exists. Two-thirds of the pitch is invisible to exactly the users least likely to go looking.
**Confidence:** high at 320pt (rendered). Medium on the 2× frame — the matrix header's caveat applies (web ignores Dynamic Type curves), but it is **not** over-reporting here, because the clamp it would over-report against does not exist on `Button`.

### O1-8
**Severity:** minor
**Step:** the doors out · **Evidence:** `onboarding.tsx:33` · `config/qa.ts:109-111` · `tests/e2e/demo-containment.spec.ts:59-71` · `demoExit.ts:45-58` · `ExampleCanvasMarker.tsx:100-112`
**Finding:** ✅ **The [D21]/[D18] Welcome door is intact and genuinely tested.** `isDemoReachable()` returns an unconditional `true` and no longer rides `QA_TOOLS`; the Welcome CTA is present in all ten frames I rendered; `demo-containment.spec.ts` has a dedicated *"the WELCOME door"* test that navigates to `/onboarding` and clicks the button rather than going straight to `/demo`; the run is `explore` (no `mode=scripted`), whose exit rides `ExampleCanvasMarker`'s `Pill`, and `exitDemo('/onboarding')` returns a cold viewer to Welcome. **No defect found. The residual is the QA-flip risk the code already names:** `QA_TOOLS` is still `true` at `config/qa.ts:9` with a comment saying to flip it before submission, and the only thing keeping the demo alive through that flip is a hand-written comment.
**Why it costs:** Nothing today. Filed so the refuter has the verification on record rather than re-running it, and so the `QA_TOOLS` flip does not get made without someone re-reading `isDemoReachable`.
**Confidence:** high.

### O1-9
**Severity:** blocker
**Step:** 2 · Paycheck and 3 · First debt (odd input) · **Evidence:** `PaycheckStep.tsx:39` · `FirstDebtOrBillStep.tsx:44-55,59-71` · probe output quoted below · frame `scratch:o1/frames/odd/nan-b.png`
**Finding:** **Every amount guard is `Number(x) <= 0`, and `NaN <= 0` is `false` — so a non-numeric amount passes validation.** Driven against the shipped web build: paycheck `"1.2.3"` advanced and persisted as `paycheck.amount: "1.2.3"`; debt balance `"2.4.0"` / minimum `"6.5.5"` advanced and persisted as `balance: null, minimumPayment: null, originalBalance: null` (they are `NaN` in memory, and `JSON.stringify` writes `NaN` as `null`); APR `"x"` silently became `0` via `Number(apr) || 0`. `"0"` **is** correctly refused.
**Why it costs:** Two decimal points is typeable on the iOS decimal-pad — it has a separator key and no validation — and paste has no guard at all. The user's first debt is then stored with no balance. The immediate tell is the finish line itself: with the NaN debt, `debtFreeDate` is null, so the Completion screen said *"Add a debt any time and you'll get a debt-free date too"* **to a user who had just added one**. On the next launch `repairMoneyFields` rewrites the nulls to 0 and raises a data-repair notice — so a brand-new user's second launch opens with "we had to repair your data."
**Confidence:** high — reproduced end-to-end and read back out of `localStorage`.

### O1-10
**Severity:** major
**Step:** 3 · First debt · **Evidence:** `FirstDebtOrBillStep.tsx:43-55` vs `components/entities/DebtSheet.tsx:187-189`
**Finding:** The onboarding debt form is **validated more loosely than every subsequent debt**: `DebtSheet` refuses *"Minimum payment can’t exceed the balance."* (`:189`); onboarding has no such check. Measured: balance `500` / minimum `5000` was accepted and persisted, as were `balance: 99999999999` and `apr: 9999`.
**Why it costs:** The one debt entered with the least context, by the user with the least experience of the app, is the one the app checks least — and it feeds the debt-free date on the very next screen, which is the flow's whole payoff.
**Confidence:** high — reproduced; the asymmetry is two files side by side.

### O1-11
**Severity:** major
**Step:** 1 · Welcome (copy) · **Evidence:** `WelcomeStep.tsx:11-12,19` vs `components/plan/AffordabilityCard.tsx:41,165-171`
**Finding:** Feature 3 promises **"Spend without the guilt — Check any purchase against your plan before you buy."** On the free tier the affordability card does **not** answer that: it returns *"You have about $X spare this paycheck"* plus a `PremiumInvite` reading *"Premium tells you if $400 fits."* The **answer** is the paid part, not the automation.
**Why it costs:** `WelcomeStep`'s own header comment asserts the opposite — *"Honest across tiers: the free read genuinely tells you what's safe; premium automates the moves."* That holds for feature 1 (the Guardian read is free) and feature 2 (snowball/avalanche and the debt-free date are free — verified ungated at `money.tsx:355-367`). It does not hold for feature 3, which is the one a user tests first because it is the cheapest to try. Third of three promises on the first screen, and the only false one.
**Confidence:** high — the free branch at `AffordabilityCard.tsx:167-171` is a paywall, not a read.

### O1-12
**Severity:** major
**Step:** 5 · the handoff (Today, free tier) · **Evidence:** frame `scratch:o1/frames/today-onboarded.png`, seeded with exactly what onboarding writes (`amount 2000`, biweekly, one debt 2400/65/APR 0 due the 1st of next month, `subscriptionPlan: 'free'`)
**Finding:** The handoff is **good** — the hero carries their $2,000 and *"On track · debt-free by September 2026"*, and the walkthrough is offered. But the **Payday Guardian card's message slot — the flagship surface, in the first ten seconds after setup — is filled by a premium pitch** (*"Premium works out how much to keep back each payday…"*) where a premium user gets actual guidance (*"Apply the spare $1,350 toward Card when you're ready…"*, visible in the matrix's mislabelled `phone/light/onboarding.png`).
**Why it costs:** The reward for finishing setup is an advertisement in the place the product promised advice. The skip-everything landing (`scratch:o1/frames/today-skipped.png`) is *better* behaved — a walkthrough invite and one clear "Set up your paycheck" CTA.
**Confidence:** high on what renders; the severity is a placement judgment and overlaps P1's tier lens — flagged, not owned.

### O1-13
**Severity:** minor
**Step:** 2–4 · **Evidence:** `onboarding.tsx:40-42` · `OnboardingLayout.tsx:28-35`
**Finding:** There is **no way back**. `setStep` only advances, `OnboardingLayout` renders no back control, and the whole flow is one route so the iOS edge-swipe has nothing to pop — yet the four progress dots imply a sequence you can move through.
**Why it costs:** A mistyped paycheck amount cannot be corrected until the flow ends and the user finds `PaycheckSheet` on Today. The dots promise navigation the screen does not provide.
**Confidence:** high.

### O1-14
**Severity:** minor
**Step:** 3 · First debt · **Evidence:** `FirstDebtOrBillStep.tsx:20-26,57`
**Finding:** The first obligation's `dueDate` is silently set to the 1st of next month and is never shown, asked or mentioned. `DebtSheet` has a due-date field; this step does not, and the only record of the decision is a code comment ("the user refines it later on the Bills screen").
**Why it costs:** Whether the minimum falls inside the current paycheck window is what decides if Today lists it as a required action. A user whose card is actually due on the 22nd gets a first plan that omits it, with nothing on screen explaining why.
**Confidence:** high on the mechanism; medium on user-visible size, which depends on cycle-window arithmetic (P6.10).

### O1-15
**Severity:** minor
**Step:** the gate itself · **Evidence:** `store/store.ts:577-586` · `store/substrateProducers.ts:87-90` · `store/store.ts:149,587-589`
**Finding:** Two loose ends behind O1-3. (a) `stampOnboardedAt` is called **only** from `completeOnboarding()`, so every user who reaches the tabs via `inferOnboarding` — the abandon-at-Completion case, and the v1.6-restore case the inference was written for — keeps `onboardedAt: null` forever; `computeReserveRelease` then reads `since = ''` (`payday.ts:226`) and counts every surprise outflow ever logged. (b) `refreshCyclePrediction()` is declared and implemented and its docstring says *"app-open / cycle-detect entry path… safe to call on mount"* — and a repo-wide grep finds **no call site at all** (two references: the interface line and the implementation). It is the mechanism that would have covered for `completeOnboarding()` being skipped.
**Why it costs:** Small alone; it is why O1-3's bypass has no safety net.
**Confidence:** high on both — the grep is exhaustive.

### O1-16
**Severity:** polish
**Step:** 1 · Welcome and 4 · Completion (copy) · **Evidence:** `WelcomeStep.tsx:18` · `CompletionStep.tsx:19` + `apps/rn/core/copy/vocabulary.ts:109-118`
**Finding:** Two smaller copy notes. (a) *"Snowball or avalanche"* is unexplained jargon in the second of three value props on the very first screen — Money explains both in a caption (`money.tsx:364-367`), Welcome does not. (b) The Completion screen states `PRIVACY_CLAIM` — *"your financial data stays on this device"* — as an unqualified pledge at the moment of commitment, and P6.3 shipped iCloud backup after that string was settled.
**Why it costs:** (a) costs a beat of comprehension on the screen with the least patience. (b) is a claim question and is **deliberately handed to M1 / P6.9 rather than judged here** — noted only because onboarding is where it is said first and most absolutely.
**Confidence:** high on (a); (b) is a flag, not a finding.

### O1-17
**Severity:** minor
**Step:** cost of entry (the measurement 🎯 asked for) · **Evidence:** the four step components; walked end to end on the shipped build
**Finding:** **Fastest complete path: 4 required text entries and 8 taps** — Get started · paycheck amount · Continue · debt name · balance · minimum · Add & Continue · See your plan. **Fastest skip path: 4 taps and zero fields.** The first thing the app returns that the user did not already know is the **debt-free date on screen 4** — and only if they entered *both* a paycheck *and* a debt (choosing Expense drops them to rung 2). The `NEXT PAYCHECK` card on screen 2 looks like a returned fact but for the default bi-weekly cycle it is just `today + 14` echoed back (see O1-4).
**Why it costs:** Nothing is given back until the last screen. There is no early "here is what we can already tell you" beat, so every drop-off before screen 4 leaves with nothing — which is most of the drop-off, because screens 2 and 3 are where all the typing is.
**Confidence:** high on the counts; the framing is judgment.

---

## Pinned evidence

`slices/O1-frames/` — nine frames I rendered myself, because O1-1 means `capture-ref/` has none.
Regenerate: serve `apps/rn/dist` (`node_modules/.bin/serve apps/rn/dist -l 4321 -s`), seed
`localStorage['debtPlanner.rnStore']` with a **genuinely cold** store (`paycheck.amount: ''`,
`debts: []`, `requiredExpenses: []`, `prefs.onboardingComplete: false`) via an init script, then
`goto('/onboarding')`. ⚠️ **Any seed that carries income *and* an obligation lands on Today instead** —
that is O1-1's mechanism, and it is the single thing to get right when re-running this.

| frame | what it shows |
|---|---|
| `phone-light-1-welcome.png` | the first screen as it actually ships — both CTAs, the demo door intact |
| `phone-light-2-paycheck.png` | the `NEXT PAYCHECK` card asserting a date never asked for (O1-4) |
| `phone-light-4-completion-ALL-SKIPPED.png` | both steps skipped, and the finish line still names a payday (O1-5) |
| `phone-small-320-welcome-ONE-OF-THREE.png` | 320pt: one value prop of three, no scroll indicator (O1-7) |
| `ipad-landscape-welcome-NO-WIDTH-CAP.png` | 1194pt: no width cap anywhere in the flow (O1-6) |
| `phone-welcome-2x-text.png` | 2× text: the CTA stack takes two thirds of the screen (O1-7) |
| `handoff-today-free-tier.png` | the real post-onboarding Today, free tier — Guardian slot is a pitch (O1-12) |
| `handoff-today-skipped-all.png` | the skip-everything landing, which is better behaved |
| `odd-input-nan-completion.png` | after entering a NaN debt: "Add a debt any time…" to someone who just did (O1-9) |

---

## What I could not judge

- **Anything a still cannot show.** The keyboard-avoidance behaviour `OnboardingLayout:23-27` was written
  for (the decimal-pad has no return key on iOS, and this once trapped onboarding un-advanceable on
  device) is not reproducible on web. **Device-owed → P6.14.**
- **Real Dynamic Type.** My 2× frame is the same CSS approximation the matrix uses, with the same caveat.
  It happens *not* to over-report here because `Button` carries no `maxFontSizeMultiplier` — but that is
  an argument, not a measurement.
- **VoiceOver through the flow.** The a11y capture for onboarding is Today's tree (O1-1), so **A1 has no
  onboarding data either.** Reading order, the progress dots' announcement, and focus after an inline
  validation error are all unmeasured on this surface.
- **Where people actually drop off.** `track()` fires `demo_started` / `demo_exited`, and I found no
  funnel event for entering, skipping or completing an onboarding *step*. Every drop-off claim in this
  slice is reasoned, not observed. Adding those events would be **[STRUCTURAL]**.
- **Whether the wrong payday horizon (O1-4) materially moves the plan.** That is arithmetic, and it is
  **P6.10's**.
- **First launch on a real cold install** — I seeded storage rather than clearing it. The splash gate
  (P6.6), the storage-locked path and the iCloud restore offer all sit in front of Welcome on device and
  none of them is in anything I rendered. **M3 and P6.14 own that.**

---

## The one change I would make

**Re-shoot the matrix's `onboarding` row against a cold seed, before any other lens files a word about
this surface (O1-1).**

Not because it is the worst thing here — O1-9 is — but because it is the one finding that **changes what
other findings exist**. Fifteen frames and one a11y tree are currently labelled `onboarding` and contain
Today. Four visual lenses and A1 are reading them right now and will report "no findings" on the app's
highest-traffic surface, and that verdict will look like coverage in `SYNTHESIS.md`. The fix is one line
in `p6.8-matrix.shot.ts:107` — give the onboarding surface a `seedOver` that clears `paycheck.amount`,
`debts` and `requiredExpenses`, so `inferOnboarding` cannot promote past the guard — and the same in
`p6.8-a11y.shot.ts:52`.

⚠️ **And then close the class, not the instance.** The matrix already prints `⛔ UNREACHED` for a recipe
that fails; it prints nothing for a recipe that reaches *the wrong screen*, which is the strictly more
dangerous outcome because it produces a file. Every `Surface` should assert one thing it expects to see
before the shutter fires — `ready` already exists on the interface (`p6.8-matrix.shot.ts:63-64`) and is
used by nothing. `onboarding` wanting `getByText('Get started')` would have failed loudly on the first
run. **This repo's stated defect class is "a destination with no tested door"; this is its mirror — a
door with no tested destination.**

---

## ⚠️ AMENDMENT — filed after the rest of the slice, and it contradicts an in-flight fix

### O1-18
**Severity:** blocker · supersedes nothing, but **amends O1-1's mechanism and refutes the fix now in the working copy**
**Step:** the instrument · **Evidence:** measurement below · working copy of `apps/rn/tests/shots/p6.8-matrix.shot.ts` (uncommitted at the time of writing: `reseed()` + one test per surface, docstring at `:186-205`) · `data/migrations.ts:112-122`
**Finding:** While I was writing this slice, another lens found the same wrong frames and landed a fix in
the working copy. Its docstring states the cause as: *"the PREVIOUS surface's app is still alive when the
next seed is written, and its 500 ms autosave debounce fires and puts its own store back over the blob."*
**Measured, that is not what makes the onboarding frame wrong** — and the fix, as written, will not fix it.

The discriminating run: a **brand-new browser context, nothing navigated before it**, one init script, the
matrix's exact onboarding seed (`scenario()` + `prefs.onboardingComplete: false` — i.e. `paycheck '2000'`,
one debt, one bill), straight to `/onboarding`:

```
ISOLATED, matrix seed → "Get started" count: 0 | "Payday Guardian" count: 1
persisted prefs.onboardingComplete after load: true
```

The same isolated run with a **cold** store (`amount: ''`, `debts: []`, `requiredExpenses: []`) reaches
Welcome at all five widths and both themes. So the defect reproduces **with no prior page, no accumulated
init script and no live app writing behind anything** — the debounce race cannot be its explanation. The
app read the blob, `runMigrations` → `inferOnboarding` saw income **and** an obligation, **promoted
`onboardingComplete` to `true` over the explicit `false`**, and the route guard closed `/onboarding`.

**Why it costs:** `SURFACES[onboarding]` is unchanged at `:107` — still `scenario()`'s money under a
`prefs.onboardingComplete: false` that the app overrules on read. **Per-test isolation does not touch
that.** If the matrix is re-shot on the current working copy, the onboarding row comes back as Today
again, and this time it will carry a fix's authority: four visual lenses and A1 will read it as
*corrected* coverage. The seed itself has to clear `paycheck.amount`, `debts` and `requiredExpenses` —
`demo-containment.spec.ts:22-27`'s `NOT_ONBOARDED` is the shape that already works.

⚠️ **Both mechanisms can be true.** I am not claiming the debounce race is imaginary — the fix's own
account of surfaces re-shot and still wrong is evidence of *something*, and per-test isolation is right on
its merits. I am claiming it is **not sufficient**, and that the onboarding row specifically has a second,
independently sufficient cause that the fix leaves in place. ⚡ This is the repo's own law about agent
mechanisms firing on an agent's fix: *a finding that arrives with an explanation is a hypothesis, and the
explanation is the part that fails.*

**Confidence:** high on the measurement (single isolated context, seed quoted verbatim from
`p6.8-matrix.shot.ts:55` + `:107`, `localStorage` read back after load showing the flag flipped to `true`).
Medium on the claim that the debounce race is *not* also happening elsewhere — I did not test the loop.

**Reproduce:**
```bash
node_modules/.bin/serve apps/rn/dist -l 4322 -s
# fresh chromium context, addInitScript writing debtPlanner.rnStore = the matrix seed, goto /onboarding
```
