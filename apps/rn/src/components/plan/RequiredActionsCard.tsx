import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { CheckCircle } from '@/components/ui/CheckCircle';
import { Pill } from '@/components/ui/Pill';
import { useAppColors } from '@/hooks/use-app-colors';
import {
  bucketRequiredRows,
  requiredRowKey,
  rowHandledNow,
  type RequiredBucket,
  type RequiredRow,
} from '@/store/planSelectors';
import type { Allocation } from '@/store/selectors';
import { formatWhole } from '@/utils/format';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

type UnfundedItem = Allocation['unfundedRequiredItems'][number];

const COLLAPSIBLE = new Set<RequiredBucket['key']>(['nextWeek', 'later', 'handled']);

function shortDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The required bills + debt minimums due this paycheck — a calm checklist (the mandatory zone).
 * At scale it groups into urgency buckets (Overdue + This week open; later-in-cycle + Handled
 * collapsed) so a long cycle never becomes a wall. Marking paid strikes a row through in place and
 * it settles into Handled on the next visit — it never vanishes on tap (1.5.4).
 */
export function RequiredActionsCard({
  rows,
  unfunded,
  onMark,
  currentDate,
}: {
  rows: RequiredRow[];
  unfunded: UnfundedItem[];
  onMark: (row: RequiredRow, paid: boolean) => void;
  currentDate: string;
}) {
  const c = useAppColors();
  const [paidThisVisit, setPaidThisVisit] = useState<Set<string>>(() => new Set());
  const [userToggled, setUserToggled] = useState<Set<string>>(() => new Set());

  // Re-entry tidy-up: on each focus, clear the "pinned in place" set so items paid last visit
  // settle into Handled (and re-open the buckets to their defaults).
  useFocusEffect(
    useCallback(() => {
      setPaidThisVisit(new Set());
      setUserToggled(new Set());
    }, []),
  );

  const buckets = bucketRequiredRows(rows, currentDate, paidThisVisit);
  const outstanding = rows.filter((r) => !rowHandledNow(r)).length + unfunded.length;
  const flat = buckets.length === 1 && buckets[0].key === 'thisWeek';

  const handleMark = (row: RequiredRow, paid: boolean) => {
    const key = requiredRowKey(row);
    setPaidThisVisit((prev) => {
      const n = new Set(prev);
      if (paid) n.add(key);
      else n.delete(key);
      return n;
    });
    onMark(row, paid);
  };
  const toggleBucket = (key: string) =>
    setUserToggled((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  const isOpen = (b: RequiredBucket) => (b.defaultOpen ? !userToggled.has(b.key) : userToggled.has(b.key));

  return (
    <Card padded={false}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <View style={[styles.tagDot, { backgroundColor: c.accent.success }]} />
            <Text style={[textStyles.title3, { color: c.text.primary }]}>Required Actions</Text>
          </View>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Bills and minimums due this paycheck.</Text>
        </View>
        {outstanding > 0 ? <Pill label={String(outstanding)} tone="neutral" /> : null}
      </View>

      {outstanding === 0 ? (
        <View style={styles.pad}>
          <Text style={[textStyles.subhead, { color: c.accent.success }]}>You&apos;re caught up for this paycheck.</Text>
        </View>
      ) : null}

      {buckets.map((b) => (
        <BucketBlock
          key={b.key}
          bucket={b}
          flat={flat}
          collapsible={COLLAPSIBLE.has(b.key)}
          open={isOpen(b)}
          onToggle={() => toggleBucket(b.key)}
          onMark={handleMark}
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

function BucketBlock({
  bucket,
  flat,
  collapsible,
  open,
  onToggle,
  onMark,
}: {
  bucket: RequiredBucket;
  flat: boolean;
  collapsible: boolean;
  open: boolean;
  onToggle: () => void;
  onMark: (row: RequiredRow, paid: boolean) => void;
}) {
  const c = useAppColors();
  const titleColor = bucket.key === 'overdue' ? c.accent.danger : bucket.key === 'handled' ? c.text.tertiary : c.text.secondary;
  const rows = collapsible && !open ? [] : bucket.rows;

  return (
    <View>
      {!flat ? (
        <Pressable
          onPress={collapsible ? onToggle : undefined}
          disabled={!collapsible}
          accessibilityRole={collapsible ? 'button' : 'header'}
          accessibilityState={collapsible ? { expanded: open } : undefined}
          accessibilityLabel={`${bucket.title}, ${bucket.rows.length} ${bucket.rows.length === 1 ? 'item' : 'items'}, ${formatWhole(bucket.total)}`}
          style={styles.bucketHeader}>
          {collapsible ? (
            <AppIcon name={open ? 'expand-more' : 'chevron-right'} size={20} color={c.text.tertiary} />
          ) : null}
          <Text style={[textStyles.footnote, styles.bucketLabel, { color: titleColor }]}>{bucket.title}</Text>
          <View style={[styles.bucketCount, { backgroundColor: c.background.tertiary }]}>
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{bucket.rows.length}</Text>
          </View>
          <View style={styles.flex} />
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{formatWhole(bucket.total)}</Text>
        </Pressable>
      ) : null}
      {rows.map((row, i) => (
        <RequiredRowView
          key={`${row.item.category}-${row.item.targetId}-${i}`}
          row={row}
          onMark={onMark}
          divider={i < rows.length - 1}
        />
      ))}
    </View>
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
  if (isAutopay && view.presumedPaid && !view.autopayFailed) {
    control = <Pill label="Auto-paid" tone="paid" />;
  } else if (isAutopay && !view.autopayFailed) {
    control = <Pill label="Autopay" tone="autopay" />;
  } else {
    control = <CheckCircle checked={view.isPaid} onPress={() => onMark(row, !view.isPaid)} label={`Mark ${item.label} paid`} />;
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  pad: { paddingHorizontal: layout.cardPaddingH, paddingBottom: layout.cardPaddingV },
  flex: { flex: 1 },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: spacing.sm,
  },
  bucketLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  bucketCount: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, alignItems: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: spacing.md,
  },
  itemLeft: { flex: 1, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  unfunded: { paddingHorizontal: layout.cardPaddingH, paddingVertical: layout.cardPaddingV, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
  unfundedNote: { fontWeight: '600' },
  unfundedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
