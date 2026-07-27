# Debt Planner — Best-in-Class Premium Enhancement Audit (Phase-3 opener, 3.0)

> **Date:** 2026-07-27 · **Method:** 7 adversarial lens-auditors across all 15 lenses, each reading real
> both-theme screenshots (Today/Progress/Money/More/paywall, phone viewport, richly premium-seeded) +
> the code + external category benchmarks (Copilot · Monarch · YNAB · Undebt.it · Debt Payoff Planner ·
> EveryDollar). Forward-looking/aspirational, NOT a correctness pass. Output = this prioritized backlog +
> the Phase-3 build order in [`DEBT_ELEVATION_PLAN.md`](DEBT_ELEVATION_PLAN.md).
>
> **Triage key:** **(A)** build now in Phase 3 · **(B)** a later version · **(C)** needs new tooling (tool + cost).

---

## Load-bearing claims — VERIFIED against code (per verify-critic-claims rule)
- **Perf (F7):** [`payoffSelectors.ts:62-66`](../apps/rn/src/store/payoffSelectors.ts) — `selectPayoffView` runs `buildPayoffTrajectory` **3×** + `computeInterestSaved`, bare in render, unmemoized. **CONFIRMED.**
- **MilestonesRow orphaned:** grep across `apps/rn/src` → referenced only by itself. Built, rendered nowhere. **CONFIRMED.**
- **SF Symbols (VC2):** [`AppIcon.tsx:11`](../apps/rn/src/components/ui/AppIcon.tsx) — `MaterialIcons` on every platform; comment defers SF Symbols "at B.9" (never landed); `expo-symbols@56` already installed. **CONFIRMED.**
- **Non-interactive notifications (4-3):** grep for `setNotificationCategoryAsync`/`categoryIdentifier`/response-listener → zero hits. **CONFIRMED.**

## Strengths to PROTECT (don't regress while enhancing)
Recovery Plan = the substance floor other premium surfaces should match · Guardian a11y (group-label discipline) is above category norm · reduce-motion wiring is correct (snaps visual, keeps haptic) · the demo path is well-built · the moat = **Guardian-as-actor** (no benchmarked competitor does payday cushion protection + plan reshaping; Undebt.AI only *recommends*, Debt *acts*).

---

## The (A) build-now backlog — grouped into the Phase-3 build order

