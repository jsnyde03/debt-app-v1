# R4 — REFUTATION: VISUAL & CONTRAST

> Refuter R4 of the P6.8 audit. Target `2.0.0`, branch `v1.7-dev`.
> Brief: refute six findings drawn from lenses **V1** (theme parity), **V2** (size class), **V4** (state coverage).
> ⛔ Nothing fixed. Every number below is mine, re-derived — I did not carry a lens figure forward
> without recomputing or re-measuring it.

## Method, and the instrument check that had to come first

Three instrument defects were established during the audit (onboarding frames were photographs of Today;
`today.png` was shot mid entrance-animation with light and dark landing at different points in the same
fade; `light/state-today-empty.png` was a cold-start artifact). All four visual lenses read that
instrument. So my first act was to establish **which frames on disk today are settled**, because a finding
sourced from a mid-animation frame is refuted unless it reproduces on a settled one.

**Tooling.** `sharp` (repo root `node_modules`) → raw RGB; a token-exact histogram per frame; row/column
pixel walks; and an independent WCAG 2.x relative-luminance implementation written from the spec
(`lin(c) = c ≤ 0.04045 ? c/12.92 : ((c+0.055)/1.055)^2.4`; `L = .2126R + .7152G + .0722B`;
`CR = (L1+.05)/(L2+.05)`), plus CIE L\* for the border walks.

### ⚡ What the re-shoot actually fixed — and what it did NOT

| frame class | mtime | settled? |
|---|---|---|
| **route frames** (`today` · `progress` · `onboarding` · `cushion-forecast` · `more` · `paywall` · `money-debts` · `history` · `not-found` · `living-expenses`), all 5 viewports × both themes | **11:49–12:02** | ✅ **re-shot at the 1800 ms settle** |
| **`sheet-*.png`** (14 frames) | 11:26–11:27 | ⚠️ original run — but sheets are presented, not entrance-animated; see below |
| ⛔ **`state-*.png`** (32 frames) | **11:17–11:18** | ⛔ **NOT re-shot. Still the 700 ms instrument.** |
| ⛔ **`textscale-*.png`** (30 frames) | **11:18–11:19** | ⛔ **NOT re-shot.** |

I verified settledness rather than trusting the mtime. Token-exact share of each frame:

| frame | dominant token | share | partner | share |
|---|---|---|---|---|
| `phone/light/today.png` | `#ffffff` (card) | **40.05 %** | `phone/dark/today.png` `#152340` | **39.85 %** |
| `phone/light/progress.png` | `#ffffff` | **48.95 %** | `phone/dark/progress.png` `#152340` | **48.77 %** |

⚡ **The light/dark asymmetry V1-0 measured is gone** — 40.05 vs 39.85 % and 48.95 vs 48.77 % are the same
frame in two themes, to within a fifth of a percent. The re-shoot worked. **V1-0 is itself now historical
for the route frames.**

And `phone/light/onboarding.png` is now genuinely onboarding: **81.11 % `#e6ebf3`** with `#0f172a`
(`accent.brand` light, the CTA fill) at **5.11 %** and *no* `#0c1c38`/`#0c1d3a` hero-gradient pixels — where
`today.png` carries 2.40 % + 2.30 % of exactly those. The Today-photograph defect is fixed.

⛔ **But `state-*` and `textscale-*` were left on the old instrument.** That is load-bearing for **V2-1**,
**V4-7**, **V4-8**, **V4-9** and **V4-11** — all five are sourced from `state-*.png` frames — and it is
recorded against each verdict below.

---

### R4-V1-2 — light-theme AA failure across the token grid
**Verdict:** **CONFIRMED** *(with three corrections, none of which weaken it — one makes it worse)*

**Re-checked against which frame:** not primarily a frame claim. Re-derived from
`apps/rn/src/theme/colors.ts` with my own WCAG implementation, then re-confirmed in **four settled,
re-shot frames**: `phone/light/money-debts.png`, `phone/light/more.png`, `phone/light/not-found.png`,
`phone/light/cushion-forecast.png` (all **12:00–12:01**, the 1800 ms run). No `state-*` frame was used.

**My own measurement.** I wrote the luminance/contrast maths from the WCAG spec and ran the full
8-token × 4-background grid in both themes without looking at the lens's table. It reproduces
**cell for cell**:

```
cells per theme: 32
light <4.5: 17    light <3: 3    light floor: 2.63   (accent.success on background.tertiary)
dark  <4.5:  0    dark  <3: 0    dark  floor: 4.75   (text.tertiary on background.elevated)
```

Every one of the lens's 64 numbers matches mine to two decimals. **The arithmetic is right.**

**How I tried to break it — four attacks.**

**(1) The large-text exemption — the attack the brief expected to downgrade several. It downgrades
almost nothing.** WCAG's 3:1 floor needs ≥18pt (24 CSS px) regular or ≥14pt (18.66 px) **bold**. I pulled
the actual `fontSize`/`fontWeight` of every site the lens named:

| site | style | px / weight | large? | floor | measured | verdict |
|---|---|---|---|---|---|---|
| segmented-control unselected label (`SegmentedToggle.tsx:78`) | `textStyles.subhead` | **15 / 400** | no | 4.5 | `#5a6b82` on `#dce4f0` **4.25** | ✗ fails |
| `Add` / `Scan a statement` (`AddRow.tsx:35`) | `textStyles.bodyMedium` | **17 / 500** | no | 4.5 | `#2f66ea` on `#e6ebf3` **4.17** | ✗ fails |
| `Go to Today` (`+not-found.tsx:20`) | `textStyles.body` | **17 / 400** | no | 4.5 | **4.17** | ✗ fails |
| sheet **Delete** (`FormSheet.tsx:108,174`) | `textStyles.bodyMedium` | **17 / 500** | no | 4.5 | `#dc2626` on `#e6ebf3` **4.03** | ✗ fails |
| `Section` eyebrow, **app-wide** (`screen.tsx:121`) | `textStyles.footnote` | **13 / 400** | no | 4.5 | `#68758b` on `#e6ebf3` **3.89** | ✗ fails |
| Guardian band chip (`CashRunwayChart.tsx:204`) | `textStyles.caption` + `fontWeight:'700'` | **12 / 700** | **no** (12 < 18.66) | 4.5 | **4.25 / 3.92 / 3.77** | ✗ fails |
| `RequiredActionsCard.tsx:106` | `textStyles.subhead` | 15 / 400 | no | 4.5 | `#12a150` on `#ffffff` **3.37** | ✗ fails |
| `TrajectoryChart.tsx:463` | `textStyles.caption` | 12 / 400 | no | 4.5 | `#12a150` on `#ffffff` **3.37** | ✗ fails |
| `history.tsx:43` paid-down anchor | `anchorNum` **30 / 800** | **YES** | **3.0** | `#12a150` on `#e6ebf3` **2.81** | ⚡ **still fails** |
| `PaydayCaptureSheet.tsx:482` | `capturedAmount` **30 / 800** | **YES** | **3.0** | `#12a150` on `#e6ebf3` **2.81** | ⚡ **still fails** |

