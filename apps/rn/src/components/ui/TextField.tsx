import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** Labeled themed text input with an optional inline error. */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
}) {
  const c = useAppColors();
  return (
    <View style={styles.field}>
      <Text style={[textStyles.footnote, styles.label, { color: c.text.secondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={c.text.tertiary}
        keyboardType={keyboardType}
        style={[
          textStyles.body,
          styles.input,
          {
            color: c.text.primary,
            backgroundColor: c.background.secondary,
            borderColor: error ? c.accent.danger : c.border.default,
          },
        ]}
      />
      {error ? <Text style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  input: {
    minHeight: 52,
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
  },
});
