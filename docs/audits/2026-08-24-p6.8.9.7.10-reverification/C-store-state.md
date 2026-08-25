# Cluster C — store, persistence and irreversible state

**Diff under audit:** `8e4540a..3dc3c22`, restricted to
`apps/rn/src/store/store.ts`, `apps/rn/src/store/storeActions.test.ts`,
`apps/rn/src/store/persistence.ts`, `apps/rn/src/store/persistenceLifecycle.test.ts`,
`apps/rn/src/store/substrateProducers.ts`, `apps/rn/src/components/plan/SaveForItSheet.tsx`,
`apps/rn/tests/e2e/saveforit-pace.spec.ts`.

**Method.** Every hunk read in its site: the whole containing file, the callers of every changed
function, and every reader of the state it writes. Nothing was executed — no gates, no suites. The
author's own account of the work (`DEBT_ELEVATION_PLAN.md` → *BUILDING NOW*, `DEBT_ELEVATION_LOG.md`
→ `P6.8.9.7.*`) was **not** consulted, per the brief.

Sections are appended one hunk-group at a time, in the order they were finished.

---

## C1 — `withPayoffCelebration`: a finale now supersedes a pending beat

`apps/rn/src/store/store.ts:60-66`

```ts
function withPayoffCelebration(before: DebtStore, next: DebtStore): DebtStore {
  const payoff = detectPayoff(before.debts, next.debts, next.payoffStrategy);
  if (!payoff) return next;
  if (next.pendingPayoff && !(payoff.kind === 'finale' && next.pendingPayoff.kind !== 'finale')) return next;
  return { ...next, pendingPayoff: payoff };
}
```

### VERDICT: `SOUND`

**Q1 — prior properties.** The site previously did exactly one thing beyond detection: it protected an
already-earned moment from being displaced (`store.ts:39-40`, the surviving half of the comment). The new
predicate preserves that for every same-rank pair and for the finale→beat direction:

| pending | new payoff | result | correct? |
|---|---|---|---|
| `null` | beat / finale | stamped | yes |
| beat | beat | **kept** (`store.ts:64`, first clause true, second false → early return) | yes — the first moment survives |
| beat | finale | **upgraded** | the intended change |
| finale | beat | **kept** (`payoff.kind === 'finale'` is false → early return) | yes — the finale is never downgraded |
| finale | finale | **kept** | yes — idempotent, and reachable (edit a cleared debt back above 0, then clear it again) |

Truth-tabled all four; there is no input where the predicate keeps a *lesser* pending payoff or discards a
*greater* one.

**Q1, the cost claim.** `store.ts:57-58` asserts the removed early return "was never load-bearing for
cost." Verified: `detectPayoff` is one `filter` + one `Map` build + one `filter` over `debts`
(`payoffCelebration.ts:28-45`), and it now runs on four actions
(`store.ts:428`, `:437`, `:451`, `:619`). The batch caller `verifyDebtBalances` (`store.ts:449-463`) is the
worst case and is still O(debts). No new allocation escapes the function on the early-return path — it
returns `next` itself, not a copy.

**Q2 — environments.** No date, locale, platform or theme surface is touched. `detectPayoff` compares
numbers only. The change is environment-neutral.

**Q3 — contracts.** `detectPayoff`'s documented precondition is that `before` is the pre-mutation debt list
(`payoffCelebration.ts:18-21`, "captured at the crossing, never reconstructed after"). All four call sites
pass `s.store` as `before` and the transformed store as `next`, unchanged by this diff. `next.payoffStrategy`
is read from the post-state — correct, since strategy is not moved by any of these four actions.

**Q4 — side effects.** Pure; runs inside zustand `set((s) => …)` updaters, which require purity. No effect
introduced.

**Q5 — do the new tests pin the defect?** Yes, and unusually well. See §C2.

**Q6 — gates.** No gate added or changed.

**Q7 — newly possible, and unchecked.**

1. **The beat's payload is discarded on upgrade.** When the user clears the second-to-last debt and then the
   last one before Today renders, the per-debt beat for debt A is dropped entirely — `PendingPayoff` is a
   single slot (`apps/rn/src/data/models.ts:312`), and `store.ts:65` overwrites it. The comment at
   `store.ts:55` asserts "the finale contains it"; the finale's copy is `selectCelebrationStats(store)`
   (`apps/rn/src/app/(tabs)/index.tsx:553`), which is portfolio-level and never names debt A. This is a
   deliberate trade and the right one, but **nothing asserts it** — no test states that the beat payload is
   expendable, so a future change that stacks celebrations has no record of the decision beyond the comment.
