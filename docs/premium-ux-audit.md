# Premium UX Audit — Debt Planner v1.3

_Written: 2026-06-27. Scope: current product (v1.3) only. No feature from ROADMAP.md v1.4+ is repeated here unless the current implementation of a planned feature warrants a recommendation before that version ships. Do NOT implement anything from this document without a separate implementation plan._

---

## Current Strengths (What's Already Genuinely Premium)

Before gaps: these are the parts of the current product that already punch above their weight and should be preserved and built on.

- **Allocation engine** — the per-paycheck math (expenses → minimums → buffer → snowball → goals) is more sophisticated than most consumer debt apps. This is the real moat.
- **Dark theme** — glass-morphism cards, backdrop blur, layered shadows. Feels closer to a fintech app than a web utility.
- **Haptic feedback** — light/medium haptics on interactions; rare among web-wrapped apps and adds native feel.
- **App Lock** — Face ID/Touch ID is a genuine trust signal that competitors often skip. Being free for all tiers is the right call.
- **Smart Insights engine** — rule-based but produces specific, actionable, prioritized guidance rather than generic tips. The copy is unusually good for this category.
- **RevenueCat integration** — clean subscription gate architecture, restore purchases, no janky manual receipt validation.
- **Pull-to-refresh, swipe-to-pay** — gestures feel native, not web-app-ish.

---

## Part 1: Critical UX Gaps (Highest Impact)

These are the gaps that most sharply prevent the app from feeling like a premium fintech product. Fixing any of these has outsized impact relative to effort.

---

### 1. No Data Visualization Whatsoever

**The gap.** Every credible premium fintech app (Copilot, YNAB, Monarch, Credit Karma) shows charts. The current app is pure text and numbers. The data is already there — `projectForecast()` produces 3 months of `projectedDebtBalance` + `projectedSafeCash`, the payoff comparison produces interest totals and payoff dates per strategy, the timeline produces a cash-flow sequence — none of it is visualized.

**What to add (in priority order):**

1. **Debt Payoff Trajectory** (Payoff/Snowball tab) — a simple line chart with two lines: snowball path and avalanche path, both plotted as debt balance over months until $0. Even a pure SVG path built from the existing projection data would work. This is the single most emotionally compelling visualization for this app category: showing the user a visible finish line.

2. **3-Month Cash Flow Bars** (Plan tab, inside the Forecast card) — replace the current list of `ForecastMonth` text rows with a 3-bar horizontal bar chart, color-coded by `ForecastStatus` (stable = green, tight = amber, pressure = orange, recovery = red). The text description stays beneath each bar; the chart just makes the trend scannable at a glance.

3. **Per-Debt Progress Arc** (Bills tab, debt list items) — a thin circular arc or small horizontal progress bar showing `(originalBalance - balance) / originalBalance` percent paid off. `originalBalance` is already in the `Debt` type. This makes the debt list feel like a progress dashboard, not a spreadsheet.

**Implementation note:** Use SVG only — no chart library. The data sets are tiny (3 months, ≤10 debts). A library adds bundle weight and a style integration headache that isn't worth it at this scale.

---

### 2. Onboarding Is Abrupt (v1.4 is planned — but the current state actively hurts)

**The gap.** A brand-new user opens the app and sees a blank Plan screen with a paycheck input form and empty card stubs. There is no value proposition, no welcome, no illustration — nothing to explain what the app does or why they should trust it with their financial data. Premium apps earn the first data-entry action with a brief "here's what this does" moment.

**What to add for v1.3 / pre-v1.4:**

The App Skeleton (`AppSkeleton.tsx`) already shows during the mount wait. While v1.4 will build a proper multi-step wizard, the immediate win is a **"first launch" empty state** on the Plan tab that replaces the blank card stubs with a motivational setup card:

> "Your debt-free date is waiting. Add a paycheck and your first debt to see exactly what to do."

This is one card, no new routing, no architectural change. It replaces the jarring blank state with a clear call-to-action that primes the user before they see the input forms.

---

### 3. No "Debt-Free Date" Hero Metric

**The gap.** The single most motivating number in any debt payoff product is *when* the user will be debt free. Every competitor features this prominently. The current app computes this number (`snowballDebtFreeDate` / `avalancheDebtFreeDate` in `buildSmartInsights`) but it only appears inside prose-format insight text. It is not shown as a persistent, prominent hero anywhere on-screen.

