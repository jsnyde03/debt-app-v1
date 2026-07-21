import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { MoreButton } from '@/components/more-button';
import { TrajectoryChart } from '@/components/payoff/TrajectoryChart';
import { CashFlowSection } from '@/components/progress/CashFlowSection';
import { type JourneyRingChartProps, type MilestoneState } from '@/components/progress/JourneyRingChart';
import { JourneyRingCanvas } from '@/components/progress/JourneyRingCanvas';
import { MomentumStats } from '@/components/progress/MomentumStats';
import { Screen } from '@/components/screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppColors } from '@/hooks/use-app-colors';
import { useGoToTab } from '@/hooks/use-go-to-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CountUp } from '@/motion';
import { selectCashTimeline, selectPayoffView } from '@/store/payoffSelectors';
import { useAppStore } from '@/store/useAppStore';
import { colors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

const RING_SIZE = 112;
const MILE_TS = [25, 50, 75, 100] as const;

/** The green→gold ring palette — constants (the navy panel is theme-invariant, so its colors are too). */
const RING_PALETTE: JourneyRingChartProps['palette'] = {
  track: 'rgba(255,255,255,0.14)',
  from: colors.accent.success.dark, // green — start of the sweep
  to: colors.accent.gold.dark, // gold — approaching freedom
  passed: colors.accent.success.dark,
  next: colors.accent.gold.dark,
  dim: 'rgba(255,255,255,0.28)',
  free: colors.accent.gold.dark,
};

/**
 * Progress tab — the journey. Navy Skia ring hero merging % paid + the 25/50/75/Free milestones
 * (green→gold sweep, count-up); momentum · cash-cushion timeline; the Skia trajectory below.
 * Celebration (debt-paid-off spectacle) lands next.
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

  // Milestone states for the on-ring nodes: passed (green) · next (gold glow, the pull-forward) ·
  // upcoming (dim) · Free (the gold destination at 12 o'clock).
  const nextT = MILE_TS.find((t) => pct < t);
  const milestones = MILE_TS.map<{ t: number; state: MilestoneState }>((t) => ({
    t,
    state: t === 100 ? 'free' : pct >= t ? 'passed' : t === nextT ? 'next' : 'upcoming',
  }));

  // One collapsed screen-reader utterance for the ring (which is otherwise a decorative canvas).
  const reached = MILE_TS.filter((t) => pct >= t && t < 100).map((t) => `${t}%`);
  const ringA11y = groupLabel(
    `${pct}% paid`,
    reached.length ? `${reached.join(', ')} reached` : 'no milestones reached yet',
    nextT ? `next milestone ${nextT === 100 ? 'debt-free' : `${nextT}%`}` : 'all milestones reached',
    view.debtFreeDate ? `debt-free projected ${view.debtFreeDate}` : undefined,
  );

  return (
    <Screen title="Progress" right={<MoreButton />}>
      <LinearGradient
        colors={[surf.heroTop, surf.heroBottom]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, elevation.hero[scheme]]}>
        <View style={styles.ringRow}>
          <View style={styles.ringWrap} {...ringA11y}>
            <JourneyRingCanvas size={RING_SIZE} stroke={12} pct={pct} milestones={milestones} palette={RING_PALETTE} />
            <View
              style={[StyleSheet.absoluteFill, styles.ringCenter]}
              pointerEvents="none"
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden>
              <CountUp value={pct} format={(n) => `${Math.round(n)}%`} style={[styles.ringPct, { color: surf.heroText }]} />
              <Text style={[textStyles.caption, { color: surf.heroSub }]}>paid</Text>
            </View>
          </View>
          <View style={styles.ringMeta}>
            <Text style={[textStyles.footnote, styles.eyebrow, { color: surf.heroSub }]}>DEBT-FREE</Text>
            <Text style={[styles.heroDate, { color: surf.heroText }]}>{view.debtFreeDate ?? '—'}</Text>
            <Text style={[textStyles.subhead, { color: surf.heroSub }]}>
              {formatCurrency(totalPaid)} of {formatCurrency(totalOriginal)} paid
            </Text>
          </View>
        </View>
      </LinearGradient>

      <MomentumStats interestSaved={view.interestSaved} paid={totalPaid} />
      <CashFlowSection cycles={selectCashTimeline(store)} />

      <TrajectoryChart snowball={view.snowball} avalanche={view.avalanche} strategy={strategy} debtFreeDate={view.debtFreeDate} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: layout.cardRadiusLarge, padding: layout.cardPaddingH + 2, overflow: 'hidden' },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  ringWrap: { width: RING_SIZE, height: RING_SIZE },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringMeta: { flex: 1, gap: 3 },
  ringPct: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  heroDate: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
});
