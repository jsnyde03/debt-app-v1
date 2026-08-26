# S1 · AUDITOR D — the plan cards and the guardian engine

**Pinned:** `bc29dfe`, branch `v1.7-dev`.
**Surface:** `apps/rn/src/components/plan/` (every inventoried file except `DataRepairsCard.tsx`,
`dataRepairsCopy.ts(+test)`, `SaveForItSheet.tsx`) + `packages/core/guardian/` (all 12).
**Bar:** blocker + major.

## Result

**1 blocker · 2 majors.** All three measured with runnable probes, not read off the source.
48 files opened (45 of 45 assigned, plus the 3 excluded ones in the same directory). All 12 files of
`packages/core/guardian/` read for the first time by any pass; no blocker or major found in that package
— its one defect is a **carried premise in a comment** (`buildGuardianBrief.ts:191-193`) that the app-layer
selector has since falsified, and that is finding 1.

| # | title | severity | surface |
|---|---|---|---|
| 1 | A shortfall renders as a calm "all good" shield with the amount short suppressed | **major** | `PaydayGuardianCard.tsx:301`, `:111` |
| 2 | Premium + a shortfall → *"You're caught up for this paycheck."* over unpaid bills | **blocker** | `RequiredActionsCard.tsx:77`, `:121-124` |
| 3 | `PlanHero`'s paycheck split stops conserving in a shortfall | **major** | `PlanHero.tsx:64-83` |

⚡ **All three are the same state — a shortfall — and every one of them fails in the direction of
reassurance.** Findings 1 and 2 can appear on Today *at the same time*: the Guardian card showing a green
shield with "Cushion $200 · line held", and the Required-actions card below it saying "You're caught up for
this paycheck", on a paycheck the app itself has computed as short. That is the state this product exists
for, and it is the least-tested one in the tree: `npm run test:app` is green with all three present, and
`no-bills-branch.spec.ts` — four tests written for finding 2's exact sentence — has `shortfall === 0` in
every one of its four stores.

## Sweep — blocker + major

### 1. A shortfall can render on the Guardian card as a calm "all good" shield with the amount short suppressed — **major**

**User-facing consequence:** A user who moves savings across to hold their cushion line and *then* goes
short in the same cycle sees the Payday Guardian card draw the green "all-clear" shield, a cushion bar
reading **"Cushion $200 · Your line $200"** with the line held — and the sentence *"You're about $400 short
of the expenses and minimums due before your next paycheck"* **never renders**, because the card only
prints `brief.detail` when the state is `at-risk`.

**Mechanism** (all three steps verified, and the middle one is a carried premise that has gone false):

1. `packages/core/guardian/buildGuardianBrief.ts:191-194` computes the band with
   `computeState(discretionary, floor, input.priorBand)` and its comment states the premise:
   *"A shortfall drives `discretionary` to 0 → at-risk, so it needs no separate branch here."*
2. `apps/rn/src/store/guardianSelectors.ts:653` passes
   `discretionary: selectDiscretionary(allocation) + topUp`, where `topUp = appliedTopUp(store)`
   (`guardianSelectors.ts:277-279`) is the §2.10 cash the user moved from a goal, keyed to the cycle.
   `selectDiscretionary` **is** 0 on any shortfall (verified below), but the `+ topUp` term is not —
   so the premise in step 1 is false whenever a top-up is on record for the cycle.
   ⚠️ `selectTightTopUp` refuses to *offer* a top-up while `allocation.shortfall > 0`
   (`guardianSelectors.ts:290`) — but `appliedTopUp` has no such guard, so an **already applied**
   top-up keeps lifting `discretionary` after the cycle goes short.
3. `apps/rn/src/components/plan/PaydayGuardianCard.tsx:301` gates the Guardian's voice on
   `stale || brief.pausedDeploy || brief.state === 'at-risk'`. With the band no longer `at-risk`, the
   shortfall sentence — the only place the dollar figure appears in the card's own copy — is dropped.
   `PaydayGuardianCard.tsx:111` then picks `tone['clear'] = { color: c.text.secondary, icon: 'gpp-good' }`.