⚡ **Exactly two of the named sites qualify as large text, and both of them fail the 3:1 large-text floor
anyway** — because they are the `accent.success`-on-`background.primary` cell at 2.81, one of the three
cells under 3:1. The exemption attack fails completely. Every other site is 12–17 px at weight ≤ 500,
which is small text by any reading of SC 1.4.3.

**(2) Is anything sitting between the token and the ground at runtime?** I checked the composite path for
the four sites that matter most, and found the *opposite* of a rescue:
- `FormSheet` paints its own body `backgroundColor: c.background.primary` (`FormSheet.tsx:132`, and `:83`
  for the inline pane) — so the sheet **Delete** really is `#dc2626` on `#e6ebf3` (4.03), not on a white
  card (4.83). The lens had this right, and it is the *worse* of the two possibilities.
- `SegmentedToggle` sets `backgroundColor: c.background.tertiary` on the track directly (`:61`), with only
  a `border.subtle` hairline over it.
- `Section` renders inside `Screen`'s root, which is `backgroundColor: c.background.primary`
  (`screen.tsx:59`). No card.
- The chip in `CashRunwayChart.tsx:203` is `backgroundColor: c.background.tertiary`, flat.

**(3) Confirmed in-frame, on settled frames, by pixel search rather than by eye.** I searched each frame
for the exact token value and classified every hit by the dominant colour in its 15×15 neighbourhood:

| frame (settled) | token found | on ground | px | y-band |
|---|---|---|---|---|
| `phone/light/money-debts.png` | `#5a6b82` | **`#dce4f0`** | clustered | y 81–88 **and** y 312 — *both* segmented controls |
| `phone/light/more.png` | `#68758b` | **`#e6ebf3`** | **93** | y 520–832 |
| `phone/light/more.png` | `#68758b` | `#ffffff` | 912 | y 108–772 *(these pass, at 4.66)* |
| `phone/light/not-found.png` | `#2f66ea` | **`#e6ebf3`** | 80 | y 452–462 |
| `phone/light/cushion-forecast.png` | `#5a6b82` | **`#dce4f0`** | **34** | y 327–335 *(the Guardian chip — R4-V1-1)* |

So the failing pairs are not hypothetical: five are on screen in the current, settled capture.

**(4) The usage census the lens admitted it never did — this is where it bends.** I ran it, over every
`color:` / `color=` consumer of the two tokens that between them supply **8 of the 17** failing cells:

- ⚡ **`accent.gold` is used as a text colour ZERO times in the entire tree.** Its only foreground use is
  one 22 px icon (`PayoffInvitationCard.tsx:36`); everything else is `backgroundColor` on a badge
  (`MilestoneAckCard.tsx:36`, `PaidOffArchive.tsx:55`), and `progress.tsx:41–45` reads
  `colors.accent.gold.**dark**` explicitly — the light token is never resolved there at all. So gold's
  **4 failing cells are not AA text failures.** The icon is governed by **SC 1.4.11 non-text contrast at
  3:1**, which it passes on `primary` (3.04) and `secondary` (3.64) and fails only on `tertiary` (2.84).
- `accent.success` **is** used as text — the 4 sites above — but **never on `background.tertiary`.** Its
  `tertiary` cell (**2.63 — the quoted "floor"**) is reached only by `Pill.tsx:26`'s transparent-fill
  `paid` pill, whose ground is whatever sits behind it, and by icons. ⚠️ **So the headline floor of
  2.63:1 is a grid minimum, not a rendered minimum.** The worst *rendered text* pair I can evidence is
  **2.81** — and even that is source-derived, because `phone/light/history.png` is the **empty** state and
  contains **0 px of `#12a150`**: `summary.paidDown > 0` is false, so the anchor never renders in any frame.

**Two arithmetic corrections to the lens, one in each direction.**
- ⛔ The prose says *"four of them under 3:1"*. Its own table marks **three** (`✗✗` at 2.81, 2.63, 2.84),
  and I count three. The prose is wrong.
- ⚡ **The "17 of 32 vs 0 of 32" symmetry is a miscount — and it flatters the light theme.** In light,
  `background.secondary` and `background.elevated` are **the same hex** (`#ffffff`); in dark they are
  distinct (`#152340` / `#1a2a49`). So light has only **24 distinct token×ground pairs, of which 15 fail —
  62.5 %**, against the reported 53 %. Dark genuinely has 32 distinct pairs and 0 failures. The correct
  sentence is *"15 of light's 24 distinct pairs fail; 0 of dark's 32 do."*

**Residual doubt.** Three things I could not close.
1. **Whether all 17 cells are rendered.** I closed gold (not as text) and narrowed success. I did **not**
   build a full per-token/per-ground census for `text.tertiary`, `accent.primary`, `accent.warning` and
   `accent.danger` — I confirmed each has at least one live failing site, which sustains the finding but
   does not prove the whole grid is real. The defensible claim is **"≥ 9 of the failing cells are rendered
   somewhere, and 5 are visible in the current capture."**
2. **DPR 1.** Contrast ratios are resolution-independent, so this does not touch the arithmetic — but the
   *lived* severity of the 12–13 px cases could differ on a Retina panel. The numbers stand; the felt
   severity is P6.14's.
