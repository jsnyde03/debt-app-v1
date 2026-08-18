## Copy gated on a condition — is the gate the thing the copy claims?

The audit gate's proxy-gate sweep, as a list. For each row ask one question: **does the
condition actually establish what the words assert, or does it merely correlate with it?**

The live instance this was built from read exactly like a row here —
`prefill` → `"Add from scan"` / `"Add a debt"` — where `prefill` had stopped meaning "scanned"
the moment a second producer was added. Two audit passes and three green web specs missed it.

| file | condition | when true | when false |
|---|---|---|---|
| `apps/rn/src/app/(tabs)/index.tsx:546` | `intentRollback.kind === 'log-payment'` | "Payment logged — I updated your balance." | "Payday landed — I rolled your plan forward to this paycheck." |
| `apps/rn/src/app/(tabs)/money.tsx:353` | `strategy === 'snowball'` | "Smallest balance first — quick wins. Your debts are listed in payoff order." | "Highest APR first — least interest. Your debts are listed in payoff order." |
| `apps/rn/src/app/(tabs)/money.tsx:480` | `isBnpl` | "/mo" | "/mo" |
| `apps/rn/src/app/(tabs)/money.tsx:848` | `empty` | "Everyday spending reserve, nothing set up yet. Opens management." | — |
| `apps/rn/src/app/(tabs)/money.tsx:858` | `empty` | "Not set up" | — |
| `apps/rn/src/app/(tabs)/money.tsx:864` | `empty` | "Groceries, gas, fun money — reserve it each paycheck" | "Reserved each paycheck · tap to manage" |
| `apps/rn/src/app/(tabs)/money.tsx:914` | `funded` | "Funded" | — |
| `apps/rn/src/app/(tabs)/progress.tsx:150` | `reached.length` | — | "no milestones reached yet" |
| `apps/rn/src/app/(tabs)/progress.tsx:151` | `nextT` | — | "all milestones reached" |
| `apps/rn/src/app/(tabs)/progress.tsx:151` | `nextT === 100` | "debt-free" | — |
| `apps/rn/src/app/more.tsx:168` | `tipsReset` | "Tips will appear again as you go." | "Re-offer the one-line hints on hidden features." |
| `apps/rn/src/app/paywall.tsx:168` | `error instanceof Error` | — | "Something went wrong. Please try again." |
| `apps/rn/src/app/paywall.tsx:190` | `error instanceof Error` | — | "Something went wrong. Please try again." |
| `apps/rn/src/app/paywall.tsx:241` | `kind === 'lifetime'` | "You’re on Premium — Lifetime. Thanks for the support." | "You’re on Premium — thanks for the support." |
| `apps/rn/src/app/paywall.tsx:320` | `restoring` | "Restoring…" | "Restore purchases" |
| `apps/rn/src/components/AppLockGate.tsx:37` | `authing` | "Unlocking…" | "Unlock" |
| `apps/rn/src/components/entities/AmortizationView.tsx:67` | `amort.isFocus` | "— minimum + your extra" | "— the minimum" |
| `apps/rn/src/components/entities/DebtSheet.tsx:239` | `isEdit` | "Edit debt" | "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:239` | `convertingExpenseId` | "Add a debt" | "Add from scan" · "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:239` | `prefill` | "Add from scan" | "Add a debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:241` | `isEdit` | — | "Moving this from Expenses. Add the balance so it counts toward your debt-free date." |
| `apps/rn/src/components/entities/DebtSheet.tsx:243` | `convertingExpenseId` | "Moving this from Expenses. Add the balance so it counts toward your debt-free date." | "Review the scanned details, then add." · "A loan, credit card, or BNPL balance." |
| `apps/rn/src/components/entities/DebtSheet.tsx:245` | `prefill` | "Review the scanned details, then add." | "A loan, credit card, or BNPL balance." |
| `apps/rn/src/components/entities/DebtSheet.tsx:249` | `isEdit` | "Save" | "Add debt" |
| `apps/rn/src/components/entities/DebtSheet.tsx:296` | `type === 'bnpl'` | "Affirm — Sofa" | "Visa, Car Loan" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:84` | `isEdit` | "Edit expense" | "Add an expense" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:86` | `isEdit` | "Save" | "Add expense" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:92` | `trial` | "Amount now (0 for a free trial)" | "Amount" |
| `apps/rn/src/components/entities/ExpenseSheet.tsx:92` | `trial` | "e.g. 0" | "e.g. 850" |
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
| `apps/rn/src/components/plan/PlanHero.tsx:129` | `onEditPaycheck` | "Edit paycheck" | — |
| `apps/rn/src/components/plan/PlanHero.tsx:211` | `windfall > 0` | — | "Add extra income" |
| `apps/rn/src/components/plan/PlanHero.tsx:215` | `windfall > 0` | — | "Add extra income" |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:216` | `paid` | "Undo, mark unpaid" | "Mark paid" |
| `apps/rn/src/components/plan/RequiredActionsCard.tsx:219` | `paid` | "Undo" | "Paid" |
| `apps/rn/src/components/plan/SaveForItSheet.tsx:126` | `o.readyBy != null && o.paychecks != null` | — | "Saved after debt · no firm date" |
| `apps/rn/src/components/plan/ShareCard.tsx:51` | `data.amount != null` | — | "Paid off" |
| `apps/rn/src/components/plan/TutorialOverlay.tsx:427` | `hideProgress` | "Example money" | — |
| `apps/rn/src/components/plan/TutorialOverlay.tsx:451` | `isLast` | "Finish" | "Next" |
| `apps/rn/src/components/plan/WindfallSheet.tsx:80` | `isPremium && hasSplit` | "Confirm" | "Add" |
| `apps/rn/src/components/progress/VanquishedArchive.tsx:60` | `d.amount != null` | — | "Cleared" |
| `apps/rn/src/components/progress/VanquishedArchive.tsx:65` | `d.amount != null` | — | "Cleared" |
| `apps/rn/src/components/ui/DateField.tsx:94` | `value` | — | "Select a date" |
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

