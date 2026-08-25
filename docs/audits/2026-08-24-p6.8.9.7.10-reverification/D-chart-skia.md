# Cluster D — the trajectory chart and Skia readiness

**Diff under audit:** `8e4540a..3dc3c22`
**Files:** `TrajectoryChart.tsx` · `trajectoryDomain.ts` + `.test.ts` · `compareStrategies.ts` + `.test.ts` ·
`ChartSkeleton.tsx` · `skia-ready.ts` · `skia-ready.web.ts` · `strategy-compare.spec.ts`
**Method:** the seven questions of `BRIEF.md`, in order, per hunk-group. Every claim carries a `path:line`.
**Not consulted:** `DEBT_ELEVATION_PLAN.md`'s *BUILDING NOW*, `DEBT_ELEVATION_LOG.md`'s `P6.8.9.7.*`.

⚠️ **Read but not executed:** no gate, suite or spec was run. Anything that needs a rendered pixel or a
device font scale is reported as undetermined, not as a pass.

Sections are appended as each hunk-group is finished.

---

## D1 — `skia-ready.ts`: the native no-op grows a parameter — `SOUND`

`apps/rn/src/utils/skia-ready.ts:12` — `useSkiaReady(_chunk?: () => Promise<unknown>): boolean` still
returns a bare `true` (`:13`). The parameter is accepted and never invoked, which is exactly what the
comment at `:7-11` claims and exactly what the native build needs: `TrajectoryCanvas.tsx:1` already imports
`TrajectorySkiaChart` **statically**, so there is no chunk to await on native and invoking one would be
pure cost.

- **Q1 (prior properties):** the only property this file had was "always true"; preserved verbatim.
- **Q2 (environments):** the widened signature is structurally compatible with
  `skia-ready.web.ts:43`'s `useSkiaReady(chunk?: …)`. The single call site
  (`TrajectoryChart.tsx:161`) type-checks against both.
- **Q3 (contracts):** none called.
- **Q7 (newly possible):** a future caller could reasonably assume passing a chunk *does* something on
  native and stop importing the chart statically. Nothing in the repo would notice — but the comment at
  `:8-10` states the constraint at the point of risk, which is the cheapest available guard.

---

## D2 — `skia-ready.web.ts`: await the chunk too, and report the rejection — `DEFECT` (minor) + `SOUND-UNPINNED`

`apps/rn/src/utils/skia-ready.web.ts:43-85`.

### What is right, and verified against the library rather than assumed

I read the installed library, not the call shape:

- `apps/rn/node_modules/@shopify/react-native-skia/lib/module/web/WithSkiaWeb.js` does
  `await LoadSkiaWeb(opts);` **then** `return getComponent();` inside a `lazy()`. The hook's ordering at
  `skia-ready.web.ts:71-75` (`loading.then(() => chunk?.())`) mirrors that contract exactly. **Q3 passes**,
  and the `Promise.all` alternative the comment at `:59-70` warns about really would invert it.
- `apps/rn/node_modules/@shopify/react-native-skia/lib/module/web/LoadSkiaWeb.js:4-13` caches
  `ckSharedPromise` and early-returns on `global.CanvasKit !== undefined`. So the "shared and idempotent"
  claim in the docstring at `skia-ready.web.ts:19-20` is **true**, and the hook's own
  `loading ??=` does not double-fetch the 8 MB wasm.
- The chunk specifier is genuinely the same one: `TrajectoryChart.tsx:61` is
  `() => import('./TrajectorySkiaChart')` and `TrajectoryCanvas.web.tsx:17` is
  `() => import('./TrajectorySkiaChart')` — **same directory, same module record**, so the second call
  returns the registry's existing promise. Verified by file listing: both files sit in
  `apps/rn/src/components/payoff/`.

### DEFECT — the failure is *not* reported in a shipping web build

`skia-ready.web.ts:76-78` calls `reportError(error, { seam: 'skia', op: 'load' })`, and the comment at
`:52-58` claims *"the failure is now REPORTED rather than swallowed."*

That is false on the only platform this file runs on:

- `apps/rn/src/utils/reportError.ts:16-19` — the default sink is
  `if (dev) console.warn(...)`, i.e. **dev-only**.
- The real sink is installed by `apps/rn/src/utils/sentry.ts:48-50`, inside
  `initErrorReporting()`.
- **On web, Metro resolves `apps/rn/src/utils/sentry.web.ts:7-9`, which is `// no-op on web`** and its
  own docstring at `:4-5` says it *"keeps the default `reportError` console sink."*

So in a production web export (`__DEV__` false) a CanvasKit or chunk failure is written to **nothing**:
no console line, no Sentry event, and the gate stays closed with the card parked on `ChartSkeleton`
forever. **The environment that breaks it:** any production web build — the marketing embed
(`playwright.embed.config.ts` surface, `canvaskit.ts:9-13` documents that its base path can 404 the wasm,
which is precisely this rejection) and any hosted web export.

