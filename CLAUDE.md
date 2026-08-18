@AGENTS.md

# Debt Planner — start here

v1.7 "The Elevation": Debt at or above the rest of the portfolio, acquisition-ready.
Ships as **ONE release** — nothing launches until Phase 6 is done and Jason is satisfied.

⚠️ The `@AGENTS.md` note above is about the **legacy Next/Capacitor surface** at the repo
root, which **5.5.1 deletes**. The live app is `apps/rn` (Expo/RN) over `packages/core`.

## ⚠️ `docs/DEBT_ELEVATION_PLAN.md` is the point of truth

It carries **▶ BUILDING NOW** (exactly one decomposed item), the phase table, the deferred
backlog and the decision log. **Read it before touching anything.**

**ACTIVE: audit-gate remediation — T1 + T2 closed, ▶ T3 (correctness) is next.**
Phases 0–3 · 3.5 · 3.7 · 4 · **3.8** are closed, and the **whole-app audit has RUN**:
7 lenses, **117 findings**, 12 refutations → [`docs/audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md`](docs/audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md).
T1–T8 are decomposed on the plan; T9–T11 parked; T12 → Phase 6.

⛔ **3 of 4 agent-declared blockers did NOT survive refutation.** The lenses' self-reported *confidence* was
reliable every time; their *severity* was not. **No finding becomes work un-refuted** — `findings/L9-refutations.md`
records the 12 claims actually re-checked; anything not in it carries only its own lens's confidence.

⚡ **3.8 (the expense reserve) closed 2026-08-17, and its lesson generalises:** every one of its six steps found
a defect the step before it could not have found, and **three of the five were introduced by 3.8 itself**. A
before-scan catches *stale claims*; it structurally cannot catch a defect you are about to write.
⛔ **The sharpest: `route-smoke.spec.ts` — which exists verbatim for "a blank route passes silently" — passed
10/10 while Today rendered BLANK for every user with a bill**, because its fixture seeded no expenses and the
offending selector returns a stable `null` on an empty plan. *A fixture chosen for convenience decides which
defects a guard can see.* (Fixed in T1: `scenario()` now seeds a bill.)

## A pre-authored item is a HYPOTHESIS, and it fails two ways

Measured twice, on two separate authoring passes:

- **Wave A** (2026-08-11) — of **14** items, **5 did not exist** and **4 more were materially
  misdescribed**. Only ~5 of 14 were both real and accurately described.
- **Wave B** (2026-08-11) — of **4** items, **1 was refuted outright**, **1 was already half
  shipped**, **1 was wrong in 3 of its 4 stated premises**, **1 was clean.**

The ledger is reliable about **where** to look and unreliable about **what is there.**

- **The before-scan catches STALE** — already fixed, or never real. Minutes per item.
- **Only BUILDING catches MISDESCRIBED.** A before-scan confirms the code path exists and
  looks as described — which is exactly how an inverted item slips through. `A3.7` claimed a
  default was "deferrable" when it was `essential`; built as written it would have made a
  discretionary purchase *less* cuttable.

So when you reach the code, **re-read the thing the item asserts** — the default branch, the
comparison direction, the fallback. Two tells, both real here: a **stale doc comment that
contradicts the assertions beside it** (that is what generated the inverted item), and a
premise phrased as a **closed set** ("the only way is X" — there were two other ways).

⚠️ **And it is not a property of OLD items.** Wave B produced two wrong claims *the same
session they were written*: an item asserting the rollover should clear `autopayFailedThisCycle`
(the persistence is load-bearing — clearing it would silently presume a bill the user reported
never ran had been paid), and a confident "re-rendering resets the swipe pan" inferred from a
failure whose real cause was unrelated. **A claim's age is not what makes it wrong.** Check the
mechanism, not the symptom — including your own.

## The gate

```bash
npm run validate:release:rn     # typecheck:core → typecheck:rn → lint → regression → app → scenarios → e2e
```

**184 e2e + 10 embed + 10 `test:stamp` + 83 lane checks, tsc clean on both trees**, zero
`error-context.md`. CI runs it on every push. ~15 min locally.

⚠️ **It ran no `tsc` at all until 2026-08-11**, and two commits shipped green with real type
errors before that was found. `packages/core` had been unchecked since `validate:release:legacy`
was retired 2026-07-24. Both typechecks now run FIRST so they fail fast.

