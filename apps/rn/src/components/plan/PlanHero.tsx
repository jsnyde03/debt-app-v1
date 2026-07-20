import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { PlanSummary } from '@/store/planSelectors';
import { colors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

// On-navy semantics: the hero panel is deep navy in BOTH themes, so its accents are the dark-tuned
// token values (they read on navy) — constant, never theme-resolved.
const onNavy = {
  success: colors.accent.success.dark,
  warning: colors.accent.warning.dark,
  danger: colors.accent.danger.dark,
};

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The Today hero (Elevation, redesigned 2026-07-20): an **outcome anchor**, not a dollar amount —
 * the signature **navy panel (constant in both themes)** leads with the debt-free date + on-track
 * status. The amounts live in the cards below; the hero carries the "why / where you're headed."
 * (No payment figure in the hero — optional actions must never read as obligations.)
 */
export function PlanHero({
  summary,
  nextPaycheckDate,
  onEditPaycheck,
}: {
  summary: PlanSummary;
  nextPaycheckDate: string;
  onEditPaycheck?: () => void;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const s = c.surface;

  const statusLabel =
    summary.status === 'overdue'
      ? 'Overdue payments need attention'
      : summary.status === 'short'
        ? 'Short this cycle — cover from savings'
        : "You're on track this cycle";
  const statusColor =
    summary.status === 'on-track' ? onNavy.success : summary.status === 'short' ? onNavy.warning : onNavy.danger;

  return (
    <LinearGradient
      colors={[s.heroTop, s.heroBottom]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, elevation.hero[scheme]]}>
      <Pressable
        onPress={onEditPaycheck}
        disabled={!onEditPaycheck}
        accessibilityRole={onEditPaycheck ? 'button' : undefined}
        accessibilityLabel={onEditPaycheck ? 'Edit paycheck' : undefined}
        style={styles.eyebrowRow}>
        <Text style={[textStyles.footnote, styles.eyebrow, { color: s.heroSub }]}>
          THIS PAYCHECK · {shortDate(nextPaycheckDate)}
        </Text>
        {onEditPaycheck ? <AppIcon name="edit" size={14} color={s.heroSub} /> : null}
      </Pressable>

      <Text style={[styles.headline, { color: s.heroText }]}>
        {summary.debtFreeDate ? `Debt-free by ${summary.debtFreeDate}` : 'On track this cycle'}
      </Text>

      <View style={styles.statusRow}>
        <AppIcon
          name={summary.status === 'on-track' ? 'check-circle' : 'error-outline'}
          size={16}
          color={statusColor}
        />
        <Text style={[textStyles.subhead, styles.status, { color: statusColor }]}>{statusLabel}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: layout.cardRadiusLarge,
    padding: layout.cardPaddingH + 2,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  headline: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, lineHeight: 36 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  status: { fontWeight: '600' },
});
