# D — discovery (coach marks · tips · onboarding) · the Progress tab · visual craft

**Range verified** `6736a64..c8d54fa`. **Read-only** — `git diff`, `grep`, `sed`, `cat`. **No gate and no
suite was executed**, and **no frame was re-shot**. Where a claim can only be settled on a device, that is
said rather than guessed.

Severity words are the brief's: `blocker` · `major` · `minor`. Job 2 reports **only** `blocker` and `major`.

⚠️ **Rule 2 applied throughout.** Every `.web.ts` / `.web.tsx` fork in `apps/rn/src` was enumerated (22
files) before any craft or layout claim below; the two that bear on this surface are
`JourneyRingCanvas.web.tsx` and `DateField.web.tsx`, and the one that decided P1-5 is `backupFile.web.ts`.

---

## Job 1 — the fixes, re-verified

| # | finding | verdict |
|---|---|---|
| C-A | a sheet-hosted mark outlives its sheet | `CLOSED` |
| C-B | *"Show feature tips again"* cannot re-offer two of three marks | **`PARTIAL` · major** |
| C-C | the once-ever `DREW` record is spendable on a callout nobody saw | `CLOSED` |
| J1-2 | `calloutH`'s reset was keyed on `remeasureOn` too | `CLOSED-UNPINNED` |
| P1-4 | the `COVER NOW` run-on at 40 obligations | `CLOSED` |
| P1-5 | the export sheet's raw JSON face + inverted hierarchy | `CLOSED` |
| P1-1 | the matrix had no frame of the four emotional beats | `CLOSED` *(with a false in-source claim — see the hero section)* |

### C-A — a sheet-hosted mark outlives its sheet — `CLOSED`

**Original finding:** `use-coach-mark`'s stand-down rule fires only on **blur** (`use-coach-mark.ts:62`),
and closing a `FormSheet` *unmounts* the hook rather than blurring the tab underneath — so `active` kept the
id of a subject that no longer existed, the root layer redrew the callout at the vanished row's
coordinates, and `show()` refused every other mark for the rest of the session (`coachMarks.ts:104`).

**What the fix did:** a second, cleanup-only effect — `use-coach-mark.ts:86-92` — that calls
`coachMarks.getState().dismiss()` on unmount when `active === id`. The guard is read **at teardown**, so an
unmount that is not this mark's turn cannot clear somebody else's. Deps `[id]` (`:92`), so it also fires on
an id change, which is correct.

**Preserved?** Yes, and I checked the two ways this shape over-matches.
- *Does it clear a mark that is legitimately up?* The `active === id` read happens inside the cleanup, after
  any `dismiss()`/`show()` that ran earlier in the same commit, so a mark belonging to a different id is
  untouched.
- *Does it race the nested host's teardown?* `FormSheet`'s nested layer decrements `hosts`
  (`CoachMarkLayer.tsx:56-59` → `coachMarks.ts:186-189`) in the same unmount. Both writes are zustand
  `setState` inside one cleanup flush, so React commits **one** re-render with `hosts === 0` *and*
  `active === null` — there is no intermediate frame in which the root layer draws the stale rect and the
  verdict effect records `DREW`. The old order-of-teardown hazard is not reachable.
- ⚠️ **One residual, not charged:** a spurious *remount* of `DebtSheet` while the sheet is still visible
  would dismiss and then be refused by `shownThisRun` (`coachMarks.ts:113`), losing the hint for the
  session. I could find no path that remounts it (`DebtSheet` is rendered from a single `editing` state),
  so this is theoretical.

**Pinned?** `apps/rn/tests/e2e/coach-marks.spec.ts:341-374`.
- The assertion that carries the **first** harm is `:351` — `coach-mark` count 0 after `sheet-close`. It
  reds on the original defect (the root layer redraws at the stale rect, so the count is 1).
- The assertion that carries the **compounding** harm is `:372` — `toContainText('Drag the curve')`. ⛔ It
  is **after** `:351`, so the original defect never exercises it. The log records that this is exactly how
  it was found vacuous (`toHaveCount(1)` passed with the fix planted out, satisfied by the stuck
  `payoff-schedule` callout) and that the plant had to be run with `:351` relaxed to reach it. That is the
  brief's third reading rule already applied by the fixer; I confirmed the assertion in the tree is the
  strengthened copy-naming one, not the count.

### C-B — *"Show feature tips again"* — **`PARTIAL` · `major`**

**User-facing consequence:** on iPhone, a user who has visited both Money and Progress and then taps
*"Show feature tips again"* gets **one** tip back, not two — the other mark's offer subscription latches
itself out again in the same instant, without ever being shown, and cannot return for the rest of that
session while the app still says *"Tips will appear again as you go."*

**Original finding:** `asked` is a closure latch inside the offer subscription (`use-coach-mark.ts:100`)
that `resetCoachMarks()` could not reach, and for a tab-hosted mark the effect never re-ran.

