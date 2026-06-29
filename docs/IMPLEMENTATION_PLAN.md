# Implementation Plan

_Technical companion to `ROADMAP.md`. Defines how each version is built: data model changes, files touched, sequencing, and testing. Last updated: 2026-06-28._

## Document map

| Topic | Document |
|---|---|
| v1.4 Onboarding (core ✅ DONE, polish ⏳ pending) | [V14_ONBOARDING.md](V14_ONBOARDING.md) |
| UX polish backlog (28 audit items, versioned) | [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) |
| v1.7 and beyond | [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) |
| Mobile polish (P1–P9) | [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) |
| Page orchestrator refactor (Phases 1–5) | [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md) |
| Product roadmap, tier definitions, version table | [ROADMAP.md](ROADMAP.md) |
| Original UX audit findings | [premium-ux-audit.md](premium-ux-audit.md) |

---

## Critical path dependency

Four features independently require a **backend** that doesn't exist today (the app is 100% client-side, `localStorage`-only):

- **v1.11** — opt-in leaderboard (server needed to aggregate anonymous percentiles)
- **v2.0** — AI Recommendations (Anthropic API key must never be client-side)
- **v2.1** — Household/Multi-Income (accounts + sync, not local storage)
- **v2.2** — Bank Linking (Plaid tokens must stay server-side)

**Decision: build the backend once as Phase 0 of v2.0.** v1.11's leaderboard ships its non-backend half (shareable cards) at v1.11; the leaderboard half defers until the v2.0 backend exists.

---

## Version summary

