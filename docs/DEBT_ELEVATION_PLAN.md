# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — 3.7 Wave A · engine correctness + honesty

🎯 **Jason 2026-08-11: "We need to finish 3.7 before moving on to Phase 4."** The Maestro lane (4.1) is
**paused mid-item**, not abandoned — state below.

| # | Step | State |
|---|---|---|
| **A.0** | ✅ **[D4] RENAMED 2026-08-11 — via `CFBundleDisplayName`, NOT `expo.name`.** ⚠️ Before-scan caught the coupling: `expo.name` **derives the Xcode project name**, and `DebtPlannerRN` is hardcoded **10× across three pipelines** incl. the signed Codemagic build. `CFBundleDisplayName: "Debt Planner"` flips the Home-Screen name and `\(.applicationName)` while leaving every pipeline intact. ⏳ **Effect is build-verified** — checklist §1 | |
| **A.1** | ✅ **DONE** — A1 closed (already fixed, `611a4fb`); A2 reproduced + fixed, gate 156/156 | |
| **A.2** | ✅ **DONE 2026-08-11** — A3's before-scan: **the ledger of nine is SEVEN.** A3.4 and A3.9 were already fixed on 2026-07-29, the day before the ledger was written. Per-item evidence → log | |
| **A.3** | ✅ **DONE 2026-08-11** — A4–A7 before-scan. ⛔ **A7 CLOSES** (confirmed: one engine, one funnel, no third producer) · ⛔ A6's dead re-export is already gone · ⚠️ live: A4 ×3 · A5 · A6a. Evidence → log | |
| **A.4** | ✅ **A3.1 DONE 2026-08-11** — the attestation is gated on whether attesting actually lowers the hold, not on the cycle count. Failing-then-passing test; gate **158/158**, zero `error-context.md`. ⏸ **A3.3 BLOCKED on [D24]** below | ◐ |
| **A.5** | **A3.5 · A3.8** — cheap correctness. A3.5's undo mechanism **already exists** on the other caller; surface it, don't build it | |
| **A.6** | **A3.6** — one cover offer, not two | |
| **A.7** | **A3.2** — ⚠️ **measure the figure first**, then write the copy. Currently a direction, not a number | |
| **A.8** | **[DECISION] A3.7** — an applied purchase reads as a deferrable bill. Coherent by rule; the question is whether it confuses a person. **Jason's call, not a silent fix** | |
| **A.9** | **A4 ×3 · A5 · A6a.** ⚡ After-scan: A6a is a **divergence** — `buildPayoffTrajectory` already carries `recurrence?`, so match the sibling. ⚠️ A5: **scope the gate first** — "RevenueCat hasn't answered yet" affects every premium surface on a cold offline launch, not just one row. ⚠️ A4a needs measuring before it earns work | |
| **A.10** | **A8.1–A8.3** — the Siri phrase *(gated on [D4]: every shortcut phrase contains the app name, so it can only shrink by shrinking the NAME)* | |

**Exit:** the honesty ledger is empty, A4–A7 are each closed or refuted **with evidence**, every fix has a
failing-then-passing test, gate green.

⚠️ **A0.4** (payoff-schedule device re-verify) and **A8.4** stay device-owed → the checklist.

---

### ⏭ Then, in order

1. **Wave B** — ⚠️ **B.0 = a before-scan FIRST, same as Wave A's.** B1–B4 are from the same 2026-07-30 era and have never been verified; **5 of 14 Wave A items did not survive contact with the code.** B2 ("dropped streak/milestone surfacing") is the likeliest already-built — `pendingMilestone` and `activeAck` both exist. Then B1 drag-the-curve · B2 · B3 greeting · B4 swipe-to-mark-paid *(needs [D2])*
2. **4.1 — the Maestro coverage lane ⏸ PAUSED at 4.1.3**, resumes after 3.7. ✅ 4.1.1 answered (6 capabilities proven) · ✅ 4.1.2 built (11 checks) · ⏳ 4.1.3's suite repair is **built but unverified — the native lane is RED until it lands.** Remaining 4.1.4–4.1.11 + the exit criterion → log
3. **3.5.7 — the marketing embed** *(🎯 needs hosting + the privacy stance)*
4. **The audit gate** — whole-app cohesion + best-in-class + wording/voice *(Wave C merges in here)*
5. **Phase 5** (data continuity, ship-blocker) → **5.5** (repo consolidation) → **Phase 6** (launch)

