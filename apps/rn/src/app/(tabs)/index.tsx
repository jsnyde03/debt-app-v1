import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MoreButton } from '@/components/more-button';
import { PlanHero } from '@/components/plan/PlanHero';
import { RecommendedActionsCard } from '@/components/plan/RecommendedActionsCard';
import { RequiredActionsCard } from '@/components/plan/RequiredActionsCard';
import { Screen } from '@/components/screen';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { appStore } from '@/store/appStore';
import {
  selectPlanState,
  selectPlanSummary,
  selectRecommendedActions,
  selectRequiredRows,
  type RequiredRow,
} from '@/store/planSelectors';
import { selectAllocation } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

function handleMark(row: RequiredRow, paid: boolean) {
  const isExpense = row.item.category === 'expense' || row.item.category === 'autopay_expense';
  const id = isExpense ? row.item.targetId : (row.item.debtId ?? row.item.targetId);
  if (!id) return;
  if (isExpense) appStore.getState().markExpensePaid(id, paid);
  else appStore.getState().markDebtMinimumPaid(id, paid);
}

/** Plan tab (Plan-first index) — the signature screen. */
export default function PlanScreen() {
  const c = useAppColors();
  const store = useAppStore((s) => s.store);
  const allocation = selectAllocation(store);
  const planState = selectPlanState(store, allocation);

  let content: React.ReactNode = null;
  if (planState === 'no-paycheck') {
    content = (
      <PromptCard
        icon="account-balance-wallet"
        iconColor={c.accent.primary}
        title="Set up your paycheck"
        body="Add your paycheck to see exactly what to pay each cycle."
      />
    );
  } else if (planState === 'no-debts') {
    content = (
      <PromptCard
        icon="add-circle-outline"
        iconColor={c.accent.primary}
        title="Add your first debt"
        body="Your debt-free date is waiting. Add a debt to see your plan."
        cta="Add a debt"
        onCta={() => router.push('/bills')}
      />
    );
  } else if (planState === 'debt-free') {
    content = (
      <PromptCard
        icon="celebration"
        iconColor={c.accent.success}
        title="You're debt-free!"
        body="Every balance is cleared. Keep the momentum going."
      />
    );
  } else if (allocation) {
    const requiredRows = selectRequiredRows(store, allocation);
    const summary = selectPlanSummary(store, allocation, requiredRows);
    const recommended = selectRecommendedActions(store, allocation);
    content = (
      <>
        <PlanHero summary={summary} nextPaycheckDate={store.paycheck.nextPaycheckDate} />
        <RequiredActionsCard rows={requiredRows} unfunded={allocation.unfundedRequiredItems ?? []} onMark={handleMark} />
        <RecommendedActionsCard
          active={recommended}
          completed={store.completedRecommendedActions}
          onToggle={(a, done) => appStore.getState().toggleRecommendedDone(a, done)}
        />
      </>
    );
  }

  return (
    <Screen title="Plan" right={<MoreButton />}>
      {content}
    </Screen>
  );
}

function PromptCard({
  icon,
  iconColor,
  title,
  body,
  cta,
  onCta,
}: {
  icon: IconGlyph;
  iconColor: string;
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
}) {
  const c = useAppColors();
  return (
    <Card style={styles.prompt}>
      <View style={[styles.promptIcon, { backgroundColor: c.background.tertiary }]}>
        <AppIcon name={icon} size={28} color={iconColor} />
      </View>
      <Text style={[textStyles.title3, styles.center, { color: c.text.primary }]}>{title}</Text>
      <Text style={[textStyles.subhead, styles.center, { color: c.text.secondary }]}>{body}</Text>
      {cta && onCta ? <Button label={cta} onPress={onCta} style={styles.promptCta} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: { alignItems: 'center', gap: spacing.sm },
  promptIcon: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  center: { textAlign: 'center' },
  promptCta: { alignSelf: 'stretch', marginTop: spacing.sm },
});
