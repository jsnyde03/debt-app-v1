# AUDITOR A — job ①: S0's five, and pass 1's fifteen (+ AS-1/2/3)

**Pin:** `4b58d75` · branch `v1.7-dev` (`HEAD` is `22b4909`, brief-only). Read-only pass — **no source file
was created, edited or deleted.** Every probe was written to the system scratchpad, never into the repo.

**Status: COMPLETE.** 0 blockers · 1 major · 5 minors. Every value below was **printed** from a
running probe or a gate, never described from a reading.

⚠️ **A correction to the brief's own range, measured first thing.** The brief names the fix range as
`78c6020..4b58d75`. That range contains only **two** commits (`e2b6627`, `4b58d75`) and therefore only
**M1–M4 + AS-1/2/3 + [D73]**. **B1–B5 and M5–M10 are NOT in it** — they landed in `805095e`, `bcb7699`,
`bbbabb7`, `317d922`, all before `78c6020`. The range that actually covers pass 1's fifteen is
**`dedda70..4b58d75`** (pass 1's own audit commit → the pin): 42 files, +3,480/−298. Everything below is
measured against that.

```
git -C /c/Users/Jason/debt-app-v1 diff --stat dedda70..4b58d75 -- apps packages scripts package.json
  42 files changed, 3480 insertions(+), 298 deletions(-)
```

---

## 1. Result

| severity | count | |
|---|---|---|
| **blocker** | **0** | |
| **major** | **1** | **A1** — AS-3's blanket `0`, plus M3's band branch, against an unchanged `holdsLine` |
| **minor** | 5 | §5 items 1, 4, 5, 6, 7 — recorded, none blocking |

**Verdicts — 5 + 18, all of them.**

| | | | |
|---|---|---|---|
| `REVERIFY4-1` | **CLOSED** | `B1` | **CLOSED** |
| `REVERIFY4-2` | **CLOSED-UNPINNED** ⚠️ *caveat narrowed, not gone* | `B2` | **CLOSED** |
| `REVERIFY4-3` | **CLOSED** ⚠️ *the guard PRINTS, it does not RED* | `B3` | **CLOSED** |
| `REVERIFY4-4` | **CLOSED** | `B4` | **CLOSED** |
| `REVERIFY4-5` | **CLOSED** | `B5` | **CLOSED** |
| `M5` `M6` `M7` `M8` `M9` `M10` | **CLOSED** (all six) | `M1` `M2` `M3` `M4` | **CLOSED** (all four) |
| `AS-1` | **CLOSED** | `AS-2` | **CLOSED** |
| `AS-3` | **PARTIAL · major** — the stated defect is gone; the remedy over-matched | | |

**The one sentence for 🎯:** every one of pass 1's fifteen and S0's five is genuinely closed and I could
print the values to prove it — but **AS-3's fix reaches one case too far**: a user who moved $200 from
savings and then went **$1** short is told a $20 purchase would leave them *"$20 short"*, in the same card
that says the $200 *"holds your line"*, and every test written for that fix uses the one member of the
class where the over-match is invisible.

⚠️ **Two facts that are not findings but must not be lost.** First, **CI has not run since `78c6020`**, so
**M1–M4's four e2e guards have never been executed by anything** — B1–B5's have. Second, `REVERIFY4-2` is
still `CLOSED-UNPINNED` and `REVERIFY4-3`'s guard still prints rather than reds; both caveats survive, and
`REVERIFY4-2`'s is *narrower* than pass 1 recorded, which I measured rather than assumed.

---

## 2. Sweep — blocker + major

### A1 — `major` · a top-up larger than the shortfall makes Today print three contradictory statements, one of which is a false dollar figure

**User-facing consequence, in one sentence:** a premium user whose cycle is **$1 short** after moving
$200 from savings at the Guardian's own suggestion is told *"Not this paycheck — you'd come up about $20
short"* about a $20 purchase, in the same card that says *"$200 moved from Savings **to hold your line**
this paycheck"*, while $199 of that money sits unspent in checking.

**Mechanism.** Three reads of the same money, and this fix range moved **two** of them:

| | expression | moved by |
|---|---|---|
| the band | `buildGuardianBrief.ts:218` — `shortfall > 0 ? "at-risk" : computeState(discretionary, …)` | **M3** |
| the affordability figure | `guardianSelectors.ts:421` — `base.shortfall > 0 ? 0 : selectSpendable(base) + appliedTopUp(store)` | **AS-3** |
| `holdsLine` | `guardianSelectors.ts:278` — `selectDiscretionary(allocation) + rec.amount >= (store.cushionFloor ?? 200)` | **unchanged** |

Before M3, all three agreed by being wrong together: the band was derived from `discretionary + topUp`,
so a top-up that cleared the floor made the band `clear` and `holdsLine` `true` at the same time. M3 and
AS-3 made two of the three net the shortfall and left the third on the old expression, so the three now
disagree wherever `topUp` is enough to clear the floor while a shortfall stands. And AS-3's blanket `0` —
rather than `max(0, spendable + topUp − shortfall)` — makes `shortBy` name a figure that is false about
money the user is holding.

**Measured** (probe: real `selectAllocation` → `selectPaydayGuardian` / `selectAppliedTopUp` /
`selectAffordability`, printing the three sentences the components compose from them; premium, default
`cushionFloor` of 200, a $20 purchase):

```
== D · $200 moved at a $200 floor, then the cycle goes short $50   [goal $400 left]
   Guardian band        : at-risk
   Guardian top-up line : $200 moved from Savings to hold your line this paycheck.
   Affordability card   : Not this paycheck — you'd come up about $20 short.

== E · the same, ONE DOLLAR short                                  [goal $400 left]
   Guardian band        : at-risk
   Guardian top-up line : $200 moved from Savings to hold your line this paycheck.
   Affordability card   : Not this paycheck — you'd come up about $20 short.

== C · a $600 move against a $50 shortfall
   Guardian band        : at-risk
   Guardian top-up line : $600 moved from Savings to hold your line this paycheck.
   Affordability card   : Not this paycheck — you'd come up about $20 short.
```

and the arithmetic behind it, printed:

```
                                 shortfall topUp spendable | OLD discNow  NETTED  NEW discNow | verdict  shortBy
short  50, topUp 600, buy  20         50    600      0     |     600       550        0       | short      20
short 100, topUp 800, buy  20        100    800      0     |     800       700        0       | short      20
short 400, topUp 200, buy 150        400    200      0     |     200         0        0       | short     150   <- the AS-3 case, correct
```

⚡ **Row 3 is the member AS-3's own tests pinned** (`guardianSelectors.test.ts:333-335`,
`guardian-shortfall-topup.spec.ts:28` — both use `topUp 200` against `shortfall 400`). Rows 1–2 are the
other member of the same class, and the `NETTED` column is what distinguishes them: where
`topUp ≤ shortfall`, blanket-`0` and netting agree exactly, so **every existing test passes under both
implementations** and none of them can see this.

**Reachability — measured, not assumed.** `selectTightTopUp` refuses to offer while `shortfall > 0`, so
the state is reached by going short *after* the move, which is the same ordinary sequence AS-3's own
docblock relies on. The offer is *"the smallest move that HOLDS the line"* = `floor − cushion`, so at the
default `$200` floor a user sitting at a `$0` cushion is offered exactly `$200`; any later change that
makes the cycle short by less than that lands in rows D/E above. `holdsLine` goes `true` at exactly the
same threshold (`topUp ≥ floor` when `discretionary` is 0), which is why the contradiction and the
reachable case are the same case.

**Confidence: high on the mechanism and the values** (all printed from the live selectors). The
*frequency* of the sequence is inference, not measurement.

**Would anything catch it?** ⛔ **No.** `guardianSelectors.test.ts:333-341` and
`guardian-shortfall-topup.spec.ts` both fix `topUp = 200` against `shortfall = 400`; `affordability.test.ts`
has no `cycleTopUp` case with a shortfall. Nothing in the tree exercises `topUp > shortfall`.

