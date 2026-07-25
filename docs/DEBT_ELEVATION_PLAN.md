# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready** (supersedes the earlier "parity migration + revenue spine" framing; same ship, bigger ambition). Scope-creep isn't the constraint — comprehensiveness to reach the bar is.
>
> **This file is the lean driver.** Full per-item history, after-scans, and shipped detail live in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

---

## ▶ NOW

- **Active item:** **▶ 2.9 Can-I-Afford-This? (inverse Guardian)** — Jason promoted it over Momentum (which → Phase 3, doesn't justify premium); switch-in = design gate. **✅ 2.8 Scan-to-prefill STRUCTURE COMPLETE (native OCR → Phase-6). ✅✅ 2.7 BNPL COMPLETE. ✅✅ GUARDIAN + AUDIT PASSED. ✅ 2.6 · 2.5 · 2.4**.
- **Phase:** 2 (Premium substance + revenue spine). The Guardian headline + its convergence audit are done; the tier plumbing (2.7 → 2.8–2.11 revenue) remains.
- **Then:** **2.7 BNPL first-class** → 2.8–2.12 → **Premium-framework audit** (Phase-2 close) → Phase 3 (delight; incl. the debt-free band) → **Phase 3.5 (tutorial + demo)** → **whole-app cohesion audit** → 4 / 5 / 5.5 / 6. _(remaining audit gates: Premium-framework@Phase-2-close · whole-app-cohesion@after-3.5.)_
- **⚠️ Launch gating:** v1.7 ships as ONE release — nothing launches until Phase 6 is done + Jason is satisfied. The whole Elevation (through Phase 6) is the release.
- **Quality gate:** `validate:release:rn` (`lint:rn` + `test:regression` + `test:app` + `test:scenarios` + `test:e2e:rn`) — **green across the board.** Regression baseline (RS.1–7) + scenario testing ✅.

---

## The bar (definition of "there")

Debt ships only when it clears **Freedom-v1.0-or-above AND acquisition-ready**:
- **Structure/IA** expresses what Debt *is* (a payday-triggered emotional payoff journey), designed first-principles — not a generic PFM template.
- **Visual + motion** are a deliberate premium language: calm daily surfaces, genuinely delightful emotional beats (a debt paid off).
- **Premium is active substance** (the reshaped feature set), worth paying for — not "smart text."
- **Quality:** real automated test suite + full-native + iPad device-QA · data-continuity bridge proven on a real upgraded device · **accessibility to WCAG 2.2 AA**, designed-in and device-verified.
- **Trust is visible** (the moat: honest, on-device, never sells you more debt) — in the app and the store.
- **Store presence** is acquisition-grade and first-run makes a cold user "get it" in seconds.

## Operating principles

1. **Design-first, then build to it** — foundation (structure, visual language, reshape, readiness gaps) is designed and signed off before the build. No parity shortcuts.
2. **Technology-agnostic** — use native where it delivers a first-class result RN can't (widgets, Live Activities, App Intents). Each platform is first-class on its *own* terms; never weaken iOS for Android parity. Divergence lives only at native-capability edges; shared `packages/core` engine + shared RN surface stay common. The engine is never rewritten.
3. **iOS native edges now** (current focus + revenue); **Android's own first-class treatment at v1.8**.

---

## Phases — status

| Phase | Scope | Status |
|---|---|---|
| 0 | Design Foundation | ✅ COMPLETE (signed off) |
| 1 | Elevate the surface | ✅ COMPLETE (all surfaces, both themes) |
| **2** | **Premium substance + revenue spine** | **▶ ACTIVE** |
| 3 | Delight + native platform | upcoming |
| 4 | Quality (test harness) | largely delivered by the RS baseline; continuous |
| 5 | Data continuity + cutover | 🔒 ship-blocker, upcoming |
| 5.5 | Repo consolidation | before the release gate |
| 6 | Launch-ready | final |

Phases 1–3 interleave per screen; Phase 4 quality is continuous, not a tail step.
**Completed-phase detail → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).**

- **Phase 0 ✅** — IA (3-tab: Today · Progress · Money + a "•••" More) · visual language (cool slate/navy, constant navy hero panels) · motion spec (Reanimated + `<Motion>` + Skia) · premium reshape (one tier + Lifetime + portfolio-sub seam) · readiness audit · a11y standard. Synthesis → `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md`.
- **Phase 1 ✅** — every surface elevated: Today · Progress (Skia ring + trajectory) · Money (Debts/Bills/Goals, virtualized) · More (TrustCard). Whole-phase coherence noted (hero-language gap; entrance-motion → Phase 3).

---

## Phase 2 — Premium substance + revenue spine ▶ ACTIVE

