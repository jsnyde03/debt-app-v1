/**
 * Debt Planner — icon token maps.
 *
 * Tab glyphs render as **SF Symbols on iOS** (via `expo-symbols` — weight/Dynamic-Type/dark-mode
 * aware, no asset files) with a **MaterialIcons fallback** on Android/web. The new 3-tab IA:
 * Today (checklist — what to pay) · Progress (uptrend — the journey) · Money (card — accounts).
 */

import type { MaterialIcons } from '@expo/vector-icons';
import type { SymbolViewProps } from 'expo-symbols';

type MaterialGlyph = keyof typeof MaterialIcons.glyphMap;
type SFSymbol = SymbolViewProps['name'];

export const tabIcons = {
  today: { sf: 'checklist', md: 'checklist' },
  progress: { sf: 'chart.line.uptrend.xyaxis', md: 'trending-up' },
  money: { sf: 'creditcard', md: 'account-balance-wallet' },
} satisfies Record<string, { sf: SFSymbol; md: MaterialGlyph }>;

export const icons = {
  more: 'more-horiz',
  back: 'chevron-left',
  close: 'close',
} satisfies Record<string, MaterialGlyph>;

export type TabIconName = keyof typeof tabIcons;
export type IconName = keyof typeof icons;
