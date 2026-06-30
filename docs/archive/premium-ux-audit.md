# Premium UX Audit — Debt Planner

_Written: 2026-06-27. Last updated: 2026-06-27 (post-v1.4). Scope: current product state. Items 1–18 from the original audit pass, items 19–28 from the second (code-verified) pass. Do NOT implement anything from this document without a separate implementation plan._

---

## Current Strengths (What's Already Genuinely Premium)

These are the parts of the current product (v1.4) that already punch above their weight and should be preserved and built on.

- **Allocation engine** — the per-paycheck math (expenses → minimums → buffer → snowball → goals) is more sophisticated than most consumer debt apps. This is the real moat.
- **Dark/light/system theme** — glass-morphism cards, backdrop blur, layered shadows. 3-way theme selector (System/Light/Dark) respects OS preference in real time. Feels like a native fintech app.
- **Haptic feedback** — full haptic grammar: light for navigation, medium for meaningful actions (paid, rollover, import success), error haptic for validation failures. Rare among web-wrapped apps.
- **App Lock** — Face ID/Touch ID is a genuine trust signal that competitors often skip. Being free for all tiers is the right call.
- **Smart Insights engine** — rule-based but produces specific, actionable, prioritized guidance. The copy is unusually good for this category.
- **RevenueCat integration** — clean subscription gate architecture, restore purchases, no janky manual receipt validation.
- **Pull-to-refresh, swipe-to-pay** — gestures feel native. Swipe-delete has a 5-second undo toast (no more accidental data loss).
- **Multi-step onboarding** — WelcomeStep → PaycheckStep → FirstDebtOrBillStep → CompletionStep. Demo Mode integrated at WelcomeStep. Exit-demo flows naturally back into real onboarding.
- **Debt-Free Date in execution strip** — the single most motivating number in any payoff app is now the first thing users see in the summary strip.
- **Interest cost callout on debt cards** — `~$X/mo in interest` in red on every non-zero-APR debt. Immediate motivation to prioritize.
- **Directional tab transitions** — tabs slide in from the correct direction, giving spatial context to the 4-tab layout.
- **Display amount styling** — dollar sign and cents at reduced size/weight vs. main digits on the largest hero numbers. Copilot/Robinhood-style tabular treatment.
- **Privacy trust messaging** — "Your data stays on this device — nothing is uploaded or shared." in Settings. Disproportionate trust impact for one `<p>` tag.

---

## Part 1: Critical UX Gaps

---

### 1. No Data Visualization Whatsoever ⬜ v1.5

**The gap.** Every credible premium fintech app (Copilot, YNAB, Monarch, Credit Karma) shows charts. The current app is pure text and numbers. The data is already there — `projectForecast()` produces 3 months of `projectedDebtBalance` + `projectedSafeCash`, the payoff comparison produces interest totals and payoff dates per strategy, the timeline produces a cash-flow sequence — none of it is visualized.

**What to add (in priority order):**

1. **Debt Payoff Trajectory** (Payoff/Snowball tab) — a simple line chart with two lines: snowball path and avalanche path, both plotted as debt balance over months until $0. Even a pure SVG path built from the existing projection data would work. This is the single most emotionally compelling visualization for this app category: showing the user a visible finish line.

2. **3-Month Cash Flow Bars** (Plan tab, inside the Forecast card) — replace the current list of `ForecastMonth` text rows with a 3-bar horizontal bar chart, color-coded by `ForecastStatus` (stable = green, tight = amber, pressure = orange, recovery = red). The text description stays beneath each bar; the chart just makes the trend scannable at a glance.

3. **Per-Debt Progress Arc** (Bills tab, debt list items) — a thin circular arc or small horizontal progress bar showing `(originalBalance - balance) / originalBalance` percent paid off. `originalBalance` is already in the `Debt` type. This makes the debt list feel like a progress dashboard, not a spreadsheet.

**Implementation note:** Use SVG only — no chart library. The data sets are tiny (3 months, ≤10 debts). A library adds bundle weight and a style integration headache that isn't worth it at this scale.

---

### 2. Onboarding Is Abrupt ✅ SHIPPED v1.4

Multi-step `OnboardingFlow` (WelcomeStep → PaycheckStep → FirstDebtOrBillStep → CompletionStep) shipped 2026-06-27, commit e9e8a32. Demo Mode placed on WelcomeStep as secondary CTA. Exit-demo flow re-triggers onboarding naturally. 5 Playwright tests (20 runs across 4 projects) all green.

---

### 3. No "Debt-Free Date" Hero Metric ✅ SHIPPED v1.4

Replaced the "Status" cell in the execution summary strip with a "Debt-Free" cell showing the computed payoff date. Computed via `debtFreeDate` useMemo in `page.tsx`, passed as prop to `ResultsSection`. Shows "Add debts" when no debts exist.

---

