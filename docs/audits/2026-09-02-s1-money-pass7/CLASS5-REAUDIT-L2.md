# Class 5 re-audit, round 1: lane L2 (surfaces outside the app)

- **Lane:** L2: Siri (TS + Swift), Live Activity (sync, bridge, Swift), widget snapshot, queued-intent replay record in `store.ts`
- **Pin:** `ea3f5e0e` · **class-5 range:** `c7df99c2..ea3f5e0e`
- **Primary worktree:** `C:/Users/Jason/audit-c5r1-L2` (detached at pin) · **base worktree:** `C:/Users/Jason/audit-c5r1-L2-base` (at `c7df99c2`, torn down at end)
- **Worst-case spend quote:** one agent, no sub-agents, at most ~200 tool calls and ~3M context tokens. Longest single jobs are targeted `test:app` / single-id `prove:guards` runs (heap 1536 MB, each a few minutes at most). No Playwright, no whole-monorepo typecheck, no Swift compile.
- **Status: COMPLETE**

## Summary

| severity | attributable | reservoir | class4-tail | total |
|---|---|---|---|---|
| blocker | 0 | 0 | 0 | **0** |
| major | 0 | 1 (L2-4) | 0 | **1** |
| minor | 2 (L2-1, L2-3) | 1 (L2-2) | 0 | **3** |
| **total** | **2** | **2** | **0** | **4** |

- **Attributable to class 5 (2, both minor):**
  - **L2-1:** after an in-window payday edit, the Lock Screen button queues the activity's stale attribute date and the tap rolls nothing. Introduced by `3066026a`; latent behind the filed countdown row.
  - **L2-3:** `.5.4f`'s "a dismissed activity is restarted" claim is unpinned. Three plants stayed green; visibility controls in the same files redded.
- **Reservoir (2):**
  - **L2-4 (major):** the return-to-foreground drain destroys a queued Siri payment behind the read-failed screen, measured identically at the base and the pin.
  - **L2-2 (minor):** `.5.7.4a-1`'s closure is incomplete at the 50-id cap and under a restore carrying 50 foreign ids. The replay predates the class.
