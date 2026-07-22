import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MoreButton } from '@/components/more-button';
import { useGoToTab } from '@/hooks/use-go-to-tab';
import { maybeRequestReview } from '@/lib/review';
import { PaycheckSheet } from '@/components/plan/PaycheckSheet';
import { PayoffInvitationCard } from '@/components/plan/PayoffInvitationCard';
import { PaydayCaptureSheet } from '@/components/payday/PaydayCaptureSheet';
import { PlanHero } from '@/components/plan/PlanHero';
import { RecommendedActionsCard } from '@/components/plan/RecommendedActionsCard';
import { RequiredActionsCard } from '@/components/plan/RequiredActionsCard';
import { WindfallSheet } from '@/components/plan/WindfallSheet';
import { Motion } from '@/motion';
import { Screen } from '@/components/screen';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAppColors } from '@/hooks/use-app-colors';
import { usePaydayCapture } from '@/hooks/use-payday-capture';
import { appStore } from '@/store/appStore';
import { selectStaleBalanceViews, selectProvisionalPayoffs, withProjectedBalances } from '@/store/balanceSelectors';
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

/** Today tab (home) — the payday moment + Payday Autopilot. Elevated to the navy hero + count-ups in 1.3. */
export default function TodayScreen() {
  const c = useAppColors();
  const goToTab = useGoToTab();
  const store = useAppStore((s) => s.store);
  const isPremium = store.subscriptionPlan === 'premium';
  // 2.4 — the payday engine reads projected-current balances (premium) so the plan reflects where the
  // user actually is between verifications; free stays on the verified anchor (no-op wrap). The
  // estimate/staleness selectors below keep the RAW store — they detect drift from the real anchor.
  const engineStore = withProjectedBalances(store, isPremium);
  const allocation = selectAllocation(engineStore);
  const planState = selectPlanState(engineStore, allocation);

  const requiredRows = allocation ? selectRequiredRows(engineStore, allocation) : [];
  const recommended = allocation ? selectRecommendedActions(engineStore, allocation) : [];
  const summary = allocation ? selectPlanSummary(engineStore, allocation, requiredRows) : null;

  // Payday Autopilot — detection + the capture sheet's open state. Called unconditionally (hooks rule).
  const payday = usePaydayCapture(recommended.length > 0);
  // 2.3.5 — stale premium estimates surfaced for the payday re-verify batch (empty for free).
  const staleBalances = selectStaleBalanceViews(store, isPremium);
  // 2.3.6 — debts the premium estimate projected to $0 → the provisional "confirm to celebrate" invitation.
  const provisionalPayoffs = selectProvisionalPayoffs(store, isPremium);
  const [paycheckSheet, setPaycheckSheet] = useState(false);
  const [windfallSheet, setWindfallSheet] = useState(false);

  let content: React.ReactNode = null;
  if (planState === 'no-paycheck') {
    content = (
      <PromptCard
        icon="account-balance-wallet"
        iconColor={c.accent.primary}
        title="Set up your paycheck"
        body="Add your paycheck to see exactly what to pay each cycle."
        cta="Set up your paycheck"
        onCta={() => setPaycheckSheet(true)}
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
        onCta={() => goToTab('money')}
      />
    );
  } else if (planState === 'debt-free') {
    content = <PromptCard icon="celebration" iconColor={c.accent.success} title="You're debt-free!" body="Every balance is cleared. Keep the momentum going." />;
  } else if (allocation && summary) {
    content = (
      <>
        <Motion>
          <PlanHero
            summary={summary}
            recommended={recommended}
            nextPaycheckDate={store.paycheck.nextPaycheckDate}
            windfall={store.windfall ?? 0}
            onAddWindfall={() => setWindfallSheet(true)}
            onEditPaycheck={() => setPaycheckSheet(true)}
          />
        </Motion>
        <Motion delay={90}>
          <RequiredActionsCard rows={requiredRows} unfunded={allocation.unfundedRequiredItems ?? []} onMark={handleMark} currentDate={store.paycheck.currentDate} />
        </Motion>
        <Motion delay={180}>
          <RecommendedActionsCard
            active={recommended}
            completed={store.completedRecommendedActions}
            onToggle={(a, done) => appStore.getState().toggleRecommendedDone(a, done)}
          />
        </Motion>
      </>
    );
  }

  return (
    <Screen title="Today" right={<MoreButton />}>
      {provisionalPayoffs.map((d) => (
        <PayoffInvitationCard
          key={d.id}
          debtName={d.name}
          // Confirm → re-anchor to $0 (the confirmed-payoff signal; the Phase-3 spectacle fires here).
          onConfirm={() => appStore.getState().verifyDebtBalance(d.id, 0, store.paycheck.currentDate)}
          onNotYet={() => goToTab('money')}
        />
      ))}

      {payday.isAwaitingRollover ? (
        <Card tone="accent" style={styles.nudge}>
          <Text style={[textStyles.subhead, { color: c.text.primary }]}>
            Payday logged. Start your next pay cycle to apply this cycle&apos;s payments and get your next plan.
          </Text>
          <Button label="Start Next Pay Cycle" onPress={() => appStore.getState().rolloverPayCycle()} style={styles.nudgeBtn} />
        </Card>
      ) : null}

      {content}

      {allocation && summary ? (
        <Text style={[textStyles.caption, styles.trust, { color: c.text.tertiary }]}>Private · on your device</Text>
      ) : null}

      {allocation && summary ? (
        <PaydayCaptureSheet
          key={store.paycheck.nextPaycheckDate}
          visible={payday.isOpen}
          activeRecommendedActions={recommended}
          requiredRows={requiredRows}
          requiredTotal={summary.requiredTotal}
          staleBalances={staleBalances}
          currentDate={store.paycheck.currentDate}
          onVerifyBalances={(entries, date) => appStore.getState().verifyDebtBalances(entries, date)}
          onCapture={(items, decisions) => {
            appStore.getState().capturePayday(items, decisions);
            payday.completeCapture();
            // Ask for a review ONCE, at a genuine success moment on an established user (not the first
            // cycle) — the persisted guard prevents re-prompting; iOS also throttles the real prompt.
            const st = appStore.getState().store;
            if (st.cycleHistory.length >= 2 && !st.reviewPrompted) {
              appStore.getState().markReviewPrompted();
              void maybeRequestReview();
            }
          }}
          onDismiss={payday.dismiss}
          onClose={payday.close}
        />
      ) : null}

      {paycheckSheet ? <PaycheckSheet onClose={() => setPaycheckSheet(false)} /> : null}
      {windfallSheet ? <WindfallSheet current={store.windfall ?? 0} onClose={() => setWindfallSheet(false)} /> : null}
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
  nudge: { gap: spacing.md },
  nudgeBtn: { alignSelf: 'stretch' },
  trust: { textAlign: 'center', marginTop: spacing.xs },
});
