# S1 surface inventory — money · goals · plan cards

> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s1-coverage` writes it from
> `scripts/surface-coverage.s1.json`. [D69] needs *"first look"* to be a lookup rather than an
> auditor's claim; this is the lookup.
>
> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**
> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being
> measured wrong — see the docstring in `scripts/surface-coverage.ts`.

**470 files on the S1 surface · 139 swept · 331 unswept.**

`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.

| file | swept by |
|---|---|
| `apps/rn/src/analytics/funnel.test.ts` | ⛔ **never** |
| `apps/rn/src/analytics/funnel.ts` | ⛔ **never** |
| `apps/rn/src/app/(tabs)/_layout.tsx` | ⛔ **never** |
| `apps/rn/src/app/(tabs)/index.tsx` | s1p2 |
| `apps/rn/src/app/(tabs)/money.tsx` | r10 · s1p1 · s1p2 |
| `apps/rn/src/app/(tabs)/progress.tsx` | s1p2 |
| `apps/rn/src/app/+not-found.tsx` | ⛔ **never** |
| `apps/rn/src/app/_layout.tsx` | ⛔ **never** |
| `apps/rn/src/app/cushion-forecast.tsx` | s1p2 |
| `apps/rn/src/app/demo.tsx` | ⛔ **never** |
| `apps/rn/src/app/history.tsx` | ⛔ **never** |
| `apps/rn/src/app/living-expenses.tsx` | ⛔ **never** |
| `apps/rn/src/app/more.tsx` | ⛔ **never** |
| `apps/rn/src/app/onboarding.tsx` | ⛔ **never** |
| `apps/rn/src/app/paywall.tsx` | ⛔ **never** |
| `apps/rn/src/app/schedule/[id].tsx` | ⛔ **never** |
| `apps/rn/src/app/tutorial.tsx` | ⛔ **never** |
| `apps/rn/src/appIntents/drainPendingActions.ts` | ⛔ **never** |
| `apps/rn/src/appIntents/pendingActionBridge.native.ts` | ⛔ **never** |
| `apps/rn/src/appIntents/pendingActionBridge.ts` | ⛔ **never** |
| `apps/rn/src/appIntents/pendingActionBridge.types.ts` | ⛔ **never** |
| `apps/rn/src/appIntents/pendingActions.test.ts` | ⛔ **never** |
| `apps/rn/src/appIntents/pendingActions.ts` | ⛔ **never** |
| `apps/rn/src/components/AppLockGate.tsx` | ⛔ **never** |
| `apps/rn/src/components/DataResetScreen.tsx` | ⛔ **never** |
| `apps/rn/src/components/SaveFailedBanner.tsx` | ⛔ **never** |
| `apps/rn/src/components/StorageErrorScreen.tsx` | ⛔ **never** |
| `apps/rn/src/components/entities/AddObligationSheet.tsx` | partial · s1p1 |
| `apps/rn/src/components/entities/AmortizationView.tsx` | never · s1p1 |
| `apps/rn/src/components/entities/DebtSheet.tsx` | s1p1 · s1p2 |
| `apps/rn/src/components/entities/ExpenseSheet.tsx` | s1p1 · s1p2 |
| `apps/rn/src/components/entities/GoalSheet.tsx` | r17 · s1p1 · s1p2 |
| `apps/rn/src/components/entities/ImportDebtsSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/entities/LogPaymentSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/money/AllocationBarCanvas.tsx` | ⛔ **never** |
| `apps/rn/src/components/money/AllocationBarCanvas.web.tsx` | ⛔ **never** |
| `apps/rn/src/components/money/AllocationBarChart.tsx` | ⛔ **never** |
| `apps/rn/src/components/money/BillBreakdownSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/money/BnplCalendarSection.tsx` | ⛔ **never** |
| `apps/rn/src/components/more-button.tsx` | ⛔ **never** |
| `apps/rn/src/components/more/BackupSheets.tsx` | ⛔ **never** |
| `apps/rn/src/components/more/CloudBackupSheet.tsx` | ⛔ **never** |
| `apps/rn/src/components/more/CoachMarkProbeReadout.tsx` | ⛔ **never** |
| `apps/rn/src/components/more/LegacyBridgeProbeReadout.tsx` | ⛔ **never** |
| `apps/rn/src/components/more/LiveActivityQA.tsx` | ⛔ **never** |
| `apps/rn/src/components/more/ReduceMotionProbeReadout.tsx` | ⛔ **never** |
| `apps/rn/src/components/more/SettingRow.tsx` | ⛔ **never** |
| `apps/rn/src/components/onboarding/CompletionStep.tsx` | ⛔ **never** |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx` | ⛔ **never** |
| `apps/rn/src/components/onboarding/OnboardingLayout.tsx` | ⛔ **never** |
| `apps/rn/src/components/onboarding/PaycheckStep.tsx` | ⛔ **never** |
| `apps/rn/src/components/onboarding/WelcomeStep.tsx` | ⛔ **never** |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx` | s1p2 |
| `apps/rn/src/components/payoff/StrategyCompare.tsx` | ⛔ **never** |
| `apps/rn/src/components/payoff/TrajectoryCanvas.tsx` | ⛔ **never** |
| `apps/rn/src/components/payoff/TrajectoryCanvas.web.tsx` | ⛔ **never** |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx` | ⛔ **never** |
| `apps/rn/src/components/payoff/TrajectorySkiaChart.tsx` | ⛔ **never** |
| `apps/rn/src/components/payoff/WhatIfControls.tsx` | ⛔ **never** |
| `apps/rn/src/components/payoff/compareStrategies.test.ts` | ⛔ **never** |
| `apps/rn/src/components/payoff/compareStrategies.ts` | ⛔ **never** |
| `apps/rn/src/components/payoff/monthLabels.test.ts` | ⛔ **never** |
| `apps/rn/src/components/payoff/monthLabels.ts` | ⛔ **never** |
| `apps/rn/src/components/payoff/trajectoryDomain.test.ts` | ⛔ **never** |
| `apps/rn/src/components/payoff/trajectoryDomain.ts` | ⛔ **never** |
| `apps/rn/src/components/plan/AffordabilityCard.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/AffordabilityImpactBar.tsx` | s1p1 · s1p2 |
| `apps/rn/src/components/plan/CaptureSlate.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CashRunwayCanvas.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CashRunwayChart.tsx` | s1p1 · s1p2 |
| `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CushionBarCanvas.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CushionBarCanvas.web.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CushionBarChart.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/CushionFloorSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/DataRepairsCard.tsx` | r10 · r17 · s1p2 |
| `apps/rn/src/components/plan/FloorImpactBar.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/GraduationCards.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/GuardianProofStrip.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/GuardianScorecard.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/LeanSuggestionCard.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/MeshGradientCanvas.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/MeshGradientChart.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/MilestoneAckCard.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/PaidOffBeat.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/PaidOffFinale.tsx` | s1p1 · s1p2 |
| `apps/rn/src/components/plan/PaycheckSheet.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/PayoffInvitationCard.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/PlanHero.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/RecommendedActionsCard.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/RecoveryPlanSection.tsx` | s1p1 · s1p2 |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx` | s1p1 · s1p2 |
| `apps/rn/src/components/plan/SaveForItSheet.tsx` | r17 |
| `apps/rn/src/components/plan/ShareCard.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/SpokenForSheet.tsx` | s1p1 · s1p2 |
| `apps/rn/src/components/plan/WindfallSheet.tsx` | partial · s1p1 · s1p2 |
| `apps/rn/src/components/plan/dataRepairsCopy.test.ts` | r17 |
| `apps/rn/src/components/plan/dataRepairsCopy.ts` | r17 · s1p2 |
| `apps/rn/src/components/plan/useCaptureAutoConfirm.ts` | never · s1p1 |
| `apps/rn/src/components/premium/PremiumInvite.tsx` | ⛔ **never** |
| `apps/rn/src/components/progress/CashFlowSection.tsx` | s1p2 |
| `apps/rn/src/components/progress/JourneyRingCanvas.tsx` | ⛔ **never** |
| `apps/rn/src/components/progress/JourneyRingCanvas.web.tsx` | ⛔ **never** |
| `apps/rn/src/components/progress/JourneyRingChart.tsx` | ⛔ **never** |
| `apps/rn/src/components/progress/PaidOffArchive.tsx` | ⛔ **never** |
| `apps/rn/src/components/progress/TimelineLedger.tsx` | s1p2 |
| `apps/rn/src/components/screen.tsx` | ⛔ **never** |
| `apps/rn/src/components/tab-bar-icon.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/AddRow.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/AnimatedSheet.tsx` | s1p2 |
| `apps/rn/src/components/ui/AppIcon.ios.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/AppIcon.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/Button.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/Card.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/ChartSkeleton.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/CheckCircle.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/DateField.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/DateField.web.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/EmptyState.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/FormSheet.tsx` | s1p2 |
| `apps/rn/src/components/ui/ListRow.tsx` | s1p2 |
| `apps/rn/src/components/ui/MasterDetail.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/Pill.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/PressableScale.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/RadioGroup.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/RowContextMenu.ios.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/RowContextMenu.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/RowContextMenu.types.ts` | ⛔ **never** |
| `apps/rn/src/components/ui/SegmentedToggle.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/Select.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/SheetBackdrop.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/SheetScrim.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/Slider.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/SwitchRow.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/TextField.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/TwoColumn.tsx` | ⛔ **never** |
| `apps/rn/src/components/ui/sheet-styles.ts` | ⛔ **never** |
| `apps/rn/src/config/qa.ts` | ⛔ **never** |
| `apps/rn/src/data/defaults.ts` | s1p2 |
| `apps/rn/src/data/migrations.test.ts` | s1p1 · s1p2 |
| `apps/rn/src/data/migrations.ts` | r10 · s1p2 |
| `apps/rn/src/data/models.ts` | r17 |
| `apps/rn/src/hooks/spotlight.test.ts` | ⛔ **never** |
| `apps/rn/src/hooks/spotlightGeometry.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-app-colors.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-app-lock.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-cloud-backup.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-coach-mark.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-color-scheme.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-color-scheme.web.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-go-to-tab.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-inert.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-layout.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-notification-sync.ts` | s1p2 |
| `apps/rn/src/hooks/use-payday-capture.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-sheet-presentation.ts` | ⛔ **never** |
| `apps/rn/src/hooks/use-spotlight.ts` | ⛔ **never** |
| `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx` | ⛔ **never** |
| `apps/rn/src/keyCommands/KeyCommandListener.tsx` | ⛔ **never** |
| `apps/rn/src/keyCommands/keyCommandBus.test.ts` | ⛔ **never** |
| `apps/rn/src/keyCommands/keyCommandBus.ts` | ⛔ **never** |
| `apps/rn/src/lib/app-lock.ts` | ⛔ **never** |
| `apps/rn/src/lib/app-lock.web.ts` | ⛔ **never** |
| `apps/rn/src/lib/review.ts` | ⛔ **never** |
| `apps/rn/src/lib/review.web.ts` | ⛔ **never** |
| `apps/rn/src/lib/scan.ts` | ⛔ **never** |
| `apps/rn/src/lib/scan.web.ts` | ⛔ **never** |
| `apps/rn/src/liveActivity/liveActivityBridge.native.ts` | ⛔ **never** |
| `apps/rn/src/liveActivity/liveActivityBridge.ts` | ⛔ **never** |
| `apps/rn/src/liveActivity/liveActivityBridge.types.ts` | ⛔ **never** |
| `apps/rn/src/liveActivity/liveActivityKeys.ts` | ⛔ **never** |
| `apps/rn/src/liveActivity/liveActivitySync.ts` | ⛔ **never** |
| `apps/rn/src/liveActivity/paydayActivityContent.test.ts` | ⛔ **never** |
| `apps/rn/src/liveActivity/paydayActivityContent.ts` | ⛔ **never** |
| `apps/rn/src/motion/CountUp.tsx` | ⛔ **never** |
| `apps/rn/src/motion/Motion.tsx` | ⛔ **never** |
| `apps/rn/src/motion/haptics.ts` | ⛔ **never** |
| `apps/rn/src/motion/hooks.ts` | ⛔ **never** |
| `apps/rn/src/motion/index.ts` | ⛔ **never** |
| `apps/rn/src/notifications/notificationCopy.ts` | ⛔ **never** |
| `apps/rn/src/notifications/notifications.ts` | ⛔ **never** |
| `apps/rn/src/notifications/notifications.web.ts` | ⛔ **never** |
| `apps/rn/src/premium/config.ts` | ⛔ **never** |
| `apps/rn/src/premium/introOffer.test.ts` | ⛔ **never** |
| `apps/rn/src/premium/introOffer.ts` | ⛔ **never** |
| `apps/rn/src/premium/legal.ts` | ⛔ **never** |
| `apps/rn/src/premium/premiumKind.test.ts` | ⛔ **never** |
| `apps/rn/src/premium/premiumKind.ts` | ⛔ **never** |
| `apps/rn/src/premium/premiumSync.ts` | ⛔ **never** |
| `apps/rn/src/premium/purchases.ts` | ⛔ **never** |
| `apps/rn/src/premium/purchasesClient.ts` | ⛔ **never** |
| `apps/rn/src/premium/purchasesClient.web.ts` | ⛔ **never** |
| `apps/rn/src/storage/adapter.ts` | ⛔ **never** |
| `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts` | ⛔ **never** |
| `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ts` | ⛔ **never** |
| `apps/rn/src/storage/cloudBackup/index.ts` | ⛔ **never** |
| `apps/rn/src/storage/cloudBackup/provider.ts` | ⛔ **never** |
| `apps/rn/src/storage/cloudBackup/service.test.ts` | ⛔ **never** |
| `apps/rn/src/storage/cloudBackup/service.ts` | ⛔ **never** |
| `apps/rn/src/storage/createAdapter.ts` | ⛔ **never** |
| `apps/rn/src/storage/createAdapter.web.ts` | ⛔ **never** |
| `apps/rn/src/store/StoreContext.tsx` | s1p2 |
| `apps/rn/src/store/affordability.test.ts` | ⛔ **never** |
| `apps/rn/src/store/analysisSelectors.ts` | s1p2 |
| `apps/rn/src/store/appStore.ts` | s1p2 |
| `apps/rn/src/store/balanceSelectors.ts` | s1p2 |
| `apps/rn/src/store/bnplCadence.test.ts` | ⛔ **never** |
| `apps/rn/src/store/boundedRun.ts` | s1p2 |
| `apps/rn/src/store/celebrationSelectors.test.ts` | ⛔ **never** |
| `apps/rn/src/store/celebrationSelectors.ts` | s1p2 |
| `apps/rn/src/store/debtFreeBand.test.ts` | ⛔ **never** |
| `apps/rn/src/store/debtIds.test.ts` | ⛔ **never** |
| `apps/rn/src/store/debtIds.ts` | s1p2 |
| `apps/rn/src/store/drift.ts` | s1p2 |
| `apps/rn/src/store/expenseReserve.test.ts` | ⛔ **never** |
| `apps/rn/src/store/expenseReserveSelectors.ts` | s1p2 |
| `apps/rn/src/store/forecastCycles.ts` | s1p2 |
| `apps/rn/src/store/glossary.test.ts` | ⛔ **never** |
| `apps/rn/src/store/greeting.test.ts` | ⛔ **never** |
| `apps/rn/src/store/greeting.ts` | s1p2 |
| `apps/rn/src/store/guardianPrediction.test.ts` | ⛔ **never** |
| `apps/rn/src/store/guardianPrediction.ts` | s1p2 |
| `apps/rn/src/store/guardianPredictionCore.ts` | s1p2 |
| `apps/rn/src/store/guardianSelectors.test.ts` | s1p1 · s1p2 |
| `apps/rn/src/store/guardianSelectors.ts` | r17 · s1p1 · s1p2 |
| `apps/rn/src/store/guardianSubjects.test.ts` | ⛔ **never** |
| `apps/rn/src/store/guardianSubjects.ts` | s1p2 |
| `apps/rn/src/store/historySelectors.ts` | s1p2 |
| `apps/rn/src/store/incomeLearning.ts` | s1p2 |
| `apps/rn/src/store/journeySelectors.test.ts` | r17 |
| `apps/rn/src/store/journeySelectors.ts` | r17 · s1p1 |
| `apps/rn/src/store/looksLikeDebt.test.ts` | s1p2 |
| `apps/rn/src/store/looksLikeDebt.ts` | s1p2 |
| `apps/rn/src/store/milestoneCross.test.ts` | ⛔ **never** |
| `apps/rn/src/store/obligationForm.ts` | s1p2 |
| `apps/rn/src/store/onboardingFinish.test.ts` | ⛔ **never** |
| `apps/rn/src/store/onboardingFinish.ts` | s1p2 |
| `apps/rn/src/store/paycheckForm.test.ts` | ⛔ **never** |
| `apps/rn/src/store/paycheckForm.ts` | s1p2 |
| `apps/rn/src/store/payday.ts` | s1p2 |
| `apps/rn/src/store/payoffCelebration.test.ts` | ⛔ **never** |
| `apps/rn/src/store/payoffCelebration.ts` | s1p2 |
| `apps/rn/src/store/payoffSelectors.ts` | s1p2 |
| `apps/rn/src/store/paywallLead.test.ts` | ⛔ **never** |
| `apps/rn/src/store/paywallLead.ts` | s1p2 |
| `apps/rn/src/store/persistence.ts` | s1p2 |
| `apps/rn/src/store/persistenceLifecycle.test.ts` | ⛔ **never** |
| `apps/rn/src/store/planSelectors.test.ts` | ⛔ **never** |
| `apps/rn/src/store/planSelectors.ts` | s1p1 · s1p2 |
| `apps/rn/src/store/projectedIncome.test.ts` | ⛔ **never** |
| `apps/rn/src/store/projectedIncome.ts` | s1p2 |
| `apps/rn/src/store/proofOfWork.test.ts` | ⛔ **never** |
| `apps/rn/src/store/realWriteGuard.test.ts` | ⛔ **never** |
| `apps/rn/src/store/realWriteGuard.ts` | s1p2 |
| `apps/rn/src/store/recoverySelectors.test.ts` | s1p2 |
| `apps/rn/src/store/recoverySelectors.ts` | s1p2 |
| `apps/rn/src/store/selectors.ts` | s1p2 |
| `apps/rn/src/store/steadyStateProjection.test.ts` | ⛔ **never** |
| `apps/rn/src/store/store.ts` | partial · s1p1 · s1p2 |
| `apps/rn/src/store/storeActions.test.ts` | s1p2 |
| `apps/rn/src/store/storeContext.test.ts` | ⛔ **never** |
| `apps/rn/src/store/substrateProducers.test.ts` | ⛔ **never** |
| `apps/rn/src/store/substrateProducers.ts` | s1p2 |
| `apps/rn/src/store/topUpSelectors.ts` | s1p2 |
| `apps/rn/src/store/trustSelectors.test.ts` | s1p2 |
| `apps/rn/src/store/trustSelectors.ts` | s1p2 |
| `apps/rn/src/store/useAppStore.ts` | s1p2 |
| `apps/rn/src/store/windfallSplit.test.ts` | ⛔ **never** |
| `apps/rn/src/theme/colors.ts` | ⛔ **never** |
| `apps/rn/src/theme/elevation.ts` | ⛔ **never** |
| `apps/rn/src/theme/icons.ts` | ⛔ **never** |
| `apps/rn/src/theme/index.ts` | ⛔ **never** |
| `apps/rn/src/theme/motion.ts` | ⛔ **never** |
| `apps/rn/src/theme/spacing.ts` | ⛔ **never** |
| `apps/rn/src/theme/typography.ts` | ⛔ **never** |
| `apps/rn/src/types/react-native-ios-context-menu.d.ts` | ⛔ **never** |
| `apps/rn/src/utils/a11y.ts` | ⛔ **never** |
| `apps/rn/src/utils/canvaskit.ts` | ⛔ **never** |
| `apps/rn/src/utils/confirm.ts` | ⛔ **never** |
| `apps/rn/src/utils/debtFreeSound.ts` | ⛔ **never** |
| `apps/rn/src/utils/debtFreeSound.web.ts` | ⛔ **never** |
| `apps/rn/src/utils/ecosystem.ts` | ⛔ **never** |
| `apps/rn/src/utils/format.test.ts` | ⛔ **never** |
| `apps/rn/src/utils/format.ts` | ⛔ **never** |
| `apps/rn/src/utils/reportError.ts` | ⛔ **never** |
| `apps/rn/src/utils/scrubBreadcrumb.test.ts` | ⛔ **never** |
| `apps/rn/src/utils/scrubBreadcrumb.ts` | ⛔ **never** |
| `apps/rn/src/utils/sentry.ts` | ⛔ **never** |
| `apps/rn/src/utils/sentry.web.ts` | ⛔ **never** |
| `apps/rn/src/utils/share-card.ts` | ⛔ **never** |
| `apps/rn/src/utils/share-card.web.ts` | ⛔ **never** |
| `apps/rn/src/utils/sizeClass.ts` | ⛔ **never** |
| `apps/rn/src/utils/skia-ready.ts` | ⛔ **never** |
| `apps/rn/src/utils/skia-ready.web.ts` | ⛔ **never** |
| `apps/rn/src/widget/snapshot.ts` | s1p2 |
| `apps/rn/src/widget/widgetKeys.ts` | ⛔ **never** |
| `apps/rn/src/widget/widgetStorage.native.ts` | ⛔ **never** |
| `apps/rn/src/widget/widgetStorage.ts` | ⛔ **never** |
| `apps/rn/src/widget/widgetSync.test.ts` | ⛔ **never** |
| `apps/rn/src/widget/widgetSync.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/a11y-axe.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/a11y-row-labels.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/absorb-entry.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/ack-coordinator.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/affordability.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/amount-guards.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/analytics-optout.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/bill-category-partition.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/blur-glass.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/bnpl.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/celebration.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/cushion-forecast.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/earlyjourney.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/enh-audit-screens.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/expense-reserve.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/goal-pace-edit.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/goal-row-saved.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/greeting.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/guardian.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/helpers/seed.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/hero-date-fit.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/intent-undo.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/ipad-layouts.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/misfiled-expense.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/money-add-chooser.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/no-bills-branch.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/on-plan-streak.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/payday-reopen.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/payoff-schedule.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/paywall.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/plan-hero-conserves.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/premium-entry.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/progress-hero-journey.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/proofofwork.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/recovery.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/route-smoke.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/saveforit-pace.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/sheet-polish.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/sheet-remove.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/spoken-state.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/strategy-compare.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/swipe-delete.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/swipe-mark-paid.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/topup-sources.spec.ts` | s1p2 |
| `apps/rn/tests/e2e/trajectory-domain.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/trajectory-interactivity.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/trials.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/variable-income.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/vis5-cone.spec.ts` | ⛔ **never** |
| `apps/rn/tests/e2e/windfall.spec.ts` | ⛔ **never** |
| `packages/core/cashflow/detectCrunches.ts` | ⛔ **never** |
| `packages/core/cashflow/testDetectCrunches.ts` | ⛔ **never** |
| `packages/core/cashflow/testWaterFill.ts` | ⛔ **never** |
| `packages/core/cashflow/waterFill.ts` | ⛔ **never** |
| `packages/core/constants/livingExpensePresets.ts` | ⛔ **never** |
| `packages/core/constants/requiredExpensePresets.ts` | ⛔ **never** |
| `packages/core/copy/vocabulary.ts` | s1p2 |
| `packages/core/debt/applyDebtPaymentProjection.ts` | ⛔ **never** |
| `packages/core/debt/applyPaydayCapture.ts` | ⛔ **never** |
| `packages/core/debt/applyRolloverPayment.ts` | ⛔ **never** |
| `packages/core/debt/bnplInstallment.ts` | ⛔ **never** |
| `packages/core/debt/bnplPayoffPace.ts` | ⛔ **never** |
| `packages/core/debt/bnplProviders.ts` | ⛔ **never** |
| `packages/core/debt/bnplSchedule.ts` | ⛔ **never** |
| `packages/core/debt/buildAmortizationSchedule.ts` | ⛔ **never** |
| `packages/core/debt/buildPaydayCaptureItems.ts` | ⛔ **never** |
| `packages/core/debt/buildPayoffTrajectory.ts` | ⛔ **never** |
| `packages/core/debt/bulkMarkRequired.ts` | ⛔ **never** |
| `packages/core/debt/calculateMonthlyInterest.ts` | ⛔ **never** |
| `packages/core/debt/computeCycleDelta.ts` | ⛔ **never** |
| `packages/core/debt/computeDrift.ts` | ⛔ **never** |
| `packages/core/debt/computeInterestSaved.ts` | ⛔ **never** |
| `packages/core/debt/computeMilestones.ts` | ⛔ **never** |
| `packages/core/debt/computeStreak.ts` | ⛔ **never** |
| `packages/core/debt/deriveRequiredActionView.ts` | ⛔ **never** |
| `packages/core/debt/extraPaymentPlan.ts` | ⛔ **never** |
| `packages/core/debt/getDebtsWithDisplayBalances.ts` | ⛔ **never** |
| `packages/core/debt/mergeCompletedAction.ts` | ⛔ **never** |
| `packages/core/debt/originalBalanceHighWater.ts` | ⛔ **never** |
| `packages/core/debt/parseDebtFormValues.ts` | ⛔ **never** |
| `packages/core/debt/projectCurrentBalance.ts` | ⛔ **never** |
| `packages/core/debt/projectDebtPayoff.ts` | ⛔ **never** |
| `packages/core/debt/reconcileAutopay.ts` | ⛔ **never** |
| `packages/core/debt/reconcileGoalAmount.ts` | ⛔ **never** |
| `packages/core/debt/selectActiveRecommendedActions.ts` | ⛔ **never** |
| `packages/core/debt/shouldPromptPaydayCapture.ts` | ⛔ **never** |
| `packages/core/debt/testAmortizationSchedule.ts` | ⛔ **never** |
| `packages/core/debt/testApplyPaydayCapture.ts` | ⛔ **never** |
| `packages/core/debt/testBnplInstallment.ts` | ⛔ **never** |
| `packages/core/debt/testBnplSchedule.ts` | ⛔ **never** |
| `packages/core/debt/testBuildPayoffTrajectory.ts` | ⛔ **never** |
| `packages/core/debt/testBulkMarkRequired.ts` | ⛔ **never** |
| `packages/core/debt/testComputeCycleDelta.ts` | ⛔ **never** |
| `packages/core/debt/testComputeDrift.ts` | ⛔ **never** |
| `packages/core/debt/testComputeInterestSaved.ts` | ⛔ **never** |
| `packages/core/debt/testComputeMilestones.ts` | ⛔ **never** |
| `packages/core/debt/testComputeStreak.ts` | ⛔ **never** |
| `packages/core/debt/testDebtProjection.ts` | ⛔ **never** |
| `packages/core/debt/testDeriveRequiredActionView.ts` | ⛔ **never** |
| `packages/core/debt/testFreedMinimumRoll.ts` | ⛔ **never** |
| `packages/core/debt/testGetDebtsWithDisplayBalances.ts` | ⛔ **never** |
| `packages/core/debt/testGoalReconciliation.ts` | ⛔ **never** |
| `packages/core/debt/testOriginalBalanceHighWater.ts` | ⛔ **never** |
| `packages/core/debt/testParseDebtFormValues.ts` | ⛔ **never** |
| `packages/core/debt/testPaydayCapture.ts` | ⛔ **never** |
| `packages/core/debt/testProjectCurrentBalance.ts` | ⛔ **never** |
| `packages/core/debt/testProjectionAccuracy.ts` | ⛔ **never** |
| `packages/core/debt/testReconcileAutopay.ts` | ⛔ **never** |
| `packages/core/debt/testSelectActiveRecommendedActions.ts` | ⛔ **never** |
| `packages/core/debt/testShouldPromptPaydayCapture.ts` | ⛔ **never** |
| `packages/core/engine/allocatePaycheck.ts` | r17 · s1p2 |
| `packages/core/engine/emergencyFund.ts` | r17 |
| `packages/core/engine/recommendedActions.ts` | never · s1p1 |
| `packages/core/engine/testAllocation.ts` | r17 |
| `packages/core/engine/testExpenseReserve.ts` | never · s1p1 |
| `packages/core/forecast/getForecastStatus.ts` | ⛔ **never** |
| `packages/core/forecast/projectForecast.ts` | ⛔ **never** |
| `packages/core/forecast/types.ts` | ⛔ **never** |
| `packages/core/guardian/affordability.ts` | s1p1 · s1p2 |
| `packages/core/guardian/buildGuardianBrief.ts` | s1p1 · s1p2 |
| `packages/core/guardian/calibrationScore.ts` | never · s1p1 |
| `packages/core/guardian/computeState.ts` | s1p1 · s1p2 |
| `packages/core/guardian/holdbackComposition.ts` | never · s1p1 |
| `packages/core/guardian/notificationDecision.ts` | never · s1p1 |
| `packages/core/guardian/testAffordability.ts` | never · s1p1 |
| `packages/core/guardian/testBuildGuardianBrief.ts` | s1p1 · s1p2 |
| `packages/core/guardian/testCalibrationScore.ts` | never · s1p1 |
| `packages/core/guardian/testComputeState.ts` | never · s1p1 |
| `packages/core/guardian/testGuardianPartition.ts` | never · s1p1 |
| `packages/core/guardian/testNotificationDecision.ts` | never · s1p1 |
| `packages/core/history/buildCycleSnapshot.ts` | ⛔ **never** |
| `packages/core/history/selectVisibleHistory.ts` | ⛔ **never** |
| `packages/core/income/suggestLean.ts` | ⛔ **never** |
| `packages/core/income/testSuggestLean.ts` | ⛔ **never** |
| `packages/core/insights/buildSmartInsights.ts` | ⛔ **never** |
| `packages/core/obligations/classifyDeferability.ts` | s1p2 |
| `packages/core/obligations/effectiveObligationAmount.ts` | ⛔ **never** |
| `packages/core/obligations/testClassifyDeferability.ts` | ⛔ **never** |
| `packages/core/obligations/testEffectiveObligationAmount.ts` | ⛔ **never** |
| `packages/core/payCycle/cyclesPerYear.ts` | ⛔ **never** |
| `packages/core/payCycle/getNextPaycheckDate.ts` | ⛔ **never** |
| `packages/core/payCycle/payCyclesPerMonth.ts` | ⛔ **never** |
| `packages/core/payCycle/rollPaydayToFuture.ts` | ⛔ **never** |
| `packages/core/payCycle/testPayCycle.ts` | ⛔ **never** |
| `packages/core/payCycle/testPayCyclesPerMonth.ts` | ⛔ **never** |
| `packages/core/payCycle/testRollPaydayToFuture.ts` | ⛔ **never** |
| `packages/core/recovery/buildRecoveryPlan.ts` | ⛔ **never** |
| `packages/core/recovery/testBuildRecoveryPlan.ts` | ⛔ **never** |
| `packages/core/recurrence/rolloverPayCycle.ts` | ⛔ **never** |
| `packages/core/recurrence/testRolloverDueDates.ts` | ⛔ **never** |
| `packages/core/storage/debtPlannerStorage.ts` | ⛔ **never** |
| `packages/core/timeline/buildMultiCycleTimeline.ts` | s1p2 |
| `packages/core/timeline/buildTimelineItems.ts` | ⛔ **never** |
| `packages/core/types/livingExpense.ts` | ⛔ **never** |
| `packages/core/types/recurrence.ts` | ⛔ **never** |
| `packages/core/utils/addMonths.ts` | ⛔ **never** |
| `packages/core/utils/amountField.ts` | ⛔ **never** |
| `packages/core/utils/dayBefore.ts` | ⛔ **never** |
| `packages/core/utils/formatCurrency.ts` | ⛔ **never** |
| `packages/core/utils/formatDisplayAmount.ts` | ⛔ **never** |
| `packages/core/utils/localDate.ts` | ⛔ **never** |
| `packages/core/utils/money.ts` | ⛔ **never** |
| `packages/core/utils/testAddMonths.ts` | ⛔ **never** |
| `packages/core/utils/testAmountField.ts` | ⛔ **never** |
| `packages/core/utils/testLocalDate.ts` | ⛔ **never** |

## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]

- `apps/rn/src/analytics/funnel.test.ts`
- `apps/rn/src/analytics/funnel.ts`
- `apps/rn/src/app/(tabs)/_layout.tsx`
- `apps/rn/src/app/+not-found.tsx`
- `apps/rn/src/app/_layout.tsx`
- `apps/rn/src/app/demo.tsx`
- `apps/rn/src/app/history.tsx`
- `apps/rn/src/app/living-expenses.tsx`
- `apps/rn/src/app/more.tsx`
- `apps/rn/src/app/onboarding.tsx`
- `apps/rn/src/app/paywall.tsx`
- `apps/rn/src/app/schedule/[id].tsx`
- `apps/rn/src/app/tutorial.tsx`
- `apps/rn/src/appIntents/drainPendingActions.ts`
- `apps/rn/src/appIntents/pendingActionBridge.native.ts`
- `apps/rn/src/appIntents/pendingActionBridge.ts`
- `apps/rn/src/appIntents/pendingActionBridge.types.ts`
- `apps/rn/src/appIntents/pendingActions.test.ts`
- `apps/rn/src/appIntents/pendingActions.ts`
- `apps/rn/src/components/AppLockGate.tsx`
- `apps/rn/src/components/DataResetScreen.tsx`
- `apps/rn/src/components/SaveFailedBanner.tsx`
- `apps/rn/src/components/StorageErrorScreen.tsx`
- `apps/rn/src/components/money/AllocationBarCanvas.tsx`
- `apps/rn/src/components/money/AllocationBarCanvas.web.tsx`
- `apps/rn/src/components/money/AllocationBarChart.tsx`
- `apps/rn/src/components/money/BillBreakdownSheet.tsx`
- `apps/rn/src/components/money/BnplCalendarSection.tsx`
- `apps/rn/src/components/more-button.tsx`
- `apps/rn/src/components/more/BackupSheets.tsx`
- `apps/rn/src/components/more/CloudBackupSheet.tsx`
- `apps/rn/src/components/more/CoachMarkProbeReadout.tsx`
- `apps/rn/src/components/more/LegacyBridgeProbeReadout.tsx`
- `apps/rn/src/components/more/LiveActivityQA.tsx`
- `apps/rn/src/components/more/ReduceMotionProbeReadout.tsx`
- `apps/rn/src/components/more/SettingRow.tsx`
- `apps/rn/src/components/onboarding/CompletionStep.tsx`
- `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx`
- `apps/rn/src/components/onboarding/OnboardingLayout.tsx`
- `apps/rn/src/components/onboarding/PaycheckStep.tsx`
- `apps/rn/src/components/onboarding/WelcomeStep.tsx`
- `apps/rn/src/components/payoff/StrategyCompare.tsx`
- `apps/rn/src/components/payoff/TrajectoryCanvas.tsx`
- `apps/rn/src/components/payoff/TrajectoryCanvas.web.tsx`
- `apps/rn/src/components/payoff/TrajectoryChart.tsx`
- `apps/rn/src/components/payoff/TrajectorySkiaChart.tsx`
- `apps/rn/src/components/payoff/WhatIfControls.tsx`
- `apps/rn/src/components/payoff/compareStrategies.test.ts`
- `apps/rn/src/components/payoff/compareStrategies.ts`
- `apps/rn/src/components/payoff/monthLabels.test.ts`
- `apps/rn/src/components/payoff/monthLabels.ts`
- `apps/rn/src/components/payoff/trajectoryDomain.test.ts`
- `apps/rn/src/components/payoff/trajectoryDomain.ts`
- `apps/rn/src/components/premium/PremiumInvite.tsx`
- `apps/rn/src/components/progress/JourneyRingCanvas.tsx`
- `apps/rn/src/components/progress/JourneyRingCanvas.web.tsx`
- `apps/rn/src/components/progress/JourneyRingChart.tsx`
- `apps/rn/src/components/progress/PaidOffArchive.tsx`
- `apps/rn/src/components/screen.tsx`
- `apps/rn/src/components/tab-bar-icon.tsx`
- `apps/rn/src/components/ui/AddRow.tsx`
- `apps/rn/src/components/ui/AppIcon.ios.tsx`
- `apps/rn/src/components/ui/AppIcon.tsx`
- `apps/rn/src/components/ui/Button.tsx`
- `apps/rn/src/components/ui/Card.tsx`
- `apps/rn/src/components/ui/ChartSkeleton.tsx`
- `apps/rn/src/components/ui/CheckCircle.tsx`
- `apps/rn/src/components/ui/DateField.tsx`
- `apps/rn/src/components/ui/DateField.web.tsx`
- `apps/rn/src/components/ui/EmptyState.tsx`
- `apps/rn/src/components/ui/MasterDetail.tsx`
- `apps/rn/src/components/ui/Pill.tsx`
- `apps/rn/src/components/ui/PressableScale.tsx`
- `apps/rn/src/components/ui/RadioGroup.tsx`
- `apps/rn/src/components/ui/RowContextMenu.ios.tsx`
- `apps/rn/src/components/ui/RowContextMenu.tsx`
- `apps/rn/src/components/ui/RowContextMenu.types.ts`
- `apps/rn/src/components/ui/SegmentedToggle.tsx`
- `apps/rn/src/components/ui/Select.tsx`
- `apps/rn/src/components/ui/SheetBackdrop.tsx`
- `apps/rn/src/components/ui/SheetScrim.tsx`
- `apps/rn/src/components/ui/Slider.tsx`
- `apps/rn/src/components/ui/SwitchRow.tsx`
- `apps/rn/src/components/ui/TextField.tsx`
- `apps/rn/src/components/ui/TwoColumn.tsx`
- `apps/rn/src/components/ui/sheet-styles.ts`
- `apps/rn/src/config/qa.ts`
- `apps/rn/src/hooks/spotlight.test.ts`
- `apps/rn/src/hooks/spotlightGeometry.ts`
- `apps/rn/src/hooks/use-app-colors.ts`
- `apps/rn/src/hooks/use-app-lock.ts`
- `apps/rn/src/hooks/use-cloud-backup.ts`
- `apps/rn/src/hooks/use-coach-mark.ts`
- `apps/rn/src/hooks/use-color-scheme.ts`
- `apps/rn/src/hooks/use-color-scheme.web.ts`
- `apps/rn/src/hooks/use-go-to-tab.ts`
- `apps/rn/src/hooks/use-inert.ts`
- `apps/rn/src/hooks/use-layout.ts`
- `apps/rn/src/hooks/use-payday-capture.ts`
- `apps/rn/src/hooks/use-sheet-presentation.ts`
- `apps/rn/src/hooks/use-spotlight.ts`
- `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx`
- `apps/rn/src/keyCommands/KeyCommandListener.tsx`
- `apps/rn/src/keyCommands/keyCommandBus.test.ts`
- `apps/rn/src/keyCommands/keyCommandBus.ts`
- `apps/rn/src/lib/app-lock.ts`
- `apps/rn/src/lib/app-lock.web.ts`
- `apps/rn/src/lib/review.ts`
- `apps/rn/src/lib/review.web.ts`
- `apps/rn/src/lib/scan.ts`
- `apps/rn/src/lib/scan.web.ts`
- `apps/rn/src/liveActivity/liveActivityBridge.native.ts`
- `apps/rn/src/liveActivity/liveActivityBridge.ts`
- `apps/rn/src/liveActivity/liveActivityBridge.types.ts`
- `apps/rn/src/liveActivity/liveActivityKeys.ts`
- `apps/rn/src/liveActivity/liveActivitySync.ts`
- `apps/rn/src/liveActivity/paydayActivityContent.test.ts`
- `apps/rn/src/liveActivity/paydayActivityContent.ts`
- `apps/rn/src/motion/CountUp.tsx`
- `apps/rn/src/motion/Motion.tsx`
- `apps/rn/src/motion/haptics.ts`
- `apps/rn/src/motion/hooks.ts`
- `apps/rn/src/motion/index.ts`
- `apps/rn/src/notifications/notificationCopy.ts`
- `apps/rn/src/notifications/notifications.ts`
- `apps/rn/src/notifications/notifications.web.ts`
- `apps/rn/src/premium/config.ts`
- `apps/rn/src/premium/introOffer.test.ts`
- `apps/rn/src/premium/introOffer.ts`
- `apps/rn/src/premium/legal.ts`
- `apps/rn/src/premium/premiumKind.test.ts`
- `apps/rn/src/premium/premiumKind.ts`
- `apps/rn/src/premium/premiumSync.ts`
- `apps/rn/src/premium/purchases.ts`
- `apps/rn/src/premium/purchasesClient.ts`
- `apps/rn/src/premium/purchasesClient.web.ts`
- `apps/rn/src/storage/adapter.ts`
- `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts`
- `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ts`
- `apps/rn/src/storage/cloudBackup/index.ts`
- `apps/rn/src/storage/cloudBackup/provider.ts`
- `apps/rn/src/storage/cloudBackup/service.test.ts`
- `apps/rn/src/storage/cloudBackup/service.ts`
- `apps/rn/src/storage/createAdapter.ts`
- `apps/rn/src/storage/createAdapter.web.ts`
- `apps/rn/src/store/affordability.test.ts`
- `apps/rn/src/store/bnplCadence.test.ts`
- `apps/rn/src/store/celebrationSelectors.test.ts`
- `apps/rn/src/store/debtFreeBand.test.ts`
- `apps/rn/src/store/debtIds.test.ts`
- `apps/rn/src/store/expenseReserve.test.ts`
- `apps/rn/src/store/glossary.test.ts`
- `apps/rn/src/store/greeting.test.ts`
- `apps/rn/src/store/guardianPrediction.test.ts`
- `apps/rn/src/store/guardianSubjects.test.ts`
- `apps/rn/src/store/milestoneCross.test.ts`
- `apps/rn/src/store/onboardingFinish.test.ts`
- `apps/rn/src/store/paycheckForm.test.ts`
- `apps/rn/src/store/payoffCelebration.test.ts`
- `apps/rn/src/store/paywallLead.test.ts`
- `apps/rn/src/store/persistenceLifecycle.test.ts`
- `apps/rn/src/store/planSelectors.test.ts`
- `apps/rn/src/store/projectedIncome.test.ts`
- `apps/rn/src/store/proofOfWork.test.ts`
- `apps/rn/src/store/realWriteGuard.test.ts`
- `apps/rn/src/store/steadyStateProjection.test.ts`
- `apps/rn/src/store/storeContext.test.ts`
- `apps/rn/src/store/substrateProducers.test.ts`
- `apps/rn/src/store/windfallSplit.test.ts`
- `apps/rn/src/theme/colors.ts`
- `apps/rn/src/theme/elevation.ts`
- `apps/rn/src/theme/icons.ts`
- `apps/rn/src/theme/index.ts`
- `apps/rn/src/theme/motion.ts`
- `apps/rn/src/theme/spacing.ts`
- `apps/rn/src/theme/typography.ts`
- `apps/rn/src/types/react-native-ios-context-menu.d.ts`
- `apps/rn/src/utils/a11y.ts`
- `apps/rn/src/utils/canvaskit.ts`
- `apps/rn/src/utils/confirm.ts`
- `apps/rn/src/utils/debtFreeSound.ts`
- `apps/rn/src/utils/debtFreeSound.web.ts`
- `apps/rn/src/utils/ecosystem.ts`
- `apps/rn/src/utils/format.test.ts`
- `apps/rn/src/utils/format.ts`
- `apps/rn/src/utils/reportError.ts`
- `apps/rn/src/utils/scrubBreadcrumb.test.ts`
- `apps/rn/src/utils/scrubBreadcrumb.ts`
- `apps/rn/src/utils/sentry.ts`
- `apps/rn/src/utils/sentry.web.ts`
- `apps/rn/src/utils/share-card.ts`
- `apps/rn/src/utils/share-card.web.ts`
- `apps/rn/src/utils/sizeClass.ts`
- `apps/rn/src/utils/skia-ready.ts`
- `apps/rn/src/utils/skia-ready.web.ts`
- `apps/rn/src/widget/widgetKeys.ts`
- `apps/rn/src/widget/widgetStorage.native.ts`
- `apps/rn/src/widget/widgetStorage.ts`
- `apps/rn/src/widget/widgetSync.test.ts`
- `apps/rn/src/widget/widgetSync.ts`
- `apps/rn/tests/e2e/a11y-axe.spec.ts`
- `apps/rn/tests/e2e/a11y-row-labels.spec.ts`
- `apps/rn/tests/e2e/absorb-entry.spec.ts`
- `apps/rn/tests/e2e/ack-coordinator.spec.ts`
- `apps/rn/tests/e2e/amount-guards.spec.ts`
- `apps/rn/tests/e2e/analytics-optout.spec.ts`
- `apps/rn/tests/e2e/blur-glass.spec.ts`
- `apps/rn/tests/e2e/bnpl.spec.ts`
- `apps/rn/tests/e2e/celebration.spec.ts`
- `apps/rn/tests/e2e/earlyjourney.spec.ts`
- `apps/rn/tests/e2e/enh-audit-screens.spec.ts`
- `apps/rn/tests/e2e/expense-reserve.spec.ts`
- `apps/rn/tests/e2e/greeting.spec.ts`
- `apps/rn/tests/e2e/helpers/seed.ts`
- `apps/rn/tests/e2e/hero-date-fit.spec.ts`
- `apps/rn/tests/e2e/ipad-layouts.spec.ts`
- `apps/rn/tests/e2e/money-add-chooser.spec.ts`
- `apps/rn/tests/e2e/on-plan-streak.spec.ts`
- `apps/rn/tests/e2e/payday-reopen.spec.ts`
- `apps/rn/tests/e2e/payoff-schedule.spec.ts`
- `apps/rn/tests/e2e/paywall.spec.ts`
- `apps/rn/tests/e2e/premium-entry.spec.ts`
- `apps/rn/tests/e2e/proofofwork.spec.ts`
- `apps/rn/tests/e2e/saveforit-pace.spec.ts`
- `apps/rn/tests/e2e/sheet-polish.spec.ts`
- `apps/rn/tests/e2e/sheet-remove.spec.ts`
- `apps/rn/tests/e2e/spoken-state.spec.ts`
- `apps/rn/tests/e2e/strategy-compare.spec.ts`
- `apps/rn/tests/e2e/swipe-delete.spec.ts`
- `apps/rn/tests/e2e/swipe-mark-paid.spec.ts`
- `apps/rn/tests/e2e/trajectory-domain.spec.ts`
- `apps/rn/tests/e2e/trajectory-interactivity.spec.ts`
- `apps/rn/tests/e2e/trials.spec.ts`
- `apps/rn/tests/e2e/variable-income.spec.ts`
- `apps/rn/tests/e2e/vis5-cone.spec.ts`
- `apps/rn/tests/e2e/windfall.spec.ts`
- `packages/core/cashflow/detectCrunches.ts`
- `packages/core/cashflow/testDetectCrunches.ts`
- `packages/core/cashflow/testWaterFill.ts`
- `packages/core/cashflow/waterFill.ts`
- `packages/core/constants/livingExpensePresets.ts`
- `packages/core/constants/requiredExpensePresets.ts`
- `packages/core/debt/applyDebtPaymentProjection.ts`
- `packages/core/debt/applyPaydayCapture.ts`
- `packages/core/debt/applyRolloverPayment.ts`
- `packages/core/debt/bnplInstallment.ts`
- `packages/core/debt/bnplPayoffPace.ts`
- `packages/core/debt/bnplProviders.ts`
- `packages/core/debt/bnplSchedule.ts`
- `packages/core/debt/buildAmortizationSchedule.ts`
- `packages/core/debt/buildPaydayCaptureItems.ts`
- `packages/core/debt/buildPayoffTrajectory.ts`
- `packages/core/debt/bulkMarkRequired.ts`
- `packages/core/debt/calculateMonthlyInterest.ts`
- `packages/core/debt/computeCycleDelta.ts`
- `packages/core/debt/computeDrift.ts`
- `packages/core/debt/computeInterestSaved.ts`
- `packages/core/debt/computeMilestones.ts`
- `packages/core/debt/computeStreak.ts`
- `packages/core/debt/deriveRequiredActionView.ts`
- `packages/core/debt/extraPaymentPlan.ts`
- `packages/core/debt/getDebtsWithDisplayBalances.ts`
- `packages/core/debt/mergeCompletedAction.ts`
- `packages/core/debt/originalBalanceHighWater.ts`
- `packages/core/debt/parseDebtFormValues.ts`
- `packages/core/debt/projectCurrentBalance.ts`
- `packages/core/debt/projectDebtPayoff.ts`
- `packages/core/debt/reconcileAutopay.ts`
- `packages/core/debt/reconcileGoalAmount.ts`
- `packages/core/debt/selectActiveRecommendedActions.ts`
- `packages/core/debt/shouldPromptPaydayCapture.ts`
- `packages/core/debt/testAmortizationSchedule.ts`
- `packages/core/debt/testApplyPaydayCapture.ts`
- `packages/core/debt/testBnplInstallment.ts`
- `packages/core/debt/testBnplSchedule.ts`
- `packages/core/debt/testBuildPayoffTrajectory.ts`
- `packages/core/debt/testBulkMarkRequired.ts`
- `packages/core/debt/testComputeCycleDelta.ts`
- `packages/core/debt/testComputeDrift.ts`
- `packages/core/debt/testComputeInterestSaved.ts`
- `packages/core/debt/testComputeMilestones.ts`
- `packages/core/debt/testComputeStreak.ts`
- `packages/core/debt/testDebtProjection.ts`
- `packages/core/debt/testDeriveRequiredActionView.ts`
- `packages/core/debt/testFreedMinimumRoll.ts`
- `packages/core/debt/testGetDebtsWithDisplayBalances.ts`
- `packages/core/debt/testGoalReconciliation.ts`
- `packages/core/debt/testOriginalBalanceHighWater.ts`
- `packages/core/debt/testParseDebtFormValues.ts`
- `packages/core/debt/testPaydayCapture.ts`
- `packages/core/debt/testProjectCurrentBalance.ts`
- `packages/core/debt/testProjectionAccuracy.ts`
- `packages/core/debt/testReconcileAutopay.ts`
- `packages/core/debt/testSelectActiveRecommendedActions.ts`
- `packages/core/debt/testShouldPromptPaydayCapture.ts`
- `packages/core/forecast/getForecastStatus.ts`
- `packages/core/forecast/projectForecast.ts`
- `packages/core/forecast/types.ts`
- `packages/core/history/buildCycleSnapshot.ts`
- `packages/core/history/selectVisibleHistory.ts`
- `packages/core/income/suggestLean.ts`
- `packages/core/income/testSuggestLean.ts`
- `packages/core/insights/buildSmartInsights.ts`
- `packages/core/obligations/effectiveObligationAmount.ts`
- `packages/core/obligations/testClassifyDeferability.ts`
- `packages/core/obligations/testEffectiveObligationAmount.ts`
- `packages/core/payCycle/cyclesPerYear.ts`
- `packages/core/payCycle/getNextPaycheckDate.ts`
- `packages/core/payCycle/payCyclesPerMonth.ts`
- `packages/core/payCycle/rollPaydayToFuture.ts`
- `packages/core/payCycle/testPayCycle.ts`
- `packages/core/payCycle/testPayCyclesPerMonth.ts`
- `packages/core/payCycle/testRollPaydayToFuture.ts`
- `packages/core/recovery/buildRecoveryPlan.ts`
- `packages/core/recovery/testBuildRecoveryPlan.ts`
- `packages/core/recurrence/rolloverPayCycle.ts`
- `packages/core/recurrence/testRolloverDueDates.ts`
- `packages/core/storage/debtPlannerStorage.ts`
- `packages/core/timeline/buildTimelineItems.ts`
- `packages/core/types/livingExpense.ts`
- `packages/core/types/recurrence.ts`
- `packages/core/utils/addMonths.ts`
- `packages/core/utils/amountField.ts`
- `packages/core/utils/dayBefore.ts`
- `packages/core/utils/formatCurrency.ts`
- `packages/core/utils/formatDisplayAmount.ts`
- `packages/core/utils/localDate.ts`
- `packages/core/utils/money.ts`
- `packages/core/utils/testAddMonths.ts`
- `packages/core/utils/testAmountField.ts`
- `packages/core/utils/testLocalDate.ts`

