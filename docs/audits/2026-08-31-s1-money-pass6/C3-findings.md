# C3 — the routes, and the surfaces OUTSIDE the app (pass 6)

Manifest: 77 files. Subject: `apps/rn/src/app/` (route tree + screens), `hooks/`, `widget/`, `premium/`,
`liveActivity/`, `appIntents/`, `notifications/`, `theme/`, `motion/`, `keyCommands/`.

Probes were run with `npx tsx --tsconfig apps/rn/tsconfig.json` on a throwaway file in this directory,
deleted after. Nothing outside these two deliverables was modified.

---

## C3-1 — Siri speaks the widget's REFUSAL SENTINELS as if they were values: *"You're on track to be debt-free by Balances unread."* · *"You have — in debt remaining."*

**Severity: blocker.** **Origin:** `apps/rn/src/widget/snapshot.ts` = `fix-churn`. `SiriQueryIntents.swift` /
`DebtViews.swift` are the consumers (off-manifest, read as evidence).

**User-facing consequence.** A user whose restored or imported store lost a balance asks Siri *"How much do I
owe in Debt Planner?"* and hears **"You have — in debt remaining."** They ask *"When am I debt-free in Debt
Planner?"* and hear **"You're on track to be debt-free by Balances unread."** The second is worse than broken
grammar: it is an **affirmative claim** — *"You're on track…"* — wrapped around the app's own admission that it
could not read the money. The Lock Screen's inline family says the same thing: *"— paid · debt-free Balances
unread"*.

**File and line.**

- `apps/rn/src/widget/snapshot.ts:16` — `const UNREAD_WIDGET_DATE = 'Balances unread';`
- `apps/rn/src/widget/snapshot.ts:163-180` — the sentinels `'Balances unread'` and `'—'` are placed into
  `debtFreeDate` / `pctLabel` / `remaining`.
- `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift:46` —
  `return .result(dialog: "You're on track to be debt-free by \(snap.debtFreeDate).")`
- `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift:62` —
  `return .result(dialog: "You have \(snap.remaining) in debt remaining.")`
- `apps/rn/targets/widget/DebtViews.swift:218` — `return "\(snap.pctLabel) paid · debt-free \(snap.debtFreeDate)"`
  (Inline / Lock Screen — **no static label at all**)
- `apps/rn/targets/widget/DebtViews.swift:203` — `Text("\(snap.pctLabel) paid · \(snap.remaining) left")`

**The measurement.** One store, one variable — `Chase` with `balance: 'n/a'` beside a readable `Visa $4,000`,
premium, built through the real `runMigrations` (the same fixture shape `widgetSync.test.ts:147` uses):

```
mayClaim debt-balances = false
remaining= —   pctLabel= —   debtFreeDate= Balances unread
repairs= [{"entity":"debt","id":"a","name":"Chase","field":"balance","kind":"lost","count":1}]
```

Substituted into the Swift string literals above, the four consumer sentences on that store are:

```
Siri  DebtFreeDateIntent   : "You're on track to be debt-free by Balances unread."
Siri  RemainingDebtIntent  : "You have — in debt remaining."
Inline (Lock Screen)       : "— paid · debt-free Balances unread"
Rectangular (Lock Screen)  : "— paid · — left"
```

`snap.hasData` is `true` on this store (measured, and asserted deliberately at `widgetSync.test.ts:142`), so
**every one of the `if !snap.hasData` early-returns is skipped** and the sentinels reach the sentence.

**Mechanism, as a hypothesis.** `snapshot.ts:9-15` justifies putting a refusal into the DATE slot with an
explicit premise *about the consumer*: *"`DebtViews.swift` renders `snap.debtFreeDate` verbatim beneath a
**static** 'DEBT-FREE DATE' / 'Debt-free' label on **every family**, so this reads as 'we cannot give you a
date' rather than as a claim."* That premise is a carried comment and it is **wrong on measurement**:
`InlineWidgetView` (`DebtViews.swift:216-218`) has no static label — it interpolates the date into a sentence
— and the premise never considered `SiriQueryIntents.swift`, a second consumer of the same key that *only*
interpolates. The docblock reasons about the one surface it was written for while the string ships to three.

⚠️ **The file already documents this exact class one screen away.** `SiriQueryIntents.swift:38-42`: *"MUST
match `snapshot.ts`'s `debtFreeDate` sentinel exactly … a silent mismatch here does not crash — Siri just
stops recognising the debt-free state and reads 'on track to be debt-free by Debt-free' instead."* The pass-3
fix then added a **second** sentinel to that same slot and added **no** branch here. `Balances unread` over
the whole repo returns **two** source sites (`snapshot.ts`, `widgetSync.test.ts`) and **zero** in Swift.

**Remedy — UNVERIFIED.** Do not fix by renaming the sentinel; the class is *"a display placeholder is consumed
as a sentence fragment"* and it has at least four sites. The shape that would hold is an explicit refusal
field on `WidgetSnapshot` (e.g. `balancesUnread: boolean`) that every consumer branches on *before* composing
a sentence, so a consumer added later cannot interpolate a placeholder by forgetting to. ⚠️ That is a native
change — `DebtSnapshot` Codable plus four Swift call sites — which `snapshot.ts:14` explicitly declined
(*"adding one is a native change — which this deliberately is not"*), and the decline is what left the
sentinel free to travel. I did not build or run either shape.

---

## C3-2 — The Home-Screen widget states **"95% paid"** and **"$0 remaining"** on the same face, at the same instant, from the same store

**Severity: blocker.** **Origin:** `apps/rn/src/widget/snapshot.ts` = `fix-churn` — this is the pass-5 `C5-2`
fix's own residue.

**User-facing consequence.** A premium user with one card, last confirmed at **$600** against a **$12,000**
original and eleven months unverified, sees on the medium widget: a ring reading **95%**, a headline date of
**"—"**, and **"$0 remaining"**. `$0 remaining` and `95% paid` cannot both be true. Siri, reading the same
key, says *"You have $0 in debt remaining."* over a balance the user last confirmed at $600 — and unlike
in-app, **nothing on the widget or in the spoken sentence marks the figure as an estimate**: `WidgetSnapshot`
carries no field that could, while `money.tsx` labels the same number *"estimated · verify soon"* and pairs it
with the confirm-the-payoff invitation.

**File and line.** `apps/rn/src/widget/snapshot.ts:125-133` and `:178-180`.

