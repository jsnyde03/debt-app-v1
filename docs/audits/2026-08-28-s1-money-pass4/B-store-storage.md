# S1 pass 4 — auditor **B** · store · storage · utils · data · analytics · types

**Pin:** `e65f9c7` · branch `v1.7-dev`.
**Isolation:** every plant in this report was run in a dedicated detached git worktree at the pin,
`C:/Users/Jason/audit-b-wt` (`git worktree add --detach /c/Users/Jason/audit-b-wt e65f9c7`).
**No source in `/c/Users/Jason/debt-app-v1` was edited, committed or pushed.**
`git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 -- apps packages scripts` is empty — verified at the end
of this file.

**Route:** `ROUTING-B.txt` — 45 files, 8,003 lines.
Origins (looked up in `ROUTING-ORIGINS.tsv`, never judged): 25 `first-look`, 17 `fix-churn`,
3 `off-surface` (`apps/rn/src/data/readBackup.ts`, `apps/rn/src/data/readBackup.test.ts`,
`apps/rn/src/store/demoRun.ts`), 0 `instrument`.

---

## 1. Findings

### F-B1 · `minor` · the iOS provider's docblock states a mechanism the code does not have

**Origin:** `fix-churn` (`apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts`).
**File/line:** `apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ios.ts:101-103`.

The `stat()` docblock says of the un-stat-able-file path: *"the stat-after-write path catches it too and
falls back to our clock — the documented behaviour, and the safe direction: **the next inspect reads
`unclaimed` and asks** rather than destroying."*

**Measured** (worktree probe against the real modules, an available provider whose `stat()` raises through
`metadataFromMtime(undefined)`):

```
1) backupToCloud on an un-stat-able file → {"ok":true,"at":"2026-08-20T15:00:00.000Z"} writes= 1
   at === our clock? true
2) next inspectRemote → {"state":"unknown"}            (docblock claims `unclaimed`)
3) next guarded backup → {"ok":false,"reason":"unavailable"} writes= 1
```

`inspectRemote` never reaches the `unclaimed` branch, because `provider.stat()` **throws** and the function's
own `catch` returns `unknown` first. So the app does **not** ask; it reports `unavailable` and refuses, and
every later automatic backup is refused the same way for as long as the file's mtime stays unreadable.

**Why `minor` and not `major`:** the direction is still safe (`writes` stays at 1, nothing is clobbered) and
the conclusion the docblock draws — *"rather than destroying"* — is true. Only the stated mechanism is false,
and reading rule 1 is explicit that a docblock is a carried premise in both directions. No user-visible money
statement changes.

**Remedy (hypothesis):** replace *"the next inspect reads `unclaimed` and asks"* with *"the next inspect
reads `unknown` and the guard refuses"*, and note that automatic backup stays refused until a readable mtime
returns. The same paragraph is duplicated in `provider.ts:20-35`; that copy does not make the `unclaimed`
claim and is accurate.

### F-B2 · `minor` · `S1P3-B3-MTIME`'s registered token pins only one of the finding's two directions

**Origin:** `fix-churn` (`apps/rn/src/storage/cloudBackup/service.test.ts`).
**File/line:** `scripts/finding-guards.json` → `S1P3-B3-MTIME`, token
`a file with no usable mtime is `unknown``, pinned at `service.test.ts:367`.

The entry's own `what` names two directions: (a) the **silent 1970** (`new Date(null|0)` does not throw), and
(b) **none-vs-unknown** (returning `null` reads as `none`, which the guard permits). Only (b) is behind the
registered token.

**Measured.** Plant = `metadataFromMtime` stops validating and just returns
`{ modifiedAt: new Date(mtimeMs).toISOString() }` (the silent-epoch direction). Test reds on the loop
assertion `an unusable mtimeMs (null) throws…`. **Relaxing that loop assertion only** and re-running:

```
exit=0   ✅ cloud backup service tests passed (86 asserts).
```

— the token assertion is **green with the silent-epoch defect present**. It is load-bearing only for the
`return null` direction, where it reds with `got none, expected unknown` (measured separately).

Consequence: deleting the `for (const bad of […])` loop would leave `lint:finding-guards` green while the
worse of the two directions is unguarded. This is `D3-3`'s shape — the token is right about *a* line, not
about the line that carries the whole finding.

**Remedy (hypothesis):** either add a second registry entry pinning the loop's assertion string, or move the
token onto a sentence present in the loop (e.g. `throws rather than inventing a file identity`), which covers
both directions because the `unidentifiable` block reds on it too.

