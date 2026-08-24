# Cluster c — DATA INTEGRITY · independent verification

**Verifier:** did not build any of these fixes. Tree: `v1.7-dev` @ `8e4540a`.
**Ids:** B1 · B4 · W1-6 · M3-20.

Method per id: (1) re-derive the observation against the current code; (2) enumerate **every write path**
to the data in question and check each is behind the guard, not just the named one; (3) check what the site
also did and whether a test would catch a regression; (4) judge the remedy. Migrations are checked
separately — a guard on new writes says nothing about blobs already on disk.

---

## B1 — `NaN <= 0` amount guards — **PARTIAL**

### 1 · Is the observation closed?

**At the form boundary, yes — and I re-derived the site list independently rather than trusting the log's.**
I enumerated the *inputs* (`grep keyboardType=` across `apps/rn/src`, 33 hits) and traced each to its guard,
which is the enumeration the log itself says is the only one that works. Every money input now runs through
`packages/core/utils/amountField.ts`:

- `parseAmountField` (`amountField.ts:38-43`) — `Number.isFinite(n) && n > 0`. `"1.2.3"`→`NaN`→refused;
  `"Infinity"`→refused; `"1,200"`→1200 via `normalize` (`amountField.ts:27-29`).
- `parseOptionalAmount` (`:53-58`) — blank is `0`, unreadable is `null` (kills `Number(apr) || 0`).
- `parseNonNegativeAmount` (`:68-73`) — typed `0` is an answer, blank is `null`.

23 call sites across 11 files, all confirmed by reading: `DebtSheet.tsx:136,137,189,190,191` ·
`ExpenseSheet.tsx:53,54` · `GoalSheet.tsx:35,36` · `LivingExpenseSheet.tsx:34` · `LogPaymentSheet.tsx:28` ·
`FirstDebtOrBillStep.tsx:49,50,51,79` · `PaycheckStep.tsx:41,57` · `PaydayCaptureSheet.tsx:137,219,437` ·
`AffordabilityCard.tsx:66` · `PaycheckSheet.tsx:51,62` · `WindfallSheet.tsx:50` · `debtCsv.ts:152,162,172,190`.

The two named user-visible outcomes now produce the right one: `PaycheckStep.tsx:65` writes
`amount: String(amountN)` — the *parsed* number back as the string — so a separator cannot survive into
`Number(store.paycheck.amount)`; and `amount-guards.spec.ts:42-44` pins `"1,200"` landing as `1200`.

The day-of-month fields (`number-pad`) are guarded separately and correctly:
`paycheckForm.ts:120` `!Number.isInteger(Number(v))` — `Number.isInteger(NaN)` is `false`, so they error.
`WhatIfControls.tsx:59` sanitises to `[0-9]` at the keystroke and `extra` (`progress.tsx:100`) is local
state that is never persisted — not a data site.

### 2 · What the site also did, and the sites the fix did NOT reach

⛔ **`SaveForItSheet.tsx` was never converted, and it is the same class.**
`SaveForItSheet.tsx:79-82` — `const per = Number(customPer); if (!(per > 0)) return;`. The negated form
refuses `NaN` (so `"1,200"` cannot get through), **but `Number("Infinity") > 0` is `true`**, so `Infinity`
reaches `store_.getState().addGoal({ ... priorityPerPaycheck: pace })` at `SaveForItSheet.tsx:90-132` and
`JSON.stringify` writes it as `null` — the exact serialisation the fix's own module header calls out
(`amountField.ts:6-7`). ⚠️ It also fails *silently*: `return` with no `setError`, so Start-saving does
nothing and says nothing, where every converted sheet now shows `FORM_ERRORS.amountPositive`.

⛔ **The migration does not repair `paycheck.amount`, only its type.**
`migrations.ts:135-137` converts a non-string to a string and stops. A blob already on disk holding
`paycheck.amount: "1,200"` — the precise value `migrations.ts:34-35` says was **measured in v1.6 in the
wild**, and which `mapLegacyStore.ts:87` bridges through verbatim with no parse — arrives at v1.7
unrepaired and **raises no `DataRepair`**, so B4's new notice will never mention it. Harm is bounded rather
than absent: `selectors.ts:44-45` has `!Number.isFinite(amount) → return null` and `drift.ts:41` uses
`> 0`, so the user gets *no plan* rather than a corrupt one — but nothing tells them why.

