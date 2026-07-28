import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Recurrence } from '@core/types/recurrence';
import { formatCurrency } from '@core/utils/formatCurrency';

import { SheetScrim } from '@/components/ui/SheetScrim';
import { useAppColors } from '@/hooks/use-app-colors';
import { layout, spacing } from '@/theme/spacing';
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
 * check). Read-only; the actual current-cycle payments live on Today.
 */
export function BillBreakdownSheet({ visible, onClose, data }: { visible: boolean; onClose: () => void; data: BillBreakdownData }) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <SheetScrim />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: c.background.primary, paddingBottom: insets.bottom + spacing.base }]}>
          <View style={styles.header}>
            <Text style={[textStyles.title2, { color: c.text.primary }]}>Where it goes</Text>
            <Pressable onPress={onClose} accessibilityRole="button">
              <Text style={[textStyles.subhead, { color: c.text.secondary }]}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.echo}>
            <Text style={[styles.echoNum, { color: c.text.primary }]}>{formatWhole(data.perPaycheckTotal)}</Text>
            <Text style={[textStyles.subhead, { color: c.text.tertiary }]}>
              reserved per paycheck{data.perCycleEqualsMonth ? '' : ` · ≈ ${formatWhole(data.monthlyTotal)}/mo`}
            </Text>
          </View>
          <Text style={[textStyles.caption, styles.explain, { color: c.text.tertiary }]}>
            Every bill spread evenly across your paychecks — so the lumpy ones never land as a surprise.
          </Text>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {data.categories.map((cat) => (
              <View key={cat.key} style={styles.group}>
                <View style={styles.groupHead}>
                  <Text style={[textStyles.footnote, styles.groupLabel, { color: c.text.secondary }]}>{cat.label}</Text>
                  <View style={styles.flex} />
                  <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{formatCurrency(cat.perPaycheck)}/paycheck</Text>
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
                      <Text style={[textStyles.numericBody, { color: lumpy ? c.accent.primary : c.text.secondary }]}>
                        {formatCurrency(b.perPaycheck)}
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
                  Plus {formatCurrency(data.oneTimeTotal)} in {data.oneTimeCount} one-time {data.oneTimeCount === 1 ? 'bill' : 'bills'} — not part of your ongoing reserve.
                </Text>
              </View>
            ) : null}
          </ScrollView>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  echo: { gap: 2 },
  echoNum: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  explain: {},
  scroll: { flexGrow: 0 },
  scrollContent: { gap: spacing.lg, paddingVertical: spacing.xs },
  group: { gap: spacing.sm },
  groupHead: { flexDirection: 'row', alignItems: 'center' },
  groupLabel: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  oneTime: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
});
