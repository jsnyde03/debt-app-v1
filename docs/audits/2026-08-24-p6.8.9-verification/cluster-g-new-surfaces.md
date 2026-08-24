# P6.8.9.2 — cluster **g (NEW SURFACES)**: C8 · P1-3 · C7

Independent verification. The verifier built none of these. Written incrementally, one id at a time.

⚠️ **Where the brief actually lives.** The task named
`docs/audits/2026-08-24-p6.8.9-verification/BRIEF.md`; the only copy on disk is
`docs/audits/2026-08-21-p6.8-finish/docs/audits/2026-08-24-p6.8.9-verification/BRIEF.md` — a nested
duplicate tree created by a relative-path write (`git status`: `?? docs/audits/2026-08-21-p6.8-finish/docs/`).
It is untracked and it is the *only* brief. This file is written at the intended path. Minor, but a second
verifier looking for the brief where the plan says it is will not find it.

---

## C7 — **PARTIAL**

**The finding** (`docs/audits/2026-08-21-p6.8-finish/SYNTHESIS.md:338`): *"Snowball vs avalanche side by
side — both simulations already run on every render; `TrajectoryChart.tsx:133` discards one."*

### 1 · Is the observation closed?

**Yes, and the discard is now a read rather than a waste.**

- The discard the finding named is still there and still correct as the *curve* selection:
  `apps/rn/src/components/payoff/TrajectoryChart.tsx:152` — `const active = strategy === 'snowball' ? snowball : avalanche;`
- The user-visible gap — no side-by-side anywhere in the app — is closed at
  `apps/rn/src/components/payoff/TrajectoryChart.tsx:547-568`: a disclosure headed **"Snowball or
  avalanche?"** (`:555`) feeding `StrategyCompare` **all four** props the chart already had
  (`:561-564` — `snowball`, `avalanche`, `snowballClears`, `avalancheClears`).
- The comparison itself renders two named columns with each debt's clear month and each strategy's
  debt-free date: `apps/rn/src/components/payoff/StrategyCompare.tsx:58-59` (columns) and `:89`, `:92-103`
  (date + clear rows). The user's own strategy is named, not colour-coded: `StrategyCompare.tsx:86`
  (`{active ? ' · yours' : ''}`) with the reason stated at `:84-85`.
- **Photographed for the first time.** `apps/rn/capture-ref/p6.8/phone/{light,dark}/expanded-progress-disclosures-open.png`
  shows the section open in both themes: *"Snowball · yours"* in accent, *"Debt-free Oct 2026"* right-aligned,
  first clear row below. ⚠️ **The frame is cut off by the tab bar after the first row** — the avalanche column
  is in *neither* theme's frame. The surface is still only half photographed.

### 2 · What did the site ALSO do, and does it still do it?

The Payoff Trajectory card at rest is the app's calmest premium surface, and P1-3 had just been fixed on the
same card. Three properties were at risk:

| property | still true? | what proves it |
|---|---|---|
| the resting card is unchanged — no sixth element | ✅ | `apps/rn/tests/e2e/strategy-compare.spec.ts:37-44`, and it is built correctly: a **render barrier** (`:42`, the toggle visible) *before* the `toHaveCount(0)` at `:43`. Would have gone red on the "renders expanded at rest" plant, and cannot pass on a blank page |
| the two columns are genuinely different content | ✅ | `strategy-compare.spec.ts:58-66` compares the two columns' `innerText` and asserts **order of appearance**, not line index. This is the one assertion that catches "both columns render the snowball summary" |
| the control is operable and named to a screen reader | ✅ | `TrajectoryChart.tsx:550-553` (`accessibilityRole="button"`, `accessibilityLabel="Compare snowball and avalanche"`, `a11yExpanded`), confirmed in the captured tree: `apps/rn/capture-ref/p6.8-a11y/progress.txt:17` — `button "Compare snowball and avalanche": Snowball or avalanche?` |

