# S1 pass 4 — Auditor **C**: the screens a user reads money off

**Pin:** `e65f9c7` · lane **C** · 72 files · 10,638 lines ·
`apps/rn/src/{app,components,hooks,theme,motion,keyCommands,widget,liveActivity}`

**Isolation.** All plants were run in an **isolated detached worktree** at the pin,
`C:/Users/Jason/audit-c-wt` (`git worktree add --detach … e65f9c7`). No source file in
`C:/Users/Jason/debt-app-v1` was edited. Verified at start and at finish:
`git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 -- apps packages scripts` → empty.

**Lane origin split (lookup, `ROUTING-ORIGINS.tsv`):** `first-look` 55 · `fix-churn` 17 ·
`instrument` 0 · `off-surface` 0.

---

## 1. Findings

### C4-1 — `blocker` · the BNPL installment COUNT is stated from a field the app recorded as unreadable, on two screens

**User-facing consequence.** A Klarna 4-pay the user has already paid two installments on prints
**"$200.00 · 0 of 2 paid · interest-free"** on the Money tab and **"payment 1 of 2" / "payment 2 of 2"**
in the BNPL calendar below it — the app tells the user they have paid nothing and that their four-payment
plan is a two-payment plan, from an `originalBalance` it had already filed in `pendingDataRepairs` as lost.

**Files.**
- `apps/rn/src/app/(tabs)/money.tsx:559-560, 569-571` — origin **fix-churn**
- `apps/rn/src/components/money/BnplCalendarSection.tsx:83, 113-115` — origin **fix-churn**
- (producer) `packages/core/debt/bnplInstallment.ts:70-75` `bnplPaymentsTotal`, lane A

**The measurement.** Store built through the real `runMigrations` from a backup whose `originalBalance`
is unreadable (`'four hundred'`); everything else intact. Printed:

```
repairs        : [{"entity":"debt","id":"k1","name":"Klarna","field":"originalBalance","kind":"lost"}]
originalBalance: 200 (unreadable in the blob; balance is 200)
installmentNat : true
remaining/total: 2 / 2          <- truth is 2 remaining of 4
originalUnread : true           <- money.tsx:538 ALREADY COMPUTES THIS
unreadFields   : ["originalBalance"]

ROW META PRINTED: $200.00 · 0 of 2 paid · interest-free
TRUTH           : $200.00 · 2 of 4 paid · interest-free

scheduledPaymentAmount unread?  false   <- the C-6 filter, so the plan is NOT suppressed
originalBalance        unread?  true
  CALENDAR ROW: 2026-09-04  Klarna  "payment 1 of 2"  $100
  CALENDAR ROW: 2026-09-18  Klarna  "payment 2 of 2"  $100
TRUTH: these are payments 3 of 4 and 4 of 4.
```

**Mechanism, stated as a hypothesis and then checked.** `repairMoneyFields` drops the unreadable
`originalBalance`, then `raiseOriginalBalance` (`packages/core/debt/originalBalanceHighWater.ts:46`)
stamps it to `Math.max(0, balance)` on the very next line of `runMigrations` — so the field is
**manufactured from `balance`**, and `bnplPaymentsTotal`'s `basis / scheduled` collapses to
`remainingPayments`. Verified by printing `originalBalance: 200`, not inferred.

⚠️ **`originalBalanceHighWater.ts:19-27` argues this case is safe and its argument does not cover it.**
Its docblock says the stamp makes the count *"either unchanged or more correct"* — that measurement was
taken over a lifecycle where the field was **readable**. When the field is a recorded loss, the stamp
does not raise a real number, it invents one, and the row then states it.

⚡ **This is `B1`'s rule missing a FOURTH direction.** Pass 1→2 widened the claim SITES, 2→3 the FIELDS,
3→4 the SURFACES. All three widenings are about **dollar figures**. `rowFieldUnread` is asked before every
`formatCurrency` on this row and is **not asked before the count, the ordinal or the total** — and the
count is derived from exactly the same repaired field. `money.tsx:538` computes `originalUnread` and
spends it only on the `progress` bar (line 553).

