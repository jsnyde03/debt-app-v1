# P6.8.9.2 — cluster **d (CLOUD / DESTRUCTIVE)** · independent verification

**Verifier:** independent; did not build any of these fixes. **Branch:** `v1.7-dev`.
**Ids:** B3 · C9 · M3-5. Written incrementally, one id at a time.

## How the two named hazards were handled

**1 · Wrong-mechanism findings (B3, M3-5).** Both are on the "observation held, mechanism/remedy
measured wrong" list (`BRIEF.md:35`). For each I verified against the **observation** — the
user-visible behaviour the slice describes — and then judged, **separately**, whether the shipped fix
attacks the real cause rather than the lens's stated one. Neither verdict below is derived from the
lens's mechanism.

**2 · Nothing here executes off-device.** `CLOUD_BACKUP_SUPPORTED = false`
(`apps/rn/src/storage/cloudBackup/createCloudBackupProvider.ts:25`) and the base variant returns
`unavailableCloudBackupProvider` (`:12`), whose `isAvailable()` is permanently `false`
(`apps/rn/src/storage/cloudBackup/provider.ts:48-50`). Every service entry point returns early on that
(`service.ts:57`, `:110`, `:160`, `:196`, `:208`), so on web the `ready` branch of
`CloudBackupSheet.tsx` and the whole of `use-cloud-backup.ts`'s working path are **never entered**.
The only e2e that touches this screen asserts the *unavailable* branch —
`apps/rn/tests/e2e/backup.spec.ts:203-206`, `:220-223`. Therefore:

- **Unit tests against the injected fake provider (`storage/cloudBackup/service.test.ts`) DO count as
  pins** — they exercise the real service code with a fake at the seam.
- **Nothing that requires the `ready` UI branch counts as a pin.** Where a fix lives at a call site
  above the seam, I say so and name the device row that is the only real evidence.

---

## B3 / M3-3 — the iCloud toggle destroys the declined backup

### The observation, re-derived from the current code

The slice's observation (`slices/M3-recovery.md:63-79`): the sheet renders `Last backed up <date>` from
the remote's `stat()` regardless of the toggle; flipping the toggle ON calls `backupNow()` →
`backupToCloud` → one fixed path, overwriting; the copy the user declined at first launch is gone with
no confirm and no message.

**Every link of that chain now behaves differently:**

- `use-cloud-backup.ts:124-126` — `backupNow()` with no argument calls **`backupToCloudGuarded`**. The
  unguarded `backupToCloud` is reachable only via `opts.replaceUnclaimed`, and its single production
  caller is the sheet's "Replace it with this device" button (`CloudBackupSheet.tsx:131`).
- `service.ts:143-145` — the guard refuses `unclaimed` **before** calling `backupToCloud`, so no write
  occurs.
- `service.ts:117-119` — `inspectRemote` compares the remote's mtime against
  `prefs.cloudBackupRemoteAt` with `===`, and an absent claim can never match (`:117` guards
  `claimedAt != null`).
- `CloudBackupSheet.tsx:97-101` — the status line stops saying *"Last backed up"* over an unclaimed
  file; it reads *"A backup from … is in iCloud — not from this device"*. This is the exact sentence
  the finding turns on, and this is the line that now produces the correct one.
- `CloudBackupSheet.tsx:104-134` — the fork is rendered as a choice (`Use the iCloud copy` /
  `Replace it with this device`), neither defaulted; `:141` disables plain "Back up now" while a
  conflict is unresolved.
- `setEnabled` (`use-cloud-backup.ts:183`) still seeds a backup, but through the guarded `backupNow()`.

**Observation is closed in the code.**

### Was the remedy right? — yes, and deliberately NOT the lens's

R1's correction (`refutations/R1-data-loss.md:162-183`) is that routing the toggle through
`shouldAutoBackup` is a no-op, because at the moment of the flip all three clauses pass. The shipped
fix **does not** do that: `shouldAutoBackup` is unchanged (`service.ts:241-245`) and its docblock now
says so explicitly (`service.ts:234-239`). The new capability is remote-awareness —
`prefs.cloudBackupRemoteAt` (`data/models.ts:138`) + `inspectRemote` (`service.ts:105-124`) — which is
precisely the real mechanism R1 named ("`shouldAutoBackup` has no clause about the remote at all").
**The fix is aimed at the real cause.**

