# B2 — pass 7 findings (store core: how the number is written, migrated, remembered, re-read)

Lane B2 · 51 files · 9,078 lines. Written incrementally.

## B2-1 — `blocker` · `verifyDebtBalances` (batch) kept the `Math.max(0, NaN)` shape its own sibling was repaired for; the non-finite balance persists as `null` and re-reads as **$0**

**User-facing consequence.** A debt whose verified balance arrives non-finite through the *batch*
confirm is written to the store as `NaN`. For the rest of that session the app prints **`$0`** for a
$1,200 card (`formatCurrency(NaN) === '$0'` — measured), and the row is in **neither** the active
list nor the paid-off list, because `NaN > 0` and `NaN <= 0` are both false — it disappears from
Money while still being persisted. `JSON.stringify` writes it as `null`, and the next launch's
`runMigrations` coerces it to **`0`**; the $1,200 is gone and the user is asked to retype it.

⚠️ **I checked my own mechanism claim here and it was half wrong.** My first draft said the write
leaves *"no `pendingDataRepairs` entry, so no trust guard ever fires."* Measured: that is true
**in-session** (`pendingDataRepairs: []`) and **false on the next launch** — `readMoney(null)`
classifies it `lost`, so the migration does record
`{entity:'debt', id:'d1', field:'balance', kind:'lost'}` and the repairs card does appear. The
window in which the app states `$0` with no guard is one session; the money is lost permanently.

**File and line.** `apps/rn/src/store/store.ts:557-577` (`verifyDebtBalances`), specifically
line 558:

```ts
const next = new Map(entries.map((e) => [e.id, Math.max(0, Math.round(e.balance * 100) / 100)]));
```

The single-debt sibling twelve lines above (`store.ts:532-556`) carries the guard, added as
pass-6 `B2-5`, with a docblock that states the exact mechanism:

> `Math.max(0, NaN)` is `NaN`, so this was SHAPED like a guard and was not one.

**Measurement.** One store, one debt `d1` seeded at `balance: 1200` via `addDebt`, identical
`NaN` input down each path (probe run under `tsx --tsconfig apps/rn/tsconfig.json`, exit 0):

```
SINGLE  before / after balance:            1200 -> 1200        (refused)
BATCH   before / after balance:            1200 -> NaN         (written)
BATCH   Number.isFinite(after):            false
BATCH   originalBalance:                   1200                (high-water kept, so the ring reads NaN%)
after JSON round trip, debts[0].balance:   null    typeof object
after runMigrations, debts[0].balance:     0       typeof number
```

And the in-session state the user actually looks at, same store:

```
IN SESSION  balance                : NaN
IN SESSION  formatCurrency(balance): $0
IN SESSION  debts.filter(b > 0)    : 0 rows   (not in the active list)
IN SESSION  debts.filter(b <= 0)   : 0 rows   (nor in the paid-off list)
IN SESSION  pendingDataRepairs     : []
IN SESSION  pendingPayoff          : null     (no false finale — NaN <= 0 is false)
NEXT LAUNCH balance                : 0
NEXT LAUNCH pendingDataRepairs     : [{"entity":"debt","id":"d1","name":"Card","field":"balance","kind":"lost","count":1}]
```

⚡ The in-session shape is the one `scripts/finding-guards.json`'s `S1-ABSENT-REQUIRED` entry
describes word for word — *"in neither the active nor the paid-off list"*. That guard is over
`migrations.ts`; this door is upstream of it.

**Mechanism (HYPOTHESIS).** Pass-6 `B2-5` was fixed at the reported instance rather than at the
class. The two actions are the same transform at two arities, and the batch's own comment
(`store.ts:562-564`) asserts parity — *"a single-debt path that answers the repair while the batch
does not is precisely the 'wired to a subset of sites' shape this whole sub-step exists to end"* —
while the finiteness half of that parity was never carried across.

