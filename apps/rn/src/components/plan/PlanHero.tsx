import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { PlanSummary } from '@/store/planSelectors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** Subtle premium-tinted hero surface (a real gradient lands at B.9 polish). */
const HERO_BG = { light: '#f1f0fb', dark: '#0e1a2e' } as const;

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The Plan hero (agreed redesign 2026-07-19): leads with "$X to debt this paycheck" — the
 * actionable this-cycle figure — with planned/cushion secondary and the debt-free date as
 * reassurance. Payday-first framing (v1.6) kept; the app-name h1 is gone.
 */
export function PlanHero({ summary, nextPaycheckDate }: { summary: PlanSummary; nextPaycheckDate: string }) {
  const c = useAppColors();
  const scheme = useColorScheme();

  const statusLabel =
    summary.status === 'overdue'
      ? 'Overdue payments need attention'
      : summary.status === 'short'
        ? `Short ${formatCurrency(summary.shortfall)} this cycle`
        : "You're on track this cycle";
  const statusColor =
    summary.status === 'on-track' ? c.accent.success : summary.status === 'short' ? c.accent.warning : c.accent.danger;

  return (
    <View style={[styles.hero, { backgroundColor: HERO_BG[scheme], borderColor: c.border.default }]}>
      <Text style={[textStyles.footnote, styles.eyebrow, { color: c.accent.primary }]}>
        THIS PAYCHECK · {shortDate(nextPaycheckDate)}
      </Text>

      <View style={styles.numberRow}>
        <Text style={[styles.heroNumber, { color: c.text.primary }]}>{formatCurrency(summary.heroValue)}</Text>
        <Text style={[textStyles.callout, { color: c.text.secondary }]}>{summary.heroLabel}</Text>
      </View>

      <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
        {formatCurrency(summary.planned)} planned · {formatCurrency(summary.cushion)} cushion
      </Text>

      <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />

      <View style={styles.footerRow}>
        {summary.debtFreeDate ? (
          <View style={styles.reassure}>
            <AppIcon name="check-circle" size={16} color={c.accent.success} />
            <Text style={[textStyles.subhead, { color: c.text.primary }]}>Debt-free by {summary.debtFreeDate}</Text>
          </View>
        ) : (
          <View />
        )}
        <Text style={[textStyles.caption, styles.status, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: layout.cardRadiusLarge,
    borderWidth: StyleSheet.hairlineWidth,
    padding: layout.cardPaddingH + 2,
    gap: spacing.xs,
  },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  numberRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' },
  heroNumber: { fontSize: 40, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
  reassure: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  status: { fontWeight: '600' },
});