### Question 2 — what the site ALSO did, and whether it survived

| property the site had that was RIGHT | still true? | where |
|---|---|---|
| turning the toggle ON seeds a backup immediately, so "on" ≠ "will back up eventually" | yes, when the remote is `none`/`ours` | `use-cloud-backup.ts:183` |
| `lastBackupAt` renders independently of the toggle | yes, `getCloudBackupStatus` untouched | `service.ts:206-215`; `CloudBackupSheet.tsx:99-101` |
| a *second* backup by the same install must still succeed | yes — and this is the regression with its own pin | `service.test.ts:349-352` |
| an unreachable iCloud must not read as "nothing there" | yes | `service.ts:110`; pinned `service.test.ts:295-299` |
| the sandbox may never reach iCloud | yes, unchanged | `use-cloud-backup.ts:112-115` |
| the background auto-backup path | **improved** — it now goes through the guard too (`_layout.tsx:167-168`), which the finding never reached |

⚡ **The genuinely dangerous adjacent property was `backupToCloud`'s return value.** It used to be the
caller's clock; it is now the file's **observed** mtime re-read via `stat()` (`service.ts:60-66`). Had
that stayed the clock, the recorded claim would never match the next `stat()` and **every** subsequent
backup would refuse as a foreign clobber — the feature silently dead for everyone who turned it on.
That is pinned by name at `service.test.ts:343` (*"⛔ `at` is NOT the clock it was given"*) and
`:349-352`.

Two behaviour changes I judge deliberate and correct, not regressions: "Back up now" is disabled during
a conflict (`CloudBackupSheet.tsx:141`) — the informed override is one button away at `:122-133`; and
`setEnabled` leaves the pref ON after a refusal (`use-cloud-backup.ts:181-182`), with the conflict card
rendering immediately in front of the user who just flipped it.

### Which test proves it — and where it stops

`service.test.ts:261-357` is a strong module-level pin: four `inspectRemote` states each asserted
individually (`:272-307`), the refusal with **`writeCount === 0`** (`:316-325`), the informed override
still writing (`:327-329`), the mtime regression (`:341-352`), and `restoreFromCloud` statting *before*
the read (`:360-380`).

⛔ **But the defect's own site is not pinned.** The original defect was one line —
`setEnabled` → unguarded `backupNow()`. Reverting `use-cloud-backup.ts:124-126` to
`await backupToCloud(...)` leaves the entire suite **green**: the service tests call the service
directly and never go through the hook, and `backup.spec.ts` only ever sees the `unavailable` branch.
`scripts/check-destructive-writes.ts:53` gates `importStore` only — there is **no gate on an unguarded
`backupToCloud` caller** (contrast the `ALLOWED` allow-list at `:29-38`, which is exactly the
instrument this case wants).

