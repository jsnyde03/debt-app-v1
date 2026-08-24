import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { Recurrence } from '@core/types/recurrence';
import { formatCurrency } from '@core/utils/formatCurrency';

import { AnimatedSheet } from '@/components/ui/AnimatedSheet';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { formatWhole } from '@/utils/format';

export interface BreakdownBill {
  id: string;
  name: string;
  recurrence: Recurrence;
  amount: number;
  perPaycheck: number;
}
export interface BreakdownCategory {
  key: string;
  label: string;
  perPaycheck: number;
  bills: BreakdownBill[];
}
export interface BillBreakdownData {
  perPaycheckTotal: number;
  monthlyTotal: number;
  perCycleEqualsMonth: boolean;
  categories: BreakdownCategory[]; // recurring only, sorted largest → smallest
  oneTimeTotal: number;
  oneTimeCount: number;
}

const CADENCE: Record<Recurrence, string> = {
  'one-time': 'one-time',
  monthly: 'monthly',
  weekly: 'weekly',
  biweekly: 'every 2 weeks',
  'per-paycheck': 'every paycheck',
  quarterly: 'quarterly',
  annually: 'yearly',
};

/**
 * The "where it goes" receipt — opened from the Bills hero. Itemizes each recurring bill's smoothed
 * per-paycheck contribution so the abstract set-aside number shows its work. Lumpy (non-monthly)
 * bills get their per-check share tinted — that's the insight (a $1,680/yr bill is quietly $65 a
 * check). Read-only. Presented in the shared premium `AnimatedSheet` (3.4.5.7).
 */
export function BillBreakdownSheet({ visible, onClose, data }: { visible: boolean; onClose: () => void; data: BillBreakdownData }) {
  const c = useAppColors();
  return (
    <AnimatedSheet visible={visible} onClose={onClose} title="Where it goes">
      <View style={styles.echo}>
        <Text maxFontSizeMultiplier={1.3} style={[styles.echoNum, { color: c.text.primary }]}>{formatWhole(data.perPaycheckTotal)}</Text>
        {/* 3.8.4 — "recommended", not "reserved". This sheet's headline is the SMOOTHED LOAD, which is the
            right source here (the receipt explains the advice), but it carried the same false verb as the
            hero: nothing reserved it. The hero now shows what actually is reserved; this states the advice. */}
        <Text style={[textStyles.subhead, { color: c.text.tertiary }]}>
          recommended per paycheck{data.perCycleEqualsMonth ? '' : ` · ≈ ${formatWhole(data.monthlyTotal)}/mo`}
        </Text>
      </View>
      <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
        {/* ⛔ [L1-18] "never land as a surprise" — the app models `variable` bills itself ("Variable
            amount (estimate)"), so a bill higher than the typed estimate can still surprise. Smoothing
            makes that far less likely; it cannot make it impossible. */}
        Every bill spread evenly across your paychecks — so the lumpy ones are far less likely to land as a surprise.
      </Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {data.categories.map((cat) => (
          <View key={cat.key} style={styles.group}>
            <View style={styles.groupHead}>
              <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.secondary }]}>{cat.label}</Text>
              <View style={styles.flex} />
              {/* ⛔ [T6.5 · L4-3/L4-4] `formatWhole`. These category subtotals ARE the addends of this
                  sheet's own headline (`formatWhole(perPaycheckTotal)`), and smoothed figures are almost
                  never whole — so the sheet whose entire job is "shows its work" showed
                  `$210.44 · $65.13 · $18.09` under `$294`. L4-4 is the same figure again: `money.tsx`'s
                  section header renders the byte-identical expression as `formatWhole`, one tap away.
                  ⚠️ This does NOT make the column sum exactly — rounded addends can differ from the
                  rounded total by up to $0.50 each. That residual is L4-10's class, which the audit
                  itself closed as "no fix needed"; what is fixed here is one tier reading two ways. */}
              <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{formatWhole(cat.perPaycheck)}/paycheck</Text>
            </View>
            {cat.bills.map((b) => {
              const lumpy = b.recurrence !== 'monthly' && b.recurrence !== 'per-paycheck';
              return (
                <View key={b.id} style={styles.row}>
                  <View style={styles.flex}>
                    <Text style={[textStyles.body, { color: c.text.primary }]} numberOfLines={1}>{b.name}</Text>
                    <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
                      {formatCurrency(b.amount)} · {CADENCE[b.recurrence]}
                    </Text>
                  </View>
                  {/* [T6.5 · L4-3] The per-bill smoothed share is an addend of the same headline, so it
                      matches the category subtotals above. ⚠️ The line ABOVE keeps `formatCurrency(b.amount)`
                      deliberately — that is the real bill the user typed and the biller charges, a
                      different quantity from its smoothed per-paycheck share. */}
                  <Text style={[textStyles.numericBody, { color: lumpy ? c.accent.primary : c.text.secondary }]}>
                    {formatWhole(b.perPaycheck)}
                    <Text style={[textStyles.caption, { color: c.text.tertiary }]}>/paycheck</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {data.oneTimeCount > 0 ? (
          <View style={[styles.oneTime, { borderColor: c.border.subtle }]}>
            <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
              {/* [T6.5 · L4-5] `formatWhole` — a summary sentence, not a ledger row, and `money.tsx`
                  renders this same `oneTimeTotal` variable as `formatWhole` in two places one tap away. */}
              Plus {formatWhole(data.oneTimeTotal)} in {data.oneTimeCount} one-time {data.oneTimeCount === 1 ? 'expense' : 'expenses'} — not part of your ongoing reserve.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </AnimatedSheet>
  );
}

const styles = StyleSheet.create({
  echo: { gap: 2 },
  echoNum: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: spacing.lg, paddingVertical: spacing.xs },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center' },
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  oneTime: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
});
