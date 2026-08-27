# Debt Planner — the DEFERRED BACKLOG

> **The register the plan consults, split out of [`DEBT_ELEVATION_PLAN.md`](DEBT_ELEVATION_PLAN.md)
> on 2026-08-26** *(🎯: "The document should be the source of truth and concise")*. The plan is the
> DRIVER — what is being built and what is next; this is what was deliberately NOT built, and why.
>
> ⛔ **Grouped by WHERE IT LANDS, because that is how it gets read.** A bullet ending in
> `→ **destination**` is routed; the S1-scan group at the end holds what has not been routed yet, and
> **that is a state, not a filing cabinet** — the next switch-in for each destination should empty it.

---

## → P6.8.9 — the verification pass

- ⭐ **EVERY FIX IN f THAT NEEDED A SECOND ATTEMPT FAILED ON A PROPERTY ITS FINDING NEVER MENTIONED.** For
  each built fix, ask **what the site did BEFORE that it must still do**. *(f, whole-cluster)*
- ⭐ **c, d and e closed LISTS; f gated CLASSES, three for three.** Re-check those classes, **not** those ids.
  *(f, whole-cluster)*
- ⚠️ **f's own tests inherit f's own lesson** — `a11y-row-labels`, `coach-marks` and the affordability live
  region all assert the fix's **INTENT**, so none would catch the next fix breaking an adjacent property.
  That is exactly how A1-7 got through twice. *(f)*
- ⛔ **A test written to prove a fix is scoped to the fix's INTENT; the regression lives in what the fix ALSO
  did.** `useInert` removed the tab stop **and** made `SwipeDeleteAction` non-interactive — swipe-to-delete
  silently stopped working on web while the new spec passed. Only the full suite caught it. *(f.5)*
- ⛔ **AN ASSERTION AGAINST A PROXY FOR THE SUBJECT IS NOT AN ASSERTION ABOUT THE SUBJECT.** V2-6's test
  passed with the defect planted back. **Re-check what each new spec asserts AGAINST, not only that it goes
  red.** *(f.3)*
- ⛔ **A plant must red for the RIGHT reason, and a marker must survive the change the test is not about.**
  A copy assertion used `payday-reopen` — the control the other plant removes — and would have reported a
  copy regression that never happened. Worth one sweep of the specs added this phase. *(e.3)*
- 🔴 **`RequiredActionsCard` carries a contradiction and one half of it is a defect.** Its comment says
  gating a swipe pane on React state was **measured** to reset `ReanimatedSwipeable`'s pan; the shipped code
  in that same file does exactly that. `ListRow` fences its pane permanently and inherits neither. *(f.4)*
- ⚠️ **The frames in `capture-ref/p6.8/` no longer describe the app, in TWO ways now** — f.1 moved every
  light token, and **g.4 changed the Payoff Trajectory's axis on every seed**. **Re-shoot before this pass
  reads them**, or it audits a photograph of two defects that are already fixed. *(f.1, g.4)*
- ⛔ **A SIXTH finding whose observation held while part of its description did not.** P1-3 says *"neither
  curve draws at all"*; measured, **both curves draw and both reach zero** — the plan's is ~5% of the width,
  hugging the left edge. The lens had flagged this exact uncertainty as unresolvable from stills and named
  the right answer as likelier. ⭐ **The pattern is now: the observation survives, the explanation is a
  hypothesis, and the lens usually knows which of its own claims is soft — it says so.** Running tally
  **B3 · B2 · M3-5 · C5 · C7 · P1-3.** *(g.4)*
- ⚠️ **`DOMAIN_MARGIN = 1.15` and `MIN_DOMAIN_MONTHS = 6` are judgment values chosen without a device.**
  They decide how much empty axis sits right of the payoff bead and how wide a two-month plan's chart is.
  Both are one-line changes; neither is checkable off-device. → **P6.14** *(look at the Progress tab on a
  near-payoff plan and say whether the margin reads as breathing room or as a gap)*. *(g.4)*
- ⛔ **A FIFTH stated mechanism wrong.** R6's `numberOfLines` census reports `TrajectoryChart.tsx:360` as
  unbounded; it carries `numberOfLines={1}` and did before f.2 touched it — the unbounded set is **three, not
  four**, inside a refutation whose whole point was a miscount the other way. *(f.2)*
- ⛔ **A FOURTH mechanism wrong in two clusters, caught by a TEST rather than by reading.** C5's stated harm
  is false — `minimum_debt` is a required category, so no zero-branch renders. Running tally **B3 · B2 · M3-5
  · C5**. **Re-read every fix against its finding's stated mechanism, not just against its id.** *(e.4/e.5)*
- ⛔ **CHECK EVERY ID THE BUILD SCHEDULES AGAINST THE REFUTATIONS, not against the slice's owed-list.** M3-20
  and M3-5 were both scheduled as work and never refuted; the owed-list check would have passed on M3-5,
  because it was never on one. Nothing in the audit folder flags a refutation that never arrived. *(c.3, d.1)*
- ⛔ **M3-7 — `_layout`'s launch restore offer and `DataResetScreen` drop the SAME diagnosis.** M3-5's site
  list was **1 of 3**. On the launch offer the silence is arguably right; on `DataResetScreen` it is not —
  that user is already in a recovery flow being offered iCloud as the way out. *(d.3)*
- ⛔ **Repo-wide grep for `router.back()` against `canGoBack()`** — a five-minute gate-shaped question nobody
  has asked. The repo had already tagged this defect `[C9]` **twice** while the destructive screen still had
  it, and *"Delete everything" silently did nothing on cold entry*. *(d.2)*
- ⛔ **ASK OF EVERY IRREVERSIBLE CONTROL WHETHER ANYTHING EXERCISES IT.** 13 lenses and 6 refuters read this
  app and none reported that "Delete all data" had **zero** coverage. Two of three surviving e2e gaps this
  phase were found by **changing** the code, not by reading it. *(d.2, e.1)*
- ⛔ **`seedStore` re-seeds on every navigation and silently undoes what a test just did.** A `seedOnce`
  belongs in `helpers/seed.ts`, and the specs that mutate-then-navigate need sweeping. `coach-marks.spec.ts`
  already carries a comment about this exact mechanism — second time it has been paid for. *(e.1)*
- ⭐ **A gate could assert every glyph used in `apps/rn/src` is in `appIconSF`.** An unmapped glyph falls back
  to MaterialIcons on iOS: nothing breaks, nothing warns, and it looks foreign. The file's own header warns
  about this class and nothing enforces it. *(e.4)*
- ⚠️ **`AmortizationView` calls a BNPL's `bnplMonthlyEquivalentMinimum` "the minimum"** — it is a monthly
  *equivalent* of an installment minimum. Precision, not a lie. *(T4–T8; was routed to P6.8, whose sweep has
  since run without confirming it)*
- ⚠️ **The timeline's cushion row label is unasserted** — `buildTimelineItems` pushes it and `TimelineLedger`
  renders it, but no spec reads it, so T4.3's rename there is unverified by the gate. *(T4–T8; was routed to
  P6.4, which closed)*
- ⛔ **`WhatIfControls` has NO e2e spec at all** — and it is the surface the `Slider` VoiceOver defect
  actually lived on. The existing `aria-valuetext` assertion was `/^\$\d+$/`, **a regex that REJECTS the
  correct answer**, green only because it was pinned to a surface that cannot exhibit the bug. Not gating —
  `lint:money` catches the class permanently; what is missing is a pin on the rendered a11y string. *(P6.4.2)*
- ⚠️ **MOVING A FILE INTO `packages/core` SILENTLY DROPS IT FROM `lint:comments`, AND NOTHING FLAGS THAT.**
  Measured rather than assumed: `lint:money`, `lint:apostrophes`, `lint:glossary` and `strings-inventory`
  all scan **core + `apps/rn/src`**, so copy stayed gated when `amountField.ts` moved — but
  `check-comment-convention.ts`'s roots are `apps/rn/src` and `apps/rn/tests` **only**. ⭐ The decidable
  version is a gate on the gates: assert every copy/convention scanner covers the same root set, so a move
  cannot quietly reduce coverage. **The "gate the class" shape, one level up.** *(g.1)*
