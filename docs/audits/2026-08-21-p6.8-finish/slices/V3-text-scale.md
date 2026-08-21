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

### V3-5
**Severity:** major · **Pass:** A-static
**Surface/Site:** `apps/rn/src/components/payoff/TrajectoryChart.tsx:263` — `const endPillW = 20 + (debtFreeDate ? shortDate(debtFreeDate).length : 8) * 6.5;`
**Finding:** The debt-free-date pill's width is computed from a **hard-coded 6.5pt-per-character
estimate** and that estimate is then used to *clamp the pill inside the plot* — so at any font scale
above 1 the pill is wider than the clamp believes and runs past the chart's right edge.
**Evidence:** `:375` uses it twice — `left: clamp(endpoint.x - endPillW / 2, PAD.l, w - PAD.r - endPillW)`.
The pill's text is `endPillText: { fontSize: 11 }` (`:519`) with no clamp. At iOS AX5 (~3.1×) an 11pt
glyph is ~34pt, so the real width is roughly 3× the estimated one while the clamp is unchanged.
**Clamped in source?** no
**Confidence:** high — the arithmetic is literal and takes no measurement; only the exact overflow amount is device-owed.

### V3-6
**Severity:** major · **Pass:** A-static
**Surface/Site:** Chart axis / waypoint labels, all absolutely positioned inside fixed-height plots:
`TrajectoryChart.tsx:492` `yLabel {position:'absolute', width: PAD.l - 6 /* = 32 */, fontSize: 10}` ·
`:493` `xLabel {width: 40, fontSize: 10}` · `:517` `waypointLabel {width: 80, fontSize: 9}` ·
`:530` `scrubReadoutText {fontSize: 11}` · `CashRunwayChart.tsx:236` `xLabel {width: 48, fontSize: 10}`
**Finding:** Every chart label is a fixed-**width**, absolutely-positioned box at a hard 9–11pt inside a
hard-height plot (`TrajectoryChart.tsx:21 H = 200` · `CashRunwayChart.tsx:20 H = 176`), placed by
literal pixel offsets that no font scale touches — so the labels grow while their boxes, their spacing
and their container do not.
**Evidence:** The offsets are all constants: `top: mapY(v) - 7` · `left: mapX(t.m) - 20` ·
`left: wp.x - 40, top: wp.y - 22` · `top: baselineY - 30` · `left: clamp(scrub.x - 60, PAD.l, w - PAD.r - 132)`
· `CashRunwayChart.tsx:172` `left: mapX(i) - 24, top: plotBottom + 4`. `PAD = { l: 38, r: 14, t: 16, b: 26 }`
is the entire gutter budget for a y-axis currency label. Neighbouring x-ticks are one label-width apart by
construction, so any growth is immediate collision.
**Clamped in source?** no — none of the five styles carries `maxFontSizeMultiplier`; three carry `numberOfLines={1}`,
which converts overlap into truncation but does nothing about a 32pt-wide box.
**Confidence:** high on the mechanism (it is arithmetic, not layout inference); **medium** on severity — a chart
whose labels truncate is degraded, not unusable, and 9–11pt labels are the one place where *some* growth is wanted.

### V3-7
**Severity:** minor · **Pass:** A-static
**Surface/Site:** `apps/rn/src/app/(tabs)/money.tsx:812` (`BillSearch`) over `styles.search` at `:1046-1054`
**Finding:** The **only fixed-`height` container in the app that holds live text** — `height: 44` with
`searchInput: { flex: 1, paddingVertical: 0 }` — gives a 17pt `textStyles.body` field zero vertical slack,
so the search field is the one control that cannot grow with the text inside it.
**Evidence:** Every `height: <number>` in the tree was enumerated (49 declarations). All the others are
icons, dots, swatches, rings, progress tracks, grabbers and a hidden key-command sink — none holds a string.
`PaidOffBeat.tsx:165` (`height: 68`) is a check ring, not text. `paddingVertical: 0` was presumably set to
make the 44 exact, which is precisely what removes the slack.
**Clamped in source?** no
**Confidence:** medium — a `TextInput`'s clipping behaviour in a too-short box is not readable from styles, and this
control only appears when Bills is long. **P6.14.**

