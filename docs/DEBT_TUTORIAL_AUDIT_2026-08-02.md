# Guardian Tutorial — Audit Gate 3.5.3.9 · Round 1

**Date:** 2026-08-02 · **Subject:** Debt v1.7 Phase 3.5.3, the Guardian walkthrough (beats 1–7)
**Method:** 7 adversarial lenses, run in parallel on Fable 5, each blind to the others
**Verdict:** ⛔ **DOES NOT PASS.** ~30 findings. **Every one was green in CI at the time.**

> The gate's exit requires consensus **AND** the premium bar judged MET **AND** an owed-ledger empty
> except device-gated items. Round 1 fails on all three. A correctness-only gate would have closed here —
> which is precisely the argument for having run it.

**Verification protocol:** load-bearing negative claims were re-checked against the code before being
accepted ([[feedback_verify_critic_claims_on_user_work]]). Items marked **CONFIRMED** were verified
directly against source; **SUSPECTED** means argued but not executed.

---

## A. Honesty & tier — what [D9] rested on

<details open>
<summary>4 findings · <b>A1 is the shipping risk</b></summary>

| ID | Sev | Status | Finding |
|---|---|---|---|
| **A1** | **HIGH** | CONFIRMED | **The finale tells a free user "you decide what to hold." They cannot.** `showAdjust = isPremium && …` (`PaydayGuardianCard.tsx:111`) and the card's sheet is the *only* path to `setCushionFloor` in the app. The sentence sits in the one beat [D9]'s honesty depends on. |
| **A2** | **HIGH** | CONFIRMED | **Beats 4–5 narrate premium behaviour as "your Guardian"** — safety net, attestation, release (`guardianSelectors.ts:130,145`) and Recovery are all premium-only. The finale names only the *holding*: ~⅓ of what was demonstrated. A free user's first real short paycheck contradicts what they were told. |
| **A3** | MED | CONFIRMED | **Beat 2: "The bar is the whole paycheck."** Domain is `cushion + deployedToDebt` (`PaydayGuardianCard.tsx:101`) — post-obligation discretionary only (~$740 of $2,000), with the real figure in the hero directly above. Also unnamed: the third "Safety net" zone. |
| **A4** | MED | CONFIRMED | **The 3.5.3.5.8 fallback created a new copy defect.** Plan-less users are offered the walkthrough (`index.tsx` invite fallback); the finale tells them to look at their own card and they land on "Set up your paycheck". |

</details>

## B. Correctness

<details open>
<summary>4 findings · <b>B1 breaks the user's own action; B3 poisons a safety mechanism</b></summary>

| ID | Sev | Status | Finding |
|---|---|---|---|
| **B1** | **HIGH** | CONFIRMED | **The scripted surprise UN-ATTESTS the user's tap.** `substrateProducers.ts:79` — `if (store.billsAttested) return { …, billsAttested: false, pendingReserveWalkback: true }`. ~900ms after the user acts, the net jumps back up and the control reverts to the un-attested prompt: it reads as if their tap silently failed. Beat 4's copy never mentions the restore. Re-tapping re-fires `playReserveStory`, stacking a second surprise. |
| **B2** | **HIGH** | SUSPECTED (arithmetic-backed) | **The milestone ack outranks the release ack.** Persona seeds at 24.67% paid (`sandboxScenarios.ts:95-97`); roll 1 crosses 25% → `pendingMilestone` (`payday.ts:162-164`) → VIS-4 ranks milestone above `reserve-release` (`index.tsx:180-197`) → `today-ack` never mounts → payoff spotlight measures null → interactive beat with no rect → **no scrim renders at all**. Payoff missing *and* screen unguarded. |
| **B3** | **HIGH** | CONFIRMED ×2 lenses | **The no-real-writes guard fires on every step.** `TutorialCoach.tsx:38` writes the real store (`updatePrefs({tutorialStep})`) while the sandbox subtree is mounted; `before` never advances (`StoreContext.tsx:45-59`), so it re-fires all session. Dev-only today (e2e runs a prod bundle, `__DEV__` false — why no test saw it). **At Phase 6 with Sentry wired this becomes production error spam**, and the guard built to catch real corruption becomes 100% noise. It also hollows out the plan's own "real plan **provably** untouched". |
| **B4** | MED | CONFIRMED | **Geometry:** nothing tracks window **width** — a Split View drag leaves ring, hole and scroll at pre-resize coordinates (`use-spotlight.ts` deps) · `stageBottom` can collapse ≤ 0 at large Dynamic Type (dock has no max-height/scroll) · `HEADER_H = 56` is constant while the header scales · the dock ignores `insets.bottom`, putting Next/Finish in the home-indicator swipe zone. |

</details>

## C. Accessibility

<details open>
<summary>3 findings · <b>C1 makes an interactive beat impossible, and contradicts my own recorded note</b></summary>

| ID | Sev | Status | Finding |
|---|---|---|---|
| **C1** | **CRITICAL** | CONFIRMED | **The `Slider` never sets `accessible={true}`** (`Slider.tsx:69-72` has role/value/actions but not the prop that makes a View an a11y element). It is absent from the tree; its children are text-less Views. **Beat 3's required action is impossible via VoiceOver** — they reach the sheet, find a heading, "$200" and Save, and can only save unchanged. ⚠️ **My 3.5.2 before-scan recorded the opposite as settled fact** ("already `accessibilityRole="adjustable"` … pre-met by the component"). |
| **C2** | **HIGH** | CONFIRMED | **Beat 4's entire story is silent.** Exactly one `announce()` exists in the tutorial path (per-beat). The surprise, the three rolls, and the release ack that appears at the *top* of the screen produce nothing. Same class as the shipped silent walkthrough, one level down: per-beat announced, per-**event** not. |
| **C3** | **HIGH** | CONFIRMED | **Nothing hides content behind the scrim from the a11y tree** (no `accessibilityViewIsModal` anywhere in `src`). A screen-reader user has full swipe access to what a sighted user is fenced out of, including More. Both branches of what happens on activation are broken, so the fix isn't gated on the device answer. |
| C4 | MED | CONFIRMED | Sub-44pt targets (Skip ≈34pt, attestation, slider hit area) · label-in-name mismatch on "Adjust your line →" (WCAG 2.5.3) · `FormSheet`'s full-screen "Close" backdrop is a focusable element inside the floor sheet · held-reserve amount only exists in a11y-hidden legend. |

</details>

## D. The premium bar — **NOT MET** (binding criterion)

<details open>
<summary>Dedicated reviewer, judged against rendered screenshots of every beat in both themes</summary>

**Per criterion:** progress rail ✅ MET · haptics ✅ MET ("correctly reasoned") · control hierarchy ✅ MET ·
payoff choreography ✅ met in code but **visually unverified** · beat/spotlight motion ⚠️ PARTIAL ·
dock material ⚠️ **cosmetic-leaning partial**.