**Remedy (hypothesis).** Two producers of one fact are already in play, so fix the producer, not the two
readers: `bnplPaymentsTotal` should return `null` when its `basis` came from a stamp rather than a
reading — which the debt object cannot currently tell it. The cheaper true fix is at the two call sites:
gate the `"X of N"` clause on `rowFieldUnread(store,'row-figures','debt',id,'originalBalance')` in
`money.tsx` (degrade to `"$200.00 · interest-free"`, the path that already exists two lines above) and
add `originalBalance` to `BnplCalendarSection`'s `unreadPlans` filter so the ordinal is suppressed with
the same named caption `C-6` already ships. ⛔ Do **not** "fix" this by exempting BNPL from
`raiseOriginalBalance` — `originalBalanceHighWater.ts:29-31` records that inference being made and being
wrong, and it would re-open the journey-ring defect `D62` closed.

### C4-2 — `blocker` · the trophy shelf files a debt the user still owes IN FULL as **"$12,000 paid off"**, and offers it for sharing

**User-facing consequence.** A user who restores a backup whose Chase balance could not be read sees, on
the ordinary Progress screen, a permanent trophy shelf reading **"DEBTS PAID OFF · 1 · Chase — $12,000
paid off"** with a Share button that composes **"I paid off 1 debt ($12,000) on my way to debt-free 🎉"**
— for $12,000 they have not paid a cent of.

**Files.**
- `apps/rn/src/components/progress/PaidOffArchive.tsx:40-46, 70-75, 93` — origin **fix-churn** (the render and the share string)
- (producer) `apps/rn/src/store/celebrationSelectors.ts:49` — lane **B**, origin **fix-churn**
- (mount) `apps/rn/src/app/(tabs)/progress.tsx:346` — **unrouted this round** (not in `ROUTING-ORIGINS.tsv`)

**The measurement.** Real `runMigrations` over a backup with `balance: 'twelve thousand'` on Chase and an
intact live Amex, so the user is not debt-free:

```
repairs               : [{"entity":"debt","id":"c1","name":"Chase","field":"balance","kind":"lost"}]
Chase balance after   : 0  originalBalance: 12000
hasUnreadDebtBalances : true  <- progress.tsx:173 gate only
selectPaidOffDebts    : [{"id":"c1","name":"Chase","amount":12000,"clearedDate":"2026-08-01",...}]
stats                 : {"totalPaid":16000,"debtsCleared":1,"monthsToFreedom":null}

SHELF HEADER  : DEBTS PAID OFF · 1
  TOMBSTONE   : Chase — $12,000 paid off
SHARE HEADLINE: I paid off 1 debt ($12,000) on my way to debt-free 🎉
TRUTH         : the user owes Chase $12,000 and has paid off NOTHING.
```

**Why the existing guards all miss it, verified by reading the control flow around the site (rule 9).**
`selectPaidOffDebts` decides MEMBERSHIP with `d.balance <= 0` and guards only the AMOUNT with
`rowFieldUnread(…,'originalBalance')`. In this store `originalBalance` was read perfectly, so the guard
answers *readable* and the figure prints. `progress.tsx:173`'s `!hasUnreadDebtBalances(store)` gate sits
inside `if (!view.hasDebts)`, and `hasDebts` is `liveDebts.length > 0` — the live Amex makes it **true**,
so that whole block is skipped and the shelf renders from `progress.tsx:346`, which carries **no trust
check of any kind**. The `C-4` docblock at `celebrationSelectors.ts:41-44` claims *"it fixes BOTH mount
points"*; measured, it fixes the figure at both and the membership at neither.

⚠️ **Third site, same store, same cause:** `money.tsx:233` `store.debts.filter(d => d.balance <= 0)` puts
the same Chase card under a section headed **"PAID OFF"** (`money.tsx:345`). The row itself degrades
correctly to an em dash — the *heading* is the false claim. Money's hero is properly guarded
(`unreadDebts`, `money.tsx:371`); the section list is not.

**Remedy (hypothesis).** `selectPaidOffDebts` should exclude a debt whose `balance` is a recorded loss —
`rowFieldUnread(store,'debt-balances','debt',d.id,'balance')` — rather than only nulling its amount, and
`money.tsx:233` should apply the same exclusion. ⛔ **Do not** widen `hasUnreadDebtBalances` and gate
`progress.tsx:346` on it: `celebrationSelectors.ts:39-44` records why that guard is correctly narrow, and
a store-wide gag would remove a genuinely-earned trophy over an unrelated unread debt — the *"true
statement withheld"* failure `progress.tsx:186-196` records having already made once.

