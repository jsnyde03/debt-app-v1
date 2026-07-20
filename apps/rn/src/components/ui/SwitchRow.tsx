import { StyleSheet, Switch, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** A labeled toggle row (e.g. Autopay). */
export function SwitchRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const c = useAppColors();
  return (
    <View style={styles.row}>
      <Text style={[textStyles.body, styles.label, { color: c.text.primary }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: c.accent.primary, false: c.border.strong }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 44 },
  label: { flex: 1 },
});
