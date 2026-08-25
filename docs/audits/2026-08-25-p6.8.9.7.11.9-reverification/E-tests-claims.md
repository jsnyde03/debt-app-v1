# Cluster E — TESTS AND CLAIMS

**Base** `3dc3c22` → **head** `4877d90`. Read-only; no gate or suite was executed. Verdict vocabulary and
the seven questions are `BRIEF.md`'s.

**Files in scope**

| file | change |
|---|---|
| `apps/rn/src/store/storeActions.test.ts` | +31, one new assertion block |
| `apps/rn/tests/e2e/earlyjourney.spec.ts` | +9, one new absence assertion |
| `apps/rn/tests/e2e/hero-date-fit.spec.ts` | +9, docstring only |
| `apps/rn/tests/e2e/strategy-compare.spec.ts` | +5/−1, one regex flag |
| `apps/rn/src/utils/skia-ready.web.ts` | +15/−2, docblock only |
| `apps/rn/src/components/ui/ChartSkeleton.tsx` | docblock relocation |
| `apps/rn/src/components/payoff/trajectoryDomain.ts` | docblock relocation |

Sections are appended one per hunk-group, in the order they were finished.

---

## E-1 · `storeActions.test.ts:467-497` — the "finale→beat arm" block — **WEAK-TEST**

**What the new assertion measures.** `storeActions.test.ts:492-495` asserts
`s.getState().store.pendingPayoff === finale` — object identity — after two `updateDebt` calls separated by
an `addDebt`.

**The claim.** The docblock at `storeActions.test.ts:467-477` says the two blocks above it "**both also pass
under the looser `payoff.kind !== next.pendingPayoff.kind`**", that the looser guard "DESTROYS a persisted
finale by letting a later beat overwrite it", and that this new block is "**the only arm that guards it**".

**The block does not reach a beat.** Walk it against `store.ts:60-66` and `payoffCelebration.ts:23-56`:

1. `inst({ debts: [d0] })` → one debt, balance 500 (`storeActions.test.ts:480-484`).
2. `updateDebt('d0', { balance: 0 })` → `liveBefore=[d0]`, `crossed=[d0]`, `liveAfter=[]` →
   `payoffCelebration.ts:45` returns `{ kind: 'finale' }`. Control passes.
3. `addDebt(d1)` — `addDebt` at `store.ts:383` **does not call `withPayoffCelebration`** (the only four call
   sites are `store.ts:428, 437, 451, 619`), and `liveBefore` would be empty anyway. No change.
4. `updateDebt('d1', { balance: 0 })` → `before.debts = [d0@0, d1@900]`, `liveBefore=[d1]`, `crossed=[d1]`,
   and **`liveAfter = []` because d0 is already at zero** → `payoffCelebration.ts:45` returns
   **`{ kind: 'finale' }` again, not a beat.**

So the transition under test is **finale → finale**, and the guard at `store.ts:64` is evaluated as
`payoff.kind === 'finale' && next.pendingPayoff.kind !== 'finale'` → `true && false` → `false` → keep. Under
the looser `payoff.kind !== next.pendingPayoff.kind` the kinds are **equal**, so `!(false)` → `true` → keep
**as well**. Identity is preserved either way.

⛔ **The new block passes under the exact defect its docblock names.** It adds zero discriminating power over
the two blocks above it against the "natural" looser guard.

**What it does catch,** and it is the only thing: a guard written as "keep unless the new payoff is a finale"
(dropping the `pendingPayoff.kind !== 'finale'` half), which would re-stamp a fresh `{kind:'finale'}` object
and break the identity check. That is a narrow, behaviourally-invisible variant — `kind` is unchanged, so
nothing downstream can tell the two objects apart except a re-render/persist write.

**The narrated scenario is also wrong.** `storeActions.test.ts:474-476` — "clear everything (finale pending,
unconsumed), then **add a debt and clear it**" — produces a second *finale*, not a beat, for the reason in
step 4. To reach finale→beat you need **two** new debts and to clear only one, so `liveAfter.length > 0`.
The real hole is unpinned: with a finale pending, add d1+d2, clear d1 → `payoff.kind === 'beat'`, the tight
guard keeps the finale, the looser guard **overwrites it**. Nothing in the repo exercises that.

**Prior properties.** The block is purely additive; `storeActions.test.ts:413-441` and `:444-466` are
untouched and still pin the beat→finale upgrade and the beat→beat preserve.

**Environment.** `payoffCelebration.test.ts` calls `detectPayoff` directly, so it cannot reach
`withPayoffCelebration` either — confirmed against `store.ts:60`, the only definition.

