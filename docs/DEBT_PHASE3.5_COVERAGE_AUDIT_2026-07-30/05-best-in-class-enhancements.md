# 05 — Best-in-Class ENHANCEMENT Audit (aspirational, 2026-07-30)

**VERDICT: NEAR — the hardened 3.5 plan is a *complete, correct, accessible* interactive tutorial (top ~10% of the category on engineering honesty alone), but it is still a lesson about a SANDBOX that ends when the lesson ends. The single biggest lever: make it end on the USER — personal-scale numbers, a hand-back to their real Guardian, and a promise the Guardian later visibly keeps — turning a tutorial into the first beat of a relationship. That, plus making the flagship drag *felt* (predict-then-reveal + haptic state detents), is the gap between "excellent tutorial" and "the thing they tell a friend about."**

> Method: benchmark the HARDENED build order (`_SUMMARY.md` §▶ — assume those gaps fixed) against category leaders in learn-by-doing onboarding and pre-purchase interactive demos. Companion in spirit to `DEBT_PHASE3_ENHANCEMENT_AUDIT_2026-07-27.md`. Triage: **(A)** fold into the v1.7 3.5 plan now · **(B)** v1.8+/later · **(C)** needs new tooling (named).

---

## 1. Is it top-of-class?

**Where the hardened plan already clears the bar** (credit where due — protect these):
- **Interactive, not passive** — the user drives real components on a real engine (the Arcade/Navattic pre-purchase-demo crowd fakes this with screenshots; we run the actual `computeState`). Structurally uncopyable.
- **Learn-by-causing** — drag the floor and *cause* clear→tight→at-risk is the Nintendo teaching move (teach the mechanic by making the player produce the state), and almost no fintech does it.
- **Honesty as a bound** — cold-start-bounded demo, reserves HELD, no matured-Guardian fiction. No category leader constrains its own demo this way; it's a differentiator, not a limitation.
- **A11y-operability as an exit gate** (VO completes end-to-end) — genuinely above Duolingo/Robinhood-tier first-runs.

**Where it is still merely *good* (the generic-competent tells):**
1. **It's canned and it stays canned.** Every beat runs on fabricated numbers; the arc ends on the sandbox with a wrap card. Category leaders (Duolingo's do-a-real-lesson-first; Superhuman's your-actual-inbox onboarding; Robinhood's your-first-real-trade) all land the lesson **on the user's own reality**. Our audience for (A) is the *just-converted buyer who already entered their numbers* — and we never use them.
2. **The user watches more than they choose.** "Tap 'a surprise lands' → watch" is still spectator pedagogy at the key beat. Active-recall (commit to a guess, then see) is the single strongest retention mechanic in learning science and the leaders' shared trick.
3. **The relationship dies at the wrap.** The scorecard-promise beat is good copy, but nothing ever *calls back* to it. A promise made and silently kept is a promise wasted.
4. **The demo ends without a receipt.** The bounded demo shows value happening but never *sums itself* — no closing artifact a viewer screenshots, no frame that IS the store asset.

**The single biggest opportunity:** the finale. Sandbox arc → **hand-back to YOUR real Guardian** with your real first read. Everything else below orbits that.

---

## 2. Enhancement set (by lens, each triaged)

### Lens: Personalization — "this is about ME"
- **E1 · The hand-back finale (⭐ the biggest lever). (A)** The tutorial's wrap doesn't end on the sandbox — the sandbox card **cross-fades/morphs into the user's REAL `PaydayGuardianCard`**, with their real state read aloud as the Guardian's first real sentence to them ("Now yours: your paycheck lands Friday — you're clear, with $84 past your line."). One `<Motion>` crossfade + the real card render + one templated line off the real brief. Honors lens-3's no-reverse-leak rule by construction: the *drama* (tight, surprise, shortfall, Recovery) all happens on the sandbox; only the calm landing is real. For a free-tier tutorial run, the hand-back lands on the real free card + the value-led invitation — which makes the tutorial itself the best paywall the app has. Skip/edge: pre-onboarding demo users (no real data) get the demo's exit CTAs instead — the hand-back is (A)-only. VO: the landing line is an `announce()` — the beat is *words*, so it's accessible for free.
- **E2 · Sandbox at YOUR scale. (A)** When the runner has real data (post-purchase/post-onboarding), scale the fabricated sandbox to the user's paycheck order of magnitude (round to a clean figure; fabricated bills/debts, real-ish scale). A $1,150-per-check user learns on a ~$1,200 sandbox, not a $2,400 fantasy — "this is my life" with zero crisis re-enactment (the lens-3 guard holds: the *shape* is theirs, the *events* are canned). One multiplier in `createSandboxStore(scenario)`; deterministic per run. Pre-onboarding demo keeps the canned default (also keeps marketing captures pinned — the capture path always uses the canned scenario).

