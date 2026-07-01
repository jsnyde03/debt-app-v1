# UX Polish Backlog

_Items sourced from `archive/premium-ux-audit.md`. Each item retains its original audit number. Organized by version assignment; items within each version are listed in priority order._

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for version context and sequencing.

---

## Shipped (v1.3)

| # | Item | Notes |
|---|---|---|
| #6 | Bottom Nav Active State — Glow + Indicator | Shipped v1.3 UX Quick Wins |
| #16 | Storage Error Handling | Shipped as Pre-v1.4 Foundation Fix |
| #18 | Dark Mode Follows System Setting | Shipped v1.3 UX Quick Wins |
| #19a | Rollover Haptic + Status Message | Shipped v1.3 Critical Immediate Fixes |
| #21 | Currency Input Keyboard Type | Shipped v1.3 Critical Immediate Fixes |

---

## Shipped (v1.4)

| # | Item | Notes |
|---|---|---|
| #2 | First-Launch Empty State | `page.tsx`: card when paycheck set + no debts; "Add First Debt" → Bills tab |
| #3 | Debt-Free Date in Execution Summary Strip | Replaced "Status" cell; `debtFreeDate` useMemo in page.tsx, prop to ResultsSection |
| #4 | Mark-Paid Transition Animation | `cardExit` + `checkPulse::after` in DebtRow + ExpenseListItem via `animating-paid` |
| #5 | Smart Insights Card Typography | Title 0.92→1.12rem; action chip; 4px severity left-border |
| #7 | Category Icons on Bills and Debts | Expense rows already had chips; debt rows: `CreditCard` icon chip / BNPL badge |
| #8 | Plan Tab Hero Personalization | Contextual subtitle: shortfall / debt-free date / default |
| #9 | Display Amount Styling | `formatDisplayAmount` + `.display-amount-symbol/cents` CSS; applied to strip cells |
| #10 | Directional Tab Transitions | `tabSlideInRight/Left` + `data-direction` on content wrapper |
| #11 | Upgrade Screen Preview Card | Frosted-glass blurred mock with "Unlock with Premium" overlay |
| #12 | Windfall/Bonus Allocator | "Got extra money?" card in Plan Settings; adds to `amount` state |
| #14 | BNPL Visual Differentiation | Purple `.bnpl-badge`; "X payments left" replaces APR for BNPL |
| #22 | Sheet Grabber Handles | `::before` pill on `.settings-sheet` + `.upgrade-modal-card` |
| #23 | Toast Animation | `toastEnter/Exit` keyframes; `.exiting` class + two-timer exit pattern |
| #24 | Staggered Animations | `debt-list-item` + `required-expense-row` use `cardReveal` + nth-child delays |
| #17 | Basic Aria-Label Audit | `aria-label` on hero section + both navs; `role="region"` on tab wrapper; `aria-live` on execution strip |
| #20 | Swipe-Delete Undo Toast | `restoreDebt`/`restoreExpense` in hooks; 5s undo with `.undo-toast` CSS |
| #25 | Interest Cost Per Debt Callout | `calculateMonthlyInterest` per row; red `.debt-interest-callout` span |
| #26 | Haptic Grammar Completion | `triggerErrorHaptic`; validation error + import success + swipe-delete haptics |
| #27 | 3-Way Theme Selector | `ThemePreference = system/light/dark`; segmented control in Settings; floating toggle removed |
| #28 | Privacy/Local-Storage Trust Messaging | "Your data stays on this device" above legal links in Settings |
| P4 | Empty-state SVG illustrations | 48px Lucide icons above empty-state text in Debts, Expenses, Goals sections |
| P9c | Hover → active CSS audit | `:active` equivalents for all `:hover`-only rules across 3 CSS files |

---

### #2 — First-Launch Empty State

Covered in the v1.4 onboarding implementation steps (step 5 of [archive/V14_ONBOARDING.md](archive/V14_ONBOARDING.md)) — not a standalone polish item. After completing onboarding with zero debts, replace blank card stubs with a single card: _"Your debt-free date is waiting. Add your first debt to see exactly what to do this paycheck."_ One conditional render in the Plan tab's results area.

