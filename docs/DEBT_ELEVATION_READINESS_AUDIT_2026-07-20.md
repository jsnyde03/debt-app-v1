# Debt Planner — Structural-Readiness Audit (adversarial, independent)

_Phase 0.4 of the Elevation. 2026-07-20. Assesses the **current RN app** (`apps/rn/src`) against the six-dimension bar in `DEBT_ELEVATION_PLAN.md`. Read-only; no code changed. Every claim cites `file:line` repo-relative from `debt-app-v1`._

---

## 0. Executive verdict

**Not there. The current app is a clean, competent PARITY foundation — not an elevated one.** Phase B did exactly what it set out to do: rebuild the full Capacitor surface in RN with an IA "evolve" and a restrained, premium-*competent* visual base. That foundation is real and worth preserving. But measured against "Freedom-v1.0-or-above AND acquisition-ready," the app clears **one** of six dimensions cleanly (a fraction of Visual — the *calm* daily surfaces), is **partial** on two (Trust, Cold-start), and has **structural P0 holes** on three: **Structure/IA**, **Premium active-substance**, and **Quality**. Motion/delight is effectively **absent as implemented**.

The three findings that should set the entire Phase 1+ build order:

1. **IA is a generic 4-tab PFM template** (Plan · Bills · Payoff · Goals), not the payday-triggered emotional payoff journey the bar demands. Everything else reskins on top of this, so it must be resolved first.
2. **Premium substance in the RN app is zero.** No paywall, no gating engine, no active features — only a single Drift *teaser* card. The whole monetization thesis (`MONETIZATION_AUDIT`, `PREMIUM_RESHAPE_SPEC`) has no code behind it yet, and what exists still encodes the **cut** `premium_plus` tier.
3. **There is not a single automated test in the RN app**, and no delight/motion layer exists (reanimated/haptics/gradient are not even dependencies). Freedom shipped with a full suite and a motion system; Debt has tokens-as-comments and a `typecheck` script.

**Readiness score (informal): ~2 of 6 dimensions at/near bar; 3 at P0; 1 (delight) unbuilt.** This is a substantial build, not a polish pass — which matches the mandate ("scope-creep is off the table as a constraint").

---

## 1. Structure / IA — **P0**

**What the bar demands:** the structure itself expresses "a payday-triggered emotional payoff journey," designed first-principles — not a generic PFM template.

**What exists:** a 4-destination bottom-tab shell — **Plan · Bills · Payoff · Goals** (`apps/rn/src/app/(tabs)/_layout.tsx:35-50`), Plan-first, with Settings pulled into a "•••" More hub (`src/app/more.tsx`). It's clean and it works. But it is an *evolve* of the Capacitor tab set, self-described as the "IA EVOLVE" (`_layout.tsx:7`), not a first-principles redesign.

| Sev | Gap | Evidence | What "there" looks like |
|---|---|---|---|
| **P0** | The tab model is generic PFM, not a journey. Bills and Goals are two separate *management* tabs sitting beside Plan; there is no consolidated "Your Money/manage" surface and no distinct "Progress" home. The illustrative target IA (Today/Plan · Progress · Your Money · More) is not expressed. | `(tabs)/_layout.tsx:35-50` (4 flat peers) | Nav expresses do → journey → manage: a doing surface, a *Progress/Momentum* emotional home, a consolidated money-management surface, and More. Management tabs consolidated, not co-equal. |
| **P0** | "Payoff" is still an analytics tab (debt-free date, trajectory chart, payoff order, strategy toggle), not reframed as the emotional **Progress/Momentum** home the reshape needs (Drift + milestones + momentum + share consolidate there). | `(tabs)/payoff.tsx:56-124`; reshape §6, D5 open | A Progress tab that leads with where-you're-going emotionally (milestones/streaks/momentum), with the analytics demoted to support. |
| **P1** | No structural "payday" spine across the IA. Payday Autopilot is a capture sheet bolted onto Plan (`(tabs)/index.tsx:52,107-124`); the payday *loop* (remind → pay → verify → celebrate) has no home in the structure. | `index.tsx:96-124`; reshape §4 pillar ① | The recurring payday loop is the app's structural backbone, not a modal on one tab. |
| **P2** | The More hub is well-organized (History · Data · Preferences · About) and clears the bar for a management surface. | `more.tsx:63-134` | (Keep — this piece is good.) |

**Bottom line:** the IA is the single most load-bearing gap because Phase 1's screen-by-screen elevation reskins *onto* the IA. Elevating screens before the IA is settled would elevate the wrong structure.

---

