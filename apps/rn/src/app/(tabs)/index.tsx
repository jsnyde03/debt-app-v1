import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { StyleSheet, Text, View, useWindowDimensions, type ScrollView, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoreButton } from '@/components/more-button';
import { router } from 'expo-router';

import { useGoToTab } from '@/hooks/use-go-to-tab';
import { maybeRequestReview } from '@/lib/review';
import { DebtSheet } from '@/components/entities/DebtSheet';
import { PaycheckSheet } from '@/components/plan/PaycheckSheet';
import { PayoffInvitationCard } from '@/components/plan/PayoffInvitationCard';
import { MilestoneAckCard } from '@/components/plan/MilestoneAckCard';
import { TutorialInviteCard } from '@/components/plan/TutorialInviteCard';
import { markTutorialSeen, selectTutorialInvite, tutorialRunFor } from '@/store/tutorialSelectors';
import { a11yHidden, announce } from '@/utils/a11y';
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
import { haptics } from '@/motion/haptics';
import { Screen } from '@/components/screen';
import { AppIcon, type IconGlyph } from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { TwoColumn } from '@/components/ui/TwoColumn';
import { useAppColors } from '@/hooks/use-app-colors';
import { useLayout } from '@/hooks/use-layout';
import { usePaydayCapture } from '@/hooks/use-payday-capture';
import { StoreProvider, useActiveStore } from '@/store/StoreContext';
import { isSandboxStore } from '@/store/sandboxStore';
import { TutorialTarget, TutorialTargetsProvider, useTutorialTargets } from '@/store/tutorialTargets';
import { useTutorialShell } from '@/store/tutorialShell';
import { useInert } from '@/hooks/use-inert';
import { useSpotlight } from '@/hooks/use-spotlight';
import { startTutorial, tutorialSession, useTutorialSession } from '@/store/tutorialSession';
import { INTERACTIVE_STEP_IDS, TUTORIAL_STEPS } from '@/store/tutorialPath';
import type { DebtStoreInstance } from '@/store/store';
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
import { TutorialFence } from '@/components/plan/TutorialFence';
import { stageBounds } from '@/components/plan/tutorialStage';
import { useAppStore } from '@/store/useAppStore';
import type { Debt } from '@/data/models';
import { spacing } from '@/theme/spacing';
import { textStyles } from '@/theme/typography';

/** 3.5.3.0 — module-level, so the acting store is PASSED in rather than reached for. */
function handleMark(store: DebtStoreInstance, row: RequiredRow, paid: boolean) {
  const isExpense = row.item.category === 'expense' || row.item.category === 'autopay_expense';
  const id = isExpense ? row.item.targetId : (row.item.debtId ?? row.item.targetId);
  if (!id) return;
  if (isExpense) store.getState().markExpensePaid(id, paid);
  else store.getState().markDebtMinimumPaid(id, paid);
}

/** Which celebration overlay is showing after a payoff confirm (3.3.1) — a contained per-debt beat, or the
 *  once-ever full-screen finale when the LAST debt clears. */
type Celebration =
  | { kind: 'beat'; debtName: string; amount: number | null; freed: number; nextDebtName: string | null }
  | { kind: 'finale' };

