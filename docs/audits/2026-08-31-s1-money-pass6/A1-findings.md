# A1 findings — the spec tree (apps/rn/tests)

Lane A1 of pass 6. Subject: every test that CLAIMS to guard the engine.

## A1-1 — `coachMarksSeen: true` is a boolean where the type is `string[]`; the suppression these specs claim is a no-op, and the code path it reaches throws

**Severity:** major (an instrument reports green while doing less than it claims)
**Origin:** `stale-read` (`intent-undo.spec.ts`, `topup-sources.spec.ts`); the same defect exists in `data-recovery.spec.ts` (outside this manifest — reported as a class, per the brief's "iterate the class").

**User-facing consequence (indirect):** three specs believe they have suppressed the feature-discovery coach-mark overlay and have not. If a mark ever fires on their path the app throws inside `coachMarks.show()` rather than rendering, so the spec's green means "the overlay crashed" and not "the overlay was already seen" — and a real store that ever holds a non-array `coachMarksSeen` (a hand-edited JSON restore reaches `runMigrations` with an arbitrary user file, `migrations.ts:10`) crashes Today the same way.

**File and line:**
- `apps/rn/tests/e2e/intent-undo.spec.ts:27` — `prefs: { onboardingComplete: true, guardianIntroSeen: true, coachMarksSeen: true }`
- `apps/rn/tests/e2e/topup-sources.spec.ts:29` — identical
- (class sibling, off-manifest) `apps/rn/tests/e2e/data-recovery.spec.ts:534` and `:574` — identical

**The measurement.** Fourteen other fixtures in the same tree write the array form, e.g. `apps/rn/tests/e2e/absorb-entry.spec.ts:32`, `saveforit-pace.spec.ts:41`, `spoken-state.spec.ts:37`, `strategy-compare.spec.ts:41` — all `['payoff-schedule', 'debt-row-actions', 'trajectory-scrub']`. `strategy-compare.spec.ts:28` states the intent in words: *"`coachMarksSeen`, and it is not a workaround — it is what four other specs in this suite do"*.

The declared type is `coachMarksSeen: string[]` (`apps/rn/src/data/models.ts:169`), default `[]` (`apps/rn/src/data/defaults.ts:63`).

`runMigrations` does not coerce it. The prefs merge is a plain spread — `apps/rn/src/data/migrations.ts:465`:
`prefs: { ...base.prefs, ...incomingPrefs, onboardingComplete: inferOnboarding(...) }`
The only array-shape guard anywhere in that return is on a different field (`Array.isArray(r.pendingDataRepairs)`, line 484). So the boolean `true` overwrites the `[]` default verbatim and reaches the store as `prefs.coachMarksSeen === true`.

Both consumers then call an Array method on it:
- `apps/rn/src/store/coachMarks.ts:118` — `if (prefs.coachMarksSeen.includes(id)) return probeCoachMark(...)`
- `apps/rn/src/store/coachMarks.ts:152` — `if (prefs.coachMarksSeen.includes(id)) return;`

`true.includes` is `undefined`; the call is a `TypeError`.

**Mechanism (hypothesis).** `scenario(over: Record<string, unknown>)` (`apps/rn/tests/e2e/helpers/seed.ts:34`) types its override bag as `unknown`, and `seedStore` serialises it with `JSON.stringify` — so no fixture field is type-checked against `DebtStore` at any point between the spec and the browser. A typo that changes the *shape* of a pref is therefore invisible to `tsc`, to the linters, and to the run, and it survives as long as the wrong shape is never dereferenced. The three specs that carry it are ones whose flows apparently never reach `show()`, which is why they are green rather than red.

**Remedy — NOT VERIFIED.** Two candidates, and the second is the one that generalises:
1. Change the four sites to the array form. (Narrow: fixes the members, leaves the class.)
2. Give `scenario()` a typed override parameter (`Partial<DebtStore>` rather than `Record<string, unknown>`), so a wrong-shaped pref fails at `tsc` in every fixture at once. ⚠️ Unverified and possibly costly — several fixtures deliberately seed *partial* nested objects (`paycheck: { amount: '2000' }`) and legacy/absent fields, which a `Partial<DebtStore>` will reject; the type would have to be a deep-partial. Do not apply without compiling the tree.
⚠️ **Do not "fix" this by making `runMigrations` coerce `coachMarksSeen` to an array without deciding what a boolean `true` should MEAN.** Coercing `true → []` silently converts these three fixtures to *"no marks seen"*, which is the opposite of the suppression their authors intended, and would turn a latent no-op into a live overlay in three specs at once.

## A1-2 — `guardianIntroSeen: true` is seeded by 30 test files and stripped by `runMigrations` before the app ever sees it

**Severity:** minor (a stale premise, carried in 30 files)
**Origin:** `stale-read` (most), `first-look` (`premium-entry.spec.ts`, `spoken-state.spec.ts`, `trajectory-interactivity.spec.ts`, `payday-reopen.spec.ts`, `celebration.spec.ts`, `hero-date-fit.spec.ts`, `ipad-layouts.spec.ts`)

**User-facing consequence:** none directly — the risk is the reader's. A fixture line that looks load-bearing and is inert teaches the next author that the flag does something, and the next spec that genuinely needs an intro suppressed will "suppress" it by copying a dead line.

**File and line.** 30 files under `apps/rn/tests/` write `guardianIntroSeen: true` into `prefs`, e.g. `premium-entry.spec.ts:24`, `trials`-adjacent fixtures, `cushion-forecast.spec.ts:19`, `sheet-remove.spec.ts:22`, `trajectory-interactivity.spec.ts:24`, `variable-income.spec.ts:38`, `windfall.spec.ts:23`, `enh-audit-screens.spec.ts:30`.

**The measurement.** `apps/rn/src/data/migrations.ts:453-454` destructures the field OUT of the incoming prefs before the merge:

```
const { isDemoMode: _isDemoMode, guardianIntroSeen: _guardianIntroSeen, ...incomingPrefs } = (r.prefs ?? {}) as Record<string, unknown>;
```

and `:465` merges only `incomingPrefs`. So every seeded `guardianIntroSeen` is discarded at hydration.

`grep -rn "guardianIntroSeen" apps/rn/src packages` over non-test source returns **six hits, all of them comments or the strip itself** — `models.ts:143,144,193,197`, `store/sandboxStore.ts:25`, `store/tutorialSelectors.ts:13`, plus `migrations.ts:453`. There is no read. `grep -rn "GuardianIntro|guardian-intro|GuardianOnboard" apps/rn/src` returns **zero** — the screen the flag suppressed does not exist. `models.ts:193` records this deliberately: *"v7 also DROPS `prefs.isDemoMode` and `prefs.guardianIntroSeen` (5.6). Both were measured inert — zero production reads."*

**Mechanism (hypothesis).** The field was dropped from the app in 5.6 and the fixtures were never swept, because nothing in the suite can go red over a pref that is discarded — the same shape as `analytics-optout.spec.ts`'s docblock describes for a control that governed nothing. The 30 sites are copy-propagation from a shared fixture idiom, not 30 independent decisions.

**Remedy — NOT VERIFIED.** Delete the key from all 30 fixtures. ⚠️ Unverified: this is a 30-file sweep on a suite that cannot be run under this pass's constraints, and the brief's own precedent (`sheet-remove.spec.ts:25-28`) is that a "generic, obviously safe" string sweep in this tree cost a full gate cycle. Sweep it with the suite, not without it.

## A1-3 — the paycheck-conservation invariant is asserted against four INDEPENDENTLY-ROUNDED display strings; the fixture picked the one arity where rounding is lossless

**Severity:** major (an instrument reports green while doing less than it claims)
**Origin:** `stale-read`

**User-facing consequence:** the instrument that exists to stop *"a partition that does not conserve"* cannot see a non-conservation of less than ~$2, because it compares whole-dollar rounded strings and not the partition. Separately, the same rounding means a real (cents-carrying) plan's hero **already** speaks four numbers to a screen-reader user that do not add up — the exact shape of the defect this file was written for, one decimal place down.

**File and line.** `apps/rn/tests/e2e/plan-hero-conserves.spec.ts:32-42` (the parser) and `:70-71` / `:103-104` (the sum).

```
const money = (re: RegExp) => { const m = label.match(re); return m ? Number(m[1].replace(/,/g, '')) : null; };
…
headline: money(/This paycheck \$([\d,]+)/),
required: money(/Required \$([\d,]+)/),
…
const sum = (p.required ?? 0) + (p.spokenFor ?? 0) + (p.flexible ?? 0);
expect(sum, …).toBe(p.headline);
```

**The measurement.** The label the spec parses is composed at `apps/rn/src/components/plan/PlanHero.tsx:138-141`:

```
`This paycheck ${formatWhole(paycheck)}.`,
segments.map((seg) => `${seg.label} ${formatWhole(seg.value)}`).join(', ') + '.',
```

`formatWhole` (`apps/rn/src/utils/format.ts:14-21`) is `Intl.NumberFormat(… maximumFractionDigits: 0)` — it **rounds each value independently**, and its own header says so: *"Whole-dollar currency (no cents)"*. The spec's capture group `([\d,]+)` also stops at the first `.`, so it could not read cents even if they were printed.

Rounding is not additive. One store, one variable: a $2,000 paycheck partitioned `Required 1000.40 · Spoken for 400.40 · Flexible 599.20` renders `$1,000 · $400 · $599`, and the spec computes `1999 !== 2000` — a **false red** on a correct partition. In the other direction, a genuinely broken partition summing to $1,999.60 renders `$1,000 · $400 · $600` = `2000` and **passes**.

Both fixtures avoid this entirely by carrying only whole dollars: `SHORT` is `1000 / 1400 / 300` (`:46-51`) and `HEALTHY` is `2000 / 950 / 400` (`:53-58`). Those are the one arity where display rounding is the identity, so the invariant is exercised only where it cannot be violated by the mechanism the instrument reads through.

**Mechanism (hypothesis).** The file chose the a11y label because its docblock argues it is *"the one place every segment and the headline appear together"* (`:22-24`). That is true of the STRINGS and false of the VALUES: the label is a lossy projection of the partition, and conservation is a property of the partition. The fixture was then written in whole dollars — plausibly because a cents fixture went red — which closed the loop and made the projection look faithful.

⚠️ Note that the NaN direction *is* guarded (`:89` pins `headline === 1000`, `:108` pins `required === 950`), and that guard was itself the subject of a prior correction recorded at `:74-88`. This finding is about rounding, which that correction did not reach.

**Remedy — NOT VERIFIED.** Assert conservation against the values, not the rendering — e.g. expose the three segment values plus the headline on the hero as a testable payload (a `data-*`/testID-scoped attribute) and compare those, keeping the existing string assertions as the "the label says something real" control. ⚠️ Unverified, and it adds a production affordance for a test, which this repo's own rules push back on. The cheap alternative — allow a ±$2 slack in the sum — is **worse**: it would make the instrument unable to see the class of defect it was written for at small portfolio sizes.

## A1-4 — the SHARED default fixture writes `dueDate: '2026-07-01'` on both the debt and the bill, so 43 of 63 specs have been silently driving the OVERDUE branch since July

**Severity:** major (an instrument reports green while doing less than it claims)
**Origin:** `stale-read` (`apps/rn/tests/e2e/helpers/seed.ts` and most consumers); several consumers are `first-look`

**User-facing consequence:** the plan status every default-seeded spec exercises is `'overdue'`, not `'on-track'`. So the surfaces these specs claim to guard in an ordinary state — Today's hero, the Required Actions buckets, the Guardian card's neighbours — are being read in the red-pill branch, and the **on-track** branch of the shared default is guarded by nobody. Any regression that only shows on a non-overdue plan is invisible to the suite.

**File and line.** `apps/rn/tests/e2e/helpers/seed.ts`:

- `:13` — `const DEBT = { … dueDate: '2026-07-01', … }`
- `:18` — `const BILL = { … dueDate: '2026-07-01', … }`

Both are the defaults returned by `scenario()` (`:41-42`).

**The measurement.** Today is **2026-08-31**; the literals are **61 days in the past** and get older every day.

The stored `dueDate` reaches the overdue predicate unchanged. `packages/core/engine/allocatePaycheck.ts:283-288` returns the expense verbatim for the first occurrence (`if (i === 0) return expense;`) — nothing rolls a past due date forward. It is not filtered out either: `isDueBeforeNextPaycheck` (`:206-213`) is `due < next`, and a July date is before any future payday, so the row is **included**.

Then `packages/core/debt/deriveRequiredActionView.ts:104-105`:
```
const overdue = !!dueDate && !isPaid && !presumedPaid && isOverdue(dueDate, currentDate);
```
with `isOverdue` (`:48-50`) a plain `new Date(dueDate) < new Date(currentDate)` → **true**.

And `currentDate` is genuinely today for these fixtures: `scenario()` sets only `paycheck: { amount: '2000' }`, and `apps/rn/src/data/migrations.ts:260` merges it onto the defaults — `const paycheck = { ...base.paycheck, ...(r.paycheck ?? {}) }` — so `currentDate` / `nextPaycheckDate` come from `createDefaultStore()` (`apps/rn/src/data/defaults.ts:21-25`), i.e. today and the next biweekly payday.

Downstream, one variable moves everything:
- `apps/rn/src/store/planSelectors.ts:400,444` — `const overdue = requiredRows.some(r => r.view.overdue)` → `status: overdue ? 'overdue' : shortfall > 0 ? 'short' : 'on-track'`
- `apps/rn/src/components/plan/PlanHero.tsx:130-135` — the hero's `statusLabel` becomes **`'Overdue payments need attention'`** rather than `'On track'`
- `apps/rn/src/store/planSelectors.ts:299-307` — the rows land in the `overdue` bucket, rendered in `accent.danger` with an `OVERDUE_LABEL` pill (`RequiredActionsCard.tsx:225,364`)

**Blast radius, counted rather than sampled:** `43 of 63` spec files in `apps/rn/tests/e2e/` fail to override at least one of `debts` / `requiredExpenses` and therefore inherit a July due date. In this lane's manifest that includes `route-smoke.spec.ts` (all ten routes), `guardian.spec.ts` (nine of its thirteen tests), `a11y-row-labels.spec.ts`, `analytics-optout.spec.ts`, `greeting.spec.ts`, `goal-row-saved.spec.ts`, `on-plan-streak.spec.ts`, `payoff-schedule.spec.ts`, `saveforit-pace.spec.ts`, `spoken-state.spec.ts`, `payday-reopen.spec.ts`, `absorb-entry.spec.ts` — and `trials.spec.ts`, which overrides the bills but keeps the overdue `DEBT`.

⚡ **The file warns about exactly this class, 60 lines below the two literals it warns about.** `seed.ts:58-69`: *"Fixtures must not write calendar literals. A hardcoded `nextPaycheckDate` becomes a payday in the PAST the moment the real clock passes it… nine other specs were queued to do the same thing on 2026-09-01."* The sweep that produced `day()` fixed `nextPaycheckDate` and did not touch `dueDate` in the same file.

**Mechanism (hypothesis).** The `day()` sweep was aimed at the symptom it had — a landed payday auto-opening the capture sheet and covering the tab bar, which fails loudly — rather than at the class *"a fixture date that ages"*. `dueDate` ages into a branch that fails **quietly**: nothing goes red, the specs keep passing, and the branch they exercise simply changes underneath them. This is the same shape as `route-smoke`'s own recorded scar (`:25-27`), where the fixture's empty bills list made ten green routes meaningless.

**Remedy — NOT VERIFIED.** Replace both literals with `day(n)` offsets — e.g. `dueDate: day(4)` for the bill and `day(6)` for the debt, matching what the specs that already override do. ⚠️ **Unverified and expected to red a number of specs**, which is the point: some of them may be asserting a figure or a bucket that is only true in the overdue branch, and each of those is a separate finding rather than something to paper over by keeping the literal. Do not apply without running the suite. ⚠️ Do not simply pick `day(0)` — a bill due *today* is not overdue but is a different third branch again.

## A1-5 — the `day()` sweep fixed `nextPaycheckDate` and never touched `dueDate`; **eight fixtures cross into the overdue branch on 2026-09-02**, the date the seed helper itself predicted

**Severity:** minor (a stale premise with a known expiry) — escalates to major on 2026-09-02, when it silently changes which branch eight spec files exercise
**Origin:** `stale-read` (`misfiled-expense.spec.ts`, `intent-undo.spec.ts`), `s0-first-look` (`shots/misfiled-hint.shot.ts`, `shots/money-sections.shot.ts`)

**User-facing consequence:** none to the user; the consequence is to the instruments. In two days, eight fixtures' bills and debts become overdue without a line of test code changing, and whatever branch they were written to exercise stops being the branch they exercise.

**File and line.** `dueDate: '2026-09-01'` literals, all in fixtures:
- `apps/rn/tests/e2e/misfiled-expense.spec.ts:17` (`MORTGAGE`), `:18` (`RENT`), `:201` (`Equipment Loan`)
- `apps/rn/tests/e2e/intent-undo.spec.ts:26` (`Chase Freedom`)
- `apps/rn/tests/shots/misfiled-hint.shot.ts:17`, `:18`
- `apps/rn/tests/shots/money-sections.shot.ts:13`
- (off-manifest, same class) `apps/rn/tests/e2e/backup.spec.ts:37,148,176`, `apps/rn/tests/e2e/data-recovery.spec.ts:310`, `apps/rn/tests/e2e/csv-import.spec.ts:53,72,84,98,123`

And with a later expiry: `apps/rn/tests/e2e/no-bills-branch.spec.ts:73` and `:96` — `dueDate: '2027-01-01'` on a bill whose whole purpose is *"A bill that exists but falls outside this cycle"* (`:71`). That premise inverts on **2027-01-02**, and both tests are specifically about the no-bills-vs-caught-up branch, so they will not merely change branch — they will assert the opposite of what they intend.

**The measurement.** Today is **2026-08-31**. The flip is exact and computable from `packages/core/debt/deriveRequiredActionView.ts:48-50`:
```
export function isOverdue(dueDate: string, currentDate: string): boolean {
    return new Date(`${dueDate}T00:00:00`) < new Date(`${currentDate}T00:00:00`);
}
```
On 2026-09-01 the comparison is `2026-09-01 < 2026-09-01` → `false`. On **2026-09-02** it is `true`. See A1-4 for the full chain from `overdue` to the plan status and the row bucket.

⚡ **The seed helper predicted this date by name and the sweep did not reach it.** `apps/rn/tests/e2e/helpers/seed.ts:64-66`: *"That happened on 2026-08-02, when `bnpl.spec`'s `2026-08-01` payday expired; **nine other specs were queued to do the same thing on 2026-09-01**."* The `day()` helper that came out of that sweep is used correctly for `nextPaycheckDate` and `currentDate` across the tree — and `dueDate` was left as a literal in these eight files, and in the shared default (A1-4).

⚠️ **The two `.shot.ts` files are the sharper half, because they have no assertions to red.** `money-sections.shot.ts` and `misfiled-hint.shot.ts` write committed reference frames to `apps/rn/capture-ref/`. On 2026-09-02 their bills become overdue, so the next regeneration renders them under `RequiredActionsCard`'s `accent.danger` treatment with an `OVERDUE_LABEL` pill (`apps/rn/src/components/plan/RequiredActionsCard.tsx:225,364`) — **a reference frame that differs from its predecessor for a reason that is not a change to the app.** That is the failure mode `apps/rn/tests/shots/explore-demo.shot.ts:13-16` documents by name for the clock: *"a regenerated frame differs from its predecessor for a reason that is not a change to the app. That is how the root `tests/visual` set's stale frames came to mask a real theme defect."* The clock was pinned; the due dates were not.

**Mechanism (hypothesis).** The 2026-08-02 failure was loud and specific — a landed payday auto-opens the capture sheet and its backdrop intercepts pointer events — so the sweep was scoped to the field that produced it. `dueDate` expiring produces no error at all, so it was not in the failure's shape and was not looked for. This is the enumeration-of-instances-instead-of-the-class pattern the brief names.

**Remedy — NOT VERIFIED.** Convert every fixture `dueDate` to `day(n)`, and add a lint/gate that refuses a four-digit-year literal inside `apps/rn/tests/**` fixtures (the class, not the instances). ⚠️ Unverified: some literals here are legitimately absolute — `csv-import.spec.ts` pastes CSV *input text* and `backup.spec.ts:206`'s `exportedAt` is envelope metadata — so a blanket rule needs an explicit, narrow exemption rather than a per-file one. ⚠️ And per A1-4, converting them is expected to red specs whose assertions have quietly come to depend on the overdue branch.

## A1-6 — `a11y-axe.spec.ts`'s `newUser()` helper merges `prefs` and then immediately discards the merge; the line is unreachable

**Severity:** minor (true but imprecise — an instrument helper that does nothing, currently masked by every caller)
**Origin:** `first-look`

**User-facing consequence:** none today, and that is the trap. The helper's contract is *"an onboarded user, plus your overrides"*. The next caller that passes a `prefs` override without re-stating `onboardingComplete: true` gets a store that is **not onboarded** — the route guard renders the onboarding flow, and an a11y scan that was written for Today silently scans a different screen and still returns `[]`.

**File and line.** `apps/rn/tests/e2e/a11y-axe.spec.ts:42-43`:

```
const newUser = (over: Record<string, unknown> = {}) =>
  scenario({ prefs: { onboardingComplete: true, ...(over.prefs as object) }, ...over });
```

**The measurement.** In an object literal the later key wins. `over` is spread **after** the `prefs` key, so whenever `over` contains a `prefs` property, `...over` re-assigns `prefs` to `over.prefs` wholesale and the merged object built one expression earlier is thrown away. `...(over.prefs as object)` therefore has **no reachable effect on any input**: when `over.prefs` is absent the spread contributes nothing, and when it is present the result is overwritten.

One variable, one store: `newUser({ prefs: { themeMode: 'dark' } })` evaluates to
`scenario({ prefs: { themeMode: 'dark' } })` — `onboardingComplete` is **gone**, and `scenario()` does not add it back (its own default is `prefs: { onboardingComplete: true }` at `helpers/seed.ts:43`, and that key is likewise overwritten by `...over`). The seeded store would then hydrate with `onboardingComplete: false` unless `inferOnboarding` promotes it.

⚠️ **Every one of the four current callers re-states the flag**, which is why the defect is invisible: `:132-138`, `:153`, `:170`, `:177` all pass `onboardingComplete` explicitly inside their own `prefs`. That is the arity where the bug cannot show — the shape the brief names as *"which member of its class did this fixture pick"*.

**Mechanism (hypothesis).** The helper was written to mirror `scenario()`'s own `...over` idiom and then had the `prefs` merge grafted on, without noticing that `scenario()` has the identical property: `helpers/seed.ts:34-45` also places `prefs` before `...over`, so **`scenario()` replaces `prefs` rather than merging it too**. Callers across the tree already work around this by re-stating `onboardingComplete: true` in every `prefs` override — 30+ sites do — which reads as ceremony rather than as the compensation it is.

**Remedy — NOT VERIFIED.** Spread `over` first and put the merged `prefs` last:
```
scenario({ ...over, prefs: { onboardingComplete: true, ...(over.prefs as object) } })
```
⚠️ Unverified, and it **changes behaviour** for `:153` (`prefs: { onboardingComplete: false }`), which currently gets `false` and would still get `false` under the fix — but the fix's real effect is on `scenario()` if the same correction is applied there, where it would begin merging `prefs` for 30+ call sites that have been relying on replacement. Treat the two files separately; do not sweep them together.

## A1-7 — `celebration.spec.ts`'s render barrier matches the TAB BAR, so the "no invitation is offered" control it guards is satisfied by a Today screen that rendered nothing

**Severity:** major (an instrument reports green while doing less than it claims)
**Origin:** `first-look`

**User-facing consequence:** the free-tier control — *"no invitation is offered, because the premium estimator is still premium"* — is the assertion that stops this spec passing by having quietly made a paid feature free. It is preceded by a barrier that app chrome satisfies, so a Today screen that renders `null` (the blank-route class `route-smoke.spec.ts` exists for) passes it. A regression that blanks Today for free users would leave this test green.

**File and line.** `apps/rn/tests/e2e/celebration.spec.ts:191-193`:

```
await page.goto('/');
await expect(page.getByText('Today', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
await expect(page.getByRole('button', { name: /Confirm.*paid off/i })).toHaveCount(0);
```
and the same barrier again at `:231`.

**The measurement.** `Today` is the **tab's own label**. `apps/rn/src/app/(tabs)/_layout.tsx:80-83`:
```
<Tabs.Screen name="index" options={{ title: 'Today', tabBarButtonTestID: 'tab-today', … }} />
```
`title` supplies both the tab label and the header, so the string is rendered by the tab navigator, not by the screen. `getByText('Today', { exact: false })` matches it, and `.first()` takes it. The tab bar is a sibling of the screen in the navigator tree, so it renders whether or not the screen's body does.

⚡ **The suite already knows this and says so one file over.** `apps/rn/tests/e2e/route-smoke.spec.ts:12` deliberately gives the `/` route **no** `text` assertion, with the reason inline: *"Today (custom screen — body-content check)"* — and falls back to `document.body.innerText.length > 40` instead (`:33-36`), precisely because no single string on that screen distinguishes chrome from content. `intent-undo.spec.ts:47` addresses the same node as a control: `page.getByRole('tab', { name: 'Today' })`.

The other `celebration` tests do not have this problem — they assert on `getByRole('button', { name: 'Keep going' })` and `'Continue'`, which are screen content. It is specifically the two control/absence pairs that lean on the chrome string.

**Mechanism (hypothesis).** The barrier was added to satisfy the repo's own (correct) rule — *"the positive assertion fires first"* — and the string chosen was the first thing that named the screen. The rule as written says "assert something positive first"; what it needs to say is "assert something the screen under test is the only possible source of", which is what `a11y-row-labels.spec.ts:24-26` and `analytics-optout.spec.ts:30-33` both do explicitly and this file does not.

**Remedy — NOT VERIFIED.** Replace both barriers with a node the Today screen owns — `page.getByTestId('plan-hero')` is already used as exactly this marker by `earlyjourney.spec.ts:99`, and `page.getByText('Required actions', { exact: true })` by `no-bills-branch.spec.ts:38` and `intent-undo.spec.ts:98`. ⚠️ Unverified against this fixture: `FREE([...])` seeds a $2,400 paycheck with the default bill, so a Today hero should render, but which of the two markers is present in that exact store has not been run. ⚠️ **This is a class, not two lines** — sweep for `getByText('Today'` / `getByText('Money'` / `getByText('Progress'` used as barriers before an absence assertion, since every one of those strings is a tab title.

## A1-8 — the a11y-tree instrument answers *"is the Guardian band announced?"* with a substring count over `clear` / `short`, so its one warning branch cannot fire

**Severity:** major (an instrument reports green while doing less than it claims)
**Origin:** `s0-first-look`

**User-facing consequence:** the file names this as *"A1's sharpest question"* — whether a blind user is told the app's central signal at all, or whether the band is conveyed by colour alone. The number the instrument prints in front of a reviewer, and the warning line it emits, are both derived from `String.includes` on six of the commonest words in the UI. A reviewer reading `Guardian-band words present: 14` has been told nothing about the band.

**File and line.** `apps/rn/tests/shots/p6.8-a11y.shot.ts`:

- `:68` — `const BAND_WORDS = ['clear', 'tight', 'at risk', 'at-risk', 'covered', 'short'];`
- `:85` — `const banded = lines.filter((l) => BAND_WORDS.some((w) => l.toLowerCase().includes(w))).length;`
- `:94-96` — the warning: `banded === 0 && (s.name === 'today' || s.name === 'progress')` → *"⚠️ ZERO band words on a surface whose whole job is the band — the state may be COLOUR-ONLY."*

**The measurement.** `includes` is an unanchored substring test on a lower-cased line, so `'clear'` matches `cleared`, `clearly`, `unclear`, `Clear search`; `'short'` matches `shortfall`, `short of`, `shortcut`.

Both gated surfaces demonstrably carry such strings independent of the Guardian:

- **`today`** — `apps/rn/src/components/plan/AffordabilityCard.tsx:159` renders `` `Not this paycheck — you’d come up about ${formatWhole(result.shortBy)} short.` ``. That line contains `short` and is the affordability verdict, not a band.
- **`progress`** — `apps/rn/src/components/payoff/TrajectoryChart.tsx:505` renders `` `${scrubClearedName} cleared` ``. Contains `clear`.
- (`money`, ungated but counted) — `apps/rn/src/app/(tabs)/money.tsx:1038` sets `accessibilityLabel="Clear search"`, and `:393-422` renders an `allCleared` branch.

So `banded === 0` requires that **not one line** in a several-hundred-line tree contain any of six common substrings. Delete every Guardian band word from the app and the count stays non-zero on both gated surfaces — the warning still does not print. **The branch is unreachable, which is this brief's "a check that cannot fail" class, inside an instrument written to detect exactly that shape elsewhere.**

⚠️ **A second, smaller defect in the same block.** `:84`'s unnamed-control count is
`/^\s*-\s*(button|link|checkbox|switch|textbox|slider)\s*$/` — anchored at end of line. `locator.ariaSnapshot()` emits a node **with children** as `- button:` (trailing colon) and a node with a name as `- button "Name"`. An unnamed control that has children therefore matches neither form and is **not counted**, so `unnamed` under-reports precisely the icon-only wrapping controls the docblock says it is looking for (*"a button whose accessible name is empty, or is 'button', or is an icon glyph"*).

**Mechanism (hypothesis).** The word list was written from the band's own vocabulary (`GUARDIAN_STATE_LABEL`'s values are `Clear` / `Tight` / `Very tight`, per `apps/rn/tests/e2e/spoken-state.spec.ts:28`) and then widened with plain-English near-synonyms (`covered`, `short`, `at risk`) to avoid false negatives — which converted a precise test into an imprecise one in the direction that makes the instrument agree with itself. The sibling spec `spoken-state.spec.ts` solves the same problem correctly, by scoping to labels matching `'of room'` first and *then* requiring one of exactly three glossary values (`:50-66`).