### V3-8
**Severity:** polish · **Pass:** A-static
**Surface/Site:** `apps/rn/src/app/(tabs)/_layout.tsx:74` — `tabBarLabelStyle: { fontSize: isRegular ? 15 : 11 }`
**Finding:** The three tab labels are set to a hard 11pt on compact with no clamp and no local control over the
bar's height, which is owned by the navigator.
**Evidence:** Read in full. ⚠️ **I could not verify how the navigator handles this** — `@react-navigation/bottom-tabs`
is **not present** in `apps/rn/node_modules` in this tree (only `@react-native*` scopes are installed), so I could
not read whether its `BottomTabItem` sets `allowFontScaling`/`numberOfLines` or whether the bar height reacts to
`fontScale`. The one datapoint the code offers is `_layout.tsx`'s own comment that the demo dock *"sat over the tab
bar and cut the labels in half"* — i.e. the bar does not defend its labels.
**Clamped in source?** no (app side); navigator side unknown
**Confidence:** low. Listed so a refuter with a full install can settle it in one read. **P6.14.**

---

## ⚠️ Two MORE instrument defects I found in the recipe before reading a single frame

Read `apps/rn/tests/shots/p6.8-matrix.shot.ts:281-285`. The injected style is:

```css
div[dir="auto"], span, p, button { font-size: calc(1em * SCALE) !important; line-height: 1.15 !important; }
```

**1 · `calc(1em * SCALE)` COMPOUNDS through nesting.** `1em` resolves against the *parent's computed*
font-size, so a `span` inside a `div[dir="auto"]` inside another `div[dir="auto"]` is scaled once per
level. react-native-web renders every `<Text>` as `div dir="auto"` and every nested `<Text>` span inside
it, so nested-Text sites (`ListRow.tsx:118`'s amount-suffix, `CashRunwayChart.tsx:194`'s inline bold
figure, every `<Text>` inside a `<Text>`) render at **`SCALE²` or worse** — 1.82× and 4× rather than
1.35× and 2×. **This is over-report number two, on top of the ignored clamp.**

**2 · `line-height: 1.15` makes the frames UNDER-report vertically.** The app's own ratios are looser
(`body` 24/17 = 1.41 · `caption` 16/12 = 1.33 · `heroNumber` 56/52 = 1.08), and RN scales `lineHeight`
with the font (V3-R1). So the frames compress vertical rhythm at the same time as they inflate glyph
size: **horizontal overflow is exaggerated, vertical crowding is suppressed.** A frame that looks
vertically fine is not evidence that it is.

⛔ **Net: treat Pass B as a POINTER at surfaces, not as a measurement of any of them.**

---

## PASS B — VISUAL (approximate, over-reporting; every finding below is a hypothesis)

### V3-9
**Severity:** major · **Pass:** B-visual *(a finding ABOUT the instrument — it is the reason the rest of Pass B is thin)*
**Surface/Site:** `apps/rn/tests/shots/p6.8-matrix.shot.ts:284` — the whole `textscale-*` set (40 frames)
**Finding:** ⛔ **The text-scale frames do not scale hero text UP — they scale it DOWN, and they invert the
type hierarchy**, so the one class V3 exists to judge (large money figures overflowing) is the one class
these frames cannot show.
**Evidence:** `font-size: calc(1em * SCALE) !important` computes `1em` from the **parent's** font-size and
`!important` defeats the element's own declared size. A 40pt hero inside a ~16pt parent therefore renders at
`16 × SCALE` = **32px at "2×"** — smaller than its true 40pt — while a 13pt eyebrow renders at 26px and up.
Visible directly: in `phone/light/today.png` the hero `$577` is far larger than the `THIS PAYCHECK · SEP 4`
eyebrow above it; in `textscale-1.35x-today.png` **and** `textscale-2x-today.png` the eyebrow is several times
larger than the hero `$2,000`, and the hero is visibly smaller than in the un-scaled frame. Same inversion on
`textscale-2x-cushion-forecast.png` (`CUSHION BY PAYCHECK` dwarfs every figure below it).
**Clamped in source?** n/a — this is the harness, not the app.
**Confidence:** high (the CSS semantics are unambiguous and the frames show it plainly).
⚠️ **Consequence for this lens:** Pass B is informative **only about text that is SMALL in the app** — chart
labels, eyebrows, captions, pills, tab labels — and even there it over-reports by nesting-compounding. Every
Pass-B finding about a hero figure is unusable; **V3-1 and V3-5 have no visual half and never could have.**

