import { StyleSheet, Text, View } from 'react-native';

import type { PayoffStrategy } from '@/data/models';
import { useAppColors } from '@/hooks/use-app-colors';
import type { DebtClearPoint, TrajectoryPoint } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

import { buildStrategyComparison, comparisonTakeaway, type StrategySummary } from './compareStrategies';

/**
 * C7 / [D59] — snowball vs avalanche, side by side.
 *
 * ⛔ **It compares the ORDER, not the curves, and that was a measured call.** Both simulations already run
 * on every render, so drawing the second line was nearly free — and it would have shown two lines
 * separated by **<0.1%** of chart height on most portfolios, on a card that had just been fixed for being
 * unreadable. What differs is **which debt clears when**: on one measured portfolio the first win lands at
 * month 1 under snowball and month 20 under avalanche.
 * Evidence: `docs/evidence/2026-08-24-c7-strategy-divergence/`.
 *
 * ⚠️ **No dollar figure appears here.** Avalanche's whole case is that it costs less, and [D59] recorded
 * that the difference was never measured. The comparison says what it can support and nothing more.
 */
export function StrategyCompare({
  snowball,
  avalanche,
  snowballClears,
  avalancheClears,
  strategy,
  monthLabel,
}: {
  snowball: TrajectoryPoint[];
  avalanche: TrajectoryPoint[];
  snowballClears: DebtClearPoint[];
  avalancheClears: DebtClearPoint[];
  /** The user's current choice — labelled so the comparison is anchored to where they already are. */
  strategy: PayoffStrategy;
  /** Month offset → a short calendar label, supplied by the chart so both use one date origin. */
  monthLabel: (month: number) => string;
}) {
  const c = useAppColors();
  const cmp = buildStrategyComparison({ snowball, avalanche, snowballClears, avalancheClears });

  // Nothing clears under either plan — there is no order to compare, and a card of empty lists reads as
  // a broken feature rather than an honest one.
  if (cmp.snowball.clears.length === 0 && cmp.avalanche.clears.length === 0) {
    return (
      <View style={styles.body} testID="strategy-compare">
        <Text style={[textStyles.caption, { color: c.text.secondary }]}>
          Add a debt to see how the two payoff orders compare.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.body} testID="strategy-compare">
      <Column summary={cmp.snowball} label="Snowball" active={strategy === 'snowball'} monthLabel={monthLabel} />
      <Column summary={cmp.avalanche} label="Avalanche" active={strategy === 'avalanche'} monthLabel={monthLabel} />
      <Text testID="strategy-compare-takeaway" style={[textStyles.caption, styles.takeaway, { color: c.text.secondary }]}>
        {comparisonTakeaway(cmp)}
      </Text>
    </View>
  );
}

function Column({
  summary,
  label,
  active,
  monthLabel,
}: {
  summary: StrategySummary;
  label: string;
  active: boolean;
  monthLabel: (month: number) => string;
}) {
  const c = useAppColors();
  return (
    <View testID={`strategy-compare-${summary.strategy}`}>
      <View style={styles.head}>
        <Text style={[textStyles.subhead, { color: active ? c.accent.primary : c.text.secondary, fontWeight: '700' }]}>
          {label}
          {/* ⚠️ Named rather than colour-only: which one they are on has to survive greyscale and a
              colour-blind reader, and it is the anchor for reading the other column at all. */}
          {active ? ' · yours' : ''}
        </Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]} numberOfLines={1}>
          {summary.debtFreeMonth == null ? 'No payoff date' : `Debt-free ${monthLabel(summary.debtFreeMonth)}`}
        </Text>
      </View>
      {summary.clears.map((cl, i) => (
        <View key={`${summary.strategy}-${cl.name}-${cl.month}`} style={styles.row}>
          <Text style={[textStyles.caption, styles.name, { color: c.text.secondary }]} numberOfLines={1}>
            {/* The first row is the "first win" — the number this whole comparison exists to expose. */}
            {i === 0 ? '1st · ' : ''}
            {cl.name}
          </Text>
          <Text style={[textStyles.caption, styles.when, { color: c.text.secondary }]} numberOfLines={1}>
            {monthLabel(cl.month)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm, paddingTop: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { flexShrink: 1 },
  when: { fontWeight: '700', letterSpacing: -0.2, textAlign: 'right' },
  takeaway: { paddingTop: spacing.xs },
});
