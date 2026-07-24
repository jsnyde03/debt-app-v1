# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready** (supersedes the earlier "parity migration + revenue spine" framing; same ship, bigger ambition). Scope-creep isn't the constraint — comprehensiveness to reach the bar is.
>
> **This file is the lean driver.** Full per-item history, after-scans, and shipped detail live in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

---

## ▶ NOW

- **Active item:** **⭐ Guardian convergence audit** (the Guardian is functionally complete through 2.6 — this gate produces the premium-worthiness verdict + a triaged fix list; Jason kicks it off deliberately). **✅ 2.6 RECOVERY PLAN COMPLETE** (the top differentiator). **✅ 2.5 · ✅ 2.4 COMPLETE**.
- **Phase:** 2 (Premium substance + revenue spine). The Guardian headline is done; the tier plumbing (2.5 → 2.6 → 2.10 revenue) remains.
- **Then:** **Guardian convergence audit** (active gate) → **2.7 BNPL first-class** → 2.8–2.12 → **Premium-framework audit** (Phase-2 close) → Phase 3 (delight; incl. the debt-free band) → **Phase 3.5 (tutorial + demo)** → **whole-app cohesion audit** → 4 / 5 / 5.5 / 6. _(3 audit gates: Guardian@2.6 · Premium-framework@Phase-2-close · whole-app-cohesion@after-3.5.)_
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
- **✅✅ 2.6 Close-the-loop + THE RECOVERY PLAN — COMPLETE (2026-07-24), the top differentiator + the last Guardian piece.** Design consensus w/ Jason ("one ladder, two directions"): Recovery = the Guardian's priority ladder run in deficit, same card/voice/engine. Shipped: pure `classifyDeferability` + `buildRecoveryPlan` (largest-first ranking · gap math · un-closeable honesty) → `selectRecoveryPlan` + honest `deferExpense` (advance due date one cycle) → `RecoveryPlanSection` inline in the Guardian shortfall card (COVER NOW + live SAFE TO DEFER checklist + per-bill override + one-tap apply, all surfaces update reactively). Free keeps the value-led read (built plan = premium acting). +35 asserts · e2e 18/18 · both themes cohesive. Interest-Saved → 2.9. **Whole-2.6 after-scan → convergence audit (below).** Detail → LOG.

### Active Queue — the live build _(decomposed; the queue never sits idle)_

