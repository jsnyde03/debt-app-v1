import { StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * The web half of `DateField`. Same contract, same `YYYY-MM-DD` value, native `<input type="date">`.
 *
 * ⛔ **A `.web.tsx` IS REQUIRED, not a nicety.** `@react-native-community/datetimepicker` has no web
 * implementation, so the native file would break the web bundle — and this app's web surface is not a
 * side channel: it is the Playwright suite, `dist/`, and 3.5.7's public marketing embed. Importing the
 * native picker into that bundle would have taken all three down. The split follows the idiom already
 * here (`use-color-scheme.web.ts`, `createAdapter.web.ts`, Sentry's `.web.ts`).
 *
 * ⭐ `<input type="date">` is the right web answer rather than a fallback: it already emits exactly
 * `YYYY-MM-DD` in `value`, localises its own display, and is keyboard-accessible and screen-reader
 * labelled for free. ⚠️ That native format is the reason NO conversion happens on this side — the
 * write-side `toISOString()` bug the native file documents cannot occur here because nothing converts.
 *
 * ⚠️ Rendered through `dataSet`-free plain DOM props: RN-web passes unknown props to the DOM element,
 * so `type`, `value` and `onChange` reach the real input.
 */
export function DateField({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  /** `YYYY-MM-DD`, local calendar date. */
  value: string;
  onChange: (iso: string) => void;
  testID?: string;
}) {
  const c = useAppColors();
  return (
    <View style={styles.field}>
      <Text style={[textStyles.footnote, styles.label, { color: c.text.secondary }]}>{label}</Text>
      {/* A real DOM element. Typechecks without a suppression — RN-web's JSX types include the
          intrinsics, which is worth knowing: a `@ts-expect-error` here would itself have errored. */}
      <input
        type="date"
        data-testid={testID}
        aria-label={label}
        value={value}
        onChange={(e: { target: { value: string } }) => onChange(e.target.value)}
        style={{
          minHeight: 52,
          borderRadius: layout.inputRadius,
          borderWidth: StyleSheet.hairlineWidth,
          borderStyle: 'solid',
          borderColor: c.border.control,
          backgroundColor: c.background.secondary,
          color: c.text.primary,
          paddingLeft: spacing.sm,
          paddingRight: spacing.sm,
          fontSize: 17,
          // ⚠️ Safari renders `input[type=date]` with the UA font unless told otherwise, which is the one
          // control on the sheet that would not match the rest of the form.
          fontFamily: 'inherit',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
});