### Lens: Learn-by-doing craft — make the drive *felt*
- **E3 · Predict-then-reveal opener. (A)** Before the Guardian shows its first read, ask the user to call it: **"This paycheck — does it make it?"** [Makes it / Comes up short] → the bar animates to the answer → one line either way ("You called it." / "Close — here's what you couldn't see."). Active recall at beat 1; two buttons (fully VO-operable — *better* a11y than watch-only); folds into the existing "meet it" beat, no beat-count growth. This is also the demo's ~5-second hook: the first frame literally asks the viewer the headline question.
- **E4 · Feel the line — haptic state detents on the floor drag. (A)** As the drag crosses a `computeState` boundary: `impactLight` at clear→tight, `impactMedium` at tight→at-risk (and back). Haptics-as-teaching-channel — the state model lands in the fingers, not just the eyes. Within the shipped haptics doctrine (a boundary crossing IS a snap/commit event, not passive scroll); pairs with the already-mandated boundary `announce()`s so the a11y and haptic channels tell the same story. Native-only feel → Phase-6 device ledger, like the Wave-B haptics.
- **E5 · Choose your surprise. (A, small)** The "surprise lands" beat offers 3 chips (car repair · vet bill · the water heater) instead of one scripted button. Same amount under the hood (script stays deterministic), but *choosing* the blow makes it theirs — agency is the cheapest ownership trick the leaders use. One chip row; zero new engine work.

### Lens: Emotional narrative — the Guardian has your back
- **E6 · The honest introduction (voice pass). (A, copy-level)** The tutorial is the Guardian's ONE first-person monologue surface — write it as a character introducing itself, including the un-copyable move no competitor's tour makes: **admitting what it doesn't know yet.** "I haven't learned your income yet — that takes me about three paychecks. Here's what I can already do on day one." Cold-start honesty *as characterization* converts the §2.0 confidence governance from fine print into charm. Folds into 3.5.3's copy step; feeds the whole-app wording/voice audit.
- **E7 · The kept promise (⭐ the relational loop). (A)** The wrap's scorecard beat becomes an explicit promise: "In about three paychecks I'll show you my scorecard — how often my reads matched your reality." Set `tutorialPromiseMadeAt`; when the real scorecard first unlocks, the ack card opens with the callback: **"I told you I'd keep score. Here it is."** One flag + one conditional line in the existing scorecard-unlock surface, registered in the VIS-4 ack slot it already uses. No benchmarked product closes this loop; it's the difference between a tutorial that *ended* and a relationship that *started* — and it lands inside the refund-guarantee window, exactly when the just-converted buyer is deciding whether this was real.

### Lens: Motion/delight (restraint-matched to a teaching surface)
- **E8 · The absorb beat does spatial work. (A)** When the surprise hits, the amount visibly **travels from the bill into the reserve** and the bar re-settles — the Tier-3 cascade vocabulary at teaching scale (motion-spec principle 2: motion explains a state change). Calm register, `gentle` tokens, no glow/particles; reduce-motion = crossfade + the mandated announcement. This is the one beat where motion IS the lesson ("the held money took the hit") — spend the craft here, nowhere else.
- **E9 · Completion register = Tier-2, never Tier-3. (A, a restraint pin)** Tutorial completion earns exactly a contained ring-pulse + `impactLight` (milestone register). No confetti, no takeover, no chime — the celebration hierarchy stays honest (finishing a lesson ≠ paying off a debt). Write the register column (lens-2 B2) with this pinned.
- **E10 · Respect shown up front. (A, small)** Step dots + a calm "about 2 minutes" on the invitation, and every step skippable (already hardened) — the premium tell the leaders share is *telling you the cost before taking your time*.

### Lens: The demo as an uncopyable acquisition asset
- **E11 · The closing receipt frame. (A)** The demo ends on a composed one-screen recap — **"What I just did: caught 1 tight paycheck before it happened · held your $250 line · set aside $120 toward the March bill — on day one, before learning anything about you."** *(final wording routes "set aside" through the brand-collision rule — "held/reserved".)* It's simultaneously (a) the demo's proof-summary, (b) the two-CTA exit's backdrop ("Start my real plan" / "Unlock Premium"), and (c) **the App-Store screenshot + App-Preview closing frame** — the capture path requirement (hardened 3.5.4) gets its money shot designed-in, dark-mode-first. Pure derivation from the demo script; screenshot-stable by construction.
- **E12 · The demo opens with the viewer's guess. (A, = E3)** The predict-then-reveal opener IS the demo's hook — the store preview's first seconds show a question the viewer answers in their head. Free, since (B) is a scripted run of (A).
- **E13 · Web-embeddable demo on the marketing site. (B/C)** The sandbox is pure store + selectors and the RN-web export already exists — the bounded demo could run *in the browser* on the debt-planner site: a genuinely interactive pre-install taste no competitor's static landing page has. **(C): needs an embed harness + hosting decision (GitHub Pages slice of the web export) + its own analytics/privacy call.** File to the versioned backlog beside the Phase-6 GTM work; do not let it gravity-pull 3.5.

