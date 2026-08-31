# B2 findings — store core (pass 6)

Subject: the store, persistence, migrations, forms, id minting, reserve, sandbox/tutorial/demo sessions.
Manifest: 48 files. Origins from ROUTING-ORIGINS.tsv.

## B2-1 — `major` — the demo's write fence rests on a premise that expired, and what actually holds the line is an unrelated flag

**Origin:** `apps/rn/src/store/StoreContext.tsx` (stale-read) · `apps/rn/src/store/realWriteGuard.ts`
(stale-read) · `apps/rn/src/store/boundedRun.ts` (stale-read) · `apps/rn/src/store/demoSession.ts` (neighbour)

⚠️ **I chased this as a blocker and it is not one. The correction is the finding.** Recorded in full because
the brief asks for the condition the consumer evaluates, not the example — and the example I cited did not
render.

**Consequence (latent).** Three separate places state, as the reason the user's plan is safe during a
bounded run, that *"every demo exit is terminal — the session ends BEFORE the destination renders."* That
sentence is **false for the explore demo**. Nothing bad follows from it today, for a reason none of the
three mention. Revert or narrow that unrelated reason and a purchase made from inside a demo is silently
dropped, with a Sentry report blaming a leak that did not happen.

**File and line — the three statements.**
- `apps/rn/src/store/StoreContext.tsx:58-61` — *"[D18] keeps that premise true for the demo as well as the
  walkthrough: a demo is a KIOSK … so `/more` and `/paywall` are never reached with a demo provider above
  them. The guard therefore stays strict for both, and needs no per-caller scope flag."*
- `apps/rn/src/store/demoExit.ts:21-24` — *"`/paywall` writes the real store by design … a purchase made
  from a still-mounted demo would be reported as the exact thing the guard exists to catch, and at Phase 6
  that lands in Sentry as a real-plan-corruption alert for a working checkout."*
- `scripts/check-sandbox-writes.ts:68-69` — the allow-list reason exempting `paywall.tsx`. (→ **B2-2**.)

**The measurement — what is true, and what is not.**
1. **The kiosk premise is dead.** `boundedRun.ts:50-55`: `useNavigationHeld()` is
   `inTutorial || (inDemo && demoMode === 'scripted')`. `(tabs)/_layout.tsx:38-39` preventDefaults tab
   presses only on that. **In `mode: 'explore'` the tabs are live** — `boundedRun.ts:42-45` says so in
   words: *"The explore demo breaks that coincidence … navigating IS the point."*
2. **The explore run has no `exitDemo('/paywall')` at all.** `DemoDock.tsx:43` returns `null` for
   `mode !== 'scripted'`, and its `exitDemo('/paywall')` (`:116`) is one of only **two** `exitDemo` call
   sites in the repo. The explore run's only exit is `ExampleCanvasMarker.tsx:108` →
   `exitDemo(hasRealPlan ? '/' : '/onboarding')`.
3. **The provider covers the paywall.** `_layout.tsx`: `<StoreProvider store={demoSandbox ?? appStore}>`
   wraps the whole `<Stack>`, `<Stack.Screen name="paywall">` included. Whenever `demoSession.sandbox` is
   non-null, `useNoRealWritesGuard` has raised `sandboxDepth` on **every** route.
4. **The veto would fire.** `paywall.tsx:207` / `:231` call `appStore.getState().setSubscriptionPlan('premium')`.
   `store.ts:330` consults `refuse`; `realWriteGuard.ts:135-146` sees `sandboxDepth > 0`,
   `realWriteAllowed === false`, and `forbiddenRealStoreChanges` returns `['subscriptionPlan']` — it is a
   plan key, so `TUTORIAL_WRITABLE_PREFS` never applies. The write is **dropped**, and `paywall.tsx:208-209`
   still says *"You're on Premium"* and calls `router.back()`.