**Missing pin, stated precisely:** an allow-list gate over `backupToCloud(` call sites in
`apps/rn/src` — the same shape as `check-destructive-writes.ts` — plus a P6.14 device row: enable the
toggle on a device that already holds a foreign backup and confirm the file's mtime is **unchanged**
(`slices/M3-recovery.md:443`'s D-M3-3 is exactly this row).

### ⚠️ One thing the code says that the log does not

No migration stamps `cloudBackupRemoteAt` (grep over `apps/rn/src/data` and `store` finds it only at
`data/models.ts:138` and the four runtime writers). So an install that **already holds a remote it
wrote under a build before 2026-08-20** reads its own backup as `unclaimed`, and its automatic backups
silently stop until the user opens the sheet and taps "Replace it with this device". This fails **safe**
(nothing is destroyed) and the blast radius is small — `docs/DEBT_ELEVATION_PLAN.md:617` records that
the RN app has never shipped, so the only holders are TestFlight and `provider.ts` first landed
2026-08-20 (`a933e9b`) — but it is a real "backup is on and is not running" state that appears in no
log entry. **File it as a P6.14 row, not a code change.**

### Verdict

**B3 — `CLOSED-UNPINNED`.** The observation is gone, the fix targets the real mechanism rather than the
one both lenses proposed, and the one property whose breakage would have killed the feature (`at` = the
observed mtime) is pinned by name. But the defect's own line — the guarded-vs-unguarded choice at
`use-cloud-backup.ts:126` — sits above a seam no test in this repo crosses, and restoring the original
defect there leaves everything green.

---

## C9 / M3-8 (promoted half) — "Delete all data" leaves the iCloud copy

### The observation, re-derived from the current code

`SYNTHESIS.md:139-141` and `refutations/R1-data-loss.md:420-426`: *"Permanently erased… cannot be
undone"* was false; the remote survived, and the next launch's restore offer hands the previous owner's
whole plan to whoever holds the phone. `CloudBackupProvider` had **no `delete`** — structural, not a
corrected defect. The second half: `clearQuarantine` had definitions and **zero call sites** while
`adapter.ts` documented it as *"called from reset all data"*.

**Both halves are closed in the code:**

- `provider.ts:36` — `delete(): Promise<void>` now exists on the interface; the no-op stub implements
  it at `:60-64`, iOS at `createCloudBackupProvider.ios.ts:101-104` (`exists` then `unlink`, so
  "already gone" is success).
- `service.ts:194-203` — `deleteCloudBackup` gates on `isAvailable()` **first**, so a resolved no-op
  from the stub can never be read as "your backup is gone" (`:196`).
- `app/more.tsx:127-135` — the remote goes **first**, and a refusal **stops the local wipe** and
  renders the blocked panel rather than wiping and apologising to a screen that has already unmounted.
- `app/more.tsx:150` — `clearQuarantinedData()` is now called; `store/persistence.ts:219-220` routes it
  through the adapter **captured at bootstrap** (`:46`), after the sandbox refusal at `:38-41`.
- `app/more.tsx:512-513` — the sentence the finding is about now reads *"permanently erased — on this
  device and in your iCloud backup"*, which is the sentence the code keeps.

### Was the remedy right?

R1's shippable-today recommendation was **words** — *"the delete confirm must say the iCloud copy is
not included, and offer to turn backup off"* (`R1-data-loss.md:426-427`) — while flagging the real fix
as new capability. The build did the **capability**, which is the stronger answer and the one
`SYNTHESIS.md:376` chose. It did **not** do R1's "offer to turn backup off", and it did not need to on
the primary path, because the backup is now erased rather than orphaned.

### Question 2 — what the site ALSO did, and whether it survived

| property the site had that was RIGHT | still true? | where |
|---|---|---|
| dismiss to the still-mounted tabs BEFORE the reset (Freedom RN lesson #6) | yes — and hardened with `canGoBack()` | `more.tsx:143-144` |
| the reset runs after interactions settle | yes | `more.tsx:145-146` |
| the wipe reaches the persisted blob | yes, and now pinned twice | `tests/e2e/delete-all-data.spec.ts:64-67`, `:94-97` |
| a sandbox adapter must never be the one the reset erases through | yes — `activeAdapter` is set after the sandbox refusal | `store/persistence.ts:38-46` |
| "Delete all data" always completes | ⚠️ **no longer unconditionally** — see below | `more.tsx:129-134` |

⚡ **The property the fix genuinely traded away:** an irreversible control that previously always
completed can now **refuse**. On a signed-out or unreachable iPhone, "Delete everything" deletes
nothing and shows `delete-all-blocked` (`more.tsx:486-506`). I judge this correct — the alternative is
lying — and it is mitigated by the named escape `Delete on this device only` (`more.tsx:500-505`) and
by copy that says exactly what survived (`:489-490`).

⛔ **But the escape re-opens the finding's own harm, uncaught.** `handleDeleteAll({ deviceOnly: true })`
skips the remote entirely (`more.tsx:127`), wipes locally, and `onboardingComplete: false` then makes
`_layout.tsx:206-243` fire the restore Alert on the **next launch** — *"There is a backup of your plan
in your iCloud account"*. That is verbatim the handover failure mode C9 exists to close. It is
**informed** at the moment of the tap (`more.tsx:490` says the backup would survive) and its real-world
reach is narrow (the offer only fires while the previous owner's Apple ID is still signed in), but
nothing suppresses the offer and nothing turns the pref off — which is the one half of R1's
recommendation that was dropped. **Report, do not fix:** the cheapest close is
`updatePrefs({ cloudBackupEnabled: false })` on the `deviceOnly` branch.

⚠️ Minor, and only worth a line: `handleDeleteAll` became `async` and awaits the network before
`setConfirmingDelete(false)` (`more.tsx:128`, `:136`), with no in-flight disable on
`delete-all-confirm` (`more.tsx:520`) — unlike `CloudBackupSheet`'s `busy` (`:141`). A double-tap
issues two deletes; both are idempotent, so this is a wart, not a defect.

### Which test proves it

**Pinned:** `deleteCloudBackup`'s three branches individually —
`service.test.ts:392-400` (deletes, reaches the provider, and "already gone" is success),
`:407-412` (**unavailable does NOT report success, and the contents are still there** — the lie the
guard exists for), `:432-434` (a throwing unlink is contained as `error`, never as ok). The quarantine
half is pinned end-to-end at `tests/e2e/delete-all-data.spec.ts:69-72`, and the cold-entry
`router.back()` regression at `:83-98`. Both specs correctly anchor on a both-branches marker before
any absence assertion (`:48-49`, `:87-88`), which is the trap two earlier items in this phase fell
into.

⛔ **Unpinned: the call site.** `CLOUD_BACKUP_SUPPORTED` is `false` on web
(`createCloudBackupProvider.ts:25`), so `more.tsx:127`'s condition is never true under any test in this
repo — the spec says so itself at `tests/e2e/delete-all-data.spec.ts:14-17`. **Deleting `more.tsx:127-135`
outright leaves every suite green**, and with it the finding fully reopens. The blocked panel
(`more.tsx:484-507`), the retry and the device-only button have **zero** automated coverage of any kind.

**Missing pins, stated precisely:** (a) a test that can drive `handleDeleteAll` with
`CLOUD_BACKUP_SUPPORTED` true — either by injecting the constant or by extracting the delete decision
into a pure function the way `cloudBackupMessages.ts` was extracted for M3-5; (b) P6.14 device rows:
delete with iCloud signed in and `stat()` the container after; delete with iCloud signed out and
confirm **nothing local was wiped**; and the `deviceOnly` escape followed by a relaunch, to see whether
the restore offer appears.

### Verdict

**C9 — `CLOSED-UNPINNED`.** The one-method gap is genuinely filled — interface, iOS implementation,
availability-gated orchestration, remote-before-local ordering, honest copy, and the quarantine half
closed and e2e-pinned — but the branch that invokes any of it is unreachable to every test here, and
the `deviceOnly` escape still leaves a surviving remote that the next launch offers, with the pref left
on.

---

## M3-5 — the diagnosis that never reached the screen

### The observation, re-derived from the current code

`slices/M3-recovery.md:97-113`: `decodeCloudBackup` computes a specific message, `restoreFromCloud`
carries it as `message`, and then `use-cloud-backup.ts` returned `result.reason` **alone**, so
`CloudBackupSheet` rendered one fixed string for every distinct failure.

⚠️ **This finding appears in no refutation and in `SYNTHESIS.md` not at all** — I grepped the whole
audit folder; the only other hit for "M3-5" is `slices/M3-recovery.md:445`'s device row D-M3-5, which is
about push notifications, not this. So there is no refuter's verdict to check against and the
observation had to be re-derived from the code. **I confirmed the defect existed** rather than
trusting the slice: `git show 956281e -- apps/rn/src/hooks/use-cloud-backup.ts` shows
`-      if (!result.ok) return result.reason;` replaced by `+      if (!result.ok) return toCloudAction(result);`.

**The chain is now unbroken, link by link:**

- `data/cloudBackup.ts:116,119,128,137,141,147` — every failure returns a `message`; and
  `data/readBackup.ts:35-40` makes `message` a **required** field of `ReadBackupFailureResult`, so
  `decodeCloudBackup`'s `readBackup(payload)` tail at `:150` cannot produce a message-less failure.
- `service.ts:170` — `restoreFromCloud` carries it (`message: decoded.message`).
- `use-cloud-backup.ts:158` — `return toCloudAction(result)`, the line that was the defect.
- `CloudBackupSheet.tsx:55-57` → `cloudBackupMessages.ts:51-58` — `if (message) return message` at `:55`,
  ahead of the per-reason fallbacks at `:56-58`.

**Observation is closed in the code.**

### Question 3 — the implied remedy was NOT sufficient, and the build was right to exceed it

The slice's remedy is explicit: *"the actual fix — **update the app** — was computed, carried two
layers, and discarded one layer short of the screen"* (`slices/M3-recovery.md:110-112`). **That premise
is false, and I verified it in git rather than taking the log's word:** the same commit shows
`-const NO_CODEC = 'That backup was made by a newer version of Debt Planner.'` →
`+const NO_CODEC = '… Update the app, then try again.'`. The fix was **never** computed — carrying the
message alone, which is literally what the finding asked for, would have satisfied its wording and
still left the user an explanation with no action. The build added the clause
(`data/cloudBackup.ts:91`) and split `DAMAGED` out (`:96`, added in the same commit), so a corrupted
file with a **known** codec no longer tells an already-current user to go and update. Both are beyond
the finding and both are right.

### Question 2 — what the site ALSO did, and whether it survived

| property the site had that was RIGHT | still true? | where |
|---|---|---|
| `no-backup` has its own honest copy, not a failure sentence | yes | `cloudBackupMessages.ts:56`; pinned `cloudBackupMessages.test.ts:63` |
| `unavailable` has its own copy | yes | `:57`; pinned `:64` |
| a genuinely message-less error still says *something* | yes, `GENERIC_FAILURE` survives as a fallback | `:58`; pinned `:50` |
| the same `report()` serves BOTH backup and restore, with different success words | yes — `success` is a parameter | `CloudBackupSheet.tsx:55-57`, called at `:131`, `:144`, `:162` |

⚡ **The property the new ORDER could have broken, and the one the test earns its keep on:** putting
`if (message)` ahead of the fallbacks means a message riding on a *non-failure* outcome would win. B3's
`remote-unclaimed` is exactly such an outcome, and anything error-shaped there pushes the user to retry
until the guard gives way — destroying the copy B3 exists to protect. `cloudBackupMessages.ts:54`
checks it **before** the message, and `cloudBackupMessages.test.ts:55-59` asserts that with a message
deliberately planted on it. Two clusters' fixes meet on one line and the interaction is pinned.
`:68-72` covers the other order hazard — an **empty-string** message must fall back rather than render
a blank line.

### Which test proves it

`data/cloudBackupMessages.test.ts` is the strongest pin in this cluster: `:39-43` is the finding itself
(specific beats generic), `:44-47` asserts it is *genuinely not* the generic sentence rather than merely
non-empty, `:50` keeps the fallback, `:55-59` the B3 interaction, `:68-72` the empty message, and
`:79-88` `toCloudAction`'s composition end to end. Every assertion is about **order**, which is the
right subject — a test that only checked "it returns a string" would have passed against the defect.
The service half of the carry is separately pinned at `storage/cloudBackup/service.test.ts:210-220`
(*"a foreign file… with a message a human can read"*, matched against the real wording).

⛔ **Unpinned, again at the same seam.** Nothing asserts that `restoreNow` calls `toCloudAction` or
that the sheet calls `cloudBackupMessage`. Reverting `use-cloud-backup.ts:158` to
`{ result: result.reason }` leaves `test:app` and `test:e2e:rn` **green** — the module tests never go
through the hook, and `backup.spec.ts:203` only ever reaches the `unavailable` dead end. The mitigation
is real but is a review-time property, not a test: a shared covered helper makes a re-introduction a
visible deviation instead of a silent omission.

⚠️ **And the shape the module was built to prevent is still present one function away.**
`use-cloud-backup.ts:134` builds `backupNow`'s action with a hand-written literal —
`{ result: result.ok ? 'ok' : result.reason }` — not `toCloudAction`. It drops nothing **today**,
because `CloudBackupOutcome` / `GuardedBackupOutcome` (`service.ts:24-27`) carry no `message`. The
moment either gains one, this is M3-5 verbatim. The log's claim that `toCloudAction` makes carrying the
message *"not a line anyone has to remember"* is therefore true of the restore path only.

**Missing pins, stated precisely:** a test that drives `restoreNow` against a fake provider holding a
foreign blob and asserts the returned action's `message` is non-generic (the hook is a React hook, so
this needs either a renderer or the `restoreNow` body extracted); and a P6.14 device row — put a
non-Debt-Planner file in the container and confirm the sheet shows *"That iCloud file isn't a Debt
Planner backup."* rather than *"That didn't work."*

### ⚠️ Two of three sites are still open, correctly filed

The log's "site list is 1 of 3" holds against the code: `app/_layout.tsx:217` (`if (!result.ok) return;`
— the whole failure discarded, silently) and `components/DataResetScreen.tsx:64-68` (a failed probe
just means no button appears) both still drop the diagnosis. Those are **M3-7**, explicitly out of
cluster d's scope, and I confirm they were filed rather than quietly absorbed.

### Verdict

**M3-5 — `CLOSED-UNPINNED`.** The diagnosis now reaches the screen, and the build correctly identified
that the finding's own remedy — carry the message — would have shipped a user an explanation with no
action, so it added the missing clause and split the damaged case out; but the one line that was the
defect sits above the seam no test in this repo crosses.

---

## Cluster close — three notes for whoever reads this next

**1 · All three verdicts are `CLOSED-UNPINNED`, and it is the SAME gap three times.** In each case the
module below the provider seam is well tested — `service.test.ts` and `cloudBackupMessages.test.ts` are
genuinely good, with individual refusals, order assertions and negative assertions — and in each case
the **one line that was the defect** lives above that seam, in `use-cloud-backup.ts` or `more.tsx`,
where `CLOUD_BACKUP_SUPPORTED = false` means no test in this repo has ever executed it. Restoring any
of the three original defects leaves every suite green:

| id | the line to revert | what stays green |
|---|---|---|
| B3 | `use-cloud-backup.ts:126` → `backupToCloud` | `test:app`, `test:e2e:rn` |
| C9 | delete `more.tsx:127-135` | `test:app`, `test:e2e:rn` (both delete specs) |
| M3-5 | `use-cloud-backup.ts:158` → `{ result: result.reason }` | `test:app`, `test:e2e:rn` |

⚡ **The cheapest single instrument that would close all three** is not a test — it is an allow-list
gate in `scripts/`, the shape `check-destructive-writes.ts` already proves works: name the sanctioned
callers of `backupToCloud(` and of the `CLOUD_BACKUP_SUPPORTED` branch, with a reason each. It catches
the class ("someone changed which function this site calls") that a device row cannot, and it runs in
`lint:rn`. The device rows are still needed for the iOS-only behaviour, but they answer a different
question.

**2 · The wrong-mechanism warning was well founded, and the builds respected it.** Both B3 and M3-5
ship fixes that deliberately do **not** implement their finding's stated remedy — B3 leaves
`shouldAutoBackup` untouched and adds remote-awareness instead; M3-5 adds the "Update the app" clause
the finding assumed already existed. I verified the second in git rather than from the log. Neither is
a case of a fix aimed at the wrong cause.

**3 · One correction to the brief.** The assignment says B3 also appears in
`refutations/R6-onboarding-tier.md`. It does not — `R6-onboarding-tier.md:199` is a reference to
`DEBT_3.5_DEVICE_QA_CHECKLIST.md`'s **§B3.1**, about confetti jank, and is unrelated. B3's refutation
is `refutations/R1-data-loss.md:130-206` (`R1-M3-3 / R1-W1-2`), which is what I read.

⚠️ Also: this cluster's brief lives at
`docs/audits/2026-08-21-p6.8-finish/docs/audits/2026-08-24-p6.8.9-verification/BRIEF.md` — a nested
duplicate path, almost certainly a `cd` mistake at authoring time. This file is written at the
un-nested path the assignment named. **Do not fix by moving blindly**; confirm which path the other
clusters' verifiers used first.
