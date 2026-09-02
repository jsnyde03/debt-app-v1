# C1 — pass 7 findings (S1 money · plan cards)

Lane C1 · 52 files · 7,767 lines · manifest `ROUTING-C1.txt`.
Subject: **the plan cards** — what the card STATES vs what the producer RETURNS for the same store.

Probes live in `c1-probes/`, run as `npx tsx --tsconfig apps/rn/tsconfig.json <file>` from the repo
root with `NODE_OPTIONS=--max-old-space-size=1536`. Every quoted block below is that runner's own
stdout, and each probe's own exit code is reported beside it.

---

## C1-1 — `blocker` · the Guardian prints `$200` as "Your line" when the user's cushion line is the exact figure that could not be read

**User-facing consequence.** A user whose stored `cushionFloor` was unreadable on restore sees the
Payday Guardian card state a specific dollar line as *theirs* — `$200 · Your line`, spoken as
*"Your line $200"*, drawn as the floor tick on the cushion bar — and, in the unread-inputs state, sees
it named inside the sentence that is explaining that an amount could not be read:

> *"An amount this paycheck has to cover could not be read, so I can't say what's spare or hold your
> **$200** line against it — …"*

$200 is `buildGuardianBrief`'s hard-coded default. The user set $350. The one number the card's own
docblock says it is safe to keep — because *"the user's own line is a number they set, not one the
reader lost"* — is, in this case, precisely the number the reader lost.

**File and line.**

- `apps/rn/src/components/plan/PaydayGuardianCard.tsx:220-221` — the unread body interpolates `formatWhole(brief.floor)`.
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx:205-209` — the docblock stating the premise that is false here.
- `apps/rn/src/components/plan/PaydayGuardianCard.tsx:396` — `{formatWhole(brief.floor)} · Your line`; `:314` the spoken copy; `:364` `floorFrac`.
- `packages/core/guardian/buildGuardianBrief.ts:178` — `const floor = safeAmount(input.floor) || 200;`
- `apps/rn/src/store/guardianSelectors.ts:823` — `floor: store.cushionFloor ?? 200` (`??` does not catch the repaired `0`).
- `apps/rn/src/data/migrations.ts:85` — `readMoney` repairs an unreadable value to `0`.

**Measurement.** `c1-probes/p2-guardian-floor.ts`, one store, one variable (`cushionFloor`), exit 0:

```
A · cushionFloor READABLE (350)
  store.cushionFloor                 = 350
  brief.floor (what the card prints) = 350

B · cushionFloor UNREADABLE ("abc")
  store.cushionFloor                 = 0
  brief.floor (what the card prints) = 200
  GUARDIAN unread body = An amount this paycheck has to cover could not be read, so I can't say
    what's spare or hold your $200 line against it — ...
```

The store is otherwise identical between A and B (premium, $2,000 biweekly, Visa $3,000/$60, Rent
$900, Food $300).

**Mechanism — HYPOTHESIS.** Two independent fallbacks stack. `readMoney` repairs a lost amount to `0`
and records the repair; `guardianSelectors` reads `store.cushionFloor ?? 200`, and `??` passes `0`
through; `buildGuardianBrief` then applies `safeAmount(0) || 200`, which converts the *sentinel* zero
into a *confident* $200. Nothing between `migrations.ts` and the rendered text carries the fact that
this number is a substitute. The unread-inputs gate (`PaydayGuardianCard.tsx:210`) suppresses
everything downstream of the allocation but deliberately exempts `brief.floor` — an exemption reasoned
from a premise that was not checked against the claim table, since
`CLAIM_FIELDS['required-plan'].plan === 'any'` (`trustSelectors.ts:234`) means a `cushionFloor` repair
is one of the things that *triggers* the gate.

**Remedy — UNVERIFIED.** Plausibly: give the brief a `floorUnread` signal derived from the same
`repairsPoisoning(store,'required-plan')` the host already computes, and have the card withhold the
figure (not the sentence) when the lost field is `cushionFloor`. Untested — and the band is computed
against `floor` too (`computeState(discretionary, floor, …)`), so a naive change moves the verdict;
check the tight/clear boundary before adopting.

---

## C1-2 — `blocker` · a store-level money loss is reported as unfixable, and the user is sent to their old app for a number this app has a control for

**User-facing consequence.** When the unreadable amount is one of the five store-level money fields
(`cushionFloor`, `leanAmount`, `typicalAmount`, `windfall`, `expenseReserveBalance`), the repairs card
says:

> **Some of your old data did not come across**
> *There is nothing to reopen for it — check this against your old app and add anything missing.*

and the three Today cards that refuse their claim end with:

> *"… — the rows it came from could not be read at all, so there is nothing here to set again."*

Both are false. `cushionFloor` is set by this card's own **"Adjust your line"** sheet
(`PaydayGuardianCard.tsx:545-552` → `CushionFloorSheet` → `onSetFloor`); `leanAmount` / `typicalAmount`
are set on the income screen. The app tells the user to consult a **different app** for a figure it
offers a first-class control for, so the number is never re-entered, the store keeps `0` (feeding
C1-1), and the suppression stands until the generic "Got it" tap silences the card without repairing
anything.

**File and line.**

- `apps/rn/src/data/migrations.ts:299` — `repairs.push({ entity: 'plan', id: '', … })`.
- `apps/rn/src/store/trustSelectors.ts:510-511` — `answerableByEdit = r.entity !== 'migration' && !!r.id && !isWholeRowLoss(r)`; `id: ''` ⇒ `false`.
- `apps/rn/src/components/plan/dataRepairsCopy.ts:163, 187-196` — the `unrecoverable` block and its copy.
- `apps/rn/src/components/plan/dataRepairsCopy.ts:248-253` — `unreadInputsFix`'s no-answerable branch.
- Consumers of that clause: `PaydayGuardianCard.tsx:219-221`, `RequiredActionsCard.tsx:159-160`, `AffordabilityCard.tsx:230`.

**Measurement.** `c1-probes/p2-guardian-floor.ts`, exit 0, with a control that proves the answerable
branch is reachable from the same probe:

```
B · cushionFloor UNREADABLE
  pendingDataRepairs     = [{"entity":"plan","id":"","name":"your cushion line","field":"cushionFloor","kind":"lost","count":1}]
  answerableByEdit(each) = [ false ]
  DataRepairsCard blocks = [{"kind":"unrecoverable",
     "heading":"Some of your old data did not come across",
     "detail":"There is nothing to reopen for it — check this against your old app and add anything missing.", ...}]
  unreadInputsFix        = "the rows it came from could not be read at all, so there is nothing here to set again"

