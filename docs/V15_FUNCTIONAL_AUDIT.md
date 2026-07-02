# Debt Planner v1.5 — Pre-Submit Functional-Correctness Audit

**Date:** 2026-07-02
**Branch:** `v1.5-dev`
**Status:** Complete — all 5 auditors reported.

## What this is

A pre-submission audit of the *behavior* of every feature a user touches in v1.5, run with one lens:

> **Does it do what a real person would EXPECT — not what the spec/comments say, and not merely "does it run and pass tests."**

We are hunting for logic that is plausible-looking, test-passing, and still semantically **wrong**. The trigger was the Streak feature: it passed every unit + regression + e2e test, read reasonably, and was still backwards. That is the entire premise — automated tests only catch what they were built to check, and if the premise is wrong, the tests enshrine the bug.

The audit was fanned out across five domains, each to an independent auditor with free rein over the whole codebase (not just the v1.5 diff — bugs live at the seam between new and old code):

| # | Domain | Result |
|---|--------|--------|
| 1 | Payoff engine & allocation | 2 confirmed (1 ship-blocker), core logic sound |
| 2 | Rollover & date logic | 3 confirmed (1 ship-blocker) |
| 3 | Streak · milestones · history | 3 confirmed (1 ship-blocker) + full streak blast-radius; milestone engine cleared |
| 4 | Goals · bills · completion tracking | 3 confirmed (1 ship-blocker) + streak-fix foundation |
| 5 | Money math · storage · paywall · edges | 1 confirmed (1 ship-blocker), paywall/storage/rounding cleared |

**Cross-validation:** the two highest-stakes bugs were each found independently by two auditors — the interest-per-rollover defect (Auditors 1 **and** 2) and the snowball-doesn't-roll defect (Auditors 1 **and** 5). Those are not hunches.

## Verdict

**Do not submit v1.5 until the ship-blockers are fixed.** Four ship-blockers, six strong should-fixes, a set of minors (M1–M8), and ten suspected issues that need a product decision. The good news is bounded: the paywall, storage-safety, money-rounding, the payoff engine's *ordering* logic, and the milestone engine all came back clean.

---

## Ship-blockers (must fix before submit)

### S1 — A full month's interest is charged on *every* pay-cycle rollover
- **Severity:** Ship-blocker · **Found by:** Auditor 1 **and** Auditor 2 (independent)
- **Where:** `lib/debt/applyRolloverPayment.ts:28` → `lib/debt/calculateMonthlyInterest.ts:6`; driven once per rollover at `app/page.tsx:690-696`.
- **Expected vs. actual:** The tracked balance should accrue interest at the debt's APR over real time. `calculateMonthlyInterest` returns `balance × APR/12` — one *month* of interest — but it's applied on every rollover, and a rollover is one *paycheck*, not one month. The math is right; the frequency is wrong.
- **Failing scenario:** Biweekly pay (the app default), $5,000 @ 24% APR. Real ≈ $100/mo (~$1,200/yr). App applies $100 × ~2.17 rollovers/mo ≈ **$2,600/yr** (weekly ≈ 4.33×, semimonthly 2×). The in-app balance visibly exceeds the user's real statement, and it **contradicts the app's own projection**, which models interest monthly — so the advertised debt-free date is unreachable. Only monthly-paid users get correct interest.
- **Fix direction:** Accrue per cycle, not per month: `interest = balance × APR / cyclesPerYear(payCycle)` (biweekly 26, weekly 52, semimonthly 24, monthly 12). Over a year of rollovers this sums to exactly `balance × APR`, reconciling the persisted balance with the projection's monthly model. Requires threading `payCycle` into `applyRolloverPayment`.
- **Regression test:** 26 biweekly rollovers on $5,000 @ 24% (no payments) accrue ≈ $1,200, not ≈ $2,600.

