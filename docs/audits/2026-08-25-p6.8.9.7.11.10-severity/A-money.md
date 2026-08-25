# A — MONEY, GOALS AND DATA REPAIR

**Round:** P6.8.9.7.11.10 · severity pass
**Auditor surface:** money, goals and data repair.
**Job 1 subject:** `4877d90..01fc7ec` over `apps/rn/src/data/migrations.ts` ·
`apps/rn/src/app/(tabs)/money.tsx` · `apps/rn/src/store/persistenceLifecycle.test.ts` ·
`apps/rn/src/components/plan/DataRepairsCard.tsx` *(the card is **not** in the diff — see J1-4)*.
**Job 2 sweep:** `migrations.ts`, `apps/rn/src/store/` (persistence, store actions, payday,
payoff celebration), `packages/core/engine/allocatePaycheck.ts`,
`packages/core/engine/recommendedActions.ts`, and the goal/priority path from storage through the
engine to the screen.

**Method.** Read the diff, then each changed file whole, then every consumer of the values it
produces. Nothing was executed — no suite, no gate, per the brief. Every numeric claim below was
derived by reading `allocatePaycheck.ts`, not observed.

**Severity words are exactly `blocker` / `major` / `minor`.** Job 2 reports `blocker` and `major`
only.

---

# JOB 1 — did each fix close its finding?

## J1-1 · `migrations.ts` — the pace stand-down now matches on the VALUE (closes B-1)

**Verdict: `PARTIAL` · severity `major`.**
**Consequence (one sentence):** the named defect is gone, but the rewritten loop throws on a `null`
element in `goals` — which on the hydrate path quarantines the whole store and drops the user into
onboarding with `data-reset` — and it silently revokes a user's sinking-fund priority with no notice
and no way to restore it.

**Q1 — is the original behaviour gone? Yes.**
`apps/rn/src/data/migrations.ts:215` is now
`if (goal.priority !== true || goal.priorityPerPaycheck !== 0) continue;`. A recovered string
(`'200'`, `'1,200'`) leaves `readMoney` at `migrations.ts:50` as a real number, so the loop skips it and
both `priority` and `priorityPerPaycheck` survive. The three harms B-1 named — the un-prioritised
sinking fund, the destroyed recovered value, the false sentence — are all gone for that input.
The `governed` branch at `migrations.ts:224` is also **correct**: `allocatePaycheck.ts:629` really does
require `goal.type !== "savings" → continue`, and the starter-EF rung at `allocatePaycheck.ts:605`
really does consult neither `priority` nor the pace, so an emergency goal's stand-down would have been
a false claim. B-1(a) and B-1(b) are both closed by the same rewrite.

**Q2 — what does the change do to inputs the finding never mentioned? Two things.**

1. ⛔ **`goals` is now dereferenced unconditionally, and it can hold `null`.**
   `repairMoneyFields` deliberately returns non-object rows **by reference and untouched**
   (`migrations.ts:75`), so `goals: [null]` survives into the loop, and `goal.priority` at
   `migrations.ts:215` throws a `TypeError`. **Before this diff it did not:** the old loop iterated
   `repairs` and only reached `goals.find(...)` when a *goal* repair record existed, so a store with a
   null goal row and no goal repair migrated cleanly. This breaks the totality contract 5.10
   established and `persistenceLifecycle.test.ts:113-118` states in prose — *"`runMigrations` is now
   total, so the rest of the store survives"*. Filed with its blast radius as **J2-3**.
2. ⚠️ **The legacy-`0` branch changes the user's plan and tells them nothing.**
   `migrations.ts:228-234` only rewords a repair record when one exists, and a stored `0` produces
   none (`readMoney` at `migrations.ts:45` returns `repaired: false` for a finite number). So for the
   exact population this half of the fix was written for — stores an earlier build already wrote — the
   goal stops being funded ahead of debt (`allocatePaycheck.ts:629` now skips it) with **no entry in
   `pendingDataRepairs` and no card**. The test at `persistenceLifecycle.test.ts:488` pins that silence
   as intended (`'…and nothing is reported, because the loss was not today'`). This module's own
   opening rule is *"money that cannot be read is REPAIRED and REPORTED, never trusted and never
   silently dropped"* (`migrations.ts:32`); this branch is the silent drop. It is also
   **unrecoverable**: `priorityPerPaycheck` is written at exactly one site,
   `SaveForItSheet.tsx:109`, reachable only through `AffordabilityCard.openSaveSheet`
   (`AffordabilityCard.tsx:53-58`), which refuses a name the surviving goal already holds.

   *Counter-argument, stated fairly:* the loss genuinely did happen in an earlier launch, and dating a
   repair line to today would be its own false claim. But "say nothing" and "say when" are not the only
   two options, and the one chosen is the one this file forbids.

