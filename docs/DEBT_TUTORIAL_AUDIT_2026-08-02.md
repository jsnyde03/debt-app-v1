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