**What a guard would have to assert:** with `shortfall = 50` and `cycleTopUp = 200` on record, either
(a) `selectAffordability(store, 20).verdict !== 'short'`, or (b) `selectAppliedTopUp(store).holdsLine ===
false` — **whichever way the decision goes, the two must agree**, and today they do not. That is the
assertion, and it is a unit test, not an e2e.

⚠️ **This is a decision, not just a patch.** AS-3's docblock rejects netting explicitly, and its reason —
that netting would leave a small spare while the band is `at-risk`, re-creating the two-cards-disagreeing
class — is sound. But the measurement above shows the disagreement exists *anyway*, between the band and
`holdsLine`, and with a dollar figure attached. The three seams need one rule.

---

## 3. Job ①a — S0's five, re-verified at `4b58d75`

**First, the mechanical question: did the fix range touch any of them?**

```
git -C /c/Users/Jason/debt-app-v1 diff --stat bc29dfe..4b58d75 -- <each file>

  scripts/write-gate-status.ts         (no change)
  scripts/begin-gate-run.ts            (no change)
  scripts/gateSources.ts               (no change)
  scripts/strings-inventory.ts         (no change)
  scripts/duplicate-copy-baseline.json (no change)
  scripts/check-type-scale.ts          (no change)
  scripts/preflight-native-lane.ts     (no change)
  scripts/test-gate-plants.ts          (no change)
  scripts/check-committed-secrets.ts   1 file changed, 55 insertions(+)   <- the ONLY one
```

Four of the five sit on byte-identical code to what pass 1 verified. That is not on its own a verdict —
their *live* behaviour was re-run, and both caveats re-measured.

| | pass 1 | this pass | live measurement |
|---|---|---|---|
| `REVERIFY4-1` fingerprint at END of run | CLOSED | **CLOSED** | `lint:gate-freshness` reds correctly (below) |
| `REVERIFY4-2` secrets read the working tree | CLOSED-UNPINNED | **CLOSED-UNPINNED** *(caveat narrowed, not gone)* | `lint:secrets` → `committed secrets: none across 1199 tracked files in index+HEAD (4 shapes checked, 2 exemption(s), cap 2).` exit 0 |
| `REVERIFY4-3` 13 stale baseline entries | CLOSED (guard prints) | **CLOSED — the guard still PRINTS, it does not RED** | `lint:copy` → `duplicate copy: no new cross-file phrases (3 baselined).` |
| `REVERIFY4-4` any `allowFontScaling` = a clamp | CLOSED | **CLOSED** | `lint:type-scale` → `every large figure carries a font-scale cap (19 checked).` |
| `REVERIFY4-5` fail-open `if` in `lint:lane` | CLOSED (+ `minor`) | **CLOSED** — the `minor` on `MIN_CHECKS`'s docblock is unchanged and still true | `lint:lane` → `native-lane pre-flight: 95 structural checks pass.` — **95 against a floor of 95, zero slack, identical to pass 1** |

### `REVERIFY4-3`'s guard prints — CONFIRMED, at the line

`scripts/strings-inventory.ts:549-560` is `console.log` ×2 plus a `for` loop of `console.log`, then falls
through to the success line at `:561` and `process.exit(0)` at `:566`. **There is no `exit(1)` on the
stale branch.** The original 16-entry / 13-stale condition, restored, is reported and green. That is the
finding's own chosen remedy (the docblock at `:536-547` argues it from `check-apostrophes.ts:296-301`);
recorded here so no reader carries away *"the stale class now reds"* — **it does not.**
Baseline today: **3 entries, 0 stale** —
`["A little tight this paycheck","Looks clear this paycheck","Very tight this paycheck"]`.

### `REVERIFY4-2` is still `CLOSED-UNPINNED` — but the caveat **narrowed**, and that is measured

Pass 1's caveat: *the registered token `cat-file` also appears in a docblock, so `lint:finding-guards`
counts it guarded while nothing guards it.* **M7 changed that** — `check-finding-guards.ts` now has
`presentInCode()`, which skips comment lines. I lifted `present` + `presentInCode` **verbatim** out of the
live gate and ran them over the live file and over two un-fixes (probe in the scratchpad; the repo file
was never touched):

```
LIVE   present=true presentInCode=true
  L148 COMMENT ::  * Every requested blob's bytes, in ONE `git cat-file --batch` call.
  L155 CODE    :: const buf = execFileSync('git', ['cat-file', '--batch'], {

UNFIX-A (the cat-file call line deleted)                            presentInCode=false -> lint:finding-guards RED
UNFIX-B (eachBlob left defined, the scan switched to readFileSync)  presentInCode=true  -> GREEN
```

⚡ **The crude un-fix now reds; the careful one does not.** UNFIX-B is not hypothetical — the fix range
itself added a **second content-reading `readFileSync` at `:222`** (the `--working-tree` branch), a working
template for exactly that shape sitting in the same file. Nothing else catches it: `scripts/tsconfig.json`
sets `strict` but **not** `noUnusedLocals`, so an `eachBlob` left defined and unused compiles clean.

**Verdict: `CLOSED-UNPINNED`, unchanged in kind.** ⚠️ It must not read as clean. The guard that would
settle it is a runtime one — a fixture whose `HEAD` blob and working copy differ, asserting the gate reds
on the `HEAD` content. Pass 1 could not build it read-only and neither can I.

### `REVERIFY4-1` — CLOSED, and the gate is doing its job right now

`lint:gate-freshness` is **RED on this tree**, for the correct reason:

```
recorded: 78c6020 · 2026-08-26T15:23:01Z · 807 files
now:      807 files · fingerprint differs
```

⚡ **Load-bearing for every "would anything catch it?" answer below: `validate:release:rn` has NEVER run
against the pinned tree.** The last recorded green describes `78c6020` — *before* `e2b6627` and `4b58d75`,
the two commits carrying M1–M4, AS-1/2/3 and **all four new e2e specs.** Nothing in the record says those
specs have ever executed. The instrument is behaving exactly as designed; the fact is the point.

### The new `--working-tree` flag — read, and NOT a defect

`check-committed-secrets.ts:183-236`, +55 lines, is the only S0-fix file the range touched. It adds
`lint:secrets:authoring` (`--working-tree`), scanning **untracked** files with the same `PATTERNS` and the
same exemption ledger, deliberately **not** in `lint:rn`. Checked for the two ways this could have gone
wrong:

- **It cannot loosen the committed scan.** The `if (WORKING_TREE)` block only *appends* to `hits`; the
  `for (const rev of ['index','HEAD'])` loop below it is untouched, and `lint:secrets` with no flag still
  prints `1199 tracked files in index+HEAD` and exits 0.
- **`re.exec` inside a `forEach` is safe here** — checked rather than assumed: **none of the four
  `PATTERNS` carries the `g` flag** (`:85-104`), so there is no `lastIndex` carry-over that would make the
  new scan skip every other match. That is the shape that would have made it silently half-blind, and it
  is absent.

⚠️ One residue, recorded as **`minor`**: `--working-tree` reads only `git ls-files --others`, so a
**tracked file modified in the working tree** is never read from disk. A credential typed into an
already-tracked file is invisible to the authoring scan until it is staged. No user-facing consequence
(the committed scan still catches it at `index` time, before push), and the flag's stated job is the
untracked-report case — so `minor`.

---

## 4. Job ①b — pass 1's fifteen, plus AS-1/2/3

### ⚡ One measurement that answers question 3 for half the table, before any individual verdict

**CI has run at `78c6020` and nowhere later.** `gh run list` (`web-e2e`, the workflow that runs
`typecheck` → `lint:rn` → `test:stamp` → `test:regression` → `test:app` → `test:scenarios` →
`test:e2e:rn` → `test:e2e:embed`):

```
success  2026-08-26T13:00:54Z  32971726870  78c6020   <- the newest run on this branch
success  2026-08-26T12:51:00Z  32970802274  85ee923
success  2026-08-26T00:51:44Z  32916753258  613adf2
```

**Nothing has run at `e2b6627`, `4b58d75` or `22b4909`.** And `lint:gate-freshness` says no local
`validate:release:rn` has either. Split by commit:

```
git ls-tree --name-only 78c6020 apps/rn/tests/e2e/ | wc -l   ->  59
git ls-tree --name-only 4b58d75 apps/rn/tests/e2e/ | wc -l   ->  63
git diff --stat 78c6020..4b58d75 --diff-filter=A -- apps packages
   apps/rn/tests/e2e/bill-category-partition.spec.ts   134 +++
   apps/rn/tests/e2e/goal-row-saved.spec.ts             90 +++
   apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts   97 +++
   apps/rn/tests/e2e/plan-hero-conserves.spec.ts        86 +++
```

- ✅ **B1–B5's guards HAVE executed.** `intent-undo`, `misfiled-expense`, `no-bills-branch`,
  `topup-sources`, `progress-hero-journey`, `trustSelectors.test.ts`, `storeActions.test.ts` all landed
  at or before `78c6020` and are byte-identical at the pin, so the green CI run at `78c6020` is a real
  observation of them passing.
- ⛔ **M1–M4's four guards have NEVER been executed by anything** — no CI run, no recorded local run.
  Their verdicts below rest on reading plus the parts I could measure in-process, never on a run.
  ⚠️ `npm run typecheck` (all four projects, `typecheck:tests` included) and `npm run test:app` are
  **green on this tree**, which is the most that can be said.

`test:app` → `✅ App-layer regression tests: ALL PASSED.` · `typecheck` → clean across
core / rn / scripts / tests.

---

### B1 — *"Every balance is cleared"* over debts the app could not read — **CLOSED**

**Is the original behaviour gone? Measured**, through `runMigrations` into `selectPlanState`, printing
the value at every step (probe in scratchpad; `store.debts[0].balance` and the repair kinds are real
outputs, not a reading):

```
two blank      balances=[0,0] repairs=["debt.balance:lost","debt.balance:lost"]      unreadDebts=true  planState=debt-free-unverified  isDebtFree=false
genuinely 0    balances=[0,0] repairs=[]                                             unreadDebts=false planState=debt-free             isDebtFree=true
string zeros   balances=[0,0] repairs=["debt.balance:recovered","…recovered"]        unreadDebts=false planState=debt-free             isDebtFree=true
one live       balances=[100] repairs=[]                                             unreadDebts=false planState=normal               isDebtFree=false
goal target 'wat'    -> unreadGoals=true  target=0
goal target '1,000'  -> unreadGoals=false target=1000
```

`isDebtFree` is the value that gates the banner — `index.tsx:303` is `planState === 'debt-free'`, strict
equality, so `'debt-free-unverified'` cannot reach `GraduationBanner` or `FreedomNextChapterCard`
(`:310`, `:315`).

**Did the fix preserve what the site did right?** Yes, and the two directions are both measured above:
a genuinely cleared portfolio and a portfolio restored from *string* money both still celebrate. The
narrowing to `field === 'balance'` (`trustSelectors.ts:43`) is also correct rather than a loosening —
`trustSelectors.test.ts:89-101` builds a store whose `apr` is absent and whose balance is perfectly
readable and asserts the celebration is **not** suppressed.

**Progress's half, and the over-match risk I went looking for.** `progress.tsx:173` is
`paidOff.length > 0 && !hasUnreadDebtBalances(store)`; the fall-through at `:198` is
`if (store.debts.length > 0)` → *"Some balances couldn't be read"*. I checked whether that second branch
can fire on a user with nothing unread — it cannot, and the reason is arithmetic rather than a comment:
`paidOff` is `debts.filter(balance <= 0)` (`celebrationSelectors.ts:27`) and `hasDebts` is
`liveDebts.length > 0` = `balance > 0` (`payoffSelectors.ts:89`). Inside `!view.hasDebts`, **every** debt
has `balance <= 0`, so `paidOff.length === store.debts.length`. `paidOff.length > 0` is therefore
implied by `store.debts.length > 0`, and the only way to reach `:198` is `hasUnreadDebtBalances === true`.
**No true celebration is suppressed.**

**Would anything catch it un-fixing?**
- `apps/rn/src/store/trustSelectors.test.ts:55` — `eq(state, 'debt-free-unverified', …)`. **Yes, it reds
  on the original defect** (which returned `'debt-free'`). Rule 6 checked: the three assertions before it
  (`:52` both repaired to 0, `:53` the owner says unread) are true *with* the defect present, so `:55` is
  reached and is the assertion that carries the finding.
- `apps/rn/tests/e2e/progress-hero-journey.spec.ts:141-169` — the rendered half. Rule 7 satisfied: the
  **positive** assertion (`'Some balances couldn't be read'` visible, `:160`) precedes all three
  `toHaveCount(0)`s. On the original defect the screen rendered the trophy hero, so `:160` reds first.
  ✅ **This spec was in the tree at `78c6020` and that CI run passed**, so it has actually executed.

---

### B2 — Today's *"Undo"* reverted the whole store to a session-old snapshot — **CLOSED**

**Is the original behaviour gone?** Yes. `store.ts:339-341`, inside the wrapped `set`:

```ts
if (patch && patch.store && patch.store !== state.store && state.intentRollback && !('intentRollback' in patch)) {
  patch = { ...patch, intentRollback: null };
}
```

Measured over seven writers (probe; each row is one `logManualPayment('d0', 200)` then one action):

```
addGoal (a real user edit)                      armed=true storeMoved=true  rollbackAfter=CLEARED
updatePrefs coachMarksSeen (machine)            armed=true storeMoved=true  rollbackAfter=CLEARED
applyRiskNotified (machine)                     armed=true storeMoved=true  rollbackAfter=CLEARED
markReviewPrompted (machine)                    armed=true storeMoved=true  rollbackAfter=CLEARED
setLastHandledPayday (machine)                  armed=true storeMoved=true  rollbackAfter=CLEARED
acknowledgeDataRepairs (machine-ish)            armed=true storeMoved=true  rollbackAfter=CLEARED
dismissIntentRollback (the intent's own clearer) armed=true storeMoved=false rollbackAfter=CLEARED
```

**Did the fix preserve what the site did right?** Yes — the immediate Undo still works
(`storeActions.test.ts:690-694`, and the wrapper is keyed on `patch.store !== state.store`, so the
arming patch — which sets both keys at once — does not self-invalidate). The `else`-branch risk I went
looking for was a **dead Undo button**: an invalidated snapshot with the card still on screen. It cannot
happen — `index.tsx:622` renders the card as `{intentRollback && activeAck === 'intent' ? … }`, so the
card disappears with the snapshot rather than becoming an inert button.

⚠️ **The one over-match, and it is `minor` — see §5.** The rule is a class ("somebody else's write"), and
the four `machine=true` rows above are not somebody else's *edit*; they are the app's own bookkeeping.
Filed as `minor` in §5 with its reasoning.

**Would anything catch it un-fixing?** `apps/rn/src/store/storeActions.test.ts:678-728` — five blocks.
The carrying assertion is `:701` `eq(edited.getState().intentRollback, null, …)`; on the original defect
(nothing ever cleared it) that reds. Rule 6: `:692`, `:694` and `:699` all pass **with** the defect
present, so `:701` is genuinely reached. Doors 2 and 3 (`importStore` `:711`, `reset()` `:719`) are
pinned too, and `:726` is the control on the rule itself. ✅ Ran in CI at `78c6020` (`test:app`).

---

### B3 — two money moves sharing one `cycleTopUp` record — **CLOSED**

**Is the original behaviour gone? Measured**, including three shapes the tests do *not* cover:

```
--- variant A: two sources, two goals ---
after both draws     goals=[[S1,30],[S2,10]]  rec.amount=120 entries=[[guardian,S1,70],[affordability,S2,50]] guardianCard={a:70,g:S1}
after guardian undo  goals=[[S1,100],[S2,10]] rec.amount=50  entries=[[affordability,S2,50]]                  guardianCard=null
--- variant B: one goal, four undos ---
after both draws     goals=[[S1,380]]         rec.amount=120 entries=[[guardian,S1,70],[affordability,S1,50]]
after 4 undos        goals=[[S1,500]]         rec.amount=0   entries=[]
--- NOT covered by the tests: SAME source, DIFFERENT goal ---
tap1 guardian->S1 (asked 100, has 40)  goals=[[S1,0],[S2,300]]   rec.amount=40  entries=[[guardian,S1,40]]
tap2 guardian->S2 (60)                 goals=[[S1,0],[S2,240]]   rec.amount=100 entries=[[guardian,S2,60],[guardian,S1,40]]
undo #1                                goals=[[S1,0],[S2,300]]   rec.amount=40  entries=[[guardian,S1,40]]
undo #2                                goals=[[S1,40],[S2,300]]  rec.amount=0   entries=[]
--- over-draw ---   asked 99999 of 500 -> goals=[[S1,0]] rec.amount=500   (the record equals what LEFT)
--- missing goal --- applyTightTopUp('guardian','NOPE',100) -> goals unchanged, no record written
--- legacy blob (amount/goalId, no entries) --- reads as one guardian entry of 80; undo returns 80 to S1
```

**Money is conserved in every row**, including the two shapes the class-of-one tests never picked. The
same-source/different-goal shape produces two `guardian` entries; `selectAppliedTopUp`'s `.find()` takes
the newest, and the older draw is still returned by a second undo — no money is stranded and none is
invented. **`amount` is derived** (`topUpSelectors.ts:47`), so Σ entries = what left the goals by
construction.

**Did the fix preserve what the site did right?** Yes. `AffordabilityCard.tsx:99` now reverses from the
store (`undoTightTopUp('affordability')`) rather than from `applied.cover`, and the amount it draws is
already clamped to the goal at compute time (`guardianSelectors.ts:439`
`Math.min(gap, goal.currentAmount)`), so the card's own display cannot overstate what moved.

**Would anything catch it un-fixing?** `storeActions.test.ts:179-231`. Carrying assertions:
`:202` (`selectAppliedTopUp(...)?.amount === 70` — the old code returned the shared 120) and `:206`
(`bal(s,'S1') === 100` — the $70 used to land in S2). Rule 6: `:199` (`cycleTopUp?.amount === 120`) is
true under **both** implementations, so it does not mask them. Variant B's `:223` and `:227` pin the
invented-$50 half. ✅ Ran in CI at `78c6020`.

---

### B4 — `converting` set once and never cleared — **CLOSED**

**Is the original behaviour gone?** Yes, structurally. `convertingExpenseId` is now a field of
`money.tsx:224`'s `sheet` object, and **every** writer replaces the whole object:
`grep -n "setSheet\|openEditor(" money.tsx` returns 20 lines, of which the writers in the Debts section
are `:243`, `:244`, `:250`, `:271`, `:282`, `:286`, `:300`, `:311` — `:250` (the conversion effect) is
the only one that ever sets the key, and `:282`/`:286`/`:300`/`:329`/`:442` are `setSheet(null)`. There
is no partial update anywhere, so the flag cannot outlive its sheet.

**Did the fix preserve what the site did right?** Yes — a real conversion still routes through
`convertExpenseToDebt` (`DebtSheet.tsx:190`), and the conversion-specific copy is still keyed on the
same flag (`DebtSheet.tsx:278`, `:282`), so the sheet still announces itself as a conversion when it is
one.

**Would anything catch it un-fixing?** `apps/rn/tests/e2e/misfiled-expense.spec.ts:106-146`. The
carrying assertion is the `expect.poll(...).toEqual({ debts: ['Card','New Visa'], expenses: ['Mortgage','Rent'] })`
at `:132-145` — read out of `localStorage`, so it is a statement about the persisted store rather than
about pixels, and on the original defect `Mortgage` is deleted and the object differs. ⚡ Rule 10 is
handled explicitly by the fixture: **two** bills, so "one bill missing" cannot be confused with "a
fixture that never had it". ✅ Ran in CI at `78c6020`.

---

### B5 — *"You're caught up for this paycheck."* in success green over unpaid bills — **CLOSED**

**Is the original behaviour gone? Measured**, printing the old expression and the new one side by side
over the real engine (`selectAllocation` → `selectRequiredRows` → `countOutstandingRequired`):

```
== B5's measured case — Rent paid and consumes the paycheck; Electric + Phone unfundable
  shortfall             = 200
  rows                  = [["Pay Rent","e:rent",handled]]
  unfundedRequiredItems = [["Pay Electric","e:elec",120],["Pay Phone","e:phone",80]]
  OLD  unhandled + unfunded.length                = 2
  OLD  (premium, unfunded emptied)                = 0     <- the blocker
  NEW  countOutstandingRequired(rows, unfunded)   = 2

== the double-count case — 5 obligations, 6 list entries
  rows                  = [["Pay Rent","e:rent"],["Pay Electric (partial)","e:elec"]]
  unfundedRequiredItems = [["Finish Electric","e:elec",200],["Pay Phone","e:phone",80],["Pay Water","e:water",60],["Pay minimum on Visa","d:visa",50]]
  OLD  unhandled + unfunded.length                = 6     <- the double-count
  NEW  countOutstandingRequired(rows, unfunded)   = 5

== control — everything funded
  OLD = 0   NEW = 0
```

⚡ **`0` and `2` are the two numbers the finding is about, and both are printed.** The `e:elec` key
appearing in both `rows` and `unfundedRequiredItems` is the double-count, visible in the data rather
than argued.

