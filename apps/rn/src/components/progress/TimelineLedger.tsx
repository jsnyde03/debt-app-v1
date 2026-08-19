import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { useAppColors } from '@/hooks/use-app-colors';
import type { TimelineCycle, TimelineItem } from '@/store/payoffSelectors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { a11yExpanded } from '@/utils/a11y';
import { formatWhole } from '@/utils/format';

const LOW_CASH = 100; // running balance below this reads as a squeeze (Capacitor parity)

const ROW_ICON: Record<TimelineItem['type'], IconGlyph> = {
  paycheck: 'payments',
  living_reserve: 'shopping-cart',
  expense: 'receipt-long',
  autopay_expense: 'autorenew',
  minimum_debt: 'credit-card',
  autopay_debt: 'credit-card',
  emergency: 'health-and-safety',
  snowball: 'bolt',
  optional_goal: 'flag',
  buffer: 'lock',
};

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The per-cycle "where every dollar went" ledger — the Capacitor Timeline reborn in the RN system.
 * Every dollar of the paycheck, in order (income → living reserve → bills → minimums → buffer →
 * extras) with a running cash balance down the right edge (red when it dips under $100). Cycles are
 * collapsible; this cycle opens by default. View-only over `selectCashTimeline`'s `items[]`.
 */
export function TimelineLedger({ cycles }: { cycles: TimelineCycle[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });
  if (cycles.length === 0) return null;
  return (
    <View style={styles.list}>
      {cycles.map((cy, i) => (
        <CycleGroup
          key={cy.cycleStart}
          cycle={cy}
          isFirst={i === 0}
          open={open[i] ?? false}
          onToggle={() => setOpen((o) => ({ ...o, [i]: !(o[i] ?? false) }))}
        />
      ))}
    </View>
  );
}

function CycleGroup({
  cycle,
  isFirst,
  open,
  onToggle,
}: {
  cycle: TimelineCycle;
  isFirst: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const c = useAppColors();
  const tone = { stable: c.accent.success, tight: c.accent.warning, pressure: c.accent.danger }[cycle.cushionStatus];
  const title = isFirst && !cycle.isProjected ? 'This cycle' : cycle.isProjected ? 'Projected' : 'Cycle';
  return (
    <View style={[styles.group, { borderColor: c.border.subtle }]}>
      <Pressable
        style={styles.groupHead}
        accessibilityRole="button"
        {...a11yExpanded(open)}
        accessibilityLabel={`${title}, ${shortDate(cycle.cycleStart)} to ${shortDate(cycle.cycleEnd)}, ends ${formatWhole(cycle.endingBalance)}`}
        onPress={onToggle}>
        <View style={styles.flex}>
          <Text style={[textStyles.footnote, styles.groupTitle, { color: c.text.secondary }]}>{title}</Text>
          <Text style={[textStyles.caption, { color: c.text.tertiary }]}>
            {shortDate(cycle.cycleStart)} – {shortDate(cycle.cycleEnd)}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: c.background.tertiary }]}>
          {/* ⛔ [T6.7 · L4-7] `formatWhole`. This chip is a CYCLE SUMMARY — the same tier as the Cushion
              lens's per-bar figure that the SegmentedToggle flips away from — so rendering it to the cent
              made one toggle change the precision of a figure the user had just read, inside a card whose
              own docstring says "same data, user picks the view". The item ROWS below stay
              `formatCurrency`: they are the ledger, and that is the rule, not an exception to it.
              ⚠️ `net` and `endingBalance` are genuinely different fields (one clamped, one not), so this
              is a tier fix, not a claim that the two lenses show the same number. */}
          <Text style={[textStyles.caption, styles.chipText, { color: tone }]}>{formatWhole(cycle.endingBalance)}</Text>
        </View>
        <AppIcon name={open ? 'expand-less' : 'expand-more'} size={20} color={c.text.tertiary} />
      </Pressable>

      {open ? <View style={styles.rows}>{cycle.items.map((item, j) => <ItemRow key={j} item={item} />)}</View> : null}
    </View>
  );
}

function ItemRow({ item }: { item: TimelineItem }) {
  const c = useAppColors();
  const income = item.type === 'paycheck';
  const low = item.runningCash < LOW_CASH;
  const amountColor = income ? c.accent.success : c.text.primary;
  const signed = `${income ? '+' : '−'}${formatCurrency(item.amount)}`;

  return (
    <View style={styles.row} accessible accessibilityLabel={`${item.label}, ${signed}, balance ${formatCurrency(item.runningCash)}`}>
      <View style={[styles.icon, { backgroundColor: c.background.tertiary }]}>
        <AppIcon name={ROW_ICON[item.type]} size={15} color={income ? c.accent.success : c.text.secondary} />
      </View>
      <View style={styles.flex}>
        <Text style={[textStyles.footnote, { color: c.text.primary }]} numberOfLines={1}>
          {item.label}
        </Text>
        {item.isExternal ? <Text style={[textStyles.caption, { color: c.text.tertiary }]}>from savings</Text> : null}
      </View>
      <View style={styles.amounts}>
        <Text style={[textStyles.footnote, styles.amount, { color: amountColor }]}>{signed}</Text>
        <Text style={[textStyles.caption, { color: low ? c.accent.danger : c.text.tertiary }]}>
          {formatCurrency(item.runningCash)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  group: { borderRadius: layout.cardRadius, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  groupTitle: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  chip: { borderRadius: 999, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  chipText: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  rows: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  icon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 1 },
  amounts: { alignItems: 'flex-end', gap: 1 },
  amount: { fontWeight: '700', fontVariant: ['tabular-nums'] },
});
