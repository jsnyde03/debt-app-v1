# Debt Planner — Premium Motion Tooling Selection (2026-07-20)

Technical selection of the motion/animation/haptics stack for the Debt Planner RN (Expo) app as it is
elevated to best-in-class. Founder directive: *"don't skimp — if there's a tool that gives premium
motion, lean into it, and think about how it helps expand the app in the future."* Every compatibility
and capability claim below is grounded in current (2025–2026) sources, cited inline.

## Target stack (verified against the repo)

From `apps/rn/package.json` + `app.json`:

- **Expo SDK ~56.0.14** · **React Native 0.85.3** · **React 19.2.3** · **New Architecture ON** (`newArchEnabled: true`).
  SDK 55+ made New Arch mandatory with **no opt-out**, and RN 0.82+ permanently removed the legacy
  (Paper/Bridge) architecture — so on this stack *every* native lib necessarily runs under Fabric/TurboModules
  (natively or via the Fabric interop layer). [1][2]
- Already installed: `react-native-gesture-handler ~2.31.1`, `react-native-screens 4.25.2`,
  `react-native-svg 15.15.4`, `react-native-safe-area-context ~5.7.0`, `react-native-mmkv ^4.3.2`,
  `expo-symbols ~56.0.6`, `expo-router ~56.2.15`, `zustand ^5.0.14`.
- **NOT installed:** any Reanimated / Moti / Skia / Rive / Lottie / haptics.
- `apps/rn/src/theme/motion.ts` already defines the `spring` (`default`/`snappy`/`gentle`/`bouncy`) and
  `duration` tokens the screens will animate against. **These are the contract — build on them, don't replace.**
  The file's own header already anticipates "Reanimated arrives at B.8."
- **Portfolio:** sibling app **FinancialFreedom** already ships `react-native-reanimated ~4.3` + `expo-haptics`
  on the shared RN/Expo spine. A shared motion foundation (one mental model, shared primitives) is a real win.

---

## Per-library verdicts

### 1. `react-native-reanimated` — ✅ ADOPT (the foundation)

- **Compat:** Reanimated **4.3.x–4.6.x all support RN 0.85**; newest stable pairing is **4.6.x + `react-native-worklets` 0.12.x**, and the **4.3.x** floor pairs with worklets **0.8.x**. Reanimated 4 **only** runs on the New Architecture — which is exactly this stack. [3] AniUI's SDK-56 matrix explicitly validates "React 19.2.3 / RN 0.85.3 / Reanimated 4.3." [1]
- **Peer dep gotcha:** Reanimated 4 requires `react-native-worklets` installed at the matching version (it is a hard dependency, not bundled). [3]
- **Perf caveat (must mitigate):** on RN 0.85, *importing* Reanimated raises app memory **~25–30%** even if unused, due to a Hermes change in 0.85. Mitigation: enable **worklets bundle mode**. [1]
- **Capability:** the UI-thread animation engine — count-ups, progress-ring fills, list entrance/stagger, press feedback, sheet/modal/shared transitions, gesture-driven motion, and `AnimatedProps` to drive `react-native-svg` (already installed) for ring fills. Ships `LayoutAnimation` + `entering/exiting` presets and a first-class **`useReducedMotion()`** hook for the required Reduce-Motion fallbacks.
- **Future value:** the substrate everything else layers on; gesture-driven interactions, drag-to-reorder debts, parallax, shared-element navigation later.
- **Portfolio:** **aligns with Freedom** (already on ~4.3). Recommend adopting the **same 4.x line** for a shared primitives layer.
- **Version line:** `react-native-reanimated@~4.6.0` + `react-native-worklets@~0.12.0` (or match Freedom at `~4.3` + worklets `~0.8` if strict parity is preferred — see risks).

### 2. `react-native-gesture-handler` — ✅ ALREADY HAVE

- `~2.31.1` installed; New-Arch ready and the standard partner to Reanimated for press/drag/swipe gestures. No action beyond wiring the root `GestureHandlerRootView`. Enables swipe-to-act rows, drag-reorder, pull gestures later.

### 3. **Moti** — ⚠️ DO NOT ADOPT as core (stale vs Reanimated 4)