**Minor preservation loss, recorded not filed:** the old `else` branch reworded a *non-priority* goal's
pace repair to plain English (`'the per-paycheck amount could not be read'`). The new loop `continue`s
at `migrations.ts:215` before reaching any rewording, so that record now reaches
`DataRepairsCard.describe` with its raw field name and renders **"Roof — priorityPerPaycheck"** — the
camel-cased identifier `migrations.ts:197-199` exists to prevent. Reachable only from a blob carrying
a pace on a non-priority goal (the app never writes one: `SaveForItSheet.tsx:98` sets
`pace = undefined` when `prioritize` is false). `minor`.

**Q3 — would anything catch it un-fixing? Yes, for the fix itself.**
`persistenceLifecycle.test.ts:461-472` (recovered `'1,200'`) fails on the original defect: the old loop
stood the goal down, so `priorityPerPaycheck` would be `undefined`, not `1200`.
`persistenceLifecycle.test.ts:480-489` (stored `0`) fails on the original defect: the old loop was a
no-op with no repair record, so `priority` would still be `true`. Both are real, both are registered
(`apps/rn/src/testing/runAppTests.ts:44` → `apps/rn/package.json` `test:app`).
**Nothing pins the `governed` branch** — flipping `migrations.ts:224` to `const governed = true` fails
no assertion — and nothing pins a non-object row in `goals`.

---

## J1-2 · `money.tsx` — `Math.min(1, …)` on the goals hero (against B-3's "the hero still congratulates")

**Verdict: `WRONG-REMEDY` · severity `major`.**
**Consequence (one sentence):** a goals hero built on a target the app could not read now reads
**"100% funded"** with a full bar instead of the visibly-absurd "150% funded", so the one tell that
something was wrong is gone and the false congratulation is left standing.

**Q1 — is the original behaviour gone? Only the arithmetic tell.** The finding's subject was
*"congratulate over money the app could not read"*, on the largest number on the screen. The remedy is
`apps/rn/src/app/(tabs)/money.tsx:975` — `Math.min(1, totalSaved / totalTarget)` — which clamps the
percentage and changes nothing else. With two goals, one healthy (`$0 of $1,000`) and one whose
`targetAmount` repaired to `0` while `currentAmount` read fine at `$1,500`, the hero now renders:

- `money.tsx:980` value → **$1,500**
- `money.tsx:981` sub → **saved of $1,000 target**
- `money.tsx:982` caption → **100% funded**  *(was 150%)*
- `money.tsx:983` bar → full

"100% funded" is false about the user's own money, and it is *more* plausible than the number it
replaced. The docblock at `money.tsx:969-974` opens **"THE SAME RULE AS THE `Funded` BADGE"** — the
badge's rule is *suppression* keyed on the repair (`money.tsx:1002`); a clamp suppresses nothing. The
prose describes a fix the code does not implement, which is the third instance of that pattern in this
cluster.

**Q2 — inputs the finding never mentioned.** A legitimately over-funded portfolio (`$1,200` saved
against a `$1,000` target, no repairs anywhere) now reads **100% funded** rather than 120%. That is
defensible as progress-bar convention and is not filed, but it is a behaviour change on healthy data
the finding did not ask for, and it is exactly what makes the clamp indistinguishable from the corrupt
case.

**What the finding needed** is the badge's own shape applied to the aggregate — exclude goals whose
target is unreadable from both sums, or suppress the caption while a goal repair is pending. Neither
is present.

**Q3 — would anything catch it un-fixing? No.** Grepped `apps/rn/src` and `apps/rn/tests`: no test or
e2e spec references the goals hero, `overall`, or `unreadGoals`. Deleting `Math.min` is invisible to
every suite.

