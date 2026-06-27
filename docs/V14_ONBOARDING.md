# v1.4 — Onboarding Flow

_Part of the [Implementation Plan](IMPLEMENTATION_PLAN.md). This is the active next version after v1.3._

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

1. New `components/Onboarding/` directory:
   - `OnboardingFlow.tsx` — step-state container (`useState<number>` for step index)
   - `WelcomeStep.tsx` — what the app does, 1 screen. Secondary CTA: "Try with Sample Data" (calls `applyDemoPlannerStateToStorage` + reload, same as the button it replaces)
   - `PaycheckStep.tsx` — reuses the existing paycheck amount/cycle fields (duplication is fine — avoid premature abstraction here)
   - `FirstDebtOrBillStep.tsx` — optional quick-add of one debt or bill so the user sees a populated plan immediately; "Skip, I'll add later" exits the step
   - `CompletionStep.tsx` — "Here's your plan" handoff into the main app

2. New `lib/hooks/useOnboarding.ts` — step state + `debtPlanner.hasCompletedOnboarding` localStorage flag.

3. In `app/page.tsx`, replace the `isFirstRunSetup` branch's `<PaycheckSection>` render with `<OnboardingFlow>` when `!hasCompletedOnboarding && !isDemoMode`.

4. Allow skip throughout — this is a planner app, not a game. Forcing steps risks abandonment.

5. **First-launch empty state (audit #2):** After onboarding, a user with zero debts sees blank card stubs. Replace with a single card: _"Your debt-free date is waiting. Add your first debt to see exactly what to do this paycheck."_ One conditional render in the Plan tab's results area — no new routing or architecture.

---

## Data model changes

New `debtPlanner.hasCompletedOnboarding` localStorage flag. No other changes.

---

## Files touched

`components/Onboarding/` (new directory, 5 files), `lib/hooks/useOnboarding.ts` (new), `app/page.tsx` (gate condition update).

---

## Testing

New Playwright spec `tests/e2e/onboarding-flow.spec.ts`:
- Fresh install → complete all steps → lands on Plan tab with correct empty state
- Fresh install → skip everything → still lands in app correctly
- Fresh install → "Try with Sample Data" → demo mode loads; onboarding does **not** reappear on next load
- Exit demo ("Start My Own Plan") → onboarding appears (not skipped)

---

## Risk

Low. Pure UI addition, no engine or data changes. The demo mode gate condition (Issue 2 above) is the highest-risk piece — verify before any demo-mode QA pass.

---

## Addendum — Mobile Polish P4 and P9c

_See [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md) for full detail. Summary for version-sequencing reference only._

**P4 — Empty-state illustrations:** Small inline SVG illustration above the existing empty-state text for debts, expenses, and goals — themed to match the icon system completed in P1a/P1b (done as of v1.3).

**Files touched:** `DebtsSection.tsx`/`DebtGroup.tsx`, `RequiredExpensesSection.tsx`, `GoalsSection.tsx`.

**P9c — Hover-only feedback audit:** Every `:hover`-only CSS rule in `app/styles/00-theme-and-base.css` (lines 385/401-405/491/646/651), `app/styles/03-nav-results-modals.css` (lines 201/716), and `app/styles/09-anim-swipe-media-misc.css` (line 369) gets an equivalent `:active`/touch-triggered state. **Must be verified on a real touch device or Simulator** — a mouse browser still triggers `:hover` and will mask whether the fix worked.

**Files touched:** `app/styles/00-theme-and-base.css`, `app/styles/03-nav-results-modals.css`, `app/styles/09-anim-swipe-media-misc.css`.

**Risk:** Low-medium. The only real risk is skipping touch-device verification for P9c.

---

## Addendum — UX polish items assigned to v1.4

See [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md) for full implementation detail on each item. Priority order (cut from the bottom if time is short):

1. **#3** — Debt-Free Date in Execution Summary Strip
2. **#4** — Mark-Paid Transition Animation
3. **#5** — Smart Insights Card Typography
4. **#8** — Plan Tab Hero Personalization
5. **#12** — Windfall/Bonus Allocator (Free tier, pulled from v1.5)
6. **#7** — Category Icons on Bills and Debts
7. **#9** — Display Amount Styling ($ + Cents Split)
8. **#10** — Directional Tab Transitions
9. **#11** — Upgrade Screen Preview Card
10. **#14** — BNPL Visual Differentiation
11. **#17** — Basic Aria-Label Audit
12. **#26** — Haptic Grammar Completion
13. **#27** — 3-Way Theme Selector (System / Light / Dark)
14. **#20** — Swipe-Delete Undo Toast
15. **#22** — Sheet Grabber Handles
16. **#23** — Toast Animation
17. **#24** — Staggered Animations on Debt and Expense Lists
18. **#25** — Interest Cost Per Debt Callout
19. **#28** — Privacy/Local-Storage Trust Messaging