---

## E-2 · `earlyjourney.spec.ts:47-56` — naming the retired welcome bullet — **SOUND**

**What the new assertion measures.** `earlyjourney.spec.ts:54` —
`await expect(page.getByText(/Check any purchase against your plan/i)).toHaveCount(0);` — the *instance*
that A4/M1-9 retired, by its own words rather than by its category.

**The claim checks out.** The retired sentence is recorded verbatim in the component's own comment at
`WelcomeStep.tsx:19` — *"Check any purchase against your plan before you buy"* — and it contains none of
`Smart Insights|Forecast|What-If|Strategy Comparison`, the old net at `earlyjourney.spec.ts:56`. Re-adding it
as a fourth `FEATURES` entry (`WelcomeStep.tsx:13-33`, rendered by the unbounded `.map` at
`WelcomeStep.tsx:72`) would leave the three prior assertions green, exactly as the docblock says.

**Not vacuous.** Four positive controls prove the screen is up before the absence runs:
`earlyjourney.spec.ts:29` (`Will you make it to payday?`), `:30` (`A guardian for every payday`), `:45`
(`Private by design` — `PRIVACY_CLAIM.headline`, `packages/core/copy/vocabulary.ts:111`) and `:46`
(`/never be sold more debt/` — `vocabulary.ts:115`). `getByText` matches the DOM, not the viewport, so a
bullet scrolled below the fold still counts — the off-viewport escape does not apply here.

**Prior properties preserved.** The category net at `earlyjourney.spec.ts:56` is kept, not replaced, and the
two presence assertions are untouched. The block still runs for both themes (`earlyjourney.spec.ts:12`).

**Naive over-fix.** The obvious wrong fix — widening the existing regex with `|purchase` or `|afford` — would
also pass. That is not worse than what shipped; the shipped form is the more specific of the two.

### Residual, not a defect

Neither regex covers the **class**. A reworded affordability promise ("See if a purchase fits your plan",
"Know what you can afford before you buy") passes both `earlyjourney.spec.ts:54` and `:56`. The bullets are
built from constants (`WelcomeStep.tsx:32` uses `PRIVACY_CLAIM`), which the docblock at
`earlyjourney.spec.ts:38-39` correctly notes makes `lint:copy`/`lint:glossary` structurally blind to this
slot. **Nothing asserts that bullet 3 IS the privacy bullet and only the privacy bullet** — only that two
strings are present and two patterns are absent. A fourth bullet in any new wording is still unguarded.

---

## E-3 · `hero-date-fit.spec.ts:27-34` — "what the plant did not prove" — **SOUND**

Docstring only; no assertion added or changed. Judged as a **claim**, per the brief.

**Every load-bearing statement in it verifies.**

| claim | check |
|---|---|
| "`heroDateFit` also carries `adjustsFontSizeToFit` and `minimumFontScale`" (`:29`) | ✅ `progress.tsx:56-57` |
| "the source says so at `progress.tsx:50`" (`:30`) | ✅ `progress.tsx:50` is exactly *"`adjustsFontSizeToFit` is a no-op in react-native-web"* — the citation lands on the right line |
| "the fit is delivered entirely by RNW's wrap" (`:30-31`) | ✅ consistent with `numberOfLines: 2` at `progress.tsx:55` being the only prop RNW honours of the three |
| "Nothing in this repo can reach that half" (`:32`) | ✅ measured — a repo-root grep for `adjustsFontSizeToFit\|minimumFontScale` returns **five** hits and **not one is an assertion**: `progress.tsx:47,50,56,57`, `paywall.tsx:344`, plus this docstring. No spec, no `scripts/` gate reads either prop |
| "it is the P6.14 row *Read the Progress hero on a small device at a wide month*" (`:33-34`) | ✅ that row exists verbatim at `docs/DEBT_ELEVATION_PLAN.md:403`, and its parenthetical already says *"`adjustsFontSizeToFit` is a no-op on web; the 320 pt guarantee is an iOS-only claim"* |
| "deleting both shrink props leaves this spec green while iOS truncates" (`:31`) | ✅ by construction — the spec's only two assertions are `scrollH ≤ clientH` and `scrollW ≤ clientW` (`hero-date-fit.spec.ts:78-88`), both computed in a browser where the props are inert |

**Prior properties preserved.** The pre-existing paragraphs (`:18-25` on what the plant *did* prove, `:36-40`
on OVERFLOW-not-equality) are untouched, and the two viewports at `:56` still run.

