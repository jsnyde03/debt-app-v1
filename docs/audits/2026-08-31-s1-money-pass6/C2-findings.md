# C2 findings — pass 6, S1 money

**Lane C2** — `apps/rn/src/components/` minus plan/money/payday: payoff, progress, entities,
onboarding, more, premium, and the UI primitives.

**Coverage: 74 of 74 files read** (`READ-C2.txt`). Every file in the manifest was opened and read in
full.

| id | severity | origin | one line |
|---|---|---|---|
| C2-1 | major | stale-read | the strategy takeaway says "the order they clear in changes" when it does not |
| C2-2 | major | stale-read | the payoff chart labels a $2,500 gridline "$3k" and a $7,500 one "$8k" |
| C2-3 | **blocker** | fix-churn | converting an autopay bill to a debt drops the flag; the debt is then reported as owed |
| C2-4 | minor | stale-read | the [R4] comment on the data-reset screen states a guard that cannot fire there |
| C2-5 | minor | stale-read | `ListRow`'s progress clamp is NaN-blind and reads like a validity guard |
| C2-6 | minor | first-look | the web date control can write a blank due date the CSV door refuses |
| C2-7 | minor | stale-read | "CASH FLOW · NEXT 1 PAY CYCLES" |
| C2-8 | minor | stale-read | a comment calls the green What-If overlay "dashed gold" |

**By origin:** stale-read 6 · fix-churn 1 · first-look 1 · neighbour 0 · instrument 0 · off-surface 0.
This lane holds no `instrument` files. Its four `neighbour` files (`SaveFailedBanner`,
`CloudBackupSheet`, `OnboardingLayout`, `JourneyRingCanvas`) were read and are clean.

## C2-1 — the strategy takeaway tells the user "the order they clear in changes" when it does not

**Severity:** major · **Origin:** `stale-read`
**File:** `apps/rn/src/components/payoff/compareStrategies.ts:114-120` (rendered by `StrategyCompare.tsx`)

**User-facing consequence.** On the payoff tab's snowball-vs-avalanche card, a user whose two
strategies clear the *same debts in the same sequence* — differing only in the month the LAST one
lands — is told the sequence changes. That is the one sentence on the card whose whole job is to
tell them what actually differs, and it names a difference that is not there.

**The measurement.** Driven through the real module with `tsx` (one store, printed):

```
input  snowballClears = [Visa@5, Car loan@30]   avalancheClears = [Visa@5, Car loan@28]
       snowball curve clears m30, avalanche curve clears m28
out    differs=true  finishSooner=2  firstWinSooner=0
       snowball order   Visa > Car loan
       avalanche order  Visa > Car loan          <- IDENTICAL
       TAKEAWAY: "Avalanche finishes 2 months sooner, and the order they clear in changes."
```

**Mechanism (hypothesis).** The first-win chain is

```ts
if (firstWinSooner != null && > 0)      … snowball sooner
else if (firstWinSooner != null && < 0) … avalanche sooner
else if (parts.length > 0)              parts.push('and the order they clear in changes');
```

The third arm is reached whenever `firstWinSooner === 0` **or** is `null`, and it asserts a fact
(*order changed*) that it never checks. `differs` is true here for a different reason —
`s.debtFreeMonth !== a.debtFreeMonth` — so the arm inherits a truth it did not earn. The comparable
data the module already holds (`clears.map(c => c.name).join('|')`) is never consulted at this line.

**Which member of the class the test picked.** `compareStrategies.test.ts:84-93` is the only case that
reaches this arm with a non-empty `parts`, and its fixture is
`snowballClears = [a@5, big@53]` vs `avalancheClears = [big@51, a@12]` — an order that genuinely
reshuffles, and a `firstWinSooner` of `-7` that routes to the *second* arm, not the third. The arm
that fires the false sentence is asserted on only through `startsWith(...)`, which stops before it.
No test in the tree runs a same-order/different-date portfolio.

**Remedy — UNVERIFIED.** Gate the third arm on the name sequence actually differing, e.g. compare
`s.clears.map(c => c.name).join('|') !== a.clears.map(c => c.name).join('|')` and fall through to
nothing (or to "the same order, a different finish") when it matches. Not verified: this changes what
the sentence says in the `firstWinSooner === 0 && same order` case, and I did not check the e2e
`strategy-compare.spec.ts` assertions against the replacement.