**Did the fix preserve what the site did right?** Yes, and this is the half worth pressing, because MF.6
(*"the Recovery Plan owns the shortfall, so this card must not offer a competing plan"*) is a standing
decision three lines from the change — reading rule 9's exact shape. The array is now always true and
`shortfallAdviceOwnedElsewhere` (`index.tsx:516`) changes the **wording**
(`RequiredActionsCard.tsx:171-173`: *"your recovery plan below works through these"* vs *"cover these
from savings or your next paycheck"*). MF.6 survives; only its implementation moved.

**Would anything catch it un-fixing?** `apps/rn/tests/e2e/no-bills-branch.spec.ts:141-153` (premium in a
shortfall), `:159-168` (the free control — *"the tier does not change what is owed"*), `:176-190`
(**MF.6 preserved**, so a fix that simply deleted `shortfallAdviceOwnedElsewhere` reds), `:210-225` (the
count is of obligations → `toHaveText('5')`). Rules 7 and 10 both handled: every test asserts
`'Required actions'` visible **first**, and the absence of the sentence is backed by a **positive**
`required-outstanding-count` assertion, so a blank page cannot pass. ✅ Ran in CI at `78c6020`.

---

### M5–M10 — the six instrument majors — **all CLOSED**

| # | verdict | measured |
|---|---|---|
| **M5** `test:gate-plants` in no chain | **CLOSED** | `run-gates.ts:73` now lists `'test:gate-plants'`; `run-gates.ts` **is** `lint:rn`, which CI runs at `.github/workflows/web-e2e.yml:92`. `grep -n "test:gate-plants\|test-gate-plants" package.json .github/workflows/*.yml scripts/run-gates.ts` → **2 hits**: the `package.json` definition and the `run-gates` entry. ⚠️ ⛔ **I did NOT run `lint:rn`** — it now plants `apps/rn/src/__gate_plant__.ts` / `.tsx` (`test-gate-plants.ts:58-86`), which would dirty the tree. The green CI run at `78c6020` executed it. |
| **M6** boundary only for identifier-shaped tokens | **CLOSED** | `present`/`presentInCode` lifted verbatim and run against the three renames the docblock names — **the docblock's claim re-measured and TRUE:**<br>`function isClamp` → `function isClampLegacy` — OLD `GREEN(fail-open)` · **NEW `RED`**<br>`export function selfCheck` → `…selfCheckAll` — OLD `GREEN` · **NEW `RED`**<br>`cat-file` → `cat-file-batched` — OLD `GREEN` · **NEW `RED`** |
| **M7** tokens surviving on a comment line | **CLOSED** | Re-measured across the **whole** 73-entry registry, not sampled: `guarded(in code)=57 · comment-only=0 · unguarded(no token/file)=16 · missing-file=0`. ⚡ And the class the fix closes is **wider now than when it was measured**: delete every non-comment line carrying the token and the **pre-fix** rule still reports GREEN for **8** entries (`S1-SECRETS-EXEMPT`, `REVERIFY4-2`, `REVERIFY4-3`, `GUARDED-1`, `GUARDED-5`, `S1P1-M7-CODELINE`, `S1P1-M9-ROUTING`, `S1P1-M1-CALL`) — the docblock said five, against a 34-entry registry. Same mechanism, larger registry. |
| **M8** `MIN_ENTRIES = 24` against 34 | **CLOSED** | Both floors are `!==` now. Live: `73` ids against `MIN_ENTRIES = 73`, `16` unguarded against `MAX_UNGUARDED = 16`. `lint:finding-guards` → `57 of 73 findings carry a standing guard; 16 unguarded (cap 16, downward-only).` Zero slack in both directions. |
| **M9** the S1 surface under-counts / any claim value reads as swept | **CLOSED** | See the routing measurement below. |
| **M10** the secrets exemption keyed per value | **CLOSED** | `lint:secrets:authoring` (`--working-tree`), §3 above. |

#### M9, and the trap its own docblock names — measured, **0 holes**

M9's fix turns `excluded` from `boolean` into a `Routing`, validates `to` against `KNOWN_SURFACES`, and
adds an allow-list for claim values. The docblock states the residual danger itself: *"The trap is a
routing to a LIVE surface whose roots do not cover the file."* **That is checkable, so I checked it**, by
replaying the S1 walk and every routing predicate against the two claims files:

```
S4_OWNED lifted from source: 11 entries
S1 walk: 290 files · 188 kept · 102 routed
claims files: s0=91  s1=188
kept vs s1 claims match: true
  -> none: 2    -> s0: 18    -> s2: 1    -> s3: 35    -> s4: 46

=== a routing to a LIVE surface whose roots do not cover the file ===
  holes: 0
  routed to s0 (all 18 verified present on the S0 surface):
    apps/rn/src/data/migrationAudit/{audit.test,corpus,cutoverFiles.test,doors,hostile.test,interruption.test,invariants,run}
    apps/rn/tests/shots/{add-chooser,demo-beats,explore-demo,floor-impact,guardian-spacing,misfiled-hint,money-sections,p6.8-a11y,p6.8-matrix,phase35-themes}.shot.ts
```

The 188 kept files reproduce the s1 claims file **exactly**, and every one of the 18 files S1 hands to S0
is present on S0's 91. Routings to `s2`/`s3`/`s4` (82 files) record an owner for a surface not yet built —
that is the documented decision, not a hole I am minting.

---

### M1 — the grouped Expenses list and the receipt ENUMERATED instead of partitioning — **CLOSED**

**Is the original behaviour gone? Measured on the condition, not on the cited example** (reading rule 4).
`resolveBillCategory` (`obligationForm.ts:87-89`) run over ten spellings, with the deferability consumer
printed beside it:

```
BILL_CATEGORY_ORDER = ["housing","utilities","insurance","subscriptions","discretionary","medical","other"]
'other' is a member  = true          picker options = the same seven

category                    resolved     rendered-under   deferability
  absent                    other        Other            essential
  undefined                 other        Other            essential
  null (from JSON)          other        Other            essential
  'groceries' (unknown)     other        Other            essential
  'Housing' (wrong case)    other        Other            essential
  ' housing' (leading space)other        Other            essential
  '' (empty)                other        Other            essential
  42 (a number)             other        Other            essential
  'housing' (valid)         housing      Housing          essential
  'other' (valid)           other        Other            essential

10 bills, $100 total
  OLD  e.category === cat             -> 2 rendered, $20 in the receipt   (8 DROPPED)
  NEW  resolveBillCategory(e) === cat -> 10 rendered, $100 in the receipt  (0 dropped)
```

⚡ **The wrong-case, leading-space, empty-string and numeric spellings were in nobody's list and are all
handled**, because the fix tests membership rather than enumerating spellings.

**Did the fix preserve what the site did right?** Yes, and I checked the two ways it could have
over-matched:
- **A valid category is never reclassified** — the `'housing'` row above.
- **The PICKER is still an enumeration**, which is correct: `billCategoryOptions()` (`:64-66`) is
  untouched and still `BILL_CATEGORY_ORDER.map`. The docblock draws that distinction and it holds.
- **Every consumer, not just the two fixed:** `grep -rn "BILL_CATEGORY_ORDER\|BILL_CATEGORY_LABEL"` over
  `apps/rn/src` + `packages` returns **13 hits in 2 files** — `money.tsx:605`/`:655` (both fixed) and
  `obligationForm.ts` (the definitions + the picker). There is no third enumeration site. The only other
  reader of `expense.category` in the engine is
  `packages/core/obligations/classifyDeferability.ts:19`, which is a **membership test with a safe
  default** (`essential`) — measured above, every unrecognised spelling lands `essential`, so nothing
  became deferrable.

**Would anything catch it un-fixing?** `apps/rn/tests/e2e/bill-category-partition.spec.ts` — four tests:
the grouped list (`:61`), search (`:78`), the sheet round-trip (`:88`, which is AS-1), the receipt
(`:116`). The construction is careful in the ways this brief names: the wait helper is on a **row** not a
heading (`:58`, with the reason stated), both classes are asserted so an "everything is Other" plant reds
(`:73-75`), and the receipt assertions are **scoped to `getByRole('dialog')`** so the list behind cannot
satisfy them.
⛔ **It has never been executed** (see the CI measurement above). Two things I checked because of that:
- `getByRole('dialog')` appears **only** in this spec — 0 other uses across 63 e2e files. It does resolve:
  `react-native-web/dist/exports/Modal/ModalContent.js:44` sets `role: active ? 'dialog' : null`. And the
  labels match the source — `ExpenseSheet.tsx:101` `'Edit expense'`, `:103` `submitLabel` `'Save'`.
- `money-hero-expenses-value` exists (`money.tsx:760`) and the hero is pressable whenever
  `recurring.length > 0` (`:765`), which the 9-bill fixture satisfies; `BILL_GROUPING_THRESHOLD = 8`
  (`:555`) so the grouped branch — the only one the defect lives in — is the branch under test.

⚠️ **What `resolveBillCategory` silently does, recorded rather than filed:** it reclassifies an
unrecognised value at **render** time, and AS-1 then writes `'other'` back on the next save. So a bill
imported as `category: 'groceries'` loses that word permanently the first time the user opens and saves
its row. That is the deliberate remedy and the alternative is a value the app cannot render; it is
recorded here so it is not rediscovered as a finding. **No money moves and no figure changes** — measured
above, the deferability verdict is identical.

---

### M2 — an over-funded goal printed `targetAmount` under the label `saved` — **CLOSED**

**Measured**, evaluating `money.tsx:1048-1083`'s expressions line-for-line against the pre-fix ones,
through `runMigrations`:

```
== M2 — an OVER-FUNDED goal (the finding)
   target=1000 current=5000   OLD "$1,000 saved"   NEW "$5,000 saved"   badge=Funded   progress=500%
== M2 control — exactly at target
   target=1000 current=1000   OLD "$1,000 saved"   NEW "$1,000 saved"   badge=Funded   progress=100%
== M2 control — under target
   target=1000 current= 300   OLD   "$700 left"    NEW   "$700 left"    badge=-        progress=30%
```

⚡ **Only the over-funded row moved.** The exactly-at row is byte-identical and the under-funded row is
untouched, so the fix is a correction rather than a substitution — measured, not argued.

**Would anything catch it?** `apps/rn/tests/e2e/goal-row-saved.spec.ts:36-60` asserts all three states off
the **accessible name** — which `ListRow.tsx:86-89` composes as
`[title, badges, meta+caption, amount+suffix]`, so `/\$5,000 saved/`, `/\$2,000 saved/` and
`/\$1,500 left/` are all real reads of the rendered row. `:43` is the carrying assertion and reds on the
original (`$1,000 saved`). ⛔ Never executed.

---

### AS-2 — a goal whose target could not be read printed *"$0 left"* — **CLOSED** (with a residue in §5)

**Measured:**

```
== AS-2 — an UNREADABLE target ('abc' → repaired to 0, kind 'lost')
   repairs = ["goal.targetAmount:lost"]   unreadGoals = true
   target=0 current=500   OLD "$0 left"   NEW "$500 saved"   badge=-   caption="Target could not be read"   progress=hidden
```

`.11.4`'s badge suppression survives (`badge=-`), the remainder branch no longer states `$0`, and the
progress bar — which would have drawn 0% over $500 — is dropped. Pinned by
`goal-row-saved.spec.ts:72-89`, whose **positive** assertion (`/\$500 saved/`, `:83`) comes first and
reds on the original. ⛔ Never executed.

⚠️ One measured residue — the caption can fire on a goal that was read fine. **§5, item 3.**

---

### AS-1 — `ExpenseSheet` seeded its picker from `editing?.category ?? 'other'` — **CLOSED**

`ExpenseSheet.tsx:36-42` is now `resolveBillCategory(editing ?? {})`. Checked both directions: `editing ===
null` (the add path) yields `'other'` exactly as `?? 'other'` did, and an unrecognised value now yields
`'other'` where it previously fell through to `Select`'s `?? 'Select'` fallback. Pinned by
`bill-category-partition.spec.ts:88-114`, whose carrying assertion is the **positive** one at `:103`
(`sheet.getByText('Other')`, scoped so the group heading behind cannot satisfy it) with the
`localStorage` round-trip at `:106-113` behind it. ⛔ Never executed.

---

### M3 — an applied top-up talked the band out of a shortfall — **CLOSED**, and the docblock's numbers re-measured

**The fix's own docblock asserts a measured result. I re-measured it** (reading rule 1 — including on the
long docblocks these fixes added), replaying the exact fixture it names ($2,000 paycheck · $1,900 rent ·
$400 surprise · $200 from a goal) and computing the **pre-fix** band with `computeState` alone:

```
cycleTopUp PRESENT -> shortfall 300 · discretionary passed = 200 · OLD state clear   · NEW state at-risk
cycleTopUp ABSENT  -> shortfall 300 · discretionary passed =   0 · OLD state at-risk · NEW state at-risk
detail (both) = "You’re about $300 short of the expenses due before your next paycheck — this one needs a plan."
```

⚡ **True as written.** The recorded top-up is the only variable, it moved the band from `at-risk` to
`clear`, and `detail` is present in both — which is exactly why the unit test at
`guardianSelectors.test.ts:305` is labelled a *precondition* rather than a guard, and why the render gate
had to be pinned in an e2e. That labelling is correct.

**Did the fix preserve what the site did right?** Yes at this seam, and the tests say so in both
directions: a **covered** cycle with a top-up is still `clear`
(`guardianSelectors.test.ts:319`), and `tight` still exists between them (`:324`). The branch is gated on
`shortfall > 0`, so it can only push a band **down**.

**Would anything catch it un-fixing?**
- `packages/core/guardian/testBuildGuardianBrief.ts:71-72` —
  `input({ shortfall: 180, discretionary: 400, kept: 400, floor: 200 })` → `at-risk`. This is the row the
  brief's reading rule 2 demands: the pre-existing row at `:57` handed the function
  `discretionary: 0`, the one member of the class that works. ✅ **`npm run test:regression` is green on
  this tree**, so this row has actually executed.
- `apps/rn/src/store/guardianSelectors.test.ts:283-342`. ✅ **`npm run test:app` green on this tree.**
- `apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts` — the render gate, the only place it can be pinned.
  ⛔ Never executed.

---

### AS-3 — `selectAffordability` called a purchase `tight` while the cycle was short — **PARTIAL · major**

**The stated defect is gone.** The docblock's table re-measured, and it is true as written:

```
short 400, topUp 200, buy 150   spendable=0  OLD discNow=200  NEW discNow=0
                                OLD → tight, cushionAfter 50, shortBy 0   (the defect)
                                NEW → short, cushionAfter  0, shortBy 150 ✓ matches the no-top-up control
short 400, NO topUp,  buy 150   NEW → short, cushionAfter  0, shortBy 150   (unchanged)
covered, topUp 200,   buy 150   NEW discNow=1200 → comfortable, cushionAfter 1050   (unmoved — 3.7.A3.6 preserved)
```

⛔ **But the blanket `0` is over-matched, and the over-match is reachable at default settings.** See
**§2, finding A1.** The seam's pre-fix behaviour was the app's arithmetic model of *cash the user has
already moved into checking*; replacing it with `0` for the whole shortfall range makes the card state a
false dollar figure whenever the move was larger than the cycle turned out to be short.

---

### M4 — `PlanHero`'s paycheck split stopped conserving in a shortfall — **CLOSED** (with a `minor` in §5)

