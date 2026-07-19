import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** A compact 2–3 option segmented control (e.g. the debt/bill toggle). */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const c = useAppColors();
  return (
    <View style={[styles.track, { backgroundColor: c.background.tertiary, borderColor: c.border.subtle }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.seg,
              active && { backgroundColor: c.background.secondary, borderColor: c.border.default },
            ]}>
            <Text
              style={[
                textStyles.subhead,
                { color: active ? c.text.primary : c.text.secondary, fontWeight: active ? '600' : '400' },
              ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: layout.inputRadius,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 3,
  },
  seg: {
    flex: 1,
    minHeight: 44,
    borderRadius: layout.inputRadius - 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
