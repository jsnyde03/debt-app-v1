# R2-02 — Share enhancements (B2) + web/native integrity of the fold (ROUND 2 re-audit)

**Lens:** B2 share variants + web-route / platform-split / native integrity of commits `c3f2770` (share) and `fa16bfa` (W2 metro / W3 expo-audio).
**Method:** verified against actual code + a LIVE run — full `route-smoke` + `celebration` e2e (17/17 green), dist-bundle grep, and two custom Playwright DOM probes against the served export on :4319.

**VERDICT: FINDINGS: 4** — all LOW/INFO. No blockers; every core claim of the fold verified TRUE.

---

## What was verified CLEAN (evidence, not assumption)

1. **Web-route integrity ✅** — `route-smoke` 9/9 + `celebration` 8/8 (both themes) pass against the current dist. Dist freshness proven: the bundle contains all three new B2 strings ("your payday debt-payoff app", "on my way to debt-free", "freed toward the next one"). Live probes of `/` (beat open) and `/progress` (archive): **zero page errors** with both off-screen ShareCards mounted.
2. **Hooks rules ✅** — `VanquishedArchive.tsx:28` declares `useRef` BEFORE the `debts.length === 0` early return (line 29). `VanquishedBeat` has no early return; no conditional hooks introduced anywhere in the diff. `tsc --noEmit` clean.
3. **`shareDebtCard` wiring ✅** — both refs are `useRef<View>(null)` matching the native signature `RefObject<View | null>`; the web variant takes `_ref: unknown` so both typecheck. **`react-native-view-shot` is NOT in the web bundle**: grep of `dist/_expo/static/js/web/index-*.js` finds zero `view-shot` strings; the 6 `captureRef` hits are all RN VirtualizedList `this._captureRef` internals. Web fallback exercised live: clicking Share on the beat AND the archive fired the `window.alert` fallback with correct text ("I just vanquished Chase Freedom — $4,200…" / "I vanquished 2 debts ($4,520)…"), no errors.
4. **`.first()` scoping is legitimate TODAY ✅** — live DOM probe: beat's first `/Vanquished/i` match is the visible headline (x=128), the off-screen card is second (x=-9903); archive's first `/DEBTS VANQUISHED/i` match is the visible eyebrow "DEBTS VANQUISHED · 2" (x=41), off-screen "2 debts vanquished" second (x=-9937). The assertions do test the on-screen elements. (But see R2-W-02 — the scoping is order-dependent, not identity-dependent.)
5. **W2 metro ✅** — `platform === "web" ? ["web"] : [platform, "native"]` matches real Metro (`.native` is a native-only fallback tag). Android keeps `[android, "native"]` → all three `.native.ts` modules (`pendingActionBridge`, `liveActivityBridge`, `widgetStorage`) still resolve on Android, and **each has a base `.ts` counterpart**, so nothing relied on `.native` resolving on web. Export + all routes green post-change.
6. **ShareCard edge inputs ✅** — discriminated union is exhaustive (tsc-checked): `finale` omits the months stat when `monthsToFreedom == null`; `debt` renders "Paid off" when `amount == null` and hides the freed/mo line at `freedPerMonth <= 0`; `progress` hides the amount at `totalPaid <= 0` and handles the 1-debt singular. `debtsCleared: 0` is unreachable (archive early-returns null). No undefined access. `Button variant="secondary" onDark` is a real supported combo (Button.tsx forces the dark color set).
7. **W3 iOS half ✅** — `@expo/config-plugins` `applyPermissions` explicitly `delete`s `NSMicrophoneUsageDescription` on `false` (verified in `node_modules/@expo/config-plugins/build/ios/Permissions.js:28-30`), and the app's only expo-audio use is `createAudioPlayer` (playback, `debtFreeSound.ts`). The plugin option is valid.

---

## Findings