✅ **3.7.A10 — obligations: entry, naming, recovery. COMPLETE 2026-08-10** — the single Add chooser
replacing all six entry points, the retroactive mis-file detector + atomic conversion, Bills →
Expenses incl. onboarding's first-run fork, the section caption, both-theme frames. [D22]. Detail →
log 3.7.A10; the migration half → Phase 5.

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
| **3.7** | **Fold-in block (ledger clearance)** | **▶ ACTIVE — Wave A** (A1/A2/A9/A10 ✅) |
| — | Whole-app cohesion + best-in-class + wording audit gate | after 3.7 |
| 4 | Quality (test harness) | RS baseline; **4.1 ⏸ paused at 4.1.3** — 🎯 3.7 finishes first |
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
| 5 | **3.5.10 — the INTERACTIVE demo ✅ DONE 2026-08-11** | 🎯 **[D23]**: the demo is now two runs. **`explore`** (a user: live tabs, no script, exit on the marker row) · **`scripted`** (the App-Preview + 3.5.7's embed only). One artifact had been doing both jobs and the video's requirements won. ⚠️ `useInBoundedRun` was deliberately **not** forked — a separate `useNavigationHeld()` answers the other question. Gate 158/158. Log: 3.5.10 |
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
- ✅ **A1** BNPL payoff-rate undercount — **CLOSED, was already fixed** (`611a4fb`, three days before the item was written). ✅ **A2** sub-cycle obligation undercount — reproduced ($50 reserved where $200 was owed) and fixed.
- **A3 · Guardian honesty ledger — SEVEN live**, verified 2026-08-11: attestation gating · starter-EF "keeps it as cushion" · `selectTightTopUp` raids the EF · no-undo on the tight top-up · "hold your line" twice · applied purchase reads as deferrable **[DECISION]** · `GoalSheet` dedupe. ⛔ hero-vs-Guardian coherence and affordability density were **already fixed 2026-07-29**.
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
  - ⚠️ **[3.7.A.3 after-scan] `selectWhatIf*` bypasses the debt-free-date funnel** — it calls `projectDebtPayoff` directly rather than going through `selectDebtFreeDate`. Correct today (a deliberate alternate scenario), and a trap: **if the funnel ever gains a guard, a floor or a rounding rule, What-If silently will not have it.** Nothing to fix yet — check it here.
- [ ] **Best-in-class enhancement pass** — aspirational, app-wide: is each surface genuinely top-of-class, and what makes it unforgettable? Benchmark vs category leaders; restraint, not fireworks.
- [ ] **Wording / voice** — every user-facing string, both tiers, all states, against the house voice. Absorbs Wave C's copy items.
  - ⚠️ **[3.7.A3.1 after-scan] Sweep every Guardian affordance for a PROXY gate.** A3.1's defect class: an affordance that promises an **outcome** ("I'll hold a smaller safety net") was gated on a **proxy** (a cycle count), so it could promise and deliver zero. Check the siblings — `selectReserveRelease` · `selectReserveWalkback` · `selectRiskAcknowledgment` · `selectTrialConversion` · `selectGuardianProofOfWork` — for the same shape: **is each gated on the thing it claims, or on something that merely correlates with it?**

⚡ **Input from 3.5's phase after-scan — three defect classes to hunt at scale:** ① an assertion that
passes either way ② evidence cited but never committed ③ two records of one thing, drifting. All three are
**a claim kept somewhere other than where it is checked.**

_All three audits fan out on Fable 5._

---

## Phase 4 — Quality

- **4.1 — the Maestro coverage lane ⏸ PAUSED at 4.1.3** *(🎯 3.7 finishes first)*. 68 of the device checklist's 127 real checks onto the free GH-Actions sim lane. ⚠️ **The native lane is RED until 4.1.3's repair is verified** — the suite had been broken since 2026-08-10 and green-by-never-running. Audit: [`2026-08-11-maestro-coverage/`](audits/2026-08-11-maestro-coverage/README.md); step-by-step + the exit criterion → log.
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
- ✅ **SHIP-BLOCKER RETIRED 2026-08-11 (A.0)** — the Home-Screen name is **"Debt Planner"** via `ios.infoPlist.CFBundleDisplayName`. ⚠️ `expo.name` deliberately stays `"Debt Planner (RN)"`: it derives the Xcode project name, hardcoded 10× across three pipelines. ⛔ **The old wording said "Home Screen + App Store name" — the App Store name is set in App Store Connect and was never in this file.** ⏳ Confirm on the next build (checklist §1).
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
measured hotspot)* — ⚠️ **A3.1 added one extra allocation** on Today whenever the discovery hold is active
(the attestation counterfactual). Cheap, and the current store's allocation is already memoised, but it
belongs on this ledger · Dynamic-Type device QA.