CONTROL · debt balance unreadable (the SAME probe, one field changed)
  answerableByEdit(each) = [ true ]
  DataRepairsCard blocks = [{"kind":"lost","heading":"An amount could not be read",
     "detail":"Your plan is running without it until you set it again.", ...}]
  unreadInputsFix        = "set the balance on Visa again and this comes back"
```

**Mechanism — HYPOTHESIS.** `answerableByEdit` was rewritten at `S1.12.5.4` to ask `!!r.id` instead of
`!!r.name`, on the reasoning that *"a whole-row loss, a whole-list loss and a `migration` count all
carry `id: ''` because there was no row to name"* (`trustSelectors.ts:500-502`). `S1.13.7.6` then added
a **fourth** producer of `id: ''` — store-level money, which has no row but *does* have a screen. The
enumeration in the docblock is once again shorter than the set the condition admits: the same failure
`S1.12.5.4` records one paragraph earlier (*"the docblock enumerated three members while the condition
admitted four"*). The question `answerableByEdit` is named for — *can the user open something and set
this number again?* — is not the question `!!r.id` asks.

**Remedy — UNVERIFIED.** Plausibly: make `entity === 'plan'` answerable in its own right (it is neither
a row loss nor a migration count), and give `namedFigures` / `describeRepair` a store-money branch that
points at the control rather than at a row. Untested. ⚠️ Note `clearResuppliedRepairs`
(`trustSelectors.ts:469-473`) currently routes plan repairs through the `!answerableByEdit` →
`!r.acknowledged` branch; flipping `answerableByEdit` sends them to `findRow`, and `listFor`
(`:524-534`) returns `[]` for `'plan'`, so `!nowRow` would drop **every** plan repair on the next store
write. A fix must handle `listFor` in the same change or it trades this defect for a silent one.

---

## C1-3 — `minor` · every store-level repair line prints the same phrase twice: "your cushion line — your cushion line"

**User-facing consequence.** The repairs card's item list — the one place the user is told *which*
amount could not be read — renders `your cushion line — your cushion line`. All five store-money
fields are affected: also `your lean paycheck — your lean paycheck`, `your typical paycheck — your
typical paycheck`, `a windfall — a windfall`, `money set aside for bills — money set aside for bills`.

**File and line.** `apps/rn/src/components/plan/dataRepairsCopy.ts:107-109` — `describeRepair` returns
`` `${repair.name} — ${field}` `` where `field = FIELD_LABEL[repair.field]`. For `entity: 'plan'`,
`migrations.ts:299` sets `name = PLAN_MONEY_LABELS[repairField]`, and `PLAN_MONEY_LABELS`
(`migrations.ts:254-260`) and `FIELD_LABEL` (`dataRepairsCopy.ts:46-61`) hold **the same five strings**.

**Measurement.** `c1-probes/p2-guardian-floor.ts`, exit 0:
`describeRepair lines = ["your cushion line — your cushion line"]`. Rendered by
`DataRepairsCard.tsx:97-101` and spoken by `repairsA11yLabel` (`dataRepairsCopy.ts:218`).

**Mechanism — HYPOTHESIS.** `describeRepair`'s em-dash form is `<row name> — <field label>`, which
presumes the two halves name different things (`Visa — the balance`). Store-level money has no row, so
`S1.13.7.6` filled `name` with the field's own label to keep the line non-empty; the field lookup then
produces the identical phrase. Neither table's docblock mentions the other, so the duplication is
invisible from either side.

**Remedy — UNVERIFIED.** Plausibly `if (repair.entity === 'plan') return repair.name || field;` in
`describeRepair`. Untested; `dataRepairsCopy.test.ts` pins these strings and would need re-reading.

---

## C1-4 — `major` · nine assertions prove the §2.0.d hedge budget on a sentence the card never renders in any state a hedge can occur in

**User-facing consequence.** The §2.0.d voice gate exists so that a read the app is less sure of says
so. It never does. On a `clear` or `tight` cycle the card renders only the title and the stats — so a
user whose inputs are weeks old reads *"Looks clear this paycheck"* with `Cushion $200 · To debt $800`
beside it and **no** *"These figures are from a little while ago"*; a premium user in the cold-start
window is never told *"I'm planning from the low side while I learn what your paychecks reliably
clear"*; and the `Safety net $X` stat renders with its explanation (*"I'm holding a small safety net
while I get to know your expenses"*) withheld. A VoiceOver user hears all three, because the group
label at `:292` passes `brief.detail`; a sighted user never does.

**File and line.**

- `apps/rn/src/components/plan/PaydayGuardianCard.tsx:401-403` — `{stale || brief.pausedDeploy || brief.state === 'at-risk' ? <Text>{brief.detail}</Text> : null}`. This is the only visual render of `brief.detail` in the app (grep over `apps/rn/src`: `:292` a11y, `:402` visual, nothing else).
- `packages/core/guardian/buildGuardianBrief.ts:156-168` — `pickHedge` / `withHedge`.
- `packages/core/guardian/buildGuardianBrief.ts:234-264` — the only two branches whose `detail` the card renders (`pausedDeploy`, stale cutoff) both return **before** `pickHedge` is called at `:266`.
- `packages/core/guardian/testBuildGuardianBrief.ts:156-199` — the nine assertions, all green.
- `packages/core/guardian/testBuildGuardianBrief.ts:13` — the shared fixture is `discretionary: 210, floor: 200, shortfall: 0`, i.e. **state `clear`** for every hedge assertion.

**Measurement.** `c1-probes/p3-hedge.ts`, exit 0. The predicate is `PaydayGuardianCard.tsx:401` copied
verbatim. Cases 6 and 7 are the control — they show the predicate *can* be true, so the probe sees both
directions:

```
2 · AGING inputs, clear      state=clear    detail RENDERED? false   detail CARRIES a hedge? true   >>> SPENT AND DISCARDED
3 · discovery holdback, clear state=clear   detail RENDERED? false   detail CARRIES a hedge? true   >>> SPENT AND DISCARDED
4 · cold-start holdback, clear state=clear  detail RENDERED? false   detail CARRIES a hedge? true   >>> SPENT AND DISCARDED
5 · AGING inputs, TIGHT      state=tight    detail RENDERED? false   detail CARRIES a hedge? true   >>> SPENT AND DISCARDED
6 · AGING inputs, AT-RISK    state=at-risk  detail RENDERED? true    detail CARRIES a hedge? false
7 · STALE inputs (cutoff)    state=clear    detail RENDERED? true    detail CARRIES a hedge? false
```

Cases 6 and 7 carry no hedge because both take an early return above `pickHedge`: the shortfall branch
(`:286`) never hedges, and the stale branch (`:254`) is the hard cutoff. So the set of briefs that
carry a hedge and the set the card renders are **disjoint**.

**Mechanism — HYPOTHESIS.** `withHedge` appends to `brief.detail`, and the card's decision to drop
`detail` on calm reads (*"the calm clear/tight reads are told by the title + the stats, so their
paragraph is dropped"*, `:399-400`) was made about the *body copy*, not about the hedge that later
started riding on the same string. The core suite cannot see the card, and
`guardianSelectors.test.ts:293` already records the render rule in a different context — so the fact
existed on both sides of the seam and neither owner joined them. This is the *tested-helper-is-not-a-
used-helper* shape: the hedge is produced, asserted, and has no call site that shows it.

**Remedy — UNVERIFIED.** Plausibly carry the hedge as its own `brief.hedge?: string` field and render
it as a caption unconditionally, so the render decision about body copy stops governing it. Untested;
`withHedge` currently has four call sites and the nine assertions read `detail`, so all would move.


---

## C1-5 — `blocker` · PlanHero withholds the verdict and keeps the figures: it prints `Flexible $1,540` where the true flexible money is `$1,040`

**User-facing consequence.** The first and loudest card on Today partitions the paycheck into
**Required / Spoken for / Flexible**. When an obligation could not be read, the lost obligation leaves
the plan, so `Required` reads **low by exactly the lost amount** and `Flexible` — the number a person
reads as *what I can spend* — reads **high by exactly the lost amount**. The card withholds the verdict
and the debt-free date and prints both figures anyway, at full confidence, in the same navy hero:

> `This paycheck $2,000` · Required **$460** · Flexible **$1,540**
> *"Something this paycheck has to cover could not be read, so I can't tell you where the plan lands yet."*

The truth for that store is Required $960 / Flexible $1,040. VoiceOver hears it as one utterance:
*"This paycheck $2,000. Required $460, Flexible $1,540. Something this paycheck has to cover could not
be read…"* — the figures first, the refusal last.

This is the exact shape `snapshot.ts`'s rule names, quoted in `PaydayGuardianCard.tsx:132-134`:
*"repairing one figure and leaving the others is the same false statement without the word."* Here the
**word** was repaired and the **figures** were left.

**File and line.**

- `apps/rn/src/components/plan/PlanHero.tsx:117` — `const free = Math.max(0, summary.remainingAfterRequired - spokenFor);` — never gated on `unreadPlanInputs`.
- `apps/rn/src/components/plan/PlanHero.tsx:99` — `required`, same.
- `apps/rn/src/components/plan/PlanHero.tsx:131-136, 226-261` — the segments and the legend that print them.
- `apps/rn/src/components/plan/PlanHero.tsx:163-170` — the a11y label, which speaks every segment value.
- `apps/rn/src/components/plan/PlanHero.tsx:157-161, 266` — the only two things `unreadPlanInputs` actually changes: the status sentence and the icon.
- `apps/rn/src/components/plan/PlanHero.tsx:61-73` — the docblock claiming *"the verdict and the date are WITHHELD, not annotated"*.
- `apps/rn/src/store/planSelectors.ts:466` — `remainingAfterRequired = allocation.paycheckAmount - allocation.totalRequired`.

**Measurement.** `c1-probes/p4-hero-flexible.ts`, exit 0. One store, one variable — a second debt's
`minimumPayment`, `500` vs `'--'`. The four derived figures are `PlanHero.tsx:80, 99, 114-117` copied
verbatim; `unreadPlanInputs` is `!mayClaim(store,'required-plan')` as the host passes it
(`app/(tabs)/index.tsx:346`):

```
A · minimumPayment READABLE (500)
  unreadPlanInputs (gate)       = false
  HERO headline  (This paycheck)= 2000
  legend Required               = 960
  legend FLEXIBLE  <-- printed  = 1040
  status line                   = "on-track · debt-free by July 2027"

