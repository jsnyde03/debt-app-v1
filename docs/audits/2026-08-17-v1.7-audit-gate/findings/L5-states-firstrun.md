# L5 — states & first-run

**Surfaces covered.** Every route in `slices/L5-surfaces.md` was opened except `demo.tsx` and
`tutorial.tsx` (bounded runs, covered by their own device checks). Judged for STATES: `onboarding`
(all 4 steps) · `(tabs)/index` (Today) · `(tabs)/money` (Debts · Expenses · Goals) ·
`(tabs)/progress` · `paywall` · `more` · `history` · `living-expenses` · `cushion-forecast` ·
`schedule/[id]` · `+not-found` · `_layout` (hydration gate). Judged additionally for FIRST-RUN
(best-in-class): onboarding → Today → Money → paywall **only**, per scope.

Supporting reads: `store/store.ts` (hydrate/save), `store/persistence.ts`,
`storage/createAdapter.ts`, `store/planSelectors.ts`, `store/guardianSelectors.ts`,
`store/greeting.ts`, `store/paycheckForm.ts`, `packages/core/payCycle/getNextPaycheckDate.ts`,
`packages/core/utils/formatCurrency.ts`, `utils/format.ts`, `components/plan/PlanHero.tsx`,
`components/plan/RequiredActionsCard.tsx`, `components/entities/AmortizationView.tsx`,
`components/ui/{Screen,EmptyState,ListRow}`, `components/progress/VanquishedArchive.tsx`.

**Method note.** Every mechanism below marked `Verified: yes-read-the-source` was traced in the
file named. Where I state a *rendering* consequence of a layout rule (flex overflow, font scaling)
rather than a branch, it is labelled as a hypothesis with its confidence — this project has
measured confidently-stated mechanisms wrong about half the time.

---

### L5-1 · Today throws the whole app away for a user with a paycheck and an expense but no debts
- **Severity:** blocker
- **Class:** state
- **Where:** `apps/rn/src/app/(tabs)/index.tsx:264-283` (the `planState === 'no-debts'` branch), with `apps/rn/src/store/planSelectors.ts:273-278` and `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:105-112`
- **The state that breaks:** onboarding step 2 offers **Debt | Expense** as two equal segments. Choose *Expense*, type "Rent", finish. You now have a paycheck and one expense and zero debts, so `selectPlanState` returns `'no-debts'` and Today's entire `content` collapses to a single `PromptCard`: *"Add your first debt."* No hero, no Required Actions (your rent is a required row and is not shown), no "Spoken for", no Affordability card — **and no Payday Guardian**, even though `selectPaydayGuardian` returns a live brief in this exact state (verified: `guardianSelectors.ts:549-557` only nulls on no-allocation or no-cycles, and explicitly handles `debtFree`). The `guardian ? <PaydayGuardianCard/> : null` render sits *inside* the third branch, so the brief is computed and discarded. The Welcome screen's first promise — *"A guardian for every payday"* — is invisible to a user who took an offered onboarding path. This is the shipped defect class the audit names, at the largest possible scale: the door to the headline feature only opens once you already have debt.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** in the `no-debts` branch render the hero + Guardian + Required Actions as normal and demote "Add your first debt" to a card *inside* the plan, not instead of it.

### L5-2 · A hydrate or storage-init failure is a permanent blank screen with no error state and no retry
- **Severity:** blocker
- **Class:** state
- **Where:** `apps/rn/src/app/_layout.tsx:66,120` · `apps/rn/src/store/store.ts:213-232` · `apps/rn/src/storage/createAdapter.ts:23`
- **The state that breaks:** `RootLayout` renders `null` until `isHydrated`. `isHydrated` is set in exactly three places, all *after* `const raw = await adapter.read()` — which is **outside** hydrate's `try`. Two live failure paths: (a) `createStorageAdapter()` calls `createMMKV(...)` synchronously inside the effect, so a native-module init failure throws before `bootstrapPersistence` is ever called; (b) an `adapter.read()` rejection propagates out of the `void bootstrapPersistence(...)` chain as an unhandled rejection. In both, `isHydrated` stays `false` forever: splash → black, no message, no retry, no support path. The layout's own comment concedes this (*"storage-locked/retry — lands at B.9"*), and B.9 has not landed. Separately, `save()` (`store.ts:234-241`) has a `finally` but no `catch`, so a failed write (full disk, MMKV error) is silent — the user keeps editing and loses everything on next launch.
- **Verified:** yes-read-the-source
- **Confidence:** high on the code shape; **medium** on how often MMKV/read actually fails on device — I could not measure that
- **Suggested fix:** wrap `createStorageAdapter()` + `adapter.read()` in try/catch, always set `isHydrated`, and render a themed "Couldn't open your data · Retry" surface instead of `null`; surface `save` failures once as a non-blocking banner.

