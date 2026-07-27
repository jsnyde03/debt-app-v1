/**
 * The "•••" More header action — the ratified IA EVOLVE entry point (no gear, no 5th tab).
 * Present in every tab header for consistent access; opens the More hub (Data / Preferences / About).
 */

import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { icons } from '@/theme/icons';

export function MoreButton() {
  const c = useAppColors();
  return (
    <Pressable
      onPress={() => router.push('/more')}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="More">
      {/* Routed through AppIcon so iOS gets the SF-Symbol ellipsis (more-horiz → ellipsis). */}
      <AppIcon name={icons.more} size={24} color={c.text.secondary} />
    </Pressable>
  );
}