⚠️ **Not proven by any test:** that the section survives text scaling. The disclosure is captured only at
default scale; `capture-ref/p6.8/phone/*/textscale-2x-progress.png` shows the card **collapsed**, so the
two-column head row (`StrategyCompare.tsx:110`, `flexDirection: 'row'` with `numberOfLines={1}` on the
date at `:88`) has never been seen at 2×.

### 3 · Was the finding's implied REMEDY right? — **No, and [D59] was right to refuse it**

Verified independently, not inherited. The evidence folder `docs/evidence/2026-08-24-c7-strategy-divergence/`
contains both probes (`probe-curves.ts`, `probe-clears.ts`) and a README; the measured numbers are carried
into the unit tests as *cases*, not as prose — `apps/rn/src/components/payoff/compareStrategies.test.ts:39-93`
is the four measured portfolios (identical order · the 19-month first-win gap · the reshuffled order · 53-vs-51).
⭐ **`compareStrategies.test.ts:104-105` is the assertion worth keeping**: the takeaway matches no
`/\$|interest|cheaper|save/i`, *and* the comparison object carries no interest field to render — so the
"never measured" caveat in [D59] is enforced by code rather than remembered.

⛔ **But the built thing does not answer the question in the case where the answer matters most.**

`comparisonTakeaway()` (`compareStrategies.ts:88-109`) builds `parts` from **two deltas only** —
`finishSooner` and `firstWinSooner` — and **both are `null` whenever either strategy never reaches zero**
(`compareStrategies.ts:70-71` require both operands non-null). When that happens, `differs` is still `true`
(`:76`, because the debt-free months differ), so the "these are the same" early return at `:89` does not
fire, `parts` stays empty, and `:108` returns the string **`"."`** — a takeaway line consisting of a single
full stop.

**Measured, not reasoned.** Running the real engine (`packages/core/debt/buildPayoffTrajectory.ts:33`
`simulatePayoff`) over a 960-portfolio grid of two ordinary cards, **16 portfolios** produce a finish under
one strategy and never under the other. Example, and nothing about it is exotic:

> `Store card $1,500 @ 12% (min $30)` + `Card $4,000 @ 29.9% (min $60)`, extra `$40/mo`
> → **snowball: never clears** (`debtFreeMonth = null`, 0 clears) · **avalanche: debt-free month 127**
> → `differs = true`, `finishSooner = null`, `firstWinSooner = null`, **takeaway = `"."`**

The mechanism is `buildPayoffTrajectory.ts:91` — `if (monthlyBudget > 0 && totalInterest >= monthlyBudget) break;`
— whose trigger depends on *which* balances are still outstanding, i.e. on the strategy. So the engine can and
does produce "one order pays this off and the other never does", which is the single largest difference
snowball-vs-avalanche can have, and the surface built to explain that difference prints a period.

Two smaller faults in the same function:
- **A sentence that starts lower-case.** With `finishSooner === null` but `firstWinSooner !== null`, the
  first branch to fire is `:100`/`:102`, whose text is written as a *continuation* — measured output:
  `"avalanche clears your first debt 3 months sooner."`
- **The columns are honest where the takeaway is not.** `StrategyCompare.tsx:89` correctly renders
  **"No payoff date"**, so the user sees the two columns disagree and then reads a `.` underneath.

⚠️ **The existing e2e would not catch it.** `strategy-compare.spec.ts:77` asserts
`expect(text.length).toBeGreaterThan(0)` — `"."` has length 1 and passes. That is a proxy for "the takeaway
says something", and the subject is not the length. It is the same shape as the f-cluster's V2-6.

⚠️ **[D59] wrote down the exact hole it then shipped through.** `docs/DEBT_ELEVATION_LOG.md:18784-18786`:
*"Two probe cases were degenerate — a minimum payment below the monthly interest never clears the debt …
a reminder that 'months to payoff' has an infinite case that any comparison UI has to render."* The
columns render it; the takeaway does not.

