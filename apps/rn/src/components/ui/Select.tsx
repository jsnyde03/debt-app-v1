import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * Labeled picker: shows the current value; tap opens a modal option list.
 *
 * ⛔ **`readOnly` STATES the value instead of disabling the control.** [P6.8.9.7.11.18 · S1.1 · D71] A
 * disabled picker still says *"this is a thing you could set"*, and for the case it was added for — a
 * second goal cannot be **the** emergency fund, because the app models exactly one — that is false. So
 * the row keeps the label and the value and loses the affordance entirely. ⚠️ `note` is required with it:
 * a value the user cannot change has to say why, or it reads as a bug.
 */
export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
  readOnly,
  note,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
} & ({ readOnly?: false; note?: never } | { readOnly: true; note: string })) {
  const c = useAppColors();
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  if (readOnly) {
    return (
      <View style={styles.field}>
        <Text style={[textStyles.footnote, styles.label, { color: c.text.secondary }]}>{label}</Text>
        {/* ⚠️ No `Pressable`, no chevron — the absence of both IS the message. */}
        <View style={[styles.control, { backgroundColor: c.background.secondary, borderColor: c.border.control }]}>
          <Text style={[textStyles.body, { color: c.text.primary }]}>{current?.label ?? value}</Text>
        </View>
        <Text style={[textStyles.caption, { color: c.text.secondary }]}>{note}</Text>
      </View>
    );
  }
  return (
    <View style={styles.field}>
      <Text style={[textStyles.footnote, styles.label, { color: c.text.secondary }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        style={[styles.control, { backgroundColor: c.background.secondary, borderColor: c.border.control }]}>
        <Text style={[textStyles.body, { color: c.text.primary }]}>{current?.label ?? 'Select'}</Text>
        <AppIcon name="expand-more" size={20} color={c.text.tertiary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { backgroundColor: c.background.secondary, borderColor: c.border.default }]}>
            {options.map((o) => (
              <Pressable
                key={o.value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                style={styles.option}>
                <Text style={[textStyles.body, { color: o.value === value ? c.accent.primary : c.text.primary }]}>{o.label}</Text>
                {o.value === value ? <AppIcon name="check" size={18} color={c.accent.primary} /> : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '600' },
  control: {
    minHeight: 52,
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', padding: spacing.xl },
  menu: { width: '100%', maxWidth: 360, borderRadius: layout.cardRadius, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  option: { minHeight: 52, paddingHorizontal: spacing.base, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
