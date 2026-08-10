# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready**. Scope-creep isn't the constraint — comprehensiveness to reach the bar is.
>
> **This file is the LEAN driver** (live queue + forward phases + backlog + decisions). Full per-item history, after-scans, and shipped detail → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

---

## ▶ NOW

- **Active build:** **Phase 3.5 — interactive tutorial + bounded demo.** 3.5.0–3.5.3 ✅ done, incl. the 3.5.3.9 audit gate **CLOSED at round 10** (2026-08-05). **Phases 0–3 ✅ COMPLETE.**
- **✅ 3.5.6 CLOSED 2026-08-10 — the Phase 3.5 BUILD is done.** Gate **146/146**.
- **▶ ACTIVE BUILD: Phase 3.7 Wave A — correctness / honesty,** decomposed below. Promoted because **A1 and A2 are money-correctness defects in the shipped engine** (a biweekly BNPL retires ~2× too slow; a weekly obligation under a monthly payer is under-reserved) — every projected debt-free date in the app is downstream of them, and the cohesion audit should review a *correct* app.
- **✅ 3.5.7 SEQUENCED (🎯 Jason 2026-08-10): built AFTER Phase 3.7**, immediately before the cohesion audit. ⚠️ **Only the *when* is settled** — the hosting choice and the privacy stance for a public web surface are still open and are Jason's call at switch-in. The web-only `Slider` a11y gap (deferred backlog) becomes real the moment a web surface ships, so it is 3.5.7's problem to solve.
- **📱 The device pass is now ONE document — `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 · §12 · §13.** Run it against the fresh `v1.7-dev` build; **§11.15 first** (the iPad highlight is the only check that can hold a fix no web test can observe).
- **⚠️ A method lesson from 3.5.6.1 (2026-08-10):** two of its three items had been FIXED two days before the ledger recorded them open — **a ledger entry transcribed from an audit round carries the round's state, not the code's.** What was owed was the re-judge, and re-reading the diff could not supply it: the complaint was geometry, so it took an instrument (`tests/shots/guardian-spacing.shot.ts`). One of the three then measured as **not a defect at all**.
- **⚡ And the one from 3.5.6.2 (2026-08-10) — the sharpest of the phase:** the walkthrough had been ignoring the user's in-app theme and following the OS instead, and **every previous both-theme review looked correct** because the reviewing harness set the OS scheme and the preference together. **A screenshot pass cannot find a defect that only appears when two inputs DISAGREE, if the harness always agrees them.** Vary one input at a time. The same session then deleted its own new iPad assertion for the mirror-image sin — claiming to guard something it could not observe.
- **⚠️ A method lesson worth keeping (2026-08-08):** a stashed control run separates "the suite is flaky" from "we broke something" — **but SAMPLE IT MORE THAN ONCE.** One green control read as proof produced a confident wrong attribution and parked a finished item on a branch for a defect it had not caused. The suite's real flake (the beat-3 slider tap) is now fixed at the source.
- **✅ 3.5.8 CLOSED 2026-08-08 — the App-Preview capture pipeline delivers.** 🎯 Cycle 14 **APPROVED**: every guard green, and the celebration measured at **4.80s of room** (cycle 13 landed it in the final 0.1s). ⚠️ **The submitted asset is a re-shoot of this pipeline, not this file** — the UI still changes before Phase 6. Detail → log 3.5.8 cycles 13–14; frame verification → the audit doc's CYCLE 14 section.
- **⏭ Then:** 3.5.7 marketing embed (needs a hosting + privacy call) → the whole-app cohesion audit.
- **⚠️ 3.7.A9 folded in 2026-08-07** — `incomeVaries`/`leanAmount` had no UI at all, so the whole variable-income feature set was unreachable. Shipped in `PaycheckSheet` + onboarding.
- **⏳ Owed on hardware:** the native lane for 3.5.4.10, and the CM build against §12 of `DEBT_3.5_DEVICE_QA_CHECKLIST.md` (which flags one KNOWN-BAD item, already fixed in repo).
- **⚠️ ONE intermittent in the web gate, recorded rather than shrugged off (2026-08-10):** CI run `31402762934` failed `tutorial-invite › the tabs are held while a session is running` — `tutorial-progress` not found, i.e. **the session had ended when the test expected it still running**. It failed through its retry, and the two runs on either side passed with the same test; **1 red in the last 25 runs**. The commit it failed on changed a 4pt margin, so it is not that change. ⚠️ *Not* the documented port-4319 hazard — that one is two concurrent runner PROCESSES, not Playwright's internal workers, which share one server by design. Unexplained, low frequency, and worth a named watch: if it recurs, the question is what ends a session early. Do not fold it into the known beat-3 slider flake, which was fixed at the source.
- **⏸ Parallel (Jason):** cut a fresh `v1.7-dev` build (⚠️ current device build `c050173`/3.6.1 is STALE — predates the whole closeout + fold) → the consolidated **Phase-6 device pass** (the accumulated device-QA ledger, under Phase 6).
- **⚠️ Launch gating:** v1.7 ships as ONE release — nothing launches until Phase 6 is done + Jason is satisfied. The whole Elevation (through Phase 6) is the release.
- **Quality gate:** `validate:release:rn` (`lint:rn` + `test:regression` + `test:app` + `test:scenarios` + `test:e2e:rn`) — green across the board. **CI runs it on every push since 2026-08-05** (`web-e2e` had been red for a month gating the retired Next app — log: CI entry). Native lane (`native-e2e.yml`) stays manual.
- **Env:** shell cwd drifts to GigWorkTracker → use `git -C /c/Users/Jason/debt-app-v1 …`; `npm --prefix apps/rn run export:web` + `serve apps/rn/dist -l 4319 -s`; e2e `npm run test:e2e:rn`.
- **⚠️ Env — no ffmpeg here can read H.264.** Playwright's bundled build is `--disable-everything`, so inspecting a capture MP4 locally means Edge: `chromium.launch({ channel: 'msedge', args: ['--allow-file-access-from-files'] })`, `goto` the `file://` URL, seek, draw to canvas, read `getImageData`. Without that flag the canvas is tainted and luma readings are unavailable. It is how cycle 10's black-and-slate opening was found. ⚠️ **For "did anything MOVE", checksum the frames — never a whole-frame average**; cycle 14's luma was byte-constant across 4.7s of footage that was not still.
- **⚡ Prove capture-build changes LOCALLY before spending a cycle** (~18 min each, and this has paid three times): `EXPO_PUBLIC_CAPTURE_DEMO=1 npx expo export --platform web --clear`, serve, drive with Playwright. ⚠️ Then re-export **with `--clear`** and verify the flag did not leak — see `project_metro_cache_leaks_expo_public`.

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

