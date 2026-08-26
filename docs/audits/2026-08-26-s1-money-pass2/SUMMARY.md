# S1 · MONEY — pass 2. **3 blockers · 6 majors · 12 minors.**

**Pinned:** `4b58d75`, branch `v1.7-dev`. Four fresh auditors ([D68]), brief at [`BRIEF.md`](BRIEF.md).
**No auditor touched a source file** — `git status` showed only the four report files.

⛔ **THIS FILE IS THE MAP. THE FOUR `{A,B,C,D}-*.md` FILES ARE THE LEDGER.** Every row below was counted
from the report files, not from an auditor's own summary — a prior round's summary said *"9 open"* where
its auditor files held **14**, and the plan carried the wrong number for a day.

⛔ **S1 DOES NOT CONVERGE.** [D65] exits on 0 blockers / 0 majors **twice consecutively**; pass 2 resets the
consecutive count to zero. Pass 3 is the first candidate.

---

## ⭐ THE HEADLINE IS WHAT HELD, NOT WHAT BROKE

**Auditor A issued 23 verdicts — S0's five and pass 1's eighteen — and 22 came back `CLOSED`.**

| | |
|---|---|
| `REVERIFY4-1` `-3` `-4` `-5` | **CLOSED** *(`-2` `CLOSED-UNPINNED`, caveat measurably NARROWER than pass 1 recorded)* |
| `B1` `B2` `B3` `B4` `B5` | **CLOSED** |
| `M5`–`M10` · `M1`–`M4` | **CLOSED**, all ten |
| `AS-1` `AS-2` | **CLOSED** |
| `AS-3` | **PARTIAL · major** — the stated defect is gone; the remedy over-matched |

🎯 2026-08-26, on this result: *"Look at how much held from the last pass's fix, so one regression… I'd
consider that acceptable. It needs to be fixed but the system is definitely doing its job."*

⚡ **And D re-measured the fixes adversarially rather than reading them:** B5 closed on 8 shortfall shapes
with both genuine *"caught up"* states preserved · M4 conserves on 13 shapes, **including the
`billsReserve`-in-a-shortfall case D predicted would break it and then measured cannot occur** · M3's
branch survives hysteresis and moves no covered cycle.

---

## 🔴 BLOCKERS — 3. **All three are ONE SHAPE.**

⚡ **B1's rule — *never state a number about money the app could not read* — was wired to a SUBSET of
claim sites and a SUBSET of fields, and there are more of both.** That is C's observation and it is the
most useful sentence in this round.

| # | finding | src |
|---|---|---|
| **C2** | **A goal whose `currentAmount` could not be read prints *"$1,000.00 left"*** with no caption, under a hero saying *"33% funded"*. Both `money.tsx` goals consumers narrowed the guard to `targetAmount === 0`; `trustSelectors`' own docblock says **both sides** of `currentAmount >= targetAmount` repair to 0. ⚠️ The fixture in `goal-row-saved.spec.ts` pins only the field that works | C-2 |
| **C3** | **The full-screen debt-free FINALE is gated on `celebration?.kind === 'finale'` and nothing else.** Measured on one store at one instant: `planState = debt-free-unverified` (the banner correctly refuses) while the finale prints *"$12,400 paid off · 2 debts"* over a $12,000 card the app could not read. **B1's owner was wired to three claim sites and not the fourth** | C-3 |
| **C4** | **A debt whose `minimumPayment` repaired to `0` vanishes from the plan** — no allocation row, no unfunded item — so `countOutstandingRequired` honestly returns 0 and Today renders **B5's exact sentence**, *"You're caught up for this paycheck."*, in success green over an unpaid $5,000 card. ⛔ **B5's remedy is intact; the arrays handed to it are wrong.** Same class measured for expense `amount` and for `apr` — the latter is the import path doing exactly what `FORM_ERRORS.aprInvalid` exists to refuse on the form path | C-4 |

---

## 🟠 MAJORS — 6