3. This is a **shipped-token** defect, not a capture defect — which is exactly why nothing about the
   instrument bug touches it, and why it survived unchanged.

⚡ **The most systemic finding in the audit, and it survives refutation intact.** The mechanism the lens
named is also correct and is admitted by `colors.ts`'s own comments: `accent.warning` is annotated
*"amber-700 light ≥4.5:1 **on white**"* and `text.tertiary` *"4.66 (light card)"* — both validated against
`#ffffff`, while the light **screen** is `#e6ebf3` and the light **chip** is `#dce4f0`.

---

### R4-V1-1 — Guardian band chip fails AA in all three states in light
**Verdict:** **CONFIRMED for `clear`** (measured in-frame, both themes) · **CONFIRMED-BY-COMPUTATION for
`tight` and `at-risk`**

**Re-checked against which frame:** `apps/rn/capture-ref/p6.8/phone/{light,dark}/cushion-forecast.png` —
**both re-shot at 12:00, both settled** (light is 43.69 % `#ffffff` / 28.77 % `#e6ebf3`; the mid-fade
signature V1-0 measured is absent). This finding was never at risk from the instrument bug.

**My own measurement.** Pixel search for the ink token, each hit classified by its dominant neighbouring
ground:

```
phone/light/cushion-forecast.png   #5a6b82 on #dce4f0 :  34 px,  y 327..335
phone/dark/cushion-forecast.png    #a6b9d4 on #0d1830 :  34 px,  y 327..335
```

⚡ **34 pixels, identical y-band, in both themes** — the same glyphs, byte-for-byte the tokens, with no
scrim or opacity between ink and fill. My contrast maths on those exact sampled values:

| band | light | dark | dark ÷ light |
|---|---|---|---|
| `clear` (`text.secondary` on `background.tertiary`) | **4.25 ✗** | **8.83 ✓** | 2.08× |
| `tight` (`accent.warning`) | **3.92 ✗** | **10.57 ✓** | 2.70× |
| `at-risk` (`accent.danger`) | **3.77 ✗** | **6.55 ✓** | 1.74× |

**How I tried to break it.**
- **Large-text exemption.** `CashRunwayChart.tsx:204` is `textStyles.caption` (**12 px**) with
  `fontWeight:'700'`. WCAG's bold threshold is **14pt = 18.66 px**. 12 px bold is small text; the floor
  stays **4.5**. ⛔ The exemption does not reach it.
- **Is the chip really on `background.tertiary`?** `:203` — `<View style={[styles.chip, { backgroundColor:
  c.background.tertiary }]}>`, and `styles.chip` (`:242`) is padding + `borderRadius: 999` only. Nothing
  tints it, and the 34 measured pixels match the token to the byte.
- **Is `stateColor` really those three tokens?** `:104`, verbatim: `cy.guardianState === 'at-risk' ?
  c.accent.danger : cy.guardianState === 'tight' ? c.accent.warning : c.text.secondary`. Confirmed.
- **Could that cluster be some other chip?** It is the only `text.secondary`-on-`tertiary` region in the
  frame and it sits inside the detail header's y-band. It is the chip.

**Residual doubt.** ⚠️ **`tight` and `at-risk` appear in no frame in the matrix** — every seed lands on
`clear`, exactly as the lens said. Their numbers are computed. The computation is tight (the `clear` frame
*proves* the fill is `background.tertiary`, and only the ink changes between bands) but it is not a
photograph. ⭐ **The matrix contains one of the Guardian's three bands and the Guardian is the app's
central signal** — I am carrying that gap forward rather than treating it as settled.

Separately: 4.25 is a **6 % shortfall**, 3.77 a 16 % one. The *observation* is not in doubt; whether
"fails AA by 6 %" earns **major** is a severity call, not a factual one.

---

### R4-V1-5 — `border.default` in light lands 0.6 L\* from the ground it separates against
**Verdict:** **CONFIRMED — observation and mechanism both** · ⚠️ **but the finding's implied conclusion
("light is broken, dark is fine") is REFUTED: by the applicable standard, *neither* theme's field boundary
passes.** One of its two instances is also contaminated.

**Re-checked against which frame:** `apps/rn/capture-ref/p6.8/phone/{light,dark}/sheet-debt-sheet-add.png`.
⚠️ These were **not** in the 12:00 re-shoot (mtime 11:26–11:27) — so I proved settledness directly rather
than assuming it. Token-exact histograms:

```
light  #e6ebf3 47.34 %   #ffffff 34.83 %
dark   #07111f 47.21 %   #152340 34.82 %
```

⚡ **Symmetric to within 0.02 percentage points on both tokens.** A sheet is *presented*, not
entrance-faded; the pair is settled and legitimately comparable. The instrument bug does not reach this
finding.

**My own measurement.** Raw row walk at `y=220`, x = 10 → 31, no interpolation:

```
LIGHT  x10..x19 #e6ebf3  |  x20 #e7e9ee  |  x21..x31 #ffffff
DARK   x10..x19 #07111f  |  x20 #313d57  |  x21..x31 #152340
```

I then re-derived the composites from `colors.ts` independently:
`rgba(16,38,84,0.10)` over `#ffffff` → **`#e7e9ee`**; `rgba(255,255,255,0.12)` over `#152340` →
**`#313d57`**. **Both match the sampled pixel to the byte.** The render is exactly as specified; the token
values are the defect.

| relationship | light | dark |
|---|---|---|
| border pixel ↔ **ground** | ΔL\* **0.56** · CR **1.01** | ΔL\* **20.88** · CR 1.75 |
| border pixel ↔ field fill | ΔL\* 7.67 · CR 1.21 | ΔL\* 11.79 · CR 1.44 |
| field fill ↔ ground | ΔL\* 7.11 · CR 1.20 | ΔL\* 9.09 · CR 1.21 |

**A mechanism refinement the lens missed, and it makes the finding sharper.** The border composites over
the **field's white fill**, not over the ground — RN draws the border inside the box. So in light the
border is not a faint outline; it is a 1 px band that is *the ground's own lightness* sitting inside the
field. ⚡ **It does not outline the field, it shaves a pixel off it.** The only visible edge left is
white-fill against ground, ΔL\* 7.11. 0.56 L\* is at or below the just-noticeable difference for a flat
patch, and far below it for a 1 px hairline.

