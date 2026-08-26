# AUDITOR C — pass 3 · **the screens a user reads money off**

**Pin:** `96d1f11` · branch `v1.7-dev` · ships as `2.0.0`. Read-only; no source file touched.
**Route:** `ROUTING-C.txt` — 66 files · 7,297 lines · `apps/rn/src/app/**` · `apps/rn/src/components/**`
(except `ui/`) · `apps/rn/src/hooks`. Every file on this manifest is one the coverage instrument calls
`never`/`partial` — **no prior pass has swept any of them.**

> _(This file is written incrementally as the audit runs. Sections appear in the brief's required
> order: FINDINGS → STANDING RE-CHECKS → SWEPT AND FOUND CLEAN, BY PATH → MEASURED, AND NOT A DEFECT.)_

---

## ⚠️ The tree was NOT clean when I started

`git -C /c/Users/Jason/debt-app-v1 status --porcelain` at the moment I began:

```
 M docs/DEBT_ELEVATION_LOG.md
 M docs/DEBT_ELEVATION_PLAN.md
?? apps/rn/src/__gate_plant__.tsx
?? docs/audits/2026-08-26-s1-money-pass3/
```

**None of those are mine.** `apps/rn/src/__gate_plant__.tsx` is a two-line plant file another auditor left
in `apps/rn/src/` (`const styles = { hero: { fontSize: 40 } }; export const P = () => <Text …>`); the two
doc edits are another auditor's plan/log writing. I did not create, edit or remove any of them, and I
verified none is imported by anything I measured (`grep -rn "__gate_plant__" apps/rn/src` → the file
itself only). My own probes were written to `apps/rn/capture-out/probe/`, which `apps/rn/.gitignore`
already ignores, so they never appear in `git status`.

⚠️ **At the end of my run the plant file was gone** (its author cleaned it up) and a third doc file had
been modified. **Nothing in `git status` at any point was written by me except this report** — the one
file I did create outside it, `apps/rn/src/__c3_month_plant__.ts`, was created and deleted inside a
single shell command to prove the month-arithmetic gate can still fail (see §2), and `git status`
immediately afterwards showed no trace of it.

---

## Result

