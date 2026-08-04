import { Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { SheetScrim } from '@/components/ui/SheetScrim';
import type { useSheetPresentation } from '@/hooks/use-sheet-presentation';
import { a11yHidden } from '@/utils/a11y';

/**
 * The dim + tap-to-dismiss layer behind every sheet in the app.
 *
 * Hoisted out of the three sheet shells — `FormSheet`, `AnimatedSheet`, `PaydayCaptureSheet` — which
 * carried byte-identical copies of it. A fix then landed in exactly one: round 5 made the FormSheet
 * backdrop a11y-hidden and un-tabbable and recorded it as covering "all 8 sheets", which counted
 * FormSheet's CONSUMERS rather than the class. The other two shells (reached by `LogPaymentSheet`,
 * `BillBreakdownSheet` and the payday capture flow, a core Today path) still put a full-screen element
 * LABELLED "Close" in front of the sheet's own content — the first thing a VoiceOver user met, spanning
 * the whole display, before a single field. Sixth round of the same one-member-fix shape.
 *
 * One component now, so the next fix has one place to land.
 */
export function SheetBackdrop({
  scrimStyle,
  onPress,
}: {
  scrimStyle: ReturnType<typeof useSheetPresentation>['scrimStyle'];
  onPress: () => void;
}) {
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, scrimStyle]} pointerEvents="none">
        <SheetScrim />
      </Animated.View>
      {/* Out of the a11y tree AND out of the tab order — two different questions. `a11yHidden` removes
          it from the screen-reader tree (tapping outside is a POINTER affordance; the screen-reader
          equivalent is the explicit Close button in the header). `focusable={false}` removes it from the
          web tab order, which an RNW Pressable keeps regardless of its aria state — hidden AND focusable
          is the worst of both, an unlabelled full-screen stop for keyboard users. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} focusable={false} {...a11yHidden(true)} />
    </>
  );
}
