import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAppColors } from '@/hooks/use-app-colors';
import { useReduceMotion } from '@/motion';
import type { Affordability } from '@/store/guardianSelectors';
import { duration } from '@/theme/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/**
 * §3.3.4 — the affordability impact bar: the animated layer over the §2.9 "Can I Afford It?" read. As you
 * consider a purchase, your cushion carves down from its current level to what's left after it, landing
 * against your floor line — green when it clears the line, red when it falls short (tight / short). Reanimated
 * (matches the free cushion-bar motion), a decision surface: a smooth carve, not a celebration. The card's
 * textual read stays as the a11y source; this bar is `accessibilityElementsHidden` (decorative).
 */
export function AffordabilityImpactBar({
  before,
  after,
  floor,
  verdict,
}: {
  /** Cushion BEFORE the purchase (this paycheck's discretionary headroom). */
  before: number;
  /** Cushion left AFTER the purchase (floored at 0). */
  after: number;
  floor: number;
  verdict: Affordability['verdict'];
}) {
  const c = useAppColors();
  const reduce = useReduceMotion();

  const scale = Math.max(1, before, floor);
  const beforeFrac = Math.min(1, before / scale);
  const afterFrac = Math.max(0, Math.min(1, after / scale));
  const floorFrac = Math.max(0, Math.min(1, floor / scale));
  const clears = verdict === 'comfortable'; // cushion still at/above the line
  const cushionColor = clears ? c.accent.success : c.accent.danger;

  // The carve: the cushion animates from its full (before) level down to what's left (after).
  const w = useSharedValue(reduce ? afterFrac : beforeFrac);
  useEffect(() => {
    w.value = reduce ? afterFrac : withTiming(afterFrac, { duration: duration.default });
  }, [afterFrac, reduce, w]);
  const cushionStyle = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.track, { backgroundColor: c.background.tertiary }]}>
        <Animated.View style={[styles.cushion, cushionStyle, { backgroundColor: cushionColor }]} />
        {/* your floor line — the cushion should reach it */}
        <View style={[styles.floorLine, { left: `${floorFrac * 100}%`, backgroundColor: c.text.primary }]} />
      </View>
      <View style={styles.labels}>
        <Text style={[textStyles.caption, { color: cushionColor }]} numberOfLines={1}>
          {formatWhole(after)} left
        </Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]} numberOfLines={1}>
          your {formatWhole(floor)} line
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.md, gap: 4 },
  track: { height: 12, borderRadius: 6, overflow: 'hidden', position: 'relative' },
  cushion: { height: '100%', borderRadius: 6 },
  floorLine: { position: 'absolute', top: -3, bottom: -3, width: 2, borderRadius: 1 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
});