**Remedy — NOT VERIFIED.** Do what `spoken-state.spec.ts` does: scope to the Guardian card's own node before counting, and match the shipped `GUARDIAN_STATE_LABEL` values as whole words rather than substrings — and, per the same file's reasoning, import the glossary rather than re-typing it. ⚠️ Unverified: this file has no assertions by design (`:30`), so the change is to the printed evidence, and whether a *scoped* count is derivable from `ariaSnapshot` output alone has not been run. ⚠️ Do not merely add `\b` boundaries — `cleared` and `shortfall` both survive a word-boundary test on `clear`/`short` only if the boundary is applied to the whole word, and `covered`/`at risk` are not in the glossary at all.

## A1-9 — the What-If test's only assertion is satisfied by a legend row that is on screen BEFORE the What-If is opened

**Severity:** major (an instrument reports green while doing less than it claims)
**Origin:** `first-look`

**User-facing consequence:** *"TEST-4 (closeout): the What-If UI path (only the selector was locked before). Typing an extra payment opens the tool + surfaces the faster-payoff outcome in the legend."* That claim is guarded by nothing. Delete the entire What-If legend row, or make the extra-payment field a no-op, and this test stays green — so a premium user typing "$300 extra" and being shown no outcome at all is a regression the suite cannot see.

