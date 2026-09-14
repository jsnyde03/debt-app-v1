# Class 5 re-audit, round 1 — lane L3 (screens, plan cards, e2e specs)

- **Lane:** L3 — the ONLY lane that runs Playwright (port :4319)
- **Pin:** `ea3f5e0e` · class-5 range `c7df99c2..ea3f5e0e`
- **Worktree:** `C:/Users/Jason/audit-c5r1-L3` (detached at pin) · base worktree `C:/Users/Jason/audit-c5r1-L3-base` at `c7df99c2` for attribution
- **Worst-case spend quote (wall clock, no sub-agents):**
  - up to 24 Playwright-backed registry proofs x ~3m40s = ~88 min
  - 11 changed e2e specs run green once = ~11 x 2-4 min = ~45 min
  - plants (relaxed-assertion re-runs) ~15 x 3-4 min = ~60 min
  - attribution re-runs at `c7df99c2` for any finding ~5 x 4 min = ~20 min
  - **total worst case ~3.5 h**; batches quoted again before each is started
  - *(13:50)* prove:guards batch of the 16 L3-pinned proofs: ~55 min, worst case ~80 min with server re-attempts
  - *(14:05)* plant phase after it: 3 exports (~3 min each) + 28 test invocations (~35 s each) + 2 render probes (~4 min each)
    ≈ **35 min**, worst case ~50 min
- **Status: COMPLETE** *(2026-09-14)*

## Summary

| severity | attributable | reservoir | class4-tail |
|---|---|---|---|
| blocker | 0 | 1 — **L3-1a** | 0 |
| major | 1 — **L3-6** | 2 — **L3-5a**, **L3-5b** | 0 |
| minor | 3 — **L3-1b**, **L3-2**, **L3-4** | 0 | 0 |
| **total** | **4** | **3** | **0** |

- **Attributable (the exit counts these):** L3-1b `PlanHero` draws the suggested move it no longer speaks · L3-2 Progress
  refuses a free user's `$12,000 to go` that Money states · L3-4 the Today hero withholds a split a lost APR does not move,
  and the per-surface assertion cannot see it · L3-6 `C3-9`'s payoff-family gag can be reverted with nothing going red.
- **Reservoir, each a class-5 closure not reached on one surface:** L3-1a the suggested move stays drawn, inflated by a lost
  minimum, beside the refusal (`C1-5`) · L3-5a Progress's cash-flow bars ask no trust question (`C3-11`'s twin) · L3-5b the
  same bars caption a lost line as `$200` (`C1-1`/`C1-6`'s owner reached the Guardian, not this reader).
- **Withdrawn:** L3-3 (save-for-it at capacity 0) — unreachable from the UI, measured.
- **Closed, by planting:** 16 of 16 L3-pinned registry proofs MATCHED; 38 spec-level plant runs across batches A–D. The
  closures named below are red for their own reason, with any relaxed variants recorded: `.5.4d` Guardian / hero /
  affordability / windfall · `.5.7 ④b` runway hold and confirmation · `C3-8` · `C3-9` (date) · `C3-11` (both directions) ·
  `C3-13` · `C3-14` · `B1-1` (date) · `C1-5` (split) · `.5.4a` both over-suppression directions.
- **For L4 (instrument observations, not filed here):** `lint:trust-claims` cannot see which claim a call site names (`13c`:
  a non-existent claim name passes); the registry names no pass-7 `C3-9`, `C1-5`, `C1-2`, `C1-3` entry, and no pass-7 `C1-1`.
- **Process incident:** the base teardown removed the worktree before its junctions; nothing in the main checkout was lost
  (verified three ways) — see the section below.
- **Files opened:** the brief · `RESUME-PROTOCOL.md` · `CLASS5-REAUDIT-LANES.tsv` · `CLASSIFICATION.md` §CLASS 5 and the
  class 6/8/11 rows · `DEBT_ELEVATION_PLAN.md` `.12.6.5` · `DEBT_ELEVATION_LOG.md` `.5.4d` entries · all 22 L3 manifest files
  (diff + reads) · outside the manifest: `trustSelectors.ts` / `.test.ts`, `selectors.ts`, `balanceSelectors.ts`,
  `journeySelectors.ts`, `guardianSelectors.ts`, `expenseReserveSelectors.ts`, `payoffSelectors.ts`, `planSelectors.ts`
  (signatures), `migrations.ts`, `dataRepairsCopy.ts`, `SpokenForSheet.tsx`, `CashFlowSection.tsx`,
  `tests/e2e/helpers/seed.ts`, `playwright.config.ts`, `scripts/prove-guards.ts`, `scripts/lib/plantSafety.ts`,
  `scripts/check-type-scale.ts`, `scripts/check-trust-claims.ts` (floors), `apps/rn/src/testing/runAppTests.ts`,
  `scripts/finding-guards.json`.

## Range and setup, as derived

- `git log --oneline c7df99c2..ea3f5e0e` = **77** commits (the brief says 76; the 77th is `ea3f5e0e` itself, the brief's
  own commit, so 76 is the count of commits *before* the brief — not a disagreement about the code). `git diff --stat
  c7df99c2..ea3f5e0e -- apps packages scripts` = **70 files**, matching the brief. L3's 22 rows match the diffstat.
- Worktree `audit-c5r1-L3` verified: HEAD `ea3f5e0e`, clean, three junctions present. Base worktree
  `audit-c5r1-L3-base` made at `c7df99c2` with the recipe.
- Registry proofs whose `proof.unfix[].at` is an L3 manifest path: **16** — **12 Playwright-backed** + 4 not
  (`S1P4-C4-7-SURFACES` test:app · `S1P6-C1-15-NAMES-THE-MOVED-CASH` test:app · `S1P6-C1-18-RENDERERVALUE`
  lint:import-graph · `S1P7-U4-CONTRAST-COMMENTS` lint:contrast). The registry holds **24** Playwright-backed proofs in
  total (the brief's number); the other 12 pin files outside every manifest.

## Class-5 membership, derived four ways

| source | ids |
|---|---|
| `CLASSIFICATION.md` §CLASS 5 table | **13**: `C3-13` `C3-8` `C3-9` `C3-11` `C3-5` `C3-1` `C1-1` `C1-5` `C1-6` `D2-12` `C3-2` `B1-1` `C3-14` |
| `DEBT_ELEVATION_PLAN.md` `.12.6.5` rows | the 13, **plus** `C1-2` `C1-3` (folded into `.5.2`) · `C3-6` *(pass 7)* (`.5.4` list) · `B1-2` (`.5.7` ④b, "from class 6") · pass-6 `C3-6` reopened (`.5.7` ④a) |
| registry entries the range ADDED (`c7df99c2` 302 → pin 330, **+28, −0**) | carry `C3-5`, `C3-6` (pass 7 and pass 6), `C3-1`, `C3-2`, `D2-12`, `B1-1`, `C3-14`, `B1-2`, `C3-8` (free twin only), and `.5.7` instrument/render ids. **No added entry names `C3-9`, `C1-5`, `C1-1`, `C1-6`, `C3-13`, `C3-11`, `C1-2` or `C1-3`.** |
| commit messages in the range | 42 distinct ids, most cited as context from other classes; every plan id above appears |

**Derived set: 18** — the 13 · `C1-2` · `C1-3` · pass-7 `C3-6` · `B1-2` · pass-6 `C3-6`.

Disagreements:
- `B1-2` (line 264) and `C1-2` (line 266) are rows of **CLASS 6 — MONEY WRITTEN OR DESTROYED**; pass-7 `C3-6` (line 296) is
  a row of **CLASS 8 — THE FIX REACHED THE MEMBER, NOT THE CLASS**; `C1-3` appears only in **CLASS 11**'s swept list (line
  352). The plan closes all four inside class 5, and `CLASSIFICATION.md` still counts them in classes 6, 8 and 11 — so
  class 6's *"12 findings"* and class 8's *"12 findings"* headers overstate what is still open there, unless those rows are
  marked closed somewhere this audit did not read.
- ⚠️ **Guard coverage by registry, searched by id in each entry's `what`/`token`/`file` (not only its key):** `C3-9` **0** ·
  `C1-5` **0** · `C1-2` **0** · `C1-3` **0** · `C3-13` only an instrument ledger entry (`S1P7-57-2D-DEBT-SPREAD-LEDGER`) ·
  `C3-11` only the claim-lattice/vacuous-conjunct instruments · `C1-1` only **pass-6** entries (`S1P6-C1-1-NAMETHEFIGURE`,
  `S1P4-C4-7-SURFACES`) — the pass-6/pass-7 id collision the brief warns of: nothing registered names pass-7 `C1-1`'s `$200`
  line · `C1-6` only `S1P6-C1-6-AMOUNTCOLLAPSE` (pass 6). These closures are pinned by e2e specs and unit tests that
  `lint:finding-guards` does not track, so a deletion of those assertions is undetected by the registry. **Recorded for L4
  (the registry is its lane), not filed here.** My plant batches below exercise `C3-9`, `C1-5`, `C3-13`, `C3-11` and `C3-8`
  through their e2e specs directly.
- No e2e spec asserts pass-7 `C1-1`'s render (the Guardian's *"hold your line against it"* with the figure withheld):
  `grep "line against it|floorUnread"` over `tests/e2e` → 0.

