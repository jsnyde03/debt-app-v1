# S1 money pass 7 — lane B3 findings

**Subject:** storage, backup, formatting and dates — how the number is spelled and persisted.
**Manifest:** 64 files / 9.2k lines. Findings written incrementally.

## B3-1 — `blocker` · the pass-6 shape guard admits two more spellings of the same defect: an impossible calendar date, and a date-only stamp rendered as the PREVIOUS day

**Origin:** `apps/rn/src/data/formatBackupTime.ts` — `off-surface` (its consumer `readBackup.ts` is `off-surface`, `cloudBackupMessages.ts` is `off-surface`). Registered guard `S1P6-B3-2-UNREADABLE-STAMP`.

**User-facing consequence.** On the sheet that stands between a live portfolio and an irreversible
overwrite, the app prints a **specific, confident date and time that the file never carried**. A v1.6
file stamped `exportedAt: "2026-08-19"` is announced as *"Saved 8/18/2026 at 8:00 PM."* — the wrong
calendar day plus an invented clock time. A file stamped with a date that **does not exist**
(`"2026-02-30"`) is announced as *"Saved 3/1/2026 at 7:00 PM."* The user's only signal for *"is this
the backup I think it is"* is wrong, one line above **Replace my data · It can't be undone**.

**File and line.** `apps/rn/src/data/formatBackupTime.ts:31–37`
```
const ISO_DATE_HEAD = /^\d{4}-\d{2}-\d{2}(?:[T ]|$)/;
...
  if (!ISO_DATE_HEAD.test(iso)) return null;
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
```
Consumed at `apps/rn/src/data/readBackup.ts:155` (`describeBackup`) and
`apps/rn/src/components/more/CloudBackupSheet.tsx:113`.

**The measurement.** One store (`createDefaultStore()`), one variable (`envelope.exportedAt`), run
end-to-end through the real `readBackup` → `describeBackup` on `v1.7-dev` @ `e5ecc7b6`
(`npx tsx --tsconfig apps/rn/tsconfig.json`, `TZ = America/New_York`, exit 0):

```
"banana"                     -> "This backup has 0 debts, 0 expenses and 0 goals."
"2026-13-45"                 -> "This backup has 0 debts, 0 expenses and 0 goals."
""                           -> "This backup has 0 debts, 0 expenses and 0 goals."
"Invalid Date"               -> "This backup has 0 debts, 0 expenses and 0 goals."
"0"                          -> "This backup has 0 debts, 0 expenses and 0 goals."
"2026-08-19"                 -> "... Saved 8/18/2026 at 8:00 PM."      <- WRONG DAY + invented time
"2026-02-30"                 -> "... Saved 3/1/2026 at 7:00 PM."       <- a date that does not exist
"2026-04-31"                 -> "... Saved 4/30/2026 at 8:00 PM."      <- a date that does not exist
"1970-01-01"                 -> "... Saved 12/31/1969 at 7:00 PM."     <- wrong YEAR, wrong decade
"2019-03-04T10:00:00.000Z"   -> "... Saved 3/4/2019 at 5:00 AM."       (control: valid, correct)
```

The first five are exactly the five junk values `readBackup.test.ts:352` pins; all five pass. The four
that follow are siblings the test never asks about, and **all four print a date**.

`formatBackupTime` measured in isolation across the same values reproduces it identically, so the
mechanism is in the formatter, not in the caller.

**Mechanism — HYPOTHESIS.** The guard's own registry text
(`scripts/finding-guards.json` → `S1P6-B3-2-UNREADABLE-STAMP`) states the rule correctly: *"THE CHECK IS
ON THE STRING'S SHAPE, NOT ON WHETHER Date ACCEPTED IT: `new Date("0")` is a VALID Date … so a NaN-only
guard never fires and the screen prints a specific confident date the file never carried."* The **rule**
generalises; the **regex written for it** does not. Two things it does not check:

1. `(?:[T ]|$)` accepts a bare `YYYY-MM-DD`. ECMA-262 parses a date-only ISO form as **UTC midnight**,
   while `toLocaleDateString`/`toLocaleTimeString` render in **local** time — so at any negative UTC
   offset (the entire US audience the `en-US` formatting elsewhere is written for) the rendered day is
   the day *before* the one in the file, with a fabricated evening time attached.
2. `\d{2}-\d{2}` accepts month 02 day 30 and month 04 day 31. `new Date` **rolls those over** rather than
   rejecting them, so `Number.isNaN` never fires — the identical failure shape as `new Date("0")`, one
   spelling further on. This is `ITERATE THE CLASS, NEVER THE MEMBER YOU FOUND`: the fix reached the
   reported spelling and left siblings on the same store field.

Reachability of each spelling is real, not hypothetical: `detectBackupFormat.ts:44` admits **any**
string as a v1.6 `exportedAt`, and `backup.ts:212` admits **any** string as an envelope `exportedAt`.
The module's own docblock (`formatBackupTime.ts:20–21`) records that this field *"arrives from a file
the user found somewhere"*.

**Remedy — UNVERIFIED.** Require a time component (`/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/`) so a date-only
stamp takes the honest `null` path rather than a fabricated evening, **and** round-trip the parse —
compare `at.toISOString().slice(0,10)` against the string's own first ten characters, so a rolled-over
`2026-02-30` disagrees with itself and returns `null`. Not verified: the round-trip comparison is itself
UTC-based and I have not measured whether it mis-rejects a legitimate offset-bearing stamp such as
`2026-08-19T23:30:00-07:00`. Do not apply either half without planting all four values above.

**Bound, measured.** The **iCloud** door is NOT affected. `provider.ts:37 metadataFromMtime` builds
`modifiedAt` with `new Date(mtimeMs).toISOString()` and throws on any non-positive/non-finite `mtimeMs`,
so `cloudBackupStatusLine`'s `lastBackupAt`/`unclaimedRemoteAt` can only ever carry a full ISO instant.
The reachable surface is the **file/clipboard import** door (`describeBackup`), where the string is
whatever the file says.

---

## B3-2 — `blocker` · one `stat` failure AFTER the write records our clock as the file's identity, and every later automatic backup is then refused as a foreign clobber

**Origin:** `apps/rn/src/storage/cloudBackup/service.ts` — **`fix-churn`**.