---

### C4-3 — `major` · the liveness ledger enumerates ONE side of a two-sided predicate, and 13 sites live on the other

**User-facing consequence.** `lint:trust-claims`' liveness ledger exists to make every re-derivation of
*"is this debt live?"* visible; it reads only `balance > 0`, so `balance <= 0` — the spelling
`C4-2`'s blocker is written in — is invisible to it, and the next one ships the same way.

**File.** `scripts/check-trust-claims.ts:243` `const LIVENESS_RE = /balance\s*>\s*0/;` — lane **D**,
origin **instrument**. *(Reported here because the class it misses is my lane's, and because `C4-2` is the
proof it misses it; auditor D owns the file.)*

**The measurement.** Same file list, same `stripCommentsOnly`, same scope (`apps/rn/src`, non-test) the
gate itself uses:

```
LEDGERED   `balance > 0`            : 14 sites across 11 files   (13/10 after the gate's TRUST_MODULE skip)
UNLEDGERED `balance <=/===/< 0`     : 13 sites across  9 files — INVISIBLE to LIVENESS_RE
     apps/rn/src/app/(tabs)/money.tsx (1)              <- C4-2's third site
     apps/rn/src/components/payoff/TrajectoryChart.tsx (4)
     apps/rn/src/components/payoff/compareStrategies.ts (1)
     apps/rn/src/components/payoff/trajectoryDomain.ts (1)
     apps/rn/src/store/celebrationSelectors.ts (2)     <- C4-2's producer
     apps/rn/src/store/guardianSelectors.ts (1)
     apps/rn/src/store/payday.ts (1)
     apps/rn/src/store/payoffCelebration.ts (1)
     apps/rn/src/store/recoverySelectors.ts (1)
  7 of those 9 files are not on LIVENESS_OPEN at any spelling.
```

⚠️ **Honest narrowing:** 6 of the 13 (`TrajectoryChart` ×4, `compareStrategies`, `trajectoryDomain`) test
`p.balance` on a **projection point**, not a store debt — those are not repairable and are correctly out
of scope. The other **7** are store debts and are the class. That is still 7 unledgered against 13
ledgered, and `celebrationSelectors.ts` is ledgered at *1* site while holding *3* liveness tests.

⚡ **This is reading rule 4 exactly** — *"enumerating spellings has failed six times here; judge the
condition the consumer evaluates, never the example the finding cited."* The ledger's own docblock
(`:229-241`) argues at length that a *ban* is unsatisfiable and a ledger is the answer, and then builds
the ledger out of one spelling of the enumeration it warned about.

**Remedy (hypothesis).** Widen `LIVENESS_RE` to `/balance\s*(>|>=|<|<=|===|==|!==|!=)\s*0(\.\d+)?/`,
re-count, and raise `MAX_LIVENESS_SITES` **once** to the measured total with every new row carrying its
`why` — the cap is downward-only from there. Rows whose subject is a projection point rather than a store
debt should be excluded by *scope* (they are not in `store.debts`), not by the regex.

### C4-4 — `major` · `MAX_OPEN = 0` is real, but the claim-site ledger regrows SILENTLY, and the green line says otherwise

**User-facing consequence.** The next unguarded money surface can ship stating a false total about the
user's debts and bills while `lint:trust-claims` prints **"⭐ 0 claim sites open — every money surface that
reads the user's entities asks the guard"** — the gate's own success sentence, said about a tree where it
is not true.

**File.** `scripts/check-trust-claims.ts:192` (`if (src.includes('trustSelectors') || src.includes('dataRepairsCopy')) continue;`)
and `:298-302` (the success line) — lane **D**, origin **instrument**. *(Reported here because the ledger
is the instrument over MY claim sites; auditor D owns the file.)*

**The measurement — three plants, in the isolated worktree, each `git add`ed so `git ls-files` sees it.**

*Plant 1 — explicit regrowth (the thing `MAX_OPEN` is for).* One row added to `OPEN`:

```
❌ trust claims: 1 problem(s)
  ✗ [ledger] MAX_OPEN is 0 and OPEN holds 1. This cap only goes DOWN.
```
⭐ **`MAX_OPEN = 0` is REAL and `S1P3-D3-CAPS` is CLOSED** — the literal cap reds, the vacuous
`Object.keys(OPEN).length` form is gone.

*Plant 2 — a brand-new claim surface with a hand-rolled formatter.* `apps/rn/src/components/plan/DebtTotalBanner.tsx`,
reading `store.debts` and `store.requiredExpenses` and printing `` `You owe $${total.toFixed(2)} …` ``:

```
lint:trust-claims  EXIT=0   ⭐ 0 claim sites open — every money surface that reads the user's entities asks the guard.
lint:money         EXIT=1   (hand-rolled formatter — caught HERE, by a different gate)
```
⚠️ Honest: the composite of the two gates stops this one. `lint:trust-claims` alone does not, because
`PRINTS_MONEY` enumerates four formatter names.

*Plant 3 — the one nothing catches.* The same new surface, using the **sanctioned** `formatWhole`, and
importing `mayClaim` **without ever calling it**:

```
lint:trust-claims  EXIT=0   ⭐ 0 claim sites open — every money surface that reads the user's entities asks the guard.
lint:money         EXIT=0   ✅ money-format: no hand-rolled currency formatters (4 shapes checked).
```

**Mechanism.** The ledger's population is `PRINTS_MONEY && READS_ENTITIES`, then anything whose source
merely **contains the substring** `trustSelectors` or `dataRepairsCopy` is `continue`d before the row is
ever considered. So a file escapes by *importing* the guard, not by *asking* it — and importing it is
exactly what happens when someone copies a guarded neighbour to build the next money surface.

⚡ **The gate knows.** Its own docblock (`:34-36`) says *"a file that imports the module can still ask the
wrong question"*. What it does not say is that its **success line makes the stronger claim anyway**:
*"every money surface that reads the user's entities asks the guard"* is not what check 3 measured. That
is `assert-the-honest-state-by-name` inverted — a true-looking sentence about a check that did less.

**Remedy (hypothesis).** The escape should be a **call**, not a substring: reuse check 2's existing
`CALL` regex (`(rowFieldUnread|anyRowFieldUnread)\s*\(`) plus `mayClaim\s*\(` / `debtLiveness\s*\(` /
`liveDebts\s*\(`, and `continue` only when one of those actually appears. Re-measure the population —
6 of the current 7 escape by substring, so this will surface rows and the honest move is to ledger them
in `OPEN` at a measured cap and ratchet **down** from there. Separately, weaken the success line to what
was measured: *"N files read the user's entities and print money; all N call the guard"*.

### C4-5 — `major` · `G-5`'s fix covers the two-pot case only; with ONE savings pot and it unread, the whole offer disappears in silence

**User-facing consequence.** A premium user who is $100 under their cushion line and has $800 in their
only savings goal — whose amount the app could not read — is shown **nothing at all**: no top-up offer, no
caption, no mention that a figure could not be read. The same user with a readable $800 is offered
*"moving $100 over holds your line."*

**Files.** `apps/rn/src/store/guardianSelectors.ts:348-351` (`if (!goal) return null;` before
`unreadSavings` is ever built) and `:643-651` `pickTopUpGoal` — lane **B**. The renders that go dark are
`apps/rn/src/components/plan/PaydayGuardianCard.tsx:366` (origin **fix-churn**, my route) and
`apps/rn/src/components/plan/AffordabilityCard.tsx:285` (origin **fix-churn**, my route).

**The measurement.** Same `base()` fixture shape the shipped `guardianTrust.test.ts` uses, varying only
the number of pots:

```
TWO POTS  topUp: {"gap":100,"available":25,…,"goalName":"Coffee Fund","holdsLine":false,"unreadSavings":true}
ONE POT   topUp: null
  -> card renders? false   unreadSavings said? N/A — the whole card is gone
CONTROL   topUp: {"gap":100,"available":800,…,"goalName":"Vacation","holdsLine":true,"unreadSavings":false}
```

