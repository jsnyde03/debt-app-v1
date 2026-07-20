# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** *"A plan to do things RIGHT, not just evolve because it saves some time. I'm at that level with Freedom and I want the same with Debt. This app is no longer the guinea pig. This app will be at the level or above the rest of the apps by the next version, or it's quickly becoming churn."*
>
> **This SUPERSEDES the "v1.7 = The Robust Build (parity migration + revenue spine)" framing.** Same version (the next ship), bigger ambition: not "migrate + monetize" but **elevate Debt to best-in-class + acquisition-ready.** Scope-creep is explicitly OFF the table as a constraint — comprehensiveness to reach the bar is the mandate. Governed by [[user_debt_app_learning_sandbox]] (guinea-pig role retired), [[feedback_premium_quality_bar]], [[feedback_less_is_more_premium]], [[feedback_agree_design_before_implementing]]. Strategic basis: `MONETIZATION_AUDIT_2026-07-20.md` · `PREMIUM_RESHAPE_SPEC.md`.

---

## The bar (definition of "there")

Debt ships only when it clears **Freedom-v1.0-or-above AND acquisition-ready**, concretely:
- **Structure/IA** expresses what Debt *is* (a payday-triggered emotional payoff journey), designed first-principles — not a generic PFM template carried over by habit.
- **Visual + motion** are a deliberate premium design language; the daily surfaces are calm/restrained, the emotional beats (a debt paid off) are genuinely delightful.
- **Premium is *active substance*** (the reshaped feature set) — worth downloading and paying for, not "smart text."
- **Quality**: a real automated test suite + device-QA'd across the full native surface + iPad; the data-continuity bridge proven on a real upgraded device; **accessibility to WCAG 2.2 AA (Debt's own first-class expression), designed-in and device-verified (VoiceOver/Dynamic Type).**
- **Trust is visible** (the moat: honest, on-device, never sells you more debt) — in the app and the store.
- **Store presence** is acquisition-grade (sells the active/emotional features + the trust positioning), and first-run makes a cold user "get it" in seconds.

## Operating principle 1: DESIGN-FIRST, then build to it

The core mistake to avoid is elevating *after* building. So the foundation (structure, visual language, the reshape, the readiness gap-list) is **designed and signed off BEFORE the build** ([[feedback_agree_design_before_implementing]]). No parity shortcuts; no EVOLVE-to-save-time.

**What Phase B already earned (preserved, NOT wasted):** the RN stack proven, `packages/core` (the engine — never rewritten, per the invariant), the zustand store, the design-token system, the reusable primitives, the Freedom-RN-lessons hardening, and Drift's tested engine. The **experience** gets elevated on top of this foundation; the **core** stays put.

## Operating principle 2: TECHNOLOGY-AGNOSTIC — the tool serves the bar (Jason 2026-07-20)

Don't default to pure-RN by habit; **use native code where it delivers a first-class result RN can't.** Interop is standard: `expo-modules` (clean native modules), Fabric native components (embed SwiftUI/UIKit in RN screens), and extensions (widgets, Live Activities). **Some reshape features FORCE native** — the home-screen widget is SwiftUI-only; Live Activities / App Intents / Siri / Control-Center are iOS-native best-in-class touches.

**Each platform is first-class on its OWN terms (Jason 2026-07-20):**
- **Never weaken iOS to keep Android in lockstep — and vice versa.** Platform-**exclusive** capabilities are embraced, not avoided ("we can only do this on iOS/Android" is NOT a showstopper).
- **"First-class on Android" = Android's OWN native capabilities** (Material You / dynamic color · Android App Widgets + Quick Settings tiles · Wear OS · rich notifications) — designed *as an Android app*, NOT an iOS port. A reskinned iOS design = a second-class port, which fails the bar.
- **What keeps it affordable (not 2× everything):** divergence lives ONLY at the native-capability *edges*. **Shared `packages/core` engine + shared RN app surface** stay common (one codebase for the logic + the bulk of screens); only the platform-native flourishes diverge. "Shared core + shared surface + first-class native edges per platform," not two apps. The engine never goes native (rewrite-the-experience-not-the-core invariant).
- **Sequencing (eyes-open, solo-dev):** those divergent native edges are real extra surface, so iOS gets its first-class native edges now (current focus + revenue); **Android gets its OWN first-class treatment at v1.8** — neither a hostage to the other. Use native **where it earns the result, not everywhere** ([[feedback_less_is_more_premium]]).

