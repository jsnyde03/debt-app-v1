# Cluster E — the coach-mark and tutorial reveal

**Subject.** `git diff 8e4540a..3dc3c22` over:
`apps/rn/src/components/plan/CoachMarkLayer.tsx` · `apps/rn/src/store/tutorialTargets.tsx` ·
`apps/rn/tests/e2e/coach-mark-neighbour.spec.ts` · `apps/rn/tests/e2e/coach-marks.spec.ts`.

**Read in the site, not the hunk.** Also read in full: `apps/rn/src/app/(tabs)/progress.tsx` (the only
`registerScrollHost` caller), `apps/rn/src/components/screen.tsx` (the scroller the reveal drives),
`apps/rn/src/components/ui/FormSheet.tsx:192` (the second, *nested* `CoachMarkLayer`),
`apps/rn/src/hooks/use-coach-mark.ts`, `apps/rn/src/store/coachMarkCopy.ts`,
`apps/rn/src/components/payoff/TrajectoryChart.tsx:364` (where the subject now lives),
`apps/rn/src/components/progress/CashFlowSection.tsx:68`, `apps/rn/.maestro/08-coach-marks.yaml`,
`apps/rn/tests/e2e/strategy-compare.spec.ts`, `apps/rn/tests/e2e/helpers/seed.ts`, and
`react-native-web`'s `pointerEvents` compiler
(`apps/rn/node_modules/react-native-web/dist/exports/StyleSheet/compiler/index.js:359`).

Written incrementally, one section per hunk-group, in the order the hunks appear.

---
## A. `CoachMarkLayer` — the scroll-driven re-measure effect (`CoachMarkLayer.tsx:84-110`)

**What it adds.** A second subscription to `targets.subscribe`, so that an `invalidate(id)` raised by a
scroll re-measures the subject and moves the callout with it.
`progress.tsx:219-222` is the new producer (`onScroll` → `targets?.invalidate('trajectory-scrub')`, at
`scrollEventThrottle={16}`, `screen.tsx:98`).

### Verdict: `DEFECT`

**The `cancelled` latch is never armed, so a stale measurement can overwrite a newer one.**

```ts
let inFlight = false;
let cancelled = false;                    // CoachMarkLayer.tsx:101
return targets.subscribe((id) => { … });  // :102  ← the cleanup is the unsubscribe, nothing sets cancelled
```

`cancelled` is declared at `CoachMarkLayer.tsx:101`, read at `:103` and `:107`, and **assigned `true`
nowhere in the file.** The effect's cleanup is `subscribe`'s unsubscribe (`:102`, returning
`tutorialTargets.tsx:162-164`), not a closure that flips the flag. Contrast the effect immediately above
it, which does it correctly: `CoachMarkLayer.tsx:79-81` returns `() => { cancelled = true; }`. This is that
pattern copied with the arming line dropped.

**The input that breaks it.** `measure` resolves up to `MEASURE_TIMEOUT_MS = 500` after it is asked
(`tutorialTargets.tsx:47,140`). Mark A is active on Progress; the user opens the debt sheet; `4.1.5.4`
dismisses A (`use-coach-mark.ts:60-65`) and `payoff-schedule` becomes active
(`DebtSheet.tsx:133`). The effect re-runs, unsubscribing A's listener — but A's in-flight
`measure` promise is still live, and when it settles `!cancelled && r` is **true**, so it calls
`setRect(A's rect)` (`:107`) after B's rect was already installed by `:77`. The callout for B is then drawn
at A's coordinates. Nothing re-measures until the next `invalidate` for B, and a static sheet raises none —
so the wrong placement persists for the life of the mark.

The same window exists for the ordinary case of `remeasureOn` flipping (`:82`), where the first effect
re-measures and this one's older resolution can land on top of it.

**Nothing would catch it.** No spec exercises a mark-to-mark handover; `coach-marks.spec.ts:44-97` opens one
sheet mark at a time, and `coach-mark-neighbour.spec.ts` has a single mark. There is also no unit test for
`CoachMarkLayer` (no file under `apps/rn/tests` names it).

### Secondary — preserved properties (Q1)

