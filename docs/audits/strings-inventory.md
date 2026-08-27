# User-facing strings — inventory

> ⛔ **GENERATED. Do not edit.** Regenerate with `npm run audit:strings`.
> This is the **input** to the wording/voice gate, not its output. Findings belong in a dated
> audit folder; this file is only ever the current state of the codebase.

**878** copy · **570** unclassified · **95** excluded as machinery · **51** copy strings appearing in more than one file (of 102 repeated strings overall).

<details><summary>Excluded as machinery — the contexts, so the exclusions can be challenged</summary>

- `key:category`
- `key:fontFamily`
- `key:id`
- `key:kind`
- `key:name`
- `key:reason`
- `key:value`
- `prop:onBack`
- `prop:onDemo`
- `prop:onPress`
- `prop:onSeeForecast`
- `prop:previewConfig`

</details>

## ⚠️ Unclassified — a prop nobody has sorted yet

These sit in JSX attributes that are in neither the copy list nor the technical list. Each is
either copy that the gate must read, or machinery that belongs in `TECHNICAL_PROPS`. Leaving one
here is how a surface goes unreviewed while the count looks complete.

- `call:AccessibilityInfo.addEventListener`
- `call:Intl.NumberFormat`
- `call:Keyboard.addListener`
- `call:Math.floor`
- `call:String`
- `call:addMonthsToDate`
- `call:announce`
- `call:anonymous`
- `call:anyRowFieldUnread`
- `call:check`
- `call:console.warn`
- `call:date.toLocaleString`
- `call:db.getAllAsync`
- `call:drivers.push`
- `call:import`
- `call:key.startsWith`
- `call:monthDate`
- `call:name.endsWith`
- `call:notify`
- `call:parts.push`
- `call:probeCoachMark`
- `call:repairMoneyFields`
- `call:repairs.find`
- `call:reportError`
- `call:require`
- `call:requireNativeModule`
- `call:requireNativeViewManager`
- `call:router.navigate`
- `call:router.push`
- `call:router.replace`
- `call:rowFieldUnread`
- `call:schedule`
- `call:shareDebtCard`
- `call:skipped`
- `call:store_.getState`
- `call:unreadFieldsFor`
- `call:useEffect`
- `call:useState`
- `call:useStore`
- `call:useSuppressCoachMarks`
- `call:validateDayOfTheMonth`
- `key:"annually"`
- `key:"at-risk"`
- `key:"biweekly"`
- `key:"monthly"`
- `key:"per-paycheck"`
- `key:"quarterly"`
- `key:"weekly"`
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
- `key:'raw-v17'`
- `key:'receipt-long'`
- `key:'shopping-cart'`
- `key:'tab-money'`
- `key:'tab-progress'`
- `key:'task-alt'`
- `key:'trending-down'`
- `key:'trending-up'`
- `key:'upload-file'`
- `key:'v16-file'`
- `key:'verified-user'`
- `key:'weekly'`
- `key:afternoon`
- `key:amount`
- `key:amountPositive`
- `key:appLockEnabled`
- `key:apr`
- `key:aprInvalid`
- `key:aprPlaceholder`
- `key:assignment`
- `key:atEntry`
- `key:balance`
- `key:balanceLabel`
- `key:balancePlaceholder`
- `key:balanceRequired`
- `key:bills`
- `key:biweekly`
- `key:boxShadow`
- `key:buttonTitle`
- `key:cancel`
- `key:candidates`
- `key:celebration`
- `key:clear`
- `key:coach`
- `key:completedRecommendedActions`
- `key:currency`
- `key:currentAmount`
- `key:cycle`
- `key:cycleHistory`
- `key:debt`
- `key:debts`
- `key:dialogTitle`
- `key:discretionary`
- `key:display`
- `key:envelope`
- `key:error`
- `key:errors`
- `key:evening`
- `key:examples`
- `key:exportedAt`
- `key:fallbackLabel`
- `key:field`
- `key:flexible`
- `key:free`
- `key:goal`
- `key:goals`
- `key:hasCompletedOnboarding`
- `key:hasConfiguredPaycheck`
- `key:healing`
- `key:history`
- `key:housing`
- `key:insurance`
- `key:isDemoMode`
- `key:lastHandledPaydayDate`
- `key:lastSavedAt`
- `key:leanAboveTypical`
- `key:leanRequired`
- `key:line`
- `key:livingExpenses`
- `key:lock`
- `key:medical`
- `key:milestoneMaxProgress`
- `key:mimeType`
- `key:minimumLabel`
- `key:minimumPayment`
- `key:minimumPlaceholder`
- `key:minimumRequired`
- `key:minute`
- `key:mockSubscription`
- `key:mono`
- `key:monthlyPayDay`
- `key:morning`
- `key:nameRequired`
- `key:next`
- `key:nextPaycheckDate`
- `key:noSelling`
- `key:notificationsEnabled`
- `key:offer`
- `key:optional`
- `key:originalBalance`
- `key:other`
- `key:path`
- `key:paydayRange`
- `key:paydayRequired`
- `key:paydaySame`
- `key:payoffStrategy`
- `key:placeholder`
- `key:portfolioMaxProgress`
- `key:premium`
- `key:priorityPerPaycheck`
- `key:promptMessage`
- `key:provider`
- `key:recoveryTrend`
- `key:required`
- `key:requiredExpenses`
- `key:resetSnapshot`
- `key:reviewRequested`
- `key:rolloverCount`
- `key:savings`
- `key:scheduledPaymentAmount`
- `key:schemaVersion`
- `key:screen`
- `key:seam`
- `key:search`
- `key:semiMonthlyFirstDay`
- `key:semiMonthlySecondDay`
- `key:sf`
- `key:shield`
- `key:short`
- `key:spokenFor`
- `key:star`
- `key:sub`
- `key:subscriptions`
- `key:subsystem`
- `key:subtotalA11y`
- `key:systemIcon`
- `key:target`
- `key:targetAmount`
- `key:tight`
- `key:type`
- `key:unicode`
- `key:unrecognised`
- `key:update`
- `key:utcMidnightDate`
- `key:utilities`
- `key:webkitRoot`
- `key:why`
- `other`
- `prop:amountSuffix`
- `prop:badges`
- `prop:getComponent`
- `prop:onCta`
- `prop:onManageEveryday`
- `prop:onPress`
- `prop:options`
- `prop:rel`
- `prop:renderItem`
- `prop:sub`
- `prop:target`
- `var:AFFORD_PREVIEW_ID`
- `var:AMBIGUOUS_NAMES`
- `var:AMT`
- `var:APP_STORE_URL`
- `var:BACKUP_APP_NAME`
- `var:BACKUP_PATH`
- `var:BILL_CATEGORY_ORDER`
- `var:CSV_TYPES`
- `var:CUSHION_LABEL`
- `var:CYCLE_HISTORY_STORAGE_KEY`
- `var:DAMAGED`
- `var:DEBT_FREE_DATE_UNPAYABLE`
- `var:DEBT_RC_IOS_KEY`
- `var:DEFERRABLE_CATEGORIES`
- `var:EMERGENCY_FUND_NOUN`
- `var:EVERYDAY_SPENDING_LABEL`
- `var:EXAMPLE_MONEY`
- `var:EXPORT_BACKUP_TITLE`
- `var:FILE_UNREADABLE`
- `var:FREEDOM_SCHEME_URL`
- `var:FREEDOM_STORE_URL`
- `var:GENERIC_FAILURE`
- `var:GOALS_DESTINATION`
- `var:GOAL_MONEY_FIELDS`
- `var:IMPORT_BACKUP_TITLE`
- `var:JSON_TYPES`
- `var:KEY`
- `var:LEGACY_KEY_PREFIX`
- `var:LIFETIME_SUBNOTE`
- `var:LIVE_ACTIVITY_APP_GROUP`
- `var:LOG_PAYMENT_ENTRY`
- `var:MALFORMED`
- `var:MANAGE_SUBSCRIPTION_URL`
- `var:MONEY_FIELDS`
- `var:NOT_A_BACKUP`
- `var:NOT_A_CLOUD_BACKUP`
- `var:NOT_JSON`
- `var:NO_BACKUP_YET`
- `var:NO_CODEC`
- `var:OVERDUE_LABEL`
- `var:PAID_OFF_LABEL`
- `var:PAYCHECK_LEAN_HELP`
- `var:PAYDAY_ACTIVITY_DEEPLINK`
- `var:PAYOFF_SCHEDULE_TITLE`
- `var:PAY_CYCLE_HISTORY_TITLE`
- `var:PLACEHOLDER`
- `var:PRIVACY_POLICY_LABEL`
- `var:PRIVACY_POLICY_URL`
- `var:QUARANTINE_PREFIX`
- `var:REDACTED`
- `var:REMOTE_UNCLAIMED`
- `var:REPLACE_DATA_ACTION`
- `var:RESTORE_FROM_CLOUD_ACTION`
- `var:SAFETY_NET_LABEL`
- `var:SAVE_FAILED_SPOKEN`
- `var:SEE_IT_IN_ACTION_CTA`
- `var:SHARE_WIN_CTA`
- `var:SIGN_IN_TO_ICLOUD`
- `var:SUPPORT_URL`
- `var:TERMS_OF_USE_URL`
- `var:TOO_NEW`
- `var:TUTORIAL_WRITABLE_PREFS`
- `var:UNLOCK_PREMIUM_CTA`
- `var:UNREADABLE`
- `var:UNRECOGNISED`
- `var:V16_DIRECT_KEYS`
- `var:V16_PAYCHECK_KEYS`
- `var:WIDGET_APP_GROUP`
- `var:WIDGET_KIND`
- `var:WIDGET_SNAPSHOT_KEY`
- `var:appleTargets`
- `var:attestLabel`
- `var:beatA11y`
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
- `var:href`
- `var:line`
- `var:list`
- `var:look`
- `var:lowCushionDrivers`
- `var:message`
- `var:meta`
- `var:minimumsDateLabel`
- `var:nested`
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

**51** of 102 cross-file duplicate strings carry copy.
The other 51 are style tokens, icon names,
routes and enum ids — repeated by design, and nothing a wording pass judges. They are excluded
here for the same reason the T2 gate and the T3 table exclude them: one classification, reused.

⚠️ A `copy+unclassified` tag means the SAME text is both a user-facing string somewhere and a
non-copy literal elsewhere (`"at-risk"` is a Guardian state id and a QA label). Judge the copy
instance; the others are coincidence, not divergence.

