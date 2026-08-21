# V2 — SIZE CLASS

> Lens V2 of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Reads `apps/rn/capture-ref/p6.8/<viewport>/<theme>/*.png` across
> phone (402) · phone-small (320) · ipad-portrait (834) · ipad-landscape (1194) · split-view (507).
>
> ⚠️ Per `matrix/README.md` hole 3: **a wide viewport on web is NOT an iPad.** The tab bar becomes a
> left rail on native and the overlay origin is `0` on web at every width. Nothing below claims a
> rail / native-navigation finding from these frames; those are routed to **P6.14**.
>
> Findings only. Nothing fixed.

## Findings

**14 findings: 0 blocker · 6 major · 6 minor · 2 polish.** ⚠️ No blocker is declared deliberately —
nothing found here stops the app working at any width, and this project has measured that agent-declared
blockers survive refutation about a third of the time.

### V2-1
**Severity:** major
**Surface:** Progress — payoff hero (`ringMeta`) · **Frames:** `apps/rn/capture-ref/p6.8/phone-small/light/progress.png` vs `apps/rn/capture-ref/p6.8/phone/light/progress.png` (dark pair identical)
**Finding:** The debt-free DATE — the single headline number of the whole app — truncates to `Octob…` at 320pt, and ⚡ **a third viewport in the same matrix proves it also truncates at 402pt** (`November 2…`) whenever the month name is longer than "October".
**Evidence:** `phone-small/light/progress.png` renders `DEBT-FREE` / **"Octob…"**; `phone/light/progress.png` renders **"October 2026"** whole. Then `apps/rn/capture-ref/p6.8/phone/light/state-progress-huge.png` — same 402pt width, same hero, same ring — renders **"November 2…"**. ⚡ Two frames at the SAME width, one truncated and one not, differing only in the month: the box is sitting exactly on the boundary and October is the string that happens to fit.
Source: `apps/rn/src/app/(tabs)/progress.tsx:177` sets `numberOfLines={1}` on `styles.heroDate` (`fontSize: 26, fontWeight: '800'`), inside `ringMeta: { flex: 1 }` sharing `ringRow` with a fixed `ringWrap: { width: 112 }` and `gap: spacing.lg` (20). Arithmetic reproduces the frames: 402 − 40 (`screenPaddingH`×2) − 44 (`hero` padding `cardPaddingH+2`×2) − 132 (ring + gap) = **186pt**; 320 leaves **104pt**. At 26/800, `October 2026` ≈ 180pt and `November 2026` / `September 2026` / `December 2026` are each wider — so on the DEFAULT iPhone width the app's headline projection is ellipsized for a large share of possible payoff months, before any Dynamic Type is applied. The `maxFontSizeMultiplier={1.3}` on the same line shows the fixed size was already known to be tight.
**Confidence:** high — three frames, two of them at the same width, plus box arithmetic that lands on the observed threshold. What I have NOT measured is exactly which months cross it; a text-measurement pass would name them, and that is the only open part.

### V2-2
**Severity:** minor
**Surface:** Progress — debt-free resting state (the `paidOff.length > 0` hero) · **Frames:** not captured; source-derived from the same box measured in V2-1
**Finding:** The app's single celebration line — **"Every balance paid off"** — is set in the same 26pt/800 `heroDate` style under the same `numberOfLines={1}`, and it is far too long for the box at 320.
**Evidence:** `apps/rn/src/app/(tabs)/progress.tsx:102` — `<Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={[styles.heroDate…]}>Every balance paid off</Text>`. ⚠️ Corrected against the code rather than assumed: this branch has **no ring**, so its box is the full card interior (236pt at 320, 318pt at 402), not V2-1's 104pt. At 26/800 the string is roughly 290pt — so it fits at 402 and clips at 320. Unlike V2-1 this branch has **no frame in the matrix**: no seed reaches "all debts cleared", so it is unaudited by all four visual lenses at once.
**Confidence:** medium — the style, the clamp and the string are certain from source; the ~290pt width is estimated, not measured, and the 402 verdict depends on it. Settle it by capturing a paid-off seed at 320 and 402.