⚡ **This is reading rule 2 exactly.** `guardianTrust.test.ts:230-238` fixes the fixture at *"a $800
Vacation beside a $25 Coffee Fund"* — the one member of the class where a **fallback pot exists**, so
`pickTopUpGoal` returns something and `unreadSavings` has a card to ride on. The member with no fallback
was never run, and it is the member where the fix does not reach the screen. The pass-3 finding's own
words were *"⛔ Captioned, not suppressed"*; measured, the single-pot case is suppressed and uncaptioned.

⚠️ **Honest limit on the twin.** In the one-pot fixture `selectAffordability` returns verdict `short`
rather than `tight`, so its `coverFromSavings` branch is not entered for a different reason; I did not
construct a `tight` single-pot store, so **`AffordabilityCard`'s half of this is stated as unmeasured**,
not as clean.

**Remedy (hypothesis).** `selectTightTopUp` should not return `null` on `!goal` when
`savingsPoolIncomplete(store, preference)` is true — return a goal-less shape carrying `unreadSavings:
true` so the card can render the caption alone, which is the state the copy at
`PaydayGuardianCard.tsx:366` already knows how to say. ⛔ Do **not** make `pickTopUpGoal` include
zero-balance pots: that would offer to move $0 and re-open the false-positive direction.

### C4-6 — `major` · `C-7b`'s loss disclosure can be raced: the confirm renders byte-identical to the un-fixed state while the pre-read is in flight

**User-facing consequence.** A user who taps "Restore from iCloud" and then taps "Replace my data" before
the network read returns sees exactly the confirm `C-7b` was raised about — one unconditional danger
sentence, nothing about the three amounts the reader is in the middle of failing to read — and overwrites
their device with it.

**Files.** `apps/rn/src/components/more/CloudBackupSheet.tsx:49-55, 159-171` — origin **fix-churn** ·
`apps/rn/src/hooks/use-cloud-backup.ts:165-173` `previewRestore` — origin **fix-churn**.

**The mechanism, from the code path (stated as a code-path proof, not a runtime plant).**

```
openRestoreConfirm()                       // CloudBackupSheet.tsx:49
  setPreview(null);                        //   ← disclosure cleared, synchronously
  setConfirmingRestore(true);              //   ← the confirm is rendered, synchronously
  void previewRestore().then(setPreview);  //   ← the iCloud read starts AFTER the render
```

The confirm therefore renders on the next tick with `preview === null`, and `:159` is
`{preview ? <Text testID="cloud-restore-preview">…</Text> : null}` — so **nothing** is drawn. The confirm
button is `disabled={busy !== null}` (`:167`) and **`previewRestore` never sets `busy`** — verified: it is
`useCallback(async () => { if (isSandboxStore(store)) return null; try { … } catch { return null; } })`,
with no `setBusy` on either path, unlike `restoreNow` (`:175 setBusy('restore')`). There is also no
spinner, so the window is invisible to the user. Over an iCloud round-trip that window is hundreds of
milliseconds to seconds, on the one screen in the app where a double-tap destroys data.

⚠️ **The docblock's stated intent does not cover this.** `CloudBackupSheet.tsx:43-46` says `null` is
correct *"while the read is in flight or when it fails … so a slow or unavailable iCloud never blocks a
restore the user has asked for."* Not blocking the **restore** and not blocking the **confirm button for
the duration of a read already in flight** are different decisions; only the first was argued.

**Remedy (hypothesis).** Have `previewRestore` set a distinct in-flight flag (not `busy: 'restore'`, which
would mislabel the state) and either disable `cloud-restore-confirm` while it is set, or render a
"Reading the backup…" line in the `preview` slot so the disclosure area is never silently empty. ⛔ Do
**not** delay `setConfirmingRestore(true)` until the read resolves — a confirm that appears seconds after
the tap is its own defect, and the failure path would then show no confirm at all.

### C4-7 — `blocker` · `D3-2` was fixed on the Lock Screen and in Siri and NOT on the Today card it came from — the in-app Guardian states **$1,800 spare** against a true **$300**

**User-facing consequence.** On one store at one instant, Today's Payday Guardian card tells the user
*"Looks clear this paycheck — apply the spare **$1,800** toward Visa"* and shows **"To debt $1,800"**,
while the Lock Screen refuses to show anything and Siri says nothing, because the $1,500 minimum that
makes the true figure **$300** is an obligation the app recorded that it could not read.