The *behaviour* is unchanged and defensible (fail closed); what is wrong is the comment's claim about
observability. Severity: minor — but it is the class the brief's Q3 names ("a wrapper that swallows a
rejection in a `catch`"), and the catch here is a report only where a developer is already watching.

### Regression check (Q1) — the `resolved` fast-path no longer applies to chunk callers

`skia-ready.web.ts:44` — `useState(resolved && !chunk)`. Before, this was `useState(resolved)`.

`resolved` (`:22`, set at `:49`) tracks **CanvasKit only**; there is no module-level flag for "the chunk
landed". So for the one caller that passes a chunk, `ready` starts `false` on **every** mount, forever —
including a remount minutes later when both the wasm and the chunk are in memory. React runs passive
effects after paint, so the first frame of every remount of Progress paints the chart with **no axis
labels, no `Now` footer and no legend** (`TrajectoryChart.tsx:408`, `:498`, `:504`), then grows them a tick
later.

I judge this **correct-by-intent rather than a regression**: `WithSkiaWeb` re-creates its `lazy()` per
mount (`WithSkiaWeb.js` — `useMemo(..., [])` inside the component), so the canvas *also* re-suspends to
`ChartSkeleton` on remount. The two now agree instead of disagreeing, which is the point of the change.
Recording it because it is a real, permanent extra frame of skeleton on a warm navigation, and nothing
measures it.

### Q4 — side effects

The promise chain is inside `useEffect` (`:46-82`). This is the file's own pattern and does not walk into
the render-body trap `CoachMarkLayer.tsx:112-114` and `:144-146` document. ✅

### Q5/Q6 — what would catch a regression

**No test proves it.** There is no unit or e2e test for `skia-ready.web.ts`. The nearest instrument is
`apps/rn/tests/shots/p6.8-matrix.shot.ts:357-360`, and that is a *screenshot settle*, not an assertion
about the hook. Removing the `.then(() => chunk?.())` at `:72` would restore the original race and every
suite would stay green under low contention — which is how it shipped the first time
(`ChartSkeleton.tsx:15-21`). → `SOUND-UNPINNED`.

### Q7 — newly possible

`}, [chunk])` at `:82` makes the effect re-run whenever the caller's function identity changes. The
current caller hoists it to module scope (`TrajectoryChart.tsx:61`) so it is stable. A future caller
passing an inline lambda re-runs the effect on every render. It does **not** loop forever (React bails out
of `setReady(true)` when already `true`), so the comment at `TrajectoryChart.tsx:56-57` (the docstring at `:54-59`) overstates the
consequence — but it does re-enter `chunk()` on every render. Nothing in the repo would notice.

Verdicts: **`DEFECT`** (the reporting claim is untrue in a shipping web build) and **`SOUND-UNPINNED`**
(the sequential chunk await itself is correct and unmeasured).

---

## D3 — `ChartSkeleton.tsx`: the `chart-skeleton` testID — `SOUND-UNPINNED` + a doc `REGRESSION`

`apps/rn/src/components/ui/ChartSkeleton.tsx:32`, applied at `:44` (ring) and `:52` (rect).

- **Q1:** both branches keep their exact styles; only a `testID` prop is added. `useAppColors()` and the
  `border.subtle` tint are untouched (`:37-38`). ✅
- **Q2 (platform):** `testID` maps to `data-testid` on react-native-web and to the native accessibility
  identifier on iOS. It is not one of the props RNW drops. The consumers are all `.web.tsx` fallbacks
  (`TrajectoryCanvas.web.tsx:20`, `AllocationBarCanvas.web.tsx:16`, `CashRunwayCanvas.web.tsx:19`,
  `CushionBarCanvas.web.tsx:15`, `JourneyRingCanvas.web.tsx:15`), so the id is only ever in a web tree —
  which is the only place the instrument reads it. ✅
- **Q2 (theme):** the skeleton is a single token colour in both themes; nothing new is theme-sensitive.
- **Q5:** the instrument is `p6.8-matrix.shot.ts:357-360`. The absence-before-render trap is handled
  correctly and deliberately: `await page.waitForTimeout(1_800)` runs **first**, then
  `expect(page.getByTestId('chart-skeleton')).toHaveCount(0, { timeout: 15_000 })` — documented at
  `p6.8-matrix.shot.ts:349-352`. Because the id is shared by all five canvases, the wait is a property of
  *every* surface rather than an enumerated list of chart-bearing routes, which is the right shape given
  this repo's measured record on enumerated lists.
- **Q6 (is it a gate?):** **it is not.** `ChartSkeleton.tsx:28-30` states the contract itself —
  *"Do not remove or rename without changing `p6.8-matrix.shot.ts`. Losing it does not fail a build."*
  I confirmed nothing enforces the pairing: `scripts/check-maestro-selectors.ts:29` walks
  `apps/rn/src` and `packages/core` against `apps/rn/.maestro` only — it never reads
  `apps/rn/tests/shots/`. And this repo already has the right instrument for exactly this class:
  `scripts/check-copy-owners.ts:35-53` is a file→owner pairing table with a red exit at `:71-78`. Adding
  `{ file: 'apps/rn/tests/shots/p6.8-matrix.shot.ts', owner: 'chart-skeleton' }` there would close it for
  three lines. **Nothing catches a regression here today** → `SOUND-UNPINNED`.
