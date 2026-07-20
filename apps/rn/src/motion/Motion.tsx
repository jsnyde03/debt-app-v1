import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { duration } from '@/theme/motion';

/**
 * Entrance-animated container — a subtle fade + rise on mount. `delay` staggers list/ladder reveals
 * (pair with `stagger.list`). Degrades to no motion under the system Reduce-Motion setting. Every
 * animated screen enters through this, so the vocabulary stays consistent (and swappable).
 */
export function Motion({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(duration.default).delay(delay).reduceMotion(ReduceMotion.System)}
      style={style}>
      {children}
    </Animated.View>
  );
}
