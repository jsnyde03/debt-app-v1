# Pass 5 — auditor C — S1 screens (the last mile: where a true number becomes a false sentence)

**Target:** `65566a09b96cdad8072261ac4a710ee1733be467` on `v1.7-dev`.
**Manifest:** `ROUTING-C.txt`, 122 files. Origins: neighbour 73 · first-look 34 · fix-churn 13 · s0-first-look 2.
**Worktree:** `C:\Users\Jason\audit-p5-c` (detached). Main tree not edited except this file.

Findings appended live, in the order found. Counts at the bottom are LOWER BOUNDS.

---

## C5-1 — `blocker` · Progress refuses to state the debt-free date and then states a **different** debt-free date, five months too early, three rows below it

**Severity:** `blocker` — the app states something false about the user's money.

**Origin.** `apps/rn/src/app/(tabs)/progress.tsx` — **fix-churn** (⛔ was `unrouted` in pass 4; it is the file pass-4 `C4-9` rewrote). `apps/rn/src/components/payoff/TrajectoryChart.tsx` — **first-look**. `apps/rn/src/store/planSelectors.ts` (producer of `selectDebtFreeBand`) — lane A, **neighbour**.

**The false sentence, as the user reads it.** A variable-income user restores a backup in which **one** of two cards' balances could not be read. Progress opens on:

```
        —          DEBT-FREE
       paid        —
                   Some balances couldn't be read

  PAYOFF TRAJECTORY                       Balance over time
  [ curve topping out at the "$5k" gridline ]
  ── Your plan                            (no date)
  ┄┄ Safe-floor                           Jun 2026   ← the UNREAD store prints this
                                                     ← the CONTROL says Nov 2026
```

The hero says *"—"* and *"Some balances couldn't be read"*; the "Your plan" legend row prints no date at all (`debtFreeDate` is gagged, so the `{debtFreeDate ? … : null}` at `TrajectoryChart.tsx:544` renders nothing). **The only debt-free date left on the screen is the Safe-floor one — and it is five months earlier than the truth.** The safe-floor row is the *conservative* line by design (`TrajectoryChart.tsx:553-554`: *"the plan row above is the motivational headline; this is the honest floor for a variable earner"*), so the one figure the screen still asserts is the one the user is told to trust, and it credits them with a card they still owe in full.

**Files and lines.**
- `apps/rn/src/app/(tabs)/progress.tsx:375` — `band={view.band}` passed **ungated**, five lines above `debtFreeDate={mayStateBalances ? view.debtFreeDate : null}` (`:380`) and `interestSaved={mayStateBalances ? … : { kind: 'none' }}` (`:381`).
- `apps/rn/src/components/payoff/TrajectoryChart.tsx:555-564` — renders `Safe-floor {shortDate(band.lean)}`.
- Same ungated `view`, same card, further sites (site table below): `progress.tsx:369-374` (`snowball`/`avalanche`/`minimums`/`lean` → the plotted curve, its `$k` gridline labels, its waypoint labels), `:383` (`whatIf` → *"With extra … · ~$X, N months sooner"*), and the scrub readout.
- Producer: `apps/rn/src/store/planSelectors.ts:142-151` `selectDebtFreeBand` → `selectDebtFreeDate`.

**The measurement — one store, one variable, both stores printed.** Harness `apps/rn/src/zz-audit/c1.ts` written inside the detached worktree `C:\Users\Jason\audit-p5-c` (deleted with the worktree; how to re-create it is at the end). The variable is Visa's `balance`: the string `'n/a'` (which `runMigrations` repairs to `0` and records) versus the `6000` the user owes. Income varies (`incomeVaries: true, leanAmount: 1800`), which is what makes `hasBand` true.

```
$ cd /c/Users/Jason/audit-p5-c/apps/rn && NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/zz-audit/c1.ts
EXIT=0

=== UNREAD  (Visa balance lost -> repaired to $0) ===
repairs           : ["debt.balance"]
mayClaim(balances): false
hasDebts          : true
-- GATED by mayStateBalances (progress.tsx:264-284,380-381) --
  hero pct        : 0  (raw 76)
  hero journeyLine: Some balances couldn't be read  (raw "$13,000 of $17,000 paid")
  hero date       : —  (raw "May 2026")
  interestSaved   : {kind:none}  (raw {"kind":"saving","interestSaved":155.93,"monthsSaved":15})
-- UNGATED, same screen --
  band.hasBand    : true
  band.lean  RENDERED as "Safe-floor <date>": "June 2026"
  band.typical    : "May 2026"
  minimums end mo : 17
  max curve bal   : 4000 -> y-axis top label ~ $5k
  scrub month 0   : balance 4000 -> readout "$4,000"
  whatIf(+$200)   : simulatedDate "May 2026" interestSaved 1 monthsSaved 0

=== CONTROL (Visa balance = $6,000) ===
repairs           : []
mayClaim(balances): true
hasDebts          : true
-- GATED by mayStateBalances --
  hero pct        : 41  (raw 41)
  hero journeyLine: $7,000 of $17,000 paid
  hero date       : July 2026
  interestSaved   : {"kind":"saving","interestSaved":2858.98,"monthsSaved":32}
-- UNGATED, same screen --
  band.hasBand    : true
  band.lean  RENDERED as "Safe-floor <date>": "November 2026"
  band.typical    : "July 2026"
  minimums end mo : 36
  max curve bal   : 10000 -> y-axis top label ~ $10k
  scrub month 0   : balance 10000 -> readout "$10,000"
  whatIf(+$200)   : simulatedDate "July 2026" interestSaved 13.82 monthsSaved 0
```

⛔ **One variable moves the Safe-floor date from November 2026 to June 2026 and the scrub readout from $10,000 to $4,000, while the gate above them reports the screen "refusing".**

**The site table — every money-bearing expression the ungated `view` reaches on this one card.** ⚠️ **Treat this as a LOWER BOUND.** I enumerated by reading `TrajectoryChart.tsx` for expressions whose value descends from `snowball`/`avalanche`/`minimums`/`lean`/`band`/`whatIf`; site counts in this repo have come in short eight times running.