### S2 — Editing a debt balance to a non-numeric value saves NaN and corrupts everything
- **Severity:** Ship-blocker · **Found by:** Auditor 5
- **Where:** `components/DebtsSection.tsx:189-196` (`saveEditing`); inputs `components/Debts/DebtRow.tsx:85-117`.
- **Expected vs. actual:** A balance typed as `12,000` (comma grouping) or a stray `.` should be parsed or rejected — never stored broken. The fields are `type="text" inputMode="decimal"`, so `Number("12,000")` → `NaN`. The only guard is `balance < 0 || … `, and **every comparison against NaN is false**, so NaN is written.
- **Blast radius:** `displayBalance` becomes NaN → the debt is in *neither* the active nor paid-off list (`getDebtsWithDisplayBalances.ts:57-58`), so it **vanishes from the UI and can't be deleted** without wiping all data; totals render **"$NaN"** app-wide (`formatCurrency.ts` has no NaN guard); on reload `JSON.stringify(NaN)` → `null`, silently destroying the real figure.
- **Fix direction:** Validate with `Number.isFinite` before save (match `GoalsSection.tsx:78` and CSV import `lib/imports/debtCsv.ts:53`, which already do). Add a defensive NaN guard in `formatCurrency`/`formatDisplayAmount` as belt-and-suspenders.
- **Regression test:** saving a debt edit with balance `"12,000"` or `"."` is rejected (no NaN persisted; debt still present and removable).

### S3 — Unaffordable required bills vanish from "Required Actions" → false "You're caught up"
- **Severity:** Ship-blocker · **Found by:** Auditor 4
- **Where:** `lib/engine/allocatePaycheck.ts:196-232` (the `if (coveredAmount > 0)` gate); `components/ResultsSection.tsx:158-164` (list derived only from `result.allocations`), `:989-992` (success empty state). The engine returns `unfundedRequiredItems` but **the UI renders it nowhere**.
- **Expected vs. actual:** Every unpaid required bill/minimum due this cycle should appear — *especially* when money is tight. Instead, once the paycheck is exhausted, each further unpaid required item is routed only to the never-rendered `unfundedRequiredItems`, so it disappears from the list and the count pill.
- **Failing scenario:** Paycheck $500, reserve $600 (remaining seeded at 0). Rent $2,000 + Electric $100 both unpaid → both get `coveredAmount = 0` → neither enters the list → the dashboard shows the green **"You're caught up for this paycheck. No unpaid required actions remain."** while the user actually owes $2,100.
- **Fix direction:** Render `unfundedRequiredItems` in the Required Actions list (visually distinct as "can't cover this cycle"), and gate the "caught up" empty state on unfunded-count too.
- **Regression test:** with a paycheck smaller than required obligations, the unpaid required items appear in the list and the "caught up" state does **not** show.

### S4 — Streak rewards optional extras, ignores required obligations, and credits a do-nothing shortfall cycle
- **Severity:** Ship-blocker · **Found by:** all four reporting auditors (the archetype)
- **Where:** `lib/debt/computeStreak.ts:7-10`; fed by `lib/history/buildCycleSnapshot.ts:40-46` and `app/page.tsx:669-686`. Badge at `app/page.tsx:259,929-938`.
- **Expected vs. actual:** A "cycles on plan" streak should reflect meeting **required** obligations (bills + minimums). Instead `isCycleOnPlan = totalPaidThisCycle >= recommendedThisCycle`, where both sides are built only from *recommended* extras (snowball + emergency + optional-goal). So a user who paid every bill but skipped one optional snowball **loses their streak**, while — worse — a shortfall cycle where the plan recommended nothing (`recommendedThisCycle === 0`) satisfies `0 >= 0` and **credits a user who paid nothing at all.** The streak literally rewards failure in the case that matters most.
- **Fix direction (decided):** On-plan = **completed every required action the user could AFFORD this cycle** (shortfall on genuinely unaffordable required items is forgiven; skipping an affordable required item is not). Autopay required items count as auto-completed. See the Streak-Fix Foundation section for the exact data sources. This is fixed **now, pre-launch** — the streak is new in v1.5, so no user has streak history yet and there is zero migration cost; after launch this becomes a migration + broken-streak problem.
- **Regression test:** (a) all required paid, zero recommended → on-plan = true; (b) all required paid except one *affordable* one → false; (c) shortfall cycle, user completed everything affordable → true; (d) shortfall cycle, user paid nothing → **false** (no more free credit).

---

## Should-fix (strong — recommend folding into the same batch)

### F1 — End-of-month due dates skip a month and drift
- **Found by:** Auditor 2 · **Where:** `lib/recurrence/rolloverPayCycle.ts:18-25` (`addMonths` uses raw `setMonth`, no clamp).
- A bill due **Jan 31** advances to **Mar 3** — February is skipped entirely, so in a bill-*reminder* app the user is never reminded to pay it that month. Same for the 30th (Jan 30 → Mar 2) and Feb-29 annuals. `getNextPaycheckDate` already clamps correctly (`clampDay`); the due-date path doesn't — an isolated oversight.
- **Fix:** apply the same `clampDay` logic. **Test:** monthly item due 2026-01-31 advances to 2026-02-28, then 2026-03-31.