**User-facing consequence.** Automatic iCloud backup **silently stops**, and the sheet then tells the
user *"iCloud already has a backup that this device hasn't seen. Choose which copy to keep."* about a
file **this device wrote minutes earlier**. The user's data safety net is off, and the only sentence the
app offers about it is false.

**File and line.** `apps/rn/src/storage/cloudBackup/service.ts:97–103`
```
const written = await provider.stat().catch((error: unknown) => {
  // A stat failure after a successful write is not a failed backup — the bytes are there. Fall back
  // to the clock and let the next successful stat re-anchor the ledger.
  reportError(...); return null;
});
return { ok: true, at: written?.modifiedAt ?? now.toISOString() };
```
Persisted by `apps/rn/src/hooks/use-cloud-backup.ts:178` and `apps/rn/src/app/_layout.tsx:175`
(`updatePrefs({ cloudBackupRemoteAt: result.at })`); compared with `===` at `service.ts:154`.

**The measurement.** One store (`createDefaultStore()` + `onboardingComplete/cloudBackupEnabled`), one
variable (whether `provider.stat()` throws on the call **immediately after** the write). Real
`backupToCloudGuarded` / `inspectRemote` / `metadataFromMtime`, fake provider, `v1.7-dev` @ `e5ecc7b6`,
exit 0:

```
### CONTROL — stat works after the write
  backup #1 outcome  = {"ok":true,"at":"2026-09-02T12:00:00.000Z"}
  cloudBackupRemoteAt= "2026-09-02T12:00:00.000Z"
  file real mtime    = "2026-09-02T12:00:00.000Z"
  inspectRemote      = {"state":"ours","at":"2026-09-02T12:00:00.000Z"}
  backup #2 outcome  = {"ok":true,...}          writes = 2

### stat THROWS once, immediately after the write
  backup #1 outcome  = {"ok":true,"at":"2026-09-02T12:00:03.456Z"}   <- OUR CLOCK
  cloudBackupRemoteAt= "2026-09-02T12:00:03.456Z"
  file real mtime    = "2026-09-02T12:00:00.000Z"
  inspectRemote      = {"state":"unclaimed",...}                     <- our own file, disowned
  backup #2 outcome  = {"ok":false,"reason":"remote-unclaimed",...}  writes = 1
```

**Mechanism — HYPOTHESIS.** `service.ts:82–86` states the rule: *"recording a local timestamp here would
make this install fail to recognise its own backup and refuse every subsequent one"*, and `:179–182`
names the outcome — *"the install then bricks its own backup"*. The refusal built for it
(`backupToCloudGuarded:202`, `unknown` → `remote-unreadable`) sits **before** the write. The identical
poisoning is reachable **after** the write, on a path that deliberately swallows the same throw. The
guard reached the reported spelling and left the sibling — the `ITERATE THE CLASS` law.

The `.catch`'s own comment — *"let the next successful stat re-anchor the ledger"* — is a **carried
premise and it is false**. `grep cloudBackupRemoteAt` over `apps/rn/src` + `packages` returns exactly
three writers: `_layout.tsx:175` and `use-cloud-backup.ts:178` (after a **backup**), and
`_layout.tsx:250` / `DataResetScreen.tsx:112` / `use-cloud-backup.ts:255` (after a **restore**).
`inspectRemote`'s successful stat writes nothing. So the one event that could re-anchor is a successful
backup, and a poisoned ledger is exactly what `backupToCloudGuarded` now refuses. Nothing re-anchors.

**Bound, stated honestly.** Recoverable — the sheet's conflict fork routes to the unguarded
`backupToCloud` (`use-cloud-backup.ts:172`), whose post-write stat can succeed and re-anchor. So this
is a silent automatic-backup shutdown plus a false conflict claim, **not** data loss. I did not measure
how often iCloud returns an unusable `mtimeMs` on the stat immediately following a write;
`service.ts:184–186` asserts the state is *"reachable by construction, not by accident"*.

**Remedy — UNVERIFIED.** Do not persist a clock value into a field whose contract is *"the file's mtime
at the moment we last saw it"*: return the ledger stamp as nullable (`at: string | null`) and have the
callers skip `updatePrefs` when it is `null`, matching what `_layout.tsx:250` and
`use-cloud-backup.ts:255` already do on the restore path (`if (result.at !== null)`). Not verified: an
absent claim makes the **next** `inspectRemote` say `unclaimed` rather than `ours`
(`service.ts:154`, `claimedAt != null`), so the remedy trades a permanent silent refusal for one
user-visible conflict prompt — that trade needs Jason, and the alternative (leaving the previous claim
in place) has not been measured against the two-device case at all.

**The premise this contradicts, found after the measurement.**
`apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts:103–104` states:
*"⚠️ **The stat-after-write path catches it too and falls back to our clock — the safe direction, and the
next inspect reads `unknown`, which the guard REFUSES.**"* — and `:106–119` (pass-4 `F-B1`'s own
correction) reasons the same way: *"`inspectRemote` never reaches the `unclaimed` branch: `provider.stat()`
**throws**, and that function's own `catch` returns `unknown` first."*

That is true only while the failure is **permanent**. For the transient case — an iCloud file whose
`mtimeMs` has not materialised at the moment of the post-write stat and is readable a minute later, which
is the one `createCloudBackupProvider.ios.ts:31–37` says the whole `readWithDownload` retry loop exists
for — the next inspect reaches `unclaimed`, which is what my measurement above prints. Two passes have now
corrected this docblock (`F-B1` rewrote it saying *"Only the mechanism was wrong"*) and both corrections
assumed the permanent case. ⚠️ Its duplicate at `provider.ts:20–35` makes no such claim and is accurate —
the same *"a docblock is a carried premise"* note that file itself carries at `:121–123`.

---

## B3-3 — `major` · the test block titled "THE REGRESSION THAT WOULD MAKE THE GUARD BLOCK EVERYTHING" asserts only the branch where `stat` succeeds, and never the outcome it names

**Origin:** `apps/rn/src/storage/cloudBackup/service.test.ts` — **`fix-churn`** (also an `instrument`).

**User-facing consequence.** The suite that owns the clobber guard is green over the live defect in
`B3-2`. A reader of `test:app`'s green — including a triage pass scheduling `B3-2` — is told this
regression is covered when the only branch exercised is the one that cannot produce it.

