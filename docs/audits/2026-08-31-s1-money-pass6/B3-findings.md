# B3 — storage, backup, formatting, dates · pass 6 findings

Lane B3 · 62-file manifest · subject: how the number is spelled and persisted outside the store.
Origins are quoted from `ROUTING-ORIGINS.tsv`. Remedies are marked verified / **unverified**.

---

## B3-1 — `runMigrations` repairs money in four LISTS and none of the three money fields that live on the STORE itself

- **Origin:** `apps/rn/src/data/migrations.ts` — `fix-churn`.
- **Severity:** **blocker** (the app states a false figure about the user's money and records no repair).

**User-facing consequence.** Restore a backup file whose `cushionFloor` is unreadable and Progress →
Cash flow captions the dashed reference line **"your $0 line · room after each paycheck"**, while the
Guardian's `holdsLine` predicate can never be true for the same store. Nothing appears on the data-repairs
card, because no repair was recorded — the module's own opening rule is *"money that cannot be read is
REPAIRED and REPORTED, never trusted and never silently dropped."*

**File and line.**
- `apps/rn/src/data/migrations.ts:246-251` — `REPAIRABLE_MONEY_FIELDS` covers `debt`, `requiredExpense`,
  `livingExpense`, `goal` only.
- `apps/rn/src/data/migrations.ts:260` — `const paycheck = { ...base.paycheck, ...(r.paycheck ?? {}) };`
  Only `paycheck.amount` is normalised (`:279-281`). `leanAmount` and `typicalAmount` — both typed
  `number` at `apps/rn/src/data/models.ts:65-66` — pass through untouched.
- `apps/rn/src/data/migrations.ts:456-458` — `return { ...base, ...r, … }` carries `cushionFloor`
  (`models.ts:389`, typed `number`) verbatim from the raw blob.

**The measurement.** `runMigrations` called directly (tsx, `apps/rn/tsconfig.json`), three raw blobs:

```
A  raw.paycheck.leanAmount = '1,200' · typicalAmount = null · raw.cushionFloor = 'abc'
   → { leanAmount: "1,200", typicalAmount: null, cushionFloor: "abc", dataRepairs: [] }
B  raw.paycheck.leanAmount = -500 · raw.cushionFloor = -9999
   → { leanAmount: -500, typicalAmount: 0, cushionFloor: -9999, dataRepairs: [] }
C  raw.paycheck.leanAmount = Infinity
   → { leanAmount: Infinity, cushionFloor: 200, dataRepairs: [] }
```

`dataRepairs` is **empty in all three**. The identical `'1,200'` in a debt's `balance` is recorded as
`debt.balance:recovered`; in `paycheck.leanAmount` it is recorded as nothing.

Downstream, traced by reading (not executed):
- `apps/rn/src/store/selectors.ts:24-26` → premium returns `store.cushionFloor ?? 200` = `'abc'`;
  `??` does not fire on a string.
- `apps/rn/src/components/progress/CashFlowSection.tsx:122` → `your {formatWhole(floor)} line`;
  `apps/rn/src/utils/format.ts:15` maps a non-finite input to `0`, so the caption reads **"your $0 line"**.
- `apps/rn/src/store/guardianSelectors.ts:351` → `… >= (store.cushionFloor ?? 200)` compares a number to
  `'abc'`, which is `false` for every possible surplus.
- `apps/rn/src/store/planSelectors.ts:145` → `store.paycheck.leanAmount <= 0` is `false` for `'1,200'`
  (NaN comparison), so the lean-income run proceeds; `:149` then re-stringifies it as `paycheck.amount`.

**Mechanism (hypothesis).** `repairMoneyFields` was built around *rows in a list* — it takes `rows`,
`entity`, an id and a name, and the `DataRepair` record is shaped around those. The store's own money
fields have no row, no id and no name, so they were never a candidate for the helper, and the field
inventory at `:246` was written as a map keyed by *entity*, which structurally cannot hold them. The
docblock at `:211-221` claims the inventory is *"EVERY money field this module can repair, declared once"*
— true of the helper, and read as true of the module.

⚠️ **One assertion in the tree comes close and cannot reach it.**
`apps/rn/src/data/legacyBridge/migrateFromLegacy.test.ts:187` is
`assert(typeof typed.cushionFloor === 'number', 'cushionFloor got its default')` — but it runs over the
**WebKit** door, and a v1.6 store has no `cushionFloor` key at all, so the assertion only ever exercises
the absent case. The door that can carry a bad one is the import/restore door, which has no equivalent row.

**Remedy — UNVERIFIED.** Do **not** route `cushionFloor` through `readMoney` as-is: `readMoney` returns
`0` for anything unreadable, and `0` is a *floor of zero*, which is the fail-silent direction the
`priorityPerPaycheck` block at `:330-354` already documents as the mistake. A repaired `cushionFloor`
almost certainly wants the default `200`, and `leanAmount` almost certainly wants `0` **plus**
`incomeVaries: false`, since a lean floor of 0 with `incomeVaries: true` is a different broken state.
Each needs its own decision; the shared part is that a repair must be **recorded** so the card speaks.

---

### B3-1b — the same class, the rest of its members (measured)

`cushionFloor` / `leanAmount` / `typicalAmount` are not the whole class. Every money field that hangs off
`DebtStore` rather than off one of the four repaired lists takes the same path (`migrations.ts:456-458`,
`{ ...base, ...r }`). Measured on one blob, `runMigrations` output verbatim:

```
raw.windfall                       = 'lots'        -> windfall: "lots"
raw.expenseReserve.balance         = '1,500'       -> expenseReserve.balance: "1,500"
raw.expenseReserve.contribution.amount = null      -> contribution.amount: null
raw.cycleTopUp.amount              = 'x'           -> cycleTopUp.amount: "x"
raw.cycleTopUp.entries[0].amount   = null          -> entries[0].amount: null
raw.pendingReserveRelease.covered  = 'abc'         -> pendingReserveRelease.covered: "abc"
raw.dismissedLeanSuggestion        = 'nope'        -> dismissedLeanSuggestion: "nope"
raw.milestoneMaxProgress           = 'not-an-object' -> milestoneMaxProgress: "not-an-object"

dataRepairs: 0   pendingDataRepairs: 0
```

`expenseReserve.balance` is the worst of these because it is **written back**, not merely read:
`apps/rn/src/store/selectors.ts:156` is `Math.max(0, store.expenseReserve?.balance ?? 0)` — `??` does not
fire on `'1,500'`, so the pot selector is `NaN`; `apps/rn/src/store/payday.ts:213` then computes the next
cycle's balance as `round(Math.max(0, (prior?.balance ?? 0) - drawn + held))` and persists the result.
Hypothesis, traced by reading and **not executed**: one rollover converts the unreadable balance into a
stored `NaN`, which `JSON.stringify` writes to disk as `null` — at which point the reserve is permanently
gone and the money formatters render the loss as a confident `$0`.

### B3-1c — the instrument built to prove "a restore cannot corrupt the user's money" is asserted SHUT against this class

- **Origin:** `apps/rn/src/data/migrationAudit/hostile.test.ts` / `.../audit.test.ts` / `.../invariants.ts` — `instrument` / `neighbour`.
- **Severity:** **major** (an instrument reporting green while doing less than it claims).

Invariant ③ is *"money and dates keep their type"*, and `invariants.ts:71-74` states the question it
settles: *"`runMigrations` performs NO type validation — it merges `...r` wholesale — so nothing
structurally prevents a string `balance` from reaching an engine that does arithmetic on it … the question
this settles is whether anything ENFORCES that at the boundary."*

`audit.test.ts:453-478` then asserts the invariant's field lists agree with `REPAIRABLE_MONEY_FIELDS` **in
both directions**, and the second direction is a control that forbids growth:

```
const stray = [...MONEY_FIELDS, ...GOAL_MONEY_FIELDS].filter((f) => !declaredAnywhere.has(f));
if (stray.length) throw new Error(`FAIL [⭐ B5-12 control — invariant ③ checks nothing the inventory does not declare]`)
```

So adding `cushionFloor`, `leanAmount`, `typicalAmount`, `windfall` or `expenseReserve.balance` to the
invariant **reds the control**, because `REPAIRABLE_MONEY_FIELDS` does not declare them. The instrument is
pinned, by assertion, to exactly the fields `repairMoneyFields` already coerces — which is the one set on
which invariant ③ can never fail (`invariants.ts:90-92` says so itself: *"No live defect today …
`repairMoneyFields` coerces every declared field through `readMoney`, so no non-number survives to be
caught"*).

**And no input the harness runs carries one.** Measured over the fixtures:

- `apps/rn/src/data/migrationAudit/__fixtures__/hostile-v16-cases.json` — 32 cases, all **v1.6-shaped**;
  v1.6 has no `cushionFloor`, `leanAmount`, `typicalAmount` or `expenseReserve`, so the corpus cannot
  produce one. (`windfall` appears once, and no invariant looks at it.)
- `docs/cutover/v17-envelope.json` — the ONLY v1.7-shaped fixture, i.e. the only one whose door could carry
  these fields. Its `store` keys are `cycleHistory, debts, goals, livingExpenses, paycheck, payoffStrategy,
  prefs, requiredExpenses, storeVersion` — **every store-level money field is absent**, and its `paycheck`
  carries no `leanAmount`/`typicalAmount`/`incomeVaries` either. `cutoverFiles.test.ts:116-123` asserts
  three things about it, one of which is `paycheck.amount === '3247'`.

**Hypothesis.** The control was written to answer `D4-4` — a checker derived from the list it checks — and
it is correct about that risk. What it also did, unintentionally, is make `REPAIRABLE_MONEY_FIELDS` the
*definition* of "the user's money" for the whole audit harness, at which point a money field that is not a
row field cannot be audited without failing a gate. **Reading found this; the harness structurally could
not.**

**Remedy — UNVERIFIED.** The two questions want separating: *"is every declared repairable field checked"*
(the current mutual assertion, keep it) and *"is every money field on the persisted schema either repaired
or checked"* (absent — it needs an inventory of store-level money, which nothing in the tree has).

---

## B3-2 — an unreadable export timestamp renders as **"Saved recently."** on the screen before an irreversible restore

- **Origin:** `apps/rn/src/data/formatBackupTime.ts` — `neighbour`; consumers `apps/rn/src/data/readBackup.ts`
  (`off-surface`) and `apps/rn/src/components/more/CloudBackupSheet.tsx`.
- **Severity:** **blocker** (a positive false statement, one line above *Replace my data · It can't be undone*).

**User-facing consequence.** A backup file whose `exportedAt` this build cannot parse is described as
*"This backup has 1 debt, 0 expenses and 0 goals. **Saved recently.**"* A backup from 2019 and a backup
from an hour ago produce the same sentence, and the whole reason `exportedAt` was plumbed through
(`readBackup.ts:39-48`, `B-J2-2`) was that *"the counts read identically for a backup made this morning
and one made in March."* On the iCloud sheet the same fallback reads *"Last backed up recently"*
(`CloudBackupSheet.tsx:110`) and *"A backup from recently is in iCloud"* (`:108`).

**File and line.** `apps/rn/src/data/formatBackupTime.ts:16` — `if (Number.isNaN(at.getTime())) return 'recently';`

**The measurement.** `formatBackupTime` called directly, and `describeBackup` over a real envelope:

```
"banana"                   -> "recently"
"2026-13-45"               -> "recently"
""                         -> "recently"
"Invalid Date"             -> "recently"
"0"                        -> "1/1/2000 at 12:00 AM"     ← a precise, confident, wrong date
"2019-03-04T10:00:00.000Z" -> "3/4/2019 at 5:00 AM"      ← control, unchanged

envelope with exportedAt:"banana"
  readBackup → ok:true, exportedAt:"banana"
  describeBackup → "This backup has 1 debt, 0 expenses and 0 goals. Saved recently."
control, exportedAt:"2019-03-04T10:00:00.000Z"
  describeBackup → "…  Saved 3/4/2019 at 5:00 AM."
```

The `"0"` row is a second member of the same class and is worse than the first: `new Date("0")` is a
**valid** Date (1 Jan 2000), so the guard does not fire at all and the screen prints a specific date the
file never carried.

**Mechanism (hypothesis).** The function has one return type — a string a sentence is built around — so
the unparseable case had to become *some* string, and `'recently'` was chosen to read naturally inside
*"Last backed up ___"*. The choice is safe for the iCloud sheet's own timestamp, which this app wrote and
which cannot be arbitrary; it became unsafe when `readBackup` reused the same helper for a value that
arrives from **a file the user found somewhere**. `readBackup.ts:45-47` states the correct rule for
exactly this case — *"absent means absent … inventing one would be a claim about a file nothing knows
anything about, on the screen where being wrong is least recoverable"* — and enforces it only for a
**missing** `exportedAt` (`:322`, `...(exportedAt ? { exportedAt } : {})`), not for an unreadable one.
`parseBackupValue` (`backup.ts:198`) passes any string through unchecked.

**Why nothing caught it.** `apps/rn/src/data/readBackup.test.ts` has **three** `exportedAt` blocks
(`:302-333`) and they cover exactly two members of the class: *present and valid* (`:306-309`, asserts the
year reaches the sentence) and *absent* (`:327-332`, asserts *"the sentence does not invent one"* — and its
own comment says **"Inventing 'recently' here would be a statement about a file we know nothing about, on
the screen where being wrong is least recoverable"**). The third member — *present and unreadable* — has no
fixture, and it is the member on which the code does the thing that comment forbids. This is pass 5's
`C4-5` shape: the test picked the arity where the behaviour is right.

**Remedy — UNVERIFIED.** The shape that matches the module's own rule is for `formatBackupTime` to return
`null` for an unparseable instant and for each caller to omit its clause — which is already what
`readBackup.ts:151` does for an absent value. ⚠️ Not verified, and `CloudBackupSheet` has two call sites
whose sentences (`"A backup from … is in iCloud"`) do not survive an omitted fragment unchanged; the
iCloud sheet needs its own wording decision, not the same `null`.

---

## B3-3 — pass 5's `B5-11` fix reached the backup path and not `getCloudBackupStatus`, so the iCloud sheet still tells a signed-in user to sign in — and hides the restore door

- **Origin:** `apps/rn/src/storage/cloudBackup/service.ts` — `fix-churn` (this is the file `B5-11` rewrote).
- **Severity:** **blocker** (the only route back to the user's backup disappears, with a sentence naming an
  action they have already taken).

**User-facing consequence.** iCloud is reachable, the user is signed in, the backup file exists, and its
`mtimeMs` cannot be read. More → iCloud backup renders the dead-end branch:
*"Sign in to iCloud on this device to back up your plan."* The toggle, **Back up now**, the conflict fork
and **Restore from iCloud** are all inside the `else`, so the entire feature — including the only way to
get the plan back — is gone, permanently, for as long as the mtime stays unreadable.

**File and line.**
- `apps/rn/src/storage/cloudBackup/service.ts:241-250` — `getCloudBackupStatus` wraps `stat()` in a
  `catch` that returns `{ available: false, lastBackupAt: null }`.
- `apps/rn/src/hooks/use-cloud-backup.ts:100` — `setStatus(next.available ? 'ready' : 'unavailable')`.
- `apps/rn/src/components/more/CloudBackupSheet.tsx:77-82` — `status === 'unavailable'` renders the
  sign-in text and nothing else.
- The sibling that WAS fixed: `service.ts:41` / `:179` — `backupToCloudGuarded` returns
  `'remote-unreadable'` for this identical condition, and `cloudBackupMessages.ts:71` gives it its own
  honest sentence.

**The measurement.** Real modules, one fake provider — `isAvailable() → true`, `stat()` raising the
throw `provider.ts:37-42` is written to raise:

```
metadataFromMtime(null)  -> throws "cloud-backup: the file exists but its mtimeMs is unusable (null)"
getCloudBackupStatus     -> { "available": false, "lastBackupAt": null }
  → hook maps to status  -> "unavailable"      → sheet: "Sign in to iCloud on this device…"
backupToCloudGuarded     -> { "ok": false, "reason": "remote-unreadable" }
  → cloudBackupMessage   -> "iCloud isn't reporting when this backup was last written, so it wasn't
                             replaced. Your data is safe — try again later."
```

Two functions in one file, one condition, opposite honesty.

**⛔ AND THE INSTRUMENT PINS THE OLD ANSWER.** `apps/rn/src/storage/cloudBackup/service.test.ts:176-204`
builds a provider whose `isAvailable()` returns **`true`** and whose `stat()` throws, and asserts:

```
eq(status.available, false, 'a throwing stat degrades to unavailable rather than crashing the row');
```

One hundred and forty lines later (`:310-343`) **the same fixture shape** carries the `B5-11` correction —
*"This fixture's own note says it: `isAvailable()` stays true, so the user IS signed in. `'unavailable'` is
rendered by `cloudBackupMessages` as 'Sign in to iCloud on this device to use backup.' — an instruction to
do the one thing they have already done"*. So one file holds both the corrected assertion and the
uncorrected one, over the same condition, and **fixing `getCloudBackupStatus` reds `:203`**.

`apps/rn/src/data/cloudBackupMessages.test.ts:156-169` — the whole of the `B5-11` regression block — asserts
only on `cloudBackupMessage`, never on the status path or the sheet's `status === 'unavailable'` branch.

**Mechanism (hypothesis).** `B5-11` was reported against the *backup* outcome, and the fix was made where
the finding pointed: a new `GuardedBackupOutcome` member plus a message for it. `getCloudBackupStatus` has
a different return type (`CloudBackupStatus`, a two-field boolean record) with **no third state to move
into**, so it could not have received the same fix without a type change — which is the structural reason
this member of the class was skipped rather than an oversight. `provider.ts:20-35` deliberately made
`metadataFromMtime` **throw** rather than return `null`, precisely so the condition would be visible; the
status path converts that throw straight back into the indistinguishable boolean the throw existed to
avoid.

**Remedy — UNVERIFIED.** `CloudBackupStatus.available` needs a third state (e.g.
`available: boolean; unreadable: boolean`, or a tagged union) so `CloudBackupUiStatus` can carry a
`'ready-unreadable'` that shows the controls and the honest sentence together. ⚠️ Untested, and the
direction matters: the user in this state must still be able to reach **Restore**, which is the operation
that does not need an mtime at all — but `use-cloud-backup.ts:109-112`'s `catch` also sets
`'unavailable'`, so a fix to `getCloudBackupStatus` alone leaves a second producer of the same dead end.

---

## B3-4 — the forward-incompatibility refusal reads the ENVELOPE's `storeVersion`, so a payload that contradicts it is accepted and re-stamped

- **Origin:** `apps/rn/src/data/backup.ts` — `neighbour`.
- **Severity:** **minor** (the guard has a hole in one direction; no producer in the app writes it, so the
  reachable door is a hand-edited or third-party file).

**User-facing consequence.** A backup whose payload declares a store version this build cannot read is
accepted, migrated onto current defaults and **re-stamped as version 7**, so the restore appears to
succeed. That is the outcome `parseBackup`'s own docblock (`backup.ts:139-144`) exists to prevent:
*"a future store would be silently stripped of whatever this build does not know about — and the user would
be looking at a restore that appeared to succeed."*

**File and line.** `apps/rn/src/data/backup.ts:181-190`:

```ts
const storeVersion =
  typeof env.storeVersion === 'number' ? env.storeVersion
  : typeof (env.store as Partial<DebtStore>).storeVersion === 'number' ? (env.store as DebtStore).storeVersion
  : CURRENT_STORE_VERSION;
if (storeVersion > CURRENT_STORE_VERSION) return { ok: false, reason: 'too-new', message: TOO_NEW };
```

The payload's copy is a **fallback**, consulted only when the envelope omits its own.

**The measurement.** `parseBackup` over four envelopes, `CURRENT_STORE_VERSION = 7`:

```
envelope 8, payload 7                     -> refused  too-new     ← the direction backup.test.ts:153-165 covers
envelope absent, payload 8                -> refused  too-new     ← the direction backup.test.ts:167-178 covers
envelope 7, payload 8                     -> ACCEPTED (storeVersion read as 7)   ← untested, unguarded
formatVersion 0                           -> ACCEPTED
formatVersion -5                          -> ACCEPTED

readBackup(envelope 7, payload 8, aFutureField: 42)
  -> ok, stamped storeVersion=7, aFutureField=42
```

**Mechanism (hypothesis).** The fallback was added for the *deletion* attack — the comment says so:
*"so a hand-edited file can't slip a future store past the check by deleting one field"* — and deletion is
the case the test covers. Contradiction is a different attack on the same field and the precedence
answers it the wrong way round: the guard trusts the wrapper while `runMigrations` operates on the
payload, so **the value that is checked and the value that is used are not the same value**. The two
`formatVersion` rows are the same shape one field over: the check is `> BACKUP_FORMAT_VERSION` only, so
`0` and `-5` are treated as readable envelope versions.

**Remedy — UNVERIFIED.** Taking `Math.max` of the two, or refusing when they disagree at all, both close
it; which is right depends on whether a legitimate future build could ever write them differently, which
this lane did not establish. ⚠️ Do **not** simply prefer the payload's copy — that reintroduces the
deletion hole `backup.test.ts:167-178` pins.

---

## B3-5 — the pre-overwrite sentence names the paycheck, debts, expenses and goals, and never the cash the app is holding

- **Origin:** `apps/rn/src/data/readBackup.ts` (`off-surface`) and `apps/rn/src/data/backup.ts` (`neighbour`).
- **Severity:** **major** (true but materially incomplete, on the screen where being incomplete is
  irreversible). Same class as `B3-1`: store-level money is invisible to this module's machinery.

**User-facing consequence.** A user with **$1,500 held in the expense reserve**, a **$300 windfall** on
this cycle and an **$80 cycle top-up** drawn out of a goal restores a backup, and the last sentence they
read before **Replace my data · It can't be undone** is:

> This backup has 1 debt, 0 expenses and 0 goals. Saved 8/19/2026 at 8:00 AM.
> **This replaces the paycheck and 1 debt you have already entered on this device.**

After the restore all three are `undefined`. `expenseReserve.balance` is the one that matters: it is cash
the app told them it was setting aside for their recurring bills, its own type doc says *"`balance`
deliberately does NOT clear at rollover — carrying across cycles IS the feature … a cleared pot would be
money the app took and never gave back"* (`models.ts:483-486`), and `selectors.ts:156`
(`Math.max(0, store.expenseReserve?.balance ?? 0)`) reads it as `0` from the next render on.

**File and line.**
- `apps/rn/src/data/readBackup.ts:205-236` — `describeLocalOverwrite` builds its list from
  `paycheck.amount`, `debts`, `requiredExpenses + livingExpenses`, `goals`. Nothing else.
- `apps/rn/src/data/backup.ts:115-122` — `describeStoreContents`, the incoming half, counts the same
  three lists.

**The measurement.** Real modules, one local store and one envelope:

```
local: paycheck '2000' · 1 debt · expenseReserve.balance 1500 (+220 contribution)
       · windfall 300 · cycleTopUp.amount 80 · 3 cycleHistory rows

describeLocalOverwrite -> " This replaces the paycheck and 1 debt you have already entered on this device."
describeBackup         -> "This backup has 1 debt, 0 expenses and 0 goals. Saved 8/19/2026 at 8:00 AM."
incoming expenseReserve = undefined   windfall = undefined
```

**Mechanism (hypothesis).** `describeLocalOverwrite`'s docblock states the rule it followed — *"Names only
what is actually there … the sentence is a list of what the user stands to lose"* — and then enumerates
the four things a person would name if asked to picture their plan. `expenseReserve` post-dates it (3.8),
is not an entity list, has no name and no count, and so did not present itself as a thing to enumerate.
This is the enumeration class the repo has measured repeatedly: the list was written from what the author
could picture, and it has no relationship to the schema that would make it grow.

**Remedy — UNVERIFIED.** Adding a clause is the obvious move and the wrong first step: the function's own
control (`readBackup.test.ts:463`, *"nothing the user does not have"*) means every new clause must stay
silent at zero, and `windfall` / `cycleTopUp` are cycle-keyed and arguably not losses at all. What is
actually missing is the same thing `B3-1` is missing — a single declaration of *what money lives on the
store outside the four lists* — after which both this sentence and the repair pass can be derived from it
rather than hand-listed. ⚠️ Not verified, and the wording for a pot with no name needs a decision
(*"the $1,500 you've set aside"* discloses an amount on a screen `backup.ts:112` deliberately keeps
money-free).

---

## Non-findings — controls run, no defect

Recorded because a "not caught" over something the checker never reads looks exactly like a finding.

- **`createAdapter.ts`'s MMKV API.** `mmkv.remove(key)` / `getAllKeys()` / `getString` / `set` all match
  the installed `react-native-mmkv@4.3.2` (`lib/specs/MMKV.nitro.d.ts:78,84`). No defect.
- **`scrubBreadcrumb`'s two-member category set.** Checked against the installed
  `@sentry/react-native@8.18.0`: `dist/js/touchevents.js:15` is
  `const DEFAULT_BREADCRUMB_CATEGORY = 'touch'`, and the only other categories the SDK emits are
  `deeplink`, `navigation`, `navigation.dispatch`. The enumeration holds for this version.
- **`describeLocalOverwrite`'s call in `_layout.tsx` is pinned.** I expected a hole because
  `check-restore-doors.ts:55`'s `OWNERS` regex names only `describeBackup|describeRestorePreview`. It is
  covered by a different instrument: `scripts/finding-guards.json:713` carries the exact two-line token
  including `describeLocalOverwrite(appStore.getState().store)`.
- **Numeric v1.6 pay-day fields.** `readBackup.test.ts:114` pins `monthlyPayDay === 12` (a **number**)
  while `PaycheckConfig` types it `string`. Every consumer coerces —
  `forecastCycles.ts:34-36`, `payday.ts:148-150`, `paycheckForm.ts:103-105`, `sandboxScenarios.ts:267-269`
  all wrap it in `Number(...)`, and `getNextPaycheckDate` declares `number`. A type violation with no
  reachable behavioural consequence.
- **`migrations.test.ts`'s hand-written `REQUIRED`/`OPTIONAL` lists.** They duplicate
  `REPAIRABLE_MONEY_FIELDS`, which looked like the enumeration class — but
  `audit.test.ts:453-478` and `trustSelectors.test.ts:255` both assert agreement with the declared
  inventory, so a field added there cannot go unchecked.