**Files.**
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx:37-56, 207-296` — origin **fix-churn** (my route). It takes `brief: GuardianBrief` and has **no** `unreadPlanInputs`-shaped prop.
- `apps/rn/src/app/(tabs)/index.tsx:148, 345, 355` — `const guardian = selectPaydayGuardian(engineStore)` then `{guardian ? <PaydayGuardianCard brief={guardian} …/> : null}`, **no trust gate**. ⛔ **Unrouted this round** — `index.tsx` appears in no lane in `ROUTING-ORIGINS.tsv`.

**The measurement — one store, one variable.** Same shape as `paydayActivityContent.test.ts`'s own `D3-2`
fixture, with the due date moved inside the cycle so the minimum is actually owed:

```
── UNREAD minimum ($1,500 lost)   mayClaim(required-plan) = false
   TODAY  title        : Looks clear this paycheck
   TODAY  safeMove     : Apply the spare $1,800 toward Visa when you’re ready — your $200 cushion stays protected either way.
   TODAY  "To debt"    : 1800   Safety net: 0   Your line: 200
   LOCK SCREEN         : null — refuses to say anything
   SIRI                : ""
── CONTROL (minimum = $1,500)     mayClaim(required-plan) = true
   TODAY  title        : Looks clear this paycheck
   TODAY  safeMove     : Apply the spare $300 toward Visa when you’re ready — your $200 cushion stays protected either way.
   TODAY  "To debt"    : 300    Safety net: 0   Your line: 200
   LOCK SCREEN         : SPEAKS
   SIRI                : "This paycheck looks clear — your cushion holds, with $300 free to put toward debt."
```

⛔ **The error is $1,500 and it is stated as an instruction to spend.** *"Apply the spare $1,800 toward
Visa"* is the app telling someone to move six times the money they actually have free.

⚡ **This is `D3-1`'s own sentence with the polarity reversed.** `widget/snapshot.ts:104-113` records the
pass-3 blocker as *"one tab apart, on one store, the app both refused and asserted the same sentence."*
`D3-2` then wired `mayClaim(store,'required-plan')` into `paydayActivityContent.ts:82` and
`widget/snapshot.ts:68` — **the two surfaces outside the app** — and never into the in-app card the brief
is built for. The outer surfaces now refuse and the primary one asserts.

⚠️ **The honest caption on the same screen does not cover it.** `RequiredActionsCard`
(`index.tsx:529`, `unreadPlanInputs={!mayClaim(store,'required-plan')}`) does say the list is incomplete —
but it is a different card, below, and the Guardian card above it still prints the wrong dollar figure.
That is precisely the standard `widget/snapshot.ts:118-121` sets for itself: repairing one figure and
leaving the others is *"the same false statement without the word."*

⚡ **And `C4-4` is exactly how this stayed invisible.** `index.tsx` **is** in `lint:trust-claims`' check-3
population (it prints money and reads `.debts`) and is `continue`d at `:192` because its source contains
the substring `trustSelectors` — it imports `mayClaim` for `RequiredActionsCard` and never asks it for the
Guardian card. The ledger's escape is a mention, not a call, and this blocker walked through it.

**Remedy (hypothesis).** Give `PaydayGuardianCard` an `unreadPlanInputs` prop on the same pattern
`RequiredActionsCard` already carries, fed from `mayClaim(store,'required-plan')` at `index.tsx:355`, and
suppress the four derived figures (`deployedToDebt`, `heldReserve`, `cushion`, `shortfall`) and the
`safeMove` sentence together — ⛔ **all of them, not the sentence alone**, per `snapshot.ts`'s own
"all four degrade together" lesson. ⚠️ Verify the remedy against `brief.debtFree` too: `selectPaydayGuardian`
already has `G-3`'s `debtLiveness` guard for the *regime*, so this is the field-level half of the same
question and must not double-suppress a genuinely readable plan. ⛔ Do **not** null the brief — `index.tsx:345`
renders nothing for a null brief, which removes Today's whole premium surface rather than making it honest.

---

## 2. Closure verdicts

_(appended as confirmed)_

---

## 3. Findings tally by origin

_(final)_

---

## 4. Swept and found clean — BY PATH

_(final)_

---

## 5. Measured, and NOT a defect

_(final)_

---

## 6. Not reached — BY PATH

_(final)_