One further reachable copy fault on the same path: when **neither** strategy clears anything (both `clears`
arrays empty — measured with `Store card $400 @ 0% + Payday loan $9,000 @ 120%`, which breaks at
`buildPayoffTrajectory.ts:91` in month 1), `StrategyCompare.tsx:46-53` shows **"Add a debt to see how the
two payoff orders compare."** to a user who is looking at $9,400 of debt. Its comment at `:44-45` names the
case it meant to catch — *no debts* — but the condition it uses is *nothing clears*.

### Verdict — **PARTIAL**

The observation is closed, the remedy shape [D59] substituted is the right one and is now backed by
evidence + measured unit cases, and the resting card is preserved with a correctly-built absence test. But
the comparison's one-line conclusion is empty on the class of portfolio where the two strategies most
disagree, and no test would catch it.

**What would close it:** a branch in `comparisonTakeaway()` for `debtFreeMonth == null` on exactly one side
(*"Avalanche pays these off; snowball never gets there on this budget"* — no dollar figure needed, so [D59]'s
constraint is untouched); a capital-letter guarantee on the first `parts` entry; a unit assert on the
takeaway for the case already present but un-asserted at `compareStrategies.test.ts:115-125`; and an e2e that
asserts the takeaway *matches a sentence*, not that it is non-empty.

---

## P1-3 — **CLOSED**

**The finding** (`docs/audits/2026-08-21-p6.8-finish/slices/P1-premium-bar.md:84-101`): the Payoff
Trajectory's x-domain is set by the minimums ghost, so *"the closer someone is to debt-free… the more their
own trajectory collapses into an unreadable sliver"*, and on the default seed *"**neither** curve draws at
all"* — nine empty years, a stranded date pill, a legend describing two absent lines.

### ⭐ 1 · The lens's own hedge, and whether the fix respected it

The slice flags exactly one clause as unresolvable from stills, twice:

- `slices/P1-premium-bar.md:99-101` — *"⚠️ The one thing I cannot separate from stills: whether the default
  seed's curve is absent or merely degenerate (a near-vertical drop at x≈0 clipped by the plot edge).
  `state-progress-single` shows the degenerate version as a 4px sliver, so degenerate-and-clipped is the
  likelier of the two."*
- `slices/P1-premium-bar.md:378` (the "not in evidence" table) — *"only a device or a taller plot can settle it."*

✅ **The fix respected it, and this is the part that matters.** The hedge was not carried forward as a
caveat — it was **resolved by running the engine**, which is the third instrument the lens did not have. The
commit message states the result directly (`git show 7c1d586`): *"Running the engine settles it: degenerate.
Both curves draw and both reach zero; the user's is ~5% of the width."*

I verified this is right from the code rather than taking it: the active path is built from
`apps/rn/src/components/payoff/TrajectoryChart.tsx:175-176` (`toPts(active)` → `smoothPath`) with **no
domain filter on the active curve at all**, so it could never have been absent; and the pre-fix domain
expression, recovered from history, is `const maxMonth = Math.max(1, ...all.map((p) => p.month));` over
`all = [...active, ...ghost, ...cone]` (`TrajectoryChart.tsx:160`) — the ghost being the longest curve by
construction. A 2-month plan against a 109-month ghost maps to `mapX(2) ≈ 1.8%` of the plot: a ~5px vertical
drop at the left edge. **Degenerate-and-clipped, exactly as the lens's likelier reading said.**

⚡ **This is load-bearing, not bookkeeping.** *"Neither curve draws at all"* points at a rendering failure —
the fix for that is hunting a Skia/path bug, and there is no bug to find. Acting on the finding's **stated**
description would have burned the item and closed nothing. The builder measured first and fixed the domain,
which is the defect the hedge pointed at.

### 2 · Is the observation closed?

