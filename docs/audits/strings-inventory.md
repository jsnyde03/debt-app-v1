# User-facing strings — inventory

> ⛔ **GENERATED. Do not edit.** Regenerate with `npm run audit:strings`.
> This is the **input** to the wording/voice gate, not its output. Findings belong in a dated
> audit folder; this file is only ever the current state of the codebase.

**826** copy · **346** unclassified · **50** excluded as machinery · **75** copy strings appearing in more than one file (of 99 repeated strings overall).

<details><summary>Excluded as machinery — the contexts, so the exclusions can be challenged</summary>

- `key:category`
- `key:fontFamily`
- `key:id`
- `key:name`
- `key:reason`
- `key:value`

</details>

## ⚠️ Unclassified — a prop nobody has sorted yet

These sit in JSX attributes that are in neither the copy list nor the technical list. Each is
either copy that the gate must read, or machinery that belongs in `TECHNICAL_PROPS`. Leaving one
here is how a surface goes unreviewed while the count looks complete.

- `call:99%',
].join`
- `call:Keyboard.addListener`
- `call:NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format`
- `call:NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format`
- `call:NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format`
- `call:amount).toLocaleString`
- `call:announce`
- `call:console.warn`
- `call:covered).toLocaleString`
- `call:d.toLocaleString`
- `call:date.toLocaleString`
- `call:drivers.push`
- `call:floor(abs).toLocaleString`
- `call:fullAmount.toLocaleString`
- `call:isFinite(n) ? n : 0)).toLocaleString`
- `call:max(0, n)).toLocaleString`
- `call:month).toLocaleString`
- `call:probeCoachMark`
- `call:reportError`
- `call:require`
- `call:requireNativeModule`
- `call:requireNativeViewManager`
- `call:round(n).toLocaleString`
- `call:round(v)).toLocaleString`
- `call:router.navigate`
- `call:router.push`
- `call:router.replace`
- `call:schedule`
- `call:shareDebtCard`
- `call:useStore`
- `call:validateDayOfTheMonth`
- `call:value.toLocaleString`
- `key:'account-balance-wallet'`
- `key:'add-circle-outline'`
- `key:'annually'`
- `key:'at-risk'`
- `key:'auto-graph'`
- `key:'biweekly'`
- `key:'check-circle'`
- `key:'chevron-left'`
- `key:'chevron-right'`
- `key:'error-outline'`
- `key:'expand-more'`
- `key:'gpp-bad'`
- `key:'gpp-good'`
- `key:'gpp-maybe'`
- `key:'monthly'`
- `key:'one-time'`
- `key:'per-paycheck'`
- `key:'quarterly'`
- `key:'shopping-cart'`
- `key:'tab-money'`
- `key:'tab-progress'`
- `key:'task-alt'`
- `key:'trending-down'`
- `key:'trending-up'`
- `key:'verified-user'`
- `key:'weekly'`
- `key:afternoon`
- `key:amountPositive`
- `key:assignment`
- `key:balanceRequired`
- `key:bills`
- `key:biweekly`
- `key:boxShadow`
- `key:buttonTitle`
- `key:cancel`
- `key:celebration`
- `key:clause`
- `key:clear`
- `key:coach`
- `key:currency`
- `key:cycle`
- `key:debts`
- `key:discretionary`
- `key:display`
- `key:errors`
- `key:estimatedDebtFreeDate`
- `key:evening`
- `key:examples`
- `key:fallbackLabel`
- `key:free`
- `key:goals`
- `key:healing`
- `key:history`
- `key:housing`
- `key:insurance`
- `key:leanAboveTypical`
- `key:leanRequired`
- `key:line`
- `key:lock`
- `key:medical`
- `key:mimeType`
- `key:minimumRequired`
- `key:mono`
- `key:morning`
- `key:nameRequired`
- `key:next`
- `key:other`
- `key:placeholder`
- `key:portfolioMaxProgress`
- `key:premium`
- `key:projectedDebtFreeDate`
- `key:promptMessage`
- `key:provider`
- `key:recoveryTrend`
- `key:savings`
- `key:screen`
- `key:seam`
- `key:search`
- `key:sf`
- `key:shield`
- `key:star`
- `key:sub`
- `key:subscriptions`
- `key:subsystem`
- `key:systemIcon`
- `key:tight`
- `key:type`
- `key:update`
- `key:utilities`
- `other`
- `prop:amount`
- `prop:amountSuffix`
- `prop:error`
- `prop:getComponent`
- `prop:meta`
- `prop:onBack`
- `prop:onDemo`
- `prop:onPress`
- `prop:onSeeForecast`
- `prop:options`
- `prop:previewConfig`
- `prop:sub`
- `var:AFFORD_PREVIEW_ID`
- `var:AMT`
- `var:BILL_CATEGORY_ORDER`
- `var:CYCLE_HISTORY_STORAGE_KEY`
- `var:DEBT_RC_IOS_KEY`
- `var:DEFERRABLE_CATEGORIES`
- `var:EXAMPLE_MONEY`
- `var:FREEDOM_SCHEME_URL`
- `var:FREEDOM_STORE_URL`
- `var:KEY`
- `var:LIFETIME_SUBNOTE`
- `var:LIVE_ACTIVITY_APP_GROUP`
- `var:MANAGE_SUBSCRIPTION_URL`
- `var:PAYCHECK_LEAN_HELP`
- `var:PAYDAY_ACTIVITY_DEEPLINK`
- `var:PRIVACY_POLICY_URL`
- `var:QUARANTINE_PREFIX`
- `var:SUPPORT_URL`
- `var:TERMS_OF_USE_URL`
- `var:TUTORIAL_WRITABLE_PREFS`
- `var:WIDGET_APP_GROUP`
- `var:WIDGET_KIND`
- `var:WIDGET_SNAPSHOT_KEY`
- `var:actualUnpayable`
- `var:appleTargets`
- `var:attestLabel`
- `var:beatA11y`
- `var:canEstimate`
- `var:caption`
- `var:captionText`
- `var:coverFromSavings`
- `var:ctaLabel`
- `var:cushionStatus`
- `var:debtFreeDate`
- `var:dest`
- `var:dominantError`
- `var:effName`
- `var:freeInvite`
- `var:goalLabel`
- `var:line`
- `var:look`
- `var:lowCushionDrivers`
- `var:message`
- `var:minUnpayable`
- `var:minimumsDateLabel`
- `var:provider`
- `var:purchaseName`
- `var:recalibration`
- `var:requiredSub`
- `var:safeMove`
- `var:statusLabel`
- `var:target`
- `var:targetName`
- `var:title`
- `var:verb`
- `var:verdict`

## Duplicated across files — copy only

**75** of 99 cross-file duplicate strings carry copy.
The other 24 are style tokens, icon names,
routes and enum ids — repeated by design, and nothing a wording pass judges. They are excluded
here for the same reason the T2 gate and the T3 table exclude them: one classification, reused.

⚠️ A `copy+unclassified` tag means the SAME text is both a user-facing string somewhere and a
non-copy literal elsewhere (`"at-risk"` is a Guardian state id and a QA label). Judge the copy
instance; the others are coincidence, not divergence.

