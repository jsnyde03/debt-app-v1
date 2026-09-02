# D3 — the legacy Next root (reduced mandate) · pass 7

**Subject:** the legacy Next/Capacitor surface at the repo root (`app/`, `components/`, `lib/`, `tests/`),
plus the root build/CI config. **Manifest:** `ROUTING-D3.txt` — 12 files, 5,436 lines, 0 exit-bearing.

**Mandate, per the brief's `D3` section:** (1) a defect that MIGRATES to `apps/rn`; (2) evidence the
surface is still LIVE, which would make `P6.11`'s deletion bigger than the plan assumes. Not audited
line-for-line.

**Verdict, up front:** the surface **does not ship and is not user-reachable** — but it is **not inert**.
It is compiled and executed by the release gate through `packages/core`, exactly as pass-6 `D3-1` said.
The new result this lane returns is that **both standing enumerations of what must move before `P6.11`
undercount the set**, and they undercount it in the same place.

---

## D3-1 — `major` · both enumerations of the core→legacy move-set omit `lib/analytics/track.ts`; the closure is 7 files / 12 edges, not "5 root modules" or "7 files · 8 edges"

**User-facing consequence.** None today. The consequence lands on `P6.11`: whoever relocates the shared
engine's legacy dependencies will work from one of the two written lists, both of which are one file
short. `packages/core/testing/testSafeStorage.ts` → `lib/storage/safeStorage.ts` →
`@/lib/analytics/track` survives the move, resolves to a path inside the deleted tree, and **breaks
`npm run typecheck:core` and `npm run test:regression`** — steps of `validate:release:rn` *and* of
`.github/workflows/web-e2e.yml`, which runs on `push: ["**"]` and every pull request. That is the
failure 🎯 scheduled `P6.11` last to avoid (*"I do not want to take any chances at all of us deleting
something from legacy that is still needed but missed"*).

**File and line.**
- `docs/DEBT_ELEVATION_PLAN.md:270-271` — CLASS X: *"`packages/core` imports **7 files out of it across
  8 edges**"*, filed as *"a PLAN correction that blocks `P6.11`"*.
- `docs/audits/2026-08-31-s1-money-pass6/D3-findings.md:75-86` — the table CLASS X derives from, headed
  *"the eight edges, all measured, not inferred"*. Its 8 rows are 1 tsconfig row + 6 distinct legacy
  files.
- `docs/DEBT_ELEVATION_BACKLOG.md` (`→ P6.11 — delete with the tree`, row `g.1`) — the second,
  independent enumeration: *"five root modules totalling 293 lines
  (`lib/subscription/{plans,hasFeatureAccess,features}` · `lib/storage/{safeStorage,migrateState}`)"*.
- The omitted edge: **`lib/storage/safeStorage.ts:1`** — `import { track } from "@/lib/analytics/track";`

**The measurement.** Runner: `docs/audits/2026-09-02-s1-money-pass7/d3-closure.mjs` (seeded from every
`.ts`/`.tsx` under `packages/core`, following `@core/*`, `@/*` and relative specifiers transitively;
counts side-effect `import "…"` as well as `from "…"`). Printed at HEAD `e5ecc7b6`:

```
LEGACY FILES IN THE CLOSURE FROM packages/core: 7
  lib/analytics/track.ts                  <- lib/storage/safeStorage.ts
  lib/storage/migrateState.ts             <- packages/core/testing/testSafeStorage.ts
                                          <- lib/storage/testMigrateOriginalBalance.ts
  lib/storage/safeStorage.ts              <- packages/core/testing/testSafeStorage.ts
                                          <- lib/storage/migrateState.ts
  lib/storage/testMigrateOriginalBalance.ts  <- packages/core/testing/runRegressionTests.ts
  lib/subscription/features.ts            <- packages/core/testing/testSubscriptionGating.ts
                                          <- lib/subscription/hasFeatureAccess.ts
  lib/subscription/hasFeatureAccess.ts    <- packages/core/history/selectVisibleHistory.ts
                                          <- packages/core/testing/testSubscriptionGating.ts
  lib/subscription/plans.ts               <- packages/core/history/selectVisibleHistory.ts
                                          <- lib/subscription/hasFeatureAccess.ts
TOTAL IMPORT EDGES INTO THE LEGACY ROOT: 12
```

⭐ **Confirmed a SECOND, independent way — by the compiler, not by my parser.**
`npx tsc --noEmit -p packages/core/tsconfig.json --listFiles`, filtered to the legacy roots, prints
**exactly the same seven files**:

```
lib/subscription/plans.ts
lib/subscription/features.ts
lib/subscription/hasFeatureAccess.ts
lib/analytics/track.ts
lib/storage/safeStorage.ts
lib/storage/migrateState.ts
lib/storage/testMigrateOriginalBalance.ts
```

`npm run typecheck:core` exits **0** over them right now, so this is not a latent path — the release
gate is compiling the legacy root today, and `track.ts` is in the set the compiler loads.

Line counts, `wc -l`: the five modules the backlog names total **exactly 293** — its arithmetic is right
for the set it names. The real move-set is **351** lines across **7** files
(`+testMigrateOriginalBalance.ts` 46, `+track.ts` 12).

⚠️ **The two lists disagree with each other, not only with the measurement.** CLASS X's 7 includes
`testMigrateOriginalBalance.ts`; the backlog's 5 names it in prose and then leaves it out of the module
list. Neither names `track.ts`. Deriving membership two independent ways and finding they disagree is
the brief's own instruction, and it is what surfaced this.

**Mechanism, as a hypothesis.** Both enumerations were produced by grepping `packages/core` for imports
that leave it — a **one-hop** query. `track.ts` is at hop 2 (core → `safeStorage` → `track`), so no
one-hop query can see it, and the fact that the file count coincidentally landed on 7 in one of them
made the number look corroborated. `testMigrateOriginalBalance.ts` is missed by a narrower version of
the same defect: it enters through a **side-effect** import (`import "@/lib/storage/…"`, no `from`), so
a `from ['"]@/` pattern misses it entirely — I reproduced that miss myself before widening the pattern,
and it is why the closure has to be walked rather than grepped.

**Remedy — UNVERIFIED.** At `P6.11` switch-in, do not work from either list: re-run a transitive closure
against the tree as it stands then, and move (not delete) every file it names. `d3-closure.mjs` is
written for that and is disposable. A stronger close would be to make the closure a gate — a check that
reds if `packages/core`'s transitive import set ever reaches `app/`, `components/`, `lib/` or `tests/`
by any path — since `lint:import-graph` already exists as a home for it. **Neither the move nor the gate
was attempted; pass 7 reads and reports.**

**Origin.** `neighbour` (the legacy `lib/` files) reaching `instrument` (`packages/core/testing/*`) and
the plan/backlog documents. **Confined to the legacy root? NO — it migrates in the sense that matters:
the *break* lands in `packages/core`, which `apps/rn` links, and in the CI workflow that gates every
push.** The legacy files themselves are not in `apps/rn`.

---

## D3-2 — `minor` · `npm run preflight:xcuitest` reads its only fixture out of the tree `P6.11` deletes, and `P6.11`'s written scope does not name it

**User-facing consequence.** None. The consequence is a tool that stops working after the deletion with
no line in the plan predicting it: `preflight:xcuitest` is the local stand-in for a ~22-minute macOS
native-lane cycle, and the native lane's *"characteristic failure is an unexplained timeout twenty
minutes downstream"*.

**File and line.**
- `scripts/preflight-xcuitest-target.ts:29` — `const FIXTURE = join(REPO_ROOT,
  'ios/App/App.xcodeproj/project.pbxproj');`
- Its own docblock, `:15-16`: *"Fixture: `ios/App/App.xcodeproj/project.pbxproj`, the legacy Capacitor
  project. … ⚠️ It dies at 5.5.1 — when it goes, vendor a copy under `scripts/fixtures/`."*
- `docs/DEBT_ELEVATION_PLAN.md:411` — the `P6.11` row's "Remaining" list names
  `validate:release:legacy`, the root Next lint, the demo-mode test references, `tests/visual/*.cjs` and
  one screenshot mechanism. It does not name this, and `ios/` is part of the root Capacitor surface.
- `docs/DEBT_ELEVATION_BACKLOG.md` `→ P6.11 — delete with the tree` — four rows, none of them this one.

**The measurement.** `git ls-files ios` → **25 tracked files**, including
`ios/App/App.xcodeproj/project.pbxproj`. `grep -rn "preflight:xcuitest\|preflight-xcuitest"` across the
repo excluding `node_modules`/`docs` returns exactly three hits: the `package.json` script (`:92`), the
script's own usage comment, and `scripts/surface-coverage.s0.json:403`. **No workflow and no
`validate:*` chain runs it** — so this is a manual tool, which is why it is a `minor` and not a `major`:
nothing green is claiming to cover it.

**Mechanism, as a hypothesis.** The obligation was recorded where the dependency lives (a comment in the
consuming script) rather than where the deletion is planned, and it was recorded against **`5.5.1`**.
`docs/DEBT_ELEVATION_PLAN.md:390-391` records that `5.5.1` was renumbered to `P6.11.1`; five instrument
comments still carry the retired number (`check-money-format.ts:30`, `check-rounding.ts:62`,
`preflight-native-lane.ts:522`, `preflight-xcuitest-target.ts:16`, `surface-inventory.ts:17`), so a
`grep P6.11` over `scripts/` — the natural way to assemble the deletion's scope — does not return any of
them. The same shape `legacy-container-capture.yml:43-45` warns about in writing: *"a deferral attached
to another item's date inherits that item's slippage without anyone deciding to."*

**Remedy — UNVERIFIED.** Add a `P6.11` backlog row for the fixture (vendor a redacted `project.pbxproj`
under `scripts/fixtures/`, or retire the pre-flight with the tree), and sweep the five stale `5.5.1`
comments to `P6.11` so the scope is greppable. **Not attempted.**

**Origin.** `off-surface` (root `ios/`) reaching `instrument` (`scripts/preflight-xcuitest-target.ts`).
**Confined to the legacy root? The fixture is; the broken tool is in `scripts/` and serves `apps/rn`'s
native lane.**

---

## D3-3 — `minor` · a comment on a money surface says the legacy tree "ships behind the public embed"; it never did, and the claim was false the day it was written

**User-facing consequence.** None directly. The consequence is to triage: this sentence is the stated
*reason* a legacy-only copy fix was spent, and it invites the next reader to treat legacy-root defects
as shipped and user-reachable. It argues the opposite of what `D3-1`'s evidence supports, on the same
tree, and it is the kind of premise the brief warns decays like a carried number.

**File and line.** `components/PaydayCaptureSheet.tsx:274-277`:

> `⛔ [L3-7] The same presumption-as-event the RN sheet carried. Found by the retired-string sweep, NOT`
> `by the finding, which listed only the RN site — this tree dies at 5.5.1 but ships behind the public`
> `embed until then.`

**The measurement.**
- The public embed is `apps/rn`. `.github/workflows/embed-pages.yml:162` (the only deploy of it) runs
  `npm run export:web -- --output-dir ../../_site --clear` with `working-directory: apps/rn`, and
  `apps/rn/package.json:13` defines `export:web` as `expo export --platform web`. The legacy Next app is
  not in that export, and no other workflow publishes anything.
- It was never otherwise: `git show 82bb94b3:.github/workflows/embed-pages.yml` — the commit that
  **created** the workflow, `2026-08-17` — already exports `apps/rn`.
- The comment landed **`80c36869`, 2026-08-18**, the day after. So it was false when written, not stale.
- Corroboration that the embed means `apps/rn`: `packages/core/utils/formatCurrency.ts:19` names
  `paywallLead` as *"behind the live public embed"*, and `paywallLead` exists only at
  `apps/rn/src/store/paywallLead.ts`.
- Second-order: `5.5.1` is the retired number for `P6.11.1` (`docs/DEBT_ELEVATION_PLAN.md:390-391`), so
  this comment carries the same stale identifier as `D3-2`'s five.

**Mechanism, as a hypothesis.** "The public embed" was the natural name for *the web build* while the
Capacitor/Next root was the only web build in the repo. `embed-pages.yml` renamed the referent one day
earlier without renaming the phrase, and the sweep that wrote this line reasoned from the phrase rather
than from the workflow — the exact substitution the commit's own subject line records twice
(*"the sweep rule was wrong twice"*).

**Remedy — UNVERIFIED.** Replace the justification clause with what is true: this tree is compiled and
executed by `test:regression`/`typecheck:core` and ships nowhere, and update `5.5.1` → `P6.11`. Do not
delete the `L3-7` cross-reference; the *string* correction it records is sound, only its stated reason
is not. **Not attempted.**

**Origin.** `neighbour`. **Confined to the legacy root — the file dies with the tree, and `apps/rn`'s
copy of the L3-7 string was fixed separately. It is reported because the FALSE claim is about liveness,
which is this lane's second mandate.**

---

## D3-4 — `minor` · `allocatePaycheck`'s "the reserve labels are read by nobody" is a measured claim that is false at HEAD in two places, one of them a live gate

**User-facing consequence.** None today, and the rename it licenses would be caught. The claim is
load-bearing all the same: it exists specifically to tell a future editor that renaming
`"Keep cash buffer"` is free, and it is stated as a measurement (*"Measured: every consumer of
`allocations` filters by `category`"*) in the highest-fan-in money module in the tree. Acting on it
would re-create, through the other half of the same filter, the exact defect `5.1b` had just repaired —
`bufferTotal` silently reading `0` regardless of the real buffer.

**File and line.**
- The claim: `packages/core/engine/allocatePaycheck.ts:592-598` — *"⛔ T4.2 — THE `label` ON AN
  ALLOCATION IS DIAGNOSTIC, NOT COPY. Measured: every consumer of `allocations` filters by `category` …
  The five reserve labels below are read by nobody … So renaming one of these changes NOTHING on screen,
  and coupling a component to one (audit L2-6's suggested fix) would make a dead string load-bearing."*
- Counter-example 1 — `components/ResultsSection.tsx:208-211`:
  `item.category === "cushion_buffer" && item.label === "Keep cash buffer"`. A component **is** coupled
  to one, and it was coupled to it in the same edit whose comment (`:202-206`) explains that the
  *category* half of this filter had matched nothing for months because nothing typechecked this tree.
- Counter-example 2 — `packages/core/testing/testFullAppRegression.ts:135` and `:151`:
  `allocations.some((a) => a.label === "Keep cash buffer")`. That file runs inside
  `npm run test:regression`, a step of `validate:release:rn` **and** of `.github/workflows/web-e2e.yml`.
  Not a screen — but it is a live consumer, and the comment's sentence is about consumers, not screens.

**The measurement.** `grep -rn "Keep cash buffer" packages/core apps/rn/src components app lib tests` at
HEAD `e5ecc7b6` returns **6** hits: the emit site (`allocatePaycheck.ts:603`), the comment itself, a
mention in `packages/core/copy/vocabulary.ts:13`, the two test assertions, and the legacy component
filter. `grep -rn cushion_buffer` shows the category is pushed **exactly once**, always with that label —
so `ResultsSection`'s label conjunct is currently **redundant**: it can only ever narrow, never widen,
which is why the defect is latent rather than live. `apps/rn` filters `cushion_buffer` by category only
(`planSelectors.ts:131`, `guardianSelectors.ts:578`, `expenseReserveSelectors.ts:128`) — the shipping
app matches what the comment says.

⚠️ **And the guard on the rename is half vacuous.** `:135`'s
`assertEqual(hasBuffer, false, "Cash buffer not added when shortfall exists")` is an **absence**
assertion over a string match: rename the label and it still passes, for the wrong reason. Only its
positive twin at `:151` (`hasBuffer2 === true`) would red. The pair as a whole does catch a rename —
stated so the remedy is not written against the wrong half.

**Mechanism, as a hypothesis.** The T4.2 measurement was true when it was taken and was written in the
absolute (*"read by nobody"*) rather than as of a date. Two consumers were added afterwards by people
who never had reason to read this comment: the test at `testFullAppRegression.ts`, and `5.1b`'s repair
of `ResultsSection`, which restored the *category* the engine emits and left the label conjunct it found
in place — fixing the reported half of a two-part filter and leaving the sibling, which is the pass-6
brief's *"iterate the class, never the member you found"* shape one field over.

**Remedy — UNVERIFIED.** Either drop the redundant label conjunct at `components/ResultsSection.tsx:210`
(it narrows a filter that is already exact — but the file dies at `P6.11`, so this may be spend on a
corpse), or, better, date and qualify the claim at `allocatePaycheck.ts:592-598`: it is true of *screens*
and false of *consumers*, and the two live label readers should be named in it so the next rename knows
what it will red. **Neither attempted.**

**Origin.** `neighbour` — surfaced from `components/ResultsSection.tsx` (which did not change) against
`packages/core/engine/allocatePaycheck.ts` (which did): exactly the *"two-producer disagreement visible
from the side that did not move"* case the origin table describes. **Does it migrate? The FALSE COMMENT
does — it lives in the shipping engine and outlives `P6.11`. The coupled component does not;
`apps/rn` filters by category alone.**

---

## Evidence the legacy root is otherwise INERT — the negative result, stated so it is not re-derived

Every check below was run at HEAD `e5ecc7b6` on `v1.7-dev`.

| question | measurement | answer |
|---|---|---|
| Does the release build touch it? | `codemagic.yaml` — the only publishing workflow — builds `apps/rn` via `expo prebuild` + `xcode-project build-ipa`. Its header records the `cap sync` workflow was **removed 2026-07-28** | **No** |
| Does CI build or serve it? | `web-e2e.yml` runs `typecheck` · `lint:rn` · `test:stamp` · `test:regression` · `test:app` · `test:scenarios` · `test:e2e:rn` · `test:e2e:embed`. No `npm run build`, no `serve out`. Its own header says it *"used to gate the LEGACY Capacitor/Next app"* | **No** |
| `embed-pages.yml`? | publishes `_site` from `apps/rn`'s `npm run export:web` | **No** |
| `legacy-container-capture.yml`? | its tag trigger was **retired at P6.7.1**; only `workflow_dispatch` remains, and it is unregistered because the file is not on the default branch. It also checks out **`v1.6-dev`** and hard-fails if `apps/` or `packages/` exists — so it never builds the in-tree legacy root | **No** |
| Is `validate:release:legacy` reachable? | `grep -rn validate:release:legacy` over `.yml`/`.yaml`/`.ts`/`.mjs` → **zero call sites**; only prose references | **No** |
| Does `apps/rn` import it? | `grep` for relative and aliased imports from `apps/rn/src`, `packages/core`, `scripts` into `app/`/`components/`/`lib/` → the only hit is a **string literal inside a test fixture** (`scripts/check-scan-floors.ts:104`) | **No** (the one real edge runs the *other* way — D3-1) |
| Is the built bundle committed/served? | `out/` is gitignored and **0 tracked**; root `dist/` and `public/` are 5 Next boilerplate SVGs each; `site/` is 2 stale v1.5 HTML files already filed for deletion | **No** |
| Does `capacitor.config.ts` still point at it? | yes — `webDir: 'out'`, `appId: com.jasonsnyder.debtplanner`. **Inert**: nothing runs `cap sync`, and `apps/rn` has no Capacitor config of its own (`find -maxdepth 3 -name 'capacitor.config.*'` → one hit, the root) | **Config only** |
| The `S1.12.11` precedent — unparseable tracked files behind green gates? | `grep -rlE '^(<<<<<<<\|>>>>>>>)' app components lib tests` → **no matches**. All 12 manifest files parse; line counts 19–1,516, total 5,436 | **Clean** |
| Are the gates honest about skipping it? | `surface-coverage.ts:478-481` skips `app`/`components`/`lib`/`tests` with the reason *"legacy Next surface — deleted at P6.11"*, and `check-conflict-markers.ts:11` reads that skip rather than restating it; `check-money-format.ts:30`, `check-apostrophes.ts:56` and `check-rounding.ts:62` declare the same exclusion; `check-month-arithmetic.ts:195,216` **scans it, reports it, and deliberately does not fail** on it | **Declared, not silent** |
| `lint:webkit` — a gate whose entire subject is this tree | `DEFAULT_SRC_DIRS` is `components` + `app` (`check-webkit-flex-controls.ts:23`), it is reachable only from root `npm run lint` → `validate:release:legacy` (retired), and its own docblock at `:120-135` records that it **is red right now** on `app/page.tsx:1653`. Already filed to `P6.11` in the backlog | **Known, filed** |

## Money claims in the 12 manifest files — checked for MIGRATION, and none does

- `components/PayoffInterestSavedCard.tsx:16-19` — `formatMonths` floors (`Math.floor(months / 12)`),
  the pass-6 `D3-3` fix. Its docblock claims the RN copy floors for the same reason. **Verified rather
  than quoted:** `apps/rn/src/components/payoff/trajectoryDomain.ts:111-113` is byte-equivalent, and
  `trajectoryDomain.test.ts:146-151` asserts `formatMonths(30) === '2 years'` and
  `formatMonths(42) === '3 years'`. The two copies agree; the duplication is stated and scheduled.
  **No finding.**
- `lib/hooks/useDebts.ts:67` hand-rolls `(balance * (apr / 100)) / 12` for its
  *"Minimum payment may not cover monthly interest"* warning rather than calling
  `@core/debt/calculateMonthlyInterest`. The two agree to within the shared `roundMoney`
  (`packages/core/debt/calculateMonthlyInterest.ts:32` and `packages/core/utils/money.ts:1` are the same
  `Math.round(amount * 100) / 100` — checked, they have not drifted), and `grep` for the warning string
  across `apps/rn/src` and `packages/core` returns **zero hits**. **Legacy-only. No finding.**
- The legacy tree hardcodes `paycheckBuffer: 50` at **both** of its allocation entry points —
  `app/page.tsx:333` (the plan memo) and `components/TimelineSection.tsx:187` (the timeline) — where
  `apps/rn/src/store/selectors.ts:70` passes `effectivePaycheckBuffer(store)`, a user-settable value. So
  the legacy tree is **internally consistent** and diverges only from the shipping app. **Confined**, and
  it dies with the tree. Recorded, not filed.
- `components/TimelineSection.tsx:133-135` prefixes the sign itself
  (`{isPositive ? "+" : "-"}{formatCurrency(item.amount)}`), and `components/SnowballSection.tsx:1119`
  hardcodes a `+` on a cushion *delta* that can be negative
  (`+{formatCurrency(last.projectedSafeCash - first.projectedSafeCash)}` → `+$-120`). ⚠️ **The
  TimelineSection pattern is NOT legacy-only** — `apps/rn/src/components/progress/TimelineLedger.tsx:108`
  is the same construction (`` `${income ? '+' : '−'}${formatCurrency(item.amount)}` ``) over the same
  producer, `packages/core/timeline/buildTimelineItems.ts`. **I did not measure whether a negative
  `item.amount` is reachable** (the sources are `paycheckAmount`, `livingExpenseReserve`,
  `expense.amount`, `min(minimumPayment, balance)`, `bufferAllocation.amount`, `action.actualAmount`),
  so I am **not filing it** — an unmeasured mechanism is what this brief forbids. **Flagged for whichever
  lane owns `apps/rn/src/components/progress/`**, which is where it would have to be measured.
- `app/page.tsx:979` persists `rolloverRequiredExpenses(reconciledExpenses, …)` and then `:999` schedules
  notifications from `rolloverRequiredExpenses(requiredExpenses, …)` — the **unreconciled** list. Two
  rollovers from two inputs, one persisted and one notified against. **I did not measure whether the
  reconciled paid-flags change what `rolloverRequiredExpenses` emits**, so this is an observation, not a
  finding. Legacy-only either way: `apps/rn` does not share this handler.
- `components/AmortizationCalendar.tsx:19-26` uses `base.setMonth(base.getMonth() + monthOffset)`, the
  month-overflow shape `lint:month-arithmetic` exists for. That gate **already scans the legacy tree and
  reports without failing** (`check-month-arithmetic.ts:195,216`), and the backlog already records the
  class as *"out of 2.0.0; P6.11 deletes that tree"*. **Already known. No new finding.**
- `components/RequiredActionItem.tsx`, `components/Results/CompletedActionsList.tsx`,
  `components/Results/OptionalGoalsList.tsx`, `components/SwipeActionCard.tsx` — all money goes through
  `@core/utils/formatCurrency`; no local formatter, no arithmetic. **Nothing to report.**

## Not a finding, stated so the next reader does not re-check it

`app/page.tsx:62-63` imports `@core/testing/seedPlannerState` and `@core/testing/simSmokeSeed` into
production page code. That is what `legacy-container-capture.yml:104-110` relies on
(`NEXT_PUBLIC_SIM_SMOKE=1`), it is confined to a surface that ships nowhere, and `apps/rn` does not
repeat it.

---

## Report split by origin

| origin | blocker | major | minor | total |
|---|---|---|---|---|
| `neighbour` | 0 | 1 (`D3-1`) | 2 (`D3-3`, `D3-4`) | 3 |
| `off-surface` | 0 | 0 | 1 (`D3-2`) | 1 |
| **total** | **0** | **1** | **3** | **4** |

`ROUTING-ORIGINS.tsv` gives 11 of the 12 manifest files `neighbour` and
`components/PayoffInterestSavedCard.tsx` `off-surface`. `D3-1` is filed under `neighbour` because its
live edge is `lib/subscription/*` + `lib/storage/*` — files that did not change but share a consumer
(`packages/core/testing/*`) with files that did; `D3-3` and `D3-4` are both `neighbour` for the same
reason (each was surfaced from a legacy file that did not move, against a producer or a workflow that
did); `D3-2`'s subject is root `ios/`, which is on no inventory at all.

**Migration, stated per finding:**

| | confined to the legacy root? |
|---|---|
| `D3-1` | **No.** The breakage lands in `packages/core` and in `web-e2e.yml`, on every push. |
| `D3-2` | The fixture is. **The tool it breaks is not** — it serves `apps/rn`'s native lane. |
| `D3-3` | **Yes.** The false claim dies with the file. Reported because the claim is about liveness. |
| `D3-4` | **The false comment does not** — it lives in `packages/core/engine/allocatePaycheck.ts` and outlives `P6.11`. The coupled component does. |

**No finding in this lane is a `blocker`: nothing here makes the shipping app state something false
about a user's money. Three of the four are about `P6.11`'s size and one is a false measurement in the
shared engine.**