**Confidence: measured.** Probe run with `npx tsx` from `apps/rn`, against the real
`selectPaydayGuardian` / `selectRecoveryPlan` / `selectAllocation` on a store built from
`createDefaultStore()` (paycheck $2,000 · Rent $1,900 · Surprise $400 · floor $200 · Vacation goal $1,000 ·
`cycleTopUp` $200 for the current cycle):

```
=== PREMIUM (no prior band)
  shortfall(engine) = 400 | brief.state = clear | brief.shortfall = 400
  card icon/tone   = gpp-good / slate ('all good' shield)
  title            = "This paycheck won’t cover everything"
  detail rendered? = false
  Stat "Cushion"   = 200 | bar reachedFloor = true | "Your line" = 200
  RecoveryPlanSection rendered? = true (gap $400)

=== PREMIUM prior=at-risk        (hysteresis only softens it to amber, still not at-risk)
  brief.state = tight | detail rendered? = false | Stat "Cushion" = 200 | reachedFloor = true

=== FREE
  brief.state = clear | detail rendered? = false | Stat "Cushion" = 200 | reachedFloor = true
  RecoveryPlanSection rendered? = false
  free invite      = catch-up-plan pitch (no amount)
```

Control, same store with `cycleTopUp` removed:
`brief.state = at-risk · icon gpp-bad / danger · detail rendered? = true · Cushion $0`.
So the *only* variable is the recorded top-up.

**Worst case is FREE**: no `RecoveryPlanSection`, so with the detail line suppressed **no dollar figure for
the shortfall appears anywhere on the card**; the only honest signal left is the title string. (Free reaches
this state by having been premium when the top-up was applied — `subscriptionPlan` flips, `cycleTopUp`
persists — so it is narrow but real.) For premium the `RecoveryPlanSection` still prints the $400 gap, which
is what keeps this a `major` rather than a `blocker`: the number survives on the card, but the *shield, the
colour, the cushion Stat and the "line held" bar all state the opposite of the title directly above them.*

**Would anything catch it?** No.
- `packages/core/guardian/testBuildGuardianBrief.ts:57` pins the shortfall case as
  `input({ shortfall: 180, discretionary: 0 })` — it **hands the function `discretionary: 0` directly**, so
  it asserts `state === "at-risk"` about the one input shape the selector no longer always produces. It is
  a true assertion about a member, not about the class (brief rule 2).
- `apps/rn/src/store/guardianSelectors.test.ts` has no case combining `cycleTopUp` with a shortfall
  (`grep -c "cycleTopUp" apps/rn/src/store/guardianSelectors.test.ts` → 0).
- Nothing tests `PaydayGuardianCard.tsx:301`'s render gate at all.

### 2. Premium + a shortfall → "You're caught up for this paycheck." over unpaid bills — **blocker**

**User-facing consequence:** A premium user whose $1,000 paycheck went entirely on rent, with $200 of bills
still unpaid, opens Today and reads **"You're caught up for this paycheck."** in success green, directly
below a Guardian card saying *"This paycheck won't cover everything."* A free user with the identical plan
correctly gets the checklist. The app affirms a user for a paycheck they are short on.

**Mechanism:**

- `apps/rn/src/components/plan/RequiredActionsCard.tsx:77` —
  `const outstanding = rows.filter((r) => !rowHandledNow(r)).length + unfunded.length;`
- `apps/rn/src/components/plan/RequiredActionsCard.tsx:121-124` — `outstanding === 0 && hasAnyBills`
  renders `"You're caught up for this paycheck."` in `c.accent.success`.
- `rows` comes from `selectRequiredRows` (`apps/rn/src/store/planSelectors.ts:166`), which filters
  `allocation.allocations` — and `allocatePaycheck.ts:423` only pushes an allocation row when
  `coveredAmount > 0 || potShare > 0`. **A required item this paycheck cannot fund at all gets no row**;
  it lands only in `unfundedRequiredItems` (`allocatePaycheck.ts:443` for expenses, `:494` for minimums).
