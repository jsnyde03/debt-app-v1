# Cluster D — the coach mark and the reveal

**Base** `3dc3c22` → **head** `4877d90`. Files audited in full, plus `store/tutorialTargets.tsx`,
`store/coachMarks.ts`, `hooks/use-coach-mark.ts`, `components/ui/FormSheet.tsx`,
`hooks/use-sheet-presentation.ts`, `utils/skia-ready.ts` / `.web.ts`, `app/(tabs)/_layout.tsx`,
`scripts/check-comment-convention.ts`, and `react-native-web@0.21.2`'s `pointerEvents` compiler.

Read-only: `git diff`, `grep`, `sed`. No gate or suite was executed; where a claim can only be settled by
running something, that is said rather than guessed.

Hunk-groups, in file order:

| # | site | verdict |
|---|---|---|
| D-1 | `CoachMarkLayer.tsx:117-120` — the scroll-subscription cleanup | `SOUND-UNPINNED` |
| D-2 | `CoachMarkLayer.tsx:176`, `:209` — the stood-down layer's reveal guard | `SOUND-UNPINNED` |
| D-3 | `CoachMarkLayer.tsx:190`, `:197` — wait for the measured height | `SOUND-UNPINNED` |
| D-4 | `CoachMarkLayer.tsx:329` — `pointerEvents="none"` on the sentence | `SOUND` |
| D-5 | `CoachMarkLayer.tsx:136-165`, `:235-238` — the two docblock rewrites | `SOUND-UNPINNED` |
| D-6 | `progress.tsx:147-159` — the scroll host gated on focus | `SOUND-UNPINNED` |
| D-7 | `TrajectoryChart.tsx:174-177` — re-measure on `skiaReady` | `DEAD` |
| D-8 | `coach-marks.spec.ts:115-183` — the new hit-test | `SOUND` |
| D-9 | `coach-marks.spec.ts:228-234`, `coach-mark-neighbour.spec.ts:14-19`, `:47-51` — comment corrections | `SOUND-UNPINNED` |

---

## D-1 — the scroll-subscription cleanup (`CoachMarkLayer.tsx:117-120`)

### Verdict: `SOUND-UNPINNED`

**The defect it names is real and the fix is the right one.** Before, the effect at
`CoachMarkLayer.tsx:98-121` returned `targets.subscribe(...)`'s unsubscribe bare, so `cancelled`
(declared `:101`, read at `:103` and `:107`) was never assigned. The cleanup now sets it (`:118`) and
still unsubscribes (`:119`), so a `measure()` already in flight for the previous mark — up to
`MEASURE_TIMEOUT_MS = 500` (`tutorialTargets.tsx:47`) — can no longer land in the shared
`setRect` (`:107`). The sibling effect above does exactly this (`:79-81`), so the shapes now match.

**Q1 — what else the site did, and still does.** The unsubscribe is preserved, so the listener set
(`tutorialTargets.tsx:152`) does not leak. `inFlight` (`:100`) still throttles a 16 ms scroll stream to
one measurement at a time; a stale `inFlight === true` left in the dead closure is unreachable because
the closure is discarded with the effect.

**Q7 — the residual the fix does not reach, and does not need to.** The layer keeps `rect` in state
across a mark change, so in principle mark B could draw at mark A's coordinates. It cannot happen today:
`show()` refuses while `active` is set (`coachMarks.ts:92`), so every A→B transition passes through
`active === null`, and the first effect clears the rect on that pass (`CoachMarkLayer.tsx:62-64`). That
is an invariant of `show()`, not of this file — if `show()` ever learned to replace an active mark, the
stale rect returns.

**Q5/Q6 — nothing pins it.** No spec drives two coach marks in one page session, and no spec forces a
measurement to be in flight across an `active` change. `coach-marks.spec.ts` and
`coach-mark-neighbour.spec.ts` each raise exactly one mark. **Missing test:** a spec that raises a mark,
dismisses it, and raises a second one while the first `measure()` is still pending — off-web that is
device-owed, but on web a `route`-level delay is not available, so honestly this is only reachable by a
unit test over the layer, which does not exist (there is no test of any kind over `tutorialTargets.tsx`
or `CoachMarkLayer.tsx` under `apps/rn/tests`).