### V2-3
**Severity:** minor
**Surface:** Today — PlanHero suggestion line · **Frames:** `phone-small/light/today.png` vs `phone/light/today.png`
**Finding:** The suggestion strip truncates at 320 (`Suggested · $1,350 · Extra payment to C…`) where it fits whole at 402.
**Evidence:** 320 frame shows the ellipsis mid-word on the debt name; 402 shows `…Extra payment to Card`. Source: `apps/rn/src/components/plan/PlanHero.tsx:170` — `numberOfLines={1}` on `suggestText`. This one is a defensible clamp (it is a secondary caption, and the same information is stated in full by the Guardian card below), so it is filed as minor rather than as the same class as V2-1.
**Confidence:** high

### V2-4
**Severity:** major
**Surface:** Cushion forecast (pushed-route header) · **Frames:** `phone-small/light/cushion-forecast.png` vs `phone/light/cushion-forecast.png`
**Finding:** The screen title truncates to **"Your cushion forec…"** at 320, and the source comment that authorises the one-line clamp asserts a premise the app has since outgrown.
**Evidence:** 320 renders `‹ Your cushion forec…`; 402 renders it whole. Source `apps/rn/src/components/screen.tsx` — `numberOfLines={onBack ? 1 : 2}`, whose comment reads *"`onBack` is the pushed-route signal: those titles are short nouns ("More", "History") that never need a second line."* Of the four pushed routes in `src/app/`, two are **not** short nouns — `cushion-forecast` (*"Your cushion forecast"*) and `living-expenses` (*"Everyday spending"*, which at 320 lands within ~10pt of the padding edge). The clamp is being enforced against an inventory that no longer matches. ⚠️ The `‹` back glyph plus its `gap: spacing.sm` is what pushes it over: `headerLeft` is `flexShrink: 1` sharing the row with the ••• button.
**Confidence:** high — visible in the frame, and the source comment names the exact premise that is false.

### V2-5
**Severity:** major
**Surface:** all four pushed routes (`more` · `history` · `living-expenses` · `cushion-forecast`) at iPad widths · **Frames:** `ipad-landscape/light/cushion-forecast.png` · `ipad-landscape/light/history.png` · `ipad-landscape/light/more.png` vs `ipad-landscape/light/today.png`
**Finding:** At iPad widths the sidebar rail **disappears entirely** the moment the user opens any of the four pushed routes — the tab surfaces render a rail at x0–360, the pushed routes render none — so a secondary screen takes over the whole 1194pt canvas with only a `‹` glyph to get back.
**Evidence:** Compare `ipad-landscape/light/today.png` (rail present, content starts x=360) with `ipad-landscape/light/cushion-forecast.png` and `…/history.png` (no rail, content column centred across the full 1194). This is structural, not a web artifact: `src/app/cushion-forecast.tsx`, `history.tsx`, `living-expenses.tsx` and `more.tsx` live **outside** `src/app/(tabs)/`, so the tab navigator (and with it `tabBarPosition: 'left'` at `(tabs)/_layout.tsx:59`) unmounts on push. On iPhone that is correct — a push covers the tab bar. On iPad it is the phone navigation model applied at tablet width. ⚠️ **Routing caveat:** the *rail rendering itself* is device-owed per `matrix/README.md` hole 3; what I am filing is the **route-hierarchy** fact, which is readable from `src/app/`'s directory shape and is true on every platform.
**Confidence:** medium — the route hierarchy is certain and the frames agree; what I cannot judge from stills is whether an iPad user actually experiences this as disorienting, and whether 🎯 considers "pushed routes are full-screen everywhere" a deliberate call. Settle it on device (P6.14) or as a scope call.