| severity | n | |
|---|---|---|
| **blocker** | **5** | `C-1` · `C-2` · `C-3` · `C-4` · `C-5` |
| **major** | **2** | `C-6` · `C-7` *(with `C-7b`, the same finding's second site)* |
| **minor** | 7 | `m1`–`m7` |

**One sentence for 🎯:** ⛔ **The pass-2 fix widened the trust rule's FIELDS into a gated table and did not
widen its CLAIM SITES — the table's own `'row-figures'` route has zero callers, so a restored backup still
prints *"Groceries · Counts toward reserve · $0"*, *"0% APR"* on a card charging 22%, a *"$120"* reserve
that is missing an unknown addend, and *"of $55 recommended each paycheck"* against $1,400 of rent — and
three claim sites the table never reached still speak: the paywall names a *$100* shortfall on a cycle
that is $500 short, the trophy shelf files a $12,000 card as *"$0 paid off"* and offers to share it, and
History congratulates a user with *"$2,923 paid down"* for a debt they deleted without paying a cent.
**S1 does not converge on this pass.**

⚡ **The shape, in one line: 179 money-formatting call sites in `apps/rn/src`; 11 trust-guard
consultations, in 6 files.** Both counted whole, not piped into `head`:

```
$ grep -rn "formatWhole(|formatCurrency(|formatMoney(|formatSigned(" apps/rn/src --include=*.tsx --include=*.ts | grep -v "\.test\." | wc -l
179
$ grep -rn "hasUnreadDebtBalances(|mayClaim(|rowFieldUnread(|unreadFieldsFor(" apps/rn/src --include=*.ts --include=*.tsx | grep -v "\.test\." | grep -v "trustSelectors.ts"
index.tsx:529 · money.tsx:371/1045/1046/1093/1094 · progress.tsx:173 ·
celebrationSelectors.ts:115/119/120 · planSelectors.ts:348          (12 lines, 1 of them a comment)
```

Not every one of the 179 needs a guard — but **nothing anywhere decides which do**, and that is why this
class has now recurred in four consecutive rounds.

⚠️ **Every finding below was produced by executing the shipped code** through `runMigrations`,
`createDebtStore`, `readBackup` and the real selectors, with the render expressions copied verbatim from
the screens. **No finding here rests on a reading**, and two of my own stated mechanisms turned out to be
wrong while their observations survived — both are written up rather than quietly dropped (`C-6`, §4).

---

# 1. FINDINGS

## C-1 · **blocker** · the claim table's `'row-figures'` route has **ZERO production consumers**, so every row that restates a repaired money field prints it as fact

**User-facing consequence.** A person who restores a backup in which one everyday-spending amount could
not be read opens Everyday Spending and is told **"Groceries · Counts toward reserve · $0"** with no
caption, under a **"Reserve per paycheck: $120"** headline that is missing that item's real money — and on
Money the same import prints **"Chase · $5,000.00 · 0% APR"** and **"$0.00/mo"** for a card that charges
22% and demands $150 — four specific dollar/percentage figures the app has *already recorded in
`pendingDataRepairs` that it could not read*.

**What I measured.** The claim table added by the pass-2 fix declares the route and the completeness gate
asserts it, but nothing calls it. Whole result, not a `head`:

```
$ grep -rn "'row-figures'\|row-figures" apps/rn/src apps/rn/tests packages
apps/rn/src/store/trustSelectors.test.ts:213:    eq(mayClaim(withApr('n/a'), 'row-figures'), false, '…but the row may not print "0% APR" as if it read one');
apps/rn/src/store/trustSelectors.ts:77:  | 'row-figures';
apps/rn/src/store/trustSelectors.ts:101:  'row-figures': { debt: 'any', requiredExpense: 'any', livingExpense: 'any', goal: 'any' },
```

**3 hits, and all three are the declaration or its own test.** For contrast, the other three claims each
have a real consumer: `'required-plan'` → `index.tsx:529`, `'debt-balances'` → `celebrationSelectors.ts:115/120`,
`'goal-amounts'` → covered per-row by `rowFieldUnread` at `money.tsx:1045/1046/1093/1094`.

Then the renders themselves, driven through the real `runMigrations` with the row expressions copied
verbatim from the screens (`living-expenses.tsx:59-60` and `:69`; `money.tsx:529-533` and `:552-553`):

```
--- livingExpense amount READABLE (400)
   repairs                : []
   HERO "Reserve per paycheck" (living-expenses.tsx:60) : $520
   ROW Groceries  meta="Counts toward reserve" amount=$400  unreadFields=[]
   ROW Gas        meta="Counts toward reserve" amount=$120  unreadFields=[]
   ROW Fun money  meta="Not counted" amount=$80  unreadFields=[]
   mayClaim 'row-figures' : true   mayClaim 'required-plan': true
--- livingExpense amount UNREADABLE ("n/a")
   repairs                : [{"entity":"livingExpense","id":"l1","name":"Groceries","field":"amount","kind":"lost"}]
   HERO "Reserve per paycheck" (living-expenses.tsx:60) : $120     ← a total missing an unknown addend
   ROW Groceries  meta="Counts toward reserve" amount=$0  unreadFields=["amount"]   ← false, uncaptioned
   ROW Gas        meta="Counts toward reserve" amount=$120  unreadFields=[]
   ROW Fun money  meta="Not counted" amount=$80  unreadFields=[]
   mayClaim 'row-figures' : false   mayClaim 'required-plan': false
```

```
--- apr/min READABLE
   ROW meta              : $5,000.00 · 22% APR
   ROW amount            : $150.00/mo
   mayClaim 'row-figures': true
--- apr/min UNREADABLE
   repairs               : [{…"field":"minimumPayment","kind":"lost"},{…"field":"apr","kind":"lost"}]
   ROW meta              : $5,000.00 · 0% APR      ← the row states a rate it never read
   ROW amount            : $0.00/mo                ← and a minimum it never read
   mayClaim 'row-figures': false                   ← the owner says NO, and no row asks
   unreadFieldsFor(debt) : ["minimumPayment","apr"]
```

*(Probes: `apps/rn/capture-out/probe/p1.ts` (the debt row) and `p2.ts` (Everyday Spending), run with
`npx tsx` from `apps/rn`. ⚠️ `apps/rn/capture-out/` is **gitignored**, so the probe scripts do not survive
into the repo — every output they produced is quoted verbatim above and in §2, which is the record.)*

⚡ **This is the brief's own question answered.** B1's rule was *"wired to a SUBSET of claim sites and a
SUBSET of fields."* Pass 2 widened the **fields** into a gated table — and that half holds; see
`M-3` below, where I measured the gate. **The claim-site half was not widened; it was re-declared.**
`'row-figures'` is the route the table invented *for exactly these renders*, and its own docblock names
the two strings it exists to stop — *"$0.00/mo"*, *"0% APR"* — both of which the app still prints.

**The direction the justification runs in.** The finding is that a *declared* guard has no caller, so it
cannot be answered by re-reading the declaration. The opposite direction — "the rows are captioned some
other way" — is what the second probe rules out: the row strings above are the complete `meta`/`amount`
values `ListRow` receives, and `money.tsx:519-520`'s `captionText` is `canVerify ? 'estimated · tap to
verify' : est.text`, i.e. the premium staleness caption and nothing else. `living-expenses.tsx` passes no
`caption` prop at all. And it cannot be answered by "the repairs card on Today already told them": that is
precisely the state pass-2 `C2` was rated a blocker for — *"The Today card **does** say the amount could
not be read; Money then states a specific dollar figure that contradicts it."*

**Remedy.** Give `'row-figures'` the consumers it was written for. Per row (not store-wide — `A1`'s
over-match is the failure in the other direction): `rowFieldUnread(store, 'livingExpense', item.id,
'amount')` at `living-expenses.tsx:69`, and `rowFieldUnread(store, 'debt', debt.id, 'apr')` /
`'minimumPayment'` at `money.tsx:533`/`:552`, each suppressing the figure and captioning the row the way
the goal rows at `money.tsx:1125-1148` already do. The `living-expenses.tsx:60` headline is a **sum**, so
it takes the store-wide `mayClaim(store, 'row-figures')` (or a livingExpense-scoped equivalent) and the
"a total missing an unknown addend is not a total" treatment `money.tsx:377-393` already carries — see
`C-2`. ⚠️ **A per-site patch rebuilds the defect a fifth time**; the durable shape is what
`RequiredActionsCard.tsx:73` already does — the screen takes `unreadPlanInputs` as a prop from one owner —
so the honest fix is that every money-printing row is handed its own unread-fields list rather than each
screen remembering to ask.

**Would anything catch it?** **No.** `trustSelectors.test.ts:213` asserts
`mayClaim(withApr('n/a'), 'row-figures') === false` and passes — it tests the *selector*, and the selector
is correct. There is no assertion anywhere that any render consults it: the grep above is the whole
result. This is reading rule 2 at module scale — the test picked the one member of the class (the
selector) that works.

---

## C-2 · **blocker** · the SUM sites on the expense screens have no guard either, so a total missing an unknown addend is stated as a total — and one of them is a *recommendation*

**User-facing consequence.** After the same restore, Everyday Spending headlines **"Reserve per paycheck:
$120"** when the true figure is unknown and at least $520; and Money's Expenses hero captions itself
**"of $55 recommended each paycheck · ≈ $120/mo"** for a household whose rent alone is $1,400/mo — the app
telling a user to set aside $55 a paycheck against bills it knows it could not read.

**What I measured.** Same probe shape, real `runMigrations`, real selectors, the render expressions copied
from `living-expenses.tsx:59-60` and `money.tsx:766-772`:

```
--- livingExpense amount READABLE (400)
   HERO "Reserve per paycheck" (living-expenses.tsx:60) : $520
--- livingExpense amount UNREADABLE ("n/a")
   repairs : [{"entity":"livingExpense","id":"l1","name":"Groceries","field":"amount","kind":"lost"}]
   HERO "Reserve per paycheck" (living-expenses.tsx:60) : $120
```

```
--- requiredExpense amount READABLE (1400)
   repairs : []
   HERO (money.tsx:766-772) value="$0" sub="reserved for upcoming expenses"
        caption="of $702 recommended each paycheck · ≈ $1,520/mo"
--- requiredExpense amount UNREADABLE ("n/a")
   repairs : [{"entity":"requiredExpense","id":"e1","name":"Rent","field":"amount","kind":"lost"}]
   HERO (money.tsx:766-772) value="$0" sub="reserved for upcoming expenses"
        caption="of $55 recommended each paycheck · ≈ $120/mo"     <-- rent is gone from the recommendation
   mayClaim 'row-figures': false  'required-plan': false
```

*(`apps/rn/capture-out/probe/p2.ts`, `p4.ts`.)*

⚡ **This screen's sibling was fixed for exactly this and this one was not.** `money.tsx:377-393` carries
the remedy in its own words — *"a total missing an unknown addend is not a total"* — and renders
`"Some balances unread / set them again and your total comes back"` instead of the debts hero. The
identical shape on `livingExpenses` (`living-expenses.tsx:60`, `money.tsx:605` → `:736`/`:846`
`<LivingReserve total={livingTotal} />`) and on `requiredExpenses` (`money.tsx:772`) was not looked at.
⚠️ Note the direction of the money.tsx Expenses one: it is not merely a wrong readout, it is a **smaller
recommendation**, so the failure runs toward the user under-reserving.

**The direction the justification runs in.** The claim is about a *sum*, so the per-row remedy in `C-1`
does not close it — captioning the Groceries row still leaves `$120` standing as the headline. The
opposite direction — "suppress the whole screen" — is `A1`'s over-match and is not proposed: the rows
below still state everything the app does know. It also cannot be answered by "the plan is already
guarded": `mayClaim(store,'required-plan')` is correctly `false` and `index.tsx:529` correctly consumes
it, which is why **Today** is honest here — and that is precisely what makes these two screens the *third*
instance of "one tab apart, on one store, the app both refused and asserted the same sentence."

**Remedy.** The sums take the store-wide question, the way the debts hero does:
`mayClaim(store, 'row-figures')` (or a per-entity narrowing) gating `living-expenses.tsx:60`,
`money.tsx:736`/`:846`'s `LivingReserve`, and `money.tsx:772`'s caption — each replaced with the
"set them again and your total comes back" treatment rather than a number.

**Would anything catch it?** **No.** `apps/rn/src/store/expenseReserve.test.ts:146-149` is the owner's
test and its three cases are `420` (enabled-only), agreement with `selectAllocation`, and `[]` → `0`.
None involves a repair record; `grep -rn "pendingDataRepairs|DataRepair" apps/rn/src/store/expenseReserve.test.ts`
returns **0 hits**.

---

## C-3 · **blocker** · History's headline calls a **deleted debt** money the user "paid down", in success green, while the same store says they paid $0

**User-facing consequence.** A user who deletes a debt — a duplicated CSV row, a card they transferred
away, an entry they created by mistake — opens Pay Cycle History on the next payday and is congratulated
with **"$2,923 · paid down across 3 cycles"** in success green, having paid **$0**. The app credits them
with money they never paid, on the one screen whose entire job is telling them how far they have come.

**What I measured** — end to end on a real `createDebtStore()`, through the shipped `rolloverPayCycle`
and `removeDebt`, printing `history.tsx:43-46`'s own expressions:

```
--- after cycle 1 (nothing paid)
   snapshots            : 2026-01-15 bal=8000 paid=0
   HEADER (history.tsx:43-46): (no anchor - falls through to "See how far you've come")
--- after cycle 2 (nothing paid)
   snapshots            : 2026-01-15 bal=8000 paid=0 | 2026-01-29 bal=8061.54 paid=0
   HEADER (history.tsx:43-46): (no anchor - falls through to "See how far you've come")

>>> user DELETES the $3,000 Visa (a duplicate import / a card they transferred away)
--- after cycle 3
   snapshots            : 2026-01-15 bal=8000 paid=0 | 2026-01-29 bal=8061.54 paid=0 | 2026-02-12 bal=5077.22 paid=0
   HEADER (history.tsx:43-46): "$2,923  paid down across 3 cycles"  (success green)
   Sum of totalPaidThisCycle : $0   <-- the money actually paid
   rows                 : 2026-02-11 bal=$5,077.22 paid=$0 d=-2984.32 | 2026-01-28 bal=$8,061.54 paid=$0 d=61.54 | ...
```

*(`apps/rn/capture-out/probe/p3.ts`, `npx tsx` from `apps/rn`. Nothing was paid at any point in the run.)*

**Mechanism — and it is a label, not arithmetic.** `historySelectors.ts:27` is
`paidDown = max(0, h[0].totalDebtBalance - h[last].totalDebtBalance)`, and its own docstring says what it
computes: *"Debt reduction from the oldest recorded cycle to the newest."* **Debt reduction and money paid
are different quantities**, and they diverge on every path that moves a balance without a payment —
`removeDebt` (measured above), and in the other direction `addDebt`, which zeroes the anchor via the
`Math.max(0, …)` and hides real progress. `history.tsx:43-45` spells the first quantity with the second
quantity's word: `{formatWhole(summary.paidDown)}` … `paid down across {cycleCount} cycles`.
⚡ **The honest number is already on every snapshot** — `PayCycleSnapshot.totalPaidThisCycle`, which
`selectHistoryRows` reads at `historySelectors.ts:45` and each row prints as *"$0 paid"*. So the screen
prints the true figure per row and a false one in the headline, three inches apart.

**The direction the justification runs in.** The observation is that the printed sentence and the computed
quantity are different quantities; that holds regardless of *why* a balance moved, so it is not answerable
by arguing deletion is rare (it is not — a duplicate row from an import is the commonest reason anyone
deletes a debt). The opposite direction — "the number is right and the word is loose" — is what makes it a
blocker rather than a minor: the user's takeaway is a dollar amount of *their own money* attributed to
*their own effort*, in success green, and it is wrong by the exact size of the deletion.
⚠️ **I checked the remedy separately from the premise** (reading rule 8): summing `totalPaidThisCycle`
across the snapshots is not a drop-in either — it is *payments recorded*, not *balance reduction*, so it
excludes interest and would read low beside the per-row balances. Both are defensible; **stating one under
the other's name is not.**

**Remedy.** Either sum `totalPaidThisCycle` and keep the word *"paid"*, or keep the subtraction and change
the word to what it measures (*"$2,923 less debt than when you started"*). ⛔ **Do not simply drop the
anchor when a debt was deleted** — that is the list-of-actions shape `trustSelectors.ts:178` already
records as the wrong remedy; the quantity has to match the sentence on every path, not on the paths
someone enumerated.

**Would anything catch it?** **No, and nothing anywhere touches this selector.** Counted whole, not
piped into `head`:

```
$ grep -rn "paidDown|selectHistorySummary" apps/rn --include=*.ts --include=*.tsx | grep -v node_modules | wc -l
11
```

and all 11 are `history.tsx` (4), `historySelectors.ts` (4) and my own probe (3). **Zero are tests.**
`ls apps/rn/src/store/historySelectors*` returns one file — there is no `.test.ts` sibling — and
`grep -c "historySelectors" apps/rn/src/testing/runAppTests.ts` returns **0**. `ls apps/rn/tests/e2e | grep -i hist`
returns nothing. ⚠️ An earlier draft of this paragraph said the other references were "screenshot seeds";
I had not run the grep when I wrote it, and the grep says there are no other references at all. Reading
rule 5, caught by running the thing.
---

## C-4 · **blocker** · the trophy shelf asks the OLD guard while the finale asks the new one, so a cleared debt whose `originalBalance` could not be read is filed as **"$0 paid off"** — and shared that way

**User-facing consequence.** A user who restores a backup in which one cleared card's original balance
could not be read reaches the debt-free Progress screen and finds their $12,000 card on the permanent
trophy shelf as **"Chase · $0 paid off · Feb 2026"**, with a Share button whose headline reads **"I paid
off 2 debts ($400) on my way to debt-free 🎉"** — $12,000 of their own repayment erased from the one
artefact in the product designed to outlast the moment and be sent to other people.

**What I measured** — real `runMigrations`, real `selectPaidOffDebts`, `progress.tsx:173`'s own gate
expression and `PaidOffArchive.tsx:32/36-37/66`'s own render expressions:

```
--- originalBalance READABLE (12000)
   repairs                    : []
   hasUnreadDebtBalances      : false   <- progress.tsx:173 gate
   mayClaim 'debt-balances'   : true    <- the claim table's answer
   TROPHY SHELF renders       : true
     row  Chase   "$12,000 paid off"
     row  Visa    "$400 paid off"
   SHARE headline             : "I paid off 2 debts ($12,400) on my way to debt-free 🎉"
--- originalBalance UNREADABLE
   repairs                    : [{"entity":"debt","id":"d1","name":"Chase","field":"originalBalance","kind":"lost"}]
   hasUnreadDebtBalances      : false   <- progress.tsx:173 gate  ** STILL FALSE **
   mayClaim 'debt-balances'   : false   <- the claim table says NO
   TROPHY SHELF renders       : true
     row  Chase   "$0 paid off"
     row  Visa    "$400 paid off"
   SHARE headline             : "I paid off 2 debts ($400) on my way to debt-free 🎉"
```

*(`apps/rn/capture-out/probe/p5.ts`.)*

**Mechanism — two owners for one claim, disagreeing on exactly the field the fix added.** The pass-2 fix
routed `'debt-balances': { debt: ['balance', 'originalBalance'] }` and wrote down *why*:
`trustSelectors.ts:83-85` — *"`originalBalance` joins it because the finale states '$12,400 paid off',
which `selectCelebrationStats` sums from exactly that field."* ⚡ **The trophy shelf sums the same field
and was left on the other guard.** `hasUnreadDebtBalances` (`trustSelectors.ts:41-44`) tests
`r.field === 'balance'` and is *correctly* field-specific for its other two consumers — `selectPlanState`
→ the graduation banner and `money.tsx:371`'s cleared hero both make a claim purely about *balances*. It
is the wrong question for `progress.tsx:173`, because what that branch gates is not a sentence about
balances but a **list of per-debt amounts plus a shareable total**. A repaired `originalBalance` is `0`,
not absent, so `PaidOffArchive.tsx:66`'s `d.amount != null` honesty check — which exists for exactly this
and prints a bare `"Paid off"` when the figure is unknown — never fires.

**The direction the justification runs in.** The justification is that the *claim* includes
`originalBalance`, which the claim table itself asserts; so it cannot be answered by pointing at
`hasUnreadDebtBalances`' docblock defending its narrowness — that docblock is about `apr` and
`minimumPayment`, which say nothing about balances, and it is right about them. The opposite direction —
"widen `hasUnreadDebtBalances` to include `originalBalance`" — is the remedy I am **not** proposing, and
checking it separately (reading rule 8) is what rules it out: widening it would also gag the graduation
banner and `money.tsx:371`'s "Every balance cleared" over a debt whose *balances* were all read
perfectly, which is a true statement withheld — the failure `progress.tsx:186-196` records itself having
made once already.

**Remedy.** Two lines, neither of which is a new copy of the rule:

1. `selectPaidOffDebts` (`celebrationSelectors.ts:33`) maps `amount` to `null` when
   `rowFieldUnread(store, 'debt', d.id, 'originalBalance')` — the existing `amount: number | null`
   contract already means *"never captured; don't fabricate"*, and an unreadable one is that case. Every
   render downstream (`PaidOffArchive.tsx:36/61/66`) then does the right thing for free.
2. The share total at `PaidOffArchive.tsx:32/37` is a **sum**, so it drops the parenthetical when any
   contributing amount is `null`, rather than summing `?? 0` — which is `C-2`'s shape on a string that
   leaves the device.

⛔ **AND THE SECOND RENDER SITE HAS NO GATE AT ALL.** Counted whole, not piped into `head`:

```
$ grep -rn "PaidOffArchive" apps/rn --include=*.ts --include=*.tsx | grep -v node_modules
apps/rn/src/app/(tabs)/progress.tsx:13:import { PaidOffArchive } from '@/components/progress/PaidOffArchive';
apps/rn/src/app/(tabs)/progress.tsx:185:          <PaidOffArchive debts={paidOff} />
apps/rn/src/app/(tabs)/progress.tsx:346:      <PaidOffArchive debts={paidOff} />
apps/rn/src/components/progress/PaidOffArchive.tsx:26:export function PaidOffArchive({ debts }: { debts: PaidOffDebt[] }) {
```

`:185` is the debt-free branch behind `hasUnreadDebtBalances`; **`:346` is the ordinary payoff screen and
carries no trust check of any kind** — so a user who has cleared one card and still owes another sees
*"Chase · $0 paid off"* on the trophy shelf **today**, without needing to be debt-free at all. ⚠️ I found
this only because I counted the whole grep result; the first draft of this paragraph said "3 hits" and
named `:186`. Reading rule 5, on the same page as the finding.

**Would anything catch it?** **No, and I checked the class rather than the spelling.** Zero of those four
sites is a test. `grep -rn "originalBalance" apps/rn/tests | wc -l` returns **51**, and filtering out the
numeric seeds (`grep -viE "originalBalance: *[0-9]"`) leaves **5**, every one of them a prose comment:
`bnpl.spec.ts:12`, `celebration.spec.ts:15`, `earlyjourney.spec.ts:63`,
`progress-hero-journey.spec.ts:9`, `shots/p6.8-matrix.shot.ts:282`. **Not one test in the repo seeds an
unreadable `originalBalance` or a repair record on that field.** `trustSelectors.test.ts` asserts the
*table* contains `originalBalance` and never reaches a render that prints it.
---

## C-5 · **blocker** · the paywall states a personalised dollar fact about the user's money with no trust guard, so it names a **$100** shortfall on a cycle that is $500 short

**User-facing consequence.** A user whose imported file lost one card's minimum payment opens the paywall
and reads, in bold, **"This paycheck comes up $100 short."** — when the cycle is actually $500 short,
because the $400 minimum the app could not read left the plan. The screen then sells them a Recovery Plan
sized against a number that is wrong by 4×, on the one surface where the app is asking for their money.

**What I measured** — real `runMigrations`, the real `selectAllocation` → `selectPlanSummary` →
`paywallLead` chain that `paywall.tsx:127-128` runs, single-variable A/B on the raw `minimumPayment`:

```
--- minimumPayment READABLE (400)
   repairs                 : []
   summary.cushion         : 0   shortfall: 500
   PAYWALL LEAD fact       : "This paycheck comes up $500 short."
   PAYWALL LEAD offer      : "Recovery Plan is the guided catch-up for a cycle like this one."
   mayClaim 'required-plan': true
--- minimumPayment UNREADABLE ("n/a")
   repairs                 : [{"entity":"debt","id":"d1","name":"Chase","field":"minimumPayment","kind":"lost"}]
   summary.cushion         : 0   shortfall: 100
   PAYWALL LEAD fact       : "This paycheck comes up $100 short."      <-- off by the whole missing minimum
   PAYWALL LEAD offer      : "Recovery Plan is the guided catch-up for a cycle like this one."
   mayClaim 'required-plan': false
```

*(`apps/rn/capture-out/probe/p6.ts`.)*

**Mechanism.** `paywallLead`'s own interface comments it as *"A fact about THIS user's money, in their own
numbers"* (`paywallLead.ts:6`) and both branches print one — `summary.shortfall` or `summary.cushion`.
Both are derived from the allocation arrays that a repaired `$0` obligation silently leaves, which is
exactly what `'required-plan'` exists to gate. ⚡ **The pass-2 fix wired `mayClaim(store,'required-plan')`
to precisely one consumer** — `index.tsx:529` → `RequiredActionsCard` — and `paywall.tsx` is the second
claim site of the same class, on the same store, in the same session.

**The direction the justification runs in.** The claim is that a *different screen* makes the same class of
statement the guard was created for, so it is not answered by verifying `index.tsx:529` (which is correct
and which I re-verified — see `REV-C4` in §2). The opposite direction — "the paywall's numbers are
illustrative, not a claim" — is ruled out by the code's own contract: the field is literally named `fact`
and its docblock argues at length for *"a MEASURED fact"* over a slogan. ⚠️ And the milder reading — that
this only mis-sizes a sales pitch — under-states it: the `cushion` branch runs on the *non-shortfall*
path too, so the same store can tell a user they have a cushion when the plan is missing an obligation.

**Remedy.** `paywallLead` already returns `null` for "no live plan, so do not invent one"
(`paywallLead.ts:39-40`) — the same escape covers this. Pass the answer in, or have `paywall.tsx:128`
skip the lead when `!mayClaim(store, 'required-plan')`. ⛔ Do not patch the string; the whole lesson of
`trustSelectors.ts:56` is that *"patching each site rebuilds the defect"* — the durable version is that
every consumer of `selectPlanSummary` is handed the guard's answer alongside the summary.

**Would anything catch it?** **No.** `apps/rn/src/store/paywallLead.test.ts` exists and is thorough about
*wording* — it reds on "flexible", "buffer", "autopilot", "automatic" — and
`grep -c "pendingDataRepairs\|DataRepair\|repair" apps/rn/src/store/paywallLead.test.ts` returns **0**.
Reading rule 2: the test picked the member of the class (the vocabulary) that works.

---

## C-6 · **major** · a BNPL plan whose installment amount could not be read is listed as **one** upcoming payment instead of four, with no sign the list is short

**User-facing consequence.** A user restoring a file in which one BNPL plan's installment amount could not
be read sees "UPCOMING BNPL INSTALLMENTS · January · **$78.86 · 1 payment**" for a plan that will actually
charge them **$315.44 across four dates** inside the same six-month horizon — with no "+ N more" line and
no caption on the surviving row to hint that anything is missing.

**What I measured** — real `runMigrations`, the real `buildBnplSchedule` that `BnplCalendarSection.tsx:57`
calls, and `money.tsx:524-533`'s own `meta` expression:

```
--- scheduledPaymentAmount READABLE (78.86)
   isInstallmentNative    : true   balance= 315.44  min= 78.86
   money.tsx DebtRow meta : "$315.44 · 0 of 4 paid · interest-free"
   BNPL CALENDAR          : 2026-01-09 Affirm pay 1/4 $78.86 | 2026-01-23 Affirm pay 2/4 $78.86 | 2026-02-06 Affirm pay 3/4 $78.86 | 2026-02-20 Affirm pay 4/4 $78.86
   unreadFieldsFor(debt)  : []  mayClaim 'row-figures': true
--- scheduledPaymentAmount UNREADABLE ("n/a")
   isInstallmentNative    : false   balance= 315.44  min= 78.86
   money.tsx DebtRow meta : "$315.44 · interest-free"
   BNPL CALENDAR          : 2026-01-09 Affirm pay 0/0 $78.86        <-- one row of four, "0 of 0"
   unreadFieldsFor(debt)  : ["scheduledPaymentAmount"]  mayClaim 'row-figures': false
```

*(`apps/rn/capture-out/probe/p8.ts`. `moreCount` at `BnplCalendarSection.tsx:62` is `0`, so nothing tells
the user the list is short.)*

**Mechanism.** A repaired `scheduledPaymentAmount` is `0`, which makes `isInstallmentNative` false, which
takes the plan out of the installment expansion in `buildBnplSchedule` — it degrades to the single
next-due-date row. ⚡ **`money.tsx`'s debt row degrades GRACEFULLY on the same input** (it drops to
`"$315.44 · interest-free"` because `bnplPaymentsTotal` returns `null`) **and the calendar does not**: it
substitutes a confident, complete-looking schedule that is missing three quarters of the money.

