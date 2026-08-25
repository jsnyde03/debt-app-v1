# B — MONEY AND DATA REPAIRS

**Subject:** `3dc3c22..4877d90`, four files:
`apps/rn/src/data/migrations.ts` · `apps/rn/src/components/plan/DataRepairsCard.tsx` ·
`apps/rn/src/app/(tabs)/money.tsx` · `apps/rn/src/store/persistenceLifecycle.test.ts`

**Method.** Read the diff, then each file whole, then every consumer of the values it produces:
`packages/core/engine/allocatePaycheck.ts` (both goal rungs + the two EF rungs),
`packages/core/engine/recommendedActions.ts`, `packages/core/debt/selectActiveRecommendedActions.ts`,
`apps/rn/src/store/selectors.ts`, `apps/rn/src/data/migrationAudit/invariants.ts`, the two goal-creation
doors (`SaveForItSheet.tsx`, `GoalSheet.tsx`) and both render sites of the repairs card.

⚠️ **Not executed.** Per the brief no suite or gate was run; every claim below is from reading. Where a
result depends on running (`npm run test:app`), it is marked.

---

## B-1 · `migrations.ts` — the pace stand-down loop (`migrations.ts:177-215`)

### `DEFECT`

**Breaking input: a goal whose `priorityPerPaycheck` arrives as a numeric STRING.**
`{ id:'g0', name:'Roof', type:'savings', targetAmount:4000, currentAmount:0, priority:true, priorityPerPaycheck:'200' }`
— or `'1,200'`, the comma form this same file says users type (`apps/rn/src/data/migrations.ts:46-47`).

The loop keys on the repair RECORD, not on whether the value was lost:

- `apps/rn/src/data/migrations.ts:202` — `if (rep.entity !== 'goal' || rep.field !== 'priorityPerPaycheck') continue;`
- `apps/rn/src/data/migrations.ts:81` — a record is pushed whenever `readMoney` returns `repaired: true`.
- `apps/rn/src/data/migrations.ts:50` — **`readMoney` returns `repaired: true` on the SUCCESSFUL string
  parse**: `if (Number.isFinite(parsed)) return { value: parsed, repaired: true };`. The lost case is a
  different return, four lines down (`apps/rn/src/data/migrations.ts:52`).

So `'200'` is recovered correctly to `200` at `migrations.ts:79`, and then
`migrations.ts:205-214` **un-prioritises the goal and deletes the recovered cap**:

```
goal.priority = false;
rep.field = 'the per-paycheck amount could not be read, so it is no longer funded ahead of your debt — …';
delete goal.priorityPerPaycheck;
```

Three consequences, all wrong for this input:

1. **A sinking fund the user signed off on stops funding ahead of debt.** `allocatePaycheck.ts:629`
   skips it (`goal.priority !== true`), and `selectActiveRecommendedActions.ts:74` drops it from the
   pre-debt recommended surface. Before this diff the same blob kept `priority: true` and
   `priorityPerPaycheck: 200` and allocated exactly as chosen — so on this input the change is also a
   **regression against the base commit**.
2. **The recovered value is destroyed, permanently.** `delete` at `migrations.ts:214` is irreversible and
   the second migration pass records nothing (`migrations.ts:78` skips `undefined`), so nothing ever
   re-detects it.
3. **The user is told a falsehood about their own money** — the sentence at `migrations.ts:207-209` says
   the amount "could not be read" when it was read.

**Reachability.** `apps/rn/src/data/legacyBridge/mapLegacyStore.ts:71-83` maps `goals: 'goals'` with
"no transform beyond `JSON.parse`", and `packages/core/storage/debtPlannerStorage.ts:102` shows v1.6
carried `priorityPerPaycheck`. The JSON-restore door hands `runMigrations` the user's file verbatim
(`migrations.ts:219-220`). The string-recovery path is not hypothetical — this file exists because of it,
and the cluster's own fixture uses it for a sibling field (`persistenceLifecycle.test.ts:386`,
`targetAmount: '4,000'`, asserted recovered at `persistenceLifecycle.test.ts:451`). That fixture proves
a recovered string still produces a repair record; the loop then cannot tell it from a lost one.

