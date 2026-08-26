# S1 · AUDITOR C — the money screen, goals, and the store/selector layer

**Pinned:** `bc29dfe`, branch `v1.7-dev`.
**Surface:** `money.tsx` · `store.ts` (partial → full read) · `planSelectors.ts` · `guardianSelectors.ts` (+test) · `journeySelectors.ts` · `components/entities/*.tsx` (8) · `packages/core/engine/recommendedActions.ts` · `testExpenseReserve.ts`
**Bar:** blocker + major.

## Result

**4 blockers · 2 majors.**

| # | severity | one line |
|---|---|---|
| 2 | **blocker** | "Every balance is cleared" ships on Today and Progress over debts the app could not read — the guard exists only on `money.tsx` |
| 3 | **blocker** | Today’s "Undo" reverts the WHOLE store to a snapshot taken earlier in the session, destroying every unrelated edit since |
| 4 | **blocker** | Two one-tap money moves share ONE `cycleTopUp` record with ONE `goalId`; their undos teleport money between goals and invent it |
| 5 | **blocker** | Money’s `converting` flag is set once and never cleared, so the next debt added silently deletes an unrelated bill |
| 1 | **major** | The grouped Expenses list enumerates categories instead of partitioning, so an uncategorised bill renders nowhere while still being reserved |
| 6 | **major** | An over-funded goal’s row understates what the user has saved, under a hero that states it correctly |

⚡ **Three of the four blockers are the same shape:** a piece of state that is correct for the one flow it
was written for, reused by a second flow that arrived later — `intentRollback` (3), `cycleTopUp` (4),
`converting` (5). None of them is a wrong calculation; each is a **scope** that outlived its occasion.

⚡ **All six were found by changing values and printing them, not by reading.** Every finding below
carries the output of a script run against the real modules under `apps/rn` with `npx tsx`.

## Sweep — blocker + major

### 1. The grouped Expenses list ENUMERATES categories instead of partitioning the list, so a bill with no `category` is rendered nowhere — while still being reserved from every paycheck — **major**

**User-facing consequence:** Once a user has 8 or more expenses, any expense carrying no `category` disappears completely from the Expenses tab — it cannot be seen, edited or deleted — yet the hero on that same screen keeps counting its money in "recommended each paycheck".

**Mechanism.** `apps/rn/src/app/(tabs)/money.tsx:642`:

```
const groups: BillGroup[] = BILL_CATEGORY_ORDER.map((category) => {
  const items = recur.filter((e) => e.category === category);
```

The section list is built by mapping over the seven known categories and pulling matching rows, then `.filter((g) => (searching ? g.data.length > 0 : g.count > 0))` at `money.tsx:658`. Nothing collects the remainder. `once` (`money.tsx:640`) only catches `recurrence === 'one-time'`, so a **recurring** expense outside the enumeration lands in no bucket at all. The identical construction repeats in `categoryBreakdown` at `money.tsx:594`, so the "where it goes" receipt sheet drops it too.

`category` is **schema-optional**: `packages/core/storage/debtPlannerStorage.ts:28` — `category?: RequiredExpenseCategory;`. No migration backfills it — `grep -n "category" apps/rn/src/data/migrations.ts` returns **zero hits**.

**Measured** (script run under `apps/rn` via `npx tsx`; nine monthly bills, one with no `category` key, put through the real `runMigrations` and then through the section builder copied structurally from `money.tsx:627-660`):

```
after runMigrations, e9.category = undefined
e9 has own "category" key? false
grouped mode active? true
rows RENDERED in grouped list : e1, e8, e2, e3, e4, e5, e6, e7
rows MISSING from grouped list: e9
one-time bucket picks up e9? false
categoryBreakdown (receipt sheet) covers: e1, e8, e2, e3, e4, e5, e6, e7
sum of ALL recurring amounts  : 945
sum of rows the list can show : 836
```

