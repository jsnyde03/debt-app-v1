import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { MoreButton } from '@/components/more-button';
import { TrajectoryChart } from '@/components/payoff/TrajectoryChart';
import { CashFlowSection } from '@/components/progress/CashFlowSection';
import { MilestonesRow } from '@/components/progress/MilestonesRow';
import { MomentumStats } from '@/components/progress/MomentumStats';
import { ProgressRing } from '@/components/progress/ProgressRing';
import { Screen } from '@/components/screen';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { useAppColors } from '@/hooks/use-app-colors';
import { useGoToTab } from '@/hooks/use-go-to-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { appStore } from '@/store/appStore';
import { selectCashTimeline, selectPayoffView } from '@/store/payoffSelectors';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Progress tab — the journey. Navy ring hero (1.4.1); milestones · momentum · cash-cushion timeline ·
 * celebration land in 1.4.2+. The payoff chart / strategy / order below are transitional (reworked
 * or relocated as those sections arrive).
 */
export default function ProgressScreen() {
  const c = useAppColors();
  const scheme = useColorScheme();
  const goToTab = useGoToTab();
  const store = useAppStore((s) => s.store);
  const strategy = store.payoffStrategy;
  const view = selectPayoffView(store);

  if (!view.hasDebts) {
    return (
      <Screen title="Progress" right={<MoreButton />}>
        <EmptyState
          icon="trending-down"
          title="No debts to pay off"
          body="Add a debt to see your payoff order, timeline, and interest saved."
          cta="Add a debt"
          onCta={() => goToTab('money')}
        />
      </Screen>
    );
  }

  const totalOriginal = store.debts.reduce((sum, d) => sum + (d.originalBalance ?? d.balance), 0);
  const totalCurrent = store.debts.reduce((sum, d) => sum + d.balance, 0);
  const totalPaid = Math.max(0, totalOriginal - totalCurrent);
  const pct = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;
  const surf = c.surface;

  return (
    <Screen title="Progress" right={<MoreButton />}>
      <LinearGradient
        colors={[surf.heroTop, surf.heroBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, elevation.hero[scheme]]}>
        <View style={styles.ringRow}>
          <ProgressRing percent={pct} trackColor="rgba(255,255,255,0.14)" color={colors.accent.primary.dark}>
            <Text style={[styles.ringPct, { color: surf.heroText }]}>{pct}%</Text>
            <Text style={[textStyles.caption, { color: surf.heroSub }]}>paid</Text>
          </ProgressRing>
          <View style={styles.ringMeta}>
            <Text style={[textStyles.footnote, styles.eyebrow, { color: surf.heroSub }]}>DEBT-FREE</Text>
            <Text style={[styles.heroDate, { color: surf.heroText }]}>{view.debtFreeDate ?? '—'}</Text>
            <Text style={[textStyles.subhead, { color: surf.heroSub }]}>
              {formatCurrency(totalPaid)} of {formatCurrency(totalOriginal)} paid
            </Text>
          </View>
        </View>
      </LinearGradient>

      <MilestonesRow pct={pct} debtFreeLabel={view.debtFreeDate ?? undefined} />
      <MomentumStats interestSaved={view.interestSaved} paid={totalPaid} />
      <CashFlowSection cycles={selectCashTimeline(store)} />

      <TrajectoryChart snowball={view.snowball} avalanche={view.avalanche} strategy={strategy} debtFreeDate={view.debtFreeDate} />

      <View style={styles.stratBlock}>
        <SegmentedToggle
          value={strategy}
          onChange={(s) => appStore.getState().setPayoffStrategy(s)}
          options={[
            { value: 'snowball', label: 'Snowball' },
            { value: 'avalanche', label: 'Avalanche' },
          ]}
        />
        <Text style={[textStyles.caption, styles.stratDesc, { color: c.text.tertiary }]}>
          {strategy === 'snowball' ? 'Smallest balance first — quick wins for momentum.' : 'Highest APR first — least interest paid.'}
        </Text>
      </View>

      {view.focus ? (
        <Card>
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.secondary }]}>FOCUS DEBT</Text>
          <View style={styles.focusRow}>
            <Text style={[textStyles.title3, { color: c.text.primary }]} numberOfLines={1}>
              {view.focus.name}
            </Text>
            <Text style={[textStyles.numericBody, { color: c.text.primary, fontWeight: '700' }]}>{formatCurrency(view.focus.balance)}</Text>
          </View>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Highest-priority target · {view.focus.apr}% APR</Text>
          {view.focus.originalBalance && view.focus.originalBalance > 0 ? (
            <View style={[styles.track, { backgroundColor: c.background.tertiary }]}>
              <View
                style={[
                  styles.fill,
                  { backgroundColor: c.accent.success, width: `${Math.min(100, Math.max(0, (1 - view.focus.balance / view.focus.originalBalance) * 100))}%` },
                ]}
              />
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card padded={false}>
        <Text style={[textStyles.title3, styles.orderTitle, { color: c.text.primary }]}>Payoff order</Text>
        {view.order.map((d, i) => (
          <View
            key={d.id}
            style={[styles.orderRow, i < view.order.length - 1 && { borderBottomColor: c.border.subtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[textStyles.numericBody, styles.rank, { color: c.text.tertiary }]}>{i + 1}</Text>
            <View style={styles.flex}>
              <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={1}>
                {d.name}
              </Text>
              <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                {d.apr}% APR · min {formatCurrency(d.minimumPayment)}
              </Text>
            </View>
            <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(d.balance)}</Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: layout.cardRadiusLarge, padding: layout.cardPaddingH + 2, overflow: 'hidden' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringMeta: { flex: 1, gap: 3 },
  ringPct: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  heroDate: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  stratBlock: { gap: spacing.xs },
  stratDesc: { textAlign: 'center' },
  focusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.xs },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: 6, borderRadius: 3 },
  orderTitle: { paddingHorizontal: layout.cardPaddingH, paddingTop: layout.cardPaddingV, paddingBottom: spacing.sm },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: layout.cardPaddingH, paddingVertical: spacing.md },
  rank: { width: 20, textAlign: 'center', fontWeight: '700' },
  flex: { flex: 1, gap: 2 },
});
