# M3 — RECOVERY & DEAD ENDS

> **Lens M3** of the P6.8 pre-release audit · repo `debt-app-v1` · branch `v1.7-dev` · commit `dd80f70`.
> **Question:** when something goes wrong, does the user have a way out?
> **External reference:** the set of things that actually go wrong on a real phone — storage refusing to
> open, a write failing, a declined restore, a corrupt backup, a foreign file, no network, a denied
> permission, biometrics unavailable, a lapsed subscription, a migration that half-succeeds, a wipe.
>
> **A finding here is: no surface, no words, or no action — or words that misdescribe what happened.**
> Preference is explicit: *"the user is stuck"* over *"the code is wrong."*

**Status:** COMPLETE — 20 findings. Wave-2 refutation owed on M3-1, M3-2, M3-3, M3-20.

---

## Findings

### M3-1
**Severity:** blocker
**Failure:** the local store is corrupt / unmigratable at launch (the `hydrate` catch)
**What happens:** `apps/rn/src/store/store.ts:263-275`. `runMigrations(raw)` throws → the bytes are
quarantined, `set({ isHydrated: true })`, and **`adapter.write(get().store)` overwrites the blob with
`createDefaultStore()`**. `storageError` is left `null`, so the branch at `_layout.tsx:219` does not fire
and no banner renders. `createDefaultStore()` has `onboardingComplete: false`, so the route guard at
`_layout.tsx:265` sends the user to `onboarding`.
**What the user sees:** the **first-launch onboarding flow**. Not one word about what happened. Every
debt, expense, goal and setting is gone from the screen, and the app is cheerfully asking them to set up.
**Way out:** **none offered.** The bytes *are* preserved (`quarantine.migration-failed.<ts>` in MMKV,
`storage/createAdapter.ts:39-41`), but **nothing in the app ever reads a quarantine key** — no recovery
screen, no "we found a problem with your data" surface, no export of the quarantined blob, no mention in
any copy. A user with their own exported backup could Import, but nothing tells them anything happened,
so they have no reason to.
**Confidence:** high — traced end to end; the absence of any quarantine reader is a repo-wide grep
(`quarantine` appears in `adapter.ts`, both `createAdapter*.ts`, `store.ts`, `migrateFromLegacy.ts`,
`migrationAudit/doors.ts` and comments — in no component).

---

### M3-2
**Severity:** blocker
**Failure:** a v1.6 debt whose `balance` is `null` — the state `migrations.ts` says it **measured in the
wild** — is repaired to `0`, and the repair is never shown
**What happens:** `apps/rn/src/data/migrations.ts:44-53` — `readMoney(null)` returns
`{ value: 0, repaired: true }`; the repair is pushed onto `repairs` and lands as `store.dataRepairs`
(`migrations.ts:177`). The header comment states the design explicitly: *"coerce silently (a $12,000 debt
renders as PAID OFF — wrong and invisible, the worst of the three) … Only the last one lets the person
find out."*
**What the user sees:** **`dataRepairs` is rendered by nothing.** Repo-wide it appears only in
`defaults.ts:43`, `migrations.ts:177`, `models.ts:229` and `migrationAudit/invariants.ts` — no screen,
card, banner or More row. So the shipped behaviour **is** option one: a $12,000 card shows $0.00 and reads
as paid off, invisibly. The comment beside it — *"a notice that will not go away is one people learn to
dismiss"* — describes a notice that does not exist.
**Way out:** none. The user cannot tell a repaired balance from a real one, so they cannot know to
re-enter it. `(whole list unreadable)` (`migrations.ts:74`) — an entire debts array silently replaced by
the empty default — lands in the same unread field.
**Confidence:** high on the missing surface (grep). Medium on frequency — `migrations.ts` asserts
`balance: null` exists in real v1.6 stores; I did not verify that against a real container.

---