- **"Add"** _(copy)_ — `apps/rn/src/app/(tabs)/money.tsx:315` · `apps/rn/src/app/(tabs)/money.tsx:382` · `apps/rn/src/app/(tabs)/money.tsx:642` · `apps/rn/src/app/(tabs)/money.tsx:722` · `apps/rn/src/app/(tabs)/money.tsx:847` · `apps/rn/src/app/(tabs)/money.tsx:887` · `apps/rn/src/components/plan/WindfallSheet.tsx:80`
- **"Undo"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:521` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:240` · `apps/rn/src/components/plan/AffordabilityCard.tsx:128` · `apps/rn/src/components/plan/AffordabilityCard.tsx:149` · `apps/rn/src/components/plan/RecommendedActionsCard.tsx:70` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:219`
- **"/mo"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:65` · `apps/rn/src/app/(tabs)/money.tsx:479` · `apps/rn/src/app/(tabs)/money.tsx:479` · `apps/rn/src/components/entities/AmortizationView.tsx:67` · `apps/rn/src/components/payoff/WhatIfControls.tsx:83` · `apps/rn/src/store/guardianSelectors.ts:201`
- **"Autopay"** _(copy)_ — `apps/rn/src/app/(tabs)/money.tsx:469` · `apps/rn/src/app/(tabs)/money.tsx:706` · `apps/rn/src/components/entities/DebtSheet.tsx:350` · `apps/rn/src/components/entities/ExpenseSheet.tsx:103` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:262` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:258`
- **"Got it"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:470` · `apps/rn/src/app/(tabs)/index.tsx:488` · `apps/rn/src/app/(tabs)/index.tsx:505` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:111` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:114`
- **"Save"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:248` · `apps/rn/src/components/entities/ExpenseSheet.tsx:85` · `apps/rn/src/components/entities/GoalSheet.tsx:60` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:49` · `apps/rn/src/components/plan/CushionFloorSheet.tsx:48`
- **"Looks clear this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:24` · `packages/core/guardian/buildGuardianBrief.ts:263` · `packages/core/guardian/buildGuardianBrief.ts:319` · `packages/core/guardian/buildGuardianBrief.ts:333` · `packages/core/guardian/buildGuardianBrief.ts:354`
- **"Today"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:82` · `apps/rn/src/components/more/LiveActivityQA.tsx:39` · `apps/rn/src/components/more/LiveActivityQA.tsx:43` · `apps/rn/src/liveActivity/paydayActivityContent.ts:53`
- **"Progress"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:87` · `apps/rn/src/app/(tabs)/progress.tsx:95` · `apps/rn/src/app/(tabs)/progress.tsx:110` · `apps/rn/src/app/(tabs)/progress.tsx:158`
- **"Add a debt"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:251` · `apps/rn/src/app/(tabs)/progress.tsx:115` · `apps/rn/src/components/entities/DebtSheet.tsx:238` · `apps/rn/src/components/entities/DebtSheet.tsx:238`
- **"BNPL"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:469` · `apps/rn/src/store/guardianSelectors.ts:329` · `packages/core/debt/bnplSchedule.ts:42` · `packages/core/debt/bnplSchedule.ts:65`
- **"Monthly"** _(copy+unclassified)_ — `apps/rn/src/app/paywall.tsx:60` · `apps/rn/src/app/paywall.tsx:77` · `apps/rn/src/store/obligationForm.ts:24` · `apps/rn/src/store/paycheckForm.ts:34`
- **"Payoff schedule"** _(copy+unclassified)_ — `apps/rn/src/app/schedule/[id].tsx:25` · `apps/rn/src/app/schedule/[id].tsx:31` · `apps/rn/src/components/entities/AmortizationView.tsx:102` · `apps/rn/src/components/ui/ListRow.tsx:152`
- **"Name"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:295` · `apps/rn/src/components/entities/ExpenseSheet.tsx:90` · `apps/rn/src/components/entities/GoalSheet.tsx:65` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:54`
- **"Amount"** _(copy)_ — `apps/rn/src/components/entities/ExpenseSheet.tsx:91` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:170` · `apps/rn/src/components/plan/AffordabilityCard.tsx:164` · `apps/rn/src/components/plan/WindfallSheet.tsx:85`
- **"/paycheck"** _(copy)_ — `apps/rn/src/components/money/BillBreakdownSheet.tsx:70` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:84` · `apps/rn/src/components/plan/SaveForItSheet.tsx:123` · `apps/rn/src/store/guardianSelectors.ts:198`
- **"Not now"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:544` · `apps/rn/src/components/plan/LeanSuggestionCard.tsx:41` · `apps/rn/src/components/plan/TutorialInviteCard.tsx:44`
- **"Premium"** _(copy)_ — `apps/rn/src/app/more.tsx:105` · `apps/rn/src/app/more.tsx:121` · `apps/rn/src/app/paywall.tsx:208`
- **"Klarna"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:52` · `apps/rn/src/components/entities/DebtSheet.tsx:52` · `packages/core/scan/parseStatementText.ts:28`
- **"Affirm"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:53` · `apps/rn/src/components/entities/DebtSheet.tsx:53` · `packages/core/scan/parseStatementText.ts:28`
- **"Afterpay"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:54` · `apps/rn/src/components/entities/DebtSheet.tsx:54` · `packages/core/scan/parseStatementText.ts:28`
- **"Zip"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:56` · `apps/rn/src/components/entities/DebtSheet.tsx:56` · `packages/core/scan/parseStatementText.ts:28`
- **"Sezzle"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:57` · `apps/rn/src/components/entities/DebtSheet.tsx:57` · `packages/core/scan/parseStatementText.ts:28`
- **"Other"** _(copy+technical+unclassified)_ — `apps/rn/src/components/entities/DebtSheet.tsx:58` · `apps/rn/src/components/entities/DebtSheet.tsx:58` · `apps/rn/src/store/obligationForm.ts:61`
- **"A little tight this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:35` · `packages/core/guardian/buildGuardianBrief.ts:263` · `packages/core/guardian/buildGuardianBrief.ts:278`
- **"Paid"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:269` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:406` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:219`
- **"Close"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:327` · `apps/rn/src/components/ui/AnimatedSheet.tsx:82` · `apps/rn/src/components/ui/FormSheet.tsx:157`
- **"Cushion"** _(copy+unclassified)_ — `apps/rn/src/components/plan/FloorImpactBar.tsx:76` · `apps/rn/src/components/plan/PaydayGuardianCard.tsx:277` · `apps/rn/src/components/progress/CashFlowSection.tsx:65`
- **"Delete"** _(copy)_ — `apps/rn/src/components/ui/ListRow.tsx:144` · `apps/rn/src/components/ui/ListRow.tsx:154` · `apps/rn/src/utils/confirm.ts:18`
- **"Money"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:92` · `apps/rn/src/app/(tabs)/money.tsx:111`
- **"/wk"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:66` · `apps/rn/src/store/guardianSelectors.ts:196`
- **"/qtr"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:69` · `apps/rn/src/store/guardianSelectors.ts:199`
- **"/yr"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:70` · `apps/rn/src/store/guardianSelectors.ts:200`
- **"reserved per paycheck"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:659` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:57`
- **"Living Expenses"** _(copy)_ — `apps/rn/src/app/living-expenses.tsx:34` · `apps/rn/src/app/more.tsx:277`
- **"More"** _(copy)_ — `apps/rn/src/app/more.tsx:90` · `apps/rn/src/components/more-button.tsx:45`
- **"Unlock Premium"** _(copy)_ — `apps/rn/src/app/more.tsx:130` · `apps/rn/src/components/plan/DemoDock.tsx:79`
- **"Export backup"** _(copy)_ — `apps/rn/src/app/more.tsx:178` · `apps/rn/src/components/more/BackupSheets.tsx:35`
- **"Import backup"** _(copy)_ — `apps/rn/src/app/more.tsx:179` · `apps/rn/src/components/more/BackupSheets.tsx:77`
- **"Your name"** _(copy)_ — `apps/rn/src/app/more.tsx:201` · `apps/rn/src/components/onboarding/CompletionStep.tsx:66`
- **"About"** _(copy)_ — `apps/rn/src/app/more.tsx:281` · `apps/rn/src/components/plan/AffordabilityCard.tsx:202`
- **"Privacy Policy"** _(copy)_ — `apps/rn/src/app/more.tsx:283` · `apps/rn/src/app/paywall.tsx:331`
- **"Private by design"** _(copy)_ — `apps/rn/src/app/more.tsx:339` · `apps/rn/src/components/onboarding/CompletionStep.tsx:17`
- **"Cancel"** _(copy)_ — `apps/rn/src/app/more.tsx:357` · `apps/rn/src/utils/confirm.ts:17`
- **"See it in action"** _(copy)_ — `apps/rn/src/app/paywall.tsx:315` · `apps/rn/src/components/onboarding/WelcomeStep.tsx:39`
- **"An ongoing cost that doesn't end."** _(copy+unclassified)_ — `apps/rn/src/components/entities/AddObligationSheet.tsx:41` · `apps/rn/src/components/entities/ExpenseSheet.tsx:84`
- **"PayPal"** _(copy+technical)_ — `apps/rn/src/components/entities/DebtSheet.tsx:55` · `packages/core/scan/parseStatementText.ts:28`
- **"Log a payment"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:275` · `apps/rn/src/components/entities/LogPaymentSheet.tsx:34`
- **"Type"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:297` · `apps/rn/src/components/entities/GoalSheet.tsx:69`
- **"e.g. 100"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:307` · `apps/rn/src/components/plan/SaveForItSheet.tsx:149`
- **"Current balance"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:319` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:139`
- **"e.g. 2400"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:319` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:145`
- **"Minimum payment"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:344` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:152`
- **"e.g. 22.99"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:345` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:163`
- **"Recurrence"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:347` · `apps/rn/src/components/entities/ExpenseSheet.tsx:93`
- **"Log payment"** _(copy)_ — `apps/rn/src/components/entities/LogPaymentSheet.tsx:46` · `apps/rn/src/components/ui/ListRow.tsx:151`
- **"Done"** _(copy)_ — `apps/rn/src/components/more/BackupSheets.tsx:37` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:279`
- **"Tomorrow"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:35` · `apps/rn/src/liveActivity/paydayActivityContent.ts:54`
- **"Very tight this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:39` · `packages/core/guardian/buildGuardianBrief.ts:278`
- **"e.g. 1200"** _(copy+unclassified)_ — `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:176` · `apps/rn/src/store/paycheckForm.ts:41`
- **"Continue"** _(copy)_ — `apps/rn/src/components/onboarding/PaycheckStep.tsx:69` · `apps/rn/src/components/plan/PaidOffFinale.tsx:128`
- **"Required"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:265` · `apps/rn/src/components/plan/PlanHero.tsx:79`
- **"Start my real plan"** _(copy)_ — `apps/rn/src/components/plan/DemoDock.tsx:73` · `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:73`
- **"Example money"** _(copy+unclassified)_ — `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:14` · `apps/rn/src/components/plan/TutorialOverlay.tsx:320`
- **"Keep going"** _(copy)_ — `apps/rn/src/components/plan/MilestoneAckCard.tsx:45` · `apps/rn/src/components/plan/VanquishedBeat.tsx:138`
- **"Share your win"** _(copy+unclassified)_ — `apps/rn/src/components/plan/PaidOffFinale.tsx:127` · `apps/rn/src/components/plan/VanquishedBeat.tsx:89`
- **"Safety net"** _(copy)_ — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:272` · `packages/core/engine/allocatePaycheck.ts:483`
- **"your emergency fund"** _(copy+unclassified)_ — `apps/rn/src/components/plan/PaydayGuardianCard.tsx:358` · `packages/core/guardian/buildGuardianBrief.ts:348`
- **"Overdue"** _(copy)_ — `apps/rn/src/components/plan/RequiredActionsCard.tsx:278` · `apps/rn/src/store/planSelectors.ts:247`
- **"Vanquished"** _(copy)_ — `apps/rn/src/components/plan/ShareCard.tsx:50` · `apps/rn/src/components/plan/VanquishedBeat.tsx:116`
- **"Paid off"** _(copy)_ — `apps/rn/src/components/plan/ShareCard.tsx:51` · `apps/rn/src/components/plan/VanquishedBeat.tsx:126`
- **"Back"** _(copy)_ — `apps/rn/src/components/plan/TutorialOverlay.tsx:345` · `apps/rn/src/components/screen.tsx:67`
- **"Share"** _(copy)_ — `apps/rn/src/components/plan/VanquishedBeat.tsx:137` · `apps/rn/src/components/progress/VanquishedArchive.tsx:73`
- **"Weekly"** _(copy+unclassified)_ — `apps/rn/src/store/obligationForm.ts:25` · `apps/rn/src/store/paycheckForm.ts:31`
- **"to your goals"** _(copy)_ — `apps/rn/src/store/planSelectors.ts:310` · `packages/core/guardian/buildGuardianBrief.ts:323`

## Copy gated on a condition — is the gate the thing the copy claims?

The audit gate's proxy-gate sweep, as a list. For each row ask one question: **does the
condition actually establish what the words assert, or does it merely correlate with it?**

The live instance this was built from read exactly like a row here —
`prefill` → `"Add from scan"` / `"Add a debt"` — where `prefill` had stopped meaning "scanned"
the moment a second producer was added. Two audit passes and three green web specs missed it.

| file | condition | when true | when false |
|---|---|---|---|
| `apps/rn/src/app/(tabs)/index.tsx:515` | `intentRollback.kind === 'log-payment'` | "Payment logged — I updated your balance." | "Payday landed — I rolled your plan forward to this paycheck." |
| `apps/rn/src/app/(tabs)/money.tsx:352` | `strategy === 'snowball'` | "Smallest balance first — quick wins. Your debts are listed in payoff order." | "Highest APR first — least interest. Your debts are listed in payoff order." |
| `apps/rn/src/app/(tabs)/money.tsx:479` | `isBnpl` | "/mo" | "/mo" |
| `apps/rn/src/app/(tabs)/money.tsx:654` | `recurring.length === 0` | — | "reserved per paycheck" |
| `apps/rn/src/app/(tabs)/money.tsx:877` | `funded` | "Funded" | — |
| `apps/rn/src/app/(tabs)/progress.tsx:150` | `reached.length` | — | "no milestones reached yet" |
| `apps/rn/src/app/(tabs)/progress.tsx:151` | `nextT` | — | "all milestones reached" |
| `apps/rn/src/app/(tabs)/progress.tsx:151` | `nextT === 100` | "debt-free" | — |
| `apps/rn/src/app/more.tsx:167` | `tipsReset` | "Tips will appear again as you go." | "Re-offer the one-line hints on hidden features." |
| `apps/rn/src/app/paywall.tsx:168` | `error instanceof Error` | — | "Something went wrong. Please try again." |
| `apps/rn/src/app/paywall.tsx:190` | `error instanceof Error` | — | "Something went wrong. Please try again." |
| `apps/rn/src/app/paywall.tsx:241` | `kind === 'lifetime'` | "You’re on Premium — Lifetime. Thanks for the support." | "You’re on Premium — thanks for the support." |
| `apps/rn/src/app/paywall.tsx:320` | `restoring` | "Restoring…" | "Restore purchases" |
| `apps/rn/src/components/AppLockGate.tsx:37` | `authing` | "Unlocking…" | "Unlock" |
| `apps/rn/src/components/entities/AmortizationView.tsx:67` | `amort.isFocus` | "— minimum + your extra" | "— the minimum" |
| `apps/rn/src/components/entities/DebtSheet.tsx:238` | `isEdit` | "Edit debt" | "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:238` | `convertingExpenseId` | "Add a debt" | "Add from scan" · "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:238` | `prefill` | "Add from scan" | "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:240` | `isEdit` | — | "Moving this from Expenses. Add the balance so it counts toward your debt-free date." |
| `apps/rn/src/components/entities/DebtSheet.tsx:242` | `convertingExpenseId` | "Moving this from Expenses. Add the balance so it counts toward your debt-free date." | "Review the scanned details, then add." · "A loan, credit card, or BNPL balance." |
| `apps/rn/src/components/entities/DebtSheet.tsx:244` | `prefill` | "Review the scanned details, then add." | "A loan, credit card, or BNPL balance." |
| `apps/rn/src/components/entities/DebtSheet.tsx:248` | `isEdit` | "Save" | "Add debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:295` | `type === 'bnpl'` | "Affirm — Sofa" | "Visa, Car Loan" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:83` | `isEdit` | "Edit expense" | "Add an expense" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:85` | `isEdit` | "Save" | "Add expense" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:91` | `trial` | "Amount now (0 for a free trial)" | "Amount" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:91` | `trial` | "e.g. 0" | "e.g. 850" |
| `apps/rn/src/components/entities/GoalSheet.tsx:58` | `isEdit` | "Edit goal" | "Add a goal" |
| `apps/rn/src/components/entities/GoalSheet.tsx:60` | `isEdit` | "Save" | "Add goal" |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx:47` | `isEdit` | "Edit spending item" | "Add a spending item" |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx:49` | `isEdit` | "Save" | "Add item" |
| `apps/rn/src/components/money/BnplCalendarSection.tsx:93` | `moreCount === 1` | — | "installments" |
| `apps/rn/src/components/more/BackupSheets.tsx:40` | `copied` | "Copied ✓" | "Copy to clipboard" |
| `apps/rn/src/components/more/CoachMarkProbeReadout.tsx:40` | `entries.length` | — | "EMPTY" |
| `apps/rn/src/components/more/LiveActivityQA.tsx:54` | `enabled` | "Start a state, then check the Lock Screen / Dynamic Island. (iOS only.)" | "Live Activities are OFF in device Settings, or unsupported here (web / <iOS 16.2)." |
| `apps/rn/src/components/onboarding/CompletionStep.tsx:52` | `debtFreeDate` | — | "You're all set" |
| `apps/rn/src/components/onboarding/CompletionStep.tsx:55` | `debtFreeDate` | "That's your target — stay the course. Tap below to see exactly what to do with your next paycheck." | "Your plan is ready. Tap below to see exactly what to do with your next paycheck." |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:119` | `type === 'debt'` | "Something with a balance you’re paying down — a card, a loan, a mortgage. It ends." | "An ongoing cost that doesn’t end — rent, phone, a subscription." |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:126` | `type === 'debt'` | "Debt name" | "Expense name" |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:132` | `type === 'debt'` | "e.g. Visa Card" | "e.g. Rent" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:240` | `preMarkAllPaid` | "Undo" | "Mark all paid" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:259` | `row.view.isAutopay` | "Autopay · ran" · "Autopay" | "Required" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:260` | `row.view.presumedPaid` | "Autopay · ran" | "Autopay" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:263` | `row.view.dueDate` | — | "Required" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:269` | `paid` | "Paid" | "Didn't pay" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:353` | `staleBalances.length === 1` | "1 balance hasn't been checked in a while" | — |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:386` | `external` | "From savings ✓" | "From savings" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:406` | `skipped` | "Skipped" | "Paid" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:424` | `hasAdjustedRequired \|\| extrasAdjusted` | "Confirm what I paid" | "I followed the plan" |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx:288` | `debtFreeDate` | — | "projected balance over time" |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx:289` | `showMinimums` | "your plan clears faster than minimum payments" | — |
| `apps/rn/src/components/plan/AffordabilityCard.tsx:222` | `result.verdict === 'tight'` | "Apply anyway" | "Apply to this paycheck" |
| `apps/rn/src/components/plan/CashRunwayChart.tsx:193` | `sel === 0` | "This paycheck" | — |
| `apps/rn/src/components/plan/LeanSuggestionCard.tsx:32` | `up` | "Raise your income floor" | "Adjust your income floor" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:181` | `isExample` | "Example" | — |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:201` | `brief.debtFree` | "To savings" | "To debt" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:278` | `brief.debtFree` | "To savings" | "To debt" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:358` | `topUp.isEmergencyFund` | "your emergency fund" | — |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:398` | `attestation?.attested` | "Undoes the confirmation and restores the full safety net" | "Tells your Guardian your bills are all entered, so it holds less back" |
| `apps/rn/src/components/plan/PlanHero.tsx:119` | `onEditPaycheck` | "Edit paycheck" | — |
| `apps/rn/src/components/plan/PlanHero.tsx:177` | `windfall > 0` | — | "Add extra income" |
| `apps/rn/src/components/plan/PlanHero.tsx:181` | `windfall > 0` | — | "Add extra income" |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:216` | `paid` | "Undo, mark unpaid" | "Mark paid" |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:219` | `paid` | "Undo" | "Paid" |
| `apps/rn/src/components/plan/SaveForItSheet.tsx:126` | `o.readyBy != null && o.paychecks != null` | — | "Saved after debt · no firm date" |
| `apps/rn/src/components/plan/ShareCard.tsx:51` | `data.amount != null` | — | "Paid off" |
| `apps/rn/src/components/plan/TutorialOverlay.tsx:320` | `hideProgress` | "Example money" | — |
| `apps/rn/src/components/plan/TutorialOverlay.tsx:344` | `isLast` | "Finish" | "Next" |
| `apps/rn/src/components/plan/WindfallSheet.tsx:80` | `isPremium && hasSplit` | "Confirm" | "Add" |
| `apps/rn/src/components/progress/VanquishedArchive.tsx:60` | `d.amount != null` | — | "Cleared" |
| `apps/rn/src/components/progress/VanquishedArchive.tsx:65` | `d.amount != null` | — | "Cleared" |
| `apps/rn/src/components/ui/ListRow.tsx:76` | `onPress` | "Opens the editor" | — |
| `apps/rn/src/components/ui/ListRow.tsx:151` | `onLogPayment` | "Log payment" · "dollarsign.circle" | — |
| `apps/rn/src/components/ui/ListRow.tsx:152` | `onViewSchedule` | "Payoff schedule" | — |
| `apps/rn/src/components/ui/ListRow.tsx:153` | `onPress` | "Edit" | — |
| `packages/core/guardian/buildGuardianBrief.ts:215` | `isPremium` | "Update your numbers and I'll plan from where you actually are." | — |
| `packages/core/guardian/buildGuardianBrief.ts:246` | `debtFree` | — | "bills and minimums" |
| `packages/core/guardian/buildGuardianBrief.ts:247` | `isPremium` | "— this one needs a plan." | — |
| `packages/core/guardian/buildGuardianBrief.ts:263` | `state === "clear"` | "Looks clear this paycheck" | "A little tight this paycheck" · "Tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:263` | `state === "tight"` | "A little tight this paycheck" | "Tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:264` | `state === "clear"` | — | "— a bit tight this one, so keep an eye on the essentials." |
| `packages/core/guardian/buildGuardianBrief.ts:278` | `state === "at-risk"` | "Very tight this paycheck" | "A little tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:283` | `state === "at-risk"` | — | "a little under" |
| `packages/core/guardian/buildGuardianBrief.ts:323` | `debtFree` | "to your goals" | "to debt" |
| `packages/core/guardian/buildGuardianBrief.ts:335` | `debtFree` | "your goals" | — |
| `packages/core/guardian/buildGuardianBrief.ts:346` | `input.deployTradeoff && !debtFree` | "your debts" · "your emergency fund" | — |
| `packages/core/insights/buildSmartInsights.ts:57` | `amountToHold > 0` | — | "Run minimum-only until the next paycheck if any new expenses appear." |
| `packages/core/insights/buildSmartInsights.ts:95` | `projectedBuffer < 200` | "Focus on restoring cushion first, then target this payoff opportunity once cash pressure improves." | "Make this payment after handling required bills and minimums to immediately free up that monthly minimum." |
| `packages/core/insights/buildSmartInsights.ts:97` | `canFullyCover` | "Make this payment after handling required bills and minimums to immediately free up that monthly minimum." | — |
| `packages/core/insights/buildSmartInsights.ts:110` | `highestAprDebt` | — | "Prioritize the highest APR debt first to reduce long-term interest cost." |