| # | site | renders | gated? | reachable on the UNREAD store? |
|---|---|---|---|---|
| 1 | `TrajectoryChart.tsx:562` | `Safe-floor  Jun 2026` | ⛔ no | yes — needs `incomeVaries` + `leanAmount` |
| 2 | `TrajectoryChart.tsx:503` scrub readout | `Mar 2026  ·  $4,000  ·  now` | ⛔ no | yes — one drag on the chart |
| 3 | `TrajectoryChart.tsx:429-437` `formatAxisBalance` | `$0 · $2k · $4k` gridline labels | ⛔ no | yes, always |
| 4 | `TrajectoryChart.tsx:461-472` waypoint labels | debt names at their projected clear months | ⛔ no | yes, 2+ debts |
| 5 | `TrajectoryChart.tsx:573-578` "With extra" row | `Jun 2026 · ~$1,666, 22 months sooner` | ⛔ no | yes — open the What-If disclosure |
| 6 | `WhatIfControls` (`:595`, `result={whatIf}`) | the with-extra date / savings copy | ⛔ no | yes — same disclosure |
| 7 | `StrategyCompare` (`:613-620`) | snowball-vs-avalanche dates + interest | ⛔ no | yes — "Snowball or avalanche?" |
| 8 | `TrajectoryChart.tsx:477-483` end pill | the debt-free date pill | ✅ yes (via `debtFreeDate`) | — |
| 9 | `TrajectoryChart.tsx:544-551` "Your plan" row | date + `deltaSuffix` | ✅ yes | — |
| 10 | `TrajectoryChart.tsx:527-537` "Minimum payments" row | `minimumsDateLabel` | ✅ **incidentally** — `showMinimums` goes false once `interestSaved` is gagged to `{kind:'none'}` | — |
| 11 | `TrajectoryChart.tsx:389-390` the chart's a11y `groupLabel` | `debt-free Jun 2026` / `your plan clears faster than minimum payments` | ✅ yes (both descend from the two gated props) | — |

**Mechanism — stated as a HYPOTHESIS.** `C4-9`'s remedy said *"suppress the four together (`pct`, the journey line, the hero date, `interestSaved`)"*, and the fix implemented exactly four. My hypothesis is that **the enumeration, not the gate, is the defect**: `mayStateBalances` is asked once and then spent on a hand-written list of four props, while `view` — the object carrying at least eleven balance-derived figures — is handed to the chart whole and untouched, one line above the two gated props. Pass 4's own report records the premise that made this survivable (`2026-08-28-s1-money-pass4/C-screens.md:1072`): *"`payoff/TrajectoryChart.tsx` … **no defect in the file.** It states the `view` it is handed faithfully; the ungated `view` is `C4-9`"* — true, and the fix then gated two of the view's fields rather than the view.

**Why the instrument reports green — rule 3, which member of its class did the fixture pick?** `apps/rn/tests/e2e/progress-hero-journey.spec.ts:186` is `C4-9`'s pin and asserts the four figures together. Its fixture is `scenario({ genuineCycleCount: 6, debts: [...] })`, whose `paycheck` is `{ amount: '2000' }` (`apps/rn/tests/e2e/helpers/store.ts:34-46`) — **no `incomeVaries`, no `leanAmount`**. So `selectDebtFreeBand` returns `hasBand: false` (`planSelectors.ts:144-145`), the Safe-floor row never renders, and the member of the class that carries a *second* debt-free date is the member the spec cannot run. Same shape for What-If and Compare: both are collapsed by default (`TrajectoryChart.tsx:173,175`) and the spec never opens them. The chart legend is not asserted at all.

**Remedy — NOT verified.** Gate the whole `view`, not a list of its fields: derive one `safeView` at `progress.tsx:264` and pass **that** to `TrajectoryChart`, so a field added to `PayoffView` later is suppressed by construction rather than by somebody remembering. ⚠️ **Two hazards I did NOT measure and that must be measured before shipping it:** (a) blanking `snowball`/`avalanche` empties `activePath`, and `TrajectoryChart.tsx:400` renders **nothing at all** unless `w > 0 && activePath` — a blank card where a chart was, which is `B1`'s own failure mode (a true statement withheld and replaced by nothing that says why), so the card likely needs an explicit "can't chart this yet" state rather than empty props; (b) `CashFlowSection` (`progress.tsx:361`) reads `selectCashTimeline(engineStore)` and I did **not** measure whether its figures descend from `balance` — if they do, the same gate belongs there and it is **not** in the site table above. ⚠️ **A narrower remedy — `band={mayStateBalances ? view.band : { typical: null, lean: null, hasBand: false }}` — closes the headline sentence and leaves sites 2–7 standing.** That is the pass-4 remedy repeated one field over, and I name it so it is not mistaken for the fix.

**What would make completeness checkable** (preferred over *"is the list complete?"*): `PayoffView` is a declared type. A check that walks its fields and requires each to be either declared balance-independent or routed through the claim gate at the mount would derive the population instead of typing it — the structural move `requiredPlanTrust.test.ts` already makes for the `'required-plan'` surfaces, which `'debt-balances'` has **no** counterpart of.

<details><summary>re-creating the harness</summary>

Write `c1.ts` under `apps/rn/src/` (so the `@/` and `@core/` aliases resolve), build the store twice through `runMigrations` with `debts[0].balance` as the only variable, and print `mayClaim(store,'debt-balances')` beside `selectPayoffView(withProjectedBalances(store,isPremium))`'s `band`, `minimums`, curve maxima and `selectWhatIf(...)`. ⚠️ A fresh worktree needs `cmd /c mklink /J apps\rn\core packages\core` first — that junction is untracked, so `@core/*` (mapped to `./core/*`) does not resolve without it, and the failure reads as `Cannot find module '@core/debt/bnplInstallment'`.
</details>

---

### C5-1 addendum — the pinning spec's fixture, replayed through the selectors

The "which member of its class" claim above is measured, not read off the fixture:

```
$ cd /c/Users/Jason/audit-p5-c/apps/rn && NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/zz-audit/c2.ts
EXIT=0
C4-9 spec fixture:
  repairs                : ["debt.balance"]
  mayClaim(debt-balances): false
  paycheck.incomeVaries  : false
  paycheck.leanAmount    : 0
  view.band              : {"typical":"June 2026","lean":null,"hasBand":false}
  -> the Safe-floor legend row renders only when band.hasBand && band.lean: false
```

⛔ On `C4-9`'s own fixture the store **is** gagged (`mayClaim` false) and the Safe-floor row is
structurally absent — so the spec would pass identically with the leak present and with it fixed. It is a
check that cannot fail *for this claim*; it is not a broken check for the four claims it does assert.

---

## C5-2 — `blocker` · the Home Screen widget and Siri state a debt total **$2,513 lower** than the app states on the same store at the same instant

**Severity:** `blocker` — two surfaces of one product state different amounts of the user's money, and the outer one has no way to say it is stale.

**Origin.** `apps/rn/src/widget/snapshot.ts` — **neighbour** (it did not change; the projection rule landed in the app around it). `apps/rn/src/widget/widgetSync.test.ts` — **fix-churn**. `apps/rn/src/app/(tabs)/money.tsx`, `(tabs)/progress.tsx` — **fix-churn** (the other producer).

