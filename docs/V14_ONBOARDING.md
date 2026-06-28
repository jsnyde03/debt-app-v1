# v1.4 — Onboarding Flow

_Part of the [Implementation Plan](IMPLEMENTATION_PLAN.md). This is the active next version after v1.3._

## Overall status

| Item | Status |
|---|---|
| Onboarding flow (4 steps) | ✅ DONE — shipped 2026-06-27, commit e9e8a32 |
| Cash buffer + debt math fixes | ✅ DONE — shipped 2026-06-27 |
| E2E Playwright spec | ✅ DONE — 5 tests, 20 runs, all green |
| Mobile Polish P4 (empty-state SVG) | ✅ DONE — 2026-06-27 |
| Mobile Polish P9c (hover → active audit) | ✅ DONE — 2026-06-27 |
| UX Polish #2, #5, #8, #22, #23, #24, #28 | ✅ DONE — 2026-06-27 |
| UX Polish #3, #4, #7, #9–#12, #14, #17, #20, #25–#27 | ✅ DONE — 2026-06-27 |

---

## Scope

Replace the bare "enter paycheck amount" first-run sheet with a guided multi-step onboarding flow.

## Current state

`app/page.tsx` gates on `isFirstRunSetup` (derived from `hasConfiguredPaycheck`) and renders the same `PaycheckSection` settings sheet used for ongoing settings — just with different copy ("Create Your First Plan" vs "Plan Settings") and an `Import Backup` shortcut. There's no walkthrough of what the app does.

Demo Mode ("Try with Sample Data") was added in v1.2 as a button on this first-run sheet (`app/page.tsx:1215`). v1.4 must account for this — see below.

---

## Demo Mode integration (v1.4 design constraint)

Two touch points must be settled before implementation. Both will present as bugs at QA time if not decided upfront.

### Issue 1 — "Try with Sample Data" button is homeless

The button currently lives on the first-run setup sheet (`app/page.tsx:1215`) that v1.4 replaces. It must move into the new `OnboardingFlow`.

**Decision:** Place it on `WelcomeStep.tsx` as a secondary CTA below "Get Started." The Welcome screen is the right decision point — the user has just seen what the app does, and "try it with sample data first" is a natural opt-out before committing to their own numbers.

### Issue 2 — Onboarding gate must account for demo mode

In v1.3, the gate is `isFirstRunSetup` (= `!hasConfiguredPaycheck`). A user in demo mode has a paycheck configured (demo data sets one), so `isFirstRunSetup = false` and the app renders normally — correct.

In v1.4, the gate becomes `!hasCompletedOnboarding`. A user who clicks "Try with Sample Data" before completing onboarding will have `hasCompletedOnboarding = false` and `isDemoMode = true`. Without an explicit demo mode check, that user sees the onboarding overlay on every app load while in demo mode.

**Decision:** Gate onboarding as `!hasCompletedOnboarding && !isDemoMode`.

**Bonus — exit-demo flow improves for free:** "Start My Own Plan" calls `localStorage.clear()` + reload, which clears both flags. The user then sees real onboarding for the first time — a proper guided setup instead of the raw paycheck form they'd land on today. No extra code needed; it falls out naturally.

---

## Implementation steps

1. ✅ **DONE** — New `components/Onboarding/` directory:
   - `OnboardingFlow.tsx` — step-state container (`useState<number>` for step index)
   - `WelcomeStep.tsx` — what the app does, 1 screen. Secondary CTA: "Try with Sample Data" (calls `applyDemoPlannerStateToStorage` + reload, same as the button it replaces)
   - `PaycheckStep.tsx` — reuses the existing paycheck amount/cycle fields (duplication is fine — avoid premature abstraction here)
   - `FirstDebtOrBillStep.tsx` — optional quick-add of one debt or bill so the user sees a populated plan immediately; "Skip, I'll add later" exits the step
   - `CompletionStep.tsx` — "Here's your plan" handoff into the main app

2. ✅ **DONE** — New `lib/hooks/useOnboarding.ts` — step state + `debtPlanner.hasCompletedOnboarding` localStorage flag.

3. ✅ **DONE** — In `app/page.tsx`, replaced the `isFirstRunSetup` branch's `<PaycheckSection>` render with `<OnboardingFlow>` when `!hasCompletedOnboarding && !isDemoMode`.