**Reachability, stated exactly as measured — I did NOT close the end-to-end UI chain.**
- The store API accepts it directly (measured above).
- Of the two call sites in `apps/rn/src/components/payday/PaydayCaptureSheet.tsx`, the *typed*
  one (`confirmEditedBalances`, line 158-166) is protected by `parseNonNegativeAmount`
  (`packages/core/utils/amountField.ts:68`, `Number.isFinite && n >= 0`). The *untyped* one,
  `confirmAllBalances` (line 143), forwards `v.currentBalance` **unparsed**.
- `currentBalance` is `projectCurrentBalance()` (`packages/core/debt/projectCurrentBalance.ts:60`),
  which ends in `roundMoney(Math.max(0, balance))` — NaN-transparent. Measured:
  `apr = NaN -> NaN`, `minimumPayment = NaN -> NaN`, clean input `-> 1146.16`.
- I could **not** produce a non-finite `apr` through `runMigrations` — a blob carrying `apr: 'n/a'`
  came back `apr: 0` with a `pendingDataRepairs` entry, and the projection returned `1080`. So the
  one chain I traced end-to-end is currently closed by the migration's repair, not by this action.

**Remedy — UNVERIFIED.** Refuse per entry the way the singular does, e.g. filter
`entries.filter((e) => Number.isFinite(e.balance))` before building the map, and (separately) have
`confirmAllBalances` route through the same parse its sibling button uses. ⚠️ Not measured: whether
dropping an entry silently is the right answer versus refusing the whole batch — the singular
returns without telling anyone either, which may be its own finding.

---

## B2-2 — `major` · pass-6 `B2-5`'s fix has **no test and no registered guard**: the un-fix was planted and the whole app-layer suite stayed green

**User-facing consequence.** None directly — this is the instrument half. The guard that stops a
corrupt balance being recorded as `$0` can be deleted in one line by anyone, at any time, and
nothing in the repo reds.

**File and line.** The fix: `apps/rn/src/store/store.ts:540`
(`if (!Number.isFinite(verifiedBalance)) return;`). The suite that should hold it:
`apps/rn/src/store/storeActions.test.ts:457-505` — it covers the negative clamp, the rounding and
the `originalBalance` high-water for *both* arities, and contains **no `NaN` case for either**
(`grep -n 'isFinite\|NaN' storeActions.test.ts` → the only hits are `setCushionFloor`, lines
433/442/443). `B2-5` appears **nowhere** in `scripts/finding-guards.json`.

**Measurement.** Copy of `store.ts` taken first, then two plants, then restore + `cmp`:

```
baseline                                   npm test:app  EXIT=0  "ALL PASSED"
PLANT A  delete store.ts:540 (the un-fix)  npm test:app  EXIT=0  "ALL PASSED"   <- survives
PLANT B  control: `... / 100) + 1`         npm test:app  EXIT=1  storeActions.test.ts:929
restore from the copy                      cmp OK; git status clean
```

⚠️ **Plant B is the control the brief asks for**: it proves the runner can SEE `verifyDebtBalance`
in this exact file, so Plant A's green is a real measurement and not a harness that never looked.

**Mechanism (HYPOTHESIS).** `B2-5` was closed as a code edit plus a docblock. The docblock is the
only artifact carrying the reason, and `lint:finding-guards` is a deletion detector over
`finding-guards.json` — a finding with no entry there is outside its reach entirely.

**Remedy — UNVERIFIED.** Add the `NaN` case to `storeActions.test.ts`'s existing
`verifyDebtBalance(s)` block for **both** arities (which would also red B2-1), and register
`S1P6-B2-5` in `scripts/finding-guards.json` pointing at the *use* of the guard, not its
declaration. Not measured: whether `prove:guards` accepts a store-action token of this shape.

---
## B2-3 — `blocker` · the debt-free **finale never fires on the rollover**, which is the app's own primary path to paying a debt off — and it is then unrecoverable

