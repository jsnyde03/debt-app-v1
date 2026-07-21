import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReduceMotion } from '@/motion';
import { duration } from '@/theme/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

const MILES = [
  { label: '25%', t: 25 },
  { label: '50%', t: 50 },
  { label: '75%', t: 75 },
  { label: 'Free', t: 100 },
] as const;

const NODE = 24;
const MARKER = 16;

/**
 * The payoff journey — one connected rail (not four flat chips). Passed milestones fill green; the
 * next one glows to pull you forward; the gold star is the debt-free destination; a live "you are
 * here" bead rides the fill edge (numberless — the ring hero above owns the %). The fill sweeps
 * 0→pct on mount (Reduce Motion snaps). A11y collapses the whole rail to one utterance.
 */
export function MilestonesRow({ pct, debtFreeLabel }: { pct: number; debtFreeLabel?: string }) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const reduce = useReduceMotion();

  const clamped = Math.min(100, Math.max(0, pct));
  const nextT = MILES.find((m) => clamped < m.t)?.t;

  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = reduce ? clamped : withTiming(clamped, { duration: duration.chart });
  }, [clamped, reduce, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));
  const markerStyle = useAnimatedStyle(() => ({ left: `${progress.value}%` }));

  const accentGlow = scheme === 'dark' ? 'rgba(91,157,255,0.55)' : 'rgba(47,102,234,0.40)';
  const goldGlow = 'rgba(247,207,95,0.55)';

  // One collapsed screen-reader utterance for the whole rail.
  const reached = MILES.filter((m) => clamped >= m.t && m.t < 100).map((m) => m.label);
  const a11y = groupLabel(
    `${clamped}% paid`,
    reached.length ? `${reached.join(', ')} reached` : 'no milestones reached yet',
    nextT ? `next milestone ${MILES.find((m) => m.t === nextT)!.label}` : 'all milestones reached',
    debtFreeLabel ? `debt-free projected ${debtFreeLabel}` : undefined,
  );

  return (
    <Card>
      <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.secondary }]}>MILESTONES</Text>
      <View style={styles.rail} {...a11y}>
        {/* track + fill */}
        <View style={[styles.track, { backgroundColor: c.background.tertiary }]}>
          <Animated.View style={[styles.fill, fillStyle, { backgroundColor: c.accent.success }]} />
        </View>

        {/* live "you are here" bead — rides the fill edge, numberless */}
        <Animated.View
          style={[
            styles.marker,
            markerStyle,
            { backgroundColor: c.accent.primary, borderColor: c.background.secondary },
          ]}
        />

        {/* posts */}
        {MILES.map((m) => {
          const passed = clamped >= m.t;
          const isNext = m.t === nextT;
          const isFree = m.t === 100;

          const nodeStyle = isFree
            ? passed
              ? { backgroundColor: c.accent.gold, borderColor: c.accent.gold, boxShadow: `0px 0px 12px 2px ${goldGlow}` }
              : { borderColor: c.accent.gold, boxShadow: `0px 0px 10px 1px ${goldGlow}` }
            : passed
              ? { backgroundColor: c.accent.success, borderColor: c.accent.success }
              : isNext
                ? { backgroundColor: c.accent.accentSoft, borderColor: c.accent.primary, boxShadow: `0px 0px 10px 1px ${accentGlow}` }
                : { borderColor: c.border.strong };

          const labelColor = isFree
            ? c.accent.gold
            : passed
              ? c.text.secondary
              : isNext
                ? c.accent.primary
                : c.text.tertiary;

          return (
            <View key={m.label} style={[styles.col, { left: `${m.t}%` }]}>
              <View style={[styles.node, nodeStyle]}>
                {isFree ? (
                  <AppIcon name="star" size={13} color={passed ? c.text.onAccent : c.accent.gold} />
                ) : passed ? (
                  <AppIcon name="check" size={13} color={c.text.onAccent} />
                ) : null}
              </View>
              <Text style={[textStyles.footnote, styles.label, { color: labelColor }]}>{m.label}</Text>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginBottom: spacing.md },
  rail: { height: 46, marginHorizontal: NODE / 2 },
  track: { position: 'absolute', left: 0, right: 0, top: 9, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  marker: {
    position: 'absolute',
    top: 4,
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 3,
    marginLeft: -MARKER / 2,
    // subtle lift so the bead reads as sitting on the rail
    boxShadow: '0px 1px 3px rgba(11,26,56,0.35)',
  },
  col: { position: 'absolute', top: 0, width: 52, marginLeft: -26, alignItems: 'center' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { marginTop: spacing.sm, fontWeight: '700' },
});
