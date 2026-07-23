# Debt Premium Elevation — Full Spec (2026-07-23)

The buildable blueprint for the Debt app's premium elevation (v1.7): the **Payday Cushion Guardian** (the flagship) + the **whole premium tier** (built + remaining). Consolidates the review-session decisions (`DEBT_GUARDIAN_REVIEW_DECISIONS_2026-07-23.md`), the lock-down audit (`DEBT_GUARDIAN_AUDIT_2026-07-22.md`), the strategy capstone (`DEBT_PREMIUM_STRATEGY_2026-07-21.md`), and `DEBT_ELEVATION_PLAN.md` §2. This is the artifact the **second adversarial-audit round** scrutinizes before any build.

Decision IDs (e.g. **D1.1**) reference the review-decisions doc.

---

## 1. Premium identity & the ladder

- **Automation, not intelligence.** *"The app does the manual work; you just confirm."* An **effort** ladder, not a capability ladder — free is already a real companion, premium removes the work.
- **The one test every premium feature passes:** *removing it must remove WORK, not just information.* Inert "smart text" is not premium.
- **The four-tier ladder:** (1) **Free** — the generous on-device front door · (2) **Premium ~$4.99/mo** — the automation tier, on-device / E2EE · (3) **Premium Connected +$5** — opt-in Plaid, ~v1.8, isolated backend, tradeoffs disclosed · (4) **Ava / AI coach** — grounded, persistent, actionable; future / cross-portfolio.
- **Privacy = "private by default" (D1.1)** — NOT an absolute "we never touch your bank" (that contradicts the Connected tier and breaks the day it ships). E2EE is the floor; any server we add is E2EE-by-construction on Apple's stack.
- **Free / premium line (D6.2):** free = the honest **read** every cycle + universal safe guidance when tight (a real taste). Premium = the **acting + planning** (auto-protect, personalized recovery plan, surplus waterfall, income learning, drill-down). Work-removal is the paid line.

---

## 2. The Payday Cushion Guardian (flagship)

### 2.1 The promise & the voice
- **Promise (D1.1):** keep the visceral *"will I make it this paycheck?"* hook; pair it with the factual boundary *"based on what you've entered — not your bank"*; privacy strength = simply **"private by default."**
- **Voice (D2.1):** active **plan-shaping** — *"I've set this paycheck to keep $200 as your cushion and put the spare to work — $400 to your emergency fund, $60 to debt. Mark them when you're ready."* Real agency (it shaped the plan), but **never custody voice** ("I'm holding / I sent / I moved"). "Held/paid/moved" reserved for actual executions (confirmed payoff, verified balance).
- **False-reassurance guard (D2.2):** the clear state is an **observation, not a guarantee** — *"Looks clear this paycheck"* (not "you're safe/covered"); any deploy-the-spare nudge carries *"…if nothing unexpected's coming up."* Symmetric with the alarm-side caution.

### 2.2 The data model (the honest core)
- **Exhaustive partition (D1.2):** after-obligations money splits into exactly **Cushion · Emergency fund · Debt · Goals · true Leftover** — provably sums to `discretionary`, **reconciliation-tested**, no bucket silently dropped (kills the "all held as your cushion" lie during EF funding).
- **One metric everywhere (D1.3):** the band, the lookahead, AND the Progress cash-flow bars all read off floor-relative **headroom** (per-cycle `discretionary` vs the floor) — never post-buffer `endingBalance` vs fixed 200/100.
- **One canonical vocabulary (D2.4):** the partition names are the only money words on Today; **"cushion" = exactly the liquid, floor-protected, this-cycle safety** — nowhere else. The hero's Required/Everyday/Free breakdown reconciles to it.
- **Band + hysteresis:** state = { clear · tight · at-risk }; thresholds floor-relative (no hardcoded `<100`); a **dead-band** around boundaries so sub-$25 projection noise can't flip the band/color (a false-precise verdict relocated into the state machine).
- **Hedging:** every $ is *"about $X"* (nearest step); a nonzero amount never renders "$0"; never a false-precise verdict.
- **Card representation (D1.2 → (a)):** a calm **two-zone bar** — *your cushion* (with the floor line) vs *money put to work* — with copy that honestly **names** where the "put to work" goes (priority order, top few); the full itemization lives in the drill-down.

