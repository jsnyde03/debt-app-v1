# L6 — the unclassified props

**Triaged: 199 of 199 prop names / 358 of 358 strings. Nothing left in "unsure".**

The input slice lists prop NAMES only, and Part 1 requires an example string per name, so the strings
were read from the artifact the slice was cut from — `docs/audits/strings-inventory.json`, filtered to
`bucket === 'unclassified'` (358 rows, 199 origins — matches the slice exactly). Fifteen source files
were opened to resolve the genuinely ambiguous ones; every "confirmed in source" note below means the
call site was read, and every claim not so marked is flagged as a HYPOTHESIS.

**How I leaned.** Toward COPY, per the brief. Three classes were decided that way rather than on
certainty: (a) strings that only reach a user through a `throw` I did not trace to a render
(`call:validateDayOfTheMonth`); (b) copy in modules I found to be dead (`projectForecast`) — dead copy is
still copy, and reviewing it costs a minute while excluding it means it ships unreviewed if the module
is ever revived; (c) QA/sample surfaces whose strings mirror the shipped shape (`key:line`,
`call:99%',].join`). The only things I sent to MACHINERY are strings I could name a non-human consumer
for: an `Intl` argument, a native module registry, a route, a storage key, an SF Symbol, a CSS token.

⚠️ **Two props are MIXED, and they are the dangerous ones.** `other` and `prop:onPress` each carry both
kinds at different sites. Neither can be fixed by adding a name to a list — see Part 3.

---

## Part 1 — the classification table

One row per prop name, all 199. `MIXED` rows are called out in bold in the "why" column.