**File and line.** `apps/rn/tests/e2e/trajectory-interactivity.spec.ts:78-88`, whose single assertion is `:87`:

```
await page.getByText('What if you paid extra?').click();
await page.getByLabel('Extra monthly payment amount').fill('300');
await page.waitForTimeout(300);
// The outcome lands in the legend: faster payoff (months sooner/saved) or interest saved.
await expect(page.getByText(/sooner|saved|less interest/).first()).toBeVisible();
```

**The measurement.** The trajectory legend has **two** rows that emit these words, from the same helper, and the first one is unconditional on the What-If.

`apps/rn/src/components/payoff/TrajectoryChart.tsx:64-71`:
```
/** The savings suffix shared by both legend rows: " · $1,666, 22 months saved" / " · $309, 7 months sooner". */
function deltaSuffix(interestSaved: number, monthsSaved: number, word: string): string {
  if (interestSaved > 0 && monthsSaved > 0) return ` · ~${formatWhole(interestSaved)}, ${formatMonths(monthsSaved)} ${word}`;
  if (interestSaved > 0) return ` · ~${formatWhole(interestSaved)} less interest`;
  if (monthsSaved > 0) return ` · ${formatMonths(monthsSaved)} ${word}`;
  return '';
}
```

- **Row 1 — "Your plan", `:546-549`** — `interestSaved.kind === 'saving' ? deltaSuffix(interestSaved.interestSaved, interestSaved.monthsSaved, 'saved') : ''`. This is the **plan-vs-minimums** row. It renders at rest.
- **Row 2 — "With extra", `:570-578`** — gated on `showSimulated`, and only this one is the What-If's output.

