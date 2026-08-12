@AGENTS.md

# Debt Planner — start here

v1.7 "The Elevation": Debt at or above the rest of the portfolio, acquisition-ready.
Ships as **ONE release** — nothing launches until Phase 6 is done and Jason is satisfied.

⚠️ The `@AGENTS.md` note above is about the **legacy Next/Capacitor surface** at the repo
root, which **5.5.1 deletes**. The live app is `apps/rn` (Expo/RN) over `packages/core`.

## ⚠️ `docs/DEBT_ELEVATION_PLAN.md` is the point of truth

It carries **▶ BUILDING NOW** (exactly one decomposed item), the phase table, the deferred
backlog and the decision log. **Read it before touching anything.**

**ACTIVE: 4.1 — the Maestro coverage lane, resuming at 4.1.3.** ⚠️ **The native lane is RED and has
been since 2026-08-10**, so everything Phase 3.7 shipped was verified against a web-only suite.
Phase 3.7 is **CLOSED** (Wave A + Wave B; Wave C merged into the audit gate).

Read in this order:

1. **`docs/DEBT_ELEVATION_PLAN.md`** — the lean driver. What is being built, what is next, what is blocked.
2. **`docs/DEBT_ELEVATION_LOG.md`** — why every decision was made. ~4k lines, chronological. Read the entries for anything you are about to change.
3. **`docs/DEBT_3.5_DEVICE_QA_CHECKLIST.md`** — the runnable device-owed truth. Currently owes **A0.4** and **A8.4**.

If a plan item and the code disagree, **the code wins** — see below.

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

**167/167 + tsc clean on both trees**, zero `error-context.md`. CI runs it on every push. ~5–6 min.

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
- **⚠️ One intermittent, now seen TWICE:** `tutorial-invite › the tabs are held while a session is
  running` (CI 2026-08-10, local 2026-08-11). Both times the session had ended when the test
  expected it running; both times re-running that spec alone passed. Capture full output rather
  than filtering, so a flake can be named.
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