✅ **3.5.0–3.5.3 DONE (2026-07-30 → 08-05)** — the sandbox substrate · the trigger/intro matrix + replay entries · the interactive-a11y path scaffold · the 7-beat in-situ arc with 2 interactive beats, the persistent Example marker and the E1 hand-back finale. Closed by the **3.5.3.9 audit gate at round 10** (10 rounds, every one finding real defects) + 3.5.3.10/.11. Detail, decisions and the three convergence rules → log; per-round detail → `DEBT_TUTORIAL_AUDIT_2026-08-02.md`.

- **3.5.6b — native Maestro lane for the walkthrough ✅ DONE 2026-08-06 (`f45ce18`).** 6/6 on iPhone 17 Pro Max / iOS 26.2, incl. both walkthrough flows. Caught a real data-loss bug (`FormSheet`'s Remove destroyed a record unconfirmed) and **proved 3.7.A0's payoff-schedule route on real UIKit**. Log: 3.5.6b.
- **3.5.3.9-L — the audit-gate residue ✅ LEDGER WRITTEN (2026-08-06).** The gate closed against a ledger that did not exist; it does now — `DEBT_TUTORIAL_AUDIT_2026-08-02.md` §T. **8 open** (1 design call [E4] · 3 polish/evidence · 2 LOW · round 10's native-lane findings LOST · the schedule row below the fold), 4 verified already-folded. Work it at **3.5.6**.

- **⭐ [D19] 2026-08-06 — the walkthrough is the ONLY in-app teaching surface; the demo becomes the App-Preview vehicle and must stop being Guardian-only.** Both showed the same feature with the same persona money on the same screen, so in-app they were one thing said twice. The demo's remaining job is the store video — and as built it never leaves Today, which makes it a *Guardian* demo, not a *Debt* demo. Pull its user-facing entries; rebuild the run as a multi-screen arc. → new **3.5.4.11**. Log: 3.5.4 / [D19].
- **3.5.4.11 — reimagine the demo for the App Preview ✅ DONE 2026-08-06.** Entries un-shipped · the 5-beat arc (Money → Today → Today → Progress → Today) navigating via `DemoDirector` · the closing beat primes a real payoff invitation so the capture driver taps the genuine flow · `?capture=1` strips the chrome. All five beats shot in both themes and reviewed. **2 open, both in the audit doc's capture section:** the debt-free date shifts a year on the closing beat only (Today and Progress AGREE unprimed, so A7 stays closed — `balanceAsOfDate` suspected, unproven), and Skia canvases came back unpainted in one capture-mode frame (likely web-only; native painted fine). Log: 3.5.4.11.
- **3.5.4 — bounded demo (B) + GTM funnel ✅ SUBSTRATE DONE 2026-08-06.** Kiosk containment ([D18]) · sandbox seam + hoisted provider · canvas-level Example marker · timed clear→tight→at-risk script on the day-one bound · entries from Welcome and the paywall with terminal exits · legacy demo seed retired · the funnel seam (no financial data by construction, no sink attached). ⚠️ **[D19] REVERSED "a real user gets it in v1.7"** — `isDemoReachable()` rides `QA_TOOLS`, so the demo is capture + embed only and leaves the shipped app at the Phase-6 flip. Both themes verified by looking. ⏳ native lane owed. Detail → log 3.5.4.x.
- **3.5.5 — feature-discovery coach-marks ▶ ACTIVE BUILD** (resumed 2026-08-08 when 3.5.8 closed). Decomposed below.
- **3.5.6 — verify + close:** both-theme + a11y (VO end-to-end) + e2e · **work the 3.5.3.9-L ledger** (§T, 8 open — incl. the [E4] design call, which is 🎯) · whole-3.5 after-scan → the whole-app cohesion audit.
- **3.5.7 — web-embeddable marketing-site demo (pulled IN — no backlog):** an embeddable interactive demo for the marketing site (embed harness + hosting + the privacy call), off the same sandbox substrate + scriptable run. Its own sub-step given the hosting/harness LOE + the App-Preview capture path (3.5.4) it shares.

- **3.5.8 — the App-Preview capture pipeline ✅ CLOSED 2026-08-08.** One tag-triggered dispatch on the free GH-macOS lane produces the submittable file ([D20]: the build starts itself, `simctl` records, ffmpeg conforms to 886×1920). **Cycle 14 APPROVED** — every guard green and the celebration measured at 4.80s of room. 14 cycles; the recurring lesson is that each guess at a moving quantity (launch time, anchor, stage timing) had to become something the app *asserts* or the pipeline *measures*. ⚠️ **Constraints that outlive it:** Apple takes ONE 886×1920 file, 15–30s, ≤30fps (re-verified 2026-08-06 vs ASC Help) · **the submitted asset is a re-shoot of this pipeline, not cycle 14's file** — the UI changes through 3.5.5, 3.7 and the audit gates · a device re-run stays the fallback if the runner's speed ever costs the chart reveals (3.5.8.8's guard makes that loud). Detail → log 3.5.8; frame verification → the audit doc's per-cycle sections.

#### 3.5.5 — feature-discovery coach-marks ✅ COMPLETE 2026-08-08

Three calm, dismissible, replayable marks — payoff-schedule · the row long-press (iOS-only) · the trajectory scrub — offered once ever, re-offerable from More, and refused during any bounded run. **Gate 139/139 × 3.** Detail → log 3.5.5.x.

⏳ **Owed to the Phase-6 device lane:** the in-sheet coach-mark layer (a root overlay renders *behind* a presented Modal on device, which is why it exists — and web cannot show the difference) · the **iOS-only** row-long-press mark · the "Got it" dismiss, unclickable in web e2e for the same flow-layout reason.

- **3.5.6 — verify + close ✅ DONE 2026-08-10.** Four sub-steps: the 3.5.3.9-L ledger closed (all 8 disposed, one measured as never a defect) · the both-theme + a11y sweep, which **found the walkthrough following the OS instead of the user's in-app theme** · the device debt consolidated into `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11–§13 · the whole-phase after-scan, which **found the Example marker asserted only by its absence** and closed the "which store does this read?" class with evidence. Gate 141→**146**. Detail → log 3.5.6.1–.4.

⚠️ **Phase 3.5's BUILD is complete; the PHASE is not — `3.5.7` is unbuilt and blocked on a 🎯 decision** (hosting + the privacy call for a public web surface). See the ▶ NOW block.

**Exit (3.5.6):** Phase 3.5 signed off — no open ledger items that web can settle, every device-owed item written down where the device pass will find it, and the phase's own after-scan folded into the plan.

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
- **⚠️ SHIP-BLOCKER · flip the app DISPLAY NAME before submit** — `app.json` is `"name": "Debt Planner (RN)"`, a dev label that would ship as the **Home Screen + App Store name** (and is why Siri demands "…in Debt Planner RN"). Flip to **"Debt Planner"**. Surfaced 2026-07-30 by Jason's Siri report; was tracked NOWHERE before that. Paired with 3.7.A8; the [DECISION D4] is only about *when* (see A8.3), not whether.
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
- **🎯 ALL of Phase 3.5's device debt → `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 (walkthrough) · §12 (demo) · §13 (coach-marks).** Consolidated there 2026-08-10 by 3.5.6.3, as runnable steps with PASS/FAIL rather than as a list of unknowns. **That file is the runnable truth; this line is the index.** ⚠️ It was duplicated here and drifted — which is exactly why it is now in one place. Highest-value item: **§11.15**, the iPad highlight, the only check that can hold a fix no web test can observe. Android's two known walkthrough risks (`measureInWindow` insets · `expo-blur` needing `experimentalBlurMethod`) are parked to the **v1.8 Android lane**, noted in the checklist's header.
- **§3.6 native iPad:** both orientations · Split View · Stage Manager · pointer/keyboard incl. first-responder + tab-nav · per-screen re-layout · both themes.
- **§VIS-6 sound + notifications:** the opt-in chime plays (swap the synthesized placeholder for a mastered asset) · interactive-notification delivery + action buttons + tap-routing · risk-notification delivery + rollover-while-backgrounded.

---

## Phase 3.7 — the FOLD-IN block (ledger clearance)

_**New standing rule (Jason 2026-07-30):** stop deferring — if an item needs no Phase-6 device pass and can truly land in v1.7, fold it in. The whole deferred backlog was retro-triaged against it on 2026-07-30; what follows is what folded. Runs AFTER Phase 3.5 (don't interrupt a half-built substrate) and BEFORE the whole-app cohesion + wording/voice audit gate, so the audit reviews the final state. Two items folded straight into Phase 3.5 instead (the impact viz → 3.5.3, sandbox-purity enforcement → 3.5.0.3). Sequence lives in `MASTER_PLAN.md`; this is the spec._

**▶ Wave A is the ACTIVE BUILD — decomposed (2026-08-10):**

| # | Step |
|---|---|
| **3.7.A.1** | **Verify Wave A against the CURRENT engine before touching it.** Every item below was written 2026-07-30; A0/A9 have since shipped and A7 may already be answered. Treat each as a hypothesis — confirm the defect still reproduces, and **write the failing test first**, because A1/A2 are arithmetic claims and a repro is the only thing that distinguishes a real undercount from a stale note |
| **3.7.A.2** | **A1 — BNPL payoff-RATE undercount.** A monthly projection pays a biweekly BNPL 1×/month, so it retires ~2× too slow. Normalize to a monthly equivalent. Highest-value: it moves debt-free dates |
| **3.7.A.3** | **A2 — general sub-cycle obligation undercount.** The allocator counts each obligation once per paycheck cycle, so a weekly/biweekly `RequiredExpense` under a monthly payer is under-reserved (the non-BNPL half of the same gap). Clean fix = expand obligations into per-occurrence instances |
| **3.7.A.4** | **A3 — the Guardian honesty/coherence ledger** (9 parked items: attestation affordance gating · the starter-EF "keeps it as cushion" overstatement · `selectTightTopUp` preferring a goal over the EF · hero-vs-Guardian number coherence · no-undo on the tight top-up · "hold your line" offered twice · an applied purchase reading as a deferrable bill · `GoalSheet` name-dedupe · affordability density) |
| **3.7.A.5** | **A4 · A5 · A6 · A7** — the BNPL seam polish · the offline Lifetime mislabel (`premiumResolved` gate) · drift type hygiene · confirm no third debt-free-date producer survives |
| **3.7.A.6** | **A8.1–A8.3 — the Siri phrase.** `INAlternativeAppNames` so "in Debt" works, shorter phrase variants, and [D4] stays *when* to rename, not whether. A8.4 is device-only → the checklist |

**Exit (Wave A):** the money is right — A1 and A2 have failing-then-passing tests, the honesty ledger is empty, and the gate is green. Wave B/C follow; C merges into the cohesion + wording gate.

**Wave A — correctness / honesty (highest value, do first):**
- **⚠️ A0 · "View Payoff Schedule" is dead on device — REDESIGN (ship-blocker, Jason 2026-07-30, 3rd report).** Two fixes have already landed and BOTH are in the `c050173` device build Jason tested, so this is not a patch problem — the nesting pattern itself has to go.
  - **Root cause (high confidence, device-unverified — only hardware proves it):** `AmortizationSheet overlay` renders `<View style={absoluteFill}>` as a **SIBLING of** the FormSheet `<Modal>` (`DebtSheet.tsx:246`), not inside it. On iOS a `Modal` is a separately-presented view controller, so a sibling overlay renders in the app tree **behind** it — the tap fires and state flips, but nothing is visible. On web it's all one DOM tree, so it looks correct, which is exactly why the web e2e passes.
  - **Why the two prior fixes missed:** `70c8879` fixed the real gesture-swallow (header out of the pan — that fix WORKS, Maestro proves ✕ is tappable). `2ad1531` then swapped nested-Modal → overlay but placed the overlay outside the Modal's tree, so the symptom moved from "tap swallowed" to "tap works, nothing appears" — indistinguishable from the outside.
  - **✅ A0.1 [DESIGN GATE] DECIDED (Jason 2026-07-30) — option B+A together:** the ENTRY moves off the edit sheet onto the debt row, and the schedule becomes a **real pushed route**. Fixes the architecture and the discoverability in one move — viewing a payoff schedule is a READ, and today it hides behind "Edit debt". _(Rejected: (C) render the overlay inside the Modal — smallest diff but preserves the pattern that has already failed twice.)_
  - **✅ A0.2–A0.3 DONE (2026-07-30, `c8a94a3`)** — `AmortizationView` (chrome-free content shared by both hosts) · route `app/schedule/[id].tsx` · entry off the sheet header → iOS row long-press menu + a sheet-BODY navigation row _(Jason's call: `RowContextMenu` is a web/Android passthrough, so a menu-only entry would strand both)_ · Money owns presentation via one `viewSchedule` (iPad → detail pane, compact → close-then-push) · **`AnimatedSheet.overlay` + `AmortizationSheet` DELETED** (overlay's only consumer, so the failure class is unreachable now, not just unused) · e2e 88/88 + a spec covering BOTH layout paths · Maestro `04-payoff-schedule.yaml` (edits a debt and asserts visibility on real UIKit — the gap flow 02 left) · both themes × both layouts screenshotted.
  - **⏳ A0.4 — re-verify on the next device build (Phase 6).** The ONLY step that can actually close this: web has no native Modal, so it structurally cannot prove the fix. _Also re-check the iOS long-press "Payoff schedule" menu item, which has no web equivalent at all._ **Partly bought forward by 3.5.6b:** Maestro flow 04 drives the whole journey on a real Simulator, which has genuine UIKit presentation semantics — a green flow 04 proves the route is not occluded, leaving only true device behaviour for Phase 6.
  - **A0 after-scan (both fixed in-item):** the iPad pane opened with no heading (caught by looking at the screenshots, not by any assertion) → pane now carries its own title · the route is deep-linkable so it can be entered COLD, where `router.back()` no-ops and strands the user → `canGoBack()` fallback to Money, +e2e.
- **A1 · BNPL payoff-RATE undercount in `projectDebtPayoff`** — a monthly projection pays a biweekly BNPL 1×/mo, so it retires ~2× too slow. 2.7.4 fixed the cash READ, not the payoff rate. Normalize the monthly-equivalent.
- **A2 · General sub-cycle obligation undercount** — the allocator counts each obligation once per paycheck cycle, so a weekly/biweekly `RequiredExpense` under a monthly payer is under-reserved (the non-BNPL half of the 2.7.4 gap). Clean fix = expand obligations into per-occurrence instances.
- **A3 · Guardian honesty/coherence ledger** (convergence-audit-parked): attestation affordance gated to where the reserve is meaningfully reducible · starter-EF-deploy "keeps it as cushion" overstatement · `selectTightTopUp` prefers a savings goal over the EF · hero-vs-Guardian number coherence · no-undo for the tight-case top-up · "hold your line" offered twice · applied-purchase reads as a deferrable bill · `GoalSheet` name-dedupe (match the save-for-it flow) · affordability-card density → the ack coordinator.
- **A4 · BNPL seam polish** — month-stepped vs per-cycle intermediate-balance divergence (they agree at the payoff endpoint) · paid struck-through row shows the raw installment · "Pay minimum $300 for 3 installments" wording clarity.
- **A5 · R2.8 offline lifetime-mislabel** — a Lifetime owner offline before RevenueCat resolves briefly sees the subscription row; add a `premiumResolved` gate.
- **A6 · Drift type hygiene** — `computeDrift`/`buildDriftBaseline` input omits `recurrence` (cadence-correct at runtime; add `recurrence?` so a future `.map` can't drop it) · drop the dead `DriftResult` re-export.
- **A7 · Debt-free-date producer reconciliation (residual)** — VIS-5 `selectDebtFreeBand` + MF.4 steady-state landed the two-run lean/typical engine; confirm no third independent producer survives, then retire the portfolio-level follow-on note.

- **A9 · variable-income controls ✅ DONE 2026-08-07.** `incomeVaries`/`leanAmount` had **no UI anywhere** — read by 6 engine modules, written by none — so VIS-5's band, `incomeLearning`, lean verification and the variable cold-start holdback were dead for every user (`vis5-cone` passed only by seeding the flag into the store). Shipped: switch + required floor field in **both** `PaycheckSheet` and onboarding, cleared when switched off. e2e drives the UI, never the store. Log: 3.7.A9.
- **A8 · Siri invocation phrase too long (Jason 2026-07-30, on device)** — *"Hey Siri, what's my debt-free date on Debt Planner RN?"*. **Verified against current Apple docs (not memory):** every App Shortcut phrase **must** contain `\(.applicationName)` — the app name cannot be dropped, so the phrase can only shrink by shrinking the NAME. `.applicationName` also matches **synonyms** registered as `INAlternativeAppNames` in Info.plist, and synonyms must be based on the real name or a legitimate user name.
  - **A8.1** add `INAlternativeAppNames` to `ios.infoPlist` (e.g. "Debt Planner", "Debt") → *"Hey Siri, what's my debt-free date in Debt?"* — this alone fixes the complaint without touching the dev build's identity.
  - **A8.2** add shorter phrase variants alongside the existing ones (`SiriQueryIntents.swift` already has 2 per intent; AppShortcut takes several) — e.g. "Debt-free date in \(.applicationName)".
  - **A8.3 [DECISION D4]** *when* to flip `app.json` `name` → "Debt Planner": **rec = synonyms now, rename at Phase-6 pre-submit**, so the dev build stays visually identifiable meanwhile. The rename itself is not optional — it's a ship-blocker filed in Phase 6.
  - **A8.4** device re-verify (Siri is device-only; the phrase set can't be proven on web or in the Simulator).

**Wave B — features that belong in v1.7:**
- **B1 · Drag-the-curve What-If** — direct manipulation on the trajectory chart (from the Phase-3 enhancement audit).
- **B2 · Dropped streak / milestone surfacing** — streaks exist in the substrate but reach no surface.
- **B3 · Name → greeting personalization.**
- **B4 · Swipe-to-mark-paid on rows** — ⚠️ gated on **[DECISION D2] `minimumPaidThisCycle` ownership** (today it's payday-capture-owned; a manual swipe risks diverging). Resolve the ownership question, then build.

**Wave C — coherence / wording sweeps (merge INTO the cohesion + wording/voice audit gate):**
- **C1 · cents-formatter sweep** — `$X.00` vs whole dollars (`formatWhole` vs `formatCurrency`), app-wide.
- **C2 · Gold-usage sweep** — formalize "gold = the debt-free moment only."
- **C3 · Money hero-language coherence** — ⚠️ **[DECISION D3]**: does the calm-micro-viz hero extend to Debts (currently bare)?
- **C4 · Paywall benefit-copy reframe.**
- **C5 · Chart VoiceOver alt-labels** — code-addressable now; the on-device VO spot-check rides Phase 6.
- **C6 · iPad More two-column settings layout** — verifiable at the existing iPad e2e viewport.
- **C7 · Dead code** — delete `ProgressRing` / `MilestonesRow`. _(+from the 3.5.1 after-scan: `prefs.guardianIntroSeen` is now ORPHANED — 3.5.1.5 retired its only reader. It's a PERSISTED field, so decide delete-with-migration vs leave-inert here rather than as scope-creep on a feature.)_ _(+from the A0 after-scan: `FormSheet.headerAction` and `AnimatedSheet.headerRight` now have ZERO consumers. Deliberately NOT deleted in A0 — they're legitimate general props and the gesture bug that made them dead is genuinely fixed (Maestro 02 proves ✕ taps land). Decide keep-vs-delete here rather than as scope-creep on a bug fix.)_
- **C9 · `router.back()` cold-entry sweep** — the A0 route now guards with `canGoBack()`, but `history`, `cushion-forecast`, and `living-expenses` still call `router.back()` bare. Harmless while they're only reachable by push; worth a sweep if any becomes deep-linkable.
- **C8 · §2.8 web scan entry** — decide hide-vs-keep-as-"try it" for `scan.web.ts`'s sample (trivial call, just make it).
- **C10 · doc disambiguation (3.5.3.2 after-scan)** — "3.5.3.x" is overloaded: Phase 3's item 3.5 (Live Activity) used 3.5.3.1–.5, and Phase 3.5's tutorial arc now uses the same leaf numbers. Note it where both appear in `DEBT_ELEVATION_LOG.md` so a later reader can't conflate them.

---

## Deferred backlog

_(Post-triage 2026-07-30 under the fold-don't-defer rule — only two carve-outs remain: **device-gated**, or **genuinely a later version/tier**. Everything else moved to Phase 3.7 above.)_

**Device-gated → the consolidated Phase-6 device pass:**
- **Today + cushion-forecast selector memoization** — deliberately conditional on a REAL measured hotspot on device; optimizing without one is premature.
- **Dynamic-Type device QA.**

**Genuinely a later version / tier:**
- **⚠️ `Slider` reports no value on WEB** — react-native-web drops `accessibilityValue`, so it renders `role="slider"` with an `aria-label` and no `aria-valuenow`/`aria-valuetext` (measured 2026-08-08, 3.5.5.4). Native maps it properly and the app ships native, so this is web-only — but `a11y-axe` does not flag it, and it would matter the moment a web surface ships (3.5.7's embed).
- **Apple Watch** — a new platform target → v1.8+.
- **`@gorhom/bottom-sheet` migration** — v1.8 Android; JS-only, improves feel not look, and is a live scrap candidate. Flip only if a feature needs multi-detent snap points or scroll↔drag handoff.
- **Behavioral mis-entry detection / persistent-cushion / bill-shock autopilot** → Connected/Plaid tier (a tier that doesn't exist yet; never gates the on-device Guardian).
- **Holiday/promo free-trial** — a deliberate strategy call, not a deferral: launch is paywall-from-day-1, and an introductory offer on the existing monthly product stays a reversible later acquisition lever.
- **iOS-18 Control Center control** — ⚠️ **[DECISION D1]**, held as a value call: App Intents + Siri + Live-Activity log-a-payment already cover this ground, and it's device-verified anyway. Recommend staying deferred.
- **Web-level light-mode hover screenshot record** — a QA artifact, not product.
- **`typicalAmount` still has no UI** *(3.7.A9 after-scan)* — A9 shipped the switch + `leanAmount`; `typicalAmount` remains written by nothing. It is documented as "the optional normal-cycle figure" and feeds only `suggestLean`'s starting point (`|| 0` fallback), so the impact is far smaller than A9's — but it is the same shape, and left unnamed it would be rediscovered as a bug. → the wording/voice + cohesion gate, or wherever the income UI is next touched.
- **The simulator build recipe is DUPLICATED across `native-e2e.yml` and `app-preview.yml`** *(3.5.8.6 after-scan)* — ~60 lines carrying expensive native fixes (ios-utilities rootcontentview plugin · `SENTRY_DISABLE_AUTO_UPLOAD` · pod-install-as-its-own-step). Extract a composite action so they cannot drift. Deliberately NOT done in the change that first proves the capture pipeline — a bug in the extraction would break the proven native gate too. → after the first green capture run.
- **No local pre-flight for the capture path** *(3.5.8.9 after-scan)* — a flagged web export + a ~40-line check proved the slate fires, clears and releases the clock in about four minutes, and would have caught the hold/release condition split before a cycle. Eight CI cycles at ~27 min have been spent on things this class of check finds. NOT folded in: a permanent harness has to handle the `EXPO_PUBLIC_*` cache footgun and restore the clean bundle, which is a workstream rather than polish. → alongside the composite-action extraction above.
- **A transient `$790` on Today's arrival** *(cycle 9 review)* — the 2fps sheet catches Today showing `$790` with a half-rendered Guardian card for ~0.5s at beat 2's arrival, before settling to the persona's `$2,000`. Same class as cycle 7's `$1,747`, which did not reproduce. A store video must not show a number nobody can account for. → settle at 3.5.8's review, before the asset is cut.
- **The demo's beat dwell may be too short for the runner** *(3.5.8.9 after-scan)* — 4/5/5/6s per beat against a post-navigation paint lag cycle 8 measured in seconds. NOT changed pre-emptively: the arc's pacing is [D19]-approved and ~25s leaves little room under Apple's 30s ceiling. → decide from the 2fps contact sheet the next cycle emits, which is the first evidence of how long each screen actually takes.
- **The app never shows a debt-free date that reflects its own plan working** *(3.5.8.1 after-scan)* — on day one the starter EF absorbs the surplus, so extra-to-debt is $0 and every projected date is minimums-only. Honest on each screen; the question is whether the app-wide effect undersells what it does. → the **whole-app cohesion audit**, not a defect.
- **Two INERT persisted prefs to drop with a migration** *(3.5.4.8 after-scan)* — `prefs.isDemoMode` (3.5.4.8 removed its last writer and reader) and `prefs.guardianIntroSeen` (3.5.1.5 retired its only reader, already noted at Wave C7). Both are unread booleans in the persisted blob, harmless where they sit. Removing a key is a schema change, so it belongs to the **Phase-5 migration bridge** — the one place upgrade shapes are adversarially tested — rather than to whichever feature commit happens to notice. → Phase 5, with the migration audit.
- **⚠️ Legacy `debtPlanner.isDemoMode` still referenced in `packages/core/testing`** *(3.5.4.8 after-scan)* — `seedPlannerState.ts` writes it and `testDemoModeSeed.ts` asserts on it, both against the **Capacitor** localStorage keys. Harmless (they test the legacy tree) but they are now testing a flag the RN app no longer honours, which will read as a live contract to the next person. → 5.5.1, with the Capacitor tree's removal.
- **⚠️ `apps/rn/package-lock.json` is out of sync with its `package.json`** *(3.5.6b after-scan)* — `npm ci` refuses it, naming ~12 missing transitive entries (`@testing-library/dom`, `react-native-nitro-modules`, the `@react-native/metro-*` chain). Both CI lanes work around it with `npm install --prefer-offline`, which means **the RN app's installs are not reproducible** — CI and a fresh clone can resolve a different tree than the one that was tested. Fix = regenerate the lock deliberately and re-run the full gate, NOT as a side effect of another change. → before the Phase-5 cutover, where an install-drift surprise is most expensive.
- **⭐ Extend the Maestro lane to an iPad simulator** *(3.5.6.3.3)* — `native-e2e.yml` picks the newest **iPhone** simulator only (`grep -oE 'iPhone [0-9]+...'`), so every iPad-layout claim in the app is verified by a human or not at all. An iPad target + a flow that steps the 7 beats would take **four** items off the device's plate — the **ring-origin invariant** (§11.15, currently guarded by nothing, and web CANNOT guard it because the overlay's origin is 0 there), beat 5's landscape composition (§11.16), the in-sheet coach-mark behind a real presented Modal (§13.1), and the iOS-only long-press mark (§13.3). 3.5.6b already proved this shape works: a simulator has genuine UIKit presentation semantics and it caught a real data-loss bug. **NOT folded into 3.5.6.3**, which is a consolidation item — a new CI lane is its own workstream, and it wants batching with the next native build rather than a cycle of its own ([[batch-ci-builds]]). **Strongest candidate for the next active build after Phase 3.5 signs off.**
- **⚠️ TWO screenshot mechanisms now exist** *(3.5.6.2 after-scan)* — `tests/visual/*.cjs` at the repo root (raw Playwright, run by hand) and `apps/rn/tests/shots/*.shot.ts` (config-driven, inside the app). The root set is the one whose stale frames masked the sandbox theme defect for days, because it seeds the OS scheme and the in-app preference together. The root tree is 5.5.1's to remove; deliberately NOT deleted mid-sweep, since its frames were the only prior record of several 3.5 surfaces. → **5.5.1**, with the Capacitor tree.
- **`DEBT_ELEVATION_LOG.md` has outgrown a single file** *(3.5.6b after-scan)* — ~365KB, past the point where an agent's Read can open it in one pass, so every consultation is now a grep against a file whose whole value is being readable end to end. Split by phase (`…_LOG_PHASE_0-3.md` / `_3.5.md` / …) with the index staying in the plan. Doc hygiene, not product — do it at 5.5.3 with the rest of the tooling/docs pass.

## Decisions (log)

- **Re-scope to "The Elevation" ✅ (2026-07-20, E1/E2)** — design-first, best-in-class; "approve but talk through as we go." Version framing stays "v1.7 = The Elevation" unless Jason renumbers.
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel; lock price early, launch late. Un-chattable = stateful · scheduled · proactive · relational · on-device.
- **Revenue-spine pricing ✅ (2026-07-25)** — Monthly $4.99 · Annual $29.99 · Lifetime $79.99 (Lifetime = on-device Premium forever, EXCLUDES Connected/Ava). **NO free trial — paywall from Day 1.** Reuses the EXISTING RevenueCat project (v1.6 subs must restore); `react-native-purchases` replaces the Capacitor SDK.
- **2.5 rescope ✅** — one-off + BNPL-expiry heuristics scrapped (already handled); 2.5 = trials + a variable-bill %-buffer. · **2.6 Recovery ✅** — "one ladder, two directions" (the Guardian's priority ladder run in deficit). · **2.9 pivot ✅** — Momentum→Phase 3; **Can-I-Afford-This (inverse Guardian) promoted** as the premium build. · **2.7.1 ✅** — BNPL installment-native + balance fallback.
- **Phase-2 rescope ✅ (2026-07-25)** — widgets→Phase 3 · E2EE backup→Phase 5/6 · Windfall→Phase 3; Phase 2 closed on the revenue spine + framework audit. Nothing cut, all resequenced.
- **Phase-3 scope settled ✅ (2026-07-27)** — pull EVERYTHING into v1.7 unless it genuinely can't ship yet. Analytics OUT for v1.7 core (privacy moat) — **but the 3.5 demo re-opened it → D-A wires a privacy-first funnel seam.** House voice: Guardian sole "I", else "you." Genuinely-later: Android v1.8 · Plaid Connected v1.8 · sync · Ava.
- **Legacy gate RETIRED ✅ (2026-07-24)** — `validate:release` → the RN gate; old Next-app gate parked as `validate:release:legacy` until 5.5.1.
- **[D20] capture pipeline ✅ (2026-08-06)** — Maestro drives · `simctl` records · ffmpeg conforms; `maestro record` rejected (2× speed, composited command panel, cloud render). **[D20a]** one caption over the closing beat carries the IAP disclosure + the muted viewer's anchor. **[D20b]** persona → 3 debts/~$18–25k. Killed the plan's "simulator yields exact store pixel dimensions" claim — iPhone takes one fixed 886×1920 file. Log: 3.5.8 switch-in.
- **Executive "fix everything, no backlog" ✅ (2026-07-29 closeout · 2026-07-30 the 3.5 audits)** — [[feedback_fix_everything_one_block]]: fold every audit finding now, only hardware-verification stays for the Phase-6 device pass.

## Reference docs

- **Premium strategy:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · **Guardian build spec (v6):** `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` · **future features:** `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Phase 0 design synthesis:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · **motion:** `DEBT_MOTION_SPEC_2026-07-20.md`
- **Guardian audits:** `DEBT_GUARDIAN_{AUDIT_2026-07-22, REVIEW_DECISIONS_2026-07-23, CONVERGENCE_AUDIT_2026-07-24(+_ROUND2)}.md` · `DEBT_PREMIUM_ELEVATION_AUDIT_ROUND{2..6}_2026-07-23.md`
- **Phase-2 close:** `DEBT_PREMIUM_FRAMEWORK_AUDIT_2026-07-27.md` · **Phase 3:** `DEBT_PHASE3_{ENHANCEMENT_AUDIT_2026-07-27, CLOSEOUT_AUDIT_2026-07-29}.md` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/`
- **Phase 3.5:** `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` (`_SUMMARY` = the hardened build order)
- **Revenue-spine setup:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · **regression:** `REGRESSION_BASELINE_2026-07-24.md` · **native-block manual steps:** `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device-QA checklist:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history / per-item detail:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
