# Guardian Tutorial — Audit Gate 3.5.3.9 · ROUND 8 · the four lens reports (verbatim)

_Round 8 ran 2026-08-04 on Opus 5, four rotated lenses. The session that ran it was lost before the reports were written up; these are recovered verbatim from the subagent transcripts so the FIX / PROOF / COMPLETENESS-QUERY detail behind each finding survives. Consolidated verdict + fold scope → DEBT_TUTORIAL_AUDIT_2026-08-02.md §Q._

**Round 8 = the LAST sweep round.** Per [[feedback_audit_rounds_fixed_goalposts]] (Jason 2026-08-04) the lens rotation is now closed; round 9 onward is a locked regression gate against exactly this list.

---

# LENS A — round-7 delta correctness

## VERDICT: DOES NOT PASS

Round 7's fold contains at least three defects, two of them in the code the commit messages present as *the* fix: the rotation gate (`settledDims`) is a one-frame no-op that does not do what its comment claims, and the degrade-in-place verdict is wiped by any dock relayout — which on a degraded beat forms a self-sustaining copy/announcement oscillation. Neither is observable by any test in the repo: `subjectMissing`, `bodyIfNoSubject` and `unmeasurableFor` appear in **zero** tests outside the 8 pure assertions on the predicate itself.

---

## Findings, worst first

### 1. The degrade verdict is retracted by every dock relayout — copy flips under the user, and can oscillate · SHOW-STOPPER · CONFIRMED

`apps/rn/src/hooks/use-spotlight.ts:78-80`

```ts
    // A new beat: nothing has been proven about this subject yet, so retract any previous verdict.
    setUnmeasurableFor(null);
```

This sits at the top of an effect whose dependency array is `[targetId, targets, stageTop, stageBottom, scrollRef, offsetRef, revision, reduceMotion]` (`use-spotlight.ts:141`). The comment says "a new beat" — but `revision` is `` `${index}:${dockH}:${payoffShowing}` `` (`index.tsx:748`) and `stageBottom` is `screenH - dockH - spacing.sm`. **Two of the eight deps carry `dockH`**, which is published by the overlay's dock `onLayout` (`TutorialOverlay.tsx:265`) → `shell.setDockH` (`TutorialCoach.tsx:53`). So the retraction fires on every dock height change, not on every beat.

The feedback path is closed:

- `subjectMissing` → `body={stepBody(step, run, shell.subjectMissing)}` (`TutorialCoach.tsx:46`)
- `bodyIfNoSubject` is a *different-length string* — beat 3: 100 chars → 111 chars (`tutorialPath.ts:126,129`); beat 4: 197 → 182 (`tutorialPath.ts:147,150`)
- different wrap count → different dock height → `setDockH` → new `revision` → effect re-runs → `setUnmeasurableFor(null)` → `subjectMissing` false → original copy returns → dock height reverts → …

**Failure scenario.** Beat 3's `guardian-adjust` genuinely isn't rendered. The dock degrades to "…you can move it whenever you like." The dock reflows one line taller. `revision` bumps, the verdict is wiped, and the dock reverts to "Open it and move the line" — pointing at nothing, which is the exact lie [D15] was written to remove. ~1.1s later (500ms measure timeout + 120ms retry + 500ms) the verdict returns and it flips back. Forever. And because `useAnnounceBeat`'s deps include `subjectMissing` (`TutorialOverlay.tsx:68`), **VoiceOver re-announces the entire beat on every flip and never finishes a sentence.**

The mid-read flip is CONFIRMED unconditionally (any dock relayout — Dynamic Type change, rotation, keyboard — wipes a standing verdict). The self-sustaining loop is CONFIRMED as a mechanism and certain at large Dynamic Type; at default type on a 375pt screen the two strings may land on the same line count, which is the only thing standing between this and a permanent flicker.

**1. FIX** — retract on subject change only, and clear on success where the reset used to cover it.

