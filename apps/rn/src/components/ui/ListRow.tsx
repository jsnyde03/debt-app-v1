import { LOG_PAYMENT_ENTRY, PAYOFF_SCHEDULE_TITLE } from '@core/copy/vocabulary';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

import { AppIcon } from '@/components/ui/AppIcon';
import { Pill, type PillTone } from '@/components/ui/Pill';
import { RowContextMenu } from '@/components/ui/RowContextMenu';
import type { RowMenuAction } from '@/components/ui/RowContextMenu.types';
import { useAppColors } from '@/hooks/use-app-colors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { cardElevation } from '@/theme/elevation';
import { layout, pressedOpacity, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { a11yHidden, groupLabel } from '@/utils/a11y';
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
  onViewSchedule,
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
  /**
   * ⛔ DATA, NOT A `ReactNode`, AND THAT IS THE FIX. This used to take rendered children, so
   * `groupLabel` — which takes strings — could not see a word of it: a row announced
   * *"Klarna, 2 of 4 paid, interest-free"* **minus the word Klarna**, and `Focus` and `Autopay` reached
   * nobody at all. On iOS an explicit `accessibilityLabel` stops the subtree being recursed; on web the
   * computed name wins over the children. Two mechanisms, one cause: the label could not read the badge.
   *
   * A `badgeLabels` prop beside a `badges` node would have been a second copy of the same words, free to
   * diverge the first time somebody edited one. Rendering the pills from the same array the label is built
   * from makes divergence structurally impossible.
   */
  badges?: { label: string; tone?: PillTone; key?: string }[];
  progress?: number;
  /** Fill color for the progress bar — defaults to the success/progress green. */
  progressColor?: string;
  onPress?: () => void;
  /** If set, the row becomes swipeable → a red Delete action (3.4.4). Runs after a destructive confirm. */
  onDelete?: () => void;
  /** 3.5.5.2 — if set, the long-press menu gains a "Log payment" action (debts only). */
  onLogPayment?: () => void;
  /** 3.7.A0 — if set, the long-press menu gains a "Payoff schedule" action (debts only). iOS-only by
   *  nature (RowContextMenu is a passthrough elsewhere), so it is the FAST path, not the only one — the
   *  edit sheet carries the cross-platform entry. */
  onViewSchedule?: () => void;
  /** 3.6.2 — the row whose detail is open in the iPad master-detail pane (accent border + tint). */
  selected?: boolean;
}) {
  const c = useAppColors();
  const scheme = useColorScheme();
  const swipeRef = useRef<SwipeableMethods>(null);
  // 3.6.6 — iPad pointer / web-mouse hover cue (via the typed onHoverIn/Out props; inert on touch). A
  // subtle raise to the tertiary surface signals "interactive"; `selected` keeps its accent border.
  const [hovered, setHovered] = useState(false);
  // One screen-reader utterance: "Visa, Focus, $2,400 · 22.99% APR, estimated verified Jun 3, $65.00/mo".
  // The badges sit right after the title, where a sighted reader meets them.
  const a11y = groupLabel(
    title,
    badges?.map((b) => b.label).join(', ') || undefined,
    [meta, caption].filter(Boolean).join(', ') || undefined,
    amount ? `${amount}${amountSuffix ?? ''}` : undefined,
  );
  const rowBody = (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={onPress ? 'Opens the editor' : undefined}
      {...a11y}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => [
        styles.row,
        cardElevation(scheme),
        {
          backgroundColor: selected || hovered ? c.background.tertiary : c.background.secondary,
          borderColor: selected ? c.accent.primary : c.border.subtle,
          opacity: pressed ? pressedOpacity : 1,
        },
      ]}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text style={[textStyles.bodyMedium, { color: c.text.primary }]} numberOfLines={1}>
            {title}
          </Text>
          {badges?.map((b, i) => <Pill key={b.key ?? b.label ?? i} label={b.label} tone={b.tone} />)}
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
  const renderRightActions = () => <SwipeDeleteAction title={title} onPress={handleDelete} fill={c.accent.danger} ink={c.text.onAccent} />;

  // iOS long-press → native context menu (3.5.2): Edit (if the row is tappable) + a destructive Delete.
  // A discoverable alternative to the hidden swipe; tap + swipe stay untouched. Passthrough off-iOS.
  const menuActions: RowMenuAction[] = [
    ...(onLogPayment ? [{ key: 'log', title: LOG_PAYMENT_ENTRY, systemIcon: 'dollarsign.circle', onPress: onLogPayment } as RowMenuAction] : []),
    ...(onViewSchedule ? [{ key: 'schedule', title: PAYOFF_SCHEDULE_TITLE, systemIcon: 'calendar', onPress: onViewSchedule } as RowMenuAction] : []),
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
  // ⛔ [P6.4.5 · audit L5-16] `flexShrink: 0` + a cap. `left` is `flex: 1` and every text in it is
  // `numberOfLines={1}`, so under pressure the NAME was what gave: a mortgage row ($2,450.00 + /mo) at
  // large Dynamic Type squeezed "Chase Sapphire Preferred Card" to a few characters. The amount column
  // had no shrink and no bound, so it took whatever it wanted. ⚠️ The finding read the styles and called
  // the rendering a HYPOTHESIS — still true; this is defensive, and the proof is a P6.14 device row.
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 0, maxWidth: '45%' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 2 },
  fill: { height: 6, borderRadius: 3 },
  // Clip the revealed action to the row's rounded shape so the red panel doesn't peek past the corners.
  swipeContainer: { borderRadius: layout.cardRadius, overflow: 'hidden' },
  deleteAction: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  deleteText: { fontWeight: '700', fontSize: 15 }, // colour is a PROP — see `SwipeDeleteAction`
});