**🔑 Canonical strategy = `DEBT_PREMIUM_STRATEGY_2026-07-21.md`. Canonical Guardian build artifact = `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6).**
Premium identity = **automation** ("the app does the manual work, you confirm"). Headline = the **Payday Cushion Guardian** ("am I going to make it THIS paycheck?"). Moat = on-device by default, E2EE the floor. 4-tier ladder: Free · Premium ~$4.99 (automation, on-device) · Premium Connected +$5 (opt-in Plaid, ~v1.8) · Ava/AI (future).
Hard rule: the Guardian frames tight-cycle **risk + a safe move**, never a false-precise $ verdict (it runs on a projection).

### Shipped (detail → LOG)
- **2.1 One-tier foundation ✅** — `SubscriptionPlan = 'free' | 'premium'`; `src/subscription/` gating; dev "Simulate Premium" toggle.
- **2.2 Free-tier completion ✅** — built What-If · Amortization · History elevation; **scrapped Forecast + Smart Insights** (redundant/weak — kept free lean).
- **2.3 Projection auto-maintenance ✅** — last-verified anchor + live projected balance ("estimated · verified {date}"); payday verify-loop; two-beat payoff (confirmed $0 only). Honesty free, automation premium.
- **✅✅ 2.4 PAYDAY CUSHION GUARDIAN — COMPLETE (2.4.1–2.4.11; the major feature).** Engine · data substrate · §2.0 confidence-governance · cash-flow brain (forecast state-threading · crunch detection · water-fill · waterfall · paused-deploy · income learning · drill-down) · graduation · calibration scorecard + Cash Runway · proactive notification · reshapes + **Safety-net** reserve lifecycle (release · attestation · walk-back) + two-sided safe move. Deferred: 2.4.11.4d band → Phase 3 · 2.4.11.5 demo → Phase 3.5. **Whole-feature after-scan → LOG**; its coherence findings feed the convergence audit @2.6 (see that item).
- **RS "break-it" regression baseline ✅ (RS.1–7) + Scenario testing ✅** — core fuzz · app-layer · scenario (`test:scenarios`, safety-net lifecycle) · RN-web e2e; fixed 2 money-path bugs; RN gained its first e2e harness + scoped lint; legacy Next gate retired. All in `validate:release:rn`. Docs: `REGRESSION_BASELINE_2026-07-24.md`.
- **✅ 2.5 Smart obligation quality layer — COMPLETE (2026-07-24).** RESCOPED off a stale premise (category/BNPL-term/variance already captured · one-off + BNPL-expiry already handled → both heuristics scrapped; BNPL-first-class → new item 2.7). Shipped the two real gaps: **trials** (pure `effectiveObligationAmount` resolver at the 2 store→engine boundaries + `ExpenseSheet` capture + Bills-list indicator + a tier-agnostic Today "trial ended — keep/cancel?" card that stops a cancelled trial projecting a phantom bill) + **variable-bill 15% reserve buffer** (composed into the uncertainty `max`, premium-gated). Full gate green (e2e 15/15); both themes verified. Detail → LOG.
- **✅✅ 2.6 Close-the-loop + THE RECOVERY PLAN — COMPLETE (2026-07-24), the top differentiator + the last Guardian piece.** Design consensus w/ Jason ("one ladder, two directions"): Recovery = the Guardian's priority ladder run in deficit, same card/voice/engine. Shipped: pure `classifyDeferability` + `buildRecoveryPlan` (largest-first ranking · gap math · un-closeable honesty) → `selectRecoveryPlan` + honest `deferExpense` (advance due date one cycle) → `RecoveryPlanSection` inline in the Guardian shortfall card (COVER NOW + live SAFE TO DEFER checklist + per-bill override + one-tap apply, all surfaces update reactively). Free keeps the value-led read (built plan = premium acting). +35 asserts · e2e 18/18 · both themes cohesive. Interest-Saved → 2.9. **Whole-2.6 after-scan → convergence audit.** Detail → LOG.
- **✅ 2.8 Scan-to-prefill — STRUCTURE COMPLETE (2026-07-25; native OCR device-QA @ Phase 6).** Apple Vision (on-device, no-Google): pure `parseStatementText` (issuer·balance·min·APR·ISO-date heuristics, +18 asserts) · a local Expo module `modules/scan-vision` (VisionKit doc-scan → Vision OCR, NO new npm dep, built now) · a "Scan a statement" entry → prefill the DebtSheet → confirm (free) + premium "Re-scan to update" keeps-current. Web demos the flow via a sample (real OCR is iOS-native). e2e 21/21, both themes. Native compile/OCR → Phase-6 device-QA. Detail → LOG.
- **✅✅ 2.7 BNPL as a first-class obligation — COMPLETE (2026-07-24).** All 5 leaves: installment-native model (scheduled × remaining canonical, balance derived, migration v6) · BNPL-native capture/display (own sheet fields + provider · "X of N paid" · cadence-aware row) · Guardian-aware cadence (bounded fix: in-window installment scaling so a monthly earner's biweekly BNPL isn't under-counted) + a between-paycheck heads-up · consolidated BNPL calendar (Money → Debts, monthly-grouped, free). Coheres across row + Guardian + calendar; fallback BNPLs degrade gracefully. e2e 20/20, both themes. Deferred → backlog (general sub-cycle undercount · BNPL payoff-rate · originalBalance staleness · monthly-only amortization). Detail → LOG.
- **✅✅ GUARDIAN CONVERGENCE AUDIT — PASSED, 4/4-lens CONSENSUS it's premium-level & ship-ready (2026-07-24).** Flagship adversarial method, **2 rounds × 4 lenses** (correctness/substrate · honesty · premium-value · UX/wording). Round 1: 8 major/blocker (recovery autopay-false-coverage · a11y group-trap · free-shortfall-read paywalled · cold-start projection · reserve-release overstatement · surface duplication · uncategorized→deferrable · empty-state) + minors → all fixed (MF.1–MF.7). Round 2 re-verified + **caught MF.4 incomplete** (What-If/amortization + the drift baseline still on the dampened allocation — 2 premium screens disagreed) → completed + date-parity-asserted. Also **refuted** several round-1 ledger items (premium-later-than-free positioning · numbers-contradiction · attestation-over-promise · starter-EF). Tier-3 → Phase 3; 2 minors (onboardedAt scope · variable-buffer category) → backlog. Docs: `DEBT_GUARDIAN_CONVERGENCE_AUDIT_2026-07-24.md` + `…_ROUND2_2026-07-24.md`.

### Active Queue — the live build _(decomposed; the queue never sits idle)_

**▶ 2.9 ⭐ Can-I-Afford-This? — the inverse Guardian** — premium AUTOMATION: re-solve the cycle for a hypothetical one-off expense → a cushion-aware yes / tight / no + the impact. Reuses the Guardian engine (inject a synthetic one-off → re-run `selectPaydayGuardian`); survives debt=$0. **Design aligned w/ Jason 2026-07-25: a card on Today (inverse sibling of the Guardian); free taste (honest "~$X discretionary this paycheck") + premium full (verdict · safe alternative · before/after cushion viz · BNPL variant).**
- [x] **2.9.1 [DESIGN GATE] ✅ (2026-07-25)** — before-scan: `buildAllocation` runs `allocatePaycheck` off `store.requiredExpenses`, so a synthetic one-off re-solve is clean + genuinely reuses the engine. Entry + read + impact viz + gating agreed w/ Jason.
- [x] **2.9.2 ✅ (2026-07-25)** core — pure `computeAffordability(discretionary, amount, floor)` → comfortable/tight/short + cushionAfter + shortBy (+13 core asserts) + app `selectAffordability(store, amount)` (reuses `selectDiscretionary`, premium holdbacks reflected; discretionary-now = free taste). tsc + regression green.
- [x] **2.9.3 ✅ (2026-07-25)** basic verdict card on Today (`AffordabilityCard`) — free taste ("~$X spare this paycheck" + invite) / premium verdict in the Guardian voice (comfortable/tight/short + safe alternative). Live-verified on the dev server. **⭐ Design EXPANDED w/ Jason: make it a premium ACTOR (below).**
- [ ] **2.9.4 Apply-to-plan (the actor)** — `[Apply to this paycheck]` (fits/tight) → a NAMED one-off purchase this cycle; the Guardian · cushion · allocation · debt-free date · Recovery all recompute reactively (one store, like `deferExpense`) + **Undo**; honest TEXTUAL impact (debt-free-date shift + cushion-after).
- [ ] **2.9.5 Cover-from-savings (tight)** — `[Cover $X from {goal}]` to hold the line (reuse the tight-top-up pattern).
- [ ] **2.9.6 Save-for-it (short) — DEFECT-DRIVEN REDESIGN (Jason 2026-07-25).** _Defect: a savings goal is `optional_goal` → funded AFTER debt in `allocatePaycheck`, so the "ready by {date}" promise is false for a debt-carrying user._ Fix + expand:
  - [x] **2.9.6a [engine] ✅ (2026-07-25)** `priority?: boolean` on `Goal` (core storage + engine types, backfill-safe) → `allocatePaycheck` funds priority savings goals AFTER the starter-EF but BEFORE the snowball (capped at target); non-priority savings still fund after debt (excluded from the pre-debt pass, no double-fund). +4 reconciliation asserts (priority funds $200 before debt · non-priority gets $0 · snowball reduced by exactly the diverted amount · same goal without the flag funds after debt). tsc + regression green.
  - [x] **2.9.6b [selector] ✅** `selectSaveForItOptions` — fast/balanced/debt-first, each w/ its pace + trade-off; app-tested. **+ engine PACE CAP (`priorityPerPaycheck`)** so a chosen "$X/paycheck" is real, not greedy (+2 asserts).
  - [x] **2.9.6c [UI] Save-for-it SHEET ✅ (hybrid)** — 4 options (Jason: added **"Set your own"** custom pace) each w/ its trade-off + a SIGN-OFF submit → creates the goal w/ the chosen `priority`(+pace). **Live-testing fixes (Jason):** (1) card **confirmation state** ("Now saving $X/paycheck toward {name}") + **duplicate safeguard** (saved-state removes the button + a submit double-tap guard); (2) **the sinking-fund payment now surfaces in Required/Recommended Actions** — included in `selectActiveRecommendedActions` BEFORE debt, at this-cycle's pace, **scoped to `priority` goals only** (normal optional goals stay after debt, Jason's hard constraint).
- [x] **2.9.7 verify ✅ (2026-07-25)** — tsc · lint · regression · app (+8 affordability asserts) · scenarios · **e2e 23/23** · **both themes** (card · 4-option sheet · sinking-fund-in-actions). Jason-approved live. **Live-testing fixes all in: confirmation state · duplicate guards (saved-state + submit ref + name-dedup) · sinking-fund surfaces in Recommended before debt (priority-only) · Guardian Safety-net NO regression (cold-start-only; demo is `genuineCycleCount:6` established, reproduced 0→$480 / 6→$0).**
- **Exit:** the inverse-Guardian is a premium ACTOR (apply · cover-from-savings · honest multi-option save-for-it w/ sign-off), reactive + honest; verified both themes + tests + e2e. **Cushion-bar before/after VIZ → Phase 3.**

### The rest of the tier _(2.1–2.8 shipped · 2.9 inverse-Guardian is the Active Queue above)_
- [ ] **2.10 Widget + App Intents + Live Activity** — payoff-countdown Live Activity + interactive-widget App Intents (mark-paid / log-paycheck). One native build (with Phase-6 device work).
- [ ] **2.11 Revenue spine** — RevenueCat + paywall (port Gig) + Lifetime 2nd offer + portfolio-sub seam + analytics + Sentry. **[DECISION before any StoreKit SKU]:** guarantee window/terms (default to honest "not charged until day 30" if StoreKit can't honor a refund) · Lifetime scope · pin annual + Lifetime prices. "Watches every paycheck" copy gated on 2.4.10. Launch-flip gated on value shipped.
- [ ] **2.12 E2EE iCloud backup + AU/NZ** — verify the ADP-status API exists or fall back to "encrypted iCloud backup" wording (backup ≠ sync; multi-device sync deferred).
- [ ] **⭐ [AUDIT GATE] Premium-framework audit — after Phase 2 complete (all of 2.1–2.12) (Jason 2026-07-24).** Adversarially review the ENTIRE Premium framework (not just Guardian) → a verdict: the automation identity · the 4-tier ladder · the free/premium line across EVERY feature · pricing / paywall / guarantee · the moat & positioning · does the whole tier cohere and justify the price. The superset of the Guardian convergence audit (which is scoped to Guardian at 2.6). Flagship adversarial method — rotated lenses, consensus = the verdict.
  - **⭐ Added criterion (Jason 2026-07-24): BNPL-cadence coverage.** RESEARCH the real BNPL/financing market and verify EVERY cadence/term is correctly captured, modeled, displayed, and Guardian-handled — biweekly pay-in-4 (Klarna/Afterpay) · monthly financing at every term length (Affirm 3/6/12/24/48-month) · one-time deferred (Klarna pay-in-30) · every-3-months and any other real interval. Confirm the (installment × count × cadence) model + the crunch detection hold across all of them, with no cadence silently mishandled.

### Future premium features (post-Guardian; scope into v1.7 vs v1.7.x/v1.8 with Jason)
_(① Can-I-Afford-This? promoted → Active Queue as 2.9.)_
- **② Windfall Autopilot** — found money → optimal split in one confirm (`store.windfall` exists; the split IS the waterfall).
- ③ Life-Event Simulator (→ Phase-3 What-If explorer) · ④ Strategy Auto-Advisor (low-pri) · ⑤ Bill-shock autopilot (→ Connected tier).
- **⛔ DO NOT build:** refi / insurance / rate-drop lead-gen — cut (violates "never sell you more debt").
- **Later:** Premium Connected tier (Plaid, ~v1.8, its own workstream, never gates on-device) · Ava AI tier (future).

---

## Phase 3 — Delight + native platform

The emotional layer built *with* the features; restraint on daily surfaces, delight on beats.
- **Debt-paid-off celebration** (full Skia spectacle + permanent "debt-vanquished" archive) — **HARD: fires ONLY on a confirmed $0**, never projected.
- **Momentum (moved here from Phase 2, Jason 2026-07-25 — reevaluate scope here)** — the Interest-Saved read + any "you've come this far" proof are FREE emotional-journey/delight, not premium; the debts-vanquished archive is the same surface as the celebration above (unify, don't duplicate). Reassess whether Momentum adds anything beyond the free hero/trajectory/interest-saved + this celebration; keep only what's genuinely net-new.
- **Milestone-cross pulse** (journey-rail node spring + haptic; infra already exists).
- **Interactivity passes:** tappable journey-ring milestones · Guardian cushion-bar + Cash Runway (tap/scrub/haptics) · trajectory-chart (payoff waypoints + touch-scrubbing).
- **§2.9 affordability impact viz (moved here from Phase 2, Jason 2026-07-25)** — the before/after cushion-bar (Skia) for a "can I afford this?" apply: the cushion carving out the purchase, the debt-free date sliding. Same family as the Guardian adjustment impact-viz backlog item (unify). The v1.7 actor ships the honest TEXTUAL impact; this is its animated delight layer.
- **⭐ Variable-income debt-free BAND — trajectory cone (design LOCKED w/ Jason 2026-07-24; from 2.4.11.4d, moved here to build WITH the trajectory work).** For a **variable-income** user (fixed income → one date, no band), show the payoff as a **cone of outcomes** on the Skia trajectory chart: plot BOTH payoff paths — **typical** (extra-to-debt off the entered/typical amount → faster, gold) and **lean** (extra off `leanAmount` → slower, conservative) — with a shaded band between them narrowing to two dated endpoints. Framing (spec §2.5): **typical = the motivational HEADLINE** ("On track for {typical}"), **lean = the safe-floor secondary** ("Safe-floor {lean}") — NEVER a bare symmetric range (invites anchoring on the rosy end); interest-cost-of-caution stays **rounded/qualitative** (no false-precise $) until the state-threaded forecast is proven. **Engine = "one engine, two runs":** a `selectDebtFreeBand(store, allocation)` → `{ typical, lean, hasBand }` — typical = the existing `selectDebtFreeDate`; lean = a second `projectDebtPayoff` with the extra computed off a lean-income allocation; `hasBand` = variable AND the dates differ. Reconciliation-test both runs. The What-If overlay becomes a mode so it never competes with the band. **⭐ NO SCAFFOLDING NEEDED NOW (confirmed w/ Jason 2026-07-24):** the band is a PURE DERIVATION from data that already exists + is already captured — typical = the entered `amount`, lean = `paycheck.leanAmount` (populated by the income-learning nudge 2.4.7.8, stored via 2.4.D), plus `incomeVaries` + debts + the payoff engine. Nothing accumulates specifically for the band; no schema / migration / persisted state to seed in v1.7. Fully deferrable with zero risk.
- **"Safety net" tooltip (Jason 2026-07-24)** — a tap/press affordance on the Guardian's "Safety net" legend entry that briefly explains what it is (the extra held while the Guardian learns your bills, frees up as it does), as a lighter on-card complement to the full 3.5 tutorial.
- **⭐ Guardian audit Tier-3 (from the convergence audit, Jason → Phase 3):** (1) **hero "Free" → "Safe"/"Flexible"** label — the numbers reconcile with the Guardian's "Cushion" but the labels contradict; bring 2–3 options (product-language call, don't flip silently); (2) **ack-card density coordinator** — a single priority ack-slot so Today never stacks 5–6 cards (pairs with these interactivity passes + the whole-app cohesion audit); (3) **"Keep essential" → toggle + undo** (recovery interactivity). Detail → `DEBT_GUARDIAN_CONVERGENCE_AUDIT_2026-07-24.md`.
- **What-If full-impact explorer** — propagate the extra through the whole model, month by month (substantial; likely its own slice / v1.8).
- **History per-cycle detail drilldown** (v1.8 candidate).
- **Entrance-motion revisit** — decide the `<Motion>` FadeInDown language once, apply consistently (or drop on calm surfaces).
- **Genuinely-native iPad** — per-screen re-layout (multi-column / master-detail), not a centered phone column. _(Jason 2026-07-24 — AFTER the Guardian is polished + final, never before)_

Both the interactive tutorial and the marketing/demo showcase live here: they share the same **sandboxed, scriptable Guardian substrate** and must run on the FINAL polished Guardian, so building either on a still-moving Guardian (2.4.11.x · Recovery · convergence audit · Phase-3 interactivity) is double work.

**(A) Interactive tutorial —** a **fully interactive, hands-on walkthrough** on a **sandboxed example** (never touches the real plan): the user *drives* it and watches it respond, so the concepts land by doing.
- **Steps (interactive):** meet it ("will you make it this paycheck?") → read the bar (tap each zone to reveal) → **your line (drag the floor slider, watch the Guardian re-plan live)** → **the settling-in reserve (tap "a surprise lands" → watch it absorb it; tap "once I've learned you" → watch it release)** → the safe move + "your call" → done.
- **Reach:** fires on first premium Guardian view (**absorbs/upgrades the 2.4.11.3 intro** into the real tour); **replayable** from a "?" on the card + a "How the Guardian works" row in More.
- **Rough decomposition:** stepped-flow scaffold + replay entry points → shared sandbox substrate (isolated, scriptable states) → interactive bar (tap-to-reveal) → interactive "your line" slider (live re-plan) → interactive reserve lifecycle (surprise→absorb→release) → safe-move/your-call + wrap → copy + both-theme + a11y verify.

**(B) Bounded demo showcase (moved here from 2.4.11.5) —** a **distinct cold-start-bounded premium showcase** on the shared sandbox (§3.6, launch-critical for GTM/ASO): day-one value only (floor auto-protect + tight one-tap + a visible water-fill smoothing of a lumpy bill), scorecard shown as "here's what I'll show once I learn your income," reserves HELD (not deployed) — NOT a matured Guardian the month-one buyer can't be. Isolated (never feeds real calibration / `genuineCycleCount`). Plus a free at-risk showcase state. The interactive demo is essentially a scripted run of the tutorial.

## Whole-app cohesion audit _(AUDIT GATE — after Phase 3.5, Jason 2026-07-24)_

- [ ] The same adversarial rigor for the ENTIRE APP up to this point (Phases 0–3.5: every surface + premium + delight/native + the tutorial & demo), with an added **PURE-EVALUATION / COHESION** criterion: evaluate every element and ensure the whole app works TOGETHER, never in isolation — does the Today hero cohere with the Guardian below it? do they make sense side by side? cross-surface consistency (voice · visual · motion · numbers) app-wide. Placed AFTER 3.5 so the tutorial + demo are in scope. Output triaged must-fix vs later, folded before the release gate.

## Phase 4 — Quality

- **✅ Largely delivered by the RS baseline** — tsx app-layer harness + core engine fuzz + first RN-web e2e harness, green-gated via `validate:release:rn`. Continuous-quality (both-theme visual verification, whole-app gap analysis) is ongoing.
- **Residual coverage backlog (low-risk):** extend `testEngineFuzz` → `holdbackComposition` · RN e2e for missed/stale/debt-free states + a mobile viewport · app-layer CRUD-action coverage (addGoal/markExpensePaid/etc.).
- **e2e harness race (2.5 surfaced):** `test:e2e:rn`'s `webServer` re-exports + spawns its own `serve` on :4319, which races a hand-started serve under parallel workers → flaky (guardian "clear"/"tight" + trials flaked in a full parallel run, all 14/14 green single-worker in isolation). Harden: `reuseExistingServer` should skip the re-export when :4319 is up; or serialize/retry. Env, not product code.
- **Known web-e2e limits:** Playwright-on-RN-web can't reliably drive gesture components, `SectionList` row taps, or stacked modals → prefer localStorage-seed + deep-link + component-level; push gesture/tap flows to Maestro/device.

## Phase 5 — Data continuity + cutover 🔒 ship-blocker

The migration bridge (WKWebView `localStorage` → RN storage), **proven on a real populated upgraded device**, then cutover to the RN app as the shipping app.

## Phase 5.5 — Repo consolidation (before the release gate)

Remove the dead Capacitor/Next tree once cutover proves the RN app ships.
- **5.5.1** remove the root Capacitor/Next surface (God-files · `ios/` Capacitor bits · `next.config` · WebView glue). *(This also retires the parked `validate:release:legacy` gate + the root Next.js lint.)*
- **5.5.2 [DECISION]** final repo structure — promote `apps/rn` to root vs. keep the monorepo (rec: keep the monorepo; `packages/core` is shared portfolio-wide).
- **5.5.3** update tooling / CI / docs to the consolidated tree; tsc + tests + build green.
- **5.5.4 ✅ DONE EARLY** — `apps/rn` has its own `eslint-config-expo` (pulled forward by RS.7).
- Verify scope against the CURRENT tree at switch-in (pre-authored cleanup drifts).

## Phase 6 — Launch-ready

Acquisition-grade store presence (screenshots · app-preview video · listing selling the active/emotional features + the trust moat) · cold-start/first-run excellence · thorough device-QA gate · submit.

**📋 Device-QA ledger (verify on real hardware at the gate — web can't cover these):**
- Native Skia render + draw-on motion on all surfaces (Progress ring · trajectory · Bills allocation bar · Cash Runway chart) + CanvasKit-native.
- `boxShadow` + `overflow:hidden` native clip · `<Motion>`/`<CountUp>` native runtime.
- Guardian `gpp-*` MaterialIcons render · VoiceOver walk (structure fixed; walk owed).
- Native risk-notification delivery + rollover-while-backgrounded reliability · Freedom `ffp://` deep-link handoff (+ possible `LSApplicationQueriesSchemes`).
- What-If slider drag + gesture-vs-ScrollView arbitration · Today buckets vs real overdue-carried / autopay-presumed rows.
- Per-screen iPad re-layout · confidence-decay threshold tuning on real use.
- **§2.8 native scan (Apple Vision):** the `scan-vision` local Expo module autolinks + compiles on a real build · `VNDocumentCameraViewController` presents + returns a scan · `VNRecognizeTextRequest` OCR quality on real statements (tune `parseStatementText` against real OCR text) · camera permission prompt · `NSCameraUsageDescription` copy. Web/simulator can't cover any of this.