5. ⛔ **And it is unreachable anyway, for a reason no fence mentions.** The only in-app pushes to
   `/paywall` outside `exitDemo` are the three `PremiumInvite` hosts, and every one is gated on
   `!isPremium` read through the ACTING store: `PaydayGuardianCard.tsx:420`, `AffordabilityCard.tsx:236`
   (`:44` `store.subscriptionPlan === 'premium'`), `WindfallSheet.tsx:131` (`:46`, same). **Both bounded
   runs seed the sandbox as premium** — `demoRun.ts:149` `personaScenario(stage.state, { premium: true })`,
   `tutorialSession.ts:159` `const opts = { premium: true, … }` — so `isPremium` is `true` inside any run and
   **no invite renders**. `PaydayGuardianCard.tsx:167-169` states the dependency from the other side:
   *"[D9] removed the need: the sandbox itself now runs premium."*
   The remaining route, `more.tsx:219`, is fenced by `more-button.tsx:33-37` on `useInBoundedRun()`, which
   **does** include explore.

   ⚡ **The coupling is written down elsewhere, as a COPY consequence rather than a safety one.**
   `tutorialPath.ts:53-61`: *"The `PremiumInvite` doesn't render during a walkthrough, so this is where the
   whole conversion framing lands."* That is the same fact, filed under why the finale's `bodyByRun` has to
   name premium — not under why the write fence holds.

   ⚠️ **And the switch that would flip it is already built and already tested.** `personaScenario` takes
   `{ premium }` (`sandboxScenarios.ts:34-42`, `:296`), and `sandboxScenarios.test.ts:165-166` asserts
   *"a scenario can be scripted FREE (the demo contrast)"* — a capability **no production caller uses**
   (`demoRun.ts:149` and `tutorialSession.ts:159` both hardcode `premium: true`). One caller passing
   `premium: false` renders the invite inside a bounded run and opens the path in step 4.

**Mechanism, as a hypothesis.** `3.5.10` split the demo into two modes, correctly forked the *navigation*
predicate, and left the *write* fence's justification describing the world before the split. The class is
the one `StoreContext.tsx:63-65` names by hand — *"What would break it: mounting this provider around a
subtree that can navigate to a real-store writer"* — and the containment now rests on `[D9]`, a **product
copy decision about not dressing free as premium**, which `tutorialPath.ts:169-188` shows is live and
argued-over. A safety property held up by a copy decision is a guard that survives its own un-fix: flip
`premium` back to mirroring the user's tier (the shape `tutorialSession.ts:144-146` records as the prior
behaviour) and the leak opens with nothing watching.

