# Lens 04 — Web-route / platform-split integrity + new-native-addition & CI risk

**VERDICT: FINDINGS: 4** (1 blocker-class CI risk · 1 major latent trap · 2 minor). No current web-blanking defect — all split pairs export-parity-clean and every native lookup is lazy. The blocker is a CI-timing gap, not a code gap.

---

## Findings

### W1 — Sentry plugin is armed for the NEXT Codemagic build, but the CI care is deferred to Phase 6 — SEVERITY: BLOCKER (build-breaker risk)
- **Where:** `apps/rn/app.json:38` (bare `"@sentry/react-native"` plugin) + `codemagic.yaml` `environment:` block (lines 29–39 — no `SENTRY_AUTH_TOKEN`, no `SENTRY_DISABLE_AUTO_UPLOAD`).
- **Defect:** `expo prebuild` on the CM runner now wires the Sentry Xcode phases (sentry-cli wraps the "Bundle React Native code and images" phase + adds an "Upload Debug Symbols to Sentry" phase). With no auth token and no disable flag, the release-archive upload step errors → `Command PhaseScriptExecution failed` is the widely-hit failure mode. The plan (`DEBT_ELEVATION_PLAN.md:225`) correctly names the fix (`SENTRY_DISABLE_AUTO_UPLOAD`) but parks it at **Phase 6** — while the **"signed CM device build for all-of-3.5-so-far" is queued to trigger NOW**, before Phase 6. The deferral is mis-timed relative to the build cadence.
- **Failure scenario:** the next manual `debt-planner-rn` Codemagic run fails in `Build iOS IPA`, burning a mac_mini_m2 hour-slot ([[feedback_conserve_codemagic_minutes]]) and stalling the 3.5 device-QA gate.
- **Fix (one line, do before triggering):** add to `codemagic.yaml` → `environment:` → `vars:`: `SENTRY_DISABLE_AUTO_UPLOAD: "true"`. At Phase 6 flip-on, replace with `SENTRY_AUTH_TOKEN` (+ org/project plugin props) per the existing plan bullet.
- **Note:** the xcodeproj-glob half of this risk is already mitigated — `codemagic.yaml:71` scopes `xcode-project use-profiles --project ios/DebtPlannerRN.xcodeproj --warn-only`, and the Sentry plugin adds no `.xcodeproj`. Verified safe.

### W2 — Metro alias resolver pulls `.native.ts` into the WEB bundle (latent trap; currently harmless) — SEVERITY: MAJOR (latent web-blanking vector, verified safe today)
- **Where:** `apps/rn/metro.config.js:47` — `resolveWithExts` builds `platformTags = platform ? [platform, "native"] : []` for `@/` + `@core/` imports on **every** platform, including web. Metro's own web resolution sets `preferNativePlatform=false` and skips `.native`; this custom resolver does not.
- **Defect:** any aliased import of a `.native`-split module on web resolves the `.native` file, not the base no-op. Concretely: `apps/rn/src/components/more/LiveActivityQA.tsx:6` imports `@/liveActivity/liveActivityBridge` → web bundles `liveActivityBridge.native.ts`, directly contradicting that file's own comment ("Metro web picks the no-op base"). This is the exact mechanism behind the historical "/more went blank" incident.
- **Today it is safe — verified:** all three `.native.ts` files (`liveActivityBridge.native.ts`, `pendingActionBridge.native.ts`, `widgetStorage.native.ts`) have zero import-time native touch (lazy `requireNativeModule`, lazy `require('@bacons/apple-targets')`, every call try/caught + `Platform.OS==='ios'` gated), and the `route-smoke` Playwright gate covers the routes. No current crash.
- **Failure scenario (future):** the next `.native.ts` someone writes with a top-level native touch, imported via `@/…`, hard-crashes a web route chunk — the twice-shipped blank-screen class this lens exists for. The convention currently survives on discipline alone.
- **Fix:** in `resolveWithExts`, exclude the `native` tag on web — e.g. `const platformTags = platform ? (platform === "web" ? [platform] : [platform, "native"]) : [];` — so aliased resolution mirrors Metro's real platform behavior and the base no-ops actually serve web. Low-risk (base siblings exist for all three); re-run the RN e2e suite after.

### W3 — bare `expo-audio` plugin adds an unused microphone permission string — SEVERITY: MINOR (App-Review / privacy-audit hygiene)
- **Where:** `apps/rn/app.json:44` (`"expo-audio"` with no options).
- **Defect:** the expo-audio config plugin defaults to inserting `NSMicrophoneUsageDescription` ("Allow $(PRODUCT_NAME) to access your microphone") into Info.plist. Debt only *plays* the opt-in chime (`debtFreeSound.ts`); it never records.
- **Failure scenario:** an unused mic-permission string invites App Review questions and contradicts the Phase-6 privacy/data-flow audit's "nothing leaves the device" story surface (`DEBT_ELEVATION_PLAN.md:227`).
- **Fix:** `["expo-audio", { "microphonePermission": false }]`; confirm the key is absent from the generated Info.plist on the next prebuild.

