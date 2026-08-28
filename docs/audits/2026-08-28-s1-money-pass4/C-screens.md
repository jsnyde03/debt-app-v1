# S1 pass 4 — Auditor **C**: the screens a user reads money off

**Pin:** `e65f9c7` · lane **C** · 72 files · 10,638 lines ·
`apps/rn/src/{app,components,hooks,theme,motion,keyCommands,widget,liveActivity}`

**Isolation.** All plants were run in an **isolated detached worktree** at the pin,
`C:/Users/Jason/audit-c-wt` (`git worktree add --detach … e65f9c7`). No source file in
`C:/Users/Jason/debt-app-v1` was edited. Verified at start and at finish:
`git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 -- apps packages scripts` → empty.

**Lane origin split (lookup, `ROUTING-ORIGINS.tsv`):** `first-look` 55 · `fix-churn` 17 ·
`instrument` 0 · `off-surface` 0.

⚠️ **This is a RESUME.** The first dispatch died to host memory exhaustion with §1 written and §§2-6
empty. Findings `C4-1`…`C4-7` stand as written. **The whole 72-file route was re-swept this session** —
no coverage is carried forward from the dead run — which is where `C4-8`…`C4-11` and every closure
verdict came from.

## 0. What this pass found

| | |
|---|---|
| **11 findings** | 4 blockers · 6 majors · 1 minor |
| **origin split** | `first-look` 2 · `fix-churn` **5** · `instrument` 2 · `off-surface` 0 · ⛔ **unrouted 2** |
| **closure verdicts** | **17 pass-3 ids** and **19 `S1P3-*` guard entries**: 11 `CLOSED` · **4 `PARTIAL`** · **1 `GUARD-ONLY`** · 1 `OPEN`-and-agreed |
| **guards proven real** | **9**, each by restoring the defect and, where an earlier assertion masked it, by relaxing that assertion and re-running |
| **guards proven dead** | **1** — `S1P3-M7` is green with its defect fully restored |
| **guards not reached** | **6** — all e2e-token; running them needs a Metro build, which is what killed the first dispatch. Named in §6 |

⚡ **The one sentence.** Four of my five `fix-churn` findings — including three of the four blockers —
are **a pass-3 fix that reached one surface of a pair**: the widget was wired to the trust guard and the
Progress hero was not (`C4-9`); Siri and the Lock Screen were, and the in-app Guardian card was not
(`C4-7`); the trophy's *amount* was, and its *membership* was not (`C4-2`); the BNPL *figure* was, and
the BNPL *count* was not (`C4-1`). **The fixing session repaired the surface each finding NAMED and not
the claim's other reader**, and a route generated from the diff cannot see it, because the surface that
still lies is the one that did not change.

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

⭐ **The twin is now MEASURED — this replaces the earlier "unmeasured" caveat in this finding.** My first
one-pot fixture returned verdict `short` rather than `tight`, so the `coverFromSavings` branch was skipped
for an unrelated reason. Re-built at a **$650 purchase against $750 discretionary and a $200 floor**, which
lands squarely on `tight` with a real **$100 gap**, varying only the number of pots:

```
TWO POTS (the shipped fixture)  verdict=tight  gap=100
   coverFromSavings = {"goalName":"Coffee Fund","amount":25,"holdsLine":false,"unreadSavings":true}
   COVER BUTTON rendered? true    "afford-unread-savings" caption rendered? true

ONE POT, and it is the unread one  verdict=tight  gap=100
   coverFromSavings = null
   COVER BUTTON rendered? false   "afford-unread-savings" caption rendered? false

CONTROL one pot, readable $800  verdict=tight  gap=100
   coverFromSavings = {"goalName":"Vacation","amount":100,"holdsLine":true,"unreadSavings":false}
   COVER BUTTON rendered? true    caption rendered? false
```

⛔ **`AffordabilityCard`'s half is the same defect, not a different one.** `selectAffordability:498` is
`if (gap > 0 && goal)`, so a `null` from `pickTopUpGoal` takes out the offer *and* the caption together —
`AffordabilityCard.tsx:285` reads `result.coverFromSavings?.unreadSavings`, which cannot be true when the
object is `null`. The user with **$800 in their only savings pot** is offered nothing and told nothing,
while the same user with a readable $800 is offered *"Cover $100 from Vacation & apply"* that **holds their
line**. ⚡ Both surfaces fail on the *same* member of the class the shipped fixture does not cover, from the
same two-line cause.

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

**Files.** `apps/rn/src/components/more/CloudBackupSheet.tsx:49-55, 159-171` — origin **first-look** ·
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

### C4-8 — `minor` · the History headline says **"paid down across 1 cycles"** the first time it ever shows a figure

**Consequence.** Grammar, not money — filed `minor` because no figure is wrong and no instrument is
blinded. It is worth writing down because it is on the **first** render of that headline for every user:
the screen shows it as soon as `paidDown > 0`, which is the first rollover in which anything was paid.

**File.** `apps/rn/src/app/history.tsx:44-46` — ⛔ **unrouted this round** (surfaced from `m5`'s closure
verdict, whose subject is this exact line).

**The measurement.**

```
snapshots=1  shown? true  ->  "$200  paid down across 1 cycles"
snapshots=2  shown? true  ->  "$400  paid down across 2 cycles"
```

**It is an outlier, not a class — counted whole (rule 5).** A repo-wide sweep of interpolated
`{count} <word>s` strings outside tests returns five sites; three handle the singular
(`money.tsx:817` `expenseWord`, `money.tsx:1014`, `dataRepairsCopy.ts:152/186`), and of the two that do
not, `CashRunwayChart.tsx:137`'s *"next {cycles.length} paychecks"* is **unreachable** at 1 — the
component returns `null` above it at `:64` (`if (cycles.length < 2) return null;`). ⭐ **`history.tsx:45`
is the only live one.**

**Remedy (hypothesis).** The repo has the helper twice already — `readBackup.ts:123`
`plural(n, one, many)` and the inline `${n === 1 ? '' : 's'}` idiom at four sites including two on my
route. Use either; do not add a third spelling.

### C4-9 — `blocker` · the Progress ring credits the user with **$12,000 they have not paid** — the guard covers the all-unread portfolio and not the mixed one

**User-facing consequence.** A user who restores a backup in which **one** of their two cards' balances
could not be read opens Progress and is told **"78% paid · $14,000 of $18,000 paid · debt-free October
2026"** — while the true figures are **11% · $2,000 of $18,000 · February 2027**, and the Home-Screen
widget on the same store at the same instant refuses to say anything at all.

**Files.**
- `apps/rn/src/app/(tabs)/progress.tsx:235` (`selectJourneyTotals`), `:289` (the ring), `:294`
  (`CountUp` → `"78%"`), `:300` (`progress-hero-date`), `:305` (`progress-hero-journey`) —
  ⛔ **unrouted this round**, in no lane in `ROUTING-ORIGINS.tsv`
- (producer) `apps/rn/src/store/journeySelectors.ts:54` `selectJourneyTotals` — also **unrouted**; it
  contains no reference to `pendingDataRepairs` or any trust selector
- (my route, same screen) `apps/rn/src/components/payoff/TrajectoryChart.tsx` — origin **first-look**;
  it is handed `debtFreeDate` and `interestSaved` from the same ungated `view` and renders both

**The measurement — one store, one variable, both surfaces printed.** Chase `originalBalance: 12000`,
`balance: 'twelve thousand'` (unreadable) beside a fully intact Amex, so the user is **not** debt-free and
`hasDebts` is true:

```
── UNREAD Chase balance
   repairs                : ["Chase.balance"]
   mayClaim(debt-balances): false      hasUnreadDebtBalances: true
   WIDGET debtFreeDate    : "Balances unread"   pctLabel "—"   remaining "—"
   PROGRESS hero date     : "October 2026"
   PROGRESS ring pct      : 78%
   PROGRESS journey line  : "$14,000 of $18,000 paid"
   interestSaved          : { interestSaved: 2323.44, monthsSaved: 63 }

── CONTROL (Chase balance readable, 12000)
   repairs                : []
   mayClaim(debt-balances): true       hasUnreadDebtBalances: false
   WIDGET debtFreeDate    : "February 2027"     pctLabel "11%"  remaining "$16,000"
   PROGRESS hero date     : "February 2027"
   PROGRESS ring pct      : 11%
   PROGRESS journey line  : "$2,000 of $18,000 paid"
   interestSaved          : { interestSaved: 11391.23, monthsSaved: 66 }
```

