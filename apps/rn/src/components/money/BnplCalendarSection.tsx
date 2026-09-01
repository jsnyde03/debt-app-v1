import { StyleSheet, Text, View } from 'react-native';
import { getNextPaycheckDate } from '@core/payCycle/getNextPaycheckDate';

import { BNPL_COUNT_FIELDS } from '@core/debt/bnplInstallment';
import { buildBnplSchedule, type BnplInstallmentEntry } from '@core/debt/bnplSchedule';
import { addMonthsISO } from '@core/utils/addMonths';
import { formatCurrency } from '@core/utils/formatCurrency';

import type { Debt } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import { unreadRowCaption } from '@/components/plan/dataRepairsCopy';
import { rowFieldUnread, unreadFieldsFor } from '@/store/trustSelectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** How far ahead the calendar lists before collapsing the rest into a "+ N more" line. */
const HORIZON_MONTHS = 6;

// ⛔ Clamped. The horizon cutoff is compared against installment dates, so an overflow on a 29th–31st
// cycle date pulls installments a whole month beyond the stated horizon into the list.
const addMonths = addMonthsISO;

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** ⛔ [C-6] The provider, matching how the debt row names a BNPL plan; the debt name is the fallback. */
function planName(d: Debt): string {
  return d.bnplProvider || d.name;
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
  /**
   * ⛔ **A SHORT LIST PRESENTED AS A WHOLE ONE.** [S1.10.6.2 · pass-3 C-6]
   *
   * ⚡ A repaired `scheduledPaymentAmount` is `0`, which makes `isInstallmentNative` false, which takes the
   * plan out of `buildBnplSchedule`'s installment expansion — it degrades to a single next-due-date row.
   * Measured: *"January · **$78.86 · 1 payment**"* for a plan charging **$315.44 across four dates** inside
   * the same horizon, with no *"+ N more"* line and no caption. ⛔ **Nothing here is arithmetically false;
   * the COMPLETENESS is**, which is why this was rated a major and still cannot be left standing.
   *
   * ⚠️ `money.tsx`'s debt row degrades gracefully on the identical input — it drops to *"$315.44 ·
   * interest-free"* because `bnplPaymentsTotal` returns `null`. This surface substituted a confident,
   * complete-looking schedule instead. It now names the plans it could not read and lists the rest.
   */
  // ⛔ **SUBSCRIBE TO THE STORE, THEN DERIVE — never derive INSIDE the selector.** The first cut of this
  // line was `useAppStore((s) => debts.filter(…))`, which returns a fresh ARRAY on every call, so
  // `useSyncExternalStore` re-rendered forever and **the whole Money tab rendered blank** (React #185).
  // `money.tsx:614` already carries this warning verbatim about `selectRecurringSmoothed`; I wrote the
  // defect it describes, in the same folder, and the e2e caught it on the first run.
  const store = useAppStore((s) => s.store);
  /**
   * ⛔ **S1.11.4.4 [pass-4 blocker `C4-1`] — THE FILTER WAS ONE FIELD SHORT, WHICH IS `C-6`'s OPEN HALF.**
   * It named `scheduledPaymentAmount` alone, so a plan whose `originalBalance` was the recorded loss
   * passed straight through and the calendar printed *"payment 1 of 2"* / *"payment 2 of 2"* for what are
   * truly payments 3 and 4 of 4. ⚠️ The list is `BNPL_COUNT_FIELDS`, owned by the producer that derives
   * the count — an enumeration typed at a reader is how this one went short.
   */
  const unreadPlans = debts.filter((d) => rowFieldUnread(store, 'row-figures', 'debt', d.id, ...BNPL_COUNT_FIELDS));
  // ⛔ S1.13.7.7 [pass-6 A2-3] — a `per-paycheck` plan charges on PAYDAYS, a fact only the store holds.
  // Without it the calendar drew one installment of four and captioned it "payment 1 of 4".
  const schedule = buildBnplSchedule(debts, currentDate, (afterISO) =>
    getNextPaycheckDate({
      payCycle: store.paycheck.payCycle,
      currentDate: afterISO,
      semiMonthlyFirstDay: Number(store.paycheck.semiMonthlyFirstDay),
      semiMonthlySecondDay: Number(store.paycheck.semiMonthlySecondDay),
      monthlyPayDay: Number(store.paycheck.monthlyPayDay),
    }),
  );
  if (schedule.length === 0 && unreadPlans.length === 0) return null;

  const cutoff = addMonths(currentDate, HORIZON_MONTHS);
  // ⛔ [C-6] An unread plan's ONE degraded row is dropped rather than listed. Leaving it in is what made
  // the month subtotal read as the month's whole BNPL load while missing three quarters of the money —
  // and the row itself carries no honest way to say "three more of these exist".
  const unreadIds = new Set(unreadPlans.map((d) => d.id));
  const listed = schedule.filter((e) => !unreadIds.has(e.debtId));
  const within = listed.filter((e) => e.date < cutoff);
  const moreCount = listed.length - within.length;
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
      {/* ⛔ [C-6] The honest state, said by NAME — the list is short and the user is told which plan is
          missing from it, rather than the shortfall being invisible.
          ⛔ **S1.11.4.4 [pass-4 `C4-1`] — AND IT NAMES THE FIELD THAT WAS ACTUALLY LOST.** The copy said
          *"the payment amount could not be read"* unconditionally, which was true while the filter asked
          about one field and became **a second false statement** the moment it asked about three: a plan
          dropped for an unreadable `originalBalance` was told its payment amount was the problem, and the
          user would go and re-enter a figure that was never missing. ⚠️ Asked of `unreadRowCaption`, the
          one owner of *"which field, in words"*, rather than a third hand-written spelling. */}
      {unreadPlans.length > 0 ? (
        <Text style={[textStyles.caption, styles.more, { color: c.accent.warning }]}>
          {unreadPlans.length === 1
            ? `${planName(unreadPlans[0])} — ${lower(unreadRowCaption(unreadFieldsFor(store, 'debt', unreadPlans[0].id)) ?? 'a figure could not be read')}, so its installments are not listed. Set it again to see them.`
            : `${unreadPlans.map(planName).join(', ')} — figures these plans are built from could not be read, so those installments are not listed. Set them again to see them.`}
        </Text>
      ) : null}
    </View>
  );
}

/** `unreadRowCaption` returns a sentence-cased clause; here it lands mid-sentence after an em dash. */
function lower(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
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