- `apps/rn/src/app/(tabs)/index.tsx:506` — `unfunded={recovery ? [] : (allocation.unfundedRequiredItems ?? [])}`.
  `recovery` is `isPremium ? selectRecoveryPlan(engineStore) : null` (`index.tsx:155`), so **for a premium
  user in a shortfall the unfunded list is emptied**, on the premise that `RecoveryPlanSection` covers it.
  It does show the bills — but `outstanding` is computed from the emptied array, so the *zero state* fires.

⛔ This is the same defect class the card's own comment at `RequiredActionsCard.tsx:112-120` documents
(*"P6.8.7e.3 [C5 / M2-9] — TWO zero states, and they were rendering the same sentence"*), reached through
the other door: that fix asked *"does the plan have any bills at all"* (`hasAnyBills`) and left
`outstanding === 0` as the trusted signal for *"nothing is owed."* With the unfunded list withheld, it is not.

**Confidence: measured.** `npx tsx` from `apps/rn`, against `selectAllocation` / `selectRequiredRows` /
`rowHandledNow` / `selectRecoveryPlan` / `selectPaydayGuardian`:

```
=== PREMIUM — $1,000 paycheck, rent $1,000 marked paid, $200 of bills left unpaid
  engine shortfall      = 200 | Guardian title = "This paycheck won’t cover everything"
  rows                  = [ 'Pay Rent [handled]' ]
  unfundedRequiredItems = [ 'Pay Electric $120', 'Pay Phone $80' ]
  unfunded prop         = []
  outstanding           = 0
  >>> RequiredActionsCard renders: ⛔ "You’re caught up for this paycheck." in accent.success

=== FREE — identical plan (control)
  outstanding = 2 → renders the checklist
```

Second instance, no marked-paid bill involved — the everyday reserve consumes the paycheck:
`$500 paycheck · $500 everyday reserve · Rent $900 · Electric $120 · Visa min $40` →
`shortfall = 1060 · rows = [] · unfunded prop = [] · outstanding = 0` → the same green sentence over a
**$1,060** gap.

**The same root cause has two further measured consequences on this card (same fix, not separate findings):**

- **Obligations vanish from the checklist.** `$1,000 paycheck · Rent $900 · Electric $300 · Phone $80 ·
  Visa min $50` (shortfall $330), premium: the card renders **2 rows** — `Pay Rent $900` and
  `Pay Electric (partial) $100` — while **Phone and the Visa minimum have no row and no Mark-paid
  control anywhere on Today.** The `thisWeek` bucket header reads **$1,000** against **$1,330** owed.
- **The header pill double-counts a partial.** On the *free* side of the same plan, `outstanding` is **5**
  for **4** distinct obligations: a partially-funded bill is counted once as its `expense` row
  (`Pay Electric (partial)`) and again as its unfunded remainder (`Finish Electric`).

**Would anything catch it? No — and the gate that exists for exactly this sentence cannot.**