- `:125` `const engineDebts = withProjectedBalances(store, …).debts` — the **projected** set.
- `:129` `const totalCurrent = engineDebts.reduce((s, d) => s + d.balance, 0)` — projected.
- `:132` `const totalPaid = Math.max(0, totalOriginal - debts.reduce((s, d) => s + d.balance, 0))` — **anchor**.
- `:133` `pct` divides that anchor-derived numerator by `totalOriginal`.
- `:179-180` both are printed on the same payload — `pctLabel` from `pct`, `remaining` from `totalCurrent`.

**The measurement.** A `migratedWidgetStore`-shaped fixture back-dated exactly the way `widgetSync.test.ts:205-212`
back-dates it, with `apr: 0` and `minimumPayment: 400` so the projection lands on a clean zero:

```
PREMIUM aged, anchor $600 of $12,000, projects to 0:
{"hasData":true,"debtFreeDate":"—","pctPaid":0.95,"pctLabel":"95%",
 "remaining":"$0","updatedAt":1,
 "guardianSpoken":"This paycheck looks clear — your cushion holds.",
 "isPremium":true,
 "debtsJson":"[{\"id\":\"a\",\"name\":\"Chase\",\"balance\":\"$600\"}]"}
```

⭐ **The same payload contradicts itself twice.** `remaining "$0"` against `pctLabel "95%"`, and `remaining
"$0"` against its own `debtsJson`, which states **`Chase $600`** — because `debtsJson` is built from `live`
(`:127`, anchors) while `remaining` is built from `engineDebts` (`:125`, projected). Two producers of one
number inside one object literal, and `DebtViews.swift:203` concatenates two of them into a single sentence:
`"\(snap.pctLabel) paid · \(snap.remaining) left"` → **"95% paid · $0 left"**.

A sharper variant of the same store — anchor `$5`, `originalBalance $12,000` — prints
`pctLabel "100%"`, `remaining "$0"`, `debtsJson [{"name":"Chase","balance":"$5"}]`.

**Mechanism, as a hypothesis.** The pass-5 `C5-2` fix moved **`remaining` alone** onto the projection and left
`pct`, `live`/`cleared` and `debtsJson` on the anchors. The docblock at `:116-123` argues each exclusion **in
isolation**, and each argument read on its own is sound. What no line of it considers is that all four are
rendered **together on one face**. ⚠️ The file states the governing rule itself, at `:147`: *"ALL FOUR FIGURES
DEGRADE TOGETHER, and that is the load-bearing half."* It was applied to the `mayClaim` refusal and not to the
projection that arrived four sub-steps later.

**Why the existing guard did not catch it.** `widgetSync.test.ts:245-248` is the only assertion on this
fixture family and it checks one field: `buildWidgetSnapshot(agedNearlyPaid, 1).debtFreeDate !== 'Debt-free'`.
Its own comment says the hazard is *"a PROJECTED $0 must NOT say 'Debt-free' on the Home Screen"*. But
`cleared` (`:162`) is computed from `debts` — the anchors — and can never be driven by the projection under
any value of the fixture, so **that assertion cannot fail even if the fix it guards were removed**; and it
asserts nothing about `remaining` or `pctLabel`, which are the fields that actually carry the false statement.
This is the brief's *"a check that cannot fail reads exactly like a check"*, and its *"iterate the class,
never the member you found"*, in the same three lines.

**Remedy — UNVERIFIED.** ⚠️ The obvious move — put `pct` on the projection too — is the one this file already
measured as wrong (`:117-119`: it makes "% paid" fall while the user does nothing) and would be the pass-5
mistake in the other direction. I did not determine which figure should move. The finding is that the
*pairing* is false; triage should pick one basis for the whole face rather than per-field.

---

## C3-3 — `Math.round` reports **100% paid** while the same face says **$5 left**; on Progress it lights the gold "Free" node and VoiceOver says *"all milestones reached"*

**Severity: major.** **Origin:** `apps/rn/src/widget/snapshot.ts` = `fix-churn`;
`apps/rn/src/app/(tabs)/progress.tsx` = `fix-churn`; `apps/rn/src/store/journeySelectors.ts` = neighbour
(off-manifest, read as the shared producer).

**User-facing consequence.** A **free** user — no projection, balance verified today, no trust gate in play —
with **$5** left on a **$12,000** card is told **"100%"** by the Home-Screen ring, **"100% paid off"** by the
large widget, **"100% paid · debt-free April 2026"** on the Lock Screen, and **100%** by the Progress ring,
beside a widget line that correctly reads *"$5 left"* and a journey line that correctly reads *"$11,995 of
$12,000 paid"*. On Progress the 100 additionally lights the `t === 100 → 'free'` destination node in gold and
makes the collapsed screen-reader utterance say *"all milestones reached"*.

**File and line.**

- `apps/rn/src/widget/snapshot.ts:179` — ``pctLabel: mayStateBalances ? `${Math.round(pct * 100)}%` : '—'``
- `apps/rn/src/store/journeySelectors.ts:62` — `const pct = totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0;`
- consumed at `apps/rn/src/app/(tabs)/progress.tsx:278`, `:285-289`, `:296`, `:303-307`, `:341`
- a third member of the same class: `apps/rn/src/app/(tabs)/money.tsx:1220` —
  ``caption={… : `${Math.round(overall * 100)}% funded`}``

**The measurement.** Free tier, verified today:

```
FREE, $5 of $12,000 still owed, verified today:
 pctLabel= 100%   pctPaid= 0.9995833333333334   remaining= $5   debtFreeDate= April 2026   hasData= true
FREE, $50 of $12,000:  pctLabel= 100%   remaining= $50
```

`$50` outstanding on `$12,000` is 0.4167% and still prints **100%**. On `progress.tsx` the same `journey.pct`
is the integer `100`, so `MILE_TS.find((t) => pct < t)` is `undefined` → `nextMilestoneLabel` is `null`
(`:296`) and `ringA11y`'s third clause is *"all milestones reached"* (`:307`), while `t === 100 ? 'free'`
(`:288`) renders the gold destination node.

**Mechanism, as a hypothesis.** `Math.round` is symmetric, so any residue below 0.5% of the original rounds
**up into a completeness claim**. Every other rounding in this repo is `Math.round(n * 100) / 100` — cents,
a *precision* choice. These three are `Math.round(fraction * 100)` — whole percent — where the top of the
range is not a rounded quantity but a claim about a state the user has not reached.

⭐ **The celebration engine is NOT affected, and that is the control that bounds this finding.** `payday.ts:132`
takes `portfolioResult.milestones.find((m) => m.threshold < 100)`, so a spurious 100 cannot fire the debt-free
spectacle or write a permanent record. The defect is confined to the displayed label, the ring's `free` node
and the a11y string.

