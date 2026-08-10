# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — 3.7.A10 · obligations: entry, naming, recovery

**Why this one, ahead of Wave A's engine work:** a debt filed as an expense is reserved correctly every
payday and **silently omitted from the payoff plan and the debt-free date** — the number the whole app
exists to produce. Fixing the allocator's arithmetic (A1/A2) does not help an obligation that is in the
wrong bucket entirely. Presentation-layer only, so the engine is untouched. Review:
[`docs/audits/2026-08-10-money-ia-review/`](audits/2026-08-10-money-ia-review/README.md).

**🎯 [D22] Jason 2026-08-10 — the MODEL is right, the naming and the entry are not.** Expenses = no end
date (rent, utilities, subscriptions). Debts = the things we track because they end (card, BNPL, loan,
mortgage). That is the terminating/perpetual axis and it stays. ⛔ **Do not merge the models.** The
evidence that labels alone cannot carry it: the author of the split mis-filed under his own split.

| # | Step | State |
|---|---|---|
| **A10.1** | ✅ **DONE 2026-08-10** — one Add asking *"does this have a balance you're paying down?"*, replacing all six entry points (3 rows + 3 empty-state CTAs). Picking also switches section, so the answer lands visibly. ⌘N stays direct — a typed accelerator is not a silent classification | |
| **A10.2** | ✅ **DONE 2026-08-10** — `looksLikeDebt` (name-only; **category as a conjunct was rejected on inspection** — it would catch a mortgage and miss every card) + an atomic `convertExpenseToDebt` + a quiet row hint with a remembered "Not a debt". Retroactive by construction: the detector reads the existing list | |
| **A10.3** | ✅ **DONE 2026-08-10** — Bills → **Expenses** across the Money surface + the sheet + **onboarding's first-run fork**, which A10.1 had missed and is the first classification anyone makes. Guardian/Today/tutorial vernacular deliberately untouched → [D22d] | |
| **A10.4** | ✅ **DONE 2026-08-10** — a one-line caption under the section toggle, phrased by the TEST (what makes it that kind of thing) rather than by example, since a browser needs the rule and a chooser needs the nouns | |
| **A10.5** | **Whole-item after-scan + both-theme review.** e2e already covers the three routes, the conversion and the dismissal | ▶ next |
| **A10.6** | ✅ **HANDED OFF 2026-08-10** — filed into **Phase 5** beside the migration bridge, where the affected population actually arrives |

**Exit:** a user cannot file a terminating obligation as a perpetual one without being asked the question,
existing mis-files are surfaced non-accusingly, and Today's required-actions merge is untouched.

⛔ **Not in scope:** silently re-filing on a keyword match · touching `selectRequiredRows` /
`RequiredActionView` (that merge is CORRECT — rent and a card minimum are both owed this paycheck).

### ⏭ Then, in order

1. **Phase 3.7 Wave A** — the engine correctness block: **A1** BNPL payoff-rate undercount · **A2** sub-cycle obligation undercount · **A3** the 9-item Guardian honesty ledger · **A4–A7** · **A8** the Siri phrase. ⚠️ Written 2026-07-30 — verify each against the current engine and write the failing test first
2. **Wave B** — B1 drag-the-curve · B2 streak/milestone surfacing · B3 greeting · B4 swipe-to-mark-paid *(needs [D2])*
3. **3.5.7 — the marketing embed** *(🎯 needs hosting + the privacy stance)*
4. **The audit gate** — whole-app cohesion + best-in-class + wording/voice *(Wave C merges in here)*
5. **Phase 5** (data continuity, ship-blocker) → **5.5** (repo consolidation) → **Phase 6** (launch)

### ⏸ Waiting on Jason

