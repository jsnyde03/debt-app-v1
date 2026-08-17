import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * A labeled date field that opens the platform's own picker. Reported by 🎯 on 2026-08-17: the Money
 * tab's edit sheets asked the user to TYPE `YYYY-MM-DD` into a plain text box.
 *
 * ⚠️ **THE VALUE CONTRACT IS A LOCAL CALENDAR DATE, `YYYY-MM-DD`, and every conversion here avoids
 * `toISOString()` deliberately.** That method converts to UTC, and the app stores calendar dates, not
 * instants — so a local midnight in any timezone EAST of UTC serialises to the previous day. That exact
 * defect was found in `todayLocalISO()` while building this (see `data/defaults.ts`), and it is why the
 * two helpers below are hand-rolled rather than one-liners. **A picker built on `toISOString()` would
 * put a nicer control in front of the same off-by-one.**
 *
 * ⚠️ Matches `TextField`'s label + control geometry on purpose — these sit next to each other in every
 * sheet, and a date row that is a different height or weight reads as a different KIND of control.
 *
 * ⛔ `testID` for the same reason `TextField` documents at length: the visible label and the control's
 * `accessibilityLabel` carry the same string, so a selector matching it can resolve to the non-tappable
 * one. That ambiguity cost a CI cycle once already.
 */

/** `YYYY-MM-DD` from a Date's LOCAL fields. Never `toISOString()` — see the note above. */
function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Parse `YYYY-MM-DD` into a LOCAL Date. `new Date('2026-08-17')` is parsed as UTC midnight by spec,
 * which renders as the previous day west of UTC — the mirror image of the write-side bug.
 */
function fromLocalISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

/** How the value reads to a human. The stored form stays ISO; only the display is localised. */
function display(iso: string): string {
  const d = fromLocalISO(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

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
  // ⚠️ The APP's scheme, not the OS's. `useColorScheme` here resolves `prefs.themeMode` first and only
  // falls back to the system — which is the whole point: §11.14 exists because the two can disagree.
  const scheme = useColorScheme();
  const [open, setOpen] = useState(false);

  // ⚠️ ANDROID DISMISSES ITSELF, iOS DOES NOT. The community picker renders a modal dialog on Android
  // (one `set`/`dismissed` event, then gone) and an INLINE spinner on iOS that stays until something
  // closes it. Treating them the same leaves an iOS picker that cannot be dismissed, or an Android one
  // that reopens. This app is iOS-first but the branch is written out rather than assumed away.
  const onPicked = (event: { type: string }, picked?: Date) => {
    if (Platform.OS !== 'ios') setOpen(false);
    if (event.type === 'dismissed' || !picked) return;
    onChange(toLocalISO(picked));
  };

  return (
    <View style={styles.field}>
      <Text style={[textStyles.footnote, styles.label, { color: c.text.secondary }]}>{label}</Text>
      <Pressable
        testID={testID}
        onPress={() => setOpen((o) => !o)}
        accessibilityRole="button"
        // The VALUE belongs in the label, not just the field name: a screen-reader user tabbing past
        // "Due date" learns nothing about what the date currently is.
        accessibilityLabel={`${label}, ${display(value)}`}
        style={[
          styles.input,
          { backgroundColor: c.background.secondary, borderColor: c.border.default },
        ]}>
        <Text style={[textStyles.body, { color: value ? c.text.primary : c.text.tertiary }]}>
          {value ? display(value) : 'Select a date'}
        </Text>
      </Pressable>
      {open ? (
        <DateTimePicker
          value={fromLocalISO(value)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onPicked}
          // ⚠️ Themed explicitly: the iOS inline picker defaults to the SYSTEM appearance, not the app's.
          // This app has its own in-app theme toggle (the walkthrough's own §11 rows exist because the
          // two can disagree), so a picker following the OS would be the one light panel in a dark sheet.
          themeVariant={scheme}
          accentColor={c.accent.primary}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  input: {
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
  },
});
