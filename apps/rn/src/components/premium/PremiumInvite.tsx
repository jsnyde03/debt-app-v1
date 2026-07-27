import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { PREMIUM_PURCHASABLE } from '@/premium/config';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * A tappable, value-led upsell that opens the paywall (`/paywall`). One shared component so every
 * in-context invite (affordability, Guardian, …) looks + behaves the same and is a proper a11y button
 * (never buried, non-narrated text). The always-findable entry for a reviewer is the More hub row; these
 * are the contextual, at-the-moment-of-need entries.
 */
export function PremiumInvite({ message }: { message: string }) {
  const c = useAppColors();
  if (!PREMIUM_PURCHASABLE) return null; // launch kill-switch — no upsell when purchases are off
  return (
    <Pressable
      onPress={() => router.push('/paywall')}
      accessibilityRole="button"
      accessibilityLabel={`${message} Opens Premium.`}
      hitSlop={6}
      style={styles.row}>
      <AppIcon name="workspace-premium" size={18} color={c.accent.primary} />
      <Text style={[textStyles.subhead, styles.text, { color: c.accent.primary }]}>{message}</Text>
      <AppIcon name="chevron-right" size={18} color={c.accent.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  text: { flex: 1, fontWeight: '600' },
});