⛔ **`goals` are excluded from the money repair entirely.** `runMigrations` calls `repairMoneyFields` for
`debts` (`migrations.ts:140-146`), `requiredExpenses` and `livingExpenses` (`:155-156`) — **not `goals`**,
while `mapLegacyStore.ts:75` bridges `goals` straight from v1.6. A legacy goal carrying
`targetAmount: null` is loaded as-is, unrepaired and unreported.

✅ **Preserved properties that survived, checked deliberately:**
`parseAmountField('0') === null` still refuses a typed zero where a positive amount is required
(`testAmountField.ts:52`), while `parseNonNegativeAmount('0') === 0` keeps a genuinely-zero payday balance
a real confirmation (`:67`) — the two are pinned *apart* at `testAmountField.ts:75-76`, which is the one
assertion that stops a later refactor collapsing them.
`WindfallSheet.tsx:50,63` keeps `?? 0` for the *preview* but branches submit on `validAmount`, so the
display fallback cannot become a write.

### 3 · Tests — and what a green tick here does not mean

- `packages/core/utils/testAmountField.ts` (36 asserts, wired into `runRegressionTests.ts`) **could not have
  failed on the original defect** — it tests a module that did not exist. It pins the new parser, not the
  fix.
- `apps/rn/tests/e2e/amount-guards.spec.ts` **would** have failed on the original defect: it asserts store
  contents (`:43`, `:61`, `:90`), not that an error appeared, which is the right seam. ⚠️ **But it exercises
  exactly one field — `field-debt-balance` on `DebtSheet`** (`:26-31`). Nothing pins the paycheck amount,
  the expense amount, the goal target, the living expense, `LogPaymentSheet`'s `parseFloat`→`$1` bug, the
  APR channel, or `PaydayCaptureSheet`'s blank-balance case — and the last two are described in the log as
  *shipped bugs found during the work*, i.e. exactly the regressions with no guard.
- ⚠️ **Log/code disagreement, code wins:** the log and `amount-guards.spec.ts:14` both cite
  `apps/rn/src/store/amountField.ts` / `store/amountField.test.ts`. Neither path exists; the module is
  `packages/core/utils/amountField.ts` and the test is `packages/core/utils/testAmountField.ts`.

### 3 · Was the remedy right?

**Yes, and it was better than the finding's.** B1 implied "fix 12 comparisons"; the shipped remedy is one
shared parser, which is the only form that could have caught the fact that the four *correct* expressions
already in the repo disagreed with each other (`Number` vs `parseFloat` on `"1,200"` → refuse vs **$1**).
Copying a good line 14 times would have left that divergence in place.

**Verdict: PARTIAL** — every site the finding named is closed and the remedy is stronger than the one
implied, but one site of the same class (`SaveForItSheet.tsx:79`) was never reached, and the guard protects
only *new* writes: `paycheck.amount` and `goals` already on disk from v1.6 pass through `runMigrations`
unrepaired and unreported.

---

## B4 — corrupt store = silent wipe · `dataRepairs` rendered by nothing — **CLOSED**

B4 is two findings. Both are closed, and the second is closed by a mechanism the finding did not propose.

### Half 1 (M3-1) — the wipe now declares itself

The named site is `store.ts:263-275`. In the current tree that branch is `store.ts:320-328`:

```
await adapter.quarantine?.(JSON.stringify(raw), 'migration-failed');
set({ isHydrated: true, storageError: 'data-reset' });   // store.ts:326
await adapter.write(get().store);                        // store.ts:328
```

`storageError` is set **before** the write, so it cannot be lost to the overwrite.
`_layout.tsx:262-268` returns `<DataResetScreen>` in place of the whole navigator, so onboarding is not
reachable until the user answers — which is the finding's exact harm ("the setup form is their first
evidence"). `_layout.tsx:212` also short-circuits the one-shot iCloud Alert on `data-reset`, so a restore
is offered as an answer to the event rather than stacked on top of it.

✅ **Preserved properties I checked deliberately, because this branch is load-bearing:**
- **The bytes are still quarantined first** (`store.ts:322`) and defaults are still written, so a corrupt
  blob is never written back. Unchanged.