- ⚠️ **A `.click()` sweep of `tutorial-invite.spec.ts` is filed and deliberately NOT done.** g.6's red was
  the scrim intercepting a plumbing click; the fix was `dispatchEvent` at that ONE site of 54. ⛔ Where a
  click's **reachability** is the subject, `.click()` is correct and `dispatchEvent` would weaken it —
  converting wholesale trades a flake for silent blindness. **The rule, not the sweep:** `dispatchEvent`
  where the click is plumbing to reach the state under test. *(g.6)*
- ⚠️ **A PASCALCASE COMPONENT AND ITS CAMELCASE HELPER IN ONE FOLDER IS A BUILD ERROR ON WINDOWS.**
  `StrategyCompare.tsx` + `strategyCompare.ts` differ only in casing, which TypeScript rejects outright on
  a case-insensitive filesystem. ⛔ **The repo's own layout convention makes this reachable again** — that
  pairing is the standard shape here, so any pure helper named after its component collides. Cheap to gate,
  and nothing checks it. *(g.5)*
- ⚠️ **The Progress tab now stacks TWO collapsibles** (What-If, then the strategy comparison). Each is calm
  alone; nobody has seen the card with both open, and the matrix has not been re-shot since g.4 moved the
  axis. → include that state in the re-shoot. *(g.5)*
- **Gate docs owe three lines** — the suite's three ways of lying *(broad red that is noise)*,
  `cmd; echo EXIT=$?` reporting the echo, and ⚠️ **`grep -c` exiting `1` on zero matches**, which
  short-circuits an `&&` chain so the following `echo $?` reports the GREP rather than the command you
  meant to check. A green typecheck read as a failure for a cycle on exactly that. *(g.5)*
- ⚠️ **TWO FILE DOORS A FEW TAPS APART HAVE OPPOSITE SEMANTICS.** The backup import **replaces
  everything**; the CSV import **adds**. Both are reached from a plan screen, both say "import", and a
  user who has just learned the destructive meaning may hesitate at the additive one — or, worse, not.
  Pinned in `csv-import.spec.ts` so the behaviour cannot drift, but **the wording is the open half.** *(g.2)*

## → P6.10 — feature lock + the money lens *(last gate that can FIND a structural gap)*

- ⚠️ **THE WEBKIT FLEX-CONTROL CLASS IS UNMEASURED ON THE RN APP, and no instrument can currently see it.**
  *(2026-08-27 · S1.10.6.5.8.5 GAP-17 after-scan)*. `check-webkit-flex-controls` finds its subject by
  reading **CSS classes** and matching `<button>`/`<fieldset>` — RN source has neither, so pointing it at
  `apps/rn/src` returns `no NEW flex/grid controls` **because it structurally cannot see anything there**,
  not because the app is clean. ⚡ The class is real and device-only: iOS WKWebView mis-sizes a flex/grid
  native control whose content wraps, it bit v1.6's payday reconcile rows, and **Chromium and
  Playwright-WebKit both render it fine** — so the whole e2e suite is blind to it by construction.
  ⚠️ Whether react-native-web's DOM output reproduces the exposure is **unanswered**; the embed is the
  surface at risk, since that is where RN becomes real DOM. Worth one look at the exported embed's markup
  for `<button>` with flex, then a device row if it appears. → **P6.10 / P6.14**

- 🔴 **[DECISION] `actualIncome` capture for variable-income users — DEFERRED BY 🎯, not dropped.**
  `substrateProducers.ts:60` returns the store unchanged when `incomeVaries` and no `actualIncome` is
  supplied, so **`incomeActualsLog` never grows for exactly the users it exists for**. Consequences that ship
  without it: **`LeanSuggestionCard` stays unreachable** and `guardianPredictionCore`'s confidence stays thin.
  ⭐ The expensive half — threading actuals through `onCapture` → `capturePayday` — is already shipped by e.2.
  *(e.2)*
- ⚠️ **`test:stamp && test:regression && test:app && test:scenarios` — four INDEPENDENT suites behind
  `&&`, so a red stamp hides three.** *(.11.13.1 after-scan)* The small remainder of the chain defect
  `.11.13.1` fixed in `lint:rn`. ⛔ **The rest of `validate:release:rn` is deliberately NOT the same case**
  — its links are dependent (a failed typecheck makes the web export unreliable, so the 9-minute e2e run
  behind it would be noise), and `gate:record` must run only on a full pass. **Rec: unchain only the four
  suites**, keeping the dependency edges.
- 🔴 **[DECISION] SHOULD `originalBalance` FOLLOW AN UPWARD REVISION?** *(.11.12.10 after-scan)* It is stamped
  once at creation and **no edit path updates it**, which is the root cause C-D only patched the sentence of.
  Consequence that still ships: a user whose card grows $5,000 → $5,400 and who then pays it back to $5,000
  is shown **0% paid** on the ring, having really paid $400. Honest as *"you are back where you started"*,
  and wrong as *"you have made no progress"*. ⚠️ Either answer is defensible and it is a product call, so it
  is 🎯's. **Cheap to change** — one field, written at `DebtSheet.tsx:184/:209`.
- ⚠️ **A COACH MARK THAT CAN NEVER BE PLACED ON SCREEN IS NOW OFFERED EVERY LAUNCH.** *(.11.12.9 after-scan)*
  `.11.12.9` made the once-ever record conditional on the callout being inside the viewport — correct, and it
  inverts the failure: a hint that used to be **spent silently** is now **re-offered forever**, since nothing
  else writes the record. It bites only where no placement ever fits, and `requestReveal` returns false for a
  sheet or a short screen. ▶ **Does such a layout exist?** The candidates are Larger Text (the callout grows,
  the estimate does not) and the shortest supported screen. **Measure on device before deciding a bound** —
  recording after N refused offers, or on a failed `requestReveal`, are both cheap once the answer is known.
- 🔴 **[DECISION] the v1.6 bridge that keeps failing is a SILENT LOOP** — see *Waiting on Jason*. *(c.3)*
- 🔴 **[DECISION] P1-10's Windfall tier gate** — see *Waiting on Jason*. *(7b)*
- ⛔ **AN ABSENCE ASSERTION PASSES BEFORE THE APP RENDERS, and it bit on two consecutive items.**
  `expect(x).toHaveCount(0)` is satisfied by a blank page. Both times measured by a **plant**, never by
  review. ▶ Sweep every `toHaveCount(0)` / `not.toBeVisible` for a preceding render barrier. `lint:selectors`
  cannot see this — it is about selector shape, not ordering. *(c.2)*
- ⛔ **A GREEN `lint:rn` DOES NOT MEAN THE TREE IS PURITY-CLEAN.** `react-hooks/purity` reports a component's
  `Date.now()`-in-render violations only while the React Compiler can still analyse it — `DebtSheet` linted
  clean and produced 2 errors the moment an unanalysable call entered render scope, with the `Date.now()`
  calls **untouched**. So the lint samples this class rather than gating it, and `FirstDebtOrBillStep`
  carries the same shape today, unreported. **A masked lint class is a structural gap.** *(c.1)*
- **`localId` / `nextGoalId` can hand out a DUPLICATE id across a relaunch** — module counters reset to `0`,
  namespaced by a cycle date that does not move within a cycle. ⚠️ `AffordabilityCard`'s own comment asserts
  the opposite. c.1 deliberately did not copy the pattern into `DebtSheet`. *(c.1)*
- **An unpolled `readStore` in an e2e passes vacuously** — it reads before the write flushes and asserts over
  the seed alone. Found by a plant: one spec **passed with the defect planted back**. 12 `readStore` calls
  exist and one visibly polls; the rest need checking individually, not a blanket edit. *(c.1)*
- ⛔ **AUDIT THE PLAN FOR OTHER ✅ THAT MEAN "DECIDED" RATHER THAN "BUILT".** [D44] sat in a queue row as
  shipped for a day and a half and the step did not exist. A decisions ledger marks ✅ when a call is
  **settled**; a queue row marks ✅ when work is **shipped** — same glyph, and the queue row is the one a
  reader trusts. Cheap: every `[Dnn] ✅` referenced from an OPEN item, checked against the tree. *(P6.7)*
- ⚠️ **`testFullAppRegression.ts:63`'s conservation assert holds only when the reserve FITS** — with an
  over-sized everyday reserve, `paycheckAmount − livingExpenseReserve` goes negative while the allocation sum
  floors at 0. Not exercised today. *(T4–T8)*
