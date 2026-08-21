# V1 — THEME PARITY

> Lens V1 of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Method: light vs dark frame of the same name, pair by pair, read as images; findings tied back to
> `apps/rn/src/theme/colors.ts` · `theme/elevation.ts` · `hooks/use-app-colors.ts` where a token can be named.
>
> ⚠️ Scope caveats inherited from `matrix/README.md`: web renders, not device. Shadows, native nav chrome,
> the iPad rail and any OS-level appearance behaviour are **device-owed (P6.14)** and are not judged here
> except where the frames themselves show a defect.

## The token ground (read before the findings)

- `background.primary` light `#e6ebf3` / dark `#07111f`; `background.secondary` (cards) light `#ffffff` / dark `#152340`.
- **The signature parity move:** `surface.hero*` is **CONSTANT in both themes** — the navy hero panel is
  `#0e2242→#0a1730` in light AND dark by design (`colors.ts` header comment). So a navy panel appearing
  identical in both frames is **intended**, not a missed theme. I do not file those.
- Light lifts by a navy-tinted shadow, dark lifts by value + a hairline luminous edge on hero only
  (`elevation.ts`). Dark cards have **no border token applied by the elevation helper** — separation in dark
  depends entirely on `#152340` card vs `#07111f` screen.
- `border.subtle` light `rgba(16,38,84,0.06)` / dark `rgba(255,255,255,0.08)` — both are very low-contrast;
  this is the token most likely behind any "the divider vanished" finding.

(Findings appended below as confirmed.)

---

## ⛔ READ FIRST — an instrument defect that will manufacture false theme findings

### V1-0 (instrument, not a product defect)
**Severity:** major *(against the MATRIX, not the app)*
**Surface:** `today.png` in all 5 viewports, both themes · plus `phone/dark/state-today-empty.png` and `phone/dark/progress.png`
**Frames:** `apps/rn/capture-ref/p6.8/*/{light,dark}/today.png`, `phone/dark/state-today-empty.png`, `phone/{light,dark}/progress.png`
**Finding:** Several frames were shot **mid entrance-animation**, and light and dark landed at *different* points in the same fade — so the pair looks like a theme defect when it is a shutter-timing artifact.
**Evidence:** I counted, per frame, the share of pixels sitting at the *exact* token value a settled frame must contain (`#ffffff`/`#e6ebf3` light, `#152340`/`#07111f` dark).
- Every `today.png`, every viewport, both themes: **0.0 %** card-token pixels (vs **40–44 %** on the settled `state-today-*.png` frames of the same screen).
- `phone/light/today.png` hero panel samples **`#798497` (L\*=54.9)** — halfway between `surface.heroTop` `#0e2242` (L\*≈13) and the light ground `#e6ebf3` (L\*≈93), i.e. ~50 % opacity. `phone-small/light/today.png` samples **`#616d82` (L\*=45.8)** — a *different* fraction, which is what randomness looks like, not a token.
- `phone/dark/today.png` at the same point is `#0a1a35` — essentially settled. So the light Today frame reads "washed out and low-contrast" purely because it was caught earlier in the fade.
- `phone/dark/progress.png`: the cash-flow bars are not only dimmer than light's, they are **physically shorter** (bars 3–5 are stubs) on identical data — a staggered grow-in caught mid-flight (`theme/motion.ts` `stagger`). Light's five bars are all full height and all `#99a6bb`–`#9fabc0`.
- `phone/dark/state-today-empty.png`: 6.6 % token-exact vs its light partner's ≥55 %. **Asymmetric — do not compare that pair.**
**Consequence:** ⛔ Any V1/V2/V3/V4 finding sourced from `today.png` or `phone/dark/progress.png` is unsafe. The settled substitute for the Today surface is **`state-today-single.png`**, which carries the same layout with the animation finished.
**Confidence:** high — measured, reproduced across five viewports, and the "different fraction per capture" is not explicable by a token.

