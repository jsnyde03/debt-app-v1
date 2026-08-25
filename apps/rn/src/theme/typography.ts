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

/**
 * [P6.8.9.7.11.14.5 · audit L1-20] The EYEBROW treatment — the small uppercase label above a card's
 * content. A modifier, not a scale entry: it carries no `fontSize`, because the size comes from the
 * `footnote`/`caption` base it is composed onto.
 *
 * ⛔ **The a11y half of L1-20 is REFUTED, and it was the finding's stated reason.** *"VoiceOver can spell
 * out or alter intonation on literal all-caps"* is false on the platform that ships: RN applies
 * `textTransform` by uppercasing the `NSString` itself
 * (`RCTTextAttributes.mm:303`, `RCTTextTransformUppercase: return [text uppercaseString]`), so the native
 * accessibility value is "PAYDAY GUARDIAN" either way. **The DRIFT half survives**, and it is the only
 * reason this exists: fifteen `eyebrow` styles, six applying `textTransform` and nine relying on the
 * string's own caps, means a future change reaches half the headers.
 *
 * ⚠️ **`fontWeight` IS DELIBERATELY NOT HERE, and that is a decision rather than an omission.** The
 * fifteen styles are two authoring generations: the six styled ones carry `'700'`, the nine literal-caps
 * ones carry none and inherit **400**. Folding a weight in would make **seven live surfaces bold** — a
 * visible design change across the app, inside a code freeze, that no instrument in this repo would
 * judge. ⚡ **The auditor's own cost note said this token "touches zero strings and zero tests"; true,
 * and it says nothing about pixels.** `letterSpacing` converges (0.5–1.0 → 0.5, sub-pixel per character
 * at 12–13 pt); the weight is filed as a 2.1 design call.
 *
 * ⛔ Scope is the fifteen styles NAMED `eyebrow`. W2 counted **34** uppercase-display styles under eleven
 * different names (`groupLabel`, `statLabel`, `colMonth`, `sectionTitle`…) — a `statLabel` is not an
 * eyebrow, and sweeping them together would be inventing a role, not adopting one.
 */
export const eyebrow: TextStyle = { textTransform: 'uppercase', letterSpacing: 0.5 };
