# Implementation Plan — v1.3 onward

_Companion to `ROADMAP.md`, which defines the **what/why/tier**. This document defines the **how**: data model changes, files touched, sequencing, and testing per version. Last updated 2026-06-22._

## Critical path dependency — read this before sequencing anything past v1.14

Three separate roadmap items independently require a **backend** that does not exist today (the app is 100% client-side, `localStorage`-only, no accounts, no server):

- **v1.14** — opt-in leaderboard (needs a server to aggregate anonymous percentiles across users)
- **v2.0** — AI Recommendations (an Anthropic API key can never be embedded client-side; Claude calls must go through a server proxy)
- **v2.1** — Household/Multi-Income (multiple people need to see shared data, which means accounts + sync, not local storage)
- **v2.2** — Bank linking (Plaid access tokens must never touch the client; requires a server to hold them)

Building this four separate times would be wasteful and inconsistent. **Recommendation: stand up the backend foundation once, as explicit Phase 0 of v2.0**, since that's the first item on the roadmap that strictly requires it chronologically. v1.14's leaderboard should be **resequenced to ship its non-backend half (shareable cards) standalone, and its backend half (leaderboard) deferred until the v2.0 backend exists** — detailed in the v1.14 section below.

This single decision is the most important thing in this document. Everything below assumes it.

---

## v1.2 addendum — App Lock (Biometric + Device Passcode Fallback)

**Why this is going into v1.2, not its own version:** v1.2 (notifications + App Store review prompt) is locked but hasn't been submitted/launched yet. App Lock has zero dependencies on anything else in this plan, is quick to build, and thematically belongs with notifications/review as a "trust" feature — not worth spinning up a separate release for. Since v1.3 (iPad) already branched off v1.2-dev, implement this on `v1.2-dev` and merge/rebase those commits forward into `v1.3-dev` afterward.

**Scope:** Gate the app behind the device's native authentication on launch and on resume from background, before any debt/financial data renders.

**Key architectural recommendation: do not build a custom in-app PIN system.** Use iOS `LocalAuthentication` with `LAPolicy.deviceOwnerAuthentication` (not `...WithBiometrics`) — this policy gives Face ID/Touch ID *and* automatically falls back to the device's own passcode if biometrics fail or aren't enrolled. This means zero custom secret storage, zero risk of a weak homegrown PIN implementation, and matches the unlock behavior users already expect from every other secure app on their phone.

**Implementation steps:**
1. Add a Capacitor biometric plugin (community-maintained `LocalAuthentication` wrapper — evaluate options at implementation time) configured for `deviceOwnerAuthentication`, not biometrics-only.
2. New `lib/hooks/useAppLock.ts` — tracks `isUnlocked` state, exposes `requestUnlock()`. Re-locks on background via Capacitor's `App` plugin `appStateChange` listener, not just on cold launch — a lock that only triggers on full app restart isn't a real lock.
3. In `app/page.tsx`, gate the `<main>` render behind `isUnlocked`: render a minimal lock screen (icon + "Unlock" button calling `requestUnlock()`) when locked, following the same pre-render-gating pattern `AppSkeleton` already uses for the mount check.
4. Settings toggle: "Require Face ID to open." **Default ON for new installs** — security should be opt-out, not opt-in, for an app holding debt balances — with clear copy if a user turns it off.
5. **Tier: Free, all tiers.** Gating basic security behind a paywall is a trust/reputation risk in a finance app, not a real monetization lever — no competitor charges for this.

**Data model changes:** none. Purely a render-gating concern, no new storage keys beyond the one settings toggle.

**Testing:** native biometric prompts can't be driven by Playwright (same limitation as v1.7's widget, see below). Manual on-device verification is the primary gate. Add one regression-adjacent unit check: with `useAppLock` mocked to always-locked, confirm no debt/balance data is present in the rendered output before unlock — guards against a future change accidentally rendering sensitive content ahead of the lock check.

**Risk:** Low. Single new dependency (the biometric plugin), no interaction with any other feature, no data model changes.

---

## v1.3 — iPad Support *(done)*

**Scope:** Make the app a genuine iPad experience, not a stretched iPhone layout.

**Current state (verified):**
- `ios/App/App/Info.plist` → `UIDeviceFamily: [1]` (iPhone only)
- `ios/App/App.xcodeproj/project.pbxproj` → `TARGETED_DEVICE_FAMILY = "1"` (iPhone only, both Debug/Release)
- `app/styles/00-theme-and-base.css:226` → `.app { max-width: 1300px; }` — caps width but the content inside is single-column with zero `min-width` media queries. On an iPad today this renders as a centered, single-column phone layout with large empty side margins — functional but not "designed for iPad."
- Only two breakpoints exist anywhere in the CSS (`app/styles/09-anim-swipe-media-misc.css:262,308`), both `max-width` (768px, 640px) — purely mobile-narrowing, nothing for wider layouts.