**Files touched:** `app/page.tsx` or `components/ResultsSection.tsx`.

---

### #3 — Debt-Free Date in Execution Summary Strip

The execution-summary-strip currently shows: Paycheck / Bills / Minimums / Extra. Replace the "Extra" cell — or add a 5th cell at narrower width — with a **"Debt-Free"** cell showing the computed payoff date (e.g., "Apr 2028").

- The date is already computed in `buildSmartInsights` as `snowballDebtFreeDate` — make it available to the Plan tab's render via props or by computing inline from values already in scope.
- Style with `font-variant-numeric: tabular-nums` and `font-weight: 900`, matching the other `strong` elements in the strip.
- Show "Add debts" or `—` when no debts exist.

**Files touched:** `components/ResultsSection.tsx` (or wherever the strip renders), `app/styles/03-nav-results-modals.css`.

---

### #4 — Mark-Paid Transition Animation

When a debt or required expense changes to paid state (after `handleMarkDebtMinimumPaid`, `handleMarkDebtSnowballPaid`, `handleMarkExpensePaid`), add two animations:

1. `@keyframes cardExit` — companion to existing `cardReveal`: `from { opacity: 1; transform: scale(1); } to { opacity: 0.72; transform: scale(0.99); }`, 200ms, plays once when paid state is first applied via a conditional class `animating-paid` (applied for one render, then removed).
2. `@keyframes checkPulse` — a green checkmark overlay that fades out over 400ms: `from { opacity: 1; transform: scale(1.2); } to { opacity: 0; transform: scale(0.8); }`.

The haptic feedback already fires (correct) — these animations complete the feedback loop visually.

**Files touched:** `app/styles/09-anim-swipe-media-misc.css` (keyframes), `components/Debts/DebtRow.tsx` and/or `RequiredExpensesSection.tsx` (paid-state class).

---

### #5 — Smart Insights Card Typography

Three CSS-only improvements to the premium Smart Insights cards:

1. `.insight-title` (or equivalent): `font-size: 1.12rem; font-weight: 900;`
2. `.insight-action` (or equivalent): add `→ ` bold prefix OR a faint chip background (`background: rgba(148, 163, 184, 0.08); border-radius: 8px; padding: 4px 8px;`) to visually separate it from body text.
3. Severity left-border: widen from ~2px to 3–4px; add a matching very-low-opacity tinted background wash (e.g., `background: rgba(34, 197, 94, 0.04)` for "good" severity) so severity is scannable at a glance.

**Files touched:** Grep for `insight` class names in `app/styles/07-premium-upgrade.css` and `app/styles/06-forecast-and-payoff-shell.css` to locate the target classes.

---

### #7 — Category Icons on Bills and Debts

The `RequiredExpenseCategory` type has 6 values. Map them to Lucide icons (already in `lib/icons/index.ts`) as 14px icons inside a color-tinted chip badge:

| Category | Icon | Color |
|---|---|---|
| housing | `Home` | blue |
| utilities | `Zap` | amber |
| insurance | `Shield` | green |
| subscriptions | `RefreshCw` | purple |
| medical | `Heart` | red |
| other | `MoreHorizontal` | gray |

