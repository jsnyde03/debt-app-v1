# App Icon — v1.6 redesign

Replaced the busy 4-idea calendar/$/checklist/growth-chart icon (illegible small,
generic, off-message) with a single ownable idea. Three concepts were produced;
**Payoff Descent is installed** (`AppIcon-512@2x.png` + `assets/icon.png`).

- **final-descent.png** — Payoff Descent (INSTALLED): a mint line falling to a zero
  baseline. On-brand (debt *down*) and anti-cliché (everyone else charts up).
- **final-allocation.png** — Payday Allocation: a $ splitting into three weighted
  portions (the payday-allocation differentiator).
- **final-dollar.png** — Confident $: a heavy, well-set money glyph.

All are 1024×1024, sRGB, **no alpha**, full-bleed (iOS masks the squircle).
Source: `render-icons.html` (edit → re-render at 1024 → flatten alpha via sharp).
Rationale + side-by-side: the icon-concepts artifact. Concept swap:
`cp docs/release-notes/icons/final-<name>.png ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` (and `assets/icon.png`).
