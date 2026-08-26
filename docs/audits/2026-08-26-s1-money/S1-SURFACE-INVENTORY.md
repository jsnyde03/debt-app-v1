# S1 surface inventory — money · goals · plan cards

> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s1-coverage` writes it from
> `scripts/surface-coverage.s1.json`. [D69] needs *"first look"* to be a lookup rather than an
> auditor's claim; this is the lookup.
>
> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**
> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being
> measured wrong — see the docstring in `scripts/surface-coverage.ts`.

**72 files on the S1 surface · 14 swept · 58 unswept.**

`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.

| file | swept by |
|---|---|
| `apps/rn/src/app/(tabs)/money.tsx` | r10 |
| `apps/rn/src/components/entities/AddObligationSheet.tsx` | ⛔ **partial** |
| `apps/rn/src/components/entities/AmortizationView.tsx` | ⛔ **never** |
| `apps/rn/src/components/entities/DebtSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/entities/ExpenseSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/entities/GoalSheet.tsx` | r17 |
| `apps/rn/src/components/entities/ImportDebtsSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/entities/LogPaymentSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/AffordabilityCard.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/AffordabilityImpactBar.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CaptureSlate.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CashRunwayCanvas.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CashRunwayChart.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CushionBarCanvas.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CushionBarCanvas.web.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CushionBarChart.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/CushionFloorSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/DataRepairsCard.tsx` | r10 · r17 |
| `apps/rn/src/components/plan/FloorImpactBar.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/GraduationCards.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/GuardianProofStrip.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/GuardianScorecard.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/LeanSuggestionCard.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/MeshGradientCanvas.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/MeshGradientChart.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/MilestoneAckCard.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/PaidOffBeat.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/PaidOffFinale.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/PaycheckSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/PayoffInvitationCard.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/PlanHero.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/RecommendedActionsCard.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/RecoveryPlanSection.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/SaveForItSheet.tsx` | r17 |
| `apps/rn/src/components/plan/ShareCard.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/SpokenForSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/plan/WindfallSheet.tsx` | ⛔ **partial** |
| `apps/rn/src/components/plan/dataRepairsCopy.test.ts` | r17 |
| `apps/rn/src/components/plan/dataRepairsCopy.ts` | r17 |
| `apps/rn/src/components/plan/useCaptureAutoConfirm.ts` | ⛔ **never** |
| `apps/rn/src/data/migrations.test.ts` | ⛔ **never** |
| `apps/rn/src/data/migrations.ts` | r10 |
| `apps/rn/src/data/models.ts` | r17 |
| `apps/rn/src/store/guardianSelectors.test.ts` | ⛔ **never** |
| `apps/rn/src/store/guardianSelectors.ts` | r17 |
| `apps/rn/src/store/journeySelectors.test.ts` | r17 |
| `apps/rn/src/store/journeySelectors.ts` | r17 |
| `apps/rn/src/store/planSelectors.ts` | ⛔ **never** |
| `apps/rn/src/store/store.ts` | ⛔ **partial** |
| `packages/core/engine/allocatePaycheck.ts` | r17 |
| `packages/core/engine/emergencyFund.ts` | r17 |
| `packages/core/engine/recommendedActions.ts` | ⛔ **never** |
| `packages/core/engine/testAllocation.ts` | r17 |
| `packages/core/engine/testExpenseReserve.ts` | ⛔ **never** |
| `packages/core/guardian/affordability.ts` | ⛔ **never** |
| `packages/core/guardian/buildGuardianBrief.ts` | ⛔ **never** |
| `packages/core/guardian/calibrationScore.ts` | ⛔ **never** |
| `packages/core/guardian/computeState.ts` | ⛔ **never** |
| `packages/core/guardian/holdbackComposition.ts` | ⛔ **never** |
| `packages/core/guardian/notificationDecision.ts` | ⛔ **never** |
| `packages/core/guardian/testAffordability.ts` | ⛔ **never** |
| `packages/core/guardian/testBuildGuardianBrief.ts` | ⛔ **never** |
| `packages/core/guardian/testCalibrationScore.ts` | ⛔ **never** |
| `packages/core/guardian/testComputeState.ts` | ⛔ **never** |
| `packages/core/guardian/testGuardianPartition.ts` | ⛔ **never** |
| `packages/core/guardian/testNotificationDecision.ts` | ⛔ **never** |

## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]

- `apps/rn/src/components/entities/AddObligationSheet.tsx`
- `apps/rn/src/components/entities/AmortizationView.tsx`
- `apps/rn/src/components/entities/DebtSheet.tsx`
- `apps/rn/src/components/entities/ExpenseSheet.tsx`
- `apps/rn/src/components/entities/ImportDebtsSheet.tsx`
- `apps/rn/src/components/entities/LivingExpenseSheet.tsx`
- `apps/rn/src/components/entities/LogPaymentSheet.tsx`
- `apps/rn/src/components/plan/AffordabilityCard.tsx`
- `apps/rn/src/components/plan/AffordabilityImpactBar.tsx`
- `apps/rn/src/components/plan/CaptureSlate.tsx`
- `apps/rn/src/components/plan/CashRunwayCanvas.tsx`
- `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx`
- `apps/rn/src/components/plan/CashRunwayChart.tsx`
- `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx`
- `apps/rn/src/components/plan/CushionBarCanvas.tsx`
- `apps/rn/src/components/plan/CushionBarCanvas.web.tsx`
- `apps/rn/src/components/plan/CushionBarChart.tsx`
- `apps/rn/src/components/plan/CushionFloorSheet.tsx`
- `apps/rn/src/components/plan/FloorImpactBar.tsx`
- `apps/rn/src/components/plan/GraduationCards.tsx`
- `apps/rn/src/components/plan/GuardianProofStrip.tsx`
- `apps/rn/src/components/plan/GuardianScorecard.tsx`
- `apps/rn/src/components/plan/LeanSuggestionCard.tsx`
- `apps/rn/src/components/plan/MeshGradientCanvas.tsx`
- `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx`
- `apps/rn/src/components/plan/MeshGradientChart.tsx`
- `apps/rn/src/components/plan/MilestoneAckCard.tsx`
- `apps/rn/src/components/plan/PaidOffBeat.tsx`
- `apps/rn/src/components/plan/PaidOffFinale.tsx`
- `apps/rn/src/components/plan/PaycheckSheet.tsx`
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx`
- `apps/rn/src/components/plan/PayoffInvitationCard.tsx`
- `apps/rn/src/components/plan/PlanHero.tsx`
- `apps/rn/src/components/plan/RecommendedActionsCard.tsx`
- `apps/rn/src/components/plan/RecoveryPlanSection.tsx`
- `apps/rn/src/components/plan/RequiredActionsCard.tsx`
- `apps/rn/src/components/plan/ShareCard.tsx`
- `apps/rn/src/components/plan/SpokenForSheet.tsx`
- `apps/rn/src/components/plan/WindfallSheet.tsx`
- `apps/rn/src/components/plan/useCaptureAutoConfirm.ts`
- `apps/rn/src/data/migrations.test.ts`
- `apps/rn/src/store/guardianSelectors.test.ts`
- `apps/rn/src/store/planSelectors.ts`
- `apps/rn/src/store/store.ts`
- `packages/core/engine/recommendedActions.ts`
- `packages/core/engine/testExpenseReserve.ts`
- `packages/core/guardian/affordability.ts`
- `packages/core/guardian/buildGuardianBrief.ts`
- `packages/core/guardian/calibrationScore.ts`
- `packages/core/guardian/computeState.ts`
- `packages/core/guardian/holdbackComposition.ts`
- `packages/core/guardian/notificationDecision.ts`
- `packages/core/guardian/testAffordability.ts`
- `packages/core/guardian/testBuildGuardianBrief.ts`
- `packages/core/guardian/testCalibrationScore.ts`
- `packages/core/guardian/testComputeState.ts`
- `packages/core/guardian/testGuardianPartition.ts`
- `packages/core/guardian/testNotificationDecision.ts`

