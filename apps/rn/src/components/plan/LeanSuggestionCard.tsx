import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppIcon } from '@/components/ui/AppIcon';
import { useActiveStore } from '@/store/StoreContext';
import type { LeanNudge } from '@/store/incomeLearning';
import { useAppColors } from '@/hooks/use-app-colors';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';
import { groupLabel } from '@/utils/a11y';
import { formatWhole } from '@/utils/format';

/**
 * §2.3 income-learning nudge (2.4.7.8) — suggest-and-confirm, NEVER silent. Premium + variable income
 * only; appears only on a material learned change. Calm register (it's a gentle refinement, not an
 * alarm). Applying it re-anchors drift via the `'learning'` seam so "days ahead/behind" doesn't reset.
 */
export function LeanSuggestionCard({ nudge }: { nudge: LeanNudge }) {
  // 3.5.3.0 — write to the store this subtree resolves to (sandbox under the tutorial, real otherwise).
  const store_ = useActiveStore();
  const c = useAppColors();
  const up = nudge.direction === 'up';

  const detail = up
    ? `Your recent paychecks have reliably cleared about ${formatWhole(nudge.suggestedLean)}. Raise your income floor so the plan can put a little more to work?`
    : `Your income has been running closer to ${formatWhole(nudge.suggestedLean)} lately. Lower your floor to match what you can count on, so the plan stays realistic?`;

  return (
    <Card>
      <View {...groupLabel('Income floor', up ? 'Raise your income floor' : 'Adjust your income floor', detail)}>
        <View style={styles.head}>
          <AppIcon name="trending-up" size={20} color={c.accent.primary} />
          <Text style={[textStyles.footnote, styles.eyebrow, { color: c.text.tertiary }]}>INCOME FLOOR</Text>
        </View>
        <Text style={[textStyles.subhead, styles.detail, { color: c.text.secondary }]}>{detail}</Text>
      </View>
      <View style={styles.actions}>
        <Button label={`Update to ${formatWhole(nudge.suggestedLean)}`} onPress={() => store_.getState().applyLeanSuggestion(nudge.suggestedLean)} />
        <Button label="Not now" variant="secondary" onPress={() => store_.getState().dismissLeanSuggestion(nudge.suggestedLean)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  eyebrow: { letterSpacing: 0.8 },
  detail: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