**Why `major` and not `blocker`.** The balance ($315.44) and the plan minimum ($78.86) both stay correct,
the repairs card on Today names the field, and no *stated* figure is arithmetically false — the $78.86 row
is a real installment. What is wrong is the **completeness** of a list presented as complete: a month
subtotal reading *"$78.86 · 1 payment"* when $315.44 falls due in the window. That is "a screen that
misleads", which is the major bar; I could not write the blocker sentence honestly, so it is not one.

**The direction the justification runs in.** The observation is that one input silently changes the
calendar from four rows to one; that is measured, not inferred. ⚠️ I checked the *mechanism* separately
(reading rule 3) because my first hypothesis was wrong: I expected `normalizeBnplInstallment` to compute
`balance = 0 × 4 = 0` and file the debt as paid off — `bnplInstallment.ts:48` does exactly that
arithmetic. **It does not happen**, because `isInstallmentNative` returns false first and
`normalizeBnplInstallment` returns the debt untouched (`bnplInstallment.ts:46`). The observation survived
my wrong explanation; the remedy would not have.

⚠️ **What I nearly reported and did not, because the component is right.** My probe printed the surviving
row as `"pay 0/0"` and I drafted a second half of this finding around a visible *"payment 0 of 0"* string.
**That string never renders.** `BnplCalendarSection.tsx:81` is `{e.totalPayments > 0 ? (…) : null}`, so a
`totalPayments: 0` entry correctly drops the caption entirely — the nonsense was in my format string, not
in the screen. Reading rule 3, on my own mechanism, caught by re-reading the render against the probe.

