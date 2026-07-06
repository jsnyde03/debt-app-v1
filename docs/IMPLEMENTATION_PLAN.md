# Implementation Plan

_Technical companion to `ROADMAP.md`. Defines how each version is built: data model changes, files touched, sequencing, and testing. Last updated: 2026-07-02._

## Document map

| Topic | Document |
|---|---|
| v1.4 Onboarding (✅ shipped) | [archive/V14_ONBOARDING.md](archive/V14_ONBOARDING.md) |
| v1.5 Track Your Journey (✅ feature-locked 2026-07-02) | [V15_TRACK_YOUR_JOURNEY.md](V15_TRACK_YOUR_JOURNEY.md) |
| UX polish backlog (28 audit items, versioned) | [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) |
| v1.6 Differentiation Strike (full plan + opening audit) | [V16_PLAN.md](V16_PLAN.md) |
| v1.6 (Differentiation Strike) and beyond | [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) |
| Android readiness audit (blockers, CI, plugins, testing) | [ANDROID_READINESS.md](ANDROID_READINESS.md) |
| Mobile polish (P1–P9) | [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) |
| Page orchestrator refactor (Phases 1–5) | [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md) |
| Product roadmap, tier definitions, version table | [ROADMAP.md](ROADMAP.md) |
| Original UX audit findings (archived) | [archive/premium-ux-audit.md](archive/premium-ux-audit.md) |

---

## Critical path dependency

Four features independently require a **backend** that doesn't exist today (the app is 100% client-side, `localStorage`-only):

- **v1.12** — opt-in leaderboard (server needed to aggregate anonymous percentiles)
- **v2.0** — AI Recommendations (Anthropic API key must never be client-side)
- **v2.1** — Household/Multi-Income (accounts + sync, not local storage)
- **v2.2** — Bank Linking (Plaid tokens must stay server-side)

**Decision: build the backend once as Phase 0 of v2.0.** v1.12's leaderboard ships its non-backend half (shareable cards) at v1.12; the leaderboard half defers until the v2.0 backend exists.

---

## Version summary

