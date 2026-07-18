import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/theme/colors';

/** React-Navigation theme mapped to Debt's palette so route transitions never flash white. */
function navTheme(scheme: 'light' | 'dark') {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background.primary[scheme],
      card: colors.background.secondary[scheme],
      text: colors.text.primary[scheme],
      border: colors.border.subtle[scheme],
      primary: colors.accent.primary[scheme],
    },
  };
}

/**
 * Root layout — B.1 shell: providers + Stack only.
 *
 * Deferred: the onboarding route-guard (`Stack.Protected` on `isComplete`) → B.2; the Sentry wrap
 * + MMKV-persistence / iCloud-restore / notifications bootstrap → B.8 native re-glue.
 */
export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ThemeProvider value={navTheme(scheme)}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="more" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}
