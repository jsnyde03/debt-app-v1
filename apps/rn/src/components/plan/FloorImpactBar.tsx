import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useAppColors } from '@/hooks/use-app-colors';
import { useReduceMotion } from '@/motion';
import { spring } from '@/theme/motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

/**
 * 3.5.3.4.4 — the payoff for moving your line: what that change did, shown rather than asserted.
 *
 * A deliberate sibling of `AffordabilityImpactBar` rather than a reuse of it. Both answer "what does
 * this change do to my cushion", and sharing the visual language is the point — but that one is a
 * PURCHASE carving the cushion down toward a fixed line, and its labels say so. Here the line itself is
 * what moved, and the interesting consequence is the opposite direction: money freed up for debt. Passing
 * a floor change through a component that narrates purchases would have produced a bar that animated
 * correctly and captioned it wrongly.
 *
 * Deliberately NOT Skia (the plan's word was "the Skia impact viz"): the sibling is Reanimated, this
 * lives inside a coaching card rather than on a hero, and a new Skia surface would buy an identical
 * result plus a device-QA gate ([[native module verification gap]]).
 */
export function FloorImpactBar({
  before,
  after,
  freed,
}: {
  /** Cushion held before the line moved. */
  before: number;
  /** Cushion held after. */
  after: number;
  /** What that move released to debt this paycheck (0 when the line went UP). */
  freed: number;
}) {
  const c = useAppColors();
  const reduce = useReduceMotion();

  const scale = Math.max(1, before, after);
  const beforeFrac = Math.min(1, before / scale);
  const afterFrac = Math.max(0, Math.min(1, after / scale));

  // [D4] A SPRING, not a timing curve. `theme/motion.ts` opens with "spring physics over easing (except
  // colour fades)", and this was a `withTiming` — so the one moment in the walkthrough that exists to
  // make the user's own action feel consequential moved with a linear-feeling ease while every other
  // travelling element in the app has weight. Reduce Motion still snaps, as before.
  //
  // Not `useSpringValue`, though it's the same spring: that hook initialises AT its target, and the
  // whole point here is to start at `beforeFrac` and travel to `afterFrac` — the journey IS the payoff.
  const w = useSharedValue(reduce ? afterFrac : beforeFrac);
  useEffect(() => {
    w.value = reduce ? afterFrac : withSpring(afterFrac, spring.default);
  }, [afterFrac, reduce, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));

  // Lowering the line frees money for debt; raising it holds more back. Both are legitimate moves, so
  // the caption states what happened rather than congratulating either direction.
  const label =
    freed > 0
      ? `${formatWhole(freed)} more to debt this paycheck`
      : before === after
        ? 'Same cushion, same plan'
        : `${formatWhole(after - before)} more held back`;

  return (
    <View style={styles.wrap} testID="floor-impact">
      <View style={[styles.track, { backgroundColor: c.background.tertiary }]}>
        <Animated.View style={[styles.fill, fill, { backgroundColor: c.accent.primary }]} />
      </View>
      {/* The numbers ARE the read, so they stay in the a11y tree — unlike the decorative bar above. */}
      <Text style={[textStyles.caption, { color: c.text.secondary }]}>
        Cushion {formatWhole(before)} → {formatWhole(after)} · {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginTop: spacing.sm },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