### F2 — Paid one-time expenses resurrect every cycle and re-eat the budget
- **Found by:** Auditor 2 · **Where:** `lib/recurrence/rolloverPayCycle.ts:75-80` resets a one-time item to unpaid with its old due date; `app/page.tsx:744-746` applies no one-time filter.
- A one-time "Registration $200," once paid, returns next cycle as unpaid + overdue and re-consumes $200 **every cycle forever**. The projection (`buildMultiCycleTimeline.ts:85-88`) correctly drops it — so projection and reality disagree.
- **Fix:** drop paid one-time expenses on rollover (match the timeline). **Test:** a paid one-time expense is absent after rollover.

### F3 — Snowball/avalanche projection never rolls freed-up minimums (mislabels the strategy)
- **Found by:** Auditor 1 **and** Auditor 5 · **Where:** `lib/debt/projectDebtPayoff.ts:136`, `lib/debt/buildPayoffTrajectory.ts:40,43-48`.
- The defining mechanic of snowball/avalanche is that a cleared debt's minimum **rolls onto the next debt**, keeping total outflow constant and accelerating payoff. Here the freed minimum just disappears, so outflow *decreases* over time. Errs **pessimistic** (payoff date later than reality — under-promises, so not dangerous), but the headline "debt-free by ‹date›" is systematically wrong and the strategy label is inaccurate.
- **Fix:** on payoff, add the freed `min(minimumPayment, …)` to the extra applied to the next target. **Test:** two-debt snowball projection reflects the freed minimum rolling forward (earlier payoff than the current fixed-extra model).

### F4 — "Required $X" total/count understate the true obligation on tight cycles
- **Found by:** Auditor 4 · **Where:** `lib/engine/allocatePaycheck.ts:196-216` (partial allocation carries `coveredAmount`), `components/ResultsSection.tsx:304-307`.
- Same root cause as S3: when a bill is partially fundable, the summary sums the *partial* covered amount, so "Required $500.00" shows for a $2,000 rent. And marking that partial card paid flips the whole $2,000 expense to paid (`useRequiredExpenses.ts:94-109`). `flexibleCashAvailable` inconsistently uses the *full* `result.totalRequired`, so the two figures disagree.
- **Fix:** fold into the S3 fix — surface full obligations; don't record a partial card as full payment. **Test:** tight cycle shows the full required total, not the funded partial.

### F5 — History "$X paid" undercounts real payments (excludes minimums, includes savings)
- **Found by:** Auditor 3 · **Where:** `components/HistorySection.tsx:120-124` reading `snapshot.totalPaidThisCycle` (`buildCycleSnapshot.ts:40-45`).
- A history row labeled "**$X paid**" reads as money put toward debt that cycle. But `totalPaidThisCycle` sums only `completedRecommendedActions` — it **excludes** every required debt-minimum and bill payment (those flow through `applyRolloverPayment`, never into `completedRecommendedActions`) and **includes** emergency-fund / optional-goal *savings* (not debt payments). A user who pays $500 in minimums + a $200 snowball sees "**$200 paid**"; a user who saves $300 to a vacation goal sees "$300 paid" as if toward debt.
- **Fix:** reconcile in the same pass as S4 — "$X paid" should reflect actual debt payments (minimums + extras), with savings shown separately or relabeled. **Test:** a cycle with $500 minimums + $200 extra shows the true paid figure, not $200.

### F6 — False "Debt free!" celebration for users whose legacy debts lack `originalBalance`
- **Found by:** Auditor 3 · **Where:** `lib/debt/computeMilestones.ts:52-55,84-86`.
- Only debts with `originalBalance > 0` are "trackable"; `originalBalance` is optional (`storage.ts:28`), set only on new-debt creation + CSV import, with **no load-time backfill migration**. `allDebtsPaidOff = trackable.every(paid)`, so a debt without `originalBalance` is excluded from the debt-free check *and* can never earn a milestone.
- **Failing scenario:** a user upgrading from an older version has a saved debt with no `originalBalance`, then adds and pays off a new debt → `trackable.every(paid)` is true → **"Debt free!" confetti fires while the legacy debt is still owed.** (Impact scales with how many users carry pre-`originalBalance` debts — check when the field was introduced relative to the live 1.4 build.)
- **Fix:** backfill `originalBalance ??= balance` at load (a one-time migration), so all existing debts are trackable. **Test:** a debt loaded without `originalBalance` is trackable; debt-free fires only when *all* debts (incl. legacy) are paid.