- The pre-existing single-shot measurement (`:61-82`) is untouched and still runs. ✅
- The `inFlight` latch does bound the 16 ms scroll stream to one native round-trip at a time (`:100,103`). ✅
- ⚠️ **No `nested` / `hosts` guard.** This effect runs in *both* mounted layers — the root
  (`_layout.tsx:357`) and the sheet's (`FormSheet.tsx:192`) — including the one that has stood down and
  draws nothing (`CoachMarkLayer.tsx:179`). The file's own verdict effect *does* account for that state
  (`:117`, `stoodDownFor(hosts=…)`). With a sheet open this doubles every measurement; see also group B,
  where the missing guard is not merely wasteful.

### Residual (Q7)

While a mark is up, every 16 ms scroll frame now runs `measureInWindow` and a `setRect` at the **app root**
(`_layout.tsx:357`), and `setRect` always installs a fresh object (`:107`), so each one re-renders the root
overlay. That is the price of tracking and is probably right, but nothing measures it, and the previous
behaviour (one measurement per `active`) cost nothing. On react-native-web the same path runs on a scroll
handler that is not passive.

---

## B. `CoachMarkLayer` — the reveal request (`CoachMarkLayer.tsx:125-176`, `:327-328`)

**What it adds.** When neither placement is clean, ask the screen to scroll so the below-branch fits:
`need = (calloutH || ESTIMATED_CALLOUT_H) + ABOVE_GAP + 16` (`:164`), a one-shot latch keyed on the active
mark (`:51,154,166`), and `needed = belowY - (winH - insets.bottom - need) + REVEAL_MARGIN` (`:174`) handed
to `targets.requestReveal` (`:175`). `REVEAL_MARGIN = 24` (`:328`).

The arithmetic is right at the default text size: with `calloutH = 144`, `need = 170`, and after scrolling
by `needed` the gap below the subject is `170 + 24 = 194`, which clears both the effect's own threshold
(170) and the render body's `roomBelow` threshold (`calloutH + ABOVE_GAP = 154`, `:199`) rather than tying
them. The move out of the render body is correct and honours `:112-114` and `:139-143`.

### Verdict: `DEFECT` (×2)

#### B1 — the reveal is *always* computed from the 144 pt estimate, and the latch prevents the correction

`calloutH` is `useState(0)` (`:49`) and is only ever written from the card's `onLayout` (`:271-274`). The
callout does not exist until `rect` is non-null (`:180`), and `rect` arrives asynchronously from
`measure` (`:70-78`). So on the first commit in which the callout renders, this effect runs with
`calloutH === 0` and takes `ESTIMATED_CALLOUT_H` (`:164`) — on iOS because layout events are dispatched
after the commit's effects, on react-native-web because RNW's `onLayout` is a `ResizeObserver` callback.
The effect then writes the latch (`:166`), so when `calloutH` lands and the effect re-runs on its own
`calloutH` dependency (`:176`), line `:154` returns immediately.

**The measured height therefore never reaches the scroll request.** The comment at `:156-163` — *"THE
MEASURED HEIGHT, NOT THE 140"* — describes an intent the control flow does not deliver; it is invisible only
because `ESTIMATED_CALLOUT_H` happens to equal the measured 144 at 402 pt and the default text size.

**The environments that break it:**

- **iOS Dynamic Type.** Neither `Text` in the callout sets `maxFontSizeMultiplier` or `allowFontScaling`
  (`:296-297`), unlike e.g. `progress.tsx:53` which caps the hero at 1.3. At the accessibility text sizes
  the two-line body grows well past 144, the scroll is short by the difference, `roomBelow` (which *does*
  use the measured height, `:199`) then reads false, the above-branch fires — and the callout is back on the
  cash-flow card. ⚠️ **react-native-web pins `fontScale` to 1, so `coach-mark-neighbour.spec.ts` structurally
  cannot see this.**
- **A 320 pt phone.** `ESTIMATED_CALLOUT_H`'s own docstring says 144 is *"the TALLER of the two observed
  wraps"* (`:319-323`) — observed at 402 pt and 1194 pt. At 320 pt the body wraps to a third line and the
  estimate is short again. `progress.tsx:50` already records that the 320 pt case is device-owed.
- **Any copy edit.** `COACH_MARKS['trajectory-scrub'].body` (`coachMarkCopy.ts:41-42`) re-rolls the wrap,
  which is precisely the failure mode the `132 → measured` fix was written to end.

Keying the latch on `${active}:${calloutH}` (one correction, still not a loop) would close it; keying it on
`active` alone re-creates the class the item is about.

#### B2 — the stood-down ROOT layer also requests a scroll, on a different screen