**File and line.** `apps/rn/src/storage/cloudBackup/service.test.ts:418–444`
```
// 4. ⛔ THE REGRESSION THAT WOULD MAKE THE GUARD BLOCK EVERYTHING. `backupToCloud` must report the
//    file's OBSERVED mtime, not the clock it was handed — otherwise the claim it records never
//    matches the next `stat()`, every later backup is refused as a foreign clobber, and the feature
//    silently stops working for the users who turned it on.
...
assert(first.at !== AT.toISOString(), '⛔ `at` is NOT the clock it was given');
eq(first.at, state.modifiedAt, 'it is the mtime the file actually has');
```
The fixture is `clockedProvider` (`:87–129`), whose `stat()` **cannot fail** — it returns
`modifiedAt === null ? null : { modifiedAt }` and nothing else.

**The measurement — with the control run first, as required.**

1. **Baseline**, `v1.7-dev` @ `e5ecc7b6`, tree clean: `npm run test:app` → **exit 0**,
   `✅ App-layer regression tests: ALL PASSED.`
2. **Control plant** — proving the checker can SEE the subject. One line, `service.ts:103`:
   `at: written?.modifiedAt ?? now.toISOString()` → `at: now.toISOString()`.
   `npm run test:app` → **exit 1**,
   `❌ App-layer regression run failed: Error: cloudBackup service: ⛔ \`at\` is NOT the clock it was given`.
   **So the suite does see `backupToCloud`'s `at`.**
3. **Restore verified**: `cp` from the pre-plant copy, then `cmp` → **exit 0**; `git status --porcelain`
   on the file → **empty**. Re-run `npm run test:app` → **exit 0** (the restore actually restored, and
   the command is not red unconditionally).
4. **The gap**: no fixture anywhere in this file makes `stat()` throw *after* a write. `clockedProvider`
   cannot; `fakeProvider` (`:48–78`) cannot; the `exploding` provider (`:177–193`) throws on `write` too,
   so it never reaches line 97. Under that condition the real module produces exactly the outcome this
   block's title names — measured in `B3-2`: `cloudBackupRemoteAt = "…12:00:03.456Z"` (our clock) against
   a file mtime of `"…12:00:00.000Z"`, `inspectRemote → unclaimed`, next guarded backup
   `remote-unclaimed`, `writes = 1` — **and this suite stays green.**

**Mechanism — HYPOTHESIS.** The block asserts the *value on the happy path* (`at` is the observed mtime
when stat works) and treats that as coverage of the *outcome* stated in its own title (the ledger never
matches, the feature silently stops). Those are different claims. `service.ts:97`'s deliberate
`.catch(… ) => null` is the second producer of the same clock value, and it is invisible to a fixture
set in which stat never fails after a write.

**Remedy — UNVERIFIED.** Add a fixture whose `stat()` throws on the call following `write()`, and assert
the **outcome** rather than the value: after backup #1, `inspectRemote(provider, first.at).state === 'ours'`
and backup #2 succeeds. Not verified against `check-destructive-writes` or the `prove:guards` registry —
this block carries no registered guard id, so I have not measured whether adding one is required for the
fix to be recorded as closed.

---

## B3-4 — `major` · `prove:guards` prints "lint:finding-guards reds" after every recording, and the same file states the opposite thirty lines above — measured green

**Origin:** `scripts/prove-guards.ts` — **`instrument`**.

**User-facing consequence.** A session that runs the command the brief itself mandates
(`npm run prove:guards -- --id=<ID>`) is told a gate is now red and that it must edit
`check-finding-guards.ts` in the same edit. Neither is true. The likely response — lowering
`MAX_AUTHORED` to satisfy a red that does not exist, or hunting a broken gate — is exactly the
`MAX_AUTHORED` note's own named defect (*"Raising this to make a run pass is the defect this pair exists
to catch"*), reached from the other direction.

**File and line.** `scripts/prove-guards.ts:741–749`
```
if (recorded.length) {
  ...
  console.log(
    `\n  📌 recorded ${recorded.length} execution(s). ${stillAuthored} proof(s) remain never-executed —\n` +
      `     set \`MAX_AUTHORED = ${stillAuthored}\` in scripts/check-finding-guards.ts, in this same edit.\n` +
      '     ⚠️ Until you do, lint:finding-guards reds, and so does every gate that runs it as a control.',
  );
}
```
Contradicted by `scripts/prove-guards.ts:689–694` and `:717–718` in the **same file** — *"`MAX_AUTHORED`
… is a **CEILING** (`authored.length > MAX_AUTHORED`) and deliberately so … `lint:finding-guards` stays
**green**"* — and by `scripts/check-finding-guards.ts:439`, which is `if (authored.length > MAX_AUTHORED)`,
with `MAX_AUTHORED = 10` at `:189`.

**The measurement.** One variable: whether `prove:guards` has just recorded. `v1.7-dev` @ `e5ecc7b6`.

```
1. clean tree      : npm run lint:finding-guards           -> EXIT 0
2. record one guard: npm run prove:guards -- --id=S1P6-B3-2-UNREADABLE-STAMP  -> EXIT 0
   printed:  📌 recorded 1 execution(s). 10 proof(s) remain never-executed —
             set `MAX_AUTHORED = 10` in scripts/check-finding-guards.ts, in this same edit.
             ⚠️ Until you do, lint:finding-guards reds, and so does every gate that runs it as a control.
   git status --porcelain scripts/finding-guards.json ->  M   (the registry WAS rewritten)
3. in that exact state: npm run lint:finding-guards        -> EXIT 0        <- the claim is FALSE
   ✅ finding-guards: 266 of 267 findings carry a standing guard; 1 unguarded (cap 1, downward-only).
      proof: 137 EXECUTED · 7 STALE (cap 8) · 10 authored but never run (cap 10) · ...
