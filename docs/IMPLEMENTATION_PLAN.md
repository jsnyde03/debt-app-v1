# Implementation Plan

_Technical companion to `ROADMAP.md`. Defines how each version is built: data model changes, files touched, sequencing, and testing. Last updated: 2026-06-27._

## Document map

| Topic | Document |
|---|---|
| Active work — v1.4 Onboarding | [V14_ONBOARDING.md](V14_ONBOARDING.md) |
| UX polish backlog (28 audit items, versioned) | [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) |
| v1.7 and beyond | [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) |
| Mobile polish (P1–P9) | [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) |
| Page orchestrator refactor (Phases 1–5) | [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md) |
| Product roadmap, tier definitions, version table | [ROADMAP.md](ROADMAP.md) |
| Original UX audit findings | [premium-ux-audit.md](premium-ux-audit.md) |

---

## Critical path dependency

Four features independently require a **backend** that doesn't exist today (the app is 100% client-side, `localStorage`-only):

- **v1.14** — opt-in leaderboard (server needed to aggregate anonymous percentiles)
- **v2.0** — AI Recommendations (Anthropic API key must never be client-side)
- **v2.1** — Household/Multi-Income (accounts + sync, not local storage)
- **v2.2** — Bank Linking (Plaid tokens must stay server-side)

**Decision: build the backend once as Phase 0 of v2.0.** v1.14's leaderboard ships its non-backend half (shareable cards) at v1.14; the leaderboard half defers until the v2.0 backend exists.

---

## Version summary

| Version | Status | Focus |
|---|---|---|
| v1.2 | ✅ Shipped | Notifications, App Lock, Demo Mode, App Store compliance, Mobile Polish P1a/P2/P9a |
| v1.3 | ✅ Shipped | iPad support + native polish, landscape layouts, Delete All Data, UI/UX Polish Pass |
| v1.4 | 🔵 Active | Timeline multi-cycle fix + Onboarding — see [V14_ONBOARDING.md](V14_ONBOARDING.md) |
| v1.5 | ⬜ Next | Pay Cycle History |
| v1.6 | ⬜ Planned | Debt Milestones + Amortization Calendar + Streaks |
| v1.7+ | ⬜ Long-term | Widget, AI, Android, ... — see [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) |

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

---

## v1.5 — Pay Cycle History

**Scope:** Persist a snapshot of each completed pay cycle for trend tracking and as the data foundation v2.0's AI requires.

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

**Also shipping in v1.5:**
- Windfall/Bonus Allocator (Free) — see [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) (#12). Note: this item's implementation spec is in UX_POLISH_BACKLOG.md but it shipped in the v1.4 addendum — see [V14_ONBOARDING.md](V14_ONBOARDING.md) for the version assignment.
- Mobile Polish P5 (Skeleton Loading) — see [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md)
- Page Orchestrator Phase 1 (Mechanical Relocations) — see [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md)
- UX Polish #1 (Payoff Trajectory Chart) and #13 (Delta Indicator) — see [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md)

**Testing:** Regression test: rollover produces exactly one snapshot with correct totals. E2e: History view shows capped vs. uncapped per mocked tier.

---

## v1.6 — Debt Milestones + Amortization Calendar + Streaks

**Scope:** Three "celebrate progress" features sharing the same emotional theme; independent in implementation.

### Milestones
1. New `lib/debt/computeMilestones.ts` — pure function comparing `debt.balance` against `debt.originalBalance` per debt; returns crossed thresholds (25/50/75/100%) plus an "all debts paid off" check.
2. New `components/MilestoneBadge.tsx` — celebration card/toast triggered when a rollover crosses a threshold.
3. **Debt payoff celebration (#19b):** When a debt crosses 100% on rollover, trigger a distinct paid-off experience — `triggerMediumHaptic()`, full-width celebration card with confetti-style animation, debt's name prominently displayed. See [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) (#19b).

### Amortization Calendar (Premium+)
1. New `lib/debt/buildAmortizationSchedule.ts` — loops `lib/debt/applyDebtPaymentProjection.ts` (single-month step, already exists) to produce a month-by-month schedule until payoff. Reuse, don't reinvent.
2. New `components/AmortizationCalendar.tsx` — per-debt table/calendar view, accessible from each debt row via "View Schedule", gated via `hasFeatureAccess`.
3. **Mandatory reconciliation test:** verify `buildAmortizationSchedule`'s total interest matches `projectDebtPayoff`'s `totalInterestPaid` for identical inputs. Silent math disagreement in a finance app is the worst bug class.

### Streaks
1. Derived from v1.5's `cycleHistory`. Count consecutive snapshots where `totalPaidThisCycle >= totalRequired`.
2. Surface as a small stat near the Plan tab top — Free tier gets the count; Premium+ gets the historical chart (reuses v1.5 History view).

**Files touched:** `lib/debt/computeMilestones.ts` (new), `components/MilestoneBadge.tsx` (new), `lib/debt/buildAmortizationSchedule.ts` (new), `components/AmortizationCalendar.tsx` (new).

**Data model changes:** None beyond v1.5 — milestones and streaks are computed from existing data.

**Tier:** Milestones: Free (badges) + Premium+ (calendar context). Amortization Calendar: Premium+. Streaks: Free (count) + Premium+ (chart).

**Risk:** Medium — amortization math must reconcile with the existing projection engine. Budget time for the reconciliation test.

**Also shipping in v1.6:**
- Settings UX Rework (#15) — see [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md)
- Mobile Polish P6 (Micro-Interaction Pass) — see [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md)
- Page Orchestrator Phase 2 (JSX Componentization) — see [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md)

**Testing:** Regression tests for `computeMilestones` (threshold crossing in a lump-sum payoff) and `buildAmortizationSchedule` (total interest reconciliation with `projectDebtPayoff`).

---

## Sequencing risks

1. **v1.9's 3-tier rework should be designed against from v1.5 onward.** Use `hasFeatureAccess` correctly in every version now, not retrofitted at v1.9 under time pressure.
2. **v1.14 leaderboard half defers until v2.0 backend exists.** Don't build against an assumed backend shape before v2.0 designs it for real.
3. **v2.0 is the roadmap's hinge point** — first server, first financial data leaving the device, first AI dependency. Everything after it (v2.1, v2.2, v3.0) builds on decisions made here. Get it right.
4. **Engine code (`lib/engine/`, `lib/debt/`) is the app's most load-bearing, best-tested code.** Every version touching it (v1.6 amortization, v1.10 BNPL, v2.1 multi-income) must reuse existing functions and include a reconciliation test against current engine output.
5. **Mobile polish P7 (list virtualization) and P8 (modal transition audit) remain unscheduled.** P7: build only when a real user reports lag with a large list. P8: build only on a concrete HIG-compliance push.
6. **Page Orchestrator Phases 1–5 must ship in order** — each phase's hook takes the prior phase's output as a parameter.
7. **Do not expose Ultimate tier as purchasable until v2.0 ships** — every Ultimate feature depends on the v2.0 backend, which itself requires v1.5–v1.10 to be in place first.
8. **Statement Auto-Import mandatory review-before-save (v2.0) is a hard requirement** — never auto-save AI-extracted statement data without explicit user confirmation. A misextracted APR or balance corrupts a user's real financial plan.
9. **v1.7 native features ship in order of increasing complexity:** custom icons → widget → Live Activities.
10. **Cross-reference audit (2026-06-23):** all `[vX.X]`-tagged features in `ROADMAP.md` now have matching implementation coverage in this doc set.
