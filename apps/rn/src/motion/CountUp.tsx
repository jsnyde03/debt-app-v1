import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, type TextProps } from 'react-native';
import {
  runOnJS,
  useAnimatedReaction,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { duration } from '@/theme/motion';

/**
 * A number that rolls from its previous value to `value` (Robinhood-style). Pair with a
 * `tabular-nums` text style so widths don't jitter. Under Reduce Motion it shows the final value
 * immediately. Web-safe. Used for the payday hero, the debt-free date, balances, interest-saved.
 */
export function CountUp({
  value,
  format = (n: number) => String(Math.round(n)),
  durationMs = duration.counter,
  ...text
}: { value: number; format?: (n: number) => string; durationMs?: number } & TextProps) {
  const reduce = useReducedMotion();
  const sv = useSharedValue(value);
  const [display, setDisplay] = useState(() => format(value));

  // format may change identity each render — read it through a ref so the JS callback stays stable.
  const fmt = useRef(format);
  fmt.current = format;
  const setFromValue = useCallback((v: number) => setDisplay(fmt.current(v)), []);

  useEffect(() => {
    if (reduce) {
      sv.value = value;
      setFromValue(value);
      return;
    }
    sv.value = withTiming(value, { duration: durationMs });
  }, [value, reduce, durationMs, sv, setFromValue]);

  useAnimatedReaction(
    () => sv.value,
    (v) => runOnJS(setFromValue)(v),
    [setFromValue],
  );

  return <Text {...text}>{display}</Text>;
}
