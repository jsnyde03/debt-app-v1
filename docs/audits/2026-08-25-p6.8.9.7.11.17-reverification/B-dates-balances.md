# B — the date arithmetic and the balance basis

**Tree:** `v1.7-dev` @ `c8d54fa`. **Fix range:** `6736a64..c8d54fa`.
**Method note:** every numeric claim below was produced by running the repo's own functions from a
scratch script (`npx tsx --tsconfig packages/core/tsconfig.json`), not read off a comment. Values are
printed inline. No file under `apps/`, `packages/`, `scripts/` was edited.

---

## Job 1 — the fixes, re-verified

### `.11.11` — the `setMonth` overflow blocker (audit `C-E`) — **CLOSED, PINNED** · gate is `PARTIAL` (see Job 2 #1)

**Original finding:** `d.setMonth(d.getMonth() + n)` overflows a short target month forward (Jan 31 + 1mo
= Mar 3), and everything downstream prints month-and-year only, so a user whose `paycheck.currentDate`
sits on the 29th–31st was shown a debt-free month one later than their own plan — on the hero, the end
pill, the legend, the scrub readout and both compare columns.

#### ⛔ The site count, measured over the WHOLE repo (this enumeration has been short three times)

`git grep -n "setMonth\|setFullYear\|setUTCMonth\|setUTCFullYear"` over every tracked
`.ts/.tsx/.js/.jsx/.mjs/.cjs`, **no `| head`, no directory list** — 24 matching lines, classified:

| class | count | where |
|---|---|---|
| **live month-step call sites in the shipping RN app / core / scripts** | **0** | — all seven converted |
| React `setMonthlyPayDay` state setters (false positives on the substring) | 6 | `app/page.tsx` ×5, `lib/hooks/usePayCycleSettings.ts` ×1 |
| prose in a comment or a docstring naming the banned form | 14 | `addMonths.ts`, `check-month-arithmetic.ts`, `monthLabels*.ts`, `projectDebtPayoff.ts`, `projectForecast.ts`, `rolloverPayCycle.ts`, `FirstDebtOrBillStep.tsx`, `runAppTests.ts` |
| the gate's own regex literal | 1 | `scripts/check-month-arithmetic.ts:39` |
| ⚠️ **live, unconverted, in the LEGACY root Next/Capacitor surface** | **2** | `components/AmortizationCalendar.tsx:24` · `components/Onboarding/FirstDebtOrBillStep.tsx:15` |

I also swept the second written form independently — `git grep -nE "getMonth\(\)\s*[+-]"` over the repo
root (13 hits, all accounted for above plus `toLocalISODate`/`dayBefore` month **formatting**) and
`git grep -nE "new Date\([^)]*getMonth\(\)"` (0 hits outside `addMonths.ts` itself).

⭐ **So the fixer's "7 sites in 6 files" is right for the tree that ships as `2.0.0`, and short by two for
the repo.** The two survivors are in the v1.6 Capacitor surface that `P6.11.1` deletes and that
`validate:release:legacy` (retired 2026-07-24) is the only thing that ever gated — they are the *same
defect*, they are shipping in v1.6 today, and the new gate does not scan the directory they live in.
Filed as Job 2 #1 rather than as a `.11.11` failure, because `.11.11`'s stated surface was the RN app.

**What the fix did.** `packages/core/utils/addMonths.ts:21-31` builds the target month from
`new Date(y, m + months, 1)` — day 1, so the source day cannot overflow — then clamps
`Math.min(anchorDay ?? date.getDate(), lastDayOfTarget)`. `addMonthsISO:39-41` routes both ends through
`localDate`'s owner, so the month step cannot reintroduce the UTC class. All seven RN/core sites call it:
`projectDebtPayoff.ts:233` · `projectForecast.ts:28` and `:41` · `monthLabels.ts:16` (which
`TrajectoryChart.tsx:273` now delegates to, feeding `:281`, `:289`, `:307`, `:506`, `:624`) ·
`AmortizationView.tsx:22` · `BnplCalendarSection.tsx:17` (aliased, called at `:60`) ·
`FirstDebtOrBillStep.tsx:30`. `rolloverPayCycle.ts:29` deletes its private copy and aliases the owner.

**Boundaries — measured, not reasoned.** I ran `addMonthsISO` and `addMonthsToDate` under
`TZ=Australia/Sydney`, `Pacific/Auckland`, `America/Santiago` (a DST transition *at midnight*),
`Australia/Lord_Howe` (a 30-minute DST shift) and `UTC`. **Identical, correct output in all five:**

```
addMonthsISO(2026-01-31, 1)  = 2026-02-28      addMonthsISO(2026-01-31, 0)  = 2026-01-31
addMonthsISO(2024-01-31, 1)  = 2024-02-29      addMonthsISO(2026-01-31, 12) = 2027-01-31
addMonthsISO(2026-12-31, 1)  = 2027-01-31      addMonthsISO(2026-03-31, -1) = 2026-02-28
23:00 on 2026-01-31 +1mo -> 2026-02-28   23:00 on 2026-04-05 +1mo -> 2026-05-05
23:00 on 2026-10-03 +1mo -> 2026-11-03   23:00 on 2026-09-30 +1mo -> 2026-10-30
```

The step never adds milliseconds — `new Date(y, m, 1)` then `setDate()` are both local-calendar
operations — so no DST offset can move the day. **No finding.**

