# Debt Planner v1.5 — Pre-Submit TestFlight QA Checklist

_Authored at v1.5 feature-lock (2026-07-02) per the portfolio pre-submit-TestFlight rule. **Jason runs this top-to-bottom on a real device (TestFlight build) before v1.5 is submitted for App Store review — a clean pass is a hard gate.** It covers the FULL v1.5 changed surface, not just one milestone; native / device-only paths (which browser + Playwright can't reach) come first. Write/ship ONE build that validates everything (conserve Codemagic minutes)._

**Version under test:** v1.5 "Track Your Journey" · branch `v1.5-dev`.
**Off-device gate (must already be green before the build):** lint 0/0 · `test:regression` 25 modules · e2e 120/120 functional × 4 device projects (CI) · `tsc` · `npm run build`. ✅ Verified green at lock 2026-07-02.

---

## 0. Native / device-only paths (HIGHEST priority — Playwright/browser cannot reach these)

- [ ] **Haptics** — milestone celebration fires haptic (progress = light/success; paid-off/debt-free = medium); mark-paid, rollover, and nav taps buzz; disabling system haptics is respected.
- [ ] **Biometric App Lock** — Settings → App Lock toggle ON → app requires Face ID / Touch ID / passcode on next cold launch; the lock screen's unlock works; toggle OFF removes the gate. (Enrolled + not-enrolled devices.)
- [ ] **Notifications** — enabling the toggle triggers the OS permission prompt; on grant, a paycheck-eve reminder + upcoming-bill alerts schedule; **Start Next Pay Cycle reschedules** for the new cycle; denying permission flips the toggle back off cleanly.
- [ ] **In-App Purchase (RevenueCat)** — from the Amortization "View Schedule" paywall AND the Pay Cycle History paywall: **purchase** Premium unlocks both; **Restore Purchases** re-unlocks on a fresh install; **offline** purchase attempt fails gracefully (no crash, clear status).
- [ ] **App Store review prompt** — completing a rollover eventually triggers `maybeRequestAppReview` (native rating sheet) at the intended cadence; does not spam every rollover.
- [ ] **Backup export / import (native file + share)** — Settings → Export Backup produces a shareable JSON via the share sheet; Import Backup (first-run panel) restores debts/expenses/goals correctly and the UI reflects it.
- [ ] **Native date pickers** — paycheck date, debt due date, expense due date all open the iOS date picker and persist the chosen date.
- [ ] **Pull-to-refresh** — the gesture on the app content shows the spinner and the "Up to date" status; no layout jump.

## 1. Onboarding & first run

- [ ] Fresh install → onboarding flow (Welcome → Paycheck → First Debt/Bill → Completion) with no flash of the main app.
- [ ] "Try with Sample Data" loads the demo persona; the **Demo Mode banner** shows; "Start My Own Plan" clears it and returns to a clean first-run.
- [ ] First-run "Create Your First Plan" modal: entering a paycheck + Calculate lands on the Plan tab.

## 2. Plan tab (the core loop)

- [ ] "This Paycheck" card: Required / Extra Payoff / Remaining Cushion / Debt-Free date all populate and reconcile with the entered data.
- [ ] Required Actions + Recommended Actions lists; **iPad (≥834px) auto-expands** the full lists (no "Show N More" dead-click); phone shows the cap.
- [ ] Mark an action paid → moves to "Completed This Cycle"; **Since-last-cycle delta** appears after a rollover (↓ green paid-down / neutral wording).
- [ ] **🔥 Streak** stat shows after ≥1 on-plan cycle; hidden at 0.
- [ ] Timeline section renders; **iPad (≥1024px) auto-expands** it (two-column layout).

## 3. Bills tab

- [ ] Phone: Expenses / Debts sub-tab switcher; iPad: two-column (no switcher, both visible).
- [ ] Add / edit / remove a required expense, a living expense, a debt (with undo toast); **CSV import** of debts works.
- [ ] Debt search filters; **Active Debts auto-expands on iPad**; per-debt progress bars + "% paid" render.

## 4. Payoff tab

- [ ] Strategy toggle (snowball ↔ avalanche) updates the recommendation + **trajectory chart** (`buildPayoffTrajectory`); chart is monotonic, both strategies render distinctly.
- [ ] **Amortization "View Schedule"**: free → paywall; premium → the focus-debt Month/Interest/Principal/Balance schedule, reaching $0.

## 5. Goals tab

- [ ] Add / edit / remove a goal; progress bars + overall progress; emergency vs savings types.

## 6. Milestones & celebration (v1.5 headline)

- [ ] Cross a 25/50/75% threshold on rollover → progress celebration (✨/🔥, haptic, no confetti).
- [ ] Fully pay a debt on rollover → **paid-off celebration** (🏆, confetti, medium haptic, debt name prominent).
- [ ] Pay off the last debt → **debt-free celebration** (🎉, heavier confetti). Each fires **once**, on crossing, never re-fires on later rollovers.

## 7. Pay Cycle History (v1.5)

- [ ] Complete a rollover → a snapshot records (pre-rollover balances/actions/strategy).
- [ ] History screen: locked (free → paywall), empty, populated, and capped (free-tier limit) states all render correctly.

## 8. Settings (2.8 rework) & appearance

- [ ] Returning user: settings **accordion** (between hero and tabs); first-run: settings **modal**. Both open/close from the gear (plan-toolbar + iPad sidebar), `aria-expanded` correct.
- [ ] **Appearance** Auto / Light / Dark selector switches theme live and persists across relaunch.
- [ ] Windfall entry adds to the paycheck; "Reset to Today"; "Delete All Data" (confirm → erase).
- [ ] Legal links (Privacy / Terms / Support / Manage Subscription) open.

## 9. Layout & premium polish (2.15) — phone + iPad × light + dark

- [ ] Every tab audited on iPhone and iPad, light and dark: no dead-space, no clipped/overflowing cards, modal runways correct, no light/dark contrast misses. (This is the premium-bar visual pass.)

## 10. Resilience & data safety

- [ ] **Corrupt data**: if a saved value fails to parse, the **storage-corruption banner** shows, the app still renders, and no data is silently wiped (the live key keeps its bytes). _(Automated by `planner-storage-safety.spec.ts`; spot-confirm on device.)_
- [ ] Backgrounding / relaunch mid-flow preserves state; no white-screen on cold start (skeleton → app).

## 11. Financial-accuracy spot-checks (reconcile the numbers by hand)

- [ ] **Rollover math**: a debt carrying interest + a partial minimum + a snowball payment produces the expected new balance after "Start Next Pay Cycle."
- [ ] **Amortization** total interest reconciles with the debt's payoff timeline.
- [ ] BNPL debt accrues **no** interest.
- [ ] Milestone thresholds + streak count + since-last-cycle delta match the underlying data.

---

**Sign-off:** _v1.5 is submittable only when every box above passes on a real device in one TestFlight build._
