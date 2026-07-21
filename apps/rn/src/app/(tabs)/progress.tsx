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
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppColors } from '@/hooks/use-app-colors';
import { useGoToTab } from '@/hooks/use-go-to-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
});