### F-B3 · `major` · a whole unreadable LIST is described as *"1 whole row"* at the irreversible restore confirm

**Origin:** `off-surface` (`apps/rn/src/data/readBackup.ts` — routed to S3, which has no inventory and no
auditor; S1's own fixing edited it).
**File/line:** `apps/rn/src/data/readBackup.ts:183-193` (`describeLosses`), reached from `describeBackup`
(file door, `BackupSheets.tsx:178`) and `describeRestorePreview` (iCloud door,
`CloudBackupSheet.tsx:53`).

**User-facing consequence:** a user restoring a backup whose entire `debts` list was unreadable is told
*"⚠️ 1 whole row in this backup could not be read"* immediately before tapping **Replace my data** under
*"It can't be undone"* — when every debt row in the file was lost, not one.

**The mechanism.** `describeLosses` splits `pendingDataRepairs` into "amounts" and "whole rows" on
`r.field.startsWith('(')`. That prefix has **two** producers in `migrations.ts`, and they are not the same
event:

- `:155` `field: '(a row could not be read)'` — one row. Counting it as 1 is right.
- `:129` `field: '(whole list unreadable)'` — the **entire array** for that entity. Counting it as 1 is
  wrong, and the count cannot be made right from the record because the unparseable value has no length.

**Measured** (probe against the real modules; a healthy 3-debt store, one field mutated per case):

```
### B. WHOLE debts list unreadable (3 debts existed)
  repairs: [{"entity":"debt","field":"(whole list unreadable)","kind":"lost"}]
  file door : This backup has 0 debts, 0 expenses and 0 goals. Saved 8/19/2026 at 8:00 AM. ⚠️ 1 whole row in this backup could not be read.
  cloud door: This backup has 0 debts, 0 expenses and 0 goals. ⚠️ 1 whole row in this backup could not be read.

### C. one row not an object                       ← the case the wording IS right for
  repairs: [{"entity":"debt","field":"(a row could not be read)","kind":"lost"}]
  file door : This backup has 2 debts, 0 expenses and 0 goals. … ⚠️ 1 whole row in this backup could not be read.

### F. two whole lists unreadable (debts + goals)
  file door : This backup has 0 debts, 0 expenses and 0 goals. … ⚠️ 2 whole rows in this backup could not be read.
```

Cases **B** and **C** produce the **identical clause** from opposite-sized losses. That is `C-7`'s own class,
one field further on: the registered guard token for `C-7` is *"…and counts it, so **"one" is
distinguishable from "nine"**"*, and this count is structurally incapable of that distinction for the
larger of the two loss kinds.

**Why `major` and not `blocker`:** the entity counts in the same sentence are honest (*"0 debts"*), so the
decisive number is not false — only the magnitude of the warning is.

**Remedy (hypothesis):** stop pooling the two producers. Give `(whole list unreadable)` its own clause —
*"the whole debts list in this backup could not be read"* — driven off `entity` rather than off the count,
and keep the row/amount counts for the two producers that really are per-row. ⚠️ Verify the remedy against
case **E** (`1 amount and 1 whole row`), where all three clause kinds can co-occur. Note the `(`-prefix
convention is a naming coupling between `migrations.ts` and `readBackup.ts` with nothing pinning it —
a third `(`-prefixed field added in `migrations.ts` would silently join the "whole rows" bucket.

**Other cases measured on the same probe and found correct** (recorded so pass 5 does not re-run them):
`G` a `recovered` repair produces **no** warning (correct — the value is right, only its format was wrong);
`D` two lost balances → *"2 amounts"*; `H` a backup that already carried an **acknowledged** `lost` repair
still warns, which is right — the amount really is `0` in the file being restored.

### F-B4 · `blocker` · a WHOLE-LIST / WHOLE-ROW debt loss is invisible to `debtLiveness`, so `G-1`, `G-2` and `G-3` all recur on the louder member of their own class

**Origin:** `fix-churn` (`apps/rn/src/store/trustSelectors.ts`, `apps/rn/src/store/guardianSelectors.ts`,
`apps/rn/src/store/guardianTrust.test.ts` — all three routed `fix-churn`).
**File/line:** `apps/rn/src/store/trustSelectors.ts:41-45` (`hasUnreadDebtBalances`) → `:73-76`
(`debtLiveness`).

**User-facing consequence:** after restoring a backup whose entire `debts` array could not be read, the
Guardian prints its honesty scorecard as **`4 of 4 matched · Under-warned 0 · proven`**, the Today headline
**graduates to the debt-free/savings framing**, and a freed reserve is announced as going to **"your
savings"** — the exact three sentences `G-1`, `G-2` and `G-3` were raised to stop, over a portfolio the app
could not read at all.

**The mechanism — two producers of one fact, in the same file** (reading rule 13). `trustSelectors.ts:163`
states the rule: *"A repair whose field is parenthesised — `(a row could not be read)`, `(whole list
unreadable)` — names no field because there was nothing left to name. Those are the **LOUDEST losses**, so
they poison every claim about their entity rather than matching none of them."* That rule is implemented in
`poisons()` (via `isWholeRowLoss`) and **is not implemented in `hasUnreadDebtBalances`**, which matches
`r.field === 'balance'` exactly. `debtLiveness` calls the second one, so the loudest loss reads as
`'debt-free'` while the quietest reads as `'debt-free-unverified'`.

**Measured** (probe against the real selectors; identical stores, identical 8-cycle mixed history, only the
`DataRepair.field` differs):

```
### T  lost balance FIELD (the member every G-1…G-5 fixture uses)
  hasUnreadDebtBalances : true
  debtLiveness          : debt-free-unverified
  G-1 calibration       : n=0 matches=0 falseClears=0 proven=false matchRate=null
  G-2 reserve target    : "your debt"
  G-3 guardian debtFree : false