**How I tried to break it.**
- **Is a shadow rescuing the light field?** No. My walk shows x10–x19 as *flat, identical* `#e6ebf3` — no
  gradient, no penumbra. `elevation.ts`'s light shadow is applied by the card helper; a `TextField` gets
  none. Confirmed.
- **Is the fill really `background.secondary`?** `TextField.tsx:77` `backgroundColor: c.background.secondary`,
  `:78` `borderColor: error ? c.accent.danger : c.border.default`, `:98` `borderWidth:
  StyleSheet.hairlineWidth`. `DateField.tsx:90` and `DateField.web.tsx:53–54` are identical. Yes.
- ⚠️ **`hairlineWidth` cuts against light, not for it.** On web at DPR 1 it is 1 px; on an iOS 3× panel it
  is ~0.33 pt. A sub-point line at 0.56 L\* is *less* visible on device, not more. The one device
  consideration available makes light worse.
- ⛔ **The attack that lands: does dark actually pass anything?** The governing criterion for a form-field
  boundary is **SC 1.4.11 (non-text contrast, 3:1)**. My numbers:

  | | light | dark |
  |---|---|---|
  | border vs ground | **1.01 ✗** | **1.75 ✗** |
  | fill vs ground | **1.20 ✗** | **1.21 ✗** |

  ⚡ **All four fail 3:1.** Dark's field is *perceptually* well-delineated (a 20.88 L\* step is
  unmistakable) but it does **not** clear the accessibility floor either. So the lens's framing — a theme
  **parity** defect in which dark is the correct one — is wrong on the standard. The correct statement is:
  **both themes fail SC 1.4.11 on form-field boundaries; light additionally falls below perceptual
  threshold.** That is a bigger finding, differently shaped.
- ⛔ **The second instance is contaminated by the capture, and the lens's numbers there are wrong.** It
  cites the dashed `AddRow` at light `#ced5e1` / dark `#242d39`. Neither is the token. `border.strong`
  light is `rgba(16,38,84,0.18)` → over ground that is **`#bfc8d6`**, and I searched
  `phone/light/money-debts.png` (settled, 12:00): **`#bfc8d6` appears 0 times; `#ced5e1` appears 10 times**
  at y 500–605. Solving for alpha, `#ced5e1` implies **0.112** and `#242d39` implies **0.117** — i.e. a
  **dashed** border at DPR 1 antialiases to ~62 % coverage in *both* themes. The real token deltas are
  **light ΔL\* 12.57** and **dark ΔL\* 22.30**, not 7.8 and 13.2. The ratio survives; the absolute figures
  are a 1× render artifact and should not be quoted.

**Residual doubt.**
- The whole finding is DPR 1. ΔL\* is device-independent as arithmetic, but a 1 px hairline at 1× and a
  0.33 pt hairline at 3× are different perceptual objects. ⚠️ Note the direction, though: the device makes
  light's border **thinner**, so the P6.14 device row can only worsen this, not rescue it.
- I did not check whether iOS draws any platform affordance around an RN `TextInput` that RN-web omits. It
  does not — RN `TextInput` on iOS is unstyled by default — but I did not verify on a device.

---

### R4-V2-1 / R4-V4-7 — Progress's debt-free date truncates at the DEFAULT 402pt width
**Verdict:** **MECHANISM WRONG, OBSERVATION HOLDS** *(and the observation is stronger than the lens
argued; the "~11 characters" figure and the "4 of 12" count are both unmeasured)*

**Re-checked against which frame:** ⚠️ mixed, and it matters.
- **Settled / re-shot (12:00–12:01):** `phone/light/progress.png` (*October 2026*, whole) and
  `phone-small/light/progress.png` (*Octob…*, truncated at 320).
- ⛔ **NOT re-shot (11:17):** `phone/light/state-progress-huge.png` (*November 2…*),
  `state-progress-single.png` (*September 2…*), `state-progress-many.png` (*April 2034*). **The entire
  402pt truncation claim rests on frames from the defective 700 ms run.**
- ⚡ **I closed that hole rather than living with it.** `light/state-progress-huge.png` and
  `dark/state-progress-huge.png` yield **1483 bright pixels each** in the heroDate band, with x-extents
  `176..351` and `177..352`. A mid-animation artifact cannot land byte-for-byte in two independently
  captured themes. **These frames are settled for this element.** The finding survives the instrument bug.

**My own measurement.** I read the crops directly (3× nearest-neighbour, so the glyphs are unambiguous),
then measured the rendered advance width of the heroDate string by scanning for luminance > 190 inside the
hero card at `y 112..138`:

| frame | width | string rendered | box | fits? |
|---|---|---|---|---|
| `phone/light/progress.png` | 402 | **`October 2026`** whole | x 174..360 = **186 pt** | ✅ uses **165 pt**, 21 pt slack |
| `phone/light/state-progress-many.png` | 402 | **`April 2034`** whole | 186 pt | ✅ uses **129 pt** |
| `phone/light/state-progress-huge.png` | 402 | ⛔ **`November 2…`** | 186 pt | ✗ clipped at 176 pt |
| `phone/light/state-progress-single.png` | 402 | ⛔ **`September 2…`** | 186 pt | ✗ clipped at 181 pt |
| `phone-small/light/progress.png` | 320 | ⛔ **`Octob…`** | x 174..278 = **104 pt** | ✗ clipped at 99 pt |