| prop | verdict | why | example string |
|---|---|---|---|
| `call:99%', ].join` | COPY | The web scan stub's SAMPLE statement — parsed into the prefill form a web/demo user sees. Leaned COPY; see L6-2. | `Chase Freedom Unlimited` |
| `call:AccessibilityInfo.addEventListener` | MACHINERY | RN native event names passed to `addEventListener`. | `reduceMotionChanged` |
| `call:Keyboard.addListener` | MACHINERY | RN native event names passed to `addEventListener`. | `keyboardDidShow` |
| `call:NumberFormat("en-US", {         style: "currency",         currency: "USD",         minimumFractionDigits: 0,         maximumFractionDigits: 2,     }).format` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:NumberFormat("en-US", {         style: "currency",         currency: "USD",     }).format` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:amount).toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:announce` | COPY | VoiceOver screen announcements — `announce()`. | `Cushion forecast` |
| `call:console.warn` | MACHINERY | Developer console warning; not a user surface. | `Replay and the tutorial e2e depend on it being deterministic; check for a clock or rando…` |
| `call:covered).toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:d.toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:date.toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:drivers.push` | COPY | Cash-forecast driver sentence a user would read. ⚠ dead code — see L6-4. | `Debt minimum obligations remain elevated` |
| `call:floor(abs).toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:fullAmount.toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:isFinite(n) ? n : 0)).toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:max(0, n)).toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:month).toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:probeCoachMark` | MACHINERY | Coach-mark QA probe trace tokens (`4.1.4c`), behind `qaEnabled()`. | `NULL` |
| `call:reportError` | MACHINERY | Internal invariant diagnostics — `reportError` sinks to `console.warn` only (read `utils/reportError.ts:18`). | `startLiveActivitySync called with a SANDBOX store — refusing` |
| `call:require` | MACHINERY | Module / asset specifiers for `require`. | `../../assets/sounds/debt-free-chime.wav` |
| `call:requireNativeModule` | MACHINERY | Expo native module + view-manager registry names. | `LiveActivity` |
| `call:requireNativeViewManager` | MACHINERY | Expo native module + view-manager registry names. | `KeyCommands` |
| `call:round(n).toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:round(v)).toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `call:router.navigate` | MACHINERY | Route paths passed to the expo-router imperative API. | `/money` |
| `call:router.push` | MACHINERY | Route paths passed to the expo-router imperative API. | `/paywall` |
| `call:router.replace` | MACHINERY | Route paths passed to the expo-router imperative API. | `/onboarding` |
| `call:schedule` | COPY | Local-notification title + body. | `Paycheck tomorrow` |
| `call:shareDebtCard` | COPY | Share-sheet title shown in the iOS share UI. | `Share your win` |
| `call:useEffect` | MACHINERY | Coach-mark QA probe trace tokens (`4.1.4c`), behind `qaEnabled()`. | `DREW` |
| `call:useStore` | COPY | Guardian VoiceOver acknowledgement text (`index.tsx:838`, confirmed in source). | `A surprise bill came up — your Guardian has restored your safety net for now.` |
| `call:useSuppressCoachMarks` | MACHINERY | Coach-mark suppression ids. | `today:celebration` |
| `call:validateDayOfTheMonth` | COPY | Subject label interpolated into `"<label> must be between 1 and 31"`. HYPOTHESIS: reaches the user only if the throw is caught and rendered — not confirmed. | `First semi-monthly pay day` |
| `call:value.toLocaleString` | MACHINERY | The `"en-US"` locale argument to `Intl`/`toLocaleString`. Never rendered. | `en-US` |
| `key:'account-balance-wallet'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `wallet.pass.fill` |
| `key:'add-circle-outline'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `plus.circle` |
| `key:'annually'` | COPY | Pay-frequency labels and suffixes the user reads (`Monthly`, `/mo`, `Every 2 weeks`). | `/yr` |
| `key:'at-risk'` | COPY | Guardian-state labels: chart legend (`Crunch`/`Tight`/`Clear`) and sandbox scenario names. | `Crunch` |
| `key:'auto-graph'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `chart.xyaxis.line` |
| `key:'biweekly'` | COPY | Pay-frequency labels and suffixes the user reads (`Monthly`, `/mo`, `Every 2 weeks`). | `/2 wks` |
| `key:'check-circle'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `checkmark.circle.fill` |
| `key:'chevron-left'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `chevron.left` |
| `key:'chevron-right'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `chevron.right` |
| `key:'error-outline'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `exclamationmark.triangle` |
| `key:'expand-more'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `chevron.down` |
| `key:'gpp-bad'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `xmark.shield.fill` |
| `key:'gpp-good'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `checkmark.shield.fill` |
| `key:'gpp-maybe'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `exclamationmark.shield.fill` |
| `key:'monthly'` | COPY | Pay-frequency labels and suffixes the user reads (`Monthly`, `/mo`, `Every 2 weeks`). | `/mo` |
| `key:'one-time'` | COPY | Pay-frequency labels and suffixes the user reads (`Monthly`, `/mo`, `Every 2 weeks`). | `One-time` |
| `key:'per-paycheck'` | COPY | Pay-frequency labels and suffixes the user reads (`Monthly`, `/mo`, `Every 2 weeks`). | `/check` |
| `key:'quarterly'` | COPY | Pay-frequency labels and suffixes the user reads (`Monthly`, `/mo`, `Every 2 weeks`). | `/qtr` |
| `key:'shopping-cart'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `cart.fill` |
| `key:'tab-money'` | MACHINERY | Route paths bound to hardware key commands. | `/money` |
| `key:'tab-progress'` | MACHINERY | Route paths bound to hardware key commands. | `/progress` |
| `key:'task-alt'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `checkmark.circle` |
| `key:'trending-down'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `chart.line.downtrend.xyaxis` |
| `key:'trending-up'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `chart.line.uptrend.xyaxis` |
| `key:'verified-user'` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `checkmark.seal.fill` |
| `key:'weekly'` | COPY | Pay-frequency labels and suffixes the user reads (`Monthly`, `/mo`, `Every 2 weeks`). | `/wk` |
| `key:afternoon` | COPY | Time-of-day greetings on Today. | `Good afternoon` |
| `key:amountPositive` | COPY | Form validation messages shown under the field. | `Enter an amount greater than 0.` |
| `key:assignment` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `doc.text.fill` |
| `key:balanceRequired` | COPY | Form validation messages shown under the field. | `Enter the current balance.` |
| `key:bills` | COPY | Money-tab section explainers. | `Ongoing costs that don’t end. Reserved from every paycheck before anything goes to debt.` |
| `key:biweekly` | COPY | Pay-frequency labels and suffixes the user reads (`Monthly`, `/mo`, `Every 2 weeks`). | `every 2 weeks` |
| `key:boxShadow` | MACHINERY | CSS box-shadow strings in the elevation tokens. | `0px 8px 22px rgba(16, 38, 84, 0.12), 0px 1.5px 3px rgba(16, 38, 84, 0.10)` |
| `key:buttonTitle` | COPY | Notification action-button titles. | `Run my plan` |
| `key:cancel` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `xmark.circle.fill` |
| `key:celebration` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `party.popper.fill` |
| `key:clause` | COPY | AddObligationSheet type explainers and their example lists. | `Something with a balance you're paying down. It ends.` |
| `key:clear` | COPY | Guardian-state labels: chart legend (`Crunch`/`Tight`/`Clear`) and sandbox scenario names. | `Clear` |
| `key:coach` | COPY | Walkthrough / tutorial beat copy, including the per-audience premium hand-back. | `Drag the line, then Save — your plan re-solves around it.` |
| `key:currency` | MACHINERY | `Intl` currency-code option. | `USD` |
| `key:cycle` | COPY | Paycheck-form field labels. | `Pay cycle` |
| `key:debts` | COPY | Money-tab section explainers. | `Balances you’re paying down. These have an end date, and they set your debt-free date.` |
| `key:discretionary` | COPY | Obligation category labels shown in the picker and on rows. | `Discretionary` |
| `key:display` | MACHINERY | Font-family tokens (`System`, `Menlo-Regular`). | `System` |
| `key:errors` | COPY | CSV-import error shown to the user. | `CSV must include a header row and at least one debt row.` |
| `key:estimatedDebtFreeDate` | COPY | The `Unable to estimate` fallback shown wherever a debt-free date would go. | `Unable to estimate` |
| `key:evening` | COPY | Time-of-day greetings on Today. | `Good evening` |
| `key:examples` | COPY | AddObligationSheet type explainers and their example lists. | `Credit card · Car loan · Mortgage · Buy-now-pay-later` |
| `key:fallbackLabel` | COPY | Face ID / passcode prompt strings shown by iOS. | `Use passcode` |
| `key:free` | COPY | Walkthrough / tutorial beat copy, including the per-audience premium hand-back. | `That was example money — premium is what did the holding: your cushion kept at your line…` |
| `key:goals` | COPY | Money-tab section explainers. | `Money you’re setting aside — saved for, not owed.` |
| `key:healing` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `bandage.fill` |
| `key:history` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `clock.arrow.circlepath` |
| `key:housing` | COPY | Obligation category labels shown in the picker and on rows. | `Housing` |
| `key:insurance` | COPY | Obligation category labels shown in the picker and on rows. | `Insurance` |
| `key:leanAboveTypical` | COPY | Form validation messages shown under the field. | `Your lean paycheck should be no more than a typical one.` |
| `key:leanRequired` | COPY | Form validation messages shown under the field. | `Enter the amount you can count on.` |
| `key:line` | COPY | Live Activity body lines (QA samples that mirror the shipped shape). | `Cushion safe · $420 free to deploy` |
| `key:lock` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `lock.fill` |
| `key:medical` | COPY | Obligation category labels shown in the picker and on rows. | `Medical` |
| `key:mimeType` | MACHINERY | MIME type for the share card. | `image/png` |
| `key:minimumRequired` | COPY | Form validation messages shown under the field. | `Enter the minimum payment.` |
| `key:mono` | MACHINERY | Font-family tokens (`System`, `Menlo-Regular`). | `Menlo-Regular` |
| `key:morning` | COPY | Time-of-day greetings on Today. | `Good morning` |
| `key:nameRequired` | COPY | Form validation messages shown under the field. | `Enter a name.` |
| `key:next` | COPY | Paycheck-form field labels. | `Next paycheck` |
| `key:other` | COPY | Obligation category labels shown in the picker and on rows. | `Other` |
| `key:placeholder` | COPY | Input placeholders (`e.g. 1500`) — `placeholder` is already COPY as a JSX prop; the object-key form is not. | `e.g. 1500` |
| `key:portfolioMaxProgress` | MACHINERY | Sentinel id (`__portfolio__`), never rendered. | `__portfolio__` |
| `key:premium` | COPY | Walkthrough / tutorial beat copy, including the per-audience premium hand-back. | `That was example money — your Guardian does exactly this with every paycheck you add, al…` |
| `key:projectedDebtFreeDate` | COPY | The `Unable to estimate` fallback shown wherever a debt-free date would go. | `Unable to estimate` |
| `key:promptMessage` | COPY | Face ID / passcode prompt strings shown by iOS. | `Unlock Debt Planner` |
| `key:provider` | COPY | BNPL provider fallback name, interpolated into `"Heads up — 3 BNPL payments…"` (confirmed in source). | `BNPL` |
| `key:recoveryTrend` | COPY | Forecast trend sentences. ⚠ dead code and off-voice — see L6-4/L6-5. | `Recovery is not currently projected within the visible forecast window.` |
| `key:savings` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `banknote.fill` |
| `key:screen` | MACHINERY | Route paths for the demo run script. | `/money` |
| `key:seam` | MACHINERY | Diagnostic tags on `reportError` payloads. | `liveActivitySync` |
| `key:search` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `magnifyingglass` |
| `key:sf` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `chart.line.uptrend.xyaxis` |
| `key:shield` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `shield.fill` |
| `key:star` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `star.fill` |
| `key:sub` | COPY | Row sub-label (`reserved for upcoming bills`). | `reserved for upcoming bills` |
| `key:subscriptions` | COPY | Obligation category labels shown in the picker and on rows. | `Subscriptions` |
| `key:subsystem` | MACHINERY | Diagnostic tags on `reportError` payloads. | `liveActivity` |
| `key:systemIcon` | MACHINERY | SF Symbol name on a list row. | `dollarsign.circle` |
| `key:tight` | COPY | Guardian-state labels: chart legend (`Crunch`/`Tight`/`Clear`) and sandbox scenario names. | `Tight` |
| `key:type` | MACHINERY | iOS context-menu item kind (`IMAGE_SYSTEM`). | `IMAGE_SYSTEM` |
| `key:update` | MACHINERY | SF Symbol names in the Material→SF icon map (`theme/icons.ts`). | `arrow.clockwise` |
| `key:utilities` | COPY | Obligation category labels shown in the picker and on rows. | `Utilities` |
| `other` | MIXED | ⚠ 30 strings with NO named context: mostly routes, storage keys and property-name literals, but it also carries `Unable to estimate`, `Share your debt-free win`, `Semi-monthly pay days must be different.` and `Unsupported pay cycle`. Cannot be fixed by a blanket rule. | `(tabs)` |
| `prop:amount` | COPY | The `amount` slot on a list row can hold a WORD, not just a number (`Funded`). | `Funded` |
| `prop:amountSuffix` | COPY | Unit suffix rendered next to the amount. | `/mo` |
| `prop:error` | COPY | Inline field error. `errorText` is COPY; `error` was never listed. | `More than the balance — this will clear it to $0.` |
| `prop:getComponent` | MACHINERY | Lazy-import module paths for the web chart fallbacks. | `./AllocationBarChart` |
| `prop:hint` | COPY | Explanatory hint under a control. `accessibilityHint` is COPY; bare `hint` was never listed. | `Groceries, gas, fun money — reserved every paycheck.` |
| `prop:meta` | COPY | Row meta line. ⚠ `key:meta` IS in COPY_ORIGINS — the JSX-attribute form was missed. See L6-1. | `· Variable` |
| `prop:onBack` | MACHINERY | Route paths inside navigation handlers. | `/onboarding` |
| `prop:onDemo` | MACHINERY | Route paths inside navigation handlers. | `/demo?from=welcome` |
| `prop:onManageEveryday` | MACHINERY | Route paths inside navigation handlers. | `/living-expenses` |
| `prop:onPress` | MIXED | ⚠ 10 of 12 are route paths, but `LiveActivityQA.tsx:70` puts real `Alert.alert` copy inside an `onPress`. A blanket MACHINERY rule would hide it. | `/living-expenses` |
| `prop:onSeeForecast` | MACHINERY | Route paths inside navigation handlers. | `/cushion-forecast` |
| `prop:options` | COPY | Segmented-control and tab option labels — `Today` / `Progress` / `Money` / `Snowball` / `Avalanche`. 20 strings, all read. | `Today` |
| `prop:previewConfig` | MACHINERY | iOS context-menu preview config token. | `DEFAULT` |
| `prop:rel` | MACHINERY | HTML anchor attributes on the web CTA. | `noopener noreferrer` |
| `prop:sub` | COPY | Guardian scorecard sub-lines. | `said you'd hold, you dipped below` |
| `prop:target` | MACHINERY | HTML anchor attributes on the web CTA. | `_blank` |
| `var:AFFORD_PREVIEW_ID` | MACHINERY | Internal sentinel id. | `__afford_preview__` |
| `var:AMT` | MACHINERY | Statement-parsing regex. | `[^\n\d]{0,30}\$?\s*([\d,]+\.\d{2})` |
| `var:APP_STORE_URL` | MACHINERY | Store URLs / deep-link schemes. | `https://apps.apple.com/us/app/paycheck-debt-planner/id6773201250` |
| `var:BILL_CATEGORY_ORDER` | MACHINERY | Category enum ids (lowercase, ordering/classification only). | `subscriptions` |
| `var:CYCLE_HISTORY_STORAGE_KEY` | MACHINERY | Persistence keys / app-group ids / widget kind. | `debtPlanner.cycleHistory` |
| `var:DEBT_RC_IOS_KEY` | MACHINERY | RevenueCat public SDK key. See L6-7. | `appl_XUWODZnbbJFPbdMTgBTyKNAGGyp` |
| `var:DEFERRABLE_CATEGORIES` | MACHINERY | Category enum ids (lowercase, ordering/classification only). | `subscriptions` |
| `var:EXAMPLE_MONEY` | COPY | The "Example money" watermark shown over demo surfaces. | `Example money` |
| `var:FREEDOM_SCHEME_URL` | MACHINERY | Store URLs / deep-link schemes. | `ffp://` |
| `var:FREEDOM_STORE_URL` | MACHINERY | Store URLs / deep-link schemes. | `https://apps.apple.com/us/app/freedom-date-fire-planner/id6789297671` |
| `var:KEY` | MACHINERY | Persistence keys / app-group ids / widget kind. | `debtPlanner.rnStore` |
| `var:LIFETIME_SUBNOTE` | COPY | Paywall lifetime sub-note (a purchase claim). | `Pay once — all today’s Premium, forever` |
| `var:LIVE_ACTIVITY_APP_GROUP` | MACHINERY | Persistence keys / app-group ids / widget kind. | `group.com.jasonsnyder.debtplanner` |
| `var:MANAGE_SUBSCRIPTION_URL` | MACHINERY | Store URLs / deep-link schemes. | `https://apps.apple.com/account/subscriptions` |
| `var:PAYCHECK_LEAN_HELP` | COPY | Help text under the lean-paycheck field. | `Your plan runs on this floor, so a lighter paycheck never breaks it.` |
| `var:PAYDAY_ACTIVITY_DEEPLINK` | MACHINERY | Store URLs / deep-link schemes. | `debtplannerrn://` |
| `var:PRIVACY_POLICY_URL` | MACHINERY | Store URLs / deep-link schemes. | `https://jsnyde03.github.io/debt-planner-site/privacy.html` |
| `var:QUARANTINE_PREFIX` | MACHINERY | Persistence keys / app-group ids / widget kind. | `quarantine.` |
| `var:SUPPORT_URL` | MACHINERY | Store URLs / deep-link schemes. | `https://jsnyde03.github.io/debt-planner-site/support.html` |
| `var:TERMS_OF_USE_URL` | MACHINERY | Store URLs / deep-link schemes. | `https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` |
| `var:TUTORIAL_WRITABLE_PREFS` | MACHINERY | Persistence keys / app-group ids / widget kind. | `tutorialStep` |
| `var:WIDGET_APP_GROUP` | MACHINERY | Persistence keys / app-group ids / widget kind. | `group.com.jasonsnyder.debtplanner` |
| `var:WIDGET_KIND` | MACHINERY | Persistence keys / app-group ids / widget kind. | `DebtWidget` |
| `var:WIDGET_SNAPSHOT_KEY` | MACHINERY | Persistence keys / app-group ids / widget kind. | `debtSnapshot` |
| `var:actualUnpayable` | COPY | The `Unable to estimate` fallback. | `Unable to estimate` |
| `var:appleTargets` | MACHINERY | Native module specifier. | `@bacons/apple-targets` |
| `var:attestLabel` | COPY | Guardian bill-attestation prompt and its confirmed state. | `Bills confirmed — holding a smaller safety net. Undo` |
| `var:beatA11y` | COPY | VoiceOver suffix on the vanquished-debt beat. | `— paid off` |
| `var:canEstimate` | COPY | The `Unable to estimate` fallback. | `Unable to estimate` |
| `var:caption` | COPY | Cash-flow section captions. | `A cycle runs short ahead — plan for it.` |
| `var:captionText` | COPY | Row caption (`estimated · tap to verify`). | `estimated · tap to verify` |
| `var:coverFromSavings` | MACHINERY | Action / status discriminant strings equal to their own identifier. | `coverFromSavings` |
| `var:ctaLabel` | COPY | Paywall CTA label. | `Starting…` |
| `var:cushionStatus` | MACHINERY | Action / status discriminant strings equal to their own identifier. | `cushionStatus` |
| `var:debtFreeDate` | COPY | Widget headline when the user is debt-free. | `Debt-free!` |
| `var:dest` | COPY | Guardian sentence fragments spliced into brief prose. | `toward your savings` |
| `var:dominantError` | MACHINERY | Action / status discriminant strings equal to their own identifier. | `dominantError` |
| `var:effName` | COPY | Fallback name for an unnamed savings goal / purchase in affordability copy. | `Savings goal` |
| `var:freeInvite` | COPY | Free-tier premium invitations on the Guardian card — both make product promises. | `Premium builds you a catch-up plan — what to cover first, and what (if anything) can saf…` |
| `var:goalLabel` | COPY | Guardian sentence fragments spliced into brief prose. | `this purchase` |
| `var:href` | MACHINERY | Store URLs / deep-link schemes. | `/demo?capture=1` |
| `var:line` | COPY | Live Activity headline. | `Cushion safe` |
| `var:look` | COPY | Guardian sentence fragments spliced into brief prose. | `a little tight` |
| `var:lowCushionDrivers` | COPY | Forecast driver sentences. ⚠ dead code and off-voice — see L6-4/L6-5. | `Projected cushion remains below target` |
| `var:message` | COPY | Confirm-dialog message. | `Discard your changes?` |
| `var:minUnpayable` | COPY | The `Unable to estimate` fallback. | `Unable to estimate` |
| `var:minimumsDateLabel` | COPY | Chart axis label when minimums never pay off (`Never`). | `Never` |
| `var:provider` | COPY | BNPL provider fallback name, interpolated into `"Heads up — 3 BNPL payments…"` (confirmed in source). | `BNPL` |
| `var:purchaseName` | COPY | Fallback name for an unnamed savings goal / purchase in affordability copy. | `Purchase` |
| `var:recalibration` | COPY | Guardian self-calibration lines (first person). | `I've under-warned a few times — I've tightened my read.` |
| `var:requiredSub` | COPY | Payday capture summary sub-line. | `All confirmed paid` |
| `var:safeMove` | COPY | Guardian sentence fragments spliced into brief prose. | `your debts` |
| `var:statusLabel` | COPY | Plan hero status line. | `Overdue payments need attention` |
| `var:target` | COPY | Guardian sentence fragments spliced into brief prose. | `your savings` |
| `var:targetName` | COPY | Guardian sentence fragments spliced into brief prose. | `your savings` |
| `var:title` | COPY | Section / notification titles. | `This cycle` |
| `var:verb` | COPY | Action verb on a recommended action (`Mark Paid` / `Mark Saved`). | `Mark Paid` |
| `var:verdict` | MACHINERY | Coach-mark QA probe trace tokens (`4.1.4c`), behind `qaEnabled()`. | `DREW` |
---