The effect has no `nested` / `hosts` guard, and it is declared **above** the `if (!nested && hosts > 0)
return null` (`:179`). So when a sheet is open, both layers run it:

- `_layout.tsx:357` — the root layer, which draws nothing in this state (`:117` records it as
  `stoodDownFor(hosts=…)`);
- `FormSheet.tsx:192` — the nested layer, which draws.

Both hold their own `revealAskedFor` ref, both measure the same registered node, both compute the same
`needed`, and both call `requestReveal` — so the registered scroller moves **twice**.

Worse, the only scroller ever registered is Progress's (`progress.tsx:131-139`), and the registry holds one
global slot (`tutorialTargets.tsx:175`). The live sheet mark is `payoff-schedule`, offered on the **edit**
sheet (`DebtSheet.tsx:133`) with its subject registered at `DebtSheet.tsx:290`, reached from Money. Tabs are
never unmounted (`apps/rn/src/app/(tabs)/_layout.tsx` sets no `unmountOnBlur`/`freezeOnBlur`), so once a
user has visited Progress, `scrollHost.current` stays pointed at Progress's `ScrollView` for the rest of the
session. Opening a debt for edit therefore **scrolls the Progress tab underneath the sheet**, twice, by an
amount computed for a sheet — while the sheet's own callout does not move at all and the latch is spent.

The layer already knows how to stand down; `:117` does it three lines above. This effect does not.

### Verdict on the surrounding contract: `SOUND-UNPINNED`

- `requestReveal` returns a boolean documented at `tutorialTargets.tsx:84-85` as the caller's signal to keep
  its existing placement — and the caller discards it (`CoachMarkLayer.tsx:175`). The latch is written at
  `:166` *before* the call, so a mark that asked while no host was registered never asks again even if a
  host registers a frame later. Harmless for `trajectory-scrub` (the host registers in a mount effect,
  `progress.tsx:130`), unpinned for anything else.
- `scrollTo` **clamps silently**. If the content cannot scroll by `needed`, `requestReveal` still returns
  `true`, the latch is still spent, and the overlap survives with nothing reporting it. This is exactly the
  arithmetic that forced the subject to move inside `TrajectoryChart.tsx:364` (`needed 263` vs
  `maxScroll 196`), so it is a known-live failure mode; the only thing standing between it and a regression
  is one seeded scenario at one viewport (group F). Nothing asserts "the reveal achieved the reveal."
- `revealAskedFor` is never cleared on `active → null` (`:154`), so a mark re-offered inside one mount of
  the layer (More → *Show feature tips again*, `more.tsx`) gets no second reveal. Low impact — the re-offer
  needs a re-mount of the subject anyway (`use-coach-mark.ts:73-79`).

### Residual (Q7) — the page now moves under the user's finger

`requestReveal` scrolls **not animated** and unconditionally (`progress.tsx:126-134`), at an arbitrary moment
after first paint, on a screen the user may already be touching. The author's own note at
`strategy-compare.spec.ts:29-38` records the measured consequence: the strategy toggle moved between
Playwright's actionability check and the click. The same is true of a finger. The controls that now sit in
that window are the What-If field and the Snowball/avalanche toggle inside `TrajectoryChart` — the toggle
writes `payoffStrategy`, i.e. a real change to the user's plan from a tap they aimed elsewhere.

Progress specs that seed **no** `coachMarksSeen` and therefore now take an unannounced scroll on load:
`a11y-axe.spec.ts`, `earlyjourney.spec.ts`, `on-plan-streak.spec.ts`, `trajectory-domain.spec.ts`,
`trajectory-interactivity.spec.ts`, `vis5-cone.spec.ts`, `probe-mark-ipad-rail.spec.ts`,
`probe-mark-route-push.spec.ts`. `trajectory-interactivity.spec.ts:51-69` drives a mouse drag from a
`boundingBox()` — it happens to be safe because it waits 2 s first (`:35`), not because anything guarantees
the scroll has finished.

---

## C. `CoachMarkLayer` — the `roomBelow` threshold, and the orphaned comment (`:196-223`)

**What changed.** `const roomBelow = winH - below - insets.bottom > 140` became
`… > (calloutH || ESTIMATED_CALLOUT_H) + ABOVE_GAP` (`:199`).

### Verdict: `SOUND-UNPINNED`

