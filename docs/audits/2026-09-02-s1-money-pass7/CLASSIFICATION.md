# Pass 7 — recorded and classified

**Run:** 2026-09-02 · **Target tree:** `e5ecc7b6` (`v1.7-dev`), source-identical to the dispatch pin
`259c0177` — the two intervening commits are docs-only.
**Dispatch:** 12 fresh lane agents, two waves of six. **No sub-agents.** Heap 1536 MB, no OOM in any lane.

---

## The numbers

**137 findings · 34 `blocker` · 55 `major` · 48 `minor`.**

⭐ **Derived two independent ways that AGREE, first time in this project.** Mechanical extraction over
`^## <lane>-<n> ` headings matches all twelve lanes' self-reported counts exactly, and every lane's
`blocker+major+minor` sums to its total. **Nothing was unrated, and no lane drifted from the heading form.**
The previous round re-enumerated a class recorded as *"35 · 3 · 5 · 7-unrated"* and measured **40 · 5 · 8 ·
27** — all four numbers wrong. Stating the severity **once, in the `##` heading** is what fixed that, and it
is the cheapest instrument this audit has ever added.

| lane | subject | n | blocker | major | minor | files read |
|---|---|---|---|---|---|---|
| **A1** | the spec tree | 13 | 1 | 8 | 4 | 71 *(68/68)* |
| **A2** | the debt engine | 10 | 3 | 2 | 5 | 55 *(55/55)* |
| **A3** | cashflow · forecast · guardian · recurrence | 15 | 3 | 6 | 6 | 82 *(79/79)* |
| **B1** | the selectors | 7 | 4 | 3 | 0 | 53 *(40/40)* |
| **B2** | the store core | 7 | 2 | 2 | 3 | 64 *(51/51)* |
| **B3** | storage · backup · formatting · dates | 10 | 4 | 3 | 3 | 76 *(64/64)* |
| **C1** | the plan cards | 14 | 5 | 2 | 7 | 71 *(52/52)* |
| **C2** | the rest of the components | 11 | 3 | 1 | 7 | 83 *(72/72)* |
| **C3** | routes + the surfaces outside the app | 15 | 8 | 5 | 2 | 78 *(75/75)* |
| **D1** | the gates and the suites | 19 | 0 | 17 | 2 | 32 *(31/31)* |
| **D2** | the proof machinery | 12 | 1 | 5 | 6 | 44 *(40/40)* |
| **D3** | the legacy Next root *(reduced mandate)* | 4 | 0 | 1 | 3 | 36 *(12/12)* |
| | | **137** | **34** | **55** | **48** | **639/639 routed** |

### The exit — GREEN in one wave, again

```
✅ lint:s1-coverage: 495 surface files classified · 0 unswept.
✅ pass-coverage [s1 · s1p7]: all 457 money-bearing file(s) read;
   38 classified as carrying no money vocabulary (on the surface, not pruned).
```

⭐ **Every lane read its ENTIRE manifest.** 639/639 routed files, 457/457 exit-bearing. Passes 4 and 5 read
**103** and **86** of ~446; pass 6 was the first to hit its own exit, and pass 7 repeats it at a **45% larger
route** — which retires "the lanes read about a third" as a live risk. ⚠️ **`0 unswept` on the surface
inventory is a first.**

### Origin split — the forecast held

⚡ **`fix-churn` and `instrument` are 23% of the route and carry the round.** Written on the plan before
dispatch: *"pass 7 will find the FIXES' own defects — every prior round did, and this one shipped two new
gates and 14 guards of its own to be wrong about."* Measured: **C1's blockers are 5 of 5 `fix-churn`** ·
C3's `fix-churn` is 15% of its files and **60% of its findings** · B3's is 5 of 10 · C2's is 11% of files
and 27% of findings including 2 of 3 blockers. ⛔ **This is the sixth consecutive round in which the
previous round's repairs were the highest-yield place to look.**

---

## ⛔ IDS COLLIDE ACROSS PASSES — READ THIS BEFORE RESOLVING ANY ID