**What the fix did:** `coachMarks.epoch` (`coachMarks.ts:81,96`), bumped by `resetCoachMarks`
(`:204`), exposed as `useCoachMarkEpoch` (`:217-219`) and read as an effect dep
(`use-coach-mark.ts:119`). The effect re-runs, `asked` is re-created `false`, and
`tutorialTargets.tsx:157-165`'s `laidOut` **replay** fires the listener immediately, so no new layout event
is needed. That much works.

**Preserved / what the finding never mentioned — the part that is still open.** The re-armed subscriptions
of **every mounted host replay in the same commit**, and the latch is set *before* the store is consulted:

```
apps/rn/src/hooks/use-coach-mark.ts:101-106
    const unsubscribe = targets.subscribe((laidOut) => {
      if (asked || laidOut !== id) return;
      asked = true;                      // ← set unconditionally
      probeCoachMark(`layout:${id}`);
      coachMarks.getState().show(id);    // ← may be refused
    });
```

`show()` refuses while anything is active (`coachMarks.ts:104`). So on the epoch bump:

1. both `useCoachMark` callers on mounted tabs re-render (`money.tsx:259`, `progress.tsx:97`);
2. both effects re-subscribe in one commit and both replay synchronously;
3. the first one to run sets `active` and **wins**; the second sets `asked = true` and is **refused**;
4. a second tap on the row repeats the same order, so the loser never wins.

⚠️ **On react-native-web this cannot happen and the new e2e cannot see it.** `debt-row-actions` is gated
`Platform.OS === 'ios'` (`money.tsx:259`), so on the harness `ready` is `false`, no subscription is created
(`use-coach-mark.ts:99`), and `trajectory-scrub` replays unopposed. ⚡ **That is C-B's own lesson recurring:
the suite still exercises the member of the class that works** — it has simply moved from *the one mark
whose host remounts* to *the one platform where there is no second claimant.*

**Does the e2e now reach the two that did not?** Partly, and the brief's question is worth answering
exactly:

| mark | host | re-offered after reset? | covered by e2e? |
|---|---|---|---|
| `payoff-schedule` | debt sheet (remounts) | ✅ always | `coach-marks.spec.ts:77-92` (pre-existing) |
| `trajectory-scrub` | Progress tab | ✅ on web · ⚠️ on iOS only if it wins the race | ✅ **new** `coach-marks.spec.ts:110-129` |
| `debt-row-actions` | Money tab, **iOS-only** | ⚠️ only if it wins the race | ⛔ **unreachable on web — no coverage at all** |

So one of the two previously-uncovered marks is now tested and one is structurally untestable by this
harness. The new test is sound on its own terms — the carrier assertion is `:128`
(`toContainText('Drag the curve')`, copy not count, deliberately), the earlier `:117`
(`toHaveCount(0)`) is the latch-arming precondition and passes in both worlds, and the log records a
measured RED (`element(s) not found`) against the pre-fix bundle, so it is not passing because `goBack`
remounts the route.

**Pinned?** For the half that closed, yes (`coach-marks.spec.ts:110-129`). For the half that is open,
**nothing** — and nothing on this harness can be.

**Cheapest honest remedy, for the record:** `show()` returns `void` in every branch
(`coachMarks.ts:98-122`), so the caller cannot tell accepted from refused — make it report that, and set
`asked` only on acceptance. Alternatively, let a refusal whose reason is `active` re-arm rather than latch.
Both are behaviour changes and belong to a reviewed step, not here.

### C-C — the once-ever record spendable on a callout nobody saw — `CLOSED`

**Original finding:** `DREW` was `!stoodDown && rect && COACH_MARKS[active]` — three facts, none of them
*"the callout is inside the viewport"* — so the record was written at the sheet's entrance transient.

**What the fix did, and it is the shape the brief asked for.** The placement was extracted to a single pure
owner, `calloutTop(rect, h, winH, insetTop, insetBottom)` (`CoachMarkLayer.tsx:434-438`), which the render
body calls at `:279` and the record's gate calls through `calloutOnScreen` (`:450-453`). The verdict effect
(`:174-191`) gains an `offScreen` value at `:183-184` and only writes at `:190`. **There is exactly one
derivation of `below` / `roomBelow` / `top` in the file** — I checked: `grep -c "roomBelow"` returns 1, and
the only `rect.y + rect.height + 12` outside `calloutTop` is the reveal effect's `belowY` at `:247`, which
is a scroll computation, not a placement.

**Preserved?** Yes, and the asymmetry is deliberate and documented at `:144-146`: the layer still **draws**
in the `offScreen` case, it just does not **spend** the hint. Nothing about the reveal, the latch or the
touch model moved.

⛔ **The risk the fixer flagged before building — I checked it, and it does not land, for a reason that is
itself worth recording.** The premise was *"react-native-web measures the callout 392 pt below the fold, so
gating on the viewport stops web recording that mark."* That 392 pt figure was **re-measured false** at
`.11.12.9` and the correction is in the tree at `coach-marks.spec.ts:33-40`: the *seated* callout is on
screen at 440×956, 440×740, 402×874 and 390×664 (402×874: y 543..687). The below-fold position is the
**transient**, and `FormSheet`'s `remeasureOn={settled}` (`FormSheet.tsx:200`) drives a second `measure()`
through the deps at `CoachMarkLayer.tsx:99`, which re-runs the verdict effect with a seated rect. So web
does write the record, after the seat.