| ID | Sev | Status | Finding |
|---|---|---|---|
| **D1** | **HIGH** | CONFIRMED | **The frost is a claim, not a material.** `intensity 24` under an **0.82** opaque layer — against `SheetScrim`'s 0.28 and the tab bar's 70. Only ~18% of the blur survives: a solid card with faint smudges, worse in light where they read as rendering artifacts. |
| **D2** | MED | CONFIRMED | **The scrim doesn't participate in the motion story** — four static Views hard-cut between beats while the ring fades. The ring got the motion pass; the darkness around it didn't. |
| **D3** | MED | CONFIRMED | **Dark is the weak theme, not light.** Scrim = `background.primary` at 0.55 — near-black over navy barely dims; the ring does all the work. In light the same maths produces a proper dim. (Inverts the usual concern.) |
| D4 | LOW | CONFIRMED | Interactive-beat guard drops during the ~380ms scroll transit (`local` null → no scrim) — the .5.9 leak reopens briefly · `FloorImpactBar` uses `withTiming` against the app's springs-over-easing motion contract · payoff states have **zero screenshot coverage**. |

> Holistic verdict, quoted: *"This does not read as a tooltip library — it reads as the app coaching
> itself… The architecture is above the bar. The finish is at ~85%."*

</details>

## E. CLAIM-vs-CODE — the new lens, vindicated

<details open>
<summary>8 confirmed false/stale claims — and a diagnosis of how they got here</summary>

| ID | Sev | Status | Finding |
|---|---|---|---|
| **E1** | MED | CONFIRMED | **`TutorialOverlay.tsx` contains two comments ~100 lines apart asserting OPPOSITE scrim behaviour.** The top doc (`:26-30`) and ring comment (`:132-133`) still describe the pre-.5.9 world ("the scrim is gone"); the inline .5.9 comment describes the truth. Same stale claim in `_layout.tsx:29-30` and `tutorialPath.ts:146`. |
| **E2** | MED | CONFIRMED | **`useSandboxStore.ts`'s usage example teaches the known crash** — the fresh-object-selector pattern the repo documents as an infinite re-render loop that "took the whole screen down". Its rationale ("`useAppStore` is hardwired to the singleton") has been false since 3.5.3.0. No production consumer. |
| **E3** | MED | CONFIRMED | **`tutorialPath.ts:83-86` and `:119-121` still assert the pre-[D9] both-tiers split** — the file contradicts itself (`:59` and the LOG both say the constraint is retired). |
| **E4** | MED | CONFIRMED | **`tutorialSelectors.ts:15-17,46` justifies the upgrade re-offer** with "the premium run reaches beats free never does" — post-[D9] both runs are beat-identical. An upgrader is re-offered what they already saw. |
| E5 | LOW | CONFIRMED | `tutorialTargets.tsx:87-89` describes re-registration on layout that **does not exist** · scrim-vs-ring inset claim is false (both `RING_INSET`) · **the LOG mislabels the second haptic** (fires at the attestation tap, not the release) · MASTER_PLAN still headlines "tap-the-surprise" though [D10] replaced it. |
| E6 | LOW | SUSPECTED | `tutorialSession.ts:153-156` claims the surprise is "always absorbable"; `Math.max(25, held*0.8)` exceeds a net under ~$31. |

> **The diagnosis, which is the most useful thing this round produced:**
> *"Both prior incidents were fixed in code and in the LOG, but the stale claims survived in the
> doc-comments of NEIGHBOURING files — the sweep after .5.9 and [D9] updated the files that changed,
> not the files that talked about them."*

</details>

## F. Wiring

<details>
<summary>Dead seams and unread channels — mostly benign, one that matters</summary>

`publishSandbox`'s snapshot has **zero readers** (the 3.5.2 exit-gate assertion it was built for was never
written) · `HARNESS_SCENARIO_IDS` unused (the e2e hardcodes the id) · `useSandboxStore` production-dead ·
`guardian-line` target rendered but no longer referenced by any beat · `runBeats`' `surprise` param and the
whole `BeatResult` channel unread in production · `tutorialRunFor` bypassed by three inline
re-implementations. **None user-visible**; all are the "built, not called" shape this phase keeps hitting.

</details>

## G. What this round says about the method

<details open>
<summary>The finding behind the findings</summary>

Several defects are in code written **in the same session, while explicitly applying the rule they
break**:
- **A3** violates "every line must be true of what's on screen" — the rule 3.5.3.3.3 was built around.
- **C1** contradicts a before-scan note I recorded as a *correction*, having read three a11y props and
  never checked the fourth that makes them apply.
- **A4** is a defect introduced *by* the fix that a before-scan added to prevent a different defect.
- **E1/E3** are the CLAIM-vs-CODE class landing in the comments I wrote to explain the honesty rationale.

**Applying a rule is not the same as verifying it held.** Only an adversary with fresh eyes caught the
difference — and the correctness suite stayed green through all of it.

</details>

## H. Fold plan — ✅ ALL OF IT (Jason 2026-08-02: "Everything gets folded in. No backlog. No debt.")

<details open>
<summary>Ordered by shipping risk, one block, then re-audit</summary>

1. **Honesty/tier (A1–A4)** — the only findings with a *shipping* consequence. Finale must name all three
   premium behaviours and drop "you decide what to hold"; beat 2's bar copy; beat attribution; the
   plan-less audience.
2. **Correctness (B1–B4)** — the un-attest reversal (B1) and the milestone/ack collision (B2) both break
   the beat the user just acted on. B3 must be fixed before Sentry lands, or the guard ships as noise.
3. **Accessibility (C1–C4)** — C1 makes a beat impossible; C2/C3 are structural and code-addressable.
4. **Premium bar (D1–D4)** — the binding criterion. Frost tuning, scrim motion, dark-mode dim.
5. **Claims + wiring (E, F)** — including a sweep of *neighbouring* files, not just changed ones.

Then re-run the lenses that found something. **Consensus is the gate, not the first green run.**

**Device-owed (unchanged, legitimately deferred):** VoiceOver end-to-end · the haptics' real weight ·
AX3/AX5 layout · whether VO activation under the scrim bands is action-dispatched or touch-synthesized.

</details>

---

## I. Fold outcome — 2026-08-03 · ALL FOLDED

<details open>
<summary>Every finding closed in one block. Two were closed by <i>correcting the claim</i> rather than the code, and one is deliberately unresolved pending a design call — all three are named below rather than quietly counted as done.</summary>

