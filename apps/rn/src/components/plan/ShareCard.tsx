import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import type { CelebrationStats } from '@/store/celebrationSelectors';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/**
 * VIS-2 — the branded, shareable "I'm debt-free" card. Rendered off-screen and captured to a PNG by the
 * finale's Share action (`react-native-view-shot`), so it's the one organic-growth artifact worth posting.
 * Deliberately STATIC + View-based (no Skia/animation) so `captureRef` reliably rasterizes it on device;
 * navy in both themes, matching the finale's identity. Fixed width for a consistent share image.
 */
const W = 360;

export function ShareCard({ stats }: { stats: CelebrationStats }) {
  const surf = useAppColors().surface;
  return (
    <LinearGradient colors={[surf.heroTop, surf.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={[styles.ring, { backgroundColor: surf.goldPill }]}>
        <AppIcon name="check" size={46} color={colors.surface.goldPillInk.light} />
      </View>
      {/* A4 — the card is a fixed-size capture artifact; font scaling would break its layout. */}
      <Text style={[styles.headline, { color: surf.heroText }]} allowFontScaling={false}>I&rsquo;m debt-free</Text>

      <View style={styles.trio}>
        <Stat value={formatWhole(stats.totalPaid)} label="vanquished" surf={surf} />
        <Stat value={String(stats.debtsCleared)} label={stats.debtsCleared === 1 ? 'debt' : 'debts'} surf={surf} />
        {stats.monthsToFreedom != null ? (
          <Stat value={String(stats.monthsToFreedom)} label={stats.monthsToFreedom === 1 ? 'month' : 'months'} surf={surf} />
        ) : null}
      </View>

      <View style={styles.brandRow}>
        <AppIcon name="shield" size={13} color={surf.goldPill} />
        <Text style={[textStyles.footnote, styles.brand, { color: surf.heroSub }]} allowFontScaling={false}>Debt Planner &middot; honest, on-device payoff</Text>
      </View>
    </LinearGradient>
  );
}

function Stat({ value, label, surf }: { value: string; label: string; surf: { goldPill: string; heroSub: string } }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
      <Text style={[styles.statVal, { color: surf.goldPill }]} allowFontScaling={false}>{value}</Text>
      <Text style={[textStyles.caption, styles.statLabel, { color: surf.heroSub }]} allowFontScaling={false}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: W, alignItems: 'center', paddingVertical: 40, paddingHorizontal: spacing.xl, gap: spacing.md, borderRadius: 28 },
  ring: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  headline: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginTop: spacing.xs },
  trio: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.xl, marginTop: spacing.sm },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  statLabel: { textTransform: 'uppercase', letterSpacing: 0.6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  brand: { fontWeight: '600' },
});