**User-facing consequence.** A user who does exactly what the product tells them to — tick the
minimum paid, run the payday roll — clears their last debt and the app says **nothing**. No finale,
no beat, and no 100% milestone either (`payday.ts:124` deliberately excludes 100% from
`computeMilestones` *"because it is owned by the payoff finale"*). Because `detectPayoff` is
TRANSITION-based, once every balance is `0` no later action can produce `liveBefore.length > 0`, so
the once-ever moment is gone for that portfolio permanently.

**File and line.**
- `apps/rn/src/store/store.ts:733-737` `rolloverPayCycle` — `set(... recordDriftBaseline(applyRollover(s.store), ...))`, **no `withPayoffCelebration`**.
- `apps/rn/src/store/store.ts:759-766` `applyPaydayLandedIntent` — same, no wrap.
- `apps/rn/src/store/store.ts:730-732` `capturePayday` — same, no wrap.
- The balance actually moves in `apps/rn/src/store/payday.ts:102-110` → `packages/core/debt/applyRolloverPayment.ts:66` (`return syncBnplRemaining({ ...debt, balance: 0 })`).
- `withPayoffCelebration` (`store.ts:68-81`) is the **sole** producer of `pendingPayoff`
  (`grep -rn 'pendingPayoff'` over `apps/rn/src` — the only other writes are the `null` default and
  `acknowledgePayoff`).

**Measurement.** One store, one debt `a` at `balance: 30`, `minimumPayment: 50`,
`minimumPaidThisCycle: true`. The **only** variable is which action moves it to `$0`:

```
A  rolloverPayCycle()          balance 30 -> 0   pendingPayoff: null      pendingMilestone: null
B  verifyDebtBalance('a', 0)   balance 30 -> 0   pendingPayoff: {"kind":"finale"}
C  applyPaydayLandedIntent()   balance 30 -> 0   pendingPayoff: null
```

Unrecoverable, measured on the post-roll store (A):

```
E  post-roll                   pendingPayoff: null
E  verifyDebtBalance('a', 0)   pendingPayoff: null
E  updateDebt('a',{balance:0}) pendingPayoff: null
E  logManualPayment('a', 10)   pendingPayoff: null
```

**Corroborated on the repo's OWN fixture.** `milestoneCross.test.ts:43-45` (case B) builds a store
whose single debt the rollover clears, and its comment says *"100% is debt-free (the finale's domain),
NEVER a mid-milestone."* Re-running that exact fixture and printing what the test does not assert:

```
case B  debts[0].balance     : 0
case B  pendingMilestone     : null      <- asserted by the test, "finale owns debt-free"
case B  pendingPayoff        : null      <- the finale it hands off to
case B  portfolioMaxProgress : 100
```

The portfolio reaches **100%** and **neither** channel stamps anything.

**Mechanism (HYPOTHESIS).** `withPayoffCelebration`'s docblock (`store.ts:39-67`) says it is
*"Wrapped around the four actions that can move a balance to zero, not bolted onto the one the
premium invitation happened to call"* — and it names the failure it fixed as attaching the beat to
a **premium estimator noticing a payoff** rather than to **the payoff**. The four it wraps are
`updateDebt`, `verifyDebtBalance`, `verifyDebtBalances` and `logManualPayment` — every one of them a
*user asserting a number*. **The engine's own paydown is a fifth balance-moving transform and was
not in the list.** The premise "four actions can move a balance to zero" is a carried claim that was
false when written: `applyRolloverPayment` sets `balance: 0` directly.

⚠️ This is the **same shape as the defect the docblock at `store.ts:50-63` says it fixed** — a
transition-based detector, an unreachable once-ever moment, and no way back — relocated from the
early-return to the wiring list.

**Remedy — UNVERIFIED.** Wrap the three payday actions the same way
(`withPayoffCelebration(s.store, applyRollover(...))`). ⚠️ Not measured, and there is a real risk in
it: `applyRollover` also runs `computeMilestones`, and a beat plus a portfolio milestone stamped in
the same transition may render two full-screen moments back-to-back — the exact thing
`detectPayoff`'s "first ranked one speaks for the moment" comment exists to avoid. The interaction
between `pendingMilestone` and `pendingPayoff` on one roll was not tested here.

