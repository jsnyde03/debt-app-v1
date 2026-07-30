# Phase-3 Closeout Re-Audit — Lens 1: Correctness & Regression

**VERDICT: FINDINGS: 6** (2 MAJOR · 1 MINOR · 3 NIT)

Audited: this session's block (`f2d3348..bd52e7b` on `v1.7-dev`) — Windfall Autopilot, deepened finale (confetti/bloom/mesh/share/sound/haptic), interactive notifications, Sentry scaffold, FormSheet truncation fix, `debtFreeSoundEnabled` pref. Every claim below was verified against the actual code; C1 was reproduced with a live run of the real selectors; C2 was verified against the actual `sentry-xcode.sh` in `node_modules` + the real `codemagic.yaml`.

**Suites run (all green):** `packages/core` regression suite ✅ · `apps/rn npm run test:app` ✅ · `npm run test:scenarios` ✅ · `tsc --noEmit` ✅. No Phase 0/1/2 regressions found in the selectors/engine paths the block touched.

---

## C1 — MAJOR — Windfall split breaks money conservation when income < paid-required + living reserve (worst on a missed paycheck)

- **File:** `apps/rn/src/store/guardianSelectors.ts:351` (`selectWindfallSplit`), root cause `packages/core/engine/allocatePaycheck.ts:233`
- **Defect:** The split diffs two allocation runs and claims "the deltas sum exactly to `amount`". That holds only when the engine's clamp `remaining = max(0, income − paidRequiredTotal − livingExpenseReserve)` doesn't bind. When base income is below paid-required + living reserve — most notably a **missed paycheck**, where `buildAllocation` deliberately plans on `income = 0` (`selectors.ts:48`) — the first dollars of the windfall are absorbed by the living-expense reserve and already-paid bills, which produce **no allocation items in either run**. Those dollars vanish from the split.
- **Verified failure scenarios** (live repro against the real selectors, premium store, $800 enabled living reserve, monthly $1500 paycheck):
  - Missed paycheck + $1,000 windfall → items sum **$200** (`bills: 200` only) — $800 unaccounted.
  - Missed paycheck + $500 windfall → **`items: []`** — the premium sheet renders "HERE'S HOW THE APP WILL ROUTE $500" followed by **zero rows**, then "Confirm and the app routes it automatically."
  - No missed paycheck, $1,200 rent marked paid + $800 living reserve (> $1,500 income) + $1,000 windfall → items sum **$500** — $500 unaccounted.
  - Control (no clamp): $1,000 → sums exactly $1,000 ✅ (the shipped test only covers this healthy case).
- **Why it matters:** this is the feature's headline invariant ("an honest 'here's where your extra lands'") failing precisely in the crisis cycles the Guardian markets itself on (missed paycheck + windfall is an explicitly designed-for pairing — the `buildAllocation` comment says "only the windfall, if any, is real").
- **Fix:** in `selectWindfallSplit`, compute `absorbed = round(amount − Σ deltas)`; if ≥ $0.5, add it to the `bills` bucket (or a dedicated "your living costs & paid bills" bucket — living reserve is arguably not "bills"). Add the missed-paycheck and clamped-base cases to `windfallSplit.test.ts`. Also guard the sheet for `items.length === 0` (see C3).

## C2 — MAJOR — `@sentry/react-native` config plugin will fail the queued Release Codemagic build (no `SENTRY_DISABLE_AUTO_UPLOAD` anywhere)

