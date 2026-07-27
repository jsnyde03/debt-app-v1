/**
 * Premium tokenized icon — **Android/web** variant (MaterialIcons). iOS renders SF Symbols via the
 * platform-split `AppIcon.ios.tsx` (glyph → symbol map in `@/theme/icons`). Keep the two files' exports
 * in sync (`AppIcon` + `IconGlyph`) per feedback_platform_split_reexport_gap.
 */
import { MaterialIcons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

export type IconGlyph = keyof typeof MaterialIcons.glyphMap;

export function AppIcon({ name, size = 24, color }: { name: IconGlyph; size?: number; color: ColorValue }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