---

## D-2 — a stood-down layer must not ask for a scroll (`CoachMarkLayer.tsx:176`, deps `:209`)

### Verdict: `SOUND-UNPINNED`

**It mirrors the render guard exactly.** `:176` is `if (!nested && hosts > 0) return;` and the render
stand-down at `:212` is `if (!nested && hosts > 0) return null;` — character-identical predicates, which
is what the comment at `:169-175` claims. `hosts` comes from `useCoachMarkHosts()` (`:47` →
`coachMarks.ts:194-196`) and is incremented only by a nested layer's own mount effect (`:56-59` →
`coachMarks.ts:162-165`), which is `FormSheet.tsx:192`.

**Q1 — the prior behaviour that had to survive does.** `hosts` is in the dependency array (`:209`), so
when the sheet closes and `hosts` falls to 0 the effect re-runs and a still-active root mark gets its
reveal. The latch `revealAskedFor` (`:51`, `:177`, `:199`) is a ref and is unaffected by the new early
return — the guard returns *before* the latch is set, so standing down does not burn the mark's one
chance. That ordering is load-bearing and it is correct.

**Q7 — the newly-possible situation, and the half of the bug this does not cover.** The guard silences
the *root* layer. The *nested* layer (`nested === true`) still calls `requestReveal` unconditionally, and
`scrollHost` is a single global slot (`tutorialTargets.tsx:175`, last-writer-wins). So a sheet mark can
still scroll a tab underneath it whenever that tab is the registered host. Today that is unreachable
because the only registrant is Progress (`progress.tsx:150`) and it now deregisters on blur (D-6), and
no `FormSheet` is opened from Progress — `grep -rn "FormSheet" src/components/progress src/components/payoff src/app/\(tabs\)/progress.tsx` returns nothing. The trap is latent, not live. The
previous pass's suggested cure — id-scoped `registerScrollHost(id, fn)` / `requestReveal(id, dy)` — was
not taken, so the single-slot hazard is unchanged in shape and merely unreachable by two independent
accidents.

**Q3 — the contract of `requestReveal` is still misdescribed.** `tutorialTargets.tsx:179-183` returns
`true` as soon as a host exists, whether or not the `scrollTo` could move anything (it clamps). The
docblock at `:84-85` still reads *"Returns `false` when no host is registered … so the caller keeps its
existing placement"*, which is true, and `CoachMarkLayer.tsx:163-164` still reads it as though `true`
meant room was made. That was flagged in the previous pass and is untouched here.

**Q5/Q6 — nothing pins it.** The only two coach-mark specs raise a mark with `hosts` at a fixed value for
the whole test: `coach-marks.spec.ts:115` is always inside a sheet (`hosts === 1`), and
`coach-mark-neighbour.spec.ts:34` never opens one (`hosts === 0`). **Missing test:** a spec that opens a
debt sheet *from a screen that has a registered scroll host* and asserts the background list's scroll
offset is unchanged. That is buildable on web today only if a second screen registers a host, so as
written it is not constructible — which is itself the finding.

---

## D-3 — wait for the measurement instead of latching ahead of it (`CoachMarkLayer.tsx:190`, `:197`)

### Verdict: `SOUND-UNPINNED`

**The stated mechanism checks out.** `calloutH` is written only from the card's `onLayout` (`:297-300`);
the card is not rendered until `rect` is non-null (`:213`); and the reveal effect's dependency list
includes `rect` (`:209`), so it fires on the commit `rect` arrives — one commit *before* any layout pass
could have produced a height. So on the first mark of a layer instance `calloutH` was `0`, `need` fell
back to `ESTIMATED_CALLOUT_H = 144` (`:357`), and the latch at `:199` made the corrected re-run a no-op.
The new `:190` return, with `calloutH` already a dependency, defers the whole computation to the layout
pass. `need = calloutH + ABOVE_GAP + 16` (`:197`) is then equivalent to the old expression under the
guard, so dropping `|| ESTIMATED_CALLOUT_H` is safe *here*.

**Q1 — the render body deliberately keeps the estimate, and that is right.** `:232-233` still read
`(calloutH || ESTIMATED_CALLOUT_H)`, because the first frame has to place the card somewhere in order to
measure it. The docblock at `:226-228` says exactly that. Preserved.