- **File:** `apps/rn/app.json:38` (plugin added bare, no props) + `codemagic.yaml` (no Sentry env var)
- **Defect:** The plugin unconditionally wires `sentry-xcode.sh` into the "Bundle React Native code and images" phase (verified in `plugin/build/withSentryIOS.js:83-104`; props-less usage still modifies the phase — org/project only affect `sentry.properties` content). The vendored `scripts/sentry-xcode.sh` (verified) skips upload only for **Debug** configs or when `SENTRY_DISABLE_AUTO_UPLOAD=true` / `SENTRY_ALLOW_FAILURE=true`; otherwise, in **Release**, a failed `sentry-cli react-native xcode` sets `exitCode=1` and **fails the archive**. There is no `sentry.properties`, no `.env.sentry-build-plugin`, no `SENTRY_AUTH_TOKEN`, and no `SENTRY_DISABLE_AUTO_UPLOAD` in `codemagic.yaml` — so the upload cannot succeed and cannot be skipped.
- **Failure scenario:** trigger the already-queued "signed CM device build for all-of-3.5-so-far" (`xcode-project build-ipa` = Release archive) → the bundle phase runs sentry-cli with no auth/org → non-zero → `error: sentry-cli - …` → **build fails**, burning a Codemagic run. The `sentry.ts` docstring itself names the needed care (`SENTRY_DISABLE_AUTO_UPLOAD`) but defers it to Phase 6 while the plugin is live now — exactly the pre-commit-native-build-pass pattern ([[feedback_pre_commit_native_build_pass]], [[project_codemagic_xcodeproj_glob_gotcha]]).
- **Fix (one line, do before the next CM trigger):** add `SENTRY_DISABLE_AUTO_UPLOAD: "true"` to the workflow's `environment: vars:` in `codemagic.yaml` — or use `["@sentry/react-native", { "disableAutoUpload": true }]` in app.json until Phase 6 wires the DSN + token.

## C3 — MINOR — WindfallSheet renders the routing header/footer with zero rows in the C1 degenerate case

