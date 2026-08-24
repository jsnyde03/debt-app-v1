# Cluster f — VISUAL half: independent verification (P6.8.9.2)

Verifier did not build any of these fixes. Gates run today on `v1.7-dev`:
`npm run lint:contrast` → **exit 0**, "every rendered token pair clears its floor";
`npm run lint:type-scale` → **exit 0**, "19 large figures checked". Both are inside
`lint:rn` (`package.json:41`), which CI runs at `.github/workflows/web-e2e.yml:92`.

---

## B6 / V1-2 — light-theme token contrast — **CLOSED**

**1. Is the observation closed?** Yes. Every light token the finding named has moved, in
`apps/rn/src/theme/colors.ts`: `text.secondary` `#445163` (`:42`), `text.tertiary` `#5b667a`
(`:43`), `accent.primary` `#2b5dd4` (`:55`), `accent.success` `#0d753a` (`:58`),
`accent.warning` `#a44c08` (`:59`), `accent.danger` `#c52222` (`:60`), `accent.gold` `#b0751e`
(`:61`). Re-derived the whole grid myself via `npx tsx scripts/check-contrast.ts --report`:
**light floor is now 4.52 on text cells (0 of 24 distinct pairs fail); dark unchanged and still 0
of 32.** The refuter's corrected sentence — "15 of light's 24 distinct pairs fail" — is now zero.
Named sites re-checked at source: the segmented-control unselected label reads
`c.text.secondary` (`apps/rn/src/components/ui/SegmentedToggle.tsx:78` region), `AddRow`,
`+not-found`, `FormSheet` Delete and `screen.tsx`'s eyebrow all read tokens, not literals — the
literal sweep below proves it mechanically.

**2. What else did the site do, and does it still?**
- *The three-step text ramp.* This is the property arithmetic alone would have destroyed, and the
  log says so. Verified independently: ΔE(secondary, tertiary) was **4.5** on the old tokens and is
  **9.0** on the new ones — the ramp is not merely preserved, it is stronger. `colors.ts:38-41`
  states the reason.
- *Semantic hue separation.* Deepening warning and danger could have collapsed them into one
  brown-red; they sit adjacent as `CashFlowSection` bar labels. ΔE(warning, danger) was **31.9**,
  is now **29.4** — an 8 % loss, nowhere near confusable.
- *Dark theme untouched.* Every dark cell in my `--report` run matches the V1-2 slice's table to
  two decimals (e.g. `dark text.secondary on tertiary 8.83`). Nothing regressed there.
- *No stale copies.* `grep` for the seven old hexes across `apps/rn/src` + `packages` returns
  exactly one hit — `CashFlowSection.tsx:37`, `'#dc2626'` inside a **gradient array**, which is
  decoration and deliberately raw (`:26-31`). The label on the same line reads `c.accent.danger`.
  Zero hits in tests.

**3. Was the implied remedy right?** Yes, and the build went past it. The finding's remedy was
"re-solve the light tokens against `#e6ebf3`/`#dce4f0`"; the gate additionally covers grounds that
are not `background.*` (`check-contrast.ts:210-218` — the hero panel, the gold pill, and
`accent.primary` on `accent.accentSoft`, which was 4.30 and no lens could have seen).

**What pins it.** `scripts/check-contrast.ts` **imports `colors` directly** (`:34`) and computes
WCAG luminance from the spec — it asserts on the SUBJECT, not a proxy. Reverting any token to its
old value is deterministic arithmetic that lands below 4.5 (old `text.secondary` on `tertiary` =
4.25), so the gate goes red by name. It also verifies the `never-text` exemption from source every
run (`:243-251`) and fails if `border.control` is defined but consumed by nothing (`:259-263`).

⚠️ **One hole in the literal check, reported not fixed.** `withoutGradients` (`check-contrast.ts:295`)
blanks *any* bracketed array containing a hex, not only a gradient. A token value copied into any
array literal — e.g. a colour list — is invisible to the check. Narrow, but it is the same shape as
the defect the check exists for.