B · minimumPayment UNREADABLE ("--")
  store.debts[1].minimumPayment = 0
  unreadPlanInputs (gate)       = true
  HERO headline  (This paycheck)= 2000
  legend Required               = 460      <-- low by the lost $500
  legend FLEXIBLE  <-- printed  = 1540     <-- high by the lost $500
  status line                   = "Something this paycheck has to cover could not be read, ..."
```

Case A is the control: the gate is `false` there, so the probe demonstrably sees both states.

**Mechanism — HYPOTHESIS.** `S1.13.7.4` [pass-6 `C1-3`] added `unreadPlanInputs` to this card and wired
it into `statusColor`, `reassurance` and the status icon — the three expressions that carry the
*verdict*. `paycheck`, `required`, `spokenFor` and `free` are computed at `:80-117`, above the gate, and
nothing re-reads it. The docblock's own two-door analysis (`:67-70`) explains why the date is optimistic
and stops there; the same two doors move `remainingAfterRequired` by the identical amount, which is
where `free` comes from. This is the *iterate-the-class-not-the-member* shape: the fix reached the
sentence it was reported about and left the sibling asserting on the same store.

**Remedy — UNVERIFIED.** Plausibly withhold the split the way the Guardian does — render the headline
(`paycheck` is conserved and stays true: $2,000 in both cases) and replace the bar + legend with the
refusal, rather than annotating them. Untested, and it changes the hero's composition, so the
premium-pass sign-off on this card would need re-reading.

---

## C1-6 — `blocker` · one store, three answers to "what is your line": the Guardian says `$200`, the Cash Runway says `$0`, and at `$0` no cycle can ever read as a crunch

**User-facing consequence.** With the cushion line unreadable, the premium **Cushion forecast** screen
prints the legend *"your **$0** line"*, draws the floor line at zero, and every one of the next six
paychecks is therefore above it — so the chart's whole reason to exist (*"a paycheck that falls BELOW
the line — a crunch the free clamped-at-$0 bars can't show"*, `CashRunwayChart.tsx:50-51`) is dead. The
receipt's *"$X under"* clause can never fire, the crunch dots never colour, and the default selection
(*"the nearest under-the-line cycle"*) always lands on cycle 0. Twenty inches away on Today, the same
store's Guardian card is calling that line **$200**.

`/cushion-forecast` carries **no trust gate at all** — `grep mayClaim` over the file returns nothing —
which is the same absence `S1.13.7.4` [pass-6 `C1-3`] found and closed for `PlanHero`, one screen over.

**File and line.**

- `apps/rn/src/store/selectors.ts:24-26` — `effectivePaycheckBuffer = premium ? (store.cushionFloor ?? 200) : 50`. `??` does not catch the repaired `0`, and there is no `|| 200` here.
- `apps/rn/src/app/cushion-forecast.tsx:30` — `const floor = effectivePaycheckBuffer(engineStore);` and `:40` passes it straight in. No `mayClaim` anywhere in the 61-line file.
- `apps/rn/src/components/plan/CashRunwayChart.tsx:198` — `your {formatWhole(floor)} line`.
- `apps/rn/src/components/plan/CashRunwayChart.tsx:60, 79, 115` — `cy.net < floor - 1` (the crunch test, the dot colour, and `under`).
- `apps/rn/src/store/guardianSelectors.ts:513` — `selectAffordability`'s own `store.cushionFloor ?? 200`, a third spelling.
- `packages/core/guardian/buildGuardianBrief.ts:178` — the `|| 200` only the Guardian card gets.

**Measurement.** `c1-probes/p6-floor-two-producers.ts`, exit 0. One store, one variable:

```
A · cushionFloor READABLE (350)
  PaydayGuardianCard  "$X · Your line"   = 350
  CashRunwayChart     "your $X line"     = 350
  AffordabilityCard   "your $X line"     = 350

