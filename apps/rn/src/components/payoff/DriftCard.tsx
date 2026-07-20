import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import type { DriftResult } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Drift Tracker — the premium_plus carrot, lead module on Payoff (V17_DRIFT_TRACKER_SPEC placement).
 * "You're ~N days ahead/behind the plan the engine authored for you." Three states: a locked teaser
 * for non-premium_plus, a "building your history…" empty state until enough data, and the live drift.
 * Tone is encouraging, never punishing (behind = calm amber, not alarm red — the user is progressing).
 */
export function DriftCard({ drift, isPremiumPlus }: { drift: DriftResult | null; isPremiumPlus: boolean }) {
  const c = useAppColors();

  if (!isPremiumPlus) {
    return (
      <Card tone="accent" style={styles.card}>
        <Header icon="trending-flat" tint={c.accent.purple} label="DRIFT TRACKER" c={c} />
        <Text style={[textStyles.title3, { color: c.text.primary }]}>Are you ahead or behind your plan?</Text>
        <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
          Premium+ tracks your real balance against the plan the app authored for you — see exactly how many days
          ahead or behind you are.
        </Text>
        <View style={[styles.badge, { backgroundColor: c.accent.purple }]}>
          <AppIcon name="lock" size={13} color={c.text.onAccent} />
          <Text style={[textStyles.caption, styles.badgeText, { color: c.text.onAccent }]}>Premium+</Text>
        </View>
      </Card>
    );
  }

  if (!drift) {
    return (
      <Card tone="accent" style={styles.card}>
        <Header icon="timeline" tint={c.accent.purple} label="DRIFT TRACKER" c={c} />
        <Text style={[textStyles.title3, { color: c.text.primary }]}>Building your drift history…</Text>
        <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
          Once a couple of pay cycles roll through, this shows how many days ahead or behind your plan you&apos;re running.
        </Text>
      </Card>
    );
  }

  const days = Math.abs(drift.daysBehind);
  const dayWord = days === 1 ? 'day' : 'days';
  const dollars = formatCurrency(Math.abs(drift.dollarsBehind));

  const { tint, icon, title, subtitle } =
    drift.status === 'ahead'
      ? {
          tint: c.accent.success,
          icon: 'trending-up' as const,
          title: `You're ${days} ${dayWord} ahead of plan`,
          subtitle: `${dollars} less debt than your plan projected for today. Keep it up.`,
        }
      : drift.status === 'behind'
        ? {
            tint: c.accent.warning,
            icon: 'trending-down' as const,
            title: `You're ${days} ${dayWord} behind plan`,
            subtitle: `${dollars} more than projected for today — a bigger payment or two closes the gap.`,
          }
        : {
            tint: c.accent.success,
            icon: 'check-circle' as const,
            title: "You're right on plan",
            subtitle: 'Your real balance is tracking within a few days of your projection.',
          };

  return (
    <Card tone="accent" style={styles.card}>
      <Header icon="timeline" tint={c.accent.purple} label="DRIFT TRACKER" c={c} />
      <View style={styles.headline}>
        <AppIcon name={icon} size={22} color={tint} />
        <Text style={[textStyles.title2, styles.title, { color: c.text.primary }]}>{title}</Text>
      </View>
      <Text style={[textStyles.subhead, { color: c.text.secondary }]}>{subtitle}</Text>
    </Card>
  );
}

function Header({
  icon,
  tint,
  label,
  c,
}: {
  icon: 'timeline' | 'trending-flat';
  tint: string;
  label: string;
  c: ReturnType<typeof useAppColors>;
}) {
  return (
    <View style={styles.header}>
      <AppIcon name={icon} size={15} color={tint} />
      <Text style={[textStyles.footnote, styles.eyebrow, { color: tint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
  headline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  title: { flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999, marginTop: spacing.xs },
  badgeText: { fontWeight: '700', letterSpacing: 0.3 },
});
