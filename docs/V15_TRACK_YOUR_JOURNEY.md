# v1.5 — Track Your Journey

_Part of the [Implementation Plan](IMPLEMENTATION_PLAN.md). **Status: 🔄 In progress — active build on `v1.5-dev`; Pay Cycle History (1) done 2026-07-01, next is the Amortization tiering decision + build (3).** This is the dedicated build + release checklist for v1.5. Every box below must be checked to qualify for release. Last updated: 2026-07-01._

**Theme:** Everything that helps users understand where they've been and celebrate how far they've come. Pay Cycle History is the data foundation; milestones, streaks, amortization, and charts make that data meaningful.

**Size:** Large. This is the biggest v1.x release — six user-facing features, two internal refactor phases, mobile polish, and Android groundwork. Treat it as a milestone, not a quick turn.

---

## Status at a glance

| # | Workstream | Tier | Status |
|---|---|---|---|
| 1 | Pay Cycle History (data foundation) | Premium / Premium+ | ✅ Done (2026-07-01) |
| 2 | Debt Milestones + Payoff Celebration | Free / Premium+ | ⬜ Not started |
| 3 | Amortization Calendar | Premium+ | ⬜ Not started |
| 4 | Streaks | Free / Premium+ | ⬜ Not started |
| 5 | UX #13 — Since-Last-Cycle Delta | All | ⬜ Not started |
| 6 | UX #15 — Settings UX Rework | All | ⬜ Not started |
| 7 | Mobile P5 — Context-aware skeletons | All | ⬜ Not started |
| 8 | Mobile P6 — Micro-interaction pass | All | ⬜ Not started |
| 9 | Mobile P10 — Timeline overflow *(conditional)* | All | ⬜ Deferred unless triggered |
| 10 | Page Orchestrator Phases 1–2 (internal) | — | ⬜ Not started |
| 11 | Android prep (Play Console + Maestro) | Infra | ⬜ Not started |

**Build order:** Pay Cycle History (1) is the data dependency for Milestones (2), Streaks (4), and the Delta indicator (5) — build it first. Amortization (3) is independent. Mobile polish (7, 8) and Android prep (11) can run in parallel anytime. Settings rework (6) needs a decision before code (see §6). Page Orchestrator (10) is internal and can interleave.

---

## What "qualify for release" means

Per [RELEASE_CONFIDENCE.md](RELEASE_CONFIDENCE.md), v1.5 ships **only** when all of:

1. Every new calculation has a regression test in the same commit that introduces it.
2. Anything touching money has a **reconciliation check** against an existing function it should mathematically agree with — specifically, Amortization Calendar interest must reconcile with `projectDebtPayoff`.
3. Every new premium-gated feature calls `hasFeatureAccess` — no ad-hoc `subscriptionPlan === "premium"` string checks.
4. The full gate at the bottom of this doc (§Definition of Done) is green: tests, QA, build, store submission.

No feature ships at Medium or Low confidence without a written exception recorded in RELEASE_CONFIDENCE.md.

---

## 1 — Pay Cycle History (build first; everything else depends on it)

**Current state:** `handleRolloverPayCycle` in `app/page.tsx` advances dates and recalculates debt balances but discards the prior cycle's state entirely.

**New type** (add to `lib/storage/debtPlannerStorage.ts`):
```ts
export type PayCycleSnapshot = {
    cycleEndDate: string;
    totalDebtBalance: number;
    totalPaidThisCycle: number;
    completedRecommendedActions: CompletedRecommendedAction[];
    payoffStrategy: "snowball" | "avalanche";
};
```