## Registry proofs re-executed (`prove:guards --no-record`, pin worktree)

`06-prove-guards-16-pinned.txt` — appended as each verdict lands.

| id | runner | verdict |
|---|---|---|
| `S1P4-C4-7-SURFACES` | test:app | ✅ MATCHED |
| `S1P6-C1-15-NAMES-THE-MOVED-CASH` | test:app | ✅ MATCHED |
| `S1P6-C1-18-RENDERERVALUE` | lint:import-graph | ✅ MATCHED |
| `S1P7-U4-CONTRAST-COMMENTS` | lint:contrast | ✅ MATCHED |
| `S1P3-D3-5` | playwright | ✅ MATCHED |
| `S1P4-C4-9-MIXED` | playwright | ✅ MATCHED |
| `S1P6-C2-3-CONVERTFIELDS-E2E` | playwright | ✅ MATCHED |
| `S1P6-A1-7-TODAYBARRIER` | playwright | ✅ MATCHED |
| `S1P6-A1-3-CENTSARITY` | playwright | ✅ MATCHED |
| `S1P7-57-3-FREE-C3-8-TWIN` | playwright | ✅ MATCHED |
| `S1P7-57-3-AFFORDABILITY-REFUSAL` | playwright | ✅ MATCHED |
| `S1P7-57-3-WINDFALL-REFUSAL` | playwright | ✅ MATCHED |
| `S1P7-57-4B-RUNWAY-HELD` | playwright | ✅ MATCHED |
| `S1P7-57-4B-CONFIRM-FUNDED` | playwright | ✅ MATCHED |
| `S1P7-57-5-HERO-FIT-WEB` | playwright | ✅ MATCHED |
| `S1P7-57-5-HERO-ALL-MONTHS` | playwright | ✅ MATCHED |

**16 of 16 MATCHED** — every pinned file this lane owns is still refused by its registered proof, each plant applied, each
planted run red for its expected string, each control green. Batch `exit=0`, pin worktree `git status` empty afterwards,
:4319 free (`06-prove-guards-16-pinned.txt`). No server re-attempts and no harness faults were printed.

## Findings

*(appended as measured — selector measurements first, render measurements appended to each)*