⚠️ **Pass 6 and pass 7 use the same lane letters, so the same id names two different findings.** `A3-1`,
`A2-1`, `C3-1`, `C2-1`, `C2-3`, `C3-5`, `C3-10`, `C3-12`, `B3-1`, `B3-3`, `B2-5`, `A1-6`, `A2-8` and `D3-2`
are **each a live pass-7 finding AND a closed pass-6 finding cited as the cause of one.** Caught mechanically
while verifying this file's own membership: a naive extraction resolved 16 ids to the wrong pass.

⛔ **Every citation of a prior pass in this document is written as `pass-6 <id>` or `pass 6's <id>`. A bare
id ALWAYS means the pass-7 finding.** If you find a bare id that clearly refers to a closed defect, treat the
document as wrong and check the lane file — do not resolve it by guessing.

## ⛔ How this list is to be USED

**Membership below is derived from headings and is a HYPOTHESIS about grouping.** Every prior round measured
that a class's own label is unreliable — its count, its severities, and even *"unrated"*. **Re-derive each
class against the code when you open it**, and expect the membership to move. Three separate rounds found
findings whose defect a later sub-step had already closed.

**A remedy is a hypothesis; a premise is not.** Every remedy in the twelve lane files is marked *unverified*
by its author, and several lanes named the obvious fix as wrong. **More than half of pre-authored remedies
have not survived contact** in each of the last two rounds.

**One assertion per class that ITERATES the class**, never one that names the member you found.

---

## The fixing order, and why it is this order

⛔ **The instruments come first — not because they are the worst, but because every closure in this round
will be PROVEN with them.** Class 1 is six gates that miss a line-wrapped spelling of their own defect;
class 2 is a proof harness that reports `EXECUTED` over them. Fixing money first means proving the money
fixes with instruments already measured to be blind. This is `S1.12.5`'s ordering rule, and it was paid for.

| # | class | n | why here |
|---|---|---|---|
| **1** | **A matcher locked to a line** | 11 | every gate that will certify this round's fixes |
| **2** | **The proof harness and the ledger** | 9 | it reports `EXECUTED` over class 1 |
| **3** | **The audit's own populations** | 7 | pass 8 is routed by these |
| **4** | **The double-scaled in-window minimum** | 11 | the round's money root, found by two lanes |
| **5** | **May a surface state a PROJECTED figure?** | 13 | 11 blockers, one question, five answers |
| **6** | **Money written or destroyed** | 12 | data loss and unrecoverable state |
| **7** | **The sub-cycle cadence class** | 5 | unbounded reserve growth |
| **8** | **The fix reached the member, not the class** | 12 | the residue of pass 6's remedies |
| **9** | **A check that cannot fail** | 21 | fixed LAST among instruments — they re-verify everything |
| **10** | **Carried premises and stale comments** | 20 | swept inline when a class has the file open |
| **11** | **Copy, a11y and form polish** | 17 | swept inline |
| **12** | **The legacy root and `P6.11`** | 4 | routes to a later phase, not to this triage |

---

## CLASS 1 — A MATCHER LOCKED TO A LINE · 11 findings · 0 blocker · 11 major

⚡ **The single largest measured class of the round, and it is one mechanism.** Six gates match their own
defect **per line**, so a Prettier-wrapped spelling walks straight past. `check-cap-literals` **documents
this exact escape, fixes it, and carries a proven guard for it** — and every gate written afterwards kept
the per-line split, **because the lesson lives in one file's docblock instead of in the shared scanning
helper they all import.**

⛔ **`D1-11` is why nothing caught it: every registered proof and every `test:gate-plants` scenario
certifying these gates plants the ONE spelling the gate already catches.** A gate and its proof share an
author and therefore share a blind spot.