### Wave A — Foundation polish & perf (mechanical; no design/tooling gate)
- **A1 · Perf memoization (F7/F8, VERIFIED, HIGH).** `useMemo` `selectPayoffView` + `withProjectedBalances` keyed on debts/paycheck/strategy (NOT `extra`) + `useMemo` the Skia `MakeFromSVGString` parses. Stops 3 full simulations + 4 SVG re-parses firing on every What-If keystroke. Biggest felt-smoothness win, low cost.
- **A2 · SF Symbols on iOS (VC2, VERIFIED, HIGH).** Platform-split `AppIcon` → `expo-symbols` `SymbolView` on iOS (installed), Material fallback elsewhere; map the ~20 glyphs. Removes the biggest "generic-Android" tell from every screen. ~half-day.
- **A3 · Contrast + Dynamic-Type start (a11y F1/F2, HIGH).** Measure tertiary-on-navy / tertiary-on-card ratios both themes; bump the token / promote load-bearing lines ("Your call") to secondary. Reflow the Guardian 3-stat row (`Safety net · Cushion · To debt`, hardcoded `fontSize:17`) to wrap + cap the hero multiplier. Full AX3/AX5 QA pass → Phase 6 device.
- **A4 · Copy coherence (F9.1/F9.2/F9.3/F9.5).** Decide the house voice (recommend: the Guardian stays the sole first-person "I" actor; kill the "we" drift everywhere else → direct "you"); rewrite the risk notification in-voice; fix the **"set aside" brand collision** ([[reference_set_aside_is_gig_brand]]) at the 4 Living-Expenses/bill sites → "reserved/held"; lift the warm empty-state voice to all empty states.
- **A5 · Free Cushion-bar legibility (F4, HIGH).** Dashed safety-net/floor reference line + a one-line legend on the *free* `CushionBars` so "reserve" reads without prose — keeping the per-cycle crunch analysis premium.
- **A6 · Skia skeleton fallback (F1, HIGH).** Replace the bare empty `<View>` CanvasKit-loading fallback (and native first-paint) with a ghosted ring / gridline skeleton so Progress never shows blank hero cards.
- **A7 · Dark-hero lift (VC1, HIGH).** The constant navy hero loses its "island" pop on near-black in dark (pure-black shadow can't separate navy-on-black). Add a hairline top highlight / 1px inner border / faint glow so light+dark are equally premium.

### Wave B — Delight & the emotional peak (DESIGN-FIRST — needs Jason's go)
- **B1 · ⭐ THE DEBT-PAID-OFF CELEBRATION (FLAGSHIP; narrative F7.1/F7.2, motion M1, competitive F7 — all HIGH, all converged).** Spec'd in `motion.ts` (`celebration` timeline), trigger already wired (confirmed-$0), but NOT BUILT — the product's emotional peak passes today as a quiet card fade. Full-screen takeover + Skia particle spectacle + total-paid/interest-saved/time-to-freedom count-up + haptic crescendo + a **permanent, shareable "debts vanquished" archive** (per-debt tombstones). Fire a **scaled-down beat on EACH debt cleared** (snowball runs on this), grand finale on the last. **Tooling [DECISION]:** Rive vs hand-rolled Skia (+ a Core Haptics custom pattern for the tactile twin).
- **B2 · Guardian proof-of-work ledger (the churn-hole fix; narrative F6.1 HIGH, copy F10.2, competitive F8).** On the calm 80% of cycles the Guardian reads near-identically month to month → the automation you pay for is invisible exactly when nothing's wrong. An accumulating micro-ledger ("held your line 6 paychecks running · $840 auto-deployed to debt · $210 interest saved by holding vs dumping") turns invisible automation into visible, un-chattable, accumulating proof. Pure derivation from `cycleHistory`. Unifies with **Momentum** (free emotional-journey read) + surfaces the buried **GuardianScorecard** trust line ("my reads have matched yours 9 of 10 times").
- **B3 · Milestone-cross pulse + resolve orphaned `MilestonesRow` (narrative F7.3, VERIFIED orphaned).** Node spring + haptic on a newly-crossed 25/50/75%; decide retire the dead rail or fold its bead/glow craft into the journey ring.
- **B4 · Affordability impact-viz (narrative F6.2; = the listed §2.9 animated layer).** Before/after Skia cushion-bar carve + debt-free-date slide on a "can I afford this?" apply. Turns the correct textual apply into an uncopyable "watch your plan absorb it" beat.
- **B5 · Tactility bundle (interaction 3-E/3-G, motion M2/M3/M6).** Haptic pass (slider detents on $-step, strategy toggle, top-up/verify commits — tool already installed) + animated segmented-control thumb + list stagger (token exists) + card/row press-scale.
- **B6 · Onboarding + early-journey emotional wins (narrative F7.4/F7.5, HIGH).** Personalize the onboarding FINISH on the computed debt-free date ("You could be debt-free by November 2028 — here's your first move") + reframe the early Progress hero to lead FORWARD (momentum / date-getting-closer / interest-already-saved), not with a deflating "0% paid."

### Wave C — Interactivity & data-viz (sequence with the charts)
- **C1 · Trajectory chart (data-viz F2/F3/F6, interaction 3-A).** Endpoint date pill on the gold bead (trivial, **A now**) · touch-scrub with a moving value readout (balance/date/months at any point — the Robinhood/Copilot move) · per-debt payoff waypoints ("Klarna gone — Aug 2026") · line-crispness fix (move the always-on `BlurMask` off the primary stroke).
- **C2 · Cushion-bar / Cash Runway / journey-ring interactivity (interaction 3-B/3-C, data-viz F5).** Tap a cushion-bar zone → the **"Safety net" tooltip** (already queued) · tap the floor line → open the line sheet · tappable ring milestone nodes + node labels.

### Already-listed Phase-3 items the audit CONFIRMS (keep, fold in)
- Variable-income **debt-free band** (design LOCKED, zero-scaffolding pure derivation) · **Guardian Tier-3** (hero "Free"→"Safe"/"Flexible" label · ack-density coordinator · keep-essential toggle+undo) · **Windfall Autopilot revisit** (presentation over the already-wired split).

---

## ⭐ SCOPE RESOLUTION — Jason executive call (2026-07-27)
**Pull EVERYTHING into v1.7 unless it genuinely cannot ship until a later version.** So the triage below is superseded on the now-vs-later axis: all (A)/(B)/(C) items — incl. the full native-platform block, native iPad, sound, TipKit, context-menu, bottom-sheet — are **IN v1.7 Phase 3**. What remains is (a) two **craft calls** (celebration engine, mesh-gradient floor) that don't change scope, (b) one **flag**: product analytics is *not* a timing deferral — it's excluded for the on-device privacy moat (rec: keep OUT), and (c) the genuinely-later carve-outs: **Android platform pass (v1.8) · Plaid Connected tier (v1.8) · multi-device sync (Connected) · Ava AI (future).** Build order → [`DEBT_ELEVATION_PLAN.md`](DEBT_ELEVATION_PLAN.md) §3.1–3.6.

## Tooling & native [DECISION]s — original auditor recommendations (now mostly resolved to "in" by the call above)
1. **Celebration engine — Rive vs hand-rolled Skia.** *Rec: hand-rolled Skia + a Core Haptics custom pattern.* The app already runs deep Skia + Reanimated + the celebration timeline is spec'd; Rive is best-in-class but adds `react-native-nitro-modules` (new native dep + CI/signing/provisioning surface) for ONE bespoke moment we fully control. Skia keeps the stack consolidated. (Rive is the alternative if we want a designer-authored asset and accept the native dep.)
2. **`expo-blur` glass (tab bar + sheet scrims).** *Rec: adopt (A).* First-party Expo, trivial, the cheapest high-visibility premium signal. Apply with restraint (not on content cards) per [[feedback_less_is_more_premium]].
3. **Sentry — pull forward to the launch gate** (currently Phase 6). *Rec: yes.* A premium app captures crashes from day one; configure PII-scrubbed to honor the on-device story.
4. **Maestro device-e2e.** *Rec: adopt.* The natural real-device layer atop the pure-store harness; directly serves the RS.6 device-e2e step; no app-code intrusion.
5. **Interactive notifications.** *Rec: do the deep-link version now (A)* — `expo-notifications` categories/actions + response listener, no new native target, highest ROI-per-hour. Background-mutate ("mark paid" without opening) needs an App Intent → (C), defer.
6. **Native surfaces substrate — `expo-apple-targets` + App Group.** *Rec: decide the substrate NOW, build the surfaces as a scoped block.* Live Activity + Dynamic Island **payday countdown** is the single most on-brand native surface (nothing in the category does it) and the biggest external gap vs Copilot; the home/Lock-Screen **widget** (expand the listed "2.10 widgets") is the retention glance; **App Intents/Siri** back the interactive buttons. All share one App Group + one provisioning-regen ([[feedback_regenerate_profiles_on_capability_change]]) + one Codemagic target-glob check ([[project_codemagic_xcodeproj_glob_gotcha]]). **[DECISION for Jason: build this native block IN v1.7 Phase 3, or decide-substrate-now / build-in-v1.8?]** The plan currently says v1.7; the auditors (heaviest lift) lean v1.8-block.
7. **Keep product analytics OUT for v1.7.** *Rec: yes* — preserves the "financial data never leaves your device" story the app markets. If ever revisited: PostHog self-host + a value-free event allow-list, not Amplitude.
8. **Defer:** RevenueCat Paywalls / Superwall (the hand-built paywall is already premium — remote-UI is an iteration-velocity play for post-traffic) · `react-native-ios-context-menu` (native swipe/long-press on rows — nice, native dep) · `@gorhom/bottom-sheet` (Reanimated-4 compat-gated; iOS sheet detents may already suffice) · `expo-mesh-gradient` (iOS-18 floor) · Flashlight perf scoring (pair with animation work).

---

## Deferred (B) → versioned backlog
- Name capture → time-aware personalized Today greeting (F10.1) · port streak/milestone surfacing dropped in the RN migration (F10.3, half-built in legacy) · chart alt-labels for VoiceOver (a11y F3) · full drag-the-curve What-If (3-F) · smart onboarding due-date default (F10.4) · fully-skipped-onboarding → demo fallback (F13.3) · free first-Today orientation coach-mark (F13.2) · paywall benefit-copy emotional reframe (F9.4/F7.8) · web CanvasKit prewarm (F10, iOS unaffected).

## (C) forward roadmap (needs tooling / heavier native)
- Live Activity + Dynamic Island · Widget family (home + Lock Screen + interactive button) + StandBy · App Intents / Siri / Control Center · TipKit feature discovery · Apple Watch complication · optional opt-in debt-free **sound** cue (`expo-audio`, behind a setting, silent-switch-respecting) · genuinely-native iPad re-layout · Dynamic-Type AX3/AX5 device QA pass.

## First-run POSITIONING (design-first, B → Jason)
- **The uncopyable job isn't in first-run (F13.1).** Onboarding sells table stakes ("see your plan / know your debt-free date"); the **Payday Cushion Guardian** — the moat — appears nowhere until after purchase. Seeding a taste of it in Welcome is a positioning decision → bring options to Jason, don't solo it.
