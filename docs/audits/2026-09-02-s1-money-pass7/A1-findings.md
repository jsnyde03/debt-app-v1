# A1 — spec tree (pass 7, S1 money)

Auditor lane A1. Subject: `apps/rn/tests/e2e/**` + `apps/rn/tests/shots/**` — the tests that CLAIM to
guard the money engine. 68 files · 9.7k lines · manifest `ROUTING-A1.txt`.

Findings appended as measured. Split by origin at the end of the file.

---

## A1-1 — `major` · two specs decline to assert a modal's contents on a premise a third spec in the same directory measured STALE

**User-facing consequence.** The Windfall Autopilot's *routing itemization* — which bucket of the user's
money each dollar of a windfall is sent to — has **no assertion anywhere in the e2e tree**. A regression
that routed $1,000 entirely to the emergency fund instead of splitting it across EF + extra debt would
leave `windfall.spec.ts` green. The same hole covers the Save-for-it sheet's "4 options + sign-off".

**File and line.**
- `apps/rn/tests/e2e/affordability.spec.ts:33-35` — *"The multi-option sheet is a FormSheet Modal, which
  RN-web Playwright can't reliably query — its 4 options + sign-off are verified via both-theme
  screenshots + device/manual, per the Phase-4 web-e2e limits."*
- `apps/rn/tests/e2e/windfall.spec.ts:10-12` — *"The split rows live inside a FormSheet Modal (RN-web
  Playwright can't reliably query modal internals — see affordability.spec), so the routing itemization
  is verified via both-theme screenshots"*, and `windfall.spec.ts:42-51`, the two screenshot-only tests.

**Measurement (one store, one variable).** The premise is refuted three times over, inside this lane:

1. `apps/rn/tests/e2e/saveforit-pace.spec.ts:24-26` states it explicitly: *"`affordability.spec.ts` states
   this sheet 'can't be reliably queried' by RN-web Playwright. That was a Phase-4 claim and it is
   **stale**."* It then drives **that exact sheet**: `saveforit-pace.spec.ts:61-64` clicks
   `Save for it →`, clicks `Set your own`, and asserts `getByTestId('saveforit-custom-per')` visible.
2. `apps/rn/tests/e2e/topup-sources.spec.ts:45-52` queries the affordability card's in-modal buttons by
   role (`/from Trip & apply/`) and clicks them.
3. **`windfall.spec.ts` contradicts its own header 20 lines later**: `windfall.spec.ts:31-39` reads
   `Extra income` (the sheet title), fills `getByPlaceholder('e.g. 500')`, reads
   `/HERE'S HOW THE APP WILL ROUTE/` and clicks `Confirm` — all modal internals, all reliable.

So the two rows at `windfall.spec.ts:43-51` assert exactly one thing (`HERE'S HOW THE APP WILL ROUTE` is
visible) and then call `page.screenshot(...)`. **Nothing in the repo compares those PNGs to anything**, so
they exit 0 for every possible split of the user's windfall.

**Mechanism (HYPOTHESIS).** The Phase-4 limit was real when written (a different sheet implementation),
the sentence was copied forward into `windfall.spec.ts` by citation rather than by re-measurement, and
`saveforit-pace.spec.ts`'s correction was written into the *new* file instead of back into the two files
carrying the stale claim. `findings-cite-comments-as-evidence` — a quoted docstring is a carried premise,
not a measurement.

**Remedy — UNVERIFIED.** Delete the stale sentence from `affordability.spec.ts:33-35` and
`windfall.spec.ts:10-12`; replace `windfall.spec.ts`'s two screenshot rows with assertions on the split
rows' amounts. ⚠️ Not verified: I did not run Playwright (forbidden by the brief), so *"the split rows are
individually addressable"* is inferred from three sibling specs querying the same modal class, not
measured on the windfall sheet itself.

---

## A1-2 — `major` · `recovery.spec.ts`'s "the card relaxes" test asserts only an absence — the relaxed state is never named

**User-facing consequence.** The one test that proves *applying the Recovery Plan's deferrals actually
fixes the shortfall* would stay green if applying them **destroyed the card entirely**, navigated away, or
blanked Today. The user-facing claim the test's own name makes — "the card relaxes out of the shortfall" —
is never asserted.

**File and line.** `apps/rn/tests/e2e/recovery.spec.ts:77-83`.

**Measurement.** The complete test body after the seed is two statements:

```
await page.getByRole('button', { name: /Defer these 2/ }).click();
await expect(page.getByText("This paycheck won’t cover everything")).toHaveCount(0);
```

Zero positive assertions after the action. Compare the sibling that DOES apply the rule —
`apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts:104-109`:

> *"⛔ The honest calm state BY NAME, because the absence assertion below cannot falsify anything on its
> own … Measured at HEAD, this card reads "Your line's held" — that is the string a "force at-risk" plant
> destroys."*

followed by `await expect(card).toContainText(/Your line.s held/)` **before** its `not.toContainText`.

The same rule was applied elsewhere in this same directory, in this repair generation:
`no-bills-branch.spec.ts:38,52,80,103,147,165,180,223` ("Both-branches marker"),
`on-plan-streak.spec.ts:32,42`, `goal-pace-edit.spec.ts:122-124`, `strategy-compare.spec.ts:56-59`,
`celebration.spec.ts:195,238`, `guardian.spec.ts:107-110`.
**`recovery.spec.ts:82` is the member the sweep did not reach.**

**Mechanism (HYPOTHESIS).** The "positive-first / assert the honest state by name" repair was driven off
the list of files a prior finding named, not off a search of the tree for post-action absence-only
assertions — `iterate the class, never the member you found`. (The `.click()` does supply an implicit
render barrier *before* the action, so this is not the "passes before render" form; it is the
"suppressing a false statement can produce a different one" form.)

**Remedy — UNVERIFIED.** Add the relaxed card's own sentence by name before the absence line.
`guardian.spec.ts:18` pins `Looks clear this paycheck` for a healthy cycle and
`guardian-shortfall-topup.spec.ts:108` pins `Your line's held`; **which one this fixture lands on is not
measured here** and must be read off the running app before the assertion is written — writing the wrong
one is a remedy that introduces a red.

---

## A1-3 — `minor` · `plan-hero-conserves.spec.ts`'s docblock claims a property that is false of the test this round added

**User-facing consequence.** None directly. The risk is the next reader citing the docblock as proof that
the conservation suite pins figures, when its newest member does not — the exact loop pass-2's `B-3`
already closed once **on this same file**.

**File and line.** `apps/rn/tests/e2e/plan-hero-conserves.spec.ts:12-20` (the claim) vs `:85-98` (the
CENTS test, added this round by `S1.13.7.10` per its own header at `:54`).

