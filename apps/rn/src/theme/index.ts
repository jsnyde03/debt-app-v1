/**
 * Debt Planner — design system barrel.
 *
 * Import tokens from `@/theme`. Colors are scheme-resolved at runtime via `useAppColors()`;
 * typography/spacing/motion/icons are static.
 */

export { colors, progressColor, resolveColors } from './colors';
export type { ColorScheme, ColorTokens, ColorPair, ResolvedColors } from './colors';
export { fontFamily, textStyles } from './typography';
export type { TextStyleName } from './typography';
export { spacing, layout } from './spacing';
export type { SpacingToken } from './spacing';
export { elevation, cardElevation } from './elevation';
export { spring, duration, stagger, celebration } from './motion';
export type { SpringToken, DurationToken } from './motion';
export { icons, tabIcons } from './icons';
export type { IconName, TabIconName } from './icons';
