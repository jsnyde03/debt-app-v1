# Pass 5 · Lane B — store, storage, formatting

**Auditor B.** Target `65566a09b96cdad8072261ac4a710ee1733be467` on `v1.7-dev`.
Manifest: `ROUTING-B.txt`, 113 files. Origins from `ROUTING-ORIGINS.tsv`.

Lane origin split: neighbour 76 · first-look 18 · fix-churn 10 · off-surface 6 · s0-first-look 3.

Status: **COMPLETE.** 3 blocker · 2 major · 7 minor. Summary table and main-tree proof at the end.

---

## Setup / method

Detached worktree at `C:\Users\Jason\audit-p5-b` on `65566a09`, `node_modules` +
`apps/rn/node_modules` + `apps/rn/core` junctioned in (the last is an untracked symlink in the main
checkout, so a fresh worktree has no `@core/*` resolution until it is created — noted for the next pass).
All probes run with `NODE_OPTIONS=--max-old-space-size=1536`. No OOM occurred.

---

## ✅ VERIFIED NOT-A-FINDING — the two date gates CAN fail

The brief asked whether `lint:local-dates` and `lint:month-arithmetic` can actually fail. **Both red for
the reason expected.** Plants went into `apps/rn/src/store/payday.ts` (lane B, `neighbour`) in the
worktree; each was restored from a pre-plant copy and `diff`ed.

| plant | gate | result |
|---|---|---|
| `new Date().toISOString().slice(0, 10)` | `check-local-dates.ts` | `❌ A calendar date routed through UTC` at `payday.ts:241` · **EXIT=1** |
| `d.setMonth(d.getMonth() + 1)` | `check-month-arithmetic.ts` | `❌ A date stepped by months with setMonth/setFullYear` at `payday.ts:241` · **EXIT=1** |
| `new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())` | `check-month-arithmetic.ts` | same red, **EXIT=1** — the constructor form is caught |

Restores: `diff /tmp/payday.pre apps/rn/src/store/payday.ts` → `RESTORE_DIFF_EXIT=0` (3×), and
`git -C /c/Users/Jason/audit-p5-b status --porcelain` printed nothing after each.