4. restore: cp from the pre-run copy, cmp -> exit 0, git status -> clean.
```

**Two defects visible in one printed line.**
1. It told me to set `MAX_AUTHORED = 10`. It is **already 10** (`check-finding-guards.ts:189`), and the
   run drained nothing — all four ids I proved already carried a `measured`, so `newlyMeasured` was 0 and
   `stillAuthored` was unchanged. The `newlyMeasured` correction at `:743–746` computes the right number
   and then the message fires anyway, because the condition is `if (recorded.length)` rather than
   `if (newlyMeasured)`.
2. It claims a red. `lint:finding-guards` exits **0** in that state, and cannot do otherwise: a drain
   lowers `authored.length` and the check is a `>` ceiling.

**Mechanism — HYPOTHESIS.** The docblock at `:727–733` was written when `MAX_AUTHORED` was a
strict-equality ratchet (*"must equal the count of never-executed proofs"*) and survived the change to a
ceiling. The correction was made — twice, at `:689` and `:717` — on the **crash** path, and the
**success** path kept the pre-change wording. This is the class the brief names: *A COMMENT IS A CARRIED
PREMISE AND DECAYS LIKE A CARRIED NUMBER*, one spelling further on than the instance pass-6 already
recorded.

**Also measured, and worth stating separately.** `prove:guards` **records by default** — no `--record`
flag — so the command the brief instructs an auditor to run **mutates a tracked file**
(`scripts/finding-guards.json`, 6 lines across 4 ids on my first batch) against a standing *"leave the
tree clean"* constraint. It also reported `⚠️ this run left 1 other file(s) modified` naming
`docs/audits/2026-09-02-s1-money-pass7/b2-probe5.ts`, which belongs to another lane running concurrently
— so its cleanliness check reads the whole tree and will mis-attribute a sibling lane's work.

**Remedy — UNVERIFIED.** Gate the nudge on `newlyMeasured > 0`, and replace the second line with what the
same file already says correctly at `:717–718` — that the ceiling stays green and this message is the
only notice. Not verified: I have not measured whether any gate *other* than `lint:finding-guards` reads
`authored.length` strictly, which is what the *"and so does every gate that runs it as a control"* half
would need to be true of.

---

## B3-5 — `blocker` · the pass-6 store-money repair declared five fields and its own measurement named a sixth; three store-level money fields still pass through as strings, with ZERO repairs recorded

**Origin:** `apps/rn/src/data/migrations.ts` — **`fix-churn`**; `apps/rn/src/data/models.ts` — **`fix-churn`**.

**User-facing consequence.** After restoring a backup whose `cycleTopUp.amount` or
`expenseReserve.contribution.amount` is a string (a comma-grouped figure, or any hand-edited /
third-party file), the app renders **`$0`** for money the user has actually set aside — and the repairs
card says **nothing**, because no repair is recorded. It is the exact harm `B3-1` was filed for, on the
fields `B3-1` left out. The Undo control for a real top-up also vanishes (`topUpEntries` returns `[]`),
so money that left a goal cannot be handed back.

**File and line.**
- `apps/rn/src/data/migrations.ts:265–271` — `REPAIRABLE_MONEY_FIELDS.plan.optional` declares exactly
  `['cushionFloor', 'leanAmount', 'typicalAmount', 'windfall', 'expenseReserveBalance']`.
- `apps/rn/src/data/migrations.ts:282` — the same fix's own measurement text names **six**:
  *"`cushionFloor: 'abc'`, `paycheck.leanAmount: '1,200'`, `expenseReserve.balance: '1,500'`, `windfall`
  **and `cycleTopUp.amount`** all passed through `{ ...base, ...r }` verbatim"*. `cycleTopUp.amount` is
  not in the list the fix declared.
- Undeclared and undefended: `models.ts:480` `cycleTopUp.amount`, `models.ts:518`
  `expenseReserve.contribution.amount`, `models.ts:487` `pendingReserveRelease.covered`.
- Consumers: `apps/rn/src/store/selectors.ts:166–170` (`Math.max(0, c.amount)`),
  `apps/rn/src/store/topUpSelectors.ts:52–54` (`Math.max(0, store.cycleTopUp.amount)`),
  `apps/rn/src/store/topUpSelectors.ts:26–30` (`rec.amount > 0`).

**The measurement.** One store (`createDefaultStore()`), one variable per field (number → the same
figure as a comma string), real `runMigrations` + real selectors + real `formatCurrency`, `v1.7-dev` @
`e5ecc7b6`, exit 0:

```
AFTER runMigrations:
  cushionFloor                       1200         typeof=number   <- declared, repaired
  windfall                           1300         typeof=number   <- declared, repaired
  paycheck.leanAmount                1400         typeof=number   <- declared, repaired
  paycheck.typicalAmount             1500         typeof=number   <- declared, repaired
  expenseReserve.balance             1600         typeof=number   <- declared, repaired
  expenseReserve.contribution.amount "1,700"      typeof=string   <- NOT declared
  cycleTopUp.amount                  "1,800"      typeof=string   <- NOT declared
  pendingReserveRelease.covered      "1,900"      typeof=string   <- NOT declared
