# Sustainability Refactor — a standing, incremental initiative

_Started v1.5 (2026-07-02). The umbrella for paying down structural/technical debt so the
project stays maintainable as it grows._

## Why this exists

Debt Planner was built quickly and changed direction several times. That speed shipped a real
product, but it left accumulated debt: duplicated helpers, the same type defined several ways,
logic living in the wrong place (e.g. a 1,513-line `page.tsx` doing five jobs), and a file
structure that grew by accretion rather than design. None of it is a bug; all of it makes the
next change slower and riskier than it should be.

**This is the debt-app; it's the portfolio's most volatile app** (see the "keep v1.5 whole"
decision). Refactoring toward sustainability now is a deliberate investment that keeps later
versions — and the eventual Android build and Freedom port — from fighting the same messes.

## ⚠️ v1.6 Opening Audit — verified corrections (2026-07-05)

_A 9-agent audit verified this inventory against current code. Corrections + the v1.6/v1.7 split of items. Full plan → `V16_PLAN.md §Opening Audit`._

**Inventory corrections (stale claims fixed):**
- **`roundMoney` = 13 total decls** (money.ts canonical + **12 dups to collapse**) — 11 byte-identical `function` decls + 1 inline arrow (`allocatePaycheck.ts:83`). _(V17_PLAN §1.1's "~13 local decls" counts inclusive of the canonical; the dedup removes the 12 dups.)_ Any ESLint no-re-declaration guard must match **both** the function-decl AND arrow-const forms.
- **`clampMoney` is a DEAD export, not a dup** — used nowhere. Don't "dedup" it; **wire it in** at v1.7 (`formatCurrency(clampMoney(x))` in the forecast + insights formatters, which currently lack a NaN-guard) so it earns its place.
- **`getDebtsWithDisplayBalances` is already migrated** to the shared `money`/`formatCurrency` utils — one site already done; the roundMoney dedup just finishes the pattern.
- **✅ DONE (v1.6 step 1.3, `19c8b8d`) — `CompletedRecommendedAction` consolidated to ONE canonical.** Exact set on inspection = **6 decls under that name** (storage[canonical superset] · page.tsx[identical] · timeline[subset] · engine[subset] · `ResultsSection`[subset] · `SnowballSection`[subset]) **+ `DemoCompletedRecommendedAction`** (the "4 defs" was an undercount). All collapsed onto the storage export; every site imports it. `label`/`recommendedAmount` kept **REQUIRED** (real persisted invariants — page.tsx is the sole constructor & always writes them), narrow test fixtures extended to match. **`CompletedSnowballAction`** (the structural cousin in `getDebtsWithDisplayBalances`) intentionally left decoupled. Type-only, zero runtime change; regression stayed green. **Deferred to v1.7:** relocate the canonical from `lib/storage/` to a neutral `lib/types/` layer (decision #4).
- **Bigger, previously-unlisted type drift:** `Debt` defined 2× (engine vs storage-**superset**) and `Goal` 3× (engine=storage + `useGoals` adds `originalCurrentAmount?`) — **engine-math-adjacent**, compatible today only by subset luck. Higher-stakes than `CompletedRecommendedAction`. **→ v1.7, reconciliation-test-gated** (~31 `@/` import sites). Also: `AllocationResult = ReturnType<typeof allocatePaycheck>` re-declared 6×; the `"emergency"|"snowball"|"optional_goal"` union inlined ~8× (only engine exports the named `RecommendedCategory`).
- **✅ FIXED (v1.6 step 1.4, `aeda6d2`) — the mark/unmark balance-drift bug.** On investigation the critique's stated mechanism ("stores clamped, subtracts stored → target-edited-while-marked mis-restores") was **wrong — that path is symmetric.** The real defect: the mark branch's `Math.min(item.targetAmount, current + safe)` clamp silently dropped an **over-funded** goal's `currentAmount` (current > target, reachable by lowering a target after funding) down to target, unrecorded → unmark couldn't restore it (money lost). Fix: extracted pure `markGoal`/`unmarkGoal` (`lib/debt/reconcileGoalAmount.ts`), dropped the clamp so mark is a pure `+=` of the room-clamped amount → mark/unmark are exact inverses; `testGoalReconciliation` pins the invariant (proven to have teeth). **This is the test-first guard for Phase 4** (below) — the full handler extraction still stands.
- **Orchestrator phases reclassified:** Phase 4 (`handleMarkRecommendedAction` goal-reconciliation) was the math-risk one — **its goal-delta math is now extracted + tested** (`reconcileGoalAmount.ts` + `testGoalReconciliation`, v1.6 step 1.4), so the remaining Phase-4 work is **de-risked**: extract the handler wiring / backup coupling → v1.7, guarded by the existing reconciliation test. Phase 5 (`handleRolloverPayCycle`) is now **LOW-risk** — the interest/payment math is already extracted to the pure, 7-test-covered `applyRolloverPayment.ts`; only glue remains. Phase 3 (`usePlannerBackup`) is coupling-risk, not math-risk.
- **`page.tsx` is 1513 lines** (was 1245 at the v1.6 audit; §E autopay + post-lock fixes grew it ~270). The extraction target stays **~700–900 lines** (legitimate cross-domain glue — undo/windfall/milestone/streak — has accreted), **paired with a hard rule: new cross-cutting capture state goes into ONE narrow purpose-built hook, NOT page.tsx.** **v1.7 §1.3 also extracts the two component God-files** surfaced 2026-07-17: `SnowballSection.tsx` (**1396**) + `ResultsSection.tsx` (908), reconciliation-test-gated where money display is touched.
- **Dead deps to purge (v1.6):** `expo`, `react-native`, `@babel/core`, `@types/gensync` — imported nowhere; misrepresent the Next+Capacitor stack. Plus a dead `currentDate` prop threaded page→PlanSettingsBody→PaycheckSection.

**Structural verdict: KEEP everything, zero pivots** (pure-TS engine, Next+Capacitor, bottom-tab nav, class-scoped `.dark-theme`, two-layer test infra all correct for the most-volatile app). **Re-confirmed at the v1.7 Phase-0 switch-in (2026-07-17): KEEP-all still holds.** Only the `page.tsx` orchestrator *evolves* (bounded Phases 3-5 + the narrow capture hook). Nav re-eval flag → **resolved KEEP** (re-opened at fintech-polish altitude by the v1.7 §0.2 IA/nav audit). Tailwind v4 → **drop in v1.7** — confirmed 2026-07-17 as a bounded **§1.4** slice (cuttable→v1.8; app barely uses utilities ~15 spots, only the preflight reset needs replacing + both-theme visual verification). **CSS co-location → CUT to v1.8+** (high-churn, low-value, regression-risk on a live earner; the 11-file global split works). **NEW: a v1.7 §0.4 Capacitor-constraint evidence audit** (adversarial, evidence-only, "is Capacitor limiting Debt vs Freedom's native bar?") is now pulled active — feeds, does not pre-decide, the migration re-eval.

**v1.6 refactor slice (bounded to 3 spine-dependent items):** CI keep-green gate (+ Windows exit-code trap) · `getPortalTarget()` theme-safety · `CompletedRecommendedAction` canonicalization. **Everything else → v1.7** (orchestrator 3-5, Debt/Goal unification, `lib/types/` relocation, seed unification + screenshot re-baseline, Tailwind drop, dead-dep purge if not folded in, component God-file extraction, CSS co-location).

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
  **v1.5 Phases 1–2 DONE (2.18.1 `e40a260` · 2.18.2 `7cae993`)** — CSV/livingExpenses/display-balance
  relocations + `AppHeader`/`AppNav`/`PlanSettingsSheet` extraction. **Phases 3–5 (backup hook,
  plan-exec hook, rollover engine — math-risk) remain a future slice**, sequenced by the audit below.

### Queued (surfaced during 2.18, not yet scheduled — pull into a future version)
- **Duplicate `roundMoney` (×12) + `clampMoney`** — the same `Math.round(x*100)/100` is
  re-declared locally in `page.tsx`, `ResultsSection.tsx`, and 10 `lib/` modules
  (`buildCycleSnapshot`, `projectForecast`, `recommendedActions`, `allocatePaycheck`,
  `calculateMonthlyInterest`, `projectDebtPayoff`, `applyDebtPaymentProjection`,
  `buildAmortizationSchedule`, `extraPaymentPlan`, `applyRolloverPayment`) while
  `lib/utils/money.ts` already exports the canonical pair. Consolidate all local copies to the
  shared import. Mechanical + behavior-preserving (verify each copy is byte-identical first;
  flag any variant rounding); regression-suite backed. _Slice size: ~12 tiny edits, one commit._
- ✅ **DONE (v1.6 step 1.3, `19c8b8d`) — `CompletedRecommendedAction` consolidated to ONE canonical.**
  Was ~6 divergent decls (storage/engine/timeline/page/ResultsSection/SnowballSection) + a demo type;
  all collapsed onto the storage export, every site imports it. _(This line previously listed it as an
  open ×4 TODO — that was the DONE-vs-TODO self-contradiction; corrected 2026-07-18.)_ Remaining v1.7
  follow-on: relocate the canonical `lib/storage/` → neutral `lib/types/` (§1.2).
- **`livingExpenses` preset-default duplicated** _(surfaced 2.18 Phase 1)_ — the seed default
  `livingExpensePresets.map((e, i) => ({ ...e, id: ` + "`living-${i}`" + ` }))` now lives in both
  `useLivingExpenses.ts` and the backup-restore fallback in `page.tsx` (~:607). Extract to one
  shared constant. Tiny; fold into a nearby slice.
- **Viewport media-query check triplication** _(surfaced 2.19)_ — the lazy-init idiom
  `typeof window !== "undefined" && window.matchMedia("(min-width: Npx)").matches` is now inlined
  in three components (`ResultsSection` 834px, `TimelineSection` 1024px, `DebtsSection` 834px) as
  `useState` initializers (was a post-mount effect before 2.19). A shared `lib/utils` helper
  (`matchesMinWidth(px)` or a `useIsViewportAtLeast(px)` hook) would DRY it. Fits audit decision #4.
- **Dead `currentDate` prop on `PaycheckSection`** _(surfaced 2.19)_ — removed from the destructure
  to clear the lint warning, but it's still declared in the props type and passed by
  `PlanSettingsBody` (`currentDate={currentDate}`). Fully remove it from the type + caller. Tiny;
  fits audit decision #8 (dead-code hygiene).
- **File-structure orientation** — the folder layout grew by accretion; a deliberate pass over
  `lib/` and `components/` grouping/naming once the above land (to be inventoried when scheduled).

## Scheduled — Comprehensive Sustainability Audit (target: open of v1.6)

_Requested by Jason 2026-07-02. A **dedicated planning session** (audit, not build) that inventories
the accumulated debt against the CURRENT code, makes the cross-cutting decisions below, and emits an
ordered, per-version **refactor slice plan** for v1.6+. It respects "not all at once" — the audit's
job is to decide the sequence and the per-version bite size, not to do everything. Recommended slot:
the **opening item of v1.6** (v1.6 already aggregates deferred debt + the e2e screenshot-seed
migration, so the audit's output drives its slices). The audit itself may conclude the inventory is
large enough to warrant a dedicated sustainability version — that call is made **in** the session._

**Before-scan rule applies:** every premise below is a hypothesis about code that has moved since it
was noted — verify each against current source at session start (see the pre-authored-audit rule).

### Audit agenda — decisions to make (each → an ordered, versioned slice plan)

1. **Refactoring priorities & sequencing** _(Jason #1)_ — take the Queued inventory above + orchestrator
   Phases 3–5 and decide the **order** and **per-version slice size**. Classify each item
   behavior-preserving-safe (mechanical) vs. **math-risk** (needs a reconciliation test in the same
   commit). Output: a numbered slice list mapped to versions.
2. **File-structure orientation** _(Jason #2)_ — the `lib/` and `components/` trees grew by accretion
   (mixed flat files + domain folders; e.g. `ResultsSection.tsx` flat vs. `Debts/`, `PlanSettings/`
   foldered). Decide a **target tree** + **naming conventions** + a low-risk migration approach
   (the `@/` alias makes moves cheap but touches many imports — batch + verify per move).
3. **Type consolidation** — one canonical source per domain type. Anchor case `CompletedRecommendedAction`
   **✅ DONE v1.6** (consolidated to one canonical). **Remaining → v1.7 §1.2:** `Debt`(×2)/`Goal`(×3)
   unification (~31 sites, engine-adjacent, reconciliation-test-gated) + relocate canonical types
   `lib/storage/` → neutral `lib/types/`.
4. **Shared-utility dedup policy** — `roundMoney` ×12 + `clampMoney` + the `livingExpenses` preset-default
   dup → shared `lib/utils/*`. Decide the module boundaries and whether a lint rule can forbid local
   re-declaration going forward.
5. **Orchestrator finish (Phases 3–5)** — backup hook · plan-exec hook · rollover engine (all math-adjacent).
   Decide sequencing + the **mandatory reconciliation-test** gate per phase, and which version each lands in.
6. **Test & keep-green infrastructure** — fold in the deferred test-hardening bundle (e2e screenshot-seed
   migration, onboarding-landscape flake, Windows worker-teardown hang, root-lockfile warning,
   `validate:release`-in-CI). Decide what test-infra hardening pairs with the refactor so each slice stays
   bisectable and green (the 2.14 CI gate must stay green across every slice).
7. **React-pattern / render hygiene** — the standing lint **errors** (refs-during-render ×2,
   setState-in-effect) are genuine React anti-patterns, not noise. Decide whether to adopt the newer
   patterns as part of the refactor and whether a `react-hooks` gate belongs here (ties into 2.19).
8. **Dead-code & config hygiene** — unused exports/imports (the ~13 warnings), the "additional lockfiles"
   warning (duplicate root `package-lock.json`), Next 16 turbopack config, and the Capacitor
   `ios/App/App/public/` bundle polluting lint. Decide a bounded hygiene-pass scope.
9. **CSS architecture** _(lower priority — decide if in-scope)_ — the 10-file global split (`00-10-*.css`):
   keep global-split, or move toward co-located / CSS-module styles as components get extracted. Likely a
   later slice; the audit just decides whether it's on the roadmap.

_Decisions 1–2 are Jason's named priorities; 3–8 are the recommended core additions; 9 is optional/deferred._

## How to use this doc

When a version has room for a sustainability slice, pull one or two items from **Queued**, move
them to **In progress**, ship them behavior-preserving + committed incrementally, then check them
off. Surface new debt here the moment it's spotted — capture is the point; the fix waits its turn.
