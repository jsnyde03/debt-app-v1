import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useReduceMotion } from '@/motion';
import { spring } from '@/theme/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * §3.3.5.4 — a Pressable with a subtle spring press-scale for tappable cards/rows: near-zero-cost tactility
 * that makes a tap feel like a physical press. Snaps (no scale) under Reduce Motion.
 */
export function PressableScale({
  onPress,
  children,
  style,
  accessibilityRole = 'button',
  accessibilityLabel,
  scaleTo = 0.98,
  hitSlop,
}: {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: 'button' | 'link';
  accessibilityLabel?: string;
  scaleTo?: number;
  hitSlop?: number;
}) {
  const reduce = useReduceMotion();
  const s = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        if (!reduce) s.value = withTiming(scaleTo, { duration: 90 });
      }}
      onPressOut={() => {
        s.value = reduce ? 1 : withSpring(1, spring.snappy);
      }}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      style={[style, animStyle]}>
      {children}
    </AnimatedPressable>
  );
}
