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
      {/* Out of the a11y tree AND out of the tab order — two different questions, and the second needs
          `tabIndex`, not `focusable`. RNW's Pressable always supplies a tabIndex of its own (0 unless
          disabled), and `createDOMProps` only consults `focusable` in the branch a supplied tabIndex
          short-circuits — so `focusable={false}` never reaches the DOM here and this was aria-hidden AND
          tabbable, which is the axe `aria-hidden-focus` violation. `tabIndex={-1}` works on both: RN core
          maps it to `focusable={!tabIndex}` for native. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onPress} tabIndex={-1} {...a11yHidden(true)} />
    </>
  );
}
