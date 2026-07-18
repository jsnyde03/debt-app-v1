/**
 * Debt Planner — typography scale.
 *
 * System fonts only (SF Pro on iOS / Roboto on Android) — crisp, instant, Dynamic-Type aware.
 * Currency + any aligned digits use `tabular-nums` so widths don't jitter during counter
 * animations. Hero numbers (payday allocation, debt-free date) render in the numeric styles.
 */

import { Platform, type TextStyle } from 'react-native';

export const fontFamily = {
  display: 'System',
  body: 'System',
  mono: Platform.OS === 'ios' ? 'Menlo-Regular' : 'monospace',
} as const;

const tabular = ['tabular-nums'] as TextStyle['fontVariant'];

export const textStyles = {
  // Hero
  heroNumber: { fontSize: 52, fontWeight: '700', letterSpacing: -1.5, lineHeight: 56 },
  subhero: { fontSize: 34, fontWeight: '600', letterSpacing: -0.5, lineHeight: 40 },

  // Section titles
  title1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.3 },
  title2: { fontSize: 22, fontWeight: '600', letterSpacing: -0.2 },
  title3: { fontSize: 18, fontWeight: '600' },

  // Body
  body: { fontSize: 17, fontWeight: '400', lineHeight: 24 },
  bodyMedium: { fontSize: 17, fontWeight: '500', lineHeight: 24 },
  callout: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  subhead: { fontSize: 15, fontWeight: '400', lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },

  // Numeric display — tabular figures for stable widths
  numericDisplay: { fontSize: 52, fontWeight: '700', letterSpacing: -2, lineHeight: 56, fontVariant: tabular },
  numericLarge: { fontSize: 34, fontWeight: '600', letterSpacing: -1, fontVariant: tabular },
  numericBody: { fontSize: 17, fontWeight: '500', fontVariant: tabular },
} satisfies Record<string, TextStyle>;

export type TextStyleName = keyof typeof textStyles;