---

## Findings

### V1-1
**Severity:** major
**Surface:** Guardian band chip — `CashRunwayChart` detail header · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/cushion-forecast.png` vs `apps/rn/capture-ref/p6.8/phone/dark/cushion-forecast.png`
**Finding:** The Guardian band label — the app's central signal — clears WCAG AA comfortably in dark and **fails it in all three states in light**, because the chip's tinted fill silently voids the contrast guarantee the warning token documents for itself.
**Evidence:** The chip is `backgroundColor: c.background.tertiary` with `color: stateColor` (`CashRunwayChart.tsx:203-204`), where `stateColor = at-risk ? accent.danger : tight ? accent.warning : text.secondary` (`:104`), at `textStyles.caption` — small text, so the floor is 4.5:1.

| band | light fg on `background.tertiary` `#dce4f0` | dark fg on `#0d1830` |
|---|---|---|
| clear (`text.secondary`) | `#5a6b82` → **4.25:1** ✗ | `#a6b9d4` → 8.83:1 ✓ |
| tight (`accent.warning`) | `#b45309` → **3.92:1** ✗ | `#fbbf24` → 10.57:1 ✓ |
| at-risk (`accent.danger`) | `#dc2626` → **3.77:1** ✗ | `#fb7185` → 6.55:1 ✓ |

I measured the *clear* case straight off the frame: light chip fill `#dce4f0` at 68 % of the chip rect with ink `#5a6b82`; dark chip fill `#0d1830` with ink `#a6b9d4` — matching the tokens exactly. ⚡ The sharpest part: `colors.ts:accent.warning` carries the comment *"amber-700 light ≥4.5:1 on white (AA for caption text)"* — **the guarantee is stated against white, and this chip is not white.** `#b45309` on `#e6ebf3`-family tertiary lands at 3.92.
**Confidence:** high for `clear` (measured in-frame both themes) · **medium** for `tight`/`at-risk` — those bands **do not appear in any seeded frame**, so their numbers are computed from `colors.ts` + the `stateColor` line, not seen. What would settle it: a frame seeded into a tight and an at-risk cycle. That seed does not exist in this matrix and is itself worth filing.

### V1-2 ⭐ the one that explains most of the others
**Severity:** major
**Surface:** app-wide — every light-theme surface whose ground is `background.primary` or `background.tertiary`
**Frames:** measured in `apps/rn/capture-ref/p6.8/phone/light/paywall.png`, `.../light/sheet-debt-sheet-edit.png`, `.../light/cushion-forecast.png`, `.../light/more.png` — and computed exhaustively from `apps/rn/src/theme/colors.ts`
**Finding:** The light palette's accent and secondary-text tokens were tuned against **white**, but the light *screen* ground is **`#e6ebf3`** and the light *chip* ground is **`#dce4f0`** — which costs ~0.8:1 and pushes **17 of the 32** token/ground pairs under WCAG AA, while **not one of the dark theme's 32 fails — its worst pair anywhere is 4.75:1.**

Every token × every background, computed from `colors.ts` (L = light pair, D = dark pair; ✗ = under 4.5:1, ✗✗ = under 3:1):

