import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@core/utils/formatCurrency';

import { UNREAD_PLAN_LEAD } from '@/components/plan/dataRepairsCopy';
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
  unreadPlanInputs,
  unreadFix,
}: {
  active: ActiveRecommendedAction[];
  completed: CompletedRecommendedAction[];
  onToggle: (action: CompletedRecommendedAction, done: boolean) => void;
  /**
   * ⛔ **[class 5 R2 `FX-2`] `'paycheck-plan'` — the card had no trust gate at all.** Every suggested move is spent out
   * of the allocation, and on avalanche its TARGET is ranked by APR: a lost minimum inflated the amount, a lost rate
   * renamed the debt, and a tap on "Mark Paid" recorded either. ⚠️ Required, not defaulted — a caller that forgets
   * the gate must not compile. Completed rows are kept: they are what the user already did, not a claim.
   */
  unreadPlanInputs: boolean;
  /** `unreadInputsFix(repairsPoisoning(store, 'paycheck-plan'), …)`, naming what to set. */
  unreadFix: string;
}) {
  const c = useAppColors();
  const shown = unreadPlanInputs ? [] : active;
  const withheld = unreadPlanInputs && active.length > 0;
  if (shown.length === 0 && completed.length === 0 && !withheld) return null;

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

      {withheld ? (
        <Text testID="recommended-unread-inputs" style={[textStyles.subhead, styles.unread, { color: c.accent.warning }]}>
          {`${UNREAD_PLAN_LEAD}, so I can’t suggest a move yet — ${unreadFix}.`}
        </Text>
      ) : null}

      {shown.map((a, i) => (
        <Row
          key={a.key}
          label={a.label}
          meta="Suggested this paycheck"
          amount={a.actualAmount}
          focus={i === 0}
          control={<CheckCircle checked={false} tone="accent" onPress={() => onToggle(toCompleted(a), true)} label={verb(a.category)} />}
          divider={i < shown.length - 1 || completed.length > 0}
        />
      ))}

      {completed.map((a, i) => (
        <Row
          key={`c-${a.category}-${a.targetId}-${i}`}
          label={a.label}
          meta={a.paymentSource === 'external' ? 'Completed with outside money' : 'Completed this paycheck'}
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
  unread: { paddingHorizontal: layout.cardPaddingH, paddingBottom: layout.cardPaddingV },
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