⚡ **Two frames at the identical 402 pt width, identical layout, differing only in the month — one whole,
one ellipsized.** That is the finding, and it is not arguable. My box arithmetic is independent of the
lens's and lands on the same numbers: `402 − 2×20 (screenPaddingH) − 2×22 (cardPaddingH+2) − 112
(RING_SIZE) − 20 (spacing.lg) = 186`; at 320 it is `104`. Verified against
`spacing.ts:22,29,14` and `progress.tsx:34,227,228,229,231,235`.

**How I tried to break it — string or seed?**
Decisively **the string.** `state-progress-many` renders `April 2034` — a *later* payoff date, a bigger
number, a different seed — completely intact at 402, while `state-progress-huge` truncates `November 2…`.
Payoff *distance* is not the variable; month-name *width* is. The lens's central claim survives the
attack the brief asked for.

**⛔ But two of its quantitative claims do not survive.**
1. ⛔ **"~11 characters" is wrong.** `October 2026` is **12 characters** and fits with **21 pt to spare**
   (165 of 186). The clamp is not near 11. Character count is the wrong instrument anyway — the box is
   186 pt of *advance width*, and `April 2034` (10 chars) uses 129 pt while `October 2026` (12) uses 165,
   which is ~18 pt per additional letter, not a constant.
2. ⛔ **"4 of 12 month names" is an extrapolation, not a measurement, and the lens said so ("What I have
   NOT measured is exactly which months cross it") — but the summary line dropped the caveat.** What is
   *measured* is **2 of 12**: `September` and `November` truncate at 402; `October`, `April` fit.
   `December` almost certainly joins them (same 8 letters, same wide `m`/`b` pair as `November`).
   ⚠️ **`February` is genuinely doubtful** — 8 letters, but `F`, `r`, `r`, `y` are among the narrowest
   glyphs in the face where `November` carries the widest (`m`, `N`, `o`, `v`). I would not assert it
   without a text-measurement pass. So the honest range is **2 measured, 3 likely, 4 claimed.**

**What the lens under-claimed, and I am adding.** ⚡ The truncating seed is not an exotic one.
`state-progress-single` is **a single $1,200 debt** — the most ordinary starting position the product has —
and it renders `September 2…`. The finding is not "the huge seed breaks the hero"; it is *"an entirely
typical first-run user loses the year off the app's headline number on the default iPhone width."* That
is a stronger statement than either lens made.

**Residual doubt.**
- The 402 pt evidence lives entirely on non-re-shot frames. I neutralised that with the light/dark
  byte-agreement above, but the clean fix is to re-shoot `state-*` at 1800 ms — **which has not been done,
  and which several other findings still depend on.**
- Exactly which months cross the boundary is unmeasured. Settling it needs a text-measurement pass or a
  seeded frame per month, not another reading of a still.
- Dynamic Type is not in play here (`matrix/README.md` hole 2); `maxFontSizeMultiplier={1.3}` on the same
  line indicates the fixed size was already known to be tight, which is corroboration, not proof.

---

### R4-V2-6 — the "Drag the curve" coach mark covers the cash-flow chart at short viewports
**Verdict:** **CONFIRMED — and the mechanism is confirmed to the pixel.** ⚡ I can also add a measurement
neither lens had, which turns "wrong by construction" from an argument into a number.

**Re-checked against which frame:** **all five are re-shot, settled frames** —
`phone/light/progress.png` (12:00), `phone-small/light/progress.png` (12:01),
`ipad-landscape/light/progress.png` (11:50), `split-view/light/progress.png` (11:50),
`ipad-portrait/light/progress.png` (11:49). ⭐ **This finding is completely clean of the instrument bug**;
I read the current frames as images and confirmed the split by eye before measuring it.

**What the frames show.** On `phone` (402×874) the callout sits squarely across the cash-flow card: the
lower half of all five bars is cut off mid-bar, and the date axis, the
`--- your $200 line · room after each paycheck` legend and the `Comfortable across the next few paychecks`
verdict are **all gone**. Identical at `phone-small` (320×568) and `ipad-landscape` (1194×834). At
`split-view` (507×1194) and `ipad-portrait` (834×1194) the callout is a clean card **below** the trajectory
card and the cash-flow chart is entirely intact, legend and verdict included. **Three short viewports
broken, two tall ones correct — keyed on HEIGHT, not width, exactly as V2-6 says.**

**My own measurement — the mechanism, numerically.** I walked columns for the `border.subtle` hairline
(`#f1f2f5`, which I independently derived as `rgba(16,38,84,0.06)` over `#ffffff`):

```
ipad-landscape/light/progress.png   x=700   hairlines at y = 233, 437, 560, 569, 737
   -> 437 = callout TOP    560 = callout BOTTOM    569 = trajectory card TOP  (= rect.y)
phone/light/progress.png            x=200   callout TOP y=437 , callout BOTTOM y=580
   -> directly above y=437 sits #95a3b8..#9aa7bc — a cash-flow BAR, cut off
split-view/light/progress.png       x=470   callout TOP y=975 , ground resumes y=1098
```

⚡ **`rect.y = 569`. `569 − 132 = 437`. The observed callout top is 437.** The claimed mechanism
```js
const top = roomBelow ? below : Math.max(insets.top + 8, rect.y - 132);
```
is **exactly** what runs, to the pixel.

**How I tried to break it.**
- **Is there a later branch that overrides `top`?** ⛔ No. I read `CoachMarkLayer.tsx` end to end. `top` is
  computed once (line 118) and consumed once, unmodified, at `style={[styles.wrap, { top, left, right }]}`.
  Everything after it (`rawLeft` / `rawRight` / `deficit`) touches only the **horizontal** axis — which is
  the 4.1.5.5 fix the file documents at length. **The vertical axis has no neighbour-awareness and no
  second chance.**
- **Is `roomBelow` really false on the short viewports?** `winH − below − insets.bottom > 140`, with
  `insets.bottom = 0` in the web harness. On phone `rect.y = 569` and the trajectory card runs past the
  fold, so `below > 874` and the expression is negative. On split-view (`winH = 1194`) it is true — and the
  frame proves it: the callout top there is **975**, i.e. the `below` branch, sitting under the trajectory
  card. **Both branches observed, both matching.**
- **Is the subject really the trajectory card?** `progress.tsx:73` `useCoachMark('trajectory-scrub', true)`
  and `:202` `<TutorialTarget id="trajectory-scrub">`; copy at `coachMarkCopy.ts:40` is verbatim
  *"Drag the curve" / "Scrub any month to see what you owe and when you land."* — which is what the frames
  render. Yes.

**⚡ The measurement neither lens had: `132` is wrong, and I can say by how much.** I measured the
callout's *actual* rendered height from its two hairlines:

| viewport | body wraps to | callout height | bottom edge lands at | vs subject top (`rect.y`) |
|---|---|---|---|---|
| **phone 402** | **2 lines** | **144 px** (437→580) | `rect.y + 12` | ⛔ **overlaps the subject by 12 px** |
| ipad-landscape 1194 | 1 line | **123 px** (437→560) | `rect.y − 9` | clears by 9 px |
| split-view 507 | 1 line | **122 px** (975→1097) | *(below-branch, n/a)* | — |

⛔ **The fallback branch's one stated guarantee is that it will not cover the subject** — the docstring
says so: *"a callout that covers it explains something the user can no longer see."* At 402 pt the body
wraps to two lines, the callout becomes 144 px, and **its bottom edge lands 12 px inside the trajectory
card it exists to explain.** The hardcoded `132` matches neither the one-line height (122–123) nor the
two-line height (144). V2-6 argued it was "wrong by construction the moment the copy wraps differently";
I measured the wrap and the overshoot. ⚡ **So on the app's default width it does not merely occlude the
neighbour above — it also breaks its own invariant.**

**Residual doubt.**
- `insets.bottom = 0` on web; on device the home-indicator inset is ~34 pt, which makes `roomBelow` *less*
  likely to be true and pushes *more* viewports into the broken branch. The device row can only worsen this.
- I did not test whether a real iPhone's `rect.y` differs (safe-area top differs). The mechanism is
  arithmetic over measured inputs and will hold with different ones; only the exact y moves.
- Whether occluding the neighbour is *worse* than occluding the subject is a design call, not mine. What is
  not a call: at 402 pt it does **both**.

---

### R4-V4-8 / R4-V4-9 / R4-V4-11 — the three loading-state defects
⚠️ This cluster is where the instrument bug did its damage, and the three do not survive together.

#### R4-V4-9 — invisible skeleton ring, light theme
**Verdict:** ⛔ **REFUTED as observed.** *(The latent token collision is real in code and has never been
rendered.)*

**Re-checked against which frame:** the two the lens cites —
`phone/light/state-progress-single.png` (⚠️ **not** re-shot, 11:17 — so this is the *same* frame the lens
read) and `phone/light/progress.png` (re-shot, 12:00).

**My own measurement.** The journey ring's milestone nodes are `accent.gold.dark` `#fbd34d`
(`progress.tsx:41–45` pins the ring palette to the **dark** tokens in both themes). I counted them in every
Progress frame:

```
                        light      dark
progress.png            122 px     122 px     bbox x 93..151  y 80..137
state-progress-single   122 px     122 px     bbox x 93..151  y 80..137
state-progress-many     122 px     122 px
state-progress-huge     122 px     122 px
```

⚡ **The ring renders in all eight frames, in both themes, at 122 gold pixels each — identical.** I also
cropped the hero of `light/state-progress-single.png` at 3×: a complete ring with all four milestone nodes.
**`0% paid` is not floating in an empty navy void in any frame in this matrix.** ⛔ And this is **not** an
instrument casualty — `state-progress-single.png` was never re-shot, so I read exactly the bytes the lens
read, and they do not say what the lens says.

**How I tried to break my own refutation.** The lens's *reasoning* is sound: `ChartSkeleton` does paint
`borderColor: c.border.subtle` (`ChartSkeleton.tsx:19`), the Progress hero **is** the CONSTANT navy panel
in both themes, and light `border.subtle` composited over `#0e2242` is **`#0e2243`** — **ΔL\* ≈ 0.02**,
literally invisible — where dark's `rgba(255,255,255,0.08)` gives `#213451` and reads clearly. **The token
collision is real.** What is not real is the claim that a frame shows it. ⭐ **File it as a latent code
defect with no observed instance, not as an observed defect.**

**Residual doubt.** The state is genuinely reachable (a cold CDN fetch of the 8 MB wasm), so it could
appear on a slow connection even though it did not appear here. I can bound nothing about its frequency;
only that this matrix never caught it.

#### R4-V4-11 — stray hairlines under Today's allocation bar, light theme
**Verdict:** ⛔ **REFUTED.**

**Re-checked against which frame:** `phone/light/state-today-huge.png` and its dark twin (⚠️ neither
re-shot — again, the exact frames the lens read), plus `state-today-many`, `state-today-single` and
`state-today-long-names` in both themes.

**My own measurement.** I cropped the Payday Guardian card at 3× in both themes. **Light draws a proper
blue/grey split bar with the line marker** — same bar as dark, same rounded ends, same legend
(`▬ Cushion $200 · ▬ To debt $13,738`). There are **no four stacked hairlines** anywhere in the card. Then
I counted the bar's fill token across every Today seed:

| seed | light `#2f66ea` | dark `#5b9dff` |
|---|---|---|
| `state-today-huge` | **4 515 px** | 4 555 px |
| `state-today-single` | **2 794 px** | 2 544 px |
| `state-today-long-names` | **3 844 px** | 3 841 px |
| `state-today-many` | **34 px** | **34 px** |

⚡ **Light and dark agree in every seed.** (`many` is a shortfall cycle with no to-debt allocation, so
there is nothing to draw — and it is *symmetric*, which is the point: that is data, not a theme fault.)
**The `AllocationBarCanvas` Skia path resolved in every Today frame in the matrix.**

**How I tried to break my own refutation.** I checked I had the right card and the right band — the crop
carries the `PAYDAY GUARDIAN` eyebrow, the `Looks clear this paycheck` verdict and the exact `$200` /
`$13,738` figures the lens quotes, and spans y 380–540, which contains the lens's `y ≈ 440`.
⛔ Note also that V4-11 cites `light/state-today-empty.png` as evidence — **the frame V4's own "What I
could not judge" section declares unusable** (a 21 KB cold-start artifact at ~15 % opacity). A finding
cannot rest on a frame its own lens has already disqualified.

#### R4-V4-8 — a labelled chart with no curve reads as a failed chart
**Verdict:** **DOWNGRADED.** The defect **class** is real and source-confirmed, and I found it in the
current capture — but **every frame the lens cited is refuted, and it is not a light-theme defect.**

**Re-checked against which frame:** all four cited, **plus** two the lens never read.

**My own measurement.**
- ⛔ `phone/light/state-progress-huge.png` (**not** re-shot) draws a **complete blue curve**, its area
  fill, the endpoint dot, ten gridlines, ten y-labels and the gold `Nov 2028` pill — structurally
  indistinguishable from its dark twin. **Refuted.**
