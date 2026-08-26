# S1 · PASS 2 · AUDITOR D — the plan cards, the Guardian engine, and `(tabs)/index.tsx`

**Pinned:** `4b58d75` (working tree `22b4909`; `git -C … diff --stat 4b58d75..HEAD` = `docs/…/BRIEF.md` only,
no source). **Branch:** `v1.7-dev`. **Read-only** — no source file edited, created or deleted.

## 1. Result

| severity | count |
|---|---|
| **blocker** | **0** |
| **major** | **3** |
| **minor** | **2** |

| # | title | severity | where |
|---|---|---|---|
| **D2-1** | The Guardian's own one-tap "hold your line" makes the card and the forecast disagree about the band | **major** | `guardianSelectors.ts:675` · `buildMultiCycleTimeline.ts:322-323` |
| **D2-2** | [B3]'s fix over-matched: the affordability card's Undo now reverses **every** cover this cycle, not its own | **major** | `AffordabilityCard.tsx:105`, `:141-145` · `store.ts:850-859` |
| **D2-3** | The only test of the no-paycheck Today is a bare absence assertion | **major** | `tests/e2e/guardian.spec.ts:82-88` |
| N4 | `PlanSummary.cushionStatus` is computed and read by nothing | minor | `planSelectors.ts:402-404` |
| N9 | `PAYCHECK_SEGMENT.required`'s docstring now describes a different number than the one under the label | minor | `vocabulary.ts:47` |

**Every fix on my surface holds, and the two that landed nearest the money were checked in BOTH
directions.** [B5] is closed on 6 shortfall shapes and — measured, because an over-matching fix is the
likelier failure — the two states in which *"You're caught up for this paycheck."* is TRUE still render it.
[M4] conserves on 13 shapes, including the `billsReserve`-in-a-shortfall case I derived would break it and
then measured cannot occur. [M3]'s branch is correct, survives hysteresis, moves no covered cycle, and
closed two further doors nobody named.

**The one sentence for 🎯:** *the shortfall half of the Guardian's seam is closed and closed properly —
but the tight half is still open, and it is the half your own one-tap button walks the user into: after
they move $50 from their emergency fund to hold their line, the card says **Clear** and the forecast
button on that same card opens on **"Tight · $150 · $50 under."***

⚠️ **D2-1 is pre-existing** (the `+ appliedTopUp` term predates pass 1) and is reported because job ④ asks
whether the three producers still agree. **D2-2 is a regression the [B3] fix introduced** — at `bc29dfe`
that undo reversed exactly its own draw.


## 2. Sweep — blocker + major

### D2-1. The Guardian's own one-tap "hold your line" makes the card and the forecast disagree about the band — **major**

**User-facing consequence:** A premium user taps the Guardian card's own *"Move $50 from your emergency
fund"* to hold their $200 line; the card turns **Clear**, and the *"See forecast"* button on that same card
opens the cushion forecast on **this paycheck** showing **"Tight"** in amber with **"Left after essentials
$150 · $50 under"** in danger red — the $50 gap they were just told they had closed, and paid $50 of
emergency fund to close.

**Mechanism.** `computeState.ts:1-5` states the invariant: *"Every producer — the card
(`buildGuardianBrief`), the forecast (`buildMultiCycleTimeline`), and `selectPlanSummary` — must derive its
band from THIS function so they can never disagree (the card said "clear" while its own lookahead said
"tight" — the exact contradiction F4 kills)."* The three do call `computeState`, but with **different
first arguments**:

| producer | `discretionary` argument | site |
|---|---|---|
| card | `selectDiscretionary(allocation) **+ appliedTopUp(store)**` | `guardianSelectors.ts:675` |
| `selectPlanSummary` | `selectDiscretionary(allocation)` | `planSelectors.ts:403` |
| forecast | `Math.max(0, cycleNet(result))` — `paycheckAmount − totalRequired − livingExpenseReserve` | `buildMultiCycleTimeline.ts:131`, `:206`, `:322-323` |

The floors are identical for premium (`store.cushionFloor ?? 200` at `guardianSelectors.ts:672`;
`effectivePaycheckBuffer` = the same value at `selectors.ts:25`; the forecast is passed
`effectivePaycheckBuffer` at `payoffSelectors.ts:25`). **`appliedTopUp` is the only variable**, and
`selectTightTopUp` sizes its offer to exactly `floor − cushion` (`guardianSelectors.ts:298-300`), i.e. to
exactly the amount that crosses the boundary. **The designed happy path is the one that breaks the
invariant.**

**Confidence: measured.** `npx tsx`, real `createDebtStore()` + the real `applyTightTopUp` action, premium,
$2,000 paycheck · $1,850 rent · $200 floor · EF holding $1,000. `selectTightTopUp` offered
`{gap:50, topUp:50, goalId:'ef', cushionAfter:200}` — the app's own number, not mine:

```
BEFORE the top-up
   PlanHero legend "Flexible"                 = $150
   AffordabilityCard "spare"                  = $150   ✓ agree (T4.1b)
   Guardian card band                         = tight   Cushion $150
   Forecast cycle 0 "Left after essentials"   = $150   band = tight
AFTER tapping the card's own offer ($50 from Emergency Fund)
   PlanHero legend "Flexible"                 = $150
   AffordabilityCard "spare"                  = $200   ⛔ DISAGREE by $50
   Guardian card band                         = clear   Cushion $200
   Forecast cycle 0 "Left after essentials"   = $150   band = ⛔ tight
   selectPlanSummary.cushionStatus            = ⛔ tight
Undo → all four return to $150 / tight; a second Undo is a no-op (goal $1,000, entries []).
```

**Where the contradiction is rendered.** `CashRunwayChart.tsx:60-61` defaults the selection to
`cycles.findIndex((cy) => cy.net < floor - 1)` — with `net = 150` and `floor = 200`, **that index is 0**, so
the screen opens on the current cycle; `:204` prints `STATE_LABEL[cy.guardianState]` = **"Tight"** in
`c.accent.warning`, and `:102`/`:213` print `150 · 50 under` in `c.accent.danger`. The route is reached from
`onSeeForecast={() => router.push('/cushion-forecast')}` — `(tabs)/index.tsx:349`, a control on the card
that just said Clear. The free Progress read has the same shape:
`CashFlowSection.tsx:98-102` captions the whole section from `cycles.some(cushionStatus === 'tight')`, and
`:151` speaks `GUARDIAN_STATE_LABEL[cycle.guardianState]` = "Tight" for that cycle to VoiceOver.

