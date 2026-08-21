# R1 — REFUTATION: DATA LOSS & RECOVERY

> Wave-2 refutation of `slices/M3-recovery.md` and `slices/W1-unaudited-delta.md`.
> Repo `debt-app-v1`, branch `v1.7-dev`. Slices were written at `dd80f70`; **verified at `ae80a88`**
> (HEAD). `git log --stat dd80f70..HEAD` touches only `apps/rn/tests/shots/**` and `docs/**` — **no
> source file named in any of these six findings has changed since the slices were written**, so every
> quoted line is current. Line numbers below are re-verified, not copied.
>
> ⛔ Default is REFUTED. A finding survives only where I actively failed to break it.
> ⚡ Mechanism is attacked **before** observation, per the standing result that observations survive and
> explanations do not.

---

### R1-M3-1
**Verdict:** **CONFIRMED — with the mechanism CORRECTED in two places.** The observation (a silent total
wipe into onboarding, no quarantine reader anywhere) survives. But *"the bytes ARE preserved"* and
*"way out: none offered"* are **both wrong**, and each correction changes what should be built.

**How I tried to break it:**
1. Traced `runMigrations` to see whether the `hydrate` catch is reachable at all — the slice's own M3-20
   asserts `runMigrations` "was made total", which would make the catch dead code.
2. Grepped every consumer of `quarantine` / `clearQuarantine` across `apps/rn/src`, `packages`, `scripts`
   (repo root, not a directory list), including QA-gated screens.
3. Looked for any downstream the lens did not: route guards, the first-launch iCloud restore offer,
   `startWidgetSync`, `startLiveActivitySync`.
4. Checked whether `storageError` could be set on this path by anything later in the launch sequence.

**What I found:**
- **The catch is reachable, and narrowly so.** `runMigrations` (`apps/rn/src/data/migrations.ts:122-125`)
  throws on exactly one condition: `!raw || typeof raw !== 'object' || Array.isArray(raw)`. Every other
  hostile shape is total (`repairMoneyFields` was deliberately made non-throwing). The native adapter
  feeds that condition: `apps/rn/src/storage/createAdapter.ts:27-33` returns the **raw string** when
  `JSON.parse` fails, so corrupt MMKV bytes → string → throw → quarantine →
  `adapter.write(createDefaultStore())`. The slice's end-to-end trace is correct.
- **`storageError` is genuinely left `null`** (`apps/rn/src/store/store.ts:268-275` sets only
  `isHydrated`), so `_layout.tsx:219`'s `StorageErrorScreen` branch cannot fire, and
  `createDefaultStore()`'s `onboardingComplete: false` routes to onboarding at `_layout.tsx:265`.
- **No quarantine reader exists.** `clearQuarantine` repo-wide: `apps/rn/src/storage/adapter.ts:16,37`,
  `createAdapter.ts:42`, `createAdapter.web.ts:54`, `persistenceLifecycle.test.ts:44`. Four definitions,
  one test, **zero call sites**. Same for reading quarantine keys — no component, no QA screen, not even
  behind `qaEnabled()`. Confirmed exactly as stated.

**⚡ MECHANISM CORRECTION 1 — "the bytes ARE preserved" is true only for the narrow branch.**
The quarantine branch requires `read()` to return a *corrupt but present* blob. The sibling path —
`read()` returning **`null`** because the MMKV file was lost or truncated to nothing — lands in
`store.ts:258-262`, the **first-launch branch**, which writes defaults with **no quarantine call at all**.
The user-visible outcome is byte-for-byte identical (onboarding, no words, no `storageError`), and in that
path there are **no preserved bytes to recover**. A recovery screen built on the quarantine key would not
fire for it. Which of the two an MMKV fault produces is device-owed — but the fix the slice implies covers
only one of them, and it is not obviously the more likely one.

**⚡ MECHANISM CORRECTION 2 — "Way out: none offered" is FALSE for a real subset.**
`_layout.tsx:185-210`'s one-shot restore offer is gated on `!isOnboarded(...)`, and the wipe sets
`onboardingComplete: false`. So a user with an iCloud backup **is shown an Alert offering to restore it**,
on that very launch. This is not hypothetical — the slice found the same mechanism itself in M3-8
(*"the next launch actively offers it back"*) and did not carry it back to M3-1. The two findings
contradict each other; M3-8's version is the correct one.
⚠️ It is a real but **narrow** exit: `cloudBackupEnabled` is absent from `createDefaultStore()` ([D47],
default off), so the remote file exists only for users who deliberately turned backup on. For everyone
else the slice's "none offered" stands.