### V2-6
**Severity:** major
**Surface:** Progress — the `trajectory-scrub` coach mark over `CashFlowSection` · **Frames:** `phone/light/progress.png` · `phone-small/light/progress.png` · `ipad-landscape/light/progress.png` (broken) vs `split-view/light/progress.png` · `ipad-portrait/light/progress.png` (correct)
**Finding:** The "Drag the curve" coach mark is a **height-keyed** layout, and at every SHORT viewport it lands on top of the cash-flow chart — hiding the lower half of all five bars, the entire date axis, the `your $200 line · room after each paycheck` legend and the `Comfortable across the next few paychecks` verdict.
**Evidence:** ⚡ The two tall frames (507×1194 and 834×1194) render the callout as a clean card **below** the trajectory card with nothing occluded; the three short frames (402×874, 320×568, 1194×834) render it **across** the cash-flow card. Mechanism, confirmed numerically against the frames: `apps/rn/src/components/plan/CoachMarkLayer.tsx` —
```js
const below = rect.y + rect.height + 12;
const roomBelow = winH - below - insets.bottom > 140;
const top = roomBelow ? below : Math.max(insets.top + 8, rect.y - 132);
```
On the 874-tall phone the subject's `rect.y ≈ 570`, so `below ≈ 882 > 874` → `roomBelow` false → `top = 570 − 132 = 438`; the callout in `phone/light/progress.png` starts at **y ≈ 437**. The fallback branch only guarantees it will not cover *the subject* — the docstring says exactly that (*"a callout that covers it explains something the user can no longer see"*) — and says nothing about the card above it, which on Progress is the other primary instrument on the screen. The `132` is a hardcoded guess at the callout's own height, so it is wrong by construction the moment the copy wraps differently.
⚠️ This is the **same defect class** the file's own 4.1.5.5 note already fixed on the horizontal axis (*"one axis was anchored to the subject and the other to the window"*). The vertical axis still has no neighbour-awareness.
**Confidence:** high — five frames split cleanly by viewport HEIGHT (not width), and the arithmetic reproduces the observed y to within a pixel.

### V2-7
**Severity:** minor
**Surface:** every pushed route's back control · **Frames:** `phone/light/cushion-forecast.png` (measured at 8× crop), identical at all five widths
**Finding:** The `‹` back control's tap target is **~30pt wide** — below 44pt at every viewport — and the glyph itself measures ~6pt.
**Evidence:** An 8× crop of the header puts the rendered `‹` at ~6pt of advance width. Source `apps/rn/src/components/screen.tsx`: `<Pressable testID="screen-back" hitSlop={12}>` wrapping a bare `<Text style={textStyles.title2}>‹</Text>` — `title2` is `fontSize: 22` (`src/theme/typography.ts:26`), and a chevron at that size has a narrow advance. 6 + 12 + 12 ≈ **30pt**. Height passes (~22pt line box + 24 ≈ 46pt); width does not. Every other pressable in the tree that was audited for this carries an explicit `minHeight: 44` (`SegmentedToggle:105`, `Button:86`, `SwitchRow:21`, `CoachMarkLayer:192`, `FormSheet:202`) — this one relies on hitSlop alone and the arithmetic does not reach.
**Confidence:** medium — the hitSlop and the font size are certain; the exact glyph advance is measured off a rasterised frame rather than from a layout dump, so the true figure could be 28–34pt. It is under 44 either way. Settle it with a `measure()` on `screen-back` on device.

### V2-8
**Severity:** minor
**Surface:** Money — Debts, the master-detail split · **Frames:** `ipad-landscape/light/money-debts.png` vs `ipad-portrait/light/money-debts.png`
**Finding:** The master-detail split holds at landscape and correctly collapses at portrait, but it leaves the screen with **two segmented controls at wildly different widths** — `Debts | Expenses | Goals` stretched across the full 794pt canvas while `Snowball | Avalanche` is squeezed into the 340pt list pane, with its own caption wrapping to two lines beside 450pt of empty pane.
**Evidence:** In `ipad-landscape/light/money-debts.png` the top toggle spans x=383…1174 (≈265pt per segment) while the strategy toggle spans x=383…719 (≈167pt per segment) and *"Smallest balance first — quick wins. Your debts are listed in payoff order."* wraps to two lines, where the same sentence sits on one line at 834 portrait. Source: `money.tsx:103` passes `wide={isExpanded && view === 'debts'}` so the whole screen goes full-canvas, but only the debt LIST goes into `MasterDetail`'s `LIST_PANE_WIDTH = 340` (`src/components/ui/MasterDetail.tsx`); everything above the split keeps the full width. The split itself is correct — `detailEmpty` reads *"Select a debt to edit, or add one."* and renders properly.
**Confidence:** high on what is rendered; **medium** that it is a defect rather than an accepted trade — `LIST_PANE_WIDTH` is a deliberate constant and the split is per its 3.6.1 design lock. Settle it as a visual-system call.

