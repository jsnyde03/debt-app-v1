import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { TimelineLedger } from '@/components/progress/TimelineLedger';
import { Card } from '@/components/ui/Card';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { useAppColors } from '@/hooks/use-app-colors';
import type { TimelineCycle } from '@/store/payoffSelectors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * The cash-flow module — one section, two lenses (Freedom's Milestones/Table pattern): **Cushion**
 * (near-term ending-balance forecast bars — "will I be squeezed soon?") and **Timeline** (the
 * itemized "where every dollar went" ledger — the reborn Capacitor Timeline). Same `selectCashTimeline`
 * data, user picks the view.
 */
export function CashFlowSection({ cycles }: { cycles: TimelineCycle[] }) {
  const c = useAppColors();
  const [view, setView] = useState<'cushion' | 'timeline'>('cushion');
  if (cycles.length === 0) return null;

  return (
    <Card>
      <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>
        CASH FLOW · NEXT {cycles.length} PAY CYCLES
      </Text>
      <SegmentedToggle
        value={view}
        onChange={(v) => setView(v as 'cushion' | 'timeline')}
        options={[
          { value: 'cushion', label: 'Cushion' },
          { value: 'timeline', label: 'Timeline' },
        ]}
      />
      <View style={styles.body}>{view === 'cushion' ? <CushionBars cycles={cycles} /> : <TimelineLedger cycles={cycles} />}</View>
    </Card>
  );
}

/** Near-term cash-cushion forecast — one bar per upcoming cycle, colored by stable/tight/pressure. */
function CushionBars({ cycles }: { cycles: TimelineCycle[] }) {
  const c = useAppColors();
  const tone = { stable: c.accent.success, tight: c.accent.warning, pressure: c.accent.danger };
  const max = Math.max(1, ...cycles.map((cy) => Math.max(0, cy.endingBalance)));
  const caption = cycles.some((cy) => cy.cushionStatus === 'pressure')
    ? 'A cycle runs short ahead — plan for it.'
    : cycles.some((cy) => cy.cushionStatus === 'tight')
      ? 'Cushion gets tight in an upcoming cycle.'
      : 'Comfortable across the next few paychecks.';

  return (
    <>
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
    </>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700', marginBottom: spacing.md },
  body: { marginTop: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  val: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  track: { height: 92, width: '62%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  caption: { marginTop: spacing.md, textAlign: 'center' },
});