**If CONFIRMED — is it reachable by a real user, and how?**
Yes, but only through MMKV blob damage — an interrupted write, a truncated mmap, device-level file
corruption. Nothing in the app can produce it, no test drives it, and I could not bound its frequency from
source. **This is the weakest leg of the finding, and the slice rates its own confidence on the absence of
a reader (a grep), not on reachability.** On reachability alone I would put this at **major, not
blocker**: the harm is total but the trigger is a device fault of unmeasured rate.

**Residual doubt:** D-M3-8 (corrupt the blob on a real device) settles reachability of the *quarantine*
branch. Nothing planned settles the `read() === null` sibling — which is the one I would actually measure,
and it needs the same missing signal W1-6 does (see R1-W1-6).

---

### R1-M3-2
**Verdict:** **CONFIRMED, and the harm is UNDERSTATED.** I attacked the premise the slice itself flagged
as unverified, and it verified. I attacked "reads as paid off" expecting hyperbole, and found it literal.

**How I tried to break it:**
1. Attacked the premise directly against **v1.6's own source** (`git grep` on the local `v1.6-dev`
   branch) rather than trusting `migrations.ts`'s comment about it.
2. Grepped `dataRepairs` repo-wide for any renderer.
3. Chased what a `balance: 0` debt actually *does* downstream, expecting "shows $0.00" to be the extent
   of it.
4. Checked whether the file-import door's `describeBackup` covers the same field for the migration door.

**What I found:**
- **The premise is TRUE, and I verified it at source.**
  `v1.6-dev:components/Onboarding/FirstDebtOrBillStep.tsx:35` —
  `if (!balance || Number(balance) <= 0) { setError("Enter the current balance."); return; }`
  `balance` is the raw input **string**, so `!balance` is false for `"12,000"`; `Number("12,000")` is
  `NaN`; `NaN <= 0` is `false`. The guard passes, and line 47 writes `balance: Number(balance)` — `NaN` —
  which `JSON.stringify` serialises as `null`. `minimumPayment` (lines 36/48) carries the identical
  defect. ⚡ The slice's Medium confidence on frequency can be raised: this is not a claim in a comment,
  it is the shipped v1.6 code, and it sits on **the first debt a user ever enters**.
- **`dataRepairs` is rendered by nothing.** Repo-wide: `data/defaults.ts:43`, `data/migrations.ts:177`,
  `data/models.ts:229`, `data/migrationAudit/invariants.ts` (×4) and three test files. **No component, no
  screen, no row.** Confirmed as stated.
- **⚡ "Reads as paid off" is not a figure of speech — it is a code path.**
  `apps/rn/src/app/(tabs)/money.tsx:221` is `store.debts.filter((d) => d.balance <= 0)` and `money.tsx:330`
  pushes that list under the literal section header **`'PAID OFF'`**. A repaired debt is *filed under Paid
  Off*, not merely shown at $0.00. It is then excluded from `planSelectors`, `payoffSelectors`,
  `guardianSelectors`, `analysisSelectors`, `recoverySelectors` and `widget/snapshot.ts` (all
  `filter(d => d.balance > 0)`), so it also vanishes from the plan, the payoff schedule, the Guardian and
  the home-screen widget.
- **And if the repair hits every debt** — one debt, or several typed the same way — `money.tsx:343-348`
  fires `allCleared`, and the hero reads **"Every balance cleared"** with *"N debts paid off"*, while
  `(tabs)/progress.tsx:88-105` renders the **`PaidOffArchive`**. The app congratulates the user on
  clearing a portfolio it just failed to read.
- **The file-import door does NOT cover this.** `describeBackup` surfaces dropped/unknown items for the
  *file* path only; the v1.6 **bridge** path and the ordinary `hydrate` path both land in `dataRepairs`,
  which nothing reads. `data/migrationAudit/cutoverFiles.test.ts:88` even names its fixture *"the file
  that must produce a VISIBLE repair report on the device"* — the test asserts the field is populated;
  nothing asserts, or provides, the surface.