**Remedy.** `BnplCalendarSection` should say what it does not know rather than list a shortened schedule:
when `rowFieldUnread(store, 'debt', d.id, 'scheduledPaymentAmount')`, name the plan and say its schedule
could not be read, instead of silently emitting one row and a subtotal that reads as the month's whole
BNPL load.

**Would anything catch it?** **No, and the coverage is thinner than I assumed before running it.**
`grep -rn "scheduledPaymentAmount" apps/rn/tests | wc -l` returns **2** — both numeric seeds in
`bnpl.spec.ts` (`78.86` on a readable plan). Nothing in the test tree seeds an unreadable one, and
nothing asserts the calendar's row COUNT against the plan's `remainingPayments`.
---

## C-7 · **major** · the "Replace your data?" confirm is **byte-identical** for a clean backup and one the reader has just recorded three losses on

**User-facing consequence.** A user importing a damaged backup reads *"This backup has 2 debts, 1 expense
and 1 goal. Saved 8/26/2026 at 6:55 PM."*, taps **Replace my data** on a screen that says *"This overwrites
everything currently in the app. It can't be undone."*, and only afterwards — on Today, once their live
portfolio is gone — learns that a balance, a whole debt row and a goal's saved amount could not be read.

**What I measured** — one store, serialised by the app's own `serializeBackup`, then three fields damaged;
both run through the real `readBackup` and the real `describeBackup` that `BackupSheets.tsx:178` renders:

```
--- HEALTHY
   CONFIRM summary shown  : "This backup has 2 debts, 1 expense and 1 goal. Saved 8/26/2026 at 6:55 PM."
   losses runMigrations recorded on THIS FILE, in r.store.pendingDataRepairs:
        (none)
   debts that will land   : Chase=5000, Visa=1200
--- DAMAGED
   CONFIRM summary shown  : "This backup has 2 debts, 1 expense and 1 goal. Saved 8/26/2026 at 6:55 PM."
   losses runMigrations recorded on THIS FILE, in r.store.pendingDataRepairs:
        {"entity":"debt","id":"d1","name":"Chase","field":"balance","kind":"lost"}
        {"entity":"debt","id":"","name":"","field":"(a row could not be read)","kind":"lost"}
        {"entity":"goal","id":"g1","name":"House Fund","field":"currentAmount","kind":"lost"}
   debts that will land   : Chase=0, Visa=1200
```

*(`apps/rn/capture-out/probe/p9.ts`. The damaged file carried **three** debt records; the summary says
"2 debts" and nothing marks the third as unreadable.)*

⚡ **This is `B-J2-2`'s own finding, one field further on, and the fix's docblock is three lines above the
gap.** `readBackup.ts:144-151` reads: *"WHEN, not just what. The counts are identical for a backup
exported this morning and one exported in March, and this sentence is the last thing a person reads before
an irreversible overwrite of a live portfolio."* That fix added the date. **The counts are still identical
for a backup that is intact and one that is damaged** — and unlike the date, the answer is not merely
available, it is already inside the object being described (`result.store.pendingDataRepairs`).
`describeBackup` composes exactly three parts (`contents` · `saved` · `skipped`), and `skipped` covers only
v1.6 keys *"the current version no longer uses"* — the one loss class that is benign.

**Why `major` and not `blocker`.** Nothing the sentence says is false: the counts describe what will land,
which `readBackup.ts:135-138` argues for deliberately and correctly. The failure is **omission at an
irreversible decision point**, which the scale places at major ("an irreversible action with no guard").
I could not write the blocker sentence — "a statement that is false" — without stretching it, so I did not.

**The direction the justification runs in.** The claim is that the confirm withholds information the
reader already computed; that stands regardless of how the file got damaged, and it is not answered by
"the repairs card tells them afterwards" — afterwards is after the overwrite, which is the one thing this
screen exists to sit in front of. The opposite direction — "surface the raw repair list here" — is the
remedy I am **not** proposing: `dataRepairsCopy.ts` already turns repairs into human sentences, and pass
2's `m1` recorded that even that path still prints schema keys. One added clause is enough: *"⚠️ 2 amounts
and 1 whole row in this backup couldn't be read."*

**Remedy.** `describeBackup` gains a fourth part from `result.store.pendingDataRepairs`, worded like
`skipped`. ⚠️ **The mechanism file is out of S1's scope and in S3's** — `apps/rn/src/data/readBackup.ts` is
classified `(backup / restore / CSV import)` by `lint:s1-coverage --report`, i.e. it is not on the S1
surface at all and not on any pass-3 manifest. **The render site is on mine** (`BackupSheets.tsx:177-179`),
which is why I am reporting it here and flagging the fix across to S3 rather than diagnosing further into
that tree.

**Would anything catch it?** **No, and I counted the whole result rather than the two hits I expected.**
`grep -rn "describeBackup" apps/rn --include=*.ts --include=*.tsx` returns **11**: the definition
(`readBackup.ts:140`), one prose mention (`backup.ts:106`), the import + render
(`BackupSheets.tsx:10/178`), and **7 in `readBackup.test.ts`**. I read all seven
(`readBackup.test.ts:255-332`). They assert counts (`1 debt` / `2 expenses` / `1 goal`), the zero-plurals,
the `older version` source label, and — for `B-J2-2` — that `Saved` is present with the right year and
absent for a bare store. **Every fixture is a healthy file.** Not one asserts the sentence DIFFERS between
an intact and a damaged backup, which is the whole claim. Reading rule 2: the tests pick the member of the
class (an undamaged backup) that works.

### C-7b · the **other** restore door describes nothing at all *(same finding, second site — do not fix one without the other)*

`CloudBackupSheet.tsx:137-160` is the iCloud restore confirm. It renders one sentence —
*"Restoring replaces everything on this device with the copy in iCloud. This can't be undone."* — a
**Replace my data** button, and a cancel. **No counts, no `describeBackup`, nothing about what is in the
file.** The only fact about the remote anywhere on the sheet is the status line at `:79-89`
(*"Last backed up 12 March"* / *"A backup from … — not from this device"*).

⚡ **The file door's own docblock states the rule the cloud door does not follow.**
`BackupSheets.tsx:122` — *"Import: read a backup, **SHOW what is in it**, and only then replace."*
`CloudBackupSheet.tsx:18-21` records that the *confirm* was deliberately made in-sheet rather than an
`Alert` for this exact surface, so the gap is not that nobody thought about this screen — it is that the
"show what is in it" half was applied to one door and the "confirm before replacing" half to both.

⚠️ **And it is harder here, which is why it is worth naming rather than assuming.** The file door has the
bytes in hand before it confirms; the cloud door confirms first and calls `restoreNow()` afterwards
(`CloudBackupSheet.tsx:151`), so it has nothing to describe at confirm time. `DataResetScreen.tsx:60-70`
shows the shape of the answer — it already calls `restoreFromCloud` up front to decide whether to offer
the button at all, and holds `result.store`. **The remedy is a pre-read, not a wording change**, and I am
flagging that explicitly because a fix that only edits the sentence would be a fix that cannot work.
---

## Minors

Correct-enough behaviour, imperfect craft. **No user-visible wrong number and no instrument blinded** —
every one of these was measured before being filed down to `minor`.

- **m1 — one assertion in `trajectoryDomain.test.ts` is vacuous, and I proved it with a plant.**
  `:125` is `assert(endPillWidth(null, 1, S) > 0, 'a missing date still reserves a sensible width')`.
  Planted `const chars = label ? label.length : 8` → `: 0` (i.e. reserve *nothing* for the label) in a
  copy of the module under `capture-out/probe/plant/`:

  ```
  == PLANT 6: null label estimates zero ==
  ✅ payoff trajectory domain: 18 assertions passed        <-- survives its own defect
  ```

  The `20 +` base term keeps the expression above zero whatever `chars` is, so the assertion cannot
  distinguish the two states. ⚠️ **`minor`, not `major`, and the reason is measured rather than assumed**:
  the guarded branch is unreachable at the only call site. `endPillWidth` has exactly two uses
  (`TrajectoryChart.tsx:337` and `:486`), and the pill at `:482` renders under
  `{endpoint && debtFreeDate && !scrub ? …}` — so a `null` label never reaches a drawn pill and there is
  no user-visible consequence to blind. The fix is `eq(endPillWidth(null,1,S), endPillWidth('Oct 2026',1,S))`
  or an explicit expected number.

- **m2 — the payoff legend rounds "months saved" UP into years, in the flattering direction.**
  `TrajectoryChart.tsx:64-66`. Measured:

  ```
    monthsSaved=29 -> "2 years"  (true: 2.42 years)
    monthsSaved=30 -> "3 years"  (true: 2.50 years)      <-- 6 months overstated
    monthsSaved=41 -> "3 years"  (true: 3.42 years)
    monthsSaved=42 -> "4 years"  (true: 3.50 years)
  ```

  ⚠️ Note the asymmetry inside `deltaSuffix` (`:72-73`): the **dollar** half carries the `~` hedge the
  comment calls *"the Guardian's hedged-dollar voice"*, and the **time** half does not — so the least
  precise of the two figures is the one stated flat. `Math.floor` (or one decimal) would make it honest.

