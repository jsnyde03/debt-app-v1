# L3 — proxy gates & capped outcomes

Triaged all **93 conditional-copy rows** in `slices/L3-conditional-copy.md` (105 lines incl. header).
~30 are pure form-mode toggles (`isEdit`, `trial`, `copied`, `restoring`, `authing`) and were cleared
from the string alone. The remaining ~60 were followed into source; **24 files opened**.

⚠️ **Prior art matters here.** `selectTightTopUp`, `selectAffordability.coverFromSavings`,
`selectAppliedTopUp` and `selectExpenseReserveOffer` have ALREADY been hardened against this exact
class (3.7.A3.6 / A3.3 / MF.5) — each now returns an explicit `holdsLine` / `coversRecommendation`
honesty flag, and each UI consumer branches on it. Those are **clean**, and I verified the consumers
branch rather than merely receiving the flag. The findings below are what the hardening pass
did **not** reach.

### L3-1 · "your emergency fund tops back up" fires when the money came from a savings goal
- **Severity:** major
- **Class:** proxy-gate
- **Copy:** "Nothing extra goes out this paycheck, and **your emergency fund** tops back up as your cushion rebuilds." (`buildGuardianBrief.ts:298`, under title "Your line's held")
- **Gate actually checked:** `input.toppedUp` — `packages/core/guardian/buildGuardianBrief.ts:294`, fed by `toppedUp: topUp > 0` at `apps/rn/src/store/guardianSelectors.ts:599`, where `topUp = appliedTopUp(store)` is just "a `cycleTopUp` amount is recorded for this cycle". It establishes **that** a top-up happened, never **which pot** it drained.
- **The gap:** `selectTightTopUp` (`guardianSelectors.ts:294–295`) *prefers* a savings goal and only falls back to the emergency fund: `funded.find(g => g.type === 'savings') ?? funded.find(g => g.type === 'emergency')`. So the **modal** source is NOT the EF. Concrete: `goals = [{name:'Vacation', type:'savings', currentAmount: 300}]` and **no emergency goal at all**; tight cycle, floor $200, cushion $130 → gap $70 → $70 drawn from Vacation. The card then tells a user who has never created an emergency fund that "your emergency fund tops back up". The sibling control two lines away already got this right — 3.7.A3.3 [D24] added `isEmergencyFund` precisely because the *button* said "from savings" when the source was the EF. The **confirmation** carries the same bug pointed the other way, and the flag needed to fix it (`TightTopUp.isEmergencyFund`, `guardianSelectors.ts:301`) already exists but is not passed into the brief.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** thread the source into the brief (or reuse `selectAppliedTopUp().goalName`) and say "your savings" / the goal's own name unless the source really was the EF.

### L3-2 · "tops back up as your cushion rebuilds" promises a refill that the tight case cannot deliver
- **Severity:** major
- **Class:** capped-outcome
- **Copy:** "…tops back up **as your cushion rebuilds**." (`buildGuardianBrief.ts:298`)
- **Gate actually checked:** nothing — the clause is unconditional inside the `input.toppedUp` branch (`buildGuardianBrief.ts:294`). The mechanism it leans on is stated at `apps/rn/src/store/store.ts:592`: *"The plan refills the goal next cycle via the waterfall, so this self-corrects."*
- **The gap:** the waterfall's goal rung is bounded by leftover cash — `const amount = roundMoney(Math.min(remaining, needed, pace))` (`packages/core/engine/allocatePaycheck.ts:619`). A user only sees this affordance **because they were tight**, i.e. `discretionary < floor`. Concrete: floor $200, discretionary $130 every cycle (stable income, stable bills). Cycle 1: draw $70 from Vacation ($300 → $230), copy promises it tops back up. Cycle 2 is identically tight → the waterfall reaches the goals rung with `remaining = 0` → **$0 returns to Vacation**, and the same offer appears again, draining it a second time. Repeat and the goal is emptied by an affordance that promised each time that it would refill. The refill only happens for a user whose tightness was a one-off, which the gate does not check.
- **Verified:** yes-read-the-source
- **Confidence:** high — the `Math.min(remaining, …)` cap is read; I did **not** run a multi-cycle simulation, so the *rate* of drain is inferred, not measured.
- **Suggested fix:** soften to "…and your cushion rebuilds next paycheck" (drop the refill promise), or gate the clause on the plan actually projecting a surplus to that goal next cycle.