**Preserved?** Yes, and I checked the direction the finding never mentioned.
- `rolloverPayCycle`'s `anchorDay` semantics are byte-identical: the private `addMonths` and
  `addMonthsISO` have the same body, and `advanceDueDateToPlanDate:70` still derives the anchor from
  `originalDueDate ?? dueDate`. Pinned at `testAddMonths.ts:52-53` (`2026-02-28 +1 anchor 31 → 2026-03-31`
  and, without an anchor, `→ 2026-03-28`).
- `addMonthsToDate` **discards the source time-of-day** (the result is local midnight) where
  `setMonth` preserved it. Every one of the seven consumers either prints month/year only or round-trips
  through `toLocalISODate`, so nothing observes it. Checked each.
- `addMonthsToDate` does **not mutate its argument** (`setMonth` did) — asserted at
  `testAddMonths.ts:56-59`, and it matters because `projectForecast` and `monthLabels` call it in a loop
  over one start date.
- `FirstDebtOrBillStep`'s rewrite is `addMonthsToDate(new Date(), 1, 1)`; the old code did
  `setMonth(+1)` **then** `setDate(1)`, i.e. it already pinned the day. The new `anchorDay = 1` reproduces
  that exactly and additionally fixes the Jan-31 case where the overflow happened *before* the `setDate`.

**Pinned?** Two suites, and both would red on the original defect.
- `packages/core/utils/testAddMonths.ts:77-81` — `estimatedDebtFreeDate === "February 2026"` through
  `projectDebtPayoff`'s **public signature** with `startDate: "2026-01-31"`. **This is the assertion that
  carries the finding.** The eight assertions before it (`:42-49`) exercise the helper only; on the
  original defect the helper was correct (it lived in `rolloverPayCycle`), so **none of them fires first**
  and `:77` is genuinely reached. Verified by reading the file top-to-bottom: `:42-59` helper, `:62-65`
  rollover, `:70+` the user-facing date.
- `apps/rn/src/components/payoff/monthLabels.test.ts:30` — `monthYearLabel('2026-01-31', 1) === 'Feb
  2026'` is the **first** assertion in the file, so nothing can shadow it. `:35-40` walks twelve
  consecutive months from the 31st, which is the case that catches a clamp that skips a month *and* one
  that names a month twice.