**The fix the code needed** is to branch on the repaired VALUE, not on the record: the harm the docblock
describes (`migrations.ts:187-190`) is specific to the fail-silent `0`, and only `migrations.ts:52`
produces it.

### Other findings on this hunk-group

**(a) `priority: false` does not stop the goal being funded ahead of debt when its `type` is
`'emergency'` — and the sentence says it does.** The §2.9 rung the docblock cites requires
`goal.type === "savings"` (`packages/core/engine/allocatePaycheck.ts:629`), but the starter-EF rung at
`packages/core/engine/allocatePaycheck.ts:605` funds the goal `allocatePaycheck.ts:598` finds by `type === "emergency"`
**before the snowball** and consults neither `priority` nor `priorityPerPaycheck`. For an emergency-type
goal the stand-down changes nothing about the plan while the card asserts *"it is no longer funded ahead
of your debt"* (`migrations.ts:208`). `GoalSheet` lets a user switch a goal's `type`
(`apps/rn/src/components/entities/GoalSheet.tsx:26,50`), so `type:'emergency' + priority:true` is
reachable. Nothing in the repo would notice.

**(b) The stand-down is not retroactive, and cannot be.** Any store hydrated-and-saved by a build between
P6.8.9.7.2 (when goals were added to `repairMoneyFields`, `migrations.ts:170-176`) and this commit holds
`priorityPerPaycheck: 0` with `priority: true`. `0` is a finite number, so `readMoney` returns
`repaired: false` (`migrations.ts:45`), no record is pushed, the loop never fires, and the goal stays
**uncapped forever** at `allocatePaycheck.ts:632`. Same for any store that legitimately holds a `0` pace.
Nothing detects `priority === true && priorityPerPaycheck === 0`.

**(c) The `else` branch's comment is accurate but the branch still mutates.**
`migrations.ts:211` — *"Not prioritised, so there was no cap to lose and nothing changes about the plan."*
Correct: both readers gate on `priority === true` (`allocatePaycheck.ts:632` reads the pace only inside
the `priority !== true` continue at `:629`; `recommendedActions.ts:80` checks it explicitly). The
`delete` at `:214` is therefore harmless today, but it is a silent data deletion outside the branch the
comment scopes.

### What is right, and is preserved

- **Purity holds.** The loop mutates only objects `repairMoneyFields` created (`migrations.ts:76`,
  `next = { ...row }`) and repair records built locally (`:82`). The `!Array.isArray` fallback pushes
  `id: ''` (`:71`) so the `find` at `:203` cannot match it, and non-object rows are returned by reference
  (`:75`) but never produce a record. The deep-frozen-input oracle `sourceNotMutated`
  (`apps/rn/src/data/migrationAudit/invariants.ts:115-118`) still passes.
- **Idempotence holds.** Pass 2 sees `priorityPerPaycheck` absent → `migrations.ts:78` skips it → no
  record → the loop is a no-op, so `idempotent` (`invariants.ts:147`) and `repairsAreNotRepeated`
  (`invariants.ts:159`) both stay green, exactly as the comment at `migrations.ts:243-245` claims.
- **The strict `=== true` at `migrations.ts:205` mirrors the engine's strict `!== true`**
  (`allocatePaycheck.ts:629`, `:699`; `recommendedActions.ts:80`;
  `selectActiveRecommendedActions.ts:74`). A truthy-but-not-`true` `priority` is already not prioritised
  downstream, so the migration's check does not under-match.
- **"No longer funded ahead of your debt" is precisely worded for a savings goal.** A stood-down goal is
  still funded — by the post-debt rung at `allocatePaycheck.ts:695-719`, **uncapped** — but only after
  the debts are satisfied. The copy says "ahead of", not "no longer funded", and that distinction is
  correct.

### Newly possible, unchecked