| id | one line |
|---|---|
| `D1-3` | `lint:amount-collapse` matches per line — a wrapped `parseAmountField(…) ?? 0` is invisible. **The `D5-9` escape, in a gate written after `D5-9` was fixed** |
| `D1-4` | its permission is FILE-granular while its reason is line-specific, and `break` stops the sweep at the first hit per file |
| `D1-6` | `lint:rounding`'s pinned cap counts per line, so a wrapped `Math.round(x*100)/100` grows the population without moving the number |
| `D1-7` | `lint:fixture-dates`' never-capped IMMINENT half misses a wrapped or variable-assigned literal — and counts it `non-aging` while doing so |
| `D1-8` | `lint:sandbox` matches the singleton import per line, so a wrapped or namespace import leaks the real store past the guard |
| `D1-9` | `lint:finding-guards`' duplicate-id detector is defeated by **re-indenting the registry** |
| `D1-1` | `lint:runner-completeness` reads `run-gates.ts` as TEXT — a gate commented out of `GATES` still counts as chained. **`lint:money` can be silently dropped from `lint:rn`** |
| `D1-2` | same defect on the test runners: a commented-out `import` leaves a suite unexecuted and every file still reports wired |
| `D1-11` | **the reason the six above survived** — every proof certifying them plants the spelling they already catch |
| `C1-9` | the same shape in a product gate: "no refusal points at a sibling card" is green over `set it again above` **if the phrase wraps** |
| `C2-9` | the pass-6 `C2-3` guard sees one spelling; the sibling sheets in its own directory use the other. **Plant B passes 39/39 green** |

**Exit:** the line-wrap escape closed **in the shared helper**, with one assertion that iterates every gate
importing it — not six per-gate fixes. `A1-4` (below, class 9) is this class's measured consequence in the
wild: `lint:fixture-dates` printed `0 imminent fuses` over five CSV dates that had **already fired**.

## CLASS 2 — THE PROOF HARNESS AND THE LEDGER · 9 findings · 0 blocker · 6 major · 3 minor

⛔ **This round's own repair survives its own un-fix.** `D2-1`: `MAX_SERVER_ATTEMPTS` — the `[D78]` retry
built hours earlier — can be set to `1` and every instrument stays green.

| id | one line |
|---|---|
| `D2-1` | the `[D78]` retry survives its own un-fix; every gate green |
| `D2-4` | a registered closure's proof is **VOID and still counted as evidence** — `S1-ROUTE-STALE-READ` re-runs `reason=WRONG` and `lint:finding-guards` is green over it |
| `D2-8` | `S1P1-M9-ROUTING` survives its un-fix: **11 files route to a surface that does not exist** and `lint:s1-coverage` prints `✅ 495 classified` |
| `D1-16` | the `SKIP` fix converted 3 of 6 not-applicable returns; three still return `null` when they check nothing and are counted **EVALUATED** |
| `D1-10` | `lint:finding-guards` prints its `✅` **before it has decided** — a green tick and a red verdict together |
| `D2-10` | `preflight:xcuitest` has no floor: empty its file list and three assertions vanish, still prints ✅ |
| `D2-2` | `prove:guards` tells the operator on its SUCCESS path that `lint:finding-guards` is now red. It is not — and the same file says so 40 lines earlier |
| `D2-3` | `Proof.measured`'s docblock still says "written by `--record`"; the flag was removed |
| `D2-6` | `audit-sublanes`' per-parent count assertion cannot fail, and its docblock says the opposite in the same breath — **`D4-11` committed a fifth time** |

⚠️ **`B3-4` and `A3-3` are the same false instruction as `D2-2`, found independently by two more lanes.**
Three lanes, one wrong sentence — it is printed on a success path, which is why reading never caught it.

**Exit:** no registry entry counted as evidence unless its proof re-runs and MATCHES at the current sha;
the `[D78]` retry guarded by its own un-fix.

## CLASS 3 — THE AUDIT'S OWN POPULATIONS · 7 findings · 0 blocker · 6 major · 1 minor

⛔ **`D1-12` lands on the record used to authorise this very dispatch.** The pass route and the pass exit
have **two different populations**: 76 money-bearing files were routed to lanes and are in **no claims
file**, so `audit:read-coverage` can print *"all money-bearing files read"* without them.

⚠️ **And the pre-dispatch verification quoted the number that says so.** `audit:route-check`'s own summary
line reported *"no claims file owns 25 routed file(s)"*, and `DISPATCH.md` recorded 25. `D1-12` measures
`UNSEEN-NEIGHBOURS.txt` as holding **9**, the true figure as **86**, and the **intersection as 0**.
⛔ **Three numbers that should be one, and the green exit above was computed by the instrument in question.**
**Measure this before trusting pass 7's coverage claim — it is the first thing class 3 does.**