**Does anything in the suite depend on a record web will not write?** I enumerated every
`coachMarksSeen` site in `apps/rn/tests` (26 hits, whole result counted, not `head`-truncated). **Exactly
one** assertion depends on the *app* writing the record: `coach-marks.spec.ts:223`
(`expect(last.seen).toBe(true)`). Every other spec and both shot blocks **seed** the value. So the blast
radius of a web/device divergence here is one assertion, and it is the one the fixer measured green with a
"never record" plant.

⚠️ **The divergence is real but points the OTHER WAY, and nothing can see it.** `calloutOnScreen` tests
against `insets.top` and `winH - insets.bottom`. On react-native-web both insets are `0`; on iOS they are a
notch and a home indicator. **The device gate is therefore strictly stricter than the harness gate**, so a
placement that records on web can fail to record on device — a hint that is offered again at every cold
launch. The fixer filed exactly this inversion to the P6.10 backlog. I priced it and did **not** raise it to
`major`: for `trajectory-scrub` the reveal scroll (`:263-264`) is computed to guarantee
`winH − insetBottom − belowY > calloutH + 26`, so the below-branch is on screen by construction; for
`payoff-schedule` and `debt-row-actions` the above-branch clamps to `insetTop + 8` and only fails when the
callout is taller than the whole safe area (>≈600 pt on the shortest shipping phone). Not reachable at any
Dynamic Type size the app permits.

**Pinned?** `coach-marks.spec.ts:154-224`, and it is the strongest pin in this surface.
- Carrier: `:213-217` — *"the hint was recorded as seen while its callout was below the fold"*, evaluated
  over an rAF timeline rather than a single read, because the store persists on a 500 ms debounce and a
  one-sample version was measured green with the defect present.
- ⛔ Two assertions run **before** it and would red first on a broken *instrument*, not on the defect:
  `:202` (the transient was entered) and `:210` (it outlasted the debounce). Those are vacuity guards that
  **fail rather than skip**, which is correct — but it does mean that if a future change removes the
  entrance transient, this test reds and says why instead of passing hollow.
- ⛔ The **other direction** — *"a hint the user could actually see is still recorded"* — is `:223`, and it
  sits after the carrier, so the original defect never exercises it. The log records a second, separate
  plant (`calloutOnScreen` forced `false`) run specifically to reach it. That is the brief's third reading
  rule already satisfied.

**Residual, stated by the code and true:** before `onLayout` lands, both the placement and the gate use
`ESTIMATED_CALLOUT_H = 144` (`:403`), so a callout taller than the estimate can be recorded while clipped.
Deliberately not tightened, and the reasoning at `:170-172` is sound.

### J1-2 — `calloutH`'s reset also fired on `remeasureOn` — `CLOSED-UNPINNED`

**Original finding:** the reset lived inside the measure effect, whose deps include `remeasureOn` — the
sheet's entrance-spring completion — so a few hundred ms after the card had measured itself, its height was
zeroed and nothing re-measured it (RNW's `onLayout` is a shared `ResizeObserver` and fires on size only;
the card's own frame does not change when `wrap`'s `top` moves). Placement then fell back to the 144 pt
guess, and the sheet reveal was killed permanently by `if (calloutH === 0) return;`.

**What the fix did:** the reset is now its own effect, keyed on the mark alone —
`CoachMarkLayer.tsx:74-76`, `useEffect(() => { setCalloutH(0); }, [active])` — with the measurement kept in
the effect at `:78-99` that still carries `remeasureOn` in its deps at `:99`.