| Version | Status | Focus |
|---|---|---|
| v1.2 | ✅ Shipped | Notifications, App Lock, Demo Mode, App Store compliance, Mobile Polish P1a/P2/P9a |
| v1.3 | ✅ Shipped | iPad support + native polish, landscape layouts, Delete All Data, UI/UX Polish Pass |
| v1.4 | ✅ Shipped | Core onboarding + timeline fix + 22 UX/Mobile polish items + Payoff Trajectory Chart (#1a) + Cash Flow Status Bars (#1b) + Per-Debt Progress Bars (#1c) |
| v1.5 | ⬜ Next | Pay Cycle History + Debt Milestones + Amortization Calendar + Streaks + remaining UX polish (#13, #15) |
| v1.6 | ⬜ Planned | Foundation: 3-tier subscription infra + analytics + crash reporting + schema versioning + backup automation + external-payment logging |
| v1.7+ | ⬜ Long-term | Android, Multi-Scenario Planning, Widget, AI, ... — see [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) |

---

## v1.4 — Timeline bug fix: multi-cycle view

**Bug:** `buildTimelineItems` only included transactions due *before* `nextPaycheckDate` (strict `<`). Bills due on or after that date were silently excluded, so the "Balance" readout at the bottom of the timeline was inflated — it didn't reflect the bills the next paycheck would handle. Users saw a cushion that looked larger than it was.

**Root cause:** `isDueInCycle` in both `allocatePaycheck.ts` (line 92) and `buildTimelineItems.ts` (line 71) uses `due < next`, which excludes anything landing on the next paycheck date itself and everything beyond it. For biweekly payers with bills spread across the full month, roughly half their bills were invisible.

**Fix:** Replaced the single-cycle flat list with a multi-cycle accordion. `buildMultiCycleTimeline` (new, `lib/timeline/buildMultiCycleTimeline.ts`) projects up to 3 pay cycles forward using the existing `rolloverRequiredExpenses` / `rolloverDebts` pattern, calling `allocatePaycheck` + `buildTimelineItems` per cycle. The UI (updated `components/TimelineSection.tsx`) renders each cycle as a collapsible section — current cycle expanded by default, future cycles collapsed — with a date-range header and an ending-balance chip color-coded by cushion status (stable ≥$200, tight $100–199, pressure <$100).

**Files touched:**
- `lib/timeline/buildMultiCycleTimeline.ts` — new, multi-cycle projection
- `components/TimelineSection.tsx` — multi-cycle accordion UI
- `app/styles/05-timeline-whatif.css` — cycle header + balance chip styles
- `app/page.tsx` — passes `goals`, `livingExpenses`, `payCycleConfig`, `strategy` to `TimelineSection`

**No data model changes.** All new logic is pure computation over existing state.

**Risk:** Low. The current-cycle items are identical to before; the only addition is projected future cycles. Projected cycles show only mandatory outflows (no completed actions), so they err on the side of showing less rather than more.

### v1.4 addendum — Cash buffer + debt math fixes (2026-06-27)

**Cash buffer as timeline item:** The `$50 paycheckBuffer` was allocated by the engine but invisible in the timeline, creating a gap between the timeline's ending balance and the plan view's `flexibleCashAvailable`. `buildTimelineItems` now emits a `"buffer"` type item ("Cash Buffer 🔒", status "Reserved") dated `nextPaycheckDate` so it sorts after required bills. Item only appears when the engine actually allocated a buffer (shortfall = 0, remaining > 0). Cycle ending balance now equals `flexibleCashAvailable` exactly.

**Debt interest accumulation:** `projectDebtPayoff` called `roundMoney()` after each monthly interest addition, accumulating up to ~$3 of drift over long projections. Changed to raw accumulation with a single `roundMoney()` at the return. Affects display-only `totalInterestPaid` (Smart Insights, Strategy Comparison) — no impact on debt balances or payoff dates.

**Files touched:**
- `lib/timeline/buildTimelineItems.ts` — added `"buffer"` to `TimelineItem.type`, buffer item emission
- `components/TimelineSection.tsx` — icon (🔒) and status label ("Reserved") for buffer type
- `lib/debt/projectDebtPayoff.ts` — removed intermediate `roundMoney` on interest accumulation
- `lib/testing/testMultiCycleTimelineRegression.ts` — 3 new buffer regression tests

### v1.4 addendum — Onboarding E2E spec (2026-06-27)

`tests/e2e/onboarding-flow.spec.ts` — 5 tests, 20 runs (4 projects), all green. Covers: complete flow with data persistence, skip paycheck, skip first debt, demo mode gate, and exit-demo re-trigger. Key fix in spec: `.filter({ visible: true })` on the nav selector, required because iPad hides `.bottom-nav` at 834px+ breakpoint.

---

## v1.5 — Track Your Journey: History, Milestones, Charts & Progress Polish

**Theme:** Everything that helps users understand where they've been and celebrate how far they've come. Pay Cycle History is the data foundation; milestones, streaks, amortization, and charts are what make that data meaningful. Combining these in one release gives the version a clear, coherent story for the App Store.

### Pay Cycle History

**Current state:** `handleRolloverPayCycle` in `app/page.tsx` advances dates and recalculates debt balances but discards the prior cycle's state entirely.

**New type:**
```ts
export type PayCycleSnapshot = {
    cycleEndDate: string;
    totalDebtBalance: number;
    totalPaidThisCycle: number;
    completedRecommendedActions: CompletedRecommendedAction[];
    payoffStrategy: "snowball" | "avalanche";
};
```

**Implementation steps:**
1. New `lib/hooks/usePayCycleHistory.ts` — owns `cycleHistory: PayCycleSnapshot[]` state + `debtPlanner.cycleHistory` persistence, exposes `recordCycleSnapshot(snapshot)` and a tier-aware `visibleHistory` getter (6 cycles for Premium, full array for Premium+).
2. In `handleRolloverPayCycle`, call `recordCycleSnapshot(...)` with pre-rollover state **before** mutating debts or clearing completed actions.
3. New `components/HistorySection.tsx` — list/chart of past cycles, gated via `hasFeatureAccess` (Premium = capped list with upsell row at cap, Premium+ = full list).
4. New nav entry point: "View Pay Cycle History" row inside Plan Settings — not a 5th bottom-nav tab.

**Files touched:** `lib/storage/debtPlannerStorage.ts`, `lib/hooks/usePayCycleHistory.ts` (new), `app/page.tsx`, `components/HistorySection.tsx` (new).

**Tier:** Premium = last 6 cycles; Premium+ = unlimited.

**Risk:** Low. Additive, one snapshot-write call inside an existing handler.

### Debt Milestones + Payoff Celebration

1. New `lib/debt/computeMilestones.ts` — pure function comparing `debt.balance` against `debt.originalBalance` per debt; returns crossed thresholds (25/50/75/100%) plus an "all debts paid off" check.
2. New `components/MilestoneBadge.tsx` — celebration card/toast triggered when a rollover crosses a threshold.
3. **Debt payoff celebration (#19b):** When a debt crosses 100% on rollover, trigger a distinct paid-off experience — `triggerMediumHaptic()`, full-width celebration card with confetti-style animation, debt's name prominently displayed. This is the emotional peak of the app — don't ship a subdued version. See [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) (#19b).

**Tier:** Free (badges); Premium+ (calendar context on the celebration card).

### Amortization Calendar (Premium+)

1. New `lib/debt/buildAmortizationSchedule.ts` — loops `lib/debt/applyDebtPaymentProjection.ts` (single-month step, already exists) to produce a month-by-month schedule until payoff. Reuse, don't reinvent.
2. New `components/AmortizationCalendar.tsx` — per-debt table/calendar view, accessible from each debt row via "View Schedule", gated via `hasFeatureAccess`.
3. **Mandatory reconciliation test:** verify `buildAmortizationSchedule`'s total interest matches `projectDebtPayoff`'s `totalInterestPaid` for identical inputs. Silent math disagreement in a finance app is the worst bug class.

### Streaks

Derived from `cycleHistory`. Count consecutive snapshots where `totalPaidThisCycle >= totalRequired`. Surface as a small stat near the Plan tab top — Free tier gets the count; Premium+ gets the historical chart (reuses History view).

### UX polish shipping in v1.5

- **#1 — Debt Payoff Trajectory Chart** ✅ DONE in v1.4 — `buildPayoffTrajectory.ts` + SVG chart in `SnowballSection.tsx` + Cash Flow Status Bars in Forecast card + per-debt progress bars in `DebtRow.tsx`.
- **#13 — Since-Last-Cycle Delta Indicator** — requires v1.5 cycle history to be in place; see [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md).
- **#15 — Settings UX Rework** — accordion/in-place expansion; see [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md).

### Mobile polish shipping in v1.5

- **P5 — Context-Aware Skeleton Loading** — see [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md).
- **P6 — Micro-Interaction Pass** — pairs naturally with milestone celebration motion; see [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md).
- **P10 — Timeline Cycle Item Overflow** — implement only once real usage data shows cycles consistently reaching 30+ items; see [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md).

### Internal: Page Orchestrator Phases 1–2

No user-visible change — see [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md).

**Files touched (net new):** `lib/debt/computeMilestones.ts`, `components/MilestoneBadge.tsx`, `lib/debt/buildAmortizationSchedule.ts`, `components/AmortizationCalendar.tsx`, `lib/hooks/usePayCycleHistory.ts`, `components/HistorySection.tsx`, `lib/storage/debtPlannerStorage.ts`.

**Data model changes:** New `PayCycleSnapshot` type + `debtPlanner.cycleHistory` storage key. Milestones and streaks are computed from existing data — no additional model changes.

**Tier:** Pay Cycle History: Premium = last 6 cycles; Premium+ = unlimited. Milestones: Free (badges) + Premium+ (calendar context). Amortization Calendar: Premium+. Streaks: Free (count) + Premium+ (chart).

**Risk:** Medium — amortization math must reconcile with the existing projection engine. Budget time for the reconciliation test.

**Testing:** Regression: rollover produces exactly one snapshot with correct totals. Reconciliation: `buildAmortizationSchedule` total interest matches `projectDebtPayoff`. E2E: History view shows capped vs. uncapped per mocked tier.

---

## v1.6 — Foundation: Infrastructure & Instrumentation

**Scope:** Formalize everything under the hood that v1.5–v1.8 depends on working correctly. Three items are directly visible to users: the 3-tier subscription system surfaces Premium+ and Ultimate as real distinct tiers in the UI; backup reminders appear if you haven't exported in 7+ days; and external payment logging adds a new swipe action to debt rows.

**Annual pricing note:** Premium+ annual pricing ($79.99/yr) activates at v1.8, not here. The 3-tier infra formalizes the tier at v1.6, but Premium+'s differentiating power features (multi-scenario planning, probabilistic projections) don't land until v1.8. Sell the annual once the full value stack exists.

### 3-Tier Subscription Infrastructure

**Current state (verified):** `lib/subscription/plans.ts` → `SubscriptionPlan = "free" | "premium"`. `hasFeatureAccess.ts` → binary, `plan === "premium"` grants everything. RevenueCat reads a single `"premium"` entitlement ID.

1. Expand `SubscriptionPlan` to `"free" | "premium" | "premium_plus" | "ultimate"`.
2. Expand `lib/subscription/features.ts`'s `PremiumFeature` union to include all Premium+/Ultimate features built in v1.5 onward, with a `minimumTier` mapping per feature.
3. Rewrite `hasFeatureAccess(plan, feature)` as a tier-ordinal comparison (`free=0, premium=1, premium_plus=2, ultimate=3`) against each feature's `minimumTier`.
4. RevenueCat: configure additional entitlement IDs and update `getSubscriptionPlan()`/`purchasePremium()` to map products → the new 4-value type.
5. **Audit every existing `hasFeatureAccess` call site** — any exact equality check (`plan === "premium"`) also needs updating. This is the actual risk of this version.

### Storage Schema Versioning

1. Add a `version: number` field (or a single `debtPlanner.schemaVersion` key) written alongside existing storage keys.
2. New `lib/storage/migrateState.ts` — a migration runner checking stored version against current expected version, applying migration functions in sequence. No migrations needed yet — this is the mechanism for when they are.
3. Change `loadStoredState`'s silent-fallback-on-parse-error to log/flag a corrupted-state event (ties into analytics below).

### Analytics + Crash Reporting

**Recommendation:** PostHog (product analytics) + Sentry (crash reporting).

1. New `lib/analytics/track.ts` — thin wrapper (`track(event, properties)`) so the codebase never imports PostHog directly; makes swapping providers a one-file change.
2. Instrument key funnels: onboarding step completion, paywall view → purchase conversion, feature-gate hit (free user taps a locked feature), rollover completion, backup export/import.
3. Sentry: initialize in `app/layout.tsx` for web-rendered errors, plus native-side initialization in the Xcode project for crashes outside the WebView.
4. **Hard privacy rule:** Never send debt amounts, balances, names, or any financial figures as event properties — track *that* an action happened, never *what the numbers were*. Write this constraint in `lib/analytics/track.ts` as a comment so future work doesn't accidentally leak financial data.

### Export/Backup Automation

Extend `lib/storage/backup.ts` with a scheduled trigger on app foreground: if last backup > 7 days ago, prompt to export. Note: true automatic backup on iOS means writing to Files app or iCloud Drive via share sheet — verify iCloud Drive write access from the Capacitor WKWebView sandbox before committing. If not feasible, scope to more prominent backup reminders.

### External Payment Logging

Add "Log Payment Made Outside App" to `DebtRow`/`ExpenseListItem` swipe actions, calling `onMarkRecommendedAction(..., paymentSource: "external")` — the handler already supports this parameter; this is purely a missing UI entry point.

**Files touched:** `lib/subscription/plans.ts`, `lib/subscription/features.ts`, `lib/subscription/hasFeatureAccess.ts`, `lib/subscription/revenueCat.ts`, `lib/storage/migrateState.ts` (new), `lib/storage/debtPlannerStorage.ts`, `lib/storage/backup.ts`, `lib/analytics/track.ts` (new), `app/layout.tsx`, Xcode project (Sentry native init), `components/Debts/DebtRow.tsx`.

**Data model changes:** `SubscriptionPlan` type widened (breaking at call sites using exact equality checks).

**Testing:** Highest-test-value version in the v1.x sequence — regression test matrix: every `PremiumFeature` × every tier → expected boolean. Re-run full e2e suite with each of the 4 tiers mocked via `debtPlanner.mockSubscription`.

**Risk:** Medium-high on the call-site audit. Not technically hard, but the audit is where "wrong tier got access" bugs hide if rushed.

**Also shipping in v1.6:**
- Page Orchestrator Phase 3 (Backup/Snapshot Hook) — see [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md).

---

## Sequencing risks

1. **v1.6's 3-tier rework should be designed against from v1.5 onward.** Use `hasFeatureAccess` correctly in every version now, not retrofitted at v1.6 under time pressure.
2. **v1.11 leaderboard half defers until v2.0 backend exists.** Don't build against an assumed backend shape before v2.0 designs it for real.
3. **v2.0 is the roadmap's hinge point** — first server, first financial data leaving the device, first AI dependency. Everything after it (v2.1, v2.2, v3.0) builds on decisions made here. Get it right.
4. **Engine code (`lib/engine/`, `lib/debt/`) is the app's most load-bearing, best-tested code.** Every version touching it (v1.5 amortization, v1.8 BNPL, v2.1 multi-income) must reuse existing functions and include a reconciliation test against current engine output.
5. **Mobile polish P7 (list virtualization) and P8 (modal transition audit) remain unscheduled.** P7: build only when a real user reports lag with a large list. P8: build only on a concrete HIG-compliance push.
6. **Page Orchestrator Phases 1–5 must ship in order** — each phase's hook takes the prior phase's output as a parameter.
7. **Do not expose Ultimate tier as purchasable until v2.0 ships** — every Ultimate feature depends on the v2.0 backend, which itself requires v1.5–v1.8 to be in place first.
8. **Statement Auto-Import mandatory review-before-save (v2.0) is a hard requirement** — never auto-save AI-extracted statement data without explicit user confirmation. A misextracted APR or balance corrupts a user's real financial plan.
9. **v1.9 native features ship in order of increasing complexity:** custom icons → widget → Live Activities.
10. **Cross-reference audit (2026-06-28):** all `[vX.X]`-tagged features in `ROADMAP.md` now have matching implementation coverage in this doc set.
