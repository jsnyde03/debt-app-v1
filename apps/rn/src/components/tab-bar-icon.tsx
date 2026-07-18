/**
 * Bottom-tab / sidebar icon.
 *
 * B.1 renders MaterialIcons on every platform (web-verifiable, zero native modules).
 * B.8 native re-glue upgrades iOS to SF Symbols (via `expo-symbols` — weight/Dynamic-Type/dark-mode
 * aware, no asset files) with the MaterialIcons fallback kept for Android/web.
 */

import { MaterialIcons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

import { tabIcons, type TabIconName } from '@/theme/icons';

const SIZE = 26;

export function TabBarIcon({ name, color }: { name: TabIconName; color: ColorValue }) {
  return <MaterialIcons name={tabIcons[name]} size={SIZE} color={color} />;
}