/** Today tab (home) — the payday moment + Payday Autopilot. Elevated to the navy hero + count-ups in 1.3. */
function TodayContent({ scrollRef, onScroll }: { scrollRef?: React.Ref<ScrollView>; onScroll?: ScrollViewProps['onScroll'] } = {}) {
  const c = useAppColors();
  const goToTab = useGoToTab();
  const { isExpanded } = useLayout(); // 3.6.3 — iPad landscape / wide → two-column (read | do)
  // 3.5.3.0 — the store this screen acts on: the real singleton normally, the sandbox when the
  // tutorial wraps Today in a StoreProvider. Reads and writes MUST resolve to the same one.
  const store_ = useActiveStore();
  // 3.5.3.2 — is this screen showing EXAMPLE money? Asked of the STORE, not of the tutorial session:
  // the marker's whole job is to be true about what's rendered, so it hangs off the same brand the
  // persistence + sync seams refuse on. A session flag could be set while the provider wasn't (or
  // vice-versa) and the card would then lie in the one direction that matters.
  const isExample = isSandboxStore(store_);
  // 3.5.3.4.2 — the active beat's modal-guidance line, if it declares one. Read here rather than passed
  // down from the route, because the card that presents the sheet is rendered by this screen.
  const coachLine = useTutorialSession((s) => (s.active ? TUTORIAL_STEPS[s.index]?.coach : undefined));
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
    store_.getState().verifyDebtBalance(d.id, 0, store.paycheck.currentDate);
    setCelebration(
      isLast
        ? { kind: 'finale' }
        : { kind: 'beat', debtName: d.name, amount: d.originalBalance ?? null, freed: d.minimumPayment, nextDebtName: next?.name ?? null },
    );
  }
  const [paycheckSheet, setPaycheckSheet] = useState(false);
  const [windfallSheet, setWindfallSheet] = useState(false);
  const [addDebtOpen, setAddDebtOpen] = useState(false);

  // VIS-4 — single priority ack-slot. Today shows at most ONE acknowledgment card at a time (ranked),
  // so the surface never stacks 5-6 acks. Dismissing the top one clears its condition, so the next in
  // priority surfaces on the following render. A celebration (full-screen beat/finale) outranks them all
  // and suppresses the slot while it's up.
  // 3.5.1 — the tutorial invitation is ranked LAST in this slot: every other ack is time-sensitive (a
  // milestone just crossed, a reserve just released), while a teaching offer keeps. On a brand-new user
  // none of the others can fire anyway, so it costs the offer nothing to yield to them.
  //
  // ⚠️ That ranking only governs the FALLBACK now. Since [D5]/3.5.3.5.8 the invitation's normal home is
  // below the Guardian card with no ack-slot condition, so it and an ack can render together; the slot
  // is used only when there's no Guardian card to sit under. The ranking was written when this was the
  // one and only position.
  // 3.5.3.2 — never offer the walkthrough while the user is INSIDE it. The invitation reads the acting
  // store, and the sandbox is a fresh store that has of course never seen the tutorial — so the in-situ
  // shell (3.5.3.1) had Today advertising "See how your Guardian works · Show me" on top of the very
  // walkthrough it was inviting them to. Caught by 3.5.3.2's marker screenshot.
  const tutorialInvite = isExample ? null : selectTutorialInvite(store);
  const activeAck: 'milestone' | 'intent' | 'reserve-release' | 'reserve-walkback' | 'risk-cleared' | 'trial' | 'tutorial' | null =
    celebration
      ? null
      : store.pendingMilestone
        ? 'milestone'
        : intentRollback
          ? 'intent'
          : reserveRelease
            ? 'reserve-release'
            : reserveWalkback
              ? 'reserve-walkback'
              : riskCleared
                ? 'risk-cleared'
                : trialConversion
                  ? 'trial'
                  : tutorialInvite
                    ? 'tutorial'
                    : null;

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
            <TutorialFence>
              <FreedomNextChapterCard />
            </TutorialFence>
          </Motion>
        ) : null}
        <Motion>
          {/* Fenced: `onAddWindfall` / `onEditPaycheck` each open a Modal, and a Modal opened from under a
              live walkthrough covers the coaching dock itself. See `TutorialFence`. */}
          <TutorialFence>
            <PlanHero
              summary={summary}
              recommended={recommended}
              nextPaycheckDate={store.paycheck.nextPaycheckDate}
              windfall={store.windfall ?? 0}
              onAddWindfall={() => setWindfallSheet(true)}
              onEditPaycheck={() => setPaycheckSheet(true)}
            />
          </TutorialFence>
        </Motion>
        {guardian ? (
          // 3.5.3.6.1 — the hand-back CROSSFADE. Keying on `isExample` makes the swap from sandbox money
          // to the user's own a deliberate fade-in rather than a jump-cut: `Motion` re-runs its entrance
          // when the key changes, and degrades to nothing under Reduce Motion. It is the same card
          // component either way — only the money underneath changes, which is exactly the point.
          <Motion key={isExample ? 'example' : 'real'} delay={45}>
            {/* 3.5.3.3.1 — the whole card is the subject of the opening + closing beats. Registered from
                the host so the card itself stays unaware of the walkthrough. */}
            <TutorialTarget id="guardian-card">
            <PaydayGuardianCard
              brief={guardian}
              isPremium={isPremium}
              isExample={isExample}
              proofOfWork={proofOfWork}
              onSeeForecast={() => router.push('/cushion-forecast')}
              topUp={tightTopUp}
              onTopUp={() => tightTopUp && store_.getState().applyTightTopUp(tightTopUp.goalId, tightTopUp.topUp)}
              // Withheld on example money: "How this works" restarts the walkthrough, and offering that
              // FROM INSIDE the walkthrough is incoherent: an offer to restart something you are in.
              // Not a reachability question: taps pass through the CUTOUT only, and this link sits under
              // a blocking band on every beat. It is withheld because the OFFER makes no sense here.
              // `resume: false` — this control says "How this works", so it starts at beat 1. Without it
              // a stranded step from an interrupted run would drop them mid-arc (see `startTutorial`).
              onReplayTutorial={isExample ? undefined : () => startTutorial(tutorialRunFor(store), { resume: false })}
              // 3.5.3.4.2 — the beat's own guidance, carried into the modal it sends the user into.
              coachLine={isExample ? coachLine : undefined}
              // 3.5.3.4.4 — snapshot the read BEFORE the write: once the store re-solves, the "before"
              // this beat's payoff needs is gone. No-op outside a session.
              onSetFloor={(v) => {
                if (isExample && guardian) {
                  tutorialSession.getState().noteFloorBefore({ cushion: guardian.cushion, floor: guardian.floor });
                  // 3.5.3.7.5 ([D12]) — a medium beat, not the advance tick: the user just moved their own
                  // line and the plan re-solved because of it. This is one of exactly two moments in the
                  // arc they CAUSED something, and weighting it the same as pressing Next would flatten
                  // the difference between doing and watching.
                  haptics.medium();
                }
                store_.getState().setCushionFloor(v);
              }}
              attestation={attestation}
              // 3.5.3.5 ([D10]) — the tap is real (it genuinely shrinks the net); inside a walkthrough it
              // also cues the scripted story that shows what the net is FOR. Only on the way in: undoing
              // shouldn't replay it.
              onAttestBills={(v) => {
                store_.getState().setBillsAttested(v);
                if (!isExample) return;
                if (v) {
                  // The arc's second caused-it moment: the net shrinks by their word, and the story that
                  // follows is the consequence. Same medium beat as the floor, for the same reason.
                  haptics.medium();
                  tutorialSession.getState().playReserveStory();
                } else {
                  // Undo cancels the consequence. Without this the scripted surprise and rollovers still
                  // landed, narrating a story about a confirmation the user had just withdrawn.
                  tutorialSession.getState().cancelReserveStory();
                }
              }}
              recovery={recovery}
              onDefer={(id) => store_.getState().deferExpense(id)}
              onKeepEssential={(id) => store_.getState().setDeferability(id, 'essential')}
              bnplHeadsUp={bnplHeadsUp}
            />
            </TutorialTarget>
          </Motion>
        ) : null}
        {/* 3.5.3.5.8 ([D5], Jason 2026-07-31) — the invitation sits with its SUBJECT. It used to open
            Today above the paycheck hero, having inherited the ack slot's position, which put an offer
            ahead of the user's own money on every launch until they answered it. It teaches the
            Guardian, so it belongs under the Guardian. */}
        {tutorialInvite && guardian ? (
          <Motion delay={50}>
            <TutorialInviteCard
              onStart={() => startTutorial(tutorialInvite.run)}
              onDismiss={() => store_.getState().updatePrefs(markTutorialSeen(store.prefs, tutorialInvite.run))}
            />
          </Motion>
        ) : null}
        {/* 2.9 — the inverse Guardian: "can I afford this purchase?" (the Guardian's sibling on Today). */}
        {guardian ? (
          <Motion delay={57}>
            <TutorialFence>
              <AffordabilityCard />
            </TutorialFence>
          </Motion>
        ) : null}
        {leanNudge ? (
          <Motion delay={68}>
            <TutorialFence>
              <LeanSuggestionCard nudge={leanNudge} />
            </TutorialFence>
          </Motion>
        ) : null}
          </>
        }
        right={
          <>
        <Motion delay={90}>
          {/* MF.6 (audit #7) — when the premium Recovery Plan is showing, IT owns the shortfall; suppress
              the RequiredActions "Short this paycheck — cover these" block so the two don't duplicate/compete. */}
          {/* Fenced: `onMark` / `onToggle` write the store and re-stage the very card a beat is narrating. */}
          <TutorialFence>
            <RequiredActionsCard rows={requiredRows} unfunded={recovery ? [] : (allocation.unfundedRequiredItems ?? [])} onMark={(row, paid) => handleMark(store_, row, paid)} currentDate={store.paycheck.currentDate} />
          </TutorialFence>
        </Motion>
        <Motion delay={180}>
          <TutorialFence>
            <RecommendedActionsCard
              active={recommended}
              completed={store.completedRecommendedActions}
              onToggle={(a, done) => store_.getState().toggleRecommendedDone(a, done)}
            />
          </TutorialFence>
        </Motion>
          </>
        }
      />
    );
  }

  return (
    // 3.6.3 — a wider centered column on the expanded iPad so the two-column content has room (but not
    // full-bleed — a dashboard reads better contained; the ack cards above also cap here).
    <Screen title="Today" right={<MoreButton />} maxWidth={isExpanded ? 900 : undefined} scrollRef={scrollRef} onScroll={onScroll}>
      {provisionalPayoffs.map((d) => (
        <TutorialFence key={d.id}>
        <PayoffInvitationCard
          debtName={d.name}
          // Confirm → re-anchor to $0 (the confirmed-payoff signal) AND fire the celebration (beat / finale).
          onConfirm={() => confirmPayoff(d)}
          onNotYet={() => goToTab('money')}
        />
        </TutorialFence>
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

      {store.pendingMilestone && activeAck === 'milestone' ? (
        <MilestoneAckCard milestone={store.pendingMilestone} onAck={() => store_.getState().acknowledgeMilestone()} />
      ) : null}

      {riskCleared && activeAck === 'risk-cleared' ? (
        <Card tone="accent" style={styles.ack}>
          <View style={styles.ackRow}>
            <AppIcon name="check-circle" size={20} color={c.accent.success} />
            <Text style={[textStyles.subhead, styles.ackText, { color: c.text.primary }]}>Good news — this paycheck looks clear after all.</Text>
          </View>
          <Button label="Got it" variant="text" onPress={() => store_.getState().acknowledgeRiskCleared()} />
        </Card>
      ) : null}

      {/* 3.5.3.5.5 — registered so a beat can spotlight its own RESULT. The ack slot sits at the very top
          of Today, far from whatever control produced it, so the walkthrough has to be able to bring the
          user back up to it. */}
      {reserveRelease && activeAck === 'reserve-release' ? (
        <TutorialTarget id="today-ack">
        <Card tone="accent" style={styles.ack}>
          <View style={styles.ackRow}>
            <AppIcon name="gpp-good" size={20} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.ackText, { color: c.text.primary }]}>
              {reserveRelease.tapped
                ? `Your safety net was there when a surprise came up — it helped cover about $${Math.round(reserveRelease.covered).toLocaleString('en-US')} while I got to know your bills. It's now going to work on ${reserveRelease.targetName}.`
                : `Your safety net is free — you didn't need it, and it's now going to work on ${reserveRelease.targetName}.`}
            </Text>
          </View>
          <Button label="Got it" variant="text" onPress={() => store_.getState().acknowledgeReserveRelease()} />
        </Card>
        </TutorialTarget>
      ) : null}

      {/* [B1] Also a spotlightable payoff: on beat 4 this ack IS the lesson ("a surprise proved
          otherwise, so I put the net back"), and it renders at the top of Today far from the control
          that produced it. */}
      {reserveWalkback && activeAck === 'reserve-walkback' ? (
        <TutorialTarget id="today-ack">
        <Card tone="accent" style={styles.ack}>
          <View style={styles.ackRow}>
            <AppIcon name="gpp-good" size={20} color={c.accent.primary} />
            <Text style={[textStyles.subhead, styles.ackText, { color: c.text.primary }]}>
              A surprise bill came up — I&apos;ve restored your safety net for now.
            </Text>
          </View>
          <Button label="Got it" variant="text" onPress={() => store_.getState().acknowledgeReserveWalkback()} />
        </Card>
        </TutorialTarget>
      ) : null}

      {intentRollback && activeAck === 'intent' ? (
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
            <Button label="Undo" variant="text" onPress={() => store_.getState().undoIntentAction()} />
            <Button label="Keep" variant="text" onPress={() => store_.getState().dismissIntentRollback()} />
          </View>
        </Card>
      ) : null}

      {trialConversion && activeAck === 'trial' ? (
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
              onPress={() => store_.getState().updateExpense(trialConversion.id, { amount: trialConversion.fullAmount, isTrial: false, fullAmount: undefined, fullChargeDate: undefined })}
            />
            <Button label="I cancelled it" variant="text" onPress={() => store_.getState().removeExpense(trialConversion.id)} />
            <Button label="Not now" variant="text" onPress={() => setDismissedTrials((d) => [...d, trialConversion.id])} />
          </View>
        </Card>
      ) : null}

      {/* 3.5.1 — the tutorial invitation. "Not now" records the run as seen: declining is an answer, and
          re-asking every launch would make the offer nag. Replay lives on the Guardian card + in More.

          3.5.3.5.8 ([D5]) — it normally renders BELOW the Guardian card now (with its subject), so this
          slot is the FALLBACK for a user who has no Guardian card to sit under. `selectTutorialInvite`
          asks only for `onboardingComplete`, so someone who finished onboarding without entering a
          paycheck is offered the walkthrough — and the tutorial runs on a sandbox, so it teaches them
          perfectly well. Moving it strictly under the card would have silently dropped exactly the
          newest audience it's aimed at. */}
      {tutorialInvite && activeAck === 'tutorial' && !guardian ? (
        <TutorialInviteCard
          onStart={() => startTutorial(tutorialInvite.run)}
          onDismiss={() => store_.getState().updatePrefs(markTutorialSeen(store.prefs, tutorialInvite.run))}
        />
      ) : null}

      {payday.isAwaitingRollover ? (
        <Card tone="accent" style={styles.nudge}>
          <Text style={[textStyles.subhead, { color: c.text.primary }]}>
            Payday logged. Start your next pay cycle to apply this cycle&apos;s payments and get your next plan.
          </Text>
          <Button label="Start Next Pay Cycle" onPress={() => store_.getState().rolloverPayCycle()} style={styles.nudgeBtn} />
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
          onVerifyBalances={(entries, date) => store_.getState().verifyDebtBalances(entries, date)}
          onCapture={(items, decisions) => {
            store_.getState().capturePayday(items, decisions);
            payday.completeCapture();
            // Ask for a review ONCE, at a genuine success moment on an established user (not the first
            // cycle) — the persisted guard prevents re-prompting; iOS also throttles the real prompt.
            const st = store_.getState().store;
            if (st.cycleHistory.length >= 2 && !st.reviewPrompted) {
              store_.getState().markReviewPrompted();
              void maybeRequestReview();
            }
          }}
          onDismiss={payday.dismiss}
          onClose={payday.close}
        />
      ) : null}

      {paycheckSheet ? <PaycheckSheet onClose={() => setPaycheckSheet(false)} /> : null}
      {windfallSheet ? <WindfallSheet current={store.windfall ?? 0} onClose={() => setWindfallSheet(false)} /> : null}
      {/* Add-only here, so the schedule row never renders — but the handler is wired anyway so this host
          stays correct if Today ever opens an EXISTING debt (3.7.A0). Close first, then push: a presented
          Modal would occlude the route. */}
      {addDebtOpen ? (
        <DebtSheet
          editing={null}
          onClose={() => setAddDebtOpen(false)}
          onViewSchedule={(debtId) => {
            setAddDebtOpen(false);
            router.push(`/schedule/${debtId}`);
          }}
        />
      ) : null}
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
  flex: { flex: 1 },
  trust: { textAlign: 'center', marginTop: spacing.xs },
  ack: { gap: spacing.xs },
  ackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ackText: { flex: 1, fontWeight: '600' },
  ackActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});