| ID | Closed by |
|---|---|
| A1–A4 | Finale rewritten (names all three premium behaviours, drops "you decide what to hold"); beat-2 bar copy; attribution; plan-less audience. |
| B1 | Copy names the walk-back; spotlight follows either ack. |
| B2 | `pendingMilestone` suppressed at the sandbox source, not papered over downstream. |
| B3 | Guard compares field-by-field excluding `prefs`, and advances its baseline. |
| B4 | Layout-invalidate subscription (covers Split-View resize + reflow) · dock capped at 60% with a scrolling body and a pinned nav row · `headerHeight()` scales with Dynamic Type · dock carries `insets.bottom`. |
| C1 | `Slider` gets `accessible` + `text` in its value. |
| C2 | Payoff acks announced, not just beats. |
| C3 | Coached screen hidden from the a11y tree on scripted beats. |
| C4 | Label-in-name fixed on **four** controls (audit flagged one) · Skip and Slider to 44pt · `FormSheet`'s full-screen backdrop removed from the a11y tree · the cushion/net/to-debt **amounts** added to the narrated group — they existed nowhere in the a11y tree before. |
| D1 | Frost at intensity 70 under a 0.55 tint — a material, not a claim. |
| D2 | The hole now irises open/closed on the app's own spring. Required splitting the scrim into a visual layer and a hit layer: a travelling band sat over the coached control for the length of its journey, which the e2e surfaced as flakiness and a user would have met as a tap that does nothing. |
| D3 | Scrim uses the `scrim` token, and the 0.55 multiplier is gone (it would have re-dimmed an already-alpha'd colour to ~0.30). **Verified by screenshot in both themes.** |
| D4 | Transit keeps the scrim via an explicit `settling` flag — the two kinds of null (travelling vs absent) owe opposite behaviour · `FloorImpactBar` springs · payoff states now have both-theme screenshot coverage. |
| E1–E3, E5 | Stale claims corrected at all sites, incl. the two contradictory comments in one file, the LOG's haptic mislabel, and the "tap-the-surprise" headline in both plans. `tutorialTargets`' phantom "re-registers on layout" was made **true** instead of deleted — it turned out to be the mechanism B4's resize gap needed. |
| E6 | Confirmed by arithmetic, not left as SUSPECTED: the `max(25, …)` floor and the `|| 100` fallback both overflowed the net they claimed to size themselves under. Now `min(held, …)`, and no surprise at all when nothing is held. |
| F | `useSandboxStore` deleted (dead, and its example taught a known crash) · `tutorialRunFor` now the single definition across all three call sites · `publishSandbox` given the exit-gate assertion it was built for, so the channel is live rather than removed. |

### Closed by correcting the claim, not the code

- **E4 — the upgrade re-offer.** The stated reason ("the premium run reaches beats free never does") has
  been false since [D9] made both runs beat-identical. But *whether* an upgrader should replay all seven
  beats for one changed paragraph is a decision belonging to the 3.5.1 design gate that set the audience
  matrix. Behaviour unchanged; the false justification replaced with what is actually true.
- **F, partially.** `HARNESS_SCENARIO_IDS`, `guardian-line` and the `BeatResult` channel were listed as
  "built, not called". They are test- and 3.5.5-facing seams with live assertions, not dead code — the
  audit's label was half right, and deleting them would have removed working capability to satisfy a
  metric. Recorded rather than acted on.

### ⚠️ Open — needs a call, not a fix

**The Guardian card's stacked text links are ~34–36pt tall** (`Adjust your line`, `See your forecast`,
`How this works`, the attestation), under the 44pt minimum. Unlike Skip and the Slider — both of which
grew into space their rows already had — these sit 12pt apart in the flagship card, so `hitSlop` large
enough to reach 44 makes adjacent targets overlap, and 44pt rows add ~16pt each and change the card's
vertical rhythm. **That is a visual-design change to a shipped surface**, which is Jason's call, not a
fold. Everything else in C4 is done.

### Found during the fold, not by the audit

- **`npm run typecheck` was RED on master** — three pre-existing errors in `tutorialPath.test.ts` (node
  globals absent from `tsconfig`). A permanently-failing gate is worse than no gate: it trains everyone
  to skip its output, and a real regression hides in the noise. Fixed; typecheck is now clean.
- **Two tests were pinning the defects.** `tutorialPath.test.ts` asserted the literal phrase A1/A2
  replaced, and the e2e asserted `you decide what to hold` — *the exact sentence A1 identified as a lie* —
  was **visible**. The suite could not have caught A1, because it was holding it in place. Both now pin
  the intent (premium named, all three behaviours present, the lie absent) instead of the wording.
- **The finale ran six lines** once the honest copy was in. Caught by looking at the render, not the
  diff. Tightened with all three behaviours intact.

**Gate:** typecheck clean · lint clean · app-layer + scenario suites green · **116/116 e2e, no flakes** ·
arc, finale and reserve-payoff screenshots reviewed in **both** themes.

</details>

---

## J. ROUND 2 — 2026-08-03 · ⛔ does not pass · the fold shipped a trap

<details open>
<summary>Three lenses, ~13 findings. The most important one was <b>introduced by round 1's fix block</b>.</summary>

### The show-stopper the fold created

`Card` sets no flex properties and Yoga's default `flexShrink` is **0**, so [B4]'s cap chain
(`dockInner` maxHeight → body → dockScroll) stopped dead at the Card. `overflow: 'hidden'` then **clipped**
the card instead of the ScrollView bounding it — and what sits at the bottom of the card is the nav row.
At large Dynamic Type the change written to guarantee a reachable Next produced a walkthrough with **no
Next, no Back and no Skip**, while the scrim blocked Today and `holdTabs` blocked the tabs.

A one-property omission turned a trap-prevention fix into the trap. It is also invisible at default text
size, which is why every screenshot and the whole e2e suite stayed green through it.

### Two holes in the guarantee the fold was making