`apps/rn/src/data/migrationAudit/invariants.ts:76` — `MONEY_FIELDS` is
`['balance','minimumPayment','apr','amount']` and `moneyKeepsItsType` walks
`debts`/`requiredExpenses`/`livingExpenses` only (`invariants.ts:93-95`). **The audit corpus cannot see
goals at all**, so no invariant in that suite would notice a goal money field going wrong, before or
after this change.

---

## B-2 · `DataRepairsCard.tsx` — the copy rewrite + docblock (`DataRepairsCard.tsx:58-83`)

### `DEFECT`

**Breaking environment: the state that produces the message.** The card's docblock claims it has replaced
a generic, unfollowable instruction with a real route:

> `apps/rn/src/components/plan/DataRepairsCard.tsx:69-72` — *"…was also unfollowable for a pace… The
> recovery route is named in that line instead of promised generically here."*

The route it names is `apps/rn/src/data/migrations.ts:209` — *"set it up again from Can I afford it?"*.
**That route is blocked by an existing guard, for exactly this store.** The stand-down deliberately keeps
the goal (`migrations.ts:193-194`: *"the goal keeps its name, target and balance"*), and the only door to
`SaveForItSheet` refuses a name that already exists:

- `apps/rn/src/components/plan/AffordabilityCard.tsx:53-58` —
  `if (store.goals.some((g) => g.name.trim().toLowerCase() === effName.toLowerCase())) { setNameError(...); return; }`
- `apps/rn/src/components/plan/AffordabilityCard.tsx:245` is the sole render of `SaveForItSheet`, and
  `openSaveSheet` is the sole path into it, so the guard is unavoidable.

A user following the card's instruction for their goal "Roof" gets *"You already have a goal named
"Roof" — rename it above."* The card never says to rename or delete the surviving goal first, and
`GoalSheet` cannot restore the pace (verified: it writes only `{name, targetAmount, currentAmount, type}`
at `apps/rn/src/components/entities/GoalSheet.tsx:49-50`). **The one advertised recovery path for a cap
the app just removed is a dead end.**

If the user does rename first and re-runs the flow, `SaveForItSheet.tsx:101-109` calls `addGoal` with a
fresh `nextGoalId` — producing a **second** goal beside the stood-down one, both funded (the new one
before debt, the old one after, `allocatePaycheck.ts:695-719`). Nothing reconciles them.

### What is right

- **The reversed-consequence fix is real and correct.** The old blanket sentence asserted the amounts
  "are showing as $0, so your plan is leaving them out" — false for a pace, which repaired to `0` and
  meant *uncapped* at `packages/core/engine/allocatePaycheck.ts:632`. The replacement at
  `DataRepairsCard.tsx:74` and `:80-83` says only "your plan is running without it", which is true of a
  repaired balance, a repaired bill amount and a stood-down pace alike.
- **The a11y label and the visible text were changed together** (`:74` and `:80-82`), so the screen-reader
  string and the rendered string do not diverge.
- **"Can I afford it?" is a real, visible label**, not invented copy: `AffordabilityCard.tsx:130,154,173`
  render the eyebrow `CAN I AFFORD IT?`, and the card is on Today
  (`apps/rn/src/app/(tabs)/index.tsx:434`) beside the repairs card
  (`apps/rn/src/app/(tabs)/index.tsx:556-557`). It is gated on `guardian`, not on premium
  (`apps/rn/src/app/(tabs)/index.tsx:431`), so a free user can reach it.
- **`ENTITY_NOUN` stays exhaustive** (`DataRepairsCard.tsx:18-23`); nothing in the diff loosens it.

### Secondary

- **The unnamed-goal line reads badly.** `describe` falls back to `Your ${noun} list — ${field}`
  (`DataRepairsCard.tsx:31`), so a pace repair on a goal with an empty `name` renders *"Your savings goal
  list — the per-paycheck amount could not be read, so it is no longer funded ahead of your debt — set it
  up again from Can I afford it?"*. The sentence-as-`field` trick documented at `migrations.ts:197-199`
  assumes the named branch at `DataRepairsCard.tsx:32`.
- **The blanket sentence is now duplicated verbatim.** The group label at `:74` ends with the same
  sentence the footnote renders at `:80-82`, so VoiceOver reads it twice. Only observable on device.
