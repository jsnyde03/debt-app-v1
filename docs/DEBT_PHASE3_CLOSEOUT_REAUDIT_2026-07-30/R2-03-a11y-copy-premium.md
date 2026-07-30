# R2-03 — A11y + Copy/Voice + Premium-Bar (ROUND 2 re-audit)

Lens: accessibility, copy/voice/honesty, premium bar. Scope: fold commits `8c2a68a` (A1–A4), `fa16bfa` (H1/H5), `d5c7a15` (B1 onDark), `c3f2770` (B2/B5/B6). Verified against actual code on `v1.7-dev` + the real screenshots in `test-results/`.

## VERDICT: FINDINGS: 7

---

## What VERIFIED CLEAN (the round-1 fixes hold)

- **A1 (More switches)** — all five user-facing switches in `apps/rn/src/app/more.tsx` carry `accessibilityLabel`s that exactly match their row titles (Notifications / App Lock / I have savings elsewhere / Payday countdown / Debt-free sound). *But the fix stopped at more.tsx — see R2-A2.*
- **A2 (proof-strip chips)** — computed from `apps/rn/src/theme/colors.ts`: `text.primary` on `background.tertiary` = **13.54:1 light** (#111a2e on #dce4f0) and **16.53:1 dark** (#f3f8ff on #0d1830). Old values were 4.25 (light, failing) / 8.83 (dark). Both now clear AA with huge margin; the dark chip **improved**, not hurt. Visually confirmed legible in `guardian-proof-light.png`.
- **A3 (finale Dynamic Type)** — `ScrollView` wrapper present (`PaidOffFinale.tsx:97`); `$0` capped at 1.3× → 44pt × 1.3 ≈ 57pt, ~2 glyphs ≈ 65–75px wide, comfortably inside the 208px ring; "balance" capped 1.4×. `CountUp` spreads `...TextProps` into its `<Text>` (`motion/CountUp.tsx:22,48`), so `maxFontSizeMultiplier` genuinely lands.
- **A4 (grouped utterances)** — `accessible` + `accessibilityLabel` on a parent View is the correct RN idiom: on iOS the container becomes the accessibility element and inner Texts are suppressed; Android groups equivalently. `formatWhole` uses `Intl.NumberFormat` → "$4,200", so VoiceOver reads "four thousand two hundred dollars vanquished" — natural, no run-on. Windfall rows read "To your emergency fund, $700" — clean. ShareCard: **every** Text has `allowFontScaling={false}` (all 11 instances checked) and all three off-screen mount points (finale, beat, archive) are a11y-hidden with `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`.
- **Copy** — `dialogTitle: 'Share your debt-free win'` fixes the "Share you're debt-free" grammar bug (see R2-C1 for a residual accuracy nit). Notification titles are now uniformly sentence case across ALL four ("Paycheck tomorrow", "It's payday", "Upcoming bill"/"N upcoming bills", plus the pre-existing "Before this paycheck lands" at `notifications.ts:68` — consistent). Windfall H2/H4 verified on-screen (`windfall-light.png`): "HERE'S HOW THE APP WILL ROUTE $1,000" + "Confirm to route it this way — your whole plan updates. Your call." — clear, honest, on-voice. Tagline "Debt Planner · your payday debt-payoff app" is accurate (the payday engine IS the differentiator) and honest. New ShareCard variant strings are grammatical: "N debts vanquished" pluralizes correctly, "$X/mo freed toward the next one" is always true on the beat (the beat only fires when another debt remains), "on my way to debt-free" matches the established share voice. `totalPaid > 0` / `freedPerMonth > 0` guards prevent hollow "$0" brags. No free-dressed-as-premium anywhere in the new strings.
- **B1 (both-theme hierarchy)** — verified by LOOKING at `celebration-finale-light.png` vs `celebration-finale-dark.png` and `celebration-beat-light/dark.png`: all four show the identical, correct hierarchy — bright-blue filled **Continue**/**Keep going** primary, outlined **Share** secondary. Computed onDark pairs pass AA: #f3f8ff on #152340 = 14.62; #08111f on #5b9dff = 6.95. No regression to the beat. *(But see R2-A3 on what the light finale screenshot fails to prove.)*
- **Premium-bar** — the deepened confetti (64 pieces, wide spread) reads as a real spectacle in the dark capture, not a sparse band. The beat's two-button row does NOT over-weight it: it mirrors the finale's layout language, the card stays compact (check → eyebrow → Vanquished → amount → cascade → actions), and backdrop-tap dismiss is preserved. The three ShareCard variants are clean, uncluttered, brand-consistent.

---

## FINDINGS

### R2-A1 · HIGH · `apps/rn/src/components/plan/VanquishedBeat.tsx:96`
**Defect:** The full-screen backdrop `Pressable` has `accessibilityLabel={\`${debtName} paid off. Tap to continue.\`}` and Pressable defaults `accessible={true}` — on iOS that collapses the ENTIRE beat (card, stats, and both new buttons) into ONE VoiceOver element. The B2 **Share** button and the **Keep going** button are unreachable by VoiceOver; double-tap anywhere only dismisses.
**Scenario:** A VoiceOver user clears a debt → hears "Chase Freedom paid off. Tap to continue." as the only element → cannot share the win at all (the new headline feature is invisible to them), and the label lies about the surface (there are two buttons, not "tap to continue"). Pre-fold this pattern was benign (the only action WAS dismiss); B2 turned it into a functional loss. The web e2e can't catch it — RN-Web doesn't suppress descendants.
**Fix:** Set `accessible={false}` on the backdrop Pressable (keep it as the touch-dismiss layer), and let the card content read naturally — group the eyebrow/Vanquished/amount into one utterance via `groupLabel(...)` (the existing `utils/a11y.ts` primitive) and leave the two Buttons individually focusable.

### R2-A2 · MEDIUM · `apps/rn/src/components/ui/SwitchRow.tsx:13`
**Defect:** A1 was applied only to `more.tsx`. The shared `SwitchRow` — used by DebtSheet ("Autopay"), ExpenseSheet ("Variable amount (estimate)", "Free trial or intro price", "Autopay"), LivingExpenseSheet ("Count toward my reserve"), PaycheckSheet ("This paycheck didn't arrive") — renders its `<Switch>` with **no** `accessibilityLabel`. That's the exact defect A1 fixed, live on six user-facing toggles.
**Scenario:** VoiceOver user editing a debt reaches the Autopay toggle → hears "off, switch" with no name — worse here than More because sheet rows have no subtitle context.
**Fix:** One line in the shared component: `accessibilityLabel={label}` on the Switch in `SwitchRow` (this is why the shared primitive exists — one fix propagates).

### R2-A3 · MEDIUM (verification gap) · `apps/rn/tests/e2e/celebration.spec.ts:56` + `test-results/celebration-finale-light.png`
**Defect:** The LIGHT finale screenshot shows **no gold journey ring and no mesh wash** — both Skia/CanvasKit layers are absent (only `$0` + confetti render); the dark capture shows them fully. The spec waits a fixed 1600ms then screenshots, racing the CanvasKit wasm load (the known Skia-on-web load-on-mount setup). The code path is theme-constant (`GOLD_PALETTE`, no theme branch), so this is almost certainly a capture race, not a light-mode regression — but it means the visual gate for the most-photographed surface **passed without actually verifying its centerpiece in light**, which is exactly what the visual-verify rule exists to prevent (and it soft-undermines the "both themes verified identical" B1 claim, though the buttons themselves are confirmed in both).
**Scenario:** A future change genuinely breaks the ring in one theme → the suite still passes green on a ringless screenshot.
**Fix:** Wait for the Skia canvas to paint (e.g. `page.waitForSelector('canvas')` + a settle, or poll for non-background pixels in the ring region) before capturing; recapture the light finale and confirm the ring by eye.

### R2-A4 · LOW · `apps/rn/src/app/more.tsx:223`
**Defect:** The dev/QA "Simulate Premium" `<Switch>` is the one switch that got no label. It's gated `(__DEV__ || QA_TOOLS) && Platform.OS !== 'web'`, but `QA_TOOLS` builds go to real TestFlight testers — a reachable, nameless switch in exactly the build a QA pass runs VoiceOver on.
**Scenario:** TestFlight a11y QA reaches Developer / QA → "off, switch", unnamed.
**Fix:** `accessibilityLabel="Simulate Premium"` — trivially consistent with its siblings (moot at submission when QA_TOOLS is stripped, but wrong until then).

### R2-A5 · LOW · `apps/rn/src/components/plan/PaidOffFinale.tsx:99` + `:108`
**Defect:** The ring group's label is "You're debt-free." and the very next element is the headline Text "You're debt-free" — VoiceOver speaks the identical phrase twice in a row. The hidden ring-center content ("$0 balance") is the information the ring label should carry.
**Scenario:** VO swipe order on the finale: "You're debt-free." → "You're debt-free" → stats — a stutter on the app's single most-crafted moment.
**Fix:** Ring group label → `"$0 balance"` (the headline already owns "You're debt-free").

### R2-A6 · LOW · `apps/rn/src/components/plan/PaidOffFinale.tsx:151`
**Defect:** In `FinaleStat`, the value is capped (`maxFontSizeMultiplier={1.3}`, both CountUp and reduce-motion branches) but the caption label beneath it is uncapped. At AX text sizes (up to ~3.1×) the uppercase label (~40px) outgrows its own stat value (capped ~31px), inverting the visual hierarchy of the trio. Scrolling (A3) prevents breakage, but the beat reads wrong.
**Scenario:** AX5 Dynamic Type user hits the finale → "VANQUISHED" towers over "$4,200".
**Fix:** `maxFontSizeMultiplier={1.4}` on the stat label Text (matching the ring's "balance" caption cap).

### R2-C1 · LOW · `apps/rn/src/utils/share-card.ts:15`
**Defect:** `dialogTitle: 'Share your debt-free win'` is hard-coded for ALL three share moments. For the per-debt beat and the progress archive the user is explicitly NOT debt-free yet (the card itself says "on my way to debt-free") — the sheet title overstates the moment. Cosmetic-adjacent: `dialogTitle` only surfaces on Android/web sheets (iOS's UIActivityViewController ignores it), but the string is wrong where it does show, and Android is on the roadmap.
**Scenario:** (Future Android / web share) User shares their 1st-of-4 debts cleared → sheet titled "Share your debt-free win" — false-precise, off the honest-numbers voice.
**Fix:** Accept an optional `dialogTitle` param in `shareDebtCard` (default `'Share your win'`; finale passes the debt-free variant).

---

## Observations (no finding)

- **Web-only Switch tint:** in `more-sound-light.png` the ON switch renders the platform default green, not `accent.primary` blue — RN-Web appears to ignore `trackColor`. Cosmetic, e2e-surface only (device uses the token); worth a glance in the next device QA pass against the single-blue-accent system.
- **Beat web-fallback share text** "I just vanquished Chase Freedom — $4,200 on my way to debt-free…" — the em-dash splice reads slightly like "$4,200 [is] on my way"; native shares the image only, so this is web-fallback text. Not worth a slot.
- The archive's `groupLabel` tombstone utterances ("Chase Freedom, $4,200 cleared, Jun 2026") verified clean.
