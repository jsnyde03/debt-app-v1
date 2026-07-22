import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormSheet } from '@/components/ui/FormSheet';
import { Slider } from '@/components/ui/Slider';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * "Your cushion line" — set the floor the Guardian holds each cycle before any extra debt payoff.
 * Framed as the user's own low-balance alert line (Jason's model). Snapped to $25, applied on Save.
 */
export function CushionFloorSheet({ visible, floor, onClose }: { visible: boolean; floor: number; onClose: () => void }) {
  const c = useAppColors();
  const [value, setValue] = useState(Number.isFinite(floor) ? floor : 200);

  return (
    <FormSheet
      visible={visible}
      title="Your cushion line"
      subtitle="The cash the Guardian keeps each paycheck before any extra debt payoff — like a low-balance alert, set where you're comfortable."
      submitLabel="Save"
      onSubmit={() => {
        appStore.getState().setCushionFloor(value);
        onClose();
      }}
      onClose={onClose}>
      <View style={styles.body}>
        <Text style={[textStyles.heroNumber, styles.value, { color: c.text.primary }]}>${value.toLocaleString('en-US')}</Text>
        <Slider value={value} onChange={setValue} min={0} max={500} step={25} accessibilityLabel="Cushion line amount" />
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
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
