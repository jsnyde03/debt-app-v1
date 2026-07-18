# Drift Tracker — Data-Model Design Spec (v1.7 Phase 0.3)

> **Status:** the 0.3 design-spike output. Grounded in the Phase-0.1 engine & data-model audit (verified against code). Defines the Phase-2.1 build + its reconciliation-test shape. **One open [DECISION] for Jason: the re-anchor policy** (§4).
>
> **Feature:** the premium (`premium_plus`) differentiation carrot — the accountability layer *on* the payday-allocation engine. Headline: **"you're ~N days behind the plan the engine authored for you"**, from diffing each cycle's captured actuals against a frozen projected baseline. The deepest, least-copyable moat (no chatbot authored those past plans).

## 1. The data-model delta (what exists vs. what's missing)

**Exists today** (`lib/storage/debtPlannerStorage.ts` `PayCycleSnapshot`, built in `lib/history/buildCycleSnapshot.ts`): `cycleEndDate`, `totalDebtBalance` (the actual), `totalPaidThisCycle`, `allRequiredMet`, `completedRecommendedActions[]` (each with `recommendedAmount` + `actualAmount`), `payoffStrategy`.

**Missing (what "days behind" needs):**
- **No stored projected balance** — nothing records what the plan *predicted* the balance would be on each `cycleEndDate`. `computeCycleDelta` is actual-vs-actual (cycle-over-cycle), not plan-vs-actual. There is no plan baseline anywhere.
- **No skipped-recommendation record** — `completedRecommendedActions` only captures what the user *did*; skipped recs leave no trace.

**The math already exists — no engine change.** `buildPayoffTrajectory` (`lib/debt/buildPayoffTrajectory.ts`) already emits the full month-by-month projected-balance array (`TrajectoryPoint[]`, BNPL-correct), and `projectDebtPayoff` returns `estimatedDebtFreeDate`. The Drift Tracker is a **new pure `computeDrift(baseline, actualSnapshots)`** reconciliation-tested function layered on outputs that already exist → engine-adjacent (ships its reconciliation test), NOT a modification of the protected engine.

## 2. What to add (all additive / non-breaking)

**A frozen baseline** — new persisted state under a new key `debtPlanner.driftBaseline`:
```
DriftBaseline = {
  anchorDate: string            // when the baseline was frozen (plan-start / last re-anchor)
  anchorBalance: number         // total debt balance at anchor
  payoffStrategy: "snowball" | "avalanche"
  extraPayment: number          // the planned per-cycle extra at anchor
  projectedPoints: TrajectoryPoint[]   // frozen projected balance-by-date (from buildPayoffTrajectory)
  projectedDebtFreeDate: string        // frozen, from projectDebtPayoff
}
```
Chosen over a per-cycle `projectedBalance?` field on each snapshot because a per-cycle model self-corrects every cycle (re-baselines off current balances) → it can never show meaningful *cumulative* drift; it degenerates into a fancier `computeCycleDelta`. The frozen baseline is what yields a true cumulative "N days behind."

## 3. `computeDrift` — the headline computation
`computeDrift(baseline, actualSnapshots) → { daysBehind, dollarsBehind, projectedVsActualSeries, onTrack }`:
- Interpolate the actual balance trajectory from `actualSnapshots` (`totalDebtBalance` over `cycleEndDate`).
- **`daysBehind`** = the horizontal gap between where the actual balance is now and where the baseline projected that same balance would be reached (i.e. "your real balance today matches the plan's projection for a date N days ago/ahead"). Positive = behind, negative = ahead.
- **`dollarsBehind`** = actual balance today − baseline's projected balance for today.
- `onTrack` = within a tolerance band.
- Pure function, engine-adjacent → **its own reconciliation test** (`testComputeDrift.ts`): known baseline + synthetic actuals → asserted daysBehind/dollarsBehind; boundary cases (exactly on-plan = 0; ahead of plan = negative; no actuals yet = null/empty headline).

## 4. ⚠️ [DECISION for Jason] — the re-anchor policy (the real design content)

A frozen baseline must define **when it re-anchors** — otherwise drift reflects *plan edits*, not *adherence*. If a user adds a new debt or changes their paycheck, their balance jumps relative to a baseline that never saw that change → they'd look catastrophically "behind" through no fault of their own. Options:

- **(a) Never re-anchor** — drift always measures against the original plan. *Rejected:* any material plan change makes drift meaningless/discouraging.
- **(b) Re-anchor on every edit** — drift always measures "since your last change." *Rejected:* can never show a cumulative "N days behind" story — the whole point of the feature.
- **(c) [RECOMMENDED] Re-anchor only on MATERIAL structural changes** — a new debt added, a debt removed, or a paycheck change beyond a threshold (e.g. >±10%). Normal cycle progression, small edits, and payment behavior do NOT re-anchor. Between re-anchors, drift measures **pure adherence**. When a re-anchor fires, surface it plainly ("Plan updated — your drift baseline reset"). *Why:* keeps the cumulative-accountability story while staying fair to the user; the materiality threshold is the tunable.

**Jason to confirm (c) + the materiality threshold, or pick another.** This is the one thing to settle before Phase-2.1 code.

## 5. Recording sequence — MUST start in v1.7
A migration can only *stamp*, not backfill — pre-v1.7 cycles have no recoverable baseline. So:
- **Write the baseline** when the plan is first meaningfully established (onboarding complete / first debt+paycheck set), and on each re-anchor (§4). Capture site is ready: `handleRolloverPayCycle` (`app/page.tsx:904`) has `debts`, `payoffStrategy`, `result`, `nextPaycheckDate` in scope; the baseline write slots in where `allRequiredMet` is already derived.
- **Even a perfect tracker shows an empty headline for a new user until several cycles roll** — so v1.7 ships the recording + a graceful "building your drift history…" empty state; the number becomes meaningful after a few cycles. (This is why differentiation-audit finding #3 said lead conversion with the day-one-demoable amortization calendar and position Drift as the *deepening* moat.)

## 6. Migration
Additive optional key + (if the skipped-rec attribution is wanted later) an optional per-cycle field. Register `MIGRATIONS[3]`, bump `CURRENT_SCHEMA_VERSION` 2→3 (`lib/storage/migrateState.ts`). Old installs simply lack `driftBaseline` and get one written on their next plan-establish/rollover. **Carries into the RN app verbatim** via `packages/core` (schema + migrations are portable).

## 7. Gating & placement
`premium_plus` (gated by the existing `hasFeatureAccess`). Placement/framing TBD with the 0.2 IA verdict (it's an accountability surface — likely a Plan-tab or dedicated "Progress/Journey" destination). Ships as its own component (per the tech-debt audit — do NOT bolt it into the 1396-line SnowballSection, or the migration extracts a moving target).

## 8. RN-migration note
`computeDrift` + the baseline type + the migration live in `packages/core` (portable, test-locked). Only the Drift Tracker *component* is rebuilt in RN. The reconciliation test is the parity oracle — the RN Drift screen must produce identical `daysBehind` for identical inputs.