### L5-3 · The everyday-spending door is inside the bills list, so with zero bills it does not render
- **Severity:** major
- **Class:** state
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:640-649` (the `expenses.length === 0` early return) vs `:735-742` (`<LivingReserve/>` in `ListFooterComponent`)
- **The state that breaks:** with **zero expenses**, `BillsSection` returns the `EmptyState` before the `SectionList` exists, so the "Everyday spending reserve" card — the card whose in-code comment says *"a door that only opens once you are already inside is not a door"* and whose `livingTotal > 0` gate was deliberately removed for exactly this reason — is still not rendered on day one. The comment's *"Empty state included"* is true of the card's own empty copy, not of the screen's empty state. The other doors don't cover it: Today's "Spoken for" legend needs a live `summary` (so it needs debts, see L5-1), leaving only More → Preferences → the **last** row of a nine-row group, which is the "hidden in More" placement this feature was moved out of.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** render `<LivingReserve/>` below the `EmptyState` in the zero-expense branch too (one line, same component).

### L5-4 · `/schedule/[id]` renders up to 600 unvirtualized rows for a mortgage or student loan
- **Severity:** major
- **Class:** state
- **Where:** `apps/rn/src/components/entities/AmortizationView.tsx:78` (`schedule.rows.map`) · `packages/core/debt/buildAmortizationSchedule.ts:26,75` (`MAX_MONTHS = 600`)
- **The state that breaks:** "very many items." A 30-year mortgage or a long student loan produces 360–600 schedule rows. `AmortizationView` maps every row into a plain `View` (4 `Text` nodes each, ≈2,400 nodes) with **no virtualization** — the comment explains why it can't nest a `ScrollView`, but the fix chosen was to drop the list into the parent scroller wholesale. On the pushed route this is a synchronous mount on the navigation transition. With three debts of $2,400 it is instant; with one mortgage it is the slowest screen in the app.
- **Verified:** yes-read-the-source (the row count and the un-virtualized map). The *user-visible* stall is a hypothesis — not measured on device.
- **Confidence:** high on the shape, medium on severity
- **Suggested fix:** cap the visible rows (e.g. first 60 + "Show all") or hand the host a `FlatList` via a render-prop so both hosts stay virtualized.

### L5-5 · Deleting a bill while searching strands an invisible filter with no way to clear it
- **Severity:** major
- **Class:** state
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:625` (`grouped = expenses.length >= BILL_GROUPING_THRESHOLD`), `:686` (`{grouped ? <BillSearch/> : null}`), `:585-588` (the un-grouped branch still applies `match`)
- **The state that breaks:** Money → Expenses with 8 bills. Search "netflix". Swipe-delete a bill → `expenses.length` drops to 7 → `grouped` flips false → **the search field unmounts but `query` state survives**, and the flat branch still filters by it. The user is left looking at one row (or the "No bills match "netflix"" message) with the search box gone and no control to clear. Recovering requires leaving the tab.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** `useEffect(() => { if (!grouped) setQuery(''); }, [grouped])`, or keep the field mounted whenever `query` is non-empty.

### L5-6 · The Notifications toggle is a silent no-op once permission has been denied
- **Severity:** major
- **Class:** state
- **Where:** `apps/rn/src/app/more.tsx:68-75`
- **The state that breaks:** `handleNotificationsToggle(true)` awaits `requestNotificationPermission()`; if it returns false the pref is simply not written. iOS shows its permission alert **once ever**, so for every user who declined it the first time, the switch flips on, snaps back, and nothing at all is said. There is no "Notifications are off for Debt Planner — open Settings" path anywhere in the file. The same shape applies on web, where the helper always returns false.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** on a false result, show an alert with an "Open Settings" action (`Linking.openSettings()`); when permission is already `denied`, render the row's subtitle as "Blocked in iOS Settings" rather than a live switch.