- ⛔ `phone/light/state-progress-single.png` (**not** re-shot) draws the full grey minimum-payments curve,
  the blue plan segment, the endpoint and the `Sep 2026` pill. **Refuted.**
- ⚠️ `phone/light/progress.png` **was** a genuine instrument casualty — at 700 ms the lens saw it empty; at
  1800 ms it now draws the curve. **That one the re-shoot fixed.**
- ⚡ **But it reproduces where nobody looked:** `split-view/light/progress.png` **and**
  `split-view/dark/progress.png` (both 11:50) each render the complete y-axis (`$6k · $4k · $2k · $0`),
  **all nine** year ticks, the `Now` marker, the gold `Oct 2026` milestone pill and the full legend
  (`Minimum payments — Sep 2035`, `Your plan — Oct 2026 · ~$5,722, 9 years saved`) **over an empty plot
  with no curve, no area and no endpoint.** It reads exactly as the lens described — as a chart that
  *failed*, not one that is loading.

**Mechanism: CONFIRMED at source, and sharper than the lens put it.** `TrajectoryChart.tsx:307` gates on
`w > 0 && activePath` — both true before CanvasKit resolves — then renders the RN `Text` labels *outside*
the canvas while `TrajectoryCanvas` is still a `WithSkiaWeb` fallback. ⚡ And note what the prop list at
`:322` shows: **`gridLines={gridVals.map(mapY)}` is passed INTO the Skia canvas.** So the curve, the area,
the endpoint *and the chart's own gridlines* are all Skia-drawn and all absent together, while every label,
tick, pill and legend row is RN-drawn and present. The lens's identification of the four visible lines as
`ChartSkeleton`'s `{[0,1,2,3].map(...)}` is therefore **correct by elimination** — the chart's own
gridlines cannot be on screen without the curve.

**⛔ Three corrections to how it was filed.**
1. **It is not light-theme-specific.** Both split-view themes show it, identically.
2. **"Four of eight light Progress frames caught this" is wrong.** Zero of the four cited frames show it.
3. **It is a race, not a state.** Ring canvases resolved in 8/8 frames; the trajectory canvas failed in
   2/10 — it carries an extra dynamic `import('./TrajectorySkiaChart')` chunk on top of the shared
   CanvasKit load, which is the plausible reason it loses more often.

**Is it web-only? — VERIFIED, and the lens is right.** `ChartSkeleton` is imported by **exactly five files,
all `.web.tsx`** (`TrajectoryCanvas` · `JourneyRingCanvas` · `CashRunwayCanvas` · `CushionBarCanvas` ·
`AllocationBarCanvas`) and by **nothing** on the native path. `TrajectoryCanvas.tsx` (native) is three
lines — `<TrajectorySkiaChart {...props} />`, no `WithSkiaWeb`, no `fallback`, no skeleton — and its own
comment says *"Skia is compiled in, so render directly."* Metro resolves `.web.tsx` for web only.
⛔ **The state is structurally unreachable on iOS. Severity on device is zero and I am not claiming
otherwise.**

**Does the web build make it matter anyway? — Yes, but narrowly.** The marketing embed is real and public:
`.github/workflows/embed-pages.yml` deploys `apps/rn/dist-embed` to GitHub Pages, with
`playwright.embed.config.ts` gating it at the same base path. ⚠️ But read the workflow's own header: the
deploy is **`workflow_dispatch` only**, deliberately manual, and gated on the SHA having passed `web-e2e`.
So the exposure is a **hand-published marketing demo**, not a shipping product surface, and the defect is a
transient during an 8 MB wasm fetch on that demo. **My judgement: a real but low-severity web-surface
defect — minor, not major.** The cheap fix is at `TrajectoryChart.tsx:307`: gate the labels on the same
condition as the canvas, so the card is either wholly loading or wholly drawn. That costs nothing on native
and removes the failed-chart reading on the embed.

**Residual doubt.** I cannot measure how long the empty-labelled window lasts on a cold CDN fetch — the
matrix caught it twice at a ~1.8 s local settle, which suggests it is not brief. `V4-16` (the
`!isHydrated` blank on web) is the same exposure class and I did not test it.

---

## Survivors, ranked

Ranked by *what a fix is worth*, not by the lens's severity label.

| # | finding | verdict | why it ranks here |
|---|---|---|---|
| **1** | **V1-2** — light tokens validated on white, rendered on `#e6ebf3` | **CONFIRMED, strengthened** | The arithmetic reproduced cell-for-cell, the large-text exemption reaches only two sites and **both still fail**, five failing pairs are visible in the current settled capture, and correcting the grid makes it *worse*: **15 of light's 24 distinct pairs fail; 0 of dark's 32 do.** It is one token-file edit away from fixed and it explains V1-1, V1-3 and half of V1-5. **Nothing else in this cluster is close.** |
| **2** | **V2-6** — coach mark occludes the cash-flow chart at short viewports | **CONFIRMED to the pixel** | `rect.y = 569`, `569 − 132 = 437`, observed top **437**. Three short viewports broken, two tall correct. ⚡ And I measured what the lens could only argue: the callout is **144 px** at 402 pt where the code guesses **132**, so its bottom lands **12 px inside the subject** — the fallback branch violates its own documented invariant on the default iPhone width. |
| **3** | **V1-5** — `border.default` lands 0.6 L\* from the ground | **CONFIRMED, but REFRAMED** | Byte-exact on two axes; the composites match `colors.ts` to the byte. ⚠️ **But the theme-parity framing is wrong:** by SC 1.4.11 (3:1) *all four* boundaries fail — light 1.01/1.20, **dark 1.75/1.21**. Dark is *perceptually* fine and *formally* non-conformant. Fix the criterion, not the parity. ⛔ Its second instance (dashed `AddRow`) quotes DPR-1 dash-antialiasing artifacts, not tokens — the real deltas are 12.57 / 22.30 L\*, not 7.8 / 13.2. |
| **4** | **V2-1 / V4-7** — the debt-free date truncates at the **default** 402 pt width | **MECHANISM WRONG, OBSERVATION HOLDS** | Two frames at the identical width, one whole (`October 2026`, 165 pt of a 186 pt box) and one ellipsized (`November 2…`). String, not seed — proven by `April 2034` rendering intact on a *later* payoff date. ⛔ But **"~11 characters" is wrong** (12 fit, with 21 pt to spare) and **"4 of 12 months" is unmeasured** — 2 are proven, 3 likely, `February` genuinely doubtful. ⚡ Under-claimed by both lenses: the truncating seed is **a single $1,200 debt**, the most ordinary first-run position the product has. |
| **5** | **V1-1** — Guardian band chip fails AA in light | **CONFIRMED (`clear`) / computed (`tight`, `at-risk`)** | 34 px of ink on `background.tertiary` at **identical y-bands in both themes** — the cleanest in-frame measurement in this cluster. 12 px bold is **not** WCAG large text, so the 4.5 floor stands and all three bands fail (4.25 / 3.92 / 3.77) against dark's 8.83 / 10.57 / 6.55. ⚠️ Ranks 5th only because two of its three states appear in **no frame in the matrix** — which is itself a gap worth filing. |
| **6** | **V4-8** — a labelled chart with no curve reads as failed | **DOWNGRADED** | The defect class is real and source-confirmed (`TrajectoryChart.tsx:307` gates labels on `w > 0 && activePath`, true before CanvasKit resolves; `gridLines` is passed *into* the Skia canvas, so labels and curve cannot disagree honestly). ⛔ But **all four cited frames are refuted**, it is **not light-specific** (both split-view themes show it), it is **structurally unreachable on iOS**, and the web surface is a manually-dispatched marketing demo. **Minor, not major** — with a one-line fix. |