- Registered: `runRegressionTests.ts:42` and `runAppTests.ts:71`.
- ⚠️ **Three of the seven sites are pinned by nothing but the gate** — `AmortizationView`,
  `BnplCalendarSection`, `FirstDebtOrBillStep`. The fixer filed this to P6.10 himself. It matters more
  than the log says, because the gate has holes (Job 2 #1): a replacement written in the *other* spelling
  would be caught by neither.

**Verdict: `CLOSED` for the shipping app.** The behaviour is gone, the boundaries are correct in every
storefront timezone, and the two headline surfaces are pinned by assertions that would red on the
original defect.

---

### `.11.15` — `originalBalance` becomes a HIGH-WATER MARK ([D62]) — **PARTIAL** · `major`

**Original finding / decision:** `originalBalance` was stamped once at creation and no edit path updated
it, so a balance revised **upward** left it behind, `paid = original − balance` went negative, and the
journey ring read 0% for the rest of that debt's life. [D62]'s deciding case is a **correction** — enter
`$500`, mean `$5,000` — reached through `verifyDebtBalances`, a flow the app *asks* people to use.

**What the fix did.** `packages/core/debt/originalBalanceHighWater.ts:40-54` —
`next = Math.max(current ?? 0, balance, 0)`, returning the **same object** when nothing moves. Called at
four seams: `store.ts:425` (`updateDebt`, balance-edit branch only), `:447` (`verifyDebtBalance`),
`:464` (`verifyDebtBalances`) and `migrations.ts:197` (the invariant, which runs on **every hydrate** —
`store.ts:337`).

**The upward half is genuinely closed and genuinely pinned.** `storeActions.test.ts:243` drives the wired
`updateDebt` and asserts `originalBalance === 5000`; `:253` and `:257` do the same for the batch and
singular verify; `:263` asserts paying down does not lower the mark. Those are the *calls*, not the
helper — the `.11.11` lesson applied on purpose.

#### ⛔ [D63], re-measured. The counter-measurement is FALSE as stated, and I printed the values.

[D63] reversed the agreed BNPL carve-out on this claim (`DEBT_ELEVATION_LOG.md:180-183`,
`originalBalanceHighWater.ts:21-27`, `testOriginalBalanceHighWater.ts:77-79`):

> `bnplPaymentsTotal` is `max(remaining, basis / scheduled)`, so a stamp can only **raise** the total, and
> an installment plan's `balance` **is** `scheduled × remaining` — the total rises only when the plan
> itself gets longer.

**The four states the log tabulates reproduce exactly** (`bnplInstallment.ts:59-75`, real function):

| state | `sched` | `rem` | `bal` | `orig` | remaining | total | reads |
|---|---|---|---|---|---|---|---|
| half-paid, no stamp | 100 | 2 | 200 | — | 2 | 2 | *"1 of 2"* |
| half-paid, stamp 400 | 100 | 2 | 200 | 400 | 2 | 4 | *"3 of 4"* |
| half-paid, stamp == balance | 100 | 2 | 200 | 200 | 2 | 2 | *"1 of 2"* |
| plan corrected up 2→4, stamp 200 | 100 | 4 | 400 | 200 | 4 | 4 | *"1 of 4"* |

**⛔ And the state it does not tabulate breaks it.** The stamp is a number of **dollars**; the count
divides it by `scheduledPaymentAmount`, which is a **user-editable field**. The premise
*"`balance` is `scheduled × remaining`"* is true of the *current* balance and false of the *stamp*, which
was `scheduled_old × remaining_old`. So the total rises whenever `scheduled` **falls** — the plan does not
have to get longer:

| state | `sched` | `rem` | `bal` | `orig` | remaining | total | reads |
|---|---|---|---|---|---|---|---|
| **4 × $100 plan, stamp 400** | 100 | 4 | 400 | 400 | 4 | 4 | *"0 of 4 paid"* ✅ |
| **…user corrects the installment to $50** | **50** | 4 | 200 | **400** | 4 | **8** | ⛔ ***"4 of 8 paid"*** |
| plan corrected DOWN 4→2, stamp 400 | 100 | 2 | 200 | 400 | 2 | 4 | ⛔ *"2 of 4 paid"* (they paid 0) |
| same correction, pre-`.11.15` | 100 | 2 | 200 | — | 2 | 2 | *"0 of 2 paid"* ✅ |

Rendered by `money.tsx:501` (`${bnplTotal - bnplRemaining} of ${bnplTotal} paid`) and
`bnplSchedule.ts:39,47` (`paymentNumber = total − remaining + k + 1`). The same row's progress bar
(`money.tsx:493`, `1 − balance / originalBalance`) reads **50 % filled** in that state, and
`selectJourneyTotals` (`journeySelectors.ts:58-61`) contributes **`$200 of $400 paid`** to the Progress
hero — for a plan on which nothing has been paid.

⚠️ **This is not a regression introduced by `.11.15`** — `DebtSheet.tsx:184` has always passed
`originalBalance: derived` explicitly on a BNPL add, which means **`addDebt`'s carve-out
(`store.ts:395`) has never fired from the only UI that creates BNPLs.** What `.11.15` changed is that
the stamp is now also *raised* at four seams and *seeded on every hydrate*, so the state is reachable
from more places. Filed as Job 2 #3 with its severity.

⭐ **The finding, the premise and the remedy fail independently here, exactly as the brief warns.**
[D63]'s **remedy** (one rule, no carve-out) is still defensible — the carve-out would not have fixed
this either, because `DebtSheet` writes the field regardless. Its **stated mechanism** is wrong, and the
wrong mechanism is now written into three places as settled fact.

#### Two docstrings state the OPPOSITE of the shipped behaviour

- `packages/core/storage/debtPlannerStorage.ts:57-60` — *"⛔ An installment-native BNPL is **carved out
  and stays undefined** — `bnplPaymentsTotal` divides this to say 'payment 2 of 4', and filling it there
  changes the count."* **There is no carve-out.** `raiseOriginalBalance` has no `type` /
  `isInstallmentNative` branch at all (`originalBalanceHighWater.ts:40-54`), and
  `testOriginalBalanceHighWater.ts:91` asserts the opposite: *"the rule applies to BNPL like anything
  else"*.
- `apps/rn/src/data/migrations.ts:194-196` — *"AFTER `normalizeBnplInstallment` … the helper carves those
  out"*. The same false claim, at the one call site that stamps every existing user's BNPLs on hydrate.

This is the field-definition docblock — the first thing anyone touching `originalBalance` reads — and it
tells them a safety property that does not hold. Filed as Job 2 #2.

#### Other things I checked

- **Six writers were NOT consolidated.** `.11.15` step `.1` said *"one owner … a seventh inline
  `Math.max` is the defect this closes"*. The helper was added; the six direct writers all remain —
  `store.ts:395`, `store.ts:496`, `DebtSheet.tsx:184`, `:209`, `packages/core/imports/debtCsv.ts:307`,
  `apps/rn/src/data/legacyBridge/originalBalance.ts:33` — while `debtPlannerStorage.ts:57` now claims the
  field is *"raised only through `raiseOriginalBalance`"*. They are all *creation* paths, so this is a
  documentation defect rather than a behavioural one, but it is the same claim as above.
- **A negative balance with no stamp is written `originalBalance: 0`**, not left alone. The guard at
  `originalBalanceHighWater.ts:52` is `current === undefined && next === balance && balance <= 0`; with
  `balance = -50`, `next = 0 !== -50`, so it falls through to `:53`. Printed:
  `bal=-50 orig=undefined → orig=0` (a **new** object). Every consumer guards `originalBalance > 0`
  (`money.tsx:493`, `computeMilestones.ts:65`, `bnplInstallment.ts:73`,
  `legacyBridge/originalBalance.ts:32`), and `journeySelectors.ts:58` reads `0` rather than `-50`, which
  is *better*. It is stable on the next hydrate (`current = 0`, `next = 0` → same object). **Benign; not
  filed.** Only reachable from an imported blob — `verifyDebtBalance` clamps at `store.ts:440`,
  `verifyDebtBalances` at `:454`.
- **`scheduledPaymentAmount` is not lower-bounded except by `> 0`** (`bnplInstallment.ts:31`). Printed:
  `sched = 0.001, bal = 400, stamp 400` → *"payment 1 of 400000"*. `DebtSheet.tsx:167` only requires
  `parseAmountField` to return non-null. Pre-existing, unrelated to `.11.15`, needs a deliberately silly
  input — **not filed above `minor`.**
- **`scheduled = 0`** falls out of `isInstallmentNative` (`:31`) → `bnplPaymentsTotal` returns `null` →
  `money.tsx:500` takes the plain `interest-free` branch. **No division by zero. Correct.**
- **Overpayment below zero** (`bal = -50, stamp 400, rem 4`): `bnplPaymentsRemaining` clamps to `0`, the
  total stays `4`, so the row would read *"4 of 4 paid"* and `bnplSchedule` would number a payment
  `5 of 4` if one were emitted — but `buildBnplSchedule` skips `balance <= 0` (`bnplSchedule.ts:36`), so
  no row is produced. **Not reachable in the UI.**

**Preserved?** The upward direction, yes. ⛔ **The opposite direction was not considered and is now a
rule.** A balance corrected *downward* — the mirror of [D62]'s own deciding case — makes the app claim
money was paid that was not. Measured, `raiseOriginalBalance` + `selectJourneyTotals`:

```
entered $5,000 (typo, meant $500)  -> "$5000 to go",  ring 0%
corrected to $500                  -> "$4500 of $5000 paid", ring 90%   *** they have paid $0
then a real $100 payment           -> "$4600 of $5000 paid", ring 92%
```

High-water makes this **permanent** — nothing lowers the stamp, and the only escape is deleting the debt
and losing its history. Filed as Job 2 #4.

**Pinned?**
- `packages/core/debt/testOriginalBalanceHighWater.ts:44` is the **first** assertion and carries the
  correction case, so it fires before anything can shadow it. `:88-102` pin the BNPL counts — but
  every one of those cases holds `scheduledPaymentAmount` **constant at 100**, which is precisely the
  precondition the false mechanism assumed. `:92` (*"a stamp cannot inflate it"*) is a **test that passes
  with its own defect present**: the state in row 2 of the second table satisfies the helper and reads
  *"of 8"*.
- The three store seams are pinned (`storeActions.test.ts:243`, `:253`, `:257`).
- ⛔ **`migrations.ts:197` — the half that reaches already-stranded users — is pinned by nothing.**
  No test in `apps/rn/src` or `packages/core` asserts `originalBalance` after `runMigrations`. The only
  migration-adjacent hits are `mapLegacyStore.test.ts:170-177`, which pin the **backfill**
  (`withBackfilledOriginalBalance`) — a different function that only fills an absent field and never
  raises one. Deleting `raiseOriginalBalance(` from `migrations.ts:197` leaves every suite green.
  `migrationAudit/invariants.ts` was extended in this range but only for goal money fields (`:110`).

**Verdict: `PARTIAL` · `major`** — the decided half shipped and is pinned; the decision it rests on was
justified by a mechanism that is false, the resulting behaviour is wrong in two measured states, the
field's own docblock documents a carve-out that does not exist, and the migration half is unpinned.

---

## Job 2 — sweep for blocker + major

### 1. `check-month-arithmetic` catches ONE of the five ways to write the defect it exists for — **major**

**User-facing consequence:** the gate that replaced a three-times-undercounted enumeration will pass on a
re-introduced month overflow written any way but the one it greps for, so the next debt-free date that is
a month late ships green.

**Mechanism.** `scripts/check-month-arithmetic.ts:39` is `/\.\s*(setMonth|setFullYear)\s*\(/` over the
files under `ROOTS` (`:29-34`), with comments blanked by `stripComments` (`:58-62`). I copied the gate
into the scratchpad, pointed its root at a probe directory, and planted five spellings of the *same*
Jan-31 overflow. **Measured — 4 of 5 pass:**

| planted | caught? |
|---|---|
| `d.setMonth(d.getMonth() + n)` | ✅ `probe/p1.ts:2` |
| `new Date(d.getFullYear(), d.getMonth() + n, d.getDate())` | ⛔ **missed** |
| `d.setUTCMonth(d.getUTCMonth() + n)` | ⛔ **missed** — `.setUTCMonth` does not match `\.\s*setMonth` |
| `const u = 'see docs // month math'; d.setMonth(d.getMonth() + n)` | ⛔ **missed** — the `//` inside the string literal makes `stripComments` blank the rest of the line, `setMonth` included |
| `d['setMonth'](…)` (dynamic) | ⛔ missed *(contrived; not charged)* |

Both of the first two produce the identical wrong month, printed:

```
new Date(y, m+1, d) from Jan 31 2026 -> Tue Mar 03 2026 | label: March 2026
setUTCMonth +1      from Jan 31 2026 -> Tue Mar 03 2026
```

⚠️ **And the root list is an enumerated scope list, which is the failure mode the memory
`truncated-search-hides-a-class` names.** `ROOTS` covers `packages/core`, `apps/rn/src`,
`apps/rn/tests`, `scripts` — **not** `apps/rn/scripts`, `apps/rn/plugins`, `apps/rn/modules`, and not the
repo-root legacy tree, where **two live unconverted sites remain**:
`components/AmortizationCalendar.tsx:24` (`base.setMonth(base.getMonth() + monthOffset)` — a payoff
calendar) and `components/Onboarding/FirstDebtOrBillStep.tsx:15` (the same first-bill default the RN copy
was fixed for). That surface still ships as v1.6 and is not deleted until P6.11.1.
*(`check-local-dates.ts:24-28` has the same shape and additionally omits `scripts/`.)*

**Confidence:** measured — the probe run and the two-line arithmetic proof are both above.

**Would anything catch it?** No. Three of the seven converted sites (`AmortizationView`,
`BnplCalendarSection`, `FirstDebtOrBillStep`) have no test of their own, so for those the gate is the
only instrument, and it is blind to four of five spellings.

---

### 2. The `originalBalance` docblock documents a BNPL carve-out that the code does not have — **major**

**User-facing consequence:** the next person to add a writer or a consumer of `originalBalance` reads, at
the field's own definition, that installment BNPLs are exempt — and will reason about the *"payment 2 of
4"* count from a guarantee that was reversed, which is how finding #3 below gets shipped again.

**Mechanism.** `packages/core/storage/debtPlannerStorage.ts:57-60`:

> ⚠️ **Raised only through `raiseOriginalBalance`** … ⛔ An installment-native BNPL is **carved out and
> stays undefined** — `bnplPaymentsTotal` divides this to say *"payment 2 of 4"*, and filling it there
> changes the count.

`raiseOriginalBalance` (`packages/core/debt/originalBalanceHighWater.ts:40-54`) contains no `type` or
`isInstallmentNative` branch, its own docblock at `:19-31` is titled *"ONE RULE, INCLUDING BNPL — and the
case for exempting it was measured false"*, and `testOriginalBalanceHighWater.ts:91` asserts
*"the rule applies to BNPL like anything else"*. The same false claim repeats at
`apps/rn/src/data/migrations.ts:194-196` (*"the helper carves those out"*), on the call site that stamps
every existing user's BNPLs at hydrate. Six direct writers also remain despite *"raised only through"* —
`store.ts:395`, `store.ts:496`, `DebtSheet.tsx:184`, `:209`, `packages/core/imports/debtCsv.ts:307`,
`apps/rn/src/data/legacyBridge/originalBalance.ts:33`.

⚠️ **Rated `major` rather than `minor` under the brief's own exception** — this is load-bearing for a
maintainer's safety decision, and the repo has now paid for the identical shape twice ([D63] itself, and
`findings-cite-comments-as-evidence`).