**Yes, on the finding's own evidence frames**, both re-shot at P6.8.9.1:

- `apps/rn/capture-ref/p6.8/phone/dark/progress.png` — the frame the finding cited for *"nine empty years"*
  now shows the blue plan curve descending to `$0` at a labelled **Oct 2026** pill, an x-axis reading
  **Oct · Dec** (months, not years), and the grey minimums line running flat off the right edge.
- `apps/rn/capture-ref/p6.8/phone/dark/state-progress-single.png` — the *"~4px sliver"* frame: the curve now
  spans ~17% of the plot rather than a sliver, and the pill no longer collides with the `$0` label.

The mechanism: `apps/rn/src/components/payoff/trajectoryDomain.ts:40-57`. The domain is
`min(rawEnd, max(MIN_DOMAIN_MONTHS, ceil(ownEnd × DOMAIN_MARGIN)))` where `ownEnd` is the later of the
active plan and the lean cone (`:55`), wired in at `TrajectoryChart.tsx:164`.

⚠️ **One clause of the finding is not fully closed, and it is a design choice rather than a miss.**
`MIN_DOMAIN_MONTHS = 6` (`trajectoryDomain.ts:24`) floors the axis, and the month-tick fallback starts at
`stride = round(maxMonth / 3)` (`TrajectoryChart.tsx:252-253`), so a plan clearing in **month 1** still has
its first axis tick land **after** its payoff date (ticks at months 2 and 4) — the literal complaint at
`P1-premium-bar.md:91`. The scale is now six months rather than nine years, the endpoint carries its own
labelled pill, and the e2e bounds it (`years.length <= 1`), so I read this as acceptable and deliberate —
`trajectoryDomain.ts:20-22` states the floor's reason. Recording it so it is not rediscovered as a defect.

### 3 · What did the site ALSO do, and does it still do it?

⭐ **This fix's test file is the strongest artifact in the cluster on exactly this question**: half its cases
exist for properties the *old* expression got right, written before the fact rather than after
(`apps/rn/src/components/payoff/trajectoryDomain.test.ts:13-15`).

| property the site also had | still true? | what proves it |
|---|---|---|
| the **lean/variable-income cone** clears later than the typical plan and must not be clipped | ✅ | `trajectoryDomain.ts:55` takes the max of active and cone; pinned at `trajectoryDomain.test.ts:61-70` — `assert(domain >= 34)` with the exact plant named in the log (clamp to active alone → 23) |
| a plan that **never clears** draws across the full extent | ✅ | `trajectoryDomain.ts:54` (`if (activeEnd == null) return rawEnd`), pinned at `trajectoryDomain.test.ts:71-76` |
| the axis **never invents empty space** past the data | ✅ | `Math.min(rawEnd, …)` at `:56`, pinned at `trajectoryDomain.test.ts:77-82` |
| the long-horizon chart the lens called *"genuinely beautiful"* / *"category-leading"* | ✅ | `capture-ref/p6.8/phone/dark/state-progress-many.png` — full-width curve, year ticks 2027–2034, per-creditor dots, glowing terminus, all intact |
| the touch-scrub | ✅ | `TrajectoryChart.tsx:279-292` snaps to the nearest point in `active`; a narrower domain gives it *more* pixels per month, and `active` never extends past the domain (`buildPayoffTrajectory.ts:129` breaks the sim at the zero crossing, so there is no tail to clip) |

**The regression the fix could have introduced, and did not:** a clamped span can contain no January, and
year-only ticks would have produced a **blank axis**. Handled at `TrajectoryChart.tsx:249-256` (below two
year marks, label months) and pinned by its own e2e — `apps/rn/tests/e2e/trajectory-domain.spec.ts:36-43`,
with `:37-39` naming that it exists for the fix's own failure mode. ⭐ Two specs, two jobs: the log records
that the "axis is labelled" spec correctly **passed** under the old-domain plant, because it guards a
different property.