- **`key={line}`** (`:86`) collides if two repairs describe identically — two unnamed goal pace repairs
  now produce the same string. Pre-existing shape, made slightly likelier by the sentence-`field`.

### Would anything catch a regression here?

**No.** `apps/rn/tests/e2e/data-recovery.spec.ts:97-100` asserts only the `data-repairs-ack` testID and
the debt NAME; no test anywhere asserts either sentence, and no fixture in the repo produces a goal-pace
repair on screen. The copy is entirely unpinned.

---

## B-3 · `money.tsx` — the `Funded` badge guard (`money.tsx:941-944`, `:980-995`)

### `SOUND-UNPINNED`

The change is correct and preserves everything the site did before.

**What it does.** `const funded = g.currentAmount >= g.targetAmount && !(unreadGoals && g.targetAmount === 0);`
(`apps/rn/src/app/(tabs)/money.tsx:995`) with
`unreadGoals = store.pendingDataRepairs.some(r => r.entity === 'goal')` (`:944`).

**Preservation (Q1).** The only inputs whose result changes are `unreadGoals === true && targetAmount === 0`.
Everything else — the `pct` bar (`:980`), `amount`/`amountSuffix` (`:1001-1002`), the row identity and both
handlers (`:1006-1007`) — is untouched, and a goal genuinely at its target keeps its badge while other
repairs pend, as the comment promises. `targetAmount === 0` cannot be created through either door:
`packages/core/utils/amountField.ts:38-43` (`parseAmountField`) returns `null` for zero, and both
`GoalSheet.tsx:37` and `AffordabilityCard.tsx` gate on it. So a zero target means a repair or an
import, and the guard cannot fire on a legitimate goal.

**Reads the right store.** `useAppStore` resolves through `useActiveStore` (`apps/rn/src/store/useAppStore.ts:18-20`),
so under a demo sandbox `unreadGoals` and `goals` (`:941`) come from the same store — no cross-store
mismatch. `pendingDataRepairs` is always present (`apps/rn/src/data/defaults.ts:44`), so `.some` cannot
throw. Selector returns a boolean → `Object.is` equality is fine, no render churn.

**Environment (Q2).** Nothing date-, locale- or platform-specific; a boolean and a numeric comparison.
Both themes render the same because the badge is simply absent, not restyled.

### Comment does not describe the code — two claims

1. `money.tsx:991` — *"Scoped to `pct === 0` deliberately"*. **The code scopes to `g.targetAmount === 0`.**
   `pct` (`:980`) is also `0` whenever `currentAmount` is `0` against a healthy target, so the comment
   names a strictly wider condition than the line implements. (The code is the safer of the two; the
   comment is what is wrong.)
2. `money.tsx:992-993` — *"The suppression is about **this** number being unreadable, not about the store
   being generally suspect."* **The code is exactly the store-being-suspect version.** `unreadGoals`
   (`:944`) matches on `entity === 'goal'` only — not `r.id === g.id`, not `r.field === 'targetAmount'`.
   After B-1 it is also `true` for a *pace* repair on an unrelated goal, which has nothing to do with any
   target. The precise check would be
   `.some(r => r.entity === 'goal' && r.id === g.id && r.field === 'targetAmount')`.

### The same rule is not applied one line up — the hero still congratulates

`money.tsx:966-976` is unguarded:

```
const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);   // :967
const overall = totalTarget > 0 ? totalSaved / totalTarget : 0;      // :968
…caption={`${Math.round(overall * 100)}% funded`}                    // :975
```

Two goals — one healthy (`$0 of $1,000`) and one whose `targetAmount` repaired to `0` while its
`currentAmount` read fine at `$1,500` — give `totalSaved 1500 / totalTarget 1000` → the hero reads
**"$1,500 saved of $1,000 target · 150% funded"** with a full bar (`:1024` clamps the bar, not the
caption). That is the same "congratulate over money the app could not read" failure the docblock at
`:981-982` names, on the largest number on the screen. The row beneath it also renders
`formatCurrency(Math.max(0, 0 - 1500))` → **"$0.00 left"** (`:1001`), which is not congratulation but is
not truthful either.