### L3-3 · the tight top-up draws from the FIRST savings goal, not one that can hold the line
- **Severity:** major
- **Class:** capped-outcome
- **Copy:** "{goal} has $10 — moving all of it over gets you to $140 of your $200 line. **It won't close the gap**, but it narrows it." (`PaydayGuardianCard.tsx:352`) and, on the affordability card, "Move $10 from {goal} & apply" → "…it narrows the dip but **doesn't hold your line**." (`AffordabilityCard.tsx:214`, `:124`)
- **Gate actually checked:** `guardianSelectors.ts:294–295` `funded.find(g => g.type === 'savings') ?? funded.find(g => g.type === 'emergency')`, and `guardianSelectors.ts:394` `store.goals.find(g => g.type === 'savings' && g.currentAmount > 0)`. Both are bare `find` — **first match in store order**, with no regard for whether that pot can cover the gap. The draw is then capped: `Math.min(gap, goal.currentAmount)` (`:297`, `:395`).
- **The gap:** the `holdsLine` flag is *honest about the outcome*, but the outcome is **needlessly** capped. Concrete: `goals = [{'Vacation', savings, $10}, {'New car', savings, $800}]` (Vacation created first), floor $200, cushion $130, gap $70. The selector picks Vacation, `topUp = min(70, 10) = $10`, `holdsLine = false`, and the card tells the user their line **cannot** be held this paycheck — while $800 of savings sits one row down that would have held it with $70 to spare. The user is told a true thing about the wrong pot. This is the **same** defect [D24] fixed one line above for *type* preference ("this was a bare `find` … the source was whichever the user happened to create first"); the fix ordered the *categories* but left the within-category pick on creation order.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** among funded savings goals prefer one with `currentAmount >= gap` (largest-balance tiebreak) before falling back to the largest available / the EF.

### L3-4 · "minimum + your extra" on a schedule that contains no extra
- **Severity:** major
- **Class:** proxy-gate
- **Copy:** "Paying $85/mo **— minimum + your extra**" (`apps/rn/src/components/entities/AmortizationView.tsx:67`)
- **Gate actually checked:** `amort.isFocus` — `apps/rn/src/store/analysisSelectors.ts:165`, `const isFocus = rankDebts(liveDebts, strategy)[0]?.id === debt.id`. That establishes only that this debt is **first in payoff order**, not that any extra reaches it.
- **The gap:** the number the sentence describes is `monthlyPayment = baseMonthly + (isFocus ? monthlyExtra : 0)` (`analysisSelectors.ts:170`), and `monthlyExtra = (steady ? selectExtraToDebt(steady) : 0) * payCyclesPerMonth(...)` (`:52`) — **legitimately 0** whenever the steady-state plan has no spare after obligations and the cushion floor. Concrete: paycheck $1,400, required bills + minimums $1,250, cushion floor $200 → `selectExtraToDebt(steady) = 0` → `monthlyExtra = 0`. Open the focus debt's payoff schedule: it reads "Paying $85/mo — minimum + your extra" over a payment that is **exactly the minimum, $85**. The user is told their extra is in there when the plan is sending none, on the one screen whose job is to show what the payment is made of. `isFocus` is the textbook correlate — it is right for every user who *has* extra, and wrong for exactly the users who don't.
- **Verified:** yes-read-the-source
- **Confidence:** high
- **Suggested fix:** branch on `monthlyExtra > 0`, not `isFocus` — e.g. `isFocus && monthlyExtra > 0 ? ' — minimum + your extra' : ' — the minimum'`.

### L3-5 · `buildSmartInsights` "Hold back $X to restore a safer $200 cushion" — the classic capped promise, unfixed
- **Severity:** minor *(would be blocker if this surface shipped — see reachability)*
- **Class:** capped-outcome
- **Copy:** "Hold back **$30** from extra payoff **to restore a safer $200 cushion**" (`packages/core/insights/buildSmartInsights.ts:57`)
- **Gate actually checked:** `projectedBuffer < 200` (`:51`) plus `amountToHold > 0` (`:57`), where `const amountToHold = Math.min(safeExtraPayment, 200 - projectedBuffer)` (`:52`).
- **The gap:** this is the **exact shape** of the shipped "hold your line" defect, in code the hardening pass never touched — a `Math.min` cap under copy that states the full outcome. Concrete: `projectedBuffer = 50`, `safeExtraPayment = 30` → `amountToHold = min(30, 150) = 30` → "Hold back $30 from extra payoff to restore a safer $200 cushion." Holding back $30 restores the cushion to **$80**. There is no `coversIt` flag and no alternate branch; whenever `safeExtraPayment < 200 - projectedBuffer` — i.e. **whenever the user is genuinely tight, the case the insight exists for** — the promise is false. Secondary: `200` is hardcoded here while the rest of the app reads `store.cushionFloor ?? 200`, so a user whose line is $400 is told to restore "a safer $200 cushion."
- **Verified:** yes-read-the-source. ⚠️ **Reachability is the caveat, and I checked it:** the only non-test consumer is the legacy Capacitor web app (`components/SnowballSection.tsx:245` ← `app/page.tsx:1268`), and `apps/rn/src/store/analysisSelectors.ts:138` records Smart Insights as *"intentionally NOT surfaced (2.2.5 scrapped, Jason 2026-07-22)"*. I did **not** confirm whether the v1.7 iOS build ships the RN app only — the gate command is `validate:release:rn`, which suggests it does.
- **Confidence:** high on the defect, medium on the severity (severity rides entirely on whether the web build ships).
- **Suggested fix:** mirror the `holdsLine` pattern — say "Hold back $30 … it gets you to $80 of a safer $200 cushion" when `safeExtraPayment < 200 - projectedBuffer`; and take the floor as a parameter instead of hardcoding 200.

