# User-facing strings — inventory

> ⛔ **GENERATED. Do not edit.** Regenerate with `npm run audit:strings`.
> This is the **input** to the wording/voice gate, not its output. Findings belong in a dated
> audit folder; this file is only ever the current state of the codebase.

**823** copy · **368** unclassified · **68** excluded as machinery · **61** copy strings appearing in more than one file (of 85 repeated strings overall).

<details><summary>Excluded as machinery — the contexts, so the exclusions can be challenged</summary>

- `key:category`
- `key:fontFamily`
- `key:id`
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
- `call:Math.max`
- `call:announce`
- `call:anonymous`
- `call:console.warn`
- `call:d.toLocaleString`
- `call:date.toLocaleString`
- `call:db.getAllAsync`
- `call:drivers.push`
- `call:fullAmount.toLocaleString`
- `call:monthDate`
- `call:name.endsWith`
- `call:notify`
- `call:probeCoachMark`
- `call:reportError`
- `call:require`
- `call:requireNativeModule`
- `call:requireNativeViewManager`
- `call:router.navigate`
- `call:router.push`
- `call:router.replace`
- `call:schedule`
- `call:shareDebtCard`
- `call:useEffect`
- `call:useState`
- `call:useStore`
- `call:useSuppressCoachMarks`
- `call:validateDayOfTheMonth`
- `call:value.toLocaleString`
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
- `key:clear`
- `key:coach`
- `key:currency`
- `key:cycle`
- `key:debts`
- `key:discretionary`
- `key:display`
- `key:error`
- `key:errors`
- `key:estimatedDebtFreeDate`
- `key:evening`
- `key:examples`
- `key:fallbackLabel`
- `key:flexible`
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
- `key:noSelling`
- `key:offer`
- `key:other`
- `key:path`
- `key:paydayRange`
- `key:paydayRequired`
- `key:paydaySame`
- `key:placeholder`
- `key:portfolioMaxProgress`
- `key:premium`
- `key:projectedDebtFreeDate`
- `key:promptMessage`
- `key:provider`
- `key:recoveryTrend`
- `key:required`
- `key:savings`
- `key:screen`
- `key:seam`
- `key:search`
- `key:sf`
- `key:shield`
- `key:short`
- `key:spokenFor`
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
- `prop:onCta`
- `prop:onManageEveryday`
- `prop:onPress`
- `prop:options`
- `prop:rel`
- `prop:sub`
- `prop:target`
- `var:AFFORD_PREVIEW_ID`
- `var:AMT`
- `var:APP_STORE_URL`
- `var:BILL_CATEGORY_ORDER`
- `var:CUSHION_LABEL`
- `var:CYCLE_HISTORY_STORAGE_KEY`
- `var:DEBT_RC_IOS_KEY`
- `var:DEFERRABLE_CATEGORIES`
- `var:EMERGENCY_FUND_NOUN`
- `var:EVERYDAY_SPENDING_LABEL`
- `var:EXAMPLE_MONEY`
- `var:FREEDOM_SCHEME_URL`
- `var:FREEDOM_STORE_URL`
- `var:KEY`
- `var:LEGACY_KEY_PREFIX`
- `var:LIFETIME_SUBNOTE`
- `var:LIVE_ACTIVITY_APP_GROUP`
- `var:MANAGE_SUBSCRIPTION_URL`
- `var:PAYCHECK_LEAN_HELP`
- `var:PAYDAY_ACTIVITY_DEEPLINK`
- `var:PRIVACY_POLICY_URL`
- `var:QUARANTINE_PREFIX`
- `var:SAFETY_NET_LABEL`
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
- `var:href`
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

**61** of 85 cross-file duplicate strings carry copy.
The other 24 are style tokens, icon names,
routes and enum ids — repeated by design, and nothing a wording pass judges. They are excluded
here for the same reason the T2 gate and the T3 table exclude them: one classification, reused.

⚠️ A `copy+unclassified` tag means the SAME text is both a user-facing string somewhere and a
non-copy literal elsewhere (`"at-risk"` is a Guardian state id and a QA label). Judge the copy
instance; the others are coincidence, not divergence.

