# P6.6 — the splash background, decided by looking (2026-08-20)

Three candidates, rendered at 402×874pt @2x with the icon at `imageWidth: 220` — the real geometry, not a
mock. **The winner is `dark-on-icon-surround.png`, which is [D43] taken literally**, and my own instinct
(the app's navy) was measurably worse.

Regenerate: `sharp` composite of `apps/rn/assets/icon.png` resized to 440px, centred on a 804×1748 field of
the colour under test. The icon's own pixels were sampled first — corners `#0a051c`, top-mid `#19122d`,
bottom-mid `#030108`, centre `#1cad96`: **the icon's background is a gradient, not a flat colour**, which is
what makes the choice of surround visible at all.

| File | Background | Verdict |
|---|---|---|
| `dark-on-icon-surround.png` | `#0a051c` — the icon's own outer surround | ✅ **Chosen.** The badge DISSOLVES into the field: its dark corners melt out and only the glowing teal mark and a soft vignette remain. No box, no edge |
| `dark-on-app-navy.png` | `#07111f` — the app's own dark background | ⛔ Rejected. Reads as an app icon **pasted onto** a screen — the icon's purple gradient is visibly warmer than the navy and the square's edge is plain |
| `light-shows-the-square.png` | `#e6ebf3` — the app's own light background | ⛔ Rejected, and it is the reason the splash is dark in BOTH modes |

## ⛔ Why there is no light-mode variant

`icon.png` is a **square** image with the rounded badge drawn inside it and its corners filled with the same
dark surround (it carries no alpha — the App Store forbids it). On a dark field that square is invisible. On
a light field **the square is what you see**: a dark rectangle with a slightly-different rounded shape inside
it. It reads as a rendering bug rather than as an app icon.

Making a light variant work would mean generating a *masked* asset with a transparent rounded-rect — and the
mask radius would have to match iOS's superellipse or it looks subtly wrong at the corners. That is new
artwork, and [D43] settled the splash as *"the app icon on the icon's own dark background, no wordmark."*

⚠️ **The residual, named rather than hidden:** the app's default theme is `system`, so a light-mode user gets
a dark splash handing off to a light UI. That is the mirror of the defect P6.6 exists to fix (Expo's default
white flash into a dark UI) — smaller, because a dark splash is a deliberate brand moment where a white
flash is an accident, but it is real. **A light variant is a 🎯 call, not mine**; it is one `dark:` block in
`app.json` plus a masked asset if he wants it.

⚠️ Also named: the splash `#0a051c` hands off to the app's `#07111f`. Measured, that is a 3-point shift in
near-black and imperceptible on a phone — far cheaper than a visible badge edge on every single launch.