- **Autosave is still installed.** `persistence.ts:72-75` declines the subscription only for
  `'read-failed'`, not for `'data-reset'` — so a user who taps Start fresh actually persists their new
  setup. Getting this wrong would have turned a fixed defect into a worse one, and it is right.
- **`storageError` is app state, not store state** — it is not in `createDefaultStore()`
  (`defaults.ts:43-49`), so the screen cannot become sticky across launches: the next launch reads the
  defaults blob, which migrates cleanly.

⚠️ **The finding's "the quarantined bytes are read by nothing" is still literally true.** No component
reads a quarantine key — the only non-comment use is `clearQuarantine` on the delete-all-data path
(`more.tsx:147`). `DataResetScreen.tsx:80-81` tells the user *"your old data is still set aside on this
device"* and then offers no route to it; the three ways out are iCloud, a backup file, or start fresh.
That is a true statement with no action behind it, and it is the residue of the finding rather than a
regression.

⚠️ **The `read() === null` sibling is knowingly left silent** (`store.ts:305-311`), with the reason
written into the branch: any marker durable enough to survive a lost MMKV file also survives a deliberate
delete-and-reinstall and would then tell someone who erased the app that their data was lost. I agree
with the reasoning; recording it as a *stated limit*, not a miss.

### Half 2 (M3-2) — `dataRepairs` now reaches a screen, via a new field

⛔ **`dataRepairs` alone could not have fixed this, and the fix is right to have noticed.** It is
**replaced** on every read (`migrations.ts:177`) and the shipped invariant `repairs-not-repeated`
(`invariants.ts:161-163`) *guarantees* a clean second pass reports nothing — so a card reading it live
would have inherited the defect's own failure mode. The new `pendingDataRepairs` is **merged** forward and
deduped by `entity|id|field` (`migrations.ts:186`, `mergeRepairs` `:190-200`), emptied only by
`acknowledgeDataRepairs`. The two opposite rules are documented against each other at `migrations.ts:174-186`
and typed at `models.ts:273-284`.

