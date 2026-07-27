/**
 * iOS AppIcon — renders **SF Symbols** (via `expo-symbols`: weight / Dynamic-Type / dark-mode aware,
 * no asset files) for the glyphs mapped in `appIconSF`, with a **MaterialIcons fallback** for anything
 * unmapped. Mirrors the Android/web `AppIcon.tsx` so callers are platform-agnostic.
 *
 * MUST re-export EVERYTHING `AppIcon.tsx` exports (`AppIcon` + the `IconGlyph` type). A `.ios` file that
 * overrides one export drops the rest → `undefined` on device only (see feedback_platform_split_reexport_gap).
 */
import { MaterialIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { appIconSF } from '@/theme/icons';

export type IconGlyph = keyof typeof MaterialIcons.glyphMap;

export function AppIcon({ name, size = 24, color }: { name: IconGlyph; size?: number; color: ColorValue }) {
  const sf = appIconSF[name];
  // Unmapped glyph → keep the Material rendering rather than a blank SF slot.
  if (!sf) return <MaterialIcons name={name} size={size} color={color} />;
  return <SymbolView name={sf} tintColor={color as string} size={size} />;
}
