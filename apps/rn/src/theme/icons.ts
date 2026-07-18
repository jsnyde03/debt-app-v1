/**
 * Debt Planner — icon token maps.
 *
 * B.1 renders MaterialIcons glyphs on every platform (web-verifiable, zero native modules). The
 * SF-Symbols-on-iOS upgrade (crisper, Dynamic-Type-aware) lands at B.8 native re-glue — see the
 * note in `components/tab-bar-icon.tsx`. Tab glyphs mirror the Capacitor nav (Plan=home,
 * Bills=card, Payoff=trend, Goals=target).
 */

import type { MaterialIcons } from '@expo/vector-icons';

type MaterialGlyph = keyof typeof MaterialIcons.glyphMap;

export const tabIcons = {
  plan: 'home',
  bills: 'credit-card',
  payoff: 'trending-up',
  goals: 'adjust',
} satisfies Record<string, MaterialGlyph>;

export const icons = {
  more: 'more-horiz',
  back: 'chevron-left',
  close: 'close',
} satisfies Record<string, MaterialGlyph>;

export type TabIconName = keyof typeof tabIcons;
export type IconName = keyof typeof icons;