⛔ **The single variable moves the ring 11% → 78%, the journey line by $12,000, and the debt-free date
four months earlier** — and the app credits the move to the user's own repayment. `$14,000 of $18,000
paid` is not a rounding drift; it is the app telling someone they have retired a card they still owe in
full.

**Why every guard on this screen misses it — read at the site, not taken from the comment (rule 9).**
`progress.tsx` references `pendingDataRepairs`-derived trust in exactly **one** place, `hasUnreadDebtBalances`
at `:173`. That call sits **inside `if (!view.hasDebts) { … }`** (`:162`), and `hasDebts` is
`liveDebts.length > 0`. The live Amex makes it `true`, so the whole trust block — the `Some balances
couldn't be read` empty state included — is never entered, and control falls to `:235` and below, which
carries **no trust check of any kind**. `selectJourneyTotals` has none either: its 74-line docblock argues
at length about which *balance set* each branch should read and never about whether the balances are
readable at all.

⚡ **This is reading rule 2, and the test is the proof.** Pass 1's `B1` fix is pinned by
`apps/rn/tests/e2e/progress-hero-journey.spec.ts:141-169`, whose fixture seeds **both** debts with
`balance: ''` / `'   '` — the one member of the class where *every* balance is lost, which is the only
member that reaches the `!hasDebts` branch the fix put the guard in. **The mixed member — one readable
live debt beside one unread — is the ordinary case and it was never run.** The spec's own docblock says
*"`progress.tsx` contained ZERO references to `pendingDataRepairs`"*; it now contains one, and it is
unreachable on the store shape this finding is about.

⚡ **And it is `D3-1` with the polarity reversed, for the second time this report.** `widget/snapshot.ts:104-113`
records the pass-3 blocker as *"one tab apart, on one store, the app both refused and asserted the same
sentence."* The widget was wired to `mayClaim('debt-balances')` and the in-app screen the widget mirrors
was not — exactly as `C4-7` found for the Guardian card. **Two of pass 3's fixes went to the surfaces
outside the app and skipped the ones inside it.**