Correct in itself, and unlike group B it *does* pick up the measured height, because the render body
re-evaluates on every render and carries no latch. `140 → 154` at the default size, so the below-branch is
now strictly harder to satisfy than before.

**What it changes that nothing pins.** Every mark's placement decision moved by 14 pt. The only mark whose
placement is asserted anywhere is `trajectory-scrub` on web (`coach-marks.spec.ts:117`,
`coach-mark-neighbour.spec.ts:32`). The sheet mark `payoff-schedule` can flip from below to above with this
change and nothing would report it: `coach-marks.spec.ts:35-37` records that web puts the callout at
y≈1266 in an 874 pt viewport so placement is unanswerable there, and `.maestro/08-coach-marks.yaml:167-171`
asserts only that it is visible. Missing test: a device/frame check of the sheet mark's placement — the
capture-ref frame `capture-ref/phase35/<theme>/coach-payoff-schedule.png` is the existing instrument and is
not re-pinned by this diff.

**Minor.** `ABOVE_GAP` is documented as *"the breathing room between the callout's bottom edge and the
subject it points at"* (`:325-326`) and is now also used as a bottom-of-screen margin (`:199`) and as a
component of `need` (`:164`). One constant, three meanings; the below-branch's own gap is still the
hardcoded `12` at `:196`.

### Verdict on `:202-223`: documentation defect

`CoachMarkLayer.tsx:202-223` is a 22-line docblock **duplicated almost verbatim** from `:125-151` and left
in the render body after the code it describes moved into the effect. It sits between the `top` computation
and the `4.1.5.5` horizontal-anchor comment and describes behaviour ("*Fires at most once per mark*",
"*Returns false where no scrolling host is registered*") that happens nowhere near it. This file's stated
convention is that a stale claim about why something is safe is worse than no claim
(`tutorialTargets.tsx:17-22`); a reader auditing the render body for the latch will not find it here.

---

## D. `CoachMarkLayer` — `pointerEvents="box-none"` on the callout card (`:252-268`)

**The claim** (`:253-267`): *"the card was eating taps meant for the app… `box-none` keeps the card visible
and non-interactive while its 'Got it' `Pressable` — a child, so unaffected — stays tappable."*

### Verdict: `DEFECT` — it opens the padding ring only; the card still eats most taps, on both platforms

`box-none` exempts **the card itself** from hit-testing and leaves **its subviews** as targets. The card has
two direct children and between them they cover almost all of its area:

- `CoachMarkLayer.tsx:295` — `<View accessible accessibilityRole="alert">` wrapping the title and body;
- `CoachMarkLayer.tsx:299` — the "Got it" `Pressable`, `minHeight: 44` (`:346`).

What is left to pass through is the `padding: spacing.base` ring and the `gap: spacing.xxs` (`:339-344`).

- **react-native-web**: the compiler emits `pointer-events: none !important` for the card **plus a
  `selector > *` rule setting `pointer-events: auto` on its direct children**
  (`apps/rn/node_modules/react-native-web/dist/exports/StyleSheet/compiler/index.js:359-364`). The alert
  `div` at `:295` is a direct child, so it gets `auto` and still intercepts.
- **iOS**: a plain `View` is `userInteractionEnabled`, so hit-testing returns it and the touch is consumed
  by a component that has no responder — RN does not re-dispatch a consumed touch to the view beneath. That
  is the whole reason `box-none` exists as a prop.

So the promise quoted from the file's own opening paragraph — *"the control stays live underneath"* — is
still false over the sentence, which is most of the callout. Only the border ring is now live.

**Prose/code disagreement worth recording.** `:260-263` says `strategy-compare.spec.ts` timed out on a
toggle underneath the callout and that `box-none` is what cured it. The shipped spec cures it a different
way: `strategy-compare.spec.ts:39-42` now seeds
`coachMarksSeen: ['payoff-schedule','debt-row-actions','trajectory-scrub']`, so that spec no longer renders
a coach mark at all, and its own comment (`:29-37`) calls the mis-tap *"a REAL residual… → P6.14"*. Per the
brief, the code wins: the mark is gone from that spec, which is consistent with `box-none` **not** having
made the underlying toggle clickable.

### Nothing pins it — the one instrument that caught it was seeded past