**Tooling / hygiene:**
- ⛔ **PROMOTED 2026-08-11 → the active build (4.1.8).** *(Was: a supplemental Appium lane, filed as triggered-not-scheduled with a "NO for now" recommendation. 🎯 Jason reversed it the same day — "the more that we can prove with Appium/Maestro the better" — and the amortisation argument carried it: the lane outlives v1.7.)* → `audits/2026-08-11-maestro-coverage/` §7.
- ⛔ **PROMOTED 2026-08-11 → the active build (4.1).** *(Was: "extend the Maestro lane to an iPad simulator — would take **four** items off the device's plate." Measured 2026-08-11: the iPad boot alone carries six, and the whole lane carries 68 of 127. The "four" was a guess, and it undersold the item by an order of magnitude.)*
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
- **[D23] ✅ (2026-08-11)** — **the demo is TWO runs.** `explore` ships to users (navigable, no script, one exit); `scripted` is the App-Preview + embed vehicle and leaves the user-facing doors. Resolves one artifact serving two jobs with different requirements.
- **[D22] ✅ (2026-08-10)** — **the debt/expense split is CORRECT and stays** (terminating vs perpetual); the defect is naming + entry. **[D22a]** the single-entry chooser fully replaces the per-section Adds · **[D22b]** the mis-file detector runs retroactively at rollout · **[D22c]** it surfaces, never silently re-files · **[D22d]** the Guardian's "bills" vernacular → the wording/voice gate. → 3.7.A10.
- **[D21] ✅ (2026-08-10)** — **the demo SHIPS to users again, reversing [D19].** Demo = before you commit (Welcome + paywall); walkthrough = after onboarding, on your own money. It no longer rides `QA_TOOLS`.
- **⛔ [D19] REVERSED (2026-08-06 → 2026-08-10)** — it pulled the demo's entries as a duplicate of the walkthrough, and the rebuild it ordered (3.5.4.11) repaired that premise the same day. Superseded by [D21].
- **[D20] capture pipeline ✅ (2026-08-06)** — Maestro drives · `simctl` records · ffmpeg conforms. `maestro record` rejected.
- **[E4] ✅ (2026-08-08)** — an upgrader is offered the FINALE alone, not a replay of the arc.
- **3.5.7 sequencing ✅ (2026-08-10)** — built after Phase 3.7. Hosting + privacy specifics still open.
- **Legacy gate RETIRED ✅ (2026-07-24)** — `validate:release` → the RN gate.

- **[D24] ✅ (2026-08-11)** — the tight top-up prefers a **discretionary savings goal; the EF is the fallback, not the first pick, and the copy names it when it IS the EF.** "Never" would make the one-tap vanish for anyone whose only savings is the EF. The dishonesty was drawing on it *silently and first*. → **A3.3**
- **[D25] ✅ (2026-08-11)** — an applied purchase **keeps** its deferrable behaviour (a discretionary buy *should* be first to cut in a shortfall) but gets an **explicit category**, so it is a stated rule rather than an uncategorized fallthrough. → **A3.7**
- **[D2] ✅ (2026-08-11)** — **`minimumPaidThisCycle` is the owner** ("minimum covered"); `isPaidThisCycle` means paid in full. ⚠️ Fix `planSelectors.ts:136`, the one reader with **no** `?? isPaidThisCycle` fallback — it disagrees with the other four today. B4's swipe writes through `bulkMarkRequired`, not a third writer. → unblocks **B4**
- **[D3] ✅ (2026-08-11)** — the calm-micro-viz hero language **extends to Debts** (a paydown bar via the existing `HeroProgressBar`). Bare read as an omission next to Bills and Goals, on the page whose subject it is.
- **[D4] ✅ (2026-08-11)** — **rename NOW, before the next device build.** Every App Shortcut phrase contains `\(.applicationName)`, so A8's phrases cannot be finalised or device-tested until the name is final, and `app.json`'s "Debt Planner (RN)" is a Phase-6 ship blocker regardless. → new step **A.0**

- **[D1] ✅ (2026-08-11) — stays DEFERRED, on a new reason.** ⛔ The original reason (cost: the AppIntent machinery was unbuilt, ~4–5× the query-intent baseline) **has expired** — the widget extension, App Group, `DebtProvider` and an in-extension App Intent all exist now, so it is ~one Swift file plus an availability gate. It stays deferred because **there is no control-SHAPED job**: this app's actions are multi-step (log a payment needs a debt *and* an amount) or rare and dated (payday landed, already on the Live Activity), and a glance is a widget's job — which already ships. 🎯 **Revisit trigger: a genuine one-tap emerges during the build. B4 (swipe-to-mark-paid) is the likeliest source.**

**Open:** 3.5.7 hosting + privacy *(the only one left)*.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