`apps/rn/tests/e2e/no-bills-branch.spec.ts` is a four-test suite written for this precise string, and it is
careful work (it even records that the original finding's stated mechanism was wrong). **Every one of its
four stores has `allocation.shortfall === 0`**, so `selectRecoveryPlan` returns `null` and
`index.tsx:506`'s `recovery ? [] : …` branch is **never taken**:

| test | store | shortfall |
|---|---|---|
| `:33` a debt-first user with no bills is PROMPTED | `requiredExpenses: []`, default debt, $2,000 paycheck | 0 |
| `:48` nothing due and no bills | `requiredExpenses: []`, `debts: []` | 0 |
| `:63` a user WITH bills, all handled, is still told they are caught up | `debts: []`, one bill dated **2027-01-01** | 0 |
| `:91` the no-bills branch keys off the PLAN | one bill dated **2027-01-01** | 0 |

`scenario()` defaults to `subscriptionPlan: 'premium'` (`apps/rn/tests/e2e/helpers/seed.ts:37`), so the tier
is already right and only the *state* is wrong — the suite picks the members of the class that work
(brief rule 2). `:56`'s `toHaveCount(0)` absence assertion is correctly preceded by a positive
`required-no-bills` assertion at `:54`, so brief rule 7 is satisfied.

`packages/core/engine/testAllocation.ts:67-69` asserts `basicShortfall.unfundedRequiredItems.length`, i.e.
the *engine* half, and never that the array reaches a screen. No unit/app test renders
`RequiredActionsCard` (`grep -rn "RequiredActionsCard" apps/rn/src --include=*.test.ts --include=*.test.tsx`
→ 0 hits).

⛔ **A suite that stays green with this defect present is, by the brief's own bar, a `major` in its own
right** — *"a gate or test that cannot catch the class it exists for."* Counted here rather than
separately, because it is one fix.

### 3. `PlanHero`'s paycheck split stops conserving in a shortfall — the legend sums to $1,700 under a $1,000 headline — **major**

**User-facing consequence:** In the state the hero matters most — short this paycheck — Today's headline
reads **"THIS PAYCHECK · $1,000"** with a full, ordinary-looking split bar beneath it whose legend reads
**"Required $1,400 · Spoken for $300."** The bar is drawn by `flexGrow`, so it fills 100% of its track and
gives no visual sign that the parts exceed the whole.

**Mechanism:** `apps/rn/src/components/plan/PlanHero.tsx:64-83`.

- `:64` `const paycheck = summary.requiredTotal + summary.remainingAfterRequired;` —
  `remainingAfterRequired` is **un-clamped** (`apps/rn/src/store/planSelectors.ts:353`), so the headline is
  exactly `allocation.paycheckAmount`. Correct.
- `:65` `const required = Math.max(0, summary.requiredTotal);` — this is what is **OWED**, not what the
  paycheck funded, and in a shortfall it is larger than the headline.
- `:80-83` `everyday`/`billsReserve`/`free` are all `Math.max(0, …)` **HELD** figures. `free` clamps to 0
  and absorbs the negative remainder — so the overflow disappears instead of showing.
- `:97-102` the segments are built from those values and `:162` renders each with
  `flexGrow: seg.value`, which normalises whatever it is given to the full track width.

⚠️ The file's own comment at `:74-76` states the invariant this breaks — *"with a $300 paycheck and a $400
request the segments summed to $400 of a $300 paycheck… **A partition that does not conserve is not a
partition**"* — and the fix it documents (T6.3 · L4-1, `everydayReserve` → `everydayHeld`) closed the
*living-expense* route into non-conservation while leaving the *shortfall* route open. Same invariant, other
door. It is a carried premise that a reader will take as "this now conserves"; measured, it does not.

**Confidence: measured.** `npx tsx` from `apps/rn` against `selectAllocation` + `selectPlanSummary`,
re-implementing `PlanHero.tsx:64-83` line for line:

```
=== healthy
  hero headline "THIS PAYCHECK" = 2000
  legend segments = Required $950 · Spoken for $400 · Flexible $650
  segment sum = 2000 | headline = 2000 ✓ conserves

=== shortfall — required exceeds the paycheck  ($1,000 · bills 900+300+80 · min 50)
  engine shortfall = 330 | status = short
  hero headline "THIS PAYCHECK" = 1000
  legend segments = Required $1330
  segment sum = 1330 | headline = 1000 ⛔ DOES NOT CONSERVE

=== shortfall + everyday reserve  ($1,000 · bill 1400 · everyday 300)
  engine shortfall = 700 | status = short
  hero headline "THIS PAYCHECK" = 1000
  legend segments = Required $1400 · Spoken for $300
  segment sum = 1700 | headline = 1000 ⛔ DOES NOT CONSERVE
```

⚠️ Not a blocker: `summary.status` is `'short'`, so `PlanHero.tsx:112-118` does render
*"Short this paycheck"* in `onNavy.warning` beneath the bar. Every individual figure is separately true.
What misleads is the **relationship** the bar asserts between them.

**Would anything catch it?** No. `grep -rn "remainingAfterRequired" apps/rn/src --include=*.test.ts` returns
exactly three hits, and none is a negative value:
- `apps/rn/src/store/affordability.test.ts:62` re-derives the `Flexible` segment
  (`Math.max(0, summary.remainingAfterRequired − (everydayHeld + billsReserve))`) to prove the T4.1b
  `Flexible`/`spare` agreement — on a **covered** store, so it never reaches the clamp;
- `apps/rn/src/store/paywallLead.test.ts:26` hard-codes `remainingAfterRequired: 500, shortfall: 0`;
- `affordability.test.ts:57` is a comment.

No test renders `PlanHero` at all, and `npm run test:app` is green with this present (run 2026-08-26,
`✅ App-layer regression tests: ALL PASSED`).


## Measured, and NOT a defect — recorded so the next pass does not re-open them

1. **`computeAffordability`'s `amount` argument is not sanitised** (`packages/core/guardian/affordability.ts:29-33`
   sanitises `discretionary` and `floor` but not `amount`). A `NaN` amount would return
   `{ verdict: 'comfortable', cushionAfter: NaN }` — a "yes, you can afford it" over an unreadable number.
   **Not reachable.** The only two entry points both refuse non-finite input first:
   `apps/rn/src/components/plan/AffordabilityCard.tsx:66-67` gates on `parseAmountField(amount) != null`
   (`packages/core/utils/amountField.ts:38-43` returns `null` unless `Number.isFinite(n) && n > 0`), and
   `apps/rn/src/store/guardianSelectors.ts:389` re-checks `!Number.isFinite(amount) || amount <= 0 → null`.
   Two independent guards, so this is a latent shape, not a live defect. ⚠️ A third caller would inherit
   neither guard.