### L5-7 · Today's, Money's and Progress's hero figures are the only large numbers with no font-scale cap
- **Severity:** major
- **Class:** state
- **Where:** `apps/rn/src/components/plan/PlanHero.tsx:222` (`amount`, 40pt) and `:229` (`legend`, `flexDirection: 'row'`, no `flexWrap`) · `apps/rn/src/app/(tabs)/money.tsx:995` (`heroNum`, 34pt) · `apps/rn/src/app/(tabs)/progress.tsx:236` (`heroDate`, 26pt)
- **The state that breaks:** long strings / large numbers. `maxFontSizeMultiplier` is applied consistently on the celebration surfaces (`PaidOffFinale`, `VanquishedBeat`), the floor sheet, and Progress's ring `%` — 13 call sites — but **not on any of the three tab heroes**, none of which also carries `numberOfLines` or `adjustsFontSizeToFit`. At AX5 the Today hero's 40pt paycheck figure scales unbounded, and PlanHero's three-item legend (`Required · Spoken for · Flexible`, 17pt values, `gap: spacing.lg`, no wrap and no shrink) cannot fit three five-digit values on a 375pt phone. Money's hero is the realistic large-number case: a mortgage user's `formatWhole(totalBal)` is `$487,300`, eight glyphs at 34pt before any scaling.
- **Verified:** yes-read-the-source for the *absence* of the caps and the legend's layout rule. The visual outcome (wrap/clip) is a **hypothesis** — it needs the AX5 device pass (`§11.5` is already owed and unproven).
- **Confidence:** medium-high
- **Suggested fix:** add `maxFontSizeMultiplier={1.3}` + `numberOfLines={1}` to the three hero figures, and `flexWrap: 'wrap'` (or `flexShrink: 1` per item) on `PlanHero.styles.legend`.

### L5-8 · `cushion-forecast` renders a header and nothing else for a non-premium user
- **Severity:** major
- **Class:** state
- **Where:** `apps/rn/src/app/cushion-forecast.tsx:35-38`
- **The state that breaks:** the whole body is `{isPremium ? <CashRunwayChart/> : null}{isPremium ? <GuardianScorecard/> : null}`. A free read yields a screen containing a title, a back chevron, and empty space — no explanation, no upsell, no "this is Premium". Today's entry point is premium-gated (`PaydayGuardianCard.tsx:462`), so the ordinary free user cannot arrive; the reachable paths are an entitlement that lapses or fails to resolve while the route is open, the QA "Simulate Premium" toggle, and a deep link. It is the app's only screen that can render completely dead, against its own stated rule that nothing renders dead.
- **Verified:** yes-read-the-source (the branch). Reachability for a genuine free user is **inferred** — I found one caller and it is gated.
- **Confidence:** high on the blank render, medium on how a user gets there
- **Suggested fix:** an `else` branch — a short "Your cushion forecast is part of Premium" card with the paywall CTA.

### L5-9 · Every paycheck date is a day early for users east of UTC
- **Severity:** major
- **Class:** state
- **Where:** `packages/core/payCycle/getNextPaycheckDate.ts:11-17` · `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx:18-23`
- **The state that breaks:** `toDate()` parses `"2026-08-12T00:00:00"` with no zone suffix, so it is **local** midnight; `toDateString()` then does `.toISOString().slice(0,10)`, which converts to UTC. At UTC+10, local midnight Aug 12 is `2026-08-11T14:00Z`, so the returned ISO date is **Aug 11**. This affects all four cycles (the weekly/biweekly `+7/+14` paths go through the same `toDateString`). `formatPaycheckDate` in the same flow carries a comment about being "local-noon-safe", which is true of the *display* and masks that the *value* it displays was already shifted. `nextMonthFirst()` in the onboarding debt step has the identical bug: the first debt a Sydney user creates gets a due date of the last day of the previous month.
- **Verified:** yes-read-the-source
- **Confidence:** high on the mechanism; I did not run it under a non-UTC `TZ` — worth a two-line test before fixing
- **Suggested fix:** replace `toDateString` with a local formatter (`getFullYear`/`getMonth`+1/`getDate`, zero-padded); same for `nextMonthFirst`.