### 4. Mark-Paid Has No Satisfying Feedback ✅ SHIPPED v1.4

`cardExit` (200ms dim+scale) + `checkPulse` (400ms green ✓ overlay via `::after`) applied in `DebtRow` and `ExpenseListItem` via `animating-paid` class. Triggered by useEffect tracking paid-state transition. Haptic was already correct (medium).

---

### 5. Smart Insights Cards Are Prose Walls ✅ SHIPPED v1.4

- Title font-size 0.92 → 1.12rem, weight 900
- Action line styled as a chip (`<small>` with faint background + bold prefix)
- Severity left-border widened to 4px with matching very-low-opacity tinted background wash
- Severity is now scannable at a glance

---

## Part 2: Visual & Interaction Polish

---

### 6. Bottom Navigation Is Visually Flat ✅ SHIPPED v1.3

Active state glow + indicator shipped in v1.3 UX Quick Wins pass.

---

### 7. Category Icons on Bills and Debts ✅ SHIPPED v1.4

Expense rows already had category chips. Debt rows now show `<CreditCard>` icon chip for `type === "debt"`, `.bnpl-badge` purple pill for BNPL. Category → icon + color mapping implemented in `DebtRow`.

---

### 8. The Plan Tab Hero Lacks Personality ✅ SHIPPED v1.4

Contextual subtitle once `activeDebts.length > 0`:
- Shortfall state: tight cycle warning
- Debt-free date known: "You're on track to be debt-free in [N] months."
- Default: "Here's what to do this paycheck."

---

### 9. Financial Numbers Lack Display Polish ✅ SHIPPED v1.4

`formatDisplayAmount` helper + `.display-amount-symbol/.display-amount-cents` CSS. Applied to the 3 currency cells in the execution summary strip in `ResultsSection`.

---

### 10. Tab Content Transitions Feel Abrupt ✅ SHIPPED v1.4

`prevTabRef` + `tabDirection` in `page.tsx`. `data-direction="forward|backward"` on content wrapper. `tabSlideInRight/Left` CSS keyframes with `prefers-reduced-motion` fallback. Tab order: Plan=0, Bills=1, Payoff=2, Goals=3.

---

### 11. The Upgrade/Paywall Screen Doesn't Show What Premium Looks Like ✅ SHIPPED v1.4

Frosted-glass preview card beneath the feature list showing 2 blurred mock insight rows with "Unlock with Premium" overlay. Pure CSS — no live data. Makes the abstract feature list concrete.

---

## Part 3: Feature Enhancements

---

### 12. Windfall / One-Time Income Allocation ✅ SHIPPED v1.4

"Got extra money?" card in Plan Settings. Inline form adds windfall to `amount` state, closes the sheet, shows status toast. No new allocation logic — reuses existing paycheck engine. Tier: Free.

---

### 13. "Since Last Cycle" Change Indicator ⬜ v1.5

Depends on v1.5's Pay Cycle History snapshots. Once `previousSnapshot` is available from `usePayCycleHistory`, compute `delta = previousSnapshot.totalDebtBalance - currentTotalDebt` and show a color-coded `↓ $X since last paycheck` line in the summary strip. No data model work needed beyond what v1.5 introduces.

---

### 14. Inline Category / Type Labels on Debt Items ✅ SHIPPED v1.4

BNPL debts show `.bnpl-badge` purple pill and "X payments left" instead of APR when `remainingPayments` is present.

---

### 15. Settings Screen — Not a Modal ⬜ v1.6

The slide-up settings modal is functional but heavy for returning users adjusting one field. Decision: convert to an accordion that expands in-place below the hero (matches existing `plan-section-body` expand/collapse pattern). The 3-way theme control (shipped in v1.4) already belongs there. Verify the accordion works correctly during the v1.4 first-run onboarding path before removing the modal.

---

## Part 4: Architecture / Foundation Quality

---

### 16. Storage Has No Schema Version ✅ SHIPPED v1.3

`loadStoredState` now wraps `JSON.parse` with try/catch + schema version comparison. Shipped as Pre-v1.4 Foundation Fix.

---

### 17. No Accessibility (VoiceOver) Support ✅ SHIPPED v1.4

`aria-label` on hero `<section>` + both `<nav>` elements. `role="region"` + dynamic `aria-label` on the tab content wrapper. `aria-live="polite"` + `aria-label` on execution summary strip. Full v1.12 audit still planned — this closes the most obvious gaps that could trigger App Store rejection.

---

### 18. Dark/Light Mode Should Follow System Setting by Default ✅ SHIPPED v1.3

