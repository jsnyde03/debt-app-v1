import { StyleSheet, Text, View } from 'react-native';

import { MoreButton } from '@/components/more-button';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { useAppColors } from '@/hooks/use-app-colors';
import { selectAllocation } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Plan tab (Plan-first index). B.2 wires the store → `@core` engine → this hero to prove the data
 * layer end-to-end; B.4 rebuilds it into the full Plan (hero + required actions + Payday Autopilot).
 */
export default function PlanScreen() {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const allocation = selectAllocation(store);

  return (
    <Screen title="Plan" right={<MoreButton />}>
      {allocation ? (
        <View style={[styles.card, { backgroundColor: c.background.secondary, borderColor: c.border.subtle }]}>
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.accent.primary }]}>
            THIS PAYCHECK · store → @core engine
          </Text>
          <Text style={[textStyles.numericLarge, { color: c.text.primary }]}>{money(allocation.paycheckAmount)}</Text>
          <Text style={[textStyles.subhead, { color: c.text.secondary }]}>
            Required {money(allocation.totalRequired)} · Remaining {money(allocation.remaining)}
          </Text>
          <View style={[styles.divider, { backgroundColor: c.border.subtle }]} />
          {allocation.allocations.map((a, i) => (
            <View key={`${a.category}-${i}`} style={styles.row}>
              <Text style={[textStyles.body, { color: c.text.primary }]} numberOfLines={1}>
                {a.label}
              </Text>
              <Text style={[textStyles.numericBody, { color: c.text.primary }]}>{money(a.amount)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Placeholder label="Plan" note="Set your paycheck to see your plan — full Plan screen at B.4." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: layout.cardRadius,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: layout.cardPaddingV,
    gap: spacing.xs,
  },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
});