---

## Deferred backlog

- **Safety-net "covered" honesty (4b after-scan)** — the release "it covered a $X surprise" uses the full `surpriseOutflowLog` sum; scope it to the hold window + cap at the held reserve (or soften to "helped cover") so it never overstates.
- **Attestation affordance for variable income (4c after-scan)** — the "I'll hold a smaller safety net" affordance shows whenever discovery is active, but a variable earner's hold is often cold-start (income), so attesting bills barely moves it; gate the affordance to where the discovery reserve is meaningfully reducible, or adjust the copy.
- **⭐ Guardian adjustment IMPACT visualization (Jason 2026-07-24, v1.1/1.2) — the 4c attestation is a good v1, but show the user HOW their plan changes when they attest / adjust — VISUALLY, not text.** A Skia-driven animated before/after: the safety net reducing (e.g. $1,000 → $500), the freed money flowing to debt, the debt-free date sliding earlier — a "see the impact" breakdown. Generalizes to any Guardian adjustment (attestation · adjust-your-line · top-up). Use the tools at our disposal (Skia/Reanimated); make it visually impressive. Pairs with the Phase-3 Guardian interactivity passes.

- **General sub-cycle obligation undercount** (2.7.4 before-scan) — the allocator counts EVERY obligation once per paycheck cycle at its single due date, so a monthly-paid user with a *weekly/biweekly RequiredExpense* (not just BNPL) is undercounted too. The clean general fix expands obligations into per-occurrence instances across the allocator + paid-flags + rollover (a core refactor). 2.7.4 fixes the BNPL case in the cash read only. → general fix / Premium-framework audit.
- **BNPL payoff-RATE undercount in `projectDebtPayoff`** (2.7.4 before-scan) — the Progress debt-free date / trajectory is MONTHLY-based and pays a BNPL 1× minimum per month, so a biweekly BNPL retires ~2× too slowly in the payoff projection. 2.7.4 fixes the Guardian cash-crunch read, not the debt-free-date paydown rate → normalize the BNPL monthly-equivalent payment in the payoff projection (with the cadence-aware amortization backlog item).
- **GoalSheet doesn't dedupe goal names** (2.9.6 after-scan) — the save-for-it now blocks a duplicate goal name, but `GoalSheet` (the normal goal-add flow) still doesn't validate duplicates (only name-present + target-present). Add the same case-insensitive dedupe to `GoalSheet` (excluding the edited goal in edit mode) for consistency across all goal-creation paths.
- **Affordability card density** (2.9.6 after-scan) — the card now carries amount + name inputs + apply + save-for-it + confirmation states; on a short/tight Today it adds to the stacked-card density the Guardian work already flagged. Fold into the ack-card density coordinator (Phase-3 Tier-3).
- **§2.8 web shows the scan entry with sample data** (2.8.4 after-scan) — `scan.web.ts` returns a sample statement so the flow is demoable/verifiable on web; fine for the demo/verification surface, but if a web build ships, decide whether to hide the Scan entry on web (`isScanAvailable()`→false) or keep it as a "try it" demo. Also: a free-tier value-led invite for the premium "Re-scan to update" is a later polish.
- **BNPL "of N" total can go stale on an upward remaining-edit** (2.7.3 after-scan) — `bnplPaymentsTotal` derives from `originalBalance` (creation-time); editing `remainingPayments` up doesn't re-raise it, so "2 of 4" could under-count the total. Low-harm; re-derive `originalBalance` on a BNPL terms edit, or cap total at max(remaining, derived).
- **Behavioral mis-entry detection** (2.5 before-scan) — a genuinely one-off charge entered as a *recurring* bill can't be auto-flagged without a spend-history signal we don't have on-device → **Connected/Plaid tier** (never gates the on-device Guardian).
- **Demo-able Payday Autopilot** — disabled in Demo Mode (a stale demo payday pops the sheet) → a demo-safe walkthrough is a later candidate.
- **Starter-EF deploy overstates cushion** — when the spare funds the starter emergency fund (EF<$1k, debt live), `deployedToDebt`=0 so the Guardian's "keeps all of it as your cushion" branch reads as if it were all cushion (EF funding isn't cushion). Surfaced by 2.4.11.4a; pre-existing, reverse of the EF-vs-debt tradeoff → convergence-audit correctness/honesty lens.
- **`selectTightTopUp` offers the Emergency Fund** — raiding the safety net for a covered-but-tight dip is questionable; prefer a discretionary savings goal, EF last-or-never (design call — for the convergence audit).
- **Hero vs Guardian number coherence** — hero shows paycheck flow ("$210 free") while the Guardian shows total cushion ("$500 held") — confirm it doesn't read as a conflict (convergence-audit coherence lens).
- **No undo for the tight-case top-up** (missed-paycheck has one).
- **Gold-usage app-wide sweep** — formalize "gold = the debt-free moment only"; sweep Today/Money/More for gold-as-text that isn't a debt-free moment.
- **Money hero-language coherence** — Bills (Skia bar) · Goals (progress bar) · Debts (bare); decide whether the calm-micro-viz hero language extends to Debts.
- **Persistent-cushion refinement** → Connected tier. **Bill-shock autopilot** → Connected tier.
- Dead code: `ProgressRing` / `MilestonesRow` — delete once the on-ring-journey sign-off lands.