- **m3 — the paywall's derived per-month anchor is formatted US-style whatever the store's locale is.**
  `paywall.tsx:90-91`. Measured on real `priceString` shapes:

  ```
    store priceString "$29.99"        -> "Billed yearly · $2.50/mo"
    store priceString "¥3,000"        -> "Billed yearly · ¥250.00/mo"     <-- JPY has no minor units
    store priceString "29,99 €"       -> "Billed yearly · €2.50/mo"       <-- symbol and separator both wrong for the locale
    store priceString "1 234,56 kr"   -> "Billed yearly · kr102.88/mo"
  ```

  The *amount* is right in every row; only the spelling is wrong, and it is a derived anchor rather than
  the billed price Apple's 3.1.2 governs (which comes straight from `pkg.product.priceString`). The
  comment at `:89` already anticipated half of this ("so it isn't a hardcoded `$` on non-USD stores").
  `Intl.NumberFormat` with the package's currency code closes the rest.

- **m4 — `WhatIfControls` silently multiplies a typed decimal by 100.** `WhatIfControls.tsx:58` is
  `text.replace(/[^0-9]/g, '')`. Measured: `"12.50"` → `1250`, `"0.75"` → `75`, `"1,200"` → `1200`.
  Filed `minor` and not higher because the field is controlled and re-renders per keystroke, so the
  dropped `.` is visible as the user types, and the comma case is *correct*. Still, `keyboardType="numeric"`
  offers a decimal key on iOS, and there is no reason the strip could not keep one.

- **m5 — History's subtitle counts cycles, the figure above it counts intervals.**
  `history.tsx:44-46` says *"paid down across {cycleCount} cycles"* while `historySelectors.ts:27`
  subtracts the FIRST snapshot from the LAST — i.e. `cycleCount − 1` intervals of change. Measured in
  `C-3`'s probe: 3 snapshots, headline *"across 3 cycles"*, two intervals of movement. Subsumed by `C-3`
  if that finding's remedy re-words the line.

- **m6 — `WhatIfControls`' mechanism line under-describes the one case it exists for.**
  `WhatIfControls.tsx:22-24`: when the extra clears the first debt and there is no second, `second` is
  `undefined`, so the `first.isPaidOff && second` branch is skipped and it says *"Goes straight to your
  Chase"* about money that in fact **pays Chase off**. No number is wrong; the better sentence is simply
  unavailable to the current shape.

