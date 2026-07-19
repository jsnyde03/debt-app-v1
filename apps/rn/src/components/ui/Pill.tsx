import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

export type PillTone = 'action' | 'autopay' | 'paid' | 'overdue' | 'neutral';

/** One unified pill/chip scale for row status + actions (replaces the drifting Capacitor pill set). */
export function Pill({ label, tone = 'neutral', onPress }: { label: string; tone?: PillTone; onPress?: () => void }) {
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
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [...base, { opacity: pressed ? 0.8 : 1 }]}>
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