## Part 2 — findings

### L6-1 · The gate's two origin lists are never consulted on the JSX-attribute path
- **Severity:** major
- **Where:** `scripts/strings-inventory.ts` rule ② (~line 316) — `const bucket = COPY_PROPS.has(prop) ? 'copy' : 'unclassified'`. Symptom: `prop:meta` = `"Counts toward reserve"`, `"Suggested this paycheck"`, `"Completed with outside money"` (8 strings) sit in `unclassified` while `key:meta` is already in `COPY_ORIGINS`; and `prop:onPress`, `prop:onBack`, `prop:onDemo`, `prop:onSeeForecast`, `prop:getComponent`, `prop:previewConfig` are all **already in `TECHNICAL_ORIGINS`** and still report as unclassified (23 strings).
- **What:** JSX attributes are bucketed only against `COPY_PROPS`/`TECHNICAL_PROPS`; the `COPY_ORIGINS`/`TECHNICAL_ORIGINS` sets apply solely to rule ④'s sweep, so a decision already recorded in one list has no effect on a string that arrives as a JSX prop.
- **Confidence:** high — read both code paths.
- **Suggested fix:** in rule ②, fall through to `COPY_ORIGINS.has('prop:'+prop) ? 'copy' : TECHNICAL_ORIGINS.has('prop:'+prop) ? 'technical' : 'unclassified'`; that alone resolves 31 of the 358 strings with no new judgement.