- **"Add"** _(copy)_ — `apps/rn/src/app/(tabs)/money.tsx:322` · `apps/rn/src/app/(tabs)/money.tsx:444` · `apps/rn/src/app/(tabs)/money.tsx:800` · `apps/rn/src/app/(tabs)/money.tsx:936` · `apps/rn/src/app/(tabs)/money.tsx:1109` · `apps/rn/src/app/(tabs)/money.tsx:1259` · `apps/rn/src/components/plan/WindfallSheet.tsx:82`
- **"Got it"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:592` · `apps/rn/src/app/(tabs)/index.tsx:610` · `apps/rn/src/app/(tabs)/index.tsx:627` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:386` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:389` · `apps/rn/src/components/plan/DataRepairsCard.tsx:84`
- **"Undo"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:643` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:265` · `apps/rn/src/components/plan/AffordabilityCard.tsx:162` · `apps/rn/src/components/plan/AffordabilityCard.tsx:183` · `apps/rn/src/components/plan/RecommendedActionsCard.tsx:70` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:303`
- **"Autopay"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:586` · `apps/rn/src/app/(tabs)/money.tsx:919` · `apps/rn/src/components/entities/DebtSheet.tsx:390` · `apps/rn/src/components/entities/ExpenseSheet.tsx:122` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:300` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:344`
- **"Progress"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:87` · `apps/rn/src/app/(tabs)/progress.tsx:175` · `apps/rn/src/app/(tabs)/progress.tsx:201` · `apps/rn/src/app/(tabs)/progress.tsx:213` · `apps/rn/src/app/(tabs)/progress.tsx:271`
- **"/mo"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:603` · `apps/rn/src/app/(tabs)/money.tsx:603` · `apps/rn/src/components/entities/AmortizationView.tsx:85` · `apps/rn/src/components/payoff/WhatIfControls.tsx:84` · `packages/core/types/recurrence.ts:27`
- **"Save"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:288` · `apps/rn/src/components/entities/ExpenseSheet.tsx:103` · `apps/rn/src/components/entities/GoalSheet.tsx:156` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:55` · `apps/rn/src/components/plan/CushionFloorSheet.tsx:49`
- **"Looks clear this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:26` · `packages/core/guardian/buildGuardianBrief.ts:308` · `packages/core/guardian/buildGuardianBrief.ts:371` · `packages/core/guardian/buildGuardianBrief.ts:387` · `packages/core/guardian/buildGuardianBrief.ts:408`
- **"Delete"** _(copy)_ — `apps/rn/src/components/ui/FormSheet.tsx:116` · `apps/rn/src/components/ui/FormSheet.tsx:182` · `apps/rn/src/components/ui/ListRow.tsx:165` · `apps/rn/src/components/ui/ListRow.tsx:260` · `apps/rn/src/utils/confirm.ts:18`
- **"Today"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:82` · `apps/rn/src/components/more/LiveActivityQA.tsx:41` · `apps/rn/src/components/more/LiveActivityQA.tsx:45` · `apps/rn/src/liveActivity/paydayActivityContent.ts:53`
- **"Add a debt"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:498` · `apps/rn/src/app/(tabs)/progress.tsx:218` · `apps/rn/src/components/entities/DebtSheet.tsx:278` · `apps/rn/src/components/entities/DebtSheet.tsx:278`
- **"Not now"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:671` · `apps/rn/src/components/plan/LeanSuggestionCard.tsx:40` · `apps/rn/src/components/plan/TutorialInviteCard.tsx:44` · `apps/rn/src/utils/confirm.ts:56`
- **"BNPL"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:584` · `apps/rn/src/store/guardianSelectors.ts:357` · `packages/core/debt/bnplSchedule.ts:42` · `packages/core/debt/bnplSchedule.ts:65`
- **"Monthly"** _(copy+unclassified)_ — `apps/rn/src/app/paywall.tsx:77` · `apps/rn/src/app/paywall.tsx:101` · `apps/rn/src/store/obligationForm.ts:24` · `apps/rn/src/store/paycheckForm.ts:34`
- **"Name"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:335` · `apps/rn/src/components/entities/ExpenseSheet.tsx:108` · `apps/rn/src/components/entities/GoalSheet.tsx:161` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:60`
- **"Amount"** _(copy)_ — `apps/rn/src/components/entities/ExpenseSheet.tsx:109` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:201` · `apps/rn/src/components/plan/AffordabilityCard.tsx:198` · `apps/rn/src/components/plan/WindfallSheet.tsx:87`
- **"paid off"** _(copy)_ — `apps/rn/src/components/plan/PaidOffFinale.tsx:120` · `apps/rn/src/components/plan/ShareCard.tsx:44` · `apps/rn/src/components/plan/ShareCard.tsx:65` · `apps/rn/src/components/plan/ShareCard.tsx:68`
- **"Premium"** _(copy)_ — `apps/rn/src/app/more.tsx:176` · `apps/rn/src/app/more.tsx:192` · `apps/rn/src/app/paywall.tsx:243`
- **"Cancel"** _(copy)_ — `apps/rn/src/app/more.tsx:494` · `apps/rn/src/app/more.tsx:517` · `apps/rn/src/utils/confirm.ts:17`
- **"Other"** _(copy+technical+unclassified)_ — `apps/rn/src/components/entities/DebtSheet.tsx:63` · `apps/rn/src/components/entities/DebtSheet.tsx:63` · `apps/rn/src/store/obligationForm.ts:61`
- **"Type"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:337` · `apps/rn/src/components/entities/GoalSheet.tsx:166` · `apps/rn/src/components/entities/GoalSheet.tsx:173`
- **"e.g. 100"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:347` · `apps/rn/src/components/entities/GoalSheet.tsx:191` · `apps/rn/src/components/plan/SaveForItSheet.tsx:164`
- **"/paycheck"** _(copy+unclassified)_ — `apps/rn/src/components/money/BillBreakdownSheet.tsx:125` · `apps/rn/src/components/plan/SaveForItSheet.tsx:135` · `packages/core/types/recurrence.ts:30`
- **"Done"** _(copy)_ — `apps/rn/src/components/more/BackupSheets.tsx:81` · `apps/rn/src/components/more/CloudBackupSheet.tsx:53` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:317`
- **"A little tight this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:37` · `packages/core/guardian/buildGuardianBrief.ts:308` · `packages/core/guardian/buildGuardianBrief.ts:323`
- **"Paid"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:307` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:447` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:303`
- **"Close"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:365` · `apps/rn/src/components/ui/AnimatedSheet.tsx:82` · `apps/rn/src/components/ui/FormSheet.tsx:165`
- **"Cushion"** _(copy+unclassified)_ — `apps/rn/src/components/plan/FloorImpactBar.tsx:76` · `apps/rn/src/components/progress/CashFlowSection.tsx:76` · `packages/core/copy/vocabulary.ts:64`
- **"Money"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:92` · `apps/rn/src/app/(tabs)/money.tsx:106`
- **"Add a bill"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:485` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:167`
- **"Snowball"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:408` · `apps/rn/src/components/payoff/StrategyCompare.tsx:58`
- **"Avalanche"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:409` · `apps/rn/src/components/payoff/StrategyCompare.tsx:59`
- **"Go to Today"** _(copy)_ — `apps/rn/src/app/(tabs)/progress.tsx:206` · `apps/rn/src/app/+not-found.tsx:21`
- **"More"** _(copy)_ — `apps/rn/src/app/more.tsx:158` · `apps/rn/src/components/more-button.tsx:45`
- **"iCloud backup"** _(copy)_ — `apps/rn/src/app/more.tsx:263` · `apps/rn/src/components/more/CloudBackupSheet.tsx:51`
- **"Your name"** _(copy)_ — `apps/rn/src/app/more.tsx:290` · `apps/rn/src/components/onboarding/CompletionStep.tsx:69`
- **"About"** _(copy)_ — `apps/rn/src/app/more.tsx:366` · `apps/rn/src/components/plan/AffordabilityCard.tsx:234`
- **"Try again"** _(copy)_ — `apps/rn/src/app/more.tsx:497` · `apps/rn/src/components/StorageErrorScreen.tsx:46`
- **"Due date"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:386` · `apps/rn/src/components/entities/ExpenseSheet.tsx:111`
- **"Recurrence"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:387` · `apps/rn/src/components/entities/ExpenseSheet.tsx:112`
- **"Choose a file"** _(copy)_ — `apps/rn/src/components/entities/ImportDebtsSheet.tsx:116` · `apps/rn/src/components/more/BackupSheets.tsx:194`
- **"Tomorrow"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:37` · `apps/rn/src/liveActivity/paydayActivityContent.ts:54`
- **"Very tight this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:41` · `packages/core/guardian/buildGuardianBrief.ts:323`
- **"e.g. 1200"** _(copy+unclassified)_ — `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:207` · `apps/rn/src/store/paycheckForm.ts:41`
- **"Continue"** _(copy)_ — `apps/rn/src/components/onboarding/PaycheckStep.tsx:85` · `apps/rn/src/components/plan/PaidOffFinale.tsx:129`
- **"It’s payday"** _(copy+unclassified)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:359` · `apps/rn/src/notifications/notifications.ts:137`
- **"Keep going"** _(copy)_ — `apps/rn/src/components/plan/MilestoneAckCard.tsx:45` · `apps/rn/src/components/plan/PaidOffBeat.tsx:139`
- **"Share"** _(copy)_ — `apps/rn/src/components/plan/PaidOffBeat.tsx:138` · `apps/rn/src/components/progress/PaidOffArchive.tsx:83`
- **"Back"** _(copy)_ — `apps/rn/src/components/plan/TutorialOverlay.tsx:453` · `apps/rn/src/components/screen.tsx:67`
- **"Weekly"** _(copy+unclassified)_ — `apps/rn/src/store/obligationForm.ts:25` · `apps/rn/src/store/paycheckForm.ts:31`
- **"Safety net"** _(copy+unclassified)_ — `packages/core/copy/vocabulary.ts:71` · `packages/core/engine/allocatePaycheck.ts:602`

## Copy gated on a condition — is the gate the thing the copy claims?

The audit gate's proxy-gate sweep, as a list. For each row ask one question: **does the
condition actually establish what the words assert, or does it merely correlate with it?**

The live instance this was built from read exactly like a row here —
`prefill` → `"Add from scan"` / `"Add a debt"` — where `prefill` had stopped meaning "scanned"
the moment a second producer was added. Two audit passes and three green web specs missed it.

| file | condition | when true | when false |
|---|---|---|---|
| `apps/rn/src/app/(tabs)/index.tsx:637` | `intentRollback.kind === 'log-payment'` | "Payment logged — I updated your balance." | "Payday landed — I rolled your plan forward to this paycheck." |
| `apps/rn/src/app/(tabs)/index.tsx:977` | `selectReserveWalkback(s.store)` | "A surprise bill came up — I’ve restored your safety net for now." | — |
| `apps/rn/src/app/(tabs)/money.tsx:413` | `strategy === 'snowball'` | "Smallest balance first — quick wins. Your debts are listed in payoff order." | "Highest APR first — least interest. Your debts are listed in payoff order." |
| `apps/rn/src/app/(tabs)/money.tsx:582` | `focus` | "Focus" | — |
| `apps/rn/src/app/(tabs)/money.tsx:583` | `isBnpl` | "BNPL" | "Autopay" |
| `apps/rn/src/app/(tabs)/money.tsx:585` | `debt.isAutopay` | "Autopay" | — |
| `apps/rn/src/app/(tabs)/money.tsx:603` | `minimumUnread` | — | "/mo" · "/mo" |
| `apps/rn/src/app/(tabs)/money.tsx:603` | `isBnpl` | "/mo" | "/mo" |
| `apps/rn/src/app/(tabs)/money.tsx:851` | `expensesUnread` | "A bill amount could not be read, so there is no recommendation yet" | — |
| `apps/rn/src/app/(tabs)/money.tsx:916` | `item.expenseType === 'variable'` | "· Variable" | — |
| `apps/rn/src/app/(tabs)/money.tsx:919` | `item.isAutopay` | "Autopay" | — |
| `apps/rn/src/app/(tabs)/money.tsx:1049` | `empty` | "Everyday spending reserve, nothing set up yet. Opens management." | "Everyday spending reserve, some amounts could not be read. Opens management." |
| `apps/rn/src/app/(tabs)/money.tsx:1051` | `unread` | "Everyday spending reserve, some amounts could not be read. Opens management." | — |
| `apps/rn/src/app/(tabs)/money.tsx:1064` | `empty` | "Not set up" | — |
| `apps/rn/src/app/(tabs)/money.tsx:1070` | `empty` | "Groceries, gas, fun money — reserve it each paycheck" | "Some amounts could not be read · tap to set them again" |
| `apps/rn/src/app/(tabs)/money.tsx:1074` | `unread` | "Some amounts could not be read · tap to set them again" | "Reserved each paycheck · tap to manage" |
| `apps/rn/src/app/(tabs)/money.tsx:1076` | `shortHeld` | — | "Reserved each paycheck · tap to manage" |
| `apps/rn/src/app/(tabs)/money.tsx:1155` | `savedUnread` | "Some amounts unread" | — |
| `apps/rn/src/app/(tabs)/money.tsx:1243` | `targetUnreadable && savedUnreadable` | "Neither amount could be read" | "Saved amount could not be read" |
| `apps/rn/src/app/(tabs)/money.tsx:1245` | `savedUnreadable` | "Saved amount could not be read" | "Target could not be read" |
| `apps/rn/src/app/(tabs)/money.tsx:1247` | `targetUnreadable` | "Target could not be read" | — |
| `apps/rn/src/app/(tabs)/progress.tsx:260` | `reached.length` | — | "no milestones reached yet" |
| `apps/rn/src/app/(tabs)/progress.tsx:261` | `nextT` | — | "all milestones reached" |
| `apps/rn/src/app/(tabs)/progress.tsx:261` | `nextT === 100` | "debt-free" | — |
| `apps/rn/src/app/living-expenses.tsx:94` | `item.enabled` | "Counts toward reserve" | "Not counted" |
| `apps/rn/src/app/more.tsx:245` | `tipsReset` | "Tips will appear again as you go." | "Short tips that point out what each screen can do." |
| `apps/rn/src/app/more.tsx:488` | `blocked === 'unavailable'` | "Nothing was deleted. Sign in to iCloud on this device so the backup there can be erased too — or delete on this device only." | "Nothing was deleted. iCloud couldn’t be reached, so the backup there would have survived — try again, or delete on this device only." |
| `apps/rn/src/app/paywall.tsx:289` | `kind === 'lifetime'` | "You’re on Premium — Lifetime. Thanks for the support." | "You’re on Premium — thanks for the support." |
| `apps/rn/src/app/paywall.tsx:375` | `restoring` | "Restoring…" | "Restore purchases" |
| `apps/rn/src/components/AppLockGate.tsx:37` | `authing` | "Unlocking…" | "Unlock" |
| `apps/rn/src/components/entities/AmortizationView.tsx:86` | `amort.monthlyExtra > 0` | "— minimum + your extra" | "— the minimum" |
| `apps/rn/src/components/entities/DebtSheet.tsx:278` | `isEdit` | "Edit debt" | "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:278` | `convertingExpenseId` | "Add a debt" | "Add from scan" · "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:278` | `prefill` | "Add from scan" | "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:280` | `isEdit` | — | "Moving this from Expenses. Add the balance so it counts toward your debt-free date." |
| `apps/rn/src/components/entities/DebtSheet.tsx:282` | `convertingExpenseId` | "Moving this from Expenses. Add the balance so it counts toward your debt-free date." | "Review the scanned details, then add." · "A loan, credit card, or BNPL balance." |
| `apps/rn/src/components/entities/DebtSheet.tsx:284` | `prefill` | "Review the scanned details, then add." | "A loan, credit card, or BNPL balance." |
| `apps/rn/src/components/entities/DebtSheet.tsx:288` | `isEdit` | "Save" | "Add debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:335` | `type === 'bnpl'` | "Affirm — Sofa" | "Visa, Car Loan" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:101` | `isEdit` | "Edit expense" | "Add an expense" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:103` | `isEdit` | "Save" | "Add expense" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:109` | `trial` | "Amount now (0 for a free trial)" | "Amount" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:109` | `trial` | "e.g. 0" | "e.g. 850" |
| `apps/rn/src/components/entities/GoalSheet.tsx:154` | `isEdit` | "Edit goal" | "Add a goal" |
| `apps/rn/src/components/entities/GoalSheet.tsx:156` | `isEdit` | "Save" | "Add goal" |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx:53` | `isEdit` | "Edit spending item" | "Add a spending item" |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx:55` | `isEdit` | "Save" | "Add item" |
| `apps/rn/src/components/entities/LogPaymentSheet.tsx:55` | `over` | "More than the balance — this will clear it to $0." | — |
| `apps/rn/src/components/money/BillBreakdownSheet.tsx:74` | `data.unread` | "set the unread amounts again and your recommendation comes back" | — |
| `apps/rn/src/components/money/BillBreakdownSheet.tsx:112` | `b.unread` | "amount could not be read" | — |
| `apps/rn/src/components/money/BnplCalendarSection.tsx:124` | `moreCount === 1` | — | "installments" |
| `apps/rn/src/components/more/BackupSheets.tsx:69` | `BACKUP_FILE_SUPPORTED` | "Save as a file" | — |
| `apps/rn/src/components/more/BackupSheets.tsx:71` | `copied` | "Copied ✓" | "Copy to clipboard" |
| `apps/rn/src/components/more/BackupSheets.tsx:92` | `copied` | "Copied ✓" | "Copy to clipboard" |
| `apps/rn/src/components/more/BackupSheets.tsx:102` | `showRaw` | "Hide the raw backup data" | "Show the raw backup data" |
| `apps/rn/src/components/more/BackupSheets.tsx:104` | `showRaw` | "Hide the raw data" | "Show the raw data" |
| `apps/rn/src/components/more/CloudBackupSheet.tsx:80` | `status === 'loading'` | "Checking iCloud…" | — |
| `apps/rn/src/components/more/CloudBackupSheet.tsx:86` | `unclaimedRemoteAt` | — | "Not backed up yet" |
| `apps/rn/src/components/more/CloudBackupSheet.tsx:88` | `lastBackupAt` | — | "Not backed up yet" |
| `apps/rn/src/components/more/CoachMarkProbeReadout.tsx:40` | `entries.length` | — | "EMPTY" |
| `apps/rn/src/components/more/LiveActivityQA.tsx:56` | `enabled` | "Start a state, then check the Lock Screen / Dynamic Island. (iOS only.)" | "Live Activities are OFF in device Settings, or unsupported here (web / <iOS 16.2)." |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:150` | `type === 'debt'` | "Something with a balance you’re paying down — a card, a loan, a mortgage. It ends." | "An ongoing cost that doesn’t end — rent, phone, a subscription." |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:157` | `type === 'debt'` | "Debt name" | "Expense name" |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:163` | `type === 'debt'` | "e.g. Visa Card" | "e.g. Rent" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:265` | `preMarkAllPaid` | "Undo" | "Mark all paid" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:297` | `row.view.isAutopay` | "Autopay · should have run" · "Autopay" | — |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:298` | `row.view.presumedPaid` | "Autopay · should have run" | "Autopay" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:307` | `paid` | "Paid" | "Didn’t pay" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:391` | `staleBalances.length === 1` | "1 balance hasn’t been checked in a while" | — |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:427` | `external` | "From savings ✓" | "From savings" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:447` | `skipped` | "Skipped" | "Paid" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:486` | `hasAdjustedRequired \|\| extrasAdjusted` | "Confirm what you paid" | "You followed the plan" |
| `apps/rn/src/components/payoff/StrategyCompare.tsx:86` | `active` | "· yours" | — |
| `apps/rn/src/components/payoff/StrategyCompare.tsx:89` | `summary.debtFreeMonth == null` | "No payoff date" | — |
| `apps/rn/src/components/payoff/StrategyCompare.tsx:96` | `i === 0` | "1st ·" | — |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx:394` | `debtFreeDate` | — | "projected balance over time" |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx:395` | `showMinimums` | "your plan clears faster than minimum payments" | — |
| `apps/rn/src/components/plan/AffordabilityCard.tsx:254` | `result.verdict === 'tight'` | "Apply anyway" | "Apply to this paycheck" |
| `apps/rn/src/components/plan/CashRunwayChart.tsx:202` | `sel === 0` | "This paycheck" | — |
| `apps/rn/src/components/plan/dataRepairsCopy.ts:152` | `one` | "An amount could not be read" | — |
| `apps/rn/src/components/plan/dataRepairsCopy.ts:153` | `one` | "Your plan is running without it until you set it again." | "Your plan is running without them until you set each one again." |
| `apps/rn/src/components/plan/dataRepairsCopy.ts:173` | `one` | "There is nothing to reopen for it — check this against your old app and add anything missing." | "There is nothing to reopen for them — check these against your old app and add anything missing." |
| `apps/rn/src/components/plan/dataRepairsCopy.ts:184` | `one` | "An amount was written in a different format" | — |
| `apps/rn/src/components/plan/dataRepairsCopy.ts:187` | `one` | "Your plan is using it — check the number looks right." | "Your plan is using them — check the numbers look right." |
| `apps/rn/src/components/plan/ExampleCanvasMarker.tsx:105` | `hasRealPlan` | "Back to my plan" | "Start my real plan" |
| `apps/rn/src/components/plan/LeanSuggestionCard.tsx:31` | `up` | "Raise your income floor" | "Adjust your income floor" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:189` | `isExample` | "Example" | — |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:209` | `brief.debtFree` | "To savings" | "To debt" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:285` | `brief.debtFree` | "To savings" | "To debt" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:405` | `attestation?.attested` | "Undoes the confirmation and restores the full safety net" | "Tells me your expenses are all entered, so I hold less back" |
| `apps/rn/src/components/plan/PlanHero.tsx:158` | `onEditPaycheck` | "Edit paycheck" | — |
| `apps/rn/src/components/plan/PlanHero.tsx:248` | `windfall > 0` | — | "Add extra income" |
| `apps/rn/src/components/plan/PlanHero.tsx:252` | `windfall > 0` | — | "Add extra income" |
| `apps/rn/src/components/plan/RecommendedActionsCard.tsx:67` | `a.paymentSource === 'external'` | "Completed with outside money" | "Completed this paycheck" |
| `apps/rn/src/components/plan/RecoveryPlanSection.tsx:97` | `coverExpanded` | "Show fewer" | — |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:152` | `outstanding === 0` | "An amount this paycheck has to cover could not be read, so this list is incomplete — set it again above and it comes back." | "One more amount could not be read, so this list is short of at least one thing — set it again above and it comes back." |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:191` | `shortfallAdviceOwnedElsewhere` | "Not covered by this paycheck — your recovery plan below works through these." | "Short this paycheck — cover these from savings or your next paycheck." |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:240` | `bucketHasReserve` | "from this paycheck" | — |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:260` | `bucketHasReserve` | "from this paycheck" | — |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:300` | `paid` | "Undo, mark unpaid" | "Mark paid" |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:303` | `paid` | "Undo" | "Paid" |
| `apps/rn/src/components/plan/SaveForItSheet.tsx:138` | `o.readyBy != null && o.paychecks != null` | — | "Saved after debt · no firm date" |
| `apps/rn/src/components/plan/SpokenForSheet.tsx:66` | `shortHeld` | — | "Groceries, gas, fun money — reserved every paycheck." |
| `apps/rn/src/components/plan/TutorialOverlay.tsx:452` | `isLast` | "Finish" | "Next" |
| `apps/rn/src/components/plan/WindfallSheet.tsx:82` | `isPremium && hasSplit` | "Confirm" | "Add" |
| `apps/rn/src/components/ui/DateField.tsx:93` | `value` | — | "Select a date" |
| `apps/rn/src/components/ui/ListRow.tsx:95` | `onPress` | "Opens the editor" | — |
| `apps/rn/src/components/ui/ListRow.tsx:164` | `onPress` | "Edit" | — |
| `apps/rn/src/utils/confirm.ts:55` | `action` | "Not now" | — |
| `packages/core/guardian/buildGuardianBrief.ts:260` | `isPremium` | "Update your numbers and I’ll plan from where you actually are." | — |
| `packages/core/guardian/buildGuardianBrief.ts:291` | `debtFree` | — | "expenses and minimums" |
| `packages/core/guardian/buildGuardianBrief.ts:292` | `isPremium` | "— this one needs a plan." | — |
| `packages/core/guardian/buildGuardianBrief.ts:308` | `state === "clear"` | "Looks clear this paycheck" | "A little tight this paycheck" · "Tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:308` | `state === "tight"` | "A little tight this paycheck" | "Tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:309` | `state === "clear"` | — | "— a bit tight this one, so keep an eye on the essentials." |
| `packages/core/guardian/buildGuardianBrief.ts:323` | `state === "at-risk"` | "Very tight this paycheck" | "A little tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:328` | `state === "at-risk"` | — | "a little under" |
| `packages/core/guardian/buildGuardianBrief.ts:377` | `debtFree` | — | "to debt" |
| `packages/core/guardian/buildGuardianBrief.ts:389` | `debtFree` | "your goals" | — |
| `packages/core/insights/buildSmartInsights.ts:57` | `amountToHold > 0` | — | "Run minimum-only until the next paycheck if any new expenses appear." |
| `packages/core/insights/buildSmartInsights.ts:95` | `projectedBuffer < 200` | "Focus on restoring cushion first, then target this payoff opportunity once cash pressure improves." | "Make this payment after handling required bills and minimums to immediately free up that monthly minimum." |
| `packages/core/insights/buildSmartInsights.ts:97` | `canFullyCover` | "Make this payment after handling required bills and minimums to immediately free up that monthly minimum." | — |
| `packages/core/insights/buildSmartInsights.ts:110` | `highestAprDebt` | — | "Prioritize the highest APR debt first to reduce long-term interest cost." |

