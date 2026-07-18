/**
 * B.1 stub card — a themed placeholder for a screen/section that's rebuilt in a later Phase-B
 * subtask. Proves the shell (nav + theme + safe-area + adaptive column) end-to-end before any
 * real screen content lands. Removed as each screen is built out.
 */

import { StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export function Placeholder({ label, note }: { label: string; note?: string }) {
  const c = useAppColors();
  return (
    <View style={[styles.card, { backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}>
      <Text style={[textStyles.title3, { color: c.text.primary }]}>{label}</Text>
      {note ? (
        <Text style={[textStyles.subhead, { color: c.text.secondary, marginTop: spacing.xs }]}>{note}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: layout.cardPaddingV,
    gap: 2,
  },
});