---

## Minor (fix opportunistically / can defer to v1.6)

| ID | Issue | Where | Note |
|----|-------|-------|------|
| M1 | 13 identical `roundMoney` copies | across `lib/` + `components/` (see Auditor 5 list) | **No correctness bug** — all byte-identical, no penny drift. DRY chore; consolidate to `lib/utils/money.ts`. |
| M2 | Trajectory neg-amortization guard uses post-interest balance, disagrees with engine | `lib/debt/buildPayoffTrajectory.ts:39-41` vs `projectDebtPayoff.ts:54` | Chart breaks early on a razor-thin payable/unpayable boundary. |
| M3 | `totalInterestPaid: 0` overloaded to mean "unpayable" → suppresses avalanche insight | `projectDebtPayoff.ts:99,182`, `lib/insights/buildSmartInsights.ts:104` | Hides the "avalanche saves interest" insight exactly when avalanche is the only viable plan. |
| M4 | `cycleMultiplier` understates non-monthly extra ~8% | `app/page.tsx:330` (biweekly ×2 vs 2.17) | Nudges projected payoff pessimistic. |
| M5 | `snowballPaidThisCycle` is a dead flag | `useDebts.ts:106,171` etc.; read nowhere | Trap for maintainers/the streak fix — don't build on it. |
| M6 | Autopay required items need a manual tap to count complete | `ResultsSection.tsx:494-510` | The streak fix must treat autopay required items as auto-completed or it unfairly punishes autopay users (folded into S4). |
| M7 | `BYPASS_REVENUECAT === ""` fragile predicate | `lib/subscription/revenueCat.ts:5` | Harmless (fails closed) but confusing; normalize to `"1"`. |
| M8 | Goal-cap can break the streak for a maxed-out goal | `app/page.tsx:507` | Second-order symptom of the wrong signal; **moot once S4 lands.** |

---

## Suspected — need a product decision (not yet confirmed bugs)