### 2.3 Variable / irregular income (v1.7, mainstream)
- **Principle — plan for the valley (D3.1):** build the cushion + plan on the **conservative (lean) end** of income; anything above is a **bonus** flowing into the waterfall. A bad paycheck never breaks the plan because the plan never assumed a good one.
- **Capture (D3.2):** a "my income varies" toggle → **lean** (required — the floor you can *count on*, the prompt coaches this) + **typical** (optional — the "you usually make ~$Y" framing). Fixed-income users unaffected.
- **Learning (D3.3), v1.7:** record each **actual** paycheck; once there's history, **suggest** a range refinement (*"your last 6 ran $1,850–$2,400; set your lean to $1,850?"*) — confirm, never silent; trend detection follows. The "learns your money" story.

### 2.4 The acting — auto-protect the cushion floor (built, 2.4.6)
- Premium reserves the user's **cushion floor** (default $200, adjustable — the "bank low-balance alert" model) as the paycheck buffer, so the whole plan (Today allocation · cushion · payday capture) auto-protects the cushion before any extra payoff. **Only discretionary money moves; obligations are never cut** (cut recommended/goals first, never a bill/minimum). Spending stays user-executed (mark-paid) — never auto-paid.

### 2.5 The cash-flow brain (2.4.7)
- **Recovery / smoothing when short:** review the ~6-cycle forecast; pre-fund upcoming crunches from surplus; show the recovery point for a current shortfall. **Timing-vs-structural = a running prefix-sum (D5.1)** — each deficit must be coverable from surplus in *earlier* cycles (`cumulative_surplus(1..k−1) ≥ cumulative_deficit(1..k)`); the first cycle the prefix test fails is the boundary. Consumes a clean per-cycle **net** (income − required − living), NOT `endingBalance`.
- **Structural-deficit honesty:** describe the **gap** (*"~$180/cycle short over the next six"*); never fake a set-aside plan; never name/blame a guessed "flexible" cost.
- **Surplus waterfall:** floor → pre-fund crunches → **starter EF if none (gated, D5.3)** → high-APR debt → fuller EF / goals → accelerate → **wealth (→ Freedom, at the graduation top only)**.
- **EF rung (D5.3):** gate the starter-EF recommendation behind a one-tap *"already have savings elsewhere?"* (absence never = need); offer EF-first-vs-APR-first as a **choice with a why**.
- **Posture:** auto-apply protective moves; **create-goal / deploy = one-tap confirm** (never auto-spend or auto-create).

### 2.6 Surfaces
- **The card (Today):** state + read + the two-zone bar (floor line) + a **1–3 step "path back" / "best use"** summary. **Calm register** — one quiet bar fill on mount, no count-up/haptic; risk content stays calm.
- **The drill-down (D5.2):** a **route = the elevated Progress cushion view** (one cash-flow destination, two entry points) — annotated 6-cycle forecast with the **floor line drawn across it**, crunch highlighted, per-cycle "why" (reuse `TimelineLedger`). Clear state = a clean bill of health, never dead.
- **Accessibility:** the "Adjust your line" control is reachable by VoiceOver (rendered outside the narrated container); the bar has a real text equivalent (cushion vs floor vs deployed); `announce()` on a floor change; the drill-down authored as readable per-cycle text; state carried redundantly by icon + title (not color alone); high-contrast verified.

### 2.7 Graduation — debt-free (D4.1)
- The Guardian **persists past debt-free** (cushion/cash-flow matters forever — the churn answer); it does not null out. The waterfall **re-tops** (debt tier drops → surplus flows EF → goals → wealth). The debt-free **moment** = the Phase-3 celebration spectacle. The **Freedom handoff = an earned, honest invitation** at the top of the now-debt-free waterfall — light nudge, never a redirect; the user keeps Debt as their cushion tool. Same guardian, new chapter.

### 2.8 Proactive + calibration (both v1.7)
- **Proactive notification (D6.3):** a payday-window **local** notification carrying the Guardian's real read; **fires only on RISK** (tight/short this cycle or an upcoming crunch) — never "you're clear" spam; computed on-device, refreshed via a background task. Built with the native notification batch (2.9). Interim copy honest ("checks every payday") until it ships.
- **Calibration + visible scorecard (D6.4):** capture **predicted-vs-actual** each cycle (did the cushion hold? was the shortfall real?); **confidence scales with proven accuracy for this user** (unproven → hedges harder, "still learning your pattern"; proven → speaks confidently); a **visible track record** — *"called your cushion right 5 of the last 6 cycles"* — so the Guardian earns trust visibly.

### 2.9 Free vs premium presentation (value-led, D2.3)
- Free **always helps** — the honest read + a universal safe-move when tight ("cover essentials, hold off on extra payoff") + the invitation to the *personalized* plan. Never alarm-then-upsell. The personalized multi-cycle plan (specific pre-funding, exact set-asides) is the premium line.

