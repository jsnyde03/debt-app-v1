# App Icon — v1.6 redesign

Replaced the busy 4-idea calendar/$/checklist/growth-chart icon (illegible small,
generic, off-message) with a single ownable idea: **debt coming down.**
**final-bars.png (Descending Bars) is INSTALLED** (`AppIcon-512@2x.png` + `assets/icon.png`) —
Jason's chosen design.

- **final-bars.png** — Descending Bars (INSTALLED): three green bars stepping DOWN,
  a dashed downward trend line, and an on-plan checkmark, on a purple→navy gradient
  with a subtle checkmark watermark. Debt *down* + on-plan, premium & detailed.
  Source: `render-icon2.html`.
- **final-descent.png** — Payoff Descent (alt): a mint line falling to a zero baseline.
- **final-allocation.png** — Payday Allocation (alt): a $ splitting into three portions.
- **final-dollar.png** — Confident $ (alt): a heavy, well-set money glyph.

All are 1024×1024, sRGB, **no alpha**, full-bleed (iOS masks the squircle).
Source: `render-icon2.html` / `render-icons.html` (edit → re-render at 1024 → flatten alpha via sharp).
Rationale + side-by-side: the icon-concepts artifact. Concept swap:
`cp docs/release-notes/icons/final-<name>.png ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (and `assets/icon.png`).