**Remedy — UNVERIFIED.** A clamp of `Math.min(99, …)` while any balance is live is one line and would fix the
label, but I did not check what it does to the genuinely-cleared store, where `pct` must reach 100 for the
`free` node and for the *"Every balance paid off"* hero at `progress.tsx:201-203`. The predicate to gate on is
probably *"is any live balance > 0"* — `snapshot.ts` already computes it as `live` (`:127`) and `progress.tsx`
has it as `view.hasDebts` — but I ran neither.

---

## C3-4 — A debt the app could not read **silently disappears from Siri's debt list**, so it is the one debt the user cannot name to fix

**Severity: minor.** **Origin:** `apps/rn/src/widget/snapshot.ts` = `fix-churn`.

**User-facing consequence.** On the same unread-balance store as `C3-1`, `debtsJson` — the list Siri's
`DebtEntity` disambiguation offers for *"Log a payment in Debt Planner"* — contains **only Visa**. Chase is
gone, with no indication why, while the app on the same phone still lists it. The same drop applies to any
debt sitting at `$0`, which is exactly the state an unread balance repairs to — so the one debt whose figure
is wrong is precisely the one that cannot be corrected by voice.

**File and line.** `apps/rn/src/widget/snapshot.ts:127` — `const live = debts.filter((d) => d.balance > 0)` —
consumed at `:184-186`.

**The measurement.**

```
mayClaim debt-balances = false
debtsJson (what Siri offers) = [{"id":"b","name":"Visa","balance":"$4,000"}]
repairs = [{"entity":"debt","id":"a","name":"Chase","field":"balance","kind":"lost","count":1}]
```