## Every string, by file


### `apps/rn/src/app/_layout.tsx`

| line | origin | string |
|---|---|---|
| 219 | call:notify ⚠️ | Restore from iCloud? |
| 220 | call:notify ⚠️ | There is a backup of your plan in your iCloud account. Restore it to this device? |
| 222 | key:label | Restore |
| 311 | other ⚠️ | (tabs) |
| 317 | other ⚠️ | schedule/[id] |
| 335 | other ⚠️ | +not-found |

### `apps/rn/src/app/(tabs)/_layout.tsx`

| line | origin | string |
|---|---|---|
| 82 | prop:options ⚠️ | Today |
| 87 | prop:options ⚠️ | Progress |
| 92 | prop:options ⚠️ | Money |

### `apps/rn/src/app/(tabs)/index.tsx`

| line | origin | string |
|---|---|---|
| 292 | call:useSuppressCoachMarks ⚠️ | today:celebration |
| 292 | call:useSuppressCoachMarks ⚠️ | today:invite |
| 301 | prop:title | Set up your paycheck |
| 302 | prop:body | Add your paycheck to see exactly what to pay each cycle. |
| 303 | prop:cta | Set up your paycheck |
| 483 | prop:title | Add your bills |
| 484 | prop:body | Rent, utilities, subscriptions. Until they are here, this plan counts that money as free to spend. |
| 485 | prop:cta | Add a bill |
| 496 | prop:title | Add your first debt |
| 497 | prop:body | Your plan is running. Add a debt and it will show you a debt-free date too. |
| 498 | prop:cta | Add a debt |
| 590 | jsx-text | Good news — this paycheck looks clear after all. |
| 592 | prop:label | Got it |
| 610 | prop:label | Got it |
| 624 | jsx-text | A surprise bill came up — I’ve restored your safety net for now. |
| 627 | prop:label | Got it |
| 638 | jsx-expr | Payment logged — I updated your balance. |
| 639 | jsx-expr | Payday landed — I rolled your plan forward to this paycheck. |
| 643 | prop:label | Undo |
| 644 | prop:label | Keep |
| 659 | jsx-text | Your |
| 659 | jsx-text | trial has ended — it’s now |
| 660 | jsx-text | . Keeping it? |
| 667 | prop:label | Keep it |
| 670 | prop:label | Cancelled it |
| 671 | prop:label | Not now |
| 699 | jsx-text | Ready for your next pay cycle. Starting it applies this cycle’s payments and builds your next plan. |
| 701 | prop:label | Start next pay cycle |
| 714 | prop:label | Review this payday first |
| 725 | jsx-text | Private · on your device |
| 779 | prop:onManageEveryday ⚠️ | /living-expenses |
| 977 | call:useStore ⚠️ | A surprise bill came up — I’ve restored your safety net for now. |

### `apps/rn/src/app/(tabs)/money.tsx`

| line | origin | string |
|---|---|---|
| 77 | key:debts ⚠️ | Balances you’re paying down. These have an end date, and they set your debt-free date. |
| 78 | key:bills ⚠️ | Ongoing costs that don’t end. Reserved from every paycheck before anything goes to debt. |
| 79 | key:goals ⚠️ | Money you’re setting aside — saved for, not owed. |
| 106 | prop:title | Money |
| 111 | prop:options ⚠️ | Debts |
| 112 | prop:options ⚠️ | Expenses |
| 113 | prop:options ⚠️ | Goals |
| 169 | jsx-text | Is this a debt you’re paying down? Debts count toward your debt-free date — expenses don’t. |
| 173 | jsx-text | Move to Debts |
| 183 | jsx-text | Not a debt |
| 320 | prop:title | Start your debt-free plan |
| 321 | prop:body | Add a loan, credit card, or BNPL balance to see your debt-free date. |
| 322 | prop:cta | Add |
| 326 | prop:label | Scan a statement |
| 329 | prop:label | Import from CSV |
| 345 | key:title | PAID OFF |
| 378 | prop:value | Every balance cleared |
| 394 | prop:value | Some balances unread |
| 395 | prop:sub ⚠️ | set them again and your total comes back |
| 408 | prop:options ⚠️ | Snowball |
| 409 | prop:options ⚠️ | Avalanche |
| 414 | jsx-expr | Smallest balance first — quick wins. Your debts are listed in payoff order. |
| 415 | jsx-expr | Highest APR first — least interest. Your debts are listed in payoff order. |
| 444 | prop:label | Add |
| 446 | prop:label | Scan a statement |
| 449 | prop:label | Import from CSV |
| 475 | jsx-text | Select a debt to edit, or add one. |
| 537 | call:rowFieldUnread ⚠️ | minimumPayment |
| 538 | call:rowFieldUnread ⚠️ | originalBalance |
| 542 | var:captionText ⚠️ | estimated · tap to verify |
| 582 | key:label | Focus |
| 584 | key:label | BNPL |
| 586 | key:label | Autopay |
| 603 | prop:amountSuffix ⚠️ | /mo |
| 603 | prop:amountSuffix ⚠️ | /mo |
| 678 | call:anyRowFieldUnread ⚠️ | requiredExpense |
| 701 | call:rowFieldUnread ⚠️ | requiredExpense |
| 733 | call:rowFieldUnread ⚠️ | requiredExpense |
| 759 | key:subtotalA11y ⚠️ | an amount here could not be read |
| 776 | key:subtotalA11y ⚠️ | an amount here could not be read |
| 798 | prop:title | Build your paycheck plan |
| 799 | prop:body | Add an ongoing cost — rent, utilities, a subscription — so your plan knows what’s due. |
| 800 | prop:cta | Add |
| 842 | key:sub ⚠️ | set them again and your total comes back |
| 848 | key:sub ⚠️ | reserved for upcoming expenses |
| 852 | key:caption | A bill amount could not be read, so there is no recommendation yet |
| 910 | prop:renderItem ⚠️ | requiredExpense |
| 911 | prop:renderItem ⚠️ | requiredExpense |
| 916 | prop:meta | · Variable |
| 919 | prop:badges ⚠️ | Autopay |
| 931 | jsx-text | No expenses match “ |
| 936 | prop:label | Add |
| 974 | prop:placeholder | Search expenses |
| 981 | prop:accessibilityLabel | Clear search |
| 1034 | call:anyRowFieldUnread ⚠️ | livingExpense |
| 1050 | prop:accessibilityLabel | Everyday spending reserve, nothing set up yet. Opens management. |
| 1052 | prop:accessibilityLabel | Everyday spending reserve, some amounts could not be read. Opens management. |
| 1061 | jsx-text | Everyday spending reserve |
| 1064 | jsx-expr | Not set up |
| 1071 | jsx-expr | Groceries, gas, fun money — reserve it each paycheck |
| 1075 | jsx-expr | Some amounts could not be read · tap to set them again |
| 1078 | jsx-expr | Reserved each paycheck · tap to manage |
| 1107 | prop:title | Start a savings goal |
| 1108 | prop:body | Add an emergency fund or savings goal to start tracking progress. |
| 1109 | prop:cta | Add |
| 1149 | call:rowFieldUnread ⚠️ | targetAmount |
| 1150 | call:rowFieldUnread ⚠️ | currentAmount |
| 1155 | prop:value | Some amounts unread |
| 1158 | prop:sub ⚠️ | set them again and your total comes back |
| 1160 | prop:sub ⚠️ | saved — one target could not be read |
| 1197 | call:rowFieldUnread ⚠️ | targetAmount |
| 1198 | call:rowFieldUnread ⚠️ | currentAmount |
| 1203 | var:meta ⚠️ | Emergency fund |
| 1203 | var:meta ⚠️ | Savings |
| 1244 | prop:caption | Neither amount could be read |
| 1246 | prop:caption | Saved amount could not be read |
| 1248 | prop:caption | Target could not be read |
| 1251 | prop:badges ⚠️ | Funded |
| 1259 | prop:label | Add |

### `apps/rn/src/app/(tabs)/progress.tsx`

| line | origin | string |
|---|---|---|
| 175 | prop:title | Progress |
| 181 | jsx-text | DEBT-FREE |
| 182 | jsx-text | Every balance paid off |
| 183 | jsx-text | Your trophy shelf is below. |
| 201 | prop:title | Progress |
| 204 | prop:title | Some balances couldn’t be read |
| 205 | prop:body | Your payoff journey needs figures it can trust. Set the amounts again from the note on Today and this fills back in. |
| 206 | prop:cta | Go to Today |
| 213 | prop:title | Progress |
| 216 | prop:title | Your payoff journey starts here |
| 217 | prop:body | Add a debt to see your payoff order, timeline, and interest saved. |
| 218 | prop:cta | Add a debt |
| 260 | call:groupLabel | no milestones reached yet |
| 261 | call:groupLabel | debt-free |
| 261 | call:groupLabel | all milestones reached |
| 271 | prop:title | Progress |
| 299 | jsx-text | DEBT-FREE |

### `apps/rn/src/app/+not-found.tsx`

| line | origin | string |
|---|---|---|
| 12 | prop:options ⚠️ | Not found |
| 14 | jsx-text | This screen doesn’t exist. |
| 21 | jsx-text | Go to Today |

### `apps/rn/src/app/cushion-forecast.tsx`

| line | origin | string |
|---|---|---|
| 33 | call:announce ⚠️ | Cushion forecast |
| 37 | prop:title | Your cushion forecast |
| 52 | prop:title | Your cushion forecast is part of Premium |
| 53 | prop:body | See your cushion projected across the next six paydays, where it dips below your line, and how accurate your Guardian has been. |
| 54 | prop:cta | See Premium |
| 55 | prop:onCta ⚠️ | /paywall?from=cushion-forecast |

### `apps/rn/src/app/history.tsx`

| line | origin | string |
|---|---|---|
| 45 | jsx-text | paid down across |
| 50 | jsx-text | See how far you’ve come, one cycle at a time. |
| 67 | jsx-text | No finished cycles yet. When you start your next pay cycle, that completed cycle shows up here. |

### `apps/rn/src/app/living-expenses.tsx`

| line | origin | string |
|---|---|---|
| 41 | call:anyRowFieldUnread ⚠️ | livingExpense |
| 46 | jsx-text | Everyday spending reserved each paycheck, before debt and goals. |
| 52 | prop:title | No spending items yet |
| 53 | prop:body | Add groceries, gas, or fun money to reserve for everyday spending each paycheck. |
| 54 | prop:cta | Add your first item |
| 60 | jsx-text | Reserve per paycheck |
| 79 | jsx-text | Some amounts could not be read — set them again and your total comes back. |
| 88 | call:rowFieldUnread ⚠️ | livingExpense |
| 89 | call:unreadFieldsFor ⚠️ | livingExpense |
| 94 | prop:meta | Counts toward reserve |
| 94 | prop:meta | Not counted |
| 97 | prop:badges ⚠️ | Off |
| 108 | prop:label | Add spending item |

### `apps/rn/src/app/more.tsx`

| line | origin | string |
|---|---|---|
| 96 | call:notify ⚠️ | Notifications are off for Debt Planner |
| 97 | call:notify ⚠️ | iOS only asks once. You can turn them back on in Settings. |
| 98 | key:label | Open Settings |
| 103 | call:notify ⚠️ | Notifications stay off |
| 103 | call:notify ⚠️ | You can turn them on here whenever you want a nudge before a bill is due. |
| 106 | call:notify ⚠️ | Not available here |
| 106 | call:notify ⚠️ | Reminders are a feature of the iPhone app. |
| 158 | prop:title | More |
| 176 | prop:label | Premium |
| 177 | prop:subtitle | Active — thanks for the support. |
| 185 | prop:label | Premium — Lifetime |
| 186 | prop:subtitle | Active — a one-time purchase, yours forever. Thanks for the support. |
| 192 | prop:label | Premium |
| 193 | prop:subtitle | Active — thanks for the support. Tap to manage your subscription. |
| 202 | prop:subtitle | Payday Guardian, Can I Afford It & more. |
| 215 | prop:subtitle | Look back at your finished pay cycles. |
| 223 | prop:label | How your Guardian works |
| 224 | prop:subtitle | Replay the short walkthrough. |
| 237 | prop:label | Show feature tips again |
| 245 | prop:subtitle | Tips will appear again as you go. |
| 245 | prop:subtitle | Short tips that point out what each screen can do. |
| 254 | prop:title | Data |
| 256 | prop:subtitle | Save a copy of your data. |
| 257 | prop:subtitle | Restore from a saved backup. |
| 263 | prop:label | iCloud backup |
| 264 | prop:subtitle | Keep a copy in your own iCloud account. |
| 278 | prop:label | Delete all data |
| 283 | prop:title | Preferences |
| 290 | prop:label | Your name |
| 294 | prop:placeholder | Used to greet you on Today |
| 300 | jsx-text | Appearance |
| 305 | prop:options ⚠️ | Auto |
| 306 | prop:options ⚠️ | Light |
| 307 | prop:options ⚠️ | Dark |
| 315 | prop:label | Notifications |
| 316 | prop:subtitle | Paycheck-eve reminder and due-date alerts. |
| 317 | prop:accessibilityLabel | Notifications |
| 321 | prop:label | App Lock |
| 322 | prop:subtitle | Require Face ID / passcode to open. |
| 323 | prop:accessibilityLabel | App Lock |
| 341 | prop:label | Savings elsewhere |
| 342 | prop:subtitle | Skip building a starter emergency fund — put more toward debt first. |
| 343 | prop:accessibilityLabel | Savings elsewhere |
| 350 | prop:label | Payday countdown |
| 351 | prop:subtitle | Show a Live Activity in the ~3 days before payday. |
| 352 | prop:accessibilityLabel | Payday countdown |
| 358 | prop:label | Debt-free sound |
| 359 | prop:subtitle | Play a chime when you clear your last debt. |
| 360 | prop:accessibilityLabel | Debt-free sound |
| 362 | prop:subtitle | What you reserve for day-to-day spending each paycheck. |
| 366 | prop:title | About |
| 369 | prop:label | Terms of Use |
| 370 | prop:label | Support |
| 375 | prop:label | Manage Subscription |
| 377 | prop:label | Version |
| 385 | prop:title | Developer / QA |
| 389 | prop:label | Simulate Premium |
| 390 | prop:subtitle | Unlock premium features for testing (dev / TestFlight QA). |
| 393 | prop:accessibilityLabel | Simulate Premium |
| 413 | prop:label | Send a test error to Sentry |
| 414 | prop:subtitle | QA only — check the issue’s breadcrumbs carry no amounts. |
| 416 | prop:onPress ⚠️ | QA test event — Debt Planner device pass |
| 420 | prop:onPress ⚠️ | Check sentry.io → debt-planner → Issues, then read the breadcrumbs. |
| 489 | jsx-expr | Nothing was deleted. Sign in to iCloud on this device so the backup there can be erased too — or delete on this device only. |
| 490 | jsx-expr | Nothing was deleted. iCloud couldn’t be reached, so the backup there would have survived — try again, or delete on this device only. |
| 494 | prop:label | Cancel |
| 497 | prop:label | Try again |
| 501 | prop:label | Delete on this device only |
| 512 | jsx-text | All debts, expenses, goals, and settings will be permanently erased — on this device and in your         iCloud backup. This cannot be undone. |
| 517 | prop:label | Cancel |
| 520 | prop:label | Delete everything |

