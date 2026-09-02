# C3 — pass 7 findings
Lane C3 · subject: routes + surfaces outside the app (widget, Siri, Lock Screen, notifications, hooks, theme).
Manifest: 75 files · 9,532 lines. Branch `v1.7-dev`.

⚠️ Nothing in this repo builds the Swift target. Every claim about what a widget/Siri/Live-Activity
surface *renders or speaks* is a **source-scan finding** unless stated otherwise.

---

## C3-1 — `blocker` · Siri is handed `"$0"` as the balance of the one debt the app has just refused to state a balance for

**Origin:** `fix-churn` (`apps/rn/src/widget/snapshot.ts`).

**User-facing consequence.** A premium user says *"log a payment in Debt Planner."* Siri offers the debt
list. The card whose balance the app **could not read** — the one every in-app surface captions and every
other field of this same payload refuses to state — is offered as **`Chase · $0`**. `DebtEntity`'s
`displayRepresentation` puts that string in the `subtitle` slot
(`apps/rn/plugins/app-intents-swift/LogPaymentIntent.swift:45`), so the user is shown a paid-off-looking
row for a debt the app knows it lost the balance of. `$0` is not a caption, a sentinel, or a dash: it is a
money figure, stated about the user's money, on a surface they cannot open the app to check.

**File and line.** `apps/rn/src/widget/snapshot.ts:256-262` — `debtsJson`.

```ts
debtsJson: JSON.stringify(
  [...live, ...partitionDebts(store).unreadBalance].map((d) => ({
    id: d.id, name: d.name, balance: formatWhole(d.balance),
  })),
),
```

**The measurement.** One store, built through the real `runMigrations` (the import path that writes the
repair records), premium, two debts — `Chase` with `balance: 'n/a'`, `Visa` with `balance: 4000`.
Probe: `docs/audits/2026-09-02-s1-money-pass7/c3-probes/probe1-debtsjson.ts`. Printed:

```
pendingDataRepairs = [{"entity":"debt","id":"a","name":"Chase","field":"balance","kind":"lost","count":1}]
mayClaim('debt-balances') = false
mayClaim('row-figures')   = false
partition.unreadBalance   = [ 'Chase:0' ]
snap.remaining            = "—"
snap.debtFreeDate         = "Balances unread"
snap.pctLabel             = "—"
snap.balancesUnread       = true
snap.debtsJson            = [{"id":"b","name":"Visa","balance":"$4,000"},{"id":"a","name":"Chase","balance":"$0"}]
formatWhole(0)            = "$0"
```

⚡ **Four fields of one payload refuse and the fifth asserts `$0`, on the same store at the same instant.**
The variable is `debtsJson`; everything else is held.

**Mechanism (HYPOTHESIS).** `partitionDebts` routes a debt into `unreadBalance` precisely when its
`balance` was repaired to `0` (`trustSelectors.ts:155-159` — `d.balance > 0` fails, `rowFieldUnread(...)`
succeeds). So every member of that array has `balance === 0` **by construction**, and
`formatWhole(0) === '$0'`. Pass-6 `C3-4` correctly widened the *membership* of this list — the debt used
to vanish from Siri entirely — but the `.map` that formats it was left reading the repaired number.
The fix moved the row into the list and did not move the figure it prints with it.

⚡ **This module's own claim table already says so.** `snapshot.ts:216` computes
`mayStateBalances = mayClaim('debt-balances') && mayClaim('row-figures')`, and `'row-figures'` is defined
in `trustSelectors.ts:198` as *"A single row restating its own money"* — which is exactly what a
`DebtEntity` subtitle is. On the measured store that claim is `false`. `debtsJson` is the only
money-bearing field in the returned object that is not gated on it.

**Remedy — UNVERIFIED, not applied.** Give the unread members a balance string that is not a figure. The
`WidgetSnapshot` interface already has the vocabulary — `'—'` is what `remaining` and `pctLabel` use for
this exact state — so something of the shape

```ts
[...live.map((d) => ({ id: d.id, name: d.name, balance: formatWhole(d.balance) })),
 ...partitionDebts(store).unreadBalance.map((d) => ({ id: d.id, name: d.name, balance: '—' }))]
```

⚠️ **I did not run this and it is a hypothesis about a Swift render I cannot execute.** Two things must be
checked before it is believed: (a) `DisplayRepresentation(subtitle:)` renders a bare `—` acceptably rather
than as an empty row, and (b) the *live* rows keep the confirmed figure — `snapshot.ts:137` argues
deliberately that `debtsJson` stays on the **anchors**, and a remedy that moves them onto the projection
re-opens a different finding. This is a **source-scan finding**: nothing in this repo builds the Swift
target, so what Siri *displays* for the replacement string is a device row.

---

## C3-2 — `major` · `guardianSpoken: ''` means two different things, and Siri speaks the wrong one: a paying premium user is told the Payday Guardian is a Premium feature

**Origin:** `fix-churn` (`apps/rn/src/widget/snapshot.ts`) + `instrument` (`apps/rn/src/widget/widgetSync.test.ts:175`).

**User-facing consequence.** A **premium subscriber** whose imported `minimumPayment` could not be read
asks Siri *"Am I okay this paycheck?"* and hears:

> *"Seeing your paycheck read is a Premium feature — open Debt Planner to unlock the Payday Guardian."*

They already pay for it. The sentence is false about their account, it names the wrong remedy (buy the
thing you own, rather than *re-enter the minimum the import lost*), and it is the **only** thing this
surface can say — the intent has exactly two branches.

**File and line.**
- Producer: `apps/rn/src/widget/snapshot.ts:66-103` — `buildGuardianSpoken` returns `''` for **three
  different reasons**: not premium (`:68`), a poisoned `'required-plan'` claim (`:83`), no brief (`:85`),
  plus a `catch` (`:101`).
- Consumer: `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift:90-92` — one test,
  `snap.guardianSpoken.isEmpty`, mapped unconditionally to the upsell.
- Instrument: `apps/rn/src/widget/widgetSync.test.ts:175`.

**The measurement.** Three stores, one variable at a time.
Probe: `c3-probes/probe2-guardianspoken.ts`. Printed:

```
FREE, all readable              plan=free     isPremium=false  guardianSpoken=""   -> PREMIUM UPSELL
PREMIUM, all readable           plan=premium  isPremium=true   guardianSpoken="This paycheck looks clear …"
PREMIUM, minimumPayment unread  plan=premium  isPremium=true   guardianSpoken=""   -> PREMIUM UPSELL
```

⚡ Row 1 and row 3 are **byte-identical in the field the Swift reads** and are opposite states. The store
knows the difference (`subscriptionPlan`), the *snapshot* knows the difference (`isPremium: true` vs
`false`, `snapshot.ts:243`), and `DebtSnapshotRead` — the Swift's own view of the payload
(`SiriQueryIntents.swift:10-20`) — **does not declare `isPremium` at all**, so the consumer has discarded
the one field that separates them.

**Why major and not minor.** The instrument states a consequence it does not check. `widgetSync.test.ts:175`
reads:

```ts
eq(buildWidgetSnapshot(unread, 600).guardianSpoken, '',
   '⛔ D3-2 — Siri says nothing rather than naming money free over an obligation nobody read');
```

The **value** assertion is correct and the **claim in its label is not**: Siri does not say nothing — it
says the upsell. The test cannot see that, because it stops at the JS boundary and the branch lives in
Swift. It reports green over a sentence that is false for the store it built. Same shape as
`assert-the-honest-state-by-name`: suppressing one false statement produced a different one, and only the
suppressed half was asserted.

**Mechanism (HYPOTHESIS).** `''` was the free-tier sentinel first; `D3-2` reused it as the
data-unreadable refusal because the `''` path already existed. `snapshot.ts:81` records that reuse
explicitly — *"the `''` return already existed and Siri already routes it to the value-led upsell … what
was missing was the call."* ⚠️ That sentence is the defect stated as the fix: routing the unread-data
state into a channel already spoken for is what makes the two indistinguishable downstream. I did not
find any commit note weighing the copy consequence, so I state the intent as a hypothesis.