**If CONFIRMED — is it reachable by a real user, and how?**
Yes. Any v1.6 upgrader who typed a grouped or locale-separated number into the onboarding balance field
(`type="text" inputMode="decimal"`), and any user in a comma-decimal locale, for whom the *ordinary*
decimal keypad produces exactly this shape. Update → bridge runs → `readMoney(null)` →
`{ value: 0, repaired: true }` → the debt is filed under **PAID OFF** with no notice anywhere.

**Residual doubt:** the *rate* is still unmeasured — the committed real-container fixture
(`apps/rn/src/data/legacyBridge/__fixtures__/webkit-ios26`) carries the SIM_SMOKE seeder's key set, and
its own README says it "proves LOCATION, SHAPE and the WAL behaviour — not coverage." D-M3-9 is the right
row. But the mechanism is now verified from both ends, which is more than the slice claimed.

---

### R1-M3-3 / R1-W1-2
**Verdict:** **MECHANISM WRONG, OBSERVATION HOLDS** — and the correction matters more here than anywhere
else in this refutation, because **the fix both lenses reach for does not fix it.**

**How I tried to break it:**
1. Re-read the call chain for a downstream guard the lenses missed (`isSandboxStore`, `isAvailable`, any
   provider-side versioning or confirm).
2. Checked whether the "Last backed up" line really renders independently of the toggle.
3. **Simulated the proposed fix**: evaluated `shouldAutoBackup` against the store state that actually
   exists at the moment the toggle is flipped, in each reachable arrival path.
4. Checked whether the destroyed remote is recoverable by any other route (versioning, a second path, a
   second file).

**What I found:**
- **The call chain is exactly as described and current.** `use-cloud-backup.ts:99-106`:
  `updatePrefs({ cloudBackupEnabled: next })` then `if (next && status === 'ready') await backupNow();`
  → `backupNow` → `backupToCloud(...)` (`service.ts:36`) → `provider.write(...)` →
  `createCloudBackupProvider.ios.ts` `CloudStorage.writeFile(BACKUP_PATH, ...)` at one fixed path,
  overwriting. `shouldAutoBackup` (`service.ts:109`) has exactly **two** call sites in non-test code, and
  both are `_layout.tsx:160`. The hook never touches it. Confirmed.
- **The aggravating display is real.** `use-cloud-backup.ts:47-56`'s `refresh()` calls
  `getCloudBackupStatus` → `provider.stat()` unconditionally, and `CloudBackupSheet.tsx:87-93` renders
  `Last backed up …` whenever `status !== 'unavailable'` — **independently of the toggle**. The sheet does
  display the artifact the next tap destroys.
- **No recovery exists.** One path, one file, `writeFile` overwrites, `AppData` scope is invisible in the
  Files app, and nothing in the tree reads an iCloud version generation. The slice's "the backup is gone"
  survives.
- **No confirm.** `CloudBackupSheet.tsx:74-83`'s `Switch.onValueChange` goes straight to
  `void setEnabled(next)`. Compare the restore path five lines below, which has a two-tap `danger`
  confirm naming what is lost.

**⚡ MECHANISM CORRECTION — "the clobber guard is bypassed" is the wrong diagnosis.**
Both lenses frame this as *the seed-backup routes around `shouldAutoBackup`*, and both recommend routing
it through. **I evaluated the guard against the state that exists when the toggle is flipped, and in the
most likely arrival path it returns `true` and permits the clobber anyway:**

```
shouldAutoBackup(store, { declinedRestore }) =
  declinedRestore ? false
  : store.prefs.cloudBackupEnabled !== true ? false
  : isOnboarded(store)
```

At the moment of the flip, `cloudBackupEnabled` was **just set to `true`** one line earlier
(`use-cloud-backup.ts:101`), and the user has **completed onboarding** (More is behind the onboarding
route guard, `_layout.tsx:265-268` — they cannot reach this sheet otherwise). So only `declinedRestore`
can refuse — and `declinedRestore` is `true` **only** if the restore Alert was actually presented and
dismissed. In the sequence the slice itself names as most likely (M3-7 / W1-8: the offer fails silently
and is never shown), `declinedRestore` is `false`, the guard **passes**, and the remote is destroyed
identically. The proposed fix is a no-op for that path.