**A second measured consequence of the same term, on ONE screen.** `T4.1b` (`planSelectors.ts:81-95`,
`affordability.test.ts:41-67`) exists because the hero's *"Flexible"* and the affordability card's spare —
a tap apart on Today — read different numbers. With a top-up on record they differ again, by exactly the
top-up: hero **$150**, card **$200** (printed above). On free that is literal text —
`AffordabilityCard.tsx:195` renders *"You have about $200 spare this paycheck."* under a hero legend saying
*"Flexible $150"*. On premium it moves the verdict: a $200 purchase is `short` (*"you'd come up about $50
short"*) before the move and `tight` (*"Yes, but tight"*) after it, i.e. the emergency-fund money moved in
to hold the line is immediately re-offered as spendable.

**Would anything catch it? No — and the one test in the class picked the member that works.**
`guardianSelectors.test.ts:324-327` is the only test that combines a top-up with a band, and its fixture is
`topUp: 20` against a `gap` of `50` (`amount 2000 · bills 1750 · min 100 → discretionary 150, floor 200`):
a top-up **too small to cross the floor**, so the band cannot move and the row *"`tight` survives"* is true
of a top-up the product would never offer. Brief rule 2, in the fix's own new test. Beyond that,
`grep -rn "cushionStatus\|guardianState\|computeState" apps/rn/src --include=*.test.ts` returns **3 hits
in total** — `paydayActivityContent.test.ts:81` (the Live Activity mirrors `brief.state`),
`guardianSelectors.test.ts:285` (a comment), `paywallLead.test.ts:27` (a hard-coded literal). **No test
anywhere asserts that two producers agree.** `packages/core/guardian/testComputeState.ts` tests the
function, which is not where the disagreement lives.

⚠️ **This is pre-existing, not introduced by the fix range** — `+ appliedTopUp` predates pass 1. It is
reported here because job ④ asks whether the three producers still agree, and **measured, on the designed
path, they do not.** The shortfall half of the seam is closed (§3 N3); the tight half is open.

### D2-2. [B3]'s fix over-matched: the affordability card's Undo now reverses **every** cover this cycle, not its own — **major**

**User-facing consequence:** A premium user covers a $200 couch with $50 from their emergency fund, closes
the app, reopens it, covers a $100 lamp with $30 — the card says *"moved $30 from Emergency Fund"* — then
taps **Undo**, and **$80** goes back to the emergency fund: the couch is still in the plan with its cover
silently withdrawn and the cushion $50 lower, with nothing on screen saying so.

**Mechanism.** The undo is store-derived, the message it undoes is component state, and the store keeps
**one entry per SOURCE, not per draw**:

- `apps/rn/src/store/store.ts:815-826` — `applyTightTopUp` accumulates within a source:
  `mine && mine.goalId === goalId ? { ...mine, amount: mine.amount + drawn } : …`.
- `apps/rn/src/store/store.ts:850-859` — `undoTightTopUp(source)` removes **the whole entry** and returns
  `mine.amount` to the goal.
- `apps/rn/src/components/plan/AffordabilityCard.tsx:105` — `undo()` calls
  `store_.getState().undoTightTopUp('affordability')` while `:141-145` prints the amount from
  `applied.cover.amount`, which is `useState` (`:46`) seeded by the LAST `coverAndApply` (`:96`).
- The card early-returns its applied state (`:131`), so a second cover requires the component to remount —
  **an app relaunch, or entering/leaving the walkthrough** (`(tabs)/index.tsx:859` swaps `TodayContent`
  for `TutorialRun`, a different tree). `applied` is not persisted; the store entry is.

⛔ **This is a regression the [B3] fix introduced.** At `bc29dfe` the undo was
`applyTightTopUp(applied.cover.goalId, -applied.cover.amount)` against an accumulating scalar
(`store.ts:766-783` at that pin), so `-30` subtracted exactly 30 and left the earlier $50 draw standing.
The fix correctly killed the cross-source teleport and **took the per-draw granularity with it.**
The Guardian's own undo is unaffected — `selectAppliedTopUp` reads the entry from the store
(`guardianSelectors.ts:253-259`), so the amount it shows and the amount it returns are the same number.
**Only the affordability card displays from component state.**

**Confidence: measured.** `npx tsx`, real `createDebtStore()` + the real wired actions, premium,
$2,000 · rent $1,850 · floor $200 · EF $1,000:

```
t0 seed                         EF=1000  cycleTopUp=undefined                       purchases=[]
t1 couch $200 + $50 cover       EF=950   entries=[{affordability, ef, 50}]          purchases=[p1:200]
   card text: "Added Couch + moved $50 from Emergency Fund to hold your line"
   ── card unmounts (relaunch / walkthrough): `applied` → null, entry persists ──
t2 lamp $100 + $30 cover        EF=920   entries=[{affordability, ef, 80}]  ⚠️ 80    purchases=[p1:200,p2:100]
   card text: "Added Lamp + moved $30 from Emergency Fund to hold your line"
t3 Undo (of the LAMP)           EF=1000  ⛔ +$80 returned, entries=[]  purchases=[p1:200]  ⛔ couch uncovered
```

Control at the same pin, Guardian source: apply $50 → Undo → EF back to $1,000, `entries: []`; a **second**
Undo is a no-op (measured) — that half of [B3] holds.

⚠️ **The STORE is behaving as specified** — `store.ts:817` documents *"Re-tapping the same source
accumulates within that source"*, and `storeActions.test.ts:144-157` pins it (`200` then `100` → `300`).
**The defect is at the card seam**: the store owns the undo and the component owns the sentence, and after
a remount the component's number is stale by exactly the earlier draw.

**Would anything catch it?** No. All 20 `applyTightTopUp`/`undoTightTopUp` call sites in the test tree are
in `storeActions.test.ts` (16) and `topup-sources.spec.ts`; the same-source accumulation case
(`:144-157`) never undoes, and every undo case (`:174`, `:205`, `:218-226`, `:256`) applies each source
**once**. **No test asserts that the amount the affordability card DISPLAYS equals the amount its Undo
returns** — which is the only assertion that could red here. Brief rule 2, in the guard written for this
exact fix.

### D2-3. The only test of the no-paycheck Today is a bare absence assertion — **major**

**User-facing consequence:** If Today ever renders blank for a user who finished onboarding without
entering a paycheck — the exact state `(tabs)/index.tsx:668-672` documents as reachable — that user is
stuck on an empty screen with no way to add a paycheck, and **every gate in the tree stays green.**

**Mechanism.** `apps/rn/tests/e2e/guardian.spec.ts:82-88` is the only test that seeds the no-plan store,
and its entire body after the navigation is one absence assertion:

```ts
await seedStore(page, scenario({ paycheck: { amount: '' }, debts: [] }));
await page.goto('/');
// The app still boots to Today; the Guardian card is simply absent (no crash, no empty shell).
await expect(page.getByText('PAYDAY GUARDIAN')).toHaveCount(0);
```

⛔ **The comment asserts two things and the code asserts one.** *"The app still boots to Today"* and
*"no empty shell"* are exactly what `toHaveCount(0)` is true of when nothing rendered — brief rule 7, which
this project has shipped green over twice. Today's real content in that state is the
`"Set up your paycheck"` `PromptCard` (`(tabs)/index.tsx:288-298`, reached because
`selectPlanState` returns `'no-paycheck'` for a null allocation, `planSelectors.ts:342`).

**Measured — the enumeration, not a sample.** Searched the whole test tree, no directory list:

```
grep -rn "Set up your paycheck\|no-paycheck" apps/rn/tests/e2e/
  → apps/rn/tests/e2e/demo-containment.spec.ts:94  await expect(...).toHaveCount(0)     ← also an absence
```

**One hit in the entire tree, and it is another absence assertion.** `route-smoke.spec.ts` does own the
blank-route class — its docstring calls it *"this project's nastiest regression class"* and it asserts
`document.body.innerText.length > 40` for `/` — but it seeds `scenario({ prefs: { onboardingComplete } })`,
i.e. **the populated plan**, never `paycheck.amount: ''`. **No test anywhere asserts positively that the
no-paycheck Today renders anything at all.**

⚠️ **Scoped honestly:** the test's *title* claim (the Guardian card must not appear) is still falsifiable —
a card appearing would red it. What is unfalsifiable is the half its own comment states, and that half is
the blocker-class one. Adding `await expect(page.getByText('Set up your paycheck')).toBeVisible();` before
the absence line closes it.

## 3. Measured, and NOT a defect

### N1. B5 is CLOSED, and the fix did not over-match — measured on 8 shapes

`countOutstandingRequired` (`apps/rn/src/store/planSelectors.ts:271-276`) counts OBLIGATIONS through a
key set, and `(tabs)/index.tsx:508` now passes `allocation.unfundedRequiredItems ?? []` unconditionally
with `shortfallAdviceOwnedElsewhere={!!recovery}` at `:509`. Probe (`npx tsx`, real
`selectAllocation` / `selectRequiredRows` / `countOutstandingRequired` / `selectRecoveryPlan` /
`selectPaydayGuardian` on `createDefaultStore()` fixtures):

```
B5-1  rent 1000 PAID · electric 120 · phone 80        premium  shortfall 200   rows=[Rent [handled]]
      unfunded=[Electric 120, Phone 80]  outstanding=2   zero-state? no
B5-2  $500 in · everyday 500 · rent 900 · elec 120 · visa min 40
      premium  shortfall 1060  rows=[]  unfunded=[Rent 900, Electric 120, Visa 40]
      outstanding=3  zero-state? no                       (pass 1: outstanding=0, GREEN "caught up")
B5-3  $1,000 · rent 900 · elec 300 · phone 80 · visa min 50
      premium  shortfall 330  rows=[Rent 900, Electric (partial) 100]
      unfunded=[Finish Electric 200, Phone 80, Visa 50]   outstanding=4 for 4 obligations
      FREE control                                        outstanding=4  (pass 1 measured 5)
EDGE-1 living expenses eat the paycheck (bill 500, everyday 1200)
      shortfall 500  rows=[]  unfunded=[Rent 500]  outstanding=1  zero-state? no
EDGE-2 genuinely caught up (rent 400 PAID, nothing else)  outstanding=0 → zero-state RENDERS ✓ preserved
EDGE-3 a bill dated 2027, none due this cycle            outstanding=0 → zero-state RENDERS ✓ preserved
EDGE-4 autopay + unfunded remainder                       outstanding=2, zero-state? no
```

⚡ **Both directions were checked.** The original defect is gone on every shortfall shape, the partial
double-count is gone (4 for 4, both tiers), and the two states in which "You're caught up for this
paycheck." is TRUE still render it. The `shortfallAdviceOwnedElsewhere` copy is reachable and correct:
`selectRecoveryPlan` returns `null` unless `shortfall > 0` (`recoverySelectors.ts:28`) and `recovery` is
`null` for free (`index.tsx:155`), so `!!recovery ⟺ premium ∧ shortfall > 0` — exactly when
`RecoveryPlanSection` renders (`PaydayGuardianCard.tsx:342`, `isPremium && recovery`).

### N2. M4 conserves — measured on 13 shapes, including the one I predicted would break it

`PlanHero.tsx:82` is `Math.max(0, summary.requiredTotal - summary.shortfall)`. I derived algebraically
that a non-zero `billsReserve` **in a shortfall** would make the segments over-sum by exactly
`billsReserve`, then measured it: `expense_reserve` is allocated only after `shortfall === 0 && remaining
> 0` has already consumed the paycheck (`allocatePaycheck.ts:525-554`), so `billsReserve` is 0 on every
short cycle and the case does not exist. Modelled `PlanHero.tsx:64-99` line for line:

```
  ✓ 1  healthy $2000 · rent 900        head 2000  Req 900  · Spoken 0    · Flex 1100  Σ2000
  ✓ 2  short $1000 · bills 1280        head 1000  Req 1000                            Σ1000
  ✓ 3  short + everyday 300            head 1000  Req 700  · Spoken 300               Σ1000
  ✓ 4  everyday 1200 > paycheck        head 1000  Req 0    · Spoken 1000              Σ1000
  ✓ 5  short + a PAID bill             head 1000  Req 1000                            Σ1000
  ✓ 6  short + reserve contribution    head 1000  Req 1000  (billsReserve = 0)        Σ1000
  ✓ 7  covered + reserve contribution  head 2000  Req 900  · Spoken 150 · Flex 950    Σ2000
  ✓ 8  short + a $200 windfall         head 1200  Req 1200                            Σ1200
  ✓ 9  short + a debt minimum          head 1000  Req 1000                            Σ1000
  ✓ 10 kitchen sink (paid + everyday + reserve)   Req 800 · Spoken 200                Σ1000
  ✓ 11 FREE tier, short                head 1000  Req 700  · Spoken 300               Σ1000
  ✓ 12 exactly break-even              head 1000  Req 1000                            Σ1000
  ✓ 13 short with a prefunding pot     head 1000  Req 800  · Flex 200                 Σ1000
```

13/13 conserve. Pass 1's two failing shapes (Σ1330 and Σ1700 under a $1,000 headline) now read Σ1000.

### N3. The FORECAST does share the seam — and it agrees. The fix-time claim is right for the wrong reason.

`buildGuardianBrief.ts:218`'s comment says only that `selectPlanSummary` agrees. The forecast was checked
at fix time and reported not to share the seam. **Measured: it shares it exactly** —
`buildMultiCycleTimeline.ts:322-323`'s `cycleNet(r) = r.paycheckAmount − r.totalRequired −
r.livingExpenseReserve` is `selectDiscretionary` (`planSelectors.ts:74-76`) with the `Math.max(0, …)`
lifted out to the call site (`:131`, `:206`). So on a shortfall it is negative → clamped to 0 →
`computeState(0, floor, anyPriorBand)` is `at-risk` for every prior band (`computeState.ts:39-58`: base is
`at-risk`; from `at-risk`, `0 ≤ atRiskLine+50`; from `tight`, `0 < atRiskLine`; from `clear`, immediate).
It reaches the same verdict as the new branch, by a different route. Verified rather than inherited:

```
A  PREMIUM shortfall 300 + $200 applied top-up   brief=at-risk · summary=pressure · forecast cycle0=at-risk  AGREE
A2 same store, no top-up (control)               brief=at-risk · summary=pressure · forecast cycle0=at-risk  AGREE
C  FREE   shortfall 300 + $200 applied top-up    brief=at-risk · summary=pressure · forecast cycle0=at-risk  AGREE
```

⚠️ It agrees **because a shortfall drives `cycleNet` negative** — which is the same class of contingent
arithmetic the retired premise was made of. It is recorded here as measured, not as a law.


### N4. One of the three producers is INERT — `PlanSummary.cushionStatus` has no renderer

`planSelectors.ts:402-404` computes it through `toCushionStatus(computeState(…))`, and
`grep -rn "cushionStatus" apps/rn/src` returns **6 hits**, whole result shown:

```
apps/rn/src/store/guardianSelectors.ts:635    cycles.slice(1) — the FORECAST's cycles, not the summary's
apps/rn/src/store/guardianSelectors.ts:702    the same lookahead object
apps/rn/src/components/progress/CashFlowSection.tsx:98,100,134   TimelineCycle.cushionStatus
apps/rn/src/components/progress/TimelineLedger.tsx:69            TimelineCycle.cushionStatus
apps/rn/src/store/paywallLead.test.ts:27                          a hard-coded fixture literal
```

**Not one reads `summary.cushionStatus`.** So the F4 three-producer rule has, in practice, two live
producers and a third whose output nothing consumes. Not a defect — recorded because it changes what
"they agree" is worth: agreement between the card and `selectPlanSummary` is unobservable, and only the
card-vs-forecast half (D2-1) reaches a screen.

### N5. The hero and the sheet it opens agree about "Spoken for"

`(tabs)/index.tsx:763-764` passes BOTH `everyday={summary?.everydayReserve}` (the REQUEST) and
`everydayHeld={summary?.everydayHeld}` (what the paycheck held). `SpokenForSheet.tsx:49-50` totals
`everydayHeld + billsReserve` and prints `amount={everydayHeld}`; `everyday` is used only in the hint
*"this paycheck holds $X of the $Y you set"*. Measured on shape 4 (`everyday 1200 > paycheck 1000`):
`everydayReserve = 1200`, `everydayHeld = 1000`, and the hero legend and the sheet's echo both read
**$1,000**. The T6.3 · L4-1 request-vs-held defect is not re-opened at this seam.

### N6. The widget's spoken Guardian read was ALREADY immune to M3

`apps/rn/src/widget/snapshot.ts:45-47` tests `brief.shortfall && brief.shortfall > 0` **before** it looks
at `brief.state`, so Siri said *"This paycheck is very tight — you're about $400 short of your
obligations"* throughout the defect. The card was the only surface that read the band first. Recorded
because it is the same brief serving two consumers with only one of them wrong, which is a large part of
why the defect survived.

### N7. The M3 branch closed two more doors that nobody named — verified at the line

Both gate on `state === 'clear'`, so a shortfall can no longer reach either: `guardianSelectors.ts:120`
`selectRiskAcknowledgment` (the *"Good news — this paycheck looks clear after all."* ack,
`(tabs)/index.tsx:576-583`) and `PaydayGuardianCard.tsx:156` / `:458` `showProofStrip`. Measured on the
M3 store (shortfall $300 + a $200 top-up on record): `state = at-risk` at both tiers, so neither fires.
Before the branch that store returned `clear` and both would have.

### N8. The branch cannot over-match on the copy — placement checked, not assumed

`buildGuardianBrief.ts:218` sets `state` ahead of every copy branch, and none of the three early returns
(`pausedDeploy` `:232`, `stale` `:250`, `shortfall` `:284`) keys off `state` — each keys off `shortfall`
and the input flags, then spreads `viz`. Measured: on the M3 store the `title`, `detail`, `safeMove` and
`lookahead` are identical with and without the top-up record; the only fields that move are `cushion`
(200 vs 0) and `reachedFloor` (true vs false). Hysteresis cannot override it either — with
`priorGuardianBand: 'clear'` the band is still `at-risk`.

### N9. `PAYCHECK_SEGMENT.required`'s docstring is now stale — **minor**, and auditor A owns the verdict

`packages/core/copy/vocabulary.ts:47` still reads *"Bills + minimums that must be paid this cycle."* The
number under that label is now what the paycheck FUNDED: on shape 2 the legend reads **Required $1,000**
while **$1,280** is owed. No user-visible consequence — the label names a segment OF the paycheck,
`PlanHero.tsx:130-135` prints *"Short this paycheck"* directly beneath, and the Guardian names the gap —
so `minor` by the brief's own bar. The word's only other use (`PaydayCaptureSheet.tsx:303`) is a per-row
caption for a bill with no due date, not a total, so it is unaffected.

### N10. The cushion Stat still credits a top-up during a shortfall — the loud half is fixed, this half is honest

Same M3 store: `cushion = 200`, `reachedFloor = true`, `displayCushion = 200`, and the bar draws full with
the floor line at its right edge. **All of it is `c.accent.danger` now** (`tone['at-risk']`,
`PaydayGuardianCard.tsx:106`, `:111`, `:284`), under *"This paycheck won't cover everything"* and above
*"You're about $300 short…"*. The user did move $200 into checking, so *"Cushion $200"* is true, and
nothing on the card contradicts anything else on it. Recorded so pass 3 does not re-open pass 1's finding
1 on the strength of the Stat alone.

### N11. `PaidOffFinale` / `PaidOffBeat` are Modals, so the ack ranking's z-order claim is loose — not a defect

`(tabs)/index.tsx:238-241` ranks `data-repairs` above a celebration (*"outranks every other ack, including
a celebration"*), but `PaidOffFinale.tsx:86` and `PaidOffBeat.tsx:104` are `<Modal>`s, so a celebration
draws over the repairs card regardless of the ranking. **No moment is lost:** `DataRepair.acknowledged`
persists, so the card is still there when the modal is dismissed, and the once-ever finale is stamped in
the store (`store.pendingPayoff`, READ and never set at `(tabs)/index.tsx:191`) rather than in component
state. The ranking's real job — keeping the ack SLOT from showing something else — still holds.

### N12. `TUTORIAL_STEPS[index]` is unchecked at `(tabs)/index.tsx:879-881`, and it cannot go out of range

`step.id` would throw during the walkthrough's render and there is no error boundary in `apps/rn/src`.
Every writer clamps: `resumeIndex` returns 0 when the saved step is past the end (*"the arc shrank → start
over rather than dead-end"*, `tutorialPath.ts:212-218`), `nextIndex` / `prevIndex` clamp (`:224-230`), and
`finaleOnly` uses `TUTORIAL_STEPS.length - 1` (`tutorialSession.ts:341`). A latent shape, not a live
defect.

## 4. Could not determine

- **Which side of D2-1 is RIGHT.** The card counts money that genuinely moved into checking; the forecast
  plots per-cycle FLOW, into which a savings transfer is not income. Both are defensible in isolation —
  what is not defensible is that they render the same three-word vocabulary for the same cycle. Whether
  the remedy is *"the forecast learns about `appliedTopUp`"* or *"the card's band stops counting it"* is
  🎯's call. **The disagreement itself is measured and is not in doubt.**
- **Whether D2-2's remount also happens on an ordinary iOS tab switch.** Two remount routes are proven
  from source: an app relaunch clears `useState`, and `(tabs)/index.tsx:854-859` swaps `TodayContent`
  for `TutorialRun` (a different tree) when the walkthrough starts or ends. Whether expo-router's tab
  navigator unmounts Today on a tab change is a runtime question. **It does not change the finding** —
  the relaunch route alone is ordinary — only how often it fires.
- **No Playwright run.** Every e2e verdict here comes from reading the spec plus a whole-tree `grep`, not
  from executing it. `npm run test:app` WAS run and is green (`✅ App-layer regression tests: ALL
  PASSED`) — i.e. green with all three findings present. `npm run lint:s1-coverage` is green
  (`188 surface files classified · 116 unswept`).
- **Whether already-persisted predictions are consistent with the new band.**
  `guardianPrediction.ts:37` stamps `predictedState: brief.state`, so a shortfall cycle now predicts
  `at-risk` where it could previously predict `clear`, and `calibrationScore` grades against it. The new
  prediction is the more honest one; whether a `cycleHistory` entry stamped under the OLD band now grades
  differently is a question about existing users' data that I could not settle from source. Recorded,
  not claimed.

## 5. Swept and found clean — BY PATH

⚠️ **Scope, re-derived from the instrument.** `npm run lint:s1-coverage -- --report` at this pin:
**188 files · 116 unswept**. Job ④'s share is `apps/rn/src/app/(tabs)/index.tsx` (`never`),
`apps/rn/src/components/plan/*` (37 files, all `s1p1` from pass 1), `packages/core/guardian/*`
(12 files, all `never · s1p1`), and the plan/Guardian e2e specs (all `never`). ⚠️ `partial` counts as
unswept, so `AffordabilityCard.tsx`, `GraduationCards.tsx`, `GuardianScorecard.tsx`,
`LeanSuggestionCard.tsx`, `PaidOffBeat.tsx`, `PaydayGuardianCard.tsx`, `PlanHero.tsx`, `ShareCard.tsx` and
`WindfallSheet.tsx` are all still unswept by the instrument's reckoning even though pass 1 read them.

⚠️ **`packages/core/timeline/buildMultiCycleTimeline.ts` is NOT on the S1 surface** — it does not appear
in the report. I read it anyway, because job ④ names the forecast; **it should be on a surface**, since
it is one of the three producers `computeState`'s own docstring binds.

### Carries a finding — swept, NOT clean

- `apps/rn/src/store/guardianSelectors.ts` — D2-1 (`:675`, `:298-300`)
- `packages/core/timeline/buildMultiCycleTimeline.ts` — D2-1 (`:131`, `:206`, `:322-323`)
- `apps/rn/src/components/plan/AffordabilityCard.tsx` — D2-2 (`:46`, `:96`, `:105`, `:141-145`)
- `apps/rn/src/store/store.ts` — D2-2 (`:815-826`, `:850-859`) *(auditor C owns this file; cited only at
  the two lines the affordability seam reads)*
- `apps/rn/tests/e2e/guardian.spec.ts` — D2-3 (`:82-88`)

### Read IN FULL and found clean at the blocker + major bar

- `apps/rn/src/app/(tabs)/index.tsx` — **all 1,097 lines**, the brief's named target. Checked
  specifically: the [B5] re-wiring (`:508-509`), the [B3] undo re-wiring (`:349`, `:362`), the
  read/write store split (`store` vs `engineStore` vs `store_` — every call site), the `activeAck`
  ranking, the celebration path, `planState`/`allocation` null-coverage (they cannot disagree —
  `selectPlanState` returns `'no-paycheck'` for exactly `!allocation`, `planSelectors.ts:342`, so
  `content` is never null on a live plan and there is no blank-Today route), the `SpokenForSheet` props
  (N5), the tutorial index bounds (N12), and the `PaydayCaptureSheet` `capturePayday` third argument.
- `apps/rn/src/components/plan/PlanHero.tsx` — the M4 change and the whole segment build (N2, N9)
- `apps/rn/src/components/plan/RequiredActionsCard.tsx` — the [B5] change and both zero states (N1)
- `apps/rn/src/components/plan/SpokenForSheet.tsx` (N5)
- `apps/rn/src/components/plan/RecoveryPlanSection.tsx` — the `testID` change only; the arithmetic is
  unchanged since pass 1's item 7
- `packages/core/guardian/computeState.ts` — every branch, and the `0 → at-risk` claim proved for all
  three prior bands
- `packages/core/guardian/buildGuardianBrief.ts` — the new branch and every early return after it (N8)
- `packages/core/timeline/buildMultiCycleTimeline.ts` — `cycleNet`, both `computeState` calls,
  `toCushionStatus`

### Read at the parts this job needed, and clean there

- `apps/rn/src/components/plan/PaydayGuardianCard.tsx` — the tone map, the `brief.detail` render gate
  (`:301`), the cushion Stat + bar (`:252-296`), the recovery/top-up/attestation mutual exclusion
  (`:316`, `:342`, `:350`), the proof strip gate (`:156`, `:458`)
- `apps/rn/src/components/plan/CashRunwayChart.tsx` — the default selection (`:60-61`), the state chip
  (`:204`), the `under` figure (`:102`, `:213`)
- `apps/rn/src/components/plan/AffordabilityImpactBar.tsx` — which figures it prints (`after`, `floor`;
  never `before`)
- `apps/rn/src/components/plan/PaidOffFinale.tsx`, `PaidOffBeat.tsx` — Modal-ness and the dismiss path (N11)
- `apps/rn/src/components/payday/PaydayCaptureSheet.tsx` — the one `PAYCHECK_SEGMENT.required` site (`:303`)
- `apps/rn/src/components/progress/CashFlowSection.tsx` — the caption + the spoken band label (`:98-102`, `:151`)
- `apps/rn/src/components/progress/TimelineLedger.tsx` — the `cushionStatus` tone map (`:69`)
- `apps/rn/src/app/cushion-forecast.tsx` — the floor it passes and the premium gate
- `apps/rn/src/store/planSelectors.ts` — `selectDiscretionary`, `selectSpendable`, `countOutstandingRequired`,
  `requiredRowKey`/`unfundedItemKey`, `selectPlanSummary`, `selectPlanState`
- `apps/rn/src/store/guardianSelectors.ts` — `selectAppliedTopUp`, `appliedTopUp`, `selectTightTopUp`,
  `selectAffordability`, `selectPaydayGuardian`, `selectRiskAcknowledgment`
- `apps/rn/src/store/topUpSelectors.ts` — `topUpEntries`, `buildCycleTopUp` (whole file)
- `apps/rn/src/store/selectors.ts` — `effectivePaycheckBuffer`, `selectAllocation`, `BASE_PAYCHECK_BUFFER`
- `apps/rn/src/store/recoverySelectors.ts` — whole file; `recovery ≠ null ⟺ premium ∧ shortfall > 0`
- `apps/rn/src/store/guardianPrediction.ts` — whole file
- `apps/rn/src/store/tutorialSession.ts`, `apps/rn/src/store/tutorialPath.ts` — the index clamps only
- `apps/rn/src/widget/snapshot.ts` — `buildGuardianSpoken` (N6)
- `packages/core/engine/allocatePaycheck.ts` — `totalRequired` (`:325-327`), the `shortfall` derivation
  (`:358-382`), the `cushion_buffer` / `expense_reserve` rungs (`:525-554`)
- `packages/core/copy/vocabulary.ts` — `PAYCHECK_SEGMENT`, `GUARDIAN_STATE_LABEL`

### Test files read (my surface's specs — all `never` on the coverage report)

- `apps/rn/tests/e2e/plan-hero-conserves.spec.ts` — **sound.** The invariant is asserted, the parse is
  guarded against a null-sum (`not.toBeNull()` precedes the sum, so a hero that renders no segments cannot
  satisfy `0 === 0`), the healthy branch pins a measured `950`, and the fixture's shape is re-asserted.
- `apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts` — **sound.** Positive assertion on the Guardian's
  OWN sentence (`/about \$400 short/`), a no-top-up control, and a covered counter-fixture whose positive
  `/Your line.s held/` is what a blanket-`at-risk` plant would destroy. ⚠️ Its covered fixture's top-up
  (`200` against a `1,700` headroom) cannot move a band — see D2-1.
- `apps/rn/tests/e2e/no-bills-branch.spec.ts` — **sound**, including the four tests added for [B5]. The
  zero-state absence assertions are each preceded by a positive `Required actions` visibility check, and
  each is paired with a positive `required-outstanding-count` assertion (`assert the honest state by
  name`). The 5-obligations/6-entries fixture's own comment explains why a second fully-unfunded bill is
  load-bearing, and I re-derived it: with one unfunded bill the two error modes cancel at 4.
- `apps/rn/tests/e2e/recovery.spec.ts` — the [B5] change (a page-wide `toHaveCount(0)` proxy replaced by a
  `testID`-scoped `not.toContainText`) is a strict improvement and is preceded by a positive
  `toContainText('Essential 1 · Essential 2 · Essential 3')` on the same locator.
- `apps/rn/tests/e2e/topup-sources.spec.ts` — **sound for one draw per source**, and that is its limit
  (D2-2).
- `apps/rn/tests/e2e/cushion-forecast.spec.ts` — clean; its `toHaveCount(0)` is preceded by the matching
  positive assertion earlier in the same test.
- `apps/rn/tests/e2e/affordability.spec.ts` — clean, but note for the record: it drives only the
  `comfortable` and `short` verdicts. **AS-3 (the shortfall → blanket-0 spare) has no e2e coverage** —
  its only guard is `guardianSelectors.test.ts:333-336`.
- `apps/rn/tests/e2e/route-smoke.spec.ts` — read for the blank-route class (D2-3).
- `apps/rn/src/store/guardianSelectors.test.ts` — the M3 block (`:283-345`), read in full. Careful work:
  a precondition explicitly labelled as one, a control, a covered counter-fixture, and a `tight` survivor.
  ⚠️ The `tight` survivor is the one member of its class that cannot move (D2-1).
- `apps/rn/src/store/storeActions.test.ts` — the four top-up blocks (`:140-260`)
- `packages/core/guardian/testBuildGuardianBrief.ts` — the new `shortWithHeadroom` row (`:59-72`), which
  is the assertion that reds if the branch is ever deleted as redundant. Verified it is genuinely
  falsifiable: `input({ shortfall: 180, discretionary: 400, kept: 400, floor: 200 })` reaches
  `computeState(400, 200)` = `clear` without the branch.

### Not opened, and not mine

The S4-owned tutorial/demo files in `components/plan/` (`CoachMarkLayer`, `DemoAutoEntry`, `DemoCaption`,
`DemoDirector`, `DemoDock`, `TutorialCoach`, `TutorialFence`, `TutorialInviteCard`, `TutorialOverlay`,
`tutorialStage`); the chart/canvas files pass 1 swept and the fix range did not touch (`CushionBarCanvas*`,
`CushionBarChart`, `MeshGradient*`, `CashRunwayCanvas*`, `CashRunwaySkiaChart`, `FloorImpactBar`,
`CaptureSlate`, `useCaptureAutoConfirm`, `GraduationCards`, `ShareCard`, `WindfallSheet`,
`PaycheckSheet`, `CushionFloorSheet`, `LeanSuggestionCard`, `MilestoneAckCard`,
`PayoffInvitationCard`, `RecommendedActionsCard`, `GuardianProofStrip`, `GuardianScorecard`,
`DataRepairsCard`, `dataRepairsCopy`, `SaveForItSheet`, `AppStoreCta*`, `ExampleCanvasMarker`); the
remaining nine `packages/core/guardian/` files, unchanged in the fix range and read in full by pass 1
(`affordability`, `calibrationScore`, `holdbackComposition`, `notificationDecision`, and the five other
`test*.ts`); and every e2e spec outside the plan/Guardian set (auditors B and C).

---

**Nothing under `apps/`, `packages/`, `scripts/`, `.github/`, `.maestro/` or `docs/` was edited, created,
moved or deleted except this report.** Every probe was written into the session scratchpad and run with
`npx tsx --tsconfig ./tsconfig.json` from `apps/rn`; none was written into the repo tree. **Gates run:**
`npm run test:app` (green — `✅ App-layer regression tests: ALL PASSED`, i.e. green with all three
findings present) and `npm run lint:s1-coverage` (green). No Playwright suite was run.