---
## B2-4 — `minor` · the `Math.max(0, NaN)` class has two more members in the same file, both currently held closed by a caller rather than by the action

**User-facing consequence.** None today — measured, each is guarded at its only UI call site. This is
the rest of the class B2-1 belongs to, recorded so triage fixes the class rather than the member.

**File, line, and what was measured** (same probe run, one store per case):

| action | line | `NaN` in | result | what actually holds the line |
|---|---|---|---|---|
| `setWindfall` | `store.ts:807` | `Math.max(0, amount)` | **`NaN` written to `store.windfall`**; `Infinity` written verbatim | `WindfallSheet.tsx:52-53` — `parseAmountField(amount) ?? 0` then `n > 0` |
| `updateDebt` | `store.ts:500-528` | `updates.balance` | **`NaN` written to `debts[0].balance`**, `originalBalance` left at `1200` | the debt sheet's parse |
| `setExpenseReserveContribution` | `store.ts:1025` | `Math.max(0, Math.round(NaN*100)/100)` | **no NaN written** — `next > 0` is false for `NaN`, so the contribution key is simply omitted | the action itself, by accident of the `> 0` test |
| `setCushionFloor` | `store.ts:823` | — | `NaN -> 200` | **the action** (`Number.isFinite(floor) ? floor : 200`) — the idiom that exists |

`storeActions.test.ts:448-455` pins `setWindfall(-500) -> 0` and `setWindfall(250) -> 250` and has
**no non-finite case**; `setCushionFloor`'s NaN case at `:442-443` is the only `NaN` assertion in the
whole file.

**Mechanism (HYPOTHESIS).** `Math.max(0, x)` reads as a clamp and is one only for finite `x`. Four
money-writing actions in one file spell the same intent four ways, and only one of them
(`setCushionFloor`) tests finiteness. Which of the four are safe is currently a property of their
callers, so a new caller — a Shortcut, a CSV import, a widget intent — inherits nothing.

**Remedy — UNVERIFIED.** One shared `safeMoney(n)` at the store boundary, applied by every action
that accepts a number from outside; `scripts/check-rounding.ts` already exists and may be the place
to gate the pattern. Not measured: whether `lint:rounding` can see `Math.max(0, …)` at all.

---
## B2-5 — `major` · `milestoneCross.test.ts` asserts a HANDOFF that does not exist, and passes because it only checks the half that is null

**User-facing consequence.** None on its own; this is the instrument that made B2-3 invisible. It is
the one test in the repo that drives `applyRollover` a debt to `$0` and looks at what was stamped —
and it looks only at the channel that is deliberately empty.

**File and line.** `apps/rn/src/store/milestoneCross.test.ts:42-45`:

```ts
// B — paying the ONLY debt fully → 100% is debt-free (the finale's domain), NEVER a mid-milestone.
const toFree = applyRollover(storeWith(60, 5000));
assert(toFree.debts[0].balance <= 0, 'the tiny debt paid off (reaches 100%)');
assert(toFree.pendingMilestone === null, '100% never sets a milestone (finale owns debt-free)');
```

**Measurement.** The same fixture, with the un-asserted field printed (see B2-3):
`pendingMilestone: null` ✅ · **`pendingPayoff: null`** · `portfolioMaxProgress: 100`.

**Mechanism (HYPOTHESIS).** The assertion and the comment answer different questions. The comment
makes a claim about a *second* producer (*"the finale's domain"*); the assertion checks only that
the first producer stayed quiet. A suppression test that never checks the thing the suppression
defers to passes identically whether the handoff exists or not — the same shape as
`payoffCelebration.test.ts` proving `detectPayoff` while the defect lived in the wrapper, which
`storeActions.test.ts:727-733` writes down in its own words.