W1-2's own refuter note reached the right answer and then did not follow it: *"the durable fact is 'a
remote backup exists that this install has never restored', which `getCloudBackupStatus` already knows."*
**That is the real mechanism.** The defect is not a bypassed guard; it is that **`shouldAutoBackup` has no
clause about the remote at all** — it reasons only about local state, and no code path anywhere compares
the remote against the local before overwriting. `declinedRestore` is a proxy for that fact which only
holds when the Alert was shown, and it lives in a `useRef` the hook cannot see, so it cannot be the
signal even if it were the right one.

**Would the implied fix make the app worse?** The naive version, yes — twice over. Routing `setEnabled`
through `shouldAutoBackup` (a) does nothing in the likely path, per above, and (b) in the path where it
*does* refuse, it silently makes "on" mean "not backed up", which is the exact confusion the hook's
comment at `use-cloud-backup.ts:102-103` was written to prevent. The correct fix is the one W1-2's note
implies: when `lastBackupAt !== null` and this install has never restored, make enabling a **two-tap
confirm naming the date of the remote it will replace** — the treatment "Restore from iCloud" already gets
one control below.

**If CONFIRMED — is it reachable by a real user, and how?**
Yes, iOS only, and by the most ordinary sequence available. New phone (or reinstall) with an existing
remote → the restore offer either fails silently (W1-8) or is declined → onboard → More › iCloud backup →
the sheet reads `Last backed up <old date>` → flip the switch, which is the first control on the sheet and
the obvious move for someone who came to get their backup → the remote is replaced, silently, with no
message at all (`setEnabled`'s result is never passed to `report()`; the only visible change is the status
line re-rendering with today's date).

**Residual doubt:** none on the code — the chain is unconditional and I re-derived the guard by hand.
D-M3-3 confirms it on hardware. The open question is scope of the fix, not existence of the defect.

---

### R1-W1-6
**Verdict:** **CONFIRMED on mechanism — but the finding is INCOMPLETE in the one way that matters, and the
lens's own proposed fix would not close the most likely failure.** Severity: I would hold **blocker**, on
a different basis than the lens gives.

**How I tried to break it:**
1. Looked for any path that returns storage to `null` — a `clear`, a delete, a reset that removes rather
   than overwrites.
2. Checked whether the **throwing-read** branch preserves the retry (it does, and the lens says so — I
   verified it, because if it didn't the finding would be much larger).
3. Enumerated every reachable `skipped(...)` reason against the *real* reader, not against the docstring.
4. Read `interruption.test.ts` and `persistenceLifecycle.test.ts` to test the "wrong seam" claim.
5. Looked for a way out for the stranded user (iCloud, file import, QA probe).
6. Checked `git log` for a later commit closing it.

**What I found:**
- **The sequence is exactly as stated and current.** `persistence.ts:47-49`:
  `try { if ((await adapter.read()) === null) await runLegacyBridge(adapter, store); } catch {}` then
  `await store.getState().hydrate(adapter);` — and `store.ts:258-262` writes `createDefaultStore()`
  unconditionally on `raw === null`. `StorageAdapter` (`storage/adapter.ts:8-17`) has **no `clear`**, and
  `reset()` (`store.ts:296-299`) installs defaults which autosave persists. **There is no path back to
  `null`.** The idempotence key is consumed one statement after the bridge is offered it. Confirmed.
- **The throwing-read branch IS safe, as the lens says.** A rejected `read()` skips the bridge, then
  `hydrate` catches, sets `read-failed`, and `persistence.ts:56-60` deletes the bootstrapped mark and
  returns **without writing**. Next launch retries the whole sequence including the bridge. So the harm is
  confined to the case where `read()` genuinely resolves `null` and the bridge then skips — which is
  precisely the upgrade case.
- **The test critique holds.** `migrationAudit/interruption.test.ts:66-74` calls `migrateFromLegacy`
  directly against a `MemoryStorageAdapter` and asserts *"nothing is persisted by the bridge itself — the
  CALLER writes"*, then retries against that same untouched adapter. It never runs `bootstrapPersistence`.
  And `persistenceLifecycle.test.ts` runs `bootstrapPersistence` three times (lines 171/184/198) — every
  one with an adapter and **no legacy source**, so none of them can observe the interaction. Neither suite
  can see this.
- **The tree already knows.** `migrateFromLegacy.ts:114-121` spells out this exact mechanism verbatim, as
  5.10 finding 1: *"the migration is skipped silently, `hydrate` writes a fresh empty store, and because
  idempotence is structural … it never runs again. One corrupt v1.6 key would strand a real portfolio
  permanently, with the source sitting untouched and unreachable."* ⚡ **The fix taken closed the one
  known cause (making `runMigrations` total) and left the class open** — and the comment's own hedge
  admits it: *"'should be impossible' is what the bare call was, too."* This is not a discovery; it is a
  documented, accepted residual. That is worth recording, but it does not soften it.

**⚡ MECHANISM CORRECTION — the lens enumerates three skip reasons and misses the reachable one.**
W1-6 lists `truncated`, `read threw`, and `could not be MIGRATED`, and says each *"is written to preserve
the retry."* I walked the reader instead, and there is a **fourth** outcome that is neither in the list
nor retry-flavoured:

> `'no v1.6 store in this container (a fresh install)'` — `migrateFromLegacy.ts:88-97`, the
> `report.store === null && !report.truncated` branch.

This fires on a **genuine v1.6 container** whenever every candidate database is found but **fails to
open**: `readLegacyStores.ts:96-98` catches and returns `{ error: String(error) }` with no `items`, so
`decoded` is empty and `pickLegacyStore([])` returns `null`, with `truncated` still `false` because the
*walk* succeeded. `migrateFromLegacy` reads only `report.truncated` — it **never inspects
`report.opened[].error`**, the field `report.ts:26` exists specifically to say *"a database was found and
refused."* The result is that a found-and-refused database is reported to the future as **"a fresh
install"**, the most terminal-sounding reason in the set.

This is not speculative: `readLegacyStores.ts:64-73` documents that exact chain as what happened before
the `-wal` fix — *"which this function would catch, report as an error, and the bridge would conclude the
user has no legacy data. **A total, silent migration failure that every synthetic test passed.**"* The
`-wal` copy closed one cause. A locked database, a failed sidecar copy, a full cache directory, or any
future WebKit format change reaches the identical outcome.

**Consequence for the fix:** W1-6 recommends *"persist a `legacyBridgeAttempt` outcome and re-run on a
non-terminal reason."* Under the current tagging, the most likely real failure is tagged **terminal**, so
that fix would leave it live. Any fix must either (a) derive terminality from `report.opened` and
`report.candidates` rather than from `truncated` alone, or (b) re-run on anything that is not a
*confirmed* clean fresh install (`candidates.length === 0 && !truncated && visited > 0`). ⚡ That
distinction is the deliverable here, not the retry flag.

**Also correcting the lens's own hedge:** W1-6 says *"only the crash-before-write interruption is
genuinely safe … one branch of four."* It is **two of five** — the crash branch and the throwing-`read()`
branch are both safe, for the same reason (nothing writes).

**If CONFIRMED — is it reachable by a real user, and how?**
Every v1.6 customer who updates in place is admitted to this code path — that is Phase 5's entire
audience, and the exposure is 100% of upgraders, gated only on whether the read skips. The skip rate is
unmeasured, and the honest statement is: *the class was measured at 100% once already* (the pre-`-wal`
reader would have skipped every real container), which is the strongest available evidence that "should be
impossible" is not load-bearing here.
**Way out for the stranded user:** none in-app. The v1.6 WebKit source survives on disk but is now
unreachable forever; iCloud backup is a **v1.7** feature so no remote exists for a v1.6 upgrader; the only
door is importing a backup **file** they happened to export from v1.6 before updating, and nothing tells
them anything happened. `LegacyBridgeProbeReadout` is behind `qaEnabled()` (`config/qa.ts:23`) and reads a
*fresh* `readLegacyStores()`, not the outcome — and it is scheduled for deletion with the `QA_TOOLS` flip.

**Residual doubt:** the actual field rate of each skip cause. I could not settle whether
`Paths.cache.uri` is ever not `…/Caches`, whether `MAX_WALK_DIRECTORIES` is ever hit, or how often
`openDatabaseAsync` refuses a copied WAL pair. ⚡ But note that **W1-7's recommendation makes the doubt
moot at a cost of about ten lines**: report `outcome.reason` + `read.truncated` + `read.opened` on every
`migrated === false`. Without it there is no instrument that could ever tell us this is happening. That is
the cheapest correct move regardless of how the retry scope call lands.

---

### R1-W1-8
**Verdict:** **CONFIRMED on the first half; MECHANISM WRONG on the second half ("the worse half").** The
misleading message survives intact. The *durability* claim — *"never offered their backup again for the
life of the install"* — is **false**, and the "consumed before the await" framing misidentifies why the
offer is lost.

**How I tried to break it:**
1. Re-derived the timeout arithmetic and checked whether the provider genuinely knows the file exists.
2. Traced `null` → `'no-backup'` → rendered string, looking for any layer that re-widens it.
3. **Attacked the lifetime of `offeredRestore`** — the load-bearing claim in the "worse half".
4. Checked whether anything else re-offers the restore: an AppState `'active'` handler, a second effect, a
   More badge, an onboarding line.
5. Checked whether the timeout case is distinguishable at all from a genuinely-absent file downstream.

**What I found (first half — CONFIRMED, unchanged):**
- `createCloudBackupProvider.ios.ts` `readWithDownload`: `CloudStorage.exists()` gates the whole function,
  so on the timeout path **the provider has already proven the file exists**. It then attempts `readFile`,
  catches, `triggerSync`, and polls `6 × delay(700)` before `return null`. **≥4.2 s of sleep, plus the
  `readFile` attempts** — 4.2 s is a floor, not the budget.
- `service.ts:66`: `if (raw === null) return { ok: false, reason: 'no-backup' }` — the two facts collapse
  into one tag, and nothing re-widens it. `CloudBackupSheet.tsx:44-52` renders
  `'There is no backup in iCloud yet.'` A user is told, flatly, that a file the code just confirmed exists
  is not there. In a codebase whose stated doctrine is that *"there is nothing"* and *"I could not look"*
  are different facts (`hydrate`'s `read-failed`, `readLegacyStores`'s `truncated`,
  `restoreFromCloud`'s own docstring), this is the one place the distinction was thrown away. **Confirmed
  exactly as written**, and the `pending` recommendation is right.

**⚡ MECHANISM CORRECTION (second half).** `offeredRestore` is a `useRef` **inside `RootLayout`**
(`_layout.tsx:106`), so it is **process-scoped, not install-scoped**. It resets on every cold launch. The
effect at `_layout.tsx:189-193` re-evaluates on the next launch, and if the user still has not onboarded,
**the offer is made again**. W1-8's "for the life of the install" is wrong.

What actually makes it permanent is the *other* guard on the same line: `_layout.tsx:192`,
`if (isOnboarded(appStore.getState().store)) return;`. The honest statement is:

> **one attempt per launch, and never again once onboarding completes.**

That still produces the harm the lens describes — completing onboarding is exactly what a user does in the
next sixty seconds — but it relocates the defect. `offeredRestore.current = true` at line 193 *before* the
await is **nearly inert**: the effect's only dependency is `[isHydrated]`, which transitions once per
launch, so moving the assignment after the await would buy a re-offer only on the `StorageErrorScreen`
retry path (which sets `isHydrated: false` then true). ⚡ **The real defect is that there is no second
trigger at all** — no AppState `'active'` listener, no post-onboarding check, nothing that re-asks once
iCloud has had time to materialise the file. W1-8's recommendation (*"do not consume `offeredRestore` on a
non-`no-backup` failure — retry it on the next foreground"*) is **right in its second clause and pointless
in its first**: the retry-on-foreground is the whole fix; not consuming the ref does almost nothing on its
own. A refuter agreeing to "don't set the ref early" and stopping there would ship a non-fix.

**Also worth naming:** the timeout is not the most likely cause of a silent no-offer. On a phone still
completing iOS setup, `CloudStorage.isCloudAvailable()` answers `false` and `restoreFromCloud` returns
`unavailable` at `service.ts:62` — before `readWithDownload` is ever reached. That reason is swallowed by
the same `if (!result.ok) return;` (M3-7), costs no 4.2 s, and is the ordinary new-phone state. **A `pending`
outcome would not cover it; a retry-on-foreground would.** That is a second, independent argument for the
same fix, and it is the stronger one.

**If CONFIRMED — is it reachable by a real user, and how?**
Yes, iOS only, and it is the *designed* scenario: new phone, restore from an iCloud backup. Launch →
iCloud not yet available or the file not yet materialised → offer silently skipped → the user onboards
(which is what the app is showing them) → `isOnboarded` now blocks the offer permanently → their route out
is discovering More › iCloud backup › Restore unaided. And per R1-M3-3, if they instead flip the toggle on
that same sheet, the remote is destroyed.

⚠️ **One thing that partly defends the code:** the collapse is *declared*, not drifted —
`provider.ts:24` documents `read()` as returning *"`null` when there is none — **including 'not downloaded
yet'**"*. So this was a decision, and the interface is honest about it. That does not save the finding:
the decision is fine at the provider boundary and wrong at the **copy**, which asserts a fact about
iCloud's contents that the provider never claimed to know.

**Residual doubt:** whether 4.2 s is short in practice — D-M3-1 is the right row and the highest-value
device measurement in this audit. The `unavailable`-on-a-fresh-phone path needs no measurement; it is the
documented iOS setup sequence.

---

### R1-M3-8
**Verdict:** **DOWNGRADED — from "major, wrong in both directions" to "minor on the copy" plus ONE
separate finding at major that the framing buries.** The observations are all literally true. The *harm*
attributed to them is not, and the finding's own headline sentence points at the least important half.

**How I tried to break it:**
1. Verified `reset()` and what survives it — the remote, the quarantine, the pref.
2. Chased whether the "undoable" claim actually helps a user who deleted by mistake, or whether the app
   compensates on its own.
3. Sized the quarantine half: who has a quarantine key, and what is in it.
4. Looked for any way the app *could* delete the remote (is this a defect, or absent capability?).
5. Checked the sentence against what it literally promises.

**What I found:**
- **The mechanics are all correct.** `more.tsx:107-111` → `appStore.getState().reset()` →
  `store.ts:296-299` fresh defaults; the pref change makes `persistence.ts:78-88` write **immediately**.
  Nothing deletes the remote. `clearQuarantine` has zero call sites (verified under R1-M3-1). The copy is
  at `more.tsx:415-421`.
- **The next-launch re-offer is real, and I confirmed the whole chain.** For an already-onboarded user the
  offer effect returns at `_layout.tsx:192` **without setting `offeredRestore`**, so the ref is still
  `false` after `reset()`; the effect does not re-run in-session (deps `[isHydrated]`), but on the **next
  launch** `isOnboarded` is now false and the Alert fires: *"There is a backup of your plan in your iCloud
  account. Restore it to this device?"* And the remote is still there, because `shouldAutoBackup`
  (`service.ts:109-113`) refuses a not-onboarded store, so backgrounding cannot overwrite it. Every link
  holds.

**⚡ WHY IT DOWNGRADES — direction A ("it is undoable, and the copy stops them trying").**
This only applies to users who deliberately turned `cloudBackupEnabled` on — absent by default ([D47]).
And for exactly that subset, **the app volunteers the undo without being asked**: they relaunch and are
offered their plan back in an Alert. So the claim *"this copy is exactly what stops a user who deleted by
mistake from trying"* is largely self-answering. The residual case is narrow and real — a user who
re-onboards fully in the same session before ever relaunching permanently loses the offer (`isOnboarded`
closes it, per R1-W1-8) — but that is a much smaller finding than "the sentence is wrong."

**⚡ WHY IT DOWNGRADES — direction B ("it is not an erasure").**
The quarantine half is near-inert. A quarantine key exists only for a user who previously hit blob
corruption or carried a v1.6 `__corrupt__` entry; the bytes are unreadable by any surface in the app; and
`clearQuarantine` being uncalled is a **dead API**, not a live data path. Real, worth closing, ~minor.
The load-bearing survivor is not the quarantine — it is **the iCloud remote**, which the finding files
under direction A rather than here.

**⚡ THE FINDING THAT SHOULD HAVE BEEN SPLIT OUT (major, and I am confirming it independently):**
> **"Delete all data" has no story for the remote at all** — it does not delete it, does not mention it,
> and the *next launch actively offers it to whoever is now holding the phone.*

That is the handover case, and no wording fixes it. It is also **[STRUCTURAL]**: `CloudBackupProvider`
(`provider.ts:19-27`) has `isAvailable` / `write` / `read` / `stat` and **no `delete`**, so deleting the
remote is new capability, not a corrected defect. The shippable-today fix is words — the delete confirm
must say the iCloud copy is not included, and offer to turn backup off — but the finding is about the
behaviour, not the sentence.

**Would the implied fix make the app worse?** Yes, if taken literally. Rewriting the copy to *"you can
restore this from iCloud later"* would (a) be false for the default-off majority, (b) soften the one
confirm in the app whose job is to make a destructive act feel destructive, and (c) read as reassurance to
someone deleting for **privacy** — the exact user for whom the surviving remote is the problem. The copy
should get *more* specific about the remote, not softer about the deletion.

**If CONFIRMED — is it reachable by a real user, and how?**
The handover half: any iOS user with backup enabled who wipes the phone for resale or for a family member.
More › Delete all data → onboarding → next launch → an Alert offering the previous owner's debts. The copy
half: only the backup-enabled subset, and only when they do not relaunch first.

**Residual doubt:** D-M3-12 settles the re-offer on hardware; I consider it settled from source. The
open call is a scope one (is a provider `delete` in v2.0, or is it words-only?), which belongs to 🎯.

---

## Verdict table

| finding | slice severity | verdict | R1 severity |
|---|---|---|---|
| **W1-6** | blocker | CONFIRMED — incomplete; the lens's fix misses the likely cause | **blocker** |
| **M3-3 / W1-2** | blocker | **MECHANISM WRONG**, observation holds | **blocker** |
| **M3-2** | blocker | CONFIRMED — premise verified at v1.6 source; harm **understated** | **blocker** |
| **W1-8** | major | CONFIRMED first half · **MECHANISM WRONG** second half | **major** |
| **M3-1** | blocker | CONFIRMED — two mechanism corrections; reachability unmeasured | **major** |
| **M3-8** | major | **DOWNGRADED** on the copy · one buried finding promoted | **minor** + a new **major** |

**Five of six survived. Three of six carried a wrong mechanism**, which is consistent with the standing
result — and in two of those three (M3-3, W1-6) **the fix the lens proposed would not have closed the
defect.**

---

## Ranked by real-user harm

1. **W1-6 — the v1.6 upgrader whose bridge skips loses their entire portfolio, permanently and silently.**
   They update the app they have been using for months, land in a setup wizard, and there is no route back
   — iCloud backup is a v1.7 feature so no remote exists, and the v1.6 data sitting untouched on disk is
   now unreachable forever. ⚡ And the likeliest skip cause is tagged *"a fresh install"*, so the lens's
   own proposed retry would not rescue them.

2. **M3-3 / W1-2 — flipping "Back up to iCloud" ON destroys the only surviving copy of their old plan.**
   One tap, no confirm, no message, from the sheet that is at that moment displaying the date of the file
   it is about to replace. They are left holding the bare plan they typed twenty minutes ago. ⚡ Routing
   the seed-backup through `shouldAutoBackup` does **not** fix this — the guard passes in the likely path.

3. **M3-2 — a real $12,000 debt is filed under "PAID OFF" and disappears from the plan.** Not "shows
   $0.00": it lands in `money.tsx`'s literal PAID OFF section, drops out of the payoff schedule, the
   Guardian and the widget, and if it was their only debt the app renders *"Every balance cleared"* and a
   paid-off archive. They stop paying a debt that is still owed. The v1.6 defect that produces it is
   verified in the shipped v1.6 source, on the first debt a user ever enters.

4. **W1-8 — on a new phone, they are told their backup does not exist when the code has just confirmed it
   does.** *"There is no backup in iCloud yet"* is the one message that tells a person to stop trying, and
   they get it while their portfolio is downloading. There is no second attempt in that launch, and once
   they finish onboarding there is never another. Feeds directly into #2.

5. **M3-1 — a corrupt local blob wipes everything into onboarding, with no word said.** Recovery bytes are
   preserved and nothing anywhere reads them. Ranked below the four above only because the trigger is an
   unmeasured device fault — the harm, when it fires, is total. ⚠️ And the sibling path (`read()` returns
   `null`) is identical to the user and preserves **nothing**, so a quarantine-reader fix covers half of it.

6. **M3-8 (the promoted half) — a phone wiped for handover offers the previous owner's debts to the next
   person, in an Alert.** Not data loss but privacy loss, and it is the one item here that the *user
   explicitly asked the app to prevent* by tapping Delete everything. Structural: the provider has no
   `delete`.
