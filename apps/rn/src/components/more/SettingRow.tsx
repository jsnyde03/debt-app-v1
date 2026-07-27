import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { PressableScale } from '@/components/ui/PressableScale';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** Groups setting rows into a single inset card (iOS-style grouped list). */
export function SettingGroup({ children }: { children: ReactNode }) {
  return <Card padded={false}>{children}</Card>;
}

/**
 * One row in the More hub's grouped list: a tinted icon, a label + optional subtitle, and a right
 * slot (a chevron for nav rows by default, or a passed control/value). `onPress` makes it tappable;
 * `danger` tints the label for destructive actions. `last` suppresses the bottom divider.
 */
export function SettingRow({
  icon,
  label,
  subtitle,
  onPress,
  right,
  danger,
  last,
}: {
  icon: IconGlyph;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  danger?: boolean;
  last?: boolean;
}) {
  const c = useAppColors();
  const labelColor = danger ? c.accent.danger : c.text.primary;
  const iconColor = danger ? c.accent.danger : c.accent.primary;

  const body = (
    <View style={[styles.row, !last && { borderBottomColor: c.border.subtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.iconWrap, { backgroundColor: c.background.tertiary }]}>
        <AppIcon name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.text}>
        <Text style={[textStyles.body, { color: labelColor }]}>{label}</Text>
        {subtitle ? <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>
        {right ?? (onPress ? <AppIcon name="chevron-right" size={20} color={c.text.tertiary} /> : null)}
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  iconWrap: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 1 },
  right: { flexShrink: 0 },
});