**Remedy — UNVERIFIED.** Add `assert(toFree.pendingPayoff?.kind === 'finale', …)` to case B — it
would red today, which is the point. ⚠️ Do not add it as the *only* change: it pins B2-3's fix but
says nothing about the beat case (one of two debts cleared by a roll), which is untested anywhere.

---
## B2-6 — `minor` · an older build silently REWRITES a newer blob's version marker to its own, and nothing records that it happened

**User-facing consequence.** A user who runs an older build against a newer store — a TestFlight
downgrade, or an iCloud restore taken from a device on a later build — has the on-disk
`storeVersion` overwritten from the newer number to the older one, with no `storageError`, no
`pendingDataRepairs` entry, and nothing on screen. The *data* survives (measured); what is lost is
the record that this blob has already been through a later migration. If any future migration is not
idempotent, the newer build will then re-run it over data it has already converted.

**File and line.** `apps/rn/src/store/store.ts:444-448`:

```ts
const migrated = runMigrations(raw);
const upgraded = (raw as Partial<DebtStore>).storeVersion !== CURRENT_STORE_VERSION;
set({ store: migrated, isHydrated: true });
if (upgraded) await adapter.write(get().store);
```

`upgraded` is `!==`, not `<`, so a **future** version takes the write-back branch.
`apps/rn/src/data/migrations.ts:523` stamps `storeVersion: CURRENT_STORE_VERSION` unconditionally,
which `persistenceLifecycle.test.ts:507` pins and calls deliberate: *"A future/unknown version is
stamped DOWN to the current version (the app owns the shape it runs)."* That sentence is about the
in-memory shape; **nothing states that the down-stamp is persisted.**

**Measurement.** One blob at `storeVersion: 999` with an unknown field at the top level and inside
`paycheck`, one debt, one goal and `prefs`, through `runMigrations` and then through a real
`hydrate` against a tracking adapter (`CURRENT_STORE_VERSION = 7`):

```
storeVersion out           : 7
top-level unknown kept     : {"keep":"me"}
paycheck nested unknown    : "KEEP"
debt nested unknown        : "KEEP"
goal nested unknown        : "KEEP"
prefs nested unknown       : "KEEP"

hydrate on a FUTURE-version blob:
  adapter.writes           : 1        <- 0 would leave the newer blob intact
  blob storeVersion on disk: 7
  storageError             : null
```

**Mechanism (HYPOTHESIS).** `upgraded` conflates two different facts — *"this blob is older than me"*
and *"this blob is not exactly my version"* — and only the first one justifies rewriting it. The
forward-compat spread is what keeps this from being a data loss today; it is a property of
`migrations.ts`'s implementation, not a stated contract of the write-back.

⚠️ **Not measured:** whether any real downgrade path exists in the shipping channel, and whether a
future migration would be non-idempotent. This is why it is a MINOR — the loss is currently only
the marker.

**Remedy — UNVERIFIED.** Make the write-back condition directional
(`(raw.storeVersion ?? 0) < CURRENT_STORE_VERSION`) and leave a newer blob's bytes untouched, or
treat a future version the way a corrupt one is treated — say something. Not measured: whether any
caller depends on the current `!==` behaviour to normalise a version-less blob (a missing
`storeVersion` is `undefined`, which `< 7` also admits, so that case is preserved).

---
## B2-7 — `minor` · a botched mechanical edit left four garbled docblock headings in the store's main instrument, one of them unreadable at the exact word that names its subject

**User-facing consequence.** None. It is the maintainer-facing half: the heading that says *what
this block tests* has had its subject word overwritten, so the reason the block exists is no longer
recoverable from the file.

**File and line.** `apps/rn/src/store/storeActions.test.ts`, verified byte-for-byte with `cat -A`:

```
 69:   * ⛔ **S1.13.7.10 — THE FOUR ⛔ **S1.13.7.10 —ETE ACTIONS, WHICH THIS SUITE HAD NEVER RUN. [pass-6 `B2-4`]
103:     * ⛔ **S1.13.7.10 — PASS 5's BLOCKER, THROUGH THE REAL ACTION THIS TIME.
113:     * ⛔ **S1.13.7.10 — THE CONTROL, AND MY FIRST DRAFT OF THIS TEST FAILED FOR WANT OF IT.
120:     * ⚡ ** This row is what proves the set is derived from the DOCUMENT rather than being a monotonic
```

**Measurement.** `grep -rn "S1.13.7.10 —ETE\|— THE FOUR ⛔" --include=*.ts --include=*.tsx` over
`apps/rn/src`, `packages` and `scripts` returns **exactly one line** — `storeActions.test.ts:69`. A
scan of every file in lane B2 for a line carrying an odd number of `**` markers returns 12 hits, and
the other 11 are ordinary prose containing a bolded figure (`**$500**`, `**2599%**`) — this is the
only structural corruption. `npm run lint:comments`' own header states what it checks (meta-commentary
about earlier comments, and counts of code); garbled markup is outside its scope, so **this is not a
gate reporting green over its own subject** — it is a class no gate looks at.

**Mechanism (HYPOTHESIS).** A search-and-replace inserted the literal `⛔ **S1.13.7.10 — ` where the
three-letter sequence `DEL` stood, turning `THE FOUR DELETE ACTIONS` into
`THE FOUR ⛔ **S1.13.7.10 —ETE ACTIONS` and leaving three sibling headings with an opened `**` that
is never closed. The repo already records this failure mode — a mechanical script that reported
success while damaging the file — which is why the standing preference is an explicit edit over a
script.

**Remedy — UNVERIFIED.** Restore line 69 to name the four delete actions and close the `**` on 103,
113 and 120. ⚠️ Check the rest of the `S1.13.7.10` commit's touched files with the same grep before
assuming this is the only site; I searched three trees, not the whole repo history.

---
# Findings SPLIT BY ORIGIN

Origin is the one `ROUTING-ORIGINS.tsv` gives the finding's **primary** file. Where a finding names
two files with the same origin, both are listed.

| origin | files in lane | blocker | major | minor | findings |
|---|---|---|---|---|---|
| **`fix-churn`** | 5 | **2** | **1** | **3** | B2-1, B2-2, B2-3, B2-4, B2-6, B2-7 |
| **`stale-read`** | 25 | 0 | **1** | 0 | B2-5 |
| **`neighbour`** | 14 | 0 | 0 | 0 | — |
| **`first-look`** | 2 | 0 | 0 | 0 | — |
| **`off-surface`** | 2 | 0 | 0 | 0 | — |
| **`instrument`** | 0 | — | — | — | (none routed to B2) |
| **`s0-first-look`** | 0 | — | — | — | (none routed to B2) |
| **TOTAL** | **51** | **2** | **2** | **3** | **7** |

### `fix-churn` — 5 files, 6 findings

The brief said this round's repairs live here and that every prior round found the previous round's
fixes defective. Measured, that held: **all six** findings sit on the two files the fixing rewrote
most (`store.ts` 1,108 lines, `storeActions.test.ts` 929 lines) plus `payday.ts`.

- `apps/rn/src/store/store.ts` — **B2-1** (BLOCKER, pass-6 `B2-5` fixed at the member, not the
  class) · **B2-3** (BLOCKER, `withPayoffCelebration` wired to four actions, not to the fifth that
  moves a balance) · **B2-4** (MINOR, two more class members) · **B2-6** (MINOR, `!==` where
  `<` was meant)
- `apps/rn/src/store/storeActions.test.ts` — **B2-2** (MAJOR, the pass-6 fix has no test and no
  registered guard; the un-fix was planted and the suite stayed green) · **B2-7** (MINOR, garbled
  docblock from a mechanical edit)
- `apps/rn/src/store/payday.ts` — **B2-3**'s balance-moving half