### L3-1 · PlanHero still DRAWS the suggested move over an unread input — only its voice-over line was withheld
- **Consequence:** over any input that fires the hero's refusal, the hero withholds the verdict, the date and the split and
  prints *"An amount your plan is built from could not be read, so I can't tell you where the plan lands yet"* — and still
  draws **`Suggested · $1,300 · Extra payment to Visa`**, a figure spent out of the allocation `C1-5` calls corrupted. A
  VoiceOver user is told nothing about it; a sighted user sees it.
- **`file:line`:** `apps/rn/src/components/plan/PlanHero.tsx:219` renders `{suggestLabel && suggestTotal > 0 ? …}`;
  `:171` defines `showSuggest = !unreadPlanInputs && …` and uses it only in the a11y array at `:175`. The comment at
  `:169-170` says the move is *"withheld with the split, and so is its voice-over line"*.
- **Measurement (selectors):** `probe-01-at-pin.txt` §A — lost-APR store: `solved-projection:false`,
  `suggestLine:"Suggested · $1300 · Extra payment to Visa"`.
- **Measurement (render, the real app at the pin):** `02-render-probe-at-pin.txt`, `zz-l3-probe.spec.ts` P1 —
  - P1a lost APR: hero text `… Suggested · $1,300 · Extra payment to Visa  An amount your plan is built from could not be
    read …`; its `aria-label` is `This paycheck $2,000. An amount your plan is built from could not be read …` — **the
    suggestion is drawn and not spoken.**
  - ⛔ **P1b lost minimum on a SECOND debt (Car), Visa readable: `Suggested · $1,300`** — against the readable twin P1c's
    **`Suggested · $1,000`**. The suggested move is **inflated by exactly the lost $300 minimum**, printed directly above the
    sentence refusing to say where the plan lands. This is `C1-5`'s own defect (*"withholds the verdict and keeps the
    figures"*) on the one figure the fix did not reach.
  - The `.5.4d` hero e2e (`trust-claims.spec.ts:707`) asserts `Flexible` absent and says nothing about `Suggested`.
- **Reproduces at `c7df99c2`?** Split by origin — see *Attribution* below: the drawn, inflated suggestion **YES** (L3-1a);
  drawn-but-not-spoken **NO** (L3-1b).
- **Severity · origin:** **L3-1a** blocker (same shape and direction as `C1-5`, which the class filed as a blocker) ·
  reservoir. **L3-1b** minor · attributable.
- **Mechanism (HYPOTHESIS):** `.5.4d` added `showSuggest` and wired it to the a11y string, not to the JSX branch.
- **Remedy (UNVERIFIED):** gate the render at `:219` on `showSuggest`; add a `Suggested` absence assertion to the `.5.4d`
  hero e2e (it asserts `Flexible` absent, nothing about the suggestion).

### L3-2 · Progress withholds a FREE user's "$X to go" over an unread APR — a figure that reads no APR, which Money states
- **Consequence:** free user, one debt's APR unreadable, nothing paid yet: Progress's journey line says *"Some figures
  couldn't be read"* instead of *"$12,000 to go"*. The free figure is the raw anchor sum (`withProjectedBalances` returns the
  store unchanged when `!isPremium`), so the APR cannot move it — measured `totalCurrent` 12000 with the APR lost and 12000
  with it readable. Money's hero on the same store states `$12,000` on purpose (`money.tsx` `isPremium && !mayStateProjected`,
  pinned by `S1P7-57-3-FREE-C3-8-TWIN`): **one store, two answers**, and an over-suppression of a figure never at risk.
- **`file:line`:** `apps/rn/src/app/(tabs)/progress.tsx` `lineReadable = journey.lineIsProjected ? mayStateProjectedTotal :
  mayStateBalances` — no tier conjunct; `mayStateProjectedTotal = mayClaim(store, 'projected-balance')`.
- **Measurement (selectors):** `probe-01-at-pin.txt` §B — `free · apr unread → "Some figures couldn’t be read"`; `free · apr
  19 → "$12,000 to go"`; premium rows move (11,800 vs 12,176), so the premium refusal is right. Render: *pending (P2)*.
- **Reproduces at `c7df99c2`?** selectors: NO (`probe-01-at-c7df99c2.txt` §B — the line was gated on `'debt-balances'`,
  which an APR does not poison). Render at the base: **NO** — `03-render-probe-at-c7df99c2.txt` P2, free · unread APR: Progress
  `$12,000 to go`, Money `$12,000`.
- **Measurement (render at the pin):** `02-render-probe-at-pin.txt` P2, one store, tier alone changed —

  | tier · APR | Progress journey line | Progress date | Money hero |
  |---|---|---|---|
  | free · unread | ⛔ **`Some figures couldn’t be read`** | `—` | **`$12,000`** |
  | free · 19 | `$12,000 to go` | `January 2027` | `$12,000` |
  | premium · unread | `Some figures couldn’t be read` | `—` | `Some figures unread` |
  | premium · 19 | `$12,176 to go` | `January 2027` | `$12,176` |

  The free row is the whole finding: the same `$12,000` Money states is refused on Progress. The premium refusals are right
  (the projection moves: 11,800 vs 12,176). The free date refusal is right too (the solve reads the rate on every tier).
- **Severity:** minor · **origin:** attributable.
- **Mechanism (HYPOTHESIS):** `C3-9`'s fix copied `C3-8`'s claim onto Progress but not `C3-8`'s `isPremium` half — the half
  `.5.7 ③` found no fixture exercised on Money, and which nothing exercises on Progress.
- **Remedy (UNVERIFIED):** `lineReadable = lineIsProjected ? (!isPremium || mayStateProjectedTotal) : mayStateBalances`, with
  a free-tier e2e twin of `C3-9`.

### ~~L3-3~~ · WITHDRAWN — measured NOT reachable (kept for the record; see "Measured non-defects")
> ⛔ **Render measurement refutes it.** `SaveForItSheet.tsx` draws *Set your own* only when `options.some((o) =>
> o.prioritize)`, and at capacity 0 `selectSaveForItOptions` returns `debtFirst` alone. `02-render-probe-at-pin.txt` P3, on the
> capacity-0 shape: `waiting for getByText('Set your own', { exact: true })` — **element not found**. The `capacity > 0 ? … :
> customPace` fallback is unreachable from the UI. The selector reading below was right; the consequence was not.