### L3-6 · "Reserved each paycheck" over a total the paycheck may not contain
- **Severity:** minor
- **Class:** capped-outcome
- **Copy:** "**Reserved each paycheck** · tap to manage", rendered beside `formatCurrency(total)` (`apps/rn/src/app/(tabs)/money.tsx:864`, `:858`)
- **Gate actually checked:** `empty = total <= 0` (`money.tsx:842`), where `total = livingTotal = living.filter(l => l.enabled).reduce((s, l) => s + l.amount, 0)` (`money.tsx:527`). The gate establishes "at least one enabled everyday-spending item exists" — nothing about what the paycheck can actually hold.
- **The gap:** the engine absorbs the overflow silently: `remaining = roundMoney(Math.max(0, remaining - paidRequiredTotal - livingExpenseReserve))` (`packages/core/engine/allocatePaycheck.ts:347–349`). The `Math.max(0, …)` means an over-sized reserve is clamped **to what exists** with no record of the shortfall against the reserve itself. Concrete: paycheck $300, enabled everyday-spending items totalling $400 → the card shows "**$400** / Reserved each paycheck", `remaining` goes to `0`, and $100 of that $400 was never reserved from anything. `LivingExpense` (`packages/core/types/livingExpense.ts`) carries no cadence field, so the amount is taken as per-paycheck verbatim with no clamp anywhere between the store and the caption.
- **Verified:** yes-read-the-source
- **Confidence:** medium — the clamp and the unclamped display are both read; I did not confirm by running the app that no intermediate surface warns first.
- **Suggested fix:** clamp/flag the display against the allocation (show what was actually held, or a "more than this paycheck can hold" state) rather than the raw enabled sum.

### L3-7 · "Autopay · ran" is a presumption stated as an event, on the reconcile screen
- **Severity:** minor
- **Class:** proxy-gate
- **Copy:** "Autopay **· ran**" (`apps/rn/src/components/payday/PaydayCaptureSheet.tsx:260`), under the sheet's own subtitle "Tap to mark **what you actually paid**" (`:235`)
- **Gate actually checked:** `row.view.presumedPaid` — `packages/core/debt/deriveRequiredActionView.ts:88–98`, which is `isAutopay && !!dueDate && isAutopayPresumedPaid(...)`, i.e. **"the due date has passed and the user has not flagged it failed."** The field's own doc comment says so: *"Autopay whose due date has passed … **presumed** to have run"* (`:28–29`).
- **The gap:** a bounced autopay (NSF, expired card, cancelled mandate) that the user has not yet flagged satisfies the gate exactly. Concrete: `dueDate` = 3 days ago, `autopayFailedThisCycle` unset because the user has not opened the app since → the reconcile row asserts "Autopay · ran", and `PaydayCaptureSheet.tsx:89` seeds it `init[id] = row.view.isPaid || row.view.presumedPaid` = **paid**. The user taps the default "I followed the plan" (`:424`, that label shows precisely because nothing was adjusted) and a payment that never happened is recorded, decrementing the balance. Every other surface hedges — `deriveRequiredActionView` calls it "Auto-paid", the doc says "presumed" — this is the one place it is stated as a past event, on the one screen designed to establish ground truth.
- **Verified:** yes-read-the-source
- **Confidence:** medium — the gate and the seeding are read; I did **not** verify the write path proves the balance is decremented on capture, so that last step is inferred.
- **Suggested fix:** "Autopay · should have run" (or reuse the existing "Auto-paid" wording), and do not pre-seed presumed rows as paid on the reconcile screen specifically.