B · cushionFloor UNREADABLE ("abc")
  store.cushionFloor                     = 0
  PaydayGuardianCard  "$X · Your line"   = 200
  CashRunwayChart     "your $X line"     = 0
  AffordabilityCard   "your $X line"     = 0
```

Case A is the control — all three agree when the value is readable, so the divergence is caused by the
one variable and not by the probe.

**Mechanism — HYPOTHESIS.** There are three spellings of *"the user's line"* and each handles the
repaired `0` differently: `buildGuardianBrief` converts it to `200` via `|| 200`; `effectivePaycheckBuffer`
and `selectAffordability` pass it through as `0`. `AffordabilityCard` is saved only because it happens to
carry `unreadPlanInputs`; `CashRunwayChart`'s host does not. This is the *neighbour* shape the brief
names — the disagreement is visible only from the side that did not move, and the side that did not move
is the forecast screen.

**Remedy — UNVERIFIED.** Plausibly one owner for *"the user's line, and whether we could read it"*,
returning a value plus an `unread` flag, consumed by all three. Untested. ⚠️ The `|| 200` and the `?? 200`
are not interchangeable — one substitutes a default for a *sentinel zero* and the other for *absent* —
so collapsing them without deciding which case each caller is in would change the Guardian's band.

---

## C1-7 — `minor` · the Guardian scorecard claims it set the user's line aside "on every paycheck since the first one"; on the free tier it set aside $50

**User-facing consequence.** The first thing a newly-subscribed user sees on the cushion forecast, in
the un-proven (`n` below the gate) state, is:

> **Reserved since day one**
> *"I've set your line aside on every paycheck since the first one. I'm still learning your patterns…"*

For anyone who used the app on the free tier first — which is every upgrader, and this screen is
premium-only so it is the population that reaches it — that is false: the plan reserved
`BASE_PAYCHECK_BUFFER = 50`, not their line, for every one of those paychecks.

**File and line.**

- `apps/rn/src/components/plan/GuardianScorecard.tsx:45-50` — the copy.
- `apps/rn/src/store/selectors.ts:24-26` — `effectivePaycheckBuffer` returns `BASE_PAYCHECK_BUFFER` (50) for a free store, `:16`.

**Measurement.** `c1-probes/p6-floor-two-producers.ts`, exit 0, the control block — the same $350 line,
one variable (`subscriptionPlan`):

```
CONTROL · the SAME $350 line, on the FREE tier
  store.cushionFloor                         = 350
  effectivePaycheckBuffer (what is set aside) = 50