Row 1 is emitted **earlier in the DOM**, so `.first()` resolves to it. The source states the independence explicitly at `:180-182`: *"The plan-vs-minimums 'saved' line below is **NEVER overridden** by it — the with-extra debt-free DATE lives in the What-If controls, not this slot."*

The fixture makes row 1 certain to render. `PLAN` (`:16-25`) is a $1,650 monthly paycheck, `requiredExpenses: []`, and three debts with minimums `160 + 75 + 320 = 555` against a `cushionFloor` of `200` — roughly $895/cycle of extra, so `interestSaved.kind` is `'saving'` and the suffix is non-empty. It is the same fixture the two tests directly above use, and they screenshot the resting chart with that row in it.

⚡ **One store, both branches:** with the What-If never opened, `getByText(/sooner|saved|less interest/)` already has a match; after opening it, it has two. The assertion cannot tell those states apart, and it makes no before/after comparison.

**Mechanism (hypothesis).** The regex was written as an "or" over the three shapes `deltaSuffix` can return — which is exactly right for the *string*, and wrong for the *element*, because the same helper feeds two rows. `.first()` then hid the ambiguity that strict mode would otherwise have raised: without it, two matches would be a strict-mode violation and the test would have failed loudly the day the feature worked, which is the brief's *"a plant cannot see the green state"* case in reverse.

