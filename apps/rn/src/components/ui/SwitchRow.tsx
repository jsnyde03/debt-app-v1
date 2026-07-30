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
      {/* R2-A2 — the Switch is its own a11y element, so it must carry the row's name (else VoiceOver says
          only "off, switch"). Fixed once here → every SwitchRow consumer (Autopay, trials, variable, …). */}
      <Switch accessibilityLabel={label} value={value} onValueChange={onValueChange} trackColor={{ true: c.accent.primary, false: c.border.strong }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, minHeight: 44 },
  label: { flex: 1 },
});