### `apps/rn/src/app/paywall.tsx`

| line | origin | string |
|---|---|---|
| 33 | key:text | Payday Guardian — works out how much to keep back each payday to protect your cushion, and reshapes the plan around it. |
| 34 | key:text | Can I Afford It? — apply any purchase to your plan in one tap, or build a plan to save for it. |
| 35 | key:text | Recovery Plan — a guided catch-up when a cycle comes up short. |
| 41 | key:text | Balances that keep themselves roughly right — projected forward between statements, or re-scanned in seconds. No monthly retyping. |
| 47 | var:AUTO_RENEW_DISCLOSURE | Payment will be charged to your Apple Account at confirmation of purchase. Subscriptions |
| 48 | var:AUTO_RENEW_DISCLOSURE | automatically renew unless canceled at least 24 hours before the end of the current period. Your |
| 49 | var:AUTO_RENEW_DISCLOSURE | account is charged for renewal within 24 hours prior to the end of the current period. Manage or |
| 50 | var:AUTO_RENEW_DISCLOSURE | cancel anytime in your App Store account settings. Lifetime is a one-time purchase (not a |
| 51 | var:AUTO_RENEW_DISCLOSURE | subscription) that covers all current Premium features; any future add-on tiers, like bank |
| 52 | var:AUTO_RENEW_DISCLOSURE | connection or an AI coach, are sold separately. |
| 68 | var:LIFETIME_SUBNOTE ⚠️ | Pay once — all today’s Premium, forever |
| 75 | key:title | Annual |
| 75 | key:periodLabel | per year |
| 75 | key:subnote | Billed yearly · $2.50/mo |
| 75 | key:badge | Best value |
| 76 | key:title | Lifetime |
| 76 | key:periodLabel | one time |
| 76 | key:badge | Pay once |
| 77 | key:title | Monthly |
| 77 | key:periodLabel | per month |
| 77 | key:subnote | Billed monthly |
| 90 | other ⚠️ | ANNUAL |
| 95 | key:title | Annual |
| 95 | key:periodLabel | per year |
| 95 | key:badge | Best value |
| 97 | other ⚠️ | LIFETIME |
| 99 | key:title | Lifetime |
| 99 | key:periodLabel | one time |
| 99 | key:badge | Pay once |
| 100 | other ⚠️ | MONTHLY |
| 101 | key:title | Monthly |
| 101 | key:periodLabel | per month |
| 186 | call:notify ⚠️ | Not available here |
| 186 | call:notify ⚠️ | In-app purchases aren’t available in this preview — try it on your device. |
| 195 | call:notify ⚠️ | You’re on Premium |
| 195 | call:notify ⚠️ | Your premium tools are unlocked. |
| 200 | call:notify ⚠️ | Almost there |
| 200 | call:notify ⚠️ | Your purchase went through, but Premium couldn’t be confirmed yet. Tap Restore, or contact support if it persists. |
| 203 | call:notify ⚠️ | Purchase didn’t complete |
| 203 | call:notify ⚠️ | Something went wrong. Please try again. |
| 211 | call:notify ⚠️ | Not available here |
| 211 | call:notify ⚠️ | Restoring purchases isn’t available in this preview. |
| 219 | call:notify ⚠️ | Purchases restored |
| 219 | call:notify ⚠️ | Your premium access is back. |
| 222 | call:notify ⚠️ | Nothing to restore |
| 222 | call:notify ⚠️ | No active purchase was found for this Apple Account. |
| 225 | call:notify ⚠️ | Restore didn’t complete |
| 225 | call:notify ⚠️ | Something went wrong. Please try again. |
| 232 | var:ctaLabel ⚠️ | Starting… |
| 243 | prop:title | Premium |
| 246 | jsx-text | Every payday, worked out for you |
| 252 | jsx-text | The app does the arithmetic — the money moves stay yours. |
| 289 | jsx-expr | You’re on Premium — Lifetime. Thanks for the support. |
| 289 | jsx-expr | You’re on Premium — thanks for the support. |
| 295 | prop:label | Manage subscription |
| 304 | jsx-text | Plans couldn’t load right now. Check your connection and try again. |
| 306 | prop:label | Retry |
| 375 | jsx-expr | Restoring… |
| 375 | jsx-expr | Restore purchases |
| 382 | jsx-text | Terms of Use (EULA) |

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

### `apps/rn/src/components/DataResetScreen.tsx`

| line | origin | string |
|---|---|---|
| 77 | jsx-text | We couldn’t open your saved plan |
| 80 | jsx-text | Something was wrong with the file, so the app started fresh. Nothing was deleted — your old             data is still set aside on this device, and any iCloud backup is untouched. |
| 101 | prop:label | Import a backup file |
| 107 | prop:label | Start fresh |

### `apps/rn/src/components/entities/AddObligationSheet.tsx`

| line | origin | string |
|---|---|---|
| 37 | key:debts ⚠️ | Something with a balance you’re paying down. It ends. |
| 38 | key:bills ⚠️ | An ongoing cost that doesn’t end. |
| 39 | key:goals ⚠️ | Money you’re setting aside for something. |
| 45 | key:title | A debt |
| 47 | key:examples ⚠️ | Credit card · Car loan · Mortgage · Buy-now-pay-later |
| 52 | key:title | An expense |
| 54 | key:examples ⚠️ | Rent · Phone · Electric · Subscriptions |
| 59 | key:title | A savings goal |
| 63 | key:examples ⚠️ | Emergency fund · A trip · A new laptop |
| 77 | prop:title | What are you adding? |
| 81 | prop:subtitle | It’ll go in the right place. |

### `apps/rn/src/components/entities/AmortizationView.tsx`

| line | origin | string |
|---|---|---|
| 22 | call:addMonthsToDate ⚠️ | en-US |
| 56 | jsx-text | No schedule to show. |
| 68 | jsx-text | At |
| 68 | jsx-text | /mo the interest outpaces the balance, so this debt never gets           paid off. Increasing the payment fixes it. |
| 76 | jsx-text | debt-free · |
| 85 | jsx-text | Paying |
| 85 | jsx-text | /mo |
| 86 | jsx-expr | — minimum + your extra |
| 86 | jsx-expr | — the minimum |
| 90 | jsx-text | MONTH |
| 91 | jsx-text | BALANCE |
| 107 | jsx-text | interest · |
| 121 | jsx-text | Show all |

### `apps/rn/src/components/entities/DebtSheet.tsx`

| line | origin | string |
|---|---|---|
| 50 | key:label | Every 3 months |
| 61 | key:label | Not specified |
| 63 | key:label | Other |
| 200 | call:setError | Enter the payment amount. |
| 201 | call:setError | Enter how many payments are left. |
| 227 | call:setError | Minimum payment can’t exceed the balance. |
| 278 | prop:title | Edit debt |
| 278 | prop:title | Add a debt |
| 278 | prop:title | Add from scan |
| 278 | prop:title | Add a debt |
| 283 | prop:subtitle | Moving this from Expenses. Add the balance so it counts toward your debt-free date. |
| 285 | prop:subtitle | Review the scanned details, then add. |
| 286 | prop:subtitle | A loan, credit card, or BNPL balance. |
| 288 | prop:submitLabel | Save |
| 288 | prop:submitLabel | Add debt |
| 327 | jsx-text | View payoff schedule |
| 335 | prop:label | Name |
| 335 | prop:placeholder | Affirm — Sofa |
| 335 | prop:placeholder | Visa, Car Loan |
| 337 | prop:label | Type |
| 339 | prop:options ⚠️ | Debt / loan |
| 339 | prop:options ⚠️ | BNPL (buy now, pay later) |
| 346 | prop:label | Provider |
| 347 | prop:label | Payment amount |
| 347 | prop:placeholder | e.g. 100 |
| 348 | prop:label | Payments remaining |
| 348 | prop:placeholder | e.g. 4 |
| 349 | prop:label | How often |
| 350 | prop:label | Next payment |
| 353 | jsx-text | left · interest-free |
| 362 | prop:accessibilityLabel | Re-scan a statement to update this balance |
| 363 | jsx-text | Re-scan to update → |
| 376 | jsx-text | Estimated |
| 379 | jsx-text | Apply estimate to plan |
| 382 | jsx-text | Updated |
| 385 | prop:label | APR % |
| 386 | prop:label | Due date |
| 387 | prop:label | Recurrence |
| 390 | prop:label | Autopay |

### `apps/rn/src/components/entities/ExpenseSheet.tsx`

| line | origin | string |
|---|---|---|
| 62 | call:setError | Enter the amount you pay now (0 for a free trial). |
| 63 | call:setError | Enter the full price after the trial. |
| 65 | call:setError | Enter when the full price starts (YYYY-MM-DD). |
| 101 | prop:title | Edit expense |
| 101 | prop:title | Add an expense |
| 103 | prop:submitLabel | Save |
| 103 | prop:submitLabel | Add expense |
| 108 | prop:label | Name |
| 108 | prop:placeholder | Rent, phone, utilities |
| 109 | prop:label | Amount now (0 for a free trial) |
| 109 | prop:label | Amount |
| 109 | prop:placeholder | e.g. 0 |
| 109 | prop:placeholder | e.g. 850 |
| 111 | prop:label | Due date |
| 112 | prop:label | Recurrence |
| 113 | prop:label | Category |
| 114 | prop:label | Variable amount (estimate) |
| 115 | prop:label | Free trial or intro price |
| 118 | prop:label | Full price after the trial |
| 118 | prop:placeholder | e.g. 15.99 |
| 119 | prop:label | Full price starts |
| 122 | prop:label | Autopay |

### `apps/rn/src/components/entities/GoalSheet.tsx`

| line | origin | string |
|---|---|---|
| 103 | call:setError | Enter a target amount. |
| 104 | call:setError | Enter what you have saved so far, or leave it blank. |
| 130 | call:setError | Enter how much to put toward this each paycheck. |
| 154 | prop:title | Edit goal |
| 154 | prop:title | Add a goal |
| 155 | prop:subtitle | A savings or emergency-fund target. |
| 156 | prop:submitLabel | Save |
| 156 | prop:submitLabel | Add goal |
| 161 | prop:label | Name |
| 161 | prop:placeholder | Emergency Fund, Vacation |
| 162 | prop:label | Target amount |
| 162 | prop:placeholder | e.g. 1000 |
| 163 | prop:label | Current amount saved |
| 163 | prop:placeholder | e.g. 250 |
| 166 | prop:label | Type |
| 168 | prop:options ⚠️ | Emergency fund |
| 168 | prop:options ⚠️ | Savings |
| 173 | prop:label | Type |
| 175 | prop:options ⚠️ | Savings |
| 178 | prop:note | You already have an emergency fund. This one saves alongside it. |
| 185 | prop:label | Fund this ahead of my debt |
| 188 | prop:label | Cap per paycheck |
| 191 | prop:placeholder | e.g. 100 |

### `apps/rn/src/components/entities/ImportDebtsSheet.tsx`

| line | origin | string |
|---|---|---|
| 36 | var:PLACEHOLDER ⚠️ | name,balance,minimumPayment,apr,dueDate Visa,2400,75,19.99,2026-09-01 |
| 50 | call:setError | Paste your CSV first. |
| 55 | call:setError | No debts found in that file. |
| 89 | prop:title | Import these debts? |
| 90 | prop:subtitle | They’re added to your plan. Nothing else changes. |
| 102 | prop:label | Choose a different file |
| 110 | prop:title | Import debts from CSV |
| 111 | prop:subtitle | One row per debt, with a header. You’ll see what’s in it before anything is added. |
| 112 | prop:submitLabel | Check file |
| 116 | prop:label | Choose a file |
| 129 | jsx-text | Columns: name, balance, minimumPayment, apr, dueDate. Dates must be written as YYYY-MM-DD, for         example 2026-09-01. APR can be left blank for 0%. |

### `apps/rn/src/components/entities/LivingExpenseSheet.tsx`

| line | origin | string |
|---|---|---|
| 53 | prop:title | Edit spending item |
| 53 | prop:title | Add a spending item |
| 54 | prop:subtitle | Everyday spending you reserve each paycheck (groceries, gas, fun). |
| 55 | prop:submitLabel | Save |
| 55 | prop:submitLabel | Add item |
| 60 | prop:label | Name |
| 60 | prop:placeholder | Groceries, gas, fun |
| 62 | prop:label | Amount per paycheck |
| 65 | prop:placeholder | e.g. 300 |
| 69 | prop:label | Count toward your reserve |

### `apps/rn/src/components/entities/LogPaymentSheet.tsx`

| line | origin | string |
|---|---|---|
| 47 | prop:label | Amount paid |
| 55 | prop:note | More than the balance — this will clear it to $0. |
| 57 | prop:label | Log payment |

### `apps/rn/src/components/money/AllocationBarCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 13 | prop:getComponent ⚠️ | ./AllocationBarChart |

### `apps/rn/src/components/money/BillBreakdownSheet.tsx`

| line | origin | string |
|---|---|---|
| 47 | key:biweekly ⚠️ | every 2 weeks |
| 48 | key:'per-paycheck' ⚠️ | every paycheck |
| 62 | prop:title | Where it goes |
| 75 | jsx-expr | set the unread amounts again and your recommendation comes back |
| 83 | jsx-text | Every bill spread evenly across your paychecks — so the lumpy ones are far less likely to land as a surprise. |
| 112 | jsx-expr | amount could not be read |
| 125 | jsx-text | /paycheck |
| 142 | jsx-text | Plus |
| 142 | jsx-text | one-time |
| 142 | jsx-text | — not part of your ongoing reserve. |

### `apps/rn/src/components/money/BnplCalendarSection.tsx`

| line | origin | string |
|---|---|---|
| 83 | call:rowFieldUnread ⚠️ | scheduledPaymentAmount |
| 99 | jsx-text | UPCOMING BNPL INSTALLMENTS |
| 124 | jsx-expr | installments |

### `apps/rn/src/components/more-button.tsx`

| line | origin | string |
|---|---|---|
| 45 | prop:accessibilityLabel | More |

### `apps/rn/src/components/more/BackupSheets.tsx`

| line | origin | string |
|---|---|---|
| 53 | call:notify ⚠️ | Couldn’t save |
| 53 | call:notify ⚠️ | Saving the file failed. You can still copy the text below. |
| 70 | key:label | Save as a file |
| 71 | key:label | Copied ✓ |
| 71 | key:label | Copy to clipboard |
| 77 | prop:subtitle | Save this somewhere safe. You can bring it back any time from Import. |
| 81 | prop:label | Done |
| 92 | prop:label | Copied ✓ |
| 92 | prop:label | Copy to clipboard |
| 102 | prop:accessibilityLabel | Hide the raw backup data |
| 102 | prop:accessibilityLabel | Show the raw backup data |
| 104 | jsx-expr | Hide the raw data |
| 104 | jsx-expr | Show the raw data |
| 143 | call:setError | Paste your backup first. |
| 172 | prop:title | Replace your data? |
| 173 | prop:subtitle | This overwrites everything currently in the app. It can’t be undone. |
| 180 | prop:label | Choose a different backup |
| 189 | prop:subtitle | Paste a backup you saved before. You’ll see what’s in it before anything changes. |
| 190 | prop:submitLabel | Check backup |
| 194 | prop:label | Choose a file |
| 200 | prop:placeholder | Paste your backup here |

### `apps/rn/src/components/more/CloudBackupSheet.tsx`

| line | origin | string |
|---|---|---|
| 51 | prop:title | iCloud backup |
| 52 | prop:subtitle | Keep a copy of your plan in your own iCloud account. It never goes to our servers. |
| 53 | prop:submitLabel | Done |
| 60 | jsx-text | Sign in to iCloud on this device to back up your plan. |
| 65 | jsx-text | Back up to iCloud |
| 68 | prop:accessibilityLabel | Back up to iCloud |
| 81 | jsx-expr | Checking iCloud… |
| 90 | jsx-expr | Not backed up yet |
| 98 | jsx-text | This device hasn’t restored that backup, so it may be from another device or from before you                 reinstalled. Backing up replaces it, and that can’t be undone. |
| 102 | prop:label | Use the iCloud copy |
| 112 | prop:label | Replace it with this device |
| 120 | prop:onPress ⚠️ | Backed up. |
| 127 | prop:label | Back up now |
| 133 | prop:onPress ⚠️ | Backed up. |
| 142 | jsx-text | Restoring replaces everything on this device with the copy in iCloud. This can’t be undone. |
| 151 | prop:onPress ⚠️ | Restored from iCloud. |
| 155 | prop:label | Keep what’s on this device |

### `apps/rn/src/components/more/CoachMarkProbeReadout.tsx`

| line | origin | string |
|---|---|---|
| 33 | jsx-text | Coach-mark probe (4.1.4c) |
| 40 | jsx-expr | EMPTY |

### `apps/rn/src/components/more/LegacyBridgeProbeReadout.tsx`

| line | origin | string |
|---|---|---|
| 33 | call:useState ⚠️ | RUNNING |
| 53 | jsx-text | Legacy bridge probe (5.1b) |