## Every string, by file


### `apps/rn/src/app/_layout.tsx`

| line | origin | string |
|---|---|---|
| 167 | other ⚠️ | (tabs) |
| 173 | other ⚠️ | schedule/[id] |
| 191 | other ⚠️ | +not-found |

### `apps/rn/src/app/(tabs)/_layout.tsx`

| line | origin | string |
|---|---|---|
| 82 | prop:options ⚠️ | Today |
| 87 | prop:options ⚠️ | Progress |
| 92 | prop:options ⚠️ | Money |

### `apps/rn/src/app/(tabs)/index.tsx`

| line | origin | string |
|---|---|---|
| 238 | prop:title | Set up your paycheck |
| 239 | prop:body | Add your paycheck to see exactly what to pay each cycle. |
| 240 | prop:cta | Set up your paycheck |
| 249 | prop:title | Add your first debt |
| 250 | prop:body | Your debt-free date is waiting. Add a debt to see your plan. |
| 251 | prop:cta | Add a debt |
| 309 | prop:onSeeForecast ⚠️ | /cushion-forecast |
| 468 | jsx-text | Good news — this paycheck looks clear after all. |
| 470 | prop:label | Got it |
| 484 | call:covered).toLocaleString ⚠️ | en-US |
| 488 | prop:label | Got it |
| 502 | jsx-text | A surprise bill came up — I&apos;ve restored your safety net for now. |
| 505 | prop:label | Got it |
| 516 | jsx-expr | Payment logged — I updated your balance. |
| 517 | jsx-expr | Payday landed — I rolled your plan forward to this paycheck. |
| 521 | prop:label | Undo |
| 522 | prop:label | Keep |
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
| 793 | call:useStore ⚠️ | A surprise bill came up — your Guardian has restored your safety net for now. |

### `apps/rn/src/app/(tabs)/money.tsx`

| line | origin | string |
|---|---|---|
| 65 | key:'monthly' ⚠️ | /mo |
| 66 | key:'weekly' ⚠️ | /wk |
| 67 | key:'biweekly' ⚠️ | /2 wks |
| 68 | key:'per-paycheck' ⚠️ | /check |
| 69 | key:'quarterly' ⚠️ | /qtr |
| 70 | key:'annually' ⚠️ | /yr |
| 82 | key:debts ⚠️ | Balances you’re paying down. These have an end date, and they set your debt-free date. |
| 83 | key:bills ⚠️ | Ongoing costs that don’t end. Reserved from every paycheck before anything goes to debt. |
| 84 | key:goals ⚠️ | Money you’re setting aside — saved for, not owed. |
| 111 | prop:title | Money |
| 116 | prop:options ⚠️ | Debts |
| 117 | prop:options ⚠️ | Expenses |
| 118 | prop:options ⚠️ | Goals |
| 172 | jsx-text | Is this a debt you&apos;re paying down? Debts count toward your debt-free date — expenses don&apos;t. |
| 176 | jsx-text | Move to Debts |
| 186 | jsx-text | Not a debt |
| 313 | prop:title | Start your debt-free plan |
| 314 | prop:body | Add a loan, credit card, or BNPL balance to see your debt-free date. |
| 315 | prop:cta | Add |
| 319 | prop:label | Scan a statement |
| 334 | key:title | PAID OFF |
| 347 | prop:options ⚠️ | Snowball |
| 348 | prop:options ⚠️ | Avalanche |
| 353 | jsx-expr | Smallest balance first — quick wins. Your debts are listed in payoff order. |
| 354 | jsx-expr | Highest APR first — least interest. Your debts are listed in payoff order. |
| 382 | prop:label | Add |
| 384 | prop:label | Scan a statement |
| 410 | jsx-text | Select a debt to edit, or add one. |
| 452 | var:captionText ⚠️ | estimated · tap to verify |
| 468 | prop:label | Focus |
| 469 | prop:label | BNPL |
| 469 | prop:label | Autopay |
| 479 | prop:amountSuffix ⚠️ | /mo |
| 479 | prop:amountSuffix ⚠️ | /mo |
| 640 | prop:title | Build your paycheck plan |
| 641 | prop:body | Add an ongoing cost — rent, utilities, a subscription — so your plan knows what’s due. |
| 642 | prop:cta | Add |
| 659 | key:sub ⚠️ | reserved per paycheck |
| 704 | prop:meta ⚠️ | · Variable |
| 706 | prop:label | Autopay |
| 717 | jsx-text | No bills match “ |
| 722 | prop:label | Add |
| 756 | prop:placeholder | Search expenses |
| 763 | prop:accessibilityLabel | Clear search |
| 816 | prop:onPress ⚠️ | /living-expenses |
| 822 | jsx-text | Everyday spending reserve |
| 828 | jsx-text | Reserved each paycheck · tap to manage |
| 845 | prop:title | Start a savings goal |
| 846 | prop:body | Add an emergency fund or savings goal to start tracking progress. |
| 847 | prop:cta | Add |
| 876 | prop:meta ⚠️ | Emergency fund |
| 876 | prop:meta ⚠️ | Savings |
| 877 | prop:amount ⚠️ | Funded |
| 879 | prop:label | Funded |
| 887 | prop:label | Add |

### `apps/rn/src/app/(tabs)/progress.tsx`

| line | origin | string |
|---|---|---|
| 95 | prop:title | Progress |
| 101 | jsx-text | DEBT-FREE |
| 102 | jsx-text | Every balance cleared |
| 103 | jsx-text | Your trophy shelf is below. |
| 110 | prop:title | Progress |
| 113 | prop:title | Your payoff journey starts here |
| 114 | prop:body | Add a debt to see your payoff order, timeline, and interest saved. |
| 115 | prop:cta | Add a debt |
| 150 | call:groupLabel | no milestones reached yet |
| 151 | call:groupLabel | debt-free |
| 151 | call:groupLabel | all milestones reached |
| 158 | prop:title | Progress |
| 176 | jsx-text | DEBT-FREE |

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

### `apps/rn/src/app/history.tsx`

| line | origin | string |
|---|---|---|
| 39 | prop:title | Pay Cycle History |
| 44 | jsx-text | paid down across |
| 49 | jsx-text | See how far you&apos;ve come, one cycle at a time. |
| 66 | jsx-text | No finished cycles yet. When you start your next pay cycle, that completed cycle shows up here. |

### `apps/rn/src/app/living-expenses.tsx`

| line | origin | string |
|---|---|---|
| 34 | prop:title | Living Expenses |
| 36 | jsx-text | Everyday spending reserved each paycheck, before debt and goals. |
| 42 | prop:title | No spending items yet |
| 43 | prop:body | Add groceries, gas, or fun money to reserve for everyday spending each paycheck. |
| 44 | prop:cta | Add your first item |
| 50 | jsx-text | Reserve per paycheck |
| 60 | prop:meta ⚠️ | Counts toward reserve |
| 60 | prop:meta ⚠️ | Not counted |
| 62 | prop:label | Off |
| 68 | prop:label | Add spending item |

### `apps/rn/src/app/more.tsx`

| line | origin | string |
|---|---|---|
| 90 | prop:title | More |
| 105 | prop:label | Premium |
| 106 | prop:subtitle | Active — thanks for the support. |
| 114 | prop:label | Premium — Lifetime |
| 115 | prop:subtitle | Active — a one-time purchase, yours forever. Thanks for the support. |
| 121 | prop:label | Premium |
| 122 | prop:subtitle | Active — thanks for the support. Tap to manage your subscription. |
| 130 | prop:label | Unlock Premium |
| 131 | prop:subtitle | The Payday Guardian, Can I Afford It & more. |
| 132 | prop:onPress ⚠️ | /paywall |
| 143 | prop:label | Pay cycle history |
| 144 | prop:subtitle | Look back at your finished pay cycles. |
| 145 | prop:onPress ⚠️ | /history |
| 152 | prop:label | How the Guardian works |
| 153 | prop:subtitle | Replay the short walkthrough. |
| 166 | prop:label | Show feature tips again |
| 167 | prop:subtitle | Tips will appear again as you go. |
| 167 | prop:subtitle | Re-offer the one-line hints on hidden features. |
| 176 | prop:title | Data |
| 178 | prop:label | Export backup |
| 178 | prop:subtitle | Save a copy of your data. |
| 179 | prop:label | Import backup |
| 179 | prop:subtitle | Restore from a saved backup. |
| 182 | prop:label | iCloud backup |
| 183 | prop:subtitle | Automatic cloud backup — coming soon. |
| 184 | jsx-text | Soon |
| 189 | prop:label | Delete all data |
| 194 | prop:title | Preferences |
| 201 | prop:label | Your name |
| 205 | prop:placeholder | Used to greet you on Today |
| 211 | jsx-text | Appearance |
| 216 | prop:options ⚠️ | Auto |
| 217 | prop:options ⚠️ | Light |
| 218 | prop:options ⚠️ | Dark |
| 226 | prop:label | Notifications |
| 227 | prop:subtitle | Paycheck-eve reminder and bill alerts. |
| 228 | prop:accessibilityLabel | Notifications |
| 232 | prop:label | App Lock |
| 233 | prop:subtitle | Require Face ID / passcode to open. |
| 234 | prop:accessibilityLabel | App Lock |
| 243 | prop:label | Share anonymous usage |
| 244 | prop:subtitle | Which screens get used — never your balances, debts, or amounts. |
| 247 | prop:accessibilityLabel | Share anonymous usage |
| 256 | prop:label | I have savings elsewhere |
| 257 | prop:subtitle | Skip building a starter emergency fund — put more toward debt first. |
| 258 | prop:accessibilityLabel | I have savings elsewhere |
| 265 | prop:label | Payday countdown |
| 266 | prop:subtitle | Show a Live Activity in the ~3 days before payday. |
| 267 | prop:accessibilityLabel | Payday countdown |
| 273 | prop:label | Debt-free sound |
| 274 | prop:subtitle | Play a chime when you clear your last debt. |
| 275 | prop:accessibilityLabel | Debt-free sound |
| 277 | prop:label | Living Expenses |
| 277 | prop:subtitle | Everyday spending reserved each paycheck. |
| 277 | prop:onPress ⚠️ | /living-expenses |
| 281 | prop:title | About |
| 283 | prop:label | Privacy Policy |
| 284 | prop:label | Terms of Use |
| 285 | prop:label | Support |
| 290 | prop:label | Manage Subscription |
| 292 | prop:label | Version |
| 300 | prop:title | Developer / QA |
| 304 | prop:label | Simulate Premium |
| 305 | prop:subtitle | Unlock premium features for testing (dev / TestFlight QA). |
| 308 | prop:accessibilityLabel | Simulate Premium |
| 339 | jsx-text | Private by design |
| 341 | jsx-text | Your financial data stays on this device — no account needed. And we&apos;ll never sell you more debt. |
| 353 | jsx-text | All debts, bills, goals, and settings will be permanently erased. This cannot be undone. |
| 357 | prop:label | Cancel |
| 360 | prop:label | Delete Everything |