| id | one line |
|---|---|
| `D1-12` | route population ≠ exit population; 76 money-bearing routed files in no claims file |
| `D1-13` | `lint:trust-claims`' ledger is joined by `.debts`-style property access, so a surface that **destructures** is never considered — and the green line's sentence is false while it is there |
| `D2-7` | `resolveSpecifier` hardcodes `@/` to `apps/rn/src`: **128 real import edges silently do not exist**, and `lint:import-graph` pins the one root where the mapping is correct |
| `D2-5` | `audit-route --surface=s0` is dead by construction — reports all 130 S0 files double-owned and sends the operator to fix a config error that does not exist |
| `D1-19` | nothing in `validate:release:rn` lints `packages/core`, `scripts/` or `apps/rn/tests`; the root `lint` that could reports the same defect as a warning and exits 0 |
| `D1-5` | `lint:store-id-writes` walks `apps/rn/src/store` for `.ts` only — the three `.tsx` files **in that same directory** are never read, and the scan floor cannot see it |
| `D1-17` | `cutoverFiles.test.ts`'s `NOT_IN_V17` exempts seven fields that ARE in the envelope; the six paycheck-schedule fields the loop covers are asserted by nothing |

**Exit:** one population, derived once, shared by route and exit; the 76 either claimed or explicitly and
visibly exempt. **Pass 8 is routed by this, so it is fixed before pass 8 is routed.**

## CLASS 4 — THE DOUBLE-SCALED IN-WINDOW MINIMUM · 11 findings · 3 blocker · 6 major · 2 minor

⭐ **Found independently by two lanes that never spoke** — `A2-1` and `A3-1` are the same defect, reached
from the engine and from the cashflow side. `selectors.ts:65` already scales a debt's `minimumPayment` to
the in-window total, and `S1.13.7.10`'s new `minimumDueInWindow` (`allocatePaycheck.ts:391`) applies the
same multiplier again.

⛔ **It is created by pass 6's own `A3-4` fix, and it reproduces `A3-4`'s defect mirrored.** `A3-4` measured
RESERVE $50 against PAYDOWN $200; this measures RESERVE 1000 against PAYDOWN 500.

**Measured, one weekly debt, minimum $50, on a $500 paycheck that covers everything:**
`totalRequired = $1,250` · **`shortfall = $750`** — printed on the Guardian card, the Live Activity, the
widget and the paywall lead, beside a $250 "Extra payment" row. Monthly control clean.