> **L3-6 second site:** the same unclamped claim appears as "Groceries, gas, fun money — **reserved
> every paycheck**" in `apps/rn/src/components/plan/SpokenForSheet.tsx:52`. One fix should cover both.

---

## Cleared on inspection (so the next pass doesn't re-open them)

These read like the class from the string alone, and are **correct** in source:

- **`selectExpenseReserveOffer` → `SpokenForSheet`** — `coversRecommendation` (`expenseReserveSelectors.ts:124`) is computed *and branched on* (`SpokenForSheet.tsx:69,74`). The capped branch quotes what the paycheck can spare, never the recommendation. Clean.
- **`selectTightTopUp` / `selectAppliedTopUp` / `selectAffordability.coverFromSavings` → `holdsLine`** — the flag exists and **every** consumer branches (`PaydayGuardianCard.tsx:350,375`; `AffordabilityCard.tsx:122,212`), including the verb on the button ("Cover" → "Move"). The *outcome copy* is clean; L3-3 is about the pot it picks, not the honesty of the flag.
- **`buildGuardianBrief` "Your line's held"** (`:294`) — I expected the `toppedUp` gate to let a **capped** top-up claim "right at your $X line". It cannot: the branch sits under `state === 'clear'`, `state = computeState(discretionary, floor, priorBand)` with `discretionary = selectDiscretionary(alloc) + topUp` (`guardianSelectors.ts:597`), and `computeState`'s hysteresis only makes `clear` **harder** to reach (`computeState.ts:44–59`). A capped draw lands `tight` and returns earlier. ⚠️ **Mechanism refuted — I had asserted it before reading `computeState`.** The `emergency fund` / refill clauses in the same branch are still wrong (L3-1, L3-2).
- **`computeReserveRelease`** (`store/payday.ts:222–233`) — `Math.min(surpriseSum, heldReserve)` under "covered". Already hardened by MF.5 and the cap is *the point*: the reserve is credited only for what it actually held.
- **`selectWindfallSplit`** (`guardianSelectors.ts:460`) → "Confirm" / "HERE'S HOW THE APP WILL ROUTE $X" — a real with-vs-without re-solve, with an explicit absorbed-remainder correction (C1) so the rows conserve every dollar. The gate `isPremium && hasSplit` is the thing the copy claims.
- **`showMinimums`** → "your plan clears faster than minimum payments" (`TrajectoryChart.tsx:289`) — gated on `interestSaved.kind === 'saving' || 'payoff-enabling'` (`:136`), and the comment confirms the no-gap case deliberately hides the ghost. The gate *is* the claim.
- **`funded`** → "Funded" (`money.tsx:914`) is `g.currentAmount >= g.targetAmount` — exact, not a proxy.
- The ~30 `isEdit` / `trial` / `copied` / `restoring` / `authing` form-mode toggles — pure UI state; the copy claims nothing about an outcome.

---

## Summary

**7 findings.**

| severity | count |
|---|---|
| blocker | 0 |
| major | 4 |
| minor | 3 |
| polish | 0 |

| class | count |
|---|---|
| proxy-gate | 3 (L3-1, L3-4, L3-7) |
| capped-outcome | 4 (L3-2, L3-3, L3-5, L3-6) |
| both | 0 |

**The pattern:** the 3.7.A3.x hardening pass fixed this class *thoroughly* wherever it looked — every
`holdsLine` / `coversRecommendation` flag is real and every consumer branches on it. What it missed is
**one step out from the flag**: the copy *around* the honest sentence (L3-1, L3-2), the *resource
selection* feeding the capped `Math.min` (L3-3), and sibling surfaces that were never in the sweep
(L3-4, L3-5, L3-7). The honesty flags are load-bearing and sound; the blast radius was under-scoped.

### The one affordance a human should check

⚡ **The Guardian's tight-case top-up — `selectTightTopUp` → `PaydayGuardianCard`.** It is the app's
only cash-moving one-tap, and it carries **three** of the seven findings at once (L3-1, L3-2, L3-3).
Set up a user with **no emergency fund**, two savings goals in creation order `[$10, $800]`, and a
cushion $70 under their line. The card will (a) draw from the **$10** pot, (b) tell them their line
**cannot** be held — while $800 sits one row down that would hold it — and (c) once applied, tell them
"**your emergency fund** tops back up as your cushion rebuilds", naming a fund they do not have and
promising a refill the waterfall will not fund while they stay tight. Every individual sentence is
locally honest. The affordance as a whole is not.