Write paths to `pendingDataRepairs`, all four enumerated:
`migrations.ts:186` (every door — hydrate, JSON restore and cloud restore all pass through `runMigrations`) ·
`persistence.ts:187` (the v1.6 bridge's losses, appended — see M3-20) · `acknowledgeDataRepairs` (clears) ·
`defaults.ts:44` (empty). No path writes it without going through the merge.

Consumers: `index.tsx:235-239` ranks `'data-repairs'` **above every other ack including the celebration**,
and `index.tsx:557` renders `DataRepairsCard`, which names the affected items (`DataRepairsCard.tsx:60-67`)
rather than saying "some amounts" — the right call, since the user cannot tell a repaired balance from a
real one by looking. `describe()` (`:19-26`) also handles the two entity-less shapes: the
`(whole list unreadable)` row and M3-20's `'migration'` entries.

⚡ **The folded-in Money fix is the finding's actual harm and it was not in the finding.**
`money.tsx:354-355` — `const unreadDebts = store.pendingDataRepairs.some(r => r.entity === 'debt')` gates
`allCleared`. A repaired debt is `balance: 0`, which puts it in `paidOff` and out of `active`, so a
portfolio where every balance failed to parse rendered the hero **"Every balance cleared"** over debts
still owed. Nobody filed that; it only surfaced from the site.

I checked the adjacent hazard the ack ordering creates: the **finale** (`index.tsx:544-548`) renders off
`store.pendingPayoff`, not off `activeAck`, so it is not suppressed by a pending repair. It cannot fire
from a repair, because `pendingPayoff` is stamped only by `withPayoffCelebration` (`store.ts:42-46`) on an
action-driven balance *crossing*, and the repair happens inside `runMigrations` during hydrate. Not a hole.

### Tests — and would they have failed on the original defect?

**Yes, all five, and three were plant-verified by the builder.**
`data-recovery.spec.ts:58-71` (the reset screen exists at all — impossible before), `:73-85` (it *blocks*
onboarding), `:88-101` (the repairs card names "Chase card"), `:103-124` (⭐ the notice survives a reload —
this is the assertion `dataRepairs` alone could never have passed), `:126-139` (Money does not celebrate).
Unit: `persistenceLifecycle.test.ts:107` pins `storageError === 'data-reset'`, `:132/:150-158` pin
pending-repair persistence across a second hydrate, `:161-165` pins that acknowledging stays acknowledged.

⚠️ `data-recovery.spec.ts:80` is an absence assertion (`toHaveCount(0)`), the class this repo has measured
passing vacuously — but here it is preceded by a `toBeVisible` on `data-reset` at `:76`, so the page has
rendered. `:139` was explicitly hardened for the same reason (`:134-137`). Both are sound.

**Verdict: CLOSED.** Both observations are gone, the remedy for half 2 is better than the finding's
(`dataRepairs` could not have carried it), the properties the branch also had — quarantine-first,
never-write-bad-data-back, autosave-still-installed — are intact, and five tests pin it. The two residues
(no reader for the quarantined bytes; the `read() === null` sibling) are stated limits carrying written
reasons, not unnoticed gaps.

---

## W1-6 — the v1.6 bridge's "retried next launch" guarantee is false — **CLOSED**

### 1 · Is the observation closed?

**Yes, and the mechanism is structural rather than a flag.** The finding's sequence was: bridge skips →
`hydrate`'s first-launch branch writes defaults on the same launch → `read()` is never `null` again →
every skip reason is one-shot.

The seed is now conditional. `persistence.ts:60-64`:

```
let seed = true;
try { if ((await adapter.read()) === null) ({ seed } = await runLegacyBridge(adapter, store, readLegacy)); }
catch { /* hydrate owns this failure */ }
await store.getState().hydrate(adapter, { seed });
```

and `store.ts:300-303` — `if (hydrateOpts?.seed === false) { set({ isHydrated: true }); return; }` — the
branch that used to write defaults unconditionally now returns before `adapter.write`. Storage stays
`null`, so the existing `read() === null` gate re-admits the bridge next launch.

**I enumerated every exit from `migrateFromLegacy` and checked its `terminal` flag rather than trusting
the four the finding and its refuter listed. There are eight, and each is tagged correctly:**

| exit | `terminal` | seeds? |
|---|---|---|
| `read threw:` (`migrateFromLegacy.ts:120`) | false (default, `:59`) | no — retries |
| `!report.supported` → web (`:125`) | **true** | yes — correct, web has no container |
| `isConfirmedFreshInstall` (`:132-133`) | **true** | yes — correct |
| `truncated` (`:138-139`) | false | no — retries |
| **`n of m database(s) were found and would not open`** (`:140-141`) | false | no — retries |
| the residual `did not establish` (`:142`) | false | no — retries |
| `could not be MIGRATED` (`:181`) | false | no — retries |
| `migrated` (`:187`) | **true** | yes |
| plus `runLegacyBridge`'s own catch (`persistence.ts:193-195`) | — | `seed: false` — retries |

⭐ **R1's "reachable fourth" is exactly the clause the fix turns on.** `isConfirmedFreshInstall`
(`migrateFromLegacy.ts:82-94`) now requires `!truncated && visited > 0 && opened.length ===
candidates.length && opened.every(o => !o.error)`. A found-and-refused database therefore lands in the
UNKNOWN branch with its own worded reason (`:140-141`) instead of being tagged the terminal fresh-install
reason. That is the finding's highest-harm case and it is the one the old `truncated`-only test got wrong.

### 2 · What the site also did

- **A confirmed fresh install must still seed**, or every launch re-runs the bridge forever. Preserved,
  and pinned by the inverse test at `persistenceLifecycle.test.ts:293+`. The log records that the first
  predicate (`candidates.length === 0`) broke exactly this and an existing test caught it — I re-read the
  predicate and the current one is right.
- **Web still seeds normally.** `readLegacyStores.web.ts` returns `supported: false`, classified terminal
  at `migrateFromLegacy.ts:125` — which is why the 220 web e2e still pass and are not silently exercising
  a non-seeding path.
- **The app still opens.** `store.ts:301` sets `isHydrated: true` before returning, and `storageError`
  stays `null` (correctly — nothing failed), so no error screen and no blank hang.
- **Autosave is still installed** (`persistence.ts:72-75` gates only on `'read-failed'`), so the session
  is not read-only. ⚠️ **That is also the limit of the retry:** the retry survives only until the user's
  first store mutation, which writes the blob and seals the bridge. See the residual below.
- ⚡ **W1-7 came with it, unasked.** `persistence.ts:170-179` reports every non-terminal skip with
  `truncated` · `visited` · `candidates` · `refused` — the field `report.ts` says exists to record a
  found-and-refused database, and which the finding notes nothing ever read.

⚠️ **The residual, and it is real:** the retry is **silent**. An upgrader on an inconclusive bridge sees a
setup wizard with no words, and `describeMigrationLosses` is called only on the *migrated* branch
(`persistence.ts:187`), so the inconclusive branch tells the user nothing — only Sentry. Nothing suggests
relaunching, so the most likely next act is to start setting up, which is the write that consumes the
retry. **The permanence is fixed; the silence is not, and it belongs to M3-20 — whose fix does not reach
this branch.** See the M3-20 entry below.

### 3 · Was the remedy right?

**No — and the fix was right not to follow it.** The lens proposed persisting a `legacyBridgeAttempt`
outcome and re-running on a non-terminal reason; under the old tagging the likeliest failure was tagged
**terminal**, so that retry would never have fired. The deliverable was the terminality derivation, and
`isConfirmedFreshInstall` is it. Not seeding also avoids a second persisted fact that can be lost,
corrupted or restored out of sync with the data it describes.

### Test

`persistenceLifecycle.test.ts:228-246` — a `refusedRead` fixture (`error: 'database is locked'`) driven
through **`bootstrapPersistence`**, asserting `a.writes === 0` and `await a.read() === null`. **It would
have failed on the original defect** (the old path wrote defaults on that launch), and it is the first
test that holds both halves of the seam — R1's coverage critique was exact and I confirmed it:
`migrationAudit/interruption.test.ts` still drives `migrateFromLegacy` directly and never calls
`bootstrapPersistence`, so it remains blind to this by construction. The log records a plant on
`opened.every(o => !o.error)` reddening this test by name.

**Verdict: CLOSED** — every skip reason now retries, the retry needs no new persisted state, the
fresh-install case still seeds, and one test pins the exact seam. The remaining harm on this path is that
the user is told nothing, which is M3-20's finding, not this one's.

---

## M3-20 — the discarded `LegacyMigrationOutcome` — **PARTIAL**

M3-20 names **two** branches. One is closed; the other is explicitly not built, and the log says so.

### Branch A — partial success: **closed**

The named site was `persistence.ts:113-124`, where `if (!outcome.migrated || migrated === null) return;`
threw the whole outcome away. Now, on the success path (`persistence.ts:187`):

```
const carried = { ...migrated, pendingDataRepairs: [...migrated.pendingDataRepairs, ...describeMigrationLosses(outcome)] };
```

`describeMigrationLosses` (`persistence.ts:132-143`) turns `map.unknown`, `map.unparseable` and
`outcome.quarantineFailed` into `DataRepair` rows with `entity: 'migration'`, which flow into the card
B4 built — `DataRepairsCard.describe()` (`DataRepairsCard.tsx:21-22`) returns a `migration` row's `field`
verbatim, because it is already a sentence. They persist, survive a reload, and are cleared only by the
ack, via the same `pendingDataRepairs` machinery. ✅ Reaching Today is not in doubt for this branch:
`inferOnboarding` (`migrations.ts:110-125`) promotes a migrated v1.6 store to `onboardingComplete: true`.

⭐ **The finding was half wrong about its own evidence, and the fix caught it.** M3-20 cites
`LegacyMapReport.dropped` and `.unknown` together as "exactly what did not come across". `dropped` is
entirely deliberate — every entry carries a documented reason (`mapLegacyStore.ts:169`, and the
theme-null case at `:186`), none of it user data. Surfacing it would tell every upgrader the app dropped
things they never had. The exclusion is argued in the comment at `persistence.ts:183-185` and **pinned by
a test that goes red by name** (`persistenceLifecycle.test.ts:283-287`), which is the right way to stop a
later "improvement" adding it back.

### Branch B — total failure: **not built, and correctly declared**

M3-20's first bullet — *"read threw · truncated search · migration threw → the user sees the onboarding
flow, no words"* — still reproduces. On a non-terminal skip `runLegacyBridge` reports to Sentry
(`persistence.ts:170-179`) and returns; `describeMigrationLosses` is called **only inside the
`outcome.migrated === true` branch** (`persistence.ts:187`), so nothing user-facing fires. The upgrader
lands in a setup wizard with their portfolio intact on disk and nothing on screen.

The log states this plainly and gives the reason: the card renders on Today and this user never reaches
Today, and a "we tried and failed" surface needs a persisted attempt count — the exact flag W1-6's fix
deliberately avoided. Filed as a `[DECISION]` for P6.10 with the Sentry breadcrumb producing the evidence
at P6.14. I agree with the reasoning; I am recording it as **PARTIAL** rather than CLOSED because the
finding's own first bullet still happens, not because the deferral is wrong.

⚠️ **This is the same gap W1-6's retry leaves open**, from the other side: the retry survives only until
the user's first store mutation (autosave is installed — `persistence.ts:72-75` gates only on
`'read-failed'`), and the only thing on screen inviting a mutation is the setup wizard. The two findings'
residuals are the same event.