/**
 * 3.5.3.1 — the Today ROUTE. Thin by design: it exists so the tutorial's `StoreProvider` and overlay
 * can sit ABOVE `TodayContent` (a component can't consume a context it renders itself), while Today
 * stays inside the TABS navigator.
 *
 * That last part is the constraint that shaped this: `useGoToTab` calls `useNavigation()` and only
 * behaves within the tab navigator — hosting a copy of Today inside the `/tutorial` Stack route would
 * resolve up through the root and land as a detached tab group, i.e. a blank screen on device
 * (Freedom RN lesson #7, cited in the hook's own doc). So the walkthrough is an overlay on the real
 * tab, never a second instance of it.
 */
export default function TodayScreen() {
  // Separate primitive selectors, NOT one object literal: a selector returning a fresh object every
  // render never compares equal, so zustand re-renders in a loop (and React warns the snapshot isn't
  // cached). Cheap mistake, expensive symptom — it took the whole screen down.
  const active = useTutorialSession((s) => s.active);
  const sandbox = useTutorialSession((s) => s.sandbox);
  const index = useTutorialSession((s) => s.index);

  if (!active || !sandbox) return <TodayContent />;

  // The registry only has to exist while a walkthrough is running — with no provider, every
  // `TutorialTarget` in the tree degrades to a plain View and registers nothing.
  return (
    <TutorialTargetsProvider>
      <TutorialRun sandbox={sandbox} index={index} />
    </TutorialTargetsProvider>
  );
}

