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
 * ⛔ **Measured at SIX different values before this existed** — 0.6 (`AddRow`), 0.7 (`CheckCircle`,
 * `AddObligationSheet`, `DebtSheet`), 0.8 (`Pill`, `money.tsx`'s hero card), 0.85 (`Button`,
 * `money.tsx`'s reserve card), 0.9 (`ListRow`) — every one an inline literal with no token, so two
 * cards of the same size on the same screen dimmed by visibly different amounts.
 *
 * ⚠️ **This is HALF of L4-13, deliberately.** Its other half — *"decide whether card-sized targets use
 * `PressableScale` app-wide or nowhere"* — is a visual-system call across every screen, which is
 * **P6.8's** job, not a copy step's. One component adopts `PressableScale` today (More's `SettingRow`);
 * that asymmetry is recorded, not resolved here. Taking the token now stops the spread meanwhile.
 */
export const pressedOpacity = 0.8;

export type SpacingToken = keyof typeof spacing;
