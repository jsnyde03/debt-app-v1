import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MoreButton } from '@/components/more-button';
import { router } from 'expo-router';

import { useGoToTab } from '@/hooks/use-go-to-tab';
import { maybeRequestReview } from '@/lib/review';
import { DebtSheet } from '@/components/entities/DebtSheet';
import { PaycheckSheet } from '@/components/plan/PaycheckSheet';
import { PayoffInvitationCard } from '@/components/plan/PayoffInvitationCard';
import { MilestoneAckCard } from '@/components/plan/MilestoneAckCard';
import { PaidOffFinale } from '@/components/plan/PaidOffFinale';
import { VanquishedBeat } from '@/components/plan/VanquishedBeat';
import { PaydayCaptureSheet } from '@/components/payday/PaydayCaptureSheet';
import { GraduationBanner, FreedomNextChapterCard } from '@/components/plan/GraduationCards';
import { LeanSuggestionCard } from '@/components/plan/LeanSuggestionCard';
import { AffordabilityCard } from '@/components/plan/AffordabilityCard';
import { PaydayGuardianCard } from '@/components/plan/PaydayGuardianCard';
import { PlanHero } from '@/components/plan/PlanHero';
import { RecommendedActionsCard } from '@/components/plan/RecommendedActionsCard';
import { RequiredActionsCard } from '@/components/plan/RequiredActionsCard';
import { WindfallSheet } from '@/components/plan/WindfallSheet';
import { Motion } from '@/motion';
import { Screen } from '@/components/screen';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TwoColumn } from '@/components/ui/TwoColumn';
import { useAppColors } from '@/hooks/use-app-colors';
import { useLayout } from '@/hooks/use-layout';
import { usePaydayCapture } from '@/hooks/use-payday-capture';
import { appStore } from '@/store/appStore';
import { selectStaleBalanceViews, selectProvisionalPayoffs, withProjectedBalances } from '@/store/balanceSelectors';
import { selectBillsAttestation, selectBnplBetweenPaycheck, selectGuardianProofOfWork, selectPaydayGuardian, selectReserveRelease, selectReserveWalkback, selectRiskAcknowledgment, selectTightTopUp, selectTrialConversion } from '@/store/guardianSelectors';
import { selectRecoveryPlan } from '@/store/recoverySelectors';
import { selectLeanSuggestion } from '@/store/incomeLearning';
import {
  selectPlanState,
  selectPlanSummary,
  selectRecommendedActions,
  selectRequiredRows,
  type RequiredRow,
} from '@/store/planSelectors';
import { isLastLiveDebt, selectCelebrationStats } from '@/store/celebrationSelectors';
import { rankDebts } from '@/store/payoffSelectors';
import { selectAllocation } from '@/store/selectors';
import { useAppStore } from '@/store/useAppStore';
import type { Debt } from '@/data/models';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

function handleMark(row: RequiredRow, paid: boolean) {
  const isExpense = row.item.category === 'expense' || row.item.category === 'autopay_expense';
  const id = isExpense ? row.item.targetId : (row.item.debtId ?? row.item.targetId);
  if (!id) return;
  if (isExpense) appStore.getState().markExpensePaid(id, paid);
  else appStore.getState().markDebtMinimumPaid(id, paid);
}

/** Which celebration overlay is showing after a payoff confirm (3.3.1) — a contained per-debt beat, or the
 *  once-ever full-screen finale when the LAST debt clears. */
type Celebration =
  | { kind: 'beat'; debtName: string; amount: number | null; freed: number; nextDebtName: string | null }
  | { kind: 'finale' };