### ⛔ A loss channel neither the finding nor the fix reached

`LegacyReadReport.droppedRows` (`report.ts:30-31`) is documented as *"Rows that would not decode and were
dropped. **Non-zero means the migration is INCOMPLETE.**"* It is populated at
`readLegacyStores.ts:153` from `readOneDatabase`'s `rows.length - Object.keys(items).length`
(`:92`), whose own comment says *"a silent drop reads as a clean migration"*.

**It reaches nothing.** `describeMigrationLosses` reads only `map.unknown`, `map.unparseable` and
`quarantineFailed`. The Sentry breadcrumb at `persistence.ts:174-178` carries `truncated` · `visited` ·
`candidates` · `refused` — not `droppedRows` — and fires only on a **non-terminal skip**, so a migration
that **succeeds** with `droppedRows > 0` reports nothing to anyone, which is precisely M3-20's
partial-success shape. Unlike `map.dropped`, whose exclusion is argued and tested, this one is not
mentioned anywhere. ⚠️ It is noisier than `unknown` (an undecodable row need not be a `debtPlanner.*` key),
so I am not asserting it must be shown to the user — but it is an incompleteness signal the fix's own
enumeration missed, and it is the third consecutive id in this cluster where the audit's site list
undercounted.

### Was the remedy right?