### R2-W-01 · LOW · a11y (web) — off-screen ShareCard is NOT hidden from web screen readers
- **File:** `apps/rn/src/components/plan/VanquishedBeat.tsx:131-137`, `apps/rn/src/components/progress/VanquishedArchive.tsx:76-82` (new in B2), `apps/rn/src/components/plan/PaidOffFinale.tsx:126-133` (pre-existing, same pattern)
- **Defect:** the wrappers use `accessibilityElementsHidden` (iOS-only) + `importantForAccessibility` (Android-only). Live DOM probe on the web export: **no `aria-hidden="true"` anywhere in the off-screen card's ancestor chain** — react-native-web does not map these props to `aria-hidden`.
- **Failure scenario:** a web screen-reader user on /progress hears the archive content twice ("DEBTS VANQUISHED · 2 … " then "2 debts vanquished … on my way to debt-free … Debt Planner · your payday debt-payoff app"); same duplication inside the beat modal. Shipping surface is native iOS (where the props DO work), so impact is confined to the web build.
- **Fix:** add `aria-hidden={true}` to all three off-screen wrappers — RN ≥0.71 maps it cross-platform (iOS `accessibilityElementsHidden`, Android `no-hide-descendants`, web `aria-hidden`); the two platform props can then be dropped.

### R2-W-02 · LOW · test-robustness — the two `.first()` e2e assertions are DOM-order-dependent, and the off-screen card counts as "visible" to Playwright
- **File:** `apps/rn/tests/e2e/celebration.spec.ts:48,93`
- **Defect:** probe confirmed the off-screen card at x=-9937 reports `isVisible() === true` (a positioned element with a bounding box is "visible" regardless of viewport). `.first()` currently resolves to the on-screen element only because it precedes the off-screen card in DOM order.
- **Failure scenario:** a regression that stops the VISIBLE eyebrow/headline rendering while the off-screen card still mounts → `.first()` silently resolves to the off-screen card → the test **passes against a broken visible UI** (exactly the masking this re-audit was asked to rule out — legitimate today, fragile tomorrow).
- **Fix:** make the locator identity-based, not order-based: archive → `getByText(/DEBTS VANQUISHED ·/)` (the ` · N` separator never appears in the ShareCard); beat → scope inside the modal card, e.g. `page.getByText('Keep going').locator('..')`-anchored or a testID on the visible headline.

### R2-W-03 · LOW · config (Android readiness) — W3 fixed only the iOS half; Android still gets `RECORD_AUDIO`
- **File:** `apps/rn/app.json:44-49`
- **Defect:** the expo-audio plugin's `recordAudioAndroid` option **defaults to `true`** (`node_modules/expo-audio/plugin/build/withAudio.js:8,26`), so while `microphonePermission: false` strips the iOS usage description, a prebuild for Android still injects `android.permission.RECORD_AUDIO` into the manifest — the same "unused sensitive permission" friction W3 set out to remove, on the platform in the readiness plan.
- **Failure scenario:** the Android build (per the 2026-07-07 Android readiness plan) ships a playback-only app declaring microphone-record permission → Play Console permission-declaration friction / user distrust, rediscovered late.
- **Fix:** `["expo-audio", { "microphonePermission": false, "recordAudioAndroid": false }]`.

### R2-W-04 · INFO · device-ledger — B2 added 2 structurally NOVEL capture contexts the device ledger/checklist doesn't itemize
- **File:** `docs/DEBT_3.5_DEVICE_QA_CHECKLIST.md` (no share item at all); round-1 ledger (`04-web-native-integrity.md:47,53`) predates B2 and says only "ShareCard `captureRef` output on device (off-screen render)" — finale-scoped.
- **Defect:** the archive's off-screen card now sits inside a `Card` with `overflow: 'hidden'` (`Card.tsx:40`) and the beat's inside a native `Modal` — both are new iOS `captureRef` contexts (ancestor clipping / modal window hierarchy) that web structurally cannot verify and the finale's prior device pass did not cover.
- **Failure scenario:** device Share on the beat or archive produces a blank/clipped PNG; nobody notices because the QA checklist never asks for it.
- **Fix:** extend the Phase-6 device ledger + the next CM-build checklist to three explicit items: finale Share, per-debt beat Share (in-Modal capture), archive Share (overflow-hidden-parent capture) — verify the actual PNG in the share sheet each time.

---

**Round-1 fix verification: all four folded changes (B2 share union · beat/archive off-screen cards · W2 metro web-tag exclusion · W3 mic-permission) are correctly implemented and live-verified green.** The 4 findings are hardening/adjacent, none block the closeout.