## Decisions (log)

- **E1 ✅ (2026-07-20)** — the design-first, best-in-class re-scope is ratified. Mode: "approve but talk through as we go."
- **E2 ✅ (2026-07-20)** — Phase 0 opened with the readiness audit + IA redesign in parallel.
- **Legacy gate RETIRED ✅ (2026-07-24)** — `validate:release` → the RN gate; old Next-app gate parked as `validate:release:legacy` until 5.5.1.
- **Version framing is Jason's call** — stays "v1.7 re-scoped as The Elevation" unless renumbered.
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel; lock price early, launch late. Un-chattable = stateful · scheduled · proactive · relational · on-device.
- **2.6 Recovery design consensus ✅ (2026-07-24, Jason "I agree completely")** — "one ladder, two directions": Recovery = the Guardian's existing priority ladder run in deficit (same card/voice/engine, unify trouble surfaces). Decisions: classify = category-default + per-bill override; defer = advance the due date one cycle honestly. Full detail in the Active-Queue 2.6 block.
- **2.7.1 design gate ✅ (2026-07-24, Jason ✓)** — before-scan corrected the pre-authored premise: `scheduledPaymentAmount`/`remainingPayments` are **dead capture** (collected, read back nowhere; engine + amortization run BNPL off `balance`+`minimumPayment`, `apr:0`), not a conflicting display surface. Design (both my recs): **installment-native + balance fallback** (installment fields → source of truth, balance derived; absent → balance+minimum = the reconciliation) · **afford-check → inverse-Guardian ①** (build that engine once); 2.7 keeps the BNPL calendar.
- **2.5 rescope ✅ (2026-07-24, Jason ✓)** — before-scan found category/BNPL-term/variance already captured + one-off already handled by `one-time` recurrence → one-off heuristic SCRAPPED. A deeper read then showed **BNPL-expiry is also already handled** (required minimum + balance-depletion retires it) → **BNPL-expiry SCRAPPED**. Net 2.5 = **trials (new) + variable-bill modest %-buffer reserve** (Jason picked the bounded-% approach folded into the cushion). Honest high-value cut over the pre-authored 4-field blob.
- **2.9 pivot ✅ (2026-07-25, Jason)** — Momentum doesn't justify premium (the Interest-Saved projection is already free · its vanquished archive duplicates the free Phase-3 debt-paid-off celebration · celebration is the free emotional core, not premium automation). → **Momentum MOVED to Phase 3** (reevaluate scope there); **① Can-I-Afford-This? (inverse Guardian) PROMOTED** as the premium build (on-identity automation, top net-new pick, reuses the Guardian engine + the BNPL afford-check).

## Reference docs

- **Guardian build spec (canonical):** `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6)
- **Premium strategy:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · **future features:** `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Phase 0 design synthesis:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · **motion:** `DEBT_MOTION_SPEC_2026-07-20.md`
- **Guardian audits:** `DEBT_GUARDIAN_AUDIT_2026-07-22.md` · `DEBT_GUARDIAN_REVIEW_DECISIONS_2026-07-23.md` · `DEBT_PREMIUM_ELEVATION_AUDIT_ROUND{2..6}_2026-07-23.md`
- **Regression baseline:** `REGRESSION_BASELINE_2026-07-24.md`
- **Full build history / per-item detail:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