2. **`AffordabilityCard` reads through `useAppStore` and writes through `useActiveStore`** — superficially
   the reverse of the shape `apps/rn/src/store/StoreContext.tsx:20-24` warns about. **Not a defect:**
   `apps/rn/src/store/useAppStore.ts:19` is `useStore(useActiveStore(), selector)`, so both resolve to the
   same store. Reads and writes cannot diverge under the tutorial sandbox.
3. **`GuardianProofStrip` and `GuardianScorecard` cannot disagree about the accuracy figure.** The strip
   prints `Reads matched · {pow.score.matches}/{pow.score.n}` (`GuardianProofStrip.tsx:23`) and the
   scorecard prints `{score.matches} of {score.n} reads matched` (`GuardianScorecard.tsx:68`). Both resolve
   to the same `selectCalibrationScore(store)` — `guardianSelectors.ts:88` for the strip,
   `apps/rn/src/app/cushion-forecast.tsx:41` for the scorecard — with no per-caller `CalibrationOptions`.
   The brief's "does any figure disagree with the same figure elsewhere" question, answered: no.
4. **`MilestoneAckCard.tsx:27`'s `MESSAGE[milestone.threshold]` is an unchecked lookup, and there is no
   error boundary anywhere in `apps/rn/src`** (`grep -rn "componentDidCatch|getDerivedStateFromError" apps/rn/src`
   → 0 hits), so an out-of-range threshold would throw during the render of Today. **Not reachable:**
   `packages/core/debt/computeMilestones.ts:2` fixes `MILESTONE_THRESHOLDS = [25, 50, 75, 100]`, and the one
   writer — `apps/rn/src/store/payday.ts:128` — takes `find((m) => m.threshold < 100)`, so the persisted
   value is always 25/50/75. A hand-edited backup could still carry a bad one (`runMigrations` spreads
   `...r` at `apps/rn/src/data/migrations.ts:398` without validating `pendingMilestone`), but
   `apps/rn/src/data/backup.ts:139` refuses a newer-version backup, so there is no non-adversarial route.
   **Recorded as measured-not-a-major, not as a fix.**
