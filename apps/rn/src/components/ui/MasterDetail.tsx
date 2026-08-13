import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useAppColors } from '@/hooks/use-app-colors';
import { useLayout } from '@/hooks/use-layout';
import { spacing } from '@/theme/spacing';

/**
 * 3.6.1 — adaptive master-detail (Money-only, per the 3.6 design lock). On the EXPANDED canvas the `list`
 * pane (left, fixed width) sits beside the `detail` pane (right, flexible; shows `detailEmpty` when
 * nothing's selected). On compact (iPhone / portrait iPad / narrow split) it renders the `list` ALONE —
 * the host screen presents the detail some other way there (a sheet). Each pane owns its own scroll.
 *
 * Render inside a `wide` `Screen` so the panes get the full canvas.
 */
export function MasterDetail({
  list,
  detail,
  detailEmpty,
  hasSelection,
}: {
  list: ReactNode;
  detail: ReactNode;
  /** Shown in the detail pane on expanded when nothing is selected (e.g. "Select a debt"). */
  detailEmpty?: ReactNode;
  hasSelection: boolean;
}) {
  const { isExpanded } = useLayout();
  const c = useAppColors();

  // 4.1.5.3 — both branches named, for the reason spelled out in `TwoColumn`: an id that exists on only
  // one layout is what makes a device-specific check discriminate, and naming the OTHER branch is what
  // proves it does. ⚠️ `layout-detail-pane` is separate from `layout-master-detail` deliberately — the
  // pane is where [D30]'s inline-sheet premise lives (`money.tsx:396` passes `inline` when expanded), so
  // "the split rendered" and "the detail pane is showing the right thing" are different questions and one
  // id for both would make each assertion silently ambiguous.
  // ⚠️ [4.1.5.3] THIS BRANCH IS UNREACHABLE FROM THE ONLY CALLER, and deliberately carries no testID.
  // `money.tsx:402` decides `isExpanded ? <MasterDetail…> : <>{list}{editor}</>` — so on compact this
  // component never mounts and the check below is a second owner of a rule already decided above it
  // ("two places, one rule", the shape Wave A hit three times). An id here would advertise coverage of a
  // path nothing can reach; the compact assertion is `assertNotVisible: layout-master-detail` instead.
  // Left in place rather than deleted — it is a correct fallback if a second caller ever appears — but
  // the duplication is filed, not endorsed.
  if (!isExpanded) return <View style={styles.flex}>{list}</View>;

  return (
    <View style={styles.row} testID="layout-master-detail">
      <View style={[styles.listPane, { borderRightColor: c.border.subtle }]}>{list}</View>
      <View style={styles.detailPane} testID="layout-detail-pane">{hasSelection ? detail : detailEmpty}</View>
    </View>
  );
}

/** The list pane width on the expanded layout — enough for a debt row, leaving the detail the rest. */
const LIST_PANE_WIDTH = 340;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flex: 1, flexDirection: 'row' },
  listPane: { width: LIST_PANE_WIDTH, borderRightWidth: StyleSheet.hairlineWidth },
  detailPane: { flex: 1, paddingLeft: spacing.xl, minWidth: 0 },
});