### `stale-read` — 25 files, 1 finding

`milestoneCross.test.ts` (**B2-5**, MAJOR): the assertion suppresses one channel and the comment
promises a handoff to a second that never fires. It is the only file in the whole repo that drives
`applyRollover` a debt to `$0` and inspects what was stamped.

The other 24 `stale-read` files — `persistence.ts`, `persistenceLifecycle.test.ts`,
`requiredPlanTrust.test.ts`, `expenseReserve.test.ts`, `debtIds.ts`/`.test.ts`, `paycheckForm.ts`,
`obligationForm.ts`, `logPaymentCopy.ts`/`.test.ts`, `drift.ts`, `greeting.ts`, `projectedIncome.*`,
`incomeLearning.ts`, `forecastCycles.ts`, `onboardingFinish.*`, `realWriteGuard.ts`,
`storeContext.test.ts`, `glossary.test.ts`, `debtFreeBand.test.ts`, `proofOfWork.test.ts`,
`appStore.ts`, `useAppStore.ts`, `boundedRun.ts` — produced nothing I could measure. Two things I
looked at hard and could **not** turn into a finding, recorded so the next pass does not re-spend
the time:

- `persistence.ts`'s autosave/debounce/prefs-immediate split and its `read-failed` bootstrap bail —
  I could not construct a lost write.
- `refuseRealStoreWrite`'s docblock claim that the veto *"judges the value that would actually
  land"*. Strictly it does not — `clearResuppliedRepairs` mutates `patch.store` **after** the veto
  runs (`store.ts:391-394`). I traced it and there is no hole: that helper only runs when
  `patch.store !== state.store`, which the veto has already judged, and it only removes
  `pendingDataRepairs` entries. **A comment that is imprecise but not false, so not reported.**

### `neighbour` — 14 files, 0 findings

The sandbox/tutorial/demo cluster (`sandboxStore.ts`, `sandboxScenarios.ts`, `sandboxBeats.ts`,
`sandboxRun.ts`, `sandboxHarness.ts`, `demoRun.ts`, `demoSession.ts`, `coachMarks.*`, `tutorial*`).
⚠️ **One structural hazard I could not measure and am therefore NOT reporting as a finding**, but
which the next pass should aim a rendering harness at: `useNoRealWritesGuard`
(`StoreContext.tsx:74-110`) arms `enterSandboxScope()` inside a `useEffect` on the **provider**, and
React runs child effects before parent effects — so any child that writes to `appStore` during the
commit in which `demoSandbox` becomes non-null would land **before** the veto is armed. I found no
such writer (`_layout.tsx`'s four background writers are all wrapped in `allowRealStoreWrite`,
including the iCloud restore at `:243-251` which a grep alone makes look unwrapped), and this runner
cannot mount React, so the ordering claim is **reasoned, not measured.** Stated as a lead, not a
finding.

### `first-look` — 2 files, 0 findings

`paydayRequiredSplit.test.ts` (235 lines) and `staleClaims.test.ts` (70). Both read in full. The
first is the strongest instrument in the lane — it pins the call site by source with positive
anchors on both sides of every absence assertion. [D69]'s exemption is unused this round.

### `off-surface` — 2 files, 0 findings

`demoExit.ts`, `sandboxStore.test.ts`.

---

# What I ran, and what I did not

- `npm run test:app` — 3 runs (baseline, plant A, plant B). Restored from a copy taken **before** the
  plant, `cmp` clean, `git status` clean.
- 7 throwaway `tsx` probe files under this directory, all deleted; each run's exit code read directly,
  never through a pipe.
- Heap capped at 1536 MB on every invocation. **No OOM.**
- **Not run:** monorepo typecheck, `lint:rn`, Playwright, `prove:guards` (pass-6 `B2-5` has no
  registry entry to prove — that absence *is* B2-2).
- No sub-agents. 63 files read (51 manifest + 12 supporting), listed in `READ-B2.txt`.