**Implementation steps:**
1. **Xcode target**: change `TARGETED_DEVICE_FAMILY` to `"1,2"` (universal) in both Debug and Release configs. Add `UIDeviceFamily: [1, 2]` and `UISupportedInterfaceOrientations~ipad` to include landscape (currently portrait-only) in `Info.plist`.
2. **Layout breakpoint**: add a `min-width: 834px` (iPad mini portrait and up) tier to the CSS. Candidate two-column layouts:
   - Plan tab: Results summary + Timeline side-by-side instead of stacked
   - Settings sheet: render as a centered modal (already has `.settings-sheet`) instead of full-bleed bottom sheet
   - Bills tab: Expenses/Debts switcher could become a persistent side-by-side split instead of a toggle
3. Add the new breakpoint rules to `app/styles/09-anim-swipe-media-misc.css` (where the other media queries live) as `min-width` rules, ordered after the existing `max-width` rules so cascade order is unaffected.
4. Bottom nav: re-check whether a bottom tab bar still makes sense on iPad vs. a sidebar — recommend **keeping bottom nav for v1.3** (lower risk, ships faster) and revisiting a sidebar nav as a backlog polish item, not blocking this version.
5. Test in iPad Simulator (multiple sizes: iPad mini, iPad Air, iPad Pro 13") in both orientations, both themes.

**Files touched:** `ios/App/App/Info.plist`, `ios/App/App.xcodeproj/project.pbxproj`, `app/styles/09-anim-swipe-media-misc.css` (new rules), possibly new component-level conditional rendering if the two-column Plan tab layout needs JSX changes (not just CSS) — check whether `ResultsSection`/`TimelineSection` can reflow via CSS grid alone first before touching JSX.

**Testing:** Manual Simulator pass (documented above) is the primary gate since there's no automated visual regression tooling yet. Add one new Playwright project block in `playwright.config.ts` for an iPad viewport (e.g., `devices["iPad Pro 11"]`) alongside the existing `mobile-chrome`/`iphone-pro-max` projects, reusing existing e2e specs.

**Risk:** Low-medium. Mechanical CSS/config work, but "looks correct on iPad" is subjective — get a visual check before considering this done, the same way the recent file-split refactor was Playwright-screenshot-verified at each step.

---

## v1.4 — Onboarding Flow

**Scope:** Replace the bare "enter paycheck amount" first-run sheet with a guided multi-step flow.

**Current state:** `app/page.tsx` gates on `isFirstRunSetup` (derived from `hasConfiguredPaycheck`) and shows the same `PaycheckSection` settings sheet used for ongoing settings, just with different copy ("Create Your First Plan" vs "Plan Settings") and an `Import Backup` shortcut. There's no walkthrough of what the app does.

**Implementation steps:**
1. New `components/Onboarding/` directory:
   - `OnboardingFlow.tsx` — step-state container (`useState<number>` for step index)
   - `WelcomeStep.tsx` — what the app does, 1 screen
   - `PaycheckStep.tsx` — reuses the existing paycheck amount/cycle fields (extract shared fields from `PaycheckSection` if reasonable, or just duplicate the small form — duplication is fine here per "avoid premature abstraction")
   - `FirstDebtOrBillStep.tsx` — optional quick-add of one debt or bill so the user sees a populated plan immediately, with a "Skip, I'll add later" option
   - `CompletionStep.tsx` — "Here's your plan" handoff into the main app
2. New `lib/hooks/useOnboarding.ts` — step state + a `debtPlanner.hasCompletedOnboarding` localStorage flag so it never shows again.
3. In `app/page.tsx`, swap the `isFirstRunSetup` branch's `<PaycheckSection>` render for `<OnboardingFlow>` when `!hasCompletedOnboarding`.
4. Decide: should onboarding require completing all steps, or allow skip-to-end at any point? Recommend allow-skip throughout — this is a planner app, not a game, and forcing steps risks abandonment.

**Data model changes:** none beyond the one new localStorage flag.

**Testing:** New Playwright spec `tests/e2e/onboarding-flow.spec.ts` covering: fresh install → complete all steps → lands on Plan tab; fresh install → skip everything → still lands in app correctly with empty state.

**Risk:** Low. Pure UI addition, no engine/data changes.

---

## v1.5 — Pay Cycle History

**Scope:** Persist a snapshot of each completed pay cycle so users (and later, AI in v2.0) can see trends over time.

**Current state:** `handleRolloverPayCycle` in `app/page.tsx` advances `currentDate`/`nextPaycheckDate`, recalculates debt balances with interest, and clears `completedRecommendedActions` — but throws away the prior cycle's state entirely. Nothing is retained.

**Implementation steps:**
1. New type in `lib/storage/debtPlannerStorage.ts`:
   ```ts
   export type PayCycleSnapshot = {
       cycleEndDate: string;
       totalDebtBalance: number;
       totalPaidThisCycle: number;
       completedRecommendedActions: CompletedRecommendedAction[];
       payoffStrategy: "snowball" | "avalanche";
   };
   ```
2. New `lib/hooks/usePayCycleHistory.ts` — owns `cycleHistory: PayCycleSnapshot[]` state + `debtPlanner.cycleHistory` persistence, exposes `recordCycleSnapshot(snapshot)` and a tier-aware `visibleHistory` getter (slices to last 6 for Premium, full array for Premium+).
3. In `app/page.tsx`'s `handleRolloverPayCycle`, call `recordCycleSnapshot(...)` with the pre-rollover state **before** mutating debts/clearing completed actions.
4. New `components/HistorySection.tsx` — list/chart of past cycles, gated via `hasFeatureAccess` (Premium = capped list with an upsell row at the cap, Premium+ = full list).
5. New nav entry point — likely a row inside Plan Settings ("View Pay Cycle History") rather than a 5th bottom-nav tab, to avoid crowding the nav.

**Data model changes:** new `PayCycleSnapshot` type, new `debtPlanner.cycleHistory` storage key.

**Tier gating:** extends `hasFeatureAccess` — first real use of "same feature, different limit per tier" rather than "feature on/off," which is good groundwork to validate before the bigger v1.9 3-tier rework.

**Testing:** regression test in `lib/testing/` verifying a rollover produces exactly one new snapshot with correct totals; e2e test verifying the History view shows capped vs. uncapped results per mocked tier.

**Risk:** Low. Additive, no existing behavior changes except adding one snapshot-write call inside an existing handler.

---

## v1.6 — Debt Milestones + Amortization Calendar + Streaks

**Scope:** Three related but separable features — ship as one version since they share the "celebrate progress" theme, but implement independently.

### Milestones
1. New `lib/debt/computeMilestones.ts` — pure function comparing `debt.balance` against `debt.originalBalance` per debt, returning crossed thresholds (25/50/75/100%) plus an "all debts paid off" check across the whole list.
2. New `components/MilestoneBadge.tsx` — small celebratory card/toast, triggered when a rollover crosses a threshold (compare pre/post rollover milestone state in `handleRolloverPayCycle`).
3. Free tier gets badges with no calendar; Premium+ unlocks the full calendar (below) which puts milestones in context.

### Amortization Calendar (Premium+)
1. New `lib/debt/buildAmortizationSchedule.ts` — given one debt + its minimum payment (and optional extra payment), produce a month-by-month `{ month, startingBalance, interest, principal, endingBalance }[]` until payoff. This is structurally similar to the existing `lib/debt/applyDebtPaymentProjection.ts` (single-month step) — likely just loops that function and collects results, reusing it rather than duplicating the math.
2. New `components/AmortizationCalendar.tsx` — per-debt table/calendar view, accessible from each debt row in `DebtsSection` (or `DebtRow`) via a new "View Schedule" action, gated via `hasFeatureAccess`.

### Streaks
1. Depends on v1.5's `cycleHistory`. New derived value: count consecutive snapshots where `totalPaidThisCycle >= totalRequired` (on-track), broken on any cycle that fell short.
2. Surface as a small stat ("4-cycle streak 🔥") near the top of the Plan tab — free tier gets the count, Premium+ gets the historical chart (reuses History view from v1.5).

**Data model changes:** none new beyond what v1.5 added — milestones and streaks are computed from existing/v1.5 data, not stored.

**Testing:** regression tests for `computeMilestones` (threshold-crossing edge cases — e.g., paying off a debt in one lump sum should report ALL crossed thresholds, not just 100%) and `buildAmortizationSchedule` (verify final month's `endingBalance` is exactly 0, verify total interest matches `projectDebtPayoff`'s existing `totalInterestPaid` for the same inputs — these two functions must agree).

**Risk:** Medium. The amortization schedule must mathematically reconcile with the existing payoff projection engine — if they disagree, that's a trust-breaking bug in a finance app. Budget time for a reconciliation test, not just unit tests in isolation.

---

## v1.7 — Home Screen Widget + Custom App Icons

**Scope:** Native iOS features outside the Capacitor/JS layer entirely.

**Implementation steps:**
1. **Widget**: requires a new **Widget Extension target** in the Xcode project (SwiftUI `WidgetKit`), not buildable from the JS/Capacitor side. Needs:
   - An **App Group** (e.g., `group.com.jasonsnyder.debtplanner`) shared between the main app and the widget extension
   - The main app must write a small summary blob (days to next paycheck, total debt remaining, debt-free date) to the shared App Group container — likely via a tiny Capacitor plugin call or a `UserDefaults(suiteName:)` write triggered from JS on each relevant state change (paycheck date change, debt balance change)
   - Widget reads that shared blob on its own refresh timeline (WidgetKit manages refresh, app doesn't push to it directly)
2. **Custom icons**: iOS supports alternate app icons natively (`UIApplication.shared.setAlternateIconName`), but Capacitor has no built-in bridge for this. Either write a tiny custom Capacitor plugin (a few lines of Swift) or use a community plugin if one exists and is well-maintained — evaluate at implementation time rather than committing to a specific package now.
3. Both features are **Premium-gated in the JS layer** (show/hide the "Choose Icon" and "Add Widget" entry points in settings based on `hasFeatureAccess`), but the underlying OS capability isn't something the JS layer can truly lock — acceptable since this matches how the rest of the app's premium gating already works (client-side only, no DRM).

**Files touched:** new Xcode target + Swift files (outside `lib/`/`components/`), a new small native plugin if going that route, `components/PaycheckSection.tsx` or a new Settings subsection for icon picker UI.

**Testing:** manual on-device only — widgets and alternate icons cannot be meaningfully tested in CI/Playwright since they're native OS surfaces.

**Risk:** Medium-high relative to its size — this is the first version requiring native Swift work beyond Capacitor's JS bridge. Recommend timeboxing exploration before committing the version slot; if the App Group + widget plumbing proves heavier than expected, ship custom icons alone first and slip the widget to the next slot rather than letting one feature block the other.

---

## v1.8 — Multi-Scenario Planning

**Scope:** Let users save and compare multiple named what-if scenarios instead of one ephemeral simulation.

**Current state:** `components/SnowballSection.tsx` already has a full what-if simulator (`simulationExtraPayment`, `simulationStrategy` state, `projectDebtPayoff` calls) — but it's a single, unsaved, in-memory scenario that resets on navigation.

**Implementation steps:**
1. New type: `Scenario = { id: string; name: string; extraPayment: number; strategy: "snowball" | "avalanche" | "recommended"; createdAt: string }`.
2. New `lib/hooks/useScenarios.ts` — CRUD over a `debtPlanner.scenarios` array, capped (e.g., 3) for Premium+, since this is explicitly a Premium+ feature.
3. New `components/Scenarios/ScenarioComparisonView.tsx` — runs `projectDebtPayoff` once per saved scenario against the same current debt state, renders a side-by-side comparison grid (reuse the visual pattern already in `SnowballSection`'s strategy-comparison card).
4. The existing single-scenario simulator in `SnowballSection` becomes the "create a new scenario" entry point — "Save This Scenario" button persists the current simulation inputs as a named `Scenario`.

**Data model changes:** new `Scenario` type, new `debtPlanner.scenarios` storage key.

**Testing:** regression test confirming running the same inputs through the saved-scenario path and the existing ephemeral simulator path produce identical projections (they should call the same underlying `projectDebtPayoff`, just with different state management around it — this test guards against the new code accidentally diverging from the existing simulator's logic).

**Risk:** Low-medium. Mostly UI/state-management work layered on an already-correct calculation engine.

---

## v1.9 — 3-Tier Subscription Infrastructure + Export/Backup Automation + External Payment Logging

**Scope:** This is the version where the tier model used loosely by v1.5-v1.8 above gets formalized. Should ship *before* v1.6-v1.8 in practice if any of them slip — flagging here that the roadmap's ordering (3-tier infra at v1.9, after several Premium+-gated features already shipped) only works if those earlier features are built tier-aware from day one rather than retrofitted. Recommend treating "use `hasFeatureAccess` correctly, even before it formally supports 3 tiers" as a standing rule starting now, not just at v1.9.

**Current state (verified):** `lib/subscription/plans.ts` → `SubscriptionPlan = "free" | "premium"`. `lib/subscription/hasFeatureAccess.ts` → binary, `plan === "premium"` grants everything. RevenueCat integration (`lib/subscription/revenueCat.ts`) reads a single `"premium"` entitlement ID.

**Implementation steps:**
1. Expand `SubscriptionPlan` to `"free" | "premium" | "premium_plus" | "ultimate"`.
2. Expand `lib/subscription/features.ts`'s `PremiumFeature` union to include the new Premium+/Ultimate features built in v1.5-v1.8 (history depth, amortization, scenarios, net worth, etc.) plus a `minimumTier` mapping per feature.
3. Rewrite `hasFeatureAccess(plan, feature)` as a tier-ordinal comparison (`free=0, premium=1, premium_plus=2, ultimate=3`) against each feature's `minimumTier`, rather than the current single boolean branch.
4. RevenueCat: configure 3 additional entitlement IDs (or one entitlement with tiered product IDs — decide based on what RevenueCat's dashboard supports cleanly for the product catalog) and update `getSubscriptionPlan()`/`purchasePremium()` to map products → the new 4-value type.
5. **Audit every existing call site** of `hasFeatureAccess` (currently in `SnowballSection.tsx`, and the v1.5-v1.8 components if built first) to confirm they pass the right feature key and get correct tier gating under the new system — this is the actual risk of this version, not the type change itself.
6. Export/backup automation: extend `lib/storage/backup.ts` with a scheduled trigger (e.g., a periodic check on app foreground — "if last backup > 7 days ago, auto-export to... " — note: without cloud storage, "automatic backup" on iOS realistically means writing to the Files app via the share sheet's "Save to Files" target, or iCloud Drive if accessible from a sandboxed Capacitor app. Verify iCloud Drive write access is feasible from the WKWebView/Capacitor sandbox before committing to this UX — if not feasible, scope this down to "more prominent backup reminders" rather than true automation).
7. External payment logging UI: add a "Log Payment Made Outside the App" action (likely in `DebtRow`/`ExpenseListItem`'s swipe actions or edit mode) that calls `onMarkRecommendedAction(..., paymentSource: "external")` — the handler already supports this exact parameter, this is purely a missing UI entry point, not new logic.

**Data model changes:** `SubscriptionPlan` type widened (breaking-ish — anything doing exact equality checks like `plan === "premium"` instead of using `hasFeatureAccess` needs auditing too).

**Testing:** this is the highest-test-value version in the whole v1.x sequence — write a regression test matrix: every `PremiumFeature` × every tier → expected boolean, to lock in correct gating before it ships. Re-run the full e2e suite with each of the 4 tiers mocked via `debtPlanner.mockSubscription`.

**Risk:** Medium-high. Not technically hard, but it's the version most likely to introduce a silent "wrong tier got access" bug if the call-site audit (step 5) is rushed.

---

## v1.10 — BNPL Real Calculations + Schema Versioning

**Scope:** Two independent cleanup items bundled for efficiency — biometric app lock was originally slotted here too but moved up to ship as part of v1.2 instead (see the v1.2 addendum at the top of this document).

### BNPL real calculations
**Current state (verified):** `Debt.remainingPayments`/`Debt.scheduledPaymentAmount` are populated by `lib/imports/debtCsv.ts` when `type === "bnpl"`, but `lib/engine/allocatePaycheck.ts` and `lib/debt/projectDebtPayoff.ts` treat every debt identically regardless of type — BNPL installments are typically fixed, interest-free, fixed-count payments (e.g., "4 payments of $87.50"), fundamentally different math from a revolving, interest-accruing credit card.

1. In `lib/debt/projectDebtPayoff.ts`, branch on `debt.type === "bnpl"`: instead of amortizing `balance` against `apr`/`minimumPayment` each month, decrement `remainingPayments` by 1 and reduce `balance` by `scheduledPaymentAmount` each cycle, with **zero interest accrual** (BNPL is APR=0 by definition in this model). Payoff date = `currentDate + remainingPayments * cycle length`, not an amortization calculation.
2. Same branch needed in `lib/engine/allocatePaycheck.ts`'s minimum-payment logic — a BNPL "minimum" each cycle IS the `scheduledPaymentAmount`, not a flexible minimum.
3. Decide: can a user apply extra/snowball payments to a BNPL debt to pay it off early? Realistically most BNPL providers don't allow early payoff to reduce remaining installment count — recommend **excluding BNPL debts from snowball/avalanche extra-payment targeting** (they get paid their fixed schedule and nothing more), which is both more realistic and less work.

### Schema versioning
1. Add a `version: number` field written alongside the existing `debtPlanner.*` keys (or a single new `debtPlanner.schemaVersion` key).
2. New `lib/storage/migrateState.ts` — a migration runner that checks the stored version against the current code's expected version and applies migration functions in sequence. **No migrations needed yet** since this is the first version to track it — this step is purely about having the *mechanism* in place before it's actually needed, so the next schema-breaking change (likely v2.1's household model) doesn't repeat today's "parse error silently wipes everything" problem.
3. Change `loadStoredState`'s silent-fallback-on-parse-error behavior to at least log/flag a corrupted-state event (ties into v1.11's analytics, sequence-dependent — if v1.11 ships first, instrument this then; if this ships first, add a placeholder hook).

**Risk:** Low-medium per item; bundle risk is mainly about scope creep — keep these two strictly independent in implementation so one slipping doesn't block the other.

---

## v1.11 — Analytics + Crash Reporting

**Scope:** Zero instrumentation exists today. This version doesn't ship user-facing features — it makes every future version measurable.

**Recommendation:** **PostHog** for product analytics (has a generous free tier, strong privacy controls/self-host option, which matters for a personal-finance app where users are trusting you with sensitive data) and **Sentry** for crash reporting (industry standard, good Capacitor/React Native-adjacent support).

**Implementation steps:**
1. New `lib/analytics/track.ts` — thin wrapper (`track(event, properties)`) so the rest of the codebase never imports PostHog directly; makes swapping providers later a one-file change.
2. Instrument key funnels: onboarding step completion (from v1.4), paywall view → purchase conversion, feature-gate hit (free user taps a locked feature — critical for knowing what to build/promote next), rollover completion, backup export/import.
3. Sentry: initialize in `app/layout.tsx` for web-rendered errors, plus native-side initialization in the Xcode project for crashes that happen outside the WebView (Capacitor bridge issues, native plugin crashes).
4. **Privacy**: never send debt amounts, balances, names, or any financial figures as event properties — track *that* an action happened, never *what the numbers were*. Write this constraint down in `lib/analytics/track.ts` as a comment so future feature work doesn't accidentally leak financial data into analytics events.

**Risk:** Low technically, but the privacy constraint above is the one thing that must not be gotten wrong — a debt-tracking app leaking even aggregate balance data to a third-party analytics vendor is a real trust/legal exposure. Treat this as a hard rule, not a guideline.

---

## v1.12 — Android Build + Accessibility Audit

**Scope:** Two unrelated large efforts bundled only because both are "platform parity" work, not because they share implementation.

### Android
**Current state (verified):** `@capacitor/android` is an installed dependency, but no `/android` directory exists — Android has never been built even once.

1. `npx cap add android` to generate the project.
2. Android-specific plugin config: `LocalNotifications` icon already has an `iconColor`/`smallIcon` config that's Android-flavored (the current config in `capacitor.config.ts` looks like it was already written with Android in mind) — verify it actually resolves correctly once the Android project exists.
3. RevenueCat: configure Google Play product IDs (separate from the existing App Store product IDs) — this is a RevenueCat dashboard + Google Play Console task, not just code.
4. In-app review: `@capacitor-community/in-app-review` supports both platforms already per its docs — verify the existing `lib/review/requestAppReview.ts` call works unmodified on Android (it should, but confirm on a real device since Google Play's review API has stricter quota/eligibility rules than Apple's).
5. Test the full app on an Android emulator + at least one physical device — pay particular attention to back-button behavior (Android has a hardware/gesture back button with no iOS equivalent; verify it doesn't unexpectedly exit the app from a modal).

### Accessibility audit
1. Systematic pass over every interactive element for `aria-label`/accessible names — some already exist (`settings-icon-button` has one), many don't (icon-only buttons across `DebtRow`, `ExpenseListItem`, swipe actions).
2. VoiceOver (iOS) and TalkBack (Android, once the build exists) manual pass through every tab and modal.
3. Color contrast check for both themes — particularly the status pills (`overdue`, `warning`, etc.) which use color as the primary signal; verify they also convey status via text/icon, not color alone.

**Risk:** High relative to effort estimate — first-time Android builds reliably surface platform-specific surprises (notification permissions flow differs from iOS, back-button handling, different WebView quirks). Treat the size estimate in `ROADMAP.md` ("Large") as a floor, not a ceiling.

---

## v1.13 — Net Worth Tracker + Debt Consolidation/Refinance Calculator

### Net Worth Tracker (Premium+)
1. New minimal `Asset = { id: string; name: string; value: number }` type — deliberately simple (no asset categories/appreciation modeling) for v1, matching the project's "no premature abstraction" pattern.
2. New `lib/hooks/useAssets.ts`, new `debtPlanner.assets` storage key.
3. Net worth = `sum(assets) - sum(debt.balance)`, computed fresh each render (no need to store it).
4. History chart reuses v1.5's `cycleHistory` — extend `PayCycleSnapshot` with a `netWorth` field going forward (existing snapshots won't have it; render gracefully with a gap rather than backfilling, which isn't reliably possible).

### Consolidation/Refinance Calculator (Premium+)
1. New `lib/debt/calculateConsolidation.ts` — pure function: given the current debt list and a hypothetical `{ apr, termMonths }` consolidation loan, compute the new loan's total interest/monthly payment via the *same* amortization math already in `lib/debt/applyDebtPaymentProjection.ts` (reuse, don't reinvent), and compare against the current debts' projected `totalInterestPaid` from `projectDebtPayoff`.
2. New `components/ConsolidationCalculator.tsx` — input the hypothetical loan terms, side-by-side comparison (same visual pattern as Strategy Comparison in `SnowballSection`).
3. Explicitly **does not initiate any real loan** — this is a what-if calculator only, no lending partner integration. Keep the copy clear that this is illustrative, not an offer, to avoid any regulatory implication of operating as a loan originator/broker.

**Risk:** Low-medium for net worth (simple, additive). Low technical risk for the calculator, but **flag the regulatory copy point above as a hard requirement**, not a nice-to-have — a finance app suggesting specific loan terms without the right disclaimers is a real compliance risk.

---

## v1.14 — Shareable Milestone Cards (ships now) + Opt-In Leaderboard (deferred)

**Resequencing note:** per the critical-path dependency at the top of this document, only the shareable-card half of this version ships at v1.14. The leaderboard half moves to ship alongside or just after v2.0's backend foundation.

### Shareable cards (ships at v1.14, no backend needed)
1. Add `@capacitor/share` (not currently installed) for the native share sheet.
2. New `components/ShareableMilestoneCard.tsx` — renders a styled summary (debt-free date, % paid off, current streak) to an offscreen DOM node, captured to an image via a DOM-to-image library (evaluate options at implementation time — keep the dependency footprint small, this app currently has almost no heavy dependencies and that's a deliberate strength worth preserving) or, if simpler, a native screenshot of a dedicated share-preview screen.
3. Trigger from the existing milestone-badge moment (v1.6) — "Share this milestone" action.

### Leaderboard (deferred until backend exists)
- Needs: an account/anonymous-ID system, a server endpoint to submit a percentile-relevant stat (e.g., "% of debt paid off," never raw dollar amounts) and retrieve an aggregate comparison, and real thought about what's worth comparing without being either discouraging or privacy-invasive. Revisit scope entirely once the v2.0 backend exists — don't pre-build against assumptions made today.

---

## v2.0 — AI Recommendations (Claude API)

**Scope:** The biggest architectural shift in the roadmap — first version requiring a server.

### Phase 0: Backend foundation (do this first, unblocks v1.14's leaderboard, v2.1, v2.2 too)
1. Stand up a minimal backend — a Next.js API route layer is the path of least resistance given the app is already Next.js, but note **the current app is statically exported** (`capacitor.config.ts: webDir: 'out'`, implying `next build` with static export for the Capacitor WebView). API routes need a server runtime, which static export doesn't provide. Decide between: (a) a *separate* small backend service (e.g., a lightweight Node/Express or serverless function deployment, decoupled from the statically-exported client app) or (b) restructuring the Next.js app to support both a static client export and server-rendered API routes via a different deployment target. **Recommend (a)** — keep the existing client app's build/deploy story untouched, stand up a thin separate API service the client calls over HTTPS. Lower risk, smaller blast radius on a working app.
2. This backend needs, at minimum: a way to identify a client without full accounts yet (an anonymous device-bound ID is enough for v2.0; full accounts only become necessary at v2.1's household sharing) — store this ID locally, send it with requests for rate-limiting/abuse prevention, nothing else.
3. Set up the Anthropic API key **server-side only**, never shipped in the client bundle.

### Phase 1: AI insights
1. New `lib/ai/buildAIInsights.ts` (client-side) — assembles a structured snapshot of the user's plan (same shape already fed into the existing rule-based `buildSmartInsights`) and sends it to the new backend endpoint.
2. New backend endpoint — receives the snapshot, builds a prompt instructing Claude to return insights in the *exact same shape* as the existing `SmartInsight` type (`title`, `message`, `severity`, `action`), so the existing `components/Results/...` and `SnowballSection` rendering code needs **zero changes** — only the data source changes.
3. Fallback: if the AI call fails/times out, fall back to the existing rule-based `buildSmartInsights` silently — never show an error state for this, since the rule-based engine is a perfectly good degraded experience, not a broken one.
4. This is Ultimate-tier gated; Premium/Premium+ continue getting the rule-based engine they already have. No regression to non-Ultimate users.

**Data sent to the backend**: explicitly enumerate it in code review — paycheck amount, debt balances/APRs/names, bill amounts/names, goal progress. This is real financial data leaving the device for the first time in this app's history; needs a clear privacy policy update and explicit user consent surfaced before first use, not buried in settings.

**Testing:** mock the backend response shape in regression tests to verify the rendering layer handles both AI-sourced and rule-based `SmartInsight[]` identically (since they share a type, this should mostly be free, but verify explicitly). Add a chaos test: backend returns malformed/empty response → fallback triggers correctly.

**Risk:** High. First server, first time financial data leaves the device, first external AI dependency with real latency/cost/failure modes. This is the version to be most conservative and most tested on the whole roadmap.

---

## v2.1 — Household / Multi-Income Support

**Scope:** Now that v2.0 has a backend and an anonymous device ID, this version needs to upgrade that to **real accounts** (so two people's devices can reference the same household), which is a bigger lift than v2.0's anonymous ID alone.

**Implementation steps:**
1. Add real authentication (email magic-link or Sign in with Apple — recommend Sign in with Apple given the app is iOS-first and it requires zero password infrastructure).
2. New household data model on the backend: a household has members, each member can have their own paycheck schedule; bills/debts/goals belong to the household, optionally attributed to a member.
3. **Engine change** (the hard part): `lib/engine/allocatePaycheck.ts` currently takes one `paycheckAmount` + one `nextPaycheckDate`. Multi-income requires either (a) merging multiple paychecks into one combined cash-flow timeline before calling the existing engine once, or (b) a deeper rework of the engine to natively understand multiple income events on different dates. **Recommend (a)** — pre-merge incomes into a single combined timeline of cash-in events feeding the existing engine, rather than rewriting engine internals that are currently well-tested and working. This keeps the blast radius on a financially-critical, already-correct piece of code as small as possible.
4. Permission roles (view-only vs. edit) enforced server-side, not just hidden in the UI.
5. Sync: household data now lives on the backend as source of truth; local storage becomes a cache/offline-fallback layer rather than the source of truth it is today. This is a meaningful architecture inversion — budget real time for it, don't treat it as "just add a sync call."

**Risk:** High. Both a product-complexity risk (shared finances between people is sensitive) and a technical risk (the local-storage-as-truth → backend-as-truth inversion touches almost everything).

---

## v2.2 — Bank Linking (Plaid) — Evaluation Gate, Not a Commitment

Per `ROADMAP.md` §5, this is explicitly a **decision point**, not a guaranteed build. If pursued:

1. Plaid Link SDK integration — Capacitor has no official Plaid plugin; likely a WebView-based Plaid Link flow (Plaid supports a hosted Link flow that works in a webview) rather than a native SDK integration, to avoid building a custom native plugin.
2. Plaid access tokens are exchanged and stored **only on the backend** (built in v2.0/v2.1) — never on the client, ever.
3. A transaction sync job (backend, scheduled) pulls new transactions periodically.
4. Only once real transaction data exists do subscription-audit and spending-categorization features (currently backlog items in `ROADMAP.md` §3) become worth building — they were explicitly deferred because they're not valuable against manually-entered data.

**Recommend:** treat v2.2 as a standalone "spike" — timeboxed technical evaluation (Plaid sandbox integration, cost modeling at expected user volume, compliance review) before committing a full version's worth of roadmap time to it.

---

## v3.0 — AI Chat / Conversational Interface

Builds directly on v2.0's backend + Claude integration.

1. New backend endpoint supporting multi-turn conversation (maintains message history server-side per session, doesn't trust the client to replay full history).
2. Tool use: give Claude function-calling access to query the user's *actual* current plan data server-side (debt list, next paycheck, goals) rather than relying on the user to describe their situation in the chat — this is what makes it actually useful vs. a generic finance chatbot.
3. New `components/AIChat/` — chat UI, likely a new tab or a modal accessible from the Payoff tab.
4. Same fallback philosophy as v2.0: if the AI is unavailable, the chat surface should say so clearly rather than silently failing — unlike the insights fallback (which can silently degrade to rules), a chat interface with no AI behind it doesn't have a meaningful non-AI fallback, so this needs honest unavailability messaging instead.

**Risk:** Medium-high, but lower than v2.0 since the hard architectural problems (backend, AI integration, fallback philosophy) were already solved there.

---

## v3.1 — Apple Watch + Siri Shortcuts

1. New Watch App target in Xcode, sharing the same App Group set up in v1.7 for the widget — reuse that plumbing rather than building parallel data-sharing infrastructure.
2. SiriKit/App Intents for shortcuts like "what's my debt-free date" — read-only queries against the shared App Group data, no new backend dependency.

**Risk:** Medium. Native-only work, but builds on v1.7's already-solved data-sharing pattern rather than starting fresh.

---

## Summary: sequencing risks to watch

1. **v1.9's 3-tier rework should conceptually start now**, even though it's numbered after v1.5-v1.8 — those versions should be built tier-aware from day one to avoid a retrofit.
2. **v1.14's leaderboard half doesn't ship until v2.0's backend exists** — don't build against an assumed backend shape before v2.0 designs it for real.
3. **v2.0 is the hinge point of the entire roadmap** — first server, first external data leaving the device, first AI dependency. Everything after it (v2.1, v2.2, v3.0) builds on decisions made there. Get v2.0's backend foundation right; don't rush it to hit a version-number cadence.
4. **The engine (`lib/engine/allocatePaycheck.ts`) and projection math (`lib/debt/`) are the most load-bearing, best-tested code in the app.** Every version that touches them (v1.6's amortization, v1.10's BNPL, v2.1's multi-income) should reuse existing functions rather than duplicating math, and should include a reconciliation test against the existing engine's output — this is a finance app; silent math disagreements between features are the worst possible bug class.
