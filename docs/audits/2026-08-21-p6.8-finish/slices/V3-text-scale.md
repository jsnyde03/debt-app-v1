# V3 — TEXT SCALE / DYNAMIC TYPE

> **Lens V3**, P6.8 pre-release audit. Repo `debt-app-v1`, branch `v1.7-dev`, commit `dd80f70`.
> Written incrementally. Two passes, kept separate.

## ⚠️ What this instrument can and cannot do

**Pass A (static, source) is EXACT.** It reads which `<Text>` nodes carry `maxFontSizeMultiplier`
and/or `numberOfLines`, and which fixed-height containers hold text. Nothing about it depends on the
capture harness. Its findings stand on their own.

**Pass B (visual, `textscale-*` frames) is APPROXIMATE and OVER-REPORTS.** Measured, not assumed
(`matrix/README.md` hole 2, from `DEBT_3.5_DEVICE_QA_CHECKLIST.md:213`): react-native-web has no OS
text scaling — `PixelRatio.getFontScale()` is always `1`. The `textscale-1.35x-*` / `textscale-2x-*`
frames scale text via **CSS**, which reproduces the failure *mode* (containers hold still, contents
grow) at the **wrong fidelity**: web ignores `maxFontSizeMultiplier`, which the app sets in **17
places across 6 files**. So every Pass-B finding on a clamped site is inflated, and is labelled as
such inline. **True Dynamic Type behaviour is a P6.14 device row** — see the closing section.

---

## PASS A — STATIC (exact)

**Ground truth established first.** `maxFontSizeMultiplier` appears **17 times across 6 files**
(`money.tsx` ×1 · `progress.tsx` ×3 · `CushionFloorSheet.tsx` ×1 · `PaidOffBeat.tsx` ×5 ·
`PaidOffFinale.tsx` ×6 · `PlanHero.tsx` ×1). `allowFontScaling={false}` appears **11 times, all in
`ShareCard.tsx`** — that is an off-screen export rendered to an image, so freezing it is correct and
is not a finding. There is **no global `Text.defaultProps` override** and no `useWindowDimensions().fontScale`
consumer anywhere; the only `PixelRatio.getFontScale()` reader in the app is
`components/plan/tutorialStage.ts:35`.

### V3-1
**Severity:** major · **Pass:** A-static
**Surface/Site:** Six large numeric/hero figures with **no** `maxFontSizeMultiplier` and **no** `numberOfLines` —
`apps/rn/src/app/history.tsx:43` (30pt) · `apps/rn/src/components/entities/AmortizationView.tsx:69` (32pt) ·
`apps/rn/src/components/money/BillBreakdownSheet.tsx:55` (32pt) ·
`apps/rn/src/components/payday/PaydayCaptureSheet.tsx:482` (30pt) ·
`apps/rn/src/components/payoff/WhatIfControls.tsx:68` **and** `:78` (34pt) ·
`apps/rn/src/components/plan/SpokenForSheet.tsx:59` (32pt)
**Finding:** The app's font-scale clamp was applied to the three tab heroes and the payoff-celebration
components but **never swept across the rest of the 30–44pt figure set**, leaving six large money
figures unbounded at AX sizes.
**Evidence:** Every `fontSize: >= 24` style in the tree was enumerated (20 declarations) and each one's
`<Text>` consumer located. Clamped: `money.tsx:997` · `progress.tsx:102/171/177` · `PlanHero.tsx:154` ·
`CushionFloorSheet.tsx:70` · `PaidOffBeat.tsx:116/117/123/127/131` · `PaidOffFinale.tsx:112/113/117/156/158/160`.
Frozen (correctly, it is an image export): `ShareCard.tsx` ×11. Handled differently but handled:
`paywall.tsx:341` (`numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}`). The six above are
what remains. ⚠️ **`PlanHero.tsx:154`'s own comment is now false against this tree**: *"the three tab
heroes were the ONLY large figures with no font-scale cap, while 13 other large-number sites already
carry one."* It was true of the *heroes*; six non-hero large figures were never in that count.
**Clamped in source?** no — none of the six has `maxFontSizeMultiplier`, `numberOfLines`, or `adjustsFontSizeToFit`.
**Confidence:** high (the enumeration is exhaustive and mechanical; the *consequence* at AX5 is Pass-B/P6.14 territory, the *absence* is not)