**The false sentence, as the user reads it.** A premium user with one revolving card, verified eleven months ago, glances at their Home Screen:

> **$9,000 remaining**

and asks Siri, *"how much debt do I have left?"*:

> **"You have $9,000 in debt remaining."**  (`SiriQueryIntents.swift:62`)

Then they open the app, and Money's hero says:

> **$11,513** · *remaining across 1 debt*

**$2,513 apart — 28% of the figure — on one store at one instant.** Premium's own paywall bullet is *"Balances that keep themselves roughly right — projected forward between statements"* (`paywall.tsx:40`); the surface they see without opening the app is the one that does not.

**Files and lines.**
- `apps/rn/src/widget/snapshot.ts:101` — `const totalCurrent = debts.reduce((s, d) => s + d.balance, 0)` — the **last-verified anchors**, never `withProjectedBalances`.
- `apps/rn/src/widget/snapshot.ts:146` — `remaining: mayStateBalances ? formatWhole(totalCurrent) : '—'`.
- `apps/rn/src/widget/snapshot.ts:137` — `selectPayoffView(store)` for `debtFreeDate`, also off the raw store.
- ⚡ **The same file projects for its other claim:** `snapshot.ts:69` — `selectPaydayGuardian(withProjectedBalances(store, true))`. So the module knows the rule and applies it to the Guardian sentence and not to the four figures above it.
- The other producers: `apps/rn/src/app/(tabs)/money.tsx:381` (`selectDebtBalanceView(d, currentDate, isPremium).currentBalance`) and `apps/rn/src/app/(tabs)/progress.tsx:100,265` (`withProjectedBalances` → `selectJourneyTotals(store.debts, engineStore.debts)`, whose `totalCurrent` docblock reads *"**This is what 'remaining' means.**"*).
- The rendered labels: `apps/rn/targets/widget/DebtViews.swift:90` `"\(snap.remaining) left"`, `:122` `"\(snap.remaining) remaining"`, `:203` `"\(snap.pctLabel) paid · \(snap.remaining) left"`; `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift:62`.

**The measurement — one store, one variable (the TIER), both producers printed.**

```
$ cd /c/Users/Jason/audit-p5-c/apps/rn && NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/zz-audit/c4.ts
EXIT=0
   (one card: $9,000 anchor, 29.99% APR, $25 minimum, lastVerifiedDate 2026-01-01, currentDate 2026-12-01)

=== FREE ===
  APP    Money hero          : $9,000 · "remaining across 1 debt"
  WIDGET / Siri "remaining"  : $9,000
  APP    debt-free date      : "December 2028"
  WIDGET debt-free date      : "December 2028"

=== PREMIUM ===
  APP    Money hero          : $11,513 · "remaining across 1 debt"
  WIDGET / Siri "remaining"  : $9,000
  APP    debt-free date      : null
  WIDGET debt-free date      : "—"
```

⭐ **Free is the control and it agrees exactly** — `withProjectedBalances` is a documented no-op for free — so the divergence is the premium projection and nothing else. A second fixture (`c3.ts`, two debts, five months elapsed, 26% / 6% APR) moves it the other way: **app $14,304 · widget $15,000**, so the widget is not conservative in a fixed direction; it is simply a different number.

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/zz-audit/c3.ts
EXIT=0
=== PREMIUM — one store, one instant ===
  APP    Money hero "remaining"    : $14,304
  WIDGET "remaining"               : $15,000
  APP    Progress journey line     : "$14,304 to go"
```

**Mechanism — stated as a HYPOTHESIS.** 2.4 routed every forward-looking read in the app through `withProjectedBalances(store, isPremium)`; `snapshot.ts` was written before that and was subsequently edited **twice** for the trust claim (`D3-1`, `D3-2`) without either edit touching the balance set. My hypothesis is that the trust work is what made this invisible: both passes asked *"may this figure be stated?"* and neither asked *"is this the same figure the app states?"*, and `mayClaim` returns `true` on a perfectly readable store, so the guard is silent on exactly the stores where the divergence lives.

⚠️ **What I did NOT reproduce, stated as such.** `debtFreeDate` is computed from a different balance set on the two sides and can therefore diverge in principle; in three fixtures I did not produce one where the printed dates differed (they were equal, or both degenerate). **Do not report the date as measured.** The `remaining` divergence is measured; `pctLabel` provably cannot diverge (both sides compute `totalPaid/totalOriginal` off the raw anchors, by design — `journeySelectors.ts:19-32`).

**Why the instrument reports green — rule 3 again.** `apps/rn/src/widget/widgetSync.test.ts` has **two** premium fixtures (`:75-83`, `:172-185`) and **no fixture anywhere in the file carries a past `lastVerifiedDate`**, so the projection is a no-op on every one of them and free and premium are indistinguishable:

```
$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/zz-audit/c6.ts
EXIT=0
widgetSync.test.ts D3-2 fixture, replayed:
  currentDate        : 2026-03-02
  lastVerifiedDate   : "2026-03-02"
  balanceAsOfDate    : "2026-03-02"
  anchor balance     : 6000
  projected balance  : 6000
  -> projection is a NO-OP on this fixture: true
