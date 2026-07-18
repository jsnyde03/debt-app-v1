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

export type SpacingToken = keyof typeof spacing;