**Not fixed, and not attempted:** B-3's two comment/code mismatches survive verbatim —
`money.tsx:998` still says *"Scoped to `pct === 0` deliberately"* while `money.tsx:1002` scopes to
`g.targetAmount === 0`, and `money.tsx:999-1000` still claims a per-goal, per-field scope that
`unreadGoals` (`money.tsx:944`, `entity === 'goal'` only) does not implement. `minor` each, per the
brief's first calibration.

---

## J1-3 · `persistenceLifecycle.test.ts` — the two new blocks (against B-4's `WEAK-TEST`)

**Verdict: `CLOSED`.**

Both blocks fail on the original defect, which is the question B-4 said the previous asserts could not
answer:

- `persistenceLifecycle.test.ts:461-472` — `targetAmount: 'nonsense'` beside
  `priorityPerPaycheck: '1,200'`. This is exactly the discriminating fixture B-4 said was absent: one
  field lost, one recovered, on the same goal. The coarse rule *"stand down any goal with any repair"*
  now goes red at `:467` (`priorityPerPaycheck === 1200`) and again at `:468` (`priority === true`).
- `persistenceLifecycle.test.ts:480-489` — a stored `0` with no repair record. Red on the pre-diff code
  at `:486` (`priority === false`).

**Gaps, recorded not filed:**
- The third assert of the first block (`:469-472`,
  `pendingDataRepairs.some((r) => r.entity === 'goal')`) is labelled *"…while the unreadable
  targetAmount beside it is still reported"* but cannot fail for that reason — the *pace* repair record
  satisfies the same predicate. The class it names is covered exclusively elsewhere (`:493-498`, a goal
  carrying only `targetAmount: 'abc'`), so no instrument is blinded. `minor`.
- `:488` (`pendingDataRepairs.length === 0`) pins the silent stand-down described in J1-1 Q2 as
  intended behaviour. That is a design decision expressed as a test, not a test defect — but if the
  decision is reversed, this assert is what has to change with it.
- Nothing covers `governed === false` (the emergency path), and nothing covers a non-object row in
  `goals` — the input J1-1 Q2 shows now throws.

---

## J1-4 · `DataRepairsCard.tsx` — **not in the diff** (against B-2's `DEFECT`)

**Verdict: `PARTIAL` · severity `major`.**
**Consequence (one sentence):** the card still tells a user whose sinking-fund pace was lost to "set it
again", and no screen in the app can set it again.

`git diff 4877d90..01fc7ec` touches three files; `DataRepairsCard.tsx` is not one of them. B-2 was
answered **in `migrations.ts` instead**: the sentence at `migrations.ts:232` is now
`'the per-paycheck amount could not be read, so it is no longer funded ahead of your debt'` — the
`'— set it up again from Can I afford it?'` clause is deleted. That closes the specific falsehood B-2
named: the card no longer advertises a route `AffordabilityCard.tsx:53-58` blocks.

**What is still open.** The card's blanket copy is unchanged and still makes the generic promise B-2
said was unfollowable:
- `DataRepairsCard.tsx:80-83` — *"Your plan is running without them until you set each one again."*
- `DataRepairsCard.tsx:74` — the same sentence inside the a11y group label.

For a stood-down pace there is nothing to set. `GoalSheet.tsx:49` writes only
`{name, targetAmount, currentAmount, type}`; `SaveForItSheet.tsx:109` is the only writer of
`priorityPerPaycheck`, and its only door refuses the surviving goal's name. The route was removed from
the sentence; the dead end was not removed from the app.

**The docblock is now stale in a way that matters.** `DataRepairsCard.tsx:69-72` still reads *"The
recovery route is named in that line instead of promised generically here."* No line names a route any
more, so the comment tells the next maintainer the generic promise at `:80-83` is covered when it is
not. Worth noting, not worth raising: `minor`.

**Q3 — would anything catch it?** No. `apps/rn/tests/e2e/data-recovery.spec.ts` asserts the
`data-repairs-ack` testID and a debt name; nothing asserts either sentence, and no fixture in the repo
produces a goal-pace repair on screen. Unpinned.

---

# JOB 2 — the major+ sweep

`blocker` and `major` only. Four found.

---

## J2-1 · `blocker` — one "Got it" tap permanently restores both false congratulations

