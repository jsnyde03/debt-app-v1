# R3-02 — Correctness / Web-Native Integrity / Test-Integrity (Round-3 confirming sweep)

**Auditor lens:** whole-fold correctness + platform-split integrity + test integrity. Verified against the ACTUAL code at `9a59f85` (working tree identical) + all gates re-run live this pass.

## VERDICT: FINDINGS: 1

One LOW hygiene finding (below) — a sibling of the already-folded W3 item, pre-existing (not a fold regression). Everything else in scope verified clean. With this one line folded (or explicitly deferred by Jason), this lens is at consensus.

---

## Gates — ALL GREEN (re-run this pass, not taken on faith)

| Gate | Result |
|---|---|
| `typecheck` (tsc --noEmit) | ✅ pass |
| `test:regression` | ✅ all pass |
| `test:app` | ✅ all pass (windfall 19 asserts incl. R2-T1; widget 19) |
| `test:scenarios` | ✅ all pass |
| `lint` (apps/rn) | ✅ pass |
| `export:web` | ✅ clean export |
| `route-smoke` | ✅ 9/9 — every route non-blank |
| `celebration` + `windfall` e2e | ✅ 11/11 both themes |
| FULL e2e suite | ✅ 83/83 passed (2.2m) |

## 1 · Round-2 non-a11y fixes — HOLD (verified against code)

- **`dialogTitle` 3rd param** — threads correctly. `share-card.ts:12` `dialogTitle = 'Share your debt-free win'` (default = the finale caller, which passes 2 args); `VanquishedBeat.tsx:88` passes `'Share your win'`; `VanquishedArchive.tsx:38` passes `'Share your progress'`; `share-card.web.ts:7` takes `_dialogTitle?: string` and ignores it. tsc green on both variants; the base (non-platform) `.ts` is what callers typecheck against, so 2- and 3-arg calls are both valid. No re-export gap (single export, mirrored).
- **`expo-audio` plugin config** — VALID, verified against the installed plugin source (`node_modules/expo-audio/plugin/build/withAudio.js:8,26`): `recordAudioAndroid !== false && 'android.permission.RECORD_AUDIO'` → `false` drops the permission; `microphonePermission: false` → `@expo/config-plugins/build/ios/Permissions.js:28-30` `delete infoPlist[permission]` — the NSMicrophoneUsageDescription key is removed, exactly as claimed.
- **VanquishedBeat backdrop `accessible={false}`** — touch dismiss intact: `accessible` does not affect the responder system; the backdrop `Pressable` (`VanquishedBeat.tsx:100`) still receives presses, the card `Animated.View` stays `pointerEvents="box-none"`. Panel animation untouched (shared-value springs unchanged). VO dismiss path exists ("Keep going" → `onDismiss`, now individually focusable). Verified visually: beat renders with correct onDark hierarchy (Share outlined / Keep going blue primary) in both themes.
- **Finale ScrollView safe-area insets** — centering preserved: `scrollContent` keeps `flexGrow:1 + center`; insets land as `paddingTop/Bottom` add-ons (`PaidOffFinale.tsx:99-102`), so at normal type size content stays centered (visually confirmed both themes — ring + mesh + stat trio + both CTAs composed and centered). `useSafeAreaInsets` is safe here (expo-router provides SafeAreaProvider; e2e renders confirm no throw). The `insets.top + spacing.xl` fold is strictly ≥ the R2-recommended `max(spacing.xl, insets.top)` — fine.

## 2 · Test integrity — GENUINE, not tautological

- **"Keep going" locator** (`celebration.spec.ts:49`) — the visible beat's button (`VanquishedBeat.tsx:129`); the off-screen ShareCard has NO buttons (pure Text/View, `ShareCard.tsx`), and Playwright treats off-screen-positioned elements as visible, so the old `.first()` COULD have matched a ghost — the identity locator cannot. Note: `MilestoneAckCard.tsx:45` also has a "Keep going" button; if both ever rendered simultaneously, strict mode would FAIL LOUDLY (a flake, never a silent false-pass) — currently green in both themes, so they don't co-occur in the seeded flow. Informational only.
- **"DEBTS VANQUISHED ·" locator** (`celebration.spec.ts:96`) — the middot exists only in the archive eyebrow's single text node (`VanquishedArchive.tsx:47`); the ShareCard progress variant renders "N debts vanquished" (no middot, `ShareCard.tsx:61`) and its brand line's middot is in a different string. Cannot match the capture artifact.
- **R2-A3 canvas-wait** (`celebration.spec.ts:56`) — a REAL CanvasKit wait: on web the Skia components mount via `WithSkiaWeb` (`JourneyRingCanvas.web.tsx`), which renders no `<canvas>` until CanvasKit has loaded — so `locator('canvas').waitFor(visible)` genuinely gates on the load. The `.catch(() => {})` makes it soft, but it only stabilizes the SCREENSHOT; the test's assertions (Continue / Share your win buttons) are independent — nothing masked. Proof it works: this run's `celebration-finale-light.png` shows the full ring + bloom + mesh (the exact frame R1-B3 said was missing).
- **R2-T1 missedArrivals test** (`windfallSplit.test.ts:65-70`) — exercises the REAL path: `selectWindfallSplit` → `selectAllocation` → `buildAllocation` → `selectPaycheckMissed(store)` (`selectors.ts:34`), which reads `missedArrivals.includes(nextPaycheckDate)` — exactly what the test sets → income $0 → windfall fully absorbed → C1 attribution. Asserts non-empty + exact conservation through the live engine. The harness is real: `assert` throws, `runAppTests.ts:59` imports the file, failure sets `exitCode=1` + rethrows.
- **T2 Confirm** (`windfall.spec.ts:35-39`) — clicks Confirm, asserts the sheet DISMISSED and the hero shows "$1,000 extra this paycheck" — a no-op Confirm cannot pass.

