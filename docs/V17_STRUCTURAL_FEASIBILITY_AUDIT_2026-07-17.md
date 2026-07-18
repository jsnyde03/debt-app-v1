# Debt Planner v1.7 — Structural & Feasibility Audit (2026-07-17)

> **What this is:** the deep, multi-angle feasibility re-evaluation Jason asked for at the v1.7 Phase-0 switch-in ("the 1000-ft audit should go farther — in line with what we did for Ava — determine if the implementation plan is still feasible and make any necessary adjustments based on where the app is now"). It supersedes the light "KEEP-all confirm + gap-resolution" that was the Phase-0.1 floor.
>
> **Method:** 7 parallel read-only audit agents, one per angle, each adversarial + evidence-based (file:line), each returning a feasibility verdict + concrete plan adjustments + decisions. This doc synthesizes them. Raw angle reports are preserved in the session transcript.
>
> **Central question:** given where the code actually is now (v1.6 shipped, the payday spine live, `page.tsx`/`SnowballSection`/`ResultsSection` grown large), is the v1.7→v2.0 implementation plan still feasible and right — and what adjusts?

---

## Headline verdict

**The plan's SUBSTANCE is feasible — but v1.7 AS SCOPED is not one version.**

- **No rewrite is warranted.** The pure-TS engine and the Next-static-export + Capacitor stack can carry the entire v1.7→v2.0 plan without redesign. The engine already emits the projected-balance math the Drift Tracker needs; Capacitor walls nothing (it doubles-checks the 0.4 Capacitor audit → **stay on Capacitor**).
- **But v1.7's MAXIMAL ceiling is ~2.5–3 normal versions, and the *spine alone* (Phases 1–4) is ~2** — so the "cut polish to v1.8" release valve does not rescue it (the overrun lives in the spine, not the polish). → **Recommend a re-cut** (D1).
- **Two premises in V17_PLAN are wrong and must be corrected:** monetization is *not* "store-wiring only" (a whole multi-tier paywall must be built), and the Drift Tracker headline has *no data at launch* unless baseline-recording starts in v1.7.

All 7 angles returned **FEASIBLE-WITH-ADJUSTMENTS**; the roadmap angle is **trending AT-RISK** on the scope question.

| Angle | Verdict | One-line |
|---|---|---|
| Architecture / Capacitor (=0.4) | FEASIBLE-WITH-ADJUSTMENTS | Stay on Capacitor; native surfaces feasible with a ~1–2 day setup tax; no rewrite |
| Roadmap & sequencing | **AT-RISK** | v1.7 MAXIMAL ≈ 2.5–3 versions; spine ≈ 2; re-cut into v1.7 + v1.7.5 (not v1.8) |
| Engine & data model | FEASIBLE-WITH-ADJUSTMENTS | No redesign; Drift needs a frozen baseline recorded in v1.7 (schema v3, additive) |
| Differentiation & fit | FEASIBLE-WITH-ADJUSTMENTS | Carrot data-readiness inversion; lead with the demoable calendar, not empty Drift |
| Monetization | FEASIBLE-WITH-ADJUSTMENTS | "Store-wiring only" is wrong — 4 code gaps + a multi-tier paywall to build |
| Tech-debt trajectory | FEASIBLE-WITH-ADJUSTMENTS | Accrual is outpacing paydown; §1.3 needs an internal cut-seam + a line-budget ratchet |
| Test / release infra | FEASIBLE-WITH-ADJUSTMENTS | Premium+ purchase path has zero automated coverage; iOS-sim gate wired to a dead branch |

---

## The convergent findings

### 1. v1.7 MAXIMAL is over-scoped → re-cut it *(roadmap + tech-debt + monetization + differentiation all converge)* — **[D1]**
- Effort estimate (roadmap agent): spine (Phases 0–4, 7) ≈ 16 units ≈ ~2 versions; total ≈ 20 ≈ 2.5–3×. The heaviest single item is **§1.3 = three God-file extractions on a live earner: `page.tsx` 1513 + `SnowballSection` 1396 + `ResultsSection` 908 = ~3,817 lines** — that alone is a whole robust-build version.
- The stated "cut polish (Phases 5–6) to v1.8" valve fails twice: (a) cutting ~4 units still leaves a ~16-unit spine; (b) **v1.8 is the Large Android milestone that must ship clean** — dumping v1.7 overflow there violates the ship-Android-clean principle, and Sentry/3-tier/B1 are *hard Android prerequisites* that can't be in a cuttable bucket.
- Tech-debt agent independently reached the same place: give §1.3 an **internal cut-seam** (extract `page.tsx` + `SnowballSection` first — Phase 2 touches them — with `ResultsSection` last and cuttable), and add an **automated line-budget CI guard** (the missing anti-re-accretion ratchet — see finding 6).