**Confidence:** measured — read both files, and `testOriginalBalanceHighWater.ts` asserts the opposite.

**Would anything catch it?** `lint:comments` checks convention, not truth. Nothing.

---

### 3. Correcting a BNPL's installment amount downward makes the app say *"4 of 8 paid"* on a 4-payment plan — **major**

**User-facing consequence:** a user who fixes a mis-typed installment (entered $100, the plan is really
$50) is told on the Money tab that they have paid 4 of 8 payments, shown a half-filled progress bar and
counted for **$200 of $400 paid** on the Progress hero — on a plan where they have paid nothing.

**Mechanism.** `bnplPaymentsTotal` (`packages/core/debt/bnplInstallment.ts:70-75`) is
`max(remaining, round(basis / scheduled))` where `basis` is `originalBalance` — **dollars** — divided by
`scheduledPaymentAmount`, a field `DebtSheet.tsx:316` lets the user edit. [D63]'s premise that
*"`balance` is `scheduled × remaining`, so the total rises only when the plan gets longer"* holds for the
*current* balance and not for the stamp, which was `scheduled_old × remaining_old`. Printed, running the
real functions:

```
4 x $100, stamp 400   -> remaining 4, total 4   money.tsx: "0 of 4 paid"     bar   0%
...installment -> $50 -> remaining 4, total 8   money.tsx: "4 of 8 paid"     bar  50%
                                                journey:   "$200 of $400 paid"
plan corrected 4 -> 2 -> remaining 2, total 4   money.tsx: "2 of 4 paid"     (paid: 0)
   same, pre-.11.15   -> remaining 2, total 2   money.tsx: "0 of 2 paid"     ✅
```