### W  WHOLE LIST unreadable          ← strictly MORE data lost
  hasUnreadDebtBalances : false
  debtLiveness          : debt-free
  G-1 calibration       : n=4 matches=4 falseClears=0 proven=true matchRate=1
  G-2 reserve target    : "your savings"
  G-3 guardian debtFree : true

### R  a ROW unreadable
  hasUnreadDebtBalances : false
  debtLiveness          : debt-free
  G-1 calibration       : n=4 matches=4 falseClears=0 proven=true matchRate=1
  G-2 reserve target    : "your savings"
  G-3 guardian debtFree : true
```

`matches=4 · falseClears=0` is verbatim the inversion `guardianTrust.test.ts` asserts *"cannot recur"* —
`assert(!(calDamaged.matches === 4 && calDamaged.falseClears === 0), '⛔ G-1 — the exact inversion that
shipped ("4 of 4 · Under-warned 0") cannot recur')`. It recurs; the assertion runs only over the `balance`
member.

**Why the tests did not see it** — reading rule 2. Every fixture in `guardianTrust.test.ts` is built from
`const balanceRepair = lost('debt', 'd0', 'Visa', 'balance')`, and the `debts` array always still holds the
row. The whole-list and whole-row producers (`migrations.ts:129`, `:155`) are never used in that file. The
class has three members and the suite tests one.

**Reachability.** `migrations.ts:129` fires whenever a stored/imported `debts` value is present and is not
an array; `:155` whenever a row is not an object. Both are reachable through the file-import door, the
iCloud restore door, the v1.6 WebKit legacy bridge, and plain `hydrate` of a locally stored blob that is
valid JSON with a bad `debts` value. Measured end-to-end earlier in this audit: `readBackup` on an envelope
with `store.debts = 'corrupt'` returns `ok`, `store.debts = []`, and exactly that repair record.

**Remedy (hypothesis) — and it must not be a fourth copy.** `hasUnreadDebtBalances` should ask the same
question `poisons()` already answers: `!mayClaim(store, 'debt-balances')` is the existing owner, or at
minimum add `|| isWholeRowLoss(r)` (with `r.entity === 'debt'`) to its predicate and export the helper.
⚠️ Verify against the two standing controls in `guardianTrust.test.ts` that must **not** move: a `recovered`
balance stays `'debt-free'`, and an unread `apr` still grades the calibration record. ⚠️ Note the two
routes are not identical — `'debt-balances'` also routes `originalBalance`, so `!mayClaim(...)` would make
an unread `originalBalance` suppress liveness too; decide that deliberately rather than inheriting it.

**A second-order note, measured and left as a question rather than a finding:** `clearResuppliedRepairs`
(`trustSelectors.ts:326`) treats a whole-row loss as *"answerable only by the acknowledgement"* and
**deletes** the record when `acknowledged` is set — so after one *"Got it"* tap the whole-list loss stops
poisoning `mayClaim('debt-balances')` as well, and the *"Every balance is cleared"* claim is re-armed. The
docblock argues that case deliberately (a loss with nothing to reopen must be answerable somehow), so I am
not rating it; but it means the remedy above must be tested **after** an ack, not only before one.
**Why the two instruments that look like they cover this do not.**
`trustSelectors.test.ts:307-330` **does** exercise a whole-row loss — but only through `mayClaim`, and its
fixture is `migrated([100])`, a store with a **live** debt, so `debtLiveness` would read `'has-debt'` there
whatever the repair said. The discriminating shape is a whole-row loss with **no** live debt row, and no
fixture in the repo has it. And the claim-table **completeness gate** (`trustSelectors.test.ts:168-192`)
iterates `REPAIRABLE_MONEY_FIELDS`, which holds only the ten real money fields — the two synthetic
parenthesised fields are outside it by construction, so the gate designed to stop exactly this class of
routing gap cannot see them.

### F-B5 · `major` · `S1P3-B6`'s guard survives its own un-fix — **`GUARD-ONLY`**

**Origin:** `fix-churn` (`apps/rn/src/analytics/funnel.ts`); the widening lives in
`apps/rn/src/store/demoRun.ts`, origin **`off-surface`**.
**File/line:** `scripts/finding-guards.json` → `S1P3-B6`, `file: apps/rn/src/analytics/funnel.ts`,
`token: stage: DemoStageId`. The thing that makes the token mean anything is
`apps/rn/src/store/demoRun.ts:31`.

**Consequence:** `funnel.ts`'s header is the **stated review surface for a privacy claim** — its own
docblock says the Phase-6 privacy audit *"reads exactly it"* — and the claim *"no free-form string …
anywhere in this file's types"* can be made false again with **every gate green**, so the privacy audit
would read a sentence nothing checks.

**Measured.** In the worktree at the pin, restore `B6`'s defect at the only place it can now live:

```
- export type DemoStageId = 'debts' | 'held' | 'absorbed' | 'trajectory' | 'payoff';
+ export type DemoStageId = string;
```

`funnel.ts` is untouched, so the token `stage: DemoStageId` is still on a non-comment line, and
`demo_stage.stage` is once again an open `string`. Then:

```
npx tsx scripts/check-finding-guards.ts   → exit=0
   ✅ finding-guards: 150 of 151 findings carry a standing guard; 1 unguarded (cap 1, downward-only).
npx tsc --noEmit -p apps/rn/tsconfig.json → exit=0
```

No other gate reads it: `grep -rl "funnel|DemoStage" scripts/` returns three files and the only code hit is
`check-sandbox-writes.ts`, whose entry is about the opt-out read, not the union.

This is `D3-3`'s shape again — *the token is right about the wrong line.* It pins the **consumer's
annotation** and the defect lives in the **producer's declaration**.

**Remedy (hypothesis, and I verified it discriminates in both directions).** A type-level assertion the
compiler enforces, e.g. in `funnel.test.ts` or beside the union:

```ts
export const _closedUnion: string extends DemoStageId ? never : true = true;
```

Measured in the worktree: `typecheck:rn` **exit=2** (`TS2322: Type 'true' is not assignable to type
'never'`) with `DemoStageId = string`, and **exit=0** with the real union restored. Repoint the registry
token at `demoRun.ts` in the same change so the two cannot drift.

---

## 2. Closure verdicts

Every plant below was run in the isolated worktree `C:/Users/Jason/audit-b-wt` at `e65f9c7`, restored with
`git checkout --` between plants, and the worktree was verified clean after each.
Baseline before any plant: `npm run test:app` → **exit 0**, `npx tsx scripts/check-finding-guards.ts` →
**exit 0** (`150 of 151 findings carry a standing guard`).

### 2a. Pass-3 findings in my lane

| id | verdict | the measurement |
|---|---|---|
| **B3** (blocker) | **CLOSED** | Both halves plant-verified. (i) Deleting `service.ts:165` (`if (claim.state === 'unknown') …`) reds the suite; relaxing the two assertions before the token leaves the token itself red with **`writes=1, expected 0`** — the other device's file overwritten. (ii) Making `metadataFromMtime` return `null` (the finding's *own* stated remedy) reds the token with **`got none, expected unknown`**, confirming the brief's warning that the stated remedy was the defect. See `F-B1` for a false mechanism in the iOS docblock and `F-B2` for the token's coverage gap. |
| **B4** (major) | **CLOSED** | Restoring the single `try { getItem + JSON.parse } catch { return null }` reds `createAdapter.test.ts` on its own token, first assertion, no earlier red: `got null, expected "{\"debts\":[{\"id\":\"d1\",\"balance\":12"`. Verified **downstream** too, which neither test does on its own: the real `createAdapter.web` over a fake `localStorage` holding truncated bytes, hydrated by the real `createDebtStore().hydrate` → `storageError: data-reset`, one `…__quarantine__.migration-failed.<ts>` key written, bytes preserved. Control: a real blob hydrates with `storageError: null`. |
| **B7** (major) | **CLOSED** | Removing the `USER_AUTHORED_CATEGORIES` drop in `scrubBreadcrumb.ts:75` reds the token assertion first, no earlier red: `a touch breadcrumb carrying a creditor name is DROPPED (got [object Object], expected null)`. Consumer verified installed — `sentry.ts:37-39` passes `scrubBreadcrumb` as `beforeBreadcrumb`; `sentry.web.ts` is a documented no-op with no Sentry in the web bundle. |
| **C-7** (major) | ⚠️ **PARTIAL** | The named instance is fixed and plant-verified: dropping `describeLosses(result.store)` from `describeBackup` reds; relaxing the "names the loss" assertion leaves the registered token (`…and counts it`) independently red. **But a sibling instance of the same class is not fixed** — `(whole list unreadable)` is counted as *"1 whole row"*, so the sentence cannot distinguish one lost row from an entire lost list. See **`F-B3`**. |
| **C-7b** | ⚠️ **PARTIAL** | Guard verified: dropping `describeLosses(store)` from `describeRestorePreview` reds its token as the first failing assertion. Both doors compose from the one owner — `BackupSheets.tsx:178` (`describeBackup`) and `CloudBackupSheet.tsx:53` (`previewRestore()` → `describeRestorePreview`), so the pre-read remedy is really wired, not just written. **PARTIAL for the same reason as C-7**: the shared owner is `describeLosses`, so the miscount is at both doors. |