### V3-10
**Severity:** major · **Pass:** B-visual *(and it corroborates V3-6, which is Pass A)*
**Surface/Site:** `cushion-forecast` and `progress` — the chart x-axis label row
**Finding:** Every date label on the x-axis collapses to a single character plus an ellipsis and the row
collides with the legend directly beneath it.
**Evidence:** `phone/light/cushion-forecast.png` baseline reads `Aug 21 · Sep 4 · Sep 18 · Oct 2 · Oct 16 ·
Oct 30`, already nearly touching at 10pt. `phone/light/textscale-2x-cushion-forecast.png` reads
**`A… S… S… O… O… O…`** and the `--- your $200 line` legend has slid up into the same band, its leading dashes
overlapping the labels. `phone/light/textscale-2x-progress.png` shows the identical failure on the trajectory
chart (`A… Se… Se… O… O…`, one tick lost entirely) with `…your $200 line · room after each paycheck` overlapping.
**Clamped in source?** **no** — `CashRunwayChart.tsx:236` and `TrajectoryChart.tsx:493` carry `numberOfLines={1}`
but no `maxFontSizeMultiplier`, so ⭐ **the web frame does NOT over-report here.** This is one of the few Pass-B
observations that is if anything an **under**-statement: real AX5 is ~3.1× against a 40–48pt fixed-width box.
**Confidence:** high

### V3-11
**Severity:** minor · **Pass:** B-visual
**Surface/Site:** `money-debts` — `ListRow` (`apps/rn/src/components/ui/ListRow.tsx`)
**Finding:** At 2× the row's amount column runs off the right edge of the screen — the title takes a line to
itself, the `Focus` badge wraps below it, the meta line clips, and `$100/` is cut mid-string by the viewport.
**Evidence:** `phone/light/textscale-2x-money-debts.png`. The chevron is gone from the row entirely.
**Clamped in source?** **partially** — `numberOfLines={1}` on title/meta/caption and `right: { flexShrink: 0,
maxWidth: '45%' }` bound the *title's* squeeze (the L5-16 fix), but the amount `<Text>` at `:117` has **neither**
`numberOfLines` nor `maxFontSizeMultiplier`, so nothing bounds the case where the amount itself exceeds 45%.
**⚠️ Web over-reports here** on two counts: the clamp is ignored, and the nested amount-suffix `<Text>` at `:118`
compounds (V3-R1 confirms `maxFontSizeMultiplier` would inherit into it in the real app). **Downgraded from major.**
**Confidence:** medium — the *class* is real (L5-16 fixed one side of this squeeze and left the other open); the
severity shown in the frame is not.

### V3-12
**Severity:** polish · **Pass:** B-visual
**Surface/Site:** `progress` hero — `apps/rn/src/app/(tabs)/progress.tsx:177`
**Finding:** The debt-free date truncates to `October 2…`.
**Evidence:** `phone/light/textscale-2x-progress.png`.
**Clamped in source?** **yes** — `maxFontSizeMultiplier={1.3} numberOfLines={1}`. **Web over-reports here; the
clamp bounds it in the real app** (26pt → 33.8pt max, not 52pt). **Downgraded from major to polish.**
**Confidence:** medium — at the clamped 1.3× on a 320pt phone the hero's right column may still truncate a long
month name, but that is a P6.14 measurement, not this frame's.

### V3-13
**Severity:** minor · **Pass:** B-visual
**Surface/Site:** `today` — the `PlanHero` eyebrow, `apps/rn/src/components/plan/PlanHero.tsx:142`
**Finding:** `THIS PAYCHECK · SEP 4` overflows the hero card's right edge (the `·` is clipped) and takes three lines.
**Evidence:** `phone/light/textscale-2x-today.png`; two lines already at `textscale-1.35x-today.png`.
**Clamped in source?** **no** — `textStyles.footnote` + `styles.eyebrow` (`letterSpacing: 1, fontWeight: '700'`),
no `numberOfLines`, no `maxFontSizeMultiplier`. ⚠️ It sits inside a `Pressable`, so nesting-compounding inflates it;
and `letterSpacing: 1` is a fixed point value that does **not** scale, so the frame's proportions are wrong in both
directions. **The clipping specifically is an artifact** (the app would wrap, not clip); the *unclamped* status is real.
**Confidence:** medium

### V3-14
**Severity:** minor · **Pass:** B-visual
**Surface/Site:** `cushion-forecast` — `SumRow`, `apps/rn/src/components/plan/CashRunwayChart.tsx:225-226`
**Finding:** A negative amount breaks across lines and **strands its minus sign on the row above** — the frame reads
`Expenses & essentials` / `−` / `$450`, so the sign and the figure are on different lines.
**Evidence:** `phone/light/textscale-2x-cushion-forecast.png`.
**Clamped in source?** **no** — neither `<Text>` in `SumRow` carries `numberOfLines` or `maxFontSizeMultiplier`.
**Confidence:** medium — a money figure that can lose its sign to a line break is a legibility hazard worth a
`numberOfLines={1}` regardless of scale, but the exact break point here is instrument-driven.

