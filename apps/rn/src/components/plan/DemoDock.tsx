import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from 'zustand';

import { Button } from '@/components/ui/Button';
import { useAppColors } from '@/hooks/use-app-colors';
import { DEMO_STAGES } from '@/store/demoRun';
import { exitDemo } from '@/store/demoExit';
import { demoSession } from '@/store/demoSession';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * 3.5.4.7 — the demo's own chrome: where it says what it is, and how a viewer gets out of it.
 *
 * Deliberately NOT the walkthrough's dock. That one coaches — a title, a paragraph, Back/Next/Skip — and
 * this run is watched rather than operated, so the same furniture would imply controls that do not exist
 * and steps the viewer is failing to take. What a demo owes is smaller: where you are in it, and two ways
 * out that are honest about what they do.
 *
 * ⚠️ Both exits are TERMINAL, per [D18]: `exitDemo` ends the session BEFORE navigating, so the destination
 * is never reached with the sandbox still mounted. That ordering is what keeps `useNoRealWritesGuard`
 * strict — `/paywall` writes the real store by design, and a purchase reported as a sandbox leak would
 * poison the one signal built to prove the real plan is untouched.
 */
export function DemoDock() {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const active = useStore(demoSession, (s) => s.active);
  const stage = useStore(demoSession, (s) => s.stage);
  // Withheld for the App-Preview capture. The dock is a way OUT, and a video has nobody to let out — while
  // it covered two of the five frames the video exists to show.
  const chrome = useStore(demoSession, (s) => s.chrome);
  if (!active || !chrome) return null;

  const position = Math.max(1, DEMO_STAGES.findIndex((s) => s.id === stage) + 1);

  return (
    <View
      // ⚠️ `insets.bottom` is load-bearing, and this dock shipped without it once. [B4] found the same
      // omission in the walkthrough's dock: with no bottom inset the last control sits inside the
      // home-indicator swipe zone, so the gesture that dismisses the app overlaps the button. Invisible on
      // web, which has no safe area — and here the control in that zone is an EXIT, on the screen a
      // stranger is evaluating.
      style={[
        styles.dock,
        { backgroundColor: c.background.secondary, borderTopColor: c.border.subtle, paddingBottom: insets.bottom + spacing.base },
      ]}
      // One utterance: a screen reader should hear what this is and where it is, not three fragments.
      accessible
      accessibilityLabel={`Example money. Demonstration, ${position} of ${DEMO_STAGES.length}.`}>
      {/* Position only — the "Example money" disclosure belongs to `ExampleCanvasMarker`, which sits at
          the TOP of the screen beside the figures it is about. Both said it at first, which is the same
          doubling [D6] refused in the walkthrough, arriving from the other direction: there the dock owns
          the marker and the canvas withholds, here the canvas owns it because it cannot scroll away from
          the money. Caught by looking at the render, not by a test. */}
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
        {position} of {DEMO_STAGES.length}
      </Text>

      {/* Approved 2026-08-06. The primary exit is the honest one — this was a demonstration, here is YOUR
          empty plan — and Premium is offered without being the way out. */}
      <Text style={[textStyles.body, { color: c.text.primary }]}>
        This is what your Guardian does with a paycheck.
      </Text>

      <Button label="Start my real plan" onPress={() => exitDemo('/onboarding')} />
      <Pressable
        onPress={() => exitDemo('/paywall')}
        accessibilityRole="button"
        hitSlop={10}
        style={styles.secondary}>
        <Text style={[textStyles.subhead, { color: c.accent.primary }]}>Unlock Premium</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    gap: spacing.xs,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,

    borderTopWidth: StyleSheet.hairlineWidth,
  },
  // 44pt, like the Guardian card's rows after 3.5.3.10 — a secondary exit is still an exit.
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