### L6-2 · A real bank's product name and a fabricated statement ship in the web demo
- **Severity:** major
- **Where:** `apps/rn/src/lib/scan.web.ts:9-16` — `'Chase Freedom Unlimited'`, `'Account ending 4821'`, `'New Balance $2,431.09'`, `'Minimum Payment Due $56.00'`, `'Payment Due Date August 22, 2026'`, `'Purchase APR 24.99%'`.
- **What:** the web scan stub returns a fabricated Chase credit-card statement which is parsed into the prefill form the user confirms, so a named third party's product appears as sample account data on the marketing embed and demo surfaces.
- **Confidence:** high that the strings reach the prefill UI (read `scan.web.ts` and its contract); medium on whether the embed exposes the scan entry point in v1.7.
- **Suggested fix:** rename the sample to a neutral issuer (`"Sample Card"` / `"Everyday Rewards Card"`) — the parse path does not depend on the issuer being real.

### L6-3 · `QA_TOOLS` is still `true`, so More ships the Live Activity QA card
- **Severity:** blocker (for App Store submission, not for TestFlight)
- **Where:** `apps/rn/src/config/qa.ts:9` `export const QA_TOOLS = true;` → `qaEnabled()` → `apps/rn/src/app/more.tsx:300` gates the section containing `<LiveActivityQA />`, `<CoachMarkProbeReadout />`, `<ReduceMotionProbeReadout />`. Strings: `"Live Activity QA"`, `"Simulate 'Payday landed'"`, `"Rolled the cycle — check the Today tab for the Undo card."`, `"Cushion safe · $420 free to deploy"`.
- **What:** the QA card is correctly gated (verified — `more.tsx:300` really does wrap it), but the gate is currently open, and one of its buttons calls `applyPaydayLandedIntent()` against the **real** store.
- **Confidence:** high on the flag value and the wiring; the file's own comment says "FLIP TO `false` BEFORE THE APP STORE SUBMISSION (Phase 6)", so this may simply be un-actioned rather than unknown.
- **Suggested fix:** flip `QA_TOOLS` to `false` in the v1.7 submission build, and make the wording gate's coverage count exclude `qaEnabled()`-only surfaces so their strings stop competing with shipped copy.