dataRepairs recorded (5): leanAmount · typicalAmount · cushionFloor · windfall · expenseReserveBalance
```
and through the selectors the screens read:
```
dataRepairs recorded: 0   []                       <- the user is told NOTHING failed to read
selectExpenseReservePot          = 1600
selectExpenseReserveContribution = NaN | formatCurrency = $0     <- $1,700 rendered as $0
appliedTopUp                     = NaN | formatCurrency = $0     <- $1,800 rendered as $0
topUpEntries                     = []                            <- the Undo control disappears
CONTROL (numbers): contribution = 1700 | appliedTopUp = 1800
```

**Mechanism — HYPOTHESIS.** `runMigrations` repairs store-level money only through
`readStoreMoney(r, field)` / `readStoreMoney(r.paycheck, …)` / `readStoreMoney(r.expenseReserve, 'balance', …)`
— three hand-written call sites at `migrations.ts:299–303` and `:497–502`, one per declared field. There
is no traversal, so a money field two levels down (`expenseReserve.contribution.amount`) or on a sibling
record (`cycleTopUp.amount`) is invisible to the table by construction. `PLAN_MONEY_LABELS` and
`REPAIRABLE_MONEY_FIELDS.plan` agree with each other, so no consistency check can see the gap — the two
sides of the cross-check are the same list. `formatCurrency`'s non-finite guard (`A5-2`) then converts
the `NaN` into a confident `$0` rather than a visible break.

**Reachability.** Not through `mapLegacyStore` (v1.6 had none of these fields) — through the
**envelope / `raw-v17` restore doors**, which accept an arbitrary user-supplied JSON file;
`readBackup.ts:20` states the premise for exactly this: *"a value that arrives from a file the user found
somewhere"*. Also through any producer that ever wrote a string here.

**Note on the neighbouring deliberate exclusion, so it is not mistaken for this one.**
`readBackup.ts:247` says *"`windfall` and `cycleTopUp` are deliberately NOT here"* — that is about
`describeLocalOverwrite`'s pre-overwrite sentence (a *disclosure* choice) and says nothing about the
repair table. `windfall` IS in the repair table; `cycleTopUp` is in neither.

**Remedy — UNVERIFIED.** Add `cycleTopUp.amount`, `expenseReserve.contribution.amount` and
`pendingReserveRelease.covered` to `REPAIRABLE_MONEY_FIELDS.plan` with labels, and give `readStoreMoney`
the nested call sites. Not verified, and two reasons to check before applying: (1) `migrationAudit`'s
invariant ③ *refuses to check a field this table does not declare* (`migrations.ts:258–262`), so adding
them changes what the audit harness asserts and may red it; (2) `cycleTopUp.amount` is documented as
**derived** (`topUpSelectors.ts:35–38`: *"never written independently … Σ `cycleTopUp` must equal what
actually left the goals"*), so repairing it to `0` while `entries` still holds real draws would break
that invariant in the other direction — the honest repair may be to rebuild it from `entries` rather
than to `readMoney` it.

---

## B3-6 — `minor` · "`lint:money` now exists to keep it at two" is a stale premise in three places — there are three money formatters, and the gate is a shape detector, not a census

**Origin:** `apps/rn/src/utils/format.ts` — **`stale-read`**; `scripts/check-money-format.ts` — `instrument`.

**User-facing consequence.** None directly. The cost is to the next person choosing a formatter:
`format.ts`'s header is the designated place to read *"before adding a third formatter"*, and it states a
population (two) and a guarantee (a gate keeps it there) that are both wrong. Pass 5 already paid for
this once — `formatDisplayAmount` shipped with **no non-finite guard at all** and rendered `"NaN.N"`,
found only because someone probed the class rather than the named function.

**File and line.**
- `apps/rn/src/utils/format.ts:6–8` — *"before adding a third formatter — there were nine, and
  `lint:money` now exists to keep it at two."*
- `scripts/check-money-format.ts:34` — *"The **two** sanctioned formatters own these shapes"*; `:213` —
  *"Use `formatWhole` … or `formatCurrency` …"*, naming two.
- Against `packages/core/utils/formatDisplayAmount.ts:16`, a third live money formatter in `packages/core`,
  and `apps/rn/src/utils/moneyFormatters.test.ts:37–49`, whose `FORMATTERS` table — described as *"Every
  function in the tree that turns a number into money a person reads"* — has **three** rows.

**The measurement (control on the verifier, as required).** `v1.7-dev` @ `e5ecc7b6`.
```
1. clean:  npm run lint:money -> EXIT 0
   ✅ money-format: no hand-rolled currency formatters (4 shapes checked). [read 26071 lines, floor 23983]
2. plant an unmistakable hand-rolled formatter INTO packages/core/utils/formatDisplayAmount.ts:
      export function plantedMoney(n: number): string { return `$${n.toFixed(2)}`; }
   npm run lint:money -> EXIT 1
   ❌ money-format: 1 hand-rolled money formatter(s).
     packages\core\utils\formatDisplayAmount.ts:31  a $-prefixed template interpolation
3. restore: cp from the pre-plant copy, cmp -> exit 0, git status -> clean
4. control after restore: npm run lint:money -> EXIT 0
```
**So the gate reads that file and would red on a `$` shape there.** `formatDisplayAmount` is green not
because it is sanctioned — it is **not** in `EXEMPT` (`check-money-format.ts:38–56`) — but because it
returns `{ dollars, cents }` and never emits a `$`. It is a money formatter the gate's four shapes cannot
see, which is `D5-13` restated: a population defined by a list of names, blind to the member whose name
is not on it.

**Mechanism — HYPOTHESIS.** The header was written at T6.4, when the collapse genuinely landed on two,
and `formatDisplayAmount` was found a phase later (`S1.12.5.3`). The finding was closed by giving that
function a guard and a test row; the sentence that tells the next author how many there are, and what the
gate guarantees, was never revisited. A count in a comment decays like any other carried number.

**Remedy — UNVERIFIED.** Restate the sentence as what the gate actually does — it detects `$`-shaped
hand-rolled formatting in four spellings, and it does not count formatters — and name the three that
exist, or point at `moneyFormatters.test.ts`'s table as the population of record. Not verified: I have
not measured whether `lint:trust-claims` already enforces that table's membership as its own header at
`moneyFormatters.test.ts:16–18` claims, so pointing at it may be pointing at a second stale premise.

---

## B3-7 — `blocker` · the pre-overwrite sentence discloses the BENIGN loss class and is byte-silent about the one `persistence.ts` calls "the real losses"

**Origin:** `apps/rn/src/data/readBackup.ts` — **`off-surface`**; `apps/rn/src/data/legacyBridge/mapLegacyStore.ts` — **`neighbour`**.

**User-facing consequence.** A v1.6 backup file carrying data this build does not recognise produces a
sentence **byte-identical** to one carrying nothing unrecognised, one line above *Replace my data · It
can't be undone* — and the data is then not carried, with nothing on the repairs card afterwards either.
The same losses arriving through the **WebKit** door DO get a card. Two doors onto one mapper, and only
one of them tells the user.

**File and line.**
- `apps/rn/src/data/readBackup.ts:143` — `const dropped = result.legacy?.dropped.length ?? 0;` — the
  **only** field of `LegacyMapReport` the sentence reads.
- `apps/rn/src/store/persistence.ts:120–130` states the rule for the other door explicitly:
  *"**`LegacyMapReport.dropped` is excluded on purpose, and the finding conflated it with the rest.**
  … `unknown` …, `unparseable` … and `quarantineFailed` … are the real losses."*
- `apps/rn/src/data/legacyBridge/mapLegacyStore.ts:19–21` — *"An unknown key is the dangerous one … the
  only safe response is to say so. A bridge that quietly ignores a key it does not recognise loses data
  in exactly the way nobody notices."*
- `apps/rn/src/data/readBackup.ts:114` — `const { partial, report } = mapLegacyStore(items);` —
  `mapLegacyStore`'s third return value, `quarantine`, is **discarded**.

**The measurement.** One file, one variable (which extra key it carries). Real `readBackup` +
`describeBackup`, `v1.7-dev` @ `e5ecc7b6`, exit 0:

```
### CONTROL — a clean v1.6 file
  report.unknown = []
  SENTENCE = "…has 1 debt, 1 expense and 1 goal. Saved 5/23/2026 at 10:02 AM.
              1 item the current version no longer uses won’t come across."