```

**Mechanism — HYPOTHESIS.** `L1-13` correctly replaced a *record* claim (*"Protected since day one"*)
with an *action* claim, on the reasoning that *"the floor auto-protect is confidence-independent, so the
line gets reserved on every paycheck from the first"*. That is true of the premium action and untrue of
the user's history: the sentence's scope is *"since the first one"*, which reaches back through however
many free cycles preceded the subscription. The rewrite changed what kind of claim it was and kept the
unbounded scope. Its own sibling module already refuses this shape — `buildGuardianBrief.ts:274-275`
*"States the WORK, not the guarantee."*

**Remedy — UNVERIFIED.** Plausibly bound the sentence to the premium period (*"since you subscribed"*)
or drop the temporal clause. Untested; the string is likely pinned by a copy gate.

---

## C1-8 — `minor` · the word `L1-15` removed from the heading survives 38 lines below it, in the same component, on the empty-list line

**User-facing consequence.** A user who is short this paycheck and has nothing the plan can move reads:

> *"Nothing here can **safely** wait this paycheck — adding income is the surest fix, or cover the $X gap
> from savings."*

`L1-15` removed exactly this word from the heading directly above, because *"the app cannot see late
fees, biller policy or credit reporting, so 'safe' is a claim about consequences it has no access to"*.
The heading is now *"CAN WAIT IN YOUR PLAN"* and carries a caveat; this sentence still makes the
retired claim, and it is the branch a user in the worst state reaches.

**File and line.** `apps/rn/src/components/plan/RecoveryPlanSection.tsx:152` — the only remaining
user-visible *"safe"* in the file. `:107-113` is the fix that removed it from `:114`.

**Measurement.** `grep -n "safe\|Safe" RecoveryPlanSection.tsx` — 10 hits, 9 of them the identifier
`plan.safeToDefer` or the docblock recording the fix, and one rendered string: `:152`. Its branch
condition is `plan.safeToDefer.length === 0`, i.e. exactly the case where the heading and its caveat
(`:114-117`) do not render at all — so the user reading this sentence never sees the corrected wording.

**Mechanism — HYPOTHESIS.** `L1-15` was reported against the heading, and the fix reached the heading.
The empty-list sentence is a sibling asserting the same thing on the same store, in a branch the
heading's own condition excludes — which is why a reader checking the fix in situ would not have seen
it. Same class as pass-4's *"13 of 34 findings were one class"*.

**Remedy — UNVERIFIED.** Plausibly *"Nothing here can wait in your plan this paycheck — …"*, matching
the heading's own wording. Untested; `lint:copy` may pin the string.

---

## C1-9 — `major` · the "no refusal points at a sibling card" gate is green over a card that renders `set it again above`, if the phrase wraps a line

**User-facing consequence (of what the gate lets through).** `S1.13.7.8`'s whole finding was three cards
ending *"set it again **above**"* while the card they pointed at is removed by one *"Got it"* tap. The
guard written to stop it from coming back does not see the phrase when it spans a source line break —
which is exactly how a long JSX template string gets written.

**File and line.** `apps/rn/src/components/plan/unreadInputsCopy.test.ts:40-48` — `codeLinesOnly`:

```js
return source.split(NEWLINE).filter((line) => { … }).join(' ');
```

`line.trimStart()` is used only for the comment test; the value pushed into `join(' ')` is the **raw**
line, indentation included. So two words split across a line join as `again` + `' '` +
`'                    above'`. The needle at `:143` is `code.includes('again above')` — a single space —
and never matches.

**Measurement — PLANTED, both directions, in `RequiredActionsCard.tsx:159`.** Baseline: 30 assertions,
exit 0.

```
PLANT 1 (control — the phrase on ONE line):
  `... so this list is incomplete — set it again above.`
  EXIT=1
  Error: FAIL [apps/rn/src/components/plan/RequiredActionsCard.tsx: no refusal points "above" at a
         card that one tap removes]

PLANT 2 (the SAME defect, phrase wrapped across a line):
  `... so this list is incomplete — set it again
      above.`
  EXIT=0
  ✅ unread-inputs copy: 30 assertions passed