For debts: `type === "bnpl"` gets a "BNPL" text badge (see #14); `type === "debt"` gets a credit card icon.

**Files touched:** `components/RequiredExpensesSection.tsx` (or sub-components), `components/Debts/DebtRow.tsx`, `app/styles/00-theme-and-base.css` (new `.category-icon-chip`).

---

### #8 — Plan Tab Hero Personalization

Once `activeDebts.length > 0`, replace the static subtitle _"Enter a paycheck and see exactly what to do next."_ with a contextual line from already-computed values:

- Debt-free date known: _"You're on track to be debt-free in [N] months."_
- `projectedBuffer < 200`: _"Tight cycle — protect your minimums first."_
- Default (data exists, no special state): _"Here's what to do this paycheck."_

Conditional JSX in `app/page.tsx`'s hero render block. No new computation needed.

**Files touched:** `app/page.tsx`.

---

### #9 — Display Amount Styling ($ + Cents Split)

For the largest financial numbers in the app (hero card totals, recommended payment amounts, execution strip figures), style the dollar sign at ~60% of the number's `font-size` and cents at ~70%:

```tsx
// New helper: formatDisplayAmount(amount) → { dollars: string, cents: string }
<span className="display-amount">
    <span className="display-amount-symbol">$</span>
    {dollars}
    <span className="display-amount-cents">.{cents}</span>
</span>
```

```css
.display-amount-symbol { font-size: 0.6em; vertical-align: super; font-weight: 700; }
.display-amount-cents  { font-size: 0.7em; vertical-align: super; font-weight: 700; }
```

Apply only to the Plan tab's largest hero numbers — not every currency string. Find target call sites by grepping for `formatCurrency` in hero-visible components.

**Files touched:** New `lib/utils/formatDisplayAmount.ts`, `app/styles/00-theme-and-base.css`, 2–4 component call sites.

---

### #10 — Directional Tab Transitions

Extend the existing `tab-content-transition` fade to a directional slide mirroring tab order (Plan=0, Bills=1, Payoff=2, Goals=3):

```tsx
const prevTabRef = useRef(tabOrder[activeTab]);
const direction = tabOrder[activeTab] >= prevTabRef.current ? "forward" : "backward";
<div key={activeTab} className="tab-content-transition" data-direction={direction}>
```

```css
.tab-content-transition[data-direction="forward"]  { animation: tabSlideInRight 180ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
.tab-content-transition[data-direction="backward"] { animation: tabSlideInLeft  180ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
@keyframes tabSlideInRight { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }
@keyframes tabSlideInLeft  { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) {
    .tab-content-transition[data-direction] { animation: tabFade 150ms ease both; }
    @keyframes tabFade { from { opacity: 0; } to { opacity: 1; } }
}
```

**Files touched:** `app/page.tsx`, `app/styles/09-anim-swipe-media-misc.css`.

---

### #11 — Upgrade Screen Preview Card

Add a frosted-glass preview card beneath the feature list showing a **static mock** of one premium card (e.g., a blurred Smart Insights card with sample data). Pure HTML/CSS — no live data.

```html
<div class="upgrade-preview-card">
    <div class="upgrade-preview-label">Smart Insights preview</div>
    <div class="upgrade-preview-insight-mock" aria-hidden="true">
        <!-- Static HTML mock of an insight card -->
    </div>
    <div class="upgrade-preview-blur-overlay">Unlock with Premium</div>
</div>
```

The blur overlay uses `backdrop-filter: blur(4px)` on an absolutely positioned element, with "Unlock with Premium" centered. Makes the feature list concrete and demonstrates what the user is buying.

**Files touched:** `components/UpgradeSection.tsx`, `app/styles/07-premium-upgrade.css`.

---

### #12 — Windfall/Bonus One-Time Allocator (Free)

_Originally v1.5; pulled forward — no dependency on v1.5's cycle-history work._

A "Got extra money?" action in Plan Settings opens a single-input form. The windfall amount is added to the current paycheck for that one run — no new allocation logic, just a UI shortcut that pre-populates the paycheck field with `currentPaycheck + windfall`. Reuses the existing snowball/avalanche extra-payment path in `lib/engine/allocatePaycheck.ts`. Apply via existing `handleMarkRecommendedAction`/debt-payment flow so it's tracked in `completedRecommendedActions` consistently.

**Data model changes:** None — reuses existing types and engine.

**Tier:** Free, all tiers.

**Testing:** Regression test confirming a windfall amount produces identical allocation behavior to an equivalent recurring extra-payment amount (same engine, same math — guards against the UI accidentally diverging).

**Files touched:** `app/page.tsx` (Plan Settings entry point), new small form component.

---

### #14 — BNPL Visual Differentiation

The `debt.type === "bnpl"` field is stored but never surfaced. Before v1.10 fixes the underlying BNPL calculations, make BNPL debts visually distinct:

- Add a `BNPL` badge (small pill, purple) on BNPL debt rows.
- If `remainingPayments` is present, show _"X payments left"_ instead of the APR field (BNPL is APR=0 — showing APR is misleading).
- If `scheduledPaymentAmount` is present, show it as the fixed payment amount.

**Files touched:** `components/Debts/DebtRow.tsx`, `app/styles/` (new `.bnpl-badge`).

---

### #17 — Basic Aria-Label Audit

Before v1.7's full accessibility audit, close the most obvious gaps:

1. Grep all `<button>` elements in `components/` — verify each has a visible text label or `aria-label`. Icon-only buttons (theme toggle, settings gear, sort direction, swipe-action delete) are the most likely to be missing.
2. Add `role="region"` + `aria-label` to major content sections (debt list, expenses list, plan results) for screen reader navigation.
3. Verify swipe-to-pay items have a tap/button fallback visible to VoiceOver.
4. `aria-live="polite"` is already on the save-status toast — check dynamic numeric regions (running balance, buffer amount after marking paid) and add `aria-live="polite"` where missing.

**Files touched:** Various `components/*.tsx` (additive `aria-label` props only), possibly `app/page.tsx`.

---

### #20 — Swipe-Delete Undo Toast

Swipe-left → Remove on `DebtRow.tsx:197` calls `onRemoveDebt` immediately with no confirmation and no undo. Implement an undo toast:

1. Instead of removing immediately, move the deleted item to `pendingDelete: { item: Debt; timeout: number } | null` state.
2. `setDebts(current => current.filter(d => d.id !== id))` still runs — item disappears from the list.
3. Show a toast: "Debt removed. [Undo]". Undo button calls `setDebts(current => [...current, pendingDelete.item])` and clears `pendingDelete`.
4. After 5 seconds, the timeout fires: `pendingDelete` is cleared and deletion is final.
5. Same pattern for expense deletion.

**Files touched:** `lib/hooks/useDebts.ts`, `lib/hooks/useRequiredExpenses.ts`, new `UndoToast.tsx` or extended `statusMessage` system in `app/page.tsx`.

---

### #22 — Sheet Grabber Handles

CSS-only addition to all bottom sheets:

```css
.settings-sheet::before,
.upgrade-modal-card::before {
    content: "";
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgba(148, 163, 184, 0.32);
    margin: 0 auto 16px;
    flex-shrink: 0;
}
.dark-theme .settings-sheet::before,
.dark-theme .upgrade-modal-card::before {
    background: rgba(255, 255, 255, 0.18);
}
```

Apply to Add Debt modal, Add Expense modal, and Goals edit modal as well — grep for all `position: fixed` bottom-anchored containers.

**Files touched:** `app/styles/03-nav-results-modals.css`, `app/styles/04-debt-modals-focus.css` (if modals are styled there).

---

### #23 — Toast Animation (Save-Status-Toast)

```css
.save-status-toast {
    animation: toastEnter 200ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}
@keyframes toastEnter {
    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
.save-status-toast.exiting {
    animation: toastExit 180ms ease both;
}
@keyframes toastExit {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-6px); }
}
@media (prefers-reduced-motion: reduce) {
    .save-status-toast, .save-status-toast.exiting { animation: none; }
}
```

The `.exiting` class requires a small JS change: instead of clearing `statusMessage` directly on timeout, set an `isToastExiting` flag for 180ms (the exit animation duration), then clear `statusMessage` after that delay.

**Files touched:** `app/styles/09-anim-swipe-media-misc.css`, `app/page.tsx` (statusMessage timeout logic).

---

### #24 — Staggered Animations on Debt and Expense Lists

Apply the identical `cardReveal` + staggered nth-child delay pattern already used on `.goal-list-item`:

```css
.debt-list-item {
    animation: cardReveal 200ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}
.debt-list-item:nth-child(2) { animation-delay: 30ms; }
.debt-list-item:nth-child(3) { animation-delay: 60ms; }
.debt-list-item:nth-child(4) { animation-delay: 90ms; }
.debt-list-item:nth-child(5) { animation-delay: 120ms; }
/* Same pattern for the expense list item class */
@media (prefers-reduced-motion: reduce) {
    .debt-list-item { animation: none; }
}
```

**Files touched:** `app/styles/09-anim-swipe-media-misc.css`. Uses the existing `cardReveal` keyframe — minimal risk.

---

### #25 — Interest Cost Per Debt Callout

`lib/debt/calculateMonthlyInterest.ts` already computes the monthly interest cost per debt — it just isn't shown:

```tsx
import { calculateMonthlyInterest } from "@/lib/debt/calculateMonthlyInterest";

const monthlyInterest = debt.apr > 0 && !debt.isPaidOff
    ? calculateMonthlyInterest(debt.balance, debt.apr)
    : 0;

{monthlyInterest > 0 && (
    <span className="debt-interest-callout">
        ~{formatCurrency(monthlyInterest)}/mo in interest
    </span>
)}
```

Style `.debt-interest-callout` as `font-size: 0.75rem; color: var(--status-bad-strong); opacity: 0.85`.

**Files touched:** `components/Debts/DebtRow.tsx`, `app/styles/`.

---

### #26 — Haptic Grammar Completion

Audit and fix haptic feedback for all significant actions. Verified gaps:

| Action | Current | Should be |
|---|---|---|
| Mark expense paid (swipe) | Medium ✓ | Medium ✓ |
| Mark debt minimum paid | Medium ✓ | Medium ✓ |
| Rollover (Start Next Cycle) | **None** ✗ | Medium |
| Successful backup import | **None** ✗ | Medium |
| Successful CSV import | **None** ✗ | Medium |
| Validation error (empty required field) | **None** ✗ | Error haptic |
| Delete debt/expense (swipe) | Light ✗ | Medium |

Error haptic: `Haptics.notification({ type: NotificationType.Error })` — check if already imported in `lib/mobile/haptics.ts` and add `triggerErrorHaptic()` export if not.

**Files touched:** `lib/mobile/haptics.ts`, `app/page.tsx` (rollover + import handlers), `components/Debts/AddDebtModal.tsx`, `components/RequiredExpenses/AddExpenseModal.tsx`, `components/Debts/DebtRow.tsx`.

---

### #27 — 3-Way Theme Selector (System / Light / Dark)

Replace the floating icon button in the hero header with a proper 3-way segmented control in Settings.

**`lib/hooks/useDarkMode.ts` — new 3-state type:**

```ts
export type ThemePreference = "system" | "light" | "dark";

export function useDarkMode() {
    const [theme, setTheme] = useState<ThemePreference>(() =>
        loadStoredState("debtPlanner.theme", "system")
    );

    useEffect(() => {
        localStorage.setItem("debtPlanner.theme", JSON.stringify(theme));
        const resolvedDark =
            theme === "dark" ? true :
            theme === "light" ? false :
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        applyDarkMode(resolvedDark);
    }, [theme]);

    // Respond to OS theme changes in real-time when theme === "system"
    useEffect(() => {
        if (theme !== "system") return;
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => applyDarkMode(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, [theme]);

    return { theme, setTheme };
}
```

**Settings UI:** A segmented control (3 pill-buttons: `System | Light | Dark`) inside the Settings sheet. Active option has accent color background; inactive are ghost/muted. Remove the floating icon toggle from `app/page.tsx`'s hero header once the Settings control exists.

**Files touched:** `lib/hooks/useDarkMode.ts`, `app/page.tsx` (remove hero toggle, update call sites from `setDarkMode(bool)` to `setTheme(preference)`), Settings UI.

---

### #28 — Privacy/Local-Storage Trust Messaging

Add one line to the Settings sheet near the Backup & Restore section:

```tsx
<p className="settings-privacy-note">
    Your data stays on this device — nothing is uploaded or shared.
</p>
```

Style: `font-size: 0.78rem; color: var(--text-secondary); text-align: center; margin-top: 8px`.

**Files touched:** Settings sheet JSX in `app/page.tsx` or `components/PlanSettings/PlanSettingsSheet.tsx`.

---

## v1.5 items

These items ship in v1.5 alongside Pay Cycle History — #13 requires cycle history data and must not be implemented before that feature lands. #1 was pulled into v1.4 (see below).

---

### #1 — Debt Payoff Trajectory Chart ✅ DONE in v1.4 (motion polish v1.5)

_Highest-impact item in the entire audit. Shipped ahead of schedule — no cycle history dependency after all. **v1.5 (step 2.9) added the premium motion pass:** the trajectory lines now draw themselves in (`pathLength=1` + `stroke-dashoffset`), and all three visualizations (1a trajectory, 1b forecast bars, 1c per-debt bar) share one `progressReveal`/`drawLine` motion standard; the per-debt bar gained a "N% paid" label. Deferred v1.6 add: a milestone-linked bar pulse (see MASTER_PLAN Deferred backlog)._

**SVG only — no chart library.** Data sets are tiny (≤10 debts, ≤36 months); a library adds bundle weight not worth it at this scale.

Three visualizations in priority order:

**1a. Debt Payoff Trajectory** (Payoff/Snowball tab) — two lines: snowball balance over time, avalanche balance over time, both monthly until $0. Built from the existing `projectDebtPayoff` function:

```tsx
const snowballPoints = projectDebtPayoff({ debts, strategy: "snowball", extraPayment }).map(
    (m, i) => ({ x: (i / totalMonths) * chartWidth, y: chartHeight - (m.balance / maxBalance) * chartHeight })
);
// Render as <polyline points={snowballPoints.map(p => `${p.x},${p.y}`).join(" ")} />
```

Label the point where each line hits zero with the payoff date. If snowball and avalanche produce identical results, show one line labeled "Both strategies."

**1b. 3-Month Cash Flow Status Bars** (Plan tab, inside Forecast card) — replace the current `ForecastMonth` text-list rows with 3 horizontal status bars, color-coded by `ForecastStatus` (`stable`=green, `tight`=amber, `pressure`=orange, `recovery`=red). Month label and description text remain beneath each bar.

**1c. Per-Debt Progress Bar** (Bills tab, debt list items) — a thin horizontal bar beneath each debt's name showing `(originalBalance - balance) / originalBalance` percent paid off. `originalBalance` already exists on the `Debt` type. CSS-only bar (no SVG), styled like the goal progress bars in the Goals tab.

**Files touched:** `components/SnowballSection.tsx` (1a), `components/ResultsSection.tsx` (1b), `components/Debts/DebtRow.tsx` (1c), `app/styles/`, possibly new `components/Charts/PayoffChart.tsx`.

**Risk:** Low-medium. Handle edge cases: zero debts, single debt, debts with APR=0. Test against the demo dataset.

---

### #13 — Since-Last-Cycle Delta Indicator

Once v1.5's cycle history stores snapshots, the execution-summary-strip can show progress vs. the previous cycle:

```
Total Debt  $18,420  ↓ $342 since last paycheck
```

1. In `usePayCycleHistory.ts`, add a `previousSnapshot` getter (most recent completed snapshot, or `null`).
2. Compute `delta = previousSnapshot.totalDebtBalance - currentTotalDebt`. If `delta > 0` (debt reduced): render green `↓ $X`. If `delta < 0`: render amber `↑ $X`. No previous snapshot: render nothing.
3. Apply `font-variant-numeric: tabular-nums` to the delta value.

**Files touched:** `lib/hooks/usePayCycleHistory.ts`, `components/ResultsSection.tsx`, `app/styles/03-nav-results-modals.css` (new `.summary-strip-delta`).

---

## v1.5 items (continued)

---

### #15 — Settings UX Rework

The Plan Settings is currently a modal (slide-up sheet). For returning users adjusting a single setting, opening a modal to change one field feels heavy.

**Decision required before implementation.** Two viable approaches:

1. **Accordion/in-place expansion (recommended)** — the settings gear + theme toggle expand into a settings panel below the hero heading, in-line with page content, without a modal overlay. Align with the existing `plan-section-body` expand/collapse pattern already in the codebase. The settings gear becomes a toggle expanding the settings block using the same `max-height`/`opacity`/`transform` transition already present. If this ships, relocate the theme toggle into this accordion as the proper 3-way selector from #27 (the hero's floating icon button can then be removed).
2. **Dedicated Settings tab** — 5th tab in the bottom nav. Simpler to implement but crowding 5 items at 375px-wide may feel cluttered.

**Note:** The settings modal is also used during first-run onboarding (v1.4). Verify the accordion approach works correctly in that context, or keep the modal form for first-run only and switch to the accordion for returning-user settings.

**Files touched:** `app/page.tsx`, `components/PlanSettings/PlanSettingsSheet.tsx` (or successor from Page Orchestrator Phase 2), `app/styles/03-nav-results-modals.css`.

---

### #19b — Debt Payoff Celebration Moment

When `computeMilestones` detects a debt crossed the 100% threshold (balance === 0 after rollover), trigger a distinct paid-off experience beyond a standard milestone badge. This is the emotional peak of the entire app — the moment users screenshot and tell friends about.

At minimum:
- `triggerMediumHaptic()`
- Full-width celebration card (`MilestoneBadge` variant with confetti-style CSS animation)
- Debt's name displayed prominently ("Credit Card — PAID OFF")

Specifics TBD at implementation time. Don't ship a subdued version of this — it should feel earned.

**Files touched:** `components/MilestoneBadge.tsx` (new this version), `lib/debt/computeMilestones.ts` (new this version), `app/page.tsx` (`handleRolloverPayCycle`).

---

### P10 — Timeline Cycle Item Overflow (extreme list lengths) ⬜ v1.5 (trigger-based)

**Current state:** All cycle items render unconditionally. The CSS collapse animation uses `max-height: 9999px` so content is never clipped. This is correct for realistic pay cycles (10–25 items). A previous workaround using a Show More button was removed — it was masking a CSS bug, not solving a real UX problem.

**When this matters:** If a user has weekly-recurring bills across a 4-week cycle, or manually adds many one-time items, a single cycle could approach 30–40+ items. At that scale a scrollable window is friendlier than an infinitely tall list. This item is purely proactive — do not implement until real usage data shows cycles growing that large.

**Approaches to evaluate:**

1. **Fixed-height scrollable window** — `.timeline-cycle-body` becomes a bounded scrollable container (e.g., `max-height: 480px; overflow-y: auto`) with a fade-out gradient at the bottom edge indicating more content below. Scroll is within the card, not the page. Preserves all items in view without a separate "Show more" tap.

2. **Virtual rendering** — only render items within the viewport using a lightweight virtualizer (or a manually managed render window via `IntersectionObserver`). Appropriate if a user ever has 50+ transactions in a cycle (e.g., weekly recurrences + one-time bills). No cap; no "Show more." Higher implementation complexity.

3. **Date-grouped days** — collapse items by day into sub-accordions ("Jul 4 · 2 transactions → expand"). Reduces visual noise for dense cycles while keeping the full date structure navigable.

**Recommendation when revisiting:** option 1 (scrollable window + fade gradient) is the best effort-to-quality ratio. Option 3 is appropriate only if multiple-items-per-day becomes common in user data.

**Do not ship option 1 before:** confirming iOS scroll-within-scroll behavior in a Capacitor WebView — overscroll events need testing to ensure the inner scroll doesn't fight the outer page scroll.

**Files to touch:** `app/styles/05-timeline-whatif.css` (`.timeline-cycle-body` sizing), `components/TimelineSection.tsx` (remove `showAllItems` state + `ITEMS_INITIAL` + Show More button).