**Measurement.** The docblock says:

> *"The specific measured figures are asserted too, so a hero that renders no segments at all cannot
> satisfy a sum of `0 === 0`."* … *"Both tests now assert a figure, so the sentence describes the file."*

Counted at HEAD — **three** tests, not two:

| test | line | asserts a specific figure? |
|---|---|---|
| CENTS | 85 | **no** — only `not.toBeNull()` ×2 and `sum === headline` |
| SHORTFALL | 100 | yes — `headline` `.toBe(1000)` at `:129` |
| HEALTHY | 136 | yes — `required` `.toBe(950)` at `:148` |

"Both tests now assert a figure" was true when written and is false at HEAD: the sentence was not updated
when the third test was appended by the same repair generation. `spokenFor` and `flexible` are also
un-guarded in all three (`?? 0` at `:93`, `:110`, `:143`), so the CENTS test's protection is again coming
from the `not.toBeNull()` guards rather than from what the comment names — verbatim pass-2 `B-3`,
recurring one round later in the same file.

**Mechanism (HYPOTHESIS).** The fix that added the CENTS arity appended a *new* paragraph (`:54-66`) and
left the *original* header paragraph's count untouched, because nothing re-reads a docblock's arithmetic
when a test is added below it.

**Remedy — UNVERIFIED.** Add a measured figure to the CENTS test. ⚠️ The figure is **not measured here**,
and the docblock at `:63-65` reports two *different* `Required` values for two different cent arities
(`$667` vs `$666`), so it must be read off the running app. Correcting the sentence alone leaves the
coverage gap the sentence describes.

---

## A1-4 — `major` · `lint:fixture-dates` prints `0 imminent fuses` while an imminent fuse and a fired one sit in `csv-import.spec.ts`, unseen

**User-facing consequence.** None directly today. The consequence is to the instrument the whole
fixture-date class now depends on: it reports the tree clean about a form of fixture it cannot see, and a
hand sweep that trusted its output missed five sites.

**File and line.**
- The blind gate: `scripts/check-fixture-dates.ts:96` — `const LITERAL = /'(\d{4})-(\d{2})-(\d{2})'/g`
  (single quotes required) — and `:95` `AGING_KEY = /([A-Za-z_]*(?:Date|At|AsOf))\s*:\s*$/` (an object key
  required immediately before the literal).
- The unseen fixtures: `apps/rn/tests/e2e/csv-import.spec.ts:53, 72, 84, 98, 123`.

**Measurement (printed values).**

```
$ npx tsx scripts/check-fixture-dates.ts        # exit 0
✅ fixture-dates: 220 test-shaped file(s) scanned · 0 imminent fuses ·
   121 aged literal(s) on aging fields (cap 121, downward-only) ·
   128 in clock-pinned files (deterministic) · 115 on non-aging fields.
```

What it did not see, in one file of my lane (today = 2026-09-02):

| line | CSV fixture (inside a backtick template) | state |
|---|---|---|
| 53 | `Visa,2400,75,19.99,2026-09-01` + `Car loan,8000,220,4.5,2026-09-05` | **fired 1 day ago** + **imminent (3d)** |
| 72 | `Visa,"1,200",75,19.99,2026-09-01` | fired 1 day ago |
| 84 | `Visa,2400,75,not-a-rate,2026-09-01` + `Car loan,8000,220,4.5,2026-09-05` | fired + imminent |
| 98 | `Visa,2400,75,19.99,2026-09-01` + `,900,40,0,2026-09-05` | fired + imminent |
| 123 | `Visa,2400,75,19.99,2026-09-01` | fired 1 day ago |

These are `dueDate` values: `csv-import.spec.ts:36` declares
`const HEADER = 'name,balance,minimumPayment,apr,dueDate'`, so the fifth column is the due date the import
writes into the user's store. The gate misses them twice over — they sit inside a **backtick template
literal** (no single quotes), and the column is **positional**, so no `dueDate:` key precedes them.

`2026-09-05` is 3 days out. The gate's own docblock (`:22-26`) calls that class *"IMMINENT — always fatal,
never capped … `A1-5` was found two days before its date, by a human-run audit, and there is no reason to
depend on that again."* It is depending on one right now.

**The sweep this blinded, measured.** `grep -rn "fixture-date-ok"` over the tree returns **10 exempted
sites**, five of which carry the identical comment:

> *"passenger — PLANTED 2020-01-01 across all 11 sites, `test:app` stayed green, so no assertion here reads
> this date against the clock"*

— a deliberate 11-site enumeration of `2026-09-01`, driven off this gate's output.
**`csv-import.spec.ts`'s five `2026-09-01` sites are not among the 11 and carry no exemption.**
*Audit site lists undercount* — the list was short because the instrument feeding it was.

⚡ And `apps/rn/tests/e2e/helpers/seed.ts:99-100` names this exact date as the next expiry:
*"nine other specs were queued to do the same thing on 2026-09-01."* It arrived yesterday, in this file,
and nothing said so.