- **The cutout passed touches on SCRIPTED beats.** Four of the seven spotlight the *whole Guardian card*,
  and that card is full of live controls — so a stray tap could open the floor sheet with no coaching
  line, push `/cushion-forecast` out from under the still-mounted overlay, or hit the attestation, which
  fires **beat 4's entire scripted story during beat 1**. Only the replay link had ever been guarded, one
  leak at a time. The top-of-file promise ("a scrim blocks stray taps, so a user can't wander into a
  sheet or another tab") had been false since 3.5.3.3.1. Splitting visual from hit geometry for [D2] is
  what made the fix a single flag rather than a rework.
- **VoiceOver activation bypasses hit-testing.** A double-tap dispatches straight to the focused element,
  so the scrim — the entire touch model — never fenced screen-reader users at all. The tab bar was
  reachable on every beat; More on the interactive ones, where the whole screen is deliberately exposed.
  That is the 3.5.3.5.9 leak still open for exactly the users [C3] was written for. **Found independently
  by both a11y reviewers**, which is usually what a structural miss looks like.

### The rest

Stale-measure race reintroduced in the new layout subscription (ten lines below the main effect that
documents it) · `measureInWindow` can drop its callback and hang `settling`, sealing an interactive beat ·
the guard's blanket `prefs` exclusion was wide enough to hide `isDemoMode` and `onboardingComplete` writes
· **[A4] was fixed in the free finale and not the premium one**, which still promised "your real paycheck"
to a user who may not have one · four more stale claims, two of them written *by* round 1 while it was
correcting that class · `sandboxBeats`' "one real path" comment described an intention, not the code.

### And two more tests that were overstating

`"beat 3 lets a user move the real line"` **never moved the slider** — it opened the sheet and saved the
unchanged value, and `FloorImpactBar` renders for unchanged values too ("Same cushion, same plan"), so a
regression that broke dragging outright would have passed. `"confirming your bills shrinks the net"` never
checked the net. Both now do what their names say. A third was pinning wording again — the same lesson
for the third time in two rounds.

**Gate after the round-2 fixes:** typecheck + lint clean · app + scenario suites green · **116/116 e2e, no
flakes** · arc re-shot in both themes.

</details>

## K. ROUND 3 — ⛔ OWED, NOT RUN

<details open>
<summary>Both lens agents died on an API session limit. This gate is NOT closed.</summary>

What was verified **by hand** in their absence — enough to trust the round-2 fixes, not enough to close a
gate: the collapsed hit-hole is genuinely full coverage (band 2 spans `top: 0`→`bottom: 0` alone) · the
shrink chain has no other missing link (`Motion`[maxHeight] → `Card` → body → ScrollView) · the prefs
allowlist covers every `updatePrefs` reachable during a session, and `markTutorialSeen` spreads existing
prefs by value so the field diff sees no other change · the tab-button override's real cost was the
Android ripple, since restored.

**Why this is not consensus:** round 2's central finding is that *a fix block can ship its own
show-stopper*, and round 2 was a large fix block. Self-verification is precisely the thing that failed in
round 1 — every one of those ~30 findings was green in CI, written by someone applying the rules they
were breaking. **Round 3 must actually run before 3.5.3.9 closes.**

</details>

---

## L. ROUND 3 — 2026-08-04 · ⛔ does not pass · 16 findings, most created by round 2

<details open>
<summary>Three <b>rotated</b> lenses (per the consensus rule, not a repeat of rounds 1–2). The rotation earned its keep: the new angle found the worst finding, and no correctness or a11y reviewer was positioned to see it.</summary>

### The one the rotation found: replay didn't replay

`startTutorial()` always began at `resumeIndex(prefs.tutorialStep)`, and only `leave()` clears that step —
so a force-quit, a crash, or iOS evicting the backgrounded app strands one. Both explicit replay
affordances ("How this works" on the Guardian card, the More row) went through it. A user interrupted at
beat 5 who came back later and tapped a control whose own accessibility hint **promises it "replays the
walkthrough"** landed on **step 5 of 7**: the deliberately at-risk card, a shortfall scaled from their
real paycheck, listing **their real debt names** (`personalScenario` maps them in), with none of beats
1–4's framing that any of it is an example.

The app opening its own explainer on a fabricated crisis about the user's own money. No test could have
caught it — every suite starts from a clean `tutorialStep`, and resume-after-interruption and
replay-on-request were one code path. Resume stays the default; the replay entries now pass `resume: false`.

### The rest

`?run=premium` was ungated on a route registered in the production Stack — one URL could hand a free user
the premium finale, the single string [D9]'s honesty rests on · `setImpact` was the one published shell
value missing the cleanup its two siblings carry (with a comment above them explaining exactly why it
matters), so a later session's beat 1 could paint a `FloorImpactBar` the user never earned · **the 500ms
measure timeout added in round 2 turned a hang into a PERMANENT degradation** — nothing retried, and on an
interactive beat that renders no scrim at all · beat 4's payoff phase kept the touch hole over the ack, so
"Got it" was live mid-story and the user could swallow the beat's payoff before reading it · Undo didn't
cancel the story it had triggered, so the narration ran on over the user's own withdrawal · the guard
would have false-fired on `drainPendingActions` landing from the background — **[B3]'s noise arriving from
the opposite direction**, and at Phase 6 it would poison the one signal built to prove the real plan is
untouched · the prefs diff was blind to key deletions · the first iris of every session opened from the
screen's top-left corner · beat 6's copy ("yours to overrule") invited a tap the round-2 fence refuses.

Plus six stale claims — **three written by round 2 while it was correcting that exact class**, including a
[E4] correction that had itself acquired a stale quote of copy [A4] had already deleted.

### And two more tests that would pass with the feature deleted

`'the scrim blocks stray taps on a scripted beat'` asserted only that the scrim was **visible** — the
container is `pointerEvents="box-none"`, so it never touched the layer that does the blocking, and passed
identically with `passThrough` hardcoded true. `'the tabs are held while a session is running'` asserted
the overlay was still visible after a forced tab press — but the overlay renders over *every* tab, so it
held even if the press had navigated. Both now assert the thing they are named for; both pass.

**Gate after the round-3 fixes:** typecheck + lint clean · app + scenario suites green · **116/116 e2e, no
flakes**, including the two strengthened tests · arc re-shot in both themes.

### ⚠️ Open — a DESIGN call, deliberately not folded

**The "Example" marker is one chip on one card, and the rest of the screen shows the user's real debts
inside fabricated states.** `personalScenario` seeds real income, real cadence and real debts by name and
balance (`sandboxScenarios.ts:272-283`); the hero, required-actions, recommended-actions and affordability
cards all render sandbox money with **no marker at all**. On beat 5 the cover-now list is the user's actual
bills inside an invented $200 shortfall. A screenshot cropped below the Guardian title row carries zero
indication that any of it is an example.

This contradicts **[D6], which Jason settled** ("the Example marker stays CARD-ONLY — no hero marker, it
would double the chrome"). The new fact is that the scenario seeds *real* debt names, which that decision
may not have weighed. **Not folded** — reopening a settled design decision is Jason's call. → **3.5.3.11**.

</details>

---

## M. ROUND 4 — the PREMIUM BAR re-judge · ✅ **BAR MET** (2026-08-04)

<details open>
<summary>The gate's binding exit criterion. Round 1 judged it <b>NOT MET</b> at "~85% finish"; round 4 judges it <b>MET</b> at ~97%, from fresh both-theme screenshots of all 7 beats + both finales + the payoff.</summary>

**All six named criteria MET:** beat transition + travelling spotlight · dock material · progress
affordance · haptics (code) · payoff choreography · control hierarchy.

**Light/dark parity — resolved, and inverted again.** Round 1 found DARK was the weak theme. Round 4 finds
them effectively equal, with dark now arguably the stronger set. Neither is visibly weaker on any beat.

**The two changes just shipped both landed well.** The 44pt rows read "airy-intentional, not gappy"; the
`· Example money` marker reads as calm metadata in the app's own label voice, "not clutter, not an
apology" — and is doing real disclosure work.

**Holistic, quoted:** *"This now reads as Debt coaching itself… Tooltip libraries don't restage the store,
move a debt-free date, or say 'while I got to know your bills.'… The finish is at ~97% — what remains is
three spacing nits, not a character problem."*

### Non-gating polish it named

1. 4–6pt more clearance between beat 4's ring and the "Your call" label above it (still tight after the
   `xxs`→`xs` bump made during 3.5.3.10).
2. The Guardian card's bottom padding (~37pt) is visibly tighter than its new ~48pt inter-row rhythm.
3. On beat 5 the ringed card is taller than the stage, so the ring's side edges peek out beside the dock —
   the least composed frame of the seven.
4. No screenshot in the suite captures `FloorImpactBar` mid-flight, so criterion 5 is only partly
   screenshot-grounded.

**Standing caveat (unchanged):** haptics and spring *feel* are code- and still-verified only. They are
owed the Phase-6 device pass — no web export can feel them.

</details>

### Round 4's other two lenses — ⛔ 8 more defects, and the owed ledger was empty

<details open>
<summary>The premium bar passed; correctness did not. The pattern held for a fourth round.</summary>

**The 44pt rows reopened the route-escape leak** — my own change. They kept `hitSlop={8}` while their
margins shrank to 4pt, so every row's touch region overlapped its neighbours' and later siblings win RN
hit-testing. On beat 3 the bottom edge of the *lit cutout* sat inside "See your forecast"'s slop: a tap
aimed at the coached control pushed `/cushion-forecast` out from under the live overlay — the exact leak
3.5.3.5.9 and `passThrough` exist to prevent. The card's own comment names slop-overlap as the disease.

**The measure retry covered one of two call sites.** The settle re-measure fires 380ms after the
stage-scroll — the heaviest frame in the beat, the one the scroll itself caused, so the likeliest to time
out — and still turned a timeout into a permanent no-scrim, no-ring beat. Both sites now share one helper.

**VoiceOver could still push a route** from the two interactive beats, where the screen is deliberately
exposed so the user can reach the control. Round 2 named this residue in its own text and never closed it.

**The overlay root lacked `collapsable={false}`** — the other half of the `measureInWindow` subtraction its
own target registry documents. Android flattens layout-only views; `origin` would silently stay `{0,0}`.

Plus: `resume: false` left `prefs.tutorialStep` pointing at the abandoned beat, so round 3's trust fix
survived one exit away · `dockH` was the fifth published shell value and the only one still without a
cleanup · the plan-level store diff was still single-sided · five stale comments, including a miscount
written by the block fixing that class.

### The owed ledger was, in fact, empty

The gate's exit says "an empty owed-ledger **except device-gated items**". The device-gated items existed
— in an audit doc and in code comments — but had never been transferred to the Phase-6 Device-QA ledger,
which is the document the device pass is actually run from. Ten items now live there under a new
**"§3.5.3 the Guardian WALKTHROUGH"** block. Two further discoveries came with it: a `3.5.3` **numbering
collision** (the native block also has one, and the checklist's closing line meant that one), now flagged;
and **[E4] was parked against a design gate that is already closed**, so nothing would ever have
resurfaced it — filed to 3.5.6 with the other floaters, plus a new 3.5.6b for the missing Maestro flow.

**Gate:** typecheck + lint clean · suites green · **116/116 e2e, no flakes** · arc re-shot both themes.

</details>

---

## N. ROUND 5 — 2026-08-04 · ⛔ does not pass · the tutorial had broken the ordinary app

<details open>
<summary>Scoped to the residual (premium bar + owed ledger had converged) plus one new rotation. The rotation found a whole-app regression that four rounds of tutorial-focused auditing could not see.</summary>

### BLAST RADIUS — the rotation, and the finding of the round

Four rounds of fixes landed in **shared** components — `Slider`, `FormSheet`, `MoreButton`, the whole
app's `tabBarButton`, the flagship Guardian card, `StoreContext`. Every round verified the tutorial.
**Nobody had checked whether this work broke the app for users who will never open it.**

**The `tabBarButton` override was reverted entirely.** Rounds 2–4 replaced the framework's tab button
with a plain `Pressable` so the tab bar could leave the a11y tree during a walkthrough. **The premise was
wrong**: `holdTabs` hooks the `tabPress` EVENT, which the button emits from its own `onPress` — the same
path VoiceOver activation takes. Navigation was blocked for screen-reader users all along; the real
defect was a focusable-but-inert tab, a polish issue only a device can judge.

What the override cost was paid by everyone. The framework passes `href` to that button, react-native-web
renders any View with `href` as a real `<a>`, and `PlatformPressable` exists partly to `preventDefault()`
it. A plain Pressable doesn't — so **on web every tab press fired SPA navigation AND the anchor's
document navigation: a full page reload, dropping in-memory state.** It also dropped `role="link"`, the
pointer cursor, the iPad rail's hover effect, and the theme-derived ripple colour.

**The e2e stayed green through all of it, because a reload lands on the right URL.** Green tests on wrong
evidence — the same shape as the tests that were pinning defects, one level up.

### The one-member pattern, fifth round running

Round 4's own comment on the forecast link named the class — *"a VoiceOver double-tap dispatches straight
to the focused element and never goes through hit-testing"* — and then fenced exactly one member of it.
Still activatable on the interactive beats: the **attestation on beat 3** (firing beat 4's entire scripted
story mid-beat, flipping the spotlight and making the beat's own control untouchable), the **adjust row on
beat 4** (opening the floor sheet carrying the wrong beat's coaching line), the hero's sheets, and the
action-list toggles. `MoreButton`, the tabs, and the forecast link had each been patched individually —
one member per round while the class stayed open.

**Fixed at the registry, not at another control.** `TutorialTarget` gains a `control` flag; any coached
control that isn't the beat's active subject fences itself out of the a11y tree. The card stays unaware of
the walkthrough (3.5.3.3.1 holds), and the fix covers every current and future coached control at once.

### The rest

The forecast fence keyed on the **sandbox brand** rather than "a walkthrough is running", so it would have
followed the sandbox into 3.5.4's demo mode as a live-looking, dead, screen-reader-invisible link ·
`lastRowSpacer` fired when `GuardianProofStrip` was the last element, padding the wrong thing · FormSheet's
backdrop was `aria-hidden` **and still in the web tab order**, across all 8 sheets · six more stale claims,
including one contradicted by the comment directly below it and a phantom `"?"` affordance asserted in
three files.

**Verified fine by the blast-radius sweep:** `Slider`'s two real consumers, `MoreButton` (no stranded
state — the session is memory-only and Skip always renders), the Guardian card's +30pt (costs scroll, not
clipping), `allowRealStoreWrite` (report-only, synchronous), the `?run=` gate (zero external consumers).

**Gate:** typecheck + lint clean · suites green · **116/116 e2e, no flakes**.

</details>

## O. ROUND 6 — 2026-08-04 · ⛔ does not pass · the a11y fences were a no-op on WEB

<details>
<summary>~20 findings across 3 rotated lenses · fixed in <code>043a501</code> · first round run on Opus 5, not Fable</summary>

**Model note:** rounds 1–5 ran on Fable 5. Jason's new standing rule (2026-08-04) caps Fable at the first
**two** passes of any audit; every later pass runs on Opus 5. Round 6 is the first under it. The rule is
cost-driven, and this gate is the evidence for it: the highest-value findings of rounds 3, 5 and 6 all came
from **rotating the lens**, not from model tier — a new angle finds what a stronger model pointed the same
direction does not.

### The finding of the round: four rounds of a11y work never existed on web

`react-native-web` **0.21.2**'s prop allowlist contains **neither** `accessibilityElementsHidden` **nor**
`importantForAccessibility`, and `createDOMProps` drops unrecognised props silently. Every fence in this
feature was written as that longhand pair, at six call sites — the coached screen, the `control` fence,
`MoreButton`, the forecast link, the overlay scrim, all sheet backdrops. **On web, every one fenced
nothing.** Round 5 had even added a comment asserting the opposite ("on web `accessibilityElementsHidden`
becomes `aria-hidden`") as the justification for the FormSheet change.

The suite stayed green through all of it **because nothing ever asked the document what it contained** —
the same green-on-wrong-evidence shape as round 5's full-page-reload finding, and the fourth "test on wrong
evidence" this gate has produced.

**`aria-hidden` is the whole fix, and it makes the code smaller.** RN 0.85.3 expands `aria-hidden` into
*both* native props itself (`View.js:69-74`), and RNW renders it as the DOM attribute — so ONE prop covers
iOS, Android and web, where the hand-rolled pair covers only native. Centralised as `a11yHidden()`; the
asymmetry is now written down where the next person will look.

**Verified against the rendered document, not the diff**, and now pinned by a permanent e2e test: scripted
beats produce a full-viewport `aria-hidden` region (351,348px² of a 351,348px² viewport); the two
interactive beats deliberately do not.

### The one-member fix, sixth round running — three more instances

- **Sheet backdrops.** Round 5's "across all 8 sheets" counted FormSheet's *consumers*, not the class.
  `AnimatedSheet` and `PaydayCaptureSheet` carried the identical labelled full-screen `"Close"` — reached by
  `LogPaymentSheet`, `BillBreakdownSheet` and the payday capture flow. Hoisted to one `SheetBackdrop`.
- **`measure()` had THREE call sites**, not the "two" the comment claimed *while fixing that same class*.
  The layout subscriber had no retry **and demoted a good rect to null** (`sameRect(prev, null)` is false),
  so one timed-out reflow — Dynamic Type, an iPad Split View drag, the card growing when Recovery renders,
  i.e. exactly the events [E5]/[B4] added it for — permanently lost the ring and its cutout.
- **The `control` fence reaches only coached subjects** — two controls. The hero's sheets and the action
  toggles, which round 5 listed as leaks *in the same paragraph*, are ordinary Today controls the registry
  structurally cannot reach. Closed with `TutorialFence` on **regions** rather than controls.

### The two fences that disagreed

The a11y fence keyed on `interactive`; the touch fence on `interactive && !payoffShowing`. So through beat
4's whole payoff the screen was **sealed for fingers and open to VoiceOver**, and the ack's own "Got it" was
reachable by exactly the double-tap `passThrough` exists to prevent — dismissing the payoff mid-narration
for the one user who could not see it happen. Both now derive from one expression.

### Accumulated complexity — the new angle

**Verdict: proportionate in mechanism, over-built in one cluster and in narration.** Six of seven
escape/misfire guards are load-bearing and were argued individually.

**[D13] SETTLED (Jason 2026-08-04): delete the no-scrim escape hatch, and AUTO-ADVANCE.** The branch was
the standing justification for three other mechanisms, and its premise ("better an unguarded screen than a
trap") was false — the dock renders *after* the scrim, so Next/Back/Skip were always reachable under it.
Jason rejected the framing that deleting it merely "degrades" a beat, and asked what was actually being
sacrificed: **the user loses the ability to complete that interaction**, since the control sits behind the
scrim. Neither the old behaviour (live screen, copy pointing at nothing) nor a plain deletion (fenced
screen, copy they cannot act on) is honest. So `useSpotlight` now reports `unmeasurable` — set only where a
measurement sequence has concluded and failed — and the screen moves the beat along. Removed with it:
`interactiveTransit`, the whole `shell.settling` channel, MoreButton's dim. The scrim decision drops from a
4-boolean product (16 combinations, 4 documented) to 2.

**Dead code, removed:** `guardian-line` — a coached subject **no beat coaches**, flagged in round 1 §F and
still shipping on the flagship card five rounds later, costing every non-tutorial user a non-collapsable
View and an `onLayout`→`invalidate` per render · `realStoreSnapshot()`, zero callers.

**Why `guardian-line` survived five rounds:** the test asserting "every beat points at a registered subject"
compared two **hand-written literals** — *delete every `TutorialTarget` in the app and it still passes*, and
it could never catch the failure its own name promises. Now scanned from source, plus the inverse assertion
(**no orphan targets**) that would have caught it. The scan's first run failed on the comment describing the
removal → it strips comments first: a scan that reads prose as code is untrue in the other direction.

### Claims corrected

The registry's "covers every current and future coached control" (it covers coached subjects; the boundary
is now recorded, because a claim of totality is what stops the next reviewer checking) · "the wrong beat's
coaching line" — beat 4 declares no `coach`, so the sheet opens with **none**; the defect was real, the
symptom invented · "still true in `startTutorial`" — the deep link is the one member that never reaches it,
so *neither* file sees all three entry points · the `endsOnRow` tail walk skipped the attestation its own
comment named **first**; two lenses disagreed on whether the gap was reachable, so the expression now walks
the whole tail and the argument is retired rather than adjudicated · the "NOT React state" constraint vs
`activeId` · `inWalkthrough` keyed on `activeId`, which is null for the opening frame(s) of every beat, so
the fence was strictly weaker than the `isExample` predicate it replaced.

**~35 lines of post-mortem prose cut** from shared files — including **25 lines in `(tabs)/_layout.tsx`
explaining a `tabBarButton` override that is not there**, in the file everyone touching navigation reads.

### Disproved, and closed for future rounds

- **`activeId` cannot be stranded.** The provider mounts only inside the session branch and the session
  store is not persisted, so there is no path to a non-null `activeId` with no session running. Round 3's
  stranded-`tutorialStep` shape does **not** recur here.
- **Round 5's revert left no orphans** — `tabBarButtonTestID` predates the override and its consumers survive.
- **The `control` fence is not redundant** with the screen fence: on the 5 scripted beats it is a no-op under
  a no-op, but on the 2 interactive beats it is the only thing fencing the coached controls. Kept.

**Gate:** typecheck + lint clean · app/scenario/regression suites green · **117/117 e2e, no flakes** (the
117th is the new fence assertion) · arc swept across all 7 beats × both themes, every beat lands on a subject.

</details>

## P. ROUND 7 — 2026-08-04 · ⛔ does not pass · ~22 findings, two-thirds of them ROUND 6's

<details>
<summary>4 rotated lenses (Opus 5) · a SHOW-STOPPER · fixed in <code>11237e8</code> + <code>9928ab2</code> · first round under the fix+proof+query rule</summary>

**Method change (Jason, 2026-08-04): every finding returns FIX + PROOF + COMPLETENESS QUERY.** The
recommendation alone was never the gap — round 6's lens wrote *"use `a11yHidden` at all six sites"* and
four were converted, because nothing forced proof the class was closed. The third field is the one that
bites: a query the lens writes, that the implementer must run, that fails loudly. → [[feedback_audit_findings_need_fix_and_proof]]

**It paid on first use.** My round-6 comment claimed six call sites. The ESLint rule written to replace the
list enumerated **24 errors across 12 sites in 10 files** — more than double any enumeration, and 9 of
them predated this phase. A list written by the person who missed them misses them again; a rule cannot.

### The SHOW-STOPPER — round 6's auto-advance deleted beats

`line` and `reserve` are adjacent interactive beats, and the verdict was a bare boolean that survived a
beat change by one commit. One slow measurement on beat 3 skipped **beat 4 as well — never measured at
all** — jumped the counter 3→5, persisted the skip, and made Back appear dead (re-entering the beat
advanced straight back out). Three lenses found it independently.

Root cause: `unmeasurable` conflated three facts — *not mounted*, *timed out*, *0×0 mid-transition*. The
doc-comment stated the distinction and the code discarded it at the point of consequence.

**[D15] SETTLED (Jason): DEGRADE IN PLACE, superseding [D13].** Jason rejected "degrade" as a framing and
asked what was actually being sacrificed. Honest answer: the user loses the interaction, since the control
isn't rendered. But skipping also loses the lesson, the step count and Back; and a plain fence leaves copy
asking for a control that isn't there. Both lie. So the beat **keeps its place and drops its ask** via
`bodyIfNoSubject`, through the same resolver the announcement uses.

Three fixes, none subsuming another: `has(id)` (absence as a FACT, not an inference) · `unmeasurableFor`
(the verdict names its subject, so it can't be inherited) · the decision extracted to a pure
`spotlightPolicy` — **because `apps/rn` has no component or hook test runner at all** (devDependencies:
`typescript`, `@types/react`). A decision inline in a `useEffect` is unassertable *by construction*, which
is exactly how this shipped untested.

### The a11y fix was 4 of 6 — and its sibling was worse

Round 6 left the `control` fence and the overlay scrim on the longhand pair, i.e. still no-ops on web —
on the two interactive beats §O itself calls the `control` fence "the only thing fencing the coached
controls". Seventh instance of the one-member fix, inside the fix that condemned it.

Worse, `SheetBackdrop` shipped a NEW defect: **`focusable={false}` is inert on RNW.** Its Pressable always
supplies a `tabIndex`, and `createDOMProps` only consults `focusable` in the branch that short-circuits on
— so every sheet in the app was `aria-hidden` AND tabbable (the `aria-hidden-focus` violation), having
also dropped two shells' "Close" label. `tabIndex={-1}` fixes it on both platforms; `useInert` fixes the
regions, since `aria-hidden` and tab order are separate questions on web.

### ⭐ The scanner that could not fail

`@axe-core/playwright` over four states. It went green immediately — so the backdrop defect was
**reintroduced to see whether it could fail. It could not.** axe reports a bare `tabindex="0"` inside
`aria-hidden` as **`incomplete`**, not as a violation, and RNW produces exactly that shape for every
Pressable. Asserting on `violations` alone, the scanner sat green on a full-viewport aria-hidden tab stop
— green on the precise defect it was installed to catch.

Found by dumping the DOM rather than reasoning about the rule: a `1280×720` div carrying both attributes.
Fixed to assert both buckets, re-verified red (naming the node), then green.

**It immediately caught one of mine:** `useInert` had gone onto the screen fence and `TutorialFence` but
not `TutorialTarget`'s `control` fence. Two of three — the same shape, an eighth time, mine, caught by a
machine rather than by me. `inert` itself is not taken on trust either: axe doesn't model it, so those
subtrees are excluded from the scan and a separate test presses Tab 25 times asserting focus never lands
in a fenced region.

### The hostile-environment rotation — six rounds of ideal conditions

- the dock's nav row could not shrink and had no `flexWrap` → past ~AX2.5 on a 375pt screen it spilled
  into `overflow:hidden` and took **Skip** off screen. Round 2 fixed this row's VERTICAL clipping; nobody
  checked the other axis, and the one it loses is the escape hatch.
- `SETTLE_MS` ungated on Reduce Motion → 380ms of fully-closed scrim per scrolling beat, its justification
  ("a beat longer than the scroll animation") not applying while its cost did.
- `headerHeight`'s `Math.min(2, …)` inverted the over-estimate bias its own comment commits to, above
  ~2.6× — where the header is tallest.
- rotation / Split-View updates the overlay origin on the layout pass but the rect only after a re-measure
  → the open touch hole sits over whatever now occupies that region. `screenReachable` now also requires a
  rect measured under the CURRENT dimensions, so the a11y fence closes with it.
- the scripted story's timers are suspended by iOS and released together on resume → a three-moment
  sequence in one tick, or played out behind the lock screen with `announce()` narrating it.

### Claims corrected (claim-vs-code, 7/7 rounds)

"MoreButton's dim was deleted" — only its comment was · "All FIVE published values now release", wrong a
**fourth** time and made so by the commit that deleted one · the `measure` timeout still justified by a
mechanism [D13] removed and a premise [D13] disproved · "8 sheets" corrected with a second wrong number ·
my e2e comment claiming a `getByRole` method the test didn't use · the source scan's "nothing may
register" enforced over two hand-written paths.

**The scan is now globbed over all of `src`**, matches across arrow-function props (`[^<]` not `[^>]` — a
target with an arrow-fn prop before `id` was matched by neither pattern and vanished silently), and fails
on a PARTIAL miss rather than only a total one.

### Comment convention adopted

Findings #3/#4/#5 were one shape: prose narrating audit history, deletions and counts, which decays with
nothing edited. **A comment may only assert what the code beside it makes true; no totals or completeness
words; no history, no post-mortem, no previous beliefs — and correcting a false comment means DELETING it,
not annotating it.** Counts in these files have now been wrong four times.

### Gate

typecheck + lint clean · all unit suites green · **123/123 e2e, no flakes** (117 → 123: the policy suite,
the role-based fence assertion, the focus-trap check, and four axe states) · completeness query **zero** ·
10 device-only items written into `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 as an executable checklist.

**▶ ROUND 8 REQUIRED.** Seven rounds, every one has found the previous fix block defective, and round 7's
changed user-visible behaviour ([D15]) while adding three modules and a scanner.

</details>

## Q. ROUND 8 — 2026-08-04 · ⛔ does not pass · BAR NOT MET · **the LAST sweep round**

<details>
<summary>4 rotated lenses (Opus 5) · a SHOW-STOPPER, mine from round 7, traced AND observed · <b>NOT FOLDED</b> — the fold is the open item · full per-finding FIX/PROOF/QUERY → <code>DEBT_TUTORIAL_AUDIT_R8_LENS_REPORTS.md</code></summary>

**⚠️ Recovered, not re-run.** The session that ran round 8 was closed before it wrote anything up. The four
lens reports are recovered verbatim into `DEBT_TUTORIAL_AUDIT_R8_LENS_REPORTS.md`; this section is the
consolidated read. **The tree is clean at `83c50a6` — round 8 is entirely unfolded.**

### The SHOW-STOPPER — [D15]'s degraded beat oscillates (mine, from round 7)

`subjectMissing` picks different-length copy → the dock reflows → `dockH` feeds `revision` → the measure
effect re-runs → `setUnmeasurableFor(null)` retracts the verdict → the ask copy returns → repeat. **The
measurement chooses the copy and the copy changes the measurement's input.**

Traced by lens A and **independently observed** by lens B: beat 4, same session, 300ms apart, no input —
the paragraph rewrites itself and the dock jumps ~45px; a probe logged **five flips in eight seconds**.
Two runs of identical code landed on *different* copy, one showing the ask *"Tell it your bills are all
in"* with no control on screen and no spotlight — precisely the lie [D15] was built to prevent. And
because the linter made `subjectMissing` a dependency of the announce effect, **every flip re-fires the
haptic and re-reads the whole beat to VoiceOver.** Strongest-evidenced defect in the gate.

### Lens B — the premium bar, third look in eight rounds, and the first at pixels

**BAR NOT MET** (it was MET at round 4). Beyond the oscillation, three defects on the **shipped happy
path**, none of which any correctness lens was positioned to see:

- **beat 5's spotlight ring is drawn across the coaching dock**, both themes — a blue rule slicing the
  sentence in half. The at-risk card is ~697pt against a ~530pt stage and nothing clamps the highlight.
- **four un-dimmed corner nubs on every beat** — the scrim's bands cut a plain rect while `ring` carries
  `borderRadius: 14`. Worst in **light**. Shipping since 3.5.3.3.1.
- **the dock's frost doesn't isolate** — "e.g. 400" is legible *inside the dark Next button*. [D1]
  calibrated the tint against the tab bar, which never has body text under it. The dock does.
- **round 7's `flexWrap` inverted the control hierarchy** — `navSpacer` is consumed by line one, so Skip
  wraps to left-aligned directly under Next: the most conspicuous position a secondary can occupy.
- a full accent bar celebrates a **no-op save**.

**Why eight rounds missed them: only two rounds ever looked at pixels.** Round 4's "~97% finish" was a
fair read *of what it looked at* — it didn't shoot beat 5, didn't zoom a corner, didn't put body text
under the dock.

### Lens A — the round-7 delta (three more, all in the commit presented as *the* fix)

the rotation gate is a **one-frame no-op** (`dims` in its own dep array → a rotation re-stamps with the
stale rect) · a **late-arriving subject never retracts the verdict** — coupled to the show-stopper, fixing
either alone makes the other reachable on every beat · the ESLint rule **misses literal-key syntax** ·
`bodyIfNoSubject` silently outranks `bodyByRun`, unpinned · `suspendStoryOnBackground` leaves the beat
unretryable while its comment says otherwise.

### Lens D — claim-vs-code, 8 for 8

`a11y.ts` **still says "six call sites"** — the exact claim round 7 headlined as wrong, sitting in the one
file the ESLint rule exempts. Plus the axe `incomplete` mechanism stated wrongly, [D15]'s VoiceOver wiring
surviving its own deletion, the `[inert]` exclusion proven in only one of two states, device-checklist
§11.3 deriving its case from a scenario the code cannot produce, and **43 surviving convention
violations** under the convention round 7 had just adopted.

### Lens C — the overlay-less sandbox (the forward-looking angle): nothing broken today

Isolation holds **unconditionally** — `tutorialSession.end()` clears `active` and `sandbox` in one `set`,
so no frame exists where one is true without the other. But **the honesty marker dies with the overlay**:
rendered overlay-less, the sandbox would put the user's real debt names inside an invented shortfall with
one chip on one card as the sole disclosure. That is 3.5.4's entry cost, plus four cheap items that belong
in this version.

### ⭐ What round 8 settled about the METHOD

**[Jason] The sweep is over; the goalposts are LOCKED.** *"If we change the goalposts on every round then
we will always be in this loop."* Across eight rounds the lenses have covered correctness · honesty/tier ·
a11y · wiring · red-team/user-trust · claim-vs-code · blast radius · accumulated complexity ·
device/native · hostile environment · forward-compatibility · and the premium/visual bar (3×). No major
angle is left unpointed, so locking now doesn't freeze an unlooked-at surface — locking a round *earlier*
would have shipped the corner nubs. **From round 9: same scope every round — (a) is every round-8 finding
verified fixed, (b) did the fix block introduce a show-stopper. Nothing else, until a round comes back
clean.** → [[feedback_audit_rounds_fixed_goalposts]]

**⭐ THE EXIT BAR, made operational (Jason, 2026-08-04):** *"The findings from previous rounds need to be
verified fixed. If they are, and there are no other show-stopper / major / medium findings, then
convergence should be yes. We can't keep spinning our wheels here."* So a locked round **PASSES** on:
**(a)** every round-8 finding verified fixed, **and (b)** nothing further at **show-stopper / MAJOR /
MEDIUM**. **Minor and low findings do not block** — they get folded or filed. Round 9's lens brief carries
this bar verbatim and every finding must return a severity, because severity is now load-bearing on the
gate rather than editorial.

**A diagnosis I walked back, and the one that replaced it.** I claimed the defects traced to one generator
(runtime measurement); checked against all seven show-stoppers, only two do. What actually unifies rounds
2/4/7/8 is **the overlay's geometric relationship to a screen it does not own**, and 5/6 its reach into
shared/platform surfaces — i.e. the 3.5.3.1 decision to run **in situ over the live Today screen**. That
is also exactly what earned round 4's *"this reads as Debt coaching itself"*; a walkthrough owning its own
screen would have almost none of this surface and none of that quality.

**Also worth watching in round 9:** my last two fixes each broke the thing they protected — `flexWrap`
saved Skip from being clipped and made it the loudest control; [D15] stopped the copy lying and made it
lie rhythmically.

### ⚠️ OPEN — the fold is not started, and one [DECISION] gates its shape

**[D16] — fold round 8 as-is, or fold it AND delete the degraded-path subsystem?** Asked 2026-08-04;
**Jason: _"I don't know. We need to discuss more."_** Deleting `unmeasurableFor` / `has(id)` /
`spotlightPolicy` / `bodyIfNoSubject` / `subjectMissing` / the staleness gate (~150 lines) removes the code
both recent show-stoppers live in, replaced by a build-time invariant that each beat's seeded state renders
its own subject. Keeping it is lower-risk this round but leaves round 9 auditing the same machinery.
**Unresolved and blocking the fold.**

</details>
