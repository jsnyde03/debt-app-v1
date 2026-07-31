import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { Motion } from '@/motion/Motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { headerProps } from '@/utils/a11y';

/**
 * 3.5.3.1 — the coaching layer that sits OVER the real Today tab during a tutorial session.
 *
 * Two jobs, and the second is the subtle one:
 *  - present the beat (position, title, body, controls);
 *  - decide whether Today underneath is TOUCHABLE. On a scripted beat a scrim blocks stray taps, so a
 *    user can't wander into a sheet or another tab mid-walkthrough and lose the thread. On an
 *    interactive beat (drag the floor, tap the surprise) touches must reach the real control — that's
 *    the whole point of those beats — so the layer becomes pass-through and only the coaching card
 *    itself stays tappable.
 *
 * The scrim is deliberately light: Today is the lesson, so it stays legible rather than being dimmed
 * into a backdrop. Under Reduce Motion `Motion` degrades to no animation.
 */
export function TutorialOverlay({
  position,
  total,
  title,
  body,
  interactive,
  onBack,
  onNext,
  onSkip,
  isLast,
}: {
  position: number;
  total: number;
  title: string;
  body: string;
  /** True on a beat where the user must reach the real control underneath. */
  interactive: boolean;
  onBack?: () => void;
  onNext: () => void;
  onSkip: () => void;
  isLast: boolean;
}) {
  const c = useAppColors();

  return (
    // `box-none` lets touches fall through to Today everywhere the overlay has no child; the scrim
    // below re-blocks them on scripted beats. Without this, even the pass-through beats would swallow.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="tutorial-overlay">
      {!interactive ? (
        <View
          style={[StyleSheet.absoluteFill, styles.scrim, { backgroundColor: c.background.primary }]}
          // A blocking scrim is decorative to a screen reader — the coaching card carries the content.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID="tutorial-scrim"
        />
      ) : null}

      <View style={styles.dock} pointerEvents="box-none">
        <Motion key={position}>
          <Card>
            <View style={styles.body}>
              <Text style={[textStyles.caption, { color: c.text.tertiary }]} testID="tutorial-progress">
                Step {position} of {total}
              </Text>
              <Text {...headerProps()} style={[textStyles.title3, { color: c.text.primary }]} testID="tutorial-step-title">
                {title}
              </Text>
              <Text style={[textStyles.body, { color: c.text.secondary }]}>{body}</Text>

              <View style={styles.nav}>
                {onBack ? <Button label="Back" variant="text" onPress={onBack} /> : null}
                <Button label={isLast ? 'Finish' : 'Next'} onPress={onNext} />
                {!isLast ? <Button label="Skip" variant="text" onPress={onSkip} /> : null}
              </View>
            </View>
          </Card>
        </Motion>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Light enough that Today stays readable — it's the subject, not a backdrop.
  scrim: { opacity: 0.55 },
  // Docked to the bottom so the coached surface above stays visible.
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.base },
  body: { gap: spacing.xs },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
