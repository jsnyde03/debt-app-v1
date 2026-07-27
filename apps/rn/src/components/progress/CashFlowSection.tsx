import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { TimelineLedger } from '@/components/progress/TimelineLedger';
import { Card } from '@/components/ui/Card';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReduceMotion } from '@/motion';
import type { TimelineCycle } from '@/store/payoffSelectors';
import { duration } from '@/theme/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

type CushionStatus = TimelineCycle['cushionStatus'];

/**
 * Cushion-bar color — green is DELIBERATELY absent (it means progress elsewhere on this screen).
 * Comfortable cycles recede to a calm slate; only the cycles you must plan for carry color + glow.
 */
function barTone(status: CushionStatus, dark: boolean) {
  if (status === 'pressure') {
    return dark
      ? { grad: ['#fda4af', '#fb7185'] as const, glow: 'rgba(251,113,133,0.5)', label: '#fb7185' }
      : { grad: ['#f87171', '#dc2626'] as const, glow: 'rgba(220,38,38,0.38)', label: '#dc2626' };
  }
  if (status === 'tight') {
    return dark
      ? { grad: ['#fcd34d', '#f59e0b'] as const, glow: 'rgba(251,191,36,0.45)', label: '#fbbf24' }
      : { grad: ['#f59e0b', '#d97706'] as const, glow: 'rgba(217,119,6,0.34)', label: '#d97706' };
  }
  return dark
    ? { grad: ['#5b6b86', '#3f4d68'] as const, glow: null, label: '#a6b9d4' }
    : { grad: ['#aab6c9', '#8b99b0'] as const, glow: null, label: '#5a6b82' };
}

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The cash-flow module — one section, two lenses (Freedom's Milestones/Table pattern): **Cushion**
 * (near-term ending-balance forecast bars — "will I be squeezed soon?") and **Timeline** (the
 * itemized "where every dollar went" ledger — the reborn Capacitor Timeline). Same `selectCashTimeline`
 * data, user picks the view.
 */
export function CashFlowSection({ cycles, floor }: { cycles: TimelineCycle[]; floor: number }) {
  const c = useAppColors();
  const [view, setView] = useState<'cushion' | 'timeline'>('cushion');
  if (cycles.length === 0) return null;

  return (
    <Card>
      <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>
        CASH FLOW · NEXT {cycles.length} PAY CYCLES
      </Text>
      <SegmentedToggle
        value={view}
        onChange={(v) => setView(v as 'cushion' | 'timeline')}
        options={[
          { value: 'cushion', label: 'Cushion' },
          { value: 'timeline', label: 'Timeline' },
        ]}
      />
      <View style={styles.body}>{view === 'cushion' ? <CushionBars cycles={cycles} floor={floor} /> : <TimelineLedger cycles={cycles} />}</View>
    </Card>
  );
}

const TRACK_H = 92;

/**
 * Near-term cash-cushion forecast. Each bar plots the cycle's **breathing room** (`net` = income −
 * essentials, the SAME floor-relative quantity the cushion status is driven by, so height and color tell
 * ONE story) against a dashed **"your $X line"** floor. A bar that dips below the line is the cycle to
 * plan for. The deeper analysis (un-clamped cross-cycle runway, crunch drill-down, water-fill prefunding)
 * stays premium in the Cash Runway — this free read is the basic "will I be squeezed?" glance.
 */
function CushionBars({ cycles, floor }: { cycles: TimelineCycle[]; floor: number }) {
  const c = useAppColors();
  const scaleMax = Math.max(1, floor, ...cycles.map((cy) => Math.max(0, cy.net)));
  const floorY = (Math.max(0, floor) / scaleMax) * TRACK_H;
  const caption = cycles.some((cy) => cy.cushionStatus === 'pressure')
    ? 'A cycle runs short ahead — plan for it.'
    : cycles.some((cy) => cy.cushionStatus === 'tight')
      ? 'Cushion gets tight in an upcoming cycle.'
      : 'Comfortable across the next few paychecks.';

  return (
    <>
      <View style={styles.tracksRow}>
        {cycles.map((cy, i) => (
          <CushionBar key={i} cycle={cy} index={i} fraction={Math.max(0, cy.net) / scaleMax} />
        ))}
        {/* The floor reference line — dashed, spanning the plot, so "above/below your line" reads at a glance. */}
        <View pointerEvents="none" style={[styles.floorLine, { bottom: floorY, borderColor: c.text.tertiary }]} />
      </View>
      <View style={styles.datesRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {cycles.map((cy, i) => (
          <Text key={i} style={[textStyles.caption, styles.cell, { color: c.text.tertiary }]} numberOfLines={1}>
            {shortDate(cy.cycleStart)}
          </Text>
        ))}
      </View>
      <View style={styles.legendRow}>
        <View style={[styles.floorTick, { borderColor: c.text.tertiary }]} />
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>your {formatWhole(floor)} line · room after each paycheck</Text>
      </View>
      <Text style={[textStyles.caption, styles.caption, { color: c.text.secondary }]}>{caption}</Text>
    </>
  );
}

/** One cushion bar — the cycle's breathing room, a 2-stop gradient with rounded caps that grows on mount. */
function CushionBar({ cycle, index, fraction }: { cycle: TimelineCycle; index: number; fraction: number }) {
  const dark = useColorScheme() === 'dark';
  const reduce = useReduceMotion();
  const tone = barTone(cycle.cushionStatus, dark);
  const target = Math.max(2, fraction * TRACK_H);

  const grow = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    grow.value = reduce ? 1 : withDelay(index * 70, withTiming(1, { duration: duration.chart }));
  }, [reduce, grow, index]);
  const barStyle = useAnimatedStyle(() => ({ height: target * grow.value }));

  return (
    <View
      style={styles.col}
      accessible
      accessibilityLabel={`${shortDate(cycle.cycleStart)}: ${formatWhole(cycle.net)} of room, ${cycle.cushionStatus}`}>
      <Text style={[textStyles.caption, styles.val, { color: tone.label }]}>{formatWhole(cycle.net)}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, barStyle, tone.glow ? { boxShadow: `0px 0px 8px 1px ${tone.glow}` } : null]}>
          <LinearGradient colors={tone.grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.barFill} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginBottom: spacing.md },
  body: { marginTop: spacing.md },
  tracksRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, position: 'relative' },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  val: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { height: TRACK_H, width: '62%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 5 },
  barFill: { flex: 1, borderRadius: 5 },
  floorLine: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', opacity: 0.7 },
  datesRow: { flexDirection: 'row', gap: spacing.xs, marginTop: 4 },
  cell: { flex: 1, textAlign: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  floorTick: { width: 14, borderTopWidth: 1, borderStyle: 'dashed' },
  caption: { marginTop: spacing.sm, textAlign: 'center' },
});