### V3-15
**Severity:** minor · **Pass:** B-visual
**Surface/Site:** The bottom tab bar, every scaled phone frame
**Finding:** All three tab labels are clipped mid-glyph at 1.35× and effectively gone at 2×.
**Evidence:** `textscale-1.35x-today.png` shows `T…y  P…s  M…` sheared horizontally by the bar's bottom edge;
`textscale-2x-today.png` shows only fragments. Corroborates V3-8's direction.
**Clamped in source?** no (app side) — see V3-8; the navigator's own handling could not be read in this tree.
**Confidence:** low — react-native-web's tab bar is not iOS's, and iOS's own tab bar has native Dynamic Type
behaviour this frame says nothing about. **P6.14.**

---

## Three coverage holes in the matrix that `matrix/README.md` does not list

`matrix/README.md` names two unreached surfaces (`log-payment`, `living-expense-sheet`), both of which
**failed loudly** — a timeout with a log line. These three failed **quietly**, which is worse.

### V3-16
**Severity:** major · **Pass:** B-visual *(instrument — affects V1, V2, V3, V4 and O1, not just this lens)*
**Surface/Site:** `apps/rn/tests/shots/p6.8-matrix.shot.ts:107` — `{ name: 'onboarding', goto: '/onboarding', seedOver: { prefs: { onboardingComplete: false } } }`
**Finding:** ⛔ **Every `onboarding.png` in the matrix is a picture of the Today screen.** The onboarding
surface has **zero** frames, in any viewport, in either theme, at any text scale — and unlike the two
documented timeouts it produced a plausible, correctly-named, non-empty file for each.
**Evidence:** Read `phone/light/onboarding.png` and `ipad-portrait/light/onboarding.png` — both show `Good
morning`, the paycheck hero, the Payday Guardian card and the tab bar/rail. `phone/light/textscale-2x-onboarding.png`
is **byte-identical** to `phone/light/textscale-2x-today.png` (md5 `b8dc1e2f…` for both). That is **14 frames**
(5 viewports × 2 themes + 2 scales × 2 themes) plus the `p6.8-a11y` tree if it uses the same recipe.
⚠️ **I am deliberately not stating a mechanism.** The seed helper at `:53-56` does spread `prefs` last, so
`onboardingComplete: false` *should* win — which means the cause is somewhere else (rehydration order, the
`Stack.Protected` guard at `_layout.tsx:270-281`, or `scenario()`), and per Law IV a mechanism offered here would
be a hypothesis. The **fact** is what I am asserting.
**Clamped in source?** n/a
**Confidence:** high on the fact (byte-identical files + two read frames); **none offered** on the cause.

### V3-17
**Severity:** major · **Pass:** B-visual *(instrument)*
**Surface/Site:** the `textscale` block, `p6.8-matrix.shot.ts:272` — `test.use({ viewport: VIEWPORTS.phone })`
**Finding:** **Text scale was shot at ONE width (402pt) only.** `phone-small` (320pt) — the viewport the spec's own
comment calls *"the narrowest shipping iPhone width — where truncation starts"* — has **0 text-scale frames**, and so
do all three wide viewports.
**Evidence:** counted per viewport: `phone` 20 · `phone-small` 0 · `ipad-portrait` 0 · `ipad-landscape` 0 ·
`split-view` 0. **Narrowest × largest is the worst case for every finding in this lens, and it was never shot.**
Every 320pt observation in V3-3, V3-6, V3-10, V3-11 is therefore an extrapolation from 402pt.
**Clamped in source?** n/a
**Confidence:** high

### V3-18
**Severity:** minor · **Pass:** B-visual *(instrument)*
**Surface/Site:** the `textscale` block — surface and state coverage
**Finding:** ⛔ **None of V3-1's six unclamped large figures appears in a single text-scale frame.** The set covers
10 routes at the **default seed only** — no sheets, and none of the `empty/single/many/huge/long-names` states.
**Evidence:** `history` at the default seed is empty (`textscale-2x-history.png` shows *"No finished cycles yet"*),
so `history.tsx:43`'s `anchorNum` never renders. The other five (`AmortizationView` · `BillBreakdownSheet` ·
`SpokenForSheet` · `PaydayCaptureSheet` · `WhatIfControls`) all live in sheets or sub-views, and the 14 sheet
frames are shot at 1× only. The `huge` state ($847,362.55 — the widest string the app can produce) also has no
text-scale frame, which is the exact **long-value × large-text** intersection this lens was pointed at.
**Clamped in source?** n/a
**Confidence:** high

---

## Summary