⚠️ **A green suite often means untested, not correct.** Before trusting a pass, ask whether any
test *would have failed*. The offline-Lifetime mislabel shipped green because nothing covered
the Lifetime row, the manage link, or the offline path. The same trap works at the level of a
single assertion: an a11y check passed while spreading `{...a11yHidden}` — the *function*, so no
props at all — because the query it used happened to find nothing either way. **A green assertion
is not evidence until you know which failure it would have caught.**

## Environment quirks that cost real time

- **`cwd` drifts.** Prefer `git -C /c/Users/Jason/debt-app-v1 …` and absolute paths.
- **Throwaway `tsx` probes must run with `apps/rn` as cwd** — the `@/*` and `@core/*` aliases
  resolve from `apps/rn/tsconfig.json`. A probe in the scratchpad, or run from the repo root,
  dies with `MODULE_NOT_FOUND`. Core tests run the same way:
  `cd apps/rn && npx tsx ../../packages/core/debt/testX.ts`.
- **Measure, don't derive.** Engine figures compose through `effectivePaycheckBuffer` and the
  §2.5 waterfall and are **not** predictable by reading. Two test fixtures this session were
  wrong on the first try from reasoning that looked sound. Write a probe, print the numbers,
  then write the assertion.
- **Prove a test fails before trusting it.** Revert *only the source* — `git stash` takes the
  test with it and proves nothing.
- **e2e:** `webServer` spawns its own `serve` on :4319 and can reuse a STALE one, serving an
  outdated `dist`. Force a fresh `export:web` when adding a route. ⚠️ Run the RN suite through
  its own config (`npm run test:e2e:rn`) — a bare `npx playwright test` picks up the ROOT config,
  which builds the legacy Next tree and dies on a pre-existing type error.
- ⛔ **`force: true` does NOT mean "send this event to this element."** It skips actionability but still
  clicks **coordinates**, does not wait for the element to stop moving, and delivers to whatever is
  topmost at that instant. That flaked `tutorial-invite › the tabs are held…` **three times** (CI
  2026-08-10 · local 08-11 · local 08-18, the last one red a release gate) — the test's subject was the
  tab-press LISTENER, but measured with `elementFromPoint` the topmost node there is
  `tutorial-scrim-blocker`, so it was really asserting on the scrim's layout. ✅ **Fixed 2026-08-18** with
  `dispatchEvent('click')`, which fires on the ELEMENT — no coordinates, no stability requirement.
  ⚠️ The failure mechanism was never reproduced (an instrumented full-suite run came back green), and
  the old "the session had ended" note was never proven — **`shell` is ruled out** (provider and coach are
  both in the root layout). **When the subject is a handler rather than a hit-target, use `dispatchEvent`.**
- **Driving gestures in e2e:** gesture-handler's pan is a **touch** gesture — a Playwright mouse
  drag registers as a tap. Drive real touch via CDP (`Input.dispatchTouchEvent`). ⚠️ **Those
  coordinates are VIEWPORT-relative**, and `boundingBox()` on a row far down a long screen returns
  a y outside the viewport, so the touch lands on nothing: the gesture never fires and the symptom
  is a bogus "subtree intercepts pointer events". **`scrollIntoViewIfNeeded()` first, measure after.**

## Standing constraints

- **Never push to `release/v1`** — it is the default branch and gated on an approved version.
  Work happens on `v1.7-dev`.
- **`QA_TOOLS = true` ships in TestFlight and MUST be flipped false before submission**
  (`git grep QA_TOOLS`). It is what makes the demo reachable at all.
- **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT
  (3.2.x ships broken) · `react-native-ios-utilities ^5.2.0`.
- **`expo.name` stays `"Debt Planner (RN)"`** — it derives the Xcode project name, hardcoded
  10× across three pipelines. The Home-Screen name is `ios.infoPlist.CFBundleDisplayName`.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

## Two rules the engine keeps re-teaching

- **One rule, one owner.** "Two places, one rule" produced three separate defects in Wave A
  alone — two debt shapes in one directory, one premium ternary on two screens, one claim in
  four strings. Agreeing copies are still copies; they just have not diverged *yet*.
- **Never claim an outcome you only sometimes deliver.** Two shapes of this shipped: an
  affordance gated on a **proxy** rather than the thing it promised, and one whose **resource
  was bounded** so a `Math.min` capped it short of its own claim. Both read as honest code.