### L6-4 · `projectForecast` is dead code and contributes 8 copy strings to the gate's input
- **Severity:** minor
- **Where:** `packages/core/forecast/projectForecast.ts` — `key:recoveryTrend` (3), `var:lowCushionDrivers` (3), `call:drivers.push` (1), plus a required-payments driver.
- **What:** no file outside `packages/core/testing/` imports it (`analysisSelectors.ts:146` calls it "the old monthly `projectForecast`"); `buildSmartInsights.ts` is the same shape, explicitly scrapped 2026-07-22 and still present.
- **Confidence:** high — grepped both module paths across `apps/rn/src` and `packages/core`.
- **Suggested fix:** delete both modules (or move them under `testing/`) so the inventory stops presenting unreachable copy as review work.

### L6-5 · The forecast copy is in a different voice from the rest of the app
- **Severity:** minor today (dead), major the moment it is revived
- **Where:** `projectForecast.ts:63-93` — `"Recovery is not currently projected within the visible forecast window."`, `"Cash pressure is projected to gradually improve across upcoming cycles."`, `"Available cushion stays under the recommended safety threshold"`, `"Debt minimum obligations remain elevated"`.
- **What:** clinical passive-voice analyst register, against a house voice that elsewhere says `"A cycle runs short ahead — plan for it."` and `"Cushion gets tight in an upcoming cycle."` for the same three states.
- **Confidence:** high on the divergence; both sets appear in the table above.
- **Suggested fix:** if these modules are kept, rewrite against `CashFlowSection`'s captions, which are the reviewed version of the same three states.