| fg token | on `background.primary` | on `background.secondary` | on `background.tertiary` | on `background.elevated` |
|---|---|---|---|---|
| `text.primary`   | L 14.49 · D 17.75 | L 17.34 · D 14.62 | L 13.54 · D 16.53 | L 17.34 · D 13.38 |
| `text.secondary` | L 4.54 · D 9.48 | L 5.44 · D 7.81 | **L 4.25 ✗** · D 8.83 | L 5.44 · D 7.14 |
| `text.tertiary`  | **L 3.89 ✗** · D 6.30 | L 4.66 · D 5.19 | **L 3.64 ✗** · D 5.87 | L 4.66 · D 4.75 |
| `accent.primary` | **L 4.17 ✗** · D 6.95 | L 4.99 · D 5.73 | **L 3.90 ✗** · D 6.48 | L 4.99 · D 5.24 |
| `accent.success` | **L 2.81 ✗✗** · D 9.62 | **L 3.37 ✗** · D 7.92 | **L 2.63 ✗✗** · D 8.96 | **L 3.37 ✗** · D 7.25 |
| `accent.warning` | **L 4.19 ✗** · D 11.34 | L 5.02 · D 9.34 | **L 3.92 ✗** · D 10.57 | L 5.02 · D 8.55 |
| `accent.danger`  | **L 4.03 ✗** · D 7.04 | L 4.83 · D 5.80 | **L 3.77 ✗** · D 6.55 | L 4.83 · D 5.30 |
| `accent.gold`    | **L 3.04 ✗** · D 13.10 | **L 3.64 ✗** · D 10.79 | **L 2.84 ✗✗** · D 12.20 | **L 3.64 ✗** · D 9.87 |

⚡ **Light floor 2.63:1 · dark floor 4.75:1.** All 32 dark cells pass; **17 of the 32 light cells do not**, four of them under 3:1. The tokens' own comments give the mechanism away — `accent.warning` is annotated *"amber-700 light ≥4.5:1 **on white**"* and `text.tertiary` *"4.66 (light card) / 5.19 (dark card)"* — both validated on `#ffffff` only. Nothing re-checked them against `background.primary`, which is where a very large share of secondary text actually sits.

**Instances I confirmed in the rendered frames** (so this is not a table of hypotheticals):
- `phone/light/sheet-debt-sheet-edit.png` — the **Delete** destructive action, `#dc2626` on the light sheet ground, measured **4.03:1**. Its dark partner is 7.07:1.
- `phone/light/paywall.png` — the *"Private by design — your financial data stays on this device"* line, `#5a6b82` on `#e6ebf3`, measured **4.54:1** (scrapes AA; its `text.tertiary` siblings on the same ground do not). Dark partner 9.48:1.
- `phone/light/cushion-forecast.png` — the Guardian band chip, see **V1-1**.
- `phone/light/more.png` — the `DATA` / `PREFERENCES` section eyebrows sit on `background.primary` in `text.tertiary` → 3.89:1.
- ⭐ `phone/light/money-debts.png` — **every unselected segmented-control label** (`Expenses`, `Goals`, `Avalanche`, and `Timeline` on Progress), `#5a6b82` on the `#dce4f0` track, measured **4.25:1**. Dark partner **8.83:1** — a 2.1× gap on a primary navigation control.
- ⭐ `phone/light/money-debts.png` — the **Add** and **Scan a statement** action labels, `#2f66ea` on `#e6ebf3`, measured **4.17:1**. Dark partner 6.96:1.
- `phone/light/not-found.png` — the **Go to Today** recovery link, the only control on the screen, `#2f66ea` on `#e6ebf3`, measured **4.17:1**. Dark partner 6.95:1.
**Confidence:** high on the arithmetic and on the four in-frame instances. **Medium** on the claim that all ten failing cells are actually rendered somewhere — I verified `accent.danger`, `accent.warning`, `text.secondary`, `text.tertiary` and `accent.primary` on light grounds; I did **not** find `accent.gold` used as a text colour anywhere (`grep 'color: c.accent.gold'` → 0 hits), and `accent.success` as text is mostly icons plus `history.tsx:43` and `RequiredActionsCard.tsx:106`. What would settle it: a per-token/per-ground usage census, which is `audit:surfaces`-shaped work and does not exist.

