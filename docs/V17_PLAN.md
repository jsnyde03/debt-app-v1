# Debt Planner v1.7 — "The Robust Build"

> **Status:** PLANNED (scope locked 2026-07-08). Build opens after v1.6 is approved + live (never before — v1.6 is at the TestFlight/device gate). This doc is the **canonical v1.7 source** and supersedes `V16_PLAN.md` §B/§C/§D for v1.7 scope.
>
> **Identity:** the deliberate backlog-paydown version after v1.5/v1.6 shipped as fast strikes (per [[project_debt_app_roadmap_philosophy]] — "v1.7 = THE ROBUST BUILD… pay the backlog DOWN comprehensively or it spirals"). It does **two** new-value things — turn on upper-tier revenue (Premium+) and ship its differentiation carrot (Drift Tracker) — on top of a hardened base.

## Locked decisions (Jason, 2026-07-08)
1. **Spine = Premium+ purchasing + Drift Tracker as its carrot.** A premium_plus feature AND the ability to buy it, shipped together. Free tier is done; premium is the flywheel ([[project_free_tier_finishes_premium_flywheel]]), and Premium+ currently **cannot be purchased at all**.
2. **Territories = AU/NZ readiness IN v1.7.** Lift US-only for the cheapest first non-US market — widens the impression/download surface now (ties to the marketing-impressions problem).
3. **Ceiling = MAXIMAL.** Absorb the full verified backlog incl. the polish clusters and the holistic IA/nav re-audit. Sequenced so polish carries clean cut-seams as a release valve if reality forces a trim (Jason chose maximal; this is a safety net, not a pre-cut).

## Release valve (how "maximal" still ships)
Phases are ordered risk-first / polish-last. **Phases 1–4 are the spine** (must ship). **Phases 5–6 are planned-last and cleanly cuttable to v1.8** if the version overruns. The IA/nav audit (0.2) is a decision gate — a "rework" verdict spawns its own version rather than bloating v1.7.

---

## Phase 0 — Switch-in audits that SHAPE scope (do FIRST)
_Per the plan-audit cadence: structural audit at the version boundary. These gate everything downstream._
- **0.1 Per-app structural audit** (1000-ft: approach/roadmap/keep-vs-pivot) + refresh this plan's premises against the code at build-open (they'll have drifted again by then — treat as hypothesis, verify on sight, per [[feedback_verify_preauthored_audit_accuracy]]).
- **0.2 Holistic IA / nav audit** (time-boxed → a **keep / evolve / rework** verdict). Benchmarks: Copilot/Monarch. ⚠️ Re-opens the v1.6 "KEEP bottom-tab + iPad-sidebar" decision at fintech-polish altitude. **Output gates Phase 6's polish scope**; a "rework" verdict → its own version (v1.8+), not v1.7.
- **0.3 Drift Tracker data-model design spike.** The feature needs a "days behind" headline, but there's **no stored projected balance and no skipped-recommendation record** — only per-cycle captured actuals. Design the projected-vs-actual reconstruction (and whether v1.7 must start *recording* projected balance now so the tracker has real data). Output = the Phase 2 build spec + its reconciliation-test shape.

