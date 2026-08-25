/**
 * Debt Planner — spacing + layout constants (the design-system scale).
 *
 * The `spacing` scale is shared across the portfolio; the `layout` radii carry Debt's own
 * slightly-rounder identity (ported from the Capacitor `--radius-*` tokens: sm 14 / md 18 / lg 24).
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const layout = {
  screenPaddingH: 20, // horizontal screen margin
  screenPaddingV: 16, // top padding below the nav header
  cardRadius: 18, // primary card corner radius (Debt --radius-md)
  cardRadiusLarge: 24, // hero card corner radius (Debt --radius-lg)
  inputRadius: 14, // Debt --radius-sm
  buttonRadius: 14,
  pillRadius: 999,
  cardPaddingH: 20,
  cardPaddingV: 20,
  sectionGap: 12, // gap between cards in a list
  stackGap: 8, // gap between items within a card
  maxContentWidth: 800, // iPad: center + cap the single-column width
} as const;

/**
 * [P6.4.5 · audit L4-13] The pressed-state opacity for a tappable surface.
 *
 * ⛔ **Every control state in the app resolves here, and `npm run lint:press-opacity` enforces it.** The
 * class was measured at six different values across two rounds — a press dimmed to 0.6, 0.7, 0.8, 0.85 or
 * 0.9 depending only on who wrote the site, so two cards of the same size on the same screen dimmed by
 * visibly different amounts. ⚠️ **The gate exists because the FIRST round closed this as a list and the
 * list was short**: the four `ui/` primitives were converted, seven sites at five values were not, and
 * nothing anywhere could see the difference — no test in this repo asserts `opacity`, and press *feel* is
 * routed to the device pass, which lands after the freeze.
 *
 * ⚠️ **This WAS half of L4-13, and the other half is now answered.** *"Decide whether card-sized targets
 * use `PressableScale` app-wide or nowhere"* → **NOWHERE** ([D60], 2026-08-25). W2's census settled it:
 * of **69** tap targets **1** springs, **11** dim and **57** have no press feedback at all, so the app's
 * dominant treatment is *no* treatment and "app-wide" would be a new design on ~45 targets inside a
 * freeze, with nothing able to see it go wrong. ⛔ **"Nowhere" is the ANSWER, not an edit** — `SettingRow`
 * keeps `PressableScale`; removing its only consumer would just re-open `L4-16`'s dead-primitive question.
 */
export const pressedOpacity = 0.8;

/**
 * The other two states of the same ladder, split out so `Button` holds no bare numbers.
 *
 * ⚠️ **Values UNCHANGED from the literals they replace** (0.9 / 0.5) — deliberately. These are naming
 * only: a pointer hover and a disabled control are different questions from a press, and answering them
 * with `pressedOpacity` would be convergence for its own sake. Nothing on screen moves.
 */
export const hoveredOpacity = 0.9;
export const disabledOpacity = 0.5;

export type SpacingToken = keyof typeof spacing;