- **Q7:** a stuck skeleton (wasm 404, offline) now turns a shot run into a **15 s timeout failure** where
  it previously produced a quiet, wrong frame. That is the intended trade and I agree with it — recorded
  so the failure mode is not read as a new bug.

### REGRESSION (documentation) — `ChartSkeleton`'s own docstring is now orphaned

`ChartSkeleton.tsx:5-9` is the component's JSDoc (*"Faint placeholder shown while a Skia canvas's CanvasKit
bundle loads on web…"*). The new constant block was inserted **between it and the component**, so:

- `:5-9` now reads as documentation for `CHART_SKELETON_TESTID` at `:32`, which it is not;
- `ChartSkeleton` at `:34` has **no attached JSDoc at all** — hover/IDE docs for the component are gone.

This is the same authoring slip in three places in this cluster (see D7 and the note in D2), so it is
called out once per site rather than treated as cosmetic.

---

## D4 — `TrajectoryChart.tsx`: `SCRUB_READOUT_MAX_W` — `SOUND-UNPINNED`

Declared at `TrajectoryChart.tsx:54`, consumed by the clamp at `:481` and by the style at `:647` (inside `styles.scrubReadout`, `:641-648`).

**Q1 — was the old bound doing anything else?** The clamp is
`clamp(scrub.x - 60, PAD.l, w - PAD.r - SCRUB_READOUT_MAX_W)` with
`clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))` (`:301`). Raising the `hi` bound from `132` to `172`
only ever moves the readout **left**; nothing else read `132`. The `- 60` left-offset, the `top: PAD.t`,
`pointerEvents="none"` and `numberOfLines={1}` are all unchanged (`:477-487`). ✅

**Is the new number right?** The readout is absolutely positioned and content-sized with
`maxWidth: SCRUB_READOUT_MAX_W` (`:647`), so its width is bounded by 172 in **all** states, including large
Dynamic Type — the box does not scale, the text inside it truncates. `left ≤ w - PAD.r - 172` therefore
guarantees `right ≤ w - PAD.r` unconditionally. This is why the readout, unlike `endPillW` (D7), correctly
needs **no** `fontScale` term: `styles.endPill` (`:637`) has no `maxWidth`, `styles.scrubReadout` does.
That asymmetry is real and the change respects it.

**Q2 — narrowest shipping width.** `layout.screenPaddingH = 20` and `layout.cardPaddingH = 20`
(`apps/rn/src/theme/spacing.ts:22,28`), so `w ≈ device − 80`. On a 320 pt device (SE 1st-gen, and an iPad
Slide Over pane) `w ≈ 240` and `hi = 240 − 14 − 172 = 54`, still above `lo = PAD.l = 38`. The clamp does not
invert on any width the app ships to. Below ~224 pt it would invert and `Math.max` would return `PAD.l`,
re-permitting a right-edge overrun — no shipping width reaches that.

**Cost accepted:** near the right edge the readout now detaches from the finger 40 pt earlier than before.
Cosmetic, and the correct trade.

**Q5 — nothing pins it.** `apps/rn/tests/e2e/trajectory-interactivity.spec.ts:58-66` asserts the readout is
visible and contains `/mo|now/` and `'$'` — **content, never geometry**. The spec drags to `box.x + 360`
(`:64`), which is the far right of the plot and exactly where the overflow lived, and it would pass with
`132` restored. There is no `boundingBox()` comparison against the chart's right edge anywhere in
`apps/rn/tests/`. → `SOUND-UNPINNED`; the missing test is a right-edge scrub that measures
`readout.boundingBox().x + width` against the plot container's right edge.

---

## D5 — `TrajectoryChart.tsx`: `TRAJECTORY_SKIA_CHUNK` and the hook call — `SOUND-UNPINNED`

`TrajectoryChart.tsx:61` (module scope) and `:161` (`useSkiaReady(TRAJECTORY_SKIA_CHUNK)`).

- **Q1:** the previous call was `useSkiaReady()`; every downstream use of `skiaReady` (`:408`, `:498`,
  `:504`) is unchanged. The gate still covers exactly the RN-drawn overlays and the legend, and the canvas
  itself is still rendered outside the gate at `:384-402`. ✅
- **Q3:** the specifier matches `TrajectoryCanvas.web.tsx:17` character-for-character and both files are in
  `apps/rn/src/components/payoff/`, so the two dynamic `import()` calls resolve to one module record and
  the second is a registry hit. Verified by directory listing, not inferred from the comment. ✅
- **Q4 (side effect at module scope):** `TRAJECTORY_SKIA_CHUNK` is an arrow *wrapping* the import, so
  module evaluation performs no fetch. Hoisting it out of render is the right call for the `[chunk]`
  dependency at `skia-ready.web.ts:82`, and the comment at `:56-58` says so. ✅