### one UNRECOGNISED key  (+ "savingsAccounts": [{ id, name, balance: 4200 }])
  report.unknown = ["debtPlanner.savingsAccounts"]
  pendingDataRepairs = []
  SENTENCE = "…has 1 debt, 1 expense and 1 goal. Saved 5/23/2026 at 10:02 AM.
              1 item the current version no longer uses won’t come across."   <- BYTE-IDENTICAL

### a DELIBERATELY DROPPED key (+ "rolloverCount": 7 — benign, documented)
  report.dropped = [schemaVersion, rolloverCount]
  SENTENCE = "…2 items the current version no longer uses won’t come across."  <- the sentence MOVED
```

**And the same door discards v1.6's quarantine bytes.** With
`"__corrupt__.goals.2026-01-04T…": "[{…targetAmount:5000}]"` in the file:
```
mapLegacyStore(...).quarantine keys   = ["debtPlanner.__corrupt__.goals.2026-01-04T00:00:00.000Z"]
readBackup success result keys        = ["ok","kind","store","legacy","exportedAt"]
quarantine BYTES survive?             = "(absent — dropped)"
report.quarantined survives (unused)  = ["debtPlanner.__corrupt__.goals.…"]
SENTENCE = "…has 1 debt, 0 expenses and 0 goals. Saved 5/23/2026 at 10:02 AM."
```
`mapLegacyStore.ts:160–161` calls those bytes *"for anyone who ever hit corruption … the ONLY surviving
copy of that data"*. On this door they are computed, named in the report, and then dropped on the floor,
with no clause in the sentence and no re-quarantine.

**Mechanism — HYPOTHESIS.** `describeBackup`'s loss vocabulary was built twice from different sources.
`describeLosses` (`readBackup.ts:291`) reads `store.pendingDataRepairs`, which only ever carries what
**`runMigrations`** repaired — and `unknown`/`quarantined` never reach `runMigrations`, because the mapper
resolves them before the partial is built. The `skipped` clause reads `legacy.dropped` alone. So the one
field of the report that is documented as *not* a loss is the one field the sentence is wired to, and the
three that are losses have no wire on this door at all. `persistence.ts` did the wiring correctly for the
WebKit door and nothing carried it across — the *"do not fix one without the other"* two-door shape this
surface has now produced three times (`C-7` / `C-7b`, `B3-2`'s two halves, `B3-3`'s two halves).

**Bound, measured against the v1.6 source — read this before rating it.** I checked
`git show v1.6-dev:app/page.tsx` (`buildBackupData()`, `:578–602`). It emits exactly **17** top-level
keys, and every one is covered by `mapLegacyStore`'s `DIRECT` / `PAYCHECK` / `DROPPED` tables or by
`V16_FILE_METADATA`. Measured through the real door with the repo's own field-for-field fixture:
```
report.unknown = []   report.unparseable = []   report.quarantined = []
```
So for a **genuine** v1.6 export: `unknown` is 0, `unparseable` is unreachable on this door at all
(`v16FileToLegacyItems` re-encodes every value with `JSON.stringify`, so nothing can fail to parse), and
`__corrupt__` keys are never emitted by `buildBackupData`. **The demonstrated harm therefore needs a
hand-edited, third-party, or future-v1.6 file** — which is the population `readBackup.ts:20` says this
door exists for, and is the same population pass-6 rated `B3-2` a blocker over (`exportedAt: '0'` is not
a value any shipping build wrote either). ⚠️ Triage should re-rate with that in front of it; I have
stated it rather than picked the flattering reading.

**What is unconditional:** the two doors disagree about which fields of one report are a loss, and the
import door's accounting is checked by nothing — `migrationAudit/invariants.ts:79–81` records that
`importDoor` supplies no `accounting`, so invariant ② `nothingSilentlyDropped` **SKIPs** half the corpus
by design. The oracle that would have caught this asymmetry is switched off on exactly the door that has
it.

**Remedy — UNVERIFIED.** Give `describeBackup` the same three counts `describeMigrationLosses`
(`persistence.ts:132–147`) already produces, from one owner rather than a second copy, and either carry
`mapLegacyStore`'s `quarantine` through `ReadBackupSuccess` to be re-quarantined by the committing caller
or state in the sentence that it will not be carried. Not verified: `describeBackup` already composes
three clauses whose order is pinned (`describeLosses`' docblock, *"the order is fixed … whole lists
first"*), so adding a fourth needs a decision about where it sits, and I have not measured whether the
`entity: 'migration'` repair shape `persistence.ts` uses survives `runMigrations`' `dataRepairs`
REPLACE-vs-`pendingDataRepairs` MERGE rule on the import path.

---

## B3-8 — `major` · pass-6 `B3-1` said "the declaration is what opens it"; the declaration landed and invariant ③ still cannot see one byte of store-level money, because the agreement control was never given a row for `plan`

**Origin:** `apps/rn/src/data/migrationAudit/invariants.ts` — **`instrument`** (`audit.test.ts` likewise).

**User-facing consequence.** The harness whose stated job is proving *"a restore cannot corrupt the
user's money"* runs green over the live defect in `B3-5`, and over any future string in the **five**
store-level money fields the same pass declared. Its own ratchet — the control written in pass 5 to stop
exactly this — was bypassed by omission rather than by argument.

**File and line.**
- `apps/rn/src/data/migrationAudit/invariants.ts:154–172` — `moneyKeepsItsType` walks
  `store.debts`, `store.requiredExpenses`, `store.livingExpenses`, `store.goals`, `store.paycheck.amount`
  and nothing else. No `cushionFloor`, no `windfall`, no `expenseReserve`, no `paycheck.leanAmount`.
- `apps/rn/src/data/migrationAudit/audit.test.ts:527–534` — `mustCover` is called for `debt`, `goal`,
  `requiredExpense`, `livingExpense`. **`plan` has no row.**
- `apps/rn/src/data/migrations.ts:286–289` claims otherwise: *"the harness built to prove 'a restore
  cannot corrupt the user's money' was asserted shut against this class: `audit.test.ts`'s
  mutual-agreement control reds if invariant ③ checks anything `REPAIRABLE_MONEY_FIELDS` does not
  declare … **The declaration is what opens it.**"*

**The measurement (control first).** `v1.7-dev` @ `e5ecc7b6`, real `moneyKeepsItsType`, exit 0:
```
CONTROL  row-level string balance ->
  {"invariant":"money-keeps-its-type","detail":"import: debts[0].balance is string (\"1,200\")"}
