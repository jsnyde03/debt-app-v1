import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cardElevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';

/**
 * The standardized list row for Debts / Bills / Goals — calm hierarchy (title + one meta line +
 * a quiet amount), tap → opens the edit sheet. Optional badges, progress bar, amount suffix.
 * (Swipe-to-delete → B.9; Remove lives in the edit sheet.)
 */
export function ListRow({
  title,
  meta,
  caption,
  captionColor,
  amount,
  amountSuffix,
  badges,
  progress,
  progressColor,
  onPress,
}: {
  title: string;
  meta?: string;
  /** Optional quiet second line under `meta` (e.g. Projection auto-maintenance's "estimated · verified {date}"). */
  caption?: string;
  /** Tint for `caption` — defaults to the tertiary text color. */
  captionColor?: string;
  amount?: string;
  amountSuffix?: string;
  badges?: ReactNode;
  progress?: number;
  /** Fill color for the progress bar — defaults to the success/progress green. */
  progressColor?: string;
  onPress?: () => void;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  // One screen-reader utterance: "Visa, $2,400 · 22.99% APR, estimated verified Jun 3, $65.00/mo".
  const a11y = groupLabel(title, [meta, caption].filter(Boolean).join(', ') || undefined, amount ? `${amount}${amountSuffix ?? ''}` : undefined);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={onPress ? 'Opens the editor' : undefined}
      {...a11y}
      style={({ pressed }) => [
        styles.row,
        cardElevation(scheme),
        { backgroundColor: c.background.secondary, borderColor: c.border.subtle, opacity: pressed ? 0.9 : 1 },
      ]}>
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
        {caption ? (
          <Text style={[textStyles.caption, { color: captionColor ?? c.text.tertiary }]} numberOfLines={1}>
            {caption}
          </Text>
        ) : null}
        {progress !== undefined ? (
          <View style={[styles.track, { backgroundColor: c.background.tertiary }]}>
            <View style={[styles.fill, { backgroundColor: progressColor ?? c.accent.success, width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
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