`useDarkMode` initializes from `window.matchMedia('(prefers-color-scheme: dark)').matches` when no user preference is stored. Shipped v1.3 UX Quick Wins. Upgraded to full 3-way selector (System/Light/Dark) in v1.4 (#27).

---

## Part 5: Code-Verified Quality Gaps (Second Audit Pass — 2026-06-27)

---

### 19. Rollover Action Is Completely Silent ✅ SHIPPED v1.3

`triggerMediumHaptic()` + `setStatusMessage("Cycle complete — great work!")` added to `handleRolloverPayCycle`. Shipped v1.3 Critical Immediate Fixes.

Debt-payoff celebration moment (19b) — when a debt crosses $0 during rollover — is planned for v1.6 alongside `MilestoneBadge` and `computeMilestones`.

---

### 20. Swipe-to-Delete Has No Confirmation or Undo ✅ SHIPPED v1.4

`restoreDebt`/`restoreExpense` in hooks. `handleRemoveDebtWithUndo`/`handleRemoveExpenseWithUndo` in `page.tsx` with 5-second timer. `.undo-toast` + `.undo-toast-button` CSS. Matches the standard iOS Mail/Safari undo-swipe pattern.

---

### 21. Currency Inputs Use Wrong Keyboard Type on iOS ✅ SHIPPED v1.3

All currency/number fields changed to `type="text" inputMode="decimal"`. Shipped v1.3 Critical Immediate Fixes.

---

### 22. No Sheet Grabber Handle on Any Modal ✅ SHIPPED v1.4

`::before` pill (36×4px rounded, semi-transparent) on `.settings-sheet` + `.upgrade-modal-card`. Add Debt/Expense/Goal modals included.

---

### 23. Status Toast Has No Animation ✅ SHIPPED v1.4

`toastEnter`/`toastExit` keyframes. `.exiting` class added 180ms before clearing `statusMessage` — two-timer exit pattern in `page.tsx`. `prefers-reduced-motion` fallback in place.

---

### 24. Staggered List Animations Applied Only to Goals ✅ SHIPPED v1.4

`debt-list-item` + `required-expense-row` now use `cardReveal` + nth-child stagger delays (30/60/90/120ms). Matches the existing Goals pattern. `prefers-reduced-motion` fallback in place.

---

### 25. No Interest Cost Per Debt on Debt Cards ✅ SHIPPED v1.4

`calculateMonthlyInterest` called per debt row. `~$X/mo in interest` rendered as `.debt-interest-callout` in `var(--status-bad-strong)` at `font-size: 0.75rem`. Hidden for BNPL debts and debts with APR=0.

---

### 26. Haptic Grammar Is Inconsistent ✅ SHIPPED v1.4

`triggerErrorHaptic` added to `lib/mobile/haptics.ts`. Error haptic on validation failure in `useGoals`/`useDebts`/`useRequiredExpenses`. Medium haptic on backup + CSV import success. Swipe-delete Light → Medium in `DebtRow`. Final haptic grammar:
- Light → navigation, opening/closing panels
- Medium → completing meaningful actions (paid, saved, rollover, import)
- Error → validation failures
- Nothing → passive UI updates

---

### 27. 3-Way Theme Selector ✅ SHIPPED v1.4

`ThemePreference = "system" | "light" | "dark"` in `useDarkMode`. OS media query change listener active when `theme === "system"`. Floating icon toggle removed from hero header. Segmented control (Auto / Light / Dark) added to Plan Settings. Migration: stored boolean → enum (existing users get "system").

---

### 28. No Privacy/Local-Storage Trust Messaging ✅ SHIPPED v1.4

"Your data stays on this device — nothing is uploaded or shared." above legal links in Settings sheet. One `<p>` tag with outsized trust impact.

---

## Open Items — Priority Matrix

All 28 items have shipped except the following. These are the only remaining open audit items.

| # | Item | Target | Impact | Effort |
|---|---|---|---|---|
| 1 | Debt Payoff Trajectory Chart (+ Cash Flow Bars + Progress Arc) | v1.5 | Very High | Medium |
| 13 | Since-Last-Cycle Delta Indicator | v1.5 | Medium | Low |
| 19b | Debt Payoff Celebration / `computeMilestones` | v1.6 | High | Medium |
| 15 | Settings UX Rework (modal → accordion) | v1.6 | Low | Medium |

Items 1 and 13 both depend on v1.5's Pay Cycle History snapshots — implement after `usePayCycleHistory` ships. Items 19b and 15 are v1.6 work scoped in `IMPLEMENTATION_PLAN.md`.

---

## Shipped Summary

| Version | Items Shipped |
|---|---|
| v1.3 | #6, #16, #18, #19a, #21 |
| v1.4 | #2, #3, #4, #5, #7, #8, #9, #10, #11, #12, #14, #17, #20, #22, #23, #24, #25, #26, #27, #28, P4, P9c |
| v1.5 | #1, #13 (planned) |
| v1.6 | #15, #19b (planned) |

---

_This audit was last updated 2026-06-27, post-v1.4. All 28 original items are either shipped or assigned to a future version. The next actionable items are the visualization work (#1, #13) in v1.5._