## Phase 1 — Foundational robustness (de-risk before features)
_This is the "robust" core. Do before Phase 2 because Drift Tracker adds new money math and touches the 1502-line `page.tsx`._
- **1.1 Money-util dedup** — collapse `roundMoney` (~13 local decls) onto `lib/utils/money.ts`; **wire the dead `clampMoney`** into the forecast/insights formatters that lack NaN guards. Mechanical, ~13 edits.
- **1.2 Type unification** — `Debt` (×2) and `Goal` (×3) decls onto the canonical storage exports; relocate canonical types `lib/storage/` → neutral `lib/types/`. Engine-math-adjacent → **reconciliation-test-gated**, ~31 import sites.
- **1.3 Orchestrator Phases 3–5** — extract the remaining glue/coupling out of `page.tsx` (backup hook · plan-exec hook · rollover glue). Phase-4 goal math + Phase-5 rollover math already extracted (v1.6); remaining is **low-math-risk glue**, still reconciliation-test-gated. Target: shrink `page.tsx` back toward ~700–900.
- **1.4 Small refactor hygiene** — `livingExpenses` preset-default dup · viewport media-query triplication (`matchesMinWidth` helper) · dead `currentDate` prop on PaycheckSection · dead-dep purge (`expo`, `react-native`, `@babel/core`, `@types/gensync` — verify vs package.json).
- **1.5 Performance audit** (Jason "sooner than later") — profile `handleRolloverPayCycle`'s synchronous chain; **confirmed hotspots:** `buildPayoffTrajectory` loops to 600 months, `computeInterestSaved` runs `projectDebtPayoff` **twice**, all feeding the `result`/projection useMemo cascade off rollover (hero derives from it → the 1–2s lag). Optimize deliberately (derive-once/memoize, cheaper projection, defer non-critical, or a worker) — NOT an ad-hoc patch.
- **1.6 Test / build / CI hardening** — add **`tsc` typecheck to the CI gate** (the one `validate:release` gap) · **4-device-project fan-out audit** (run logic-only specs on one project) · onboarding iPad-landscape flake · Windows Playwright worker-teardown hang · multiple-lockfiles warning · shared-seed-helper migration (empty-state + 3 CI-ignored screenshot specs, re-baseline) · reconcile `tests/visual/` vs the screenshot specs · DRY positional selectors · Due-Date `<label>`→input a11y · Playwright workers/sharding tune · ~~iOS-Simulator visual smoke test~~ **✅ PULLED FORWARD TO v1.6 (Jason 2026-07-08)** — built on GitHub Actions macOS (FREE for public repo, runs pre-Codemagic — better than the originally-planned Codemagic Mac runner): `NEXT_PUBLIC_SIM_SMOKE` debug seed + `.maestro/reconcile-smoke.yaml` + `.github/workflows/ios-sim-smoke.yml`; true-WKWebView screenshots of the reconcile view, both themes. Doc → `docs/IOS_SIM_SMOKE.md`. _(v1.7 follow-ons, priority order — only after it's green once: ① **cache DerivedData + SPM + node_modules** [the big speed win — recompiles all plugins from scratch today, ~10min; why Codemagic is <3min] · ② **golden-image visual regression** [committed baseline + pixel-diff → auto-FAIL on layout regression, turning it from eyeball-review into a real gate] · ③ **auto-post screenshots to the commit/PR** [inline review, no artifact download] · ④ broaden coverage: more screens (Plan hero, amortization, onboarding) + more device sizes (narrow iPhone SE + Pro Max + iPad) · ⑤ robustness: pin Xcode explicitly + retry sim boot · ⑥ enable the push trigger once stable + re-enable web-e2e auto-trigger.)_ · **migrate the baselined at-risk flex-`<button>` row-controls to the inner-wrapper pattern** (guard added v1.6 `scripts/check-webkit-flex-controls.ts` baselines 19; the `.saved-item`-style rows that CAN wrap [Goals/Expenses/RequiredActionItem] are latent-risk like the reconcile row was — migrate + drop from baseline).
- **1.7 Data-safety** — scheduled automatic backups (foreground trigger; `backup.ts` has manual export/import only) · author any pending schema migrations (mechanism already shipped v1.5).

## Phase 2 — Premium+ carrot features (build the reason to pay)
- **2.1 Drift Tracker** (premium_plus; L) — per the 0.3 spec. New drift math → its **own reconciliation test** (every money-computing feature does, per the v1.6 discipline). The lead differentiation feature.
- **2.2 Full amortization calendar** (premium_plus; M) — all debts, deferred from v1.5. Today's amortization is the v1.5 "focus-debt lite" view.
- **2.3 Interest-Saved momentum history chart** (premium_plus) — the truest "Momentum Ledger" upgrade draw (deferred from v1.6 1.8.3).

## Phase 3 — Monetization: turn on the till
- **3.1 RevenueCat Premium+ wiring** — add the premium_plus product/entitlement (RevenueCat wires only one `PREMIUM_ENTITLEMENT_ID` today); `hasFeatureAccess` premium_plus gating **already exists**, so this is store wiring + `purchasePremiumPlus()`.
- **3.2 Flip `PREMIUM_PLUS_AVAILABLE=true`** + surface the upsell (the History "last 6 cycles → upgrade" row is already gated behind the flag; add paywall entry for Drift Tracker / full calendar / momentum chart).
- **3.3 [DECISION] 4th "ultimate" tier?** — FUTURE_VERSIONS assumes a 4-value tier type; code has 3 (`free|premium|premium_plus`). Decide keep-3 vs add-ultimate BEFORE creating permanent ASC products ([[feedback_lock_strategy_before_irreversible_setup]]).
- **3.4 Product analytics + crash reporting** — PostHog (zero instrumentation today) + Sentry. Placed here so there's a **purchase funnel to measure** (capture-before-analytics). Gives the conversion data the go-to-market gate wants.

## Phase 4 — Non-US / AU-NZ readiness
- **4.1 Date correctness** — `toISOString().slice(0,10)` in **7 files** (`getNextPaycheckDate`, `rolloverPayCycle`, `usePaydayCapture`, `scheduleNotifications`, `backup`, `seedPlannerState`, `FirstDebtOrBillStep`) drops a day in positive-UTC markets (this is the old **Q1**). Fix as a bundle, not piecemeal.
- **4.2 Currency localization** — `formatCurrency.ts` hardcodes `en-US`/`USD`.
- **4.3 Territory enablement + positive-offset QA** — enable AU/NZ in ASC; QA the date/currency seam on a positive-UTC device.

## Phase 5 — Bug-deferral batch (cuttable seam)
- **5.1 v1.5 deferrals** — **Q2** Reset-to-Today stale due dates · **Q4** Timeline per-cycle payment accuracy (balances never shrink across preview cycles) · **Q5** overpaid-snowball excess cascade (+boundary test) · **M2** trajectory neg-amort guard disagreement · **M3** `totalInterestPaid:0` sentinel suppresses avalanche insight · **M7** fragile `BYPASS_REVENUECAT===''` predicate.
- **5.2 v1.6 pre-submit LOWs** — `formatMonths` "3 years" rounding · "$0.00" interest headline · payday Close/Not-now confusion · "Total you paid" overstate on Adjust>room · mid-cycle rename double-count · `minimumPaidThisCycle` `||` vs `??` · debt-free strip "Add debts".

## Phase 6 — Polish clusters (last; scope per the 0.2 verdict; cuttable seam)
- **6.1 Layout premium polish** (V15_LAYOUT_AUDIT §Enhancements) — Plan-hero progress ring · Bills category-count pills · Debts all-debts payoff bar · Payoff-chart axis+tooltip · amortization stat-value alignment · Pay-Cycle-History lifetime-summary header · Bills iPad two-column.
- **6.2 Journey enhancements** — milestone-linked progress-bar pulse · share-the-celebration · best-streak record + 5/10/25-cycle milestones · amortization milestone markers + CSV/PDF export · bills overdue urgency · lifetime "total paid" stat.
- **6.3 Payday/keystone follow-ons** — plan-bearing payday notification · payday-sheet cosmetics · **reconcile-row label verbosity** (shows full "Pay minimum on Klarna - Apple Watch" → wraps to 3 lines on-device; strip to the bare name / "{name} minimum" like the Plan tab does, per the iOS sim-smoke screenshots 2026-07-08) · over-funded-goal UX decision · Milestones "trophies" view · Pay-Cycle-History drill-down · named goal templates · manual/deferred rollover date · iPad genuinely-native polish.

## Phase 7 — Release gate
- **7.1 Pre-submit functional-correctness audit** (whole-surface, adversarial; [[feedback_presubmit_functional_audit]]) — bugs live at the new/old seam, and v1.7 touches a LOT.
- **7.2 `validate:release` green** + both-theme visual + reconciliation tests green.
- **7.3 TestFlight device-QA checklist** (native-first; [[feedback_pre_submit_testflight_qa]]) — new surfaces: Premium+ purchase flow, Drift Tracker, AU/NZ date/currency.
- **7.4 ASO refresh** — Premium+ positioning + AU/NZ metadata; step-by-step how-to per [[feedback_executable_howto_for_unfamiliar_tools]].
- **7.5 Submit** → on approval, merge to `release/v1`.

---

## Appendix — verified inventory (2026-07-08 sweep)
Every item below was checked against current code; verdicts cite evidence.

### Already DONE in v1.6 — struck from v1.7 (do NOT re-file)
- `CompletedRecommendedAction` type consolidation (1.3, `19c8b8d` — one decl remains).
- ResultsSection plan-dedup (1.6.3).
- **M4** cycleMultiplier (1.7 — `page.tsx` now uses `payCyclesPerMonth`).
- **Q9** per-debt progress clamp (already `Math.min/max` in `DebtRow.tsx`).
- No-op `toBeVisible;` fix + `planner-hardening` rename (1.1).
- CI lint+regression gate (1.1) — `validate:release` effectively covered **except `tsc`** (→ 1.6).

### Drift corrections baked into the plan above
- `page.tsx` = **1502 lines** (docs said 1245; §E grew it ~257) → orchestrator target moved further (1.3).
- 3-tier subscription type + `hasFeatureAccess` premium_plus gating **already exist** → monetization work is store-wiring only (3.1), not "build tiers."
- Schema-versioning **already shipped v1.5** (`migrateState.ts`) → only future migrations remain (1.7).
- roundMoney now **~13** local decls (was 12) → 1.1.

### Standing governance
- Sustainability refactor stays a **bounded slice, reconciliation-test-gated** even here — the maximal ceiling means "absorb the whole backlog," NOT "rewrite the engine" (the pure-TS engine stays protected; engine-adjacent change ships its reconciliation test same commit). See [[project_debt_sustainability_refactor_2026-07-02]].
