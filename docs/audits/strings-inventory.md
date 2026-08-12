# User-facing strings — inventory

> ⛔ **GENERATED. Do not edit.** Regenerate with `npm run audit:strings`.
> This is the **input** to the wording/voice gate, not its output. Findings belong in a dated
> audit folder; this file is only ever the current state of the codebase.

**551** strings in known copy props · **3501** unclassified · **259** appearing in more than one file.

## ⚠️ Unclassified — a prop nobody has sorted yet

These sit in JSX attributes that are in neither the copy list nor the technical list. Each is
either copy that the gate must read, or machinery that belongs in `TECHNICAL_PROPS`. Leaving one
here is how a surface goes unreviewed while the count looks complete.

- `array`
- `call:Keyboard.addListener`
- `call:adapter.quarantine`
- `call:amount).toLocaleString`
- `call:announce`
- `call:assert`
- `call:assertApprox`
- `call:assertClose`
- `call:assertEq`
- `call:assertEqual`
- `call:assertGreaterThan`
- `call:assertMoney`
- `call:assertTrue`
- `call:atRisk.has`
- `call:calls.push`
- `call:canManageSubscription`
- `call:check`
- `call:coachMarksSeen.includes`
- `call:collapsed.has`
- `call:computeState`
- `call:console.log`
- `call:console.warn`
- `call:covered).toLocaleString`
- `call:d.toLocaleString`
- `call:date.toLocaleString`
- `call:detail.includes`
- `call:drivers.push`
- `call:eq`
- `call:f.endsWith`
- `call:first.startsWith`
- `call:floor(abs).toLocaleString`
- `call:free.has`
- `call:fullAmount.toLocaleString`
- `call:getState().applyRiskNotified`
- `call:getState().show`
- `call:groupLabel`
- `call:hasFeatureAccess`
- `call:id.startsWith`
- `call:ids.add`
- `call:isFinite(n) ? n : 0)).toLocaleString`
- `call:join`
- `call:line.includes`
- `call:lookahead.includes`
- `call:max(0, n)).toLocaleString`
- `call:month).toLocaleString`
- `call:normalizeDisplayName`
- `call:only`
- `call:parsePendingActions`
- `call:parseStatementText`
- `call:personaScenario`
- `call:publishSandbox`
- `call:require`
- `call:requireNativeModule`
- `call:requireNativeViewManager`
- `call:resolveScenario`
- `call:round(n).toLocaleString`
- `call:round(v)).toLocaleString`
- `call:router.navigate`
- `call:router.push`
- `call:router.replace`
- `call:safeMove?.includes`
- `call:scenarioForBeat`
- `call:schedule`
- `call:selectGreeting`
- `call:setError`
- `call:setLeanError`
- `call:shareDebtCard`
- `call:stepAnnouncement(s).includes`
- `call:subjects.has`
- `call:sumCategory`
- `call:throws`
- `call:useCoachMark`
- `call:validateDayOfTheMonth`
- `call:value.toLocaleString`
- `expr`
- `key:"at-risk"`
- `key:'account-balance-wallet'`
- `key:'add-circle-outline'`
- `key:'annually'`
- `key:'aria-hidden'`
- `key:'at-risk'`
- `key:'auto-graph'`
- `key:'biweekly'`
- `key:'check-circle'`
- `key:'chevron-left'`
- `key:'chevron-right'`
- `key:'debt-row-actions'`
- `key:'error-outline'`
- `key:'expand-more'`
- `key:'gpp-bad'`
- `key:'gpp-good'`
- `key:'gpp-maybe'`
- `key:'lightbulb-outline'`
- `key:'monthly'`
- `key:'more-horiz'`
- `key:'one-time'`
- `key:'payoff-schedule'`
- `key:'per-paycheck'`
- `key:'phone-iphone'`
- `key:'quarterly'`
- `key:'shopping-cart'`
- `key:'tab-money'`
- `key:'tab-progress'`
- `key:'tab-today'`
- `key:'task-alt'`
- `key:'trajectory-scrub'`
- `key:'trending-down'`
- `key:'trending-up'`
- `key:'verified-user'`
- `key:'weekly'`
- `key:'workspace-premium'`
- `key:action`
- `key:afternoon`
- `key:alignItems`
- `key:alignSelf`
- `key:assignment`
- `key:autopay_debt`
- `key:back`
- `key:backgroundColor`
- `key:badge`
- `key:balance`
- `key:band`
- `key:beat`
- `key:bills`
- `key:biweekly`
- `key:bnplProvider`
- `key:body`
- `key:borderColor`
- `key:borderTopColor`
- `key:boxShadow`
- `key:buttonTitle`
- `key:cancel`
- `key:category`
- `key:celebration`
- `key:clause`
- `key:clear`
- `key:coach`
- `key:color`
- `key:countdownLabel`
- `key:currency`
- `key:dark`
- `key:debts`
- `key:deployTargetName`
- `key:detail`
- `key:dim`
- `key:discretionary`
- `key:display`
- `key:emergency`
- `key:estimatedDebtFreeDate`
- `key:evening`
- `key:examples`
- `key:expense`
- `key:fallbackLabel`
- `key:focusDebtName`
- `key:free`
- `key:from`
- `key:glow`
- `key:goals`
- `key:guardianState`
- `key:healing`
- `key:hint`
- `key:history`
- `key:housing`
- `key:icon`
- `key:id`
- `key:identifier`
- `key:insurance`
- `key:justifyContent`
- `key:key`
- `key:kind`
- `key:label`
- `key:light`
- `key:line`
- `key:living_reserve`
- `key:lock`
- `key:md`
- `key:medical`
- `key:message`
- `key:mimeType`
- `key:minimum_debt`
- `key:more`
- `key:morning`
- `key:name`
- `key:next`
- `key:note`
- `key:notifiedRiskLevel`
- `key:operation`
- `key:other`
- `key:passed`
- `key:payoffTarget`
- `key:periodLabel`
- `key:pinned`
- `key:premium`
- `key:projectedDebtFreeDate`
- `key:promptMessage`
- `key:reason`
- `key:recurrence`
- `key:ringCore`
- `key:safeMove`
- `key:savings`
- `key:scenarioId`
- `key:screen`
- `key:seam`
- `key:search`
- `key:sf`
- `key:shield`
- `key:star`
- `key:state`
- `key:sub`
- `key:sublabel`
- `key:subnote`
- `key:subscriptions`
- `key:subsystem`
- `key:systemIcon`
- `key:target`
- `key:testID`
- `key:text`
- `key:tight`
- `key:title`
- `key:to`
- `key:track`
- `key:tradeoffTargetName`
- `key:type`
- `key:update`
- `key:utilities`
- `key:value`
- `other`
- `prop:amount`
- `prop:amountSuffix`
- `prop:colors`
- `prop:ctaTestID`
- `prop:error`
- `prop:getComponent`
- `prop:meta`
- `prop:onBack`
- `prop:onDemo`
- `prop:onPress`
- `prop:onSeeForecast`
- `prop:options`
- `prop:pointerEvents`
- `prop:previewConfig`
- `prop:sub`
- `return`
- `var:AFFORD_PREVIEW_ID`
- `var:AMT`
- `var:CYCLE_HISTORY_STORAGE_KEY`
- `var:DEBT_RC_IOS_KEY`
- `var:EXAMPLE_MONEY`
- `var:FREEDOM_SCHEME_URL`
- `var:FREEDOM_STORE_URL`
- `var:ID_BILLS_ALERT`
- `var:ID_PAYCHECK_EVE`
- `var:ID_PAYDAY_CAPTURE`
- `var:ID_RISK`
- `var:KEY`
- `var:LIFETIME_PRODUCT_ID`
- `var:LIFETIME_SUBNOTE`
- `var:LIVE_ACTIVITY_APP_GROUP`
- `var:MANAGE_SUBSCRIPTION_URL`
- `var:NOTIF_CATEGORY_BILLS`
- `var:NOTIF_CATEGORY_PAYDAY`
- `var:NOTIF_CATEGORY_RISK`
- `var:NOW`
- `var:PAYDAY_ACTIVITY_DEEPLINK`
- `var:PRIVACY_POLICY_URL`
- `var:QUARANTINE_PREFIX`
- `var:SUPPORT_URL`
- `var:TERMS_OF_USE_URL`
- `var:WIDGET_APP_GROUP`
- `var:WIDGET_KIND`
- `var:WIDGET_SNAPSHOT_KEY`
- `var:message`

## Duplicated across files

- **"at-risk"** — `apps/rn/src/components/more/LiveActivityQA.tsx:39` · `apps/rn/src/components/plan/CashRunwayChart.tsx:42` · `apps/rn/src/components/plan/CashRunwayChart.tsx:102` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:104` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:294` · `apps/rn/src/store/guardianSelectors.test.ts:70` · `apps/rn/src/store/guardianSelectors.test.ts:73` · `apps/rn/src/store/guardianSubjects.test.ts:93` · `apps/rn/src/store/guardianSubjects.ts:64` · `apps/rn/src/store/sandboxBeats.test.ts:111` · `apps/rn/src/store/sandboxScenarios.test.ts:66` · `apps/rn/src/store/sandboxScenarios.test.ts:66` · `apps/rn/src/store/sandboxScenarios.test.ts:74` · `apps/rn/src/store/sandboxScenarios.test.ts:87` · `apps/rn/src/store/sandboxScenarios.test.ts:165` · `apps/rn/src/store/sandboxScenarios.test.ts:177` · `apps/rn/src/store/sandboxScenarios.test.ts:181` · `apps/rn/src/store/sandboxScenarios.test.ts:186` · `apps/rn/src/store/sandboxScenarios.test.ts:186` · `apps/rn/src/store/sandboxScenarios.test.ts:191` · `apps/rn/src/store/sandboxScenarios.test.ts:192` · `apps/rn/src/store/sandboxScenarios.test.ts:193` · `apps/rn/src/store/sandboxScenarios.test.ts:196` · `apps/rn/src/store/sandboxScenarios.test.ts:199` · `apps/rn/src/store/sandboxScenarios.ts:32` · `apps/rn/src/store/sandboxScenarios.ts:77` · `apps/rn/src/store/sandboxScenarios.ts:193` · `apps/rn/src/store/sandboxScenarios.ts:351` · `apps/rn/src/store/storeActions.test.ts:178` · `apps/rn/src/store/storeActions.test.ts:179` · `apps/rn/src/store/storeActions.test.ts:182` · `apps/rn/src/store/tutorialPath.ts:149` · `packages/core/guardian/buildGuardianBrief.ts:17` · `packages/core/guardian/buildGuardianBrief.ts:278` · `packages/core/guardian/buildGuardianBrief.ts:283` · `packages/core/guardian/computeState.ts:33` · `packages/core/guardian/computeState.ts:47` · `packages/core/guardian/computeState.ts:49` · `packages/core/guardian/computeState.ts:54` · `packages/core/guardian/notificationDecision.ts:23` · `packages/core/guardian/notificationDecision.ts:68` · `packages/core/guardian/testBuildGuardianBrief.ts:58` · `packages/core/guardian/testComputeState.ts:17` · `packages/core/guardian/testComputeState.ts:25` · `packages/core/guardian/testComputeState.ts:29` · `packages/core/guardian/testComputeState.ts:30` · `packages/core/guardian/testComputeState.ts:35` · `packages/core/guardian/testComputeState.ts:35` · `packages/core/guardian/testComputeState.ts:36` · `packages/core/guardian/testComputeState.ts:37` · `packages/core/guardian/testComputeState.ts:40` · `packages/core/guardian/testNotificationDecision.ts:14` · `packages/core/guardian/testNotificationDecision.ts:31` · `packages/core/guardian/testNotificationDecision.ts:34` · `packages/core/guardian/testNotificationDecision.ts:37` · `packages/core/guardian/testNotificationDecision.ts:42` · `packages/core/storage/debtPlannerStorage.ts:133`
- **"one-time"** — `apps/rn/src/app/(tabs)/money.tsx:70` · `apps/rn/src/app/(tabs)/money.tsx:544` · `apps/rn/src/app/(tabs)/money.tsx:545` · `apps/rn/src/app/(tabs)/money.tsx:602` · `apps/rn/src/app/(tabs)/money.tsx:603` · `apps/rn/src/app/(tabs)/money.tsx:628` · `apps/rn/src/app/(tabs)/money.tsx:630` · `apps/rn/src/components/entities/DebtSheet.tsx:46` · `apps/rn/src/components/entities/ExpenseSheet.tsx:19` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:35` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:35` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:95` · `apps/rn/src/components/plan/AffordabilityCard.tsx:77` · `apps/rn/src/components/plan/AffordabilityCard.tsx:87` · `apps/rn/src/store/guardianSelectors.ts:384` · `apps/rn/src/store/recoverySelectors.test.ts:121` · `apps/rn/src/utils/format.ts:9` · `apps/rn/src/utils/format.ts:23` · `packages/core/debt/bnplPayoffPace.ts:35` · `packages/core/debt/testBnplInstallment.ts:98` · `packages/core/debt/testDebtProjection.ts:354` · `packages/core/debt/testDebtProjection.ts:377` · `packages/core/debt/testDebtProjection.ts:399` · `packages/core/debt/testDebtProjection.ts:413` · `packages/core/debt/testDebtProjection.ts:438` · `packages/core/engine/allocatePaycheck.ts:199` · `packages/core/imports/debtCsv.ts:9` · `packages/core/recurrence/rolloverPayCycle.ts:59` · `packages/core/recurrence/rolloverPayCycle.ts:71` · `packages/core/recurrence/rolloverPayCycle.ts:104` · `packages/core/recurrence/rolloverPayCycle.ts:132` · `packages/core/recurrence/testRolloverDueDates.ts:87` · `packages/core/recurrence/testRolloverDueDates.ts:98` · `packages/core/timeline/buildMultiCycleTimeline.ts:148` · `packages/core/timeline/buildMultiCycleTimeline.ts:153` · `packages/core/timeline/buildMultiCycleTimeline.ts:224` · `packages/core/timeline/buildMultiCycleTimeline.ts:229` · `packages/core/types/recurrence.ts:2`
- **"space-between"** — `apps/rn/src/app/(tabs)/money.tsx:964` · `apps/rn/src/app/(tabs)/money.tsx:976` · `apps/rn/src/app/history.tsx:106` · `apps/rn/src/app/history.tsx:107` · `apps/rn/src/app/living-expenses.tsx:78` · `apps/rn/src/components/entities/AmortizationView.tsx:116` · `apps/rn/src/components/entities/AmortizationView.tsx:123` · `apps/rn/src/components/entities/DebtSheet.tsx:361` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:113` · `apps/rn/src/components/money/BnplCalendarSection.tsx:104` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:485` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:496` · `apps/rn/src/components/payoff/TrajectoryChart.tsx:482` · `apps/rn/src/components/payoff/TrajectoryChart.tsx:486` · `apps/rn/src/components/payoff/TrajectoryChart.tsx:494` · `apps/rn/src/components/payoff/TrajectoryChart.tsx:502` · `apps/rn/src/components/plan/AffordabilityImpactBar.tsx:75` · `apps/rn/src/components/plan/CashRunwayChart.tsx:223` · `apps/rn/src/components/plan/CashRunwayChart.tsx:232` · `apps/rn/src/components/plan/CashRunwayChart.tsx:234` · `apps/rn/src/components/plan/CushionFloorSheet.tsx:80` · `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:58` · `apps/rn/src/components/screen.tsx:130` · `apps/rn/src/components/ui/ChartSkeleton.tsx:23` · `apps/rn/src/components/ui/Select.tsx:68` · `apps/rn/src/components/ui/Select.tsx:72` · `apps/rn/src/components/ui/sheet-styles.ts:35` · `apps/rn/src/components/ui/SwitchRow.tsx:21`
- **"optional_goal"** — `apps/rn/src/store/guardianSelectors.ts:424` · `apps/rn/src/store/guardianSelectors.ts:565` · `apps/rn/src/store/planSelectors.ts:41` · `apps/rn/src/store/planSelectors.ts:49` · `apps/rn/src/store/planSelectors.ts:57` · `apps/rn/src/store/planSelectors.ts:309` · `packages/core/debt/applyPaydayCapture.ts:26` · `packages/core/debt/buildPaydayCaptureItems.ts:6` · `packages/core/debt/selectActiveRecommendedActions.ts:76` · `packages/core/debt/testPaydayCapture.ts:20` · `packages/core/debt/testSelectActiveRecommendedActions.ts:98` · `packages/core/debt/testSelectActiveRecommendedActions.ts:99` · `packages/core/debt/testSelectActiveRecommendedActions.ts:114` · `packages/core/engine/allocatePaycheck.ts:65` · `packages/core/engine/allocatePaycheck.ts:82` · `packages/core/engine/allocatePaycheck.ts:525` · `packages/core/engine/allocatePaycheck.ts:603` · `packages/core/engine/recommendedActions.ts:7` · `packages/core/engine/recommendedActions.ts:74` · `packages/core/engine/recommendedActions.ts:106` · `packages/core/storage/debtPlannerStorage.ts:124` · `packages/core/timeline/buildMultiCycleTimeline.ts:274` · `packages/core/timeline/buildTimelineItems.ts:20` · `packages/core/timeline/buildTimelineItems.ts:125`
- **"decimal-pad"** — `apps/rn/src/components/entities/DebtSheet.tsx:307` · `apps/rn/src/components/entities/DebtSheet.tsx:319` · `apps/rn/src/components/entities/DebtSheet.tsx:344` · `apps/rn/src/components/entities/DebtSheet.tsx:345` · `apps/rn/src/components/entities/ExpenseSheet.tsx:106` · `apps/rn/src/components/entities/ExpenseSheet.tsx:114` · `apps/rn/src/components/entities/GoalSheet.tsx:65` · `apps/rn/src/components/entities/GoalSheet.tsx:66` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:59` · `apps/rn/src/components/entities/LogPaymentSheet.tsx:43` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:145` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:158` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:162` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:176` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:115` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:133` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:306` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:394` · `apps/rn/src/components/plan/AffordabilityCard.tsx:164` · `apps/rn/src/components/plan/PaycheckSheet.tsx:111` · `apps/rn/src/components/plan/PaycheckSheet.tsx:131` · `apps/rn/src/components/plan/SaveForItSheet.tsx:149` · `apps/rn/src/components/plan/WindfallSheet.tsx:91`
- **"Card"** — `apps/rn/src/store/affordability.test.ts:27` · `apps/rn/src/store/debtFreeBand.test.ts:20` · `apps/rn/src/store/milestoneCross.test.ts:26` · `apps/rn/src/store/planSelectors.test.ts:35` · `apps/rn/src/store/recoverySelectors.test.ts:37` · `apps/rn/src/store/sandboxStore.test.ts:70` · `apps/rn/src/store/steadyStateProjection.test.ts:33` · `apps/rn/src/store/storeActions.test.ts:47` · `apps/rn/src/store/storeActions.test.ts:307` · `apps/rn/src/store/windfallSplit.test.ts:28` · `packages/core/debt/testBnplSchedule.ts:63` · `packages/core/debt/testBulkMarkRequired.ts:24` · `packages/core/debt/testComputeMilestones.ts:17` · `packages/core/debt/testComputeMilestones.ts:67` · `packages/core/debt/testDebtProjection.ts:367` · `packages/core/debt/testDebtProjection.ts:378` · `packages/core/debt/testDebtProjection.ts:408` · `packages/core/debt/testDebtProjection.ts:414` · `packages/core/debt/testDeriveRequiredActionView.ts:26` · `packages/core/debt/testReconcileAutopay.ts:29` · `packages/core/engine/testAllocation.ts:265` · `packages/core/recurrence/testRolloverDueDates.ts:27`
- **"autopay_expense"** — `apps/rn/src/app/(tabs)/index.tsx:75` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:39` · `apps/rn/src/store/guardianSelectors.ts:421` · `apps/rn/src/store/planSelectors.ts:16` · `apps/rn/src/store/planSelectors.ts:128` · `apps/rn/src/store/planSelectors.ts:135` · `apps/rn/src/store/planSelectors.ts:145` · `apps/rn/src/store/planSelectors.ts:211` · `packages/core/debt/deriveRequiredActionView.ts:62` · `packages/core/debt/deriveRequiredActionView.ts:81` · `packages/core/debt/testDeriveRequiredActionView.ts:59` · `packages/core/debt/testDeriveRequiredActionView.ts:69` · `packages/core/debt/testDeriveRequiredActionView.ts:77` · `packages/core/debt/testDeriveRequiredActionView.ts:134` · `packages/core/debt/testDeriveRequiredActionView.ts:143` · `packages/core/engine/allocatePaycheck.ts:57` · `packages/core/engine/allocatePaycheck.ts:97` · `packages/core/engine/allocatePaycheck.ts:354` · `packages/core/engine/allocatePaycheck.ts:372` · `packages/core/timeline/buildTimelineItems.ts:15` · `packages/core/timeline/buildTimelineItems.ts:80`
- **"en-US"** — `apps/rn/src/app/(tabs)/index.tsx:484` · `apps/rn/src/app/(tabs)/index.tsx:532` · `apps/rn/src/components/entities/AmortizationView.tsx:15` · `apps/rn/src/components/payoff/TrajectoryChart.tsx:228` · `apps/rn/src/components/payoff/TrajectoryChart.tsx:387` · `apps/rn/src/components/plan/AffordabilityCard.tsx:21` · `apps/rn/src/components/plan/CushionFloorSheet.tsx:65` · `apps/rn/src/components/plan/LeanSuggestionCard.tsx:13` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:493` · `apps/rn/src/components/plan/PlanHero.tsx:27` · `apps/rn/src/components/plan/RecoveryPlanSection.tsx:13` · `apps/rn/src/components/plan/SaveForItSheet.tsx:16` · `apps/rn/src/store/guardianSelectors.ts:332` · `apps/rn/src/utils/format.ts:6` · `packages/core/debt/projectDebtPayoff.ts:34` · `packages/core/forecast/projectForecast.ts:120` · `packages/core/guardian/buildGuardianBrief.ts:125` · `packages/core/insights/buildSmartInsights.ts:144` · `packages/core/utils/formatCurrency.ts:15` · `packages/core/utils/formatDisplayAmount.ts:3`
- **"tabular-nums"** — `apps/rn/src/app/(tabs)/money.tsx:965` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:106` · `apps/rn/src/components/money/BnplCalendarSection.tsx:107` · `apps/rn/src/components/money/BnplCalendarSection.tsx:109` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:506` · `apps/rn/src/components/plan/CashRunwayChart.tsx:217` · `apps/rn/src/components/plan/PaidOffFinale.tsx:212` · `apps/rn/src/components/plan/PaidOffFinale.tsx:216` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:545` · `apps/rn/src/components/plan/PlanHero.tsx:198` · `apps/rn/src/components/plan/PlanHero.tsx:205` · `apps/rn/src/components/plan/RecoveryPlanSection.tsx:141` · `apps/rn/src/components/plan/SaveForItSheet.tsx:168` · `apps/rn/src/components/plan/ShareCard.tsx:94` · `apps/rn/src/components/plan/ShareCard.tsx:98` · `apps/rn/src/components/plan/VanquishedBeat.tsx:173` · `apps/rn/src/components/progress/CashFlowSection.tsx:151` · `apps/rn/src/components/progress/TimelineLedger.tsx:128` · `apps/rn/src/components/progress/TimelineLedger.tsx:134` · `apps/rn/src/theme/typography.ts:17`
- **"log-payment"** — `apps/rn/src/app/(tabs)/index.tsx:513` · `apps/rn/src/app/(tabs)/index.tsx:515` · `apps/rn/src/appIntents/pendingActions.test.ts:88` · `apps/rn/src/appIntents/pendingActions.test.ts:89` · `apps/rn/src/appIntents/pendingActions.test.ts:90` · `apps/rn/src/appIntents/pendingActions.test.ts:91` · `apps/rn/src/appIntents/pendingActions.test.ts:92` · `apps/rn/src/appIntents/pendingActions.test.ts:94` · `apps/rn/src/appIntents/pendingActions.test.ts:96` · `apps/rn/src/appIntents/pendingActions.test.ts:100` · `apps/rn/src/appIntents/pendingActions.test.ts:110` · `apps/rn/src/appIntents/pendingActions.ts:15` · `apps/rn/src/appIntents/pendingActions.ts:18` · `apps/rn/src/appIntents/pendingActions.ts:52` · `apps/rn/src/appIntents/pendingActions.ts:58` · `apps/rn/src/appIntents/pendingActions.ts:73` · `apps/rn/src/store/store.ts:55` · `apps/rn/src/store/store.ts:476` · `apps/rn/src/store/storeActions.test.ts:396`
- **"payoff-schedule"** — `apps/rn/src/components/entities/DebtSheet.tsx:128` · `apps/rn/src/components/entities/DebtSheet.tsx:281` · `apps/rn/src/store/coachMarkCopy.ts:28` · `apps/rn/src/store/coachMarks.test.ts:37` · `apps/rn/src/store/coachMarks.test.ts:38` · `apps/rn/src/store/coachMarks.test.ts:40` · `apps/rn/src/store/coachMarks.test.ts:46` · `apps/rn/src/store/coachMarks.test.ts:52` · `apps/rn/src/store/coachMarks.test.ts:65` · `apps/rn/src/store/coachMarks.test.ts:66` · `apps/rn/src/store/coachMarks.test.ts:86` · `apps/rn/src/store/coachMarks.test.ts:93` · `apps/rn/src/store/coachMarks.test.ts:94` · `apps/rn/src/store/coachMarks.test.ts:98` · `apps/rn/src/store/coachMarks.test.ts:100` · `apps/rn/src/store/coachMarks.test.ts:104` · `apps/rn/src/store/coachMarks.test.ts:107` · `apps/rn/src/store/coachMarks.test.ts:108`
- **"payday-landed"** — `apps/rn/src/appIntents/pendingActions.test.ts:39` · `apps/rn/src/appIntents/pendingActions.test.ts:40` · `apps/rn/src/appIntents/pendingActions.test.ts:41` · `apps/rn/src/appIntents/pendingActions.test.ts:41` · `apps/rn/src/appIntents/pendingActions.test.ts:44` · `apps/rn/src/appIntents/pendingActions.test.ts:46` · `apps/rn/src/appIntents/pendingActions.test.ts:52` · `apps/rn/src/appIntents/pendingActions.test.ts:63` · `apps/rn/src/appIntents/pendingActions.test.ts:109` · `apps/rn/src/appIntents/pendingActions.ts:14` · `apps/rn/src/appIntents/pendingActions.ts:18` · `apps/rn/src/appIntents/pendingActions.ts:61` · `apps/rn/src/appIntents/pendingActions.ts:70` · `apps/rn/src/store/store.ts:55` · `apps/rn/src/store/store.ts:465`
- **"minimum_debt"** — `apps/rn/src/store/guardianSelectors.ts:421` · `apps/rn/src/store/planSelectors.ts:16` · `apps/rn/src/store/planSelectors.ts:149` · `apps/rn/src/store/planSelectors.ts:162` · `packages/core/debt/deriveRequiredActionView.ts:64` · `packages/core/debt/testDeriveRequiredActionView.ts:95` · `packages/core/debt/testDeriveRequiredActionView.ts:179` · `packages/core/debt/testDeriveRequiredActionView.ts:190` · `packages/core/engine/allocatePaycheck.ts:56` · `packages/core/engine/allocatePaycheck.ts:97` · `packages/core/engine/allocatePaycheck.ts:326` · `packages/core/engine/allocatePaycheck.ts:404` · `packages/core/engine/allocatePaycheck.ts:423` · `packages/core/timeline/buildTimelineItems.ts:16` · `packages/core/timeline/buildTimelineItems.ts:98`
- **"starter_emergency"** — `apps/rn/src/store/guardianSelectors.ts:423` · `apps/rn/src/store/guardianSelectors.ts:565` · `apps/rn/src/store/planSelectors.ts:41` · `apps/rn/src/store/planSelectors.ts:49` · `apps/rn/src/store/planSelectors.ts:57` · `packages/core/debt/selectActiveRecommendedActions.ts:66` · `packages/core/engine/allocatePaycheck.ts:62` · `packages/core/engine/allocatePaycheck.ts:79` · `packages/core/engine/allocatePaycheck.ts:504` · `packages/core/guardian/testGuardianPartition.ts:204` · `packages/core/guardian/testGuardianPartition.ts:212` · `packages/core/guardian/testGuardianPartition.ts:219` · `packages/core/guardian/testGuardianPartition.ts:222` · `packages/core/guardian/testGuardianPartition.ts:228` · `packages/core/timeline/buildMultiCycleTimeline.ts:274`
- **"flex-start"** — `apps/rn/src/app/paywall.tsx:344` · `apps/rn/src/components/entities/DebtSheet.tsx:322` · `apps/rn/src/components/entities/DebtSheet.tsx:334` · `apps/rn/src/components/onboarding/OnboardingLayout.tsx:54` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:485` · `apps/rn/src/components/plan/AffordabilityCard.tsx:243` · `apps/rn/src/components/plan/GuardianProofStrip.tsx:46` · `apps/rn/src/components/plan/MilestoneAckCard.tsx:54` · `apps/rn/src/components/plan/PlanHero.tsx:196` · `apps/rn/src/components/plan/PlanHero.tsx:210` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:346` · `apps/rn/src/components/progress/VanquishedArchive.tsx:99` · `apps/rn/src/components/ui/sheet-styles.ts:35` · `apps/rn/src/components/ui/TwoColumn.tsx:46`
- **"autopay_debt"** — `apps/rn/src/store/guardianSelectors.ts:421` · `apps/rn/src/store/planSelectors.ts:16` · `apps/rn/src/store/planSelectors.ts:135` · `apps/rn/src/store/planSelectors.ts:149` · `packages/core/debt/deriveRequiredActionView.ts:64` · `packages/core/debt/deriveRequiredActionView.ts:81` · `packages/core/debt/testDeriveRequiredActionView.ts:103` · `packages/core/engine/allocatePaycheck.ts:58` · `packages/core/engine/allocatePaycheck.ts:97` · `packages/core/engine/allocatePaycheck.ts:327` · `packages/core/engine/allocatePaycheck.ts:404` · `packages/core/engine/allocatePaycheck.ts:423` · `packages/core/timeline/buildTimelineItems.ts:17` · `packages/core/timeline/buildTimelineItems.ts:98`
- **"per-paycheck"** — `apps/rn/src/app/(tabs)/money.tsx:67` · `apps/rn/src/components/entities/DebtSheet.tsx:34` · `apps/rn/src/components/entities/ExpenseSheet.tsx:18` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:39` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:73` · `apps/rn/src/store/guardianSelectors.ts:198` · `apps/rn/src/utils/format.ts:9` · `apps/rn/src/utils/format.ts:24` · `packages/core/debt/bnplPayoffPace.ts:26` · `packages/core/imports/debtCsv.ts:9` · `packages/core/recurrence/rolloverPayCycle.ts:58` · `packages/core/recurrence/rolloverPayCycle.ts:75` · `packages/core/types/recurrence.ts:6`
- **"subscriptions"** — `apps/rn/src/app/(tabs)/money.tsx:509` · `apps/rn/src/components/entities/ExpenseSheet.tsx:27` · `apps/rn/src/store/recoverySelectors.test.ts:34` · `apps/rn/src/store/recoverySelectors.test.ts:35` · `apps/rn/src/store/recoverySelectors.test.ts:67` · `apps/rn/src/store/recoverySelectors.test.ts:68` · `apps/rn/src/store/recoverySelectors.test.ts:88` · `apps/rn/src/store/sandboxScenarios.ts:114` · `packages/core/obligations/classifyDeferability.ts:15` · `packages/core/obligations/testClassifyDeferability.ts:22` · `packages/core/obligations/testClassifyDeferability.ts:38` · `packages/core/storage/debtPlannerStorage.ts:7`
- **"Rent"** — `apps/rn/src/store/affordability.test.ts:67` · `apps/rn/src/store/looksLikeDebt.test.ts:26` · `apps/rn/src/store/recoverySelectors.test.ts:33` · `apps/rn/src/store/recoverySelectors.test.ts:66` · `apps/rn/src/store/recoverySelectors.test.ts:77` · `apps/rn/src/store/recoverySelectors.test.ts:87` · `packages/core/engine/testAllocation.ts:31` · `packages/core/engine/testAllocation.ts:264` · `packages/core/engine/testAllocation.ts:367` · `packages/core/guardian/testGuardianPartition.ts:41` · `packages/core/recurrence/testRolloverDueDates.ts:15` · `packages/core/recurrence/testRolloverDueDates.ts:88`
- **"Unable to estimate"** — `apps/rn/src/store/analysisSelectors.ts:110` · `apps/rn/src/store/analysisSelectors.ts:111` · `apps/rn/src/store/drift.ts:62` · `apps/rn/src/store/planSelectors.ts:96` · `packages/core/debt/computeInterestSaved.ts:47` · `packages/core/debt/computeInterestSaved.ts:48` · `packages/core/debt/projectDebtPayoff.ts:122` · `packages/core/debt/projectDebtPayoff.ts:214` · `packages/core/debt/testAmortizationSchedule.ts:158` · `packages/core/debt/testComputeInterestSaved.ts:72` · `packages/core/debt/testComputeInterestSaved.ts:77` · `packages/core/debt/testDebtProjection.ts:187`
- **"discovery_holdback"** — `apps/rn/src/store/guardianSelectors.ts:422` · `apps/rn/src/store/planSelectors.ts:79` · `packages/core/debt/selectActiveRecommendedActions.ts:99` · `packages/core/engine/allocatePaycheck.ts:61` · `packages/core/engine/allocatePaycheck.ts:73` · `packages/core/engine/allocatePaycheck.ts:483` · `packages/core/guardian/testGuardianPartition.ts:100` · `packages/core/guardian/testGuardianPartition.ts:108` · `packages/core/guardian/testGuardianPartition.ts:115` · `packages/core/guardian/testGuardianPartition.ts:168` · `packages/core/guardian/testGuardianPartition.ts:176` · `packages/core/guardian/testGuardianPartition.ts:182`
- **"Visa"** — `apps/rn/src/store/looksLikeDebt.test.ts:29` · `apps/rn/src/store/looksLikeDebt.test.ts:29` · `apps/rn/src/widget/widgetSync.test.ts:45` · `apps/rn/src/widget/widgetSync.test.ts:58` · `apps/rn/src/widget/widgetSync.test.ts:68` · `apps/rn/src/widget/widgetSync.test.ts:75` · `apps/rn/src/widget/widgetSync.test.ts:84` · `packages/core/debt/testSelectActiveRecommendedActions.ts:35` · `packages/core/debt/testSelectActiveRecommendedActions.ts:85` · `packages/core/debt/testSelectActiveRecommendedActions.ts:104` · `packages/core/guardian/testGuardianPartition.ts:45` · `packages/core/guardian/testGuardianPartition.ts:194`
- **"check-circle"** — `apps/rn/src/app/(tabs)/index.tsx:467` · `apps/rn/src/app/paywall.tsx:238` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:364` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:462` · `apps/rn/src/components/plan/AffordabilityCard.tsx:106` · `apps/rn/src/components/plan/AffordabilityCard.tsx:118` · `apps/rn/src/components/plan/AffordabilityCard.tsx:142` · `apps/rn/src/components/plan/PayoffInvitationCard.tsx:36` · `apps/rn/src/components/plan/PlanHero.tsx:169` · `apps/rn/src/components/plan/WindfallSheet.tsx:20` · `apps/rn/src/theme/icons.ts:41`
- **"chevron-right"** — `apps/rn/src/app/(tabs)/money.tsx:815` · `apps/rn/src/app/(tabs)/money.tsx:841` · `apps/rn/src/app/(tabs)/money.tsx:930` · `apps/rn/src/components/entities/DebtSheet.tsx:276` · `apps/rn/src/components/entities/DebtSheet.tsx:288` · `apps/rn/src/components/more/SettingRow.tsx:52` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:170` · `apps/rn/src/components/premium/PremiumInvite.tsx:28` · `apps/rn/src/components/ui/ListRow.tsx:126` · `apps/rn/src/theme/icons.ts:35`
- **"discretionary"** — `apps/rn/src/app/(tabs)/money.tsx:510` · `apps/rn/src/components/entities/ExpenseSheet.tsx:30` · `apps/rn/src/components/plan/AffordabilityCard.tsx:77` · `apps/rn/src/components/plan/AffordabilityCard.tsx:87` · `apps/rn/src/store/recoverySelectors.test.ts:125` · `packages/core/obligations/classifyDeferability.ts:15` · `packages/core/obligations/testClassifyDeferability.ts:26` · `packages/core/obligations/testClassifyDeferability.ts:27` · `packages/core/storage/debtPlannerStorage.ts:11`
- **"Klarna"** — `apps/rn/src/components/entities/DebtSheet.tsx:52` · `apps/rn/src/components/entities/DebtSheet.tsx:52` · `apps/rn/src/store/bnplCadence.test.ts:24` · `apps/rn/src/store/bnplCadence.test.ts:25` · `apps/rn/src/store/celebrationSelectors.test.ts:33` · `packages/core/debt/testBnplSchedule.ts:23` · `packages/core/debt/testBnplSchedule.ts:23` · `packages/core/debt/testDebtProjection.ts:331` · `packages/core/scan/parseStatementText.ts:28`
- **"false_clear"** — `apps/rn/src/components/plan/GuardianScorecard.tsx:49` · `packages/core/guardian/calibrationScore.ts:28` · `packages/core/guardian/calibrationScore.ts:40` · `packages/core/guardian/calibrationScore.ts:63` · `packages/core/guardian/calibrationScore.ts:110` · `packages/core/guardian/calibrationScore.ts:119` · `packages/core/guardian/testCalibrationScore.ts:49` · `packages/core/guardian/testCalibrationScore.ts:65` · `packages/core/guardian/testCalibrationScore.ts:70`
- **"Vacation"** — `apps/rn/src/store/affordability.test.ts:49` · `apps/rn/src/store/affordability.test.ts:52` · `apps/rn/src/store/affordability.test.ts:68` · `apps/rn/src/store/affordability.test.ts:84` · `apps/rn/src/store/affordability.test.ts:92` · `apps/rn/src/store/guardianSelectors.test.ts:181` · `apps/rn/src/store/guardianSelectors.test.ts:185` · `packages/core/debt/testSelectActiveRecommendedActions.ts:107` · `packages/core/engine/testAllocation.ts:272`
- **"Emergency Fund"** — `apps/rn/src/store/affordability.test.ts:54` · `apps/rn/src/store/guardianSelectors.test.ts:46` · `apps/rn/src/store/guardianSelectors.test.ts:100` · `apps/rn/src/store/guardianSelectors.test.ts:172` · `apps/rn/src/store/guardianSelectors.test.ts:175` · `apps/rn/src/store/storeActions.test.ts:49` · `packages/core/guardian/testBuildGuardianBrief.ts:35` · `packages/core/guardian/testBuildGuardianBrief.ts:158` · `packages/core/guardian/testBuildGuardianBrief.ts:168`
- **"gpp-good"** — `apps/rn/src/app/(tabs)/index.tsx:481` · `apps/rn/src/app/(tabs)/index.tsx:500` · `apps/rn/src/app/(tabs)/index.tsx:530` · `apps/rn/src/app/more.tsx:150` · `apps/rn/src/components/onboarding/WelcomeStep.tsx:43` · `apps/rn/src/components/plan/GuardianScorecard.tsx:35` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:102` · `apps/rn/src/theme/icons.ts:64`
- **"flex-end"** — `apps/rn/src/app/paywall.tsx:354` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:494` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:604` · `apps/rn/src/components/plan/TutorialOverlay.tsx:544` · `apps/rn/src/components/progress/CashFlowSection.tsx:149` · `apps/rn/src/components/progress/CashFlowSection.tsx:152` · `apps/rn/src/components/progress/TimelineLedger.tsx:133` · `apps/rn/src/components/ui/sheet-styles.ts:12`
- **"Affirm"** — `apps/rn/src/components/entities/DebtSheet.tsx:53` · `apps/rn/src/components/entities/DebtSheet.tsx:53` · `packages/core/debt/testBnplSchedule.ts:28` · `packages/core/debt/testBnplSchedule.ts:28` · `packages/core/debt/testBnplSchedule.ts:36` · `packages/core/debt/testBnplSchedule.ts:46` · `packages/core/debt/testDebtProjection.ts:343` · `packages/core/scan/parseStatementText.ts:28`
- **"cushion_buffer"** — `apps/rn/src/store/guardianSelectors.ts:422` · `packages/core/debt/selectActiveRecommendedActions.ts:98` · `packages/core/engine/allocatePaycheck.ts:59` · `packages/core/engine/allocatePaycheck.ts:71` · `packages/core/engine/allocatePaycheck.ts:435` · `packages/core/engine/testAllocation.ts:181` · `packages/core/guardian/testGuardianPartition.ts:86` · `packages/core/timeline/buildTimelineItems.ts:106`
- **"Internet"** — `apps/rn/src/store/sandboxScenarios.ts:102` · `packages/core/constants/requiredExpensePresets.ts:31` · `packages/core/debt/testBulkMarkRequired.ts:12` · `packages/core/debt/testDeriveRequiredActionView.ts:14` · `packages/core/debt/testReconcileAutopay.ts:17` · `packages/core/engine/testAllocation.ts:236` · `packages/core/engine/testAllocation.ts:243` · `packages/core/engine/testAllocation.ts:250`
- **"guardian-card"** — `apps/rn/src/app/(tabs)/index.tsx:303` · `apps/rn/src/store/guardianSubjects.ts:40` · `apps/rn/src/store/guardianSubjects.ts:61` · `apps/rn/src/store/tutorialPath.ts:108` · `apps/rn/src/store/tutorialPath.ts:149` · `apps/rn/src/store/tutorialPath.ts:155` · `apps/rn/src/store/tutorialPath.ts:185`
- **"/mo"** — `apps/rn/src/app/(tabs)/money.tsx:64` · `apps/rn/src/app/(tabs)/money.tsx:478` · `apps/rn/src/app/(tabs)/money.tsx:478` · `apps/rn/src/components/entities/AmortizationView.tsx:67` · `apps/rn/src/components/payoff/WhatIfControls.tsx:83` · `apps/rn/src/store/guardianSelectors.test.ts:150` · `apps/rn/src/store/guardianSelectors.ts:201`
- **"Add"** — `apps/rn/src/app/(tabs)/money.tsx:314` · `apps/rn/src/app/(tabs)/money.tsx:381` · `apps/rn/src/app/(tabs)/money.tsx:658` · `apps/rn/src/app/(tabs)/money.tsx:738` · `apps/rn/src/app/(tabs)/money.tsx:863` · `apps/rn/src/app/(tabs)/money.tsx:903` · `apps/rn/src/components/plan/WindfallSheet.tsx:79`
- **"shopping-cart"** — `apps/rn/src/app/living-expenses.tsx:41` · `apps/rn/src/app/more.tsx:276` · `apps/rn/src/app/paywall.tsx:22` · `apps/rn/src/components/onboarding/WelcomeStep.tsx:15` · `apps/rn/src/components/plan/AffordabilityCard.tsx:160` · `apps/rn/src/components/progress/TimelineLedger.tsx:16` · `apps/rn/src/theme/icons.ts:52`
- **"workspace-premium"** — `apps/rn/src/app/more.tsx:103` · `apps/rn/src/app/more.tsx:112` · `apps/rn/src/app/more.tsx:119` · `apps/rn/src/app/more.tsx:128` · `apps/rn/src/app/paywall.tsx:210` · `apps/rn/src/components/premium/PremiumInvite.tsx:26` · `apps/rn/src/theme/icons.ts:73`
- **"/paywall"** — `apps/rn/src/app/more.tsx:131` · `apps/rn/src/components/plan/DemoDock.tsx:75` · `apps/rn/src/components/premium/PremiumInvite.tsx:21` · `apps/rn/src/store/demoExit.ts:8` · `apps/rn/src/store/demoExit.ts:28` · `apps/rn/src/store/demoExit.ts:39` · `apps/rn/src/store/demoExit.ts:39`
- **"Monthly"** — `apps/rn/src/app/paywall.tsx:60` · `apps/rn/src/app/paywall.tsx:77` · `apps/rn/src/components/entities/DebtSheet.tsx:31` · `apps/rn/src/components/entities/DebtSheet.tsx:44` · `apps/rn/src/components/entities/ExpenseSheet.tsx:15` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:22` · `apps/rn/src/components/plan/PaycheckSheet.tsx:22`
- **"number-pad"** — `apps/rn/src/components/entities/DebtSheet.tsx:308` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:150` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:153` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:159` · `apps/rn/src/components/plan/PaycheckSheet.tsx:149` · `apps/rn/src/components/plan/PaycheckSheet.tsx:152` · `apps/rn/src/components/plan/PaycheckSheet.tsx:158`
- **"#ffffff"** — `apps/rn/src/components/plan/CaptureSlate.tsx:160` · `apps/rn/src/components/plan/CashRunwayChart.tsx:94` · `apps/rn/src/components/ui/ListRow.tsx:189` · `apps/rn/src/theme/colors.ts:28` · `apps/rn/src/theme/colors.ts:30` · `apps/rn/src/theme/colors.ts:42` · `apps/rn/src/theme/colors.ts:43`
- **"guardian-adjust"** — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:132` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:418` · `apps/rn/src/store/guardianSubjects.test.ts:95` · `apps/rn/src/store/guardianSubjects.test.ts:100` · `apps/rn/src/store/guardianSubjects.ts:40` · `apps/rn/src/store/guardianSubjects.ts:64` · `apps/rn/src/store/tutorialPath.ts:121`
- **"guardian-reserve"** — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:156` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:388` · `apps/rn/src/store/guardianSubjects.test.ts:96` · `apps/rn/src/store/guardianSubjects.test.ts:100` · `apps/rn/src/store/guardianSubjects.ts:40` · `apps/rn/src/store/guardianSubjects.ts:66` · `apps/rn/src/store/tutorialPath.ts:140`
- **"prefunded_reserve"** — `apps/rn/src/store/guardianSelectors.ts:422` · `apps/rn/src/store/planSelectors.ts:79` · `packages/core/debt/selectActiveRecommendedActions.ts:100` · `packages/core/engine/allocatePaycheck.ts:60` · `packages/core/engine/allocatePaycheck.ts:72` · `packages/core/engine/allocatePaycheck.ts:476` · `packages/core/guardian/testGuardianPartition.ts:114`
- **"Undo"** — `apps/rn/src/app/(tabs)/index.tsx:521` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:240` · `apps/rn/src/components/plan/AffordabilityCard.tsx:128` · `apps/rn/src/components/plan/AffordabilityCard.tsx:149` · `apps/rn/src/components/plan/RecommendedActionsCard.tsx:70` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:219`
- **"Autopay"** — `apps/rn/src/app/(tabs)/money.tsx:468` · `apps/rn/src/app/(tabs)/money.tsx:722` · `apps/rn/src/components/entities/DebtSheet.tsx:350` · `apps/rn/src/components/entities/ExpenseSheet.tsx:118` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:262` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:258`
- **"expand-more"** — `apps/rn/src/app/(tabs)/money.tsx:815` · `apps/rn/src/components/payoff/TrajectoryChart.tsx:474` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:170` · `apps/rn/src/components/progress/TimelineLedger.tsx:86` · `apps/rn/src/components/ui/Select.tsx:32` · `apps/rn/src/theme/icons.ts:37`
- **"/money"** — `apps/rn/src/app/schedule/[id].tsx:31` · `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx:37` · `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx:48` · `apps/rn/src/store/demoRun.ts:23` · `apps/rn/src/store/demoRun.ts:90` · `apps/rn/src/store/demoSession.test.ts:75`
- **"#f7cf5f"** — `apps/rn/src/components/payoff/TrajectoryChart.tsx:258` · `apps/rn/src/components/plan/PaidOffFinale.tsx:36` · `apps/rn/src/components/plan/PaidOffFinale.tsx:38` · `apps/rn/src/components/plan/PaidOffFinale.tsx:44` · `apps/rn/src/theme/colors.ts:63` · `apps/rn/src/theme/colors.ts:63`
- **"box-none"** — `apps/rn/src/components/plan/CoachMarkLayer.tsx:79` · `apps/rn/src/components/plan/TutorialOverlay.tsx:180` · `apps/rn/src/components/plan/TutorialOverlay.tsx:256` · `apps/rn/src/components/plan/TutorialOverlay.tsx:477` · `apps/rn/src/components/plan/TutorialOverlay.tsx:487` · `apps/rn/src/components/plan/VanquishedBeat.tsx:108`
- **"surpriseOutflowLog"** — `apps/rn/src/store/guardianPrediction.test.ts:128` · `apps/rn/src/store/storeActions.test.ts:82` · `apps/rn/src/store/storeActions.test.ts:84` · `apps/rn/src/store/storeActions.test.ts:244` · `apps/rn/src/store/storeActions.test.ts:283` · `apps/rn/src/store/storeActions.test.ts:287`
- **"Netflix"** — `apps/rn/src/store/guardianSelectors.test.ts:146` · `apps/rn/src/store/guardianSelectors.test.ts:148` · `apps/rn/src/store/guardianSelectors.test.ts:156` · `apps/rn/src/store/looksLikeDebt.test.ts:38` · `apps/rn/src/store/recoverySelectors.test.ts:34` · `apps/rn/src/store/recoverySelectors.test.ts:67`
- **"false_tight"** — `packages/core/guardian/calibrationScore.ts:28` · `packages/core/guardian/calibrationScore.ts:40` · `packages/core/guardian/calibrationScore.ts:63` · `packages/core/guardian/calibrationScore.ts:120` · `packages/core/guardian/testCalibrationScore.ts:50` · `packages/core/guardian/testCalibrationScore.ts:72`
- **"demo_started"** — `apps/rn/src/analytics/funnel.test.ts:29` · `apps/rn/src/analytics/funnel.test.ts:33` · `apps/rn/src/analytics/funnel.test.ts:34` · `apps/rn/src/analytics/funnel.ts:37` · `apps/rn/src/app/demo.tsx:71`
- **"Today"** — `apps/rn/src/app/(tabs)/_layout.tsx:82` · `apps/rn/src/components/more/LiveActivityQA.tsx:39` · `apps/rn/src/components/more/LiveActivityQA.tsx:43` · `apps/rn/src/liveActivity/paydayActivityContent.test.ts:83` · `apps/rn/src/liveActivity/paydayActivityContent.ts:53`
- **"Got it"** — `apps/rn/src/app/(tabs)/index.tsx:470` · `apps/rn/src/app/(tabs)/index.tsx:488` · `apps/rn/src/app/(tabs)/index.tsx:505` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:95` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:98`
- **"Emergency fund"** — `apps/rn/src/app/(tabs)/money.tsx:892` · `apps/rn/src/components/entities/GoalSheet.tsx:70` · `apps/rn/src/store/sandboxScenarios.ts:160` · `apps/rn/src/store/windfallSplit.test.ts:29` · `apps/rn/src/store/windfallSplit.test.ts:76`
- **"trajectory-scrub"** — `apps/rn/src/app/(tabs)/progress.tsx:73` · `apps/rn/src/app/(tabs)/progress.tsx:202` · `apps/rn/src/store/coachMarkCopy.ts:40` · `apps/rn/src/store/coachMarks.test.ts:78` · `apps/rn/src/store/coachMarks.test.ts:79`
- **"trending-down"** — `apps/rn/src/app/(tabs)/progress.tsx:112` · `apps/rn/src/app/history.tsx:88` · `apps/rn/src/components/onboarding/WelcomeStep.tsx:14` · `apps/rn/src/components/plan/WindfallSheet.tsx:21` · `apps/rn/src/theme/icons.ts:54`
- **"trending-up"** — `apps/rn/src/app/history.tsx:88` · `apps/rn/src/components/plan/GraduationCards.tsx:48` · `apps/rn/src/components/plan/LeanSuggestionCard.tsx:34` · `apps/rn/src/theme/icons.ts:17` · `apps/rn/src/theme/icons.ts:53`
- **"/onboarding"** — `apps/rn/src/app/paywall.tsx:208` · `apps/rn/src/components/plan/DemoDock.tsx:73` · `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:72` · `apps/rn/src/store/demoExit.ts:8` · `apps/rn/src/store/demoExit.ts:38`
- **"Enter a name."** — `apps/rn/src/components/entities/DebtSheet.tsx:157` · `apps/rn/src/components/entities/ExpenseSheet.tsx:56` · `apps/rn/src/components/entities/GoalSheet.tsx:28` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:27` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:36`
- **"Save"** — `apps/rn/src/components/entities/DebtSheet.tsx:248` · `apps/rn/src/components/entities/ExpenseSheet.tsx:100` · `apps/rn/src/components/entities/GoalSheet.tsx:59` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:48` · `apps/rn/src/components/plan/CushionFloorSheet.tsx:48`
- **"Looks clear this paycheck"** — `apps/rn/src/components/more/LiveActivityQA.tsx:24` · `packages/core/guardian/buildGuardianBrief.ts:263` · `packages/core/guardian/buildGuardianBrief.ts:319` · `packages/core/guardian/buildGuardianBrief.ts:333` · `packages/core/guardian/buildGuardianBrief.ts:354`
- **"payoff-enabling"** — `apps/rn/src/components/payoff/TrajectoryChart.tsx:136` · `packages/core/debt/computeInterestSaved.ts:17` · `packages/core/debt/computeInterestSaved.ts:54` · `packages/core/debt/testComputeInterestSaved.ts:75` · `packages/core/debt/testComputeInterestSaved.ts:76`
- **"subscription"** — `apps/rn/src/premium/premiumKind.test.ts:27` · `apps/rn/src/premium/premiumKind.test.ts:36` · `apps/rn/src/premium/premiumKind.ts:17` · `apps/rn/src/premium/premiumKind.ts:26` · `apps/rn/src/premium/premiumKind.ts:35`
- **"not-risk"** — `apps/rn/src/store/guardianSelectors.ts:94` · `packages/core/guardian/notificationDecision.ts:40` · `packages/core/guardian/notificationDecision.ts:68` · `packages/core/guardian/testNotificationDecision.ts:27` · `packages/core/guardian/testNotificationDecision.ts:67`
- **"true_leftover"** — `apps/rn/src/store/guardianSelectors.ts:426` · `packages/core/engine/allocatePaycheck.ts:66` · `packages/core/engine/allocatePaycheck.ts:74` · `packages/core/engine/allocatePaycheck.ts:615` · `packages/core/guardian/testGuardianPartition.ts:223`
- **"High APR"** — `packages/core/debt/testDebtProjection.ts:133` · `packages/core/debt/testDebtProjection.ts:150` · `packages/core/debt/testProjectionAccuracy.ts:76` · `packages/core/debt/testProjectionAccuracy.ts:109` · `packages/core/debt/testProjectionAccuracy.ts:191`
- **"Progress"** — `apps/rn/src/app/(tabs)/_layout.tsx:87` · `apps/rn/src/app/(tabs)/progress.tsx:95` · `apps/rn/src/app/(tabs)/progress.tsx:110` · `apps/rn/src/app/(tabs)/progress.tsx:158`
- **"account-balance-wallet"** — `apps/rn/src/app/(tabs)/index.tsx:236` · `apps/rn/src/components/plan/WindfallSheet.tsx:25` · `apps/rn/src/theme/icons.ts:18` · `apps/rn/src/theme/icons.ts:50`
- **"Add a debt"** — `apps/rn/src/app/(tabs)/index.tsx:251` · `apps/rn/src/app/(tabs)/progress.tsx:115` · `apps/rn/src/components/entities/DebtSheet.tsx:238` · `apps/rn/src/components/entities/DebtSheet.tsx:238`
- **"debt-free"** — `apps/rn/src/app/(tabs)/index.tsx:261` · `apps/rn/src/app/(tabs)/progress.tsx:151` · `apps/rn/src/store/planSelectors.ts:270` · `apps/rn/src/store/planSelectors.ts:276`
- **"today-ack"** — `apps/rn/src/app/(tabs)/index.tsx:478` · `apps/rn/src/app/(tabs)/index.tsx:497` · `apps/rn/src/store/guardianSubjects.test.ts:110` · `apps/rn/src/store/tutorialPath.ts:141`
- **"credit-card"** — `apps/rn/src/app/(tabs)/money.tsx:311` · `apps/rn/src/app/(tabs)/money.tsx:408` · `apps/rn/src/components/progress/TimelineLedger.tsx:19` · `apps/rn/src/components/progress/TimelineLedger.tsx:20`
- **"BNPL"** — `apps/rn/src/app/(tabs)/money.tsx:468` · `apps/rn/src/store/guardianSelectors.ts:329` · `packages/core/debt/bnplSchedule.ts:42` · `packages/core/debt/bnplSchedule.ts:65`
- **"Other"** — `apps/rn/src/app/(tabs)/money.tsx:503` · `apps/rn/src/components/entities/DebtSheet.tsx:58` · `apps/rn/src/components/entities/DebtSheet.tsx:58` · `apps/rn/src/components/entities/ExpenseSheet.tsx:32`
- **"verified-user"** — `apps/rn/src/app/more.tsx:334` · `apps/rn/src/components/plan/GuardianProofStrip.tsx:30` · `apps/rn/src/components/plan/ShareCard.tsx:71` · `apps/rn/src/theme/icons.ts:68`
- **"Payoff schedule"** — `apps/rn/src/app/schedule/[id].tsx:25` · `apps/rn/src/app/schedule/[id].tsx:31` · `apps/rn/src/components/entities/AmortizationView.tsx:102` · `apps/rn/src/components/ui/ListRow.tsx:152`
- **"Weekly"** — `apps/rn/src/components/entities/DebtSheet.tsx:32` · `apps/rn/src/components/entities/ExpenseSheet.tsx:16` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:19` · `apps/rn/src/components/plan/PaycheckSheet.tsx:19`
- **"Zip"** — `apps/rn/src/components/entities/DebtSheet.tsx:56` · `apps/rn/src/components/entities/DebtSheet.tsx:56` · `packages/core/debt/testDebtProjection.ts:422` · `packages/core/scan/parseStatementText.ts:28`
- **"Name"** — `apps/rn/src/components/entities/DebtSheet.tsx:295` · `apps/rn/src/components/entities/ExpenseSheet.tsx:105` · `apps/rn/src/components/entities/GoalSheet.tsx:64` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:53`
- **"Amount"** — `apps/rn/src/components/entities/ExpenseSheet.tsx:106` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:169` · `apps/rn/src/components/plan/AffordabilityCard.tsx:164` · `apps/rn/src/components/plan/WindfallSheet.tsx:84`
- **"/paycheck"** — `apps/rn/src/components/money/BillBreakdownSheet.tsx:70` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:84` · `apps/rn/src/components/plan/SaveForItSheet.tsx:123` · `apps/rn/src/store/guardianSelectors.ts:198`
- **"Debt"** — `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:107` · `apps/rn/src/widget/widgetSync.test.ts:27` · `packages/core/debt/testComputeInterestSaved.ts:17` · `packages/core/debt/testSelectActiveRecommendedActions.ts:15`
- **"guardian-bar"** — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:244` · `apps/rn/src/store/guardianSubjects.ts:40` · `apps/rn/src/store/guardianSubjects.ts:61` · `apps/rn/src/store/tutorialPath.ts:113`
- **"on-track"** — `apps/rn/src/components/plan/PlanHero.tsx:91` · `apps/rn/src/components/plan/PlanHero.tsx:169` · `apps/rn/src/store/planSelectors.ts:280` · `apps/rn/src/store/planSelectors.ts:337`
- **"/progress"** — `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx:36` · `apps/rn/src/store/demoRun.ts:23` · `apps/rn/src/store/demoRun.ts:93` · `apps/rn/src/store/demoSession.test.ts:76`
- **"Groceries"** — `apps/rn/src/store/sandboxScenarios.ts:154` · `packages/core/constants/livingExpensePresets.ts:5` · `packages/core/engine/testAllocation.ts:312` · `packages/core/guardian/testGuardianPartition.ts:44`
- **"USD"** — `apps/rn/src/utils/format.ts:6` · `packages/core/forecast/projectForecast.ts:122` · `packages/core/insights/buildSmartInsights.ts:146` · `packages/core/utils/formatCurrency.ts:17`
- **"on_track"** — `packages/core/debt/computeDrift.ts:28` · `packages/core/debt/computeDrift.ts:108` · `packages/core/debt/computeDrift.ts:110` · `packages/core/debt/testComputeDrift.ts:56`
- **"Couch"** — `packages/core/debt/testSelectActiveRecommendedActions.ts:106` · `packages/core/engine/testAllocation.ts:271` · `packages/core/engine/testAllocation.ts:283` · `packages/core/engine/testAllocation.ts:291`
- **"demo_completed"** — `apps/rn/src/analytics/funnel.test.ts:38` · `apps/rn/src/analytics/funnel.ts:39` · `apps/rn/src/store/demoSession.ts:117`
- **"tutorial_started"** — `apps/rn/src/analytics/funnel.test.ts:39` · `apps/rn/src/analytics/funnel.ts:41` · `apps/rn/src/store/tutorialSession.ts:178`
- **"demo_exited"** — `apps/rn/src/analytics/funnel.test.ts:43` · `apps/rn/src/analytics/funnel.ts:40` · `apps/rn/src/store/demoExit.ts:28`
- **"unlock_premium"** — `apps/rn/src/analytics/funnel.test.ts:43` · `apps/rn/src/analytics/funnel.ts:30` · `apps/rn/src/store/demoExit.ts:28`
- **"no-paycheck"** — `apps/rn/src/app/(tabs)/index.tsx:233` · `apps/rn/src/store/planSelectors.ts:270` · `apps/rn/src/store/planSelectors.ts:274`
- **"no-debts"** — `apps/rn/src/app/(tabs)/index.tsx:244` · `apps/rn/src/store/planSelectors.ts:270` · `apps/rn/src/store/planSelectors.ts:276`
- **"add-circle-outline"** — `apps/rn/src/app/(tabs)/index.tsx:247` · `apps/rn/src/components/plan/PlanHero.tsx:179` · `apps/rn/src/theme/icons.ts:44`
- **"Not now"** — `apps/rn/src/app/(tabs)/index.tsx:544` · `apps/rn/src/components/plan/LeanSuggestionCard.tsx:41` · `apps/rn/src/components/plan/TutorialInviteCard.tsx:44`
- **"debt-row-actions"** — `apps/rn/src/app/(tabs)/money.tsx:259` · `apps/rn/src/app/(tabs)/money.tsx:377` · `apps/rn/src/store/coachMarkCopy.ts:35`
- **"Utilities"** — `apps/rn/src/app/(tabs)/money.tsx:498` · `apps/rn/src/components/entities/ExpenseSheet.tsx:25` · `apps/rn/src/store/sandboxScenarios.ts:100`
- **"Insurance"** — `apps/rn/src/app/(tabs)/money.tsx:499` · `apps/rn/src/components/entities/ExpenseSheet.tsx:26` · `packages/core/constants/requiredExpensePresets.ts:41`
- **"Subscriptions"** — `apps/rn/src/app/(tabs)/money.tsx:500` · `apps/rn/src/components/entities/ExpenseSheet.tsx:27` · `apps/rn/src/store/sandboxScenarios.ts:114`
- **"Premium"** — `apps/rn/src/app/more.tsx:104` · `apps/rn/src/app/more.tsx:120` · `apps/rn/src/app/paywall.tsx:208`
- **"Every 2 weeks"** — `apps/rn/src/components/entities/DebtSheet.tsx:33` · `apps/rn/src/components/entities/DebtSheet.tsx:43` · `apps/rn/src/components/entities/ExpenseSheet.tsx:17`
- **"Afterpay"** — `apps/rn/src/components/entities/DebtSheet.tsx:54` · `apps/rn/src/components/entities/DebtSheet.tsx:54` · `packages/core/scan/parseStatementText.ts:28`
- **"PayPal"** — `apps/rn/src/components/entities/DebtSheet.tsx:55` · `packages/core/debt/testBnplSchedule.ts:55` · `packages/core/scan/parseStatementText.ts:28`
- **"Sezzle"** — `apps/rn/src/components/entities/DebtSheet.tsx:57` · `apps/rn/src/components/entities/DebtSheet.tsx:57` · `packages/core/scan/parseStatementText.ts:28`
- **"Enter an amount greater than 0."** — `apps/rn/src/components/entities/ExpenseSheet.tsx:64` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:28` · `apps/rn/src/components/plan/WindfallSheet.tsx:61`
- **"Done"** — `apps/rn/src/components/more/BackupSheets.tsx:37` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:279` · `packages/core/debt/testBnplSchedule.ts:62`
- **"Tomorrow"** — `apps/rn/src/components/more/LiveActivityQA.tsx:35` · `apps/rn/src/liveActivity/paydayActivityContent.test.ts:84` · `apps/rn/src/liveActivity/paydayActivityContent.ts:54`
- **"A little tight this paycheck"** — `apps/rn/src/components/more/LiveActivityQA.tsx:35` · `packages/core/guardian/buildGuardianBrief.ts:263` · `packages/core/guardian/buildGuardianBrief.ts:278`
- **"e.g. 1200"** — `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:175` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:132` · `apps/rn/src/components/plan/PaycheckSheet.tsx:130`
- **"Paid"** — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:269` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:406` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:219`
- **"Close"** — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:327` · `apps/rn/src/components/ui/AnimatedSheet.tsx:82` · `apps/rn/src/components/ui/FormSheet.tsx:157`
- **"Savings goal"** — `apps/rn/src/components/plan/AffordabilityCard.tsx:55` · `apps/rn/src/components/plan/SaveForItSheet.tsx:92` · `apps/rn/src/components/plan/SaveForItSheet.tsx:99`
- **"Purchase"** — `apps/rn/src/components/plan/AffordabilityCard.tsx:72` · `apps/rn/src/components/plan/AffordabilityCard.tsx:86` · `apps/rn/src/store/guardianSelectors.ts:384`
- **"error-outline"** — `apps/rn/src/components/plan/AffordabilityCard.tsx:107` · `apps/rn/src/components/plan/PlanHero.tsx:169` · `apps/rn/src/theme/icons.ts:70`
- **"Example money"** — `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:14` · `apps/rn/src/components/plan/TutorialOverlay.tsx:320` · `apps/rn/src/store/tutorialPath.test.ts:77`
- **"Cushion"** — `apps/rn/src/components/plan/FloorImpactBar.tsx:76` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:277` · `apps/rn/src/components/progress/CashFlowSection.tsx:65`
- **"#fb7185"** — `apps/rn/src/components/progress/CashFlowSection.tsx:28` · `apps/rn/src/components/progress/CashFlowSection.tsx:28` · `apps/rn/src/theme/colors.ts:53`
- **"#dc2626"** — `apps/rn/src/components/progress/CashFlowSection.tsx:29` · `apps/rn/src/components/progress/CashFlowSection.tsx:29` · `apps/rn/src/theme/colors.ts:53`
- **"Delete"** — `apps/rn/src/components/ui/ListRow.tsx:144` · `apps/rn/src/components/ui/ListRow.tsx:154` · `apps/rn/src/utils/confirm.ts:18`
- **"Chase"** — `apps/rn/src/store/celebrationSelectors.test.ts:32` · `packages/core/scan/parseStatementText.ts:27` · `packages/core/scan/testParseStatementText.ts:23`
- **"Good morning"** — `apps/rn/src/store/greeting.test.ts:45` · `apps/rn/src/store/greeting.test.ts:49` · `apps/rn/src/store/greeting.ts:38`
- **"Electric"** — `apps/rn/src/store/looksLikeDebt.test.ts:37` · `packages/core/constants/requiredExpensePresets.ts:16` · `packages/core/guardian/testGuardianPartition.ts:42`
- **"cycleHistory"** — `apps/rn/src/store/planSelectors.test.ts:73` · `apps/rn/src/store/planSelectors.test.ts:90` · `apps/rn/src/store/sandboxStore.test.ts:268`
- **"persona-clear"** — `apps/rn/src/store/sandboxHarness.test.ts:48` · `apps/rn/src/store/sandboxHarness.test.ts:59` · `apps/rn/src/store/sandboxScenarios.test.ts:192`
- **"persona-at-risk"** — `apps/rn/src/store/sandboxHarness.test.ts:54` · `apps/rn/src/store/sandboxHarness.test.ts:55` · `apps/rn/src/store/sandboxScenarios.test.ts:191`
- **"Small Debt"** — `packages/core/debt/testDebtProjection.ts:86` · `packages/core/debt/testDebtProjection.ts:114` · `packages/core/debt/testProjectionAccuracy.ts:142`
- **"June 2026"** — `packages/core/debt/testDebtProjection.ts:280` · `packages/core/debt/testDebtProjection.ts:322` · `packages/core/debt/testProjectionAccuracy.ts:210`
- **"already-notified"** — `packages/core/guardian/notificationDecision.ts:40` · `packages/core/guardian/notificationDecision.ts:73` · `packages/core/guardian/testNotificationDecision.ts:39`
- **"freq-capped"** — `packages/core/guardian/notificationDecision.ts:40` · `packages/core/guardian/notificationDecision.ts:78` · `packages/core/guardian/testNotificationDecision.ts:52`
- **"risk-onset"** — `packages/core/guardian/notificationDecision.ts:40` · `packages/core/guardian/notificationDecision.ts:81` · `packages/core/guardian/testNotificationDecision.ts:33`
- **"Capital One"** — `packages/core/scan/parseStatementText.ts:26` · `packages/core/scan/testParseStatementText.ts:31` · `packages/core/scan/testParseStatementText.ts:38`
- **"start_real_plan"** — `apps/rn/src/analytics/funnel.ts:30` · `apps/rn/src/store/demoExit.ts:28`
- **"demo_stage"** — `apps/rn/src/analytics/funnel.ts:38` · `apps/rn/src/store/demoSession.ts:114`
- **"tutorial_completed"** — `apps/rn/src/analytics/funnel.ts:42` · `apps/rn/src/store/tutorialSession.ts:261`
- **"tutorial_skipped"** — `apps/rn/src/analytics/funnel.ts:43` · `apps/rn/src/store/tutorialSession.ts:262`
- **"tab-today"** — `apps/rn/src/app/(tabs)/_layout.tsx:82` · `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx:35`
- **"tab-progress"** — `apps/rn/src/app/(tabs)/_layout.tsx:87` · `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx:36`
- **"Money"** — `apps/rn/src/app/(tabs)/_layout.tsx:92` · `apps/rn/src/app/(tabs)/money.tsx:110`
- **"tab-money"** — `apps/rn/src/app/(tabs)/_layout.tsx:92` · `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx:37`
- **"/wk"** — `apps/rn/src/app/(tabs)/money.tsx:65` · `apps/rn/src/store/guardianSelectors.ts:196`
- **"/qtr"** — `apps/rn/src/app/(tabs)/money.tsx:68` · `apps/rn/src/store/guardianSelectors.ts:199`
- **"/yr"** — `apps/rn/src/app/(tabs)/money.tsx:69` · `apps/rn/src/store/guardianSelectors.ts:200`
- **"Snowball"** — `apps/rn/src/app/(tabs)/money.tsx:346` · `apps/rn/src/store/storeActions.test.ts:99`
- **"Housing"** — `apps/rn/src/app/(tabs)/money.tsx:497` · `apps/rn/src/components/entities/ExpenseSheet.tsx:24`
- **"Discretionary"** — `apps/rn/src/app/(tabs)/money.tsx:501` · `apps/rn/src/components/entities/ExpenseSheet.tsx:30`
- **"Medical"** — `apps/rn/src/app/(tabs)/money.tsx:502` · `apps/rn/src/components/entities/ExpenseSheet.tsx:31`
- **"One-time"** — `apps/rn/src/app/(tabs)/money.tsx:631` · `apps/rn/src/components/entities/DebtSheet.tsx:46`
- **"receipt-long"** — `apps/rn/src/app/(tabs)/money.tsx:655` · `apps/rn/src/components/progress/TimelineLedger.tsx:17`
- **"reserved per paycheck"** — `apps/rn/src/app/(tabs)/money.tsx:675` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:57`
- **"/living-expenses"** — `apps/rn/src/app/(tabs)/money.tsx:832` · `apps/rn/src/app/more.tsx:276`
- **"Savings"** — `apps/rn/src/app/(tabs)/money.tsx:892` · `apps/rn/src/components/entities/GoalSheet.tsx:70`
- **"Living Expenses"** — `apps/rn/src/app/living-expenses.tsx:34` · `apps/rn/src/app/more.tsx:276`
- **"More"** — `apps/rn/src/app/more.tsx:89` · `apps/rn/src/components/more-button.tsx:45`
- **"Unlock Premium"** — `apps/rn/src/app/more.tsx:129` · `apps/rn/src/components/plan/DemoDock.tsx:79`
- **"lightbulb-outline"** — `apps/rn/src/app/more.tsx:164` · `apps/rn/src/theme/icons.ts:61`
- **"Export backup"** — `apps/rn/src/app/more.tsx:177` · `apps/rn/src/components/more/BackupSheets.tsx:35`
- **"Import backup"** — `apps/rn/src/app/more.tsx:178` · `apps/rn/src/components/more/BackupSheets.tsx:77`
- **"Your name"** — `apps/rn/src/app/more.tsx:200` · `apps/rn/src/components/onboarding/CompletionStep.tsx:66`
- **"About"** — `apps/rn/src/app/more.tsx:280` · `apps/rn/src/components/plan/AffordabilityCard.tsx:202`
- **"Privacy Policy"** — `apps/rn/src/app/more.tsx:282` · `apps/rn/src/app/paywall.tsx:331`
- **"Private by design"** — `apps/rn/src/app/more.tsx:337` · `apps/rn/src/components/onboarding/CompletionStep.tsx:17`
- **"Cancel"** — `apps/rn/src/app/more.tsx:355` · `apps/rn/src/utils/confirm.ts:17`
- **"auto-graph"** — `apps/rn/src/app/paywall.tsx:24` · `apps/rn/src/theme/icons.ts:55`
- **"See it in action"** — `apps/rn/src/app/paywall.tsx:315` · `apps/rn/src/components/onboarding/WelcomeStep.tsx:39`
- **"LiveActivity"** — `apps/rn/src/appIntents/pendingActionBridge.native.ts:19` · `apps/rn/src/liveActivity/liveActivityBridge.native.ts:25`
- **"An ongoing cost that doesn't end."** — `apps/rn/src/components/entities/AddObligationSheet.tsx:41` · `apps/rn/src/components/entities/ExpenseSheet.tsx:99`
- **"Every paycheck"** — `apps/rn/src/components/entities/DebtSheet.tsx:34` · `apps/rn/src/components/entities/ExpenseSheet.tsx:18`
- **"Quarterly"** — `apps/rn/src/components/entities/DebtSheet.tsx:35` · `apps/rn/src/components/entities/ExpenseSheet.tsx:20`
- **"Yearly"** — `apps/rn/src/components/entities/DebtSheet.tsx:36` · `apps/rn/src/components/entities/ExpenseSheet.tsx:21`
- **"Enter the current balance."** — `apps/rn/src/components/entities/DebtSheet.tsx:184` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:41`
- **"Enter the minimum payment."** — `apps/rn/src/components/entities/DebtSheet.tsx:185` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:45`
- **"Log a payment"** — `apps/rn/src/components/entities/DebtSheet.tsx:275` · `apps/rn/src/components/entities/LogPaymentSheet.tsx:34`
- **"Type"** — `apps/rn/src/components/entities/DebtSheet.tsx:297` · `apps/rn/src/components/entities/GoalSheet.tsx:68`
- **"e.g. 100"** — `apps/rn/src/components/entities/DebtSheet.tsx:307` · `apps/rn/src/components/plan/SaveForItSheet.tsx:149`
- **"Current balance"** — `apps/rn/src/components/entities/DebtSheet.tsx:319` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:138`
- **"e.g. 2400"** — `apps/rn/src/components/entities/DebtSheet.tsx:319` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:144`
- **"Minimum payment"** — `apps/rn/src/components/entities/DebtSheet.tsx:344` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:151`
- **"e.g. 22.99"** — `apps/rn/src/components/entities/DebtSheet.tsx:345` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:162`
- **"Recurrence"** — `apps/rn/src/components/entities/DebtSheet.tsx:347` · `apps/rn/src/components/entities/ExpenseSheet.tsx:108`
- **"Log payment"** — `apps/rn/src/components/entities/LogPaymentSheet.tsx:46` · `apps/rn/src/components/ui/ListRow.tsx:151`
- **"in 2 days"** — `apps/rn/src/components/more/LiveActivityQA.tsx:22` · `apps/rn/src/liveActivity/paydayActivityContent.test.ts:72`
- **"Very tight this paycheck"** — `apps/rn/src/components/more/LiveActivityQA.tsx:39` · `packages/core/guardian/buildGuardianBrief.ts:278`
- **"phone-iphone"** — `apps/rn/src/components/onboarding/CompletionStep.tsx:19` · `apps/rn/src/theme/icons.ts:62`
- **"Bi-Weekly"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:20` · `apps/rn/src/components/plan/PaycheckSheet.tsx:20`
- **"Semi-Monthly"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:21` · `apps/rn/src/components/plan/PaycheckSheet.tsx:21`
- **"e.g. 1st & 15th"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:21` · `apps/rn/src/components/plan/PaycheckSheet.tsx:21`
- **"Enter the amount you can count on."** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:72` · `apps/rn/src/components/plan/PaycheckSheet.tsx:80`
- **"Your lean paycheck should be no more than a typical one."** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:73` · `apps/rn/src/components/plan/PaycheckSheet.tsx:81`
- **"Continue"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:95` · `apps/rn/src/components/plan/PaidOffFinale.tsx:128`
- **"Paycheck amount"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:108` · `apps/rn/src/components/plan/PaycheckSheet.tsx:107`
- **"e.g. 1500"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:114` · `apps/rn/src/components/plan/PaycheckSheet.tsx:110`
- **"My income varies"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:122` · `apps/rn/src/components/plan/PaycheckSheet.tsx:120`
- **"The amount you can count on"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:129` · `apps/rn/src/components/plan/PaycheckSheet.tsx:127`
- **"Your plan runs on this floor, so a lighter paycheck never breaks it."** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:137` · `apps/rn/src/components/plan/PaycheckSheet.tsx:135`
- **"Pay cycle"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:143` · `apps/rn/src/components/plan/PaycheckSheet.tsx:142`
- **"First payday"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:150` · `apps/rn/src/components/plan/PaycheckSheet.tsx:149`
- **"Second payday"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:153` · `apps/rn/src/components/plan/PaycheckSheet.tsx:152`
- **"Payday (day of month)"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:159` · `apps/rn/src/components/plan/PaycheckSheet.tsx:158`
- **"Next paycheck"** — `apps/rn/src/components/onboarding/PaycheckStep.tsx:163` · `apps/rn/src/components/plan/PaycheckSheet.tsx:162`
- **"Required"** — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:265` · `apps/rn/src/components/plan/PlanHero.tsx:79`
- **"rgba(91,157,255,0)"** — `apps/rn/src/components/payoff/TrajectoryChart.tsx:265` · `apps/rn/src/components/plan/CashRunwayChart.tsx:89`
- **"rgba(47,102,234,0)"** — `apps/rn/src/components/payoff/TrajectoryChart.tsx:265` · `apps/rn/src/components/plan/CashRunwayChart.tsx:89`
- **"expand-less"** — `apps/rn/src/components/payoff/TrajectoryChart.tsx:474` · `apps/rn/src/components/progress/TimelineLedger.tsx:86`
- **"Start my real plan"** — `apps/rn/src/components/plan/DemoDock.tsx:73` · `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:73`
- **"Keep going"** — `apps/rn/src/components/plan/MilestoneAckCard.tsx:45` · `apps/rn/src/components/plan/VanquishedBeat.tsx:138`
- **"rgba(255,255,255,0.12)"** — `apps/rn/src/components/plan/PaidOffFinale.tsx:35` · `apps/rn/src/theme/colors.ts:70`
- **"Share your win"** — `apps/rn/src/components/plan/PaidOffFinale.tsx:127` · `apps/rn/src/components/plan/VanquishedBeat.tsx:89`
- **"gpp-maybe"** — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:103` · `apps/rn/src/theme/icons.ts:66`
- **"gpp-bad"** — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:104` · `apps/rn/src/theme/icons.ts:65`
- **"Safety net"** — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:272` · `packages/core/engine/allocatePaycheck.ts:483`
- **"your emergency fund"** — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:358` · `packages/core/guardian/buildGuardianBrief.ts:348`
- **"Everyday"** — `apps/rn/src/components/plan/PlanHero.tsx:80` · `apps/rn/src/store/guardianSelectors.test.ts:44`
- **"line-through"** — `apps/rn/src/components/plan/RecommendedActionsCard.tsx:105` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:273`
- **"Overdue"** — `apps/rn/src/components/plan/RequiredActionsCard.tsx:278` · `apps/rn/src/store/planSelectors.ts:247`
- **"Vanquished"** — `apps/rn/src/components/plan/ShareCard.tsx:50` · `apps/rn/src/components/plan/VanquishedBeat.tsx:116`
- **"Paid off"** — `apps/rn/src/components/plan/ShareCard.tsx:51` · `apps/rn/src/components/plan/VanquishedBeat.tsx:126`
- **"Back"** — `apps/rn/src/components/plan/TutorialOverlay.tsx:345` · `apps/rn/src/components/screen.tsx:67`
- **"Share"** — `apps/rn/src/components/plan/VanquishedBeat.tsx:137` · `apps/rn/src/components/progress/VanquishedArchive.tsx:73`
- **"cushionStatus"** — `apps/rn/src/components/progress/CashFlowSection.tsx:19` · `apps/rn/src/store/planSelectors.ts:323`
- **"#fbbf24"** — `apps/rn/src/components/progress/CashFlowSection.tsx:33` · `apps/rn/src/theme/colors.ts:52`
- **"#b45309"** — `apps/rn/src/components/progress/CashFlowSection.tsx:34` · `apps/rn/src/theme/colors.ts:52`
- **"#a6b9d4"** — `apps/rn/src/components/progress/CashFlowSection.tsx:37` · `apps/rn/src/theme/colors.ts:38`
- **"#5a6b82"** — `apps/rn/src/components/progress/CashFlowSection.tsx:38` · `apps/rn/src/theme/colors.ts:38`
- **"sheet-close"** — `apps/rn/src/components/ui/AnimatedSheet.tsx:79` · `apps/rn/src/components/ui/FormSheet.tsx:154`
- **"Chase Freedom Unlimited"** — `apps/rn/src/lib/scan.web.ts:10` · `packages/core/scan/testParseStatementText.ts:15`
- **"Account ending 4821"** — `apps/rn/src/lib/scan.web.ts:11` · `packages/core/scan/testParseStatementText.ts:16`
- **"New Balance $2,431.09"** — `apps/rn/src/lib/scan.web.ts:12` · `packages/core/scan/testParseStatementText.ts:17`
- **"Minimum Payment Due $56.00"** — `apps/rn/src/lib/scan.web.ts:13` · `packages/core/scan/testParseStatementText.ts:18`
- **"Purchase APR 24.99%"** — `apps/rn/src/lib/scan.web.ts:15` · `packages/core/scan/testParseStatementText.ts:20`
- **"group.com.jasonsnyder.debtplanner"** — `apps/rn/src/liveActivity/liveActivityKeys.ts:11` · `apps/rn/src/widget/widgetKeys.ts:16`
- **"payday-actions"** — `apps/rn/src/notifications/notifications.ts:27` · `apps/rn/src/notifications/notifications.web.ts:33`
- **"risk-actions"** — `apps/rn/src/notifications/notifications.ts:28` · `apps/rn/src/notifications/notifications.web.ts:34`
- **"bills-actions"** — `apps/rn/src/notifications/notifications.ts:29` · `apps/rn/src/notifications/notifications.web.ts:35`
- **"free gets no safeMove (the card shows the invitation)"** — `apps/rn/src/store/guardianSelectors.test.ts:86` · `packages/core/guardian/testBuildGuardianBrief.ts:43`
- **"NaN"** — `apps/rn/src/store/guardianSelectors.test.ts:89` · `packages/core/debt/testParseDebtFormValues.ts:31`
- **"your savings"** — `apps/rn/src/store/guardianSelectors.ts:135` · `packages/core/guardian/buildGuardianBrief.ts:315`
- **"Car loan"** — `apps/rn/src/store/looksLikeDebt.test.ts:31` · `apps/rn/src/store/sandboxScenarios.ts:138`
- **"migration-failed"** — `apps/rn/src/store/persistenceLifecycle.test.ts:84` · `apps/rn/src/store/store.ts:223`
- **"to your goals"** — `apps/rn/src/store/planSelectors.ts:310` · `packages/core/guardian/buildGuardianBrief.ts:323`
- **"closeable → no residual"** — `apps/rn/src/store/recoverySelectors.test.ts:59` · `packages/core/recovery/testBuildRecoveryPlan.ts:25`
- **"Streaming"** — `apps/rn/src/store/recoverySelectors.test.ts:88` · `packages/core/obligations/testEffectiveObligationAmount.ts:16`
- **"…nor accumulate lean confirmations"** — `apps/rn/src/store/sandboxBeats.test.ts:93` · `apps/rn/src/store/sandboxStore.test.ts:217`
- **"Old"** — `apps/rn/src/store/storeActions.test.ts:367` · `packages/core/debt/testApplyPaydayCapture.ts:78`
- **"Debt-free!"** — `apps/rn/src/widget/snapshot.ts:76` · `apps/rn/src/widget/widgetSync.test.ts:60`
- **"Childcare"** — `packages/core/constants/livingExpensePresets.ts:30` · `packages/core/constants/requiredExpensePresets.ts:71`
- **"Test"** — `packages/core/debt/testBnplInstallment.ts:26` · `packages/core/debt/testBnplSchedule.ts:13`
- **"Large Debt"** — `packages/core/debt/testDebtProjection.ts:97` · `packages/core/debt/testProjectionAccuracy.ts:149`
- **"Low APR"** — `packages/core/debt/testDebtProjection.ts:122` · `packages/core/debt/testProjectionAccuracy.ts:184`
- **"July 2026"** — `packages/core/debt/testDebtProjection.ts:249` · `packages/core/debt/testProjectionAccuracy.ts:128`
- **"Add to Vacation"** — `packages/core/debt/testPaydayCapture.ts:20` · `packages/core/debt/testSelectActiveRecommendedActions.ts:99`
- **"This paycheck won't cover everything"** — `packages/core/guardian/buildGuardianBrief.ts:244` · `packages/core/guardian/testBuildGuardianBrief.ts:64`
- **"Discover"** — `packages/core/scan/parseStatementText.ts:27` · `packages/core/scan/testParseStatementText.ts:62`

## Every string, by file


### `apps/rn/src/analytics/funnel.test.ts`

| line | origin | string |
|---|---|---|
| 21 | call:console.log ⚠️ | ▶ funnel seam |
| 29 | key:name ⚠️ | demo_started |
| 30 | call:assert ⚠️ | with no sink installed, nothing is emitted |
| 33 | key:name ⚠️ | demo_started |
| 34 | expr ⚠️ | demo_started |
| 34 | call:assert ⚠️ | an installed sink receives events |
| 38 | key:name ⚠️ | demo_completed |
| 39 | key:name ⚠️ | tutorial_started |
| 40 | call:assert ⚠️ | an opted-out user emits nothing, whatever the call site does |
| 43 | key:name ⚠️ | demo_exited |
| 43 | key:reason ⚠️ | unlock_premium |
| 44 | call:assert ⚠️ | turning it back on resumes |

### `apps/rn/src/analytics/funnel.ts`

| line | origin | string |
|---|---|---|
| 30 | other ⚠️ | start_real_plan |
| 30 | other ⚠️ | unlock_premium |
| 37 | other ⚠️ | demo_started |
| 38 | other ⚠️ | demo_stage |
| 39 | other ⚠️ | demo_completed |
| 40 | other ⚠️ | demo_exited |
| 41 | other ⚠️ | tutorial_started |
| 42 | other ⚠️ | tutorial_completed |
| 43 | other ⚠️ | tutorial_skipped |
| 44 | other ⚠️ | paywall_viewed |

### `apps/rn/src/app/_layout.tsx`

| line | origin | string |
|---|---|---|
| 167 | other ⚠️ | (tabs) |
| 170 | other ⚠️ | living-expenses |
| 171 | other ⚠️ | cushion-forecast |
| 173 | other ⚠️ | schedule/[id] |
| 191 | other ⚠️ | +not-found |

### `apps/rn/src/app/(tabs)/_layout.tsx`

| line | origin | string |
|---|---|---|
| 82 | prop:options ⚠️ | Today |
| 82 | prop:options ⚠️ | tab-today |
| 87 | prop:options ⚠️ | Progress |
| 87 | prop:options ⚠️ | tab-progress |
| 92 | prop:options ⚠️ | Money |
| 92 | prop:options ⚠️ | tab-money |

### `apps/rn/src/app/(tabs)/index.tsx`

| line | origin | string |
|---|---|---|
| 75 | expr ⚠️ | autopay_expense |
| 206 | other ⚠️ | reserve-release |
| 206 | other ⚠️ | reserve-walkback |
| 206 | other ⚠️ | risk-cleared |
| 214 | expr ⚠️ | reserve-release |
| 216 | expr ⚠️ | reserve-walkback |
| 218 | expr ⚠️ | risk-cleared |
| 233 | expr ⚠️ | no-paycheck |
| 236 | other ⚠️ | account-balance-wallet |
| 238 | prop:title | Set up your paycheck |
| 239 | prop:body | Add your paycheck to see exactly what to pay each cycle. |
| 240 | prop:cta | Set up your paycheck |
| 244 | expr ⚠️ | no-debts |
| 247 | other ⚠️ | add-circle-outline |
| 249 | prop:title | Add your first debt |
| 250 | prop:body | Your debt-free date is waiting. Add a debt to see your plan. |
| 251 | prop:cta | Add a debt |
| 261 | expr ⚠️ | debt-free |
| 303 | other ⚠️ | guardian-card |
| 309 | prop:onSeeForecast ⚠️ | /cushion-forecast |
| 464 | expr ⚠️ | risk-cleared |
| 467 | other ⚠️ | check-circle |
| 468 | jsx-text | Good news — this paycheck looks clear after all. |
| 470 | prop:label | Got it |
| 477 | expr ⚠️ | reserve-release |
| 478 | other ⚠️ | today-ack |
| 481 | other ⚠️ | gpp-good |
| 484 | call:covered).toLocaleString ⚠️ | en-US |
| 488 | prop:label | Got it |
| 496 | expr ⚠️ | reserve-walkback |
| 497 | other ⚠️ | today-ack |
| 500 | other ⚠️ | gpp-good |
| 502 | jsx-text | A surprise bill came up — I&apos;ve restored your safety net for now. |
| 505 | prop:label | Got it |
| 513 | expr ⚠️ | log-payment |
| 515 | expr ⚠️ | log-payment |
| 516 | expr ⚠️ | Payment logged — I updated your balance. |
| 517 | expr ⚠️ | Payday landed — I rolled your plan forward to this paycheck. |
| 521 | prop:label | Undo |
| 522 | prop:label | Keep |
| 530 | other ⚠️ | gpp-good |
| 532 | jsx-text | Your |
| 532 | jsx-text | trial has ended — it&apos;s now $ |
| 532 | call:fullAmount.toLocaleString ⚠️ | en-US |
| 533 | jsx-text | . Keeping it? |
| 540 | prop:label | Keep it |
| 543 | prop:label | I cancelled it |
| 544 | prop:label | Not now |
| 568 | jsx-text | Payday logged. Start your next pay cycle to apply this cycle&apos;s payments and get your next plan. |
| 570 | prop:label | Start Next Pay Cycle |
| 577 | jsx-text | Private · on your device |
| 793 | expr ⚠️ | A surprise bill came up — your Guardian has restored your safety net for now. |

### `apps/rn/src/app/(tabs)/money.tsx`

| line | origin | string |
|---|---|---|
| 64 | key:'monthly' ⚠️ | /mo |
| 65 | key:'weekly' ⚠️ | /wk |
| 66 | key:'biweekly' ⚠️ | /2 wks |
| 67 | key:'per-paycheck' ⚠️ | per-paycheck |
| 67 | key:'per-paycheck' ⚠️ | /check |
| 68 | key:'quarterly' ⚠️ | /qtr |
| 69 | key:'annually' ⚠️ | /yr |
| 70 | key:'one-time' ⚠️ | one-time |
| 81 | key:debts ⚠️ | Balances you’re paying down. These have an end date, and they set your debt-free date. |
| 82 | key:bills ⚠️ | Ongoing costs that don’t end. Reserved from every paycheck before anything goes to debt. |
| 83 | key:goals ⚠️ | Money you’re setting aside — saved for, not owed. |
| 110 | prop:title | Money |
| 115 | prop:options ⚠️ | Debts |
| 116 | prop:options ⚠️ | Expenses |
| 117 | prop:options ⚠️ | Goals |
| 171 | jsx-text | Is this a debt you&apos;re paying down? Debts count toward your debt-free date — expenses don&apos;t. |
| 175 | jsx-text | Move to Debts |
| 185 | jsx-text | Not a debt |
| 259 | call:useCoachMark ⚠️ | debt-row-actions |
| 311 | other ⚠️ | credit-card |
| 312 | prop:title | Start your debt-free plan |
| 313 | prop:body | Add a loan, credit card, or BNPL balance to see your debt-free date. |
| 314 | prop:cta | Add |
| 316 | prop:ctaTestID ⚠️ | money-add |
| 318 | prop:label | Scan a statement |
| 318 | other ⚠️ | document-scanner |
| 333 | key:title ⚠️ | PAID OFF |
| 346 | prop:options ⚠️ | Snowball |
| 347 | prop:options ⚠️ | Avalanche |
| 352 | expr ⚠️ | Smallest balance first — quick wins. Your debts are listed in payoff order. |
| 353 | expr ⚠️ | Highest APR first — least interest. Your debts are listed in payoff order. |
| 377 | other ⚠️ | debt-row-actions |
| 381 | prop:label | Add |
| 381 | other ⚠️ | money-add |
| 383 | prop:label | Scan a statement |
| 383 | other ⚠️ | document-scanner |
| 408 | other ⚠️ | credit-card |
| 409 | jsx-text | Select a debt to edit, or add one. |
| 451 | expr ⚠️ | estimated · tap to verify |
| 467 | prop:label | Focus |
| 468 | prop:label | BNPL |
| 468 | prop:label | Autopay |
| 478 | prop:amountSuffix ⚠️ | /mo |
| 478 | prop:amountSuffix ⚠️ | /mo |
| 497 | key:housing ⚠️ | Housing |
| 498 | key:utilities ⚠️ | Utilities |
| 499 | key:insurance ⚠️ | Insurance |
| 500 | key:subscriptions ⚠️ | Subscriptions |
| 501 | key:discretionary ⚠️ | Discretionary |
| 502 | key:medical ⚠️ | Medical |
| 503 | key:other ⚠️ | Other |
| 509 | array ⚠️ | subscriptions |
| 510 | array ⚠️ | discretionary |
| 544 | expr ⚠️ | one-time |
| 545 | expr ⚠️ | one-time |
| 602 | expr ⚠️ | one-time |
| 603 | expr ⚠️ | one-time |
| 628 | call:collapsed.has ⚠️ | one-time |
| 630 | key:key ⚠️ | one-time |
| 631 | key:title ⚠️ | One-time |
| 655 | other ⚠️ | receipt-long |
| 656 | prop:title | Build your paycheck plan |
| 657 | prop:body | Add an ongoing cost — rent, utilities, a subscription — so your plan knows what’s due. |
| 658 | prop:cta | Add |
| 660 | prop:ctaTestID ⚠️ | money-add |
| 675 | key:sub ⚠️ | reserved per paycheck |
| 720 | prop:meta ⚠️ | · Variable |
| 722 | prop:label | Autopay |
| 733 | jsx-text | No bills match “ |
| 738 | prop:label | Add |
| 738 | other ⚠️ | money-add |
| 772 | prop:placeholder | Search expenses |
| 779 | prop:accessibilityLabel | Clear search |
| 815 | expr ⚠️ | expand-more |
| 815 | expr ⚠️ | chevron-right |
| 832 | prop:onPress ⚠️ | /living-expenses |
| 838 | jsx-text | Everyday spending reserve |
| 841 | other ⚠️ | chevron-right |
| 844 | jsx-text | Reserved each paycheck · tap to manage |
| 861 | prop:title | Start a savings goal |
| 862 | prop:body | Add an emergency fund or savings goal to start tracking progress. |
| 863 | prop:cta | Add |
| 865 | prop:ctaTestID ⚠️ | money-add |
| 892 | prop:meta ⚠️ | Emergency fund |
| 892 | prop:meta ⚠️ | Savings |
| 893 | prop:amount ⚠️ | Funded |
| 895 | prop:label | Funded |
| 903 | prop:label | Add |
| 903 | other ⚠️ | money-add |
| 930 | other ⚠️ | chevron-right |
| 964 | key:justifyContent ⚠️ | space-between |
| 965 | array ⚠️ | tabular-nums |
| 976 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/app/(tabs)/progress.tsx`

| line | origin | string |
|---|---|---|
| 39 | key:track ⚠️ | rgba(255,255,255,0.14) |
| 44 | key:dim ⚠️ | rgba(255,255,255,0.28) |
| 73 | call:useCoachMark ⚠️ | trajectory-scrub |
| 95 | prop:title | Progress |
| 101 | jsx-text | DEBT-FREE |
| 102 | jsx-text | Every balance cleared |
| 103 | jsx-text | Your trophy shelf is below. |
| 110 | prop:title | Progress |
| 112 | other ⚠️ | trending-down |
| 113 | prop:title | Your payoff journey starts here |
| 114 | prop:body | Add a debt to see your payoff order, timeline, and interest saved. |
| 115 | prop:cta | Add a debt |
| 150 | expr ⚠️ | no milestones reached yet |
| 151 | expr ⚠️ | debt-free |
| 151 | expr ⚠️ | all milestones reached |
| 158 | prop:title | Progress |
| 176 | jsx-text | DEBT-FREE |
| 202 | other ⚠️ | trajectory-scrub |

### `apps/rn/src/app/+not-found.tsx`

| line | origin | string |
|---|---|---|
| 12 | prop:options ⚠️ | Not found |
| 14 | jsx-text | This screen doesn&apos;t exist. |
| 16 | jsx-text | Go to Plan |

### `apps/rn/src/app/cushion-forecast.tsx`

| line | origin | string |
|---|---|---|
| 32 | call:announce ⚠️ | Cushion forecast |
| 36 | prop:title | Your cushion forecast |

### `apps/rn/src/app/demo.tsx`

| line | origin | string |
|---|---|---|
| 71 | key:name ⚠️ | demo_started |

### `apps/rn/src/app/history.tsx`

| line | origin | string |
|---|---|---|
| 39 | prop:title | Pay Cycle History |
| 44 | jsx-text | paid down across |
| 49 | jsx-text | See how far you&apos;ve come, one cycle at a time. |
| 66 | jsx-text | No finished cycles yet. When you start your next pay cycle, that completed cycle shows up here. |
| 88 | expr ⚠️ | trending-down |
| 88 | expr ⚠️ | trending-up |
| 106 | key:justifyContent ⚠️ | space-between |
| 107 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/app/living-expenses.tsx`

| line | origin | string |
|---|---|---|
| 34 | prop:title | Living Expenses |
| 36 | jsx-text | Everyday spending reserved each paycheck, before debt and goals. |
| 41 | other ⚠️ | shopping-cart |
| 42 | prop:title | No spending items yet |
| 43 | prop:body | Add groceries, gas, or fun money to reserve for everyday spending each paycheck. |
| 44 | prop:cta | Add your first item |
| 50 | jsx-text | Reserve per paycheck |
| 60 | prop:meta ⚠️ | Counts toward reserve |
| 60 | prop:meta ⚠️ | Not counted |
| 62 | prop:label | Off |
| 68 | prop:label | Add spending item |
| 78 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/app/more.tsx`

| line | origin | string |
|---|---|---|
| 89 | prop:title | More |
| 103 | other ⚠️ | workspace-premium |
| 104 | prop:label | Premium |
| 105 | prop:subtitle | Active — thanks for the support. |
| 112 | other ⚠️ | workspace-premium |
| 113 | prop:label | Premium — Lifetime |
| 114 | prop:subtitle | Active — a one-time purchase, yours forever. Thanks for the support. |
| 119 | other ⚠️ | workspace-premium |
| 120 | prop:label | Premium |
| 121 | prop:subtitle | Active — thanks for the support. Tap to manage your subscription. |
| 128 | other ⚠️ | workspace-premium |
| 129 | prop:label | Unlock Premium |
| 130 | prop:subtitle | The Payday Guardian, Can I Afford It & more. |
| 131 | prop:onPress ⚠️ | /paywall |
| 142 | prop:label | Pay cycle history |
| 143 | prop:subtitle | Look back at your finished pay cycles. |
| 144 | prop:onPress ⚠️ | /history |
| 150 | other ⚠️ | gpp-good |
| 151 | prop:label | How the Guardian works |
| 152 | prop:subtitle | Replay the short walkthrough. |
| 164 | other ⚠️ | lightbulb-outline |
| 165 | prop:label | Show feature tips again |
| 166 | prop:subtitle | Tips will appear again as you go. |
| 166 | prop:subtitle | Re-offer the one-line hints on hidden features. |
| 175 | prop:title | Data |
| 177 | prop:label | Export backup |
| 177 | prop:subtitle | Save a copy of your data. |
| 177 | other ⚠️ | ios-share |
| 178 | prop:label | Import backup |
| 178 | prop:subtitle | Restore from a saved backup. |
| 178 | other ⚠️ | file-download |
| 180 | other ⚠️ | cloud-off |
| 181 | prop:label | iCloud backup |
| 182 | prop:subtitle | Automatic cloud backup — coming soon. |
| 183 | jsx-text | Soon |
| 188 | prop:label | Delete all data |
| 188 | other ⚠️ | delete-outline |
| 193 | prop:title | Preferences |
| 199 | other ⚠️ | field-preferences-display-name |
| 200 | prop:label | Your name |
| 204 | prop:placeholder | Used to greet you on Today |
| 210 | jsx-text | Appearance |
| 215 | prop:options ⚠️ | Auto |
| 216 | prop:options ⚠️ | Light |
| 217 | prop:options ⚠️ | Dark |
| 224 | other ⚠️ | notifications-none |
| 225 | prop:label | Notifications |
| 226 | prop:subtitle | Paycheck-eve reminder and bill alerts. |
| 227 | prop:accessibilityLabel | Notifications |
| 230 | other ⚠️ | lock-outline |
| 231 | prop:label | App Lock |
| 232 | prop:subtitle | Require Face ID / passcode to open. |
| 233 | prop:accessibilityLabel | App Lock |
| 242 | prop:label | Share anonymous usage |
| 243 | prop:subtitle | Which screens get used — never your balances, debts, or amounts. |
| 246 | prop:accessibilityLabel | Share anonymous usage |
| 255 | prop:label | I have savings elsewhere |
| 256 | prop:subtitle | Skip building a starter emergency fund — put more toward debt first. |
| 257 | prop:accessibilityLabel | I have savings elsewhere |
| 264 | prop:label | Payday countdown |
| 265 | prop:subtitle | Show a Live Activity in the ~3 days before payday. |
| 266 | prop:accessibilityLabel | Payday countdown |
| 272 | prop:label | Debt-free sound |
| 273 | prop:subtitle | Play a chime when you clear your last debt. |
| 274 | prop:accessibilityLabel | Debt-free sound |
| 276 | prop:label | Living Expenses |
| 276 | prop:subtitle | Everyday spending reserved each paycheck. |
| 276 | prop:onPress ⚠️ | /living-expenses |
| 276 | other ⚠️ | shopping-cart |
| 280 | prop:title | About |
| 282 | prop:label | Privacy Policy |
| 282 | other ⚠️ | privacy-tip |
| 283 | prop:label | Terms of Use |
| 284 | prop:label | Support |
| 284 | other ⚠️ | help-outline |
| 289 | prop:label | Manage Subscription |
| 289 | other ⚠️ | card-membership |
| 291 | prop:label | Version |
| 291 | other ⚠️ | info-outline |
| 299 | prop:title | Developer / QA |
| 303 | prop:label | Simulate Premium |
| 304 | prop:subtitle | Unlock premium features for testing (dev / TestFlight QA). |
| 307 | prop:accessibilityLabel | Simulate Premium |
| 334 | other ⚠️ | verified-user |
| 337 | jsx-text | Private by design |
| 339 | jsx-text | Your financial data stays on this device — no account needed. And we&apos;ll never sell you more debt. |
| 351 | jsx-text | All debts, bills, goals, and settings will be permanently erased. This cannot be undone. |
| 355 | prop:label | Cancel |
| 358 | prop:label | Delete Everything |

### `apps/rn/src/app/onboarding.tsx`

| line | origin | string |
|---|---|---|
| 33 | prop:onDemo ⚠️ | /demo?from=welcome |

### `apps/rn/src/app/paywall.tsx`

| line | origin | string |
|---|---|---|
| 21 | key:text ⚠️ | The Payday Guardian — holds your cushion at your line every payday and reshapes the plan, so you don’t decide it each cycle. |
| 22 | key:icon ⚠️ | shopping-cart |
| 22 | key:text ⚠️ | Can I Afford It? — apply any purchase to your plan in one tap, or build a plan to save for it. |
| 23 | key:text ⚠️ | Recovery Plan — a guided catch-up when a cycle comes up short. |
| 24 | key:icon ⚠️ | auto-graph |
| 24 | key:text ⚠️ | Always-current balances — projected forward or re-scanned in seconds, no monthly retyping. |
| 30 | expr ⚠️ | Payment will be charged to your Apple Account at confirmation of purchase. Subscriptions |
| 31 | expr ⚠️ | automatically renew unless canceled at least 24 hours before the end of the current period. Your |
| 32 | expr ⚠️ | account is charged for renewal within 24 hours prior to the end of the current period. Manage or |
| 33 | expr ⚠️ | cancel anytime in your App Store account settings. Lifetime is a one-time purchase (not a |
| 34 | expr ⚠️ | subscription) that covers all current Premium features; any future add-on tiers, like bank |
| 35 | expr ⚠️ | connection or an AI coach, are sold separately. |
| 51 | var:LIFETIME_SUBNOTE ⚠️ | Pay once — all today’s Premium, forever |
| 58 | key:title ⚠️ | Annual |
| 58 | key:periodLabel ⚠️ | per year |
| 58 | key:subnote ⚠️ | Billed yearly · just $2.50/mo |
| 58 | key:badge ⚠️ | Best value |
| 59 | key:title ⚠️ | Lifetime |
| 59 | key:periodLabel ⚠️ | one time |
| 59 | key:badge ⚠️ | Pay once |
| 60 | key:title ⚠️ | Monthly |
| 60 | key:periodLabel ⚠️ | per month |
| 60 | key:subnote ⚠️ | Billed monthly |
| 67 | other ⚠️ | ANNUAL |
| 72 | key:title ⚠️ | Annual |
| 72 | key:periodLabel ⚠️ | per year |
| 72 | key:badge ⚠️ | Best value |
| 74 | other ⚠️ | LIFETIME |
| 75 | key:title ⚠️ | Lifetime |
| 75 | key:periodLabel ⚠️ | one time |
| 75 | key:badge ⚠️ | Pay once |
| 76 | other ⚠️ | MONTHLY |
| 77 | key:title ⚠️ | Monthly |
| 77 | key:periodLabel ⚠️ | per month |
| 77 | key:subnote ⚠️ | Billed monthly |
| 151 | alert | Not available here |
| 151 | alert | In-app purchases aren’t available in this preview — try it on your device. |
| 160 | alert | You’re Premium 🎉 |
| 160 | alert | Your premium tools are unlocked. |
| 165 | alert | Almost there |
| 165 | alert | Your purchase went through, but Premium couldn’t be confirmed yet. Tap Restore, or contact support if it persists. |
| 168 | alert | Purchase didn’t complete |
| 168 | alert | Something went wrong. Please try again. |
| 176 | alert | Not available here |
| 176 | alert | Restoring purchases isn’t available in this preview. |
| 184 | alert | Purchases restored |
| 184 | alert | Your premium access is back. |
| 187 | alert | Nothing to restore |
| 187 | alert | No active purchase was found for this Apple Account. |
| 190 | alert | Restore didn’t complete |
| 190 | alert | Something went wrong. Please try again. |
| 197 | expr ⚠️ | Starting… |
| 208 | prop:title | Premium |
| 208 | prop:onBack ⚠️ | /onboarding |
| 210 | other ⚠️ | workspace-premium |
| 211 | jsx-text | Debt payoff on autopilot |
| 213 | jsx-text | The app does the manual parts — you just confirm. |
| 230 | jsx-text | Private by design — your financial data never leaves your device, and you’ll never be sold more debt. |
| 238 | other ⚠️ | check-circle |
| 241 | expr ⚠️ | You’re on Premium — Lifetime. Thanks for the support. |
| 241 | expr ⚠️ | You’re on Premium — thanks for the support. |
| 247 | prop:label | Manage subscription |
| 256 | jsx-text | Plans couldn’t load right now. Check your connection and try again. |
| 258 | prop:label | Retry |
| 311 | prop:onPress ⚠️ | /demo?from=paywall |
| 315 | jsx-text | See it in action |
| 320 | expr ⚠️ | Restoring… |
| 320 | expr ⚠️ | Restore purchases |
| 327 | jsx-text | Terms of Use (EULA) |
| 331 | jsx-text | Privacy Policy |
| 344 | key:alignItems ⚠️ | flex-start |
| 354 | key:alignItems ⚠️ | flex-end |

### `apps/rn/src/app/schedule/[id].tsx`

| line | origin | string |
|---|---|---|
| 25 | call:announce ⚠️ | Payoff schedule |
| 31 | prop:title | Payoff schedule |
| 31 | prop:onBack ⚠️ | /money |

### `apps/rn/src/appIntents/pendingActionBridge.native.ts`

| line | origin | string |
|---|---|---|
| 19 | call:requireNativeModule ⚠️ | LiveActivity |

### `apps/rn/src/appIntents/pendingActions.test.ts`

| line | origin | string |
|---|---|---|
| 28 | call:calls.push ⚠️ | applyPaydayLandedIntent |
| 35 | call:eq ⚠️ | parse: null → [] |
| 36 | call:parsePendingActions ⚠️ | not json |
| 36 | call:eq ⚠️ | parse: bad JSON string → [] |
| 37 | call:eq ⚠️ | parse: non-array JSON → [] |
| 38 | call:eq ⚠️ | parse: unknown kind → dropped |
| 39 | key:kind ⚠️ | payday-landed |
| 39 | call:eq ⚠️ | parse: missing id → dropped |
| 40 | key:kind ⚠️ | payday-landed |
| 40 | call:eq ⚠️ | parse: mixed junk → keeps the valid one |
| 41 | key:kind ⚠️ | payday-landed |
| 41 | key:kind ⚠️ | payday-landed |
| 41 | call:eq ⚠️ | parse: dedupe by id |
| 44 | key:kind ⚠️ | payday-landed |
| 45 | call:eq ⚠️ | parse: JSON-string array → 1 |
| 46 | call:eq ⚠️ | payday-landed |
| 46 | call:eq ⚠️ | parse: kind preserved |
| 52 | key:kind ⚠️ | payday-landed |
| 53 | call:eq ⚠️ | apply: payday-landed dispatches applyPaydayLandedIntent once |
| 54 | call:eq ⚠️ | applyPaydayLandedIntent |
| 54 | call:eq ⚠️ | apply: correct action (the Undo-aware roll) |
| 55 | call:eq ⚠️ | apply: returns the applied action |
| 63 | key:kind ⚠️ | payday-landed |
| 67 | call:eq ⚠️ | drain: applied 1 |
| 68 | call:eq ⚠️ | drain: dispatched the store action |
| 69 | call:assert ⚠️ | drain: cleared the queue after applying |
| 76 | call:eq ⚠️ | drain: empty → nothing applied |
| 77 | call:eq ⚠️ | drain: empty → no dispatch |
| 78 | call:assert ⚠️ | drain: empty → no clear |
| 84 | call:eq ⚠️ | drain: a throwing bridge is caught → [] |
| 88 | key:kind ⚠️ | log-payment |
| 88 | call:eq ⚠️ | parse: valid log-payment kept |
| 89 | key:kind ⚠️ | log-payment |
| 89 | call:eq ⚠️ | parse: log-payment missing amount → dropped |
| 90 | key:kind ⚠️ | log-payment |
| 90 | call:eq ⚠️ | parse: log-payment missing debtId → dropped |
| 91 | key:kind ⚠️ | log-payment |
| 91 | call:eq ⚠️ | parse: log-payment non-positive amount → dropped |
| 92 | key:kind ⚠️ | log-payment |
| 92 | call:eq ⚠️ | parse: log-payment non-number amount → dropped |
| 94 | key:kind ⚠️ | log-payment |
| 96 | expr ⚠️ | log-payment |
| 96 | call:assert ⚠️ | parse: log-payment fields preserved |
| 100 | key:kind ⚠️ | log-payment |
| 101 | call:eq ⚠️ | logManualPayment:visa:150 |
| 101 | call:eq ⚠️ | apply: log-payment dispatches logManualPayment(debtId, amount) |
| 109 | key:kind ⚠️ | payday-landed |
| 110 | key:kind ⚠️ | log-payment |
| 116 | call:eq ⚠️ | apply: mixed queue applies both |
| 117 | call:eq ⚠️ | logManualPayment:car:90 |
| 117 | call:eq ⚠️ | apply: order preserved |

### `apps/rn/src/appIntents/pendingActions.ts`

| line | origin | string |
|---|---|---|
| 14 | other ⚠️ | payday-landed |
| 15 | other ⚠️ | log-payment |
| 18 | array ⚠️ | payday-landed |
| 18 | array ⚠️ | log-payment |
| 52 | expr ⚠️ | log-payment |
| 58 | key:kind ⚠️ | log-payment |
| 61 | key:kind ⚠️ | payday-landed |
| 70 | other ⚠️ | payday-landed |
| 73 | other ⚠️ | log-payment |

### `apps/rn/src/components/AppLockGate.tsx`

| line | origin | string |
|---|---|---|
| 33 | jsx-text | Debt Planner is locked |
| 35 | jsx-text | Unlock with Face ID, Touch ID, or your passcode. |
| 37 | prop:label | Unlocking… |
| 37 | prop:label | Unlock |

### `apps/rn/src/components/entities/AddObligationSheet.tsx`

| line | origin | string |
|---|---|---|
| 33 | key:title ⚠️ | A debt |
| 34 | key:clause ⚠️ | Something with a balance you're paying down. It ends. |
| 35 | key:examples ⚠️ | Credit card · Car loan · Mortgage · Buy-now-pay-later |
| 36 | key:testID ⚠️ | add-choice-debt |
| 40 | key:title ⚠️ | An expense |
| 41 | key:clause ⚠️ | An ongoing cost that doesn't end. |
| 42 | key:examples ⚠️ | Rent · Phone · Electric · Subscriptions |
| 43 | key:testID ⚠️ | add-choice-expense |
| 47 | key:title ⚠️ | A savings goal |
| 50 | key:clause ⚠️ | Money you're setting aside for something. |
| 51 | key:examples ⚠️ | Emergency fund · A trip · A new laptop |
| 52 | key:testID ⚠️ | add-choice-goal |
| 65 | prop:title | What are you adding? |
| 69 | prop:subtitle | We'll put it in the right place. |

### `apps/rn/src/components/entities/AmortizationView.tsx`

| line | origin | string |
|---|---|---|
| 15 | call:d.toLocaleString ⚠️ | en-US |
| 42 | jsx-text | No schedule to show. |
| 54 | jsx-text | At |
| 54 | jsx-text | /mo the interest outpaces the balance, so this debt never gets           paid off. Increasing the payment fixes it. |
| 62 | jsx-text | debt-free · |
| 67 | jsx-text | Paying |
| 67 | jsx-text | /mo |
| 67 | expr ⚠️ | — minimum + your extra |
| 67 | expr ⚠️ | — the minimum |
| 71 | jsx-text | MONTH |
| 72 | jsx-text | BALANCE |
| 81 | jsx-text | interest · |
| 102 | jsx-text | Payoff schedule |
| 116 | key:justifyContent ⚠️ | space-between |
| 123 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/entities/DebtSheet.tsx`

| line | origin | string |
|---|---|---|
| 31 | key:label ⚠️ | Monthly |
| 32 | key:label ⚠️ | Weekly |
| 33 | key:label ⚠️ | Every 2 weeks |
| 34 | key:value ⚠️ | per-paycheck |
| 34 | key:label ⚠️ | Every paycheck |
| 35 | key:label ⚠️ | Quarterly |
| 36 | key:label ⚠️ | Yearly |
| 43 | key:label ⚠️ | Every 2 weeks |
| 44 | key:label ⚠️ | Monthly |
| 45 | key:label ⚠️ | Every 3 months |
| 46 | key:value ⚠️ | one-time |
| 46 | key:label ⚠️ | One-time |
| 51 | key:label ⚠️ | Not specified |
| 52 | key:value ⚠️ | Klarna |
| 52 | key:label ⚠️ | Klarna |
| 53 | key:value ⚠️ | Affirm |
| 53 | key:label ⚠️ | Affirm |
| 54 | key:value ⚠️ | Afterpay |
| 54 | key:label ⚠️ | Afterpay |
| 55 | key:value ⚠️ | PayPal |
| 55 | key:label ⚠️ | PayPal Pay in 4 |
| 56 | key:value ⚠️ | Zip |
| 56 | key:label ⚠️ | Zip |
| 57 | key:value ⚠️ | Sezzle |
| 57 | key:label ⚠️ | Sezzle |
| 58 | key:value ⚠️ | Other |
| 58 | key:label ⚠️ | Other |
| 128 | call:useCoachMark ⚠️ | payoff-schedule |
| 157 | call:setError ⚠️ | Enter a name. |
| 162 | call:setError ⚠️ | Enter the payment amount. |
| 163 | call:setError ⚠️ | Enter how many payments are left. |
| 184 | call:setError ⚠️ | Enter the current balance. |
| 185 | call:setError ⚠️ | Enter the minimum payment. |
| 186 | call:setError ⚠️ | Minimum payment can’t exceed the balance. |
| 238 | prop:title | Edit debt |
| 238 | prop:title | Add a debt |
| 238 | prop:title | Add from scan |
| 238 | prop:title | Add a debt |
| 243 | prop:subtitle | Moving this from Expenses. Add the balance so it counts toward your debt-free date. |
| 245 | prop:subtitle | Review the scanned details, then add. |
| 246 | prop:subtitle | A loan, credit card, or BNPL balance. |
| 248 | prop:submitLabel | Save |
| 248 | prop:submitLabel | Add debt |
| 271 | other ⚠️ | debt-log-payment |
| 275 | jsx-text | Log a payment |
| 276 | other ⚠️ | chevron-right |
| 281 | other ⚠️ | payoff-schedule |
| 283 | other ⚠️ | debt-view-schedule |
| 287 | jsx-text | View payoff schedule |
| 288 | other ⚠️ | chevron-right |
| 295 | prop:label | Name |
| 295 | prop:placeholder | Affirm — Sofa |
| 295 | prop:placeholder | Visa, Car Loan |
| 295 | other ⚠️ | field-debt-name |
| 297 | prop:label | Type |
| 299 | prop:options ⚠️ | Debt / loan |
| 299 | prop:options ⚠️ | BNPL (buy now, pay later) |
| 306 | prop:label | Provider |
| 307 | prop:label | Payment amount |
| 307 | prop:placeholder | e.g. 100 |
| 307 | other ⚠️ | decimal-pad |
| 308 | prop:label | Payments remaining |
| 308 | prop:placeholder | e.g. 4 |
| 308 | other ⚠️ | number-pad |
| 309 | prop:label | How often |
| 310 | prop:label | Next payment |
| 313 | jsx-text | left · interest-free |
| 319 | prop:label | Current balance |
| 319 | prop:placeholder | e.g. 2400 |
| 319 | other ⚠️ | field-debt-balance |
| 319 | other ⚠️ | decimal-pad |
| 322 | prop:accessibilityLabel | Re-scan a statement to update this balance |
| 322 | key:alignSelf ⚠️ | flex-start |
| 323 | jsx-text | Re-scan to update → |
| 334 | key:alignSelf ⚠️ | flex-start |
| 336 | jsx-text | Estimated |
| 339 | jsx-text | Apply Estimate to Plan |
| 342 | jsx-text | Updated |
| 344 | prop:label | Minimum payment |
| 344 | prop:placeholder | e.g. 65 |
| 344 | other ⚠️ | field-debt-minimum |
| 344 | other ⚠️ | decimal-pad |
| 345 | prop:label | APR % |
| 345 | prop:placeholder | e.g. 22.99 |
| 345 | other ⚠️ | field-debt-apr |
| 345 | other ⚠️ | decimal-pad |
| 346 | prop:label | Due date |
| 347 | prop:label | Recurrence |
| 350 | prop:label | Autopay |
| 361 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/entities/ExpenseSheet.tsx`

| line | origin | string |
|---|---|---|
| 15 | key:label ⚠️ | Monthly |
| 16 | key:label ⚠️ | Weekly |
| 17 | key:label ⚠️ | Every 2 weeks |
| 18 | key:value ⚠️ | per-paycheck |
| 18 | key:label ⚠️ | Every paycheck |
| 19 | key:value ⚠️ | one-time |
| 19 | key:label ⚠️ | One time |
| 20 | key:label ⚠️ | Quarterly |
| 21 | key:label ⚠️ | Yearly |
| 24 | key:label ⚠️ | Housing |
| 25 | key:label ⚠️ | Utilities |
| 26 | key:label ⚠️ | Insurance |
| 27 | key:value ⚠️ | subscriptions |
| 27 | key:label ⚠️ | Subscriptions |
| 30 | key:value ⚠️ | discretionary |
| 30 | key:label ⚠️ | Discretionary |
| 31 | key:label ⚠️ | Medical |
| 32 | key:label ⚠️ | Other |
| 56 | call:setError ⚠️ | Enter a name. |
| 59 | call:setError ⚠️ | Enter the amount you pay now (0 for a free trial). |
| 60 | call:setError ⚠️ | Enter the full price after the trial. |
| 62 | call:setError ⚠️ | Enter when the full price starts (YYYY-MM-DD). |
| 64 | call:setError ⚠️ | Enter an amount greater than 0. |
| 98 | prop:title | Edit expense |
| 98 | prop:title | Add an expense |
| 99 | prop:subtitle | An ongoing cost that doesn't end. |
| 100 | prop:submitLabel | Save |
| 100 | prop:submitLabel | Add expense |
| 105 | prop:label | Name |
| 105 | prop:placeholder | Rent, phone, utilities |
| 105 | other ⚠️ | field-expense-name |
| 106 | prop:label | Amount now (0 for a free trial) |
| 106 | prop:label | Amount |
| 106 | prop:placeholder | e.g. 0 |
| 106 | prop:placeholder | e.g. 850 |
| 106 | other ⚠️ | field-expense-amount |
| 106 | other ⚠️ | decimal-pad |
| 107 | prop:label | Due date (YYYY-MM-DD) |
| 108 | prop:label | Recurrence |
| 109 | prop:label | Category |
| 110 | prop:label | Variable amount (estimate) |
| 111 | prop:label | Free trial or intro price |
| 114 | prop:label | Full price after the trial |
| 114 | prop:placeholder | e.g. 15.99 |
| 114 | other ⚠️ | decimal-pad |
| 115 | prop:label | Full price starts (YYYY-MM-DD) |
| 118 | prop:label | Autopay |

### `apps/rn/src/components/entities/GoalSheet.tsx`

| line | origin | string |
|---|---|---|
| 28 | call:setError ⚠️ | Enter a name. |
| 29 | call:setError ⚠️ | Enter a target amount. |
| 57 | prop:title | Edit goal |
| 57 | prop:title | Add a goal |
| 58 | prop:subtitle | A savings or emergency-fund target. |
| 59 | prop:submitLabel | Save |
| 59 | prop:submitLabel | Add goal |
| 64 | prop:label | Name |
| 64 | prop:placeholder | Emergency Fund, Vacation |
| 65 | prop:label | Target amount |
| 65 | prop:placeholder | e.g. 1000 |
| 65 | other ⚠️ | decimal-pad |
| 66 | prop:label | Current amount saved |
| 66 | prop:placeholder | e.g. 250 |
| 66 | other ⚠️ | decimal-pad |
| 68 | prop:label | Type |
| 70 | prop:options ⚠️ | Emergency fund |
| 70 | prop:options ⚠️ | Savings |

### `apps/rn/src/components/entities/LivingExpenseSheet.tsx`

| line | origin | string |
|---|---|---|
| 27 | call:setError ⚠️ | Enter a name. |
| 28 | call:setError ⚠️ | Enter an amount greater than 0. |
| 46 | prop:title | Edit spending item |
| 46 | prop:title | Add a spending item |
| 47 | prop:subtitle | Everyday spending you reserve each paycheck (groceries, gas, fun). |
| 48 | prop:submitLabel | Save |
| 48 | prop:submitLabel | Add item |
| 53 | prop:label | Name |
| 53 | prop:placeholder | Groceries, gas, fun |
| 55 | prop:label | Amount per paycheck |
| 58 | prop:placeholder | e.g. 300 |
| 59 | other ⚠️ | decimal-pad |
| 62 | prop:label | Count toward my reserve |

### `apps/rn/src/components/entities/LogPaymentSheet.tsx`

| line | origin | string |
|---|---|---|
| 34 | prop:title | Log a payment |
| 39 | prop:label | Amount paid |
| 43 | other ⚠️ | decimal-pad |
| 44 | prop:error ⚠️ | More than the balance — this will clear it to $0. |
| 46 | prop:label | Log payment |

### `apps/rn/src/components/money/AllocationBarCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 11 | prop:getComponent ⚠️ | ./AllocationBarChart |

### `apps/rn/src/components/money/BillBreakdownSheet.tsx`

| line | origin | string |
|---|---|---|
| 35 | key:'one-time' ⚠️ | one-time |
| 35 | key:'one-time' ⚠️ | one-time |
| 38 | key:biweekly ⚠️ | every 2 weeks |
| 39 | key:'per-paycheck' ⚠️ | per-paycheck |
| 39 | key:'per-paycheck' ⚠️ | every paycheck |
| 53 | prop:title | Where it goes |
| 57 | jsx-text | reserved per paycheck |
| 61 | jsx-text | Every bill spread evenly across your paychecks — so the lumpy ones never land as a surprise. |
| 70 | jsx-text | /paycheck |
| 73 | expr ⚠️ | per-paycheck |
| 84 | jsx-text | /paycheck |
| 95 | jsx-text | Plus |
| 95 | jsx-text | one-time |
| 95 | jsx-text | — not part of your ongoing reserve. |
| 106 | array ⚠️ | tabular-nums |
| 113 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/money/BnplCalendarSection.tsx`

| line | origin | string |
|---|---|---|
| 68 | jsx-text | UPCOMING BNPL INSTALLMENTS |
| 93 | expr ⚠️ | installments |
| 104 | key:justifyContent ⚠️ | space-between |
| 107 | array ⚠️ | tabular-nums |
| 109 | array ⚠️ | tabular-nums |

### `apps/rn/src/components/more-button.tsx`

| line | origin | string |
|---|---|---|
| 36 | prop:onPress ⚠️ | /more |
| 45 | prop:accessibilityLabel | More |

### `apps/rn/src/components/more/BackupSheets.tsx`

| line | origin | string |
|---|---|---|
| 35 | prop:title | Export backup |
| 36 | prop:subtitle | Copy this and save it somewhere safe. Paste it into Import to restore. |
| 37 | prop:submitLabel | Done |
| 40 | prop:label | Copied ✓ |
| 40 | prop:label | Copy to clipboard |
| 59 | call:setError ⚠️ | Paste your backup first. |
| 64 | call:setError ⚠️ | That doesn't look like a valid backup. |
| 70 | call:setError ⚠️ | That backup couldn't be read. |
| 77 | prop:title | Import backup |
| 78 | prop:subtitle | Paste a backup you exported before. This replaces your current data. |
| 79 | prop:submitLabel | Restore backup |
| 85 | prop:placeholder | Paste your backup JSON here |

### `apps/rn/src/components/more/LiveActivityQA.tsx`

| line | origin | string |
|---|---|---|
| 22 | key:countdownLabel ⚠️ | in 2 days |
| 24 | key:title ⚠️ | Looks clear this paycheck |
| 25 | key:line ⚠️ | Cushion safe · $420 free to deploy |
| 32 | key:label ⚠️ | Clear · 2 days |
| 34 | key:label ⚠️ | Tight · tomorrow |
| 35 | key:countdownLabel ⚠️ | Tomorrow |
| 35 | key:title ⚠️ | A little tight this paycheck |
| 35 | key:line ⚠️ | Move $200 from savings to hold your line |
| 38 | key:label ⚠️ | At-risk · today |
| 39 | key:countdownLabel ⚠️ | Today |
| 39 | key:guardianState ⚠️ | at-risk |
| 39 | key:title ⚠️ | Very tight this paycheck |
| 39 | key:line ⚠️ | $180 short of your obligations |
| 42 | key:label ⚠️ | Payday day (button) |
| 43 | key:countdownLabel ⚠️ | Today |
| 52 | jsx-text | Live Activity QA |
| 55 | expr ⚠️ | Start a state, then check the Lock Screen / Dynamic Island. (iOS only.) |
| 56 | expr ⚠️ | Live Activities are OFF in device Settings, or unsupported here (web / <iOS 16.2). |
| 64 | prop:label | End activity |
| 66 | prop:label | Simulate 'Payday landed' |
| 70 | prop:onPress ⚠️ | Payday landed |
| 70 | prop:onPress ⚠️ | Rolled the cycle — check the Today tab for the Undo card. |
| 70 | alert | Payday landed |
| 70 | alert | Rolled the cycle — check the Today tab for the Undo card. |

### `apps/rn/src/components/more/SettingRow.tsx`

| line | origin | string |
|---|---|---|
| 52 | other ⚠️ | chevron-right |

### `apps/rn/src/components/onboarding/CompletionStep.tsx`

| line | origin | string |
|---|---|---|
| 17 | key:label ⚠️ | Private by design |
| 17 | key:body ⚠️ | your financial data stays on your device. |
| 18 | key:label ⚠️ | Always editable |
| 18 | key:body ⚠️ | update amounts any time. |
| 19 | key:icon ⚠️ | phone-iphone |
| 19 | key:label ⚠️ | Free to use |
| 19 | key:body ⚠️ | core features never require a subscription. |
| 39 | prop:label | See My Plan  → |
| 52 | expr ⚠️ | You're all set |
| 56 | expr ⚠️ | That's your target — stay the course. Tap below to see exactly what to do with your next paycheck. |
| 57 | expr ⚠️ | Your plan is ready. Tap below to see exactly what to do with your next paycheck. |
| 62 | other ⚠️ | field-onboarding-display-name |
| 63 | prop:label | What should we call you? (optional) |
| 66 | prop:placeholder | Your name |

### `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx`

| line | origin | string |
|---|---|---|
| 36 | call:setError ⚠️ | Enter a name. |
| 41 | call:setError ⚠️ | Enter the current balance. |
| 45 | call:setError ⚠️ | Enter the minimum payment. |
| 49 | call:setError ⚠️ | Enter the amount. |
| 89 | prop:label | Add & Continue |
| 90 | prop:label | Skip, I'll add later |
| 94 | jsx-text | Add your first debt or expense |
| 96 | jsx-text | See your plan come to life right away. You can add more any time. |
| 107 | prop:options ⚠️ | Debt |
| 108 | prop:options ⚠️ | Expense |
| 119 | expr ⚠️ | Something with a balance you’re paying down — a card, a loan, a mortgage. It ends. |
| 120 | expr ⚠️ | An ongoing cost that doesn’t end — rent, phone, a subscription. |
| 124 | other ⚠️ | field-onboarding-name |
| 125 | prop:label | Debt name |
| 125 | prop:label | Expense name |
| 131 | prop:placeholder | e.g. Visa Card |
| 131 | prop:placeholder | e.g. Rent |
| 137 | other ⚠️ | field-onboarding-balance |
| 138 | prop:label | Current balance |
| 144 | prop:placeholder | e.g. 2400 |
| 145 | other ⚠️ | decimal-pad |
| 150 | other ⚠️ | field-onboarding-minimum |
| 151 | prop:label | Minimum payment |
| 157 | prop:placeholder | e.g. 35 |
| 158 | other ⚠️ | decimal-pad |
| 162 | prop:label | APR % (optional) |
| 162 | prop:placeholder | e.g. 22.99 |
| 162 | other ⚠️ | field-onboarding-apr |
| 162 | other ⚠️ | decimal-pad |
| 168 | other ⚠️ | field-onboarding-amount |
| 169 | prop:label | Amount |
| 175 | prop:placeholder | e.g. 1200 |
| 176 | other ⚠️ | decimal-pad |

### `apps/rn/src/components/onboarding/OnboardingLayout.tsx`

| line | origin | string |
|---|---|---|
| 54 | key:alignSelf ⚠️ | flex-start |

### `apps/rn/src/components/onboarding/PaycheckStep.tsx`

| line | origin | string |
|---|---|---|
| 19 | key:label ⚠️ | Weekly |
| 20 | key:label ⚠️ | Bi-Weekly |
| 21 | key:label ⚠️ | Semi-Monthly |
| 21 | key:sublabel ⚠️ | e.g. 1st & 15th |
| 22 | key:label ⚠️ | Monthly |
| 65 | call:setError ⚠️ | Enter your paycheck amount to continue. |
| 72 | call:setLeanError ⚠️ | Enter the amount you can count on. |
| 73 | call:setLeanError ⚠️ | Your lean paycheck should be no more than a typical one. |
| 95 | prop:label | Continue |
| 96 | prop:label | Skip for now |
| 100 | jsx-text | When do you get paid? |
| 102 | jsx-text | This sets up your pay cycle so your plan knows which bills are due next. |
| 107 | other ⚠️ | field-paycheck-amount |
| 108 | prop:label | Paycheck amount |
| 114 | prop:placeholder | e.g. 1500 |
| 115 | other ⚠️ | decimal-pad |
| 122 | prop:label | My income varies |
| 129 | prop:label | The amount you can count on |
| 132 | prop:placeholder | e.g. 1200 |
| 133 | other ⚠️ | decimal-pad |
| 137 | jsx-text | Your plan runs on this floor, so a lighter paycheck never breaks it. |
| 143 | jsx-text | Pay cycle |
| 150 | prop:label | First payday |
| 150 | other ⚠️ | number-pad |
| 153 | prop:label | Second payday |
| 153 | other ⚠️ | number-pad |
| 159 | prop:label | Payday (day of month) |
| 159 | other ⚠️ | number-pad |
| 163 | jsx-text | Next paycheck |

### `apps/rn/src/components/onboarding/WelcomeStep.tsx`

| line | origin | string |
|---|---|---|
| 13 | key:title ⚠️ | A guardian for every payday |
| 13 | key:body ⚠️ | Know what's safe to spend and what to pay down — your cushion, protected. |
| 14 | key:icon ⚠️ | trending-down |
| 14 | key:title ⚠️ | A real debt-free date |
| 14 | key:body ⚠️ | Snowball or avalanche — see exactly when your last debt disappears. |
| 15 | key:icon ⚠️ | shopping-cart |
| 15 | key:title ⚠️ | Spend without the guilt |
| 15 | key:body ⚠️ | Check any purchase against your plan before you buy. |
| 26 | prop:label | Get Started |
| 39 | prop:label | See it in action |
| 43 | other ⚠️ | gpp-good |
| 46 | jsx-text | Will you make it to payday? |
| 48 | jsx-text | Debt Planner watches your cushion every paycheck — so you always know what&apos;s safe to spend and what to pay down. |

### `apps/rn/src/components/payday/PaydayCaptureSheet.tsx`

| line | origin | string |
|---|---|---|
| 34 | return ⚠️ | a while ago |
| 39 | expr ⚠️ | autopay_expense |
| 203 | expr ⚠️ | All confirmed paid |
| 232 | jsx-text | ‹ Back |
| 234 | jsx-text | Which bills got paid? |
| 236 | jsx-text | Tap to mark what you actually paid — anything left carries to next cycle. |
| 240 | expr ⚠️ | Undo |
| 240 | expr ⚠️ | Mark all paid |
| 261 | expr ⚠️ | Autopay · ran |
| 262 | expr ⚠️ | Autopay |
| 265 | expr ⚠️ | Required |
| 269 | prop:label | Paid |
| 269 | prop:label | Didn't pay |
| 275 | jsx-text | carries to next cycle |
| 279 | prop:label | Done |
| 286 | jsx-text | ‹ Back |
| 288 | jsx-text | Check your balances |
| 290 | jsx-text | Confirm each estimate, or type the real balance from your statement. |
| 302 | jsx-text | estimated ~ |
| 302 | jsx-text | · verified |
| 306 | other ⚠️ | decimal-pad |
| 315 | prop:label | Confirm balances |
| 321 | jsx-text | It&apos;s payday |
| 323 | jsx-text | Here&apos;s the plan you set for this paycheck. Confirm what you actually paid. |
| 327 | jsx-text | Close |
| 336 | jsx-text | Required bills & minimums |
| 341 | prop:label | Adjust |
| 351 | jsx-text | Estimated balances |
| 354 | expr ⚠️ | 1 balance hasn't been checked in a while |
| 358 | prop:label | Update |
| 360 | prop:label | These look right |
| 364 | other ⚠️ | check-circle |
| 365 | jsx-text | Balances confirmed |
| 370 | jsx-text | EXTRA PAYMENTS |
| 386 | expr ⚠️ | From savings ✓ |
| 386 | expr ⚠️ | From savings |
| 394 | other ⚠️ | decimal-pad |
| 406 | prop:label | Skipped |
| 406 | prop:label | Paid |
| 417 | jsx-text | You paid |
| 424 | prop:label | Confirm what I paid |
| 424 | prop:label | I followed the plan |
| 425 | prop:label | Skip this payday |
| 462 | other ⚠️ | check-circle |
| 465 | jsx-text | Payday captured |
| 471 | jsx-text | confirmed · your plan&apos;s up to date |
| 485 | key:alignItems ⚠️ | flex-start |
| 485 | key:justifyContent ⚠️ | space-between |
| 494 | key:alignItems ⚠️ | flex-end |
| 496 | key:justifyContent ⚠️ | space-between |
| 506 | array ⚠️ | tabular-nums |

### `apps/rn/src/components/payoff/TrajectoryCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 14 | prop:getComponent ⚠️ | ./TrajectorySkiaChart |

### `apps/rn/src/components/payoff/TrajectoryChart.tsx`

| line | origin | string |
|---|---|---|
| 136 | expr ⚠️ | payoff-enabling |
| 228 | call:month).toLocaleString ⚠️ | en-US |
| 229 | expr ⚠️ | Never |
| 258 | expr ⚠️ | #f7cf5f |
| 258 | expr ⚠️ | #dca01f |
| 259 | expr ⚠️ | rgba(255,255,255,0.07) |
| 259 | expr ⚠️ | rgba(16,38,84,0.07) |
| 264 | expr ⚠️ | rgba(91,157,255,0.26) |
| 264 | expr ⚠️ | rgba(47,102,234,0.18) |
| 265 | expr ⚠️ | rgba(91,157,255,0) |
| 265 | expr ⚠️ | rgba(47,102,234,0) |
| 267 | expr ⚠️ | rgba(247,207,95,0.55) |
| 267 | expr ⚠️ | rgba(220,160,31,0.5) |
| 268 | expr ⚠️ | #ffe9a8 |
| 268 | expr ⚠️ | #eeb42e |
| 272 | expr ⚠️ | rgba(91,157,255,0.14) |
| 272 | expr ⚠️ | rgba(47,102,234,0.10) |
| 273 | expr ⚠️ | rgba(91,157,255,0.5) |
| 273 | expr ⚠️ | rgba(47,102,234,0.45) |
| 279 | jsx-text | PAYOFF TRAJECTORY |
| 280 | jsx-text | Balance over time |
| 287 | call:groupLabel ⚠️ | Payoff trajectory chart |
| 288 | expr ⚠️ | projected balance over time |
| 289 | expr ⚠️ | your plan clears faster than minimum payments |
| 344 | other ⚠️ | traj-waypoint |
| 365 | other ⚠️ | traj-endpoint-pill |
| 383 | other ⚠️ | traj-scrub-readout |
| 387 | call:month).toLocaleString ⚠️ | en-US |
| 400 | jsx-text | Now |
| 412 | jsx-text | Minimum payments |
| 423 | jsx-text | Your plan |
| 440 | jsx-text | Safe-floor |
| 452 | jsx-text | With extra |
| 469 | prop:accessibilityLabel | What if you paid extra? |
| 472 | jsx-text | What if you paid extra? |
| 474 | expr ⚠️ | expand-less |
| 474 | expr ⚠️ | expand-more |
| 482 | key:justifyContent ⚠️ | space-between |
| 486 | key:justifyContent ⚠️ | space-between |
| 492 | key:borderTopColor ⚠️ | rgba(127,127,127,0.18) |
| 494 | key:justifyContent ⚠️ | space-between |
| 502 | key:justifyContent ⚠️ | space-between |
| 511 | key:color ⚠️ | #10264f |

### `apps/rn/src/components/payoff/WhatIfControls.tsx`

| line | origin | string |
|---|---|---|
| 76 | prop:accessibilityLabel | Extra monthly payment amount |
| 83 | jsx-text | /mo |
| 92 | prop:accessibilityLabel | Extra monthly payment |
| 98 | jsx-text | Drag or type an amount to see how much faster you&apos;d be debt-free. |
| 102 | jsx-text | Can&apos;t estimate a payoff date with the current plan. |

### `apps/rn/src/components/plan/AffordabilityCard.tsx`

| line | origin | string |
|---|---|---|
| 21 | call:isFinite(n) ? n : 0)).toLocaleString ⚠️ | en-US |
| 55 | expr ⚠️ | Savings goal |
| 72 | expr ⚠️ | Purchase |
| 77 | key:recurrence ⚠️ | one-time |
| 77 | key:category ⚠️ | discretionary |
| 86 | expr ⚠️ | Purchase |
| 87 | key:recurrence ⚠️ | one-time |
| 87 | key:category ⚠️ | discretionary |
| 106 | key:icon ⚠️ | check-circle |
| 107 | key:icon ⚠️ | error-outline |
| 115 | jsx-text | CAN I AFFORD IT? |
| 118 | other ⚠️ | check-circle |
| 128 | prop:label | Undo |
| 139 | jsx-text | CAN I AFFORD IT? |
| 142 | other ⚠️ | check-circle |
| 149 | prop:label | Undo |
| 158 | jsx-text | CAN I AFFORD IT? |
| 160 | other ⚠️ | shopping-cart |
| 161 | jsx-text | Thinking about a purchase? |
| 164 | prop:label | Amount |
| 164 | prop:placeholder | e.g. 400 |
| 164 | other ⚠️ | decimal-pad |
| 165 | prop:label | What is it? (optional) |
| 165 | prop:placeholder | e.g. New couch |
| 169 | jsx-text | Enter an amount to see if it fits this paycheck. |
| 172 | jsx-text | You have about |
| 172 | jsx-text | spare this paycheck. |
| 181 | jsx-text | Not this paycheck — you&apos;d come up about |
| 181 | jsx-text | short. |
| 185 | prop:label | Save for it → |
| 202 | jsx-text | About |
| 202 | jsx-text | less goes to debt this paycheck. |
| 222 | prop:label | Apply anyway |
| 222 | prop:label | Apply to this paycheck |
| 243 | key:alignItems ⚠️ | flex-start |

### `apps/rn/src/components/plan/AffordabilityImpactBar.tsx`

| line | origin | string |
|---|---|---|
| 75 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/plan/CaptureAutoStart.tsx`

| line | origin | string |
|---|---|---|
| 37 | call:router.replace ⚠️ | /demo?capture=1 |

### `apps/rn/src/components/plan/CaptureSlate.tsx`

| line | origin | string |
|---|---|---|
| 160 | key:backgroundColor ⚠️ | #ffffff |

### `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 14 | prop:getComponent ⚠️ | ./CashRunwaySkiaChart |

### `apps/rn/src/components/plan/CashRunwayChart.tsx`

| line | origin | string |
|---|---|---|
| 42 | key:clear ⚠️ | Clear |
| 42 | key:tight ⚠️ | Tight |
| 42 | key:'at-risk' ⚠️ | at-risk |
| 42 | key:'at-risk' ⚠️ | Crunch |
| 88 | expr ⚠️ | rgba(91,157,255,0.24) |
| 88 | expr ⚠️ | rgba(47,102,234,0.16) |
| 89 | expr ⚠️ | rgba(91,157,255,0) |
| 89 | expr ⚠️ | rgba(47,102,234,0) |
| 94 | key:ringCore ⚠️ | #ffffff |
| 102 | expr ⚠️ | at-risk |
| 130 | jsx-text | BREATHING ROOM |
| 177 | jsx-text | your $ |
| 185 | jsx-text | Guardian&apos;s setting aside |
| 185 | jsx-text | from this paycheck for a tight cycle ahead. |
| 193 | expr ⚠️ | This paycheck |
| 198 | prop:label | Income |
| 199 | prop:label | Bills & essentials |
| 202 | prop:label | Left after essentials |
| 217 | array ⚠️ | tabular-nums |
| 223 | key:justifyContent ⚠️ | space-between |
| 232 | key:justifyContent ⚠️ | space-between |
| 234 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/plan/CoachMarkLayer.tsx`

| line | origin | string |
|---|---|---|
| 79 | prop:pointerEvents ⚠️ | box-none |
| 84 | other ⚠️ | coach-mark |
| 95 | prop:accessibilityLabel | Got it |
| 98 | jsx-text | Got it |

### `apps/rn/src/components/plan/CushionBarCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 11 | prop:getComponent ⚠️ | ./CushionBarChart |

### `apps/rn/src/components/plan/CushionFloorSheet.tsx`

| line | origin | string |
|---|---|---|
| 46 | prop:title | Your cushion line |
| 47 | prop:subtitle | The cash the Guardian keeps each paycheck before any extra debt payoff. |
| 48 | prop:submitLabel | Save |
| 58 | other ⚠️ | floor-sheet-coach |
| 65 | other ⚠️ | floor-sheet-value |
| 65 | call:value.toLocaleString ⚠️ | en-US |
| 66 | prop:accessibilityLabel | Cushion line amount |
| 66 | other ⚠️ | cushion-floor-slider |
| 80 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/plan/DemoCaption.tsx`

| line | origin | string |
|---|---|---|
| 48 | other ⚠️ | demo-caption |
| 59 | prop:accessibilityLabel | Debt-free, one paycheck at a time. Cushion planning and Recovery require Premium. |
| 60 | jsx-text | Debt-free, one paycheck at a time. |
| 63 | jsx-text | Cushion planning and Recovery require Premium. |

### `apps/rn/src/components/plan/DemoDock.tsx`

| line | origin | string |
|---|---|---|
| 70 | jsx-text | This is what your Guardian does with a paycheck. |
| 73 | prop:label | Start my real plan |
| 73 | prop:onPress ⚠️ | /onboarding |
| 75 | prop:onPress ⚠️ | /paywall |
| 79 | jsx-text | Unlock Premium |

### `apps/rn/src/components/plan/ExampleCanvasMarker.tsx`

| line | origin | string |
|---|---|---|
| 14 | var:EXAMPLE_MONEY ⚠️ | Example money |
| 58 | key:justifyContent ⚠️ | space-between |
| 61 | other ⚠️ | example-canvas-marker |
| 72 | prop:onPress ⚠️ | /onboarding |
| 72 | other ⚠️ | demo-explore-exit |
| 73 | jsx-text | Start my real plan |

### `apps/rn/src/components/plan/FloorImpactBar.tsx`

| line | origin | string |
|---|---|---|
| 70 | other ⚠️ | floor-impact |
| 76 | jsx-text | Cushion |

### `apps/rn/src/components/plan/GraduationCards.tsx`

| line | origin | string |
|---|---|---|
| 28 | jsx-text | You&apos;re debt-free |
| 30 | jsx-text | Every balance is cleared. Your paycheck now builds your future instead of paying down the past. |
| 46 | jsx-text | YOUR NEXT CHAPTER |
| 48 | other ⚠️ | trending-up |
| 49 | jsx-text | Ready to build wealth? |
| 52 | jsx-text | Financial Freedom picks up where this leaves off — turn the money you were sending to debt into a plan for         your Freedom Date. A convenient next step, not a required one. |
| 55 | prop:label | Explore Financial Freedom → |

### `apps/rn/src/components/plan/GuardianProofStrip.tsx`

| line | origin | string |
|---|---|---|
| 30 | other ⚠️ | verified-user |
| 46 | key:alignItems ⚠️ | flex-start |

### `apps/rn/src/components/plan/GuardianScorecard.tsx`

| line | origin | string |
|---|---|---|
| 33 | jsx-text | GUARDIAN ACCURACY |
| 35 | other ⚠️ | gpp-good |
| 36 | jsx-text | Protected since day one |
| 39 | jsx-text | Your floor&apos;s been protected from the start. I&apos;m still learning your patterns — I&apos;ll show my track           record once I&apos;ve seen a few more paychecks. |
| 49 | expr ⚠️ | false_clear |
| 50 | expr ⚠️ | I've under-warned a few times — I've tightened my read. |
| 52 | expr ⚠️ | I've been over-cautious a few times — I'm recalibrating. |
| 57 | jsx-text | GUARDIAN ACCURACY |
| 59 | jsx-text | reads matched |
| 62 | jsx-text | How often my read of whether you&apos;d hold your cushion matched what you actually confirmed. |
| 69 | prop:label | Under-warned |
| 69 | prop:sub ⚠️ | said you'd hold, you dipped below |
| 70 | prop:label | Over-cautious |
| 70 | prop:sub ⚠️ | flagged a risk that didn't land |

### `apps/rn/src/components/plan/LeanSuggestionCard.tsx`

| line | origin | string |
|---|---|---|
| 13 | call:round(n).toLocaleString ⚠️ | en-US |
| 32 | call:groupLabel ⚠️ | Income floor |
| 32 | expr ⚠️ | Raise your income floor |
| 32 | expr ⚠️ | Adjust your income floor |
| 34 | other ⚠️ | trending-up |
| 35 | jsx-text | INCOME FLOOR |
| 41 | prop:label | Not now |

### `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 10 | prop:getComponent ⚠️ | ./MeshGradientChart |

### `apps/rn/src/components/plan/MeshGradientChart.tsx`

| line | origin | string |
|---|---|---|
| 20 | prop:colors ⚠️ | rgba(247,207,95,0.34) |
| 20 | prop:colors ⚠️ | rgba(247,207,95,0) |
| 24 | prop:colors ⚠️ | rgba(88,132,224,0.28) |
| 24 | prop:colors ⚠️ | rgba(88,132,224,0) |
| 28 | prop:colors ⚠️ | rgba(122,92,200,0.22) |
| 28 | prop:colors ⚠️ | rgba(122,92,200,0) |

### `apps/rn/src/components/plan/MilestoneAckCard.tsx`

| line | origin | string |
|---|---|---|
| 20 | key:title ⚠️ | A quarter paid off |
| 20 | key:body ⚠️ | You've cleared 25% of your debt. Keep the momentum going. |
| 21 | key:title ⚠️ | Halfway to debt-free |
| 21 | key:body ⚠️ | 50% paid off — you're over the hump. |
| 22 | key:title ⚠️ | Three-quarters done |
| 22 | key:body ⚠️ | 75% paid off. The finish line is in sight. |
| 45 | prop:label | Keep going |
| 54 | key:alignSelf ⚠️ | flex-start |

### `apps/rn/src/components/plan/PaidOffFinale.tsx`

| line | origin | string |
|---|---|---|
| 35 | key:track ⚠️ | rgba(255,255,255,0.12) |
| 36 | key:from ⚠️ | #f7cf5f |
| 37 | key:to ⚠️ | #fbe08a |
| 38 | key:passed ⚠️ | #f7cf5f |
| 39 | key:next ⚠️ | #fbe08a |
| 40 | key:dim ⚠️ | rgba(255,255,255,0.2) |
| 41 | key:free ⚠️ | #fbe08a |
| 44 | array ⚠️ | #f7cf5f |
| 44 | array ⚠️ | #fbe08a |
| 44 | array ⚠️ | #ffd873 |
| 44 | array ⚠️ | #fff3cf |
| 80 | key:operation ⚠️ | finale-card |
| 107 | prop:accessibilityLabel | $0 balance |
| 116 | jsx-text | You&rsquo;re debt-free |
| 127 | prop:label | Share your win |
| 128 | prop:label | Continue |
| 212 | array ⚠️ | tabular-nums |
| 216 | array ⚠️ | tabular-nums |

### `apps/rn/src/components/plan/PaycheckSheet.tsx`

| line | origin | string |
|---|---|---|
| 19 | key:label ⚠️ | Weekly |
| 20 | key:label ⚠️ | Bi-Weekly |
| 21 | key:label ⚠️ | Semi-Monthly |
| 21 | key:sublabel ⚠️ | e.g. 1st & 15th |
| 22 | key:label ⚠️ | Monthly |
| 74 | call:setError ⚠️ | Enter your paycheck amount. |
| 80 | call:setLeanError ⚠️ | Enter the amount you can count on. |
| 81 | call:setLeanError ⚠️ | Your lean paycheck should be no more than a typical one. |
| 101 | prop:title | Paycheck & pay cycle |
| 102 | prop:subtitle | Your income and when it lands — the foundation of every plan. |
| 103 | prop:submitLabel | Save paycheck |
| 107 | prop:label | Paycheck amount |
| 110 | prop:placeholder | e.g. 1500 |
| 111 | other ⚠️ | decimal-pad |
| 120 | prop:label | My income varies |
| 127 | prop:label | The amount you can count on |
| 130 | prop:placeholder | e.g. 1200 |
| 131 | other ⚠️ | decimal-pad |
| 135 | jsx-text | Your plan runs on this floor, so a lighter paycheck never breaks it. |
| 142 | jsx-text | Pay cycle |
| 149 | prop:label | First payday |
| 149 | other ⚠️ | number-pad |
| 152 | prop:label | Second payday |
| 152 | other ⚠️ | number-pad |
| 158 | prop:label | Payday (day of month) |
| 158 | other ⚠️ | number-pad |
| 162 | jsx-text | Next paycheck |
| 170 | prop:label | This paycheck didn't arrive |

### `apps/rn/src/components/plan/PaydayGuardianCard.tsx`

| line | origin | string |
|---|---|---|
| 102 | key:icon ⚠️ | gpp-good |
| 103 | key:icon ⚠️ | gpp-maybe |
| 104 | key:'at-risk' ⚠️ | at-risk |
| 104 | key:icon ⚠️ | gpp-bad |
| 132 | call:subjects.has ⚠️ | guardian-adjust |
| 156 | call:subjects.has ⚠️ | guardian-reserve |
| 164 | expr ⚠️ | Bills confirmed — holding a smaller safety net. Undo |
| 165 | expr ⚠️ | All your regular bills entered? I'll hold a smaller safety net. |
| 171 | expr ⚠️ | Premium builds you a catch-up plan — what to cover first, and what (if anything) can safely wait. |
| 172 | expr ⚠️ | Premium keeps your cushion at your line automatically, all on your device — no deciding each paycheck. |
| 181 | expr ⚠️ | Example |
| 182 | call:groupLabel ⚠️ | Payday Guardian |
| 201 | expr ⚠️ | To savings |
| 201 | expr ⚠️ | To debt |
| 209 | jsx-text | PAYDAY GUARDIAN |
| 225 | other ⚠️ | guardian-example-marker |
| 226 | jsx-text | Example |
| 231 | jsx-text | Update needed |
| 244 | other ⚠️ | guardian-bar |
| 272 | prop:label | Safety net |
| 272 | other ⚠️ | guardian-reserve-amount |
| 277 | prop:label | Cushion |
| 278 | prop:label | To savings |
| 278 | prop:label | To debt |
| 289 | jsx-text | · Your line |
| 294 | expr ⚠️ | at-risk |
| 316 | jsx-text | Your call |
| 358 | prop:label | your emergency fund |
| 379 | prop:label | Undo the move |
| 388 | other ⚠️ | guardian-reserve |
| 399 | prop:accessibilityHint | Undoes the confirmation and restores the full safety net |
| 400 | prop:accessibilityHint | Tells your Guardian your bills are all entered, so it holds less back |
| 418 | other ⚠️ | guardian-adjust |
| 428 | prop:accessibilityLabel | Adjust your line |
| 429 | prop:accessibilityHint | Opens a sheet to set the cushion you keep back each payday |
| 431 | jsx-text | Adjust your line → |
| 440 | other ⚠️ | guardian-replay-tutorial |
| 443 | prop:accessibilityLabel | How this works |
| 444 | prop:accessibilityHint | Replays the walkthrough of how your Guardian decides, from the beginning |
| 446 | jsx-text | How this works |
| 467 | prop:accessibilityLabel | See your forecast |
| 468 | prop:accessibilityHint | Opens your full cushion forecast |
| 471 | jsx-text | See your forecast → |
| 493 | call:isFinite(n) ? n : 0)).toLocaleString ⚠️ | en-US |
| 545 | array ⚠️ | tabular-nums |
| 604 | key:alignSelf ⚠️ | flex-end |

### `apps/rn/src/components/plan/PayoffInvitationCard.tsx`

| line | origin | string |
|---|---|---|
| 36 | other ⚠️ | check-circle |
| 37 | jsx-text | Looks like you crushed |
| 40 | jsx-text | Your estimate reached $0. Confirm it&apos;s paid off and we&apos;ll make it official. |
| 42 | prop:label | Confirm — it's paid off |
| 44 | jsx-text | Not yet — update the balance |

### `apps/rn/src/components/plan/PlanHero.tsx`

| line | origin | string |
|---|---|---|
| 21 | key:free ⚠️ | #dbe6f5 |
| 27 | call:max(0, n)).toLocaleString ⚠️ | en-US |
| 79 | key:label ⚠️ | Required |
| 80 | key:label ⚠️ | Everyday |
| 81 | key:label ⚠️ | Flexible |
| 91 | expr ⚠️ | on-track |
| 94 | expr ⚠️ | Overdue payments need attention |
| 96 | expr ⚠️ | Short this paycheck |
| 97 | expr ⚠️ | On track |
| 119 | prop:accessibilityLabel | Edit paycheck |
| 122 | jsx-text | THIS PAYCHECK · |
| 162 | jsx-text | Suggested · |
| 169 | expr ⚠️ | on-track |
| 169 | expr ⚠️ | check-circle |
| 169 | expr ⚠️ | error-outline |
| 177 | prop:accessibilityLabel | Add extra income |
| 179 | other ⚠️ | add-circle-outline |
| 181 | expr ⚠️ | Add extra income |
| 196 | key:alignSelf ⚠️ | flex-start |
| 198 | array ⚠️ | tabular-nums |
| 205 | array ⚠️ | tabular-nums |
| 210 | key:alignSelf ⚠️ | flex-start |

### `apps/rn/src/components/plan/RecommendedActionsCard.tsx`

| line | origin | string |
|---|---|---|
| 25 | expr ⚠️ | Mark Paid |
| 25 | expr ⚠️ | Mark Saved |
| 46 | jsx-text | Recommended |
| 48 | jsx-text | Best next move for this paycheck. |
| 55 | prop:meta ⚠️ | Suggested this paycheck |
| 67 | prop:meta ⚠️ | Completed with outside money |
| 67 | prop:meta ⚠️ | Completed this paycheck |
| 70 | prop:label | Undo |
| 100 | key:backgroundColor ⚠️ | rgba(37,99,235,0.06) |
| 105 | expr ⚠️ | line-through |

### `apps/rn/src/components/plan/RecoveryPlanSection.tsx`

| line | origin | string |
|---|---|---|
| 13 | call:isFinite(n) ? n : 0)).toLocaleString ⚠️ | en-US |
| 63 | jsx-text | COVER NOW |
| 72 | jsx-text | SAFE TO DEFER |
| 84 | expr ⚠️ | check-box |
| 84 | expr ⚠️ | check-box-outline-blank |
| 94 | jsx-text | Keep essential |
| 126 | jsx-text | This reschedules the payment in your plan — remember to handle it with the biller (pay it late, or cancel it). |
| 141 | array ⚠️ | tabular-nums |

### `apps/rn/src/components/plan/RequiredActionsCard.tsx`

| line | origin | string |
|---|---|---|
| 27 | other ⚠️ | unfundedRequiredItems |
| 96 | jsx-text | Required Actions |
| 98 | jsx-text | Bills and minimums due this paycheck. |
| 105 | jsx-text | You&apos;re caught up for this paycheck. |
| 124 | jsx-text | Short this paycheck — cover these from savings or your next paycheck. |
| 170 | expr ⚠️ | expand-more |
| 170 | expr ⚠️ | chevron-right |
| 216 | prop:accessibilityLabel | Undo, mark unpaid |
| 216 | prop:accessibilityLabel | Mark paid |
| 219 | expr ⚠️ | Undo |
| 219 | expr ⚠️ | Paid |
| 256 | prop:label | Auto-paid |
| 258 | prop:label | Autopay |
| 273 | expr ⚠️ | line-through |
| 278 | prop:label | Overdue |
| 279 | jsx-text | Due |
| 285 | jsx-text | this cycle |
| 346 | key:alignItems ⚠️ | flex-start |

### `apps/rn/src/components/plan/SaveForItSheet.tsx`

| line | origin | string |
|---|---|---|
| 16 | call:isFinite(n) ? n : 0)).toLocaleString ⚠️ | en-US |
| 64 | expr ⚠️ | this purchase |
| 92 | expr ⚠️ | Savings goal |
| 99 | expr ⚠️ | Savings goal |
| 106 | prop:title | Save for it |
| 108 | prop:submitLabel | Start saving |
| 121 | expr ⚠️ | radio-button-checked |
| 121 | expr ⚠️ | radio-button-unchecked |
| 123 | jsx-text | /paycheck |
| 128 | expr ⚠️ | Saved after debt · no firm date |
| 144 | expr ⚠️ | radio-button-checked |
| 144 | expr ⚠️ | radio-button-unchecked |
| 145 | jsx-text | Set your own |
| 149 | prop:label | Per paycheck |
| 149 | prop:placeholder | e.g. 100 |
| 149 | other ⚠️ | decimal-pad |
| 152 | jsx-text | · ready by |
| 157 | jsx-text | Save what you want each paycheck — funds before debt at your pace. |
| 168 | array ⚠️ | tabular-nums |

### `apps/rn/src/components/plan/ShareCard.tsx`

| line | origin | string |
|---|---|---|
| 38 | jsx-text | I&rsquo;m debt-free |
| 50 | jsx-text | Vanquished |
| 51 | expr ⚠️ | Paid off |
| 54 | jsx-text | /mo freed toward the next one |
| 66 | jsx-text | on my way to debt-free |
| 71 | other ⚠️ | verified-user |
| 73 | jsx-text | Debt Planner &middot; your payday debt-payoff app |
| 94 | array ⚠️ | tabular-nums |
| 98 | array ⚠️ | tabular-nums |

### `apps/rn/src/components/plan/TutorialInviteCard.tsx`

| line | origin | string |
|---|---|---|
| 27 | call:groupLabel ⚠️ | See how your Guardian works |
| 28 | call:groupLabel ⚠️ | A short walkthrough on example numbers, not your real plan. |
| 33 | other ⚠️ | tutorial-invite |
| 35 | jsx-text | See how your Guardian works |
| 39 | jsx-text | A short walkthrough on example numbers — your plan isn&apos;t touched. |
| 43 | prop:label | Show me |
| 44 | prop:label | Not now |

### `apps/rn/src/components/plan/TutorialOverlay.tsx`

| line | origin | string |
|---|---|---|
| 180 | prop:pointerEvents ⚠️ | box-none |
| 181 | other ⚠️ | tutorial-overlay |
| 245 | other ⚠️ | tutorial-spotlight |
| 256 | prop:pointerEvents ⚠️ | box-none |
| 319 | other ⚠️ | tutorial-progress |
| 320 | expr ⚠️ | Example money |
| 328 | other ⚠️ | tutorial-step-title |
| 344 | prop:label | Finish |
| 344 | prop:label | Next |
| 345 | prop:label | Back |
| 352 | jsx-text | Skip |
| 477 | prop:pointerEvents ⚠️ | box-none |
| 477 | other ⚠️ | tutorial-scrim |
| 481 | other ⚠️ | tutorial-scrim-band |
| 487 | prop:pointerEvents ⚠️ | box-none |
| 488 | other ⚠️ | tutorial-scrim-blocker |
| 489 | other ⚠️ | tutorial-scrim-blocker |
| 490 | other ⚠️ | tutorial-scrim-blocker |
| 491 | other ⚠️ | tutorial-scrim-blocker |
| 544 | key:alignItems ⚠️ | flex-end |

### `apps/rn/src/components/plan/VanquishedBeat.tsx`

| line | origin | string |
|---|---|---|
| 89 | call:shareDebtCard ⚠️ | Share your win |
| 92 | key:operation ⚠️ | vanquished-beat |
| 98 | expr ⚠️ | — paid off |
| 108 | prop:pointerEvents ⚠️ | box-none |
| 116 | jsx-text | Vanquished |
| 126 | jsx-text | Paid off |
| 131 | jsx-text | Freed |
| 131 | jsx-text | /mo now flows to |
| 137 | prop:label | Share |
| 138 | prop:label | Keep going |
| 159 | key:backgroundColor ⚠️ | rgba(3, 8, 20, 0.55) |
| 173 | array ⚠️ | tabular-nums |

### `apps/rn/src/components/plan/WindfallSheet.tsx`

| line | origin | string |
|---|---|---|
| 20 | key:label ⚠️ | Covers your bills & essentials first |
| 20 | key:icon ⚠️ | check-circle |
| 21 | key:label ⚠️ | Extra to your debt |
| 21 | key:icon ⚠️ | trending-down |
| 22 | key:label ⚠️ | To your emergency fund |
| 23 | key:label ⚠️ | Toward your goals |
| 24 | key:label ⚠️ | Held as your safety net |
| 25 | key:label ⚠️ | Left as spare cash |
| 25 | key:icon ⚠️ | account-balance-wallet |
| 61 | call:setError ⚠️ | Enter an amount greater than 0. |
| 77 | prop:title | Extra income |
| 78 | prop:subtitle | A bonus, refund, or side gig — added to this paycheck only. |
| 79 | prop:submitLabel | Confirm |
| 79 | prop:submitLabel | Add |
| 84 | prop:label | Amount |
| 90 | prop:placeholder | e.g. 500 |
| 91 | other ⚠️ | decimal-pad |
| 99 | jsx-text | HERE&apos;S HOW THE APP WILL ROUTE |
| 110 | jsx-text | Confirm to route it this way — your whole plan updates. Your call. |

### `apps/rn/src/components/premium/PremiumInvite.tsx`

| line | origin | string |
|---|---|---|
| 21 | prop:onPress ⚠️ | /paywall |
| 26 | other ⚠️ | workspace-premium |
| 28 | other ⚠️ | chevron-right |

### `apps/rn/src/components/progress/CashFlowSection.tsx`

| line | origin | string |
|---|---|---|
| 19 | other ⚠️ | cushionStatus |
| 28 | array ⚠️ | #fda4af |
| 28 | array ⚠️ | #fb7185 |
| 28 | key:glow ⚠️ | rgba(251,113,133,0.5) |
| 28 | key:label ⚠️ | #fb7185 |
| 29 | array ⚠️ | #f87171 |
| 29 | array ⚠️ | #dc2626 |
| 29 | key:glow ⚠️ | rgba(220,38,38,0.38) |
| 29 | key:label ⚠️ | #dc2626 |
| 33 | array ⚠️ | #fcd34d |
| 33 | array ⚠️ | #f59e0b |
| 33 | key:glow ⚠️ | rgba(251,191,36,0.45) |
| 33 | key:label ⚠️ | #fbbf24 |
| 34 | array ⚠️ | #f59e0b |
| 34 | array ⚠️ | #d97706 |
| 34 | key:glow ⚠️ | rgba(217,119,6,0.34) |
| 34 | key:label ⚠️ | #b45309 |
| 37 | array ⚠️ | #5b6b86 |
| 37 | array ⚠️ | #3f4d68 |
| 37 | key:label ⚠️ | #a6b9d4 |
| 38 | array ⚠️ | #aab6c9 |
| 38 | array ⚠️ | #8b99b0 |
| 38 | key:label ⚠️ | #5a6b82 |
| 59 | jsx-text | CASH FLOW · NEXT |
| 59 | jsx-text | PAY CYCLES |
| 65 | prop:options ⚠️ | Cushion |
| 66 | prop:options ⚠️ | Timeline |
| 88 | expr ⚠️ | A cycle runs short ahead — plan for it. |
| 90 | expr ⚠️ | Cushion gets tight in an upcoming cycle. |
| 91 | expr ⚠️ | Comfortable across the next few paychecks. |
| 111 | jsx-text | line · room after each paycheck |
| 149 | key:alignItems ⚠️ | flex-end |
| 151 | array ⚠️ | tabular-nums |
| 152 | key:justifyContent ⚠️ | flex-end |

### `apps/rn/src/components/progress/JourneyRingCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 11 | prop:getComponent ⚠️ | ./JourneyRingChart |

### `apps/rn/src/components/progress/TimelineLedger.tsx`

| line | origin | string |
|---|---|---|
| 16 | key:living_reserve ⚠️ | shopping-cart |
| 17 | key:expense ⚠️ | receipt-long |
| 19 | key:minimum_debt ⚠️ | credit-card |
| 20 | key:autopay_debt ⚠️ | credit-card |
| 21 | key:emergency ⚠️ | health-and-safety |
| 68 | expr ⚠️ | This cycle |
| 68 | expr ⚠️ | Projected |
| 68 | expr ⚠️ | Cycle |
| 86 | expr ⚠️ | expand-less |
| 86 | expr ⚠️ | expand-more |
| 110 | jsx-text | from savings |
| 128 | array ⚠️ | tabular-nums |
| 133 | key:alignItems ⚠️ | flex-end |
| 134 | array ⚠️ | tabular-nums |

### `apps/rn/src/components/progress/VanquishedArchive.tsx`

| line | origin | string |
|---|---|---|
| 38 | call:shareDebtCard ⚠️ | Share your progress |
| 40 | key:operation ⚠️ | vanquished-archive |
| 47 | jsx-text | DEBTS VANQUISHED · |
| 60 | expr ⚠️ | Cleared |
| 65 | expr ⚠️ | Cleared |
| 73 | prop:label | Share |
| 99 | key:alignSelf ⚠️ | flex-start |

### `apps/rn/src/components/screen.tsx`

| line | origin | string |
|---|---|---|
| 67 | prop:accessibilityLabel | Back |
| 67 | other ⚠️ | screen-back |
| 130 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/ui/AnimatedSheet.tsx`

| line | origin | string |
|---|---|---|
| 79 | other ⚠️ | sheet-close |
| 82 | prop:accessibilityLabel | Close |

### `apps/rn/src/components/ui/ChartSkeleton.tsx`

| line | origin | string |
|---|---|---|
| 23 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/ui/FormSheet.tsx`

| line | origin | string |
|---|---|---|
| 108 | jsx-text | Remove |
| 121 | other ⚠️ | sheet-modal-root |
| 138 | other ⚠️ | sheet-drag-handle |
| 154 | other ⚠️ | sheet-close |
| 157 | prop:accessibilityLabel | Close |
| 174 | jsx-text | Remove |

### `apps/rn/src/components/ui/ListRow.tsx`

| line | origin | string |
|---|---|---|
| 76 | prop:accessibilityHint | Opens the editor |
| 126 | other ⚠️ | chevron-right |
| 144 | jsx-text | Delete |
| 151 | key:title ⚠️ | Log payment |
| 151 | key:systemIcon ⚠️ | dollarsign.circle |
| 152 | key:title ⚠️ | Payoff schedule |
| 153 | key:title ⚠️ | Edit |
| 154 | key:title ⚠️ | Delete |
| 189 | key:color ⚠️ | #ffffff |

### `apps/rn/src/components/ui/RowContextMenu.ios.tsx`

| line | origin | string |
|---|---|---|
| 17 | key:type ⚠️ | IMAGE_SYSTEM |
| 26 | prop:previewConfig ⚠️ | DEFAULT |

### `apps/rn/src/components/ui/Select.tsx`

| line | origin | string |
|---|---|---|
| 31 | expr ⚠️ | Select |
| 32 | other ⚠️ | expand-more |
| 68 | key:justifyContent ⚠️ | space-between |
| 70 | key:backgroundColor ⚠️ | rgba(0,0,0,0.45) |
| 72 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/ui/sheet-styles.ts`

| line | origin | string |
|---|---|---|
| 12 | key:justifyContent ⚠️ | flex-end |
| 25 | key:borderColor ⚠️ | rgba(255,255,255,0.06) |
| 26 | key:borderTopColor ⚠️ | rgba(255,255,255,0.16) |
| 35 | key:alignItems ⚠️ | flex-start |
| 35 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/ui/SheetScrim.tsx`

| line | origin | string |
|---|---|---|
| 24 | key:backgroundColor ⚠️ | rgba(0,0,0,0.28) |

### `apps/rn/src/components/ui/SwitchRow.tsx`

| line | origin | string |
|---|---|---|
| 21 | key:justifyContent ⚠️ | space-between |

### `apps/rn/src/components/ui/TwoColumn.tsx`

| line | origin | string |
|---|---|---|
| 46 | key:alignItems ⚠️ | flex-start |

### `apps/rn/src/data/migrations.ts`

| line | origin | string |
|---|---|---|
| 33 | other ⚠️ | runMigrations: persisted store is not an object |

### `apps/rn/src/hooks/spotlight.test.ts`

| line | origin | string |
|---|---|---|
| 32 | call:console.log ⚠️ | ▶ spotlight geometry |
| 37 | call:eq ⚠️ | a subject already inside the stage does not move the screen |
| 38 | call:eq ⚠️ | flush with the top edge counts as framed |
| 39 | call:eq ⚠️ | flush with the bottom edge counts as framed |
| 42 | call:eq ⚠️ | a subject below the stage scrolls down by exactly its overhang |
| 43 | call:eq ⚠️ | a subject half-hidden by the dock scrolls just enough to clear it |
| 46 | call:eq ⚠️ | a subject above the stage scrolls up (negative delta) |
| 50 | call:eq ⚠️ | a subject taller than the stage aligns to the TOP and accepts overflow |
| 51 | call:eq ⚠️ | a subject exactly the stage height is already framed |
| 60 | call:f.endsWith ⚠️ | .tsx |

### `apps/rn/src/hooks/use-sheet-presentation.ts`

| line | origin | string |
|---|---|---|
| 35 | call:Keyboard.addListener ⚠️ | keyboardDidShow |
| 36 | call:Keyboard.addListener ⚠️ | keyboardDidHide |

### `apps/rn/src/keyCommands/keyCommandBus.test.ts`

| line | origin | string |
|---|---|---|
| 22 | call:assert ⚠️ | a pending request is delivered to the next subscriber |
| 28 | call:assert ⚠️ | the latch fires only ONCE (a later subscriber gets nothing) |
| 40 | call:assert ⚠️ | an active subscriber receives the request |
| 42 | call:assert ⚠️ | an active subscriber receives EACH request (no latch when live) |
| 45 | call:assert ⚠️ | an unsubscribed listener stops receiving |

### `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx`

| line | origin | string |
|---|---|---|
| 31 | call:requireNativeViewManager ⚠️ | KeyCommands |
| 35 | key:'tab-today' ⚠️ | tab-today |
| 36 | key:'tab-progress' ⚠️ | tab-progress |
| 36 | key:'tab-progress' ⚠️ | /progress |
| 37 | key:'tab-money' ⚠️ | tab-money |
| 37 | key:'tab-money' ⚠️ | /money |
| 47 | expr ⚠️ | new-debt |
| 48 | call:router.navigate ⚠️ | /money |

### `apps/rn/src/lib/app-lock.ts`

| line | origin | string |
|---|---|---|
| 23 | key:promptMessage ⚠️ | Unlock Debt Planner |
| 24 | key:fallbackLabel ⚠️ | Use passcode |

### `apps/rn/src/lib/scan.ts`

| line | origin | string |
|---|---|---|
| 13 | call:requireNativeModule ⚠️ | ScanVision |

### `apps/rn/src/lib/scan.web.ts`

| line | origin | string |
|---|---|---|
| 10 | array ⚠️ | Chase Freedom Unlimited |
| 11 | array ⚠️ | Account ending 4821 |
| 12 | array ⚠️ | New Balance $2,431.09 |
| 13 | array ⚠️ | Minimum Payment Due $56.00 |
| 14 | array ⚠️ | Payment Due Date August 22, 2026 |
| 15 | array ⚠️ | Purchase APR 24.99% |

### `apps/rn/src/liveActivity/liveActivityBridge.native.ts`

| line | origin | string |
|---|---|---|
| 25 | call:requireNativeModule ⚠️ | LiveActivity |

### `apps/rn/src/liveActivity/liveActivityKeys.ts`

| line | origin | string |
|---|---|---|
| 11 | var:LIVE_ACTIVITY_APP_GROUP ⚠️ | group.com.jasonsnyder.debtplanner |
| 14 | var:PAYDAY_ACTIVITY_DEEPLINK ⚠️ | debtplannerrn:// |

### `apps/rn/src/liveActivity/liveActivitySync.ts`

| line | origin | string |
|---|---|---|
| 30 | other ⚠️ | startLiveActivitySync called with a SANDBOX store — refusing |
| 30 | key:seam ⚠️ | liveActivitySync |
| 65 | key:subsystem ⚠️ | liveActivity |

### `apps/rn/src/liveActivity/paydayActivityContent.test.ts`

| line | origin | string |
|---|---|---|
| 55 | call:eq ⚠️ | wholeDaysBetween: 3-day gap |
| 56 | call:eq ⚠️ | wholeDaysBetween: same day = 0 |
| 57 | call:eq ⚠️ | wholeDaysBetween: past date = negative |
| 58 | call:eq ⚠️ | wholeDaysBetween: unparseable → 0 (never NaN) |
| 60 | call:eq ⚠️ | wholeDaysBetween: spans DST, still whole days |
| 63 | call:eq ⚠️ | free tier → no content |
| 64 | call:eq ⚠️ | free tier → never runs |
| 70 | call:assert ⚠️ | premium → content built |
| 71 | call:eq ⚠️ | daysUntilPayday reflects the gap |
| 72 | call:eq ⚠️ | in 2 days |
| 72 | call:eq ⚠️ | countdownLabel: "in 2 days" |
| 73 | call:eq ⚠️ | paydayDateISO = the payday |
| 74 | call:assert ⚠️ | cycleProgress within (0,1] |
| 77 | call:eq ⚠️ | guardianState mirrors the Guardian brief |
| 78 | call:eq ⚠️ | title mirrors the Guardian brief |
| 79 | call:assert ⚠️ | line is non-empty |
| 83 | call:eq ⚠️ | Today |
| 83 | call:eq ⚠️ | label: Today |
| 84 | call:eq ⚠️ | Tomorrow |
| 84 | call:eq ⚠️ | label: Tomorrow |
| 89 | call:line.includes ⚠️ | short of your obligations |
| 89 | call:assert ⚠️ | shortfall → "short of your obligations" line |
| 93 | call:eq ⚠️ | premium + 2 days + toggle on → runs |
| 94 | call:eq ⚠️ | premium + 3 days (window edge) → runs |
| 95 | call:eq ⚠️ | premium + 4 days (outside window) → no |
| 96 | call:eq ⚠️ | toggle off → no |
| 98 | call:assert ⚠️ | build() ignores the window gate |
| 105 | call:eq ⚠️ | not running + should-run → start |
| 107 | call:assert ⚠️ | start action carries a content key |
| 110 | call:eq ⚠️ | running + unchanged read → none |
| 114 | call:eq ⚠️ | running + changed read → update |
| 117 | call:eq ⚠️ | running + outside window → end |
| 120 | call:eq ⚠️ | running + free → end |
| 123 | call:eq ⚠️ | not running + free → none |

### `apps/rn/src/liveActivity/paydayActivityContent.ts`

| line | origin | string |
|---|---|---|
| 53 | return ⚠️ | Today |
| 54 | return ⚠️ | Tomorrow |
| 82 | expr ⚠️ | Cushion safe |

### `apps/rn/src/motion/haptics.ts`

| line | origin | string |
|---|---|---|
| 21 | call:requireNativeModule ⚠️ | FinaleHaptics |

### `apps/rn/src/notifications/notifications.ts`

| line | origin | string |
|---|---|---|
| 15 | var:ID_PAYCHECK_EVE ⚠️ | paycheck-eve |
| 16 | var:ID_PAYDAY_CAPTURE ⚠️ | payday-capture |
| 17 | var:ID_BILLS_ALERT ⚠️ | bills-alert |
| 18 | var:ID_RISK ⚠️ | guardian-risk |
| 27 | var:NOTIF_CATEGORY_PAYDAY ⚠️ | payday-actions |
| 28 | var:NOTIF_CATEGORY_RISK ⚠️ | risk-actions |
| 29 | var:NOTIF_CATEGORY_BILLS ⚠️ | bills-actions |
| 31 | key:identifier ⚠️ | run-plan |
| 31 | key:buttonTitle ⚠️ | Run my plan |
| 32 | key:identifier ⚠️ | review-plan |
| 32 | key:buttonTitle ⚠️ | Review my plan |
| 33 | key:identifier ⚠️ | review-bills |
| 33 | key:buttonTitle ⚠️ | Check my plan |
| 68 | key:title ⚠️ | Before this paycheck lands |
| 69 | key:body ⚠️ | I'd give your plan a quick look before payday. |
| 113 | call:schedule ⚠️ | Paycheck tomorrow |
| 113 | call:schedule ⚠️ | Your paycheck arrives tomorrow — open Debt Planner to run your plan. |
| 120 | call:schedule ⚠️ | It's payday |
| 120 | call:schedule ⚠️ | Open Debt Planner to confirm your plan for this paycheck. |
| 136 | expr ⚠️ | Upcoming bill |

### `apps/rn/src/notifications/notifications.web.ts`

| line | origin | string |
|---|---|---|
| 10 | key:title ⚠️ | Time to check this paycheck |
| 11 | key:body ⚠️ | Take a quick look at your plan before this one lands. |
| 33 | var:NOTIF_CATEGORY_PAYDAY ⚠️ | payday-actions |
| 34 | var:NOTIF_CATEGORY_RISK ⚠️ | risk-actions |
| 35 | var:NOTIF_CATEGORY_BILLS ⚠️ | bills-actions |

### `apps/rn/src/premium/legal.ts`

| line | origin | string |
|---|---|---|
| 12 | var:TERMS_OF_USE_URL ⚠️ | https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ |
| 14 | var:PRIVACY_POLICY_URL ⚠️ | https://jsnyde03.github.io/debt-planner-site/privacy.html |
| 16 | var:SUPPORT_URL ⚠️ | https://jsnyde03.github.io/debt-planner-site/support.html |
| 19 | var:MANAGE_SUBSCRIPTION_URL ⚠️ | https://apps.apple.com/account/subscriptions |

### `apps/rn/src/premium/premiumKind.test.ts`

| line | origin | string |
|---|---|---|
| 21 | call:console.log ⚠️ | Running premium-kind (3.7.A5) tests... |
| 23 | call:eq ⚠️ | free → none |
| 24 | call:eq ⚠️ | free, unresolved → still none (the plan gate comes first) |
| 26 | call:eq ⚠️ | resolved + lifetime → lifetime |
| 27 | call:eq ⚠️ | subscription |
| 27 | call:eq ⚠️ | resolved + not lifetime → subscription |
| 31 | call:eq ⚠️ | A5 — premium but unanswered → unresolved, NOT subscription |
| 34 | call:eq ⚠️ | …and `resolved` gates the flag in both directions |
| 36 | call:canManageSubscription ⚠️ | subscription |
| 36 | call:eq ⚠️ | only a real subscription offers Manage Subscription |
| 37 | call:eq ⚠️ | …never a Lifetime owner (the subs page would be empty) |
| 38 | call:eq ⚠️ | …and never while unresolved — a dead link is worse than a missing one |
| 39 | call:eq ⚠️ | …nor a free user |

### `apps/rn/src/premium/premiumKind.ts`

| line | origin | string |
|---|---|---|
| 17 | other ⚠️ | subscription |
| 26 | expr ⚠️ | subscription |
| 35 | expr ⚠️ | subscription |

### `apps/rn/src/premium/purchases.ts`

| line | origin | string |
|---|---|---|
| 19 | var:LIFETIME_PRODUCT_ID ⚠️ | paycheck_debt_planner_premium_lifetime |

### `apps/rn/src/premium/purchasesClient.ts`

| line | origin | string |
|---|---|---|
| 25 | var:DEBT_RC_IOS_KEY ⚠️ | appl_XUWODZnbbJFPbdMTgBTyKNAGGyp |

### `apps/rn/src/storage/adapter.ts`

| line | origin | string |
|---|---|---|
| 21 | other ⚠️ | Storage is locked |
| 23 | expr ⚠️ | StorageLockedError |

### `apps/rn/src/storage/createAdapter.ts`

| line | origin | string |
|---|---|---|
| 20 | var:QUARANTINE_PREFIX ⚠️ | quarantine. |

### `apps/rn/src/storage/createAdapter.web.ts`

| line | origin | string |
|---|---|---|
| 8 | var:KEY ⚠️ | debtPlanner.rnStore |
| 9 | var:QUARANTINE_PREFIX ⚠️ | debtPlanner.rnStore.__quarantine__ |

### `apps/rn/src/store/affordability.test.ts`

| line | origin | string |
|---|---|---|
| 27 | key:name ⚠️ | Card |
| 35 | call:console.log ⚠️ | Running affordability selectors (2.9) tests... |
| 39 | call:assert ⚠️ | $500 → comfortable (cushion $1400 ≥ floor) |
| 40 | call:assert ⚠️ | $1800 → tight (cushion $100 < floor $200) |
| 42 | call:assert ⚠️ | $2500 → short (exceeds $1900) |
| 43 | call:assert ⚠️ | …short by $600 |
| 46 | call:assert ⚠️ | a purchase reduces what reaches debt this paycheck (extraToDebtDelta > 0) |
| 49 | key:name ⚠️ | Vacation |
| 51 | call:assert ⚠️ | $1800 is tight (cover case) |
| 52 | expr ⚠️ | Vacation |
| 52 | call:assert ⚠️ | cover offers the $100 gap from the savings goal |
| 53 | call:assert ⚠️ | no cover option when there is no savings goal |
| 54 | key:name ⚠️ | Emergency Fund |
| 55 | call:assert ⚠️ | never raids the emergency fund for a discretionary buy |
| 56 | call:assert ⚠️ | a comfortable purchase has no cover option |
| 57 | call:assert ⚠️ | …and a fully-funded cover reports holdsLine |
| 67 | key:name ⚠️ | Rent |
| 68 | key:name ⚠️ | Vacation |
| 71 | call:assert ⚠️ | pre-top-up: the cushion is $150 (under the $200 floor) |
| 72 | call:assert ⚠️ | …and a $100 purchase needs the full $150 gap covered |
| 77 | call:assert ⚠️ | A3.6 — the $50 already moved from savings counts toward the cushion ($150 + $50) |
| 78 | call:assert ⚠️ | …so the same $100 purchase dips to $100, not the stale $50 |
| 81 | call:assert ⚠️ | …and the cover asks the REMAINING $100, never re-offering the $50 already moved |
| 84 | key:name ⚠️ | Vacation |
| 86 | call:assert ⚠️ | a thin savings pot caps the cover at its balance |
| 87 | call:assert ⚠️ | …and reports holdsLine=false — $20 against a $150 gap does not hold the line |
| 91 | call:assert ⚠️ | an applied top-up that reaches the floor reports holdsLine |
| 92 | key:name ⚠️ | Vacation |
| 93 | call:assert ⚠️ | …a capped one does not, even once the goal is drained to $0 |
| 97 | call:assert ⚠️ | a prioritized "fast" option with a real per-paycheck pace + ready date |
| 98 | call:assert ⚠️ | a debt-first option (no priority, no firm date) |
| 99 | call:assert ⚠️ | at least fast + debt-first are offered |

### `apps/rn/src/store/analysisSelectors.ts`

| line | origin | string |
|---|---|---|
| 110 | expr ⚠️ | Unable to estimate |
| 111 | expr ⚠️ | Unable to estimate |

### `apps/rn/src/store/balanceSelectors.ts`

| line | origin | string |
|---|---|---|
| 82 | key:text ⚠️ | estimated · verify soon |

### `apps/rn/src/store/bnplCadence.test.ts`

| line | origin | string |
|---|---|---|
| 24 | key:name ⚠️ | Klarna |
| 25 | key:bnplProvider ⚠️ | Klarna |
| 45 | call:console.log ⚠️ | Running BNPL cadence integration (2.7.4) tests... |
| 50 | call:assert ⚠️ | monthly allocation resolves |
| 55 | call:assert ⚠️ | biweekly allocation resolves |
| 62 | call:assert ⚠️ | both timelines build |
| 80 | call:assert ⚠️ | aligned biweekly-paid case has no between-paycheck heads-up |

### `apps/rn/src/store/celebrationSelectors.test.ts`

| line | origin | string |
|---|---|---|
| 27 | call:console.log ⚠️ | Running celebration selectors (3.3.1.1) tests... |
| 32 | key:name ⚠️ | Chase |
| 33 | key:name ⚠️ | Klarna |
| 34 | key:name ⚠️ | Live |
| 35 | key:name ⚠️ | NoOrig |
| 40 | call:assert ⚠️ | amount = originalBalance |
| 41 | call:assert ⚠️ | missing originalBalance → null (not fabricated) |
| 42 | call:assert ⚠️ | bnpl flagged |
| 45 | call:assert ⚠️ | x is the only live debt → finale |
| 46 | call:assert ⚠️ | two live debts → not the last |
| 47 | call:assert ⚠️ | an already-$0 debt is not a live-last |
| 65 | call:assert ⚠️ | no onboardedAt → monthsToFreedom null |

### `apps/rn/src/store/coachMarkCopy.ts`

| line | origin | string |
|---|---|---|
| 28 | key:'payoff-schedule' ⚠️ | payoff-schedule |
| 29 | key:title ⚠️ | See the whole payoff |
| 30 | key:body ⚠️ | Every payment from here to debt-free, month by month. |
| 35 | key:'debt-row-actions' ⚠️ | debt-row-actions |
| 36 | key:title ⚠️ | Press and hold a debt |
| 37 | key:body ⚠️ | Log a payment, see its payoff schedule, or edit it without leaving this list. |
| 40 | key:'trajectory-scrub' ⚠️ | trajectory-scrub |
| 41 | key:title ⚠️ | Drag the curve |
| 42 | key:body ⚠️ | Scrub any month to see what you owe and when you land. |

### `apps/rn/src/store/coachMarks.test.ts`

| line | origin | string |
|---|---|---|
| 28 | call:console.log ⚠️ | ▶ coach-marks |
| 33 | call:assert ⚠️ | coachMarksSeen defaults to an array |
| 34 | call:assert ⚠️ | …and it starts empty, so every mark is eligible |
| 37 | call:getState().show ⚠️ | payoff-schedule |
| 38 | expr ⚠️ | payoff-schedule |
| 38 | call:assert ⚠️ | a first offer becomes the active mark |
| 40 | call:coachMarksSeen.includes ⚠️ | payoff-schedule |
| 41 | call:assert ⚠️ | …and is recorded to the real store immediately, not on dismissal |
| 46 | call:getState().show ⚠️ | payoff-schedule |
| 47 | call:assert ⚠️ | a dismissed mark is not re-offered in the same run |
| 52 | call:getState().show ⚠️ | payoff-schedule |
| 53 | call:assert ⚠️ | nor across a relaunch — the persisted list is what makes it once EVER |
| 57 | call:getState().show ⚠️ | cash-runway-scrub |
| 58 | expr ⚠️ | cash-runway-scrub |
| 58 | call:assert ⚠️ | an unseen mark still fires while another is recorded |
| 63 | call:assert ⚠️ | reset clears the persisted list |
| 64 | call:assert ⚠️ | …and the session set, or the replay silently no-ops |
| 65 | call:getState().show ⚠️ | payoff-schedule |
| 66 | expr ⚠️ | payoff-schedule |
| 66 | call:assert ⚠️ | …so a previously-seen mark is offered again after a reset |
| 78 | call:getState().show ⚠️ | trajectory-scrub |
| 79 | expr ⚠️ | trajectory-scrub |
| 79 | call:assert ⚠️ | a mark is up before the run starts |
| 81 | call:assert ⚠️ | …and starting an interruption dismisses it |
| 86 | call:getState().show ⚠️ | payoff-schedule |
| 87 | call:assert ⚠️ | no mark fires while a bounded run is interrupting |
| 90 | call:assert ⚠️ | …and a refused mark is NOT recorded, so it is still owed to the user afterwards |
| 93 | call:getState().show ⚠️ | payoff-schedule |
| 94 | expr ⚠️ | payoff-schedule |
| 94 | call:assert ⚠️ | …and it is offered once the run ends |
| 98 | call:getState().show ⚠️ | payoff-schedule |
| 99 | call:getState().show ⚠️ | cash-runway-scrub |
| 100 | expr ⚠️ | payoff-schedule |
| 100 | call:assert ⚠️ | a second mark is refused, not queued, while one is up |
| 104 | call:getState().show ⚠️ | payoff-schedule |
| 105 | call:assert ⚠️ | no mark fires while a screen declares its own interruption |
| 107 | call:getState().show ⚠️ | payoff-schedule |
| 108 | expr ⚠️ | payoff-schedule |
| 108 | call:assert ⚠️ | …and it is offered once that interruption clears |

### `apps/rn/src/store/debtFreeBand.test.ts`

| line | origin | string |
|---|---|---|
| 20 | key:name ⚠️ | Card |
| 29 | call:assert ⚠️ | fixed income has no band |
| 30 | call:assert ⚠️ | fixed income lean is null |
| 31 | call:assert ⚠️ | fixed income still has a typical date |
| 37 | call:assert ⚠️ | equal typical/lean income → dates match → no band |
| 43 | call:assert ⚠️ | variable income yields both dates |
| 44 | call:assert ⚠️ | a materially lower lean income produces a band |
| 45 | call:assert ⚠️ | lean payoff is not earlier than typical |

### `apps/rn/src/store/demoExit.ts`

| line | origin | string |
|---|---|---|
| 8 | other ⚠️ | /onboarding |
| 8 | other ⚠️ | /paywall |
| 28 | key:name ⚠️ | demo_exited |
| 28 | expr ⚠️ | /paywall |
| 28 | expr ⚠️ | unlock_premium |
| 28 | expr ⚠️ | start_real_plan |
| 38 | call:router.replace ⚠️ | /onboarding |
| 39 | expr ⚠️ | /paywall |
| 39 | call:router.push ⚠️ | /paywall |

### `apps/rn/src/store/demoRun.ts`

| line | origin | string |
|---|---|---|
| 23 | other ⚠️ | /money |
| 23 | other ⚠️ | /progress |
| 90 | key:screen ⚠️ | /money |
| 90 | key:beat ⚠️ | The situation: three debts, a number you recognise. |
| 91 | key:beat ⚠️ | The mechanism: a paycheck lands and the cushion is held at your line, before payoff. |
| 92 | key:beat ⚠️ | The proof: a tight paycheck, and the safety net covers it. |
| 93 | key:screen ⚠️ | /progress |
| 93 | key:beat ⚠️ | The payoff: the ring, the curve, the debt-free date. |
| 99 | key:beat ⚠️ | The triumph: a debt one tap from zero. The capture driver confirms it, and the celebration is real. |

### `apps/rn/src/store/demoSession.test.ts`

| line | origin | string |
|---|---|---|
| 28 | call:console.log ⚠️ | ▶ demo session + bounded-run predicate |
| 32 | call:assert ⚠️ | start() activates the session |
| 33 | call:assert ⚠️ | start() creates a sandbox |
| 34 | call:assert ⚠️ | the demo runs on a SANDBOX store, never the singleton |
| 35 | call:assert ⚠️ | the demo's store is not the app store |
| 41 | call:assert ⚠️ | re-entering an active demo keeps the same sandbox |
| 52 | call:assert ⚠️ | end() never publishes a frame where active and sandbox disagree |
| 53 | call:assert ⚠️ | end() clears both halves |
| 74 | call:assert ⚠️ | the arc visits at least three screens — situation, mechanism, payoff |
| 75 | expr ⚠️ | /money |
| 75 | call:assert ⚠️ | it OPENS on the problem, not on a feature |
| 76 | expr ⚠️ | /progress |
| 76 | call:assert ⚠️ | it reaches Progress, where the debt-free date lives |
| 83 | call:assert ⚠️ | the closing beat primes a payoff |
| 88 | call:assert ⚠️ | exactly one debt is primed to the payoff invitation — not none, not all |
| 99 | call:assert ⚠️ | the opening stage is applied synchronously |
| 100 | call:assert ⚠️ | stages are strictly ordered in time |
| 128 | call:assert ⚠️ | holdClock leaves a clock to be started |
| 129 | call:assert ⚠️ | a HELD clock schedules nothing — the beats wait for the screen |
| 130 | call:assert ⚠️ | the opening state is applied anyway, so the slate has something to cover |
| 133 | call:assert ⚠️ | releasing schedules every remaining beat |
| 134 | call:assert ⚠️ | a released clock is no longer holdable |
| 137 | call:assert ⚠️ | releasing twice does not run the script twice |
| 139 | call:assert ⚠️ | end() clears a pending clock |
| 144 | call:assert ⚠️ | without holdClock there is nothing to release |
| 145 | call:assert ⚠️ | without holdClock every beat is scheduled immediately |
| 156 | call:assert ⚠️ | a starter that outlives its session cannot resurrect the script |

### `apps/rn/src/store/demoSession.ts`

| line | origin | string |
|---|---|---|
| 114 | key:name ⚠️ | demo_stage |
| 117 | key:name ⚠️ | demo_completed |

### `apps/rn/src/store/drift.ts`

| line | origin | string |
|---|---|---|
| 62 | expr ⚠️ | Unable to estimate |

### `apps/rn/src/store/greeting.test.ts`

| line | origin | string |
|---|---|---|
| 19 | call:console.log ⚠️ | Running Today greeting (3.7.B.2) tests... |
| 22 | call:eq ⚠️ | 04:59 is still evening (the small hours) |
| 23 | call:eq ⚠️ | 05:00 opens morning |
| 24 | call:eq ⚠️ | 11:59 is still morning |
| 25 | call:eq ⚠️ | noon opens afternoon |
| 26 | call:eq ⚠️ | 16:59 is still afternoon |
| 27 | call:eq ⚠️ | 17:00 opens evening |
| 28 | call:eq ⚠️ | late night is evening |
| 29 | call:eq ⚠️ | midnight is evening, not morning |
| 32 | call:eq ⚠️ | hour 24 wraps to 0 |
| 33 | call:eq ⚠️ | a negative hour wraps, not crashes |
| 34 | call:eq ⚠️ | NaN falls back rather than producing "undefined" |
| 37 | call:eq ⚠️ | unset → undefined |
| 38 | call:eq ⚠️ | empty → undefined |
| 39 | call:eq ⚠️ | whitespace-only → undefined (cleared === never set) |
| 40 | call:normalizeDisplayName ⚠️ | Jason |
| 40 | call:eq ⚠️ | Jason |
| 41 | call:normalizeDisplayName ⚠️ | Jason   R |
| 41 | call:eq ⚠️ | Jason R |
| 41 | call:eq ⚠️ | interior whitespace collapses |
| 42 | call:eq ⚠️ | a long name is capped so the title cannot wrap |
| 45 | call:eq ⚠️ | Good morning |
| 45 | call:eq ⚠️ | no name → the bare time-of-day greeting |
| 46 | call:selectGreeting ⚠️ | Jason |
| 46 | call:eq ⚠️ | Good morning, Jason |
| 46 | call:eq ⚠️ | a name personalises it |
| 47 | call:selectGreeting ⚠️ | Jason |
| 47 | call:eq ⚠️ | Good afternoon, Jason |
| 47 | call:eq ⚠️ | …in every band |
| 48 | call:selectGreeting ⚠️ | Jason |
| 48 | call:eq ⚠️ | Good evening, Jason |
| 48 | call:eq ⚠️ | …in every band |
| 49 | call:eq ⚠️ | Good morning |
| 49 | call:eq ⚠️ | a whitespace name is no name — never "Good morning, " |

### `apps/rn/src/store/greeting.ts`

| line | origin | string |
|---|---|---|
| 38 | key:morning ⚠️ | Good morning |
| 39 | key:afternoon ⚠️ | Good afternoon |
| 40 | key:evening ⚠️ | Good evening |

### `apps/rn/src/store/guardianPrediction.test.ts`

| line | origin | string |
|---|---|---|
| 44 | call:console.log ⚠️ | Running 2.4.D.4 prediction-orchestration tests... |
| 47 | call:check ⚠️ | fresh stamp when none exists |
| 48 | call:check ⚠️ | null read → no-op (no stamp) |
| 51 | call:check ⚠️ | same cycle, no material change → idempotent (unchanged reference) |
| 54 | call:check ⚠️ | same cycle, material change (state flip) → re-stamp + restampedMidCycle |
| 57 | call:check ⚠️ | same cycle, ≥$1 cushion move → re-stamp (disturbed) |
| 60 | call:check ⚠️ | a DIFFERENT cycle → fresh stamp, NOT marked disturbed |
| 63 | call:check ⚠️ | fixed income, ≥3 genuine cycles → no holdbacks, not provisional |
| 67 | call:check ⚠️ | new user (<3 genuine cycles) → discovery active + provisional |
| 71 | call:check ⚠️ | fixed income NEVER triggers cold-start (masked) |
| 72 | call:check ⚠️ | variable income, <4 lean-confirming actuals → cold-start active |
| 76 | other ⚠️ | incomeActualsLog |
| 80 | call:check ⚠️ | variable income, ≥4 lean-confirming actuals → cold-start released |
| 85 | other ⚠️ | incomeActualsLog |
| 101 | call:check ⚠️ | no in-flight prediction → snapshot untouched (un-graded) |
| 104 | call:check ⚠️ | prediction for a DIFFERENT cycle → snapshot untouched |
| 109 | other ⚠️ | incomeActualsLog |
| 113 | call:check ⚠️ | matching cycle → folds prediction + outcome, cushion held == predicted when actual==planned |
| 118 | other ⚠️ | incomeActualsLog |
| 122 | call:check ⚠️ | actual income below planned → held cushion drops by the shortfall (300 − 300 = 0) |
| 127 | other ⚠️ | incomeActualsLog |
| 128 | other ⚠️ | surpriseOutflowLog |
| 132 | call:check ⚠️ | a surprise outflow reduces the held cushion (300 − 120 = 180) |
| 138 | call:check ⚠️ | a missed arrival → actualIncome 0 (cushion floored at 0, not negative) |
| 141 | call:check ⚠️ | a re-stamped prediction → snapshot.disturbed = true |
| 144 | call:check ⚠️ | classifyFreshness: <30 days → fresh |
| 145 | call:check ⚠️ | classifyFreshness: 30–44 days → aging |
| 146 | call:check ⚠️ | classifyFreshness: ≥45 days → stale |
| 147 | call:check ⚠️ | classifyFreshness: negative day count floored to fresh |
| 148 | call:check ⚠️ | daysBetweenISO computes whole-day span |
| 151 | call:check ⚠️ | recent inputsAsOf → fresh even if a debt would be stale by lastVerifiedDate |
| 154 | call:check ⚠️ | genuineCycleCount increments on a debt-free store (substrate de-gated) |
| 156 | call:check ⚠️ | income-actuals record on a debt-free store (substrate de-gated) |
| 158 | call:console.log ⚠️ | ✅ All 2.4.D.4 + D.7 prediction/seam tests passed. |

### `apps/rn/src/store/guardianPredictionCore.ts`

| line | origin | string |
|---|---|---|
| 33 | other ⚠️ | predictedConfidenceContext |

### `apps/rn/src/store/guardianSelectors.test.ts`

| line | origin | string |
|---|---|---|
| 44 | key:name ⚠️ | Everyday |
| 46 | expr ⚠️ | Emergency Fund |
| 54 | call:console.log ⚠️ | Running Guardian selector (RS.2) tests... |
| 57 | call:eq ⚠️ | no paycheck → null |
| 58 | call:eq ⚠️ | default (empty) store → null |
| 62 | call:assert ⚠️ | high headroom → clear |
| 63 | call:assert ⚠️ | clear premium deploys the spare to debt |
| 66 | call:assert ⚠️ | headroom under the floor (but ≥ half) → tight |
| 67 | call:eq ⚠️ | tight deploys nothing |
| 70 | expr ⚠️ | at-risk |
| 70 | call:assert ⚠️ | headroom below half the floor → at-risk |
| 73 | expr ⚠️ | at-risk |
| 73 | call:assert ⚠️ | bills exceed the paycheck → at-risk |
| 74 | call:assert ⚠️ | …and the shortfall title |
| 75 | call:eq ⚠️ | …deploy paused in a shortfall |
| 79 | call:assert ⚠️ | debt-free → Guardian PERSISTS (not null) |
| 80 | call:eq ⚠️ | …flagged debtFree |
| 81 | call:assert ⚠️ | …spare deploys to savings |
| 85 | call:assert ⚠️ | free: same headroom → clear |
| 86 | call:eq ⚠️ | free gets no safeMove (the card shows the invitation) |
| 89 | array ⚠️ | NaN |
| 89 | array ⚠️ | Infinity |
| 93 | call:assert ⚠️ | huge paycheck → clear, finite viz (no Infinity) |
| 98 | call:assert ⚠️ | tight + savings → a top-up offer |
| 99 | call:eq ⚠️ | …topUp = the gap to the floor (200 − 150) |
| 100 | call:eq ⚠️ | Emergency Fund |
| 100 | call:eq ⚠️ | …names the savings source |
| 102 | call:eq ⚠️ | tight + NO savings → null (honest calm state) |
| 103 | call:eq ⚠️ | CLEAR → null (nothing to hold) |
| 104 | call:eq ⚠️ | free tier → null (premium-only) |
| 107 | call:assert ⚠️ | savings < gap → topUp capped at the balance |
| 120 | call:eq ⚠️ | Savings 1 |
| 120 | call:eq ⚠️ | A3.3 — a discretionary goal wins over the EF even when the EF is first |
| 121 | call:eq ⚠️ | …and it is not flagged as the emergency fund |
| 125 | call:eq ⚠️ | A3.3 — EF-only → still offered, and flagged as the emergency fund |
| 130 | call:eq ⚠️ | premium at-risk → risk push fires |
| 131 | call:eq ⚠️ | free → no risk push (premium-only) |
| 132 | call:eq ⚠️ | clear → no risk push (risk-only) |
| 133 | call:eq ⚠️ | 2 recent pushes → frequency-capped |
| 137 | call:eq ⚠️ | no history → not proven (day-one state) |
| 138 | call:eq ⚠️ | no history → matchRate null (no hollow number) |
| 139 | call:eq ⚠️ | no gradeable cycles → n 0 |
| 146 | key:name ⚠️ | Netflix |
| 148 | call:eq ⚠️ | Netflix |
| 148 | call:eq ⚠️ | converted trial (past kick-in) → surfaces |
| 149 | call:eq ⚠️ | → carries the full price |
| 150 | call:eq ⚠️ | /mo |
| 150 | call:eq ⚠️ | → monthly cadence label |
| 151 | call:eq ⚠️ | not-yet-converted (future kick-in) → null |
| 152 | call:eq ⚠️ | not flagged a trial → null |
| 153 | call:eq ⚠️ | no full price → null (no phantom prompt) |
| 154 | call:eq ⚠️ | non-finite full price → null |
| 155 | call:eq ⚠️ | no trials → null |
| 156 | call:eq ⚠️ | Netflix |
| 156 | call:eq ⚠️ | free tier also gets the prompt (accuracy for all) |
| 169 | call:eq ⚠️ | A3.2 — the starter EF absorbs the whole spare, so nothing reaches debt |
| 170 | call:eq ⚠️ | …and the real cushion is the $200 floor, not the $1,000 headroom |
| 171 | call:detail.includes ⚠️ | keeps all of it as your cushion |
| 171 | call:assert ⚠️ | …so the brief must NOT claim it keeps all of it as cushion |
| 172 | call:detail.includes ⚠️ | Emergency Fund |
| 172 | call:assert ⚠️ | …it names the $800 and where it went |
| 173 | call:detail.includes ⚠️ | funds before debt payoff |
| 173 | call:assert ⚠️ | …and why debt got nothing |
| 175 | call:safeMove?.includes ⚠️ | Emergency Fund |
| 175 | call:assert ⚠️ | …and the safe move points at the rung that actually receives it |
| 181 | key:name ⚠️ | Vacation |
| 183 | call:eq ⚠️ | A3.2 — a PRIORITY savings goal absorbs the spare the same way |
| 184 | call:detail.includes ⚠️ | keeps all of it as your cushion |
| 184 | call:assert ⚠️ | …and gets the same honest treatment, not just the EF |
| 185 | call:detail.includes ⚠️ | Vacation |
| 185 | call:assert ⚠️ | …naming the goal that actually received it |
| 191 | call:eq ⚠️ | discretionary exactly at the floor → clear (not tight) |
| 192 | call:eq ⚠️ | …with no pre-debt rung and no spare to debt |
| 193 | call:detail.includes ⚠️ | keeps all of it as your cushion |
| 193 | call:assert ⚠️ | …still says so, because this time it is true |

### `apps/rn/src/store/guardianSelectors.ts`

| line | origin | string |
|---|---|---|
| 94 | key:reason ⚠️ | not-risk |
| 135 | expr ⚠️ | your savings |
| 135 | expr ⚠️ | your debt |
| 196 | return ⚠️ | /wk |
| 197 | return ⚠️ | /2wks |
| 198 | other ⚠️ | per-paycheck |
| 198 | return ⚠️ | /paycheck |
| 199 | return ⚠️ | /qtr |
| 200 | return ⚠️ | /yr |
| 201 | return ⚠️ | /mo |
| 329 | expr ⚠️ | BNPL |
| 332 | call:amount).toLocaleString ⚠️ | en-US |
| 362 | var:AFFORD_PREVIEW_ID ⚠️ | __afford_preview__ |
| 384 | key:name ⚠️ | Purchase |
| 384 | other ⚠️ | one-time |
| 390 | other ⚠️ | coverFromSavings |
| 421 | array ⚠️ | minimum_debt |
| 421 | array ⚠️ | autopay_expense |
| 421 | array ⚠️ | autopay_debt |
| 422 | array ⚠️ | cushion_buffer |
| 422 | array ⚠️ | prefunded_reserve |
| 422 | array ⚠️ | discovery_holdback |
| 423 | array ⚠️ | starter_emergency |
| 424 | array ⚠️ | optional_goal |
| 426 | array ⚠️ | true_leftover |
| 522 | key:title ⚠️ | Save fast |
| 522 | key:detail ⚠️ | Funds before debt — pauses most of your extra debt payoff while you save. |
| 528 | key:title ⚠️ | Balanced |
| 528 | key:detail ⚠️ | A lighter set-aside — eases off your debt payoff a little, takes longer. |
| 533 | key:title ⚠️ | Keep debt first |
| 533 | key:detail ⚠️ | Save whatever’s spare after debt — no hit to your debt-free date, but no firm date. |
| 565 | expr ⚠️ | starter_emergency |
| 565 | expr ⚠️ | optional_goal |

### `apps/rn/src/store/guardianSubjects.test.ts`

| line | origin | string |
|---|---|---|
| 74 | call:console.log ⚠️ | 3.5.3.9 — the arc invariant (every beat renders its own subject)... |
| 93 | key:state ⚠️ | at-risk |
| 95 | call:atRisk.has ⚠️ | guardian-adjust |
| 95 | call:assert ⚠️ | the predicate CAN say no: a shortfall withdraws "adjust your line" |
| 96 | call:atRisk.has ⚠️ | guardian-reserve |
| 96 | call:assert ⚠️ | …and a built Recovery plan replaces the attestation |
| 100 | call:free.has ⚠️ | guardian-adjust |
| 100 | call:free.has ⚠️ | guardian-reserve |
| 100 | call:assert ⚠️ | …and a free card offers neither premium control |
| 110 | array ⚠️ | today-ack |

### `apps/rn/src/store/guardianSubjects.ts`

| line | origin | string |
|---|---|---|
| 40 | array ⚠️ | guardian-card |
| 40 | array ⚠️ | guardian-bar |
| 40 | array ⚠️ | guardian-adjust |
| 40 | array ⚠️ | guardian-reserve |
| 61 | array ⚠️ | guardian-card |
| 61 | array ⚠️ | guardian-bar |
| 64 | expr ⚠️ | at-risk |
| 64 | call:ids.add ⚠️ | guardian-adjust |
| 66 | call:ids.add ⚠️ | guardian-reserve |

### `apps/rn/src/store/looksLikeDebt.test.ts`

| line | origin | string |
|---|---|---|
| 24 | key:name ⚠️ | Mortgage |
| 24 | call:assert ⚠️ | a mortgage is caught — the case Jason hit |
| 25 | key:name ⚠️ | Rocket Mortgage |
| 25 | call:assert ⚠️ | a lender-branded mortgage is caught |
| 26 | key:name ⚠️ | Rent |
| 26 | call:assert ⚠️ | rent is NOT accused — it is the same shape and a real expense |
| 29 | key:name ⚠️ | Visa |
| 29 | call:assert ⚠️ | Visa |
| 30 | key:name ⚠️ | Chase credit card |
| 30 | call:assert ⚠️ | a credit card |
| 31 | key:name ⚠️ | Car loan |
| 31 | call:assert ⚠️ | a car loan |
| 32 | key:name ⚠️ | Klarna — sofa |
| 32 | call:assert ⚠️ | BNPL by brand |
| 35 | key:name ⚠️ | Discovery+ |
| 35 | call:assert ⚠️ | Discovery+ is a subscription, not Discover — the word boundary earns its place |
| 36 | key:name ⚠️ | Cardio Gym |
| 36 | call:assert ⚠️ | "Cardio" is not "card" |
| 37 | key:name ⚠️ | Electric |
| 37 | call:assert ⚠️ | a utility |
| 38 | key:name ⚠️ | Netflix |
| 38 | call:assert ⚠️ | a subscription |
| 39 | key:name ⚠️ | Payment plan |
| 39 | call:assert ⚠️ | "payment" alone is NOT a debt word — too many bills are called one |
| 44 | key:name ⚠️ | Mortgage |
| 56 | key:id ⚠️ | d-converted |
| 57 | key:name ⚠️ | Mortgage |
| 69 | expr ⚠️ | Mortgage |
| 69 | call:assert ⚠️ | the debt exists |
| 70 | call:assert ⚠️ | and the expense is GONE — not left reserving the same money twice |
| 71 | call:assert ⚠️ | originalBalance is seeded so the row can show progress |
| 72 | call:assert ⚠️ | the balance is stamped as verified now — it was just typed by hand |
| 76 | key:name ⚠️ | Second |
| 77 | call:assert ⚠️ | an unmatched expense id still adds the debt the user entered |

### `apps/rn/src/store/milestoneCross.test.ts`

| line | origin | string |
|---|---|---|
| 26 | key:name ⚠️ | Card |
| 33 | call:console.log ⚠️ | Running milestone-cross capture (3.3.2.1) tests... |
| 38 | call:assert ⚠️ | a portfolio crossing sets pendingMilestone |
| 40 | call:assert ⚠️ | portfolioMaxProgress advanced to (at least) the crossing |
| 44 | call:assert ⚠️ | the tiny debt paid off (reaches 100%) |
| 45 | call:assert ⚠️ | 100% never sets a milestone (finale owns debt-free) |
| 49 | call:assert ⚠️ | the debt is still alive (not a 100% case) |
| 50 | call:assert ⚠️ | an already-celebrated threshold does not re-fire |

### `apps/rn/src/store/payday.ts`

| line | origin | string |
|---|---|---|
| 125 | key:id ⚠️ | __portfolio__ |
| 125 | key:name ⚠️ | Portfolio |
| 161 | other ⚠️ | __portfolio__ |

### `apps/rn/src/store/persistence.ts`

| line | origin | string |
|---|---|---|
| 26 | other ⚠️ | bootstrapPersistence called with a SANDBOX store — refusing |

### `apps/rn/src/store/persistenceLifecycle.test.ts`

| line | origin | string |
|---|---|---|
| 47 | call:console.log ⚠️ | Running persistence-lifecycle (RS.5) tests... |
| 54 | call:eq ⚠️ | first launch → hydrated |
| 55 | call:eq ⚠️ | …seeds the blob exactly once |
| 56 | call:eq ⚠️ | …seeded blob at the current version |
| 65 | call:eq ⚠️ | clean hydrate → data loaded |
| 66 | call:eq ⚠️ | …current-version blob is NOT rewritten (no needless churn) |
| 74 | call:eq ⚠️ | upgrade hydrate → migrated to current |
| 75 | call:eq ⚠️ | …the migration is persisted |
| 80 | other ⚠️ | this is not a store |
| 83 | call:eq ⚠️ | corrupt blob → quarantined exactly once |
| 84 | call:eq ⚠️ | migration-failed |
| 84 | call:eq ⚠️ | …with the right reason |
| 85 | call:eq ⚠️ | …store reset to fresh defaults |
| 86 | call:eq ⚠️ | …fresh defaults overwrite the corrupt bytes |
| 87 | call:eq ⚠️ | …and we stay hydrated (never brick the app) |
| 95 | call:eq ⚠️ | malformed nested blob → quarantined (no hard crash) |
| 96 | call:eq ⚠️ | …recovered to fresh defaults |
| 104 | call:eq ⚠️ | array blob → quarantined |
| 114 | call:eq ⚠️ | save → writes through the adapter |
| 115 | call:eq ⚠️ | …and clears the saving flag when done |
| 121 | call:eq ⚠️ | future version → stamped to current |
| 124 | call:eq ⚠️ | partial prefs → the set field is preserved |
| 125 | call:eq ⚠️ | …and the unset prefs fall back to defaults |
| 128 | call:eq ⚠️ | unknown field → passed through (forward-compat) |

### `apps/rn/src/store/planSelectors.test.ts`

| line | origin | string |
|---|---|---|
| 35 | key:name ⚠️ | Card |
| 43 | other ⚠️ | FAIL [setup] — no allocation |
| 48 | call:console.log ⚠️ | Running required-row re-add (3.7.B.1) tests... |
| 52 | call:assert ⚠️ | unpaid minimum → one required row |
| 53 | call:assert ⚠️ | unpaid minimum → the row does not read as paid |
| 57 | call:assert ⚠️ | `minimumPaidThisCycle` → the paid row is re-added, not dropped |
| 58 | call:assert ⚠️ | `minimumPaidThisCycle` → the row reads as paid (struck through) |
| 63 | call:assert ⚠️ | legacy `isPaidThisCycle` → the paid row is re-added, not dropped |
| 64 | call:assert ⚠️ | legacy `isPaidThisCycle` → the row reads as paid (struck through) |
| 68 | call:assert ⚠️ | both flags → one row, not two (the re-add respects `shownDebts`) |
| 73 | other ⚠️ | cycleHistory |
| 76 | call:assert ⚠️ | no history → no streak |
| 77 | call:assert ⚠️ | three on-plan cycles → 3 |
| 78 | call:assert ⚠️ | a broken cycle ends the run (counts back from the latest) |
| 79 | call:assert ⚠️ | the MOST RECENT cycle off-plan → 0, whatever came before |
| 84 | expr ⚠️ | 2 paychecks on plan |
| 84 | call:assert ⚠️ | at the floor → the caption |
| 85 | expr ⚠️ | 4 paychecks on plan |
| 85 | call:assert ⚠️ | …and counts up |
| 86 | call:assert ⚠️ | an off-plan cycle → nothing to say |
| 90 | other ⚠️ | cycleHistory |
| 91 | expr ⚠️ | 2 paychecks on plan |
| 91 | call:assert ⚠️ | legacy snapshots with no `allRequiredMet` count as on-plan |

### `apps/rn/src/store/planSelectors.ts`

| line | origin | string |
|---|---|---|
| 16 | array ⚠️ | minimum_debt |
| 16 | array ⚠️ | autopay_expense |
| 16 | array ⚠️ | autopay_debt |
| 41 | call:sumCategory ⚠️ | starter_emergency |
| 41 | call:sumCategory ⚠️ | optional_goal |
| 49 | call:sumCategory ⚠️ | starter_emergency |
| 49 | call:sumCategory ⚠️ | optional_goal |
| 57 | expr ⚠️ | starter_emergency |
| 57 | expr ⚠️ | optional_goal |
| 79 | call:sumCategory ⚠️ | discovery_holdback |
| 79 | call:sumCategory ⚠️ | prefunded_reserve |
| 96 | expr ⚠️ | Unable to estimate |
| 128 | expr ⚠️ | autopay_expense |
| 135 | expr ⚠️ | autopay_expense |
| 135 | expr ⚠️ | autopay_debt |
| 145 | expr ⚠️ | autopay_expense |
| 149 | expr ⚠️ | minimum_debt |
| 149 | expr ⚠️ | autopay_debt |
| 162 | key:category ⚠️ | minimum_debt |
| 211 | expr ⚠️ | autopay_expense |
| 247 | key:title ⚠️ | Overdue |
| 248 | key:title ⚠️ | Due this week |
| 249 | key:title ⚠️ | Due next week |
| 250 | key:title ⚠️ | Later this cycle |
| 251 | key:title ⚠️ | Handled |
| 270 | other ⚠️ | no-paycheck |
| 270 | other ⚠️ | no-debts |
| 270 | other ⚠️ | debt-free |
| 274 | return ⚠️ | no-paycheck |
| 276 | expr ⚠️ | debt-free |
| 276 | expr ⚠️ | no-debts |
| 280 | other ⚠️ | on-track |
| 306 | key:label ⚠️ | to debt this paycheck |
| 308 | key:label ⚠️ | to your emergency fund |
| 309 | call:sumCategory ⚠️ | optional_goal |
| 310 | key:label ⚠️ | to your goals |
| 311 | key:label ⚠️ | cushion this paycheck |
| 323 | other ⚠️ | cushionStatus |
| 337 | expr ⚠️ | on-track |

### `apps/rn/src/store/projectedIncome.test.ts`

| line | origin | string |
|---|---|---|
| 32 | call:console.log ⚠️ | Running valley-into-forecast (2.4.7.2) tests... |
| 34 | call:check ⚠️ | fixed income → the entered amount |
| 35 | call:check ⚠️ | variable + lean set → the LEAN (the valley reaches the forecast) |
| 36 | call:check ⚠️ | variable + no lean yet → falls back to the entered amount (never projects $0) |
| 37 | call:check ⚠️ | fixed income ignores a stray leanAmount |
| 38 | call:check ⚠️ | non-numeric amount → 0 (guarded) |
| 44 | call:console.log ⚠️ | ✅ valley-into-forecast (2.4.7.2) tests passed. |

### `apps/rn/src/store/proofOfWork.test.ts`

| line | origin | string |
|---|---|---|
| 42 | call:console.log ⚠️ | Running Guardian proof-of-work (3.3.3.1) tests... |
| 46 | call:assert ⚠️ | premium with history → a proof-of-work read |
| 50 | call:assert ⚠️ | the scorecard is carried for the trust line |
| 52 | call:assert ⚠️ | free → null (the automation is the premium job) |
| 53 | call:assert ⚠️ | no history → null |
| 57 | call:assert ⚠️ | an unconfirmed most-recent cycle → streak 0 (honest) |

### `apps/rn/src/store/recoverySelectors.test.ts`

| line | origin | string |
|---|---|---|
| 33 | key:name ⚠️ | Rent |
| 34 | key:name ⚠️ | Netflix |
| 34 | key:category ⚠️ | subscriptions |
| 35 | key:name ⚠️ | Music |
| 35 | key:category ⚠️ | subscriptions |
| 37 | key:name ⚠️ | Card |
| 44 | call:console.log ⚠️ | Running Recovery Plan (2.6.4) tests... |
| 47 | call:eq ⚠️ | no shortfall → null |
| 51 | call:assert ⚠️ | shortfall → a plan |
| 53 | call:eq ⚠️ | gap = the allocation shortfall (896 − 850) |
| 54 | call:eq ⚠️ | card,rent |
| 54 | call:eq ⚠️ | cover-now = essentials (rent) + the debt minimum |
| 55 | call:eq ⚠️ | debt minimum is essential (cover-now), amount = the minimum |
| 56 | call:eq ⚠️ | music,netflix |
| 56 | call:eq ⚠️ | safe-to-defer = deferrable, ranked largest-first (music 30, netflix 16) |
| 57 | call:eq ⚠️ | music,netflix |
| 57 | call:eq ⚠️ | both needed to cross the $46 gap |
| 58 | call:eq ⚠️ | deferrable 46 ≥ gap 46 → closeable |
| 59 | call:eq ⚠️ | closeable → no residual |
| 66 | key:name ⚠️ | Rent |
| 67 | key:name ⚠️ | Netflix |
| 67 | key:category ⚠️ | subscriptions |
| 68 | key:name ⚠️ | Music |
| 68 | key:category ⚠️ | subscriptions |
| 71 | call:assert ⚠️ | a deferability override moves an essential-category bill to safe-to-defer |
| 72 | call:assert ⚠️ | …and the overridden rent leaves cover-now |
| 77 | key:name ⚠️ | Rent |
| 78 | key:name ⚠️ | Misc |
| 81 | call:assert ⚠️ | an `other` bill defaults to essential (cover-now), never safe-to-defer |
| 82 | call:assert ⚠️ | …and is not offered for deferral |
| 87 | key:name ⚠️ | Rent |
| 88 | key:name ⚠️ | Streaming |
| 88 | key:category ⚠️ | subscriptions |
| 91 | call:assert ⚠️ | an autopay subscription is excluded from safe-to-defer (the charge fires regardless) |
| 92 | call:assert ⚠️ | …and lands in cover-now instead |
| 99 | call:eq ⚠️ | deferExpense → due date moves to next payday |
| 100 | call:eq ⚠️ | after deferring music ($30) → gap shrinks 46 → 16 |
| 102 | call:eq ⚠️ | after deferring netflix too → gap closed, recovery clears |
| 110 | call:eq ⚠️ | setDeferability sets the override |
| 111 | call:eq ⚠️ | …without re-stamping read-freshness (stale stays stale) |
| 121 | key:id ⚠️ | purchase-1 |
| 121 | key:name ⚠️ | New couch |
| 121 | other ⚠️ | one-time |
| 125 | other ⚠️ | discretionary |
| 129 | expr ⚠️ | purchase-1 |
| 129 | call:assert ⚠️ | A3.7 — an applied purchase is offered as safe-to-defer |
| 130 | expr ⚠️ | purchase-1 |
| 130 | call:assert ⚠️ | …and is not filed as cover-now beside the rent |
| 137 | expr ⚠️ | purchase-1 |
| 137 | call:assert ⚠️ | …while an UNcategorized one-off is still essential (the unknown-default guard stands) |

### `apps/rn/src/store/sandboxBeats.test.ts`

| line | origin | string |
|---|---|---|
| 39 | call:console.log ⚠️ | 3.5.0.4 — sandbox beats (scripted paydays · absorb · release)... |
| 45 | call:eq ⚠️ | one beat = one genuine cycle lived |
| 46 | call:assert ⚠️ | …and the scripted today advances to the next payday |
| 47 | call:assert ⚠️ | …with the safety net still held this early |
| 48 | call:eq ⚠️ | …and no release yet (the gate has not been crossed) |
| 53 | call:assert ⚠️ | scripted paydays DO reach the safety-net release (the arc's payoff) |
| 57 | call:eq ⚠️ | …because the discovery gate genuinely retired — not because a flag was set |
| 59 | call:assert ⚠️ | …and it lands at the real gate, not before it |
| 65 | call:assert ⚠️ | the surprise beat records a REAL outflow |
| 67 | call:assert ⚠️ | a tapped run still reaches the release |
| 68 | call:eq ⚠️ | …and the ack knows the net was actually drawn on |
| 69 | call:assert ⚠️ | …crediting what it genuinely covered |
| 74 | call:assert ⚠️ | an untapped run reaches the release as well |
| 75 | call:eq ⚠️ | …on the neutral branch (nothing drew on it) |
| 76 | call:eq ⚠️ | …claiming nothing covered |
| 82 | call:eq ⚠️ | the demo still caps at one genuine cycle |
| 86 | call:eq ⚠️ | …so its safety net can never mature away, however many beats run |
| 88 | call:assert ⚠️ | …and the demo NEVER reaches a release |
| 92 | call:assert ⚠️ | a raised ceiling still cannot build a multi-cycle history |
| 93 | call:assert ⚠️ | …nor accumulate lean confirmations |
| 98 | call:assert ⚠️ | a scripted sequence is byte-identical across runs |
| 109 | call:eq ⚠️ | the story opens on a clear paycheck |
| 111 | expr ⚠️ | at-risk |
| 112 | call:assert ⚠️ | …and three scripted paydays never leave the taught plan at risk |
| 116 | call:assert ⚠️ | …with nothing left flagged as a failed/unattended obligation |

### `apps/rn/src/store/sandboxHarness.test.ts`

| line | origin | string |
|---|---|---|
| 35 | call:console.log ⚠️ | 3.5.0.7 — sandbox harness seam (scenario selection · read-only snapshot)... |
| 38 | call:assert ⚠️ | every named state is addressable by a harness id |
| 44 | call:eq ⚠️ | an unknown id resolves to null (caller keeps its own default) |
| 45 | call:eq ⚠️ | no request → null, so a real user build is unaffected |
| 48 | call:resolveScenario ⚠️ | persona-clear |
| 49 | call:eq ⚠️ | the harness can request the tutorial ceiling |
| 53 | call:eq ⚠️ | with nothing requested, the harness imposes no scenario |
| 54 | key:scenarioId ⚠️ | persona-at-risk |
| 55 | call:eq ⚠️ | persona-at-risk |
| 55 | call:eq ⚠️ | a requested scenario is handed back to the tutorial |
| 59 | call:publishSandbox ⚠️ | persona-clear |
| 62 | call:eq ⚠️ | the snapshot reads the sandbox's real floor |
| 66 | call:eq ⚠️ | …and tracks it live (a test sees what the interaction actually did) |
| 72 | call:assert ⚠️ | the harness exposes ONLY selection + snapshot — no store actions to fake a state with |
| 76 | call:eq ⚠️ | unpublishing clears it (no snapshot outlives its sandbox) |

### `apps/rn/src/store/sandboxScenarios.test.ts`

| line | origin | string |
|---|---|---|
| 53 | key:name ⚠️ | My card |
| 60 | call:console.log ⚠️ | 3.5.0.3 — sandbox scenarios (named states · personal seed · determinism)... |
| 66 | key:'at-risk' ⚠️ | at-risk |
| 66 | call:personaScenario ⚠️ | at-risk |
| 74 | other ⚠️ | at-risk |
| 77 | call:assert ⚠️ | clear leaves more cushion than tight |
| 78 | call:assert ⚠️ | tight leaves more cushion than at-risk |
| 79 | call:assert ⚠️ | at-risk is genuinely SHORT (a real gap for Recovery to solve) |
| 80 | call:assert ⚠️ | clear has no shortfall |
| 85 | call:eq ⚠️ | the clear scenario reads as clear to the real engine |
| 86 | call:eq ⚠️ | the tight scenario reads as TIGHT to the real engine |
| 87 | call:eq ⚠️ | at-risk |
| 87 | call:eq ⚠️ | the at-risk scenario reads as at-risk to the real engine |
| 101 | call:eq ⚠️ | personal: the user's real paycheck carries over |
| 102 | call:eq ⚠️ | personal: …and their real cadence, not the base default |
| 108 | call:eq ⚠️ | personal: next payday is re-derived from THEIR cadence (not the base biweekly) |
| 110 | call:eq ⚠️ | My card |
| 110 | call:eq ⚠️ | personal: their real debt carries over |
| 111 | call:assert ⚠️ | personal: bills are filled in from the persona (onboarding captures none) |
| 114 | call:assert ⚠️ | personal: a thin real plan still produces a Guardian read |
| 118 | call:assert ⚠️ | personal: with no debts entered, the persona supplies one |
| 122 | call:id.startsWith ⚠️ | persona- |
| 122 | call:assert ⚠️ | personal: no usable income falls back to the persona |
| 124 | call:id.startsWith ⚠️ | persona- |
| 124 | call:assert ⚠️ | personal: a non-numeric income falls back too (no NaN plan) |
| 127 | call:id.startsWith ⚠️ | persona- |
| 127 | call:assert ⚠️ | scenarioFor(null) → persona |
| 128 | call:id.startsWith ⚠️ | personal- |
| 128 | call:assert ⚠️ | scenarioFor(store) → personal |
| 157 | call:assert ⚠️ | re-seeding a scenario restores it exactly |
| 165 | call:personaScenario ⚠️ | at-risk |
| 166 | call:eq ⚠️ | a scenario can be scripted FREE (the demo contrast) |
| 176 | call:eq ⚠️ | the arc ends on a clear card, not a scary one |
| 177 | expr ⚠️ | at-risk |
| 177 | call:assert ⚠️ | the arc does show trouble somewhere (the Recovery glimpse) |
| 181 | other ⚠️ | at-risk |
| 182 | call:assert ⚠️ | the at-risk scenario has something the Recovery plan can offer to defer |
| 185 | call:eq ⚠️ | a beat with no declared state leaves the stage untouched |
| 186 | call:scenarioForBeat ⚠️ | at-risk |
| 186 | call:personaScenario ⚠️ | at-risk |
| 186 | call:eq ⚠️ | a declared state stages that state |
| 191 | key:pinned ⚠️ | at-risk |
| 191 | call:eq ⚠️ | persona-at-risk |
| 191 | call:eq ⚠️ | a harness pin overrides the beat state |
| 192 | call:scenarioForBeat ⚠️ | at-risk |
| 192 | call:eq ⚠️ | persona-clear |
| 192 | call:eq ⚠️ | …in both directions |
| 193 | key:pinned ⚠️ | at-risk |
| 193 | call:eq ⚠️ | …but a stateless beat still stages nothing |
| 196 | call:scenarioForBeat ⚠️ | at-risk |
| 199 | call:scenarioForBeat ⚠️ | at-risk |
| 200 | call:eq ⚠️ | stepping away and back re-stages byte-identical state |

### `apps/rn/src/store/sandboxScenarios.ts`

| line | origin | string |
|---|---|---|
| 32 | other ⚠️ | at-risk |
| 75 | key:clear ⚠️ | A clear payday |
| 76 | key:tight ⚠️ | A tight payday |
| 77 | key:'at-risk' ⚠️ | at-risk |
| 77 | key:'at-risk' ⚠️ | A short payday |
| 100 | key:name ⚠️ | Utilities |
| 101 | key:name ⚠️ | Car insurance |
| 102 | key:name ⚠️ | Internet |
| 103 | key:name ⚠️ | Phone |
| 114 | key:name ⚠️ | Subscriptions |
| 114 | key:category ⚠️ | subscriptions |
| 137 | key:id ⚠️ | sbx-card |
| 137 | key:name ⚠️ | Credit card |
| 138 | key:id ⚠️ | sbx-auto |
| 138 | key:name ⚠️ | Car loan |
| 139 | key:id ⚠️ | sbx-store |
| 139 | key:name ⚠️ | Store card |
| 154 | key:id ⚠️ | sbx-groceries |
| 154 | key:name ⚠️ | Groceries |
| 155 | key:id ⚠️ | sbx-gas |
| 155 | key:name ⚠️ | Gas |
| 160 | key:id ⚠️ | sbx-ef |
| 160 | key:name ⚠️ | Emergency fund |
| 193 | expr ⚠️ | at-risk |
| 351 | array ⚠️ | at-risk |

### `apps/rn/src/store/sandboxStore.test.ts`

| line | origin | string |
|---|---|---|
| 60 | key:id ⚠️ | test-clear |
| 61 | key:label ⚠️ | Test — a clear cycle |
| 70 | key:name ⚠️ | Card |
| 87 | call:console.log ⚠️ | 3.5.0.1 — sandbox store (determinism + isolation)... |
| 91 | call:eq ⚠️ | the factory brands its instance as a sandbox |
| 92 | call:eq ⚠️ | the real appStore singleton is NOT a sandbox |
| 93 | call:eq ⚠️ | a bare createDebtStore() is NOT a sandbox |
| 99 | call:eq ⚠️ | a neutered hydrate() never reads the adapter |
| 100 | call:eq ⚠️ | a neutered save() never writes the adapter |
| 106 | call:eq ⚠️ | bootstrapPersistence(adapter, sandbox) writes NOTHING, even after a mutation |
| 111 | call:eq ⚠️ | startWidgetSync refuses a sandbox (scripted money never reaches the widget) |
| 115 | call:assert ⚠️ | …while a NON-sandbox store still mirrors normally |
| 121 | call:eq ⚠️ | startLiveActivitySync refuses a sandbox before it even asks the bridge |
| 124 | call:eq ⚠️ | a sandbox never sets prefs.isDemoMode (isolation is structural, not a flag) |
| 129 | key:id ⚠️ | sandbox-only |
| 130 | key:name ⚠️ | Tutorial card |
| 138 | call:assert ⚠️ | sandbox mutations leave the real appStore identity untouched |
| 139 | call:eq ⚠️ | …and add no debt to the real plan |
| 140 | call:eq ⚠️ | …while the sandbox itself did take the debt |
| 144 | call:eq ⚠️ | createSandboxBase pins currentDate to the frozen base date |
| 145 | call:eq ⚠️ | …and pins inputsAsOf to it (no live-clock read-freshness) |
| 149 | call:eq ⚠️ | …and derives nextPaycheckDate from the frozen date, not today |
| 156 | call:assert ⚠️ | two sandboxes from one scenario open byte-identical |
| 161 | call:assert ⚠️ | a driven sandbox diverges |
| 165 | call:assert ⚠️ | re-seeding restores the exact opening state (replay is byte-deterministic) |
| 167 | call:eq ⚠️ | …and leaves the sandbox hydrated (the shipped isHydrated gates pass) |
| 168 | call:eq ⚠️ | …with transient Undo state cleared |
| 179 | call:eq ⚠️ | completeOnboarding anchors drift to the FROZEN base date, not the real today |
| 185 | call:assert ⚠️ | a scripted rollover keeps the frozen anchor (no wall-clock leak into a driven sandbox) |
| 189 | key:id ⚠️ | test-later |
| 195 | call:eq ⚠️ | re-seeding to another base date re-points the frozen clock |
| 204 | call:assert ⚠️ | a NON-sandbox store still anchors to the real wall clock (default behavior unchanged) |
| 215 | call:eq ⚠️ | 8 scripted rollovers cannot push genuineCycleCount past the cap |
| 216 | call:assert ⚠️ | …nor build a multi-cycle cycleHistory |
| 217 | call:assert ⚠️ | …nor accumulate lean confirmations |
| 218 | call:eq ⚠️ | …and "day one" never drifts off the frozen base date |
| 219 | call:eq ⚠️ | …and the read never ages into a staleness hedge |
| 225 | call:eq ⚠️ | the discovery holdback is STILL active after 8 rollovers (the safety net cannot mature away) |
| 232 | call:assert ⚠️ | the proof-of-work strip cannot announce a multi-paycheck held streak on a day-one demo |
| 241 | call:eq ⚠️ | the Progress hero cannot announce an on-plan streak on a day-one demo either |
| 247 | key:id ⚠️ | test-variable |
| 258 | call:eq ⚠️ | variable income: the cold-start holdback also survives 8 rollovers (leanConfirms capped) |
| 264 | key:id ⚠️ | test-matured-seed |
| 268 | other ⚠️ | cycleHistory |
| 274 | call:eq ⚠️ | a scenario cannot SEED a matured Guardian past the ceiling either |
| 282 | call:eq ⚠️ | a direct sandbox.setState is bounded too (every write door goes through the ceiling) |
| 289 | call:eq ⚠️ | a NON-sandbox store is NOT bounded (real maturity is untouched) |
| 293 | call:assert ⚠️ | the shipped Guardian selector produces a real read off the sandbox |
| 295 | call:eq ⚠️ | …and the real setCushionFloor clamp applies (no forked logic) |
| 300 | call:eq ⚠️ | the sandbox floor snaps to $25 exactly as the real app does |
| 303 | call:eq ⚠️ | …while the user's REAL cushion line never moves |

### `apps/rn/src/store/sandboxStore.ts`

| line | origin | string |
|---|---|---|
| 222 | expr ⚠️ | Replay and the tutorial e2e depend on it being deterministic; check for a clock or random read. |

### `apps/rn/src/store/steadyStateProjection.test.ts`

| line | origin | string |
|---|---|---|
| 33 | key:name ⚠️ | Card |
| 40 | call:console.log ⚠️ | Running steady-state projection (MF.4) tests... |
| 45 | call:assert ⚠️ | both allocations resolve |
| 52 | call:assert ⚠️ | steady-state recovers the bulk of the temporary discovery hold |
| 57 | call:assert ⚠️ | a debt-free date is projected off the steady-state deploy |
| 65 | call:assert ⚠️ | both projection surfaces produce a date |
| 71 | call:assert ⚠️ | established user: steady == dampened (no temporary reserve to strip) |

### `apps/rn/src/store/store.ts`

| line | origin | string |
|---|---|---|
| 55 | other ⚠️ | payday-landed |
| 55 | other ⚠️ | log-payment |
| 223 | call:adapter.quarantine ⚠️ | migration-failed |
| 465 | key:kind ⚠️ | payday-landed |
| 476 | key:kind ⚠️ | log-payment |

### `apps/rn/src/store/storeActions.test.ts`

| line | origin | string |
|---|---|---|
| 47 | key:name ⚠️ | Card |
| 49 | key:name ⚠️ | Emergency Fund |
| 64 | call:console.log ⚠️ | Running store-action (RS.3) tests... |
| 71 | call:eq ⚠️ | capture (fixed, no actuals) → 1 income-actual logged |
| 72 | call:eq ⚠️ | …actual defaults to the planned amount |
| 73 | call:eq ⚠️ | …keyed to this cycle |
| 76 | call:eq ⚠️ | capture with a reported actual → records it |
| 79 | call:eq ⚠️ | capture missed → NO income-actual (not a low-earning cycle) |
| 80 | call:assert ⚠️ | …recorded on the arrival axis instead |
| 82 | other ⚠️ | surpriseOutflowLog |
| 83 | call:eq ⚠️ | capture with a surprise outflow → logged |
| 84 | other ⚠️ | surpriseOutflowLog |
| 85 | call:eq ⚠️ | non-positive outflow → ignored (no crash) |
| 89 | call:eq ⚠️ | re-capture same cycle → replaces, still 1 entry |
| 90 | call:eq ⚠️ | …with the corrected value |
| 94 | call:eq ⚠️ | variable income, no actual → skipped |
| 99 | key:label ⚠️ | Snowball |
| 104 | call:eq ⚠️ | rollover advances currentDate to the old payday |
| 105 | call:assert ⚠️ | …and advances nextPaycheckDate |
| 106 | call:eq ⚠️ | …increments the genuine-cycle counter |
| 107 | call:eq ⚠️ | …clears the one-time windfall |
| 108 | call:eq ⚠️ | …resets completed actions for the new cycle |
| 109 | call:eq ⚠️ | …appends a closing-cycle snapshot |
| 113 | call:eq ⚠️ | double rollover → counter advances again (no crash) |
| 114 | call:eq ⚠️ | …second snapshot appended |
| 122 | call:assert ⚠️ | declareMissedPaycheck → marks THIS cycle |
| 124 | call:eq ⚠️ | …idempotent (declaring twice keeps one) |
| 126 | call:eq ⚠️ | undoMissedPaycheck → clears it |
| 133 | call:eq ⚠️ | applyLeanSuggestion → sets the lean floor |
| 134 | call:eq ⚠️ | …and clears any prior dismissal |
| 136 | call:eq ⚠️ | dismissLeanSuggestion → records the dismissed value |
| 144 | call:eq ⚠️ | applyTightTopUp → draws the amount from the goal |
| 145 | call:eq ⚠️ | …records the cycle top-up |
| 146 | call:eq ⚠️ | …keyed to this cycle |
| 148 | call:eq ⚠️ | repeat top-up same cycle → accumulates |
| 151 | call:eq ⚠️ | over-draw → goal clamped at 0 (never negative) |
| 164 | call:assert ⚠️ | A3.5 — an applied top-up is exposed as a reversible record |
| 165 | call:eq ⚠️ | …naming the goal it drew from |
| 166 | call:eq ⚠️ | …and the amount |
| 170 | call:eq ⚠️ | …undo restores the goal to where it started |
| 171 | call:eq ⚠️ | …and there is nothing left to undo |
| 178 | call:getState().applyRiskNotified ⚠️ | at-risk |
| 178 | call:getState().applyRiskNotified ⚠️ | 2026-07-24T10:00:00Z |
| 179 | call:eq ⚠️ | at-risk |
| 179 | call:eq ⚠️ | applyRiskNotified → stamps the notify-state |
| 180 | call:eq ⚠️ | …appends the push-log timestamp |
| 182 | call:getState().applyRiskNotified ⚠️ | at-risk |
| 183 | call:eq ⚠️ | push-log bounded to 24 (never grows unbounded) |
| 185 | call:eq ⚠️ | acknowledgeRiskCleared → clears the notify-state |
| 192 | call:eq ⚠️ | floor 213 → snapped to the nearest 25 |
| 194 | call:eq ⚠️ | floor above the cap → clamped to 1000 |
| 196 | call:eq ⚠️ | negative floor → clamped to 0 |
| 198 | call:eq ⚠️ | NaN floor → guarded to the 200 default |
| 200 | call:eq ⚠️ | Infinity floor → guarded to 200 |
| 207 | call:eq ⚠️ | negative windfall → clamped to 0 |
| 209 | call:eq ⚠️ | positive windfall → kept |
| 216 | call:eq ⚠️ | verifyDebtBalance → negative clamped to 0 |
| 217 | call:eq ⚠️ | …stamps the confirmation date |
| 218 | call:eq ⚠️ | …and the projection anchor date |
| 220 | call:eq ⚠️ | …fractional cents rounded to 2dp |
| 223 | call:eq ⚠️ | verifyDebtBalances → per-entry clamp |
| 224 | call:eq ⚠️ | …unknown id ignored (no phantom debt) |
| 232 | call:assert ⚠️ | reserve held→free at rollover → a release is pending |
| 233 | call:eq ⚠️ | …no surprise outflow → not tapped |
| 234 | call:assert ⚠️ | selectReserveRelease surfaces it (premium) |
| 235 | call:eq ⚠️ | free tier → no release ack |
| 241 | call:eq ⚠️ | acknowledgeReserveRelease → clears it |
| 244 | other ⚠️ | surpriseOutflowLog |
| 245 | call:eq ⚠️ | a surprise during the hold → tapped |
| 246 | call:eq ⚠️ | …covered = the surprise sum |
| 250 | call:eq ⚠️ | established (no reserve) → no false release |
| 259 | call:assert ⚠️ | discovery hold → a safety net is held |
| 260 | call:assert ⚠️ | attesting bills → a SMALLER (not zero) safety net |
| 263 | call:eq ⚠️ | discovery hold (premium) → the attestation affordance shows |
| 264 | call:eq ⚠️ | free → no attestation affordance |
| 265 | call:eq ⚠️ | …reflects the attested state |
| 279 | call:eq ⚠️ | no above-floor headroom → attesting changes the hold by nothing |
| 280 | call:eq ⚠️ | A3.1 — …so the affordance is WITHHELD, not offered |
| 283 | other ⚠️ | surpriseOutflowLog |
| 284 | call:eq ⚠️ | surprise after attesting → un-attests (restores the full hold) |
| 285 | call:eq ⚠️ | …and flags the walk-back notice |
| 286 | call:eq ⚠️ | selectReserveWalkback surfaces it (premium) |
| 287 | other ⚠️ | surpriseOutflowLog |
| 288 | call:eq ⚠️ | surprise WITHOUT a prior attestation → no walk-back |
| 294 | call:eq ⚠️ | setBillsAttested → sets it |
| 296 | call:eq ⚠️ | acknowledgeReserveWalkback → clears it |
| 307 | key:name ⚠️ | Card |
| 308 | key:name ⚠️ | Power |
| 308 | other ⚠️ | requiredExpenses |
| 312 | call:eq ⚠️ | markDebtMinimumPaid(true) → the minimum reads covered |
| 313 | call:eq ⚠️ | …and clears the reported autopay failure |
| 316 | call:eq ⚠️ | markExpensePaid(true) → the bill reads paid |
| 317 | call:eq ⚠️ | …and clears the reported autopay failure |
| 322 | call:eq ⚠️ | un-marking → no longer covered |
| 323 | call:eq ⚠️ | …and the cleared failure stays cleared |
| 337 | key:name ⚠️ | Power |
| 337 | other ⚠️ | requiredExpenses |
| 340 | call:eq ⚠️ | an UNPAID failed autopay carries its flag forward — never falsely presumed paid |
| 341 | call:eq ⚠️ | …and stays owed across the boundary |
| 348 | call:eq ⚠️ | …but a confirmed one advances CLEAN, so autopay is presumed again next cycle |
| 355 | call:eq ⚠️ | reset → clears entities |
| 356 | call:eq ⚠️ | …and returns to onboarding |
| 357 | call:eq ⚠️ | …staying hydrated |
| 362 | call:throws ⚠️ | runMigrations(null) → throws (caller quarantines) |
| 363 | call:throws ⚠️ | runMigrations(array) → throws |
| 364 | call:throws ⚠️ | runMigrations(string) → throws |
| 367 | key:name ⚠️ | Old |
| 369 | call:eq ⚠️ | partial blob → stamped to the current version |
| 370 | call:eq ⚠️ | …genuineCycleCount backfilled to 0 |
| 371 | call:assert ⚠️ | …missedArrivals backfilled to [] |
| 372 | call:assert ⚠️ | …inputsAsOf backfilled to a date |
| 373 | call:assert ⚠️ | …debt projection dates backfilled |
| 374 | call:eq ⚠️ | …preserves the persisted paycheck amount |
| 378 | call:eq ⚠️ | runMigrations is idempotent (version stable) |
| 379 | call:eq ⚠️ | …fields stable on re-migrate |
| 384 | call:eq ⚠️ | importStore → routes through migration |
| 385 | call:eq ⚠️ | …substrate fields safe, never undefined |
| 394 | call:eq ⚠️ | logManualPayment: balance reduced by the amount |
| 395 | call:eq ⚠️ | …re-anchors the verified date to today |
| 396 | expr ⚠️ | log-payment |
| 396 | call:assert ⚠️ | …sets the log-payment Undo snapshot |
| 399 | call:eq ⚠️ | undoIntentAction: restores the pre-payment balance |
| 400 | call:eq ⚠️ | …clears the rollback |
| 405 | call:eq ⚠️ | logManualPayment: overpay clamps to 0 (never negative) |
| 410 | call:assert ⚠️ | logManualPayment: bad id / non-positive amount → no-op |

### `apps/rn/src/store/storeContext.test.ts`

| line | origin | string |
|---|---|---|
| 31 | call:console.log ⚠️ | 3.5.3.0 — active-store rewire (real plan stays untouched under a sandbox)... |
| 46 | call:assert ⚠️ | the real store blob identity never changed |
| 47 | call:eq ⚠️ | …its cushion floor is untouched |
| 48 | call:eq ⚠️ | …its debts are untouched |
| 49 | call:eq ⚠️ | …and its payday tracking is untouched |
| 52 | call:eq ⚠️ | the sandbox took the floor write |
| 53 | call:eq ⚠️ | …and the payday write |
| 54 | call:eq ⚠️ | …and the prefs write |
| 57 | call:assert ⚠️ | the sandbox is a distinct store instance |
| 60 | call:eq ⚠️ | any non-singleton instance is likewise isolated |

### `apps/rn/src/store/StoreContext.tsx`

| line | origin | string |
|---|---|---|
| 32 | array ⚠️ | tutorialStep |
| 32 | array ⚠️ | tutorialSeen |
| 143 | other ⚠️ | Real store mutated while a sandbox subtree was mounted |
| 144 | key:seam ⚠️ | StoreProvider |
| 145 | key:hint ⚠️ | a component inside the subtree is still writing via appStore instead of useActiveStore() |

### `apps/rn/src/store/substrateProducers.test.ts`

| line | origin | string |
|---|---|---|
| 41 | call:console.log ⚠️ | Running 2.4.D.3 substrate-producer tests... |
| 44 | call:check ⚠️ | stampInputsFresh sets inputsAsOf to currentDate |
| 47 | call:check ⚠️ | incrementGenuineCycle bumps the count |
| 51 | call:check ⚠️ | recordMissedArrival appends the cycle date |
| 52 | call:check ⚠️ | recordMissedArrival is idempotent per cycle |
| 56 | call:check ⚠️ | fixed income → actual defaults to planned (paycheck.amount) |
| 59 | call:check ⚠️ | variable income with NO reported actual → skipped (no fabricated actual) |
| 62 | call:check ⚠️ | variable income with a reported actual → recorded (1650 vs planned 2000) |
| 65 | call:check ⚠️ | windfall is EXCLUDED from the recorded actual |
| 68 | other ⚠️ | currentCyclePrediction |
| 72 | call:check ⚠️ | planned comes from the stamped prediction when present |
| 75 | call:check ⚠️ | re-capture for the same cycle REPLACES (no duplicate) |
| 78 | call:check ⚠️ | missed=true routes to the arrival axis, NOT a $0 income-actual |
| 81 | key:note ⚠️ | car repair |
| 82 | call:check ⚠️ | recordSurpriseOutflow appends a positive outflow |
| 83 | call:check ⚠️ | recordSurpriseOutflow ignores a non-positive amount |
| 87 | call:check ⚠️ | stampOnboardedAt sets onboardedAt to currentDate when null |
| 88 | call:check ⚠️ | stampOnboardedAt does NOT overwrite an existing stamp |
| 90 | call:console.log ⚠️ | ✅ All 2.4.D.3 substrate-producer tests passed. |

### `apps/rn/src/store/tutorialPath.test.ts`

| line | origin | string |
|---|---|---|
| 37 | call:console.log ⚠️ | 3.5.2 — tutorial path (stepping · skip · interrupt-resume · announcements)... |
| 40 | call:assert ⚠️ | the arc has steps |
| 41 | call:assert ⚠️ | the arc stays within its ≤7-beat budget |
| 42 | call:eq ⚠️ | every step id is unique (resume keys off it) |
| 43 | call:assert ⚠️ | every step has a title AND body (nothing renders blank) |
| 46 | call:eq ⚠️ | Back on the first step stays put (never negative) |
| 47 | call:eq ⚠️ | Next on the last step stays put (never past the end) |
| 48 | call:eq ⚠️ | Next advances |
| 49 | call:eq ⚠️ | Back retreats |
| 50 | call:eq ⚠️ | the last step is recognised (so it shows Finish, not Next) |
| 51 | call:eq ⚠️ | the first step is not the last |
| 56 | call:eq ⚠️ | stepping forward reaches the final beat (no unreachable step) |
| 59 | call:eq ⚠️ | no saved point → start at the beginning |
| 60 | call:eq ⚠️ | undefined → start at the beginning |
| 61 | call:eq ⚠️ | a valid saved point resumes exactly there |
| 62 | call:eq ⚠️ | resuming ON the last step is allowed |
| 64 | call:eq ⚠️ | a saved point past the end restarts rather than dead-ending |
| 65 | call:eq ⚠️ | …however far past |
| 66 | call:eq ⚠️ | a negative saved point restarts |
| 67 | call:eq ⚠️ | a corrupt (NaN) saved point restarts |
| 68 | call:eq ⚠️ | a fractional saved point floors to a real step |
| 72 | call:first.startsWith ⚠️ | Step 1 of |
| 72 | call:assert ⚠️ | the announcement leads with POSITION (no progress dots to glance at) |
| 77 | call:stepAnnouncement(s).includes ⚠️ | Example money |
| 79 | call:assert ⚠️ | …then the step title |
| 80 | call:assert ⚠️ | …then the body, so nothing is spoken-only-visually |
| 84 | call:eq ⚠️ | an out-of-range step announces nothing rather than throwing |
| 91 | call:assert ⚠️ | the finale says something different to each audience |
| 97 | call:assert ⚠️ | …naming, to a FREE user, that premium is what did it ([D9] rests on this) |
| 98 | call:assert ⚠️ | …and never selling premium to someone who already pays for it |
| 101 | call:assert ⚠️ | …the cushion held at your line |
| 102 | call:assert ⚠️ | …the extra held while it learns your bills |
| 103 | call:assert ⚠️ | …the catch-up plan when a paycheck is short |
| 104 | call:assert ⚠️ | the free announcement carries the free body |
| 105 | call:assert ⚠️ | the premium announcement carries the premium body |
| 106 | call:eq ⚠️ | a beat with no per-audience copy reads the same to everyone |
| 114 | call:join ⚠️ | ../components/plan/TutorialOverlay.tsx |
| 115 | call:assert ⚠️ | TutorialOverlay CALLS stepAnnouncement (a beat with no announcement is silent to VoiceOver) |
| 116 | call:assert ⚠️ | …through `announce`, so the utterance actually reaches the platform |

### `apps/rn/src/store/tutorialPath.ts`

| line | origin | string |
|---|---|---|
| 108 | key:title ⚠️ | Money set aside first |
| 108 | key:body ⚠️ | Every payday, your Guardian keeps a cushion back before anything extra goes to your debt. |
| 108 | key:target ⚠️ | guardian-card |
| 113 | key:title ⚠️ | Where this paycheck went |
| 113 | key:body ⚠️ | After your bills and minimums, this is what was left — held back as your cushion and safety net, or sent to your debt. |
| 113 | key:target ⚠️ | guardian-bar |
| 119 | key:title ⚠️ | Your line |
| 120 | key:body ⚠️ | This is the least you want to keep. Open it and move the line — the whole plan re-solves around it. |
| 121 | key:target ⚠️ | guardian-adjust |
| 123 | key:coach ⚠️ | Drag the line, then Save — your plan re-solves around it. |
| 130 | key:title ⚠️ | A little extra, at first |
| 139 | key:body ⚠️ | While your Guardian is learning your bills it holds a bit more back. Tell it your bills are all in and it holds less — and if a surprise proves otherwise, it puts the net straight back. |
| 140 | key:target ⚠️ | guardian-reserve |
| 141 | key:payoffTarget ⚠️ | today-ack |
| 149 | key:title ⚠️ | When it won't stretch |
| 149 | key:body ⚠️ | Some paychecks come up short. Your Guardian works out what has to be covered now, and what can safely wait. |
| 149 | key:target ⚠️ | guardian-card |
| 149 | key:state ⚠️ | at-risk |
| 155 | key:title ⚠️ | Always your call |
| 155 | key:body ⚠️ | Your Guardian suggests — it never moves your money. Every number here stays yours to overrule, once this tour is done. |
| 155 | key:target ⚠️ | guardian-card |
| 160 | key:title ⚠️ | Over to your plan |
| 161 | key:body ⚠️ | That was example money. This is your own paycheck, and your Guardian is already watching it. |
| 169 | key:premium ⚠️ | That was example money — your Guardian does exactly this with every paycheck you add, all on your device. Your debts live in Money, your progress in Progress. |
| 183 | key:free ⚠️ | That was example money — premium is what did the holding: your cushion kept at your line, a little extra held while it learns your bills, and a catch-up plan when a paycheck comes up short. Your own plan is next — your debts live in Money, your progress in Progress. |
| 185 | key:target ⚠️ | guardian-card |

### `apps/rn/src/store/tutorialSelectors.test.ts`

| line | origin | string |
|---|---|---|
| 33 | call:console.log ⚠️ | 3.5.1 — tutorial invitation matrix (who gets offered, and which run)... |
| 36 | call:eq ⚠️ | new PREMIUM user is offered the premium run |
| 37 | call:eq ⚠️ | new FREE user is offered the free run |
| 42 | call:eq ⚠️ | an existing v1.6 user IS offered it (the old intro flag does not gate it) |
| 46 | call:eq ⚠️ | a free→premium upgrader is re-offered the PREMIUM run |
| 51 | call:eq ⚠️ | an upgrader is offered the FINALE, not the whole arc |
| 56 | call:eq ⚠️ | a first-run premium user gets the whole arc, not the finale |
| 60 | call:eq ⚠️ | a free user who saw the free run is not re-offered |
| 61 | call:eq ⚠️ | a premium user who saw the premium run is not re-offered |
| 63 | call:eq ⚠️ | a lapsed premium user is not offered the free run |
| 65 | call:eq ⚠️ | never offered before onboarding completes |
| 68 | call:eq ⚠️ | seeing the free run records it |
| 72 | call:eq ⚠️ | a recorded PREMIUM run is never downgraded to free |
| 74 | call:eq ⚠️ | the run follows the tier |
| 80 | call:eq ⚠️ | an upgraded v5 blob backfills tutorialSeen to null (→ eligible) |
| 81 | call:eq ⚠️ | …so the migrated user IS offered the tutorial |

### `apps/rn/src/store/tutorialSession.ts`

| line | origin | string |
|---|---|---|
| 178 | key:name ⚠️ | tutorial_started |
| 261 | key:name ⚠️ | tutorial_completed |
| 262 | key:name ⚠️ | tutorial_skipped |

### `apps/rn/src/store/windfallSplit.test.ts`

| line | origin | string |
|---|---|---|
| 28 | key:name ⚠️ | Card |
| 29 | key:name ⚠️ | Emergency fund |
| 30 | key:name ⚠️ | Living |
| 37 | call:console.log ⚠️ | Running Windfall Autopilot split (VIS-6) tests... |
| 41 | call:assert ⚠️ | $1000 windfall yields a split |
| 45 | call:assert ⚠️ | rows are whole dollars |
| 46 | call:assert ⚠️ | this scenario routes across multiple buckets |
| 47 | call:assert ⚠️ | part lands in the emergency fund |
| 48 | call:assert ⚠️ | part lands as extra to debt |
| 49 | call:assert ⚠️ | no near-zero noise buckets (whole-dollar, ≥$1) |
| 54 | call:assert ⚠️ | when the base already covers the EF, the windfall goes to debt |
| 61 | call:assert ⚠️ | C1: a windfall on an absorbed/tight plan still yields a NON-empty split |
| 62 | call:assert ⚠️ | C1: absorbed windfall still sums EXACTLY to the amount |
| 63 | call:assert ⚠️ | C1: absorbed dollars are attributed to bills |
| 69 | call:assert ⚠️ | R2-T1: missed-paycheck windfall still yields a non-empty split |
| 70 | call:assert ⚠️ | R2-T1: missed-paycheck windfall sums exactly |
| 76 | key:name ⚠️ | Emergency fund |
| 80 | call:assert ⚠️ | T1: with no debts + EF full, the windfall lands as spare cash |
| 81 | call:assert ⚠️ | T1: cash-landing windfall sums exactly |
| 84 | call:assert ⚠️ | ordered largest-first (bills excepted) |
| 87 | call:assert ⚠️ | zero amount → null |
| 88 | call:assert ⚠️ | negative amount → null |
| 90 | call:assert ⚠️ | no positive paycheck → null (no plan to route into) |

### `apps/rn/src/theme/colors.ts`

| line | origin | string |
|---|---|---|
| 27 | key:light ⚠️ | #e6ebf3 |
| 27 | key:dark ⚠️ | #07111f |
| 28 | key:light ⚠️ | #ffffff |
| 29 | key:light ⚠️ | #dce4f0 |
| 29 | key:dark ⚠️ | #0d1830 |
| 30 | key:light ⚠️ | #ffffff |
| 30 | key:dark ⚠️ | #1a2a49 |
| 31 | key:light ⚠️ | rgba(255,255,255,0.72) |
| 31 | key:dark ⚠️ | rgba(20,35,64,0.82) |
| 32 | key:light ⚠️ | rgba(11,26,56,0.45) |
| 32 | key:dark ⚠️ | rgba(0,0,0,0.55) |
| 37 | key:light ⚠️ | #111a2e |
| 37 | key:dark ⚠️ | #f3f8ff |
| 38 | key:light ⚠️ | #5a6b82 |
| 38 | key:dark ⚠️ | #a6b9d4 |
| 41 | key:light ⚠️ | #68758b |
| 41 | key:dark ⚠️ | #8496b2 |
| 42 | key:light ⚠️ | #ffffff |
| 42 | key:dark ⚠️ | #0f172a |
| 43 | key:light ⚠️ | #ffffff |
| 43 | key:dark ⚠️ | #08111f |
| 48 | key:light ⚠️ | #2f66ea |
| 48 | key:dark ⚠️ | #5b9dff |
| 49 | key:light ⚠️ | #e6effc |
| 49 | key:dark ⚠️ | #14264c |
| 50 | key:light ⚠️ | #0f172a |
| 50 | key:dark ⚠️ | #5b9dff |
| 51 | key:light ⚠️ | #12a150 |
| 51 | key:dark ⚠️ | #43d17f |
| 52 | key:light ⚠️ | #b45309 |
| 52 | key:dark ⚠️ | #fbbf24 |
| 53 | key:light ⚠️ | #dc2626 |
| 53 | key:dark ⚠️ | #fb7185 |
| 54 | key:light ⚠️ | #b7791f |
| 54 | key:dark ⚠️ | #fbd34d |
| 59 | key:light ⚠️ | #0e2242 |
| 59 | key:dark ⚠️ | #0e2242 |
| 60 | key:light ⚠️ | #0a1730 |
| 60 | key:dark ⚠️ | #0a1730 |
| 61 | key:light ⚠️ | #f2f7ff |
| 61 | key:dark ⚠️ | #f2f7ff |
| 62 | key:light ⚠️ | #9fb6d8 |
| 62 | key:dark ⚠️ | #9fb6d8 |
| 63 | key:light ⚠️ | #f7cf5f |
| 63 | key:dark ⚠️ | #f7cf5f |
| 64 | key:light ⚠️ | #0a1730 |
| 64 | key:dark ⚠️ | #0a1730 |
| 69 | key:light ⚠️ | rgba(16,38,84,0.06) |
| 69 | key:dark ⚠️ | rgba(255,255,255,0.08) |
| 70 | key:light ⚠️ | rgba(16,38,84,0.10) |
| 70 | key:dark ⚠️ | rgba(255,255,255,0.12) |
| 71 | key:light ⚠️ | rgba(16,38,84,0.18) |
| 71 | key:dark ⚠️ | rgba(255,255,255,0.20) |

### `apps/rn/src/theme/elevation.ts`

| line | origin | string |
|---|---|---|
| 22 | key:boxShadow ⚠️ | 0px 8px 22px rgba(16, 38, 84, 0.12), 0px 1.5px 3px rgba(16, 38, 84, 0.10) |
| 23 | key:boxShadow ⚠️ | 0px 8px 20px rgba(0, 0, 0, 0.38) |
| 27 | key:boxShadow ⚠️ | 0px 16px 40px rgba(16, 38, 84, 0.16) |
| 28 | key:boxShadow ⚠️ | 0px 16px 40px rgba(0, 0, 0, 0.5) |
| 34 | key:boxShadow ⚠️ | 0px 14px 30px rgba(8, 20, 50, 0.30) |
| 36 | key:boxShadow ⚠️ | 0px 14px 30px rgba(0, 0, 0, 0.5) |
| 38 | key:borderColor ⚠️ | rgba(255, 255, 255, 0.08) |
| 39 | key:borderTopColor ⚠️ | rgba(255, 255, 255, 0.14) |

### `apps/rn/src/theme/icons.ts`

| line | origin | string |
|---|---|---|
| 17 | key:sf ⚠️ | chart.line.uptrend.xyaxis |
| 17 | key:md ⚠️ | trending-up |
| 18 | key:md ⚠️ | account-balance-wallet |
| 22 | key:more ⚠️ | more-horiz |
| 23 | key:back ⚠️ | chevron-left |
| 35 | key:'chevron-right' ⚠️ | chevron-right |
| 35 | key:'chevron-right' ⚠️ | chevron.right |
| 36 | key:'chevron-left' ⚠️ | chevron-left |
| 36 | key:'chevron-left' ⚠️ | chevron.left |
| 37 | key:'expand-more' ⚠️ | expand-more |
| 37 | key:'expand-more' ⚠️ | chevron.down |
| 39 | key:cancel ⚠️ | xmark.circle.fill |
| 41 | key:'check-circle' ⚠️ | check-circle |
| 41 | key:'check-circle' ⚠️ | checkmark.circle.fill |
| 42 | key:'task-alt' ⚠️ | task-alt |
| 42 | key:'task-alt' ⚠️ | checkmark.circle |
| 44 | key:'add-circle-outline' ⚠️ | add-circle-outline |
| 44 | key:'add-circle-outline' ⚠️ | plus.circle |
| 46 | key:search ⚠️ | magnifyingglass |
| 47 | key:'more-horiz' ⚠️ | more-horiz |
| 48 | key:update ⚠️ | arrow.clockwise |
| 50 | key:'account-balance-wallet' ⚠️ | account-balance-wallet |
| 50 | key:'account-balance-wallet' ⚠️ | wallet.pass.fill |
| 51 | key:savings ⚠️ | banknote.fill |
| 52 | key:'shopping-cart' ⚠️ | shopping-cart |
| 52 | key:'shopping-cart' ⚠️ | cart.fill |
| 53 | key:'trending-up' ⚠️ | trending-up |
| 53 | key:'trending-up' ⚠️ | chart.line.uptrend.xyaxis |
| 54 | key:'trending-down' ⚠️ | trending-down |
| 54 | key:'trending-down' ⚠️ | chart.line.downtrend.xyaxis |
| 55 | key:'auto-graph' ⚠️ | auto-graph |
| 55 | key:'auto-graph' ⚠️ | chart.xyaxis.line |
| 56 | key:assignment ⚠️ | doc.text.fill |
| 57 | key:history ⚠️ | clock.arrow.circlepath |
| 61 | key:'lightbulb-outline' ⚠️ | lightbulb-outline |
| 62 | key:'phone-iphone' ⚠️ | phone-iphone |
| 64 | key:'gpp-good' ⚠️ | gpp-good |
| 64 | key:'gpp-good' ⚠️ | checkmark.shield.fill |
| 65 | key:'gpp-bad' ⚠️ | gpp-bad |
| 65 | key:'gpp-bad' ⚠️ | xmark.shield.fill |
| 66 | key:'gpp-maybe' ⚠️ | gpp-maybe |
| 66 | key:'gpp-maybe' ⚠️ | exclamationmark.shield.fill |
| 67 | key:shield ⚠️ | shield.fill |
| 68 | key:'verified-user' ⚠️ | verified-user |
| 68 | key:'verified-user' ⚠️ | checkmark.seal.fill |
| 69 | key:lock ⚠️ | lock.fill |
| 70 | key:'error-outline' ⚠️ | error-outline |
| 70 | key:'error-outline' ⚠️ | exclamationmark.triangle |
| 71 | key:healing ⚠️ | bandage.fill |
| 73 | key:'workspace-premium' ⚠️ | workspace-premium |
| 74 | key:star ⚠️ | star.fill |
| 75 | key:celebration ⚠️ | party.popper.fill |

### `apps/rn/src/theme/typography.ts`

| line | origin | string |
|---|---|---|
| 12 | key:display ⚠️ | System |
| 13 | key:body ⚠️ | System |
| 14 | expr ⚠️ | Menlo-Regular |
| 17 | array ⚠️ | tabular-nums |

### `apps/rn/src/utils/a11y.ts`

| line | origin | string |
|---|---|---|
| 45 | key:'aria-hidden' ⚠️ | aria-hidden |
| 52 | key:'aria-hidden' ⚠️ | aria-hidden |

### `apps/rn/src/utils/confirm.ts`

| line | origin | string |
|---|---|---|
| 16 | alert | Delete? |
| 17 | alert | Cancel |
| 18 | alert | Delete |
| 25 | var:message ⚠️ | Discard your changes? |
| 30 | alert | Discard changes? |
| 31 | alert | Keep editing |
| 32 | alert | Discard |

### `apps/rn/src/utils/debtFreeSound.ts`

| line | origin | string |
|---|---|---|
| 12 | call:require ⚠️ | ../../assets/sounds/debt-free-chime.wav |

### `apps/rn/src/utils/ecosystem.ts`

| line | origin | string |
|---|---|---|
| 5 | var:FREEDOM_SCHEME_URL ⚠️ | ffp:// |
| 9 | var:FREEDOM_STORE_URL ⚠️ | https://apps.apple.com/us/app/freedom-date-fire-planner/id6789297671 |

### `apps/rn/src/utils/format.ts`

| line | origin | string |
|---|---|---|
| 6 | other ⚠️ | en-US |
| 6 | key:currency ⚠️ | USD |
| 9 | other ⚠️ | per-paycheck |
| 9 | other ⚠️ | one-time |
| 23 | expr ⚠️ | one-time |
| 24 | expr ⚠️ | per-paycheck |

### `apps/rn/src/utils/reportError.ts`

| line | origin | string |
|---|---|---|
| 18 | call:console.warn ⚠️ | [reportError] |

### `apps/rn/src/utils/share-card.ts`

| line | origin | string |
|---|---|---|
| 12 | other ⚠️ | Share your debt-free win |
| 15 | key:mimeType ⚠️ | image/png |

### `apps/rn/src/widget/snapshot.ts`

| line | origin | string |
|---|---|---|
| 54 | return ⚠️ | This paycheck looks clear. Your cushion is safe. |
| 76 | expr ⚠️ | Debt-free! |

### `apps/rn/src/widget/widgetKeys.ts`

| line | origin | string |
|---|---|---|
| 16 | var:WIDGET_APP_GROUP ⚠️ | group.com.jasonsnyder.debtplanner |
| 17 | var:WIDGET_KIND ⚠️ | DebtWidget |
| 18 | var:WIDGET_SNAPSHOT_KEY ⚠️ | debtSnapshot |

### `apps/rn/src/widget/widgetStorage.native.ts`

| line | origin | string |
|---|---|---|
| 29 | other ⚠️ | @bacons/apple-targets |
| 30 | other ⚠️ | @bacons/apple-targets |
| 32 | call:require ⚠️ | @bacons/apple-targets |

### `apps/rn/src/widget/widgetSync.test.ts`

| line | origin | string |
|---|---|---|
| 27 | key:name ⚠️ | Debt |
| 29 | call:console.log ⚠️ | ▶ widget snapshot + sync (3.5.1) |
| 36 | call:eq ⚠️ | empty store → hasData false |
| 37 | call:eq ⚠️ | no debts → 0 progress |
| 38 | call:eq ⚠️ | updatedAt is injected (testable) |
| 45 | key:name ⚠️ | Visa |
| 46 | key:name ⚠️ | Car |
| 49 | call:eq ⚠️ | debts → hasData true |
| 50 | call:eq ⚠️ | paid 2000 of 10000 → 20% label |
| 51 | call:assert ⚠️ | pctPaid ~0.2 |
| 52 | call:eq ⚠️ | remaining = current total balance |
| 58 | key:name ⚠️ | Visa |
| 60 | call:eq ⚠️ | Debt-free! |
| 60 | call:eq ⚠️ | has debts, none live → Debt-free! |
| 61 | call:eq ⚠️ | fully cleared → 100% |
| 68 | key:name ⚠️ | Visa |
| 69 | call:eq ⚠️ | free tier → guardianSpoken empty (Siri returns an upsell) |
| 75 | key:name ⚠️ | Visa |
| 77 | call:assert ⚠️ | premium → a non-empty spoken Guardian read |
| 78 | call:eq ⚠️ | premium → isPremium true |
| 79 | call:eq ⚠️ | free → isPremium false |
| 83 | call:eq ⚠️ | debtsJson lists the live debt |
| 84 | call:eq ⚠️ | Visa |
| 84 | call:eq ⚠️ | …with its name |
| 85 | call:assert ⚠️ | …id + formatted balance |
| 93 | call:eq ⚠️ | initial mirror fires synchronously at start |
| 94 | call:eq ⚠️ | initial mirror uses the injected clock |
| 96 | call:eq ⚠️ | a second startWidgetSync on the same store is a no-op (idempotent) |

### `apps/rn/src/widget/widgetSync.ts`

| line | origin | string |
|---|---|---|
| 31 | other ⚠️ | startWidgetSync called with a SANDBOX store — refusing |

### `packages/core/cashflow/testDetectCrunches.ts`

| line | origin | string |
|---|---|---|
| 21 | call:assertEqual ⚠️ | no crunch when all >= floor |
| 24 | call:assertEqual ⚠️ | exactly at the floor is not a crunch |
| 28 | call:only ⚠️ | single crunch |
| 29 | call:assertEqual ⚠️ | starts at the first below-floor cycle |
| 30 | call:assertEqual ⚠️ | ends at the last below-floor cycle |
| 31 | call:assertEqual ⚠️ | trough is the deepest cycle (80) |
| 32 | call:assertEqual ⚠️ | deficit = floor(200) − trough(80) |
| 38 | call:assertEqual ⚠️ | two separate crunch segments |
| 39 | call:assertEqual ⚠️ | first crunch at index 0 |
| 40 | call:assertEqual ⚠️ | first deficit = 200 − 100 |
| 41 | call:assertEqual ⚠️ | second crunch at index 2 |
| 42 | call:assertEqual ⚠️ | second deficit = 200 − 50 |
| 47 | call:only ⚠️ | crunch to end-of-horizon |
| 48 | call:assertEqual ⚠️ | closes at the last cycle |
| 49 | call:assertEqual ⚠️ | deficit = 200 − 90 |
| 54 | call:only ⚠️ | single-cycle crunch |
| 55 | call:assertEqual ⚠️ | start == end for a one-cycle dip |
| 56 | call:assertEqual ⚠️ | start == end for a one-cycle dip |
| 57 | call:assertEqual ⚠️ | deficit = 200 − 10 |
| 62 | call:only ⚠️ | negative-balance crunch |
| 63 | call:assertEqual ⚠️ | deficit = 200 − (−50) = 250 |
| 66 | call:assert ⚠️ | reached the end |
| 67 | call:console.log ⚠️ | ✅ Crunch-detection (2.4.7.3) tests passed. |

### `packages/core/cashflow/testWaterFill.ts`

| line | origin | string |
|---|---|---|
| 19 | call:assertMoney ⚠️ | no-crunch/no-tight: cycle 0 reserves nothing |
| 20 | call:assertMoney ⚠️ | no-crunch: zero structural deficit |
| 28 | call:assertMoney ⚠️ | tight-not-crunch: no structural deficit (never dips below floor) |
| 29 | call:assertMoney ⚠️ | tight: cycle 0 reserves so deploy can't push bal_1 under floor |
| 36 | call:assertMoney ⚠️ | flush-then-bill: structural deficit = floor − trough (50), not inflated |
| 37 | call:assertMoney ⚠️ | flush-then-bill: cycle 0 holds all surplus, never deploys into a looming crunch |
| 44 | call:assertMoney ⚠️ | deploy-masks-crunch: structural deficit reported (200 − 120) |
| 51 | call:assertMoney ⚠️ | multi-crunch: total structural deficit = 50 + 100 (no false-clear) |
| 61 | call:assertMoney ⚠️ | cumulative-cap: no structural deficit (all above floor) |
| 62 | call:assertMoney ⚠️ | cumulative-cap: cycle 0 deploys only the $60 total headroom → reserves $240 of $300 |
| 63 | call:assertMoney ⚠️ | later cycles keep their surplus once the deploy budget is spent (bal_2 held at floor: 260 − 60 = 200) |
| 69 | call:assertMoney ⚠️ | cycle 0 under floor: reserves nothing |
| 70 | call:assertMoney ⚠️ | cycle 0 under floor: its own $100 dip is structural |
| 73 | call:console.log ⚠️ | ✅ Backward water-fill (2.4.7.4) tests passed. |

### `packages/core/constants/livingExpensePresets.ts`

| line | origin | string |
|---|---|---|
| 5 | key:name ⚠️ | Groceries |
| 10 | key:name ⚠️ | Gas / Transportation |
| 15 | key:name ⚠️ | Dining / Takeout |
| 20 | key:name ⚠️ | Household |
| 25 | key:name ⚠️ | Pets |
| 30 | key:name ⚠️ | Childcare |
| 36 | key:name ⚠️ | Misc Spending |

### `packages/core/constants/requiredExpensePresets.ts`

| line | origin | string |
|---|---|---|
| 11 | key:name ⚠️ | Rent / Mortgage |
| 16 | key:name ⚠️ | Electric |
| 21 | key:name ⚠️ | Water / Sewer |
| 26 | key:name ⚠️ | Gas / Heating |
| 31 | key:name ⚠️ | Internet |
| 36 | key:name ⚠️ | Cell Phone |
| 41 | key:name ⚠️ | Insurance |
| 46 | key:name ⚠️ | Car Payment |
| 51 | key:name ⚠️ | Credit Card Payment |
| 56 | key:name ⚠️ | Loan Payment |
| 61 | key:name ⚠️ | Subscription |
| 66 | key:name ⚠️ | Medical Bill |
| 71 | key:name ⚠️ | Childcare |
| 76 | key:name ⚠️ | Pet Insurance |
| 81 | key:name ⚠️ | Other Bill |

### `packages/core/debt/applyPaydayCapture.ts`

| line | origin | string |
|---|---|---|
| 26 | expr ⚠️ | optional_goal |

### `packages/core/debt/bnplPayoffPace.ts`

| line | origin | string |
|---|---|---|
| 26 | key:'per-paycheck' ⚠️ | per-paycheck |
| 35 | expr ⚠️ | one-time |

### `packages/core/debt/bnplSchedule.ts`

| line | origin | string |
|---|---|---|
| 42 | expr ⚠️ | BNPL |
| 65 | expr ⚠️ | BNPL |

### `packages/core/debt/buildPaydayCaptureItems.ts`

| line | origin | string |
|---|---|---|
| 6 | other ⚠️ | optional_goal |

### `packages/core/debt/computeCycleDelta.ts`

| line | origin | string |
|---|---|---|
| 15 | other ⚠️ | totalDebtBalance |

### `packages/core/debt/computeDrift.ts`

| line | origin | string |
|---|---|---|
| 28 | other ⚠️ | on_track |
| 108 | expr ⚠️ | on_track |
| 110 | expr ⚠️ | on_track |

### `packages/core/debt/computeInterestSaved.ts`

| line | origin | string |
|---|---|---|
| 17 | other ⚠️ | payoff-enabling |
| 47 | expr ⚠️ | Unable to estimate |
| 48 | expr ⚠️ | Unable to estimate |
| 54 | key:kind ⚠️ | payoff-enabling |

### `packages/core/debt/deriveRequiredActionView.ts`

| line | origin | string |
|---|---|---|
| 62 | expr ⚠️ | autopay_expense |
| 64 | expr ⚠️ | minimum_debt |
| 64 | expr ⚠️ | autopay_debt |
| 81 | expr ⚠️ | autopay_expense |
| 81 | expr ⚠️ | autopay_debt |

### `packages/core/debt/mergeCompletedAction.ts`

| line | origin | string |
|---|---|---|
| 20 | other ⚠️ | paymentSource |

### `packages/core/debt/projectDebtPayoff.ts`

| line | origin | string |
|---|---|---|
| 34 | call:date.toLocaleString ⚠️ | en-US |
| 122 | key:estimatedDebtFreeDate ⚠️ | Unable to estimate |
| 214 | expr ⚠️ | Unable to estimate |

### `packages/core/debt/selectActiveRecommendedActions.ts`

| line | origin | string |
|---|---|---|
| 66 | expr ⚠️ | starter_emergency |
| 76 | expr ⚠️ | optional_goal |
| 98 | expr ⚠️ | cushion_buffer |
| 99 | expr ⚠️ | discovery_holdback |
| 100 | expr ⚠️ | prefunded_reserve |

### `packages/core/debt/testAmortizationSchedule.ts`

| line | origin | string |
|---|---|---|
| 27 | key:name ⚠️ | Focus Debt |
| 84 | call:assertEqual ⚠️ | terminating schedule is payable |
| 88 | call:assertEqual ⚠️ | terminating schedule row count matches monthsToPayoff |
| 93 | call:assertMoney ⚠️ | terminating schedule final balance is exactly 0 |
| 119 | call:assertMoney ⚠️ | zero APR accrues no interest |
| 120 | call:assertEqual ⚠️ | zero APR pays off in balance / payment months |
| 124 | call:assertMoney ⚠️ | zero APR final balance is 0 |
| 134 | call:assertEqual ⚠️ | paid-off debt is trivially payable |
| 135 | call:assertEqual ⚠️ | paid-off debt has no schedule rows |
| 136 | call:assertEqual ⚠️ | paid-off debt needs 0 months |
| 145 | call:assertEqual ⚠️ | unpayable debt flagged not payable |
| 146 | call:assertEqual ⚠️ | unpayable debt produces no runaway rows |
| 147 | call:assertMoney ⚠️ | unpayable debt reports 0 interest (no false total) |
| 158 | call:assertEqual ⚠️ | Unable to estimate |
| 159 | call:assertEqual ⚠️ | projectDebtPayoff agrees the negative-am debt is unpayable |
| 162 | call:console.log ⚠️ | ✅ Amortization schedule regression tests passed. |

### `packages/core/debt/testApplyPaydayCapture.ts`

| line | origin | string |
|---|---|---|
| 11 | key:name ⚠️ | Goal |
| 14 | key:label ⚠️ | Extra |
| 25 | call:assertEqual ⚠️ | goal funded by the captured amount |
| 26 | call:assertEqual ⚠️ | one action captured |
| 27 | call:assertEqual ⚠️ | stores the applied amount |
| 37 | call:assertEqual ⚠️ | snowball capture leaves goals untouched |
| 38 | call:assertEqual ⚠️ | snowball action recorded as-is |
| 47 | key:label ⚠️ | Extra 2 |
| 52 | call:assertEqual ⚠️ | both fundings apply in one pass (100 + 150) |
| 62 | call:assertEqual ⚠️ | goal caps at target |
| 63 | call:assertEqual ⚠️ | stores only the applied (clamped) amount |
| 73 | call:assertEqual ⚠️ | external capture still funds the goal |
| 78 | key:label ⚠️ | Old |
| 84 | call:assertEqual ⚠️ | captured actions append to the existing list |
| 87 | call:console.log ⚠️ | ✅ applyPaydayCapture regression tests passed. |

### `packages/core/debt/testBnplInstallment.ts`

| line | origin | string |
|---|---|---|
| 26 | key:name ⚠️ | Test |
| 38 | call:console.log ⚠️ | Running BNPL installment-native model (2.7.2) tests... |
| 44 | call:assertEqual ⚠️ | a BNPL with both installment fields is installment-native |
| 49 | call:assertEqual ⚠️ | a plain debt is never installment-native (even with the fields set) |
| 54 | call:assertEqual ⚠️ | a BNPL missing installment fields falls back (not installment-native) |
| 59 | call:assertEqual ⚠️ | a BNPL with zero remaining is not installment-native (nothing to derive) |
| 65 | call:assertEqual ⚠️ | balance is reconciled to scheduled × remaining (4 × $100) |
| 66 | call:assertEqual ⚠️ | minimumPayment is reconciled to the scheduled installment |
| 67 | call:assertEqual ⚠️ | the canonical installment fields are preserved |
| 68 | call:assertEqual ⚠️ | the scheduled installment is preserved |
| 72 | call:assertTrue ⚠️ | normalize is idempotent (no-op returns the same reference) |
| 76 | call:assertTrue ⚠️ | a plain debt is returned untouched |
| 78 | call:assertTrue ⚠️ | a fallback BNPL (no installment fields) is returned untouched |
| 82 | call:assertEqual ⚠️ | a fractional installment derives a cent-rounded balance |
| 86 | call:assertEqual ⚠️ | payments-remaining derives from the current balance ($200 → 2 left) |
| 87 | call:assertEqual ⚠️ | payments-total derives from the original balance ($400 → 4 total) |
| 88 | call:assertEqual ⚠️ | payments-remaining is null for a non-installment-native debt |
| 94 | call:assertEqual ⚠️ | biweekly BNPL, due on the window start → Aug 1/15/29 all land before Sep 1 (3 charges) |
| 95 | call:assertEqual ⚠️ | biweekly BNPL in a ~4-week window → 2 charges (Aug 1, 15; Aug 29 is out) |
| 96 | call:assertEqual ⚠️ | biweekly BNPL in a 2-week (aligned) window → 1 charge |
| 97 | call:assertEqual ⚠️ | a long window is capped at remaining payments (4, not 6) |
| 98 | key:recurrence ⚠️ | one-time |
| 98 | call:assertEqual ⚠️ | a one-time BNPL charges exactly once (never advances) |
| 99 | call:assertEqual ⚠️ | nothing due before a window that ends before the due date |
| 100 | call:assertEqual ⚠️ | a plain debt has no in-window installment count |
| 103 | call:assertEqual ⚠️ | 2-charge window → effective minimum scales to 2 × the installment |
| 104 | call:assertTrue ⚠️ | aligned window (1 charge) → no-op, same reference |
| 105 | call:assertEqual ⚠️ | a long window's scaled minimum is capped at the balance (never over-pays) |
| 106 | call:assertTrue ⚠️ | a plain debt is never scaled |
| 108 | call:console.log ⚠️ | ✅ BNPL installment-native model (2.7.2/2.7.4) tests passed. |

### `packages/core/debt/testBnplSchedule.ts`

| line | origin | string |
|---|---|---|
| 13 | key:name ⚠️ | Test |
| 19 | call:console.log ⚠️ | Running BNPL schedule (2.7.5) tests... |
| 23 | key:name ⚠️ | Klarna |
| 23 | key:bnplProvider ⚠️ | Klarna |
| 28 | key:name ⚠️ | Affirm |
| 28 | key:bnplProvider ⚠️ | Affirm |
| 34 | call:assertEqual ⚠️ | 2 Klarna + 3 Affirm = 5 upcoming installments |
| 35 | call:assertEqual ⚠️ | sorted by date — Affirm Aug 10 is first |
| 36 | call:assertEqual ⚠️ | Affirm |
| 36 | call:assertEqual ⚠️ | …and it's the Affirm installment |
| 37 | call:assertEqual ⚠️ | Klarna's first upcoming installment is Aug 15 |
| 38 | call:assertEqual ⚠️ | …numbered 3 of 4 (2 already paid) |
| 39 | call:assertEqual ⚠️ | …of a 4-payment plan |
| 42 | call:assertEqual ⚠️ | Klarna's 4th installment is Aug 29 (biweekly step) |
| 46 | key:name ⚠️ | Affirm-old |
| 46 | key:bnplProvider ⚠️ | Affirm |
| 51 | call:assertEqual ⚠️ | a July installment is dropped; only the Aug one remains |
| 52 | call:assertEqual ⚠️ | …the August installment (July stepped past) |
| 55 | key:name ⚠️ | PayPal |
| 57 | call:assertEqual ⚠️ | fallback BNPL emits a single next-due row |
| 58 | call:assertEqual ⚠️ | …with no known total (0/0) |
| 59 | call:assertEqual ⚠️ | …at its minimum payment |
| 62 | key:name ⚠️ | Done |
| 63 | key:name ⚠️ | Card |
| 64 | call:assertEqual ⚠️ | a paid-off BNPL and a plain debt contribute nothing |
| 66 | call:console.log ⚠️ | ✅ BNPL schedule (2.7.5) tests passed. |

### `packages/core/debt/testBuildPayoffTrajectory.ts`

| line | origin | string |
|---|---|---|
| 21 | call:assertEqual ⚠️ | empty debts → one point |
| 22 | call:assertEqual ⚠️ | empty debts → month 0 |
| 23 | call:assertEqual ⚠️ | empty debts → balance 0 |
| 33 | call:assertEqual ⚠️ | all-paid debts → balance 0 |
| 46 | call:assertEqual ⚠️ | point 0 is the total starting balance |
| 57 | call:assertEqual ⚠️ | payable debt reaches 0 |
| 68 | call:assertTrue ⚠️ | extra payment shortens the payoff |
| 69 | call:assertEqual ⚠️ | extra payment still reaches 0 |
| 83 | call:assertTrue ⚠️ | snowball and avalanche trajectories differ |
| 95 | call:assertTrue ⚠️ | neg-amortization never reaches 0 |
| 96 | call:assertTrue ⚠️ | neg-amortization breaks early, not the full horizon |
| 107 | call:assertEqual ⚠️ | BNPL apr is forced to 0 → debt pays off |
| 110 | call:console.log ⚠️ | ✅ buildPayoffTrajectory regression tests passed. |
| 121 | key:name ⚠️ | Small |
| 122 | key:name ⚠️ | Big |
| 127 | call:assertEqual ⚠️ | both debts recorded a clear month |
| 130 | call:assertTrue ⚠️ | clears carry id |
| 131 | call:assertEqual ⚠️ | Small |
| 131 | call:assertEqual ⚠️ | clears carry name |
| 132 | call:assertTrue ⚠️ | snowball clears the smaller balance first |
| 133 | call:assertEqual ⚠️ | the last clear is the debt-free month |
| 139 | key:name ⚠️ | LoAPR |
| 140 | key:name ⚠️ | HiAPR |
| 146 | call:assertEqual ⚠️ | snowball clears the smaller-balance debt first |
| 147 | call:assertEqual ⚠️ | avalanche clears the higher-APR debt first |
| 153 | key:name ⚠️ | Sink |
| 157 | call:assertEqual ⚠️ | a debt that never clears has no waypoint |
| 166 | call:assertEqual ⚠️ | buildPayoffTrajectory === simulatePayoff().points |
| 170 | call:console.log ⚠️ | ✅ simulatePayoff (per-debt clears) regression tests passed. |

### `packages/core/debt/testBulkMarkRequired.ts`

| line | origin | string |
|---|---|---|
| 12 | key:name ⚠️ | Internet |
| 24 | key:name ⚠️ | Card |
| 42 | call:assert ⚠️ | expense in the set is marked paid |
| 43 | call:assert ⚠️ | expense NOT in the set is left unpaid |
| 51 | call:assert ⚠️ | debt minimum marked (minimumPaidThisCycle) — mirrors the toggle |
| 52 | call:assert ⚠️ | debt also sets legacy isPaidThisCycle (matches handleMarkDebtMinimumPaid) |
| 61 | call:assert ⚠️ | marking paid clears a prior autopay-failed flag (expense) |
| 62 | call:assert ⚠️ | marking paid clears a prior autopay-failed flag (debt) |
| 70 | call:assert ⚠️ | already-paid item stays paid (idempotent) |
| 76 | call:assert ⚠️ | unmarked item passes through by reference (no needless object churn) |
| 82 | call:assert ⚠️ | input object is not mutated (pure) |
| 93 | call:assert ⚠️ | paid expense → marked paid + failed flag cleared |
| 94 | call:assert ⚠️ | paid debt → both flags set |
| 103 | call:assert ⚠️ | unpaid AUTOPAY expense → flagged failed, stays owed |
| 104 | call:assert ⚠️ | unpaid AUTOPAY debt → flagged failed, stays owed |
| 113 | call:assert ⚠️ | unpaid MANUAL expense → just unpaid, no failed flag |
| 119 | call:assert ⚠️ | item not in the decision map passes through by reference |
| 123 | call:console.log ⚠️ | Running bulk-mark-required tests... |
| 137 | call:console.log ⚠️ | ✅ All bulk-mark-required tests passed. |

### `packages/core/debt/testComputeCycleDelta.ts`

| line | origin | string |
|---|---|---|
| 17 | call:assertEqual ⚠️ | no previous snapshot -> null |
| 18 | call:assertEqual ⚠️ | undefined previous snapshot -> null |
| 22 | call:assertEqual ⚠️ | debt reduced -> down |
| 23 | call:assertEqual ⚠️ | down amount is the positive difference |
| 27 | call:assertEqual ⚠️ | debt increased -> up |
| 28 | call:assertEqual ⚠️ | up amount is the positive difference |
| 31 | call:assertEqual ⚠️ | no change -> null |
| 34 | call:assertEqual ⚠️ | sub-cent change -> null |
| 38 | call:assertEqual ⚠️ | cent-level delta preserved |
| 40 | call:console.log ⚠️ | ✅ Cycle delta regression tests passed. |

### `packages/core/debt/testComputeDrift.ts`

| line | origin | string |
|---|---|---|
| 25 | key:projectedDebtFreeDate ⚠️ | Jan 2027 |
| 32 | call:assertEqual ⚠️ | null baseline → null |
| 36 | call:assertEqual ⚠️ | empty projected points → null |
| 41 | call:assertClose ⚠️ | projected balance today |
| 42 | call:assertClose ⚠️ | dollars behind (positive = owe more) |
| 43 | call:assertClose ⚠️ | days behind (positive) |
| 44 | call:assertEqual ⚠️ | status behind |
| 45 | call:assertEqual ⚠️ | behind → not on track |
| 49 | call:assertClose ⚠️ | dollars ahead (negative) |
| 50 | call:assertClose ⚠️ | days ahead (negative) |
| 51 | call:assertEqual ⚠️ | status ahead |
| 55 | call:assertClose ⚠️ | on-track days ≈ 0 |
| 56 | call:assertEqual ⚠️ | on_track |
| 56 | call:assertEqual ⚠️ | status on_track |
| 57 | call:assertEqual ⚠️ | onTrack true |
| 61 | call:assertClose ⚠️ | grew past anchor → ~elapsed days behind |
| 62 | call:assertEqual ⚠️ | grew → behind |
| 66 | call:assertClose ⚠️ | exactly on plan → 0 days |
| 67 | call:assertClose ⚠️ | exactly on plan → $0 |
| 78 | key:projectedDebtFreeDate ⚠️ | Aug 2028 |
| 80 | call:assertEqual ⚠️ | baseline anchorBalance sums positive debts |
| 81 | call:assertEqual ⚠️ | baseline debtCount = array length (a paid-off $0 debt still counts → payoff won't re-anchor) |
| 82 | call:assertEqual ⚠️ | baseline projected month 0 = anchor balance |
| 83 | call:assertEqual ⚠️ | baseline has a real projected trajectory |
| 84 | call:assertEqual ⚠️ | Aug 2028 |
| 84 | call:assertEqual ⚠️ | baseline carries the debt-free date |
| 87 | call:assertEqual ⚠️ | no baseline → re-anchor |
| 88 | call:assertEqual ⚠️ | debt added → re-anchor |
| 89 | call:assertEqual ⚠️ | strategy switch → re-anchor |
| 90 | call:assertEqual ⚠️ | small extra change (5%) → no re-anchor |
| 91 | call:assertEqual ⚠️ | big extra change (30%) → re-anchor |
| 93 | call:console.log ⚠️ | ✅ Drift Tracker (computeDrift) reconciliation tests passed. |

### `packages/core/debt/testComputeInterestSaved.ts`

| line | origin | string |
|---|---|---|
| 17 | key:name ⚠️ | Debt |
| 34 | call:assertEqual ⚠️ | both payable → kind saving |
| 39 | call:assertEqual ⚠️ | interestSaved reconciles with projectDebtPayoff min-minus-current |
| 44 | call:assertEqual ⚠️ | monthsSaved reconciles with projectDebtPayoff |
| 46 | call:assert ⚠️ | paying extra saves interest |
| 47 | call:assert ⚠️ | paying extra saves months |
| 55 | call:assertEqual ⚠️ | no extra → none |
| 62 | call:assertEqual ⚠️ | no live debts → none |
| 72 | call:assertEqual ⚠️ | Unable to estimate |
| 72 | call:assertEqual ⚠️ | sanity: minimums alone are unpayable here |
| 75 | call:assertEqual ⚠️ | payoff-enabling |
| 75 | call:assertEqual ⚠️ | unpayable minimums + payable plan → payoff-enabling |
| 76 | expr ⚠️ | payoff-enabling |
| 77 | expr ⚠️ | Unable to estimate |
| 77 | call:assert ⚠️ | payoff-enabling carries a real debt-free date |
| 85 | call:assertEqual ⚠️ | plan still unpayable → none |
| 88 | call:console.log ⚠️ | ✅ computeInterestSaved regression tests passed. |

### `packages/core/debt/testComputeMilestones.ts`

| line | origin | string |
|---|---|---|
| 17 | key:name ⚠️ | Card |
| 28 | call:assertEqual ⚠️ | 25% crossing count |
| 29 | call:assertEqual ⚠️ | 25% threshold |
| 30 | call:assertEqual ⚠️ | 25% not paid off |
| 35 | call:assertEqual ⚠️ | 50% threshold |
| 40 | call:assertEqual ⚠️ | 75% threshold |
| 45 | call:assertEqual ⚠️ | 100% threshold |
| 46 | call:assertEqual ⚠️ | 100% is paid off |
| 47 | call:assertEqual ⚠️ | 100% progress |
| 53 | call:assertEqual ⚠️ | no re-fire past a crossed threshold |
| 59 | call:assertEqual ⚠️ | big jump reports one milestone |
| 60 | call:assertEqual ⚠️ | big jump reports highest (100) |
| 67 | key:name ⚠️ | Card |
| 74 | call:assertEqual ⚠️ | no originalBalance -> no milestone |
| 77 | call:assertEqual ⚠️ | a paid-off debt counts as debt-free even without originalBalance |
| 83 | call:assertEqual ⚠️ | balance increase celebrates nothing |
| 89 | call:assertEqual ⚠️ | sub-25% progress -> no milestone |
| 95 | key:name ⚠️ | Loan |
| 98 | call:assertEqual ⚠️ | all debts paid off |
| 99 | call:assertEqual ⚠️ | newly all paid off this cycle |
| 100 | call:assertEqual ⚠️ | both debts report a 100% milestone |
| 106 | call:assertEqual ⚠️ | already-paid debts count as all paid off |
| 107 | call:assertEqual ⚠️ | already-paid does not re-fire the debt-free moment |
| 113 | key:name ⚠️ | Loan |
| 116 | call:assertEqual ⚠️ | one debt still owed -> not all paid off |
| 117 | call:assertEqual ⚠️ | only the paid-off debt reports a milestone |
| 118 | call:assertEqual ⚠️ | the paid-off debt is the one reported |
| 128 | key:name ⚠️ | Old Card |
| 135 | call:assertEqual ⚠️ | a still-owed legacy debt (no originalBalance) blocks debt-free |
| 136 | call:assertEqual ⚠️ | no false 'Debt free!' while a legacy debt is owed |
| 145 | call:assertEqual ⚠️ | 50% does NOT re-celebrate on a re-cross (#10) |
| 146 | call:assertEqual ⚠️ | high-water mark stays at 51 |
| 152 | call:assertEqual ⚠️ | a genuine first 50% crossing still fires |
| 153 | call:assertEqual ⚠️ | first crossing reports 50 |
| 154 | call:assertEqual ⚠️ | records the new high-water mark |
| 156 | call:console.log ⚠️ | ✅ Milestone regression tests passed. |

### `packages/core/debt/testComputeStreak.ts`

| line | origin | string |
|---|---|---|
| 26 | call:assertEqual ⚠️ | empty history streak is 0 |
| 32 | call:assertEqual ⚠️ | all-on-plan run counts every cycle |
| 40 | call:assertEqual ⚠️ | streak counts only the most-recent consecutive run |
| 47 | call:assertEqual ⚠️ | a broken most-recent cycle resets the streak to 0 |
| 51 | call:assertEqual ⚠️ | all affordable required met is on plan |
| 54 | call:assertEqual ⚠️ | an affordable required action skipped is off plan |
| 61 | call:assertEqual ⚠️ | recommended extras do not affect the on-plan determination |
| 73 | call:assertEqual ⚠️ | legacy snapshot without allRequiredMet qualifies (on-plan default) |
| 75 | call:console.log ⚠️ | ✅ Streak regression tests passed. |

### `packages/core/debt/testDebtProjection.ts`

| line | origin | string |
|---|---|---|
| 39 | call:assertMoney ⚠️ | single month interest |
| 43 | call:assertMoney ⚠️ | single month balance after interest |
| 45 | call:assertMoney ⚠️ | single month payment |
| 49 | call:assertMoney ⚠️ | single month projected balance |
| 61 | call:assertMoney ⚠️ | single month payment is capped at balance |
| 66 | call:assertMoney ⚠️ | single month overpayment does not create negative balance |
| 75 | call:assertMoney ⚠️ | zero APR projection interest |
| 79 | call:assertMoney ⚠️ | zero APR projection balance |
| 86 | key:name ⚠️ | Small Debt |
| 97 | key:name ⚠️ | Large Debt |
| 114 | call:assertEqual ⚠️ | Small Debt |
| 115 | call:assertEqual ⚠️ | snowball payoff order |
| 122 | key:name ⚠️ | Low APR |
| 133 | key:name ⚠️ | High APR |
| 150 | call:assertEqual ⚠️ | High APR |
| 151 | call:assertEqual ⚠️ | avalanche payoff order |
| 157 | call:assertGreaterThan ⚠️ | interest accrual |
| 163 | call:assertGreaterThan ⚠️ | months to debt free |
| 170 | key:name ⚠️ | Impossible Debt |
| 187 | call:assertEqual ⚠️ | Unable to estimate |
| 188 | call:assertEqual ⚠️ | negative amortization detection |
| 195 | key:name ⚠️ | Tiny Debt |
| 213 | call:assertEqual ⚠️ | overpayment prevention payoff timing |
| 219 | call:assertMoney ⚠️ | zero APR overpayment has no interest |
| 225 | key:id ⚠️ | exact-date |
| 226 | key:name ⚠️ | Exact Date Debt |
| 244 | call:assertEqual ⚠️ | exact baseline payoff months |
| 249 | call:assertEqual ⚠️ | July 2026 |
| 250 | call:assertEqual ⚠️ | exact baseline payoff date |
| 256 | key:id ⚠️ | exact-date |
| 257 | key:name ⚠️ | Exact Date Debt |
| 275 | call:assertEqual ⚠️ | exact recommended payoff months |
| 280 | call:assertEqual ⚠️ | June 2026 |
| 281 | call:assertEqual ⚠️ | exact recommended payoff date |
| 288 | key:name ⚠️ | Paid Debt |
| 299 | key:name ⚠️ | Remaining Debt |
| 317 | call:assertEqual ⚠️ | paid debt ignored payoff months |
| 322 | call:assertEqual ⚠️ | June 2026 |
| 323 | call:assertEqual ⚠️ | paid debt ignored payoff date |
| 331 | key:name ⚠️ | Klarna |
| 337 | call:assertEqual ⚠️ | biweekly BNPL rated at its true monthly rate (B1) |
| 343 | key:name ⚠️ | Affirm |
| 349 | call:assertEqual ⚠️ | monthly BNPL stays at its monthly rate (cadence-specific) |
| 354 | key:name ⚠️ | Klarna Pay-in-30 |
| 354 | key:recurrence ⚠️ | one-time |
| 360 | call:assertEqual ⚠️ | one-time BNPL clears the month it lands (B1) |
| 367 | key:name ⚠️ | Card |
| 373 | call:assertEqual ⚠️ | baseline: the card alone takes 10 months |
| 377 | key:name ⚠️ | Klarna Pay-in-30 |
| 377 | key:recurrence ⚠️ | one-time |
| 378 | key:name ⚠️ | Card |
| 384 | call:assertEqual ⚠️ | one-time BNPL does not phantom-accelerate a coexisting debt (R2.2) |
| 394 | call:assertEqual ⚠️ | payoff chart zero-crossing matches the debt-free date for a biweekly BNPL (R2.1) |
| 399 | key:recurrence ⚠️ | one-time |
| 403 | call:assertEqual ⚠️ | solo one-time BNPL chart clears month 1, no flatline (R3 F1) |
| 408 | key:name ⚠️ | Card |
| 413 | key:name ⚠️ | Klarna Pay-in-30 |
| 413 | key:recurrence ⚠️ | one-time |
| 414 | key:name ⚠️ | Card |
| 418 | call:assertEqual ⚠️ | one-time BNPL doesn't decelerate a coexisting debt with extra>0 (R3 F2) |
| 422 | key:name ⚠️ | Zip |
| 425 | call:assertEqual ⚠️ | weekly BNPL clears in ~1 month |
| 438 | key:recurrence ⚠️ | one-time |
| 447 | call:assertEqual ⚠️ | chart: one-time BNPL doesn't decelerate a coexisting debt with extra>0 (R4) |
| 450 | call:console.log ⚠️ | ✅ Debt projection regression tests passed. |

### `packages/core/debt/testDeriveRequiredActionView.ts`

| line | origin | string |
|---|---|---|
| 14 | key:name ⚠️ | Internet |
| 26 | key:name ⚠️ | Card |
| 40 | key:label ⚠️ | Pay Internet |
| 45 | call:assert ⚠️ | unpaid manual expense → isPaid false, not autopay |
| 48 | key:label ⚠️ | Pay Internet |
| 53 | call:assert ⚠️ | paid expense → isPaid true |
| 54 | call:assert ⚠️ | resolves the underlying expense |
| 59 | key:category ⚠️ | autopay_expense |
| 59 | key:label ⚠️ | Pay Internet |
| 64 | call:assert ⚠️ | autopay_expense category → isAutopay true |
| 69 | key:category ⚠️ | autopay_expense |
| 69 | key:label ⚠️ | Pay Internet |
| 74 | call:assert ⚠️ | autopay past-due → presumedPaid true (shows Auto-paid) |
| 77 | key:category ⚠️ | autopay_expense |
| 77 | key:label ⚠️ | Pay Internet |
| 82 | call:assert ⚠️ | autopay not-yet-due → presumedPaid false (shows Autopay) |
| 85 | key:label ⚠️ | Pay Internet |
| 90 | call:assert ⚠️ | manual bill → never presumedPaid |
| 95 | key:category ⚠️ | minimum_debt |
| 95 | key:label ⚠️ | Pay minimum on Card |
| 100 | call:assert ⚠️ | debt paid via legacy isPaidThisCycle when minimumPaidThisCycle absent |
| 103 | key:category ⚠️ | autopay_debt |
| 103 | key:label ⚠️ | Pay minimum on Card |
| 108 | call:assert ⚠️ | autopay debt paid via minimumPaidThisCycle + isAutopay |
| 109 | call:assert ⚠️ | resolves the underlying debt (via debtId) |
| 114 | key:label ⚠️ | Pay Internet |
| 119 | call:assert ⚠️ | past-due + unpaid → overdue |
| 122 | key:label ⚠️ | Pay Internet |
| 127 | call:assert ⚠️ | past-due but PAID → not overdue |
| 129 | call:assert ⚠️ | isOverdue compares dates correctly |
| 134 | key:category ⚠️ | autopay_expense |
| 139 | call:assert ⚠️ | presumed-paid autopay (past due) is NOT overdue — hero won't false-alarm |
| 140 | call:assert ⚠️ | a healthy autopay is NOT flagged failed (still presents as autopay) |
| 143 | key:category ⚠️ | autopay_expense |
| 148 | call:assert ⚠️ | a FAILED autopay past due IS overdue (correctly needs attention) |
| 149 | call:assert ⚠️ | a FAILED autopay is flagged failed BUT keeps isAutopay (resumes autopay next cycle) |
| 154 | key:label ⚠️ | Pay X |
| 159 | call:assert ⚠️ | unresolved item → safe defaults, no crash |
| 175 | key:name ⚠️ | Klarna — Sofa |
| 179 | key:category ⚠️ | minimum_debt |
| 179 | key:label ⚠️ | Pay minimum on Klarna — Sofa |
| 182 | call:assert ⚠️ | a 2-installment window → '2 × $100' |
| 183 | call:assert ⚠️ | a 3-installment window → 3 |
| 185 | call:assert ⚠️ | a single installment says nothing extra (the amount already IS the payment) |
| 188 | call:assert ⚠️ | a balance-capped amount that doesn't divide → no claim |
| 190 | key:category ⚠️ | minimum_debt |
| 190 | key:label ⚠️ | Pay minimum on Card |
| 191 | call:assert ⚠️ | a plain debt has no installments to break down |
| 196 | call:console.log ⚠️ | Running derive-required-action-view tests... |
| 207 | call:console.log ⚠️ | ✅ All derive-required-action-view tests passed. |

### `packages/core/debt/testFreedMinimumRoll.ts`

| line | origin | string |
|---|---|---|
| 28 | call:assertEqual ⚠️ | projectDebtPayoff rolls the freed minimum (2 months, not 3) |
| 29 | call:assertEqual ⚠️ | A,B |
| 29 | call:assertEqual ⚠️ | payoff order A then B |
| 37 | call:assertEqual ⚠️ | trajectory reaches zero |
| 38 | call:assertEqual ⚠️ | buildPayoffTrajectory rolls the freed minimum (zero by month 2, not 3) |
| 40 | call:console.log ⚠️ | ✅ Freed-minimum roll regression tests passed. |

### `packages/core/debt/testGetDebtsWithDisplayBalances.ts`

| line | origin | string |
|---|---|---|
| 14 | key:name ⚠️ | Test Debt |
| 37 | call:assertEqual ⚠️ | no actions → 0 |
| 42 | call:assertEqual ⚠️ | sums multiple snowball actions for the debt |
| 54 | call:assertEqual ⚠️ | filters by category=snowball AND targetId |
| 62 | call:assertEqual ⚠️ | untouched debt shows full balance |
| 63 | call:assertEqual ⚠️ | untouched debt is active |
| 64 | call:assertEqual ⚠️ | untouched debt is not paid off |
| 73 | call:assertEqual ⚠️ | paid minimum reduces display balance |
| 82 | call:assertEqual ⚠️ | isPaidThisCycle also subtracts the minimum |
| 91 | call:assertEqual ⚠️ | snowball stacks on the paid minimum |
| 100 | call:assertEqual ⚠️ | over-payment clamps at 0 |
| 101 | call:assertEqual ⚠️ | fully-paid debt is not active |
| 102 | call:assertEqual ⚠️ | fully-paid debt is paid off |
| 112 | call:assertEqual ⚠️ | minimum capped at balance → 0, not negative |
| 121 | call:assertEqual ⚠️ | display balance is rounded to cents |
| 130 | call:assertEqual ⚠️ | mixed list: one active |
| 131 | call:assertEqual ⚠️ | active debt identified |
| 132 | call:assertEqual ⚠️ | mixed list: one paid off |
| 133 | call:assertEqual ⚠️ | paid-off debt identified |
| 136 | call:console.log ⚠️ | ✅ getDebtsWithDisplayBalances regression tests passed. |

### `packages/core/debt/testGoalReconciliation.ts`

| line | origin | string |
|---|---|---|
| 13 | call:assertEqual ⚠️ | partial: applies full requested (fits in room) |
| 14 | call:assertEqual ⚠️ | partial: currentAmount += applied |
| 18 | call:assertEqual ⚠️ | near-complete: applied clamped to remaining room |
| 19 | call:assertEqual ⚠️ | near-complete: lands exactly on target, never over |
| 23 | call:assertEqual ⚠️ | over-request: clamped to the 100 of room |
| 24 | call:assertEqual ⚠️ | over-request: caps at target, does not overshoot |
| 29 | call:assertEqual ⚠️ | fractional request rounded to cents |
| 30 | call:assertEqual ⚠️ | fractional currentAmount rounded to cents |
| 41 | call:assertEqual ⚠️ | over-funded: no room, applies 0 |
| 42 | call:assertEqual ⚠️ | over-funded: currentAmount UNCHANGED (excess not destroyed) |
| 43 | call:assertEqual ⚠️ | over-funded: unmark restores exactly |
| 48 | call:assertEqual ⚠️ | over-funded (small): currentAmount unchanged |
| 49 | call:assertEqual ⚠️ | over-funded (small): applies 0 |
| 53 | call:assertEqual ⚠️ | unmark never drives currentAmount negative |
| 54 | call:assertEqual ⚠️ | unmark subtracts the stored applied amount |
| 83 | call:console.log ⚠️ | ✅ goal reconciliation (mark/unmark) regression tests passed. |

### `packages/core/debt/testParseDebtFormValues.ts`

| line | origin | string |
|---|---|---|
| 12 | call:assert ⚠️ | clean input parses |
| 13 | call:assert ⚠️ | clean balance parses to 12000 |
| 14 | call:assert ⚠️ | clean minimum parses |
| 15 | call:assert ⚠️ | clean apr parses |
| 19 | call:assert ⚠️ | comma-grouped input parses instead of producing NaN |
| 20 | call:assert ⚠️ | 12,000 parses to 12000 |
| 21 | call:assert ⚠️ | 1,250.50 parses to 1250.5 |
| 25 | call:assert ⚠️ | blank apr defaults to 0 |
| 28 | call:assert ⚠️ | lone dot rejected |
| 29 | call:assert ⚠️ | non-numeric rejected |
| 30 | call:assert ⚠️ | empty balance rejected |
| 31 | key:balance ⚠️ | NaN |
| 31 | call:assert ⚠️ | literal NaN rejected |
| 34 | call:assert ⚠️ | negative balance rejected |
| 35 | call:assert ⚠️ | negative minimum rejected |
| 36 | call:assert ⚠️ | negative apr rejected |
| 39 | call:assert ⚠️ | APR > 100 rejected |
| 40 | call:assert ⚠️ | minimum > balance rejected |
| 41 | call:assert ⚠️ | zero balance rejected |
| 42 | call:assert ⚠️ | zero minimum rejected |
| 43 | call:assert ⚠️ | APR exactly 100 accepted |
| 44 | call:assert ⚠️ | minimum == balance accepted |
| 46 | call:console.log ⚠️ | ✅ parseDebtFormValues regression tests passed. |

### `packages/core/debt/testPaydayCapture.ts`

| line | origin | string |
|---|---|---|
| 18 | key:label ⚠️ | Extra to Visa |
| 19 | key:label ⚠️ | Add to Emergency Fund |
| 20 | key:label ⚠️ | Add to Vacation |
| 20 | key:category ⚠️ | optional_goal |
| 27 | call:assertEqual ⚠️ | one-tap: captures every active action |
| 38 | key:label ⚠️ | Extra to Visa |
| 40 | call:assertEqual ⚠️ | stores the full payoff room as recommendedAmount |
| 41 | call:assertEqual ⚠️ | default paid = the capacity-limited cycle recommendation |
| 50 | key:label ⚠️ | Extra to Visa |
| 52 | call:assertEqual ⚠️ | remainder is captured, not silently skipped |
| 56 | key:label ⚠️ | Extra to Visa |
| 60 | call:assertEqual ⚠️ | remainder folds into the partial (no colliding duplicate) |
| 61 | call:assertEqual ⚠️ | actualAmount accumulates (100 partial + 200 remainder) |
| 62 | call:assertEqual ⚠️ | recommendedAmount stays the full payoff room |
| 69 | key:label ⚠️ | Add to Emergency Fund |
| 73 | key:label ⚠️ | Add to Emergency Fund |
| 77 | call:assertEqual ⚠️ | paycheck contribution stays separate from the external one |
| 78 | call:assertEqual ⚠️ | only the paycheck 425 counts against cash |
| 87 | call:assertEqual ⚠️ | override sets the real actual amount |
| 88 | call:assertEqual ⚠️ | override preserves the recommended amount (for drift) |
| 97 | call:assertEqual ⚠️ | external toggle sets paymentSource |
| 109 | call:assertEqual ⚠️ | external payment is excluded from the paycheck cash total (300 + 50) |
| 115 | call:assertEqual ⚠️ | all-paycheck capture counts the full 450 |
| 123 | key:label ⚠️ | Add to Emergency Fund |
| 127 | call:assertEqual ⚠️ | captured goal action funds the goal (+100) |
| 128 | call:assertEqual ⚠️ | un-capturing reconciles the goal exactly |
| 131 | call:console.log ⚠️ | ✅ Payday Autopilot capture regression tests passed. |

### `packages/core/debt/testProjectCurrentBalance.ts`

| line | origin | string |
|---|---|---|
| 36 | call:console.log ⚠️ | Running projection auto-maintenance (2.3) tests... |
| 42 | call:assertEqual ⚠️ | unverified debt (no lastVerifiedDate) shows the anchor as-is |
| 47 | call:assertEqual ⚠️ | asOf == anchor date → anchor unchanged (zero elapsed) |
| 52 | call:assertEqual ⚠️ | asOf BEFORE anchor date → anchor unchanged (never projects backward) |
| 57 | call:assertEqual ⚠️ | zero anchor stays zero |
| 65 | call:assertApprox ⚠️ | partial month accrues prorated interest only (balance ticks up mid-month) |
| 73 | call:assertApprox ⚠️ | one whole month applies a full interest+minimum step, then prorates the remainder |
| 82 | call:assertTrue ⚠️ | negative amortization: balance grows when interest exceeds the minimum (never understates) |
| 83 | call:assertApprox ⚠️ | negative-amortization projected value |
| 93 | call:assertApprox ⚠️ | BNPL projects as pure principal — zero interest even with a nonzero APR |
| 105 | call:assertApprox ⚠️ | AS.1: a biweekly BNPL projects down at its monthly-equivalent rate, not one installment/month |
| 113 | call:assertEqual ⚠️ | an over-paid-down debt floors at $0, never negative |
| 120 | call:assertTrue ⚠️ | isDebtProjectedPaidOff true once the projection reaches $0 (the payoff-gate trigger) |
| 125 | call:assertEqual ⚠️ | isDebtProjectedPaidOff false while the projection is still above $0 |
| 130 | call:assertEqual ⚠️ | isDebtProjectedPaidOff false for an already-confirmed $0 anchor (confirmed, not projected) |
| 139 | call:assertEqual ⚠️ | daysSinceVerified counts elapsed days |
| 143 | call:assertEqual ⚠️ | unverified debt reads as fresh with zero days (safe default) |
| 154 | call:assertEqual ⚠️ | projection anchors on balanceAsOfDate — 0 elapsed → the rolled balance, NOT re-projected from the old verified date (the double-count fix) |
| 159 | call:assertEqual ⚠️ | staleness still keys off lastVerifiedDate — 50 days since the user confirmed → verify-soon, despite the fresh rollover anchor |
| 164 | call:assertEqual ⚠️ | falls back to lastVerifiedDate as the anchor when balanceAsOfDate is absent (pre-split blobs) |
| 173 | call:assertApprox ⚠️ | projectDebtsToDate maps each balance to its projectCurrentBalance |
| 174 | call:assertApprox ⚠️ | projectDebtsToDate projects BNPL as pure principal too |
| 175 | call:assertEqual ⚠️ | projectDebtsToDate re-stamps balanceAsOfDate to asOfDate |
| 176 | call:assertEqual ⚠️ | projectDebtsToDate preserves lastVerifiedDate (staleness/labels stay honest) |
| 177 | call:assertEqual ⚠️ | projectDebtsToDate preserves other fields (apr) |
| 178 | call:assertEqual ⚠️ | projectDebtsToDate preserves other fields (minimumPayment) |
| 180 | call:assertEqual ⚠️ | projectDebtsToDate is idempotent — re-projecting to the same date doesn't move the balance |
| 186 | call:assertTrue ⚠️ | reconciliation: a min-beats-interest debt projects DOWN (banked paydown) |
| 188 | call:assertTrue ⚠️ | reconciliation: an interest-outruns-minimum debt projects UP (the cost of delay) |
| 193 | call:assertApprox ⚠️ | the engine's trajectory starts from the PROJECTED balance (routing is effective) |
| 194 | call:assertTrue ⚠️ | routing shifts the engine's starting balance off the anchor |
| 196 | call:console.log ⚠️ | ✅ Projection auto-maintenance (2.3) + engine-routing (2.4) tests passed. |

### `packages/core/debt/testProjectionAccuracy.ts`

| line | origin | string |
|---|---|---|
| 43 | key:name ⚠️ | Zero APR |
| 57 | call:assertEqual ⚠️ | zero APR minimum-only months |
| 62 | call:assertEqual ⚠️ | January 2027 |
| 63 | call:assertEqual ⚠️ | zero APR minimum-only payoff date |
| 69 | call:assertMoney ⚠️ | zero APR minimum-only interest |
| 76 | key:name ⚠️ | High APR |
| 90 | call:assertEqual ⚠️ | high APR minimum-only months |
| 95 | call:assertEqual ⚠️ | January 2027 |
| 96 | call:assertEqual ⚠️ | high APR minimum-only payoff date |
| 102 | call:assertMoney ⚠️ | high APR minimum-only interest |
| 109 | key:name ⚠️ | High APR |
| 123 | call:assertEqual ⚠️ | high APR with extra payment months |
| 128 | call:assertEqual ⚠️ | July 2026 |
| 129 | call:assertEqual ⚠️ | high APR with extra payment payoff date |
| 135 | call:assertMoney ⚠️ | high APR with extra payment interest |
| 142 | key:name ⚠️ | Small Debt |
| 149 | key:name ⚠️ | Large Debt |
| 165 | call:assertEqual ⚠️ | snowball two-debt payoff months (freed minimum rolls) |
| 170 | call:assertEqual ⚠️ | May 2026 |
| 171 | call:assertEqual ⚠️ | snowball two-debt payoff date |
| 176 | call:assertEqual ⚠️ | Small Debt,Large Debt |
| 177 | call:assertEqual ⚠️ | snowball two-debt payoff order |
| 184 | key:name ⚠️ | Low APR |
| 191 | key:name ⚠️ | High APR |
| 205 | call:assertEqual ⚠️ | avalanche two-debt payoff months |
| 210 | call:assertEqual ⚠️ | June 2026 |
| 211 | call:assertEqual ⚠️ | avalanche two-debt payoff date |
| 216 | call:assertEqual ⚠️ | Low APR,High APR |
| 217 | call:assertEqual ⚠️ | avalanche two-debt payoff order with minimum payoff first |
| 223 | call:assertMoney ⚠️ | avalanche two-debt interest |
| 230 | key:name ⚠️ | Boundary Debt |
| 244 | call:assertEqual ⚠️ | exact payoff boundary months |
| 249 | call:assertEqual ⚠️ | March 2026 |
| 250 | call:assertEqual ⚠️ | exact payoff boundary date |
| 256 | call:assertMoney ⚠️ | exact payoff boundary interest |
| 259 | call:console.log ⚠️ | ✅ Projection accuracy tests passed. |

### `packages/core/debt/testReconcileAutopay.ts`

| line | origin | string |
|---|---|---|
| 17 | key:name ⚠️ | Internet |
| 29 | key:name ⚠️ | Card |
| 46 | call:assert ⚠️ | autopay + due date passed + not failed → presumed paid |
| 50 | call:assert ⚠️ | autopay not yet due (due > asOf) → NOT presumed paid |
| 54 | call:assert ⚠️ | autopay flagged failed → NOT presumed paid (stays owed) |
| 58 | call:assert ⚠️ | non-autopay past-due → NOT presumed (needs a real manual mark) |
| 62 | call:assert ⚠️ | autopay due exactly on asOf date → presumed paid (boundary: on-or-before) |
| 73 | call:assert ⚠️ | unpaid past-due autopay expense → marked paid before rollover |
| 82 | call:assert ⚠️ | failed autopay expense stays unpaid (user reported it didn't go through) |
| 91 | call:assert ⚠️ | manual unpaid bill is NEVER auto-marked (only the user confirms manual bills) |
| 100 | call:assert ⚠️ | autopay not yet due → left unpaid (hasn't run yet) |
| 106 | call:assert ⚠️ | already-paid autopay passes through unchanged (idempotent, same ref) |
| 117 | call:assert ⚠️ | unpaid past-due autopay debt → minimum marked paid (so BOTH the due-date advance AND balance deduction fire) |
| 130 | call:assert ⚠️ | failed autopay debt minimum stays owed |
| 131 | call:assert ⚠️ | manual debt minimum never auto-marked |
| 154 | call:assert ⚠️ | untouched autopay BILL advances to next cycle (future due date, NOT overdue) |
| 156 | call:assert ⚠️ | …and resets to unpaid for the fresh cycle |
| 173 | call:assert ⚠️ | untouched autopay DEBT minimum advances to next cycle (NOT overdue) |
| 192 | call:assert ⚠️ | a FAILED autopay keeps its past due date (correctly still owed/overdue) |
| 200 | call:assert ⚠️ | manual unpaid bill still carries its due date (unchanged) |
| 204 | call:console.log ⚠️ | Running autopay-reconcile tests... |
| 221 | call:console.log ⚠️ | ✅ All autopay-reconcile tests passed. |

### `packages/core/debt/testSelectActiveRecommendedActions.ts`

| line | origin | string |
|---|---|---|
| 15 | key:name ⚠️ | Debt |
| 35 | key:name ⚠️ | Visa |
| 38 | call:assertEqual ⚠️ | single debt → one recommendation |
| 39 | call:assertEqual ⚠️ | targets the debt |
| 40 | call:assertEqual ⚠️ | snowball category |
| 41 | call:assertEqual ⚠️ | recommended = full balance |
| 42 | call:assertEqual ⚠️ | ample cash funds the full balance |
| 43 | call:assertEqual ⚠️ | Extra payment to Visa |
| 43 | call:assertEqual ⚠️ | label from debt name |
| 53 | call:assertEqual ⚠️ | snowball: smallest balance first |
| 54 | call:assertEqual ⚠️ | snowball: larger balance second |
| 64 | call:assertEqual ⚠️ | avalanche: highest APR first |
| 75 | call:assertEqual ⚠️ | recommended is still the full balance |
| 76 | call:assertEqual ⚠️ | actual is capped at available flexible cash |
| 82 | key:label ⚠️ | Extra payment to Visa |
| 85 | key:name ⚠️ | Visa |
| 89 | call:assertEqual ⚠️ | remaining balance nets out completed snowball |
| 98 | key:label ⚠️ | Add to Couch |
| 98 | key:category ⚠️ | optional_goal |
| 99 | key:label ⚠️ | Add to Vacation |
| 99 | key:category ⚠️ | optional_goal |
| 104 | key:name ⚠️ | Visa |
| 106 | key:name ⚠️ | Couch |
| 107 | key:name ⚠️ | Vacation |
| 114 | call:assertEqual ⚠️ | optional_goal |
| 114 | call:assertEqual ⚠️ | a priority sinking fund surfaces as a plan action |
| 115 | call:assertEqual ⚠️ | …at this cycle's pace ($50), not the whole goal ($400) |
| 116 | call:assertEqual ⚠️ | a normal (non-priority) savings goal does NOT surface in actions |
| 117 | call:assertEqual ⚠️ | the sinking fund is listed BEFORE the extra-debt action (funds before debt) |
| 120 | call:console.log ⚠️ | ✅ selectActiveRecommendedActions regression tests passed. |

### `packages/core/debt/testShouldPromptPaydayCapture.ts`

| line | origin | string |
|---|---|---|
| 14 | call:assert ⚠️ | day before payday → no prompt |
| 15 | call:assert ⚠️ | well before payday → no prompt |
| 18 | call:assert ⚠️ | ON payday → prompt |
| 19 | call:assert ⚠️ | day after payday → prompt |
| 20 | call:assert ⚠️ | 10 days after (within window) → prompt |
| 21 | call:assert ⚠️ | exactly at the window edge (21d) → prompt |
| 24 | call:assert ⚠️ | 22 days after (just past window) → no prompt |
| 25 | call:assert ⚠️ | 47 days after (ancient payday) → no nag |
| 28 | call:assert ⚠️ | handled this payday → no re-prompt |
| 29 | call:assert ⚠️ | handled this payday, days later → still quiet |
| 32 | call:assert ⚠️ | prior payday handled, new one arrives → prompt |
| 35 | call:assert ⚠️ | no nextPaycheckDate → never prompt |
| 40 | call:assert ⚠️ | handled ON payday → awaiting rollover |
| 41 | call:assert ⚠️ | handled, well past payday (stale) → STILL nudged to roll over |
| 42 | call:assert ⚠️ | before payday → not awaiting (shouldn't happen, guard) |
| 43 | call:assert ⚠️ | unhandled payday → the sheet prompts, not the rollover nudge |
| 44 | call:assert ⚠️ | handled a DIFFERENT payday → not awaiting this one |
| 45 | call:assert ⚠️ | no nextPaycheckDate → never awaiting |
| 47 | call:console.log ⚠️ | ✅ shouldPromptPaydayCapture regression tests passed. |

### `packages/core/engine/allocatePaycheck.ts`

| line | origin | string |
|---|---|---|
| 56 | other ⚠️ | minimum_debt |
| 57 | other ⚠️ | autopay_expense |
| 58 | other ⚠️ | autopay_debt |
| 59 | other ⚠️ | cushion_buffer |
| 60 | other ⚠️ | prefunded_reserve |
| 61 | other ⚠️ | discovery_holdback |
| 62 | other ⚠️ | starter_emergency |
| 65 | other ⚠️ | optional_goal |
| 66 | other ⚠️ | true_leftover |
| 71 | array ⚠️ | cushion_buffer |
| 72 | array ⚠️ | prefunded_reserve |
| 73 | array ⚠️ | discovery_holdback |
| 74 | array ⚠️ | true_leftover |
| 79 | array ⚠️ | starter_emergency |
| 82 | array ⚠️ | optional_goal |
| 97 | other ⚠️ | minimum_debt |
| 97 | other ⚠️ | autopay_expense |
| 97 | other ⚠️ | autopay_debt |
| 199 | expr ⚠️ | one-time |
| 326 | expr ⚠️ | minimum_debt |
| 327 | expr ⚠️ | autopay_debt |
| 354 | expr ⚠️ | autopay_expense |
| 372 | expr ⚠️ | autopay_expense |
| 404 | expr ⚠️ | autopay_debt |
| 404 | expr ⚠️ | minimum_debt |
| 423 | expr ⚠️ | autopay_debt |
| 423 | expr ⚠️ | minimum_debt |
| 433 | key:label ⚠️ | Keep cash buffer |
| 435 | key:category ⚠️ | cushion_buffer |
| 476 | key:label ⚠️ | Held for an upcoming tight cycle |
| 476 | key:category ⚠️ | prefunded_reserve |
| 483 | key:label ⚠️ | Safety net |
| 483 | key:category ⚠️ | discovery_holdback |
| 504 | key:category ⚠️ | starter_emergency |
| 525 | key:category ⚠️ | optional_goal |
| 603 | key:category ⚠️ | optional_goal |
| 613 | key:label ⚠️ | Leftover cash |
| 615 | key:category ⚠️ | true_leftover |

### `packages/core/engine/recommendedActions.ts`

| line | origin | string |
|---|---|---|
| 7 | other ⚠️ | optional_goal |
| 74 | expr ⚠️ | optional_goal |
| 106 | expr ⚠️ | optional_goal |

### `packages/core/engine/testAllocation.ts`

| line | origin | string |
|---|---|---|
| 30 | key:id ⚠️ | expense-rent |
| 31 | key:name ⚠️ | Rent |
| 38 | key:id ⚠️ | expense-phone |
| 39 | key:name ⚠️ | Phone Bill |
| 48 | key:id ⚠️ | debt-card |
| 49 | key:name ⚠️ | Credit Card |
| 63 | call:assertMoney ⚠️ | basicShortfall totalRequired |
| 64 | call:assertMoney ⚠️ | basicShortfall shortfall |
| 65 | call:assertMoney ⚠️ | basicShortfall remaining |
| 69 | call:assertEqual ⚠️ | basicShortfall unfundedRequiredItems length |
| 80 | key:id ⚠️ | debt-large |
| 81 | key:name ⚠️ | Large Card |
| 91 | key:id ⚠️ | debt-small |
| 92 | key:name ⚠️ | Small Card |
| 112 | call:assertEqual ⚠️ | debt-small |
| 113 | call:assertEqual ⚠️ | snowball should target smallest remaining balance first |
| 124 | key:id ⚠️ | debt-large |
| 125 | key:name ⚠️ | Large Card |
| 135 | key:id ⚠️ | debt-small |
| 136 | key:name ⚠️ | Small Card |
| 156 | call:assertEqual ⚠️ | debt-large |
| 157 | call:assertEqual ⚠️ | avalanche should target highest APR first |
| 169 | key:id ⚠️ | goal-emergency |
| 170 | key:name ⚠️ | Starter Emergency Fund |
| 181 | call:assertEqual ⚠️ | cushion_buffer |
| 182 | call:assertEqual ⚠️ | cash buffer should be allocated before emergency goal |
| 187 | call:assertMoney ⚠️ | cash buffer amount |
| 192 | call:assertMoney ⚠️ | emergency goal receives remaining cash after buffer |
| 202 | key:id ⚠️ | expense-future |
| 203 | key:name ⚠️ | Future Bill |
| 218 | call:assertMoney ⚠️ | items due exactly on next paycheck date belong to the next cycle (excluded) |
| 236 | key:name ⚠️ | Internet |
| 238 | call:assertEqual ⚠️ | an affordable unpaid required bill counts as skipped |
| 243 | key:name ⚠️ | Internet |
| 245 | call:assertEqual ⚠️ | a paid required bill is not counted as skipped |
| 250 | key:name ⚠️ | Internet |
| 252 | call:assertEqual ⚠️ | autopay required items are not counted as skipped |
| 255 | call:assertEqual ⚠️ | unaffordable (shortfall) required items are forgiven |
| 264 | key:name ⚠️ | Rent |
| 265 | key:name ⚠️ | Card |
| 271 | key:name ⚠️ | Couch |
| 272 | key:name ⚠️ | Vacation |
| 275 | call:assertMoney ⚠️ | priority sinking fund funds before debt (couch $200) |
| 276 | call:assertEqual ⚠️ | a non-priority savings goal gets nothing when the snowball consumes the extra |
| 278 | call:assertMoney ⚠️ | the snowball is reduced by exactly what the sinking fund took |
| 283 | key:name ⚠️ | Couch |
| 285 | call:assertEqual ⚠️ | the same goal WITHOUT priority funds after debt → nothing here |
| 291 | key:name ⚠️ | Couch |
| 293 | call:assertMoney ⚠️ | the per-paycheck cap paces the sinking fund ($75, not the full $200) |
| 294 | call:assertMoney ⚠️ | the uncapped remainder still reaches debt this cycle |
| 311 | key:id ⚠️ | expense-groceries |
| 312 | key:name ⚠️ | Groceries |
| 327 | call:assertMoney ⚠️ | [A2] a weekly bill inside a monthly cycle is reserved for EVERY occurrence |
| 338 | key:id ⚠️ | expense-sitter |
| 339 | key:name ⚠️ | Sitter |
| 353 | call:assertMoney ⚠️ | [A2] a biweekly bill inside a monthly cycle counts twice |
| 366 | key:id ⚠️ | expense-rent |
| 367 | key:name ⚠️ | Rent |
| 374 | key:id ⚠️ | expense-later |
| 375 | key:name ⚠️ | Due after payday |
| 389 | call:assertMoney ⚠️ | [A2] a monthly bill counts once, and one due after the next payday counts zero |
| 392 | call:console.log ⚠️ | ✅ Allocation regression tests passed. |

### `packages/core/forecast/projectForecast.ts`

| line | origin | string |
|---|---|---|
| 63 | expr ⚠️ | Recovery is not currently projected within the visible forecast window. |
| 64 | expr ⚠️ | Cash pressure is projected to gradually improve across upcoming cycles. |
| 65 | expr ⚠️ | Projected cushion remains within a healthier range. |
| 80 | array ⚠️ | Projected cushion remains below target |
| 81 | array ⚠️ | Available cushion stays under the recommended safety threshold |
| 82 | array ⚠️ | Cash reserve remains tighter than recommended |
| 93 | call:drivers.push ⚠️ | Debt minimum obligations remain elevated |
| 101 | return ⚠️ | Pause aggressive payoff and protect required payments first. |
| 112 | return ⚠️ | Current payoff pace appears sustainable. |
| 120 | other ⚠️ | en-US |
| 122 | key:currency ⚠️ | USD |

### `packages/core/guardian/buildGuardianBrief.ts`

| line | origin | string |
|---|---|---|
| 17 | other ⚠️ | at-risk |
| 125 | call:round(v)).toLocaleString ⚠️ | en-US |
| 137 | return ⚠️ | These figures are from a little while ago — a quick refresh keeps this exact. |
| 139 | return ⚠️ | I'm planning from the low side while I learn what your paychecks reliably clear. |
| 140 | return ⚠️ | I'm holding a small safety net while I get to know your bills. |
| 180 | expr ⚠️ | a little tight |
| 192 | key:title ⚠️ | A paycheck didn't land |
| 212 | key:title ⚠️ | Let's refresh your numbers |
| 214 | key:detail ⚠️ | Your paycheck, bills, or balances are more than a few weeks old, so I can't tell you if you'll make it this paycheck with confidence. |
| 215 | expr ⚠️ | Update your numbers and I'll plan from where you actually are. |
| 230 | expr ⚠️ | toward your savings |
| 232 | expr ⚠️ | toward debt |
| 244 | key:title ⚠️ | This paycheck won't cover everything |
| 246 | expr ⚠️ | bills and minimums |
| 247 | expr ⚠️ | — this one needs a plan. |
| 263 | expr ⚠️ | Looks clear this paycheck |
| 263 | expr ⚠️ | A little tight this paycheck |
| 263 | expr ⚠️ | Tight this paycheck |
| 264 | expr ⚠️ | — a bit tight this one, so keep an eye on the essentials. |
| 278 | expr ⚠️ | at-risk |
| 278 | expr ⚠️ | Very tight this paycheck |
| 278 | expr ⚠️ | A little tight this paycheck |
| 283 | expr ⚠️ | at-risk |
| 283 | expr ⚠️ | a little under |
| 297 | key:title ⚠️ | Your line's held |
| 299 | key:safeMove ⚠️ | Nothing extra goes out this paycheck, and your emergency fund tops back up as your cushion rebuilds. |
| 315 | expr ⚠️ | your savings |
| 319 | key:title ⚠️ | Looks clear this paycheck |
| 323 | expr ⚠️ | to your goals |
| 323 | expr ⚠️ | to debt |
| 333 | key:title ⚠️ | Looks clear this paycheck |
| 335 | expr ⚠️ | your goals |
| 347 | expr ⚠️ | your debts |
| 348 | expr ⚠️ | your emergency fund |
| 354 | key:title ⚠️ | Looks clear this paycheck |

### `packages/core/guardian/calibrationScore.ts`

| line | origin | string |
|---|---|---|
| 28 | other ⚠️ | false_clear |
| 28 | other ⚠️ | false_tight |
| 40 | other ⚠️ | false_clear |
| 40 | other ⚠️ | false_tight |
| 63 | expr ⚠️ | false_clear |
| 63 | expr ⚠️ | false_tight |
| 110 | expr ⚠️ | false_clear |
| 115 | other ⚠️ | dominantError |
| 119 | expr ⚠️ | false_clear |
| 120 | expr ⚠️ | false_tight |

### `packages/core/guardian/computeState.ts`

| line | origin | string |
|---|---|---|
| 33 | return ⚠️ | at-risk |
| 47 | expr ⚠️ | at-risk |
| 49 | return ⚠️ | at-risk |
| 54 | return ⚠️ | at-risk |

### `packages/core/guardian/notificationDecision.ts`

| line | origin | string |
|---|---|---|
| 23 | key:"at-risk" ⚠️ | at-risk |
| 40 | other ⚠️ | not-risk |
| 40 | other ⚠️ | already-notified |
| 40 | other ⚠️ | freq-capped |
| 40 | other ⚠️ | risk-onset |
| 68 | expr ⚠️ | at-risk |
| 68 | key:reason ⚠️ | not-risk |
| 73 | key:reason ⚠️ | already-notified |
| 78 | key:reason ⚠️ | freq-capped |
| 81 | key:reason ⚠️ | risk-onset |

### `packages/core/guardian/testAffordability.ts`

| line | origin | string |
|---|---|---|
| 11 | call:console.log ⚠️ | Running affordability (2.9) tests... |
| 16 | call:assertEqual ⚠️ | $300 of $600 (floor $200) → comfortable (cushion $300 ≥ floor) |
| 17 | call:assertEqual ⚠️ | …cushion after = $300 |
| 18 | call:assertEqual ⚠️ | …nothing short |
| 21 | call:assertEqual ⚠️ | cushion exactly at the floor ($200) → comfortable |
| 25 | call:assertEqual ⚠️ | $500 of $600 → tight (cushion $100 < floor $200) |
| 26 | call:assertEqual ⚠️ | …cushion after = $100 |
| 30 | call:assertEqual ⚠️ | $750 of $600 → short |
| 31 | call:assertEqual ⚠️ | …short by $150 |
| 32 | call:assertEqual ⚠️ | …cushion floored at 0 (the gap is reported via shortBy) |
| 35 | call:assertEqual ⚠️ | floor 0: spending all discretionary → comfortable |
| 36 | call:assertEqual ⚠️ | floor 0: a dollar over → short |
| 39 | call:assertEqual ⚠️ | NaN discretionary → treated as 0 → short |
| 40 | call:assertEqual ⚠️ | no discretionary → any purchase is short |
| 42 | call:console.log ⚠️ | ✅ Affordability (2.9) tests passed. |

### `packages/core/guardian/testBuildGuardianBrief.ts`

| line | origin | string |
|---|---|---|
| 21 | call:console.log ⚠️ | Running Payday Cushion Guardian (2.4) tests... |
| 25 | key:focusDebtName ⚠️ | Store Card |
| 26 | call:assertEqual ⚠️ | premium: covered with headroom above the line → clear (not a false 'tight') |
| 27 | call:assertTrue ⚠️ | single-target extra names the debt directly ('toward Store Card') |
| 30 | key:focusDebtName ⚠️ | Store Card |
| 31 | call:assertTrue ⚠️ | a spread extra reads 'across your debts, starting with …', not 'to Store Card' |
| 32 | call:assertTrue ⚠️ | a spread extra safe move reads 'Apply the spare … across your debts' |
| 35 | key:focusDebtName ⚠️ | Store Card |
| 35 | key:tradeoffTargetName ⚠️ | Emergency Fund |
| 36 | call:assertTrue ⚠️ | tradeoff: leads with applying the spare to the debt + the why |
| 37 | call:assertTrue ⚠️ | tradeoff: two-sided (the EF alternative) + 'your call' |
| 38 | key:focusDebtName ⚠️ | Store Card |
| 39 | call:assertTrue ⚠️ | mechanical: single decisive 'Apply the spare …' |
| 40 | call:assertTrue ⚠️ | mechanical: no two-sided 'your call' |
| 42 | call:assertEqual ⚠️ | free: SAME headroom → clear (the split doesn't change the band) |
| 43 | call:assertEqual ⚠️ | free gets no safeMove (the card shows the invitation) |
| 44 | call:assertTrue ⚠️ | free copy never claims the app acted |
| 47 | call:assertEqual ⚠️ | premium viz cushion = kept ($200) |
| 48 | call:assertEqual ⚠️ | free viz cushion = kept ($50 — under the line, the value prop) |
| 52 | call:assertEqual ⚠️ | headroom under the line → tight |
| 53 | call:assertTrue ⚠️ | tight premium keeps everything, deploys nothing |
| 54 | call:assertTrue ⚠️ | tight reads CALM — 'covered' + 'rebuilds next paycheck' (2.4.11.2) |
| 58 | call:assertEqual ⚠️ | at-risk |
| 58 | call:assertEqual ⚠️ | a shortfall → at-risk |
| 59 | call:assertTrue ⚠️ | shortfall → paused extra payoff (never cuts an obligation) |
| 60 | call:assertEqual ⚠️ | the brief carries the shortfall amount |
| 64 | call:assertEqual ⚠️ | This paycheck won't cover everything |
| 64 | call:assertEqual ⚠️ | free shortfall → the honest title (not softened to 'a bit tight') |
| 65 | call:assertTrue ⚠️ | free shortfall → tells the amount short |
| 66 | call:assertEqual ⚠️ | free shortfall → no safeMove (the built plan is premium) |
| 67 | call:assertEqual ⚠️ | free shortfall carries the amount for the state-aware invite |
| 70 | call:assertTrue ⚠️ | reachedFloor true when kept cushion meets the line |
| 71 | call:assertEqual ⚠️ | reachedFloor false when the kept cushion is under the line |
| 74 | key:label ⚠️ | Sep 2 |
| 75 | call:lookahead.includes ⚠️ | Sep 2 |
| 75 | call:assertTrue ⚠️ | an upcoming non-clear cycle → a lookahead heads-up |
| 76 | key:label ⚠️ | Sep 2 |
| 77 | call:assertEqual ⚠️ | a clear upcoming cycle → no lookahead noise |
| 81 | call:assertTrue ⚠️ | no NaN/Infinity in any copy |
| 82 | call:assertTrue ⚠️ | viz numbers are always finite |
| 83 | call:assertEqual ⚠️ | a NaN floor falls back to the $200 default |
| 87 | call:assertEqual ⚠️ | heldReserve is exposed on the viz for the bar's set-aside zone |
| 89 | call:assertEqual ⚠️ | heldReserve clamps to the cushion (can't exceed what it lives inside) |
| 90 | call:assertEqual ⚠️ | no reserve → heldReserve 0 (zone hidden) |
| 94 | key:focusDebtName ⚠️ | Store Card |
| 95 | call:assertTrue ⚠️ | a $96 deploy reads EXACTLY '$96' in the detail, never hedged to $95 |
| 96 | call:assertTrue ⚠️ | …and '$96' EXACT in the action, matching the plan |
| 97 | key:focusDebtName ⚠️ | Store Card |
| 98 | call:assertTrue ⚠️ | a $2 deploy never renders as '$0' |
| 99 | call:assertTrue ⚠️ | a $2 deploy reads exactly '$2' (exact, not fuzzed) |
| 103 | key:focusDebtName ⚠️ | Store Card |
| 104 | call:assertTrue ⚠️ | missed paycheck → pausedDeploy flag set |
| 105 | call:assertTrue ⚠️ | paused: honest 'a paycheck didn't land', not a verdict |
| 106 | call:assertEqual ⚠️ | paused: deploy to debt is 0 (never planned on phantom income) |
| 107 | call:assertTrue ⚠️ | paused: no phantom-income clear/deploy copy |
| 108 | call:assertTrue ⚠️ | paused: says it paused moving money to debt |
| 110 | call:assertEqual ⚠️ | paused: free gets no safeMove |
| 120 | call:assertEqual ⚠️ | fresh + nothing live → no hedge |
| 124 | call:assertEqual ⚠️ | aging → exactly one hedge |
| 125 | call:assertTrue ⚠️ | aging → the refresh hedge |
| 127 | call:assertTrue ⚠️ | aging freshness hedges the FREE read too |
| 131 | call:assertTrue ⚠️ | cold-start → the income hedge |
| 133 | call:assertTrue ⚠️ | discovery → the bills hedge |
| 137 | call:assertEqual ⚠️ | three live signals → still exactly ONE hedge |
| 138 | call:assertTrue ⚠️ | priority: freshness (aging) wins over the learning hedges |
| 140 | call:assertTrue ⚠️ | priority: lean-unverified wins over bills-completeness |
| 144 | call:assertEqual ⚠️ | free + learning holdbacks live → no hedge (free doesn't learn) |
| 148 | call:assertTrue ⚠️ | stale → staleAdvisory flag for the neutral card render |
| 149 | call:assertTrue ⚠️ | stale → the 'refresh your numbers' cutoff, not a verdict |
| 150 | call:assertEqual ⚠️ | the cutoff replaces the read — no residual hedge |
| 152 | call:assertTrue ⚠️ | stale supersedes even a shortfall read |
| 154 | call:assertEqual ⚠️ | stale cutoff: free gets no safeMove |
| 155 | call:assertTrue ⚠️ | stale cutoff: premium gets the update prompt |
| 158 | key:deployTargetName ⚠️ | Emergency Fund |
| 159 | call:assertEqual ⚠️ | debt-free: the band still follows headroom (clear) |
| 160 | call:assertTrue ⚠️ | debt-free brief carries the debtFree flag (the card relabels the bar legend to 'To savings') |
| 161 | call:assertTrue ⚠️ | debt-free clear-deploy: the spare goes 'toward your Emergency Fund' |
| 162 | call:assertTrue ⚠️ | debt-free clear-deploy: never says 'debt' |
| 163 | call:assertTrue ⚠️ | debt-free safe move: savings-framed ('toward your Emergency Fund'), never 'payment' |
| 166 | call:assertTrue ⚠️ | debt-free with no named goal → 'toward your savings' |
| 168 | key:deployTargetName ⚠️ | Emergency Fund |
| 169 | call:assertTrue ⚠️ | debt-free spread → 'across your savings, starting with …' |
| 170 | call:assertTrue ⚠️ | debt-free spread safe move → 'across your savings, starting with …' |
| 173 | call:assertTrue ⚠️ | debt-free tight → calm 'rebuilds next paycheck', never 'payoff' |
| 177 | call:assertTrue ⚠️ | topped-up → 'Your line's held', not a plain 'looks clear' |
| 178 | call:assertTrue ⚠️ | …acknowledges the savings move |
| 181 | call:assertTrue ⚠️ | debt-free clear-no-deploy → 'free up more for your goals' |
| 184 | call:assertTrue ⚠️ | debt-free shortfall → 'bills' (no minimums exist debt-free) |
| 185 | call:assertTrue ⚠️ | debt-free shortfall → 'Extra savings is paused' |
| 188 | call:assertTrue ⚠️ | debt-free paused → 'moving money to savings', not 'to debt' |
| 191 | call:assertTrue ⚠️ | with-debt brief still names the debt + debtFree unset |
| 198 | call:console.log ⚠️ | ✅ Payday Cushion Guardian (2.4) tests passed. |

### `packages/core/guardian/testCalibrationScore.ts`

| line | origin | string |
|---|---|---|
| 45 | call:console.log ⚠️ | Running Guardian calibration scoring (2.4.9) tests... |
| 48 | call:assertEqual ⚠️ | predicted hold + actual hold → match |
| 49 | call:assertEqual ⚠️ | false_clear |
| 49 | call:assertEqual ⚠️ | predicted hold + actual breach → false_clear (the owned miss) |
| 50 | call:assertEqual ⚠️ | false_tight |
| 50 | call:assertEqual ⚠️ | predicted breach + actual hold → false_tight (over-caution) |
| 51 | call:assertEqual ⚠️ | predicted breach + actual breach → match (correctly called the tight cycle) |
| 52 | call:assertEqual ⚠️ | floor tolerance: cushion at floor−1 counts as reached |
| 53 | call:assertEqual ⚠️ | floor tolerance: cushion at floor−2 is a breach |
| 60 | call:assertEqual ⚠️ | all 4 gradeable cycles counted |
| 61 | call:assertEqual ⚠️ | 2 matches |
| 62 | call:assertEqual ⚠️ | 1 false-clear |
| 63 | call:assertEqual ⚠️ | 1 false-tight |
| 64 | call:assertEqual ⚠️ | matchRate = matches / n |
| 65 | call:assertEqual ⚠️ | false_clear |
| 65 | call:assertEqual ⚠️ | equal errors → own the false-clear (un-spinnable direction) |
| 66 | call:assertEqual ⚠️ | n=4 ≥ gate → proven |
| 70 | call:assertEqual ⚠️ | false_clear |
| 70 | call:assertEqual ⚠️ | false-clear-heavy → dominant false_clear |
| 72 | call:assertEqual ⚠️ | false_tight |
| 72 | call:assertEqual ⚠️ | false-tight-heavy → dominant false_tight |
| 74 | call:assertEqual ⚠️ | no errors → dominantError null |
| 75 | call:assertEqual ⚠️ | no errors → matchRate 1 |
| 79 | call:assertEqual ⚠️ | empty history → matchRate null |
| 82 | call:assertEqual ⚠️ | unconfirmed outcome excluded |
| 83 | call:assertEqual ⚠️ | disturbed cycle excluded (§3.2) |
| 84 | call:assertEqual ⚠️ | restamped-mid-cycle excluded |
| 91 | call:assertEqual ⚠️ | provisional (cold-start) read excluded — grades committed reads, not caution |
| 96 | call:assertEqual ⚠️ | missed paycheck excluded (a no-show ≠ a prediction miss, §2.4.7.7a) |
| 101 | call:assertEqual ⚠️ | default regime = debt → only the debt cycle |
| 102 | call:assertEqual ⚠️ | debtFree regime → only the debt-free cycle |
| 103 | call:assertEqual ⚠️ | …and it's graded (false-clear) |
| 107 | call:assertEqual ⚠️ | fixed income + no surprise + predicted hold → NOT counted (tautological) |
| 108 | call:assertEqual ⚠️ | fixed income + a surprise moved the cushion → counted |
| 109 | call:assertEqual ⚠️ | …and graded as a false-clear (surprise breached the floor) |
| 110 | call:assertEqual ⚠️ | fixed income + the read itself called a below-floor cycle → counted |
| 111 | call:assertEqual ⚠️ | …and it matched (correctly called tight) |
| 114 | call:assertEqual ⚠️ | no stored floor → default $200 line, still grades (250 hold → 150 breach) |
| 116 | call:console.log ⚠️ | ✅ Guardian calibration scoring (2.4.9) tests passed. |

### `packages/core/guardian/testComputeState.ts`

| line | origin | string |
|---|---|---|
| 17 | call:check ⚠️ | base: <half-floor → at-risk |
| 17 | expr ⚠️ | at-risk |
| 18 | call:check ⚠️ | base: half-floor..floor → tight |
| 19 | call:check ⚠️ | base: ≥floor → clear |
| 20 | call:check ⚠️ | base: exactly floor → clear |
| 21 | call:check ⚠️ | base: exactly at-risk line → tight (boundary is <, not ≤) |
| 24 | call:check ⚠️ | stateless read = base |
| 25 | call:check ⚠️ | stateless read = base (null prior) |
| 25 | expr ⚠️ | at-risk |
| 28 | call:check ⚠️ | clear→tight immediate on dropping below floor |
| 29 | call:check ⚠️ | clear→at-risk immediate on dropping below half-floor |
| 29 | expr ⚠️ | at-risk |
| 30 | call:check ⚠️ | tight→at-risk immediate on breaching the at-risk line |
| 30 | expr ⚠️ | at-risk |
| 33 | call:check ⚠️ | tight stays tight while ≤ floor+BAND (no flap) |
| 34 | call:check ⚠️ | tight→clear only when > floor+BAND |
| 35 | call:check ⚠️ | at-risk stays at-risk while ≤ atRiskLine+BAND |
| 35 | call:computeState ⚠️ | at-risk |
| 35 | expr ⚠️ | at-risk |
| 36 | call:check ⚠️ | at-risk→tight when clearly above the at-risk line (but under floor+BAND) |
| 36 | call:computeState ⚠️ | at-risk |
| 37 | call:check ⚠️ | at-risk→clear when > floor+BAND |
| 37 | call:computeState ⚠️ | at-risk |
| 40 | call:check ⚠️ | NaN discretionary → treated as 0 → at-risk |
| 40 | expr ⚠️ | at-risk |
| 41 | call:check ⚠️ | non-positive floor falls back to 200 |
| 43 | call:console.log ⚠️ | ✅ Guardian computeState (unified state machine) tests passed. |

### `packages/core/guardian/testGuardianPartition.ts`

| line | origin | string |
|---|---|---|
| 41 | key:name ⚠️ | Rent |
| 42 | key:name ⚠️ | Electric |
| 44 | key:name ⚠️ | Groceries |
| 45 | key:name ⚠️ | Visa |
| 69 | call:assertMoney ⚠️ | normal: buckets sum to discretionary |
| 70 | call:assertMoney ⚠️ | normal: discretionary = 2000 − 850 − 400 |
| 71 | call:assertMoney ⚠️ | normal: cushion = the reserved buffer (200) |
| 72 | call:assertMoney ⚠️ | normal: put-to-work = 550 to debt |
| 77 | call:assertMoney ⚠️ | no-deploy: buckets sum to discretionary |
| 78 | call:assertMoney ⚠️ | no-deploy: cushion = all of it (buffer + true_leftover) |
| 79 | call:assertMoney ⚠️ | no-deploy: nothing put to work |
| 84 | call:assertMoney ⚠️ | tight: discretionary = 150 |
| 85 | call:assertMoney ⚠️ | tight: buckets sum to discretionary |
| 86 | array ⚠️ | cushion_buffer |
| 86 | call:assertMoney ⚠️ | tight: cushion_buffer clamps to min(floor, discretionary) |
| 91 | call:assertMoney ⚠️ | shortfall: discretionary = 0 |
| 92 | call:assertMoney ⚠️ | shortfall: all discretionary buckets 0 |
| 100 | array ⚠️ | discovery_holdback |
| 100 | call:assertMoney ⚠️ | holdback: discovery_holdback = 40% of above-floor headroom (550) = 220 |
| 101 | call:assertMoney ⚠️ | holdback: buckets STILL sum to discretionary |
| 102 | call:assertMoney ⚠️ | holdback: deploy DAMPENED (550 → 330) |
| 103 | call:assertMoney ⚠️ | holdback: held cash counts as PROTECTED (200 buffer + 220 held) |
| 108 | array ⚠️ | discovery_holdback |
| 108 | call:assertMoney ⚠️ | holdback: discovery + cold-start compose by MAX (220), not sum |
| 114 | array ⚠️ | prefunded_reserve |
| 114 | call:assertMoney ⚠️ | holdback: prefunded gets its OWN bucket (2.4.7.6 split) |
| 115 | array ⚠️ | discovery_holdback |
| 115 | call:assertMoney ⚠️ | holdback: discovery is the remainder (220, not lumped with prefunded) |
| 116 | call:assertMoney ⚠️ | holdback: protected = buffer 200 + prefunded 100 + discovery 220 (snowball gets the remaining 230) |
| 117 | call:assertMoney ⚠️ | holdback+prefunded: buckets still sum to discretionary |
| 122 | call:assertMoney ⚠️ | holdback/no-deploy: buckets sum to discretionary |
| 123 | call:assertMoney ⚠️ | holdback/no-deploy: all of it protected (buffer + held + leftover) |
| 124 | call:assertMoney ⚠️ | holdback/no-deploy: nothing put to work |
| 128 | call:assertMoney ⚠️ | no holdbacks → 0 |
| 132 | call:assertMoney ⚠️ | within headroom → prefunded 300 + max(discovery,coldStart) 200 = 500 |
| 137 | call:assertMoney ⚠️ | over headroom → clamped to above-floor (aboveFloor=100: prefunded 80 + min(60, 20) = 100) |
| 142 | call:assertMoney ⚠️ | prefunded WINS the collision (takes the full 100 headroom, uncertainty gets 0) |
| 144 | call:assertMoney ⚠️ | deploy = max(0, 300−200−100) = 0, never negative |
| 145 | call:assertMoney ⚠️ | deploy = 1000−200−500 = 300 |
| 151 | call:assertMoney ⚠️ | variable buffer alone → held (30) |
| 156 | call:assertMoney ⚠️ | variable buffer composes by MAX with discovery — not stacked (200, never 230) |
| 161 | call:assertMoney ⚠️ | variable buffer wins the max when it's the larger reason (30 > discovery 10) |
| 167 | call:assertMoney ⚠️ | variable buffer: discretionary = 2000 − (850+200) − 400 |
| 168 | array ⚠️ | discovery_holdback |
| 168 | call:assertMoney ⚠️ | variable buffer held as protected cushion (200 × 0.15) |
| 169 | call:assertMoney ⚠️ | deploy reduced by the $30 variable buffer (550 − 200 buffer floor − 30) |
| 170 | call:assertMoney ⚠️ | variable buffer: buckets still sum to discretionary |
| 176 | array ⚠️ | discovery_holdback |
| 176 | call:assertMoney ⚠️ | held = max(discovery 140, variable 30) — variable absorbed, not 170 |
| 177 | call:assertMoney ⚠️ | deploy = 350 − 140 (the larger reserve), not 350 − 170 |
| 182 | array ⚠️ | discovery_holdback |
| 182 | call:assertMoney ⚠️ | no variable buffer when the fraction is 0 (free undampened) |
| 186 | key:name ⚠️ | EF |
| 194 | key:name ⚠️ | Visa |
| 204 | array ⚠️ | starter_emergency |
| 204 | call:assertMoney ⚠️ | starter EF funds the $1000 cap before debt |
| 205 | call:assertMoney ⚠️ | debt gets the remainder AFTER the starter EF (not before) |
| 206 | call:assertMoney ⚠️ | no fuller EF (paycheck exhausted by starter + debt) |
| 207 | call:assertMoney ⚠️ | starter split: buckets sum to discretionary |
| 212 | array ⚠️ | starter_emergency |
| 212 | call:assertMoney ⚠️ | gate: no starter EF when savings are elsewhere |
| 213 | call:assertMoney ⚠️ | gate: everything deploys to debt first |
| 219 | array ⚠️ | starter_emergency |
| 219 | call:assertMoney ⚠️ | waterfall: starter EF $1000 before debt |
| 220 | call:assertMoney ⚠️ | waterfall: debt paid after the starter |
| 221 | call:assertMoney ⚠️ | waterfall: fuller EF finishes the goal AFTER debt (3000 − 1000 starter) |
| 222 | array ⚠️ | starter_emergency |
| 222 | call:assertMoney ⚠️ | the two EF tranches never over-fund past the target |
| 223 | array ⚠️ | true_leftover |
| 223 | call:assertMoney ⚠️ | genuine leftover after the full waterfall |
| 228 | array ⚠️ | starter_emergency |
| 228 | call:assertMoney ⚠️ | already above the $1000 starter → no pre-debt EF |
| 229 | call:assertMoney ⚠️ | fuller EF tops up the remaining 1500 after debt |
| 232 | call:console.log ⚠️ | ✅ Guardian partition + holdback-clamp tests passed. |

### `packages/core/guardian/testNotificationDecision.ts`

| line | origin | string |
|---|---|---|
| 10 | var:NOW ⚠️ | 2026-08-01T10:00:00 |
| 14 | key:band ⚠️ | at-risk |
| 21 | call:console.log ⚠️ | Running Guardian notification-decision (2.4.10) tests... |
| 27 | call:assertEqual ⚠️ | not-risk |
| 31 | key:band ⚠️ | at-risk |
| 32 | call:assertEqual ⚠️ | at-risk, no prior notify, empty log → fire |
| 33 | call:assertEqual ⚠️ | risk-onset |
| 33 | call:assertEqual ⚠️ | …reason risk-onset |
| 34 | call:assertEqual ⚠️ | at-risk |
| 34 | call:assertEqual ⚠️ | …level at-risk |
| 37 | key:notifiedRiskLevel ⚠️ | at-risk |
| 38 | call:assertEqual ⚠️ | already notified at-risk THIS cycle → suppressed |
| 39 | call:assertEqual ⚠️ | already-notified |
| 39 | call:assertEqual ⚠️ | …reason already-notified |
| 42 | key:notifiedRiskLevel ⚠️ | at-risk |
| 43 | call:assertEqual ⚠️ | prior notify was a DIFFERENT cycle → new at-risk fires |
| 47 | call:assertEqual ⚠️ | escalation tight→at-risk this cycle → fire |
| 51 | call:assertEqual ⚠️ | 2 pushes in the last 30 days → capped (even on a fresh at-risk) |
| 52 | call:assertEqual ⚠️ | freq-capped |
| 52 | call:assertEqual ⚠️ | …reason freq-capped |
| 56 | call:assertEqual ⚠️ | 1 push in-window (other is 40d old) → fires |
| 59 | call:assertEqual ⚠️ | 1 in-window push → still under the cap → fires |
| 62 | call:assertEqual ⚠️ | counts only pushes within the window |
| 63 | array ⚠️ | not-a-date |
| 63 | call:assertEqual ⚠️ | ignores future + unparseable timestamps |
| 64 | call:assertEqual ⚠️ | empty log → 0 |
| 67 | call:assertEqual ⚠️ | not-risk |
| 67 | call:assertEqual ⚠️ | clear short-circuits before the cap check |
| 69 | call:console.log ⚠️ | ✅ Guardian notification-decision (2.4.10) tests passed. |

### `packages/core/history/selectVisibleHistory.ts`

| line | origin | string |
|---|---|---|
| 20 | call:hasFeatureAccess ⚠️ | unlimited_history |

### `packages/core/imports/debtCsv.ts`

| line | origin | string |
|---|---|---|
| 9 | array ⚠️ | one-time |
| 9 | array ⚠️ | per-paycheck |
| 73 | array ⚠️ | CSV must include a header row and at least one debt row. |

### `packages/core/income/testSuggestLean.ts`

| line | origin | string |
|---|---|---|
| 17 | call:assertMoney ⚠️ | N=0 → keeps the current lean |
| 22 | call:assertMoney ⚠️ | N<12 → shrinkage floor = typical(2000) × 0.85 |
| 23 | call:assertTrue ⚠️ | reports the actual count |
| 26 | call:assertMoney ⚠️ | N<12, no typical → max(2100) × 0.85 |
| 32 | call:assertMoney ⚠️ | N≥18 → pure 12th percentile (1800), not the 2125 shrinkage |
| 38 | call:assertTrue ⚠️ | a wild high entry can't inflate lean (percentile ignores it) |
| 46 | call:assertTrue ⚠️ | N=15 handoff blends (between percentile 1668 and shrinkage 2125) |
| 47 | call:assertMoney ⚠️ | N=15 handoff = 0.5·shrinkage + 0.5·percentile |
| 51 | call:assertMoney ⚠️ | exactly N=12 → still shrinkage (w=0), no lurch |
| 53 | call:console.log ⚠️ | ✅ Income-learning suggestLean (2.4.7.8) tests passed. |

### `packages/core/insights/buildSmartInsights.ts`

| line | origin | string |
|---|---|---|
| 46 | key:title ⚠️ | Recovery Needed |
| 55 | key:title ⚠️ | Tight Cycle Warning |
| 57 | expr ⚠️ | Run minimum-only until the next paycheck if any new expenses appear. |
| 62 | key:title ⚠️ | Buffer looks stable |
| 64 | key:action ⚠️ | You can continue the current plan without needing a stabilization adjustment. |
| 75 | key:title ⚠️ | Safe Extra Payment |
| 81 | key:action ⚠️ | Make this payment only after required bills and minimums are handled. |
| 91 | key:title ⚠️ | Near Payoff Opportunity |
| 96 | expr ⚠️ | Focus on restoring cushion first, then target this payoff opportunity once cash pressure improves. |
| 98 | expr ⚠️ | Make this payment after handling required bills and minimums to immediately free up that monthly minimum. |
| 108 | key:title ⚠️ | Interest Reduction Insight |
| 110 | expr ⚠️ | Prioritize the highest APR debt first to reduce long-term interest cost. |
| 115 | key:title ⚠️ | Payoff Timing Difference |
| 116 | key:message ⚠️ | Snowball and avalanche produce different payoff timelines with your current balances and extra-payment plan. |
| 117 | key:action ⚠️ | Use snowball for faster momentum or avalanche when interest reduction matters more. |
| 124 | key:title ⚠️ | Stability First |
| 125 | key:message ⚠️ | Your buffer is critically low this cycle. A single unexpected expense could put required payments at risk. |
| 126 | key:action ⚠️ | Treat staying current as the win for this cycle and avoid aggressive extra payoff until cushion improves. |
| 133 | key:title ⚠️ | Progress Still Continues |
| 135 | key:action ⚠️ | Even smaller progress cycles help stabilize long-term payoff momentum. |
| 144 | other ⚠️ | en-US |
| 146 | key:currency ⚠️ | USD |

### `packages/core/obligations/classifyDeferability.ts`

| line | origin | string |
|---|---|---|
| 15 | array ⚠️ | subscriptions |
| 15 | array ⚠️ | discretionary |

### `packages/core/obligations/testClassifyDeferability.ts`

| line | origin | string |
|---|---|---|
| 18 | key:name ⚠️ | Bill |
| 22 | key:category ⚠️ | subscriptions |
| 22 | call:assertEq ⚠️ | subscriptions → deferrable |
| 26 | key:category ⚠️ | discretionary |
| 26 | call:assertEq ⚠️ | discretionary → deferrable ([D25]) |
| 27 | key:category ⚠️ | discretionary |
| 27 | call:assertEq ⚠️ | …and the user can still override it back to essential |
| 33 | call:assertEq ⚠️ | other → essential (can't classify → don't call it safe) |
| 34 | call:assertEq ⚠️ | uncategorized → essential |
| 37 | call:assertEq ⚠️ | override flips an essential category to deferrable |
| 38 | key:category ⚠️ | subscriptions |
| 38 | call:assertEq ⚠️ | override flips a deferrable category to essential |
| 40 | call:console.log ⚠️ | ✅ §2.6 classifyDeferability tests passed. |

### `packages/core/obligations/testEffectiveObligationAmount.ts`

| line | origin | string |
|---|---|---|
| 16 | key:name ⚠️ | Streaming |
| 20 | call:assertMoney ⚠️ | non-trial → amount |
| 26 | call:assertMoney ⚠️ | trial pre-conversion → intro amount ($0) |
| 33 | call:assertMoney ⚠️ | trial on kick-in date → full amount |
| 38 | call:assertMoney ⚠️ | trial after kick-in date → full amount (intro $2 ignored) |
| 42 | call:assertMoney ⚠️ | trial missing fullChargeDate → intro amount |
| 43 | call:assertMoney ⚠️ | trial missing fullAmount → intro amount |
| 47 | call:assertMoney ⚠️ | trial with non-finite fullAmount → intro amount (no NaN leak) |
| 58 | call:assertTrue ⚠️ | unchanged plain row keeps reference identity |
| 59 | call:assertTrue ⚠️ | pre-conversion trial keeps reference identity (amount unchanged) |
| 60 | call:assertTrue ⚠️ | converted trial is a new row at the full amount |
| 62 | call:assertMoney ⚠️ | resolveTrialAmounts is idempotent |
| 65 | call:console.log ⚠️ | ✅ §2.5 effective-obligation-amount (trial resolution) tests passed. |

### `packages/core/payCycle/getNextPaycheckDate.ts`

| line | origin | string |
|---|---|---|
| 51 | call:validateDayOfTheMonth ⚠️ | First semi-monthly pay day |
| 52 | call:validateDayOfTheMonth ⚠️ | Second semi-monthly pay day |
| 55 | other ⚠️ | Semi-monthly pay days must be different. |
| 72 | call:validateDayOfTheMonth ⚠️ | Monthly pay day |
| 84 | other ⚠️ | Unsupported pay cycle |

### `packages/core/payCycle/testPayCycle.ts`

| line | origin | string |
|---|---|---|
| 18 | call:assertEqual ⚠️ | weekly next paycheck |
| 27 | call:assertEqual ⚠️ | biweekly next paycheck |
| 37 | call:assertEqual ⚠️ | monthly upcoming same month paycheck |
| 47 | call:assertEqual ⚠️ | monthly next month paycheck |
| 57 | call:assertEqual ⚠️ | monthly payday clamps to last day of month |
| 68 | call:assertEqual ⚠️ | semi-monthly skips current day and finds next payday |
| 79 | call:assertEqual ⚠️ | semi-monthly rolls to next month |
| 90 | call:assertEqual ⚠️ | semi-monthly second payday clamps in February |
| 93 | call:console.log ⚠️ | ✅ Pay cycle regression tests passed. |

### `packages/core/payCycle/testPayCyclesPerMonth.ts`

| line | origin | string |
|---|---|---|
| 14 | call:assertClose ⚠️ | weekly = 52/12 |
| 15 | call:assertClose ⚠️ | biweekly = 26/12 |
| 16 | call:assertClose ⚠️ | semimonthly = 2 |
| 17 | call:assertClose ⚠️ | monthly = 1 |
| 22 | call:assertClose ⚠️ | biweekly monthly-equiv (was understated at 400) |
| 23 | call:assert ⚠️ | weekly must exceed the old 4 |
| 24 | call:assert ⚠️ | biweekly must exceed the old 2 |
| 26 | call:console.log ⚠️ | ✅ payCyclesPerMonth regression tests passed. |

### `packages/core/payCycle/testRollPaydayToFuture.ts`

| line | origin | string |
|---|---|---|
| 14 | call:assertEqual ⚠️ | future payday unchanged |
| 15 | call:assertEqual ⚠️ | payday == today is kept (it IS payday → sheet should fire) |
| 16 | call:assertEqual ⚠️ | empty stays empty |
| 20 | call:assertEqual ⚠️ | biweekly rolls to next real payday, phase preserved |
| 22 | call:assertEqual ⚠️ | biweekly landing on today returns today |
| 25 | call:assertEqual ⚠️ | weekly rolls to today |
| 26 | call:assertEqual ⚠️ | weekly rolls multiple weeks (6/1→…→7/6) |
| 33 | call:assertEqual ⚠️ | monthly (1st) rolls past the already-passed July payday to Aug 1 |
| 39 | call:assertEqual ⚠️ | monthly (15th) still upcoming this month is kept |
| 42 | call:console.log ⚠️ | ✅ rollPaydayToFuture regression tests passed. |

### `packages/core/recovery/testBuildRecoveryPlan.ts`

| line | origin | string |
|---|---|---|
| 20 | call:assertEq ⚠️ | ranked largest-first |
| 21 | call:assertEq ⚠️ | all three needed to cross the gap |
| 22 | call:assertEq ⚠️ | suggested set = the covering prefix |
| 23 | call:assertEq ⚠️ | running close caps at the gap (28→30, not 37) |
| 24 | call:assertTrue ⚠️ | 37 deferrable ≥ 30 gap → closeable |
| 25 | call:assertEq ⚠️ | closeable → no residual |
| 31 | call:assertEq ⚠️ | the $50 alone covers the $20 gap |
| 32 | call:assertEq ⚠️ | the small one is not needed |
| 38 | call:assertTrue ⚠️ | 35 deferrable < 100 gap → not closeable |
| 39 | call:assertEq ⚠️ | residual = 100 − 35 |
| 40 | call:assertEq ⚠️ | suggest deferring all, but it still won't close |
| 46 | call:assertTrue ⚠️ | no deferrable → not closeable |
| 47 | call:assertEq ⚠️ | residual = the whole gap |
| 48 | call:assertEq ⚠️ | nothing to suggest |
| 54 | call:assertTrue ⚠️ | gap 0 → trivially closeable |
| 55 | call:assertEq ⚠️ | gap 0 → suggest nothing |
| 56 | call:assertEq ⚠️ | gap 0 → no residual |
| 62 | call:assertTrue ⚠️ | exact match closes the gap |
| 63 | call:assertEq ⚠️ | the exact-match defer is suggested |
| 64 | call:assertEq ⚠️ | exact match → no residual |
| 70 | call:assertEq ⚠️ | essentials pass through as cover-now |
| 71 | call:assertEq ⚠️ | a $0 deferrable is dropped |
| 74 | call:console.log ⚠️ | ✅ §2.6 buildRecoveryPlan tests passed. |

### `packages/core/recurrence/rolloverPayCycle.ts`

| line | origin | string |
|---|---|---|
| 58 | other ⚠️ | per-paycheck |
| 59 | other ⚠️ | one-time |
| 71 | expr ⚠️ | one-time |
| 75 | expr ⚠️ | per-paycheck |
| 104 | expr ⚠️ | one-time |
| 132 | expr ⚠️ | one-time |

### `packages/core/recurrence/testRolloverDueDates.ts`

| line | origin | string |
|---|---|---|
| 15 | key:name ⚠️ | Rent |
| 27 | key:name ⚠️ | Card |
| 46 | call:assertEqual ⚠️ | Jan 31 monthly clamps to Feb 28 (not Mar 3) |
| 54 | call:assertEqual ⚠️ | anchor recovers the 31st after February (no drift) |
| 61 | call:assertEqual ⚠️ | Jan 30 monthly clamps to Feb 28 |
| 68 | call:assertEqual ⚠️ | debt Jan 31 monthly clamps to Feb 28 |
| 75 | call:assertEqual ⚠️ | mid-month date advances normally |
| 82 | call:assertEqual ⚠️ | unpaid expense retains its overdue due date |
| 87 | key:name ⚠️ | Registration |
| 87 | key:recurrence ⚠️ | one-time |
| 88 | key:name ⚠️ | Rent |
| 92 | call:assertEqual ⚠️ | paid one-time expense is dropped on rollover |
| 93 | call:assertEqual ⚠️ | the recurring expense survives the rollover |
| 94 | call:assertEqual ⚠️ | the recurring expense advances to the next cycle |
| 98 | key:name ⚠️ | Medical bill |
| 98 | key:recurrence ⚠️ | one-time |
| 101 | call:assertEqual ⚠️ | unpaid one-time expense carries over (still owed) |
| 102 | call:assertEqual ⚠️ | unpaid one-time keeps its due date |
| 104 | call:console.log ⚠️ | ✅ Rollover due-date (EOM clamp) + one-time drop regression tests passed. |

### `packages/core/scan/parseStatementText.ts`

| line | origin | string |
|---|---|---|
| 26 | array ⚠️ | American Express |
| 26 | array ⚠️ | Amex |
| 26 | array ⚠️ | Capital One |
| 26 | array ⚠️ | Bank of America |
| 26 | array ⚠️ | Wells Fargo |
| 26 | array ⚠️ | Apple Card |
| 27 | array ⚠️ | Chase |
| 27 | array ⚠️ | Citi |
| 27 | array ⚠️ | Citibank |
| 27 | array ⚠️ | Discover |
| 27 | array ⚠️ | Barclays |
| 27 | array ⚠️ | Synchrony |
| 27 | array ⚠️ | U.S. Bank |
| 27 | array ⚠️ | US Bank |
| 28 | array ⚠️ | PNC |
| 28 | array ⚠️ | TD Bank |
| 28 | array ⚠️ | USAA |
| 28 | array ⚠️ | Navy Federal |
| 28 | array ⚠️ | Klarna |
| 28 | array ⚠️ | Affirm |
| 28 | array ⚠️ | Afterpay |
| 28 | array ⚠️ | PayPal |
| 28 | array ⚠️ | Zip |
| 28 | array ⚠️ | Sezzle |
| 86 | var:AMT ⚠️ | [^\n\d]{0,30}\$?\s*([\d,]+\.\d{2}) |

### `packages/core/scan/testParseStatementText.ts`

| line | origin | string |
|---|---|---|
| 11 | call:console.log ⚠️ | Running scan statement parser (2.8.2) tests... |
| 15 | array ⚠️ | Chase Freedom Unlimited |
| 16 | array ⚠️ | Account ending 4821 |
| 17 | array ⚠️ | New Balance $2,431.09 |
| 18 | array ⚠️ | Minimum Payment Due $56.00 |
| 19 | array ⚠️ | Payment Due Date July 22, 2026 |
| 20 | array ⚠️ | Purchase APR 24.99% |
| 23 | call:assertEqual ⚠️ | Chase |
| 23 | call:assertEqual ⚠️ | issuer 'Chase' recognized |
| 24 | call:assertEqual ⚠️ | New Balance → 2431.09 |
| 25 | call:assertEqual ⚠️ | Minimum Payment Due → 56 |
| 26 | call:assertEqual ⚠️ | Purchase APR → 24.99 |
| 27 | call:assertEqual ⚠️ | Payment Due Date → ISO 2026-07-22 |
| 31 | array ⚠️ | Capital One |
| 32 | array ⚠️ | Statement Balance: $890.45 |
| 33 | array ⚠️ | Minimum Payment: $25.00 |
| 34 | array ⚠️ | Interest Rate 29.24% |
| 35 | array ⚠️ | Due Date 08/05/2026 |
| 38 | call:assertEqual ⚠️ | Capital One |
| 38 | call:assertEqual ⚠️ | issuer 'Capital One' |
| 39 | call:assertEqual ⚠️ | Statement Balance → 890.45 (not the minimum) |
| 40 | call:assertEqual ⚠️ | Minimum Payment → 25 (not the balance) |
| 41 | call:assertEqual ⚠️ | Interest Rate → 29.24 |
| 42 | call:assertEqual ⚠️ | Due Date 08/05/2026 → ISO |
| 46 | array ⚠️ | MOUNTAIN CREDIT UNION |
| 47 | array ⚠️ | Auto Loan |
| 48 | array ⚠️ | Current Balance $12,004.00 |
| 49 | array ⚠️ | Minimum Amount Due $312.50 |
| 50 | array ⚠️ | 18.5% APR |
| 51 | array ⚠️ | Payment Due 9-1-26 |
| 54 | call:assertEqual ⚠️ | MOUNTAIN CREDIT UNION |
| 54 | call:assertEqual ⚠️ | no known issuer → first meaningful line as the name |
| 55 | call:assertEqual ⚠️ | Current Balance → 12004 |
| 56 | call:assertEqual ⚠️ | Minimum Amount Due → 312.5 |
| 57 | call:assertEqual ⚠️ | '18.5% APR' → 18.5 |
| 58 | call:assertEqual ⚠️ | '9-1-26' → ISO 2026-09-01 (2-digit year) |
| 61 | call:parseStatementText ⚠️ | Discover it New Balance $500.00 (the rest was unreadable) |
| 62 | call:assertEqual ⚠️ | Discover |
| 62 | call:assertEqual ⚠️ | partial: issuer found |
| 63 | call:assertEqual ⚠️ | partial: balance found |
| 64 | call:assertEqual ⚠️ | partial: no minimum → undefined (not guessed) |
| 65 | call:assertEqual ⚠️ | partial: no APR → undefined |
| 66 | call:assertEqual ⚠️ | partial: no due date → undefined |
| 69 | call:assertEqual ⚠️ | empty string → {} |
| 70 | call:parseStatementText ⚠️ | no numbers here at all |
| 70 | call:assertEqual ⚠️ | text-only → just the fallback name |
| 72 | call:console.log ⚠️ | ✅ Scan statement parser (2.8.2) tests passed. |

### `packages/core/storage/debtPlannerStorage.ts`

| line | origin | string |
|---|---|---|
| 7 | other ⚠️ | subscriptions |
| 11 | other ⚠️ | discretionary |
| 124 | other ⚠️ | optional_goal |
| 133 | other ⚠️ | at-risk |
| 226 | var:CYCLE_HISTORY_STORAGE_KEY ⚠️ | debtPlanner.cycleHistory |

### `packages/core/timeline/buildMultiCycleTimeline.ts`

| line | origin | string |
|---|---|---|
| 148 | expr ⚠️ | one-time |
| 153 | expr ⚠️ | one-time |
| 224 | expr ⚠️ | one-time |
| 229 | expr ⚠️ | one-time |
| 274 | expr ⚠️ | starter_emergency |
| 274 | expr ⚠️ | optional_goal |

### `packages/core/timeline/buildTimelineItems.ts`

| line | origin | string |
|---|---|---|
| 13 | other ⚠️ | living_reserve |
| 15 | other ⚠️ | autopay_expense |
| 16 | other ⚠️ | minimum_debt |
| 17 | other ⚠️ | autopay_debt |
| 20 | other ⚠️ | optional_goal |
| 46 | key:label ⚠️ | Paycheck Received |
| 55 | key:label ⚠️ | Living Reserve |
| 57 | key:type ⚠️ | living_reserve |
| 80 | expr ⚠️ | autopay_expense |
| 98 | expr ⚠️ | autopay_debt |
| 98 | expr ⚠️ | minimum_debt |
| 106 | expr ⚠️ | cushion_buffer |
| 111 | key:label ⚠️ | Cash Buffer |
| 125 | other ⚠️ | optional_goal |
| 139 | expr ⚠️ | living_reserve |
| 143 | expr ⚠️ | living_reserve |

### `packages/core/types/recurrence.ts`

| line | origin | string |
|---|---|---|
| 2 | other ⚠️ | one-time |
| 6 | other ⚠️ | per-paycheck |

### `packages/core/utils/formatCurrency.ts`

| line | origin | string |
|---|---|---|
| 15 | other ⚠️ | en-US |
| 17 | key:currency ⚠️ | USD |

### `packages/core/utils/formatDisplayAmount.ts`

| line | origin | string |
|---|---|---|
| 3 | call:floor(abs).toLocaleString ⚠️ | en-US |
