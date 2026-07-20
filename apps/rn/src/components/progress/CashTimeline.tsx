import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import type { TimelineCycle } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The near-term cash-cushion forecast — one bar per upcoming pay cycle (ending balance), colored by
 * the stable/tight/pressure health. Answers "will I be squeezed soon?" — distinct from the long-
 * horizon payoff trajectory. On `@core/timeline` (tested). Reborn from the Capacitor list as a chart.
 */
export function CashTimeline({ cycles }: { cycles: TimelineCycle[] }) {
  const c = useAppColors();
  if (cycles.length === 0) return null;
  const tone = { stable: c.accent.success, tight: c.accent.warning, pressure: c.accent.danger };
  const max = Math.max(1, ...cycles.map((cy) => Math.max(0, cy.endingBalance)));
  const caption = cycles.some((cy) => cy.cushionStatus === 'pressure')
    ? 'A cycle runs short ahead — plan for it.'
    : cycles.some((cy) => cy.cushionStatus === 'tight')
      ? 'Cushion gets tight in an upcoming cycle.'
      : 'Comfortable across the next few paychecks.';

  return (
    <Card>
      <Text style={[textStyles.footnote, styles.title, { color: c.text.tertiary }]}>
        CASH CUSHION · NEXT {cycles.length} PAY CYCLES
      </Text>
      <View style={styles.bars}>
        {cycles.map((cy, i) => (
          <View
            key={i}
            style={styles.col}
            accessible
            accessibilityLabel={`${shortDate(cy.cycleStart)}: ${formatCurrency(cy.endingBalance)}, ${cy.cushionStatus}`}>
            <Text style={[textStyles.caption, styles.val, { color: c.text.secondary }]}>
              {formatCurrency(Math.round(cy.endingBalance))}
            </Text>
            <View style={styles.track}>
              <View style={[styles.bar, { height: 8 + (Math.max(0, cy.endingBalance) / max) * 84, backgroundColor: tone[cy.cushionStatus] }]} />
            </View>
            <Text style={[textStyles.caption, { color: c.text.tertiary }]} numberOfLines={1}>
              {shortDate(cy.cycleStart)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[textStyles.caption, styles.caption, { color: c.text.secondary }]}>{caption}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginBottom: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  val: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { height: 92, width: '62%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  caption: { marginTop: spacing.md, textAlign: 'center' },
});