**Mechanism, as a hypothesis.** `live` was defined for the *cleared* test at `:162` (*"has debts but none
live"*), where excluding `balance <= 0` is correct, and is then reused as the source for Siri's entity list at
`:184`, where excluding it is a different decision nobody took. One filter, two questions.

**Remedy — UNVERIFIED.** Sourcing `debtsJson` from `debts` rather than `live` restores the row, but it changes
what Siri offers on a genuinely paid-off portfolio, and I have not read `LogPaymentIntent.swift` closely
enough to say what it does with a `$0` entity.

---

## C3-5 — The widget and Siri state a debt total **$2,431 too LOW** (and, in the other direction, **$2,869 too HIGH**) over a field the app has a repair record for, because the pass-5 fix changed what the number is computed FROM without changing what the trust guard is computed OVER

**Severity: blocker.** **Origin:** `apps/rn/src/widget/snapshot.ts` = `fix-churn`;
`apps/rn/src/store/trustSelectors.ts` = neighbour (off-manifest — read as the claim owner).

**User-facing consequence.** A premium user restores a backup in which one card's **APR** could not be read.
The Home Screen says **"$6,500 left"**, Siri says *"You have $6,500 in debt remaining"*, and the truth on that
same store is **$8,931** — the app is understating the debt by **$2,431 (27%)** and moving the debt-free date
a month earlier, with **no refusal anywhere**. On the mirror-image store, where the **minimum payment** could
not be read, the same surfaces say **"$11,800"** against a true **$8,931** — **$2,869 (32%) too high**.

⚡ **And in the minimum case the payload refuses and asserts in the same object.** `guardianSpoken` is `""`
— Siri correctly declines the paycheck read because the minimum is unreadable — while `remaining` on the very
same snapshot states **$11,800**, a figure the projection computed *from that same unreadable minimum*.

**File and line.**

- `apps/rn/src/widget/snapshot.ts:125` — `withProjectedBalances(store, store.subscriptionPlan === 'premium')`
- `apps/rn/src/widget/snapshot.ts:159` — `const mayStateBalances = mayClaim(store, 'debt-balances');`
- `apps/rn/src/widget/snapshot.ts:171, 180` — the projected figures are gated **only** by that claim.
- `apps/rn/src/store/trustSelectors.ts:202` — `'debt-balances': { debt: ['balance', 'originalBalance'] },`
- `apps/rn/src/store/trustSelectors.ts:228` — `apr` is routed to `'row-figures'` **and only there**.
- `packages/core/debt/projectCurrentBalance.ts:71-86` — the projection reads `apr` and `minimumPayment`.

**The measurement.** One debt, premium, anchor **$9,000** of **$12,000** original, verified `2025-04-02`
against a plan date of `2026-03-02` (the same eleven-month back-date `widgetSync.test.ts:205` uses). One
variable per row, built through the real `runMigrations`:

```
                            | debt-balances | required-plan | widget remaining | app hero | guardianSpoken
TRUE  (apr 29.99, min 250)  |     true      |     true      |     $8,931       |  $8,931  | "This paycheck looks clear…"
APR LOST  (apr: 'n/a')      |     true      |     true      |     $6,500       |  $6,500  | "This paycheck looks clear…"
MIN LOST  (min: 'n/a')      |     true      |    FALSE      |     $11,800      | $11,800  | ""
```
`debtFreeDate` moves with it: **June 2026** → **May 2026** (apr lost) → **July 2026** (minimum lost).
`pendingDataRepairs` is non-empty on both bad rows (`["apr"]`, `["minimumPayment"]`) — the app *knows*.
And on all three rows `debtsJson` states `Chase $9,000` (the anchor), so the snapshot disagrees with itself.

⭐ **The app's own hero states the identical figure**, so this is **not** a widget/app divergence — the pass-5
`C5-2` parity fix holds. It is the whole projected-balance class being outside the guard, visible from the
widget because the widget is where the number leaves the app with no *"estimated"* label attached.

**Mechanism, as a hypothesis.** `'debt-balances'` was routed when *"remaining"* meant Σ `debt.balance` — the
route's own comment says so: *"A balance is what 'cleared' is a claim ABOUT."* Pass 5's `C5-2` then changed
the number to Σ `projectCurrentBalance(debt, …)`, whose inputs are `balance`, **`apr`** and
**`minimumPayment`**. Two of the three inputs are outside the claim's field list, so a repair to either
poisons the figure and not the guard. The `'required-plan'` route was extended the same way once and the
reasoning is recorded at `trustSelectors.ts:216-223` — *"the obligation is gone by a second door, and only
the first was routed"* — which is this defect, one claim over.

**Remedy — UNVERIFIED.** The shape suggested by the route table's own history is to extend `'debt-balances'`
to the fields the figure is now derived from. ⚠️ **Do not apply it as written without measuring**: `apr` is
currently routed to `'row-figures'` *deliberately* (`trustSelectors.ts:227-229`: *"it changes no obligation
this cycle"*), and adding it to `'debt-balances'` would also gag the finale, the trophy shelf and the
Progress hero — one of which (`C4-2`) is recorded as having been over-gagged before. A narrower shape is a
separate claim for *projected* figures, gated only where a projection is actually shown. I built neither.

---

## C3-6 — Two taps of the Lock Screen **"Payday landed"** button roll the plan forward **two whole pay cycles on one payday**, write two `cycleHistory` entries for one paycheck, and the Undo takes back only one

**Severity: blocker.** **Origin:** `apps/rn/src/appIntents/pendingActions.ts` = `stale-read`;
`apps/rn/src/appIntents/drainPendingActions.ts` = `stale-read`;
`apps/rn/targets/widget/PaydayLandedIntent.swift` (the producer) is off-manifest, read as evidence.

**User-facing consequence.** The Live Activity's payday-day button runs in the background and **changes
nothing the user can see** — the Lock Screen keeps rendering the same payday state, because the store does
not move until the app is next foregrounded and drains the queue. A user who taps again gets a second
rollover. On next launch the plan is a full cycle further ahead than the calendar, the debt has taken two
interest-plus-minimum steps, and the cycle history has recorded a paycheck that never arrived. Tapping the
Today card's Undo puts back **one** of the two.

**File and line.**

- `apps/rn/targets/widget/PaydayLandedIntent.swift:19` — `actions.append(["kind": "payday-landed", "id": UUID().uuidString])`
- `apps/rn/src/appIntents/pendingActions.ts:44, 51` — the dedupe: `const seen = new Set<string>()` … `if (… seen.has(id)) continue;`
- `apps/rn/src/appIntents/pendingActions.ts:82-83` — `applyPendingActions` applies **every** surviving action in order.
- `apps/rn/src/store/store.ts:675-679` — `applyPaydayLandedIntent()` calls `applyRollover` with **no**
  already-rolled guard, and **overwrites** `intentRollback` each time.

**The measurement.** Real `createDebtStore`, real `drainPendingActions` with a stub bridge, seed store
`currentDate 2026-03-02` / `next 2026-03-16`, biweekly, one $9,000 card at 29.99%:

```
before                              | currentDate 2026-03-02 | next 2026-03-16 | Chase 9000    | cycleHistory 0
after ONE tap (applied 1)           | currentDate 2026-03-16 | next 2026-03-30 | Chase 9103.81 | cycleHistory 1
after TWO taps (applied 2)          | currentDate 2026-03-30 | next 2026-04-13 | Chase 9208.82 | cycleHistory 2
after ONE undo                      | currentDate 2026-03-16 | next 2026-03-30 | Chase 9103.81 | cycleHistory 1
after TWO taps, SAME id (applied 1) | currentDate 2026-03-16 | next 2026-03-30 | Chase 9103.81 | cycleHistory 1
```

⭐ **The last row is the control, and it is what makes this a finding rather than an absence.** The dedupe
works perfectly — *when the two entries share an id*. They never do.

⚠️ **And the existing test picked exactly that member.** `apps/rn/src/appIntents/pendingActions.test.ts:41`
is the whole coverage of this guard:
`eq(parsePendingActions([{ kind: 'payday-landed', id: 'a' }, { kind: 'payday-landed', id: 'a' }]).length, 1, 'parse: dedupe by id')`
— two entries with the **same** id, which is the one arity in which the guard can fire and the one a
producer cannot emit. The brief's *"ask which member of its class a test picked"*, exactly.

**Mechanism, as a hypothesis.** `pendingActions.ts:30-31` states the guard's purpose as a carried comment:
*"deduped by `id` (an intent can double-write across a relaunch)."* But **both** producers mint the id inside
`perform()` — `PaydayLandedIntent.swift:19` and `LogPaymentIntent.swift:88` both call `UUID().uuidString` —
so every invocation of the intent, including the second tap the comment is describing, produces a **fresh**
id. The `seen` set can therefore only collapse a byte-identical duplicate record, which is a thing no
producer writes. The dedupe is scoped to one parse of one payload; nothing records applied ids across drains
either, and the `payday-landed` action carries no date, so nothing downstream can tell the two apart.

⚠️ **The in-app path has the guard the intent path lacks.** `use-payday-capture.ts:44-49` and `store.ts:712`'s
`setLastHandledPayday` short-circuit a second in-app roll for the same payday. `applyPaydayLandedIntent`
(`store.ts:675`) neither stamps nor reads `lastHandledPaydayDate`. Two producers of one mutation, only one of
them idempotent.

**Remedy — UNVERIFIED.** ⚠️ **Do not "fix the id."** A stable id per payday would collapse the two taps, but
the same UUID-per-invocation shape is what `log-payment` needs — two deliberate Siri payments of $200 to one
debt *are* two payments — so an id rule applied to the class would silently swallow a real second payment.
The asymmetry suggests the guard belongs on the mutation, not on the queue: have `applyPaydayLandedIntent`
no-op when `lastHandledPaydayDate` already covers the payday it is rolling, which is the rule the in-app path
already enforces. I built and ran neither, and I did not check what `lastHandledPaydayDate` reads as across
the rollover it would now sit inside.

---

## C3-7 — Siri says **"Logged $200.00 toward Chase"** — past tense, as a completed fact — for a payment that has only been queued, and says it even when the queue write did not happen

**Severity: blocker.** **Origin:** `apps/rn/plugins/app-intents-swift/LogPaymentIntent.swift` — off-manifest
producer; its JS consumers `apps/rn/src/appIntents/pendingActions.ts` and `drainPendingActions.ts` = `stale-read`.

**User-facing consequence.** The user says *"Log a payment in Debt Planner"*, names $200 and Chase, and hears
**"Logged $200.00 toward Chase. Open Debt Planner to see it."** Nothing has been logged. The action sits in
`UserDefaults` until the app is next foregrounded. If the App-Group suite cannot be opened, **the action is
silently dropped and the same success sentence is spoken anyway** — the user has been told, in the past
tense, that money was recorded against a debt when no record of it exists on any surface.

**File and line.** `apps/rn/plugins/app-intents-swift/LogPaymentIntent.swift:86-91`:

```swift
if let defaults = UserDefaults(suiteName: SnapshotStore.appGroup) {
    var actions = defaults.array(forKey: "pendingActions") as? [[String: Any]] ?? []
    actions.append(["kind": "log-payment", "id": UUID().uuidString, "debtId": debt.id, "amount": amount])
    defaults.set(actions, forKey: "pendingActions")
}
return .result(dialog: "Logged ... toward \(debt.name). Open Debt Planner to see it.")
```

**The measurement.** Static, and the control structure is itself the evidence: the `if let` has **no `else`**,
and the `return` is **outside** it. After the premium and `amount > 0` guards there is exactly one exit from
`perform()`, and it asserts success unconditionally. Two ways the body can fail to record are both silent and
both keep the sentence: the suite failing to open, and `defaults.array(forKey:)` failing the
`as? [[String: Any]]` cast.

⚠️ **The `?? []` on line 87 is the second, quieter half.** A queue that fails that cast is replaced by an
empty array and written straight back, so an already-queued `payday-landed` is destroyed by a later
`log-payment`. That is the exact failure the sibling file's comment at `PaydayLandedIntent.swift:16-17` says
the `[String: Any]` element type was chosen to prevent — *"a `[String: String]` cast would fail + wipe
those"*. The element type was widened on both sides; the `?? []` that does the wiping was left in place on
both sides too.

**Mechanism, as a hypothesis.** The dialog was written against the intent's *purpose* rather than its
*postcondition*. In a queue-and-drain design "logged" is never true at the moment the sentence is spoken; it
becomes true later, conditionally. ⭐ `PaydayLandedIntent` is the control: same architecture, returns a bare
`.result()`, claims nothing.

**Remedy — UNVERIFIED.** Two separable changes: move the `return` inside the `if let` with a failure dialog in
the `else`, and reword to what is true at that instant — the app's own vocabulary for this is already the
second half of the sentence, *"Open Debt Planner to see it."* ⚠️ I ran neither: no command available under
this pass's constraints builds this Swift target, and I did not verify what an `AppIntent` failure dialog is
permitted to be.

---

## C3-8 — A purchase made from inside the demo is **charged by Apple and dropped by the app**: the paywall's two entitlement writes are the only real-store writers on the demo's own conversion path that are not declared to the sandbox guard

**Severity: blocker.** **Origin:** `apps/rn/src/app/paywall.tsx` = `fix-churn`;
`apps/rn/src/app/_layout.tsx` = `stale-read`; `apps/rn/src/premium/premiumSync.ts` = `stale-read`
(the declared sibling); `apps/rn/src/store/realWriteGuard.ts` = neighbour, off-manifest.

**User-facing consequence.** A pre-purchase viewer runs the demo, taps *"Unlock Premium"*, buys the Annual
plan. StoreKit charges them. The paywall shows *"You're on Premium — your premium tools are unlocked"* and
navigates back. **`subscriptionPlan` is still `free`.** The identical thing happens on *"Restore purchases"*:
*"Purchases restored — your premium access is back"*, and the plan does not move. The only trace is a Sentry
report the user never sees, because `realWriteGuard.ts:18-21` makes refusal deliberately silent —
correctly, on the premise that a refusal *"only ever fires on a BUG"*.

**File and line.**

- `apps/rn/src/app/paywall.tsx:207` — `appStore.getState().setSubscriptionPlan('premium');` (after a
  successful purchase) — **not** wrapped in `allowRealStoreWrite`.
- `apps/rn/src/app/paywall.tsx:231` — the same call after a successful restore — also unwrapped.
- `apps/rn/src/app/_layout.tsx:320` — `<StoreProvider store={demoSandbox ?? appStore}>` wraps the whole `<Stack>`.
- `apps/rn/src/app/_layout.tsx:348` — `<Stack.Screen name="paywall" options={{ presentation: 'modal' }} />`
  sits **inside** that provider.
- `apps/rn/src/store/StoreContext.tsx:73` — `const leaveScope = enterSandboxScope();`
- `apps/rn/src/store/realWriteGuard.ts:135-146` — `refuseRealStoreWrite` drops the write.
- ⭐ the declared sibling, for comparison: `apps/rn/src/premium/premiumSync.ts:36`.

**The measurement.** Real `appStore`, real `enterSandboxScope`, the two paywall statements executed verbatim:

```
plan at start                       : free
control: no sandbox, paywall write  : premium      <- ⭐ the write itself is fine
paywall.tsx:207 during a demo       : free         <- DROPPED
paywall.tsx:231 during a demo       : free         <- DROPPED
premiumSync.ts:36 during a demo     : premium      <- ⭐ the declared sibling lands
```

Two controls, one variable each. The first shows the statement works outside a sandbox scope, so this is not
a broken action. The second shows the same action on the same store at the same instant **lands** when it is
wrapped — so the difference is the declaration and nothing else. `subscriptionPlan` is a top-level plan key,
so `forbiddenRealStoreChanges` (`realWriteGuard.ts:105-110`) returns it and the whole `set` is refused.

**Mechanism, as a hypothesis.** `realWriteGuard.ts:65-68` names the obligation and names the files that meet
it: *"Every legitimate real-store writer that can fire while a run is on screen must be wrapped — see
`_layout.tsx`, `premiumSync.ts` and `use-notification-sync.ts`."* That is an **enumerated list of writers**,
and the enumeration is short by the one file whose whole purpose is to fire during a demo. The routing change
that created the exposure is documented three lines from the miss: `_layout.tsx:341-347` deliberately moved
the paywall **outside the onboarding guard** so that *"a not-yet-onboarded viewer who tapped 'Unlock Premium'"*
reaches it instead of being bounced — which is precisely what puts a real-money write inside a live sandbox
scope. The guard was extended to cover the demo; the screen the demo converts through was not re-checked
against it.

⚠️ **A compensating path may mask this in production and I could not run it.** RevenueCat's
`addCustomerInfoUpdateListener` (`premiumSync.ts:52`) fires on a completed purchase, and `apply` **is**
wrapped — so on a real device the entitlement may land a beat later through a different subsystem. That is
not the code path the paywall believes it is on, it does not exist in `__DEV__` or on web
(`purchasesClient.ts:32-34` returns early for both), and it is not what the restore path relies on. Report
it as measured: the paywall's own write is refused.

**Remedy — UNVERIFIED.** Wrapping both call sites in `allowRealStoreWrite` matches every declared sibling and
is two lines. ⚠️ But `realWriteGuard.ts:70-72` carries a constraint that must be honoured while doing it —
*"**Synchronous only.** The flag is down again by the time this returns, so wrapping an `async` function
protects nothing past its first `await`"* — and both of these writes sit **after** an `await` inside an
`async` function. Wrapping the enclosing `handleSubscribe`/`handleRestore` would therefore be a fix that
compiles, reads correctly and does nothing; only the synchronous `setSubscriptionPlan(...)` statement itself
may be wrapped. I did not build it. ⚠️ And the class is the enumerated list, not these two sites: any real
write reachable from a screen the demo can navigate to has the same exposure, and the list in
`realWriteGuard.ts` is what would need to become a check.

---

## C3-9 — Money and Progress name a **different focus debt** for the same store at the same instant, and Money's list is visibly not in the order its own caption claims

**Severity: blocker.** **Origin:** `apps/rn/src/app/(tabs)/money.tsx` = `fix-churn`;
`apps/rn/src/app/(tabs)/progress.tsx` = `fix-churn`; `apps/rn/src/store/payoffSelectors.ts` = neighbour
(off-manifest — the shared producer that did not move).

**User-facing consequence.** A premium user on Snowball, eleven months since their last verification, opens
**Money**: Visa carries the blue **"Focus"** chip and sits first, under the caption *"Smallest balance first
— quick wins. **Your debts are listed in payoff order.**"* The two rows beneath that caption read **Visa
~$4,600** and **Chase ~$1,000** — larger first. One tab across, **Progress** computes its hero, its ring and
its trajectory from a plan whose focus is **Chase**. The user is told to attack the wrong card, by the screen
whose whole job is telling them which card to attack.

**File and line.**

- `apps/rn/src/app/(tabs)/money.tsx:217` — `const view = useMemo(() => selectPayoffView(store), [store]);`
  — the **raw** store, no projection.
- `apps/rn/src/app/(tabs)/money.tsx:354-355` — `const active = view.order;` · `const focusId = view.focus?.id;`
- `apps/rn/src/app/(tabs)/money.tsx:358` — `totalBal` is summed from
  `selectDebtBalanceView(d, currentDate, isPremium, …).currentBalance` — the **projected** figure.
- `apps/rn/src/app/(tabs)/money.tsx:583-589` — every row's balance is the projected `view.currentBalance`.
- `apps/rn/src/app/(tabs)/progress.tsx:100, 109` — `withProjectedBalances(store, isPremium)` →
  `selectPayoffView(engineStore)`.
- `apps/rn/src/widget/snapshot.ts:171` — also projected.
- `apps/rn/src/store/payoffSelectors.ts:92-94, 145-146` —
  `rankDebts` sorts on `a.balance - b.balance`; `focus: order[0] ?? null`.

**The measurement.** Two cards, Snowball, premium, both verified `2025-04-02` against a plan date of
`2026-03-02` — anchors `Chase $5,000 / min $400 / 0% APR` and `Visa $4,800 / min $20 / 0% APR`, so nothing
but the elapsed time differs between the two expressions:

```
strategy               : snowball
MONEY   (money.tsx:217, raw)     order = Visa $4800 , Chase $5000  | focus = Visa  | debtFreeDate = May 2026
PROGRESS(progress.tsx:109, proj) order = Chase $1000 , Visa $4600  | focus = Chase | debtFreeDate = May 2026
```

⭐ The two `debtFreeDate`s agree here, which is why this survives a date-parity check — the divergence is in
the **order**, and only Money renders one. Note the second half: Money ranks on `$4,800 / $5,000` and prints
`~$4,600 / ~$1,000` on the very rows it just ranked, so the list contradicts its own caption on screen.

**Mechanism, as a hypothesis.** `selectPayoffView` has four production consumers and **three of them pass a
projected store** — `progress.tsx:109`, `snapshot.ts:171` (moved there by pass 5's `C5-2`), and
`CompletionStep.tsx:36`, where onboarding means zero elapsed time so the two bases are identical. Money is
the one that was not moved. It is invisible to a value assertion because both sides compute a *correct*
answer for the balance set they were handed, and invisible to `widgetSync.test.ts`'s parity assertion because
that compares `remaining`, a sum, which is order-independent.

⚠️ Avalanche is the control that bounds it: `rankDebts` sorts avalanche on `b.apr - a.apr`, and the
projection does not move `apr`, so the two orders agree on every avalanche store. **Snowball is the strategy
that diverges**, and it is the one the caption promises *"quick wins"* for.

⚠️ A related carried premise, one file over: `payoffSelectors.ts:71` keeps `order` and `focus` ungagged in
`gagBalanceDerived` on the stated grounds that *"the ordering/focus the row-level guards already gag
figure-by-figure on Money."* The row-level guards gag the row's printed *figures*; they say nothing about the
row's *position*. That premise happens to hold today for a different reason — an unread balance repairs to
`0` and so drops out of `liveDebts` before `rankDebts` ever sees it — but it is not the reason given.

**Remedy — UNVERIFIED.** Passing `withProjectedBalances(store, isPremium)` into `money.tsx:217` makes all
four consumers agree and matches what the rows already print. ⚠️ I did not run it, and there is a hazard the
other three consumers do not share: `view.order` is what Money *renders as a list*, so on a premium store a
debt whose projection has reached `$0` would leave `liveDebts` and **vanish from the debts list** — which is
`C4-2`'s recorded failure (*"would have removed the row from the debts screen altogether"*) arriving by a new
door. `partitionDebts` (`money.tsx:249`) is computed from the raw store and would still not hold it. The
class here is *"which store does this screen compute from"*, and it wants one decision across all four call
sites rather than a fifth basis.

---

## C3-10 — **"Delete all data" does not touch the App Group**, so the user's debt names and balances stay readable outside the app — and a queued *"Payday landed"* survives the wipe and rolls the brand-new plan two weeks into the future on the next launch

**Severity: blocker.** **Origin:** `apps/rn/src/app/more.tsx` = `first-look`;
`apps/rn/src/appIntents/drainPendingActions.ts` = `stale-read`; `apps/rn/src/widget/widgetSync.ts` = `stale-read`;
`apps/rn/src/app/_layout.tsx` = `stale-read`.

**User-facing consequence.** The delete confirmation says, without qualification: *"All debts, expenses,
goals, and settings will be permanently erased — **on this device and in your iCloud backup**. This cannot be
undone."* It enumerates two locations and there is a third. The App-Group suite
`group.com.jasonsnyder.debtplanner` holds `debtSnapshot` — which carries `debtsJson`, i.e. the user's **debt
names and balances**, plus `guardianSpoken`, a sentence about their paycheck — and `pendingActions`, which
carries `debtId` and `amount`. Neither is named in the copy, and **`handleDeleteAll` writes to neither.**

Then the second half. A `payday-landed` the user tapped on the Lock Screen before the reset is still in that
queue, and `_layout.tsx:128` drains it at the **next launch**, into whatever store now exists:

**File and line.**

- `apps/rn/src/app/more.tsx:118-166` — `handleDeleteAll` erases the iCloud copy
  (`deleteCloudBackup`), the quarantined blob (`clearQuarantinedData`) and the local store
  (`appStore.getState().reset()`). No App-Group call of any kind.
- `apps/rn/src/app/more.tsx:522-525` — the confirm copy that enumerates the two locations.
- `apps/rn/src/appIntents/pendingActionBridge.native.ts:30-36` — `clear()` exists; its **only** JS caller
  is `drainPendingActions.ts:23`, and only after a successful apply.
- `apps/rn/src/app/_layout.tsx:128` — `allowRealStoreWrite(() => drainPendingActions());` at launch.
- `apps/rn/src/widget/widgetSync.ts:59-66` — the only thing that ever overwrites `debtSnapshot` is a
  **1000 ms-debounced** store subscription, and `more.tsx:164` defers `reset()` into
  `InteractionManager.runAfterInteractions` *after* the screen has already popped.

**The measurement.** Real `createDebtStore`, real `reset()`, real `drainPendingActions`:

```
AFTER RESET   : currentDate 2026-08-31 | next 2026-09-14 | debts 0 | cycleHistory 0 | onboardingComplete false
AFTER DRAIN   : currentDate 2026-09-14 | next 2026-09-28 | debts 0 | cycleHistory 1 | onboardingComplete false
applied = 1 | queue cleared = true | intentRollback = true
cycleHistory entry = [{"cycleEndDate":"2026-09-14","totalDebtBalance":0,"totalPaidThisCycle":0,
                       "allRequiredMet":true,"completedRecommendedActions":[],"payoffStrategy":"snowball"}]
```

Today is `2026-08-31`. After the wipe the plan's `currentDate` is **`2026-09-14`** — a fortnight ahead of the
calendar, before onboarding has even completed — and Pay Cycle History contains one finished cycle, marked
`allRequiredMet: true`, that the user never lived. `intentRollback` is set, so the very first Today screen a
freshly-reset user sees carries an *"Payday landed — I rolled your plan forward to this paycheck"* ack with
an Undo, over a plan they have not entered yet.

⚠️ `log-payment` is the milder half and it is the control: `store.ts:685` no-ops on an unknown `debtId`, so a
queued payment against a deleted debt is dropped. `payday-landed` carries **no id**, so nothing about it can
fail to match, and `applyPaydayLandedIntent` (`store.ts:675`) rolls unconditionally.

**Mechanism, as a hypothesis.** The App Group was added as an *output* channel (3.5.1's widget mirror), and
its own docstrings describe it that way — *"the compact, display-ready payload"*. Once 3.5.3.5 made it an
*input* channel as well, it became a second persistence location holding the user's financial data, and the
delete path was written against the two stores that existed when it was written. The confirm sentence is
`P6.8.7d.2 [C9]`'s own careful rewrite — *"the sentence is now the one the code keeps"* — enumerated over the
same two.

⚠️ **And `widgetSync`'s change-gate makes the snapshot half worse than a race.** `widgetSync.ts:48-50` sets
`lastKey` **before** calling `write`, and `writeWidgetSnapshot` swallows every failure
(`widgetStorage.native.ts:56-59`). So a single failed write is never retried for the rest of the session,
even though the material payload has changed — which for the delete case means the pre-wipe snapshot stays in
the App Group, readable by the widget and by Siri, with no further attempt to replace it.

**Remedy — UNVERIFIED.** Two separable things, and only the second is small. (a) `handleDeleteAll` should
clear the App Group before it resets, in the same *"fail before anything is destroyed"* order the function
already applies to iCloud and the quarantine — the native `clearPendingActions` already exists
(`LiveActivityModule.swift:72`); an equivalent for `debtSnapshot` does not and would be a native addition.
(b) `widgetSync` should set `lastKey` **after** a successful write rather than before. ⚠️ I ran neither, and
(b) has a hazard the current shape avoids: `writeWidgetSnapshot` returns `void` and swallows its own errors,
so "successful" is not currently observable from `widgetSync` at all.

---

## C3-11 — `lint:runner-completeness` prints *"**every** tracked test file is wired into its runner"* while it cannot see a third runner's convention at all

**Severity: major** (an instrument reports green while doing less than it claims).
**Origin:** `apps/rn/src/testing/runScenarioTests.ts` = `s0-first-look`;
`apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts` = `s0-first-look`;
`scripts/check-runner-completeness.ts` = `instrument` (off-manifest — read as the checker).

**User-facing consequence.** None directly; the harm is to the fixing that follows. A `*.scenario.ts` added
to the tree and not imported into `runScenarioTests.ts` would never run, and the gate whose entire job is
*"a tracked test file in the tree and in NO runner"* would stay green over it — while
`runScenarioTests.ts:17` prints **"✅ Scenario tests: ALL PASSED."**

**File and line.**

- `scripts/check-runner-completeness.ts:76-91` — `RUNNERS` has exactly **two** entries, `test:app` and
  `test:regression`. There is no `test:scenarios` entry.
- `scripts/check-runner-completeness.ts:80` — `pathspecs: ['apps/rn/src/**/*.test.ts', 'apps/rn/src/**/*.test.tsx']`
- `apps/rn/src/testing/runScenarioTests.ts:13` — the runner imports exactly one scenario.
- `package.json` — `test:all` = `test:regression && test:app && test:scenarios`; three runners, two gated.

**The measurement.** Run directly, exit code read:

```
$ node --max-old-space-size=1536 ./node_modules/tsx/dist/cli.mjs scripts/check-runner-completeness.ts
✅ runner completeness: every tracked test file is wired into its runner
   (test:app: 77 tracked · 77 wired · test:regression: 65 tracked · 65 wired).
EXIT=0
```
And the gate's own pathspec, run against the tree:
```
$ git ls-files 'apps/rn/src/**/*.test.ts' 'apps/rn/src/**/*.test.tsx' | wc -l      -> 77
$ ... | grep -i scenario                                                            -> apps/rn/src/store/sandboxScenarios.test.ts
   (a *.test.ts file that happens to be named "scenarios"; the actual scenario file matched: 0)
$ grep -rln 'test:scenarios' scripts/    -> finding-guards.json, surface-coverage.s0.json   (no gate)
```
142 files counted; `apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts` is a tracked test
file and is in neither number.

**Mechanism, as a hypothesis.** The gate models "which files are tests" as a **per-runner pathspec**, and
`.scenario.ts` is a third naming convention that neither pathspec can match. ⚠️ **The file records this
exact class as its own reason for existing**, at `:87-88`: *"`packages/` uses the `testXxx.ts` convention,
NOT `*.test.ts` — the same two-convention split that produced pass-4 `D4-3`, where a classifier knowing one
convention read 64 test files as production."* The remedy taken was to enumerate the two conventions that
were known; there are three.

⭐ **The gate does carry the anti-vacuity check** (`:107-113`: *"a pathspec that matches nothing makes this
gate vacuous"*), and it is the reason this is a scope gap rather than a silent nothing — it would fire if a
`test:scenarios` row were added with a wrong pathspec. What it cannot detect is a runner that was never
added to the table.

**Remedy — UNVERIFIED.** Adding a third `RUNNERS` row with `pathspecs: ['apps/rn/src/**/*.scenario.ts']` and
the same dynamic-`import()` extractor `test:app` uses would close it, and the anti-vacuity check would catch
a wrong pathspec on the first run. I did not add it (pass 6 does not fix), and I did not check whether the
scenario runner's `await import` form matches `test:app`'s extraction regex exactly.

---

## C3-12 — A widget write that fails is **never retried**, because the change-gate is stamped before the write and the writer swallows its own errors

**Severity: major.** **Origin:** `apps/rn/src/widget/widgetSync.ts` = `stale-read`;
`apps/rn/src/widget/widgetStorage.native.ts` = `neighbour`.

**User-facing consequence.** One failed App-Group write — a transient `ExtensionStorage` fault, the lazy
`require` throwing once — freezes the Home Screen widget and Siri on the **previous** figures for the rest
of the session, with no further attempt. Every subsequent sync computes the same material payload, matches
`lastKey`, and returns before writing. The user sees a debt total that is silently out of date on the one
surface that is supposed to be current without opening the app, and `updatedAt` — the *"as-of" footnote /
staleness signal* the interface documents at `snapshot.ts:36` — is not rendered by any Swift family
(`DebtViews.swift` never reads it), so nothing says the figure is stale.

**File and line.** `apps/rn/src/widget/widgetSync.ts:46-50`:

```ts
const { updatedAt: _omit, ...material } = snapshot;
const key = JSON.stringify(material);
if (key === lastKey) return;
lastKey = key;          // <- stamped BEFORE the write
write(snapshot);        // <- and this can fail silently
```
and `apps/rn/src/widget/widgetStorage.native.ts:56-59` — the `catch` that reports and returns `void`.

**The measurement.** Static, and the two halves are independently verifiable by reading the control flow:
`lastKey` is assigned on line 49 unconditionally; `write` on line 50 returns `void` and its native
implementation catches everything. There is no path by which a failed write can reset `lastKey`.
⭐ The neighbouring construct is the control that shows the author knew the shape:
`widgetStorage.native.ts:44` deliberately does **not** cache a failed `getStorage()` — *"a transient failure
retries next call instead of poisoning the write for the whole session"*. The retry it preserves is then
never reached, because `widgetSync` has already decided there is nothing to write.

**Mechanism, as a hypothesis.** The change-gate was written to answer *"has the payload changed?"* — a
question about the snapshot — and is being used to answer *"has the widget been told?"* — a question about
the write. Those coincide only while every write succeeds.

**Remedy — UNVERIFIED.** Move `lastKey = key` after the write. ⚠️ It does not work as written: `write` is
typed `(snapshot: WidgetSnapshot) => void` and the native implementation swallows its own errors, so
"succeeded" is not observable at this seam. Closing this means changing the writer's contract, which is a
wider change than it looks and touches the injectable test seam. I ran neither.

---

## C3-13 — The Payday Countdown latches OFF for the whole session if Live Activities were unavailable at launch, and the latch is set before the check

**Severity: minor.** **Origin:** `apps/rn/src/liveActivity/liveActivitySync.ts` = `stale-read`.

**User-facing consequence.** A premium user who has the Payday Countdown toggle on, but whose Live
Activities were reported unavailable at app launch — Settings → Live Activities off at that moment, or the
native module not yet resolvable — gets no countdown for the rest of the session even after turning the OS
setting back on and returning to the app. Nothing retries and nothing says why; the More toggle still reads
on. No money is misstated.

**File and line.** `apps/rn/src/liveActivity/liveActivitySync.ts:33-37`:

```ts
if (started.has(store)) return;
started.add(store);          // <- the idempotency latch is set FIRST

// Nothing to manage if the OS/user has Live Activities off (also the web no-op path → early out).
if (!bridge.areActivitiesEnabled()) return;   // <- ...and this returns after it
```

**The measurement.** Static, and the ordering is the whole of it: `started.add(store)` on line 34 precedes
the capability check on line 37, so the early return leaves the store marked started with **no subscription
registered**. `startLiveActivitySync` is called once, from `_layout.tsx:123`, inside a `.then` that runs at
launch — so there is no second caller that could recover, and even if there were, line 33 would refuse it.
⭐ `widgetSync.ts:35-38` is the control: same latch, same shape, and it has no capability check at all, so
its subscription always registers.

**Mechanism, as a hypothesis.** `areActivitiesEnabled()` is a **momentary** capability read being used as a
**permanent** one. The value it returns can change while the app is running (the user toggles it in
Settings), which is exactly the case the early return forecloses. Putting the latch before the check makes
the foreclosure irreversible.

**Remedy — UNVERIFIED.** Moving the capability check inside `evaluate()` — where `decideLiveActivityAction`
is already consulted on every store change — would make it a per-evaluation question instead of a
launch-time one, at the cost of one native call per debounced sync. I did not measure that cost, and
`bridge.areActivitiesEnabled()` on the native side is a `try`/`catch` around a native module call whose
frequency budget I have not checked.

---

## C3-14 — A `__DEV__` ternary three lines below a `if (__DEV__) return`

**Severity: minor.** **Origin:** `apps/rn/src/premium/purchasesClient.ts` = `stale-read`.

**User-facing consequence.** None. Recorded because it is the "check that cannot fail" shape in a file the
paywall depends on, and because reading it as live code misdescribes what a dev build does with the
RevenueCat SDK.

**File and line.** `apps/rn/src/premium/purchasesClient.ts:32` and `:38`:

```ts
if (__DEV__) return;                                    // :32
...
Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.WARN : LOG_LEVEL.ERROR);   // :38
```

**The measurement.** Static and total: line 32 returns for every `__DEV__` build, so control reaches line 38
only when `__DEV__` is false, and the `LOG_LEVEL.WARN` branch is unreachable. The log level is always
`ERROR`.

**Mechanism, as a hypothesis.** The `setLogLevel` line predates the `__DEV__` early-return that was added to
keep the dev "Simulate Premium" toggle authoritative (`:20-21`, `:31`); the guard was inserted above it and
the now-constant condition below was not re-read.

**Remedy — UNVERIFIED.** Collapse to `LOG_LEVEL.ERROR`, or move `setLogLevel` above the `__DEV__` return if
warn-level logging in dev was the intent. Which of the two is correct is a decision, not a defect fix, and I
did not make it.