### `apps/rn/src/components/more/LiveActivityQA.tsx`

| line | origin | string |
|---|---|---|
| 24 | key:countdownLabel | in 2 days |
| 26 | key:title | Looks clear this paycheck |
| 27 | key:line ⚠️ | Cushion holds · $420 free to deploy |
| 34 | key:label | Clear · 2 days |
| 36 | key:label | Tight · tomorrow |
| 37 | key:countdownLabel | Tomorrow |
| 37 | key:title | A little tight this paycheck |
| 37 | key:line ⚠️ | Move $200 from savings to hold your line |
| 40 | key:label | At-risk · today |
| 41 | key:countdownLabel | Today |
| 41 | key:title | Very tight this paycheck |
| 41 | key:line ⚠️ | $180 short of your obligations |
| 44 | key:label | Payday day (button) |
| 45 | key:countdownLabel | Today |
| 54 | jsx-text | Live Activity QA |
| 57 | jsx-expr | Start a state, then check the Lock Screen / Dynamic Island. (iOS only.) |
| 58 | jsx-expr | Live Activities are OFF in device Settings, or unsupported here (web / <iOS 16.2). |
| 66 | prop:label | End activity |
| 68 | prop:label | Simulate 'Payday landed' |
| 72 | prop:onPress ⚠️ | Payday landed |
| 72 | prop:onPress ⚠️ | Rolled the cycle — check the Today tab for the Undo card. |

### `apps/rn/src/components/more/ReduceMotionProbeReadout.tsx`

| line | origin | string |
|---|---|---|
| 50 | call:AccessibilityInfo.addEventListener ⚠️ | reduceMotionChanged |
| 59 | jsx-text | Reduce-Motion probe (4.1.7①) |

### `apps/rn/src/components/onboarding/CompletionStep.tsx`

| line | origin | string |
|---|---|---|
| 20 | key:label | Always editable |
| 20 | key:body | update amounts any time. |
| 23 | key:label | Free to use |
| 23 | key:body | your plan, your debt-free date and your payday walkthrough never require a subscription. |
| 48 | prop:label | See your plan → |
| 66 | prop:label | What should the app call you? (optional) |
| 69 | prop:placeholder | Your name |

### `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx`

| line | origin | string |
|---|---|---|
| 85 | call:setError | Enter the amount. |
| 109 | prop:label | Add & Continue |
| 110 | prop:label | Skip, I’ll add later |
| 114 | jsx-text | Add your first debt or expense |
| 116 | jsx-text | See your plan come to life right away. You can add more any time. |
| 131 | prop:options ⚠️ | Debt |
| 132 | prop:options ⚠️ | Expense |
| 151 | jsx-expr | Something with a balance you’re paying down — a card, a loan, a mortgage. It ends. |
| 152 | jsx-expr | An ongoing cost that doesn’t end — rent, phone, a subscription. |
| 157 | prop:label | Debt name |
| 157 | prop:label | Expense name |
| 163 | prop:placeholder | e.g. Visa Card |
| 163 | prop:placeholder | e.g. Rent |
| 194 | prop:label | APR % (optional) |
| 201 | prop:label | Amount |
| 207 | prop:placeholder | e.g. 1200 |

### `apps/rn/src/components/onboarding/PaycheckStep.tsx`

| line | origin | string |
|---|---|---|
| 43 | call:setError | Enter your paycheck amount to continue. |
| 85 | prop:label | Continue |
| 86 | prop:label | Skip for now |
| 90 | jsx-text | When do you get paid? |
| 92 | jsx-text | This sets up your pay cycle so your plan knows which expenses are due next. |

### `apps/rn/src/components/onboarding/WelcomeStep.tsx`

| line | origin | string |
|---|---|---|
| 17 | key:title | A guardian for every payday |
| 17 | key:body | Know what’s safe to spend and what to pay down — your cushion comes first. |
| 18 | key:title | A real debt-free date |
| 18 | key:body | Snowball or avalanche — see exactly when your last debt disappears. |
| 43 | prop:label | Get started |
| 63 | jsx-text | Will you make it to payday? |
| 68 | jsx-text | Debt Planner watches your cushion every paycheck — so you know what’s safe to spend and what to pay down. |

### `apps/rn/src/components/payday/PaydayCaptureSheet.tsx`

| line | origin | string |
|---|---|---|
| 37 | return | a while ago |
| 228 | var:requiredSub ⚠️ | All confirmed paid |
| 257 | jsx-text | ‹ Back |
| 259 | jsx-text | Which expenses got paid? |
| 261 | jsx-text | Tap to mark what you actually paid — anything left carries to next cycle. |
| 265 | jsx-expr | Undo |
| 265 | jsx-expr | Mark all paid |
| 299 | jsx-expr | Autopay · should have run |
| 300 | jsx-expr | Autopay |
| 307 | prop:label | Paid |
| 307 | prop:label | Didn’t pay |
| 313 | jsx-text | carries to next cycle |
| 317 | prop:label | Done |
| 324 | jsx-text | ‹ Back |
| 326 | jsx-text | Check your balances |
| 328 | jsx-text | Confirm each estimate, or type the real balance from your statement. |
| 340 | jsx-text | estimated ~ |
| 340 | jsx-text | · verified |
| 353 | prop:label | Confirm balances |
| 359 | jsx-text | It’s payday |
| 361 | jsx-text | Here’s the plan you set for this paycheck. Confirm what you actually paid. |
| 365 | jsx-text | Close |
| 374 | jsx-text | Required expenses & minimums |
| 379 | prop:label | Adjust |
| 389 | jsx-text | Estimated balances |
| 392 | jsx-expr | 1 balance hasn’t been checked in a while |
| 396 | prop:label | Update |
| 398 | prop:label | These look right |
| 403 | jsx-text | Balances confirmed |
| 408 | jsx-text | EXTRA PAYMENTS |
| 427 | jsx-expr | From savings ✓ |
| 427 | jsx-expr | From savings |
| 447 | prop:label | Skipped |
| 447 | prop:label | Paid |
| 458 | jsx-text | You paid |
| 472 | jsx-text | Anything unexpected come out? |
| 480 | prop:accessibilityLabel | Amount of an unexpected expense this cycle |
| 486 | prop:label | Confirm what you paid |
| 486 | prop:label | You followed the plan |
| 487 | prop:label | Skip this payday |
| 527 | jsx-text | Payday captured |
| 534 | jsx-text | confirmed · your plan’s up to date |

### `apps/rn/src/components/payoff/compareStrategies.ts`

| line | origin | string |
|---|---|---|
| 89 | return | On your debts, these two produce exactly the same plan. |
| 111 | call:parts.push ⚠️ | Same debt-free date |
| 119 | call:parts.push ⚠️ | and the order they clear in changes |
| 130 | return | These two clear your debts in a different order. |

### `apps/rn/src/components/payoff/monthLabels.ts`

| line | origin | string |
|---|---|---|
| 21 | call:monthDate ⚠️ | en-US |
| 26 | call:monthDate ⚠️ | en-US |

### `apps/rn/src/components/payoff/StrategyCompare.tsx`

| line | origin | string |
|---|---|---|
| 50 | jsx-text | Add a debt to see how the two payoff orders compare. |
| 58 | prop:label | Snowball |
| 59 | prop:label | Avalanche |
| 86 | jsx-expr | · yours |
| 89 | jsx-expr | No payoff date |
| 96 | jsx-expr | 1st · |

### `apps/rn/src/components/payoff/TrajectoryCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 17 | prop:getComponent ⚠️ | ./TrajectorySkiaChart |

### `apps/rn/src/components/payoff/TrajectoryChart.tsx`

| line | origin | string |
|---|---|---|
| 62 | call:import ⚠️ | ./TrajectorySkiaChart |
| 308 | var:minimumsDateLabel ⚠️ | Not with minimums |
| 361 | jsx-text | PAYOFF TRAJECTORY |
| 362 | jsx-text | Balance over time |
| 393 | call:groupLabel | Payoff trajectory chart |
| 394 | call:groupLabel | projected balance over time |
| 395 | call:groupLabel | your plan clears faster than minimum payments |
| 523 | jsx-text | Now |
| 536 | jsx-text | Minimum payments |
| 547 | jsx-text | Your plan |
| 564 | jsx-text | Safe-floor |
| 576 | jsx-text | With extra |
| 593 | prop:accessibilityLabel | What if you paid extra? |
| 596 | jsx-text | What if you paid extra? |
| 609 | prop:accessibilityLabel | Compare snowball and avalanche |
| 613 | jsx-text | Snowball or avalanche? |

### `apps/rn/src/components/payoff/WhatIfControls.tsx`

| line | origin | string |
|---|---|---|
| 77 | prop:accessibilityLabel | Extra monthly payment amount |
| 84 | jsx-text | /mo |
| 93 | prop:accessibilityLabel | Extra monthly payment |
| 99 | jsx-text | Drag or type an amount to see how much faster you’d be debt-free. |
| 103 | jsx-text | Can’t estimate a payoff date with the current plan. |

### `apps/rn/src/components/plan/AffordabilityCard.tsx`

| line | origin | string |
|---|---|---|
| 54 | var:effName ⚠️ | Savings goal |
| 71 | var:purchaseName ⚠️ | Purchase |
| 85 | var:purchaseName ⚠️ | Purchase |
| 95 | call:store_.getState ⚠️ | affordability |
| 114 | call:store_.getState ⚠️ | affordability |
| 149 | jsx-text | CAN I AFFORD IT? |
| 162 | prop:label | Undo |
| 173 | jsx-text | CAN I AFFORD IT? |
| 183 | prop:label | Undo |
| 192 | jsx-text | CAN I AFFORD IT? |
| 195 | jsx-text | Thinking about a purchase? |
| 198 | prop:label | Amount |
| 198 | prop:placeholder | e.g. 400 |
| 199 | prop:label | What is it? (optional) |
| 199 | prop:placeholder | e.g. New couch |
| 207 | jsx-text | Enter an amount to see if it fits this paycheck. |
| 210 | jsx-text | You have about |
| 210 | jsx-text | spare this paycheck. |
| 221 | prop:label | Save for it → |
| 234 | jsx-text | About |
| 234 | jsx-text | less goes to debt this paycheck. |
| 254 | prop:label | Apply anyway |
| 254 | prop:label | Apply to this paycheck |

### `apps/rn/src/components/plan/AppStoreCta.web.tsx`

| line | origin | string |
|---|---|---|
| 33 | prop:target ⚠️ | _blank |
| 34 | prop:rel ⚠️ | noopener noreferrer |

### `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 16 | prop:getComponent ⚠️ | ./CashRunwaySkiaChart |

### `apps/rn/src/components/plan/CashRunwayChart.tsx`

| line | origin | string |
|---|---|---|
| 136 | jsx-text | CUSHION BY PAYCHECK |
| 194 | jsx-text | I’m setting aside |
| 194 | jsx-text | from this paycheck for a tight cycle ahead. |
| 202 | jsx-expr | This paycheck |
| 207 | prop:label | Income |
| 208 | prop:label | Expenses & essentials |
| 211 | prop:label | Left after essentials |

### `apps/rn/src/components/plan/CoachMarkLayer.tsx`

| line | origin | string |
|---|---|---|
| 92 | call:probeCoachMark ⚠️ | NULL |
| 92 | call:probeCoachMark ⚠️ | (cancelled) |
| 185 | var:verdict ⚠️ | DREW |
| 190 | call:useEffect ⚠️ | DREW |
| 386 | prop:accessibilityLabel | Got it |
| 389 | jsx-text | Got it |

### `apps/rn/src/components/plan/CushionBarCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 12 | prop:getComponent ⚠️ | ./CushionBarChart |

### `apps/rn/src/components/plan/CushionFloorSheet.tsx`

| line | origin | string |
|---|---|---|
| 47 | prop:title | Your cushion line |
| 48 | prop:subtitle | The cash I keep each paycheck before any extra debt payoff. |
| 49 | prop:submitLabel | Save |
| 71 | prop:accessibilityLabel | Cushion line amount |

### `apps/rn/src/components/plan/DataRepairsCard.tsx`

| line | origin | string |
|---|---|---|
| 84 | prop:label | Got it |

### `apps/rn/src/components/plan/dataRepairsCopy.ts`

| line | origin | string |
|---|---|---|
| 27 | key:goal ⚠️ | savings goal |
| 42 | key:balance ⚠️ | the balance |
| 43 | key:minimumPayment ⚠️ | the minimum payment |
| 44 | key:apr ⚠️ | the interest rate |
| 45 | key:originalBalance ⚠️ | the starting balance |
| 46 | key:scheduledPaymentAmount ⚠️ | the scheduled payment |
| 47 | key:amount ⚠️ | the amount |
| 48 | key:targetAmount ⚠️ | the target |
| 49 | key:currentAmount ⚠️ | the amount saved |
| 50 | key:priorityPerPaycheck ⚠️ | the per-paycheck amount |
| 77 | return | This row could not be read |
| 117 | other ⚠️ | unrecoverable |
| 152 | key:heading | An amount could not be read |
| 154 | key:detail | Your plan is running without it until you set it again. |
| 155 | key:detail | Your plan is running without them until you set each one again. |
| 172 | key:heading | Some of your old data did not come across |
| 174 | key:detail | There is nothing to reopen for it — check this against your old app and add anything missing. |
| 175 | key:detail | There is nothing to reopen for them — check these against your old app and add anything missing. |
| 185 | key:heading | An amount was written in a different format |
| 188 | key:detail | Your plan is using it — check the number looks right. |
| 189 | key:detail | Your plan is using them — check the numbers look right. |

### `apps/rn/src/components/plan/DemoAutoEntry.tsx`

| line | origin | string |
|---|---|---|
| 42 | var:href ⚠️ | /demo?capture=1 |
| 42 | var:href ⚠️ | /demo?mode=scripted |

### `apps/rn/src/components/plan/DemoCaption.tsx`

| line | origin | string |
|---|---|---|
| 59 | prop:accessibilityLabel | Debt-free, one paycheck at a time. Cushion planning and Recovery require Premium. |
| 60 | jsx-text | Debt-free, one paycheck at a time. |
| 63 | jsx-text | Cushion planning and Recovery require Premium. |

### `apps/rn/src/components/plan/DemoDock.tsx`

| line | origin | string |
|---|---|---|
| 80 | jsx-text | This is what your Guardian does with a paycheck. |
| 102 | prop:label | Get it on the App Store |
| 114 | prop:label | Start your real plan |

### `apps/rn/src/components/plan/ExampleCanvasMarker.tsx`

| line | origin | string |
|---|---|---|
| 16 | var:EXAMPLE_MONEY ⚠️ | Example money |
| 105 | prop:label | Back to my plan |
| 105 | prop:label | Start my real plan |

### `apps/rn/src/components/plan/FloorImpactBar.tsx`

| line | origin | string |
|---|---|---|
| 76 | jsx-text | Cushion |

### `apps/rn/src/components/plan/GraduationCards.tsx`

| line | origin | string |
|---|---|---|
| 28 | jsx-text | You’re debt-free |
| 30 | jsx-text | Every balance is cleared. Your paycheck now builds your future instead of paying down the past. |
| 46 | jsx-text | YOUR NEXT CHAPTER |
| 49 | jsx-text | Ready to build wealth? |
| 52 | jsx-text | Financial Freedom picks up where this leaves off — turn the money you were sending to debt into a plan for         your Freedom Date. A convenient next step, not a required one. |
| 55 | prop:label | Explore Financial Freedom → |

### `apps/rn/src/components/plan/GuardianScorecard.tsx`

| line | origin | string |
|---|---|---|
| 33 | jsx-text | GUARDIAN ACCURACY |
| 45 | jsx-text | Reserved since day one |
| 48 | jsx-text | I’ve set your line aside on every paycheck since the first one. I’m still learning your           patterns — I’ll show my track record once I’ve seen a few more paychecks. |
| 59 | var:recalibration ⚠️ | I’ve under-warned a few times — I’ve tightened my read. |
| 61 | var:recalibration ⚠️ | I’ve been over-cautious a few times — I’m recalibrating. |
| 66 | jsx-text | GUARDIAN ACCURACY |
| 68 | jsx-text | reads matched |
| 71 | jsx-text | How often my read of whether you’d hold your cushion matched what you actually confirmed. |
| 78 | prop:label | Under-warned |
| 78 | prop:sub ⚠️ | said you’d hold, you dipped below |
| 79 | prop:label | Over-cautious |
| 79 | prop:sub ⚠️ | flagged a risk that didn’t land |

### `apps/rn/src/components/plan/LeanSuggestionCard.tsx`

| line | origin | string |
|---|---|---|
| 31 | call:groupLabel | Income floor |
| 31 | call:groupLabel | Raise your income floor |
| 31 | call:groupLabel | Adjust your income floor |
| 34 | jsx-text | INCOME FLOOR |
| 40 | prop:label | Not now |

### `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 12 | prop:getComponent ⚠️ | ./MeshGradientChart |

### `apps/rn/src/components/plan/MilestoneAckCard.tsx`

