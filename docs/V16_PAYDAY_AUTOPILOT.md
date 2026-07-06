# Payday Autopilot — v1.6 design (step 1.6)

_Status: ✅ BUILT (2026-07-06). Shape A1. The capture keystone of the differentiation spine — all sub-steps 1.6.1–1.6.6 shipped on `v1.6-dev`._

## Why this is the keystone
Debt's uncopyable job is the **cycle-keyed payday-allocation** ("what do I pay with THIS paycheck"). Payday Autopilot is what turns that from a calculator into a **decision tool the user returns to every payday** — and, critically, it is the **capture** mechanism that feeds the two analytics features that follow:
- **Interest-Saved Momentum Ledger (1.7)** and **Plan-vs-Actual Drift Tracker (1.8)** are *vapor without captured actuals*. Manual-entry decay is the portfolio's #1 differentiation risk (`LLM_PROOF_FEATURES.md`), so capture must be **near-zero-friction and proactive**. That is this feature's whole job.

**Free tier** — capture is the core habit loop, never paywalled ([[feedback_no_paywall_basic_functionality]]). Premium sits on the downstream *analytics* (1.7 per-debt breakdown, 1.8 drift depth), not on capture.

## What already exists (build ON these — this is a MEDIUM feature, not a rebuild)
- **Per-action capture:** `handleMarkRecommendedAction` (page.tsx, reconciliation-safe as of step 1.4) records each completed action's `recommendedAmount` / `actualAmount` / `paymentSource` into the canonical `CompletedRecommendedAction` (step 1.3).
- **Cycle snapshot:** `handleRolloverPayCycle` → `buildCycleSnapshot` already snapshots the closing cycle's `completedRecommendedActions` into history (this is the plan-vs-actual raw material the Drift Tracker will read).
- **Notifications:** `scheduleNotifications` already fires a "Paycheck Tomorrow" eve-reminder — but it's a generic "come open the app" nudge.
- **`paymentSource: "external"`** exists in the type and is correctly excluded from cash math (`computeCompletedRecommendedTotal`) — but **no UI sets it yet.**

## The three gaps Autopilot fills
1. **Proactivity** — detect payday on app-open + upgrade the notification to carry the plan and prompt capture.
2. **A frictionless capture moment** — one proactive sheet instead of hunting to mark each action.
3. **External-payment logging** — the "I paid this elsewhere" option (`paymentSource: "external"`), folded into the sheet.

## The flow (approved shape A1)
On payday, surface a **PaydayCaptureSheet** (via the theme-safe portal `getPortalTarget`, step 1.2) that shows the cycle's **recommended allocation** (the engine's extra-payoff/goal actions — the differentiating waterfall output; required bills keep their existing per-bill "Mark Paid" flow):