**Would the tests have failed on the original defect?** Yes, by name and at the rendered layer:
`trajectory-domain.spec.ts:45-59` asserts `years.length <= 1` on a near-payoff seed; the pre-fix domain
produced four year labels (log: *"Expected: <= 1, Received: 4"*). ⚠️ It asserts a **bound**, not a pinned
year (`:56-58`), so it will not rot on the run date.

⚠️ **Not pinned by any test:** the *rendered* share of the width the user's own curve occupies. The unit
suite asserts it on synthetic curves (`trajectoryDomain.test.ts:50` — `8 / domain > 0.75`); no e2e measures
the drawn path. That is a defensible line — the domain is the mechanism and the unit test owns it — but a
future change to `mapX` or to `PAD` could re-shrink the curve with every current test green.

### Verdict — **CLOSED**

Observation gone at the mechanism and visible as gone on the finding's own two evidence frames; the three
properties the old expression got right are each preserved *and separately pinned*; the fix's own possible
regression was anticipated and has its own spec; and the lens's flagged-soft clause was resolved by
measurement instead of inherited — which is what stopped the item being spent on a rendering bug that does
not exist. The finding's description (*"neither curve draws"*) was wrong; its diagnosis was right, and the
build followed the diagnosis.

---

## C8 — **PARTIAL**

**The finding** (`docs/audits/2026-08-21-p6.8-finish/SYNTHESIS.md:339`): *"CSV import —
`core/imports/debtCsv.ts` exists and its only caller is the tree **P6.11 deletes**. The live listing
advertises it as free."* Remedy: *"PRESERVE NOW, BUILD 2.1"* (`SYNTHESIS.md:359`).

### 1 · Is the observation closed?

**Yes — the parser is out of the doomed tree, and the door the FAQ promised for two versions now exists.**

- **The parser survives P6.11 independently of any caller.** `packages/core/imports/debtCsv.ts` now has its
  own suite, `packages/core/imports/testDebtCsv.ts`, run in `test:regression`. I ran it: **61 assertions
  passed.** The log's first plant — delete the module — reds with `Cannot find module './debtCsv'`, so the
  *test* is the gate rather than the caller. That is the strongest part of the rescue.
- **The three named runtime defects are genuinely gone**, checked at the source rather than in the log:
  - `File`/`file.text()` → `parseDebtCsvText(text, options)` (`debtCsv.ts:121`), with the reason stated at
    `:9-13`. The remaining `file.text()` call is in the *legacy* caller (`lib/hooks/useDebts.ts:191`),
    where the DOM exists.
  - `crypto.randomUUID` → injected `makeId` (`debtCsv.ts:47`, called at `:213`). `grep -rn randomUUID
    packages/core apps/rn/src` returns **zero** live uses (only a docblock and two audit fixtures).
  - `Number()` money → `parseAmountField` / `parseOptionalAmount` (`debtCsv.ts:4`, used at `:152`, `:162`,
    `:172`, `:190`), the shared module now at `packages/core/utils/amountField.ts`.
- **The UI path is real and end to end**, traced rather than assumed:
  `app/(tabs)/money.tsx:320` (**empty state**) and `:413` (**list footer**) → `ImportDebtsSheet`
  (`:322`, `:450`) → `parseDebtCsvText` at preview with `makeId: () => ''`
  (`components/entities/ImportDebtsSheet.tsx:53` — ids are *not* consumed by a preview the user backs out
  of) → `mintDebtIds(currentDate, state.store.debts, n)` at apply (`:77`) → one `addDebt` per row (`:80`).
  I confirmed the last link is sound: `store/store.ts:364-385` **does not overwrite a supplied `id`**, so
  the batch mint actually reaches the store.