| line | origin | string |
|---|---|---|
| 20 | key:title | A quarter paid off |
| 20 | key:body | You’ve paid off 25% of your debt. Keep the momentum going. |
| 21 | key:title | Halfway to debt-free |
| 21 | key:body | 50% paid off — you’re over the hump. |
| 22 | key:title | Three-quarters done |
| 22 | key:body | 75% paid off. The finish line is in sight. |
| 45 | prop:label | Keep going |

### `apps/rn/src/components/plan/PaidOffBeat.tsx`

| line | origin | string |
|---|---|---|
| 99 | var:beatA11y ⚠️ | — paid off |
| 132 | jsx-text | Freed |
| 132 | jsx-text | /mo now flows to |
| 138 | prop:label | Share |
| 139 | prop:label | Keep going |

### `apps/rn/src/components/plan/PaidOffFinale.tsx`

| line | origin | string |
|---|---|---|
| 108 | prop:accessibilityLabel | $0 balance |
| 117 | jsx-text | You&rsquo;re debt-free |
| 120 | prop:label | paid off |
| 129 | prop:label | Continue |

### `apps/rn/src/components/plan/PaycheckSheet.tsx`

| line | origin | string |
|---|---|---|
| 52 | call:setError | Enter your paycheck amount. |
| 87 | prop:title | Paycheck & pay cycle |
| 88 | prop:subtitle | Your income and when it lands — the foundation of every plan. |
| 89 | prop:submitLabel | Save paycheck |
| 159 | prop:label | This paycheck didn’t arrive |

### `apps/rn/src/components/plan/PaydayGuardianCard.tsx`

| line | origin | string |
|---|---|---|
| 166 | var:attestLabel ⚠️ | Expenses confirmed — holding a smaller safety net. Undo |
| 167 | var:attestLabel ⚠️ | All your regular expenses entered? I’ll hold a smaller safety net. |
| 173 | var:freeInvite ⚠️ | Premium builds you a catch-up plan — what to cover first, and what (if anything) can safely wait. |
| 176 | var:freeInvite ⚠️ | Premium works out how much to keep back each payday to protect your cushion, all on your device — no deciding each paycheck. |
| 189 | call:groupLabel | Example |
| 190 | call:groupLabel | Payday Guardian |
| 209 | call:groupLabel | To savings |
| 209 | call:groupLabel | To debt |
| 217 | jsx-text | PAYDAY GUARDIAN |
| 234 | jsx-text | Example |
| 239 | jsx-text | Update needed |
| 285 | prop:label | To savings |
| 285 | prop:label | To debt |
| 296 | jsx-text | · Your line |
| 323 | jsx-text | Your call |
| 386 | prop:label | Undo the move |
| 406 | prop:accessibilityHint | Undoes the confirmation and restores the full safety net |
| 407 | prop:accessibilityHint | Tells me your expenses are all entered, so I hold less back |
| 435 | prop:accessibilityLabel | Adjust your line |
| 436 | prop:accessibilityHint | Opens a sheet to set the cushion you keep back each payday |
| 438 | jsx-text | Adjust your line → |
| 450 | prop:accessibilityLabel | How this works |
| 451 | prop:accessibilityHint | Replays the walkthrough of how your Guardian decides, from the beginning |
| 453 | jsx-text | How this works |
| 474 | prop:accessibilityLabel | See your forecast |
| 475 | prop:accessibilityHint | Opens your full cushion forecast |
| 478 | jsx-text | See your forecast → |

### `apps/rn/src/components/plan/PayoffInvitationCard.tsx`

| line | origin | string |
|---|---|---|
| 37 | jsx-text | Looks like you paid off |
| 40 | jsx-text | Your estimate reached $0. Confirm it’s paid off and it’s official. |
| 42 | prop:label | Confirm — it’s paid off |
| 44 | jsx-text | Not yet — update the balance |

### `apps/rn/src/components/plan/PlanHero.tsx`

| line | origin | string |
|---|---|---|
| 132 | var:statusLabel ⚠️ | Overdue payments need attention |
| 134 | var:statusLabel ⚠️ | Short this paycheck |
| 135 | var:statusLabel ⚠️ | On track |
| 158 | prop:accessibilityLabel | Edit paycheck |
| 161 | jsx-text | THIS PAYCHECK · |
| 189 | jsx-text | Suggested · |
| 248 | prop:accessibilityLabel | Add extra income |
| 252 | jsx-expr | Add extra income |

### `apps/rn/src/components/plan/RecommendedActionsCard.tsx`

| line | origin | string |
|---|---|---|
| 25 | var:verb ⚠️ | Mark Paid |
| 25 | var:verb ⚠️ | Mark Saved |
| 46 | jsx-text | Recommended |
| 48 | jsx-text | Best next move for this paycheck. |
| 55 | prop:meta | Suggested this paycheck |
| 67 | prop:meta | Completed with outside money |
| 67 | prop:meta | Completed this paycheck |
| 70 | prop:label | Undo |

### `apps/rn/src/components/plan/RecoveryPlanSection.tsx`

| line | origin | string |
|---|---|---|
| 65 | jsx-text | COVER NOW |
| 97 | jsx-expr | Show fewer |
| 114 | jsx-text | CAN WAIT IN YOUR PLAN |
| 116 | jsx-text | Moving these buys room in your plan — the biller still needs handling. |
| 139 | jsx-text | Keep essential |
| 171 | jsx-text | This reschedules the payment in your plan — remember to handle it with the biller (pay it late, or cancel it). |

### `apps/rn/src/components/plan/RequiredActionsCard.tsx`

| line | origin | string |
|---|---|---|
| 29 | other ⚠️ | unfundedRequiredItems |
| 128 | jsx-text | Required actions |
| 130 | jsx-text | Bills and minimums due this paycheck. |
| 153 | jsx-expr | An amount this paycheck has to cover could not be read, so this list is incomplete — set it again above and it comes back. |
| 154 | jsx-expr | One more amount could not be read, so this list is short of at least one thing — set it again above and it comes back. |
| 157 | jsx-text | You’re caught up for this paycheck. |
| 161 | jsx-text | You haven’t added any bills yet. |
| 164 | jsx-text | Rent, utilities, subscriptions — anything that comes out every cycle. Until they are here,                 this plan treats all of it as spendable. |
| 167 | prop:label | Add a bill |
| 192 | jsx-expr | Not covered by this paycheck — your recovery plan below works through these. |
| 193 | jsx-expr | Short this paycheck — cover these from savings or your next paycheck. |
| 240 | prop:accessibilityLabel | from this paycheck |
| 260 | jsx-expr | from this paycheck |
| 300 | prop:accessibilityLabel | Undo, mark unpaid |
| 300 | prop:accessibilityLabel | Mark paid |
| 303 | jsx-expr | Undo |
| 303 | jsx-expr | Paid |
| 342 | prop:label | Auto-paid |
| 344 | prop:label | Autopay |
| 365 | jsx-text | Due |
| 371 | jsx-text | this cycle |
| 380 | jsx-text | from your reserve |

### `apps/rn/src/components/plan/SaveForItSheet.tsx`

| line | origin | string |
|---|---|---|
| 65 | var:goalLabel ⚠️ | this purchase |
| 118 | prop:title | Save for it |
| 120 | prop:submitLabel | Start saving |
| 135 | jsx-text | /paycheck |
| 140 | jsx-expr | Saved after debt · no firm date |
| 157 | jsx-text | Set your own |
| 164 | prop:label | Per paycheck |
| 164 | prop:placeholder | e.g. 100 |
| 167 | jsx-text | · ready by |
| 172 | jsx-text | Save what you want each paycheck — funds before debt at your pace. |

### `apps/rn/src/components/plan/ShareCard.tsx`

| line | origin | string |
|---|---|---|
| 42 | jsx-text | I&rsquo;m debt-free |
| 44 | prop:label | paid off |
| 58 | jsx-text | /mo freed toward the next one |
| 65 | jsx-text | paid off |
| 68 | jsx-text | paid off |
| 70 | jsx-text | on my way to debt-free |
| 77 | jsx-text | Debt Planner &middot; your payday debt-payoff app |

### `apps/rn/src/components/plan/SpokenForSheet.tsx`

| line | origin | string |
|---|---|---|
| 60 | jsx-text | of this paycheck is already accounted for |
| 68 | prop:hint | Groceries, gas, fun money — reserved every paycheck. |
| 72 | prop:actionLabel | Manage everyday spending |
| 75 | prop:label | Upcoming expenses |
| 76 | prop:hint | Money you’ve set by for expenses that land in a later cycle. |
| 100 | jsx-text | Set by |
| 103 | jsx-text | Optional — your plan works either way. |
| 111 | prop:accessibilityLabel | Undo this paycheck’s expense reserve |
| 113 | jsx-text | Undo this paycheck’s reserve |

### `apps/rn/src/components/plan/TutorialInviteCard.tsx`

| line | origin | string |
|---|---|---|
| 27 | call:groupLabel | See how your Guardian works |
| 28 | call:groupLabel | A short walkthrough on example numbers, not your real plan. |
| 35 | jsx-text | See how your Guardian works |
| 39 | jsx-text | A short walkthrough on example numbers — your plan isn’t touched. |
| 43 | prop:label | Show me |
| 44 | prop:label | Not now |

### `apps/rn/src/components/plan/TutorialOverlay.tsx`

| line | origin | string |
|---|---|---|
| 452 | prop:label | Finish |
| 452 | prop:label | Next |
| 453 | prop:label | Back |
| 460 | jsx-text | Skip |

### `apps/rn/src/components/plan/WindfallSheet.tsx`

| line | origin | string |
|---|---|---|
| 23 | key:label | Covers your expenses & essentials first |
| 24 | key:label | Extra to your debt |
| 26 | key:label | Toward your goals |
| 27 | key:label | Held as your safety net |
| 28 | key:label | Left as spare cash |
| 80 | prop:title | Extra income |
| 81 | prop:subtitle | A bonus, refund, or side gig — added to this paycheck only. |
| 82 | prop:submitLabel | Confirm |
| 82 | prop:submitLabel | Add |
| 87 | prop:label | Amount |
| 93 | prop:placeholder | e.g. 500 |
| 102 | jsx-text | HERE’S HOW THE APP WILL ROUTE |
| 113 | jsx-text | Confirm to route it this way — your whole plan updates. Your call. |

### `apps/rn/src/components/progress/CashFlowSection.tsx`

| line | origin | string |
|---|---|---|
| 21 | other ⚠️ | cushionStatus |
| 70 | jsx-text | CASH FLOW · NEXT |
| 70 | jsx-text | PAY CYCLES |
| 76 | prop:options ⚠️ | Cushion |
| 77 | prop:options ⚠️ | Timeline |
| 99 | var:caption ⚠️ | A cycle runs short ahead — plan for it. |
| 101 | var:caption ⚠️ | Cushion gets tight in an upcoming cycle. |
| 102 | var:caption ⚠️ | Comfortable across the next few paychecks. |
| 122 | jsx-text | line · room after each paycheck |

### `apps/rn/src/components/progress/JourneyRingCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 12 | prop:getComponent ⚠️ | ./JourneyRingChart |

### `apps/rn/src/components/progress/PaidOffArchive.tsx`

| line | origin | string |
|---|---|---|
| 48 | call:shareDebtCard ⚠️ | Share your progress |
| 57 | jsx-text | DEBTS PAID OFF · |
| 83 | prop:label | Share |

### `apps/rn/src/components/progress/TimelineLedger.tsx`

| line | origin | string |
|---|---|---|
| 70 | var:title ⚠️ | This cycle |
| 70 | var:title ⚠️ | Projected |
| 70 | var:title ⚠️ | Cycle |
| 119 | jsx-text | from savings |

### `apps/rn/src/components/SaveFailedBanner.tsx`

| line | origin | string |
|---|---|---|
| 27 | var:SAVE_FAILED_SPOKEN ⚠️ | Couldn’t save your last change to this device. It’s still here — we’ll keep trying. |
| 54 | jsx-text | Couldn&rsquo;t save your last change to this device. It&rsquo;s still here — we&rsquo;ll keep         trying. |

### `apps/rn/src/components/screen.tsx`

| line | origin | string |
|---|---|---|
| 67 | prop:accessibilityLabel | Back |

### `apps/rn/src/components/StorageErrorScreen.tsx`

| line | origin | string |
|---|---|---|
| 40 | jsx-text | Couldn&rsquo;t open your data |
| 43 | jsx-text | Your plan is still on this device — the app just couldn&rsquo;t read it this time. This is           usually temporary. Try again, and if it keeps happening, restart your phone. |
| 46 | prop:label | Try again |

### `apps/rn/src/components/ui/AnimatedSheet.tsx`

| line | origin | string |
|---|---|---|
| 82 | prop:accessibilityLabel | Close |

### `apps/rn/src/components/ui/DateField.tsx`

| line | origin | string |
|---|---|---|
| 93 | jsx-expr | Select a date |

### `apps/rn/src/components/ui/FormSheet.tsx`

| line | origin | string |
|---|---|---|
| 116 | jsx-text | Delete |
| 165 | prop:accessibilityLabel | Close |
| 182 | jsx-text | Delete |

### `apps/rn/src/components/ui/ListRow.tsx`

| line | origin | string |
|---|---|---|
| 95 | prop:accessibilityHint | Opens the editor |
| 162 | key:systemIcon ⚠️ | dollarsign.circle |
| 164 | key:title | Edit |
| 165 | key:title | Delete |
| 260 | jsx-text | Delete |

### `apps/rn/src/components/ui/RowContextMenu.ios.tsx`

| line | origin | string |
|---|---|---|
| 17 | key:type ⚠️ | IMAGE_SYSTEM |

### `apps/rn/src/components/ui/Select.tsx`

| line | origin | string |
|---|---|---|
| 53 | jsx-expr | Select |

### `apps/rn/src/data/backup.ts`

| line | origin | string |
|---|---|---|
| 53 | var:BACKUP_APP_NAME ⚠️ | Debt Planner |
| 130 | var:NOT_JSON ⚠️ | That file isn’t readable as a backup. |
| 131 | var:NOT_A_BACKUP ⚠️ | That isn’t a Debt Planner backup. |
| 132 | var:TOO_NEW ⚠️ | That backup was made by a newer version of Debt Planner. Update the app, then try again. |
| 133 | var:MALFORMED ⚠️ | That backup is incomplete and can’t be restored. |

### `apps/rn/src/data/backupFile.ts`

| line | origin | string |
|---|---|---|
| 26 | var:JSON_TYPES ⚠️ | application/json |
| 26 | var:JSON_TYPES ⚠️ | public.json |
| 53 | key:mimeType ⚠️ | application/json |
| 53 | key:dialogTitle ⚠️ | Save your backup |

### `apps/rn/src/data/cloudBackup.ts`

| line | origin | string |
|---|---|---|
| 90 | var:NOT_A_CLOUD_BACKUP ⚠️ | That iCloud file isn’t a Debt Planner backup. |
| 91 | var:NO_CODEC ⚠️ | That backup was made by a newer version of Debt Planner. Update the app, then try again. |
| 96 | var:DAMAGED ⚠️ | That iCloud backup is damaged and can’t be read. |

### `apps/rn/src/data/cloudBackupMessages.ts`

| line | origin | string |
|---|---|---|
| 33 | var:GENERIC_FAILURE ⚠️ | That didn’t work. Your data on this device is unchanged. |
| 34 | var:NO_BACKUP_YET ⚠️ | There is no backup in iCloud yet. |
| 35 | var:SIGN_IN_TO_ICLOUD ⚠️ | Sign in to iCloud on this device to use backup. |
| 36 | var:REMOTE_UNCLAIMED ⚠️ | iCloud already has a backup that this device hasn’t seen. Choose which copy to keep. |

### `apps/rn/src/data/csvImportFile.ts`

| line | origin | string |
|---|---|---|
| 28 | var:CSV_TYPES ⚠️ | text/csv |
| 28 | var:CSV_TYPES ⚠️ | text/comma-separated-values |
| 28 | var:CSV_TYPES ⚠️ | public.comma-separated-values-text |
| 28 | var:CSV_TYPES ⚠️ | text/plain |

### `apps/rn/src/data/detectBackupFormat.ts`

| line | origin | string |
|---|---|---|
| 26 | other ⚠️ | unrecognised |
| 48 | other ⚠️ | storeVersion |
| 65 | key:detail | not a JSON object |
| 68 | key:detail | a Debt Planner backup file |
| 71 | key:detail | a backup from an older version of Debt Planner |
| 74 | key:detail | an unwrapped Debt Planner backup |
| 76 | key:detail | no recognised backup format |
| 84 | key:detail | not readable as JSON |

### `apps/rn/src/data/formatBackupTime.ts`

| line | origin | string |
|---|---|---|
| 17 | key:minute ⚠️ | 2-digit |

### `apps/rn/src/data/legacyBridge/decodeCandidates.ts`

| line | origin | string |
|---|---|---|
| 36 | other ⚠️ | droppedRowsOtherCandidates |

### `apps/rn/src/data/legacyBridge/mapLegacyStore.ts`

