import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { useAppColors } from '@/hooks/use-app-colors';
import type { PlanSummary } from '@/store/planSelectors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

/**
 * A calm "safe to spend" strip — the headroom you have to work with (for extras or cushion) once the
 * required bills + minimums are covered. Deliberately lighter than the action cards; the amount's
 * color carries the stable/tight/pressure health. Doubles (later, 1.4) as the entry into the Progress
 * cash-flow timeline.
 */
export function RemainingAfterRequired({
  remaining,
  status,
}: {
  remaining: number;
  status: PlanSummary['cushionStatus'];
}) {
  const c = useAppColors();
  const tone = status === 'stable' ? c.accent.success : status === 'tight' ? c.accent.warning : c.accent.danger;
  const amount = formatCurrency(Math.max(0, remaining));
  return (
    <View
      {...groupLabel('Remaining after obligations', amount, 'safe to spend after required payments')}
      style={[styles.row, { backgroundColor: c.background.tertiary, borderColor: c.border.subtle }]}>
      <View style={styles.left}>
        <Text style={[textStyles.bodyMedium, styles.title, { color: c.text.primary }]}>Remaining After Obligations</Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Safe to spend after required payments</Text>
      </View>
      <Text style={[styles.amount, { color: tone }]}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: layout.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: spacing.md,
  },
  left: { flex: 1, gap: 2 },
  title: { fontWeight: '700' },
  amount: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
});
