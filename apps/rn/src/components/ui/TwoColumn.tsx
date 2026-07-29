import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useLayout } from '@/hooks/use-layout';
import { spacing } from '@/theme/spacing';

/**
 * 3.6.1 — adaptive two-column layout. On the EXPANDED canvas (landscape iPad / wide Split View, ≥1024pt)
 * `left` and `right` sit side-by-side; below that (portrait iPad / iPhone / narrow split) they stack into
 * one column. Layout only — the host screen owns scrolling (render this inside a `wide` `Screen`).
 *
 * Used by the single-object dashboards (Today, Progress) that reflow to two columns, NOT master-detail
 * (that's `MasterDetail`, Money-only).
 */
export function TwoColumn({
  left,
  right,
  ratio = 1,
}: {
  left: ReactNode;
  right: ReactNode;
  /** left:right flex ratio on the expanded layout (1 = even, >1 = left wider). Even by default. */
  ratio?: number;
}) {
  const { isExpanded } = useLayout();

  if (!isExpanded) {
    return (
      <View style={styles.stack}>
        {left}
        {right}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {/* minWidth:0 lets each column shrink so long content wraps instead of overflowing the row. */}
      <View style={[styles.col, { flex: ratio }]}>{left}</View>
      <View style={[styles.col, { flex: 1 }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xl, alignItems: 'flex-start' },
  stack: { gap: spacing.lg },
  col: { minWidth: 0 },
});