- **Q2 (native):** on iOS this constant is defined and never invoked (`skia-ready.ts:12`), while
  `TrajectoryCanvas.tsx:1` imports the same module statically — so the chart is in the main bundle either
  way and the arrow is inert. ⚠️ **Could not determine:** whether Metro's native bundler emits an async
  bundle boundary for this `import()` in a release iOS build. It is never called, so the worst case is
  bundle-graph shape, not behaviour — but I did not build, and `scripts/preflight-native-lane.ts` is not a
  scan for dynamic imports.
- **Q5/Q6:** nothing asserts that the two specifiers stay identical. If someone renames
  `TrajectorySkiaChart` or moves either file, TypeScript catches the *broken* case, but a divergence into
  two real-but-different modules (say a `TrajectorySkiaChart.v2`) type-checks and silently doubles the
  fetch while re-opening the race. → `SOUND-UNPINNED`.

---

## D6 — `TrajectoryChart.tsx`: the coach-mark subject moves inside the card — `SOUND-UNPINNED`, with a real residual

`TrajectoryChart.tsx:364` opens `<TutorialTarget id="trajectory-scrub">` around the scrub surface and
`:497` closes it; the old wrapper is gone from
`apps/rn/src/app/(tabs)/progress.tsx` (removed in the same commit — the file now imports only
`useTutorialTargets` at `:8` and its comment at `:265-269` records the move (the removed wrapper)).

**Q1 — is exactly one registration left?** Yes. I grepped the whole app: the only
`<TutorialTarget id="trajectory-scrub">` in the tree is `TrajectoryChart.tsx:364`. A second one would have
been last-write-wins into `nodes.current` at
`apps/rn/src/store/tutorialTargets.tsx:118-124` with no warning. ✅

**Q1 — does the wrapper change layout?** `TutorialTarget` renders a bare `View` with `style={style}`
(undefined here) and `collapsable={false}` (`tutorialTargets.tsx:246-270`), which is what its own contract
at `:196-199` promises. The wrapped child carries `style={{ height: H }}` (`TrajectoryChart.tsx:375`), so
the wrapper is a fixed-height, stretch-width box inside `Card`'s column. Responder props
(`:376-381`) stay on the inner view, and the bare wrapper does not intercept touches. ✅

**Q2 — the subject is the right one semantically.** `onResponderGrant={handleScrub}` is on the wrapped view
(`:378`) and the copy is *"Drag the curve"* (`apps/rn/src/store/coachMarkCopy.ts:40-43`). ✅

**Q7 — RESIDUAL 1: the subject's box is now size-invariant, so it stops re-measuring.**
`TutorialTarget`'s `onLayout` fires `targets.invalidate(id)` (`tutorialTargets.tsx:264-267`), and
`CoachMarkLayer` re-places the callout from the re-measured rect. The **old** subject was the whole card,
whose height changes when `skiaReady` flips (the footer at `TrajectoryChart.tsx:498-502` and the legend at
`:504` appear) — that fired a re-measure. The **new** subject is a fixed `height: H` box whose labels are
all absolutely positioned children, so `skiaReady` flipping changes nothing about its layout and
`invalidate` never fires again.

Consequence: the callout is placed **below** the subject after the reveal-scroll — i.e. into the region
where the `Now` footer, the legend, and the *"What if you paid extra?"* / *"Snowball or avalanche?"*
toggles (`:566-591`) render **once Skia is ready**. D2's change *lengthens* that window (the hook now waits
for the chunk as well as the wasm), so the mark is more likely than before to be positioned against a card
that has not yet grown its own controls, and nothing re-measures afterwards.

**Nothing in the repo would notice.**
`apps/rn/tests/e2e/coach-mark-neighbour.spec.ts:32-62` is the instrument for this class and it compares the
callout only against `cash-flow-section` (`:37`) — **the neighbour above**. There is no assertion that the
callout misses the trajectory card's own legend or its two toggles. I could not measure the actual overlap
(it needs a rendered 402×874 page, which I did not run), so this is reported as a residual with its
mechanism, not as a confirmed `DEFECT`.

**Q7 — RESIDUAL 2: eight `/progress` specs still meet the reveal-scroll unseeded.**
`strategy-compare.spec.ts:39-42` was given `coachMarksSeen`, but by enumeration of every spec that visits
`/progress`, these still are not: `a11y-axe`, `earlyjourney`, `enh-audit-screens`, `on-plan-streak`,
`probe-mark-ipad-rail`, `probe-mark-route-push`, `route-smoke`, `trajectory-domain`,
`trajectory-interactivity`, `vis5-cone`. The sharpest is
`apps/rn/tests/e2e/trajectory-interactivity.spec.ts:51-64`, which takes a `boundingBox()` and then drives
raw `page.mouse` coordinates **on the very card the mark points at**. It takes the box after a 2 s wait so
the reveal-scroll has probably settled by then — but that is the same "wait long enough and hope" the rest
of this diff is explicitly correcting, and the fix was applied to exactly the one spec that went red.