### V1-3
**Severity:** minor
**Surface:** row dividers and the Guardian split-bar track, app-wide · **Frames:** `apps/rn/capture-ref/p6.8/phone/{light,dark}/more.png`, `.../{light,dark}/onboarding.png` *(which renders Today — see V1-8)*
**Finding:** `border.subtle` is carried at **0.06 alpha in light and 0.08 in dark**, so every hairline divider and every unfilled bar track is ~1.7× fainter in light than dark.
**Evidence:** Profiled the same column through two `more.png` dividers in both themes: light steps `#ffffff → #f1f2f5 → #ffffff` (**ΔL\* 4.5**), dark steps `#152340 → #27344f → #152340` (**ΔL\* 7.8**). Identical numbers at both dividers, so it is the token, not a render. Same pair on the Payday Guardian split bar's unfilled track — light `#f1f2f5`, dark `#27344f` — which is `trackColor={c.border.subtle}` at `PaydayGuardianCard.tsx:267`. `colors.ts` → `border.subtle: { light: 'rgba(16,38,84,0.06)', dark: 'rgba(255,255,255,0.08)' }`.
**Confidence:** high on the measurement. **Medium** that it rises above polish — ΔL\* 4.5 is thin but not absent, and I am reading a web render at 1× rather than a Retina panel. What would settle it: the P6.14 device row.

### V1-4
**Severity:** minor *(web surface only — does NOT reach iOS)*
**Surface:** `DateField` on any sheet with a date · **Frames:** `apps/rn/capture-ref/p6.8/phone/dark/sheet-debt-sheet-add.png` (and `sheet-expense-sheet-add.png`) vs their light partners
**Finding:** The browser's own calendar-picker glyph inside `<input type="date">` renders **pure black on the dark navy field** — the only affordance telling you the field opens a picker, and in dark it is all but gone.
**Evidence:** Block scan found `#000000` on `#152340` at (352,656) and (352,672) of `phone/dark/sheet-debt-sheet-add.png` — **CR 1.35:1**. In `phone/light/sheet-debt-sheet-add.png` the same glyph is black on `#ffffff`. `DateField.web.tsx` styles `backgroundColor`, `color` and `borderColor` from `useAppColors()` but never sets the CSS `color-scheme` property, so the UA-drawn `::-webkit-calendar-picker-indicator` keeps its light-mode rendering.
**Evidence it stops at web:** `DateField.tsx` (native) is a `Pressable` + `@react-native-community/datetimepicker` with an explicit `themeVariant={scheme}` — no UA glyph exists there. So iOS is clean and this is confined to the Playwright surface, `dist/`, and the public marketing embed.
**Confidence:** high that the defect is real and web-only. **Low–medium** on severity: it turns on whether the shipped web build is user-facing enough to matter, which is an M1/W1 question, not mine.

### V1-5 ⭐ the "vanishing border" the brief asked for — and it vanishes in LIGHT, not dark
**Severity:** major
**Surface:** every text input, date field, picker, and dashed "add" button — i.e. all 7 sheets plus Money
**Frames:** `apps/rn/capture-ref/p6.8/phone/light/sheet-debt-sheet-add.png` vs `.../dark/sheet-debt-sheet-add.png`; `.../{light,dark}/state-money-debts-huge.png`
**Finding:** `border.default` in light composites to **almost exactly the colour of the ground it is meant to separate from**, so a light-theme form field has effectively **no outline** — it is delineated only by "white fill on a cool ground" — while the same field in dark carries a crisp, clearly lit 21-L\* edge.
**Evidence:** Raw pixel walk straight across a field's left border at `y=220` on `sheet-debt-sheet-add.png`:
```
LIGHT  x19 #e6ebf3(92.9)  x20 #e7e9ee(92.3)  x21 #ffffff(100.0)   ← border pixel is 0.6 L* from the ground
DARK   x19 #07111f( 4.9)  x20 #313d57(25.8)  x21 #152340( 14.0)   ← border pixel is 20.9 L* above the ground
```
The vertical walk at `x=200` gives the identical result. `#e7e9ee` is `rgba(16,38,84,0.10)` over `#ffffff` to the byte, and `#313d57` is `rgba(255,255,255,0.12)` over `#152340` to the byte — so both borders render *exactly as specified*. The token values are the defect, not the render.