/**
 * 3.5.3.3.1 — the running walkthrough: Today on sandbox data, with the beat's subject brought into the
 * stage and spotlit.
 *
 * Split out from `TodayScreen` because `useSpotlight` has to consume the targets context, and a
 * component cannot consume a context it renders itself.
 */
function TutorialRun({ sandbox, index }: { sandbox: DebtStoreInstance; index: number }) {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  // 3.5.3.5.7 — the overlay now lives above the navigator, so the two halves trade through the shell:
  // the dock's height comes DOWN (it bounds the stage), the located subject and the payoff go UP.
  const shell = useTutorialShell();
  const dockH = shell?.dockH ?? 0;

  const step = TUTORIAL_STEPS[index];
  // [C3] Scripted beats fence the screen off for touch; the a11y tree has to match.
  const interactive = INTERACTIVE_STEP_IDS.includes(step.id);

  // 3.5.3.4.4 — the payoff, computed by comparing the snapshot taken at the write against the plan the
  // sandbox re-solved to. Null until the user actually moves their line, so the beat opens as an
  // invitation and earns its result.
  const floorBefore = useTutorialSession((s) => s.floorBefore);
  // Select the STORE BLOB and derive outside the selector. `selectPaydayGuardian` builds a fresh object
  // every call, so selecting it directly would never compare equal — the same un-cached-snapshot loop
  // this screen already learned the hard way (see the note in `TodayScreen`). The blob is a stable
  // reference between updates, so the memo recomputes exactly when the plan actually changes.
  const sandboxStore = useStore(sandbox, (s) => s.store);
  const nowGuardian = useMemo(() => selectPaydayGuardian(sandboxStore), [sandboxStore]);
  // Withheld when nothing MOVED. The payoff bar exists to show a change, and `FloorImpactBar` scales to
  // `max(before, after)` — so an unchanged save drew a FULL accent bar captioned "Same cushion, same
  // plan", which is this app's most emphatic visual language celebrating a no-op. Opening the sheet and
  // closing it without dragging is a perfectly ordinary thing to do on this beat.
  const impact =
    floorBefore && nowGuardian && floorBefore.cushion !== nowGuardian.cushion
      ? {
          before: floorBefore.cushion,
          after: nowGuardian.cushion,
          // Lowering the line releases cushion to debt; raising it holds more back and frees nothing.
          freed: Math.max(0, floorBefore.cushion - nowGuardian.cushion),
        }
      : null;

  // The stage: below the screen header, above the coaching dock. The subject is scrolled to sit inside
  // it, which is what stops a beat from describing something hidden behind its own card.
  // 3.5.3.5.5 — once a beat's story has paid off, the spotlight FOLLOWS the result. Asked of the engine's
  // own selector on the sandbox — the same one Today renders the ack from — rather than of a flag the
  // tutorial sets, so the highlight can't claim a payoff the screen isn't showing.
  // [B1/B2] EITHER ack counts as the payoff. Beat 4's story produces two in sequence — the walk-back
  // when the surprise proves the bills weren't complete, then the release three paydays later — and a
  // spotlight that only tracked the release left the first one unspotlit and off-screen. [B2] also has
  // the milestone ack outranking both, so `pendingMilestone` is suppressed for the sandbox at source
  // rather than papered over here.
  const payoffShowing = !!selectReserveRelease(sandboxStore) || !!selectReserveWalkback(sandboxStore);
  const targetId = (payoffShowing && step.payoffTarget) || step.target || null;

  // Destructured, never held as the object: `useSpotlight` returns a fresh one each render, and the
  // publish effect below depends on what it returns. Passing the object straight through would re-fire
  // that effect every render and re-render the shell — the same fresh-value re-render loop that took the
  // whole tutorial suite down at 3.5.3.2.
  // Through `stageBounds`, not re-derived. The screen scrolls the subject INTO the stage and the overlay
  // clamps what it DRAWS to the same stage; if the two ever compute it differently, the highlight is
  // clipped to a band the subject was never scrolled into — which is exactly the defect the clamp exists
  // to fix. Sharing `headerHeight` alone left the dock edge — the edge that matters — written twice.
  const stage = stageBounds(insets.top, screenH, dockH);
  const { rect: spotlight, measuredAt } = useSpotlight({
    targetId,
    stageTop: stage.top,
    stageBottom: stage.bottom,
    scrollRef,
    offsetRef,
    // Must include the beat INDEX, not just the target: consecutive beats can share a subject while
    // 3.5.3.3.2 re-stages the sandbox underneath it (recovery → yourcall are both the whole card, and
    // the card changes height between at-risk and clear). Keyed on target alone, the highlight would
    // keep the previous state's geometry. The dock is in here too — it resizes with its own copy.
    // The payoff flips the subject mid-beat, so it has to be part of the re-measure key.
    revision: `${index}:${dockH}:${payoffShowing}`,
  });

  // Publish what only this screen can know. Effects rather than render-time calls: setting a parent's
  // state during a child's render is the classic React warning, and here it would fire on every measure.
  const setSpotlight = shell?.setSpotlight;
  const setPassThrough = shell?.setPassThrough;
  const setImpact = shell?.setImpact;
  // [C2] Announce the PAYOFF, not just the beat. There was exactly one `announce()` in the whole
  // tutorial path — the per-beat one — so beat 4's scripted story (a surprise absorbed, three paydays
  // rolled, an ack appearing at the TOP of the screen) produced nothing at all for a VoiceOver user.
  // A sighted user gets the scroll-up and the ring moving; they got silence and no reason to go looking.
  // Same failure as the shipped silent walkthrough, one level down: per-beat announced, per-EVENT not.
  const ackText = useStore(sandbox, (s) => {
    const release = selectReserveRelease(s.store);
    if (release) {
      return release.tapped
        ? `Your safety net covered about $${Math.round(release.covered)} while your Guardian learned your bills. It is now going to work on ${release.targetName}.`
        : `Your safety net is free — it is now going to work on ${release.targetName}.`;
    }
    return selectReserveWalkback(s.store) ? 'A surprise bill came up — your Guardian has restored your safety net for now.' : null;
  });
  useEffect(() => {
    if (ackText) announce(ackText);
  }, [ackText]);

  useEffect(() => {
    setSpotlight?.(spotlight);
    // 3.5.3.6.1 — release it on the way out. The overlay stops rendering when the session ends, so a
    // stale rect is invisible rather than harmful — but leaving one parked means the NEXT session's
    // first frame can draw a ring at the last session's coordinates before its own measure lands.
    return () => setSpotlight?.(null);
  }, [setSpotlight, spotlight]);

  // The touch hole follows the CONTROL, not the spotlight. On beat 4 the spotlight deliberately moves off
  // the attestation onto the payoff ack (3.5.3.5.5) — but the beat is still flagged interactive, so the
  // hole moved with it and left the ack's "Got it" button live in the middle of the scripted story.
  // Tapping it dismissed the walkback mid-narration: the spotlight scrolled back down to the control,
  // then jumped up again when the release landed, and the user could swallow the beat's entire payoff
  // before reading it. `passThrough` is about reachability; once the hole is over something to READ, it
  // has no business passing touches.
  //
  // ONE expression, used by the touch fence AND the a11y fence below, because they must never disagree.
  // Round 6: they did. The a11y fence keyed on `interactive` alone, so through beat 4's whole payoff the
  // screen was sealed for fingers and open to VoiceOver — and the ack's own "Got it" was reachable by
  // exactly the double-tap this `passThrough` change exists to prevent, dismissing the payoff mid-
  // narration for the one user who couldn't see it happen. Two predicates for one fence is how that
  // gap opens; deriving both from this is how it stays shut.
  //
  // …and never while the published geometry is known-stale. A rotation or an iPad Split View drag
  // re-lays out the whole screen: the overlay's origin updates on that layout pass, but the subject's
  // rect only updates after a fresh measure completes. In between, the open hole sits at
  // `newOrigin − oldSpotlight` — over whatever now occupies that region, which on iPad is plausibly the
  // other column. Fencing until a rect lands under the current dimensions closes the window, and doing
  // it HERE means the a11y fence closes with it rather than needing its own copy of the rule.
  const dims = `${Math.round(screenW)}x${Math.round(screenH)}`;
  const [settledDims, setSettledDims] = useState(dims);
  // Keyed on the measurement CONCLUDING, not on a rect arriving, and deliberately NOT on `dims`.
  //
  // Not on `dims`, because the dimension change that is supposed to CLOSE this fence would re-run the
  // effect and stamp the new dims against the pre-rotation rect — reopening on the commit after it
  // closed, which is one render of protection.
  //
  // On `measuredAt` rather than `spotlight`, because a measurement can legitimately conclude with NO
  // rect (the settle re-measure fires on the beat's heaviest frame and is the likeliest to time out).
  // Keyed on the rect, that outcome never reopened the fence at all: `screenReachable` stayed false for
  // the rest of the beat, and since it gates both the touch pass-through and `useInert`, an interactive
  // beat asked the user to operate a control on a screen that was inert and untouchable. Without a
  // rotation the identical timeout costs only the ring — this made the same event cost the whole beat.
  useEffect(() => {
    setSettledDims(dims);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measuredAt]);

  const screenReachable = interactive && !payoffShowing && settledDims === dims;
  useEffect(() => {
    setPassThrough?.(screenReachable);
    return () => setPassThrough?.(false);
  }, [setPassThrough, screenReachable]);

  // `aria-hidden` alone leaves the fenced screen tabbable on web — see `useInert`. Same expression as
  // the a11y fence below, for the reason stated there.
  const fenceRef = useRef<View>(null);
  useInert(fenceRef, !screenReachable);

  // Publish which subject this beat coaches, so every OTHER coachable control can fence itself out of
  // the accessibility tree (see `TutorialTarget`'s `control` prop). `targetId` already accounts for the
  // payoff, so once the spotlight moves onto the ack, both controls fence — which is right: nothing on
  // that screen is asking to be operated while the story plays.
  const setActiveId = useTutorialTargets()?.setActiveId;
  useEffect(() => {
    setActiveId?.(targetId);
    return () => setActiveId?.(null);
  }, [setActiveId, targetId]);
  useEffect(() => {
    setImpact?.(impact);
    // Released on the way out, like every value this screen publishes to the shell. The shell lives at
    // the root for the app's lifetime and `end()` clears nothing in it, so a parked value survives the
    // session — an un-released `impact` had beat 1's dock painting a `FloorImpactBar` ("frees $X") the
    // user never earned.
    return () => setImpact?.(null);
  }, [setImpact, impact?.before, impact?.after, impact?.freed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Beat 3's payoff, announced. [C2] gave beat 4's ack story a voice and left this one silent — the
  // same gap, one beat over, inside the fix for it. A sighted user watches the impact bar spring after
  // they save; a VoiceOver user who just moved their own line heard nothing at all unless they thought
  // to go re-read the dock. The payoff of an action the walkthrough ASKED them to take is the last
  // thing that should be delivered visually only.
  // Only when it actually MOVED. Saving the sheet without touching the slider still writes the store, so
  // the un-branched version announced "Your line moved" to the one user who can't see that it didn't.
  const impactText =
    impact && impact.before !== impact.after
      ? impact.freed > 0
        ? `Your line moved. That frees $${Math.round(impact.freed)} more for your debt this paycheck.`
        : `Your line moved. Your Guardian is holding $${Math.round(impact.after - impact.before)} more back.`
      : null;
  useEffect(() => {
    if (impactText) announce(impactText);
  }, [impactText]);

  return (
    <StoreProvider store={sandbox}>
      {/* [C3] The scrim blocks TOUCH but nothing blocked the accessibility tree — no
          `accessibilityViewIsModal` existed anywhere in src — so a VoiceOver user could swipe through
          everything a sighted user is deliberately fenced out of, including More. On a scripted beat the
          coached screen is hidden from the a11y tree entirely (the coaching dock lives above this, at the
          root, so it stays reachable). On an INTERACTIVE beat it must stay exposed: the whole point is
          that the user reaches the real control, and a screen reader has to be able to as well.
          Keyed on `screenReachable` — the SAME expression as the touch fence, deliberately; see there. */}
      <View ref={fenceRef} style={styles.flex} {...a11yHidden(!screenReachable)}>
      <TodayContent
        scrollRef={scrollRef}
        onScroll={(e) => {
          offsetRef.current = e.nativeEvent.contentOffset.y;
        }}
      />
      </View>
    </StoreProvider>
  );
}