5. **The `QA_TOOLS = true → false` flip at P6.17 takes nothing out of this file set.**
   `grep -rn "qaEnabled|QA_TOOLS|CAPTURE_DEMO|EMBED_DEMO|__DEV__" apps/rn/src/components/plan/ packages/core/guardian/`
   returns hits in only these places, all outside my assignment or already inert:
   `TutorialOverlay.tsx:487` (S4-owned, excluded); `CaptureSlate.tsx:143` and `useCaptureAutoConfirm.ts:64`
   (`CAPTURE_DEMO`, inlined false by Metro in every non-capture build — *already* unreachable today, so the
   flip changes nothing); `DemoAutoEntry.tsx:42`, `DemoDock.tsx:100`, `AppStoreCta.tsx` (`EMBED_DEMO`, same).
   **No plan card and no guardian module changes behaviour at the flip.** `apps/rn/src/config/qa.ts:9` is
   still `true` at this pin, as intended.
6. **Every `.web.tsx` fork in my directory checked.** Four exist: `CashRunwayCanvas.web.tsx`,
   `CushionBarCanvas.web.tsx` and `MeshGradientCanvas.web.tsx` are each a `WithSkiaWeb` lazy-load wrapper
   around the identical `*Chart` component the native file renders directly — no behavioural divergence,
   only a `ChartSkeleton` / `null` fallback while CanvasKit resolves. `AppStoreCta.web.tsx` is a real `<a>`
   rather than a `Pressable`, deliberately, and correctly carries `rel="noopener noreferrer"`.
   **None of findings 1–3 is platform-specific** — all three are computed values plus a JSX gate.
7. **`RecoveryPlanSection`'s "covers your gap" claim reconciles.** `RecoveryPlanSection.tsx:37-39`
   computes `remaining = max(0, gap − Σ checked)` and gates the *"Deferring these covers your $X gap"* copy
   on `remaining <= 0.005`, so the sentence cannot claim a cover the selection does not produce. The
   `!plan.closeable && allChecked` branch at `:151-152` is the honest "even deferring everything" case, and
   `:78`'s `disabled={coverSummary.more === 0}` means the expander is never offered over nothing.
8. **The `heldReserve` / `Cushion` disjointness holds across the Guardian card.**
   `buildGuardianBrief.ts:183` clamps `heldReserve` to `kept`; `PaydayGuardianCard.tsx:284` labels the Stat
   with `displayCushion(brief)` (= `cushion − heldReserve`, `guardianSubjects.ts:51-53`) while `:261-262`
   feeds the bar `cushionFrac = brief.cushion / domain` — reserve **included**, as `CushionBarChart.tsx:14-18`
   documents — and `reserveFrac` as the far-left sub-zone. The visible legend, the drawn zones and the
   `groupLabel` at `:207-209` name the same three amounts in the same left-to-right order. No disagreement.
9. **`selectAffordability`'s spare figure no longer contradicts `PlanHero`.** `guardianSelectors.ts:396`
   uses `selectSpendable(base) + appliedTopUp(store)`, not `selectDiscretionary` — the T4.1b fix for the
   measured *"Flexible $675"* vs *"about $850 spare"* contradiction. Verified at the line, not from the
   comment above it.

## Could not determine

- **Whether findings 1 and 3 look as bad on device as they read.** Both are about the *relationship*
  between figures and a colour or a proportion, and my evidence is the computed values plus the render
  expressions. The Guardian card's `clear` tone is `c.text.secondary` (slate), not a green — how strongly
  that reads as "all good" beside the `gpp-good` shield glyph is a device judgement I cannot make from
  source.
- **Whether `RecoveryPlanSection`'s deferral actually closes the gap by `item.amount`.**
  `packages/core/recovery/buildRecoveryPlan.ts` and `apps/rn/src/store/recoverySelectors.ts` are **not on
  the S1 inventory** and are not in my assignment; I read only the consumer. The card's own arithmetic is
  self-consistent (item 7 above); whether `plan.gap` and `plan.safeToDefer[].amount` are commensurable is a
  question for whoever owns those two files.