Computed for all three border tokens (|ΔL\*| from the surface each one has to separate against):

| token | light: vs card / **vs ground** | dark: vs card / **vs ground** |
|---|---|---|
| `border.subtle`  | 4.5 / **2.6** | 8.2 / **17.2** |
| `border.default` | 7.7 / **0.6** | 11.8 / **20.9** |
| `border.strong`  | 13.7 / **6.6** | 19.5 / **28.6** |

⚡ The mechanism: a **dark tint at low alpha over a white fill lands back at the ground's own lightness**, whereas a **white tint over a dark fill lands brighter than everything**, which is why the identical construction works in one theme and not the other. `elevation.ts` says light "lifts by a soft navy-tinted shadow" — and it does, for *cards*. But a `TextField` gets no shadow (I walked x15–x19 in light: flat `#e6ebf3`, no gradient), so on light there is nothing left holding the control together.
**Second instance, no white fill to rescue it:** the dashed **Add** / **Scan a statement** buttons on Money. Row walk at `y=501` of `state-money-debts-huge.png`: light dash `#ced5e1` on `#e6ebf3` = **ΔL\* 7.8**; dark dash `#242d39` on `#07111f` = **ΔL\* 13.2**.
**Source:** `TextField.tsx:78` `borderColor: error ? c.accent.danger : c.border.default` · `DateField.tsx`/`.web.tsx` the same · `colors.ts` `border.default: { light: 'rgba(16,38,84,0.10)', dark: 'rgba(255,255,255,0.12)' }`.
**Confidence:** high — byte-exact, reproduced on two axes and on two different components, and the composited values match the tokens' arithmetic with no residue.

### V1-6
**Severity:** minor
**Surface:** every `SwitchRow` in its **off** state · **Frames:** `apps/rn/capture-ref/p6.8/phone/{light,dark}/sheet-expense-sheet-edit.png` ("Variable amount (estimate)", "Free trial or intro price")
**Finding:** The off-switch's thumb is left at the platform default **white** in both themes, which reads unambiguously in dark and turns the light off-switch into three near-whites stacked on each other.
**Evidence:** Measured over the control's rect. Light: thumb `#fafafa` (L\* 98.3) on track `#bfc7d6` (L\* 80.1) on ground `#e6ebf3` (L\* 92.9) — **thumb↔track ΔL\* 18.2**, and the track is *darker than the ground it sits on while the thumb is lighter*, so the control has no consistent figure/ground. Dark: thumb `#fafafa` on track `#38404b` (L\* 26.8) on ground `#07111f` — **thumb↔track ΔL\* 71.5**, ~4× the separation. `SwitchRow.tsx:15` sets `trackColor={{ true: c.accent.primary, false: c.border.strong }}` and **never sets `thumbColor`**; `#bfc7d6` and `#38404b` are `border.strong` composited over each ground, to the byte.
**Confidence:** **medium.** The measurement is exact but the render is not: iOS's `UISwitch` draws its own thumb shadow and hairline that RN-web does not, so the device may recover much of the 18 L\*. What would settle it: the P6.14 device row — a photograph of a light-mode off-switch on a real panel.