**Partly.** Routing through B4's existing card rather than building a second surface is right — the user's
question is the same one ("what could the app not read?") and two cards competing for one ack slot answers
it twice. Wording as a **count** rather than raw v1.6 keys is also right: `debtPlanner.rolloverCount` means
nothing to the person holding the phone. But the finding's implied remedy ("show `dropped` and `unknown`,
like `describeBackup` does") was **wrong on `dropped`**, and the fix is better than the finding on that
point.

### Test

`persistenceLifecycle.test.ts:249-291` — a `lossyRead` fixture with an unrecognised key and an
unparseable value, driven through `bootstrapPersistence`; asserts a `migration` repair exists, names the
unrecognised item, **excludes** the deliberate drops, and that the migration itself still landed
(`paycheck.amount === '2400'`). **It would have failed on the original defect** — before this, nothing
populated `pendingDataRepairs` from an outcome at all. The log records a plant reddening the report
assertion by name. ⚠️ No test covers branch B, correctly, because branch B was not built.

**Verdict: PARTIAL** — the partial-success branch is closed and the fix corrected half the finding's
evidence; the total-failure branch still reproduces exactly as written and is deferred to P6.10 by a
declared decision; and `droppedRows`, a documented incompleteness signal, reaches neither the user nor
Sentry on the branch where it matters.

---

## Cross-cutting note

Three of the four ids in this cluster show the same shape the repo has already measured: **the audit's
site list undercounts.** B1's guard class survives at `SaveForItSheet.tsx:79` and in `runMigrations`'
untouched `paycheck.amount` / `goals`; M3-20's loss enumeration misses `droppedRows`. In each case the
fix reached every site the *finding* named — the misses are sites the finding never listed, found by
enumerating the data's write paths rather than the finding's citations.