**Remedy — NOT VERIFIED.** ⚠️ Do **not** narrow `refuseRealStoreWrite`, and do not "fix" a defect that is
not currently reachable. What is measurably wrong is the three sentences and the one gate entry. The
cheapest correct move is to **restate the reason as what is actually true** ("no paywall entry renders
inside a bounded run, because the sandbox runs premium — [D9]") in all three places, so the next person to
touch `[D9]` meets the coupling. A structural alternative — route `PremiumInvite` through `exitDemo` so the
original premise becomes true again — is untested and touches 3 call sites.

## B2-2 — `major` — `lint:sandbox` exempts `paywall.tsx` on a reason that is no longer the reason

**Origin:** instrument (`scripts/check-sandbox-writes.ts`).

**Consequence.** The gate whose stated job is *"makes it IMPOSSIBLE to add a sandbox leak silently"*
(`:14-16`) carries an exemption whose justification expired. The file is still correctly exempt — but for a
different reason than the one written down, so the gate cannot tell anyone when the real reason goes away.

**File and line.** `scripts/check-sandbox-writes.ts:68-69`:

    'apps/rn/src/app/paywall.tsx':
      '[D18] the demo exits are TERMINAL — the session ends BEFORE /paywall renders, so `setSubscriptionPlan` never runs under a sandbox provider',

**The measurement.** Read end to end (`:105-131`), the checker does exactly two things: regex-match
`/^\s*import\s*\{[^}]*\bappStore\b[^}]*\}\s*from\s*['"][^'"]*appStore['"]/` per file (`:100`), and look the
path up in `ALLOWED`. It has one staleness check (`:135`) — *does the file still import the singleton* —
and **none for whether the stated reason still holds**. Its own taxonomy (`:35-42`) files this entry under
shape 3, *"unreachable during a bounded run,"* which by B2-1 is now true because the sandbox seeds premium
(`demoRun.ts:149`, `tutorialSession.ts:159`), **not** because exits are terminal: `exitDemo(` has 2 call
sites repo-wide, `'/paywall'` has 6, and 4 of those are ordinary pushes.

**A second entry of the same shape, not measured.** `:64-67` exempts `onboarding.tsx`, `CompletionStep`,
`FirstDebtOrBillStep` and `PaycheckStep` on *"a demo exit tears the session down before landing here."*
`exitDemo` does tear down, so they hold through that door; I did not enumerate whether an explore run can
reach onboarding by any other route, and the shared premise is the same one that expired above.

**Mechanism, as a hypothesis.** An allow-list keyed on a path with a prose reason can detect a changed
*path* and never a changed *world*. `3.5.10` changed neither the path nor the string — only what the string
describes. This is `check-sandbox-writes`'s own header lesson (*"budget the enumeration, not the list"*) one
level up: budget the **justification**.

**Remedy — NOT VERIFIED.** For shape-3 entries the claim is partly mechanical: assert that every
`router.push`/`replace` naming an allow-listed shape-3 route is either inside `exitDemo` or inside a
component gated on `useInBoundedRun`/`isPremium`. I have not written or run it, and it may be undecidable
for `PremiumInvite`, which is a shared leaf whose gate lives in its three hosts.
⚠️ I did **not** execute `lint:sandbox` — it runs inside `lint:rn`, which this pass is forbidden to run —
so "reports green" is read off the allow-list, not observed from an exit code.

## B2-3 — `minor` — the portfolio milestone's denominator is rebuilt from the LIVE debt set every rollover, so tidying the list moves the finish line

**Origin:** `apps/rn/src/store/payday.ts` (fix-churn).

**User-facing consequence.** Delete a debt you have finished paying — the ordinary tidy-up — and the
portfolio's "% paid off" **falls backwards with no money having moved**, while the persisted high-water
stays where the bigger portfolio put it. The 25/50/75% mid-journey beat is then withheld until the user has
paid substantially more than the beat's own rule asks for.

**File and line.** `apps/rn/src/store/payday.ts:125-131`:

    const totalOriginal = reconciledDebts.reduce((sum, d) => sum + (d.originalBalance ?? d.balance), 0);
    const totalBefore   = reconciledDebts.reduce((sum, d) => sum + d.balance, 0);
    const totalAfter    = debtsAfter.reduce((sum, d) => sum + d.balance, 0);
    …
    maxProgressByDebt: { __portfolio__: store.portfolioMaxProgress ?? 0 },

and `:165` persists `portfolioMaxProgress` — **a percentage**, carried across a denominator that is not.

**The measurement.** `computeMilestones` (`packages/core/debt/computeMilestones.ts`) driven with the
portfolio row `payday.ts:128-131` builds, one variable — whether the paid-off debt row still exists.
Card `originalBalance 10000`, Loan `originalBalance 5000`; the loan reaches `$0`, the card then pays
`5000 → 4800`:

| | `totalOriginal` | progress | high-water in | 75% fires when card ≤ |
|---|---|---|---|---|
| loan row kept (control) | 15000 | **68.00%** | 66.67 → 68.00 | **$3,750** |
| loan row deleted | 10000 | **52.00%** | 66.67 → 66.67 | **$2,500** |

Deleting the row costs 16 percentage points of stated progress and **$1,250 of extra repayment** before the
beat can fire.

A second, independent instance of the same expression: `originalBalance ?? d.balance`. For an
installment-native BNPL, `prepareNewDebt` (`store.ts:274-281`) sets `originalBalance: undefined`
**deliberately** — *"skipped for BNPL, which shows 'X of N' rather than a bar"* — which is a decision about
the debt's own row. Reused here it makes the BNPL's already-repaid principal invisible AND shrinks the
denominator as it amortises. Measured, same harness, card `10000` orig at `5250 → 5050`, a `$600` BNPL
already down to `400 → 200`:

    BNPL keeps originalBalance : totalOriginal 10600, pct 50.47, fired 50
    BNPL drops originalBalance : totalOriginal 10400, pct 49.52, fired null

Same money, one field: the halfway beat fires in one and not the other.

**Mechanism, as a hypothesis.** `portfolioMaxProgress` is stored as a percentage and compared against a
percentage recomputed from a **different population** each cycle. `computeMilestones` was designed for a
*debt*, whose `originalBalance` is a fixed high-water (`raiseOriginalBalance`, `[D62]`); the synthetic
`__portfolio__` row (`:128`) borrows the machinery without borrowing that guarantee. The two per-debt
guards that make it sound — a fixed original and a per-id high-water — are exactly what the aggregate has
no equivalent of.

**Remedy — NOT VERIFIED, and the obvious one is wrong.** Do **not** give BNPLs an `originalBalance` here:
that field is read by the per-debt momentum ring, and `store.ts:277` is a deliberate product decision.
Do **not** purge on delete either. A persisted `portfolioOriginalTotal` that only ever rises (the
`raiseOriginalBalance` shape, at portfolio scale) would make the denominator monotonic — but it changes
what every existing `portfolioMaxProgress` means for installed users, so it needs a migration and I have
measured neither.

## B2-4 — `major` — the store-action suite still never DELETES anything, so the blocker fix was verified against a hand-built object

**Origin:** `apps/rn/src/store/storeActions.test.ts` (fix-churn) · `apps/rn/src/store/debtIds.test.ts` (fix-churn).

**Consequence.** `storeActions.test.ts`'s docblock claims *"comprehensive break-it coverage for the STORE
ACTIONS + money-critical TRANSITIONS."* Four money-bearing actions — `removeDebt`, `removeExpense`,
`removeGoal`, `removeLivingExpense` — are not in it, and the fix for pass 5's blocker (a deleted debt's id
re-issued, `$10,967.54` instead of `$11,467.54`, persisted) is verified against a **hand-written four-key
object**, never against a store that actually ran the delete. The gap is named in the fix's own test file
and was not closed by it.

