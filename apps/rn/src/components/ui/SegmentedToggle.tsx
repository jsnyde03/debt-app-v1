import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAppColors } from '@/hooks/use-app-colors';
import { haptics, useReduceMotion } from '@/motion';
import { duration } from '@/theme/motion';
import { layout } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const PAD = 3;
const GAP = 3;

/** A compact 2–3 option segmented control (e.g. the Debts/Bills/Goals toggle). 3.3.5.2: the selection is a
 *  single sliding thumb (Reanimated) with a light tap haptic — the most-touched control, made felt. */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const c = useAppColors();
  const reduce = useReduceMotion();
  const [w, setW] = useState(0);

  const n = options.length;
  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const segW = w > 0 ? (w - PAD * 2 - GAP * (n - 1)) / n : 0;

  const x = useSharedValue(0);
  useEffect(() => {
    const target = PAD + activeIndex * (segW + GAP);
    x.value = reduce || w === 0 ? target : withTiming(target, { duration: duration.fast });
  }, [activeIndex, segW, w, reduce, x]);
  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], width: segW }));

  return (
    <View
      style={[styles.track, { backgroundColor: c.background.tertiary, borderColor: c.border.subtle }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 ? (
        <Animated.View style={[styles.thumb, thumbStyle, { backgroundColor: c.background.secondary, borderColor: c.border.default }]} />
      ) : null}
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (!active) haptics.light();
              onChange(o.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={styles.seg}>
            <Text style={[textStyles.subhead, { color: active ? c.text.primary : c.text.secondary, fontWeight: active ? '600' : '400' }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: PAD,
    gap: GAP,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: 0,
    borderRadius: layout.inputRadius - PAD,
    borderWidth: StyleSheet.hairlineWidth,
  },
  seg: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