```

`runMigrations` stamps `lastVerifiedDate = paycheck.currentDate`, so **every fixture built through `migratedWidgetStore` is structurally in the one member of the class where this defect cannot appear.** There is also no assertion anywhere that the widget and the app agree: `snap.remaining` is asserted against the literal `'$8,000'` (`:56`) and against `'—'` (`:136`, `:152`), never against what a screen states.

**Remedy — NOT verified.** Project once at the top of `buildWidgetSnapshot` — `const engine = withProjectedBalances(store, store.subscriptionPlan === 'premium')` — and derive `totalCurrent`, `live`, `cleared`, `debtFreeDate` and `debtsJson` from `engine`, leaving `totalOriginal`/`totalPaid`/`pct` on `store.debts` (the backward-looking rule, `journeySelectors.ts:19-32`). ⚠️ **Three hazards I did NOT measure:**
(a) `live` currently comes from raw balances and feeds `cleared` — projecting it means a premium user whose estimate reaches `$0` would see the widget say **"Debt-free"** before they have confirmed anything, which `selectProvisionalPayoffs`/`PayoffInvitationCard` exist to prevent; the projected set almost certainly must **not** drive `cleared`.
(b) `debtsJson` feeds Siri's log-a-payment disambiguation, where the anchor may be the correct value to hand back.
(c) `pctLabel` must stay on the anchors or "% paid" falls while the user does nothing.
⚠️ **A narrower remedy — projecting only `totalCurrent` — closes the measured sentence and leaves the date on a different basis than the app's.** I am naming it so it is not mistaken for the fix.
⚠️ **The alternative remedy is to say it rather than fix it**: the widget has no "as of" text today (`updatedAt` exists in the payload and `DebtViews.swift` does not render it as a staleness caption). Deciding that the widget states the *verified anchor* and labels it as such is defensible — but it is a product call, and it is **not** what the app currently does on any other surface.

**What would make completeness checkable.** A parity assertion, not a value assertion: one fixture with real elapsed time, asserting `buildWidgetSnapshot(store).remaining === formatWhole(<the same expression money.tsx renders>)` for **both** tiers. The current file cannot express that, because it has no fixture in which the two expressions could differ.

---

## C5-3 — `blocker` · "Log payment" says **"Chase · $0 owed"** and offers to clear a $12,000 card, one tap below a row that correctly prints an em dash

**Severity:** `blocker` — the app states something false about the user's money, in the sheet where they are recording a payment.

**Origin.** `apps/rn/src/components/entities/LogPaymentSheet.tsx` — **neighbour** (it did not change; `money.tsx`'s row beside it did, at pass-3 `C-1` and pass-4 `C4-2`).

**The false sentences, as the user reads them.** A user restores a backup in which Chase's balance could not be read. Money's debts list puts it under **BALANCE UNREAD** and the row prints **`—`**, exactly as pass-3 `C-1` intended. They open it, tap **Log payment** (`DebtSheet.tsx:313-321`, cross-platform; also the iOS row long-press, `ListRow.tsx:162`), and the sheet header reads:

> **Log payment**
> Chase · **$0 owed**

They type the $500 they actually paid, and the field's note says:

> **More than the balance — this will clear it to $0.**

Two false statements about a card they owe $12,000 on, in the one flow where they are telling the app what they paid.

**Files and lines.**
- `apps/rn/src/components/entities/LogPaymentSheet.tsx:43` — `subtitle={`${debt.name} · ${formatCurrency(debt.balance)} owed`}`
- `apps/rn/src/components/entities/LogPaymentSheet.tsx:30` — `const over = parsed != null && parsed > debt.balance;`
- `apps/rn/src/components/entities/LogPaymentSheet.tsx:55` — the note string.
- The honest producer one tap away: `apps/rn/src/app/(tabs)/money.tsx:582-586` (`balanceText = balanceUnread ? UNREAD_FIGURE : …`).

**The measurement — one store, printed values, plus the source expression.**

```
$ cd /c/Users/Jason/audit-p5-c/apps/rn && NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/zz-audit/c7.ts
EXIT=0
repairs                          : ["debt.a.balance"]
chase.balance (repaired)         : 0
partition: which group is Chase? : unreadBalance (section "BALANCE UNREAD")

MONEY ROW  balanceText           : —
LOG PAYMENT SHEET subtitle       : Chase · $0 owed
LOG PAYMENT SHEET "over" note fires for a $500 entry?: true -> "More than the balance — this will clear it to $0."

LogPaymentSheet.tsx trust-selector references: 0
…and its subtitle line            : subtitle={`${debt.name} · ${formatCurrency(debt.balance)} owed`}
```

**⭐ What is NOT damaged, checked rather than assumed.** `logManualPayment` (`store.ts:680-698`) writes `Math.max(0, 0 − 500) = 0`, so the anchor does not move; `clearResuppliedRepairs`' signal 1 compares `before.balance !== after.balance`, sees `0 === 0`, and **keeps** the repair; and `withPayoffCelebration` needs a crossing to zero, which does not happen. So the record survives and no celebration fires. **The defect is the two sentences, not the write** — I checked, because "a remedy that deletes a debt from the screen" is this round's named hazard and I did not want to report a data-loss that is not there.

**⚠️ The same line has a second, non-repair consequence, measured separately.** On a **premium** store the row prints the projection and this sheet prints the anchor:

```
(from src/zz-audit/c4.ts — $9,000 anchor, 29.99% APR, 11 months elapsed)
  Money row                : ~$11,513   (selectDebtBalanceView(...).currentBalance)
  Log payment sheet        : Chase · $9,000 owed   (debt.balance)
```

The word **"owed"** is doing the damage in both cases: it is the app's word for *what you still owe*, and this line spells it from the last-verified anchor. (`journeySelectors.ts:39` — *"Σ of what is owed now, projected for premium. **This is what 'remaining' means.**"*)

**Mechanism — stated as a HYPOTHESIS.** `'row-figures'` was created at pass 2 as *"a single row restating its own money"*, and pass 3's `C-1` wired it into `DebtRow` — the **list** row. My hypothesis is that the claim's population was taken to be "rows in a list", so every **sheet** that restates the same row's money was outside it by construction. That is consistent with what `lint:trust-claims` reports: `✅ … 0 claim sites open — all 7 money-printing files that read the user's entities call the guard (floor 6)` — green, while eight sheets in my manifest reference no trust selector at all.

**The family — count the ids, not the list; this is a LOWER BOUND.** Files in lane C with **zero** references to any trust selector (`mayClaim` · `rowFieldUnread` · `unreadFieldsFor` · `anyRowFieldUnread` · `hasUnreadDebtBalances` · `partitionDebts`), measured by grep:

| file | origin | restates a repairable figure? |
|---|---|---|
| `components/entities/LogPaymentSheet.tsx` | neighbour | ⛔ **yes — measured above** |
| `components/entities/DebtSheet.tsx` | neighbour | ⚠️ pre-fills the Balance field with the literal `0` (`:115`) — the repaired value typed into the form that asks the user to replace it. I did **not** measure a false-clear: signal 1 needs the value to move, and saving an untouched `0` does not move it. |
| `components/entities/GoalSheet.tsx` | neighbour | not measured |
| `components/entities/ExpenseSheet.tsx` | neighbour | not measured |
| `components/entities/LivingExpenseSheet.tsx` | neighbour | not measured |
| `components/payday/PaydayCaptureSheet.tsx` | neighbour | prints `formatCurrency(requiredTotal)` (`:377`), `plannedTotal` (`:459`), `carryForward` (`:227,313`) — **not measured**; `requiredTotal` is a sum over the same allocation `'required-plan'` gates elsewhere |
| `components/plan/WindfallSheet.tsx` | neighbour | prints a routing split (`:102-109`) — not measured |
| `components/plan/SaveForItSheet.tsx` | neighbour | prints goal pacing (`:119,135`) — not measured |
| `app/history.tsx` | fix-churn | prints `row.totalDebtBalance` (`:86`) — recorded cycle history, not a live derivation; not measured |
| `app/cushion-forecast.tsx` | neighbour | not measured |