## 2. Visual + motion — **P0 (motion); P1 (visual identity)**

**What the bar demands:** a deliberate premium design *language* (type/color/depth/spacing) with a real motion system; calm daily surfaces, genuinely delightful emotional beats.

### 2a. Visual language — competent, not yet *distinctive*
The token system is solid: a semantic light/dark color tree (`src/theme/colors.ts`), a considered type scale with tabular numerics for counters (`src/theme/typography.ts:37-40`), a single-hue "progress ramp" instead of a traffic-light (`colors.ts:66-71`). Daily surfaces (Plan hero, Payoff) read clean and restrained — this **clears the "calm daily surface" half of the bar.**

| Sev | Gap | Evidence | What "there" looks like |
|---|---|---|---|
| **P1** | The visual identity is an admitted *port* of the Capacitor CSS tokens (a slate/blue reskin), not the first-principles design-language reset D7 asks whether to do. It's competent-generic, not a signature. | `colors.ts:4-6` ("ported from the Capacitor CSS tokens"); reshape D7 (open) | A deliberate design-direction pass gives Debt an unmistakable identity, not "nice default fintech." |
| **P1** | No depth/material layer. `LinearGradient` and `BlurView`/glass are **not dependencies**; the "premium-tinted" heroes are flat solid fills, with the code itself flagging the gradient never landed. | `components/plan/PlanHero.tsx:12-13` ("a real gradient lands at B.9 polish" — B.9 shipped, gradient did not); `payoff.tsx:21` flat `HERO_BG` | Heroes and emotional beats use real depth (gradient/blur) where it earns premium; still restrained on daily surfaces. |

### 2b. Motion — **effectively unbuilt (P0)**
`src/theme/motion.ts` defines spring/duration tokens — but **it is a contract with no consumer.** `react-native-reanimated` is **not in `package.json`**, and a full-tree search finds **zero** uses of `Animated`, `reanimated`, `withSpring/withTiming`, `Haptics`, `Lottie`, or `confetti` (only the token file and one comment mention them).

| Sev | Gap | Evidence | What "there" looks like |
|---|---|---|---|
| **P0** | No animation runtime at all. reanimated uninstalled; motion tokens unused. Screen transitions, card entrances, and state changes are static. | `package.json` deps (no reanimated); grep of `src/**` → only `theme/motion.ts:11,13` | reanimated installed; entrances/springs per the token contract; Reduce-Motion degradation. |
| **P0** | Progress does not *fill* — the focus-debt and goal bars are static `<View>`s sized by width %, never animated. The reshape's "thermometer you watch fill" doesn't exist. | `payoff.tsx:92-101` (static width %); reshape §5 | Progress rings/bars animate their fill; the hero numbers count. |
| **P0** | No animated counters despite the type scale being built *for* them (`tabular-nums` "so widths don't jitter during counter animations"). Hero numbers snap. | `typography.ts:5-7,38`; `PlanHero.tsx:60-63` (static `<Text>`) | Payday allocation / debt-free figures count up on change. |
| **P0** | No haptics anywhere — `expo-haptics` not installed — so mark-paid, milestone, and payday moments have no tactile payoff. | `package.json` (no `expo-haptics`) | Haptics paired to the key confirming/celebratory moments. |

---

## 3. Premium active-substance — **P0 (the biggest gap vs the thesis)**

**What the bar demands:** premium is *active substance* (the reshaped feature set) — worth downloading and paying for, not "smart text."

**What exists in the RN app: essentially nothing.** The Payoff tab is explicitly "the FREE surface (premium modules + amortization + paywall → Phase C)" (`payoff.tsx:23`). There is **no paywall, no `hasFeatureAccess`, no purchase flow, and no gated feature** in `apps/rn`. The only premium artifact is one **teaser** card.