### 2b. `S1P3-*` guard entries whose guarded code is on my route (14 of 53)

| entry | verdict | the measurement |
|---|---|---|
| `S1P3-B3-UNKNOWN` | **CLOSED** | Token independently load-bearing — relaxed the two assertions before it, token still reds with `writes=1`. |
| `S1P3-B3-MTIME` | **CLOSED**, token partial | Reds on the `return null` direction (`got none, expected unknown`). ⚠️ **Green** on the silent-epoch direction once the loop assertion beside it is relaxed — see `F-B2`. |
| `S1P3-B4-ADAPTER` | **CLOSED** | Token is the first failing assertion under the un-fix; no earlier assertion reds. |
| `S1P3-B7-BREADCRUMB` | **CLOSED** | Token is the first failing assertion under the un-fix. |
| `S1P3-C7-LOSSES` | **CLOSED** (guard) | Load-bearing after relaxing the assertion before it. The *finding* is `PARTIAL` — see `F-B3`. |
| `S1P3-C7B-CLOUDDOOR` | **CLOSED** (guard) | First failing assertion under the un-fix. Finding `PARTIAL`. |
| `S1P3-C5-PAYWALL` | **CLOSED** | `void mayStatePlanFigures;` planted in `paywallLead.ts:63`; the shortfall assertion reds first, so it was relaxed — the registered cushion token then reds on its own. Consumer verified: `paywall.tsx:132` passes `mayClaim(store, 'required-plan')`. |
| `S1P3-G1-CALIBRATION` | ⚠️ **PARTIAL** | Guard reds for the named member: restoring `debts.filter(d => d.balance > 0)` as the regime source gives `⛔ G-1 … (expected 0, got 4)`. **But the class recurs** on a whole-row/whole-list loss: measured `n=4 matches=4 falseClears=0 proven=true matchRate=1` — verbatim the inversion the file next to it asserts *"cannot recur"*. See **`F-B4`**. |
| `S1P3-G2-RESERVETARGET` | ⚠️ **PARTIAL** | Guard reds (`expected "your debt", got "your savings"`). Class recurs: whole-list loss → `"your savings"`. `F-B4`. |
| `S1P3-G3-GUARDIANREGIME` | ⚠️ **PARTIAL** | Guard reds (`expected false, got true`). Class recurs: whole-list loss → `debtFree: true`. `F-B4`. |
| `S1P3-G4-PLANROUTE` | **CLOSED** | Removing `'balance'` from the `'required-plan'` route reds the token (`expected false, got true`). This one is genuinely whole-class safe: `poisons()` routes parenthesised fields through `isWholeRowLoss`. |
| `S1P3-G5-SAVINGSPOOL` | **CLOSED** | `unreadSavings: false` planted; the token reds (`expected true, got false`), the assertion before it stays green so no relaxation was needed. |
| `S1P3-B5` | **CLOSED** | Discriminating plant, as the entry itself demands. Added a **namespace-import** caller on one line — `export function installIt() { const p = 'assets//x'; funnel.setFunnelSink(() => { void p; }); }` — under `src/utils/`. Fixed code: reds naming `utils\__b_caller.ts`. Old regex restored: reds naming **only `app\more.tsx`** — the real installer is **missed**, and the red is the false positive on the fix's own write-up. |
| `S1P3-B6` | ⛔ **GUARD-ONLY** | `DemoStageId = string` in `demoRun.ts` restores the defect exactly; `funnel.ts` is untouched so the token survives. `check-finding-guards` **exit 0**, `tsc --noEmit -p apps/rn/tsconfig.json` **exit 0**. See **`F-B5`** for a remedy verified to discriminate in both directions. |

