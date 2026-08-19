import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { useAppColors } from '@/hooks/use-app-colors';
import { selectDebtAmortization } from '@/store/analysisSelectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** How many schedule rows mount before the reader asks for the rest — one year, read from the top. */
const INITIAL_ROWS = 12;

/** startDate + N months → "Aug 2026" (the month a schedule row lands in). */
function monthLabel(startISO: string, months: number): string {
  const d = new Date(`${startISO}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * A single debt's month-by-month payoff schedule — the CONTENT only, with no presentation chrome, so
 * the two surfaces that show it share one implementation (3.7.A0):
 *   - `app/schedule/[id].tsx` — the pushed route (compact / iPhone / web)
 *   - the iPad Money master-detail DETAIL PANE (a push would cover the split)
 *
 * It used to live inside a sheet launched from the debt EDIT sheet, which is the bug this replaces: a
 * sheet-from-a-sheet meant either a nested Modal (never presented on iOS) or an absolute overlay
 * rendered as a SIBLING of the presented Modal (so it sat behind it). Rendering plain content into a
 * route/pane removes that whole failure class rather than working around it.
 *
 * Shows the debt-free date + total interest, the payment it assumes (minimum, plus the recommended
 * extra when this is the focus debt), then each month's interest / principal / ending balance. Handles
 * the negative-amortization case (a payment that can't cover interest never pays off).
 */
export function AmortizationView({ debtId }: { debtId: string | null }) {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const amort = debtId ? selectDebtAmortization(store, debtId) : null;
  const [showAll, setShowAll] = useState(false);

  const schedule = amort?.schedule;
  const payoffPossible = schedule?.payoffPossible ?? false;
  const allRows = schedule?.rows ?? [];
  const visibleRows = showAll ? allRows : allRows.slice(0, INITIAL_ROWS);
  const hiddenCount = allRows.length - visibleRows.length;

  if (!amort || !schedule) {
    return <Text style={[textStyles.body, styles.empty, { color: c.text.tertiary }]}>No schedule to show.</Text>;
  }

  return (
    <View style={styles.root}>
      {/* The debt's name leads — the route's header says "Payoff schedule", so this answers "whose?". */}
      <Text style={[textStyles.subhead, { color: c.text.secondary }]} numberOfLines={1}>
        {amort.debt.name}
      </Text>

      {!payoffPossible ? (
        <Text style={[textStyles.body, styles.empty, { color: c.text.secondary }]}>
          At {formatCurrency(amort.monthlyPayment)}/mo the interest outpaces the balance, so this debt never gets
          paid off. Increasing the payment fixes it.
        </Text>
      ) : (
        <>
          <View style={styles.echo}>
            <Text style={[styles.echoNum, { color: c.text.primary }]}>{monthLabel(amort.startDate, schedule.monthsToPayoff)}</Text>
            <Text style={[textStyles.subhead, { color: c.text.tertiary }]}>
              debt-free · {schedule.monthsToPayoff} {schedule.monthsToPayoff <= 1 ? 'month' : 'months'} ·{' '}
              {formatCurrency(schedule.totalInterest)} interest
            </Text>
          </View>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
            {/* ⛔ [L3-4] The gate is `monthlyExtra > 0`, NOT `isFocus`. `isFocus` only says this debt is
                first in payoff order — a plan with nothing spare after bills and the cushion floor sends
                extra of $0, and this line then claimed "your extra" over a payment that is exactly the
                minimum, on the one screen whose job is to say what the payment is made of. */}
            Paying {formatCurrency(amort.monthlyPayment)}/mo
            {amort.monthlyExtra > 0 ? ' — minimum + your extra' : ' — the minimum'}
          </Text>

          <View style={[styles.colHead, { borderBottomColor: c.border.subtle }]}>
            <Text style={[textStyles.caption, styles.colMonth, { color: c.text.tertiary }]}>MONTH</Text>
            <Text style={[textStyles.caption, styles.colVal, { color: c.text.tertiary }]}>BALANCE</Text>
          </View>
          {/* No inner ScrollView: both hosts (the route's Screen, the iPad pane) already scroll, and
              nesting same-axis scrollers strands rows mid-list on device.
              ⛔ T3B (audit L5-4) — but that left every row mounting at once, and `MAX_MONTHS = 600`: a
              30-year mortgage is 360–600 rows × 4 `Text` nodes, built synchronously during the push
              transition. Virtualizing is not available (it needs the scroller this deliberately does not
              own), so the fix is to mount fewer: the first year, then on request the rest. A schedule is
              read from the top — nobody scans month 287 first — so this costs the common reader nothing.
              ⚠️ NOT a `FlatList` via render-prop: that would hand the host a scroller and re-open the
              nesting defect the comment above records. */}
          {visibleRows.map((row) => (
            <View key={row.month} style={styles.row}>
              <View style={styles.flex}>
                <Text style={[textStyles.body, { color: c.text.primary }]}>{monthLabel(amort.startDate, row.month)}</Text>
                <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                  {formatCurrency(row.interest)} interest · {formatCurrency(row.principal)} principal
                </Text>
              </View>
              <Text style={[textStyles.numericBody, styles.rowVal, { color: c.text.secondary }]}>{formatCurrency(row.endingBalance)}</Text>
            </View>
          ))}
          {hiddenCount > 0 ? (
            <Pressable
              onPress={() => setShowAll(true)}
              accessibilityRole="button"
              accessibilityLabel={`Show all ${schedule.rows.length} months`}
              testID="amortization-show-all"
              style={styles.showAll}>
              <Text style={[textStyles.subhead, { color: c.accent.primary }]}>
                Show all {schedule.rows.length} months
              </Text>
              <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                {hiddenCount} more {hiddenCount === 1 ? 'month' : 'months'} to {monthLabel(amort.startDate, schedule.monthsToPayoff)}
              </Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

/**
 * The iPad detail-pane host: the pane doesn't scroll on its own, so the view brings its own scroller.
 * It also carries its own heading — the route gets one free from `Screen`, but the pane would otherwise
 * open straight into "{debt} / {date}" with nothing naming the surface (caught in the 3.7.A0 visual pass).
 */
export function AmortizationPane({ debtId }: { debtId: string | null }) {
  const c = useAppColors();
  return (
    <ScrollView contentContainerStyle={styles.paneContent} showsVerticalScrollIndicator={false}>
      <Text style={[textStyles.title2, { color: c.text.primary }]}>Payoff schedule</Text>
      <AmortizationView debtId={debtId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  flex: { flex: 1 },
  showAll: { paddingVertical: spacing.base, gap: 2 },
  empty: { paddingVertical: spacing.lg },
  echo: { gap: 2 },
  echoNum: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  colHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colMonth: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  colVal: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', textAlign: 'right' },
  rowVal: { textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, paddingVertical: spacing.sm },
  paneContent: { padding: spacing.base, gap: spacing.sm },
});