**Q7 — the guard fixes the FIRST mark only; a later mark still latches on the previous mark's height.**
`calloutH` is never reset when `active` changes. The card unmounts when `rect` goes null between marks
(`:213`), but the state survives, so for mark B the `:190` guard passes immediately with mark A's height
and `revealAskedFor.current = active` is set at `:199` before B's own `onLayout` lands. The two marks have
different copy — `coachMarkCopy.ts:29-30` vs `:41-42` — so they can wrap to different heights.
Direction matters: an *under*-estimate self-corrects (the effect returns early at `:198` without latching,
then re-runs when `calloutH` updates), an *over*-estimate scrolls further than needed and latches. This is
reachable on the root layer, which never unmounts and draws both `debt-row-actions` and `trajectory-scrub`
(and `payoff-schedule` too on the iPad inline pane, where `FormSheet.tsx:78-113` renders no nested layer).
Low severity, but it is the same class the fix was written to close.

**Q7 (b) — a callout whose card never reports a height now never reveals.** `onLayout` only commits
`h > 0` (`:299`), so if a platform ever fails to deliver a layout for the absolutely-positioned card, the
old code still scrolled using the 144 estimate and the new code does nothing at all. Not observed;
`react-native-web` implements `onLayout` via `ResizeObserver` and iOS fires it on mount, so this is a
theoretical strictly-worse-on-failure trade, stated for completeness.

**Q5/Q6 — thinly pinned, and the pin got looser.** `coach-mark-neighbour.spec.ts:34` is the only test that
observes the reveal's *outcome*, and it waits 1,200 ms first, so it tolerates the extra layout round-trip.
`coach-marks.spec.ts:203` takes `boundingBox()` (`:216-217`) immediately after `toBeVisible()` with **no
settle wait** — the guard adds one more commit between "the callout is visible" and "the page has
scrolled", so the pre-scroll frame this spec can catch now lasts longer. In that frame the above-branch is
clamped by `Math.max(insets.top + 8, …)` (`:233`) and *can* overlap the subject, which is exactly what the
assertion at `:239-243` forbids. **Newly widened flake risk, nothing checks it.**

---

## D-4 — `pointerEvents="none"` on the sentence wrapper (`CoachMarkLayer.tsx:325-329`)

### Verdict: `SOUND`

**Q3 — the library contract, read rather than assumed. It holds, and it holds because of `!important`.**
`react-native-web@0.21.2` routes the deprecated `pointerEvents` prop into the style pipeline
(`node_modules/react-native-web/dist/modules/createDOMProps/index.js:804-807`), and the compiler emits, for
`box-none` on the card, `selector { pointer-events: none !important }` plus `selector > * { pointer-events: auto }`
(`.../StyleSheet/compiler/index.js:359-364`); for `none` on the child it emits
`selector { pointer-events: none !important }` plus `selector > * { pointer-events: none }` (`:353-358`).
The sentence wrapper matches both the parent's `> *` rule (`auto`, no `!important`) and its own class
(`none !important`). `!important` wins over specificity, so the sentence really is transparent to hit
testing, and its two `Text` children (`:330-331`) inherit `none` from the `> *` rule. **The claim in the
comment at `:284-289` — that `box-none` alone left the sentence a hit target — is correct.**

**iOS: correct, and correct for the reason stated.** `pointerEvents="none"` is honoured in `RCTView`'s
`hitTest:`, not by clearing `userInteractionEnabled`, so the view leaves touch routing without leaving the
accessibility hierarchy. The comment's assertion at `:290-292` (*"`pointerEvents` governs touch routing,
not the accessibility tree"*) is therefore right. **Device-owed, not verified here** — nothing off-device
can observe it, which the author states at `coach-marks.spec.ts:112-113`.

**Q1 — the properties that had to survive.** `accessible` + `accessibilityRole="alert"` +
`accessibilityLabel` stay on the same node (`:326-328`), so the one-utterance property (`:318-320`) is
untouched. `getByText(MARK)` lookups elsewhere in the suite (`coach-marks.spec.ts:47`, `:86`, `:92`) do not
depend on pointer events. The dismiss `Pressable` (`:333-344`) is a sibling, still reached by the card's
`box-none > * { auto }` rule.