SUBJECT  store-level string money ->
  null
```
The subject store carried `cushionFloor: '1,200'` · `windfall: 'abc'` · `paycheck.leanAmount: '1,400'` ·
`paycheck.typicalAmount: 'nonsense'` · `expenseReserve.balance: '1,600'` ·
`expenseReserve.contribution.amount: '1,700'` · `cycleTopUp.amount: '1,800'` — **seven strings where
numbers are declared, and the invariant returns `null`.** The control proves the checker sees the class
when the field is on a row it walks.

And the ratchet, computed from the two lists as `audit.test.ts` computes them:
```
mustCover() is called for:      debt, goal, requiredExpense, livingExpense
REPAIRABLE_MONEY_FIELDS keys:   debt, requiredExpense, livingExpense, goal, plan
  debt             declared 5, unchecked []
  requiredExpense  declared 1, unchecked []
  livingExpense    declared 1, unchecked []
  goal             declared 3, unchecked []
  plan             declared ["cushionFloor","leanAmount","typicalAmount","windfall",
                             "expenseReserveBalance"]        <- NO mustCover ROW
```

**Mechanism — HYPOTHESIS.** `mustCover` takes the entity as an argument and is invoked once per entity by
hand (`audit.test.ts:531–534`). Adding a **sixth key** to `REPAIRABLE_MONEY_FIELDS` therefore adds no
coverage and reds nothing — the "mutual agreement" is asserted only over the four entities someone
remembered to list. The reverse control (`stray`) computes `declaredAnywhere` from **all** of
`Object.values(declared)`, so `plan`'s fields are in the permitted set and it stays green too. `B5-12`'s
own docblock names this precisely one level up — *"the fix did not generalise: it was a list, not a
relationship"* — and the fix for it was, again, a list.

⚠️ It is also structural, not just a missing row: `moneyKeepsItsType`'s `check()` helper only accepts
**arrays of rows**, so even a `mustCover('plan', …)` row could not be satisfied without new traversal
code for a scalar and two nested objects.

**Remedy — UNVERIFIED.** Derive the `mustCover` invocation list from `Object.keys(REPAIRABLE_MONEY_FIELDS)`
so a new entity cannot be silently uncovered, and give `moneyKeepsItsType` a scalar/nested path for
`plan`. Not verified, and the order matters: doing the `mustCover` half first will **red** `test:app`
immediately (`plan` declares five fields no list checks), which is correct but must land in the same edit
as the traversal. I also have not measured whether the audit corpus (`corpus.ts`) generates any fixture
carrying these keys — `migrations.ts:290–291` says *"the only v1.7-shaped fixture carries none of these
keys"*, so an opened invariant may still have nothing to look at, which is `B5-12`'s twin failure one
layer over.

---

## B3-9 — `minor` · the "field-for-field from `origin/v1.6-dev`" fixture is field-for-field at the top level only; its debt row omits `apr`, which v1.6 declares required

**Origin:** `apps/rn/src/data/detectBackupFormat.test.ts` — **`neighbour`** (`instrument`).

**User-facing consequence.** None today — `detectBackupFormat` never looks inside a row, so the shortfall
cannot affect what this file asserts. The cost is to the next reader: this is the repo's canonical
*"what a real v1.6 backup looks like"* fixture, its docblock is an explicit warning against using a
hand-made subset, and it is a hand-made subset one level down. `readBackup.test.ts:55–58` builds its
own debt row **with** `apr`, so the two fixtures for one shape already disagree.

**File and line.** `apps/rn/src/data/detectBackupFormat.test.ts:27–54`
```
/**
 * A REAL v1.6 backup, field-for-field from `origin/v1.6-dev`'s `buildBackupData()`.
 * ⚠️ NOT from `tests/e2e/fixtures/backup-import.json`, which is a hand-made subset missing six real
 * fields … Using the fixture as the model here would have tested a shape no user has.
 */
...
    debts: [{ id: 'd1', name: 'Visa', balance: 1200, minimumPayment: 35 }],
```

**The measurement.** `v1.7-dev` @ `e5ecc7b6`.
1. `git show v1.6-dev:app/page.tsx` → `buildBackupData()` at `:578–602` emits **17** top-level keys; the
   fixture carries all 17 and nothing else. **The top-level claim is TRUE.**
2. `git grep -n apr v1.6-dev -- lib/storage/debtPlannerStorage.ts` → `:35  apr: number;` — **required, not
   optional**, so no v1.6 debt row can lack it.
3. Routed through the real import door, that fixture produces a repair a genuine v1.6 file cannot:
```
SENTENCE = "This backup, from an older version of Debt Planner, has 1 debt, 2 expenses and 1 goal.
            Saved 5/23/2026 at 10:02 AM. ⚠️ 1 amount in this backup could not be read."
```
The extra clause is `apr` classified `lost` by `repairMoneyFields` (`REPAIRABLE_MONEY_FIELDS.debt.required`
includes `apr`, and an absent required field is a loss by design). A real v1.6 file produces no such
clause.

**Mechanism — HYPOTHESIS.** The fixture was written for a detector that reads only top-level keys, so the
row contents were filled in by hand to the minimum the assertions needed, and the provenance sentence was
written about the top level and reads as a claim about the whole object. Nothing checks it: no assertion
in this file, or anywhere, compares the fixture against v1.6's actual shapes.

**Remedy — UNVERIFIED.** Either add `apr` (and `originalBalance`, which v1.5's own migration guarantees)
to the row, or narrow the docblock to *"top-level keys field-for-field; row shapes are illustrative"*.
Not verified: I have not checked whether the goal row (`type: 'emergency'`) or the expense rows are
complete against v1.6's types either, so a fix that repairs only the debt row would leave the same
overstated sentence standing.

---

## B3-10 — `minor` · the two `StorageAdapter` implementations still disagree on one byte-sequence: `""` reads as "genuinely empty" on web and as corrupt bytes on native

**Origin:** `apps/rn/src/storage/createAdapter.web.ts` — **`stale-read`**; `apps/rn/src/storage/createAdapter.ts` — `stale-read`.

**User-facing consequence.** If a stored blob is ever an empty string, the web build treats it as *"nothing
is stored"* and the native build quarantines it. On web that is the pass-3 `B4` chain verbatim:
`persistence.ts` reads *"RN storage is genuinely empty"*, runs the v1.6 legacy import over a device that
already has a v1.7 store, and the first autosave overwrites the last copy of the plan.

**File and line.**
- `apps/rn/src/storage/createAdapter.web.ts:57` — `if (raw === null || raw === '') return null; // genuinely empty`
- `apps/rn/src/storage/createAdapter.ts:27` — `if (raw == null) return null;` then `JSON.parse(raw)` in a
  `try`, so `''` throws and the raw string is returned for quarantine.