- **The native door matches an already-verified one.** `data/csvImportFile.ts:49` uses
  `await new File(asset.uri).text()` — identical in shape to `data/backupFile.ts:79`, the Phase-5 path
  verified on hardware. `expo-document-picker@56.0.4` and `expo-file-system@56.0.10` are both installed and
  the SDK-56 `File` class exists (`node_modules/expo-file-system/build/File.d.ts:18`), so the import that
  would otherwise take the whole Money screen down on device resolves.

**No monetization hole:** the two `AddRow`s are ungated and there is no free-tier debt cap anywhere in
`apps/rn/src` — consistent with the listing's "free".

### 2 · What did the site ALSO do, and does it still do it?

The rescue moved two modules across package boundaries, which is where collateral would be:

| property | still true? | what proves it |
|---|---|---|
| the **legacy** Capacitor caller still imports and still gets UUIDs | yes | `lib/hooks/useDebts.ts:6,191` — it reads its own `File` and passes its own `makeId`; the move did not strand it |
| `amountField` keeps its behaviour after moving to `packages/core/utils/` | yes | its test moved with it into `test:regression`; 12 import sites re-pointed, compiler-verified |
| an import **adds** rather than replacing (the backup door next to it replaces) | yes | `apps/rn/tests/e2e/csv-import.spec.ts:116-127`, and `:117-118` names exactly why it is pinned |
| the preview writes nothing | yes | `csv-import.spec.ts:57-58` — reads `localStorage` and asserts length 0 *before* the apply |
| a batch mints distinct ids | yes | `csv-import.spec.ts:67` end to end, plus `store/debtIds.test.ts`. Note this pins the **new** batch bug, not the original `randomUUID` one — UUIDs would have passed it |

The e2e are built the right way round: they read the persisted store (`csv-import.spec.ts:22-25`) rather
than the sheet, and `:70-80` asserts the grouped balance is the **number 1200**, not merely "not null" —
the weaker assertion would have passed over the `NaN` → `null` → `PAID OFF` corruption that is the point.
**Would these have failed on the original defect?** Yes trivially: there was no door at all, so
`page.getByTestId('debts-import-csv')` did not exist.

⚠️ **The file-picker branch is exercised by nothing.** `CSV_FILE_SUPPORTED` is `false` on web
(`data/csvImportFile.web.ts:16`), so `pickCsvFile`, `copyToCacheDirectory` and the iCloud-provider case are
source-only. The log files these as three P6.14 device rows; that is honest, and it is still an untested
branch in a shipped feature.

### 3 · Was the finding's implied REMEDY right? — right in kind, and it undercounted **again**

*"Move `core/imports/debtCsv.ts` out of the doomed tree"* understated the job by three defects — the log's
own finding. ⛔ **It undercounts a second time. There is a fourth, and it is the same class as the three.**

**⛔ 4th — `19.99%` is refused, and the error message is false.**
`amountField.ts:27` strips `[,\s$]` and **not `%`**, so `parseOptionalAmount("19.99%")` is `NaN` → `null`.
`debtCsv.ts:191` then refuses the row — and picks its message with `Number(rawApr.replace(/[,\s$%]/g, ""))`
at `debtCsv.ts:192`, **which does strip the `%`**. So the reject path knows how to read the cell and the
accept path does not, and the user is told:

> `Row 2: APR must be between 0 and 100` — for a cell reading `19.99%`.

Measured against the real parser, not reasoned:
`name,balance,minimumPayment,apr,dueDate` / `Visa,1200,50,19.99%,2026-09-01` → `debts: []`,
`errors: ["Row 2: APR must be between 0 and 100"]`. **19.99 is between 0 and 100.** This is precisely the
class g.1 claims to have closed — *"the error messages stopped lying"* — and `%` is the single most likely
character to appear in a human-written or exported APR column. It is **CSV-specific**: the debt sheet's APR
field is labelled `APR %` with `keyboardType="decimal-pad"` (`components/entities/DebtSheet.tsx:354`), so
the symbol never arises there. The one-line fix is `%` in `amountField.ts:27`'s character class — but that
is a shared money module, so it is a decision, not a typo.