/**
 * The swipe-revealed Delete pane, fenced out of the accessibility tree PERMANENTLY.
 *
 * ⛔ It was reachable at rest and announced BEFORE the row it belongs to — `button "Delete Card"` came
 * first in the tree, so a screen-reader user met a destructive action for a debt they had not yet been
 * told about. The pane mounts with the row and lives outside an `overflow: hidden` container; nothing was
 * hiding it because the component holds no open/closed state at all.
 *
 * ⚠️ PERMANENTLY, and not gated on open, on purpose. `RequiredActionsCard`'s own comment records that
 * gating this on React state was measured to reset `ReanimatedSwipeable`'s pan mid-gesture — the row snaps
 * shut the instant it opens — so the cheaper-looking fix carries a real regression risk. Nothing is lost
 * by fencing it outright: Delete is reachable from the row's edit sheet on every platform, and from the
 * long-press context menu on iOS. A swipe is a pointer gesture; it was never the screen-reader path.
 *
 * ⚠️ THE TAB-ORDER HALF IS `tabIndex`, AND THE TWO OBVIOUS ALTERNATIVES ARE BOTH WRONG — each was tried and
 * each traded this defect for a different one:
 *   • `useInert` applies `inert`, which also makes the subtree NON-INTERACTIVE. On web that takes the
 *     pointer path with it: the pane stops answering the tap it exists for and swipe-to-delete silently
 *     stops working. Caught by `swipe-delete.spec.ts`, not by any test written to prove the fence.
 *   • `focusable={false}` never reaches the DOM. `Pressable` computes its own `tabIndex`
 *     (`disabled ? -1 : 0`) and forwards it, so `createDOMProps`' `focusable` branch is dead code behind an
 *     already-defined value — the button shipped `aria-hidden="true"` WITH `tabindex="0"`, which is the
 *     `aria-hidden-focus` violation this fence exists to avoid. Caught by axe.
 * The intent is narrow and worth stating exactly: invisible to assistive technology, fully operable by the
 * finger that revealed it, and not a tab stop.
 */
function SwipeDeleteAction({
  title,
  onPress,
  fill,
  ink,
}: {
  title: string;
  onPress: () => void;
  fill: string;
  /**
   * ⛔ A PROP, not a literal, and the reason is the theme. This was `#ffffff` in the stylesheet — **5.79:1
   * in light and 2.69:1 in dark**, because `accent.danger` lightens to `#fb7185` there while a literal
   * cannot follow. `text.onAccent` flips to `#08111f` and reads **7.03:1**. Caught by `lint:contrast`'s
   * literal-ink check (P6.8.9.7.1); the grid could not see it because the ground is an accent, not a
   * `background.*`.
   */
  ink: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Delete ${title}`}
      tabIndex={-1}
      {...a11yHidden(true)}
      style={[styles.deleteAction, { backgroundColor: fill }]}>
      <Text style={[styles.deleteText, { color: ink }]}>Delete</Text>
    </Pressable>
  );
}
