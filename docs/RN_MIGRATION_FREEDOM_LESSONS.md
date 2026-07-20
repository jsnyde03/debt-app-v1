# RN migration — Freedom v1.0 lessons carry-through checklist

_Created 2026-07-20 (Jason's directive). FinancialFreedom shipped v1.0 on the same RN/Expo stack **first**, so its device-QA bugs are pre-emptable lessons for Debt's Capacitor→RN rebuild (v1.7). Each item below is a real Freedom fix (commit/doc cited). **Status** = where Debt stands. This is a required lens in **D.5 (gap analysis)**, **D.6 (mobile polish)**, and the **Phase E device QA** — the device-only items can't be closed until a real build exists._

**Status legend:** ✅ fixed/safe in Debt now · 🔍 device-QA check (write correct, verify on device) · ⏭️ threaded to a later phase.

## Highest-recurrence (device-only crash/dead-end classes)

1. **Platform-split `.native`/`.web` re-export gap** (Freedom `00506e6`) — a split file overriding one export drops all sibling exports on that platform → `undefined is not a function`, invisible to tsc + web-e2e. **Debt ✅:** splits use `foo.ts`(native)+`foo.web.ts`(web); audited pairs export matching surfaces — `createAdapter`, `notifications`, `app-lock`. Also verify `use-color-scheme` pair at B.9.8. ([[feedback_platform_split_reexport_gap]])
2. **Self-referential re-export in a `.native` file** → infinite recursion (Freedom `2c93f99`). **Debt ✅:** convention is `foo.ts`+`foo.web.ts` (base serves native), no `.native` re-exporting its own base; shared consts live in non-split modules.
3. **Native module constructed in render / at module-load** → uncatchable crash (Freedom `6be8cb2`). **Debt ✅:** `createMMKV()` runs inside `createStorageAdapter()` (called from a `useEffect`), never in render/module scope; notifications/app-lock native calls live inside async fns. _`setNotificationHandler` at module top is JS-only (stores a callback) — acceptable._
4. **AppState handler calling throwing code unguarded** → uncatchable SIGABRT (Freedom `00506e6`). **Debt ✅:** both AppState handlers (persistence flush in `_layout`, re-lock in `use-app-lock`) are wrapped in try/catch.
5. **`crypto.getRandomValues`/UUID crash on FRESH install only** (Freedom `de83447`) — polyfill must load before Expo Router evaluates routes/store. **Debt ✅ + ⏭️:** added `react-native-get-random-values` in `index.js` before `expo-router/entry`. ⚠️ `packages/core/imports/debtCsv.ts` still calls `crypto.randomUUID()` (Hermes-undefined; shim only provides `getRandomValues`) — not at init, but fix (swap to a `getRandomValues`-based uuid) **when CSV import is wired into RN** → D.5. ([[feedback_native_module_verification_gap]])
6. **Reset-before-dismiss orphans the pushed screen** (Freedom `68677ee`) — a destructive action that flips the `Stack.Protected` guard while a screen is pushed strands the back stack. **Debt ✅:** More→Delete-All now `router.back()` FIRST, then `reset()` via `InteractionManager.runAfterInteractions`. 🔍 verify on device.
7. **`router.navigate`/push across the tab-group boundary** → detached/blank tab group (Freedom `6a41c1f`). **Debt ✅:** added `use-go-to-tab` (tab-navigator `jumpTo`); the two `/bills` CTAs (Plan no-debts, Payoff empty) now use it. Drill-in routes keep `router.push`. 🔍 verify on device.
8. **bottom-tabs `animation:'fade'` on New Arch** → intermittent black tab screens (Freedom `01fb431`). **Debt ✅:** `(tabs)/_layout` sets no tab animation (comment already cites Freedom).

## iOS keyboard reality (device ship-blockers)

9. **decimal-pad keyboard covers the footer CTA** → screen un-advanceable (Freedom `bc7a786`, was a ship-blocker). **Debt ✅:** `Screen` scaffold already had `KeyboardAvoidingView`; added it to `OnboardingLayout` + `FormSheet` (both had sticky submits below the keyboard). 🔍 verify on device across onboarding + every entity sheet.
10. **numeric field commits only on blur** → decimal-pad can't blur → "nothing updates" (Freedom `5d7d490`). **Debt ✅:** all forms commit via `onChangeText` (as-you-type), never blur-only.
11. **hand-rolled PanResponder slider jumpy on device** (Freedom `96f0193`). **Debt ✅ (N/A):** no custom sliders today. ⏭️ if D.6 adds one, use `@react-native-community/slider`, not PanResponder.

## Signing / entitlements (native build)

12. **Widget shipped with no App Group entitlement** (Freedom `b908781`). **Debt ⏭️ N/A:** no widget in v1.7 (later version).
13. **Widget/extension signing** — separate signing target · pin archive to `generic/platform=iOS` · **strip the Push entitlement for local-only notifications** (Freedom `WIDGET_SIGNING_SETUP.md`). **Debt 🔍/⏭️:** #13.3 applies now — notifications are local-only, so strip `aps-environment` (B.9.8 config). Any capability add ⇒ **regenerate provisioning profiles** ([[feedback_regenerate_profiles_on_capability_change]]). Codemagic pipeline for `apps/rn` = Phase D/E.
14. **Sentry SDK too old for RN 0.85/New-Arch** → idle SIGABRT + wrong-project delivery (Freedom `8bb58a9`). **Debt ⏭️ Phase C.3:** when adding Sentry, use ≥8.18, disable auto-session/app-hang/watchdog for New Arch, verify the DSN project.

## Theming / data-safety / hygiene

15. **MaterialIcons fallback map used underscores vs hyphenated glyph names** → "?" glyphs (Freedom `b89eaf2`). **Debt ✅:** all icon names are hyphenated (tsc validates against `glyphMap`). 🔍 keep hyphenated in the B.9.5 SF-Symbols fallback map.
16. **Two screens derive the same answer differently** → contradictory numbers (Freedom `f7eadbf`). **Debt ✅ (watch):** Plan hero uses one `selectPlanSummary`; no known duplication. Covered by the D.5 cross-screen-consistency criterion.
17. **Non-defensive `importStore` bricks on old-schema restore** (Freedom `6a41c1f`). **Debt ⏭️ D.5 / Phase C-D:** B.8 import runs `runMigrations` (merges onto defaults, throws on non-object) — partial guard. Harden `importStore` to reject plan-less/garbage + add boot fallback when iCloud restore + the data bridge land.
18. **Unused heavy native libs still compiled** (Skia/victory/FlashList) (Freedom `3607615`). **Debt ✅:** `apps/rn` deps are lean (chart uses `react-native-svg`); prune anything unimported at the release gate.

## Not evidenced but unproven — explicit device checks (D.6/E)
- **Safe-area / notch / Dynamic Island / home-indicator:** no Freedom bug recorded, but not proven handled. Explicit device check across SE → Pro Max → iPad in D.6.

## Top 3 to hold in mind for every remaining RN screen
1. Never touch a native module in render/module-load or an unguarded AppState/lifecycle callback (#3, #4); construct lazily inside try/catch.
2. Switch tabs via `use-go-to-tab` (jumpTo), drill in with `router.push`; dismiss before flipping any `Stack.Protected` guard (#6, #7).
3. Every numeric-input screen needs `KeyboardAvoidingView` + as-you-type commit (#9, #10).
