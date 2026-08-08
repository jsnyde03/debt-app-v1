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

/**
 * SF-Symbol equivalents for the MaterialIcons glyphs `AppIcon` renders, so iOS gets native symbols
 * (weight/Dynamic-Type/dark-mode aware) instead of the generic-Android Material glyphs. `AppIcon.ios`
 * looks a glyph up here; anything NOT listed simply keeps its MaterialIcons rendering on iOS (graceful
 * degrade). `SFSymbol` is the full symbol-name union, so tsc rejects an invalid name at compile time.
 */
export const appIconSF: Partial<Record<MaterialGlyph, SFSymbol>> = {
  // navigation / actions
  'chevron-right': 'chevron.right',
  'chevron-left': 'chevron.left',
  'expand-more': 'chevron.down',
  close: 'xmark',
  cancel: 'xmark.circle.fill',
  check: 'checkmark',
  'check-circle': 'checkmark.circle.fill',
  'task-alt': 'checkmark.circle',
  add: 'plus',
  'add-circle-outline': 'plus.circle',
  edit: 'pencil',
  search: 'magnifyingglass',
  'more-horiz': 'ellipsis',
  update: 'arrow.clockwise',
  // finance / domain
  'account-balance-wallet': 'wallet.pass.fill',
  savings: 'banknote.fill',
  'shopping-cart': 'cart.fill',
  'trending-up': 'chart.line.uptrend.xyaxis',
  'trending-down': 'chart.line.downtrend.xyaxis',
  'auto-graph': 'chart.xyaxis.line',
  assignment: 'doc.text.fill',
  history: 'clock.arrow.circlepath',
  schedule: 'clock', // the Payday Countdown toggle (3.5.3)
  // 3.5.5.3 — "Show feature tips again". `lightbulb` (not `.fill`) has been in SF Symbols since iOS 13,
  // so it clears the min target without the §3.1.2 iOS-16 caveat the newer glyphs carry.
  'lightbulb-outline': 'lightbulb',
  'phone-iphone': 'iphone',
  // status / trust (gpp-* = the shield family)
  'gpp-good': 'checkmark.shield.fill',
  'gpp-bad': 'xmark.shield.fill',
  'gpp-maybe': 'exclamationmark.shield.fill',
  shield: 'shield.fill',
  'verified-user': 'checkmark.seal.fill',
  lock: 'lock.fill',
  'error-outline': 'exclamationmark.triangle',
  healing: 'bandage.fill',
  // premium / celebration
  'workspace-premium': 'rosette',
  star: 'star.fill',
  celebration: 'party.popper.fill',
} satisfies Partial<Record<MaterialGlyph, SFSymbol>>;

export type TabIconName = keyof typeof tabIcons;
export type IconName = keyof typeof icons;
