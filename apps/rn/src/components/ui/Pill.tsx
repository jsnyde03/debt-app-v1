import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, pressedOpacity, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export type PillTone = 'action' | 'autopay' | 'paid' | 'overdue' | 'neutral';

/** One unified pill/chip scale for row status + actions (replaces the drifting Capacitor pill set). */
export function Pill({
  label,
  tone = 'neutral',
  onPress,
  testID,
}: {
  label: string;
  tone?: PillTone;
  onPress?: () => void;
  /** ⚠️ Only meaningful with `onPress` — a static pill is not a target anything drives. */
  testID?: string;
}) {
  const c = useAppColors();
  const palette: Record<PillTone, { bg: string; fg: string; border: string }> = {
    action: { bg: c.accent.brand, fg: c.text.onAccent, border: 'transparent' },
    autopay: { bg: 'transparent', fg: c.accent.primary, border: c.accent.primary },
    paid: { bg: 'transparent', fg: c.accent.success, border: c.accent.success },
    overdue: { bg: 'transparent', fg: c.accent.danger, border: c.accent.danger },
    neutral: { bg: c.background.tertiary, fg: c.text.secondary, border: c.border.subtle },
  };
  const p = palette[tone];
  const body = <Text style={[textStyles.footnote, styles.label, { color: p.fg }]}>{label}</Text>;
  const base = [styles.pill, { backgroundColor: p.bg, borderColor: p.border }];

  if (onPress) {
    return (
      // ⛔ [P6.4.4] `hitSlop` — the pill is `minHeight: 32`, which is BELOW the 44pt minimum, and a
      // pressable pill had no slop at all. That is the open `hitRegion` finding's class (two targets
      // under the minimum, reproducible on both tiers), so a third was not going to be added here.
      // 6pt each side takes 32 → 44 without moving a single pixel of layout.
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        testID={testID}
        hitSlop={6}
        style={({ pressed }) => [...base, { opacity: pressed ? pressedOpacity : 1 }]}>
        {body}
      </Pressable>
    );
  }
  return <View style={base}>{body}</View>;
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 32,
    borderRadius: layout.pillRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700' },
});
