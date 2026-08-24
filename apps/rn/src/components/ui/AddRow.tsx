import { Pressable, StyleSheet, Text } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { layout, pressedOpacity, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * A lightweight "+ Add …" row — a dashed affordance that reads as the last item in a list, not a
 * bolted-on button. Replaces the chunky secondary button at the foot of the Money sections. `icon`
 * defaults to "add" but can name any glyph (e.g. "document-scanner" for the §2.8 scan entry).
 */
export function AddRow({
  label,
  onPress,
  icon = 'add',
  testID,
}: {
  label: string;
  onPress: () => void;
  icon?: IconGlyph;
  /** For a row whose LABEL is expected to change (3.7.A10 made every Money add row read "Add"), so a
   *  test can name the affordance rather than the copy. */
  testID?: string;
}) {
  const c = useAppColors();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      /**
       * ⛔ **[V1-5 · P6.8.9.7.5] `border.control`, NOT `border.strong` — this row has NO FILL, so the
       * border is not the best edge available, it is the only thing that exists.**
       *
       * `border.strong` measures **1.41:1** and is excluded from `lint:contrast` as decoration, on the
       * stated grounds that it is *"a divider, a card edge, an underline"*. ⚠️ **That reason is false of
       * all ten of its consumers** — eight are Switch off-state tracks, one is an onboarding step dot, and
       * this one is a button's entire boundary. `border.control` is the token gated at SC 1.4.11's 3:1
       * precisely for "a field, a select, a radio, the segmented thumb and the secondary button outline".
       */
      style={({ pressed }) => [styles.row, { borderColor: c.border.control, opacity: pressed ? pressedOpacity : 1 }]}>
      <AppIcon name={icon} size={18} color={c.accent.primary} />
      <Text style={[textStyles.bodyMedium, { color: c.accent.primary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
  },
});