**This is the correct disposition of the gap.** The change writes down a limit rather than papering it with a
web assertion that cannot see the property — and it routes it to an instrument that exists. Downgrading the
spec's own claim of coverage is a strengthening of the record, not a weakening of the test.

### One imprecision, non-material

`hero-date-fit.spec.ts:29-30` says "**react-native-web drops both** — the source says so at
`progress.tsx:50`". `progress.tsx:50` names only `adjustsFontSizeToFit`. `minimumFontScale` is inert on web
as a *consequence* (it only has meaning while the shrink prop is honoured), which is true but is not what the
cited line says. Not worth a verdict.

---

## E-4 · `strategy-compare.spec.ts:101-104` — the `s` flag on the takeaway regex — **DEFECT (false mechanism; the assertion is strictly weaker for a reason that cannot occur)**

**The change.** `strategy-compare.spec.ts:104` — `toMatch(/[A-Za-z]{3,}.*\.$/)` → `toMatch(/[A-Za-z]{3,}.*\.$/s)`.

**The stated mechanism, at `strategy-compare.spec.ts:101-103`:** *"`.` does not match a newline, and
`innerText()` returns the rendered line breaks — so a takeaway that wrapped onto two lines could not match
and reported a defect that was not there."*

**Both halves are false.**

**(a) `innerText()` does not return soft-wrap breaks.** The HTML `innerText` getter inserts `\n` only for
required line breaks — block-level boundaries and `<br>` — never for a line box produced by wrapping. A
paragraph that visually occupies three lines returns one unbroken string. This spec's own neighbours rely on
that: `strategy-compare.spec.ts:74-75` compare two whole columns as single `innerText()` strings, and the
docstring at `hero-date-fit.spec.ts:9-11` states the same property from the other direction — *"`innerText()`
… returns the full string straight through a line-clamp."* **The repo already documents that innerText is
blind to rendered line geometry, and this comment asserts the opposite twenty lines from a spec that depends
on it.**

**(b) Even with a real `\n`, the un-`s` regex still matched.** The pattern is unanchored at the start, so the
match may *begin* after a newline. It required only that the **final line** contain a 3+ letter run and end
in `.`. Every string `comparisonTakeaway` can produce satisfies that on one line:
`compareStrategies.ts:89`, `:105`, `:107`, `:109`, `:111`, `:115`, `:117`, `:119`, `:130` and the join at
`:132` — **none of them contains a newline character**, and the value reaches the DOM as a single string
child of a single `<Text>` (`StrategyCompare.tsx:60-62`). The failure the comment describes has never been
reachable.

**What the flag actually changed.** The assertion no longer requires the *last* line to be a sentence — with
`s`, `"Snowball finishes 3 months sooner\n."` matches. That is a strict loosening of a C7 guard, made on a
premise that does not hold.

**It does not reopen C7.** The literal `"."` measured at `compareStrategies.ts:96-97` has no letters at all
and still fails with or without `s`, and `.trim()` at `strategy-compare.spec.ts:91` removes a trailing
newline before the match. So the shipped behaviour is unchanged today; the defect is the recorded reasoning
and the unearned loss of strictness.

**Prior properties preserved.** `strategy-compare.spec.ts:107` (`not.toMatch(/\$|interest|cheaper|save/i)`,
[D59]) is untouched, as is the `toBeVisible` control at `:90`.

**Correct disposition:** revert to `/[A-Za-z]{3,}.*\.$/` and delete `:101-103`, or — if a multi-line takeaway
is genuinely anticipated — keep `s` and say so as a forward-looking allowance rather than as a fixed bug.

---

## E-5 · `skia-ready.web.ts:52-69` — the rejection docblock — **DEFECT (one false claim replaces another; the D-1 half is correct)**

Docblock only; `skia-ready.web.ts:82-89` is byte-identical to the base. Judged as a set of claims.

### The D-1 half is correct and well-cited — this part is a genuine improvement

The base ended *"the failure is now REPORTED rather than swallowed."* The new text replaces it with the
opposite, and every citation holds:

| claim (`skia-ready.web.ts`) | check |
|---|---|
| "`reportError`'s default sink is a **dev-only** `console.warn` (`reportError.ts:16-19`)" (`:58-59`) | ✅ `reportError.ts:16-19` is `defaultReporter`, gated on `typeof __DEV__ !== 'undefined' && __DEV__` |
| "web never registers a real one — `sentry.web.ts:7-9` is a no-op" (`:59-60`) | ✅ `sentry.web.ts:7-9` is `initErrorReporting` with `// no-op on web`. The only production `setErrorReporter` call is `sentry.ts:48`, the **native** file; the only others are in `realWriteGuard.test.ts:45,134` |
| its own docstring says it *"keeps the default `reportError` console sink"* (`:60-61`) | ✅ the words are there, at `sentry.web.ts:4-5` (the citation points at the function, not the sentence — harmless) |
| "This file only ever runs on web" (`:61`) | ✅ `skia-ready.ts:12-14` is the native sibling and returns `true` unconditionally |
| "`canvaskit.ts:15-20` documents a real wasm 404 on the marketing embed, which is this rejection" (`:65-66`) | ✅ `canvaskit.ts:18-19` records the measured `HTTP 404 …/canvaskit.wasm`; the embed narrative runs `canvaskit.ts:9-13` |
| "with `__DEV__` false, **nothing happens**" (`:61`) | ✅ and it is the shipping case — `reportError.ts:16-19` is the whole sink |

⚠️ **That makes the `reportError` call at `skia-ready.web.ts:88` `DEAD` in a production web export** — it
reaches nobody. It is pre-existing rather than introduced by this diff, and the diff's own text now says so,
which is the right disposition given the stated scope decision at `:67-68`.

### The new false claim

`skia-ready.web.ts:63-64`: *"The `catch` is still load-bearing: failing closed is the correct behaviour
regardless of where it reports, and **removing it restores the hang**."*

**Removing the `catch` does not change the hang.** Trace `skia-ready.web.ts:82-89`: on rejection,
`.then(() => { if (alive) setReady(true); })` is skipped whether or not a `.catch` follows it, so `ready`
stays `false` and the card stays in its skeleton. The module-level memo (`skia-ready.web.ts:23`,
`loading ??=`) caches the **rejected** promise, so every later mount takes the same path. The hang is
identical with and without the `catch`, and the same docblock says so two lines earlier: *"The gate stays
CLOSED on failure, deliberately"* (`:55`).

**Confirmed against history, not reasoned.** The pre-`.7` version at `3d775c8:apps/rn/src/utils/skia-ready.web.ts`
had **no `.catch` at all** and no `if (resolved) return` guard difference that matters here — it read
`void loading.then(() => { if (alive) setReady(true); });`. It hung on rejection. Today's version hangs on
rejection. **The `catch` never removed the hang, so it cannot restore it.**

**What removing the `catch` actually changes** — and it cuts the other way from the paragraph above it: an
unhandled promise rejection would reach the browser's default handler and print to the console. There is no
`window.onunhandledrejection` and no `pageerror` listener anywhere in `apps/rn/src` or `apps/rn/tests` (grep
for `unhandledrejection|pageerror` returns zero hits outside `scrubBreadcrumb`'s unrelated `console`
category). So in a shipping web build the `catch` makes a CanvasKit failure **quieter than no `catch` would**
— the exact swallowing the paragraph at `:58-61` is complaining about. The docblock argues for keeping the
one construct that guarantees the silence it laments.

**The load-bearing property the `catch` does have,** stated correctly: it is what makes "fail closed"
*deliberate* rather than accidental, and it is the seam a real web reporter would be wired into. That is a
defensible reason to keep it. It is not the reason given.

### Question 7 — what this made possible

Nothing new: the diff is comment-only and the behaviour is byte-identical. The pre-existing newly-possible
state remains uncovered — **a permanently-closed gate is indistinguishable, from every instrument in the
repo, from a slow load.** `p6.8-matrix.shot.ts:367` waits `expect(getByTestId('chart-skeleton')).toHaveCount(0)`
with a 15 s timeout, which is the only automated observer of this seam, and it reds identically for "wasm
404" and "worker contention". Filed as pre-existing.

---

## E-6 · `ChartSkeleton.tsx` — docblock relocation — **SOUND**

**What moved.** The component docblock moved from the top of the file (base `3dc3c22`, line 5-10) to
`ChartSkeleton.tsx:28-36`, immediately above `export function ChartSkeleton` at `:37`. No executable line
changed — `git diff` shows the const `CHART_SKELETON_TESTID` (`:26`), its instrument docblock (`:5-25`) and
the whole component body (`:37-61`) untouched.

**Correct after the move.** Each sentence now describes the thing beneath it: `ChartSkeleton.tsx:29-30`
("shown while a Skia canvas's CanvasKit bundle loads on **web**") matches the component being consumed as the
`.web` canvases' fallback, and `:31` ("a ghosted ring or a few gridlines") matches the two branches at `:43-51`
(ring) and `:53-59` (four 1 px rules). The testid docblock at `:5-25` retains its own subject at `:26`.

