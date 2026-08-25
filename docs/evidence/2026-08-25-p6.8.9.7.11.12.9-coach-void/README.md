# C-C — the once-ever coach-mark record was spent before the callout was ever on screen

**P6.8.9.7.11.12.9** · measured 2026-08-25 on the RN **web** harness (`apps/rn/dist`, Desktop Chrome).

## What the finding claimed, and what measuring changed

`C-discovery-ui.md` · **C-C** (`major`): `CoachMarkLayer`'s `DREW` verdict is
`!stoodDown && rect && COACH_MARKS[active]` — three facts, none of which is *"the callout is inside the
viewport"* — so the record can be written at the entrance transient the docblock itself cites.

**The core observation held.** Two of its supporting premises did not:

| the claim | measured 2026-08-25 |
|---|---|
| *"on react-native-web [the seated callout] is [off-screen] — measured 392 pt below the fold"* (C-C, quoting `coach-marks.spec.ts:35-37`, dated 2026-08-10) | ⛔ **False today.** The **seated** callout is on screen at all four viewports tried. The below-fold position is the **entrance transient** — which is C-C's actual mechanism, described without knowing it |
| the loss *"needs the sheet to end inside that window"* | ✅ Holds, and the window is wider than it reads: the record is **already persisted** on the first frame the callout paints, **621 ms** before it comes on screen |

## The measurements

**Seated position of the `payoff-schedule` callout** (sheet-hosted, after the entrance spring settles).
Viewport-relative `top..bottom` against window height:

| viewport | callout | on screen? |
|---|---|---|
| 440 × 956 | 625 .. 769 | ✅ |
| 440 × 740 | 409 .. 553 | ✅ |
| 402 × 874 | 543 .. 687 | ✅ |
| 390 × 664 | 333 .. 477 | ✅ |

**The transient, sampled every animation frame at 440 × 956** (`t` from page load):

```
first callout frame     t=1594ms  bottom=1511  winH=956  seen=["payoff-schedule"]
first ON-SCREEN frame   t=2215ms  bottom= 769  winH=956  seen=["payoff-schedule"]
```

⚡ **The record is already in `localStorage` on the first frame the card paints** — 555 pt below the fold —
and the callout does not become visible for another **621 ms**. Persistence runs on a **500 ms debounce**
(`persistence.ts:19`), so the write itself happened earlier still: at the layer's first commit.

## Why the pin is a frame timeline and not two reads

The 500 ms debounce means *"read the record now"* answers a question about half a second ago, so a single
sample cannot separate **not recorded** from **recorded, not yet flushed** — the first cut of this test was
green with the defect present. The shipped pin samples every frame and asks the timing-free question:
**was the callout ever off-screen while the record existed?**

Its two vacuity guards **fail rather than skip**: the off-screen window must have been entered at all, and
it must be **longer than the save debounce**, or the instrument says it cannot decide.

## Verification

- **RED (pre-fix bundle, the original defect — not a plant):** `spentInTheVoid` listed ~30 frames at
  `bottom=1613 winH=956`, from the first sampled frame onward.
- **GREEN (fix):** `coach-marks.spec.ts` 9/9, `coach-mark-neighbour.spec.ts` 1/1.
- **Over-correction plant** — `calloutOnScreen` forced to `false`, i.e. *never record*: reds on
  `a hint the user could actually see is still recorded as seen`. That assertion sits **after** the one the
  original defect reds, so without this plant it would never have been exercised
  (`.11.12.7`'s lesson: *a plant that reds early never exercises the later assertions*).

## Regenerating

```bash
npm --prefix apps/rn run export:web -- --clear
npx serve apps/rn/dist -l 4319 -s &
npx playwright test --config apps/rn/playwright.config.ts coach-marks -g "not spent"
```

The seated-position table came from a scratch spec that opens the debt sheet at each viewport, waits 3 s
for the spring, and prints `getBoundingClientRect()`; the frame timeline is the same `requestAnimationFrame`
sampler that now ships inside the test.