**Q5 — the new assertion would fail on the defect it pins.** Delete `:329` and the wrapper falls back to
`auto` from the parent rule; `elementFromPoint` at its centre returns the wrapper or a `Text` inside it,
`closest('[data-testid="coach-mark"]')` matches, and `coach-marks.spec.ts:172-174` goes red. The naive
over-fix — `pointerEvents="none"` on the card itself instead of `box-none` — is also caught, because the
compiler's `none` variant pushes `> * { pointer-events: none }` onto the dismiss button and
`coach-marks.spec.ts:179-182` goes red.

**Q7 — what is now possible that nothing checks.** The card is visually opaque and, over most of its area,
not there for touch. A tap the user aims at the hint's words now activates whatever is beneath — on
Progress that is the trajectory card's What-If field and the Snowball/avalanche toggle, which writes
`store.payoffStrategy`. The previous pass filed this residual against `box-none`; widening the transparent
region from the padding ring to the whole sentence **makes it larger**, and nothing in the repo notices.
`DEBT_3.5_DEVICE_QA_CHECKLIST.md:600-602` (§12.9.3) tests the opposite direction — tapping the control the
hint points at — and would pass either way.

---

## D-5 — the two docblock rewrites (`CoachMarkLayer.tsx:136-165`, `:235-238`)

### Verdict: `SOUND-UNPINNED`

**The corrected geometry is accurate.** `:143-145` now says the 402×874 figures describe the era when
`trajectory-scrub` wrapped the whole card, and that the subject is now the scrub view inside
`TrajectoryChart`. Verified: the target is declared at `TrajectoryChart.tsx:391` around the fixed
`style={{ height: H }}` box at `:402`, not around the `Card`. The same correction lands at
`progress.tsx:116-122` and `coach-mark-neighbour.spec.ts:14-19`. The identical *uncorrected* present-tense
claim survives at `tutorialTargets.tsx:74-77` — *"the `trajectory-scrub` subject starts at y≈570 …
so a 144 pt callout has no position on that screen that covers nothing"* — so the sweep is one file short.

**The duplicate docblock deletion is a real improvement and is complete.** The 22-line copy that stood in
the render body is gone; `:235-238` is the only remaining note there and it points at the live copy.

**Q4 — this walks into the file's own documented convention, and the gate cannot see it.**
`scripts/check-comment-convention.ts:9-13` ([D17] half 1) forbids *"meta-commentary about which earlier
COMMENT was wrong"* and states the remedy: *"correcting a false comment means DELETING it, not annotating
it."* This diff annotates in at least four places — `CoachMarkLayer.tsx:179-180` (*"The comment below /
claimed the measured height …"*), `:235-238` (*"A 22-line copy … stood here"*),
`coach-marks.spec.ts:230-231` (*"The earlier docstring claimed the reverse"*), and
`coach-mark-neighbour.spec.ts:48` (*"This comment said the opposite and justified the wait with it"*).
The gate is **line-based** (`check-comment-convention.ts:141-146` tests each comment line against
`META`), and each of these splits the trigger phrase across two lines or uses a wording outside the
regex menu (`docstring`, `said the opposite`). I ran the `META` pattern set over all five files with
`grep -nEi` and got **zero hits** — the gate stays green while the class it names is present.
This is a reach gap in an existing gate, not a new gate, so it is recorded here rather than verdicted;
the gate's own docstring at `:22-24` already says it catches forms rather than the class.

**Q7 — a cross-reference the diff broke without touching it.** `progress.tsx:153` still reads
*"`coach-marks.spec.ts:117` caught exactly that, measuring mid-glide"*. Inserting 96 lines at
`coach-marks.spec.ts:95` moved that block: line 117 is now `await openDebt(page);` inside the new hit-test,
and the block it meant is at `:203-244`. `CoachMarkLayer.tsx:278` had the same problem and was fixed by
deleting the line number; the `progress.tsx` copy was missed.

---

## D-6 — the scroll host gated on focus (`progress.tsx:147-159`)

### Verdict: `SOUND-UNPINNED`

