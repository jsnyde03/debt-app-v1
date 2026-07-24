# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready** (supersedes the earlier "parity migration + revenue spine" framing; same ship, bigger ambition). Scope-creep isn't the constraint — comprehensiveness to reach the bar is.
>
> **This file is the lean driver.** Full per-item history, after-scans, and shipped detail live in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

---

## ▶ NOW

- **Active build:** **2.4.11.4b.0** — condense the cushion-bar legend + key the "set aside" swatch (Jason flagged the chart). 2.4.11.4a (two-sided safe move) ✅ done.
- **Phase:** 2 (Premium substance + revenue spine). The Guardian is the headline; **2.4.1–2.4.10 shipped**, 2.4.11 in progress.
- **Then:** finish 2.4.11.4 (4b.0 legend → 4b reserve release → 4c attestation/walk-back → 4d valley band) → 2.4.11.6 verify → 2.5 (obligation heuristic) → **2.6 Recovery Plan** (top differentiator) → **Guardian convergence audit** (gate) → 2.7–2.11 → Phase 3 (delight) → **Phase 3.5 (interactive tutorial + demo showcase)** → 4 / 5 / 5.5 / 6.
- **⚠️ Launch gating:** v1.7 ships as ONE release — nothing launches until Phase 6 is done + Jason is satisfied. The whole Elevation (through Phase 6) is the release.
- **Quality gate:** `validate:release:rn` (`lint:rn` + `test:regression` + `test:app` + `test:e2e:rn`) — **green across the board.** The "break-it" regression baseline (RS.1–7) is ✅ complete.

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
- **2.4.1–2.4.10 Payday Cushion Guardian ✅** — engine (`buildGuardianBrief`) · brief UI · hardening (one metric, exhaustive partition, §2.0 confidence gates) · data substrate (2.4.D) · cash-flow brain (2.4.7: state-threaded forecast · crunch detection · water-fill · surplus waterfall · paused-deploy · income learning · drill-down) · graduation (persists past debt-free + Freedom handoff) · calibration + Cash Runway chart · proactive risk notification (logic-complete; native delivery → Phase 6).
- **2.4.11.1–.3 ✅** — presentation reshape (visual stat-row, exact amounts) · tight-case one-tap (move-from-savings) · cold-start first-run intro + advice boundary.
- **RS "break-it" regression baseline ✅ (RS.1–7)** — core fuzz + app-layer + RN-web e2e, green-gated via `validate:release:rn`. Found + fixed **2 real money-path bugs**; RN app gained its **first e2e harness + first scoped lint**; legacy Next gate retired. Doc = `docs/REGRESSION_BASELINE_2026-07-24.md`.

### Remaining in 2.4 (Guardian) — ▶ the active workstream _(decomposed + shaped w/ Jason 2026-07-24)_
- **2.4.11.4 — Guardian honesty edges.** Structure-first; each sub-step before/after scan + verify as built; copy-heavy bits align w/ Jason before building.
  - [x] **2.4.11.4a ✅ Two-sided-with-a-why safe move (2026-07-24).** `buildGuardianBrief` gains `deployTradeoff`/`tradeoffTargetName`; the selector flags a genuine EF-vs-debt tradeoff (live debt + underfunded emergency fund + not `hasSavingsElsewhere`) → a two-sided move ("Apply the spare $X toward {debt} to save on interest, or build {EF} first if you'd rather strengthen your cushion — your call"); mechanical moves stay single ("Apply the spare $X {dest} when you're ready…"). **Wording: "Apply the spare $XX"** (Jason). Standing "Your call" caption suppressed when the move already carries it. Core+app+tsc+lint green, both themes verified. _After-scan → filed to backlog: when the waterfall sends the spare to STARTER EF (EF<$1k, debt live), `deployedToDebt`=0 → the brief's "keeps all of it as your cushion" branch OVERSTATES cushion (EF funding isn't cushion) — pre-existing, reverse-direction, for the convergence audit._
  - [ ] **2.4.11.4b.0 ▶ ACTIVE — Cushion-bar legend fix (Jason flagged the current chart 2026-07-24).** The legend "doesn't look right" + the light "set aside" band has no legend entry. Condense the legend to the hero card's compact style (small swatch + label + value) and give the "set aside" its own KEYED swatch so every bar color is explained. The reserve's full TEACHING is the Phase 3.5 interactive tutorial (ships with v1.7 — everything launches together), so this is visual coherence, NOT a standalone explanation. Both themes; with + without a reserve.
  - [ ] **2.4.11.4b** — **Reserve insurance release moment (copy approved 2026-07-24).** Detect the settling-in-reserve release transition (held → freed as `genuineCycleCount` crosses N=3 / lean-verified); a one-time insurance-framed acknowledgment **branched on TAPPED** ("your settling-in reserve did its job — it covered a $X surprise while I got to know your bills. It's now going to work on your {focus/savings}." vs "your settling-in reserve is free. You didn't need it — it's now going to work on your {focus/savings}.").
  - [ ] **2.4.11.4c** — **"Bills complete" attestation + walk-back.** An attestation affordance that REDUCES (not skips) the `discoveryHoldback`; the surprise-outflow log WALKS IT BACK when over-confident ("a surprise bill showed up — I've restored your settling-in reserve"). Floor protects independently.
  - [ ] **2.4.11.4d** — **Valley debt-free BAND** (Jason: build now). One projection engine run twice (lean + typical) → reconcile the 3 current producers; **typical = motivational headline · lean = safe-floor secondary** (not a symmetric range); interest-cost-of-caution rounded/qualitative, never false-precise $. Reconciliation-tested. _(Promoted from the deferred "one-engine-two-runs" backlog item.)_
