/**
 * Resolve the full semantic color token tree for the active color scheme. The primary color API
 * for all screens + components:
 *   const c = useAppColors();
 *   <View style={{ backgroundColor: c.background.primary }} />
 */

import { useColorScheme } from '@/hooks/use-color-scheme';
import { resolveColors, type ResolvedColors } from '@/theme/colors';

export function useAppColors(): ResolvedColors {
  return resolveColors(useColorScheme() === 'dark' ? 'dark' : 'light');
}
