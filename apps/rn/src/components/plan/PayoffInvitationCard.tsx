import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cardElevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Provisional debt-payoff invitation (2.3.6, Beat 1). The premium estimate reached $0 on its own → the
 * app celebrates the MOMENT immediately (gold = the debt-free moment) but explicitly PENDING: nothing
 * permanent is written until the user confirms it's actually paid off. Confirm → re-anchor the balance
 * to $0 (the confirmed signal the Phase-3 celebration spectacle + the debts-paid-off archive hang
 * off). We never fire the full ceremony off an unconfirmed estimate.
 */
export function PayoffInvitationCard({
  debtName,
  onConfirm,
  onNotYet,
}: {
  debtName: string;
  onConfirm: () => void;
  onNotYet: () => void;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const gold = c.accent.gold;
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`Looks like you paid off ${debtName}. Confirm to make it official.`}
      style={[styles.card, cardElevation(scheme), { backgroundColor: c.background.secondary, borderColor: gold }]}>
      <View style={styles.head}>
        <AppIcon name="check-circle" size={22} color={gold} />
        <Text style={[textStyles.title2, styles.title, { color: c.text.primary }]}>Looks like you crushed {debtName}!</Text>
      </View>
      <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
        Your estimate reached $0. Confirm it&apos;s paid off and we&apos;ll make it official.
      </Text>
      <Button label="Confirm — it's paid off" onPress={onConfirm} />
      <Text onPress={onNotYet} accessibilityRole="button" style={[textStyles.subhead, styles.notYet, { color: c.text.tertiary }]}>
        Not yet — update the balance
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    padding: layout.cardPaddingH,
    gap: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
  notYet: { textAlign: 'center', paddingTop: spacing.xs },
});