And the money is still held — `selectRecurringSmoothed` (the hero's source, `money.tsx:588`) counts it:

```
WITH the uncategorised bill → monthlyTotal = 945 · perPaycheckTotal = 436.15
WITHOUT it                  → monthlyTotal = 836 · perPaycheckTotal = 385.85
```

So the hero reads *"of $436 recommended each paycheck"* over rows that sum to $386, with a $50/paycheck difference the user has no way to locate. Search does not rescue it: `match` is applied **inside** each category bucket (`money.tsx:644`, applied to `items` inside each category bucket), so the row is absent from the search results too.

**Confidence:** measured for the mechanism and the arithmetic; **read-only inference** for the doors below.

**Reachability.** No in-app v1.7 writer omits `category` — `ExpenseSheet.tsx:38` defaults `editing?.category ?? 'other'` and always writes it (`ExpenseSheet.tsx:71`), `FirstDebtOrBillStep.tsx:97` writes `category: 'other'`, `AffordabilityCard.tsx:76,86` write `'discretionary'`. The reachable doors are the **import** paths, which perform no field-level validation:
- `apps/rn/src/data/readBackup.ts:104` — `case 'raw-v17': return migrated(kind, parsed);` — an arbitrary JSON store goes straight to `runMigrations` with no per-field check.
- `apps/rn/src/data/readBackup.ts:106-113` — the `v16-file` path maps `requiredExpenses` through `mapLegacyStore` as a **straight key copy** (`mapLegacyStore.ts:74` — `requiredExpenses: 'requiredExpenses'`) with no category backfill. v1.6's own schema also had `category?` optional (`git show origin/v1.6-dev:lib/storage/debtPlannerStorage.ts`, line 24) and its list item rendered `category ?? "other"` (`origin/v1.6-dev:components/RequiredExpenses/ExpenseListItem.tsx:23`) — i.e. v1.6 *displayed* the absent case correctly and v1.7 does not. ⚠️ v1.6's own writer did set it (`origin/v1.6-dev:lib/hooks/useRequiredExpenses.ts:19,58` — `useState<RequiredExpenseCategory>("other")`), so a bill created *in v1.6* carries one; the `?? "other"` fallback is evidence its authors expected pre-v1.6 blobs without it, and that is a **carried premise, not a measurement** — I could not check pre-v1.6 storage from this repo.

⚡ The durable point is not which door: **the list is not exhaustive by construction.** It enumerates a menu rather than partitioning its input, which is the failure mode this project has already paid for six times. A trailing "everything not matched above" group makes the class impossible.

**Would anything catch it?** No. `grep -rln "BILL_GROUPING_THRESHOLD" apps/rn/src --include=*.test.*` returns nothing, and no test in the tree exercises the grouped branch at all. There is no assertion anywhere that the rendered rows are a partition of `requiredExpenses`.

---

### 2. "Every balance is cleared" ships on Today and Progress over debts the app could not read — the guard exists only on Money — **blocker**

**User-facing consequence:** After restoring a backup whose debt balances are blank, the Today tab shows a celebration card reading *"You're debt-free — Every balance is cleared"* and an invitation to a wealth-building product, and Progress shows a *"DEBT-FREE / Every balance paid off"* hero, over debts that are still owed — permanently, because the repaired `0`s never change back.

**Mechanism.** This is `.11.8` / `.11.10`'s blocker, on the two screens that were never given the guard.

The whole app contains exactly **two** trust guards. `grep -rn "pendingDataRepairs" apps/rn/src/app apps/rn/src/components/plan apps/rn/src/store --include=*.tsx --include=*.ts` (non-test) returns 10 lines; the only two that gate a claim are:
- `apps/rn/src/app/(tabs)/money.tsx:360` — `const unreadDebts = store.pendingDataRepairs.some((r) => r.entity === 'debt' && r.kind !== 'recovered');`
- `apps/rn/src/app/(tabs)/money.tsx:955` — `unreadGoals`

The third hit, `apps/rn/src/app/(tabs)/index.tsx:237`, is the *repairs card's own* data — it renders the list, it gates nothing.

Meanwhile the same claim is made from two unguarded conditions:

1. **Today.** `apps/rn/src/store/planSelectors.ts:294-299`:
```
export function selectPlanState(store: DebtStore, allocation: Allocation | null): PlanState {
  if (!allocation) return 'no-paycheck';
  const liveDebts = store.debts.filter((d) => d.balance > 0);
  if (liveDebts.length === 0) return store.debts.length > 0 ? 'debt-free' : 'no-debts';
```
   consumed at `apps/rn/src/app/(tabs)/index.tsx:141` and `:303` (`const isDebtFree = planState === 'debt-free';`), rendering `GraduationBanner` (`index.tsx:313`) and `FreedomNextChapterCard` (`index.tsx:319`). The banner's text, `apps/rn/src/components/plan/GraduationCards.tsx:28-31`:
   > **"You're debt-free"** / *"Every balance is cleared. Your paycheck now builds your future instead of paying down the past."*

   ⚡ That is the *same sentence* `money.tsx:340-361` refuses to render, quoted almost word for word.

2. **Progress.** `apps/rn/src/app/(tabs)/progress.tsx:161` — `if (!view.hasDebts)` → `:164` `if (paidOff.length > 0)` → `:173` **"Every balance paid off"**. `hasDebts` is `liveDebts.length > 0` (`apps/rn/src/store/payoffSelectors.ts:89`) — the same `balance > 0` test, with no repairs conjunct.

**Measured.** Script run under `apps/rn` with `npx tsx`, feeding the real `runMigrations` a store with two debts whose `balance` is `''` and `'  '` (S1.1 ⓪-1's exact input), then evaluating `money.tsx:360-361`'s guard and `selectPlanState` on the *same* migrated store:

```
repairs recorded: [{"e":"debt","id":"d1","f":"balance","k":"lost"},{"e":"debt","id":"d2","f":"balance","k":"lost"}]
balances after migration: Visa=0, Car=0

[Money tab]  unreadDebts = true · active = 0 · paidOff = 2
[Money tab]  hero renders "Every balance cleared"? -> false

[Today tab]  selectPlanState = "debt-free"
[Today tab]  isDebtFree -> GraduationBanner + FreedomNextChapterCard render? -> true
```

⛔ **One tab apart, on one store, the app both refuses and makes the claim.** S1.1's ⓪-1 fix is doing its job — `kind` is `lost`, not `recovered` — and it closed the leak on the one screen that reads it.

**Confidence:** measured for Today (`selectPlanState` printed on a real migrated store). Read-only inference for Progress: I read the condition chain (`progress.tsx:161,164` · `payoffSelectors.ts:89` — `hasDebts: liveDebts.length > 0`) and there is no `pendingDataRepairs` reference anywhere in `progress.tsx`, but I did not render it.

**Permanence.** `acknowledgeDataRepairs` (`apps/rn/src/store/store.ts:762-763`) marks rather than empties, so the record survives — but nothing on Today or Progress reads it, acknowledged or not. The repaired `0` balances are permanent until the user retypes every one, so both screens keep celebrating for the life of the install. This is the "once-ever moment lost forever" / "false statement about their own money" row of the severity table.

**Would anything catch it?** No. No test references `selectPlanState` together with `pendingDataRepairs`; `grep -rn "GraduationBanner" apps/rn/src` returns three hits, all in `index.tsx` and `GraduationCards.tsx`, none in a test.

⚡ **The remedy is not a third copy of the conjunct.** Three call sites already disagreed once (M9). The guard wants one owner — a `selectPortfolioIsTrustworthy(store)` (or `selectPlanState` returning `'debt-free-unverified'`) that every celebration reads — because the class recurs each time a new screen learns to say "cleared".

---

### 3. Today's "Undo" reverts the WHOLE store to a snapshot taken earlier in the session — every unrelated edit made since is destroyed — **blocker**

**User-facing consequence:** After logging a payment (or a payday roll), everything the user does afterwards — debts added, goals created, bills entered, strategy changed — is silently and permanently deleted the moment they tap **Undo** on a Today card whose text promises only to undo the payment.

**Mechanism.** `apps/rn/src/store/store.ts:622` snapshots the **entire** `DebtStore`:

```
intentRollback: { store: s.store, kind: 'log-payment' },
```

and `apps/rn/src/store/store.ts:639` restores the whole thing:

```
undoIntentAction() {
  set((s) => (s.intentRollback ? { store: s.intentRollback.store, intentRollback: null } : {}));
},
```

`apps/rn/src/store/store.ts:611` does the same for `'payday-landed'`. `grep -n "intentRollback" apps/rn/src/store/store.ts` returns **7** lines and they are the complete set: two writers (`:611`, `:622`), two clearers (`:639`, `:642`), the type (`:95`) and the initial value (`:296`). **No other action clears it** — not `addDebt`, not `addGoal`, not `importStore`, not `reset`.

The affordance is not transient in practice. `apps/rn/src/app/(tabs)/index.tsx:612` renders it whenever `intentRollback && activeAck === 'intent'`, with the copy at `index.tsx:617-619` — *"Payment logged — I updated your balance."* / *"Payday landed — I rolled your plan forward to this paycheck."* — and buttons **Undo** (`:623`) and **Keep** (`:624`). Nothing times it out; it survives tab changes and every store mutation for the rest of the session.

**Measured.** Real `createDebtStore()`, real actions, run under `apps/rn` with `npx tsx`:

```
start                       {"debts":["Visa:1000"],"goals":[],"expenses":[],"strategy":"snowball"}
after logManualPayment      {"debts":["Visa:800"],"goals":[],"expenses":[],"strategy":"snowball"}
  intentRollback pending?   log-payment
after 4 unrelated edits     {"debts":["Visa:800","Car loan:8000"],"goals":["Emergency fund"],"expenses":["Rent"],"strategy":"avalanche"}
  intentRollback STILL set? log-payment
after tapping Undo          {"debts":["Visa:1000"],"goals":[],"expenses":[],"strategy":"snowball"}
```

⛔ A debt, a goal, a bill and a strategy change — **gone**, with no confirm and no re-undo.

**The loss is durable, not just on-screen.** `apps/rn/src/store/persistence.ts:88-90` — `store.subscribe((state, prev) => { if (state.store === prev.store) return; … })` — so replacing `state.store` schedules a write, and the truncated store is persisted.

**Confidence:** measured (store layer). The card's reachability is read-only inference from `index.tsx:238-255,612`: `activeAck` can *hide* the card behind a higher-priority ack (`data-repairs`, `milestone`) but nothing clears the underlying snapshot, so the card returns once those are acknowledged.

**Would anything catch it?** **No — and the existing test is rule 2's archetype.** `apps/rn/src/store/storeActions.test.ts:436-437`:

```
s.getState().undoIntentAction();
eq(s.getState().store.debts.find((x) => x.id === 'd0')!.balance, 5000, 'undoIntentAction: restores the pre-payment balance');
```

It calls `logManualPayment` at `:430` and `undoIntentAction` at `:436` **with nothing in between**, and asserts one field of one debt. It picks the single member of the class that works, and it passes with this defect entirely present. Nothing anywhere asserts that an intervening edit survives.

**Second, narrower door on the same mechanism — a restore is not protected either.** `importStore` (`store.ts:814`) does not clear `intentRollback`, so: log a payment → More → restore a backup (`apps/rn/src/components/more/BackupSheets.tsx:164`, `apps/rn/src/hooks/use-cloud-backup.ts:159`, `apps/rn/src/components/DataResetScreen.tsx:92`, `apps/rn/src/app/_layout.tsx:228`) → return to Today → **Undo** replaces the freshly-restored portfolio with the pre-restore one. Same for `reset()` (`store.ts:370`), which leaves the snapshot intact so "Reset all data" is quietly reversible by a button that claims to be about a payment. ⚠️ These two are read-only inference — I measured the edit-loss sequence, not the import sequence.

⚡ **The observation and the remedy are separable.** The observation is measured. The remedy is *not* "clear `intentRollback` on every other action" — that is a list, and this project has been bitten six times by lists. Either the snapshot is invalidated by any store write that is not the intent's own (one check in the `set` wrapper at `store.ts:278-288`, where `bound` and `refuse` already sit), or the undo is narrowed to the fields the intent actually touched. The card's copy names one debt; the action should too.

---

### 4. Two independent one-tap money moves share ONE `cycleTopUp` record with ONE `goalId` — their undos teleport and invent goal balances — **blocker**

**User-facing consequence:** A premium user who both takes the Guardian's "hold your line" top-up and covers a purchase from savings in the same cycle ends up with wrong balances on their savings goals — money moved out of one goal is handed back to a different one, or handed back twice so a goal shows more than was ever in it — and there is no way to undo it back.

**Mechanism.** `applyTightTopUp` (`apps/rn/src/store/store.ts:766-789`) maintains a **single** cycle record that *accumulates an amount* but stores only *the most recent* `goalId`:

```
const prior = s.store.cycleTopUp?.forCycle === forCycle ? s.store.cycleTopUp.amount : 0;
…
cycleTopUp: (() => {
  const total = Math.round((prior + amount) * 100) / 100;
  return total > 0 ? { forCycle, amount: total, goalId } : { forCycle, amount: total };
})(),
```

Two unrelated flows write to it, and each has its own undo:

| flow | apply | undo | undo reads |
|---|---|---|---|
| Guardian tight top-up | `apps/rn/src/app/(tabs)/index.tsx:354` | `index.tsx:358` | the **store** — `selectAppliedTopUp(engineStore)` at `index.tsx:174` |
| Affordability cover-a-tight-dip | `apps/rn/src/components/plan/AffordabilityCard.tsx:87` | `AffordabilityCard.tsx:95` | **component state** — `applied.cover` |

⛔ The comment at `index.tsx:356-357` — *"Reversed exactly as the affordability card reverses its cover… One mechanism, two callers"* — is the premise, and it is false. It is one **record** for two callers, and the record cannot represent two sources.

**Measured — variant A: money teleports between goals.** The two selectors pick from different preference lists (`selectTightTopUp` → `pickTopUpGoal(store.goals, gap, ['savings','emergency'])` at `guardianSelectors.ts:295`; `selectAffordability` → `pickTopUpGoal(store.goals, gap, ['savings'])` at `guardianSelectors.ts:415`), and `pickTopUpGoal` (`guardianSelectors.ts:530-539`) always returns the **largest-balance** funded goal — so once the first draw shrinks that goal, the second flow picks a different one:

```
Guardian selectTightTopUp  picks: S1
…then affordability cover  picks: S2  <-- a DIFFERENT goal

start                        | goals: S1=$100 S2=$60 | cycleTopUp: undefined
after Guardian $70 from S1   | goals: S1=$30  S2=$60 | cycleTopUp: {"forCycle":"2026-09-09","amount":70,"goalId":"S1"}
after cover     $50 from S2  | goals: S1=$30  S2=$10 | cycleTopUp: {"forCycle":"2026-09-09","amount":120,"goalId":"S2"}

selectAppliedTopUp -> {"amount":120,"goalId":"S2","goalName":"S2","holdsLine":false}
after tapping Undo           | goals: S1=$30  S2=$130 | cycleTopUp: {"forCycle":"2026-09-09","amount":0}

S1 still short by              : $70
net change across both goals   : $0
```

The aggregate conserves, which is why nothing notices — but **$70 has moved from S1 into S2**, permanently. `cycleTopUp.amount` is now `0`, so `selectAppliedTopUp` returns `null` (`guardianSelectors.ts:253`) and there is nothing left to undo.

**Measured — variant B: $50 created from nothing, with only ONE goal.** No second goal needed; the two undos simply both fire:

```
start                               | S1 = $500 | cycleTopUp: undefined
Guardian moves $70                  | S1 = $430 | cycleTopUp: {"amount":70,"goalId":"S1"}
Affordability card covers $50       | S1 = $380 | cycleTopUp: {"amount":120,"goalId":"S1"}
selectAppliedTopUp -> {"amount":120,…}   <- the Guardian "Undo" offers $120
user taps the Guardian Undo         | S1 = $500 | cycleTopUp: {"amount":0}
user then taps the card Undo        | S1 = $550 | cycleTopUp: {"amount":-50}
```

The card's `undo()` (`AffordabilityCard.tsx:92-98`) reads `applied.cover` from React state, never the store, so the Guardian having already reversed it is invisible to it. Its own comment — *"a negative top-up restores the goal + clears the cycle top-up"* — is a second carried premise: it does not clear the record, it subtracts from a shared accumulator. `cycleTopUp.amount` lands at **−50**, and `appliedTopUp()` (`guardianSelectors.ts:277-278`) clamps that with `Math.max(0, …)`, so the corruption is silent.

**Confidence:** measured at the store + selector layer with the real `createDebtStore()` and the real `selectAppliedTopUp`, calling `applyTightTopUp` with exactly the arguments the two call sites pass. Read-only inference for the UI sequencing (both cards live on Today; the affordability card's undo depends on its component state surviving, which it does until the card unmounts).

**Would anything catch it?** No. `apps/rn/src/store/storeActions.test.ts:140-173` covers `applyTightTopUp` in two blocks and **every call uses the single goal `'g0'`** — rule 2 again, one member of the class. The over-draw case at `:151-152` asserts the goal clamps at `0` and deliberately does **not** assert `cycleTopUp.amount`, which after that sequence is `100,299` against $200 actually moved. The A3.5 block at `:160-172` applies once and undoes once. Nothing anywhere asserts the invariant that would kill this class: **Σ`cycleTopUp` must equal what actually left the goals.**

**Related, same root, not separately counted:** `applyTightTopUp` records the full `amount` even when the goal cannot supply it (`Math.max(0, currentAmount − amount)` clamps the goal but not the record), and even when `goalId` matches no goal at all — in both cases `appliedTopUp()` then credits the cushion (`selectTightTopUp`, `guardianSelectors.ts:292`; `selectAffordability`, `guardianSelectors.ts:399`) with money that never moved.

---

### 5. Money's `converting` flag is set once and never cleared, so the NEXT debt the user adds silently deletes an unrelated bill — **blocker**

**User-facing consequence:** A user who taps "Move to Debts" on an expense, changes their mind and closes the form, and then adds any ordinary new debt without leaving the Debts section, loses that expense from their plan entirely — it is deleted with no confirmation, no message and no undo, and their per-paycheck reserve silently drops by its amount.

**Mechanism.** `apps/rn/src/app/(tabs)/money.tsx:240-250`:

```
const [converting, setConverting] = useState<string | null>(null);
useEffect(() => {
  if (!convertFrom) return;
  setConverting(convertFrom.id);
  openEditor({ … });
  onConvertHandled?.();
}, [convertFrom?.id]);
```

`grep -n "setConverting" apps/rn/src/app/(tabs)/money.tsx` returns **exactly one line — `:243`**, the setter. Nothing ever resets it: not closing the sheet, not saving, not adding another debt. `onConvertHandled` (`money.tsx:124`) clears the *parent's* `convertFrom`, which is a different piece of state and is what stops the effect re-firing — it does not touch `converting`.

The flag is then handed to every subsequent sheet, `money.tsx:322` and `money.tsx:431`:

```
<DebtSheet … convertingExpenseId={converting ?? undefined} … />
```

and `DebtSheet` branches on its presence, `apps/rn/src/components/entities/DebtSheet.tsx:212-214`:

```
if (isEdit && editing) store_.getState().updateDebt(editing.id, fields);
else if (convertingExpenseId) store_.getState().convertExpenseToDebt(convertingExpenseId, fresh);
else store_.getState().addDebt(fresh);
```

`convertExpenseToDebt` (`apps/rn/src/store/store.ts:488-507`) unconditionally does `requiredExpenses: s.store.requiredExpenses.filter((e) => e.id !== expenseId)`. It does not check that the id is the one the user is converting, or that the sheet was opened by a conversion at all.

⚠️ The window is bounded but ordinary: `DebtsSection` unmounts when the user switches to Bills or Goals (`money.tsx:118-135` renders exactly one section), which resets the flag. It survives everything done **within** the Debts section — and "Move to Debts" *navigates the user to the Debts section*, with the Add row sitting in the list footer (`money.tsx:414` / `money.tsx:808`).

**Measured** (real `createDebtStore()`, calling exactly what `DebtSheet.tsx:213` calls):

```
1. start
   expenses: Car payment, Rent
   debts   : (none)
…
5. after adding "New Visa"
   expenses: Rent
   debts   : New Visa

   -> "Car payment" ($420/mo) is GONE from the plan. The user added a debt.
```

**Second consequence, same flag — the debt is stored wrong.** `convertExpenseToDebt` is a deliberately reduced copy of `addDebt`: it reproduces the date stamping but not `normalizeBnplInstallment`, and its own comment says why — *"a conversion never arrives in that shape"* (`store.ts:491-493`). That premise is true of a real conversion and false of the plain add this flag misroutes. Measured on the same BNPL input (4 payments of $50):

```
addDebt              -> balance = 200   (normalizeBnplInstallment ran: 50 x 4)
convertExpenseToDebt -> balance = 0     (no normalisation)
```

A BNPL debt added while the stale flag is set is stored with **balance $0** — which drops it out of `view.order` and into the `PAID OFF` section on the screen the user just added it from. `convertExpenseToDebt` also skips `recordDriftBaseline`, which `addDebt` (`store.ts:384-407`) applies.

**Confidence:** measured at the store layer for both consequences. The UI sequence (flag persists across sheet open/close within the section) is read-only inference from the single `setConverting` site and React's state model — I did not render the component.

**Would anything catch it?** No. `grep -rn "convertingExpenseId" apps/rn --include=*.test.* --include=*.spec.*` returns nothing. `convertExpenseToDebt` is tested in `apps/rn/src/store/storeActions.test.ts` only for the happy path with a matching id; nothing asserts that a plain add does not delete an expense.

**Third, smaller, same file — the conversion prefill drops `recurrence`.** `money.tsx:246` prefills `recurrence: convertFrom.recurrence`, but `DebtSheet.tsx:120` seeds that field from `editing?.recurrence ?? 'monthly'` — `editing` is `null` on a conversion, so the prefilled value is discarded while `name`, `minimumPayment` and `dueDate` (seeded from `seed = editing ?? prefill` at `DebtSheet.tsx:112`) are honoured. Converting a **quarterly** or **annual** obligation therefore files its `amount` as a **monthly** minimum. Rated `major` on its own; it is visible in the form's Recurrence picker before the user saves, so it is a misleading default rather than a silent write.

---

### 6. An over-funded goal's row understates what the user has saved, one inch under a hero that states it correctly — **major**

**User-facing consequence:** A user whose savings has passed its target sees that goal's row report the target as the amount saved — "$1,000 saved" over a pot holding $5,000 — while the hero directly above it correctly totals $5,500.

**Mechanism.** `apps/rn/src/app/(tabs)/money.tsx:1028-1029`:

```
amount={funded ? formatWhole(g.targetAmount) : formatCurrency(Math.max(0, g.targetAmount - g.currentAmount))}
amountSuffix={funded ? ' saved' : ' left'}
```

The `funded` branch prints **`targetAmount`** under the label `saved`. Those two are equal only when the goal sits exactly on its target; above it the row states the smaller number and calls it the amount saved. The hero at `money.tsx:977-978` sums `currentAmount`, so the same screen carries both figures.

Over-funding is not exotic and nothing prevents it: `GoalSheet.submit()` (`apps/rn/src/components/entities/GoalSheet.tsx:101-104`) validates each field independently and **never compares them** —

```
const targetN = parseAmountField(target);
const currentN = parseOptionalAmount(current);
if (targetN == null) return setError('Enter a target amount.');
if (currentN == null) return setError('Enter what you have saved so far, or leave it blank.');
```

`applyTightTopUp` with a negative amount (the undo at `index.tsx:358` and `AffordabilityCard.tsx:95`) can also push `currentAmount` past the target — see finding 4.

**Measured** (real `formatWhole` / `formatCurrency` / the real parsers, running the expressions from the cited lines):

```
GoalSheet accepts target '1000' -> 1000 | current '5000' -> 5000
  no check that currentAmount <= targetAmount exists in GoalSheet.submit()

HERO  : $5,500 · saved of $3,000 target · 183% funded
ROW   : Emergency Fund   $1,000 saved   (actually has $5000) · progress prop = 5
ROW   : Vacation         $1,500 left   (actually has $500) · progress prop = 0.25
```

**Confidence:** measured for the arithmetic and the strings.

**Not a defect, checked:** `progress={pct}` is passed unclamped at `money.tsx:1031` (here `5`), but `ListRow` clamps it — `apps/rn/src/components/ui/ListRow.tsx:134`, `width: \`${Math.min(100, Math.max(0, progress * 100))}%\`` — so the bar does not overflow. The hero bar clamps too (`money.tsx:1047`, `HeroProgressBar`). Only the row's `amount` string is wrong.

**Would anything catch it?** No test renders a goal row. `grep -rn "amountSuffix" apps/rn/src --include=*.test.*` returns nothing.

---

## Measured, and NOT a defect — recorded so the next pass does not re-open them

**1. The "vanishing debt row" class is genuinely closed by S1.1's ⓪-3.** I fed eight hostile `balance` shapes through the real `runMigrations` and then through `selectPayoffView` + `money.tsx:224`'s `paidOff` filter. Every one repairs to `0`, records a `lost` repair, and lands in `paidOff` — none vanishes from both lists:

```
number NaN     -> balance = 0 | repair: lost | active: false | paidOff: true
Infinity       -> balance = 0 | repair: lost | active: false | paidOff: true
string "abc"   -> balance = 0 | repair: lost | active: false | paidOff: true
missing key    -> balance = 0 | repair: lost | active: false | paidOff: true
null           -> balance = 0 | repair: lost | active: false | paidOff: true
object         -> balance = 0 | repair: lost | active: false | paidOff: true
array          -> balance = 0 | repair: lost | active: false | paidOff: true
bool true      -> balance = 0 | repair: lost | active: false | paidOff: true
```

⚠️ This is also the load-bearing premise of finding 2: every one of these lands in `paidOff` with `active` empty, so the *only* thing between such a store and a debt-free celebration is the repairs conjunct — which two of the three screens do not have.

**2. `useAppStore` + `useActiveStore` in one component is NOT the [R4] mix.** `AmortizationView.tsx:45` reads with `useAppStore` and holds no `useActiveStore`; `DebtSheet.tsx:108-109` and `ImportDebtsSheet.tsx:44` read `currentDate`/`isPremium` with `useAppStore` while writing with `useActiveStore`. This *looks* like the defect `ExpenseSheet.tsx:28-30`'s comment describes, and it is not: `apps/rn/src/store/useAppStore.ts:18` is `useStore(useActiveStore(), selector)` — the hook resolves through the same context, so both halves address the same store under a sandbox. Its own docstring prescribes exactly this pairing (`useAppStore.ts:15`). ⛔ Do not re-file this.

**3. `unreadGoals` correctly omits the `kind !== 'recovered'` conjunct that `unreadDebts` carries.** `money.tsx:955` vs `money.tsx:360`. The justification at `money.tsx:355-359` — *"each conjoins an evidence check on the repaired VALUE, and a recovered value is not `0`"* — is a carried premise, and a recovered value **can** be `0` (`readMoney` returns `{value: 0, repair: 'recovered'}` for the string `'0'`). But it holds here for a different reason than the comment gives: `GoalSheet.submit()` parses the target with `parseAmountField` (`GoalSheet.tsx:101`), which returns `null` unless `n > 0` (`packages/core/utils/amountField.ts:42`), so `targetAmount === 0` is not reachable from the app at all. The conjunct is sound; **its stated mechanism is not.** Recording that so a future edit does not "fix" the parser and silently reopen it.

**4. `packages/core/engine/recommendedActions.ts` clamps overrides correctly.** `buildActiveRecommendedActions` does `Math.min(override ?? maxAmount, maxAmount, remainingCapacity)` (`:114`), so a `recommendationOverrides` entry cannot exceed the goal's remaining need or the available cash, and `amount <= 0` is skipped (`:115`). A missing goal falls back to `item.amount` (`:76`). No blocker/major.

**5. `mintDebtIds` does not collide on a bulk CSV import.** `ImportDebtsSheet.apply()` (`:75-81`) mints all ids up front from the pre-import list, and `mintDebtIds` (`apps/rn/src/store/debtIds.ts:29-38`) accumulates each minted id into the claimed set before minting the next. It returns exactly `count` distinct ids; ids are deliberately minted at apply rather than at preview.

**6. `apps/rn/src/store/guardianSelectors.test.ts` is a real guard, not a token.** It carries the reversed-order control for the `pickTopUpGoal` rule (`:139-148` — *"without this, every case above picks the LAST goal, so a 'take the last one' implementation passes the whole block"*) and a two-emergency-goal fixture for M9 (`:186-196`). It is wired: `apps/rn/src/testing/runAppTests.ts:23` imports it, and all 37 `src/store/*.test.ts` files are imported by that runner (verified by diffing the directory listing against the import list). `npm run test:app` is **green** at `bc29dfe`.

**7. `packages/core/engine/testExpenseReserve.ts` asserts the invariant it exists for.** It checks the partition (`sum(ALL_BUCKETS) === discretionary(r)`) in five separate states, the cross-cycle conservation both directions (`:135-145`), the clamp against the floor (`:112-117`), the fully-covered-bill row that must not vanish (`:83-90`), and the calendar-vs-UTC occurrence ordering (`:150-157`). It runs via `test:regression` (`packages/core/testing/runRegressionTests.ts:2`), which this round is forbidden from running — so I confirmed the wiring, not a green result.

## Could not determine

- **Whether a real pre-v1.6 blob carries a category-less `requiredExpense`** (finding 1's most likely door). v1.6's writer always set one (`origin/v1.6-dev:lib/hooks/useRequiredExpenses.ts:19`); its reader defends against absence (`origin/v1.6-dev:components/RequiredExpenses/ExpenseListItem.tsx:23`). That defence is evidence, not proof, and nothing in this repo holds pre-v1.6 storage. The `raw-v17` import path (`readBackup.ts:104`) is a definite door regardless.
- **Whether Progress renders its "Every balance paid off" hero under repaired balances.** I traced the condition (`progress.tsx:161,164` → `payoffSelectors.ts:89`) and confirmed `pendingDataRepairs` appears nowhere in `progress.tsx`, but I measured `selectPlanState` only, not `selectPayoffView` + `selectPaidOffDebts` end to end on Progress.
- **The exact UI sequencing of finding 4's two undos.** Both cards live on Today and the store-layer corruption is measured; whether `AffordabilityCard`'s component state survives long enough in practice is a device/render question.
- **`selectPaydayGuardian` also computes `debtFree = liveDebts.length === 0` with no repairs conjunct** (`guardianSelectors.ts:607`), so the premium Guardian re-frames to cushion-vs-savings on the same repaired store. It does not print "every balance cleared", so I did not raise it separately — but it is a third unguarded consumer of the same test and belongs in finding 2's fix.

## Swept and found clean — BY PATH

Read in full at the blocker/major bar this round. The findings above are the exceptions; everything else in these files I read and did not find a blocker or major in.

| path | note |
|---|---|
| `apps/rn/src/app/(tabs)/money.tsx` | **all 1137 lines.** Findings 1, 2, 5, 6 are here. `DebtsSection`, `DebtRow`, `MisfiledHint`, `useAutoOpen`, `BillsSection`, `BillSearch`, `BillGroupHeader`, `LivingReserve`, `GoalsSection`, `HeroProgressBar`, `MoneyHero`, `AllocationBar` all read |
| `apps/rn/src/store/store.ts` | **all 842 lines — the `partial` mark is discharged.** Findings 3 and 5 are here. Every action read: hydrate/save/reset, paycheck, all four debt writers, expenses, living expenses, mark-paid/defer/deferability, payday/rollover/intents, prefs, all ten acknowledgers, `applyTightTopUp`, `setExpenseReserveContribution`, `importStore`, and the `bound`/`refuse` `set` wrapper |
| `apps/rn/src/store/planSelectors.ts` | **all 374 lines, first sweep.** Finding 2's mechanism is `selectPlanState`. The rest — `sumCategory`, `selectExtraToDebt`, `selectDeployedToSavings`, `selectDeployedBeforeDebt(+GoalId)`, `selectLiquidCushion`, `selectDiscretionary`, `selectSpendable`, `selectHeldReserve`, `selectDebtFreeDate`, `selectDebtFreeBand`, `selectRequiredRows`, `selectOnPlanStreak(+Label)`, `requiredRowKey`, `rowHandledNow`, `daysBetween`, `bucketRequiredRows`, `selectRecommendedActions`, `heroFraming`, `selectPlanSummary` — clean |
| `apps/rn/src/store/guardianSelectors.ts` | **all 692 lines.** Finding 4 is `applyTightTopUp`'s two consumers. `selectReadFreshness`, `selectCalibrationScore`, `selectGuardianProofOfWork`, `selectRiskNotification`, `selectRiskAcknowledgment`, `selectReserveRelease`, `selectBillsAttestation`, `selectReserveWalkback`, `selectTrialConversion`, `selectAppliedTopUp`, `appliedTopUp`, `selectTightTopUp`, `selectBnplBetweenPaycheck`, `selectAffordability`, `selectWindfallSplit`, `roundBucketsToWhole`, `pickTopUpGoal`, `addPaychecks`, `selectSaveForItOptions`, `selectPaydayGuardian` — read |
| `apps/rn/src/store/guardianSelectors.test.ts` | **all 275 lines, first sweep.** Clean — see "NOT a defect" #6 |
| `apps/rn/src/store/journeySelectors.ts` | all 74 lines. `selectJourneyTotals`' four sums, the clamp, and the branch-backward/answer-forward `line`. Clean; the ratchet holds |
| `apps/rn/src/components/entities/AddObligationSheet.tsx` | all 112 lines. `OBLIGATION_CLAUSE`, `CHOICES`, the a11y label composition. Clean |
| `apps/rn/src/components/entities/AmortizationView.tsx` | all 167 lines, first sweep. `monthLabel` clamping, the `INITIAL_ROWS` windowing, the negative-amortization branch, `AmortizationPane`. Clean |
| `apps/rn/src/components/entities/DebtSheet.tsx` | all 374 lines, first sweep. Finding 5's second and third parts are here. The BNPL derive/validate branch, `submit`'s three routes, `onTypeChange`, `handleRescan`, `remove`'s confirm, the prefill-vs-convert copy split, `footerAccessory` |
| `apps/rn/src/components/entities/ExpenseSheet.tsx` | all 119 lines. Always writes `category` (`:38`, `:71`); the trial-field validation and clearing; `remove` confirms. Clean |
| `apps/rn/src/components/entities/GoalSheet.tsx` | all 200 lines. Finding 6's upstream (no cross-field validation). `paceGoverns`, `canBeTheEmergencyFund`, the name dedupe, the pace-parser choice, the `readOnly` type control — all read and clean |
| `apps/rn/src/components/entities/ImportDebtsSheet.tsx` | all 155 lines, first sweep. Check-then-confirm, the skipped-row report, ids-at-apply, the cancel-is-silent branch. Clean |
| `apps/rn/src/components/entities/LivingExpenseSheet.tsx` | all 72 lines, first sweep. Clean |
| `apps/rn/src/components/entities/LogPaymentSheet.tsx` | all 65 lines, first sweep. `parseAmountField` (not `parseFloat`), the over-payment `note`-not-`error` treatment. Clean |
| `packages/core/engine/recommendedActions.ts` | all 130 lines, first sweep. Clean — see "NOT a defect" #4 |
| `packages/core/engine/testExpenseReserve.ts` | all 157 lines, first sweep. Clean — see "NOT a defect" #7 |

Read in support, not swept — cited only, and not claimed as coverage: `apps/rn/src/app/(tabs)/index.tsx` (the ack stack + the debt-free branch), `apps/rn/src/app/(tabs)/progress.tsx` (the debt-free hero condition), `apps/rn/src/components/plan/GraduationCards.tsx`, `apps/rn/src/components/plan/AffordabilityCard.tsx:60-100`, `apps/rn/src/store/payoffSelectors.ts:78-95`, `apps/rn/src/store/obligationForm.ts`, `apps/rn/src/store/debtIds.ts`, `apps/rn/src/store/persistence.ts:86-105`, `apps/rn/src/data/readBackup.ts`, `apps/rn/src/data/migrations.ts` (`readMoney` / `repairMoneyFields`), `apps/rn/src/store/storeActions.test.ts`, `apps/rn/src/testing/runAppTests.ts`, `packages/core/utils/amountField.ts`, `packages/core/storage/debtPlannerStorage.ts`, `apps/rn/src/components/ui/ListRow.tsx`, `apps/rn/src/store/useAppStore.ts`.
