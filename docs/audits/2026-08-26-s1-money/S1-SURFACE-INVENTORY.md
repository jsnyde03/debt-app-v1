# S1 surface inventory — money · goals · plan cards

> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s1-coverage` writes it from
> `scripts/surface-coverage.s1.json`. [D69] needs *"first look"* to be a lookup rather than an
> auditor's claim; this is the lookup.
>
> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**
> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being
> measured wrong — see the docstring in `scripts/surface-coverage.ts`.

**137 files on the S1 surface · 72 swept · 65 unswept.**

`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.

| file | swept by |
|---|---|
| `apps/rn/src/app/(tabs)/_layout.tsx` | ⛔ **never** |
| `apps/rn/src/app/(tabs)/index.tsx` | ⛔ **never** |
| `apps/rn/src/app/(tabs)/money.tsx` | r10 · s1p1 |
| `apps/rn/src/app/(tabs)/progress.tsx` | ⛔ **never** |
| `apps/rn/src/components/entities/AddObligationSheet.tsx` | partial · s1p1 |
| `apps/rn/src/components/entities/AmortizationView.tsx` | never · s1p1 |
| `apps/rn/src/components/entities/DebtSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/entities/ExpenseSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/entities/GoalSheet.tsx` | r17 · s1p1 |
| `apps/rn/src/components/entities/ImportDebtsSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/entities/LogPaymentSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/AffordabilityCard.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/AffordabilityImpactBar.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CaptureSlate.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CashRunwayCanvas.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CashRunwayChart.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CushionBarCanvas.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CushionBarCanvas.web.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CushionBarChart.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CushionFloorSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/DataRepairsCard.tsx` | r10 · r17 |
| `apps/rn/src/components/plan/FloorImpactBar.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/GraduationCards.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/GuardianProofStrip.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/GuardianScorecard.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/LeanSuggestionCard.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/MeshGradientCanvas.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/MeshGradientChart.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/MilestoneAckCard.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/PaidOffBeat.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/PaidOffFinale.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/PaycheckSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/PayoffInvitationCard.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/PlanHero.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/RecommendedActionsCard.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/RecoveryPlanSection.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/SaveForItSheet.tsx` | r17 |
| `apps/rn/src/components/plan/ShareCard.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/SpokenForSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/WindfallSheet.tsx` | partial · s1p1 |
| `apps/rn/src/components/plan/dataRepairsCopy.test.ts` | r17 |
| `apps/rn/src/components/plan/dataRepairsCopy.ts` | r17 |
| `apps/rn/src/components/plan/useCaptureAutoConfirm.ts` | never · s1p1 |
| `apps/rn/src/data/defaults.ts` | ⛔ **never** |
| `apps/rn/src/data/migrations.test.ts` | never · s1p1 |
| `apps/rn/src/data/migrations.ts` | r10 |
| `apps/rn/src/data/models.ts` | r17 |
| `apps/rn/src/store/StoreContext.tsx` | ⛔ **never** |
| `apps/rn/src/store/affordability.test.ts` | ⛔ **never** |
| `apps/rn/src/store/analysisSelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/appStore.ts` | ⛔ **never** |
| `apps/rn/src/store/balanceSelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/bnplCadence.test.ts` | ⛔ **never** |
| `apps/rn/src/store/boundedRun.ts` | ⛔ **never** |
| `apps/rn/src/store/celebrationSelectors.test.ts` | ⛔ **never** |
| `apps/rn/src/store/celebrationSelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/debtFreeBand.test.ts` | ⛔ **never** |
| `apps/rn/src/store/debtIds.test.ts` | ⛔ **never** |
| `apps/rn/src/store/debtIds.ts` | ⛔ **never** |
| `apps/rn/src/store/drift.ts` | ⛔ **never** |
| `apps/rn/src/store/expenseReserve.test.ts` | ⛔ **never** |
| `apps/rn/src/store/expenseReserveSelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/forecastCycles.ts` | ⛔ **never** |
| `apps/rn/src/store/glossary.test.ts` | ⛔ **never** |
| `apps/rn/src/store/greeting.test.ts` | ⛔ **never** |
| `apps/rn/src/store/greeting.ts` | ⛔ **never** |
| `apps/rn/src/store/guardianPrediction.test.ts` | ⛔ **never** |
| `apps/rn/src/store/guardianPrediction.ts` | ⛔ **never** |
| `apps/rn/src/store/guardianPredictionCore.ts` | ⛔ **never** |
| `apps/rn/src/store/guardianSelectors.test.ts` | never · s1p1 |
| `apps/rn/src/store/guardianSelectors.ts` | r17 · s1p1 |
| `apps/rn/src/store/guardianSubjects.test.ts` | ⛔ **never** |
| `apps/rn/src/store/guardianSubjects.ts` | ⛔ **never** |
| `apps/rn/src/store/historySelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/incomeLearning.ts` | ⛔ **never** |
| `apps/rn/src/store/journeySelectors.test.ts` | r17 |
| `apps/rn/src/store/journeySelectors.ts` | r17 · s1p1 |
| `apps/rn/src/store/looksLikeDebt.test.ts` | ⛔ **never** |
| `apps/rn/src/store/looksLikeDebt.ts` | ⛔ **never** |
| `apps/rn/src/store/milestoneCross.test.ts` | ⛔ **never** |
| `apps/rn/src/store/obligationForm.ts` | ⛔ **never** |
| `apps/rn/src/store/onboardingFinish.test.ts` | ⛔ **never** |
| `apps/rn/src/store/onboardingFinish.ts` | ⛔ **never** |
| `apps/rn/src/store/paycheckForm.test.ts` | ⛔ **never** |
| `apps/rn/src/store/paycheckForm.ts` | ⛔ **never** |
| `apps/rn/src/store/payday.ts` | ⛔ **never** |
| `apps/rn/src/store/payoffCelebration.test.ts` | ⛔ **never** |
| `apps/rn/src/store/payoffCelebration.ts` | ⛔ **never** |
| `apps/rn/src/store/payoffSelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/paywallLead.test.ts` | ⛔ **never** |
| `apps/rn/src/store/paywallLead.ts` | ⛔ **never** |
| `apps/rn/src/store/persistence.ts` | ⛔ **never** |
| `apps/rn/src/store/persistenceLifecycle.test.ts` | ⛔ **never** |
| `apps/rn/src/store/planSelectors.test.ts` | ⛔ **never** |
| `apps/rn/src/store/planSelectors.ts` | never · s1p1 |
| `apps/rn/src/store/projectedIncome.test.ts` | ⛔ **never** |
| `apps/rn/src/store/projectedIncome.ts` | ⛔ **never** |
| `apps/rn/src/store/proofOfWork.test.ts` | ⛔ **never** |
| `apps/rn/src/store/realWriteGuard.test.ts` | ⛔ **never** |
| `apps/rn/src/store/realWriteGuard.ts` | ⛔ **never** |
| `apps/rn/src/store/recoverySelectors.test.ts` | ⛔ **never** |
| `apps/rn/src/store/recoverySelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/selectors.ts` | ⛔ **never** |
| `apps/rn/src/store/steadyStateProjection.test.ts` | ⛔ **never** |
| `apps/rn/src/store/store.ts` | partial · s1p1 |
| `apps/rn/src/store/storeActions.test.ts` | ⛔ **never** |
| `apps/rn/src/store/storeContext.test.ts` | ⛔ **never** |
| `apps/rn/src/store/substrateProducers.test.ts` | ⛔ **never** |
| `apps/rn/src/store/substrateProducers.ts` | ⛔ **never** |
| `apps/rn/src/store/topUpSelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/trustSelectors.test.ts` | ⛔ **never** |
| `apps/rn/src/store/trustSelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/useAppStore.ts` | ⛔ **never** |
| `apps/rn/src/store/windfallSplit.test.ts` | ⛔ **never** |
| `packages/core/engine/allocatePaycheck.ts` | r17 |
| `packages/core/engine/emergencyFund.ts` | r17 |
| `packages/core/engine/recommendedActions.ts` | never · s1p1 |
| `packages/core/engine/testAllocation.ts` | r17 |
| `packages/core/engine/testExpenseReserve.ts` | never · s1p1 |
| `packages/core/guardian/affordability.ts` | never · s1p1 |
| `packages/core/guardian/buildGuardianBrief.ts` | never · s1p1 |
| `packages/core/guardian/calibrationScore.ts` | never · s1p1 |
| `packages/core/guardian/computeState.ts` | never · s1p1 |
| `packages/core/guardian/holdbackComposition.ts` | never · s1p1 |
| `packages/core/guardian/notificationDecision.ts` | never · s1p1 |
| `packages/core/guardian/testAffordability.ts` | never · s1p1 |
| `packages/core/guardian/testBuildGuardianBrief.ts` | never · s1p1 |
| `packages/core/guardian/testCalibrationScore.ts` | never · s1p1 |
| `packages/core/guardian/testComputeState.ts` | never · s1p1 |
| `packages/core/guardian/testGuardianPartition.ts` | never · s1p1 |
| `packages/core/guardian/testNotificationDecision.ts` | never · s1p1 |

## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]

- `apps/rn/src/app/(tabs)/_layout.tsx`
- `apps/rn/src/app/(tabs)/index.tsx`
- `apps/rn/src/app/(tabs)/progress.tsx`
- `apps/rn/src/data/defaults.ts`
- `apps/rn/src/store/StoreContext.tsx`
- `apps/rn/src/store/affordability.test.ts`
- `apps/rn/src/store/analysisSelectors.ts`
- `apps/rn/src/store/appStore.ts`
- `apps/rn/src/store/balanceSelectors.ts`
- `apps/rn/src/store/bnplCadence.test.ts`
- `apps/rn/src/store/boundedRun.ts`
- `apps/rn/src/store/celebrationSelectors.test.ts`
- `apps/rn/src/store/celebrationSelectors.ts`
- `apps/rn/src/store/debtFreeBand.test.ts`
- `apps/rn/src/store/debtIds.test.ts`
- `apps/rn/src/store/debtIds.ts`
- `apps/rn/src/store/drift.ts`
- `apps/rn/src/store/expenseReserve.test.ts`
- `apps/rn/src/store/expenseReserveSelectors.ts`
- `apps/rn/src/store/forecastCycles.ts`
- `apps/rn/src/store/glossary.test.ts`
- `apps/rn/src/store/greeting.test.ts`
- `apps/rn/src/store/greeting.ts`
- `apps/rn/src/store/guardianPrediction.test.ts`
- `apps/rn/src/store/guardianPrediction.ts`
- `apps/rn/src/store/guardianPredictionCore.ts`
- `apps/rn/src/store/guardianSubjects.test.ts`
- `apps/rn/src/store/guardianSubjects.ts`
- `apps/rn/src/store/historySelectors.ts`
- `apps/rn/src/store/incomeLearning.ts`
- `apps/rn/src/store/looksLikeDebt.test.ts`
- `apps/rn/src/store/looksLikeDebt.ts`
- `apps/rn/src/store/milestoneCross.test.ts`
- `apps/rn/src/store/obligationForm.ts`
- `apps/rn/src/store/onboardingFinish.test.ts`
- `apps/rn/src/store/onboardingFinish.ts`
- `apps/rn/src/store/paycheckForm.test.ts`
- `apps/rn/src/store/paycheckForm.ts`
- `apps/rn/src/store/payday.ts`
- `apps/rn/src/store/payoffCelebration.test.ts`
- `apps/rn/src/store/payoffCelebration.ts`
- `apps/rn/src/store/payoffSelectors.ts`
- `apps/rn/src/store/paywallLead.test.ts`
- `apps/rn/src/store/paywallLead.ts`
- `apps/rn/src/store/persistence.ts`
- `apps/rn/src/store/persistenceLifecycle.test.ts`
- `apps/rn/src/store/planSelectors.test.ts`
- `apps/rn/src/store/projectedIncome.test.ts`
- `apps/rn/src/store/projectedIncome.ts`
- `apps/rn/src/store/proofOfWork.test.ts`
- `apps/rn/src/store/realWriteGuard.test.ts`
- `apps/rn/src/store/realWriteGuard.ts`
- `apps/rn/src/store/recoverySelectors.test.ts`
- `apps/rn/src/store/recoverySelectors.ts`
- `apps/rn/src/store/selectors.ts`
- `apps/rn/src/store/steadyStateProjection.test.ts`
- `apps/rn/src/store/storeActions.test.ts`
- `apps/rn/src/store/storeContext.test.ts`
- `apps/rn/src/store/substrateProducers.test.ts`
- `apps/rn/src/store/substrateProducers.ts`
- `apps/rn/src/store/topUpSelectors.ts`
- `apps/rn/src/store/trustSelectors.test.ts`
- `apps/rn/src/store/trustSelectors.ts`
- `apps/rn/src/store/useAppStore.ts`
- `apps/rn/src/store/windfallSplit.test.ts`