### 2. Monetization is NOT "store-wiring only" — a V17_PLAN premise is wrong *(monetization agent)*
Four confirmed code gaps; turning on Premium+ is a real build, not a config flip:
- **G1** `getSubscriptionPlan()` (`revenueCat.ts:101`) returns only `"free"|"premium"` and checks only the `"premium"` entitlement → **Premium+ is unreachable at runtime** despite the type + gating existing. Same narrow type on `restorePurchases`/`purchasePremium`/`resetRevenueCatUserForTesting`.
- **G2** `getMonthlyPackage()` (`:34`) is the sole package source and can only select `.monthly` → annual is a **code change**, not an ASC toggle; `case "P1Y"` is dead display code.
- **G3 (largest)** There is **no `purchasePremiumPlus()`**, and the already-built "Upgrade to Premium+" upsell (`HistorySection.tsx:161`) routes to the single-tier `UpgradeSection` that **sells Premium, not Premium+.** Flipping `PREMIUM_PLUS_AVAILABLE=true` today would advertise Premium+ and charge for Premium. A whole multi-tier paywall (tier concept + copy + CTA + `purchasePremiumPlus()`) must be built. V17_PLAN §3.2 under-scopes this as "add paywall entries."
- **G4** `lib/analytics/track.ts` is a no-op stub with zero call sites; §3.4 (PostHog/Sentry) sits *last* in Phase 3, after the paywall flips → **the conversion funnel isn't measurable at launch.** Move analytics ahead of the flip + add the missing `track()` call sites (paywall-view / purchase-attempt / success / gate-hit).
- **Correction:** the V17_PLAN Appendix line "monetization work is store-wiring only" must be struck and §3.1/§3.2 re-scoped to include G3.

### 3. Capture-before-analytics: record the Drift baseline in v1.7 *(engine + differentiation + roadmap converge)* — **[D2], [D3]**
- **The Drift Tracker headline ("N days behind") has no data at launch.** `PayCycleSnapshot` (`debtPlannerStorage.ts:88`) stores actuals only — no stored projected balance, no skipped-recommendation record. `computeCycleDelta` is actual-vs-actual, not plan-vs-actual.
- **But the math exists** — `buildPayoffTrajectory` already emits the full projected-balance array; the Drift Tracker is a new pure `computeDrift(baseline, actuals)` reconciliation-tested function on *existing* engine outputs (no engine change). The capture site is ready (`page.tsx:904` rollover). Migration is additive (`MIGRATIONS[3]`, schema v3) — but a migration can only stamp, **not backfill**.
- **→ Recording MUST start in v1.7** (Phase 1, anchored at first-plan/onboarding), or Drift launches empty for every user — the exact reason it was deferred out of v1.6.
- **0.3 answer (engine agent):** use a **frozen baseline** anchored at plan-start (true cumulative "days behind"); the real design content is the **re-anchor policy** when a user materially changes debts/paycheck (else drift measures plan edits, not adherence). A per-cycle self-correcting model degenerates into a fancier `computeCycleDelta` — rejected.
- **Conversion-sequencing inversion (differentiation agent):** lead the paywall + ASO with the **full amortization calendar** (fully populated day-one, screenshot-able) as the immediate carrot; position Drift as the *deepening* moat that grows with use. Re-scope the momentum-history chart onto the stored `totalDebtBalance` series (day-one available) and make it the explicit Phase-2 cut-seam. Never screenshot an empty Drift Tracker.

### 4. Native surfaces are feasible on Capacitor; timing + versioning are decisions *(architecture + differentiation)* — **[D5], [D6]**
- The widget + payoff Live Activity run in a separate Swift extension process — the WebView is irrelevant, so the **native ceiling equals Freedom's**. Feasible with a ~1–2 day per-surface setup tax (manual Xcode target in the committed `ios/`, App Group + **regenerate provisioning profiles** [hard rule], a thin App-Group bridge plugin mirroring Freedom's `widgetSync.ts`, a **second `codemagic.yaml` signing profile** for the widget bundle id). No migration triggered.
- **[D5]** LLM_PROOF ranks a lock-screen/widget payoff countdown the #1 durable + cheap anti-LLM moat and the direct answer to *manual-entry retention decay* (DIFFERENTIATION's #1 unaddressed risk) — yet it's parked at v1.10 behind Android. Decide: hold v1.10, or pull a first payoff-countdown surface forward to **ride the v1.8 Android native plumbing** (reusing infra stood up anyway).
- **[D6]** Version-numbering drift: the canonical ROADMAP puts widget/Live-Activity at **v1.10** (v1.9 = multi-scenario/probabilistic/BNPL), but stray annotations say v1.9. Tied to the annual-pricing drift (finding 7).