**The docblock tabulates three measured rows. Re-measured through the real engine**
(`selectAllocation` → `selectPlanSummary`, then `PlanHero.tsx:64-95`'s expressions):

```
                                        hero  requiredTotal shortfall | OLD Required  sum      | NEW Required SpokenFor Flexible  sum
healthy   (2000 in, 1000 bills)         2000     1000          0      |     1000     2000 ✓   |    1000        0       1000    2000 ✓
short     (1000 in, 1330 bills)         1000     1330        330      |     1330     1330 ⛔  |    1000        0          0    1000 ✓
short + everyday (1000, 1330, liv 300)  1000     1330        630      |     1330     1630 ⛔  |     700      300          0    1000 ✓
covered + living 400                    2000     1000          0      |     1000     2000 ✓   |    1000      400        600    2000 ✓
exactly covered (2000 bills)            2000     2000          0      |     2000     2000 ✓   |    2000        0          0    2000 ✓
covered, tiny remainder (1990)          2000     1990          0      |     1990     2000 ✓   |    1990        0         10    2000 ✓
```

⚡ **Conservation holds in every row, and no covered row moved by a cent** — the docblock's *"shortfall is
0 on every covered cycle, so no on-track hero can move"* is true by measurement, not just by reading.

**The half the brief told me to press: `PAYCHECK_SEGMENT.required`'s own docstring.** It still reads
*"Bills + minimums that must be paid this cycle"* (`packages/core/copy/vocabulary.ts:47-48`) while the
number it now labels is what the paycheck **funded**:

```
paycheck $1000, bills $1330:  OWED $1330  ·  hero prints "Required $1000"  ·  understated by $330
paycheck $1000, bills $2500:  OWED $2500  ·  hero prints "Required $1000"  ·  understated by $1500
paycheck $2000, bills $2001:  OWED $2001  ·  hero prints "Required $2000"  ·  understated by $1
```

**Not a major, and here is the measurement that decides it rather than a re-rating.** Three things:
1. **The gap is stated by name and by amount on the same screen, for both tiers.** `statusLabel`
   (`PlanHero.tsx:130-134`) renders *"Short this paycheck"* directly beneath; and since **B5**,
   `RequiredActionsCard` prints every unfunded obligation with its own amount and a count Pill
   (`required-outstanding-count`), for free users too — measured in B5 above: `2` and `5`.
2. **The pre-fix state was not better.** The old number was right and the *bar* was silently wrong —
   parts summing to `1630` of a `1000` track, normalised away by `flexGrow`. There is no reading on which
   the product is meaningfully worse than before.
3. **The word is not overloaded onto two figures.** `PAYCHECK_SEGMENT.required`'s only other consumer is
   `PaydayCaptureSheet.tsx:303`, where it is a per-**row** caption (*"this item is required"*), not a
   total — so vocabulary.ts's *"one word per figure"* rule is not broken.

⚠️ The docstring is nevertheless a carried premise that has decayed inside this fix range. **§5, item 4.**

**Would anything catch it un-fixing?** `apps/rn/tests/e2e/plan-hero-conserves.spec.ts` — asserts the
**invariant** (segments sum to the headline) off the hero's `aria-label`, which `PlanHero.tsx:138-145`
composes as `This paycheck $X. Required $A, Spoken for $B, Flexible $C. … Short this paycheck`. Three
things I checked because it has never run: the parse is **guarded** (`:60-62` — nulls would make
`0 === 0` read as conserving, and that is refused); the healthy test pins the literal `950` so a
`required = 0` fix cannot pass trivially (`:84`); and `segments` is `.filter(seg => seg.value > 0)` (`PlanHero.tsx:120`) so
`Flexible` is legitimately absent in a shortfall and `?? 0` is the right handling. On the original defect
the shortfall row sums to `1700` against a `1000` headline and `:66` reds. ⛔ Never executed.

---

## 5. Measured, and NOT a defect — recorded so pass 3 does not re-open them

**1. B2's invalidation also fires on the app's OWN bookkeeping writes — and there is no dead button.**
`minor`. The rule is a class (*"any patch that moves `store` without mentioning `intentRollback`"*), so
machine writes clear the snapshot too. Measured, all seven writers printed in §4 — `applyRiskNotified`,
`markReviewPrompted`, `setLastHandledPayday`, `updatePrefs` and `acknowledgeDataRepairs` all `CLEARED`.
The consequence is bounded and visible rather than silent: `index.tsx:622` renders the Undo card as
`{intentRollback && activeAck === 'intent' ? … }`, so the card **disappears with the snapshot** — the
user never taps a button that does nothing. And the most likely candidate is already blocked:
`coachMarks.ts:154` writes `updatePrefs({coachMarksSeen})`, but `index.tsx:282` suppresses coach marks
whenever an ack is active, and the Undo card *is* an ack (`activeAck === 'intent'`). The remaining
writers (`applyRiskNotified` via `use-notification-sync.ts:68`) are premium + native + rate-limited.
**Not a major: a lost affordance, visibly lost, in the conservative direction.**

**2. B3's same-source/different-goal shape is not covered by any test, and is correct anyway.** Two taps
of the Guardian top-up against different goals produce **two `guardian` entries**;
`selectAppliedTopUp`'s `.find()` returns the newest and each undo returns its own draw to its own goal.
Measured in §4 — money conserved at every step (`S1 0/S2 240` → undo → `S1 0/S2 300` → undo → `S1 40/S2
300`), record never negative, `goalId` correctly omitted when there are two live entries. **No finding.**

**3. AS-2's *"Target could not be read"* caption can fire on a goal that was read fine — and I could not
find an input that produces it.** `money.tsx:1048` is `unreadGoals && g.targetAmount === 0`, where
`unreadGoals` is **store-wide** (`trustSelectors.ts:56` — any non-recovered repair on any goal). So a
goal holding an **explicit** `targetAmount: 0` — which records no repair — is captioned as unreadable
whenever some *other* goal has one. Measured:

```
== one unreadable target, plus a goal with an EXPLICIT target of 0
   repairs = ["goal.targetAmount:lost"]   unreadGoals = true
   {"name":"Unreadable",   "target":0,"current":500,"NEW":"$500 saved","caption":"Target could not be read"}   correct
   {"name":"Explicit zero","target":0,"current":250,"NEW":"$250 saved","caption":"Target could not be read"}   ⛔ false
== a repair on a DIFFERENT goal's priorityPerPaycheck, plus an explicit 0 target
   repairs = ["goal.the per-paycheck amount could not be read…:lost"]   unreadGoals = true
   {"name":"Bad pace",     "target":1000,"current":10,"NEW":"$990 left","caption":"-"}                          correct
   {"name":"Explicit zero","target":0,"current":250,"NEW":"$250 saved","caption":"Target could not be read"}   ⛔ false
```

⛔ **Filed here rather than in §2 because the input is not producible by either app version, and that is
measured too.** v1.7 refuses it — `GoalSheet.tsx:101` uses `parseAmountField`, which returns `null`
unless `n > 0`. **v1.6 refuses it too**, at both doors: `git show origin/v1.6-dev:lib/hooks/useGoals.ts:38`
(`if (!targetAmount || targetAmount <= 0)`) and `components/GoalsSection.tsx:83`
(`targetAmount <= 0` → error). So a $0-target goal can only arrive through a hand-edited or foreign JSON
restore. ⚠️ **Also note the pre-existing hero says the same thing** on the same condition
(`money.tsx:1008` `targetUnread = unreadGoals && goals.some(g => g.targetAmount === 0)`, from `.11.4`) —
AS-2 did not introduce the imprecision, it moved it from a suppression to an assertion.
**The remedy, one expression, and the data for it is already there:** `DataRepair` carries `id`
(`models.ts:256`), so the guard can be per-goal —
`pendingDataRepairs.some(r => r.entity === 'goal' && r.id === g.id && r.field === 'targetAmount' && r.kind !== 'recovered')`.
**If a future pass finds a producer for a $0 target, this becomes a major.**

**4. `PAYCHECK_SEGMENT.required`'s docstring no longer describes the number it labels.** `minor`.
`vocabulary.ts:47-48` says *"Bills + minimums that must be paid this cycle"*; after M4 the hero passes it
`requiredTotal − shortfall`, which is what the paycheck **funded**. Measured in §4 (`Required $1,000` over
`$1,330` owed). Filed `minor` and not `major` for the three reasons given there — the gap is named and
priced on the same screen for both tiers, the pre-fix state was strictly worse, and the word is not
overloaded onto a second total. **The one-line remedy:** restate it as *"the part of this paycheck that
goes to bills + minimums"*, and say in `PlanHero.tsx:83` that the segment is the funded half. This is
reading rule 1's own class — a comment that decayed — inside the fix range, so it is recorded rather than
left.

**5. `lint:secrets --working-tree` never reads a MODIFIED TRACKED file.** `minor`, §3. It walks
`git ls-files --others` only. The committed scan still catches such a value at `index` time, before push.

**6. `lint:gate-freshness` is RED on this tree, and that is correct.** Recorded at `78c6020`, 807 files,
fingerprint differs — because `e2b6627` and `4b58d75` moved source afterwards. The instrument is right;
the fact it reports (below) is the finding-shaped part.

**7. The four `Routing` values S1 computes are never printed.** `surface-coverage.ts:332-343` builds
`routed` and reads it only for `badRoutes`; `--report` lists claims, not routings. So *"which surface owns
this file and why"* is answerable only by reading the predicate. `minor` — no instrument is blinded (the
`KNOWN_SURFACES` check is the one that matters and it runs), but the 102 routed files are invisible to a
reader of the report.

---

## 6. Could not determine — with what would settle it

**1. Whether M1–M4's four e2e specs pass at all.** They have **never been executed by anything** — no CI
run exists after `78c6020` (`gh run list` printed in §4) and `lint:gate-freshness` says no local
`validate:release:rn` has run either. I did not run Playwright: its `webServer` runs
`expo export --platform web`, which writes `apps/rn/dist/`, and this pass is read-only over the repo.
Everything I could settle statically I did settle — `typecheck:tests` is green, every locator's target
exists in the source, `role="dialog"` really is emitted by
`react-native-web/dist/exports/Modal/ModalContent.js:44`, and the asserted strings match the components
byte-for-byte. **What settles it: one `npm run test:e2e:rn` run**, or a CI push.
⚠️ Note the direction of the risk: every construction I checked fails **loud** (a zero-match `getByRole`
makes `toBeVisible()` fail, the `plan-hero-conserves` parse is null-guarded), so the plausible failure is
a red gate, not a false green.

**2. Whether AS-3 should net or blanket-zero.** Finding A1 shows the current rule contradicts
`holdsLine`; it does **not** show which of the two should move. That is a product call about what
*"spare"* means once savings have been moved into checking, and it belongs to 🎯. What I can settle is
that the three seams must give one answer — measured, today they give two.

**3. Whether `test:gate-plants` still passes now that it is inside `lint:rn`.** It did at `78c6020` (CI
green). I did not re-run it because it writes `apps/rn/src/__gate_plant__.tsx`. **What settles it: the
next CI push.**

---

## 7. Swept and found clean — BY PATH

⛔ **Every path I opened**, so pass 3 extends rather than re-reads. Files where I read only the changed
part are marked *(at the change)*.

