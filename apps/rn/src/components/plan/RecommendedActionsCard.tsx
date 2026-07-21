import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { Card } from '@/components/ui/Card';
import { CheckCircle } from '@/components/ui/CheckCircle';
import { useAppColors } from '@/hooks/use-app-colors';
import type { CompletedRecommendedAction } from '@/data/models';
import type { ActiveRecommendedAction } from '@/store/planSelectors';
import { layout, spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

function toCompleted(a: ActiveRecommendedAction): CompletedRecommendedAction {
  return {
    targetId: a.targetId,
    label: a.label,
    category: a.category,
    recommendedAmount: a.recommendedAmount,
    actualAmount: a.actualAmount,
    paymentSource: 'paycheck',
  };
}

const verb = (category: string) => (category === 'snowball' ? 'Mark Paid' : 'Mark Saved');

/** The recommended extras — the aspirational/optional zone (accent surface, focus-first). */
export function RecommendedActionsCard({
  active,
  completed,
  onToggle,
}: {
  active: ActiveRecommendedAction[];
  completed: CompletedRecommendedAction[];
  onToggle: (action: CompletedRecommendedAction, done: boolean) => void;
}) {
  const c = useAppColors();
  if (active.length === 0 && completed.length === 0) return null;

  return (
    <Card tone="accent" padded={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {/* blue tag — ties to the hero's Suggested line */}
          <View style={[styles.tagDot, { backgroundColor: c.accent.primary }]} />
          <Text style={[textStyles.title3, { color: c.text.primary }]}>Recommended</Text>
        </View>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>Best next move for this paycheck.</Text>
      </View>

      {active.map((a, i) => (
        <Row
          key={a.key}
          label={a.label}
          meta="Suggested for this cycle"
          amount={a.actualAmount}
          focus={i === 0}
          control={<CheckCircle checked={false} tone="accent" onPress={() => onToggle(toCompleted(a), true)} label={verb(a.category)} />}
          divider={i < active.length - 1 || completed.length > 0}
        />
      ))}

      {completed.map((a, i) => (
        <Row
          key={`c-${a.category}-${a.targetId}-${i}`}
          label={a.label}
          meta={a.paymentSource === 'external' ? 'Completed with outside money' : 'Completed this cycle'}
          amount={a.actualAmount}
          done
          control={<CheckCircle checked tone="accent" onPress={() => onToggle(a, false)} label="Undo" />}
          divider={i < completed.length - 1}
        />
      ))}
    </Card>
  );
}

function Row({
  label,
  meta,
  amount,
  control,
  focus,
  done,
  divider,
}: {
  label: string;
  meta: string;
  amount: number;
  control: ReactNode;
  focus?: boolean;
  done?: boolean;
  divider: boolean;
}) {
  const c = useAppColors();
  return (
    <View
      style={[
        styles.row,
        focus ? { backgroundColor: 'rgba(37,99,235,0.06)' } : null,
        divider && { borderBottomColor: c.border.subtle, borderBottomWidth: StyleSheet.hairlineWidth },
      ]}>
      <View style={styles.left}>
        <Text
          style={[textStyles.bodyMedium, { color: c.text.primary, textDecorationLine: done ? 'line-through' : 'none' }]}
          numberOfLines={2}>
          {label}
        </Text>
        <Text style={[textStyles.caption, { color: c.text.tertiary }]}>{meta}</Text>
      </View>
      <View style={styles.right}>
        <Text
          style={[textStyles.numericBody, styles.amount, { color: focus ? c.accent.primary : done ? c.text.tertiary : c.text.primary }]}>
          {formatCurrency(amount)}
        </Text>
        {control}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: layout.cardPaddingH, paddingTop: layout.cardPaddingV, paddingBottom: spacing.md, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: layout.cardPaddingH,
    paddingVertical: spacing.md,
  },
  left: { flex: 1, gap: spacing.xs },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  amount: { fontWeight: '700' },
});