2. **A live beat overlay can swap to the finale under the user.** `PaidOffBeat` is a `Modal`
   (`apps/rn/src/components/plan/PaidOffBeat.tsx:104`) rendered from `store.pendingPayoff`
   (`(tabs)/index.tsx:191`, `:544-554`). If a balance moves while it is up, `celebration.kind` flips and the
   beat unmounts mid-animation into the finale. A modal blocks touch, so the only reachable trigger is a
   background write (an AppIntent-driven `logManualPayment`, `store.ts:606-630`). Low likelihood; nothing in
   the repo would notice it.
3. ⚠️ **PRE-EXISTING, NOT INTRODUCED HERE, but it bounds the fix's claim.** `store.ts:42-51` argues the
   finale had become permanently unreachable. The fix closes that for the four wrapped actions, but the
   **payday roll is still not wrapped**: `capturePayday` (`store.ts:593-595`), `rolloverPayCycle`
   (`store.ts:596-600`) and `applyPaydayLandedIntent` (`store.ts:601-605`) all run `applyRollover`, which
   applies this cycle's payments to real balances (`apps/rn/src/store/payday.ts:98-106`) and can take the
   last debt to zero. `computeMilestones` deliberately excludes 100% because it is *"owned by the payoff
   finale"* (`payday.ts:120-121`) — so a portfolio cleared by the ordinary cycle roll fires **neither** the
   milestone nor the finale. The diff did not create this and did not close it; flagged because it is the
   same once-ever, unrecoverable class the fix was written for.

---

## C2 — the two new `storeActions.test.ts` blocks for B2

`apps/rn/src/store/storeActions.test.ts:413-466`

### VERDICT: `SOUND` — with one branch of the new predicate left unpinned

**Q5, test 1 — "the finale survives a pending beat" (`storeActions.test.ts:422-441`).**
Assertion: `eq(s.getState().store.pendingPayoff?.kind, 'finale', …)` at `:436-440`. It measures the
**store field the renderer switches on** — `(tabs)/index.tsx:191` reads `store.pendingPayoff` and
`:552` branches on `celebration?.kind === 'finale'` — so it is the subject, not a proxy.

Traced against the pre-fix code: `if (next.pendingPayoff) return next` would leave `kind === 'beat'`
after the second `updateDebt`, and the assertion is `===` on the string. **It fails on the defect.**
I also confirmed the fixture actually reaches the defect rather than a neighbouring path:
`updateDebt('d0', { balance: 0 })` sets `isBalanceEdit` true at `store.ts:417` and therefore routes
through `withPayoffCelebration` at `store.ts:428`; `detectPayoff` sees `liveBefore.length === 1`,
`crossed = [d1]`, `liveAfter = []` → `finale` (`payoffCelebration.ts:28-46`).

**Q5, test 2 — the control (`storeActions.test.ts:443-466`).** Assertion:
`s.getState().store.pendingPayoff === first` at `:461`. **Object identity, not `kind` equality** — which
is the strongest available form here, because a naive `{...next, pendingPayoff: payoff}` overwrite
produces a structurally-identical beat that a `kind` check would accept. Three debts, so the second
crossing is genuinely a beat and not a finale. This is a properly adversarial control against the most
likely wrong fix.

**Q1 — the test file's own conventions are honoured.** `inst()` (`storeActions.test.ts:56-60`) seeds via
`setState`, and the `debts` override replaces the whole array, so the two fixtures are hermetic. The
runner is throw-based and stops at the first failure (`:19-23`); test 1's two asserts and test 2's two
asserts are each ordered load-bearing-first, so no assertion here is shadowed by a preceding one.

**Q6 — registration.** `apps/rn/src/testing/runAppTests.ts:39` imports `../store/storeActions.test`,
which is reached by `test:app` → `validate:release:rn` (`package.json:47`). It runs in the aggregate.

