# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** *"A plan to do things RIGHT, not just evolve because it saves some time. I'm at that level with Freedom and I want the same with Debt. This app is no longer the guinea pig. This app will be at the level or above the rest of the apps by the next version, or it's quickly becoming churn."*
>
> **This SUPERSEDES the "v1.7 = The Robust Build (parity migration + revenue spine)" framing.** Same version (the next ship), bigger ambition: not "migrate + monetize" but **elevate Debt to best-in-class + acquisition-ready.** Scope-creep is explicitly OFF the table as a constraint — comprehensiveness to reach the bar is the mandate. Governed by [[user_debt_app_learning_sandbox]] (guinea-pig role retired), [[feedback_premium_quality_bar]], [[feedback_less_is_more_premium]], [[feedback_agree_design_before_implementing]]. Strategic basis: `DEBT_STRATEGY_EXPLORATION_2026-07-20.md` · `MONETIZATION_AUDIT_2026-07-20.md` · `PREMIUM_RESHAPE_SPEC.md`.

---

## The bar (definition of "there")

Debt ships only when it clears **Freedom-v1.0-or-above AND acquisition-ready**, concretely:
- **Structure/IA** expresses what Debt *is* (a payday-triggered emotional payoff journey), designed first-principles — not a generic PFM template carried over by habit.
- **Visual + motion** are a deliberate premium design language; the daily surfaces are calm/restrained, the emotional beats (a debt paid off) are genuinely delightful.
- **Premium is *active substance*** (the reshaped feature set) — worth downloading and paying for, not "smart text."
- **Quality**: a real automated test suite + device-QA'd across the full native surface + iPad; the data-continuity bridge proven on a real upgraded device.
- **Trust is visible** (the moat: honest, on-device, never sells you more debt) — in the app and the store.
- **Store presence** is acquisition-grade (sells the active/emotional features + the trust positioning), and first-run makes a cold user "get it" in seconds.

## Operating principle: DESIGN-FIRST, then build to it

The core mistake to avoid is elevating *after* building. So the foundation (structure, visual language, the reshape, the readiness gap-list) is **designed and signed off BEFORE the build** ([[feedback_agree_design_before_implementing]]). No parity shortcuts; no EVOLVE-to-save-time.

**What Phase B already earned (preserved, NOT wasted):** the RN stack proven, `packages/core` (the engine — never rewritten, per the invariant), the zustand store, the design-token system, the reusable primitives, the Freedom-RN-lessons hardening, and Drift's tested engine. The **experience** gets elevated on top of this foundation; the **core** stays put.

---

## The phases

### Phase 0 — Design Foundation _(design-first; Jason signs off before any build)_
- **0.1 First-principles IA / structure redesign** — question every convention: the nav model, the tab set, the primary surface, *whether it's tabs at all.* Benchmark best-in-class in **any** category, not just finance. Design the structure that expresses the payday-payoff journey (illustrative direction under discussion: **Today/Plan · Progress · Your Money · More** — do/journey/manage, consolidating the 3 management tabs). Output: the agreed IA.
- **0.2 Visual design-language + motion system** — a deliberate premium identity (type/color/depth/spacing), the motion language, and the **emotional-moment design** (celebrations, progress-fill, animated numbers). Output: the design language + comps for the key screens + the delight beats. (Resolves D7.)
- **0.3 Premium reshape finalization** — resolve `PREMIUM_RESHAPE_SPEC` D1–D7; lock the active feature set, the free/premium line, and the model (one Premium tier + Lifetime + a portfolio-subscription seam).
- **0.4 Structural-readiness audit** — independent + adversarial: current app vs. the bar → a prioritized gap list that sets the build order + stress-tests the portfolio-subscription assumption (strategy gap #3).
- **GATE:** design foundation signed off. Nothing below starts until it is.

### Phase 1 — Elevate the surface
Rebuild every screen to the **new IA + visual language** (not parity). The Phase-B parity screens are elevated to the bar on the preserved foundation. Both themes, equal ([[feedback_light_mode_equal_premium]]).

### Phase 2 — Premium substance + revenue spine
Build the reshaped Premium: the **Payday Partner loop** (reminders + calendar + mark-paid + verify), milestones/streaks/widget, shareable cards, auto-adjusting plan, momentum chart, PDF/partner sharing, Drift folded to Premium. Plus the **revenue spine** to the reshaped model (one tier, Lifetime, portfolio-sub-ready entitlement, `hasFeatureAccess` gating, analytics + Sentry-8.18), iCloud backup, AU/NZ. (`PREMIUM_PLUS_AVAILABLE` gone; the value-gate is moot under one tier.)

### Phase 3 — Delight + native platform
The emotional layer built *with* the features: the **debt-paid-off celebration**, milestone moments, progress-fill, animated counters, haptics, reanimated micro-interactions — and **genuinely-native iPad** (master-detail/multi-column, not a centered column). Restraint on daily surfaces; delight on the beats.

### Phase 4 — Quality
A **real automated test harness** for the RN app (unit tests for store/selectors/money-math via the `packages/core` reconciliation pattern + e2e for the critical flows — Debt has none today; Freedom shipped with a full suite) + the whole-app gap analysis + reconciliation + both-theme visual verification, kept green.

### Phase 5 — Data continuity + cutover _(🔒 ship-blocker)_
The migration bridge (existing WKWebView `localStorage` → RN storage), **proven on a real populated upgraded device**, then cutover to the RN app as the shipping app.

### Phase 6 — Launch-ready
**Acquisition-grade store presence** (screenshots + app-preview video + listing selling the active/emotional features + the trust moat) · **cold-start/first-run excellence** (a new user gets it in seconds) · **thorough device-QA gate** (full native surface + Freedom device-only lessons + iPad + the migration) · submit.

---

## Sequencing notes
- Phases 1–3 can interleave per screen (a screen's elevation + its active feature + its delight beat ship together — the cleanest way to hit the bar screen-by-screen).
- Phase 4 quality is continuous, not a tail step.
- The old V17 phases map in: migration → 1/5, revenue → 2, D.5 gap analysis → 0.4/4, D.6 polish/iPad → 1/3, release gate → 6.
- **Version framing is Jason's call:** stays the next shipped version ("v1.7 re-scoped as The Elevation"), or renumber if he prefers.

## Open decisions
- **E1** — approve this design-first, best-in-class re-scope + kick off Phase 0? (The design foundation is the immediate next work.)
- **E2** — start Phase 0 with **0.1 IA redesign** + **0.4 readiness audit** in parallel (the audit informs the IA)? _(Rec: yes.)_
