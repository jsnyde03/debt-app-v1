import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormSheet } from '@/components/ui/FormSheet';
import { Slider } from '@/components/ui/Slider';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * "Your cushion line" — set the floor the Guardian holds each cycle before any extra debt payoff.
 * Framed as the user's own low-balance alert line (Jason's model). Snapped to $25, applied on Save.
 *
 * 3.5.0.5 — `onApply` is REQUIRED and the component no longer reaches for `appStore` itself. It used to
 * call `appStore.getState().setCushionFloor(value)` directly, which meant the Phase-3.5 tutorial's
 * "drag your line" beat would have moved the user's REAL cushion floor while appearing to run in the
 * sandbox — a component can't tell it's being used as a teaching prop. Making the caller own the write
 * turns that from a silent hazard into a compile error.
 *
 * The clamp needs no sandbox-specific mirroring: routing through the sandbox store's own
 * `setCushionFloor` applies the identical snap-to-$25 logic, so the tutorial teaches the real behaviour.
 */
export function CushionFloorSheet({
  visible,
  floor,
  onClose,
  onApply,
  coach,
}: {
  visible: boolean;
  floor: number;
  onClose: () => void;
  /** Commit the chosen floor. The real app passes the app store's setter; the tutorial passes the sandbox's. */
  onApply: (value: number) => void;
  /** 3.5.3.4.2 — one line of walkthrough guidance, shown only while the tutorial sent the user here.
   *  This sheet is a `Modal`, so it covers the coaching card that pointed at it; without this the user
   *  is alone with a slider in the middle of a lesson. Absent in every real use. */
  coach?: string;
}) {
  const c = useAppColors();
  const [value, setValue] = useState(Number.isFinite(floor) ? floor : 200);

  return (
    <FormSheet
      visible={visible}
      title="Your cushion line"
      subtitle="The cash the Guardian keeps each paycheck before any extra debt payoff."
      submitLabel="Save"
      onSubmit={() => {
        onApply(value);
        onClose();
      }}
      onClose={onClose}>
      <View style={styles.body}>
        {/* Bare accent text, no card or fill: this is the walkthrough's voice passing through, not a
            second piece of content competing with the control it's describing ([[less is more premium]]). */}
        {coach ? (
          <Text style={[textStyles.subhead, styles.coach, { color: c.accent.primary }]} testID="floor-sheet-coach">
            {coach}
          </Text>
        ) : null}
        {/* `testID` so the e2e can wait for the line to have actually MOVED before saving. The slider
            itself cannot answer that on web: react-native-web drops `accessibilityValue`, so the control
            renders `role="slider"` with no `aria-valuenow` — measured 2026-08-08. */}
        <Text testID="floor-sheet-value" maxFontSizeMultiplier={1.4} style={[textStyles.heroNumber, styles.value, { color: c.text.primary }]}>${value.toLocaleString('en-US')}</Text>
        <Slider value={value} onChange={setValue} min={0} max={500} step={25} accessibilityLabel="Cushion line amount" testID="cushion-floor-slider" />
        <View style={styles.scaleRow}>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>$0</Text>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>$500</Text>
        </View>
      </View>
    </FormSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingVertical: spacing.sm },
  value: { textAlign: 'center' },
  coach: { textAlign: 'center', fontWeight: '600' },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