```

Plant 1 is the control the brief requires: it proves the checker can see this subject in this file, so
plant 2's green is the gate failing and not a harness fault. Both plants were restored from a copy and
verified two ways — `cmp` against the copy, and `git status --porcelain` on the file returning empty.
The suite was re-run after the restore: exit 0, 30 assertions.

**Mechanism — HYPOTHESIS.** `codeLinesOnly` exists to strip comments (the docblocks quote the banned
wording while recording it), and joining with a single space is the right shape for that job. The
`again above` assertion then reuses it as if it produced normalised text, which it does not — whitespace
is preserved from the source. The same collapse would be needed for every other multi-word needle any
future assertion adds here, so this is a property of the helper rather than of the one string.

**Remedy — UNVERIFIED.** Plausibly normalise in `codeLinesOnly` (`.replace(/\s+/g, ' ')` after the
join) and/or match `/again\s+above/`. Untested. ⚠️ Normalising changes what every other assertion in
this file sees; the `unreadInputsFix` / `unreadFix` `includes` checks would need re-reading, and the
brief's rule applies — plant once per claim.

---

## C1-10 — `minor` · the same suite's fixture builds every repair with a `kind` that is not a member of the type

**User-facing consequence.** None directly — but the fixture that stands in for *"a repair record"*
across 30 assertions is not one, and the `as DataRepair` cast is what hides it. A later assertion that
does branch on `kind` (`repairBlocks` does — `lost` / `recovered` / `unrecoverable`) would silently take
the `lost` path for a fixture nobody intended to be `lost`.

**File and line.** `apps/rn/src/components/plan/unreadInputsCopy.test.ts:50-51`:

```ts
const repair = (over: Partial<DataRepair> = {}): DataRepair =>
  ({ entity: 'debt', id: 'd1', name: 'Visa', field: 'balance', kind: 'repaired', … }) as DataRepair;
```

`apps/rn/src/data/models.ts:300` — `kind?: 'recovered' | 'lost'`. `'repaired'` is not a member.

**Measurement.** `grep -n "kind?:" apps/rn/src/data/models.ts` → `300:  kind?: 'recovered' | 'lost';`.
`dataRepairsCopy.ts:138-140` — `kindOf` returns `'lost'` for anything that is not `'recovered'`, so the
fixture behaves as `lost` and `unreadInputsFix` (which never reads `kind`) is unaffected today. The
`as DataRepair` cast at the end of the expression is what stops `tsc` reporting it.

**Mechanism — HYPOTHESIS.** The cast was presumably added for the deliberately-invalid whole-row fixture
at `:121` (`field: '(whole list unreadable)'`, which is a real runtime shape the type does not spell), and
it then covered the whole object literal including the `kind` typo. One cast, two effects.

**Remedy — UNVERIFIED.** Plausibly `kind: 'lost'` and narrow the cast to the one field that needs it.
Untested.

---

## C1-11 — `minor` · the same suite's "opposite direction" case never covers the fourth producer of an unanswerable repair

**User-facing consequence (of what the gate does not cover).** This is C1-2's instrument half. The block
at `:114-125` is the suite's guard on `unreadInputsFix`'s no-instruction branch, and it exercises exactly
one input shape — a parenthesised whole-list loss. The branch is also taken by **every store-level
(`entity: 'plan'`) repair**, where it produces a false statement (C1-2), and no assertion here would
notice.

**File and line.** `apps/rn/src/components/plan/unreadInputsCopy.test.ts:121` —
`repair({ field: '(whole list unreadable)', id: '', name: '' })` is the only input to that branch.
`apps/rn/src/data/migrations.ts:299` is the fourth producer of `id: ''`.

**Measurement.** The fixture factory (`:50`) hard-codes `entity: 'debt'`; `grep -n "'plan'"` over
`unreadInputsCopy.test.ts` returns nothing. Meanwhile `c1-probes/p2-guardian-floor.ts` shows a real
`entity: 'plan'` repair reaching that same branch through `runMigrations`.

**Mechanism — HYPOTHESIS.** The block's docblock names the population it is guarding — *"a whole-row or
whole-list loss"* — and the condition it guards (`answerableByEdit`) admits a wider set. This is the
same enumeration-vs-condition gap recorded at `trustSelectors.ts:495-498`, one round later and one file
over.

**Remedy — UNVERIFIED.** Plausibly assert the `plan` case explicitly, in whichever direction triage
decides C1-2 should resolve. Untested — and the assertion cannot be written until C1-2 has an answer,
so this is downstream of that decision rather than independently fixable.

---

## C1-12 — `minor` · a comment in the repairs-copy suite still states the discriminator that pass 5 measured as a blocker

**User-facing consequence.** None directly; it is a carried premise inside the instrument that guards
the repairs card's words, and it points the next reader at the rule that shipped a blocker.

**File and line.** `apps/rn/src/components/plan/dataRepairsCopy.test.ts:167`:

> *"⚠️ The discriminator is the NAME, not the entity — a named debt is actionable, a nameless one is not."*

`apps/rn/src/store/trustSelectors.ts:482-511` records the opposite, as a **measured blocker**:
`answerableByEdit` asks `!!r.id`, deliberately, because *"a repair's `name` can be `''` while the row
still exists, still renders, and is still editable"* — and `!!r.name` therefore *"read 'nothing can be
opened for this' about a row that can be opened"*, putting a debt the app could not read onto the
paid-off shelf.

**Measurement.** The test's own fixture two lines below the comment (`:169-170`) varies **`id`**
(`'d0'` vs `''`) and the name only incidentally; it passes because `answerableByEdit` reads the id. So
the code under the comment exercises the current rule while the comment describes the retired one.
`unreadInputsCopy.test.ts:105-111`, in the sibling file, states the correct rule in full — the two
suites disagree in prose about the same predicate.

**Mechanism — HYPOTHESIS.** The comment predates `S1.12.5.4`; the fixture beside it was written against
the old rule and happens to still discriminate correctly because `id` and `name` are both empty on a
whole-row loss. The change that moved the predicate had no reason to touch this file, so the prose was
never re-read. Exactly the *"a comment is a carried premise and decays like a carried number"* class the
brief names.

**Remedy — UNVERIFIED.** Plausibly reword to *"the discriminator is the ID"* and add the `B5-7` case
(`name: ''`, `id: 'd0'`) so the fixture distinguishes the two rules rather than being neutral between
them. Untested.

---

## C1-13 — `blocker` · the payday capture sheet says `Required expenses & minimums $60.00` and, one line below, `$410.00 paid`

**User-facing consequence.** On the screen whose whole job is to establish ground truth (*"Here's the
plan you set for this paycheck. Confirm what you actually paid."*), a bill the expense reserve has
pre-funded is dropped out of the summary figure. With a $350 reserve against a $350 rent plus a $60
minimum, one card shows:

> **Required expenses & minimums** · `$60.00`
> *410.00 paid* ← the sub-line, after Adjust

and the Adjust screen it opens lists `Rent $350.00` and `Visa $60.00`. Tapping Confirm then shows
**"Payday captured $60"** over rows the user just confirmed totalling $410.

`RequiredActionsCard` already ruled on this exact position: `[T6.6 · L4-6]` says a bare figure over
rows that headline `amount + reserveCovered` *"invites summing a column that was never meant to
reconcile"*, and that card appends **" from this paycheck"** whenever a reserve is in play. This sheet's
figure is bare.

**File and line.**

- `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:440` — `<Text …>{formatCurrency(requiredTotal)}</Text>`, where `requiredTotal` is the prop the host passes as `allocation.totalRequired` (NET of `reserveCovered`).
- `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:274` — `requiredSub` renders `formatCurrency(requiredPaidGross)` (GROSS).
- `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:366` — the Adjust rows render `item.amount + reserveCovered` (GROSS), per `C1-4`.
- `apps/rn/src/components/payday/PaydayCaptureSheet.tsx:201, 298` — `capturedTotal` → `CaptureSuccess`, NET.
- `apps/rn/src/store/planSelectors.ts:79-80` — `net = row.item.amount`, `gross = net + reserveCovered`.
- `apps/rn/src/components/plan/RequiredActionsCard.tsx:236, 264-267` — the sibling that does qualify the figure.

**Measurement.** `c1-probes/p7-capture-header.ts`, exit 0. One store, one variable — `expenseReserve.balance`:

```
expenseReserve.balance = 0            (the control)
  rows = Pay Rent: amount=350 reserveCovered=0 | Pay minimum on Visa: amount=60 reserveCovered=0
  HEADER  :440  requiredTotal = 410
  SUB     :274  paidGross     = 410       -> AGREE