### `apps/rn/src/app/onboarding.tsx`

| line | origin | string |
|---|---|---|
| 33 | prop:onDemo ⚠️ | /demo?from=welcome |

### `apps/rn/src/app/paywall.tsx`

| line | origin | string |
|---|---|---|
| 21 | key:text | The Payday Guardian — holds your cushion at your line every payday and reshapes the plan, so you don’t decide it each cycle. |
| 22 | key:text | Can I Afford It? — apply any purchase to your plan in one tap, or build a plan to save for it. |
| 23 | key:text | Recovery Plan — a guided catch-up when a cycle comes up short. |
| 24 | key:text | Always-current balances — projected forward or re-scanned in seconds, no monthly retyping. |
| 30 | var:AUTO_RENEW_DISCLOSURE | Payment will be charged to your Apple Account at confirmation of purchase. Subscriptions |
| 31 | var:AUTO_RENEW_DISCLOSURE | automatically renew unless canceled at least 24 hours before the end of the current period. Your |
| 32 | var:AUTO_RENEW_DISCLOSURE | account is charged for renewal within 24 hours prior to the end of the current period. Manage or |
| 33 | var:AUTO_RENEW_DISCLOSURE | cancel anytime in your App Store account settings. Lifetime is a one-time purchase (not a |
| 34 | var:AUTO_RENEW_DISCLOSURE | subscription) that covers all current Premium features; any future add-on tiers, like bank |
| 35 | var:AUTO_RENEW_DISCLOSURE | connection or an AI coach, are sold separately. |
| 51 | var:LIFETIME_SUBNOTE ⚠️ | Pay once — all today’s Premium, forever |
| 58 | key:title | Annual |
| 58 | key:periodLabel | per year |
| 58 | key:subnote | Billed yearly · just $2.50/mo |
| 58 | key:badge | Best value |
| 59 | key:title | Lifetime |
| 59 | key:periodLabel | one time |
| 59 | key:badge | Pay once |
| 60 | key:title | Monthly |
| 60 | key:periodLabel | per month |
| 60 | key:subnote | Billed monthly |
| 67 | other ⚠️ | ANNUAL |
| 72 | key:title | Annual |
| 72 | key:periodLabel | per year |
| 72 | key:badge | Best value |
| 74 | other ⚠️ | LIFETIME |
| 75 | key:title | Lifetime |
| 75 | key:periodLabel | one time |
| 75 | key:badge | Pay once |
| 76 | other ⚠️ | MONTHLY |
| 77 | key:title | Monthly |
| 77 | key:periodLabel | per month |
| 77 | key:subnote | Billed monthly |
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
| 197 | var:ctaLabel ⚠️ | Starting… |
| 208 | prop:title | Premium |
| 208 | prop:onBack ⚠️ | /onboarding |
| 211 | jsx-text | Debt payoff on autopilot |
| 213 | jsx-text | The app does the manual parts — you just confirm. |
| 230 | jsx-text | Private by design — your financial data never leaves your device, and you’ll never be sold more debt. |
| 241 | jsx-expr | You’re on Premium — Lifetime. Thanks for the support. |
| 241 | jsx-expr | You’re on Premium — thanks for the support. |
| 247 | prop:label | Manage subscription |
| 256 | jsx-text | Plans couldn’t load right now. Check your connection and try again. |
| 258 | prop:label | Retry |
| 311 | prop:onPress ⚠️ | /demo?from=paywall |
| 315 | jsx-text | See it in action |
| 320 | jsx-expr | Restoring… |
| 320 | jsx-expr | Restore purchases |
| 327 | jsx-text | Terms of Use (EULA) |
| 331 | jsx-text | Privacy Policy |

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
| 33 | key:title | A debt |
| 34 | key:clause ⚠️ | Something with a balance you're paying down. It ends. |
| 35 | key:examples ⚠️ | Credit card · Car loan · Mortgage · Buy-now-pay-later |
| 40 | key:title | An expense |
| 41 | key:clause ⚠️ | An ongoing cost that doesn't end. |
| 42 | key:examples ⚠️ | Rent · Phone · Electric · Subscriptions |
| 47 | key:title | A savings goal |
| 50 | key:clause ⚠️ | Money you're setting aside for something. |
| 51 | key:examples ⚠️ | Emergency fund · A trip · A new laptop |
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
| 67 | jsx-expr | — minimum + your extra |
| 67 | jsx-expr | — the minimum |
| 71 | jsx-text | MONTH |
| 72 | jsx-text | BALANCE |
| 81 | jsx-text | interest · |
| 102 | jsx-text | Payoff schedule |

### `apps/rn/src/components/entities/DebtSheet.tsx`

| line | origin | string |
|---|---|---|
| 45 | key:label | Every 3 months |
| 51 | key:label | Not specified |
| 52 | key:label | Klarna |
| 53 | key:label | Affirm |
| 54 | key:label | Afterpay |
| 55 | key:label | PayPal Pay in 4 |
| 56 | key:label | Zip |
| 57 | key:label | Sezzle |
| 58 | key:label | Other |
| 162 | call:setError | Enter the payment amount. |
| 163 | call:setError | Enter how many payments are left. |
| 186 | call:setError | Minimum payment can’t exceed the balance. |
| 238 | prop:title | Edit debt |
| 238 | prop:title | Add a debt |
| 238 | prop:title | Add from scan |
| 238 | prop:title | Add a debt |
| 243 | prop:subtitle | Moving this from Expenses. Add the balance so it counts toward your debt-free date. |
| 245 | prop:subtitle | Review the scanned details, then add. |
| 246 | prop:subtitle | A loan, credit card, or BNPL balance. |
| 248 | prop:submitLabel | Save |
| 248 | prop:submitLabel | Add debt |
| 275 | jsx-text | Log a payment |
| 287 | jsx-text | View payoff schedule |
| 295 | prop:label | Name |
| 295 | prop:placeholder | Affirm — Sofa |
| 295 | prop:placeholder | Visa, Car Loan |
| 297 | prop:label | Type |
| 299 | prop:options ⚠️ | Debt / loan |
| 299 | prop:options ⚠️ | BNPL (buy now, pay later) |
| 306 | prop:label | Provider |
| 307 | prop:label | Payment amount |
| 307 | prop:placeholder | e.g. 100 |
| 308 | prop:label | Payments remaining |
| 308 | prop:placeholder | e.g. 4 |
| 309 | prop:label | How often |
| 310 | prop:label | Next payment |
| 313 | jsx-text | left · interest-free |
| 319 | prop:label | Current balance |
| 319 | prop:placeholder | e.g. 2400 |
| 322 | prop:accessibilityLabel | Re-scan a statement to update this balance |
| 323 | jsx-text | Re-scan to update → |
| 336 | jsx-text | Estimated |
| 339 | jsx-text | Apply Estimate to Plan |
| 342 | jsx-text | Updated |
| 344 | prop:label | Minimum payment |
| 344 | prop:placeholder | e.g. 65 |
| 345 | prop:label | APR % |
| 345 | prop:placeholder | e.g. 22.99 |
| 346 | prop:label | Due date |
| 347 | prop:label | Recurrence |
| 350 | prop:label | Autopay |

### `apps/rn/src/components/entities/ExpenseSheet.tsx`

| line | origin | string |
|---|---|---|
| 44 | call:setError | Enter the amount you pay now (0 for a free trial). |
| 45 | call:setError | Enter the full price after the trial. |
| 47 | call:setError | Enter when the full price starts (YYYY-MM-DD). |
| 83 | prop:title | Edit expense |
| 83 | prop:title | Add an expense |
| 84 | prop:subtitle | An ongoing cost that doesn't end. |
| 85 | prop:submitLabel | Save |
| 85 | prop:submitLabel | Add expense |
| 90 | prop:label | Name |
| 90 | prop:placeholder | Rent, phone, utilities |
| 91 | prop:label | Amount now (0 for a free trial) |
| 91 | prop:label | Amount |
| 91 | prop:placeholder | e.g. 0 |
| 91 | prop:placeholder | e.g. 850 |
| 92 | prop:label | Due date (YYYY-MM-DD) |
| 93 | prop:label | Recurrence |
| 94 | prop:label | Category |
| 95 | prop:label | Variable amount (estimate) |
| 96 | prop:label | Free trial or intro price |
| 99 | prop:label | Full price after the trial |
| 99 | prop:placeholder | e.g. 15.99 |
| 100 | prop:label | Full price starts (YYYY-MM-DD) |
| 103 | prop:label | Autopay |

### `apps/rn/src/components/entities/GoalSheet.tsx`

| line | origin | string |
|---|---|---|
| 30 | call:setError | Enter a target amount. |
| 58 | prop:title | Edit goal |
| 58 | prop:title | Add a goal |
| 59 | prop:subtitle | A savings or emergency-fund target. |
| 60 | prop:submitLabel | Save |
| 60 | prop:submitLabel | Add goal |
| 65 | prop:label | Name |
| 65 | prop:placeholder | Emergency Fund, Vacation |
| 66 | prop:label | Target amount |
| 66 | prop:placeholder | e.g. 1000 |
| 67 | prop:label | Current amount saved |
| 67 | prop:placeholder | e.g. 250 |
| 69 | prop:label | Type |
| 71 | prop:options ⚠️ | Emergency fund |
| 71 | prop:options ⚠️ | Savings |

### `apps/rn/src/components/entities/LivingExpenseSheet.tsx`

| line | origin | string |
|---|---|---|
| 47 | prop:title | Edit spending item |
| 47 | prop:title | Add a spending item |
| 48 | prop:subtitle | Everyday spending you reserve each paycheck (groceries, gas, fun). |
| 49 | prop:submitLabel | Save |
| 49 | prop:submitLabel | Add item |
| 54 | prop:label | Name |
| 54 | prop:placeholder | Groceries, gas, fun |
| 56 | prop:label | Amount per paycheck |
| 59 | prop:placeholder | e.g. 300 |
| 63 | prop:label | Count toward my reserve |

### `apps/rn/src/components/entities/LogPaymentSheet.tsx`

| line | origin | string |
|---|---|---|
| 34 | prop:title | Log a payment |
| 39 | prop:label | Amount paid |
| 44 | prop:error ⚠️ | More than the balance — this will clear it to $0. |
| 46 | prop:label | Log payment |

### `apps/rn/src/components/money/AllocationBarCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 11 | prop:getComponent ⚠️ | ./AllocationBarChart |

### `apps/rn/src/components/money/BillBreakdownSheet.tsx`

| line | origin | string |
|---|---|---|
| 38 | key:biweekly ⚠️ | every 2 weeks |
| 39 | key:'per-paycheck' ⚠️ | every paycheck |
| 53 | prop:title | Where it goes |
| 57 | jsx-text | reserved per paycheck |
| 61 | jsx-text | Every bill spread evenly across your paychecks — so the lumpy ones never land as a surprise. |
| 70 | jsx-text | /paycheck |
| 84 | jsx-text | /paycheck |
| 95 | jsx-text | Plus |
| 95 | jsx-text | one-time |
| 95 | jsx-text | — not part of your ongoing reserve. |

### `apps/rn/src/components/money/BnplCalendarSection.tsx`

| line | origin | string |
|---|---|---|
| 68 | jsx-text | UPCOMING BNPL INSTALLMENTS |
| 93 | jsx-expr | installments |

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
| 59 | call:setError | Paste your backup first. |
| 64 | call:setError | That doesn't look like a valid backup. |
| 70 | call:setError | That backup couldn't be read. |
| 77 | prop:title | Import backup |
| 78 | prop:subtitle | Paste a backup you exported before. This replaces your current data. |
| 79 | prop:submitLabel | Restore backup |
| 85 | prop:placeholder | Paste your backup JSON here |

