import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/hooks/use-app-colors';
import { COACH_MARKS } from '@/store/coachMarkCopy';
import { coachMarks, useActiveCoachMark } from '@/store/coachMarks';
import { useTutorialTargets, type TargetRect } from '@/store/tutorialTargets';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * 3.5.5.1 — the coach-mark primitive: one calm sentence, anchored near the control it names.
 *
 * **Not a spotlight, and that is the design.** The walkthrough dims the screen and cuts a hole, because it
 * is teaching a mental model and needs your whole attention for seven beats. A discovery hint is the
 * opposite errand: you are mid-task on your real money, and the app is mentioning something you might not
 * know exists. So there is no scrim, nothing is fenced, and the control stays live underneath — if the
 * user ignores this entirely and taps the thing, that is a success, not a dismissal.
 *
 * ⚠️ **Mounted at the ROOT, outside the gesture handlers**, alongside `TutorialCoach`. A callout rendered
 * inside a screen sits under the tab bar and inside whatever pan handler owns that screen; the walkthrough
 * already paid for that lesson twice (its overlay began inside Today, then inside the tabs layout, where
 * wrapping `<Tabs>` in a container broke tab presses outright).
 *
 * **iOS-16-safe by omission** — plain `View`/`Text`/`Pressable`, no blur, no material, no newer layout
 * API. `expo-blur` renders nothing on Android without `experimentalBlurMethod` and would make the hint's
 * legibility platform-dependent, which for a one-sentence explanation is a poor trade.
 *
 * Renders nothing unless something is actively marked.
 */
export function CoachMarkLayer() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const targets = useTutorialTargets();
  const active = useActiveCoachMark();
  const [rect, setRect] = useState<TargetRect | null>(null);

  useEffect(() => {
    if (!active || !targets) {
      setRect(null);
      return;
    }
    let cancelled = false;
    // `measure` resolves null on a miss or a 500ms timeout — a subject mid-transition measures 0×0 and is
    // reported as not-ready rather than as an empty rect. A null here means the mark simply does not show,
    // which is the right failure: a hint pointing at nothing is worse than a hint that waited.
    void targets.measure(active).then((r) => {
      if (!cancelled) setRect(r);
    });
    return () => {
      cancelled = true;
    };
  }, [active, targets]);

  if (!active || !rect) return null;
  const copy = COACH_MARKS[active];
  if (!copy) return null;

  // Below the control when there is room beneath it, above it otherwise. The subject is the point; a
  // callout that covers it explains something the user can no longer see.
  const below = rect.y + rect.height + 12;
  const roomBelow = winH - below - insets.bottom > 140;
  const top = roomBelow ? below : Math.max(insets.top + 8, rect.y - 132);

  return (
    <View style={[styles.wrap, { top }]} pointerEvents="box-none">
      <View
        style={[styles.card, { backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}
        // One utterance — a screen reader should hear a sentence about a control, not three fragments.
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`${copy.title}. ${copy.body}`}>
        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>{copy.title}</Text>
        <Text style={[textStyles.subhead, { color: c.text.secondary }]}>{copy.body}</Text>
        <Pressable
          onPress={() => coachMarks.getState().dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Got it"
          hitSlop={10}
          style={styles.action}>
          <Text style={[textStyles.subhead, { color: c.accent.primary }]}>Got it</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // `box-none` on the wrapper and nothing full-screen behind it: the screen underneath stays fully
  // interactive, which is what makes this a hint rather than a modal.
  wrap: { position: 'absolute', left: 0, right: 0, paddingHorizontal: spacing.base },
  card: {
    gap: spacing.xxs,
    padding: spacing.base,
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // 44pt — a dismissal is still a tap target.
  action: { minHeight: 44, justifyContent: 'center' },
});