| Sev | Gap | Evidence | What "there" looks like |
|---|---|---|---|
| **P0** | None of the four reshape pillars are built. **Payday Partner** (per-bill reminders → mark-paid → verify at payday): absent — only a capture sheet exists. **Momentum** (streaks, milestone system, momentum chart, widget, share cards): absent. **Auto-adjust plan / full amortization / PDF / partner-sharing**: absent. | reshape §4 vs `apps/rn/src` (no such components); `payoff.tsx:23` | The active partner *acts* every payday — reminds, verifies, tracks, celebrates, auto-adjusts. |
| **P0** | Milestone **math** runs but has **no UI, no celebration, no surface.** `computeMilestones` fires on rollover and stores high-water marks — then nothing renders them. | `store/payday.ts:76-106`; `data/models.ts:73` (`milestoneMaxProgress`); no consuming component | Crossing 25/50/75/100% or paying a debt off triggers a visible, delightful moment. |
| **P0** | The only premium surface is a **passive locked teaser** — exactly the "smart text" the monetization audit condemned. Drift gates on a placeholder `subscriptionPlan === 'premium_plus'` with no real entitlement behind it. | `payoff.tsx:32-33,66`; `components/payoff/DriftCard.tsx:21-35` | Real gating (`hasFeatureAccess`), a compliant paywall, and *active* premium features behind it. |
| **P0** | The code still encodes the **cut** tier. `SubscriptionPlan = 'free' \| 'premium' \| 'premium_plus'` and the Drift gate use `premium_plus`, which the reshape **CUTS** in favor of one Premium tier. The shipped model contradicts the locked strategy. | `data/models.ts:36`; `payoff.tsx:33`; `DriftCard.tsx:18,21`; reshape §7 ("Premium+ tier → CUT") | One Premium tier + Lifetime + portfolio-sub seam; `premium_plus` removed. |
| **P1** | Re-tiering from the reshape (strategy-comparison/what-if/forecasting → Free; Smart Insights → "next move" Premium) can't even be expressed — none of those modules exist in RN yet. | reshape §7; `payoff.tsx:23` (modules deferred to Phase C) | The free/premium line is implemented over a real feature set. |

**Bottom line:** premium substance is the widest gap. The RN app cannot currently be monetized at all, and the scaffolding it *does* carry points at the strategy that was explicitly reversed.

---

## 4. Quality — **P0**

**What the bar demands:** a real automated test suite + device-QA across the full native surface + genuinely-native iPad + a data-continuity bridge proven on a real upgraded device.

| Sev | Gap | Evidence | What "there" looks like |
|---|---|---|---|
| **P0** | **Zero automated tests.** No `__tests__`/`tests` dir, no `*.test.*`/`*.spec.*` file anywhere in `apps/rn`, no test script (`package.json` scripts = `start`/`web`/`export:web`/`typecheck`), and no jest/vitest/playwright/testing-library in devDeps (only `typescript` + `@types/react`). Freedom shipped a full vitest+Playwright suite. **The memory's claim is confirmed.** | `apps/rn/package.json` (scripts + devDeps); filesystem (no test files) | A real harness: unit tests over store/selectors/money-math (they're pure TS — node-testable per the B.2 scan) + e2e for the critical flows, kept green. |
| **P0** | The entire native surface is **device-unverified**. MMKV persistence, notifications, Face ID app-lock, in-app review, and the first-launch shim were written but only `tsc` + web-regression ran; the B.9 scan itself says TestFlight is "the real gate." | `V17_PLAN.md` B.9 after-scan; native modules behind `.web` splits (`storage/`, `lib/app-lock*`, `notifications/`) | Full-surface device QA against a per-version checklist, native paths first. |
| **P1** | **iPad is a width-capped centered column, not native master-detail** — precisely the "wrapper" the plan rejects. Screens cap a single column on `isRegular`; `isExpanded` (two-column) exists in the hook but **no screen consumes it**. | `components/screen.tsx:39-41,102`; `hooks/use-layout.ts:11-13,31` (isExpanded defined, unused) | Genuine multi-column/master-detail on iPad, designed as iPad — not iPhone-centered-in-whitespace. |
| **P0 (gate)** | The **data-continuity bridge** (WKWebView `localStorage` → RN storage) is **not built or proven.** Migrations exist for the RN store's own versions (`data/migrations.ts`), but the cross-runtime upgrade path from the shipping Capacitor app is absent. This is a ship-blocker (Phase 5). | `data/migrations.ts` (in-store only); no Capacitor-import path in `apps/rn` | The bridge proven on a real populated device upgrading from the live app. |

---

## 5. Trust visible — **P1**

**What the bar demands:** the moat (honest, on-device, never sells you more debt) is visible in the app.

**What exists:** trust *is* present but thin and buried. More → About leads with "Your data stays on this device / Nothing is uploaded or shared" (`more.tsx:127`), and onboarding's completion step includes "Free to use — core features never require a subscription" (`components/onboarding/CompletionStep.tsx:13`).

| Sev | Gap | Evidence | What "there" looks like |
|---|---|---|---|
| **P1** | The **"never sells you more debt"** positioning — the actual moat vs predatory debt products — appears **nowhere** in-app. Trust is reduced to a privacy line + a "free to use" bullet. | search of `apps/rn/src` (no such copy); `more.tsx:127`; `CompletionStep.tsx:13` | The honest-by-design stance is a felt, first-class message, not an About row. |
| **P2** | Trust isn't woven into the daily/first-run surfaces — no trust beat at the moment it matters (entering financial data, the paywall). It's a static About entry. | `more.tsx:125-133`; onboarding flow | A deliberate trust moment on the surfaces where a debt-stressed user is deciding to believe you. |