| # | finding | src |
|---|---|---|
| **A1** | ⚡ **`AS-3`'s remedy over-matched, and the over-match names a FALSE DOLLAR FIGURE.** A user who moved $200 at the Guardian's own suggestion and then went **$1** short is told a $20 purchase would leave them *"$20 short"*, in the same card that says the $200 *"holds your line"*, with $199 unspent. **Three reads of the same money; this range moved two of them and left `holdsLine` on the old expression.** ⛔ **Every test written for AS-3 uses `topUp 200` against `shortfall 400`** — the one member of the class where blanket-`0` and netting agree exactly | A-1 |
| **B-1** | **Seven of the 57 "guarded" entries are pinned by an identifier inside a gate script's own source, and all seven stay GREEN with the defect restored.** Measured by copying each file to temp, applying the smallest un-fix, and re-running the registry's own matcher; **three controls red**, so the greens are falsifiable. ⛔ **Three of the seven are `S1P1-M6/M7/M8` — the fixes to `check-finding-guards.ts` itself, the gate that certifies all 57.** Sharpest: deleting the *call* to `presentInCode` leaves the helper, the token and the green | B ③-1 |
| **C1** | **The trust guard has no RESET path.** `pendingDataRepairs` is never emptied, only marked `acknowledged`, and the guards ignore that flag — **by design, from A-J2-1**. Measured: retype the balance, pay everything off, reload → `hasUnreadDebtBalances` is `true` forever. The graduation banner, Money's cleared hero and the Progress trophy are permanently withheld from a user who did exactly what the repairs card asked | C-1 |
| **D2-1** | **The ONE state machine's three producers disagree, on the app's own designed path.** Premium, $2,000, rent $1,850: the card offers its own `{gap:50, topUp:50}`; after the tap the Guardian says `clear`, `selectPlanSummary` says `tight`, forecast cycle 0 says `tight`. `CashRunwayChart` defaults to the first cycle under the line — **which is cycle 0** — so "See forecast" opens on *"Tight · $50 under"*: the gap they just spent emergency-fund money to close. ⚠️ Pre-existing | D-1 |
| **D2-2** | ⛔ **A REGRESSION [B3]'s fix introduced** — the only finding in this pass where behaviour is *worse* than before. `undoTightTopUp('affordability')` removes the source's whole accumulated entry while the card's message comes from `useState`: $50 cover → relaunch → $30 cover → Undo returns **$80** and silently un-covers the first purchase. At `bc29dfe` the old negative-apply reversed exactly $30 | D-2 |
| **D2-3** | **The only test of the no-paycheck Today is one bare `toHaveCount(0)`**, while its own comment claims *"no crash, no empty shell"* — which nothing asserts | D-3 |

---

## [D69] — which of these restart the count

⛔ **Exempt from the count is NOT exempt from the fix** ([D65] — no deferrals). Applied **mechanically**
from `scripts/surface-coverage.s1.json` / `.s0.json`, never from an auditor's judgement:

| finding | file's claim | counts? |
|---|---|---|
| **A1** | `guardianSelectors.ts` `r17,s1p1` | ⛔ **COUNTS** |
| **B-1** | `check-finding-guards.ts` `never,s1p1` *(S0)* | ⛔ **COUNTS** |
| **C2** | `money.tsx` `r10,s1p1` | ⛔ **COUNTS** |
| **C4** | `migrations.ts` `r10` | ⛔ **COUNTS** |
| **C1** | `trustSelectors.ts` `never` | first-look |
| **C3** | `celebrationSelectors.ts` `never` | first-look |
| **D2-2** | `topUpSelectors.ts` `never` | first-look |
| **D2-3** | `guardian.spec.ts` `never` | first-look |
| **D2-1** | `buildMultiCycleTimeline.ts` — ⛔ **OFF-SURFACE** | *see below* |

**4 count as churn; 4 are coverage; 1 is unclassifiable and that is itself a finding.**

🔴 **`packages/core/timeline` is on NO surface.** S1's roots carry `packages/core/engine` and
`packages/core/guardian` and stop there — so the forecast module that **D2-1 is about** was invisible to
the pass reporting on it. ⛔ **Third instance of one shape**: M9 (hand-named files inside `roots`), [D73]
(the whole test tree), and now a sibling directory whose neighbours are roots. → folded into S1.9.

---

## ⛔ WHAT THIS PASS SAYS ABOUT THE INSTRUMENTS

⚡ **B-1 and the `core/timeline` gap are the same failure at two levels** — *an instrument reporting green
while doing less than it claims*, which is the S0 shape this whole cluster was built to end. One says the
gate certifying 57 guards cannot certify its own three fixes; the other says the surface list omits a file
the pass's sharpest major is about.

⚠️ **Two facts that are not findings and must not be lost.** **CI has not run since `78c6020`**, so M1–M4's
four e2e guards had **never been executed by anything** until auditor B ran them by hand *(12 passed)*.
And both S0 caveats survive: `REVERIFY4-3`'s guard **prints, it does not red**, and `REVERIFY4-2` is still
unpinned — though M7 narrowed it, which A measured rather than assumed.

⚠️ **The brief's own fix range was wrong and A corrected it:** `78c6020..4b58d75` holds only M1–M4 + AS-1/2/3.
The range covering pass 1's fifteen is **`dedda70..4b58d75`**.