| id | sev | one line |
|---|---|---|
| `A2-1` | blocker | the scaling applied twice — a plain weekly debt is required at its whole balance |
| `A3-1` | blocker | the same, measured to the printed `shortfall` on four surfaces |
| `A3-4` | blocker | the inflated total is **carried correctly onward** (per **pass 6's** `C1-15`, closed) into `essentials`, `net` and `carriedBalance` — the cash-runway receipt and the crunch detector run on it |
| `A2-2` | major | the two "a plain debt is never scaled" controls are **vacuous** — they vary alignment, not type |
| `A2-8` | major | the plain-debt half is **pinned by an assertion stating the un-fixed behaviour as the requirement** |
| `A3-2` | major | `A3-4`'s guard runs the allocator on a path production never takes, and asserts one field of it |
| `A3-14` | major | History's "unchanged by in-window scaling" control never exercises the scaling — its fixture is due five months outside the window |
| `A3-12` | major | the cadence-identity matrix — built to close the cadence CLASS — walks 28 pairs and passes `debts: []` to every one |
| `A3-7` | major | the §2.2 partition invariant is broken by any sub-cycle debt; `testGuardianPartition` cannot see it because **every debt fixture has `minimumPayment: 0`** |
| `A2-3` | minor | pass-6 `A2-8`'s caption fix iterated to fallback BNPLs, not to the plain debts pass-6 `A3-1` widened into |
| `A2-4` | minor | the safety argument that justified pass-6 `A3-1`'s widening is a carried premise and is now measurably false |

**Exit:** one owner of the in-window minimum, with an assertion that iterates cadence × debt-type rather
than naming a member — and **fixtures with a non-zero `minimumPayment`**, since five instruments in this
class are blind for that one reason.

## CLASS 5 — MAY A SURFACE STATE A PROJECTED FIGURE? · 13 findings · 11 blocker · 1 major · 1 minor

⚡ **One question, five different answers, and the correct answer already exists in the codebase.** The
widget refuses this exact claim by design and says so in a comment. Pass 6's `C3-5` widened the widget's
guard **and nothing else**.

| id | sev | one line |
|---|---|---|
| `C3-13` | blocker | Today: **"You're debt-free · Every balance is cleared"** off the premium projection, on the same screen asking the user to confirm the payoff |
| `C3-8` | blocker | Money's hero states **$8,750** over a true **$11,513** — the exact state the widget was taught to refuse |
| `C3-9` | blocker | Progress promises debt-free **October 2026** over a true **January 2027** when the APR could not be read |
| `C3-11` | blocker | the Cushion Forecast asks **no trust question at all** — an unread minimum erases the below-floor crunch the screen exists to show |
| `C3-5` | blocker | the Lock Screen holds "looks clear" while the store says **"$2,500 short"** — pass-6 `C3-12` was fixed in `widgetSync` and not its twin |
| `C3-1` | blocker | Siri is handed **`"$0"`** as the balance of the one debt the app has just refused to state |
| `C1-1` | blocker | `cushionFloor`'s `\|\| 200` turns the "could not be read" sentinel into a confident **`$200 · Your line`** — *inside the sentence explaining the read failed* |
| `C1-5` | blocker | PlanHero withholds the verdict and keeps the figures: **`Flexible $1,540`** against a true **`$1,040`** |
| `C1-6` | blocker | one store, three answers to "what is your line" — `200` / `0` / `0`; at `$0` **no cycle can ever read as a crunch** |
| `D2-12` | blocker | Siri tells a **premium** user their paycheck read is "a Premium feature" when the app merely could not read their obligations — pass-6 `C3-1`'s fix reached 2 of the 3 intents in the file |
| `C3-2` | major | `guardianSpoken: ''` means two different things and Siri speaks the wrong one |
| `B1-1` | blocker | `selectSaveForItOptions` paces the save plan off the **partition total** while the card that opens it prints **spendable** — an **$835/paycheck promise out of $675**, and that number is written to the store as the goal's pace |
| `C3-14` | minor | Money's goals hero says "one target could not be read" when two were |

**Exit:** one predicate answering *may this surface state a figure derived from the projection*, called by
every surface, with an assertion that **iterates the surfaces** — six were walked in one list last round and
`C4-4` was the measured hole a finding came through. ⛔ **The `|| 200` shape is its own sub-sweep: a
fallback that erases a sentinel is indistinguishable from a real value at every call site.**

## CLASS 6 — MONEY WRITTEN OR DESTROYED · 12 findings · 9 blocker · 1 major · 2 minor

| id | sev | one line |
|---|---|---|
| `B2-1` | blocker | `verifyDebtBalances` (batch) kept the `Math.max(0, NaN)` shape its own sibling **twelve lines above** was repaired for — persists `null`, re-reads as **$0** on a $1,200 card |
| `B2-3` | blocker | the debt-free **finale never fires on the rollover** — the app's own primary payoff path — and is then **unrecoverable**, because detection is transition-based |
| `B3-2` | blocker | one `stat` failure AFTER the write records our clock as the file's identity; **every later automatic backup is refused as a foreign clobber** |
| `B3-5` | blocker | three store-level money fields still pass through as **strings**, with zero repairs recorded, rendering `$0` |
| `B3-7` | blocker | the pre-overwrite sentence discloses the **benign** loss class and is byte-silent about the one `persistence.ts` calls *"the real losses"* |
| `B1-5` | blocker | an `originalBalance` repair on a **cleared** debt has no writer anywhere, so every progress figure is withheld **for the life of the install** |
| `A2-9` | blocker | `verifyDebtBalance` skips `normalizeBnplInstallment`: a **$200 plan prints $400 of upcoming charges** on the flow the app asks people to use |
| `A2-6` | blocker | `bnplPaymentsTotal` is a **fourth** producer using `round` where three use `ceil` — the "of N" denominator shrinks and a payment vanishes |
| `B1-2` | blocker | the expense-reserve offer counts the existing contribution **twice** — offers $650 against a $650 engine ceiling on top of $175 already held, then re-arms claiming *"the full $1,050"* |
| `C3-3` | blocker | a voice-logged payment that **cannot be applied is reported as applied**, the queue is cleared, and no surface ever tells the user |
| `C1-2` | blocker | a store-level money loss fails `answerableByEdit`, so the app says *"nothing to reopen — check this against your old app"* about a number **its own sheet sets** |
| `B2-4` | minor | the `Math.max(0, NaN)` class has two more members in the same file, held closed by a caller rather than by the action |

**Exit:** every money write goes through one normaliser; the `NaN` class asserted by iteration over the
actions, not the callers; the finale reachable from **every** path that clears a balance.

## CLASS 7 — THE SUB-CYCLE CADENCE CLASS · 5 findings · 1 blocker · 3 major · 1 minor

| id | sev | one line |
|---|---|---|
| `A3-6` | blocker | an un-ticked sub-cycle bill is carried forward **un-advanced**, so its reserve grows without bound: **$250 → $450 → $650** over three real rollovers, 5 → 9 → 13 rows |
| `A3-5` | major | the forecast ledger itemizes a sub-cycle bill **once** while the engine reserves for every occurrence — the rows do not add up to the totals beside them |
| `A3-7` | major | *(also class 4)* the §2.2 partition invariant, broken by $200–$250 with a real `minimumPayment` |
| `A3-12` | major | *(also class 4)* the 28-pair cadence matrix with `debts: []` |
| `A3-15` | minor | `selectVisibleHistory` still implements the **retired** Premium history cap, and `test:regression` pins it |

## CLASS 8 — THE FIX REACHED THE MEMBER, NOT THE CLASS · 12 findings · 5 blocker · 5 major · 2 minor

⛔ **This is pass 4's `13 of 34` class, recurring for the fourth consecutive round.** Every member is a
previous round's **correct** fix stopping one line, one field, one hop or one consumer short.

| id | sev | one line |
|---|---|---|
| `C3-7` | blocker | pass-6 `B3-3` added a fourth cloud-backup status and left `setEnabled` on `=== 'ready'` — **turning iCloud backup ON takes no backup and says nothing**; the sweeping guard reads one file and only the `!==` spelling |
| `B1-4` | blocker | A1's netting reached the band and stopped: `PlanSummary.status`, `paywallLead` and `selectRecoveryPlan` still read the RAW shortfall — Today says *"$200 short"* while the paywall says *"$400 short"* |
| `C2-1` | blocker | pass-6 `C2-1`'s fix reached the arm it was reported on and left the **backstop** making the same false claim over an identical order |
| `C2-3` | blocker | pass-6 `A2-1` narrowed one over-claim and attached a new unconditional one — *"as your other debts clear"* to a user with **one debt and $0 extra** |
| `C1-13` | blocker | payday capture: **`Required expenses & minimums $60.00`** directly above its own **`$410.00 paid`** |
| `A1-12` | major | pass-6 `A1-6` reached one of three helpers; two still overwrite the `prefs` merge they claim to make |
| `C3-10` | major | pass-6 `C3-10`'s fix names two consequences and reaches one — **"Delete all data" still never removes the widget snapshot**, guarded by nothing |
| `C3-6` | major | the assertion that pass-3 `D3-2`'s fix "reaches the screen" stops one call short of the screen |
| `B3-1` | blocker | the pass-6 shape guard admits two more spellings — an impossible calendar date, and a date-only stamp rendered as the **previous day** |
| `B3-8` | major | pass-6 `B3-1` said *"the declaration is what opens it"*; the declaration landed and invariant ③ still cannot see one byte of store-level money — the control was never given a row for `plan` |
| `C3-4` | major | `scheduleRiskNotification` reports "a push went out" without asking whether it can deliver one — a revoked permission burns the 2-per-month budget silently |
| `C2-7` | blocker | the last onboarding screen states a paycheck date to a user who **skipped** the paycheck step, from a biweekly default they never chose |

## CLASS 9 — A CHECK THAT CANNOT FAIL · 21 findings · 1 blocker · 18 major · 2 minor

⛔ **Fixed LAST among the instrument classes**, deliberately: these are what re-verify everything else, so
repairing them first re-verifies against the same blind spots. This is `S1.13.7.10`'s rule.

| id | sev | one line |
|---|---|---|
| `A1-5` | blocker | `C4-9`'s guard went on the ring and **not on the sentence the ring speaks** — a screen-reader user is told *"no milestones reached yet, next milestone 25%"* on a portfolio the app has just said it cannot read. **Zero test-tree hits for that label** |
| `A1-11` | major | the demo's "no bills invented" assertion reads `store.expenses` — **a key that has never existed** (`requiredExpenses`), so it cannot fail |
| `A1-4` | major | `lint:fixture-dates` prints `0 imminent fuses` over five **already-fired** and three imminent CSV dates in `csv-import.spec.ts` |
| `A1-7` | major | the VIS-4 ack coordinator has one test, no control, and cannot tell suppression from absence |
| `A1-2` | major | `recovery.spec.ts`'s "the card relaxes" asserts only an **absence** — the relaxed state is never named |
| `A1-1` | major | two specs decline to assert a modal's contents on a premise a third spec in the same directory measured **stale** |
| `A1-9` | major | the "coming soon" guard fires two absence assertions **before the screen has rendered** — 80 lines below the comment forbidding exactly that |
| `A1-10` | major | the class behind `A1-9`, enumerated: four assertions in three files fire between `page.goto` and first paint |
| `D1-15` | major | `testSubscriptionGating`'s tier-split guard is **vacuous**: empty `premiumPlusOnlyFeatures` and the test written to catch that prints zero assertions and passes |
| `D1-18` | major | `assertNumeric`'s sweep reached five tolerance helpers and missed a sixth — `assertClose` is still NaN-blind and prints ✅ over a pay cycle returning `NaN` |
| `B1-3` | major | `expenseReserve.test.ts` asserts "offering the number must reserve that number" and only ever runs it with **zero** already reserved |
| `B1-6` | major | `trustSelectors.test.ts` gates that every repairable field is **routed** and never that any routed field can be **answered** |
| `B1-7` | major | the "three producers must agree" invariant compares three fields of an object carrying a **fourth that contradicts one** |
| `B2-2` | major | pass-6 `B2-5`'s fix has **no test and no registered guard** — the un-fix was planted and the whole app-layer suite stayed green |
| `B2-5` | major | `milestoneCross.test.ts` asserts a handoff that **does not exist**, and passes because it only checks the half that is null |
| `B3-3` | major | the block titled *"THE REGRESSION THAT WOULD MAKE THE GUARD BLOCK EVERYTHING"* asserts only the branch where `stat` succeeds |
| `C1-4` | major | nine assertions prove the §2.0.d hedge budget on a string the card renders in **no state a hedge can occur in** — the hedged and rendered sets are disjoint |
| `C3-12` | major | `test:scenarios` is one journey and asserts not one string, yet the registry cites it as evidence a defect "survived all three suites" |
| `A3-9` | major | `testFullAppRegression`'s largest section — 22 of 70 assertions — covers a feature the shipping app **deliberately never calls** |
| `A1-6` | minor | `route-smoke.spec.ts` claims "every route" and walks a hand-typed list of **10** against an app with **13** |
| `A1-8` | minor | ten assertion-free screenshot rows sit inside the release gate, and the config written to keep them out states they are not there |

## CLASS 10 — CARRIED PREMISES AND STALE COMMENTS · 20 findings

⚠️ **A comment is a carried premise and decays like a carried number.** Swept **inline when a later class
already has the file open, never batched** (🎯 2026-09-02) — the cost of a minor is re-verifying a
weeks-old premise, and a batch pays that 19 times with no class context to amortise it.

`A3-3` `A3-8` `A3-10` `A3-11` `A3-13` `A2-7` `A2-10` `A2-5` `B3-4` `B3-6` `B2-6` `B2-7` `D2-11` `D3-3`
`D3-4` `C1-12` `C1-14` `C2-10` `A1-3` `A1-13`

⚠️ **`A3-13` is the shape twice over:** `testEngineFuzz` still documents `suggestLean`'s fallback as *"the
MAX of the actuals"* — which was pass 6's **blocker `A3-9`**, already fixed — **and its assertion cannot
tell the two apart.** A stale comment sitting on a check that cannot fail.

⭐ **`D3-4` is the sharpest: `allocatePaycheck.ts:592` states as MEASURED that the reserve labels are "read
by nobody" — two consumers read them at HEAD, one inside `test:regression`.** It lives in the shipping
engine and outlives `P6.11`.

## CLASS 11 — COPY, A11Y AND FORM POLISH · 17 findings

Swept inline, same rule.

`C1-3` `C1-7` `C1-8` `C1-10` `C1-11` `C2-2` `C2-4` `C2-5` `C2-6` `C2-8` `C2-11` `C3-15` `D1-14` `B3-9`
`B3-10` `A2-5` `D2-9`

## CLASS 12 — THE LEGACY ROOT AND `P6.11` · 4 findings — ROUTES TO A LATER PHASE

⭐ **The legacy Next root does not ship and is not user-reachable — but it is NOT inert.** Nothing builds
or serves it; the release gate **compiles and executes** it through `packages/core`.

⛔ **`D3-1` (major): both written enumerations of the pre-`P6.11` move-set are SHORT.** The plan says
*"7 files · 8 edges"*; the backlog says *"five root modules, 293 lines"*. Measured two independent ways that
agree — `tsc --listFiles` and a closure runner — it is **7 files · 12 edges · 351 lines**. Both lists were
built by one-hop greps and miss `lib/analytics/track.ts` at hop 2. **Deleting from either list breaks
`typecheck` and `test:regression`, which run on every push.**

`D3-2` `D3-3` `D3-4` are minors; `D3-2` (the `preflight:xcuitest` fixture inside the deleted tree, and four
other instrument comments still naming the retired `5.5.1`) belongs to `P6.11`'s scope, not to this triage.

---

## ⚠️ Recorded about the DISPATCH itself, so pass 8 does not repeat it

1. **The lane prompt told C2 and C3 to weight `instrument`-origin files heavily. Neither manifest contains
   one.** Both lanes said so plainly rather than inventing coverage — but the instruction was unsatisfiable,
   and it was written from a template rather than from each lane's own origin split. ⛔ **C3 found four
   instrument defects anyway, and routing by file origin did not find them.**
2. **`prove:guards` rewrites the tracked `scripts/finding-guards.json` by default.** Two wave-1 lanes hit
   this before wave 2 was warned. Both restored and `cmp`-verified.
3. **A Python restore silently converted CRLF→LF while `git diff --stat` showed no content diff** (C2). Only
   `cmp`/`file` caught it. ⚠️ **`git diff` is not a restore check on this repo.**
4. **Concurrent lanes see each other's live plants.** C2 observed `surface-coverage.ts` carrying `to: 's9'`
   and `if (false && …)` mid-run, and a modified `RequiredActionsCard.tsx`. Nothing was committed while any
   lane was live, and the final `git status` showed **no tracked file modified**.
5. **Four lanes recorded measured NEGATIVES** — hypotheses checked and found sound, with the control stated
   (C1 four, C2 seven, D1 ten, D2 four+two unsettled). **Kept deliberately**, so the next pass does not
   re-spend the time.

## The convergence position

⛔ **[D65] exits on 0 blockers / 0 majors twice consecutively.** Pass 7 is **34 / 55**. It is not a clean
pass, so **pass 8 is owed, and a clean pass 8 would still owe a pass 9.**

⚠️ **Stated rather than hoped, as pass 6's forecast was:** pass 8 will find defects in the fixes for these
137. Every round has. This round shipped its own instruments to be wrong about — and `D2-1` proves the point
inside a single day, because the `[D78]` retry built this morning **survives its own un-fix.**