**Remedy (hypothesis).** The gate belongs on the **claim**, not on the empty-state branch: read
`mayClaim(store, 'debt-balances')` at `:235` and, when it is false, render the ring at an indeterminate
state with `progress-hero-journey` degraded to the honest sentence the screen already owns
(*"Some balances couldn't be read"*), and `progress-hero-date` to `'—'` — which `:300` already renders for
a null date, so the path exists. ⚠️ **Suppress the four together** (`pct`, the journey line, the hero date,
`interestSaved`), per `snapshot.ts:118-121`'s own *"repairing one figure and leaving the others is the same
false statement without the word"*. ⛔ Do **not** move the `:173` check out of the `!hasDebts` branch and
re-use it: `hasUnreadDebtBalances` asks only about `balance`, and `celebrationSelectors.ts:39-44` records
why widening *that* selector is wrong — the second consumer needs it narrow. ⚠️ And verify the remedy
against `C4-2`: both findings are the same missing question on the same screen, but they are **different
claims** (the ring vs. the trophy shelf's membership) and a single store-wide gag would take out a
genuinely-earned trophy, which `progress.tsx:186-196` records this screen having already done once.
### C4-10 — `major` · the trust **completeness gate cannot fail** — one wildcard route makes every new repairable money field "routed" by construction

**User-facing consequence.** The next money field the repair layer learns to write — a second balance, a
promotional APR, a fee — lands in the store repaired to `0` with **no claim deciding which sentence it
poisons**, and the check written to force that decision passes; the surface that reads it then states the
repaired `0` as the user's money, which is pass-2's `C2`/`C4` verbatim.

**File.** `apps/rn/src/store/trustSelectors.test.ts:167-190`, the block headed *"THE COMPLETENESS GATE —
every field the repair layer can write must be ROUTED to a claim"* — lane **B**, origin **fix-churn**.
The wildcard it dies on is `apps/rn/src/store/trustSelectors.ts:154`
(`'row-figures': { debt: 'any', requiredExpense: 'any', livingExpense: 'any', goal: 'any' }`).
*(Reported here because `'row-figures'` is my lane's route — `C4-1` and `C-1`'s fifteen call sites all
hang off it — and because the fields it fails to police are the ones my screens print. Auditor B owns
the file.)*

**The measurement — four plants, one per entity, all unrouted by name.** Added to
`REPAIRABLE_MONEY_FIELDS` (`apps/rn/src/data/migrations.ts:223`):

```
debt:            optional += 'lateFeeAmount'
requiredExpense: optional += 'lateFeeAmount'
livingExpense:   optional += 'capAmount'
goal:            optional += 'matchAmount'
```

Run through the **default export**, the way `runAppTests.ts:243` calls it:

```
trustSelectors: PASSED        ← four unrouted repairable money fields, gate green
dataRepairsCopy: FAILED -> FAIL [⛔ C-m1 — "lateFeeAmount" can be repaired and has no
                                 user-facing name, so the card prints the schema key]
```

⛔ **The forward loop's `fail()` is unreachable for every entity.** It fires only when
`!routed.has(key) && !routed.has(`${entity} *`)`, and `'row-figures'` contributes `debt *`,
`requiredExpense *`, `livingExpense *` and `goal *` — all four — to `routed`. There is no repairable
field of any entity that can miss. **This is the brief's headline class, "a check that cannot fail",
and the fourth consecutive instance it told me to assume exists.**

⚠️ **What DOES red is a hard-coded count, and its message points away from the question.**
`:181` is `eq(repairable.length, 10, 'the fixture knows how many repairable money fields there are
(raise it WITH the field)')`. That is a real tripwire — it is what reds on my plant before anything else
— but its instruction is *raise the number*, which is the one action that clears it **without** deciding
which claim the new field poisons. I relaxed it exactly as instructed and the gate went green with four
unpoliced fields. ⚡ **Rule 6 in the other direction:** an earlier assertion reddening is what made the
dead one look alive.

⭐ **The reverse direction is real and I am not disputing it.** The stale-route loop (`:186-189`) skips
`' *'` keys and genuinely checks every named route against `REPAIRABLE_MONEY_FIELDS`; it works. And the
**copy** half of the same class is genuinely guarded — `dataRepairsCopy.test.ts:201`'s `C-m1` assertion
reds on the plant, and I verified it is load-bearing independently of the count by relaxing the count and
re-running. **Only the trust-routing half is vacuous.**

**Remedy (hypothesis).** Do not delete the wildcard — `'row-figures'` means *"any field this row
restates"* and that is the correct semantics for it. Instead **exclude wildcard routes from the
completeness check's `routed` set**, so a new field must be named by at least one *specific* claim
(`debt-balances`, `required-plan`, …) before the gate passes, and let `'row-figures'` keep answering
`any` at runtime. ⚠️ Expect that to red immediately on fields that are *deliberately* row-only; the
honest move is a small explicit `ROW_ONLY` allow-list with a `why` per entry, ratcheting down — the same
shape `lint:trust-claims`' `OPEN` ledger already uses. ⛔ Do **not** fix this by raising the `10`: that is
the action the current message asks for and it is what keeps the gate dead.

### C4-11 — `major` · there are **FOUR** restore doors, `C-7`/`C-7b` fixed two, and the launch-time one can replace data the user just typed

**User-facing consequence.** A user who reinstalls the app, types their paycheck and their first debt, is
interrupted, and reopens the app is asked *"Restore from iCloud? There is a backup of your plan in your
iCloud account. Restore it to this device?"* — and tapping **Restore** silently replaces what they just
entered, with no statement of what the backup holds and no mention of the amounts inside it the reader has
already recorded that it could not read.

**Files.**
- `apps/rn/src/app/_layout.tsx:216-240` — origin **first-look**, my route. The launch-time one-shot offer.
- `apps/rn/src/components/DataResetScreen.tsx:83-98` — ⛔ **unrouted this round**. A one-tap
  `Restore from iCloud` with no confirm and no description at all.

**The measurement — count the doors whole (rule 5), because the ledger counts two.**
`S1P3-C7B-CLOUDDOOR`'s registry text says *"Both doors compose from one owner (`describeRestorePreview`)
so they cannot drift."* A repo-wide count of every production call that imports a backup into the live
store returns **four**:

```
apps/rn/src/hooks/use-cloud-backup.ts:187   restoreNow  <- CloudBackupSheet   GUARDED  describeRestorePreview
apps/rn/src/components/more/BackupSheets.tsx:164  the file door              GUARDED  describeBackup
apps/rn/src/app/_layout.tsx:228             launch-time iCloud offer          NO DISCLOSURE
apps/rn/src/components/DataResetScreen.tsx:92  the data-reset screen          NO DISCLOSURE, NO CONFIRM
```

⚡ **"Two doors" → four.** That is the eighth consecutive item in this audit whose site count came in
short, and it is the reason the remedy did not reach the doors it did not know about.

**Why door 3 is destructive and door 4 is not — traced, not assumed (rule 9).** Both are gated on
`!isOnboarded(store)`, and `isOnboarded` is exactly `store.prefs?.onboardingComplete === true`
(`storage/cloudBackup/service.ts:273`). `onboarding.tsx:12-14` records that the four steps *"write to the
store as they go"* and that only `CompletionStep` calls `completeOnboarding()`. `step` is React state, so
a relaunch restarts the flow at 0 **with the paycheck and first debt already persisted and
`onboardingComplete` still `false`** — which is precisely the audience `_layout.tsx:212` admits. Door 4
renders only over a `data-reset` store, which is `createDefaultStore()` and holds nothing, so **nothing is
destroyed there**; its defect is the missing disclosure alone.

⚠️ **The prerequisite is real, not hypothetical.** `shouldAutoBackup` refuses a not-yet-onboarded store,
so *this* install never wrote the backup — a previous install on the same Apple ID did. **That is the
one-shot offer's entire reason to exist**, so the store shape it fires on is the intended one, not an
edge.

⚠️ **Honest narrowing.** Door 3's copy is not *false* — there is a backup, and it can be restored. The
finding is that an irreversible replace is offered with **no description of either side**: not what is
being written, and not what is being overwritten. `describeRestorePreview(result.store)` is already in
scope at `:228` — the store is in hand from the `restoreFromCloud` two lines above — so the sentence the
other two doors say costs one argument here.

**Remedy (hypothesis).** Put `describeRestorePreview(result.store)` into the body of both alerts, which is
the whole point of `C-7b`'s one-owner remedy and needs no new mechanism. ⚠️ Door 3 additionally needs the
*overwrite* named when the local store is non-empty — something on the order of *"This will replace the
paycheck and 1 debt you have entered on this device"* — because that is the half neither `describeBackup`
nor `describeRestorePreview` speaks to. ⛔ Do **not** solve it by suppressing the offer when local data
exists: a user reinstalling *wants* the old plan back, and removing the door re-creates the *"the door was
built, verified, then unhandled"* failure `config/qa.ts:96-101` records for the demo entry.


---

## 2. Closure verdicts

### The table — every pass-3 id and every `S1P3-*` entry in my lane

| pass-3 id | verdict | registered guard | guard verdict |
|---|---|---|---|
| **C-1** | `CLOSED` | `S1P3-C1-ROWFIGURES` | ⚠️ **not reached** (e2e) |
| — | — | `S1P3-C1-GATE` | ⭐ **real** — plant-verified below |
| **C-2** | `CLOSED` | `S1P3-C2-SUMS` | ⚠️ **not reached** (e2e) |
| **C-3** | `CLOSED` | `S1P3-C3-QUANTITY` | ⚠️ **not reached** (e2e) |
| **C-4** | ⛔ `PARTIAL` → `C4-2` | `S1P3-C4-ARCHIVE` | ⚠️ **not reached** (e2e) |
| **C-5** | `CLOSED` | `S1P3-C5-PAYWALL` | ⭐ **real**, token independently load-bearing |
| **C-6** | ⛔ `PARTIAL` → `C4-1` | `S1P3-C6-CALENDAR` | ⚠️ **not reached** (e2e) |
| **C-7b** | ⛔ `PARTIAL` → `C4-6`, and `C4-11` finds 2 more doors | `S1P3-C7B-CLOUDDOOR` | ⭐ **real**, and pinned to the right line |
| **D3-1** | `CLOSED` | `S1P3-D3-1-WIDGET` | ⭐ **real**, token independently load-bearing |
| **D3-2** | ⛔ `PARTIAL` → `C4-7` | `S1P3-D3-2-SPOKEN` | ⭐ **real**, token independently load-bearing |
| **B2** | `CLOSED` | `S1P3-B2-APRBOUND` | ⚠️ **not reached** (e2e) |
| **m1** | `CLOSED` | `S1P3-M1` | ⭐ **real** — the token IS the first assertion to red |
| **m2** | `CLOSED` | `S1P3-M2` | ⭐ **real**, isolated from m1's plant |
| **m3** | `OPEN` — **and I agree it is out of scope** | none | — |
| **m4** | `CLOSED` | `S1P3-M4` | ⭐ **real**, token independently load-bearing |
| **m5** | `CLOSED` (subsumed by C-3, as pass 3 predicted) | inherits `S1P3-C3-QUANTITY` | — · one new minor on the line, `C4-8` |
| **m6** | `CLOSED` | `S1P3-M6` | ⭐ **real** — token-only, but the token IS the branch |
| **m7** | behaviour `CLOSED` · ⛔ **`GUARD-ONLY`** | `S1P3-M7` | ⛔ **DEAD** — green with the defect fully restored |

**Lane-adjacent entries my findings bear on** *(D and B own the files; recorded so nobody counts them twice)*

| entry | verdict | measurement |
|---|---|---|
| `S1P3-D3-CAPS` | `CLOSED` | `MAX_OPEN = 0` is a real literal cap — adding one `OPEN` row reds `✗ [ledger] MAX_OPEN is 0 and OPEN holds 1`. The vacuous `Object.keys(OPEN).length` form is gone. **But the ledger's *population* escapes by substring — `C4-4`** |
| `S1P3-G5-SAVINGSPOOL` | ⛔ `PARTIAL` | the two-pot case is fixed and captioned; the **one-pot** case suppresses the whole offer with no caption, on **both** the Guardian card and Can-I-Afford-It — `C4-5`, now measured on both |
| `S1P3-G-LIVENESSLEDGER` | ⛔ `PARTIAL` | the ledger is real and the durable idea is right; `LIVENESS_RE` reads one side of a two-sided predicate, so 7 store-debt sites are invisible to it — `C4-3` |

**Totals: 11 `CLOSED` · 4 `PARTIAL` · 1 `GUARD-ONLY` · 1 `OPEN`-and-agreed · 9 guards proven real ·
1 guard proven dead · 6 guards not reached.**

⚡ **Every one of the four `PARTIAL`s is the same shape** — the fix landed on the instance the finding
named and a sibling instance of the same class, on the same store, was left asserting. That is not four
coincidences; it is a property of how the fixing session read the findings.

---

⚠️ **Method.** Every verdict below is a **plant**, not a reading: the named fix is un-fixed in the
isolated worktree, the registered guard is run, and the output is pasted. Where the registered token is
not the first assertion in its block, the earlier assertion is **relaxed and the run repeated**, per
reading rule 6 — a token that only ever reds behind a neighbour is not load-bearing. Restores are
verified with `git status --porcelain` after every plant.

### D3-2 — `PARTIAL`  ·  guard `S1P3-D3-2-SPOKEN` — **real**

**Plant.** `apps/rn/src/liveActivity/paydayActivityContent.ts:82`, delete
`if (!mayClaim(store, 'required-plan')) return null;`.

```
npx tsx src/liveActivity/paydayActivityContent.test.ts     EXIT=1
FAIL [⛔ D3-2 — the Lock Screen shows nothing rather than naming money free over an obligation
      nobody read (expected null, got {…,"title":"Looks clear this paycheck",
      "line":"Apply the spare $1,800 toward Visa when you’re ready — your $200 cushion stays
      protected either way."})]
```

**Token independence (rule 6).** The registered token is the *second* assertion (`:155`), and the
absence assertion at `:152` reds first. Relaxed `:152` and re-ran:

```
FAIL [⛔ D3-2 — …and a running activity is ENDED, not left showing the last figure
      (expected "end", got "update")]
```

⭐ Both halves red independently. **The guard is not `GUARD-ONLY`; it is real.**

⛔ **But the verdict on the FINDING is `PARTIAL`, not `CLOSED`** — the two named surfaces (Live Activity,
Siri) are fixed and guarded; the in-app Today Payday Guardian card states the same false figure on the
same store. That is finding **`C4-7`**, and the plant above prints its exact sentence
(*"Apply the spare $1,800"*) as the un-fixed Lock-Screen output — independent confirmation from a second
direction.

---

### D3-1 — `CLOSED`  ·  guard `S1P3-D3-1-WIDGET` — **real**

**Plant.** `apps/rn/src/widget/snapshot.ts:129`, `const mayStateBalances = mayClaim(store,'debt-balances')`
→ `const mayStateBalances = true`.

```
npx tsx src/widget/widgetSync.test.ts     EXIT=1
FAIL [⛔ D3-1 — the Home Screen does not say "Debt-free" over balances the app refused to claim
      (expected "Balances unread", got "Debt-free")]
```

**Token independence (rule 6).** The registered token is `:135` (the percent assertion); `:134` reds
first. Relaxed `:134`:

```
FAIL [⛔ D3-1 — …and the ring does not say 100%, which is the same falsehood without the word
      (expected "—", got "100%")]
```

⭐ Load-bearing on its own. All four widget fields (`debtFreeDate` · `pctPaid`/`pctLabel` · `remaining`)
degrade together off the one `mayStateBalances`, and `:142-149` covers the still-paying direction as well
as the cleared one. **No sibling instance found on this surface** — see §5 for `debtsJson`, the one
ungated field, measured and not a defect.

### C-5 — `CLOSED`  ·  guard `S1P3-C5-PAYWALL` — **real**

**Plant.** `apps/rn/src/store/paywallLead.ts:63`, `if (!summary || !mayStatePlanFigures) return null;`
→ `if (!summary) return null;`.

```
npx tsx src/store/paywallLead.test.ts     EXIT=1
FAIL [⛔ C-5 — a shortfall derived from arrays missing an unread obligation is not stated]
```

**Token independence (rule 6).** The registered token is the *cushion* assertion at `:52`; the shortfall
assertion at `:47` reds first. Relaxed `:47`:

```
FAIL [⛔ C-5 — …and neither is the cushion, which is the branch that runs when the cycle looks fine]
```

⭐ Load-bearing on its own, and the guard entry's own claim about *why* that token was chosen (it covers
the non-shortfall branch) is measured true.

