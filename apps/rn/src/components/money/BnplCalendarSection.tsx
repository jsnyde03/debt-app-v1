import { StyleSheet, Text, View } from 'react-native';

import { buildBnplSchedule, type BnplInstallmentEntry } from '@core/debt/bnplSchedule';
import { formatCurrency } from '@core/utils/formatCurrency';
import { parseLocalDate, toLocalISODate } from '@core/utils/localDate';

import type { Debt } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** How far ahead the calendar lists before collapsing the rest into a "+ N more" line. */
const HORIZON_MONTHS = 6;

function addMonths(iso: string, n: number): string {
  const d = parseLocalDate(iso);
  d.setMonth(d.getMonth() + n);
  return toLocalISODate(d);
}

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function monthLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

interface MonthGroup {
  key: string;
  label: string;
  entries: BnplInstallmentEntry[];
  subtotal: number;
}

function groupByMonth(entries: BnplInstallmentEntry[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const e of entries) {
    const key = e.date.slice(0, 7); // YYYY-MM
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, label: monthLabel(e.date), entries: [], subtotal: 0 };
      groups.push(g);
    }
    g.entries.push(e);
    g.subtotal += e.amount;
  }
  return groups;
}

/**
 * §2.7.5 — the consolidated BNPL calendar: "when do my BNPL installments hit?" in one place, below the
 * debt list on Money → Debts. Chronological, grouped by month with a per-month subtotal; each row names
 * the date · provider · "payment i of N" · amount. Contextual — renders nothing when there are no
 * upcoming BNPL installments. Free (it just displays the user's own plan). Calm reference surface.
 */
export function BnplCalendarSection({ debts, currentDate }: { debts: Debt[]; currentDate: string }) {
  const c = useAppColors();
  const schedule = buildBnplSchedule(debts, currentDate);
  if (schedule.length === 0) return null;

  const cutoff = addMonths(currentDate, HORIZON_MONTHS);
  const within = schedule.filter((e) => e.date < cutoff);
  const moreCount = schedule.length - within.length;
  const groups = groupByMonth(within);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={[textStyles.footnote, styles.header, { color: c.text.tertiary }]}>UPCOMING BNPL INSTALLMENTS</Text>
      {groups.map((g) => (
        <View key={g.key} style={styles.group}>
          <View style={styles.monthRow}>
            <Text style={[textStyles.caption, styles.month, { color: c.text.secondary }]}>{g.label}</Text>
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
              {formatCurrency(g.subtotal)} · {g.entries.length} {g.entries.length === 1 ? 'payment' : 'payments'}
            </Text>
          </View>
          {g.entries.map((e, i) => (
            <View key={`${e.debtId}-${e.date}-${i}`} style={styles.row}>
              <Text style={[textStyles.caption, styles.date, { color: c.text.tertiary }]}>{dayLabel(e.date)}</Text>
              <View style={styles.mid}>
                <Text style={[textStyles.subhead, { color: c.text.primary }]} numberOfLines={1}>{e.provider}</Text>
                {e.totalPayments > 0 ? (
                  <Text style={[textStyles.caption, { color: c.text.tertiary }]}>payment {e.paymentNumber} of {e.totalPayments}</Text>
                ) : null}
              </View>
              <Text style={[textStyles.subhead, styles.amt, { color: c.text.primary }]}>{formatCurrency(e.amount)}</Text>
            </View>
          ))}
        </View>
      ))}
      {moreCount > 0 ? (
        <Text style={[textStyles.caption, styles.more, { color: c.text.tertiary }]}>
          + {moreCount} more {moreCount === 1 ? 'installment' : 'installments'} beyond {HORIZON_MONTHS} months
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl, gap: spacing.md },
  header: { letterSpacing: 0.8 },
  group: { gap: spacing.sm },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  month: { fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  date: { width: 52, fontVariant: ['tabular-nums'] },
  mid: { flex: 1, gap: 1 },
  amt: { fontVariant: ['tabular-nums'] },
  more: { marginTop: spacing.xs },
});
