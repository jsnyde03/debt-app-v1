# Debt v1.7 — Phase 3.5 COVERAGE / COMPLETENESS Audit (2026-07-30)

> **Jason's ask (2026-07-30):** before building Phase 3.5, audit the two major features — the **interactive tutorial** and the **bounded demo** (+ the folded-in feature-discovery coach-marks) — to ensure they **cover everything: no gaps, no misses.** A pre-build spec-hardening audit ([[feedback_adversarial_audit_until_consensus]] — harden the spec before writing code), not a code audit.

## What's being audited (the current 3.5 spec)
`DEBT_ELEVATION_PLAN.md` **§Phase 3.5** (the `## Phase 3.5 — Interactive tutorial + bounded demo` section) + the `▶ NOW` active-item line:
- **(A) Interactive tutorial** — a hands-on, sandboxed walkthrough the user DRIVES: meet it ("will you make it this paycheck?") → read the bar (tap zones) → your line (drag the floor, watch it re-plan live) → the settling-in reserve (surprise→absorb→release) → the safe move + "your call" → done. Fires on first premium Guardian view; replayable ("?" on the card + a "How the Guardian works" row in More). Absorbs the 2.4.11.3 intro.
- **(B) Bounded demo showcase** — a cold-start-bounded premium showcase on the SAME sandbox (launch-critical for GTM/ASO): day-one value only (floor auto-protect · tight one-tap · a visible water-fill smoothing a lumpy bill) · scorecard shown as "here's what I'll show once I learn your income" · reserves HELD (not deployed) — **NOT a matured Guardian the month-one buyer can't be** · isolated (never feeds real calibration / `genuineCycleCount`) · plus a free at-risk showcase state. The interactive demo ≈ a scripted run of the tutorial.
- **(C) Feature-discovery** — on-brand RN coach-marks (calm · one-at-a-time · dismissible · replayable · iOS-16-safe · Android-reusable); priority target = the invisible long-press context menu + "add the widget / add to Lock Screen" nudges.

## The reference set (what the tutorial/demo must NOT miss)
Auditors cross-check the 3.5 spec against the SHIPPED premium surface so nothing important goes untaught/unshown: `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (Guardian v6) · `DEBT_ELEVATION_LOG.md` (what actually shipped: Guardian · cushion/floor · safety-net reserve lifecycle · Recovery Plan · Can-I-Afford · BNPL · Windfall · scan · calibration/scorecard · graduation · the delight beats) · `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · the onboarding (`components/onboarding/`) · the existing `isDemoMode` pref/demo seed · `app-portfolio/GO_TO_MARKET.md` (for the GTM/ASO lens).

## Lens-clusters (one Fable-5 auditor each) → gaps/misses + recommended spec additions
1. `01-feature-concept-coverage.md` — does the tutorial + demo teach/show every premium concept a user must "get"? What's missing / mis-scoped.
2. `02-states-a11y-premiumbar.md` — Guardian-state + free/premium + edge/skip/replay coverage; the tutorial/demo themselves being premium + accessible (VoiceOver-drivable · Dynamic Type · reduce-motion · both themes); coach-marks completeness.
3. `03-onboarding-substrate-buildability.md` — coherence with the EXISTING onboarding + intro (no double-teaching/gaps); reachability/replay entry points; demo-mode isolation; the shared sandboxed SCRIPTABLE Guardian substrate fully specced (deterministic · isolated · no signal-without-a-producer); buildability risks.
4. `04-gtm-honesty-instrumentation.md` — the demo as the cold-user/marketing showcase (conveys the ONE uncopyable job in seconds? app-preview video?); the honesty constraint airtight (no over-promise of a matured Guardian); free at-risk state; instrumentation for the v1.1 retention roadmap; AU/NZ localization; measurable "cold user gets it" success criteria.

## Added criteria (beyond "no gaps") — my picks
Premium-bar of the tutorial itself · full a11y (an INTERACTIVE tutorial must be VoiceOver-operable, not just labeled) · reduce-motion · both-theme · honesty (demo must not over-promise) · skip/dismiss/interrupt/resume paths · instrumentation/analytics of completion · localization · the substrate's determinism/isolation · non-annoyance of coach-marks · reachability/replay.

## Outcome
`_SUMMARY.md` — consolidated gap list (severity-ranked) + a hardened, decomposed 3.5 build spec with the gaps folded, ready to build. (Synthesis on the session model.)