- **The `PaidOffFinale` "once-ever" guarantee.** The finale component itself is correct, but whether the
  moment can be *missed* is decided by `apps/rn/src/store/celebrationSelectors.ts` and
  `apps/rn/src/app/(tabs)/index.tsx`, neither of which is on the S1 surface. Not examined.
- **`CashRunwaySkiaChart.tsx` at runtime.** `Skia.Path.MakeFromSVGString` returning `null` is handled
  (`:64` and `:76` both null-guard), but whether a malformed `smoothPath` output can produce a *partial*
  path rather than `null` is only observable on device / under CanvasKit.
- **The absence of any React error boundary in `apps/rn/src`** is real (0 hits for
  `componentDidCatch|getDerivedStateFromError|ErrorBoundary`) and it is what turns any render-time throw on
  Today into a dead screen. I found no *reachable* throw in my file set (item 4), so I am recording the
  condition rather than claiming a finding — it is a cross-surface question, not an S1 one.

## Swept and found clean — BY PATH

⚠️ **Coverage boundary, re-derived rather than taken from the brief.** The brief said *"49 of the surface's
72, and 45 of them are unswept: 36 have NEVER been examined."* Re-derived from
`scripts/surface-coverage.s1.json` and `scripts/surface-coverage.ts:95-143`, my assignment is **45
inventoried files**: 33 in `apps/rn/src/components/plan/` (all 37 inventoried plan files minus the four
already on the ratchet — `DataRepairsCard.tsx`, `dataRepairsCopy.ts`, `dataRepairsCopy.test.ts`,
`SaveForItSheet.tsx`) plus all 12 in `packages/core/guardian/`. The three other files physically present in
`components/plan/` — `AppStoreCta.tsx`, `AppStoreCta.web.tsx`, `ExampleCanvasMarker.tsx` — are
**deliberately excluded** from the surface by `surface-coverage.ts:140-142` and `S4_OWNED` at `:95-100`;
I opened them anyway and list them separately. **I opened all 45 + 3 = 48. Nothing in my assignment was
left unopened.** (`npm run lint:s1-coverage` re-run at this pin: `✅ s1-coverage: 72 surface files
classified · 58 unswept`.)

**Carries a finding — swept, NOT clean:**

- `apps/rn/src/components/plan/PaydayGuardianCard.tsx` — finding 1
- `apps/rn/src/components/plan/RequiredActionsCard.tsx` — finding 2
- `apps/rn/src/components/plan/PlanHero.tsx` — finding 3

**Swept and found clean at the blocker + major bar — `apps/rn/src/components/plan/` (30 files):**

- `apps/rn/src/components/plan/AffordabilityCard.tsx`
- `apps/rn/src/components/plan/AffordabilityImpactBar.tsx`
- `apps/rn/src/components/plan/CaptureSlate.tsx`
- `apps/rn/src/components/plan/CashRunwayCanvas.tsx`
- `apps/rn/src/components/plan/CashRunwayCanvas.web.tsx`
- `apps/rn/src/components/plan/CashRunwayChart.tsx`
- `apps/rn/src/components/plan/CashRunwaySkiaChart.tsx`
- `apps/rn/src/components/plan/CushionBarCanvas.tsx`
- `apps/rn/src/components/plan/CushionBarCanvas.web.tsx`
- `apps/rn/src/components/plan/CushionBarChart.tsx`
- `apps/rn/src/components/plan/CushionFloorSheet.tsx`
- `apps/rn/src/components/plan/FloorImpactBar.tsx`
- `apps/rn/src/components/plan/GraduationCards.tsx`
- `apps/rn/src/components/plan/GuardianProofStrip.tsx`
- `apps/rn/src/components/plan/GuardianScorecard.tsx`
- `apps/rn/src/components/plan/LeanSuggestionCard.tsx`
- `apps/rn/src/components/plan/MeshGradientCanvas.tsx`
- `apps/rn/src/components/plan/MeshGradientCanvas.web.tsx`
- `apps/rn/src/components/plan/MeshGradientChart.tsx`
- `apps/rn/src/components/plan/MilestoneAckCard.tsx`
- `apps/rn/src/components/plan/PaidOffBeat.tsx`
- `apps/rn/src/components/plan/PaidOffFinale.tsx`
- `apps/rn/src/components/plan/PaycheckSheet.tsx`
- `apps/rn/src/components/plan/PayoffInvitationCard.tsx`
- `apps/rn/src/components/plan/RecommendedActionsCard.tsx`
- `apps/rn/src/components/plan/RecoveryPlanSection.tsx`
- `apps/rn/src/components/plan/ShareCard.tsx`
- `apps/rn/src/components/plan/SpokenForSheet.tsx`
- `apps/rn/src/components/plan/WindfallSheet.tsx`
- `apps/rn/src/components/plan/useCaptureAutoConfirm.ts`