- **Cut the CodeMagic build** — workflow *"Debt Planner RN — iOS TestFlight"*, branch `v1.7-dev`. ⚠️ The device build `c050173`/3.6.1 is **stale by a whole phase.** Then run `DEBT_3.5_DEVICE_QA_CHECKLIST.md` — **§11.15 first.**
- **3.5.7's hosting + privacy specifics** (the *when* is settled: after 3.7).
- **[D2]** `minimumPaidThisCycle` ownership — gates B4. · **[D3]** Money hero language. · **[D1]** Control Center (rec: stay deferred).

### ⚠️ Open defects

- **A transient `$790` on Today's arrival** during the demo — a half-rendered Guardian card for ~0.5s at beat 2. Now **user-facing** under [D21], not just a store-video concern. Settle before the asset is cut.

**Gate:** `validate:release:rn` — **146/146**, zero `error-context.md`. CI runs it on every push.
**Env:** `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` + `serve apps/rn/dist -l 4319 -s` · e2e `npm run test:e2e:rn`. ⚠️ Capture-pipeline and H.264-inspection recipes → log §"Working notes".

---

## Phases — status

| Phase | Scope | Status |
|---|---|---|
| 0–3 | Design foundation · surface · premium substance · delight + native | ✅ COMPLETE |
| 3.5 | Interactive tutorial + bounded demo | **BUILD COMPLETE**; 3.5.7 + the device pass remain (below) |
| **3.7** | **Fold-in block (ledger clearance)** | **▶ ACTIVE — Wave A** |
| — | Whole-app cohesion + best-in-class + wording audit gate | after 3.7 |
| 4 | Quality (test harness) | delivered by the RS baseline; continuous |
| 5 | Data continuity + cutover | 🔒 ship-blocker, upcoming |
| 5.5 | Repo consolidation | before the release gate |
| 6 | Launch-ready | final |

**Phase 0–3 detail → the log.** Canonical specs → Reference docs at the foot of this file.

### ⚠️ Standing constraints

- **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT (3.2.x ships broken) · `react-native-ios-utilities ^5.2.0`.
- **v1.7 ships as ONE release.** Nothing launches until Phase 6 is done and Jason is satisfied.
- **`QA_TOOLS = true` ships in TestFlight and MUST be flipped false before submission** (`git grep QA_TOOLS`). It is what makes the demo reachable at all.
- **Never push to `release/v1`** — it is the default branch and is gated on a live, approved version.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

---

## Phase 3.5 — what is LEFT

The build is complete (tutorial · bounded demo · coach-marks · capture pipeline). **The phase is not
signed off, because its OUTPUT is not final:**