**Mechanism (HYPOTHESIS).** The gate encodes the *shape* of the defect that produced it — an object-literal
fixture in `seed.ts` — rather than the property it means to catch ("a calendar date that will be compared
to the clock"). A CSV/template-literal fixture is the same hazard in different syntax, no plant was ever
run in that syntax, so the blindness never surfaced. ⚠️ **I did not plant against the gate** — that means
editing a tracked file, which the brief forbids. The claim rests on (a) reading the two regexes, (b) the
gate's own printed `0 imminent fuses`, and (c) five dates enumerated independently with a separate scanner
that drops the single-quote requirement.

**Secondary, lower value, same instrument.** The `aged` count of **121** — which is also the cap, so the
gate is exactly saturated — includes `apps/rn/tests/e2e/helpers/seed.ts:18`, which is **prose inside a
docblock** quoting the retired value (*"These were `dueDate: '2026-07-01'` on both the debt and the
bill"*), not a fixture at all. The downward-only cap is inflated by at least one by the gate's own
explanatory comment about the defect it fixed.

**Remedy — UNVERIFIED.** Widen `LITERAL` to accept `"`, `'` and bare-in-template forms, and let the aging
test fall back to file-level context when no adjacent key exists (a CSV `HEADER` naming a `…Date` column).
⚠️ **This will raise the measured `aged` count far above the downward-only cap of 121** — my independent
scan found **631** past ISO dates outside the single-quoted form repo-wide (the large majority in the
legacy `tests/` root, and many of them prose in comments, which would need excluding). The cap must be
re-derived in the same change or the widening turns the gate red on contact. That re-derivation is
**not done here**, and it is the half of this remedy most likely not to survive contact.

---

## A1-5 — `blocker` · `C4-9`'s guard was put on the ring and not on the sentence the ring SPEAKS — and the spec that exists for it never reads that label

**User-facing consequence.** On a portfolio the app has explicitly determined it **cannot read**, a
screen-reader user is still told where they stand: *"no milestones reached yet, next milestone 25%"* — two
progress claims derived from a percentage the app manufactured as `0` precisely because it could not
compute one. A sighted user on the identical screen is shown `—` for the ring, `—` for the debt-free date,
*"Some balances couldn't be read"* for the journey line, and **no milestone caption at all**. The two
audiences are told different things about the same money, and only the spoken one makes a claim.

**File and line.**
- The producer: `apps/rn/src/app/(tabs)/progress.tsx:315-321` (`reached` / `nextT` / `ringA11y`), against
  `:290` `const pct = mayStateBalances ? journey.pct : 0;`
- The spec that exists for exactly this defect and does not reach it:
  `apps/rn/tests/e2e/progress-hero-journey.spec.ts:186-222` (`C4-9 · one unread balance beside a live one
  suppresses every figure derived from it`).

**Measurement (one store, one variable).** With `mayStateBalances === false` (`:288`,
`mayClaim(store, 'debt-balances')`), `pct` is forced to `0` at `:290`. `groupLabel`
(`apps/rn/src/utils/a11y.ts:20-27`) joins its non-empty parts with `, `, so the ring group's
`accessibilityLabel` evaluates to:

```
percentage paid unavailable — some balances could not be read, no milestones reached yet, next milestone 25%
```

**Only clauses 1 and 4 are gated on `mayStateBalances`** (`:317`, `:320`). Clauses 2 and 3 (`:318`, `:319`)
are unconditional and read `pct` / `nextT`, both of which come from the forced `0`. Compare the visible
layer four lines down, which IS gated: `:308`
`const nextMilestoneLabel = mayStateBalances && nextT && nextT < 100 ? ... : null` — so the caption is
suppressed on screen and spoken anyway.

The file states the governing rule against itself at `:354-355`, on the very next element:
> *"⛔ [C4-9] An indeterminate ring, not a 0% one: "0% paid" is as false as "78% paid"."*

That reasoning was applied to the ring's centre glyph and **not** to the ring's own utterance.

**Coverage, measured across the whole tree, not sampled.**
`grep -rn "next milestone\|milestones reached\|percentage paid unavailable" apps/rn/tests apps/rn/src`
returns **zero hits in `apps/rn/tests`**. Nothing anywhere asserts on this label.
`progress-hero-journey.spec.ts:200-221` asserts five things for `C4-9` — the journey line, the hero date,
the absence of a `%`, the absence of `Next milestone`, the absence of `Go to Today` — all of them **text
nodes**, none of them the `aria-label` on the element the finding is about. `spoken-state.spec.ts` is the
one spec in the tree written for *"what a screen reader is TOLD"* and its scope is the cash-flow columns
(`cash-flow-section`), not the hero ring.

⚡ **This class has already fired once inside this same label.** `apps/rn/src/store/journeySelectors.ts:64`:
> *"gold "Free" milestone and had VoiceOver announce "all milestones reached" over money still owed."*

The fix reached `journeySelectors`; the two ungated clauses beside it in `progress.tsx` are the members it
did not reach. *Iterate the class, never the member you found.*

**Mechanism (HYPOTHESIS).** `C4-9`'s remedy was expressed as *"suppress every figure derived from the
repaired balance"* and was executed against the things a person can SEE on the screen. The a11y label is
built 40 lines above the JSX from the same variables, so it was outside the visual sweep, and the spec
written to prove the sweep asserted only on rendered text — so the un-swept producer is invisible to both
the fix and its guard.

**⚠️ What I measured and what I did not.** Measured: the ternary at `:290`, the two ungated clauses,
`groupLabel`'s join, and the zero grep hits in the test tree. **Not measured:** I did not run the app or
Playwright (the brief forbids it), so I have not observed the rendered `aria-label`. And note the honest
weak spot — for the exact fixture at `progress-hero-journey.spec.ts:192-194` (one unread card, one card
$4,000 of $6,000) the spoken sentence is *coincidentally true*, because clamping to `0` happens to land in
the same bucket the real figure would. **That coincidence is why the existing spec could never have caught
this even if it had read the label**, and it is the reason the fixture needs a member whose live debts are
past 25% paid.

**Remedy — UNVERIFIED.** Gate `:318` and `:319` on `mayStateBalances` the way `:317`, `:320` and `:308`
already are — the honest utterance is the first clause alone. ⚠️ Unverified in both directions: I have not
checked what `groupLabel` produces when only one part survives (`a11y.ts:22-25` drops empties and joins, so
a single-part label should be well-formed, but that is read, not run), and the guarding spec needs a
fixture whose readable debts are **past 25% paid** or it will pass over the un-fixed code exactly as the
current one does.

---

## A1-6 — `minor` · `route-smoke.spec.ts` claims "every route" and walks a hand-typed list of 10 against an app with 13

**User-facing consequence.** A route added tomorrow joins no smoke test and nothing goes red to say so.
The one route in the app that no spec reaches by any door — `+not-found`, what a user meets on a bad deep
link — is unguarded against the blank-route class this file exists for.

**File and line.** `apps/rn/tests/e2e/route-smoke.spec.ts:11-23` (the `ROUTES` array).

**Measurement.** `find apps/rn/src/app -name '*.tsx'` minus the two `_layout.tsx` files gives **13**
routes:

```
(tabs)/index  (tabs)/money  (tabs)/progress  +not-found  cushion-forecast  demo
history  living-expenses  more  onboarding  paywall  schedule/[id]  tutorial
```

`ROUTES` names **10**. Absent: `demo`, `tutorial`, `+not-found`.

⚠️ **And the honest half that weakens my own hypothesis.** Counting `page.goto` targets across the whole
lane: `/tutorial` is navigated to **28** times and `/demo` **13** times (6 bare + 5 `?mode=scripted` + 2
`?capture=1`), by `tutorial-invite.spec.ts` and `demo-containment.spec.ts`, which assert real content on
them — so a blanked `/demo` or `/tutorial` would almost certainly red there. **`+not-found` is navigated
to zero times by anything** (`/schedule/does-not-exist` at `payoff-schedule.spec.ts:179` reaches a *valid*
route with a bad param, not the not-found screen). So the reachable defect is one route, and the rest of
the finding is structural.

**Mechanism (HYPOTHESIS).** The list is an enumeration with no completeness check, and this repo has its
own written verdict on exactly that shape one directory over —
`scripts/check-runner-completeness.ts:18-27`:
> *"`D5-9` is what a count does here … **A count with slack cannot see a member that never joins.** So this
> asserts SET INCLUSION — every tracked test file appears in its runner."*

That instrument asserts set inclusion for **test files in runners**. Nothing asserts it for **routes in
`route-smoke`**, which is the same set-difference question one directory away. `check-runner-completeness`
would not notice: `route-smoke.spec.ts` is itself in a runner; it is its *contents* that are short.

**Remedy — UNVERIFIED.** Derive `ROUTES` from the filesystem (glob `apps/rn/src/app/**/*.tsx`, drop
`_layout`, map `(tabs)/index` → `/` and `[id]` → a seeded id) rather than typing it, so a new route file
joins the smoke test by existing. ⚠️ Unverified: `+not-found` and `/onboarding` need different seeds from
the rest (`onboarding` already carries `onboarded: false`), and `/demo`'s query-string variants suggest it
may need one too — a naive glob would add rows that fail for reasons unrelated to blankness.

---

## A1-7 — `major` · the VIS-4 ack coordinator has ONE test, no control, and cannot tell suppression from absence

**User-facing consequence.** VIS-4's claim is that Today shows **at most one** acknowledgement card so the
screen never stacks five or six. The only test of that claim would stay green if the lower-priority ack
had been **deleted from the product**, or if this fixture simply never produced it. Nothing else in the
tree covers the coordinator.

**File and line.** `apps/rn/tests/e2e/ack-coordinator.spec.ts` — the whole file, 25 lines, one test,
assertions at `:23-24`.

**Measurement.** The complete assertion set:

```
await expect(page.getByText(/Halfway to debt-free/i)).toBeVisible();   // the ranked-first ack
await expect(page.getByText(/trial has ended/i)).toHaveCount(0);       // "the lower-priority ack is suppressed"
```

The second line is the claim. To mean *"suppressed"* rather than *"absent"*, this store must be shown to
produce the trial ack when the milestone is not competing — and no such row exists, in this file or any
other. `trials.spec.ts:39-51` does prove the trial ack renders, but **on a different store**
(`fullChargeDate: '2020-01-01'`, `dueDate: '2026-07-10'`, no `pendingMilestone`), so it establishes
nothing about this fixture.

The file's own comment already states the missing step — *"the trial ack is suppressed **until the
milestone is dismissed**"* — and the test never dismisses the milestone, which is the one action that
would turn the absence assertion into a discriminating one.

⚠️ **Second, independent hole in the same 25 lines:** the file has **no `test.use({ viewport })`**, so it
runs at Playwright's Desktop Chrome default (1280×720). `bnpl.spec.ts:35-38` records what that means here:
*"this spec runs at the default desktop viewport, which is the regular (iPad) layout — a left rail."*
Every other ack-bearing spec in the lane pins `{ width: 402, height: 874 }`. So VIS-4 — a claim about a
crowded **phone** screen — is proven only in the iPad rail layout.

**Mechanism (HYPOTHESIS).** The file was written as a closeout smoke test for one ranked pair and never
picked up the control idiom the rest of the suite converged on — `guardian-shortfall-topup.spec.ts:73-84`
(*"Without this the test above cannot distinguish 'the fix works' from 'this store was never the defect's
shape'"*), `intent-undo.spec.ts:53` (`B2 control`), `no-bills-branch.spec.ts:161` (the FREE control),
`trajectory-interactivity.spec.ts:95-97` (*"THE CONTROL, before anything is typed"*). Being a
single-test file with no sibling rows, it had no neighbour to inherit the pattern from.

**⚠️ What I did not measure.** I did **not** verify that this fixture would in fact render the trial ack
with the milestone removed — that needs a run, which the brief forbids. Its `fullChargeDate: '2026-07-01'`
and `dueDate: '2026-08-01'` are both past, so I *expect* it converts and the suppression is real. That
expectation is exactly the thing the test is supposed to establish and does not.

**Remedy — UNVERIFIED.** Add the control the file's own comment names: dismiss the milestone in the same
test and assert `/trial has ended/i` becomes **visible** — one store, one variable, both directions. Add
`test.use({ viewport: { width: 402, height: 874 } })`. ⚠️ Unverified: I have not checked whether the
milestone ack in this store carries a dismiss control reachable by role, nor whether dismissing it
persists in a way that lets the trial ack take its slot in the same render.

---

## A1-8 — `minor` · ten assertion-free screenshot rows sit inside the release gate, and the config written to keep them out states they are not there

**User-facing consequence.** None to a user. The consequence is to anyone who reads the e2e suite's size
as evidence — which this repo does, in writing — and to every `validate:release:rn` run, which spends ten
page loads plus ten 900 ms settles producing PNGs nobody reads that run.

**File and line.** `apps/rn/tests/e2e/enh-audit-screens.spec.ts:41-51`.

**Measurement.** The complete body of the parametrised test at `:43-49`:

```
await seedStore(page, s.name === 'paywall' ? { ...rich(theme), subscriptionPlan: 'free' } : rich(theme));
await page.goto(s.path);
await page.waitForTimeout(900);            // let Skia/motion settle
await page.screenshot({ path: `test-results/enh-${s.name}-${theme}.png`, fullPage: true });
```

No `expect` of any form. The loops at `:41-42` are `2 themes × 5 SURFACES` (`/`, `/progress`, `/money`,
`/more`, `/paywall`), so this is **10 tests** in `apps/rn/tests/e2e`, which
`apps/rn/playwright.config.ts:19` picks up via `testDir: './tests/e2e'` and no `testMatch`. The file says
so itself at `:9`: *"Not a pass/fail spec — it just captures."*

**The instrument that exists for exactly this, and did not sweep it.**
`apps/rn/playwright.shots.config.ts:6-13`:

> *"3.5.8.7 — the evidence config. Same app, same server as `playwright.config.ts`; different job.
> **Separate because `tests/e2e` is the release gate and everything in it is an assertion that can fail.**
> The demo beat-shooter asserts nothing … and putting it in the gate would spend ~50s of every
> `validate:release:rn` on screenshots nobody is reading that run."*

That sentence is false about the tree it describes. The `tests/shots` root was created and one file was
moved into it; the ten rows that motivated the rule stayed where they were.

⚡ **And the count IS used as evidence.** `apps/rn/tests/e2e/amount-guards.spec.ts:132-135` argues a
finding from suite size: *"delete the four lines that bound the rate … and run the whole suite — **325 of
325 e2e tests** and all three unit suites green with the bound gone."* Ten of those 325 are rows that
cannot go red about anything.

⚠️ **Distinguish this from the screenshots that ride along with real assertions.** Eight files call
`page.screenshot`; in seven of them the shot sits beside assertions in the same test
(`celebration`, `paywall`, `premium-entry`, `proofofwork`, `earlyjourney`, `affordability`, `windfall`).
`enh-audit-screens.spec.ts` is the one whose capture rows carry **no** assertion. (`windfall.spec.ts`'s two
capture rows carry one weak assertion each and are the subject of `A1-1`, not this finding.)

**Mechanism (HYPOTHESIS).** `tests/shots` was introduced for the demo beat-shooter, the one file in front
of whoever wrote the rule; the rule was then written as a general property of `tests/e2e` without
enumerating the members already violating it. Same shape as `A1-4` and `A1-2` — the fix reaches the
instance that prompted it. Nothing gates it either: `check-runner-completeness.ts` asserts every test file
is in *a* runner, and `enh-audit-screens.spec.ts` is — the wrong one.

**Remedy — UNVERIFIED.** Move the capture loop to `apps/rn/tests/shots/enh-audit-screens.shot.ts` (the
shots config's `testMatch: '**/*.shot.ts'` picks it up) and leave the Notifications test at `:64-90`,
which is a real assertion, in `tests/e2e`. ⚠️ Unverified: the two configs share port 4319 with
`reuseExistingServer` locally, and I have not checked whether splitting one file across two roots changes
what `lint:runner-completeness` or `surface-coverage.ts --surface=s1` expect — `surface-coverage.ts:196`
records that `apps/rn/tests/shots` is a routing root *"because S1 routes it here"*, so moving a file
between the two roots may move it between audit lanes.

---

## A1-9 — `major` · the "coming soon" guard fires two absence assertions before the screen has rendered — eighty lines below the comment that forbids exactly that

**User-facing consequence.** The row this test defends is the one the app shipped for months —
*"Automatic cloud backup — coming soon."* — a promise-shaped row on the screen whose whole job is to be
believed. If it came back, this test would very likely stay green.

**File and line.** `apps/rn/tests/e2e/backup.spec.ts:237-244`.

**Measurement.** The test opens with no barrier at all:

```
await seedStore(page, scenario());
await page.goto('/more');

// ⛔ The retired string, asserted gone. …
await expect(page.getByText('coming soon', { exact: false })).toHaveCount(0);
await expect(page.getByText('Soon', { exact: true })).toHaveCount(0);

await page.getByText('iCloud backup', { exact: true }).click();      // ← the first thing that waits
```

`expect(locator).toHaveCount(0)` resolves the instant the count IS `0`, which on a not-yet-painted SPA is
`t=0`. `page.goto` resolves on `load`, which for this Expo web export fires when the bundle has loaded —
**before React has rendered the More screen**. The `.click()` at `:246` is the first statement that waits
for content, and by then both absence assertions have already passed.

**The rule, in the same file, 83 lines above** (`backup.spec.ts:154-156`):

> *"⚠️ The POSITIVE assertion runs first, deliberately. `toHaveCount(0)` is true of a sheet that never
> opened — **two specs in this repo stayed green with a defect planted for exactly that reason** — so the
> summary being on screen is what makes the next line mean "hidden" rather than "not rendered yet"."*

Every other absence-bearing test in this file obeys it: `:218-222` asserts `backup-import-input` visible
before the file-control absence; `:196-212` asserts the error's text before the summary absence;
`:60-85` asserts `backup-import-error` visible before `backup-found-summary` absence. `:237` is the one
member the sweep did not reach — and it is the only one whose absence assertions run **before any wait at
all**, rather than merely in the wrong order.

The same rule is written out again in `data-recovery.spec.ts:196-200`, `no-bills-branch.spec.ts:37`,
`analytics-optout.spec.ts:30-32`, `goal-pace-edit.spec.ts:122-123`, `on-plan-streak.spec.ts:27-31`,
`coach-mark-neighbour.spec.ts:41-43`, `strategy-compare.spec.ts:56-58` and
`progress-hero-journey.spec.ts:154-155` — nine independent statements of one rule, and one file with a
member outside it.

**Mechanism (HYPOTHESIS).** This test's *subject* is an absence (a retired string), so unlike its siblings
it has no natural positive to assert first — its author reached for the click at `:246` as the "real"
barrier without noticing that two assertions run before it. A file-order read makes it look guarded,
because the guarded sibling is above it.

**⚠️ What I did not measure.** This is a **race**, not a certainty: I did not run the suite, so I cannot
say the assertions always win it. What I can say is which direction the race runs — a loaded box (the
brief says twelve lanes share one) makes the app slower to paint and the vacuous pass *more* likely, so
this fails safe for the suite and unsafe for the user.

**Remedy — UNVERIFIED.** Assert a sibling row first, the way `analytics-optout.spec.ts:33` does for the
same screen (`await expect(page.getByLabel('App Lock')).toBeVisible({ timeout: 15_000 })`) — or move the
`iCloud backup` click above the two absence lines, since `getByText('iCloud backup').click()` is itself a
positive proof the More list is populated. ⚠️ Unverified: I have not checked that `App Lock` and the
iCloud row render in the same section on this viewport, nor that reordering leaves the sheet-open
assertions at `:250-253` reachable.

---

## A1-10 — `major` · the class behind A1-9, enumerated: FOUR assertions in three files fire between `page.goto` and the first render

**User-facing consequence.** Four checks in the release gate can pass on a blank page. Two of them are the
only guard for their claim: the axe scan of **Today** — the app's main screen, and the scan the whole
a11y-tree file exists for — and the "the App-Preview capture strips the dock" assertion, which is what
stands behind an Apple subscription-disclosure claim.

**Members (file and line), all confirmed by reading:**

| # | site | the vacuous assertion | first statement that actually waits |
|---|---|---|---|
| 1 | `apps/rn/tests/e2e/a11y-axe.spec.ts:105-106` | `expect(await violations(page)).toEqual([])` | — none in the test |
| 2 | `apps/rn/tests/e2e/backup.spec.ts:242-244` | `toHaveCount(0)` ×2 (`coming soon`, `Soon`) | the `.click()` at `:246` |
| 3 | `apps/rn/tests/e2e/demo-containment.spec.ts:350-355` | `toHaveCount(0)` ×2 (`Start your real plan`, `demo-caption`) | `toBeVisible` at `:360` |
| 4 | `apps/rn/tests/e2e/swipe-mark-paid.spec.ts:101-107` | `toHaveCount(0)` (`Mark paid`) | `toHaveAttribute` at `:108` |

`A1-9` writes up member 2 in full; this is the class it belongs to, so it is fixed once, not four times.

**Measurement.** I scanned every `.spec.ts` in `tests/e2e` and every `.shot.ts` in `tests/shots` for a
`page.goto(` followed, within 18 lines and before any statement that waits on content, by an assertion
that is true of an empty page (`toHaveCount(0)`, `not.to*`, `toEqual([])`, an axe scan). Nine candidates
came back; **I then read all nine and refuted five**, which is the half worth recording:

- `a11y-axe.spec.ts:219` — `toHaveCount(1)` at `:218` is a polling barrier. My matcher list missed it.
- `plan-hero-conserves.spec.ts:90, 107, 141` — the barrier is inside the helper: `heroParts()` opens with
  `await expect(hero).toBeVisible({ timeout: 10_000 })` (`:29-30`).
- `swipe-mark-paid.spec.ts:135` — the barrier is inside `swipeLeft()`, which opens with
  `await expect(row).toBeVisible()` (`:45`).

So the scanner's raw output over-reported by 5 of 9. The four above are read, not matched.

**Why `toEqual([])` on an axe scan belongs in this list.** `violations()` (`a11y-axe.spec.ts:55-76`) calls
`new AxeBuilder({ page }).exclude('[inert]').withRules(RULES).analyze()`, which injects axe and evaluates
against the DOM **as it stands**; it does not wait for content. An empty body has no ARIA violations, so
the scan returns `[]` and the assertion passes. Every *other* case in that file has a barrier and the file
says why at `:173-174`: *"The sheet must actually be open, or this scans a screen with no backdrop on it
and **passes for the wrong reason**."* Today's case — the first test in the file — is the one without one.

**The rule these four sit outside of**, stated independently in nine places across the same directory:
`backup.spec.ts:154-156`, `data-recovery.spec.ts:196-200`, `no-bills-branch.spec.ts:37`,
`analytics-optout.spec.ts:30-32`, `goal-pace-edit.spec.ts:122-123`, `on-plan-streak.spec.ts:27-31`,
`coach-mark-neighbour.spec.ts:41-43`, `strategy-compare.spec.ts:56-58`,
`progress-hero-journey.spec.ts:154-155`. Nine restatements of one rule, four members outside it, and
nothing mechanical checking any of it.

**Mechanism (HYPOTHESIS).** The rule has only ever been applied where a finding pointed — each of the nine
comments cites the specific defect that produced it — so members that no finding named were never swept.
It is unenforceable by reading, because in three of the four cases a waiting statement appears a line or
two *below* the vacuous one and the test looks guarded at a glance.

**Remedy — UNVERIFIED.** Two parts, and the second is the one that stops a pass 8 finding this again:
(a) give each of the four a positive barrier (member 1 needs one badly — an axe scan with no barrier is
the file's own named failure mode); (b) make it a gate rather than a tenth comment — a lint that refuses
a vacuous-shaped assertion appearing after `page.goto` with no intervening wait. ⚠️ Unverified in both
parts: I have not written or run such a lint, and my own prototype of its detection logic **over-reported
by 5 of 9**, so a gate built naively on this shape would red on correct tests and get exempted into
uselessness. The refutation list above is the calibration data it would need; treating my nine as the
population would repeat the exact mistake.

---

## A1-11 — `major` · the demo's "no bills invented" assertion reads a store key that has never existed, so it cannot fail

**User-facing consequence.** The demo sandbox writing a bill into the user's real plan — the exact sin the
sandbox exists to retire, and the class the file's header says *"the legacy `demoSeed` got past [the route
guard] by writing `onboardingComplete: true` to the REAL store"* — would leave this test green. The bills
half of the containment claim is unguarded.

**File and line.** `apps/rn/tests/e2e/demo-containment.spec.ts:283`.

**Measurement.**

```
const store = JSON.parse(persisted ?? '{}');           // :280
expect(store.prefs.onboardingComplete).toBe(false);    // :281   ← real key
expect(store.debts ?? []).toHaveLength(0);             // :282   ← real key
expect(store.expenses ?? []).toHaveLength(0);          // :283   ← NO SUCH KEY
```

`DebtStore` (`apps/rn/src/data/models.ts:338-343`) declares `paycheck`, `debts`, **`requiredExpenses`**,
**`livingExpenses`**, `goals`. There is no `expenses`. So `store.expenses` is `undefined`,
`undefined ?? []` is `[]`, and `expect([]).toHaveLength(0)` is true of every possible store — including
one carrying a demo-planted bill in `requiredExpenses`.

**The population, measured across the repo, not sampled:**
`grep -rn "\.expenses\b" apps/rn/tests apps/rn/src --include=*.ts --include=*.tsx` filtered of
`requiredExpenses`/`livingExpenses` returns **exactly one hit — this line.** It is a lone typo, not a
convention, which is why nothing else in the tree agrees with it and nothing red.

The comment two lines above names this as the load-bearing half (`:277-278`):
> *"'your own plan is untouched — no debts, bills or paycheck invented by the demo' is the half of this row
> that matters most, and it is the sin the sandbox exists to retire."*

Of the three things that sentence promises — debts, **bills**, paycheck — `debts` is asserted, **bills is
asserted against a key that does not exist**, and `paycheck` is not asserted at all.

**Why `typecheck:tests` cannot see it.** `apps/rn/tsconfig.tests.json` does include this file, and the rn
config is `"strict": true` — but `JSON.parse` returns `any`, so `store.expenses` typechecks. Counted in
this lane: **24 of 33 `JSON.parse(` store reads carry no type at all** (the other 9 use an inline
`as { … }` cast, which is what makes those sites checkable). `helpers/seed.ts:47-60` records the mirror
image of this on the *write* side — *"no fixture field was checked against `DebtStore` at any point
between the spec and the browser"* — and typed only `prefs`. **The read side was never typed, and this is
the first measured defect on it.**

**Mechanism (HYPOTHESIS).** `expenses` is the natural short name and the store's is `requiredExpenses`;
with `any` on both sides of the read, nothing — tsc, eslint, the runner — distinguishes a real key from an
invented one, and `?? []` converts the mistake from a crash into a pass. Same shape as `S1.13.7.10`'s
`guardianIntroSeen` (40 fixture sites writing a pref with no reader), one direction over.

**Remedy — UNVERIFIED.** Change `:283` to `store.requiredExpenses`, and add the `livingExpenses` and
`paycheck.amount` halves the comment promises. ⚠️ Unverified in a way that matters: **I have not checked
that the corrected assertion passes.** If the demo sandbox does leak a bill today, fixing the key turns
this test red — which would be the finding rather than the fix, and is the more interesting outcome.
Do not apply this without running it. The wider fix — typing the 24 untyped `JSON.parse` reads against
`DebtStore` — is the class remedy; `seed.ts:56-60` records that typing the *write* side surfaced **91
errors**, so the read side should be expected to cost similarly and is not a sweep to do at speed.

---

## A1-12 — `major` · pass-6's `A1-6` fix reached one of the three helpers with the defect; two still overwrite the `prefs` merge they claim to make

**User-facing consequence.** None yet — the defect is masked. The consequence is the one the a11y-axe
docblock already spelled out: the next caller to pass a `prefs` override without re-stating
`onboardingComplete: true` gets a **not-onboarded** store, the route guard renders `/onboarding` instead of
the screen under test, and every absence assertion and every axe scan in that test passes over the wrong
screen with nothing red.

**File and line.**
- `apps/rn/tests/e2e/tutorial-invite.spec.ts:57-58` — un-fixed
- `apps/rn/tests/e2e/date-field.spec.ts:22-23` — un-fixed
- `apps/rn/tests/e2e/a11y-axe.spec.ts:52-53` — **fixed**, and carries the docblock explaining why

**Measurement.** The three helpers, side by side:

```ts
// a11y-axe.spec.ts:52-53  — FIXED (S1.13.7.10, pass-6 `A1-6`)
scenario({ ...over, prefs: { onboardingComplete: true, ...(over.prefs as object) } });

// tutorial-invite.spec.ts:57-58  — the ORIGINAL, un-fixed shape
scenario({ prefs: { onboardingComplete: true }, ...over });

// date-field.spec.ts:22-23  — the same
scenario({ prefs: { onboardingComplete: true }, ...over });
```

`{ prefs: {…}, ...over }` places `over` **after** the `prefs` key, so a caller's `prefs` replaces the
merged object wholesale rather than extending it. The fix inverts the order and spreads `over.prefs`
*inside* `prefs`. `a11y-axe.spec.ts:43-51` states the mechanism verbatim:

> *"`{ prefs: {...merged}, ...over }` puts `over.prefs` **after** the merge, so the merged object was built
> and then overwritten wholesale. … the next caller passing a `prefs` override without re-stating
> `onboardingComplete: true` would get a store that is **not onboarded** — the route guard renders
> onboarding, and an a11y scan written for Today would silently scan a different screen and still return
> `[]`. ⚠️ Currently masked by every caller restating it, which is why nothing was red."*

**Masked at HEAD, measured caller by caller.** `grep -n "newUser(" tutorial-invite.spec.ts` returns **31
call sites**; of the 20 that pass a `prefs` override, **all 20 restate `onboardingComplete: true`**
(`:220, 257, 264, 290, 358, 408, 446, 460, 496, 538, 571, 639, 684, 690, 706, 713, 741, 770, 837, 855`).
`date-field.spec.ts` has **3** call sites and the only one passing an override (`:71`) passes no `prefs`
at all. So nothing is red today, and nothing would be — which is the whole point of the finding.

**Mechanism (HYPOTHESIS).** `A1-6` was reported against `a11y-axe.spec.ts` because that is the file whose
symptom (a scan over the wrong screen) made it visible, and the remedy was applied to the file the finding
named rather than to the shape. A grep for the shape finds all three in one command — the search that was
not run. *Iterate the class, never the member you found*, landing on a fix from this same repair
generation.

⚠️ **`typecheck:tests` cannot see it either.** Both helpers take `over: Record<string, unknown>`, and
`scenario`'s signature (`helpers/seed.ts:66-68`) types only `prefs`, so a `prefs` that replaces rather
than extends is a perfectly well-typed object.

**Remedy — UNVERIFIED.** Apply `a11y-axe.spec.ts:53`'s exact form to both. ⚠️ Unverified: because every
caller currently restates the flag, **the change is a no-op at HEAD and no test will red or green
differently** — which means running the suite proves nothing about whether the fix is correct. The only
check available is the third helper, already fixed and already passing, and a deliberate plant (a caller
passing `prefs: { themeMode: 'dark' }` alone) that I did not write, since the brief forbids editing
tracked files.

---

### Amendment to A1-10 (not a separate finding — a fifth member, found after that section was written)

**`apps/rn/tests/e2e/tutorial-invite.spec.ts:786-787`.**

```
await page.goto('/');
// …
expect(await trapped()).toBe(0);                       // ← :787, no barrier
```

`trapped()` (`:777-786`) is a bare `page.evaluate` counting `[aria-hidden="true"]` subtrees that contain a
focusable node. It does not wait. On a page that has not painted there are zero `aria-hidden` regions, so
the count is `0` and the assertion passes.

⚠️ **My own scanner missed this one**, because its vacuous-shape list was
`toHaveCount(0)|not.to|violations(page)|toEqual([])` and did not include `.toBe(0)`. That is a second
calibration point for the remedy in A1-10: the shape to detect is *"an assertion whose expected value is
the empty/zero state"*, which is broader than the four forms I matched. Reported here rather than folded
silently into the table above, because the under-count is the more useful fact.

⚡ **And the file installs the missing guard for the SECOND call and not the first.** At `:795`, after the
walkthrough is opened, it adds:

> ```
> expect(await page.locator('[inert]').count()).toBeGreaterThan(0);
> ```
> *"The count above is only meaningful if the fence is actually there. Without this, deleting the fence
> entirely would also produce zero violations … This gate has shipped that shape four times."*

That guard covers the walkthrough call at `:791` (which is preceded by a `.click()` and a `toBeVisible`, so
it also has a render barrier). The ordinary-app call at `:787` has neither a render barrier nor a
fence-present guard — the one the file's own comment says the gate has shipped four times without.

**Remedy — UNVERIFIED, and it is the same one:** a positive barrier before `:787` (the file uses
`page.getByText('PAYDAY GUARDIAN')` for this elsewhere, e.g. `:641`), plus a fence-present guard for that
state if one exists on the un-coached app. ⚠️ I do not know that an un-coached Today has any `[inert]`
region at all, so the second half of that remedy may be inapplicable — copying `:795` up would then be a
guard that cannot pass, which the file at `:775-776` names as *"the mirror image of the bug"*.

---

## A1-13 — `minor` · `swipe-mark-paid.spec.ts` declines to assert the accessible state on a premise its neighbour measured false

**User-facing consequence.** The swipe-to-mark-paid path — one of the two ways a user tells the app a bill
is paid — never asserts what a screen reader is told about the row's state. The spec says why, and the
reason is no longer true, so the gap is now a choice nobody is making deliberately.

**File and line.** `apps/rn/tests/e2e/swipe-mark-paid.spec.ts:75-78`:

> *"⚠️ NOT asserted via the checkbox's checked state: `CheckCircle` sets
> `accessibilityState={{checked}}` and react-native-web does not render it as `aria-checked`, so on web the
> control reports no state at all (the same prop-allowlist trap `utils/a11y.ts` documents). Native is
> unverified → device pass."*

**Measurement.** `apps/rn/src/components/ui/CheckCircle.tsx:64-68` at HEAD:

```tsx
accessibilityRole="checkbox"
// ⛔ `aria-checked`, not `accessibilityState={{ checked }}` — react-native-web 0.21.2 has no
// …
{...a11yChecked(checked)}
```

The component was changed to emit `aria-checked` **precisely because** of the prop-allowlist trap the
comment names. And its sibling spec asserts the result directly —
`apps/rn/tests/e2e/a11y-axe.spec.ts:151-156`:

> *"Today's Required/Recommended action rows are the `CheckCircle` sites, and they are in the embed's
> surface."*
> `await expect(box).toHaveAttribute('aria-checked', 'false');`

with `a11y-axe.spec.ts:114-117` recording the measurement that drove the change — *"MEASURED 2026-08-17:
react-native-web 0.21.2 has NO `accessibilityState` → `aria-*` mapping … 13 sites in 11 files carried it;
**these are the two the marketing embed's surface renders**"*. `CheckCircle` is one of the two that were
converted; `swipe-mark-paid.spec.ts`'s comment describes the bytes that were replaced.

⚡ The two specs seed the **same fixture** — `a11y-axe.spec.ts:135-139` says so in as many words:
*"The seed is `swipe-mark-paid.spec.ts`'s, which is known to render a required row"* — so one file asserts
`aria-checked` on that row while the other says it cannot exist.

**Mechanism (HYPOTHESIS).** The comment was written before the conversion, the conversion was driven from
the a11y side (`a11y-axe`) and never looped back to the spec that had opted out because of the old
behaviour. `lint:a11y-props` greps for the longhand pair in source and tests, so it would have flagged a
surviving `accessibilityState` — but a *comment* describing one is invisible to it.

**Remedy — UNVERIFIED.** Delete the stale sentence and add
`await expect(page.getByRole('checkbox', { name: 'Mark Pay Power paid' })).toBeChecked()` after the mark
and `.not.toBeChecked()` after the undo — the same row `swipe-mark-paid.spec.ts:117` already addresses by
that exact accessible name. ⚠️ Unverified: I have not run it, and the "Native is unverified → device pass"
half of the original sentence is still true and must survive the edit — the web assertion does not
discharge the device row.

---

## Findings, split by origin

`ROUTING-ORIGINS.tsv`, for the files each finding actually lands on.

| finding | severity | subject file(s) | origin |
|---|---|---|---|
| A1-1 | major | `affordability.spec.ts`, `windfall.spec.ts` | fix-churn |
| A1-2 | major | `recovery.spec.ts` | stale-read |
| A1-3 | minor | `plan-hero-conserves.spec.ts` | fix-churn |
| A1-4 | major | `csv-import.spec.ts` · gate `scripts/check-fixture-dates.ts` | neighbour · (instrument, outside this lane) |
| A1-5 | blocker | `progress-hero-journey.spec.ts` · producer `src/app/(tabs)/progress.tsx` | fix-churn |
| A1-6 | minor | `route-smoke.spec.ts` | stale-read |
| A1-7 | major | `ack-coordinator.spec.ts` | fix-churn |
| A1-8 | minor | `enh-audit-screens.spec.ts` | fix-churn |
| A1-9 | major | `backup.spec.ts` | neighbour |
| A1-10 | major | `a11y-axe`, `backup`, `demo-containment`, `swipe-mark-paid`, `tutorial-invite` | fix-churn ×2 · neighbour ×2 · off-surface ×1 |
| A1-11 | major | `demo-containment.spec.ts` | off-surface |
| A1-12 | major | `tutorial-invite.spec.ts`, `date-field.spec.ts` | neighbour · **first-look** |
| A1-13 | minor | `swipe-mark-paid.spec.ts` | fix-churn |

**Totals by severity:** 1 blocker · 8 major · 4 minor = **13**.

**Totals by origin** (counting a finding once per origin it touches):

| origin | findings |
|---|---|
| **fix-churn** | 7 — A1-1, A1-3, A1-5, A1-7, A1-8, A1-10, A1-13 |
| **neighbour** | 4 — A1-4, A1-9, A1-10, A1-12 |
| **stale-read** | 2 — A1-2, A1-6 |
| **off-surface** | 2 — A1-10, A1-11 |
| **first-look** | 1 — A1-12 *(⚠️ [D69]-exempt from the convergence count, NOT from the fix)* |
| **instrument** | 1 — A1-4 *(the gate is outside this lane's manifest; the fixture it cannot see is inside it)* |
| **s0-first-look** | 0 — all four `tests/shots/*.shot.ts` read, nothing found |

### What that split says

⚠️ **`fix-churn` carries 7 of 13, and the brief predicted it would.** Every one of those is a repair from
this generation that reached the file a finding named and not the shape:

- `A1-3` — the docblock updated by the fix that added the third test still says "both tests".
- `A1-7` — the control idiom eight other specs adopted, absent from a single-test file.
- `A1-10` / `A1-12` — a rule stated in nine files and a helper fixed in one of three.
- `A1-13` — a component converted, its own spec's comment left describing the old bytes.
- `A1-5` — `C4-9`'s suppression applied to the ring's glyph and not to the ring's utterance.

⚠️ **`stale-read` carries only 2 of 13, on the pass's largest bucket (350 files).** In this lane the
never-swept files were, with two exceptions, in better shape than the repaired ones. Do not read that as
the bucket being clean — read it as this lane's spec tree having been swept hard, which is what makes the
repairs the interesting surface.

⚡ **The three instrument-shaped findings (A1-4, A1-8, A1-10) all have the same form:** an instrument was
built, its rule was written down in prose, and the *existing* population that violated the rule was never
enumerated. `check-fixture-dates` encodes the syntax of the defect that produced it; `playwright.shots`
states a property of `tests/e2e` that ten of its rows break; the positive-barrier rule is restated in nine
files with five members outside it. **In all three the missing step is the same one: a search for the
shape, not a fix at the site.**

### On the pass-6 triage's warnings

- *"A class's own label is unreliable"* — I derived every population two ways where I could
  (`A1-10`'s scanner + a read of all nine hits; `A1-4`'s independent scan against the gate's own output)
  and my scanner **over-reported by 5 of 9** in one case and **under-reported by 1** in another. Both are
  recorded in the findings rather than quietly corrected.
- *"Every defect in the fixer's own work was found by an instrument, never by reading"* — this round is a
  counter-example only in part: `A1-11` (a store key that does not exist) and `A1-12` (the helper shape)
  were found by **grep**, not by reading, and `A1-4` and `A1-10` by **a runner file**. `A1-3`, `A1-13` and
  `A1-6` came from reading. The instrument-shaped ones are the sharper findings.
- *"Before reporting that a check did not catch something, prove your checker can SEE the subject"* — I
  could not plant (the brief forbids editing tracked files), so every "this would not red" claim in this
  report is marked as reasoned from the code, and the two places where my own reasoning was refuted by a
  second look (the Progress ring's `%` being real DOM, not Skia; the five false positives in A1-10) are
  written into the findings.