/** Today tab (home) — the payday moment + Payday Autopilot. Elevated to the navy hero + count-ups in 1.3. */
export default function TodayScreen() {
  const c = useAppColors();
  const goToTab = useGoToTab();
  const { isExpanded } = useLayout(); // 3.6.3 — iPad landscape / wide → two-column (read | do)
  const store = useAppStore((s) => s.store);
  const isPremium = store.subscriptionPlan === 'premium';
  // 2.4 — the payday engine reads projected-current balances (premium) so the plan reflects where the
  // user actually is between verifications; free stays on the verified anchor (no-op wrap). The
  // estimate/staleness selectors below keep the RAW store — they detect drift from the real anchor.
  // PERF-1: memoize the expensive projection on [store, isPremium] (matching Progress) so it doesn't
  // re-run on every incidental re-render (sheet open/close, celebration toggles). `store` is a stable
  // zustand ref between renders, so this recomputes only when the plan actually changes.
  const engineStore = useMemo(() => withProjectedBalances(store, isPremium), [store, isPremium]);
  const allocation = selectAllocation(engineStore);
  const planState = selectPlanState(engineStore, allocation);

  const requiredRows = allocation ? selectRequiredRows(engineStore, allocation) : [];
  const recommended = allocation ? selectRecommendedActions(engineStore, allocation) : [];
  const summary = allocation ? selectPlanSummary(engineStore, allocation, requiredRows) : null;
  // 2.4 — the Payday Cushion Guardian for this paycheck (off the projected cushion for premium).
  const guardian = selectPaydayGuardian(engineStore);
  // 3.3.3 — the premium proof-of-work read (off the RAW store: it's the confirmed cycle record, not a projection).
  const proofOfWork = selectGuardianProofOfWork(store);
  // 2.7.4 — a between-paycheck BNPL heads-up (a biweekly plan landing 2+ installments this cycle), naming
  // why the Guardian reads tight. All tiers; null when no BNPL is lumpy.
  const bnplHeadsUp = selectBnplBetweenPaycheck(engineStore);
  // 2.6 — the built catch-up plan when this cycle is short (premium acting; free sees the honest read +
  // invite). Null unless there's a shortfall, so it only shows on the trouble states it's meant for.
  const recovery = isPremium ? selectRecoveryPlan(engineStore) : null;
  // 2.4.10.2 — a risk heads-up went out for this cycle but the read reconciled to clear → acknowledge it.
  const riskCleared = selectRiskAcknowledgment(engineStore);
  // 2.4.11.4b — the safety net just freed (held → free): a one-time insurance-framed ack.
  const reserveRelease = selectReserveRelease(engineStore);
  // 2.4.11.4c — the "bills complete" attestation affordance + the surprise-outflow walk-back notice.
  const attestation = selectBillsAttestation(engineStore);
  const reserveWalkback = selectReserveWalkback(engineStore);
  // 3.5.3.5 / 3.5.5 — an AppIntent-driven mutation (payday-landed roll · logged payment) that offers a
  // one-tap Undo on Today.
  const intentRollback = useAppStore((s) => s.intentRollback);
  // 2.5.4 — a trial obligation whose intro period just ended: confirm "keep it (now $X)" or "cancelled it"
  // so a cancelled trial can't project a phantom bill. Ephemeral dismiss (re-surfaces next open until resolved).
  const [dismissedTrials, setDismissedTrials] = useState<string[]>([]);
  const trialConvRaw = selectTrialConversion(engineStore);
  const trialConversion = trialConvRaw && !dismissedTrials.includes(trialConvRaw.id) ? trialConvRaw : null;
  // 2.4.11.2 — the tight-case "move $X from savings to hold your line" one-tap (null unless tight + savings).
  const tightTopUp = selectTightTopUp(engineStore);
  // 2.4.7.8 — the income-learning nudge (premium + variable income, material change only), off the raw store.
  const leanNudge = selectLeanSuggestion(store);

  // Payday Autopilot — detection + the capture sheet's open state. Called unconditionally (hooks rule).
  const payday = usePaydayCapture(recommended.length > 0);
  // 2.3.5 — stale premium estimates surfaced for the payday re-verify batch (empty for free).
  const staleBalances = selectStaleBalanceViews(store, isPremium);
  // 2.3.6 — debts the premium estimate projected to $0 → the provisional "confirm to celebrate" invitation.
  const provisionalPayoffs = selectProvisionalPayoffs(store, isPremium);

  // 3.3.1 celebration — confirming a payoff to $0 fires the per-debt "vanquished" beat, or the full-screen
  // finale when it's the LAST live debt. Capture the beat's data BEFORE the store clears the debt.
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  function confirmPayoff(d: Debt) {
    const isLast = isLastLiveDebt(store.debts, d.id);
    const next = rankDebts(store.debts.filter((x) => x.balance > 0 && x.id !== d.id), store.payoffStrategy)[0];
    appStore.getState().verifyDebtBalance(d.id, 0, store.paycheck.currentDate);
    setCelebration(
      isLast
        ? { kind: 'finale' }
        : { kind: 'beat', debtName: d.name, amount: d.originalBalance ?? null, freed: d.minimumPayment, nextDebtName: next?.name ?? null },
    );
  }
  const [paycheckSheet, setPaycheckSheet] = useState(false);
  const [windfallSheet, setWindfallSheet] = useState(false);
  const [addDebtOpen, setAddDebtOpen] = useState(false);

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
        // Open the Add-Debt sheet right here (one tap) — no bounce to Money and a second tap. After
        // adding, Today re-renders straight into the plan. (Jason 2026-07-25.)
        onCta={() => setAddDebtOpen(true)}
      />
    );
  } else if (allocation && summary) {
    // 2.4.8 graduation — debt-free flows into the SAME autopilot (the Guardian persists, spare → savings),
    // with the calm permanent graduation banner + the ecosystem "next chapter" invite prepended. The
    // one-time celebration spectacle stays Phase 3 (gated on confirmed-$0).
    const isDebtFree = planState === 'debt-free';
    content = (
      // 3.6.3 — on the expanded iPad canvas this reflows to two columns: the READ (hero · Guardian ·
      // affordability) beside the DO (required · recommended actions); a single stacked column otherwise.
      <TwoColumn
        ratio={1.05}
        left={
          <>
        {isDebtFree ? (
          <Motion>
            <GraduationBanner />
          </Motion>
        ) : null}
        {isDebtFree ? (
          <Motion delay={30}>
            <FreedomNextChapterCard />
          </Motion>
        ) : null}
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
        {guardian ? (
          <Motion delay={45}>
            <PaydayGuardianCard
              brief={guardian}
              isPremium={isPremium}
              proofOfWork={proofOfWork}
              onSeeForecast={() => router.push('/cushion-forecast')}
              topUp={tightTopUp}
              onTopUp={() => tightTopUp && appStore.getState().applyTightTopUp(tightTopUp.goalId, tightTopUp.topUp)}
              showIntro={isPremium && !store.prefs.guardianIntroSeen}
              onDismissIntro={() => appStore.getState().updatePrefs({ guardianIntroSeen: true })}
              attestation={attestation}
              onAttestBills={(v) => appStore.getState().setBillsAttested(v)}
              recovery={recovery}
              onDefer={(id) => appStore.getState().deferExpense(id)}
              onKeepEssential={(id) => appStore.getState().setDeferability(id, 'essential')}
              bnplHeadsUp={bnplHeadsUp}
            />
          </Motion>
        ) : null}
        {/* 2.9 — the inverse Guardian: "can I afford this purchase?" (the Guardian's sibling on Today). */}
        {guardian ? (
          <Motion delay={57}>
            <AffordabilityCard />
          </Motion>
        ) : null}
        {leanNudge ? (
          <Motion delay={68}>
            <LeanSuggestionCard nudge={leanNudge} />
          </Motion>
        ) : null}
          </>
        }
        right={
          <>
        <Motion delay={90}>
          {/* MF.6 (audit #7) — when the premium Recovery Plan is showing, IT owns the shortfall; suppress
              the RequiredActions "Short this paycheck — cover these" block so the two don't duplicate/compete. */}
          <RequiredActionsCard rows={requiredRows} unfunded={recovery ? [] : (allocation.unfundedRequiredItems ?? [])} onMark={handleMark} currentDate={store.paycheck.currentDate} />
        </Motion>
        <Motion delay={180}>
          <RecommendedActionsCard
            active={recommended}
            completed={store.completedRecommendedActions}
            onToggle={(a, done) => appStore.getState().toggleRecommendedDone(a, done)}
          />
        </Motion>
          </>
        }
      />
    );
  }

  return (
    // 3.6.3 — a wider centered column on the expanded iPad so the two-column content has room (but not
    // full-bleed — a dashboard reads better contained; the ack cards above also cap here).
    <Screen title="Today" right={<MoreButton />} maxWidth={isExpanded ? 900 : undefined}>
      {provisionalPayoffs.map((d) => (
        <PayoffInvitationCard
          key={d.id}
          debtName={d.name}
          // Confirm → re-anchor to $0 (the confirmed-payoff signal) AND fire the celebration (beat / finale).
          onConfirm={() => confirmPayoff(d)}
          onNotYet={() => goToTab('money')}
        />
      ))}

      {celebration?.kind === 'beat' ? (
        <VanquishedBeat
          visible
          debtName={celebration.debtName}
          amountVanquished={celebration.amount}
          freedPerMonth={celebration.freed}
          nextDebtName={celebration.nextDebtName}
          onDismiss={() => setCelebration(null)}
        />
      ) : null}
      {celebration?.kind === 'finale' ? (
        <PaidOffFinale visible stats={selectCelebrationStats(store)} onDismiss={() => setCelebration(null)} />
      ) : null}

      {store.pendingMilestone ? (
        <MilestoneAckCard milestone={store.pendingMilestone} onAck={() => appStore.getState().acknowledgeMilestone()} />
      ) : null}

      {riskCleared ? (
        <Card tone="accent" style={styles.ack}>
          <View style={styles.ackRow}>
            <AppIcon name="check-circle" size={20} color={c.accent.success} />
            <Text style={[textStyles.subhead, styles.ackText, { color: c.text.primary }]}>Good news — this paycheck looks clear after all.</Text>
          </View>
          <Button label="Got it" variant="text" onPress={() => appStore.getState().acknowledgeRiskCleared()} />
        </Card>
      ) : null}

      {reserveRelease ? (
        <Card tone="accent" style={styles.ack}>
          <View style={styles.ackRow}>
            <AppIcon name="gpp-good" size={20} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.ackText, { color: c.text.primary }]}>
              {reserveRelease.tapped
                ? `Your safety net was there when a surprise came up — it helped cover about $${Math.round(reserveRelease.covered).toLocaleString('en-US')} while I got to know your bills. It's now going to work on ${reserveRelease.targetName}.`
                : `Your safety net is free — you didn't need it, and it's now going to work on ${reserveRelease.targetName}.`}
            </Text>
          </View>
          <Button label="Got it" variant="text" onPress={() => appStore.getState().acknowledgeReserveRelease()} />
        </Card>
      ) : null}

      {reserveWalkback ? (
        <Card tone="accent" style={styles.ack}>
          <View style={styles.ackRow}>
            <AppIcon name="gpp-good" size={20} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.ackText, { color: c.text.primary }]}>
              A surprise bill came up — I&apos;ve restored your safety net for now.
            </Text>
          </View>
          <Button label="Got it" variant="text" onPress={() => appStore.getState().acknowledgeReserveWalkback()} />
        </Card>
      ) : null}

      {intentRollback ? (
        <Card tone="accent" style={styles.ack}>
          <View style={styles.ackRow}>
            <AppIcon name={intentRollback.kind === 'log-payment' ? 'savings' : 'schedule'} size={20} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.ackText, { color: c.text.primary }]}>
              {intentRollback.kind === 'log-payment'
                ? 'Payment logged — I updated your balance.'
                : 'Payday landed — I rolled your plan forward to this paycheck.'}
            </Text>
          </View>
          <View style={styles.ackActions}>
            <Button label="Undo" variant="text" onPress={() => appStore.getState().undoIntentAction()} />
            <Button label="Keep" variant="text" onPress={() => appStore.getState().dismissIntentRollback()} />
          </View>
        </Card>
      ) : null}

      {trialConversion ? (
        <Card tone="accent" style={styles.ack}>
          <View style={styles.ackRow}>
            <AppIcon name="gpp-good" size={20} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.ackText, { color: c.text.primary }]}>
              Your {trialConversion.name} trial has ended — it&apos;s now ${trialConversion.fullAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {trialConversion.cadence}. Keeping it?
            </Text>
          </View>
          {/* MF.7 — one clean action row: the primary keep + two tertiary text links (no loose full-width
              "Not now" hanging below). */}
          <View style={styles.ackActions}>
            <Button
              label="Keep it"
              onPress={() => appStore.getState().updateExpense(trialConversion.id, { amount: trialConversion.fullAmount, isTrial: false, fullAmount: undefined, fullChargeDate: undefined })}
            />
            <Button label="I cancelled it" variant="text" onPress={() => appStore.getState().removeExpense(trialConversion.id)} />
            <Button label="Not now" variant="text" onPress={() => setDismissedTrials((d) => [...d, trialConversion.id])} />
          </View>
        </Card>
      ) : null}

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
      {addDebtOpen ? <DebtSheet editing={null} onClose={() => setAddDebtOpen(false)} /> : null}
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
  ack: { gap: spacing.xs },
  ackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ackText: { flex: 1, fontWeight: '600' },
  ackActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
