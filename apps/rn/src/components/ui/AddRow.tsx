import { Pressable, StyleSheet, Text } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
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
      style={({ pressed }) => [styles.row, { borderColor: c.border.strong, opacity: pressed ? 0.6 : 1 }]}>
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