**Documentation drift introduced by this move.** Three comments now describe a subject that no longer
exists, and each carries the arithmetic that justified the fix:
- `apps/rn/src/app/(tabs)/progress.tsx:116` — *"`trajectory-scrub` wraps the whole trajectory card"*
- `apps/rn/src/components/plan/CoachMarkLayer.tsx:128` and `:205` — *"the subject (`trajectory-scrub`, the
  whole trajectory card) starts at y≈570 and runs off the bottom"*
- `apps/rn/tests/e2e/coach-mark-neighbour.spec.ts:14-15` — same sentence
Also contradictory within the same commit: `coach-mark-neighbour.spec.ts:45` says *"The scroll is
animated"*, while `progress.tsx:132-135` says *"⚠️ NOT animated"* and passes `animated: false` at `:136`.
The code wins; the spec comment is wrong (the wait is harmless, the stated reason is not).

---

## D7 — `endPillWidth` extracted and unit-tested — `SOUND` at the helper, `SOUND-UNPINNED` at the site, plus a doc `REGRESSION`

`apps/rn/src/components/payoff/trajectoryDomain.ts:54-57`; call site
`apps/rn/src/components/payoff/TrajectoryChart.tsx:325`; tests
`apps/rn/src/components/payoff/trajectoryDomain.test.ts:104-128`.

**Q1 — is the extraction behaviour-identical?** Yes, term for term. The old inline form was
`labelScale = Math.min(fontScale, LABEL_SCALE_MAX)` and
`(20 + (debtFreeDate ? shortDate(debtFreeDate).length : 8) * 6.5) * labelScale`; the new helper is
`chars = label ? label.length : 8` then `(20 + chars * 6.5) * Math.min(fontScale, scaleMax)`
(`trajectoryDomain.ts:55-56`). The call site passes `debtFreeDate ? shortDate(debtFreeDate) : null` and
`LABEL_SCALE_MAX` (`TrajectoryChart.tsx:325`), so the same three inputs arrive. `endPillW` is still used
only by the clamp at `:463`, unchanged. Correct.

⚠️ **One behavioural difference, and it is unreachable in practice:** the old form branched on
`debtFreeDate` and took `.length` of whatever `shortDate` returned; the new form branches on the *string*'s
truthiness, so a `debtFreeDate` for which `shortDate` returns an empty string now yields `chars = 8`
instead of `0`. `shortDate` (`TrajectoryChart.tsx:78`) cannot return empty for a parseable date, and the
fallback direction is the safe one (wider, not narrower). Recorded, not counted as a defect.

**Q5 — would the new tests have failed on the defect V3-5 names?** Yes, and this is the strongest test in
the cluster:

- `trajectoryDomain.test.ts:115` — `assert(endPillWidth('Oct 2026', 1.2, S) > at1, 'it grows with font scale')`
  measures the multiplication by `Math.min(fontScale, scaleMax)`. Delete that factor and the two values are
  equal and the assertion fails. **That is exactly the defect** — an unscaled estimate narrower than the
  pill it clamps.
- `:116` pins the ceiling (`2.0` and `1.2` agree); removing `Math.min` breaks it.
- `:112` pins the arithmetic (`20 + 8 * 6.5`), `:123` the `null` reserve, `:125-127` monotonicity in label
  length.

The comment at `:106-108` is right that this was previously unreachable: `fontScale` is pinned to 1 in
react-native-web so no Playwright spec can vary it, and a pure function is the only instrument left.

**Q5 — what the tests do NOT cover (the site).** Every assertion is about the helper. Nothing asserts that
`TrajectoryChart.tsx:325` still passes `LABEL_SCALE_MAX` rather than some other ceiling, that `fontScale`
is still the real `useWindowDimensions()` value (`:160`), or that the clamp at `:463` still subtracts
`endPillW`. Changing any of those leaves every new assertion green. The *call site* is `SOUND-UNPINNED`.

**Q2 — could not determine:** whether `6.5` per character is genuinely an **upper** bound for
`styles.endPillText` (`fontSize: 11`, `fontWeight: '800'`, `letterSpacing: -0.2` —
`TrajectoryChart.tsx:638`) on the iOS system face. The docstring at `trajectoryDomain.ts:49-52` asserts it
and nothing measures it; verifying it needs a rendered device frame, which I did not produce. The tests pin
the *shape* of the estimate, never its *sufficiency*.

**Q2 (platform):** on react-native-web the whole mechanism is inert — `fontScale` is 1 and RNW ignores
`maxFontSizeMultiplier` on the pill's `Text` (`:464`). The behaviour this protects exists **only on iOS**,
where nothing in the suite runs it. That is a fair reading of why the fix became a unit test rather than an
e2e.

### REGRESSION (documentation) — `trajectoryDomain`'s JSDoc is now orphaned