## 3 · Web-route / platform-split integrity — CLEAN

- `export:web` clean; **route-smoke 9/9 non-blank** (/, /progress, /money, /more, /history, /living-expenses, /cushion-forecast, /paywall, /onboarding).
- W2 metro fix verified in `metro.config.js` (`resolveWithExts`): web → `["web"]` only, ios/android → `[platform, "native"]` — matches real Metro; a stray `.native.ts` can no longer resolve into the web bundle.
- All 3 `.native.ts` files (pendingActionBridge · liveActivityBridge · widgetStorage) have base twins with mirrored exports; zero module-scope `requireNativeModule`/`requireNativeViewManager` (all lazy inside functions — `scan.ts:13` is inside `scanStatement()`); no `.native.tsx` component splits. The fold's touched files add NO native lookups (ShareCard is pure View; view-shot/sharing stay confined to `share-card.ts`, kept out of the web bundle by the `.web.ts` override).

## 4 · Whole-fold regression sweep — NO REGRESSIONS

- **Windfall sheet:** `hasSplit` guard (`WindfallSheet.tsx:56`) gates eyebrow/rows/footer AND the Confirm-vs-Add label; rows sum exactly to the headline (visually confirmed: $700 + $300 = ROUTE $1,000); "Your call" custody copy in place; A4 one-utterance rows.
- **Finale:** both-theme captures show identical correct B1 hierarchy (blue Continue primary, outlined Share secondary), full ring/mesh/stat composition.
- **More toggles:** SwitchRow primitive carries `accessibilityLabel={label}` (fixes all consumers once); Simulate-Premium switch labeled; /more route green.
- **Proof strip:** chip text = `text.primary` (A2) with the A2 comment intact; e2e + route green.
- **Archive:** eyebrow/rows/Share + off-screen card `aria-hidden`; archive e2e green both themes.
- **FormSheet:** `numberOfLines={2}` in BOTH branches (lines 73 + 128) — the C5/T7 inline-branch hole is closed.
- **Rounding math re-derived adversarially:** `roundBucketsToWhole` cannot under- or over-distribute (Σfloors ≤ Σraw ≈ amount → `remaining ≥ 0`; loop bounded by positive-frac buckets) — independently confirms R2-01's proofs. `.filter(≥1)` drops only exact-0 rows, conservation intact.
- Phase-0/1/2 engine surfaces: regression + app + scenario suites all green (allocation, guardian, widget-sync, safety-net lifecycle, demo-seed).

## 5 · Open-items sweep (_SUMMARY + R2 docs vs the fold)

Every `_SUMMARY.md` item is folded or correctly Phase-6-parked. Notably: R2-W-04 (the 3 novel capture contexts) IS captured in the plan's device ledger (`DEBT_ELEVATION_PLAN.md:244` — finale · beat-in-Modal · archive-in-overflow-hidden-Card). R1-B3 (composed-capture evidence) is resolved by the canvas-wait (clean light capture now produced on every run). The R2-03 "RN-web Switch tint" note is cosmetic, e2e-surface-only, already flagged for a device-QA glance. The 4 explicitly Phase-6-owed items excluded per the directive.

---

## FINDING R3-02-1 · LOW · hygiene / App-Review friction

- **File:** `apps/rn/app.json:44-50` (expo-audio plugin block)
- **Defect:** the W3 fold removed the unused mic permission (iOS) and RECORD_AUDIO (Android) but missed the plugin's THIRD unused default: `enableBackgroundPlayback` defaults `true` (`withAudio.js:8,14-23,32-36`), so prebuild injects `UIBackgroundModes: ["audio"]` into Info.plist + `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_MEDIA_PLAYBACK` on Android — for a foreground-only, opt-in, ~seconds-long celebration chime that needs none of it. Pre-existing since `f155b10` (NOT introduced by the fold), but it is the exact class W3 targeted and arguably MORE reviewer-visible than the mic string was.
- **Scenario:** App Review sees a declared background-audio mode with no discoverable background-audio behavior → a metadata/justification question or rejection risk at submission; Android ships two unused foreground-service permissions.
- **Fix (one line):** `"enableBackgroundPlayback": false` in the plugin config. No behavior change — foreground playback doesn't use UIBackgroundModes. (Alternative: an explicit defer-to-Phase-6 note beside the other App-Review items, but the fold directive's "fold everything code-addressable" points at folding it now.)

## Informational (no action required)

- "Keep going" strict-mode collision with `MilestoneAckCard` is theoretical; would fail loudly, not silently, if the two moments ever co-rendered.
- The canvas-wait's `.catch(() => {})` means a CanvasKit load failure degrades the screenshot, not the assertions — acceptable by design; route-smoke separately catches a hard Skia-load crash.

**Bottom line:** round-2 fixes all hold, tests are genuine, no fold commit regressed any earlier surface, gates fully green. One LOW one-line hygiene item stands between this lens and CONSENSUS-CLEAN.
