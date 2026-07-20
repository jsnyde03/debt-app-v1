import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/**
 * The standardized list row for Debts / Bills / Goals — calm hierarchy (title + one meta line +
 * a quiet amount), tap → opens the edit sheet. Optional badges, progress bar, amount suffix.
 * (Swipe-to-delete → B.9; Remove lives in the edit sheet.)
 */
export function ListRow({
  title,
  meta,
  amount,
  amountSuffix,
  badges,
  progress,
  onPress,
}: {
  title: string;
  meta?: string;
  amount?: string;
  amountSuffix?: string;
  badges?: ReactNode;
  progress?: number;
  onPress?: () => void;
}) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { backgroundColor: c.background.secondary, borderColor: c.border.subtle, opacity: pressed ? 0.9 : 1 }]}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={1}>
            {title}
          </Text>
          {badges}
        </View>
        {meta ? (
          <Text style={[textStyles.caption, { color: c.text.tertiary }]} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
        {progress !== undefined ? (
          <View style={[styles.track, { backgroundColor: c.background.tertiary }]}>
            <View style={[styles.fill, { backgroundColor: c.accent.success, width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
          </View>
        ) : null}
      </View>
      <View style={styles.right}>
        {amount ? (
          <Text style={[textStyles.numericBody, { color: c.text.primary }]}>
            {amount}
            {amountSuffix ? <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{amountSuffix}</Text> : null}
          </Text>
        ) : null}
        <AppIcon name="chevron-right" size={20} color={c.text.tertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: layout.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: spacing.md,
  },
  left: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  fill: { height: 6, borderRadius: 3 },
});