### L5-10 · Onboarding's "Skip for now" skips two steps, not one
- **Severity:** major
- **Class:** first-run
- **Where:** `apps/rn/src/app/onboarding.tsx:35`
- **The missed opportunity:** `<PaycheckStep onNext={() => setStep(2)} onSkip={() => setStep(3)} />`. "Skip for now" on the paycheck step jumps straight to Completion, silently skipping **"Add your first debt or expense"** entirely — the progress dots go from the 2nd to the 4th, and the user is never offered the one action that makes the app do anything. They land on Today with `planState === 'no-paycheck'` and a single prompt. A skip should defer one question, not delete the rest of setup.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** `onSkip={() => setStep(2)}`.

### L5-11 · The one memorable moment in onboarding silently degrades to a platitude
- **Severity:** major
- **Class:** first-run
- **Where:** `apps/rn/src/components/onboarding/CompletionStep.tsx:49-58`
- **The missed opportunity:** the finish line is *"You could be debt-free by <date>"* — genuinely best-in-class, their own number, at the right beat. It falls back to **"You're all set"** whenever `selectPayoffView(store).debtFreeDate` is null, which is every user who skipped the paycheck step, skipped the debt step, or picked **Expense** in step 2 (an equally-weighted choice). So the single moment that could make this app memorable is dropped for exactly the users carrying the least momentum, and replaced with a line that says nothing. The fallback should still be a fact about *them* — "Your next paycheck lands Fri, Aug 21. Here's what it has to cover." — not a generic reassurance.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** a ladder of real facts (debt-free date → next paycheck date → nothing), never a content-free string.

### L5-12 · The paywall never mentions the user's own money — the single biggest first-run opportunity
- **Severity:** major
- **Class:** first-run
- **Where:** `apps/rn/src/app/paywall.tsx:200-225`
- **The missed opportunity:** the paywall's states are genuinely well-built (loading · error+retry · already-premium · lifetime · no-SDK fallback — better than most of the app). What it lacks is the thing YNAB, Copilot and Monarch all do: it is **identical for a user 40 seconds into the app and one three months in who just hit a shortfall**, and identical whether they arrived from the Guardian, from "Can I afford this", or from More. Four abstract benefit lines argue with a person who is already holding the evidence. **One line, above the benefits, when a live `summary` exists** — *"This paycheck you're $180 short. Recovery Plan builds the catch-up."* / *"Your Guardian is holding $412 — Premium keeps it at your line every payday, automatically."* — is the whole change. It is restraint, not spectacle: no new animation, no new screen, and it degrades to today's hero for the pre-onboarding viewer the route is deliberately open to. This is the best single first-run investment on the list.
- **Verified:** yes-read-the-source (the absence; `PlanSummary` and `selectPaydayGuardian` already expose every figure needed)
- **Confidence:** high on the gap, medium on conversion effect (unmeasured)
- **Suggested fix:** one conditional line sourced from `selectPlanSummary`/`selectPaydayGuardian`, plus an optional `?from=` param so the copy names the feature they reached for.

### L5-13 · Money → Debts with every debt paid off reads as a broken plan, not a finished one
- **Severity:** minor
- **Class:** state
- **Where:** `apps/rn/src/app/(tabs)/money.tsx:311-341`
- **The state that breaks:** the empty state is gated on `store.debts.length === 0`, but a cleared debt **stays in `debts`** with `balance <= 0`. So a debt-free user (`view.order` empty, `paidOff` non-empty) skips the empty state and gets the full list chrome instead: a hero reading **"$0 · remaining across 0 debts"**, the Snowball/Avalanche toggle, and the caption *"Smallest balance first — quick wins. Your debts are listed in payoff order."* — above an empty active section. Progress handles this same state beautifully (`progress.tsx:104-119`: a "DEBT-FREE · Every balance cleared" hero + the trophy shelf); Money does not.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** when `active.length === 0 && paidOff.length > 0`, swap the hero + strategy block for a one-line "Every balance cleared" header above the PAID OFF section.