### V2-9
**Severity:** minor
**Surface:** Money — Expenses and Goals at iPad widths · **Frames:** none exist
**Finding:** `wide={isExpanded && view === 'debts'}` means switching Money's own segmented control at 1194 silently changes the screen's layout MODE — full-canvas master-detail on Debts, 800pt centred column on Expenses and Goals — and **no frame in the matrix shows the other two tabs at any width above 402**.
**Evidence:** `apps/rn/src/app/(tabs)/money.tsx:103`. The matrix captures `money-debts` only; `money-expenses` / `money-goals` are not in `apps/rn/capture-ref/p6.8/*/`. So the one place in the app where a *within-screen* control flips the layout mode is unphotographed on the widths where the flip happens.
**Confidence:** high that the branch exists and is uncaptured; **low** on whether the transition actually looks wrong. Settle it by adding `money-expenses` and `money-goals` to the ipad-landscape shot list.

### V2-10
**Severity:** major
**Surface:** `resolveIsExpanded` and every consumer of it · **Frames:** `ipad-portrait/light/today.png` · `ipad-landscape/light/today.png` (both show the measurement), no frame exists at the boundary width
**Finding:** `isExpanded` is computed from the **window** width while every consumer of it lives inside a canvas that is ~360pt narrower, so the two-column and master-detail decisions are made against ~43% more room than the layout actually has.
**Evidence:** `apps/rn/src/utils/sizeClass.ts` — `resolveIsExpanded(width) = width >= 1024`, fed from `useWindowDimensions()` in `use-layout.ts`. But at both iPad widths the tab navigator occupies a fixed left band: in `ipad-portrait/light/today.png` and `ipad-landscape/light/today.png` the rail runs x=0…~359 and screen content begins at x=360 — measured identical at 834 and at 1194, i.e. **fixed, not proportional**. So at 834 the content canvas is 474pt (43% of the window is chrome), and at the `isExpanded` threshold of 1024 it is **664pt**. `MasterDetail` then takes `LIST_PANE_WIDTH = 340` plus `paddingLeft: spacing.xl` off that, leaving a detail pane of **~300pt** — narrower than an iPhone SE — to hold the inline `DebtSheet` editor that `money.tsx:410` passes `inline={isExpanded}`. The 1194 frame is comfortable (detail ≈ 455pt) purely because it is 170pt past the threshold.
⚠️ **Routing:** I am NOT claiming the rail renders wrongly — `matrix/README.md` hole 3 owns that and it is device-owed. The claim is arithmetic: **the predicate and the room it is predicting about are two different numbers**, and nothing in `use-layout.ts` subtracts the chrome.
**Confidence:** medium — the 360pt band and the constants are measured; what is NOT measured is any window between 1024 and 1194 (Stage Manager, iPad mini landscape at 1133, a 70/30 Split View), because the matrix has no such viewport. Settle it by shooting `money-debts` at exactly 1024×768 and looking at the detail pane.

### V2-11
**Severity:** polish
**Surface:** Premium paywall · **Frames:** `phone-small/light/paywall.png` vs `phone/light/paywall.png` vs `ipad-portrait/light/paywall.png`
**Finding:** At 320 the entire commercial offer — all three price rows and the `Start Premium` CTA — is below the fold with no sticky footer, where at 402 two of three price rows are already visible and at 834 the whole page including legal text fits without scrolling.
**Evidence:** `phone-small/light/paywall.png` ends mid-benefit-list ("Recovery Plan — a guided catch-up"); `phone/light/paywall.png` shows Annual / Lifetime / Monthly; `ipad-portrait/light/paywall.png` shows everything down to the Terms/Privacy links. `apps/rn/src/app/paywall.tsx` uses the standard `Screen` scroller with no `footer` prop, so the CTA scrolls. The benefit list is what pushes it down and it does not shorten at 320.
**Confidence:** high on what the frames show; **low** that it is a defect — a scrolling paywall is normal and the offer is two swipes away. Filed as polish so P1/M1 can decide whether the CTA should be pinned; not a size-class bug on its own.