⚠️ **Only the first row is measured. The rest are a population to check, not findings** — naming them as findings is exactly the enumeration failure this round is about.

**Remedy — NOT verified.** In `LogPaymentSheet`, ask the same owner the row asks and degrade both the subtitle and the `over` predicate together: `rowFieldUnread(store, 'row-figures', 'debt', debt.id, 'balance')` → subtitle drops the figure (`${debt.name} · balance not read`) and `over` becomes `false` so the note does not fire. ⚠️ **Hazards I did NOT measure:** (a) suppressing the subtitle figure alone leaves the `over` note firing, which is the louder of the two sentences — they must move together, and that is the same "suppress them together" rule `snapshot.ts:117-118` states; (b) the sheet takes a `Debt` prop and no store, so this needs a `useAppStore` read added — check it resolves through `StoreContext` like `DebtRow` does (`money.tsx:535`), or the tutorial sandbox will ask the real store. ⚠️ **The premium half needs a separate decision and I am not proposing one**: whether "owed" here means the anchor (which is what the write acts on) or the projection (which is what every other surface prints). Making the sheet print the projection while the write reduces the anchor would create a third figure, which is worse.

**What would make completeness checkable.** `lint:trust-claims`' population is "money-printing files that read the user's entities" and it currently finds 7. A population derived instead from *"every file that renders `formatCurrency`/`formatWhole` over a field named in `CLAIM_FIELDS`"* would have caught this file, and would name the other nine rows above as answerable questions rather than leaving them to a reader's list.

---

## C5-2 addendum — the plants (both directions), and the restore proof

Rule 4 says reading has never found a check-that-cannot-fail and planting has found it every time; rule 5
says a plant cannot see the green state. Both were run, in the detached worktree.

**Baseline.** `cd /c/Users/Jason/audit-p5-c/apps/rn && NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/testing/runAppTests.ts` → `EXIT=0`, `✅ App-layer regression tests: ALL PASSED.`

**⭐ Plant A — the CONTROL, proving the instrument is live.** Removed the trust gate from the one figure
this finding is about (`snapshot.ts:146`, `remaining: mayStateBalances ? formatWhole(totalCurrent) : '—'`
→ `remaining: formatWhole(totalCurrent)`):

```
EXIT=1
❌ App-layer regression run failed: Error: FAIL [⛔ D3-1 — …and it does not say $0 remaining over $12,400 still owed (expected "—", got "$0")]
```

⭐ **Red, and red for the claim I expected** — `D3-1`'s assertion by name, not an unrelated cascade. So
`widgetSync.test.ts` really does watch this line; it is not a dead file.

**⛔ Plant B — the finding, planted as its own REMEDY, and the suite stays GREEN.** Same line, changed to
read the projection instead of the anchor (`const projected = withProjectedBalances(store,
store.subscriptionPlan === 'premium').debts; const totalCurrent = projected.reduce(...)`):

```
TESTS_EXIT=0
✅ App-layer regression tests: ALL PASSED.
```

⛔ **The whole app-layer suite is indifferent to which balance set the Home Screen widget states.**
⚡ And it is worse than the finding needed: because `totalPaid = totalOriginal − totalCurrent`, plant B
also moved `pctPaid` and `pctLabel` onto the projection — which would make *"% paid"* **fall while the
user does nothing** (`journeySelectors.ts:29-32` names that exact outcome as the thing the split-by-
direction rule exists to prevent) — **and the suite was still green.** Three of the widget's four figures
can be re-based with no test noticing.

**Restore, verified per rule 5** (copy taken AFTER the plant, restore from the pre-plant copy, diff both
ways — `git checkout --` was not used):

```
$ cp apps/rn/src/widget/snapshot.ts /tmp/snapshot.plantedB.ts && cp /tmp/snapshot.orig.ts apps/rn/src/widget/snapshot.ts && diff /tmp/snapshot.orig.ts apps/rn/src/widget/snapshot.ts
RESTORE_DIFF_EXIT=0
$ diff /tmp/snapshot.plantedB.ts apps/rn/src/widget/snapshot.ts > /dev/null
PLANT_WAS_DIFFERENT_EXIT=1   (1 = the plant really differed from the restored file — the plant was not a no-op)
$ git -C /c/Users/Jason/audit-p5-c status --porcelain
?? apps/rn/src/zz-audit/    (my harnesses only; snapshot.ts is clean)
```

---

## C5-4 — `blocker` · the Money row prints **`/mo`** on every non-BNPL debt, including the ones the user told the app are quarterly, annual or weekly

**Severity:** `blocker` — the app states something false about the user's money. A $600 annual loan payment is printed as **$600/mo**, a 12× overstatement of a recurring obligation, on the screen that lists their debts.

**Origin.** `apps/rn/src/app/(tabs)/money.tsx` — **fix-churn**. `apps/rn/src/components/entities/DebtSheet.tsx` (the form that captures the field) — **neighbour**. `packages/core/types/recurrence.ts` (the table that already holds the right answer) — lane A, **neighbour**.

**The false sentence, as the user reads it.** They add a student loan billed **quarterly**: Money → Debts → Add → Recurrence → *Quarterly* (`DebtSheet.tsx:39` offers `monthly · weekly · biweekly · per-paycheck · quarterly · annually` for an ordinary debt, and `submit()` writes it — `DebtSheet.tsx:238`). The row that comes back reads:

> **Student loan**   $12,000 · 6% APR                     **$600**`/mo`

**File and line.** `apps/rn/src/app/(tabs)/money.tsx:630`:

```tsx
amountSuffix={minimumUnread ? undefined : isBnpl ? (CADENCE_SUFFIX[debt.recurrence] || '/mo') : '/mo'}
```

⚡ **The correct answer is in the same expression.** `CADENCE_SUFFIX` — imported by this very file at `money.tsx:12`, and whose docblock says it *"lives beside the type so a new `Recurrence` member cannot be added without the compiler asking what it is called on screen"* — is consulted for BNPL and bypassed with a literal for everything else. The `ListRow` a11y label carries the same string (`ListRow.tsx:89`, `${amount}${amountSuffix ?? ''}`), so VoiceOver reads *"six hundred dollars per month"* too.

**The measurement — one store, one variable (`recurrence`), the row's own expression evaluated.**

```
$ cd /c/Users/Jason/audit-p5-c/apps/rn && NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/zz-audit/c9.ts
EXIT=0
recurrence=monthly        ROW: "$600/mo"      honest suffix would be "/mo"        | engine required row this cycle: $600
recurrence=quarterly      ROW: "$600/mo"      honest suffix would be "/qtr"       | engine required row this cycle: $600
recurrence=annually       ROW: "$600/mo"      honest suffix would be "/yr"        | engine required row this cycle: $600
recurrence=weekly         ROW: "$600/mo"      honest suffix would be "/wk"        | engine required row this cycle: $600
recurrence=per-paycheck   ROW: "$600/mo"      honest suffix would be "/paycheck"  | engine required row this cycle: $600
```

