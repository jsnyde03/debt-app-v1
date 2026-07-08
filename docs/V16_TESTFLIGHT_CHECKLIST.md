# Debt Planner v1.6 — Pre-Submit TestFlight QA Checklist

_Authored at v1.6 feature-lock (2026-07-06) per the portfolio pre-submit-TestFlight rule. **Jason runs this top-to-bottom on a real device (TestFlight build) before v1.6 is submitted for App Store review — a clean pass is a hard gate.** It covers the FULL v1.6 changed surface (Differentiation Strike), not just one milestone; native / device-only paths (which browser + Playwright can't reach) come first. Ship ONE build that validates everything (conserve Codemagic minutes)._

**Version under test:** v1.6 "Differentiation Strike" · branch `v1.6-dev` (off `release/v1`).
**Headline surface:** Plan-tab hero reposition · **Payday Autopilot** (proactive capture keystone) · **Interest-Saved Momentum Ledger** · M4 payoff-cadence correctness · + 6 pre-submit functional-audit fixes.
**Off-device gate (green before the build):** `tsc` 0 · lint 0/0 · `test:regression` all modules · e2e **128/128** × 4 device projects (CI) · `npm run build`. ✅ Verified green at lock 2026-07-06 (`validate:release`).

> **How to reach payday states on a real device:** Payday Autopilot triggers off the **real device date** vs. `nextPaycheckDate`. To test the sheet without waiting, in Plan Settings set a paycheck whose **next payday is today or 1–3 days ago** (within the recency window), Calculate, and relaunch — the sheet auto-opens. The rollover nudge appears after you capture/dismiss.

---

## 0. Native / device-only paths (HIGHEST priority — Playwright/browser cannot reach these)

- [ ] **Payday-morning notification (NEW, 1.6.5)** — with notifications enabled, on payday morning (~9am) a **"It's payday — open to confirm your plan"** local notification fires; tapping it opens the app to the auto-opened capture sheet. The paycheck-**eve** planning nudge still fires the night before.
- [ ] **Notification reschedule on rollover** — "Start Next Pay Cycle" reschedules both the eve nudge and the payday-morning prompt for the NEW cycle; no stale/duplicate notifications for the old payday.
- [ ] **Notification permission flow** — enabling the toggle triggers the OS prompt; granting schedules the nudges; denying flips the toggle back off cleanly (no crash).
- [ ] **Haptics** — capture "I followed the plan" and the **"Start Next Pay Cycle"** nudge fire a **medium** haptic; strategy pills / nav / Not-now fire **light**; system-haptics-off is respected.
- [ ] **Capture sheet as a native bottom sheet** — the payday sheet renders on the theme-safe portal (`getPortalTarget` → `main.app`), sits above the tab bar, is dismissable, and does NOT render light-in-dark (see §7).
- [ ] **StatusBar / native chrome color** — in BOTH themes the native status bar + overscroll backdrop match the app (`#07111f` dark / `#eef3f8` light); switching the in-app theme updates native chrome (single-source theming, 1.2).
- [ ] **Existing native paths still green (regression):** IAP purchase/restore from the Amortization + Pay Cycle History paywalls; App Store review prompt cadence on rollover; backup export/import via share sheet; native date pickers; pull-to-refresh. (v1.6 touched none directly, but they share the rollover/notification code paths.)

## 1. Plan-tab hero — repositioned (1.5) + debt-free states (audit fix C/D)

- [ ] **On-track state** leads with **"Here's exactly what to pay this paycheck —"** then the debt-free date as reassurance (not the headline). H1 stays "Debt Planner".
- [ ] **No paycheck entered** → hero reads **"Enter a paycheck and see exactly what to do next."**
- [ ] **Paycheck set, no debts entered** → hero reads **"Add a debt to see exactly what to pay each paycheck."** AND the "Add your first debt" card shows.
- [ ] **Debt-free (all balances cleared)** → hero reads **"You're debt-free — every balance is cleared. Keep the momentum going."** AND the "Add your first debt" card does NOT show. _(Reach by paying off the last debt via rollover.)_
- [ ] **Tight cycle (shortfall)** → hero reads "Tight cycle — protect your minimums first."

## 2. Payday Autopilot — the capture keystone (1.6)

- [ ] **Auto-open on payday** — with a payday reached (real today ≥ nextPaycheckDate) and a plan present, the sheet auto-opens on launch; it shows the recommended allocation rows + a "Total you paid".
- [ ] **One-tap "I followed the plan"** — captures every active recommended action at its recommended amount, source = paycheck; the sheet closes; the actions appear under "Completed This Cycle"; goal contributions fund their goals.
- [ ] **Adjust → per-item amount** — override a row's paid amount; the captured actual reflects the override (recommended amount preserved for drift).
- [ ] **Adjust → "paid from elsewhere" (external)** — marks the row external; it funds the goal/debt but is **excluded from this paycheck's cash total**.
- [ ] **"Not now"** dismisses without capturing; the payday is marked handled → it does NOT re-prompt on the next launch.
- [ ] **Recency window** — a payday **more than ~one cycle + a week old** does NOT auto-open the sheet (no nag for a stale/months-old payday when returning after a lapse).
- [ ] **No double-prompt** — after capture or dismiss, relaunch → the sheet stays closed for that payday.

## 3. Rollover nudge — capture→rollover loop (audit fix E)

- [ ] After capturing/dismissing a payday, a **"Start Next Pay Cycle"** nudge card appears at the top of the Plan tab (accent border).
- [ ] Tapping it rolls the cycle over (advances the plan, applies payments, fires any celebration) and the nudge disappears.
- [ ] After rollover the payday prompt **re-arms** for the next cycle (the feature is not silenced by capturing-without-rolling-over — the bug this fixes).
- [ ] The nudge does NOT appear before a payday is handled (the sheet handles that state), and there is no duplicate "Start Next Pay Cycle" button conflict with Plan Settings.

## 4. Interest-Saved Momentum Ledger (1.8) — free headline

- [ ] Payoff tab shows the card **"Paying extra saves you $X in interest and Y vs. minimum payments"** (big-number-first), for a plan with extra payment.
- [ ] **Payoff-enabling edge** — for a debt where minimums alone never clear it, the card reads the "minimum payments alone would never clear this — your plan gets you debt-free by {date}" message (not $0).
- [ ] **Free** — the card is visible without Premium (no paywall on the headline).
- [ ] Renders correctly in BOTH themes; the numbers reconcile with the payoff projection (see §6).

## 5. Payoff-cadence correctness — M4 (1.7) + audit fix A

- [ ] For a **biweekly** (or weekly) paycheck, the debt-free date and Interest-Saved figures reflect **true paychecks/month** (not an understated extra) — the date is EARLIER than the pre-fix value and matches reality.
- [ ] **Coherence across the Payoff tab** — the Interest-Saved card, the recommendation strip's "debt-free by" date, the snowball/avalanche comparison, the trajectory chart, the amortization schedule, the what-if simulator, and the forecast all use the same monthly-converted extra → **no visible contradiction** between the card and the projections below it.
- [ ] **What-if simulator** — the "Extra Monthly Payment" input is treated as a monthly amount and produces coherent months/interest-saved deltas.

## 6. Financial-accuracy spot-checks (do the math by hand on one seed)

- [ ] **Capture reconciles** — after a one-tap capture, each goal's balance increased by exactly its captured amount; "Completed This Cycle" totals match; un-marking a captured action restores the goal balance exactly (no drift).
- [ ] **Accumulate (audit fix B)** — record a **partial or external** contribution to a goal/debt earlier in the cycle, then let the engine re-recommend the remainder: on payday the sheet **shows AND captures** that remainder (it is NOT silently skipped); the goal ends at partial + remainder; a paycheck contribution and an external one to the same goal stay separate.
- [ ] **Paid-off clears to zero (audit fix F)** — pay an interest-bearing debt down to its displayed $0 and roll over: the debt is **gone** (does NOT reappear next cycle at a few dollars of residual interest) AND the **paid-off celebration fires**.
- [ ] **Interest-Saved number** — the saved-interest figure equals (minimums-only total interest − current-plan total interest) for the seed, within rounding.
- [ ] **Rollover math** — interest accrues one pay cycle (not a full month) for weekly/biweekly; minimum + snowball deduct correctly; balances never go negative.

## 7. Theming (both light + dark on every new/changed surface)

- [ ] Capture sheet, rollover nudge, Interest-Saved card, and the repositioned hero all render correctly in **dark** and **light** — **no light-in-dark / dark-in-light bleed** on any portalled overlay.
- [ ] Toggling the theme in Settings updates all of the above live (incl. native chrome, §0).

## 8. Store / compliance

- [ ] **No new paywall on basic functionality** — Payday Autopilot capture and the Interest-Saved headline are **free**; nothing that was free became gated (Guideline 3.1.2 unaffected — the only paywalls remain Amortization schedule + Pay Cycle History, unchanged).
- [ ] Version + build bumped in `ios/App/App.xcodeproj/project.pbxproj`.
- [ ] "What's New" / review notes drafted (`docs/release-notes/v1.6.md`).

---

## §E — Payday checkpoint + Autopay (NEW in the honest-completion, 2026-07-07)
_The payday↔autopay↔rollover↔partial-pay seam — the highest-risk new surface. Native-first: run on a real device._

**Autopay on the Plan tab (no-nag):**
- [ ] Mark a bill AND a debt as **Autopay** (add/edit form). On the Plan tab their Required-Actions rows show an **"Autopay"** status (blue) or **"Auto-paid"** (green, once the due date has passed) — NOT a "Mark Paid" button, and no swipe action.
- [ ] A past-due autopay bill does NOT show an "Overdue" chip and does NOT flip the hero to "overdue payments requiring attention" (it reads as handled).
- [ ] A **reported-failed** autopay (deny it at a payday checkpoint, then return to the Plan tab) reads as a manual owed bill — **"Overdue"** chip + a **"Mark Paid"** button (no "Autopay" status). Tapping **Mark Paid** clears it; it must NOT re-surface as failed after the next Start-Next-Pay-Cycle (autopay resumes).

**Payday checkpoint — bulk (happy path):**
- [ ] On payday the sheet shows a **"Required bills & minimums"** card (count + total) above the **Extra payments** list.
- [ ] Tap **"I followed the plan"** → sheet closes; every required bill + minimum is marked paid (verify on the Plan tab) AND the extras are captured.

**Payday checkpoint — [Adjust] (partial / failure):**
- [ ] Tap **Adjust** → the sheet swaps to a focused "Which bills got paid?" view (one screen, nothing pushed down / no confusing scroll). Autopay rows open **Paid · ran** (green); manual bills open **Didn't pay** (red).
- [ ] Tap a manual bill → flips to **Paid**; the "$X carries to next cycle" line updates live.
- [ ] Tap an autopay row → flips to **Didn't pay** (reporting a failed autopay).
- [ ] Tap **Done** → the required card self-adjusts ("$X paid · $Y carries") and the primary becomes **"Confirm what I paid"**; tap it → the reconciled state persists (the bill you marked paid is paid; the denied autopay stays owed).
- [ ] **Curious-tap safety:** open **Adjust**, then **Back** without toggling anything → the primary is still **"I followed the plan"** and confirming marks all bills paid (opening Adjust didn't silently flip them to unpaid).
- [ ] **Mark all paid:** in Adjust, tap **"Mark all paid"** → all rows flip to Paid, carry-forward goes to $0.

**Recommended / extras (touch-first redesign):**
- [ ] Each extra row: tap the **Paid** pill → **Skipped** (row dims, amount strikes through, "You paid" total drops, that extra is excluded from capture). Tap again → back to Paid.
- [ ] Tap an **amount** → inline editor; change it → the total updates. Tap **From savings** → chip highlights (marks it paid from outside this paycheck).

**Rollover (the overdue guarantee — Jason's Option-A gate):**
- [ ] Leave an autopay bill/minimum **untouched** (dismiss the sheet with "Not now"), then **Start Next Pay Cycle** → the autopay item ADVANCES to next cycle (due date rolls forward; its debt balance pays down); it does NOT appear as false-overdue.
- [ ] A **failed** (denied) autopay correctly carries into the new cycle as still-owed.

**Demo mode (theme fix):**
- [ ] Enter Demo Mode with the device set to **Auto/System** appearance → the app opens in the OS-matching theme (was previously forced light).

---

## Off-device release gate (must be green before shipping the build) — ✅ verified at lock

- [x] `tsc --noEmit` — 0 errors.
- [x] `npm run lint` — 0/0.
- [x] `npm run test:regression` — all modules green (incl. new suites: capture-collision/accumulate, awaiting-rollover, displayed-payoff-clears-to-0, interest-saved, payCyclesPerMonth).
- [x] `npm run test:e2e` — **128/128** across the 4 device projects (CI, fresh build).
- [x] `npm run build` — clean.
- [x] Pre-submit **functional-correctness audit** — 2 HIGH + 4 MED found & fixed (each with a regression test), 6 LOWs → backlog. _(This checklist is the device half of the release gate.)_

## Outcome

- [ ] Real-device TestFlight pass — clean, top-to-bottom.
- [ ] Submitted for review.
- [ ] Approved & released.