**Not in my lane, so no verdict from me:** `A1` `A2` `A3` `A4` `B1` `B2` `C-1`…`C-6` `D3-1`…`D3-8` `G-6`
`A5` `B5†` `B6†` `C m1`–`m7`, and the 39 `S1P3-*` entries whose guarded file is outside `ROUTING-B.txt`.
† pass-3's minors `B5`/`B6` *are* mine and are covered above under their guard entries.
**`m3` (the one deferral):** its files are not on my route and I did not measure it, so I take no position.

---

## 3. Findings tally by origin

Origin is a lookup in `ROUTING-ORIGINS.tsv`, on the file each finding is **in**.

| origin | blocker | major | minor | total |
|---|---|---|---|---|
| **first-look** | 0 | 0 | 0 | **0** |
| **fix-churn** | 1 (`F-B4`) | 1 (`F-B5`) | 2 (`F-B1`, `F-B2`) | **4** |
| **instrument** | 0 | 0 | 0 | **0** |
| **off-surface** | 0 | 1 (`F-B3`) | 0 | **1** |
| **total** | **1** | **2** | **2** | **5** |

⚠️ Two of the five live in files whose *companion* has a different origin, and the split is worth
recording rather than smoothing:

- `F-B5` is filed `fix-churn` because the guard entry names `apps/rn/src/analytics/funnel.ts`, but the
  code that makes the guard meaningless is `apps/rn/src/store/demoRun.ts` — **`off-surface`**. The
  mismatch *is* the finding.