⭐ The control is the first row: on `monthly` the printed string is right, so the expression is not simply broken — it is right for exactly one member of a six-member class the form offers.

**Mechanism — stated as a HYPOTHESIS.** `[T8 · L2-1]` collapsed two divergent cadence tables into `CADENCE_SUFFIX`, and its own docblock frames the problem as *two spellings of the same cadence*. My hypothesis is that the fix went to the call sites that already **had** a table (the BNPL branch, and `guardianSelectors`' `cadenceLabel`) and never reached the branch whose "table" was a hardcoded literal — a literal is not a second spelling, so a de-duplication pass has no reason to look at it. That predicts the same shape wherever a unit is written as a constant next to a cadence-aware sibling; `money.tsx:882` and `BillBreakdownSheet.tsx:76` both print `/mo` on figures explicitly named `monthlyTotal`, which is correct, so those two are **not** instances.

**⚠️ THE ENGINE HALF — measured, and it is NOT mine to report.** The right-hand column above is the same measurement run through `selectAllocation` → `selectRequiredRows`: **the required-row amount is `$600` for all five recurrences.** A weekly $600 obligation and an annual $600 obligation reserve identically. `monthlyEquivalent` (`utils/format.ts:32`) exists and is applied to **expenses** only (`money.tsx:719,725,756`, `expenseReserveSelectors.ts:42`); no debt path calls it, and `selectors.ts:62-64`'s cadence scaling is BNPL-only. ⛔ **I have not established whether that is a defect or a deliberate "a debt's recurrence describes its DUE DATE, not its amount" rule** — `DebtSheet.tsx:37` says *"its cadence describes the repayment rhythm"*, which reads like the former. **Lane A owns the allocator; this belongs in front of them with the measurement above.** If it turns out recurrence really is ignored by design, then C5-4's honest fix may be to remove the control rather than fix the label — which is why the remedy below is two options and not one.

**Remedy — NOT verified, and it is a fork.**
- **(a) If a debt's recurrence is meant to describe the amount:** drop the ternary's special-casing — `amountSuffix={minimumUnread ? undefined : (CADENCE_SUFFIX[debt.recurrence] || '/mo')}` — which is one expression and reuses the owner. ⚠️ Then the **engine** must scale too, or the row and the plan disagree, and the row is currently the half that agrees with the plan. **Fixing the label alone makes the screen internally inconsistent with the required-actions list beside it**, which is the "a remedy that introduces one" hazard this round is counting.
- **(b) If a debt's recurrence describes only its due date:** the label is still wrong (a quarterly-due debt does not owe $600 per month) and the honest suffix is a due-date phrase, not a rate — or no suffix at all.
⛔ **I did not measure either.** Both need the lane-A answer first.

**What would make completeness checkable.** `CADENCE_SUFFIX`'s docblock claims the compiler will ask about a new `Recurrence` member — true of the *table*, false of every site that writes a unit as a literal. A lint on string literals matching `/^\/(mo|wk|yr|qtr|paycheck|2 wks)$/` outside `recurrence.ts` would derive the population; today the only enumeration is a reader's memory, and it has been short here on eight consecutive items.

---

## C5-5 — `minor` · the trust gate's floor comment names a caller that does not exist, so a reader concludes Money is guarded for `'debt-balances'` when it is not

**Severity:** `minor` — a stale premise, in the comment a reader consults to decide whether a screen is covered. (Rule: *a comment is a carried premise and decays like a carried number.*)

**Origin.** `scripts/check-trust-claims.ts` — **lane D**, reported here because the claim is my lane's and lane D owns the file.

**File and line.** `scripts/check-trust-claims.ts:465`:

```ts
'debt-balances': 3, // widget/snapshot.ts ×1 (the balance gate) + money.tsx + progress.tsx
```

**The measurement.** The floor of `3` is **satisfied**, so the gate is green and correct; the comment names the wrong third file.

```
$ grep -rln "'debt-balances'" --include=*.ts --include=*.tsx apps/rn/src | grep -v "\.test\." | sort
apps/rn/src/app/(tabs)/progress.tsx
apps/rn/src/store/celebrationSelectors.ts
apps/rn/src/store/trustSelectors.ts     (the declaration + the table)
apps/rn/src/widget/snapshot.ts

$ grep -c "debt-balances" "apps/rn/src/app/(tabs)/money.tsx"
0
EXIT=1   (grep -c exits 1 on zero matches — read the command's own $?, not the printed 0)

$ NODE_OPTIONS=--max-old-space-size=1536 npx tsx scripts/check-trust-claims.ts
EXIT=0
✅ trust claims: 4 claims all consumed in production (debt-balances→3 · goal-amounts→1 · required-plan→5 · row-figures→5); every asked field routed.
```

The three real consumers are `progress.tsx`, `widget/snapshot.ts` and `celebrationSelectors.ts`. **`money.tsx` asks `hasUnreadDebtBalances` and `anyRowFieldUnread`/`rowFieldUnread('row-figures', …)` — never this claim.** Whether it should is a separate question I did not answer; the finding is that the comment answers it wrongly for the next reader.

**Mechanism — a hypothesis.** The comment was written when `progress.tsx` joined at `C4-9` and describes the population the author expected rather than the one the script counted; the count happened to match because `celebrationSelectors.ts` was already there. A floor that is *exact in both directions* (which this one is, by design) makes the number self-checking and leaves the **names** unchecked.

**Remedy — verified, trivially:** replace the comment's `money.tsx` with `celebrationSelectors.ts`. ⚠️ **Better and NOT verified:** the failure message already prints `Callers: ${consumers.get(claim)!.join(', ')}`, so the names exist at runtime; making the *green* line print them too would retire the hand-written list instead of correcting it.

---

## C5-6 — `minor` · the paywall's per-month anchor prepends a suffix currency symbol and forces `.00` on zero-decimal currencies, so two price conventions sit three lines apart

**Severity:** `minor` — true but misformatted, on the one screen where the app asks for money.

**Origin.** `apps/rn/src/app/paywall.tsx` — **neighbour**.

**File and lines.** `apps/rn/src/app/paywall.tsx:93-94`:

```ts
const sym = pkg.product.priceString.replace(/[\d.,\s ]/g, '') || '$';
const perMo = pkg.product.price > 0 ? ` · ${sym}${(pkg.product.price / 12).toFixed(2)}/mo` : '';
```

The plan card's headline is RevenueCat's localized `priceString`; the subnote below it is this hand-built string. ⚠️ The comment beside it names the hazard it *did* handle — *"so it isn't a hardcoded `$` on non-USD stores (R2.5)"* — which is why the remaining half matters: the file has already decided non-USD stores are in scope.

**The measurement — the expression evaluated over real App Store price-string shapes.**

```
$ cd /c/Users/Jason/audit-p5-c/apps/rn && NODE_OPTIONS=--max-old-space-size=1536 npx tsx src/zz-audit/c8.ts
EXIT=0
  store price "$29.99"     -> "Billed yearly · $2.50/mo"
  store price "29,99 €"    -> "Billed yearly · €2.50/mo"        ← card above reads "29,99 €"
  store price "£24.99"     -> "Billed yearly · £2.08/mo"
  store price "¥3,000"     -> "Billed yearly · ¥250.00/mo"      ← JPY has no minor units
  store price "₩39,000"    -> "Billed yearly · ₩3250.00/mo"     ← no thousands separator, forced .00
  store price "R$ 149,90"  -> "Billed yearly · R$12.49/mo"
```

⭐ The US row is the control and is correct. ⛔ On a euro store the card states **29,99 €** and the line under it states **€2.50** — symbol on the wrong side and a `.` where the same screen just used a `,`. On a won store the anchor reads **₩3250.00**, which is neither grouped nor a real KRW amount.

**Mechanism — a hypothesis.** `toFixed(2)` and string concatenation are locale-blind by construction; the symbol was extracted from the localized string precisely *because* the author knew the currency varies, and then re-composed with US placement and US separators. `Intl.NumberFormat` is what carries all three (placement, separator, minor-unit count) and needs the **currency code**, which `PackageLike` may not expose — that is the thing to check first.

**Remedy — NOT verified.** If `pkg.product` carries a currency code, `new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(price / 12)` replaces all of `sym` + `toFixed`. ⚠️ **Hazards I did not measure:** (a) whether `PackageLike` exposes a currency code at all — if not, this is unfixable from the price string alone and the honest move is to **drop** the per-month anchor on non-`$` stores rather than misformat it; (b) `STATIC_PLANS` (`paywall.tsx:73-77`) hardcodes `'Billed yearly · $2.50/mo'` for the web/dev fallback and must not start rendering a device locale's currency on a preview that is not a real offer.
⚠️ **Not a candidate for `formatCurrency`**: that formatter is the app's own USD-shaped money voice and this figure is an App Store price, which must follow the store's locale, not the app's.

---

## Observations I could NOT establish — recorded so nobody re-finds them as facts

⚠️ Each of these is a shape I looked at and **failed to prove reachable**. They are not findings.

1. **Lock Screen countdown past a payday.** `paydayActivityContent.ts:87` clamps `days` at `0` and `countdownLabel(0)` is `'Today'`, so a `store.paycheck.currentDate` past `nextPaycheckDate` would put **"Today"** on the Lock Screen every day until rollover. Measured: `currentDate 2026-03-20 / nextPaycheckDate 2026-03-16 → raw=-4, clamped=0, label="Today"` (`src/zz-audit/c8.ts`). ⛔ **I could not reach that store state**: `currentDate` is written only at rollover (`payday.ts:147,178`, to `nextPaycheckDate`), and `usePaydayCapture`'s awaiting-rollover check uses the wall clock (`todayLocalISODate()`), not `currentDate`. If a path exists that advances `currentDate` past `nextPaycheckDate`, this is live; I did not find one.
2. **`notifications.ts:142-157`** filters upcoming bills on `dueDate > today` with **no upper bound**, then prints *"{name} and {n−1} more due soon"* and *"{n} upcoming expenses"* two days before the **earliest**. A user with eight monthly bills would read *"Rent and 7 more due soon"* about bills up to a month away. I did not measure it on a real store and did not establish what "soon" is supposed to mean here.
3. **`DebtSheet.tsx:115`** pre-fills the Balance field with `String(seed.balance)` — the literal `0` for a balance the app recorded it could not read, in the form the repairs card sends the user to *replace* it. ⭐ **I checked the dangerous half and it is safe**: `clearResuppliedRepairs`' signal 1 needs the value to move, and saving an untouched `0` does not move it, so the repair is not falsely cleared. The remaining question is presentational and I did not measure whether the field is visibly captioned anywhere.

---

## Summary — lane C, pass 5

### By severity

| severity | ids | count |
|---|---|---|
| `blocker` | `C5-1` `C5-2` `C5-3` `C5-4` | **4** |
| `major` | — | **0** |
| `minor` | `C5-5` `C5-6` | **2** |
| (unestablished observations, **not** findings) | 3 | — |

⚠️ **Every count in this file is a LOWER BOUND**, and I am saying so rather than claiming completeness.
Site counts in this project have come in short on eight consecutive items; `C5-1`'s own site table and
`C5-3`'s family table are both explicitly bounded, and each finding carries a *"what would make
completeness checkable"* note in place of a completeness claim.

### By ORIGIN — the file the defect LIVES in

| origin | ids | count |
|---|---|---|
| **neighbour** | `C5-2` (`widget/snapshot.ts`) · `C5-3` (`LogPaymentSheet.tsx`) · `C5-6` (`paywall.tsx`) | **3** |
| **fix-churn** | `C5-1` (`progress.tsx`, rewritten by pass-4 `C4-9`) · `C5-4` (`money.tsx`) | **2** |
| **first-look** | — (`TrajectoryChart.tsx` is `C5-1`'s render site but not where the defect lives) | **0** |
| **s0-first-look** | — | **0** |
| lane D (`instrument`) | `C5-5` (`scripts/check-trust-claims.ts`) | **1** |

⚡ **Three of five app-side findings live in `neighbour` files — files that did not change and that no
previous pass could route.** That is the round's own hypothesis confirmed on my lane: `C5-2` and `C5-3`
are both *"the fix corrected one producer and nothing put the other in front of a reader"*, and in both
cases the unchanged producer is the one a user sees **without opening the app** (`C5-2`) or **one tap
below the corrected one** (`C5-3`).

⚠️ Under [D69] `first-look` / `s0-first-look` findings would not restart the convergence count. **I have
none in those buckets**, so nothing here is exempt on that ground: `C5-1` and `C5-4` are `fix-churn`
(swept, then rewritten) and `C5-2` `C5-3` `C5-6` are `neighbour`.

### The three recurring shapes, named

1. **A gate spent on an enumeration instead of on the value.** `C5-1`: `mayStateBalances` is asked once
   and applied to four hand-listed props while the object carrying eleven balance-derived figures goes
   past untouched. `C5-3`: `'row-figures'` reached the list row and not the sheet that restates it.
2. **A rule that landed in the app and not on the surfaces outside it — or the reverse.** `C5-2` is
   pass-3 `D3-1`/`D3-2` with the polarity flipped a third time: the trust guard went to the widget, the
   *projection* never did, and `snapshot.ts` applies the projection to its Siri sentence and not to its
   own four figures.
3. **Which member of its class did the fixture pick.** Every one of `C5-1`, `C5-2` and `C5-4` is invisible
   to its pinning test because the fixture sits in the one member where the defect cannot appear —
   fixed income (`C5-1`), zero elapsed time since verification (`C5-2`), `recurrence: 'monthly'` (`C5-4`).
   In all three the *other* members are ordinary, not exotic.

### Plants run

| plant | expectation | result |
|---|---|---|
| **A** — remove the `mayStateBalances` gate from `snapshot.ts:146` | red, for `D3-1`'s claim | ⭐ **red, for exactly that claim** — the instrument is live |
| **B** — re-base `snapshot.ts`'s `totalCurrent` onto the projection (i.e. `C5-2`'s own remedy) | ? | ⛔ **GREEN** — the whole app-layer suite is indifferent, and green even though the plant also moved `pctPaid`/`pctLabel` onto the projection |

Both restores verified by `diff` against a pre-plant copy **and** against the post-plant copy (`git checkout --` was not used). See the `C5-2` addendum for the pasted commands and exit codes.

### Coverage — what I read, and what I did NOT get to

Of my **122**-file manifest, **25** contain a money-bearing expression (`formatCurrency` · `formatWhole` ·
`toLocaleString` · `% APR` · `pctLabel` · `monthlyEquivalent`), measured by grep over the manifest.

**Read in full or examined at every money site (17):**
`(tabs)/index.tsx` · `(tabs)/progress.tsx` · `(tabs)/money.tsx` (through the Debts section; the Bills and
Goals sections were grepped, not read line by line) · `payoff/TrajectoryChart.tsx` ·
`payoff/trajectoryDomain.ts` · `payoff/whereText.ts` · `plan/AffordabilityCard.tsx` · `plan/ShareCard.tsx` ·
`progress/PaidOffArchive.tsx` · `entities/LogPaymentSheet.tsx` · `entities/DebtSheet.tsx` ·
`money/BnplCalendarSection.tsx` · `widget/snapshot.ts` · `widget/widgetSync.test.ts` ·
`liveActivity/paydayActivityContent.ts` · `notifications/notifications.ts` · `app/history.tsx` ·
`app/cushion-forecast.tsx` · `app/paywall.tsx` (the pricing half).

⛔ **Money-bearing files in my manifest I did NOT audit line by line** — each is a real gap:
`plan/PaydayGuardianCard.tsx` (**712 lines, fix-churn — the largest money card in the app**) ·
`payday/PaydayCaptureSheet.tsx` (572, neighbour) · `plan/PaidOffFinale.tsx` · `plan/SaveForItSheet.tsx` ·
`plan/WindfallSheet.tsx` · `plan/dataRepairsCopy.ts` (+ its test) · `plan/CashRunwayChart.tsx` ·
`plan/AffordabilityImpactBar.tsx` · `plan/GuardianProofStrip.tsx` · `payoff/monthLabels.ts` ·
`app/living-expenses.tsx` · `components/ui/ListRow.tsx` (read only its `amount`/a11y path).
⚠️ `PaydayGuardianCard.tsx` is the one I would send the next reader to first: it is `fix-churn`, it is the
subject of pass-4's `C4-7` and `C4-5`, and `C5-3`'s family table shows its sibling sheet
(`PaydayCaptureSheet`) printing four `formatCurrency` totals with **zero** trust-selector references.

**Non-money files in the manifest (97)** — theme tokens, motion, UI primitives, hooks, premium plumbing —
were swept by grep for money-bearing expressions and a11y-label/number mismatches, not read individually.

### Main tree untouched — proof

```
$ git -C /c/Users/Jason/debt-app-v1 status --porcelain
 M docs/DEBT_ELEVATION_PLAN.md
?? docs/audits/2026-08-29-s1-money-pass5/A-engine.md
?? docs/audits/2026-08-29-s1-money-pass5/B-store-storage.md
?? docs/audits/2026-08-29-s1-money-pass5/C-screens.md
?? docs/audits/2026-08-29-s1-money-pass5/D-instruments.md
?? docs/audits/2026-08-29-s1-money-pass5/DISPATCH.md
```

⚠️ **`docs/DEBT_ELEVATION_PLAN.md` is NOT mine** — I did not open or write it; it appeared between two
`status` calls during this session (my first call, before I wrote anything, showed only the three untracked
audit files). `A-engine.md`, `B-store-storage.md`, `D-instruments.md` and `DISPATCH.md` are the other
auditors'. **The only path I wrote is `docs/audits/2026-08-29-s1-money-pass5/C-screens.md`.**

Every plant, harness and experiment ran in the detached worktree `C:\Users\Jason\audit-p5-c` at
`65566a09`, which was removed at the end of the pass. Nothing was staged, committed or pushed anywhere.

### Servers / ports

I started no server. `netstat -ano | grep LISTENING` over **8081, 8082, 3000, 19000–19006** returned
nothing (`PORTS_EXIT=1`, grep's own no-match exit). **Nothing left behind.**

### Notes for whoever fixes these

- ⛔ **`C5-1` and `C5-4`'s remedies are forks, not instructions.** Both name a narrower fix that closes the
  reported sentence and leaves the class standing, precisely so the narrow one is not mistaken for the fix.
  `C5-4` cannot be fixed at all until lane A answers whether a non-BNPL debt's `recurrence` is meant to
  describe its amount — **fixing the label alone makes Money disagree with the required-actions list.**
- ⛔ **`C5-2`'s remedy must not project `live`/`cleared`.** A premium estimate reaching `$0` would put
  **"Debt-free"** on the Home Screen before the user confirmed anything, which `selectProvisionalPayoffs`
  and `PayoffInvitationCard` exist to prevent. This is the *"a remedy that would have introduced one"*
  hazard, and it is why plant B — which is that remedy, applied naively — must not be taken as a
  verification of it. **It verified the test's blindness, not the fix's correctness.**
- The harnesses (`c1`–`c9`) lived in `apps/rn/src/zz-audit/` in the worktree and are gone with it; each
  finding carries enough to rebuild the one it needs. ⚠️ A fresh worktree needs
  `cmd /c mklink /J apps\rn\core packages\core` before `tsx` can resolve `@core/*` — that junction is
  untracked, and the failure reads as `Cannot find module '@core/debt/bnplInstallment'`.