- **Compat:** latest **0.30.0, last published ~a year ago**, and it is **"powered by Reanimated 3."** The Reanimated-4 support issue (**#391**, opened Sep 2025) is **still open**, with reports that Moti animations "don't work well" after upgrading to Reanimated 4. [4][5]
- **Verdict:** its declarative ergonomics are lovely, but adopting a Reanimated-3-era layer on a Reanimated-4 / New-Arch / React-19 bleeding-edge stack is a **maintenance and correctness risk**, and it is *not* what Freedom standardized on. Skip it. If we want Moti-style declarative ergonomics, **build a thin in-house `<Motion>`/`useSpring` wrapper over Reanimated bound to our `motion.ts` tokens** — same DX, zero third-party lag, portfolio-shareable.

### 4. `@shopify/react-native-skia` — ✅ ADOPT (the GPU / custom-visual layer)

- **Compat:** actively released; latest **2.x (e.g. 2.7.0, published May 2026)**, New-Arch compatible, with an official Expo **`with-skia`** template and config plugin. Does **not** require Reanimated, but **integrates** with it (Skia values can be driven from Reanimated worklets for 60/120fps custom motion). [6][7]
- **Capability:** GPU-accelerated 2D canvas — gradient/glow progress rings, the balance-to-$0 spectacle, composed particle/cascade effects (the "freed payment cascades onto the next debt" beat), custom charts, shaders, generative/branded visuals. This is the layer that makes the celebration read as *premium and bespoke*, not canned.
- **Cost:** a native module (adds to the batched native build); larger binary than pure JS. Justified by the headline moments.
- **Future value — highest ceiling of the set:** best-in-class custom **charts/data-viz** (payoff curves, interest-saved area charts), branded generative art, a reusable **delight/illustration primitives library** shared across the portfolio, shader-based backgrounds, mascot/particle systems. This is the "expand the app in the future" lever.
- **Version line:** `@shopify/react-native-skia@~2.7.0` (via `npx expo install`, which pins the SDK-56-correct version).

### 5. **Rive** (`rive-react-native`) — ◻️ OPTIONAL / DEFER (designer-authored delight, when a designer exists)

- **Compat:** actively maintained — latest **v9.8.5 (Jul 17, 2026)**, with continuous iOS/Android runtime bumps. New-Arch status is **not called out in release notes**; the only explicit "not Fabric compatible yet" data point is a **stale 2023** issue. Because RN 0.82+ removed the legacy architecture entirely, a lib shipping actively for RN 0.85 must run under New Arch (at minimum via interop) — but this is **inference, not a documented guarantee**, so it **must be verified on a real device build** before committing. [8][9]
- **Capability:** designer-authored, **state-machine-driven** interactive vector animations with a tiny runtime; inputs/events let JS drive states (e.g. progress → animation state) and receive events back.
- **Cost:** native module; requires a **design workflow (Rive editor)** and a designer to author `.riv` files — we don't have that authoring pipeline today.
- **Future value:** a **mascot/character system**, interactive onboarding, responsive illustrations, a branded delight library reusable across the portfolio — genuinely powerful *once there's a designer producing `.riv` assets*.
- **Verdict:** **defer.** Skia covers the named v1 moments in-house without a designer dependency. Revisit Rive when a mascot/illustrated-onboarding initiative and a design resource exist. Keep it on the roadmap, not in this build.

### 6. **Lottie** (`lottie-react-native` / `@lottiefiles/dotlottie-react-native`) — ◻️ NOT NOW

- **Compat:** `@lottiefiles/dotlottie-react-native` is the more actively maintained option and ships a **Legacy Interop bridge** so the same component works on Paper and Fabric. [10]
- **Capability:** plays After-Effects–exported JSON animations. Great for *canned* illustrations sourced from designers/marketplaces.
- **Why not:** Lottie is **fire-and-play** — it cannot react to live app state (a running count-up, a ring driven by real progress, the payment-cascade choreography tied to actual numbers). Our spec is **data-driven, composed** motion, which is Reanimated+Skia's wheelhouse. Adopting Lottie would mean a native module earning its keep only for static decorative loops. **Skip for now**; reconsider only if we buy/commission specific canned illustrations and don't already have Rive.

### 7. `expo-haptics` — ✅ ADOPT (the haptics layer)

- **Compat:** first-party Expo module, available in SDK 56 (`npx expo install expo-haptics`); iOS Taptic engine, Android Vibrator, and web Vibration API (Safari support added in SDK 56). [11][12]
- **Capability:** `selection` / `impact(light|medium|heavy)` / `notification(success|warning|error)` for restrained system haptics, plus timed sequences for the **one bespoke payoff pattern**.
- **Portfolio:** **aligns with Freedom** (already ships `expo-haptics`). Same mental model, share a `haptics.ts` helper.
- **Version line:** `expo-haptics` (let `npx expo install` pin the SDK-56 version).

---

## Recommended layered stack (primary recommendation)

| Layer | Package | Version line | Role |
|---|---|---|---|
| **Foundation (engine)** | `react-native-reanimated` + `react-native-worklets` | `~4.6.0` + `~0.12.0` (or Freedom-parity `~4.3` + `~0.8`) | UI-thread animation engine; count-ups, ring fills (via SVG `AnimatedProps`), entrance/stagger, press, sheets, transitions; `useReducedMotion()` |
| **Gestures** | `react-native-gesture-handler` | `~2.31.1` (have) | Press/drag/swipe input for motion |
| **Ergonomic layer** | *in-house* `<Motion>` / `useSpring` over Reanimated, bound to `motion.ts` | n/a (own code) | Moti-style DX without Moti's Reanimated-3 lag; portfolio-shareable |
| **GPU / custom-visual** | `@shopify/react-native-skia` | `~2.7.0` | Gradient/glow rings, the $0 spectacle + payment-cascade, custom charts, generative/branded visuals |
| **Named celebration moments** | Skia (composed) + Reanimated (choreography/timing) + `expo-haptics` (the beat) | — | Band-milestone ring-pulse; debt-paid-off: ring completes → balance rolls to $0 → freed payment cascades to next debt |
| **Haptics** | `expo-haptics` | SDK-pinned | Restrained system haptics + one bespoke payoff pattern |
| **Deferred** | `rive-react-native` (designer-authored delight), Lottie (canned) | — | Revisit with a design pipeline / mascot initiative |

**Reasoning.** Reanimated is the non-negotiable foundation: it's the only New-Arch UI-thread engine, it drives the
already-installed `react-native-svg` for rings, it has native Reduce-Motion support, and **Freedom already runs it**
— so adopting it makes the portfolio share one motion model. Skia is the deliberate "don't skimp" investment: it is
what turns the debt-paid-off moment into a *composed, GPU, bespoke* spectacle (explicitly not confetti) and, more
importantly, **unlocks the biggest future surface** — best-in-class custom charts and a reusable branded-visual /
delight library across all three finance apps. We **reject Moti** (Reanimated-3-era, ~1yr stale, open RN4 issue) in
favor of a thin in-house declarative wrapper that gives the same ergonomics with zero third-party lag and binds
directly to `motion.ts`. Haptics via first-party `expo-haptics`, matching Freedom. Rive and Lottie are real tools
but solve a *designer-authored / canned* problem we don't have yet; they stay on the roadmap, not in this build.

**Future-expansion payoff.** The single biggest lever is **Skia** → a portfolio-wide custom data-viz + generative
delight library (payoff curves, interest-saved charts, branded backgrounds, particle/mascot systems). Reanimated +
Gesture Handler additionally open drag-reorder, swipe actions, and shared-element navigation later. Rive, when a
designer exists, adds an interactive mascot/onboarding character system reusable across apps.

**Portfolio-alignment call.** **Align with Freedom on Reanimated 4.x + expo-haptics** (shared foundation, shared
`motion.ts`/`haptics.ts` primitives). **Justifiably diverge / lead** by adding **Skia** here first for the
celebration + charts — if it proves out, it becomes a shared portfolio primitive Freedom can adopt too. Do **not**
follow Freedom into anything it lacks that we need; do add Skia as the portfolio's next shared layer.

---

## Risks & mitigations

1. **Reanimated memory regression on RN 0.85 (~25–30% on import).** Real, Hermes-driven. → Enable **worklets bundle
   mode**; verify memory on a device build. [1]
2. **Reanimated version vs Freedom.** Freedom is on `~4.3`; newest stable for 0.85 is `~4.6`. → Prefer `~4.6`
   (best 0.85 support) unless strict monorepo parity forces `~4.3`; either is 0.85-compatible per the matrix. Pin
   `react-native-worklets` to the **matching** row (4.6→0.12, 4.3→0.8) — mismatch is a common build break. [3]
3. **Tab-transition New-Arch black/blank-screen trap.** Setting an `animation` (`'shift'`/`'fade'`/`FadeTransition`)
   on the bottom-tab / Expo-Router `Tabs` navigator causes intermittent **blank/black screens** on New Arch — a race
   between `Animated` activity-state and `react-native-screens` when `detachInactiveScreens: true`. This is the exact
   class of bug the sibling app hit. → **Do not** put animation props on the tab navigator; animate *within* screens
   via Reanimated instead. If a tab transition is required, set **`detachInactiveScreens: false`** and test rapid
   tab-switching explicitly. [13][14][15]
4. **Rive New-Arch status is inferred, not documented.** → Keep Rive deferred; if adopted, **prove it on a real
   device build first** (per the native-module-verification lesson — browser/Expo-Go can't catch autolink/Fabric bugs).
5. **New native modules ⇒ batched native build.** Skia (and later Rive/Lottie) are native modules that need a
   fresh native build (Codemagic minutes) and can surface autolink/pod issues invisible to web/Expo-Go. → **Batch**
   Skia + haptics + Reanimated into **one** native build at the B.9 native-re-glue step; run the pre-commit native
   build pass; verify on TestFlight, not just web.
6. **Reduce-Motion coverage.** → Centralize on Reanimated's `useReducedMotion()`; every entrance degrades to a fade
   and every celebration to a static end-state; verify with the OS Reduce-Motion toggle in both themes.

---

## Sources

1. [Expo SDK 56 · AniUI (SDK-56 compat matrix, RN 0.85.3 / React 19.2.3 / Reanimated 4.3, memory caveat)](https://www.aniui.dev/docs/expo-56)
2. [React Native's New Architecture — Expo Documentation](https://docs.expo.dev/guides/new-architecture/)
3. [Compatibility table — React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/)
4. [moti — npm (0.30.0, "powered by Reanimated 3")](https://www.npmjs.com/package/moti)
5. [Expo 54 and Reanimated 4.1.0 support · Issue #391 · nandorojo/moti](https://github.com/nandorojo/moti/issues/391)
6. [@shopify/react-native-skia — npm](https://www.npmjs.com/package/@shopify/react-native-skia)
7. [@shopify/react-native-skia — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/skia/)
8. [Releases · rive-app/rive-react-native (v9.8.5, Jul 2026)](https://github.com/rive-app/rive-react-native/releases)
9. [Support for New RN architecture on Android · Issue #190 · rive-app/rive-react-native (stale 2023 "not Fabric compatible yet")](https://github.com/rive-app/rive-react-native/issues/190)
10. [@lottiefiles/dotlottie-react-native — npm (Legacy Interop bridge, Paper+Fabric)](https://www.npmjs.com/package/@lottiefiles/dotlottie-react-native)
11. [Haptics — Expo Documentation (SDK 56)](https://docs.expo.dev/versions/v56.0.0/sdk/haptics/)
12. [Expo SDK 56 — Expo Changelog](https://expo.dev/changelog/sdk-56)
13. [Using `animation` in BottomTabs sometimes renders blank screen · Issue #12755 · react-navigation/react-navigation](https://github.com/react-navigation/react-navigation/issues/12755)
14. [[SDK 54] Setting animation property on Tabs broke navigation · Issue #39587 · expo/expo](https://github.com/expo/expo/issues/39587)
15. [[SDK 54 Beta][expo-router] Tab Animation 'shift' Causes Blank Screen · Issue #39514 · expo/expo](https://github.com/expo/expo/issues/39514)
