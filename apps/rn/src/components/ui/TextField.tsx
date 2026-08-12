import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Labeled themed text input with an optional inline error.
 *
 * ⚠️ **`testID` exists because the LABEL is ambiguous to a test runner, and it cost a CI cycle.** The
 * visible `<Text>` and the `TextInput`'s `accessibilityLabel` carry the SAME string, so a selector
 * matching that string can resolve to either — and only one of them is focusable. Maestro tapped the
 * label, `inputText` typed into nothing, and every step still reported COMPLETED: the flow walked on and
 * failed three steps later at "Add your first debt or expense", with the app's own validation
 * ("Enter your paycheck amount to continue") the only clue on screen.
 *
 * That is the worst shape a test failure can have — it reported success at the step that was actually
 * broken. Pass a `testID` for any field a flow types into; it is unambiguous by construction.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  testID,
  maxLength,
  autoCapitalize,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
  testID?: string;
  /** Cap at the INPUT rather than on save — a value silently truncated on write reads as data loss. */
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const c = useAppColors();
  return (
    <View style={styles.field}>
      <Text style={[textStyles.footnote, styles.label, { color: c.text.secondary }]}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={c.text.tertiary}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
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
