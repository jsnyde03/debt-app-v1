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