**Build steps:**
- [ ] Add the `PayCycleSnapshot` type + `debtPlanner.cycleHistory` storage key to `lib/storage/debtPlannerStorage.ts`.
- [ ] New `lib/hooks/usePayCycleHistory.ts` — owns `cycleHistory: PayCycleSnapshot[]` state + persistence; exposes `recordCycleSnapshot(snapshot)`, a tier-aware `visibleHistory` getter (6 cycles for Premium, full array for Premium+), and a `previousSnapshot` getter (most recent snapshot or `null`, used by #13).
- [ ] In `handleRolloverPayCycle`, call `recordCycleSnapshot(...)` with **pre-rollover** state, **before** mutating debts or clearing completed actions.
- [ ] New `components/HistorySection.tsx` — list/chart of past cycles, gated via `hasFeatureAccess` (Premium = capped list with an upsell row at the cap; Premium+ = full list).
- [ ] New entry point: a "View Pay Cycle History" row inside Plan Settings — **not** a 5th bottom-nav tab.

**Tier:** Premium = last 6 cycles; Premium+ = unlimited.

**Tests required:**
- [ ] Regression: one rollover produces exactly one snapshot with correct `totalDebtBalance` / `totalPaidThisCycle`.
- [ ] Regression: tier-aware `visibleHistory` returns 6 for Premium, all for Premium+.
- [ ] E2E: History view shows capped vs. uncapped per mocked tier (`debtPlanner.mockSubscription`).

**Files:** `lib/storage/debtPlannerStorage.ts`, `lib/hooks/usePayCycleHistory.ts` (new), `app/page.tsx`, `components/HistorySection.tsx` (new).

**Risk:** Low — additive; one snapshot-write call inside an existing handler.

---

## 2 — Debt Milestones + Payoff Celebration

**Build steps:**
- [ ] New `lib/debt/computeMilestones.ts` — pure function comparing `debt.balance` against `debt.originalBalance` per debt; returns crossed thresholds (25/50/75/100%) plus an "all debts paid off" check.
- [ ] New `components/MilestoneBadge.tsx` — celebration card/toast triggered when a rollover crosses a threshold.
- [ ] **Debt payoff celebration (UX #19b):** when a debt crosses 100% on rollover, trigger a distinct paid-off experience — `triggerMediumHaptic()`, full-width celebration card with confetti-style animation, debt's name prominently displayed. This is the emotional peak of the app — **do not ship a subdued version.** See [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) (#19b).
- [ ] Wire the celebratory entrance through Mobile P6's motion (see §8) rather than an instant appear.

**Tier:** Free (badges); Premium+ (calendar context on the celebration card).

**Tests required:**
- [ ] Regression: `computeMilestones` returns correct crossed thresholds for 0/25/50/75/100% and the all-paid-off case; edge cases — `originalBalance` unset, balance increased.

**Files:** `lib/debt/computeMilestones.ts` (new), `components/MilestoneBadge.tsx` (new), rollover handler wiring in `app/page.tsx`.

---

## 3 — Amortization Calendar (Premium+)

**Build steps:**
- [ ] New `lib/debt/buildAmortizationSchedule.ts` — loops the existing `lib/debt/applyDebtPaymentProjection.ts` (single-month step) to produce a month-by-month schedule until payoff. **Reuse, don't reinvent.**
- [ ] New `components/AmortizationCalendar.tsx` — per-debt table/calendar view, reachable from each debt row via "View Schedule", gated via `hasFeatureAccess`.

**Tier:** Premium+.

**Tests required (mandatory — finance math):**
- [ ] **Reconciliation test:** `buildAmortizationSchedule`'s total interest must equal `projectDebtPayoff`'s `totalInterestPaid` for identical inputs. Silent math disagreement in a finance app is the worst bug class — this test is non-negotiable.
- [ ] Regression: schedule terminates at payoff; final balance is exactly 0; zero-APR and already-paid-off debts handled.

**Files:** `lib/debt/buildAmortizationSchedule.ts` (new), `components/AmortizationCalendar.tsx` (new), debt-row entry point.

**Risk:** Medium — the reconciliation test is where the time goes. Budget for it.

---

## 4 — Streaks

**Build steps:**
- [ ] Derive from `cycleHistory`: count consecutive snapshots where `totalPaidThisCycle >= totalRequired`.
- [ ] Surface as a small stat near the Plan tab top — Free gets the count; Premium+ gets the historical chart (reuse the History view).

**Tier:** Free (count) + Premium+ (chart).

**Tests required:**
- [ ] Regression: streak count for a run of qualifying snapshots, a broken streak, and an empty history (→ 0).

**Files:** streak derivation (likely in `usePayCycleHistory.ts` or a small `lib/debt/computeStreak.ts`), Plan-tab stat render.

---

## 5 — UX #13: Since-Last-Cycle Delta Indicator

_Depends on #1 cycle history. Must not be built before it lands._

**Build steps:**
- [ ] Use `usePayCycleHistory.ts`'s `previousSnapshot` getter.
- [ ] Compute `delta = previousSnapshot.totalDebtBalance - currentTotalDebt`. `delta > 0` (debt reduced) → green `↓ $X`; `delta < 0` → amber `↑ $X`; no previous snapshot → render nothing.
- [ ] Apply `font-variant-numeric: tabular-nums` to the delta value.

**Files:** `lib/hooks/usePayCycleHistory.ts`, `components/ResultsSection.tsx`, `app/styles/03-nav-results-modals.css` (new `.summary-strip-delta`). See [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) #13.

---

## 6 — UX #15: Settings UX Rework

**⚠️ Decision required before any code.** Two viable approaches (see [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) #15):
1. **Accordion / in-place expansion** in the existing settings surface (lighter for one-field tweaks).
2. **Dedicated Settings tab** — 5th bottom-nav item (simpler, but 5 items at 375px may crowd).

**Build steps:**
- [ ] Pick the approach (record the decision in this section before building).
- [ ] Implement the chosen pattern.
- [ ] **Verify it works in first-run onboarding context** — the settings modal is reused there (v1.4). Either confirm the accordion works first-run, or keep the modal form for first-run only and switch to the accordion for returning-user settings.

**Files:** `app/page.tsx`, `components/PlanSettings/PlanSettingsSheet.tsx` (or its Page-Orchestrator-Phase-2 successor), `app/styles/03-nav-results-modals.css`.

---

## 7 — Mobile P5: Context-Aware Skeleton Loading

**Build steps:**
- [ ] Split `components/AppSkeleton.tsx` into shape-specific pieces (debt-row-shaped, plan-summary-shaped) composing the same loading screen — reuse the existing `skeletonShimmer` keyframe; this is a structure change, not a new animation.
- [ ] Render the composed skeleton matching whichever tab would be active on load.

**Files:** `components/AppSkeleton.tsx` → likely a new `components/Skeleton/` directory. See [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) P5.

**Verification:** Visual only — silhouette roughly matches real content per tab. **Risk:** Low.

---

## 8 — Mobile P6: Micro-Interaction Pass

**Build steps:**
- [ ] Audit every button variant (`.primary-button`, `.secondary-button`, icon-only, swipe-action) for consistent `:active` treatment; fix gaps rather than inventing new treatments.
- [ ] Apply the existing `planItemReveal` keyframe to newly-added items on Bills/Debts/Goals tabs (not just Plan).
- [ ] Give the milestone badge (§2) a celebratory entrance (scale+fade, existing easing).

**⚠️ The one real correctness risk:** animations must fire **only on genuinely new items**, not the whole list on every re-render. Use stable per-item `key`s + animation-on-mount scoped to new DOM nodes, not a re-triggerable class toggle.

**Files:** `app/styles/09-anim-swipe-media-misc.css`, list-rendering components (`DebtGroup.tsx`, expense list parent, `GoalsSection.tsx`), `components/MilestoneBadge.tsx`. See [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) P6.

**Verification:** Add a debt/expense/goal → confirm only the new item animates. **Risk:** Low-medium (the new-items-only requirement).

---

## 9 — Mobile P10: Timeline Cycle Item Overflow *(conditional)*

- [ ] **Build only if** real usage data shows cycles consistently reaching 30+ items. Otherwise defer — do not build speculatively. See [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) P10.

---

## 10 — Page Orchestrator Phases 1–2 (internal, no user-visible change)

**Hard constraint:** zero behavior or visual change. See [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md).

**Phase 1 — mechanical relocations:**
- [ ] Move `handleImportDebtsCsv` → `lib/hooks/useDebts.ts` as `handleImportCsv`.
- [ ] Move `livingExpenses` state + persistence effect → new `lib/hooks/useLivingExpenses.ts`.
- [ ] Extract debt display-balance derivation → new pure `lib/debt/getDebtsWithDisplayBalances.ts`.

**Phase 2 — JSX componentization:**
- [ ] `components/AppHeader.tsx` (hero block).
- [ ] `components/BottomNav.tsx` (4-button nav).
- [ ] `components/PlanSettings/PlanSettingsSheet.tsx` + `NotificationsCard.tsx` + `AppLockCard.tsx` + `LegalLinks.tsx`.

**Verification:** `npx tsc --noEmit`, `npm run lint`, manual dev-server check (all 4 tabs, settings sheet, both themes). Commit after each phase so regressions bisect cleanly. (Phases 3–5 are v1.6/v1.8 — not this release.)

---

## 11 — Android prep (starts here; does NOT block v1.5 shipping)

The Android build itself is v1.7, but its slowest dependencies have zero code coupling and start now. See [ANDROID_READINESS.md](ANDROID_READINESS.md).

- [ ] **Kick off Google Play Console signup** — $25 + identity/D-U-N-S verification can take days-to-weeks. Single slowest gate to an Android launch; blocks nothing in v1.5. Start first.
- [ ] **Stand up Maestro** native smoke tests (`.maestro/*.yaml`) on an Android emulator + iOS simulator. Smoke flows: launch → onboarding → add a debt → see the plan → open paywall → toggle app lock. Keep `NEXT_PUBLIC_BYPASS_REVENUECAT` for emulator runs (IAP can't complete in CI).

_These are groundwork — they don't gate the v1.5 App Store release. Track them but don't let them hold the ship._

---

## Pre-release QA checklist (run before locking the build)

_Extends [release-qa-checklist.md](release-qa-checklist.md) with v1.5-specific flows._

**New-feature flows:**
- [ ] Rollover records exactly one history snapshot with correct totals
- [ ] Pay Cycle History: Premium shows 6 cycles + upsell row; Premium+ shows all
- [ ] Milestone badge fires at 25/50/75% crossings on rollover
- [ ] Debt payoff celebration fires at 100% (haptic + confetti + debt name)
- [ ] Amortization Calendar opens per debt; final balance lands at exactly $0
- [ ] Streak count increments on a qualifying cycle, resets on a missed one
- [ ] Since-last-cycle delta shows green ↓ / amber ↑ / nothing (no prior snapshot)
- [ ] Settings rework works for both returning users **and** first-run onboarding
- [ ] Skeletons match the active tab's silhouette on load
- [ ] Only newly-added list items animate (no full-list re-animation on unrelated state changes)

**Regression (existing flows still pass):**
- [ ] All Core flows from [release-qa-checklist.md](release-qa-checklist.md)
- [ ] Financial accuracy block (APR, payoff date, snowball/avalanche ordering, living reserve, partial redistribution)

**Devices / display:**
- [ ] iPhone Safari — portrait + landscape
- [ ] iPad — portrait + landscape (sidebar nav, two-column layouts)
- [ ] Dark mode readable across all new surfaces (history, calendar, badges)

---

## Release gate (must all pass)

- [ ] `npm run lint` passes
- [ ] `npm run test:regression` passes — **including** every new test listed above and the Amortization reconciliation test
- [ ] E2E (`tests/e2e/`) passes, including new History/tier specs
- [ ] `npm run build` (production) clean
- [ ] `npm run validate:release` (lint + regression + e2e + build) green
- [ ] [RELEASE_CONFIDENCE.md](RELEASE_CONFIDENCE.md) updated: every new feature rated **High**, with its reconciliation/edge-case evidence recorded
- [ ] Lighthouse production check

---

## Version + store submission

- [ ] Bump version + build number in `ios/App/App.xcodeproj/project.pbxproj`
- [ ] Write `docs/release-notes/v1.5.md` — promotional text, "What's New" copy, description edits, review notes
- [ ] Update iPhone/iPad screenshots if any new surface warrants it (History, Amortization, milestone celebration)
- [ ] Trigger CodeMagic build (handles cap sync, pod install, signing, archive, upload)
- [ ] App Store Connect: paste promo text + "What's New", apply description edits, set release mode, submit for review

---

## Definition of Done (release qualification)

v1.5 qualifies for release when **all** of the following are true:

1. ✅ Workstreams 1–8 and 10–11 complete (9 only if triggered); each checkbox above ticked.
2. ✅ Every new calculation has a regression test; Amortization reconciles with `projectDebtPayoff`.
3. ✅ Every premium gate routes through `hasFeatureAccess` (audited — no string equality checks).
4. ✅ Release gate green (lint, regression, e2e, build, validate:release, Lighthouse).
5. ✅ RELEASE_CONFIDENCE.md updated — all v1.5 features at High confidence.
6. ✅ QA checklist fully run on iPhone + iPad, portrait + landscape.
7. ✅ Build submitted via CodeMagic and store metadata updated.

When approved + live, run the **post-release docs pass**: flip status to shipped across ROADMAP / IMPLEMENTATION_PLAN / RELEASE_CONFIDENCE, check off `release-notes/v1.5.md`, then archive this doc and the v1.5 release notes into `docs/archive/`.
