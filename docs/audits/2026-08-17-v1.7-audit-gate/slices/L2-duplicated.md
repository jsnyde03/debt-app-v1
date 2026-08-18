## Duplicated across files — copy only

**76** of 101 cross-file duplicate strings carry copy.
The other 25 are style tokens, icon names,
routes and enum ids — repeated by design, and nothing a wording pass judges. They are excluded
here for the same reason the T2 gate and the T3 table exclude them: one classification, reused.

⚠️ A `copy+unclassified` tag means the SAME text is both a user-facing string somewhere and a
non-copy literal elsewhere (`"at-risk"` is a Guardian state id and a QA label). Judge the copy
instance; the others are coincidence, not divergence.

- **"Add"** _(copy)_ — `apps/rn/src/app/(tabs)/money.tsx:316` · `apps/rn/src/app/(tabs)/money.tsx:383` · `apps/rn/src/app/(tabs)/money.tsx:646` · `apps/rn/src/app/(tabs)/money.tsx:744` · `apps/rn/src/app/(tabs)/money.tsx:884` · `apps/rn/src/app/(tabs)/money.tsx:924` · `apps/rn/src/components/plan/WindfallSheet.tsx:80`
- **"Undo"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:552` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:240` · `apps/rn/src/components/plan/AffordabilityCard.tsx:128` · `apps/rn/src/components/plan/AffordabilityCard.tsx:149` · `apps/rn/src/components/plan/RecommendedActionsCard.tsx:70` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:219`
- **"/mo"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:66` · `apps/rn/src/app/(tabs)/money.tsx:480` · `apps/rn/src/app/(tabs)/money.tsx:480` · `apps/rn/src/components/entities/AmortizationView.tsx:67` · `apps/rn/src/components/payoff/WhatIfControls.tsx:83` · `apps/rn/src/store/guardianSelectors.ts:201`
- **"Autopay"** _(copy)_ — `apps/rn/src/app/(tabs)/money.tsx:470` · `apps/rn/src/app/(tabs)/money.tsx:728` · `apps/rn/src/components/entities/DebtSheet.tsx:351` · `apps/rn/src/components/entities/ExpenseSheet.tsx:105` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:262` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:260`
- **"Got it"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:501` · `apps/rn/src/app/(tabs)/index.tsx:519` · `apps/rn/src/app/(tabs)/index.tsx:536` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:164` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:167`
- **"Save"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:249` · `apps/rn/src/components/entities/ExpenseSheet.tsx:86` · `apps/rn/src/components/entities/GoalSheet.tsx:60` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:49` · `apps/rn/src/components/plan/CushionFloorSheet.tsx:48`
- **"Looks clear this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:24` · `packages/core/guardian/buildGuardianBrief.ts:263` · `packages/core/guardian/buildGuardianBrief.ts:319` · `packages/core/guardian/buildGuardianBrief.ts:333` · `packages/core/guardian/buildGuardianBrief.ts:354`
- **"Today"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:82` · `apps/rn/src/components/more/LiveActivityQA.tsx:39` · `apps/rn/src/components/more/LiveActivityQA.tsx:43` · `apps/rn/src/liveActivity/paydayActivityContent.ts:53`
- **"Progress"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:87` · `apps/rn/src/app/(tabs)/progress.tsx:95` · `apps/rn/src/app/(tabs)/progress.tsx:110` · `apps/rn/src/app/(tabs)/progress.tsx:158`
- **"Add a debt"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:281` · `apps/rn/src/app/(tabs)/progress.tsx:115` · `apps/rn/src/components/entities/DebtSheet.tsx:239` · `apps/rn/src/components/entities/DebtSheet.tsx:239`
- **"BNPL"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:470` · `apps/rn/src/store/guardianSelectors.ts:329` · `packages/core/debt/bnplSchedule.ts:42` · `packages/core/debt/bnplSchedule.ts:65`
- **"Monthly"** _(copy+unclassified)_ — `apps/rn/src/app/paywall.tsx:60` · `apps/rn/src/app/paywall.tsx:77` · `apps/rn/src/store/obligationForm.ts:24` · `apps/rn/src/store/paycheckForm.ts:34`
- **"Payoff schedule"** _(copy+unclassified)_ — `apps/rn/src/app/schedule/[id].tsx:25` · `apps/rn/src/app/schedule/[id].tsx:31` · `apps/rn/src/components/entities/AmortizationView.tsx:102` · `apps/rn/src/components/ui/ListRow.tsx:152`
- **"Name"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:296` · `apps/rn/src/components/entities/ExpenseSheet.tsx:91` · `apps/rn/src/components/entities/GoalSheet.tsx:65` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:54`
- **"Amount"** _(copy)_ — `apps/rn/src/components/entities/ExpenseSheet.tsx:92` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:170` · `apps/rn/src/components/plan/AffordabilityCard.tsx:164` · `apps/rn/src/components/plan/WindfallSheet.tsx:85`
- **"/paycheck"** _(copy)_ — `apps/rn/src/components/money/BillBreakdownSheet.tsx:73` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:87` · `apps/rn/src/components/plan/SaveForItSheet.tsx:123` · `apps/rn/src/store/guardianSelectors.ts:198`
- **"Not now"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:575` · `apps/rn/src/components/plan/LeanSuggestionCard.tsx:41` · `apps/rn/src/components/plan/TutorialInviteCard.tsx:44`
- **"Premium"** _(copy)_ — `apps/rn/src/app/more.tsx:106` · `apps/rn/src/app/more.tsx:122` · `apps/rn/src/app/paywall.tsx:208`
- **"Klarna"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:53` · `apps/rn/src/components/entities/DebtSheet.tsx:53` · `packages/core/scan/parseStatementText.ts:28`
- **"Affirm"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:54` · `apps/rn/src/components/entities/DebtSheet.tsx:54` · `packages/core/scan/parseStatementText.ts:28`
- **"Afterpay"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:55` · `apps/rn/src/components/entities/DebtSheet.tsx:55` · `packages/core/scan/parseStatementText.ts:28`
- **"Zip"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:57` · `apps/rn/src/components/entities/DebtSheet.tsx:57` · `packages/core/scan/parseStatementText.ts:28`
- **"Sezzle"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:58` · `apps/rn/src/components/entities/DebtSheet.tsx:58` · `packages/core/scan/parseStatementText.ts:28`
- **"Other"** _(copy+technical+unclassified)_ — `apps/rn/src/components/entities/DebtSheet.tsx:59` · `apps/rn/src/components/entities/DebtSheet.tsx:59` · `apps/rn/src/store/obligationForm.ts:61`
- **"A little tight this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:35` · `packages/core/guardian/buildGuardianBrief.ts:263` · `packages/core/guardian/buildGuardianBrief.ts:278`
- **"Paid"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:269` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:406` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:219`
- **"Close"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:327` · `apps/rn/src/components/ui/AnimatedSheet.tsx:82` · `apps/rn/src/components/ui/FormSheet.tsx:157`
- **"Cushion"** _(copy+unclassified)_ — `apps/rn/src/components/plan/FloorImpactBar.tsx:76` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:277` · `apps/rn/src/components/progress/CashFlowSection.tsx:65`
- **"Delete"** _(copy)_ — `apps/rn/src/components/ui/ListRow.tsx:144` · `apps/rn/src/components/ui/ListRow.tsx:154` · `apps/rn/src/utils/confirm.ts:18`
- **"Money"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:92` · `apps/rn/src/app/(tabs)/money.tsx:112`
- **"/wk"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:67` · `apps/rn/src/store/guardianSelectors.ts:196`
- **"/qtr"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:70` · `apps/rn/src/store/guardianSelectors.ts:199`
- **"/yr"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:71` · `apps/rn/src/store/guardianSelectors.ts:200`
- **"Living Expenses"** _(copy)_ — `apps/rn/src/app/living-expenses.tsx:34` · `apps/rn/src/app/more.tsx:278`
- **"More"** _(copy)_ — `apps/rn/src/app/more.tsx:91` · `apps/rn/src/components/more-button.tsx:45`
- **"Unlock Premium"** _(copy)_ — `apps/rn/src/app/more.tsx:131` · `apps/rn/src/components/plan/DemoDock.tsx:119`
- **"Export backup"** _(copy)_ — `apps/rn/src/app/more.tsx:179` · `apps/rn/src/components/more/BackupSheets.tsx:35`
- **"Import backup"** _(copy)_ — `apps/rn/src/app/more.tsx:180` · `apps/rn/src/components/more/BackupSheets.tsx:77`
- **"Your name"** _(copy)_ — `apps/rn/src/app/more.tsx:202` · `apps/rn/src/components/onboarding/CompletionStep.tsx:66`
- **"About"** _(copy)_ — `apps/rn/src/app/more.tsx:282` · `apps/rn/src/components/plan/AffordabilityCard.tsx:202`
- **"Privacy Policy"** _(copy)_ — `apps/rn/src/app/more.tsx:284` · `apps/rn/src/app/paywall.tsx:331`
- **"Private by design"** _(copy)_ — `apps/rn/src/app/more.tsx:343` · `apps/rn/src/components/onboarding/CompletionStep.tsx:17`
- **"Cancel"** _(copy)_ — `apps/rn/src/app/more.tsx:361` · `apps/rn/src/utils/confirm.ts:17`
- **"See it in action"** _(copy)_ — `apps/rn/src/app/paywall.tsx:315` · `apps/rn/src/components/onboarding/WelcomeStep.tsx:39`
- **"An ongoing cost that doesn't end."** _(copy+unclassified)_ — `apps/rn/src/components/entities/AddObligationSheet.tsx:41` · `apps/rn/src/components/entities/ExpenseSheet.tsx:85`
- **"PayPal"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:56` · `packages/core/scan/parseStatementText.ts:28`
- **"Log a payment"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:276` · `apps/rn/src/components/entities/LogPaymentSheet.tsx:34`
- **"Type"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:298` · `apps/rn/src/components/entities/GoalSheet.tsx:69`
- **"e.g. 100"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:308` · `apps/rn/src/components/plan/SaveForItSheet.tsx:149`
- **"Current balance"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:320` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:139`
- **"e.g. 2400"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:320` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:145`
- **"Minimum payment"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:345` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:152`
- **"e.g. 22.99"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:346` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:163`
- **"Due date"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:347` · `apps/rn/src/components/entities/ExpenseSheet.tsx:94`
- **"Recurrence"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:348` · `apps/rn/src/components/entities/ExpenseSheet.tsx:95`
- **"Log payment"** _(copy)_ — `apps/rn/src/components/entities/LogPaymentSheet.tsx:46` · `apps/rn/src/components/ui/ListRow.tsx:151`
- **"Done"** _(copy)_ — `apps/rn/src/components/more/BackupSheets.tsx:37` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:279`
- **"Tomorrow"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:35` · `apps/rn/src/liveActivity/paydayActivityContent.ts:54`
- **"Very tight this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:39` · `packages/core/guardian/buildGuardianBrief.ts:278`
- **"e.g. 1200"** _(copy+unclassified)_ — `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:176` · `apps/rn/src/store/paycheckForm.ts:41`
- **"Continue"** _(copy)_ — `apps/rn/src/components/onboarding/PaycheckStep.tsx:69` · `apps/rn/src/components/plan/PaidOffFinale.tsx:128`
- **"Required"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:265` · `apps/rn/src/components/plan/PlanHero.tsx:89`
- **"Start my real plan"** _(copy)_ — `apps/rn/src/components/plan/DemoDock.tsx:113` · `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:73`
- **"Example money"** _(copy+unclassified)_ — `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:14` · `apps/rn/src/components/plan/TutorialOverlay.tsx:427`
- **"Keep going"** _(copy)_ — `apps/rn/src/components/plan/MilestoneAckCard.tsx:45` · `apps/rn/src/components/plan/VanquishedBeat.tsx:138`
- **"Share your win"** _(copy+unclassified)_ — `apps/rn/src/components/plan/PaidOffFinale.tsx:127` · `apps/rn/src/components/plan/VanquishedBeat.tsx:89`
- **"Safety net"** _(copy)_ — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:272` · `packages/core/engine/allocatePaycheck.ts:579`
- **"your emergency fund"** _(copy+unclassified)_ — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:358` · `packages/core/guardian/buildGuardianBrief.ts:348`
- **"Spoken for"** _(copy)_ — `apps/rn/src/components/plan/PlanHero.tsx:90` · `apps/rn/src/components/plan/SpokenForSheet.tsx:44`
- **"Overdue"** _(copy)_ — `apps/rn/src/components/plan/RequiredActionsCard.tsx:280` · `apps/rn/src/store/planSelectors.ts:247`
- **"Vanquished"** _(copy)_ — `apps/rn/src/components/plan/ShareCard.tsx:50` · `apps/rn/src/components/plan/VanquishedBeat.tsx:116`
- **"Paid off"** _(copy)_ — `apps/rn/src/components/plan/ShareCard.tsx:51` · `apps/rn/src/components/plan/VanquishedBeat.tsx:126`
- **"Back"** _(copy)_ — `apps/rn/src/components/plan/TutorialOverlay.tsx:452` · `apps/rn/src/components/screen.tsx:67`
- **"Share"** _(copy)_ — `apps/rn/src/components/plan/VanquishedBeat.tsx:137` · `apps/rn/src/components/progress/VanquishedArchive.tsx:73`
- **"Weekly"** _(copy+unclassified)_ — `apps/rn/src/store/obligationForm.ts:25` · `apps/rn/src/store/paycheckForm.ts:31`
- **"to your goals"** _(copy)_ — `apps/rn/src/store/planSelectors.ts:313` · `packages/core/guardian/buildGuardianBrief.ts:323`