**Remedy — NOT VERIFIED.** Scope to the "With extra" row rather than to the page — the row is identified by its own label `With extra` (`:574`), so `page.getByText('With extra').locator('..')`, or better a `testID` added to that legend row, then assert the suffix inside it. ⚠️ Unverified; the row has no testID today, and `TrajectoryChart` renders through Skia-adjacent layout so the ancestor walk is a guess. ⚠️ **Do not fix this by dropping `.first()`** — that turns a silent pass into a strict-mode failure in the *working* state, which is worse. And add the control the test is missing: assert the What-If row is **absent** before the field is filled, with the chart proven laid out first (the file already does exactly this pattern at `:38-39` for `traj-scrub-readout`).

## A1-10 — `guardian.spec.ts`'s "intro already seen" test manipulates a pref the migration deletes, over a string the app no longer renders anywhere

**Severity:** major (a guard survives its own un-fix — there is no un-fix it can survive)
**Origin:** `stale-read`

**User-facing consequence:** none — and that is the report. The test claims to guard a behaviour (*"intro already seen: not shown again"*) whose entire mechanism was removed, so a reviewer counting Guardian coverage counts a test that measures nothing. It is one of **three** tests in the file asserting the identical absence.

**File and line.** `apps/rn/tests/e2e/guardian.spec.ts:67-72`:

```
test('premium · intro already seen: not shown again', async ({ page }) => {
  await seedStore(page, scenario({ prefs: { onboardingComplete: true, guardianIntroSeen: true } }));
  await page.goto('/');
  await expect(page.getByText('PAYDAY GUARDIAN')).toBeVisible();
  await expect(page.getByText('Your floor is protected, starting today')).toHaveCount(0);
});
```

**The measurement — the discriminating variable is discarded, and the subject does not exist.**

1. **The variable.** `guardianIntroSeen` is destructured out of the incoming prefs by `runMigrations` before the merge — `apps/rn/src/data/migrations.ts:453-454`, and `:465` merges only the residue. So the app hydrates identically whether the fixture sets it `true`, `false`, or omits it. (See A1-2.)
2. **The subject.** `grep -rn "Your floor is protected, starting today" apps/rn/src` returns **zero** hits. The in-card intro was retired at 3.5.1.5, which this same file records **eleven lines above** at `:56-60`: *"3.5.1 retired that in-card intro because the tutorial absorbs it… This now guards the decision: the old copy must stay gone."*
3. **The duplication.** `:63`, `:71` and `:78` are the same assertion on the same string. `:56-65` (premium) already covers it and adds a positive (`tutorial-invite` visible); `:74-79` covers the free tier. `:67-72` adds neither a tier nor a state — only the inert flag.