- **"Add"** _(copy)_ — `apps/rn/src/app/(tabs)/money.tsx:307` · `apps/rn/src/app/(tabs)/money.tsx:374` · `apps/rn/src/app/(tabs)/money.tsx:637` · `apps/rn/src/app/(tabs)/money.tsx:750` · `apps/rn/src/app/(tabs)/money.tsx:900` · `apps/rn/src/app/(tabs)/money.tsx:940` · `apps/rn/src/components/plan/WindfallSheet.tsx:81`
- **"Undo"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:562` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:242` · `apps/rn/src/components/plan/AffordabilityCard.tsx:125` · `apps/rn/src/components/plan/AffordabilityCard.tsx:146` · `apps/rn/src/components/plan/RecommendedActionsCard.tsx:70` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:234`
- **"Autopay"** _(copy)_ — `apps/rn/src/app/(tabs)/money.tsx:461` · `apps/rn/src/app/(tabs)/money.tsx:734` · `apps/rn/src/components/entities/DebtSheet.tsx:352` · `apps/rn/src/components/entities/ExpenseSheet.tsx:107` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:275` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:275`
- **"Paid off"** _(copy)_ — `apps/rn/src/components/plan/PaidOffBeat.tsx:116` · `apps/rn/src/components/plan/PaidOffBeat.tsx:126` · `apps/rn/src/components/plan/ShareCard.tsx:50` · `apps/rn/src/components/plan/ShareCard.tsx:51` · `apps/rn/src/components/progress/PaidOffArchive.tsx:60` · `apps/rn/src/components/progress/PaidOffArchive.tsx:65`
- **"Got it"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:511` · `apps/rn/src/app/(tabs)/index.tsx:529` · `apps/rn/src/app/(tabs)/index.tsx:546` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:164` · `apps/rn/src/components/plan/CoachMarkLayer.tsx:167`
- **"/mo"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:471` · `apps/rn/src/app/(tabs)/money.tsx:471` · `apps/rn/src/components/entities/AmortizationView.tsx:79` · `apps/rn/src/components/payoff/WhatIfControls.tsx:83` · `packages/core/types/recurrence.ts:27`
- **"Save"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:250` · `apps/rn/src/components/entities/ExpenseSheet.tsx:88` · `apps/rn/src/components/entities/GoalSheet.tsx:60` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:49` · `apps/rn/src/components/plan/CushionFloorSheet.tsx:48`
- **"Looks clear this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:26` · `packages/core/guardian/buildGuardianBrief.ts:279` · `packages/core/guardian/buildGuardianBrief.ts:342` · `packages/core/guardian/buildGuardianBrief.ts:356` · `packages/core/guardian/buildGuardianBrief.ts:377`
- **"Today"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:82` · `apps/rn/src/components/more/LiveActivityQA.tsx:41` · `apps/rn/src/components/more/LiveActivityQA.tsx:45` · `apps/rn/src/liveActivity/paydayActivityContent.ts:53`
- **"Progress"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:87` · `apps/rn/src/app/(tabs)/progress.tsx:95` · `apps/rn/src/app/(tabs)/progress.tsx:110` · `apps/rn/src/app/(tabs)/progress.tsx:158`
- **"Add a debt"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:438` · `apps/rn/src/app/(tabs)/progress.tsx:115` · `apps/rn/src/components/entities/DebtSheet.tsx:240` · `apps/rn/src/components/entities/DebtSheet.tsx:240`
- **"Not now"** _(copy)_ — `apps/rn/src/app/(tabs)/index.tsx:585` · `apps/rn/src/components/plan/LeanSuggestionCard.tsx:40` · `apps/rn/src/components/plan/TutorialInviteCard.tsx:44` · `apps/rn/src/utils/confirm.ts:46`
- **"BNPL"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:461` · `apps/rn/src/store/guardianSelectors.ts:328` · `packages/core/debt/bnplSchedule.ts:42` · `packages/core/debt/bnplSchedule.ts:65`
- **"Monthly"** _(copy+unclassified)_ — `apps/rn/src/app/paywall.tsx:75` · `apps/rn/src/app/paywall.tsx:92` · `apps/rn/src/store/obligationForm.ts:24` · `apps/rn/src/store/paycheckForm.ts:34`
- **"Payoff schedule"** _(copy+unclassified)_ — `apps/rn/src/app/schedule/[id].tsx:25` · `apps/rn/src/app/schedule/[id].tsx:31` · `apps/rn/src/components/entities/AmortizationView.tsx:137` · `apps/rn/src/components/ui/ListRow.tsx:152`
- **"Name"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:297` · `apps/rn/src/components/entities/ExpenseSheet.tsx:93` · `apps/rn/src/components/entities/GoalSheet.tsx:65` · `apps/rn/src/components/entities/LivingExpenseSheet.tsx:54`
- **"Amount"** _(copy)_ — `apps/rn/src/components/entities/ExpenseSheet.tsx:94` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:180` · `apps/rn/src/components/plan/AffordabilityCard.tsx:161` · `apps/rn/src/components/plan/WindfallSheet.tsx:86`
- **"/paycheck"** _(copy+unclassified)_ — `apps/rn/src/components/money/BillBreakdownSheet.tsx:84` · `apps/rn/src/components/money/BillBreakdownSheet.tsx:102` · `apps/rn/src/components/plan/SaveForItSheet.tsx:123` · `packages/core/types/recurrence.ts:30`
- **"paid off"** _(copy)_ — `apps/rn/src/components/plan/PaidOffFinale.tsx:119` · `apps/rn/src/components/plan/ShareCard.tsx:40` · `apps/rn/src/components/plan/ShareCard.tsx:61` · `apps/rn/src/components/plan/ShareCard.tsx:64`
- **"Emergency fund"** _(copy+technical+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:929` · `apps/rn/src/components/entities/GoalSheet.tsx:71` · `apps/rn/src/store/sandboxScenarios.ts:161`
- **"Premium"** _(copy)_ — `apps/rn/src/app/more.tsx:130` · `apps/rn/src/app/more.tsx:146` · `apps/rn/src/app/paywall.tsx:231`
- **"Other"** _(copy+technical+unclassified)_ — `apps/rn/src/components/entities/DebtSheet.tsx:60` · `apps/rn/src/components/entities/DebtSheet.tsx:60` · `apps/rn/src/store/obligationForm.ts:61`
- **"A little tight this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:37` · `packages/core/guardian/buildGuardianBrief.ts:279` · `packages/core/guardian/buildGuardianBrief.ts:294`
- **"Paid"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:282` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:419` · `apps/rn/src/components/plan/RequiredActionsCard.tsx:234`
- **"Close"** _(copy)_ — `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:340` · `apps/rn/src/components/ui/AnimatedSheet.tsx:82` · `apps/rn/src/components/ui/FormSheet.tsx:157`
- **"Cushion"** _(copy+unclassified)_ — `apps/rn/src/components/plan/FloorImpactBar.tsx:76` · `apps/rn/src/components/progress/CashFlowSection.tsx:65` · `packages/core/copy/vocabulary.ts:60`
- **"Delete"** _(copy)_ — `apps/rn/src/components/ui/ListRow.tsx:144` · `apps/rn/src/components/ui/ListRow.tsx:154` · `apps/rn/src/utils/confirm.ts:18`
- **"Money"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/_layout.tsx:92` · `apps/rn/src/app/(tabs)/money.tsx:103`
- **"Savings"** _(copy+unclassified)_ — `apps/rn/src/app/(tabs)/money.tsx:929` · `apps/rn/src/components/entities/GoalSheet.tsx:71`
- **"More"** _(copy)_ — `apps/rn/src/app/more.tsx:115` · `apps/rn/src/components/more-button.tsx:45`
- **"Unlock Premium"** _(copy)_ — `apps/rn/src/app/more.tsx:155` · `apps/rn/src/components/plan/DemoDock.tsx:120`
- **"Export backup"** _(copy)_ — `apps/rn/src/app/more.tsx:203` · `apps/rn/src/components/more/BackupSheets.tsx:35`
- **"Import backup"** _(copy)_ — `apps/rn/src/app/more.tsx:204` · `apps/rn/src/components/more/BackupSheets.tsx:77`
- **"Your name"** _(copy)_ — `apps/rn/src/app/more.tsx:226` · `apps/rn/src/components/onboarding/CompletionStep.tsx:65`
- **"About"** _(copy)_ — `apps/rn/src/app/more.tsx:306` · `apps/rn/src/components/plan/AffordabilityCard.tsx:199`
- **"Privacy Policy"** _(copy)_ — `apps/rn/src/app/more.tsx:308` · `apps/rn/src/app/paywall.tsx:367`
- **"Cancel"** _(copy)_ — `apps/rn/src/app/more.tsx:389` · `apps/rn/src/utils/confirm.ts:17`
- **"See it in action"** _(copy)_ — `apps/rn/src/app/paywall.tsx:351` · `apps/rn/src/components/onboarding/WelcomeStep.tsx:42`
- **"Log a payment"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:277` · `apps/rn/src/components/entities/LogPaymentSheet.tsx:34`
- **"Type"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:299` · `apps/rn/src/components/entities/GoalSheet.tsx:69`
- **"e.g. 100"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:309` · `apps/rn/src/components/plan/SaveForItSheet.tsx:149`
- **"Current balance"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:321` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:149`
- **"e.g. 2400"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:321` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:155`
- **"Minimum payment"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:346` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:162`
- **"e.g. 22.99"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:347` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:173`
- **"Due date"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:348` · `apps/rn/src/components/entities/ExpenseSheet.tsx:96`
- **"Recurrence"** _(copy)_ — `apps/rn/src/components/entities/DebtSheet.tsx:349` · `apps/rn/src/components/entities/ExpenseSheet.tsx:97`
- **"Log payment"** _(copy)_ — `apps/rn/src/components/entities/LogPaymentSheet.tsx:46` · `apps/rn/src/components/ui/ListRow.tsx:151`
- **"Done"** _(copy)_ — `apps/rn/src/components/more/BackupSheets.tsx:37` · `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:292`
- **"Tomorrow"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:37` · `apps/rn/src/liveActivity/paydayActivityContent.ts:54`
- **"Very tight this paycheck"** _(copy)_ — `apps/rn/src/components/more/LiveActivityQA.tsx:41` · `packages/core/guardian/buildGuardianBrief.ts:294`
- **"e.g. 1200"** _(copy+unclassified)_ — `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:186` · `apps/rn/src/store/paycheckForm.ts:41`
- **"Continue"** _(copy)_ — `apps/rn/src/components/onboarding/PaycheckStep.tsx:78` · `apps/rn/src/components/plan/PaidOffFinale.tsx:128`
- **"Keep going"** _(copy)_ — `apps/rn/src/components/plan/MilestoneAckCard.tsx:45` · `apps/rn/src/components/plan/PaidOffBeat.tsx:138`
- **"Share your win"** _(copy+unclassified)_ — `apps/rn/src/components/plan/PaidOffBeat.tsx:89` · `apps/rn/src/components/plan/PaidOffFinale.tsx:127`
- **"Share"** _(copy)_ — `apps/rn/src/components/plan/PaidOffBeat.tsx:137` · `apps/rn/src/components/progress/PaidOffArchive.tsx:73`
- **"Overdue"** _(copy)_ — `apps/rn/src/components/plan/RequiredActionsCard.tsx:295` · `apps/rn/src/store/planSelectors.ts:271`
- **"Back"** _(copy)_ — `apps/rn/src/components/plan/TutorialOverlay.tsx:453` · `apps/rn/src/components/screen.tsx:67`
- **"Weekly"** _(copy+unclassified)_ — `apps/rn/src/store/obligationForm.ts:25` · `apps/rn/src/store/paycheckForm.ts:31`
- **"to your goals"** _(copy)_ — `apps/rn/src/store/planSelectors.ts:341` · `packages/core/guardian/buildGuardianBrief.ts:346`
- **"Safety net"** _(copy+unclassified)_ — `packages/core/copy/vocabulary.ts:67` · `packages/core/engine/allocatePaycheck.ts:593`

## Copy gated on a condition — is the gate the thing the copy claims?

The audit gate's proxy-gate sweep, as a list. For each row ask one question: **does the
condition actually establish what the words assert, or does it merely correlate with it?**

The live instance this was built from read exactly like a row here —
`prefill` → `"Add from scan"` / `"Add a debt"` — where `prefill` had stopped meaning "scanned"
the moment a second producer was added. Two audit passes and three green web specs missed it.

| file | condition | when true | when false |
|---|---|---|---|
| `apps/rn/src/app/(tabs)/index.tsx:556` | `intentRollback.kind === 'log-payment'` | "Payment logged — I updated your balance." | "Payday landed — I rolled your plan forward to this paycheck." |
| `apps/rn/src/app/(tabs)/money.tsx:344` | `strategy === 'snowball'` | "Smallest balance first — quick wins. Your debts are listed in payoff order." | "Highest APR first — least interest. Your debts are listed in payoff order." |
| `apps/rn/src/app/(tabs)/money.tsx:471` | `isBnpl` | "/mo" | "/mo" |
| `apps/rn/src/app/(tabs)/money.tsx:732` | `item.expenseType === 'variable'` | "· Variable" | — |
| `apps/rn/src/app/(tabs)/money.tsx:860` | `empty` | "Everyday spending reserve, nothing set up yet. Opens management." | — |
| `apps/rn/src/app/(tabs)/money.tsx:870` | `empty` | "Not set up" | — |
| `apps/rn/src/app/(tabs)/money.tsx:876` | `empty` | "Groceries, gas, fun money — reserve it each paycheck" | "Reserved each paycheck · tap to manage" |
| `apps/rn/src/app/(tabs)/money.tsx:878` | `shortHeld` | — | "Reserved each paycheck · tap to manage" |
| `apps/rn/src/app/(tabs)/money.tsx:929` | `g.type === 'emergency'` | "Emergency fund" | "Savings" |
| `apps/rn/src/app/(tabs)/money.tsx:930` | `funded` | "Funded" | — |
| `apps/rn/src/app/(tabs)/progress.tsx:150` | `reached.length` | — | "no milestones reached yet" |
| `apps/rn/src/app/(tabs)/progress.tsx:151` | `nextT` | — | "all milestones reached" |
| `apps/rn/src/app/(tabs)/progress.tsx:151` | `nextT === 100` | "debt-free" | — |
| `apps/rn/src/app/living-expenses.tsx:65` | `item.enabled` | "Counts toward reserve" | "Not counted" |
| `apps/rn/src/app/more.tsx:192` | `tipsReset` | "Tips will appear again as you go." | "Re-offer the one-line hints on hidden features." |
| `apps/rn/src/app/paywall.tsx:277` | `kind === 'lifetime'` | "You’re on Premium — Lifetime. Thanks for the support." | "You’re on Premium — thanks for the support." |
| `apps/rn/src/app/paywall.tsx:356` | `restoring` | "Restoring…" | "Restore purchases" |
| `apps/rn/src/components/AppLockGate.tsx:37` | `authing` | "Unlocking…" | "Unlock" |
| `apps/rn/src/components/entities/AmortizationView.tsx:80` | `amort.monthlyExtra > 0` | "— minimum + your extra" | "— the minimum" |
| `apps/rn/src/components/entities/DebtSheet.tsx:240` | `isEdit` | "Edit debt" | "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:240` | `convertingExpenseId` | "Add a debt" | "Add from scan" · "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:240` | `prefill` | "Add from scan" | "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:242` | `isEdit` | — | "Moving this from Expenses. Add the balance so it counts toward your debt-free date." |
| `apps/rn/src/components/entities/DebtSheet.tsx:244` | `convertingExpenseId` | "Moving this from Expenses. Add the balance so it counts toward your debt-free date." | "Review the scanned details, then add." · "A loan, credit card, or BNPL balance." |
| `apps/rn/src/components/entities/DebtSheet.tsx:246` | `prefill` | "Review the scanned details, then add." | "A loan, credit card, or BNPL balance." |
| `apps/rn/src/components/entities/DebtSheet.tsx:250` | `isEdit` | "Save" | "Add debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:297` | `type === 'bnpl'` | "Affirm — Sofa" | "Visa, Car Loan" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:86` | `isEdit` | "Edit expense" | "Add an expense" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:88` | `isEdit` | "Save" | "Add expense" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:94` | `trial` | "Amount now (0 for a free trial)" | "Amount" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:94` | `trial` | "e.g. 0" | "e.g. 850" |
| `apps/rn/src/components/entities/GoalSheet.tsx:58` | `isEdit` | "Edit goal" | "Add a goal" |
| `apps/rn/src/components/entities/GoalSheet.tsx:60` | `isEdit` | "Save" | "Add goal" |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx:47` | `isEdit` | "Edit spending item" | "Add a spending item" |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx:49` | `isEdit` | "Save" | "Add item" |
| `apps/rn/src/components/money/BnplCalendarSection.tsx:94` | `moreCount === 1` | — | "installments" |
| `apps/rn/src/components/more/BackupSheets.tsx:40` | `copied` | "Copied ✓" | "Copy to clipboard" |
| `apps/rn/src/components/more/CoachMarkProbeReadout.tsx:40` | `entries.length` | — | "EMPTY" |
| `apps/rn/src/components/more/LiveActivityQA.tsx:56` | `enabled` | "Start a state, then check the Lock Screen / Dynamic Island. (iOS only.)" | "Live Activities are OFF in device Settings, or unsupported here (web / <iOS 16.2)." |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:129` | `type === 'debt'` | "Something with a balance you’re paying down — a card, a loan, a mortgage. It ends." | "An ongoing cost that doesn’t end — rent, phone, a subscription." |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:136` | `type === 'debt'` | "Debt name" | "Expense name" |
| `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:142` | `type === 'debt'` | "e.g. Visa Card" | "e.g. Rent" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:242` | `preMarkAllPaid` | "Undo" | "Mark all paid" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:272` | `row.view.isAutopay` | "Autopay · should have run" · "Autopay" | — |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:273` | `row.view.presumedPaid` | "Autopay · should have run" | "Autopay" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:282` | `paid` | "Paid" | "Didn't pay" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:366` | `staleBalances.length === 1` | "1 balance hasn't been checked in a while" | — |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:399` | `external` | "From savings ✓" | "From savings" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:419` | `skipped` | "Skipped" | "Paid" |
| `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:437` | `hasAdjustedRequired \|\| extrasAdjusted` | "Confirm what you paid" | "You followed the plan" |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx:288` | `debtFreeDate` | — | "projected balance over time" |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx:289` | `showMinimums` | "your plan clears faster than minimum payments" | — |
| `apps/rn/src/components/plan/AffordabilityCard.tsx:219` | `result.verdict === 'tight'` | "Apply anyway" | "Apply to this paycheck" |
| `apps/rn/src/components/plan/CashRunwayChart.tsx:199` | `sel === 0` | "This paycheck" | — |
| `apps/rn/src/components/plan/LeanSuggestionCard.tsx:31` | `up` | "Raise your income floor" | "Adjust your income floor" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:189` | `isExample` | "Example" | — |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:209` | `brief.debtFree` | "To savings" | "To debt" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:285` | `brief.debtFree` | "To savings" | "To debt" |
| `apps/rn/src/components/plan/PaydayGuardianCard.tsx:405` | `attestation?.attested` | "Undoes the confirmation and restores the full safety net" | "Tells me your expenses are all entered, so I hold less back" |
| `apps/rn/src/components/plan/PlanHero.tsx:140` | `onEditPaycheck` | "Edit paycheck" | — |
| `apps/rn/src/components/plan/PlanHero.tsx:230` | `windfall > 0` | — | "Add extra income" |
| `apps/rn/src/components/plan/PlanHero.tsx:234` | `windfall > 0` | — | "Add extra income" |
| `apps/rn/src/components/plan/RecommendedActionsCard.tsx:67` | `a.paymentSource === 'external'` | "Completed with outside money" | "Completed this paycheck" |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:171` | `bucketHasReserve` | "from this paycheck" | — |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:191` | `bucketHasReserve` | "from this paycheck" | — |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:231` | `paid` | "Undo, mark unpaid" | "Mark paid" |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:234` | `paid` | "Undo" | "Paid" |
| `apps/rn/src/components/plan/SaveForItSheet.tsx:126` | `o.readyBy != null && o.paychecks != null` | — | "Saved after debt · no firm date" |
| `apps/rn/src/components/plan/ShareCard.tsx:51` | `data.amount != null` | — | "Paid off" |
| `apps/rn/src/components/plan/SpokenForSheet.tsx:67` | `shortHeld` | — | "Groceries, gas, fun money — reserved every paycheck." |
| `apps/rn/src/components/plan/TutorialOverlay.tsx:452` | `isLast` | "Finish" | "Next" |
| `apps/rn/src/components/plan/WindfallSheet.tsx:81` | `isPremium && hasSplit` | "Confirm" | "Add" |
| `apps/rn/src/components/progress/PaidOffArchive.tsx:60` | `d.amount != null` | — | "Paid off" |
| `apps/rn/src/components/progress/PaidOffArchive.tsx:65` | `d.amount != null` | — | "Paid off" |
| `apps/rn/src/components/ui/DateField.tsx:93` | `value` | — | "Select a date" |
| `apps/rn/src/components/ui/ListRow.tsx:76` | `onPress` | "Opens the editor" | — |
| `apps/rn/src/components/ui/ListRow.tsx:151` | `onLogPayment` | "Log payment" · "dollarsign.circle" | — |
| `apps/rn/src/components/ui/ListRow.tsx:152` | `onViewSchedule` | "Payoff schedule" | — |
| `apps/rn/src/components/ui/ListRow.tsx:153` | `onPress` | "Edit" | — |
| `apps/rn/src/utils/confirm.ts:45` | `action` | "Not now" | — |
| `packages/core/guardian/buildGuardianBrief.ts:231` | `isPremium` | "Update your numbers and I'll plan from where you actually are." | — |
| `packages/core/guardian/buildGuardianBrief.ts:262` | `debtFree` | — | "expenses and minimums" |
| `packages/core/guardian/buildGuardianBrief.ts:263` | `isPremium` | "— this one needs a plan." | — |
| `packages/core/guardian/buildGuardianBrief.ts:279` | `state === "clear"` | "Looks clear this paycheck" | "A little tight this paycheck" · "Tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:279` | `state === "tight"` | "A little tight this paycheck" | "Tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:280` | `state === "clear"` | — | "— a bit tight this one, so keep an eye on the essentials." |
| `packages/core/guardian/buildGuardianBrief.ts:294` | `state === "at-risk"` | "Very tight this paycheck" | "A little tight this paycheck" |
| `packages/core/guardian/buildGuardianBrief.ts:299` | `state === "at-risk"` | — | "a little under" |
| `packages/core/guardian/buildGuardianBrief.ts:346` | `debtFree` | "to your goals" | "to debt" |
| `packages/core/guardian/buildGuardianBrief.ts:358` | `debtFree` | "your goals" | — |
| `packages/core/insights/buildSmartInsights.ts:57` | `amountToHold > 0` | — | "Run minimum-only until the next paycheck if any new expenses appear." |
| `packages/core/insights/buildSmartInsights.ts:95` | `projectedBuffer < 200` | "Focus on restoring cushion first, then target this payoff opportunity once cash pressure improves." | "Make this payment after handling required bills and minimums to immediately free up that monthly minimum." |
| `packages/core/insights/buildSmartInsights.ts:97` | `canFullyCover` | "Make this payment after handling required bills and minimums to immediately free up that monthly minimum." | — |
| `packages/core/insights/buildSmartInsights.ts:110` | `highestAprDebt` | — | "Prioritize the highest APR debt first to reduce long-term interest cost." |

## Every string, by file


### `apps/rn/src/app/_layout.tsx`

| line | origin | string |
|---|---|---|
| 211 | other ⚠️ | (tabs) |
| 217 | other ⚠️ | schedule/[id] |
| 235 | other ⚠️ | +not-found |

### `apps/rn/src/app/(tabs)/_layout.tsx`

| line | origin | string |
|---|---|---|
| 82 | prop:options ⚠️ | Today |
| 87 | prop:options ⚠️ | Progress |
| 92 | prop:options ⚠️ | Money |

### `apps/rn/src/app/(tabs)/index.tsx`

| line | origin | string |
|---|---|---|
| 263 | call:useSuppressCoachMarks ⚠️ | today:celebration |
| 263 | call:useSuppressCoachMarks ⚠️ | today:invite |
| 272 | prop:title | Set up your paycheck |
| 273 | prop:body | Add your paycheck to see exactly what to pay each cycle. |
| 274 | prop:cta | Set up your paycheck |
| 436 | prop:title | Add your first debt |
| 437 | prop:body | Your plan is running. Add a debt and it will show you a debt-free date too. |
| 438 | prop:cta | Add a debt |
| 509 | jsx-text | Good news — this paycheck looks clear after all. |
| 511 | prop:label | Got it |
| 529 | prop:label | Got it |
| 543 | jsx-text | A surprise bill came up — I&apos;ve restored your safety net for now. |
| 546 | prop:label | Got it |
| 557 | jsx-expr | Payment logged — I updated your balance. |
| 558 | jsx-expr | Payday landed — I rolled your plan forward to this paycheck. |
| 562 | prop:label | Undo |
| 563 | prop:label | Keep |
| 573 | jsx-text | Your |
| 573 | jsx-text | trial has ended — it&apos;s now $ |
| 573 | call:fullAmount.toLocaleString ⚠️ | en-US |
| 574 | jsx-text | . Keeping it? |
| 581 | prop:label | Keep it |
| 584 | prop:label | Cancelled it |
| 585 | prop:label | Not now |
| 609 | jsx-text | Payday logged. Start your next pay cycle to apply this cycle&apos;s payments and get your next plan. |
| 611 | prop:label | Start Next Pay Cycle |
| 618 | jsx-text | Private · on your device |
| 660 | prop:onManageEveryday ⚠️ | /living-expenses |
| 849 | call:useStore ⚠️ | A surprise bill came up — I’ve restored your safety net for now. |

### `apps/rn/src/app/(tabs)/money.tsx`

| line | origin | string |
|---|---|---|
| 74 | key:debts ⚠️ | Balances you’re paying down. These have an end date, and they set your debt-free date. |
| 75 | key:bills ⚠️ | Ongoing costs that don’t end. Reserved from every paycheck before anything goes to debt. |
| 76 | key:goals ⚠️ | Money you’re setting aside — saved for, not owed. |
| 103 | prop:title | Money |
| 108 | prop:options ⚠️ | Debts |
| 109 | prop:options ⚠️ | Expenses |
| 110 | prop:options ⚠️ | Goals |
| 164 | jsx-text | Is this a debt you&apos;re paying down? Debts count toward your debt-free date — expenses don&apos;t. |
| 168 | jsx-text | Move to Debts |
| 178 | jsx-text | Not a debt |
| 305 | prop:title | Start your debt-free plan |
| 306 | prop:body | Add a loan, credit card, or BNPL balance to see your debt-free date. |
| 307 | prop:cta | Add |
| 311 | prop:label | Scan a statement |
| 326 | key:title | PAID OFF |
| 339 | prop:options ⚠️ | Snowball |
| 340 | prop:options ⚠️ | Avalanche |
| 345 | jsx-expr | Smallest balance first — quick wins. Your debts are listed in payoff order. |
| 346 | jsx-expr | Highest APR first — least interest. Your debts are listed in payoff order. |
| 374 | prop:label | Add |
| 376 | prop:label | Scan a statement |
| 402 | jsx-text | Select a debt to edit, or add one. |
| 444 | var:captionText ⚠️ | estimated · tap to verify |
| 460 | prop:label | Focus |
| 461 | prop:label | BNPL |
| 461 | prop:label | Autopay |
| 471 | prop:amountSuffix ⚠️ | /mo |
| 471 | prop:amountSuffix ⚠️ | /mo |
| 635 | prop:title | Build your paycheck plan |
| 636 | prop:body | Add an ongoing cost — rent, utilities, a subscription — so your plan knows what’s due. |
| 637 | prop:cta | Add |
| 677 | key:sub ⚠️ | reserved for upcoming expenses |
| 732 | prop:meta | · Variable |
| 734 | prop:label | Autopay |
| 745 | jsx-text | No expenses match “ |
| 750 | prop:label | Add |
| 788 | prop:placeholder | Search expenses |
| 795 | prop:accessibilityLabel | Clear search |
| 861 | prop:accessibilityLabel | Everyday spending reserve, nothing set up yet. Opens management. |
| 867 | jsx-text | Everyday spending reserve |
| 870 | jsx-expr | Not set up |
| 877 | jsx-expr | Groceries, gas, fun money — reserve it each paycheck |
| 880 | jsx-expr | Reserved each paycheck · tap to manage |
| 898 | prop:title | Start a savings goal |
| 899 | prop:body | Add an emergency fund or savings goal to start tracking progress. |
| 900 | prop:cta | Add |
| 929 | prop:meta | Emergency fund |
| 929 | prop:meta | Savings |
| 930 | prop:amount ⚠️ | Funded |
| 932 | prop:label | Funded |
| 940 | prop:label | Add |

### `apps/rn/src/app/(tabs)/progress.tsx`

| line | origin | string |
|---|---|---|
| 95 | prop:title | Progress |
| 101 | jsx-text | DEBT-FREE |
| 102 | jsx-text | Every balance paid off |
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
| 33 | call:announce ⚠️ | Cushion forecast |
| 37 | prop:title | Your cushion forecast |
| 52 | prop:title | Your cushion forecast is part of Premium |
| 53 | prop:body | See your cushion projected across the next six paydays, where it dips below your line, and how accurate your Guardian has been. |
| 54 | prop:cta | See Premium |
| 55 | prop:onCta ⚠️ | /paywall?from=cushion-forecast |

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
| 38 | jsx-text | Everyday spending reserved each paycheck, before debt and goals. |
| 44 | prop:title | No spending items yet |
| 45 | prop:body | Add groceries, gas, or fun money to reserve for everyday spending each paycheck. |
| 46 | prop:cta | Add your first item |
| 52 | jsx-text | Reserve per paycheck |
| 65 | prop:meta | Counts toward reserve |
| 65 | prop:meta | Not counted |
| 67 | prop:label | Off |
| 73 | prop:label | Add spending item |

### `apps/rn/src/app/more.tsx`

| line | origin | string |
|---|---|---|
| 89 | call:notify ⚠️ | Notifications are off for Debt Planner |
| 90 | call:notify ⚠️ | iOS only asks once. You can turn them back on in Settings. |
| 91 | key:label | Open Settings |
| 96 | call:notify ⚠️ | Notifications stay off |
| 96 | call:notify ⚠️ | You can turn them on here whenever you want a nudge before a bill is due. |
| 99 | call:notify ⚠️ | Not available here |
| 99 | call:notify ⚠️ | Reminders are a feature of the iPhone app. |
| 115 | prop:title | More |
| 130 | prop:label | Premium |
| 131 | prop:subtitle | Active — thanks for the support. |
| 139 | prop:label | Premium — Lifetime |
| 140 | prop:subtitle | Active — a one-time purchase, yours forever. Thanks for the support. |
| 146 | prop:label | Premium |
| 147 | prop:subtitle | Active — thanks for the support. Tap to manage your subscription. |
| 155 | prop:label | Unlock Premium |
| 156 | prop:subtitle | Payday Guardian, Can I Afford It & more. |
| 168 | prop:label | Pay cycle history |
| 169 | prop:subtitle | Look back at your finished pay cycles. |
| 177 | prop:label | How your Guardian works |
| 178 | prop:subtitle | Replay the short walkthrough. |
| 191 | prop:label | Show feature tips again |
| 192 | prop:subtitle | Tips will appear again as you go. |
| 192 | prop:subtitle | Re-offer the one-line hints on hidden features. |
| 201 | prop:title | Data |
| 203 | prop:label | Export backup |
| 203 | prop:subtitle | Save a copy of your data. |
| 204 | prop:label | Import backup |
| 204 | prop:subtitle | Restore from a saved backup. |
| 207 | prop:label | iCloud backup |
| 208 | prop:subtitle | Automatic cloud backup — coming soon. |
| 209 | jsx-text | Soon |
| 214 | prop:label | Delete all data |
| 219 | prop:title | Preferences |
| 226 | prop:label | Your name |
| 230 | prop:placeholder | Used to greet you on Today |
| 236 | jsx-text | Appearance |
| 241 | prop:options ⚠️ | Auto |
| 242 | prop:options ⚠️ | Light |
| 243 | prop:options ⚠️ | Dark |
| 251 | prop:label | Notifications |
| 252 | prop:subtitle | Paycheck-eve reminder and due-date alerts. |
| 253 | prop:accessibilityLabel | Notifications |
| 257 | prop:label | App Lock |
| 258 | prop:subtitle | Require Face ID / passcode to open. |
| 259 | prop:accessibilityLabel | App Lock |
| 268 | prop:label | Share anonymous usage |
| 269 | prop:subtitle | Which screens get used — never your balances, debts, or amounts. |
| 272 | prop:accessibilityLabel | Share anonymous usage |
| 281 | prop:label | Savings elsewhere |
| 282 | prop:subtitle | Skip building a starter emergency fund — put more toward debt first. |
| 283 | prop:accessibilityLabel | Savings elsewhere |
| 290 | prop:label | Payday countdown |
| 291 | prop:subtitle | Show a Live Activity in the ~3 days before payday. |
| 292 | prop:accessibilityLabel | Payday countdown |
| 298 | prop:label | Debt-free sound |
| 299 | prop:subtitle | Play a chime when you clear your last debt. |
| 300 | prop:accessibilityLabel | Debt-free sound |
| 302 | prop:subtitle | What you reserve for day-to-day spending each paycheck. |
| 306 | prop:title | About |
| 308 | prop:label | Privacy Policy |
| 309 | prop:label | Terms of Use |
| 310 | prop:label | Support |
| 315 | prop:label | Manage Subscription |
| 317 | prop:label | Version |
| 325 | prop:title | Developer / QA |
| 329 | prop:label | Simulate Premium |
| 330 | prop:subtitle | Unlock premium features for testing (dev / TestFlight QA). |
| 333 | prop:accessibilityLabel | Simulate Premium |
| 385 | jsx-text | All debts, expenses, goals, and settings will be permanently erased. This cannot be undone. |
| 389 | prop:label | Cancel |
| 392 | prop:label | Delete Everything |

### `apps/rn/src/app/paywall.tsx`

| line | origin | string |
|---|---|---|
| 31 | key:text | Payday Guardian — works out how much to keep back each payday to protect your cushion, and reshapes the plan around it. |
| 32 | key:text | Can I Afford It? — apply any purchase to your plan in one tap, or build a plan to save for it. |
| 33 | key:text | Recovery Plan — a guided catch-up when a cycle comes up short. |
| 39 | key:text | Balances that keep themselves roughly right — projected forward between statements, or re-scanned in seconds. No monthly retyping. |
| 45 | var:AUTO_RENEW_DISCLOSURE | Payment will be charged to your Apple Account at confirmation of purchase. Subscriptions |
| 46 | var:AUTO_RENEW_DISCLOSURE | automatically renew unless canceled at least 24 hours before the end of the current period. Your |
| 47 | var:AUTO_RENEW_DISCLOSURE | account is charged for renewal within 24 hours prior to the end of the current period. Manage or |
| 48 | var:AUTO_RENEW_DISCLOSURE | cancel anytime in your App Store account settings. Lifetime is a one-time purchase (not a |
| 49 | var:AUTO_RENEW_DISCLOSURE | subscription) that covers all current Premium features; any future add-on tiers, like bank |
| 50 | var:AUTO_RENEW_DISCLOSURE | connection or an AI coach, are sold separately. |
| 66 | var:LIFETIME_SUBNOTE ⚠️ | Pay once — all today’s Premium, forever |
| 73 | key:title | Annual |
| 73 | key:periodLabel | per year |
| 73 | key:subnote | Billed yearly · just $2.50/mo |
| 73 | key:badge | Best value |
| 74 | key:title | Lifetime |
| 74 | key:periodLabel | one time |
| 74 | key:badge | Pay once |
| 75 | key:title | Monthly |
| 75 | key:periodLabel | per month |
| 75 | key:subnote | Billed monthly |
| 82 | other ⚠️ | ANNUAL |
| 87 | key:title | Annual |
| 87 | key:periodLabel | per year |
| 87 | key:badge | Best value |
| 89 | other ⚠️ | LIFETIME |
| 90 | key:title | Lifetime |
| 90 | key:periodLabel | one time |
| 90 | key:badge | Pay once |
| 91 | other ⚠️ | MONTHLY |
| 92 | key:title | Monthly |
| 92 | key:periodLabel | per month |
| 92 | key:subnote | Billed monthly |
| 174 | call:notify ⚠️ | Not available here |
| 174 | call:notify ⚠️ | In-app purchases aren’t available in this preview — try it on your device. |
| 183 | call:notify ⚠️ | You’re Premium 🎉 |
| 183 | call:notify ⚠️ | Your premium tools are unlocked. |
| 188 | call:notify ⚠️ | Almost there |
| 188 | call:notify ⚠️ | Your purchase went through, but Premium couldn’t be confirmed yet. Tap Restore, or contact support if it persists. |
| 191 | call:notify ⚠️ | Purchase didn’t complete |
| 191 | call:notify ⚠️ | Something went wrong. Please try again. |
| 199 | call:notify ⚠️ | Not available here |
| 199 | call:notify ⚠️ | Restoring purchases isn’t available in this preview. |
| 207 | call:notify ⚠️ | Purchases restored |
| 207 | call:notify ⚠️ | Your premium access is back. |
| 210 | call:notify ⚠️ | Nothing to restore |
| 210 | call:notify ⚠️ | No active purchase was found for this Apple Account. |
| 213 | call:notify ⚠️ | Restore didn’t complete |
| 213 | call:notify ⚠️ | Something went wrong. Please try again. |
| 220 | var:ctaLabel ⚠️ | Starting… |
| 231 | prop:title | Premium |
| 234 | jsx-text | Every payday, worked out for you |
| 240 | jsx-text | The app does the arithmetic — the money moves stay yours. |
| 277 | jsx-expr | You’re on Premium — Lifetime. Thanks for the support. |
| 277 | jsx-expr | You’re on Premium — thanks for the support. |
| 283 | prop:label | Manage subscription |
| 292 | jsx-text | Plans couldn’t load right now. Check your connection and try again. |
| 294 | prop:label | Retry |
| 351 | jsx-text | See it in action |
| 356 | jsx-expr | Restoring… |
| 356 | jsx-expr | Restore purchases |
| 363 | jsx-text | Terms of Use (EULA) |
| 367 | jsx-text | Privacy Policy |

### `apps/rn/src/app/schedule/[id].tsx`

| line | origin | string |
|---|---|---|
| 25 | call:announce ⚠️ | Payoff schedule |
| 31 | prop:title | Payoff schedule |

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
| 37 | key:debts ⚠️ | Something with a balance you're paying down. It ends. |
| 38 | key:bills ⚠️ | An ongoing cost that doesn't end. |
| 39 | key:goals ⚠️ | Money you're setting aside for something. |
| 45 | key:title | A debt |
| 47 | key:examples ⚠️ | Credit card · Car loan · Mortgage · Buy-now-pay-later |
| 52 | key:title | An expense |
| 54 | key:examples ⚠️ | Rent · Phone · Electric · Subscriptions |
| 59 | key:title | A savings goal |
| 63 | key:examples ⚠️ | Emergency fund · A trip · A new laptop |
| 77 | prop:title | What are you adding? |
| 81 | prop:subtitle | It'll go in the right place. |

### `apps/rn/src/components/entities/AmortizationView.tsx`

| line | origin | string |
|---|---|---|
| 19 | call:d.toLocaleString ⚠️ | en-US |
| 50 | jsx-text | No schedule to show. |
| 62 | jsx-text | At |
| 62 | jsx-text | /mo the interest outpaces the balance, so this debt never gets           paid off. Increasing the payment fixes it. |
| 70 | jsx-text | debt-free · |
| 79 | jsx-text | Paying |
| 79 | jsx-text | /mo |
| 80 | jsx-expr | — minimum + your extra |
| 80 | jsx-expr | — the minimum |
| 84 | jsx-text | MONTH |
| 85 | jsx-text | BALANCE |
| 101 | jsx-text | interest · |
| 115 | jsx-text | Show all |
| 137 | jsx-text | Payoff schedule |

### `apps/rn/src/components/entities/DebtSheet.tsx`

| line | origin | string |
|---|---|---|
| 47 | key:label | Every 3 months |
| 58 | key:label | Not specified |
| 60 | key:label | Other |
| 164 | call:setError | Enter the payment amount. |
| 165 | call:setError | Enter how many payments are left. |
| 188 | call:setError | Minimum payment can’t exceed the balance. |
| 240 | prop:title | Edit debt |
| 240 | prop:title | Add a debt |
| 240 | prop:title | Add from scan |
| 240 | prop:title | Add a debt |
| 245 | prop:subtitle | Moving this from Expenses. Add the balance so it counts toward your debt-free date. |
| 247 | prop:subtitle | Review the scanned details, then add. |
| 248 | prop:subtitle | A loan, credit card, or BNPL balance. |
| 250 | prop:submitLabel | Save |
| 250 | prop:submitLabel | Add debt |
| 277 | jsx-text | Log a payment |
| 289 | jsx-text | View payoff schedule |
| 297 | prop:label | Name |
| 297 | prop:placeholder | Affirm — Sofa |
| 297 | prop:placeholder | Visa, Car Loan |
| 299 | prop:label | Type |
| 301 | prop:options ⚠️ | Debt / loan |
| 301 | prop:options ⚠️ | BNPL (buy now, pay later) |
| 308 | prop:label | Provider |
| 309 | prop:label | Payment amount |
| 309 | prop:placeholder | e.g. 100 |
| 310 | prop:label | Payments remaining |
| 310 | prop:placeholder | e.g. 4 |
| 311 | prop:label | How often |
| 312 | prop:label | Next payment |
| 315 | jsx-text | left · interest-free |
| 321 | prop:label | Current balance |
| 321 | prop:placeholder | e.g. 2400 |
| 324 | prop:accessibilityLabel | Re-scan a statement to update this balance |
| 325 | jsx-text | Re-scan to update → |
| 338 | jsx-text | Estimated |
| 341 | jsx-text | Apply Estimate to Plan |
| 344 | jsx-text | Updated |
| 346 | prop:label | Minimum payment |
| 346 | prop:placeholder | e.g. 65 |
| 347 | prop:label | APR % |
| 347 | prop:placeholder | e.g. 22.99 |
| 348 | prop:label | Due date |
| 349 | prop:label | Recurrence |
| 352 | prop:label | Autopay |

### `apps/rn/src/components/entities/ExpenseSheet.tsx`

| line | origin | string |
|---|---|---|
| 47 | call:setError | Enter the amount you pay now (0 for a free trial). |
| 48 | call:setError | Enter the full price after the trial. |
| 50 | call:setError | Enter when the full price starts (YYYY-MM-DD). |
| 86 | prop:title | Edit expense |
| 86 | prop:title | Add an expense |
| 88 | prop:submitLabel | Save |
| 88 | prop:submitLabel | Add expense |
| 93 | prop:label | Name |
| 93 | prop:placeholder | Rent, phone, utilities |
| 94 | prop:label | Amount now (0 for a free trial) |
| 94 | prop:label | Amount |
| 94 | prop:placeholder | e.g. 0 |
| 94 | prop:placeholder | e.g. 850 |
| 96 | prop:label | Due date |
| 97 | prop:label | Recurrence |
| 98 | prop:label | Category |
| 99 | prop:label | Variable amount (estimate) |
| 100 | prop:label | Free trial or intro price |
| 103 | prop:label | Full price after the trial |
| 103 | prop:placeholder | e.g. 15.99 |
| 104 | prop:label | Full price starts |
| 107 | prop:label | Autopay |

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
| 63 | prop:label | Count toward your reserve |

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
| 13 | prop:getComponent ⚠️ | ./AllocationBarChart |

### `apps/rn/src/components/money/BillBreakdownSheet.tsx`

| line | origin | string |
|---|---|---|
| 38 | key:biweekly ⚠️ | every 2 weeks |
| 39 | key:'per-paycheck' ⚠️ | every paycheck |
| 53 | prop:title | Where it goes |
| 60 | jsx-text | recommended per paycheck |
| 67 | jsx-text | Every bill spread evenly across your paychecks — so the lumpy ones are far less likely to land as a surprise. |
| 84 | jsx-text | /paycheck |
| 102 | jsx-text | /paycheck |
| 115 | jsx-text | Plus |
| 115 | jsx-text | one-time |
| 115 | jsx-text | — not part of your ongoing reserve. |

### `apps/rn/src/components/money/BnplCalendarSection.tsx`

| line | origin | string |
|---|---|---|
| 69 | jsx-text | UPCOMING BNPL INSTALLMENTS |
| 94 | jsx-expr | installments |

### `apps/rn/src/components/more-button.tsx`

| line | origin | string |
|---|---|---|
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
| 44 | prop:label | See your plan  → |
| 62 | prop:label | What should the app call you? (optional) |
| 65 | prop:placeholder | Your name |

### `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx`

| line | origin | string |
|---|---|---|
| 52 | call:setError | Enter the amount. |
| 92 | prop:label | Add & Continue |
| 93 | prop:label | Skip, I'll add later |
| 97 | jsx-text | Add your first debt or expense |
| 99 | jsx-text | See your plan come to life right away. You can add more any time. |
| 110 | prop:options ⚠️ | Debt |
| 111 | prop:options ⚠️ | Expense |
| 130 | jsx-expr | Something with a balance you’re paying down — a card, a loan, a mortgage. It ends. |
| 131 | jsx-expr | An ongoing cost that doesn’t end — rent, phone, a subscription. |
| 136 | prop:label | Debt name |
| 136 | prop:label | Expense name |
| 142 | prop:placeholder | e.g. Visa Card |
| 142 | prop:placeholder | e.g. Rent |
| 149 | prop:label | Current balance |
| 155 | prop:placeholder | e.g. 2400 |
| 162 | prop:label | Minimum payment |
| 168 | prop:placeholder | e.g. 35 |
| 173 | prop:label | APR % (optional) |
| 173 | prop:placeholder | e.g. 22.99 |
| 180 | prop:label | Amount |
| 186 | prop:placeholder | e.g. 1200 |

### `apps/rn/src/components/onboarding/PaycheckStep.tsx`

| line | origin | string |
|---|---|---|
| 40 | call:setError | Enter your paycheck amount to continue. |
| 78 | prop:label | Continue |
| 79 | prop:label | Skip for now |
| 83 | jsx-text | When do you get paid? |
| 85 | jsx-text | This sets up your pay cycle so your plan knows which expenses are due next. |

### `apps/rn/src/components/onboarding/WelcomeStep.tsx`

| line | origin | string |
|---|---|---|
| 16 | key:title | A guardian for every payday |
| 16 | key:body | Know what's safe to spend and what to pay down — your cushion comes first. |
| 17 | key:title | A real debt-free date |
| 17 | key:body | Snowball or avalanche — see exactly when your last debt disappears. |
| 18 | key:title | Spend without the guilt |
| 18 | key:body | Check any purchase against your plan before you buy. |
| 29 | prop:label | Get Started |
| 42 | prop:label | See it in action |
| 49 | jsx-text | Will you make it to payday? |
| 54 | jsx-text | Debt Planner watches your cushion every paycheck — so you know what&apos;s safe to spend and what to pay down. |

### `apps/rn/src/components/payday/PaydayCaptureSheet.tsx`

| line | origin | string |
|---|---|---|
| 36 | return | a while ago |
| 205 | var:requiredSub ⚠️ | All confirmed paid |
| 234 | jsx-text | ‹ Back |
| 236 | jsx-text | Which expenses got paid? |
| 238 | jsx-text | Tap to mark what you actually paid — anything left carries to next cycle. |
| 242 | jsx-expr | Undo |
| 242 | jsx-expr | Mark all paid |
| 274 | jsx-expr | Autopay · should have run |
| 275 | jsx-expr | Autopay |
| 282 | prop:label | Paid |
| 282 | prop:label | Didn't pay |
| 288 | jsx-text | carries to next cycle |
| 292 | prop:label | Done |
| 299 | jsx-text | ‹ Back |
| 301 | jsx-text | Check your balances |
| 303 | jsx-text | Confirm each estimate, or type the real balance from your statement. |
| 315 | jsx-text | estimated ~ |
| 315 | jsx-text | · verified |
| 328 | prop:label | Confirm balances |
| 334 | jsx-text | It&apos;s payday |
| 336 | jsx-text | Here&apos;s the plan you set for this paycheck. Confirm what you actually paid. |
| 340 | jsx-text | Close |
| 349 | jsx-text | Required expenses & minimums |
| 354 | prop:label | Adjust |
| 364 | jsx-text | Estimated balances |
| 367 | jsx-expr | 1 balance hasn't been checked in a while |
| 371 | prop:label | Update |
| 373 | prop:label | These look right |
| 378 | jsx-text | Balances confirmed |
| 383 | jsx-text | EXTRA PAYMENTS |
| 399 | jsx-expr | From savings ✓ |
| 399 | jsx-expr | From savings |
| 419 | prop:label | Skipped |
| 419 | prop:label | Paid |
| 430 | jsx-text | You paid |
| 437 | prop:label | Confirm what you paid |
| 437 | prop:label | You followed the plan |
| 438 | prop:label | Skip this payday |
| 478 | jsx-text | Payday captured |
| 484 | jsx-text | confirmed · your plan&apos;s up to date |

### `apps/rn/src/components/payoff/TrajectoryCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 17 | prop:getComponent ⚠️ | ./TrajectorySkiaChart |

### `apps/rn/src/components/payoff/TrajectoryChart.tsx`

| line | origin | string |
|---|---|---|
| 228 | call:monthDate ⚠️ | en-US |
| 229 | var:minimumsDateLabel ⚠️ | Never |
| 279 | jsx-text | PAYOFF TRAJECTORY |
| 280 | jsx-text | Balance over time |
| 287 | call:groupLabel | Payoff trajectory chart |
| 288 | call:groupLabel | projected balance over time |
| 289 | call:groupLabel | your plan clears faster than minimum payments |
| 387 | call:monthDate ⚠️ | en-US |
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
| 52 | var:effName ⚠️ | Savings goal |
| 69 | var:purchaseName ⚠️ | Purchase |
| 83 | var:purchaseName ⚠️ | Purchase |
| 112 | jsx-text | CAN I AFFORD IT? |
| 125 | prop:label | Undo |
| 136 | jsx-text | CAN I AFFORD IT? |
| 146 | prop:label | Undo |
| 155 | jsx-text | CAN I AFFORD IT? |
| 158 | jsx-text | Thinking about a purchase? |
| 161 | prop:label | Amount |
| 161 | prop:placeholder | e.g. 400 |
| 162 | prop:label | What is it? (optional) |
| 162 | prop:placeholder | e.g. New couch |
| 166 | jsx-text | Enter an amount to see if it fits this paycheck. |
| 169 | jsx-text | You have about |
| 169 | jsx-text | spare this paycheck. |
| 178 | jsx-text | Not this paycheck — you&apos;d come up about |
| 178 | jsx-text | short. |
| 182 | prop:label | Save for it → |
| 199 | jsx-text | About |
| 199 | jsx-text | less goes to debt this paycheck. |
| 219 | prop:label | Apply anyway |
| 219 | prop:label | Apply to this paycheck |

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
| 183 | jsx-text | your $ |
| 191 | jsx-text | I&apos;m setting aside |
| 191 | jsx-text | from this paycheck for a tight cycle ahead. |
| 199 | jsx-expr | This paycheck |
| 204 | prop:label | Income |
| 205 | prop:label | Expenses & essentials |
| 208 | prop:label | Left after essentials |

### `apps/rn/src/components/plan/CoachMarkLayer.tsx`

| line | origin | string |
|---|---|---|
| 72 | call:probeCoachMark ⚠️ | NULL |
| 72 | call:probeCoachMark ⚠️ | (cancelled) |
| 86 | var:verdict ⚠️ | DREW |
| 91 | call:useEffect ⚠️ | DREW |
| 164 | prop:accessibilityLabel | Got it |
| 167 | jsx-text | Got it |

### `apps/rn/src/components/plan/CushionBarCanvas.web.tsx`

| line | origin | string |
|---|---|---|
| 12 | prop:getComponent ⚠️ | ./CushionBarChart |

### `apps/rn/src/components/plan/CushionFloorSheet.tsx`

| line | origin | string |
|---|---|---|
| 46 | prop:title | Your cushion line |
| 47 | prop:subtitle | The cash I keep each paycheck before any extra debt payoff. |
| 48 | prop:submitLabel | Save |
| 65 | call:value.toLocaleString ⚠️ | en-US |
| 66 | prop:accessibilityLabel | Cushion line amount |

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
| 120 | jsx-text | Unlock Premium |

### `apps/rn/src/components/plan/ExampleCanvasMarker.tsx`

| line | origin | string |
|---|---|---|
| 14 | var:EXAMPLE_MONEY ⚠️ | Example money |
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
| 45 | jsx-text | Reserved since day one |
| 48 | jsx-text | I&apos;ve set your line aside on every paycheck since the first one. I&apos;m still learning your           patterns — I&apos;ll show my track record once I&apos;ve seen a few more paychecks. |
| 59 | var:recalibration ⚠️ | I've under-warned a few times — I've tightened my read. |
| 61 | var:recalibration ⚠️ | I've been over-cautious a few times — I'm recalibrating. |
| 66 | jsx-text | GUARDIAN ACCURACY |
| 68 | jsx-text | reads matched |
| 71 | jsx-text | How often my read of whether you&apos;d hold your cushion matched what you actually confirmed. |
| 78 | prop:label | Under-warned |
| 78 | prop:sub ⚠️ | said you'd hold, you dipped below |
| 79 | prop:label | Over-cautious |
| 79 | prop:sub ⚠️ | flagged a risk that didn't land |

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
| 20 | key:body | You've paid off 25% of your debt. Keep the momentum going. |
| 21 | key:title | Halfway to debt-free |
| 21 | key:body | 50% paid off — you're over the hump. |
| 22 | key:title | Three-quarters done |
| 22 | key:body | 75% paid off. The finish line is in sight. |
| 45 | prop:label | Keep going |

### `apps/rn/src/components/plan/PaidOffBeat.tsx`

| line | origin | string |
|---|---|---|
| 89 | call:shareDebtCard ⚠️ | Share your win |
| 98 | var:beatA11y ⚠️ | — paid off |
| 116 | jsx-text | Paid off |
| 126 | jsx-text | Paid off |
| 131 | jsx-text | Freed |
| 131 | jsx-text | /mo now flows to |
| 137 | prop:label | Share |
| 138 | prop:label | Keep going |

### `apps/rn/src/components/plan/PaidOffFinale.tsx`

| line | origin | string |
|---|---|---|
| 107 | prop:accessibilityLabel | $0 balance |
| 116 | jsx-text | You&rsquo;re debt-free |
| 119 | prop:label | paid off |
| 127 | prop:label | Share your win |
| 128 | prop:label | Continue |

### `apps/rn/src/components/plan/PaycheckSheet.tsx`

| line | origin | string |
|---|---|---|
| 50 | call:setError | Enter your paycheck amount. |
| 82 | prop:title | Paycheck & pay cycle |
| 83 | prop:subtitle | Your income and when it lands — the foundation of every plan. |
| 84 | prop:submitLabel | Save paycheck |
| 154 | prop:label | This paycheck didn't arrive |

### `apps/rn/src/components/plan/PaydayGuardianCard.tsx`

| line | origin | string |
|---|---|---|
| 166 | var:attestLabel ⚠️ | Expenses confirmed — holding a smaller safety net. Undo |
| 167 | var:attestLabel ⚠️ | All your regular expenses entered? I'll hold a smaller safety net. |
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
| 37 | jsx-text | Looks like you crushed |
| 40 | jsx-text | Your estimate reached $0. Confirm it&apos;s paid off and it&apos;s official. |
| 42 | prop:label | Confirm — it's paid off |
| 44 | jsx-text | Not yet — update the balance |

### `apps/rn/src/components/plan/PlanHero.tsx`

| line | origin | string |
|---|---|---|
| 114 | var:statusLabel ⚠️ | Overdue payments need attention |
| 116 | var:statusLabel ⚠️ | Short this paycheck |
| 117 | var:statusLabel ⚠️ | On track |
| 140 | prop:accessibilityLabel | Edit paycheck |
| 143 | jsx-text | THIS PAYCHECK · |
| 171 | jsx-text | Suggested · |
| 230 | prop:accessibilityLabel | Add extra income |
| 234 | jsx-expr | Add extra income |

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
| 60 | jsx-text | COVER NOW |
| 76 | jsx-text | CAN WAIT IN YOUR PLAN |
| 78 | jsx-text | Moving these buys room in your plan — the biller still needs handling. |
| 101 | jsx-text | Keep essential |
| 133 | jsx-text | This reschedules the payment in your plan — remember to handle it with the biller (pay it late, or cancel it). |

### `apps/rn/src/components/plan/RequiredActionsCard.tsx`

| line | origin | string |
|---|---|---|
| 27 | other ⚠️ | unfundedRequiredItems |
| 96 | jsx-text | Required Actions |
| 98 | jsx-text | Bills and minimums due this paycheck. |
| 105 | jsx-text | You&apos;re caught up for this paycheck. |
| 124 | jsx-text | Short this paycheck — cover these from savings or your next paycheck. |
| 171 | prop:accessibilityLabel | from this paycheck |
| 191 | jsx-expr | from this paycheck |
| 231 | prop:accessibilityLabel | Undo, mark unpaid |
| 231 | prop:accessibilityLabel | Mark paid |
| 234 | jsx-expr | Undo |
| 234 | jsx-expr | Paid |
| 273 | prop:label | Auto-paid |
| 275 | prop:label | Autopay |
| 295 | prop:label | Overdue |
| 296 | jsx-text | Due |
| 302 | jsx-text | this cycle |
| 311 | jsx-text | from your reserve |

### `apps/rn/src/components/plan/SaveForItSheet.tsx`

| line | origin | string |
|---|---|---|
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
| 40 | prop:label | paid off |
| 50 | jsx-text | Paid off |
| 51 | jsx-expr | Paid off |
| 54 | jsx-text | /mo freed toward the next one |
| 61 | jsx-text | paid off |
| 64 | jsx-text | paid off |
| 66 | jsx-text | on my way to debt-free |
| 73 | jsx-text | Debt Planner &middot; your payday debt-payoff app |

### `apps/rn/src/components/plan/SpokenForSheet.tsx`

| line | origin | string |
|---|---|---|
| 61 | jsx-text | of this paycheck is already accounted for |
| 69 | prop:hint | Groceries, gas, fun money — reserved every paycheck. |
| 73 | prop:actionLabel | Manage everyday spending |
| 76 | prop:label | Upcoming expenses |
| 77 | prop:hint | Money you've set by for expenses that land in a later cycle. |
| 101 | jsx-text | Set by |
| 104 | jsx-text | Optional — your plan works either way. |
| 112 | prop:accessibilityLabel | Undo this paycheck's expense reserve |
| 114 | jsx-text | Undo this paycheck’s reserve |

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
| 452 | prop:label | Finish |
| 452 | prop:label | Next |
| 453 | prop:label | Back |
| 460 | jsx-text | Skip |

### `apps/rn/src/components/plan/WindfallSheet.tsx`

| line | origin | string |
|---|---|---|
| 22 | key:label | Covers your expenses & essentials first |
| 23 | key:label | Extra to your debt |
| 25 | key:label | Toward your goals |
| 26 | key:label | Held as your safety net |
| 27 | key:label | Left as spare cash |
| 79 | prop:title | Extra income |
| 80 | prop:subtitle | A bonus, refund, or side gig — added to this paycheck only. |
| 81 | prop:submitLabel | Confirm |
| 81 | prop:submitLabel | Add |
| 86 | prop:label | Amount |
| 92 | prop:placeholder | e.g. 500 |
| 101 | jsx-text | HERE&apos;S HOW THE APP WILL ROUTE |
| 112 | jsx-text | Confirm to route it this way — your whole plan updates. Your call. |

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
| 12 | prop:getComponent ⚠️ | ./JourneyRingChart |

### `apps/rn/src/components/progress/PaidOffArchive.tsx`

| line | origin | string |
|---|---|---|
| 38 | call:shareDebtCard ⚠️ | Share your progress |
| 47 | jsx-text | DEBTS PAID OFF · |
| 60 | call:groupLabel | Paid off |
| 65 | jsx-expr | Paid off |
| 73 | prop:label | Share |

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
| 35 | jsx-text | Couldn&rsquo;t save your last change to this device. It&rsquo;s still here — we&rsquo;ll keep         trying. |

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

### `apps/rn/src/components/ui/Select.tsx`

| line | origin | string |
|---|---|---|
| 31 | jsx-expr | Select |

### `apps/rn/src/data/legacyBridge/readLegacyStores.ts`

| line | origin | string |
|---|---|---|
| 57 | key:error ⚠️ | source vanished |
| 66 | call:db.getAllAsync ⚠️ | SELECT key, value FROM ItemTable |
| 139 | key:path ⚠️ | (walk) |

### `apps/rn/src/data/legacyBridge/report.ts`

| line | origin | string |
|---|---|---|
| 42 | return | legacy-read: unsupported |

### `apps/rn/src/data/legacyBridge/webkitLocalStorage.ts`

| line | origin | string |
|---|---|---|
| 29 | var:LEGACY_KEY_PREFIX ⚠️ | debtPlanner. |
| 184 | call:name.endsWith ⚠️ | .localstorage |
| 184 | other ⚠️ | localstorage.sqlite3 |

### `apps/rn/src/data/migrations.ts`

| line | origin | string |
|---|---|---|
| 33 | other ⚠️ | runMigrations: persisted store is not an object |

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

### `apps/rn/src/notifications/notifications.ts`

| line | origin | string |
|---|---|---|
| 33 | key:buttonTitle ⚠️ | Run your plan |
| 34 | key:buttonTitle ⚠️ | Review your plan |
| 35 | key:buttonTitle ⚠️ | Check your plan |
| 70 | key:title | Before this paycheck lands |
| 71 | key:body | I'd give your plan a quick look before payday. |
| 135 | call:schedule ⚠️ | Paycheck tomorrow |
| 135 | call:schedule ⚠️ | Your paycheck arrives tomorrow — open Debt Planner to run your plan. |
| 142 | call:schedule ⚠️ | It's payday |
| 142 | call:schedule ⚠️ | Open Debt Planner to confirm your plan for this paycheck. |
| 158 | var:title ⚠️ | Upcoming expense |

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
| 25 | other ⚠️ | /money |
| 25 | other ⚠️ | /progress |
| 92 | key:screen ⚠️ | /money |
| 92 | key:beat | The situation: three debts, a number you recognise. |
| 93 | key:beat | The mechanism: a paycheck lands and the cushion is held at your line, before payoff. |
| 94 | key:beat | The proof: a tight paycheck, and the safety net covers it. |
| 95 | key:screen ⚠️ | /progress |
| 95 | key:beat | The payoff: the ring, the curve, the debt-free date. |
| 101 | key:beat | The triumph: a debt one tap from zero. The capture driver confirms it, and the celebration is real. |

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
| 139 | var:targetName ⚠️ | your savings |
| 139 | var:targetName ⚠️ | your debt |
| 328 | key:provider ⚠️ | BNPL |
| 364 | var:AFFORD_PREVIEW_ID ⚠️ | __afford_preview__ |
| 396 | var:coverFromSavings ⚠️ | coverFromSavings |
| 564 | key:title | Save fast |
| 564 | key:detail | Funds before debt — pauses most of your extra debt payoff while you save. |
| 570 | key:title | Balanced |
| 570 | key:detail | A lighter set-aside — eases off your debt payoff a little, takes longer. |
| 575 | key:title | Keep debt first |
| 575 | key:detail | Save whatever’s spare after debt — no hit to your debt-free date, but no firm date. |

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

### `apps/rn/src/store/onboardingFinish.ts`

| line | origin | string |
|---|---|---|
| 23 | key:body | That's your target — stay the course. Tap below to see exactly what to do with your next paycheck. |
| 29 | key:body | Here's what it has to cover, and what's left after. Add a debt any time and you'll get a debt-free date too. |
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
| 161 | key:portfolioMaxProgress ⚠️ | __portfolio__ |
| 205 | other ⚠️ | expenseReserve |

### `apps/rn/src/store/paywallLead.ts`

| line | origin | string |
|---|---|---|
| 53 | key:offer ⚠️ | Recovery Plan is the guided catch-up for a cycle like this one. |
| 63 | key:offer ⚠️ | Premium plots it across your next six paydays, and marks where it dips below your line. |

### `apps/rn/src/store/persistence.ts`

| line | origin | string |
|---|---|---|
| 28 | call:reportError ⚠️ | bootstrapPersistence called with a SANDBOX store — refusing |

### `apps/rn/src/store/planSelectors.ts`

| line | origin | string |
|---|---|---|
| 120 | other ⚠️ | Unable to estimate |
| 271 | key:title | Overdue |
| 272 | key:title | Due this week |
| 273 | key:title | Due next week |
| 274 | key:title | Later this cycle |
| 275 | key:title | Handled |
| 337 | key:label | to debt this paycheck |
| 341 | key:label | to your goals |
| 342 | key:label | cushion this paycheck |
| 354 | var:cushionStatus ⚠️ | cushionStatus |

### `apps/rn/src/store/sandboxScenarios.ts`

| line | origin | string |
|---|---|---|
| 75 | key:clear ⚠️ | A clear payday |
| 76 | key:tight ⚠️ | A tight payday |
| 78 | key:'at-risk' ⚠️ | A very tight payday |

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
| 108 | key:body | Every payday I keep a cushion back for you, before anything extra goes to your debt. |
| 113 | key:title | Where this paycheck went |
| 113 | key:body | After your expenses and minimums, this is what was left — held back as your cushion and safety net, or sent to your debt. |
| 119 | key:title | Your line |
| 120 | key:body | This is the least you want to keep. Open it and move the line — the whole plan re-solves around it. |
| 123 | key:coach ⚠️ | Drag the line, then Save — your plan re-solves around it. |
| 130 | key:title | A little extra, at first |
| 139 | key:body | While I am still learning your expenses I hold a bit more back. Tell me your expenses are all in and I hold less — and if a surprise proves otherwise, I put the net straight back. |
| 149 | key:title | When it won't stretch |
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
| 46 | alert | Not now |
| 52 | var:message ⚠️ | Discard your changes? |
| 57 | alert | Discard changes? |
| 58 | alert | Keep editing |
| 59 | alert | Discard |

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

### `apps/rn/src/utils/share-card.ts`

| line | origin | string |
|---|---|---|
| 12 | other ⚠️ | Share your debt-free win |
| 15 | key:mimeType ⚠️ | image/png |

### `apps/rn/src/widget/snapshot.ts`

| line | origin | string |
|---|---|---|
| 59 | return | This paycheck looks clear — your cushion holds. |
| 81 | var:debtFreeDate ⚠️ | Debt-free! |

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
| 48 | key:required ⚠️ | Required |
| 50 | key:spokenFor ⚠️ | Spoken for |
| 52 | key:flexible ⚠️ | Flexible |
| 60 | var:CUSHION_LABEL ⚠️ | Cushion |
| 67 | var:SAFETY_NET_LABEL ⚠️ | Safety net |
| 75 | var:EMERGENCY_FUND_NOUN ⚠️ | your emergency fund |
| 83 | var:EVERYDAY_SPENDING_LABEL ⚠️ | Everyday spending |
| 111 | key:headline | Private by design |
| 113 | key:body | your financial data stays on this device |
| 115 | key:noSelling ⚠️ | you’ll never be sold more debt |
| 117 | key:short ⚠️ | Your money stays on your device. |
| 121 | key:clear ⚠️ | Clear |
| 122 | key:tight ⚠️ | Tight |
| 123 | key:"at-risk" ⚠️ | Very tight |

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
| 520 | key:label | Keep cash buffer |
| 540 | key:label | Reserved for upcoming bills |
| 586 | key:label | Held for an upcoming tight cycle |
| 593 | key:label | Safety net |
| 723 | key:label | Leftover cash |

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
| 120 | call:Intl.NumberFormat ⚠️ | en-US |
| 122 | key:currency ⚠️ | USD |

### `packages/core/guardian/buildGuardianBrief.ts`

| line | origin | string |
|---|---|---|
| 141 | call:Math.max ⚠️ | en-US |
| 153 | return | These figures are from a little while ago — a quick refresh keeps this exact. |
| 155 | return | I'm planning from the low side while I learn what your paychecks reliably clear. |
| 156 | return | I'm holding a small safety net while I get to know your expenses. |
| 196 | var:look ⚠️ | a little tight |
| 208 | key:title | A paycheck didn't land |
| 228 | key:title | Let's refresh your numbers |
| 230 | key:detail | Your paycheck, expenses, or balances are more than a few weeks old, so I can't tell you if you'll make it this paycheck with confidence. |
| 231 | key:safeMove | Update your numbers and I'll plan from where you actually are. |
| 246 | var:dest ⚠️ | toward your savings |
| 248 | var:dest ⚠️ | toward debt |
| 260 | key:title | This paycheck won't cover everything |
| 262 | key:detail | expenses and minimums |
| 263 | key:detail | — this one needs a plan. |
| 279 | key:title | Looks clear this paycheck |
| 279 | key:title | A little tight this paycheck |
| 279 | key:title | Tight this paycheck |
| 280 | key:detail | — a bit tight this one, so keep an eye on the essentials. |
| 294 | key:title | Very tight this paycheck |
| 294 | key:title | A little tight this paycheck |
| 299 | key:detail | at-risk |
| 299 | key:detail | a little under |
| 313 | key:title | Your line's held |
| 338 | var:target ⚠️ | your savings |
| 342 | key:title | Looks clear this paycheck |
| 346 | key:safeMove | to your goals |
| 346 | key:safeMove | to debt |
| 356 | key:title | Looks clear this paycheck |
| 358 | key:safeMove | your goals |
| 370 | var:safeMove ⚠️ | your debts |
| 377 | key:title | Looks clear this paycheck |

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
| 226 | var:CYCLE_HISTORY_STORAGE_KEY ⚠️ | debtPlanner.cycleHistory |

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
