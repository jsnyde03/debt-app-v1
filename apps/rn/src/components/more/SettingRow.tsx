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
    // ⛔ THE SUBTITLE HAS TO BE IN THE LABEL. Setting `accessibilityLabel` on the pressable makes it one
    // accessibility element and REPLACES what its children contribute — so the subtitle rendered above
    // was on screen and absent from the tree. VoiceOver announced "Show feature tips again" and never
    // "Tips will appear again as you go.", and the same held for every row in More: "Look back at your
    // finished pay cycles", "Save a copy of your data", "Automatic cloud backup — coming soon". The
    // label says what a row IS; the subtitle is the only place that says what it DOES, or that it is not
    // available yet. Sighted users got both, VoiceOver users got half.
    //
    // Found 2026-08-12 by Maestro flow 08, which asserts the subtitle as its state confirmation and
    // could not see it either — the accessibility tree is what both a screen reader and the native lane
    // read, which is why a11y gaps surface there first.
    // One utterance rather than two elements: the house pattern from A4's finale-stat grouping.
    <PressableScale onPress={onPress} accessibilityLabel={subtitle ? `${label}. ${subtitle}` : label}>
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