- **File:** `apps/rn/src/components/plan/WindfallSheet.tsx:92-107`
- **Defect:** `split` is truthy whenever the selector returns (it returns `{amount, items: []}`, never null, for a positive amount with a plan), so the premium block renders the "HERE'S HOW THE APP WILL ROUTE $X" eyebrow + "Confirm and the app routes it automatically" footer with no item rows between them (reachable today via C1's missed-paycheck case; stays a worthwhile guard even after C1 is fixed).
- **Fix:** render the routing block only when `split.items.length > 0` (or always show the C1 absorbed-remainder row, which makes empty impossible).

## C4 — NIT — Displayed split rows can visibly under-sum the headline amount

- **File:** `apps/rn/src/store/guardianSelectors.ts:359` + `WindfallSheet.tsx:101`
- **Defect:** (a) the `>= 0.5` filter silently drops up to ~6 × $0.49 of genuine deltas; (b) `formatWhole` rounds each row independently, so e.g. three $333.33 rows display as $333+$333+$333 under a "$1,000" headline. Cosmetic honesty drift of a few dollars max.
- **Fix (optional):** largest-remainder rounding to whole dollars so displayed rows sum to the displayed amount.

## C5 — NIT — Truncation fix covers only FormSheet's modal branch; the inline (iPad) branch and AnimatedSheet still clamp to 1 line

- **File:** `apps/rn/src/components/ui/FormSheet.tsx:73` (inline pane, still `numberOfLines={1}`); `apps/rn/src/components/ui/AnimatedSheet.tsx:75` (same)
- **Defect:** the commit says "app-wide sheet-truncation fix" but only `FormSheet.tsx:128` (modal) went 1→2. Verified today's inline consumers (DebtSheet on the iPad Money pane) and AnimatedSheet consumers (LogPayment/Amortization/BillBreakdown) all pass short or single-datum subtitles, so **nothing truncates right now** — but the next long static subtitle through either path regresses silently.
- **Fix:** apply `numberOfLines={2}` to both remaining subtitle sites (1-line ellipsis is defensible for AnimatedSheet's dynamic debt-name subtitles; if kept, note it deliberately).

## C6 — NIT — Share flow copy + silent no-op

- **File:** `apps/rn/src/utils/share-card.ts:15`
- **Defect:** `dialogTitle: "Share you're debt-free"` is ungrammatical ("Share that you're…" / "Share your debt-free win") — Android-only surface, but it ships in the string table now. Also, when `Sharing.isAvailableAsync()` returns false the Share tap silently does nothing (no toast/fallback).
- **Fix:** reword; optionally fall back to the text share/alert path native-side too.

---

## Checked and CLEAN (verified, no defect)

- **`selectWindfallSplit` category partition** — the 6 groups exactly partition all 12 `AllocationCategory` values (checked against `allocatePaycheck.ts:54-66`); premium holdbacks (discovery/cold-start/variable-buffer/prefunded) all land in `safetyNet`; EF-funded, no-debt, and shortfall-present cases conserve (deltas are monotone non-negative — every rung is monotone in `remaining`). Conservation fails **only** via the C1 clamp.
- **Finale reduce-motion path** — confetti + bloom skipped, CountUp → static text, mesh kept (static, not motion), `haptics.finale()` retained by design; the haptic timeout is cleaned up; Modal children mount only when visible so effects can't pre-fire.
- **`haptics.finale()` gating** — web no-op (`on` guard), Android → expo-haptics crescendo (lazy lookup returns null off-iOS), iOS native lazy `requireNativeModule` in try/catch with fall-through to the crescendo; the Swift module guards `supportsHaptics` + wraps everything in `do/catch`. Feel itself is device-QA (owed, already tracked).
- **Sound pref gating** — plays only when `prefs.debtFreeSoundEnabled ?? false` is true; default `false` in `defaults.ts`; web split (`debtFreeSound.web.ts`) keeps expo-audio + the wav out of the web bundle; the wav asset exists at `apps/rn/assets/sounds/debt-free-chime.wav`; player released on a timer, all guarded.
- **Old-store hydration** — `runMigrations` merges `prefs: { ...base.prefs, ...(r.prefs ?? {}) }`, so a pre-VIS-6 blob backfills `debtFreeSoundEnabled: false`; both read sites also use `?? false`. Safe.
- **Interactive notifications** — all 4 scheduled notifications carry the right category (eve+morning → payday, bills → bills, risk → risk); the response listener filters on our categories, returns a real unsubscribe, and is cleaned up in the layout effect; `router.navigate('/')` is try/caught and the cold-start default route is `/` anyway, so a too-early tap loses nothing; the `.web` stub re-exports the full surface (re-export-gap lesson honored).
- **Sentry runtime (as opposed to CI, see C2)** — `initErrorReporting` hard-returns without a DSN (reporter stays the dev console sink); `Sentry.wrap` pre-init is safe (verified `reactnativeprofiler.js` null-guards `getClient()` → dev-only console.warn); v8 + the Freedom v7 background-tracker crash mitigations are in place; `beforeSend` scrubs user/request/device and call sites pass only `{subsystem, operation}` strings.
- **FormSheet modal 2-line subtitle** — sheet is bottom-anchored with `maxHeight: 92%` and a scrollable body (`flexGrow: 0`), so the extra line grows the sheet/compresses the scroll, never pushes the sticky submit off-screen or clips.
- **Regression sweep** — core + app-layer + scenario suites and `tsc --noEmit` all green; `_layout.tsx` diff only adds (no lifecycle behavior removed); `KeyCommandListener.ios.tsx` refactor preserves the lazy native lookup + memoized identity; `setWindfall` NaN gap exists but is pre-existing (`057df3d`) and UI-guarded, not this block's.

## Vision check ("delivered, not thin")

Windfall Autopilot (itemized premium routing + one-tap confirm, free uncrippled with a value-led invite), the deepened finale (two-wave confetti, bloom, mesh, bespoke Core-Haptics crescendo, branded share card, opt-in sound), and actionable notifications all match the shaped scope — **except** C1, which hollows the "honest routing" promise exactly in the tight-cycle cases the Guardian identity is built on. Fix C1+C2 before the consensus call.