**Instruments — `scripts/`**
- `scripts/finding-guards.json` — all 73 entries enumerated programmatically
- `scripts/check-finding-guards.ts` — `present`, `presentInCode`, both floors, the dupe check
- `scripts/check-committed-secrets.ts` — whole file incl. the +55 `--working-tree` block and all 4 `PATTERNS`
- `scripts/surface-coverage.ts` — whole file: `Routing`, `KNOWN_SURFACES`, `VALID_CLAIMS`, `S4_OWNED`, both surfaces' roots + `excluded`, the walk, the report and the inventory writer
- `scripts/surface-coverage.s0.json`, `scripts/surface-coverage.s1.json` — key sets compared against the walk
- `scripts/run-gates.ts` *(at the change)* — the `test:gate-plants` entry
- `scripts/strings-inventory.ts:485-575` — the `--gate` branch, the stale-baseline report, `exit(0)`
- `scripts/duplicate-copy-baseline.json` — all 3 entries
- `scripts/tsconfig.json` — checked for `noUnusedLocals` (absent)
- `package.json` — every `scripts` entry, `validate:release:rn`'s chain order
- `.github/workflows/web-e2e.yml` *(at the run steps)*
- **NOT opened** (unchanged since pass 1 verified them, and re-verified only by running their gates):
  `write-gate-status.ts`, `begin-gate-run.ts`, `gateSources.ts`, `check-type-scale.ts`,
  `preflight-native-lane.ts`, `test-gate-plants.ts`

**Store + engine**
- `apps/rn/src/store/trustSelectors.ts` — whole file
- `apps/rn/src/store/trustSelectors.test.ts` — whole file
- `apps/rn/src/store/topUpSelectors.ts` — whole file
- `apps/rn/src/store/obligationForm.ts:40-90` — `BILL_CATEGORY_ORDER`, `BILL_CATEGORY_LABEL`, `billCategoryOptions`, `resolveBillCategory`
- `apps/rn/src/store/store.ts` — the wrapped `set` (`:300-343`), the action list (`:425-900`), `applyTightTopUp`/`undoTightTopUp` (`:797-861`), `acknowledgeDataRepairs`, `importStore`
- `apps/rn/src/store/planSelectors.ts:235-300` (`requiredRowKey`, `rowHandledNow`, `unfundedItemKey`, `countOutstandingRequired`) and `:320-400` (`PlanState`, `selectPlanState`, `PlanSummary`, `heroFraming`)
- `apps/rn/src/store/guardianSelectors.ts:240-300` (`selectAppliedTopUp`, `appliedTopUp`, `holdsLine`), `:370-445` (`selectAffordability`, `coverFromSavings`), `:460-490`
- `apps/rn/src/store/guardianSelectors.test.ts` *(at the change — the `topUp` fixture field and the M3/M3b block, `:283-342`)*
- `apps/rn/src/store/storeActions.test.ts` *(at the changes — the top-up blocks `:140-231` and the B2 block `:678-728`)*
- `apps/rn/src/store/celebrationSelectors.ts:1-60` (`selectPaidOffDebts`, `isLastLiveDebt`)
- `apps/rn/src/store/sandboxStore.ts:255-320` (`seedSandbox`'s explicit `intentRollback: null`, the `setState` wrapper)
- `apps/rn/src/store/coachMarks.ts` *(at `:150-160`, `:200-206`)*
- `apps/rn/src/store/looksLikeDebt.test.ts`, `recoverySelectors.test.ts`, `sandboxStore.test.ts`, `coachMarks.test.ts` *(grep-level only — `setState` call sites)*
- `apps/rn/src/testing/runAppTests.ts` — the registration list
- `packages/core/guardian/buildGuardianBrief.ts` *(at the change — the band branch and its docblock)*
- `packages/core/guardian/testBuildGuardianBrief.ts` *(at the change — `:56-72`)*
- `packages/core/guardian/affordability.ts` — whole file (`computeAffordability`)
- `packages/core/obligations/classifyDeferability.ts` — whole file
- `packages/core/copy/vocabulary.ts:28-80` — `PAYCHECK_SEGMENT` and neighbours

**Screens + components**
- `apps/rn/src/app/(tabs)/money.tsx` — `:200-340` (the sheet state, `openEditor`, every `setSheet`), `:555-800` (`BillsSection`, `categoryBreakdown`, `sections`, the hero), `:960-1100` (`GoalsSection`, the goals hero, the row), `:1105-1145` (`MoneyHero`)
- `apps/rn/src/app/(tabs)/index.tsx` *(at the relevant parts — `:135-180`, `:230-260` (`activeAck`), `:280-370` (`planState` branches, `PaydayGuardianCard` wiring), `:495-540` (the B5 call site), `:615-640` (the Undo card))*
- `apps/rn/src/app/(tabs)/progress.tsx:145-215` — the `!view.hasDebts` branches
- `apps/rn/src/components/plan/RequiredActionsCard.tsx:60-190` — `outstanding`, both zero states, the unfunded block
- `apps/rn/src/components/plan/PlanHero.tsx:55-150` — the segments, `statusLabel`, the `a11y` composition
- `apps/rn/src/components/plan/AffordabilityCard.tsx:55-175` — `apply`, `coverAndApply`, `undo`, `verdictLine`
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx` *(at `:370-390` — the applied-top-up sentence)*
- `apps/rn/src/components/entities/ExpenseSheet.tsx:30-105` — the state seeds and the `FormSheet` props
- `apps/rn/src/components/entities/GoalSheet.tsx:90-145` — `submit()` and its validation
- `apps/rn/src/components/entities/DebtSheet.tsx` *(grep-level — every `convertingExpenseId` site)*
- `apps/rn/src/components/ui/ListRow.tsx` *(at `:20-95` — the accessible-name composition)*
- `apps/rn/src/components/ui/FormSheet.tsx` *(at the `Modal` + `submitLabel` sites)*
- `apps/rn/src/components/payday/PaydayCaptureSheet.tsx` *(at `:285-310` — the `PAYCHECK_SEGMENT.required` use)*
- `apps/rn/src/hooks/use-notification-sync.ts` — whole file
- `apps/rn/src/data/models.ts:240-275` (`DataRepair`), `:425-440` (`cycleTopUp`)
- `apps/rn/src/data/legacyBridge/mapLegacyStore.ts:55-95` — the `DIRECT` key map
- `apps/rn/playwright.config.ts` — `testDir`, `webServer`
- `apps/rn/tsconfig.json` *(at `paths`)*, `tsconfig.json` (root) *(at `compilerOptions`)*

**Specs**
- `apps/rn/tests/e2e/bill-category-partition.spec.ts` — whole file
- `apps/rn/tests/e2e/goal-row-saved.spec.ts` — whole file
- `apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts` — whole file
- `apps/rn/tests/e2e/plan-hero-conserves.spec.ts` — whole file
- `apps/rn/tests/e2e/progress-hero-journey.spec.ts` — whole file
- `apps/rn/tests/e2e/no-bills-branch.spec.ts:110-225` — the B5 half
- `apps/rn/tests/e2e/misfiled-expense.spec.ts:88-160` — the B4 half (test titles enumerated for the rest)

**Reports read (the ratchet)**
- `docs/audits/2026-08-26-s1-money-pass2/BRIEF.md`
- `docs/audits/2026-08-26-s1-money/A-fixes.md` — whole file
- `docs/audits/2026-08-26-s1-money/SUMMARY.md` *(at the M5–M10 rows and the [D69] table)*
- `docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-REVERIFY-4.md:1-200`

**Third-party, read to settle a claim**
- `apps/rn/node_modules/react-native-web/dist/exports/Modal/ModalContent.js` *(at `:44`)*

**Gates run** (all read-only; `git status` shows only the four auditors' report files):
`lint:secrets` · `lint:finding-guards` · `lint:s0-coverage` · `lint:s1-coverage` · `lint:copy` ·
`lint:type-scale` · `lint:lane` · `lint:gate-freshness` · `typecheck` (all four projects) · `test:app` ·
`test:regression`.
⛔ **NOT run:** `lint:rn` (it now chains `test:gate-plants`, which writes `apps/rn/src/__gate_plant__.{ts,tsx}`), `test:gate-plants` (same), `test:e2e:*`
(writes `apps/rn/dist/`), `validate:release:rn`, `gate:record`.