`use-spotlight.ts:78-80` — delete those three lines from the main effect body. Insert immediately above the main effect (before line 69's `useEffect`):

```ts
  // Retract the verdict when the SUBJECT changes — NOT on every effect re-run. `revision` carries
  // `dockH` and `stageBottom` carries it too, so keyed on the whole dep list a dock relayout wiped a
  // standing verdict mid-beat and flipped the copy back to an ask the user cannot perform.
  useEffect(() => {
    setUnmeasurableFor(null);
  }, [targetId]);
```

`use-spotlight.ts:102-106` — the success branch relied on the deleted reset; make it explicit:

```ts
      if (Math.abs(delta) < 1) {
        setRect(first);
        setSettling(false);
        setUnmeasurableFor(null);
        return;
      }
```

**2. PROOF IT LANDED** — `npm run test:app` cannot see this: `apps/rn` has no hook runner. The observable proof is Playwright, and it needs a harness affordance that does not exist (no scenario renders beat 3 without `showAdjust`). **State plainly: the harness genuinely cannot observe this today.** The runnable half is a pure reducer extracted into `spotlightPolicy.ts` alongside the existing predicates:

```ts
export function verdictAfterEffectRun(a: { prev: MeasureVerdict; targetId: string | null; subjectChanged: boolean }): MeasureVerdict {
  return a.subjectChanged ? null : a.prev;
}
```
with an assertion in `spotlightPolicy.test.ts` that a re-run with the same `targetId` preserves a standing verdict. RED before (the current inline `setUnmeasurableFor(null)` has no equivalent), GREEN after. The wiring still goes unasserted — which is the same structural hole that shipped the round-6 show-stopper.

**3. COMPLETENESS QUERY** — the class is "a `useSpotlight` state write whose reset is keyed on more than the thing it describes":

```bash
rg -n 'setUnmeasurableFor|setSettling|setRect' apps/rn/src/hooks/use-spotlight.ts
```
must show every write reachable from a dep list that contains only `targetId`/`targets` for the *reset*, and `revision`-carrying deps only for *measurement*. Broader, and the one that must return ZERO:

```bash
rg -n 'revision' apps/rn/src/hooks/use-spotlight.ts | rg -v 'measure|re-measure|deps'
```
i.e. no verdict/policy state may be keyed on `revision`.

---

### 2. The rotation gate reopens on the same commit it closes — round 7's `settledDims` fix is a no-op past one frame · MAJOR · CONFIRMED

`apps/rn/src/app/(tabs)/index.tsx:805-811`

```ts
  const dims = `${Math.round(screenW)}x${Math.round(screenH)}`;
  const [settledDims, setSettledDims] = useState(dims);
  useEffect(() => {
    if (spotlight) setSettledDims(dims);
  }, [spotlight, dims]);

  const screenReachable = interactive && !payoffShowing && settledDims === dims;
```

The commit message claims: *"`screenReachable` now also requires a rect measured under the CURRENT dimensions"*, and the in-file comment: *"Fencing until a rect lands under the current dimensions closes the window."* **The code never checks that the rect was measured under the current dimensions.** It checks only that *some* rect is non-null — and `dims` is in the dep array, so a dimension change *itself* re-runs the effect.

**Trace, on rotation / iPad Split-View drag, beat 3:**
1. `useWindowDimensions` updates → render with new `dims`. `settledDims` still old → `screenReachable` false. **One render of protection.**
2. Passive effects: deps `[spotlight, dims]` changed (via `dims`), `spotlight` is the **pre-rotation, stale** rect → `setSettledDims(dims)`.
3. Re-render: `settledDims === dims` → `screenReachable` **true**, with the stale rect still published.

Meanwhile the overlay's `origin` has already updated on its own layout pass (`TutorialOverlay.tsx:139` `onLayout={measureOrigin}`), so `local = spotlight − origin` (`TutorialOverlay.tsx:144`) is `staleRect − newOrigin`, and `Scrim`'s `hit` geometry (`TutorialOverlay.tsx:405`) cuts the *blocking* hole there. That is precisely the hazard described — an open touch hole over whatever now occupies the region — and the a11y fence (`a11yHidden(!screenReachable)`, `useInert(fenceRef, !screenReachable)`, `index.tsx:830,870`) reopens with it. The fix's own comment says the a11y fence "closes with it"; it reopens with it too.

**1. FIX** — record the dims *at publish time*, not at render time. Remove `dims` from the dep array so the effect fires only when a **new rect object** is published (`measure` always resolves a fresh object; `sameRect` at `use-spotlight.ts:175` only suppresses identity change on the layout-subscriber path, and the main effect re-runs on rotation anyway because `stageBottom` depends on `screenH`).

`index.tsx:807-809`, replace with:

```ts
  // Deliberately NOT keyed on `dims`: this must stamp the dims that were current WHEN THE RECT LANDED.
  // With `dims` in the deps, a rotation re-ran this effect with the STALE rect and re-opened the fence
  // on the same commit that closed it — one render of protection, which is none.
  useEffect(() => {
    if (spotlight) setSettledDims(dims);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlight]);
```

**2. PROOF IT LANDED** — this one *is* e2e-observable. New case in `apps/rn/tests/e2e/tutorial-invite.spec.ts`, on the pattern of the existing `page.goto('/tutorial')` + step-to-beat-3 helpers:

```ts
test('rotation fences the screen until a rect lands under the new dimensions', async ({ page }) => {
  await page.goto('/tutorial'); // step to beat 3 ('Your line') as the existing beat-3 tests do
  await expect(page.getByTestId('tutorial-spotlight')).toBeVisible();
  const before = await page.getByTestId('tutorial-scrim-blocker').first().boundingBox();
  await page.setViewportSize({ width: 812, height: 375 });      // rotate
  // the hit-hole must be COLLAPSED (all four blockers meeting) until a fresh rect lands
  await expect
    .poll(async () => (await page.getByTestId('tutorial-spotlight').count()))
    .toBe(0);            // ring hidden while stale
  expect(before).not.toBeNull();
});
```
The load-bearing assertion is on the **blocker** layer, not the band layer — `Scrim` deliberately separates them (`TutorialOverlay.tsx:428-433`). RED today (blockers keep the stale hole open one tick after the viewport change); GREEN after.

**3. COMPLETENESS QUERY** — the class is "geometry-staleness gate whose invalidation signal is also its refresh signal":

```bash
rg -n 'useEffect\(' -A4 'apps/rn/src/app/(tabs)/index.tsx' | rg -n 'setSettled|settledDims|dims'
```
must show `dims` appearing in the effect **body** and never in its dep array. Class-level, across the feature:

```bash
rg -n 'useWindowDimensions|screenW|screenH' apps/rn/src/components/plan/TutorialOverlay.tsx apps/rn/src/app/\(tabs\)/index.tsx apps/rn/src/hooks/use-spotlight.ts
```
every hit must be either (a) pure layout, or (b) paired with a published-rect stamp. `TutorialOverlay.tsx:377` (`Scrim`'s `anchor` seeded from `winW/winH`) is a second, unaudited consumer of the same signal.

---

### 3. The verdict is never retracted when the subject *arrives* late · MAJOR · CONFIRMED (by inspection of the write sites)

`apps/rn/src/hooks/use-spotlight.ts` — the three write sites are lines 80 (reset), 97 (first-miss), 127 (settle). The **layout subscriber** (lines 155-177) is the fourth path by which a rect can appear, and it publishes a rect without touching the verdict:

```ts
        if (next === null) return;
        setRect((prev) => (sameRect(prev, next) ? prev : next));
```

**Failure scenario.** A subject registers in a commit *after* the beat's measure concluded (`register` is a ref callback — `tutorialTargets.tsx:187-190`), so `has(id)` was legitimately false and the verdict was set. The subject then lays out → `invalidate` → the subscriber measures → a rect lands → the ring is drawn and (on an interactive beat) the touch hole opens over the real control — **while `subjectMissing` is still true and the dock says the control isn't there.** VoiceOver was already re-announced with the degraded copy and is never corrected.

Today this is masked only by the unconditional reset at line 80 — the very line finding #1 requires removing. **The two findings are coupled: fixing #1 without this one makes this reachable on every beat.**

**1. FIX** — `use-spotlight.ts:174-175`, inside the subscriber, before the `setRect`:

```ts
        if (next === null) return;
        // A rect landed: whatever this hook previously concluded about the subject is now false.
        setUnmeasurableFor(null);
        setRect((prev) => (sameRect(prev, next) ? prev : next));
```

**2. PROOF IT LANDED** — not observable by `npm run test:app` (hook). Extract the invariant to `spotlightPolicy.ts` and assert it there:

```ts
/** A verdict cannot coexist with a rect for the same subject. */
export function verdictAfterRect(a: { prev: MeasureVerdict; rect: unknown | null }): MeasureVerdict {
  return a.rect ? null : a.prev;
}
```
with `assert(verdictAfterRect({ prev: 'guardian-adjust', rect: {x:0,y:0,width:1,height:1} }) === null, 'a rect that lands retracts the verdict for its subject')`. RED before (no such function), GREEN after — and it makes the invariant a thing a reviewer can *read*, which is the whole reason `spotlightPolicy` exists.

**3. COMPLETENESS QUERY** — the class is "a state that publishes a rect without reconciling the verdict":

```bash
rg -n 'setRect\(' apps/rn/src/hooks/use-spotlight.ts
```
Every hit that can set a **non-null** rect must be adjacent to a `setUnmeasurableFor(null)`. Today: 3 non-null `setRect` sites (lines 103, 124, 175), 2 of which reconcile. That ratio is the finding.

---

### 4. `suspendStoryOnBackground` leaves the beat unretryable, and its own comment says otherwise · MINOR · CONFIRMED

`apps/rn/src/store/tutorialSession.ts:84-96`

```ts
 * Cancelled rather than deferred, deliberately. `goTo` re-seeds the beat and restores the attestation
 * control, so the user simply taps again; resuming half a narration is worse than restarting it.
 */
export function suspendStoryOnBackground(): void {
  clearStoryTimers();
}
```

The **throw** half of the audit item is clean: `clearStoryTimers()` is `storyTimers.forEach(clearTimeout); storyTimers = []` — no throw path, and it is called *after* `flushPendingSave()` inside the same `try` (`_layout.tsx:88-91`), so it cannot preempt the flush. **DISPROVED.**

The **coherence** half is not. If backgrounding lands after the 900ms `scriptSurprise` but before the rollovers, the sandbox holds a walkback ack. On resume: `payoffShowing = !!selectReserveWalkback(...)` is true (`index.tsx:733`), so `targetId` becomes `'today-ack'` and `screenReachable = interactive && !payoffShowing && …` is **false** — the screen is fenced and inert (`index.tsx:830,870`). The attestation control is neither restored nor reachable. "The user simply taps again" is false: the only routes out are Next (losing the beat's payoff) or Back-then-Next, which `goTo` → `stageBeat` re-seeds. `acted` is also true, so the beat cannot even degrade.

**1. FIX** — design choice; **recommend: re-seed the beat on cancel rather than freezing its wreckage.** `tutorialSession.ts:94-96`:

```ts
export function suspendStoryOnBackground(): void {
  clearStoryTimers();
  const s = tutorialSession.getState();
  // …and put the beat back where the story started, so the user returns to an askable beat rather than
  // to a half-played one whose control is fenced behind its own payoff.
  if (s.active) s.goTo(s.index);
}
```
(`goTo` already calls `clearStoryTimers()` and `stageBeat(index)`; the explicit clear stays because `goTo` no-ops when `!active`.)

**2. PROOF IT LANDED** — `apps/rn/tests/e2e/tutorial-invite.spec.ts`, alongside the existing `'skipping mid-story does not leave rollovers landing afterwards'` case (line 355), which is the closest neighbour:

```ts
test('backgrounding mid-story returns the beat to an askable state', async ({ page }) => {
  await page.goto('/tutorial'); // step to beat 4, tap the attestation
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByTestId('tutorial-scrim-blocker')).toHaveCount(4);
  await expect(page.getByText(/bills are all in|all in/i)).toBeVisible(); // the control is back
});
```
Caveat worth stating: web has no RN `AppState` background transition, so this asserts the *reducer* path only unless a test hook calls `suspendStoryOnBackground()` directly. If that hook isn't added, **the harness cannot observe this** and it is device-QA-owed.

**3. COMPLETENESS QUERY** — the class is "a cancellation path that leaves a beat in a state with no forward affordance":

```bash
rg -n 'clearStoryTimers\(\)' apps/rn/src/store/tutorialSession.ts
```
Five call sites are documented at line 72-76 (beat change, `end()`, `cancelReserveStory()`, top of `playReserveStory()`, and now background). Every one that is *not* immediately followed by a re-stage must be justified — today only `end()` qualifies.

---

### 5. The `no-restricted-syntax` selector is bypassed by a string-literal key · MINOR · CONFIRMED

`apps/rn/eslint.config.mjs:39-41`

```js
          selector:
            "JSXAttribute[name.name='accessibilityElementsHidden'], JSXAttribute[name.name='importantForAccessibility'], Property[key.name='accessibilityElementsHidden'], Property[key.name='importantForAccessibility']",
```

`Property[key.name=…]` matches only an `Identifier` key. `{ 'accessibilityElementsHidden': true }` has a `Literal` key with `value`, not `name` — **not matched**, and neither is `{ ['accessibility' + 'ElementsHidden']: x }`. Spread of an object literal (`{...{accessibilityElementsHidden: f}}`) **is** caught, since the inner `Property` still has an Identifier key — **that sub-suspicion is DISPROVED.**

Two scope gaps compound it: the block is `files: ['**/*.{ts,tsx}']` (a `.js`/`.jsx` source would be unlinted — none exist today, verified), and `globalIgnores` excludes `tests/**` and `core/**`.

**1. FIX** — `eslint.config.mjs:39-41`, replace the selector:

```js
          selector:
            "JSXAttribute[name.name=/^(accessibilityElementsHidden|importantForAccessibility)$/], Property[key.name=/^(accessibilityElementsHidden|importantForAccessibility)$/], Property[key.value=/^(accessibilityElementsHidden|importantForAccessibility)$/]",
```
esquery supports regex attribute values, and adding the `key.value` arm closes the literal-key form. Computed/concatenated keys remain expressible — say so plainly rather than claiming totality; that overclaim is the pattern this gate has now caught repeatedly.

**2. PROOF IT LANDED** — RED-before/GREEN-after by construction: add to any linted `src` file, temporarily, `const p = { 'accessibilityElementsHidden': true };` and run `npm run lint:rn`. Today: clean (the bypass). After: one error. Then revert.

**3. COMPLETENESS QUERY** — this one is genuinely class-closing:

```bash
rg -n "accessibilityElementsHidden|importantForAccessibility" apps/rn/src apps/rn/tests --glob '!apps/rn/src/utils/a11y.ts'
```
must return ZERO. Note it must include `tests/`, which `globalIgnores` puts outside the linter's reach — so the grep is strictly stronger than the rule, and both are needed.

---

### 6. `bodyIfNoSubject` silently outranks `bodyByRun` · MINOR (latent) · CONFIRMED

`apps/rn/src/store/tutorialPath.ts:81-84`

```ts
export function stepBody(step: TutorialStepDef, run: TutorialRun, subjectMissing = false): string {
  if (subjectMissing && step.bodyIfNoSubject) return step.bodyIfNoSubject;
  return step.bodyByRun?.[run] ?? step.body;
}
```

No current beat declares both (`bodyIfNoSubject` on `line`/`reserve`; `bodyByRun` on the finale), so it is inert today. But the precedence is undeclared and untested: a future interactive beat with audience-specific copy would silently lose it — the exact per-audience drift the function's own doc comment at line 76-79 says it exists to prevent.

**1. FIX** — design choice; **recommend: compose rather than override**, since the audience distinction is the one the doc calls load-bearing. `tutorialPath.ts:81-84`:

```ts
export function stepBody(step: TutorialStepDef, run: TutorialRun, subjectMissing = false): string {
  const base = step.bodyByRun?.[run] ?? step.body;
  return subjectMissing && step.bodyIfNoSubject ? step.bodyIfNoSubject : base;
}
```
…which is behaviourally identical today, so the real fix is the **assertion** below that pins the intended precedence before a beat exercises it.

**2. PROOF IT LANDED** — `npm run test:app`, in `apps/rn/src/store/tutorialPath.test.ts`:

```ts
const both = { ...TUTORIAL_STEPS[0], bodyByRun: { free: 'FREE' }, bodyIfNoSubject: 'NOSUBJ' };
eq(stepBody(both, 'free', true), 'NOSUBJ', 'no-subject copy wins over per-audience copy, deliberately');
eq(stepBody(both, 'free', false), 'FREE', '…and per-audience copy is untouched when the subject is there');
assert(stepAnnouncement(2, 'free', [both], true).includes('NOSUBJ'), 'the announcement rides the same resolver');
```
RED before (no assertion exists — `bodyIfNoSubject` and the `subjectMissing` parameter have zero coverage repo-wide), GREEN after.

**3. COMPLETENESS QUERY** — the class is "a copy resolver whose branches are unpinned":

```bash
rg -n 'bodyIfNoSubject|bodyByRun|subjectMissing' apps/rn/src/store/tutorialPath.test.ts
```
must be non-empty for every branch of `stepBody`. Today it returns **zero for two of the three branches**, and zero for `stepAnnouncement`'s fourth parameter entirely.

---

## Checked and clean (including disproved suspicions)

- **`acted` cannot inherit `floorBefore` from a previous beat.** `goTo` does `set({ index, floorBefore: null })` (`tutorialSession.ts:143`) on every beat change. **DISPROVED.**
- **`unmeasurableFor` cannot name a subject the beat no longer coaches.** Between a `targetId` render change and the effect run, `unmeasurableFor` holds the old id and `isSubjectMissing` compares `unmeasurableFor === a.targetId` → false. The identity check does the job it was added for. **Clean.**
- **`subjectMissing` cannot true→false→true *within one effect run*.** The `!first` branch returns early, so exactly one write per run. The cross-run flicker is finding #1, which is a different mechanism.
- **Skip / hand-back leave no parked verdict.** `useEffect(… ) return () => setSubjectMissing?.(false)` (`index.tsx:837`) fires on unmount; `TutorialCoach` renders null once `active` is false. **Clean.**
- **`stepBody` and `stepAnnouncement` cannot disagree.** Both read `shell.subjectMissing` from the same render (`TutorialCoach.tsx:46,50` → `TutorialOverlay.tsx:114,57`). **Clean.**
- **`useInert` cleanup does not strip `inert` from a node that should keep it.** The three sites are three distinct DOM nodes; `inert` inherits down the DOM but each `removeAttribute` targets only its own node. **DISPROVED.**
- **No coached `control` target is nested inside a `TutorialFence`.** All 8 `TutorialFence` uses (`index.tsx:272,280,375,382,395,400,419`) wrap non-Guardian regions; `guardian-adjust`/`guardian-reserve` sit inside the unfenced `TutorialTarget id="guardian-card"`. The beat's own control is genuinely reachable. **DISPROVED.**
- **`TutorialTarget`'s registry registration still works.** The ref callback churns (`register(id, null)` then `register(id, node)`) on every re-render because it's an inline arrow — but both halves run synchronously in the commit's layout phase, before any passive effect can call `has()`. `inert` lives on the DOM node, which React reuses, so the churn doesn't strip it. **Clean.**
- **`ref.current` resolves to a DOM node under react-native-web** (`View` forwards to a host `div`), and the `Platform.OS !== 'web'` guard is correct — `inert` has no RN equivalent. **Clean.**
- **Two `TutorialTarget id="today-ack"` sites** (`index.tsx:461,480`) are mutually exclusive on `activeAck`, and React detaches deleted refs before attaching new ones, so the swap can't leave the map empty. **DISPROVED.**
- **`flexWrap: 'wrap'` on `nav` (`TutorialOverlay.tsx:477`) does not create a re-measure loop.** Dock height feeds `revision`, but wrapping is a pure function of dock width and content — nothing downstream of `revision` changes it. The only closed loop through `dockH` is via `subjectMissing` → body copy, which is finding #1. **DISPROVED as an independent defect.**
- **`reduceMotion ? 0 : SETTLE_MS`** — `setTimeout(…, 0)` still defers past the current task, and the `stale` guard plus `clearTimeout` in the cleanup are unchanged, so nothing depended on a real delay. **Clean.**
- **`settling` has no remaining consumers.** `rg 'settling'` outside `use-spotlight.ts` returns only the two doc references (`TutorialOverlay.tsx:177`, `tutorialShell.tsx:27`) and unrelated "settling-in reserve" domain hits. Removing it from the return was safe. **Clean.**
- **`suspendStoryOnBackground` cannot throw or preempt the flush** — see finding #4's first paragraph. **DISPROVED.**
- **`headerHeight`'s `Math.min(2, …)` removal** (`index.tsx:88`) is correct: the estimate is now monotone in font scale, matching the over-estimate bias the doc commits to.

**One structural note that is itself a finding:** `rg 'bodyIfNoSubject|subjectMissing|unmeasurable' apps/rn/tests apps/rn/src/store/tutorialPath.test.ts` returns **nothing**. Round 7's headline behaviour change — the one the commit calls THE SHOW-STOPPER — is verified end-to-end by zero tests. `spotlightPolicy.test.ts` pins the predicate; nothing pins that the predicate is wired to anything, which is the identical shape of the round-6 failure it was written to correct.

---

# LENS B — the premium-bar re-judge

Repo untouched (clean at `83c50a6`; the arc PNGs are gitignored). Here is the round-8 premium-bar judgement.

---

# VERDICT: **BAR NOT MET**

The walkthrough's happy path at 402pt still reads as Debt coaching itself — but **[D15] introduced a user-visible feedback loop in which the coaching paragraph rewrites itself and the dock resizes, repeatedly, with no user input.** That is disqualifying on its own, and it is new since round 4's verdict, which is exactly what this re-judge was for.

## The six criteria

| # | Criterion | Verdict | Screenshot |
|---|---|---|---|
| 1 | Beat transition + travelling spotlight | **NOT MET** — beat 5's ring runs across the coaching dock; every beat's hole is a square rect behind a 14pt-rounded ring | `beat5-dock-{light,dark}.png`, `corner-br-light.png` |
| 2 | Dock material (`SheetScrim` frosting idiom) | **NOT MET** — underlying form labels are legible through the dock, including *through the primary button* | `navwrap-light.png`, `tabbar-{light,dark}.png` |
| 3 | Progress affordance (rail + "Step N of 7 · Example money") | **MET** — present, calm, correct on all 7 beats × 2 themes | `rn-arc-3-dark.png`, `rn-arc-3-light.png` |
| 4 | Haptics (light tick/beat, medium ×2) | **NOT MET pending F1** — the rungs are right statically (`TutorialOverlay.tsx:64` light; `index.tsx:330,344` medium), but F1 re-fires the tick on every oscillation. Cannot be *observed* on web | code only |
| 5 | Payoff choreography (`FloorImpactBar`, beat-4 ack) | **MET, fragile** — renders and springs, but a no-change save draws a *full* accent bar captioned "Same cushion, same plan" | `payoff-after-dark.png` |
| 6 | Control hierarchy (Next leads · Back quiet · Skip at the edge) | **MET at 402pt; NOT MET when the row wraps** — Skip lands left-aligned directly under Next | `rn-arc-3-light.png` vs `navwrap-{light,dark}.png` |

## The holistic read

Beats 1–4, 6 and 7 at 402pt are genuinely good in both themes. In `rn-arc-3-light.png` the "Adjust your line →" pill is lifted out of a calm wash with a crisp accent ring and the dock's copy sits under a quiet rail — that reads as the app explaining itself, not as a tooltip. Three places break it, each differently. `beat5-dock-light.png` shows the spotlight ring's bottom border and both side rails drawn *across the coaching card*, a hard blue rule slicing the sentence "Guardian works out what has to be covered / now, and what can safely wait" — that reads as a rendering bug, full stop. `corner-br-light.png`, zoomed, shows a white square notch protruding from every rounded corner of the highlight, because the light and the ring disagree about the subject's shape. And `navwrap-light.png` shows "e.g. 400" legible *inside the dark Next pill* with "WHAT IS IT? (OPTIONAL)" running across the nav row. Round 4's "~97% finish" was a fair read of the arc it looked at; the surfaces it did not look at — beat 5's oversized subject, the degraded path, the wrapped row — are where the tooltip-library read comes back.

---

## Findings, worst first

### F1 — [D15]'s degraded beat oscillates: the copy rewrites itself, the dock resizes, and the haptic + announcement re-fire, with no user input · **BAR-BREAKING**

**What I saw.** Same session, beat 4, 300ms apart, no input:
- `frame-14.png` — "…**Tell it your bills are all in** and it holds less…" (the ASK), 6 lines, dock top at y≈33 of the crop.
- `frame-15.png` — "…**Once it knows them all** it holds less…" (`bodyIfNoSubject`), 5 lines, dock top at y≈78.

The paragraph changes and the whole dock panel jumps ~45px. It is not a one-off: `scratchpad/flicker.cjs` sampled beat 4 for 8s in one run and logged
`[dark] {0 no-ask} → {1200 ASK} → {4400 no-ask} → {4800 ASK} → {5000 no-ask} → {6600 ASK}` — five flips. Two independent runs of identical code also landed on *different* copy: `degraded-4-dark.png` shows the ask ("Tell it your bills are all in") with no attestation control on screen and no spotlight — i.e. exactly the lie [D15] exists to prevent — while `degraded-4-light.png` shows the correct degraded line. Beat 3 was stable in both themes.

**Mechanism.** `subjectMissing` → `stepBody` picks a different-length paragraph → the dock measures a different height → `onDockLayout` publishes `dockH` → `useSpotlight`'s `revision: \`${index}:${dockH}:${payoffShowing}\`` (`apps/rn/src/app/(tabs)/index.tsx:750`) changes → the effect re-runs → `apps/rn/src/hooks/use-spotlight.ts:80` `setUnmeasurableFor(null)` retracts the verdict → `subjectMissing` false → the ask copy returns → the dock resizes back. The measurement chooses the copy and the copy changes the measurement's input.

**Compounding severity:** `useAnnounceBeat`'s deps are `[position, run, subjectMissing]` (`TutorialOverlay.tsx:68`), so every flip calls `haptics.light()` **and** `announce(stepAnnouncement(...))` again. On device this is a repeating tick plus VoiceOver re-reading the entire beat while the user stands still.

1. **FIX** — break the loop at the verdict, not at the copy. In `apps/rn/src/hooks/use-spotlight.ts:80`, the `setUnmeasurableFor(null)` reset currently runs on every `revision` change; it must run only when the *beat identity* changes. Split it out into its own effect keyed on `[targetId]` (and the beat index), leaving the measure effect keyed on `revision` as it is. Belt-and-braces at the other end: quantize the stage term in `index.tsx:750` to `Math.round(dockH / 40)` so a one-line copy change cannot re-key a measurement at all. Intended outcome: once a beat has concluded its control is absent, the degraded copy is what the user reads for the whole beat — one paragraph, one dock height, one tick.
2. **PROOF IT LANDED** — re-run `scratchpad/flicker.cjs` against a degraded build: `beat 4 [dark]` and `beat 4 [light]` must each print a **single-element** transitions array. Plus a `scratchpad/osc2.cjs` 24-frame strip in which every frame is byte-identical.
3. **COMPLETENESS QUERY** — class-level: *no input to `revision` may be downstream of a value the beat's own copy determines.* `grep -n "revision:" apps/rn/src/app/\(tabs\)/index.tsx` and confirm each term is beat- or user-driven; and assert `stepBody`'s `subjectMissing` argument cannot reach `revision`. Any future per-beat copy switch reopens this loop otherwise.

---

### F2 — beat 5: the spotlight ring is drawn across the coaching dock, both themes

**What I saw.** `beat5-dock-light.png` and `beat5-dock-dark.png`: the ring's bottom border is a blue horizontal rule running the full dock width between "Guardian works out what has to be covered" and "now, and what can safely wait", with both side rails running vertically down through the frosted panel, and a visible brightness step where the un-dimmed hole overlaps the dock. Measured: ring `{x:14, y:50, w:374, h:697}` in an 874pt viewport whose stage is ≈530pt — the at-risk Guardian card is simply taller than the stage, and nothing clamps the highlight.

1. **FIX** — clamp the drawn geometry to the stage in `TutorialOverlay.tsx`. Pass `stageTop`/`stageBottom` down beside `spotlight`, and render both the ring and the visual hole inside a clipping container: `<View pointerEvents="box-none" style={{position:'absolute', top: stageTop, left:0, right:0, bottom: dockH, overflow:'hidden'}}>`. Outcome: an over-tall subject is lit to the edge of the stage and the dock is never crossed. (Keep the *hit* geometry unclamped — reachability is a separate layer, per the existing split.)
2. **PROOF IT LANDED** — beat-5 screenshots in both themes; and an assertion in `tests/visual/rn-tutorial-arc-theme.cjs` that `ring.y + ring.height <= viewportH - dockH`.
3. **COMPLETENESS QUERY** — class-level: extend the arc sweep to check `ring.y >= stageTop && ring.y + ring.height <= viewportH - dockH` for **all 7 beats × 2 themes**; must be zero failures. Beat 5 is the one that trips today, but any state that grows the card (Recovery, top-up, a stale chip) hits the same wall.

---

### F3 — the scrim hole is a square rectangle behind a 14pt-rounded ring: four un-dimmed corner nubs, on every beat

**What I saw.** `corner-br-light.png` (64pt crop at 3×, beat 3's bottom-right): a solid **white square block** sitting outside the blue rounded ring. `corner-light.png` shows the same at top-left. `seamwide-light.png` shows both bottom corners flanking the ring at once. `corner-br-dark.png` shows the identical geometry in dark, but as a barely-separated navy — **this is a light-theme defect**, which is precisely the theme the standing rule says never takes a back seat. Structural: `Scrim`'s four bands cut a plain rect while `styles.ring` carries `borderRadius: 14` (`TutorialOverlay.tsx:444`), so at each corner a wedge of content is inside the hole and outside the ring.

1. **FIX** — paint the corner wedges with the scrim colour. In `Scrim` (`TutorialOverlay.tsx:409-431`), add one `Animated.View` after the four bands, positioned on the hole rect (`top: t`, `left: l`, `width: r-l`, `height: b-t`), `pointerEvents="none"`, styled `{borderRadius: 14, borderWidth: 24, borderColor: color, backgroundColor: 'transparent'}`. The border paints inward from the square edge and its rounded inner curve matches the ring exactly. Outcome: the lit region's corners follow the ring's curve; no bright nub in either theme.
2. **PROOF IT LANDED** — re-shoot `corner-{light,dark}.png` and `corner-br-{light,dark}.png` via `scratchpad/probe.cjs` (function `BCD`); the corner pixel outside the ring must read as scrim, not as content.
3. **COMPLETENESS QUERY** — class-level: sample the pixel 3pt diagonally outside each of the 4 ring corners on beats 3 and 7, both themes, and assert it matches the far-field scrim pixel within tolerance — 8 samples × 2 themes, all must pass.

---

### F4 — the dock's frost does not isolate: underlying text reads through the coaching card and through the primary button

**What I saw.** `navwrap-light.png` (280pt, 3×): "AMOUNT", "e.g. 400" and "WHAT IS IT? (OPTIONAL)" from the Can-I-afford-it card are plainly legible across the nav row; **"e.g. 400" reads inside the dark Next pill**; the text field's rounded outline sits behind "Back". At 402pt, `tabbar-light.png` shows "(OPTIONAL)" overlapping the dock's own "solves around it." and "New couch" running between Next and Back; `tabbar-dark.png` shows the same, weaker. [D1] deliberately set `intensity={70}` under `opacity: 0.55` and calibrated against the **tab bar** — which never has body text beneath it. The dock does.

1. **FIX** — `TutorialOverlay.tsx:256`: raise the tint from `opacity: 0.55` to `0.80` (keep `intensity={70}`). The app's `SheetScrim` gets away with 20/0.28 because it sits over an already-dimmed backdrop; the dock sits over content the scrim has only lightly washed. Outcome: no glyph from beneath is legible on the dock's surface, while the blur still reads as a material rather than a solid card.
2. **PROOF IT LANDED** — re-shoot `navwrap-{light,dark}.png` at 280pt and `tabbar-{light,dark}.png` at 402pt. "No legible ghost glyph" is checkable from the crop; "still reads as glass rather than a slab" only a human eye can settle — put it in front of Jason in both themes.
3. **COMPLETENESS QUERY** — instance-level as written. The class query is: `grep -rn "BlurView" apps/rn/src` and, for each hit, confirm its companion tint opacity was calibrated against *body text* underneath, not chrome.

---

### F5 — the wrapped nav row inverts the control hierarchy

**What I saw.** At 280pt: `next {x:58, y:573}`, `skip {x:58.7, y:633}` — Skip wraps onto its own line and lands **left-aligned directly beneath the primary button**, with the entire right half of the row empty (`navwrap-light.png`, `navwrap-dark.png`). Criterion 6's whole point — "Skip pushed to the far edge, never the thing your eye lands on" — is exactly inverted: alone on its own line under Next is the most conspicuous position a secondary can occupy. Round 7's `flexWrap` correctly rescued Skip from being clipped off-screen; it did not carry the hierarchy across the wrap, because `navSpacer` (`flex: 1`) is consumed by line 1.

1. **FIX** — `TutorialOverlay.tsx:465,477`: delete `navSpacer` and its `<View style={styles.navSpacer} />` at line 314; add `justifyContent: 'flex-end'` to `styles.nav`; add `marginLeft: 'auto'` to `styles.skip` (line 466). `marginLeft: 'auto'` survives wrapping where a flex spacer does not. Outcome: Skip sits at the trailing edge in both the single-line and the wrapped layout.
2. **PROOF IT LANDED** — re-shoot `narrow-280-{light,dark}.png` via `scratchpad/probe.cjs` (function `E`); assert `skip.x + skip.width` is within ~16pt of the dock's right edge.
3. **COMPLETENESS QUERY** — class-level: assert Skip is trailing-aligned at **402, 320 and 280pt × 2 themes** — six checks, all must pass. Round 2 fixed this row's vertical clipping and round 7 its horizontal clipping; a width-sweep assertion is what stops a round 9 finding the third axis.

---

### F6 — the payoff bar draws its most emphatic state for the null outcome · met-but-fragile

**What I saw.** `payoff-after-dark.png`: opening the floor sheet and saving *without moving the slider* still renders `FloorImpactBar` — a **full-width solid accent bar** captioned "Cushion $413 → $413 · Same cushion, same plan". `FloorImpactBar.tsx:41-43` sets `scale = Math.max(1, before, after)`, so `before === after` forces `afterFrac = 1`. A full accent bar is this app's language for "you moved something"; here it celebrates a no-op. Secondary: after the save, the dock body still reads "Open it and move the line" — it instructs an action already completed.

1. **FIX** — `apps/rn/src/app/(tabs)/index.tsx`: don't publish `impact` when `before === after` (the payoff exists to show a change). If it must render, in `FloorImpactBar.tsx:67-76` draw the track with no fill and set the caption to `c.text.tertiary` when `before === after`.
2. **PROOF IT LANDED** — beat 3 → open sheet → Save unchanged → screenshot both themes; no full accent bar.
3. **COMPLETENESS QUERY** — instance-only.

---

## What I could not observe — for the device ledger

- **Haptics.** `haptics` no-ops on web. Static read only: one `haptics.light()` (`TutorialOverlay.tsx:64`) and two `haptics.medium()` (`index.tsx:330,344`), matching criterion 4's description. **Whether F1 produces a repeating tick on device is inferred from the dep array, not felt.**
- **Real OS Dynamic Type.** RN-Web pins `PixelRatio.getFontScale()` to 1, so the 280pt viewport is a **width** proxy only. The vertical path — `dockMaxH`, the inner `ScrollView`, `dockCard`'s `flexShrink: 1` — is entirely unobserved. F5 is proven; the [B4] cap chain is not.
- **VoiceOver under F1.** The re-announcement is inferred from `useAnnounceBeat`'s `[position, run, subjectMissing]` deps; nobody has heard it.
- **Tab-bar layering on device.** On web the scrim measured full-viewport (`{0,0,402,874}`) with the "Progress" label at y=859, so the tab bar **is** covered here. Native tab-bar layering differs and is unverified — worth one glance on device given `holdTabs` exists precisely because the bar stays reachable.
- **iPad regular layout.** `DOCK_MAX_W`, the sidebar-origin subtraction, and F2's clamp all behave differently at 1024×768; not shot this round.
- **The genuine [D15] trigger.** I could not reach it through the shipped build — `showAdjust`/`showAttest` are unreachable-false in a sandbox the tutorial forces to `clear`. I forced it by serving a **scratchpad copy** of `dist` with beats 3 and 4 staged `at-risk` (the lever the brief named); the repo was never touched. Consequence to read past: the red "This paycheck won't cover everything" card behind beat 3's "Your line" copy in `degraded-3-{dark,light}.png` is an artifact of my lever, **not** of the shipped arc. The oscillation in F1, however, is a property of the `revision`/`unmeasurableFor` loop and is independent of how the state was reached.

---

# LENS C — the overlay-less sandbox

## VERDICT

**The substrate does not keep its promise.** Every *fence* is correctly keyed on the session and will correctly go open in demo mode — but the substrate's honesty layer is split across two owners, and the half that carries the whole canvas (`· Example money` in the dock, and the *only* spoken marker) dies with the overlay. Rendered overlay-less today, the sandbox would put the user's real debt names inside an invented shortfall with one accent chip on one card as the sole disclosure — the exact state that 3.5.3.11 declared unacceptable four rounds ago. Nothing is broken *today* (the sandbox is unreachable without a session — `tutorialSession.end()` clears `active` and `sandbox` in one `set`, so no frame exists where one is true without the other); all of this is 3.5.4 entry cost, and two items are cheap enough to land now.

---

## The predicate inventory

| # | Behaviour | file:line | Keyed on | Correct overlay-less? | Should be |
|---|---|---|---|---|---|
| 1 | Dock progress row `Step N of 7 · Example money` | `TutorialOverlay.tsx:289-291` | session (component only renders when `active`) | **NO — vanishes** | a canvas-level marker keyed on `isSandboxStore` |
| 2 | `stepAnnouncement` → "Example money" (VoiceOver) | `tutorialPath.ts:256`, sole caller `TutorialOverlay.tsx:57` | session | **NO — silent** | sandbox-keyed announcement/landmark |
| 3 | Guardian card `Example` chip | `PaydayGuardianCard.tsx:207-213` (`isExample`) | sandbox ✅ | yes, but it is then the *only* marker | keep; must stop being the only one |
| 4 | Group-label `'Example'` spoken first | `PaydayGuardianCard.tsx:166` | sandbox ✅ | yes — only on this one card | keep |
| 5 | `TutorialFence` (hero · affordability · lean · required · recommended · payoff-invite · next-chapter) | `TutorialFence.tsx:31,34,36`; call sites `index.tsx:272,280,375,382,395,400,419` | session | **yes — open is right** | unchanged (comment at `:27-28` is accurate) |
| 6 | `TutorialTarget control` a11y fence | `tutorialTargets.tsx:179-180` | session + `activeId` | yes — no provider ⇒ `targets` null ⇒ `fenced=false` | unchanged |
| 7 | `MoreButton` `disabled` + `a11yHidden` + dimmed icon | `more-button.tsx:29,33,37,40` | session | yes for "not dead", **no for demo containment** — it routes *out* of the demo | session (keep); demo needs its own containment |
| 8 | Tab presses held | `(tabs)/_layout.tsx:32-33` | session | **no** — tabs go live and Progress/Money are **outside** the provider ⇒ real (empty) store | needs a demo predicate |
| 9 | Forecast link `disabled={inWalkthrough}` + a11y-hidden | `PaydayGuardianCard.tsx:421,425` | session | **yes — this is the round-7 fix working**; live in demo, pushes a real route | see #8 (route containment) |
| 10 | Replay link withheld | `index.tsx:318` (`isExample ? undefined`) | sandbox | yes — no dead control, correctly absent | unchanged |
| 11 | `coachLine` into floor sheet | `index.tsx:320` | sandbox ∧ session (`:122`) | yes — `undefined` with no session | unchanged |
| 12 | Tutorial invite suppressed | `index.tsx:208` | sandbox ✅ | yes — demo won't advertise the walkthrough over itself | unchanged |
| 13 | Hand-back crossfade `key` | `index.tsx:296` | sandbox | inert (no swap in demo) | unchanged |
| 14 | `haptics.medium()` on floor save | `index.tsx:324-331` | sandbox | **no** — fires an arc-specific beat with no arc | session |
| 15 | `haptics.medium()` + `playReserveStory()` on attest | `index.tsx:338-351` | sandbox, then session-gated inside | half — haptic fires, story silently dies (`tutorialSession.ts:173`) | session; demo needs its own story driver |
| 16 | persistence / widget / LiveActivity refusal | `persistence.ts:25`, `widgetSync.ts:30`, `liveActivitySync.ts:29` | sandbox ✅ | **yes — the isolation guarantee holds unchanged** | unchanged |
| 17 | `useNoRealWritesGuard` | `StoreContext.tsx:79-136` | provider mount (`store !== appStore`) | **partially** — see F3 | needs demo scoping |

---

## Findings, worst first

### F1 — Overlay-less, the sandbox has exactly one marker, on one card, above the fold
**CONFIRMED.** `index.tsx:119` sets `isExample` from `isSandboxStore(store_)`, and passes it to precisely one consumer: `PaydayGuardianCard` (`:303`). Everything else Today renders from the sandbox — `PlanHero` (`:281`, seeded paycheck amount + `MAR 16` payday), `RequiredActionsCard` (`:396`), `RecommendedActionsCard` (`:401`), `AffordabilityCard` (`:376`), `RecoveryPlanSection` (`PaydayGuardianCard.tsx:325`), the reserve-release / walk-back acks (`:460-491`) — carries no marker at all. `PlanHero.tsx` has no `isExample` prop (grep confirms). The dock line that was added to cover exactly this (`TutorialOverlay.tsx:274-291`) does not render without a session.

And `personalScenario` (`sandboxScenarios.ts:281-283`) maps the user's **real debts by name and balance** into a solver-fabricated at-risk state (`solveBillBudget` `:157`: `lastTight + income*0.15` — a deliberate invented shortfall). The 3.5.3.11 comment names this risk verbatim; that mitigation is overlay-only. A demo/App-Preview frame cropped below the Guardian card's title row is indistinguishable from a real plan in trouble.

1. **FIX** — the marker must move to a canvas-level, sandbox-keyed surface. Concretely: in `apps/rn/src/app/(tabs)/index.tsx`, inside the `<Screen>` return (before line 418), render a quiet persistent strip when `isExample && !inWalkthrough` — one caption line, `c.text.tertiary`, `testID="example-canvas-marker"`, text `Example money`. Keep the dock line for the walkthrough so nothing doubles.
   **This belongs at 3.5.4, not this version** — there is no overlay-less render path today, so it would ship dead code, and the placement is a design-shaped decision (per the standing "align design-shaped work before building" rule). What belongs in **THIS** version is one line: correct `TutorialOverlay.tsx:288` — "The card chip STAYS: it's the marker for when the sandbox renders WITHOUT this overlay" asserts a sufficiency the card chip does not have. It marks one card, not the canvas. Change it to say the chip is the *card's* marker and that a canvas-level marker is owed at 3.5.4.
2. **PROOF IT LANDED** — no component runner exists; this is Playwright. There is no route today that mounts a sandbox without a session (`app/tutorial.tsx:45` unconditionally calls `tutorialSession.start`), so **the seam is 3.5.4 work**: a `__DEV__ || QA_TOOLS`-gated `/demo` route (mirroring `sandboxHarness.ts:43-46`) that mounts `StoreProvider(createSandboxStore(...))` with no session. Then: `await page.goto('/demo'); await expect(page.getByTestId('tutorial-overlay')).toHaveCount(0); await expect(page.getByTestId('example-canvas-marker')).toBeVisible();`
3. **COMPLETENESS QUERY** — *no truth-telling marker may be keyed on the session.* `rg -n "Example" apps/rn/src --glob '!*.test.ts'` → for each hit that renders user-visible text, its guard must resolve from `isSandboxStore`/`isExample`, never `useTutorialSession(s => s.active)`. Today that returns **2 violations** (`TutorialOverlay.tsx:290`, `tutorialPath.ts:256`); the target is 0 *unmirrored* violations — i.e. each session-keyed marker has a sandbox-keyed twin.

### F2 — A VoiceOver user in demo mode is never told the money is fake, on any surface but one
**CONFIRMED.** `stepAnnouncement` (`tutorialPath.ts:238-257`) is called from exactly one place: `TutorialOverlay.tsx:57`. `rg "announce\(" apps/rn/src` returns 4 call sites; the other three are route titles and the two sandbox payoff announcements in `index.tsx:773,874` — both inside `TutorialRun`, i.e. session-only. Overlay-less, the *only* spoken disclosure is `PaydayGuardianCard.tsx:166`, which speaks "Example" as the first token of the Guardian card's group label. Swipe past that card — to the hero's paycheck figure, to Required Actions listing the user's real debt names, to the Recovery section — and there is nothing. `tutorialPath.test.ts:77` asserts every beat announces "Example money"; that test is structurally incapable of covering the demo case, because the announcement is beat-indexed.

1. **FIX** — at 3.5.4, the canvas marker from F1 must be in the a11y tree, not `decorative`, and additionally announced once on demo entry: `announce('Example money. This is a demonstration with sample figures.')`. Prefer a `accessibilityRole="header"`-adjacent landmark over a bare `announce`, so a user who arrives mid-screen can still find it. **3.5.4** — same reason as F1.
2. **PROOF IT LANDED** — pure-function half is testable **now** at 3.5.4 without a renderer: extract the marker sentence to `tutorialPath.ts` (or a new `sandboxMarker.ts`) as `exampleMoneyAnnouncement()` and assert via `npm run test:app` that both `stepAnnouncement` and the demo announcement contain it, so the two cannot drift. Render half: the existing `a11y-axe.spec.ts` pattern against `/demo`.
3. **COMPLETENESS QUERY** — *every surface that renders sandbox money exposes a marker in the a11y tree.* Assertion for the 3.5.4 spec: `rg -n "isExample" apps/rn/src/app/\(tabs\)/index.tsx` must show `isExample` reaching the canvas marker, and a Playwright check on `/demo` that the accessible name of the *page* (or first landmark) contains "Example" — not merely the Guardian card's.

### F3 — The no-real-writes guard survives, but its reporting is mis-scoped for demo mode
**CONFIRMED, mixed.** The write-isolation *guarantee* holds unconditionally and does not depend on the session at all: `createSandboxStore` neuters `hydrate`/`save` (`sandboxStore.ts:267-270`), wraps `setState` through the bound (`:277-283`), and the three sync seams refuse on `isSandboxStore` (`persistence.ts:25`, `widgetSync.ts:30`, `liveActivitySync.ts:29`). `useNoRealWritesGuard` fires on `store !== appStore` (`StoreContext.tsx:81`), i.e. on the *provider*, not the session — so it keeps watching in demo mode. That much is right.

What breaks is the **scoping**. In demo mode `MoreButton` is live (`more-button.tsx:33`, session-keyed) and pushes `/more`, which is a Stack sibling *outside* the provider and writes the real store directly — `more.tsx:57,61,71,164,184,190,199,207,241` (`updatePrefs`, `reset()`, `setSubscriptionPlan`). Today is still mounted underneath, so the provider's `useEffect` subscription is still live. Every one of those writes lands as `reportError('Real store mutated while a sandbox subtree was mounted')`. `paywall.tsx:153,177` (`setSubscriptionPlan('premium')`) is the same shape — and a marketing demo that *demonstrates the paywall* is a plausible, maybe intended, flow. `reportError` is wired to Sentry at Phase 6 (`reportError.ts:5-8`, `_layout.tsx:50`), so this is production noise poisoning the one signal built to prove the real plan is untouched — the exact failure `[B3]` documents at `StoreContext.tsx:96-101`.

1. **FIX** — `StoreContext.tsx:79-81`. Two options, and I recommend the second: (a) wrap the demo's out-of-provider navigations in `allowRealStoreWrite`, which is unmaintainable — it is a per-call-site allowlist over an open route graph; (b) give the guard a scope argument, `useNoRealWritesGuard(store, { report: boolean })`, with `StoreProvider` taking a `strict` prop — `true` for the walkthrough (which fences navigation, so every real write genuinely is a leak), `false`/dev-console-only for demo mode (which does not). **3.5.4** — the signature change is cheap but has no correct value to pass until a demo caller exists, and changing it now would mean guessing the demo's containment model. What belongs **THIS** version: one comment at `StoreContext.tsx:69-77` recording that the guard's report scope assumes the walkthrough's navigation fence, and must be re-scoped when the provider is mounted without one.
2. **PROOF IT LANDED** — pure, so `npm run test:app`, extending `storeContext.test.ts`: assert that a real-store write with the guard in non-strict scope produces no `reportError` call (inject a counting reporter via `setErrorReporter`) while the sandbox-isolation assertions at `:46-49` still pass unchanged.
3. **COMPLETENESS QUERY** — *no route reachable from a demo can write the real store unreported-and-unallowed.* `rg -n "appStore\.getState\(\)\." apps/rn/src/app apps/rn/src/components` currently returns ~25 sites across `more.tsx`, `money.tsx`, `paywall.tsx`, `living-expenses.tsx`, `onboarding.tsx`, and the entity sheets. The 3.5.4 assertion is that the set of those reachable while a demo provider is mounted is **zero** (containment) — not that they are individually allowlisted.

### F4 — Demo mode has no store coherence outside the Today route, and cannot legally reach Today at all
**CONFIRMED, two coupling points, both structural.**

(a) The provider is mounted *inside* the Today route — `index.tsx:670` returns bare `<TodayContent />` unless `active && sandbox`, and `StoreProvider` sits at `:878` inside `TutorialRun`. Progress and Money are sibling tab screens and read the real singleton. The walkthrough gets away with this because `(tabs)/_layout.tsx:33` `preventDefault()`s every tab press — a *session*-keyed fence. Demo mode, with tabs open, shows sandbox money on Today and the real (empty) plan one tab over. A demo that is one tap from contradicting itself is not shippable, and it is not a wiring bug — the provider is in the wrong place for a use case that isn't Today-only.

(b) `_layout.tsx:132` — `<Stack.Protected guard={onboardingComplete}>` wraps `(tabs)`, `more`, `tutorial`, `paywall`, everything. The legacy `demoStore()` gets past this by setting `onboardingComplete: true` on the **real** store (`demoSeed.ts:82`) — precisely the overwrite `sandboxStore.ts:14-16` condemns. A sandbox demo, by construction, writes nothing real, therefore sets no `onboardingComplete`, therefore **cannot route to Today**. The pre-purchase audience 3.5.4 exists for is the not-yet-onboarded user, who is exactly the one the route guard blocks.

1. **FIX** — 3.5.4 must hoist the provider above the navigator (a root-level `<StoreProvider store={demoSandbox ?? appStore}>` around the `Stack` at `_layout.tsx:131`, which is where `TutorialShellProvider` already sits and is proven safe — note `(tabs)/_layout.tsx:35-39` records that wrapping `<Tabs>` itself in a container View broke tab presses, so the tabs layout is *not* the place), and the route guard at `_layout.tsx:132` must become `onboardingComplete || demoActive`. **Both are 3.5.4** — they are architecture, and both fall under "surface restructure decisions" (bring options, decide together). Do **not** attempt either now.
2. **PROOF IT LANDED** — Playwright, `npm run e2e:fresh:rn`: seed a store with `prefs: { onboardingComplete: false }`, `goto('/demo')`, assert Today renders (not onboarding), then click `tab-money` and assert the sandbox's figures — the mirror of the existing in-situ proof at `tutorial-invite.spec.ts:49-57`, which asserts `MAR 16` on Today.
3. **COMPLETENESS QUERY** — *no tab or pushed route renders real money while a demo is running.* Assertion: with the demo provider mounted, `rg -c "useAppStore|useActiveStore" apps/rn/src/app/\(tabs\)/*.tsx` — every one of those consumers must resolve through the demo provider. The mechanical check is that `StoreContext`'s provider is an ancestor of the `Stack`, verifiable by a single Playwright assertion that Money shows a sandbox debt name that does not exist in the seeded real store.

### F5 — The scripted-narration machinery is owned by the session, so 3.5.4's scripted run cannot reuse it
**CONFIRMED.** `tutorialSession.ts` owns, all gated on `active`: sandbox creation and scenario selection (`start`, `:136-141`), per-beat re-staging (`stageBeat`, `:249-256`), teardown (`end`, `:222-228`), the reserve story timers (`playReserveStory` `:172-205`, guarded `if (!active || !sandbox) return`), story cancellation (`:218-220`), and background suspension (`suspendStoryOnBackground` `:96-98`, called from `_layout.tsx:91`). `runBeats`/`scriptSurprise`/`advanceSandboxCycle` in `sandboxBeats.ts` and `scenarioForBeat` in `sandboxScenarios.ts:324` are **correctly** session-free and pure — that half of the substrate genuinely is reusable. The entanglement is entirely in `tutorialSession`: a bounded demo run is the same shape (seed → hold → script consequences → advance), and today it would have to either fake a tutorial session or copy `playReserveStory` wholesale.

Concrete consequence right now: in demo mode, tapping the attestation control (`index.tsx:338-351`) fires `haptics.medium()` (keyed on `isExample`, wrong — see inventory #14/#15) and then calls `playReserveStory()`, which returns immediately. The net shrinks — that part is the real engine and is correct — but the surprise and the three rollovers that explain *why* never come. The demo would show the consequence-free half of the lesson.

1. **FIX** — 3.5.4 extracts a `sandboxRun` module: `{ sandbox, scenario, stage(index), story(name), teardown() }`, with `tutorialSession` becoming one consumer of it and `demoSession` the other. The story timers move there with their `clearStoryTimers`/background-suspend contract intact (`_layout.tsx:91` then calls the shared module, not `tutorialSession`). **3.5.4** — a refactor with one consumer is speculative; do it when the second consumer exists. What belongs **THIS** version: re-key `index.tsx:324` and `:338` haptics from `isExample` to the session, since a beat-specific haptic firing outside the arc is the same class of error as a beat-specific fence firing outside it — one-line change, no design decision, and it removes an inventory row before 3.5.4 has to reason about it.
2. **PROOF IT LANDED** — pure, `npm run test:app`. The extracted `sandboxRun` is testable headlessly today the way `sandboxBeats.test.ts` already is: assert `story('reserve')` on a bare sandbox produces the walk-back then the release, with no `tutorialSession` involved.
3. **COMPLETENESS QUERY** — *no sandbox behaviour is reachable only through `tutorialSession`.* `rg -n "tutorialSession\.getState\(\)" apps/rn/src --glob '!store/tutorial*'` returns 3 hits today, all in `index.tsx` (`:325`, `:345`, `:349`). The target after 3.5.4 is **0** outside the tutorial's own files — a shared component reaching into the tutorial session is the marker of exactly this coupling.

### F6 — Capture-path hazards for the App Preview video
**CONFIRMED / PLAUSIBLE mix.** Ranked by how badly each ruins a recording:

- **CONFIRMED, fatal:** the unmarked canvas (F1). An App Preview showing invented shortfalls against real debt names is not merely un-premium; it is the honesty failure the whole marker exists to prevent, published to the App Store.
- **CONFIRMED, breaks the take:** tabs are live (`_layout.tsx:32-33` is session-keyed) and lead to the real empty store (F4a). One stray tap ends the recording.
- **CONFIRMED, breaks the take:** `MoreButton` is live and pushes `/more` — a screen with **Reset** on it (`more.tsx:71`).
- **CONFIRMED, breaks the beat:** the attestation tap produces a half-lesson (F5) — a shrinking net with no consequence, which reads as the app doing something arbitrary.
- **Good news — nothing renders dead.** Every disabled/hidden control is session-keyed and therefore *live* overlay-less: the forecast link (`PaydayGuardianCard.tsx:421`), `MoreButton`, tabs, `TutorialFence`'s a11y+`inert`. Round 7's re-keying was right, and it verifies clean under this lens. The replay link (`index.tsx:318`) is the one sandbox-keyed withholding, and withholding rather than disabling is the correct shape — nothing dead renders.
- **PLAUSIBLE:** the `Motion key={isExample ? 'example' : 'real'}` crossfade (`index.tsx:296`) is inert in demo (no swap occurs), so no stray animation. Not a hazard.
- **CONFIRMED, non-issue, worth recording so nobody re-derives it:** `usePaydayCapture` reads through the provider (`use-payday-capture.ts:47-51`), so in demo it sees the sandbox's frozen `nextPaycheckDate` (2026-03-16) against real device today. `shouldPromptPaydayCapture` returns false on the staleness clause (`shouldPromptPaydayCapture.ts:37`) and `isPaydayAwaitingRollover` returns false because `lastHandledPaydayDate` is null (`:60`). Neither the capture sheet nor the "Start Next Pay Cycle" nudge (`index.tsx:548`) can pop mid-recording. **But it is false by arithmetic, not by design** — it holds only while the frozen base date stays months behind real today, and `SCENARIO_BASE_DATE = '2026-03-02'` is a constant someone will eventually refresh. If a future scenario is dated near real today, the capture sheet auto-opens over the demo.

1. **FIX** — `sandboxScenarios.ts:45`, add to the `SCENARIO_BASE_DATE` doc comment: *the demo/capture path depends on this staying outside `recencyWindowDays(payCycle)` of real today, or `usePaydayCapture` will auto-open its sheet over the sandbox.* **THIS version** — it is a one-line comment on a landmine that is currently disarmed only by coincidence, and this is the round that found it.
2. **PROOF IT LANDED** — pure, `npm run test:app`, and it should be a real assertion rather than a comment if it is cheap: in `sandboxScenarios.test.ts`, `assert(daysAfter(SCENARIO_BASE_DATE, todayISO()) > 38, 'the scenario base date must stay stale enough that payday capture cannot fire over a sandbox')`. Note this makes the suite time-dependent in the *safe* direction (it can only start failing as the date recedes further… actually it only fails if the constant moves forward, which is exactly the change it must catch).
3. **COMPLETENESS QUERY** — *no real-clock-driven affordance can fire over sandbox money.* `rg -n "todayISO\(\)|new Date\(\)" apps/rn/src/hooks apps/rn/src/components/plan` — every hit must either be outside the provider subtree or be proven inert against a frozen sandbox clock. `use-payday-capture.ts:16` is the one that matters today.

---

## The 3.5.4 entry list (priority order)

1. **Canvas-level, sandbox-keyed "Example money" marker** — visible *and* in the a11y tree, covering hero / required / recommended / affordability / recovery, not just the Guardian card. Blocking: without it 3.5.4 cannot ship or record. (F1, F2)
2. **Containment model** — decide what a demo user may reach. Tabs, More, paywall, deep links. This is the decision that makes items 3 and 4 answerable. (F4a, F6)
3. **Hoist `StoreProvider` above the `Stack`** (`_layout.tsx:131`), *not* around `<Tabs>` — the tabs layout is recorded as breaking tab presses. (F4a)
4. **Route guard** — `_layout.tsx:132` must admit a demo for a not-yet-onboarded user without writing `onboardingComplete` to the real store, which is the legacy `demoSeed` sin the sandbox exists to retire. (F4b)
5. **Extract `sandboxRun`** from `tutorialSession` — seed/stage/story/teardown, with the story timers and their background-suspend contract. `sandboxBeats` + `scenarioForBeat` already sit on the right side of the line. (F5)
6. **Re-scope `useNoRealWritesGuard`** — a `strict` flag on `StoreProvider`; the walkthrough keeps report-on-any-write, demo mode does not, so Phase-6 Sentry gets one meaningful signal instead of a stream. (F3)
7. **A QA-gated `/demo` route** — this is the seam that makes every item above testable at all, since no overlay-less sandbox render exists today. Gate it behind the same `__DEV__ || QA_TOOLS` switch as `sandboxHarness.ts:43-46` so it disappears at the Phase-6 flip.
8. **Retire `demoSeed.ts` / `prefs.isDemoMode`** — `sandboxStore.ts:12-20` already declares this the plan; `onboarding.tsx:22` is the one consumer, and `use-payday-capture.ts:51` is the one reader of the flag.

**Cheap and belongs in THIS version** (no design decision, no dead code): re-key the two `haptics.medium()` calls at `index.tsx:324,338` from `isExample` to the session; correct the over-claiming comment at `TutorialOverlay.tsx:288`; add the scope caveat at `StoreContext.tsx:69-77`; add the staleness note (or the assertion) for `SCENARIO_BASE_DATE` at `sandboxScenarios.ts:45`.

---

# LENS D — claim-vs-code (8/8)

## VERDICT: **DOES NOT PASS**

Round 7 corrected the "wrong count" class in one file and left the same wrong count in the module the fix is centred on; its new axe comment states a false mechanism for a third-party rule; the `[inert]` exclusion is redeemed for one of the two states that carry `inert`; [D15]'s VoiceOver half is wired with nothing pinning it; and device checklist §11.3 tells the tester to derive a case the code cannot produce. The convention adopted in `9928ab2` is violated by comments written in `11237e8` and by ~43 surviving lines it did not sweep.

---

## Findings — worst first

### 1. `a11y.ts` still says "six call sites" — the exact claim round 7 headlined as wrong · **untrue claim** · HIGH
`apps/rn/src/utils/a11y.ts:37-42`

**CLAIM:** *"the `accessibilityElementsHidden` + `importantForAccessibility` pair was written out longhand at **six call sites** — the walkthrough's screen fence, its control fence, MoreButton, the forecast link, the overlay scrim and every sheet backdrop … **Four audit rounds** of a11y work was "verified" by a Playwright suite … Round 6 (2026-08-04)."*

**CODE:** `git log --oneline -3 -- src/utils/a11y.ts` → last touched by `043a501` (round 6). Neither `11237e8` nor `9928ab2` edits this file. `11237e8`'s own message: *"my round-6 comment claimed the longhand a11y pair existed at 'six call sites' and I converted four. The query the lenses wrote returns TWELVE … 24 errors, 12 sites, 10 files."*

**Divergence:** the round whose thesis was "a count is the assertion that decays" left the disproved count, its wrong enumeration, and dated audit history sitting in the file the whole fix orbits — and it is the one file the ESLint rule *exempts* (`eslint.config.mjs:49`), so no query touches it. **CONFIRMED.**

1. **FIX — correct the claim.** Replace lines 29-43's doc block with:
```
/**
 * Hide a subtree from the accessibility tree — on every platform, including web.
 *
 * `aria-hidden` is not web-only: RN's `View`/`Text`/`Image` expand it to
 * `accessibilityElementsHidden` + `importantForAccessibility` themselves. The reverse does not hold —
 * react-native-web's prop allowlist contains neither native prop and `createDOMProps` drops
 * unrecognised props silently. Use this (or `decorative`) and never hand-roll the pair; the
 * `no-restricted-syntax` rule in `eslint.config.mjs` enforces it everywhere but here.
 */
```
2. **PROOF IT LANDED** — no runtime proof; claim-only. The behavioural half is already gated by `npm run lint` (rule returns zero).
3. **COMPLETENESS QUERY** — `rg -n '\b(six|five|four|three|twelve) (call sites|sites|rounds|files|members)\b' apps/rn/src` → must return 0.

---

### 2. `TutorialOverlay`'s "the FIFTH published value" — the class round 7 says it corrected, fixed at one of two sites · **untrue claim** · HIGH
`apps/rn/src/components/plan/TutorialOverlay.tsx:124-127`

**CLAIM:** *"Release the dock height on the way out — **the FIFTH published value, and the one the round-3 sweep missed while fixing the other four.**"*

**CODE:** `9928ab2` message: *"the false claims are corrected — … **\"all FIVE published values\" was wrong a fourth time**"*, and it did correct it — in `src/app/(tabs)/index.tsx` only (diff replaces the `(All FIVE published values now release: spotlight, settling, passThrough, impact, and dockH …)` parenthetical). The sibling assertion here was not touched. It is also now false on its own terms: `tutorialShell.tsx:59` publishes `spotlight, subjectMissing, passThrough, dockH, impact`; `settling` — one of the "other four" — no longer publishes at all (`use-spotlight.ts:184`), and `subjectMissing` was added by the same commit that left this line standing.

**Divergence:** a one-member fix, in the commit that condemns one-member fixes, on the exact sentence it names. **CONFIRMED.**

1. **FIX — correct the claim.** Replace lines 124-127 with:
```
  // Release the dock height on the way out. The shell outlives every session, so a parked `dockH` skews
  // the next session's first `stageBottom`: the opening beat scrolls its subject into a stage sized by a
  // dock that no longer exists.
```
2. **PROOF IT LANDED** — no runtime proof; claim-only (the cleanup itself is `useEffect(() => () => onDockLayout?.(0), …)` at line 128 and unchanged).
3. **COMPLETENESS QUERY** — `rg -n '\b(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH)\b.*(published|value|call site|member|fence)' apps/rn/src` → must return 0. (Catches `tutorialTargets.tsx:181`'s *"the third and last fence"* too.)

---

### 3. The axe `incomplete` mechanism is stated wrongly · **untrue claim about an installed package** · MEDIUM-HIGH
`apps/rn/tests/e2e/a11y-axe.spec.ts:31-36` (and repeated verbatim in `docs/DEBT_TUTORIAL_AUDIT_2026-08-02.md:649-651`)

**CLAIM:** *"axe reports a bare `tabindex="0"` inside an `aria-hidden` subtree as NEEDS-REVIEW rather than as a failure, **because it cannot always resolve focusability statically** — and react-native-web produces exactly that shape for **every** Pressable."*

**CODE** — `node_modules/axe-core@4.12.1/axe.js:26381-26401`:
```js
function focusableNotTabbableEvaluate(node, options, virtualNode) {
  var tabbableElements = virtualNode.tabbableElements;
  if (!tabbableElements || !tabbableElements.length) return true;
  var relatedNodes = tabbableElements.filter(...);
  if (relatedNodes.length === 0 || is_modal_open_default()) return true;
  return relatedNodes.every(function(vNode) {
    var pointerEvents = vNode.getComputedStylePropertyValue('pointer-events');
    var width  = parseInt(vNode.getComputedStylePropertyValue('width'));
    var height = parseInt(vNode.getComputedStylePropertyValue('height'));
    return vNode.actualNode.onfocus || (width === 0 || height === 0) && pointerEvents === 'none';
  }) ? void 0 : false;   // void 0 = incomplete, false = violation
}
```
and `axe.js:17660-17667`: `isModalOpen` matches `dialog, [role=dialog], [aria-modal=true]` **or** an element covering ≥ `modalPercent = .75` of the viewport; `focusableModalOpenEvaluate` (`:26415-26427`) returns `void 0` when that fires.

**Divergence:** a real-sized RNW Pressable inside `aria-hidden`, with no `onfocus` and `pointer-events: auto`, evaluates `every(...) === false` → **`false` → a violation**, not incomplete. It lands in `incomplete` only when axe's modal heuristic fires — which is exactly what happened here: the audit doc's own evidence is *"a `1280×720` div carrying both attributes"*, i.e. 100% of the viewport. The conclusion (assert both buckets) is right; the stated general rule is not, and a reader who trusts it will assume a small trapped Pressable is also parked in `incomplete` when axe would fail it outright. **CONFIRMED.**

1. **FIX — correct the claim.** Replace lines 31-36 with:
```
  // `incomplete` as well as `violations`. When an element covers most of the viewport axe treats the page
  // as having a modal open, and both of `aria-hidden-focus`'s focus checks then answer "needs review"
  // instead of failing — which is precisely the shape a full-screen fence has. Checked against
  // `violations` alone this scanner stayed green on a full-viewport aria-hidden tab stop.
```
2. **PROOF IT LANDED** — `npm run e2e:fresh:rn -- a11y-axe.spec.ts`; red-to-green proof unchanged (delete `tabIndex={-1}` from `SheetBackdrop.tsx:32`, the sheet case must go red).
3. **COMPLETENESS QUERY** — no static query for "asserts third-party behaviour". Rule: any comment asserting what a package in `node_modules` does must cite the file and symbol it was read from (as this replacement does not, but the audit doc §P should).

---

### 4. [D15]'s VoiceOver half would survive its own deletion · **coverage hole** · MEDIUM-HIGH
`apps/rn/src/components/plan/TutorialCoach.tsx:50` · `apps/rn/src/store/spotlightPolicy.test.ts:3-11`

**CLAIM** (`spotlightPolicy.test.ts:6`): *"This exists because the mechanism it covers shipped with **NO test at all**"* — and `11237e8`: *"8 assertions now pin it."*

**CODE:** all 8 assertions call `isSubjectMissing` / `shouldDegradeToScripted` directly. Nothing asserts the wiring. Delete `subjectMissing={shell.subjectMissing}` from `TutorialCoach.tsx:50` and: the rendered body still degrades (line 46 reads `shell.subjectMissing` separately), the announcement silently reverts to `subjectMissing = false` (`TutorialOverlay.tsx:83`), `npm run test:app` stays green, and all 123 e2e stay green — no test induces an unmounted subject. That is the *exact* 3.5.3.3.4.1 failure ("`stepAnnouncement` is pure and its unit test kept passing, because the test covers the FUNCTION, not the fact that anyone calls it"), one commit after the file that already solved it (`tutorialPath.test.ts:115` source-scans for the call).

**Divergence:** the module doc claims the mechanism is now pinned; only the arithmetic is. **CONFIRMED.**

1. **FIX — make it true.** Add to `tutorialPath.test.ts` alongside the existing announce guard:
```ts
const coach = readFileSync(join(__dirname, '../components/plan/TutorialCoach.tsx'), 'utf8');
assert(/subjectMissing=\{shell\.subjectMissing\}/.test(coach), 'the overlay receives subjectMissing (else the announcement and the rendered body disagree)');
assert(/stepBody\(step, run, shell\.subjectMissing\)/.test(coach), 'the rendered body resolves through subjectMissing');
```
2. **PROOF IT LANDED** — `npm run test:app`; delete `TutorialCoach.tsx:50` → red.
3. **COMPLETENESS QUERY** — `rg -n 'export function (isSubjectMissing|shouldDegradeToScripted|stepBody|stepAnnouncement)' apps/rn/src` then, for each, assert a source-scan guard exists in some `*.test.ts` → every extracted pure decision has a caller guard.

---

### 5. Device checklist §11.3 derives its case from a scenario the code cannot produce · **untrue claim** · MEDIUM-HIGH
`docs/DEBT_3.5_DEVICE_QA_CHECKLIST.md:222-228`

**CLAIM:** *"**§11.3** — If §11.2 produced a run where a step's bright rectangle never appeared, read that step's text. **PASS:** the text does NOT tell you to open, drag, move or confirm anything."*

**CODE** (`use-spotlight.ts:97` and `:127`):
```ts
setUnmeasurableFor(targets.has(targetId) ? null : targetId);
…
setUnmeasurableFor(settled === null && !targets.has(targetId) ? targetId : null);
```
`has(id)` is `nodes.current.has(id)` (`tutorialTargets.tsx:99`) — mounted-ness, deliberately not measurability.

**Divergence:** §11.2's scenario is a slow-hardware **measure timeout on a mounted control** — `has()` true → `unmeasurableFor` null → `shouldDegradeToScripted` false → the beat shows **no rectangle and its full interactive copy** ("Open it and move the line"). So the run §11.3 tells the tester to inspect is exactly the run that does *not* degrade, and inspecting it produces a §11.3 FAIL for behaviour that is working as designed. The degrade path fires only when the control is genuinely unmounted, and §11 gives the tester no way to induce that. **CONFIRMED.**

Secondary, same item: when the degrade *does* fire on beat 3, the shipped copy is `tutorialPath.ts:128` — *"…and **you can move it** whenever you like."* §11.3's PASS bans text that tells you to "move" anything; a literal tester marks correct behaviour as FAIL.

1. **FIX — correct the claim.** Replace §11.3's first two lines with:
```
- [ ] **§11.3 — a beat whose control is not rendered still reads honestly** _(any iPhone.)_
  Money tab → delete every debt, then return to Today and open the walkthrough. Step to **3 of 7** and
  **4 of 7**.
  **PASS:** the text describes what the Guardian does and does not ask you to open, drag or confirm
  anything. The step count still advances one at a time, and **Back** returns and **stays**.
```
(and drop "move" from the banned-verb list, or reword `bodyIfNoSubject` for `line` to end *"…and it is yours to set."*)
2. **PROOF IT LANDED** — no runtime proof on web (`has()` false requires the control unmounted, which the sandbox scenario always renders); device-gated. Closest automated proof: `npm run test:app` already pins the policy.
3. **COMPLETENESS QUERY** — for each §11 item, grep the symbol its PASS line depends on and confirm the item's trigger reaches it: `rg -n 'unmeasurableFor|targets.has\(' apps/rn/src` → every §11 item citing a degraded beat must name an unmount trigger, not a timing trigger.

---

### 6. The `[inert]` exclusion is proven for one of the two states that carry `inert` · **coverage hole with a comment over it** · MEDIUM
`apps/rn/tests/e2e/a11y-axe.spec.ts:25-30, 66-93`

**CLAIM:** *"The exclusion is only safe because the 'keyboard focus cannot enter a fenced region' test below proves it by tabbing, rather than trusting the attribute's presence."*

**CODE:** `new AxeBuilder({ page }).exclude('[inert]')` runs in all four scan tests. The focus test (`:81-93`) navigates to `/tutorial` and tabs 25 times **at beat 1 only** — it never presses Next. The `'an interactive beat — the fence is open'` test (`:66-74`) advances to beat 3, where `TutorialFence` is inert (`TutorialFence.tsx:31,34` — keyed on `useTutorialSession(s => s.active)`, true on every beat) and `TutorialTarget`'s `control` fence is inert for the non-coached control (`tutorialTargets.tsx:180,184`).

**Divergence:** on the interactive beat the screen fence is *open by design*, so `inert` is the only tab-order fence left — and that is the one state where the exclusion is taken on trust. **CONFIRMED.**

1. **FIX — make it true.** Extract the tab loop into a helper and call it a second time after the two `Next` clicks in the interactive-beat test:
```ts
async function focusNeverEntersAFence(page) {
  expect(await page.locator('[inert]').count()).toBeGreaterThan(0);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('[inert],[aria-hidden="true"]'));
    expect(inside, `focus entered a fenced region after ${i + 1} tabs`).toBe(false);
  }
}
```
2. **PROOF IT LANDED** — `npm run e2e:fresh:rn -- a11y-axe.spec.ts`; remove `useInert(nodeRef, fenced)` from `tutorialTargets.tsx:184` → the new interactive-beat call must go red (it currently would not).
3. **COMPLETENESS QUERY** — `rg -n "exclude\('\[" apps/rn/tests/e2e` → every scanner exclusion must be named in a test that exercises the excluded mechanism in **each** state the scanner visits.

---

### 7. Convention violations surviving in the feature · **convention** · MEDIUM (quantified, as asked)

`9928ab2`: *"Comment convention applied **where it was worst**."* Sweep of the named files:

`rg -niE '(^|[^a-z])(round [0-9]|used to|had been|was tried|previously claimed|earlier attempt|the first version of this)' apps/rn/src apps/rn/tests` → **43 matching lines across 11 files in this feature**: `TutorialOverlay.tsx` 10 · `tutorialTargets.tsx` 7 · `PaydayGuardianCard.tsx` 5 · `app/(tabs)/index.tsx` 5 · `tutorial-invite.spec.ts` 4 · `tutorialPath.ts` 3 · `use-spotlight.ts` 3 · `tutorialShell.tsx` 2 · `tutorialSession.ts` 2 · `TutorialFence.tsx` 1 · `a11y.ts` 1.

The flagrant ones — each is *meta-commentary about which comment was wrong*, banned outright by rule 2, and **three of the five were written by `11237e8` itself**:

- `TutorialOverlay.tsx:34-37` — *"⚠️ This paragraph **used to say** the layer 'becomes pass-through'. That was true until 3.5.3.5.9 and false after it, and it survived here for a full phase…"*
- `tutorialTargets.tsx:151-163` — *"(Round 5 wrote that second one as… **the symptom was invented**…)"* + *"⚠️ SCOPE — read this before trusting it. Round 5 introduced this and claimed it 'covers every current and future coached control at once'. It covers… **which today is two**"*
- `app/(tabs)/index.tsx:310-315` — *"An earlier attempt at this note dropped a word and described the CURRENT mechanism as the old one — **the correction had itself become a false claim**."*
- `use-spotlight.ts:158-160` (round 7's own file) — *"Round 6: there were **THREE** `measure` call sites, not the '**two**' **the comment above claimed**"* — and the comment above no longer says two, so the reference is dangling.
- `tutorial-invite.spec.ts:583-587` (written by `11237e8`) — *"**The first version of this test** measured the largest `aria-hidden` bounding box instead. It passed only because…"* and *"**This gate has shipped that shape four times**."*
- `PaydayGuardianCard.tsx:268-273` (round 7's own file) — *"Round 6: this was wrapped in `<TutorialTarget id="guardian-line">` … **still shipping five rounds later**."*

1. **FIX — correct the claims: delete, don't annotate.** Each block above reduces to its live assertion, e.g. `use-spotlight.ts:158-160` → `// The same retry as the other measure call sites.`; `tutorial-invite.spec.ts:583-587` → delete entirely (the two paragraphs above it already state the property); `TutorialOverlay.tsx:34-37` → delete entirely; `tutorialTargets.tsx:151-163` → `* This wrapper reaches only controls that are TutorialTargets. Ordinary Today controls are fenced by the screen's screenReachable fence, not here.`
2. **PROOF IT LANDED** — no runtime proof; claim-only. `npm run typecheck` guards only that deleted backticked symbols were not code.
3. **COMPLETENESS QUERY** — a static query catches the dominant forms but not the class:
   `rg -niE '\b(round [0-9]|used to|had been|previously|earlier attempt|the first version|no longer|this was removed|was wrong)\b' apps/rn/src apps/rn/tests --glob '*.ts*'` → 0, **and**
   `rg -nE '\b(all|every|both|only|the) (FIVE|FOUR|THREE|TWO|SIX|five|four|three|two|six) (call sites?|sites?|members?|values?|fences?|shells?|beats?|rounds?)\b' apps/rn/src` → 0.
   **Honest limit:** no static query detects a comment that narrates history without those tokens, or a count expressed as prose. Recommend the rule instead: **a comment may not contain a past-tense verb about the codebase, and may not contain a numeral or number-word describing a quantity of code.** Both halves are grep-approximable and human-checkable in one read; neither is decidable.

---

### 8. `useInert`'s RNW claim overstates · **untrue claim** · LOW-MEDIUM
`apps/rn/src/hooks/use-inert.ts:9-11`

**CLAIM:** *"react-native-web gives **every** `Pressable` an explicit `tabIndex` of **0**, so a fenced region keeps every control inside it in the tab order."*

**CODE** — `node_modules/react-native-web@0.21.2/src/exports/Pressable/index.js:193-197`:
```js
let _tabIndex;
if (tabIndex !== undefined) { _tabIndex = tabIndex; }
else { _tabIndex = disabled ? -1 : 0; }
```
**Divergence:** a disabled Pressable gets `-1`. This is load-bearing in-repo: `more-button.tsx:31-37` is the one aria-hidden-toggling Pressable in this feature with neither `useInert` nor `tabIndex={-1}`, and it is safe **only** because it also sets `disabled={inTutorial}` — a coupling no comment or test records. Drop `disabled` for any reason and MoreButton becomes the `aria-hidden-focus` defect again, with `tutorialTargets.tsx:181`'s *"the third and last fence"* asserting the class is closed. **CONFIRMED** (claim), **PLAUSIBLE** (latent regression).

1. **FIX — correct the claim.** Line 9-11 → `* an explicit \`tabIndex\` — 0 unless the Pressable is disabled — so a fenced region keeps its enabled controls in the tab order.` And at `more-button.tsx:37`, add `tabIndex={inTutorial ? -1 : undefined}` so the fence does not depend on `disabled`.
2. **PROOF IT LANDED** — `npm run e2e:fresh:rn -- tutorial-invite.spec.ts`; the `'no aria-hidden region contains a tabbable element'` test covers `/` during a walkthrough, where MoreButton renders — remove `disabled` today and it goes red, which is the current accidental proof.
3. **COMPLETENESS QUERY** — `rg -n 'a11yHidden\(' apps/rn/src -A2 -B8 | rg -n 'Pressable|TouchableOpacity'` → every Pressable receiving `a11yHidden` must also carry `tabIndex={-1}` or sit under `useInert`.

---

### 9. Docs · LOW
- **`docs/DEBT_ELEVATION_PLAN.md:12`** — CLAIM: *"**▶ Next action:** build **3.5.0 `createSandboxStore`** — the substrate blocker-fix everything else stands on."* CODE: `apps/rn/src/store/sandboxStore.ts` exists with `sandboxStore.test.ts`, and 3.5.0–3.5.3.9 round 7 have shipped. §3.5 contains no description of round 7 at all. **CONFIRMED.** **FIX:** `- **▶ Next action:** 3.5.3.9 audit gate — round 8 in flight. Round-by-round detail → \`DEBT_TUTORIAL_AUDIT_2026-08-02.md\`.` **PROOF:** none — claim-only. **QUERY:** `rg -n '▶ Next action' docs/` cross-checked against `MASTER_PLAN.md`'s `▶▶` marker → they must name the same item.
- **`docs/DEBT_TUTORIAL_AUDIT_2026-08-02.md:699-700`** — CLAIM: *"117 → 123: the policy suite, the role-based fence assertion, the focus-trap check, and four axe states."* CODE: the policy suite is `test:app` (unit, `runAppTests.ts`), not e2e; the role-based fence assertion is a rewrite of an existing test, not an addition; the actual sixth e2e is `'no aria-hidden region contains a tabbable element'`, unnamed. The **total is right** — `npx playwright test --list` → `Total: 123 tests in 25 files`. **FIX:** `(117 → 123: five axe-spec tests and the whole-app tabbable-fence check)`.

---

## Verified true — these close

- **RN maps `tabIndex` → `focusable`.** `node_modules/react-native/Libraries/Components/View/View.js:80-81`: `if (tabIndex !== undefined) { processedProps.focusable = !tabIndex; }`. `SheetBackdrop.tsx:30-31`'s claim holds, including through RN `Pressable` (`Pressable.js:214,250` spreads `restProps` into `View`, and `View`'s post-spread assignment wins over `focusable: focusable !== false`).
- **`aria-hidden` really expands to both native props.** `View.js:69-73`, `Text.js:138-140`, `Image.ios.js:169-171`, `Image.android.js:315` — `accessibilityElementsHidden` plus `importantForAccessibility: 'no-hide-descendants'` when true. All 14 `a11yHidden`/`decorative` call sites land on `View` or RN `Pressable`; none on a component that drops it.
- **RNW's Pressable tabIndex really short-circuits `focusable`.** `createDOMProps/index.js:826-834` — the `focusable` branch is the `else` of `tabIndex === 0 | '0' | -1 | '-1'`. Round 7's diagnosis of the shipped `focusable={false}` no-op is exactly right.
- **`apps/rn` really has no component/hook test runner.** `apps/rn/package.json` devDependencies are exactly `@types/react` and `typescript`.
- **`spotlightPolicy` — 8 assertions, all green.** `npm run test:app` → `✅ spotlight policy: 8 assertions passed.` Full app suite green. Deleting either exported function breaks the import, so it cannot pass vacuously.
- **[D15] "the rendered copy and the announcement cannot disagree" — TRUE end to end.** `TutorialCoach.tsx:46` `body={stepBody(step, run, shell.subjectMissing)}` and `:50` `subjectMissing={shell.subjectMissing}` → `TutorialOverlay.tsx:114` → `stepAnnouncement(position - 1, run, undefined, subjectMissing)` → `tutorialPath.ts:256` calls the same `stepBody` on the same `TUTORIAL_STEPS[index]` with the same `run`. Single source (`shell.subjectMissing`), single resolver. *(Unguarded — see finding 4 — but true today.)*
- **[D15] "keeps its place" — TRUE.** No `goTo`/`nextIndex` call is reachable from `unmeasurableFor`; the only consequence is the body swap and the re-announce dep at `TutorialOverlay.tsx:68`.
- **§11.6 "a stronger haptic at exactly two moments" — TRUE.** `haptics.medium()` appears exactly twice in the arc: `index.tsx:330` (floor save) and `:344` (bills attest). Every other tutorial haptic is `haptics.light()` at `TutorialOverlay.tsx:64`.
- **§11.9 "an 'Example' marker is visible on step 5" — TRUE.** `TutorialOverlay.tsx:290` renders `Step {position} of {total} · Example money` on every beat, plus the card chip at `PaydayGuardianCard.tsx:207-213`.
- **The Guardian card's floor amount reaches the a11y tree.** `PaydayGuardianCard.tsx:191` adds `` `Your line ${money(brief.floor)}` `` to the card's `groupLabel`, while its row stays `a11yHidden(true)` at `:274`.
- **Round 7 part 2's environment fixes are all really in the code:** `SETTLE_MS` gated (`use-spotlight.ts:129` `reduceMotion ? 0 : SETTLE_MS`), `headerHeight` clamp removed (`index.tsx:89`), `nav` gains `flexWrap: 'wrap'` (`TutorialOverlay.tsx:475`), `settledDims === dims` folded into `screenReachable` (`index.tsx:811`), `suspendStoryOnBackground()` wired at `_layout.tsx:89`.
- **123/123 e2e.** `npx playwright test --list` → `Total: 123 tests in 25 files`.
- **`SheetBackdrop`'s "all three shells" — TRUE** (`FormSheet.tsx:108`, `AnimatedSheet.tsx:52`, `PaydayCaptureSheet.tsx:210`). **`TutorialTarget`'s "which today is two" — TRUE** (`guardian-reserve`, `guardian-adjust`). **`useInert`'s "the third and last fence" — TRUE today** (3 call sites). All three are correct *and* the banned form; see findings 2 and 8.
- **The `spotlight.test.ts` source scan is genuinely stronger.** `readdirSync(SRC, { recursive: true })` really globs all of `src`; `[^<]` really crosses an arrow-function prop; `REGISTERED.length === OPEN_TAGS` really fails on a partial miss where `length > 0` did not. `</TutorialTarget>` cannot inflate `OPEN_TAGS`.