- **No L2 files belong to class 4's tail** (the manifest has none).
- **Closures:** 6 of my own plants on class-5 fixes redded for their named reasons (plus 2 visibility controls), and **18 of 18** registry guards pinned to L2 files MATCHED on re-execution. The open closure gap is L2-3.
- **New evidence on a filed row (not counted):** pass-6 `C3-6`'s double roll stays open for UNDATED entries drained after the next payday, on all four cadences. That is by 🎯's fallback rule.
- **Not a compile claim:** no Swift was compiled. The Swift `Decodable` default-value premise is recorded as a HYPOTHESIS for `native-e2e`.
- **Tree state:**
  - Main checkout: only this report and `class5-reaudit-probes/L2/` from me.
  - `audit-c5r1-L2-base`: removed (junctions `rmdir`'d first, main `node_modules`/`packages/core` verified intact).
  - `audit-c5r1-L2`: left in place per the driver's override, with every plant restored (`cmp`). Its only diff is `scripts/finding-guards.json`'s `measured`/`sha` stamps, written by `prove:guards` itself.

## Setup verified

- Pin `ea3f5e0e` = `git log -1 -- CLASS5-REAUDIT-BRIEF.md`. Worktree HEAD `ea3f5e0eccb6`, clean, three junctions present.
- Range derived from git: **77 commits** `c7df99c2..ea3f5e0e` (76 + the brief's own commit), **70 code files** under `apps packages scripts`. That matches the brief. The L2 manifest is **24 files, +937/-130**.
- Baseline `npm run test:app` at the pin: **green, exit 0, 93 s** (`class5-reaudit-probes/L2/baseline-test-app.log`).
- Base worktree `C:/Users/Jason/audit-c5r1-L2-base` at `c7df99c2`, made with the recipe (three junctions).

## Findings

### L2-1 · minor · attributable: after an in-window payday edit, the Lock Screen "Payday landed" button is dead

- **Consequence:** the Live Activity keeps the payday it was STARTED for, because `paydayDateISO` is an ActivityKit attribute and fixed for the activity's life. Since `3066026a` the button queues that attribute. When the plan's payday changes while an activity is running, the manager sends `update`, not a restart. The countdown moves to the new payday and shows the button (`daysUntilPayday == 0`), but the tap names the OLD payday. `applyPaydayLandedIntent` refuses it (`named !== landing`), so the plan does not roll and no Undo card appears. Nothing tells the user the tap did nothing.
- **Where:** `apps/rn/targets/widget/PaydayLiveActivity.swift:12` (`paydayDateISO: context.attributes.paydayDateISO`) and `:78` (the button) · `apps/rn/src/liveActivity/paydayActivityContent.ts:172-174` (`running` plus a changed key gives `update`) · `apps/rn/modules/live-activity/ios/LiveActivityModule.swift` `updateActivity` (pushes `toState()`, which has no `paydayDateISO`; both `PaydayActivityAttributes.swift` copies keep the date only as an attribute) · `apps/rn/src/store/store.ts:780`.
- **Measurement** (`class5-reaudit-probes/L2/p1-stale-attributes.pin.ts` → `p1-pin.out`): real `createDebtStore` plus the real `startLiveActivitySync`, through a bridge stub that models the Swift exactly (start sets the attribute, update sets state only). Premium, toggle on, payday tomorrow (2026-09-15). The user then corrects the payday to today through `updatePaycheck({currentDate, nextPaycheckDate})`, which is exactly what `PaycheckSheet.submit` writes.
  - calls `start(2026-09-15), update(2026-09-14)` · attribute `2026-09-15` · state `2026-09-14`, days 0, **button visible**
  - **subject:** tap carries the attribute (what the Swift queues) → **rolled 0**, plan still on `2026-09-14`
  - **control:** same store, tap carrying `2026-09-14` → rolled 1. The fixture really can roll.
- **Reproduces at `c7df99c2`? NO.** `p1-stale-attributes.base.ts` → `p1-base.out`: the same edit also answers `update` at the base, but the base button queued an UNDATED `PaydayLandedIntent()`, and that tap **rolled 1**. The stale attribute existed before and was harmless. Class 5 made the button read it.
- **Mechanism (HYPOTHESIS for the device half):** the TS half is measured above. The Swift half is read, not run: ContentState has no date, the attribute is immutable, and the button reads the attribute. Swift cannot be compiled here.
- **Why minor, not major:** it is latent behind the filed row *"THE PAYDAY COUNTDOWN LIVE ACTIVITY ALMOST NEVER STARTS"* (`currentDate` does not move with the calendar). Today the button is reachable mainly through a paycheck edit, and the dead case is exactly an edit that changes the payday while an activity is running. Once that row lands, a holiday-shifted payday corrected inside the 3-day window is the ordinary path. Re-grade then.
- **Remedy (UNVERIFIED):** restart rather than update when `content.paydayDateISO` differs from the date the running activity was started with (the manager would have to remember it). Or carry the payday in ContentState and have the button read `state`. ⚠️ The backlog rejected "the button's own day count" for inheriting the frozen countdown. A state-carried DATE is a different thing, but check it against that rejection.

### L2-2 · minor · reservoir (closure incomplete): the applied-intent record forgets ids whose entries are still queued

- **Consequence:** `.5.7.4a-1` is closed only while the stuck queue holds 50 or fewer entries, and only while no restore brings in 50 foreign ids. The mechanism the record exists for is a swallowed App Group clear. That queue keeps GROWING, so each new intent pushes an older id out of the 50-cap while its entry is still in the queue. The evicted entry is applied again, which evicts the next one, and so on. `appliedIntents.ts:15`'s premise *"an id only needs remembering while its entry can still be in the queue"* does not hold under its own mechanism.
- **Where:** `apps/rn/src/store/appliedIntents.ts:38` (`withAppliedIntent` slice) and `:52` (`carryAppliedIntents` appends the incoming store's ids AFTER the outgoing ones and slices, so the outgoing store's ids go first, against its docblock's *"keeping every id the outgoing store had recorded"*).
- **Measurement** (`p2-cap-eviction.ts` → `p2-pin.out`), real store, clear swallowed exactly as in `pendingActions.test.ts`:
  - 50 queued $1 payments, drained three times: **4950 · 4950 · 4950** (control, honest)
  - **51 queued: 4949 · 4898 · 4847.** Every drain after the first re-takes all 51.
  - 60 queued: 4940 · 4880 · 4820
  - growth shape, one new Siri payment per drain, 55 drains: **$265 taken for $55 paid**
  - restore of a backup carrying k ids the live store lacks, then drain the still-queued latest payment: k=0 kept, 4999 → 4999 · k=1 kept, 4999 → 4999 · **k=50: latest id evicted, 4999 → 4998 (re-applied)**
- **Reproduces at `c7df99c2`? YES**, in a larger form (`p2-base.out`): with no record, 50 queued gives 4950 · 4900 · 4850, and the growth shape takes $1,540. The replay predates class 5 (filed as `.5.7.4a-1`). What remains is the part of it the fix does not reach.
- **Mechanism:** measured, not hypothesised. The precondition (a clear that keeps failing across 51 or more intents, or a restore from a store with 50 or more ids this one lacks) is what makes it minor. I did not measure how often `clearPendingActions` fails on a device. It is `removeObject`, and `native()` throwing would also fail the read.
- **Remedy (UNVERIFIED):** evict only ids whose entries are no longer in the queue (the drain can pass the live queue's ids). Or, in `carryAppliedIntents`, put the outgoing store's ids LAST so a slice drops the incoming ones first. The second alone does not fix the growth shape.

### L2-3 · minor · attributable: "a dismissed Live Activity is restarted" is claimed by `.5.4f`, pinned by nothing, and green with either half removed

- **Consequence if either half regresses:** the user dismisses the Payday Countdown (or the system ends it). The manager then believes it is still running for the rest of the session and sends every later update to nothing. No new countdown starts until relaunch, while the store says one should be showing. Separately, after the user turns Live Activities OFF and back ON, the first commit sends `update` to nothing instead of `start`.
- **Where:** `apps/rn/src/liveActivity/liveActivitySync.ts:62-67` (refused `update` resets `running`/`lastKey`; its comment: *"Believing it is still running would send every later update to nothing; the next change starts one"*) · `:51-55` (disabled resets the belief) · `apps/rn/modules/live-activity/ios/LiveActivityModule.swift` `updateActivity`, `return !live.isEmpty` (*"That is the one `false` this can honestly return"*).
- **Measurement:** plant runner `class5-reaudit-probes/L2/plant.py` via `plants.sh` → `plants.out` (clean before · byte plant · restore in `finally` · `cmp` · clean after):
  - **PL1** remove the refused-update reset → `liveActivitySync.test` **exit 0 (not caught)**
  - **PL2** Swift `return !live.isEmpty` → `return true` → **exit 0 (not caught)**
  - **PL15** remove the disabled-path reset → **exit 0 (not caught)**
  - Visibility controls, same files, same command: **PL1c** (a landed start not stamped) reds at *"…the update was attempted and dropped…"* · **PL2c** (`AsyncFunction("updateActivity")` → `Function`) reds at *"⛔ Swift — updateActivity is an async function that answers Bool"*. The suite reads both files, so the three greens are real gaps, not blindness.
  - Mechanism of the gap (read from the test): the stub's `refuse.update` answers `false` while the activity is still "live", so case A passes whether or not `running` resets. No case dismisses an activity and then asserts a `start`. The source scan checks only `AsyncFunction(...) async -> Bool`, never what `updateActivity` returns. The enable-mid-session case starts from disabled-at-launch, so `running` was never true.
- **Reproduces at `c7df99c2`?** Cannot be measured there: the branch did not exist. At the base `update` always stamped `lastKey` and never cleared `running` (`git show c7df99c2:…/liveActivitySync.ts:52-55`). So the underlying never-restarts defect is older than the class. **What is attributable is the class-5 closure claim with no proof behind it** (`[D79]` question 1: *"a closure you cannot make red by planting is OPEN"*). The code at the pin is correct as read.
- **Remedy (UNVERIFIED):** a stub whose `update` answers `false` *because the activity was dismissed* (clear `lock.screen` and refuse), then assert the next commit sends `start` and the Lock Screen matches the store · a disable → enable case that starts from a running activity · pin `return !live.isEmpty` by source, in the file's existing style. ⚠️ Per the brief, `authored` is 9 of cap 9, so a new registered proof re-enters the record deadlock.

### L2-4 · major · reservoir: a queued Siri payment is destroyed when the app returns to the foreground behind the read-failed screen

- **Consequence:** the store read throws at launch (a locked keychain right after boot is `hydrate`'s own named ordinary case). The app shows the retry surface over DEFAULT data. If the user switches away and back, the return-to-foreground drain runs against that default store:
  - a queued Siri payment dispatches to a debt that does not exist (a silent no-op)
  - a Lock Screen roll is refused
  - then **the queue is cleared**

  The retry reads the real store back, and the payment Siri told the user to *"Open Debt Planner to record"* is gone from every surface. The launch drain was deliberately gated for exactly this (`_layout.tsx:115-119`: *"none of the syncs below should mirror DEFAULTS out to … a queued intent while the retry surface is up"*). Its foreground twin was not.
- **Where:** `apps/rn/src/app/_layout.tsx:184-189` (`next === 'active'` → `drainPendingActions()`, no `storageError`/`isHydrated` check) against `:119` (the launch path's `storageError === 'read-failed'` return) · `apps/rn/src/appIntents/drainPendingActions.ts:25-27` (clears after an apply that changed nothing).
- **Measurement** (`p5-foreground-drain-read-failed.ts`), real `createDebtStore` and real `hydrate` with an adapter whose first read throws, then the retry exactly as `_layout.tsx:270-271` does:
  - **control** (read OK): foreground drain applies, final balance **4750** (expected 4750)
  - **subject** (read failed, foreground drain, retry): at drain `storageError: "read-failed"`, `isHydrated: true`, 0 debts · drain reports 1 applied · queue **cleared** · after retry and launch drain, final balance **5000** (expected 4750). The payment is lost.
- **Reproduces at `c7df99c2`? YES** (`p5-base.out`, identical numbers; the base `_layout.tsx` has the same ungated drain at `:184-189`). Reservoir. **At the pin** (`p5-pin.out`): identical, control 4750, subject **5000**. Class 5 neither caused nor fixed it.
- **Mechanism (HYPOTHESIS for the device half):** the store half is measured. That iOS delivers an `AppState` `'active'` change while the retry surface is up, before a retry, is the device premise. It is the ordinary result of leaving the app and coming back, but it was not run here.
- **Class-5 interaction (read, not a new defect):** `.5.7.4a-1`'s record does not help, and could not: the drain skips nothing, because a payment to a missing debt returns before `withAppliedIntent` and records no id. The loss happens at the clear, which the record was never meant to cover.
- **Severity:** major rather than blocker, because it needs a read failure plus a foreground return before a retry. Money the user reported paying silently never lands.
- **Remedy (UNVERIFIED):** gate the foreground drain on `storageError !== 'read-failed'` (and `isHydrated`), as its launch twin is. ⚠️ A deeper remedy would have the drain clear only entries it actually applied, or record-and-keep entries whose debt was not found. That changes `.5.7.4a-1`'s design, and a skipped entry must not re-apply after a real restore, so it needs its own measurement.

## Plants on class-5 closures in L2's files: redded for the named reason

`plants.out`. Each: clean before exit 0 · planted exit 1 · `cmp` restore True · clean after exit 0. The failing assertion is quoted.

| plant | subject | red at |
|---|---|---|
| PL16 | undated fallback always rolls (`clock() < landing` → `false`) | *"⛔ C3-6 — an undated intent before payday rolls nothing (expected 0, got 1)"* |
| PL16b | dated rule dropped, clock only | *"⛔ C3-6 — two taps for one payday, drained after the next payday arrived, still roll once (expected 1, got 2)"* |
| PL17 | unreadable date falls back to undated | *"⛔ C3-6 — parse: an unreadable payday date ("2026/09/14") drops the entry…"* |
| PL18 | log-payment id not passed through apply | *"⛔ 4a-1 — a log-payment that outlives its drain is not applied again after a second drain"* |
| PL19 | payday-landed id not passed through apply | *"⛔ 4a-1 — a payday-landed that outlives its drain is not applied again after Undo"* (a dated/clock rule alone does not cover Undo, so the id is load-bearing) |
| PL12 | `catch` returns `''` again (`snapshot.ts`), full `test:app` | *"⛔ D2-12 — a thrown Guardian read is spoken for premium, never collapsed to the empty upsell"* |
| PL1c / PL2c | visibility controls for L2-3 | see L2-3 |

⚠️ The harness left `apps/rn/src/__run_L2_las.ts` on disk only until its `EXIT` trap. A `git status` printed inside the script showed it; after exit it is gone (`ls` empty, status shows only the harness's registry stamps).

## P4 (cadences, and an older build's undated queue): pin half

`p4-pin.out`, weekly · biweekly · semimonthly · monthly:
- **dated, two taps, drained after the next payday:** 1 cycle each (base: 2). Closed on every cadence.
- **undated, two taps, same day:** 1 each (base: 2).
- **undated, two taps, drained after the next payday arrived:** **2 each (base: 2).**

Not filed as a defect: 🎯's decision is that an undated entry rolls once *"the store clock has reached `nextPaycheckDate`"*. On a late drain the second tap satisfies that rule, so it is implemented as decided. ⚠️ **New evidence for the pass-6 `C3-6` row** (not a new finding): the undated fallback leaves pass-6 `C3-6`'s double roll open on every cadence for an older build's queue, or two Shortcut runs, drained after the next payday. That is exactly the case `pendingActions.test.ts`'s *"drained after the next payday arrived"* row covers only for DATED taps.

## Measured non-defects (with control)

- **"A JS bundle newer than the installed binary"** (brief lead): unreachable in production. `expo-updates` is in neither `package.json`, and `app.json`/`app.config.js` configure no `updates`/`runtimeVersion` (grep, empty). The JS always ships with its binary. (Not planted: nothing to plant.)
- **A dated tap naming the plan's next payday before it arrives rolls** (`p1-pin.out`, `control-no-edit`: payday tomorrow, tap names tomorrow, rolled 1). The rule has no clock check. The Lock Screen cannot produce this tap: the button needs `daysUntilPayday == 0`, and the stored `currentDate` is never later than the real date. The one reachable route is a hand-built Shortcut that sets the exposed `@Parameter(title: "Payday")` to a future date. Recorded, not filed.
- **Every store-replacement door goes through the set wrapper that carries the record** (lead: *"each store-replacement door"*). Census at the pin:
  - `importStore(` production callers (all through `set`): `_layout.tsx:245` · `DataResetScreen.tsx:110` · `BackupSheets.tsx:164` · `use-cloud-backup.ts:251` · `persistence.ts:203` (the legacy bridge). `lint:restore-doors` derives the same population by the same regex (`check-restore-doors.ts`).
  - Other writers of `store` through `set`: `reset()` · `undoIntentAction()` · `hydrate()`.
  - Raw `setState` in production: `_layout.tsx:75/270/283` (none sets `store`) · `sandboxStore.ts`/`sandboxBeats.ts` (the SANDBOX store, never the real one).
  - `pendingActions.test.ts` drives a second drain, Undo, restore and reset through the real store. The carry is re-proven below (`S1P7-57-4A2-CARRY-REPLACEMENTS`).
  - A backup OLDER than the record (no ids) keeps the live record: `p2-pin.out`, P3 k=0 → re-drain 4999 → 4999.
- **`hydrate` keeps the record** (lead: relaunch): `runMigrations` preserves the key, asserted at `pendingActions.test.ts:226`. `readBackup.ts:83`'s `Object.entries` walk is the v1.6-file path only, so the new key cannot surface there as an "unknown" field.
- **Exact claims per surface (🎯), as implemented in L2's files:** the Live Activity (`paydayActivityContent.ts:83`) and Siri's spoken read (`snapshot.ts:106`) ask `'paycheck-plan'`, the same claim as the in-app Guardian card (`index.tsx:373`, `PaydayGuardianCard.tsx:122`). Census by `git grep` at the pin. No L2 surface still asks `'required-plan'`.
- **"Siri's `''` means one thing": every intent in the file.** There is exactly ONE copy of `SiriQueryIntents.swift` (`plugins/app-intents-swift/`; `find` over `apps/rn` excluding `node_modules`). The brief's "both Swift copies" applies to `PaydayLandedIntent`, not to Siri. Of the four intents in the Siri files, only `PaycheckCheckIntent` reads `guardianSpoken`. `DebtFreeDateIntent`/`RemainingDebtIntent` read `balancesUnread` first. `LogPaymentIntent` gates on `isPremium` through a loose `JSONSerialization` read. On the TS side, `buildGuardianSpoken` returns `''` only behind `subscriptionPlan !== 'premium'` (`snapshot.ts:88`), and every premium branch returns a non-empty sentence, including the `catch`. Plants below.
- **"Can a failed Live Activity stamp loop?"** No. `evaluate`'s `do…while(again)` repeats only when a store commit arrived during the reconcile, and `reconcile` writes nothing to the store. A refused `start` is retried only on the next commit; there is no timer or foreground retry. That is the same policy as `widgetSync` (pass-6 `C3-12`). At `c7df99c2` a refused start stamped `running = true` for the session, which was strictly worse.
- **The dated tap has no timezone or DST edge in JS** (lead). The store clock is `todayLocalISO = todayLocalISODate` (`defaults.ts:15`), which is `toLocalISODate(new Date())`: local `getFullYear/getMonth/getDate`, no `toISOString`, no UTC shift (`packages/core/utils/localDate.ts:16-34`). The rule at `store.ts:780` is string equality (`named !== landing`) plus a `YYYY-MM-DD` lexical compare (`clock() < landing`), and both sides are local calendar strings. `wholeDaysBetween` anchors both ends at UTC midnight, so DST cannot change a day count. The Swift side only passes the JS-written string through. Residual, not a defect: a user who crosses timezones between the tap and the drain is judged on the device's local date at drain time. Not planted (a reading of pure string logic; the rules themselves are planted below as PL16/PL16b).
- ⚠️ **HYPOTHESIS, not measurable here: Swift's synthesized `Decodable` does not use a property's default value for a MISSING key.** It calls `decode`, which throws `keyNotFound`. If so, the premise in `SiriQueryIntents.swift:18-24` (*"Defaults to `false` so an OLD snapshot … still speaks"*) is false as stated: a snapshot missing the key fails the whole `try?` decode, so `load()` returns `DebtSnapshotRead()` (`hasData: false`). **For `.5.7`'s `isPremium` this changes nothing observable,** because every snapshot since 3.5.5 carries `isPremium` (`snapshot.ts` `WidgetSnapshot`). The pass-6 `balancesUnread` key predates the range. `widgetSync.test.ts:254` pins the literal `var isPremium: Bool = false` as though the default mattered. Swift cannot be compiled here, so this is not filed as a defect. It is a premise for `native-e2e` to check.

## Cumulative: re-executed guards whose `proof.unfix[].at` is an L2 manifest path

Population derived from the pin's registry: **18 entries** (all `run: test:app`, none Playwright-backed). Log: `class5-reaudit-probes/L2/prove-guards-18.log`.

- First attempt: harness fault on the first id, `:4319` in use (L3).
- Second attempt, **9 of 18 MATCHED** (plant applied · planted exit 1 · control exit 0):
  - pre-range guards: `S1P3-D3-1-WIDGET` · `S1P3-D3-2-SPOKEN` · `S1P3-D3-7` · `S1P5-C5-2-WIDGETPARITY` · `S1P6-A3-3-UPDATE-BY-ID`
  - class-5 closures: `S1P7-C3-5-LIVEACTIVITY-UPDATE-LANDED` · `S1P7-C3-5-LIVEACTIVITY-START-LANDED` · `S1P7-C3-6-LIVEACTIVITY-END-LANDED` · `S1P7-C3-1-SIRI-DEBTSJSON-UNREAD`
- The second attempt then **faulted at `S1P7-C3-2-SIRI-PREMIUM-UPSELL`: `:4319` was taken mid-run** (L3). No verdict, and the listener was left alone. The remaining 9 are re-run below.
- Third attempt (`prove-guards-9-rerun.log`): **3 more MATCHED**: `S1P7-C3-2-SIRI-PREMIUM-UPSELL` · `S1P7-D2-12-SIRI-NO-PLAN-UPSELL` · `S1P7-C3-2-SIRI-SWIFT-PREMIUM-FALLBACK`. It then faulted again at `S1P7-57-3-WIDGET-DIRECTION` on `:4319` (L3). **12 of 18 MATCHED.** The last 6 are run one id at a time, each waiting for the port (`prove-remaining.sh` → `prove-guards-remaining.log`).
- Fourth pass: **6 of 6 MATCHED**, no port faults: `S1P7-57-3-WIDGET-DIRECTION` · `S1P7-57-4A2-REPLAY-ONCE` · `S1P7-57-4A2-CARRY-REPLACEMENTS` · `S1P6-C3-6-DATED-TAP` · `S1P6-C3-6-HANDLED-NO-REFUSAL` · `S1P6-C3-6-BUTTON-NAMES-PAYDAY`.
- ✅ **Result: 18 of 18 L2-pinned guards red on their own defect with a green control.** No guard whose pinned file moved in class 5 has gone dead.
- ⚠️ **Harness side effect, in the primary worktree only:** `prove:guards` rewrites each proven entry's `measured`/`sha` in `scripts/finding-guards.json` (`git diff --stat`: 17+/17-). That is the harness's own record-keeping and was left for the driver's worktree removal. Nothing in the main checkout was touched.

## Files actually opened

Read in full, at the pin unless marked:
- **Intents and queue:** `apps/rn/src/appIntents/drainPendingActions.ts` · `pendingActions.ts` · `pendingActions.test.ts` · `siriClaims.test.ts`
- **Applied-intent record and store:** `apps/rn/src/store/appliedIntents.ts` · `store.ts` (lines 330-520 set wrapper/hydrate/reset · 740-830 intent actions/Undo · 1060-1110 `importStore`)
- **Live Activity:** `apps/rn/src/liveActivity/liveActivitySync.ts` · `liveActivitySync.test.ts` · `paydayActivityContent.ts` · `liveActivityBridge.ts` · `.native.ts` · `.types.ts` (via diff)
- **Widget and Siri JS:** `apps/rn/src/widget/snapshot.ts` · `widgetSync.ts` · `widgetSync.test.ts` (lines 236-260) · `apps/rn/src/store/logPaymentCopy.ts` (head)
- **Swift:** `apps/rn/modules/live-activity/ios/LiveActivityModule.swift` · `PaydayActivityAttributes.swift` (both copies) · `PaydayLandedIntent.swift` (both copies, diffed against each other) · `apps/rn/targets/widget/PaydayLiveActivity.swift` (via diff) · `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift` · `LogPaymentIntent.swift`
- **Callers and guards:** `apps/rn/src/app/_layout.tsx` (110-200) · `apps/rn/src/app/more.tsx` (160-190) · `apps/rn/src/components/plan/PaycheckSheet.tsx` (55-95) · `apps/rn/src/store/realWriteGuard.ts` (40-120)
- **Instruments:** `scripts/check-restore-doors.ts` (1-80) · `scripts/prove-guards.ts` (usage and restore mechanics)
- **Docs:** the brief · `RESUME-PROTOCOL.md` · `CLASS5-REAUDIT-LANES.tsv` · `CLASSIFICATION.md` §CLASS 5-9 · `DEBT_ELEVATION_PLAN.md` 57, 80-100 · `DEBT_ELEVATION_BACKLOG.md` 1555-1625
- **At `c7df99c2`:** `liveActivitySync.ts` (36-66) · registry id set

## Derived class-5 membership (L2's slice) and disagreements

Sources compared:
- `CLASSIFICATION.md` §CLASS 5: **13 rows**.
- `DEBT_ELEVATION_PLAN.md` `.12.6.5` rows.
- The range's commit messages: ids counted by regex.
- Registry: `c7df99c2` 302 entries → pin 330, **28 added, 0 removed** (matches `.5.7.1`'s `MIN_ENTRIES 316 → 330`).

L2 closures derived: `C3-5` · `C3-1` · `C3-2` · `D2-12` · pass-7 `C3-6` (folded into `.5.4f`) · pass-6 `C3-6` (reopened, closed at `.5.7.4a.3`) · `.5.7.4a-1` (no pass id) · `.5.7`'s Siri Swift fallback (defence in depth on `C3-2`).

Disagreements:
1. **Pass-7 `C3-6` is a CLASS 8 row in `CLASSIFICATION.md`** (*"the assertion that pass-3 `D3-2`'s fix reaches the screen stops one call short"*). The plan's `.5.4` list and registry entry `S1P7-C3-6-LIVEACTIVITY-END-LANDED` (*"major, folded"*) close it inside class 5. The 13-row table does not list it.
2. **Pass-6 `C3-6`** is closed at `.5.7.4a.3` under registry ids `S1P6-C3-6-*`, a pass-6 prefix on a class-5 closure. It is not in the 13-row table. The commit log mentions "pass-6 C3-6" 2×, while bare "C3-6" appears 5× across both passes (the id collision the brief warns about).
3. **`.5.7.4a-1`** (the double-applied Siri payment) carries no pass id, is closed by `S1P7-57-4A2-*`, and appears in neither the table nor the plan's id list.
4. Of the 13 table rows, **6** have a registry entry named for them among the 28 added (`C3-5`, `C3-1`, `C3-2`, `D2-12`, `B1-1`, `C3-14`). `C3-8` appears only as a "free-tier twin" step-3 entry. No added entry names `C3-9` · `C3-11` · `C3-13` · `C1-1` · `C1-5` · `C1-6`. Those are L1/L3/L4 surfaces, so this is recorded, not chased; they may be pinned by e2e or by pre-existing entries.
5. Pulled in from other classes: `B1-2` (class 6, `.5.7.4b.1`) · `C1-2` (class 6, `.5.2`) · `C1-3` (swept). `B5-7` is named 5× in commit messages and appears in no class-5 list; not an L2 file.

## P4 (cadences, and an older build's undated queue): base half

`p4-cadence-undated.ts` → `p4-base.out` (c7df99c2; the base parser drops `paydayDateISO`, so every tap is undated there): weekly · biweekly · semimonthly · monthly each roll **2** cycles for two taps, in all three shapes (dated drained late, undated drained late, undated same day). That is reopened pass-6 `C3-6`, reproduced at the base. Pin half below.
