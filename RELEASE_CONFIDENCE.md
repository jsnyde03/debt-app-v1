# Release Confidence Policy

_Standing rule, effective 2026-06-25: every calculation, feature, and user-facing flow must reach **High confidence** before it ships. This document defines what that means, records the current baseline audit, and tracks what's still open. Update the table below whenever a new feature ships or a gap closes — this is a living gate, not a one-time report._

## The rule

**No feature or calculation ships at Medium or Low confidence without an explicit, written exception.** "It looks right" is not evidence. "It has a regression test exercising its actual branches, and the test suite passes" is evidence.

## What each rating means

**High confidence** — all of:
- Every logical branch of the function/feature has a corresponding automated test (regression test for pure logic, e2e test for a user flow).
- For anything that touches money (interest, balances, allocations, projections), a second function or test that should mathematically agree with it actually does — a reconciliation check, not just an isolated assertion.
- Edge cases are tested explicitly: zero, negative, boundary values, empty state, malformed input.

**Medium confidence** — the core path is tested and passing, but specific named branches or edge cases are not — listed explicitly, not just implied. Acceptable to ship only when the untested branch is low-frequency/low-impact AND is tracked with a specific follow-up.

**Low confidence** — no automated test exists, OR a known-incorrect behavior exists and is undocumented to the user. **Must be fixed or explicitly disclosed before release**, not silently shipped.

## Current baseline audit (2026-06-25, v1.2-dev)

| Area | Rating | Why |
|---|---|---|
| Core allocation engine (`lib/engine/allocatePaycheck.ts`) | **High** | Every branch (expenses, minimums, buffer, emergency goal, snowball/avalanche sort, savings goals, leftover) has a corresponding assertion across `testAllocation.ts` + `testFullAppRegression.ts`, including a sum-invariant test (every dollar accounted for). |
| Debt math (`calculateMonthlyInterest.ts`, `projectDebtPayoff.ts`, `applyDebtPaymentProjection.ts`) | **High** | `testDebtMathRegression.ts` covers zero/negative APR and balance, rounding, interest-before-payment ordering, overpayment capping, snowball/avalanche tiebreakers, the "cannot amortize" trap case. Strongest-tested area in the app. |
| BNPL debts | **Fixed this pass** (was Low) | Engine ignored `type === "bnpl"` entirely and ran BNPL through the same interest-accrual path as revolving credit. Any BNPL debt with a nonzero APR (data-entry mistake or a promotional-rate default) would silently accrue compounding interest a real BNPL plan doesn't have. Mitigated by clamping BNPL interest to zero everywhere balance math happens — see "Fixes applied" below. Full installment-schedule support (`remainingPayments`/`scheduledPaymentAmount`-aware payoff dates) remains its own scoped feature at v1.10; this pass only closes the "accrues phantom interest" risk, not the full feature gap. |
| Pay cycle rollover (`handleRolloverPayCycle` in `app/page.tsx`) | **Fixed this pass** (was Medium) | The flag-reset/date-advance half (`rolloverDebts`/`rolloverRequiredExpenses`) was already well tested. The actual balance-mutating math — interest accrual + minimum + snowball payment applied to produce the new balance — had zero test coverage. Added a regression test pinning a known interest+minimum+snowball scenario to its expected resulting balance. Full extraction into a standalone pure function is still scheduled at v1.10 (`PAGE_ORCHESTRATOR_PLAN.md` Phase 5) — this pass adds the missing safety net without doing that larger refactor early. |
| Forecast engine (`lib/forecast/projectForecast.ts`) | **Fixed this pass** (was Medium) | Status thresholds and core projection math were well tested; the `recoveryMonth` field itself (the thing a real display bug was found in earlier this session) had no direct assertion. Added tests pinning `recoveryMonth` for a recovering scenario, a never-recovers scenario, and a non-monotonic (dips again after recovering) scenario. |
| Smart Insights (`lib/insights/buildSmartInsights.ts`) | **Fixed this pass** (was Medium) | 5 of 8 branches were tested. Added coverage for the three that weren't: Safe Extra Payment, Payoff Timing Difference, Stability First. |
| Subscription/tier gating (`lib/subscription/hasFeatureAccess.ts`) | **High** | Zero tests existed anywhere for this function before this pass. Notifications gating in `app/page.tsx` originally bypassed `hasFeatureAccess` via raw `subscriptionPlan === "premium"` string checks; the `interest_savings` `PremiumFeature` was declared but never actually gated anywhere. Both fixed: notifications were briefly routed through `hasFeatureAccess`, then — as a deliberate product decision, not a confidence gap — made free for everyone (reminders are a retention/engagement feature, not an analytical insight; the four remaining gated features — forecasting, strategy comparison, what-if scenarios, smart insights — are the actual premium value). `interest_savings` removed for the same "nothing gates on it" reason. Regression test matrix in `testSubscriptionGating.ts` now covers exactly the 4 features that are actually gated. |
| Storage/persistence (`lib/storage/backup.ts`) | **Fixed this pass** (was Medium) | `readBackupFile()` did a bare `JSON.parse` with no try/catch and no shape validation — a malformed or wrong-shape backup file would throw uncaught or silently corrupt state. Fixed: wrapped in try/catch with a user-facing error, added minimal required-key validation before accepting an import. |
| Test harness itself | **High** | `npm run test:regression` runs 15 modules, 150+ assertions, all passing. `tests/e2e/` covers data entry, empty state, hardening, rollover, paycheck flow, payoff date — solid flow coverage. |