### Nothing would catch a regression

Grepped `apps/rn/src` and `apps/rn/tests`: **no test or e2e spec references the `Funded` badge, the
goals hero, or `unreadGoals`.** Deleting the guard would be invisible to every suite.

**Missing test:** an app-layer case that migrates
`{ goals: [{ id:'g0', name:'Roof', type:'savings', targetAmount:'abc', currentAmount:0 }] }` and asserts
the row is not badged Funded — and a second case asserting a healthy at-target goal still is, while an
unrelated goal repair pends. Only the second is even expressible without a render harness today, so a
`(tabs)/money` e2e is the honest home for it.

---

## B-4 · `persistenceLifecycle.test.ts` — the two allocation blocks (`:402-449`)

### `WEAK-TEST`

Both blocks are a genuine improvement on what they replace, and both would fail on the defect they name.
They nonetheless **pass with the shipped B-1 defect present**, and they do not pin the property the fix
most needed pinned.

**Assertion 1** — `persistenceLifecycle.test.ts:420-423`,
`toGoal === 0`, where `toGoal` sums `alloc.allocations` filtered on `goalId === 'g0'` (`:415-417`).
**What it measures:** the dollars the §2.9 pre-debt sinking-fund rung
(`packages/core/engine/allocatePaycheck.ts:627-637`) sends to the goal, plus anything the post-debt rung
(`:695-719`) has left over. Fixture: paycheck `'1000'`, one debt of `3000` (`:404-412`), no expenses.
**Would it fail on the defect?** Yes. Undo the migration loop and the goal keeps `priority: true` with
`priorityPerPaycheck: 0`; `allocatePaycheck.ts:632` turns `0` into `Infinity` and the §2.9 rung takes the
whole remainder before the snowball → `toGoal ≈ 900`, assert throws. **Not vacuous, and not a proxy** —
it is the allocation, exactly as the comment at `:400-402` claims.

**Assertion 2** — `persistenceLifecycle.test.ts:448`, `eq(toGoal, 200, …)`.
**What it measures:** that a *readable* pace still caps and still funds ahead of debt. This is the
preserved-property assert, and it does real work: it kills the over-fix "stand every priority goal down".

**Assertion 3** — `persistenceLifecycle.test.ts:414`, `assert(alloc !== null, '…guards a vacuous pass')`.
**This is a weaker control than its label claims.** `buildAllocation` returns `null` only when
`Number(store.paycheck.amount)` is non-finite/≤0 or `nextPaycheckDate` is missing
(`apps/rn/src/store/selectors.ts:43-44`), both of which the fixture sets at `:406`. It
proves the engine ran; it does **not** prove a goal in this fixture could have received money. The real
positive control is assertion 2 — a near-identical fixture where a goal does get `200` — and that one is
in a different block, funded through a *different rung*.

### Why `WEAK-TEST`: the naive over-fix passes, and so does the shipped defect

The fixture's corrupt goal carries **three** repairs at once — `targetAmount: '4,000'`,
`currentAmount: null`, `priorityPerPaycheck: 'Infinity'` (`:386`). So the coarse implementation
*"stand down any goal that has any repair record"* satisfies assertion 1, and the healthy fixture
(`:431-435`) has no repairs at all, so it satisfies assertion 2. **Nothing distinguishes "the pace was
unreadable" from "some field on this goal was unreadable" — which is precisely the axis B-1 gets wrong.**

The single fixture that would go red on B-1 is absent: a goal with `priority: true` and
`priorityPerPaycheck: '200'` (a recovered numeric string), asserting `toGoal === 200` and
`g.goals[0].priority === true`. The suite has no case where `readMoney` recovers a value and the caller
must **not** treat it as lost, even though `readMoney` has had that second return since it was written
(`apps/rn/src/data/migrations.ts:48-51`).

### Other observations

- **Ordering is honoured.** The comment at `:389-392` says the load-bearing asserts come first in a
  throw-based runner, and they do — the allocation blocks precede `eq(g.goals.length, 1, …)` at `:450`.