| line | origin | string |
|---|---|---|
| 74 | key:requiredExpenses ⚠️ | requiredExpenses |
| 75 | key:livingExpenses ⚠️ | livingExpenses |
| 77 | key:cycleHistory ⚠️ | cycleHistory |
| 78 | key:completedRecommendedActions ⚠️ | completedRecommendedActions |
| 79 | key:payoffStrategy ⚠️ | payoffStrategy |
| 80 | key:milestoneMaxProgress ⚠️ | milestoneMaxProgress |
| 81 | key:lastHandledPaydayDate ⚠️ | lastHandledPaydayDate |
| 90 | key:nextPaycheckDate ⚠️ | nextPaycheckDate |
| 91 | key:semiMonthlyFirstDay ⚠️ | semiMonthlyFirstDay |
| 92 | key:semiMonthlySecondDay ⚠️ | semiMonthlySecondDay |
| 93 | key:monthlyPayDay ⚠️ | monthlyPayDay |
| 98 | key:hasCompletedOnboarding ⚠️ | onboardingComplete |
| 99 | key:notificationsEnabled ⚠️ | notificationsEnabled |
| 100 | key:appLockEnabled ⚠️ | appLockEnabled |
| 109 | key:isDemoMode ⚠️ | inert — nothing reads it (5.6 drops the field entirely) |
| 110 | key:mockSubscription ⚠️ | a v1.6 QA hook; real entitlement comes from RevenueCat |
| 111 | key:schemaVersion ⚠️ | consumed — it decides the originalBalance backfill, it is not stored |
| 115 | key:resetSnapshot ⚠️ | v1.6 reset-undo buffer; v1.7 has no surface that could restore it |
| 116 | key:rolloverCount ⚠️ | a v1.6 review-prompt counter; v1.7 tracks review prompting separately |
| 117 | key:reviewRequested ⚠️ | superseded by `reviewPrompted` on the RN store, set by v1.7 on its own terms |
| 125 | key:hasConfiguredPaycheck ⚠️ | written only by v1.6’s SIM_SMOKE seeder, never by the shipping app |
| 158 | call:key.startsWith ⚠️ | rnStore. |
| 162 | call:key.startsWith ⚠️ | __corrupt__ |
| 170 | other ⚠️ | schemaVersion |
| 186 | key:why ⚠️ | no theme preference stored (null) — defaults apply |

### `apps/rn/src/data/legacyBridge/migrateFromLegacy.ts`

| line | origin | string |
|---|---|---|
| 113 | call:import ⚠️ | ./readLegacyStores |
| 125 | call:skipped ⚠️ | no container to read (web) |
| 133 | call:skipped ⚠️ | no v1.6 store in this container (a fresh install) |
| 139 | call:skipped ⚠️ | the search was cut short — treating as UNKNOWN, not as "no legacy data" |
| 142 | call:skipped ⚠️ | the search did not establish that there is nothing here — treating as UNKNOWN |
| 182 | call:skipped ⚠️ | the v1.6 data could not be MIGRATED — deliberately not reported as "no legacy data" |

### `apps/rn/src/data/legacyBridge/readLegacyStores.ts`

| line | origin | string |
|---|---|---|
| 59 | key:error ⚠️ | source vanished |
| 74 | other ⚠️ | -wal |
| 74 | other ⚠️ | -shm |
| 85 | call:db.getAllAsync ⚠️ | SELECT key, value FROM ItemTable |
| 157 | key:path ⚠️ | (walk) |

### `apps/rn/src/data/legacyBridge/report.ts`

| line | origin | string |
|---|---|---|
| 64 | return | legacy-read: unsupported |

### `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts`

| line | origin | string |
|---|---|---|
| 29 | var:LEGACY_KEY_PREFIX ⚠️ | debtPlanner. |
| 184 | call:name.endsWith ⚠️ | .localstorage |
| 184 | other ⚠️ | localstorage.sqlite3 |

### `apps/rn/src/data/migrationAudit/corpus.ts`

| line | origin | string |
|---|---|---|
| 21 | var:V16_DIRECT_KEYS ⚠️ | requiredExpenses |
| 22 | var:V16_DIRECT_KEYS ⚠️ | livingExpenses |
| 24 | var:V16_DIRECT_KEYS ⚠️ | cycleHistory |
| 25 | var:V16_DIRECT_KEYS ⚠️ | completedRecommendedActions |
| 26 | var:V16_DIRECT_KEYS ⚠️ | payoffStrategy |
| 27 | var:V16_DIRECT_KEYS ⚠️ | milestoneMaxProgress |
| 28 | var:V16_DIRECT_KEYS ⚠️ | lastHandledPaydayDate |
| 36 | var:V16_PAYCHECK_KEYS ⚠️ | nextPaycheckDate |
| 37 | var:V16_PAYCHECK_KEYS ⚠️ | semiMonthlyFirstDay |
| 38 | var:V16_PAYCHECK_KEYS ⚠️ | semiMonthlySecondDay |
| 39 | var:V16_PAYCHECK_KEYS ⚠️ | monthlyPayDay |
| 46 | key:exportedAt ⚠️ | 2026-05-23T14:02:11.000Z |
| 84 | key:lastSavedAt ⚠️ | 2026-05-23T14:00:00.000Z |
| 123 | key:unicode ⚠️ | 🧾💸 � ünïcødé |
| 126 | key:utcMidnightDate ⚠️ | 2026-03-01T00:00:00.000Z |
| 188 | var:nested ⚠️ | minimumPayment |
| 192 | var:nested ⚠️ | requiredExpenses |
| 193 | var:nested ⚠️ | requiredExpenses |
| 197 | var:nested ⚠️ | targetAmount |
| 198 | var:nested ⚠️ | currentAmount |
| 212 | key:target ⚠️ | goals[1].priorityPerPaycheck |

### `apps/rn/src/data/migrationAudit/doors.ts`

| line | origin | string |
|---|---|---|
| 35 | key:webkitRoot ⚠️ | /x/Library/WebKit |
| 38 | key:candidates ⚠️ | /x/db.sqlite3 |
| 39 | key:path ⚠️ | /x/db.sqlite3 |
| 40 | key:path ⚠️ | /x/db.sqlite3 |

### `apps/rn/src/data/migrationAudit/invariants.ts`

| line | origin | string |
|---|---|---|
| 76 | var:MONEY_FIELDS ⚠️ | minimumPayment |
| 100 | var:GOAL_MONEY_FIELDS ⚠️ | targetAmount |
| 100 | var:GOAL_MONEY_FIELDS ⚠️ | currentAmount |
| 100 | var:GOAL_MONEY_FIELDS ⚠️ | priorityPerPaycheck |
| 118 | call:check ⚠️ | requiredExpenses |
| 119 | call:check ⚠️ | livingExpenses |

### `apps/rn/src/data/migrations.ts`

| line | origin | string |
|---|---|---|
| 129 | key:field ⚠️ | (whole list unreadable) |
| 155 | key:field ⚠️ | (a row could not be read) |
| 224 | key:required ⚠️ | minimumPayment |
| 224 | key:optional ⚠️ | originalBalance |
| 224 | key:optional ⚠️ | scheduledPaymentAmount |
| 227 | key:required ⚠️ | targetAmount |
| 227 | key:required ⚠️ | currentAmount |
| 227 | key:optional ⚠️ | priorityPerPaycheck |
| 232 | other ⚠️ | runMigrations: persisted store is not an object |
| 268 | call:repairMoneyFields ⚠️ | requiredExpense |
| 269 | call:repairMoneyFields ⚠️ | livingExpense |
| 365 | call:repairs.find ⚠️ | priorityPerPaycheck |
| 393 | key:field ⚠️ | the per-paycheck amount could not be read, so it is no longer funded ahead of your debt |
| 394 | key:field ⚠️ | the per-paycheck amount could not be read |
| 400 | other ⚠️ | the per-paycheck amount could not be read, so it is no longer funded ahead of your debt |
| 401 | other ⚠️ | the per-paycheck amount could not be read |

### `apps/rn/src/data/models.ts`

| line | origin | string |
|---|---|---|
| 262 | other ⚠️ | requiredExpense |
| 262 | other ⚠️ | livingExpense |
| 306 | other ⚠️ | affordability |

### `apps/rn/src/data/readBackup.ts`

| line | origin | string |
|---|---|---|
| 25 | other ⚠️ | unrecognised |
| 59 | var:NOT_JSON ⚠️ | That file isn’t readable as a backup. |
| 60 | var:UNRECOGNISED ⚠️ | That isn’t a Debt Planner backup. |
| 61 | var:UNREADABLE ⚠️ | That backup couldn’t be read. |
| 126 | key:envelope ⚠️ | This backup |
| 127 | key:'raw-v17' ⚠️ | This backup |
| 128 | key:'v16-file' ⚠️ | This backup, from an older version of Debt Planner, |
| 129 | key:unrecognised ⚠️ | This backup |

### `apps/rn/src/hooks/use-cloud-backup.ts`

| line | origin | string |
|---|---|---|
| 113 | call:reportError ⚠️ | cloud backup attempted on a SANDBOX store — refusing |
| 144 | call:reportError ⚠️ | cloud restore attempted on a SANDBOX store — refusing |

### `apps/rn/src/hooks/use-sheet-presentation.ts`

| line | origin | string |
|---|---|---|
| 61 | call:Keyboard.addListener ⚠️ | keyboardDidShow |
| 62 | call:Keyboard.addListener ⚠️ | keyboardDidHide |

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
| 21 | call:anonymous ⚠️ | Northwind Bank · Everyday Card |
| 22 | call:anonymous ⚠️ | Account ending 0000 |
| 23 | call:anonymous ⚠️ | New Balance $2,431.09 |
| 24 | call:anonymous ⚠️ | Minimum Payment Due $56.00 |
| 25 | call:anonymous ⚠️ | Payment Due Date August 22, 2026 |
| 26 | call:anonymous ⚠️ | Purchase APR 24.99% |

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
| 85 | var:line ⚠️ | Cushion holds |

### `apps/rn/src/motion/haptics.ts`

| line | origin | string |
|---|---|---|
| 21 | call:requireNativeModule ⚠️ | FinaleHaptics |

### `apps/rn/src/notifications/notificationCopy.ts`

| line | origin | string |
|---|---|---|
| 30 | key:title | Before this paycheck lands |
| 31 | key:body | I’d give your plan a quick look before payday. |

### `apps/rn/src/notifications/notifications.ts`

| line | origin | string |
|---|---|---|
| 39 | key:buttonTitle ⚠️ | Run your plan |
| 40 | key:buttonTitle ⚠️ | Review your plan |
| 41 | key:buttonTitle ⚠️ | Check your plan |
| 130 | call:schedule ⚠️ | Paycheck tomorrow |
| 130 | call:schedule ⚠️ | Your paycheck arrives tomorrow — open Debt Planner to run your plan. |
| 137 | call:schedule ⚠️ | It’s payday |
| 137 | call:schedule ⚠️ | Open Debt Planner to confirm your plan for this paycheck. |
| 153 | var:title ⚠️ | Upcoming expense |

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

### `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts`

| line | origin | string |
|---|---|---|
| 25 | var:BACKUP_PATH ⚠️ | /debt-planner-cloud-backup.json |

### `apps/rn/src/storage/createAdapter.ts`

| line | origin | string |
|---|---|---|
| 20 | var:QUARANTINE_PREFIX ⚠️ | quarantine. |

### `apps/rn/src/storage/createAdapter.web.ts`

| line | origin | string |
|---|---|---|
| 8 | var:KEY ⚠️ | debtPlanner.rnStore |
| 9 | var:QUARANTINE_PREFIX ⚠️ | debtPlanner.rnStore.__quarantine__ |

### `apps/rn/src/store/balanceSelectors.ts`

| line | origin | string |
|---|---|---|
| 90 | key:text | estimated · verify soon |

### `apps/rn/src/store/celebrationSelectors.ts`

| line | origin | string |
|---|---|---|
| 53 | call:rowFieldUnread ⚠️ | originalBalance |
| 140 | call:rowFieldUnread ⚠️ | originalBalance |
| 140 | call:rowFieldUnread ⚠️ | minimumPayment |

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
| 15 | other ⚠️ | /onboarding |
| 15 | other ⚠️ | /paywall |
| 57 | call:router.replace ⚠️ | /onboarding |
| 58 | other ⚠️ | /paywall |
| 58 | call:router.push ⚠️ | /paywall |

### `apps/rn/src/store/demoRun.ts`

| line | origin | string |
|---|---|---|
| 25 | other ⚠️ | /money |
| 25 | other ⚠️ | /progress |
| 92 | key:screen ⚠️ | /money |
| 92 | key:beat | The situation: three debts, a number you recognise. |
| 93 | key:beat | The mechanism: a paycheck lands and the cushion is held at your line, before payoff. |
| 94 | key:beat | The proof: a tight paycheck, and the safety net covers it. |
| 95 | key:screen ⚠️ | /progress |
| 95 | key:beat | The payoff: the ring, the curve, the debt-free date. |
| 101 | key:beat | The triumph: a debt one tap from zero. The capture driver confirms it, and the celebration is real. |

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
| 144 | var:targetName ⚠️ | your savings |
| 144 | var:targetName ⚠️ | your debt |
| 357 | key:provider ⚠️ | BNPL |
| 393 | var:AFFORD_PREVIEW_ID ⚠️ | __afford_preview__ |
| 445 | var:coverFromSavings ⚠️ | coverFromSavings |
| 613 | key:title | Save fast |
| 613 | key:detail | Funds before debt — pauses most of your extra debt payoff while you save. |
| 619 | key:title | Balanced |
| 619 | key:detail | A lighter set-aside — eases off your debt payoff a little, takes longer. |
| 624 | key:title | Keep debt first |
| 624 | key:detail | Save whatever’s spare after debt — no hit to your debt-free date, but no firm date. |

### `apps/rn/src/store/journeySelectors.ts`

| line | origin | string |
|---|---|---|
| 55 | other ⚠️ | originalBalance |

### `apps/rn/src/store/looksLikeDebt.ts`

| line | origin | string |
|---|---|---|
| 66 | var:AMBIGUOUS_NAMES ⚠️ | rent / mortgage |

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
| 99 | key:nameRequired ⚠️ | Enter a name. |
| 100 | key:amountPositive ⚠️ | Enter an amount greater than 0. |
| 101 | key:balanceRequired ⚠️ | Enter the current balance. |
| 102 | key:minimumRequired ⚠️ | Enter the minimum payment. |
| 106 | key:aprInvalid ⚠️ | Enter the APR as a number, or leave it blank. |

### `apps/rn/src/store/onboardingFinish.ts`

| line | origin | string |
|---|---|---|
| 23 | key:body | That’s your target — stay the course. Tap below to see exactly what to do with your next paycheck. |
| 29 | key:body | Here’s what it has to cover, and what’s left after. Add a debt any time and you’ll get a debt-free date too. |
| 33 | key:title | Your plan is ready |
| 34 | key:body | Add your paycheck and what you owe, and this becomes a plan for every payday. |

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
| 40 | key:label | Income varies |
| 41 | key:label | The amount you can count on |
| 41 | key:placeholder ⚠️ | e.g. 1200 |
| 42 | key:label | First payday |
| 43 | key:label | Second payday |
| 44 | key:label | Payday (day of month) |
| 55 | var:PAYCHECK_LEAN_HELP ⚠️ | Your plan runs on this floor, so a lighter-than-usual paycheck won’t throw it off. |
| 59 | key:cycle ⚠️ | Pay cycle |
| 60 | key:next ⚠️ | Next paycheck |
| 68 | key:leanRequired ⚠️ | Enter the amount you can count on. |
| 69 | key:leanAboveTypical ⚠️ | Your lean paycheck should be no more than a typical one. |
| 70 | key:paydayRequired ⚠️ | Enter which day of the month you get paid. |
| 71 | key:paydayRange ⚠️ | Use a day between 1 and 31. |
| 72 | key:paydaySame ⚠️ | Your two paydays must be different days. |

### `apps/rn/src/store/payday.ts`

| line | origin | string |
|---|---|---|
| 165 | key:portfolioMaxProgress ⚠️ | __portfolio__ |
| 209 | other ⚠️ | expenseReserve |

### `apps/rn/src/store/paywallLead.ts`

| line | origin | string |
|---|---|---|
| 69 | key:offer ⚠️ | Recovery Plan is the guided catch-up for a cycle like this one. |
| 79 | key:offer ⚠️ | Premium plots it across your next six paydays, and marks where it dips below your line. |

### `apps/rn/src/store/persistence.ts`

| line | origin | string |
|---|---|---|
| 33 | other ⚠️ | @/data/legacyBridge/report |
| 39 | call:reportError ⚠️ | bootstrapPersistence called with a SANDBOX store — refusing |
| 173 | other ⚠️ | @/data/legacyBridge/report |
| 189 | call:String ⚠️ | n/a |
| 190 | call:String ⚠️ | n/a |
| 191 | call:String ⚠️ | n/a |
| 192 | call:String ⚠️ | n/a |

### `apps/rn/src/store/planSelectors.ts`

| line | origin | string |
|---|---|---|
| 307 | key:title | Due this week |
| 308 | key:title | Due next week |
| 309 | key:title | Later this cycle |
| 310 | key:title | Handled |
| 386 | key:label | to debt this paycheck |
| 391 | key:label | cushion this paycheck |
| 422 | var:cushionStatus ⚠️ | cushionStatus |