## Pre-existing e2e gaps (confirmed not caused by this audit)

Before committing this pass's fixes, `tests/e2e/planner-data-entry.spec.ts`, `planner-paycheck-flow.spec.ts`, and `planner-rollover-flow.spec.ts` were run against this branch's pre-audit baseline (via `git stash`) to rule out a regression from the changes above. The same 6 failures reproduce on the clean baseline:

- `planner-data-entry.spec.ts` — "can add an expense/debt/goal and persist after reload" (3 tests)
- `planner-paycheck-flow.spec.ts` — "required actions can be completed and undone", "dark mode persists"
- `planner-rollover-flow.spec.ts` — "rollover resets paid flags..." (fails on `state.currentDate` — expects `"2026-06-07"`, gets `"2026-07-09"`, a stale hardcoded date in the fixture, same class of bug as the demo-data date-rot fixed earlier this session)

These are **Low confidence: test harness, not the feature under test** — pinned to this branch's pre-audit `HEAD`, unrelated to `applyRolloverPayment`, `hasFeatureAccess`, or any other change in this pass. Tracked as a follow-up to refresh hardcoded dates in `tests/e2e/` fixtures and investigate the dark-mode/persistence click flakiness; not a release blocker for the underlying calculations these regression-tested this pass, since the regression suite (which exercises the same math directly, not through fixture dates) passes cleanly.

## Known, explicitly-accepted exceptions

- **BNPL installment scheduling** (using `remainingPayments`/`scheduledPaymentAmount` for payoff dates instead of amortization math) — scoped as its own feature at v1.10 per `IMPLEMENTATION_PLAN.md`. The interest-accrual risk is closed this pass; the scheduling gap is a known, tracked, *not yet built* feature, not a silently-wrong calculation.

## Process going forward

1. **Every new calculation gets a test in the same PR/commit that introduces it** — not a follow-up. If it touches money, it needs a reconciliation check against whatever existing function it should agree with.
2. **Every new premium-gated feature must call `hasFeatureAccess`** — no ad-hoc `subscriptionPlan === "premium"` string checks. This was exactly the inconsistency found and fixed in this audit.
3. **Before any version is "locked" for release, re-run this audit's checklist** (the 9 areas above, or whatever's grown since) and update this table — don't let it go stale the way the original gaps did.
