# `app/page.tsx` — From Brain to Orchestrator

_**Status (2026-07-02):** v1.5 (step 2.18) executes **Phases 1–2 only**. **Phase 1 DONE** (commit `e40a260`): the debt display-balance derivation → pure `lib/debt/getDebtsWithDisplayBalances.ts` (which also exports `getCompletedSnowballAmount`, now shared with the rollover — removing a duplicate); `livingExpenses` → `lib/hooks/useLivingExpenses.ts`; `handleImportDebtsCsv` → `useDebts.handleImportCsv`. **Phase 2** (JSX componentization) IN PROGRESS — scope corrected below after a before-scan found the original wording stale (much was already extracted in 2.15). **Phases 3–5** (backup hook, plan-exec hook, rollover engine — math-risk) are deferred beyond v1.5 → tracked in [SUSTAINABILITY_REFACTOR.md](SUSTAINABILITY_REFACTOR.md), of which this is one workstream. Last updated 2026-07-02._

## Context

A prior refactor pass (see history below, already executed) split `page.css` into 10 files and extracted several self-contained domain hooks (`useDarkMode`, `useGoals`, `useRequiredExpenses`, `useDebts`, `usePayCycleSettings`, `useSubscription`, `useNotificationsSetting`, `useAppLock`) plus partial component splits (`Debts/`, `RequiredExpenses/`, `Results/`, `Onboarding/`). That pass deliberately left a set of cross-cutting concerns inside `page.tsx`, reasoning at the time that extracting them would "just relocate the coupling, not reduce it."

`page.tsx` is now 1,255 lines (down from 1,683) but still does five jobs beyond orchestration: it owns the plan-execution/recommendation-reconciliation math, the entire backup/snapshot system, the pay-cycle rollover engine (interest + payment application), CSV import wiring, and ~250 lines of inline JSX for chrome (header, bottom nav, settings sheet) that have no business being hand-written at the top level when every other major UI section in this app already lives in its own component.

The goal: `page.tsx` becomes a genuine **orchestrator** — compose hooks, wire their outputs into the one cross-cutting computation (`allocatePaycheck`), and render section components. Nothing else. This plan extracts everything else into hooks, pure functions, and components, following the conventions already established in this codebase (one hook per domain in `lib/hooks/`, pure math in `lib/debt/`/`lib/recurrence/`, component subfolders like `components/Debts/`).

**Hard constraint, same as the prior pass: zero behavior or visual change.** This is restructuring, not redesign. Where a change would alter timing/behavior even slightly (e.g. the rollover math), it gets a reconciliation test, not a shortcut.

**Prior pass, already executed (context only):** CSS split into `app/styles/*.css`; `RequiredExpensesSection`/`DebtsSection`/`ResultsSection` partial splits; the 8 self-contained hook extractions listed above. This plan picks up exactly where that one explicitly stopped.

## Current inventory of what's left in `page.tsx` (1,255 lines)

Verified by reading the full file. Five categories of non-orchestration logic remain:

