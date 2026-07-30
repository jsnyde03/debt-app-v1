# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready**. Scope-creep isn't the constraint — comprehensiveness to reach the bar is.
>
> **This file is the LEAN driver** (live queue + forward phases + backlog + decisions). Full per-item history, after-scans, and shipped detail → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

---

## ▶ NOW

- **Active build:** **Phase 3.5 — interactive tutorial + bounded demo** (spec-hardened by the coverage + best-in-class audits; the 3.5.0–3.5.7 build order is below). **Phases 0–3 ✅ COMPLETE** — through the Phase-3 closeout + a 3-round Fable-5 re-audit at CONSENSUS (2026-07-30).
- **▶ Next action:** build **3.5.0 `createSandboxStore`** — the substrate blocker-fix everything else stands on.
- **⏸ Parallel (Jason):** cut a fresh `v1.7-dev` build (⚠️ current device build `c050173`/3.6.1 is STALE — predates the whole closeout + fold) → the consolidated **Phase-6 device pass** (the accumulated device-QA ledger, under Phase 6).
- **⚠️ Launch gating:** v1.7 ships as ONE release — nothing launches until Phase 6 is done + Jason is satisfied. The whole Elevation (through Phase 6) is the release.
- **Quality gate:** `validate:release:rn` (`lint:rn` + `test:regression` + `test:app` + `test:scenarios` + `test:e2e:rn`) — green across the board.
- **Env:** shell cwd drifts to GigWorkTracker → use `git -C /c/Users/Jason/debt-app-v1 …`; `npm --prefix apps/rn run export:web` + `serve apps/rn/dist -l 4319 -s`; e2e `npm run test:e2e:rn`.

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
4. **Product guardrail:** ⛔ never build refi / insurance / rate-drop lead-gen (violates "never sell you more debt"). Post-v1.7 roadmap: Premium **Connected** tier (Plaid, ~v1.8, never gates on-device) · **Ava** AI tier (future).

---

## Phases — status

| Phase | Scope | Status |
|---|---|---|
| 0 | Design Foundation | ✅ COMPLETE (signed off) |
| 1 | Elevate the surface | ✅ COMPLETE (all surfaces, both themes) |
| 2 | Premium substance + revenue spine | ✅ COMPLETE (2026-07-27; convergence + framework audits at consensus) |
| 3 | Delight + native platform | ✅ COMPLETE (2026-07-30; closeout fold + 3-round re-audit at CONSENSUS) |
| **3.5** | **Interactive tutorial + bounded demo** | **▶ ACTIVE — spec-hardened; building** |
| 4 | Quality (test harness) | largely delivered by the RS baseline; continuous |
| 5 | Data continuity + cutover | 🔒 ship-blocker, upcoming |
| 5.5 | Repo consolidation | before the release gate |
| 6 | Launch-ready | final |

**Completed-phase detail → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md); canonical specs in the referenced docs.**