**The premise the fix rests on is true.** `apps/rn/src/app/(tabs)/_layout.tsx:56` renders `<Tabs>` with no
`unmountOnBlur` / `freezeOnBlur` (`grep -n "unmountOnBlur\|freezeOnBlur" src/app/\(tabs\)/_layout.tsx` is
empty), so the effect cleanup at `:158` genuinely never ran and Progress stayed the registered host
app-wide. `useIsFocused` is exported by `expo-router`
(`node_modules/expo-router/build/exports.d.ts:20` → react-navigation), and its initial state is
`navigation.isFocused()`, so the very first render on `/progress` registers rather than skipping a frame.

**Q1 — nothing the site did before is lost.** The registered callback body is byte-identical (`:150-156`),
including `animated: false` and the absolute-offset arithmetic against `offsetRef`, which `onScroll`
still feeds at `:236-237`. `targets` remains in the deps. The cleanup still nulls the slot.

**Q4 — it does not put state on the layout path.** `registerScrollHost` is a ref write
(`tutorialTargets.tsx:176-178`), which is what `tutorialTargets.tsx:87-88` requires. `useIsFocused` is a
React state hook, but it changes once per navigation, not once per layout, which is the same exemption
`activeId` is granted at `tutorialTargets.tsx:60-63`.

**Q1 (b) — one preserved-behaviour wrinkle.** The cleanup at `:158` runs unconditionally, including on the
pass where the body early-returned at `:149`. Harmless today because Progress is the only registrant, but
it means a blurred Progress can null a slot it never wrote — the single-slot last-writer-wins hazard the
previous pass named is unchanged, and this makes it slightly easier to trip if a second screen ever
registers.

**Q2 — platform.** `useIsFocused` behaves the same on react-native-web and iOS here; `use-coach-mark.ts:31`
already depends on it for `trajectory-scrub`, and `coach-mark-neighbour.spec.ts` passing at all is evidence
that `isFocused` is `true` on a direct `page.goto('/progress')`. No timezone, locale or theme surface.

**Q5/Q6 — nothing pins the fix, only its non-regression.** `coach-mark-neighbour.spec.ts:34` proves the
host is still registered *while focused*. **Missing test:** nothing asserts the host is released on blur —
i.e. that a mark raised elsewhere no longer scrolls a backgrounded Progress. The construction is
straightforward on web (visit `/progress`, navigate to `/money`, open a debt, read the Progress scroller's
offset) and does not exist.

**How D-2 and D-6 divide the same bug.** They are complementary, not redundant, and it is worth stating
which covers what: D-2 stops the *root* layer's duplicate `requestReveal` while a sheet is up; D-6 is the
only thing stopping the *nested* layer's call, because the nested layer carries no such guard
(`CoachMarkLayer.tsx:176` is `!nested && …`) and would otherwise still find Progress in the global slot.
Remove either one and the reported symptom returns in halved form, and nothing would say so.

---

## D-7 — re-measure the subject when `skiaReady` flips (`TrajectoryChart.tsx:161`, `:174-177`)

### Verdict: `DEAD`

**On iOS the dependency is a compile-time constant, so this effect fires once at mount and never again.**
`apps/rn/src/utils/skia-ready.ts:12-13` is the native resolution of `useSkiaReady` and its whole body is
`return true;`. The `.web.ts` file (`:43-95`) is the only one that ever transitions. The docblock at
`TrajectoryChart.tsx:431-434` states this in the file itself: *"On native `useSkiaReady` is a constant
`true` and this compiles away to nothing."* **The re-measure the comment at `:162-173` promises therefore
reaches nobody on the platform this app ships first**, and the overlap it is filed against — a device
re-shoot, `.11.8` — is a device question.

**On web it fires, and it cannot change the outcome.** `invalidate` → `subscribe` →
`CoachMarkLayer.tsx:105` → `measure` re-reads the subject's window rect. For that to move the callout, the
subject's rect must change. It does not:

- The subject is the fixed `style={{ height: H }}` box at `TrajectoryChart.tsx:402` — height is a
  constant, and its width comes from the card, not from `skiaReady`.
- Everything gated on `skiaReady` inside it (`:437-520`) is absolutely positioned within that box.
- Everything gated on `skiaReady` outside it — the footer (`:525-529`) and the legend (`:531`) — is
  **below** the `</TutorialTarget>` at `:524`.
