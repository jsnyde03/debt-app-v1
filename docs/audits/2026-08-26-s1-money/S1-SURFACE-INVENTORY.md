# S1 surface inventory — money · goals · plan cards

> ⛔ **GENERATED — do not hand-edit.** `npm run lint:s1-coverage` writes it from
> `scripts/surface-coverage.s1.json`. [D69] needs *"first look"* to be a lookup rather than an
> auditor's claim; this is the lookup.
>
> ⚠️ **The file list is walked from disk; the coverage claim is written down by whoever read the**
> **report.** An earlier cut inferred coverage by parsing the reports and was scrapped after being
> measured wrong — see the docstring in `scripts/surface-coverage.ts`.

**494 files on the S1 surface · 484 swept · 10 unswept.**

`p1`–`p4` an S0 pass · `g4` the guard inventory · `r10` / `r17` an earlier round · `partial` opened but part-read · `never` / `unknown` / `partial` all UNSWEPT.

| file | swept by |
|---|---|
| `apps/rn/src/analytics/funnel.test.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/analytics/funnel.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/app/(tabs)/_layout.tsx` | s1p3 · s1p6 |
| `apps/rn/src/app/(tabs)/index.tsx` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/app/(tabs)/money.tsx` | r10 · s1p1 · s1p2 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/app/(tabs)/progress.tsx` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/app/+not-found.tsx` | s1p3 · s1p6 |
| `apps/rn/src/app/_layout.tsx` | partial · s1p4 · s1p6 |
| `apps/rn/src/app/cushion-forecast.tsx` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/app/demo.tsx` | s1p3 · s1p6 |
| `apps/rn/src/app/history.tsx` | s1p3 · s1p5 · s1p6 |
| `apps/rn/src/app/living-expenses.tsx` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/app/more.tsx` | partial · s1p6 |
| `apps/rn/src/app/onboarding.tsx` | s1p3 · s1p6 |
| `apps/rn/src/app/paywall.tsx` | s1p4 · s1p5 · s1p6 |
| `apps/rn/src/app/schedule/[id].tsx` | s1p3 · s1p6 |
| `apps/rn/src/app/tutorial.tsx` | s1p3 · s1p6 |
| `apps/rn/src/appIntents/drainPendingActions.ts` | s1p3 · s1p6 |
| `apps/rn/src/appIntents/pendingActionBridge.native.ts` | s1p3 · s1p6 |
| `apps/rn/src/appIntents/pendingActionBridge.ts` | s1p3 |
| `apps/rn/src/appIntents/pendingActionBridge.types.ts` | s1p3 |
| `apps/rn/src/appIntents/pendingActions.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/appIntents/pendingActions.ts` | s1p3 · s1p6 |
| `apps/rn/src/appIntents/siriClaims.test.ts` | ⛔ **never** |
| `apps/rn/src/components/AppLockGate.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/DataResetScreen.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/SaveFailedBanner.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/StorageErrorScreen.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/entities/AddObligationSheet.tsx` | partial · s1p1 · s1p6 |
| `apps/rn/src/components/entities/AmortizationView.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/entities/DebtSheet.tsx` | s1p1 · s1p2 · s1p5 · s1p6 |
| `apps/rn/src/components/entities/ExpenseSheet.tsx` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/entities/GoalSheet.tsx` | r17 · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/entities/ImportDebtsSheet.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/entities/LogPaymentSheet.tsx` | s1p1 · s1p5 · s1p6 |
| `apps/rn/src/components/entities/debtPrefill.test.ts` | ⛔ **never** |
| `apps/rn/src/components/money/AllocationBarCanvas.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/money/AllocationBarCanvas.web.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/money/AllocationBarChart.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/money/BillBreakdownSheet.tsx` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/components/money/BnplCalendarSection.tsx` | s1p3 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/components/more-button.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/more/BackupSheets.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/more/CloudBackupSheet.tsx` | partial · s1p4 · s1p6 |
| `apps/rn/src/components/more/CoachMarkProbeReadout.tsx` | never · s1p4 · s1p6 |
| `apps/rn/src/components/more/LegacyBridgeProbeReadout.tsx` | never · s1p4 · s1p6 |
| `apps/rn/src/components/more/LiveActivityQA.tsx` | never · s1p4 · s1p6 |
| `apps/rn/src/components/more/ReduceMotionProbeReadout.tsx` | never · s1p4 · s1p6 |
| `apps/rn/src/components/more/SettingRow.tsx` | never · s1p4 · s1p6 |
| `apps/rn/src/components/onboarding/CompletionStep.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx` | partial · s1p4 · s1p6 |
| `apps/rn/src/components/onboarding/OnboardingLayout.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/onboarding/PaycheckStep.tsx` | partial · s1p4 · s1p6 |
| `apps/rn/src/components/onboarding/WelcomeStep.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx` | s1p2 · s1p6 |
| `apps/rn/src/components/payoff/StrategyCompare.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/payoff/TrajectoryCanvas.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/payoff/TrajectoryCanvas.web.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx` | s1p5 · s1p6 |
| `apps/rn/src/components/payoff/TrajectorySkiaChart.tsx` | never · s1p4 · s1p6 |
| `apps/rn/src/components/payoff/WhatIfControls.tsx` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/components/payoff/compareStrategies.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/components/payoff/compareStrategies.ts` | s1p3 · s1p6 |
| `apps/rn/src/components/payoff/monthLabels.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/components/payoff/monthLabels.ts` | s1p3 · s1p6 |
| `apps/rn/src/components/payoff/trajectoryDomain.test.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/components/payoff/trajectoryDomain.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/components/payoff/whereText.test.ts` | partial · s1p6 |
| `apps/rn/src/components/payoff/whereText.ts` | s1p5 · s1p6 |
| `apps/rn/src/components/plan/AffordabilityCard.tsx` | s1p1 · s1p2 · s1p5 · s1p6 |
| `apps/rn/src/components/plan/AffordabilityImpactBar.tsx` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/CaptureSlate.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/CashRunwayCanvas.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/CashRunwayChart.tsx` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/CushionBarCanvas.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/CushionBarCanvas.web.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/CushionBarChart.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/CushionFloorSheet.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/DataRepairsCard.tsx` | r10 · r17 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/FloorImpactBar.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/GraduationCards.tsx` | partial · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/GuardianProofStrip.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/GuardianScorecard.tsx` | partial · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/LeanSuggestionCard.tsx` | partial · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/MeshGradientCanvas.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx` | never · s1p1 |
| `apps/rn/src/components/plan/MeshGradientChart.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/MilestoneAckCard.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/PaidOffBeat.tsx` | partial · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/PaidOffFinale.tsx` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/PaycheckSheet.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx` | partial · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/PayoffInvitationCard.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/PlanHero.tsx` | partial · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/RecommendedActionsCard.tsx` | never · s1p1 · s1p6 |
| `apps/rn/src/components/plan/RecoveryPlanSection.tsx` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/SaveForItSheet.tsx` | r17 · s1p6 |
| `apps/rn/src/components/plan/ShareCard.tsx` | s1p1 · s1p2 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/components/plan/SpokenForSheet.tsx` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/WindfallSheet.tsx` | partial · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/components/plan/cashRunwayReceipt.test.ts` | ⛔ **never** |
| `apps/rn/src/components/plan/dataRepairsCopy.test.ts` | r17 · s1p6 |
| `apps/rn/src/components/plan/dataRepairsCopy.ts` | r17 · s1p2 · s1p4 · s1p6 |
| `apps/rn/src/components/plan/unreadInputsCopy.test.ts` | ⛔ **never** |
| `apps/rn/src/components/plan/useCaptureAutoConfirm.ts` | never · s1p1 · s1p6 |
| `apps/rn/src/components/premium/PremiumInvite.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/progress/CashFlowSection.tsx` | s1p2 · s1p6 |
| `apps/rn/src/components/progress/JourneyRingCanvas.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/progress/JourneyRingCanvas.web.tsx` | s1p3 |
| `apps/rn/src/components/progress/JourneyRingChart.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/progress/PaidOffArchive.tsx` | s1p3 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/components/progress/TimelineLedger.tsx` | s1p2 · s1p6 |
| `apps/rn/src/components/screen.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/tab-bar-icon.tsx` | s1p3 |
| `apps/rn/src/components/ui/AddRow.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/AnimatedSheet.tsx` | s1p2 · s1p6 |
| `apps/rn/src/components/ui/AppIcon.ios.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/AppIcon.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/Button.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/Card.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/ChartSkeleton.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/CheckCircle.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/DateField.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/DateField.web.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/EmptyState.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/FormSheet.tsx` | s1p2 · s1p6 |
| `apps/rn/src/components/ui/ListRow.tsx` | s1p2 · s1p6 |
| `apps/rn/src/components/ui/MasterDetail.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/Pill.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/PressableScale.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/RadioGroup.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/RowContextMenu.ios.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/ui/RowContextMenu.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/ui/RowContextMenu.types.ts` | s1p3 |
| `apps/rn/src/components/ui/SegmentedToggle.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/Select.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/SheetBackdrop.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/SheetScrim.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/Slider.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/ui/SwitchRow.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/TextField.tsx` | s1p3 · s1p6 |
| `apps/rn/src/components/ui/TwoColumn.tsx` | never · partial · s1p6 |
| `apps/rn/src/components/ui/sheet-styles.ts` | never · partial · s1p6 |
| `apps/rn/src/config/qa.ts` | s1p3 · s1p6 |
| `apps/rn/src/data/defaults.ts` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/data/migrations.test.ts` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/data/migrations.ts` | r10 · s1p2 · s1p5 · s1p6 |
| `apps/rn/src/data/models.ts` | r17 · s1p5 · s1p6 |
| `apps/rn/src/hooks/spotlight.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/hooks/spotlightGeometry.ts` | partial · s1p4 |
| `apps/rn/src/hooks/use-app-colors.ts` | s1p3 · s1p6 |
| `apps/rn/src/hooks/use-app-lock.ts` | s1p3 · s1p6 |
| `apps/rn/src/hooks/use-cloud-backup.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/hooks/use-coach-mark.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/hooks/use-color-scheme.ts` | s1p3 · s1p6 |
| `apps/rn/src/hooks/use-color-scheme.web.ts` | s1p3 |
| `apps/rn/src/hooks/use-go-to-tab.ts` | s1p3 · s1p6 |
| `apps/rn/src/hooks/use-inert.ts` | s1p3 · s1p6 |
| `apps/rn/src/hooks/use-layout.ts` | s1p3 · s1p6 |
| `apps/rn/src/hooks/use-notification-sync.ts` | s1p2 · s1p6 |
| `apps/rn/src/hooks/use-payday-capture.ts` | s1p3 · s1p6 |
| `apps/rn/src/hooks/use-sheet-presentation.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/hooks/use-spotlight.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx` | never · s1p4 · s1p6 |
| `apps/rn/src/keyCommands/KeyCommandListener.tsx` | never · s1p4 · s1p6 |
| `apps/rn/src/keyCommands/keyCommandBus.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/keyCommands/keyCommandBus.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/lib/app-lock.ts` | s1p3 · s1p6 |
| `apps/rn/src/lib/app-lock.web.ts` | s1p3 |
| `apps/rn/src/lib/review.ts` | s1p3 · s1p6 |
| `apps/rn/src/lib/review.web.ts` | s1p3 |
| `apps/rn/src/lib/scan.ts` | s1p3 · s1p6 |
| `apps/rn/src/lib/scan.web.ts` | s1p3 · s1p6 |
| `apps/rn/src/liveActivity/liveActivityBridge.native.ts` | s1p3 · s1p6 |
| `apps/rn/src/liveActivity/liveActivityBridge.ts` | s1p3 |
| `apps/rn/src/liveActivity/liveActivityBridge.types.ts` | s1p3 · s1p6 |
| `apps/rn/src/liveActivity/liveActivityKeys.ts` | s1p3 · s1p6 |
| `apps/rn/src/liveActivity/liveActivitySync.ts` | s1p3 · s1p6 |
| `apps/rn/src/liveActivity/paydayActivityContent.test.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/liveActivity/paydayActivityContent.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/motion/CountUp.tsx` | s1p3 · s1p6 |
| `apps/rn/src/motion/Motion.tsx` | never · partial · s1p6 |
| `apps/rn/src/motion/haptics.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/motion/hooks.ts` | never · partial · s1p6 |
| `apps/rn/src/motion/index.ts` | never · partial · s1p6 |
| `apps/rn/src/notifications/notificationCopy.ts` | s1p3 · s1p6 |
| `apps/rn/src/notifications/notifications.ts` | s1p3 · s1p5 · s1p6 |
| `apps/rn/src/notifications/notifications.web.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/config.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/introOffer.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/introOffer.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/legal.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/perMonthAnchor.test.ts` | never · s1p6 |
| `apps/rn/src/premium/perMonthAnchor.ts` | never · s1p6 |
| `apps/rn/src/premium/premiumKind.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/premiumKind.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/premiumSync.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/purchases.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/purchasesClient.ts` | s1p3 · s1p6 |
| `apps/rn/src/premium/purchasesClient.web.ts` | s1p3 · s1p6 |
| `apps/rn/src/storage/adapter.ts` | s1p3 · s1p5 · s1p6 |
| `apps/rn/src/storage/cloudBackup/cloudBackupUnreadable.test.ts` | ⛔ **never** |
| `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ts` | s1p3 · s1p6 |
| `apps/rn/src/storage/cloudBackup/index.ts` | s1p3 · s1p5 · s1p6 |
| `apps/rn/src/storage/cloudBackup/provider.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/storage/cloudBackup/service.test.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/storage/cloudBackup/service.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/storage/createAdapter.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/storage/createAdapter.ts` | s1p3 · s1p6 |
| `apps/rn/src/storage/createAdapter.web.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/store/StoreContext.tsx` | s1p2 · s1p6 |
| `apps/rn/src/store/affordability.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/analysisSelectors.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/appStore.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/balanceSelectors.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/bnplCadence.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/boundedRun.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/celebrationSelectors.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/store/celebrationSelectors.ts` | s1p2 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/store/debtFreeBand.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/debtIds.test.ts` | s1p5 · s1p6 |
| `apps/rn/src/store/debtIds.ts` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/store/drift.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/expenseReserve.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/expenseReserveSelectors.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/forecastCycles.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/glossary.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/greeting.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/greeting.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/guardianPrediction.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/store/guardianPrediction.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/guardianPredictionCore.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/guardianSelectors.test.ts` | s1p1 · s1p2 · s1p6 |
| `apps/rn/src/store/guardianSelectors.ts` | partial · r17 · s1p1 · s1p2 · s1p6 |
| `apps/rn/src/store/guardianSubjects.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/guardianSubjects.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/guardianTrust.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/store/historySelectors.ts` | s1p2 · s1p4 · s1p6 |
| `apps/rn/src/store/incomeLearning.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/journeySelectors.test.ts` | r17 · s1p6 |
| `apps/rn/src/store/journeySelectors.ts` | r17 · s1p1 · s1p6 |
| `apps/rn/src/store/logPaymentCopy.test.ts` | never · s1p6 |
| `apps/rn/src/store/logPaymentCopy.ts` | never · s1p6 |
| `apps/rn/src/store/looksLikeDebt.test.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/looksLikeDebt.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/milestoneCross.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/obligationForm.ts` | s1p2 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/store/onboardingFinish.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/onboardingFinish.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/paycheckForm.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/store/paycheckForm.ts` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/store/payday.ts` | s1p2 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/store/paydayRequiredSplit.test.ts` | ⛔ **never** |
| `apps/rn/src/store/payoffCelebration.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/payoffCelebration.ts` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/store/payoffSelectors.ts` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/store/payoffViewGag.test.ts` | never · s1p6 |
| `apps/rn/src/store/paywallLead.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/store/paywallLead.ts` | s1p2 · s1p4 · s1p6 |
| `apps/rn/src/store/persistence.ts` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/store/persistenceLifecycle.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/planSelectors.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/store/planSelectors.ts` | s1p1 · s1p2 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/store/projectedIncome.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/store/projectedIncome.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/proofOfWork.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/store/realWriteGuard.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/realWriteGuard.ts` | s1p2 · s1p5 · s1p6 |
| `apps/rn/src/store/recoverySelectors.test.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/recoverySelectors.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/requiredPlanTrust.test.ts` | partial · s1p6 |
| `apps/rn/src/store/selectors.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/staleClaims.test.ts` | ⛔ **never** |
| `apps/rn/src/store/steadyStateProjection.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/store.ts` | s1p1 · s1p2 · s1p5 · s1p6 |
| `apps/rn/src/store/storeActions.test.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/storeContext.test.ts` | never · partial · s1p6 |
| `apps/rn/src/store/substrateProducers.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/store/substrateProducers.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/topUpSelectors.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/trustSelectors.test.ts` | s1p2 · s1p4 · s1p6 |
| `apps/rn/src/store/trustSelectors.ts` | s1p2 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/store/useAppStore.ts` | s1p2 · s1p6 |
| `apps/rn/src/store/windfallSplit.test.ts` | never · partial · s1p6 |
| `apps/rn/src/theme/colors.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/theme/elevation.ts` | never · partial · s1p6 |
| `apps/rn/src/theme/icons.ts` | never · partial · s1p6 |
| `apps/rn/src/theme/index.ts` | never · partial · s1p6 |
| `apps/rn/src/theme/motion.ts` | never · partial · s1p6 |
| `apps/rn/src/theme/spacing.ts` | never · partial · s1p6 |
| `apps/rn/src/theme/typography.ts` | never · partial · s1p6 |
| `apps/rn/src/types/react-native-ios-context-menu.d.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/utils/a11y.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/canvaskit.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/confirm.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/debtFreeSound.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/debtFreeSound.web.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/ecosystem.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/format.test.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/format.ts` | s1p3 · s1p5 · s1p6 |
| `apps/rn/src/utils/moneyFormatters.test.ts` | never · s1p6 |
| `apps/rn/src/utils/reportError.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/scrubBreadcrumb.test.ts` | never · s1p4 · s1p6 |
| `apps/rn/src/utils/scrubBreadcrumb.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/src/utils/sentry.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/sentry.web.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/share-card.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/share-card.web.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/sizeClass.ts` | s1p3 |
| `apps/rn/src/utils/skia-ready.ts` | s1p3 · s1p6 |
| `apps/rn/src/utils/skia-ready.web.ts` | never · partial · s1p6 |
| `apps/rn/src/widget/snapshot.ts` | s1p4 · s1p5 · s1p6 |
| `apps/rn/src/widget/widgetKeys.ts` | s1p3 · s1p6 |
| `apps/rn/src/widget/widgetStorage.native.ts` | s1p3 · s1p6 |
| `apps/rn/src/widget/widgetStorage.ts` | s1p3 · s1p6 |
| `apps/rn/src/widget/widgetSync.test.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `apps/rn/src/widget/widgetSync.ts` | s1p3 · s1p6 |
| `apps/rn/tests/e2e/a11y-axe.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/a11y-row-labels.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/absorb-entry.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/ack-coordinator.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/affordability.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/amount-guards.spec.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/tests/e2e/analytics-optout.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/bill-category-partition.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/blur-glass.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/bnpl.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/celebration.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/cushion-forecast.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/earlyjourney.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/enh-audit-screens.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/expense-reserve.spec.ts` | s1p3 · s1p6 |
| `apps/rn/tests/e2e/goal-pace-edit.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/goal-row-saved.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/greeting.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/guardian.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/helpers/seed.ts` | s1p3 · s1p6 |
| `apps/rn/tests/e2e/hero-date-fit.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/intent-undo.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/ipad-layouts.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/misfiled-expense.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/money-add-chooser.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/no-bills-branch.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/on-plan-streak.spec.ts` | s1p3 · s1p4 · s1p6 |
| `apps/rn/tests/e2e/payday-reopen.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/payoff-schedule.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/paywall.spec.ts` | s1p3 · s1p6 |
| `apps/rn/tests/e2e/plan-hero-conserves.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/premium-entry.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/progress-hero-journey.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/proofofwork.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/recovery.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/route-smoke.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/saveforit-pace.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/sheet-polish.spec.ts` | s1p3 · s1p6 |
| `apps/rn/tests/e2e/sheet-remove.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/spoken-state.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/strategy-compare.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/swipe-delete.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/swipe-mark-paid.spec.ts` | s1p3 · s1p6 |
| `apps/rn/tests/e2e/topup-sources.spec.ts` | s1p2 · s1p6 |
| `apps/rn/tests/e2e/trajectory-domain.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/trajectory-interactivity.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/trials.spec.ts` | s1p3 · s1p6 |
| `apps/rn/tests/e2e/trust-claims.spec.ts` | never · partial · s1p6 |
| `apps/rn/tests/e2e/variable-income.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/vis5-cone.spec.ts` | never · s1p4 · s1p6 |
| `apps/rn/tests/e2e/windfall.spec.ts` | s1p3 · s1p6 |
| `packages/core/cashflow/detectCrunches.ts` | s1p3 · s1p6 |
| `packages/core/cashflow/testDetectCrunches.ts` | s1p3 · s1p6 |
| `packages/core/cashflow/testWaterFill.ts` | s1p3 · s1p6 |
| `packages/core/cashflow/waterFill.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/constants/livingExpensePresets.ts` | s1p3 · s1p6 |
| `packages/core/constants/requiredExpensePresets.ts` | s1p3 · s1p6 |
| `packages/core/copy/vocabulary.ts` | s1p2 · s1p6 |
| `packages/core/debt/applyDebtPaymentProjection.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/applyPaydayCapture.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/applyRolloverPayment.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/debt/bnplInstallment.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/debt/bnplPayoffPace.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/bnplProviders.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/bnplSchedule.ts` | s1p3 · s1p6 |
| `packages/core/debt/buildAmortizationSchedule.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/buildPaydayCaptureItems.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/buildPayoffTrajectory.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/bulkMarkRequired.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/debt/calculateMonthlyInterest.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/cannotAmortize.ts` | s1p5 · s1p6 |
| `packages/core/debt/computeCycleDelta.ts` | s1p3 · s1p6 |
| `packages/core/debt/computeDrift.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/computeInterestSaved.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/computeMilestones.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/computeStreak.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/debtPrefillFromExpense.ts` | ⛔ **never** |
| `packages/core/debt/deriveRequiredActionView.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/extraPaymentPlan.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/getDebtsWithDisplayBalances.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/debt/mergeCompletedAction.ts` | s1p3 · s1p6 |
| `packages/core/debt/originalBalanceHighWater.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/parseDebtFormValues.ts` | s1p3 · s1p6 |
| `packages/core/debt/projectCurrentBalance.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/projectDebtPayoff.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/debt/reconcileAutopay.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/debt/reconcileGoalAmount.ts` | s1p3 · s1p6 |
| `packages/core/debt/selectActiveRecommendedActions.ts` | s1p3 · s1p6 |
| `packages/core/debt/shouldPromptPaydayCapture.ts` | s1p3 · s1p6 |
| `packages/core/debt/testAmortizationSchedule.ts` | s1p3 · s1p6 |
| `packages/core/debt/testApplyPaydayCapture.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testBnplInstallment.ts` | s1p3 · s1p4 · s1p6 |
| `packages/core/debt/testBnplSchedule.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testBuildPayoffTrajectory.ts` | s1p3 · s1p6 |
| `packages/core/debt/testBulkMarkRequired.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testComputeCycleDelta.ts` | s1p3 · s1p6 |
| `packages/core/debt/testComputeDrift.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testComputeInterestSaved.ts` | s1p3 · s1p6 |
| `packages/core/debt/testComputeMilestones.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testComputeStreak.ts` | s1p3 · s1p6 |
| `packages/core/debt/testDebtProjection.ts` | s1p3 · s1p4 · s1p6 |
| `packages/core/debt/testDeriveRequiredActionView.ts` | never · partial · s1p6 |
| `packages/core/debt/testFreedMinimumRoll.ts` | s1p3 · s1p6 |
| `packages/core/debt/testGetDebtsWithDisplayBalances.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testGoalReconciliation.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testOriginalBalanceHighWater.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testParseDebtFormValues.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testPaydayCapture.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testProjectCurrentBalance.ts` | s1p3 · s1p6 |
| `packages/core/debt/testProjectionAccuracy.ts` | s1p3 · s1p6 |
| `packages/core/debt/testReconcileAutopay.ts` | never · partial · s1p6 |
| `packages/core/debt/testSelectActiveRecommendedActions.ts` | never · s1p4 · s1p6 |
| `packages/core/debt/testShouldPromptPaydayCapture.ts` | never · s1p4 · s1p6 |
| `packages/core/engine/allocatePaycheck.ts` | r17 · s1p2 · s1p5 · s1p6 |
| `packages/core/engine/emergencyFund.ts` | r17 · s1p5 · s1p6 |
| `packages/core/engine/recommendedActions.ts` | never · s1p1 · s1p6 |
| `packages/core/engine/testAllocation.ts` | r17 · s1p6 |
| `packages/core/engine/testExpenseReserve.ts` | never · s1p1 · s1p6 |
| `packages/core/forecast/getForecastStatus.ts` | s1p3 · s1p6 |
| `packages/core/forecast/projectForecast.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/forecast/types.ts` | s1p3 · s1p6 |
| `packages/core/guardian/affordability.ts` | s1p1 · s1p2 · s1p6 |
| `packages/core/guardian/buildGuardianBrief.ts` | s1p1 · s1p2 · s1p5 · s1p6 |
| `packages/core/guardian/calibrationScore.ts` | never · s1p1 · s1p6 |
| `packages/core/guardian/computeState.ts` | s1p1 · s1p2 · s1p5 · s1p6 |
| `packages/core/guardian/holdbackComposition.ts` | s1p1 · s1p5 · s1p6 |
| `packages/core/guardian/notificationDecision.ts` | never · s1p1 · s1p6 |
| `packages/core/guardian/testAffordability.ts` | never · s1p1 · s1p6 |
| `packages/core/guardian/testBuildGuardianBrief.ts` | s1p1 · s1p2 · s1p6 |
| `packages/core/guardian/testCalibrationScore.ts` | never · s1p1 · s1p6 |
| `packages/core/guardian/testComputeState.ts` | never · s1p1 · s1p6 |
| `packages/core/guardian/testGuardianPartition.ts` | never · s1p1 · s1p6 |
| `packages/core/guardian/testNotificationDecision.ts` | never · s1p1 · s1p6 |
| `packages/core/history/buildCycleSnapshot.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/history/selectVisibleHistory.ts` | s1p3 · s1p6 |
| `packages/core/income/suggestLean.ts` | s1p3 · s1p6 |
| `packages/core/income/testSuggestLean.ts` | s1p3 · s1p6 |
| `packages/core/insights/buildSmartInsights.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/obligations/classifyDeferability.ts` | s1p2 · s1p5 · s1p6 |
| `packages/core/obligations/effectiveObligationAmount.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/obligations/testClassifyDeferability.ts` | never · s1p4 · s1p6 |
| `packages/core/obligations/testEffectiveObligationAmount.ts` | never · s1p4 · s1p6 |
| `packages/core/payCycle/cyclesPerYear.ts` | s1p3 · s1p6 |
| `packages/core/payCycle/getNextPaycheckDate.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/payCycle/payCyclesPerMonth.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/payCycle/rollPaydayToFuture.ts` | s1p3 · s1p6 |
| `packages/core/payCycle/testPayCycle.ts` | s1p3 · s1p6 |
| `packages/core/payCycle/testPayCyclesPerMonth.ts` | s1p3 · s1p6 |
| `packages/core/payCycle/testRollPaydayToFuture.ts` | s1p3 · s1p6 |
| `packages/core/recovery/buildRecoveryPlan.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/recovery/testBuildRecoveryPlan.ts` | never · s1p4 · s1p6 |
| `packages/core/recurrence/rolloverPayCycle.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/recurrence/testRolloverDueDates.ts` | s1p3 · s1p6 |
| `packages/core/storage/debtPlannerStorage.ts` | s1p3 · s1p6 |
| `packages/core/timeline/buildMultiCycleTimeline.ts` | s1p2 · s1p5 · s1p6 |
| `packages/core/timeline/buildTimelineItems.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/types/livingExpense.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/types/recurrence.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/utils/addMonths.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/utils/amountField.ts` | s1p3 · s1p4 · s1p5 · s1p6 |
| `packages/core/utils/dayBefore.ts` | s1p3 · s1p6 |
| `packages/core/utils/formatCurrency.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/utils/formatDisplayAmount.ts` | s1p3 · s1p6 |
| `packages/core/utils/localDate.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/utils/money.ts` | s1p3 · s1p5 · s1p6 |
| `packages/core/utils/percentComplete.ts` | ⛔ **never** |
| `packages/core/utils/plural.ts` | s1p5 · s1p6 |
| `packages/core/utils/testAddMonths.ts` | s1p3 · s1p6 |
| `packages/core/utils/testAmountField.ts` | s1p3 · s1p4 · s1p6 |
| `packages/core/utils/testLocalDate.ts` | s1p3 · s1p6 |
| `packages/core/utils/updateById.ts` | ⛔ **never** |

## ⛔ Unswept — a finding here is FIRST-LOOK under [D69]

- `apps/rn/src/appIntents/siriClaims.test.ts`
- `apps/rn/src/components/entities/debtPrefill.test.ts`
- `apps/rn/src/components/plan/cashRunwayReceipt.test.ts`
- `apps/rn/src/components/plan/unreadInputsCopy.test.ts`
- `apps/rn/src/storage/cloudBackup/cloudBackupUnreadable.test.ts`
- `apps/rn/src/store/paydayRequiredSplit.test.ts`
- `apps/rn/src/store/staleClaims.test.ts`
- `packages/core/debt/debtPrefillFromExpense.ts`
- `packages/core/utils/percentComplete.ts`
- `packages/core/utils/updateById.ts`

<!-- claims-sha256: a34dad40aa09308b -->

