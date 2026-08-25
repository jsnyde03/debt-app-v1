# Cluster C — the coach-mark / discovery layer and the Progress screen

**Range verified** `4877d90..01fc7ec`. **Surface swept:** `apps/rn/src/components/plan/CoachMarkLayer.tsx`,
`apps/rn/src/store/tutorialTargets.tsx`, `apps/rn/src/store/coachMarks.ts`,
`apps/rn/src/hooks/use-coach-mark.ts`, `apps/rn/src/app/(tabs)/progress.tsx`,
`apps/rn/src/components/payoff/` — plus the code they depend on that neither round changed
(`components/ui/FormSheet.tsx`, `hooks/use-sheet-presentation.ts`, `components/entities/DebtSheet.tsx`,
`app/more.tsx`, `store/coachMarkProbe.ts`, and `react-native-web`'s `useElementLayout`).

Read-only: `git diff`, `grep`, `sed`, `cat`. **No gate and no suite was executed.** Where a claim can only be
settled by running something or by a device, that is said rather than guessed.

Severity words are the brief's: `blocker` · `major` · `minor`. Job 2 reports **only** `blocker` and `major`.

---

## Job 1 — did each fix close its finding?

| # | site | verdict |
|---|---|---|
| J1-1 | `CoachMarkLayer.tsx:61-68` — clear `calloutH` with the rect | `CLOSED-UNPINNED` |
| J1-2 | `CoachMarkLayer.tsx:68` + deps `:89` — the same reset also fires on `remeasureOn` | **`WRONG-REMEDY` · major** |
| J1-3 | `TrajectoryChart.tsx:1,16-19,160-175` — the `skiaReady` re-measure removed | `CLOSED` |
| J1-4 | `TrajectoryChart.tsx:378-388` — the deleted comment's twin survived | `PARTIAL` · minor |
| J1-5 | `skia-ready.web.ts:63-68` — the rejection docblock | `CLOSED` |
| J1-6 | `strategy-compare.spec.ts:101-106` — the `s` flag reverted | `CLOSED` |

---

### J1-1 · `CoachMarkLayer.tsx:61-68` — `setCalloutH(0)` at the head of the rect effect

**Verdict: `CLOSED-UNPINNED`.**

**Q1 — the finding's behaviour is gone.** [`.11.9` · D-6] was: `calloutH` (`:49`) is component state on a
layer that never unmounts, so mark B's reveal decision at `:197`/`:204` runs on mark A's measured height.
Traced against the current code, the premise held: `show()` refuses while `active` is set
(`coachMarks.ts:92`), so every A→B transition passes through `active === null`; the effect now runs
`setCalloutH(0)` (`:68`) on that pass, so by the time B's rect lands the guard at `:197` is armed with `0`
and defers to B's own `onLayout` (`:304-307`). Correct, and it is the same shape the rect itself already
had (`:70`).

**Q2 — what the site did right, and still does.** The card unmounts between marks (`:220` returns null while
`rect` is null), so B's `onLayout` does fire and the measured height is restored — for the root layer. The
reveal latch `revealAskedFor` (`:51`) is untouched, and the `cancelled` cleanup (`:86-88`) is unchanged.
⚠️ **The `remeasureOn` path is a different story — J1-2.**

**Q3 — nothing would catch it un-fixing.** There is no unit test over `CoachMarkLayer.tsx` anywhere under
`apps/rn/tests`, and neither e2e raises two marks in one page session: `coach-marks.spec.ts` raises
`payoff-schedule` only, `coach-mark-neighbour.spec.ts:34` raises `trajectory-scrub` only. Deleting `:68`
turns nothing red.

---

### J1-2 · `CoachMarkLayer.tsx:68`, deps `:89` — the reset also fires on `remeasureOn`, and nothing restores the height

**Verdict: `WRONG-REMEDY` (over-match) · severity `major`.**

**User-facing consequence:** with iOS Larger Text on, the "See the whole payoff" hint in the edit-debt sheet
is placed from a 144 pt guess instead of its real height for the rest of its life, so it can be drawn on top
of the "View payoff schedule" row it exists to point at.

**The mechanism.** The reset was put inside the effect keyed `[active, targets, remeasureOn]` (`:89`).
`remeasureOn` is the sheet's entrance-spring completion — `FormSheet.tsx:192` passes
`remeasureOn={settled}`, and `use-sheet-presentation.ts:46,54-56` flips `settled` false→true once the spring
finishes. Ordering on the only path that uses it (`DebtSheet.tsx:133`, `payoff-schedule`):

1. the subject lays out during the sheet's first frames → `show()` → `active` set;
2. the card renders and `onLayout` (`:304-307`) writes the real `calloutH`;
3. ~300–500 ms later `settled` flips → **the effect re-runs and zeroes `calloutH`** while the same card is
   still mounted.

**Nothing re-measures it.** The card is not remounted, its content does not change, and its frame *inside*
`styles.wrap` does not change — only `wrap`'s own `top` does (`:268`). On react-native-web this is certain:
`onLayout` is a single shared `ResizeObserver` (`react-native-web/dist/cjs/modules/useElementLayout/index.js`),
which fires on **size** only. On iOS, RN dispatches `onLayout` only when a node's own layout metrics change,
and the card's do not. So `calloutH` stays `0` and both consumers fall back:

- `:239-240` — `roomBelow` and `top` use `calloutH || ESTIMATED_CALLOUT_H` = **144** (`:364`). In the
  above-branch `top = rect.y - 144 - 10`, so a callout taller than 154 pt overlaps the subject by the
  difference. The subject here is the pinned footer row (`FormSheet.tsx:50-64`), i.e. the branch that is
  taken.
- `:197` — `if (calloutH === 0) return;` now returns forever, so a sheet-hosted mark can never ask for a
  reveal. (Unreachable damage today: no `FormSheet` is opened from the one screen that registers a scroll
  host — `progress.tsx:150` — which the previous round already recorded.)

**Why it is not worse than it is, stated plainly.** At 402–440 pt with default Dynamic Type the measured
height is ≈144, which is what `ESTIMATED_CALLOUT_H` was set to (`:360-364`), so the two coincide and nothing
is visible. The damage appears exactly where the measurement was introduced to help: larger text, and any
future edit to `coachMarkCopy.ts` that changes the wrap. Reduce Motion is immune (`settled` starts `true`,
`use-sheet-presentation.ts:46`), and the root layer is immune (`remeasureOn` is `undefined` at
`_layout.tsx:357` and never changes).

**The tighter remedy** is the same line keyed only on the mark: reset when `active` changes, not when a host
re-measures. `remeasureOn`'s whole purpose (`:36-39`) is to re-measure the *subject*; the callout's own height
is not a function of it.

**Nothing would catch it.** `coach-marks.spec.ts:44-62,115-183` exercises the nested sheet layer but asserts
count, ownership and hit-testing — never placement; the one geometric assertion
(`coach-marks.spec.ts:200-244`) is on the **root** layer's `trajectory-scrub`, where `remeasureOn` does not
exist. `fontScale` is always 1 in react-native-web (`TrajectoryChart.tsx:336-338` records this), so no web
spec can vary the input that makes it visible. **Device-owed to confirm the overlap; the state loss is
readable from the code.**

---

### J1-3 · `TrajectoryChart.tsx:1,16-19,160-175` — the `skiaReady` re-measure removed

**Verdict: `CLOSED`.**

**Q1 — gone, entirely.** The `useEffect`, the `useTutorialTargets()` call and both imports are removed;
`grep -n "invalidate\|useTutorialTargets" apps/rn/src/components/payoff/TrajectoryChart.tsx` returns nothing.
The finding was that the effect was `DEAD` on iOS (`skia-ready.ts:12-13` returns a constant `true`) and a
no-op on web, and that it double-booked `invalidate` as the coach-mark **show** trigger
(`tutorialTargets.tsx:153-156` → `use-coach-mark.ts:74-79`), offering `trajectory-scrub` from mount rather
than from layout. Removing it removes both.

**Q2 — what it did not damage.** The subject is unchanged (`:389` still wraps the fixed `height: H` box at
`:390-406`), and `TutorialTarget`'s own `onLayout` → `invalidate` (`tutorialTargets.tsx:264-267`) is the
remaining re-measure path, which is the one `use-coach-mark.ts` is built on. `progress.tsx:241` still
invalidates on scroll, so the scroll-tracking behaviour V2-6 added is untouched. Nothing else read
`skiaReady` for measurement — its other uses (`:433`, `:520`, `:526`) are render gates and are unchanged.
The replacement docblock's claims check out: every `skiaReady`-gated node is either absolutely positioned
inside the fixed box (`:433-518`, all `position: 'absolute'` per `styles` at `:633-675`) or rendered after
`</TutorialTarget>` at `:522` (the footer `:523-527`, the legend `:529-589`).

**Q3 — nothing would catch it coming back**, and nothing needs to: re-adding the effect is a
no-op-plus-a-mount-time-`show`, and no spec observes either. `trajectory-interactivity.spec.ts` and
`vis5-cone.spec.ts` exercise the chart, not the registry.

---

### J1-4 · `TrajectoryChart.tsx:378-388` — the removed comment's twin is still in the JSX

**Verdict: `PARTIAL` · severity `minor` (no user-visible consequence, no instrument blinded).**

The docblock at `:162-175` was rewritten to say **"NO `skiaReady` RE-MEASURE"**. The *second copy* of the old
text, sitting immediately above `<TutorialTarget id="trajectory-scrub">`, was not touched and still reads
*"this does NOT move the subject or change the geometry. It only makes the measurement honest across a
content change the component already knows about"* (`:384-387`) — describing an effect that no longer exists,
200 lines from the comment that says it was deliberately removed. Its line references are stale too
(`:381` cites the footer at `:498` and the legend at `:504`; they are at `:520` and `:526`).

⚠️ This is the exact hazard `CoachMarkLayer.tsx:242-245` records paying for once — *"the render body carried
an explanation of a mechanism it does not implement, and the two copies could drift without either looking
wrong."* `scripts/check-comment-convention.ts` cannot see a contradiction between two comments, so nothing
catches it.

---

### J1-5 · `skia-ready.web.ts:63-68` — the rejection docblock

**Verdict: `CLOSED`.**

The E-5 finding was that *"removing it restores the hang"* is false. The replacement says the `catch` does
not change the gate, and that is what the code does: on rejection `setReady(true)` at `:87` is skipped with
or without the `catch`, and `loading ??=` (`:48`) caches the rejected promise so every later mount takes the
same path. What the `catch` buys — no unhandled rejection — is stated correctly, and the D-1 half that was
already right (`reportError`'s sink is dev-only, `reportError.ts:16-19`; `sentry.web.ts:7-9` is a no-op) is
preserved verbatim.

**One imprecision, not charged:** `loading ??=` only caches the failure when **`LoadSkiaWeb`** is what
rejected. If the rejection comes from `chunk?.()` (`:85`) then `loading` is resolved, and a later mount
re-runs the dynamic import, which can succeed. The sentence's subject is the documented wasm 404
(`canvaskit.ts:15-20`), where the claim is exactly right.

**Q3 — a docblock cannot be un-fixed by a gate.** Nothing pins it and nothing could.

---

### J1-6 · `strategy-compare.spec.ts:101-106` — the `s` flag reverted

**Verdict: `CLOSED`.**

**Q1 — the loosening is gone** (`/[A-Za-z]{3,}.*\.$/`, no flag), and the stated reason is true rather than
plausible: the takeaway is one string from `comparisonTakeaway` (`compareStrategies.ts:88-135` — every branch
returns a single line) rendered into one `<Text>` (`StrategyCompare.tsx:60-62`), which RNW emits as a single
text node, so `innerText()` cannot contain a `\n`. Soft wraps are not line breaks to `innerText`.

**Q2 — the assertion still catches what it was built for.** Against the historical defect string `"."` the
regex does not match, so the test fails — the P6.8.9.7.4 finding stays pinned. The absence assertion at
`:109` (`not.toMatch(/\$|interest|cheaper|save/i)`) is unchanged, so [D59]'s money guard is intact.

**Q3 — nothing stops the `s` flag being re-added**; the comment is the only guard. Acceptable: re-adding it
is a strictly-weaker assertion, not a false green about the app.

**Minor, recorded not charged:** the citation `[P6.8.9.7.11.9 · E-2]` at `:101` points at
`E-tests-claims.md`'s **E-2** (`earlyjourney.spec.ts`, `SOUND`); the finding it closes is **E-4**. The two
`D-` citations in this range (`CoachMarkLayer.tsx:63`, `TrajectoryChart.tsx:163`) are correct — they index
`D-coach-mark.md`'s **Severity order** list, not its hunk table.

---

## Job 2 — the major+ sweep

The table is in **severity order**; the sections below follow the order they were written in. `minor`
findings are deliberately absent.

| # | severity | site | one line |
|---|---|---|---|
| C-E | **`blocker`** | `projectDebtPayoff.ts:228-229`, `TrajectoryChart.tsx:271-275` | `setMonth` overflow names the debt-free month one month late for a 29th–31st paycheck date |
| C-A | **`major`** | `use-coach-mark.ts:60-65`, `DebtSheet.tsx:133` | closing the sheet does not dismiss its mark; the layer keeps the vanished subject's rect |
| C-B | **`major`** | `use-coach-mark.ts:73-79` | "Show feature tips again" cannot re-offer the two marks whose hosts are tabs |
| C-C | **`major`** | `CoachMarkLayer.tsx:133-141` | the once-ever record is written on "a rect exists", not "the callout is on screen" |
| C-D | **`major`** | `progress.tsx:262-266` | the hero's "to go" prints the ORIGINAL total, understating a grown portfolio |

---

### C-A · **`major`** — a sheet-hosted mark outlives its sheet: nothing dismisses it, and the layer keeps the vanished subject's coordinates

**User-facing consequence:** close the edit-debt sheet without tapping "Got it" and the "See the whole
payoff" hint stays active — reappearing over the Money list at the row's old coordinates, pointing at a
control that is no longer on screen — and while it is stuck there no other feature tip in the app can
appear for the rest of the session.

**Where the dismissal was supposed to come from, and why it cannot.** `use-coach-mark.ts:60-65` is the rule
*"a mark must not outlive the screen its subject is on"*, and it fires only on **blur**
(`if (isFocused) return;`). For `payoff-schedule` that hook is called inside the sheet
(`DebtSheet.tsx:133`), so:

- closing the sheet **unmounts the hook** — an unmount is not a blur, and the effect's cleanup does nothing;
- the tab underneath never blurred, so the condition it waits for never becomes true.

`coachMarks.dismiss()` (`coachMarks.ts:133-135`) is called from exactly two places —
`CoachMarkLayer.tsx:345` ("Got it") and that blur effect — plus `addSuppressor` (`:143`) and
`resetCoachMarks` (`:177`). `FormSheet`'s host teardown (`CoachMarkLayer.tsx:56-59` →
`coachMarks.ts:162-165`) only decrements `hosts`. So `active` survives the sheet.

**What is then rendered.** The root layer never stood down from *measuring* — only from drawing (`:219`) and
from the reveal (`:183`). Its rect effect (`:61-89`) ran when `active` was set and holds a `TargetRect` for
the row; the scroll-driven re-measure at `:112-114` writes `setRect(r)` only `if (r)`, so a later `null`
(the subject is unregistered on unmount, `tutorialTargets.tsx:118-124`) **cannot clear it**. The moment
`hosts` falls to 0 the render guard opens and the callout draws at the stale rect, and the verdict effect
(`:133-141`) reports `DREW`.

**Two shapes, both reachable:**

- **iPad, always visible.** The Money detail pane uses `inline` (`money.tsx:425`), and
  `FormSheet.tsx:80-113` renders **no** nested layer for that branch — so `hosts` is 0 throughout, the root
  layer drew the callout at the row's real on-screen position, and closing the pane leaves it floating there
  over the list.
- **iPhone Modal.** The root layer's rect is whatever the last `invalidate` gave it. If the subject
  re-laid out at any point while seated — the keyboard opening resizes the sheet through
  `KeyboardAvoidingView` (`FormSheet.tsx:124`), which re-lays the pinned footer row out and fires
  `TutorialTarget`'s `onLayout` → `invalidate` (`tutorialTargets.tsx:264-267`) — the stray callout is
  on-screen. If it never did, the rect is the pre-spring transient (measured at **y=1702 on a 956 pt
  screen**, `use-sheet-presentation.ts:35-37`) and the callout draws off the bottom: invisible, and
  `active` is still stuck, which refuses every subsequent `show()` (`coachMarks.ts:92`).

**Not the same finding as `.11.9` D-2.** That one is the *nested* layer calling `requestReveal`, and it was
filed. This is `active` never being cleared, which that pass read as intended (*"when the sheet closes and
`hosts` falls to 0 … a still-active root mark gets its reveal"*, `D-coach-mark.md:70-72`).

**Nothing tests it.** `coach-marks.spec.ts` never closes the sheet in any of its five tests; the closest
(`:89-97`) navigates away to `/schedule/d0`, which also unmounts the hook without blurring, and asserts only
the URL.

### C-B · **`major`** — "Show feature tips again" does not bring back the two marks that live on tabs, and the app says it will

**User-facing consequence:** after tapping "Show feature tips again" the app answers *"Tips will appear again
as you go."*, and two of the three tips — the Progress scrub hint and the iOS debt-row hint — will not
appear again in that session no matter where the user goes, because the hook that offers them latched on
its first attempt and never re-arms.

**The third latch.** `resetCoachMarks()` (`coachMarks.ts:175-182`) clears both records it knows about, and
its own docstring names the failure it is guarding: *"resetting only the pref would produce a replay entry
that appears to do nothing."* There is a **third** record it does not reach —
`use-coach-mark.ts:73-79`:

```
let asked = false;
const unsubscribe = targets.subscribe((laidOut) => {
  if (asked || laidOut !== id) return;
  asked = true;
  coachMarks.getState().show(id);
});
```

`asked` is a closure local, re-created only when the effect re-runs — deps `[id, ready, targets]`
(`:81`). After the reset:

- **`id`** is a literal;
- **`ready`** is a literal `true` for `trajectory-scrub` (`progress.tsx:97`), and for `debt-row-actions` it
  is `Platform.OS === 'ios' && view.order.length > 0` (`money.tsx:258`), which is stable once the store has
  hydrated;
- **`targets`** is the provider's memo (`tutorialTargets.tsx:185-188`); the only dep that ever moves is
  `activeId`, and the only caller of `setActiveId` is Today's walkthrough overlay (`index.tsx:1035-1039`);
- and the host screens are **tabs, which do not unmount** — `progress.tsx:135-141` states this, measured:
  *"`_layout.tsx` sets no `unmountOnBlur`, so this effect's cleanup never runs."* More is a pushed route, so
  going to More and back re-mounts nothing.

So the subscription created at first launch survives the reset with `asked === true`, and every later
`invalidate` — including the one Progress fires on **every scroll frame** (`progress.tsx:241`) — is dropped
at the first clause. `payoff-schedule` is the one mark that does come back, because its host
(`DebtSheet.tsx:133`) is re-created each time the sheet opens.

**Why this survived review.** The store layer genuinely works, and is tested: `coachMarks.test.ts:78-83`
asserts `show()` is accepted again after `resetCoachMarks()`. The e2e that claims the user-facing behaviour
(`coach-marks.spec.ts:72-87`, *"More → Show feature tips again brings a seen mark back"*) exercises the
**only** mark whose host remounts, so it passes over the class it is named for. ⚠️ Per the brief's second
calibration, that is itself the `major` half of this finding: the instrument that exists to catch "the
replay silently no-ops" cannot see it for two of three marks.

**Not self-correcting within the session.** The pref and the session set are both cleared, so the marks do
return on the next cold start — but "as you go" (`more.tsx:245`) is a claim about *this* session, and the
row exists precisely because *"without a way back the whole discovery layer is a one-shot a user can lose to
a mis-tap"* (`more.tsx:231-234`).

### C-C · **`major`** — the once-ever record is written when a rect resolves, not when the callout is on screen, so "drawn into the void" is still spendable

**User-facing consequence:** a user can permanently lose the "See the whole payoff" tip without ever seeing
it, because it is marked seen the instant the subject is measured — including at the off-screen position the
sheet reports while it is still animating up.

**The claim, and the code under it.** `coachMarks.ts:112-125` states the guarantee outright:

> THE ONCE-EVER RECORD IS WRITTEN WHEN THE CALLOUT ACTUALLY DRAWS, not when it is offered … run
> 31700074087 measured `payoff-schedule` at **y=1702 on a 956pt screen** … so the mark was recorded as seen
> and then drawn where nobody could ever see it. **Offered ≠ shown** … What no longer counts is
> drawn-into-the-void.

The implementation is `CoachMarkLayer.tsx:133-141`. `DREW` is `!stoodDown && rect && COACH_MARKS[active]`
— three facts, none of which is *"the callout is inside the viewport"*. `rect` is whatever the first
`measure()` returned (`:77-85`), and in the sheet case that first measurement **is** the y=1702 transient:
the subject lays out while the sheet is a full sheet-height below its seated position
(`use-sheet-presentation.ts:31-38`), which is the entire reason `remeasureOn`/`settled` exists. So on the
run the docblock cites, the current code records the mark at the same instant and the same coordinates the
old code did. The write moved from `show()` to the layer; the *void* it was supposed to exclude was never
excluded.

**What actually saves the user today is a different fix** — `FormSheet.tsx:192`'s `remeasureOn={settled}`
re-measures the seated rect a few hundred ms later and the callout is redrawn where it can be seen. That is
a race the record does not wait for. Anything that ends the sheet inside that window spends the hint:
closing it, swiping it down, or tapping the very row the hint points at (`debt-view-schedule`,
`DebtSheet.tsx:292` — the flow `coach-marks.spec.ts:89-97` performs).

**Why `major` and not `blocker`.** On the common path the corrected draw does land and the user does see the
hint; the loss needs the sheet to end inside the entrance window, or a layout where the seated callout is
still off-screen (on react-native-web it is — measured 392 pt below the fold,
`coach-marks.spec.ts:35-37`). It is a permanent loss of a once-ever moment when it happens, but it does not
happen on every first edit.

**Nothing tests it, and one thing looks like it does.** `coach-marks.spec.ts:44-62` asserts the mark is
offered and `:64-70` that a seen mark stays away — neither observes whether the callout was ever within the
viewport when the record was written. `toBeVisible()` cannot carry it (the spec says so itself at `:39-41`),
and the one viewport-aware assertion in the file (`:130`) is in a different test that never inspects
`coachMarksSeen`.

**Cheapest honest fix, for the record:** gate `markDrawn` on the same viewport test the reveal already
computes — the callout's `top` plus its measured height against `winH - insets.bottom` — rather than on the
existence of a rect.

### C-D · **`major`** — the Progress hero's "to go" is the ORIGINAL total, so a portfolio whose balances have grown is told it owes less than it does

**User-facing consequence:** a user whose balances have risen since they entered them and who has not yet
paid anything down is shown *"$5,000 to go"* on the Progress hero while they actually owe $5,400 — the app
understates their debt by exactly the amount it grew.

**The line**, `progress.tsx:262-266`:

```
{totalPaid > 0 ? `${formatWhole(totalPaid)} of ${formatWhole(totalOriginal)} paid` : `${formatWhole(totalOriginal)} to go`}
```

with `totalOriginal = Σ (d.originalBalance ?? d.balance)` (`:193`), `totalCurrent = Σ d.balance` (`:194`)
and `totalPaid = Math.max(0, totalOriginal - totalCurrent)` (`:195`).

**Why the two diverge.** `originalBalance` is stamped once, when the debt is created
(`DebtSheet.tsx:184`, `:209`) or backfilled for a legacy blob
(`data/legacyBridge/originalBalance.ts:20-21`), and **no edit path updates it** — `grep -rn
"originalBalance" apps/rn/src` finds no writer outside creation and migration. So a card whose balance the
user revises upward (interest, new spending — the ordinary life of revolving debt) has
`balance > originalBalance`. When that is true of the portfolio as a whole, `totalPaid` clamps to `0` at
`:195` and the branch that fires is the one that prints **`totalOriginal`** under the label **"to go"**.

The intent is stated at `:263` — *"early on, lead FORWARD (the remaining as a goal) instead of a deflating
'$0 paid'"* — so "to go" means *remaining*, and remaining is `totalCurrent`, not `totalOriginal`. The two
are equal in the case the branch was written for (a new user who has paid nothing) and diverge in exactly
one direction: the app never overstates the debt, only understates it.

**Reachability.** It needs the portfolio to be net-unpaid-down, because any cleared or paid-down debt makes
`totalPaid > 0` and switches to the other branch (cleared debts stay in `store.debts` with `balance: 0`,
`models.ts:219-222`). So: a user in their first cycles who refreshes a balance upward before logging a
payment. Money shows the true current total on the same data, so the two tabs disagree.

**Nothing tests either number.** No spec or unit test references `totalOriginal` or the hero's paid line;
`hero-date-fit.spec.ts` pins the date beside it, not the figure below it.

⚠️ **Possible overlap with cluster B** (money), which owns the money surfaces; filed here because
`progress.tsx` is this cluster's sweep and no round has filed it. **I did not rate it `blocker`** because the
figure shown is the user's own original total rather than a fabricated number, and it can only ever be
smaller than the truth by the growth since entry — but it is a false statement about their remaining debt,
and if 🎯 reads "to go" as a hard claim about money, blocker is defensible.

### C-E · **`blocker`** — every date on the Progress screen is `setMonth`-overflowed, so a user paid on the 29th–31st is shown a debt-free month one month later than the plan computes

**User-facing consequence:** a user whose paycheck date is the 31st can be told **"DEBT-FREE March 2026"**
on the Progress hero when their own plan clears in February — and the same one-month lie appears on the
chart's end pill, the legend dates, the scrub readout and both strategy-comparison columns.

**The mechanism, which this repo has already measured once.**
`packages/core/recurrence/rolloverPayCycle.ts:19-23` carries the finding in its own comment:

> Advance a date by whole months, **clamping the day to the target month's last day (Jan 31 + 1mo -> Feb 28,
> NOT Mar 3 via `setMonth`'s overflow)**.

That clamp was written for the due-date path (`V15_FUNCTIONAL_AUDIT.md:85-88`, finding F1) and **was never
applied to the two places the Progress screen gets its dates from:**

| site | what it labels |
|---|---|
| `packages/core/debt/projectDebtPayoff.ts:228-229` | `estimatedDebtFreeDate` → `planSelectors.ts:114-122` → `payoffSelectors.ts:90` → the hero (`progress.tsx:261`), the end pill (`TrajectoryChart.tsx:486-489`), the "Your plan" legend date (`:553`), the Safe-floor date (`:569`) |
| `apps/rn/src/components/payoff/TrajectoryChart.tsx:271-275` (`monthDate`) | the scrub readout (`:508`), the minimum-payments date (`:306-310`), the fallback month ticks (`:291`), and every date in `StrategyCompare` (`:626` → `StrategyCompare.tsx:89,100`) |

Both do `new Date(`${startDate}T00:00:00`)` then `d.setMonth(d.getMonth() + n)`, and `startDate` is
`store.paycheck.currentDate` (`planSelectors.ts:118`, `progress.tsx:300`). When the target month is shorter
than the start day, JS normalises the overflow forward: **Jan 31 + 1 month = Mar 3**, and
`formatMonthYear` (`projectDebtPayoff.ts:54-56`) prints month + year only, so the whole three-day overflow
shows up as a **different month**.

**How often.** For a start day of 31, five of the twelve target months are short (Feb, Apr, Jun, Sep, Nov),
so ~40 % of possible payoff months are named one month late. For the 30th or the 29th it is February. A
monthly payer on the last day of the month sits on a 31st in seven months of the year, and a
biweekly/weekly payer's `currentDate` walks through every day of the month, so this is a recurring state,
not an edge case. The error is always in the same direction: **later than the truth.**

**Why `blocker`.** The debt-free date is the app's headline claim about the user's own plan, it is stated as
a fact, and it is wrong. ⚠️ **Calibration, stated so it can be knowingly downgraded:** the error is bounded
to exactly one month, always pessimistic, and only for paycheck dates on the 29th–31st — if 🎯 reads
"one month late on ~10 % of days" as *misleading* rather than *false*, `major` is the defensible
alternative. No data is lost and nothing else is corrupted.

**Nothing tests it.** `trajectory-domain.spec.ts` and `trajectoryDomain.test.ts` own the x-domain, not the
labels; no test in `apps/rn` or `packages/core` seeds a `currentDate` on the 29th–31st and asserts a month
name. The clamp helper that would fix it already exists and is already tested — it is simply not called
here.

⚠️ **Cluster overlap:** `projectDebtPayoff.ts` is engine code and may belong to cluster B. It is reported
here because the Progress screen is where the wrong month is shown and `TrajectoryChart.tsx`'s own copy of
the bug is squarely in this sweep.

### Swept and clean at the `blocker`/`major` bar

Stated plainly, because "nothing found" is a result:

- **`store/coachMarks.ts`** — the suppressor count, its idempotent release (`:144-159`), the once-per-run
  `shown` set and the `seenPref` read from the REAL store (`:105-106`) all do what they claim. **No blocker
  or major found.** *(One latent asymmetry, not charged: `addHost` (`:162-165`) has no `released` guard
  where `addSuppressor` (`:144-149`) does and documents why. It is unreachable today — only one host can
  exist, since a sheet is never presented over a sheet — and `Math.max(0, …)` only protects the negative
  side, so a second host would matter if one ever existed.)*
- **`store/tutorialTargets.tsx`** — `measure`'s 500 ms timeout and 0×0 rejection (`:126-149`), the
  ref-held listener set, the `laidOut` replay and its clearing on unregister (`:118-124`) hold together.
  **No blocker or major found.**
- **The touch model of the callout** — `wrap` `box-none` (`CoachMarkLayer.tsx:268`), card `box-none`
  (`:301`), sentence `pointerEvents="none"` (`:336`), dismiss live with `hitSlop` (`:340-351`). The
  promise *"the control stays live underneath"* is honoured on web, and `coach-marks.spec.ts:115-183` is a
  real hit test rather than a click that happened to work. **No blocker or major found.** The screen cannot
  be trapped: there is no scrim, nothing is fenced, and "Got it" is a 44 pt target.
- **`progress.tsx`'s scroll host** — `registerScrollHost` is now focus-gated (`:147-159`), `onScroll` runs
  at `scrollEventThrottle={16}` (`components/screen.tsx:98`) so `offsetRef` cannot be stale when
  `scrollTo` computes an absolute offset, and the reveal is `animated: false` deliberately. **No blocker or
  major found.** *(The first-render mis-tap this reveal can cause is already filed —
  `strategy-compare.spec.ts:33-37`, → P6.14.)*
- **`components/payoff/WhatIfControls.tsx` and `StrategyCompare.tsx`** — the slider max never shrinks under
  a drag, the typed field is digits-only, no dollar claim is made in the comparison. **No blocker or major
  found.** *(`StrategyCompare.tsx:93` keys rows on `strategy-name-month`, which two identically-named debts
  clearing in the same month would collide on: a React key warning, `minor`.)*

### What I could not determine

- **Whether `onLayout` re-fires on iOS for a node whose own frame did not change** — J1-2's mechanism.
  It is settled on react-native-web by reading `useElementLayout`'s ResizeObserver;
  on iOS it follows from RN dispatching layout events on metric changes, but it is device-owed to confirm.
  If iOS *does* re-fire, J1-2 is web-only and drops to `minor`.
- **Whether the seated `payoff-schedule` callout is on screen on device** — the pinned frames
  (`apps/rn/capture-ref/phase35/<theme>/coach-payoff-schedule.png`) say yes; web cannot answer it
  (`coach-marks.spec.ts:35-41`), which is what leaves C-C's loss window unmeasured rather than merely
  narrow.
- **Anything about VoiceOver.** C-A's stuck `active` leaves a live `accessibilityRole="alert"` in the tree
  (`CoachMarkLayer.tsx:332-336`); whether an off-screen alert is announced is an iOS question no harness
  here can answer.
- **No gate or suite was run**, per the brief, so every "nothing would catch it" is derived from reading the
  specs' assertions rather than from a red run.

### Tally

| severity | Job 1 | Job 2 |
|---|---|---|
| `blocker` | 0 | 1 (C-E) |
| `major` | 1 (J1-2) | 4 (C-A · C-B · C-C · C-D) |
| `minor` | 2 (J1-4, J1-6's citation) | not reported, per the brief |

Job 1 verdicts: 3 `CLOSED` · 1 `CLOSED-UNPINNED` · 1 `PARTIAL` · 1 `WRONG-REMEDY`.

