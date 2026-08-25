import { PAID_OFF_LABEL } from '@core/copy/vocabulary';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { eyebrow, textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/**
 * VIS-2 / B2 — the branded, shareable card. Rendered off-screen and captured to a PNG by a Share action
 * (`react-native-view-shot`), the one organic-growth artifact worth posting. Three variants so the SAME
 * card serves every debt-free moment, not just the once-per-lifetime finale:
 *   • `finale`   — "I'm debt-free" + the honest stat trio (the grand finale).
 *   • `debt`     — "{Debt} paid off" + the amount cleared (the per-debt beat, hit repeatedly).
 *   • `progress` — "N debts paid off · $X cleared" (the persistent archive / trophy shelf).
 * Deliberately STATIC + View-based (no Skia/animation) so `captureRef` reliably rasterizes it; navy in
 * both themes; fixed width for a consistent image; font scaling locked (a fixed-size capture artifact).
 */
const W = 360;

export type ShareCardData =
  | { kind: 'finale'; totalPaid: number; debtsCleared: number; monthsToFreedom: number | null }
  | { kind: 'debt'; debtName: string; amount: number | null; freedPerMonth: number }
  | { kind: 'progress'; debtsCleared: number; totalPaid: number };

export function ShareCard({ data }: { data: ShareCardData }) {
  const surf = useAppColors().surface;
  return (
    <LinearGradient colors={[surf.heroTop, surf.heroBottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={[styles.ring, { backgroundColor: surf.goldPill }]}>
        <AppIcon name="check" size={46} color={colors.surface.goldPillInk.light} />
      </View>

      {data.kind === 'finale' ? (
        <>
          <Text style={[styles.headline, { color: surf.heroText }]} allowFontScaling={false}>I&rsquo;m debt-free</Text>
          <View style={styles.trio}>
            <Stat value={formatWhole(data.totalPaid)} label="paid off" surf={surf} />
            <Stat value={String(data.debtsCleared)} label={data.debtsCleared === 1 ? 'debt' : 'debts'} surf={surf} />
            {data.monthsToFreedom != null ? (
              <Stat value={String(data.monthsToFreedom)} label={data.monthsToFreedom === 1 ? 'month' : 'months'} surf={surf} />
            ) : null}
          </View>
        </>
      ) : data.kind === 'debt' ? (
        <>
          <Text style={[textStyles.footnote, styles.eyebrow, { color: surf.heroSub }]} allowFontScaling={false}>{data.debtName.toUpperCase()}</Text>
          <Text style={[styles.headline, { color: surf.heroText }]} allowFontScaling={false}>{PAID_OFF_LABEL}</Text>
          <Text style={[styles.amount, { color: surf.goldPill }]} allowFontScaling={false}>{data.amount != null ? formatWhole(data.amount) : PAID_OFF_LABEL}</Text>
          {data.freedPerMonth > 0 ? (
            <Text style={[textStyles.subhead, styles.sub, { color: surf.heroSub }]} allowFontScaling={false}>
              {formatWhole(data.freedPerMonth)}/mo freed toward the next one
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text style={[styles.headline, { color: surf.heroText }]} allowFontScaling={false}>
            {data.debtsCleared} {data.debtsCleared === 1 ? 'debt' : 'debts'} paid off
          </Text>
          {data.totalPaid > 0 ? (
            <Text style={[styles.amount, { color: surf.goldPill }]} allowFontScaling={false}>{formatWhole(data.totalPaid)} paid off</Text>
          ) : null}
          <Text style={[textStyles.subhead, styles.sub, { color: surf.heroSub }]} allowFontScaling={false}>on my way to debt-free</Text>
        </>
      )}

      <View style={styles.brandRow}>
        <AppIcon name="verified-user" size={13} color={surf.goldPill} />
        <Text style={[textStyles.footnote, styles.brand, { color: surf.heroSub }]} allowFontScaling={false}>
          Debt Planner &middot; your payday debt-payoff app
        </Text>
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
  card: { width: W, alignItems: 'center', paddingVertical: 40, paddingHorizontal: spacing.xl, gap: spacing.sm, borderRadius: 28 },
  ring: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  // ⚠️ [P6.8.9.7.11.14.5] The wider tracking is an OVERRIDE, not residue. This card is an exported image
  // rather than a screen, and its label is display type — narrowing it to the token's 0.5 would change a
  // shareable artifact to make a stylesheet tidier. Same call on `PaidOffBeat`'s takeover.
  eyebrow: { ...eyebrow, letterSpacing: 1, fontWeight: '700' },
  headline: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: spacing.xs, textAlign: 'center' },
  amount: { fontSize: 34, fontWeight: '800', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  sub: { textAlign: 'center' },
  trio: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: spacing.xl, marginTop: spacing.sm },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  statLabel: { textTransform: 'uppercase', letterSpacing: 0.6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  brand: { fontWeight: '600' },
});
