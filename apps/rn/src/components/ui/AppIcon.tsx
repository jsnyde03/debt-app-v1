/**
 * Premium tokenized icon (MaterialIcons on every platform for now; SF Symbols on iOS at B.9).
 * Replaces the Capacitor onboarding's emoji for a more premium, on-brand look.
 */
import { MaterialIcons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

export type IconGlyph = keyof typeof MaterialIcons.glyphMap;

export function AppIcon({ name, size = 24, color }: { name: IconGlyph; size?: number; color: ColorValue }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}