**File and line.**
- `apps/rn/src/store/debtIds.test.ts:56-72` — *"⛔ **A GAP IS THE ONLY SHAPE THAT REUSES AN ID, AND NO
  FIXTURE HAD ONE.** … `storeActions.test.ts` contains **zero** occurrences of `removeDebt`, so the action
  that creates the dangling references was not exercised anywhere."*
- `apps/rn/src/store/debtIds.test.ts:81-93` — the fixture that replaced it:

      const storeAfterDelete = {
        debts: [{ id: 'debt-2026-09-01-1', name: 'Visa' }],
        completedRecommendedActions: [{ category: 'snowball', targetId: 'debt-2026-09-01-2', actualAmount: 500 }],
        milestoneMaxProgress: { 'debt-2026-09-01-3': 75 },
        pendingPayoff: { debtId: 'debt-2026-09-01-4' },
      };

**The measurement.** Repo-wide, excluding `node_modules`, over `*.ts`/`*.tsx`:

    grep -rn "removeDebt\b"  →  9 hits: 2 production call sites, 4 comments, 1 interface line,
                                 1 implementation, and exactly ONE test — sandboxStore.test.ts:165,
                                 which is asserting sandbox ISOLATION, not what a delete leaves behind.
    grep -rn "removeExpense|removeGoal|removeLivingExpense" over test/spec files  →  1 hit,
                                 and it is a COMMENT in demo-containment.spec.ts.
    grep -c "removeDebt|removeExpense|removeGoal" apps/rn/src/store/storeActions.test.ts  →  0

So `debtIds.test.ts`'s own sentence is still true of the tree it ships in: the actions that create the
dangling references are exercised in exactly one place, for an unrelated purpose.

**Mechanism, as a hypothesis.** The finding was diagnosed as being about *the reserved-id set*, so the fix
and its test were written at that unit. The fixture reproduces the SHAPE of a post-delete store by hand —
which makes it a restatement of the diagnosis rather than a check on it. A real `DebtStore` carries ~40
top-level keys; the hand fixture carries 4, all of which the author already knew to include. `[D69]`'s
enumeration lesson applies exactly: a fixture assembled from the fields you thought of cannot fail on the
field you did not.

