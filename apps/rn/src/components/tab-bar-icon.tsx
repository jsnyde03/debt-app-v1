/**
 * Bottom-tab / sidebar icon — **SF Symbols on iOS** (`expo-symbols`, weight/Dynamic-Type/dark-mode
 * aware) with a **MaterialIcons fallback** on Android/web (SymbolView is iOS-only).
 */

import { MaterialIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { Platform, type ColorValue } from 'react-native';

import { tabIcons, type TabIconName } from '@/theme/icons';

const SIZE = 26;

export function TabBarIcon({ name, color }: { name: TabIconName; color: ColorValue }) {
  const glyph = tabIcons[name];
  if (Platform.OS === 'ios') {
    return <SymbolView name={glyph.sf} tintColor={color as string} size={SIZE} />;
  }
  return <MaterialIcons name={glyph.md} size={SIZE} color={color} />;
}