**⚠️ 5th — `dueDate` is accepted with no validation at all.** `debtCsv.ts:182-185` checks only that the cell
is non-empty, then writes it to **both** `dueDate` and `originalDueDate` (`:219-220`). Measured: a row with
`dueDate = next friday` **imports clean, no error**, as does `09/01/2026`. The app's invariant is ISO —
`DebtSheet.tsx:118` seeds from `todayLocalISO()` and every other writer goes through `DateField`.
Downstream, `store/guardianPredictionCore.ts:17-19` does ``new Date(`${b}T00:00:00`).getTime()`` and returns
`Math.floor(NaN / 86_400_000)` = **`NaN`**, and `notifications/notifications.ts:143` compares `dueDate >
today` as a *string*. This is the B1 shape — a plausible cell producing `NaN` in date arithmetic instead of
a rejected row — arriving through the one channel with no `DateField` in front of it.

**⚠️ 6th — `toCount` enforces neither constraint its own docblock states.** `debtCsv.ts:97` says *"Whole,
positive, and not money"*; `:98-104` checks only `Number.isFinite`. Measured: `remainingPayments = -3`
imports clean; `remainingPayments = 2.5` imports clean **and silently rewrites the balance from 600 to 250**
via `normalizeBnplInstallment` (`debtCsv.ts:212`), because an installment-native balance is derived as
scheduled × remaining. A typo'd installment count rewrites the user's money.

None of the three is covered: `packages/core/imports/testDebtCsv.ts` has no `%` case, no dueDate-format
case, and its BNPL cases (`:184-199`) use only valid counts.

**⚠️ And the site C8 named as the reason to build this is still wrong.** `site/support.html:285` still
reads *"columns for name, balance, **minimum payment**, APR, and **due date**"*. Typed literally that is a
file with headers `minimum payment` and `due date`, which normalize to neither `minimumpayment` nor
`duedate` (`debtCsv.ts:93-95`, `:146`, `:148`). Measured: **every row is rejected** —
`["Row 2: minimumPayment is required."]`. The log found this and holds replacement text for **P6.21**, so
it is known and scheduled; it is nonetheless the state on the live site today, and it is the *only* public
instruction for the feature. In-app the sheet states the correct columns (`ImportDebtsSheet.tsx:119`), so a
user who opens the door is fine; a user who reads the FAQ first is not.

### Verdict — **PARTIAL**

The finding's observation is fully closed: the parser is rescued, tested independently of any caller, and
now has a real two-branch entry point whose e2e assert the persisted store rather than the UI. But the
remedy undercounted a second time — a fourth defect of the *same* class it undercounted by the first time
(`19.99%`, refused with a message that is untrue), plus an unvalidated `dueDate` that puts `NaN` into the
date arithmetic and a `remainingPayments` that silently rewrites a balance — and the only public
instructions for the feature still produce a file that imports nothing.

**What would close it:** add `%` to `amountField.ts:27` (or strip it in `debtCsv.ts` before the APR read)
and fix the message at `debtCsv.ts:195`; validate `dueDate` against ISO and reject the row otherwise;
enforce whole-and-positive in `toCount`; add the three cases to `testDebtCsv.ts`; and land the P6.21 FAQ
replacement. ⚡ Consider making header matching space/underscore-insensitive rather than rewriting the FAQ
to match the parser — the doc is being bent to fit the code, and `minimum payment` is what a person writes.

---

## Cross-cluster note

⚠️ **All three of these surfaces are new and two of them ship with a copy path nothing asserts.** C7's
takeaway can render `"."` and C8's APR error can state something untrue, and in both cases a test exists
that passes anyway because it asserts a **proxy** — `text.length > 0` for the takeaway, `errors.length`
for the parser. That is the f-cluster's V2-6 lesson recurring twice in the newest code in the sweep: the
assertion names the *presence* of a string rather than the *claim* the string makes.
