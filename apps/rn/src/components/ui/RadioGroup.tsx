import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { a11yChecked } from '@/utils/a11y';

/** A vertical single-select list of options with an optional sublabel (e.g. the pay-cycle picker). */
export function RadioGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; sublabel?: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const c = useAppColors();
  return (
    <View style={styles.group}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            {...a11yChecked(active)}
            style={[
              styles.row,
              { backgroundColor: c.background.secondary, borderColor: active ? c.accent.primary : c.border.default },
            ]}>
            <View style={styles.rowText}>
              <Text style={[textStyles.body, { color: c.text.primary }]}>{o.label}</Text>
              {o.sublabel ? (
                <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{o.sublabel}</Text>
              ) : null}
            </View>
            <View style={[styles.dot, { borderColor: active ? c.accent.primary : c.border.strong }]}>
              {active ? <View style={[styles.dotFill, { backgroundColor: c.accent.primary }]} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  rowText: { flex: 1, gap: 1 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFill: { width: 10, height: 10, borderRadius: 5 },
});