- ⚠️ **The repairs card's loss heading over-claims for a MIGRATION entry.** `describeMigrationLosses` writes
  sentences like *"3 item(s) from your old version were not recognised"*, which land under
  *"N amounts could not be read"* — they are not amounts, and the count conflates two different things.
  Pre-existing and small; surfaced while splitting the card into recovered/lost blocks. *(.11.12.1
  after-scan)*
- ⛔ **`projectForecast` READS THE CLOCK, so its month labels cannot be pinned at all.** It calls `new Date()`
  inline rather than taking a `startDate` like every other producer, so `.11.11` could fix its overflow but
  could not write a test that would fail on it. ⚠️ **The gate is the only thing holding this site** — and a
  gate catches reintroduction of one written form, not a different wrong answer. Thread a start date in and
  pin the labels. *(.11.11 after-scan)*
- ⚠️ **Three of the seven month-step sites are held by the GATE alone** — `AmortizationView`,
  `BnplCalendarSection` and `FirstDebtOrBillStep` route through the clamped owner but have no test of their
  own, so the call could be replaced with something else wrong and nothing reds. Stated rather than hidden;
  the two that carry the user's headline claim (`projectDebtPayoff`, the chart) ARE pinned. *(.11.11 after-scan)*

## → P6.9 — the privacy / egress audit

- ⛔ **ASK THE SAME QUESTION OF EVERY OTHER GUARD IN THE REPO: does it PREVENT, or only DESCRIBE?**
  `useNoRealWritesGuard` survived a 117-finding audit and its entire contribution to the ship-blocker was an
  accurate description of the corruption **while it happened**. ⚠️ Not a code change — a lens. The `3.5.0.6`
  sync-seam guards are named in its own docstring as *"the same move"*, so they are the first place to look.
  *(R4)*
- **[D41]'s rewrite of `PRIVACY_CLAIM.body`** — it still says *"stays on this device"*, which the iCloud
  toggle makes false. ⛔ **P6.3 must not SHIP without it landing here.**

## → P6.11 — delete with the tree

- 🔴 **`lint:webkit` IS RED RIGHT NOW AND IN NO LIVE CHAIN — delete it with the tree, or wire it.**
  *(2026-08-27 · S1.10.6.5.8.5 GAP-17 after-scan · measured)*. It is reachable only from root
  `npm run lint`, which appears only in **`validate:release:legacy` — retired**. `validate:release:rn`
  does not run it; CI runs `lint:rn`, which does not include it. ⚠️ It has been **failing unseen** on
  `app/page.tsx:1653` (`<button>` using flex/grid class `.premium-pill`). ⚡ Its `DEFAULT_SRC_DIRS` are
  `components` and `app` — the legacy tree only — so P6.11 deletes its entire subject and the honest close
  is to delete the gate with it. ⛔ **Do not simply wire it into `lint:rn`**: it would red on day one over
  code being deleted. → **P6.11**

- 🔴 **`site/` IS DEAD AND ACTIVELY MISLEADING — delete it with the tree.** Two files at **v1.5**, last
  touched `34c7c89` (2026-07-05), and **no workflow deploys them**; the pages App Review loads live in
  `jsnyde03/debt-planner-site` at v1.7. ⚡ **It has already cost three findings** filed against
  `site/*.html:<line>` quotes that are not the strings a reviewer sees — two changed verdict once the live
  page was fetched. ⚠️ A stale copy of a file that exists elsewhere is worse than no copy: it answers the
  question wrongly and confidently. ⛔ Check [D64]/`DEBT_SITE_COPY_2.0.md` first — deleting it must not
  strand the corrections drafted against the live pages *(.11.16 after-scan)*
- 🔴 **P6.4.6's obligation.** Four dead-code findings resolve to *"delete the consumer, then re-check"*:
  **L4-11** `formatDisplayAmount` *(3 live sites in `components/ResultsSection.tsx`)* · **L6-4/5**
  `projectForecast` *(`components/SnowballSection.tsx:290`)* · **L3-5** `buildSmartInsights`
  *(`SnowballSection.tsx:245`)*. After the root tree goes all four are genuinely dead and must go **with** it,
  or P6.11 leaves four unreachable modules every later sweep re-reads. ⚠️ **L3-5 carries a latent defect**
  (a capped promise, *"Hold back $X to restore a safer $200 cushion"*) — **delete it, do not revive it.**
- **`progressColor()` in `apps/rn/src/theme/colors.ts` has no callers**, but is exported through
  `theme/index.ts` so it reads as public API. Left in place and made to **derive** its rgb from the token so
  it cannot diverge while it waits. *(f.1)*
- **T10's dead-code verdicts owe a re-check against the ROOT tree** — `formatDisplayAmount` was called dead
  and has three live legacy call sites. ⭐ Deleting last is what keeps that tree readable long enough to check.
- 🔴 **`debtCsv` WAS NOT THE ONLY MODULE ON THIS DEADLINE, and the rest fail the other way round.** ⛔ **Core
  imports FROM the dying tree in four places** — `history/selectVisibleHistory.ts` *(production code, and it
  has **zero callers in `apps/rn`**, so it is dead core code)* plus `testSafeStorage`,
  `testSubscriptionGating` and `runRegressionTests`'s `@/lib/storage/testMigrateOriginalBalance`. They rest
  on **five root modules totalling 293 lines** (`lib/subscription/{plans,hasFeatureAccess,features}` ·
  `lib/storage/{safeStorage,migrateState}`). ⚡ **Different failure shape from C8:** the parser would have
  gone *silent*; these break `test:regression` **loudly** — which is why they need moving, not rescuing.
  ⚠️ `packages/core/tsconfig.json`'s own `@/*` alias comment already routes them here; **the P6.11 row lists
  what to REMOVE and never what must MOVE FIRST.** *(g.1)*
- **Split `DEBT_ELEVATION_LOG.md`** (18.4k lines, well past one-pass readability). ⚠️ Its ordering is mixed —
  newest-first at the top, but f.1–f.5 and [D58] appended at the **end**; the split should settle one order.

## → 2.1

- 🔴 **`lint:contrast` IS BLIND TO A CONTROL WITH NO BORDER AT ALL.** It holds `border.control` to 3:1, which
  answers *"is the boundary visible"* and not *"is there one."* A `Slider`, a bare `TextInput`, a pressable
  row bounded only by spacing — none fail it, and none were in V1-5's scope either. A real gap, not a
  ship-blocker; naming it beats a gate written in a freeze. *(f)*
- ⚠️ **THE EYEBROW WEIGHT IS TWO AUTHORING GENERATIONS, AND CONVERGING IT IS A DESIGN CALL.** Of the 15
  `eyebrow` styles, six carry `fontWeight: '700'` and nine carry none — so they inherit **400** from their
  `footnote`/`caption` base. ⛔ **Folding a weight into the token would make seven live surfaces bold**
  *(Affordability · Graduation · GuardianScorecard · LeanSuggestion · PaydayGuardian · RecoveryPlan ·
  Windfall)*, and no instrument here judges that. ⚡ **The auditor priced this token as *"touches zero
  strings and zero tests"* — true, and silent about pixels.** `.11.14.5` took `textTransform` +
  `letterSpacing` (invariant, sub-pixel) and left the weight at each site. **The 19 uppercase-display
  styles under OTHER names** (`groupLabel` · `statLabel` · `colMonth` · `sectionTitle` …) are the same
  question one ring out — a `statLabel` is not an eyebrow. → **2.1**, with the token already in place so
  it becomes a one-line change *(.11.14.5 before-scan)*
- 🔴 **THE PROGRESS HERO RING IS IN NO `progress.png` FRAME IN THE CORPUS — a live blind spot, not a
  cosmetic one.** Measured at `.11.14.3`: the route block is the **only** shooting block that does not seed
  `coachMarksSeen` (`SHEETS` and the text-scale block both do), so on `/progress` the *"Drag the curve"*
  mark scrolls itself into view and takes the hero out of shot — the ring canvas sits at **y = −42** on
  `phone` and **y = −261** on `phone-small`, against **y = +92** with the marks seen. ⚡ **So every visual
  lens that judged the Progress tab did so without ever seeing its hero**, and P1-3's axis finding was
  reasoned from those frames. ⛔ **NOT fixed globally on purpose** — a live coach mark is part of what the
  route frames exist to review, and **P1-2 was found because they show it**. The real question is whether
  the route block needs BOTH states, which is a scope call, not a one-liner. → hand to **`.11.17`**
  *(.11.14.3 after-scan)*