**Consequence:** after tapping "Got it" on the data-repairs card, Money tells a user whose balances
could not be read **"Every balance cleared · N debts paid off"** over debts they still owe, and badges
a savings goal whose target could not be read **"Funded"** — the exact screens both guards were written
to prevent, now permanent.

**The mechanism.** Both suppressions read `pendingDataRepairs`, which is a *notification* flag, not a
data flag:

- `apps/rn/src/app/(tabs)/money.tsx:354-355` —
  `const unreadDebts = store.pendingDataRepairs.some((r) => r.entity === 'debt');`
  `const allCleared = active.length === 0 && paidOff.length > 0 && !unreadDebts;`
- `apps/rn/src/app/(tabs)/money.tsx:944` —
  `const unreadGoals = store.pendingDataRepairs.some((r) => r.entity === 'goal');`
- `apps/rn/src/app/(tabs)/money.tsx:1002` —
  `const funded = g.currentAmount >= g.targetAmount && !(unreadGoals && g.targetAmount === 0);`

And the flag is emptied by a single tap that changes no data:

- `apps/rn/src/components/plan/DataRepairsCard.tsx:91` — `<Button label="Got it" … onPress={onAck} …>`
- `apps/rn/src/app/(tabs)/index.tsx:557` — `onAck={() => store_.getState().acknowledgeDataRepairs()}`
- `apps/rn/src/store/store.ts:745-750` — `set((s) => ({ store: { ...s.store, pendingDataRepairs: [] } }))`

The repaired `0`s stay `0` forever. So the sequence is: launch → repairs recorded → Money correctly
withholds the congratulation → user taps "Got it" (the card's only affordance, and the ack card is
top-priority on Today, `index.tsx:236-237`) → `unreadDebts`/`unreadGoals` go false → Money renders
`money.tsx:360` **"Every balance cleared"**, and the goals list renders the `Funded` badge with
`amountSuffix` `' saved'` over `formatWhole(0)` (`money.tsx:1008-1010`).

**Why the guard's own comment does not save it.** `money.tsx:349-353` says *"The repairs card on Today
names them; this makes sure the celebration waits until the user has answered it."* Acknowledging is
"answering" the notice, not correcting the data — and `DataRepairsCard.tsx:48-50` states the
acknowledgement is by design the only thing that clears the list. The guard therefore has an expiry
measured in one tap, while the condition it guards is permanent. **The correct predicate is the data**
— e.g. `paidOff.some((d) => d.balance === 0 && d.originalBalance == null)` is not it either, but any
check that survives the ack would be: a per-entity `repairedFields` marker on the row, or keeping a
separate never-cleared `unreadable` set beside the user-facing notice list.

**Would anything catch it?** No. `apps/rn/tests/e2e/data-recovery.spec.ts` taps the ack button but
asserts nothing about Money afterwards, and no unit test references `allCleared`, `unreadDebts`,
`unreadGoals` or the `Funded` badge. The class is completely unpinned on both branches.

**Not determinable from source:** whether a real user reliably taps "Got it" rather than fixing each
amount first. The card offers no other control, so the tap is the only way to dismiss it.

---

## J2-2 · `major` — the repairs card reports successfully RECOVERED amounts as unreadable

**Consequence:** a user whose stored amounts are numeric strings is told those amounts "could not be
read" and that "your plan is running without them", while the plan is in fact running with the correct
recovered values.

**The mechanism.** `readMoney` has two `repaired: true` returns and the caller cannot tell them apart:

- `apps/rn/src/data/migrations.ts:48-51` — a numeric string **recovers**:
  `if (Number.isFinite(parsed)) return { value: parsed, repaired: true };`
- `apps/rn/src/data/migrations.ts:52` — everything else is the **loss**: `return { value: 0, repaired: true }`
- `apps/rn/src/data/migrations.ts:81-88` — a repair record is pushed on **either**.

The card then speaks only the loss language for both:

- `DataRepairsCard.tsx:77` — *"An amount could not be read"* / *"N amounts could not be read"*
- `DataRepairsCard.tsx:80-83` — *"Your plan is running without it until you set it again."*
- `DataRepairsCard.tsx:74` — the same, in the a11y group label.

