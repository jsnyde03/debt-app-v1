import { useEffect } from 'react';
import {
  useReducedMotion,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { spring, type SpringToken } from '@/theme/motion';

/** Whether the user has the system Reduce-Motion setting on. Gate every animation on this. */
export function useReduceMotion(): boolean {
  return useReducedMotion();
}

/**
 * A shared value that springs toward `target` whenever it changes (drive `useAnimatedStyle` off it).
 * Reduce Motion → snaps to the value with no animation.
 */
export function useSpringValue(target: number, token: SpringToken = 'default'): SharedValue<number> {
  const reduce = useReducedMotion();
  const sv = useSharedValue(target);
  useEffect(() => {
    sv.value = reduce ? target : withSpring(target, spring[token]);
  }, [target, token, reduce, sv]);
  return sv;
}