⚠️ **What the gate cannot see, so the green is not over-read** (its own header says this,
`:20-25`): which pairs are actually on screen, non-token grounds beyond the seven listed, and
component-level `opacity`. **The CLASS is clean at the token level; it is not a rendered census.**

---

## V1-5 — `border.default` in light has no outline — **PARTIAL**

**1. Is the observation closed? For the FORM FIELDS, yes — verified in-frame, not from the log.**
A new token `border.control` exists — light `rgba(16,38,84,0.58)` / dark `rgba(255,255,255,0.40)`
(`apps/rn/src/theme/colors.ts:89`) — and `TextField.tsx:78`, `DateField.tsx:90`,
`DateField.web.tsx:53`, `Select.tsx:30`, `SegmentedToggle.tsx:64`, `RadioGroup.tsx:31,39`,
`CheckCircle.tsx:70`, `Button.tsx:53`, `money.tsx:835`, `paywall.tsx:321,324`,
`PaydayCaptureSheet.tsx:280,336,348,439,481`, `SaveForItSheet.tsx:119,142`, `WhatIfControls.tsx:81`,
`ImportDebtsSheet.tsx:128`, `BackupSheets.tsx:68,156` all read it — 23 sites.
My own row walk at `y=220` on the **re-shot** `apps/rn/capture-ref/p6.8/phone/light/sheet-debt-sheet-add.png`
(mtime 2026-08-24 11:42):
```
LIGHT  x10..x19 #e6ebf3  |  x20 #74819c  |  x21.. #ffffff     ← was #e7e9ee (0.56 L* from ground)
DARK   x10..x19 #07111f  |  x20 #727b8c  |  x21.. #152340
```
`#74819c` is `rgba(16,38,84,0.58)` over `#ffffff` to the byte. **Light 3.27:1, dark 4.46:1 against
the screen ground** — both now clear SC 1.4.11's 3:1, which is the refuter's reframing ("*neither*
theme passed"), correctly adopted rather than the lens's parity framing.

**⛔ 2. The finding's SECOND named instance was not reached.** V1-5 explicitly filed the dashed
**Add / Scan a statement** buttons as its second instance ("no white fill to rescue it").
`apps/rn/src/components/ui/AddRow.tsx:33` still reads `c.border.strong`, and it has **no fill at
all** (`:39-49`: `borderWidth: 1, borderStyle: 'dashed'`, no `backgroundColor`). I re-derived it:
`border.strong` light composites to `#bfc8d6` on `#e6ebf3` = **1.41:1 / ΔL\* 12.57**; dark `#39414c`
on `#07111f` = **1.83:1 / ΔL\* 22.30** — reproducing the refuter's corrected figures exactly, which
means **nothing moved here.** Confirmed on screen: `phone/light/money-debts.png` (11:26) still
contains 15 px of `#ced5e1` at y 500–667 — the DPR-1 antialiased dash — and **zero** px of any
stronger value.

**⛔ 3. The gate's stated reason for excluding `border.strong` is false of every one of its
consumers.** `colors.ts:74-76` and `scripts/check-contrast.ts:328-331` both justify the exclusion as
*"they are decoration — a divider, a card edge, an underline."* I enumerated all ten `border.strong`
consumers: **eight are `Switch` `trackColor.false`** (`more.tsx:317,323,343,352,360,396`,
`CloudBackupSheet.tsx:86`, `SwitchRow.tsx:15`) — which is a control **state**, named explicitly by
SC 1.4.11 — **one is the onboarding step dot** (`OnboardingLayout.tsx:32`), and **one is AddRow's
entire boundary.** Not one divider, not one card edge, not one underline. The exclusion may still be
the right call, but the mechanism written down for it does not describe the token's actual use, which
is the exact shape of defect this cluster's own lesson names.

**2. What did the site ALSO do, and does it still?**
- *The error state.* Every field's border was `error ? c.accent.danger : <token>`. Preserved at
  `TextField.tsx:78`, `ImportDebtsSheet.tsx:128`, `BackupSheets.tsx:156`; the error text below still
  wins over the note (`TextField.tsx:82-87`).
- *The transparent-fill controls — the ground question, asked again.* The gate models the border as
  composited over `background.secondary` (`check-contrast.ts:334`), which is the card case that
  caught the first attempt. But **four sites have no fill**: `SaveForItSheet.tsx:119,142` (inactive
  option is `'transparent'`), `WhatIfControls.tsx:81` (a bare `borderBottomColor`), and
  `CheckCircle.tsx:70` (the fill is a scaled-to-zero overlay when unchecked). There the border
  composites over the **ground**, not the card — a case the gate does not model. I computed it:
  **light 3.57–3.92, dark 3.55–3.79 across all four grounds.** It passes anyway, but by luck of the
  alpha, not by check.
- *Visual weight.* 0.58 alpha is a materially heavier line than `default`'s 0.10 on the segmented
  thumb and the secondary `Button`. That is a design consequence, not a correctness one, and no test
  or gate would notice if it were wrong.

**3. Was the remedy right?** Yes for the class it reached — a separate `control` token rather than
moving `default` is correct, because moving `default` would have thickened every divider.

**What pins it.** `check-contrast.ts:333-355` composites `colors.border.control` over the card fill
and holds it to 3:1 against **every** ground; reverting the alpha to 0.10 gives 1.01 in light and
fails by name. ⚠️ **But no test pins any SITE.** The only consumption check
(`check-contrast.ts:259-263`) passes if *any* file mentions the token — reverting `TextField.tsx:78`
to `c.border.default` alone leaves `lint:contrast`, `typecheck` and the suites all green.
---

## V2-1 — the debt-free hero date truncates at 402pt — **CLOSED-UNPINNED**

**1. Is the observation closed?** Yes, and I checked the two frames that carried the defect rather
than the log. `apps/rn/src/app/(tabs)/progress.tsx:52-57` now defines
`heroDateFit = { maxFontSizeMultiplier: 1.3, numberOfLines: 2, adjustsFontSizeToFit: true,
minimumFontScale: 0.7 }`, spread at `:200` (the live date) and `:125` (the paid-off line). On the
re-shot frames (mtime 2026-08-24 11:33):
- `phone/light/state-progress-single.png` — was `September 2…`, now renders **`September` / `2026`**
  whole over two lines. This is the seed the refuter identified as the ordinary one (a single
  $1,200 debt).
- `phone/light/state-progress-huge.png` — was `November 2…`, now **`November` / `2028`** whole.
- `phone-small/light/progress.png` (320) — was `Octob…`, now **`October` / `2026`** whole.

**2. What did the site ALSO do?**
- *V2-2's second instance was folded in unasked.* `progress.tsx:125` — `Every balance paid off` —
  shares `heroDateFit`. The slice filed that separately and it is closed by the same change.
  ⚠️ **No frame proves it**: no seed reaches the all-paid hero, so this half is source-only.
- *The clamp.* `maxFontSizeMultiplier: 1.3` survives the change (`:53`) — the V3 property on the
  same line was not lost while fixing the V2 one.
- *Vertical room.* Two lines grow the hero card. Checked in-frame at both widths: the ring row still
  aligns and the `$X to go` / `Next milestone` lines below are intact.
- ⚠️ *The 320 guarantee is not what the frame shows.* `adjustsFontSizeToFit` is a **no-op in
  react-native-web**; on the harness the two-line wrap does all the work. `October` fits 104 pt at
  26/800 but `September` will not, so at 320 the shrink is doing the work on iOS and **nothing here
  proves it.** The comment says exactly this (`progress.tsx:48-50`) and files it as a device row,
  which is the honest disposition.

**3. Was the remedy right?** Yes, and better than the finding's implied one. Two lines rather than
a smaller font is the right call because a break at the space (`September` / `2026`) preserves the
year, which is the information a one-line shrink or an ellipsis destroys.

**⛔ What pins it: nothing.** I searched `apps/rn/tests` and `apps/rn/src` for any assertion on the
hero date's fit — there is one month-year regex, `demo-containment.spec.ts:386`, and it reads
`innerText()`, which returns the **full** string even when RN-web line-clamps it, so it was green on
the original defect and would be green again. `lint:type-scale`'s floor is 30 pt (`check-type-scale.ts`)
and `heroDate` is 26 (`progress.tsx:258`), so the gate does not reach it either. **A regression here
needs a rendered-width assertion (`scrollWidth > clientWidth`, or a bounding-box check on the
heroDate element at 402 and 320) and no such test exists.**

---

## V2-6 — the coach mark occludes the cash-flow chart at short viewports — **WRONG-REMEDY**

**⛔ 1. The finding's observation still reproduces, and the fix made it 22 px worse.**
V2-6's Finding sentence is: *"at every SHORT viewport it lands on top of the cash-flow chart —
hiding the lower half of all five bars, the entire date axis, the … legend and the …
verdict."* I read the current, re-shot `apps/rn/capture-ref/p6.8/phone/light/progress.png` (11:26)
and it does exactly that. Column walk at `x=200`:
```
y 389..414  #a9b5c8 → #9facc0   ← a cash-flow BAR, cut off mid-bar
y 415       #f1f2f5             ← the callout card's border.subtle top edge
y 416..     #ffffff             ← the callout
```
The cropped card shows `CASH FLOW · NEXT 5 PAY CYCLES`, the Cushion/Timeline toggle, the five
amounts and the top of five bars — and then the callout. The date axis, the
`your $200 line · room after each paycheck` legend and the `Comfortable across the next few
paychecks` verdict are all still gone.
⚡ **The refuter measured the old callout top at 437. It is now 415.** `CoachMarkLayer.tsx:115` reads
`top = roomBelow ? below : Math.max(insets.top + 8, rect.y - (calloutH || ESTIMATED_CALLOUT_H) - ABOVE_GAP)`
with `ESTIMATED_CALLOUT_H = 144` (`:198`) and `ABOVE_GAP = 10` (`:201`) — so `569 − 144 − 10 = 415`,
reproduced to the pixel. Replacing 132 with 154 lifts the callout **22 px higher into the card
above.** The named occlusion is strictly worse than before the fix.

**What the fix DID close, and it is real but it is not this finding.** The refuter added a
measurement neither lens had — that at 402 pt the callout is 144 px, so `rect.y − 132` put its bottom
edge **12 px inside its own subject**, violating the branch's one documented guarantee. That is now
fixed: the height is measured on layout (`CoachMarkLayer.tsx:146-149`) and the callout clears the
trajectory card by 10. Visible in the frame.

**⛔ V2-6 named the mechanism that would actually close it and the fix did not touch it:**
*"The vertical axis still has no neighbour-awareness."* `top` is computed once at `:115` from
`rect` and `winH` alone and consumed unmodified at `:137`; nothing in the file reads any sibling's
frame. The horizontal axis got exactly this treatment at 4.1.5.5 (`:119-131`) and the vertical did
not. **What would close it:** clamp `top` so the callout's top edge does not cross the bottom of the
preceding card (which needs a measured neighbour, not a constant), or scroll the subject up so the
`below` branch is reachable, or render into the inter-card gap.

**2. Preserved properties.** The horizontal 4.1.5.5 anchoring (`:130-135`) is untouched; the
`onLayout` guard `if (h > 0 && h !== calloutH)` (`:148`) is correct against the feedback loop the
comment names; `nested`/`hosts` handoff (`:95-96`) unchanged.

**What pins it — and what it is actually about.** `apps/rn/tests/e2e/coach-marks.spec.ts:114-137` is
a genuinely good test of what it asserts: it was re-pointed from the `PAYOFF TRAJECTORY` label (a
proxy that passed with the defect planted) to `tutorial-target-trajectory-scrub`, **the rect the
layer itself measures**, and asserts `calloutBox.y + calloutBox.height <= subjectBox.y`. That is the
subject, not a proxy. ⛔ **But it pins the self-occlusion invariant, which is the refuter's
addendum — not V2-6.** It passes with the cash-flow card entirely covered, and it passes *more
easily* the higher the callout sits. **No test asserts the finding.**
---

## V3-1 — six large figures with no font-scale cap — **CLOSED**

**1. Is the observation closed?** Yes, all six at the cited sites, verified in the source:
`apps/rn/src/app/history.tsx:43` · `components/entities/AmortizationView.tsx:69` ·
`components/money/BillBreakdownSheet.tsx:55` · `components/payday/PaydayCaptureSheet.tsx:528`
(the `CountUp`, moved from `:482`) · `components/payoff/WhatIfControls.tsx:68` **and** `:69` (the
`Text` and the `TextInput`, V3-2's pair) · `components/plan/SpokenForSheet.tsx:59`. Each carries
`maxFontSizeMultiplier={1.3}`, the house value. `npx tsx scripts/check-type-scale.ts --report`
lists all 19 large figures in the tree, every one `ok`.

**2. What did the site ALSO do?** Adding a prop is low-risk, and I checked the two ways it could
still go wrong: the `WhatIfControls` `TextInput` keeps its `accessibilityLabel`, `keyboardType`,
`selectTextOnFocus` and `placeholderTextColor` (`:70-79`), and `PaydayCaptureSheet`'s `CountUp`
keeps its `value`/`format` so the count-up animation is unaffected (`:525-531`). The
`PlanHero` comment that caused the miss — *"the three tab heroes were the ONLY large figures with no
font-scale cap"* — is **gone** (grep for it returns nothing), which is the right disposition: it was
false, and annotating a false claim leaves it readable.

**3. Was the remedy right?** Yes, and the build improved on it — the finding named a list, the fix
gated the class.

**⭐ The gate out-found the slice, and its exemption is still justified — I re-checked rather than
assumed.** `scripts/check-type-scale.ts` sets `LARGE_PT = 30` (`:44`) and argues the point rather
than listing exemptions: `title1` is 28, the largest **prose** size, and clamping prose overrules
the accessibility user it is meant to protect. I enumerated `title1`'s consumers myself — five, all
prose headings: `screen.tsx:80` (the screen title) and `WelcomeStep.tsx:63`, `PaycheckStep.tsx:90`,
`FirstDebtOrBillStep.tsx:110`, `CompletionStep.tsx:60` (onboarding headings). **Not one is a figure
in a hand-sized container.** The exemption holds.
I also checked the 24–30 band the floor excludes, in case a *figure* hides there: `progress.tsx:255`
`ringPct` (26) and `:258` `heroDate` (26) are clamped anyway (`:194`, `:53`), `paywall.tsx:408`
`priceText` (24) uses `adjustsFontSizeToFit`/`minimumFontScale`, `ShareCard.tsx:99` is
`allowFontScaling={false}` on an image export. **Nothing large is unclamped below the floor.**

**What pins it.** `check-type-scale.ts` parses the real TSX with the TypeScript AST and resolves
each element's style against the file's own `StyleSheet.create` and the shared scale
(`:69-98`) — it asserts on the **subject**, not a proxy. Removing any of the six props makes
`clamped` false and the run fails by file, line and style name.
⚠️ **Three declared blind spots, and I confirmed two are harmless here.** It cannot see a size
composed at runtime, a style spread from a variable, or an inline `style={{ fontSize: … }}` — I
grepped for the last: **zero** inline `fontSize` in JSX across `apps/rn/src`. And a JSX **spread**
attribute is not recognised as a clamp (`:107` guards on `ts.isJsxAttribute`), so
`progress.tsx`'s `{...heroDateFit}` would read as unclamped — that errs toward a false FAIL, the
safe direction, and does not fire today because `heroDate` is 26.

---
## V3-5 — the debt-free pill's width estimate is unscaled — **CLOSED-UNPINNED**

**1. Is the observation closed?** Yes.
`apps/rn/src/components/payoff/TrajectoryChart.tsx:303-304`:
```ts
const labelScale = Math.min(fontScale, LABEL_SCALE_MAX);
const endPillW = (20 + (debtFreeDate ? shortDate(debtFreeDate).length : 8) * 6.5) * labelScale;
```
with `fontScale` from `useWindowDimensions()` (`:137`) and `LABEL_SCALE_MAX = 1.2` (`:38`), and the
pill's own text carries `maxFontSizeMultiplier={LABEL_SCALE_MAX}` (`:430`) — **the same ceiling**.
The clamp at `:429` consumes it unchanged. I checked the arithmetic rather than the description:
rendered width is `padding + len·6.5·s`, the estimate is `(padding + len·6.5)·s`, so for `s ≥ 1` the
estimate is an **upper bound** and is **exact at s = 1**. That is the property that matters for a
clamp bound, and a flat ×1.2 fudge would have got the bound right at AX and wrong at 1×, which is
where nearly every user is.

**2. What did the site ALSO do?** The pill's position at 1× — this is the one a wrong fix breaks,
because a mis-scaled estimate moves the pill for everybody, not just AX users. `labelScale` is
`min(1, 1.2) = 1` on the default setting, so `endPillW` is byte-identical to the old expression at
1×. Confirmed on the current frame: `phone/light/progress.png` renders the `Oct 2026` pill on the
bead, correctly placed. `numberOfLines={1}` and the `testID` are preserved.

**3. Was the remedy right?** Yes.

**⛔ What pins it: nothing, and nothing on this harness can.** `fontScale` is **always 1** in
react-native-web, so no Playwright test can drive `labelScale` above 1; the `textscale-*` frames are
a CSS approximation that ignores `maxFontSizeMultiplier` and therefore **over-reports** here, where a
clamp exists. `lint:type-scale`'s floor is 30 pt and `endPillText` is 11 (`:603`), so the gate does
not reach it. The expression is also inline in the render body rather than an exported pure
function, so it cannot be unit-tested as it stands. **This is a P6.14 device row by construction.**

---

## V3-6 — chart labels grow while their fixed boxes do not — **PARTIAL**

**1. All five named styles now carry the ceiling.** `TrajectoryChart.tsx`: `yLabel` `:380-381`,
`xLabel` `:390-392`, `waypointLabel` `:413,415`, `scrubReadoutText` `:448` — each
`maxFontSizeMultiplier={LABEL_SCALE_MAX}` + `numberOfLines={1}`; and `CashRunwayChart.tsx:172`
`maxFontSizeMultiplier={1.2} numberOfLines={1}`. The specific failure the lens named — *a
`width: 40` `<Text>` with no line limit does not truncate, it **wraps**, two stacked lines
overflowing upward into the curve inside a hard `H = 200`* — is closed on all of them.
The ceiling is argued in the file rather than asserted (`:28-36`), and it is scoped to chart labels
only, which is the right scope: prose elsewhere still scales freely.

**⛔ 2. One constant V3-6's own Evidence quoted was left unscaled — and its sibling in the same file
was scaled.** V3-6 listed `left: clamp(scrub.x - 60, PAD.l, w - PAD.r - 132)` among "the offsets are
all constants". At `TrajectoryChart.tsx:447` it still reads exactly that: **`132`, not multiplied by
`labelScale`**, twelve lines after `endPillW` was. And the readout's own style permits more than
132: `scrubReadout` has `maxWidth: 172` (`:606-613`) with no fixed width, so it sizes to its content
— `"Sep 2026  ·  $5,722  ·  9 mo"` at 11 pt. **The clamp's right bound assumes 132 while the style
allows 172**, so at the 1.2 ceiling a readout that measures 132 at 1× becomes ~158 and overhangs the
bound by ~26 pt; a readout already near `maxWidth` at 1× overhangs by up to 40. This is precisely
V3-5's mechanism — a hand-written width estimate used as a clamp bound — on the element V3-6 cited,
and the fix scaled one and not the other.

**3. Was the remedy right?** For the labels, yes, and the reasoning is worth keeping: the boxes
cannot be made fluid without rewriting the plot, so bounding the growth is the proportionate fix.
⚠️ **What it does NOT do, so the green is not over-read:** the boxes, gutters and offsets still do
not scale, so at the 1.2 ceiling the widest y-label (`$900k` at 12 pt in a 32 pt box, `:576`) will
**ellipsize rather than wrap** — degraded, which is what the lens itself rated "medium on severity",
not fixed.

**What pins it: nothing.** Same reason as V3-5 — `fontScale` is 1 on web, the `textscale-*` frames
over-report wherever a clamp exists (which is now all five sites), and `lint:type-scale`'s floor of
30 pt is far above 9–11 pt labels. **Every V3 claim here that rests on real Dynamic Type is a device
row.**

---
## V4-8 — a labelled chart with no curve reads as failed — **PARTIAL**

**1. The named instance is closed.** `apps/rn/src/utils/skia-ready.ts` returns a constant `true`
(native), `skia-ready.web.ts:24-44` subscribes to the shared, module-memoised `LoadSkiaWeb` promise,
and `TrajectoryChart.tsx:138` reads it. Every RN-drawn element of that card is now behind it: the
y-labels, x-ticks, waypoints and endpoint pill (`:374` `{skiaReady ? (`), the `Now` marker (`:463`)
and the whole legend (`:469`). The card is wholly loading or wholly drawn. The finding's own remedy
("gate the labels on the same condition as the canvas") was right, and the log is honest that the
condition did not exist and had to be built.

**2. ⛔ The gate opens BEFORE the canvas draws, by construction — and R4 named the reason.**
`WithSkiaWeb` (`apps/rn/node_modules/@shopify/react-native-skia/lib/module/web/WithSkiaWeb.js`)
awaits `LoadSkiaWeb(opts)` and **then** calls `getComponent()` — sequentially, inside one `lazy`.
`TrajectoryCanvas.web.tsx:18` passes `getComponent={() => import('./TrajectorySkiaChart')}`.
`useSkiaReady` awaits **only** `LoadSkiaWeb`, so `skiaReady` flips true at the exact moment the
dynamic chunk fetch *begins*, and for its whole duration the labels are on screen over a
`ChartSkeleton`. ⚡ **That extra chunk is precisely what R4 identified as why the trajectory canvas
loses this race** — "it carries an extra dynamic `import('./TrajectorySkiaChart')` chunk on top of
the shared CanvasKit load." The window is narrowed, not closed.

**⛔ 3. The class is not closed — the sibling chart still does it.**
`apps/rn/src/components/plan/CashRunwayChart.tsx` renders `CashRunwayCanvas` (`:150`), whose web
build falls back to `ChartSkeleton` (`CashRunwayCanvas.web.tsx:19`), while its x-labels (`:172`),
the Guardian band chip (`:203`), the legend and the verdict sentence are RN and **ungated** —
`useSkiaReady` is imported by exactly one file (`TrajectoryChart.tsx:16`). So the Cushion-forecast
card can still render a confident axis and a `Clear` verdict over an empty plot. The V2 slice
photographed exactly this ("`phone/light/cushion-forecast.png` renders an empty chart — gridlines
and axis, no curve"). **f's own after-scan says "c, d and e closed LISTS; f gated CLASSES" — on this
id it closed an instance.**

**⚠️ 4. A new failure mode the fix introduces.** `skia-ready.web.ts:32-38` memoises
`loading ??= LoadSkiaWeb(...)` at module scope with **no `.catch`**. If CanvasKit fails to load —
the 404-on-a-base-path case `utils/canvaskit.ts` exists to document — `resolved` never becomes true,
`loading` stays a rejected promise for the life of the page, and the trajectory card renders a
skeleton with **no labels, no legend and no date, permanently**, plus an unhandled rejection.
Before the fix a failed load produced a wrong-looking chart; now it produces an empty card with no
information and no error. Arguably the better failure, but it is a **permanent** state now and
nothing surfaces it.

**What pins it.** `apps/rn/tests/e2e/trajectory-domain.spec.ts:29-33` waits for
`trajectory-x-tick` to be visible, and those ticks now render only when `skiaReady` — which is what
made the log's plant (`useSkiaReady` forced `false` → 3 tests red) meaningful. ⚠️ **But read what it
asserts:** it proves the gate is *wired*, i.e. that the fix cannot silently stop firing. It does
**not** assert the finding — nothing checks that the labels are ABSENT while the canvas is a
skeleton, and deleting the `skiaReady ?` wrapper entirely would leave the whole suite green.

**Severity, unchanged from R4:** web-surface only. `ChartSkeleton` is imported by five `.web.tsx`
files and nothing on the native path; `skia-ready.ts` is a constant `true` on native. Structurally
unreachable on iOS.

---

# The two gates — are the CLASSES clean, not just the ids?

Both run green today: `npm run lint:contrast` exit 0; `npm run lint:type-scale` exit 0, 19 figures
checked. Both are inside `lint:rn` (`package.json:41`) and CI runs `lint:rn`
(`.github/workflows/web-e2e.yml:92`). Both assert on the **subject** — `check-contrast.ts:34`
imports the real `colors` tree, `check-type-scale.ts` parses the real TSX with the TypeScript AST —
so neither is the V2-6 proxy shape.

## `lint:type-scale` — the class IS clean, and the exemption is still justified

- All 19 large figures carry a cap. The floor of 30 is argued (`:38-46`), not asserted.
- **The exemption re-checked, not assumed.** The only shared style in the 28–30 band is
  `title1`; I enumerated its five consumers — `screen.tsx:80` and the four onboarding headings
  (`WelcomeStep.tsx:63`, `PaycheckStep.tsx:90`, `FirstDebtOrBillStep.tsx:110`,
  `CompletionStep.tsx:60`). **All prose. None is a figure in a hand-sized container.** The argument
  that clamping a heading overrules the accessibility user it protects still holds for every site it
  covers.
- I also swept the 24–30 band for a *figure* hiding under the floor. `ringPct` (26),
  `heroDate` (26), `priceText` (24) and `ShareCard`'s `statVal` (26) are all clamped or frozen by
  other means. **Nothing large is unclamped.**
- Blind spot confirmed harmless: zero inline `style={{ fontSize: … }}` in `apps/rn/src`.

## ⛔ `lint:contrast` — the TOKEN grid is clean; the CLASS is NOT

The grid itself is exhaustive and green (see B6/V1-2). But the gate's scope leaves a live hole, and
walking it turned up **two rendered AA failures in dark that no lens and no gate reports**:

| site | ink | ground | dark CR | floor |
|---|---|---|---|---|
| `apps/rn/src/components/ui/ListRow.tsx:205` (`deleteText`, 15 pt / 700) | literal `'#ffffff'` | `c.accent.danger` (`:157`) | **2.69 ✗** | 4.5 |
| `apps/rn/src/components/plan/SpokenForSheet.tsx:166` (`ctaText`) | literal `'#fff'` | `c.accent.primary` (`:99`) | **2.72 ✗** | 4.5 |

Both are white ink on a light-valued **dark-theme** accent fill. **The correct token is already
defined and would fix both**: `text.onAccent` dark is `#08111f`, which scores **7.03** and **6.95**
on those same fills. Light passes at 5.79 / 5.80, so this is dark-only — the inverse of B6, and the
reason it survived a sweep aimed at light.

**Why the gate cannot see them, and it is by design in two places at once:**
1. `GROUNDS` is `background.*` only (`check-contrast.ts:96`). An `accent.*` **fill** used as a
   ground is invisible except for the seven hand-listed `EXTRA_PAIRS` (`:210-218`) — which include
   `text.onAccent` on `accent.brand` but not white on `accent.danger` or `accent.primary`.
2. The literal-equals-a-token check excludes `#ffffff` and `#000000` as `PRIMITIVE` (`:279`) and its
   regex only matches 6-digit hex, so `'#fff'` is not even scanned.

Each exclusion is individually well-argued in the file. **Together they leave "white ink hardcoded
on a semantic accent fill" completely uncovered — and it is the single most common way a colour
reaches the screen without a token.** The gate's own header says it judges what the token system
permits, not what is on screen (`:20-25`); this is that limit, with two live instances behind it.

⚠️ Also uncovered, stated so it is not read as clean: `TrajectoryChart.tsx:603` sets
`endPillText` to a literal `'#10264f'` on a literal `gold` (`:308`). It **passes** (6.44 light /
9.95 dark), but it is two raw values with no token and no check on either side.

_Scratch files used for the pixel walks were written to `.verify-tmp/` and removed._