So a store holding `targetAmount: '4,000'` renders **"An amount could not be read · Roof —
targetAmount · Your plan is running without it until you set it again"** on Today, while Money one tab
over shows the goal at `$4,000` and the engine allocates against `4000`. The two screens contradict
each other and the card is the one that is wrong. This is unchanged by `4877d90..01fc7ec`; the fix
above it now depends on the same distinction (`migrations.ts:202-207` explains it in prose) without
propagating it to the copy.

**The shape of the fix** is to carry the distinction on the record — `readMoney` returning
`repaired: 'recovered' | 'lost'`, with the recovered ones either not surfaced at all or surfaced as
*"read in a different format — check it"* — rather than one word covering both.

**Reachability, stated honestly.** ⚠️ **I could not establish that a real v1.6 store ever wrote string
money.** `migrations.ts:34-37` records the *measured* v1.6 defect as `Number("12,000")` → `NaN` →
persisted as `null` — i.e. v1.6 applied `Number()` before storing, which yields numbers, not strings.
The two comments asserting string storage (`migrations.ts:205-207`,
`persistenceLifecycle.test.ts:454-455`) cite no measurement, and `debtPlannerStorage.ts:96-103` types
every goal money field as `number`. The door I can confirm is the JSON restore: `readBackup.ts:159`
hands an arbitrary user-supplied file straight to `runMigrations`. If the project's own premise is
right, this fires for **every** migrated v1.6 user; if it is wrong, it fires only on hand-edited or
third-party files. Rated `major` on the narrow reading; it is `blocker`-shaped on the broad one, and
**the premise is worth measuring before deciding**.

**Would anything catch it?** No. No test asserts any string the card renders.

---

## J2-3 · `major` — `runMigrations` is no longer total for a `null` row, and the contract test cannot see the class

**Consequence:** a persisted store or backup file whose `goals` (or `debts`) array contains a `null`
element is thrown out whole — quarantined with `storageError: 'data-reset'` on launch, or refused as
"unreadable" on import — instead of repairing the one row and reporting it.

**The mechanism.** `repairMoneyFields` deliberately passes non-object rows through **by reference and
untouched** (`apps/rn/src/data/migrations.ts:75`), so `null` survives into two unguarded dereferences:

- `apps/rn/src/data/migrations.ts:147` — `const lastVerifiedDate = debt.lastVerifiedDate ?? …` (**pre-existing**)
- `apps/rn/src/data/migrations.ts:215` — `if (goal.priority !== true || …)` (**new in `4877d90..01fc7ec`**;
  the previous loop iterated `repairs` and never touched a goal row unless a goal repair record existed)

Both throw a `TypeError` out of `runMigrations`, and the two doors handle that very differently:

- **Hydrate** — `apps/rn/src/store/store.ts:339-346` catches, quarantines the whole blob under
  `'migration-failed'`, sets `storageError: 'data-reset'` and overwrites storage with defaults. The
  user's entire portfolio is gone from the app (the quarantined bytes have no restore surface —
  `clearQuarantinedData` at `persistence.ts:227` only deletes them).
- **Import** — `apps/rn/src/data/readBackup.ts:157-163` catches and returns
  `{ ok: false, reason: 'unreadable' }`. Safe, but the whole file is refused over one bad row.

**This is the exact contract 5.10 set, and the test cannot check it.**
`apps/rn/src/store/persistenceLifecycle.test.ts:113-135` states the contract —
*"It used to throw out of `runMigrations` and take the quarantine-and-reset path, which discarded the
WHOLE blob over one bad key … `runMigrations` is now total"* — but its only fixture is
`debts: 'nope'`, a **non-array**. `repairMoneyFields`'s `!Array.isArray` branch
(`migrations.ts:66-73`) handles that case; nothing in the corpus
(`apps/rn/src/data/migrationAudit/corpus.ts:59` is the only goals fixture, a well-formed object) or in
`hostile.test.ts` supplies an array **containing** a non-object. Per the brief's second calibration
that alone is `major`: this is the gate for exactly this class and it cannot fail on it.

**How a `null` row arises.** Not from the app — `addGoal`/`updateGoal`/`removeGoal`
(`store.ts:503-513`) cannot produce one, and the legacy bridge writes an already-migrated store. The
reachable sources are a hand-edited or third-party backup JSON, `JSON.stringify` of an array with a
hole or an `undefined` element on the producing side, and any external mutation of the MMKV blob. The
import door degrades gracefully; the hydrate door does not. Narrow, but the loss is total, and one
line of guarding (`if (!goal || typeof goal !== 'object') continue;`) closes both.