### `apps/rn/src/components/more/CoachMarkProbeReadout.tsx`

| line | origin | string |
|---|---|---|
| 33 | jsx-text | Coach-mark probe (4.1.4c) |
| 40 | jsx-expr | EMPTY |

### `apps/rn/src/components/more/LiveActivityQA.tsx`

| line | origin | string |
|---|---|---|
| 22 | key:countdownLabel | in 2 days |
| 24 | key:title | Looks clear this paycheck |
| 25 | key:line ⚠️ | Cushion safe · $420 free to deploy |
| 32 | key:label | Clear · 2 days |
| 34 | key:label | Tight · tomorrow |
| 35 | key:countdownLabel | Tomorrow |
| 35 | key:title | A little tight this paycheck |
| 35 | key:line ⚠️ | Move $200 from savings to hold your line |
| 38 | key:label | At-risk · today |
| 39 | key:countdownLabel | Today |
| 39 | key:title | Very tight this paycheck |
| 39 | key:line ⚠️ | $180 short of your obligations |
| 42 | key:label | Payday day (button) |
| 43 | key:countdownLabel | Today |
| 52 | jsx-text | Live Activity QA |
| 55 | jsx-expr | Start a state, then check the Lock Screen / Dynamic Island. (iOS only.) |
| 56 | jsx-expr | Live Activities are OFF in device Settings, or unsupported here (web / <iOS 16.2). |
| 64 | prop:label | End activity |
| 66 | prop:label | Simulate 'Payday landed' |
| 70 | prop:onPress ⚠️ | Payday landed |
| 70 | prop:onPress ⚠️ | Rolled the cycle — check the Today tab for the Undo card. |
| 70 | alert | Payday landed |
| 70 | alert | Rolled the cycle — check the Today tab for the Undo card. |

### `apps/rn/src/components/onboarding/CompletionStep.tsx`

| line | origin | string |
|---|---|---|
| 17 | key:label | Private by design |
| 17 | key:body | your financial data stays on your device. |
| 18 | key:label | Always editable |
| 18 | key:body | update amounts any time. |
| 19 | key:label | Free to use |
| 19 | key:body | core features never require a subscription. |
| 39 | prop:label | See My Plan  → |
| 52 | jsx-expr | You're all set |
| 56 | jsx-expr | That's your target — stay the course. Tap below to see exactly what to do with your next paycheck. |
| 57 | jsx-expr | Your plan is ready. Tap below to see exactly what to do with your next paycheck. |
| 63 | prop:label | What should we call you? (optional) |
| 66 | prop:placeholder | Your name |

### `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx`

| line | origin | string |
|---|---|---|
| 50 | call:setError | Enter the amount. |
| 90 | prop:label | Add & Continue |
| 91 | prop:label | Skip, I'll add later |
| 95 | jsx-text | Add your first debt or expense |
| 97 | jsx-text | See your plan come to life right away. You can add more any time. |
| 108 | prop:options ⚠️ | Debt |
| 109 | prop:options ⚠️ | Expense |
| 120 | jsx-expr | Something with a balance you’re paying down — a card, a loan, a mortgage. It ends. |
| 121 | jsx-expr | An ongoing cost that doesn’t end — rent, phone, a subscription. |
| 126 | prop:label | Debt name |
| 126 | prop:label | Expense name |
| 132 | prop:placeholder | e.g. Visa Card |
| 132 | prop:placeholder | e.g. Rent |
| 139 | prop:label | Current balance |
| 145 | prop:placeholder | e.g. 2400 |
| 152 | prop:label | Minimum payment |
| 158 | prop:placeholder | e.g. 35 |
| 163 | prop:label | APR % (optional) |
| 163 | prop:placeholder | e.g. 22.99 |
| 170 | prop:label | Amount |
| 176 | prop:placeholder | e.g. 1200 |

### `apps/rn/src/components/onboarding/PaycheckStep.tsx`

| line | origin | string |
|---|---|---|
| 39 | call:setError | Enter your paycheck amount to continue. |
| 69 | prop:label | Continue |
| 70 | prop:label | Skip for now |
| 74 | jsx-text | When do you get paid? |
| 76 | jsx-text | This sets up your pay cycle so your plan knows which bills are due next. |

### `apps/rn/src/components/onboarding/WelcomeStep.tsx`

| line | origin | string |
|---|---|---|
| 13 | key:title | A guardian for every payday |
| 13 | key:body | Know what's safe to spend and what to pay down — your cushion, protected. |
| 14 | key:title | A real debt-free date |
| 14 | key:body | Snowball or avalanche — see exactly when your last debt disappears. |
| 15 | key:title | Spend without the guilt |
| 15 | key:body | Check any purchase against your plan before you buy. |
| 26 | prop:label | Get Started |
| 39 | prop:label | See it in action |
| 46 | jsx-text | Will you make it to payday? |
| 48 | jsx-text | Debt Planner watches your cushion every paycheck — so you always know what&apos;s safe to spend and what to pay down. |

### `apps/rn/src/components/payday/PaydayCaptureSheet.tsx`

| line | origin | string |
|---|---|---|
| 34 | return | a while ago |
| 203 | var:requiredSub ⚠️ | All confirmed paid |
| 232 | jsx-text | ‹ Back |
| 234 | jsx-text | Which bills got paid? |
| 236 | jsx-text | Tap to mark what you actually paid — anything left carries to next cycle. |
| 240 | jsx-expr | Undo |
| 240 | jsx-expr | Mark all paid |
| 261 | jsx-expr | Autopay · ran |
| 262 | jsx-expr | Autopay |
| 265 | jsx-expr | Required |
| 269 | prop:label | Paid |
| 269 | prop:label | Didn't pay |
| 275 | jsx-text | carries to next cycle |
| 279 | prop:label | Done |
| 286 | jsx-text | ‹ Back |
| 288 | jsx-text | Check your balances |
| 290 | jsx-text | Confirm each estimate, or type the real balance from your statement. |
| 302 | jsx-text | estimated ~ |
| 302 | jsx-text | · verified |
| 315 | prop:label | Confirm balances |
| 321 | jsx-text | It&apos;s payday |
| 323 | jsx-text | Here&apos;s the plan you set for this paycheck. Confirm what you actually paid. |
| 327 | jsx-text | Close |
| 336 | jsx-text | Required bills & minimums |
| 341 | prop:label | Adjust |
| 351 | jsx-text | Estimated balances |
| 354 | jsx-expr | 1 balance hasn't been checked in a while |
| 358 | prop:label | Update |
| 360 | prop:label | These look right |
| 365 | jsx-text | Balances confirmed |
| 370 | jsx-text | EXTRA PAYMENTS |
| 386 | jsx-expr | From savings ✓ |
| 386 | jsx-expr | From savings |
| 406 | prop:label | Skipped |
| 406 | prop:label | Paid |
| 417 | jsx-text | You paid |
| 424 | prop:label | Confirm what I paid |
| 424 | prop:label | I followed the plan |
| 425 | prop:label | Skip this payday |
| 465 | jsx-text | Payday captured |
| 471 | jsx-text | confirmed · your plan&apos;s up to date |

### `apps/rn/src/components/payoff/TrajectoryCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 14 | prop:getComponent ⚠️ | ./TrajectorySkiaChart |

### `apps/rn/src/components/payoff/TrajectoryChart.tsx`

| line | origin | string |
|---|---|---|
| 228 | call:month).toLocaleString ⚠️ | en-US |
| 229 | var:minimumsDateLabel ⚠️ | Never |
| 279 | jsx-text | PAYOFF TRAJECTORY |
| 280 | jsx-text | Balance over time |
| 287 | call:groupLabel | Payoff trajectory chart |
| 288 | call:groupLabel | projected balance over time |
| 289 | call:groupLabel | your plan clears faster than minimum payments |
| 387 | call:month).toLocaleString ⚠️ | en-US |
| 400 | jsx-text | Now |
| 412 | jsx-text | Minimum payments |
| 423 | jsx-text | Your plan |
| 440 | jsx-text | Safe-floor |
| 452 | jsx-text | With extra |
| 469 | prop:accessibilityLabel | What if you paid extra? |
| 472 | jsx-text | What if you paid extra? |

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
| 55 | var:effName ⚠️ | Savings goal |
| 72 | var:purchaseName ⚠️ | Purchase |
| 86 | var:purchaseName ⚠️ | Purchase |
| 115 | jsx-text | CAN I AFFORD IT? |
| 128 | prop:label | Undo |
| 139 | jsx-text | CAN I AFFORD IT? |
| 149 | prop:label | Undo |
| 158 | jsx-text | CAN I AFFORD IT? |
| 161 | jsx-text | Thinking about a purchase? |
| 164 | prop:label | Amount |
| 164 | prop:placeholder | e.g. 400 |
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

### `apps/rn/src/components/plan/CaptureAutoStart.tsx`

| line | origin | string |
|---|---|---|
| 37 | call:router.replace ⚠️ | /demo?capture=1 |

### `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 14 | prop:getComponent ⚠️ | ./CashRunwaySkiaChart |

### `apps/rn/src/components/plan/CashRunwayChart.tsx`

| line | origin | string |
|---|---|---|
| 42 | key:clear ⚠️ | Clear |
| 42 | key:tight ⚠️ | Tight |
| 42 | key:'at-risk' ⚠️ | Crunch |
| 130 | jsx-text | BREATHING ROOM |
| 177 | jsx-text | your $ |
| 185 | jsx-text | Guardian&apos;s setting aside |
| 185 | jsx-text | from this paycheck for a tight cycle ahead. |
| 193 | jsx-expr | This paycheck |
| 198 | prop:label | Income |
| 199 | prop:label | Bills & essentials |
| 202 | prop:label | Left after essentials |

### `apps/rn/src/components/plan/CoachMarkLayer.tsx`

| line | origin | string |
|---|---|---|
| 64 | call:probeCoachMark ⚠️ | NULL |
| 64 | call:probeCoachMark ⚠️ | (cancelled) |
| 78 | var:verdict ⚠️ | DREW |
| 111 | prop:accessibilityLabel | Got it |
| 114 | jsx-text | Got it |

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
| 65 | call:value.toLocaleString ⚠️ | en-US |
| 66 | prop:accessibilityLabel | Cushion line amount |

### `apps/rn/src/components/plan/DemoCaption.tsx`

| line | origin | string |
|---|---|---|
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
| 72 | prop:onPress ⚠️ | /onboarding |
| 73 | jsx-text | Start my real plan |

### `apps/rn/src/components/plan/FloorImpactBar.tsx`

| line | origin | string |
|---|---|---|
| 76 | jsx-text | Cushion |

### `apps/rn/src/components/plan/GraduationCards.tsx`

| line | origin | string |
|---|---|---|
| 28 | jsx-text | You&apos;re debt-free |
| 30 | jsx-text | Every balance is cleared. Your paycheck now builds your future instead of paying down the past. |
| 46 | jsx-text | YOUR NEXT CHAPTER |
| 49 | jsx-text | Ready to build wealth? |
| 52 | jsx-text | Financial Freedom picks up where this leaves off — turn the money you were sending to debt into a plan for         your Freedom Date. A convenient next step, not a required one. |
| 55 | prop:label | Explore Financial Freedom → |

### `apps/rn/src/components/plan/GuardianScorecard.tsx`

| line | origin | string |
|---|---|---|
| 33 | jsx-text | GUARDIAN ACCURACY |
| 36 | jsx-text | Protected since day one |
| 39 | jsx-text | Your floor&apos;s been protected from the start. I&apos;m still learning your patterns — I&apos;ll show my track           record once I&apos;ve seen a few more paychecks. |
| 50 | var:recalibration ⚠️ | I've under-warned a few times — I've tightened my read. |
| 52 | var:recalibration ⚠️ | I've been over-cautious a few times — I'm recalibrating. |
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
| 32 | call:groupLabel | Income floor |
| 32 | call:groupLabel | Raise your income floor |
| 32 | call:groupLabel | Adjust your income floor |
| 35 | jsx-text | INCOME FLOOR |
| 41 | prop:label | Not now |

### `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 10 | prop:getComponent ⚠️ | ./MeshGradientChart |

### `apps/rn/src/components/plan/MilestoneAckCard.tsx`

| line | origin | string |
|---|---|---|
| 20 | key:title | A quarter paid off |
| 20 | key:body | You've cleared 25% of your debt. Keep the momentum going. |
| 21 | key:title | Halfway to debt-free |
| 21 | key:body | 50% paid off — you're over the hump. |
| 22 | key:title | Three-quarters done |
| 22 | key:body | 75% paid off. The finish line is in sight. |
| 45 | prop:label | Keep going |

### `apps/rn/src/components/plan/PaidOffFinale.tsx`

| line | origin | string |
|---|---|---|
| 107 | prop:accessibilityLabel | $0 balance |
| 116 | jsx-text | You&rsquo;re debt-free |
| 127 | prop:label | Share your win |
| 128 | prop:label | Continue |

### `apps/rn/src/components/plan/PaycheckSheet.tsx`

