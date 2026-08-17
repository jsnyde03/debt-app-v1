import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAppColors } from '@/hooks/use-app-colors';
import { haptics, useReduceMotion } from '@/motion';
import { duration } from '@/theme/motion';
import { layout } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { a11yChecked } from '@/utils/a11y';

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
    // ⛔ `radiogroup`/`radio`, NOT a row of buttons — and the role change is what makes the state fix
    // real rather than cosmetic. 3.5.7.5 measured that this control announced its role and never which
    // segment was active: react-native-web 0.21.2 has no `accessibilityState` → `aria-*` mapping, so the
    // longhand `accessibilityState={{ selected }}` was dropped on web entirely.
    //
    // ⚠️ Adding `aria-selected` alone would NOT have fixed it. That attribute is only honoured on
    // `tab`/`option`/`row`/`gridcell`/`treeitem`; on a `button` it is ignored, so the control would have
    // carried a correct-looking attribute and still announced nothing. ⛔ And `aria-pressed` — the right
    // attribute for a toggle button on the web — is **not in RN's aria list** (measured against RN 0.85's
    // `ViewAccessibility.d.ts`: checked/selected/expanded/busy/disabled, no pressed), so it would be
    // web-only and re-open the same asymmetry from the other side.
    //
    // A single-choice set of 2–3 options IS a radio group, on both platforms and for all three current
    // uses — the Money view switcher, the payoff strategy, and Progress's cushion/timeline. `aria-checked`
    // is valid on `radio` on the web and is aliased onto the native state by RN. ⚠️ `tab` was rejected
    // because it is true of the view switchers and false of the strategy picker, and one primitive cannot
    // hold two semantics honestly.
    <View
      accessibilityRole="radiogroup"
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
            accessibilityRole="radio"
            {...a11yChecked(active)}
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