**▶ GUARDIAN AUDIT MUST-FIXES** — the ⭐ convergence audit is **✅ COMPLETE (2026-07-24)**. Canonical = **`DEBT_GUARDIAN_CONVERGENCE_AUDIT_2026-07-24.md`** (4 adversarial lenses, every load-bearing finding re-verified; Phase-3/future/refuted all triaged there). **Verdict: engine sound + substrate safe + premium genuinely worth the price; NO redesign — but 8 major/blocker honesty/a11y/coherence defects at the recovery + free-read seams block ship.** **⭐ Jason directive (2026-07-24): fix EVERY major/severe/blocker NOW (MF.1–MF.6); the minors (#9 copy + all Phase-3) get a SEPARATE discussion.** Structure-first (engine → UI), test each, re-verify both themes + e2e at the end.
- [ ] **MF.1 Recovery "safe to defer" trustworthiness** [audit #1 BLOCKER · #3 · #8 major] — exclude `isAutopay` from deferrable (+ honest "reschedules your plan, not the biller's charge") · treat uncategorized/`other` as **essential** (never pre-suggest a bill we can't classify) · add the empty-deferrables copy branch.
- [ ] **MF.2 a11y** [audit #2 BLOCKER] — lift the recovery / top-up / attestation controls OUT of the `accessible` groupLabel View so VoiceOver can operate them.
- [ ] **MF.3 Free honest shortfall read** [audit #4 major, triple-confirmed] — free told "won't cover everything / about $X short"; only the built plan stays premium.
- [ ] **MF.4 Debt-free projection** [audit #5 major] — project on the steady-state deploy; strip temporary cold-start holdbacks from the long-horizon extrapolation (kills premium-later-than-free).
- [ ] **MF.5 Reserve-release honesty** [audit #6 major] — cap "covered" at the reserve actually held + gate `tapped` on a real draw.
- [ ] **MF.6 Surface unification** [audit #7 major] — suppress the RequiredActions unfunded block when premium recovery is active; one shortfall voice.
- **Exit:** MF.1–MF.6 fixed + verified (both themes · tests · e2e); the Guardian clears the audit bar → then the minors discussion → 2.7 BNPL.
- **Minors → SEPARATE discussion (Jason):** audit #9 ("protected from today" copy) + all Phase-3 (hero "Free"→"Safe" label · ack-card coordinator · variable-buffer label · keepEssential freshness+undo · cycle/paycheck · trial "Not now" · state-aware invite). Detail in the audit doc. **Refuted (no action):** 2.4a-positioning · 2.4b-contradiction · 2.4c-attestation · 2.4d-starter-EF · substrate SAFE · recovery math SOUND.

### The rest of the tier
- [ ] **2.7 ⭐ BNPL as a first-class obligation** (Jason 2026-07-24 — pull into Phase 2, AFTER the Guardian audit; NOT required for the Guardian, so it lands here, not earlier). BNPL works today (captured · projects via balance-depletion · interest-free · amortization view) — this is *elevation*, not a fix. **2.7.1** Coherence: make `scheduledPaymentAmount × remainingPayments` the canonical BNPL model; reconcile/validate `balance`+`minimumPayment` from it so the forecast + amortization view never disagree (the one real latent gap: engine uses balance+min, display uses scheduled+remaining — nothing reconciles them). **2.7.2** BNPL-native capture/display: provider (Klarna/Affirm/Afterpay) · installment cadence (often biweekly) · "payment 2 of 4" progress · next-installment date — out of the generic debt sheet. **2.7.3** Guardian: surface the next BNPL installment as a near-term lumpy obligation in crunch detection (biweekly BNPL lands between paychecks). **2.7.4** Premium angle: "Can I afford this BNPL?" (shares the inverse-Guardian engine w/ future-feature ①) + a consolidated BNPL calendar — a differentiated, under-served acquisition lever. Decompose fully at switch-in; before-scan verifies the model vs current code.
- [ ] **2.8 Scan-to-prefill** — Apple Vision OCR → prefill → confirm; free initial scan / premium keeps-current. Native, fast-follow (not launch-critical).
- [ ] **2.9 Momentum** — Interest-Saved ledger as the spine (the always-true, un-chattable number; **the Interest-Saved counterfactual moved here from 2.6 — Jason: no place in recovery**); streaks demoted; debts-vanquished archive (hooks the confirmed-$0 signal).
- [ ] **2.10 Widget + App Intents + Live Activity** — payoff-countdown Live Activity + interactive-widget App Intents (mark-paid / log-paycheck). One native build (with Phase-6 device work).
- [ ] **2.11 Revenue spine** — RevenueCat + paywall (port Gig) + Lifetime 2nd offer + portfolio-sub seam + analytics + Sentry. **[DECISION before any StoreKit SKU]:** guarantee window/terms (default to honest "not charged until day 30" if StoreKit can't honor a refund) · Lifetime scope · pin annual + Lifetime prices. "Watches every paycheck" copy gated on 2.4.10. Launch-flip gated on value shipped.
- [ ] **2.12 E2EE iCloud backup + AU/NZ** — verify the ADP-status API exists or fall back to "encrypted iCloud backup" wording (backup ≠ sync; multi-device sync deferred).
- [ ] **⭐ [AUDIT GATE] Premium-framework audit — after Phase 2 complete (all of 2.1–2.12) (Jason 2026-07-24).** Adversarially review the ENTIRE Premium framework (not just Guardian) → a verdict: the automation identity · the 4-tier ladder · the free/premium line across EVERY feature · pricing / paywall / guarantee · the moat & positioning · does the whole tier cohere and justify the price. The superset of the Guardian convergence audit (which is scoped to Guardian at 2.6). Flagship adversarial method — rotated lenses, consensus = the verdict.

### Future premium features (post-Guardian; scope into v1.7 vs v1.7.x/v1.8 with Jason)
- **① Can-I-Afford-This? (the inverse Guardian)** — re-solve the cycle for a one-off expense; survives debt=$0. *Top net-new pick.* Shares its engine with **2.7.4** (the "Can I afford this BNPL?" angle) — build the inverse-Guardian core once.
- **② Windfall Autopilot** — found money → optimal split in one confirm (`store.windfall` exists; the split IS the waterfall).
- ③ Life-Event Simulator (→ Phase-3 What-If explorer) · ④ Strategy Auto-Advisor (low-pri) · ⑤ Bill-shock autopilot (→ Connected tier).
- **⛔ DO NOT build:** refi / insurance / rate-drop lead-gen — cut (violates "never sell you more debt").
- **Later:** Premium Connected tier (Plaid, ~v1.8, its own workstream, never gates on-device) · Ava AI tier (future).

---

## Phase 3 — Delight + native platform

The emotional layer built *with* the features; restraint on daily surfaces, delight on beats.
- **Debt-paid-off celebration** (full Skia spectacle + permanent "debt-vanquished" archive) — **HARD: fires ONLY on a confirmed $0**, never projected.
- **Milestone-cross pulse** (journey-rail node spring + haptic; infra already exists).
- **Interactivity passes:** tappable journey-ring milestones · Guardian cushion-bar + Cash Runway (tap/scrub/haptics) · trajectory-chart (payoff waypoints + touch-scrubbing).
- **⭐ Variable-income debt-free BAND — trajectory cone (design LOCKED w/ Jason 2026-07-24; from 2.4.11.4d, moved here to build WITH the trajectory work).** For a **variable-income** user (fixed income → one date, no band), show the payoff as a **cone of outcomes** on the Skia trajectory chart: plot BOTH payoff paths — **typical** (extra-to-debt off the entered/typical amount → faster, gold) and **lean** (extra off `leanAmount` → slower, conservative) — with a shaded band between them narrowing to two dated endpoints. Framing (spec §2.5): **typical = the motivational HEADLINE** ("On track for {typical}"), **lean = the safe-floor secondary** ("Safe-floor {lean}") — NEVER a bare symmetric range (invites anchoring on the rosy end); interest-cost-of-caution stays **rounded/qualitative** (no false-precise $) until the state-threaded forecast is proven. **Engine = "one engine, two runs":** a `selectDebtFreeBand(store, allocation)` → `{ typical, lean, hasBand }` — typical = the existing `selectDebtFreeDate`; lean = a second `projectDebtPayoff` with the extra computed off a lean-income allocation; `hasBand` = variable AND the dates differ. Reconciliation-test both runs. The What-If overlay becomes a mode so it never competes with the band. **⭐ NO SCAFFOLDING NEEDED NOW (confirmed w/ Jason 2026-07-24):** the band is a PURE DERIVATION from data that already exists + is already captured — typical = the entered `amount`, lean = `paycheck.leanAmount` (populated by the income-learning nudge 2.4.7.8, stored via 2.4.D), plus `incomeVaries` + debts + the payoff engine. Nothing accumulates specifically for the band; no schema / migration / persisted state to seed in v1.7. Fully deferrable with zero risk.
- **"Safety net" tooltip (Jason 2026-07-24)** — a tap/press affordance on the Guardian's "Safety net" legend entry that briefly explains what it is (the extra held while the Guardian learns your bills, frees up as it does), as a lighter on-card complement to the full 3.5 tutorial.
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

---

## Deferred backlog

- **Safety-net "covered" honesty (4b after-scan)** — the release "it covered a $X surprise" uses the full `surpriseOutflowLog` sum; scope it to the hold window + cap at the held reserve (or soften to "helped cover") so it never overstates.
- **Attestation affordance for variable income (4c after-scan)** — the "I'll hold a smaller safety net" affordance shows whenever discovery is active, but a variable earner's hold is often cold-start (income), so attesting bills barely moves it; gate the affordance to where the discovery reserve is meaningfully reducible, or adjust the copy.
- **⭐ Guardian adjustment IMPACT visualization (Jason 2026-07-24, v1.1/1.2) — the 4c attestation is a good v1, but show the user HOW their plan changes when they attest / adjust — VISUALLY, not text.** A Skia-driven animated before/after: the safety net reducing (e.g. $1,000 → $500), the freed money flowing to debt, the debt-free date sliding earlier — a "see the impact" breakdown. Generalizes to any Guardian adjustment (attestation · adjust-your-line · top-up). Use the tools at our disposal (Skia/Reanimated); make it visually impressive. Pairs with the Phase-3 Guardian interactivity passes.

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
- **2.5 rescope ✅ (2026-07-24, Jason ✓)** — before-scan found category/BNPL-term/variance already captured + one-off already handled by `one-time` recurrence → one-off heuristic SCRAPPED. A deeper read then showed **BNPL-expiry is also already handled** (required minimum + balance-depletion retires it) → **BNPL-expiry SCRAPPED**. Net 2.5 = **trials (new) + variable-bill modest %-buffer reserve** (Jason picked the bounded-% approach folded into the cushion). Honest high-value cut over the pre-authored 4-field blob.

## Reference docs

- **Guardian build spec (canonical):** `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6)
- **Premium strategy:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · **future features:** `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Phase 0 design synthesis:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · **motion:** `DEBT_MOTION_SPEC_2026-07-20.md`
- **Guardian audits:** `DEBT_GUARDIAN_AUDIT_2026-07-22.md` · `DEBT_GUARDIAN_REVIEW_DECISIONS_2026-07-23.md` · `DEBT_PREMIUM_ELEVATION_AUDIT_ROUND{2..6}_2026-07-23.md`
- **Regression baseline:** `REGRESSION_BASELINE_2026-07-24.md`
- **Full build history / per-item detail:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
