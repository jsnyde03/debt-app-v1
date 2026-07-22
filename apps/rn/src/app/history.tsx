import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { Screen } from '@/components/screen';
import { AppIcon } from '@/components/ui/AppIcon';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { selectHistoryRows, selectHistorySummary, type HistoryRow } from '@/store/historySelectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

function formatCycleDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Pay Cycle History — a pushed sub-view off the More hub (B.8; standalone top row). Faithful rebuild
 * of the Capacitor `HistorySection`: each finished cycle shows its ending balance, amount paid, and
 * the debt change vs the prior cycle. Ships unlocked; the premium lock + Premium+ full-history upsell
 * wire in at Phase C with the revenue spine.
 */
export default function HistoryScreen() {
  const c = useAppColors();
  // Select the stable store ref, derive rows in render — computing inside the selector returns a
  // fresh array each call and trips useSyncExternalStore's infinite-loop guard.
  const store = useAppStore((s) => s.store);
  const rows = selectHistoryRows(store);
  const summary = selectHistorySummary(store);

  return (
    <Screen title="Pay Cycle History" onBack={() => router.back()}>
      {summary.paidDown > 0 ? (
        <View style={styles.anchor}>
          <Text style={[styles.anchorNum, { color: c.accent.success }]}>{formatWhole(summary.paidDown)}</Text>
          <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
            paid down across {summary.cycleCount} cycles
          </Text>
        </View>
      ) : (
        <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
          See how far you&apos;ve come, one cycle at a time.
        </Text>
      )}

      {rows.length === 0 ? <EmptyHistory /> : rows.map((row) => <HistoryRowCard key={row.key} row={row} />)}
    </Screen>
  );
}

function EmptyHistory() {
  const c = useAppColors();
  return (
    <Card style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: c.background.tertiary }]}>
        <AppIcon name="history" size={28} color={c.accent.primary} />
      </View>
      <Text style={[textStyles.subhead, styles.center, { color: c.text.secondary }]}>
        No finished cycles yet. When you start your next pay cycle, that completed cycle shows up here.
      </Text>
    </Card>
  );
}

function HistoryRowCard({ row }: { row: HistoryRow }) {
  const c = useAppColors();
  const reduced = row.debtDelta < 0;
  const increased = row.debtDelta > 0;
  const deltaColor = reduced ? c.accent.success : c.accent.danger;

  return (
    <Card style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={[textStyles.bodyMedium, { color: c.text.primary }]}>{formatCycleDate(row.endDate)}</Text>
        <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{formatCurrency(row.totalDebtBalance)}</Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{formatCurrency(row.totalPaidThisCycle)} paid</Text>
        {reduced || increased ? (
          <View style={styles.delta}>
            <AppIcon name={reduced ? 'trending-down' : 'trending-up'} size={14} color={deltaColor} />
            <Text style={[textStyles.caption, styles.deltaText, { color: deltaColor }]}>
              {formatCurrency(Math.abs(row.debtDelta))}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  anchor: { gap: 1, marginBottom: spacing.xs },
  anchorNum: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  empty: { alignItems: 'center', gap: spacing.sm },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  row: { gap: spacing.xs },
  rowMain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rowMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  delta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  deltaText: { fontWeight: '600' },
});
