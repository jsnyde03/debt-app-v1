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

  // 4.1.5.3 — the BRANCH is named, on both sides, and that is what makes §10 assertable at all.
  //
  // ⛔ The alternative was asserting that two particular cards are on screen together, which is a test of
  // where content happened to land rather than of which layout ran — the "assertion that passes either
  // way" class this repo has already paid for. `tabBarPosition: isRegular ? 'left' : 'bottom'`
  // (`(tabs)/_layout.tsx:59`) is the same problem one level up and is why the sidebar rail is still NOT
  // assertable: identical ids either way, a position-only difference, and Maestro cannot read a frame.
  //
  // ⚡ Naming BOTH branches rather than only the expanded one is the point: `layout-stacked` on an
  // iPhone-only flow is what proves the expanded assertion discriminates, in the same suite, instead of a
  // human comparing screenshots. A single id would have been half a check.
  if (!isExpanded) {
    return (
      <View style={styles.stack} testID="layout-stacked">
        {left}
        {right}
      </View>
    );
  }

  return (
    <View style={styles.row} testID="layout-two-column">
      {/* minWidth:0 lets each column shrink so long content wraps instead of overflowing the row. */}
      <View style={[styles.col, { flex: ratio }]}>{left}</View>
      <View style={[styles.col, { flex: 1 }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xl, alignItems: 'flex-start' },
  stack: { gap: spacing.lg },
  // Each column spaces its own cards (matches the Screen's content gap); on compact the stack does it.
  col: { minWidth: 0, gap: spacing.lg },
});