- **Q1 — Timezone off-by-one for non-US users.** Dates are built at local midnight but stringified via UTC (`toISOString().slice(0,10)`). In any positive UTC offset (Europe/Asia/Australia), every computed paycheck/due date lands one day early. US (negative offsets) is safe — likely why it's unnoticed. `getNextPaycheckDate.ts:11-17`, `rolloverPayCycle.ts:3-9`. **Decision:** is the target market US-only for v1.5? If not, this is a real off-by-one.
- **Q2 — Reset-to-Today leaves restored due dates stale.** `app/page.tsx:555-580` restores the snapshot verbatim without rolling due dates to today; an old snapshot shows overdue bills. Possibly intended ("restore exactly what was safe") — confirm.
- **Q3 — Multi-cycle catch-up re-applies interest per rollover.** Opening the app after missing several paychecks requires repeated rollovers, each re-applying interest (compounded by S1). Confirm the intended catch-up UX.
- **Q4 — Multi-cycle timeline shows balances that never shrink.** `buildMultiCycleTimeline.ts` re-runs allocation on `rolloverDebts` output, which never reduces `balance`. Labeled a cash-cushion preview, so maybe acceptable — but a user watching a 3-cycle preview expects debt to fall.
- **Q5 — Overpaid snowball excess is dropped, not cascaded.** `applyRolloverPayment.ts:43` floors at 0; excess over a debt's balance is lost rather than applied to the next debt. Hard to hit (allocations cap at balance) — worth a boundary test.
- **Q6 — Living-expense reserve is taken off the top before named required expenses.** `allocatePaycheck.ts:150-152` effectively prioritizes groceries/gas over rent in a shortfall. Defensible; confirm against intended prioritization.
- **Q7 — External recommended payments inflate the streak paid total.** `buildCycleSnapshot.ts:40-45` includes `paymentSource === "external"`; the cash math (`ResultsSection.tsx:309`) excludes it. Inconsistent — resolve alongside S4.
- **Q8 — Streak keeps incrementing after debt-free.** Once all debts are paid, each empty rollover has `recommended = 0` and `paid = 0` → trivially "on plan," so the flame keeps growing on cycles where there's nothing to do. Likely harmless, but the number becomes meaningless post-payoff. (Under the S4 required-basis, an empty required set is vacuously on-plan — decide whether post-payoff cycles should count at all.)
- **Q9 — Editing a debt balance upward yields negative progress %.** `handleUpdateDebt` (`useDebts.ts:123-134`) never updates `originalBalance`; raising `balance` (correcting a typo / adding a charge) makes `progressPercent < 0` against a now-too-low anchor. No milestone misfire (negative progress can't cross upward), but confirm the per-debt progress display (`DebtRow.tsx:265`) clamps.
- **Q10 — `recommendedThisCycle` reads live `result?.allocations` at rollover** while `totalPaidThisCycle` reads stored actions; if `result` is stale/null at rollover, `recommendedThisCycle` is 0 and the cycle passes trivially. Mostly moot after S4, but confirm `result` is fresh when `handleRolloverPayCycle` runs (the new required computation depends on it too).

---

## Cleared (verified correct — worth knowing before submit)

- **Paywall: SAFE.** The mock-subscription seam is gated on `NODE_ENV==="development" || NEXT_PUBLIC_E2E==="1"`; the flag is set only by the e2e/CI harness, never by the iOS/codemagic build, so the branch is unreachable and dead-code-eliminated in the shipped app. RevenueCat fails **closed** to "free." Users cannot fake premium via localStorage. (`lib/hooks/useSubscription.ts:25-40`, `lib/subscription/revenueCat.ts`.)
- **Storage safety: sound.** Corrupt reads are quarantined *before* the fallback returns; write-back is skipped while status is "corrupt" so a bad byte never overwrites the recoverable original; one bad key doesn't destroy siblings; SSR/privacy modes fail to fallback (no white-screen). (`lib/storage/safeStorage.ts`, `usePersistedState.ts`.)
- **Money rounding: no drift.** All 13 `roundMoney` copies are byte-identical (`Math.round(x*100)/100`); the streak comparison rounds both sides identically — no penny-drift false breaks.
- **Payoff engine ordering: correct.** Snowball → smallest balance; avalanche → highest APR with smallest-balance tie-break; `min(minimum, balance)` clamping everywhere; required funded before all extras.
- **Paycheck-date math: correct.** Semimonthly candidate selection and monthly `clampDay` end-of-month + leap handling in `getNextPaycheckDate` verified across month boundaries.
- **Snapshot timing: correct.** Milestone detection and the cycle snapshot are built from PRE-rollover state as intended.

---

## Streak-Fix Foundation (verified data sources for the S4 rewrite)

From Auditor 4 — build the required-based, shortfall-forgiving streak on these, not on assumptions:

- **(a) The required set for a cycle** = the engine's `upcomingExpenses` (`allocatePaycheck.ts:99-105`) + `upcomingMinimums` (`:107-113`), i.e. items where `dueDate < nextPaycheckDate` (overdue included; no lower bound). **Do NOT** derive it from `result.allocations` / `ResultsSection.requiredActions` — per S3 that list silently drops fully-unfunded items.
- **(b) Completion** = bill `RequiredExpense.isPaidThisCycle`; debt minimum `debt.minimumPaidThisCycle ?? debt.isPaidThisCycle ?? false`. Both reset every rollover (`rolloverPayCycle.ts:66-119`). Ignore `snowballPaidThisCycle` (dead — M5).
- **(c) Affordable vs. shortfall** = affordable items land in `allocations`; unaffordable land in `unfundedRequiredItems`; aggregate `shortfall = max(0, unpaidRequiredTotal − remaining)` (`allocatePaycheck.ts:162-170`). Per-item attribution is earliest-due-first (aggregate correct, which *specific* item is deemed unaffordable is order-dependent). There is **no persisted `affordable` boolean** — derive it from the engine output at snapshot time.
- **Traps:** treat autopay required items as auto-completed (M6); resolve external-payment inconsistency (Q7).

**Snapshot schema change:** `buildCycleSnapshot` should record whether all *affordable required* actions were completed (a derived boolean), replacing the reliance on `recommendedThisCycle`. Since the streak is new in v1.5, no persisted history uses the old field yet — no migration needed if changed before launch.

---

## Streak rewrite — full blast-radius (Auditor #3)

Every site a correct required-based, shortfall-forgiving streak must touch:

1. **`lib/debt/computeStreak.ts:7-10`** — the `isCycleOnPlan` predicate itself.
2. **`lib/history/buildCycleSnapshot.ts:20-49`** — input **signature + body**: it currently receives neither `requiredExpenses` nor a summary of the debts' `minimumPaidThisCycle`/`isPaidThisCycle`; it must capture required-completion.
3. **`lib/storage/debtPlannerStorage.ts:77-89`** — the `PayCycleSnapshot` type: add required-completion field(s); keep a legacy default.
4. **`app/page.tsx:669-686`** — the rollover handler: compute/pass required-completion from `requiredExpenses` + `debts` **pre-rollover (before flags clear)** instead of `recommendedThisCycle`.
5. **`app/page.tsx:259` & `:929-939`** — the `computeStreak` call site + the "cycles on plan in a row" label semantics.
6. **`components/HistorySection.tsx:120-124`** — the "$X paid" label (finding F5) — reconcile in the same pass.
7. **Legacy back-compat** — old snapshots lack the new field → default to **on-plan** so the fix doesn't retroactively zero existing users' streaks. (The streak is new in v1.5, so in practice there's little/no live history yet — but keep the guard.)
8. **Affordability signal** — the "could afford" clause needs the engine's fundable-this-cycle data (`allocations` vs `unfundedRequiredItems`), not just the false flags.
9. **Source-of-truth signals** (exist, unused by streak today): `RequiredExpense.isPaidThisCycle`, `Debt.minimumPaidThisCycle ?? isPaidThisCycle`.
10. **Tests to REWRITE, not extend:** `lib/debt/testComputeStreak.ts` + `lib/testing/testPayCycleHistoryRegression.ts` — they encode the wrong semantics and currently lock the bug in.

## Milestone engine — verified correct (Auditor #3)

- **One-time firing:** `computeMilestones.ts:65-67` (`previous < t && current >= t`) — once crossed, next cycle's `previousBalance` is already ≥ t, so it will not re-fire while still above the threshold. Correct.
- **No celebration on backslide** — a grown balance never satisfies the upward crossing. Correct.
- **Celebration priority picker** (`page.tsx:715-742`): debt-free → paid-off → highest progress. Correct single-most-significant selection.
- **Debt-free doesn't re-fire** — `someOwedBefore` is false after payoff. Correct.
- **Streak off-by-one** — the in-progress cycle is only added at rollover, so `computeStreak` counts completed cycles only. Correct.

---

## Remediation plan

**Recommended pre-submit batch (ship-blockers + strong should-fixes), all with regression tests, e2e kept green:**
S1 interest cadence · S2 NaN guard · S3 unfunded-required surfacing (+ F4) · S4 streak rewrite (per the decided design, + F5 history "$X paid" reconcile) · F1 EOM clamp · F2 one-time drop · F3 freed-minimum roll · F6 `originalBalance` backfill (kills the false "Debt free!").

**Defer to v1.6 (file to MASTER_PLAN §9 Deferred backlog):** M1 roundMoney consolidation, M2–M5, M7, M8. **Product decisions needed (Q1–Q10)** — resolve Q1 (market/timezone) and Q7 (external-payment) before/with S4; the rest can be logged as decisions.

**Sequencing note:** S1, F2, F3 all reduce to the same root truth surfaced by the audit — *the persisted state drifted from the (correct) projection model.* Fixing them together keeps the two in agreement. S4 + F5 share `totalPaidThisCycle`/the snapshot schema, so they land as one change (see the blast-radius). F6 is a self-contained load-time migration.

---

## This audit is a release gate

Per the portfolio working agreement (`feedback_presubmit_functional_audit`), **no version submits until it passes a whole-surface "does it do what it SHOULD, not what the spec says" functional audit** — real-user lens over spec, whole-codebase scope, adversarial multi-agent fan-out, findings verified and remediated in-context with regression tests. This document is v1.5's instance of that gate.

**The audit↔regression ratchet:** every confirmed finding here ships with a regression test encoding the *corrected* behavior, so this class of bug can never recur silently and regression coverage climbs toward the audit level version over version. An audit finding is not "done" until its corrected expectation is a committed test.
