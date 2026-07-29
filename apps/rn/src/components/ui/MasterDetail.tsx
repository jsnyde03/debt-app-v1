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

  if (!isExpanded) return <View style={styles.flex}>{list}</View>;

  return (
    <View style={styles.row}>
      <View style={[styles.listPane, { borderRightColor: c.border.subtle }]}>{list}</View>
      <View style={styles.detailPane}>{hasSelection ? detail : detailEmpty}</View>
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