---

## 6. Store presence + cold-start — **P1**

**What the bar demands:** acquisition-grade store presence (sells the active/emotional features + trust positioning) and a first-run that makes a cold user "get it" in seconds.

**Cold-start is a genuine strength.** A 4-step onboarding exists, and — notably — a **"Try with Sample Data" demo path** seeds a populated store and drops straight to Plan (`components/onboarding/WelcomeStep.tsx:22-27`; `data/demoSeed.ts:57`; gated so Payday Autopilot won't fire in demo, `hooks/use-payday-capture.ts:45`). That's real "get it in seconds" plumbing most indie apps lack.

| Sev | Gap | Evidence | What "there" looks like |
|---|---|---|---|
| **P1** | Onboarding sells **generic PFM benefits**, not the emotional payoff journey or the trust moat. The three welcome bullets are functional ("See your full payment plan," "Know your debt-free date," "Mark bills as you pay") — no emotion, no differentiation, no honest-by-design hook. | `WelcomeStep.tsx:10-14` | First-run frames the *journey* (payday → progress → debt-free celebration) and the trust stance, not a feature list. |
| **P1** | The store listing / screenshots / app-preview video (Phase 6) can't sell the active-emotional features or delight beats because **they don't exist yet** — a circular dependency: acquisition-grade presence is blocked on §2b + §3 shipping first. | (out-of-code; dependency on §2/§3) | Listing + preview lead with the celebration/momentum/payday-partner and the trust moat. |
| **P2** | Onboarding copy still references "Swipe to pay" (`WelcomeStep.tsx:13`) but swipe-to-pay was deferred to B.9/reanimated and isn't built — a small promise/reality gap. | `WelcomeStep.tsx:13` vs `V17_PLAN.md` B.4/B.9 (swipe deferred) | Copy matches shipped interactions. |

---

## 7. Recommended build-order implications (what must lead Phase 1)

Ranked by what unblocks the most downstream work:

1. **Lock the IA first (feeds Phase 0.1 → gates Phase 1).** Every screen elevation reskins onto the nav model; elevating screens before the Progress/Your-Money consolidation is settled is rework. **The IA redesign is the true critical path** — this audit's §1 is the input the 0.1 talk-through should resolve before any screen is rebuilt.

2. **Install the motion/delight runtime early — it's a hard dependency, not polish.** reanimated + expo-haptics (+ a gradient/depth lib) are **not even in the project**, so the entire Visual+motion dimension and every Phase-3 delight beat are blocked until they land. This is cheap and should be among the first Phase-1 commits so screens are built *with* motion, not retrofitted.

3. **Stand up the test harness now, in parallel (Phase 4 is "continuous, not a tail").** The store/selectors/money-math are pure TS with zero native imports (per the B.2 scan) — the cheapest possible first target. Starting here ratchets every subsequent elevation against regressions instead of accumulating an untested surface to test later.

4. **Build premium substance + the one-tier spine as the core of Phase 2 — and fix the stale tier model as a prerequisite.** Before any feature gating, collapse `premium_plus` → one Premium tier (`models.ts:36`, `DriftCard`, `payoff.tsx`) so code stops contradicting the locked strategy. Then build the **Payday Partner loop first** (reshape §9: highest ROI, fits the rebuild), then Momentum (milestones already compute — they need a *surface* + celebration, which is also the marquee delight beat). Milestone UI + the debt-paid-off celebration are where §2b delight and §3 substance converge — build them together.

5. **Schedule the data-continuity bridge as an explicit gate, not a discovery.** It's a ship-blocker (Phase 5) and nothing exists yet; surface it in the plan now so it isn't found late.

6. **Defer store-listing/creative (Phase 6) — it's correctly last**, but note it's *blocked on* §2b + §3: you can't shoot acquisition-grade screenshots of delight/premium features that don't exist. Sequence creative after the emotional beats ship.

**Net sequencing read:** IA lock → motion+test infra in the same breath → screen elevation on the new IA (with motion) → premium substance + one-tier spine (Payday Partner, then Momentum+celebration) → iPad master-detail + data bridge → creative + device-QA gate. The three P0 structural holes (IA, premium, tests) are all *foundational*, which is why they belong at the front, not the finish.