- `F-B4` spans three `fix-churn` files (`trustSelectors.ts`, `guardianSelectors.ts`,
  `guardianTrust.test.ts`) and is triggered by records written in `apps/rn/src/data/migrations.ts`, which
  is **not routed at all this round** (unchanged since the pin) — so nothing on any lane's list would have
  led a reader to it.

⭐ **The headline for the ratchet: `first-look` produced nothing on this route and `fix-churn` produced
everything.** All five findings are in code the fixing session wrote or touched since `96d1f11`, which is
reading rule 11 holding again. **`off-surface` earned its flag** — the one `major` outside the fixing's own
churn is in `readBackup.ts`, the S3 file with no inventory and no auditor.

---

## 4. Swept and found clean — BY PATH

Read and reasoned about, with no blocker or major found in them. Where a measurement was taken it is named.

**`apps/rn/src/storage/` — read in full.**

- `cloudBackup/service.ts` (275 L) — all six entry points read line by line; the `unknown`/`none` split,
  the stat-before-read ordering in `restoreFromCloud`, `deleteCloudBackup`'s availability refusal and
  `shouldAutoBackup`'s three clauses all measured green under the suite's 86 asserts. Callers enumerated:
  `_layout.tsx:168` (guarded), `use-cloud-backup.ts:128-129` (guarded by default, unguarded only behind
  `replaceUnclaimed`), `more.tsx:128`, `DataResetScreen.tsx:64`. No unguarded implicit backup path exists.
- `cloudBackup/provider.ts` (90 L) — `metadataFromMtime`'s predicate covers non-number, non-finite and
  `<= 0`; the suite's table exercises `undefined, null, NaN, 0, -1, '123', {}` plus a positive control.
- `cloudBackup/createCloudBackupProvider.ios.ts` (126 L) — one `minor` (`F-B1`), otherwise clean:
  `AppData` scope, `exists`-before-`unlink`, the download-poll on a fresh install, provider-init degradation.
- `cloudBackup/service.test.ts` (540 L) — 86 asserts, exercised under four separate plants.
- `createAdapter.web.ts` (91 L) + `createAdapter.test.ts` (98 L) — plant-verified plus an end-to-end
  hydrate chain (see B4 above).