4. ✅ **DONE** — Allow skip throughout — this is a planner app, not a game. Forcing steps risks abandonment.

5. ✅ **DONE** — **First-launch empty state (audit #2):** "Your debt-free date is waiting. Add your first debt to see exactly what to do this paycheck." card renders in the Plan tab when paycheck is set but no debts exist. "Add First Debt" navigates to Bills tab.

---

## Data model changes

New `debtPlanner.hasCompletedOnboarding` localStorage flag. No other changes.

---

## Files touched

`components/Onboarding/` (new directory, 5 files), `lib/hooks/useOnboarding.ts` (new), `app/page.tsx` (gate condition update).

---

## Testing ✅ DONE

Playwright spec `tests/e2e/onboarding-flow.spec.ts` — 5 tests across 4 projects (mobile-chrome, iphone-pro-max, ipad-pro-11, ipad-pro-11-landscape), all green:

1. **Complete all steps** — fills amount + debt, completes CompletionStep, verifies `hasCompletedOnboarding=true`, amount persisted, debt persisted; confirms no reappearance on reload
2. **Skip paycheck step** — "Skip for now" jumps to CompletionStep; flag still set
3. **Skip first-debt step** — fills amount, skips debt; no debts saved, flag set
4. **Try with Sample Data** — demo mode loads, demo banner visible; onboarding does not reappear on reload
5. **Exit demo → onboarding reappears** — "Start My Own Plan" clears localStorage; WelcomeStep visible again

Implementation note: `waitForMainApp` uses `.filter({ visible: true }).first()` on the combined `.bottom-nav, .sidebar-nav` selector — required because iPad hides `.bottom-nav` via `@media (min-width: 834px)` and shows `.sidebar-nav` instead.

---

## Risk

Low. Pure UI addition, no engine or data changes. The demo mode gate condition (Issue 2 above) is the highest-risk piece — verify before any demo-mode QA pass.

---

## ✅ DONE — Shipped 2026-06-27, commit e9e8a32

**Files created:**
- `lib/hooks/useOnboarding.ts` — flag + migration safety (existing users with amount set → treated as onboarded)
- `components/Onboarding/OnboardingFlow.tsx` — step container, step 0–3
- `components/Onboarding/WelcomeStep.tsx` — app pitch, Get Started / Try with Sample Data
- `components/Onboarding/PaycheckStep.tsx` — amount + pay cycle + next date, saves to localStorage on Continue
- `components/Onboarding/FirstDebtOrBillStep.tsx` — optional quick-add debt or expense
- `components/Onboarding/CompletionStep.tsx` — sets hasCompletedOnboarding flag, reloads
- `app/styles/10-onboarding.css` — onboarding-specific styles

**Files modified:**
- `app/page.tsx` — imports useOnboarding + OnboardingFlow; gate `!hasCompletedOnboarding && !isDemoMode` renders OnboardingFlow before main app

**Migration:** `useOnboarding` returns `true` (skips onboarding) if `debtPlanner.amount` is already set — protects all existing v1.3 users from seeing the new flow on upgrade.

---

## Addendum — Mobile Polish P4 and P9c ⏳ Pending

_See [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) for full detail. Summary for version-sequencing reference only._

**P4 — Empty-state illustrations:** Small inline SVG illustration above the existing empty-state text for debts, expenses, and goals — themed to match the icon system completed in P1a/P1b (done as of v1.3).

**Files touched:** `DebtsSection.tsx`/`DebtGroup.tsx`, `RequiredExpensesSection.tsx`, `GoalsSection.tsx`.

**P9c — Hover-only feedback audit:** Every `:hover`-only CSS rule in `app/styles/00-theme-and-base.css` (lines 385/401-405/491/646/651), `app/styles/03-nav-results-modals.css` (lines 201/716), and `app/styles/09-anim-swipe-media-misc.css` (line 369) gets an equivalent `:active`/touch-triggered state. **Must be verified on a real touch device or Simulator** — a mouse browser still triggers `:hover` and will mask whether the fix worked.

**Files touched:** `app/styles/00-theme-and-base.css`, `app/styles/03-nav-results-modals.css`, `app/styles/09-anim-swipe-media-misc.css`.

**Risk:** Low-medium. The only real risk is skipping touch-device verification for P9c.

---

## Addendum — UX polish items assigned to v1.4

See [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) for full implementation detail on each item.

### ✅ DONE (2026-06-27, sessions 1–3)

- **#2** — First-launch empty state: "Your debt-free date is waiting" card in Plan tab when paycheck set + no debts; "Add First Debt" → Bills tab.
- **#3** — Debt-Free Date in Execution Summary Strip: replaced "Status" cell with "Debt-Free" date, computed via shared `debtFreeDate` useMemo in page.tsx; passed as prop to ResultsSection; `.strip-cell-debt-free strong` uses smaller font.
- **#4** — Mark-Paid Transition Animation: `cardExit` (200ms dim+scale) + `checkPulse` (400ms ✓ overlay via `::after`) applied in DebtRow and ExpenseListItem via `animating-paid` class; triggered by useEffect tracking paid-state transition.
- **#5** — Smart Insights Card Typography: title font-size 0.92→1.12rem; action `<small>` chip styling; 4px colored left-border per severity.
- **#7** — Category Icons on Bills and Debts: expense rows already had category chips; debt rows now show `<CreditCard>` icon chip for `type === "debt"`, `.bnpl-badge` for BNPL.
- **#8** — Plan Tab Hero Personalization: contextual subtitle (shortfall/debt-free date/default).
- **#9** — Display Amount Styling: `formatDisplayAmount` helper; `.display-amount-symbol/.display-amount-cents` CSS; applied to 3 execution strip currency cells in ResultsSection.
- **#10** — Directional Tab Transitions: `prevTabRef` + `tabDirection` in page.tsx; `data-direction="forward|backward"` on content wrapper; `tabSlideInRight/Left` CSS keyframes with `prefers-reduced-motion` fallback.
- **#11** — Upgrade Screen Preview Card: frosted-glass mock showing 2 blurred insight rows with "Unlock with Premium" overlay above the action buttons.
- **#12** — Windfall/Bonus Allocator: "Got extra money?" card in Plan Settings; inline form adds windfall to `amount` state, closes sheet, shows status toast.
- **#14** — BNPL Visual Differentiation: `.bnpl-badge` purple pill; "X payments left" replaces APR for BNPL debts with `remainingPayments`.
- **#17** — Basic Aria-Label Audit: `aria-label` on hero `<section>` + both `<nav>`s; `role="region"` + dynamic `aria-label` on tab content wrapper; `aria-live="polite"` + `aria-label` on execution summary strip.
- **#20** — Swipe-Delete Undo Toast: `restoreDebt`/`restoreExpense` in hooks; `handleRemoveDebtWithUndo`/`handleRemoveExpenseWithUndo` in page.tsx with 5s timer; `.undo-toast` + `.undo-toast-button` CSS.
- **#22** — Sheet Grabber Handles: `::before` pill on `.settings-sheet` + `.upgrade-modal-card`.
- **#23** — Toast Animation: `toastEnter`/`toastExit` keyframes; `.exiting` class + two-timer exit pattern in page.tsx.
- **#24** — Staggered Animations: `debt-list-item` + `required-expense-row` use `cardReveal` + nth-child delays.
- **#25** — Interest Cost Per Debt Callout: `calculateMonthlyInterest` per debt row; red `.debt-interest-callout` span for debts with APR > 0.
- **#26** — Haptic Grammar Completion: `triggerErrorHaptic` added to haptics.ts; error haptic on validation failure in useGoals/useDebts/useRequiredExpenses; medium haptic on backup + CSV import success; swipe-delete Light → Medium in DebtRow.
- **#27** — 3-Way Theme Selector: `useDarkMode` now supports `ThemePreference = "system" | "light" | "dark"` with OS media query listener; floating icon toggle removed; segmented control (Auto / Light / Dark) added to Plan Settings; migration: stored boolean → enum.
- **#28** — Privacy/Local-Storage Trust Messaging: "Your data stays on this device" above legal links.
- **P4** — Empty-state SVG illustrations: 48px `CreditCard` / `Wallet` / `Target` icons above empty-state text in DebtsSection, RequiredExpensesSection, GoalsSection via `.empty-state-icon` CSS.
- **P9c** — Hover → active CSS audit: `:active` equivalents added for all `:hover`-only rules across 00-theme-and-base.css, 03-nav-results-modals.css, 09-anim-swipe-media-misc.css. Note: touch-device verification still recommended before final QA.

### All v1.4 UX polish items complete ✅