## C2-2 — the payoff chart's y-axis labels a $2,500 gridline "$3k" and a $7,500 gridline "$8k"

**Severity:** major · **Origin:** `stale-read`
**File:** `apps/rn/src/components/payoff/TrajectoryChart.tsx:80-84` (`formatAxisBalance`), reached from
`:199` (`niceStep`) and rendered at `:429-437`

**User-facing consequence.** For any portfolio whose largest plotted balance falls in **(7000, 8750]**,
the payoff chart's balance axis is drawn at 0 / 2 500 / 5 000 / 7 500 / 10 000 and **labelled**
`$0 / $3k / $5k / $8k / $10k`. The gridline the user reads their curve against is $500 lower than the
number printed beside it — and the error is in the direction that flatters, so a curve sitting just
under the "$3k" line is actually just under $2,500 and vice versa at the top. This is the only numeric
scale on the card.

**The measurement.** `formatAxisBalance` and `niceStep` lifted verbatim and driven over the real
gridline set (`for (let v = 0; v <= niceMax + 1; v += step)`, `:239-240`):

```
rawMax=7200  step=2500 niceMax=7500
  0->$0   2500->$3k   5000->$5k   7500->$8k
  ⚠ label "$3k" sits on the 2500 gridline (off by +500)
  ⚠ label "$8k" sits on the 7500 gridline (off by +500)
rawMax=8000  step=2500 niceMax=10000  -> same two mislabels
rawMax=8700  step=2500 niceMax=10000  -> same two mislabels
rawMax=3400  step=1000  -> every label exact
rawMax=12000 step=4000  -> every label exact
rawMax=34000 step=10000 -> every label exact
```

**Mechanism (hypothesis).** `niceStep`'s ladder contains one non-round step — `2500` — and
`formatAxisBalance` abbreviates with `Math.round(v / 1000)` at whole-thousand precision. Every other
member of the ladder (1000, 2000, 4000, 5000, 10000, 20000, 50000, 100000) produces gridlines that are
whole thousands, so the abbreviation is lossless for them and lossy only for the 2500 rung. The band is
narrow but ordinary: `max/2000 > 3.5` and `max/2500 <= 3.5`, i.e. a total balance between $7,000 and
$8,750.

**Which check did not see it.** `scripts/check-money-format.ts:41` exempts this **whole file** with the
stated reason *"`formatAxisBalance` abbreviates to `$4k` for axis ticks — a genuinely different job, not
a duplicate. Verified at T6.4"*. The exemption is about the *shape* being allowed; nothing anywhere
asserts the abbreviation names the value it is placed on. There is no unit test for either function —
`grep -rn 'formatAxisBalance\|niceStep'` over the tree returns only the definition, the one call site,
and that exemption comment. Both are module-private in a `.tsx`, so they are unreachable from the node
runner, which is the same structural reason `endPillWidth` and `formatMonths` were extracted out of this
very file.

**Remedy — UNVERIFIED.** Either drop `2500` from `niceStep`'s ladder, or give `formatAxisBalance` a
one-decimal form when `v % 1000 !== 0` (`$2.5k`). Not verified: `$2.5k` is one character wider and
`styles.yLabel` (`:629`) is a fixed `width: PAD.l - 6` = 32 pt at `fontSize: 10` with `numberOfLines: 1`,
so the wider label may truncate; and dropping the rung changes gridline counts for every portfolio in
the band. Extracting both functions to a tested module is the shape this file has already used twice.

## C2-3 — converting an AUTOPAY bill into a debt drops the autopay flag, and the new debt is then reported as owed money the user already paid

**Severity:** blocker · **Origin:** `fix-churn`
**File:** `apps/rn/src/components/entities/DebtSheet.tsx:127-130` (state seeding) with
`apps/rn/src/app/(tabs)/money.tsx:268` (the convert prefill)

**User-facing consequence.** A user with a bill on autopay taps "Move to Debts" (3.7.A10.2's mis-file
rescue). The debt that lands in `debts` has `isAutopay: false`. From the next cycle on the payday
check-in and the required-actions list treat it as a manual payment the user still owes: after the due
date `isAutopayPresumedPaid` no longer suppresses it, so the app asks them to pay — and shows as
outstanding — money their bank already took. The bill's autopay setting is not offered anywhere on the
convert screen, so nothing tells them it was dropped.