**The measurement.** Real `createAdapter.web.read()` against a fake `Storage`; the native branch computed
from `createAdapter.ts:26–34`. `v1.7-dev` @ `e5ecc7b6`, exit 0:
```
web  read(null)   -> null      native read(null)   -> null      agree
web  read("")     -> null      native read("")     -> ""        <- DISAGREE
web  read(" ")    -> " "       native read(" ")    -> " "       agree
web  read("{\"debts\":[{\"id\":\"d1\",\"balance\":12") -> the raw string   (both)   agree
web  read("not json")          -> the raw string   (both)                  agree
```
`createAdapter.test.ts` (the file `B4` added) covers `null`, throwing storage, a truncated blob, garbage
bytes, a valid blob and a JSON string — **six members, and `""` is not one of them.**

**Mechanism — HYPOTHESIS.** `B4`'s fix moved the `JSON.parse` out of the shared `catch` but left the
pre-existing `raw === ''` short-circuit above it, so the "empty" branch still swallows one byte-sequence
before the parse can classify it. The native adapter never had that short-circuit. The two
implementations of one interface therefore still disagree on one input — the same defect shape the fix
was written for, one member further on.

**Bound, stated honestly.** I did **not** find a producer of `''`. `write()` on both sides is
`JSON.stringify(store)`, which is never `''`, and both backing stores return `null`/`undefined` for a
missing key. Reaching it needs an external write, a store-quota truncation, or a future producer. It is a
latent divergence, not a demonstrated live loss — which is why this is `minor` and not filed with `B4`'s
original severity.

**Remedy — UNVERIFIED.** Drop `|| raw === ''` from `createAdapter.web.ts:57` so `''` falls to
`JSON.parse` and is returned raw, matching native, and add the `''` row to `createAdapter.test.ts`. Not
verified: `''` is what an `Object.keys(localStorage)`-based clear can leave behind in some browsers, and I
have not measured whether any first-launch path depends on `''` reading as `null` — a first launch with a
`''` value present would begin quarantining instead of onboarding.

---

# Round summary — lane B3

**Manifest:** 64 files. **Read:** 64 of 64, plus 12 supporting files reached from them
(`READ-B3.txt`, 76 lines, every path `git ls-files`-verified, exit 0).

## By severity

| | n | ids |
|---|---|---|
| **`blocker`** | **4** | B3-1 · B3-2 · B3-5 · B3-7 |
| **`major`** | **3** | B3-3 · B3-4 · B3-8 |
| **`minor`** | **3** | B3-6 · B3-9 · B3-10 |
| **total** | **10** | |

## By origin (of the file the finding is filed against)

| origin | n | ids |
|---|---|---|
| **`fix-churn`** | **3** | B3-2 (`cloudBackup/service.ts`) · B3-3 (`cloudBackup/service.test.ts`) · B3-5 (`migrations.ts` + `models.ts`) |
| **`instrument`** | **2** | B3-4 (`scripts/prove-guards.ts`) · B3-8 (`migrationAudit/invariants.ts` + `audit.test.ts`) |
| **`off-surface`** | **2** | B3-1 (`formatBackupTime.ts`) · B3-7 (`readBackup.ts`) |
| **`stale-read`** | **2** | B3-6 (`utils/format.ts`) · B3-10 (`storage/createAdapter.web.ts`) |
| **`neighbour`** | **1** | B3-9 (`detectBackupFormat.test.ts`) |
| `first-look` / `s0-first-look` | 0 | — |

Secondary files named inside findings carry their own origins: `mapLegacyStore.ts` (`neighbour`, B3-7),
`createCloudBackupProvider.ios.ts` (`stale-read`, the false premise appended to B3-2),
`scripts/check-money-format.ts` (**not routed at all** — no row in `ROUTING-ORIGINS.tsv`, B3-6),
`packages/core/utils/formatDisplayAmount.ts` (`stale-read`, lane A, B3-6).

**5 of 10 land on `fix-churn` or `instrument`** — the two origins the brief said to weight, and every one
of those five is a defect *in the previous round's own repair*: the `B3-2` shape guard admits two more
spellings (B3-1); the `unknown`-before-the-write refusal left the after-the-write sibling (B3-2); the
block whose title names that exact regression tests only the branch that cannot produce it (B3-3);
`B3-1`'s store-money declaration named five fields when its own measurement named six (B3-5); and the
mutual-agreement ratchet built in pass 5 was bypassed by not being given a row for the entity pass 6 added
(B3-8).

## Instruments run, with their exit codes

| command | result |
|---|---|
| `npm run test:app` (baseline) | exit **0** |
| `npm run test:app` (control plant in `service.ts:103`) | exit **1**, redded on the named assertion |
| `npm run test:app` (after verified restore) | exit **0** |
| `npm run prove:guards -- --id=` ×4 (`S1P6-B3-2-*`, `S1P6-B3-3-*`) | exit **0** — all four **HELD** |
| `npm run lint:finding-guards` (clean · post-record) | exit **0** · exit **0** (B3-4) |
| `npm run lint:money` (clean · planted · restored) | exit **0** · exit **1** · exit **0** (B3-6) |

**Nothing was fixed.** Three files were planted and restored (`service.ts`,
`packages/core/utils/formatDisplayAmount.ts`, and `scripts/finding-guards.json`, which
`prove:guards` rewrites by default — see B3-4). Each restore was verified by `cmp` against a copy taken
after the plant and by `git status --porcelain`; all three are clean. No OOM occurred; every runner ran
under `--max-old-space-size=1536`. No server was started. No sub-agents were spawned.