| line | origin | string |
|---|---|---|
| 49 | call:setError | Enter your paycheck amount. |
| 76 | prop:title | Paycheck & pay cycle |
| 77 | prop:subtitle | Your income and when it lands — the foundation of every plan. |
| 78 | prop:submitLabel | Save paycheck |
| 143 | prop:label | This paycheck didn't arrive |

### `apps/rn/src/components/plan/PaydayGuardianCard.tsx`

| line | origin | string |
|---|---|---|
| 164 | var:attestLabel ⚠️ | Bills confirmed — holding a smaller safety net. Undo |
| 165 | var:attestLabel ⚠️ | All your regular bills entered? I'll hold a smaller safety net. |
| 171 | var:freeInvite ⚠️ | Premium builds you a catch-up plan — what to cover first, and what (if anything) can safely wait. |
| 172 | var:freeInvite ⚠️ | Premium keeps your cushion at your line automatically, all on your device — no deciding each paycheck. |
| 181 | call:groupLabel | Example |
| 182 | call:groupLabel | Payday Guardian |
| 201 | call:groupLabel | To savings |
| 201 | call:groupLabel | To debt |
| 209 | jsx-text | PAYDAY GUARDIAN |
| 226 | jsx-text | Example |
| 231 | jsx-text | Update needed |
| 272 | prop:label | Safety net |
| 277 | prop:label | Cushion |
| 278 | prop:label | To savings |
| 278 | prop:label | To debt |
| 289 | jsx-text | · Your line |
| 316 | jsx-text | Your call |
| 358 | prop:label | your emergency fund |
| 379 | prop:label | Undo the move |
| 399 | prop:accessibilityHint | Undoes the confirmation and restores the full safety net |
| 400 | prop:accessibilityHint | Tells your Guardian your bills are all entered, so it holds less back |
| 428 | prop:accessibilityLabel | Adjust your line |
| 429 | prop:accessibilityHint | Opens a sheet to set the cushion you keep back each payday |
| 431 | jsx-text | Adjust your line → |
| 443 | prop:accessibilityLabel | How this works |
| 444 | prop:accessibilityHint | Replays the walkthrough of how your Guardian decides, from the beginning |
| 446 | jsx-text | How this works |
| 467 | prop:accessibilityLabel | See your forecast |
| 468 | prop:accessibilityHint | Opens your full cushion forecast |
| 471 | jsx-text | See your forecast → |
| 493 | call:isFinite(n) ? n : 0)).toLocaleString ⚠️ | en-US |

### `apps/rn/src/components/plan/PayoffInvitationCard.tsx`

| line | origin | string |
|---|---|---|
| 37 | jsx-text | Looks like you crushed |
| 40 | jsx-text | Your estimate reached $0. Confirm it&apos;s paid off and we&apos;ll make it official. |
| 42 | prop:label | Confirm — it's paid off |
| 44 | jsx-text | Not yet — update the balance |

### `apps/rn/src/components/plan/PlanHero.tsx`

| line | origin | string |
|---|---|---|
| 27 | call:max(0, n)).toLocaleString ⚠️ | en-US |
| 79 | key:label | Required |
| 80 | key:label | Everyday |
| 81 | key:label | Flexible |
| 94 | var:statusLabel ⚠️ | Overdue payments need attention |
| 96 | var:statusLabel ⚠️ | Short this paycheck |
| 97 | var:statusLabel ⚠️ | On track |
| 119 | prop:accessibilityLabel | Edit paycheck |
| 122 | jsx-text | THIS PAYCHECK · |
| 162 | jsx-text | Suggested · |
| 177 | prop:accessibilityLabel | Add extra income |
| 181 | jsx-expr | Add extra income |

### `apps/rn/src/components/plan/RecommendedActionsCard.tsx`

| line | origin | string |
|---|---|---|
| 25 | var:verb ⚠️ | Mark Paid |
| 25 | var:verb ⚠️ | Mark Saved |
| 46 | jsx-text | Recommended |
| 48 | jsx-text | Best next move for this paycheck. |
| 55 | prop:meta ⚠️ | Suggested this paycheck |
| 67 | prop:meta ⚠️ | Completed with outside money |
| 67 | prop:meta ⚠️ | Completed this paycheck |
| 70 | prop:label | Undo |

### `apps/rn/src/components/plan/RecoveryPlanSection.tsx`

| line | origin | string |
|---|---|---|
| 13 | call:isFinite(n) ? n : 0)).toLocaleString ⚠️ | en-US |
| 63 | jsx-text | COVER NOW |
| 72 | jsx-text | SAFE TO DEFER |
| 94 | jsx-text | Keep essential |
| 126 | jsx-text | This reschedules the payment in your plan — remember to handle it with the biller (pay it late, or cancel it). |

### `apps/rn/src/components/plan/RequiredActionsCard.tsx`

| line | origin | string |
|---|---|---|
| 27 | other ⚠️ | unfundedRequiredItems |
| 96 | jsx-text | Required Actions |
| 98 | jsx-text | Bills and minimums due this paycheck. |
| 105 | jsx-text | You&apos;re caught up for this paycheck. |
| 124 | jsx-text | Short this paycheck — cover these from savings or your next paycheck. |
| 216 | prop:accessibilityLabel | Undo, mark unpaid |
| 216 | prop:accessibilityLabel | Mark paid |
| 219 | jsx-expr | Undo |
| 219 | jsx-expr | Paid |
| 256 | prop:label | Auto-paid |
| 258 | prop:label | Autopay |
| 278 | prop:label | Overdue |
| 279 | jsx-text | Due |
| 285 | jsx-text | this cycle |

### `apps/rn/src/components/plan/SaveForItSheet.tsx`

| line | origin | string |
|---|---|---|
| 16 | call:isFinite(n) ? n : 0)).toLocaleString ⚠️ | en-US |
| 64 | var:goalLabel ⚠️ | this purchase |
| 106 | prop:title | Save for it |
| 108 | prop:submitLabel | Start saving |
| 123 | jsx-text | /paycheck |
| 128 | jsx-expr | Saved after debt · no firm date |
| 145 | jsx-text | Set your own |
| 149 | prop:label | Per paycheck |
| 149 | prop:placeholder | e.g. 100 |
| 152 | jsx-text | · ready by |
| 157 | jsx-text | Save what you want each paycheck — funds before debt at your pace. |

### `apps/rn/src/components/plan/ShareCard.tsx`

| line | origin | string |
|---|---|---|
| 38 | jsx-text | I&rsquo;m debt-free |
| 50 | jsx-text | Vanquished |
| 51 | jsx-expr | Paid off |
| 54 | jsx-text | /mo freed toward the next one |
| 66 | jsx-text | on my way to debt-free |
| 73 | jsx-text | Debt Planner &middot; your payday debt-payoff app |

### `apps/rn/src/components/plan/TutorialInviteCard.tsx`

| line | origin | string |
|---|---|---|
| 27 | call:groupLabel | See how your Guardian works |
| 28 | call:groupLabel | A short walkthrough on example numbers, not your real plan. |
| 35 | jsx-text | See how your Guardian works |
| 39 | jsx-text | A short walkthrough on example numbers — your plan isn&apos;t touched. |
| 43 | prop:label | Show me |
| 44 | prop:label | Not now |

### `apps/rn/src/components/plan/TutorialOverlay.tsx`

| line | origin | string |
|---|---|---|
| 320 | jsx-expr | Example money |
| 344 | prop:label | Finish |
| 344 | prop:label | Next |
| 345 | prop:label | Back |
| 352 | jsx-text | Skip |

### `apps/rn/src/components/plan/VanquishedBeat.tsx`

| line | origin | string |
|---|---|---|
| 89 | call:shareDebtCard ⚠️ | Share your win |
| 98 | var:beatA11y ⚠️ | — paid off |
| 116 | jsx-text | Vanquished |
| 126 | jsx-text | Paid off |
| 131 | jsx-text | Freed |
| 131 | jsx-text | /mo now flows to |
| 137 | prop:label | Share |
| 138 | prop:label | Keep going |

### `apps/rn/src/components/plan/WindfallSheet.tsx`

| line | origin | string |
|---|---|---|
| 21 | key:label | Covers your bills & essentials first |
| 22 | key:label | Extra to your debt |
| 23 | key:label | To your emergency fund |
| 24 | key:label | Toward your goals |
| 25 | key:label | Held as your safety net |
| 26 | key:label | Left as spare cash |
| 78 | prop:title | Extra income |
| 79 | prop:subtitle | A bonus, refund, or side gig — added to this paycheck only. |
| 80 | prop:submitLabel | Confirm |
| 80 | prop:submitLabel | Add |
| 85 | prop:label | Amount |
| 91 | prop:placeholder | e.g. 500 |
| 100 | jsx-text | HERE&apos;S HOW THE APP WILL ROUTE |
| 111 | jsx-text | Confirm to route it this way — your whole plan updates. Your call. |

### `apps/rn/src/components/premium/PremiumInvite.tsx`

| line | origin | string |
|---|---|---|
| 21 | prop:onPress ⚠️ | /paywall |

### `apps/rn/src/components/progress/CashFlowSection.tsx`

| line | origin | string |
|---|---|---|
| 19 | other ⚠️ | cushionStatus |
| 59 | jsx-text | CASH FLOW · NEXT |
| 59 | jsx-text | PAY CYCLES |
| 65 | prop:options ⚠️ | Cushion |
| 66 | prop:options ⚠️ | Timeline |
| 88 | var:caption ⚠️ | A cycle runs short ahead — plan for it. |
| 90 | var:caption ⚠️ | Cushion gets tight in an upcoming cycle. |
| 91 | var:caption ⚠️ | Comfortable across the next few paychecks. |
| 111 | jsx-text | line · room after each paycheck |

### `apps/rn/src/components/progress/JourneyRingCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 11 | prop:getComponent ⚠️ | ./JourneyRingChart |

### `apps/rn/src/components/progress/TimelineLedger.tsx`

| line | origin | string |
|---|---|---|
| 68 | var:title ⚠️ | This cycle |
| 68 | var:title ⚠️ | Projected |
| 68 | var:title ⚠️ | Cycle |
| 110 | jsx-text | from savings |

### `apps/rn/src/components/progress/VanquishedArchive.tsx`

| line | origin | string |
|---|---|---|
| 38 | call:shareDebtCard ⚠️ | Share your progress |
| 47 | jsx-text | DEBTS VANQUISHED · |
| 60 | call:groupLabel | Cleared |
| 65 | jsx-expr | Cleared |
| 73 | prop:label | Share |

### `apps/rn/src/components/screen.tsx`

| line | origin | string |
|---|---|---|
| 67 | prop:accessibilityLabel | Back |

### `apps/rn/src/components/ui/AnimatedSheet.tsx`

| line | origin | string |
|---|---|---|
| 82 | prop:accessibilityLabel | Close |

### `apps/rn/src/components/ui/FormSheet.tsx`

| line | origin | string |
|---|---|---|
| 108 | jsx-text | Remove |
| 157 | prop:accessibilityLabel | Close |
| 174 | jsx-text | Remove |

### `apps/rn/src/components/ui/ListRow.tsx`

| line | origin | string |
|---|---|---|
| 76 | prop:accessibilityHint | Opens the editor |
| 144 | jsx-text | Delete |
| 151 | key:title | Log payment |
| 151 | key:systemIcon ⚠️ | dollarsign.circle |
| 152 | key:title | Payoff schedule |
| 153 | key:title | Edit |
| 154 | key:title | Delete |

### `apps/rn/src/components/ui/RowContextMenu.ios.tsx`

| line | origin | string |
|---|---|---|
| 17 | key:type ⚠️ | IMAGE_SYSTEM |
| 26 | prop:previewConfig ⚠️ | DEFAULT |

### `apps/rn/src/components/ui/Select.tsx`

| line | origin | string |
|---|---|---|
| 31 | jsx-expr | Select |

### `apps/rn/src/data/migrations.ts`

| line | origin | string |
|---|---|---|
| 33 | other ⚠️ | runMigrations: persisted store is not an object |

### `apps/rn/src/hooks/use-sheet-presentation.ts`

| line | origin | string |
|---|---|---|
| 35 | call:Keyboard.addListener ⚠️ | keyboardDidShow |
| 36 | call:Keyboard.addListener ⚠️ | keyboardDidHide |

### `apps/rn/src/keyCommands/KeyCommandListener.ios.tsx`

| line | origin | string |
|---|---|---|
| 31 | call:requireNativeViewManager ⚠️ | KeyCommands |
| 36 | key:'tab-progress' ⚠️ | /progress |
| 37 | key:'tab-money' ⚠️ | /money |
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
| 10 | call:99%',
].join ⚠️ | Chase Freedom Unlimited |
| 11 | call:99%',
].join ⚠️ | Account ending 4821 |
| 12 | call:99%',
].join ⚠️ | New Balance $2,431.09 |
| 13 | call:99%',
].join ⚠️ | Minimum Payment Due $56.00 |
| 14 | call:99%',
].join ⚠️ | Payment Due Date August 22, 2026 |
| 15 | call:99%',
].join ⚠️ | Purchase APR 24.99% |

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
| 30 | call:reportError ⚠️ | startLiveActivitySync called with a SANDBOX store — refusing |
| 30 | key:seam ⚠️ | liveActivitySync |
| 65 | key:subsystem ⚠️ | liveActivity |

### `apps/rn/src/liveActivity/paydayActivityContent.ts`

| line | origin | string |
|---|---|---|
| 53 | return | Today |
| 54 | return | Tomorrow |
| 82 | var:line ⚠️ | Cushion safe |