### Lens: Memorability — the one thing they tell a friend
The compound of E1+E3+E4: **"It asked me whether my paycheck would make it — I guessed wrong — then it let me drag my own line and I could *feel* the moment I went tight. And at the end it switched to my real numbers."** That sentence is the product's word-of-mouth unit. Every (A) above serves it; nothing else in 3.5 needs to.

### Lens: RESTRAINT — what NOT to add (the bar cuts both ways)
- **No Tier-3 spectacle, confetti, or sound** anywhere in tutorial/demo (E9). The teaching surface must not out-celebrate the actual debt-paid-off moment.
- **No gamification chrome** — no XP, quiz scores, streaks-for-finishing-a-tutorial, badges. The Guardian's authority is calm competence; carnival mechanics cheapen it.
- **No fake-chat/typing theater.** The Guardian speaks in composed cards, not simulated typing dots — theater reads as LLM-wrapper, the exact thing the moat isn't.
- **No mascot/Rive for v1.7** (already deferred; the tutorial does not reopen it).
- **The Recovery glimpse stays a glimpse** — one scripted card. The moment it becomes a walkthrough, the tutorial is a feature tour (the §Scope-guardrail line holds against E-pressure too).
- **Beat count holds at ≤7.** Every (A) above folds INTO an existing hardened beat (E3→meet-it · E4/E2→your-line · E5/E8→reserve · E1/E7/E10→wrap · E11→demo exit). If an enhancement needs an eighth beat, it's (B) by definition.

---

## 3. Triage roll-up

| # | Enhancement | Triage | Cost | Folds into |
|---|---|---|---|---|
| E1 | Hand-back finale (sandbox → YOUR real Guardian) | **A** | S | 3.5.3 wrap |
| E2 | Sandbox at your scale | **A** | S | 3.5.0 `createSandboxStore` |
| E3 | Predict-then-reveal opener (tutorial + demo hook) | **A** | S | 3.5.3 meet-it / 3.5.4 first-frame |
| E4 | Haptic state detents on the floor drag | **A** | S (device-verify → P6 ledger) | 3.5.3 your-line |
| E5 | Choose-your-surprise chips | **A** | XS | 3.5.3 reserve |
| E6 | Honest-introduction voice pass | **A** | XS (copy) | 3.5.3 copy step |
| E7 | Kept-promise callback (flag + scorecard-unlock line) | **A** | S | 3.5.3 wrap + existing scorecard ack |
| E8 | Absorb beat = spatial money-travel (calm register) | **A** | S–M | 3.5.3 reserve motion |
| E9 | Completion register pinned at Tier-2 | **A** (restraint pin) | 0 | 3.5.2/3.5.3 register column |
| E10 | Step dots + "about 2 minutes" | **A** | XS | 3.5.2 scaffold |
| E11 | Demo closing receipt frame (= store capture money shot) | **A** | S | 3.5.4 exit/capture |
| E12 | Demo opens on the viewer's guess | **A** (free w/ E3) | 0 | 3.5.4 |
| E13 | Web-embeddable demo on the marketing site | **B/C** — embed harness + hosting + privacy call | M | versioned backlog (GTM) |

Net new scope: ~all-S items folding into existing hardened sub-steps — no new build-order numbers needed except one line each in 3.5.0/3.5.2/3.5.3/3.5.4. The a11y exit-gate and honesty bounds are strengthened, not strained, by every (A) (E3 replaces watch-only with buttons; E1/E7 are word-carried beats).

## 4. Ranked — do these and it's genuinely best-in-class

1. **E1 — the hand-back finale.** The category-defining move: no competitor's tutorial ends on *you*. Converts the whole arc from lesson to relationship, doubles as the free-tier's best paywall, and costs one crossfade + one templated line.
2. **E3 + E4 — predict-then-reveal + feel-the-line detents.** Together they make the two core beats *active and tactile*: you commit to an answer, then you physically feel your paycheck go tight. This is the tell-a-friend sentence, and E3 is simultaneously the demo's 5-second hook.
3. **E7 — the kept promise.** One flag, one callback line — and the Guardian becomes the only fintech feature that makes a promise in onboarding and *visibly keeps it* three paychecks later, exactly inside the buyer's-remorse window. The cheapest uncopyable thing in this document.

*(E11, the demo receipt frame, is the near-miss #4 — insist on it anyway when 3.5.4 builds, since it's the store-asset frame Phase 6 will otherwise have to invent.)*