### 2.10 Hardening (2.4.6.1, before any 2.4.7 build) (D7.1)
- **Root causes:** the exhaustive partition (D1.2) + one metric everywhere (D1.3).
- **Correctness bugs:** windfall not repeated across future cycles · at-risk cutoff floor-relative · focus debt from the *actual* snowball allocation · no "$0" for a nonzero hedge.
- **UX/a11y bugs:** VoiceOver reaches "Adjust your line" · hide "Adjust your line" in a shortfall · bar animates once (no incidental replay).
- **Framing reshapes:** private-by-default · plan voice · false-reassurance guard · free at-risk taste.

---

## 3. The rest of the premium tier (built + remaining) — for the whole-tier audit

- **2.3 Projection auto-maintenance (BUILT).** Premium keeps balances always-current between verifications (project the anchor forward; the decay-gated payday verify-loop). The other half of "your plan runs itself." *Audit lens: does it stay honest (estimate labeling), and is the min-only projection bias acceptable where the Guardian's dollar moves ride it?*
- **2.5 Smart-obligation quality layer.** On-device Core ML (+ Foundation Models "why" on iOS 26) flags lapsed-trial / one-off / finite-BNPL at confirm-time → **protects Guardian accuracy** (a miscounted obligation inflates `totalRequired` → a false shortfall). Guardian ships (2.4) before this — interim mitigation = the conservative min-only bias + hedged copy.
- **2.6 Close-the-loop verification.** Escalating unconfirmed-payment loop + missed/failed recovery recompute — the accountability spine. **Homes the Drift→Guardian contract + anchor unification (deferred 2.4.2), and the Guardian's calibration loop (D6.4).**
- **2.7 Scan-to-prefill + change-detection.** Apple Vision OCR → pre-fill → confirm (semi-auto); free initial scan / premium keeps-current. The one greenfield/risky piece → fast-follow.
- **2.8 Momentum reshaped.** Forgiving $-consistency streak + a persistent "debts-vanquished" archive (a losable war-record) + living partner/accountability sharing (recipient never pays). Retention, not headline.
- **2.9 Widget + App Intents + notifications.** The on-device home-screen surface of the loop, batched into one native build — **includes the Guardian-state notification (D6.3).**
- **2.10 Revenue spine.** RevenueCat + paywall UI (port Gig) + Lifetime 2nd-offer + portfolio-sub seam + analytics + Sentry; **launch-flip gated on value shipped** (Apple 3.1.2 compliance).
- **2.11 E2EE iCloud backup + AU/NZ readiness.**
- **Later (~v1.8): Premium Connected tier.** Opt-in Plaid + isolated backend + 2nd StoreKit tier + transparent-disclosure UX; never gates the on-device tier. **Future: Ava AI tier.**

---

## 4. Cross-cutting principles (the whole tier honors these)
1. **Private by default; E2EE floor.** No absolute "never"; connection is a knowing opt-in.
2. **Honesty over polish.** No false precision, no false reassurance, no fake plans; the boundary of what we can see is stated, not hidden.
3. **Value-led gating.** Free stays complete + helpful; premium is additive automation; never blur/lock; the upsell is designed.
4. **Auto-apply protective; confirm to spend or create.** Obligations are never cut; money never moves without a tap.
5. **Confidence scales with proven accuracy.** The app earns trust, doesn't assert it.
6. **Removes work, not just info** — the price test for every feature.

## 5. Build order
**2.4.6.1 hardening** → **2.4.7 cash-flow brain** (recovery + surplus waterfall + variable income + income learning + graduation + notification + calibration/scorecard + drill-down) → the rest of the tier per `DEBT_ELEVATION_PLAN.md` §2 (2.5 → 2.11), Connected tier ~v1.8, Ava future.

## 6. Open questions for the second audit to probe
- Is the exhaustive partition genuinely exhaustive across every allocation path (windfall, autopay, partial-pay, rollover mid-cycle)?
- Does "plan for the valley" interact correctly with the projection (2.3), the debt-free-date, and the surplus waterfall (a lean-income user's surplus is lumpy)?
- Is the on-device background-refresh for the risk notification reliable enough to back the promise, or does the interim copy need to persist?
- Does the calibration scorecard create a perverse incentive (the Guardian under-warns to protect its record)?
- Is the whole premium tier coherent as *one* automation story, or a bundle of features wearing a tier?
- Does anything in the remaining tier (2.5–2.11) fail the same four lenses the Guardian was held to?