**Swept and found clean — `packages/core/guardian/` (12 files — every one, none previously read by any pass):**

- `packages/core/guardian/affordability.ts`
- `packages/core/guardian/buildGuardianBrief.ts` *(carries the false premise cited in finding 1 at
  `:191-193`; the module is otherwise clean — its `safeAmount` sanitisers, `amt()`'s
  never-`$0`-for-a-nonzero rule at `:146`, and the `heldReserve ≤ kept` clamp at `:183` all hold)*
- `packages/core/guardian/calibrationScore.ts`
- `packages/core/guardian/computeState.ts`
- `packages/core/guardian/holdbackComposition.ts`
- `packages/core/guardian/notificationDecision.ts`
- `packages/core/guardian/testAffordability.ts`
- `packages/core/guardian/testBuildGuardianBrief.ts`
- `packages/core/guardian/testCalibrationScore.ts`
- `packages/core/guardian/testComputeState.ts`
- `packages/core/guardian/testGuardianPartition.ts`
- `packages/core/guardian/testNotificationDecision.ts`

⚠️ **All six guardian test files are wired into the regression runner** —
`packages/core/testing/runRegressionTests.ts:26-31` imports every one, so none is an orphan. Five throw on
the first failed assertion (later assertions in the same file then never run — brief rule 6; that is the
house style here, not a defect of these files), and `testComputeState.ts` instead counts failures and
`process.exit(1)`s at `:44-46`.

⚠️ **One coverage gap inside a clean file, stated so it is not mistaken for coverage:**
`testBuildGuardianBrief.ts` never exercises `buildGuardianBrief.ts:341-359`'s `deployedBeforeDebt` branch
(the 3.7.A3.2 *"goes into {goal}, which funds before debt payoff"* copy). It is **not** unpinned — it is
covered one layer up, at `apps/rn/src/store/guardianSelectors.test.ts:243`.

**Opened, but outside the inventory by deliberate exclusion (3 files):**

- `apps/rn/src/components/plan/AppStoreCta.tsx` — clean
- `apps/rn/src/components/plan/AppStoreCta.web.tsx` — clean
- `apps/rn/src/components/plan/ExampleCanvasMarker.tsx` — clean *(S4-owned)*

**Not opened, and not mine:** the S4-owned files in the same directory — `CoachMarkLayer.tsx`,
`DemoAutoEntry.tsx`, `DemoCaption.tsx`, `DemoDirector.tsx`, `DemoDock.tsx`, `TutorialCoach.tsx`,
`TutorialFence.tsx`, `TutorialInviteCard.tsx`, `TutorialOverlay.tsx`, `tutorialStage.ts` — and the four
already-swept ratchet files (`DataRepairsCard.tsx`, `dataRepairsCopy.ts`, `dataRepairsCopy.test.ts`,
`SaveForItSheet.tsx`).

---

**Nothing under `apps/`, `packages/`, `scripts/`, `.github/`, `.maestro/` or `docs/` was edited, created,
moved or deleted except this report.** `git status --porcelain` at the end of the run showed only the four
auditors' report files. Every probe was written into the scratchpad, never into the repo tree.
**Gates run:** `npm run test:app` (green — `✅ App-layer regression tests: ALL PASSED`, i.e. the suite is
green with all three findings present) and `npm run lint:s1-coverage` (green). No long suite was run.