`strategy-compare.spec.ts` was the only spec that drove a control under a live callout, and it no longer
meets one. The remaining candidate, `coach-marks.spec.ts:89-97` (*"the marked control stays live — a hint is
not a modal"*), clicks `debt-view-schedule`, which is the mark's **own subject**, and the file records at
`:35-37` that on web that callout lands ~392 pt below the fold — so it never overlaps the control and the
test passes with `pointerEvents` deleted. `.maestro/08-coach-marks.yaml:136-144` proves the same property
for the *row-actions* mark on Money, where the callout again does not sit on the control it taps
(`Expenses`). **Deleting line `:268` would turn nothing red.**

### Residual (Q7) — a visually opaque card that partially isn't there

Combined with group B's reveal, the callout is now deliberately positioned over the trajectory card's
What-If field and Snowball/avalanche toggle. A tap that lands in the card's padding ring — which reads to
the user as part of the hint — now activates a control they cannot see. The strategy toggle writes
`store.payoffStrategy`, i.e. a change to the user's plan. Nothing in the repo would notice this.

---

## E. `tutorialTargets` — `registerScrollHost` / `requestReveal` (`tutorialTargets.tsx:73-91`, `:171-188`)

### Verdict: `SOUND-UNPINNED`

**Q4 — the file's own rule is honoured.** `subscribe`'s note (`:56-67`) forbids React state on the layout
path; the new host is a `useRef` (`:175`) written through a `useCallback` (`:176-178`), so an ordinary
launch still changes no state. Both callbacks are stable, so adding them to the `useMemo` deps (`:187`)
does not change how often the context value re-identifies. Registration is not on the layout path at all —
it happens once per screen mount (`progress.tsx:128-140`) — so the constraint is met with room to spare.

**Q1 — nothing prior is disturbed.** `register`, `measure`, `invalidate`, `subscribe`, `activeId` are
untouched; the interface grew, and `TargetRegistry` has exactly one implementation (`:96`) and one consumer
of the type (`:192`), so no test double or second provider needs updating.

**Q3 — the contract of the thing it drives.** `progress.tsx:135` uses
`scrollTo({ y: Math.max(0, offsetRef.current + dy), animated: false })` against `Screen`'s documented
`scrollRef`/`onScroll` pair (`screen.tsx:38-45`), and the absolute-offset requirement is respected via
`offsetRef` (`progress.tsx:129`, fed by `onScroll` at `:218-222` with `scrollEventThrottle={16}`,
`screen.tsx:98`). Correct. The unstated half is that `scrollTo` **clamps**: `requestReveal` returns `true`
whether or not the scroll was possible (`:180-182`), so its boolean means "a host exists", not "room was
made" — and the caller documents it as the latter (`:84-85`).

### The single-slot registry is a latent trap

`scrollHost` is one global slot with last-writer-wins and an unconditional `null` on cleanup
(`progress.tsx:139`). Two consequences, neither reachable today because Progress is the only registrant:

1. A second screen registering would silently take ownership; Progress unmounting would then deregister
   **that** screen's host.
2. Because tabs are never unmounted (no `unmountOnBlur`/`freezeOnBlur` in
   `apps/rn/src/app/(tabs)/_layout.tsx`), the slot stays pointed at Progress while the user is anywhere
   else in the app — which is how group B's sheet mark ends up scrolling a background tab. The comment at
   `progress.tsx:137-138` ("*Deregister on unmount, or a backgrounded Progress keeps answering for whatever
   screen is up*") names this hazard exactly and then relies on an unmount that a tab navigator does not
   perform.

A token/id-scoped registration (`registerScrollHost(id, fn)` + `requestReveal(id, dy)` matched against the
active mark's screen) would make the ownership explicit.

### What is missing

There is **no test of any kind** over `tutorialTargets.tsx` — no unit spec anywhere under `apps/rn/tests`
or `packages` references it. The registry's behaviour is observed only through the e2e coach-mark specs, so
`registerScrollHost`/`requestReveal` are pinned exactly as far as group F pins them, and no further.

---

## F. `coach-mark-neighbour.spec.ts` (new, 63 lines)

**What it asserts.** At 402×874 on `/progress`, with `coachMarksSeen: []`
(`coach-mark-neighbour.spec.ts:26-30`): both `coach-mark` and `cash-flow-section` are visible
(`:44-45`), then their bounding boxes' **vertical overlap is exactly 0** (`:56-63`).

### Verdict: `SOUND`

**Q5 — would it have failed on the defect?** Yes. The measured pre-fix state is callout `y415..y559` against
a cash-flow card ending at `y≈560`, i.e. ~144 px of overlap; `overlap` at `:54` computes that directly and
`.toBe(0)` at `:63` fails. The assertion measures the subject (occlusion) rather than a proxy for it, and
`CashFlowSection.tsx:65-67` records that `toBeVisible()` cannot express this because covered content keeps a
non-zero box. Both render barriers are present before the comparison (`:44-45`), which is the
absence-passes-before-render trap closed properly.

**Q6 — registered.** `testDir: './tests/e2e'` (`apps/rn/playwright.config.ts:19`) picks the file up with no
registration step, and `test:e2e:rn` runs inside `validate:release:rn` (root `package.json:17,47`). It can
go red. ✅

### What it cannot see — stated, not held against it

1. **The group-B failure mode is invisible here.** react-native-web pins `fontScale` to 1, so no Dynamic
   Type size is exercised, and the viewport is fixed at 402 pt so the third-line wrap never happens. The
   test is green precisely in the one configuration where `ESTIMATED_CALLOUT_H` equals the measured height.
2. **Vertical overlap only** (`:54`). Correct at this viewport, where both cards are full-width; it would
   not detect a horizontal-only collision on the iPad layout, which is where `4.1.5.5`'s original defect
   lived (`CoachMarkLayer.tsx:225-234`).
3. **Nothing asserts the callout is inside the viewport.** `coach-marks.spec.ts:39-40` records that on RN-web
   `toBeVisible()` is satisfied by a node anywhere in the document, off-screen included. A future change
   that pushed the callout below the fold would give `overlap === 0` and a green test with the hint
   invisible. Today's placement arithmetic (`CoachMarkLayer.tsx:199-200`) keeps it on screen, so this is a
   gap in the guard, not a live failure.
4. **`waitForTimeout(1_200)`** (`:47`) is a fixed sleep rather than a settled-state condition. Harmless here
   because the reveal is `animated: false` (`progress.tsx:135`), and it is the house pattern (49 uses across
   the suite) — but it is also why the test says nothing about the *transient* state, in which the callout
   demonstrably does overlap both its neighbour and its subject (that transient is the reason
   `progress.tsx:132-134` refuses an animated scroll).
5. **One scenario, one viewport.** The fix depends on the page having `needed` px of scroll room and
   `scrollTo` clamping silently otherwise (group B). This spec fixes the content height by seeding
   `scenario()`'s defaults; a portfolio with less content below the fold re-opens the overlap and nothing
   would report it.

---

## G. `coach-marks.spec.ts` — the self-occlusion assertion (`:135-153`)

**What changed.** `expect(calloutBox.y + calloutBox.height).toBeLessThanOrEqual(subjectBox.y)` became a
zero-overlap comparison (`:148-153`).

### Verdict: `SOUND` — with an incorrect claim in its own comment

The new assertion measures the property the describe block names (`:114`, *"the callout does not cover its
own subject"*), and the old one measured a placement that the reveal legitimately inverts. That is the right
correction, and it still fails on the original 132-vs-144 defect: a callout whose bottom lands 12 px inside
the subject yields `overlap = 12`. The comment at `:123-126` about using the subject's own wrapper rather
than the `PAYOFF TRAJECTORY` heading is still accurate — the target moved into `TrajectoryChart.tsx:364` but
kept the id, so `tutorial-target-trajectory-scrub` still resolves (`tutorialTargets.tsx:252`).

**The comment's claim is false.** `:142-144` says the new form is *"Strictly stronger, not looser."* It is
strictly **looser** on this predicate: `calloutBottom <= subjectTop` implies `overlap === 0`, but
`overlap === 0` also admits every callout placed *below* the subject — which is the entire set of layouts
the change was made to accept. The sentence's supporting argument ("above permitted a callout on top of the
cash-flow card") is about a *different* property, now covered by group F, not about this predicate's
strength. Looser is the right call here; the justification recorded next to it is not, and this file's own
convention is that a wrong claim about why something is safe is worse than none
(`tutorialTargets.tsx:17-22`).

### One flake risk

Unlike its new sibling, this test takes the bounding boxes immediately after `toBeVisible()`
(`:122-131`) with no settle wait. Between the reveal scroll and the re-measure that follows it
(`CoachMarkLayer.tsx:98-110`) the callout is at its pre-scroll `top` while the subject has moved up — a
state in which the two *do* overlap. The window is one `measureInWindow` round-trip and is likely below
Playwright's sampling in practice, but the file has no barrier against it, and its sibling
(`coach-mark-neighbour.spec.ts:47`) waits 1.2 s for exactly this reason. If this spec turns flaky in CI,
this is the mechanism.

---

## Tally

| group | site | verdict |
|---|---|---|
| A | `CoachMarkLayer.tsx:84-110` — scroll-driven re-measure | `DEFECT` |
| B | `CoachMarkLayer.tsx:125-176`, `:327-328` — the reveal request | `DEFECT` (×2) |
| C | `CoachMarkLayer.tsx:196-223` — `roomBelow` + orphaned docblock | `SOUND-UNPINNED` |
| D | `CoachMarkLayer.tsx:252-268` — `pointerEvents="box-none"` | `DEFECT` |
| E | `tutorialTargets.tsx:73-91`, `:171-188` — scroll host | `SOUND-UNPINNED` |
| F | `coach-mark-neighbour.spec.ts` (new) | `SOUND` |
| G | `coach-marks.spec.ts:135-153` | `SOUND` |

**3 `DEFECT` · 2 `SOUND-UNPINNED` · 2 `SOUND`.** No `DEAD`, no gate in this cluster, so no
`UNREACHABLE-GATE`; nothing here is behind `qaEnabled()`.

### Severity order

1. **B1** — the reveal scroll is computed from the 144 pt *estimate* and the one-shot latch blocks the
   correction (`CoachMarkLayer.tsx:154,164,166,176`). Breaks at any iOS Dynamic Type size above default, at
   320 pt width, and on the next copy edit. This is the third instance of the class the item exists to
   close, in the one place the fix did not reach.
2. **B2** — the stood-down root layer requests the scroll too (`:152` has no `nested`/`hosts` guard, and
   `:117` three lines above shows the guard this file already uses), so a sheet mark
   (`DebtSheet.tsx:133/290`) scrolls the **Progress** tab twice through the single-slot registry
   (`tutorialTargets.tsx:175`, `progress.tsx:131-139`).
3. **A** — `cancelled` is declared and read but never assigned (`CoachMarkLayer.tsx:101,103,107`), so a
   measurement of the *previous* mark, resolving up to 500 ms late (`tutorialTargets.tsx:47`), overwrites
   the current mark's rect. The effect directly above it does this correctly (`:79-81`).
4. **D** — `box-none` on the card only opens the padding ring; the alert wrapper at `:295` and the
   `Pressable` at `:299` are direct children and remain hit targets on both platforms
   (`react-native-web/.../StyleSheet/compiler/index.js:359-364`). The one spec that could have caught it,
   `strategy-compare.spec.ts`, was in the same diff seeded so it never renders a mark
   (`strategy-compare.spec.ts:39-42`).
5. **Residual, unpinned** — the reveal moves controls under a finger with no settle barrier; the callout is
   now positioned over the What-If field and the Snowball/avalanche toggle, and the padding ring passes taps
   through to them invisibly. `strategy-compare.spec.ts:29-37` files this as a P6.14 row; nothing in the
   repo would notice it happening to a user.
6. **Documentation** — `CoachMarkLayer.tsx:202-223` is a duplicated docblock describing code that is no
   longer there, and `coach-marks.spec.ts:142-144`'s *"strictly stronger, not looser"* is the opposite of
   what the predicate does.

### What I could not determine

- **Whether B2 fires on a real device.** It follows from tab screens never unmounting (no
  `unmountOnBlur`/`freezeOnBlur` in `apps/rn/src/app/(tabs)/_layout.tsx`) plus the single global host slot,
  but the web suite never has Progress mounted while a sheet is open (`coach-marks.spec.ts` navigates
  straight to `/money`), so it is unobservable in the harness. It needs a simulator run: visit Progress,
  then Money → edit a debt, and watch whether the Progress tab has moved on return.
- **The exact callout height under Dynamic Type.** I read the absence of `maxFontSizeMultiplier` on
  `CoachMarkLayer.tsx:296-297` and the two measured wraps recorded at `:187-191`; I did not measure a third.
  The direction is certain, the magnitude is not.
- **iOS hit-testing under Fabric.** My group-D conclusion is from RN's documented `box-none` semantics ("the
  View is never the target of touch events but its subviews can be") rather than from a device run. The
  web half is read directly out of the RNW compiler and is not in doubt.
