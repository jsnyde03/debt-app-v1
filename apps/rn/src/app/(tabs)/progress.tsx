import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { MoreButton } from '@/components/more-button';
import { TrajectoryChart } from '@/components/payoff/TrajectoryChart';
import { CashFlowSection } from '@/components/progress/CashFlowSection';
import { type JourneyRingChartProps, type MilestoneState } from '@/components/progress/JourneyRingChart';
import { JourneyRingCanvas } from '@/components/progress/JourneyRingCanvas';
import { VanquishedArchive } from '@/components/progress/VanquishedArchive';
import { Screen } from '@/components/screen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppColors } from '@/hooks/use-app-colors';
import { useGoToTab } from '@/hooks/use-go-to-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { CountUp } from '@/motion';
import { selectWhatIf } from '@/store/analysisSelectors';
import { withProjectedBalances } from '@/store/balanceSelectors';
import { selectVanquishedDebts } from '@/store/celebrationSelectors';
import { selectCashTimeline, selectPayoffView } from '@/store/payoffSelectors';
import { effectivePaycheckBuffer } from '@/store/selectors';
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
  // 2.4 — forward-looking computations (debt-free date, trajectory, cushion, what-if) read projected-
  // current balances for premium; free is a no-op wrap. Backward-looking "% paid" below stays on the
  // raw/confirmed balances (progress is what you've actually paid, not a projection).
  // Memoized on the store (not on `extra`): the projection + the 3 payoff trajectories are expensive and
  // don't depend on the What-If input, so a keystroke in the extra field must NOT re-run them. `store` is a
  // stable zustand reference between renders, so these recompute only when the plan actually changes.
  const isPremium = store.subscriptionPlan === 'premium';
  const engineStore = useMemo(() => withProjectedBalances(store, isPremium), [store, isPremium]);
  const view = useMemo(() => selectPayoffView(engineStore), [engineStore]);

  // What-If state — folded into the projection card (the extra drives its overlay + controls). Only THIS
  // recomputes per keystroke now, off the stable engineStore.
  const [extra, setExtra] = useState('');
  const whatIf = useMemo(() => selectWhatIf(engineStore, Number(extra) || 0), [engineStore, extra]);
  // Same rule as above: the cash-cushion forecast is expensive and doesn't depend on `extra`, so it must
  // be memoized off the stable engineStore rather than rebuilt inline on every keystroke.
  const cashCycles = useMemo(() => selectCashTimeline(engineStore), [engineStore]);
  // The cushion floor for the cash-flow bars' reference line (free = BASE buffer · premium = your line).
  const cushionFloor = effectivePaycheckBuffer(engineStore);
  // The permanent trophy shelf of confirmed-cleared debts (raw store — a cleared debt is cleared).
  const vanquished = selectVanquishedDebts(store);

  if (!view.hasDebts) {
    // Debt-free WITH a history → the calm resting state (the finale already fired the spectacle) + the
    // archive. Only a truly-empty user (never any debt) gets the "add a debt" prompt.
    if (vanquished.length > 0) {
      return (
        <Screen title="Progress" right={<MoreButton />}>
          <LinearGradient
            colors={[c.surface.heroTop, c.surface.heroBottom]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, elevation.hero[scheme]]}>
            <Text style={[textStyles.footnote, styles.eyebrow, { color: c.surface.heroSub }]}>DEBT-FREE</Text>
            <Text style={[styles.heroDate, { color: c.surface.heroText }]}>Every balance cleared</Text>
            <Text style={[textStyles.subhead, { color: c.surface.heroSub }]}>Your trophy shelf is below.</Text>
          </LinearGradient>
          <VanquishedArchive debts={vanquished} />
        </Screen>
      );
    }
    return (
      <Screen title="Progress" right={<MoreButton />}>
        <EmptyState
          icon="trending-down"
          title="Your payoff journey starts here"
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
              <CountUp value={pct} format={(n) => `${Math.round(n)}%`} maxFontSizeMultiplier={1.4} style={[styles.ringPct, { color: surf.heroText }]} />
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

      <CashFlowSection cycles={cashCycles} floor={cushionFloor} />

      <TrajectoryChart
        snowball={view.snowball}
        avalanche={view.avalanche}
        minimums={view.minimums}
        strategy={strategy}
        debtFreeDate={view.debtFreeDate}
        interestSaved={view.interestSaved}
        startDate={store.paycheck.currentDate}
        whatIf={whatIf}
        extra={extra}
        onExtraChange={setExtra}
      />

      <VanquishedArchive debts={vanquished} />
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