**⚠️ The gap — `SOUND-UNPINNED` for one branch.** The new predicate has four arms (see §C1's table) and
the tests cover two: `beat→finale` (upgrade) and `beat→beat` (keep). **`finale→beat` is not tested.** A
refactor to the natural-looking `payoff.kind !== next.pendingPayoff.kind` — i.e. "upgrade whenever the
kinds differ" — **passes both new tests** while silently replacing a pending finale with a beat. That
state is reachable: `pendingPayoff` is persisted deliberately (`store.ts:740-743`), so a finale earned
and not dismissed before a force-quit survives to the next launch, and a user who then adds two debts and
clears one would lose the once-ever finale under that refactor. One more block — pending finale, clear one
of two debts, assert `kind` is still `'finale'` — would close it.

---

## C3 — `SaveForItSheet`: `Number(raw) > 0` → `parseAmountField`

`apps/rn/src/components/plan/SaveForItSheet.tsx:4`, `:77-78`, `:90-94`, `:164`

### VERDICT: `SOUND` — with one environment note that this site newly inherits

**Q1 — prior properties.** I enumerated the accept/reject delta rather than trusting the comment.
Old guard: `Number(customPer) > 0`. New: `parseAmountField` (`packages/core/utils/amountField.ts:38-43`
— `normalize` strips `[,\s$]`, then `Number.isFinite(n) && n > 0`).

- Everything the old expression **accepted** is still accepted **except `"Infinity"` / `"-Infinity"`** —
  which is the intended deletion. There is no other string with `Number(s) > 0` and
  `Number.isFinite(Number(s)) === false`.
- Strictly more is accepted: `"1,200"`, `"$100"`, `" 100 "`, `"1 200"`.
- The refusal *channel* is preserved exactly. Old: `if (!(per > 0)) return;` with the comment "flag NOT
  yet set → they can retry" (`SaveForItSheet.tsx:92`). New: `if (customPace == null) return;` **before**
  `submitted.current = true` at `:100`. The double-tap guard's ordering property — the one thing this
  site was doing beyond parsing — is intact.
- The two derived values that feed the caption (`customN`, `customReadyBy`, `:78-79`) still go `null`
  together on a refusal, so the "N paychecks · ready by …" line at `:165-169` still hides. Preserved.

**Q3 — helper contract.** `parseAmountField`'s doc is explicit: *"`null` is the only refusal channel:
callers must branch on it rather than on a falsy check"* (`amountField.ts:34-36`). Both call sites use
`!= null` / `== null` (`SaveForItSheet.tsx:78`, `:92`), not truthiness. Honoured. The function cannot
return `0`, so the sibling-family footgun does not apply here.

**Q4 — side effects.** `:77` is a plain pure computation in the render body. The file's own documented trap
is elsewhere — the module-level `goalSeq` counter exists specifically to keep an id generator out of the
render body and off React Compiler's lint (`:31-37`) — and the change does not go near it. No effect added.

**Q2 — environments.**
- *Timezone.* Not touched. `addPaychecks` (`:24-29`) and `shortDate` (`:20-22`) both construct local dates
  (`parseLocalDate` / `${iso}T00:00:00`), which is the shape `scripts/check-local-dates.ts` polices
  (`packages/core/utils/localDate.ts:10-12`). Unchanged by this diff and still correct east of UTC.
- *Platform.* `testID` reaches the real `TextInput` (`apps/rn/src/components/ui/TextField.tsx:62`), so it
  resolves on both iOS native and react-native-web. ⚠️ But note the asymmetry the e2e rests on: on iOS
  `keyboardType="decimal-pad"` (`SaveForItSheet.tsx:164`) offers digits and a separator only, so
  `"Infinity"` is a **paste-only** input there, while on RNW it is freely typeable. The guard is right on
  both; the *proof* only exercises the permissive one.
- ⚠️ **Locale — the one real note.** `normalize` strips commas unconditionally, justified by
  "US · CA · AU · NZ — every one period-decimal" (`amountField.ts:20-23`). That is a **storefront**
  claim, not a device-locale one: a `fr-CA` device renders a comma decimal key on `decimal-pad`, and a
  user typing `1,50` meaning $1.50 now commits a pace of **150**. Before this hunk that input was
  *refused* (`Number("1,50")` is `NaN`), so at this site specifically the change converts a hard refusal
  into a silent 100× overstatement of the per-paycheck cap. The decision is the shared helper's and
  predates this diff; it is recorded here because `SaveForItSheet` is newly subject to it and because
  `amountField.ts:22-23` asks to be revisited when this comes up.

**Q7 — newly possible, and unchecked.** A very small pace (`0.01`) yields
`customN = Math.ceil(amount / 0.01)` = 500,000, and `addPaychecks` advances 30 × 500,000 days into a
five-digit year; `shortDate` then parses `"43698-…T00:00:00"`, which is not a valid ISO string for a
five-digit year, so the caption renders **"Invalid Date"** (`SaveForItSheet.tsx:20-22`, `:167`). ⚠️
**Pre-existing** — `Number("0.01") > 0` reached the same place — and the new parser only widens the
strings that get there (`"$0.01"`). Nothing in the repo asserts on this caption. Not a regression;
flagged as the residual it is.

---

## C4 — `describeMigrationLosses` now reports `read.droppedRows` to the user

`apps/rn/src/store/persistence.ts:142-155`

```ts
const dropped = outcome.read?.droppedRows ?? 0;
if (dropped > 0) push(`${dropped} row(s) of your old data could not be read and were not carried over`);
```

### VERDICT: `DEFECT` — the number is not a count of *the user's* data, and it is also `SOUND-UNPINNED` (no test, at all)

**The defect.** `droppedRows` is accumulated **across every candidate database the WebKit walk opened**,
before any of them is identified as the user's store:

`apps/rn/src/data/legacyBridge/readLegacyStores.ts:144-154`
```ts
for (let i = 0; i < walk.candidates.length; i++) {
  const result = await readOneDatabase(walk.candidates[i], i);
  ...
  if ('items' in result && result.items) {
    report.droppedRows += result.dropped ?? 0;      // ← every candidate, unfiltered
    decoded.push({ path: result.path, items: result.items });
  }
}
report.store = pickLegacyStore(decoded);            // ← identity is decided AFTER
```

`pickLegacyStore`'s own doc states the premise that breaks this: it ranks on `debtPlanner.*` key count
*"so a stray database from some other origin (an in-app web view, a WKWebView an SDK made) cannot win"*
(`apps/rn/src/data/legacyBridge/webkitLocalStorage.ts:193-197`). Those stray databases still contribute
to `droppedRows`. **The breaking input:** any upgraded container holding more than one localStorage
database — which the reader explicitly expects (`readLegacyStores.ts:59-61`: *"two WebKit layouts both use
`localstorage.sqlite3`"*) — where a non-ours database has a row that will not decode. The user is then
told, on the launch after upgrading, that *"3 row(s) of your old data could not be read and were not
carried over"* when nothing of theirs was lost.

**And it is not filtered even in the single-database case.** `dropped` is
`rows.length - Object.keys(items).length` (`readLegacyStores.ts:88-92`), and `decodeItemTable` drops **any**
row whose key is non-string/empty or whose value will not decode (`webkitLocalStorage.ts:166-176`) — with no
`debtPlanner.` prefix test anywhere in that path. Capacitor/Ionic internals, an analytics SDK's keys, or a
plugin's cache in the same origin all count as *"your old data"*.

⚠️ **This contradicts the reasoning written six lines above it.** `describeMigrationLosses`'s own header
excludes `map.dropped` on the ground that *"every `DROPPED` entry carries a documented reason and none of
them is user data"* (`persistence.ts:123-126`). The new line adds a number that is **less** filtered than
the one deliberately excluded: `map.dropped` at least only contains `debtPlanner.*` keys
(`apps/rn/src/data/legacyBridge/mapLegacyStore.ts:169`), whereas `droppedRows` contains anything at all.
Per the brief, the disagreement between the prose and the code is itself the finding.

**Where the false alarm lands.** `pendingDataRepairs` renders `DataRepairsCard`, which occupies the
**top-ranked** ack slot on Today — above the milestone, the intent undo and the celebration
(`apps/rn/src/app/(tabs)/index.tsx:232-238`, `:556-558`).

**Q1 — prior properties preserved.** Yes. The three existing pushes (`persistence.ts:135-141`) are
untouched and still ordered first; the new entry is appended, so no existing string moved or changed.

**Q3 — contract.** `outcome.read?.droppedRows ?? 0` is safe: `describeMigrationLosses` is called only on
the `migrated === true` branch (`persistence.ts:201-202`), where `read` is always the real report
(`migrateFromLegacy.ts:186-189`). The optional chain is redundant, not wrong.

**Q5 — would any test have failed?** **No test proves it.** Every `LegacyReadReport` fixture in the repo
hard-codes `droppedRows: 0` — `migrateFromLegacy.test.ts:45`, `migrationAudit/interruption.test.ts:46`,
`:130`, `:152`, and all three in `persistenceLifecycle.test.ts:236`, `:273`, `:305`. The existing M3-20
test (`persistenceLifecycle.test.ts:254-293`) asserts on `/not recognised/` and on the *absence* of
deliberate drops, and would pass unchanged if this line were deleted. **Deleting the whole hunk goes green.**

**Q2 — environments.** Native-only by construction; the web reader returns `supported: false`
(`readLegacyStores.web.ts:22`) and short-circuits before `describeMigrationLosses`
(`migrateFromLegacy.ts:125`). Reachable only on an iOS in-place upgrade from v1.6, which is precisely the
population that cannot be tested from a fresh install.

**Q7 — residual, pre-existing class.** `DataRepairsCard`'s copy is written for *amounts repaired to zero*:
*"They are showing as $0, so your plan is leaving them out. Open each one and enter the real amount"*
(`apps/rn/src/components/plan/DataRepairsCard.tsx:64-67`). A dropped v1.6 row is not showing as $0 and
there is nothing to open. The mismatch already existed for the three `migration` entries; this adds a
fourth and a worse-fitting one. Flagged, not charged to this hunk.

**What would fix it.** Count drops on the **picked** database only — the row is already available per
candidate as `result.dropped` beside `result.path`, and `report.store.path` names the winner — or restrict
the count to keys carrying `LEGACY_KEY_PREFIX`. Either way the assertion needs a fixture with a non-zero
`droppedRows` on a *non-winning* candidate, which nothing in the repo currently builds.

---

## C5 — the new `persistenceLifecycle.test.ts` goal-repair block

`apps/rn/src/store/persistenceLifecycle.test.ts:370-405`

### VERDICT: `WEAK-TEST` — and it conceals a live `DEFECT` in the repair it blesses

**The strong half first.** Three of the six assertions genuinely fail on the unrepaired code:

| assertion | line | measures | fails on the defect? |
|---|---|---|---|
| `targetAmount === 4000` | `:392` | the stored number | **yes** — unrepaired it is the string `'4,000'` |
| `currentAmount === 0` | `:393` | the stored number | **yes** — unrepaired it is `null` |
| a `goal` `DataRepair` is raised | `:395-400` | `pendingDataRepairs` (the list `DataRepairsCard` reads, `migrations.ts:207`) | **yes** — no repair, no entry |

`goals.length === 1` (`:391`) is a control (unrepaired also gives 1), and
`priorityPerPaycheck !== undefined` (`:387-390`) is **vacuous against the named defect**: `readMoney`
always returns a number and `repairMoneyFields` `continue`s on an already-`undefined` field
(`apps/rn/src/data/migrations.ts:44-53`, `:78`), so no shape of this repair can produce `undefined`.

### ⛔ The weak assertion, and the defect behind it

`persistenceLifecycle.test.ts:383-386`
```ts
assert(
  g.goals[0].priorityPerPaycheck === 0 || Number.isFinite(g.goals[0].priorityPerPaycheck ?? NaN),
  'goal repair → an infinite pace is never left as a non-finite cap',
);
```

**What it measures:** that the stored value is a finite number.
**What its own comment claims** (`:376-379`): that a corrupt pace no longer *"REMOVES the cap the user
signed off on and funds the goal ahead of debt at full speed."*

Those are not the same property, and the gap is load-bearing. Traced the fixture through:
`priorityPerPaycheck: 'Infinity'` → `Number('Infinity')` is `Infinity` → `Number.isFinite` false →
`readMoney` returns `{ value: 0, repaired: true }` (`migrations.ts:45-53`). **The repaired value is `0`.**

Both engine readers treat `0` as *no cap*:

- `packages/core/engine/allocatePaycheck.ts:632`
  ```ts
  const pace = goal.priorityPerPaycheck != null && goal.priorityPerPaycheck > 0 ? goal.priorityPerPaycheck : Infinity;
  ```
- `packages/core/engine/recommendedActions.ts:80-83` — same `!= null && > 0` guard; falling through returns
  the **whole remaining target**.

So `undefined`, `null` and `0` are one equivalence class downstream, and the repair moves a corrupt pace
from one member of it to another. **The plan produced after the repair is byte-identical to the plan
produced before it**: the prioritized sinking fund funds ahead of debt, uncapped — the exact harm
`migrations.ts:164-169` says the repair exists to prevent. The assertion is written to accept `0`
explicitly (`=== 0 ||`), so it passes; and the sibling assertion's label —
*"…does NOT become `undefined`, which readers treat as 'no cap'"* (`:389`) — names the wrong member of
the class: it guards against the one value the code cannot produce while blessing the one it does.

**Severity note (mitigating, not exculpating).** The repair *is* surfaced — the user gets a
`goal` / `priorityPerPaycheck` line on `DataRepairsCard` and can re-enter the pace. The harm is confined
to every cycle between the migration and the user acting on that card, during which the goal outranks
debt with no ceiling.

**Cross-cluster.** `apps/rn/src/data/migrations.ts:170-176` is not in cluster C's file list; the defect is
recorded here because the *test* under audit is what claims to pin it, and because the claim does not
hold. A correct repair would either sentinel to `undefined` and say so, or repair to a value the engine
does not read as uncapped, and the assertion would then have to be on the **allocation**, not on
`Number.isFinite`.

**Q6 — registration.** `apps/rn/src/testing/runAppTests.ts:44` awaits the file's default export, reached
by `test:app` → `validate:release:rn` (`package.json:47`). It runs in the aggregate.

**Q1 — the block preserves the file's conventions.** It is a scoped `{}` block like every neighbour, uses
the file's `assert`/`eq` helpers, and does not touch the shared `MockAdapter`/store state, so it cannot
perturb the async cases above it.

---

## C6 — `recordCycleIncome`: a comment-only hunk marking C1's open half

`apps/rn/src/store/substrateProducers.ts:60-71`

### VERDICT: `SOUND-UNPINNED` for the hunk — and the code it annotates is `DEAD` for the population it exists to serve

The hunk adds **no executable statement**. `if (store.paycheck.incomeVaries && opts?.actualIncome === undefined) return store;` (`substrateProducers.ts:71`) is byte-identical to its pre-diff form, and the surrounding function is untouched. Q1–Q4 are therefore trivially satisfied; the only question worth asking is whether the claims are true, because the brief makes a prose/code disagreement a finding in itself.

**Verified — every factual claim in the comment holds.**

1. *"`opts.actualIncome` has no production caller."* **True.** The chain is `capturePayday` → `applyCapture`
   → `recordCycleIncome(next, cycleEndDate, { actualIncome: actuals?.actualIncome, … })`
   (`apps/rn/src/store/payday.ts:56`). Every `capturePayday` call site in the repo:
   - `apps/rn/src/app/(tabs)/index.tsx:723-729` — the only production one; passes
     `{ surpriseOutflow: … }` or `undefined`. **No `actualIncome`.**
   - `apps/rn/src/store/sandboxBeats.ts:79-82` — tutorial sandbox; `surpriseOutflow` only.
   - `apps/rn/src/testing/scenarios/guardianColdStartLifecycle.scenario.ts:60` — a test scenario;
     `surpriseOutflow` only.
   There is no fourth.
2. *"…which makes `LeanSuggestionCard` unreachable by construction."* **Substantially true.**
   `selectLeanSuggestion` refuses unless `incomeVaries` **and** `incomeActualsLog.length >= 3`
   (`apps/rn/src/store/incomeLearning.ts:23-26`), and for `incomeVaries` users the log cannot grow at all
   (`substrateProducers.ts:71`). The card at `(tabs)/index.tsx:438-441` therefore never renders for the
   only tier/regime it is written for.
3. *"nothing in the suite would go red when P6.10 forgets it."* **True.** The two tests that touch this
   supply `actualIncome` **directly to the producer** — `substrateProducers.test.ts:61-62` and
   `storeActions.test.ts:75-76` call `recordCycleIncome` / `applyCapture` with the option in hand. No test
   asserts anything about the **caller**, so wiring it or not wiring it is invisible to `test:app`.

**Q7 — one edge the comment overstates, worth recording.** *"Unreachable by construction"* is not strictly
true. `incomeVaries` is user-toggleable after the fact (`apps/rn/src/components/plan/PaycheckSheet.tsx:42`,
`:74`). A **fixed**-income user does accumulate actuals — `recordCycleIncome` falls through and defaults
`actual` to `planned` (`substrateProducers.ts:74`) — so someone with ≥3 recorded cycles who then flips the
"my income varies" switch satisfies both of `selectLeanSuggestion`'s gates and **can** see the card. Its
suggestion would be derived from a log in which `actualIncome === plannedIncome` on every row, i.e. from
data that carries no variability at all. That path is reachable today, is not what the card was designed
for, and nothing checks it.

**Q6 — this is a comment, not a gate.** It prints nothing and cannot go red. It is a note to the next
author, and by the diff's own account the instrument that would actually hold P6.10 to this does not exist.

---

## C7 — the new e2e spec `saveforit-pace.spec.ts`

`apps/rn/tests/e2e/saveforit-pace.spec.ts` (new file, 99 lines)

### VERDICT: `SOUND` — both tests fail on the defect; one time-bound caveat and one thing the pair silently blesses

**Q6 — registration.** `apps/rn/playwright.config.ts:20` sets `testDir: './tests/e2e'`, so a new file is
picked up with no manifest edit, and `test:e2e:rn` is inside `validate:release:rn`
(`package.json:17`, `:47`). It runs in the aggregate.

**Q5 — test 1, `'an infinite pace is REFUSED and no goal is written'` (`:74-88`).**
Assertion: `expect(after).toHaveLength(0)` on the **parsed `localStorage` blob**
(`saveforit-pace.spec.ts:52-58`), keyed `'debtPlanner.rnStore'` — which matches the real seam
(`apps/rn/tests/e2e/helpers/seed.ts:11`). Traced against the pre-fix code: `Number('Infinity') > 0` is
true, so `pace = Infinity`, `addGoal` stores it verbatim (`apps/rn/src/store/store.ts:503-505`), and
`JSON.stringify` writes `"priorityPerPaycheck":null` — **a goal, so length 1.** The assertion fails on
the defect. ✅ And the file's own reasoning about *why* it asserts on the store rather than the screen
(`:19-22`) is correct: a screen assertion would have passed against the committing version.

⚠️ **The caveat, and it is the repo's own `absence-assertions` class.** The refusal is proved by a
**fixed** `page.waitForTimeout(1_500)` (`:84`) against a 500 ms debounce
(`apps/rn/src/store/persistence.ts:19`, `:113-116`). Under CI load a write that simply had not landed yet
reads identically to a write that was refused. The mitigations are real but partial — the starting count
is asserted explicitly (`:79`), the field is proven visible before typing (`:70`), and Playwright's
`click()` throws if `Start saving` is absent — and test 2 independently proves the same flow *does* write
inside 15 s. Still, test 1 alone can go green for the wrong reason; an `expect.poll` on a positive
signal (or asserting the sheet is still open) would remove the window.

**Q5 — test 2, `'a GROUPED amount is accepted…'` (`:90-104`).** Assertions:
`expect.poll(… .length).toBe(1)` (`:97`) then `expect(goal.priorityPerPaycheck).toBe(1200)` and
`Number.isFinite(...)` (`:101-103`). Against the pre-fix code `Number('1,200')` is `NaN`, `submit`
returned early, and no goal was written — **the poll times out.** Fails on the defect. ✅ The value
assertion is the right one and the comment explains exactly why a length check would not be
(`:100-101`).

**Q2 — is the mechanism real on the platform under test?** Verified rather than assumed:
react-native-web 0.21 maps `keyboardType="decimal-pad"` to `inputMode='decimal'` with `type` left as
text (`apps/rn/node_modules/react-native-web/dist/exports/TextInput/index.js:148-176`, `:357`, `:382`),
so `fill('Infinity')` and `fill('1,200')` genuinely reach the value. ⚠️ **This is more permissive than
the shipping platform:** on iOS `decimal-pad` offers no letters and no grouping comma, so `'Infinity'`
is a paste-only input on device. The guard is correct on both; the *proof* exercises the permissive one
only, and nothing in the Maestro/device layer covers the strict one.

**Q1 — the fixture.** `PREMIUM()` (`:38-49`) overrides `scenario()`'s `prefs` wholesale, which is the
established idiom (`helpers/seed.ts:34-46`). Two notes:
- `guardianIntroSeen: true` (`:45`) is **inert**. Migration v7 strips it from any incoming blob
  (`apps/rn/src/data/migrations.ts:182-183`) and it has zero production readers. Harmless, but it is
  fixture cargo that reads as if it suppresses something.
- The flow depends on `AffordabilityCard` reaching `verdict === 'short'` — the *only* branch that renders
  `Save for it →` (`apps/rn/src/components/plan/AffordabilityCard.tsx:202`) — and on
  `selectSaveForItOptions` returning at least one `prioritize` option, without which the *Set your own*
  block never mounts (`apps/rn/src/components/plan/SaveForItSheet.tsx:149`). $5,000 against a $4,000
  monthly paycheck makes both hold comfortably, and a miss would time out loudly rather than pass
  silently. Recorded as fixture coupling, not a fault.

**Q7 — what the pair blesses without saying so.** On refusal, `submit()` returns before `onClose()`
(`SaveForItSheet.tsx:92`, `:112`), so the sheet stays open, the field shows no `error` and no `note`, and
`Start saving` remains pressable. The user taps the commit button and **nothing at all happens, with no
explanation**. `TextField` carries both an `error` and a `note` channel precisely for this, and the
distinction between them was itself an audit finding (`apps/rn/src/components/ui/TextField.tsx:39-51`);
this field uses neither. The silence pre-dates the diff, but test 1 now *encodes* it as the expected
outcome — it asserts only that no goal was written, never that the user was told — so the next reader
will take it as intended behaviour. Nothing in the repo asserts on feedback for this refusal.

---

## Tally

| § | hunk-group | verdict |
|---|---|---|
| C1 | `store.ts` — finale supersedes a pending beat | `SOUND` |
| C2 | `storeActions.test.ts` — the two B2 blocks | `SOUND` (one predicate branch unpinned) |
| C3 | `SaveForItSheet.tsx` — `parseAmountField` + `testID` | `SOUND` |
| C4 | `persistence.ts` — `read.droppedRows` reported to the user | **`DEFECT`** (also untested) |
| C5 | `persistenceLifecycle.test.ts` — goal repair block | **`WEAK-TEST`** (conceals a live defect) |
| C6 | `substrateProducers.ts` — comment-only C1-half marker | `SOUND-UNPINNED` |
| C7 | `saveforit-pace.spec.ts` — the new e2e | `SOUND` |

No `REGRESSION` found: every property I could establish as previously-true is still true.
No gate was added or changed in this cluster, so no `UNREACHABLE-GATE` applies.

## Findings, by severity

1. **`DEFECT` — the migration-loss message counts other people's rows.** `persistence.ts:154-155` reports
   `read.droppedRows`, which `readLegacyStores.ts:144-154` sums across **every** candidate database
   *before* `pickLegacyStore` decides which one is the user's, and which counts **any** undecodable row,
   not only `debtPlanner.*` ones (`webkitLocalStorage.ts:166-176`). An upgrader whose container holds a
   second localStorage database — a case the reader explicitly anticipates
   (`readLegacyStores.ts:59-61`) — is told their old data was lost when it was not, in the
   highest-priority slot on Today (`(tabs)/index.tsx:232-238`). It also contradicts the exclusion rationale
   written six lines above it (`persistence.ts:123-126`). **No test would catch it either way** — every
   fixture in the repo hard-codes `droppedRows: 0`.
2. **`WEAK-TEST` + a live money defect it blesses.** `persistenceLifecycle.test.ts:383-386` asserts a
   repaired pace is *finite*; the harm it names (`:376-379`) is the *cap being removed*. `readMoney`
   repairs `'Infinity'` to **`0`** (`migrations.ts:45-53`), and both engine readers treat `0` as no cap
   (`allocatePaycheck.ts:632`, `recommendedActions.ts:80-83`). The repaired store therefore allocates
   **identically** to the corrupt one — the goal funds ahead of debt, uncapped — and the test passes.
   *(The repair value lives in `migrations.ts`, outside this cluster's file list.)*
3. **`SOUND` but unpinned — the finale can still be downgraded by a plausible refactor.** The new
   predicate's `finale→beat` arm (`store.ts:64`) has no test; `payoff.kind !== pendingPayoff.kind` passes
   both new blocks while losing a persisted finale (`store.ts:740-743` keeps it across launches).
4. **Residual, pre-existing but bounding the fix's claim** — the payday roll still celebrates nothing.
   `capturePayday` / `rolloverPayCycle` / `applyPaydayLandedIntent` (`store.ts:593-605`) move balances via
   `applyRollover` (`payday.ts:98-106`) and are not wrapped in `withPayoffCelebration`, while
   `computeMilestones` excludes 100% because it is *"owned by the payoff finale"* (`payday.ts:120-121`).
   A portfolio cleared by the ordinary roll fires neither.
5. **Residual — the Save-for-it pace field refuses in complete silence.** `SaveForItSheet.tsx:92` returns
   with no `error`, no `note`, an open sheet and a live submit button; test 1 of the new spec encodes that
   silence as the expected outcome (`saveforit-pace.spec.ts:80-88`).
6. **Locale note — this site newly inherits comma-stripping.** `parseAmountField` strips grouping commas
   unconditionally on a *storefront*-level justification (`amountField.ts:20-23`). On a comma-decimal
   device locale (e.g. `fr-CA`) `1,50` was previously **refused** at this field and is now committed as
   **150**.
7. **Minor — `LeanSuggestionCard` is not quite unreachable.** `substrateProducers.ts:63` says "by
   construction"; a fixed-income user with ≥3 logged cycles who toggles `incomeVaries` in
   `PaycheckSheet.tsx:42`/`:74` satisfies both gates in `incomeLearning.ts:23-26` and reaches the card,
   with a suggestion derived from a log where actual always equalled planned.
8. **Minor — inert fixture key.** `guardianIntroSeen: true` (`saveforit-pace.spec.ts:45`) is stripped by
   migration v7 (`migrations.ts:182-183`) and has no production reader.

## What I could not determine

- **Whether `droppedRows` is ever non-zero in the field.** The whole legacy bridge is native-only
  (`migrateFromLegacy.ts:113`, `readLegacyStores.web.ts:22`), so the frequency of the C4 false alarm is
  observable only on an upgraded device with a real WebKit container. The *mechanism* is settled by
  reading; the *rate* is not.
- **The pace field on iOS native.** `decimal-pad` restricts typed input there, so whether the `'Infinity'`
  path is reachable at all on device depends on paste behaviour I cannot exercise from this repo. The new
  e2e proves the guard on react-native-web only.
