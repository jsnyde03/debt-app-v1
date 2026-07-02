# v1.5 — Track Your Journey

_Part of the [Implementation Plan](IMPLEMENTATION_PLAN.md). **Status: 🔄 In progress — active build on `v1.5-dev`; workstreams 1–6 all done 2026-07-01 (Pay Cycle History, Milestones, Amortization lite, Streaks, #13 Delta, #15 Settings UX rework). Next: Mobile P5 skeletons (7) + P6 micro-interactions (8), Page Orchestrator (10), Android prep (11).** This is the dedicated build + release checklist for v1.5. Every box below must be checked to qualify for release. Last updated: 2026-07-01._

**Theme:** Everything that helps users understand where they've been and celebrate how far they've come. Pay Cycle History is the data foundation; milestones, streaks, amortization, and charts make that data meaningful.

**Size:** Large. This is the biggest v1.x release — six user-facing features, two internal refactor phases, mobile polish, and Android groundwork. Treat it as a milestone, not a quick turn.

---

## Status at a glance

| # | Workstream | Tier | Status |
|---|---|---|---|
| 1 | Pay Cycle History (data foundation) | Premium / Premium+ | ✅ Done (2026-07-01) |
| 2 | Debt Milestones + Payoff Celebration | Free / Premium+ | ✅ Done (2026-07-01) |
| 3 | Amortization — Premium *lite* view (focus debt); full calendar → v1.6 | Premium | ✅ Done (2026-07-01) |
| 4 | Streaks | Free / Premium+ | ✅ Done (2026-07-01, Free count; Premium+ chart → v1.6) |
| 5 | UX #13 — Since-Last-Cycle Delta | All | ✅ Done (2026-07-01) |
| 6 | UX #15 — Settings UX Rework | All | ✅ Done (2026-07-01, accordion + first-run modal) |
| 7 | Mobile P5 — Context-aware skeletons | All | ✅ Done (2026-07-02) |
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

**Build steps:** ✅ **Done 2026-07-01.**
- [x] New `lib/debt/computeMilestones.ts` — pure function comparing each debt's **pre- vs post-rollover** balance against `originalBalance`; returns the thresholds **newly crossed this cycle** (25/50/75/100%, highest wins on a big jump), plus `allDebtsPaidOff` / `newlyAllPaidOff`. Needs both balances (not just current) so a threshold fires exactly once, on the cycle it's crossed — never re-firing on later rollovers.
- [x] New `components/MilestoneBadge.tsx` — a full-screen celebration overlay with three tiers: **progress** (25/50/75% — ✨/🔥, success haptic, no confetti), **paid-off** (100% — 🏆, medium haptic, confetti), **debt-free** (all paid — 🎉, medium haptic, heavier confetti). Deterministic seeded confetti (render-pure, SSR-safe — no `Math.random` during render). Both themes verified.
- [x] **Debt payoff celebration (UX #19b):** a debt crossing 100% on rollover triggers the distinct paid-off experience — `triggerMediumHaptic()`, full-width confetti celebration card, debt's name prominent. **Not subdued** — screenshot-verified premium in light + dark.
- [x] Wired into `handleRolloverPayCycle`: payments applied once, milestones computed from before/after, then the single most-significant celebration is surfaced (debt-free > paid-off > highest progress threshold). _(Mobile P6 motion is §8, later; entrance uses the existing `centerModalIn`/pop easing meanwhile.)_

**Tier:** Free (badges); Premium+ (calendar context on the celebration card — deferred with the v1.6 tier, like amortization's full calendar).

**Tests required:** ✅
- [x] Regression (`lib/debt/testComputeMilestones.ts`, 12 assertions): each of 25/50/75/100% detected once on its crossing; no re-fire past a crossed threshold; big-jump reports the highest; all-paid-off + newly-vs-already distinction; edge cases — `originalBalance` unset, balance increased, sub-25% progress, mixed paid/owing.

**Files:** `lib/debt/computeMilestones.ts` (new), `lib/debt/testComputeMilestones.ts` (new), `components/MilestoneBadge.tsx` (new), rollover wiring in `app/page.tsx`, celebration CSS in `09-anim-swipe-media-misc.css`.

---

## 3 — Amortization (v1.5: Premium *lite* view; Premium+ full calendar → v1.6)

**Scope decision (2026-07-01):** Premium+ isn't purchasable until v1.6 (3-tier infra), so v1.5 builds **only the Premium *lite* view** — a per-debt schedule for the user's **current/focus debt** — plus the shared engine + reconciliation test. The **Premium+ full / all-debts calendar defers to v1.6**, bundled with the tier that makes it sellable (no point gating a feature behind a tier no one can buy). Build the lite as focus-debt-only from the start so v1.6 doesn't have to claw back an all-debts view from Premium.

**Build steps (v1.5 — lite):** ✅ **Done 2026-07-01.**
- [x] New `lib/debt/buildAmortizationSchedule.ts` — loops the existing `lib/debt/applyDebtPaymentProjection.ts` (single-month step) to produce a month-by-month schedule until payoff. **Reuse, don't reinvent.** Returns `{ rows, totalInterest, totalPaid, monthsToPayoff, payoffPossible }`; mirrors `projectDebtPayoff`'s `MAX_MONTHS` (600) + `cannotAmortize` negative-amortization early-out. (Engine is tier-agnostic; both lite and the future full calendar consume it.)
- [x] New `components/AmortizationCalendar.tsx` — per-debt table view (Month · Interest · Principal · Balance) for the **focus debt** (`payoffOrder[0]`), reachable via a **"View Schedule"** button on the focus strip in `SnowballSection`, gated via `hasFeatureAccess(plan, "amortization_schedule")` to **Premium** (new `PremiumFeature`, not Premium+-only). Free users route straight to the paywall; premium sees the schedule paid at the debt's minimum + recommended snowball extra. Both themes verified.

**Tier (v1.5):** Premium (lite — focus debt only). _Premium+ full calendar (all debts) → v1.6, with the 3-tier infra._

**Tests required (mandatory — finance math):** ✅
- [x] **Reconciliation test:** `buildAmortizationSchedule`'s total interest equals `projectDebtPayoff`'s `totalInterestPaid` for identical single-debt inputs — 5 cases across APRs/payments in `lib/debt/testAmortizationSchedule.ts`. (Exact: interest on sub-cent residuals rounds to 0, so the normalize-vs-round endgame difference never touches the interest total.)
- [x] Regression: schedule terminates at payoff; final balance is exactly 0; row-to-row balance continuity; zero-APR, already-paid-off, and negative-amortization debts handled. Plus e2e (`tests/e2e/planner-amortization-flow.spec.ts`): premium opens the schedule → lands at $0; free sees the Premium pill → paywall. Green on all 4 device profiles.

**Files:** `lib/debt/buildAmortizationSchedule.ts` (new), `lib/debt/testAmortizationSchedule.ts` (new), `components/AmortizationCalendar.tsx` (new), `components/SnowballSection.tsx` (entry point), `lib/subscription/features.ts` (+ `testSubscriptionGating.ts`), `tests/e2e/planner-amortization-flow.spec.ts` (new), CSS in `03-nav-results-modals.css` + `06-forecast-and-payoff-shell.css`.

**Risk:** Medium — the reconciliation test is where the time goes. Budget for it.

---

## 4 — Streaks

**Build steps:** ✅ **Done 2026-07-01 (Free count; Premium+ chart deferred to v1.6 with the tier).**
- [x] Derive from `cycleHistory`: consecutive most-recent snapshots where `totalPaidThisCycle >= recommendedThisCycle` ("stayed on plan"). **Data-model note:** the snapshot didn't carry a "required" total, and comparing paid against only the *completed* actions' amounts is trivially always-true — so this added an optional `recommendedThisCycle` to `PayCycleSnapshot` (sum of the plan's snowball + emergency + optional-goal allocations for the cycle), set in `buildCycleSnapshot`, computed at rollover from `result.allocations`. Optional field → snapshots persisted before it (and cycles the plan asked nothing extra of) count as on-plan (`required` 0). This *refines* the spec's loose `totalRequired` to a concrete, honest, interest-immune "did you do your part" bar.
- [x] New pure `lib/debt/computeStreak.ts` (`computeStreak` + `isCycleOnPlan`) — counts backward from the latest cycle (history is oldest-first), stops at the first break.
- [x] Surfaced as a small `🔥 N cycles on plan in a row` stat at the **Plan-tab top** (first child of `plan-tab-grid`, spans both columns on wide layouts; hidden at streak 0 so a new user never sees "0"). **Free** — always visible, no gate. _Premium+ historical chart reuses the existing History view → deferred to v1.6 with the tier, like the amortization full calendar + milestone calendar-context._

**Tier:** Free (count) + Premium+ (chart → v1.6).

**Tests required:** ✅
- [x] Regression (`lib/debt/testComputeStreak.ts`): full qualifying run, a broken streak (only the most-recent run counts), a broken *most-recent* cycle (→ 0), empty history (→ 0), exact-meet (`>=`), zero-required cycle, and a legacy snapshot missing `recommendedThisCycle`. Plus a new `buildCycleSnapshot` assertion that it carries `recommendedThisCycle`.

**Files:** `lib/debt/computeStreak.ts` (new), `lib/debt/testComputeStreak.ts` (new), `lib/storage/debtPlannerStorage.ts` (+ `recommendedThisCycle`), `lib/history/buildCycleSnapshot.ts`, `app/page.tsx` (rollover wiring + Plan-tab stat), streak CSS in `03-nav-results-modals.css` + `09-anim-swipe-media-misc.css`.

---

## 5 — UX #13: Since-Last-Cycle Delta Indicator

_Depends on #1 cycle history. Must not be built before it lands._

**Build steps:** ✅ **Done 2026-07-01.**
- [x] Uses `usePayCycleHistory`'s existing `previousSnapshot` getter (no hook change needed).
- [x] New pure `lib/debt/computeCycleDelta.ts` — `delta = previousSnapshot.totalDebtBalance − currentTotalDebt` (current = sum of live `debt.balance`, matching how the snapshot was recorded → the number reflects what the last rollover actually moved). `> 0` → green `↓ $X` "paid down since last cycle"; `< 0` → amber `↑ $X` "since last cycle"; no previous snapshot **or** a $0/sub-cent change → render nothing (no clutter). Returns `{direction, amount}` or `null`.
- [x] Rendered as `.summary-strip-delta` directly under the `execution-summary-strip` in `ResultsSection`, `tabular-nums`, with `TrendingDown`/`TrendingUp` icons and an `aria-label`. **Interest honesty:** because it's measured on total balance (incl. accrued interest), a tight cycle can show amber ↑ even if the user paid — deliberately kept neutral ("since last cycle"), not scolding; the interest-immune "did you do your part" signal is the Streak, so the two complement rather than contradict.
- [x] Regression `lib/debt/testComputeCycleDelta.ts`: down, up, no-previous (null + undefined), no-change → null, sub-cent → null, cents preserved.

**Files:** `lib/debt/computeCycleDelta.ts` (new), `lib/debt/testComputeCycleDelta.ts` (new), `components/ResultsSection.tsx` (+ `previousSnapshot` prop), `app/page.tsx` (passes `previousSnapshot`), `app/styles/03-nav-results-modals.css` (`.summary-strip-delta`). See [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) #13.

---

## 6 — UX #15: Settings UX Rework

**✅ DECIDED 2026-07-01 (Jason): Accordion / in-place expansion for returning users; keep the focused modal for first-run onboarding.** Rationale: the 4 bottom-nav tabs (Plan/Bills/Payoff/Goals) are all frequent *task* destinations — infrequent config doesn't earn a permanent nav slot, and 5 items at 375px crowds touch targets (premium-bar concern). The accordion matches the existing `plan-section-body` collapse pattern already in the codebase and kills the "open a whole modal to change one field" friction. First-run genuinely wants a focused, non-dismissible surface, so the modal stays there (`isFirstRunSetup`). _(Rejected: the 5th-nav-tab option — simpler but crowds the nav and prime-slots rarely-used config.)_

**Build steps:** ✅ **Done 2026-07-01.**
- [x] Pick the approach — **accordion (returning) + modal (first-run).**
- [x] **Extracted the settings body into one shared `components/PlanSettings/PlanSettingsBody.tsx`** (dovetails with the Page-Orchestrator Phase-2 `PlanSettingsSheet` extraction — credit it there) so the first-run modal and the returning-user accordion render the *same* fields without duplication. Container-agnostic via `onClose` / `onOpenHistory`. Zero-behavior-change refactor, modal verified identical (step 8.1).
- [x] Accordion: both settings gears (plan-toolbar + sidebar) now **toggle** `showPlanSettings` (aria-expanded); for returning users it expands `<PlanSettingsBody>` inline **under the hero** (between hero and tab content, so it shows on any tab) via a `.plan-settings-accordion` max-height/opacity/visibility transition (mirrors `plan-section-body`, taller cap for the long body). The theme 3-way (#27 Auto/Light/Dark) already lived in the body, so it rides along — no separate hero theme button to remove.
- [x] **First-run onboarding still uses the focused modal** — modal gated to `showPlanSettings && isFirstRunSetup`, non-dismissible, "Create Your First Plan", now rendering the shared body. Screenshot-verified: first-run modal + returning accordion, both light + dark.

**Files:** `app/page.tsx`, `components/PlanSettings/PlanSettingsSheet.tsx` (or its Page-Orchestrator-Phase-2 successor), `app/styles/03-nav-results-modals.css`.

---

## 7 — Mobile P5: Context-Aware Skeleton Loading

**Build steps:**
- [x] Split `components/AppSkeleton.tsx` into shape-specific pieces composing the loading screen — new `components/Skeleton/PlanSkeleton.tsx` (the Plan silhouette: hero + a "This Paycheck" summary panel holding a status line + the adaptive 2×2→4-col metric grid + action-row bars). `AppSkeleton` is now the shell (app frame + nav) that renders it. Reuses the `skeletonShimmer` base (no new animation).
- [x] Render the composed skeleton matching the tab active on load. **Before-scan finding:** `activeTab` is `useState("plan")` — **not persisted** — so the app always opens on Plan; the Plan silhouette is the only one needed today. Per-tab (debt-row-shaped) skeletons would be speculative dead code until the tab is persisted → deferred with the "persist the active tab" backlog item (MASTER_PLAN §9 v1.6). Added `aria-busy`/`aria-label` for real loading semantics.

**Shipped/verified (2026-07-02):** silhouette matches the real Plan tab, screenshot + DOM-measured across light/dark × phone/iPad (iPad metric grid correctly goes 4-across; rows full-width — an early "narrow rows" read was just the faint light-theme shimmer, disproven by `boundingBox` = 722px). Keep-green: empty-state + onboarding specs pass. **After-scan → backlog (v1.6):** slightly higher light-theme skeleton contrast + an iPad sidebar-rail silhouette (the skeleton currently shows no nav on iPad).

**Files:** `components/AppSkeleton.tsx`, `components/Skeleton/PlanSkeleton.tsx`, `app/styles/09-anim-swipe-media-misc.css`. See [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) P5.

**Verification:** Visual only — silhouette roughly matches real content per tab. **Risk:** Low. ✅ Done.

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

- [ ] `npm run lint` passes — **fully clean (0 errors, 0 warnings).** As of 2026-07-01 it reports ~2,020 problems, but **~1,994 are in `ios/App/App/public/_next/static/chunks/*.js`** — Capacitor's copy of the compiled/minified Next.js bundle, which must not be linted. Fix = ignore the Capacitor web-copy (`ios/App/App/public/`) in eslint config, then clear the small handful of real source issues (4 errors + ~13 warnings across `app/page.tsx`, `WelcomeStep.tsx`, `SnowballSection.tsx`, `FirstDebtOrBillStep.tsx`, `PaycheckSection.tsx`, `ResultsSection.tsx`). Tracked as its own v1.5 step in the master-plan queue.
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