- **m7 — "Delete everything" blocks on the iCloud copy and does not block on the quarantined one.**
  `more.tsx:147-150` fires `clearQuarantinedData()` as fire-and-forget with a `reportError` catch, inside
  `runAfterInteractions`, **after** `reset()` and after the screen has already popped — while the confirm
  copy promises *"All debts, expenses, goals, and settings will be permanently erased."* The remote delete
  is correctly ordered first and refuses on failure (`more.tsx:124-133`), and the file's own comment says
  *"a silent failure here is the same lie in a third place"* — so the asymmetry is known. `minor` because
  the quarantined blob is read by nothing in the app (`grep -rn "quarantine" apps/rn/src` → no reader
  outside the persistence layer's own clear) and the failure requires a storage fault on top of a prior
  corruption; but the promise is unconditional and the delete is not.
---

# 2. STANDING RE-CHECKS

⛔ **A re-read is not a re-verification.** Every `CLOSED` below has a printed value or a plant behind it.
Where I only read the code, the row says so and the verdict is not `CLOSED`.

## Pass 2's own findings, on my ground

| id | verdict | the measurement |
|---|---|---|
| `C1` — the trust guard has no reset path | **CLOSED** | End-to-end on a real `createDebtStore()` + `importStore` (`p12.ts`). `A. after import repairs=1 hasUnread=true planState=debt-free-unverified` → `B. after "Got it" repairs=1 hasUnread=true` *(the ack still does NOT un-repair — `A-J2-1` intact)* → `C. balance RETYPED (1200) repairs=0 hasUnread=false planState=normal`. **And the second signal**: on a store whose honest confirmed balance is the same `0` the repair wrote, `D. repairs=1 planState=debt-free-unverified` → `E. after verifyDebtBalance(0) repairs=0 planState=debt-free`. Both paths clear; neither clears on the patch that created the repair. |
| `C2` — the goals guard narrowed to `targetAmount` | **CLOSED** | `p11.ts`, real `runMigrations`, the render expressions at `money.tsx:1045/1046/1093-1148`. A repaired `currentAmount` gives `targetUnread=false savedUnread=true`; HERO value `"Some amounts unread"`, caption suppressed; the affected row prints `"of $1,000"` with `progress=undefined` and the healthy sibling still prints `"$1,000 left"` with a bar. The over-match A1 warns about does **not** occur. |
| `C3` — the finale fired over unreadable balances | **CLOSED** | `p11.ts`. On a store with `pendingPayoff:{kind:'finale'}` and one repaired balance: `selectCelebration(s)` → **`null`** while `store.pendingPayoff` is **still stamped** (so the once-ever moment survives), `selectCelebrationStats` would have printed `{"totalPaid":12400,"debtsCleared":2}`, and `selectPlanState` → `debt-free-unverified`. The two now agree. |
| `C4` — a repaired minimum → *"You're caught up"* | **CLOSED at the sentence · the CLASS is OPEN at two further sites** | `p11.ts`, single-variable A/B: `countOutstandingRequired` **2 → 1** *(the arrays are still wrong, exactly as `B5`'s remedy intends)*, and `unreadPlanInputs = !mayClaim('required-plan')` flips **false → true**. `RequiredActionsCard.tsx:151-156` checks it **first**, so the green *"You're caught up for this paycheck."* is replaced by the amber *"An amount this paycheck has to cover could not be read…"*. ⛔ The same repaired field still prints uncaptioned in the debt row (**C-1**) and still mis-sizes the paywall's stated shortfall (**C-5**). |

## Pass 1's, and the older ids the fix range touched

| id | verdict | the measurement |
|---|---|---|
| `B1` — one owner for *"may the app claim this money?"* | **PARTIAL** | The owner exists and three of its four claims have a production consumer: `'required-plan'` → `index.tsx:529`, `'debt-balances'` → `celebrationSelectors.ts:115/120`, `'goal-amounts'` → `rowFieldUnread` at four `money.tsx` sites. **`'row-figures'` has zero** — whole-repo grep in **C-1**. |
| `B5` — the count is right about the arrays it is given | **CLOSED** | `p11.ts`: with the minimum readable, `countOutstandingRequired = 2` over two real rows; unreadable, `1` over one. The count never lies about its inputs. |
| `A-J2-1` — the ack hides the CARD, it does not un-repair the DATA | **CLOSED** | `p12.ts` row **B**: after `acknowledgeDataRepairs()`, `repairs=1`, `hasUnreadDebtBalances=true`, `planState=debt-free-unverified`. The new reset path did not re-open this. |
| `A-J2-3` — a non-object row is dropped **and recorded** | **CLOSED** | `p9.ts`: a `null` pushed into `debts` produced `{"entity":"debt","id":"","name":"","field":"(a row could not be read)","kind":"lost"}` and no throw. |
| `B-J2-2` — `exportedAt` reaches the confirm screen | **CLOSED** | `p9.ts`: `describeBackup` → `"This backup has 2 debts, 1 expense and 1 goal. **Saved 8/26/2026 at 6:55 PM.**"` ⚠️ Its sibling gap is **C-7**. |
| `P1-3` / `D58` — the payoff chart's x-domain | **CLOSED, plant-verified ×4** | Copies of the module + its test under `capture-out/probe/plant/`; four separate defects planted, each redding a *different* assertion: pre-fix `rawEnd` → `expected 10, got 109`; ignore the lean cone → `expected ≥34, got 23`; truncate at the edge → `last month 10`; drop the `MIN_DOMAIN` floor → `expected 6, got 3`. |
| `V3-5` — the end pill's width is an UPPER bound | **PARTIAL** | Two of its three claims are pinned: dropping `Math.min(fontScale, scaleMax)` reds `expected 86.4, got 144`. The third — *"a missing date still reserves a sensible width"* — **survives its own defect**; see `m1`. |
| `V3-6` — the scrub readout's width has one owner | **OPEN — not verified** | I read `TrajectoryChart.tsx:44-50`'s docblock and did not measure the readout's clamp. Naming it rather than inheriting pass 2's verdict, per the ratchet's *"a clean verdict does not survive an edit"*. |
| `P6.8.9.7.11.11` — the month step clamps | **CLOSED, plant-verified twice** | (a) A copy of `monthLabels.ts` with `d.setMonth(d.getMonth() + months)` restored reds its own test: `FAIL [a 31st start: month 1 is February] expected "Feb 2026", got "Mar 2026"`. (b) The repo gate still catches a NEW site: I created `apps/rn/src/__c3_month_plant__.ts` with one `setMonth` call, ran `npx tsx scripts/check-month-arithmetic.ts`, and it reported `apps\rn\src\__c3_month_plant__.ts:2: d.setMonth(...)` and failed. **The file was deleted in the same command**; `git status` immediately afterwards showed no trace of it. |
| `C7` / `D59` — no interest figure in the strategy comparison | **CLOSED, plant-verified ×5** | `compareStrategies.test.ts` reds on all five plants I could construct: month-0 clears counted, set-instead-of-sequence comparison, backstop sentence removed, only-one-clears branch removed, `firstWinSooner` sign flipped (`expected 19, got -19`). And the module still produces no `interestSaved` field — `assert(!('interestSaved' in cmp))` at `:105`. |
| `L1-24` — *"Not with minimums"*, never *"Never"* | **CLOSED (read)** | `TrajectoryChart.tsx:308` is the literal `'Not with minimums'`; `grep -rn "'Never'" apps/rn/src/components/payoff` → no hits. Read, not executed — no render harness on my route. |
| `L1-28` / `L5-18` — the 404 points at *"Go to Today"* | **CLOSED (read)** | `+not-found.tsx:22` reads `Go to Today` with `href="/"`. |
| `L5-10` — a skip defers ONE question | **CLOSED (read)** | `onboarding.tsx:39-40`: `PaycheckStep onSkip={() => setStep(2)}` — step 2, not step 3. |
| `C9` — `canGoBack()` before `back()` on every pushed route | **CLOSED (read), all three sites** | `paywall.tsx:239`, `more.tsx:143/160`, `schedule/[id].tsx:32`. The destructive one (`more.tsx:143`) sequences the pop before `reset()`. |
| `L4-15` — one owner for the everyday-spending reserve | **CLOSED** | Both consumers call `selectLivingReserveRequest` (`money.tsx:605`, `living-expenses.tsx:36`). `grep -rn "livingExpenses" apps/rn/src/app` returns exactly **2** hits — `money.tsx:589` (the comment recording the removal) and `living-expenses.tsx:32`, which subscribes to the LIST to render rows, not to sum it. No second derivation of the total exists. ⚠️ Being one owner is what makes **C-2** land on both screens at once. |

## The previous surfaces' guards — S0's two open caveats, re-stated rather than assumed

| id | verdict | the instrument's own output, quoted |
|---|---|---|
| `REVERIFY4-2` — committed secrets | **CLOSED-UNPINNED** *(caveat survives)* | `npm run lint:secrets` → `✅ committed secrets: none across 1206 tracked files in index+HEAD (4 shapes checked, 2 exemption(s), cap 2).` ⚠️ Still **unpinned**, exactly as pass 2 recorded, and the tracked count has moved 1199 → **1206** since pass 2 quoted it. |
| `REVERIFY4-3` — duplicate copy | **CLOSED — and the guard still PRINTS, it does not RED** | `npm run lint:copy` → `✅ duplicate copy: no new cross-file phrases (3 baselined).` The caveat is unchanged. |
| the S1 coverage instrument | quoted, not typed | `npm run lint:s1-coverage` → `✅ s1-coverage: 470 surface files classified · 331 unswept.` The four manifests total **331** lines, so routing is exhaustive. |
| the app-layer regression suite | green at this pin | `npm run test:app` (from `apps/rn`) → `✅ App-layer regression tests: ALL PASSED.` |
| the month-arithmetic gate | green, and provably able to fail | `npx tsx scripts/check-month-arithmetic.ts` → `✅ month arithmetic: 642 files, no setMonth/... outside packages\core\utils\addMonths.ts` ⚠️ It also prints a standing **legacy-tree exemption** (2 unconverted sites in `components/`, *"reported not failed"*, self-retiring when P6.11 deletes the tree). Neither is on my route; both are named here so nobody reads the ✅ as covering them. |

⛔ **I did NOT re-verify** `A1`, `B-1`, `D2-1`, `D2-2`, `D2-3`, `B2`, `B3`, `M1`–`M4` or any
`finding-guards` entry. They are auditor A's and D's ground and I have no measurement to offer on them;
**silence there is not a clean verdict.**
---

# 3. SWEPT AND FOUND CLEAN — BY PATH

⛔ **Silence reads as swept, so nothing is silent here.** I reconciled the four lists below against the
manifest mechanically rather than by eye — **66 routed · 56 appear in 3a–3d · 10 in 3e · 0 unaccounted
for.** Of the 56, **8 were read only in part** and each names its range.

## 3a. Read end to end, nothing found

- `apps/rn/src/app/+not-found.tsx`
- `apps/rn/src/app/demo.tsx`
- `apps/rn/src/app/onboarding.tsx`
- `apps/rn/src/app/schedule/[id].tsx`
- `apps/rn/src/app/tutorial.tsx`
- `apps/rn/src/app/(tabs)/_layout.tsx`
- `apps/rn/src/components/AppLockGate.tsx`
- `apps/rn/src/components/DataResetScreen.tsx`
- `apps/rn/src/components/SaveFailedBanner.tsx`
- `apps/rn/src/components/StorageErrorScreen.tsx`
- `apps/rn/src/components/screen.tsx`
- `apps/rn/src/components/tab-bar-icon.tsx`
- `apps/rn/src/components/more-button.tsx`
- `apps/rn/src/components/money/AllocationBarChart.tsx`
- `apps/rn/src/components/money/AllocationBarCanvas.tsx`
- `apps/rn/src/components/money/AllocationBarCanvas.web.tsx`
- `apps/rn/src/components/money/BillBreakdownSheet.tsx` — ⚠️ **clean as a component and it renders `C-2`'s numbers.** It is purely presentational: every figure arrives as `BillBreakdownData` built at `money.tsx:622-641`, so a repaired bill amount reaches it already zeroed. The `formatWhole`/`formatCurrency` split at `:84/93/101/115` is deliberate and correct (the ledger line keeps the real charge; the smoothed shares match the headline's tier).
- `apps/rn/src/components/onboarding/CompletionStep.tsx`
- `apps/rn/src/components/onboarding/OnboardingLayout.tsx`
- `apps/rn/src/components/onboarding/WelcomeStep.tsx`
- `apps/rn/src/components/payoff/StrategyCompare.tsx`
- `apps/rn/src/components/payoff/compareStrategies.ts`
- `apps/rn/src/components/payoff/monthLabels.ts`
- `apps/rn/src/components/payoff/trajectoryDomain.ts`
- `apps/rn/src/components/payoff/TrajectoryCanvas.tsx`
- `apps/rn/src/components/payoff/TrajectoryCanvas.web.tsx`
- `apps/rn/src/components/premium/PremiumInvite.tsx`
- `apps/rn/src/components/progress/JourneyRingChart.tsx`
- `apps/rn/src/components/progress/JourneyRingCanvas.tsx`
- `apps/rn/src/components/progress/JourneyRingCanvas.web.tsx`
- `apps/rn/src/hooks/use-app-colors.ts`
- `apps/rn/src/hooks/use-app-lock.ts`
- `apps/rn/src/hooks/use-cloud-backup.ts`
- `apps/rn/src/hooks/use-color-scheme.ts`
- `apps/rn/src/hooks/use-color-scheme.web.ts`
- `apps/rn/src/hooks/use-go-to-tab.ts`
- `apps/rn/src/hooks/use-inert.ts`
- `apps/rn/src/hooks/use-layout.ts`
- `apps/rn/src/hooks/use-payday-capture.ts`

## 3b. Read end to end AND executed with a planted defect

- `apps/rn/src/components/payoff/compareStrategies.test.ts` — 5 plants, 5 red. **Not vacuous.**
- `apps/rn/src/components/payoff/monthLabels.test.ts` — 1 plant, red.
- `apps/rn/src/components/payoff/trajectoryDomain.test.ts` — 5 plants, **4 red, 1 survived** → `m1`.

## 3c. Read end to end and carrying a finding

- `apps/rn/src/app/living-expenses.tsx` — **C-1**, **C-2**
- `apps/rn/src/app/history.tsx` — **C-3**, `m5`
- `apps/rn/src/components/progress/PaidOffArchive.tsx` — **C-4**
- `apps/rn/src/components/money/BnplCalendarSection.tsx` — **C-6**
- `apps/rn/src/components/more/BackupSheets.tsx` — **C-7**
- `apps/rn/src/components/payoff/WhatIfControls.tsx` — `m4`, `m6`

## 3d. Read in part — the range is named, and only that range is swept

- `apps/rn/src/app/paywall.tsx` — `1-130` (benefits, disclosure, `STATIC_PLANS`, `planFromPackage`, the
  lead wiring at `:127-128`), `:234-260` (the `C9` back control and the lead render). **Carries C-5, m3.**
  Not read: the purchase/restore handlers and the plan-card rendering below `:260`.
- `apps/rn/src/app/more.tsx` — `60-180` (notifications toggle, `handleDeleteAll`, the screen head) and
  `445-535` (`TrustCard`, `DeleteConfirm`). **Carries m7.** Not read: the settings rows between `:180`
  and `:445`.
- `apps/rn/src/components/payoff/TrajectoryChart.tsx` — `1-100` (the label ceiling, `deltaSuffix`,
  `formatMonths`, `formatAxisBalance`, `niceStep`), `290-345` (the minimums label, the scrub handler head,
  `endPillW`), `478-600` (the end pill, the whole legend block, the What-If toggle). **Carries m2.**
  Not read: `100-290` and `345-478` — the geometry, the gesture body and the SVG/Canvas assembly.
- `apps/rn/src/components/more/CloudBackupSheet.tsx` — `18-175` (the status line, the B3 conflict fork,
  Back-up-now, the restore confirm). **Carries C-7b.** Not read: `1-18` and `175-end` (styles).
- `apps/rn/src/components/onboarding/PaycheckStep.tsx` — `1-100` (`handleNext`'s full validation +
  `updatePaycheck` write). Not read: the field rendering below `:100`.
- `apps/rn/src/components/onboarding/FirstDebtOrBillStep.tsx` — `1-60` (`nextMonthFirst`, the head of
  `handleAdd`). Not read: the rest of `handleAdd` and the whole render.
- `apps/rn/src/hooks/spotlightGeometry.ts` — the docblock and `scrollDelta`'s head only.
- `apps/rn/src/app/_layout.tsx` — **grepped, not read.** I established one fact and only that fact:
  `AppLockGate` mounts at `:278`, below `if (!isHydrated) return null;` at `:273` (see §4). The other
  ~370 lines — bootstrap, the restore offer at `:200-230`, the Live Activity wiring, the route guard —
  **are not swept.**

## 3e. ⛔ NOT OPENED AT ALL — name these to pass 4, they are not clean, they are unread

**10 of my 66**, plus the un-read line ranges named in **3d**. I deliberately deferred these once the
measurements showed the money claims were where the findings were.

- `apps/rn/src/components/more/SettingRow.tsx`
- `apps/rn/src/components/more/CoachMarkProbeReadout.tsx`
- `apps/rn/src/components/more/LegacyBridgeProbeReadout.tsx`
- `apps/rn/src/components/more/LiveActivityQA.tsx`
- `apps/rn/src/components/more/ReduceMotionProbeReadout.tsx`
- `apps/rn/src/components/payoff/TrajectorySkiaChart.tsx` *(167 lines — the actual Skia drawing)*
- `apps/rn/src/hooks/use-spotlight.ts` *(228 lines — the largest thing I did not open)*
- `apps/rn/src/hooks/use-coach-mark.ts`
- `apps/rn/src/hooks/use-sheet-presentation.ts`
- `apps/rn/src/hooks/spotlight.test.ts` *(a routed TEST I did not plant against)*

⛔ **And the biggest hole is not on that list — it is in 3d**: `apps/rn/src/app/_layout.tsx`, 376 lines,
the app's entire bootstrap (hydrate, the storage-error and data-reset branches, the launch-time restore
offer at `:200-230`, the Live Activity wiring, the route guard). **I established exactly one fact about
it** — that `AppLockGate` mounts below the `!isHydrated` early return — **and swept none of the rest.**