### `apps/rn/src/motion/haptics.ts`

| line | origin | string |
|---|---|---|
| 21 | call:requireNativeModule ⚠️ | FinaleHaptics |

### `apps/rn/src/notifications/notifications.ts`

| line | origin | string |
|---|---|---|
| 31 | key:buttonTitle ⚠️ | Run my plan |
| 32 | key:buttonTitle ⚠️ | Review my plan |
| 33 | key:buttonTitle ⚠️ | Check my plan |
| 68 | key:title | Before this paycheck lands |
| 69 | key:body | I'd give your plan a quick look before payday. |
| 113 | call:schedule ⚠️ | Paycheck tomorrow |
| 113 | call:schedule ⚠️ | Your paycheck arrives tomorrow — open Debt Planner to run your plan. |
| 120 | call:schedule ⚠️ | It's payday |
| 120 | call:schedule ⚠️ | Open Debt Planner to confirm your plan for this paycheck. |
| 136 | var:title ⚠️ | Upcoming bill |

### `apps/rn/src/notifications/notifications.web.ts`

| line | origin | string |
|---|---|---|
| 10 | key:title | Time to check this paycheck |
| 11 | key:body | Take a quick look at your plan before this one lands. |

### `apps/rn/src/premium/legal.ts`

| line | origin | string |
|---|---|---|
| 12 | var:TERMS_OF_USE_URL ⚠️ | https://www.apple.com/legal/internet-services/itunes/dev/stdeula/ |
| 14 | var:PRIVACY_POLICY_URL ⚠️ | https://jsnyde03.github.io/debt-planner-site/privacy.html |
| 16 | var:SUPPORT_URL ⚠️ | https://jsnyde03.github.io/debt-planner-site/support.html |
| 19 | var:MANAGE_SUBSCRIPTION_URL ⚠️ | https://apps.apple.com/account/subscriptions |

### `apps/rn/src/premium/premiumKind.ts`

| line | origin | string |
|---|---|---|
| 17 | other ⚠️ | subscription |
| 26 | other ⚠️ | subscription |
| 35 | other ⚠️ | subscription |

### `apps/rn/src/premium/purchasesClient.ts`

| line | origin | string |
|---|---|---|
| 25 | var:DEBT_RC_IOS_KEY ⚠️ | appl_XUWODZnbbJFPbdMTgBTyKNAGGyp |

### `apps/rn/src/storage/adapter.ts`

| line | origin | string |
|---|---|---|
| 21 | other ⚠️ | Storage is locked |
| 23 | other ⚠️ | StorageLockedError |

### `apps/rn/src/storage/createAdapter.ts`

| line | origin | string |
|---|---|---|
| 20 | var:QUARANTINE_PREFIX ⚠️ | quarantine. |

### `apps/rn/src/storage/createAdapter.web.ts`

| line | origin | string |
|---|---|---|
| 8 | var:KEY ⚠️ | debtPlanner.rnStore |
| 9 | var:QUARANTINE_PREFIX ⚠️ | debtPlanner.rnStore.__quarantine__ |

### `apps/rn/src/store/analysisSelectors.ts`

| line | origin | string |
|---|---|---|
| 110 | var:canEstimate ⚠️ | Unable to estimate |
| 111 | var:canEstimate ⚠️ | Unable to estimate |

### `apps/rn/src/store/balanceSelectors.ts`

| line | origin | string |
|---|---|---|
| 82 | key:text | estimated · verify soon |

### `apps/rn/src/store/coachMarkCopy.ts`

| line | origin | string |
|---|---|---|
| 29 | key:title | See the whole payoff |
| 30 | key:body | Every payment from here to debt-free, month by month. |
| 36 | key:title | Press and hold a debt |
| 37 | key:body | Log a payment, see its payoff schedule, or edit it without leaving this list. |
| 41 | key:title | Drag the curve |
| 42 | key:body | Scrub any month to see what you owe and when you land. |

### `apps/rn/src/store/demoExit.ts`

| line | origin | string |
|---|---|---|
| 8 | other ⚠️ | /onboarding |
| 8 | other ⚠️ | /paywall |
| 38 | call:router.replace ⚠️ | /onboarding |
| 39 | other ⚠️ | /paywall |
| 39 | call:router.push ⚠️ | /paywall |

### `apps/rn/src/store/demoRun.ts`

| line | origin | string |
|---|---|---|
| 23 | other ⚠️ | /money |
| 23 | other ⚠️ | /progress |
| 90 | key:screen ⚠️ | /money |
| 90 | key:beat | The situation: three debts, a number you recognise. |
| 91 | key:beat | The mechanism: a paycheck lands and the cushion is held at your line, before payoff. |
| 92 | key:beat | The proof: a tight paycheck, and the safety net covers it. |
| 93 | key:screen ⚠️ | /progress |
| 93 | key:beat | The payoff: the ring, the curve, the debt-free date. |
| 99 | key:beat | The triumph: a debt one tap from zero. The capture driver confirms it, and the celebration is real. |

### `apps/rn/src/store/drift.ts`

| line | origin | string |
|---|---|---|
| 62 | key:projectedDebtFreeDate ⚠️ | Unable to estimate |

### `apps/rn/src/store/greeting.ts`

| line | origin | string |
|---|---|---|
| 38 | key:morning ⚠️ | Good morning |
| 39 | key:afternoon ⚠️ | Good afternoon |
| 40 | key:evening ⚠️ | Good evening |

### `apps/rn/src/store/guardianPredictionCore.ts`

| line | origin | string |
|---|---|---|
| 33 | other ⚠️ | predictedConfidenceContext |

### `apps/rn/src/store/guardianSelectors.ts`

| line | origin | string |
|---|---|---|
| 135 | var:targetName ⚠️ | your savings |
| 135 | var:targetName ⚠️ | your debt |
| 196 | return | /wk |
| 197 | return | /2wks |
| 198 | return | /paycheck |
| 199 | return | /qtr |
| 200 | return | /yr |
| 201 | return | /mo |
| 329 | key:provider ⚠️ | BNPL |
| 332 | call:amount).toLocaleString ⚠️ | en-US |
| 362 | var:AFFORD_PREVIEW_ID ⚠️ | __afford_preview__ |
| 390 | var:coverFromSavings ⚠️ | coverFromSavings |
| 522 | key:title | Save fast |
| 522 | key:detail | Funds before debt — pauses most of your extra debt payoff while you save. |
| 528 | key:title | Balanced |
| 528 | key:detail | A lighter set-aside — eases off your debt payoff a little, takes longer. |
| 533 | key:title | Keep debt first |
| 533 | key:detail | Save whatever’s spare after debt — no hit to your debt-free date, but no firm date. |

### `apps/rn/src/store/obligationForm.ts`

| line | origin | string |
|---|---|---|
| 24 | key:'monthly' ⚠️ | Monthly |
| 25 | key:'weekly' ⚠️ | Weekly |
| 26 | key:'biweekly' ⚠️ | Every 2 weeks |
| 27 | key:'per-paycheck' ⚠️ | Every paycheck |
| 28 | key:'quarterly' ⚠️ | Quarterly |
| 29 | key:'annually' ⚠️ | Yearly |
| 30 | key:'one-time' ⚠️ | One-time |
| 46 | var:BILL_CATEGORY_ORDER ⚠️ | subscriptions |
| 49 | var:BILL_CATEGORY_ORDER ⚠️ | discretionary |
| 55 | key:housing ⚠️ | Housing |
| 56 | key:utilities ⚠️ | Utilities |
| 57 | key:insurance ⚠️ | Insurance |
| 58 | key:subscriptions ⚠️ | Subscriptions |
| 59 | key:discretionary ⚠️ | Discretionary |
| 60 | key:medical ⚠️ | Medical |
| 61 | key:other ⚠️ | Other |
| 77 | key:nameRequired ⚠️ | Enter a name. |
| 78 | key:amountPositive ⚠️ | Enter an amount greater than 0. |
| 79 | key:balanceRequired ⚠️ | Enter the current balance. |
| 80 | key:minimumRequired ⚠️ | Enter the minimum payment. |

### `apps/rn/src/store/paycheckForm.ts`

| line | origin | string |
|---|---|---|
| 31 | key:label | Weekly |
| 32 | key:label | Bi-Weekly |
| 33 | key:label | Semi-Monthly |
| 33 | key:sublabel | e.g. 1st & 15th |
| 34 | key:label | Monthly |
| 39 | key:label | Paycheck amount |
| 39 | key:placeholder ⚠️ | e.g. 1500 |
| 40 | key:label | My income varies |
| 41 | key:label | The amount you can count on |
| 41 | key:placeholder ⚠️ | e.g. 1200 |
| 42 | key:label | First payday |
| 43 | key:label | Second payday |
| 44 | key:label | Payday (day of month) |
| 52 | var:PAYCHECK_LEAN_HELP ⚠️ | Your plan runs on this floor, so a lighter paycheck never breaks it. |
| 56 | key:cycle ⚠️ | Pay cycle |
| 57 | key:next ⚠️ | Next paycheck |
| 65 | key:leanRequired ⚠️ | Enter the amount you can count on. |
| 66 | key:leanAboveTypical ⚠️ | Your lean paycheck should be no more than a typical one. |

### `apps/rn/src/store/payday.ts`

| line | origin | string |
|---|---|---|
| 161 | key:portfolioMaxProgress ⚠️ | __portfolio__ |

### `apps/rn/src/store/persistence.ts`

| line | origin | string |
|---|---|---|
| 26 | call:reportError ⚠️ | bootstrapPersistence called with a SANDBOX store — refusing |

### `apps/rn/src/store/planSelectors.ts`

| line | origin | string |
|---|---|---|
| 96 | other ⚠️ | Unable to estimate |
| 247 | key:title | Overdue |
| 248 | key:title | Due this week |
| 249 | key:title | Due next week |
| 250 | key:title | Later this cycle |
| 251 | key:title | Handled |
| 306 | key:label | to debt this paycheck |
| 308 | key:label | to your emergency fund |
| 310 | key:label | to your goals |
| 311 | key:label | cushion this paycheck |
| 323 | var:cushionStatus ⚠️ | cushionStatus |

### `apps/rn/src/store/sandboxScenarios.ts`

| line | origin | string |
|---|---|---|
| 75 | key:clear ⚠️ | A clear payday |
| 76 | key:tight ⚠️ | A tight payday |
| 77 | key:'at-risk' ⚠️ | A short payday |

### `apps/rn/src/store/sandboxStore.ts`

| line | origin | string |
|---|---|---|
| 222 | call:console.warn ⚠️ | Replay and the tutorial e2e depend on it being deterministic; check for a clock or random read. |

### `apps/rn/src/store/StoreContext.tsx`

| line | origin | string |
|---|---|---|
| 32 | var:TUTORIAL_WRITABLE_PREFS ⚠️ | tutorialStep |
| 32 | var:TUTORIAL_WRITABLE_PREFS ⚠️ | tutorialSeen |
| 143 | call:reportError ⚠️ | Real store mutated while a sandbox subtree was mounted |
| 144 | key:seam ⚠️ | StoreProvider |
| 145 | key:hint | a component inside the subtree is still writing via appStore instead of useActiveStore() |

### `apps/rn/src/store/tutorialPath.ts`

| line | origin | string |
|---|---|---|
| 108 | key:title | Money set aside first |
| 108 | key:body | Every payday, your Guardian keeps a cushion back before anything extra goes to your debt. |
| 113 | key:title | Where this paycheck went |
| 113 | key:body | After your bills and minimums, this is what was left — held back as your cushion and safety net, or sent to your debt. |
| 119 | key:title | Your line |
| 120 | key:body | This is the least you want to keep. Open it and move the line — the whole plan re-solves around it. |
| 123 | key:coach ⚠️ | Drag the line, then Save — your plan re-solves around it. |
| 130 | key:title | A little extra, at first |
| 139 | key:body | While your Guardian is learning your bills it holds a bit more back. Tell it your bills are all in and it holds less — and if a surprise proves otherwise, it puts the net straight back. |
| 149 | key:title | When it won't stretch |
| 149 | key:body | Some paychecks come up short. Your Guardian works out what has to be covered now, and what can safely wait. |
| 155 | key:title | Always your call |
| 155 | key:body | Your Guardian suggests — it never moves your money. Every number here stays yours to overrule, once this tour is done. |
| 160 | key:title | Over to your plan |
| 161 | key:body | That was example money. This is your own paycheck, and your Guardian is already watching it. |
| 169 | key:premium ⚠️ | That was example money — your Guardian does exactly this with every paycheck you add, all on your device. Your debts live in Money, your progress in Progress. |
| 183 | key:free ⚠️ | That was example money — premium is what did the holding: your cushion kept at your line, a little extra held while it learns your bills, and a catch-up plan when a paycheck comes up short. Your own plan is next — your debts live in Money, your progress in Progress. |

### `apps/rn/src/theme/elevation.ts`

| line | origin | string |
|---|---|---|
| 22 | key:boxShadow ⚠️ | 0px 8px 22px rgba(16, 38, 84, 0.12), 0px 1.5px 3px rgba(16, 38, 84, 0.10) |
| 23 | key:boxShadow ⚠️ | 0px 8px 20px rgba(0, 0, 0, 0.38) |
| 27 | key:boxShadow ⚠️ | 0px 16px 40px rgba(16, 38, 84, 0.16) |
| 28 | key:boxShadow ⚠️ | 0px 16px 40px rgba(0, 0, 0, 0.5) |
| 34 | key:boxShadow ⚠️ | 0px 14px 30px rgba(8, 20, 50, 0.30) |
| 36 | key:boxShadow ⚠️ | 0px 14px 30px rgba(0, 0, 0, 0.5) |

