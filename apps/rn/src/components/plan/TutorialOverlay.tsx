import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { Motion } from '@/motion/Motion';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { headerProps } from '@/utils/a11y';
import type { TargetRect } from '@/store/tutorialTargets';

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
  spotlight,
  onDockLayout,
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
  /** 3.5.3.3.1 — where this beat's subject landed, in window coordinates. Null → an uncut scrim. */
  spotlight?: TargetRect | null;
  /** The dock's measured height defines the bottom of the stage the subject is scrolled into. */
  onDockLayout?: (height: number) => void;
}) {
  const c = useAppColors();

  return (
    // `box-none` lets touches fall through to Today everywhere the overlay has no child; the scrim
    // below re-blocks them on scripted beats. Without this, even the pass-through beats would swallow.
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="tutorial-overlay">
      {!interactive ? (
        // 3.5.3.3.1 — with a subject on screen the scrim is drawn as four bands AROUND it instead of one
        // sheet over everything, so the thing being taught is the one thing at full strength. Four rects
        // rather than a mask: no Skia/SVG dependency on a surface that must render identically on web,
        // and the cutout is plain geometry a test can assert.
        <Scrim rect={spotlight ?? null} color={c.background.primary} />
      ) : null}
      {/* The ring survives on interactive beats too — there the scrim is gone (touches must reach the
          control), so this outline is the only thing still saying "this is the bit we mean". */}
      {spotlight ? (
        <View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              left: spotlight.x - RING_INSET,
              top: spotlight.y - RING_INSET,
              width: spotlight.width + RING_INSET * 2,
              height: spotlight.height + RING_INSET * 2,
              borderColor: c.accent.primary,
            },
          ]}
          testID="tutorial-spotlight"
        />
      ) : null}

      <View style={styles.dock} pointerEvents="box-none" onLayout={(e) => onDockLayout?.(e.nativeEvent.layout.height)}>
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

/** How far the ring stands off the subject, so it frames rather than crops it. */
const RING_INSET = 6;

/**
 * The scrim, cut around the subject. With no rect it's the original single sheet.
 *
 * Four bands (above / below / left / right) rather than an SVG mask: this surface has to render the
 * same on web as on device, and geometry is something an e2e can actually assert. The cut is inset
 * slightly less than the ring so the ring reads as sitting ON the lit area, not floating in the dark.
 */
function Scrim({ rect, color }: { rect: TargetRect | null; color: string }) {
  const a11y = { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const;
  if (!rect) {
    return <View style={[StyleSheet.absoluteFill, styles.scrim, { backgroundColor: color }]} {...a11y} testID="tutorial-scrim" />;
  }
  const top = Math.max(0, rect.y - RING_INSET);
  const bottom = rect.y + rect.height + RING_INSET;
  const left = Math.max(0, rect.x - RING_INSET);
  const right = rect.x + rect.width + RING_INSET;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" {...a11y} testID="tutorial-scrim">
      <View style={[styles.scrim, styles.band, { backgroundColor: color, top: 0, left: 0, right: 0, height: top }]} />
      <View style={[styles.scrim, styles.band, { backgroundColor: color, top: bottom, left: 0, right: 0, bottom: 0 }]} />
      <View style={[styles.scrim, styles.band, { backgroundColor: color, top, height: bottom - top, left: 0, width: left }]} />
      <View style={[styles.scrim, styles.band, { backgroundColor: color, top, height: bottom - top, left: right, right: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Light enough that Today stays readable — it's the subject, not a backdrop.
  scrim: { opacity: 0.55 },
  band: { position: 'absolute' },
  // A quiet outline, not a glow: this is a reference surface being explained, so the highlight informs
  // rather than performs ([[match motion to the surface's job]]).
  ring: { position: 'absolute', borderWidth: 2, borderRadius: 14 },
  // Docked to the bottom so the coached surface above stays visible.
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.base },
  body: { gap: spacing.xs },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
});