**What to add:**

In the Plan tab's execution summary strip (currently shows: Paycheck / Bills / Minimums / Extra), add or swap in a **"Debt-Free"** cell that shows the computed payoff date (e.g., "Apr 2028") in the `strong` element. The execution-summary-strip already has room for exactly 4 cells; the "Extra" cell is the least contextually meaningful — replacing it with the payoff date dramatically increases the emotional impact of the strip without changing the layout.

Alternatively, surface it as a sub-line inside the premium hero card, styled with the tabular-numeric treatment already applied to other key figures.

---

### 4. Mark-Paid Has No Satisfying Feedback

**The gap.** The "swipe to pay" and "mark paid" actions — arguably the most emotionally significant interaction in the app (a user just paid a debt!) — produce a functional UI update with no visual reward. Premium fintech apps (Copilot, YNAB, Splitwise) celebrate these moments. The haptic fires but nothing on screen says "yes, that was meaningful."

**What to add:**

When a debt or expense item transitions to the paid state:

1. A brief (200ms) **scale + opacity** exit animation on the item as it re-renders into the "paid" visual state. The item doesn't leave the list — it fades to the muted/paid appearance. This animation already exists as groundwork in `09-anim-swipe-media-misc.css`'s `cardReveal` keyframe; a matching exit `cardExit` keyframe would complete the pair.

2. A single **green checkmark pulse** that fades in and out on the amount cell (not a persistent icon — just a 400ms confirmation flash using `@keyframes`).

Total implementation: ~12 lines of CSS, a class applied via existing state-driven conditional className logic.

---

### 5. Smart Insights Cards Are Prose Walls

**The gap.** The premium Smart Insights feature (gated) presents insights as a title + 2-sentence paragraph + action line. The content is excellent but the typography is not differentiated enough for the information hierarchy. Title, body, and action line look too similar in weight. On a small phone screen, the eye has nowhere to land first.

**What to improve:**

- The **insight title** should be noticeably larger (1.05rem → 1.12rem) and weight 900
- The **action line** should be visually distinguished from body text — a faint background chip, a bold prefix ("→ "), or italic weight
- The **severity indicator** (good/warning/risk) needs a stronger visual treatment — currently a color-tinted left border, but the border is thin enough that it can be missed. Widening it to 3–4px and adding a matching tinted background wash (very low opacity) on the card would make severity scan immediately.
- Cards could benefit from a top-right severity icon (✓ / ⚠ / ⚡) that gives the eye an anchor without adding text.

---

## Part 2: Visual & Interaction Polish

These gaps don't break anything but actively prevent the "premium" read.

---

### 6. Bottom Navigation Is Visually Flat

The bottom nav active state currently uses a blue background pill. This is fine but generic. Premium iOS fintech apps typically use:

- A **subtle glow** beneath the active icon (a soft radial gradient, not a hard pill)
- **Icon size increase** on the active tab (24px → 26px, smooth CSS transition)
- A **thin indicator line** above the active tab (not instead of — in addition to the fill)

The current component uses `bottom-nav-item.active` with background. Adding a `box-shadow: 0 0 18px rgba(96, 165, 250, 0.28)` and a 2px top border would add significant visual quality. The height is already 60px+safe-area-inset-bottom so there's room.

---

### 7. Category Icons on Bills and Debts

The expense and debt list items are pure text with emoji type labels. The `RequiredExpenseCategory` type already has 6 values: housing, utilities, insurance, subscriptions, medical, other. The `Debt` type has `"debt" | "bnpl"`.