1. **Plan-execution / recommendation reconciliation** — `payoffStrategy` state+persistence, `completedRecommendedActions` state+persistence, `recommendationOverrides` state (currently unpersisted — pre-existing, not a bug to fix here), `handleMarkRecommendedAction` (goal-balance reconciliation math: reverses/applies a completed action against a goal's `currentAmount`), `getCompletedRecommendedAmountForDebt`.
2. **Backup/snapshot system** — `buildBackupData`, `saveResetSnapshot`, `handleExportBackup`, `handleImportBackup`, `handleResetToToday`. Untyped today (`buildBackupData`'s return value and `readBackupFile`'s parsed result are both bare object/`unknown` shapes — confirmed no `DebtPlannerBackup` type exists in `lib/storage/debtPlannerStorage.ts`).
3. **Pay-cycle rollover engine** — `handleRolloverPayCycle`: interest calculation (`calculateMonthlyInterest`), minimum/snowball payment application, balance reduction, date advancement, notification scheduling, app-review trigger. Confirmed `lib/recurrence/rolloverPayCycle.ts`'s `rolloverDebts`/`rolloverRequiredExpenses` only reset flags and advance due dates — none of the actual interest/payment math lives there yet.
4. **CSV import wiring** — `handleImportDebtsCsv` (parses, calls `setDebts`, shows an alert) — thin, but logically belongs with `useDebts.ts`, which already owns `setDebts` and every other debt mutation.
5. **~250 lines of inline JSX chrome** — the hero/header block (title, last-saved indicator, status toast, theme toggle, dev-only buttons), the bottom nav (4 buttons), and the entire plan-settings overlay (onboarding branch + settings-sheet branch with its notifications card, App Lock card, legal links) — none of this is in its own component today, unlike every other major section (`ResultsSection`, `DebtsSection`, `SnowballSection`, etc.).

Also still inline but judged **fine to leave**: `debtsWithDisplayBalances`/`activeDebts`/`paidOffDebts` derivation (small, but cross-domain — see Phase 1 below for why it moves anyway), `livingExpenses` (one state + one effect, currently inline), the `result` useMemo (this **is** the orchestrator's core job, stays), `isMounted`/`isUnlocked` mount-and-lock gates, `activeTab`/`billsView` nav state, `statusMessage`+its clear-timeout effect, `lastSavedAt`+its autosave effect, `handlePullToRefresh`, `handlePopulateDemoData`.

## Plan — five extraction phases, ordered low-risk-mechanical → highest-math-risk

### Phase 1 — Mechanical relocations (no logic change)
- Move `handleImportDebtsCsv` into `lib/hooks/useDebts.ts` as `handleImportCsv` (it already imports `parseDebtCsv` and owns `setDebts`; page.tsx just calls `useDebts(...).handleImportCsv`).
- Move `livingExpenses` state + its persistence effect into a new `lib/hooks/useLivingExpenses.ts` (one state, one effect — same shape as the other domain hooks, closes the one remaining inconsistency).
- Extract `getDebtDisplayBalance` + the `debtsWithDisplayBalances`/`activeDebts`/`paidOffDebts` derivation into a new pure function `lib/debt/getDebtsWithDisplayBalances.ts` taking `(debts, completedRecommendedActions)` → `{ activeDebts, paidOffDebts }`. Pure, testable in isolation, removes ~15 lines of inline derivation.

### Phase 2 — JSX componentization (no logic change, just relocation + prop-drilling)

**Scope corrected 2026-07-02 after a before-scan against current `page.tsx`** (the original Phase 2 wording predated the 2.15 Settings UX rework and the iPad sidebar work, and had gone stale — see below). Mirrors the existing `components/Debts/`, `components/RequiredExpenses/`, `components/Onboarding/` folder convention:

- `components/AppHeader.tsx` — the **tab-aware hero** (per-tab h1/subtitle for Plan/Bills/Payoff/Goals), the last-saved indicator, the status toast, and the dev-only **RC Reset** button. Moves `formatLastSaved` with it. _(The theme toggle and Populate-Demo-Data buttons the original plan listed here are no longer in the hero — they moved into `PlanSettingsBody` during 2.15.)_
- `components/AppNav.tsx` — **both** the `.bottom-nav` (phone) **and** the `.sidebar-nav` (iPad, incl. its Settings button). Renamed from the original plan's `BottomNav` because it's really the responsive app nav; takes `activeTab` + `onSelectTab` + `onToggleSettings` + `showPlanSettings`.
- `components/PlanSettings/PlanSettingsSheet.tsx` — unifies the **two** shells that currently wrap `<PlanSettingsBody>` (the returning-user `.plan-settings-accordion` and the first-run `.settings-overlay > .settings-sheet`), collapsing the duplicated ~40-prop pass-through into a single call site. Takes `PlanSettingsBodyProps` + `showPlanSettings` + `onCloseSheet`.

**Already done before this phase (drift the original plan didn't reflect):** `components/PlanSettings/PlanSettingsBody.tsx` was extracted in 2.15 and already contains the Notifications card, App Lock card, Appearance/theme card, danger zone, and legal-links row. So the original plan's `NotificationsCard.tsx` / `AppLockCard.tsx` / `LegalLinks.tsx` splits are **moot** — those are cohesive blocks inside one focused component. Splitting them into separate files is deferred to the file-structure sustainability slice (no behavior gain, would churn a focused file).

These components take a lot of props (`PlanSettingsSheet` touches nearly every domain) — that's the accepted pattern in this codebase (`OnboardingFlow` takes ~30 props today); not a reason to avoid the split.

### Phase 3 — Backup/snapshot domain → `lib/hooks/usePlannerBackup.ts`
- New `DebtPlannerBackup` type in `lib/storage/debtPlannerStorage.ts`, matching `buildBackupData`'s current shape — replaces the untyped object and types `readBackupFile`'s result properly.
- New hook owns: `buildBackupData`, `saveResetSnapshot`, `handleExportBackup`, `handleImportBackup`, `handleResetToToday`. Takes every domain value + setter it currently closes over as parameters (same pattern as `useSubscription`/`useNotificationsSetting` taking cross-domain params) — this is a wide-signature hook by necessity, not a design flaw.
- `useDebts`/`useRequiredExpenses` currently take `saveResetSnapshot` as a constructor parameter — after this phase, that parameter comes from `usePlannerBackup`'s return value instead of being defined inline in `page.tsx`. Verify hook initialization order in `page.tsx` still resolves (the backup hook will need to exist before being passed into `useDebts`/`useRequiredExpenses`, but it also needs their state as input — likely resolved the same way `saveResetSnapshot` is forward-referenced today via function-not-const-arrow declaration, or by restructuring `usePlannerBackup` to take getters instead of values).

### Phase 4 — Plan-execution domain → `lib/hooks/usePlanExecution.ts`
- Owns: `payoffStrategy` state+persistence, `completedRecommendedActions` state+persistence, `recommendationOverrides` state (unpersisted, same as today), `handleMarkRecommendedAction`, `getCompletedRecommendedAmountForDebt`.
- Takes `goals`/`setGoals` as parameters (the reconciliation math reads and writes goals) and `saveResetSnapshot` from Phase 3's hook (the existing behavior already calls it after marking an action).

### Phase 5 — Rollover engine (highest risk, do last)
- Add a new pure function to `lib/recurrence/rolloverPayCycle.ts` (or a sibling `lib/debt/applyRolloverPayments.ts` if that reads cleaner) that takes `(debts, completedRecommendedActions)` and returns debts with interest applied and minimum+snowball payments deducted — extracting exactly the math currently inline in `handleRolloverPayCycle`'s `.map()` (lines ~614-655 today), reusing `calculateMonthlyInterest` which is already a small pure function.
- `handleRolloverPayCycle` itself moves into `usePlanExecution.ts` (it clears `completedRecommendedActions` and reads `payoffStrategy`-adjacent state) or a dedicated `useCycleRollover.ts` if `usePlanExecution` is getting too wide — decide at implementation time based on actual line count. It calls the new pure function, then `rolloverDebts`/`rolloverRequiredExpenses` (unchanged), advances dates via `usePayCycleSettings`'s setters, and triggers notifications/app-review exactly as today.
- **Mandatory reconciliation test**: a regression test (in `lib/testing/`, alongside the existing debt-math regression suite) asserting the new pure rollover-payment function produces identical output to manually tracing today's inline logic for a representative case (debt with interest + partial minimum + snowball spillover) — this is a finance app; this is the one phase where "looks the same" isn't enough without a test backing it.

## Expected end state

`page.tsx` should shrink from 1,255 lines to roughly **400-500 lines**: imports, ~12 hook calls, the `result` useMemo, the `isMounted`/`isUnlocked` gates, `activeTab`/`billsView` state, and a JSX tree that's almost entirely `<AppHeader>`, a tab-switch rendering the existing section components, `<BottomNav>`, and `<PlanSettingsSheet>`. No backup logic, no rollover math, no goal-reconciliation math, no CSV parsing, no hand-written settings-sheet markup.

## Order of operations

1. Phase 1 (mechanical relocations)
2. Phase 2 (JSX componentization)
3. Phase 3 (backup/snapshot hook)
4. Phase 4 (plan-execution hook)
5. Phase 5 (rollover engine + reconciliation test)

Commit after each phase so any regression can be bisected to one small change — same discipline as the prior refactor pass. Before considering the whole pass done, run `npm run validate:release` (lint + regression + e2e + build).

## Verification (per phase, escalating for Phase 5)

- **Phases 1-2:** `npx tsc --noEmit`, `npm run lint`, manual dev-server check (all 4 tabs, settings sheet, both themes) — pure relocation, no regression-test need.
- **Phase 3:** above, plus a manual export → import round trip and one "Reset to Today" exercise.
- **Phase 4:** above, plus manually marking and un-marking a recommended action against a goal to confirm the reconciliation math still nets to zero.
- **Phase 5:** above, plus the new reconciliation regression test, plus `npm run test:regression` in full, plus one real "Start Next Pay Cycle" exercise with a debt carrying interest + a partial minimum + a snowball payment, checked against the pre-refactor balance by hand.