### V1-7
**Severity:** polish · ⚠️ possibly deliberate, see below
**Surface:** the primary CTA, app-wide · **Frames:** `apps/rn/capture-ref/p6.8/phone/{light,dark}/living-expenses.png` ("Add your first item"), `.../sheet-debt-sheet-add.png` ("Add debt"), `.../sheet-goal-sheet-add.png` ("Add goal")
**Finding:** In dark the primary CTA **is** the blue accent; in light it is a navy slab that is **indistinguishable from body text and from the hero panel**, so the app's most important control carries none of the accent identity in one of its two themes.
**Evidence:** `accent.brand: { light: '#0f172a', dark: '#5b9dff' }`. Contrast of the light CTA fill against the things it should not be confused with: vs `text.primary` `#111a2e` → **1.03:1**; vs `surface.heroBottom` `#0a1730` → **1.00:1**; vs `accent.primary` `#2f66ea` → 3.58:1. In dark, `accent.brand` and `accent.primary` are the **same hex**. Label legibility itself is fine in both (light white-on-navy 17.85:1, dark `#08111f`-on-blue 6.95:1) — this is about identity, not readability.
⚠️ **This is declared design, not an oversight**: `colors.ts` annotates the token *"primary CTA fill (navy light / blue dark)"* and the header calls light's navy "the brand ground". I am filing it because a lens asked to find *surfaces where one theme got design attention and the other did not* has to report that the light CTA and the light hero panel and light body text are all one value — but **this is a visual-system call for 🎯, not a defect**, and I would default to leaving it alone.
**Confidence:** high on the arithmetic · **low** that it should be actioned.

### V1-8
**Severity:** minor *(coverage gap in the matrix — hands off to V4 / O1)*
**Surface:** `onboarding` · **Frames:** `apps/rn/capture-ref/p6.8/*/{light,dark}/onboarding.png` (all 5 viewports)
**Finding:** **There is no onboarding frame in this matrix in either theme** — every `onboarding.png` renders the **Today** screen.
**Evidence:** All ten `onboarding.png` frames show the "Good morning" header, the `THIS PAYCHECK` navy hero and the Payday Guardian card — pixel-for-pixel the Today surface. Presumably the recipe's seed had onboarding already completed, so the route redirected. ⭐ **One silver lining I used throughout this slice:** unlike `today.png`, these frames are fully *settled* (40 %/44 % token-exact pixels), so they are the reliable Today pair. That does not change the fact that O1's primary surface was never shot.
**Confidence:** high on what the frames show; **medium** on the cause (redirect vs recipe) — settling it means re-running the recipe, not reading a frame.

---

## ⛔ Leads I chased and did NOT file — refuted by measurement

Listing these because each one *looked* like a finding on the frame and died when measured. If a refuter re-finds any of them, this is why it is not in the list.

| lead | what killed it |
|---|---|
| "The light Today screen is washed out and grey; dark is crisp" | Mid-animation capture, **V1-0**. Nothing to do with the theme. |
| "The dark Progress bars are dim and the light ones are solid" | The dark bars are also **shorter** on identical data — a staggered grow-in caught mid-flight. **V1-0.** |
| "The dark modal scrim barely dims the screen behind, light's dims hard" | Measured the `Money` title through the scrim in both: light ΔL\* **59.7**, dark ΔL\* **59.9**. Symmetric to within noise. `background.scrim` is fine. |
| "The trajectory chart's *Creditor 1/5/10* labels disappear in dark" | At 3× they are clean in both. Measured `text.tertiary` on card: light 4.66:1, dark 5.87:1 — dark is the *better* one. |
| "The `Appearance` segmented control has no selection pill in dark" | Crop was truncated. Both themes show the pill, and dark correctly has **Dark** selected — the app's own `themeMode` is honoured. |
| "The More-screen icon tiles vanish in dark at iPad width" | Block-boundary artifact in my own diff. Both present at 2×. |
| "`not-found` text sits 16 px lower in light at 320 px" | Crop shows the two aligned. Diff-block artifact. |
| "Placeholder text is weaker in dark" | Light `#68758b` on white **4.66:1**, dark `#8496b2` on card **5.19:1**. Dark is better; both pass AA. |
| "The paywall's *Best value* badge uses white ink in both themes, failing in dark" | Dark correctly uses `text.onAccent` `#08111f` on `#5b9dff` (6.95:1). Light uses `#ffffff` on `#2f66ea`. Both correct. |
| "The navy hero panel is a light-theme asset pasted onto dark" | It is **constant by design** (`colors.ts` `surface.*`), and the frames confirm it renders identically — including the `elevation.hero` split (light gets the drop shadow, dark gets the hairline luminous top edge). ⭐ This is the one place the theme system is working exactly as its own documentation claims. Overdue-warning text on the hero is byte-identical in both. |