**`apps/rn/src/store/` — the money-claim spine.**

- `trustSelectors.ts` (383 L) — read in full. `poisons` / `routedSubset` / `unreadFieldsFor` /
  `rowFieldUnread` / `anyRowFieldUnread` all handle the parenthesised-field case correctly; the one that
  does not is `hasUnreadDebtBalances` (`F-B4`). `clearResuppliedRepairs`' three signals and
  `answerBalanceRepairs` read and traced against `trustSelectors.test.ts`'s 48 asserts.
- `planSelectors.ts:342` `selectPlanState` — the pass-3 rewrite verified: it now asks `debtLiveness`
  whole. Measured: the whole-list-loss store returns `'no-debts'` here (not a false *"debt-free"*), because
  `store.debts.length === 0` intercepts first — so this selector is **not** part of `F-B4`.
- `historySelectors.ts` (76 L) — `C-3`'s structural half verified: `sumPaidToDebt` has exactly **two**
  callers (`historySelectors.ts:54`, `guardianSelectors.ts:114`), both passing `store.cycleHistory`, so the
  two-producers shape is genuinely gone. Grep for the old subtraction returns nothing.
- `payday.ts` (238 L) — `A2`'s call-site half verified: `buildCycleSnapshot` and `applyRolloverPayment` are
  handed the **same** `(store.paycheck.currentDate, nextPaycheckDate)` window, on adjacent statements.
- `celebrationSelectors.ts` (143 L) — `C-4`'s fix read; `selectPaidOffDebts` gates `originalBalance` on
  `'debt-balances'` and `selectCelebration` on `'row-figures'` (the wider route), so neither can under-gate.
- `obligationForm.ts` (128 L) — `FORM_ERRORS.aprOutOfRange` has two real consumers (`DebtSheet.tsx:230`,
  `FirstDebtOrBillStep.tsx:71`), so `B2`'s remedy is used, not merely defined.
- `paywallLead.ts` (87 L) — plant-verified; consumer at `paywall.tsx:132`.
- `guardianSelectors.ts` (828 L) — **partially** swept; see §6.
- `proofOfWork.test.ts`, `guardianTrust.test.ts`, `trustSelectors.test.ts`, `planSelectors.test.ts`,
  `celebrationSelectors.test.ts` — read; `persistenceLifecycle.test.ts` partially, see §6.

**`apps/rn/src/data/` (off-surface).**

- `readBackup.ts` (229 L) — read in full; one `major` (`F-B3`). The router's three branches, the
  `V16_FILE_METADATA` skip, `v16FileToLegacyItems`' re-encoding and `migrated`'s total wrapping all
  verified against `readBackup.test.ts`'s 84 asserts.
- `readBackup.test.ts` (439 L) — read in full and exercised under two plants.

**`apps/rn/src/analytics/`, `utils/`, `types/`.**

- `funnel.ts` / `funnel.test.ts` — plant-verified; the `FunnelEvent` union re-swept independently and its
  only number is `tutorial_skipped.beat`, a step index, justified in the docblock as the file requires.
- `scrubBreadcrumb.ts` / `.test.ts` — plant-verified; both SDK category spellings present.
- `skia-ready.web.ts` (98 L) — read; a loading gate, states no money, no claim surface.
- `types/react-native-ios-context-menu.d.ts` (51 L) — read; a type shim, no runtime.

**Whole-runner wiring, measured.** All **71** `await import(...)` lines in `src/testing/runAppTests.ts`
were checked mechanically against each module's export shape: **0 mismatches** — no module with a default
runner is imported without being invoked, and no side-effect module is invoked as one. This is the
"a suite that never runs" class, and it is absent.

---

## 5. Measured, and NOT a defect

- **`sumPaidToDebt`'s two callers do not diverge.** Both pass `store.cycleHistory` unfiltered. I expected
  `selectGuardianProofOfWork` to pass a *genuine-cycles* subset (it gates on `subscriptionPlan` and
  `history.length`, not on `genuineCycleCount`); it does not. One owner, one input.
- **A negative APR is already refused, so `aprN > 100` is a sufficient bound.** `parseOptionalAmount`
  (`packages/core/utils/amountField.ts:53-58`) returns `null` for `n < 0`, and both RN sites reject `null`
  as `aprInvalid` before reaching the range check. The error string says *"between 0 and 100"* and the
  code checks only the upper bound — correctly.
