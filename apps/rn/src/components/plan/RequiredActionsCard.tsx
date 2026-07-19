import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { useAppColors } from '@/hooks/use-app-colors';
import type { RequiredRow } from '@/store/planSelectors';
import type { Allocation } from '@/store/selectors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type UnfundedItem = Allocation['unfundedRequiredItems'][number];

function shortDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** The required bills + debt minimums due this paycheck — a calm checklist (the mandatory zone). */
export function RequiredActionsCard({
  rows,
  unfunded,
  onMark,
}: {
  rows: RequiredRow[];
  unfunded: UnfundedItem[];
  onMark: (row: RequiredRow, paid: boolean) => void;
}) {
  const c = useAppColors();
  const outstanding = rows.filter((r) => !r.view.isPaid).length + unfunded.length;
  const isEmpty = rows.length === 0 && unfunded.length === 0;

  return (
    <Card padded={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[textStyles.title3, { color: c.text.primary }]}>Required Actions</Text>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Bills and minimums due this paycheck.</Text>
        </View>
        {outstanding > 0 ? <Pill label={String(outstanding)} tone="neutral" /> : null}
      </View>

      {isEmpty ? (
        <View style={styles.pad}>
          <Text style={[textStyles.subhead, { color: c.accent.success }]}>You&apos;re caught up for this paycheck.</Text>
        </View>
      ) : null}

      {rows.map((row, i) => (
        <RequiredRowView
          key={`${row.item.category}-${row.item.targetId}-${i}`}
          row={row}
          onMark={onMark}
          divider={i < rows.length - 1 || unfunded.length > 0}
        />
      ))}

      {unfunded.length > 0 ? (
        <View style={[styles.unfunded, { borderTopColor: c.border.subtle }]}>
          <Text style={[textStyles.caption, styles.unfundedNote, { color: c.accent.warning }]}>
            Short this cycle — cover these from savings or your next paycheck.
          </Text>
          {unfunded.map((u, i) => (
            <View key={`unf-${i}`} style={styles.unfundedRow}>
              <Text style={[textStyles.subhead, { color: c.text.secondary, flex: 1 }]} numberOfLines={1}>
                {u.label}
              </Text>
              <Text style={[textStyles.numericBody, { color: c.accent.warning }]}>{formatCurrency(u.amount)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function RequiredRowView({
  row,
  onMark,
  divider,
}: {
  row: RequiredRow;
  onMark: (row: RequiredRow, paid: boolean) => void;
  divider: boolean;
}) {
  const c = useAppColors();
  const { view, item, isAutopay, dueDate } = row;
  const due = shortDate(dueDate);
  const showOverdue = (view.overdue && !isAutopay) || view.autopayFailed;

  let control: React.ReactNode;
  if (view.isPaid) {
    control = <Pill label="Undo" tone="paid" onPress={() => onMark(row, false)} />;
  } else if (isAutopay && view.presumedPaid && !view.autopayFailed) {
    control = <Pill label="Auto-paid" tone="paid" />;
  } else if (isAutopay && !view.autopayFailed) {
    control = <Pill label="Autopay" tone="autopay" />;
  } else {
    control = <Pill label="Mark Paid" tone="action" onPress={() => onMark(row, true)} />;
  }

  return (
    <View style={[styles.itemRow, divider && { borderBottomColor: c.border.subtle, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={styles.itemLeft}>
        <Text
          style={[textStyles.bodyMedium, { color: c.text.primary, textDecorationLine: view.isPaid ? 'line-through' : 'none' }]}
          numberOfLines={2}>
          {item.label}
        </Text>
        <View style={styles.metaRow}>
          {showOverdue ? <Pill label="Overdue" tone="overdue" /> : null}
          {due ? <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Due {due}</Text> : null}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text style={[textStyles.numericBody, { color: view.isPaid ? c.text.tertiary : c.text.primary }]}>
          {formatCurrency(item.amount)}
        </Text>
        {control}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: layout.cardPaddingH,
    paddingTop: layout.cardPaddingV,
    paddingBottom: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  pad: { paddingHorizontal: layout.cardPaddingH, paddingBottom: layout.cardPaddingV },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: spacing.md,
  },
  itemLeft: { flex: 1, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemRight: { alignItems: 'flex-end', gap: spacing.xs },
  unfunded: { paddingHorizontal: layout.cardPaddingH, paddingVertical: layout.cardPaddingV, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  unfundedNote: { fontWeight: '600' },
  unfundedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