**Preserved?** Yes, both halves.
- The D-6 property (mark B must not inherit mark A's height) still holds: `show()` refuses while `active`
  is set (`coachMarks.ts:104`), so every A→B transition passes through `active === null`, and this effect
  fires on that pass.
- The 4.1.4c property (the *subject* is re-measured when the sheet settles) is untouched — `remeasureOn`
  remains a dep of the measure effect and of nothing else. `grep -n "remeasureOn" CoachMarkLayer.tsx`
  returns four hits: the prop docblock `:36-40`, the destructure `:40`, the dep `:99`, and the explanatory
  note at `:67-72`. No fifth consumer.

**Pinned?** **No, and nothing on this harness could be.** `coach-marks.spec.ts`'s only geometric assertion
is `:394-435`, on the **root** layer's `trajectory-scrub`, where `remeasureOn` is `undefined`. The sheet
tests assert count, ownership and hit-testing, never placement — and the file says why: RN-web lays a
Modal's contents out in document flow. `fontScale` is always 1 in react-native-web, so no web spec can vary
the input that makes the regression visible. Deleting `:74-76` and putting `setCalloutH(0)` back inside the
measure effect turns nothing red. **Device-owed.**

### P1-4 — the `COVER NOW` run-on at 40 obligations — `CLOSED`

**Original finding:** `plan.coverNow.map((i) => i.name).join(' · ')` with the total welded on by an
em-dash rendered 23 generic names as a four-line paragraph on the one card that speaks to a user who is
short this paycheck.

**What the fix did:** `summariseNames(names, max)` in `apps/rn/src/utils/format.ts:61-64`, called at
`RecoveryPlanSection.tsx:45`; the figure now leads (`:71-74`), three names follow, and the rest sit behind
a disclosure (`:77-96`). The helper's one real decision is `names.length <= max + 1` at `format.ts:62` —
it declines to truncate at four, where *"+1 more"* is longer than the name it hides.

**Preserved?** Yes, and the two ways this shape usually over-matches are both handled.
- The `Pressable` is `disabled` and drops its `accessibilityRole`/`accessibilityLabel` when
  `coverSummary.more === 0` (`:78-87`) — a control that expands nothing is never announced, which is the
  class `.11.13.8` closed.
- The full list stays reachable and is rendered verbatim when expanded (`:90`), so nothing about the
  user's own data is hidden from them permanently. The count is `${coverNames.length} bills` only when
  `> 1` (`:73`), so a single obligation does not read *"1 bills"*.
- ⚠️ **The identical shape at `ImportDebtsSheet.tsx:95` was deliberately not changed** and the reasoning
  holds on inspection: that list confirms what is about to be added, inside a scroll, where every name is
  the point. The class was correctly filed rather than closed as a list.

**Pinned?** Two instruments, both real.
- `apps/rn/src/utils/format.test.ts:29-58` — 14 assertions including the `max + 1` boundary (`:46-47`) and
  the `max: 0` degradation (`:58`).
- `apps/rn/tests/e2e/recovery.spec.ts:56-67`. ⚠️ The carrier for the finding is **`:63`**
  (`Essential 11` must have count 0), not `:59` (`+8 more` visible) — because the naive over-fix that keeps
  the affordance and returns all 23 names passes `:59`. `:59` reds first on the *original* `join`, so the
  log's two-plant discipline was necessary and was applied. `:65-67` then pins the expansion.

### P1-5 — the export sheet's raw JSON face — `CLOSED`

**Original finding, and the half that was wrong.** The raw-envelope half held. The *"`Done` is filled while
`Copy to clipboard` is secondary"* half was a claim about the **web** build: `BACKUP_FILE_SUPPORTED` is
`false` in `backupFile.web.ts:21` and `true` in `backupFile.ts:23`, so the matrix could not photograph the
filled `Save as a file` button iOS renders — the shipping defect was two filled buttons, not one inverted.
⚡ **I re-checked the fork myself rather than taking the log's word**, per reading rule 2, and it is as
stated.

**What the fix did:** `BackupSheets.tsx:69-71` picks the primary by platform, `:88-90` leads with
`describeStoreContents(store)`, `:96-117` puts the raw envelope behind `Show the raw data`, and `Done` is
demoted to a `variant="text"` button in `footerAccessory` (`:81`). `FormSheet.tsx:113,179` give the submit
slot `testID="form-sheet-submit"` so the *primary* can be named by a test.

**Preserved?** Yes. The raw text is reachable, not deleted (`:107-117`), which is the whole copy/paste path
on web and what the round-trip test reads. On iOS the secondary `Copy to clipboard` is `variant="secondary"`
(`:92-94`), so the two-filled-buttons state is gone rather than swapped.

**Pinned?** `apps/rn/tests/e2e/backup.spec.ts:146-172`.
- `:157` carries the raw-envelope half and reds first on the original defect.
- `:166` (`form-sheet-submit` reads `Copy to clipboard`) carries the hierarchy half and sits **after**
  `:157`, so the original defect never reaches it — the log records a second, partial-fix plant written
  specifically to red there.
- `:158` is an absence assertion and correctly runs **after** a positive one, so it cannot pass on a sheet
  that never opened.
- ⚠️ **Web-only.** On iOS the submit reads `Save as a file` and **nothing asserts it**; there is no native
  coverage of the branch that is actually shipped. Recorded, not charged — the branch is a two-line
  ternary and the shape is pinned on the other side of it.

### P1-1 — the four emotional beats had no frames — `CLOSED`

**What the fix did:** four `SURFACES` entries — `payoff-finale` (`p6.8-matrix.shot.ts:280`), `payoff-beat`
(`:300`), `band-milestone` (`:318`), `milestone-ack` (`:346`) — each seeded rather than clicked, each with a
`ready` that waits for a **canvas** and does not swallow the failure. The `Surface.ready` field became
**required** (`:181`, docblock `:166-180`) and the two loops that previously skipped it now call it — the
states block at `:665` and the text-scale block at `:726`. `STATES` became `satisfies`-typed
(`:118`) with a `StateName` key type (`:121`), so a `states:` entry naming a state that does not exist is a
compile error rather than an empty spread.

⚠️ **A leftover, `minor`:** the route block still calls it as `if (s.ready) await s.ready(page)`
(`:565`) — a conditional on a field the type now makes non-optional. Harmless today; it is exactly the
shape the docblock at `:166-180` warns about, left standing where a future `ready?:` would silently
re-open the hole.

**Preserved?** Yes — the four entries carry no `only`, so they shoot at all five viewports in both themes
and are picked up by the text-scale block, which is the 40 + 32 = 72 frames the log claims. Nothing about
the existing recipes changed. `playwright.shots.config.ts:30-42` adds `--clear` to the export, which is the
third config to need it; the mechanism was measured once already, and the risk of *not* having it is the
whole matrix silently re-rendering as the un-seeded app.

**Pinned?** The `ready` requirement is pinned by the type system plus `typecheck:tests` (verified by the
fixer with a planted omission). The four new frames themselves are pinned by nothing except `⛔ UNREACHED`
— which is correct: a frame's *content* is judged by a human, and that is what the corpus is for.

⛔ **One in-source claim in this fix is FALSE, and it understates the coverage hole this round has to
decide.** `p6.8-matrix.shot.ts:332-333` says *"The route block is the ONLY shooting block that does not
seed this — `SHEETS` and the text-scale block both do."* I enumerated every `coachMarksSeen` site in the
file (four hits, whole result counted): `:335` (`band-milestone`'s own `seedOver`), `:607` (`SHEETS`),
`:835` (`EXPANDED`). **The text-scale block does not seed it** — `:717` is
`await reseed(page, seed(theme, s.seedOver), s.goto)` and the `progress` surface has no `seedOver`. See the
hero section below for what that costs. Rated `minor` on its own (a wrong comment), but it is load-bearing
for the scope call, so it is called out rather than buried.

---

## Job 2 — sweep for blocker + major

**One `major`. No `blocker` found in this surface.** `minor` items are deliberately absent except where the
brief's own questions made one load-bearing (the two called out inside Job 1 and the hero section).

### 1. *"Show feature tips again"* raises a tip on top of the More screen — and spends it there — **`major`**

**User-facing consequence:** tapping *"Show feature tips again"* in More instantly draws a coach mark for a
control on **another tab** across the settings list — on iPhone, *"Press and hold a debt · Log a payment,
see its payoff schedule…"* floating over Preferences at the Money row's coordinates — and the layer records
that mark as **seen** while it is standing there, so the one hint the user just asked to get back is spent
on a screen where the control it names does not exist.

**Mechanism.** Three pieces, each correct in isolation.

1. `resetCoachMarks()` bumps `epoch` (`coachMarks.ts:204`). `epoch` is an effect dep
   (`use-coach-mark.ts:119`), so **every mounted** `useCoachMark` caller re-subscribes — and tab screens
   are always mounted (`_layout.tsx` sets no `unmountOnBlur`; the offer effect has **no focus gate**,
   unlike the blur effect at `:61-66` and unlike `progress.tsx:147-159`'s scroll host, which was
   focus-gated for exactly this confusion).
2. `targets.subscribe` **replays** synchronously (`tutorialTargets.tsx:159-161`), and `laidOut` still holds
   every id whose target is registered — which a backgrounded tab's is. So `show(id)` fires **during the
   tap**, while the user is on More.
3. `CoachMarkLayer` is mounted at the **root, above the `Stack`** (`_layout.tsx:357`), and More is a plain
   pushed route (`_layout.tsx:312` — no `presentation: 'modal'`). The subject underneath still measures at
   real window coordinates, so `calloutOnScreen` (`CoachMarkLayer.tsx:450-453`) says yes and the verdict
   effect writes `markDrawn` (`:190`).

⛔ **The blur rule cannot save it.** `use-coach-mark.ts:62`'s stand-down fires on an `isFocused`
*transition*. Progress and Money blurred when More was pushed — with `active === null`, so the effect
returned at `:63` — and `isFocused` does not change again until the user leaves More, at which point the
effect's guard `if (isFocused) return;` short-circuits. So the callout persists on More, and then on
whatever screen the user lands on next.

⚡ **This is a recorded, already-fixed defect coming back through a new door.** `use-coach-mark.ts:37-41`
describes it verbatim: *"with the `trajectory-scrub` hint up on Progress, opening More left 'Drag the curve
· Scrub any month…' lying across the settings list. Seen first on the iPad (`ipad-04` → `ipad-05`) and then
in Chrome."* 4.1.5.4 closed the *navigate-away* door; the epoch re-arm opened a *raise-while-away* door that
the same guard cannot reach.

**Confidence:** read-only inference, high. Every step is a direct read of the code, and the same symptom was
previously reproduced on device and in Chrome. **Not measured** — I did not run the suite, per the brief.

**Would anything catch it?** No. `coach-marks.spec.ts:110-129` performs this exact sequence and asserts
nothing between the tap at `:122` and `page.goBack()` at `:124` — a callout appearing over More satisfies
every assertion in the test. The iOS half (`debt-row-actions`) is unreachable on this harness at all.

**Cheapest honest remedy, for the record:** gate the *offer* effect on focus the way the blur effect and
the scroll host already are — `if (!ready || !targets || !isFocused) return;` at `use-coach-mark.ts:99` —
so a re-armed subscription waits for its own screen to be the one you are looking at. That also removes the
same-commit race behind C-B's `PARTIAL`, because only the focused host can claim `active`.

---

## The Progress-hero capture hole — the call this round owes

**The question as dispatched:** *does the route block need BOTH mark states (marks-seen and marks-live)?*

### ⚡ First, the premise has moved, and nobody wrote it down

**The Progress hero is no longer absent from the corpus.** `.11.14.3` added `band-milestone`
(`p6.8-matrix.shot.ts:316-342`) — a `/progress` surface whose `seedOver` seeds
`coachMarksSeen` at `:335`. It carries no `only`, so it is shot by the route block at **5 viewports × 2
themes = 10 frames**, and its `seedOver` flows into the text-scale block (`:719`) for a further **2
viewports × 2 themes × 2 scales = 8 frames**. All 18 render the ordinary Progress hero: ring, `DEBT-FREE`
date, `progress-hero-journey`, `Next milestone: 75%`. **The hole was half-closed as a side effect of
closing P1-1**, and the log filed it forward as still open.

What the 18 frames do **not** show, because the seed fixes it:
- the ring in its **resting** state — `pendingMilestone: { threshold: 50 }` at `:322` means every one of
  them carries the `withRepeat(…, -1, true)` pulse halo;
- the **`"$X to go"`** branch of `progress-hero-journey` (`journeySelectors.ts:72`). At 4,800 / 12,000 the
  seed is always in the `"$7,200 of $12,000 paid"` branch. ⚡ **No `STATES` entry carries an
  `originalBalance` at all** (`p6.8-matrix.shot.ts:80-118`), so `single` / `many` / `huge` / `divergent`
  are *exactly* the "to go" case — and they are the frames the coach mark scrolls the hero out of. So the
  wording C-D was filed about, and the one a brand-new user meets, is in **no frame at any viewport**;
- a multi-debt portfolio, and therefore any hero whose figures are a sum.

### The recommendation

⛔ **No — do not shoot the route block in both states.** That is 10 extra frames per surface across a block
that is already 5×2, it would double the slowest block in the file, and it buys the *same* view of nine
surfaces that have no coach mark on them at all. **Add one `STATES` entry instead.**

`STATES` is shot at **phone × both themes only** — 2 frames per state (`:626-630`) — and `progress`
already declares `states: ['empty','single','many','huge','divergent']` (`:194`). A `marks-seen` state whose
whole content is `{ prefs: { coachMarksSeen: [...] } }` merges cleanly at `:634`
(`const merged = { ...(s.seedOver ?? {}), ...STATES[stateName] }`, and `seed()` spreads `prefs` at `:70`),
needs no change to any existing frame, and costs **2 frames**. It puts the resting hero and the `"to go"` wording in the corpus
while leaving every live-mark frame — the ones that found P1-2 — exactly as they are.

**One-line why:** the live-mark route frames earn their keep (P1-2 exists because of them), so marks-seen is
a second *state*, not a replacement — and `STATES` is the block that already exists to say "same screen,
different design question" at two frames a time.

### ⛔ And the text-scale block is the part that actually still needs fixing

`p6.8-matrix.shot.ts:332-333` asserts that the text-scale block seeds `coachMarksSeen`. **It does not** —
`:719` passes `s.seedOver` unchanged, and `progress` has none. So `textscale-1.35x-progress.png` and
`textscale-2x-progress.png`, at **phone (402×874) and phone-small (320×568), both themes — 8 frames** — are
all shot with a live coach mark scrolling the hero out of shot, at the two scales where the callout is
*largest* and the reveal scroll therefore *deepest*.

⚡ **That is the corner the hero is most likely to fail in and the one place nobody can look.** Read
directly from the code, since no frame shows it (`progress.tsx:319-329`):

| element | style | clamp |
|---|---|---|
| ring | `ringWrap: { width: 112, height: 112 }` | **fixed — does not scale** |
| `%` count-up | `ringPct`, `fontSize: 26` | `maxFontSizeMultiplier={1.4}` (`:262`) |
| `paid` under it | `textStyles.caption`, 12 pt | ⛔ **none** |
| `DEBT-FREE` | `textStyles.footnote` + `eyebrow`, 13 pt | ⛔ **none** |
| the date | `heroDate`, 26 pt | `maxFontSizeMultiplier: 1.3`, `numberOfLines: 2`, `adjustsFontSizeToFit` (`:53-58`) |
| `progress-hero-journey` | `textStyles.subhead`, 15 pt | ⛔ **none** |
| `Next milestone: …` / streak | `textStyles.caption`, 12 pt | ⛔ **none** |

At AX5 (`fontScale ≈ 3.1`) the ring's centre stack is a clamped 26→36 pt number over an **unclamped**
12→37 pt `paid`, inside a box that is still 112 pt tall and 112 pt wide. Beside it, `ringMeta` is
`flex: 1` in a `104 pt` slot at 320 pt width (`:47-48` states that measurement), holding three unclamped
labels. ⚠️ **I could not settle whether that clips or merely wraps** — RN sizes to content, so wrapping is
the likely outcome for `ringMeta`, but the ring's `absoluteFill` centre stack (`:259-264`) is a genuinely
fixed box and is the one place clipping is plausible. **`adjustsFontSizeToFit` is a no-op on
react-native-web**, which the file records at `:50-51`, so even a corrected text-scale frame would
over-report. This is device-owed either way — but it should not *also* be un-photographed.

**Recommended, and it is one line:** merge `coachMarksSeen` into the text-scale block's seed the way
`SHEETS` does at `:602-608`, which makes `:332-333` true and is the cheaper half of this whole question.

---

## Swept and found clean

Stated plainly, because "nothing found" is a result. **No `blocker` or `major`** in any of the following.

**Re-checked because this fix range EDITED them** *(the ratchet's own warning — a clean verdict does not
survive an edit; only the changed part was re-read)*:

- **`store/coachMarks.ts`** — the four additions are `epoch` (`:81`, `:96`), its bump inside
  `resetCoachMarks` (`:204`), `useCoachMarkEpoch` (`:217-219`), and `markDrawn`'s rewritten docblock
  (`:124-149`). The counter cannot wrap in a session, the bump is inside the same `setState` that clears
  `shown` and `active`, and the selector is narrow so nothing re-renders for it in an ordinary session.
  `markDrawn` itself (`:150-155`) is unchanged and still idempotent. The `addHost` asymmetry the last round
  recorded (no `released` guard, unlike `addSuppressor:168-174`) is still there and still unreachable —
  only one host can exist, since a sheet is never presented over a sheet. Not re-charged.
- **`app/(tabs)/progress.tsx`** — the changed part is the import (`:24`), the hero figures (`:203`), the
  hero line (`:272-274`) and the `eyebrow` style (`:327`). ⚡ **The scroll host (`:147-160`) is untouched by
  this range** — `git diff 6736a64..c8d54fa` changes no line inside it — so the last round's clean verdict
  survives on its own terms: the focus gate, the `scrollEventThrottle={16}` pairing and the deliberate
  `animated: false` are all intact.
- **`components/plan/CoachMarkLayer.tsx`** — the touch model is unchanged by this range: `wrap` `box-none`
  (`:307`), card `box-none` (`:340`), the sentence `pointerEvents="none"` (`:375`), the dismiss live with
  `hitSlop={10}` and a 44 pt `minHeight` (`:379-390`, `:469`). The one thing the C-C fix *could* have broken
  here — the layer standing down from drawing — it deliberately does not: `:268-269` are untouched and the
  verdict effect's new `offScreen` branch does not gate the render.

**Swept for the first time this round** (extend the ratchet with these):

- **`store/coachMarkCopy.ts`** — three entries, each pointing at a control that exists
  (`DebtSheet.tsx:292` · `money.tsx:410` · `TrajectoryChart`'s scrub target). None names an action the app
  does not have, which is the `.11.13.8` class. The iOS-only note on `debt-row-actions` matches
  `money.tsx:259`.
- **`store/coachMarkProbe.ts` under the `QA_TOOLS` flip.** Every writer early-returns on `qaEnabled()`
  (`:55`, `:74`), so at P6.17 the trace goes inert and the readout unmounts. ⚠️ **Nothing user-facing is
  lost** — `resetCoachMarks` calls `resetCoachMarkProbe()` (`coachMarks.ts:208`) and the early return is
  harmless; no product path reads `useCoachMarkProbe`. What the flip *does* cost is the only instrument
  that can diagnose a coach-mark failure on device (`coachMarkProbe.ts:9-28` says five mechanisms were
  proposed and four refuted before it existed). That is a known, intended trade, and the probe is not a
  gate — but it is worth knowing that finding 1 above will be undiagnosable from a TestFlight build.
- **`components/ui/Button.tsx`** — `pressedOpacity` 0.85 → 0.8 is the only behavioural move; hover and
  disabled keep their exact values under new names (`spacing.ts:63-64`). `testID` is forwarded to the
  `Pressable` (`:56`) and displaces neither `accessibilityRole="button"` nor the child-text accessible
  name. `minHeight: 52` (`:86`) is a floor, not a fixed height, so a Dynamic-Type label grows the control
  rather than clipping it.
- **`components/ui/FormSheet.tsx`** — the only change is the `testID` on both submit slots (`:113`,
  `:179`). Two slots, one id, but they are mutually exclusive branches (inline vs. Modal), so no strict-mode
  selector can become ambiguous. `remeasureOn={settled}` (`:200`) is unchanged.
- **`components/onboarding/FirstDebtOrBillStep.tsx`** — `nextMonthFirst()` routes through
  `addMonthsToDate(new Date(), 1, 1)` (`:30`), and I read the helper rather than trusting the comment:
  `anchorDay = 1` and the target is built as `new Date(y, m + n, 1)`
  (`packages/core/utils/addMonths.ts:22-28`), so the 31st → "first of next month" overflow is genuinely
  gone. The validate-then-write single-branch shape (`:43-99`) is intact and no refused field reaches
  `addDebt`/`addExpense`.
- **`components/progress/CashFlowSection.tsx`, `PaidOffArchive.tsx`, `components/plan/CashRunwayChart.tsx`** —
  eyebrow token only; no logic, no copy, no figure changed. `CashRunwayChart`'s `letterSpacing` moves
  0.8 → 0.5, which is the stated convergence and sub-pixel per character at 12–13 pt.
- **`store/journeySelectors.ts`** — read because it is the Progress hero's new owner. `pct` reads the
  confirmed anchors and `"to go"` reads the projection, which is 2.4's rule applied *by branch* rather than
  by preference; `totalPaid` clamps at 0 (`:61`); `pct` cannot exceed 100 and cannot divide by zero
  (`:62`). Pinned at `progress-hero-journey.spec.ts:55,78,124`, which names the `progress-hero-journey`
  testID rather than matching a dollar amount that appears elsewhere on the screen.
- **The four e2e specs in this range** (`tutorial-invite`, `date-field`, `swipe-delete`, `swipe-mark-paid`) —
  the changes are `Array.from` over `NodeList`, a CDP union type in place of `string`, and one corrected
  comment. **No assertion was weakened;** the CDP change is strictly stronger (a typo in `'touchMove'` now
  fails to compile instead of dispatching nothing).
- **No residual `setMonth` in this surface.** Searched `components/payoff`, `components/progress`,
  `components/plan` and `app/(tabs)/progress.tsx` — the whole result is three hits, two of them comment
  references in `monthLabels.*` and one `setDate(+days)` in `SaveForItSheet.tsx:27`, which is day
  arithmetic and does not overflow.

### One `minor` recorded rather than charged — because it is the dimension the estimate did not mention

`.11.14.5`'s cost note said the `eyebrow` token *"touches zero strings and zero tests"*, and the log's own
after-scan corrected that to *"true, and it says nothing about pixels"* — then priced `letterSpacing` and
`fontWeight`. **It did not price `textTransform` reaching a string that is not a literal.** The token adds
`textTransform: 'uppercase'` (`typography.ts:70`) to fifteen `eyebrow` styles, nine of which previously had
`letterSpacing` only. Fourteen of the fifteen render literal-caps or numeric strings, so uppercasing is a
no-op. **One does not:** `PlanHero.tsx:142-144` renders `THIS PAYCHECK · {shortDate(nextPaycheckDate)}`, and
`shortDate` (`:29-32`) returns `toLocaleDateString(undefined, { month: 'short', day: 'numeric' })` — so
Today's hero eyebrow moved from **"THIS PAYCHECK · Aug 25"** to **"THIS PAYCHECK · AUG 25"**. Arguably more
consistent, certainly unreviewed, and nothing in the repo would show it. `minor` — no user-visible
consequence about money or data, and no instrument blinded. (All four storefronts are English, so the
Turkish-`i` / German-`ß` class of `toUpperCase` hazards has no live site.)

## Could not determine

- **Whether the Progress hero's ring-centre stack clips at AX5.** The `%` is clamped at 1.4× (`:262`) and
  the `paid` caption beneath it is not, inside a 112 × 112 `absoluteFill` box (`:259-264`, `:322`). RN sizes
  containers to content, so `ringMeta` almost certainly wraps rather than clips; the fixed ring box is the
  one place it could go wrong. **Device-owed**, and — see the hero section — currently un-photographed at
  any text scale.
- **Whether `calloutOnScreen` refuses on device a record it grants on web.** The insets are `0` in
  react-native-web and non-zero on iOS, so the device gate is strictly stricter. I priced it as unreachable
  at any permitted Dynamic Type size, but the arithmetic uses a callout height nothing has measured on a
  device. **Only observable on device.**
- **The effect ORDER between Money's and Progress's `useCoachMark` on an epoch bump.** C-B's `PARTIAL` does
  not depend on which wins — one always loses — but I cannot say from reading which mark the user actually
  gets, and lazy tab mounting can change it between sessions.
- **Anything about VoiceOver.** Finding 1 leaves a live `accessibilityRole="alert"`
  (`CoachMarkLayer.tsx:372-374`) in the tree over the More screen; whether it is announced, and in what
  order relative to the settings list, is an iOS question no harness here can answer.
- **No gate and no suite was run**, per the brief, and **no frame was re-shot** — so every "nothing would
  catch it" is derived from reading the specs' assertions, and every claim about the corpus is derived from
  reading the shot recipes rather than from looking at a PNG. ⚠️ If one frame is worth pinning to
  `docs/evidence/` before the next re-shoot, it is
  `apps/rn/capture-ref/p6.8/phone-small/dark/textscale-2x-progress.png` — the deepest corner of the hero
  hole, and the frame that would prove or refute the clipping question above.

## Tally

| severity | Job 1 | Job 2 |
|---|---|---|
| `blocker` | 0 | 0 |
| `major` | 1 (C-B) | 1 |
| `minor` | 3 — the `if (s.ready)` leftover · the false text-scale claim at `p6.8-matrix.shot.ts:332-333` · the uppercased hero date | not reported, per the brief |

Job 1 verdicts: **5 `CLOSED`** · **1 `CLOSED-UNPINNED`** · **1 `PARTIAL`**.