- **Phase 0 ✅** — IA (3-tab Today · Progress · Money + "•••" More) · visual language (cool slate/navy, constant navy hero panels) · motion spec · premium reshape (one Premium + Lifetime + portfolio-sub seam) · readiness audit · a11y standard. → `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md`.
- **Phase 1 ✅** — every surface elevated: Today · Progress (Skia ring + trajectory) · Money (Debts/Bills/Goals, virtualized) · More (TrustCard).
- **Phase 2 ✅** — the **Payday Cushion Guardian** (engine · §2.0 confidence-governance · cash-flow brain · graduation · calibration scorecard + Cash Runway · proactive notification · **Safety-net** reserve lifecycle) + smart obligations/trials + **Recovery Plan** (top differentiator) + **Can-I-Afford-This** (inverse Guardian) + **BNPL first-class** + **scan-to-prefill** (Apple Vision) + the **revenue spine** (Monthly $4.99 / Annual $29.99 / Lifetime $79.99 paywall, RevenueCat, reviewer-findable). Locked via the Guardian convergence audit + the Premium-framework audit (both consensus). Canonical: `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FRAMEWORK_AUDIT_2026-07-27.md`.
- **Phase 3 ✅** — **Wave A** (foundation polish & perf) · **Wave B** (delight/emotional peak: debt-paid-off celebration · milestone-cross · Guardian proof-of-work · affordability impact-viz · tactility · onboarding reframe) · **Wave C** (trajectory + chart interactivity · `expo-blur` glass · swipe-to-delete · FormSheet polish) · the **native-platform block** (Live Activity + Dynamic Island payday countdown · widget family + StandBy · App Intents/Siri queries + voice log-a-payment · iOS long-press context-menu) · **genuinely-native iPad** (Money master-detail · Today two-column · Progress wide-canvas · pointer/keyboard ⌘-shortcuts) · the variable-income debt-free **band** · Guardian **Tier-3** · **VIS-1** finale deepen + Core-Haptics AHAP · **VIS-2/B2** branded share (finale/beat/archive) · **VIS-6** Windfall Autopilot + interactive notifications + Skia mesh + opt-in sound + Sentry scaffold. Opened with the **3.0 Best-in-Class Enhancement audit**; closed with the **Phase-3 closeout audit → 3-round Fable-5 re-audit at CONSENSUS** (→ `DEBT_PHASE3_{ENHANCEMENT_AUDIT_2026-07-27, CLOSEOUT_AUDIT_2026-07-29}.md` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/`). ⚠️ **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT (3.2.x ships broken) + `react-native-ios-utilities ^5.2.0`. All native/device-owed verification is **parked → the Phase-6 device-QA ledger** (below).

---

## Phase 3.5 — Interactive tutorial + bounded demo ▶ ACTIVE

The interactive tutorial + the bounded marketing/demo showcase (+ folded-in feature-discovery coach-marks), sharing ONE **ephemeral sandboxed, scriptable Guardian substrate**; runs on the final Guardian.

**🔑 SPEC-HARDENED by a coverage audit + a best-in-class audit (2026-07-30) → `docs/DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/`** (`_SUMMARY` = the canonical hardened build order; `05-best-in-class-enhancements` = the elevation set). Coverage found ~3 **blockers** (sandbox isolation must be an ephemeral 2nd store, NOT `isDemoMode`/the legacy matured-Guardian `demoSeed`; no pre-purchase demo entry + an unspecced trigger/intro matrix) + Recovery/state/interactive-a11y gaps. Best-in-class = **NEAR** → 11 fold-now enhancements (led by **E1 the hand-back finale**). Both folded into the build order.

**━━━ BUILD ORDER (gaps + enhancements folded; substrate first) ━━━**
- **3.5.0 — `createSandboxStore(scenario)` [blocker-fix]:** ephemeral 2nd store · frozen date · `inputsAsOf` pinned · `genuineCycleCount≤1` · scripted pure `applyRollover` beats (absorb/release) · never persisted/widget/notif/LA-synced · floor slider mirrors snap-$25/cap-$1000 · **personal-scaled to the user's just-entered numbers** · `isDemoMode` explicitly NOT this mechanism.
- **3.5.1 — trigger/intro matrix + reachability [blocker-fix]:** new `tutorialSeen` flag (not `guardianIntroSeen`) · the new-free/new-premium/upgrader/intro-seen matrix · register the auto-fire in the VIS-4 single-ack-slot · replay entries ("?" on the card + a "How the Guardian works" More row) + a **free-tier run** (value-led taste).
- **3.5.2 — interactive-a11y + path scaffold [major-fix]:** skip / interrupt-resume / seen-persistence · every step VoiceOver-**operable** (adjustable slider + `announce()` on motion-only change) + reduce-motion + Dynamic-Type · **exit-gate: a VO user AND the web e2e complete every step end-to-end.**
- **3.5.3 — the tutorial arc (≤7 beats):** **predict-then-reveal open (E3)** → read the bar → **your line (drag the floor → live re-plan crossing clear→tight, haptic detents at each state boundary [E4])** → the reserve (surprise → tight→absorbed→clear via scripted rollover; spatial money-travel, calm register) → **a Recovery glimpse** (one scripted at-risk→safe-to-defer card) → safe move + "your call" → **wrap** (scorecard "once I learn you" + the **kept-promise flag [E7]** + the on-device/honest-moat line) → **E1 HAND-BACK FINALE: crossfade the sandbox into the user's REAL Guardian card (their real first read; free lands on the real free card + invite = the app's best paywall).** Both-theme + a11y verified.
- **3.5.4 — bounded demo (B) + GTM funnel [blocker/major-fix]:** scripted day-one-bounded run (floor auto-protect · tight one-tap · water-fill · scorecard-as-future · reserves HELD) + the **free at-risk→Recovery contrast** · **pre-purchase entry** (Welcome slot + paywall "See it in action" + free-Guardian teaser; ~5s hook; exits "Start my real plan"/"Unlock Premium") · **reconcile/replace the legacy `demoSeed` [D-B]** · doubles as the deterministic App-Preview/screenshot capture path + a **closing receipt frame** (the store money-shot) · locale-neutral copy.
- **3.5.5 — feature-discovery coach-marks (C):** calm · one-at-a-time · dismissible · replayable · iOS-16-safe · rendered OUTSIDE gesture handlers · platform-gated · over the ENUMERATED hidden-gesture inventory (long-press menu · Cash-Runway scrub · Can-I-Afford · income-varies toggle · swipe-to-delete · chart scrub · Log-payment · widget/Lock-Screen/Siri).
- **3.5.6 — verify + close:** both-theme + a11y (VO end-to-end) + e2e · whole-3.5 after-scan → the whole-app cohesion audit.
- **3.5.7 — web-embeddable marketing-site demo (pulled IN — no backlog):** an embeddable interactive demo for the marketing site (embed harness + hosting + the privacy call), off the same sandbox substrate + scriptable run. Its own sub-step given the hosting/harness LOE + the App-Preview capture path (3.5.4) it shares.

**🔷 [DECISION]s — ✅ ALL RESOLVED = DO (Jason executive decision 2026-07-30: "everything found in the audits + enhancements will be done, no backlog", [[feedback_fix_everything_one_block]]):** **D-A** wire the privacy-first opt-out ~8-event funnel instrumentation seam (no financial data) · **D-B** replace the legacy `demoSeed` (one honest demo system) · **D-C** free-tier tutorial + demo access · **+ all 13 best-in-class enhancements** + **every coverage gap** — nothing filed to backlog.
**Restraint (best-in-class audit) — STILL HOLDS with everything IN:** no Tier-3 spectacle/confetti/sound · no gamification chrome · no fake-chat theater · Recovery stays a glimpse · the in-app tutorial ≤7 beats. ("Everything done" = build all the found work, folded into existing beats by design — NOT add fireworks to a teaching surface.)

## Whole-app cohesion audit _(AUDIT GATE — after Phase 3.5)_

- [ ] The same adversarial rigor for the ENTIRE APP up to this point (Phases 0–3.5), with a **PURE-EVALUATION / COHESION** criterion: does every element work TOGETHER, never in isolation — cross-surface consistency (voice · visual · motion · numbers) app-wide? Placed AFTER 3.5 so the tutorial + demo are in scope. Triaged must-fix vs later.
- [ ] **⭐ [ADDED CRITERION] Whole-app BEST-IN-CLASS enhancement pass (Jason 2026-07-30).** Beyond cohesion + correctness — an **aspirational, app-wide** sweep (the 3.0 / 3.5-best-in-class method applied to the WHOLE assembled app, incl. the tutorial + demo): is each surface genuinely **top-of-class**, and what would elevate it from *complete* to *unforgettable / uncopyable*? Benchmark vs category leaders; hold the premium/honesty/a11y bar (restraint, not fireworks). _(Per the 2026-07-30 executive "no backlog" decision, expect its (A) findings to be built, not filed.)_
- [ ] **⭐ [AUDIT GATE] Whole-app wording/voice audit (paired with cohesion).** Every user-facing string (both tiers · all states · errors · notifications · empty states · paywall · onboarding) against the house voice (Guardian sole first-person "I"; everything else direct "you"). Absorbs the deferred copy items (paywall benefit-copy density · the `$X.00` cents-formatter sweep · empty-state polish · residual jargon).

_All three audits fan out on Fable 5 ([[feedback_use_fable5_for_audits]])._

## Phase 4 — Quality

- **✅ Largely delivered by the RS baseline** — tsx app-layer harness + core engine fuzz + first RN-web e2e harness, green-gated via `validate:release:rn`. Continuous-quality (both-theme visual verification, whole-app gap analysis) is ongoing.
- **Residual coverage backlog (low-risk):** extend `testEngineFuzz` → `holdbackComposition` · RN e2e for missed/stale/debt-free states + a mobile viewport · app-layer CRUD-action coverage.
- **e2e harness race (2.5 surfaced):** `test:e2e:rn`'s `webServer` re-exports + spawns its own `serve` on :4319, racing a hand-started serve under parallel workers → flaky. Harden: `reuseExistingServer` should skip the re-export when :4319 is up (or serialize/retry). Env, not product code. **⚠️ corollary: `reuseExistingServer` reusing a STALE serve serves an OUTDATED `dist`** — when adding a NEW route/screen, force a fresh `export:web` before the e2e.
- **Known web-e2e limits:** Playwright-on-RN-web can't reliably drive gesture components, `SectionList` row taps, or stacked modals → prefer localStorage-seed + deep-link + component-level; push gesture/tap flows to Maestro/device.

## Phase 5 — Data continuity + cutover 🔒 ship-blocker

The migration bridge (WKWebView `localStorage` → RN storage), **proven on a real populated upgraded device**, then cutover to the RN app as the shipping app.
- **⭐ [AUDIT GATE] Adversarial migration/upgrade audit — the Phase-5 EXIT gate, no cutover until green.** Adversarially try to BREAK the migration across every prior data shape — v1–v6 schemas · partial/corrupt/empty/huge portfolios · malformed dates & numbers · mid-migration interruption — because upgrade data-loss is catastrophic AND irreversible. Fan-out on Fable 5.
- **⭐ E2EE iCloud backup (from 2.12)** — native iCloud / document-picker / share-sheet backup-restore over the same store serialization the text export/import (`BackupSheets.tsx`) already uses. Data-continuity plumbing (not premium substance; NOT premium-gated — "never lose your data" is a baseline). Built + device-proven alongside the migration bridge. **✅ PROVEN TEMPLATE — Freedom v1 shipped it:** mirror `FinancialFreedom/docs/ICLOUD_BACKUP_SETUP.md` + `cloudBackup.ts`/`use-cloud-backup.ts`/`storage/cloudBackup/`/`backup-file.ts` ([[reference_freedom_native_widget_template]]). Multi-device sync stays deferred (Connected tier).

## Phase 5.5 — Repo consolidation (before the release gate)

Remove the dead Capacitor/Next tree once cutover proves the RN app ships.
- **5.5.1** remove the root Capacitor/Next surface (God-files · `ios/` Capacitor bits · `next.config` · WebView glue). *(Also retires the parked `validate:release:legacy` gate + the root Next.js lint.)*
- **5.5.2 [DECISION]** final repo structure — promote `apps/rn` to root vs. keep the monorepo (rec: keep the monorepo; `packages/core` is shared portfolio-wide).
- **5.5.3** update tooling / CI / docs to the consolidated tree; tsc + tests + build green.
- **5.5.4 ✅ DONE EARLY** — `apps/rn` has its own `eslint-config-expo` (RS.7).
- Verify scope against the CURRENT tree at switch-in (pre-authored cleanup drifts).

## Phase 6 — Launch-ready

Acquisition-grade store presence (screenshots · app-preview video · listing selling the active/emotional features + the trust moat) · cold-start/first-run excellence · thorough device-QA gate · submit.
- **⭐ [AUDIT GATE] Pre-Release Best-in-Class FINISH sweep (Jason 2026-07-29) — runs FIRST in Phase 6 on the FROZEN whole app, right before the release gate.** Whole-app, every screen · sheet · card · state · both themes · iPhone sizes/iPad/Split-View · Dynamic Type. **Lenses:** truncation/overflow · wording/copy quality · visual premium bar · both-theme parity · state completeness · cross-surface consistency · layout/responsive integrity · interaction/tap-target polish · code-level a11y · motion coherence · honesty/premium-framing. Flagship adversarial, verified vs real both-theme screenshots + code, fan-out on Fable 5. **Complements (not replaces) the after-3.5 cohesion + wording audits** — this is the final holistic sweep on the truly-frozen build. _(Reusable as a portfolio-standard gate.)_
- **⭐ Sentry crash reporting — ✅ SCAFFOLD DONE (VIS-6d); Phase 6 = FLIP IT ON.** `@sentry/react-native` 8.18.0 + `utils/sentry.ts` (init no-op until DSN · PII-scrub · New-Arch disables) + `reportError` seam + root wrap + app.json plugin all wired. **Remaining:** set `EXPO_PUBLIC_SENTRY_DSN` + CI source-map care (`SENTRY_DISABLE_AUTO_UPLOAD` already in `codemagic.yaml` + scoped `xcode-project use-profiles --project` per [[project_codemagic_xcodeproj_glob_gotcha]]) + verify capture on a real build + a `beforeBreadcrumb` PII scrub.
- **⭐ AU/NZ availability + E2EE trust-claim verification** — enable AU/NZ store availability; verify the Apple ADP-status API exists (or fall back to honest "encrypted iCloud backup" wording) so the store/paywall E2EE claim is provably true. Pairs with the Phase-5 backup build.
- **⭐ [AUDIT GATE] Privacy / data-flow audit — before submit; defends the moat + the marketing claim.** Trace EVERY possible data egress and prove "financial data never leaves your device / 100% private" is literally true: network calls · RevenueCat SDK · Sentry (PII-scrubbed) · iCloud/E2EE backup · scan-vision OCR (on-device) · logs. Fan-out on Fable 5.
- **⭐ [AUDIT GATE] Pre-submit functional-correctness audit ([[feedback_presubmit_functional_audit]]) + FINANCIAL-CORRECTNESS money lens.** Whole-surface real-user-lens adversarial pass with an explicit money lens: boundary/edge inputs across the whole engine — zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios. Fan-out on Fable 5.
- **⭐ App Review paywall-findability** (v1.1 was rejected repeatedly): the ASC review notes MUST point the tester to the paywall — "Tap ••• More → **Unlock Premium**." Verify the always-visible More entry shows for a fresh free account; restore-purchases reachable.
- **Owed off-device (Jason, pre-submission):** ASC privacy label must declare RevenueCat · marketing "100% private" alignment · the launch-FLIP (Jason's value gate).

**📋 Device-QA ledger (verify on real hardware at the gate — web can't cover these):**
- **⭐ [SUB-AUDIT] Premium-accessibility device audit:** VoiceOver rotor + a full walk (incl. the celebration + the Guardian) · Dynamic Type AX3/AX5 graceful reflow · reduce-motion grace · contrast both themes · focus order · touch targets. WCAG 2.2 AA is the FLOOR; premium a11y is the bar.
- **⭐ [SUB-AUDIT] Performance-feel device audit:** 120fps ProMotion · Skia canvas redraw cost (What-If scrub · celebration particles) · cold-start TTI · list jank · optimistic-UI feel. (Includes the Today/cushion-forecast selector-memoization check.)
- Native Skia render + draw-on motion on all surfaces (Progress ring · trajectory · Bills allocation bar · Cash Runway) + CanvasKit-native · `boxShadow`+`overflow:hidden` native clip · `<Motion>`/`<CountUp>` native runtime · Guardian `gpp-*` MaterialIcons render.
- **§3.1.2 SF Symbols (AppIcon.ios):** verify every `appIconSF` symbol renders on the min-iOS target — some are iOS-16+ (`party.popper.fill` · `banknote.fill` · `bandage.fill` · `rosette`); swap or add a fallback for any that blank.
- **§2.8 native scan (Apple Vision):** the `scan-vision` module autolinks + compiles · `VNDocumentCameraViewController` presents + returns · `VNRecognizeTextRequest` OCR quality on real statements (tune `parseStatementText`) · camera permission + `NSCameraUsageDescription`.
- **§2.11 RevenueCat:** real Monthly/Annual/Lifetime purchases + restore · `react-native-purchases` build · confirm the offering is marked **current** (else the paywall falls back to static prices).
- **§3.3.1 celebration:** the `FinaleHaptics` AHAP crescendo FEEL + first compile/autolink (Maestro sim covers compile) · deepened confetti + gold bloom · reduce-motion · VoiceOver on the beat/finale.
- **§VIS-2/B2 share (all THREE surfaces):** `captureRef`→PNG→`expo-sharing` on the FINALE card · the per-debt **Vanquished BEAT** card (inside a native `Modal`) · the Progress **archive** card (inside an `overflow:'hidden'` `Card`) — each rasterizes fully (no clipping) + shares.
- **§3.4 Wave C:** `expo-blur` real UIKit material (tab bar + sheet scrims) · gesture-handler touch (swipe-to-delete · sheet scrim-fade/spring/grabber-swipe + keyboard-aware backdrop + `dirty` Alert) · detent haptics firing (trajectory scrub · Cash-Runway drag · Slider) · Skia chart touch.
- **§3.5 native block:** Live Activity / Dynamic Island render on a real Lock Screen · widget families + StandBy on a Home Screen · App Intents / Siri register + fire (SIRI-1 re-test — the App-Intents-in-app-target fix) · the 2 device-fixes re-verify · App Group actually shares.
- **§3.6 native iPad:** both orientations · Split View · Stage Manager · pointer/keyboard incl. first-responder + tab-nav · per-screen re-layout · both themes.
- **§VIS-6 sound + notifications:** the opt-in chime plays (swap the synthesized placeholder for a mastered asset) · interactive-notification delivery + action buttons + tap-routing · risk-notification delivery + rollover-while-backgrounded.

---

## Deferred backlog

_(v1.7-deferred + v1.8 + Connected-tier items; the 2026-07-30 "no backlog" decision applied to the 3.5 audit findings only, not this list.)_
- **iOS-18 Control Center control (from 3.5.5):** a quick debt-free-date glance / open-to-log. App Intents + Siri + Live-Activity log-a-payment already cover the high-value ground; promote later if adoption warrants.
- **Guardian adjustment IMPACT visualization (v1.1/1.2)** — a Skia before/after showing the safety net reducing → freed money to debt → debt-free date sliding earlier, for any Guardian adjustment (attestation · adjust-your-line · top-up). Visually impressive; pairs with the Guardian interactivity.
- **cents-formatter sweep** — some surfaces show `$X.00` where whole dollars read cleaner (`formatWhole` vs `formatCurrency`); do app-wide in the wording pass.
- **Today + cushion-forecast selector memoization** — a full memoization pass on those two derived-selector-heavy screens if a real hotspot shows on device (Phase-6 perf).
- **Phase-3 enhancement-audit (B)/(C) items** — full lists in `DEBT_PHASE3_ENHANCEMENT_AUDIT_2026-07-27.md`: name→greeting personalization · dropped streak/milestone surfacing · chart VoiceOver alt-labels · drag-the-curve What-If · paywall benefit-copy reframe · Watch · Dynamic-Type device QA.
- **`@gorhom/bottom-sheet` migration → v1.8 Android** — JS-only, improves feel not look; flip when a feature needs multi-detent snap points or scroll↔drag handoff. Else scrapped.
- **Swipe-to-mark-paid on rows** — `markDebtMinimumPaid` exists but is payday-capture-owned; a manual swipe risks diverging. Deferred pending a `minimumPaidThisCycle` ownership decision.
- **BNPL cadence seams (non-blocking, by-design):** month-stepped vs per-cycle intermediate-balance divergence (agree at payoff endpoint) · paid struck-through row shows raw installment · "Pay minimum $300 for 3 installments" wording clarity · **BNPL payoff-RATE undercount in `projectDebtPayoff`** (biweekly BNPL retires ~2× too slow in the projection — normalize the monthly-equivalent) · **general sub-cycle obligation undercount** (weekly/biweekly RequiredExpense too — the clean fix expands obligations into per-occurrence instances).
- **`computeDrift`/`buildDriftBaseline` input type omits `recurrence`** — cadence-correct at runtime; add `recurrence?` so a future `.map` can't drop it (Drift is unmounted). · **Dead `DriftResult` re-export** — drop when convenient.
- **R2.8 offline lifetime-mislabel (LOW)** — a Lifetime owner offline before RevenueCat resolves briefly sees the subscription row; add a `premiumResolved` gate.
- **Holiday/promo free-trial** — launch is paywall-from-day-1; a time-boxed introductory offer on the EXISTING monthly product is a reversible later acquisition incentive.
- **iPad polish (v1.8):** More two-column settings layout · a web-level light-mode hover screenshot record.
- **Guardian honesty/coherence lens items (mostly convergence-audit-parked):** attestation affordance gated to where the reserve is meaningfully reducible · starter-EF-deploy "keeps it as cushion" overstatement · `selectTightTopUp` prefers a savings goal over the EF · hero-vs-Guardian number coherence · no-undo for the tight-case top-up · "hold your line" offered twice · applied-purchase reads as a deferrable bill · `GoalSheet` name-dedupe (match the save-for-it flow) · affordability-card density → the ack coordinator.
- **Gold-usage app-wide sweep** — formalize "gold = the debt-free moment only." · **Money hero-language coherence** — decide whether the calm-micro-viz hero extends to Debts (currently bare). · **Dead code:** `ProgressRing` / `MilestonesRow` — delete once the on-ring-journey lands.
- **Behavioral mis-entry detection / persistent-cushion / bill-shock autopilot** → Connected/Plaid tier (never gates the on-device Guardian).
- **§2.8 web scan entry** — `scan.web.ts` returns a sample for the demo; if a web build ships, decide hide-vs-keep-as-"try it".

## Decisions (log)

- **Re-scope to "The Elevation" ✅ (2026-07-20, E1/E2)** — design-first, best-in-class; "approve but talk through as we go." Version framing stays "v1.7 = The Elevation" unless Jason renumbers.
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel; lock price early, launch late. Un-chattable = stateful · scheduled · proactive · relational · on-device.
- **Revenue-spine pricing ✅ (2026-07-25)** — Monthly $4.99 · Annual $29.99 · Lifetime $79.99 (Lifetime = on-device Premium forever, EXCLUDES Connected/Ava). **NO free trial — paywall from Day 1.** Reuses the EXISTING RevenueCat project (v1.6 subs must restore); `react-native-purchases` replaces the Capacitor SDK.
- **2.5 rescope ✅** — one-off + BNPL-expiry heuristics scrapped (already handled); 2.5 = trials + a variable-bill %-buffer. · **2.6 Recovery ✅** — "one ladder, two directions" (the Guardian's priority ladder run in deficit). · **2.9 pivot ✅** — Momentum→Phase 3; **Can-I-Afford-This (inverse Guardian) promoted** as the premium build. · **2.7.1 ✅** — BNPL installment-native + balance fallback.
- **Phase-2 rescope ✅ (2026-07-25)** — widgets→Phase 3 · E2EE backup→Phase 5/6 · Windfall→Phase 3; Phase 2 closed on the revenue spine + framework audit. Nothing cut, all resequenced.
- **Phase-3 scope settled ✅ (2026-07-27)** — pull EVERYTHING into v1.7 unless it genuinely can't ship yet. Analytics OUT for v1.7 core (privacy moat) — **but the 3.5 demo re-opened it → D-A wires a privacy-first funnel seam.** House voice: Guardian sole "I", else "you." Genuinely-later: Android v1.8 · Plaid Connected v1.8 · sync · Ava.
- **Legacy gate RETIRED ✅ (2026-07-24)** — `validate:release` → the RN gate; old Next-app gate parked as `validate:release:legacy` until 5.5.1.
- **Executive "fix everything, no backlog" ✅ (2026-07-29 closeout · 2026-07-30 the 3.5 audits)** — [[feedback_fix_everything_one_block]]: fold every audit finding now, only hardware-verification stays for the Phase-6 device pass.

## Reference docs

- **Premium strategy:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · **Guardian build spec (v6):** `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` · **future features:** `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Phase 0 design synthesis:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · **motion:** `DEBT_MOTION_SPEC_2026-07-20.md`
- **Guardian audits:** `DEBT_GUARDIAN_{AUDIT_2026-07-22, REVIEW_DECISIONS_2026-07-23, CONVERGENCE_AUDIT_2026-07-24(+_ROUND2)}.md` · `DEBT_PREMIUM_ELEVATION_AUDIT_ROUND{2..6}_2026-07-23.md`
- **Phase-2 close:** `DEBT_PREMIUM_FRAMEWORK_AUDIT_2026-07-27.md` · **Phase 3:** `DEBT_PHASE3_{ENHANCEMENT_AUDIT_2026-07-27, CLOSEOUT_AUDIT_2026-07-29}.md` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/`
- **Phase 3.5:** `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` (`_SUMMARY` = the hardened build order)
- **Revenue-spine setup:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · **regression:** `REGRESSION_BASELINE_2026-07-24.md` · **native-block manual steps:** `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device-QA checklist:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history / per-item detail:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