`trajectoryDomain.ts:31-39` is the JSDoc for `trajectoryDomain` — *"The x-axis span, in months… Two
properties the pre-clamp expression got RIGHT, which this keeps."* `endPillWidth` and its own docstring were
inserted **between** it and the function, which now begins at `:59` with no attached documentation. It now
reads as if `:31-39` documents the pill-width helper, and the two load-bearing edge cases it records (the
lean cone's reach, the never-clears fallback) are detached from the code that implements them at `:71-75`.

Identical slip to D3. Nothing gates it: `scripts/check-comment-convention.ts` polices only meta-commentary
(`:35-47`) and member counts (`:57-61`). I checked every added comment in this cluster against both pattern
sets — **no hit**, so the new comments pass that gate. Docstring attachment is not a class it can see.

---

## D8 — `comparisonTakeaway`: the "only one clears" branch and the backstop — `SOUND`

`apps/rn/src/components/payoff/compareStrategies.ts:102-112` and `:130`; tests
`apps/rn/src/components/payoff/compareStrategies.test.ts:126-162`.

**Q1 — does the new leading branch change any existing sentence?** No, and this is provable rather than
observed. The new condition is `sClears !== aClears` (`:102-104`), where each is `debtFreeMonth != null`.
`finishSooner` is computed at `:71` as non-null **only when both** are non-null. So on every input that
reached one of the three original `finishSooner` branches, `sClears === aClears` and the chain falls through
to them unchanged. The conversion of `if` to `else if` at `:106` is therefore inert on all previously
handled inputs. The second block (`firstWinSooner`, `:114-120`) and `plural` (`:135-137`) are untouched.

**Q5 — would the new tests have failed on the defect?** Yes, both, and they assert content rather than a
proxy:

- `compareStrategies.test.ts:137` — `assert(!/^\.?$/.test(takeaway.trim()), …)`. Against the old return
  value `"."` this is `!true`, i.e. **fails**.
- `:138-141` — `takeaway.startsWith('Only snowball clears your debt')` fails on `"."`. I traced the
  fixture: `snowball: curve(30)` reaches zero so `debtFreeMonth = 30`;
  `avalanche: [{ month: 0, balance: 100 }]` never does, so `null`. `sClears !== aClears` selects the new
  branch, `firstWinSooner` is `null` so nothing more is appended, giving
  `"Only snowball clears your debt in this projection."`
- `:157-161` — `eq(comparisonTakeaway(cmp), 'These two clear your debts in a different order.')` covers the
  second path: both never clear, `firstWinSooner === 0`, so `:118`'s `parts.length > 0` guard is false,
  `parts` stays empty and only the backstop can speak. Fails on `"."`.

These are real pins on the exact two inputs that produced the bug, not restatements of the implementation.

**Q7 — one newly reachable sentence that can be untrue.** When one side clears and the other does not, and
`firstWinSooner` is non-`null` and `0`, the chain produces *"Only snowball clears your debt in this
projection, and the order they clear in changes."* (`:105` then `:119`). The order clause is only guaranteed
by `differs`, which can also be true purely because `s.debtFreeMonth !== a.debtFreeMonth` (`:76`) while the
clear sequences are identical — so the app can state "the order changes" when it did not. It needs a
portfolio where every debt clears in the same month under both strategies but only one trajectory reaches
zero. Contrived, and it produced `"."` before, so it is not a regression — recorded because no test covers
it and this file's own standard (`:18-22`) is that the app does not state what it cannot support.

**Q2 — copy and locale:** the two new strings carry no numbers, currency or dates, so the money-format and
local-date gates have nothing to catch, and the `[D59]` no-dollar rule holds (both are free of `$`,
`interest`, `cheaper`, `save` — the property `compareStrategies.test.ts:104` and
`strategy-compare.spec.ts:104` both assert).

**Verdict `SOUND`** — correct, prior behaviour preserved by construction, and both new paths are pinned by
tests that fail on the original defect.

---

## D9 — `strategy-compare.spec.ts`: the shape assertion and the seeded coach marks — `SOUND` + `WEAK-TEST` (minor)

`apps/rn/tests/e2e/strategy-compare.spec.ts:101` and `:39-42`.

**Q5 — the assertion.** `expect(text, …).toMatch(/[A-Za-z]{3,}.*\.$/)` replaces
`expect(text.length).toBeGreaterThan(0)`. On the shipped defect the takeaway was `"."`, which has no
letters, so the regex fails. **The new assertion would have caught it.** Asserting shape rather than exact
wording is the right division of labour — `compareStrategies.test.ts` owns the phrasing.

**`WEAK-TEST` (minor) — the regex has a newline hole.** `text` is `(await takeaway.innerText()).trim()`
(`:91`). Without the `s` flag `.` does not match a newline, and `$` without `m` anchors at end-of-string.
If the takeaway ever renders across two DOM blocks — a wrapping change, an inserted break, a second `Text`
inside `strategy-compare-takeaway` — `innerText` returns a newline and this assertion goes red on
**correct** copy. It fails safe (false red, not false green), so it is a nuisance rather than a hole, but
`[\s\S]*` in place of `.*` costs nothing.

**Q7 — the `coachMarksSeen` seed changes what this spec exercises.** `:39-42` seeds all three ids, and I
confirmed against `apps/rn/src/store/coachMarkCopy.ts:24-43` that those **are** the complete `COACH_MARKS`
table, so no mark can fire. The suppression path is the `prefs.coachMarksSeen.includes(id)` refusal in
`apps/rn/src/store/coachMarks.ts`. Note that `scenario()` spreads `over` last
(`apps/rn/tests/e2e/helpers/seed.ts:38-44`), so this `prefs` object **replaces** the default
`{ onboardingComplete: true }` — it correctly re-states it at `:40`.

The cost is that this spec no longer covers the first-run state, and the comment at `:33-37` is candid
about why: the reveal-scroll can move the toggle between Playwright's actionability check and the click.
**That admission is the finding.** The same exposure applies to the `/progress` specs listed in D6 that were
*not* seeded — including `trajectory-interactivity.spec.ts`, which drives raw mouse coordinates on the
coached card. Fixing the one spec that went red leaves the class open, and the user-facing half of it
(*"A user reaching for that control during the first render can mis-tap the same way"*) is deferred to a
backlog row rather than closed.

**Q1 — the spec's other assertions** (`:59`, `:76`, `:81-82`, `:112`) are untouched and still carry their
render barriers (`:58`, `:50`). Preserved.

---

## Tally

| hunk-group | subject | verdict |
|---|---|---|
| D1 | `skia-ready.ts` — native signature widened | `SOUND` |
| D2 | `skia-ready.web.ts` — await the chunk, report the rejection | `DEFECT` (the report reaches nobody on web) + `SOUND-UNPINNED` (the await itself) |
| D3 | `ChartSkeleton.tsx` — `CHART_SKELETON_TESTID` | `SOUND-UNPINNED` + doc `REGRESSION` |
| D4 | `TrajectoryChart.tsx` — `SCRUB_READOUT_MAX_W` | `SOUND-UNPINNED` |
| D5 | `TrajectoryChart.tsx` — `TRAJECTORY_SKIA_CHUNK` | `SOUND-UNPINNED` |
| D6 | `TrajectoryChart.tsx` — coach-mark subject moved inside the card | `SOUND-UNPINNED`, two residuals |
| D7 | `endPillWidth` extracted + unit-tested | `SOUND` (helper) / `SOUND-UNPINNED` (site) + doc `REGRESSION` |
| D8 | `comparisonTakeaway` — "only one clears" + backstop | `SOUND` |
| D9 | `strategy-compare.spec.ts` — shape assertion + `coachMarksSeen` | `SOUND` + `WEAK-TEST` (minor) |

**No `DEAD` and no `UNREACHABLE-GATE` in this cluster** — nothing here is behind `qaEnabled()`, and the
cluster introduces no gate at all. That absence is itself D3's finding.

---

## Findings, most severe first

1. **`DEFECT` — the Skia failure is reported to nobody in a shipping web build.**
   `apps/rn/src/utils/skia-ready.web.ts:76-78` calls `reportError`, and its comment at `:52-58` claims the
   failure is *"REPORTED rather than swallowed."* On web the sink is
   `apps/rn/src/utils/reportError.ts:16-19` (dev-only `console.warn`), because Metro resolves
   `apps/rn/src/utils/sentry.web.ts:7-9`, a no-op whose own docstring at `:4-5` says it keeps the console
   sink. **Breaking environment:** any production web export — including the marketing embed, where
   `apps/rn/src/utils/canvaskit.ts:15-20` documents a real 404 path for the wasm, i.e. exactly this
   rejection. The fail-closed behaviour is right; the observability claim is not.

2. **Residual (unmeasured, mechanism stated) — the coach-mark subject stopped re-measuring, and this diff
   widened the window in which it is placed too early.** `TrajectoryChart.tsx:364` makes the subject a
   fixed `height: H` box (`:375`) whose overlays are absolutely positioned, so
   `TutorialTarget`'s `onLayout` → `invalidate` (`apps/rn/src/store/tutorialTargets.tsx:264-267`) fires
   once and never again. The old whole-card subject re-fired when `skiaReady` grew the footer (`:498`) and
   legend (`:504`). D2 makes that flip **later** (wasm + chunk, not wasm alone), so the callout is more
   likely to be positioned against a card that has not yet grown its own controls, and it is placed below
   the subject — over the `Now` footer, the legend and the two toggles (`:566-591`).
   **Nothing would notice:** `apps/rn/tests/e2e/coach-mark-neighbour.spec.ts:37` measures overlap only
   against `cash-flow-section`, the neighbour *above*. I did not render the page, so this is a residual
   with a mechanism, not a confirmed defect.

3. **Residual — the mis-tap class was closed in one spec and left open in ten.**
   `apps/rn/tests/e2e/strategy-compare.spec.ts:39-42` seeds `coachMarksSeen`; by enumeration of every spec
   that visits `/progress`, these do not: `a11y-axe`, `earlyjourney`, `enh-audit-screens`,
   `on-plan-streak`, `probe-mark-ipad-rail`, `probe-mark-route-push`, `route-smoke`, `trajectory-domain`,
   `trajectory-interactivity`, `vis5-cone`. `trajectory-interactivity.spec.ts:51-64` takes a
   `boundingBox()` and then drives raw `page.mouse` coordinates on the coached card, protected only by a
   2 s wait. The spec comment at `strategy-compare.spec.ts:33-37` states the user-facing half of the same
   class and defers it to a backlog row.

4. **`SOUND-UNPINNED` ×4 — the instrument contract, the clamp bound, the chunk pairing, the call site.**
   - `CHART_SKELETON_TESTID` (`apps/rn/src/components/ui/ChartSkeleton.tsx:32`) is consumed by
     `apps/rn/tests/shots/p6.8-matrix.shot.ts:359` and enforced by nothing;
     `scripts/check-maestro-selectors.ts:29` reads only `apps/rn/.maestro`. The repo already has the right
     shape for this — `scripts/check-copy-owners.ts:35-53` is a file→owner table with a red exit at
     `:71-78`.
   - `SCRUB_READOUT_MAX_W` (`TrajectoryChart.tsx:53`): `trajectory-interactivity.spec.ts:58-66` asserts the
     readout's **content** and never its geometry, and it already drags to the far right edge at `:64` — it
     would pass with `132` restored. Missing test: `readout.boundingBox().x + width` against the plot's
     right edge.
   - `TRAJECTORY_SKIA_CHUNK` (`TrajectoryChart.tsx:61`) must stay the same specifier as
     `TrajectoryCanvas.web.tsx:17`; a divergence into two real modules type-checks and silently
     double-fetches while re-opening the race.
   - `endPillWidth`'s **call site** (`TrajectoryChart.tsx:325`, clamp at `:463`) is untested; all new
     assertions are about the helper.

5. **Documentation `REGRESSION` ×2, same slip.** A new `export const` + docstring was inserted between an
   existing JSDoc and the thing it documents, orphaning it:
   `apps/rn/src/components/ui/ChartSkeleton.tsx:5-9` (now detached from `ChartSkeleton` at `:34`) and
   `apps/rn/src/components/payoff/trajectoryDomain.ts:31-39` (now detached from `trajectoryDomain` at
   `:59`). `apps/rn/src/utils/skia-ready.web.ts:52-58` and `:59-70` are a third instance in miniature — two
   consecutive JSDoc blocks with no code between them. `scripts/check-comment-convention.ts` cannot see
   this class; I verified the added text trips neither its META (`:35-47`) nor its COUNTS (`:57-61`)
   patterns.

6. **Stale comments the move left behind.** Three sites still describe `trajectory-scrub` as *"the whole
   trajectory card"* and carry the y≈570 / 362 pt arithmetic that justified the fix:
   `apps/rn/src/app/(tabs)/progress.tsx:116`, `apps/rn/src/components/plan/CoachMarkLayer.tsx:128` and
   `:205`, and `apps/rn/tests/e2e/coach-mark-neighbour.spec.ts:14-15`. Separately,
   `coach-mark-neighbour.spec.ts:45` says *"The scroll is animated"* while `progress.tsx:132-135` says
   *"NOT animated"* and passes `animated: false` at `:136` — the code wins.

7. **`WEAK-TEST` (minor) — newline hole in the takeaway regex.**
   `apps/rn/tests/e2e/strategy-compare.spec.ts:101` uses `/[A-Za-z]{3,}.*\.$/` on `innerText()`. Fails safe
   (false red), but `[\s\S]*` costs nothing.

8. **Minor, recorded not charged.** `endPillWidth`'s empty-string branch differs from the old inline form
   (`chars = 8` rather than `0`), unreachable via `TrajectoryChart.tsx:78`'s `shortDate`. And
   `comparisonTakeaway` can now emit *"and the order they clear in changes"* on a portfolio where it did
   not (`compareStrategies.ts:105` then `:119`) — contrived, and it returned `"."` before.

---

## What I could not determine

- Whether `6.5` px/char is a true **upper** bound for the end pill at iOS Dynamic Type — needs a device
  frame. `trajectoryDomain.ts:49-52` asserts it; nothing measures it.
- Whether the residual in finding 2 actually overlaps in pixels at 402×874 — needs a rendered page, and I
  ran nothing.
- Whether Metro emits an async bundle boundary for `TrajectoryChart.tsx:61`'s `import()` in a release iOS
  build. It is never called there (`apps/rn/src/utils/skia-ready.ts:12`), so the worst case is bundle-graph
  shape rather than behaviour.

## Method notes

- I read the installed library rather than trusting the diff's account of it:
  `apps/rn/node_modules/@shopify/react-native-skia/lib/module/web/WithSkiaWeb.js` (sequential
  `await LoadSkiaWeb(opts)` then `getComponent()`) and `…/LoadSkiaWeb.js` (`ckSharedPromise` dedupe,
  `global.CanvasKit` early return). Both claims in the changed comments check out.
- No gate, spec or suite was executed.