- **`readBackup`'s `migrated()` docblock about the onboarding gate is accurate even though the code is
  elsewhere.** The inference is `migrations.ts:426` (`inferOnboarding`), reached by every path through
  `runMigrations`. Measured through the real chain: a v1.6 file with a portfolio lands
  `onboardingComplete: true`, an empty one lands `false`.
- **A `recovered` repair produces no restore-confirm warning.** Measured: `describeBackup` and
  `describeRestorePreview` both stay clean over a `'5,000'` balance that `readMoney` recovered to `5000`.
  This is the load-bearing exclusion, and it holds.
- **A backup carrying a pre-existing `acknowledged: true` `lost` repair still warns at the confirm.**
  Measured; correct — the amount really is `0` in the file about to replace the user's data.
- **`describeStoreContents` is honest under a whole-list loss.** It prints `0 debts`, so the decisive
  number in the confirm sentence is right even where the warning clause's magnitude is not (`F-B3`).
- **`selectPlanState` is not part of `F-B4`.** Measured `'no-debts'`, not `'debt-free'`, under a whole-list
  loss — the `store.debts.length === 0` branch intercepts before the liveness verdict is used.
- **`mayClaim(store, 'required-plan')` and `mayClaim(store, 'debt-balances')` both correctly return
  `false` under a whole-list debt loss.** Measured. So the paywall lead, Money's sums and the trophy shelf
  are *not* exposed by `F-B4`; the exposed consumers are exactly the three that read `debtLiveness`.
- **`REVERIFY4-3` / `REVERIFY4-2` (the two standing S0 caveats).** Re-stated rather than assumed: they
  live in `scripts/`, which is auditor **D**'s route. I did not measure them and make no claim about them.

---

## 6. Not reached — BY PATH

⛔ Named, because silence reads as swept.

- **`apps/rn/src/store/guardianSelectors.ts` — 828 lines, of which I read roughly 300.** I read every
  `debtLiveness` / `liveDebts` / `rowFieldUnread` site (lines 30-90, 160-200, 270-380, 630-660, 700-770)
  plus `selectGuardianProofOfWork`. **Not read:** `selectAffordability`'s body and the save-for-it plan
  (roughly 440-640), `selectBnplBetweenPaycheck`, `buildGuardianBrief`'s eight `debtFree` branches, and the
  notify-decision seam. Pass 3 recorded this file swept against bytes that have since changed by +126 lines.
- **These route test files were counted and structurally scanned (assertion density, absence-assertion
  shapes) but NOT read line by line:** `store/affordability.test.ts`, `store/bnplCadence.test.ts`,
  `store/debtFreeBand.test.ts`, `store/debtIds.test.ts`, `store/expenseReserve.test.ts`,
  `store/glossary.test.ts`, `store/greeting.test.ts`, `store/guardianSubjects.test.ts`,
  `store/milestoneCross.test.ts`, `store/onboardingFinish.test.ts`, `store/payoffCelebration.test.ts`,
  `store/realWriteGuard.test.ts`, `store/steadyStateProjection.test.ts`, `store/storeContext.test.ts`,
  `store/windfallSplit.test.ts`, `store/persistenceLifecycle.test.ts` (read ~40% — the corrupt/quarantine,
  malformed-nested, null-row and pace blocks; **not** the legacy-bridge and save/lock sections).
  ⚠️ **`store/guardianSubjects.test.ts` is the one I would point pass 5 at first**: 120 lines carrying
  **8** assertions, the lowest density on the route by a factor of two.
- **`apps/rn/src/store/demoRun.ts` — read only the type region (lines 1-60) and the `DEMO_STAGES` shape.**
  The remaining ~130 lines (the timed script, `primePayoff`, the sandbox seeding) were not read. It is
  `off-surface`.
- **`apps/rn/src/utils/skia-ready.web.ts` — read the first 60 of 98 lines.** The rejection-handling tail
  was skimmed, not verified.
- **No `apps/rn/src/lib/` or `apps/rn/src/config/` files exist on the manifest** despite the brief's
  summary naming those directories — the manifest holds 45 paths across `store`, `storage`, `utils`,
  `data`, `analytics`, `types` only. Nothing was dropped; the prose table is broader than the file.

---

## Isolation check

```
git -C /c/Users/Jason/debt-app-v1 diff e65f9c7 -- apps packages scripts
→ (empty)
```

All plants ran in `C:/Users/Jason/audit-b-wt`, a detached worktree at `e65f9c7` created with
`git worktree add --detach`. `node_modules` and `apps/rn/core` were supplied to it as directory junctions
so the suites could run; no tracked file in either tree was left modified. No commit, no push.
