import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * The app's effective color scheme. B.1: follows the OS.
 *
 * The in-app appearance override (More → Preferences → `themeMode`: system/light/dark) wires in at
 * B.8 when the Zustand store lands — this hook becomes the single source for the whole app then
 * (and the root nav theme reads it too), matching Freedom's pattern.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useRNColorScheme() === 'dark' ? 'dark' : 'light';
}