- Nothing above it moves either. `grep -rn "useSkiaReady" src` returns exactly one consumer, this file.
  The cards above the trajectory card on Progress — the hero ring and `CashFlowSection` (`progress.tsx:282`,
  ahead of `TrajectoryChart` at `:289`) — draw through `JourneyRingCanvas.web.tsx:15` and
  `CashRunwayCanvas.web.tsx:19`, whose Suspense fallback is a `ChartSkeleton` given the *same* `width` /
  `height` / `size` as the real canvas. No reflow.

So the second firing re-measures an unmoved subject and produces an identical rect. **The stated defect —
"the callout is placed under the subject, i.e. over the region that grew" — is untouched**, because the
region that grew is below the subject and the callout's `top` is derived from the subject
(`CoachMarkLayer.tsx:229`, `:233`). The comment at `TrajectoryChart.tsx:164-165` says outright that *"the
subject does not move"*; a re-measure of something that does not move is a no-op, and the two halves of the
comment contradict each other.

**Q4/Q7 — it is not inert, though: `invalidate` is also the SHOW trigger, and this fires it from mount.**
`tutorialTargets.tsx:153-156` adds the id to the `laidOut` replay set and notifies every listener, and one
of those listeners is `use-coach-mark.ts:74-79`, which calls `coachMarks.show(id)`. `tutorialTargets.tsx:65-67`
records that second consumer explicitly. So this effect now offers `trajectory-scrub` from a **mount
effect** rather than from a layout event, and records the subject as *laid out* in the replay set before any
layout has happened — which is the exact confusion `use-coach-mark.ts:11-20` was written to remove
(*"a mark asked for too early silently never appears"*). It is survivable here only because the subject is
a fixed-height box that measures non-zero immediately; it is not survivable in general, and nothing states
the dependency. Nothing in the repo would notice.

**Q5/Q6 — nothing pins any of it.** No assertion anywhere observes a re-measure. `coach-mark-neighbour.spec.ts`
would pass identically with `:174-177` deleted.

---

## D-8 — the new hit-test spec (`coach-marks.spec.ts:99-183`)

### Verdict: `SOUND`

**Q5 — name the assertion and what it measures.** `expect(hit.sentence!.insideCallout).toBe(false)`
(`:171-174`) measures *which element `document.elementFromPoint` returns at the centre of the callout's
`[role="alert"]` wrapper*. That is the property the change asserts, not a proxy for it.

- **Would it fail on the defect it pins?** Yes. Deleting `CoachMarkLayer.tsx:329` restores the wrapper to
  `pointer-events: auto` via the parent's `box-none > *` rule, `elementFromPoint` returns the wrapper (or
  a `Text` inside it), `closest('[data-testid="coach-mark"]')` matches, red. See D-4 for the compiler
  rules this rests on.
- **Would the naive over-fix pass it?** No. Moving to `pointerEvents="none"` on the card itself pushes
  `pointer-events: none` onto the dismiss button and `:179-182` goes red.
- **Vacuity: guarded, and guarded correctly.** `hitSomething` (`:155`, asserted at `:167-170`) is the
  positive control the brief asks for: `elementFromPoint` returns `null` outside the viewport and
  `null?.closest()` is falsy, so `insideCallout === false` is also true of a callout nobody can reach.
  Two independent guards cover it — the DOM-presence assertion at `:166` and `hitSomething` at `:168` —
  plus `toBeInViewport()` at `:130-131`.
- **Q3 — the harness contract is respected.** `getByTestId` and the raw
  `[data-testid="…"]` selectors agree because RNW writes `testID` to `data-testid`
  (`react-native-web/dist/modules/createDOMProps/index.js:831-832`) and no `testIdAttribute` override
  exists in `apps/rn/playwright.config.ts`. `accessibilityRole="alert"` survives to `role="alert"`:
  `alert` is absent from both `accessibilityRoleToWebRole` and `roleComponents`
  (`.../AccessibilityUtil/propsToAriaRole.js`, `propsToAccessibilityComponent.js`), so it passes through
  onto a `div`. Measuring and hit-testing inside one `page.evaluate` (`:142-164`) does remove the
  two-round-trip race the comment describes.