---

## What I could not judge

- **Anything on a real panel.** Every frame is a react-native-web render at DPR 1. The three findings that turn on *how thin a hairline reads* — **V1-3** (`border.subtle`), **V1-5** (`border.default`) and **V1-6** (the switch thumb) — could all soften or sharpen on a Retina display, and **V1-6** additionally loses the `UISwitch` thumb shadow and hairline that iOS draws and RN-web does not. **P6.14 device row.**
- **Shadows and elevation as a *theme* signal.** `elevation.ts` carries its own ⚠️ that `boxShadow` + `overflow:'hidden'` may clip on iOS at the batched native build. Light lifts cards *entirely* by shadow (`background.secondary` white separates from `background.primary` by only **ΔL\* 7.1**), so **if that shadow clips on device, the light theme loses card separation altogether while dark — which lifts by value — is unaffected.** I cannot test it from a web frame, and it is the single highest-consequence device-owed item in this lens.
- **`log-payment` and `living-expense-sheet`.** Not in the matrix at all (matrix README hole 1). Two sheets have never been seen in *either* theme. `LogPaymentSheet` is the app's primary action.
- **Onboarding.** No frame exists — see **V1-8**.
- **The `tight` and `at-risk` Guardian bands.** Every seeded frame is `clear`. The two bands that actually mean something are unrendered in both themes, so **V1-1**'s numbers for them are computed, not seen. ⭐ *This is a matrix gap worth filing on its own: the Guardian band is the app's central signal and the matrix contains exactly one of its three states.*
- **`textscale-*` frames** — deliberately not read. They are V3's, and the matrix README is explicit that they over-report where a clamp exists.
- **Motion.** Ironically the only thing I *did* learn about it is **V1-0**: the entrance animations are slow enough relative to the capture to be caught mid-flight. Whether they are *too* slow is P6.14's call, not a still's.

---

## Summary

| id | severity | one line |
|---|---|---|
| **V1-0** | major *(instrument)* | `today.png` ×5 viewports, `dark/progress.png`, `dark/state-today-empty.png` shot mid-animation — will manufacture false findings for every visual lens |
| **V1-1** | major | Guardian band label fails AA in **all three** states in light (3.77–4.25:1), passes in dark (6.55–10.57:1) |
| **V1-2** | major | ⭐ Light accent/secondary tokens were validated on **white**; the light *ground* is `#e6ebf3`. **17 of 32** light cells fail AA, **0 of 32** dark. Seven instances confirmed in-frame |
| **V1-3** | minor | `border.subtle` 0.06 light / 0.08 dark → every divider and bar track 1.7× fainter in light |
| **V1-4** | minor *(web only)* | `<input type=date>` calendar glyph is black-on-navy in dark, **1.35:1** — no `color-scheme` set. Does not reach iOS |
| **V1-5** | major | ⭐ `border.default` in light lands **0.6 L\*** from the ground → light form fields and dashed buttons have **no outline**; dark's is 20.9 L\* |
| **V1-6** | minor | Switch off-state thumb left at platform white → 18.2 L\* thumb/track in light vs **71.5** in dark |
| **V1-7** | polish | `accent.brand` light is 1.00:1 against the hero and 1.03:1 against body text — the CTA has no accent identity in light. **Declared design; 🎯's call** |
| **V1-8** | minor | No onboarding frame exists in either theme — `onboarding.png` renders Today |

⚡ **The one sentence:** *the dark theme is the one that was designed; the light theme is the dark theme's tokens inverted and never re-measured against its own ground* — every major finding here (V1-1, V1-2, V1-5, and the softer V1-3/V1-6) is the same defect, which is that **light's surfaces are `#e6ebf3`-family and light's foreground tokens were all checked against `#ffffff`.**