**Sibling sweep (this is what makes it `CLOSED` and not `PARTIAL`).** `apps/rn/src/app/paywall.tsx` was
read for every other personalised money string: the only two are `lead.fact` and `lead.offer` at
`:260-261`, both from the guarded producer. `PREMIUM_BENEFITS` (`:29-46`) carries no figure. There is no
second claim site on this screen.

### C-7b — `PARTIAL`  ·  guard `S1P3-C7B-CLOUDDOOR` — **real**

**Plant.** `apps/rn/src/data/readBackup.ts:180`, drop `${describeLosses(store)}` from
`describeRestorePreview`.

```
npx tsx src/data/readBackup.test.ts     EXIT=1
FAIL [⛔ C-7b — and it names the loss, exactly as the file door does]
```

⭐ The registered token **is** the first assertion to red under the plant — the two assertions above it
(`:427-428`) are about the intact backup and stay green, so there is no earlier-assertion masking to
relax. The guard is real and it is pinned to the right line.

⛔ **`PARTIAL`, not `CLOSED`.** The *copy* is fixed and shared by both doors. The *cloud door's rendering
of it* is not: `openRestoreConfirm` sets `preview` to `null` and renders the confirm **synchronously**,
then starts the iCloud read — so for the whole duration of that read the confirm is byte-identical to the
un-fixed state, and the confirm button is not disabled because `previewRestore` never sets `busy`. That
is finding **`C4-6`**, and it is the same defect C-7b names, reachable through timing instead of through
wording. The file door (`describeBackup`) has no such window — it describes bytes it already holds.

---

### `S1P3-C1-GATE` — **real** (check 1 of `lint:trust-claims`)

**Plant.** Added a `MoneyClaim` with a route and no production consumer
(`apps/rn/src/store/trustSelectors.ts`: `| 'orphan-claim'` + `'orphan-claim': { debt: ['balance'] }`).

```
npx tsx scripts/check-trust-claims.ts     EXIT=1
✗ [claim] 'orphan-claim' is declared in apps/rn/src/store/trustSelectors.ts and asked by NO
   production file. A route nobody calls does not guard anything — that is pass-3 C-1 verbatim.
```

⭐ The zero-consumer half of `C-1`'s structural fix is genuinely guarded. ⚠️ Its **third** check — the
unguarded-claim-site ledger — is not, and that is `C4-4`.

### ⛔ A note on the six verdicts below: the guard could not be RUN, and why

`S1P3-C1-ROWFIGURES` · `S1P3-C2-SUMS` · `S1P3-C3-QUANTITY` · `S1P3-C4-ARCHIVE` ·
`S1P3-C6-CALENDAR` · `S1P3-B2-APRBOUND` all pin tokens inside **Playwright e2e specs**
(`apps/rn/tests/e2e/trust-claims.spec.ts`, `amount-guards.spec.ts`). Un-fixing what they guard means
editing `apps/rn/src`, and `apps/rn/playwright.config.ts`'s `webServer` rebuilds the app with
`expo export --platform web -- --clear` before every run — **a Metro build is the single heaviest process
in this repo and it is the class of command that exhausted host memory and killed the first dispatch.**
⛔ Per resume-protocol rule 2 I did not run it and did not retry it with more heap. **The guard half of
these six is recorded as NOT REACHED in §6**, by name.

⚡ **What I did instead is stronger evidence than the spec run would have been**, and it is what the
brief asks for (rule 3: *print the value*): each defect's **original condition was rebuilt through the
real `runMigrations`** and the **rendered string was printed**, beside the string pass 3 recorded. The
behavioural verdict below rests on those prints. What is *unproven* is only whether the registered e2e
token reds — and for four of the six that token is an **absence assertion** (`toHaveCount(0)`,
`not.toHaveAccessibleName`), which is the exact shape reading rule 7 says has shipped green twice here.
⛔ **Pass 5 should treat the guard half of these six as unverified, not as clean.**

### C-1 — `CLOSED`  ·  guard `S1P3-C1-ROWFIGURES` — **not reached** (see above)

**Consumers, counted whole (rule 5 — no `head`).** `'row-figures'` now has **15 production call sites in
6 files** (`money.tsx` ×10, `living-expenses.tsx` ×2, `BnplCalendarSection.tsx`, `celebrationSelectors.ts`,
`guardianSelectors.ts`), against pass 3's **zero**.

**The measurement — pass 3's own store, rebuilt and printed.**

```
C-1 repairs   : ["minimumPayment","apr"]
C-1 stored    : apr = 0   minimumPayment = 0        <- the repaired values, still 0
C-1 ROW meta  : $5000.00                            <- the APR clause is DROPPED
C-1 ROW amount: —  (no suffix)                      <- UNREAD_FIGURE, not "$0.00/mo"
PRE-FIX would have printed: "$5,000.00 · 0% APR"  and  "$0.00/mo"
```

⭐ Both named falsehoods are gone, and the guard is asked **per field** — the balance still prints, which
is the "tell them less, never tell them something false" distinction the fix argued for.

### C-2 — `CLOSED`  ·  guard `S1P3-C2-SUMS` — **not reached** (see above)