So the test cannot go red for the reason it names. Its render barrier (`PAYDAY GUARDIAN` visible) is real, so it is not vacuous-by-blank-page — it is vacuous by subject.

**Mechanism (hypothesis).** When 3.5.1.5 retired the intro, the two tests that *asserted the retirement* were rewritten with new docblocks (`:56`, `:74`) and this one — which asserted the pre-retirement behaviour — was left as-is, because after the retirement it still passed. A test that keeps passing across the removal of its own subject is invisible to every gate; only reading finds it. The flag's later removal in 5.6 then took the second half of its meaning without anyone re-reading the specs that set it.

**Remedy — NOT VERIFIED.** Delete `:67-72`. ⚠️ Unverified only in the sense that deletion should be done as part of the `guardianIntroSeen` sweep in A1-2 rather than alone, so the reason lands in one commit. ⛔ **Do not "repair" it by re-pointing it at `prefs.tutorialSeen`** — `models.ts:197` records why `tutorialSeen` exists as a separate field, and the tutorial-seen behaviour already has its own coverage (`a11y-axe.spec.ts:170,177`, `phase35-themes.shot.ts:96`); a re-pointed test would be a fourth assertion of somebody else's claim.

## A1-11 — the Notifications "never fails in silence" test asserts that *a* dialog appeared, never what it said