- **The removed asserts were correctly identified as false comfort.** `priorityPerPaycheck === 0` named
  the harmful value as acceptable, and `!== undefined` guarded a return `readMoney` cannot produce
  (`migrations.ts:44-53`). ⚠️ Note the fix now makes `priorityPerPaycheck` **`undefined` on purpose**
  (`migrations.ts:214`) — the deleted assert would now be actively wrong, so removing rather than
  repairing it was the right call.
- **No stale assert left behind.** `eq(g.goals[0].targetAmount, 4000, …)` (`:451`) and
  `eq(g.goals[0].currentAmount, 0, …)` (`:452`) still hold under the new loop, which touches neither.
- **Registered in the aggregate run:** `apps/rn/src/testing/runAppTests.ts:44` awaits this file's default
  export, reached by `apps/rn/package.json:16` (`test:app`). It is a real gate, not a print.
- **New import is sound:** `selectBaseAllocation` exists at `apps/rn/src/store/selectors.ts:96` and is
  pure; the store defaults to `subscriptionPlan: 'free'` (`apps/rn/src/data/defaults.ts:50`) so neither
  the water-fill nor the confidence holdbacks run, keeping both fixtures deterministic.
- **No timezone exposure.** Both fixtures supply `currentDate`/`nextPaycheckDate` explicitly (`:406`,
  `:438`) and no assert depends on a window boundary: assertion 1 needs only "the $3,000 debt absorbs the
  remainder" and assertion 2 needs only "remainder ≥ $200". Safe east of UTC.
- ⚠️ **Not executed** — per the brief. The reasoning above is static; the numeric values `0` and `200`
  were derived by reading `allocatePaycheck.ts`, not by running the suite.

---

## Tally

| hunk-group | verdict |
|---|---|
| **B-1** `migrations.ts:177-215` — the pace stand-down loop | `DEFECT` |
| **B-2** `DataRepairsCard.tsx:58-83` — copy rewrite + docblock | `DEFECT` |
| **B-3** `money.tsx:941-944,:980-995` — the `Funded` guard | `SOUND-UNPINNED` |
| **B-4** `persistenceLifecycle.test.ts:402-449` — allocation asserts | `WEAK-TEST` |

**2 `DEFECT` · 1 `SOUND-UNPINNED` · 1 `WEAK-TEST`.** No `DEAD`, no `UNREACHABLE-GATE` — this cluster
changes no gate, and every changed line is reachable in a shipping build (nothing is behind `QA_TOOLS`
or `__DEV__`).

## Could not determine

- **Suite result.** `npm run test:app` was not run. Both new asserts were verified by reading
  `allocatePaycheck.ts`; the expected values `0` and `200` are derived, not observed.
- **Rendered card copy.** No frame in `apps/rn/capture-ref/p6.8/` shows the repairs card with a goal-pace
  repair, and the a11y group label at `DataRepairsCard.tsx:74` is **only observable on device** — the
  duplicate reading of the blanket sentence cannot be confirmed from source.
- **v1.6 field types.** Whether a real v1.6 store ever wrote `priorityPerPaycheck` as a string could not
  be established from this repo; the field exists in the legacy type
  (`packages/core/storage/debtPlannerStorage.ts:102`) and the bridge applies no transform
  (`apps/rn/src/data/legacyBridge/mapLegacyStore.ts:71-83`), so the shape is *permitted*. B-1 does not
  depend on it — the JSON-restore door accepts the same shape from any file.

## Cross-cutting

**The docblocks in this cluster are more confident than the code three times over**, which is the class
the brief flagged:

1. `migrations.ts:187-190` correctly isolates the harm to the fail-silent `0` — and the loop beneath it
   at `:202` does not test for `0`.
2. `money.tsx:991-993` claims a per-goal, per-field scope the expression at `:995` does not implement.
3. `DataRepairsCard.tsx:69-72` claims the recovery route is followable; `AffordabilityCard.tsx:53-58`
   blocks it.

In each case the prose describes the *intended* fix and the code implements a coarser proxy for it.