### 5. Test/release infra: the Premium+ purchase path is untested *(test-infra agent)* — **[D7]**
- **No native-shell coverage.** Every Playwright project is a browser profile; the "purchase" in tests is a web mock. Real RevenueCat/biometric/notification code has zero automated coverage. The G1 `getSubscriptionPlan` bug would pass 100% of the current suite — manual TestFlight is the only catch, and Premium+ multiplies the purchase state space.
- **The iOS-sim gate is wired to a dead branch** — its push trigger is `branches: ["v1.6-dev"]`, but v1.7 is on `v1.7-dev`, so it never auto-fires during v1.7. It's also flaky-by-construction (4-attempt Maestro retry loop) and single-flow.
- **`tsc` is absent from the release gate** — narrower than "no typechecking" (the Next build catches in-graph errors), but `lib/testing/*` + `scripts/` run via `tsx` (strips types, no check) — exactly the harness Phase 1.1/1.2 churn.
- **Must-land-in-v1.7 (ranked):** (1) `tsc --noEmit` in `validate:release` + CI; (2) a **minimal Maestro native-smoke for the Premium+ purchase path** (the shared iOS+Android prerequisite — a plan gap; §1.6 only scopes iOS *visual*); (3) make iOS-sim a live per-push gate (fix the branch trigger + DerivedData/SPM cache) since v1.7 does high-WKWebView-risk layout work; (4) a positive-UTC-offset regression test for the Phase-4 date seam.

### 6. Tech-debt: accrual is outpacing paydown *(tech-debt agent)*
- `page.tsx` line history: v1.5 peak **1714** → after a whole version's refactor **1230** → v1.6 back to **1513** (+283, zero offsetting extraction). Paydown is a one-time spike; accrual is a per-version constant.
- Ranked debt: **#1 dead `clampMoney` + missing NaN guards** (a *live latent bug* — "$NaN" can render in forecast/insights formatters — outranks tidiness; fold into §1.1); **#2 `roundMoney` ×13** (all 12 dup bodies byte-identical; §1.1 + an ESLint no-redeclare ratchet); **#3 type fragmentation `Debt`×2/`Goal`×3** (~31 sites, engine-adjacent, compounds under Drift — must land before Phase 2, §1.2); **#4 God-files** (change-velocity drag).
- **The missing mechanism:** there is no automated size guard anywhere (`scripts/` has only the WebKit-flex check). An extraction without a ratchet is a spike v1.8 will undo. **Add a line-budget CI guard** (fail if the three God-files exceed a post-extraction budget) — folds into §1.6, extends the page.tsx "one narrow hook" rule to the component God-files it currently ignores.

### 7. AU/NZ wider than one file; BNPL is a real engine change; stale doc items *(engine + roadmap)*
- **AU/NZ date bug** confirmed at the 7 production sites (`toISOString().slice(0,10)` re-serializes local dates through UTC → positive-UTC off-by-one); fix is a single shared local-date formatter, low-risk, one positive-UTC reconciliation test. **Currency is ~5 en-US/USD sites, not one** (`formatCurrency`, `formatDisplayAmount`, `projectForecast`, `TimelineSection`, month-label formatters) — widen §4.2.
- **BNPL (v1.9)** is a real 3-file engine change — the data model is ready (`remainingPayments`/`scheduledPaymentAmount` exist + populated) but the engine ignores them (amortizes BNPL as revolving) → reconciliation-test-gated.
- **Stale roadmap docs to reconcile:** schema-versioning still listed as v1.7 build work (shipped v1.5); FUTURE_VERSIONS presumes the 4-tier `ultimate` is added in v1.7 (contradicts "don't sell Ultimate until v2.0"); orchestrator Phases 4–5 versioned to v1.9 in FUTURE_VERSIONS vs pulled to v1.7 in V17_PLAN; momentum chart tiered Premium (V16) vs premium_plus (V17); native surfaces v1.9-vs-v1.10 annotations.

---

## Stacked decisions for Jason (recommendations first)

