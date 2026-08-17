import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { haptics, useReduceMotion } from '@/motion';
import { duration, spring } from '@/theme/motion';
import { a11yChecked } from '@/utils/a11y';

/**
 * A calm circular check-off — the premium alternative to a repeated "Mark Paid" button. Empty ring
 * when open; on check, the fill + check spring in (bouncy) with a success haptic — the daily payday
 * win made felt (DEBT_MOTION_SPEC §6). Reduce Motion snaps the visual but keeps the haptic (haptics
 * are an accessibility channel, not decoration). `tone` picks the fill: success (paid) or accent
 * (a recommended extra). Accessible as a checkbox.
 */
/**
 * The check-off feedback rule: a success pop on check, a light tick on undo. Exported so an ALTERNATE
 * affordance for the same action (3.7.B.4's swipe-to-mark-paid) feels identical rather than re-deriving
 * it — an agreeing copy is still a copy, it just has not diverged yet (Wave-A after-scan).
 *
 * Haptics are an accessibility channel, not decoration, so this fires under Reduce Motion too.
 */
export function checkOffHaptic(checked: boolean) {
  (checked ? haptics.light : haptics.success)();
}

export function CheckCircle({
  checked,
  onPress,
  tone = 'success',
  label,
}: {
  checked: boolean;
  onPress?: () => void;
  tone?: 'success' | 'accent';
  label?: string;
}) {
  const c = useAppColors();
  const reduce = useReduceMotion();
  const fill = tone === 'accent' ? c.accent.primary : c.accent.success;

  const p = useSharedValue(checked ? 1 : 0);
  useEffect(() => {
    p.value = reduce ? (checked ? 1 : 0) : checked ? withSpring(1, spring.bouncy) : withTiming(0, { duration: duration.fast });
  }, [checked, reduce, p]);

  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scale: p.value }], opacity: p.value }));

  const handlePress = onPress
    ? () => {
        checkOffHaptic(checked); // immediate, felt feedback — the rule lives above, shared with the swipe
        onPress();
      }
    : undefined;

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      // ⛔ `aria-checked`, not `accessibilityState={{ checked }}` — react-native-web 0.21.2 has no
      // mapping for the latter (measured 2026-08-17), so this checkbox announced its role and never
      // whether it was checked. The role was already right; only the state was missing.
      {...a11yChecked(checked)}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.circle, { borderColor: checked ? fill : c.border.strong, opacity: pressed ? 0.7 : 1 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.fill, fillStyle, { backgroundColor: fill }]} />
      <Animated.View style={fillStyle}>
        <AppIcon name="check" size={16} color={c.text.onAccent} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { borderRadius: 14 },
});
