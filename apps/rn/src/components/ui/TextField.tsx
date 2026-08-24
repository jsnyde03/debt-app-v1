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
  note,
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
  /** A FAILURE — the input cannot be accepted as typed. Renders in the danger treatment. */
  error?: string;
  /**
   * [P6.4.5 · audit L6-9] A legitimate OUTCOME the user should know about — not a failure.
   *
   * ⛔ **Why this exists.** `LogPaymentSheet` shipped *"More than the balance — this will clear it to
   * $0."* through `error`. That string describes a perfectly valid thing to do, and the finding filed it
   * at medium confidence as a HYPOTHESIS *(«I did not read how the component renders `error`»)*.
   * **Measured: `error` paints the border AND the caption `c.accent.danger`** — so the app was telling
   * the user, in the failure treatment, that their entry was fine. ⚠️ The submit button stays enabled
   * throughout, which is the tell: a control you are allowed to press should not be wearing a red label.
   */
  note?: string;
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
            borderColor: error ? c.accent.danger : c.border.control,
          },
        ]}
      />
      {/* ⚠️ `error` wins if both are somehow set — a real failure must never be softened into a note. */}
      {error ? (
        <Text style={[textStyles.caption, { color: c.accent.danger }]}>{error}</Text>
      ) : note ? (
        <Text style={[textStyles.caption, { color: c.text.secondary }]}>{note}</Text>
      ) : null}
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