**The measurement.** Two sites, read:

```
money.tsx:268   prefill: { name, minimumPayment: amount, dueDate, recurrence }
                                                       ^ no isAutopay, though RequiredExpense has it
DebtSheet:127   const [autopay, setAutopay] = useState(editing?.isAutopay ?? false);
                                              ^^^^^^^ editing, not seed
DebtSheet:115   const seed = editing ?? prefill ?? null;
```

`packages/core/storage/debtPlannerStorage.ts:23` — `RequiredExpense.isAutopay?: boolean`;
`:81` — `Debt.isAutopay?: boolean`. Both sides carry it; neither hop passes it.
`packages/core/debt/reconcileAutopay.ts:17-22` — `isAutopayPresumedPaid` requires
`item.isAutopay === true`; `deriveRequiredActionView.ts:84-124` is its consumer, and
`:137` branches the whole required-action row on `view.isAutopay`.

**Mechanism (hypothesis).** Two independent omissions on one path, either of which alone would lose the
flag. The DebtSheet half is a **surviving member of an already-fixed class**: the file's own comment at
`:122-125` records `S1.5.3 [B4, third consequence]` — *"seeds from `seed`, not `editing`"* — for
`recurrence`, having measured that reading `editing?` there filed a quarterly bill's amount as a monthly
minimum. `recurrence` (`:126`) was changed; `autopay` (`:127`), `remainingPayments` (`:128`),
`scheduledPaymentAmount` (`:129`) and `bnplProvider` (`:130`) were left on `editing?`. `name`, `balance`,
`minimumPayment`, `apr`, `dueDate` and `type` (`:116-121`) all read `seed?`.

**Reachability of the rest of the class.** `autopay` is the reachable one today. The three BNPL fields
are latent: the other prefill producer is `parseStatementText`, whose `ParsedStatement`
(`packages/core/scan/parseStatementText.ts:11-22`) declares only `name`/`balance`/`minimumPayment`/
`apr`/`dueDate`, so nothing currently supplies them. `type` reads `seed?.type` (`:121`), so the moment
any producer prefills a BNPL, the sheet will switch to the BNPL form and discard all three of that
form's fields silently.

**Remedy — UNVERIFIED.** Change `:127-130` to read `seed?.` and add `isAutopay: convertFrom.isAutopay`
to `money.tsx:268`. Not verified: `commit()`'s non-BNPL `fields` (`:245-247`) deliberately writes
`remainingPayments: undefined` etc., and I did not check whether seeding those from a prefill can
produce a `type: 'debt'` record carrying BNPL fields on a subsequent edit. The `autopay` half is the
low-risk one and can be taken alone.

## C2-4 — the [R4] comment on the data-reset screen states a guard that cannot fire there

**Severity:** minor · **Origin:** `stale-read`
**File:** `apps/rn/src/components/DataResetScreen.tsx:106-113`

**User-facing consequence.** None directly — this is a stale premise on a recovery screen, and the class
the brief names (*"a comment is a carried premise and decays like a carried number"*). It matters because
a reader deciding whether a new write on a pre-onboarding screen needs declaring will get the wrong
answer from it.

**The measurement.** The comment reads:

> `[R4] Declared, for the same reason the launch-time offer is: this fires while the store is a
> not-yet-onboarded default, which is precisely the audience a demo sandbox is admitted for, so an
> **undeclared write here would be refused**.`

`apps/rn/src/store/realWriteGuard.ts:135-137`:

```ts
export function refuseRealStoreWrite(prev, next): boolean {
  if (sandboxDepth === 0) return false;      // <- the first line
  if (realWriteAllowed) return false;
```

The veto is gated on `sandboxDepth > 0`, i.e. **a sandbox subtree being mounted** — not on the store
being a not-yet-onboarded default. `DataResetScreen`'s own docblock (`:35-37`) records that it *"renders
above the theme provider"*, so no `StoreProvider` and therefore no sandbox scope exists while it is up.
`allowRealStoreWrite` at `:109` is a no-op there.