| | Item | State |
|---|---|---|
| 1 | **3.5.7 — web-embeddable marketing demo** | the only unbuilt build item. After 3.7. ⛔ Does **not** wait on the device pass — the embed is live code, the App Preview is a frozen video, and the device pass verifies native behaviour a browser does not have. It waits on the debt-free-date defect, hosting/privacy, and the web-only `Slider` a11y gap |
| 2 | **The device pass** | `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 walkthrough · §12 demo · §13 coach-marks, against the fresh build |
| 3 | **3.5.9 — reinstate the demo ✅ DONE 2026-08-10** | [D21] reverses [D19]. `isDemoReachable()` no longer rides `QA_TOOLS`; both doors restored and now **tested** — nothing covered them before, which is how they were pulled unnoticed. Log: 3.5.9 |
| 4 | **The App-Preview asset must be RE-SHOT** | the pipeline is proven and cycle 14 approved, but the submitted file is shot after the UI settles → Phase 6 |

**Division of labour, now settled:** demo = BEFORE you commit (Welcome + paywall, sandboxed, terminal
exits) · walkthrough = AFTER onboarding, on your own money.

**Restraint that still governs the tutorial/demo:** no Tier-3 spectacle, confetti or sound · no
gamification chrome · Recovery stays a glimpse · the in-app tutorial stays ≤7 beats.

---

## Phase 3.7 — the fold-in block ▶ ACTIVE

_Standing rule (Jason 2026-07-30): stop deferring — if an item needs no device pass and can land in v1.7,
fold it in. Runs after 3.5 and BEFORE the audit gate, so the audit reviews the final state._

**Wave A — correctness / honesty** *(decomposed at the top of this file)*
- **A1 · BNPL payoff-RATE undercount** in `projectDebtPayoff` — a monthly projection pays a biweekly BNPL 1×/mo. 2.7.4 fixed the cash READ, not the payoff rate.
- **A2 · sub-cycle obligation undercount** — the allocator counts each obligation once per paycheck cycle, so a weekly/biweekly `RequiredExpense` under a monthly payer is under-reserved.
- **A3 · Guardian honesty ledger** — attestation gating · starter-EF "keeps it as cushion" overstatement · `selectTightTopUp` preferring a goal over the EF · hero-vs-Guardian coherence · no-undo on the tight top-up · "hold your line" twice · applied purchase reads as deferrable · `GoalSheet` name-dedupe · affordability density.
- **A4** BNPL seam polish · **A5** offline Lifetime mislabel (`premiumResolved` gate) · **A6** drift type hygiene · **A7** confirm no third debt-free-date producer.
- **A8 · Siri phrase** — every App Shortcut phrase must contain `\(.applicationName)`, so it can only shrink by shrinking the NAME. A8.1 synonyms · A8.2 shorter variants · A8.3 [D4] *when* to rename · A8.4 device-only.
- ✅ **A0** payoff-schedule redesign **DONE** (`c8a94a3`) — ⏳ only **A0.4**, the device re-verify, remains → the checklist. ✅ **A9** variable-income controls **DONE** 2026-08-07.

**Wave B — features that belong in v1.7:** B1 drag-the-curve What-If · B2 dropped streak/milestone
surfacing · B3 name→greeting · B4 swipe-to-mark-paid *(⚠️ gated on [D2])*.

**Wave C — coherence sweeps, MERGED INTO the audit gate:** C1 cents-formatter · C2 gold usage · C3 Money
hero language [D3] · C4 paywall copy · C5 chart VO labels · C6 iPad More two-column · C7 dead code
(`ProgressRing`/`MilestonesRow`, orphaned `guardianIntroSeen`, `FormSheet.headerAction`) · C8 web scan
entry · C9 `router.back()` cold-entry sweep · C10 doc disambiguation of the overloaded "3.5.3.x".

---

## Audit gate — whole-app _(after 3.7, before Phase 5)_

- [ ] **Cohesion** — the same adversarial rigor for the ENTIRE app (Phases 0–3.7), criterion: does every element work TOGETHER? Cross-surface voice · visual · motion · numbers.
- [ ] **Best-in-class enhancement pass** — aspirational, app-wide: is each surface genuinely top-of-class, and what makes it unforgettable? Benchmark vs category leaders; restraint, not fireworks.
- [ ] **Wording / voice** — every user-facing string, both tiers, all states, against the house voice. Absorbs Wave C's copy items.

⚡ **Input from 3.5's phase after-scan — three defect classes to hunt at scale:** ① an assertion that
passes either way ② evidence cited but never committed ③ two records of one thing, drifting. All three are
**a claim kept somewhere other than where it is checked.**

_All three audits fan out on Fable 5._

---

## Phase 4 — Quality

- ✅ Largely delivered by the RS baseline (tsx app-layer harness · core engine fuzz · RN-web e2e), green-gated by `validate:release:rn`.
- **Residual coverage:** `testEngineFuzz` → `holdbackComposition` · RN e2e for missed/stale/debt-free states + a mobile viewport · app-layer CRUD coverage.
- **e2e harness race:** `webServer` re-exports and spawns its own `serve` on :4319, racing a hand-started one. ⚠️ Corollary: `reuseExistingServer` reusing a STALE serve serves an OUTDATED `dist` — force a fresh `export:web` when adding a route.
- **⚠️ One unexplained intermittent (2026-08-10):** `tutorial-invite › the tabs are held while a session is running` failed through its retry in CI, 1 red in 25 runs, on a commit that changed a 4pt margin. The session had ended when the test expected it running. Not the port-4319 hazard. If it recurs, the question is what ends a session early.
- **Known web-e2e limits:** cannot reliably drive gestures, `SectionList` row taps, or stacked modals → prefer seed + deep-link; push gesture flows to Maestro/device.

## Phase 5 — Data continuity + cutover 🔒 ship-blocker

The migration bridge (WKWebView `localStorage` → RN storage), **proven on a real populated upgraded
device**, then cutover to the RN app as the shipping app.
- **⭐ [AUDIT GATE] Adversarial migration/upgrade audit — the EXIT gate, no cutover until green.** Every prior data shape: v1–v6 schemas · partial/corrupt/empty/huge portfolios · malformed dates & numbers · mid-migration interruption. Upgrade data-loss is catastrophic AND irreversible.
- **⭐ E2EE iCloud backup** — native iCloud/document-picker/share-sheet restore over the existing store serialization. NOT premium-gated ("never lose your data" is a baseline). ✅ Proven template: Freedom v1's `ICLOUD_BACKUP_SETUP.md` + `cloudBackup.ts`. ⚠️ Also **replace the paste-JSON import** with a real file picker (`BackupSheets.tsx` is text-only today, and its own comment calls the file flow the intended upgrade) — 🎯 Jason 2026-08-10 reported it and scoped it here.
- **⚠️ [3.7.A10.6] Run the mis-filed-obligation detector over MIGRATED data.** v1.6's Capacitor app offered **"Credit Card Payment"** and **"Loan Payment"** as one-tap BILL presets (`packages/core/constants/requiredExpensePresets.ts:10-59`, still wired into the legacy `AddExpenseModal`), so upgrading users arrive with debts already filed as expenses — and their debt-free date silently omits them. `looksLikeDebt()` + `convertExpenseToDebt()` already exist (3.7.A10.2); the bridge has to *use* them, because the Money-page hint only reaches someone who happens to open that list. **This is the largest affected population in the app.**
- **Drop two INERT persisted prefs with the migration** — `prefs.isDemoMode` and `prefs.guardianIntroSeen`.

## Phase 5.5 — Repo consolidation

- **5.5.1** remove the root Capacitor/Next surface (God-files · `ios/` Capacitor bits · `next.config` · WebView glue). Also retires `validate:release:legacy`, the root Next lint, the legacy `debtPlanner.isDemoMode` test references, and `tests/visual/*.cjs`.
- **5.5.2 [DECISION]** final repo structure — promote `apps/rn` to root vs keep the monorepo *(rec: keep it; `packages/core` is shared portfolio-wide)*.
- **5.5.3** tooling / CI / docs to the consolidated tree. Includes **splitting `DEBT_ELEVATION_LOG.md`** (~4k lines, past one-pass readability).
- ✅ **5.5.4 DONE EARLY** — `apps/rn` has its own `eslint-config-expo`.
- ⚠️ Verify scope against the CURRENT tree at switch-in — pre-authored cleanup drifts.

## Phase 6 — Launch-ready

Acquisition-grade store presence · cold-start excellence · the device-QA gate · submit.

- **⭐ [AUDIT GATE] Pre-Release Best-in-Class FINISH sweep — runs FIRST, on the FROZEN app.** Every screen · sheet · card · state · both themes · iPhone/iPad/Split-View · Dynamic Type. Lenses: truncation · copy · premium bar · theme parity · state completeness · cross-surface consistency · layout · tap targets · a11y · motion · honesty. Complements, not replaces, the after-3.7 gate.
- **⭐ [AUDIT GATE] Privacy / data-flow audit** — trace EVERY egress and prove "financial data never leaves your device" is literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs.
- **⭐ [AUDIT GATE] Pre-submit functional-correctness audit + FINANCIAL-CORRECTNESS money lens** — boundary inputs across the engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios.
- **⚠️ SHIP-BLOCKER · flip the DISPLAY NAME** — `app.json` is `"name": "Debt Planner (RN)"`, which would ship as the Home Screen + App Store name. Flip to **"Debt Planner"**. Paired with A8.
- **⚠️ SHIP-BLOCKER · flip `QA_TOOLS` to false** (see Standing constraints).
- **Sentry — scaffold done; Phase 6 = flip it on:** set `EXPO_PUBLIC_SENTRY_DSN`, CI source-map care, verify capture on a real build, add a `beforeBreadcrumb` PII scrub.
- **App-Preview asset** — re-shoot off the proven pipeline once the UI is frozen. Apple takes ONE 886×1920 file, 15–30s, ≤30fps.
- **AU/NZ availability + E2EE trust-claim verification** — verify the Apple ADP-status API exists, or fall back to honest "encrypted iCloud backup" wording.
- **App Review paywall-findability** (v1.1 was rejected repeatedly) — the ASC notes MUST say "Tap ••• More → Unlock Premium."
- **Owed off-device (Jason):** ASC privacy label declares RevenueCat · marketing "100% private" alignment · the launch-FLIP value gate.

**📋 Device-QA ledger — verify on real hardware; web cannot cover these:**
- **🎯 ALL of Phase 3.5's device debt → `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 · §12 · §13.** That file is the runnable truth; this is the index. Highest value: **§11.15**, the iPad ring-origin invariant, which nothing automated can hold.
- **⭐ [SUB-AUDIT] Premium-accessibility:** VoiceOver rotor + a full walk · Dynamic Type AX3/AX5 reflow · reduce-motion · contrast both themes · focus order · touch targets. WCAG 2.2 AA is the FLOOR.
- **⭐ [SUB-AUDIT] Performance-feel:** 120fps ProMotion · Skia redraw cost · cold-start TTI · list jank · optimistic-UI feel. Includes the Today/cushion-forecast memoization check.
- **§3.1.2** SF Symbols on the min-iOS target (some are iOS-16+) · **§2.8** native scan (Vision autolink, OCR quality, camera permission) · **§2.11** RevenueCat real purchases + restore + offering marked current · **§3.3.1** the AHAP crescendo FEEL + celebration · **§VIS-2/B2** share on all three surfaces rasterizes fully · **§3.4** `expo-blur` real material + gesture touch + detent haptics · **§3.5** Live Activity / Dynamic Island / widgets / App Intents / App Group · **§3.6** iPad both orientations, Split View, Stage Manager, pointer/keyboard · **§VIS-6** sound + notification delivery.
- Native Skia render + draw-on motion on all surfaces · `boxShadow`+`overflow:hidden` native clip · `<Motion>`/`<CountUp>` native runtime.

---

## Deferred backlog

_Post-triage under the fold-don't-defer rule — only two carve-outs remain: **device-gated**, or **genuinely
a later version/tier**._

**Device-gated → the Phase-6 pass:** Today/cushion-forecast selector memoization *(conditional on a real
measured hotspot)* · Dynamic-Type device QA.

**Tooling / hygiene:**
- **⭐ Extend the Maestro lane to an iPad simulator** — `native-e2e.yml` boots iPhone only, so every iPad claim is verified by a human or not at all. Would take **four** items off the device's plate, incl. the ring-origin invariant that nothing guards. Wants batching with the next native build. **Strongest candidate once Wave A closes.**
- **⚠️ The gate still asserts the RETIRED demo-mode contract** — `runRegressionTests.ts:59` imports `testDemoModeSeed`, which asserts the Capacitor key `debtPlanner.isDemoMode` that `seedPlannerState.ts` writes. It passes (the legacy tree still exists) but it is a green test defending a feature the RN app no longer has, which reads as a live contract → delete with the Capacitor tree at **5.5.1**.
- **⚠️ `apps/rn/package-lock.json` is out of sync** — `npm ci` refuses it; both CI lanes work around it with `npm install`, so **installs are not reproducible.** Regenerate deliberately and re-run the full gate → before the Phase-5 cutover.
- **Simulator build recipe DUPLICATED** across `native-e2e.yml` and `app-preview.yml` (~60 lines of expensive native fixes) — extract a composite action → with the iPad lane.
- **No local pre-flight for the capture path** — a flagged web export + ~40-line check would have caught several CI cycles' worth of defects → with the above.
- **TWO screenshot mechanisms** — `tests/visual/*.cjs` (root, by hand) and `apps/rn/tests/shots/` (config-driven). The root set's stale frames masked the sandbox theme defect → remove at 5.5.1.

**Genuinely a later version / tier:**
- **⚠️ `Slider` reports no value on WEB** — react-native-web drops `accessibilityValue`; `a11y-axe` does not flag it. Web-only, so it matters the moment **3.5.7's embed** ships.
- **`typicalAmount` still has no UI** — same shape as A9's defect but far smaller impact → the wording/cohesion gate.
- **The app never shows a debt-free date reflecting its own plan working** — on day one the starter EF absorbs the surplus, so every projected date is minimums-only. Honest per screen; the question is the app-wide effect → the cohesion audit, not a defect.
- **The demo's beat dwell may be too short for the runner** — decide from the 2fps contact sheet.
- **Apple Watch** → v1.8+ · **`@gorhom/bottom-sheet`** → v1.8 Android · **Behavioral mis-entry / persistent-cushion / bill-shock autopilot** → Connected/Plaid tier · **Holiday/promo free-trial** → a reversible later lever, launch is paywall-from-day-1 · **iOS-18 Control Center** [D1] *(rec: stay deferred)* · **web light-mode hover screenshots** *(a QA artifact, not product)*.

---

## Decisions

- **Re-scope to "The Elevation" ✅ (2026-07-20)** — design-first, best-in-class.
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel.
- **Revenue spine ✅ (2026-07-25)** — Monthly $4.99 · Annual $29.99 · Lifetime $79.99 (excludes Connected/Ava). **NO free trial.** Reuses the existing RevenueCat project — v1.6 subs must restore.
- **Phase-3 scope ✅ (2026-07-27)** — pull EVERYTHING into v1.7 unless it genuinely can't ship. Analytics OUT of the core (privacy moat), but the 3.5 demo re-opened it → D-A wires a privacy-first funnel seam.
- **Executive "fix everything, no backlog" ✅ (2026-07-29/30)** — fold every audit finding now; only hardware verification waits for Phase 6.
- **[D22] ✅ (2026-08-10)** — **the debt/expense split is CORRECT and stays** (terminating vs perpetual); the defect is naming + entry. **[D22a]** the single-entry chooser fully replaces the per-section Adds · **[D22b]** the mis-file detector runs retroactively at rollout · **[D22c]** it surfaces, never silently re-files · **[D22d]** the Guardian's "bills" vernacular → the wording/voice gate. → 3.7.A10.
- **[D21] ✅ (2026-08-10)** — **the demo SHIPS to users again, reversing [D19].** Demo = before you commit (Welcome + paywall); walkthrough = after onboarding, on your own money. It no longer rides `QA_TOOLS`.
- **⛔ [D19] REVERSED (2026-08-06 → 2026-08-10)** — it pulled the demo's entries as a duplicate of the walkthrough, and the rebuild it ordered (3.5.4.11) repaired that premise the same day. Superseded by [D21].
- **[D20] capture pipeline ✅ (2026-08-06)** — Maestro drives · `simctl` records · ffmpeg conforms. `maestro record` rejected.
- **[E4] ✅ (2026-08-08)** — an upgrader is offered the FINALE alone, not a replay of the arc.
- **3.5.7 sequencing ✅ (2026-08-10)** — built after Phase 3.7. Hosting + privacy specifics still open.
- **Legacy gate RETIRED ✅ (2026-07-24)** — `validate:release` → the RN gate.

**Open:** [D1] Control Center · [D2] `minimumPaidThisCycle` ownership · [D3] Money hero language · [D4] *when* to rename the app · 3.5.7 hosting + privacy.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