**The measurement.** A store with `Rent: 'fourteen hundred'` beside a readable `Gas: 120`, and
`Groceries: 'four hundred'` beside a readable `Fun: 120` — pass 3's exact shape:

```
C-2 repairs        : ["Rent.amount","Groceries.amount"]
C-2 expensesUnread : true   perPaycheckTotal = 55.38   monthlyTotal = 120
C-2 HERO caption   : A bill amount could not be read, so there is no recommendation yet
C-2 BAR rendered?  : false
C-2 reserveUnread  : true   livingReserveRequest = 120
C-2 LIVING headline: —
PRE-FIX: "of $55 recommended each paycheck"  and  "$120.00"
```

⭐ `perPaycheckTotal` still computes **55.38** — pass 3's literal $55 — so the fixture genuinely reproduces
the condition, and the recommendation is now withheld rather than restated. The allocation bar is
suppressed too (`money.tsx:867`), which pass 3 flagged as the second half.

⚠️ **One figure on that hero is deliberately NOT gated and I judge it correct** — see §5, `reservedNow`.

### C-3 — `CLOSED`  ·  guard `S1P3-C3-QUANTITY` — **not reached** (see above)

**The measurement.** A three-cycle history in which one cycle drops the balance **$2,923 with $0
recorded paid** (the deleted-debt shape the finding names):

```
paidDown (shipped)      : 200   -> "$200 paid down over 3 cycles"
PRE-FIX (balance drop)  : 3123  -> "$3,123"
rows the user sees      : 2026-07-31 paid 200 delta -200
                          2026-06-30 paid   0 delta -2923   <- the deletion
sumPaidToDebt (the one owner, also used by guardianSelectors:114) : 200
```

⭐ **Rule 13 checked explicitly: there is ONE producer.** `sumPaidToDebt` (`historySelectors.ts:30`) has
exactly two consumers, `selectHistorySummary:54` and `guardianSelectors.ts:114`, and the subtraction is
gone from both. The headline now agrees with the per-row `$0 paid` three inches below it.

### C-4 — `PARTIAL`  ·  guard `S1P3-C4-ARCHIVE` — **not reached** (see above)

**The named instance IS fixed, measured.** A *cleared* Chase whose `originalBalance` could not be read:

```
C-4 repairs  : ["Chase.originalBalance"]
C-4 shelf    : [{"id":"c1","name":"Chase","amount":null,...}]
C-4 TOMBSTONE: Chase — (amount withheld)
PRE-FIX      : "Chase — $0 paid off"
```

⛔ **But the sibling instance of the same class is OPEN and it is worse.** The fix guards the **amount**
and not the **membership**: `selectPaidOffDebts` decides who is on the shelf with `d.balance <= 0`, and a
debt whose *`balance`* is the recorded loss repairs to `0`, walks onto the shelf, and prints its
perfectly-readable `originalBalance` as money paid. That is finding **`C4-2`** — a $12,000 card the user
owes in full, filed as *"$12,000 paid off"* and offered for sharing. The `C-4` docblock's claim that the
fix *"fixes BOTH mount points"* is measured true of the figure and false of the membership.

### C-6 — `PARTIAL`  ·  guard `S1P3-C6-CALENDAR` — **not reached** (see above)

**The named instance IS fixed, measured.** A Klarna plan whose `scheduledPaymentAmount` could not be read,
beside an intact Afterpay:

```
C-6 repairs      : ["Klarna.scheduledPaymentAmount"]
C-6 unreadPlans  : Klarna
C-6 schedule len : 5   listed len : 4        <- the degraded row is dropped, not listed as "1 of 4"
C-6 listed rows  : Afterpay p1/4 $50 | p2/4 $50 | p3/4 $50 | p4/4 $50
C-6 named caption: YES — the unread plan is named
```

⛔ **The sibling field is not covered.** `BnplCalendarSection.tsx:83` filters on `scheduledPaymentAmount`
**only**. A plan whose `originalBalance` is the recorded loss passes the filter, and the calendar then
prints `payment 1 of 2` / `payment 2 of 2` for what are truly payments 3 and 4 of 4 — finding **`C4-1`**.
Same surface, same guard, one field short.

### B2 — `CLOSED`  ·  guard `S1P3-B2-APRBOUND` — **not reached** (see above)

**Sites counted whole (rule 5).** The bound is on **both** RN hand-entry paths and there is no third:
`DebtSheet.tsx:230` and `FirstDebtOrBillStep.tsx:71`. A repo-wide grep for `apr:` writes outside tests,
fixtures and the `apr: 0` BNPL branch returns those two and nothing else.

**Placement verified against the finding's own warning.** The finding warned the bound might miss the
*edit* path. `DebtSheet.tsx:230` sits in `submit`, **before** `commit`'s `isEdit` early return, so both
add and edit are covered — read at the site, not taken from the comment.

**Boundary, from the parser rather than the form.** `parseOptionalAmount`
(`packages/core/utils/amountField.ts:53`) returns `null` for anything not `Number.isFinite(n) && n >= 0`,
so `-5` is refused *before* the bound is asked and `2599` reaches `aprN > 100` and is refused. `100`
passes, `100.0001` does not — which matches the copy *"Enter an APR between 0 and 100."*

⚠️ See §5 for the one imperfection measured here and judged **not** a defect (a negative APR is refused
with the *unparseable* message rather than the *out-of-range* one).

### The seven lane-C minors

| id | verdict | guard | the measurement |
|---|---|---|---|
| **m1** | `CLOSED` | `S1P3-M1` — **real** | plant `endPillWidth`'s fallback `: 8` → `: 0`; `npx tsx src/components/payoff/trajectoryDomain.test.ts` → `FAIL [a missing date reserves an 8-character label's worth — the same as "Oct 2026" (expected 72, got 20)]`. That **is** the registered token's assertion and it is the first to red. |
| **m2** | `CLOSED` | `S1P3-M2` — **real** | plant `Math.floor` → `Math.round` in `formatMonths`, m1 left un-planted so nothing reds earlier → `FAIL [30 months is 2.5 years and must not be sold as 3 (expected "2 years", got "3 years")]`. |
| **m3** | `OPEN — and I agree with the deferral` | none | see below. |
| **m4** | `CLOSED` | `S1P3-M4` — **real** | plant `sanitizeAmountInput` back to `raw.replace(/[^0-9]/g,'')` → the row table reds first (`FAIL [sanitize "12.50" → "12.50"]`); **relaxed the table** and the registered token reds on its own: `FAIL [a typed decimal keeps its value, not 100× it]`. The fix's unnamed second half is present too — `WhatIfControls.tsx:86` is `value={extra}`, the raw sanitised string, not `String(Number(extra) \|\| 0)`. |
| **m5** | `CLOSED` (subsumed by C-3, as pass 3 predicted) | inherits `S1P3-C3-QUANTITY` | the quantity is now `sumPaidToDebt`, a sum **over every snapshot**, so *"across N cycles"* counts the same N the figure sums. Printed: 3 snapshots → `paidDown 200`, `cycleCount 3`. The intervals-vs-cycles mismatch is gone because the subtraction is gone. ⚠️ One new defect on that same line — see `C4-8`. |
| **m6** | `CLOSED` | `S1P3-M6` — **real** | plant: delete `if (first.isPaidOff) return ...` from `WhatIfControls.tsx:31`. `npx tsx scripts/check-finding-guards.ts` → **EXIT=1**, `• S1P3-M6 — the guard is gone from apps/rn/src/components/payoff/WhatIfControls.tsx`. A token-only guard, but the token **is** the branch, so it cannot survive its own un-fix. |
| **m7** | `GUARD-ONLY` ⛔ | `S1P3-M7` — **survives its own un-fix** | see below. |

#### m3 — `OPEN`, and **I agree it is out of scope**, with a measurement rather than a concession

`paywall.tsx:90-91` is unchanged, so the finding is genuinely still open. ⛔ [D65] permits no deferrals, so
here is the case for this one, printed rather than argued. `docs/DEBT_2.0_YOUR_STEPS.md:43` fixes the 2.0
launch storefronts at **US · CA · AU · NZ**, and `packages/core/utils/amountField.ts:21-23` makes that
same list load-bearing for a *different* module. I ran the shipped expression over all four:

```
$29.99         -> "Billed yearly · $2.50/mo"      ✅
CA$29.99       -> "Billed yearly · CA$2.50/mo"    ✅
A$44.99        -> "Billed yearly · A$3.75/mo"     ✅
NZ$49.99       -> "Billed yearly · NZ$4.17/mo"    ✅
--- out of 2.0's storefronts, pass 3's own rows, for contrast ---
¥3,000         -> "Billed yearly · ¥250.00/mo"    ❌ JPY has no minor units
29,99 €        -> "Billed yearly · €2.50/mo"      ❌ separator
1 234,56 kr    -> "Billed yearly · kr102.88/mo"   ❌
```

⭐ **Every row the finding got wrong is a storefront no 2.0 user can buy from, and every row a 2.0 user
CAN see is correct — symbol and separator both.** The `replace(/[\d.,\s ]/g,'')` derivation recovers
`CA$` / `A$` / `NZ$` intact. This is not *"a defect we are choosing to live with"*; it is **unreachable in
2.0**. ⚠️ It becomes reachable the moment a `£`/`€` storefront opens, and it should be gated the way
`amountField.ts` is — by a comment at the site naming the storefront list as the precondition.
`paywall.tsx:89`'s comment currently claims the opposite (*"so it isn't a hardcoded `$` on non-USD
stores"*), which is true of the symbol and false of the formatting.

#### m7 — ⛔ `GUARD-ONLY`. The behaviour is fixed. The guard cannot see the thing it says it guards.

`S1P3-M7`'s own registry text says: *"The guard here is the **ORDERING** — the awaited call before the
reset — which is what regresses if someone restores fire-and-forget."* **That claim is false, and it is
the fourth-consecutive-instance the brief told me to assume exists, in the registry rather than in a gate.**

**The plant — the m7 defect restored verbatim, with the token left standing.** I deleted the awaited
`try/catch` block at `more.tsx:147-155` and moved the call back inside
`InteractionManager.runAfterInteractions`, **after** `appStore.getState().reset()` and after the
`router.back()` pop — i.e. exactly the fire-and-forget-after-destruction shape pass 3 described:

```
grep -n "await clearQuarantinedData();" apps/rn/src/app/more.tsx
160:      await clearQuarantinedData();