**The counter-example is on the same screen.** `DataResetScreen:131` hosts `ImportBackupSheet`, whose
`replace()` (`more/BackupSheets.tsx:162-166`) calls `appStore.getState().importStore(found.store)`
**undeclared** — and it works. If the comment's premise held, the second recovery door on the same
screen would silently restore nothing.

**Mechanism (hypothesis).** The comment describes the *audience* rule ("the audience a demo sandbox is
admitted for") while the code implements a *mount* rule (`sandboxDepth`). The two coincide in the demo
and diverge here.

**Remedy — UNVERIFIED.** Either correct the comment to say the wrap is defensive, or — if the intent is
that a pre-onboarding default store really should be write-vetoed — that is a change to
`refuseRealStoreWrite`, and `ImportBackupSheet` would then need declaring too. I did not check what else
writes to `appStore` before onboarding completes.

## C2-5 — `ListRow`'s progress clamp cannot clamp `NaN`, and it reads exactly like a guard that does

**Severity:** minor · **Origin:** `stale-read`
**File:** `apps/rn/src/components/ui/ListRow.tsx:134`

**User-facing consequence.** None reachable today — both producers guard their divisor. Reported because
it is the brief's *"a check that cannot fail reads exactly like a check"* class on the primitive every
money row uses, and because the two guards live in the CALLERS rather than here, so the next caller
inherits nothing.

**The measurement.**

```ts
width: `${Math.min(100, Math.max(0, progress * 100))}%`
```

`Math.max(0, NaN)` is `NaN`; `Math.min(100, NaN)` is `NaN`; the style becomes `width: "NaN%"`.
`Math.max(0, Infinity)` is `Infinity` → `Math.min(100, Infinity)` is `100`, so the ±Infinity ends are
covered and only `NaN` is not.

**Reachability, traced rather than assumed.** `grep -rn 'progress={'` over `apps/rn/src` returns exactly
two call sites, and both guard:

```
money.tsx:574  !balanceUnread && !originalUnread && debt.originalBalance && debt.originalBalance > 0
               ? 1 - view.currentBalance / debt.originalBalance : undefined
money.tsx:1309 targetUnreadable || savedUnreadable ? undefined : pct
money.tsx:1225 const pct = g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0;
```

So `0/0` cannot arise from either. **The defect is that the clamp is not the thing that makes that
true**, and nothing in this file says so.

**Mechanism (hypothesis).** `Math.max`/`Math.min` propagate `NaN` rather than rejecting it; the
expression was written as a range clamp and reads as a validity clamp.

**Remedy — UNVERIFIED.** `Number.isFinite(progress) ? … : 0` at the top of the branch, or drop the bar
entirely on a non-finite value the way both callers already drop it on an unreadable figure. Not
verified: I did not check whether `width: "NaN%"` renders as 0 or as "unset" on RN-Web vs iOS, so the
visible symptom of the un-fixed state is unknown.

## C2-6 — the web date control can write a BLANK due date, on a field the CSV door refuses outright

**Severity:** minor · **Origin:** `first-look` (`DateField.web.tsx`) / `fix-churn` (`DebtSheet.tsx`)
**File:** `apps/rn/src/components/ui/DateField.web.tsx:42-47`, consumed by
`apps/rn/src/components/entities/DebtSheet.tsx:394` and `ExpenseSheet.tsx:111`

**User-facing consequence.** On the web surface, clearing the native `<input type="date">` emits `''`,
which the field forwards verbatim: `onChange(e.target.value)`. `DebtSheet.submit` (`:198-251`) and
`ExpenseSheet.submit` (`:55-85`) validate name, balance, minimum and APR and **never validate
`dueDate`**, so `dueDate: ''` reaches the store. `parseLocalDate('')` is
`new Date('T00:00:00')` = Invalid Date (`packages/core/utils/localDate.ts:27-29`), so every downstream
due-date computation on that obligation is `NaN`.

**The measurement.** Three doors into `dueDate`, and only one checks it:

```
debtCsv.ts:229-233   errors.push(`Row N: dueDate "…" is not a date — use YYYY-MM-DD`)
                     errors.push(`Row N: dueDate is required.`)              <- REFUSED
DebtSheet.tsx:236-248  fields = { …, dueDate, … }                            <- unchecked
ExpenseSheet.tsx:69-81 fields = { …, dueDate, … }                            <- unchecked
```

The native `DateField.tsx` cannot produce `''` — `onPicked` returns early on `dismissed`/no date
(`:74`) and otherwise writes `toLocalISO(picked)`. So this is the **web half of a platform split
diverging on the value contract the two files claim to share** (`DateField.web.tsx:8`: *"Same contract,
same `YYYY-MM-DD` value"*).

**Reachability, stated honestly.** iOS is the shipping surface and cannot reach it. Web is the
Playwright suite, `dist/`, and 3.5.7's public marketing embed. I did not drive a browser to confirm
which of them exposes an add/edit sheet, so "a user reaches this" is unproven; "the code path exists and
is unguarded" is measured.

**Mechanism (hypothesis).** The `.web` file was written against the happy path of the native input
format and never against the empty-value state the DOM control has and the picker does not.

**Remedy — UNVERIFIED.** Validate `dueDate` in both submits with the shape `debtCsv.ts` already uses,
rather than in the field — the field is shared and `ExpenseSheet:119` deliberately passes an empty
`fullChargeDate` as a legitimate "not set yet" state, so a non-empty guard inside `DateField` would
break that.

## C2-7 — "CASH FLOW · NEXT 1 PAY CYCLES"

**Severity:** minor · **Origin:** `stale-read`
**File:** `apps/rn/src/components/progress/CashFlowSection.tsx:69-71`

**User-facing consequence.** The section header on Progress interpolates a count into a hard-plural noun:
`CASH FLOW · NEXT {cycles.length} PAY CYCLES`. At a count of one it reads *"NEXT 1 PAY CYCLES"*.

**The measurement.** The count is not fixed. `payoffSelectors.ts:20` defaults `maxCycles = 5`, and
`packages/core/timeline/buildMultiCycleTimeline.ts:179-191` fills the rest in a loop that **breaks**:

```ts
for (let i = 1; i < maxCycles; i++) {
    try { projNextDate = getNextPaycheckDate({ … }); }
    catch { break; }
```

A throw on the first iteration leaves `cycles.length === 1`. The component's own guard is
`if (cycles.length === 0) return null` (`:62`), so 1 renders. Everything else on this card pluralises
correctly (`plural()` in `compareStrategies`, `hiddenCount === 1 ? 'month' : 'months'` in
`AmortizationView`, `debts.length === 1 ? 'debt' : 'debts'` in `PaidOffArchive`), so the pattern is
established and this is the site that skipped it.

**Mechanism (hypothesis).** The string was written when the count was believed constant at 5.

**Remedy — UNVERIFIED.** `NEXT ${cycles.length} PAY ${cycles.length === 1 ? 'CYCLE' : 'CYCLES'}`. Not
verified: I did not establish which `payCycleConfig` makes `getNextPaycheckDate` throw, so I cannot
state the trigger, only that the branch exists and is reachable by construction.

## C2-8 — `TrajectorySkiaChart`'s What-If comment says "dashed gold"; the overlay is green

**Severity:** minor · **Origin:** `stale-read`
**File:** `apps/rn/src/components/payoff/TrajectorySkiaChart.tsx:142-143`

**User-facing consequence.** None — a carried premise, reported under the brief's *"a comment is a
carried premise and decays like a carried number"* rule, because this file's whole contract is that the
wrapper owns the colours and it is the only place the reader can learn what a stroke means.

**The measurement.** The comment: *"What-If overlay — the 'with extra' curve: **dashed gold**"*. The
stroke: `color={palette.simulated}` (`:145`). The value, in the wrapper:
`TrajectoryChart.tsx:347` — `simulated: c.accent.success, // green "with extra" overlay — distinct from
the gold plan finish`. Gold is `palette.lineTo` / `palette.core` / `palette.glow`, which are the
**plan's** finish. The legend agrees with the code and not the comment: `TrajectoryChart.tsx:570`
renders the "With extra" swatch as `c.accent.success`.

**Mechanism (hypothesis).** The overlay was gold before the plan's endpoint bead took that colour; the
palette key was renamed and recoloured and the comment above the consumer was not.

**Remedy — verified as a text change only:** say "dashed green" (or drop the colour and name the palette
key). No behaviour is involved.