### L6-6 · `"Unable to estimate"` is written in five non-test files with no single authority
- **Severity:** minor
- **Where:** `apps/rn/src/store/analysisSelectors.ts` (×2), `store/drift.ts`, `store/planSelectors.ts`, `packages/core/debt/computeInterestSaved.ts` (×2), `packages/core/debt/projectDebtPayoff.ts` (×2) — 13 occurrences including tests.
- **What:** a user-facing fallback duplicated across the debt/analysis boundary, and it is invisible to the duplicate gate **twice over**: unclassified strings never reach that list, and at 18 characters it also sits below `DUP_MIN_LEN = 20`.
- **Confidence:** high.
- **Suggested fix:** extract one exported constant in `packages/core`, and note in the L2 slice that the duplicate gate's floor excludes this string by two characters.

### L6-7 · The RevenueCat iOS key is a source literal
- **Severity:** polish
- **Where:** `apps/rn/src/premium/purchasesClient.ts:25` — `var:DEBT_RC_IOS_KEY = 'appl_XUWODZnbbJFPbdMTgBTyKNAGGyp'`.
- **What:** this is a publishable SDK key by RevenueCat's design, so it is not a leak; flagged only because an audit that walks every string should say so out loud rather than leave it unremarked.
- **Confidence:** high that it is the public key class; low that any action is warranted.
- **Suggested fix:** none needed — add a one-line comment saying it is the public key so the next reader does not re-open it.