---

## The phases

### Phase 0 — Design Foundation _(design-first; Jason signs off before any build)_
- **0.0 Best-in-class benchmark layer** _(Jason 2026-07-20 — "the bar is first-in-class; we don't go in blind or on assumptions")_ — external first-in-class teardowns per bar dimension, feeding the design items: **IA/structure** (→0.1) · **visual language + motion + emotional-moment/delight** (→0.2) · **premium substance + monetization model** (→0.3) · **trust-as-felt + first-run/cold-start** (→0.1/Phase 6) · **native platform touches** (→0.5). Quality/testing is NOT benchmarked (reference = Freedom's shipped suite). Docs: `DEBT_IA_BENCHMARK_2026-07-20.md` + `DEBT_BENCH_{VISUAL_MOTION,PREMIUM_MONETIZATION,TRUST_FIRSTRUN,NATIVE}_2026-07-20.md`. Pairs with the internal 0.4 readiness audit (where WE fall short) — together = the evidence base, no assumptions. **✅ ALL 6 BENCHMARKS DONE (2026-07-20) → synthesized into `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md`** (the design decisions for 0.1/0.2/0.3/0.5; per-surface content proposal + free/premium line + model + the build-order linchpin).
- **0.1 First-principles IA / structure redesign** — question every convention: the nav model, the tab set, the primary surface, *whether it's tabs at all.* Benchmark best-in-class in **any** category, not just finance. Output: the agreed IA.
  - **✅ IA SKELETON AGREED (Jason 2026-07-20, evidence-based) — 3-tab bottom bar + a "•••" More corner:** **Today** (home — the payday "what to pay now" moment; the wedge) · **Progress** (first-class journey — debt-free date, milestones, momentum, the debt-paid-off celebration) · **Money** (consolidated management; opens to **Debts** as its hero section → **Bills** → **Goals**). **More** ("•••" corner) = Data · Preferences · About. **Rationale:** the two reasons-to-open (Today, Progress) own the tab bar; entity-management is reference work collapsed into one sectioned hub. **Evidence:** `DEBT_IA_BENCHMARK_2026-07-20.md` (Q2 consolidate / Q3 tabs — Oura Today·My Health·Vitals + Rocket Money "Recurring" precedents) + the 0.4 audit (IA = the #1 load-bearing P0). Debts→its-own-tab is a one-line promote if it ever tests as buried.
  - **▶ REMAINING in 0.1 — per-surface content design** for Today / Progress / Money. **Proposal DRAFTED (`DEBT_PHASE0_DESIGN_SYNTHESIS` §3), folding in 0.2 (motion/celebration) + 0.3 (premium line) + trust surfaces + native.** ⏳ Awaiting Jason's react to §3 + the open decisions (§6: D-LINE free/premium line · D-LIFE Lifetime · W widget-tier).
- **0.2 Visual design-language + motion system** — a deliberate premium identity (type/color/depth/spacing), the motion language, and the **emotional-moment design** (celebrations, progress-fill, animated numbers). Output: the design language + comps for the key screens + the delight beats. (Resolves D7.)
  - **✅ VISUAL LANGUAGE — comp DONE + Jason-approved (2026-07-20)**, both-theme screenshot-verified (light == dark bar; Jason: "light mode looks like it belongs now"). Identity: cool slate/navy, **navy hero/beat panels constant in both themes** (parity + identity move), light lifted via soft navy-tinted shadow, single blue accent + semantic green/gold, warmth on beats only. All 3 tabs + the beat comped. **Detail + live comp link → `DEBT_PHASE0_DESIGN_SYNTHESIS` §8.**
  - **✅ MOTION SPEC DONE (2026-07-20) → `DEBT_MOTION_SPEC_2026-07-20.md`.** Stack (grounded selection, `DEBT_MOTION_TOOLING_2026-07-20.md`): **Reanimated ~4.3** (Freedom-parity) + **in-house `<Motion>` wrapper** over `motion.ts` (Moti rejected — Reanimated-3-only) + **Skia** for GPU beats/rings (the future portfolio data-viz/generative-delight lever) + **expo-haptics** + one bespoke payoff pattern; **Rive/Lottie deferred**. Celebration tiers choreographed (payday quiet → milestone pulse → debt-paid-off Skia spectacle: ring→$0→freed-payment cascade). **Tab-navigator black-screen trap guarded (hard rule).** **✅ Jason-approved 2026-07-20 ("spec is good").**
  - **▶ REMAINING in 0.2 = apply the tokens to the RN theme** (`apps/rn/src/theme/{colors,motion}.ts`) — that's Phase-1 *build*, not design. 0.2 design is complete pending sign-off. Resolves D7 (full deliberate reset — confirmed).
- **0.3 Premium reshape finalization** — resolve `PREMIUM_RESHAPE_SPEC` D1–D7; lock the active feature set, the free/premium line, and the model (one Premium tier + Lifetime + a portfolio-subscription seam).
  - **✅ D1–D6 DECIDED (Jason 2026-07-20):** D-LINE free/premium line (free finishes the job · premium does it with you every cycle) · D-LIFE one-tier $4.99/mo + annual-seam-built-launch-gated + Lifetime ~$79–99 (2nd offer) + portfolio-sub graduation mechanic · W widget = free-glance/premium-interactive · D5 "Progress" is a first-class tab (via the IA). **Feature set + line + model LOCKED → `DEBT_PHASE0_DESIGN_SYNTHESIS` §4.** **D7 (visual-reset ambition) = the 0.2 doorway → full deliberate reset now.**
- **0.4 Structural-readiness audit** — independent + adversarial: current app vs. the bar → a prioritized gap list that sets the build order + stress-tests the portfolio-subscription assumption (strategy gap #3).
- **0.5 Native-capability pass (technology-agnostic)** — decide, per surface, RN vs. native Swift: which delight/native surfaces go SwiftUI (widget [Swift-only], Live Activities, App Intents, specific delight moments) vs. stay RN (the shared app). Each Swift piece gets an Android-parity note. Output: the tech-choice map feeding the build.
- **0.6 Accessibility design-standard** _(Jason 2026-07-20 — a11y is first-class + designed-in, not a Phase-4 checkbox)_ — the a11y standard woven through every surface + the platform-hook map. **Standard = WCAG 2.2 AA + platform a11y HIG, expressed for Debt's OWN surfaces** (Freedom's `ACCESSIBILITY.md` = a borrowed method/floor, NOT the ceiling or identity — [[feedback_sibling_app_reference_not_ceiling]]). Output: `DEBT_PHASE0_DESIGN_SYNTHESIS` §10 + the ASC Nutrition-Label targets; verified per-theme at build + a device VoiceOver/Dynamic-Type walk at the release gate.
- **GATE:** design foundation signed off. Nothing below starts until it is.

### Phase 1 — Elevate the surface
Rebuild every screen to the **new IA + visual language** (not parity). The Phase-B parity screens are elevated to the bar on the preserved foundation. Both themes, equal ([[feedback_light_mode_equal_premium]]).

**✅ 1.1 Design-system foundation (structure-first) — DONE (2026-07-20).** _Before-scan (verified vs current code): purple-collapse blast radius = ONLY `DriftCard.tsx`; all other components consume `useAppColors()` generically → re-tuning token VALUES propagates. After-scan (whole item): foundation complete (color+elevation+motion tokens · motion stack · `<Motion>`/`<CountUp>`/hooks/haptics · a11y primitives). **Carry-forwards:** `boxShadow`+`overflow:hidden` native-clip → Phase-E device-QA · Skia-web CanvasKit → 1.4 · motion runtime-verify → 1.3 first-use · ListRow/sheets adopt `elevation`/`raised` → 1.2. **▶ NEXT = 1.2 shared chrome.**_
  - **1.1.1 ✅ DONE (2026-07-20)** — retuned `theme/colors.ts` to the approved palette (cool navy-tinted grounds · single blue accent · semantic success/gold/danger) + added the **constant navy hero/beat `surface` tokens** + accent-soft + gold-pill; **removed `purple`** (repointed DriftCard→`accent.primary`); retuned `progressColor`. tsc 0; **verified both themes** on the live Plan screen (single accent applied, semantics clean, no contrast regressions). _After-scan: light cards read flat with only a hairline → confirms 1.1.2 elevation helper is the correct next step (already planned); navy `surface.hero` tokens added but unconsumed until 1.3 (expected). Nothing else surfaced._
  - **1.1.2 ✅ DONE (2026-07-20)** — `theme/elevation.ts` (cross-platform `boxShadow`; **navy-tinted on light**, value + soft shadow on dark; `card`/`raised`/`hero` levels) wired into the `Card` primitive. tsc 0; **both themes verified on the live app — light cards now float** (the parity fix), dark lifts cleanly. _After-scan: ⚠️ `boxShadow` + `overflow:'hidden'` may clip on iOS → **device-QA item (Phase E)**; sheets/FormSheet should adopt `elevation.raised` when touched (1.2). Nothing else surfaced._
  - **1.1.3 ✅ DONE (2026-07-20)** — `motion.ts` extended: `stagger` (list 40ms) + `celebration` timeline (the paid-off beat ms-offsets, DEBT_MOTION_SPEC §5) + exported. tsc 0. _After-scan: pure token additions, consumers land in 1.1.5 / 1.4; nothing surfaced._
  - **1.1.4 ✅ DONE (2026-07-20)** — installed Reanimated **4.3.1** + worklets 0.8.3 + Skia **2.6.2** + expo-haptics + expo-linear-gradient (SDK-56-pinned); `babel.config.js` with `react-native-worklets/plugin` (last). Dev server restarted (cache clear) → **app boots clean on web, 0 console errors**, tsc 0. _After-scan: Skia-web CanvasKit setup deferred to first Skia render (1.4) — install alone doesn't break web; native compile validates in the batched build (Phase E); 11 moderate transitive npm-audit warnings (non-blocking)._
  - **1.1.5 ✅ DONE (2026-07-20)** — `src/motion/`: `<Motion>` (FadeInDown entrance + delay/stagger, `ReduceMotion.System`) · `<CountUp>` (rolling number, tabular-safe, reduce-motion→final) · `useSpringValue` · `useReduceMotion` · `haptics` (web no-op) — all bound to `motion.ts`. tsc 0. _Runtime-verified at first use (1.3 Today hero); device-motion → batched build._
  - **1.1.6 ✅ DONE (2026-07-20)** — `src/utils/a11y.ts`: `headerProps` · `groupLabel` (single-utterance) · `decorative` (cross-platform hide) · `announce` (web-safe). tsc 0; app boots clean. _Consumed as-built from 1.2 on → one fix propagates._

### Phase 2 — Premium substance + revenue spine
Build the reshaped Premium: the **Payday Partner loop** (reminders + calendar + mark-paid + verify), milestones/streaks/widget, shareable cards, auto-adjusting plan, momentum chart, PDF/partner sharing, Drift folded to Premium. Plus the **revenue spine** to the reshaped model (one tier, Lifetime, portfolio-sub-ready entitlement, `hasFeatureAccess` gating, analytics + Sentry-8.18), iCloud backup, AU/NZ. (`PREMIUM_PLUS_AVAILABLE` gone; the value-gate is moot under one tier.)

### Phase 3 — Delight + native platform
The emotional layer built *with* the features: the **debt-paid-off celebration**, milestone moments, progress-fill, animated counters, haptics, reanimated micro-interactions — and **genuinely-native iPad** (master-detail/multi-column, not a centered column). Restraint on daily surfaces; delight on the beats.

### Phase 4 — Quality
A **real automated test harness** for the RN app (unit tests for store/selectors/money-math via the `packages/core` reconciliation pattern + e2e for the critical flows — Debt has none today; Freedom shipped with a full suite) + the whole-app gap analysis + reconciliation + both-theme visual verification, kept green.

### Phase 5 — Data continuity + cutover _(🔒 ship-blocker)_
The migration bridge (existing WKWebView `localStorage` → RN storage), **proven on a real populated upgraded device**, then cutover to the RN app as the shipping app.

### Phase 5.5 — Repo consolidation / dead-code cleanup _(Jason 2026-07-20 — runs AFTER cutover, RIGHT BEFORE the Phase-6 release gate; NOT before)_
The repo currently holds **two apps**: the dead Capacitor/Next app at root + the shipping RN app in `apps/rn` (with shared `packages/core`). Once cutover (Phase 5) proves the RN app IS the shipping app, remove the Capacitor tree and consolidate to a single clean app so we don't ship a two-version repo.
- **5.5.1** remove the root Capacitor/Next surface (old `app/` God-files · `ios/` Capacitor bits · `next.config` · Capacitor config · WebView-only glue), keeping only what `apps/rn` + `packages/core` still use.
- **5.5.2 [DECISION]** final repo structure — promote `apps/rn` to root vs. keep the `packages/core` + `apps/rn` monorepo layout _(rec: keep the monorepo — `packages/core` is shared portfolio-wide; decide at switch-in)._
- **5.5.3** update tooling / CI / docs to the consolidated structure; tsc + tests + build green on the cleaned tree.
- **Deliberately deferred until release-gate-ready** (both trees stay useful references during the build). **Verify scope against the CURRENT tree at switch-in** — pre-authored cleanup drifts.

### Phase 6 — Launch-ready
**Acquisition-grade store presence** (screenshots + app-preview video + listing selling the active/emotional features + the trust moat) · **cold-start/first-run excellence** (a new user gets it in seconds) · **thorough device-QA gate** (full native surface + Freedom device-only lessons + iPad + the migration) · submit.

---

## Sequencing notes
- Phases 1–3 can interleave per screen (a screen's elevation + its active feature + its delight beat ship together — the cleanest way to hit the bar screen-by-screen).
- Phase 4 quality is continuous, not a tail step.
- The old V17 phases map in: migration → 1/5, revenue → 2, D.5 gap analysis → 0.4/4, D.6 polish/iPad → 1/3, release gate → 6.
- **Version framing is Jason's call:** stays the next shipped version ("v1.7 re-scoped as The Elevation"), or renumber if he prefers.

## Decisions
- **E1 ✅ APPROVED (Jason 2026-07-20)** — the design-first, best-in-class re-scope is ratified; Phase 0 is the active work. **Mode: "approve but talk through as we go"** — Phase 0 is collaborative; 0.1 IA comes back as a *proposal Jason shapes*, never a unilateral lock; the design-foundation GATE (his sign-off before any build) stands.
- **E2 ✅ APPROVED (Jason 2026-07-20)** — Phase 0 opens with **0.4 readiness audit** (solo, adversarial — running) + **0.1 IA redesign** (talk-through) in parallel; the audit informs the IA. 0.2 / 0.3 / 0.5 follow.