### V3-2
**Severity:** minor · **Pass:** A-static
**Surface/Site:** `apps/rn/src/components/payoff/WhatIfControls.tsx:68` + `:78` — a 34pt `+$` label and a
34pt `TextInput` on one row
**Finding:** The largest unclamped figure in V3-1 is also the only one that is a **live-editing row**
(static `+$` glyph beside a `readoutInput` `TextInput`), so at AX sizes the two halves of one number
scale into a row that has no wrap story and no `numberOfLines`.
**Evidence:** `styles.readout` = `fontSize: 34, fontWeight: '800'`, applied to both the `Text` at :68 and,
via `[styles.readout, styles.readoutInput]`, to the input at :78, inside `styles.readoutRow`.
**Clamped in source?** no
**Confidence:** medium — the row's flex behaviour under scale is not readable from the styles alone; a `TextInput`'s
intrinsic width does not respond like a `Text`'s. **P6.14.**

### V3-3
**Severity:** minor · **Pass:** A-static
**Surface/Site:** `apps/rn/src/components/ui/ListRow.tsx:93` (title) · `:97` (meta) · `:108` (caption)
**Finding:** All three left-column strings are hard `numberOfLines={1}` with no clamp, so on a 375pt phone
the row's information degrades by **truncation only** — it can never reflow — and the previously-fixed
squeeze (`right: { flexShrink: 0, maxWidth: '45%' }`) bounds the amount column but does not give the name
any more room than 55%.
**Evidence:** Read in full. The style block's own `⛔ [P6.4.5 · audit L5-16]` comment states the mortgage-row
case ("Chase Sapphire Preferred Card" squeezed to a few characters) and explicitly labels its own remedy
*"defensive, and the proof is a P6.14 device row."*
**Clamped in source?** partially — `numberOfLines={1}` on all three, `maxFontSizeMultiplier` on none.
**Confidence:** high that the bound is truncation-only; **low** on whether 55% is enough — that is the P6.14 row the code itself asks for.

### V3-4
**Severity:** minor · **Pass:** A-static
**Surface/Site:** `apps/rn/src/components/screen.tsx:82` — the shared screen header title
**Finding:** Pushed routes (`onBack` set) clip the header to **one** line with no clamp, and the header
row shares its width with the right-hand action via `headerLeft: { flexShrink: 1 }`.
**Evidence:** `numberOfLines={onBack ? 1 : 2}` over `textStyles.title1` (28pt). The adjacent
`⛔ [P6.4.5 · audit L5-17]` comment records the tab-header case being fixed (one line → two) and the
deliberate decision to leave pushed routes at one, reasoning those titles are short nouns.
**Clamped in source?** partially — `numberOfLines`, no `maxFontSizeMultiplier`.
**Confidence:** medium — the reasoning holds for the titles that exist today; it is a standing constraint on any
future long pushed-route title, not a present defect.

### ⛔ V3-R1 — a hypothesis I formed and then REFUTED, recorded so nobody re-derives it
**The claim I expected to make:** `theme/typography.ts` sets a fixed `lineHeight` on eight styles
(`heroNumber` 52/56 · `subhero` 34/40 · `body` 17/24 · `bodyMedium` 17/24 · `callout` 16/22 ·
`subhead` 15/20 · `footnote` 13/18 · `caption` 12/16 · `numericDisplay` 52/56). If RN scaled `fontSize`
but not `lineHeight`, every one of those would clip glyphs at AX sizes — an app-wide blocker.
**Why it is refuted:** it is **not** how RN 0.85 behaves, on either architecture. Verified in the
installed source: `apps/rn/node_modules/react-native/Libraries/Text/RCTTextAttributes.mm:140-143`
(`CGFloat lineHeight = _lineHeight * self.effectiveFontSizeMultiplier;`) and the Fabric path
`ReactCommon/react/renderer/textlayoutmanager/platform/ios/.../RCTAttributedTextUtils.mm:229-232`
(identical). `app.json:8` sets `newArchEnabled: true`, so the Fabric path is the live one — both scale it.
Note also `RCTTextAttributes.mm:59-60`: `maxFontSizeMultiplier` **inherits** down a nested-`Text` tree,
so a clamped parent clamps its nested spans (relevant to `ListRow.tsx:118`'s nested amount-suffix `Text`).
**Confidence:** high. **This one is closed — do not reopen it.**