### W4 — `RISK_NOTIFICATION` copy drift between the native module and its web stub — SEVERITY: MINOR (no runtime impact today)
- **Where:** `apps/rn/src/notifications/notifications.ts:65-70` (house-voice copy, updated 3.1.4) vs `notifications.web.ts:9-12` (stale pre-3.1.4 copy).
- **Defect:** export *surface* matches, but the exported constant's *value* diverged. Currently harmless — `RISK_NOTIFICATION` is only consumed inside the native scheduler (`notifications.ts:156`), never rendered — but any future in-app rendering of it would show stale copy on web only.
- **Fix:** copy the native strings into the web stub (or move the constant to a shared non-split file, the `widgetKeys.ts` pattern).

---

## Verified safe (CHECK 1 — web-route / platform-split integrity)

- **Export parity, all five pairs ✅:** `share-card` (`shareDebtCard`) · `debtFreeSound` (`playDebtFreeSound`) · `sentry` (`initErrorReporting`, `wrapRoot`) · `notifications` (full surface incl. the NEW `registerNotificationCategories`, `addNotificationResponseListener`, `NOTIF_CATEGORY_PAYDAY/RISK/BILLS`) · `MeshGradientCanvas`. No missing/mismatched exports ([[feedback_platform_split_reexport_gap]] holds).
- **3.6.6 lazy-native invariant ✅:** whole-src grep — every `requireNativeModule`/`requireNativeViewManager` is inside a function (`motion/haptics.ts:21` FinaleHaptics: lazy + iOS-gated + try/caught with crescendo fallback · `lib/scan.ts:13` · both LiveActivity bridges · `KeyCommandListener.ios.tsx:31`). Zero module-scope native touches.
- **No `.native.tsx` component splits ✅:** only three `.native.ts` logic files exist; all components follow `.ios.tsx`+base (`AppIcon`, `RowContextMenu`, `KeyCommandListener`) or `.web`+base.
- **`_layout.tsx` web-safe ✅:** module-scope `initErrorReporting()` (line 46) + `wrapRoot` (136) resolve to `sentry.web.ts` no-ops; the notification listener/categories (71, 66) resolve to `notifications.web.ts` no-ops; `KeyCommandListener` base returns null. `route-smoke.spec.ts` e2e gate present as the blank-screen tripwire.
- **Mesh web loader ✅:** `MeshGradientCanvas.web.tsx` mirrors the proven `JourneyRingCanvas.web.tsx` pattern (`WithSkiaWeb` + `componentProps` + `locateFile → /canvaskit.wasm`); `MeshGradientChart` has the required default export; `scripts/copy-canvaskit.mjs` runs on postinstall/prestart/preweb/pre-export; `fallback={null}` is safe (the finale's LinearGradient base shows through).

## Verified safe / CI-owed (CHECK 2 — new native additions)

- **`modules/finale-haptics` ✅ structure:** byte-for-byte template match with the device-proven `modules/scan-vision` (`expo-module.config.json` platforms:["ios"] + podspec with `ExpoModulesCore` dep, `static_framework`, `DEFINES_MODULE` + Swift module). Swift is fully guarded (`supportsHaptics` + try/catch; a haptics failure can never crash the finale). CoreHaptics is a system framework — no extra pod. **CI-owed:** first compile of `FinaleHapticsModule.swift` on the next CM build; **device-owed:** the crescendo FEEL (simulator has no haptics) — Phase 6.
- **`react-native-view-shot` 5.1.0 / `expo-audio` / `@sentry/react-native` 8.18.0 ✅:** all in `apps/rn/package.json`; standard pod autolink, no missing config plugins (sentry + expo-audio plugins present in app.json; view-shot needs none). **Device-owed:** off-screen ShareCard capture correctness (view-shot on a non-visible view), chime playback, Sentry capture-verify once the DSN lands (Phase 6).
- **Chime asset ✅:** `apps/rn/assets/sounds/debt-free-chime.wav` exists; `require('../../assets/sounds/…')` from `src/utils` resolves; `metro.config.js` does not touch `assetExts` and Expo's Metro defaults include `wav` → bundles natively.
- **Signing/glob gotcha ✅ mitigated:** `codemagic.yaml:69-71` fetches both bundle-id profiles and scopes `use-profiles` to `ios/DebtPlannerRN.xcodeproj --warn-only`.

## Phase-6 watch ledger (device/CI-owed, not defects)
1. FinaleHaptics compile on first CM build → then feel-tune on hardware.
2. ShareCard `captureRef` output on device (off-screen render).
3. Chime playback via expo-audio on device (incl. silent-switch behavior).
4. Sentry: DSN + `SENTRY_AUTH_TOKEN` + capture-verify (after W1's disable-flag stopgap).
5. Interactive notification categories/action buttons — real-device only.