⛔ **Killed outright: V4-9 and V4-11.** Both cite frames that were never re-shot, so I read exactly the
bytes the lens read — and the ring renders in 8/8 Progress frames (122 gold px each, both themes) while
the allocation bar renders in every Today seed (light/dark symmetric to within 5 %).

---

## Findings killed by the defective instrument

⚠️ **This list is the cost of the instrument bug — and reading it carefully shows the bug cost *less*
than it looks, while a second failure mode cost more.**

### Genuinely killed by the instrument

| what died | how |
|---|---|
| **V1-8** — *"no onboarding frame exists in either theme; `onboarding.png` renders Today"* | ⛔ **Now void.** The re-shot `phone/light/onboarding.png` is **81.11 % `#e6ebf3`** with `accent.brand` `#0f172a` at 5.11 % and **zero** hero-gradient pixels (`#0c1c38`/`#0c1d3a`), where `today.png` carries 2.40 % + 2.30 % of exactly those. It is genuinely onboarding. O1's primary surface exists again. |
| **V1-0 itself** — the mid-animation asymmetry | ⛔ **Void for route frames.** `light/today.png` is 40.05 % card-token against `dark/today.png`'s 39.85 %; Progress is 48.95 vs 48.77 %. The pairs are the same frame in two themes to within a fifth of a percent. |
| **V1's entire "leads I chased and did NOT file" table** — 8 leads, incl. *"the light Today screen is washed out"* and *"the dark Progress bars are dim and shorter"* | These were killed **during** the audit by V1-0. They cost eight investigations that produced nothing. |
| **V2's "frame artifacts" list** — incl. *"`phone/light/cushion-forecast.png` renders an empty chart"* | Now settled (43.69 % / 28.77 % token-exact) and the chart draws. |
| **V4-8's `phone/light/progress.png` citation** | ⚡ **The one true instrument casualty in the loading cluster.** Empty at the 700 ms settle, curve present at 1800 ms. |
| **V4-12's light evidence** | The lens had to judge Today's `empty` state from the **dark twin alone**, because `light/state-today-empty.png` is a 21 KB cold-start artifact. Half its evidence base was gone before it started. |

### ⚡ NOT killed by the instrument — killed by the lens

⛔ **This is the sharper lesson.** **V4-9 and V4-11, and three of V4-8's four citations, cite frames that
were never re-shot and are perfectly intact.** I read the identical bytes and found a fully-rendered ring,
a fully-rendered split bar and two fully-rendered trajectory curves. The instrument did not manufacture
those three findings.

What did: **V1-0 established that "a chart/card looks unfinished" was a live, respectable reading of this
matrix — and V4 then applied that reading to frames that did not need it.** A known instrument defect
does not only destroy the frames it touched; it supplies a **ready-made explanation** that gets reached
for on frames it never touched. ⚡ **Three of the four "loading-state" findings — the cluster V4 called
"the three nobody was assigned to look for" — are contamination by narrative, not by instrument.**

### ⛔ Still standing on the old instrument — nobody re-shot these

| frame class | count | who depends on it |
|---|---|---|
| **`state-*.png`** | **32** (16 seeds × 2 themes), all still **11:17–11:18** | **all of V4**, and the entire 402 pt evidence for **V2-1 / V4-7** |
| **`textscale-*.png`** | every one, still **11:18–11:19** | ⛔ **all of V3**, which no re-shoot has touched at all |

I neutralised the `state-*` risk for V2-1/V4-7 specifically (light and dark agree to the pixel: 1483
bright px each, x-extents `176..351` and `177..352` — an animation artifact cannot land byte-for-byte in
two independent captures) and for V4-9/V4-11 (the frames render correctly, so there is nothing to
neutralise). ⚠️ **I did not clear the rest.** Any V3 or V4 finding not covered above is still reading the
700 ms instrument, and **the cheap, decisive move before this audit closes is to re-run the `state-*` and
`textscale-*` sets at the 1800 ms settle** — the same fix that has already voided one lens finding
outright (V1-8) and one citation (V4-8's).

---

## One line

⚡ **The token file is the finding.** V1-2, V1-1, V1-5 and the dead V4-9 are all the same defect —
*light's foregrounds and borders were validated against `#ffffff`, and light's surfaces are not `#ffffff`* —
and it is the only thing in this cluster where a single file edit moves five findings at once. Everything
else here is one layout constant (`132`), one clamp (`numberOfLines={1}` at 26/800 in a 186 pt box), and
one render gate (`w > 0 && activePath`).