### L6-8 · "Funded" is printed twice on the same goal row
- **Severity:** polish
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:914-916` — `amount={funded ? 'Funded' : …}` and `badges={funded ? <Pill label="Funded" tone="paid" /> : undefined}`.
- **What:** when a goal is fully funded the row shows the word `Funded` in the amount slot and again in the pill immediately beside it.
- **Confidence:** high — read the JSX.
- **Suggested fix:** keep the pill, and put the amount slot back to the target figure (or `$0 left`).

### L6-9 · An informational message is delivered through the `error` prop
- **Severity:** polish
- **Where:** `apps/rn/src/components/entities/LogPaymentSheet.tsx:44` — `error="More than the balance — this will clear it to $0."`
- **What:** the string describes a legitimate outcome, not a failure, but rides the error channel and so presumably renders in the error treatment.
- **Confidence:** medium — HYPOTHESIS, I did not read how the component renders `error`.
- **Suggested fix:** if the component has a neutral/warning tone, use it; otherwise reword so the error styling is not contradicted by the words.

### L6-10 · Four origin labels contain raw source text and cannot be used as list keys
- **Severity:** minor
- **Where:** `` call:99%',\n].join `` and the three `call:NumberFormat("en-US", { style: "currency", … }).format` labels.
- **What:** `originOf()` builds the label from `expression.getText()`, so when the callee is a multi-line expression the label embeds whitespace and argument values — meaning any reformat of `formatCurrency.ts` silently mints a new "unclassified" prop.
- **Confidence:** high — read `originOf()` in `strings-inventory.ts`.
- **Suggested fix:** normalise the callee before labelling (collapse whitespace, keep the last identifier segment) so `.format` / `.toLocaleString` collapse to one stable key each — that folds 17 origins into 2.

---

## Part 3 — the recommendation

**Add to the technical exclusion list — 104 prop names / 141 strings.** They fall into eight families, and
I would add them by family rather than one at a time:

1. **`Intl` / `toLocaleString` locale + currency arguments** — the 14 `call:*` locale origins plus `key:currency`. 18 strings, every one of them `"en-US"` or `"USD"`. *(Do L6-10 first and this becomes 3 keys.)*
2. **`theme/icons.ts` SF Symbol map** — every `key:'<material-name>'` and every bare `key:<name>` whose only site is `theme/icons.ts` (28 origins). The values are `chevron.left`, `wallet.pass.fill`, …
3. **Routes and deep links** — `call:router.navigate|push|replace`, `key:screen`, `key:'tab-money'`, `key:'tab-progress'`, `prop:onBack`, `prop:onDemo`, `prop:onManageEveryday`, `prop:onSeeForecast`, `var:href`, and the URL constants (`var:APP_STORE_URL`, `FREEDOM_*`, `PRIVACY_POLICY_URL`, `SUPPORT_URL`, `TERMS_OF_USE_URL`, `MANAGE_SUBSCRIPTION_URL`, `PAYDAY_ACTIVITY_DEEPLINK`).
4. **Storage / app-group / widget keys** — `var:CYCLE_HISTORY_STORAGE_KEY`, `var:KEY`, `var:QUARANTINE_PREFIX`, `var:WIDGET_*`, `var:LIVE_ACTIVITY_APP_GROUP`, `var:TUTORIAL_WRITABLE_PREFS`, `key:portfolioMaxProgress`, `var:AFFORD_PREVIEW_ID`.
5. **Native-module and event registries** — `call:require*`, `call:AccessibilityInfo.addEventListener`, `call:Keyboard.addListener`, `var:appleTargets`, `key:type`, `key:systemIcon`, `prop:previewConfig`, `prop:getComponent`.
6. **Style and format tokens** — `key:boxShadow`, `key:display`, `key:mono`, `prop:rel`, `prop:target`, `key:mimeType`.
7. **Diagnostics and QA traces** — `call:console.warn`, `call:reportError`, `call:probeCoachMark`, `call:useEffect`, `var:verdict`, `call:useSuppressCoachMarks`, `key:seam`, `key:subsystem`.
8. **Enum ids and discriminants** — `var:BILL_CATEGORY_ORDER`, `var:DEFERRABLE_CATEGORIES`, `var:coverFromSavings`, `var:cushionStatus`, `var:dominantError`, `var:AMT`, `var:DEBT_RC_IOS_KEY`.

⚠️ Five of these (`prop:onBack`, `prop:onDemo`, `prop:onSeeForecast`, `prop:getComponent`, `prop:previewConfig`)
are **already in `TECHNICAL_ORIGINS`** and still report unclassified. They need the **code fix in L6-1**,
not a second list entry — adding them again would look like a fix and change nothing.

**Pull into the copy list — 93 prop names / 175 strings.** The ones I would move first, because they are
copy a user reads on a shipped surface and no reviewer has ever seen:

- **Every form validation message** — `key:nameRequired`, `key:balanceRequired`, `key:amountPositive`, `key:minimumRequired`, `key:leanRequired`, `key:leanAboveTypical`, `key:errors`. This is the exact class the script's own header says it was rebuilt to catch, and it is still outside the gate.
- **Every picker / segmented-control label** — `prop:options` (20 strings: `Today`, `Progress`, `Money`, `Snowball`, `Avalanche`, `Debt / loan`, `BNPL (buy now, pay later)`…), the seven pay-frequency keys, and the seven obligation-category keys.
- **The premium promises** — `var:freeInvite` (*"Premium keeps your cushion at your line automatically, all on your device"*), `var:LIFETIME_SUBNOTE`, `var:ctaLabel`, `key:free`, `key:premium`. Purchase claims, and the tier-honesty rule the walkthrough copy already carries scar tissue about.
- **The Guardian's own voice** — `var:recalibration`, `var:attestLabel`, `var:caption`, `var:statusLabel`, `var:safeMove`, `var:dest`, `var:target`, `var:targetName`, `var:look`, `call:useStore`, `prop:sub`. First-person Guardian lines and the fragments spliced into them.
- **Everything iOS renders on our behalf** — `call:schedule` (notification title/body), `key:buttonTitle`, `key:promptMessage` + `key:fallbackLabel` (the Face ID sheet), `call:shareDebtCard`, `var:debtFreeDate` (widget), `key:line` / `var:line` (Live Activity), `call:announce` + `var:beatA11y` (VoiceOver). None of these appear in the app's own JSX, which is exactly why they were missed.
- **Row-level props the copy list simply never named** — `prop:meta`, `prop:hint`, `prop:error`, `prop:amount`, `prop:amountSuffix`, `key:sub`, `key:placeholder`, `var:title`, `var:caption`, `var:captionText`, `var:message`, `var:verb`.

**The two MIXED props cannot be listed either way, and that is the point.**

- **`prop:onPress` (12 strings)** — 10 route paths, 2 real `Alert.alert` strings at `LiveActivityQA.tsx:70`. It is already in `TECHNICAL_ORIGINS`; once L6-1 makes that list effective, those two copy strings become **permanently invisible**. Recommendation: leave `prop:onPress` out of both lists and instead extend rule ③ to harvest `Alert.alert` inside handler bodies (it already special-cases `Alert.alert` at the top level) — the residue is then pure routes.
- **`other` (30 strings)** — the residue with no named context: routes, storage keys and property-name literals mixed with `"Unable to estimate"`, `"Share your debt-free win"`, `"Semi-monthly pay days must be different."`, `"Unsupported pay cycle"`, `"Storage is locked"`. Recommendation: never exclude `other`; it is the bucket that is supposed to stay uncomfortable. Shrink it instead by giving `originOf()` two more named contexts — `new Error(...)` arguments and `<Stack.Screen name=…>` — which accounts for roughly two thirds of it.

**Where I leaned toward COPY and could be wrong (3 props, 8 strings):** `call:validateDayOfTheMonth`
(reaches a user only via an uncaught throw), `` call:99%',].join `` (sample data — user-visible, but not
"voice"), and `key:line` (a QA sample that mirrors shipped Live Activity copy). Reviewing all three costs
a minute; excluding them is how the class comes back.

---

## Summary

| verdict | props | strings |
|---|---|---|
| **COPY** | 93 | 175 |
| **MACHINERY** | 104 | 141 |
| **MIXED** | 2 | 42 |
| **UNSURE** | 0 | 0 |
| **total** | **199** | **358** |

**What this moves into the gate's view: 181 of 358 strings (51%)** — the 175 COPY strings plus ~6 of the
42 MIXED (the 2 `Alert.alert` lines under `prop:onPress`, and `"Unable to estimate"`, `"Share your
debt-free win"` and the two thrown pay-cycle messages inside `other`). The other 177 are genuinely
machinery, and 141 of them can be excluded by eight family rules rather than 104 individual entries.

**Most alarming string:** `"Chase Freedom Unlimited"` — with `"New Balance $2,431.09"`, `"Minimum Payment
Due $56.00"` and `"Purchase APR 24.99%"` beside it (`apps/rn/src/lib/scan.web.ts:9-16`). A fabricated
statement from a named real issuer, parsed into the prefill form on the web demo and the marketing embed,
and until now in neither list — so no wording pass has ever looked at it.

**Runner-up, and higher severity:** `QA_TOOLS = true` (`apps/rn/src/config/qa.ts:9`) still exposes the
`"Simulate 'Payday landed'"` control in More, and it mutates the real store. Correctly gated; the gate is
just open.