### `apps/rn/src/store/realWriteGuard.ts`

| line | origin | string |
|---|---|---|
| 32 | var:TUTORIAL_WRITABLE_PREFS ⚠️ | tutorialStep |
| 32 | var:TUTORIAL_WRITABLE_PREFS ⚠️ | tutorialSeen |
| 140 | call:reportError ⚠️ | Real-store write REFUSED while a sandbox subtree was mounted |
| 141 | key:seam ⚠️ | realWriteGuard |
| 142 | key:hint | a component inside the subtree is writing via appStore instead of useActiveStore(); the write was dropped |

### `apps/rn/src/store/sandboxScenarios.ts`

| line | origin | string |
|---|---|---|
| 75 | key:clear ⚠️ | A clear payday |
| 76 | key:tight ⚠️ | A tight payday |
| 78 | key:'at-risk' ⚠️ | A very tight payday |

### `apps/rn/src/store/sandboxStore.ts`

| line | origin | string |
|---|---|---|
| 227 | call:console.warn ⚠️ | Replay and the tutorial e2e depend on it being deterministic; check for a clock or random read. |

### `apps/rn/src/store/store.ts`

| line | origin | string |
|---|---|---|
| 344 | other ⚠️ | intentRollback |

### `apps/rn/src/store/StoreContext.tsx`

| line | origin | string |
|---|---|---|
| 93 | call:reportError ⚠️ | Real store mutated while a sandbox subtree was mounted |
| 94 | key:seam ⚠️ | StoreProvider |
| 95 | key:hint | a write bypassed the appStore action veto (api.setState?) while a sandbox was mounted |

### `apps/rn/src/store/trustSelectors.ts`

| line | origin | string |
|---|---|---|
| 85 | key:debt ⚠️ | originalBalance |
| 97 | key:debt ⚠️ | minimumPayment |
| 296 | var:list ⚠️ | requiredExpense |
| 298 | var:list ⚠️ | livingExpense |

### `apps/rn/src/store/tutorialPath.ts`

| line | origin | string |
|---|---|---|
| 108 | key:title | Money set aside first |
| 108 | key:body | Every payday I keep a cushion back for you, before anything extra goes to your debt. |
| 113 | key:title | Where this paycheck went |
| 113 | key:body | After your expenses and minimums, this is what was left — held back as your cushion and safety net, or sent to your debt. |
| 119 | key:title | Your line |
| 120 | key:body | This is the least you want to keep. Open it and move the line — the whole plan re-solves around it. |
| 123 | key:coach ⚠️ | Drag the line, then Save — your plan re-solves around it. |
| 130 | key:title | A little extra, at first |
| 139 | key:body | While I am still learning your expenses I hold a bit more back. Tell me your expenses are all in and I hold less — and if a surprise proves otherwise, I put the net straight back. |
| 149 | key:title | When it won’t stretch |
| 149 | key:body | Some paychecks come up short. Your Guardian works out what has to be covered now, and what can safely wait. |
| 155 | key:title | Always your call |
| 155 | key:body | I suggest — I never move your money. Every number here stays yours to overrule, once this tour is done. |
| 160 | key:title | Over to your plan |
| 161 | key:body | That was example money. This is your own paycheck, and I am already watching it. |
| 169 | key:premium ⚠️ | That was example money — I do exactly this with every paycheck you add, all on your device. Your debts live in Money, your progress in Progress. |
| 192 | key:free ⚠️ | That was example money — premium is what did the holding: it decided how much to keep back for your cushion, a little extra held while it learns your expenses, and a catch-up plan when a paycheck comes up short. Your own plan is next — your debts live in Money, your progress in Progress. |

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
| 61 | key:'receipt-long' ⚠️ | doc.plaintext |
| 65 | key:'upload-file' ⚠️ | square.and.arrow.down |
| 66 | key:history ⚠️ | clock.arrow.circlepath |
| 73 | key:'gpp-good' ⚠️ | checkmark.shield.fill |
| 74 | key:'gpp-bad' ⚠️ | xmark.shield.fill |
| 75 | key:'gpp-maybe' ⚠️ | exclamationmark.shield.fill |
| 76 | key:shield ⚠️ | shield.fill |
| 77 | key:'verified-user' ⚠️ | checkmark.seal.fill |
| 78 | key:lock ⚠️ | lock.fill |
| 79 | key:'error-outline' ⚠️ | exclamationmark.triangle |
| 80 | key:healing ⚠️ | bandage.fill |
| 83 | key:star ⚠️ | star.fill |
| 84 | key:celebration ⚠️ | party.popper.fill |

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
| 56 | alert | Not now |
| 62 | var:message ⚠️ | Discard changes? |
| 67 | alert | Discard changes? |
| 68 | alert | Keep editing |
| 69 | alert | Discard |

### `apps/rn/src/utils/debtFreeSound.ts`

| line | origin | string |
|---|---|---|
| 12 | call:require ⚠️ | ../../assets/sounds/debt-free-chime.wav |

### `apps/rn/src/utils/ecosystem.ts`

| line | origin | string |
|---|---|---|
| 5 | var:FREEDOM_SCHEME_URL ⚠️ | ffp:// |
| 9 | var:FREEDOM_STORE_URL ⚠️ | https://apps.apple.com/us/app/freedom-date-fire-planner/id6789297671 |
| 22 | var:APP_STORE_URL ⚠️ | https://apps.apple.com/us/app/paycheck-debt-planner/id6773201250 |

### `apps/rn/src/utils/format.ts`

| line | origin | string |
|---|---|---|
| 16 | call:Intl.NumberFormat ⚠️ | en-US |
| 16 | key:currency ⚠️ | USD |

### `apps/rn/src/utils/reportError.ts`

| line | origin | string |
|---|---|---|
| 18 | call:console.warn ⚠️ | [reportError] |

### `apps/rn/src/utils/scrubBreadcrumb.ts`

| line | origin | string |
|---|---|---|
| 24 | var:REDACTED ⚠️ | $[redacted] |

### `apps/rn/src/utils/share-card.ts`

| line | origin | string |
|---|---|---|
| 12 | other ⚠️ | Share your debt-free win |
| 15 | key:mimeType ⚠️ | image/png |

### `apps/rn/src/widget/snapshot.ts`

| line | origin | string |
|---|---|---|
| 59 | return | This paycheck looks clear — your cushion holds. |
| 81 | var:debtFreeDate ⚠️ | Debt-free |

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

### `packages/core/copy/vocabulary.ts`

| line | origin | string |
|---|---|---|
| 52 | key:required ⚠️ | Required |
| 54 | key:spokenFor ⚠️ | Spoken for |
| 56 | key:flexible ⚠️ | Flexible |
| 64 | var:CUSHION_LABEL ⚠️ | Cushion |
| 71 | var:SAFETY_NET_LABEL ⚠️ | Safety net |
| 79 | var:EMERGENCY_FUND_NOUN ⚠️ | your emergency fund |
| 87 | var:EVERYDAY_SPENDING_LABEL ⚠️ | Everyday spending |
| 115 | key:headline | Private by design |
| 117 | key:body | your financial data stays on this device |
| 119 | key:noSelling ⚠️ | you’ll never be sold more debt |
| 121 | key:short ⚠️ | Your money stays on your device. |
| 139 | key:atEntry ⚠️ | No account needed — your numbers never go to our servers. |
| 152 | var:REPLACE_DATA_ACTION ⚠️ | Replace my data |
| 155 | key:clear ⚠️ | Clear |
| 156 | key:tight ⚠️ | Tight |
| 157 | key:"at-risk" ⚠️ | Very tight |
| 172 | var:UNLOCK_PREMIUM_CTA ⚠️ | Unlock Premium |
| 183 | var:LOG_PAYMENT_ENTRY ⚠️ | Log a payment |
| 188 | var:PAYOFF_SCHEDULE_TITLE ⚠️ | Payoff schedule |
| 193 | var:OVERDUE_LABEL ⚠️ | Overdue |
| 198 | var:PRIVACY_POLICY_LABEL ⚠️ | Privacy Policy |
| 202 | var:SEE_IT_IN_ACTION_CTA ⚠️ | See it in action |
| 212 | var:PAY_CYCLE_HISTORY_TITLE ⚠️ | Pay cycle history |
| 213 | var:EXPORT_BACKUP_TITLE ⚠️ | Export backup |
| 214 | var:IMPORT_BACKUP_TITLE ⚠️ | Import backup |
| 227 | var:FILE_UNREADABLE ⚠️ | That file couldn’t be opened. |
| 235 | var:RESTORE_FROM_CLOUD_ACTION ⚠️ | Restore from iCloud |
| 253 | key:balanceLabel ⚠️ | Current balance |
| 254 | key:balancePlaceholder ⚠️ | e.g. 2400 |
| 255 | key:minimumLabel ⚠️ | Minimum payment |
| 256 | key:minimumPlaceholder ⚠️ | e.g. 65 |
| 257 | key:aprPlaceholder ⚠️ | e.g. 22.99 |
| 265 | var:PAID_OFF_LABEL ⚠️ | Paid off |
| 266 | var:SHARE_WIN_CTA ⚠️ | Share your win |
| 271 | var:GOALS_DESTINATION ⚠️ | to your goals |

### `packages/core/debt/bnplProviders.ts`

| line | origin | string |
|---|---|---|
| 20 | key:label | Klarna |
| 21 | key:label | Affirm |
| 22 | key:label | Afterpay |
| 23 | key:label | PayPal Pay in 4 |
| 24 | key:label | Zip |
| 25 | key:label | Sezzle |

### `packages/core/debt/bnplSchedule.ts`

| line | origin | string |
|---|---|---|
| 42 | var:provider ⚠️ | BNPL |
| 65 | key:provider ⚠️ | BNPL |

### `packages/core/debt/computeCycleDelta.ts`

| line | origin | string |
|---|---|---|
| 15 | other ⚠️ | totalDebtBalance |

### `packages/core/debt/mergeCompletedAction.ts`

| line | origin | string |
|---|---|---|
| 20 | other ⚠️ | paymentSource |

### `packages/core/debt/originalBalanceHighWater.ts`

| line | origin | string |
|---|---|---|
| 40 | other ⚠️ | originalBalance |

### `packages/core/debt/projectDebtPayoff.ts`

| line | origin | string |
|---|---|---|
| 26 | var:DEBT_FREE_DATE_UNPAYABLE ⚠️ | Unable to estimate |
| 57 | call:date.toLocaleString ⚠️ | en-US |

### `packages/core/engine/allocatePaycheck.ts`

| line | origin | string |
|---|---|---|
| 529 | key:label | Keep cash buffer |
| 549 | key:label | Reserved for upcoming bills |
| 595 | key:label | Held for an upcoming tight cycle |
| 602 | key:label | Safety net |
| 734 | key:label | Leftover cash |

### `packages/core/forecast/projectForecast.ts`

| line | origin | string |
|---|---|---|
| 65 | key:recoveryTrend ⚠️ | Recovery is not currently projected within the visible forecast window. |
| 66 | key:recoveryTrend ⚠️ | Cash pressure is projected to gradually improve across upcoming cycles. |
| 67 | key:recoveryTrend ⚠️ | Projected cushion remains within a healthier range. |
| 82 | var:lowCushionDrivers ⚠️ | Projected cushion remains below target |
| 83 | var:lowCushionDrivers ⚠️ | Available cushion stays under the recommended safety threshold |
| 84 | var:lowCushionDrivers ⚠️ | Cash reserve remains tighter than recommended |
| 95 | call:drivers.push ⚠️ | Debt minimum obligations remain elevated |
| 103 | return | Pause aggressive payoff and protect required payments first. |
| 114 | return | Current payoff pace appears sustainable. |
| 122 | call:Intl.NumberFormat ⚠️ | en-US |
| 124 | key:currency ⚠️ | USD |

### `packages/core/guardian/buildGuardianBrief.ts`

| line | origin | string |
|---|---|---|
| 158 | return | These figures are from a little while ago — a quick refresh keeps this exact. |
| 160 | return | I’m planning from the low side while I learn what your paychecks reliably clear. |
| 161 | return | I’m holding a small safety net while I get to know your expenses. |
| 225 | var:look ⚠️ | a little tight |
| 237 | key:title | A paycheck didn’t land |
| 257 | key:title | Let’s refresh your numbers |
| 259 | key:detail | Your paycheck, expenses, or balances are more than a few weeks old, so I can’t tell you if you’ll make it this paycheck with confidence. |
| 260 | key:safeMove | Update your numbers and I’ll plan from where you actually are. |
| 275 | var:dest ⚠️ | toward your savings |
| 277 | var:dest ⚠️ | toward debt |
| 289 | key:title | This paycheck won’t cover everything |
| 291 | key:detail | expenses and minimums |
| 292 | key:detail | — this one needs a plan. |
| 308 | key:title | Looks clear this paycheck |
| 308 | key:title | A little tight this paycheck |
| 308 | key:title | Tight this paycheck |
| 309 | key:detail | — a bit tight this one, so keep an eye on the essentials. |
| 323 | key:title | Very tight this paycheck |
| 323 | key:title | A little tight this paycheck |
| 328 | key:detail | at-risk |
| 328 | key:detail | a little under |
| 342 | key:title | Your line’s held |
| 367 | var:target ⚠️ | your savings |
| 371 | key:title | Looks clear this paycheck |
| 377 | key:safeMove | to debt |
| 387 | key:title | Looks clear this paycheck |
| 389 | key:safeMove | your goals |
| 401 | var:safeMove ⚠️ | your debts |
| 408 | key:title | Looks clear this paycheck |

### `packages/core/guardian/calibrationScore.ts`

| line | origin | string |
|---|---|---|
| 115 | var:dominantError ⚠️ | dominantError |

### `packages/core/imports/debtCsv.ts`

| line | origin | string |
|---|---|---|
| 154 | key:errors ⚠️ | CSV must include a header row and at least one debt row. |

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
| 144 | call:Intl.NumberFormat ⚠️ | en-US |
| 146 | key:currency ⚠️ | USD |

### `packages/core/obligations/classifyDeferability.ts`

| line | origin | string |
|---|---|---|
| 15 | var:DEFERRABLE_CATEGORIES ⚠️ | subscriptions |
| 15 | var:DEFERRABLE_CATEGORIES ⚠️ | discretionary |

### `packages/core/payCycle/getNextPaycheckDate.ts`

| line | origin | string |
|---|---|---|
| 48 | call:validateDayOfTheMonth ⚠️ | First semi-monthly pay day |
| 49 | call:validateDayOfTheMonth ⚠️ | Second semi-monthly pay day |
| 52 | other ⚠️ | Semi-monthly pay days must be different. |
| 69 | call:validateDayOfTheMonth ⚠️ | Monthly pay day |
| 81 | other ⚠️ | Unsupported pay cycle |

### `packages/core/scan/parseStatementText.ts`

| line | origin | string |
|---|---|---|
| 30 | var:ISSUERS | American Express |
| 30 | var:ISSUERS | Amex |
| 30 | var:ISSUERS | Capital One |
| 30 | var:ISSUERS | Bank of America |
| 30 | var:ISSUERS | Wells Fargo |
| 30 | var:ISSUERS | Apple Card |
| 31 | var:ISSUERS | Chase |
| 31 | var:ISSUERS | Citi |
| 31 | var:ISSUERS | Citibank |
| 31 | var:ISSUERS | Discover |
| 31 | var:ISSUERS | Barclays |
| 31 | var:ISSUERS | Synchrony |
| 31 | var:ISSUERS | U.S. Bank |
| 31 | var:ISSUERS | US Bank |
| 32 | var:ISSUERS | PNC |
| 32 | var:ISSUERS | TD Bank |
| 32 | var:ISSUERS | USAA |
| 32 | var:ISSUERS | Navy Federal |
| 91 | var:AMT ⚠️ | [^\n\d]{0,30}\$?\s*([\d,]+\.\d{2}) |

### `packages/core/storage/debtPlannerStorage.ts`

| line | origin | string |
|---|---|---|
| 7 | other ⚠️ | subscriptions |
| 11 | other ⚠️ | discretionary |
| 238 | var:CYCLE_HISTORY_STORAGE_KEY ⚠️ | debtPlanner.cycleHistory |

### `packages/core/timeline/buildTimelineItems.ts`

| line | origin | string |
|---|---|---|
| 47 | key:label | Paycheck Received |
| 56 | key:label | Living Reserve |

### `packages/core/types/recurrence.ts`

| line | origin | string |
|---|---|---|
| 27 | key:"monthly" ⚠️ | /mo |
| 28 | key:"weekly" ⚠️ | /wk |
| 29 | key:"biweekly" ⚠️ | /2 wks |
| 30 | key:"per-paycheck" ⚠️ | /paycheck |
| 31 | key:"quarterly" ⚠️ | /qtr |
| 32 | key:"annually" ⚠️ | /yr |

### `packages/core/utils/formatCurrency.ts`

| line | origin | string |
|---|---|---|
| 54 | call:Intl.NumberFormat ⚠️ | en-US |
| 56 | key:currency ⚠️ | USD |

### `packages/core/utils/formatDisplayAmount.ts`

| line | origin | string |
|---|---|---|
| 3 | call:Math.floor ⚠️ | en-US |