#### (original selector-level entry, superseded)
### L3-3 · Save-for-it confirms a typed pace the plan funds NOTHING of — `B1-1`'s fix skips the capacity-0 branch
- **Consequence:** premium, a paycheck with no room (the sheet offers only *Keep debt first* and *Set your own*): typing
  `$300` shows no caption, dates the goal as if $300 lands each paycheck, and confirms *"Now saving $300/paycheck toward … —
  funds before debt"*. `selectPriorityGoalCapacity` measured **0** on both short shapes.
- **`file:line`:** `apps/rn/src/components/plan/SaveForItSheet.tsx` — `customFunded = customPace != null ? (capacity > 0 ?
  Math.min(customPace, capacity) : customPace) : null` and `customCapped = … && capacity > 0 && …`; `stated = customFunded ??
  customPace`.
- **Measurement (selectors):** `probe-01-at-pin.txt` §C — `capacity:0`, `typed300 → dated_from 300, caption false,
  "Now saving $300/paycheck"`. Engine funding of the stored goal and the render: *pending (P3)*.
- **Reproduces at `c7df99c2`?** the typed-pace statement: YES by selectors (the base had no capacity at all and stated the
  typed pace everywhere — that was `B1-1`). ⚠️ So by the brief's measurement rule this is **reservoir**, and it is also a
  **class-5 closure left open on one branch**: `.5.5`'s and `.5.7.4b.3`'s fixes chose `capacity > 0 ? … : customPace`
  explicitly.
- **Mechanism (HYPOTHESIS):** `capacity === 0` was treated as "no information" rather than "the plan funds nothing".
- **Remedy (UNVERIFIED):** at capacity 0, state the funded pace as 0 (no date; the caption says the plan cannot set anything
  aside now) — or refuse the custom commit.