- ⚠️ **The unbounded-name-join class has no gate, and it cannot be closed as a list.** `.11.14.1` fixed
  `RecoveryPlanSection`'s `.join(' · ')`; the same shape at `ImportDebtsSheet.tsx:95` was measured and
  **deliberately left alone** — it is a confirmation before adding N debts, inside a scroll, where seeing
  every name is the screen's job. ⚡ So a gate on the shape would have to carry an exemption, which is a
  new judgement written under a freeze. Same code, opposite correct answer. *(.11.14.1 after-scan)*
- ⭐ **Nothing compares a spoken string against the shipped glossary** — `lint:glossary` pins the constant and
  no gate reads an `accessibilityLabel`'s **contents**, which is how A1-2 lived. The decidable version is
  narrow and worth having: flag a label template that interpolates a **raw engine status field**. *(f.4)*
- ⏭ **C3 — a user away one cycle + 8 days.** SYNTHESIS said *"fold into C2 … if it doesn't fall out, defer."*
  **It does not fall out:** C2 re-opens capture for the CURRENT cycle; C3 is a cycle already stepped past.
  What survives is that **the cycle can never be reconciled and the escape hatch destroys it silently.**
  Recorded here rather than letting "folded" quietly mean "done". *(e.3)*
- ⚠️ **`DebtSheet` REFUSES a balance edited to $0** — `minimumN > balanceN` is true of **every** debt at the
  moment it is paid off. Not a ship-blocker *("Log a payment" is the intended affordance and it works)*, but
  a user who paid off elsewhere hits a wall with no hint about the other door. Exempting `balanceN === 0` is
  one clause; validation on the money path inside a converging phase is not where to spend the risk. *(e.1)*
- ⚠️ **`PlanState` has no `'no-bills'` member** — e.4 branches on `requiredExpenses.length === 0` at two call
  sites because the union drives routing. ⭐ **The type is the right home** — it is what made the asymmetry
  invisible in the first place. *(e.4)*
- **`completeCapture` and `dismiss` are indistinguishable after the fact** — both only stamp
  `lastHandledPaydayDate`, which is why the card's copy had to become neutral rather than accurate. A one-bit
  distinction would let both the card and `cycleHistory` be honest. *(e.3)*
- ⭐ **A fake cloud provider behind an `EXPO_PUBLIC_` flag would make the whole feature e2e-testable** — the
  same shape `demoSession` already uses. The `ready` branch of `CloudBackupSheet` is untestable by
  construction today; the toggle, the conflict fork and both buttons are **source-only**. *(d.3)*
- **Two `stat()` round-trips per sheet refresh** — `getCloudBackupStatus` and `inspectRemote` each call it.
  Correct but wasteful on a native path. *(d.1)*
- **`api.setState` is the one seam R4's veto does not cover**, by design — actions route through the wrapped
  `set`. Today it carries only `isHydrated`/`storageError`, neither in the `store` blob. ⚠️ **File, do not
  fix:** wrapping it would put the veto in front of `hydrate`, and refusing a hydrate shows an empty plan.
  Revisit only if a plan-bearing `setState` ever appears. *(R4)*
- **`npm ci` does not work in `apps/rn`** — that lockfile is out of sync with its `package.json` (~12 missing
  transitive entries), so three workflows use `npm install --prefer-offline`. ⚠️ Noted in two workflow
  comments as *"filed separately"* and never actually filed — **this is that filing.** *(P6.7)*
- **L5-15 — currency is pinned to `en-US`/USD** while the paywall renders the store's real `priceString`.
  ✅ **Safe to defer, verified not assumed: no currency code is persisted anywhere**, so 2.1 adds the hook
  with **zero migration**. ⛔ **Deferred on COST, not on the lock date** — the formatter half is small (2
  sanctioned + 3 hand-rolled live + 3 dead, and `paywall.tsx:85` already extracts the real symbol) but there
  are **111 literal `$` in non-comment source lines** plus the whole test corpus. An unbounded string sweep
  is the exact shape of change you do not take late. ⚠️ **Conditional on P6.21's availability call** — AUD and
  NZD both render `$`; open a `£`/`€` storefront and this becomes the app reading in the wrong currency on
  every screen. **Owed either way: a release-note line.**
- **L2-14 ("Autopay", six surfaces) · L2-22 ("BNPL" pill fallback)** — domain nouns a rename would touch
  deliberately. A shared constant buys indirection and no safety. Revisit only if either term is renamed.