### L5-14 · A cleared semimonthly/monthly payday field silently produces a biweekly date
- **Severity:** minor
- **Class:** first-run
- **Where:** `apps/rn/src/store/paycheckForm.ts:75-93` · `apps/rn/src/components/onboarding/PaycheckStep.tsx:36-60`
- **The state that breaks:** pick **Semi-monthly**, clear "First payday". `getNextPaycheckDate` throws (`validateDayOfTheMonth`), `nextPaycheckFrom` catches it and returns **`getNextPaycheckDate({ payCycle: 'biweekly' })`** — today + 14 days. The "Next paycheck" preview card shows that date confidently; `handleNext` validates only `amount` (and `lean`), so Continue writes `payCycle: 'semimonthly'` **with** `semiMonthlyFirstDay: ''` **and** a biweekly-derived `nextPaycheckDate`. The user's very first fact about themselves is stored wrong with no error shown. Same silent fallback for two identical semi-monthly days and for a monthly day out of 1–31.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** have `nextPaycheckFrom` return `null` on invalid input; render "—" in the preview card and block Continue with a field error, as the amount field already does.

### L5-15 · All money is hard-coded to en-US/USD, but the paywall shows the store's real currency
- **Severity:** minor
- **Class:** state
- **Where:** `packages/core/utils/formatCurrency.ts:12-19` · `apps/rn/src/utils/format.ts:4-7` · `apps/rn/src/components/plan/PlanHero.tsx:27` (`money0`)
- **The state that breaks:** all three formatters pin `'en-US'` + `'USD'`. A UK or EU user's balances, cushion and hero all read in `$`, while the paywall correctly renders RevenueCat's localized `priceString` (`£24.99`) — so the one screen asking for money is the one screen in a different currency from every other. This is plausibly a deliberate v1 scope call rather than a defect; flagging it because "acquisition-ready" implies non-US storefronts.
- **Verified:** yes-read-the-source
- **Confidence:** high on the code, low on whether it is in scope for v1.7
- **Suggested fix:** if out of scope, say so explicitly in the release notes; if in scope, one `useCurrency()` reading the device locale, threaded through the three formatters.

### L5-16 · `ListRow`'s amount column doesn't shrink, so a long name plus a large amount collapses the name
- **Severity:** minor
- **Class:** state
- **Where:** `apps/rn/src/components/ui/ListRow.tsx:118-125,180-182`
- **The state that breaks:** `left: { flex: 1 }`, `right:` no flex, no shrink, and the amount `Text` has no `numberOfLines`. Every text in `left` is already `numberOfLines={1}`, so under pressure the *name* is what gives: a mortgage row (`$2,450.00` + `/mo`) at AX3+ takes enough width that "Chase Sapphire Preferred Card" ellipsises to a few characters. The badges row (`titleRow`, `flexWrap: 'wrap'`) makes it worse — a Focus pill plus an Autopay pill on a long name pushes to a second line inside an already-squeezed column.
- **Verified:** yes-read-the-source for the styles; the rendering outcome is a **hypothesis** from standard flex behaviour, unmeasured
- **Confidence:** medium
- **Suggested fix:** `right: { flexShrink: 0, maxWidth: '45%' }` plus `numberOfLines={1}` on the amount.

### L5-17 · Today's greeting — the app's one personalized touch — is clipped to one line by the shared header
- **Severity:** polish
- **Class:** first-run
- **Where:** `apps/rn/src/components/screen.tsx:66-72` (`numberOfLines={1}`) · `apps/rn/src/store/greeting.ts:14,44-48`
- **The missed opportunity:** `MAX_DISPLAY_NAME` is 24, and its own comment explains the cap exists so a `title1` line doesn't wrap — but the header also hard-clips to one line, so "Good afternoon, Christopher" at large dynamic type truncates the name the user just typed. `headerLeft` is `flexShrink: 1` and shares the row with the `•••` button, so the squeeze is real at every text size on a 375pt phone. The fix is not a bigger cap: it is to let the greeting be two lines (`numberOfLines={2}` when no `onBack`), or to shorten the band to "Afternoon, Chris".
- **Verified:** yes-read-the-source; the exact truncation point is unmeasured
- **Confidence:** medium
- **Suggested fix:** allow two lines on the tab headers, keep one on pushed routes.

### L5-18 · The "not found" screen names a tab that doesn't exist
- **Severity:** polish
- **Class:** state
- **Where:** `apps/rn/src/app/+not-found.tsx:15`
- **The state that breaks:** the recovery link reads **"Go to Plan"**. The tabs are Today · Progress · Money; "Plan" was the old name. A deep-link miss or a bad universal link lands an App Review tester here.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** "Go to Today".