⚠️ **The four probe-readout components and `LiveActivityQA` are QA affordances**, and I am not claiming
that as a reason to skip them — `tutorial.tsx`'s own `?run=premium` defect was a QA affordance reachable
in production, and that is the class those five belong to. **Nobody has looked.**

---

# 4. MEASURED, AND NOT A DEFECT

Things that looked wrong on my route and were not. This list is what stops pass 4 spending a day on the
same suspicions.

- **A BNPL plan whose installment amount could not be read does NOT get a $0 balance and does NOT reach
  the trophy shelf** — which is what I expected and went looking for. `bnplInstallment.ts:48` really does
  compute `balance = roundMoney(scheduled * remainingPayments)`, so a repaired `scheduled: 0` would zero
  the balance and file the debt as paid off. Measured (`p7.ts`, `p8.ts`): it does not happen, because
  `isInstallmentNative(debt)` returns false at `:46` and the function returns the debt untouched —
  `balance= 315.44 min= 78.86`, `in paidOff list?: []`. ⛔ **My mechanism was wrong and the observation
  behind it (`C-6`) was still real** — reading rule 3, on my own hypothesis.
- **`money.tsx`'s debt row does not print `$NaN` or `"NaN of NaN paid"` on that same input.** I expected
  it to, because `bnplPaymentsRemaining` is `Math.max(0, Math.round(balance / 0))` → `NaN`. Measured with
  the row's own expression (`money.tsx:529-533`): both `bnplPaymentsRemaining` and `bnplPaymentsTotal`
  return **`null`** (they early-return on `isInstallmentNative`), so the ternary falls to the BNPL branch
  and prints `"$315.44 · interest-free"`. Honest degradation, not a defect.
- **`BnplCalendarSection` does not render the nonsense `"payment 0 of 0"`** my probe's format string
  produced. `:81` is `{e.totalPayments > 0 ? (…) : null}` — a zero-total entry correctly drops the
  caption. The finding in `C-6` is the missing rows, and only that.
- **App Lock is NOT disarmed by the store hydrating after the hook mounts.** `useAppLock` seeds
  `useState(enabled)` from `prefs.appLockEnabled`, which would read `false` on a pre-hydrate render and
  never re-arm (the only effect sets `isLocked` **false**, never true). ⚠️ It cannot happen:
  `_layout.tsx:273` is `if (!isHydrated) return null;` and `AppLockGate` mounts at `:278`, so the hook's
  first render always sees the hydrated pref. ⛔ **This one is a structural read, not an execution** — I
  have no RN render harness on this route — so it is stated with its line numbers rather than a printed
  value, and it is the weakest entry in this section.
- **`describeBackup` counting the MIGRATED store rather than the file is right, and `C-7` is not an
  argument against it.** `readBackup.ts:135-138` reasons it out: a v1.6 file whose debts failed to map
  must report *"no debts"* so the user can stop. Measured in `p9.ts` — the damaged file's third (null)
  debt row is correctly absent from the count. What `C-7` asks for is an ADDITIONAL clause, not a
  different count.
- **`comparisonTakeaway`'s backstop at `compareStrategies.ts:130` is live code, not dead.** Planted
  `return ''` in its place and `compareStrategies.test.ts:137` red: `expected "These two clear your debts
  in a different order.", got ""`. The docblock's claim that `differs` can be true with every branch
  skipped is correct.
- **`PaidOffArchive`'s share total under-claiming for a `null` amount is deliberate and documented**
  (`celebrationSelectors.ts:20` — *"`null` when it was never captured (don't fabricate)"*), and the row
  renders a bare *"Paid off"* for it. The defect in `C-4` is the opposite case: a REPAIRED amount is `0`,
  not `null`, so this correct path is never entered.
- **`history.tsx`'s and `BnplCalendarSection`'s `new Date(\`${iso}T00:00:00\`)` is a LOCAL-time parse and
  preserves the day.** Measured across four dates including a DST boundary and a year end — `DAY
  PRESERVED` on every one. ⚠️ **Measured in ONE timezone only**: I could not move `TZ` in this shell
  (`process.getTimezoneOffset()` stayed at `240` under both `TZ=Pacific/Kiritimati` and
  `TZ=Pacific/Midway`), so this is a spec argument plus one datapoint, not a matrix. The class belongs to
  **S2 (dates)** and I am handing it across rather than claiming it closed.
- **`paywall.tsx`'s `STATIC_PLANS` cannot reach a device.** `:70-76`'s comment claims it and the code
  keeps it: the static list renders only where no SDK is attached, and a package-load failure on device
  shows an error+retry. I read the branch, did not execute it — a purchase harness is auditor D's.
- **`compareStrategies.ts` still produces no dollar figure.** `assert(!('interestSaved' in cmp))` at
  `compareStrategies.test.ts:105` passes, and the takeaway is asserted free of `/\$|interest|cheaper|save/i`
  at `:104`. `D59`'s deliberate omission is intact.
- **The `'row-figures'` claim table itself is correct** — it is only unwired. `mayClaim` returned exactly
  the right answer (`false`) in every probe I ran against it (`p1`, `p2`, `p4`, `p8`). ⛔ **`C-1` is not a
  bug in `trustSelectors.ts`**, and a fix that edits that file has fixed nothing.
