# Android Readiness Audit

_Assessment of what it takes to ship the app on Android. Part of the [Implementation Plan](IMPLEMENTATION_PLAN.md). Android build is slated for v1.8 — see [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md)._

_Last updated: 2026-06-29._

---

## TL;DR

The web app is effectively free to ship on Android — it's a static export (`output: "export"`) and Capacitor serves the **same `out/` bundle** to both platforms. The real work is: one critical code fix (RevenueCat per-platform key), CI/Gradle wiring, native plugin verification, and Google Play Console / billing setup that is mostly **waiting on external accounts**.

Groundwork already in place:
- `@capacitor/android@8.3.4` is installed (project never initialized).
- [codemagic.yaml](../codemagic.yaml) is half-wired for Android — workflow is named `ios-android-release`, decodes an Android keystore (`CM_KEYSTORE_BASE64`), and already lists `.apk`/`.aab` artifact paths.
- Static export means **zero web-side work**.

---

## 1. Code-level blockers (Android won't work correctly until these are fixed)

| # | Issue | Location | Detail |
|---|-------|----------|--------|
| **B1** | **RevenueCat key is Apple-only** | `lib/subscription/revenueCat.ts:3` | `REVENUECAT_API_KEY = "appl_..."` is hardcoded. Android needs the **`goog_...`** key. There is no `Capacitor.getPlatform()` branch anywhere in the codebase. Until this selects the key per-platform, IAP/subscriptions are completely broken on Android. **Single most important code fix.** |
| **B2** | **Notification icon asset doesn't exist** | `capacitor.config.ts` | `smallIcon: "ic_stat_icon_config_sample"` is the literal placeholder from Capacitor's docs — no matching drawable exists. Android notifications need a real monochrome `res/drawable` asset or they render broken/default. (Harmless on iOS.) |
| **B3** | **Offerings unconfigured for Google Play** | `lib/subscription/revenueCat.ts:109` | The `"premium"` entitlement ID is cross-platform OK, but `getOfferings()` returns nothing on Android until Google Play products are created and mapped in the RevenueCat dashboard — so `getMonthlyPackage()` throws. |

## 2. Native project + CI gaps

- **No `/android` directory** — needs `npx cap add android`.
- **No Gradle signing config** — the keystore is decoded in CI (`codemagic.yaml`) but the generated `build.gradle` won't reference it. Needs a `signingConfigs` block reading keystore path/passwords from env.
- **No Gradle build step** — `codemagic.yaml` never runs `./gradlew bundleRelease`. Despite the workflow name, it builds iOS only today.
- **No Google Play publishing** — `publishing:` has only `app_store_connect`; needs a `google_play` block + service-account JSON credential.
- **App icons / splash** — `@capacitor/assets` is installed; needs an Android generation pass.

## 3. External / account dependencies (the real long poles — not code)

- **Google Play Console account** — $25 one-time + identity/D-U-N-S verification that can take **days to weeks**. Start first; it gates everything.
- **RevenueCat ↔ Google Play Billing** — link the Play service account, create products, build an Android offering.
- **Play Console policy requirements** — data-safety form, privacy policy URL, target SDK compliance, content rating. Finance apps get extra scrutiny.

## 4. Plugin verification matrix

| Plugin | Risk | What to verify |
|--------|------|----------------|
| RevenueCat | 🔴 High | Per-platform key (B1), Google Play products, restore flow |
| LocalNotifications | 🟡 Med | Real `smallIcon` drawable (B2), Android 13+ runtime notification permission |
| Biometric (`@aparajita`, used in `lib/hooks/useAppLock.ts`) | 🟡 Med | Maps to `androidx.biometric`; verify fingerprint/face flow + fallback |
| In-app review | 🟢 Low | Google Play's review quota is stricter than Apple's |
| Back button | 🟡 Med | No iOS equivalent — verify hardware/gesture back doesn't exit app from a modal |
| StatusBar / Haptics / App | 🟢 Low | Cross-platform; spot-check |

## 5. Testing strategy — Maestro (no physical device)

**Current gap:** Playwright tests the **web bundle in a browser** — it never touches the native shell, so it can't see any Android-specific risk above (back button, biometric prompt, notification permission, IAP sheet). This gap exists on **iOS today too**.

**Maestro fits exactly here:** drives the *actual installed app* on an **Android emulator** (and iOS simulator) — no physical device needed, runs headless in Codemagic CI.

Recommended shape:
- **Smoke flows** (`.maestro/*.yaml`): launch → onboarding → add a debt → see the plan → open paywall → toggle app lock — the flows where the native↔web boundary breaks.
- **Run on Android emulator in CI** as a gate before the Play upload step; also on iOS simulator for parallel native smoke coverage not present today.
- **Keep Playwright** for fast web-logic/visual regression; **Maestro** for native-shell smoke. Complementary, not redundant.
- **Caveat:** IAP purchases can't truly complete in CI — gate the paywall flow at "sheet appears," and keep `NEXT_PUBLIC_BYPASS_REVENUECAT` for emulator runs.

## 6. Recommended sequence (when building)

1. **Kick off Google Play Console signup early** — slowest gate (§3).
2. Fix **B1 + B2** (per-platform key, real notification icon) — small, do before generating.
3. `npx cap add android`, build/run on emulator locally.
4. Stand up **Maestro** smoke flows against the emulator.
5. Wire Gradle signing + `./gradlew bundleRelease` + `google_play` publish into `codemagic.yaml`.
6. RevenueCat Google Play products → verify full purchase/restore path.
7. Plugin verification pass (§4) via Maestro + manual emulator checks.

---

## Timing dependencies (why placement matters)

Android has two upstream dependencies in the current roadmap that argue for it landing **after v1.7**, not before:

- **v1.7 ships the 3-tier subscription model.** Configuring Google Play billing products before v1.7 means setting up single-tier products, then reconfiguring for 3 tiers immediately after. Doing Android after v1.7 sets up Play billing **once**, for the final tier structure.
- **v1.7 adds analytics + crash reporting (Sentry).** Launching a brand-new platform — where native surprises are most likely — **without** crash reporting is flying blind. Crash reporting should precede the Android launch.

These make v1.8 a well-placed slot for the **build itself**. The caveats: start external accounts (§3) early regardless, and consider splitting the accessibility audit out of v1.8 so Android isn't competing with a second Large effort in one version.