npx tsx scripts/check-finding-guards.ts     EXIT=0
✅ finding-guards: 150 of 151 findings carry a standing guard; 1 unguarded (cap 1, downward-only).
```

⛔ **Green, with the defect fully present.** The token is a *line*, and the defect is an *order*; a
substring match on a non-comment line cannot distinguish `await X()` before the reset from `await X()`
after it. Nothing else covers it either — `more.tsx` is a `.tsx` component and unreachable from the node
runner, and the registry entry itself records that the blocked branch is unreachable to every e2e off
device. **So the m7 fix is real and completely unprotected.**

⚠️ **This is the `GUARD-ONLY` row the brief's verdict scale exists for**, and I am deliberately *not*
also filing it as a numbered finding — pass 3 already carries `D3-3`, the same shape one layer down (a
token naming the wrong line). What is new is that the same class survives in a token whose registry text
**asserts** it is order-sensitive. **The remedy is not a better token**: pin it with a test, by extracting
the delete-everything sequence to a pure module the way `m2`'s `formatMonths` and `m1`'s `endPillWidth`
were extracted for exactly this reason — the precedent is in this same fix range, twice.

---

## 3. Findings tally by origin

**11 findings — 4 blockers · 6 majors · 1 minor.** Origin is the **lookup** in `ROUTING-ORIGINS.tsv`
for the finding's primary file, not my judgement.

| origin | count | findings |
|---|---|---|
| **first-look** | **2** | `C4-6` *(CloudBackupSheet.tsx)* · `C4-11` *(_layout.tsx)* |
| **fix-churn** | **5** | `C4-1` · `C4-2` · `C4-5` · `C4-7` · `C4-10` |
| **instrument** | **2** | `C4-3` · `C4-4` *(both `scripts/check-trust-claims.ts`)* |
| **off-surface** | **0** | — |
| ⛔ **unrouted** *(not one of the four — see below)* | **2** | `C4-8` *(history.tsx)* · `C4-9` *(progress.tsx + journeySelectors.ts)* |

⛔ **The fifth bucket is a finding about the route, not a category the brief supplied.** Two of my
eleven — including a **blocker** — sit in files that appear in **no row** of `ROUTING-ORIGINS.tsv` at
all. Three more findings have a second site in such a file: `C4-2`'s mount (`(tabs)/progress.tsx`),
`C4-7`'s mount (`(tabs)/index.tsx`), and `C4-11`'s fourth door (`components/DataResetScreen.tsx`).

**Why they are missing, and it is not a bug in `audit-route.ts`.** The generator routes files **changed
since `96d1f11`**; these were not changed, so they are correctly out of a *fix-verification* route. ⚡ But
the route is also what the round treats as its coverage, and **`(tabs)/progress.tsx` and `(tabs)/index.tsx`
are the two primary in-app money screens.** Every blocker I found on them is a **stale claim reached
through a changed neighbour**: the fix moved into `celebrationSelectors.ts`, `guardianSelectors.ts`,
`widget/snapshot.ts` and `paydayActivityContent.ts`, and the *unchanged* screen beside each one kept
asserting. ⛔ **A route built from the diff cannot see that class, and it is 3 of my 4 blockers.**

⭐ **`fix-churn` is again the heaviest bucket — 5 of 11, from 17 of my 72 files.** And the shape inside it
is consistent: **four of the five are a pass-3 fix that reached one surface of a pair.** `C4-1` (the
figure guarded, the count not) · `C4-2` (the amount guarded, the membership not) · `C4-7` (Siri and the
Lock Screen guarded, the in-app card not) · `C4-9` (the widget guarded, the Progress hero not). That is
the brief's rule 11 — *the fix is the most likely place for the next defect* — with a specific mechanism
attached: **the fixing session repaired the surface the finding NAMED and not the claim's other reader.**

---

## 4. Swept and found clean — BY PATH

⚠️ **Read this as bytes at `e65f9c7`, not as a path.** Pass 4's own `fix-churn` bucket exists because a
clean verdict does not survive an edit. Every row below is what I actually read or ran **this session**;
the previous (killed) run's coverage is **not** carried forward — the whole route was re-swept.

### `apps/rn/src/app/` — 5 files, all read

| path | what I read, and how far | verdict |
|---|---|---|
| `(tabs)/money.tsx` | the debt-row meta builder (`:524-610`), the `PAID OFF` section (`:233, :345`), the bills hero + caption + bar (`:669-870`), `LivingReserve` (`:1029-1070`), the breakdown data assembly (`:700-780`), both `eslint-disable` sites (`:198, :257` — both justified at the site) | **carries `C4-1`, `C4-2`'s third site.** Everything else asks `'row-figures'` per field and degrades to `UNREAD_FIGURE` |
| `living-expenses.tsx` | whole file. `anyRowFieldUnread` at `:41`, the per-row ask at `:88` | clean — measured, headline degrades to `—` |
| `paywall.tsx` | whole file for money claims. The only personalised figures are `lead.fact` / `lead.offer` (`:260-261`), both from the guarded `paywallLead` | clean · `C-5` `CLOSED` |
| `more.tsx` | the delete-everything sequence (`:120-170`) and the QA-section gating (`:401-455`) | **carries the `m7` `GUARD-ONLY` verdict.** The delete ORDER is correct; nothing guards it |
| `_layout.tsx` | whole file. `startPersistence`, the hydrate/sync chain, the background auto-backup + `backupToCloudGuarded`, the one-shot restore offer, both `storageError` screens | **carries `C4-11`** |

### `apps/rn/src/components/` — the money-bearing ones, read in full

| path | what I read | verdict |
|---|---|---|
| `money/BillBreakdownSheet.tsx` | **whole file (162 lines).** Headline, per-category subtotal, per-bill row, per-bill smoothed share, the one-time line | ⭐ **clean, and unusually thorough** — every one of the five figures asks before printing, and the category subtotal asks **per category** so a clean category still states its own total |
| `plan/ShareCard.tsx` | **whole file.** All three variants | clean. `progress.totalPaid` and `debt.amount` are `number \| null` and both null-guard; the `finale` variant's un-nullable `totalPaid` is safe because `selectCelebration:136` gates the whole finale on `mayClaim('debt-balances')` — checked, not assumed |
| `plan/dataRepairsCopy.ts` | **whole file.** `FIELD_LABEL`, `unreadRowCaption`, `describeRepair`, `repairBlocks`, `repairsA11yLabel` | clean behaviourally; one inaccurate docblock → §5 |
| `onboarding/PaycheckStep.tsx` | **whole file.** `parseAmountField` on both money fields, the `leanN > amountN` bound, the day-field validation | clean |
| `onboarding/FirstDebtOrBillStep.tsx` | the submit path (`:55-85`) | clean · `B2`'s second bound present at `:71` |
| `entities/DebtSheet.tsx` | the validation block (`:218-240`) and the BNPL branch (`:207`) | clean · `B2` `CLOSED`, placement verified in `submit` not `commit` |
| `money/BnplCalendarSection.tsx` | whole render | **carries `C4-1`'s second site**; `C-6`'s named field is correctly filtered |
| `more/CloudBackupSheet.tsx` | whole confirm flow (`:40-75, :155-175`) | **carries `C4-6`** |
| `progress/PaidOffArchive.tsx` | whole file | **carries `C4-2`** (the render is faithful to a producer that is wrong) |
| `plan/PaydayGuardianCard.tsx` | the props interface (`:37-56`) and the figure block (`:207-296`) | **carries `C4-7`** — no `unreadPlanInputs`-shaped prop exists |
| `plan/AffordabilityCard.tsx` | the `coverFromSavings` block (`:260-290`) | **carries `C4-5`'s measured twin** |
| `payoff/WhatIfControls.tsx` | `whereText` (`:21-33`), the sanitise path (`:70`), the controlled input (`:86`) | clean · `m4` and `m6` both `CLOSED`, both plant-verified |
| `payoff/TrajectoryChart.tsx` | every money-bearing expression: `deltaSuffix` (`:64-70`), `formatAxisBalance` (`:81-84`), `niceStep`, the four `balance <= 0` endpoint finds, the scrub readout (`:503`) | **no defect in the file.** It states the `view` it is handed faithfully; the ungated `view` is `C4-9` |
| `payoff/trajectoryDomain.ts` + `.test.ts` | whole file, plus two plants | clean · `m1` and `m2` `CLOSED`, both tokens load-bearing |
| `payoff/TrajectorySkiaChart.tsx` | whole file (167 lines) — a pure Skia renderer of props already computed; no store read, no formatter | clean |
| `more/LiveActivityQA.tsx` | whole file | clean — fixture content only; the one store-mutating control (`applyPaydayLandedIntent`) is behind `qaEnabled()` at `more.tsx:401` and offers Undo |
| `more/CoachMarkProbeReadout.tsx` · `LegacyBridgeProbeReadout.tsx` · `ReduceMotionProbeReadout.tsx` | all three whole | clean — diagnostics; they render counts and stage traces, no money and no PII, and all three mount behind the one `qaEnabled()` |
| `more/SettingRow.tsx` | whole file | clean — layout only |

### `apps/rn/src/components/ui/` — 21 files on my route

Structural pass over all 21 (line count, exports, `useEffect`/`useState` count, money tokens), then a
**full read of every one that holds state or an effect**: `Button.tsx` · `CheckCircle.tsx` ·
`DateField.tsx` · `SegmentedToggle.tsx` · `Select.tsx`. The other sixteen — `AddRow` · `AppIcon` ·
`AppIcon.ios` · `Card` · `ChartSkeleton` · `DateField.web` · `EmptyState` · `MasterDetail` · `Pill` ·
`PressableScale` · `RadioGroup` · `sheet-styles` · `SheetBackdrop` · `SheetScrim` · `SwitchRow` ·
`TwoColumn` — are stateless presentational components with **zero** store reads and **zero** currency
formatting (verified by grep across all 21, not by sampling). **No blocker or major in `components/ui`.**
One bounded observation on `DateField`'s a11y label → §5.

### `apps/rn/src/{theme,motion}/` — 11 files

Read all eleven structurally; the only two carrying logic rather than tokens are
`theme/colors.ts`'s `progressColor`/`resolveColors` (read in full — the ramp derives its rgb from the
token rather than restating it, which is the right shape) and `motion/haptics.ts`'s lazy native handle.
No store read, no money, no user-facing string in any of the eleven. **No blocker or major.**

### `apps/rn/src/{hooks,keyCommands,liveActivity,widget}/`

| path | what I did | verdict |
|---|---|---|
| `keyCommands/keyCommandBus.ts` | read in full; `npx tsx keyCommandBus.test.ts` → **5 assertions passed** | clean — the latch delivers once and clears |
| `keyCommands/KeyCommandListener.tsx` · `.ios.tsx` | read both | clean — the web/Android file is an inert stub |
| `hooks/use-sheet-presentation.ts` | read in full | clean — the `settled` signal is a stated signal, not a timer |
| `hooks/spotlightGeometry.ts` · `use-spotlight.ts` · `use-coach-mark.ts` | read; `npx tsx spotlight.test.ts` → **32 assertions passed**, including the no-orphan-targets check | clean |
| `hooks/use-cloud-backup.ts` | `previewRestore` / `restoreNow` read in full | **carries `C4-6`** |
| `liveActivity/paydayActivityContent.ts` + `.test.ts` | read; plant-verified | clean in itself · `D3-2` guarded here, `PARTIAL` elsewhere |
| `widget/snapshot.ts` + `widgetSync.test.ts` | read in full; plant-verified | ⭐ **clean and the model for the rest** — all four fields degrade off one `mayStateBalances`, and both directions (cleared and still-paying) are covered |

---

## 5. Measured, and NOT a defect

Each row is a measurement, not a reading. ⛔ Do not re-open one of these without beating it with another
measurement.

1. **`money.tsx:847` — the Bills hero's `reservedNow` is ungated and that is correct.** The caption and
   the bar suppress on `expensesUnread` and the value does not. `:669-677` states why: `reservedNow` is
   *"the pot — what the app actually holds, a fact about its own ledger rather than a"* sum of the
   repairable field. Measured: with `Rent` unread, the caption becomes *"A bill amount could not be read,
   so there is no recommendation yet"* and the bar does not render, while the value states what was in
   fact reserved. **Withholding it would be a true statement withheld.**

2. **`widget/snapshot.ts:150` — `debtsJson` is the one ungated field on the widget snapshot, and it
   cannot carry the falsehood.** It maps `live` (`balance > 0`), so a debt whose balance is a recorded
   loss has repaired to `0` and is already absent; every balance it emits was read. Its only consumer is
   Siri's `DebtEntity` disambiguation, which shows a list, not a total. **The shortened list is a real
   consequence and it is `D3-1`'s existing scope**, not a new claim.

3. **`selectCelebration:136` gates the finale — so `C4-2`'s class does NOT reach the grand finale.**
   `if (pending.kind === 'finale') return mayClaim(store, 'debt-balances') ? pending : null;`. I expected
   a third mount of `C4-2` here and there is not one. ⚡ That sharpens `C4-2` rather than softening it:
   the loud once-ever surface is guarded and the **permanent** trophy shelf beside it is not.

4. **`BillBreakdownSheet`'s one-time line uses the store-wide `data.unread` while its category subtotals
   use a per-category test — over-suppression, and I judge it right.** With only a *recurring* bill
   unread, the fully-readable one-time total is withheld. It is the safe direction on a sheet whose own
   headline is already suppressed, and the per-category asks are what keep the itemisation useful.
   Flagged so pass 5 does not read it as an inconsistency nobody noticed.

5. **`dataRepairsCopy.ts:36-40` claims a compiler gate it does not have — and the class is guarded
   anyway.** The docblock says *"A new repairable field must be named for the user or it does not
   compile."* `FIELD_LABEL` is `Record<string, string>`, which enforces nothing. **But
   `dataRepairsCopy.test.ts:201` catches it**, plant-verified: adding `lateFeeAmount` to
   `REPAIRABLE_MONEY_FIELDS` reds `FAIL [⛔ C-m1 — "lateFeeAmount" can be repaired and has no user-facing
   name]`, and I confirmed that assertion is load-bearing independently of the count above it by relaxing
   the count and re-running. **An inaccurate comment over real coverage — `minor` at most, and the
   comparison it makes to `ENTITY_NOUN` is what is wrong**: `ENTITY_NOUN` is
   `Record<Exclude<DataRepair['entity'],'migration'>, string>` and genuinely is exhaustive.

6. **`m3`'s locale defect is unreachable in 2.0** — measured over all four launch storefronts; see the
   `m3` verdict in §2 for the printed table. Not a deferral I am waving through: `CA$` / `A$` / `NZ$` all
   come out correct.

7. **`DateField.tsx:86`'s a11y label is unguarded and has no consumer that can reach it.**
   `accessibilityLabel={`${label}, ${display(value)}`}` is not wrapped in the `value ?` check the visible
   text uses, so an empty value would speak *today's date* over an unset field. All four call sites seed
   from `?? todayLocalISO()` or an existing record, so `value` is never `''` in production. ⚠️ The `??`
   does not catch a stored `''`; **whether a persisted date can be empty is S2's question**, and I am
   naming it rather than answering it.

8. **`apps/rn/src/config/qa.ts:9` is `QA_TOOLS = true` at this pin, by design — but nothing automated
   enforces the flip.** The QA section on More includes a control that rolls the user's pay cycle. It is
   correctly gated (`more.tsx:401`, `qaEnabled()`, one spelling, 19 sites), it offers Undo, and the file
   says *"FLIP TO `false` BEFORE THE APP STORE SUBMISSION (Phase 6)"*. **Not a defect at this pin and not
   an S1 finding** — no instrument is blinded, because no instrument exists. ⚠️ Recorded because the
   entire mechanism is one human running `git grep QA_TOOLS`, and a one-line `lint:` assertion that
   `QA_TOOLS === false` on a release build would remove the class.

9. **`use-cloud-backup.ts` downloads the iCloud file TWICE per restore** — once in `previewRestore` and
   again in `restoreNow`, so the sentence the user consents to describes read #1 and the bytes that land
   come from read #2. Read at both sites. **Not filed as a defect**: iCloud Drive is not going to change
   the file between two taps by the same user on the same device, and holding read #1's store to import
   later would keep a full portfolio in component state across an await. Named so it is a decision on the
   record rather than an oversight.

10. **`CashRunwayChart.tsx:137`'s *"next {cycles.length} paychecks"* has the same missing plural as
    `C4-8` and is unreachable at 1** — `:64` is `if (cycles.length < 2) return null;`. This is why `C4-8`
    is filed as one site and not as a class.

---

## 6. Not reached — BY PATH

⛔ Silence reads as swept, so here is everything I did not reach, and why.

### The guard half of six closure verdicts — a memory limit, recorded as a finding-shaped fact

`S1P3-C1-ROWFIGURES` · `S1P3-C2-SUMS` · `S1P3-C3-QUANTITY` · `S1P3-C4-ARCHIVE` · `S1P3-C6-CALENDAR` ·
`S1P3-B2-APRBOUND` pin tokens in `apps/rn/tests/e2e/trust-claims.spec.ts` and
`apps/rn/tests/e2e/amount-guards.spec.ts`. Un-fixing what they guard requires editing `apps/rn/src`, and
`apps/rn/playwright.config.ts:52` rebuilds with `expo export --platform web -- --clear` before every run.
⛔ **Per resume-protocol rule 2 I did not run a Metro export and did not retry anything with more heap.**
The **behaviour** behind all six is measured and printed in §2; the **guard** is unverified. Four of the
six tokens are absence assertions, which is reading rule 7's shipped-green-twice shape. **Pass 5 should
treat these six guards as unverified, not as clean.**

⚠️ **One thing pass 5 can do cheaply that I could not.** `C:/Users/Jason/debt-app-v1/apps/rn/dist` holds
a web export built **2026-08-27 18:52**, and `git diff --stat 683600ed..e65f9c7 -- apps/rn` is **empty** —
so that artifact is byte-current for the pinned app source. Serving it with `npx serve -l 4319 -s` lets
`reuseExistingServer` run the specs **without a rebuild**. That verifies the specs *pass* and the pages
*render* (rule 7's real risk); it still cannot verify a plant, because a plant needs a rebuild.

### Files on my route I did NOT read line-by-line

| path | how far I got | why it is not a hole I would bet against |
|---|---|---|
| `app/more.tsx` (570 lines) | read `:100-175` (delete-everything) and `:390-460` (QA gating); **~420 lines unread** — the settings rows, notification toggles, theme/lock rows | it carries **2** money tokens in the whole file. The money-bearing part is the delete flow, which I read in full |
| `components/payoff/TrajectoryChart.tsx` (668) | every money-bearing expression + the four liveness tests; **~500 lines of SVG path/scrub geometry unread** | the geometry states no figure; the figures it does state are the 6 lines I read |
| `components/plan/AffordabilityCard.tsx` (316) | the `coverFromSavings` block and the verdict render; **~230 lines unread** | ⚠️ **the weakest row in this table.** It prints several money figures I did not individually trace to a guard |
| `components/plan/PaydayGuardianCard.tsx` (~400) | the props interface and the figure block that carries `C4-7` | same caveat, one degree smaller |
| `components/entities/DebtSheet.tsx` (~420) | the validate/commit path; the field layout unread | the money decisions are all in `submit` |

### Route paths I touched only structurally

`components/ui/` — the 16 stateless files listed in §4 were checked by grep for store reads and currency
formatters (both zero) and by line/export/effect counts, **not read line-by-line**.
`theme/` and `motion/` — eleven files, same treatment, with `colors.ts` and `haptics.ts` read in full.

### Lane-adjacent things I deliberately did not audit

- **Auditor B's route.** `B` is closed; where my findings touch it (`celebrationSelectors.ts`,
  `guardianSelectors.ts`, `trustSelectors.test.ts`) I cite the producer and name B as the owner.
- ⚡ **`C4-3` and B's independent finding are the SAME STRUCTURAL SHAPE and are not duplicates.** Both
  are *a predicate with one side enumerated*. Mine is `check-trust-claims.ts:243`'s `LIVENESS_RE`
  reading only `balance > 0`; **cross-reference them, do not merge them** — and note that `C4-10`, found
  this session, is a **third** instance of that shape in the trust layer (a completeness set that admits
  everything through one wildcard). **Three independent auditors, one shape.**
- **`scripts/`** — auditor D's route. `C4-3`, `C4-4` and `C4-10` land in D's and B's files and are
  reported here only because the class they miss is my lane's.

---

## 7. Isolation and restore — verified, not assumed

Every plant in this report ran in the detached worktree `C:/Users/Jason/audit-c-wt` at `e65f9c7`.
**Sixteen plants across fifteen files**, each restored with `git checkout --` and each restore verified with
`git status --porcelain` in the same step:

```
apps/rn/src/liveActivity/paydayActivityContent.ts        apps/rn/src/liveActivity/paydayActivityContent.test.ts
apps/rn/src/widget/snapshot.ts                           apps/rn/src/widget/widgetSync.test.ts
apps/rn/src/store/paywallLead.ts                         apps/rn/src/store/paywallLead.test.ts
apps/rn/src/data/readBackup.ts                           apps/rn/src/app/more.tsx
apps/rn/src/components/payoff/WhatIfControls.tsx         apps/rn/src/components/payoff/trajectoryDomain.ts
packages/core/utils/amountField.ts                       packages/core/utils/testAmountField.ts
apps/rn/src/data/migrations.ts                           apps/rn/src/store/trustSelectors.test.ts
apps/rn/src/components/plan/dataRepairsCopy.test.ts       apps/rn/src/store/trustSelectors.ts
```

Final state: `git -C /c/Users/Jason/audit-c-wt status --porcelain` → **empty**, and
`git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 -- apps packages scripts` → **empty**. No server was
started; port **4319** was free at the start of this session and is free at the end.
