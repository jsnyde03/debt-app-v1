import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '@core/utils/formatCurrency';

import { SheetScrim } from '@/components/ui/SheetScrim';
import { useAppColors } from '@/hooks/use-app-colors';
import { selectDebtAmortization } from '@/store/analysisSelectors';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** startDate + N months → "Aug 2026" (the month a schedule row lands in). */
function monthLabel(startISO: string, months: number): string {
  const d = new Date(`${startISO}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * A single debt's month-by-month payoff schedule — a read-only drill-in from the debt sheet. Shows
 * the debt-free date + total interest, the payment it assumes (minimum, plus the recommended extra
 * when this is the focus debt), then each month's interest / principal / ending balance. Handles the
 * negative-amortization case (a payment that can't cover interest never pays off).
 */
export function AmortizationSheet({
  visible,
  debtId,
  onClose,
}: {
  visible: boolean;
  debtId: string | null;
  onClose: () => void;
}) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  const store = useAppStore((s) => s.store);
  const amort = visible && debtId ? selectDebtAmortization(store, debtId) : null;

  const schedule = amort?.schedule;
  const payoffPossible = schedule?.payoffPossible ?? false;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SheetScrim />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: c.background.primary, paddingBottom: insets.bottom + spacing.base }]}>
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={[textStyles.title2, { color: c.text.primary }]}>Payoff schedule</Text>
              {amort ? <Text style={[textStyles.subhead, { color: c.text.tertiary }]}>{amort.debt.name}</Text> : null}
            </View>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Close</Text>
            </Pressable>
          </View>

          {!amort || !schedule ? (
            <Text style={[textStyles.body, styles.empty, { color: c.text.tertiary }]}>
              No schedule to show.
            </Text>
          ) : !payoffPossible ? (
            <Text style={[textStyles.body, styles.empty, { color: c.text.secondary }]}>
              At {formatCurrency(amort.monthlyPayment)}/mo the interest outpaces the balance, so this debt never
              gets paid off. Increasing the payment fixes it.
            </Text>
          ) : (
            <>
              <View style={styles.echo}>
                <Text style={[styles.echoNum, { color: c.text.primary }]}>
                  {monthLabel(amort.startDate, schedule.monthsToPayoff)}
                </Text>
                <Text style={[textStyles.subhead, { color: c.text.tertiary }]}>
                  debt-free · {schedule.monthsToPayoff} {schedule.monthsToPayoff <= 1 ? 'month' : 'months'} ·{' '}
                  {formatCurrency(schedule.totalInterest)} interest
                </Text>
              </View>
              <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                Paying {formatCurrency(amort.monthlyPayment)}/mo{amort.isFocus ? ' — minimum + your extra' : ' — the minimum'}
              </Text>

              <View style={[styles.colHead, { borderBottomColor: c.border.subtle }]}>
                <Text style={[textStyles.caption, styles.colMonth, { color: c.text.tertiary }]}>MONTH</Text>
                <Text style={[textStyles.caption, styles.colVal, { color: c.text.tertiary }]}>BALANCE</Text>
              </View>
              <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                {schedule.rows.map((row) => (
                  <View key={row.month} style={styles.row}>
                    <View style={styles.flex}>
                      <Text style={[textStyles.body, { color: c.text.primary }]}>{monthLabel(amort.startDate, row.month)}</Text>
                      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                        {formatCurrency(row.interest)} interest · {formatCurrency(row.principal)} principal
                      </Text>
                    </View>
                    <Text style={[textStyles.numericBody, styles.rowVal, { color: c.text.secondary }]}>
                      {formatCurrency(row.endingBalance)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' }, // dim now from <SheetScrim /> (frosted)
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: layout.cardRadiusLarge,
    borderTopRightRadius: layout.cardRadiusLarge,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  flex: { flex: 1 },
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
  scroll: { flexGrow: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
});