- ⚠️ **Show the backup's own date in the replace-confirm** — the summary says *what* is in the file but not
  *when* it was saved, and *"am I about to overwrite three months of work with something stale"* is the
  question a destructive confirm should answer. The envelope already carries `exportedAt`. ⚠️ **Two sites**
  *(the iCloud restore confirm has the same gap and already renders the file's mtime one line above it)* —
  fix both together or neither. *(5.8.4, P6.3)*
- ⚠️ **Retire `raw-v17` import acceptance** — the weakest of the three markers, existing only because the
  pre-5.8 clipboard export has no envelope. The RN app has never shipped, so the only holders are TestFlight
  testers, who can re-export. **Re-decide with the tester window closed.** *(5.8.2)*
- ⏭ **THE FREE TRIAL — the 2.1 lever ([D53]).** 30 days minimum, **annual only**. ⛔ **The code is wired and
  DELIBERATELY INERT:** `introPrefix(pkg, eligibility)` renders only on `'eligible'` and every caller passes
  `'unknown'`, so turning it on is a config change **plus** a code change, enforced by the compiler. ⚠️
  **Thread `checkTrialOrIntroductoryPriceEligibility` before flipping anything in ASC**, or the paywall
  promises "30 days free" to a returning subscriber Apple will charge in full. Needs a device row with a
  sandbox account that has already consumed its trial.

## → INTERNATIONAL — a workstream, not a line item *(scoped 2026-08-20)*


## → Tooling / hygiene

- ⚠️ **`webkitDoor` BYPASSES `pickLegacyStore`, so the audit harness can construct a state production
  cannot.** *(2026-08-27 · S1.10.6.5.8.4 GAP-7 after-scan — surfaced by a plant, then measured)*.
  `doors.ts`'s `reportWith()` fabricates `store: { path, items }` directly, so a hostile blob carrying
  **zero legacy keys** reaches `mapLegacyStore` and comes back `migrated: true` with an empty store —
  the exact shape `doors.ts`'s own header calls the distinction that matters (*"a bridge that declines to
  migrate and a bridge that migrates nothing look identical in the resulting app"*). ⛔ **NOT a product
  defect, and this was measured rather than reasoned from the comment:** `pickLegacyStore` picks on
  `count > bestCount` starting at `0`, so a container whose stores hold no legacy keys returns `null` and
  production takes the `report.store === null` / `isConfirmedFreshInstall` branch instead. ⚡ **What it
  costs is harness FIDELITY**, against that file's own doctrine that *"a harness that rebuilds the thing it
  audits is measuring its own reconstruction"* — the webkit door is the one door that does not run the
  real picker. Fix is one line (route `reportWith` through `pickLegacyStore`); the risk is that it changes
  what the existing 32-case corpus measures, so it wants its own control. → **S3 / import surface**

- ⭐ **`lint:plan-figures` — gate the CLASS "the plan states a number its own instrument contradicts."**
  *(2026-08-26 plan-cleanup after-scan)*. [D49] stopped the **gate** result being typed into the plan;
  nothing stops the **ledger** results being typed, and the residue table was found reading *"34 findings ·
  18 guarded"* against a live 36 · 20 — moved by S1.1 registering six guards. ⭐ **The decidable version:
  the residue table already names one command per row; parse the row, run the command, compare the stated
  figure.** ⚠️ Scope is the real question — a general "any number in the plan" check is unbuildable, so it
  must be **that table only**, which is also the only place figures are load-bearing. ⛔ **Not a freeze-time
  change.** → **2.1**
- ⭐ **`validate:release:rn` RE-RUNS SUITES THAT ALREADY PASSED ON THE SAME FINGERPRINT** (🎯 2026-08-25:
  *"full e2e shouldn't need to run again on .16"*). Measured across one session: **~9 `expo export` cycles
  (~22 min) and two full 274-spec runs**, the second of which re-proved an unchanged tree ~15 minutes after
  the first. ⛔ **It cannot simply be skipped** — `gate:record` is `&&`-chained behind the suites, and a
  record written without them is the typed result [D49] exists to prevent. ⭐ **The decidable version:
  fingerprint PER SUITE the way `lint:gate-freshness` already fingerprints the tree, and let a suite whose
  inputs are unchanged report `↩ cached` instead of re-running** — the record then still describes what
  passed against this exact tree. ⚠️ Two cheaper habits available today, no code: keep a `serve` warm on
  4319 (`reuseExistingServer` already honours it, and it saved every shots re-run this session) and
  re-export only when SOURCE changed; and reserve the full sweep for items touching shared code (theme,
  store, migrations, `packages/core`), letting narrow items ride targeted specs + the gate. → **2.1**,
  not inside a freeze
- ⚠️ **CI is running our `actions/*@v4` steps on a forced Node 24.** Every run now annotates: *"Node.js 20
  is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24 —
  `actions/cache@v4`, `actions/checkout@v4`, `actions/setup-node@v4`."* Green today because the forcing is
  GitHub's compatibility shim; it is **not permanent**, and when it is withdrawn the gate fails on
  infrastructure rather than on code — the worst kind of red to debug under a freeze. ⭐ **Bump the three
  actions to their Node-24 majors**, which is a workflow-only change with no product risk. *(g.8)*
- ⚠️ **The APP ICON disagrees with its documented source.** Rasterising `render-icon2.html` against the
  shipped `apps/rn/assets/icon.png`: the icon is **globally darker** (corners `#3b2d7e` → `#0a051c`, bars
  `#34d390` → `#1cad96`) and its corner and 40px inset are **identical** — the signature of a **baked-in
  squircle with a dark surround**. ⛔ That contradicts the icons README (*"full-bleed, no alpha, iOS masks the
  squircle"*), and a pre-masked icon gets masked **again**, so any inset shows as a dark rim on the home
  screen. **One second to check — look at a home screen** — and it is App-Store-facing, so it wants an answer
  **before** submission. *(P6.6/[D51])*
- ⚠️ **Two `maestro test` calls write no JUnit** (`11-reduce-motion`, the iPad's dark re-run of `i02`), so
  their verdicts never reach the durable record. Harmless today — both are measurement runs — and it is the
  same hazard `maestro-results.mjs`'s header documents for flow `09`: **the next flow added in its own
  invocation disappears silently.** ⚠️ `lint:lane` is where this becomes a check.
- ⚠️ **The embed's public URL names the repo** — `jsnyde03.github.io/debt-app-v1/`. Fine for an iframe; a
  custom domain or a repo rename removes it. **A brand call with a DNS dependency** → 🎯 whenever the
  marketing page exists.
- ⚠️ **Maestro is unpinned** — `get.maestro.mobile.dev` fetches latest, and 4.1.1 spent three cycles
  establishing which commands this build supports. A silent upgrade can retire one.
- **No local pre-flight for the capture path** — a flagged web export + ~40-line check would have caught
  several CI cycles' worth of defects.
- 📋 **Real-device cloud testing — as DEVICE-MATRIX coverage, not a way to shrink the manual pass.** ⛔ It
  moves only **3–6** `[D]` rows. ⭐ The real gap it closes is that everything runs on **ONE sim config** —
  §11.1 says outright *"a wide phone can pass while an SE fails"*. Maestro Cloud is the zero-rewrite path.
  **Triggers:** Android at v1.8, or the first width-driven bug that reaches a user.
- ⛔ **REFUSED WITH MEASUREMENTS, do not resurface:** **ccache** *(`0/648 cacheable` twice; both stated
  mechanisms wrong, and modules-off cost 888s vs a 771s baseline — the only remaining avenue is prebuilt pod
  binaries)* · **DerivedData caching** *(~70% of the boot step is simulator boot + install, which it cannot
  touch, against multi-GB in a 10GB cap where LRU could evict the `.app` cache saving 17 minutes — the
  optimisation eating the optimisation)*.

## → Genuinely a later version / tier

- **`typicalAmount` still has no UI** → the wording/cohesion gate.
- **The app never shows a debt-free date reflecting its own plan working** — on day one the starter EF absorbs
  the surplus, so every projected date is minimums-only. Honest per screen; the question is the app-wide
  effect → the cohesion audit, **not a defect**.
- **The paywall lead has NO e2e coverage** — pinned only by `paywallLead.test.ts`; no Playwright spec asserts
  any branch. *(was routed to P6.4, which closed)* → 2.1.
- **The demo's beat dwell may be too short for the runner** — decide from the 2fps contact sheet.
- **Apple Watch** → v1.8+ · **`@gorhom/bottom-sheet`** → v1.8 Android · **Behavioral mis-entry /
  persistent-cushion / bill-shock autopilot** → Connected/Plaid tier · **Holiday/promo free-trial** → a
  reversible later lever · **iOS-18 Control Center** [D1] · **web light-mode hover screenshots** *(a QA
  artifact, not product)*.

## ✅ Closed since filing — recorded so they are not re-filed


## → surfaced by the S1 scans, 2026-08-25/26 — routed per bullet

- ⚠️ **C-m2's DEAD SENTENCE HAS A SECOND COPY, and the enumeration came up short for the eighth time.**
  `goal-row-saved.spec.ts:10` still carries *"`applyTightTopUp` (a top-up undo) can push `currentAmount`
  past the target on its own"* — the mechanism [B3] deleted, which S1.9.7 removed from `money.tsx` and only
  from there. ⚡ **Found DURING S1.9.8's gate run**, so fixing it would have invalidated a fingerprint the
  suites had just earned; filed rather than poisoning the record ([D49]). ⛔ **A comment-only fix, and it is
  a carried premise the next reader will cite as proof.** → **S1.10**


⚠️ **Thirteen separate headings, one per scan, collapsed into this.** Grouping by *which scan found
it* is grouping by an accident of when someone looked; the plan's own header already said the
grouping is by destination. Each bullet keeps its own `→` where it had one.

**→ surfaced while classifying pass 2 under [D69] *(2026-08-26)***

- ⛔ **A GITIGNORED DIRECTORY IS INVISIBLE TO `git status` AND VISIBLE TO `tsc`.** Auditor C wrote its
  probes to `apps/rn/capture-out/probe/`, which `apps/rn/.gitignore` ignores — so the pass ended with
  `git status` clean, the pin diff **empty**, and every auditor correctly reporting *"no source touched"*,
  while **`npx tsc -p apps/rn/tsconfig.json` was exit 2** on 14 stray files. ⚡ **Two instruments, two
  answers, and the clean one is the one everybody read.** `validate:release:rn` runs `tsc`, so this would
  have surfaced as a mystery red at the gate with nothing in `git status` to explain it. ⚠️ **Found only
  because `| tail` hid the real exit code and I re-measured** — the nine-instance trap, again. Debris
  removed. **The durable fix is a gate**: either the scratch convention moves outside the repo, or
  `tsconfig` excludes `capture-out`, or a check asserts the tree is tsc-clean *and* status-clean together.
  → **S1.10.6.5 / S0 instruments**

- ⛔ **`lint:secrets:authoring` may not scan the report it exists to scan.** Invoked as
  `check-committed-secrets.ts --working-tree`, it printed *"none across 1206 tracked files in **index+HEAD**"*
  while the pass-3 brief and four routing manifests sat **untracked** beside it. M10 added this variant
  precisely so an audit report is checked **before** it is committed — but an uncommitted report is not in
  index or HEAD, so the flag may be inert and the green may describe the wrong file set. ⚠️ **Not yet
  measured** — the plant needs a secret-shaped string in an untracked `docs/` file, and four auditors were
  mid-pass on a clean-tree self-check, so a stray file would have manufactured a false finding for them.
  ⚡ **Exactly the cluster's own shape: an instrument reporting green while doing less than it claims.**
  → **S1.10.7 / S0 standing re-check**


**→ surfaced by S1.9.6's after-scan *(2026-08-26)***

- ⚠️ **TWO VOCABULARIES FOR ONE BAND, AND A COMPARISON ACROSS THEM READS AS A DEFECT.** `GuardianState` is
  `clear|tight|at-risk`; `CushionStatus` is `stable|tight|pressure`; `toCushionStatus` maps one to the
  other. ⚡ The first probe for D2-1 reported *"THEY DISAGREE"* on a tree where all three producers already
  agreed — a **false negative that would have justified more work.** Not a defect: both names are load-bearing
  *(`clear` is the Guardian's word to the user, `stable` is the forecast's)*. ⛔ But **any future comparison
  of two producers must go through the mapping**, and nothing says so at either declaration. Rec: a comment
  at both type declarations pointing at `toCushionStatus`, or a shared comparator. → **the tooling sweep**

**→ surfaced by S1.9.4's after-scan *(2026-08-26)***

- **`test:gate-plants` COVERS 11 OF THE 27 GATES ON `lint:rn`.** B-1 was *"the seven gates whose registry
  entry cannot see their own un-fix"*; the remaining 16 gates are the same question one directory over —
  none has a scenario proving it fails closed, and S0's whole finding class was *a gate reporting green
  while doing less than it claimed.* ⚠️ Not a defect in any named gate: it is the coverage number, and it
  is now readable off `MIN_SCENARIOS` rather than being unknown. Rec: one scenario per gate, in the order
  a gate's blindness would cost most *(`lint:closure`, `lint:money`, `lint:glossary` are already done)*.
  → **S0's standing re-check / the tooling sweep**
- ⚠️ **A TOKEN CANNOT COUNT OCCURRENCES, and one registry entry needs that.** `money.tsx` holds two
  identical `resolveBillCategory(e) === category` sites and `S1P1-M1-CALL` is one token, so a SINGLE-site
  revert leaves it green — which is M1's own finding wearing the guard's clothes. ⭐ **Measured: the
  behavioural guards do catch it** (3 of 4 in `bill-category-partition.spec.ts` red), and the ledger entry
  now says what the token can and cannot see. **No further action; recorded so pass 3 does not re-open it
  as a hole.**

**→ surfaced by S1.9.3's after-scan *(2026-08-26)***

- ⚠️ **THE CARD'S COPY GOT MORE HONEST AS A SIDE EFFECT, AND NOTHING ASKED FOR IT.** A1's netting changed
  the shortfall sentence from *"about $400 short"* to *"about $200 short"* for a user who had already moved
  $200 — correct, pinned, and **not part of the finding**. ⚡ Worth a note because it is evidence for the
  one-rule approach over per-seam patches: two of the three sentences A1 complained about needed no copy
  change at all once the arithmetic behind them agreed. **Nothing to do; recorded so pass 3 does not read
  the moved figure as a regression.**

**→ surfaced by S1.9.2's after-scan *(2026-08-26)***

- ⚠️ **A `migration` REPAIR GAGS NO CLAIM, and that is a decision now rather than an accident.** Measured
  while wiring the claim table: `hasUnreadDebtBalances` tested `r.entity === 'debt'`, so a v1.6 bridge loss
  never suppressed anything, and `mayClaim` preserves that. ⛔ Defensible — those records report **keys the
  bridge never understood** (`debtPlanner.rolloverCount`), which says nothing about a money field being
  misread, and gagging on them would be the over-match A1 was raised for. ⚠️ But it is a *judgement*, and
  the counter-case is real: an unmapped key **could** have been a debts list. Pinned by an assertion either
  way, so a change of mind is a one-line edit and not a rediscovery. → **S4 discovery / a 🎯 call**

**→ surfaced by S1.9.1's after-scan *(2026-08-26)***

- ⚠️ **THE SAFE SEED HELPER IS PRIVATE, THREE TIMES OVER, AND THE TRAPPING ONE IS THE EXPORTED ONE.**
  `helpers/seed.ts` exports only `seedStore`, whose `addInitScript` re-runs on **every** navigation — so a
  `page.reload()` restores the fixture over whatever the app just wrote, and a "survives a relaunch" test
  proves nothing while passing. `celebration.spec.ts`, `data-recovery.spec.ts` and `payday-reopen.spec.ts`
  each define their own local `seedOnce`; `coach-marks.spec.ts` carries a comment about it. ⚡ **Measured
  live: S1.9.1's first e2e draft fell into it** — the reload showed *"Flexible $500"* with the applied
  purchase gone. Rec: export `seedOnce` from `helpers/seed.ts` with the docstring the three copies already
  carry, and point the three specs at it — deferred because it edits three specs currently under audit and
  D2-2 did not need it. → **S2 or the tooling sweep**
- **A COVER MADE IN A PREVIOUS SESSION HAS NO UNDO ANYWHERE.** The affordability card's control exists only
  while its `applied` state does, and that is session-brief by construction; the Guardian's control reads
  the store but only for `source === 'guardian'`. So after a relaunch an `affordability` entry is money the
  user moved with no path back — pre-existing, not the regression, and arguably right *(an undo is a brief
  offer, as `intentRollback` is)*. ⚠️ **Filed as a DESIGN question, not a defect**: it is the reason the
  per-draw fix is bounded to the live card. → **2.1**
- 🔴 **`packages/core/timeline` IS ON NO SURFACE — and it holds a producer of the ONE state machine.**
  Measured: `grep -c "packages/core/timeline"` returns **0** against both claims files. S1's roots carry
  `packages/core/engine` and `packages/core/guardian` and stop there. ⚡ **`buildMultiCycleTimeline.ts` is
  the third `computeState` producer and the subject of pass 2's sharpest major (D2-1)** — the forecast the
  card links to, disagreeing with the card. ⛔ **Third instance of one shape:** M9 (hand-named files in
  `roots`), [D73] (the whole test tree), and now a sibling directory under a package whose neighbours are
  roots. **An enumeration inside `roots` is still an enumeration, and this one was two directories from a
  file the audit was actively reporting on.** Rec: fold into S1.9's fix range — it is a one-line root add
  plus a write-back, and leaving it means pass 3 re-reads a surface that still omits the file pass 2's
  biggest finding is about. → **S1.9**

**→ surfaced by S1.5.5's whole-item after-scan *(2026-08-26)***

- 🔴 **NO e2e SPEC IS ON ANY AUDIT SURFACE.** Measured: `grep -c "tests/e2e"` returns **0** against both
  `surface-coverage.s0.json` and `surface-coverage.s1.json`. Co-located `*.test.ts` files under `src/` are
  on-surface; the whole of `apps/rn/tests/` is not. ⚡ **This is M9's shape one directory over**, and it
  bites the standing rule directly: *"every surface audit re-verifies the previous surfaces' guards"* — but
  the guards for most registered findings live in files no auditor is ever pointed at.
  ⛔ **`lint:finding-guards` cannot cover this**: it checks a token string still exists on a non-comment
  line, never that the assertion is sound. ⚡ **Measured this session:** S1.5.5's own `/\$400/` assertion
  was **vacuous** — the defective card contained `$400` via `RecoveryPlanSection` — and the registry would
  have reported that finding guarded forever. **Caught by a plant, which is not an instrument.**
  ⚠️ **Whether `apps/rn/tests/` BELONGS to the money surface is a scope call, not a bug** — adding ~59
  specs takes S1 from 65 unswept to ~124 and changes what convergence means, days before pass 2. Deciding
  it by judgement is the exact move M9 punished. ✅ **ANSWERED — [D73], 🎯 2026-08-26. Promoted to the
  queue as S1.7**, ahead of pass 2, which is now S1.8. This row stays as the measurement that produced it.
- **`PlanHero`'s `Required` label and its number now diverge in a shortfall.** M4 made the segment what the
  paycheck FUNDED, which is what a partition of the paycheck must contain; `PAYCHECK_SEGMENT.required`'s
  own docstring still defines it as *"Bills + minimums that must be paid this cycle."* Both readings are
  defensible and the screen states the gap elsewhere *(the status line, and the Guardian card names the
  amount)*, so this is a wording question, not a false statement. **Rec: defer** — relabelling a segment
  is a vocabulary change with three consumers. → **P6.10** *(the money lens, at real size)*
- **`appliedTopUp` is still a manual opt-in, and M3 added a SECOND thing every reader must remember.** The
  plan already carries the first *("every cushion reader must remember it")*. M3 measured that two of its
  three readers also had to net the shortfall, and fixed both; `selectTightTopUp` is safe only because it
  returns `null` while `shortfall > 0`. **A fourth reader would have to rediscover both rules.** → **P6.10**

**→ surfaced by S1.5.5's before-scan *(2026-08-26)***

- **The enumerate-vs-partition class has no gate.** M1's shape — build a rendered list by `ORDER.map()`
  over a constant instead of partitioning the input — is what the audit calls the failure mode "this
  project has already paid for six times", and M1's fix closes the **two sites in `money.tsx`, not the
  class.** A gate would have to tell a *menu* enumeration (`billCategoryOptions()`, correct by
  definition) from a *render* one, which is the scope question, not a line of code. **Rec: defer** —
  a gate whose rule is undecided is [D65]'s "re-rating is not a proof" wearing a lint script's clothes.
  → **.9.3** *(where the gated-classes re-check lives)*

**→ surfaced by S1.5.3's after-scan *(2026-08-26)***

- **A fully-undone top-up still marks the cycle `disturbed`.** `guardianPredictionCore.ts:94` tests only
  `cycleTopUp?.forCycle`, and a spent record survives with `amount: 0`, so a cycle where the user topped
  up and then undid it is excluded from calibration as a "user intervention". ⚠️ **Pre-existing and
  unchanged by [B3]** — the old negative-apply left `{forCycle, amount: 0}` too. ⛔ Whether an
  applied-then-undone top-up should still disturb calibration is a **§2.9 semantics call**, not a bug to
  fix in passing, and it moves a premium number. → **P6.10**

**→ surfaced by S1.5.2's after-scan *(2026-08-26)* — neither is a pass-1 finding**

- **The unfunded block has no truncation at scale.** 11 unfunded essentials render **11 rows** on Today,
  under a card whose funded half buckets precisely so a long cycle never becomes a wall. ⚠️ **Pre-existing
  on free** *(that tier's array was never emptied)*; B5 makes it reachable on premium too, so this is a
  wider audience for an old shape, not a new one. ⭐ The `summariseNames` + tap-to-expand treatment P1-4
  built for the recovery card is the ready answer. → **P6.10** *(the money lens sees it at real size)*
- **An unfunded obligation has no mark-paid control anywhere on Today**, while the card's own copy says
  *"cover these from savings or your next paycheck."* ⚠️ The user CAN mark it from Money, so this is a
  missing affordance, not a trap — and wiring `onMark` for an item with no `RequiredRow` is a real design
  change, not polish. **Rec: defer.** → **P6.10**

**→ S1.2's brief — attack points found at the S1 switch-in *(2026-08-26)***

- **`pickTopUpGoal` ranks a SECOND emergency-typed goal as the safety net.** `guardianSelectors.ts:295`
  passes `['savings','emergency']` and [D24] prefers savings so the EF is not raided — but the type test
  is `goal.type`, not the one owner, so a second pot is protected as if it *were* the emergency fund.
  ⚠️ **Behaviour, not naming — outside M9.** Hand it to the auditors as an attack point, not as a verdict.
  *(S1.1 before-scan)*
- **Which fixtures pick the EASY member of their class?** Blocker #1 measured it: **10 of 11
  `data-recovery` tests stayed green with the blocker planted back**, because every fixture in the tree
  seeded `balance: null`. ⚠️ **Not a list of files — a question to aim an auditor at**, and the answer for
  the money surface is S1's. *(S1.1 after-scan)*
- **Two independent empty-string money guards, no shared helper.** `parseDebtFormValues.ts:19-22` and
  `migrations.ts:78-84` now hold the same rule, written twice, in two packages. The second was written
  *because* the first was not reused. ⚠️ **Not urgent and not free** — a shared parser crosses the
  `@core` / `apps/rn` seam. *(S1.1 after-scan)*

**→ surfaced by the `.11.17` audit round *(2026-08-25)* — filed, NOT in the fix cluster**

- 🔴 **[DEVICE] One log line on the existing probe decides whether M4 is a blocker.** *(.11.17 after-scan)*
  `expo-sqlite`'s on-device BLOB representation is unmeasured; under `node:sqlite` the captured iOS 26.2
  container gives 22 rows, all `Uint8Array`, **0 dropped**, but it is a **driver** property so the failure
  is **all-or-nothing** — a Buffer-shaped return drops 22/22 and strands a whole v1.6 portfolio behind
  *"fresh install"*. **Rec: fold the log line into the next device build** *(P6.13/P6.14)*, not a build of
  its own.
- **2 live `setMonth` sites remain in the LEGACY root Next surface** *(.11.17 · B)* —
  `components/AmortizationCalendar.tsx:24`, `components/Onboarding/FirstDebtOrBillStep.tsx:15`, which
  `check-month-arithmetic`'s `ROOTS` does not scan. **Out of `2.0.0`; P6.11 deletes that tree.** Rec: **do
  not fix — verify the deletion covers them** at P6.11 switch-in. Filed so the count is not re-derived.
- **The `.11.17` swept-clean list must be handed to the NEXT audit round as a ratchet** *(.11.17
  after-scan)* — it is in `SUMMARY.md` §*"Swept and found clean"* and now carries the allocation engine's
  14-input boundary set, the nine plan cards, `packages/core/imports/`, and `addMonths` across 5 timezones.
- **Whether the 39 untraceable P6.8 findings are actually open**, or merely unwritable by a 2-character id
  *(.11.17 · E)*. Answered by `.11.19`, not before — recording it so the question is not lost if M12's fix
  changes the number again.
- ⚠️ **`money.tsx:493`'s bar mixes a projected numerator with a stamped denominator** *(.11.17 · B, not
  rated)* — needs the same by-direction call `.11.12.10` made. **Rec: decide it inside M1's fix**, since
  that is the same question about the same field.

**→ P6.8.9.5 — surfaced by the .9.1 re-shoot and the .9.2 verification *(2026-08-24)***

- 🔴 **The matrix has NO HISTORY — `apps/rn/capture-ref/` is gitignored.** *(.11.8 after-scan)* A re-shoot
  overwrites the only copy of every frame, so a frame's prior state cannot be recovered. ⚡ That is exactly
  what made `.11.2`'s seed bleed unauditable in hindsight: `history` was proven before/after only because
  both frames happened to be in one session's context, and `paywall`/`onboarding` **can never be**. It also
  means `.9.1`'s *"0 stale"* and every earlier frame-based finding are not reproducible from the repo.
  **Rec: pin the frames a finding depends on into `docs/evidence/<date>-<topic>/`** — the mechanism the
  repo already has — rather than tracking all 236.
- 🔴 **The coach-mark mis-tap window is closed in ONE spec and open in ten.** *(.11.5 after-scan · D-3)*
  `strategy-compare.spec.ts` seeds `coachMarksSeen`; ten other `/progress` specs meet the reveal unseeded,
  sharpest being `trajectory-interactivity.spec.ts:51-64`, which drives raw `page.mouse` coordinates on the
  coached card behind a 2 s wait. ⚠️ `.11.5` made the callout's sentence transparent to touch, which
  removes the *user-facing* half — the remaining exposure is **flake in the suite**, not a shipping defect.
  Decide whether the ten seed it or whether the reveal waits for idle.
- 🔴 **The Skia load failure is unreported in a production web build.** *(.11.7 · D-1)* `reportError`'s
  default sink is a dev-only `console.warn` and `sentry.web.ts` is a deliberate no-op, so with `__DEV__`
  false nothing happens — including on the marketing embed, where `canvaskit.ts:15-20` documents a real
  wasm 404. ⚠️ **Behaviour is correct (it fails closed); the telemetry is missing.** The claim in the source
  is corrected; wiring a web reporter is a scope decision (Sentry is kept out of the web bundle on purpose).
- 🔴 **Adding a member to `DataRepair['entity']` obliges a consumer sweep — and only the COPY consumer is
  compiler-gated.** *(.11.4 after-scan)* `ENTITY_NOUN`'s exhaustive `Record` failed the build when `goal`
  was added, exactly as designed; the **behaviour** consumers are invisible to it, which is how the
  "Funded" badge over unreadable money shipped. Candidate gate: every `entity` member must be named in
  both the copy map **and** the celebration guards. → decide the decidable form.
- ⏭ **[D60] DEFERRED 2026-08-25 — the CSV parser keeps requiring `YYYY-MM-DD`.** *(.11.4 after-scan)*
  `.11.4` made the in-app caption honest, which is the floor and is enough for 2.0. ⚠️ A real bank or
  spreadsheet export writes `9/1/2026` and loses **every** row — and the header parser was widened on the
  premise *"a real export says `Minimum Payment`"*, which is the same export. **How much of a real export
  the importer promises to read is a product decision, revisit for 2.1.**
- 🔴 **A goal's per-paycheck pace cannot be changed or removed after creation.** *(.11.3 after-scan)*
  `priorityPerPaycheck` is written only at `SaveForItSheet.tsx:109`, reachable only from the *Can I afford
  it?* flow; `GoalSheet` edits name, target, current and type. So a user who chose *"$200 a paycheck"* can
  never revise it, and `.11.3`'s repair notice had to name a workaround instead of an action.
  ✅ **[D60] ACCEPTED 2026-08-25 — add the pace to `GoalSheet` as an optional field** → `.11.14`. It closes
  the product gap and the repair copy together.
- 🔴 **Which other money fields is a `0` repair DANGEROUS for, not merely wrong?** *(.11.3 after-scan)*
  `readMoney` repairs everything to `0`, and `.11.3` measured that `0` is fail-visible for a balance and
  fail-silent for a pace. The enumeration is also known short — `RequiredExpense.fullAmount` ·
  `RecommendationOverride.amount` · `IncomeActual` · `SurpriseOutflow` are unrepaired. ⚠️ Ask per field
  *"what does 0 MEAN to the engine"*, not *"is it repaired"*.
- 🔴 **Pay cycle history breaks at 2× text, and the frame that shows it has only just existed.** *(.11.2
  after-scan)* The corrected `phone/dark/textscale-2x-history.png` truncates the title to *"Pay cycle h…"*
  and wraps *"May 26, 2026"* onto two lines inside its row. ⚠️ **Every earlier text-scale frame of this
  screen was of the EMPTY state**, so no lens has ever seen the populated design at scale — this is new
  evidence, not a re-read. Judge it after `.11.8`'s re-shoot, and expect siblings on `paywall` /
  `onboarding` for the same reason.
- ⚠️ **`check-contrast`'s control-boundary model does not describe `AddRow`.** *(.11.1 after-scan)* The gate
  models a control edge as `border.control` over a `background.secondary` **fill** and takes
  `max(border, fillOnly)` (`check-contrast.ts:407-413`) — **AddRow has no fill**, which is the premise of the
  fix that moved it there. Hand-computed at ≈3.7:1 light, so it passes; **by arithmetic the gate never
  performed.** And the `border.strong` exclusion beside it is still an unverified claim. Decide whether the
  model gains a no-fill case or the exclusion gains a proof.
- ⚠️ **A closure updates ONE row and leaves the others standing — candidate gate class.** *(.7.10 before-scan)*
  Two found in one read: `.7.7`'s row still said A1-2 · V2-1 · V3-5 were open, and the backlog still said
  V3-5 was "unpinnable as written" — both contradicted by a ✅ row **in the same file**. `lint:closure` counts
  mentions, so it reads clean on exactly this. **Decidable version:** an id may not appear as both open and
  closed in `DEBT_ELEVATION_PLAN.md`. Both instances corrected in place.
- 🔴 **`/history`'s default frame IS its empty frame** — same defect as `/living-expenses`, not fixed with
  it: rows come through `selectHistoryRows` off cycle records, so it needs a real fixture. **The populated
  Pay Cycle History design has never been photographed.** *(.9.1)*
- ⚠️ **A1-9, two residuals in neither the log nor the slice:** the free-tier read announces on web and not
  iOS (`verdictLine` is null when `!isPremium`), and the `applied`/`saved` states return before the wrapper
  and announce on **neither** platform. *(.9.2, f-a11y)*
- ⚠️ **A1-8 — three of four badges are held only by the type system**, one is test-pinned. Decide whether the
  type is the pin. *(.9.2, f-a11y)*
- ✅ **V3-5 — CLOSED at .7.7, row kept only so .9.5 does not re-open it.** Extracted to `endPillWidth()`
  (`trajectoryDomain.ts:54`) and pinned in `trajectoryDomain.test.ts`. *(.9.2)*
- ⚠️ **`lint:type-scale`'s 28 pt exemption re-verified clean** by an independent read (five `title1`
  consumers, all prose headings, none a figure) — no action, recorded so it is not re-litigated. *(.9.2)*
- 🔴 **V2-6's REVEAL CAN MOVE THE PAGE UNDER A USER'S FINGER, and it is a first-visit-only window.** *(.7.9)*
  The scroll that makes room for the hint fires right after the first measure, so a control can shift
  between a tap's actionability check and the tap. **Observed, not theorised:** `error-context.md` from the
  gate showed the toggle on screen, the alert up, and the panel never opened.
  ⭐ **Proposed fix — render the callout AFTER the reveal settles** rather than scrolling underneath a
  callout that is already visible: nothing moves once the hint is on screen, which removes the race and is
  better UX than either current option. Not taken at .7.9 because it is more surgery on a component this
  item already changed heavily, on the eve of a session close. **→ also a P6.14 device row**, since the
  feel of an instant scroll is not judgeable off-device.
- ⚠️ **`TrajectoryChart.tsx:603`'s end-pill ink is a TOKEN-ADOPTION question, deliberately not taken as a
  contrast fix** — it measures 9.95:1 dark / 6.44:1 light and clears AA on both. `surface.goldPillInk`
  pairs with `surface.goldPill` while the component paints its own `gold`, so adopting the ink alone
  half-adopts a pair and adopting both changes a **shipped light colour with no device to look at**.
  Exempted in `lint:contrast` with the measurement. *(.7.1)*
- ⚠️ **Siri `phrases:` are exempt from the apostrophe sweep and that is a standing rule, not an oversight** —
  they are matched against **speech**, so a typographic apostrophe is a behavioural change on a surface with
  no device proof. If A8.4's device pass ever covers Siri, re-open it there. *(.7.1)*
- ⛔ **Ask of every gate in this repo whether it PREVENTS or merely DESCRIBES.** The matrix printed four
  `⛔ UNREACHED` lines every run for the whole audit and nothing read them; `lint:closure` counts ledger
  mentions and cannot see an unpinned fix. **Both were reported as evidence of completeness.** *(.9.1)*
- 🔴 **THE 13 LIVENESS RE-DERIVATIONS — measure them, one control each** *(S1.10.6.9 after-scan)*.
  ⛔ **This is `G-1`…`G-5`'s class in files nobody has looked at.** `debtLiveness` is now the owner and
  `lint:trust-claims` caps the sites at **13 across 10 files**, exact in both directions and downward-only,
  so the class **cannot grow silently** — but a row is *"this site re-derives liveness and nobody has
  measured whether it matters"*, not a verdict. ⚠️ **7 of the 10 files never mention the trust module at
  any line.** Run the command for the live list; the shape of each measurement is the pair this cluster
  already uses (truth · repaired · genuinely-zero). ⚡ Two are very likely non-defects and should be
  *measured* into `EXEMPT` rather than assumed — `demoRun.ts` and `sandboxScenarios.ts` build synthetic
  stores that carry no repairs at all.
- ⚠️ **`AffordabilityCard`'s free-tier line and its verdict share one gate, and only the verdict was
  argued** *(S1.10.6.9 after-scan)*. `G-4` replaced both on `!mayClaim(store, 'required-plan')`, which is
  right for the verdict — one word the user acts on, wrong in a known direction. For the free tier it
  removes the *only* number that tier gets, and the alternative (a caption under an honestly-hedged figure)
  was not measured against it. **Not a defect; an unexamined trade.**
- ⚠️ **`selectAffordability` still returns the inflated `discretionaryNow`** *(S1.10.6.9 after-scan)*. The
  guard is at the render sites, so the selector remains a loaded gun for a future caller — the shape
  `C-4` fixed the other way (`selectPaidOffDebts` nulls the figure and *"every render downstream then does
  the right thing for free"*). ⛔ Deliberately not taken now: the inflation comes from the ALLOCATION, so
  sanitising it means teaching the engine about repairs, which is a much larger change than this cluster's
  scope and would be unaudited work landing on the money engine.