- **Q6 — it is in the aggregate run.** `apps/rn/playwright.config.ts:19` is `testDir: './tests/e2e'`, and
  `package.json:17` (`test:e2e:rn`) is inside `validate:release:rn` (`:47`).

### Two claims in its own docblocks that the code does not support

**① The reveal scroll cannot be what moves the callout in this flow.** `:126` (*"while the reveal scroll
settles"*) and `:136-137` (*"**The reveal scroll settles in that window**"*) both attribute the
instability to `requestReveal`. This test runs on the debt sheet reached from `/money` (`openDebt`,
`:18-22`). The only registrant of a scroll host is `progress.tsx:150`, which now requires
`isFocused` — and Progress is neither focused nor necessarily mounted here — so
`tutorialTargets.tsx:180` returns `false` and **no scroll ever happens**. What actually moves the callout
is the sheet's entrance spring plus the `remeasureOn={settled}` re-measure (`FormSheet.tsx:192`,
`use-sheet-presentation.ts:46-57`). The assertions are right; the mechanism named for them is not, and it
is the mechanism a later reader will reason from.

**② The file now contains two comments that cannot both be true.** `:35-37` states, as a pinned
measurement, that in this flow *"the callout lands at y≈1266 in an 874pt viewport — 392pt below the
fold"* and that Playwright *"cannot scroll an absolutely-positioned layer into view"*. `:130` now asserts
`toBeInViewport()` on that same callout in a 956pt viewport (`:14`). The older note predates
`remeasureOn` (4.1.4c) and is very likely stale, but **the diff asserts against it without retiring it**.
⚠️ **Could not determine without running the suite** whether `toBeInViewport()` holds; if the older note is
still accurate the new test does not pass at all. Either way one of the two must go.

**Q2 — scope is honestly stated but the filing did not happen.** `:112-113` says the iOS half is
*"Web-only by construction … → P6.14 row."* No such row exists: `DEBT_3.5_DEVICE_QA_CHECKLIST.md` is not
in this diff (`git diff 3dc3c22..4877d90 --stat`), its §12.9.3 (`:600-602`) tests tapping *the control the
hint points at* — the shape this very test's docblock argues is the wrong instrument (`:108-110`) — and
`grep -n "eat taps\|pointerEvents" docs/DEBT_ELEVATION_PLAN.md` returns nothing. **A comment that tells the
reader something was filed, which was not.**

---

## D-9 — the two spec comment corrections (`coach-marks.spec.ts:228-234`, `coach-mark-neighbour.spec.ts:14-19` and `:47-51`)

### Verdict: `SOUND-UNPINNED`

**Both corrections are true.** The predicate claim at `coach-marks.spec.ts:228-231` is right: for the
overlap computed at `:238`, `calloutBottom <= subjectTop` implies zero overlap and the converse does not
hold, so the swap made in `.7.3` was weaker on the predicate and correct on the property the describe
block names (`:200`). The neighbour spec's correction at `:47-51` is right too — `progress.tsx:155` passes
`animated: false`, and what the 1,200 ms actually covers is `onScroll` → `invalidate`
(`progress.tsx:241`) → `measure` (up to `MEASURE_TIMEOUT_MS = 500`, `tutorialTargets.tsx:47`) → re-render.
No assertion changed in either file, so nothing about coverage moved.