| Version | Status | Focus |
|---|---|---|
| v1.2 | ✅ Shipped | Notifications, App Lock, Demo Mode, App Store compliance, Mobile Polish P1a/P2/P9a |
| v1.3 | ✅ Shipped | iPad support + native polish, landscape layouts, Delete All Data, UI/UX Polish Pass |
| v1.4 | ✅ Shipped | Core onboarding + timeline fix + 22 UX/Mobile polish items + Payoff Trajectory Chart (#1a) + Cash Flow Status Bars (#1b) + Per-Debt Progress Bars (#1c) |
| v1.5 | ✅ Feature-locked (2026-07-02) | Pay Cycle History · Debt Milestones + celebration · Amortization *lite* · Streaks · Since-last-cycle delta · Settings UX rework — **plus a large quality/testing-hardening wave**: e2e harness rebuild + CI gate, full-app layout & premium-UX pass, context-aware skeletons, micro-interaction audit, Page Orchestrator Phases 1–2 (the sustainability-refactor opener), lint 0/0, storage-safety e2e. Android prep (Play Console signup) remains a background task. |
| v1.6 | ⬜ Planned | **Differentiation Strike**: payday-allocation engine as hero + LLM-proof capture (Payday Autopilot, Interest-Saved Momentum Ledger, Plan-vs-Actual Drift Tracker) + bounded refactor slice + marketing/ASO kickoff — pure-JS/Capacitor — see [V16_PLAN.md](V16_PLAN.md) |
| v1.7 | ⬜ Planned | Foundation: 3-tier subscription infra + analytics + crash reporting + schema versioning + backup automation + **Android prep** (RevenueCat per-platform key, notification icon) _(external-payment logging shipped in v1.6 as Payday Autopilot)_ |
| v1.8 | ⬜ Long-term | **Android build** (clean standalone milestone) — see [ANDROID_READINESS.md](ANDROID_READINESS.md) |
| v1.9+ | ⬜ Long-term | Multi-Scenario Planning, Widget + accessibility audit (v1.10), AI, ... — see [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) |

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

**Theme:** Everything that helps users understand where they've been and celebrate how far they've come. Pay Cycle History is the data foundation; milestones, streaks, amortization, and charts make that data meaningful.

> **📋 v1.5 is a Large release with its own build + release checklist: [V15_TRACK_YOUR_JOURNEY.md](V15_TRACK_YOUR_JOURNEY.md).**
> That doc is the single source of truth for v1.5 — per-workstream steps, tier gating, required tests, QA checklist, release gate, and Definition of Done. The summary below is for roadmap context only; do not duplicate detail here.

**Workstreams** (full detail in the v1.5 doc):
1. **Pay Cycle History** *(build first — data foundation)* — `usePayCycleHistory.ts` + `PayCycleSnapshot` type + `HistorySection.tsx`. Premium = 6 cycles, Premium+ = unlimited.
2. **Debt Milestones + Payoff Celebration (#19b)** — `computeMilestones.ts` + `MilestoneBadge.tsx`. Free (badges) / Premium+ (calendar context).
3. **Amortization Calendar** — `buildAmortizationSchedule.ts` + `AmortizationCalendar.tsx`. Premium+. **Mandatory reconciliation test vs. `projectDebtPayoff`.**
4. **Streaks** — derived from `cycleHistory`. Free (count) / Premium+ (chart).
5. **UX #13** — Since-Last-Cycle Delta (needs cycle history first).
6. **UX #15** — Settings UX Rework (decision required before build).
7. **Mobile P5 / P6** — context-aware skeletons + micro-interaction pass. *(P10 timeline overflow: conditional, only if usage shows 30+ item cycles.)*
8. **Page Orchestrator Phases 1–2** — internal refactor, zero behavior change ([PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md)).
9. **Android prep** — Google Play Console signup + Maestro harness ([ANDROID_READINESS.md](ANDROID_READINESS.md)). Groundwork; does not block the v1.5 ship.

**Data model changes:** New `PayCycleSnapshot` type + `debtPlanner.cycleHistory` storage key. Milestones and streaks compute from existing data.

**Risk:** Medium — amortization math must reconcile with the existing projection engine. Budget time for the reconciliation test.

---

## v1.7 — Foundation: Infrastructure & Instrumentation

**Scope:** Formalize everything under the hood that v1.5–v1.9 depends on working correctly. Two items are directly visible to users: the 3-tier subscription system surfaces Premium+ and Ultimate as real distinct tiers in the UI; and backup reminders appear if you haven't exported in 7+ days. _(External payment logging is no longer part of this version — it shipped in v1.6 as Payday Autopilot; see the note in the External Payment Logging section below.)_

**Annual pricing note:** Premium+ annual pricing ($79.99/yr) activates at v1.9, not here. The 3-tier infra formalizes the tier at v1.7, but Premium+'s differentiating power features (multi-scenario planning, probabilistic projections) don't land until v1.9. Sell the annual once the full value stack exists.

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

### External Payment Logging — ✅ shipped in v1.6 as Payday Autopilot

_Redundant here. The external-payment logging gap ("Log Payment Made Outside App" via `onMarkRecommendedAction(..., paymentSource: "external")`) is closed by v1.6's **Payday Autopilot** capture feature, which absorbed it. No standalone work remains for v1.7 — see [FUTURE_VERSIONS.md](FUTURE_VERSIONS.md) v1.6 and [V16_PLAN.md](V16_PLAN.md)._

**Files touched:** `lib/subscription/plans.ts`, `lib/subscription/features.ts`, `lib/subscription/hasFeatureAccess.ts`, `lib/subscription/revenueCat.ts`, `lib/storage/migrateState.ts` (new), `lib/storage/debtPlannerStorage.ts`, `lib/storage/backup.ts`, `lib/analytics/track.ts` (new), `app/layout.tsx`, Xcode project (Sentry native init), `components/Debts/DebtRow.tsx`.

**Data model changes:** `SubscriptionPlan` type widened (breaking at call sites using exact equality checks).

**Testing:** Highest-test-value version in the v1.x sequence — regression test matrix: every `PremiumFeature` × every tier → expected boolean. Re-run full e2e suite with each of the 4 tiers mocked via `debtPlanner.mockSubscription`.

**Risk:** Medium-high on the call-site audit. Not technically hard, but the audit is where "wrong tier got access" bugs hide if rushed.

### Android prep (continues here — finishes the groundwork before v1.8)

Two v1.7 deliverables are hard prerequisites for the Android launch, and two small code fixes ride along. See [ANDROID_READINESS.md](ANDROID_READINESS.md).

1. **Crash reporting (Sentry) must be live before Android ships** — Android is the most surprise-prone version on the roadmap; launching a brand-new platform without crash reporting is flying blind. This is a reason the Android build follows v1.7, not precedes it.
2. **Finalize the 3-tier structure before configuring Google Play products** — set up Play billing once against the final tiers (`free`/`premium`/`premium_plus`/`ultimate`) rather than building single-tier products at v1.8 and tearing them down. This is the other reason Android follows v1.7.
3. **B1 — RevenueCat per-platform key:** `lib/subscription/revenueCat.ts` hardcodes the Apple key (`appl_...`). Add a `Capacitor.getPlatform()` branch to select the `goog_...` key on Android. No platform branching exists anywhere in the codebase today. Fold this into the v1.7 `revenueCat.ts` rework (already touched for 3-tier).
4. **B2 — notification icon:** replace the placeholder `smallIcon: "ic_stat_icon_config_sample"` in `capacitor.config.ts` with a real Android monochrome drawable.

**Also shipping in v1.7:**
- Page Orchestrator Phase 3 (Backup/Snapshot Hook) — see [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md).

---

## Sequencing risks

1. **v1.7's 3-tier rework should be designed against from v1.5 onward.** Use `hasFeatureAccess` correctly in every version now, not retrofitted at v1.7 under time pressure.
2. **v1.12 leaderboard half defers until v2.0 backend exists.** Don't build against an assumed backend shape before v2.0 designs it for real.
3. **v2.0 is the roadmap's hinge point** — first server, first financial data leaving the device, first AI dependency. Everything after it (v2.1, v2.2, v3.0) builds on decisions made here. Get it right.
4. **Engine code (`lib/engine/`, `lib/debt/`) is the app's most load-bearing, best-tested code.** Every version touching it (v1.5 amortization, v1.9 BNPL, v2.1 multi-income) must reuse existing functions and include a reconciliation test against current engine output.
5. **Mobile polish P7 (list virtualization) and P8 (modal transition audit) remain unscheduled.** P7: build only when a real user reports lag with a large list. P8: build only on a concrete HIG-compliance push.
6. **Page Orchestrator Phases 1–5 must ship in order** — each phase's hook takes the prior phase's output as a parameter.
7. **Do not expose Ultimate tier as purchasable until v2.0 ships** — every Ultimate feature depends on the v2.0 backend, which itself requires v1.5–v1.9 to be in place first.
8. **Statement Auto-Import mandatory review-before-save (v2.0) is a hard requirement** — never auto-save AI-extracted statement data without explicit user confirmation. A misextracted APR or balance corrupts a user's real financial plan.
9. **v1.10 native features ship in order of increasing complexity:** custom icons → widget → Live Activities.
10. **Android (v1.8) deliberately follows v1.7, and its prep starts at v1.5.** Two v1.7 deliverables gate it: crash reporting must precede a surprise-prone new platform, and the final 3-tier structure must exist before Google Play products are configured once (not twice). Independently, the slowest dependency — Google Play Console identity verification — has zero code coupling and starts at v1.5. Accessibility was split out of v1.8 to v1.10 so Android ships as a clean standalone milestone. Full rationale in [ANDROID_READINESS.md](ANDROID_READINESS.md).
11. **Cross-reference audit (2026-06-28):** all `[vX.X]`-tagged features in `ROADMAP.md` now have matching implementation coverage in this doc set.
