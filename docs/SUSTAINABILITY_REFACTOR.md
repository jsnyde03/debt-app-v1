# Sustainability Refactor — a standing, incremental initiative

_Started v1.5 (2026-07-02). The umbrella for paying down structural/technical debt so the
project stays maintainable as it grows._

## Why this exists

Debt Planner was built quickly and changed direction several times. That speed shipped a real
product, but it left accumulated debt: duplicated helpers, the same type defined several ways,
logic living in the wrong place (e.g. a 1,255-line `page.tsx` doing five jobs), and a file
structure that grew by accretion rather than design. None of it is a bug; all of it makes the
next change slower and riskier than it should be.

**This is the debt-app; it's the portfolio's most volatile app** (see the "keep v1.5 whole"
decision). Refactoring toward sustainability now is a deliberate investment that keeps later
versions — and the eventual Android build and Freedom port — from fighting the same messes.

## The one hard principle: **not all at once**

Take a **bounded slice per version**. A big-bang refactor on a volatile app is how you destabilize
it. Each version pulls one or two well-scoped items from the inventory below, does them to a
behavior-preserving, test-backed standard, and stops. The inventory is the memory; the pace is
deliberate.

Rules that apply to every slice:
- **Behavior-preserving.** Restructuring, not redesign. Anything touching money/logic gets a
  reconciliation test in the same commit (per `RELEASE_CONFIDENCE.md`).
- **Bounded + committed incrementally** so any regression bisects to one small change.
- **Keep the e2e suite green** (the 2.14 CI gate) across every slice.

## Debt inventory (living list — add as it surfaces, pull from as versions allow)

### In progress
- **`page.tsx` → orchestrator** — extract the five non-orchestration jobs (plan-exec math, backup
  system, rollover engine, CSV wiring, ~250 lines of inline chrome JSX) into hooks / pure fns /
  components. Full plan + phasing in [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md).
  **v1.5 does Phases 1–2 only (2.18)**; Phases 3–5 (math-risk) are a future slice.

### Queued (surfaced during 2.18, not yet scheduled — pull into a future version)
- **Duplicate `roundMoney` (×12) + `clampMoney`** — the same `Math.round(x*100)/100` is
  re-declared locally in `page.tsx`, `ResultsSection.tsx`, and 10 `lib/` modules
  (`buildCycleSnapshot`, `projectForecast`, `recommendedActions`, `allocatePaycheck`,
  `calculateMonthlyInterest`, `projectDebtPayoff`, `applyDebtPaymentProjection`,
  `buildAmortizationSchedule`, `extraPaymentPlan`, `applyRolloverPayment`) while
  `lib/utils/money.ts` already exports the canonical pair. Consolidate all local copies to the
  shared import. Mechanical + behavior-preserving (verify each copy is byte-identical first;
  flag any variant rounding); regression-suite backed. _Slice size: ~12 tiny edits, one commit._
- **`CompletedRecommendedAction` type fragmentation (×4)** — defined with **differing shapes** in
  `lib/storage/debtPlannerStorage.ts`, `lib/engine/recommendedActions.ts`,
  `lib/timeline/buildTimelineItems.ts`, and `app/page.tsx`. Consolidate to one canonical type
  (the persisted storage shape is the source of truth) and import it everywhere. _Pairs naturally
  with the orchestrator's Phase 3/4 typing work._
- **`livingExpenses` preset-default duplicated** _(surfaced 2.18 Phase 1)_ — the seed default
  `livingExpensePresets.map((e, i) => ({ ...e, id: ` + "`living-${i}`" + ` }))` now lives in both
  `useLivingExpenses.ts` and the backup-restore fallback in `page.tsx` (~:607). Extract to one
  shared constant. Tiny; fold into a nearby slice.
- **File-structure orientation** — the folder layout grew by accretion; a deliberate pass over
  `lib/` and `components/` grouping/naming once the above land (to be inventoried when scheduled).

## How to use this doc

When a version has room for a sustainability slice, pull one or two items from **Queued**, move
them to **In progress**, ship them behavior-preserving + committed incrementally, then check them
off. Surface new debt here the moment it's spotted — capture is the point; the fix waits its turn.