### M3-3
**Severity:** blocker
**Failure:** iCloud restore declined (or never offered) → the user opens More → iCloud backup and turns
the toggle **on**
**What happens:** `apps/rn/src/hooks/use-cloud-backup.ts:100-107` — `setEnabled(true)` writes the pref and
then, when `status === 'ready'`, **immediately calls `backupNow()`**. `backupNow` calls `backupToCloud`
directly; it does **not** pass through `shouldAutoBackup` (`storage/cloudBackup/service.ts:110-114`) — the
clobber guard whose second clause is precisely *"a declined restore … If the app then backs up the bare
local plan, that remote is gone and 'restore later from More' has quietly become impossible."* The
provider writes one fixed path and overwrites (`createCloudBackupProvider.ios.ts:24`).
**What the user sees:** the sheet is showing `Last backed up 3/14/2026 at 9:02 AM` — from `stat()`, which
reports the remote **regardless of the toggle** — directly above an OFF switch. They flip it on, a
completely reasonable first move for someone who came here to get their backup, and the status line
silently re-renders with **today's** time. No confirm, no warning, no mention that anything was replaced.
**Way out:** **none — the backup is gone.** "Restore from iCloud" now returns what they just wrote. The
one guard built for exactly this is bypassed by the control most likely to be tapped first, and the
comment defending the bypass (*"Manual 'Back up now' deliberately does NOT pass through here: the user is
standing in front of that one"*) reasons about a **button labelled "Back up now"** — not about an
**enable switch that backs up as a side effect**, which the user did not ask for and is not told about.
**Confidence:** high — the call chain is three lines and unconditional.

---

### M3-4
**Severity:** major
**Failure:** "Back up now" tapped from a device whose local copy is the bad one
**What happens:** `CloudBackupSheet.tsx:88-98` — one tap, straight to `backupNow()`. Compare the restore
path immediately below: two taps, a `danger` variant, and `cloud-restore-warning` reading *"Restoring
replaces everything on this device with the copy in iCloud. This can't be undone."*
**What the user sees:** `Backed up.` The sheet's own comment says *"The warning names what is LOST"* — but
only in one direction. Backup is equally destructive in the other, and says nothing.
**Way out:** none after the fact — one file, no version history.
**Confidence:** high.

---

### M3-5
**Severity:** major
**Failure:** iCloud restore fails — corrupt blob, foreign file, or a backup from a newer build
**What happens:** `decodeCloudBackup` (`data/cloudBackup.ts:104-140`) computes a **specific, actionable**
message: `"That iCloud file isn't a Debt Planner backup."` or `"That backup was made by a newer version of
Debt Planner."` `restoreFromCloud` carefully carries it through as `message`
(`storage/cloudBackup/service.ts:69`). Then `use-cloud-backup.ts:88` returns **`result.reason` only** —
`'error'` — and `message` is dropped. `CloudBackupSheet.tsx:44-53` maps `'error'` to one fixed string.
**What the user sees:** `That didn't work. Your data on this device is unchanged.`
**Way out:** none suggested. In the "newer version" case the actual fix — **update the app** — was
computed, carried two layers, and discarded one layer short of the screen. The user is given a generic
failure for a condition the code diagnosed exactly.
**Confidence:** high.

---

### M3-6
**Severity:** major
**Failure:** no network, or the iCloud file has not materialised yet on a fresh device
**What happens:** `createCloudBackupProvider.ios.ts:38-53` — `readWithDownload` triggers a sync then polls
`6 × 700 ms`. If the download has not landed inside **~4.2 s** it returns `null`. `restoreFromCloud`
(`service.ts:63`) maps `null` → `reason: 'no-backup'`.
**What the user sees:** `There is no backup in iCloud yet.` — a flat statement about the remote, delivered
when the truth is "we did not manage to fetch it in four seconds."
**Way out:** tap Restore again. Nothing tells them to, and nothing distinguishes this from the genuinely
empty case. The function's own header says *"This is exactly the moment the feature has to work — a new
device, restoring"* — and the timeout surfaces as the one message that tells the user to stop trying.
**Confidence:** medium-high — the code path is certain; whether 4.2 s is short in practice is device-owed
(→ P6.14).

---

### M3-7
**Severity:** major
**Failure:** the one-shot first-launch restore offer, when the read does not succeed
**What happens:** `apps/rn/src/app/_layout.tsx:191-197` — `const result = await restoreFromCloud(...); if
(!result.ok) return;`. **All three failure reasons are swallowed identically and silently:** `unavailable`
(not signed into iCloud yet on a new phone), `no-backup` (including M3-6's timeout), and `error` (corrupt).
The effect is guarded by `offeredRestore.current`, so it does not retry within the session.
**What the user sees:** **nothing.** The onboarding flow, as if they were a new customer.
**Way out:** More → iCloud backup → Restore from iCloud — but only *after* they finish onboarding, and
**nothing anywhere signposts it.** This is the most likely real-world "my data didn't come back" sequence:
new phone → iCloud not ready → silent no-offer → fresh onboarding — and then M3-3 destroys the remote the
moment they go looking for it.
**Confidence:** high.

---

### M3-8
**Severity:** major
**Failure:** the user taps "Delete all data"
**What happens:** `more.tsx:107-111` → `appStore.getState().reset()` → `store.ts:296-299`: fresh defaults,
autosave persists. **Two things it does not touch:**
1. **The iCloud backup.** Nothing deletes the remote file. And because `reset()` sets
   `onboardingComplete: false`, the **next launch actively offers it back** (`_layout.tsx:188-190` —
   `if (isOnboarded(...)) return;` no longer blocks). A phone wiped for handover offers the previous
   owner's plan to the next person, in an Alert.
2. **The quarantine.** `StorageAdapter.clearQuarantine` is documented at `storage/adapter.ts:15` as
   *"(called from 'reset all data')"*, is implemented in both adapters — and is **called from nowhere**
   (grep: only the two definitions, the `MemoryStorageAdapter` stub, and comments).
**What the user sees:** *"All debts, expenses, goals, and settings will be **permanently erased**. This
cannot be undone."* (`more.tsx:419-421`)
**Way out:** the sentence is wrong in both directions at once. It **is** undoable (More → iCloud →
Restore) — and this copy is exactly what stops a user who deleted by mistake from trying. And it is **not**
an erasure — a full copy survives in iCloud and quarantined blobs survive in MMKV.
**Confidence:** high on both mechanisms.

---

### M3-9
**Severity:** major
**Failure:** a write fails (`storageError === 'save-failed'`)
**What happens:** `store.ts:284-290` records it; `SaveFailedBanner.tsx` renders it. The only two things
that can retry a save are (a) the autosave subscription, which fires on the **next** `state.store` change
(`persistence.ts:98-106`), and (b) `flushPendingSave`, which is a no-op unless a debounce `timer` is
pending (`persistence.ts:126-128`) — and after a save attempt the timer has already been cleared. So if
the user **stops editing**, nothing retries, ever. `storageError` is transient top-level state, not part
of `store`, so it is **not persisted**: at next launch the banner is gone and the change is simply absent,
with no second notice.
**What the user sees:** *"Couldn't save your last change to this device. It's still here — we'll keep
trying."*
**Way out:** **no action on the banner at all** — no Try again, no tap target, no route to Export (which
would work, since `ExportBackupSheet` serialises from memory and is the one thing that could actually save
their data). "It's still here" is true only until the app is killed; "we'll keep trying" describes
behaviour that only occurs if the user happens to edit something else.
**Confidence:** high on the retry mechanism (traced through both call sites). The copy critique follows
from it.

---

### M3-10
**Severity:** major · **[STRUCTURAL]**
**Failure:** storage does not open, and the retry keeps failing
**What happens:** `_layout.tsx:219-231` renders `StorageErrorScreen` with one action, which re-runs
`startPersistence()`. Two causes land here: a rejected `adapter.read()` (`store.ts:255`) and a **throwing
`createStorageAdapter()`** (`_layout.tsx:69-74`) — MMKV native-module init. The second is not transient.
**What the user sees:** *"Couldn't open your data / Your plan is still on this device — the app just
couldn't read it this time. This is usually temporary. Try again, and if it keeps happening, restart your
phone."* The copy is careful and correct, and the doc comment reasoning behind it is right.
**Way out:** **one button, forever.** After the phone restart the sentence recommends, the screen offers
nothing else: no way to reach Export, no way to reach iCloud restore (this screen renders **above** the
router, so More is unreachable), no support contact, and no "start with a fresh plan" escape that would at
least let them use the app. A user whose data *is* in iCloud is looking at a screen that cannot get to it.
**[STRUCTURAL]** because every candidate exit is new capability, not a corrected defect.
**Confidence:** high on the surface and its single action. Medium that a permanently-failing adapter is
reachable in the wild — device-owed (→ P6.14).

---

### M3-11
**Severity:** major
**Failure:** notification permission granted, then **revoked later in iOS Settings**
**What happens:** permission is read **only** inside `more.tsx:74-101`, at the moment the switch is
flipped on. `use-notification-sync.ts` never checks permission — it calls `syncNotifications` on every
relevant change (`use-notification-sync.ts:38-44`), and `notifications.ts` never consults
`getPermissionsAsync` outside `requestNotificationPermissionDetailed`. `prefs.notificationsEnabled` stays
`true` and is what the switch renders (`more.tsx:264`).
**What the user sees:** the More row reads **Notifications · ON**, subtitle *"Paycheck-eve reminder and
due-date alerts."* — indefinitely. Nothing is ever delivered.
**Way out:** **none, because nothing tells them.** The `blocked` branch's excellent copy (*"iOS only asks
once. You can turn them back on in Settings."* + an **Open Settings** button) exists but is only reachable
by toggling OFF and back ON — which a user with no reason to suspect anything will never do. Premium's
Guardian risk push is sold on the paywall and lives entirely on this permission.
**Confidence:** high on the code (no foreground permission re-check exists anywhere). The user-visible
silence is device-owed (→ P6.14).

---

### M3-12
**Severity:** major
**Failure:** the premium Guardian risk push, when the OS will not deliver it
**What happens:** `notifications.ts:170-177` — `scheduleRiskNotification` **`return true`
unconditionally** after awaiting `schedule(...)`. Its own header claims the opposite: *"Returns whether a
push was actually scheduled, so the caller only stamps the notify-state / push-log when one really went
out."* It reports success for anything `scheduleNotificationAsync` accepts, delivered or not. And if
`schedule()` **rejects**, `use-notification-sync.ts:63-70` runs `void scheduleRiskNotification(...)
.then(...)` with **no `.catch`** → an unhandled rejection, and `applyRiskNotified` never stamps.
**What the user sees:** either (a) the app records "notified" against a push that was never delivered —
burning one of the ≤2-per-rolling-month allowance and suppressing the next real one — or (b) nothing
stamps and the same decision re-fires on every evaluation. Either way, **no words**.
**Way out:** none. A premium subscriber who bought the heads-up gets silence and no indication anything is
wrong. Pairs with M3-11: the most likely cause of both is a permission the app stopped checking.
**Confidence:** high that `return true` is unconditional and the `.catch` is absent. **Medium** on which
of (a)/(b) occurs — that depends on whether `expo-notifications` rejects or resolves when permission is
denied, which only a device settles (→ P6.14).

---

### M3-13
**Severity:** major
**Failure:** App Lock is on and `authenticate()` **throws** rather than returning false
**What happens:** `use-app-lock.ts:20-29` — `void authenticate().then((ok) => { if (ok)
setIsLocked(false); }).finally(...)`. **No `.catch`.** `authenticate` awaits `hasHardwareAsync()`,
`isEnrolledAsync()` and `authenticateAsync()` (`lib/app-lock.ts:12-26`); a rejection from any of them
leaves `isLocked` true, produces an unhandled rejection, and `authing` correctly returns to false — so the
button becomes tappable again and does exactly the same nothing.
**What the user sees:** *"Debt Planner is locked / Unlock with Face ID, Touch ID, or your passcode."* and a
single **Unlock** button that flashes *"Unlocking…"* and returns.
**Way out:** **none on the overlay.** No "Use passcode instead", no "Turn off App Lock", no support line,
no explanation. `AppLockGate` renders `StyleSheet.absoluteFill` over the entire app
(`AppLockGate.tsx:26-39`), so their whole financial plan is behind it. The deliberate fail-open covers *no
hardware / nothing enrolled* — the common case, and it is correct — but it does **not** cover *the call
threw*, which is the one shape the doctrine's own comment (*"never trap the user out"*) is written against.
**Confidence:** high that the `.catch` is missing and the overlay has no second affordance. **Medium** on
how often `expo-local-authentication` rejects on a real device (→ P6.14).

---

### M3-14
**Severity:** minor
**Failure:** App Lock switched on by a user with no biometrics and no device passcode
**What happens:** `more.tsx:270` writes `appLockEnabled` unconditionally — it never calls
`canUseAppLock()`. That function is exported from `lib/app-lock.ts:12` and, repo-wide, is called from
**exactly one place: inside `authenticate` itself.** So `isLocked` is true at launch, the auto-prompt runs,
`authenticate` fails open, and the lock dissolves instantly.
**What the user sees:** a switch that reads **ON** beside *"Require Face ID / passcode to open."* — a claim
the app is not honouring. Possibly a one-frame flash of the lock overlay at each launch.
**Way out:** not a trap (this is the safe direction), but the words misdescribe the state. The user
believes their debts are protected on a shared device and they are not.
**Confidence:** high on the code. The visible flash is device-owed.

---

### M3-15
**Severity:** major · **[STRUCTURAL]**
**Failure:** the subscription lapses while the user is mid-plan
**What happens:** `premiumSync.ts:35-41` — RevenueCat's listener (or the next cold launch's
`getCustomerInfo`) resolves without the entitlement, `apply` calls `setSubscriptionPlan('free')`, and
`store.ts:563-565` flips one field.
**What the user sees:** **nothing is said, anywhere.** A repo-wide search for lapse/expiry copy finds only
the paywall's Apple-required auto-renew disclosure and an unrelated *trial obligation* card. What
disappears next launch, silently: the Guardian's safe-move and lookahead
(`PaydayGuardianCard.tsx:199-200`), the recovery plan (`(tabs)/index.tsx:147`), the proof strip and
forecast link (`:156-157`), projected balances (`withProjectedBalances(store, isPremium)`), stale-balance
verification (`money.tsx:467`), debt rescan (`DebtSheet.tsx:149`), the Payday Live Activity, the More
toggle that controls it, and the risk push.
**Way out:** the user has to work out for themselves that something ended and find the paywall. To the
codebase's credit **no data is lost** — there are no premium-only entities and no free-tier caps — and
`cushion-forecast.tsx:44-57` explicitly handles a lapsed arrival with an EmptyState and a CTA. That one
screen is the only place the lapse is acknowledged at all.
**[STRUCTURAL]** — a "your Premium ended" surface is new capability.
**Confidence:** high on the silence (grep). High on no data loss.

---

### M3-16
**Severity:** major
**Failure:** iCloud restore offered and **declined** — does "restore it later from More" still work?
**What happens:** **Verified: yes, but only by accident of a default.** `declinedRestore` is a `useRef`
(`_layout.tsx:104`), consumed by `shouldAutoBackup` (`service.ts:110`). It survives only for the process —
but that does not matter, because the *first* clause `store.prefs?.cloudBackupEnabled !== true` already
refuses, and `cloudBackupEnabled` is **absent from `createDefaultStore()`** ([D47], default off). So
auto-backup is suppressed twice over and the remote is safe. The declared mechanism is therefore load-
bearing only in the case where the user has *already* enabled backup — which on a fresh, not-yet-onboarded
install cannot be true, because More is behind the onboarding route guard.
**What the user sees:** after tapping "Not now", **nothing again, ever.** `offeredRestore.current` blocks a
second offer this session, and once onboarding completes `isOnboarded(...)` blocks it on every future
launch (`_layout.tsx:189`). No banner, no More badge, no onboarding line, no mention that a backup is
sitting in iCloud.
**Way out:** More → iCloud backup → Restore from iCloud. It works — and it is **completely unsignposted**,
so it depends on the user remembering an Alert they dismissed. Worse, the two most prominent controls on
that same sheet (the enable toggle, M3-3; "Back up now", M3-4) **destroy** the thing they came for, in one
tap, with no warning.
**Confidence:** high.

---

### M3-17
**Severity:** minor
**Failure:** a long cloud restore/backup with no progress words
**What happens:** `use-cloud-backup.ts` sets `busy`, which only **disables** the buttons
(`CloudBackupSheet.tsx:96, 116, 137`). `readWithDownload` can take ~4.2 s (M3-6).
**What the user sees:** a Restore button that greys out and does nothing visible for four seconds. No
spinner, no label change (contrast the paywall, which does both: `ActivityIndicator` + `'Starting…'`).
**Way out:** waiting. Low risk, but "it looks frozen" is what produces the double-tap and the force-quit.
**Confidence:** high on the code; the perceived duration is device-owed (→ P6.14).

---

### M3-18
**Severity:** minor
**Failure:** "Delete all data" silently discards the iCloud-backup preference
**What happens:** `reset()` installs `createDefaultStore()`, in which `cloudBackupEnabled` **does not
exist** (`defaults.ts:49-61` — it is absent, not `false`). A user who had backup on and deletes their data
to start over has backup off afterwards, with no note.
**What the user sees:** nothing. Their next plan is not being backed up and they believe it is.
**Way out:** re-enable it in More — which, per M3-3, immediately overwrites the remote they may still want.
**Confidence:** high.

---

### M3-19
**Severity:** minor · **[STRUCTURAL]**
**Failure:** a screen throws during render
**What happens:** there is **no error boundary in the app at all** — repo-wide, `ErrorBoundary`,
`componentDidCatch` and `getDerivedStateFromError` have zero occurrences in `apps/rn/src`. `wrapRoot`
(`utils/sentry`) is instrumentation, not recovery, and no route file exports the `ErrorBoundary` that Expo
Router would pick up.
**What the user sees:** whatever expo-router's built-in fallback shows in a release build — nothing the
product authored, and no reassurance that their data is intact.
**Way out:** force-quit and relaunch, undirected.
**Confidence:** **medium** — the absence of app-authored boundaries is certain; what expo-router's default
renders in a production build is not something I can settle from source (→ P6.14).

---

## Things I checked that are NOT findings

Recorded so a refuter does not re-derive them, and so the slice is not read as uniformly negative.

- **A foreign file imported.** `detectBackupFormat` → `readBackup` refuses with a named message
  (`"That isn't a Debt Planner backup. (<detail>)"`), the error renders in-sheet with a danger border, the
  text stays in the field, and the sheet is still open with both doors available. **Surface, words and
  action all present.** The two-tap `describeBackup` summary before a destructive replace is the strongest
  recovery affordance in the app.
- **A picker cancel** is deliberately silent (`BackupSheets.tsx:104-109`) — correct; a cancel is not a
  failure.
- **RevenueCat unreachable.** `premiumSync.ts:47-49` never downgrades on a failed fetch, and the
  `unresolved` third state (`premiumKind.ts`) stops the app claiming a kind it does not know and withholds
  a manage-link that would be dead. This is genuinely well handled; the residual gap is M3-15 (a real
  lapse says nothing), not this.
- **Paywall offline.** `paywall.tsx:151-162` fails loud with an error card + retry rather than showing
  unpurchasable static prices, and both purchase and restore have specific outcome copy — including the
  charged-but-not-entitled case, which names Restore *and* support.
- **The store never overwrites a blob it could not read.** `hydrate`'s throw path
  (`store.ts:248-257`) plus `persistence.ts:56-60` declining to install autosave is the correct doctrine
  and the reason M3-10 is a dead end rather than a data-loss event.
- **`shouldAutoBackup`'s three refusals are right** — the defect is that the manual path routes around
  them (M3-3), not the guard.
- **The v1.6 bridge is non-destructive and structurally idempotent** — the source survives a failed
  migration and the next launch retries. The finding against it is that the user is never told (M3-20
  below).

---

## Late finding

### M3-20
**Severity:** major
**Failure:** the v1.6 → v1.7 migration fails, or partially succeeds
**What happens:** `persistence.ts:113-124` — `runLegacyBridge` calls `migrateFromLegacy`, then
**`if (!outcome.migrated || migrated === null) return;`**. The `LegacyMigrationOutcome` is discarded
whole: `reason`, `read`, `map`, `quarantined` and `quarantineFailed` — every field `migrateFromLegacy.ts`
built specifically so a silent no-op would be *diagnosable* — go nowhere. `reportError` sends some of it
to Sentry. **Sentry is not a user.**
**What the user sees:**
- **Total failure** (read threw · `truncated` search · migration threw): the **onboarding flow**. To a
  v1.6 customer who just updated, the update deleted their entire plan. No words.
- **Partial success**: their plan appears with items missing. `LegacyMapReport.dropped` / `.unknown`
  (`mapLegacyStore.ts:38-40`) records exactly what did not come across — and nothing renders it. The
  **file-import door does the opposite**: `describeBackup` (`readBackup.ts:180-190`) shows the counts *and*
  names the dropped items before the user commits. Two doors onto the same data, one honest and one mute.
**Way out:** the next launch retries (idempotence is structural, and the v1.6 source is never deleted) —
which is genuinely good engineering, and **the user is not told to relaunch, or that anything failed, or
that their old data still exists.** They are looking at a setup wizard.
**Confidence:** high that the outcome is discarded. Medium on failure rate — the bridge is carefully
written and `runMigrations` was made total, so the *total-failure* branch should be rare; the
*partial* branch (`dropped`/`unknown` non-empty) is the ordinary case by construction.

---

## What I could not judge

1. **Whether `expo-notifications` rejects or silently resolves when permission has been revoked.** It
   decides which half of M3-12 the user gets (a false "notified" stamp, or a re-firing decision plus an
   unhandled rejection). Source cannot settle it.
2. **Whether `expo-local-authentication` ever rejects on a real device** (M3-13). The missing `.catch` is
   certain; its reachability is not. A simulator with biometrics enrolled then removed mid-session is the
   cheapest probe.
3. **Whether MMKV's `createMMKV` can fail persistently** (M3-10). If it cannot, M3-10 drops to minor.
4. **Whether ~4.2 s is enough for an iCloud ubiquity file to materialise on a fresh device** (M3-6). This
   is the single highest-value device measurement in this slice: if it is not enough, M3-6 + M3-7 + M3-3
   compose into "new phone, backup silently reported absent, then destroyed."
5. **What expo-router's default error fallback renders in a release build** (M3-19).
6. **Whether the App Lock overlay flashes before failing open** on a device with nothing enrolled (M3-14).
7. **Real-world v1.6 container shapes** — M3-2's premise (`balance: null` in the wild) is asserted by
   `migrations.ts` from a measurement I did not repeat.

---

## Proposed P6.14 device rows

| # | row | settles |
|---|---|---|
| **D-M3-1** | Fresh-install iCloud restore on a device where the backup file has **not** been downloaded: install, launch, watch for the offer, time `readWithDownload` | M3-6, M3-7 — the highest-value row here |
| **D-M3-2** | Airplane mode → More → iCloud backup → Restore. Record the exact message and the wait | M3-6, M3-17 |
| **D-M3-3** | Enable the iCloud toggle on a device that **already has** a remote backup; `stat()` the file before and after | **M3-3** — confirms the clobber on real hardware |
| **D-M3-4** | Grant notifications, revoke in iOS Settings, use the app for a full paycheck cycle. Does anything ever arrive? Does More still say ON? | M3-11, M3-12 |
| **D-M3-5** | Premium + at-risk cycle with notifications revoked: does the push-log stamp? does it re-fire? | M3-12 |
| **D-M3-6** | App Lock on → remove Face ID enrolment mid-session → background → foreground. Does it fail open or trap? | M3-13, M3-14 |
| **D-M3-7** | App Lock on with **nothing** enrolled: is there a visible lock flash at launch? | M3-14 |
| **D-M3-8** | Corrupt the MMKV blob on a real device and relaunch. Confirm the user lands in onboarding with no message, and that the quarantine key exists but is unreachable | **M3-1** |
| **D-M3-9** | Real v1.6 container → update in place. Capture `LegacyMigrationOutcome` and `dataRepairs`; confirm neither reaches a screen | M3-2, M3-20 |
| **D-M3-10** | Let a sandbox subscription lapse. What does the user see at the moment premium surfaces disappear? | M3-15 |
| **D-M3-11** | Force a write failure (fill the device / revoke the container) and confirm the banner appears, then stop editing and confirm nothing retries | M3-9 |
| **D-M3-12** | Delete all data, relaunch, and confirm the app offers the previous plan back from iCloud | M3-8 |

---

## Summary — the shape of it

**Three blockers, all the same shape:** the app does the *correct* thing with the data and says *nothing*
to the person. M3-1 (corrupt store), M3-2 (repaired money) and M3-20 (failed migration) each preserve or
record what happened in a field, a quarantine key or an outcome object built expressly so someone could be
told — and in all three the last hop to a screen was never built. The codebase's doctrine is
*quarantine-don't-destroy*; what is missing is *and then say so*.

**M3-3 is the different one, and the most dangerous:** it is not silence, it is a guard the code wrote for
exactly this failure being routed around by the one control a recovering user is most likely to touch
first. It is also the only finding here that destroys data that is otherwise recoverable.

**The best-handled failures are the ones with a designed screen** — the file importer, the paywall,
`StorageErrorScreen`, the notification `blocked` branch, and the `premiumKind` unresolved state are all
genuinely good. The pattern is exact: **where a surface was designed, the recovery is excellent; where the
error path terminates in a `return`, the user gets nothing.** Seven of the twenty findings are a bare
`return`, a discarded `message`, or an unrendered field.
