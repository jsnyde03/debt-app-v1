# Visual verification (standard for UI fixes)

**Standard (Jason, 2026-07-03):** any fix that changes how something *looks* — theme
scoping, positioning, overlays, spacing, color — must be verified by actually
**looking at a screenshot**, not only by a Playwright assertion on geometry or text.

### Why this exists

The v1.5 amortization "View Schedule" bug is the cautionary tale. The sheet was
rendered off-screen (a `position:fixed` overlay trapped by a transformed ancestor).
The first fix portaled it to `document.body` — which passed a `toBeInViewport()`
e2e assertion, because it *was* now on-screen. But `<body>` is outside
`<main class="… dark-theme">`, and all dark CSS is descendant-scoped under
`.dark-theme`, so the sheet rendered **light in dark mode**. A position assertion
structurally cannot catch a theme regression. A screenshot catches it instantly.

**e2e assertions prove behavior. Screenshots prove appearance. A UI fix needs both.**

### How to run one

`amort-theme.cjs` is the reference example. To verify a UI fix:

1. Build the app with the premium seam on (so gated UI is reachable):
   ```
   NEXT_PUBLIC_E2E=1 NODE_OPTIONS=--use-system-ca npm run build
   ```
2. Serve `out/`:
   ```
   NODE_OPTIONS=--use-system-ca npx serve out -l 4655
   ```
3. Run the visual script (seeds state, navigates, screenshots **both themes**):
   ```
   VPORT=4655 NODE_OPTIONS=--use-system-ca node tests/visual/amort-theme.cjs
   ```
4. **Open the PNGs and look at them.** Confirm the fix in dark *and* light. The
   script also logs the sheet's computed `background-color` per theme as a
   machine-checkable proof (dark ≈ `rgb(17,24,39)`, light = `rgb(255,255,255)`).

### Writing a new one

Copy `amort-theme.cjs`. Keep the shape: seed localStorage (premium via the bare
`debtPlanner.mockSubscription` string — it is **not** JSON), navigate to the
component, screenshot in `"dark"` and `"light"`, and log a computed style that
proves the property you fixed. Always capture both themes — most appearance
regressions are theme-scoped.