**Q4 — the correction style walks into [D17], as in D-5.** `scripts/check-comment-convention.ts:9-13`
says a false comment is *deleted*, not annotated; `coach-mark-neighbour.spec.ts:48` (*"This comment said
the opposite and justified the wait with it"*) and `coach-marks.spec.ts:230-231` (*"The earlier docstring
claimed the reverse"*) are annotations. Both slip past the gate's `META` list — verified by running the
pattern set over all five files with `grep -nEi`, zero hits.

**Q7 — the wait itself is the thing nobody has revisited.** `coach-mark-neighbour.spec.ts:52` is still a
fixed `waitForTimeout(1_200)`, and this repo has a stated position on that shape:
`ChartSkeleton.tsx:17-20` — *"The matrix used to wait `1_800` ms and hope. This is the signal that number
was guessing at."* The rewritten comment explains the number instead of replacing it with a state the
harness can observe (the callout's `top` reaching a stable value, or the scroller's offset changing). Not
a defect; an unbanked opportunity, and the D-3 change lengthens what the number has to cover.

---

## Tally

| verdict | count |
|---|---|
| `SOUND` | 2 |
| `SOUND-UNPINNED` | 6 |
| `DEAD` | 1 |
| `DEFECT` / `REGRESSION` / `WEAK-TEST` / `UNREACHABLE-GATE` | 0 |

### Severity order

1. **`DEAD` — `TrajectoryChart.tsx:174-177`.** The `skiaReady` dependency is a literal `true` on iOS
   (`utils/skia-ready.ts:12-13`), so the re-measure never re-fires on the shipping-first platform; on web
   it re-fires and returns an identical rect, because every `skiaReady`-gated node is either absolutely
   positioned inside the fixed-height subject (`TrajectoryChart.tsx:402`, `:437-520`) or below it
   (`:525-531`), and nothing above it reflows. The comment at `:164-165` asserts *"the subject does not
   move"* and then offers a re-measure as the fix — the two halves contradict.
2. **Side effect at a site that documents the opposite — same hunk.** `invalidate` is also the
   coach-mark SHOW trigger (`tutorialTargets.tsx:65-67` → `use-coach-mark.ts:74-79`), so the mount run of
   this effect offers `trajectory-scrub` from mount rather than from layout and adds it to the `laidOut`
   replay set before it has laid out — the exact confusion `use-coach-mark.ts:11-20` exists to remove.
   Survivable only because the subject is a fixed-height box. Unstated, unchecked.
3. **A promised device row that was never filed** — `coach-marks.spec.ts:112-113` (*"→ P6.14 row"*).
   `DEBT_3.5_DEVICE_QA_CHECKLIST.md` is untouched by this diff and its §12.9.3 (`:600-602`) tests a
   different pixel; no matching row exists in `docs/DEBT_ELEVATION_PLAN.md`.
4. **Two comments in one file that cannot both be true** — `coach-marks.spec.ts:35-37` (callout 392 pt
   below the fold in this flow) versus `:130` (`toBeInViewport()` on that callout). Undetermined without
   running the suite; if the older note still holds, the new test does not pass.
5. **A misattributed mechanism in the new test's own docblocks** — `coach-marks.spec.ts:126` and
   `:136-137` credit "the reveal scroll", which cannot fire in this flow (`tutorialTargets.tsx:180`
   returns `false` with no host registered). The real mover is the sheet spring plus
   `remeasureOn={settled}` (`FormSheet.tsx:192`).
6. **D-3's guard fixes the first mark only.** `calloutH` is never reset across marks
   (`CoachMarkLayer.tsx:49`), so mark B latches at `:199` using mark A's measured height. Reachable on the
   root layer, which never unmounts.
7. **A cross-reference broken by the insertion** — `progress.tsx:153` cites
   `coach-marks.spec.ts:117`, which the 96 new lines moved; that line is now inside the new hit-test.
8. **A stale present-tense geometry claim the sweep missed** — `tutorialTargets.tsx:74-77` still states
   the pre-`.7.3` subject figures that `CoachMarkLayer.tsx:143-145`, `progress.tsx:121-123` and
   `coach-mark-neighbour.spec.ts:18-19` were all corrected to disown.
9. **[D17]'s annotate-vs-delete rule is broken four times and the gate cannot see it** —
   `CoachMarkLayer.tsx:179-180`, `:235-238`, `coach-marks.spec.ts:230-231`,
   `coach-mark-neighbour.spec.ts:48`. `scripts/check-comment-convention.ts:141-146` matches per line, and
   each of these splits the trigger across lines or uses wording outside the `META` menu.
10. **Widened flake window** — `coach-marks.spec.ts:216-217` still takes `boundingBox()` with no settle
    wait, and D-3 adds a commit between "visible" and "scrolled".

### What I could not determine

- Whether `coach-marks.spec.ts:130`'s `toBeInViewport()` passes. It needs a run, and the file's own
  older measurement says it should not.
- Anything about iOS: `pointerEvents="none"` on the sentence, VoiceOver's treatment of it, and the
  §12.9-class "feel" questions are all device-owed. D-4's reasoning about `RCTView`'s `hitTest:` is read
  from the framework's semantics, not measured here.