⚠️ **Both gates carry a NAMED residual and both name it honestly** — `check-local-dates.ts:41`
("*a caller that stores the ISO string first and slices it two lines later is not expressible as a
regex, so a green run is not proof the class is closed*") and `check-month-arithmetic.ts:109-112`
(a day pre-extracted into a variable). I did not find a live site of either residual in lane B.

---

## `B5-1` — **blocker** · nine lost debt rows are described as "1 whole row", one line above an irreversible replace

- **origin:** `apps/rn/src/data/readBackup.ts` — `off-surface` (changed, on no inventory at all);
  `apps/rn/src/data/migrations.ts` — `fix-churn`.
- **file · line:** `apps/rn/src/data/readBackup.ts:245-264` (`describeLosses`) reading
  `store.pendingDataRepairs`, produced by `apps/rn/src/data/migrations.ts:472-484` (`mergeRepairs`) from
  the record pushed at `apps/rn/src/data/migrations.ts:155`.
- **user-facing consequence:** a backup file holding **10 debts of which 9 are unreadable rows** produces
  the sentence *"This backup has 1 debt, 0 expenses and 0 goals. Saved 8/30/2026 at 8:00 AM. ⚠️ **1 whole
  row** in this backup could not be read."* — **byte-identical** to the file that held 2 debts with 1
  unreadable. The reader is told they are about to import 1 debt and lose 1 row; they are losing 9. That
  sentence is the last thing shown before **Replace my data**, under *"It can't be undone"*, over a live
  portfolio. Both restore doors say it — `describeBackup` (file) and `describeRestorePreview` (iCloud).

### Measurement

`apps/rn/src/store/_probeB3.ts` in the worktree, run as
`cd apps/rn && NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/store/_probeB3.ts` · **EXIT=0**.
Real modules, real door (`serializeBackup` → `readBackup` → `describeBackup`), no fakes:

```
=== MIXED: 10 debts in the file, 9 of them unreadable rows ===
  describeBackup = "This backup has 1 debt, 0 expenses and 0 goals. Saved 8/30/2026 at 8:00 AM. ⚠️ 1 whole row in this backup could not be read."
  describeRestorePreview (iCloud door) = "This backup has 1 debt, 0 expenses and 0 goals. ⚠️ 1 whole row in this backup could not be read."
  dataRepairs=9  pendingDataRepairs=1
  CONTROL — 2 debts, 1 unreadable:
  describeBackup = "This backup has 1 debt, 0 expenses and 0 goals. Saved 8/30/2026 at 8:00 AM. ⚠️ 1 whole row in this backup could not be read."

=== MIXED across entities: 5 bad debt rows + 4 bad goal rows ===
  dataRepairs=9 pending=2
  describeRestorePreview = "... ⚠️ 2 whole rows in this backup could not be read."     <- it counts ENTITIES, not rows

=== FIELD-level control: 9 debts each with an unreadable balance (real ids) ===
  dataRepairs=9 pending=9
  describeRestorePreview = "... ⚠️ 9 amounts in this backup could not be read."        <- the field class counts correctly
```

Also measured directly (`_probeB2.ts`, EXIT=0): 1 / 3 / 9 null debt rows →
`dataRepairs = 1 / 3 / 9` but `pendingDataRepairs = 1 / 1 / 1`, and the same clause all three times.

### Mechanism — **stated as a hypothesis**

`repairMoneyFields` pushes a whole-row loss as `{ entity, id: '', name: '', field: WHOLE_ROW_LOSS_FIELD }`
(`migrations.ts:155`) — `id` is `''` because there was no id to read. `mergeRepairs` dedupes on the key
`entity|id|field` (`migrations.ts:478`), so **every** row loss inside one entity collapses to a single
key. `describeLosses` counts `store.pendingDataRepairs`, i.e. the deduped list, so its `rows` count is
structurally capped at **one per entity**. The truthful count is sitting in `store.dataRepairs`, which is
not deduped and is not read by this sentence.

⚠️ **This is pass-4 `F-B3` recurring on the member its fix did not reach.** `F-B3` split the whole-LIST
clause out of the whole-ROW clause because *"one row and a whole list produced the identical clause from
opposite-sized losses"*, and `readBackup.ts:239` records the reason the LIST case cannot be counted
(*"the unparseable value has no length"*). The ROW case **can** be counted, the docblock quotes
`C-7`'s rule at itself (*"counts it, so 'one' is distinguishable from 'nine'"*), and it is not.
**The premise decayed while the sentence stayed.**

### Remedy — **NOT verified**

Counting from `store.dataRepairs` would be wrong: that list is the *fresh read only* and is empty on a
re-migration of an already-migrated store, so the clause would vanish on the second pass. The obvious
alternative — dropping `id` from the dedupe key — would **introduce** a defect: field-level repairs on
different rows share `entity|field` and would collapse to one, breaking the working `9 amounts` count
measured above. A candidate I did **not** measure: carry a count on the synthetic record itself
(`{ ..., lostRows: n }`) and sum it in `mergeRepairs`, so the dedupe key stays and the magnitude survives.
Treat that as unmeasured.

---

## `B5-2` — **major** · a stale `recovered` repair shadows a fresh `lost` one, and every guard downstream flips to green

- **origin:** `apps/rn/src/data/migrations.ts` — `fix-churn`; consumers in
  `apps/rn/src/store/trustSelectors.ts` — `fix-churn`, `apps/rn/src/data/readBackup.ts` — `off-surface`.
- **file · line:** `apps/rn/src/data/migrations.ts:472-484` (`mergeRepairs`).
- **user-facing consequence:** a store whose `debts[0].balance` is **unreadable** (repaired to `0`) is
  reported by every trust instrument as a debt the app has **confirmed is cleared**. `partitionDebts` puts
  it in `cleared`, not `unreadBalance`; `hasUnreadDebtBalances` is `false`; `mayClaim('debt-balances')` and
  `mayClaim('required-plan')` are both `true`; and the restore sentence says **nothing**. That is the
  "Every balance cleared" / debt-free-finale-over-a-live-card class this module exists to prevent (0-1,
  C3, `G-1`), reached from a direction none of those fixes cover.

### Measurement

`_probeB2.ts`, **EXIT=0**. One store, one variable — the presence of the stale pending record:

```
=== Q2: does a stale `recovered` pending record shadow a fresh `lost` one? ===
  fresh dataRepairs         = [{"entity":"debt","id":"d1","name":"Visa","field":"balance","kind":"lost"}]
  merged pendingDataRepairs = [{"entity":"debt","id":"d1","name":"Visa","field":"balance","kind":"recovered"}]
  debts[0].balance          = 0
  hasUnreadDebtBalances     = false
  mayClaim('debt-balances') = true
  mayClaim('required-plan') = true
  partitionDebts -> live=0 cleared=1 unreadBalance=0
  describeLosses            = ""
  CONTROL - same blob, no pending record:
  merged pendingDataRepairs = [{"entity":"debt","id":"d1","name":"Visa","field":"balance","kind":"lost"}]
  hasUnreadDebtBalances     = true
  partitionDebts -> live=0 cleared=0 unreadBalance=1
  describeLosses            = " ⚠️ 1 amount in this backup could not be read."
```

Every downstream answer flips, in the fail-OPEN direction, on one field of one record.

### Mechanism — **stated as a hypothesis**

`mergeRepairs` iterates `[...pending, ...fresh]` and dedupes on `entity|id|field` — **`kind` is not in the
key and `pending` is first**, so when the same field is classified twice the **older, weaker** class wins.
`recovered` is the class that suppresses the loss sentence *and* the celebration guard
(`trustSelectors.ts:61, 244, 292, 340` all test `r.kind !== 'recovered'`), so the collision always fails
open. `migrations.ts:56-68` argues at length that `lost` is *"the conservative one"* and that the costs
are not symmetric — and then the merge that decides which one survives does not look at `kind` at all.

### Reachability — **bounded honestly**

I could **not** construct a purely in-app sequence: the app writes balances back as numbers, so a plain
hydrate of an app-written blob cannot re-classify a field. The reachable door is the one `migrations.ts:73`
itself names — *"the JSON restore door hands this an arbitrary user-supplied file"*. `serializeBackup`
writes `pendingDataRepairs` into the envelope, so a file the app itself exported after an unacknowledged
`recovered` repair carries the shadowing record; if that same field is later unreadable (a hand edit, a
third-party tool, or the `balance: null` v1.6 shape `migrations.ts:37-40` says is *"in the wild today"*),
the re-import is silent. The iCloud door (`restoreFromCloud` → `runMigrations`) is the same shape.
**Filed `major` on that bound, not on the consequence.**

### Remedy — **NOT verified**

Ordering `[...fresh, ...pending]` would fix this case and **introduce** the opposite one (a fresh
`recovered` would then shadow a pending `lost` the user has not answered). Adding `kind` to the key would
keep both records and double-report the same field. The direction that matches this module's stated rule —
*"`lost` is the conservative class"* — is to keep one record per `entity|id|field` and take the **more
severe** `kind` of the two. I did not measure any of the three.

---

## `B5-3` — **major** · the assertion that certifies "a whole ROW is still counted" checks the WORD, not the count, on the one arity where the defect is invisible

- **origin:** `apps/rn/src/data/readBackup.test.ts` — `off-surface`.
- **file · line:** `apps/rn/src/data/readBackup.test.ts:483-512`, the `F-B3` block; the load-bearing line
  is `:504` — `assert(rowSaid.includes('1 whole row'), 'F-B3 — a whole ROW is still counted, which is
  right for it')`.
- **what it claims vs. what it does:** the fixture is `withRepairs([wholeRow])` — a **hand-built
  `pendingDataRepairs` array of exactly one record**. It never calls `runMigrations`, so it never passes
  through `mergeRepairs`, which is the producer that collapses N row losses to 1 (`B5-1`). The assertion
  matches the literal substring `'1 whole row'`, so it can only ever be satisfied at n=1 — it certifies
  the count while being structurally unable to observe that the count is *always* 1.

### Measurement — three plants, one green run, all against `npm run test:app` (1978 asserts)

| # | plant in `readBackup.ts` | suite | reads |
|---|---|---|---|
| green | *(none)* | **EXIT=0** | `✅ App-layer regression tests: ALL PASSED` — the spec runs green (rule 5) |
| P-a | `const rows = Math.min(…​.length, 1)` — multiplicity of ROW losses destroyed | **EXIT=0**, 1978 `✓` | invisible |
| P-b | `const fields = Math.min(…​.length, 1)` — multiplicity of AMOUNT losses destroyed | **EXIT=0** | invisible |
| P-c | `plural(rows, 'whole line', 'whole lines')` — the WORD changed | **EXIT=1** | `❌ … FAIL [F-B3 — a whole ROW is still counted, which is right for it (got " ⚠️ 1 whole line in this backup could not be read.")]` |

`P-c` is the positive control the rules require: it proves the suite reaches this code, that this exact
assertion is live, and that my edits were being picked up. It reds **on the same assertion** that P-a
walks straight past. ⚡ **The assertion is a word check wearing a count check's sentence.**

⚠️ P-b is the finding's second half: **no fixture anywhere in the app suite asserts more than one loss of
either class.** The multiplicity dimension of the sentence — the only thing that distinguishes losing one
debt from losing nine, on the screen immediately above *"It can't be undone"* — is unguarded in **both**
classes, and the amount class is the one that actually works.

### The counting code itself is fine — it is never handed anything to count

`_probeB4.ts` (**EXIT=0**), handing `describeLosses` records with distinct ids:

```
  1 -> " ⚠️ 1 whole row in this backup could not be read."
  2 -> " ⚠️ 2 whole rows in this backup could not be read."
  9 -> " ⚠️ 9 whole rows in this backup could not be read."
```

So `describeLosses` **can** say "9 whole rows". `migrations.ts:155` writes every row loss with `id: ''`
and `mergeRepairs` keys on `entity|id|field`, so production can only ever hand it one. **The unit test
tests a capability the integrated path cannot reach** — which is exactly the shape `A-F4` was: two
producers, and the test stands on the side that did not move.

### Mechanism — **stated as a hypothesis**

The `F-B3` fix was authored against `describeLosses` alone, and its fixture was written to exercise
`describeLosses` alone. The producer (`mergeRepairs`) was never in the frame, so the arity the fixture
picked (n=1) is the one arity at which producer and consumer agree. This is rule 3 verbatim: *ask which
member of its class the test picked.*

### Remedy — **NOT verified**

Adding `assert(describeLosses(withRepairs([row('a'), row('b')])).includes('2 whole rows'))` would pass
**today** (measured above) and would still not catch `B5-1`, because the defect is in the producer. What
would make completeness checkable: drive this block through `runMigrations` on a blob with N bad rows,
so the fixture cannot be constructed in a state the app cannot produce. I did not write or run that test.

---

## `B5-4` — **minor** · `formatWhole` prints `-$0`, and `formatCurrency` prints `-$0` and `-$0.4`

- **origin:** `apps/rn/src/utils/format.ts` — `neighbour`; `packages/core/utils/formatCurrency.ts` is its
  documented pair.
- **file · line:** `apps/rn/src/utils/format.ts:14-17`; `packages/core/utils/formatCurrency.ts:40-59`.
- **user-facing consequence:** a money line reading **`-$0`**. Three producers of it, measured.

### Measurement — `_probeB1.ts`, **EXIT=0**

```
  formatWhole(-0.4)  = -$0     formatCurrency = -$0.4
  formatWhole(-0)    = -$0     formatCurrency = -$0
  formatWhole(-0.004)= -$0     formatCurrency = -$0
  formatWhole(NaN)   = $0      formatCurrency = $0
  formatWhole(±Inf)  = $0      formatCurrency = $0
  formatWhole(1234.567) = $1,235   formatCurrency = $1,234.57
```

Three distinct members of the class, and the docblock's `Number.isFinite` guard covers only the first two
rows of the six:

1. **negative zero.** `Intl` preserves the sign of `-0`. `-0` is producible by ordinary arithmetic
   (`-1 * 0`, `Math.round(-0.2)`, `Math.min(0, -0)`), and both formatters render it `-$0`.
2. **a magnitude below half a cent, negative.** `formatWhole(-0.004)` and `formatCurrency(-0.004)` are
   both `-$0` — the value rounds away and the sign does not.
3. ⚠️ **`formatCurrency(-0.4)` = `-$0.4`, with ONE decimal place.** `minimumFractionDigits: 0` is
   deliberate and documented (*"cents render only when there ARE cents"*), but it also permits a
   **one-decimal** money string. Nothing in the docblock anticipates that, and it is the spelling a
   reader is least likely to parse as $0.40.

⚠️ **I did not identify the consumer**, and rule 2 says judge the condition the consumer evaluates. Call
sites of `formatWhole` / `formatCurrency` are lane C's manifest, not mine. **What I measured is the
formatter; whether any live selector can hand it a value in `(-1, 0)` is lane C's to close.**

### Mechanism — **stated as a hypothesis**

`Number.isFinite(amount) ? amount : 0` guards the two shapes the seven deleted hand-rolled copies got
wrong (`$NaN`, `$Infinity`) and nothing else. The sign and the rounding are then `Intl`'s, and `Intl`
carries the sign through a magnitude that rounds to zero.

### Remedy — **NOT verified**

`Math.abs(safe) < 0.005 ? 0 : safe` would remove the sign — but the docblock at `format.ts:10-12` is
explicit that **this does not clamp negatives, deliberately**, because *"a clamp is a decision about the
VALUE and belongs to the selector that produces it"*. A rounding-boundary sign fix is arguably not that
clamp, but proposing it here is proposing an edit to the one function the codebase has already decided
should make no decisions about values. **Unverified, and possibly out of scope by that rule.**

---

## `B5-5` — **minor** · a comma in `paycheck.amount` silently removes "the paycheck" from the pre-overwrite warning

- **origin:** `apps/rn/src/data/readBackup.ts` — `off-surface`; `apps/rn/src/data/migrations.ts` — `fix-churn`.
- **file · line:** `apps/rn/src/data/readBackup.ts:206` — `const hasPaycheck = Number(store.paycheck.amount) > 0;`
- **user-facing consequence:** the sentence that names **what the user is about to lose** omits their
  income. Measured, `_probeB1.ts` **EXIT=0**:

```
  paycheck.amount = "1,200"
  describeLocalOverwrite = " This replaces 1 debt you have already entered on this device."
  control (amount="1200") = " This replaces the paycheck and 1 debt you have already entered on this device."
```

### Mechanism — **stated as a hypothesis**

`runMigrations` normalises `paycheck.amount` to a **string** and does not strip commas — measured, same
probe: `"1,200"` in → `"1,200"` out. `Number("1,200")` is `NaN`, and `NaN > 0` is `false`. `readMoney`
strips commas for every *repairable* money field and says why (*"12,000 is a real thing users type"*);
`paycheck.amount` is deliberately excluded from that list because it is a string by design
(`migrations.ts:~256`), so **the one money field the app keeps as a string is the one field with no
comma tolerance on the read side.** `describeLocalOverwrite` is a second producer of "does this user have
income" and it uses the bare `Number()`.

⚠️ **I did not establish that the app itself can persist `"1,200"`.** The v1.6 bridge and the JSON restore
door both accept arbitrary strings; whether the v1.7 paycheck form can is lane C's question. Filed
`minor` on that bound.

### Remedy — **NOT verified**

There is an owner for this parse (`parseDebtFormValues` reaches the same guard from the form side, per
`migrations.ts:76-78`) and `describeLocalOverwrite` does not use it. Routing this one call through the
owner is the shape the codebase already prefers; I did not measure whether that owner accepts a
paycheck-shaped string.

---

## `B5-6` — **minor** · `runMigrations` can return `paycheck.amount === undefined` while the type says `string`

- **origin:** `apps/rn/src/data/migrations.ts` — `fix-churn`.
- **file · line:** the normalisation guard is `if (paycheck.amount !== undefined && typeof paycheck.amount !== 'string')`.
- **measurement** (`_probeB1.ts`, **EXIT=0**) — every other shape is normalised and this one is not:

```
  in="1200" -> out="1200"   in=1200 -> out="1200"   in=null -> out=""
  in={"a":1} -> out=""      in=[1,2] -> out=""      in=true -> out="true"
  in=undefined -> out=undefined  typeof=undefined
```

- **consequence:** `inferOnboarding` tests `typeof paycheck.amount === 'string'`, so an `undefined`
  amount reads as "no income" and the store is routed back to onboarding with data already imported —
  the exact failure `inferOnboarding` was written to stop.
- **mechanism, as a hypothesis:** `{ ...base.paycheck, ...r.paycheck }` lets an explicitly-present
  `amount: undefined` overwrite the default `''`, and the `!== undefined` half of the guard then skips it.
  ⚠️ **Not reachable through JSON** (JSON has no `undefined`), so the door would have to be an
  in-memory object — `mapLegacyStore`'s `partial`, or a direct `importStore`. **I did not trace either to
  a producer of `amount: undefined`**, which is why this is `minor` and not higher.
- **remedy — NOT verified:** dropping the `!== undefined` half of the guard makes `undefined` land at
  `''`, matching `null`. One character; I did not run the suite against it.

---

## `B5-7` — **blocker** · a debt with a blank name loses its unreadable-balance record to one "Got it" tap, and the app then calls it cleared

- **origin:** `apps/rn/src/store/trustSelectors.ts` — `fix-churn` (swept, then rewritten);
  producer `apps/rn/src/data/migrations.ts` — `fix-churn`.
- **file · line:** `apps/rn/src/store/trustSelectors.ts` — `answerableByEdit`:
  `return r.entity !== 'migration' && !!r.name && !isWholeRowLoss(r);`, consumed one function up in
  `clearResuppliedRepairs` at `if (!answerableByEdit(r)) return !r.acknowledged;`.
- **user-facing consequence:** restore a backup holding a debt whose `name` key is **absent, empty, or
  not a string**, and whose `balance` is unreadable. The repair is recorded correctly and the guards arm
  correctly. Then the user taps **"Got it"** on the repairs card — one tap — and the record is **deleted**.
  `hasUnreadDebtBalances` goes false, `mayClaim('debt-balances')` goes true, and `partitionDebts` moves
  the debt out of `unreadBalance` and into **`cleared`**: the app now states that a debt whose balance it
  could not read is **paid off**, and the debt-free framing / trophy shelf / once-ever finale are all
  unlocked over it. ⚡ **This is blocker `A-J2-1` verbatim** — *"one 'Got it' tap restored 'Every balance
  cleared' over debts still owed"* — recurring on the member of its class with a blank name.

### Measurement — `_probeB5.ts`, real store (`createDebtStore` → `importStore` → `acknowledgeDataRepairs`), **EXIT=0**

One variable: the debt's `name`. Four members of one class.

```
--- A · debt WITH a name, balance unreadable   (THE MEMBER EVERY TEST PICKED)
  after "Got it"       : pending=[{... "name":"Visa","field":"balance","kind":"lost","acknowledged":true}]
  after ONE unrelated edit (strategy toggle):
    hasUnreadDebtBalances     = true
    mayClaim('debt-balances') = false
    partitionDebts -> live=0 cleared=0 unreadBalance=1        <- guard HOLDS

--- B · debt with NO name key, balance unreadable
  after migration : pending=[{"entity":"debt","id":"d1","name":"","field":"balance","kind":"lost"}]
                    hasUnreadDebtBalances = true              <- armed correctly
  after "Got it"  : pending=[]                                <- the record is GONE
                    hasUnreadDebtBalances = false
    mayClaim('debt-balances') = true
    partitionDebts -> live=0 cleared=1 unreadBalance=0        <- the app says CLEARED

--- C · debt with an EMPTY-STRING name  -> identical to B
--- D · debt with a NON-STRING name     -> identical to B
```

⚠️ The record dies at the ack **itself** — `acknowledgeDataRepairs` moves `store`, and the `set` wrapper in
`store.ts` runs `clearResuppliedRepairs` on every patch that does. No second action is needed.

### Mechanism — **stated as a hypothesis**

`repairMoneyFields` writes `name: typeof next.name === 'string' ? next.name : ''` (migrations.ts, in the
repair push), so a debt with no name — or a non-string one — produces a repair whose `name` is `''` while
the **row still exists, still renders, and is still editable**. `answerableByEdit`'s docblock states its
premise as *"a record with no `name` … has no screen to open"*. For a field-level repair on a real row
that premise is **false**: `!!r.name` is testing whether the row's name STRING is empty, not whether the
repair names a row. `clearResuppliedRepairs` then treats the generic ack as a valid ANSWER — the exact
thing `A-J2-1` established it is not.

⚡ **And the prose beside it enumerates three members while the code has four.** The docblock says *"A
repair NOTHING CAN BE OPENED FOR is cleared by the ACKNOWLEDGEMENT instead… A whole-row or whole-list loss
names no field; a `migration` record names no row at all."* Those are three. `answerableByEdit` admits a
**fourth** — any repair with a falsy `name` — and it is the one nobody wrote down. That is rule 2:
**judge the condition the consumer evaluates, never the example cited beside it.**

### Which member did the test pick? (rule 3)

**Every blank-`name` fixture in the repo pairs the blank name with a synthetic field or a `migration`
entity — never with a real field.** Enumerated, and treat the count as a lower bound:

```
trustSelectors.test.ts:416   { entity:'debt',     id:'', name:'', field:'(a row could not be read)' }
trustSelectors.test.ts:448   { entity:'migration',id:'', name:'', field:'3 items ... not recognised' }
dataRepairsCopy.test.ts:124  { entity:'migration',id:'', name:'', field:'Your rollover count ...' }
dataRepairsCopy.test.ts:129  { entity:'debt',     id:'', name:'', field:'(whole list unreadable)' }
dataRepairsCopy.test.ts:159  { entity:'debt',     id:'', name:'', field:'(a row could not be read)' }
dataRepairsCopy.test.ts:170  { entity:'debt',     id:'', name:'', field:'(a row could not be read)' }
```

`dataRepairsCopy.test.ts:167` even comments *"The discriminator is the NAME, not the entity"* — and its
fixture is a whole-ROW loss, for which `isWholeRowLoss` would have returned the same verdict. **The
assertion that pins the name half is written on a fixture where the name half does not decide.**

### The guard survives its own un-fix — plant, **`npm run test:app`**

| plant in `trustSelectors.ts` | suite | probe B |
|---|---|---|
| *(none)* | **EXIT=0**, ALL PASSED | `cleared=1`, `mayClaim=true` — defective |
| drop the `!!r.name` half of `answerableByEdit` | **EXIT=0**, ALL PASSED | `unreadBalance=1`, `mayClaim=false` — correct |

The plant is a real behaviour change (the probe flips; verified by re-running `_probeB5.ts` under the
plant), and **1978 asserts cannot see it in either direction.** Restored from a post-plant copy;
`diff` → `RESTORE_E_EXIT=0`, `git status --porcelain` shows only my untracked probe files.

### Remedy — **NOT verified**

Dropping `!!r.name` (the plant) closes this and leaves the suite green — but it also changes what happens
to any *other* nameless field-level repair, and `dataRepairsCopy.ts:142` carries a **second, independent
copy** of the same predicate (`const actionable = (r) => r.entity !== 'migration' && !!r.name;` — note it
omits `isWholeRowLoss` entirely, so the two producers of "is this actionable" are already not the same
function despite the docblock claiming one is *"re-derived rather than re-invented"*). A change to one
without the other re-opens the drift. **The right question is which predicate is the owner**, and I did
not measure the copy layer's behaviour under any change.

---

## `B5-8` — **minor** · two spellings of "is this repair actionable", and the docblock says there is one

- **origin:** `apps/rn/src/store/trustSelectors.ts` — `fix-churn`.
- **file · line:** `apps/rn/src/store/trustSelectors.ts` `answerableByEdit` vs.
  `apps/rn/src/components/plan/dataRepairsCopy.ts:142`.
- **the carried premise, checked:** `trustSelectors.ts:391` states the predicate is *"`dataRepairsCopy`'s
  own `actionable`, **re-derived here rather than re-invented***". Read side by side:

```
trustSelectors.ts   r.entity !== 'migration' && !!r.name && !isWholeRowLoss(r)
dataRepairsCopy.ts  r.entity !== 'migration' && !!r.name
```

  The third clause exists in one and not the other. They agree today only because every whole-row loss the
  producer writes also carries `name: ''`, which makes `!!r.name` false anyway — i.e. **the two producers
  agree by a coincidence of a third field, not by construction**, which is the arrangement `B5-7` is a
  consequence of. ⚠️ Nothing compares them; there is no gate. **Filed `minor` because I measured no
  behavioural difference today** — only that the comment's claim of one owner is untrue.
- **remedy — NOT verified:** export one predicate and have the copy layer import it. I did not check
  whether `dataRepairsCopy` can import from `store/` without a cycle.

---

## `B5-9` — **blocker** · deleting a debt and adding another in the same pay cycle re-issues the dead id, and $500 of the deleted debt's extra payment lands on the new one

- **origin:** `apps/rn/src/store/debtIds.ts` — `neighbour`; `apps/rn/src/store/store.ts` — `fix-churn`;
  `apps/rn/src/store/payday.ts` — `neighbour`. **All three are lane B, none of them changed, and the
  defect is only visible when they are read together.**
- **file · line:**
  - `apps/rn/src/store/store.ts:505-507` — `removeDebt` filters `debts` and nothing else.
  - `apps/rn/src/store/debtIds.ts:14-19` — `newDebtId` mints the lowest free `debt-<cycleDate>-<n>`
    **against the surviving debts only**.
  - `apps/rn/src/store/payday.ts:102-110` — `applyRollover` calls
    `getCompletedSnowballAmount(debt.id, store.completedRecommendedActions)`, which matches `targetId === debt.id`.
- **user-facing consequence:** a user marks the Today card's extra-payment checkbox against their Store
  Card (**$500**), then deletes the Store Card, then adds a new debt (**Car loan, $11,380**). At the next
  payday the Car loan is written down to **$10,967.54** instead of **$11,467.54** — **$500 of a payment
  that was never made against it**, persisted. The user's real Car loan balance and the app's now disagree
  by $500, permanently, with nothing on any screen saying why.

### Measurement — `_probeB6.ts`, the real store, real actions, **EXIT=0**

Every step is a real user tap: `toggleRecommendedDone` is wired to the Today checkbox
(`app/(tabs)/index.tsx:550`), `newDebtId` is what the Add-debt sheet calls
(`components/entities/DebtSheet.tsx:182`), and `rolloverPayCycle` is payday.

```
debts: [{"id":"debt-2026-08-30-1","name":"Visa","balance":1000},
        {"id":"debt-2026-08-30-2","name":"Store Card","balance":800}]
completedRecommendedActions: [{"category":"snowball","targetId":"debt-2026-08-30-2",
        "label":"Extra to Store Card","recommendedAmount":500,"actualAmount":500,"paymentSource":"paycheck"}]

after removeDebt -> debts: ["debt-2026-08-30-1"]
after removeDebt -> completedRecommendedActions STILL: [... targetId "debt-2026-08-30-2" ...]

newDebtId for the NEW debt = debt-2026-08-30-2      <- THE DELETED DEBT'S ID, RE-ISSUED
debts now: [{"id":"debt-2026-08-30-1","name":"Visa","balance":1000},
            {"id":"debt-2026-08-30-2","name":"Car loan","balance":11380}]

AFTER ROLLOVER: [{"id":"debt-2026-08-30-1","name":"Visa","balance":1007.69},
                 {"id":"debt-2026-08-30-2","name":"Car loan","balance":10967.54}]

CONTROL - identical sequence, new id minted on a DIFFERENT cycle date:
AFTER ROLLOVER: [... {"id":"debt-2026-09-01-2","name":"Car loan","balance":11467.54}]
```

**One variable — the minted id. $11,467.54 vs $10,967.54. Exactly the $500.**

The CSV-import door does it in batch too (`components/entities/ImportDebtsSheet.tsx:77` →
`mintDebtIds`): with only `debt-D-1` surviving, `mintDebtIds(D, [{id:'debt-D-1'}], 3)` returns
`["debt-D-2","debt-D-3","debt-D-4"]` — the first imported row takes the dead id.

### And four more records follow the id — `_probeB7.ts`, **EXIT=0**

`removeDebt` leaves every other reference to the dead id in place, so the replacement inherits them all:

```
  milestoneMaxProgress[newDebt]   = 75      <- a brand-new $11,380 debt at 0% starts at a 75% high-water,
                                               so its 25/50/75% beats can never fire
  recommendationOverrides          -> targetId still points at the new debt
  pendingPayoff.debtId === newDebt.id ? true   <- the pending "Store Card paid off!" beat now names it
  pendingDataRepairs               -> a repair record now attached to the new debt
```

### Mechanism — **stated as a hypothesis**

`newDebtId`'s docblock states its rule as *"Uniqueness comes from the ids that EXIST, not from a module
counter."* ⚡ **That premise is the defect.** Uniqueness against the surviving `debts` array is not
uniqueness against the ids the STORE still references — `completedRecommendedActions`,
`milestoneMaxProgress`, `recommendationOverrides`, `pendingPayoff` and `pendingDataRepairs` all key on
debt id and all outlive a delete. The docblock is careful about the counter it rejected and silent about
the set it is checking against, which is the half that is wrong. Because `cycleDate` is
`paycheck.currentDate` and holds still for a whole pay cycle, "delete and re-add inside one cycle" is the
**ordinary** case, not a corner.

### Which member did the test pick? (rule 3)

`apps/rn/src/store/debtIds.test.ts` (**`first-look`**) has six `newDebtId` / `mintDebtIds` cases and
**every one of them passes a contiguous, append-only `existing` list** — `[]`, `[-1]`, `[-1,-2,legacy]`.
**No fixture has a gap.** A gap is the only shape that reuses an id, and it is the shape a delete makes.
`apps/rn/src/store/storeActions.test.ts` contains **zero** occurrences of `removeDebt` — the action that
creates the dangling references is not exercised at all.

### Remedy — **NOT verified, and the obvious one is wrong**

Making `removeDebt` also purge `completedRecommendedActions` would close this instance and **introduce**
a different loss: those entries are the record of payments the user reported making, and `cycleHistory`'s
snapshot is built from them at rollover — deleting them rewrites the closing cycle's history. Making
`newDebtId` mint monotonically from a persisted high-water would fix the reuse without touching history,
but it changes the id scheme for every future debt and the docblock's own reasoning about launch-stable
counters would need re-checking. A third option is to have `newDebtId` check the ids the *store*
references rather than the ids the *debts array* holds. **I measured none of the three.**

---

## `B5-10` — **minor** · `computeReserveRelease` scopes surprises to `onboardedAt`, and an upgraded/restored user never has one

- **origin:** `apps/rn/src/store/payday.ts` — `neighbour`.
- **file · line:** `apps/rn/src/store/payday.ts:230` — `const since = store.onboardedAt ?? '';` then
  `.filter((o) => o.cycleEndDate >= since)`.
- **user-facing consequence:** the settling-in reserve's release ack can credit the safety net for
  surprise outflows that happened **before the reserve was ever held**, saying it *"covered"* money it did
  not. Bounded by the `Math.min(surpriseSum, heldReserve)` cap on the next line, which is why this is
  `minor` and not higher.
- **mechanism, as a hypothesis:** `''` is `<=` every ISO date string, so `?? ''` widens the filter to the
  **entire** surprise log — which the docblock names as the pre-MF.5 defect (*"the old version summed the
  ENTIRE surprise log"*). `onboardedAt` is written **only** by `stampOnboardedAt`, called from exactly one
  place (`store.ts:745`, `completeOnboarding`). A user who arrives by **restore or v1.6 upgrade** gets
  `prefs.onboardingComplete: true` from `inferOnboarding` in `migrations.ts` — a **second producer of the
  same fact** — and never passes through `completeOnboarding`, so `onboardedAt` stays `null` for the life
  of the install. ⚡ **Two producers of "this user has started", and only one of them stamps the date.**
- ⚠️ **Verified-not-a-finding beside it:** `celebrationSelectors.ts:116` reads the same null and returns
  `monthsToFreedom: null`. Its docblock calls that state *"legacy"* explicitly, so it is documented, not
  a defect — but it is the same root, and it means the once-ever finale silently omits its "months to
  freedom" line for every restored user.
- **remedy — NOT verified:** stamping `onboardedAt` where `inferOnboarding` promotes `onboardingComplete`
  would need a date, and the only honest one is the restore date, not the user's real start — so this may
  be a case where the right answer is to keep `null` and make the two consumers say so. I measured neither.

---

## `B5-11` — **minor** · the sheet tells a signed-IN user to sign in to iCloud, and cannot tell them apart from a signed-out one

- **origin:** `apps/rn/src/data/cloudBackupMessages.ts` — `off-surface`;
  `apps/rn/src/storage/cloudBackup/service.ts` — `neighbour`;
  `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts` — `fix-churn`.
- **file · line:** `service.ts:165` (`if (claim.state === 'unknown') return { ok: false, reason: 'unavailable' };`)
  → `use-cloud-backup.ts:144` → `cloudBackupMessages.ts:57` (`if (result === 'unavailable') return SIGN_IN_TO_ICLOUD;`).
- **user-facing consequence:** a user who **is** signed in to iCloud, whose backup file exists but whose
  `mtimeMs` is unreadable, taps *Back up now* and is told **"Sign in to iCloud on this device to use
  backup."** There is no action they can take, and per `createCloudBackupProvider.ios.ts:117` *"every later
  automatic backup is refused the same way for as long as the mtime stays unreadable"* — so the sentence
  repeats forever. ⭐ Nothing is destroyed (`writes=0`), which is the safe direction the guard intends.

### Measurement — `_probeB8.ts`, real `service.ts` + real `metadataFromMtime`, fake provider, **EXIT=0**

```
provider.isAvailable() = true   <- the user IS signed in
inspectRemote          = {"state":"unknown"}
backupToCloudGuarded   = {"ok":false,"reason":"unavailable"}   writes=0
cloudBackupMessage     = "Sign in to iCloud on this device to use backup."

CONTROL - a genuinely signed-OUT provider:
  backupToCloudGuarded = {"ok":false,"reason":"unavailable"}
  cloudBackupMessage   = "Sign in to iCloud on this device to use backup."
```

**Byte-identical outcome and byte-identical sentence from opposite states.** That is the same shape as
`F-B3` (opposite-sized losses, one clause) one module over.

- **mechanism, as a hypothesis:** `RemoteClaim` has four states and `GuardedBackupOutcome` has three
  reasons, so `unknown` is folded onto `unavailable` at `service.ts:165`. The fold is deliberate and
  correct for the *refusal*; what it also does — silently — is hand the copy layer a reason whose only
  wording is *"sign in"*. `CloudBackupOutcomeKind` has no member for *"iCloud is here and I cannot read
  the file."*
- **remedy — NOT verified:** adding a fifth outcome kind is the obvious move and it touches the
  service's public type, the hook, the sheet and the messages table. I did not measure it, and I did not
  check whether `CloudBackupSheet`'s `ready` branch (which the file's own docblock says **no automated
  test in this repo can reach**) would render it.

---

## `B5-12` — **minor** · the migration-audit's money-type invariant checks 3 of the 5 debt money fields it has an inventory for

- **origin:** `apps/rn/src/data/migrationAudit/invariants.ts` — `s0-first-look` **(never swept by any pass, ever)**.
- **file · line:** `invariants.ts:76` — `const MONEY_FIELDS = ['balance', 'minimumPayment', 'apr', 'amount']`.
- **what it claims vs. what it does:** invariant ③ is *"Money and dates keep their type"* and is the
  instrument built to prove *"a restore cannot corrupt the user's money."* `migrations.ts` declares the
  inventory in `REPAIRABLE_MONEY_FIELDS`; the invariant's debt list is **two fields short of it**:

| entity | `REPAIRABLE_MONEY_FIELDS` | `invariants.ts` checks |
|---|---|---|
| debt | `balance` `minimumPayment` `apr` **`originalBalance`** **`scheduledPaymentAmount`** | `balance` `minimumPayment` `apr` |
| requiredExpense / livingExpense | `amount` | `amount` ✅ |
| goal | `targetAmount` `currentAmount` `priorityPerPaycheck` | all three ✅ |

  ⚡ **This is the exact shape the file's own docblock records at lines 79-99** — *"GOALS WERE NOT
  CHECKED, AND GOALS ARE WHERE BOTH MONEY DEFECTS WERE FOUND … the field names it looked for are none of
  the ones a goal carries."* The goal list was then fixed **by hand**, and no gate ties either list to the
  declared inventory, so the debt list stayed short. `trustSelectors.test.ts` has exactly such a gate for
  the claim table; `invariants.ts` has none.
- **measured consequence today: none.** `repairMoneyFields` coerces every field in `required` **and**
  `optional` through `readMoney`, so no non-number can survive to be caught. **I could not construct an
  input that the missing two fields would have caught** — which is why this is `minor` and is filed as
  *an instrument doing less than it claims*, not as a live defect.
- **remedy — NOT verified:** derive the invariant's field lists from `REPAIRABLE_MONEY_FIELDS` the way
  `trustSelectors.test.ts` does. ⚠️ **A cap derived from the list it caps is its own defect class** (rule
  4), so the right shape is probably an assertion that the two agree, not a shared constant. Unmeasured.

---

## `B5-13` — **minor** · `debtIds.ts` states a constraint that two sibling sheets break

- **origin:** `apps/rn/src/store/debtIds.ts` — `neighbour`.
- **the carried premise, checked:** `debtIds.ts:8-9` — *"⛔ **No `Date.now()`** — the React Compiler
  treats it as an impure render-time call, and the callers declare their submit handlers in the component
  body."* Checked against the code:

```
components/entities/ExpenseSheet.tsx:83   addExpense({ id: `expense-${Date.now()}`, ... })
components/entities/GoalSheet.tsx:139     addGoal({ id: `goal-${Date.now()}`, ... })
components/onboarding/FirstDebtOrBillStep.tsx:96   id: `expense-${Date.now()}`
```

  Three sites, all in submit handlers declared in the component body — the exact position the docblock
  says is forbidden. So either the constraint is real and three shipped call sites violate it, or it is
  stale and the collidable `debt-<cycleDate>-<n>` scheme (the root of `B5-9`) was adopted against a
  premise that no longer holds. ⚠️ **Either way the premise and the code disagree, and only debts got the
  collidable scheme.** Goals and expenses cannot reuse an id; debts can.
- **remedy — NOT verified:** resolving this is a prerequisite for choosing `B5-9`'s fix, not a change on
  its own.

---

# Summary

## By severity and origin

| | `neighbour` | `first-look` | `fix-churn` | `off-surface` | `s0-first-look` | **total** |
|---|---|---|---|---|---|---|
| **blocker** | 1 (`B5-9`) | — | 1 (`B5-7`) | 1 (`B5-1`) | — | **3** |
| **major** | — | — | 1 (`B5-2`) | 1 (`B5-3`) | — | **2** |
| **minor** | 4 (`B5-4` `B5-5`¹ `B5-10` `B5-13`) | — | 1 (`B5-8`) | 1 (`B5-11`) | 1 (`B5-12`) | **7** |
| **total** | **5** | **0** | **3** | **3** | **1** | **12** |

¹ `B5-5` spans `readBackup.ts` (`off-surface`) and `migrations.ts` (`fix-churn`); counted once, under the
file the sentence is produced in. Several findings span two or three origins — where they do, the row is
the file the **consequence** lands in, and the full origin list is on the finding itself.

⚠️ **Count these as a LOWER BOUND.** Site counts in this project have come in short on eight consecutive
items and I have no reason to be the exception. What would make completeness checkable, per finding class:

- `B5-1` / `B5-3`: a gate asserting that every sentence built from `pendingDataRepairs` is exercised
  through `runMigrations` rather than a hand-built array. Today nothing distinguishes a fixture the app
  can produce from one it cannot.
- `B5-7`: a gate that every predicate deciding *"may this claim be made"* is exercised on **both**
  polarities of each of its `&&` clauses. Three of `answerableByEdit`'s four members are covered; the
  fourth is not, and nothing counts them.
- `B5-9`: a gate that no store field keyed by an entity id survives that entity's removal — or, more
  cheaply, that no id the store still references can be re-minted. Today the id scheme and the
  id-referencing fields are in different files with nothing between them.
- `B5-12`: an assertion that `invariants.ts`' field lists and `REPAIRABLE_MONEY_FIELDS` agree.

## What the split says

⚡ **Every one of the five findings that matters is a `neighbour`, `fix-churn` or `off-surface` file — the
three origins that had never been routed to a reader before this round.** `B5-9` in particular is
invisible from any single file: `debtIds.ts`, `store.ts` and `payday.ts` are each individually correct,
none of them changed, and the defect only exists in the sentence they form together. That is the
`A-F4` shape the brief said to expect, and it is where it was found.

**Zero findings in `first-look`** — but that is not a clean bill: 15 of my 18 `first-look` files are
`*.test.ts` and I read only two of them (`debtIds.test.ts`, and the `F-B3` block of `readBackup.test.ts`).
`debtIds.test.ts` is `first-look` and its fixture gap is half of `B5-9`. **The instruments in this lane
are under-read, not clean.**

## Instruments vs. app

- **App defects:** `B5-1`, `B5-2`, `B5-5`, `B5-7`, `B5-9`, `B5-10`, `B5-11` — 7.
- **Instrument defects:** `B5-3` (a word check wearing a count check), `B5-12` (an invariant two fields
  short), and the untested halves recorded inside `B5-7` and `B5-9` — 2 filed, 2 embedded.

Reported separately because a flat total would hide it: **the app's guards are getting stronger and the
tests that certify them are being written on the one member of each class where the guard is not
deciding.** Three of my findings (`B5-1`, `B5-7`, `B5-9`) are the same failure — *the fixture picked the
arity/spelling/shape at which the defect is invisible* — which is reading rule 3, three times, in one lane.

## OOM

**None.** Every `tsx` and `npm run test:app` invocation ran under
`NODE_OPTIONS=--max-old-space-size=1536`. No retry with a larger heap was attempted and none was needed.
The full app suite (1978 asserts) ran to completion five times inside that cap.

## What I did NOT get to

I opened roughly **50 of my 113 files.** The following are **unread** and carry no verdict from me:

- **store selectors:** `analysisSelectors` `balanceSelectors` `expenseReserveSelectors` `topUpSelectors`
  `recoverySelectors` `selectors.ts` `guardianSelectors` (871 lines) `guardianPrediction`
  `guardianPredictionCore` `guardianSubjects` `substrateProducers` `forecastCycles` `drift` `greeting`
  `coachMarks` `paywallLead` `tutorialPath` `tutorialSelectors` `tutorialSession` `tutorialTargets`
- **sandbox / demo:** `sandboxStore` `sandboxScenarios` `sandboxBeats` `sandboxHarness` `sandboxRun`
  `demoRun` (**`off-surface`**) `demoSession` `demoExit`
- **store plumbing:** `appStore` `StoreContext.tsx` `useAppStore`
- **data / storage:** `backupFile` `cloudBackup.ts` `legacyBridge/migrateFromLegacy` `legacyBridge/report`
  `legacyBridge/webkitLocalStorage` `migrationAudit/doors.ts`
- **utils:** `a11y` `confirm` `debtFreeSound` `reportError` `share-card` `skia-ready` `skia-ready.web`
  (**`first-look`**) `lib/scan.ts` `config/qa.ts` `analytics/funnel.ts`
- **~26 of the 30 `*.test.ts` files in my manifest**, including all three `s0-first-look` migration-audit
  files except a partial read of `invariants.ts` and a full read of `run.ts` — so
  `migrationAudit/cutoverFiles.test.ts` and `migrationAudit/interruption.test.ts` **remain never-swept by
  any pass.** ⚠️ Those two are the highest-value unread items in the lane: they are `s0-first-look`, they
  are instruments, and `persistence.ts:28-31` says in its own docblock that `interruption.test.ts`
  *"drives the bridge directly and never runs this function"* — a coverage claim nobody has checked.
- I also did **not** exercise the **JSON serialisation boundary**. `MemoryStorageAdapter`
  (`storage/adapter.ts:28-38`) stores the object **by reference**, so every persistence test in this lane
  round-trips an object that was never serialised, while production goes through
  `JSON.stringify`/`JSON.parse` (`storage/createAdapter.ts:29,37`). I formed the hypothesis that this hides
  a class (`undefined` keys dropped, `NaN`/`Infinity` → `null`, `-0` → `0`) and **did not measure it**.
  It is the first thing I would do with more time.

## Main-tree proof

```
$ git -C /c/Users/Jason/debt-app-v1 status --porcelain
```
— pasted verbatim at the end of this file after the worktree was removed.

⚠️ **One caveat, stated because it would otherwise look like mine:** partway through this pass
`docs/DEBT_ELEVATION_PLAN.md` appeared as ` M` in the main tree, and `C-screens.md` /
`D-instruments.md` appeared as new untracked files. **Neither is mine** — I touched exactly one file
under the main tree, `docs/audits/2026-08-29-s1-money-pass5/B-store-storage.md`. Another auditor or the
dispatcher is writing to the main tree concurrently.

---

## Proof the main tree is untouched

Worktree removed cleanly (junctions `rmdir`-ed first so the delete could not follow them into the real
`node_modules` / `packages/core`; targets verified intact afterwards — 739 and 607 entries, `packages/core`
present):

```
$ git -C /c/Users/Jason/debt-app-v1 worktree remove --force /c/Users/Jason/audit-p5-b
REMOVE_EXIT=0

$ git -C /c/Users/Jason/debt-app-v1 worktree list
C:/Users/Jason/debt-app-v1  65566a09 [v1.7-dev]
C:/Users/Jason/audit-p5-a   65566a09 (detached HEAD)
C:/Users/Jason/audit-p5-d   65566a09 (detached HEAD)

$ git -C /c/Users/Jason/debt-app-v1 status --porcelain
 M docs/DEBT_ELEVATION_PLAN.md
?? docs/audits/2026-08-29-s1-money-pass5/A-engine.md
?? docs/audits/2026-08-29-s1-money-pass5/B-store-storage.md
?? docs/audits/2026-08-29-s1-money-pass5/C-screens.md
?? docs/audits/2026-08-29-s1-money-pass5/D-instruments.md
?? docs/audits/2026-08-29-s1-money-pass5/DISPATCH.md
STATUS_EXIT=0

$ git -C /c/Users/Jason/debt-app-v1 rev-parse HEAD
65566a09b96cdad8072261ac4a710ee1733be467
```

⛔ **Of those six lines, exactly one is mine: `B-store-storage.md`.** `A-engine.md` and `DISPATCH.md`
already existed when I started; `C-screens.md`, `D-instruments.md` and the modification to
`DEBT_ELEVATION_PLAN.md` all appeared during my run — auditors A and D still have worktrees open on the
same pin. My first `git status --porcelain` of this session, before any work, read:

```
?? docs/audits/2026-08-29-s1-money-pass5/A-engine.md
?? docs/audits/2026-08-29-s1-money-pass5/B-store-storage.md
?? docs/audits/2026-08-29-s1-money-pass5/DISPATCH.md
```

All plants, probes and test runs happened inside `C:\Users\Jason\audit-p5-b`, which was
`git status --porcelain`-clean at removal (probe files deleted first, restores diffed to zero).

### Every restore, verified

| plant | file | restore check |
|---|---|---|
| `toISOString().slice(0,10)` | `store/payday.ts` | `diff /tmp/payday.pre <file>` → `RESTORE_DIFF_EXIT=0` |
| `setMonth(getMonth()+1)` | `store/payday.ts` | `diff /tmp/payday.pre2 <file>` → `RESTORE_DIFF_EXIT=0` |
| `new Date(y, m+1, d.getDate())` | `store/payday.ts` | `diff /tmp/payday.pre3 <file>` → `RESTORE3_EXIT=0` |
| `Math.min(rows, 1)` | `data/readBackup.ts` | `diff /tmp/readBackup.pre <file>` → `RESTORE_A_EXIT=0` |
| `Math.min(fields, 1)` | `data/readBackup.ts` | `diff /tmp/readBackup.pre2 <file>` → `RESTORE_B_EXIT=0` |
| `'whole line'` (positive control) | `data/readBackup.ts` | `diff /tmp/readBackup.pre3 <file>` → `RESTORE_C_EXIT=0` |
| drop `!!r.name` (×2) | `store/trustSelectors.ts` | `diff /tmp/trust.pre <file>` → `RESTORE_D_EXIT=0`; `diff /tmp/trust.pre2 <file>` → `RESTORE_E_EXIT=0` |

Each copy was taken **after** the pre-plant state was known good and **before** the plant, and the diff
was run against that copy rather than against `git checkout --`.