**Prior properties preserved.** `CHART_SKELETON_TESTID`'s value is unchanged and its one consumer,
`p6.8-matrix.shot.ts:367`, still resolves — verified by grep across `apps/rn`.

**One imprecision.** `ChartSkeleton.tsx:34-35` says the paragraph described *"something eighteen lines below
it."* At the base it opened at line 5 and `export function ChartSkeleton` was at line 34 — twenty-four lines
below the docblock's close, twenty-nine below its start. Neither is eighteen. Cosmetic; the observation is
right and the fix is right.

---

## E-7 · `trajectoryDomain.ts` — docblock relocation — **SOUND**

**What moved.** The x-axis docblock moved from base line 31-39 (above `endPillWidth`) to
`trajectoryDomain.ts:50-62`, directly above `export function trajectoryDomain` at `:63`. No executable line
changed.

**Both properties the docblock asserts are still true of the function it now sits on** — checked against the
body at `trajectoryDomain.ts:75-79`:

- *"the user's own plan is the latest of **their** curves, never the active one alone"* (`:53-55`) →
  `trajectoryDomain.ts:78`, `const ownEnd = Math.max(activeEnd, clearMonth(cone) ?? 0);` ✅
- *"a plan that never clears … must still draw across the full extent"* (`:56`) →
  `trajectoryDomain.ts:77`, `if (activeEnd == null) return rawEnd;` ✅

`endPillWidth`'s own docblock (`:31-44`) is intact above `:45`, so both functions now carry the right prose.

**One imprecision.** `trajectoryDomain.ts:59-60` says the block was stranded *"thirty lines above its
subject."* At the base it ran lines 31-39 with `trajectoryDomain` at line 59 — twenty lines below its close.
Cosmetic.

### Question 7 — pre-existing, surfaced while reading the moved prose

The docblock's first bullet promises the domain reaches the **lean** curve's date. It does so only when the
active plan clears: `trajectoryDomain.ts:77` returns `rawEnd` early on `activeEnd == null`, and `:78`'s
`clearMonth(cone) ?? 0` contributes nothing when the **cone** is the curve that never clears. So a plan where
the typical curve clears at month 20 and the lean curve never clears inside its horizon clamps to
`ceil(20 × 1.15) = 23` and the lean curve is truncated at the frame by `truncateToDomain` (`:93-96`) —
which is arguably the intended reading, but it is not what the bullet says. **Pre-existing, untouched by this
diff, and nothing asserts either reading.** Recorded so it is re-decided rather than re-discovered.

---

## Tally

| # | hunk-group | verdict |
|---|---|---|
| E-1 | `storeActions.test.ts:467-497` — finale→beat arm | **WEAK-TEST** |
| E-2 | `earlyjourney.spec.ts:47-56` — retired welcome bullet named | **SOUND** |
| E-3 | `hero-date-fit.spec.ts:27-34` — what the plant did not prove | **SOUND** |
| E-4 | `strategy-compare.spec.ts:101-104` — `s` flag | **DEFECT** (false mechanism, unearned loosening) |
| E-5 | `skia-ready.web.ts:52-69` — rejection docblock | **DEFECT** (new false claim replaces the corrected one) |
| E-6 | `ChartSkeleton.tsx:28-36` — docblock relocation | **SOUND** |
| E-7 | `trajectoryDomain.ts:50-62` — docblock relocation | **SOUND** |

4 SOUND · 1 WEAK-TEST · 2 DEFECT · 0 REGRESSION · 0 DEAD (introduced) · 0 UNREACHABLE-GATE.

**Pre-existing, recorded not charged:** the `reportError` call at `skia-ready.web.ts:88` is dead in a
shipping web build (the diff now says so correctly); `p6.8-matrix.shot.ts:367` cannot distinguish a
permanently-closed Skia gate from a slow load; `trajectoryDomain.ts:77-78` does not honour the lean-curve
promise when the *cone* is the curve that never clears.

**Could not determine:** nothing. Every claim in this cluster was decidable by reading. The one property the
cluster itself declares unreachable — `adjustsFontSizeToFit` / `minimumFontScale` on iOS — is correctly
routed to `DEBT_ELEVATION_PLAN.md:403` and I agree it is not observable in this repo.

**Method note.** No gate or suite was run. Verdicts on E-1 and E-4 are derived by tracing the code paths
(`store.ts:60-66`, `payoffCelebration.ts:23-56`, `compareStrategies.ts:88-133`) rather than by executing a
plant, which the brief forbids; both are deterministic and do not depend on runtime state.