- [ ] **2.4.11.6 — Verify** both themes both tiers; fold the deferred RN e2e states (missed / stale / debt-free / **at-risk** — incl. the never-yet-confirmed softened free at-risk copy, via an injected state) onto the RS.6 harness.
- _**2.4.11.5 bounded demo + free-at-risk marketing state → MOVED to Phase 3.5** (Jason 2026-07-24): it shares the sandbox with the tutorial and must showcase the FINAL polished Guardian — building it on a still-moving Guardian is double work. The free at-risk COPY is still visually verified in 2.4.11.6 (injected state)._

### The rest of the tier
- [ ] **2.5 Smart obligation quality layer** — descoped: add capture fields (category · trial/first-seen · BNPL term · amount-variance) + a lightweight on-device heuristic (finite-BNPL auto-expiry · trial-lapse · variance). Core ML deferred.
- [ ] **2.6 Close-the-loop + ⭐ THE RECOVERY PLAN** — the single biggest differentiator. The shortfall/paused/looming-crunch states must **build the user's actual catch-up plan** (Cover now · Safe-to-defer ranked · gap math · honest un-closeable branch · one-tap apply), not just diagnose. Heuristic-v1 essential-vs-deferrable + user override. Every "you're in trouble" surface routes here. + surface the Interest-Saved counterfactual.
- [ ] **⭐ [AUDIT GATE] Guardian convergence audit** — after 2.6 (Guardian complete). Adversarial multi-lens (correctness · honesty · premium-value · UX coherence · completeness · free/premium line · substrate integrity · cold-start · **WORDING/VOICE — every string reads professional and confident, zero sloppiness (Jason 2026-07-24): no awkward phrasing, filler, or amateur tone; premium copy quality throughout**), consensus = a thumbs-up it's premium & worth the price. Phase-3 delight is explicitly NOT a gap here. Output: must-fix-before-ship vs Phase-3 vs future, triaged.
- [ ] **2.7 Scan-to-prefill** — Apple Vision OCR → prefill → confirm; free initial scan / premium keeps-current. Native, fast-follow (not launch-critical).
- [ ] **2.8 Momentum** — Interest-Saved ledger as the spine (the always-true, un-chattable number); streaks demoted; debts-vanquished archive (hooks the confirmed-$0 signal).
- [ ] **2.9 Widget + App Intents + Live Activity** — payoff-countdown Live Activity + interactive-widget App Intents (mark-paid / log-paycheck). One native build (with Phase-6 device work).
- [ ] **2.10 Revenue spine** — RevenueCat + paywall (port Gig) + Lifetime 2nd offer + portfolio-sub seam + analytics + Sentry. **[DECISION before any StoreKit SKU]:** guarantee window/terms (default to honest "not charged until day 30" if StoreKit can't honor a refund) · Lifetime scope · pin annual + Lifetime prices. "Watches every paycheck" copy gated on 2.4.10. Launch-flip gated on value shipped.
- [ ] **2.11 E2EE iCloud backup + AU/NZ** — verify the ADP-status API exists or fall back to "encrypted iCloud backup" wording (backup ≠ sync; multi-device sync deferred).

### Future premium features (post-Guardian; scope into v1.7 vs v1.7.x/v1.8 with Jason)
- **① Can-I-Afford-This? (the inverse Guardian)** — re-solve the cycle for a one-off expense; survives debt=$0. *Top net-new pick.*
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
- **What-If full-impact explorer** — propagate the extra through the whole model, month by month (substantial; likely its own slice / v1.8).
- **History per-cycle detail drilldown** (v1.8 candidate).
- **Entrance-motion revisit** — decide the `<Motion>` FadeInDown language once, apply consistently (or drop on calm surfaces).
- **Genuinely-native iPad** — per-screen re-layout (multi-column / master-detail), not a centered phone column.

## Phase 3.5 — Guardian interactive tutorial + demo showcase _(Jason 2026-07-24 — AFTER the Guardian is polished + final, never before)_

Both the interactive tutorial and the marketing/demo showcase live here: they share the same **sandboxed, scriptable Guardian substrate** and must run on the FINAL polished Guardian, so building either on a still-moving Guardian (2.4.11.x · Recovery · convergence audit · Phase-3 interactivity) is double work.

**(A) Interactive tutorial —** a **fully interactive, hands-on walkthrough** on a **sandboxed example** (never touches the real plan): the user *drives* it and watches it respond, so the concepts land by doing.
- **Steps (interactive):** meet it ("will you make it this paycheck?") → read the bar (tap each zone to reveal) → **your line (drag the floor slider, watch the Guardian re-plan live)** → **the settling-in reserve (tap "a surprise lands" → watch it absorb it; tap "once I've learned you" → watch it release)** → the safe move + "your call" → done.
- **Reach:** fires on first premium Guardian view (**absorbs/upgrades the 2.4.11.3 intro** into the real tour); **replayable** from a "?" on the card + a "How the Guardian works" row in More.
- **Rough decomposition:** stepped-flow scaffold + replay entry points → shared sandbox substrate (isolated, scriptable states) → interactive bar (tap-to-reveal) → interactive "your line" slider (live re-plan) → interactive reserve lifecycle (surprise→absorb→release) → safe-move/your-call + wrap → copy + both-theme + a11y verify.

**(B) Bounded demo showcase (moved here from 2.4.11.5) —** a **distinct cold-start-bounded premium showcase** on the shared sandbox (§3.6, launch-critical for GTM/ASO): day-one value only (floor auto-protect + tight one-tap + a visible water-fill smoothing of a lumpy bill), scorecard shown as "here's what I'll show once I learn your income," reserves HELD (not deployed) — NOT a matured Guardian the month-one buyer can't be. Isolated (never feeds real calibration / `genuineCycleCount`). Plus a free at-risk showcase state. The interactive demo is essentially a scripted run of the tutorial.

## Phase 4 — Quality

- **✅ Largely delivered by the RS baseline** — tsx app-layer harness + core engine fuzz + first RN-web e2e harness, green-gated via `validate:release:rn`. Continuous-quality (both-theme visual verification, whole-app gap analysis) is ongoing.
- **Residual coverage backlog (low-risk):** extend `testEngineFuzz` → `holdbackComposition` · RN e2e for missed/stale/debt-free states + a mobile viewport · app-layer CRUD-action coverage (addGoal/markExpensePaid/etc.).
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

## Reference docs

- **Guardian build spec (canonical):** `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6)
- **Premium strategy:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · **future features:** `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Phase 0 design synthesis:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · **motion:** `DEBT_MOTION_SPEC_2026-07-20.md`
- **Guardian audits:** `DEBT_GUARDIAN_AUDIT_2026-07-22.md` · `DEBT_GUARDIAN_REVIEW_DECISIONS_2026-07-23.md` · `DEBT_PREMIUM_ELEVATION_AUDIT_ROUND{2..6}_2026-07-23.md`
- **Regression baseline:** `REGRESSION_BASELINE_2026-07-24.md`
- **Full build history / per-item detail:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