### V2-12
**Severity:** minor
**Surface:** Money — debt rows, long names · **Frames:** `phone/light/state-money-debts-long-names.png`; **no 320 counterpart exists**
**Finding:** Debt names already ellipsize at the default 402pt width (`Chase Sapphire Preferred C…`, `Navient Federal Consolidat…`), and the narrowest shipping width has no frame for this state at all.
**Evidence:** The 402 frame truncates both rows. At 320 the row's text column loses a further 82pt, so roughly 5–6 more characters go — meaning two different long-name debts could render as visually identical rows. ⚠️ **The whole `state-*` set (empty · single · many · huge · long-names) was captured at phone width ONLY** — `apps/rn/capture-ref/p6.8/phone/*/state-*.png`, nothing under `phone-small/`, `split-view/`, `ipad-*/`. That is exactly the intersection (narrowest width × longest content) where truncation lives, and it is the reason V2-1 was found by accident rather than by design: the `state-progress-huge` frame that proved the 402pt failure exists only because the *state* axis happened to include it.
**Confidence:** high that the 402 truncation is real and that the 320 frames are missing; **low** on the 320 severity, because I am extrapolating rather than reading a frame. Settle it by shooting the five `state-*` seeds at 320.

### V2-13
**Severity:** major
**Surface:** all 9 sheets (`DebtSheet` · `ExpenseSheet` · `GoalSheet` · `AddObligationSheet` · backup sheets · …) at iPad widths · **Frames:** none exist — sheets were shot at 402 only (`phone/*/sheet-*.png`)
**Finding:** Every sheet is a full-window-width bottom sheet at every viewport — nothing caps or centres it — so on iPad landscape a "Add a debt" form spans the entire **1194pt** canvas with two fields in it.
**Evidence:** `apps/rn/src/components/ui/sheet-styles.ts` — `sheet: { maxHeight: '92%', borderTopLeftRadius…, paddingHorizontal: layout.screenPaddingH }`. There is **no `maxWidth`, no `alignSelf`, no `width`**, and `backdrop: { flex: 1, justifyContent: 'flex-end' }` stretches the child across the full window. `use-sheet-presentation.ts` reads `useWindowDimensions()` for **height only** (`const { height: winH }`) and never consults width or `useLayout()`. The one width-aware escape is `FormSheet`'s `inline` pane (`FormSheet.tsx:80`), and it is reached from exactly one place — `money.tsx:410`, Debts only. So of the nine sheets, eight have no iPad presentation at all.
⚠️ This is the clearest instance of the brief's *"phone design at tablet width"*: it is not that the sheet looks slightly loose, it is that `maxWidth` was never in the style object.
**Confidence:** high on the source (the style has no width constraint and the hook reads height only); **medium** that it reads as broken rather than merely plain, because **no frame exists** — `matrix/README.md` confirms sheets were captured at phone width only. Settle it by shooting `sheet-debt-sheet-add` at 1194 and at 834.

### V2-14
**Severity:** polish
**Surface:** iPad sidebar rail width · **Frames:** `ipad-portrait/light/*.png` · `ipad-landscape/light/*.png` (all tab surfaces)
**Finding:** The rail occupies a **fixed ~360pt** at both iPad widths — 43% of the 834pt portrait canvas — for three items, and no width is set anywhere in the app.
**Evidence:** In every `ipad-*` tab frame the rail pill runs to x≈347 and screen content begins at x=360, identical at 834 and 1194. `(tabs)/_layout.tsx` sets `tabBarPosition: 'left'` and `tabBarVariant: 'material'` but never a width, so this is the navigator's default rather than a design decision. The consequence is measured in **V2-10**, which is the finding that matters.
⛔ **ROUTED, not filed as a defect:** `matrix/README.md` hole 3 puts rail rendering in **P6.14**. This entry exists so P6.14 has the measured number in hand.
**Confidence:** medium — the 360pt is measured off the frames, but web `material` variant defaults need not match the native rail. Settle it on device.

---

## What HELD, and is worth stating

Refutation should know what I looked at and did not file.

