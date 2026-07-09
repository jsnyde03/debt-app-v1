# Debt Planner v1.6 — Pre-Submit Functional-Correctness Audit (round 2)

_Run 2026-07-06, triggered by Jason after finding two onboarding/import bugs by hand ("this payday issue would have killed confidence if not found"). A **6-agent adversarial sweep** of the whole functional surface with a **real-user-expectation lens** ("does it do what a user would EXPECT, not what the spec says"), each finding then **verified against the actual code** before it counted. Deliberately targets **cross-feature seams and the full user journey** — where the earlier 1.9.2 audit (scoped to isolated v1.6 features) missed the onboarding × import × payday bugs. Companion to [V15_FUNCTIONAL_AUDIT.md](V15_FUNCTIONAL_AUDIT.md); the HARD rule is [[feedback_presubmit_functional_audit]]._

**Result: 21 agents, 14 findings surviving adversarial verification — 3 HIGH · 4 MEDIUM · 7 LOW.** (#2 and #7 below are the SAME nudge-suppression bug, found independently by two auditors → treated as one HIGH.) The engine math, corruption/quarantine safety, the mark/unmark money invariant, premium gating, and theming all verified **healthy** — the bugs cluster at feature seams and on the entry/exit journey, exactly as predicted.

> **Meta-lesson (again):** every HIGH is a **state one feature sets and another doesn't clear/read consistently** — demo-mode vs import, capture vs the rollover nudge, displayBalance vs the projection re-derivation. The hand-found bugs and the audit finds are the same shape. Cross-feature seams are this app's structural weak point; that's where to keep looking.

> **✅ REMEDIATED 2026-07-06 — ALL 13 fixed** (Jason: "fix all including lows"). Each fix carries a regression test where the logic warranted (milestone re-cross, debt-edit validation parity, payday nudge on the one-tap path, import round-trip). `validate:release` green: tsc 0 · lint 0 · regression (all modules + new tests) · e2e 128 across 4 device projects. One e2e (`planner-payoff-date`) was CORRECTED, not worked around: it had been relying on the #3 double-count to "clear" a debt on the extra payment alone — it now marks the minimum too, matching real behavior. Fix locations are noted inline per finding.

---

## Summary

| # | Sev | Area | Finding | Disposition |
|---|-----|------|---------|-------------|
| 1 | 🔴 HIGH | onboarding | Import while in Demo Mode leaves `isDemoMode` stuck → banner over real data; exit/delete **wipes the imported plan** | **Fix in v1.6** |
| 2 | 🔴 HIGH | payday | One-tap "I followed the plan" **suppresses the rollover nudge** → cycle frozen on the happy path _(= #7)_ | **Fix in v1.6** |
| 3 | 🔴 HIGH | payoff | Completed snowball **subtracted twice** from projection balances → all Payoff analytics over-optimistic | **Fix in v1.6** |
| 4 | 🟠 MED | payoff | Trajectory chart truncates at 120 mo while engine runs to 600 → line never reaches zero yet a date shows | **Fix in v1.6** |
| 5 | 🟠 MED | data | Backup export→import **silently drops pay-cycle history + streak** | **Fix in v1.6** |
| 6 | 🟠 MED | data | Goal edit **Save silently does nothing** for comma numbers / over-funded goals | **Fix in v1.6** |
| 7 | — | — | _(duplicate of #2)_ | merged |
| 8 | 🟡 LOW | onboarding | First-run **Calculate does nothing** when Next Payday = today (natural on-payday setup) | Fix in v1.6 (cheap) |
| 9 | 🟡 LOW | onboarding | Demo data goes stale after ~2 wks → payday sheet pops over sample data | Backlog |
| 10 | 🟡 LOW | core-loop | A % milestone can re-celebrate if progress backslides then re-crosses | Backlog |
| 11 | 🟡 LOW | payoff | Avalanche Focus-Debt display lacks the equal-APR tiebreaker the engine uses | Fix in v1.6 (cheap) |
| 12 | 🟡 LOW | data | Debt EDIT path bypasses APR≤100 / min≤balance validation the ADD path enforces | Fix in v1.6 (cheap) |
| 13 | 🟡 LOW | cross-cut | Import doesn't reschedule notifications for the rolled-forward payday | Fix in v1.6 (cheap, w/ #1) |
| 14 | 🟡 LOW | cross-cut | Enabling App Lock immediately throws you to the lock screen | Backlog (UX polish) |

---

## HIGH

### 1. Import while in Demo Mode → data loss
`app/page.tsx:679-739 (handleImportBackup)` · interacts with `isDemoMode` (read-only at :190, only cleared by `localStorage.clear()`) and `handleExitDemoMode` (:920-923).
- **User impact:** Tap "Try with Sample Data" → explore → **Import Backup** (the button is right there in Settings during demo). Your real imported plan loads, but the "Demo Mode — viewing sample data" banner **stays**. Both banner exits ("Start My Own Plan" and "Delete All Data") call `localStorage.clear()`, so the tap a user makes to keep their real plan **permanently erases the just-imported data.**
- **Expected → actual:** Import should exit demo (clear `isDemoMode`) exactly as it already clears `isFirstRunSetup` at :728 — but it never touches `isDemoMode`, which has no setter and only flips false via `localStorage.clear()`. Same bug class as the two hand-found fixes.
- **Fix:** in `handleImportBackup`, clear demo mode (`writeKey("debtPlanner.isDemoMode", false)` + drop the in-memory flag / banner) alongside the `isFirstRunSetup` clear. Expose an `isDemoMode` setter so the banner updates without a reload.

### 2. One-tap capture suppresses the rollover nudge → cycle frozen  _(found twice: payday + cross-cutting)_
`lib/hooks/usePaydayCapture.ts:66-68` (`isAwaitingRollover` ANDed with `hasCapturablePlan`) · `app/page.tsx:405, 1035`.
- **User impact:** The user taps the single most common button — **"I followed the plan"** — and is then shown **nothing** telling them to advance the cycle. Payments only hit real balances at rollover, so debts never pay down, the streak never increments, and the Interest-Saved Ledger / history never progress. Perversely, tapping **"Not now"** *does* show the nudge — the success path is guided worse than the dismiss path. This is exactly the permanent-silence stuck-state my Fix E (the nudge) was meant to prevent — and it fails on the path that needs it most.
- **Expected → actual:** After capture, `isPaydayAwaitingRollover()` is already true and the nudge should render — but `isAwaitingRollover` is gated on `hasCapturablePlan`, and a full capture empties `activeRecommendedActions` (captured snowball drops the debt out, captured cash drives flexible cash to 0), so `hasCapturablePlan` flips false and the nudge is suppressed.
- **Fix:** drop `hasCapturablePlan` from the `isAwaitingRollover` gate — awaiting-rollover is about a **handled payday**, not about remaining capturable actions. (Guard against showing on a truly empty slate via the handled-flag + `nextPaycheckDate` instead.) Add a regression test for the full-capture path.

### 3. Completed snowball subtracted twice from projection balances
`components/SnowballSection.tsx:79` (+ `getDebtsWithDisplayBalances.ts:24-31`, wired at `app/page.tsx:1147`).
- **User impact:** After marking the recommended extra snowball payment done, **every** Payoff-tab projection (debt-free date, recommendation strip, strategy comparison, trajectory, forecast, what-if baseline) understates the target debt by the paid amount — showing a **too-early** debt-free date and too-low interest, and contradicting the same screen.
- **Expected → actual:** `debtsAfterCompletedPayments` should use `displayBalance` directly (it already = balance − paidMin − completedSnowball) — but it computes `balance = max(0, displayBalance − completedAmountForDebt)`, subtracting the completed snowball a **second** time.
- **Fix:** use `displayBalance` as the projection balance (remove the extra subtraction); add a regression test asserting a marked payment moves the projected date by exactly the paid amount, not double.

---

## MEDIUM

### 4. Trajectory chart truncates at 120 months (engine runs to 600)
`lib/debt/buildPayoffTrajectory.ts:35` vs `projectDebtPayoff.ts:88`.
- **User impact:** For a realistic high-balance/high-APR plan whose payoff exceeds 10 years, both chart lines flatten **above zero** (looks like the debt is never paid off) while the debt-free date right above says e.g. 2039.
- **Fix:** raise the trajectory loop cap to match `projectDebtPayoff` (600), or cap-and-label; keep the chart and the date in agreement.

### 5. Backup drops pay-cycle history + streak
`app/page.tsx:485-508 (buildBackupData)` + `:679-739 (handleImportBackup)`; key `debtPlanner.cycleHistory`.
- **User impact:** A Premium user who exports and later restores (reinstall / new phone) **loses their whole cycle history and streak** — everything else restores. Worse, importing onto an existing install keeps the OLD history, so the streak/history then belong to the wrong plan.
- **Fix:** serialize `cycleHistory` in `buildBackupData` and `setCycleHistory` in `handleImportBackup` (replace to match the imported plan).

### 6. Goal edit "Save" silently no-ops
`components/GoalsSection.tsx:74-90 (saveEditing)`.
- **User impact:** Editing a goal, typing `1,000` (comma, as decimal keyboards allow) or lowering an over-funded goal's target, tap Save → **nothing happens, no error.** The debt edit path was hardened for commas (`parseDebtFormValues`); the goal edit path wasn't.
- **Fix:** parse comma-grouped input (mirror the debt path) and surface a validation error instead of a silent early-return; allow lowering an over-funded target (the reconcile is already data-safe).

---

## LOW

### 8. First-run Calculate does nothing when Next Payday = today  _(fix — cheap, bad first impression)_
`app/page.tsx:510-526` — `handleCalculate` early-returns on `nextPaycheckDate <= currentDate`. Setting up **on payday** (a natural answer) makes the primary CTA do nothing, with no Close on the first-run overlay → stuck. The `result` memo already handles same-day fine. **Fix:** allow `nextPaycheckDate == today` (or show an inline error).

### 11. Avalanche Focus-Debt display lacks the equal-APR tiebreaker  _(fix — cheap correctness)_
`SnowballSection.tsx:85-91` sorts by `apr` only; the engine (`projectDebtPayoff.sortDebts`) breaks equal-APR ties by smallest balance. With two equal-APR debts the highlighted Focus Debt can differ from the one the projection actually attacks. **Fix:** add the smallest-balance tiebreaker to the display sort.

### 12. Debt EDIT bypasses ADD-path validation  _(fix — cheap, protects money math)_
`DebtsSection.tsx:190-217` → `parseDebtFormValues` only checks finite ≥ 0; the ADD path caps APR ≤ 100 and requires `min ≤ balance`. A fat-fingered APR (250 vs 25) flows into interest/date math on edit. **Fix:** apply the ADD-path guards in the edit path.

### 13. Import doesn't reschedule notifications  _(fix — cheap, bundle with #1)_
`handleImportBackup` rolls `nextPaycheckDate` forward (`rollPaydayToFuture`, :709) but never calls `scheduleNotifications`, so reminders point at the old payday until the next launch. **Fix:** reschedule on import when notifications are enabled (as Calculate/rollover do).

### 9. Demo data goes stale → payday sheet pops over sample data  _(backlog)_
`seedPlannerState.ts:34-50` — demo `nextPaycheckDate = seedDate+14`; after ~14–21 real days the capture sheet auto-pops over demo data. **Defer:** suppress payday auto-open in demo mode, or re-anchor demo dates on open. Low (demo is throwaway).

### 10. A % milestone can re-celebrate on threshold re-cross  _(backlog)_
`computeMilestones.ts:65-67` — no per-threshold "already celebrated" memory; if a balance backslides below a celebrated threshold and later re-crosses, the confetti re-fires. **Defer:** persist a per-debt per-threshold celebrated set. Rare (needs interest > minimum then a re-crossing payment).

### 14. Enabling App Lock jumps straight to the lock screen  _(backlog — UX)_
`useAppLock.ts:49-52` — `setAppLockEnabled(true)` sets `isUnlocked=false` synchronously, so toggling it on instantly shows the Unlock screen. Not a lockout (unlock returns; fails open), but reads as a glitch. **Defer:** arm the lock for the next background/relaunch, keep the user in Settings after toggling.

---

## Area health (what verified GOOD)

- **onboarding** — the two hand-found fixes (import clears first-run; payday roll-forward) verified **complete**; new seam = demo-mode import (#1) + the on-payday Calculate dead-end (#8).
- **payday lifecycle** — detection/recency, one-tap/adjust/external, the accumulate model, dismiss/no-nag all **sound**; the one hole is the nudge gate (#2).
- **core loop** — allocation → mark → rollover engine math **well-built**, prior seam fixes hold; only the milestone re-cross edge (#10) + a snapshot stale-by-one note.
- **payoff tab** — M4 per-paycheck→monthly unit conversion **consistent across all projections**; the one real bug is the double-subtract (#3) + two coherence gaps (#4, #11).
- **data/storage** — corruption/quarantine + the mark/unmark money invariant **solid**; gaps are round-trip (#5) and add/edit validation parity (#6, #12).
- **cross-cutting** — premium gating (3.1.2), App Lock security, theming/portals **healthy**.

---

## Remediation plan

**Fix in v1.6 (release-gate blockers — the 3 HIGH + 3 MED + 4 cheap LOW), each with a regression test, kept green:**
`#1` demo-import data loss · `#2` nudge gate · `#3` double-subtract · `#4` trajectory cap · `#5` backup history · `#6` goal-edit save · `#8` on-payday Calculate · `#11` avalanche tiebreaker · `#12` edit validation · `#13` import reschedule.

**Backlog (v1.7):** `#9` demo staleness · `#10` milestone re-cross · `#14` App-Lock toggle UX.

Rationale: the three HIGH are data-loss / a frozen keystone flow / money-display incorrectness — non-negotiable before submit. The three MED are user-visible correctness/data-loss. The four "cheap LOW" are low-effort and prevent bad data or a broken-CTA first impression, so they fold in now; the remaining three LOW are genuinely edge/rare and defer cleanly.