### `apps/rn/src/theme/icons.ts`

| line | origin | string |
|---|---|---|
| 17 | key:sf ⚠️ | chart.line.uptrend.xyaxis |
| 35 | key:'chevron-right' ⚠️ | chevron.right |
| 36 | key:'chevron-left' ⚠️ | chevron.left |
| 37 | key:'expand-more' ⚠️ | chevron.down |
| 39 | key:cancel ⚠️ | xmark.circle.fill |
| 41 | key:'check-circle' ⚠️ | checkmark.circle.fill |
| 42 | key:'task-alt' ⚠️ | checkmark.circle |
| 44 | key:'add-circle-outline' ⚠️ | plus.circle |
| 46 | key:search ⚠️ | magnifyingglass |
| 48 | key:update ⚠️ | arrow.clockwise |
| 50 | key:'account-balance-wallet' ⚠️ | wallet.pass.fill |
| 51 | key:savings ⚠️ | banknote.fill |
| 52 | key:'shopping-cart' ⚠️ | cart.fill |
| 53 | key:'trending-up' ⚠️ | chart.line.uptrend.xyaxis |
| 54 | key:'trending-down' ⚠️ | chart.line.downtrend.xyaxis |
| 55 | key:'auto-graph' ⚠️ | chart.xyaxis.line |
| 56 | key:assignment ⚠️ | doc.text.fill |
| 57 | key:history ⚠️ | clock.arrow.circlepath |
| 64 | key:'gpp-good' ⚠️ | checkmark.shield.fill |
| 65 | key:'gpp-bad' ⚠️ | xmark.shield.fill |
| 66 | key:'gpp-maybe' ⚠️ | exclamationmark.shield.fill |
| 67 | key:shield ⚠️ | shield.fill |
| 68 | key:'verified-user' ⚠️ | checkmark.seal.fill |
| 69 | key:lock ⚠️ | lock.fill |
| 70 | key:'error-outline' ⚠️ | exclamationmark.triangle |
| 71 | key:healing ⚠️ | bandage.fill |
| 74 | key:star ⚠️ | star.fill |
| 75 | key:celebration ⚠️ | party.popper.fill |

### `apps/rn/src/theme/typography.ts`

| line | origin | string |
|---|---|---|
| 12 | key:display ⚠️ | System |
| 13 | key:body | System |
| 14 | key:mono ⚠️ | Menlo-Regular |

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
| 6 | call:NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format ⚠️ | en-US |
| 6 | key:currency ⚠️ | USD |

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
| 54 | return | This paycheck looks clear. Your cushion is safe. |
| 76 | var:debtFreeDate ⚠️ | Debt-free! |

### `apps/rn/src/widget/widgetKeys.ts`

| line | origin | string |
|---|---|---|
| 16 | var:WIDGET_APP_GROUP ⚠️ | group.com.jasonsnyder.debtplanner |
| 17 | var:WIDGET_KIND ⚠️ | DebtWidget |
| 18 | var:WIDGET_SNAPSHOT_KEY ⚠️ | debtSnapshot |

### `apps/rn/src/widget/widgetStorage.native.ts`

| line | origin | string |
|---|---|---|
| 29 | var:appleTargets ⚠️ | @bacons/apple-targets |
| 30 | other ⚠️ | @bacons/apple-targets |
| 32 | call:require ⚠️ | @bacons/apple-targets |

### `apps/rn/src/widget/widgetSync.ts`

| line | origin | string |
|---|---|---|
| 31 | call:reportError ⚠️ | startWidgetSync called with a SANDBOX store — refusing |

### `packages/core/debt/bnplSchedule.ts`

| line | origin | string |
|---|---|---|
| 42 | var:provider ⚠️ | BNPL |
| 65 | key:provider ⚠️ | BNPL |

### `packages/core/debt/computeCycleDelta.ts`

| line | origin | string |
|---|---|---|
| 15 | other ⚠️ | totalDebtBalance |

### `packages/core/debt/computeInterestSaved.ts`

| line | origin | string |
|---|---|---|
| 47 | var:minUnpayable ⚠️ | Unable to estimate |
| 48 | var:actualUnpayable ⚠️ | Unable to estimate |

### `packages/core/debt/mergeCompletedAction.ts`

| line | origin | string |
|---|---|---|
| 20 | other ⚠️ | paymentSource |

### `packages/core/debt/projectDebtPayoff.ts`

| line | origin | string |
|---|---|---|
| 34 | call:date.toLocaleString ⚠️ | en-US |
| 122 | key:estimatedDebtFreeDate ⚠️ | Unable to estimate |
| 214 | key:estimatedDebtFreeDate ⚠️ | Unable to estimate |

### `packages/core/engine/allocatePaycheck.ts`

| line | origin | string |
|---|---|---|
| 433 | key:label | Keep cash buffer |
| 476 | key:label | Held for an upcoming tight cycle |
| 483 | key:label | Safety net |
| 613 | key:label | Leftover cash |

### `packages/core/forecast/projectForecast.ts`

| line | origin | string |
|---|---|---|
| 63 | key:recoveryTrend ⚠️ | Recovery is not currently projected within the visible forecast window. |
| 64 | key:recoveryTrend ⚠️ | Cash pressure is projected to gradually improve across upcoming cycles. |
| 65 | key:recoveryTrend ⚠️ | Projected cushion remains within a healthier range. |
| 80 | var:lowCushionDrivers ⚠️ | Projected cushion remains below target |
| 81 | var:lowCushionDrivers ⚠️ | Available cushion stays under the recommended safety threshold |
| 82 | var:lowCushionDrivers ⚠️ | Cash reserve remains tighter than recommended |
| 93 | call:drivers.push ⚠️ | Debt minimum obligations remain elevated |
| 101 | return | Pause aggressive payoff and protect required payments first. |
| 112 | return | Current payoff pace appears sustainable. |
| 120 | call:NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format ⚠️ | en-US |
| 122 | key:currency ⚠️ | USD |

### `packages/core/guardian/buildGuardianBrief.ts`

| line | origin | string |
|---|---|---|
| 125 | call:round(v)).toLocaleString ⚠️ | en-US |
| 137 | return | These figures are from a little while ago — a quick refresh keeps this exact. |
| 139 | return | I'm planning from the low side while I learn what your paychecks reliably clear. |
| 140 | return | I'm holding a small safety net while I get to know your bills. |
| 180 | var:look ⚠️ | a little tight |
| 192 | key:title | A paycheck didn't land |
| 212 | key:title | Let's refresh your numbers |
| 214 | key:detail | Your paycheck, bills, or balances are more than a few weeks old, so I can't tell you if you'll make it this paycheck with confidence. |
| 215 | key:safeMove | Update your numbers and I'll plan from where you actually are. |
| 230 | var:dest ⚠️ | toward your savings |
| 232 | var:dest ⚠️ | toward debt |
| 244 | key:title | This paycheck won't cover everything |
| 246 | key:detail | bills and minimums |
| 247 | key:detail | — this one needs a plan. |
| 263 | key:title | Looks clear this paycheck |
| 263 | key:title | A little tight this paycheck |
| 263 | key:title | Tight this paycheck |
| 264 | key:detail | — a bit tight this one, so keep an eye on the essentials. |
| 278 | key:title | Very tight this paycheck |
| 278 | key:title | A little tight this paycheck |
| 283 | key:detail | at-risk |
| 283 | key:detail | a little under |
| 297 | key:title | Your line's held |
| 299 | key:safeMove | Nothing extra goes out this paycheck, and your emergency fund tops back up as your cushion rebuilds. |
| 315 | var:target ⚠️ | your savings |
| 319 | key:title | Looks clear this paycheck |
| 323 | key:safeMove | to your goals |
| 323 | key:safeMove | to debt |
| 333 | key:title | Looks clear this paycheck |
| 335 | key:safeMove | your goals |
| 347 | var:safeMove ⚠️ | your debts |
| 348 | var:safeMove ⚠️ | your emergency fund |
| 354 | key:title | Looks clear this paycheck |

### `packages/core/guardian/calibrationScore.ts`

| line | origin | string |
|---|---|---|
| 115 | var:dominantError ⚠️ | dominantError |

### `packages/core/imports/debtCsv.ts`

| line | origin | string |
|---|---|---|
| 73 | key:errors ⚠️ | CSV must include a header row and at least one debt row. |

### `packages/core/insights/buildSmartInsights.ts`

| line | origin | string |
|---|---|---|
| 46 | key:title | Recovery Needed |
| 55 | key:title | Tight Cycle Warning |
| 57 | key:action | Run minimum-only until the next paycheck if any new expenses appear. |
| 62 | key:title | Buffer looks stable |
| 64 | key:action | You can continue the current plan without needing a stabilization adjustment. |
| 75 | key:title | Safe Extra Payment |
| 81 | key:action | Make this payment only after required bills and minimums are handled. |
| 91 | key:title | Near Payoff Opportunity |
| 96 | key:action | Focus on restoring cushion first, then target this payoff opportunity once cash pressure improves. |
| 98 | key:action | Make this payment after handling required bills and minimums to immediately free up that monthly minimum. |
| 108 | key:title | Interest Reduction Insight |
| 110 | key:action | Prioritize the highest APR debt first to reduce long-term interest cost. |
| 115 | key:title | Payoff Timing Difference |
| 116 | key:message | Snowball and avalanche produce different payoff timelines with your current balances and extra-payment plan. |
| 117 | key:action | Use snowball for faster momentum or avalanche when interest reduction matters more. |
| 124 | key:title | Stability First |
| 125 | key:message | Your buffer is critically low this cycle. A single unexpected expense could put required payments at risk. |
| 126 | key:action | Treat staying current as the win for this cycle and avoid aggressive extra payoff until cushion improves. |
| 133 | key:title | Progress Still Continues |
| 135 | key:action | Even smaller progress cycles help stabilize long-term payoff momentum. |
| 144 | call:NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format ⚠️ | en-US |
| 146 | key:currency ⚠️ | USD |

### `packages/core/obligations/classifyDeferability.ts`

| line | origin | string |
|---|---|---|
| 15 | var:DEFERRABLE_CATEGORIES ⚠️ | subscriptions |
| 15 | var:DEFERRABLE_CATEGORIES ⚠️ | discretionary |

### `packages/core/payCycle/getNextPaycheckDate.ts`

| line | origin | string |
|---|---|---|
| 51 | call:validateDayOfTheMonth ⚠️ | First semi-monthly pay day |
| 52 | call:validateDayOfTheMonth ⚠️ | Second semi-monthly pay day |
| 55 | other ⚠️ | Semi-monthly pay days must be different. |
| 72 | call:validateDayOfTheMonth ⚠️ | Monthly pay day |
| 84 | other ⚠️ | Unsupported pay cycle |

### `packages/core/scan/parseStatementText.ts`

| line | origin | string |
|---|---|---|
| 26 | var:ISSUERS | American Express |
| 26 | var:ISSUERS | Amex |
| 26 | var:ISSUERS | Capital One |
| 26 | var:ISSUERS | Bank of America |
| 26 | var:ISSUERS | Wells Fargo |
| 26 | var:ISSUERS | Apple Card |
| 27 | var:ISSUERS | Chase |
| 27 | var:ISSUERS | Citi |
| 27 | var:ISSUERS | Citibank |
| 27 | var:ISSUERS | Discover |
| 27 | var:ISSUERS | Barclays |
| 27 | var:ISSUERS | Synchrony |
| 27 | var:ISSUERS | U.S. Bank |
| 27 | var:ISSUERS | US Bank |
| 28 | var:ISSUERS | PNC |
| 28 | var:ISSUERS | TD Bank |
| 28 | var:ISSUERS | USAA |
| 28 | var:ISSUERS | Navy Federal |
| 28 | var:ISSUERS | Klarna |
| 28 | var:ISSUERS | Affirm |
| 28 | var:ISSUERS | Afterpay |
| 28 | var:ISSUERS | PayPal |
| 28 | var:ISSUERS | Zip |
| 28 | var:ISSUERS | Sezzle |
| 86 | var:AMT ⚠️ | [^\n\d]{0,30}\$?\s*([\d,]+\.\d{2}) |

### `packages/core/storage/debtPlannerStorage.ts`

| line | origin | string |
|---|---|---|
| 7 | other ⚠️ | subscriptions |
| 11 | other ⚠️ | discretionary |
| 226 | var:CYCLE_HISTORY_STORAGE_KEY ⚠️ | debtPlanner.cycleHistory |

### `packages/core/timeline/buildTimelineItems.ts`

| line | origin | string |
|---|---|---|
| 46 | key:label | Paycheck Received |
| 55 | key:label | Living Reserve |
| 111 | key:label | Cash Buffer |

### `packages/core/utils/formatCurrency.ts`

| line | origin | string |
|---|---|---|
| 15 | call:NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format ⚠️ | en-US |
| 17 | key:currency ⚠️ | USD |

### `packages/core/utils/formatDisplayAmount.ts`

| line | origin | string |
|---|---|---|
| 3 | call:floor(abs).toLocaleString ⚠️ | en-US |