### L5-19 · There is no free trial and no trial framing anywhere on the paywall
- **Severity:** polish
- **Class:** first-run
- **Where:** `apps/rn/src/app/paywall.tsx:56-60,196-199`
- **The missed opportunity:** the three plans are annual/lifetime/monthly with no introductory offer, and the CTA is "Start Premium — $29.99 per year". Every category leader benchmarked (YNAB 34-day, Copilot 7-day, Monarch 7-day) leads with a trial, and RevenueCat surfaces intro offers on the package already. Recording it as a **business decision to confirm**, not a defect — a money app that asks for $29.99 before showing a single premium moment is choosing a harder conversion than it needs to. Note also that `planFromPackage` ignores `product.introPrice` entirely, so if a trial *is* configured in App Store Connect the paywall will not mention it — that half **is** a defect.
- **Verified:** yes-read-the-source (the missing `introPrice` read is verified; the trial question is a product call)
- **Confidence:** high on the code gap
- **Suggested fix:** read `introPrice` off the package and prefix the subnote with "7 days free, then …" when present; decide the trial separately.

### L5-20 · The paywall price column can wrap on a long localized price
- **Severity:** polish
- **Class:** first-run
- **Where:** `apps/rn/src/app/paywall.tsx:352-353` (`planPrice`, `priceText` at 24pt, no `numberOfLines`)
- **The state that breaks:** long strings. `planMid` is `flex: 1` and `planPrice` sizes to content with no cap, so a store returning `Rp 449.000` or `¥12,000` (or any AX-scaled price) either wraps to two lines inside the row or squeezes the plan title. Guideline 3.1.2 makes the billed price the element that must stay conspicuous, so this is the one place a wrap costs more than tidiness.
- **Verified:** yes-read-the-source for the styles; rendering outcome is a **hypothesis**
- **Confidence:** medium
- **Suggested fix:** `numberOfLines={1}` + `adjustsFontSizeToFit` on `priceText`, `flexShrink: 0` on `planPrice`.

### L5-21 · There is no loading state on native, and that is correct — recorded so it isn't re-opened
- **Severity:** polish
- **Class:** state
- **Where:** `apps/rn/src/components/ui/ChartSkeleton.tsx` consumers — all five are `*.web.tsx` Skia lazy-load fallbacks
- **The state that breaks:** nothing. Every read in the app is synchronous against a hydrated in-memory store, so the only genuine async states are hydration (L5-2) and the paywall's package fetch (handled well). `ChartSkeleton` exists but is unreachable on iOS. Noting it so a reviewer does not read "no loading states" as a coverage gap, and so nobody adds decorative skeletons to a local-first app.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** none — leave it.

---

## Summary

**21 findings.**

| severity | count |
|---|---:|
| blocker | 2 |
| major | 10 |
| minor | 4 |
| polish | 5 |

| class | count |
|---|---:|
| state | 14 |
| first-run | 7 |

**The single worst empty state — L5-1.** A user who picks **Expense** rather than Debt in onboarding
step 2 (two equally-weighted segments) reaches Today and is shown one card: *"Add your first debt."*
The paycheck they entered, the bill they entered, and a fully-computed Payday Guardian brief are all
discarded by a branch that treats "no debts" as "no plan". The Guardian is the first promise the
Welcome screen makes and the whole premium thesis, and it is invisible to exactly the person who
just finished setup. It is the same defect class as the card that only appeared once you had data —
one level up, and on the home tab.

**The single best first-run opportunity — L5-12.** Put the user's own number on the paywall. One
conditional line above the benefit list, sourced from selectors that already exist
(`selectPlanSummary`, `selectPaydayGuardian`): *"This paycheck you're $180 short — Recovery Plan
builds the catch-up."* It is the difference between arguing with someone and showing them their own
evidence, it costs no new screen and no new motion, and it degrades cleanly to today's hero for the
pre-onboarding viewer the route deliberately admits. Everything else on the first-run path is
already close: the paywall's state handling is the best in the app, and onboarding's *"You could be
debt-free by <date>"* is a genuinely top-of-class moment — it just needs to stop disappearing
(L5-11).

**Would embarrass in a demo or review, in order:** L5-1 (empty Today after a legitimate onboarding
path) · L5-2 (a black screen with no recovery) · L5-13 ("$0 remaining across 0 debts" with a
payoff-strategy picker above nothing) · L5-8 (a completely blank premium screen) · L5-18 ("Go to
Plan").