- **One-tap "I followed the plan"** → bulk-captures every not-yet-marked recommended action with `actualAmount = recommendedAmount`, `paymentSource: "paycheck"`. Near-zero friction for the disciplined-cycle common case.
- **Adjust (per item)** → override the real `actualAmount`, or toggle **"Paid from elsewhere"** (`paymentSource: "external"` → counts toward debt/goal progress but NOT against this paycheck's cash).
- **Dismiss** → mark this payday handled without capturing (no nagging re-prompt this cycle).
- **Then** → offer **"Start next cycle"** (the existing `handleRolloverPayCycle`, which snapshots the captured actuals).

**Drift integrity nuance:** one-tap means "I paid *exactly* the plan" (legitimate for a disciplined cycle); deviations go through **Adjust**, so the Drift Tracker still sees real drift. One-tap must not silently manufacture zero-drift — the Adjust path must be visible and easy.

## Architecture (the "narrow hook, not page.tsx" constraint)
New logic lives in a **`usePaydayCapture` hook** + a presentational **`PaydayCaptureSheet`**; page.tsx only provides the existing primitives and renders the sheet. No new capture logic bloats the orchestrator.

- **`usePaydayCapture(params)`** owns: payday **detection**, the per-cycle **handled flag**, sheet **open/dismiss** state, and the **capture orchestration** (calls the mark + rollover primitives passed in from page.tsx). It does NOT own the persisted debts/goals/actions state — it drives page.tsx's existing setters via callbacks.
- **Payday detection** — pure `shouldPromptPaydayCapture(todayISO, nextPaycheckDate, lastHandledPaydayDate)`: prompt when `todayISO >= nextPaycheckDate` AND `lastHandledPaydayDate !== nextPaycheckDate`. Uses REAL today (device), matching how `scheduleNotifications` already computes; `currentDate` stays the user-controlled cycle anchor.
- **Handled flag** — persist `debtPlanner.lastHandledPaydayDate = <nextPaycheckDate>`. On capture (which rolls over → nextPaycheckDate advances to a future date → no re-prompt) or dismiss, set it to the current `nextPaycheckDate`. Survives reload; per-cycle, self-clearing.
- **Capture write** — reuses `handleMarkRecommendedAction` (reconciliation-safe) per action; external via its `paymentSource` arg. No new money math beyond the bulk loop.

## Build sub-steps (ordered)
- **1.6.1 — Capture orchestration + reconciliation test (money path first). ✅ DONE (`8818d37`).** `buildPaydayCaptureItems` (bulk actual=recommended; per-item override; external; idempotent) + reconciliation test (external excluded from cash math; capture→unmark reconciles). Logic + test, no UI.
- **1.6.2 — `usePaydayCapture` hook + `shouldPromptPaydayCapture` (pure) + detection unit test + handled-flag persistence. ✅ DONE (`36b3b2f`).** No UI.
- **1.6.3 — Single-source the plan (`selectActiveRecommendedActions`). ✅ DONE (`af9faaa`).** _Inserted after the switch-in scout: the sheet's plan was computed INLINE in ResultsSection, duplicating the engine's canonical `computeFlexibleCash` + `buildActiveRecommendedActions`. For a money app the sheet MUST match the Plan tab, so (option A) compute it ONCE in page.tsx and feed both._ New tested selector; ResultsSection now consumes it (inline dup removed). Plan tab verified pixel-identical in both themes.
- **1.6.4 — `PaydayCaptureSheet` UI + theme-safe portal + wire into page.tsx.** Sources 1.6.3's selector. One-tap / adjust / external / dismiss / start-next-cycle. **Visual-verify BOTH themes** ([[feedback_visual_verify_ui_fixes]]) → **review with Jason.**
- **1.6.5 — Notification upgrade** — plan-bearing payday trigger (carry the allocation summary; prompt capture) in `scheduleNotifications`.
- **1.6.6 — Integration + release-ready. ✅ DONE.** Committed capture e2e (`planner-payday-capture.spec.ts`: sheet auto-opens → one-tap capture → handled + no re-prompt; + "Not now" dismiss). **Caught + fixed a regression:** the sheet auto-opens for any past `nextPaycheckDate`, so 3 non-payday specs (rollover/payoff/amort) that seed a past payday + debts were blocked (24 failures) — suppressed via `lastHandledPaydayDate` in their seeds. `validate:release` green. Docs flipped; after-scan filed the recency-window + post-capture-moment enhancements.

## Test plan
- **Reconciliation (1.6.1):** bulk-capture correctness; `paymentSource:"external"` excluded from the flex-cash total but counted toward debt/goal progress; capture→unmark reconciles (no balance drift — extends step 1.4).
- **Detection (1.6.2):** `shouldPromptPaydayCapture` boundary matrix (before/at/after payday; already-handled; cycle rollover clears it).
- **E2E (1.6.5):** seed a past-payday state → sheet appears → one-tap capture → assert `completedRecommendedActions` written + sheet dismissed + no re-prompt on reload. Kept green ([[feedback_playwright_maestro_testing]]).

## Out of scope (deferred)
- Structural elevation of the "This Paycheck" strip into the hero → v1.7 IA audit (was scope B of step 1.5).
- Required-bills capture in the sheet (bills keep the existing per-bill "Mark Paid"); the sheet focuses on the recommended allocation that feeds the ledger/drift.
- Live Activity / lock-screen payday surface → v1.9 native-surfaces batch.