| id | sev | pass | site | clamped? |
|---|---|---|---|---|
| V3-1 | major | A | six 30–34pt figures, 6 files | **no** |
| V3-2 | minor | A | `WhatIfControls` 34pt edit row | **no** |
| V3-3 | minor | A | `ListRow` left column | partial (`numberOfLines` only) |
| V3-4 | minor | A | `Screen` pushed-route header | partial (`numberOfLines` only) |
| V3-5 | major | A | `TrajectoryChart` `endPillW` char-width estimate | **no** |
| V3-6 | major | A | chart labels: fixed width, fixed offsets, fixed plot height | **no** |
| V3-7 | minor | A | `BillSearch` `height: 44` + `paddingVertical: 0` | **no** |
| V3-8 | polish | A | tab bar labels 11pt | **no** (navigator unread) |
| V3-R1 | ⛔ refuted | A | *"RN doesn't scale `lineHeight`"* — **false**, verified in installed source | — |
| V3-9 | major | B | the harness inverts the type hierarchy | n/a |
| V3-10 | major | B | chart x-labels → `A… S… S…`, collide with legend | **no** ⭐ not over-reported |
| V3-11 | minor | B | `ListRow` amount off-screen | partial · downgraded |
| V3-12 | polish | B | `October 2…` | **yes** · downgraded |
| V3-13 | minor | B | `PlanHero` eyebrow overflow | **no** (clipping is artifact) |
| V3-14 | minor | B | `SumRow` strands a minus sign | **no** |
| V3-15 | minor | B | tab labels clipped | **no** · low confidence |
| V3-16 | major | B | ⛔ all `onboarding` frames are Today | n/a |
| V3-17 | major | B | text scale shot at 402pt only; 320pt never | n/a |
| V3-18 | minor | B | none of V3-1's six sites is in any scaled frame | n/a |

**If only one thing is fixed:** V3-6 + V3-5 — the charts. They are the only place where the failure is
*arithmetic in the source* (hard-coded pixel offsets and a 6.5pt-per-character width estimate) rather than a
missing prop, and V3-10 shows it is already visible at 2× on an instrument that does **not** flatter that site.

---

## What I could not judge

⛔ **True Dynamic Type behaviour is not in this audit and could not be. It is a P6.14 DEVICE ROW** — an iPhone
with Settings → Accessibility → Display & Text Size → Larger Text stepped through **Default, XXL, AX3 and AX5**,
in both themes, at 320pt (iPhone SE) and 402pt. Nothing short of that settles the following:

1. **V3-1 — whether the six unclamped 30–34pt figures actually overflow, and at which step.** The *absence* of
   the clamp is certain; the *consequence* is not. Five of the six are in sheets and none has a scaled frame (V3-18).
2. **V3-5 — the `endPillW` overflow.** The arithmetic guarantees the estimate is wrong; only a device shows how
   far past the plot edge the pill lands and whether it is clipped or merely ugly.
3. **V3-6 / V3-10 — how much of the chart's label row survives.** The frames show total collapse at a fake 2×;
   AX5 is ~3.1× with **no clamp at all**, so this is the one item where the device row may report *worse* than
   the instrument did.
4. **V3-2 — the `TextInput` at 34pt.** A `TextInput`'s intrinsic sizing under `fontScale` is not readable from styles.
5. **V3-7 — whether `height: 44` + `paddingVertical: 0` clips the search field's text or just crowds it.**
6. **V3-8 / V3-15 — the tab bar.** Two unknowns stacked: `@react-navigation/bottom-tabs` is **not installed in
   this tree** so I could not read its label handling, and iOS's tab bar is native chrome that the web bar does
   not model. ⚠️ The iPad **rail** (`tabBarPosition: 'left'`, `fontSize: 15`) is a second, entirely unshot case.
7. **V3-3 — whether 55% of a 320pt row is enough for a debt name.** `ListRow.tsx`'s own comment already asks for
   this device row by name; V3-17 means the matrix did not answer it either.
8. **Anything at 320pt.** V3-17: the narrowest × largest intersection has zero frames at any scale.
9. **The `huge` state ($847,362.55) at any text scale**, and **every sheet** at any text scale (V3-18).
10. **Onboarding, at all** (V3-16) — no frame of that surface exists in the matrix in any dimension.

⚠️ **Two of my Pass-B findings are about the instrument (V3-9, V3-16, V3-17, V3-18 — four, in fact), and I would
rather a refuter spent its budget on V3-1, V3-5 and V3-6 than on those.** The instrument findings are cheap to
verify and hard to argue; the three static ones are the work.