- **Split View (507×1194) is the healthiest viewport in the matrix.** Every one of the 10 routes renders correctly: bottom tab bar (not a rail), single column, no truncation, and Progress is the ONLY viewport besides ipad-portrait where the coach mark lands correctly (see V2-6). Nothing keyed on the tall height broke — the failures went the other way.
- **`MasterDetail` holds at landscape and collapses correctly at portrait.** `ipad-landscape/light/money-debts.png` shows the 340pt list pane, the hairline divider, and a real `detailEmpty` (*"Select a debt to edit, or add one."*) — not an orphaned or blank pane. `ipad-portrait` correctly renders the list alone, which is what `resolveIsExpanded`'s 1024 threshold intends.
- **`Screen`'s `maxContentWidth: 800` centring works.** Paywall, More, History, Living expenses and Cushion forecast are all capped and centred at 1194 rather than stretched — the "one enormous column" failure the brief asked about does **not** occur on the routes that use the default `Screen` path. The stretch problem is confined to sheets (**V2-13**).
- **`+not-found` is centred and correct at all five widths.**
- **Tap targets pass almost everywhere.** `SegmentedToggle` segments are 44pt min height and ≥89pt wide even at 320; `CheckCircle` is 28 + hitSlop 10 = 48; the sheet close button is 30 + 10 = 50; `MoreButton` is 24 + hitSlop 12 = 48. The single failure is the back chevron (**V2-7**).
- **320pt is genuinely a shipping width, so the 320-only findings are not hypothetical.** Verified rather than assumed: `apps/rn/node_modules/react-native/scripts/cocoapods/helpers.rb:84` returns `'15.1'` as the minimum iOS version, nothing in `apps/rn/app.json` raises it, and iOS 15 runs on iPhone SE (1st gen) at 320×568. `app.json` also sets `"supportsTablet": true`, so the iPad findings are about a shipping form factor too.

## Frame artifacts I judged NOT to be findings

Stated so a refuter does not have to re-derive them.

- **`onboarding.png` is Today, at all 5 viewports × both themes.** The seed sets `onboardingComplete: true`, so the recipe redirects. **Onboarding has zero frames in this matrix** at any width — it is not merely unaudited by V2, it is unaudited by all four visual lenses.
- **Several light frames were shot mid-entrance.** `phone/light/today.png` and `ipad-*/light/today.png` show washed-out cards and a slate-grey hero where `…/onboarding.png` (same route, same width) shows the seated navy. Compare the pair before filing any colour finding from `today.png`.
- **`phone/light/cushion-forecast.png` renders an empty chart** — gridlines and axis, no curve — while the same chart draws correctly at 320, 507, 834 and 1194. A capture race, not a width effect.
- **The bottom tab-bar labels are clipped by ~4pt at 320, 402 AND 507.** Identical at all three, including the 1194-tall split-view frame, so it is not a content-height problem: `insets.bottom` is `0` in the web harness, so the bar gets no bottom padding and the label baseline lands on the frame edge. On device react-navigation adds the home-indicator inset. **Device-owed → P6.14.**
- **The Payoff-trajectory curve is absent in every Progress frame** at every width. Constant across the size axis, so not mine — routed to V4 / W1.

## What I could not judge

- **The rail itself** — width, whether it renders at all on native, its behaviour under Split-View drag re-layout, and Stage Manager. `matrix/README.md` hole 3. **P6.14.** V2-14 records the measured 360pt so P6.14 does not start from zero; V2-10's arithmetic is the part that survives without the rail claim.
- **The 1024–1194 band.** `isExpanded` flips at 1024 and the matrix's only expanded frame is 1194. iPad mini landscape (1133), a 70/30 Split View, and any Stage Manager window in that band are unphotographed — and V2-10 says that is exactly where `MasterDetail`'s detail pane gets thin. **Needs a 1024×768 shot, not a device.**
- **Sheets at any width but 402.** All 14 sheet frames are phone-only, so V2-13 is source-derived. **Needs shots, not a device.**
- **The `state-*` seeds at any width but 402** — empty · single · many · huge · long-names. The narrowest-width × longest-content intersection, which is where truncation lives, has no frames at all. V2-1's strongest evidence came from that set by accident. **Needs shots, not a device.**
- **`money-expenses` and `money-goals` at every width but 402** (V2-9) — including the one place a within-screen control flips the layout mode.
- **Onboarding at every width** — no frames exist (see artifacts above).
- **Progress's debt-free resting state** (V2-2) — no seed reaches it.
- **`log-payment` and `living-expense-sheet`** — `matrix/README.md` hole 1; never reached at any width.
- **Rotation** — no frame in the matrix is the same device turned. Every viewport is a fresh mount, so nothing here says whether a layout survives a live resize, which is precisely what `useWindowDimensions` exists for. **P6.14.**
- **Whether the truncations in V2-1/V2-3/V2-4 are worse under real Dynamic Type.** `matrix/README.md` hole 2 — web has no OS text scaling and ignores the `maxFontSizeMultiplier` clamps these very lines carry. **P6.14**, and V3 owns the hypothesis.