expenseReserve.balance = 350
  rows = Pay Rent: amount=0 reserveCovered=350 | Pay minimum on Visa: amount=60 reserveCovered=0
  HEADER  :440  requiredTotal =  60
  SUB     :274  paidGross     = 410       >>> HEADER AND ITS OWN SUB-LINE DISAGREE <<<
  (net paid, i.e. what "Payday captured" prints) = 60
```

**Mechanism — HYPOTHESIS.** `C1-4` [pass 6] moved three figures on this sheet from net to gross — the
Adjust rows (`:366`), the carry line (`:376`) and `requiredSub` (`:274`) — on the stated rule *"the BILL,
not this paycheck's share of it"*. The summary figure at `:440` is fed by a **prop**, not by
`selectRequiredSplit`, so it was outside the expression the fix touched and kept the net quantity. The
`capturedTotal` at `:201` reads `requiredTotal` in the un-adjusted branch and `requiredPaidTotal` (also
net) in the adjusted one, so the success screen follows the header rather than the rows. Same
*iterate-the-class* shape the fix's own comment names two lines above itself.

**Remedy — UNVERIFIED.** Plausibly derive the header from `selectRequiredSplit(requiredRows, requiredPaid)`
so header, sub-line and rows have one producer, and carry `RequiredActionsCard`'s conditional
" from this paycheck" qualifier. Untested. ⚠️ `capturedTotal` is a separate decision — whether "Payday
captured" means money that left this paycheck or bills discharged — and changing it without deciding
that would move a figure the Interest-Saved Ledger and Drift Tracker are downstream of.

---

## C1-14 — `minor` · the Skia runway chart's prop doc names a field the wrapper deliberately does not pass

**User-facing consequence.** None directly; it is a carried premise that points a reader at the exact
quantity the wrapper's own docblock says must not be used.

**File and line.** `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx:14` —

> `/** The runway line (SVG path through each cycle's carriedBalance). */`

`apps/rn/src/components/plan/CashRunwayChart.tsx:79` builds those points from `mapY(cy.net)`, and
`:50-51` states the rule: *"Numbers are per-cycle (Income − Essentials = the value) — **never the
cumulative no-deploy balance that inflates**."* `carriedBalance` is precisely that cumulative field
(`packages/core/timeline/buildMultiCycleTimeline.ts:187`).

**Measurement.** `grep -n "carriedBalance" apps/rn/src/components/plan/CashRunwayChart.tsx` returns
nothing — the wrapper never reads the field the prop doc names. `:79` is the only producer of `points`.

**Mechanism — HYPOTHESIS.** The chart plotted `carriedBalance` before the COH-1 change that moved it to
the floor-relative `net`; the wrapper's docblock was updated and the leaf component's prop comment was
not, because nothing in the leaf changed. Same class as C1-12, in the neighbouring file.

**Remedy — UNVERIFIED.** Reword to *"through each cycle's floor-relative `net`"*. Untested.

---

# Report

## By severity

⚠️ Deliberately un-backticked here: the only backticked severity token in this file is the one in each
finding's own `##` heading, so a re-enumeration pattern counts headings and nothing else.