Mapping these to small, styled icon badges (using the existing Lucide icon set that's already imported) would immediately make the lists more scannable and polished. A housing expense could show a home icon in a blue chip; a subscription could show a credit card icon in a purple chip.

This does not touch the data model or business logic — it's a pure rendering change in `RequiredExpensesSection` and `DebtsSection` that maps category → `<IconName size={14} />` + a background color.

---

### 8. The Plan Tab Hero Lacks Personality

The hero reads: `"Debt Planner" / "Enter a paycheck and see exactly what to do next."` This is purely instructional. After a user has been using the app for a few cycles, this copy still says the same instructional text — there's no sense of personalization or motivation.

**What to try:** once data exists (debts > 0), the subtitle could contextually change to something computed and motivating:

- If debt-free date is known: *"You're on track to be debt-free in [N months]."*
- If extra payment was applied last cycle: *"Keep going — every extra payment counts."*
- If buffer is tight this cycle: *"Tight cycle ahead. Protect your minimums first."*

This is a pure JSX change using already-computed values. It transforms the header from a static tagline into a live, personalized status message — which is exactly what premium fintech apps do.

---

### 9. Financial Numbers Lack Display Polish

The app shows important financial figures throughout the Plan tab, but they vary in visual treatment:

- Some are bold (`font-weight: 900`), some are 700, some are not specified
- Currency values are formatted with `Intl.NumberFormat` which is correct, but the dollar sign and cents are the same size and weight as the main digits
- For the primary "here's what to do this cycle" numbers, the dollar sign and cents should be slightly smaller/lighter than the main number (the "tabular split" style common in Copilot, Robinhood, etc.)

**CSS approach:** Add a CSS class `.display-amount` that splits the value rendering: the `$` sign at 60% of the number's font size, the cents at 70%. No JS change — just wrap the currency symbol and cents in `<span>` elements within the existing number formatting and apply the class. The biggest numbers in the app (hero card amounts, execution strip, recommended payment amounts) would benefit most from this treatment.

---

### 10. Tab Content Transitions Feel Abrupt

The current `tab-content-transition` class fades in content. The animation is correct in principle but the fade alone doesn't convey the spatial relationship between tabs. Users who switch from Plan → Bills → Payoff → Goals don't have a sense of place.

**What to add:** a very subtle horizontal translate on tab switch, directional based on tab order (Plan=0, Bills=1, Payoff=2, Goals=3). Switching to a higher-numbered tab slides new content in from the right; lower-numbered from the left. The existing `key={activeTab}` prop on the container div already forces a remount for the transition — all that's needed is CSS:

```css
/* pseudocode — exact values need tuning */
.tab-content-transition {
  animation: tabSlideIn 200ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}
@keyframes tabSlideIn {
  from { opacity: 0; transform: translateX(12px); }
  to   { opacity: 1; transform: translateX(0);    }
}
```

Direction awareness would require passing the tab direction as a data attribute, which is a small JSX change. With `prefers-reduced-motion` guard, this is safe for all users.

---

### 11. The Upgrade/Paywall Screen Doesn't Show What Premium Looks Like

The current upgrade screen lists feature names in a vertical bullet list with icons. This is accurate but not persuasive. Premium paywalls that convert well typically include:

- A **preview screenshot or mock card** of the premium feature (e.g., a blurred/grayed-out "preview" of what the Smart Insights card looks like)
- A **before/after** comparison: "Without premium: you see your totals. With premium: you see why they're moving and what to do about it."
- A **social proof element**: "Join X users already on track" (once metrics exist)

The immediate actionable change: add a small, frosted-glass **preview card** beneath the feature list that shows a grayed/blurred version of the forecasting output or a sample insight card. This is a CSS-only implementation — no business logic needed. It makes the abstract feature list concrete and increases the perceived value of the subscription.

---

## Part 3: Feature Enhancements (within current scope, not on roadmap)

These are small additive features that don't require new tiers, new backend, or architectural changes, but would make the app feel meaningfully more complete.

---

### 12. Windfall / One-Time Income Allocation (v1.5 plans this — worth doing now)

The roadmap places this in v1.5 as a Free feature. It's actually very small: a button in the Plan settings modal that opens a "Got extra money?" input where the user enters a windfall amount. The allocation engine already handles arbitrary `amount` inputs — the only change is a UI shortcut that pre-populates the amount field with `regularPaycheck + windfall`, with a label explaining what's happening.

This is the single feature that could generate App Store reviews: "I got a bonus and the app told me the best way to apply it." It's genuinely small, existing engine handles it, and it's emotionally resonant.

---

### 13. "Since Last Cycle" Change Indicator

The app tracks `lastSavedAt` but doesn't use it to show the user how their financial position has improved. A simple change: store the total debt balance at the last save, and show a subtle `+/−` indicator in the execution summary strip:

> **Total Debt** $18,420 ↓ $342 since last paycheck

The delta would be computed as `(lastDebtBalance - currentDebtBalance)` stored in localStorage alongside `lastSavedAt`. Positive deltas (debt reduced) show in green; negative (debt added) in amber. This transforms the summary strip from a static snapshot into a progress tracker.

---

### 14. Inline Category / Type Labels on Debt Items

The debt list items show name, balance, APR, and minimum — but the debt `type` field ("debt" vs "bnpl") is never surfaced in the UI. BNPL debts should look visually different: a small "BNPL" badge and potentially the `remainingPayments` field displayed as "X payments left" instead of an APR (since BNPL is typically 0% interest).

Even before the v1.10 BNPL calculation fix, this visual differentiation would help users understand their debt list better without any data model change.

---

### 15. Settings Screen — Not a Modal

The Plan Settings is currently a modal (slide-up sheet). This works for first-time setup but is awkward for returning users who want to adjust one setting. The settings content (paycheck amount, pay cycle, paycheck date, notifications toggle, backup/restore, app lock) could be its own tab or a full-screen push navigation rather than a modal.

Given the current 4-tab constraint, the cleanest move is to convert the theme toggle + settings gear into a persistent **settings section** that slides down in-place from the hero (accordion style) rather than opening a modal. This improves discoverability of settings for returning users without adding a 5th tab.

---

## Part 4: Architecture / Foundation Quality

These don't affect feel directly but are prerequisites for the premium experience not degrading over time.

---

### 16. Storage Has No Schema Version (Already in ROADMAP v1.10 — but the risk is now)

`debtPlannerStorage.ts` uses the hardcoded key `"debt-planner-v1"`. The comment in ROADMAP.md acknowledges: "parse errors silently wipe state." In a finance app, silent data loss is a catastrophic trust failure. The `loadStoredState` wrapper silently returns defaults on any parse error.

Before v1.10 ships, the minimum viable fix is:
1. Wrap `JSON.parse` in `loadStoredState` with a try/catch that logs a warning and returns the default rather than silently succeeding
2. Store and compare a `schemaVersion: 1` field so future schema changes can migrate rather than wipe

This is a 30-line change to `lib/storage/loadStoredState.ts` and `lib/storage/debtPlannerStorage.ts`.

---

### 17. No Accessibility (VoiceOver) Support

The ROADMAP schedules an accessibility audit in v1.12. But the current product has obvious gaps that will generate App Store rejections if Apple's accessibility review catches them, and which actively exclude users with visual impairments:

- Interactive cards with no `aria-label` or `role`
- The swipe-to-pay gesture has no keyboard/assistive-technology alternative
- The bottom nav items use `<button>` which is correct, but with icon-only active state the accessible label may be missing context
- `aria-live="polite"` is correctly applied to the save-status toast — this is one thing that is done right

Minimum fix before v1.12: audit all `<button>` elements in the render tree for `aria-label` completeness, add `role="status"` to dynamic number regions, and ensure the swipe-to-pay has a non-swipe fallback action visible to screen readers.

---

### 18. Dark/Light Mode Should Follow System Setting by Default

Currently dark mode is a user-toggled preference (stored in `useDarkMode` hook). First-time users always land in light mode until they discover the toggle. iOS users who have set their device to dark mode at the system level expect apps to respect `prefers-color-scheme: dark` on first launch.

`useDarkMode.ts` should initialize from `window.matchMedia('(prefers-color-scheme: dark)').matches` when no user preference is stored. The user toggle remains to override. This is a 2-line change in the hook.

---

## Part 5: Code-Verified Quality Gaps (Second Audit Pass — 2026-06-27)

The following items were identified through direct code inspection of `app/page.tsx`, component files, and CSS. Unlike Part 1–4 which were visual/design observations, every item here has a specific verified location in the source.

---

### 19. Rollover Action is Completely Silent — No Haptic, No Feedback

**The gap (verified in `app/page.tsx:625`).** `handleRolloverPayCycle()` — the single most emotionally significant action in the entire app, marking one complete pay cycle — fires no haptic feedback and shows no status message. After rollover, the UI updates and nothing else happens. A user just completed a pay period of financial discipline and receives zero acknowledgement.

Compare to what the function *does*: applies payments to all debts, calculates interest, advances the paycheck date, reschedules notifications, and requests an App Store review if warranted. This is significant work on the user's behalf. The feedback should match.

**What to add:**
1. `triggerMediumHaptic()` at the top of `handleRolloverPayCycle` (immediately — 2-line fix)
2. `setStatusMessage("Cycle complete — great work!")` at the end (same 2-line fix)
3. Longer-term: detect whether any debt's balance crossed $0 during rollover (compare pre/post balances), and show a dedicated celebration card if so (see #23 below)

---

### 20. Swipe-to-Delete Has No Confirmation or Undo

**The gap (verified in `components/Debts/DebtRow.tsx:197-199` and `components/RequiredExpenses/ExpenseListItem.tsx:181`).** The swipe-left "Remove" action on debts and expenses calls `onRemoveDebt(debt.id)` immediately with no confirmation and no undo. This is the only irreversible per-item action in the app with no guard — and it deletes financial data the user may have taken minutes to enter.

The "Delete All Data" action correctly uses a two-tap confirmation (`showDeleteConfirm` state). Individual item deletion deserves the same respect.

**Two viable fixes:**
1. **Undo toast (recommended):** After deletion, show a 5-second toast: "Debt removed. [Undo]" — tapping Undo re-inserts the deleted item at its original position. This matches the standard iOS Mail/Safari "undo swipe" pattern. Requires storing the deleted item temporarily in state until the toast expires.
2. **Two-tap confirm on the swipe button:** Instead of immediate action, the first tap shows "Are you sure?" in the swipe button label (changes color/text), a second tap within 3 seconds confirms. No state needed beyond a `pendingDeleteId`.

The undo toast (option 1) is more forgiving and more standard for item lists — recommend it.

---

### 21. Currency Inputs Use Wrong Keyboard Type on iOS

**The gap (verified in `components/PaycheckSection.tsx:100`, `components/Debts/AddDebtModal.tsx`, `components/GoalsSection.tsx:115`, `components/RequiredExpenses/AddExpenseModal.tsx:142`).** All currency/number fields use `type="number"`. On iOS, `type="number"` triggers a numeric keypad that **omits the decimal point** — the worst possible choice for currency entry. Users entering "$1,234.56" can't type the cents.

**The fix:** `type="text" inputmode="decimal"` — the `inputmode` attribute tells iOS to show the decimal keypad (same numbers, but with the period/comma key), while `type="text"` avoids the `type="number"` quirks (spin arrows on desktop, no formatting, no leading-zero stripping). Apply to every currency and number field in the app.

This is a one-line change per field, ~8 fields total. It's the most common oversight in web-wrapped iOS apps and instantly signals "built by someone who tested on a real iPhone" when it's correct.

---

### 22. No Sheet Grabber Handle on Any Modal

**The gap.** None of the modal bottom sheets (Settings, Add Debt, Add Expense, Add Goal, Upgrade) have a visual grabber handle. On iOS, a grabber (a ~36×4px rounded pill at the top center of the sheet) is the universal signal that a sheet is dismissible by swiping down. Without it, users don't know the sheet can be swiped — they'll only find the close button.

**CSS-only fix:**
```css
.settings-sheet::before,
.add-modal::before,
.upgrade-modal-card::before {
    content: "";
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: rgba(148, 163, 184, 0.38);
    margin: 0 auto 16px;
    flex-shrink: 0;
}
```

The grabber should render inside the sheet at the very top, before any content. Combined with swipe-down-to-dismiss (a Capacitor gesture or CSS scroll trick), this completes the native sheet feel.

---

### 23. Status Toast Has No Animation

**The gap.** The `.save-status-toast` (which shows "Plan updated", "Saved", etc.) appears and disappears instantly — a jarring flash. It's the same "appears from nothing" problem as any unceremonious state change.

**Fix:**
```css
.save-status-toast {
    animation: toastEnter 200ms cubic-bezier(0.2, 0.9, 0.2, 1) both;
}
@keyframes toastEnter {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
@media (prefers-reduced-motion: reduce) { .save-status-toast { animation: none; } }
```

Exit animation requires either JS-driven class toggling or CSS `animation-direction: reverse` on the auto-clear timeout — the JS-driven approach (add `.toast-exiting` class 200ms before clearing `statusMessage`) is more reliable.

---

### 24. Staggered List Animations Applied Only to Goals — Not Debts or Expenses

**The gap (verified in `app/styles/09-anim-swipe-media-misc.css`).** The `cardReveal` + staggered delay animation was added to `.goal-list-item` (1st through 5th child). The identical `.debt-list-item` and `.saved-item` (expense items) classes have no entrance animation. The inconsistency is visible on first load — goals animate in, debts don't.

**Fix:** Apply the same staggered `cardReveal` pattern to `.debt-list-item` and the required expenses list items. The CSS is already written — it's a copy-paste of the nth-child delay chain with the correct class names. Add `prefers-reduced-motion` fallback for each (already present for goals — same pattern).

---

### 25. No Interest Cost Per Debt on Debt Cards

**The gap.** Each debt card shows balance, APR, and minimum payment — but not what the debt is actively costing in interest each month. This is the single most motivating number for a user deciding which debt to prioritize: seeing "this card is costing you $67/month in interest" is an immediate call to action.

**The data is already computed:** `lib/debt/calculateMonthlyInterest.ts` exists and computes exactly this. The result just isn't shown anywhere on the debt card.

**What to add:** A subtle secondary line on each non-BNPL debt card row: *"~$47/mo in interest"* in `var(--status-bad-strong)` color at `font-size: 0.78rem`. The `~` prefix is important — the actual monthly interest varies with balance, so it's approximate. For paid-off debts or debts with APR=0, this line is hidden.

---

### 26. Haptic Grammar Is Inconsistent

**The gap (verified by grepping all `triggerLightHaptic` / `triggerMediumHaptic` call sites).** The current haptic coverage:
- Light: all navigation taps, settings opens, theme toggle, mark-expense-paid (should be Medium)
- Medium: debt minimum paid (DebtRow:151), debt removed (DebtRow:152), expense mark paid (ExpenseListItem:181), purchase confirmed (page.tsx:1325)
- Missing entirely: rollover completion, successful backup import, successful CSV import, validation error

**The rule that should govern this:**
- `Light` → navigation, opening/closing panels, non-consequential taps
- `Medium` → completing meaningful actions (paid, saved, rollover)
- `Error` (via Capacitor `ImpactStyle.Light` repeated twice, or a dedicated error haptic) → validation failures, failed purchases
- Nothing → passive UI updates, list items rendering

`triggerLightHaptic` on "mark expense paid" is wrong — that's a meaningful financial action, same weight as "mark debt minimum paid" which already correctly uses Medium. The swipe-to-mark-paid on expenses should use Medium.

---

### 27. 3-Way Theme Selector (System / Light / Dark)

**The gap.** The current dark mode is a binary toggle button floating in the app header — an icon button that's easy to miss, hard to discover, and doesn't handle the "respect my phone's setting" case. Premium apps (Notion, Things, Bear, Fantastical) all use a 3-way segmented control in Settings.

**What to build:**
```ts
// lib/hooks/useDarkMode.ts — new type
type ThemePreference = "system" | "light" | "dark";

// Initialize:
// 1. Read stored preference (default: "system")
// 2. If "system": read matchMedia and add change listener for real-time OS theme changes
// 3. If "light" or "dark": apply directly
```

UI: a segmented control (3 buttons in a pill group: `System | Light | Dark`) rendered inside the Settings sheet/accordion, replacing the floating icon toggle in the hero header entirely. The header icon button is removed — Settings is where this belongs.

The `matchMedia` change listener ensures the app responds in real-time when the user changes their OS theme while the app is open (e.g., during the evening as they switch to dark mode).

**Files touched:** `lib/hooks/useDarkMode.ts`, `app/page.tsx` (remove hero toggle button), Settings UI component.

---

### 28. No Privacy/Local-Storage Trust Messaging

**The gap.** The app stores sensitive financial data (balances, due dates, income) in `localStorage`. Users have no way of knowing this. In a post-Cambridge-Analytica world, people worry about their financial data being harvested — and for a local-only app, the truth is highly reassuring: *nothing leaves the device*.

**What to add:** A single line in the Settings sheet, near the backup/restore section:
> "🔒 Your data stays on this device. Nothing is uploaded or shared."

This is one `<p>` tag. The impact on user trust, especially for users considering upgrading to Premium, is disproportionate to its implementation cost.

---

## Updated Summary Priority Matrix

_Items 1–18 from the original audit plus items 19–28 from the second pass, ranked by impact × effort._

| # | Item | Impact | Effort | Priority |
|---|---|---|---|---|
| 19a | Rollover haptic + status message | Very High | Very Low | P0 — do now |
| 21 | Currency input `inputmode="decimal"` | High | Very Low | P0 — do now |
| 1 | Debt payoff trajectory chart | Very High | Medium | P0 |
| 3 | Debt-free date in execution strip | Very High | Low | P0 |
| 18 | Dark mode follows system setting | High | Very Low | P0 |
| 27 | 3-way theme selector (System/Light/Dark) | High | Low | P1 |
| 25 | Interest cost per debt callout | High | Very Low | P1 |
| 20 | Swipe-delete with undo toast | High | Low | P1 |
| 4 | Mark-paid animation feedback | High | Low | P1 |
| 5 | Smart Insights card typography | High | Low | P1 |
| 8 | Plan tab hero personalization | High | Low | P1 |
| 12 | Windfall allocator (pull forward from v1.5) | High | Low | P1 |
| 2 | First-launch empty state | Medium | Low | P1 |
| 22 | Sheet grabber handles | Medium | Very Low | P2 |
| 23 | Toast enter/exit animation | Medium | Low | P2 |
| 24 | Staggered animations on debt/expense lists | Medium | Very Low | P2 |
| 26 | Haptic grammar audit + completion | Medium | Low | P2 |
| 28 | Privacy/local-storage messaging | Medium | Very Low | P2 |
| 7 | Category icons on bills/debts | Medium | Low | P2 |
| 9 | Display amount styling ($ + cents split) | Medium | Low | P2 |
| 11 | Upgrade screen preview card | Medium | Medium | P2 |
| 13 | "Since last cycle" delta indicator | Medium | Medium | P2 |
| 6 | Bottom nav glow on active | Low | Very Low | P3 |
| 10 | Directional tab transitions | Low | Low | P3 |
| 14 | BNPL visual differentiation | Low | Low | P3 |
| 15 | Settings as accordion vs modal | Low | Medium | P3 |
| 19b | Rollover celebration / debt payoff moment | High | Medium | P3 — v1.6 |
| 16 | Storage schema versioning | Infra | Low | Before v1.4 |
| 17 | Basic accessibility (aria-labels) | Trust | Medium | Before v1.4 |

---

_This audit was last updated 2026-06-27, v1.3 branch. All suggestions are additive to the current feature set and do not require backend infrastructure, account systems, or new subscription tiers._

| # | Item | Impact | Effort | Priority |
|---|---|---|---|---|
| 1 | Debt payoff trajectory chart | Very High | Medium | P0 |
| 3 | Debt-free date in execution strip | Very High | Low | P0 |
| 18 | Dark mode follows system setting | High | Very Low | P0 |
| 4 | Mark-paid animation feedback | High | Low | P1 |
| 5 | Smart Insights card typography | High | Low | P1 |
| 8 | Plan tab hero personalization | High | Low | P1 |
| 12 | Windfall allocator (pull forward from v1.5) | High | Low | P1 |
| 2 | First-launch empty state | Medium | Low | P1 |
| 7 | Category icons on bills/debts | Medium | Low | P2 |
| 9 | Display amount styling ($ + cents split) | Medium | Low | P2 |
| 11 | Upgrade screen preview card | Medium | Medium | P2 |
| 13 | "Since last cycle" delta indicator | Medium | Medium | P2 |
| 6 | Bottom nav glow on active | Low | Very Low | P3 |
| 10 | Directional tab transitions | Low | Low | P3 |
| 14 | BNPL visual differentiation | Low | Low | P3 |
| 15 | Settings as accordion vs modal | Low | Medium | P3 |
| 16 | Storage schema versioning | Infra | Low | Before v1.4 |
| 17 | Basic accessibility (aria-labels) | Trust | Medium | Before v1.4 |

---

_This audit reflects the state of the codebase as of 2026-06-27, v1.3 branch. Items in ROADMAP.md v1.4+ are intentionally excluded unless they overlap with a current quality gap that should be fixed ahead of that version. All suggestions here are additive to the current feature set and do not require backend infrastructure, account systems, or new subscription tiers._