### L3-4 · Today's plan hero withholds its SPLIT over a lost APR, which does not move it — and the gate cannot see it
- **Consequence:** a user whose only unreadable field is one debt's APR loses the hero's Required / Spoken for / Flexible
  split and its legend figures (and, by the comment's intent, the suggested move). None of those read an APR: measured
  identical with the APR lost and readable. The DATE does move, and withholding it is right.
- **`file:line`:** `apps/rn/src/app/(tabs)/index.tsx:348` `unreadPlanInputs={!mayClaim(store, 'solved-projection')}` feeds
  both the date and `PlanHero.tsx:141` `.filter((seg) => !unreadPlanInputs && seg.value > 0)`.
- **Measurement (selectors):** `probe-01-at-pin.txt` §A — `requiredTotal 500 · everydayHeld 0 · billsReserve 0 ·
  remainingAfterRequired 1500 · status on-track` on BOTH rows; only `solved-projection` differs. Render at the pin
  (`02-…` P1a): the hero draws no split over the lost APR; at `c7df99c2` (`03-…` P1a) the same store draws `Required $500 ·
  Flexible $1,500`.
- ⚡ **Measured by planting the gate's own granularity** (`08b-plant-hero-figure-split-only.txt`): remove `m.debtFreeDate` from
  the hero's figure in `trustSelectors.test.ts:861`, leaving exactly the split fields → the suite reds on its FIRST variant with
  **`⛔ .5.4a OVER-SUPPRESSION — solved-projection · Today's plan hero · debt[0].apr LOST: the claim refuses and no shape's
  figure moves`** — across all 22 shapes, not one fixture. Control: the unplanted suite exits 0 (`07-trust-test-clean-at-pin.txt`).
  Restore `cmp`-identical. ⚠️ One red exercises the sweep only up to that variant; other split over-suppressions (e.g. a lost
  `goal` field, which `'paycheck-plan'` also routes) are not measured by it.
- **Why the gate was blind (the assertion as written):** `trustSelectors.test.ts:858-862`
  serialises the hero as ONE JSON array `[billsReserve, debtFreeDate, everydayHeld, remainingAfterRequired, requiredTotal,
  shortfall, status]`. A lost APR moves `debtFreeDate`, so the whole string "moved" and the refusal is scored exact — the split's
  non-movement is unobservable by construction. The recommended actions (the suggested move) are not in the figure at all.
  `ACCEPTED_OVER` names only `plan.leanAmount` for this surface.
- **Reproduces at `c7df99c2`?** NO by selectors — at the base the hero asked `'required-plan'`, which does not route `apr`
  (`probe-01-at-c7df99c2.txt` §A shows the same split; the claim did not exist). Render: **NO** — the base draws the split
  on this store (`03-…` P1a).
- **Mechanism (HYPOTHESIS):** `.5.4d` gave the hero ONE claim for two figure families with different routes: the date
  (`'solved-projection'`) and the split (the allocation, i.e. `'paycheck-plan'`'s route minus nothing it renders), and the
  per-surface assertion was built at surface granularity, which is exactly the granularity the log's own `.5.4b` note warns
  about (*"a surface drawing only part of that family can be over-suppressed"*).
- **Remedy (UNVERIFIED):** gate the date on `'solved-projection'` and the split + suggestion on `'paycheck-plan'`; split the
  test's hero figure into two surfaces so each is measured on its own route.
- **Severity:** minor · **origin:** attributable.

### L3-5 · Progress's cash-flow bars ask NO trust question — `C3-11`'s twin, and `C1-1`'s "$200 line" on a surface its flag never reached
- **Consequence (a) · unread minimum:** the free *and* premium Progress screen plots every cycle's room **$160 higher** than
  the readable twin (`980/1300/980/980/980` vs `820/1140/820/820/820`) — the lost minimum drawn as spare — on the screen
  section that exists to show *"will I be squeezed soon?"*. The Cushion Forecast refuses the identical `selectCashTimeline`
  family on the identical store since `C3-11`; Progress does not ask.
- **Consequence (b) · unread cushion line (user set $350):** premium Progress captions the bars **`your $200 line · room after
  each paycheck`**. `cushionLine` returns `{ value: 200, unread: true }` and `progress.tsx` reads only `.value` through
  `effectivePaycheckBuffer`. That is `C1-1`'s own defect (*"a confident `$200 · Your line`"*) on the one reader the owner's
  `unread` flag never reached.
- **`file:line`:** `apps/rn/src/app/(tabs)/progress.tsx:189-191` (`cashCycles = selectCashTimeline(engineStore)` ·
  `cushionFloor = effectivePaycheckBuffer(engineStore)`) → `:454` `<CashFlowSection cycles={cashCycles} floor={cushionFloor} />`,
  mounted with no claim; `components/progress/CashFlowSection.tsx:122` prints the caption.
- **Measurement (selectors):** `probe-03-at-pin.txt` vs `probe-03-at-c7df99c2.txt`.
- **Measurement (render at `c7df99c2`, captions):** `14-render-probe-2-3-at-c7df99c2.txt` P4 — lost line (set $350) → **`your $0
  line · room after each paycheck`**; readable twin → `your $350 line`; the unread-minimum stores caption `$400` (premium) and
  `$50` (free), same as their twins. ⚠️ That run's section locator logged `""`, so the base BAR figures were not captured; the
  probe was corrected and re-run (`16-…` base, `17-…` pin).
- **Measurement (render at `c7df99c2`, bars — corrected probe):** `16-render-probe-2-at-c7df99c2-fixed.txt` P4, 6 passed —

  | store | bars | caption |
  |---|---|---|
  | premium · Visa minimum unread | **`$980 $1,300 $980 $980 $980`** | `your $400 line` |
  | premium · readable twin | `$820 $1,140 $820 $820 $820` | `your $400 line` |
  | free · Visa minimum unread | **`$980 $1,300 $980 $980 $980`** | `your $50 line` |
  | free · readable twin | `$820 $1,140 $820 $820 $820` | `your $50 line` |
  | premium · cushion line unread (set $350) | `$820 $1,140 $820 $820 $820` | **`your $0 line`** |
  | premium · readable twin ($350) | `$820 $1,140 $820 $820 $820` | `your $350 line` |

  (a) the lost $160 minimum is drawn as room on every cycle, on both tiers, at the base; (b) the base's lost line reads `$0`.
- **Measurement (render at the pin, unplanted):** `17-render-probe-2-3-at-pin.txt` P4, 8 passed — the four unread-minimum
  rows are **identical to the base** (`$980 $1,300 $980 $980 $980` against the twins' `$820 $1,140 $820 $820 $820`, both tiers,
  `Comfortable across the next few paychecks.` on all four); the lost-line store is captioned **`your $200 line · room after each
  paycheck`** where the user set `$350` (base: `$0`). The Cushion Forecast refuses the unread-minimum store on the same pin
  (`C3-11` e2e, green in the baseline run).
- **Reproduces at `c7df99c2`?** (a) **YES** — identical cycles at the base → **reservoir**; the class's own exit (*"one predicate
  … called by every surface, with an assertion that iterates the surfaces"*) is not met on this surface. (b) **YES as a false
  line, with a different figure**: the base captioned **`your $0 line`** (`store.cushionFloor ?? 200` passed the repaired 0
  through); the pin captions **`$200`**. By the brief's rule → **reservoir**; ⚠️ but the figure it now states was introduced
  by `.5.2`'s owner, so `C1-1` / `C1-6` are **open on this reader**.
- **Mechanism (HYPOTHESIS):** `.5.4b` fixed the runway at its screen rather than at `selectCashTimeline`'s callers, and `.5.2`
  moved the fallback into an owner whose `unread` half only the Guardian brief consumes — both "fixed in X and not its twin".
  The per-surface assertion in `trustSelectors.test.ts` lists the payoff family and the forecast, not Progress's cash-flow bars.
- **Remedy (UNVERIFIED):** gate `CashFlowSection` on `mayClaim(store, 'solved-projection')` with the forecast's honest state, and
  withhold the line figure when `cushionLine(store).unread`; add Progress's bars as a surface in the per-surface assertion.
- **Severity:** (a) major (the shape measured moves figures but flips no cycle's status; `C3-11`'s own store flipped three) ·
  (b) major · **origin:** reservoir, both — with `C3-11` / `C1-1` recorded as not closed on this surface.

## Closures planted through the e2e specs the range added — batch A

`09-batch-A.txt` · `plant_batch.py` + `batch-A.json`. One export carrying 9 app plants, each confined to one surface; 16 spec
invocations against it; `RELAXED` = the assertion that redded first is removed (a spec-file plant, no re-export) to see what
the rest of the test still refuses. Every plant's anchor matched once; every restore `cmp`-identical; server killed in
`finally`, :4319 free, pin worktree `git status` empty afterwards.

| run | closure · plant | first red | relaxed → next red | verdict |
|---|---|---|---|---|
| A1/A2 | `.5.4d` affordability back on `'required-plan'` | `afford-unread-inputs` toBeVisible — not found | verdict text toHaveCount(0) — the verdict rendered | ✅ closed, both assertions discriminate |
| A3/A4 | `.5.4d` windfall back on `'required-plan'` | `windfall-unread-inputs` toBeVisible — not found | `HERE'S HOW THE APP WILL ROUTE` toHaveCount(0) | ✅ closed, both |
| A5/A6 | `.5.7 ④b` runway back on the water-fill request | `toContainText('$900')` | `not.toContainText('$1,100')` | ✅ closed, both |
| A7 | same plant, reserve held | `toContainText('$500')` | — | ✅ |
| A8/A9 | `.5.7 ④b` confirmation states the typed pace | `toContainText(Now saving ${funded})` | `not.toContainText('999,999')` | ✅ closed, both |
| A10/A11 | `C3-8` Money's premium refusal branch removed | `toHaveText('Some figures unread')` | **green** — the two absences left guard other wrong states (`Some balances unread`, `Every balance cleared`) | ✅ closed by its first assertion alone; not a defect |
| A12/A13 | `C3-9` hero date back on `'debt-balances'` | **green** | green | ⚠️ **plant did not reach the asserted behaviour** — see below |
| A14 | `C3-13` `confirmedBalance` ignores the projection record | `You're debt-free` toHaveCount(0) (its own message) | — | ✅ closed |
| A15/A16 | `C3-14` count literal `1` | `saved — 2 targets …` toBeVisible — not found | `saved — one target …` toHaveCount(0) | ✅ closed, both |

### Batch B

`10-batch-B.txt` · `batch-B.json`: 5 app plants in one export, 9 invocations. All anchors once, all restores `cmp`-identical,
:4319 free and `git status` empty afterwards.

| run | closure · plant | first red | relaxed → next red | verdict |
|---|---|---|---|---|
| B1/B2 | `.5.4d` Guardian card back on `'required-plan'` | `guardian-unread-inputs` toBeVisible — not found | `Looks clear this paycheck` / `To debt` toHaveCount(0) | ✅ closed, both |
| B3/B4/B5 | `.5.4d` plan hero back on `'required-plan'` | `the honest state, by name` | → `a debt-free date solved from a rate…` → `the split is carved from the corrupted allocation (C1-5)` | ✅ closed, all three assertions discriminate |
| B6/B7 | `C3-11` forecast gate forced `true` | `cushion-forecast-unread` toBeVisible — not found | green in 1.0 s — alone, the absence runs before render | ✅ closed; the absence is ordered behind its positive wait, and **D3 proves it refuses** when both render |
| B8 | `.5.4a` Money's total back on the wide `'row-figures'` | `a goal the app could not read says nothing about what is owed…` | — | ✅ over-suppression direction closed |
| B9 | `.5.4a` Progress date back on `'row-figures'` | `a paycheck figure the plan never reads…` | — | ✅ over-suppression direction closed |

### Batch C

`11-batch-C.txt` · `batch-C.json`: 5 app plants in one export, 5 invocations. All anchors once, all restores `cmp`-identical,
:4319 free and `git status` empty afterwards.

| run | closure · plant | first red | relaxed → next | verdict |
|---|---|---|---|---|
| C1 | `C1-5` split filter removed from `PlanHero` | `the split is carved from the corrupted allocation (C1-5)` | — | ✅ closed for the split (not for the suggestion — **L3-1a**) |
| C2 | `C3-11` forecast on the wide `'row-figures'` | `a paycheck figure the plan never reads says nothing about the runway…` | — | ✅ over-suppression direction closed |
| C3 | `B1-1` ready-by dated from the typed pace | `toContainText(/([2-9]\|\d{2,}) paychecks · ready by/)` | — | ✅ closed |
| C4 | `C3-9` BOTH layers reverted (`view` gag + `heroDate`) | `a debt-free date computed from an APR…` toHaveText('—') | — | ✅ closed for the date |
| C5 | same, date assertion removed | **green** | — | the date is the test's only projection assertion; the rest of what the `view` gag withholds is unasserted here → batch D |

### Batch D

`12-batch-D.txt` · `batch-D.json`: 2 app plants in one export, 3 invocations (probe 3 copied into the worktree for the run
and removed after). Both anchors once, both restores `cmp`-identical, :4319 free and `git status` empty afterwards.

| run | plant | result | verdict |
|---|---|---|---|
| D1 | `C3-9`'s `view` gag ALONE back on `'debt-balances'` (`heroDate` layer intact) | `C3-9` spec **green** | the spec cannot see the gag — the date is still `—` through `heroDate` |
| D2 | same bundle, probe 3 on `C3-9`'s own store | unread APR: hero `—`, but **`PAYOFF TRAJECTORY … Minimum payments Jul 2029 · Your plan Nov 2026 · 2 years saved`**; readable twin: `Sep 2030 · Your plan Nov 2026 · ~$1,651, 3 years saved` | the gag is what withholds the whole payoff family; unplanted control and instrument check → **L3-6** (pending) |
| D3 | `C3-11` refusal branch draws the runway TOO | red: `a runway solved from a minimum the app could not read…` toHaveCount(0) | ✅ the absence assertion refuses when it runs after render — B7's green was the relaxation, not the spec |

⚠️ **A12 is not a failed-open guard, and diagnosing that came before touching anything.** `progress.tsx` withholds the date
TWICE: `heroDate = mayStateSolved ? view.debtFreeDate : '—'` and, upstream, `view = mayClaim(store, 'solved-projection') ?
rawView : gagBalanceDerived(rawView)`, whose gag sets `debtFreeDate: null`. Planting one layer leaves the other refusing, so
the date stays `—` and the spec correctly stays green. Batch C plants both layers; batch D plants the `view` gag alone, to
learn whether anything refuses the rest of the payoff family (trajectory, interest saved, what-if) that only that gag
withholds.

### L3-6 · `C3-9`'s payoff-family closure is OPEN by the brief's rule — reverting its claim reds nothing
- **Consequence if it regresses (measured, not hypothetical):** with `progress.tsx:158`'s `view` gag back on the pre-fix
  `'debt-balances'`, Progress over an unread APR draws **`PAYOFF TRAJECTORY … Minimum payments Jul 2029 · Your plan Nov 2026 ·
  2 years saved`** — a payoff date and a saving solved from a rate repaired to 0 (readable twin: `Sep 2030 · ~$1,651, 3 years
  saved`). This is `C3-9`'s defect on every figure except the hero date, which a second, independent `heroDate` gate still
  hides (`12-batch-D.txt` D2).
- **`file:line`:** `apps/rn/src/app/(tabs)/progress.tsx:158` `() => (mayClaim(store, 'solved-projection') ? rawView :
  gagBalanceDerived(rawView))` — the only thing withholding `view.snowball/avalanche/interestSaved/lean/band` (and `whatIf` at
  `:186` by the same shape).
- **Measurement — every refuser this audit could find, planted one at a time against that single-line revert:**

  | refuser | result | control that it can see the subject |
  |---|---|---|
  | `progress-hero-journey.spec.ts` `C3-9` | **green** (D1) | reds when BOTH layers are reverted (C4) — it asserts the date only |
  | `lint:trust-claims` | **green** (`13b`) | ⛔ **also green with the claim renamed to a non-existent `'solved-projectionX'`** (`13c`): it counts files per claim, so a site that swaps claims inside a file that asks the right claim elsewhere is invisible to it |
  | registry | no entry names `C3-9` | — |
  | `payoffViewGag.test.ts` | tests `gagBalanceDerived` itself, not the call | — |
  | `test:app` | **green — `ALL PASSED`** with the revert planted (`15b`); restore `cmp`-identical | clean baseline green (`15a`). ⚠️ No control plant is possible: no app-layer test imports or reads `(tabs)/progress.tsx` (repo search over every `*.test.ts` and `scripts/**`), so the suite structurally cannot see the call — recorded as a coverage fact, not as a "not caught" |
- **Reproduces at `c7df99c2`?** YES, rendered (`14-render-probe-2-3-at-c7df99c2.txt` P5): on `C3-9`'s own store with the APR
  unread, the base draws **`DEBT-FREE November 2026`** and **`PAYOFF TRAJECTORY … Minimum payments Jul 2029 · Your plan Nov 2026 ·
  2 years saved`** — byte-for-byte the trajectory D2 drew with only the `:158` gag reverted. So the single-line revert restores
  the base's defect on every figure but the hero date, and nothing refuses it. ⚠️ This entry is not a
  new defect in the running app. **Control, unplanted pin** (`17-render-probe-2-3-at-pin.txt` P5): over the unread APR the
  screen reads `PAYOFF TRAJECTORY Balance over time Now What if you paid extra?` — no date, no saving; the readable twin draws
  `Sep 2030 · Your plan Nov 2026 · ~$1,651, 3 years saved`. The fix is live and nothing refuses its revert. It is a class-5 closure the
  brief's question 1 classifies as OPEN: *"a closure you cannot make red by planting is OPEN, whatever the commit says."*
- **Mechanism (HYPOTHESIS):** `C3-9`'s e2e was written against the headline figure, and the date is gated twice, so the one
  assertion is satisfied by the gate that was NOT the fix's subject.
- **Remedy (UNVERIFIED):** assert a trajectory/interest phrase absent on `C3-9`'s store (behind the existing positive wait), and
  plant exactly the `:158` revert to prove it reds; for L4, a per-call claim check in `check-trust-claims.ts`.
- **Severity:** major (a guard gap on a blocker's closure) · **origin:** attributable — the closure and its evidence are class
  5's; the gap is in what the range pinned.

## Attribution — the same render probe at `c7df99c2`

`03-render-probe-at-c7df99c2.txt` — `zz-l3-probe.spec.ts` P1 + P2 unchanged, in `audit-c5r1-L3-base`, its own export,
7 passed. Side by side with `02-render-probe-at-pin.txt`:

| probe | `c7df99c2` | pin `ea3f5e0e` | reading |
|---|---|---|---|
| P1a hero · lost APR | split `Required $500 · Flexible $1,500`, **`debt-free by November 2026`**, Suggested $1,300, all spoken | date + split withheld, **Suggested $1,300 drawn, not spoken** | `C1-3`/`.5.4d` date fix visible ✅ · **L3-4** split withheld is NEW → attributable · **L3-1b** drawn-not-spoken is NEW → attributable |
| P1b hero · lost Car minimum | split `$500 / $1,500` + **Suggested $1,300** drawn and spoken over the refusal | split withheld ✅ (`C1-5`) · **Suggested $1,300** still drawn | **L3-1a** the inflated suggestion REPRODUCES → reservoir by rule; it is `C1-5`'s closure left open |
| P1c hero · control | Suggested $1,000 · Required $800 · Flexible $1,200 · March 2027 | identical | control ✅ |
| P2 free · unread APR | Progress **`$12,000 to go`** · Money `$12,000` | Progress **`Some figures couldn’t be read`** · Money `$12,000` | **L3-2** NEW → attributable |
| P2 premium · unread APR | Progress `$11,800 to go`, `January 2027` · Money `$11,800` | refused on both screens | `C3-8` + `C3-9` closures visible ✅ |

⚠️ **L3-1 therefore splits by origin.** **L3-1a** (blocker, reservoir): the suggested move stays drawn, inflated by a lost
obligation, beside the refusal — present before the class and not closed by `C1-5`'s fix, which the plan records as closed.
**L3-1b** (minor, attributable): `.5.4d` removed that same figure from the VoiceOver label only, so the drawn and spoken
heroes now disagree. One line fixes both (UNVERIFIED): `PlanHero.tsx:219` on `showSuggest`.

## ⛔ Process incident — the base teardown ran `git worktree remove` BEFORE the junctions were detached

Recorded because the protocol's rule 8 exists for exactly this, and a near-miss that is not written down is the next
auditor's live one.

- **What happened.** The teardown command chained `cmd //c "rmdir …" && … && echo` and then `; git worktree remove …`. The
  first `rmdir` failed on cmd.exe quoting (*"The filename, directory name, or volume label syntax is incorrect"*), the `&&`
  chain stopped, and the `;` let `git worktree remove` run with all three junctions still in place — the order rule 8 forbids.
- **What it did (measured, not assumed).** `git worktree remove` deleted the base's real files — including the base's OWN
  `packages/core`, which `apps/rn/core` junctioned to — and **did not descend into the three junctions**: all three were found
  intact afterwards, still pointing at `debt-app-v1\node_modules`, `debt-app-v1\apps\rn\node_modules` and the (now deleted)
  base `packages\core`.
- **The main checkout, verified three ways.** (1) `git status` in `debt-app-v1`: no tracked deletion; all 148 `packages/core`
  files present. (2) Every top-level package `package-lock.json` declares was checked for a `package.json` on disk: root 103
  absent, `apps/rn` 43 absent — **every one of the 146 is flagged `optional`/`peer` in its lock** (other-platform esbuild,
  Sentry CLI and resolver binaries, wasm runtimes), i.e. never installed on this Windows box; **0 non-optional packages
  absent.** Nothing was lost.
  (3) The pin worktree's render run, which reads the main `node_modules` through its junctions, started after the removal.
- **Remedy applied.** The leftover junctions were unlinked through PowerShell (`cmd /c rmdir` on each reparse point, verified
  gone) and the empty directories removed with non-recursive deletes, which fail rather than follow anything.
- **For the protocol (UNVERIFIED as a rule):** a teardown must not be one shell line. Each junction `rmdir` should be its own
  step with its result read, and `git worktree remove` gated on a listing that shows zero `<JUNCTION>` entries — the pass-5
  recipe gives the order, not the gate.

## Measured non-defects (with control)

- **L3-3 (withdrawn) — save-for-it at capacity 0.** The typed-pace fallback `capacity > 0 ? … : customPace` is unreachable:
  *Set your own* renders only beside a prioritised option, and capacity 0 yields none. Control: P3 on the capacity-0 shape
  → `getByText('Set your own')` not found (`02-render-probe-at-pin.txt`); the roomy shape offers it (baseline
  `saveforit-pace.spec.ts`, 7 tests green).
- **`lint:type-scale` does not cover the Progress hero date — by its threshold, not by a hole.** Plant: drop
  `maxFontSizeMultiplier` from `heroDateFit` → still green, 19 checked (`04-plant-type-scale-herodate.txt`). Control that
  the check SEES the element: same plant plus `heroDate` at 30 px → red, `progress.tsx:103 renders heroDate (≥30pt) with no
  maxFontSizeMultiplier` (`05-control-type-scale-sees-progress.txt`). `LARGE_PT = 30`; the date is 26 px and does carry
  `maxFontSizeMultiplier: 1.3` at the pin, so native AX text is capped. Both restores `cmp`-identical.
- **`HeroDate`'s web sizing does not feed back on itself.** `onLayout` reads the Text's width, and the Text sits in
  `ringMeta: { flex: 1 }`, so its width is the flex slot, not its content. Measured at the pin: 402 pt → slot 186 px, 26 px;
  320 pt → slot 104 px, 17 px (`01-baseline-green-11-specs.txt`), both the values the commit states.
- **The reserve offer asks the RAW store while Today's plan is solved on the PROJECTED one — reservoir, under-offer only.**
  `probe-02`: premium, a debt projected to $0 → the offer says `spare 110`; the engine on Today's projected store holds
  `210`. Identical at `c7df99c2`. The direction is an under-statement (a projection only drops a minimum), so no held-money
  promise breaks; the copy *"it's what's genuinely free after your expenses and your cushion"* understates by $100 on this
  shape. Not filed as a defect; noted for L1 (`selectExpenseReserveOffer`'s caller is `index.tsx:218`).
- **Progress's spoken figures follow the new gates (by reading, not planted).** `ringA11y` speaks the date only as
  `mayStateBalances && view.debtFreeDate`, and `view` is already `gagBalanceDerived(rawView)` whenever `'solved-projection'`
  refuses, so `debtFreeDate` is `null` there; the `TrajectoryChart` prop at `progress.tsx:473` reads the same gagged `view`.
  The leftover `mayStateBalances` conjunct is redundant, not wrong (a balance loss poisons `'solved-projection'` too).
- **`hero-date-fit` on native at the largest accessibility size — not filed, already a filed row.** Native is untouched by
  `.5.7 ⑤`: `maxFontSizeMultiplier 1.3` × 26 pt = 33.8 pt, `minimumFontScale 0.7` → ~23.7 pt, and *September* at ~4.8 em is
  ~113 pt in the 104 pt small-phone slot, so the shrink cannot fit it. Arithmetic, not a device measurement (`fontScale` is
  always 1 on web). This is the P6.14 row the spec's own header names (*"Read the Progress hero on a small device at a wide
  month"*).
- **Free-tier `'paycheck-plan'` refusals (affordability's free line, windfall routing) — INCONCLUSIVE, not filed.** The
  per-surface assertion measures every surface through `withProjectedBalances(s, true)`, i.e. premium only, so a free-only
  over-suppression would be invisible to it. `probe-04` (7 goal/plan variants × both tiers, identical at `c7df99c2`): on this
  comfortable shape **no figure moves on either tier**, premium included — so it cannot separate a free-specific
  over-suppression from the shape-dependent one the log already accepts (*"the proof boundary is the shape set"*). A
  discriminating shape (one where premium moves and free does not) was not constructed.
- **A void red, recorded so it is never read as evidence.** `08-plant-hero-figure-split-only.txt`: the first run of the L3-4
  measurement plant exited 1 on *"The filename, directory name, or volume label syntax is incorrect"* — cmd.exe rejecting the
  command's `cd apps\rn`, before any assertion ran. Restore `cmp`-identical. Re-run as `08b-…` with a command cmd.exe accepts.
- **Baseline: every changed spec green at the pin** — 11 specs, **101 passed**, 4.7 min, exit 0, :4319 free afterwards
  (`01-baseline-green-11-specs.txt`).