| | n | ids |
|---|---|---|
| **blocker** | **5** | C1-1, C1-2, C1-5, C1-6, C1-13 |
| **major** | **2** | C1-4, C1-9 |
| **minor** | **7** | C1-3, C1-7, C1-8, C1-10, C1-11, C1-12, C1-14 |
| **total** | **14** | |

## By origin

Origin is the routed origin of the finding's **primary** file (`ROUTING-ORIGINS.tsv`). Several findings
also implicate off-lane producers; those are named inside each finding and are not double-counted here.

| origin | blocker | major | minor | total | ids |
|---|---|---|---|---|---|
| **`fix-churn`** | **5** | 1 | 2 | **8** | C1-1, C1-2, C1-3, C1-4, C1-5, C1-6, C1-12, C1-13 |
| **`stale-read`** | 0 | 0 | 3 | **3** | C1-7, C1-8, C1-14 |
| **`first-look`** | 0 | 1 | 2 | **3** | C1-9, C1-10, C1-11 |
| `neighbour` | 0 | 0 | 0 | 0 | — |
| `instrument` | 0 | 0 | 0 | 0 | — (no `instrument`-origin file is in this manifest) |
| `off-surface` / `s0-first-look` | 0 | 0 | 0 | 0 | — |

⚠️ **Every blocker is in `fix-churn`.** The brief predicted this bucket and it is where all five landed:
each one is a pass-6 remedy that reached the instance it was reported about and left a sibling asserting
on the same store — C1-1 (`brief.floor` exempted from the gate that exists because of it), C1-5 (the
verdict withheld, the figures kept), C1-6 (a third spelling of "the user's line"), C1-13 (three figures
moved to gross, the fourth left net), C1-2 (a fourth producer of the `id: ''` the condition keys on).

⚠️ **Both instrument findings are in test files this lane happens to own** (`unreadInputsCopy.test.ts`,
`dataRepairsCopy.test.ts`), not in `instrument`-origin files — the origin label does not track where the
checking code lives.

## Coverage

**52 of 52 manifest files read**, plus **19 supporting files** opened to measure a card's claim against
its producer (`buildGuardianBrief`, `guardianSelectors`, `trustSelectors`, `migrations`, `planSelectors`,
`celebrationSelectors`, `selectors`, `StoreContext`, `useAppStore`, `check-sandbox-writes`,
`testBuildGuardianBrief`, `buildMultiCycleTimeline`, `models`, `defaults`, `debtPlannerStorage`,
`format`, `guardianSubjects`, `index.tsx`, `cushion-forecast.tsx`). **71 paths** in `READ-C1.txt`, every
one git-tracked, checked with `git ls-files --error-unmatch`.

## Probes

`c1-probes/`, all run as `npx tsx --tsconfig apps/rn/tsconfig.json <file>` with
`NODE_OPTIONS=--max-old-space-size=1536`. **No OOM.** Each carries a control case.

| probe | subject | exit |
|---|---|---|
| `p0-smoke.ts` | harness smoke test | 0 |
| `p1-plan-repair.ts` | store-level repair → copy, on a default store | 0 |
| `p2-guardian-floor.ts` | C1-1 / C1-2 / C1-3, with a debt-repair control | 0 |
| `p3-hedge.ts` | C1-4, with the at-risk / stale controls | 0 |
| `p4-hero-flexible.ts`, `p4b-debug.ts` | C1-5, with the readable control | 0 |
| `p5-capture-total.ts` | a refuted hypothesis (see below) | 0 |
| `p6-floor-two-producers.ts` | C1-6 / C1-7, with the readable control | 0 |
| `p7-capture-header.ts` | C1-13, with the no-reserve control | 0 |

C1-9 was measured by **planting**, not by a probe: plant 1 (control) redded the exact assertion, plant 2
(the same defect, wrapped across a line) left the suite green at 30 assertions. Both restored from a
copy, `cmp`-verified, and independently confirmed with `git status --porcelain` returning empty; the
suite was re-run green afterwards.

## Hypotheses I formed and then REFUTED by measuring

Recorded because the brief's rule IV says a stated mechanism is a hypothesis, and three of mine were
wrong while looking sound on the page:

1. **"`AffordabilityCard` reads the singleton and writes the context, so it shows real money inside the
   sandbox."** False. `useAppStore` reads through `StoreContext` (`useAppStore.ts:19`); both resolve to
   the same store. `check-sandbox-writes.ts`'s instruction line is correct as written.
2. **"`FloorImpactBar` can print a negative — `-$50 more held back`."** False. `index.tsx:937` defines
   `freed = Math.max(0, before - after)`, so `freed === 0` implies `after > before` and the subtraction
   is positive. (`formatWhole` genuinely does not clamp negatives — the guard is at the producer.)
3. **"`capturedTotal` reports two different numbers depending on whether the user opened Adjust,"**
   because the two branches read different populations. Measured (`p5-capture-total.ts`): with a bill
   marked paid this cycle, `allocation.totalRequired` and `selectRequiredSplit(...).paid` both read 550
   — the populations coincide. No finding.
4. **"The finale share card has no null channel for an unreadable `originalBalance`, unlike the
   `progress` variant."** True of the type, unreachable in practice: `selectCelebration`
   (`celebrationSelectors.ts:171`) gates the finale on `mayClaim(store, 'debt-balances')`, and
   `CLAIM_FIELDS['debt-balances']` routes `originalBalance` (`trustSelectors.ts:207`). No finding.