**Severity:** minor (true but imprecise)
**Origin:** `stale-read`

**User-facing consequence:** the invariant the test names is *"every non-granted outcome is **spoken**"*. What it checks is that a `window.confirm`/`alert` fired. A change that replaced the explanation with an empty string, a raw error, or a message about something else entirely would keep this green, and the user would meet a dialog that does not explain why the switch snapped back — which is one step from the original silent failure.

**File and line.** `apps/rn/tests/e2e/enh-audit-screens.spec.ts:64-76`:

```
const messages: string[] = [];
page.on('dialog', (d) => { messages.push(d.message()); void d.dismiss(); });
…
await page.getByLabel('Notifications').click();
await page.waitForTimeout(500);
expect(messages.length, 'a failed enable says something (was: silent snap-back)').toBeGreaterThan(0);
```

**The measurement.** `messages` is collected and then only its **length** is read; `d.message()` is captured into the array and never asserted on. The handler is registered on the page for the whole test, so any dialog from any source satisfies it — and this fixture is a plain `scenario({})` on `/more`, a screen that also owns App Lock, backup/restore and delete-all-data, all of which use confirms (`apps/rn/src/components/ui/ListRow.tsx:153` and the four `confirmDelete` sites in `components/entities/`).

The docblock is precise about the boundary it can prove — *"Web reaches the `unsupported` branch, not `blocked`, so this pins the INVARIANT (every non-granted outcome is spoken) rather than the iOS copy"* — and the assertion is one level weaker than that boundary: it pins that an outcome is *dialogued*, not that it is *spoken*.

⚠️ **The message the web branch actually produces was read, and it is not what an obvious fix would guess at.** `apps/rn/src/app/more.tsx:106` is the `unsupported` fall-through: `notify('Not available here', 'Reminders are a feature of the iPhone app.')`. `notify` (`apps/rn/src/utils/confirm.ts:40-53`) has no `action` here, so on web it calls `window.alert(`${title}

${message}`)` — the dialog is `"Not available here

Reminders are a feature of the iPhone app."`, which contains **no** occurrence of the word "notification".

**Mechanism (hypothesis).** The copy differs between the `unsupported` (web) and `blocked` (iOS) branches, so pinning a string looked like pinning the platform. But the invariant has a platform-independent shape that is still checkable — the message is non-empty and states a reason — and the assertion stopped one step short of it.

**Remedy — NOT VERIFIED.** Assert on the content rather than the count, using the string the web branch really emits:
```
expect(messages[0]).toContain('Reminders are a feature of the iPhone app.');
```
⛔ **The obvious remedy is wrong and I nearly wrote it.** `expect(messages[0]).toMatch(/notification/i)` would go **red against a correct app**, because the web branch's copy never says the word. That is this brief's *"a remedy is a hypothesis"* rule landing inside this report.
⚠️ Pinning the web copy also pins only the `unsupported` branch — the `blocked` and `declined` branches (`more.tsx:94-105`) remain device-owed, exactly as the docblock says. ⚠️ Also consider scoping the dialog handler: `/more` mounts other `notify`/`confirm` sites, so any of them satisfies the current length check.


---

## Roll-up — lane A1

**Coverage: 61 of 61 files read** (`READ-A1.txt`), all git-tracked. 52 `e2e/*.spec.ts` + 1 `e2e/helpers/seed.ts` + 8 `shots/*.shot.ts`.

| severity | count | ids |
|---|---|---|
| blocker | 0 | — |
| major | 7 | A1-1, A1-3, A1-4, A1-7, A1-8, A1-9, A1-10 |
| minor | 4 | A1-2, A1-5, A1-6, A1-11 |

| origin | count | ids |
|---|---|---|
| `stale-read` | 7 | A1-1, A1-2, A1-3, A1-4, A1-5, A1-10, A1-11 |
| `first-look` | 3 | A1-6, A1-7, A1-9 |
| `s0-first-look` | 1 | A1-8 |

*(A1-2 and A1-5 each span both `stale-read` and a first-look bucket; counted once, at their primary.)*

### The classes, for `S1.13.7` (which fixes by class, not by member)

1. **Fixture dates that age into a different branch.** A1-4 (the shared default, already flipped) + A1-5 (eight files, flipping 2026-09-02; two more on 2027-01-02). One class, one sweep, one gate. **Expect reds** — some assertions have come to depend on the overdue branch.
2. **A fixture field the pipeline discards or mis-types.** A1-1 (`coachMarksSeen: true` where the type is `string[]`, 4 sites) + A1-2 (`guardianIntroSeen`, stripped by `runMigrations`, 30 sites) + A1-6 (`prefs` replaced rather than merged, in both `newUser()` and `scenario()` itself). Root cause is shared: `scenario(over: Record<string, unknown>)` type-erases every fixture, so nothing checks a fixture against `DebtStore`.
3. **An assertion pre-satisfied by something already on screen.** A1-9 (a legend row present before the interaction) + A1-7 (a render barrier satisfied by the tab bar) + A1-8 (a substring count over `clear`/`short`). Each is the "check that cannot fail" shape; each was found by asking *what else on this page matches this locator*.
4. **Reading a rendered/rounded projection instead of the value.** A1-3 (conservation asserted on four independently-rounded strings) + A1-11 (a dialog counted, not read).

⚠️ **Every remedy above is marked NOT VERIFIED, and one is marked as actively wrong** (A1-11's obvious `/notification/i` fix would red a correct app). No spec was run and nothing was fixed, per the pass-6 brief.