**Remedy — UNVERIFIED, not applied.** Two candidates, neither run:
1. **JS-side:** give the unread case its own non-empty sentence
   (*"Some of your figures couldn't be read, so I can't give you this paycheck's read yet — open Debt
   Planner and set them again"*), keeping `''` as the free sentinel only. ⚠️ This changes what a
   *free* user's snapshot and a *premium* user's snapshot look like on a field the widget also carries;
   `snapshot.ts:53-56` says the widget's `DebtSnapshot` ignores this key, which I did not verify against
   `targets/widget/DebtProvider.swift`.
2. **Swift-side:** add `isPremium` to `DebtSnapshotRead` and branch on it. ⚠️ This is a native change and
   **cannot be built or run in this repo**, so it is entirely a source-scan proposal.

⚠️ **Source-scan finding.** The spoken sentence is a device row; what is measured here is that the JS hands
Swift a value that cannot distinguish two opposite states, and that the Swift declares no field that could.

---

## C3-3 — `blocker` · a voice-logged payment that cannot be applied is reported as applied, the queue is cleared, and no surface ever tells the user

**Origin:** `stale-read` (`apps/rn/src/appIntents/pendingActions.ts`, `drainPendingActions.ts`).

**User-facing consequence.** Siri says *"Got it — $200.00 toward Chase. **Open Debt Planner to record
it.**"* (`LogPaymentIntent.swift:113`). The user opens Debt Planner. **Nothing is recorded**, the queue
entry is deleted, no Undo card appears, no error appears, and the sentence Siri spoke — the one thing that
told them what would happen — never becomes true. The user believes a $200 payment is on their record and
it is not, so their next real decision is made against a balance $200 too high.

**File and line.**
- `apps/rn/src/appIntents/pendingActions.ts:68-79` — `applyPendingAction` returns `true` for
  `'log-payment'` **unconditionally**; it never asks the store whether anything moved.
- `apps/rn/src/store/store.ts:772-773` — `const debt = …find(…); if (!debt || !(amount > 0)) return {};`
  a silent no-op.
- `apps/rn/src/appIntents/drainPendingActions.ts:22-23` — `const applied = …; bridge.clear();` the clear is
  gated on nothing.

**The measurement.** One store, one debt `d1`, one queued action naming `d-stale`.
Probe: `c3-probes/probe4-drain-silent-noop.ts`. Printed:

```
balance before         = 1000
drain returned         = [{"kind":"log-payment","id":"intent-uuid-9","debtId":"d-stale","amount":200}]
drain reported applied = 1
balance after          = 1000     <-- logManualPayment no-oped
queue cleared          = true     <-- the action is gone forever
intentRollback         = null     <-- no Undo card, nothing to tell the user
```

⚡ **`applied.length === 1` and the balance did not move.** Those two lines are the finding: the drain's
own return value — documented at `drainPendingActions.ts:12` as *"the applied actions"* — reports a
mutation that did not happen.

**Mechanism (HYPOTHESIS).** `applyPendingAction` was written as a *dispatcher* and its `boolean` return
was defined as *"whether it was handled"* — meaning "this `kind` is known", not "this money moved". The
store action beneath it is deliberately defensive (`storeActions.test.ts:724` asserts
*"logManualPayment: bad id / non-positive amount → no-op"* — the no-op is intended). The two contracts are
each correct and they do not compose: the drain then treats *known kind* as *applied* and clears on it.

**How the id goes stale (hypothesis, not measured end-to-end).** `DebtEntityQuery` sources its ids from
`debtsJson` in the App-Group snapshot (`LogPaymentIntent.swift:26-33`), which is whatever the last
successful widget write left there. Any path that re-mints debt ids between that write and the drain —
restore-from-backup, CSV re-import, delete-and-re-add — leaves Siri holding an id the store no longer has.
⚠️ I did not run that sequence; what I measured is that **once the id does not resolve, the loss is
total and silent**, which is true regardless of how it got there.

**Sibling in the same class — do not fix only the one named.** `'payday-landed'` has the identical shape:
`applyPaydayLandedIntent()` returns `void`, and `applyPendingAction` returns `true` for it too
(`pendingActions.ts:70-72`). If that action is a no-op for its own reasons, the drain reports it applied
and clears it as well. Fixing `log-payment` alone rebuilds the defect.

**Second half — nothing dedupes ACROSS drains, so the inverse failure loses the same money the other way.**
The `seen` set that dedupes by `id` lives inside a single `parsePendingActions` call
(`pendingActions.ts:44`); no applied-id ledger is persisted anywhere. Probe
`c3-probes/probe3-drain-replay.ts` holds a queue that survives its clear and drains it three times:

```
start balance           = 1000
after drain #1 (launch) = 800  | applied 1
after drain #2 (fg)     = 600  | applied 1
after drain #3 (fg)     = 400  | applied 1
intentRollback.kind     = log-payment
balance after ONE Undo  = 600   (one $200 payment was actually made; the true balance is 800)
```

`logManualPayment` **subtracts**, so it is not idempotent, and `intentRollback` holds only the most recent
snapshot — so a single Undo cannot walk the balance back. ⚠️ **The premise is the weaker half and I say so:**
`clearPendingActions` (`LiveActivityModule.swift:72-74`) uses `UserDefaults(suiteName:)?.removeObject`, and
`readPendingActions` guards on the same optional, so a suite that will not open fails *both* and nothing
drains. I did **not** find a measured path where the read succeeds and the removal does not persist —
`UserDefaults` deferring a write past a process kill is the candidate and it is speculation. The
**absence of any cross-drain dedupe is measured**; the trigger is not.

**Remedy — UNVERIFIED, not applied.** Sketch only: make `applyPendingAction` return what the store
actually did (both kinds — the `PendingActionApi` methods would have to return a boolean, which changes a
shared interface), and clear only what was genuinely applied — with a surfaced message for what was not,
because a queued payment that cannot be landed is exactly the thing the user must be told about. ⚠️ Not run.
A remedy that clears nothing on a partial failure re-opens the replay half above, so the two must be
designed together.

---

## C3-4 — `major` · `scheduleRiskNotification` reports "a push went out" without asking whether it can deliver one, so a revoked OS permission burns the user's 2-per-month risk budget silently

**Origin:** `stale-read` (`apps/rn/src/notifications/notifications.ts`, `apps/rn/src/hooks/use-notification-sync.ts`).

**User-facing consequence.** A premium user turned notifications on months ago, then turned Debt Planner's
notifications off in iOS Settings — or granted only Provisional/Scheduled-Summary delivery. The app's
`prefs.notificationsEnabled` still says `true`. When the Payday Guardian reads **at-risk**, the app
schedules a heads-up the OS will not deliver, records that it delivered, and **spends one of the two risk
pushes it is allowed per rolling 30 days**. The user is never warned about a paycheck that will not cover
their obligations. Worse, when the read later reconciles, Today shows *"Good news — this paycheck looks
clear after all."* (`apps/rn/src/app/(tabs)/index.tsx:611`) — an acknowledgement of a warning they were
never given.

**File and line.**
- `apps/rn/src/notifications/notifications.ts:169-175` — `scheduleRiskNotification` ends in a bare
  `return true;`. There is no permission read on this path at all.
- Its own docblock, `:164-167`: *"Returns whether a push was actually scheduled, so the caller only stamps
  the notify-state / push-log when one really went out."*
- `apps/rn/src/hooks/use-notification-sync.ts:63-69` — `if (scheduled) allowRealStoreWrite(() => …applyRiskNotified(…))`.
- `apps/rn/src/store/store.ts:877` — `pushLog: [...s.store.pushLog, nowISO].slice(-24)`.
- `packages/core/guardian/notificationDecision.ts:76-77` — the cap: `if (pushesInWindow(pushLog, now, windowDays) >= maxPerWindow)` → no push. `N = 2`, window `30` days (`:10`).

**The measurement.** By enumeration over the tree rather than by execution — `expo-notifications` cannot be
driven here. Three counts, all from the repo root:
- Call sites of `Notifications.getPermissionsAsync` in `apps/rn/src`: **1** — inside
  `requestNotificationPermissionDetailed` (`notifications.ts:95`).
- Call sites of `requestNotificationPermissionDetailed`: **1** — `more.tsx:86`, inside the toggle handler.
- Writers of `prefs.notificationsEnabled`: **2** — `more.tsx:83` (`false`) and `more.tsx:88` (`true`), both
  inside that same handler, plus the `false` default (`defaults.ts:56`) and the legacy import map.

⚡ **So the pref records a permission answer from the instant the switch was tapped and is never
reconciled against the OS again.** `scheduleRiskNotification` is reached only through
`use-notification-sync.ts:63`, which gates on that pref (`:56`). Nothing between the pref and the `return
true` asks iOS anything.

**Mechanism (HYPOTHESIS).** The boolean was introduced for the **platform** split, not for permissions —
`notifications.web.ts:24` says so verbatim: *"Web no-op — returns false so the caller never stamps the
notify-state without a delivered push."* The native side then had only one thing left to return. On iOS,
`scheduleNotificationAsync` resolving is not evidence of delivery: it queues the request regardless of
authorization status. So the value that the caller reads as *"one really went out"* means only *"this is
not the web stub."* ⚠️ **The delivery half is a claim about iOS I cannot execute here** and I mark it as
such; what is measured is that no permission is consulted on the path, which is true either way.

**Why major.** This is the shape the brief names: the report is green while doing less than it claims,
and the docblock states the stronger claim in words. The consequence is not a wrong number on screen — it
is a warning that does not arrive and a budget that is spent as if it had.

**Adjacent, same file, same class — do not fix only the risk push.** `syncNotifications`
(`notifications.ts:118`) schedules the paycheck-eve, payday-morning and bills reminders on the identical
pref with the identical absence of a permission read. They have no `pushLog` to corrupt, so they merely
fail silently; the class is one permission reconciliation, not one function.

**Also dead, found while reading:** `requestNotificationPermission` (`notifications.ts:79-82` and
`notifications.web.ts:11-13`) has **zero call sites** in `apps/rn/src` — the detailed variant replaced it
and the boolean one was left exported from both halves of the split. minor, folded here rather than
given its own number.

**Remedy — UNVERIFIED, not applied.** Read `Notifications.getPermissionsAsync()` inside
`scheduleRiskNotification` and return `false` when it is not `granted`, so the stamp and the push-log entry
are withheld; and reconcile `prefs.notificationsEnabled` against the OS on foreground so the More switch
stops claiming a state iOS has revoked. ⚠️ Neither was run. The second has a hazard worth stating: silently
flipping the pref to `false` would also cancel the schedule, and if the permission read is wrong the user
loses reminders they do have — so the reconciliation probably belongs in the UI (a switch that shows the
OS state) rather than in a write.

---

## C3-5 — `blocker` · pass-6's `C3-12` was fixed in `widgetSync` and not in its twin: the Lock Screen holds "looks clear" while the store says "$2,500 short"

**Origin:** `stale-read` (`apps/rn/src/liveActivity/liveActivitySync.ts`, `liveActivityBridge.native.ts`,
`liveActivityBridge.types.ts`) · sits directly against `fix-churn` (`widget/widgetSync.ts`).

**User-facing consequence.** A premium user in the three-day run-up to payday has the Payday Countdown on
their Lock Screen. One ActivityKit update is dropped — the native bridge eats the error — and from then on
the Lock Screen carries **"Looks clear this paycheck · Nudge your line down anytime to free up more for
your goals."** while the app's own read is **"This paycheck won't cover everything · $2,500 short of your
obligations."** It stays that way until something else moves the payload. This is the Lock Screen: the
surface whose entire job is to be read *without* opening the app.

**File and line.**
- `apps/rn/src/liveActivity/liveActivitySync.ts:47-60` — `bridge.start(...)` then `running = true;
  lastKey = action.key;` and `bridge.update(...)` then `lastKey = action.key;`. **The stamp is
  unconditional.**
- `apps/rn/src/liveActivity/liveActivityBridge.types.ts:12-14` — `start`, `update`, `end` all return
  `void`. There is nothing for the manager to consult.
- `apps/rn/src/liveActivity/liveActivityBridge.native.ts:36-56` — every method is
  `try { native()… } catch { /* best-effort */ }`.
- **The twin, already fixed:** `apps/rn/src/widget/widgetSync.ts:61` — `if (write(snapshot)) lastKey = key;`
  and `widgetStorage.native.ts:60` — `writeWidgetSnapshot(...): boolean`.

**The measurement.** Probe: `c3-probes/probe5-liveactivity-stamp.ts`. Premium store, biweekly, payday in
2 days, toggle on — one variable: whether the bridge's `update` lands.

```
CASE A — start lands, one update is dropped, then the store settles
  launch        : attempted ["start"]
  bill added    : attempted ["start","update"]
  store settles : attempted ["start","update"]        <-- no retry, ever
  STORE says      : {"state":"at-risk","title":"This paycheck won’t cover everything","line":"$2,500 short of your obligations"}
  LOCK SCREEN says: {"state":"clear","title":"Looks clear this paycheck","line":"Nudge your line down anytime to free up more for your goals."}

CASE B — the ActivityKit start request is refused
  attempted       : ["start","update"]
  starts re-tried : 0
```

⚡ Case A's last two lines are one store at one instant, and they are opposite claims about whether the
user's paycheck covers their obligations. Case B shows the second half: a refused `start` stamps
`running = true`, so the manager spends the rest of the session sending `update` to an activity that was
never created and never attempts `start` again.

**Mechanism (HYPOTHESIS).** `widgetSync.ts:56-61` states the defect in words — *"This used to stamp first
and then write, so one failed App-Group write froze the widget and Siri on the previous figures for the
rest of the session"* — and the fix widened `writeWidgetSnapshot` from `void` to `boolean` to carry the
answer. `LiveActivityBridge` was never widened. My hypothesis is that `C3-12` was scoped by **file** (the
widget) rather than by **shape** (a best-effort native writer whose caller stamps a change-gate on the
attempt), and `liveActivitySync` is the same shape one directory away — same debounce, same `lastKey`,
same swallow-and-report-nothing bridge, written from the same template.

⚠️ **What is measured and what is not.** Measured: the stamp is unconditional and no retry occurs — that is
pure JS and the probe runs it. **Not** measured: how often ActivityKit actually refuses. `startActivity`
can fail for reasons that are real on device (the per-app activity limit, the OS budget, Live Activities
disabled between the `areActivitiesEnabled()` read and the call) and I cannot execute any of them here.
This is a **source-scan finding** about the JS manager; the frequency is a device row.

**Adjacent, same file — a second stale gate.** `liveActivitySync.ts:37` reads
`bridge.areActivitiesEnabled()` **once**, before subscribing, and returns outright when it is false. A user
who turns Live Activities on in iOS Settings mid-session gets no countdown until the app is relaunched, and
`started.add(store)` at `:34` has already marked the store started, so a second `startLiveActivitySync`
call would not help either. minor, folded here — same file, same class of "held state that outlives its
premise".

**Remedy — UNVERIFIED, not applied.** Mirror the twin: widen `LiveActivityBridge`'s `start`/`update`/`end`
to `boolean`, return `false` from the `.native` catch blocks and from the web no-op's failure paths, and
stamp `running`/`lastKey` only on `true`. ⚠️ Not run, and it has a hazard the widget's version did not:
`liveActivityBridge.ts` (web) returns for a surface that legitimately has nothing to do, so a bare `false`
there would make the manager retry forever on web — the exact busy-loop `widgetStorage.ts:13-16` records
having to reason about. The web stub must return `true` for the same reason `writeWidgetSnapshot` does.

---

## C3-6 — `major` · the assertion that pass-3's `D3-2` fix "reaches the screen" stops one call short of the screen

**Origin:** `stale-read` (`apps/rn/src/liveActivity/paydayActivityContent.test.ts`).

**User-facing consequence.** `D3-2` was the blocker where the Lock Screen carried *"Looks clear · $1,080
free to deploy"* for three days over an obligation the app could not read. The fix ends the running
activity. The guard that proves it is asserted against the *decision*, not the *delivery* — so the state it
exists to prevent (the false figure sitting on the Lock Screen) can still occur while the guard is green.

**File and line.** `apps/rn/src/liveActivity/paydayActivityContent.test.ts:173-175`:

```ts
// ⛔ …and the lifecycle already handles that `null`: an in-flight activity must END rather than freeze
// on the last false payload. This is the assertion that makes the fix reach the screen.
eq(decideLiveActivityAction(unread, true, 'k1').kind, 'end', '⛔ D3-2 — …and a running activity is ENDED, not left showing the last figure');
```

**The measurement.** By reading the call chain the assertion stops before, not by execution — the step it
omits is native and cannot run here.

- `decideLiveActivityAction` returns `{ kind: 'end' }`. ✅ asserted.
- `liveActivitySync.ts:56-59` — `case 'end': bridge.end(); running = false; lastKey = null;`. Not asserted.
- `liveActivityBridge.types.ts:14` — `end(): void`. **No return value exists.**
- `liveActivityBridge.native.ts:50-56` — `end: () => { try { native().endActivity(); } catch { /* best-effort */ } }`.

⚡ **`running = false` is stamped whether or not the activity ended**, so a swallowed `endActivity()` leaves
`D3-2`'s exact false payload on the Lock Screen with the manager believing there is nothing running to end.
Grep over `apps/rn/src/liveActivity`: assertions naming `bridge.end` or the `LiveActivityBridge` at all —
**0**. The whole bridge layer is unasserted; `paydayActivityContent.test.ts` never imports it.

**Why major and not part of C3-5.** C3-5 is the missing return value. This is the separate, measurable
claim that **the comment in the test overstates what the test does** — *"the assertion that makes the fix
reach the screen"* — which is precisely the shape the brief calls *a check that cannot fail reading exactly
like a check*, and the reason this class keeps recurring: the guard is written at the boundary of what is
easy to reach rather than at the boundary of the claim.

**Mechanism (HYPOTHESIS).** `decideLiveActivityAction` was deliberately extracted to be *"unit-testable
without ActivityKit or timers"* (`paydayActivityContent.ts:135-137`). That extraction is good and it moved
the testable boundary one call short of the surface, and the comment then attributed the surface to it. No
commit note says otherwise; I state the intent as a hypothesis.

**Remedy — UNVERIFIED, not applied.** The honest cheap version is to stop claiming the screen: reword the
comment to what it asserts. The version that actually closes it needs C3-5's `boolean` bridge plus a
manager-level test with a stub bridge (`liveActivitySync` already injects one — `startLiveActivitySync(store, bridge)`),
asserting that a refused `end` does not clear `running`. ⚠️ Neither was run.

---

## C3-7 — `blocker` · pass-6's `B3-3` fix added a fourth status and left `setEnabled` on `=== 'ready'`, so turning iCloud backup ON takes no backup and says nothing

**Origin:** `fix-churn` (`apps/rn/src/hooks/use-cloud-backup.ts`) · `instrument`
(`apps/rn/src/storage/cloudBackup/cloudBackupUnreadable.test.ts`).

**User-facing consequence.** A user signed into iCloud, whose provider will not report a timestamp, opens
More → iCloud Backup and turns it **on**. The switch goes on. **No backup is taken.** The one thing that
was supposed to make "on" mean "your plan is safe right now" does not run, and nothing on the screen says
so. The next time this matters is a lost or wiped phone, where the user believes there is a copy of their
plan because they turned the feature on and watched it stay on.

**File and line.** `apps/rn/src/hooks/use-cloud-backup.ts:275`:

```ts
if (next && status === 'ready') await backupNow();
```

with `status: CloudBackupUiStatus = 'loading' | 'unavailable' | 'ready' | 'ready-unreadable'` (`:37`).

**The measurement.** Probe: `c3-probes/probe6-cloudbackup-ready.ts`, over the three reachable
`CloudBackupStatus` shapes through the hook's own exported mapping:

```
signed out                        -> status="unavailable"       seeds a backup: false
signed in, timestamp readable     -> status="ready"             seeds a backup: true
signed in, timestamp UNREADABLE   -> status="ready-unreadable"  seeds a backup: false
```

⚡ Row 3 is the state pass-6 `B3-3` created. **Before that fix it mapped to `'ready'`**
(`use-cloud-backup.ts:41-43` quotes the old expression: `next.available ? 'ready' : 'unavailable'`), so this
line fired and the backup was taken. **The fix that made the sheet honest made this write stop happening.**

**Why the sweep missed it, measured.** `cloudBackupUnreadable.test.ts:264-267` is the guard the fix built
for exactly this class:

```ts
const code = codeLinesOnly(sheet);
assert(!code.includes("status !== 'ready'"),
  '…and nothing disables a control by asking `status !== ready`, which excluded this state');
```

- Files it reads: **one** — `components/more/CloudBackupSheet.tsx` (`:252`). `use-cloud-backup.ts` is never
  opened by it.
- Spellings it matches: **one** — `status !== 'ready'`. The defect here is `status === 'ready'`.
- Occurrences of `status === 'ready'` in `apps/rn/src`: **1**, and it is this line.

⛔ **And the count assertion at `:283` states more than it checks.**
`eq(LAYERS.length, 8, 'every layer that consumes this condition is walked — adding one means adding it here')`.
The eight are `getCloudBackupStatus` · the hook's UI mapping · `backupToCloudGuarded` · `cloudBackupMessage` ·
`cloudBackupStatusLine` ×2 · `restoreFromCloud` · `CloudBackupSheet`. **`useCloudBackup.setEnabled` is a
ninth consumer and is not among them**, and the literal `8` is green either way — a ratchet detects a layer
being *added* to the list, never one that was never on it. That half is the major inside this blocker.

**Mechanism (HYPOTHESIS).** `B3-3` was reported as a *dead end in the sheet* — the `else` that hid every
control — so the sweep was scoped to the sheet and to the negative comparison that produced the dead end.
The positive comparison in the hook is not a control being disabled; it is a **write being skipped**, which
looks nothing like the reported symptom and lives in the file the fix was editing for a different reason.
This is `iterate the class, never the member you found` with the class defined by *spelling* rather than by
*question* — the question being "does this code treat `'ready-unreadable'` as not-signed-in?"

**Sibling worth checking in the same pass (not measured).** `_layout.tsx:170` gates the automatic
background backup on `shouldAutoBackup(...)`, not on this status, so I did **not** find a second instance of
this comparison. But `setEnabled` leaves `cloudBackupEnabled: true` in prefs regardless (`:265`), so the
user's state after this is *enabled, never seeded* — whether the first automatic backup ever lands is a
question about `shouldAutoBackup` I did not run.

**Remedy — UNVERIFIED, not applied.** Replace the equality with the question being asked —
`status === 'ready' || status === 'ready-unreadable'`, or better a named predicate both files import — and
add `setEnabled` to the `LAYERS` walk with the count bumped to 9. ⚠️ Not run. Hazard: `backupNow()` in
`'ready-unreadable'` goes through `backupToCloudGuarded`, whose unclaimed-remote check depends on a
timestamp that by definition will not read; whether it returns `'remote-unclaimed'` and leaves the user in
the fork instead of backing up is the thing to measure before believing this remedy.

---

## C3-8 — `blocker` · Money's hero states $8,750 over a true $11,513 in the exact state the widget was taught to refuse — pass-6's `C3-5` was fixed on the widget only

**Origin:** `fix-churn` (`apps/rn/src/app/(tabs)/money.tsx`) · `neighbour` (`apps/rn/src/widget/snapshot.ts`,
which moved and is the side that now disagrees).

**User-facing consequence.** A premium user whose imported **APR** could not be read opens the Money tab
and reads **"$8,750 · remaining across 1 debt"** as the hero figure, in the app's plain money voice, with no
caption and no hedge. The figure the same store produces with the APR readable is **$11,513** — the hero is
**$2,763 low**. With the **minimum payment** unread instead it reads **$11,800** — $287 high. And on the
same store at the same instant the Home Screen widget and Siri say **"—"**, because pass-6 taught *them* to
refuse exactly this. **The app asserts and the widget refuses, one glance apart, about the same money.**

**File and line.**
- `apps/rn/src/app/(tabs)/money.tsx:385` — the hero's number:
  `const totalBal = active.reduce((s, d) => s + selectDebtBalanceView(d, currentDate, isPremium, cyclesPerMonth).currentBalance, 0);`
- `apps/rn/src/app/(tabs)/money.tsx:421` — the hero's guard: `const unreadDebts = hasUnreadDebtBalances(store);`
- `apps/rn/src/store/trustSelectors.ts:59-63` — that guard reads `r.field === 'balance'` **only**.
- The twin, already fixed: `apps/rn/src/widget/snapshot.ts:216` —
  `const mayStateBalances = mayClaim(store, 'debt-balances') && mayClaim(store, 'row-figures');`

**The measurement.** Probe: `c3-probes/probe7-money-hero-apr.ts`. One store — premium, one Chase debt,
balance $9,000 verified eleven months ago — one field unread at a time. `MONEY tab hero` is
`money.tsx:421+385` re-executed verbatim; `WIDGET` is `buildWidgetSnapshot(...).remaining`:

```
CONTROL — every field readable
  repairs=[]                hasUnreadDebtBalances=false   MONEY -> "$11,513"            WIDGET -> "$11,513"
apr unreadable
  repairs=["apr"]           hasUnreadDebtBalances=false   MONEY -> "$8,750"             WIDGET -> "—"
minimumPayment unreadable
  repairs=["minimumPayment"] hasUnreadDebtBalances=false  MONEY -> "$11,800"            WIDGET -> "—"
balance unreadable
  repairs=["balance"]       hasUnreadDebtBalances=true    MONEY -> "Some balances unread" WIDGET -> "—"
```

⚡ **Row 1 is the control and the two surfaces agree exactly.** Rows 2 and 3 are the finding: the guard is
`false`, so the hero prints, and the printed number is wrong in **both directions** depending on which
field was lost. Row 4 shows the guard working for the one field it knows about.

**Mechanism (HYPOTHESIS).** `snapshot.ts:196-215` states this defect in full: *"THE GUARD WAS COMPUTED OVER
DIFFERENT FIELDS THAN THE NUMBER IS COMPUTED FROM … `projectCurrentBalance` reads `apr` and
`minimumPayment` — which route to `'row-figures'`."* Money's hero computes its number from the **same**
projection — `selectDebtBalanceView(d, …, isPremium, …)` — and kept the balance-only guard. My hypothesis
is that `C3-5` was filed against `snapshot.ts` and fixed there, and that the shared premise
("the guard must cover every field the number is computed from") was never carried to the other consumer of
the same projection, because nothing in the tree connects them. ⚠️ **Stated as a hypothesis:** I did not find
a note in either file saying money.tsx was considered and excluded.

⚠️ **And the widget's own docblock names money.tsx as the surface it must agree with**
(`snapshot.ts:117-119`, `widgetSync.test.ts:216`: *"the app's own expression for the same claim — `money.tsx`
sums `selectDebtBalanceView(...).currentBalance`"*). That parity test builds its fixtures with every field
readable, so it sits in the one member of the class where this cannot appear — the same blind spot its own
comment at `widgetSync.test.ts:193-198` warns about, one variable over.

**Iterate the class, not the member.** `hasUnreadDebtBalances` is the balance-only guard, and it is used at
more than this one hero. Every site that gates a **projected** figure on it has this defect; every site that
gates a **raw balance** on it is correct and must not be widened (`snapshot.ts:212-214` argues that
explicitly — *"a suppression that never lets the good state through is a second false statement"*). The
triage needs the list of `hasUnreadDebtBalances` call sites split by which kind of figure each one guards.
I did not enumerate it.

**Remedy — UNVERIFIED, not applied.** Gate the hero on the question the widget now asks —
`mayClaim(store, 'debt-balances') && mayClaim(store, 'row-figures')` — or, better, on a named selector both
files import so they cannot drift again. ⚠️ Not run. Hazard: the hero's refusal copy is *"Some balances
unread · set them again and your total comes back"*, which would then be shown for an unread **APR**, where
no balance is unread and the sentence is false in a new way. The copy has to move with the guard.

---

## C3-9 — `blocker` · Progress's debt-free hero promises **October 2026** over a true **January 2027** when the APR could not be read, while the widget refuses on the same store

**Origin:** `fix-churn` (`apps/rn/src/app/(tabs)/progress.tsx`) · same class as C3-8, different file, different
guard, different figure — **both must be fixed or the class is rebuilt a third time.**

**User-facing consequence.** The Progress hero is the app's flagship promise: one date, in the largest type
on the screen, on a navy panel. On a premium store whose imported **APR** was repaired to `0`, that date is
**three months earlier than the truth** — the app tells the user they will be debt-free in October when the
plan they actually have finishes in January, because it lost the interest rate and quietly modelled the
debt as interest-free. With the **minimum payment** unread instead the date slips the other way. Neither
state shows a caption, a hedge or a tilde. The Home Screen widget, on the identical store, says
`"Balances unread"`.

**File and line.** `apps/rn/src/app/(tabs)/progress.tsx:283-286`:

```ts
const mayStateBalances = mayClaim(store, 'debt-balances');
const journey = selectJourneyTotals(store.debts, engineStore.debts);
const pct = mayStateBalances ? journey.pct : 0;
const journeyLine = mayStateBalances ? journey.line : UNREAD_JOURNEY_LINE;
const heroDate = mayStateBalances ? (view.debtFreeDate ?? '—') : '—';
```

`engineStore` is `withProjectedBalances(store, isPremium)` and `view` is `selectPayoffView(engineStore)`.

**The measurement.** Probe: `c3-probes/probe8-progress-guard.ts`. One premium store — Chase, $18,000 of
$20,000, minimum $400, APR 27.99%, verified eleven months ago, $1,400 paycheck — one field unread at a time,
running `progress.tsx:283-286` verbatim:

```
CONTROL — every field readable
  mayClaim('debt-balances')=true   mayClaim('row-figures')=true
  ring 10%   journey "$2,000 of $20,000 paid"   hero date -> "January 2027"
apr unreadable
  mayClaim('debt-balances')=true   mayClaim('row-figures')=false
  ring 10%   journey "$2,000 of $20,000 paid"   hero date -> "October 2026"      <-- 3 months EARLY
minimumPayment unreadable
  mayClaim('debt-balances')=true   mayClaim('row-figures')=false
  ring 10%   journey "$2,000 of $20,000 paid"   hero date -> "February 2027"     <-- 1 month LATE
```

⚡ **The guard is `true` in both defect rows**, so nothing suppresses. ⭐ **The ring and the journey line are
the control inside the measurement**: they do not move, because `journeySelectors` is deliberately anchored
to the confirmed balances (`progress.tsx:262-268`). **Only the projected figure moves — which is exactly
the boundary `mayClaim('row-figures')` marks and this guard does not ask about.**

**Mechanism (HYPOTHESIS).** The docblock at `:277-282` reasons explicitly about *which* selector to use —
*"`mayClaim`, not `hasUnreadDebtBalances` … the question HERE is 'may this screen state a balance figure',
which is what the claim owner answers"* — and lands one claim short. Pass-6 `C3-5` later made precisely this
correction on the widget and wrote down why: *"`projectCurrentBalance` reads **`apr` and `minimumPayment`** —
which route to `'row-figures'`, and only there. So the pass-5 fix changed what the number is computed FROM
without changing what the guard is computed OVER"* (`snapshot.ts:196-202`). That correction was applied to
`snapshot.ts` and to nothing else. My hypothesis is that `C3-5` was scoped to the file it was reported in;
I found no note in `progress.tsx` considering and rejecting the second claim.

⚠️ **`C4-9`'s own lesson, repeated one guard later.** The comment above this block records that pass-4 found
*"THE GUARD WAS ON THE EMPTY-STATE BRANCH AND THE CLAIM IS DOWN HERE"* and moved a guard down to the claim.
It moved the guard to the right *place* and left it asking the wrong *question*.

**Remedy — UNVERIFIED, not applied.** The same widening the widget already carries:
`mayClaim(store, 'debt-balances') && mayClaim(store, 'row-figures')`. ⚠️ Not run, and there are two live
hazards. (1) The three-way split here is deliberate — `pct` and `journeyLine` are anchored and are
**correct** in these rows, so widening one boolean over all four suppresses two true statements to fix one
false one, which `snapshot.ts:212-214` names as *"a second false statement, not a fix"*. The date probably
needs its own predicate. (2) `snapshot.ts:183-184` argues the opposite for the widget — *"ALL FOUR FIGURES
DEGRADE TOGETHER"* — so the two surfaces would then apply opposite rules, and that disagreement should be
settled before either is edited.

**The class, for triage.** Three consumers of the projection, three different guards:

| surface | guard | covers `apr` / `minimumPayment`? |
|---|---|---|
| `widget/snapshot.ts:216` | `mayClaim('debt-balances') && mayClaim('row-figures')` | ✅ (pass-6 `C3-5`) |
| `app/(tabs)/progress.tsx:283` | `mayClaim('debt-balances')` | ❌ — **C3-9** |
| `app/(tabs)/money.tsx:421` | `hasUnreadDebtBalances(store)` (the `balance` field only) | ❌ — **C3-8** |

---

## C3-10 — `major` · pass-6's `C3-10` fix names two consequences and reaches one: "Delete all data" still never removes the widget snapshot, and no test anywhere guards it

**Origin:** `fix-churn` (`apps/rn/src/app/more.tsx`) · `fix-churn` (`apps/rn/src/widget/`).

**User-facing consequence.** A user hands their phone on, or is leaving an abusive situation, and taps
**Delete everything**. The confirm copy enumerates the locations it will clear. Their debt names and
balances remain readable in the App Group — on the Home Screen widget and to Siri — for as long as one
best-effort native write does not land. Nothing in the app ever *removes* that record; it is only ever
overwritten, asynchronously, by the same debounced writer whose failure mode pass-6 `C3-12` was raised
about.

**File and line.** `apps/rn/src/app/more.tsx:167-182`. The docblock:

> ⛔ **S1.13.7.6 [pass-6 `C3-10`] — "DELETE ALL DATA" NEVER TOUCHED THE APP GROUP.**
> Two consequences, both measured. The **widget snapshot** keeps the user's debt names and balances
> readable outside the app after they asked for everything to be erased … And a **queued `payday-landed`**
> survives the wipe …

The fix, in full, is line 179:

```ts
pendingActionBridge.clear();
```

That clears the `pendingActions` key (`LiveActivityModule.swift:72-74`). **It does not touch
`debtSnapshot`.**

**The measurement.**
- Enumeration: `grep -rn "WIDGET_SNAPSHOT_KEY\|debtSnapshot" apps/rn/src` — **7 hits, all writers or
  re-exports.** The only consumer of the key is `widgetStorage.native.ts:65`, `store.set(...)`. There is no
  `remove`, no `clearWidgetSnapshot`, and no caller of one.
- Guard: `grep -rn "C3-10" apps/rn/src` — **1 hit**, and it is the comment above. No test, no e2e, no
  registered guard references this fix at all.
- Behaviour, probe `c3-probes/probe9-deleteall-widget.ts`, running the real `startWidgetSync` against the
  real `reset()`:

```
CASE A — the debounced widget write LANDS
  before delete-all: App Group debtsJson = [{"id":"d1","name":"Chase Sapphire","balance":"$9,000"}]
  after  delete-all: App Group debtsJson = []

CASE B — the initial mirror lands, then the post-reset write is dropped by the native bridge
  before delete-all: App Group debtsJson = [{"id":"d1","name":"Chase Sapphire","balance":"$9,000"}]
  after  delete-all: App Group debtsJson = [{"id":"d1","name":"Chase Sapphire","balance":"$9,000"}]
                     store now says      = "[]"
```

⚡ **Case A is the only mechanism that scrubs it, and it is an overwrite by a writer documented as
best-effort.** Case B is the same store with one variable — whether that write lands.

**Three ways Case B is reachable (mechanism, HYPOTHESIS).**
1. `writeWidgetSnapshot` returns `false` on any App-Group fault (`widgetStorage.native.ts:60-72`) — the
   failure mode pass-6 `C3-12` exists to describe. `widgetSync` then leaves `lastKey` unstamped and
   **retries on the next store change**; after a delete-all the user is on onboarding with an empty store,
   so there may be no next change for a long time.
2. **Timing.** `reset()` runs inside `InteractionManager.runAfterInteractions` (`more.tsx:180`) and the
   sync is debounced `SYNC_DEBOUNCE_MS = 1000` (`widgetSync.ts:21`). A user who taps *Delete everything*
   and immediately swipes the app away never reaches the write.
3. **Order.** Every other destructive step in this function is deliberately sequenced *before* anything is
   destroyed — the docblock states the rule twice: *"the only honest order is to fail before anything is
   destroyed."* The App-Group snapshot is the one item cleaned up *after*, by a different subsystem, with
   no failure surface.

**Why major.** The fix reports itself as closing a finding whose stated first consequence it does not
reach, and nothing checks it. ⚠️ I am **not** calling this a blocker: in the common path (Case A) the
snapshot is scrubbed within about a second, so this is a fix that does less than it claims rather than a
guaranteed disclosure. Whether iOS surfaces the stale widget in that window is a device row.

**Remedy — UNVERIFIED, not applied.** Add a `clearWidgetSnapshot()` to the widget bridge (`removeObject`
for `WIDGET_SNAPSHOT_KEY`, plus a `reloadWidget` so the face empties) and call it beside
`pendingActionBridge.clear()`, **before** the reset, with the same block-on-failure treatment the iCloud and
quarantine steps already get. ⚠️ Not run, and there is a real hazard: `pendingActionBridge.clear()` at
`more.tsx:179` is itself unconditional and swallows its own failure
(`pendingActionBridge.native.ts:30-36`), so the existing half of this fix has the *same* silent-failure
shape — the remedy should give both a return value rather than adding a third best-effort call.

---

## C3-11 — `blocker` · the Cushion Forecast asks no trust question at all: an unread minimum erases the below-floor crunch the screen exists to show

**Origin:** `stale-read` (`apps/rn/src/app/cushion-forecast.tsx`) · third member of C3-8/C3-9's class, and
the one with **no guard whatsoever**.

**User-facing consequence.** A premium user whose imported **minimum payment** was repaired to `0` opens
*Your cushion forecast* — the screen the app describes as *"a real chart of the un-clamped projected cushion
vs the user's floor line, with below-floor crunches the free bars can't show."* The chart shows their
cushion ending each cycle at **$1,100**, comfortably above their **$200** line, and every cycle flagged
**clear**. The truth for that plan is **$0** and **at-risk** in every odd cycle: the crunch the screen was
built to reveal is the exact thing that disappears. The user's own Today screen already refuses the same
claim on the same store.

**File and line.** `apps/rn/src/app/cushion-forecast.tsx:25-30`:

```ts
const store = useAppStore((s) => s.store);
const isPremium = store.subscriptionPlan === 'premium';
const engineStore = withProjectedBalances(store, isPremium);
const cycles = selectCashTimeline(engineStore, RUNWAY_CYCLES);
const plan = selectWaterFillPlan(engineStore);
const floor = effectivePaycheckBuffer(engineStore);
```

**The measurement.** Probe: `c3-probes/probe10-cushion-forecast.ts`, running those five lines verbatim.
Premium, biweekly $2,200 paycheck, $900 rent, one Chase debt with a **$1,500** minimum, floor $200. One
variable — whether `minimumPayment` parsed:

```
CONTROL — every field readable
  mayClaim('required-plan') = true    mayClaim('row-figures') = true
  floor line                -> $200
  runway endingBalance/cy   -> ["$0","$2,000","$0","$2,000","$0","$2,000"]
  runway guardianState/cy   -> ["at-risk","clear","at-risk","clear","at-risk","clear"]

minimumPayment unreadable
  mayClaim('required-plan') = FALSE   mayClaim('row-figures') = FALSE
  guard on this route       = NONE
  floor line                -> $200
  runway endingBalance/cy   -> ["$1,100","$2,000","$1,100","$2,000","$1,100","$2,000"]
  runway guardianState/cy   -> ["clear","clear","clear","clear","clear","clear"]
```

⚡ **Three at-risk cycles become six clear ones, and the plotted cushion moves $1,100 in the safe
direction, on the one screen whose stated purpose is showing the dips.**

**Enumeration.** `grep -n "mayClaim\|unread\|Unread\|pendingDataRepairs"` over
`app/cushion-forecast.tsx`, `components/plan/CashRunwayChart.tsx` and
`components/plan/GuardianScorecard.tsx` — **0 hits across all three**. Neither the route nor either child
consults the trust layer in any form.

**Mechanism (HYPOTHESIS).** The entry point already asks the right question and the destination does not.
`index.tsx:368-372` renders the Guardian card with
`unreadPlanInputs={!mayClaim(store, 'required-plan')}` and, in the same JSX block, hands the user
`onSeeForecast={() => router.push('/cushion-forecast')}`. My hypothesis is that the trust work was done
per-*card* on Today — where the refusals are visible and were reviewed — and that a **pushed route** with
no card of its own was never on any of those inventories. The route is one of only two ways into this data
and the only one that renders it full-screen.

**Iterate the class.** With C3-8 and C3-9 this makes **four** consumers of `withProjectedBalances` and
**four different answers** to "may this state a figure":

| surface | guard |
|---|---|
| `widget/snapshot.ts:216` | `mayClaim('debt-balances') && mayClaim('row-figures')` ✅ |
| `app/(tabs)/progress.tsx:283` | `mayClaim('debt-balances')` ❌ C3-9 |
| `app/(tabs)/money.tsx:421` | `hasUnreadDebtBalances(store)` ❌ C3-8 |
| `app/cushion-forecast.tsx` | **none** ❌ C3-11 |

⛔ Fixing any one of these leaves the other three. The unit that needs fixing is *"which claim licenses a
projected figure"*, owned once.

**Remedy — UNVERIFIED, not applied.** `'required-plan'` is the claim that names this exact question — its
route is `debt: ['minimumPayment']` and it is already `false` on the measured store — so gating the chart on
`mayClaim(store, 'required-plan')` and rendering a refusal in its place is the minimum. ⚠️ Not run. Two
hazards: the screen has an existing non-premium `EmptyState` branch whose copy sells Premium, and reusing it
for the unread case would tell a paying user to buy something (the same overload as C3-2); and
`GuardianScorecard` reads `selectCalibrationScore(store)` off the **raw** store, so it may be honest here
and should be checked separately rather than suppressed with the chart.

---

## C3-12 — `major` · `test:scenarios` is one journey and asserts not one string, yet the guard registry cites it as evidence a defect "survived all three suites"

**Origin:** `s0-first-look` (`apps/rn/src/testing/runScenarioTests.ts`,
`apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts`).

**Consequence.** Not a user-facing one — an evidence one, which is the category the brief says this round
should weight. `test:scenarios` sits in CI (`.github/workflows/web-e2e.yml:106`) and in the release gate
(`package.json:84`, `validate:release:rn`), and its name is used inside `scripts/finding-guards.json` to
establish that a defect was invisible to a *breadth* of checking:

> *"all three suites stay GREEN — `test:regression`, `test:app`, `test:scenarios`"* (entry at `:512`)
> *"survived its own un-fix in `test:regression`, `test:app`, `test:scenarios` AND `lint:money`"* (`:1866`)

A reader of the registry — or of a future triage scheduling off it — takes "three suites were green" as
three independent looks. One of the three is a **single 14-assertion walk through one feature**.

**The measurement.**
- `find apps/rn/src -name "*.scenario.ts" | wc -l` → **1**
- `grep -c "await import" apps/rn/src/testing/runScenarioTests.ts` → **1**
- `grep -c "test:scenarios" scripts/finding-guards.json` → **2** (both in the "stayed green" form quoted above)
- **String assertions in the only scenario: zero.** Reading `guardianColdStartLifecycle.scenario.ts:48-80`,
  every one of its fifteen asserted values is a number, a boolean or `null`: `netHeld > 0`,
  `.show === true`, `=== null`, `netAttested > 0 && netAttested < netHeld`, `billsAttested === false`,
  `selectReserveWalkback(...) === true`, `pendingReserveWalkback === null`, `genuineCycleCount === 2`,
  `heldReserve > 0`, `pendingReserveRelease === null`, `genuineCycleCount === 3`, `release !== null`,
  `release?.tapped === true`, `release?.covered === 90`, `heldReserve === 0`. The quoted text in each call
  is the *label*, never the subject.

⚡ **So the `:1866` citation is vacuous by construction.** That entry is about `formatCurrency`'s
`Number.isFinite` guard rendering `$NaN`. A suite that asserts no string can never fail over a rendered
string, in any codebase, for any defect of that class — its greenness carries zero information about it,
and it is cited as if it carried a third of the evidence.

**Why major.** This is the brief's own definition: an instrument reporting green while doing less than
the record claims of it. ⚠️ **And I am explicit about what is *not* wrong here:** the runner's own docblock
is honest (*"New scenarios are appended here as they land — graduation, shortfall→recovery,
variable-income, …"*), the scenario itself is well built, and `test:scenarios` genuinely is in CI. The
defect is in what the registry infers from it, not in the suite pretending to be something.

**Mechanism (HYPOTHESIS).** The suite was named for the category it was meant to grow into, and the name
did the arguing afterwards. `A5-2` and `A-F1` were both written by enumerating *the commands that were
run* rather than *the assertions that could have seen the subject* — which is `run-the-control-on-the-verifier`
exactly: a "not caught" over a suite that never looks at the subject reads identically to a real one. ⚠️ I
did not check the other ~1,900 registry entries for the same citation pattern beyond `test:scenarios`;
`test:app` and `test:regression` may be cited the same way over subjects they also cannot see.

**Remedy — UNVERIFIED, not applied.** Two separable things. (1) The evidence rule: a "stayed green"
citation should name the assertion that could have failed, not the command that was run — for the
`formatCurrency` case, `test:scenarios` should simply not appear. (2) The suite: if it is to keep being
cited as breadth, it needs the journeys its own comment lists. ⚠️ Neither was run, and **I did not touch
`scripts/finding-guards.json`** — the brief warns that `prove:guards` rewrites that tracked file, and
editing registry prose is triage's call, not a reader's.

---

## C3-13 — `blocker` · Today declares **"You're debt-free · Every balance is cleared"** off the app's own estimate, on the same screen that is asking the user to confirm the payoff

**Origin:** `fix-churn` (`apps/rn/src/app/(tabs)/index.tsx`) · `neighbour`
(`apps/rn/src/store/planSelectors.ts`, `trustSelectors.ts` — the side that did not move).

**User-facing consequence.** A **premium** user has **$100** left on their last card with a **$120**
minimum, last verified **two months ago**. They have confirmed nothing since. Today shows:

> 🎉 **You're debt-free**
> *Every balance is cleared. Your paycheck now builds your future instead of paying down the past.*
> …followed by *"Ready to build wealth?"* and a link out to another product.

And **immediately below, on the same screen**, the app says:

> **Looks like you paid off Chase**
> *Your estimate reached $0. **Confirm** it's paid off and it's official.*  · `[Confirm — it's paid off]` · *Not yet — update the balance*

⚡ **One screen, one store, one instant: the app declares the balance cleared as a completed fact and asks
the user to confirm the same payoff, four inches apart.** The $0 is the app's own projection. The user
still owes $100 and never said otherwise.

**File and line.**
- `apps/rn/src/app/(tabs)/index.tsx:141-143` — `engineStore = withProjectedBalances(store, isPremium)`,
  then `const planState = selectPlanState(engineStore, allocation);` — **the PROJECTED store is what the
  plan state is asked about.**
- `:312` — `const isDebtFree = planState === 'debt-free';` → `:318` `<GraduationBanner />`, `:325`
  `<FreedomNextChapterCard />`.
- `apps/rn/src/store/planSelectors.ts:407-417` — `selectPlanState` → `debtLiveness(store)`.
- `apps/rn/src/store/trustSelectors.ts:91-93, 110-112` — `debtLiveness` → `liveDebts` →
  `store.debts.filter((d) => d.balance > 0)`. Given the projected store, `balance` is the estimate.
- The copy: `apps/rn/src/components/plan/GraduationCards.tsx:29-31`.
- The contradiction: `apps/rn/src/components/plan/PayoffInvitationCard.tsx:37-40`.

**The measurement.** Probe: `c3-probes/probe12-today-debtfree.ts`. Premium and free run the identical
store; the tier is the only variable, because `withProjectedBalances` is a documented no-op for free.

```
FREE (control)                                PREMIUM
  CONFIRMED balance        = $100               CONFIRMED balance        = $100
  PROJECTED balance        = $100.00            PROJECTED balance        = $0.00
  pendingDataRepairs       = []                 pendingDataRepairs       = []
  debtLiveness(engineStore)= has-debt           debtLiveness(engineStore)= debt-free
  debtLiveness(store)      = has-debt           debtLiveness(store)      = has-debt   <-- the anchors
  selectPlanState(...)     = normal             selectPlanState(...)     = debt-free  <-- the banner
  provisional payoffs      = []                 provisional payoffs      = ["Chase"]  <-- the invitation
  WIDGET debtFreeDate      = "April 2026"       WIDGET debtFreeDate      = "—"
```

⭐ **`debtLiveness(store)` — the same function on the anchors — says `has-debt` in the premium row.** The
correct answer is one argument away and is computed nowhere on this path.
⭐ **Free is the control and behaves correctly**, which localises the defect to the projection and nothing else.

**Reachability, measured rather than assumed.** I varied the verification gap on the same store:
`$400 / $120` at 2 months → `$280`, `normal`; 3 months → `$160`, `normal`; 4 months → `$40`, `normal`;
11 months → `$0`, **`debt-free`**. So it fires only when the estimate lands at or below zero — which is not
an exotic state, it is **the ordinary last-payment case**: a small final balance and a minimum larger than
it. `$100 / $120` at two months is enough.

**Mechanism (HYPOTHESIS).** `selectPlanState`'s docblock (`planSelectors.ts:394-403`) records that
pass-1 blocker `B1` was exactly this sentence — *"Today rendered 'You're debt-free. Every balance is
cleared.' over debts still owed, permanently"* — and introduced `'debt-free-unverified'` so *"a screen
cannot forget to ask."* That state is reached only through `hasUnreadDebtBalances`, i.e. it covers **one**
way a `0` can be untrue (a repaired import). **A projected `0` is a second way, and it arrives through the
argument rather than through the store.** My hypothesis is that `B1` was framed as a *data-repair* problem,
so the guard was built on the repair records, while the caller was later moved onto `engineStore` for
unrelated reasons (`index.tsx:135-140` documents that move as a performance/consistency change). ⚠️ Stated
as a hypothesis — I found no note weighing `selectPlanState(engineStore, …)` against
`selectPlanState(store, …)`.

⚡ **Every other surface already refuses this exact claim, and says so in writing.**
`widget/snapshot.ts:133-136`: *"⛔ `live`/`cleared` stay on the anchors. A projected estimate reaching `$0`
would put **"Debt-free"** on the Home Screen before the user confirmed anything, which
`selectProvisionalPayoffs` and `PayoffInvitationCard` exist to prevent."* The widget row in the measurement
above confirms it holds — and Today, the screen those two components actually live on, does not.
`GraduationCards.tsx:14-15` shows the author knew the gate existed: *"the one-time celebration spectacle …
are Phase 3 (gated on the confirmed-$0 signal)"* — the **spectacle** was gated on confirmed-$0 and the
**banner** beside it was not.

**Remedy — UNVERIFIED, not applied.** Ask the liveness question of the anchors:
`selectPlanState(store, allocation)`, or pass the projected store only where the projection is what the
question is about. ⚠️ Not run, and the hazards are real. (1) `selectPlanState` also returns `'no-paycheck'`
and `'no-debts'`, and the `allocation` argument is genuinely projected — splitting the arguments changes
more than the one branch. (2) A user who **has** confirmed every balance to `$0` must still get the banner;
on the anchors they do, but this needs a control asserted alongside the fix or it buys correctness with a
withheld true celebration. (3) `provisionalPayoffs` already renders the honest invitation on this exact
store, so the banner is the only thing that needs to stop — **not** the invitation.

---

## C3-14 — `minor` · Money's goals hero says "one target could not be read" when two were

**Origin:** `fix-churn` (`apps/rn/src/app/(tabs)/money.tsx`).

**User-facing consequence.** The user is told to go and fix **a** target and finds **two** broken. It is
the app quantifying its own data loss on a line whose whole job is to send the user to fix it, and it
undercounts.

**File and line.** `apps/rn/src/app/(tabs)/money.tsx:1241-1248`:

```ts
sub={ savedUnread ? 'set them again and your total comes back'
    : targetUnread ? 'saved — one target could not be read'
    : `saved of ${formatWhole(totalTarget)} target` }
```

with `const targetUnread = goals.some((g) => rowFieldUnread(...))` at `:1234` — a **boolean**, so the
sentence's "one" is a literal, not a count.

**The measurement.** Probe: `c3-probes/probe13-goals-hero-copy.ts`. Three goals through the real
`runMigrations`, two of them with an unparseable `targetAmount`:

```
repairs                     = ["g1:targetAmount","g2:targetAmount"]
goals with an UNREAD target = 2 ["House Fund","Car Fund"]
targetUnread                = true
hero sub                   -> "saved — one target could not be read"
```

**Mechanism (HYPOTHESIS).** The same shape as pass-4's `C4-8` — the sibling case this file already fixed
one screen over, where `history.tsx:48` was changed to `plural(summary.cycleCount, 'cycle', 'cycles')`
because *"this line's FIRST render for every user is … `1`"*. Here the reverse holds: `1` is the common
case, so the literal reads correctly almost always and is wrong exactly when the loss is worst. My
hypothesis is that the copy was written against the single-goal fixture the surrounding docblocks all use.

**Remedy — UNVERIFIED, not applied.** Count instead of testing: derive `unreadTargets` (the array is
already one `.filter` away from the existing `.some`) and use the `plural` helper this repo already has
(`@core/utils/plural`), e.g. *"saved — N targets could not be read"*. ⚠️ Not run; `lint:copy` buckets JSX
string literals and a templated sentence here may need the same hoist the sibling rows at `:995-996` use.

---

## C3-15 — `minor` · a Siri-logged payment's only in-app confirmation is outranked by the data-repairs card, so the one surface that proves the payment landed can be invisible

**Origin:** `fix-churn` (`apps/rn/src/app/(tabs)/index.tsx`) · reinforces C3-3.

**User-facing consequence.** Siri says *"Got it — $200.00 toward Chase. Open Debt Planner to record it."*
The user opens the app. The card that says *"Payment logged — I updated your balance"* — the only place the
app confirms the queued payment landed, and the only route to Undo — is in a **single-slot** ack queue
ranked **below** the data-repairs card. A user who has any unacknowledged repair sees nothing about their
voice payment at all.

**File and line.** `apps/rn/src/app/(tabs)/index.tsx:243-266` — `activeAck` is a single value, ranked
`data-repairs` → (celebration suppresses) → `milestone` → `intent` → …; the card renders only under
`{intentRollback && activeAck === 'intent'}` (`:653`).

**The measurement.** By reading the ranking rather than by execution — the branch is JSX and unreachable to
this repo's runners. `activeAck` is assigned exactly once and returns the **first** matching condition;
`'intent'` is fourth of eight. `intentRollback` is session state on the zustand root (not inside `store`),
and `storeActions.test.ts:892` asserts *"an unrelated edit INVALIDATES the whole-store snapshot"* — so the
Undo affordance is not merely deferred behind the repairs card, it can be **destroyed** while waiting, by
the very edit the repairs card is asking the user to make.

**Mechanism (HYPOTHESIS).** The ranking is deliberate and well argued — `:238-241`: *"money the app could
not READ outranks every other ack … none of those statements is trustworthy while part of the plan is a
repaired zero."* That reasoning is about **statements the app derives**. The intent ack is not a derived
statement; it is a **receipt for an action taken on another surface**, and it is the only one. My hypothesis
is that the ranking was designed before `3.5.5`'s voice log-a-payment existed and the new ack was slotted
into the existing ladder rather than reconsidered against it.

**Why minor.** The balance itself is updated correctly; nothing false is stated. What is lost is the
confirmation and the undo.

**Remedy — UNVERIFIED, not applied.** A receipt for an off-app mutation is arguably not an "ack" and could
render outside the single slot — but that is a design call, not a fix. ⚠️ Not run. ⚠️ **Do not simply
re-rank it above `data-repairs`**: that inverts an ordering with a measured blocker behind it
(`P6.8.7c.2 [B4/M3-2]`).

---
---

# C3 — the round, SPLIT BY ORIGIN

**15 findings: 8 blocker · 5 major · 2 minor.**
**Files read: 75 of 75 in `ROUTING-C3.txt`, plus 3 supporting files** (`appIntents/pendingActionBridge.ts`,
`appIntents/pendingActionBridge.types.ts`, `testing/runAppTests.ts`). Every path in `READ-C3.txt` is
git-tracked; none is duplicated. 13 of the 15 findings carry an executed probe under `c3-probes/`.

## By origin

| origin | files in manifest | findings | blocker | major | minor |
|---|---|---|---|---|---|
| **`fix-churn`** | 11 | **9** — C3-1 · C3-2 · C3-7 · C3-8 · C3-9 · C3-10 · C3-13 · C3-14 · C3-15 | 5 | 2 | 2 |
| **`stale-read`** | 57 | **5** — C3-3 · C3-4 · C3-5 · C3-6 · C3-11 | 3 | 2 | 0 |
| **`s0-first-look`** | 2 | **1** — C3-12 | 0 | 1 | 0 |
| **`neighbour`** | 3 | 0 standalone | — | — | — |
| **`first-look`** | 1 | 0 | — | — | — |
| **`instrument`** | 0 | — | — | — | — |

⚠️ **The origin split understates `fix-churn` and it is worth saying how.** `fix-churn` is **11 of 75
files (15%)** of this manifest and produced **9 of 15 findings (60%)**, including **5 of 8 blockers**. Every
one of those five is a **pass-6 repair that reached one member of its class**:

| finding | the pass-6 fix | what it reached | what it did not |
|---|---|---|---|
| C3-1 | `C3-4` put the unread debt back in Siri's list | the membership | the `$0` it prints beside it |
| C3-7 | `B3-3` added `'ready-unreadable'` | every `status !== 'ready'` in the sheet | the `status === 'ready'` in the hook |
| C3-8 · C3-9 | `C3-5` widened the widget's guard to `'row-figures'` | `widget/snapshot.ts` | Money's hero · Progress's date · (C3-11) the forecast |
| C3-13 | `B1` gave the debt-free claim a state (`debt-free-unverified`) | a `0` from a repaired import | a `0` from the app's own projection |
| C3-10 | `C3-10` cleared the App Group on delete-all | the queued intent | the widget snapshot it names first |

⚠️ **No file in this manifest carries the `instrument` origin, and four of the findings are still about
instruments** — `C3-2` (a test whose label states a consequence it cannot see), `C3-6` (an assertion that
stops one call short of the screen), `C3-7`'s second half (a guard that reads one file and one spelling,
and a `LAYERS.length === 8` that cannot detect a consumer that was never listed), `C3-12` (a suite cited as
evidence over subjects it does not assert on). **Routing by file origin does not find these; reading the
claim a check makes about itself does.**

⚠️ **`first-look` produced nothing, and that is a result rather than a gap.**
`appIntents/siriClaims.test.ts` is this lane's only `first-look` file. I read it in full, verified all
three Swift files it reads still exist at those paths, confirmed it is wired into `runAppTests.ts:34`, and
checked its assertions against `LogPaymentIntent.swift` and both `PaydayLandedIntent.swift` copies. It
holds, its `⚠️ THIS IS A SOURCE SCAN` caveat is accurate, and the pass-6 `C3-7` sentence it guards is
genuinely gone. [D69] exempts a first-look finding from the convergence count; there is none to exempt.

## The class this round is really about

**Eight of the fifteen are one question asked in five places with five different answers:** *may this
surface state a figure derived from the premium projection?*

| surface | guard | verdict |
|---|---|---|
| `widget/snapshot.ts:216` | `mayClaim('debt-balances') && mayClaim('row-figures')` | ✅ correct (pass-6 `C3-5`) |
| `app/(tabs)/progress.tsx:283` | `mayClaim('debt-balances')` | ❌ **C3-9** |
| `app/(tabs)/money.tsx:421` | `hasUnreadDebtBalances(store)` | ❌ **C3-8** |
| `app/cushion-forecast.tsx` | none | ❌ **C3-11** |
| `app/(tabs)/index.tsx:143` | `selectPlanState(engineStore, …)` | ❌ **C3-13** — the projection is the *argument*, so no guard could have helped |

⛔ **Fixing these one file at a time rebuilds the defect a sixth time.** The unit is the question, owned
once, with the caller's basis (anchors vs projection) part of the answer.

## Scope limits I am stating rather than leaving implied

- **Nothing here builds the Swift target.** C3-1, C3-2, C3-5, C3-6 and C3-10 make claims about what a
  widget, a Live Activity or Siri *renders or speaks*; each is a **source-scan finding** and says so in
  place. What is measured in every case is the JS value handed across the boundary, or the absence of a
  field that could carry the distinction.
- **Frequencies are not measured.** C3-5 and C3-10 depend on how often a best-effort native write is
  dropped; C3-4 depends on iOS delivery behaviour under a revoked permission; C3-3's replay half depends
  on a `UserDefaults` removal not persisting. Each says which half is measured and which is not.
- **I did not enumerate `hasUnreadDebtBalances`'s other call sites** (C3-8) or the guard registry's other
  citation patterns (C3-12). Both are named as owed work rather than left silent.
- **Nothing was fixed and nothing outside this directory was written.** ⚠️ `scripts/prove-guards.ts` was
  already modified when this lane started and `docs/cutover/v17-envelope.json` is modified now; **neither
  is mine** — I ran no `prove:guards`, no Playwright, no monorepo typecheck, and started no server.

