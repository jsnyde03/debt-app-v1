# A — MONEY, GOALS and the PLAN CARDS

**Round:** P6.8.9.7.11.17 · re-verification
**Tree:** `v1.7-dev`, HEAD `c8d54fa`. Fix range `6736a64..c8d54fa`.
**Surface:** `money.tsx` · `GoalSheet` · `AddObligationSheet` · the `plan/` cards (`DataRepairsCard`,
`dataRepairsCopy`, `PaidOffBeat`, `GraduationCards`, `LeanSuggestionCard`, `PlanHero`,
`PaydayGuardianCard`, `GuardianScorecard`, `AffordabilityCard`, `WindfallSheet`, `ShareCard`) ·
`guardianSelectors` · `journeySelectors` · the goal / paycheck / repairs seams of `store.ts` ·
`models.ts` · `@core/engine/{emergencyFund,allocatePaycheck,testAllocation}` · the money/goal assertions
in `goal-pace-edit.spec.ts` and `progress-hero-journey.spec.ts`.

**Job-1 scope, derived not handed.** From `docs/audits/2026-08-25-p6.8.9.7.11.10-severity/A-money.md`
(J1-2, J1-4, J2-1, J2-2, J2-4) and `C-discovery-ui.md` (C-D, the Progress hero's *"to go"*). `A-money.md`'s
J1-1 and J2-3 land in `migrations.ts`, which is auditor B's file this round — they are named below only
where a consumer of mine depends on them, and are not verdicted here.

**Method.** Read `git diff 6736a64..c8d54fa` over every file above, then each changed file whole, then
every consumer of the values it produces. Two computations were run in the scratchpad against the real
modules (`readMoney`'s recovered/lost split and `allocatePaycheck` over boundary goals) — flagged
*measured* where they appear. No suite and no gate was run, per the brief.

---

# JOB 1 — the fixes, re-verified

## A-J2-2 — the repairs card reported RECOVERED amounts as unreadable — `CLOSED`

**Original finding:** `readMoney` had two `repaired: true` returns and the caller could not tell them
apart, so a store holding `targetAmount: '4,000'` rendered *"An amount could not be read · Your plan is
running without it until you set it again"* on Today while Money one tab over showed `$4,000` and the
engine allocated against `4000`.

**What the fix did.** Three parts, and all three are present:

1. `readMoney` now returns a three-way discriminator, not a boolean —
   `apps/rn/src/data/migrations.ts:56` `{ value: number; repair: 'none' | 'recovered' | 'lost' }`, with
   the recovery at `:62` and the loss at `:64`.
2. The distinction is carried on the record: `apps/rn/src/data/models.ts:288` adds
   `kind?: 'recovered' | 'lost'`, absent-means-`lost` so stored blobs backfill without a version bump.
   All five producers set it explicitly (`migrations.ts:83`, `:109`, `:123`, `:305`, `:316`).
3. The words moved out of JSX into `apps/rn/src/components/plan/dataRepairsCopy.ts`, which splits the
   list into three blocks (`:74`–`:132`). The recovered block says *"An amount was written in a
   different format"* / *"Your plan is using it — check the number looks right."* (`:121`–`:129`) —
   the opposite claim from the loss block, which is what the finding asked for.

**Preserved?** Yes, and the two over-matching temptations were both avoided.
- A recovered repair is still **shown**, not swallowed (`dataRepairsCopy.ts:12-14`) — swallowing it would
  have produced a record that lives in `pendingDataRepairs` forever with no card to acknowledge it and no
  way to clear the trust suppressions that read that list. That is the exact shape of the `.11.10`
  blocker, mirrored, and it was reasoned about rather than hit.
- The loss language is unchanged for a real loss (`:90`–`:93`), pinned at
  `dataRepairsCopy.test.ts:59-67`.
- ⚠️ The `unrecoverable` third block (`.11.13.8`) is a **separate** later fix, not an over-match: it
  splits records with no `name` out of the loss block because *"until you set it again"* is false of them.
  `AppIcon` at `DataRepairsCard.tsx:67` correctly treats it as a two-of-three (`'recovered' ? healing :
  'error-outline'`) rather than a boolean, which the comment at `:64-66` says was the trap.

**Pinned?** `apps/rn/src/components/plan/dataRepairsCopy.test.ts:44-55`, registered at
`apps/rn/src/testing/runAppTests.ts:75`. It **would** red on the original defect: `:47`
(`blocks[0].kind === 'recovered'`) is the first assertion after the block count and the pre-fix code
produced only the loss sentence. `:46` (`blocks.length === 1`) precedes it and would have passed on the
defect, so no earlier assertion fires first and eats the plant. `:98-103` additionally pins that the
plural counts **per block**, which is the second half of the same defect.

⚠️ **What is still not measured, and the finding said so:** whether any real v1.6 store ever wrote money
as a string. `dataRepairsCopy.test.ts:13-16` now states the answer as *measured at `.11.12`* — every v1.6
write path coerced with `Number()` first, so the reachable door is `readBackup` handing an arbitrary user
file to `runMigrations`, not the migration. That resolves the finding's own open premise **toward the
narrow reading**, i.e. the fix was worth doing but the population is hand-edited / third-party / foreign
exports rather than every migrating user.

## A-J2-4 — a second `emergency`-type goal was funded by no rung at all — `CLOSED`

**Original finding:** `goals.find(g => g.type === 'emergency')` took the first match for both EF rungs
and both sinking-fund rungs required `type === 'savings'`, so goal #2 of type `emergency` matched none of
the five and was allocated exactly `$0` every paycheck while Money drew it a live progress bar.

**What the fix did.** `packages/core/engine/emergencyFund.ts` is a new single owner —
`primaryEmergencyGoal` (`:30`) and `fundsAsSinkingFund` (`:41`, `goal !== primary`). The two sinking-fund
rungs now ask it instead of testing the type: `allocatePaycheck.ts:632` (the §2.9 priority rung) and
`:702` (the post-debt savings rung). Three other consumers that were independently deciding "which goal is
the emergency fund" were changed with it — `money.tsx:1022` (the row’s `meta`), `guardianSelectors.ts:624-626`
(the EF-vs-debt advice voice), and `migrations.ts`'s pace stand-down.

**Measured, not read.** Running `allocatePaycheck` from the scratchpad against the finding's own store
(`$1,000` paycheck, no debts, `Emergency Fund` at target, `Car repair fund` `$0 / $800`):

```
goal-car  → $800   (was $0)
goal-ef   → $0
```

and the lone-EF control (`$400` target, `$0` saved, `$1,000` paycheck) allocates `$400` **once**, so the
negative rule does not double-fund the primary.

**Preserved?** Checked the two inputs the finding never mentioned.
- **No emergency goal at all.** `primaryEmergencyGoal` returns `undefined`, and `fundsAsSinkingFund(g,
  undefined)` is `true` for every goal — which is what the old `type === 'savings'` test already did for a
  store of savings goals. Measured: a lone savings goal funds identically before and after.
- **Only an emergency goal.** It is the primary, so both sinking rungs skip it and only the two EF rungs
  fund it — unchanged. Pinned as the anti-double-funding case at
  `packages/core/engine/testAllocation.ts:447-467`.
- ⚠️ The rule is written as a **negative** (`goal !== primary`) on purpose (`emergencyFund.ts:16-19`), so a
  future third `Goal['type']` falls through to the savings rungs rather than to nothing. That is the safe
  direction and it is the direction this finding was about.
- ⚠️ Comparison is by **reference**, not id (`emergencyFund.ts:37-39`), which is correct for the engine —
  but `GoalSheet` cannot use reference identity because it builds a fresh array, so it compares by id
  (`GoalSheet.tsx:58-69`). Both are sound; the divergence is documented at the call site.

**Pinned?** `packages/core/engine/testAllocation.ts:405-441`, in `test:regression`. The load-bearing
assertion is `:433` (`toCarFund === 800`); it is the **first** assertion of the block, so nothing reds
ahead of it, and on the original code it reports `Expected $800, received $0`. `:440` (the primary draws
`$0`) is what makes `:428` unambiguous. The UI half is pinned by
`apps/rn/tests/e2e/goal-pace-edit.spec.ts:106-131`, which asserts the sheet controls are **absent** on the
primary and **present** on the second — and it proves the sheet open (`:122`, `:129`) before each absence
assertion, which is the `toHaveCount(0)`-on-a-blank-page trap this repo has shipped twice.

⚠️ **Left open deliberately and I agree it is not major:** `guardianSelectors.ts:301`
`isEmergencyFund: goal.type === 'emergency'` on the tight-case top-up **source**. It drives one button
label (`PaydayGuardianCard.tsx:365`, *"Move $X from your emergency fund"* vs *"from savings"*), and the
`.11.12.3` log entry states the reasoning: it describes where money is pulled **from**, and a goal the
user typed emergency is their emergency money regardless of which rung funds it. It does, however, leave
the app calling the same goal *"Savings"* on Money and *"your emergency fund"* on the Guardian card. See
Job 2 §4.

## C-D — the Progress hero's *"to go"* printed the ORIGINAL total — `CLOSED`

**Original finding:** `${formatWhole(totalOriginal)} to go` under a label that means *remaining*, with
`totalOriginal = Σ (d.originalBalance ?? d.balance)`. `originalBalance` was stamped once at creation and no
edit path updated it, so a user who revised a balance upward was told they owed less than they do.

**What the fix did.** The figures and the sentence moved into one owner,
`apps/rn/src/store/journeySelectors.ts`, and the branch now reads the **projected current** total:
`:72` `totalPaid > 0 ? '${totalPaid} of ${totalOriginal} paid' : '${totalCurrent} to go'`. The call is
wired at `apps/rn/src/app/(tabs)/progress.tsx:203` with **both** balance sets —
`selectJourneyTotals(store.debts, engineStore.debts)` — and the hero renders it at `:272-273` behind
`testID="progress-hero-journey"`.

**Preserved?** This is the one fix in the range whose *over-match* was caught during implementation and is
documented: `journeySelectors.ts:29-32` records that a first cut moved **both** figures onto the
projection, which would have made *"% paid"* fall as interest accrued while the user did nothing — the
outcome `progress.tsx`'s standing 2.4 rule exists to prevent. The shipped split keeps `pct` and `totalPaid`
on the **confirmed** anchors (`:59`, `:61`, `:62`) and only *"to go"* on the projection. I checked the two
other inputs the finding never mentioned:
- **A finished portfolio** (`balance: 0` rows kept in `store.debts`) → `pct === 100`, paid branch, states
  its whole size. Pinned at `journeySelectors.test.ts:60-64`.
- **A debt with no `originalBalance`** (predates the field, missed the backfill) → falls back to `balance`,
  contributing to neither progress nor a false original. Pinned at `:68-72`.
- **Free tier** — `projected` defaults to `debts` (`:56`), so the single-argument call is the
  no-projection case rather than a different rule. Pinned at `:100-105`.

⚠️ **The premise moved under this fix, in the same range.** `.11.15` made `originalBalance` a high-water
mark (`store.ts:419-425`, `:447`, `:460-464` via `raiseOriginalBalance`), so an upward *edit* now raises
the stamp and `totalOriginal` no longer lags. That narrows C-D's population to stores whose growth
predates `.11.15` — it does **not** make the fix redundant, because the projection (premium interest
accrual) still moves `totalCurrent` above `totalConfirmed` with no edit involved, which is exactly the
case pinned at `progress-hero-journey.spec.ts:91-125`.

**Pinned?** Two instruments, and they cover different halves.
- `apps/rn/src/store/journeySelectors.test.ts:36-42` owns the arithmetic. The finding is carried by
  `:41` (`line === '$5,400 to go'`); the three assertions before it (`:38`, `:39`, `:40`) all **pass** on
  the original code, so the plant is not eaten by an earlier red.
- `apps/rn/tests/e2e/progress-hero-journey.spec.ts:47-56` owns the **call** — the `.11.11` lesson that a
  tested helper is not a used helper. `:54` asserts the element visible by testID before `:55` asserts its
  text, which is the right order; an absence/text assertion alone is satisfied by a blank page.
  `:62-67` asserts Money states the same total on the same store, so "print any bigger number" cannot
  pass. `:91-125` carries an explicit **vacuity guard** at `:121` that *fails* if the premium projection
  did not move the number — the right polarity.
- ⚠️ **Stale citation.** `journeySelectors.test.ts:12` names the e2e spec as
  `progress-hero-total.spec.ts`. No such file exists; the spec is `progress-hero-journey.spec.ts`
  (`apps/rn/tests/e2e/` holds `goal-pace-edit`, `hero-date-fit`, `progress-hero-journey` and no
  `progress-hero-total`). `minor` — it misdirects a maintainer looking for the call-site pin, but blinds
  no instrument.

## A-J2-1 — one "Got it" tap permanently restored both false congratulations — `CLOSED-UNPINNED` *(for the goals branch)*

**Original finding (blocker):** `unreadDebts` / `unreadGoals` read `pendingDataRepairs`, and
`acknowledgeDataRepairs` **emptied** it, so one tap restored *"Every balance cleared"* and the `Funded`
badge for the life of the install.

**What the fix did** *(landed at `466e2b2`, just before this range, and re-verified here because both
consumers are mine).* The record now survives the ack and carries a flag —
`apps/rn/src/store/store.ts:763` maps `{ ...r, acknowledged: true }` instead of assigning `[]`; the
**card** filters on it at `apps/rn/src/app/(tabs)/index.tsx:237`
(`store.pendingDataRepairs.filter((r) => !r.acknowledged)`); and both trust guards read the **whole**
list — `money.tsx:360` and `money.tsx:955`. That is the right shape: the notice is dismissible, the
evidence is not.

**Preserved?** The card still disappears on ack (the `filter` is at the render site, not in the store), and
`DataRepairsCard` is mounted only when the filtered list is non-empty, so no empty card is left behind.

**Pinned?** `apps/rn/tests/e2e/data-recovery.spec.ts` gained 148 lines in this range and now taps the ack
and re-asserts Money. ⚠️ **But the goals branch is not covered by it** — grepping the whole spec corpus,
no test references the `Funded` badge, `unreadGoals`, or the goals hero's `targetUnread`. The debt half is
pinned; the goal half is `CLOSED-UNPINNED`.

## A-J1-2 / B-3 — the goals hero read "150% funded", and the first fix CLAMPED — `CLOSED-UNPINNED`

**Original finding:** an unreadable `targetAmount` repairs to `0`, so a healthy goal beside a repaired one
divides a real `totalSaved` by a `totalTarget` missing that goal's share and the hero read *"150%
funded"* with a full bar. `.11.9`'s remedy was `Math.min(1, …)`, which the last round rated
`WRONG-REMEDY`: it hid the arithmetic tell and left *"$1,500 · saved of $1,000 target · **100% funded**"*,
a **more** plausible falsehood than the one it replaced.

**What the fix did.** ⚠️ **It landed at `466e2b2`, just before this range** — `git log -S targetUnread --
'apps/rn/src/app/(tabs)/money.tsx'` returns that one commit, and the file's diff over `6736a64..c8d54fa`
does not touch these lines. Re-verified here because the brief carries it as live and because the
suppression's side effects were never checked. The clamp is **gone** and the caption is **suppressed**:

```
apps/rn/src/app/(tabs)/money.tsx:990-1001
  const overall      = totalTarget > 0 ? totalSaved / totalTarget : 0;
  const targetUnread = unreadGoals && goals.some((g) => g.targetAmount === 0);
  <MoneyHero value={formatWhole(totalSaved)}
             sub={targetUnread ? 'saved — one target could not be read' : `saved of … target`}
             caption={targetUnread ? undefined : `${Math.round(overall * 100)}% funded`}
             bar={targetUnread ? undefined : <HeroProgressBar pct={overall} />} />
```

That is the badge's own shape (`:1018`) applied to the aggregate, which is what the finding asked for and
what the clamp was not.

**Preserved? — three inputs the finding never mentioned, all checked:**
1. **A legitimately over-funded portfolio.** Removing `Math.min` restores the honest reading: `$1,200`
   saved against a `$1,000` target with no repairs now says **"120% funded"**, not "100%". The bar still
   clamps internally (`money.tsx:1047`), so the visual is unchanged. This is a *better* answer than either
   prior state, and it is the input the clamp quietly damaged.
2. **`totalTarget === 0`** (every goal's target unreadable) → `overall` short-circuits to `0` rather than
   dividing (`:990`), so no `NaN`/`Infinity` reaches `Math.round` or the bar.
3. **The repair is on `currentAmount`, not `targetAmount`.** `targetUnread` is `false`, so the hero states
   an understated *"$0 saved · 0% funded"* with no tell. ⚠️ Deliberately **not filed**: the rule this
   guard states is *"never CONGRATULATE over money the app could not read"* (`money.tsx:1005-1015`), and
   understating is not a congratulation — it is the same repair-to-`0`-and-report behaviour 5.10 chose on
   purpose, and the card names the field. Recording it because it is the boundary of the rule, not a
   violation of it.

⚠️ **One copy inaccuracy:** the suppressed subhead is hardcoded singular — *"saved — **one** target could
not be read"* — and `goals.some(...)` fires for any number of them. `minor`.

**Pinned?** **No.** Grepped `apps/rn/tests` and `apps/rn/src` for `targetUnread`, `unreadGoals`, `% funded`
and the `Funded` badge: the only hits are the source file itself and unrelated `dataRepairsCopy` strings.
Deleting the suppression (or restoring `Math.min`) reds nothing. `apps/rn/tests/e2e/data-recovery.spec.ts`
covers the debts branch (`:132-186`) and the recovered-goal *card* (`:188-214`) but never navigates to
Money's Goals section. **`CLOSED-UNPINNED`.**

## A-J1-4 / B-2 — the repairs card promised "set it again" for a pace nothing could set — `CLOSED`

**Original finding:** the card's blanket copy said *"Your plan is running without them until you set each
one again"*, and `priorityPerPaycheck` had exactly one writer — `SaveForItSheet.tsx:109`, reachable only
through `AffordabilityCard.openSaveSheet`, which refuses a name a surviving goal already holds. For a
stood-down pace there was nothing to set.

**What the fix did — the promise was made TRUE rather than deleted.** `GoalSheet` now carries the route:
a `Fund this ahead of my debt` switch and a `Cap per paycheck` field (`GoalSheet.tsx:146` and `:149`), written to
the store at `:109-111`. Separately, `.11.13.8` split records that genuinely have nothing to reopen — a
whole list, a single row, the v1.6 bridge's counts — into an `unrecoverable` block whose sentence is
*"There is nothing to reopen for it — check this against your old app"* (`dataRepairsCopy.ts:98-116`), so
the *"set it again"* promise is now made only where it is keepable. The discriminator is the **absence of
a `name`** (`:80`), enumerated from the five producers rather than from the audit's list.

**Preserved?** Two checks:
- The controls are **hidden, not disabled**, for the primary emergency fund (`GoalSheet.tsx:142-143`),
  because the starter-EF rung consults neither `priority` nor the pace — so this does not create the
  inverse defect of a control that does nothing.
- **A pace of `0` cannot leave the form.** `parseAmountField` returns `null` for `0` (`amountField.ts:42`),
  and `0` is the *uncapped* state to the engine (`allocatePaycheck.ts:635`) — measured at Job 2 §3,
  `$950` of a `$1,000` paycheck ahead of debt. The route cannot re-create the corruption it exists to let
  people recover from. ⚡ The `.11.13.4` log records that an explicit `paceN <= 0` clause stood here and was
  **unreachable** — found by planting its removal and watching the test stay green — which is exactly the
  brief's fourth reading rule, caught by the fixer.
- ⚠️ `funding` is written **only** when the pace governs (`GoalSheet.tsx:109`). Editing the primary
  emergency fund therefore leaves any stale `priority` / `priorityPerPaycheck` on the row untouched rather
  than clearing them. Harmless — the engine skips that goal on both sinking rungs — and switching the goal
  back to Savings re-exposes the stored values in the form, so nothing is silently lost.

**Pinned?** `apps/rn/tests/e2e/goal-pace-edit.spec.ts`, three tests, and the assertions are on the
**persisted store**, not the screen:
- `:51-68` — the pace reaches storage. `:58` (`not.toBeChecked()`) is a **precondition** assertion placed
  before the action, so it cannot mask `:65-67`; on the original defect the sheet has no such control at
  all and `:56-57` reds first, which is the correct red.
- `:84-97` — a `0` pace is refused. `:91` asserts the message, `:94-96` assert nothing was written; the
  comment at `:77-82` correctly names **the parser swap** as the mutation that reds it, having measured
  that the dead clause did not.
- `:106-131` — the controls' presence/absence across the primary and a second emergency goal, with the
  sheet proven open before each absence assertion.

---

# JOB 2 — sweep for blocker + major

## 1. An empty-string money field is classified as a RECOVERY, which switches the "Every balance cleared" guard back off — **blocker**

**User-facing consequence:** a user who restores a backup whose debt balance is an empty string is shown
Money's *"Every balance cleared · 1 debt paid off"* over a debt they still owe, and the repairs card on
Today tells them *"An amount was written in a different format · Your plan is using it — check the number
looks right"* about an amount that was never read — the exact screen `money.tsx:350-354` calls *"the single
worst screen in the product"*.

**Mechanism.** `readMoney` treats **any** string that `Number()` can finite-ify as a recovery, and
`Number('')` is `0`:

```
apps/rn/src/data/migrations.ts:60-63
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, '').trim());
    if (Number.isFinite(parsed)) return { value: parsed, repair: 'recovered' };
  }
```

`.11.12.1` then made the celebration guard trust that word:

```
apps/rn/src/app/(tabs)/money.tsx:360
  const unreadDebts = store.pendingDataRepairs.some((r) => r.entity === 'debt' && r.kind !== 'recovered');
```

**Measured**, via `npx tsx` against the real `runMigrations`, `dataRepairsCopy` and the verbatim
`money.tsx:360-361` predicate:

| stored `balance` | migrated value | `kind` |
|---|---|---|
| `''` | `0` | **`recovered`** |
| `'   '` | `0` | **`recovered`** |
| `'0'` | `0` | `recovered` |
| `'0.00'` | `0` | `recovered` |
| `'12,000'` | `12000` | `recovered` |
| `null` | `0` | `lost` |
| `'abc'` · `'$500'` · `'Infinity'` · `true` | `0` | `lost` |

and on the `''` store:

```
pendingDataRepairs = [{"entity":"debt","id":"d0","name":"Card","field":"balance","kind":"recovered"}]
unreadDebts = false   active = 0   paidOff = 1
allCleared  = true          ← "Every balance cleared · 1 debt paid off"
card block  = { kind: 'recovered', heading: 'An amount was written in a different format',
                detail: 'Your plan is using it — check the number looks right.' }
```

⛔ **This is a REGRESSION introduced by the fix range, not a pre-existing hole.** Before `6736a64` the
predicate was `some((r) => r.entity === 'debt')` (the pre-range line — see
`git diff 6736a64..c8d54fa -- "apps/rn/src/app/(tabs)/money.tsx"`), which suppressed the
celebration for **every** debt repair including this one. The narrowing opened it.

⚡ **The repo already owns the correct expression and this one line did not use it.**
`packages/core/utils/amountField.ts:29-33` normalises and then refuses empty **before** calling `Number`
— `if (cleaned === '') return null` — precisely because *"blank and unparseable are NOT the same answer"*.
`readMoney` normalises and does not. A recovery means *the number was there and only its format was
wrong*; `''` and `'   '` carry no number at all, so they are losses, and `readMoney`'s own docblock
(`migrations.ts:51-54`) asserts the opposite of what it does: *"a recovered value is exactly right, not
approximately right — the string parses or it does not"*.

⚠️ **The stated mechanism for leaving the goals guards alone is also false.** `money.tsx:355-359` says
*"The goals guards below already self-correct: each conjoins an evidence check on the repaired VALUE, and
a recovered value is not `0`."* Measured, a recovered value **is** `0` for `''`, `'   '`, `'0'` and
`'0.00'`. The goals guards happen to be safe anyway — because they do **not** filter `recovered`
(`money.tsx:955`) — but they are safe by not doing the thing the comment credits them with, so anyone who
"fixes the inconsistency" by adding the same conjunct to `:955` reproduces this defect on the `Funded`
badge and the goals hero.

**Confidence:** measured (script run against the repo's own modules; values printed above).

**Reachability.** The door the repo has established for string money is `readBackup` handing an arbitrary
user file to `runMigrations` (`apps/rn/src/data/readBackup.ts:181`) — hand-edited, third-party and
spreadsheet-exported files, where a blank cell serialises as `""` far more readily than `"4,000"` does.
The legacy bridge is a second door (`migrateFromLegacy.ts:178`). ⚠️ **The CSV importer is NOT a producer**
— `packages/core/imports/debtCsv.ts:188-197` uses `parseAmountField` and rejects a blank balance with
*"balance is required"*, which is the guard `readMoney` is missing.

**Would anything catch it?** No, on three instruments:
- `apps/rn/src/data/migrationAudit/invariants.ts:95-105` (`moneyKeepsItsType`) asserts only that the
  **output** is a `number`. `''` → `0` is a number, so it passes.
- The new hostile corpus `apps/rn/src/data/migrationAudit/__fixtures__/hostile-v16-cases.json` contains
  exactly one `""` money-shaped value, at `:631`, and it is `paycheck.amount` — deliberately a string, and
  not routed through `readMoney`. No row-level money field in the corpus is `""`.
- `dataRepairsCopy.test.ts` builds its `DataRepair`s by hand with `kind` already set, so it never exercises
  `readMoney`'s classification at all; and nothing in the spec corpus asserts `allCleared` against a
  recovered repair.

**The fix shape** is one line in `readMoney`: normalise first, and return `lost` when the normalised string
is empty — mirroring `amountField.ts`. ⚠️ `migrations.ts` is auditor B's file this round; the *consumer*
and the false screen are mine, and B is not looking at `money.tsx:360`. **This one needs both.**

⚠️ **Addendum to "would anything catch it".** The two celebration-guard e2e tests exist and are good —
`apps/rn/tests/e2e/data-recovery.spec.ts:132-146` (*"Money does not celebrate a portfolio it failed to
read"*) and `:148-186` (*"the celebration guard SURVIVES the acknowledgement"*) — and both prove the
screen rendered before asserting the absence, which is the right shape. **But both seed
`balance: null`** (`:137`, `:160`), which `readMoney` classifies `lost`. They therefore pass with this
defect present, and pick the one member of the class that still works.

---

## 2. `readMoney`'s docblock states the opposite of what the code does, and that comment is what the next fix will trust — **major**

**User-facing consequence:** the next person to touch this seam is told in writing that a `recovered`
value is *"exactly right"* and that *"the string parses or it does not"*, so they will keep building
guards that trust `kind: 'recovered'` — and every one of them inherits finding 1's false screen.

**Mechanism.** `apps/rn/src/data/migrations.ts:51-54`:

> *"⚠️ **A recovered value is exactly right, not approximately right** — the string parses or it does not,
> and a string that does not parse falls to the loss branch. So `recovered` means the number is correct
> and only its FORMAT was wrong; nothing downstream should treat it as suspect data."*

Measured, `''` and `'   '` "parse" and land in the recovery branch carrying a number the user never wrote.
`money.tsx:355-359` has **already** acted on this docblock — it is quoted almost verbatim there as the
justification for narrowing `unreadDebts` — and `models.ts:274-280` repeats it a third time. Per the
brief's severity rule, a wrong comment is `minor` **unless it is load-bearing for a future maintainer's
safety decision**; this one has already been load-bearing for one, and produced finding 1.

**Confidence:** measured (the table in finding 1).

**Would anything catch it?** No. `scripts/check-comment-convention.ts` checks convention, not truth, and
nothing in the corpus feeds `readMoney` an empty string.

**Filed separately from finding 1 on purpose:** fixing `readMoney` closes the screen; leaving the three
docblocks asserting the retired premise is how the same reasoning gets re-applied at the next guard.

---

## 3. No blocker or major found in the allocation engine's boundary behaviour

Stated plainly because a clean sweep is a result. `allocatePaycheck` was run from the scratchpad over the
boundary set the brief named. Every case printed, none produced a negative, non-finite, or double-counted
allocation:

| input | result |
|---|---|
| zero income | refused upstream at `apps/rn/src/store/selectors.ts:44` (`amount <= 0 → null`); direct call yields no allocations and no crash |
| negative income | same guard; direct call yields no allocations |
| a goal with `targetAmount: 0` | funded `$0` — `currentAmount >= targetAmount` excludes it from both rungs |
| a target already exceeded (`900 / 400`) | funded `$0` |
| a **negative** target | funded `$0` |
| a negative `currentAmount` (`-100 / 500`) | funded `$600` — arithmetically right, and unreachable through any writer |
| no debts at all | `cushion_buffer $50` + `true_leftover $950`, `shortfall 0` |
| every debt paid off (`balance: 0`) | identical — the cleared row draws nothing |
| a paycheck **entirely reserved** ($1,000 income, $1,000 rent) | `expense $1,000`, `remaining 0`, `shortfall 0`, no goal rung fires |
| over-reserved ($500 income, $1,000 rent) | `expense $500`, `shortfall $500` — the honest partial |
| a priority pace larger than the target | capped at the target (`$200`), not the pace |
| a **negative** priority pace | treated as uncapped, matching `priorityPerPaycheck != null && > 0` |
| the same goal object twice in `goals` | funded once (`$800`), via the starter-EF rung |
| two `emergency` goals sharing an `id` | the second funds as a sinking fund — reference identity holds where id identity would not |

⚠️ **One residue worth naming, below the bar:** a pace of `0` still means *uncapped* to the engine
(measured: `$950` of a `$1,000` paycheck to one goal, ahead of debt). Both writers now refuse it —
`GoalSheet.tsx:88` and `SaveForItSheet.tsx:91` both use `parseAmountField`, which cannot return `0` — and
`runMigrations` stands down a stored `0`. The engine itself is unguarded, but no reachable producer
remains. `minor`.

---

## 4. No blocker or major found in the plan cards' craft changes

`PaidOffBeat`, `GraduationCards`, `LeanSuggestionCard`, `PlanHero`, `PaydayGuardianCard`,
`GuardianScorecard`, `AffordabilityCard`, `WindfallSheet`, `ShareCard` and `AddObligationSheet` were
changed in this range **only** by two token swaps — `letterSpacing` → `eyebrow` from
`apps/rn/src/theme/typography.ts`, and `opacity: 0.6/0.7/0.8/0.85` → `pressedOpacity` from
`apps/rn/src/theme/spacing.ts`. Two deliberate overrides survive with their reasoning stated
(`ShareCard.tsx:93-95`, `PaidOffBeat.tsx:172`) — both are captured images rather than screens. No money
figure, no claim to the user, and no behaviour changed. ⚠️ Checked for a `.web.tsx` fork per the brief's
second reading rule: `apps/rn/src/components/plan/` holds four (`AppStoreCta`, `CashRunwayCanvas`,
`CushionBarCanvas`, `MeshGradientCanvas`) and **none** of them is one of these files; `money.tsx`,
`GoalSheet.tsx` and `DataRepairsCard.tsx` have no web fork either.

---

## 5. A second emergency fund is called three different things on three screens — **major**

**User-facing consequence:** a user who creates a goal, picks **Emergency fund** in the sheet's Type
selector and saves it sees Money label that same row **"Savings"**, while the edit sheet still shows
**"Emergency fund"** and the Guardian offers to *"Move $70 from **your emergency fund**"* — three answers
to "what kind of goal is this?" with nothing anywhere explaining the difference.

**Mechanism.** `.11.12.3` changed one of the three consumers and deliberately left another:

| surface | reads | says for goal #2 |
|---|---|---|
| Money's goal row | `g === primaryEf ? 'Emergency fund' : 'Savings'` (`money.tsx:1022`) | **Savings** |
| `GoalSheet`'s Type selector | `editing?.type` (`GoalSheet.tsx:28`, `:139`) | **Emergency fund** |
| the Guardian's top-up button | `isEmergencyFund: goal.type === 'emergency'` (`guardianSelectors.ts:301`) → `EMERGENCY_FUND_NOUN` (`PaydayGuardianCard.tsx:365`) | **your emergency fund** |

The Guardian genuinely can pick goal #2: `pickTopUpGoal(store.goals, gap, ['savings', 'emergency'])`
(`guardianSelectors.ts:295`) falls through to the `emergency` pass whenever no funded savings pot exists,
and `:517-524` then picks the largest emergency-typed pot — which may be the second one. `.11.12.3`'s log
entry records the divergence as intentional (*"a goal they typed emergency is their emergency money
regardless of which rung funds it"*) and states the opposite principle for the Money row in the same
entry (*"a row reading 'Emergency fund' while funded as savings is the same misdescription the fix exists
to end"*). **Both principles are defensible; applying them to different surfaces of the same goal is not.**

**Confidence:** read-only inference for the rendering; the selection path is read from source and the
Guardian's fallback is unconditional. Not observed on device.

**Would anything catch it?** No. `guardianSelectors.test.ts:121`, `:168` and `:173` pin `isEmergencyFund`
for a *lone* emergency goal and for savings-vs-EF preference; **no fixture anywhere carries two emergency
goals** on that path, which is the same gap `.11.12.3` recorded for the engine and closed only in
`testAllocation`. `goal-pace-edit.spec.ts:106-131` is the one two-EF fixture in the repo and it asserts
the *controls*, not the labels.

⚠️ **Partly mitigated:** the Guardian's sentence above the button names the goal (*"You have $800 in Car
repair fund"*, `PaydayGuardianCard.tsx:358`), so the button is not the only identifier on that screen.
Money's row has no such mitigation — the user chose a type and the app shows a different one.

**This is a product call, not a code fix**, which is why it is filed rather than sketched: either the
second goal is an emergency fund everywhere (and Money says so, with the funding difference explained), or
it is a sinking fund everywhere (and `GoalSheet` says so on save, and the Guardian stops calling it the
emergency fund). Choosing one closes all three surfaces.

---

## Swept and found clean

At the **blocker/major** bar, extending the ratchet rather than repeating it. None of the ratchet list is
on my surface, so nothing here re-reports it.

- **`packages/core/engine/allocatePaycheck.ts`** — the five goal rungs and the whole boundary set,
  **measured** (Job 2 §3): zero/negative income, a `0` target, a target exceeded, a negative target, a
  negative `currentAmount`, no debts, all debts cleared, an entirely-reserved paycheck, an over-reserved
  paycheck, a pace above the target, a negative pace, the same goal object twice, and two goals sharing an
  `id`. No negative, non-finite or double-counted allocation in any of them.
- **`packages/core/engine/emergencyFund.ts`** — both exports, including the `undefined`-primary path and
  the reference-vs-id choice.
- **`packages/core/engine/testAllocation.ts`** — the new `A-J2-4` block; both directions held, guard
  assertion non-vacuous.
- **`apps/rn/src/store/journeySelectors.ts`** and **`journeySelectors.test.ts`** — the ten-case matrix,
  including the empty portfolio, the absent `originalBalance`, and the free-tier single-argument call.
- **`apps/rn/src/store/guardianSelectors.ts`** — `selectTightTopUp` (`:287-306`), `selectAffordability`'s
  `coverFromSavings` (`:396-406`, clamped to `min(gap, goal.currentAmount)` so the `AffordabilityCard`
  undo at `AffordabilityCard.tsx:92-96` is exact), `pickTopUpGoal` (`:517-524`), and
  `selectSaveForItOptions` (`:554-579`, whose paces floor at `$5` so the `0`-means-uncapped state cannot
  be produced there). ⚠️ `isEmergencyFund` is the exception — filed as §5.
- **`apps/rn/src/components/entities/GoalSheet.tsx`** — the whole new pace route: the `paceGoverns`
  after-state computation for add and edit, the parser choice, the name-clash guard, and what the
  `funding = {}` branch leaves behind.
- **`apps/rn/src/components/plan/dataRepairsCopy.ts`** + **`dataRepairsCopy.test.ts`** — the three-block
  split, the `actionable` discriminator, per-block plurals, the a11y label, and the empty-list case.
- **`apps/rn/src/components/plan/DataRepairsCard.tsx`** — the three-way icon choice and the group label.
- **`apps/rn/src/data/models.ts`** — the `kind` and `acknowledged` optional fields; both backfill without a
  version bump and both default to the safe reading.
- **`apps/rn/src/store/store.ts`, the goal / repairs seams** — `addGoal` (`:510`, appends, which
  `GoalSheet`'s draft placement depends on), `updateGoal` (`:513`), `removeGoal` (`:518`),
  `applyTightTopUp` (`:766-780`) and `acknowledgeDataRepairs` (`:752-764`).
- **`apps/rn/src/components/plan/SaveForItSheet.tsx`** — the other `priorityPerPaycheck` writer; cannot
  emit `0`, `NaN` or `Infinity`.
- **`packages/core/imports/debtCsv.ts`** — swept as a *candidate producer* of string money for finding 1.
  It is not one: `:188-197` and `:199-208` refuse a blank or unreadable amount with distinct messages.
- **The nine plan cards + `AddObligationSheet`** — token-only changes, no behaviour, no money figure (§4).
- **`apps/rn/tests/e2e/goal-pace-edit.spec.ts`** and **`progress-hero-journey.spec.ts`** — read whole;
  every absence assertion is preceded by a positive render assertion, and the premium-projection test
  carries a vacuity guard that fails rather than passes.
- **Platform forks** — the only `.web.tsx` files in `components/plan/` are `AppStoreCta`,
  `CashRunwayCanvas`, `CushionBarCanvas`, `MeshGradientCanvas`. No fork of `money.tsx`, `GoalSheet.tsx`,
  `DataRepairsCard.tsx`, `journeySelectors.ts` or `guardianSelectors.ts`.
- **`QA_TOOLS` / `__DEV__`** — grepped across my whole surface: **zero** sites. Nothing here becomes
  unreachable when the flag flips at P6.17; the only hits in `components/plan/` are in
  `TutorialOverlay.tsx`, which is auditor C's.

## Could not determine

- **Whether any store in the wild actually holds `''` money.** The *door* is established
  (`readBackup.ts:181` hands an arbitrary user file to `runMigrations`, and `.11.12` measured that v1.6
  coerced with `Number()` before persisting). What I cannot establish from source is how often a real
  export writes `""` for a blank field. This does not change finding 1's severity — the guard was armed
  for this input before the range and is not now — but it does change its expected frequency.
- **No suite and no gate was run**, per the brief. Every "would this test red" judgement above is read
  from the assertion order, not observed. The two numeric claim sets (`readMoney`'s classification table
  and the allocation boundary set) *were* executed and their output is quoted.
- **Nothing on this surface is device-only.** The one prior device-only item — `DataRepairsCard`'s a11y
  group label being read twice by VoiceOver — was resolved at `.11.12.3` by reading `groupLabel`, which
  sets `accessible: true` and so stops children being announced separately. No new device-only item.
- **A React duplicate-key warning** is possible at `DataRepairsCard.tsx:75-78` (`key={line}`) if two rows
  produce the identical `"{name} — {field}"` string — reachable only with two same-named debts, which
  nothing guards (`GoalSheet` guards goal names; no debt path does). Console-only, no render defect
  observed in source. `minor`, recorded not filed.

---

# Tally

| # | finding | verdict / severity |
|---|---|---|
| **J1** | A-J2-2 · recovered vs lost in the repairs card | `CLOSED` |
| **J1** | A-J2-4 · a second emergency goal funded by no rung | `CLOSED` |
| **J1** | C-D · the Progress hero's "to go" | `CLOSED` |
| **J1** | A-J2-1 · the ack disarming the trust guards | `CLOSED-UNPINNED` *(goals branch)* |
| **J1** | A-J1-2 / B-3 · the goals hero's "150% funded" | `CLOSED-UNPINNED` |
| **J1** | A-J1-4 / B-2 · "set it again" for a pace nothing could set | `CLOSED` |
| **J2-1** | `''` money classified as a RECOVERY → "Every balance cleared" restored | **blocker** |
| **J2-2** | `readMoney`'s docblock asserts the premise that produced J2-1 | **major** |
| **J2-3** | the allocation engine's boundary set | *clean* |
| **J2-4** | the plan cards' craft changes | *clean* |
| **J2-5** | a second emergency fund named three different things | **major** |