---

## J2-4 · `major` — a second `emergency`-type goal is funded by no rung at all

**Consequence:** a user who keeps two emergency-fund goals sees the second one tracked on Money with a
progress bar while every paycheck allocates it exactly $0, and nothing on any screen says so.

**The mechanism.** The engine resolves *the* emergency fund with a `find`, then every rung is exclusive:

- `packages/core/engine/allocatePaycheck.ts:598` —
  `const emergencyGoal = goals.find((goal) => goal.type === "emergency");` — first match only
- `:605` starter-EF rung → `emergencyGoal` only
- `:629` §2.9 sinking-fund rung → `goal.type !== "savings"` ⇒ `continue`
- `:678` fuller-EF rung → `emergencyGoal` only
- `:695-699` post-debt savings rung → `goal.type === "savings"` required

So goal #2 of type `emergency` matches none of the five. It is also invisible to the recommended
surface: `packages/core/debt/selectActiveRecommendedActions.ts:66-67` merges `efItems[0]`, and the
allocations only ever carry the first goal's id.

**It is reachable through the ordinary UI.** `apps/rn/src/components/entities/GoalSheet.tsx:76-81`
offers `Emergency fund` / `Savings` as a free choice on both add and edit, and the only guard on that
sheet is name-uniqueness (`GoalSheet.tsx:44-48`). "Emergency Fund" + "Car repair fund" (also typed
emergency) is a natural thing to build, and switching an existing savings goal to `emergency` on edit
does the same thing to whichever one sorts second in `goals` order. `GoalSheet` is the only
emergency-goal door (`SaveForItSheet.tsx:107` hard-codes `type: 'savings'`), and it has no type guard.

**No warning exists anywhere.** The Money row renders type-agnostically (`money.tsx:1007`,
`meta={g.type === 'emergency' ? 'Emergency fund' : 'Savings'}`) with a live `progress={pct}` bar, so
the starved goal is presented identically to the funded one.

**Would anything catch it?** No. Grepped every fixture that builds an emergency goal —
`testAllocation.ts:169-173`, `testStressScenarios.ts:80-84` and `:163-167`,
`testAbuseScenarios.ts`, `testFullAppRegression.ts` — and **no store anywhere carries two emergency
goals at once**. `testSelectActiveRecommendedActions.ts` has none at all. The class is unexercised.

---

# What could not be determined

- **No suite or gate was run** (per the brief). Every allocation figure above was derived by reading
  `allocatePaycheck.ts`.
- **Whether v1.6 ever persisted money as a string** — see J2-2. The repo asserts it twice in prose,
  types it as `number` once, and measures the opposite mechanism once. This changes J2-2 between
  `major` and `blocker` and is cheap to settle against a real v1.6 blob.
- **Device-only:** the duplicated blanket sentence in `DataRepairsCard`'s a11y group label
  (`:74`) versus the visible footnote (`:80-83`) — VoiceOver reads it twice. Unchanged this round,
  still only observable on device. `minor`.
- **`QA_TOOLS` / `__DEV__`:** nothing on this surface is gated by either. `migrations.ts`,
  `money.tsx`, both engine files and the goal/priority path are unconditional in a shipping build; the
  one prior instance on this seam (`droppedRows` reaching only a QA readout) is already fixed at
  `persistence.ts:142-155`.

---

# Tally

| # | finding | severity |
|---|---|---|
| **J1-1** | `migrations.ts` value-matched stand-down | `PARTIAL` · `major` |
| **J1-2** | `money.tsx` hero clamp | `WRONG-REMEDY` · `major` |
| **J1-3** | the two new test blocks | `CLOSED` |
| **J1-4** | `DataRepairsCard` (untouched; answered in `migrations.ts`) | `PARTIAL` · `major` |
| **J2-1** | "Got it" restores both false congratulations | `blocker` |
| **J2-2** | recovered amounts reported as unreadable | `major` |
| **J2-3** | `runMigrations` not total for a `null` row; gate blind to the class | `major` |
| **J2-4** | second emergency goal funded by no rung | `major` |