⚠️ **What I could NOT determine, and it is the useful half.** The class this leaves unmeasured is *"what
outlives a delete."* I traced one member end to end while looking for a live instance:
`removeDebt` (`store.ts:505-507`) filters `debts` only, so a `completedRecommendedActions` entry for the
deleted debt survives, and `computeCompletedRecommendedTotal`
(`packages/core/engine/recommendedActions.ts:57-63`) sums **every** non-`external` entry with no check that
the target exists — subtracting it from `computeFlexibleCash` (`:41-44`). That is **not** a defect:
`RecommendedActionsCard.tsx:63-73` renders `completed` straight from the store, so the row and its Undo
survive the delete too, and the user can release the money. **But nothing asserts that**, in either
direction, and it is the pair that has to stay in step.

**Remedy — NOT VERIFIED.** Drive the reported sequence through the wired store, not the helper: seed a
plan, `toggleRecommendedDone`, `removeDebt`, then mint via `newDebtId(currentDate, reservedDebtIds(store))`
and roll — asserting the new debt's balance is the untouched figure. The same shape covers the other three
deletes. ⚠️ I did not write it and did not run `npm run test:app` (twelve lanes, one 6 GB box), so I have
not confirmed such a test passes today — only that it does not exist.

## B2-5 — `minor` — the balance clamp in `verifyDebtBalance` is shaped like a NaN guard and is not one

**Origin:** `apps/rn/src/store/store.ts` (stale-read).

**Consequence.** None demonstrated — say so plainly. Two clamps sit ~220 lines apart in one file, both
written to keep a bad number out of the store, and only one of them can. This is reported as a **stale
guard**, not as a live defect: I could not reach it from any caller.

**File and line.** `apps/rn/src/store/store.ts:509` (and identically `:526` for the batch):

    const balance = Math.max(0, Math.round(verifiedBalance * 100) / 100);

versus `:733-737`, the same file's other numeric entry point:

    const safe = Number.isFinite(floor) ? floor : 200;
    const snapped = Math.round(Math.max(0, Math.min(1000, safe)) / 25) * 25;

**The measurement.** `node -e "Math.max(0, NaN)"` → **`NaN`**. `Math.max` propagates NaN; it does not
floor it. So `verifyDebtBalance(id, NaN, date)` writes `balance: NaN`, which `JSON.stringify` persists as
`null` — and `migrations.ts` then reads that back as an unreadable balance and repairs it to `$0`, i.e. the
debt is filed under PAID OFF on the next launch. `setCushionFloor` is immune to exactly this because it
asks `Number.isFinite` first; `storeActions.test.ts:359-362` pins that (`'NaN floor → guarded to the 200
default'`) and there is **no** counterpart assertion for `verifyDebtBalance` — its coverage
(`storeActions.test.ts:374-387`) tests `-300`, `1234.567` and an unknown id, all finite.
`updateDebt` (`:476-503`) has no clamp at all, and its `balanceChanged` test is `merged.balance !== existing.balance`,
which is **`true`** for a NaN against itself.

**Reachability — I traced it and it does not close.** All three production callers are guarded:
`(tabs)/index.tsx:203` passes the literal `0`; `money.tsx:629` and
`payday/PaydayCaptureSheet.tsx:121` pass `view.currentBalance` from the projection;
`PaydayCaptureSheet.tsx:133-139` runs typed input through `parseNonNegativeAmount` and falls back to the
estimate on `null` — with a docblock explaining that `Number('')` being `0` is exactly this class. **So no
NaN is currently reachable.** What is wrong is the guard, not the outcome.

**Mechanism, as a hypothesis.** `Math.max(0, x)` reads as *"never below zero"* and is taken for
*"always a number"*. The file contains the correct form 220 lines away, so the two were written at
different times against different ideas of what the clamp is for. The safety here currently comes from
three callers each doing their own parsing — the "wired to a subset of sites" shape this surface has
recorded repeatedly.

**Remedy — NOT VERIFIED.** `Number.isFinite(verifiedBalance) ? … : <keep the existing balance>` at both
seams, matching `setCushionFloor`'s shape. ⚠️ Do **not** default to `0` — a `0` balance files the debt
under PAID OFF, which is `S1.5.3 [B4]`'s recorded harm arriving by a different door. I have run neither.