| # | Decision | Recommendation |
|---|---|---|
| **D1** | **Re-cut v1.7?** | ❌ **REJECTED by Jason (2026-07-18) — NO split.** The audit's "split into 2.5–3 versions and carry the debt" contradicts the entire reason v1.7 exists (the debt-*killer*; carrying debt is the spiral it was created to stop). v1.7 stays the comprehensive debt-paydown done in ONE version. _Consequence: this collapses D1 into the open Capacitor-migration question — "kill the debt" now means either kill-it-in-place (Capacitor refactor, no split) OR kill-it-by-migrating (the RN rebuild IS the robust build). See the Decision log below._ |
| **D2** | **Drift baseline model** | **Frozen baseline anchored at plan-start** + a defined re-anchor policy for material plan changes; recording starts in v1.7 (schema v3, additive). This is the 0.3 spec's core content. |
| **D3** | **Conversion carrot sequencing** | **Lead with the amortization calendar** (day-one demoable); Drift = the deepening moat; **move analytics ahead of the paywall flip.** |
| **D4** | **3 tiers vs 4 ("ultimate")** | **Ship 3** (`free\|premium\|premium_plus`); defer "ultimate" to v2.0 (every Ultimate feature needs the v2.0 backend + is un-sellable until then; a 4th tier now buys an ordinal-gating refactor for zero v1.7 revenue). Provision only the Premium+ product in ASC/Play now. |
| **D5** | **Native re-engagement surface timing** | Price it in 0.4 (done → stay on Capacitor); **evaluate pulling a first lock-screen payoff-countdown forward to ride the v1.8 Android native plumbing** rather than defaulting it to v1.10 — it fights the #1 named retention risk and reuses infra you'll stand up anyway. |
| **D6** | **Version-numbering + annual-pricing drift** | Reconcile v1.9-vs-v1.10 (may be **two** annuals — Premium+ @ v1.9, entry Premium @ v1.10 — conflated); fix native-surfaces = v1.10. Reconcile **before** creating any permanent ASC annual product ([[feedback_lock_strategy_before_irreversible_setup]]). |
| **D7** | **Fund native-shell test harness + promote iOS-sim gate** | **YES to both** — a minimal Maestro purchase-path smoke (shared iOS+Android prerequisite; the revenue code is currently untested) + fix the iOS-sim dead-branch trigger and cache so it's a real per-push gate. |

---

## Doc-hygiene corrections (fold in when the plan is restructured)
- Strike the V17_PLAN Appendix "monetization work is store-wiring only" (finding 2).
- ROADMAP/FUTURE_VERSIONS: schema-versioning shipped v1.5; align the `ultimate` tier to the D4 decision; reconcile orchestrator Phase 4–5 versioning to V17_PLAN; momentum-chart tier (Premium vs premium_plus); native-surfaces v1.10.
- `SUSTAINABILITY_REFACTOR.md` line-count + `CompletedRecommendedAction` self-contradiction fixes (already partly done in 0.1.c).

---

## Decision log (Jason)
- **2026-07-18 — Capacitor "stay" conclusion CHALLENGED.** Jason: "we could stay without a rewrite, but it's feasible only until the native version at v1.10 — I don't want to keep revisiting this every few versions; the need to keep revisiting tells me we're just continuously band-aiding the app." → The 0.4 "stay + revisit at v1.10" posture is reframed from a resolved architecture to *deferred decision-debt*. The **"keep Capacitor" premise moved**: it was right for a web-first app, but the roadmap has turned native-ambitious (widgets, Live Activity, Dynamic Type a11y, retention primitives = "100% as native as Freedom"), so Capacitor is now a permanent headwind, not a one-time tax. `CAPACITOR_CONSTRAINT_AUDIT.md` "STAY" verdict → **UNDER RE-EVALUATION**, pending a costed migration analysis.
- **2026-07-18 — D1 DECIDED: NO split.** Jason rejected the re-cut; v1.7 remains the comprehensive debt-killer in one version (carrying debt across versions defeats its purpose). **This collapses D1 into the migration decision** — "kill the debt, don't carry it" now forks:
  - **(A) Kill it in place on Capacitor** — full God-file/robustness refactor in v1.7, sequenced *extraction-before-features* to manage regression risk (the no-split internal-sequencing answer). Migration stays deferred → the Capacitor tax continues.
  - **(B) Kill it by migrating** — the RN rebuild of the UI shell IS the robust build; it eliminates the God-files AND the Capacitor tax at once (the consistent "stop band-aiding" end-state). Heavier than the in-place refactor it replaces, and would push the monetization/Drift revenue timeline.
  - **Next: price the migration** (mirror this audit's rigor — effort, live-earner risk, what carries over [engine + logic + monetization/Drift are migration-safe] vs what's rewritten [CSS/WKWebView scaffolding + native glue], and whether "migration as the robust build" is one version or two) so A-vs-B is chosen on evidence, not vibes. D1 (no split) holds either way.

## Status & next step
Phase 0.1's deep audit is **complete** (this doc + `CAPACITOR_CONSTRAINT_AUDIT.md` = the 0.1 + 0.4 deliverables). **No plan restructuring happens until Jason rules on D1–D7** — D1 (the re-cut) reshapes the whole version, so it gates the V17_PLAN/roadmap edits. On his calls: fold the approved structure into V17_PLAN + reconcile the roadmap docs, then proceed to 0.2 (IA/nav) — whose scope is lighter if D1 moves the polish clusters to v1.7.5.