Rendered at `apps/rn/src/app/(tabs)/money.tsx:500-501`, the bar at `:493`, the schedule rows at
`packages/core/debt/bnplSchedule.ts:39,47`, the hero total via
`apps/rn/src/store/journeySelectors.ts:58-61`.

⚠️ **Pre-existing, not introduced by `.11.15`** — `DebtSheet.tsx:184` has always written
`originalBalance: derived` on a BNPL add, so `addDebt`'s carve-out (`store.ts:395`) never fired for a
BNPL created in the app. `.11.15` widens reach: four seams now *raise* it and the migration invariant
seeds it on every hydrate.

**Confidence:** measured (values printed from `bnplPaymentsTotal` / `bnplPaymentsRemaining`).

**Would anything catch it?** No. `testOriginalBalanceHighWater.ts:82-103` and
`testBnplInstallment.ts:86-88` hold `scheduledPaymentAmount` fixed at `100` / `78.86` in every case, and
`:92` asserts *"a stamp cannot inflate it"* — **a test that passes with its own defect present.**

---

### 4. A balance corrected DOWNWARD makes the app claim money was paid that never was, permanently — **blocker**

**User-facing consequence:** a user who enters `$5,000` by mistake and fixes it to `$500` is told on the
Progress hero *"$4,500 of $5,000 paid"* with the journey ring at **90 %** — money they never paid — and
because `originalBalance` is now a high-water mark, no action in the app ever lowers it again.

**Mechanism.** `originalBalance` is stamped at creation (`DebtSheet.tsx:209`, `store.ts:395`) and, since
`.11.15`, only ever raised (`originalBalanceHighWater.ts:46` — `Math.max(current ?? 0, balance, 0)`).
`selectJourneyTotals` (`apps/rn/src/store/journeySelectors.ts:58-61`) computes
`totalPaid = max(0, totalOriginal − totalConfirmed)` and `:72` prints
`"<totalPaid> of <totalOriginal> paid"`. Printed:

```
entered $5,000 (typo, meant $500)  -> "$5000 to go",           ring  0%
corrected to $500                  -> "$4500 of $5000 paid",   ring 90%   <== they have paid $0
then a real $100 payment           -> "$4600 of $5000 paid",   ring 92%
```

The same figures drive the debt row's bar (`money.tsx:493`), the milestone crossings
(`packages/core/debt/computeMilestones.ts:39-44`), the payoff finale's total
(`celebrationSelectors.ts:59`) and the widget (`widget/snapshot.ts:74`) — so a fabricated
*"$4,500 paid"* can also fire a 75 % milestone celebration the user did not earn.

⚠️ **Pre-existing in effect, newly a RULE.** Before `.11.15` the stamp was simply never updated, so the
same state arose; `.11.15` considered the upward correction and made the downward one unfixable by
design. The escape is deleting the debt and losing its history.

⛔ **Calibration, stated so it can be knowingly downgraded:** the app cannot distinguish *"I typed the
wrong number"* from *"I paid it down"*, so a fix needs a product decision (a distinct "correct this
entry" affordance, or lowering the stamp when a balance edit is not a payment), not just a code change.
If 🎯 reads that as unavoidable-by-design rather than a defect, `major` is the defensible alternative. I
rated it `blocker` because the sentence shown is a specific dollar figure about money the user did not
pay, it is permanent, and it is the exact mirror of the case [D62] was built for.

**Confidence:** measured (`raiseOriginalBalance` + the `selectJourneyTotals` formula, values above).

**Would anything catch it?** No. `storeActions.test.ts:228-263` covers the upward correction and the
paid-down case; nothing asserts what the hero says after a downward correction.
`journeySelectors.test.ts` seeds no such state.

---

### 5. `cannotAmortize` ignores the rolled-on freed minimums, so an ordinary two-debt snowball is declared unpayable — **major**

**User-facing consequence:** a user with a 0 %-APR loan and a credit card whose typed minimum is under
its monthly interest sees **no debt-free date at all** — the Progress hero prints `—`, the chart's end
pill disappears, the interest-saved line vanishes and the What-If slider reports no benefit at any
amount — while the trajectory drawn on the same screen shows the plan clearing.

**Mechanism.** `packages/core/debt/projectDebtPayoff.ts:73-90`. The loop's own comment (`:122-127`) says
the defining mechanic is that *"total monthly outflow stays constant, so when a debt is paid off its
freed minimum rolls onto the next target"* — and `monthlyBudget` (`:135`) is built exactly that way. But
`cannotAmortize` re-derives the payment total from **`activeDebts`** (`:76`, `:85-87`), so the moment a
debt clears, its minimum leaves the comparison while the real budget is unchanged. The guard then fires
mid-loop and `:143-149` abandons the whole projection.

Printed, real `projectDebtPayoff`:

```
Loan  $6,000  0% APR   min $600      budget = $800/mo
Card $12,000 24% APR   min $200      (monthly interest on the card = $240)

  -> monthsToDebtFree = 10   estimatedDebtFreeDate = "Unable to estimate"   totalInterestPaid = 0
  the SAME card at the SAME $800 budget, alone:  19 months, "March 2028", $2,409 interest
  buildPayoffTrajectory on the SAME two debts:   reaches $0 at month 29
```

The guard fires at month 10 — when the Loan clears and `activeDebts` becomes the card alone, so
`monthlyPaymentTotal` drops from `$800` to `$200` against `$240` of interest.

**Where it surfaces.** `apps/rn/src/store/planSelectors.ts:110-123` maps the sentinel to `null` →
`payoffSelectors.ts:90` → `progress.tsx:268` renders `{view.debtFreeDate ?? '—'}` and `:230`'s
accessibility label drops the date. `TrajectoryChart.tsx:482` hides the end pill on a null
`debtFreeDate`. `computeInterestSaved.ts:47-48` returns `kind: 'none'`.
`analysisSelectors.ts:111-118` sets `canEstimate = false`, so `monthsSaved` and `interestSaved` are `0`
for every What-If slider position. ⚠️ **`payoffSelectors.ts:68-74` builds the chart from
`simulatePayoff` on the same debts with the same extra**, which is why the two disagree on one screen.

**Confidence:** measured — three engine calls printed above, same inputs.

**Would anything catch it?** No. Both existing cases are **single-debt**:
`packages/core/testing/testDebtMathRegression.ts:182-195` (one $10,000 debt, `minimumPayment: 1`) and
`testStressScenarios.ts:220-238` (one $20,000 card at 99 % APR). With one debt there is nothing to free,
so the guard is correct and both pass. No test exercises a portfolio where a cleared debt's minimum
rolls on.

---

### 6. "Save for it" prices its pace and its ready-by date off a cushion $175 larger than the card that launched it — **major**

**User-facing consequence:** the sheet offers *"Save fast — $1,500 this paycheck · ready by 31 Aug"* and
commits it as the goal's funding pace, when the plan can only put `$1,175` in — so the date the user
signed off on is a whole paycheck early and the app's own allocator will not meet it.

**Mechanism.** `apps/rn/src/store/guardianSelectors.ts:556` —
`const discretionary = base ? selectDiscretionary(base) : 0;` — and the paces at `:563-570` divide the
purchase by it. `selectDiscretionary` is the **partition total**, which still contains 3.8's expense
reserve; `selectSpendable` (`planSelectors.ts:96-97`) subtracts it. `selectAffordability`, one function
above at `:386`, deliberately uses `selectSpendable(base) + appliedTopUp(store)` and its comment
(`:376-385`) says why: **"It read $850 while `PlanHero` showed 'Flexible $675' ON THE SAME SCREEN."**
T4.1b's sweep did not reach `selectSaveForItOptions`, and neither did 3.7.A3.6's `appliedTopUp` sweep.

