import { type ReactNode, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { AppIcon } from '@/components/ui/AppIcon';
import { RowContextMenu } from '@/components/ui/RowContextMenu';
import type { RowMenuAction } from '@/components/ui/RowContextMenu.types';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cardElevation } from '@/theme/elevation';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';
import { confirmDelete } from '@/utils/confirm';

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
  onCaptionPress,
  amount,
  amountSuffix,
  badges,
  progress,
  progressColor,
  onPress,
  onDelete,
  onLogPayment,
  selected,
}: {
  title: string;
  meta?: string;
  /** Optional quiet second line under `meta` (e.g. Projection auto-maintenance's "estimated · verified {date}"). */
  caption?: string;
  /** Tint for `caption` — defaults to the tertiary text color. */
  captionColor?: string;
  /** If set, the caption becomes its own tap target (e.g. "tap to verify") without triggering the row's onPress. */
  onCaptionPress?: () => void;
  amount?: string;
  amountSuffix?: string;
  badges?: ReactNode;
  progress?: number;
  /** Fill color for the progress bar — defaults to the success/progress green. */
  progressColor?: string;
  onPress?: () => void;
  /** If set, the row becomes swipeable → a red Delete action (3.4.4). Runs after a destructive confirm. */
  onDelete?: () => void;
  /** 3.5.5.2 — if set, the long-press menu gains a "Log payment" action (debts only). */
  onLogPayment?: () => void;
  /** 3.6.2 — the row whose detail is open in the iPad master-detail pane (accent border + tint). */
  selected?: boolean;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const swipeRef = useRef<SwipeableMethods>(null);
  // One screen-reader utterance: "Visa, $2,400 · 22.99% APR, estimated verified Jun 3, $65.00/mo".
  const a11y = groupLabel(title, [meta, caption].filter(Boolean).join(', ') || undefined, amount ? `${amount}${amountSuffix ?? ''}` : undefined);
  const rowBody = (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={onPress ? 'Opens the editor' : undefined}
      {...a11y}
      style={({ pressed }) => [
        styles.row,
        cardElevation(scheme),
        {
          backgroundColor: selected ? c.background.tertiary : c.background.secondary,
          borderColor: selected ? c.accent.primary : c.border.subtle,
          opacity: pressed ? 0.9 : 1,
        },
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
          // onPress on the Text itself (a tappable span on web, not a nested <button>) — stopPropagation
          // so the row's edit-sheet onPress doesn't also fire. Plain Text when not tappable.
          <Text
            onPress={onCaptionPress ? (e) => { e.stopPropagation?.(); onCaptionPress(); } : undefined}
            // Button role only on native — on web it renders a nested <button> inside the row's button (invalid DOM).
            accessibilityRole={onCaptionPress && Platform.OS !== 'web' ? 'button' : undefined}
            style={[textStyles.caption, { color: captionColor ?? c.text.tertiary }]}
            numberOfLines={1}>
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

  if (!onDelete) return rowBody;

  const handleDelete = async () => {
    const ok = await confirmDelete(`Delete ${title}?`);
    if (ok) onDelete();
    else swipeRef.current?.close(); // cancelled → snap the row back
  };
  const renderRightActions = () => (
    <Pressable
      onPress={handleDelete}
      accessibilityRole="button"
      accessibilityLabel={`Delete ${title}`}
      style={[styles.deleteAction, { backgroundColor: c.accent.danger }]}>
      <Text style={styles.deleteText}>Delete</Text>
    </Pressable>
  );

  // iOS long-press → native context menu (3.5.2): Edit (if the row is tappable) + a destructive Delete.
  // A discoverable alternative to the hidden swipe; tap + swipe stay untouched. Passthrough off-iOS.
  const menuActions: RowMenuAction[] = [
    ...(onLogPayment ? [{ key: 'log', title: 'Log payment', systemIcon: 'dollarsign.circle', onPress: onLogPayment } as RowMenuAction] : []),
    ...(onPress ? [{ key: 'edit', title: 'Edit', systemIcon: 'pencil', onPress } as RowMenuAction] : []),
    { key: 'delete', title: 'Delete', systemIcon: 'trash', destructive: true, onPress: handleDelete },
  ];

  return (
    <ReanimatedSwipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
      containerStyle={styles.swipeContainer}>
      <RowContextMenu title={title} actions={menuActions}>
        {rowBody}
      </RowContextMenu>
    </ReanimatedSwipeable>
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
  // Clip the revealed action to the row's rounded shape so the red panel doesn't peek past the corners.
  swipeContainer: { borderRadius: layout.cardRadius, overflow: 'hidden' },
  deleteAction: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  deleteText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
