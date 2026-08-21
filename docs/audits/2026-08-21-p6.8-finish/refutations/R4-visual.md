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