Printed, on `affordability.test.ts`'s own `withReserve` fixture ($2,000 paycheck, $350 rent, $120
electricity, a $175 reserve contribution):

```
selectDiscretionary = 1550   selectSpendable = 1375   expenseReserveHeld = 175
affordability card "discretionaryNow" = 1375

  $1400 purchase: shown 1400/pc x 1 (ready 2026-08-31) | on spendable 700/pc x 2   <== DIVERGES
  $1500 purchase: shown 1500/pc x 1 (ready 2026-08-31) | on spendable 750/pc x 2   <== DIVERGES
  $3000 purchase: shown 1500/pc x 2 (ready 2026-09-30) | on spendable 1000/pc x 3  <== DIVERGES
```

Committing the shown $1,500 pace (`SaveForItSheet.tsx:102-110` writes it as `priorityPerPaycheck`) then
allocates:

```
expense 350 · minimum_debt 100 · cushion_buffer 200 · expense_reserve 175 · optional_goal 1175
```

⭐ **The allocator is safe** — the reserve and every obligation are still funded and `shortfall` is 0. The
harm is entirely in the promise: the sheet's `readyBy` is a date the plan will not hit. The `appliedTopUp`
omission adds to it in the same direction (measured: with a $50 applied top-up the card reads `1425`
while the sheet's pace does not move).

**Confidence:** measured (values printed from the real selectors on the repo's own fixture).

**Would anything catch it?** No. `apps/rn/src/store/affordability.test.ts:128-131` asserts only that a
`fast` option exists with `perPaycheck > 0` and a non-null `paychecks` — true of the defect and the fix
alike. The assertion that pins the *relationship* (`:39-56`) covers `selectAffordability` and
`PlanHero`, not this sheet.

---

## Swept and found clean

Extending `.11.10`'s list. Named so the next round ratchets off this one.

- **`packages/core/utils/addMonths.ts`** — the clamp itself, at every boundary the brief names, in five
  timezones including two east of UTC and one whose DST transition is at midnight. It never adds
  milliseconds, does not mutate its argument, and `addMonthsISO` round-trips through `localDate`'s owner.
  **No blocker or major found.**
- **`packages/core/recurrence/rolloverPayCycle.ts`** — the delegation is body-identical to the private
  copy it deleted; `anchorDay` still comes from `originalDueDate ?? dueDate` (`:70`) and the 60-iteration
  safety bound is unchanged. **No blocker or major found.**
- **The other six converted month sites** — `projectDebtPayoff.ts:233`, `projectForecast.ts:28,41`,
  `monthLabels.ts:16` (+ `TrajectoryChart.tsx:273,281,289,307,506,624`), `AmortizationView.tsx:22`,
  `BnplCalendarSection.tsx:17,60`, `FirstDebtOrBillStep.tsx:30`. Each reads month/year only or
  round-trips through `toLocalISODate`, so the discarded time-of-day is unobservable. **No blocker or
  major found.**
- **`scripts/check-local-dates.ts`'s changed part** *(on the ratchet list, edited by this range)* — I
  re-ran the gate's own `HAND_PARSE` regex over its own `ROOTS` from the scratchpad: **41 hits, exactly
  the new baseline.** The ratchet-down claim is accurate and the gate is not carrying slack. The
  `toISOString`/`getUTC` half is unchanged. **No blocker or major found.** *(Noted, `minor`: `ROOTS`
  omits `scripts/`, which `check-month-arithmetic` covers — the two guards disagree about their own
  surface.)*
- **`apps/rn/src/store/store.ts`'s balance writers** — `verifyDebtBalance` (`:440`) and
  `verifyDebtBalances` (`:454`) clamp negatives to 0 and round to cents before the raise;
  `logManualPayment` (`:618`) refuses a non-positive amount and only ever lowers a balance;
  `updateDebt`'s `isBalanceEdit` (`:418`) catches both a typed balance and one re-derived from a BNPL
  terms edit. `addDebt`'s and the conversion's `originalBalance ?? balance` are creation-only.
  **No blocker or major found** beyond #3 and #4 above.
- **`apps/rn/src/data/legacyBridge/originalBalance.ts`** — the new non-object guard (`:34`) passes the row
  through rather than dropping it, which is correct: `repairMoneyFields`
  (`migrations.ts:83-107`) is the one owner that drops it *and* records it for the user, and the
  pass-through preserves object identity so `mapLegacyStore.ts:217`'s repair count stays honest.
  **No blocker or major found.**
- **`raiseOriginalBalance`'s identity contract** — it returns the same object whenever the value does not
  move, including on the second hydrate after a `-50` balance seeds a `0` stamp, so the migration
  invariant cannot report a repair that did not happen. **No blocker or major found.**
- **`bnplPaymentsTotal` at the other boundaries** — `scheduled = 0` falls out of `isInstallmentNative`
  (`bnplInstallment.ts:31`) so there is no division by zero; a negative balance clamps `remaining` to `0`
  and `buildBnplSchedule` skips `balance <= 0` (`bnplSchedule.ts:36`) so no `5 of 4` row is emitted.
  **No blocker or major found.**
- **The carried `bulkMarkRequired.ts` pre-[D2] write** — I enumerated **every** `isPaidThisCycle` reader
  in `packages/core` and `apps/rn/src` (20 sites). Every debt reader uses the `??` fallback
  (`allocatePaycheck.ts:333,364,381`, `applyRolloverPayment.ts:41`, `reconcileAutopay.ts:52`,
  `rolloverPayCycle.ts:110`, `buildTimelineItems.ts:89`, `buildCycleSnapshot.ts:37`,
  `deriveRequiredActionView.ts:80`, `planSelectors.ts:187`, `recoverySelectors.ts:46`), so the extra flag
  is inert exactly as the docblock says. **Confirmed inert — no blocker or major found.**
  ⚠️ **One correction to that docblock, `minor`:** `getDebtsWithDisplayBalances.ts:26` uses
  `debt.minimumPaidThisCycle || debt.isPaidThisCycle`, which **does** key on `isPaidThisCycle` alone when
  the split flag is `false` — the state `markDebtMinimumPaid(id, false)` (`store.ts:583`) leaves behind
  after a payday bulk-mark. It is unreachable from `apps/rn` (nothing there imports the function; only
  `getCompletedSnowballAmount` is), so there is no user-facing consequence in `2.0.0`.
- **`appliedTopUp` as a manual invariant** — I checked every cushion reader.
  `guardianSelectors.ts:292`, `:386`, `:631` and the brief's `discretionary`/`kept` (`:640-641`) all add
  it. The two that do not are `expenseReserveSelectors.ts:128` (understates the reservable cap — the
  conservative direction) and `selectSaveForItOptions` (**filed as #6**). `planSelectors.ts:357`'s band
  omits it deliberately, with the 0-in-1,820 measurement recorded at `guardianSelectors.ts:265-272`.
  **No blocker or major found beyond #6.**
- **`packages/core/forecast/projectForecast.ts`** — re-read whole after the month fix. Its only caller is
  the legacy `components/SnowballSection.tsx:290`; nothing in `apps/rn` reaches it
  (`analysisSelectors.ts:147` says so explicitly). Its hard-coded `en-US`/`USD` formatter therefore never
  reaches a CA/AU/NZ storefront. **Dead in `2.0.0` — no blocker or major found.**
- **`apps/rn/src/utils/format.ts`'s `summariseNames`** — the `max + 1` boundary is right and pinned;
  `max < 1` returns the whole list, which no caller passes. **No blocker or major found.**
- **`projectDebtPayoff`'s arithmetic other than `cannotAmortize`** — `normalizeBalance` rounds every step
  so there is no cent drift over the 600-month horizon; `totalInterestPaid` accumulates raw and rounds
  once at `:242`; the one-time-BNPL-lump exclusion from `monthlyBudget` (`:131-135`) is applied
  consistently in the payment loop (`:174`); `months >= maxMonths` returns the sentinel rather than a
  50-year date. **No blocker or major found.**
- **`packages/core/testing/runRegressionTests.ts` / `apps/rn/src/testing/runAppTests.ts`** — both new
  suites are registered (`:24`, `:42`, and `runAppTests.ts:71`) and neither is a bare `import` of a file
  whose body is a `default` export left uncalled. **No blocker or major found.** *(⚠️ `minor`: the
  registration comment at `runRegressionTests.ts:22-23` says "the carve-out exists to protect a number a
  user reads" — the same reversed-by-[D63] claim as finding #2.)*
- **`AmortizationView.tsx`** — the schedule's own echo date (`:75`) now clamps, and the per-row labels are
  each computed independently from `amort.startDate`, so no drift accumulates down the list.
  **No blocker or major found.**

## Could not determine

- **Whether the legacy root surface (`app/`, `components/`, `lib/`) is in scope for anything that ships.**
  `CLAUDE.md` says P6.11.1 deletes it and the live app is `apps/rn`, but it is still committed, still has
  `validate:release:legacy` in `package.json:55`, and carries the two live `setMonth` sites. Whether
  those need fixing or only deleting is 🎯's call, not mine.
- **`money.tsx:493`'s progress bar mixes a PROJECTED numerator with a stamped denominator**
  (`1 − view.currentBalance / debt.originalBalance`), so a premium user's row bar shrinks as interest
  accrues while they do nothing — the exact outcome `journeySelectors.ts:29-32` records as the reason
  `.11.12.10` split the hero's figures by direction. The comment at `:492` justifies it ("so the bar
  tracks what the row shows"), which is a coherent counter-argument, and 2.4's rule is 🎯's. **I did not
  rate it**; it needs the same by-direction decision `.11.12.10` made, applied one screen over.
- **`guardianPredictionCore.ts:17-20`'s `daysBetweenISO` floors a millisecond difference**, so a span
  crossing a DST spring-forward is 23 h short and reads one day low. Only consumer is
  `classifyFreshness` at 30/45-day thresholds (`guardianSelectors.ts:32`), always in the lenient
  direction, twice a year — `minor`, and I did not chase it further. `planSelectors.ts:246-250`'s
  `daysBetween` uses `Math.round` and is safe.
- **Everything in this report is read-only inference plus node-level computation.** Nothing was
  confirmed on device or in a real react-native-web build. I checked for forks anyway: `git ls-files
  "*.web.ts" "*.web.tsx"` returns 22 files and **none is a fork of any file named in this report** — the
  nearest is `apps/rn/src/components/progress/JourneyRingCanvas.web.tsx`, which draws the ring but takes
  its percentage from the same `selectJourneyTotals`, so finding #4's 90 % is identical on both
  platforms.
