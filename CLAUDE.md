@AGENTS.md

# Debt Planner — start here

v1.7 "The Elevation": Debt at or above the rest of the portfolio, acquisition-ready.
Ships as **ONE release** — nothing launches until Phase 6 is done and Jason is satisfied.

⚠️ The `@AGENTS.md` note above is about the **legacy Next/Capacitor surface** at the repo
root, which **5.5.1 deletes**. The live app is `apps/rn` (Expo/RN) over `packages/core`.

## ⚠️ `docs/DEBT_ELEVATION_PLAN.md` is the point of truth

It carries **▶ BUILDING NOW** (exactly one decomposed item), the phase table, the deferred
backlog and the decision log. **Read it before touching anything.**

⭐ **THE AUDIT GATE IS CLOSED (2026-08-19). T1–T8 + T3B are all done, and the [D37] exit check PASSES:
55 of 55 blocker/major findings trace to a closure or a recorded refutation** — now enforced every push by
`lint:closure`, not by memory.

⭐ **PHASE 5 IS CLOSED (2026-08-19).** The v1.6 → RN bridge is built, 5.10's adversarial audit is green, the
migration is **verified on a live device**, and the cutover is **conditionally approved** — the condition
being that cloud backup still ships, so the app is **not frozen**. ▶ **Phase 6 (launch-ready) is ACTIVE**,
decomposed as **P6.1–P6.21** at the top of the plan, and it ends at ASC submission. **This ships as
`2.0.0`** ([D38]); the internal workstream keeps the name *"the v1.7 Elevation"*.

⚠️ **Read the plan's numbering legend before quoting a step id.** `P6.n` is the sequence; **"6.C" (cloud
backup) = P6.3** and **"6.5" (repo consolidation, was 5.5) = P6.11**, so a commit or log entry naming
`5.5.1` means **P6.11.1**.

⛔ **The result worth carrying out of eight items: an audit finding's site list is where to START looking,
never the class.** Measured on five consecutive items, always undercounting — T4 needed material
correction on 5 of 11 · T5's L1-12 was **2 of 9** sites · T6's formatter count went **6 → 7 → 9 → 12**,
three enumerations each short · T7's sweep found **34** sites beyond the finding · T8's L2-5 was **3 files
not 2**. **Budget the enumeration, not the list.**

⚡ **Refutation earned its keep SIX times** — building the findings as written would have made the app
worse: L1-16 rewrote ~20 strings for a surface **5.5.1 deletes** · half of L3-7 would have reported
**every autopay FAILED** · L1-13's own wording would have **undone T4** · L2-6's fix would make five dead
engine strings load-bearing · L4-8 would have undone the App Preview cents sweep · and T4.1b's
"it moves Guardian states" flipped the band **0 times in 1,820**.

⭐ **[D31] is now evidence, not a principle.** Gates written this phase caught what enumeration missed:
`lint:money` found **4 hand-rolled formatters on its first run** (one rendered `$1234` to VoiceOver);
`lint:copy` red on **T4.4 creating** a duplicate; `lint:closure` found **6 of 55 high+ untraceable, every
one already built**. Four gates added or extended; **e2e 184 → 196**.

⛔ **And my own instruments failed at a steady rate — assume yours will.** 7 of 7 first-cut probes in T3
were wrong in a way that PASSED · a T6 plant **passed** because the fixture had no cents · a T8 script
deleted **489 lines** (CRLF vs a bare `}`) · a baseline was set **12 too high**, leaving a +1 detector
unable to detect +1. **What caught them every time: `tsc` and mutation-planting. What caused them:
hand-rolled mechanical edits.** Prefer the Edit tool — it fails loudly where a script guesses.

⚠️ **Still owed before launch:** the **device pass** (52 rows + [T3.2]'s storage-fault row — two T3
surfaces ship on unit assertions with **no rendered proof**) · the **62** in `REMAINING.md` — ✅ **P6.2
re-measured it 2026-08-20**, T9–T11 are retired as drivers and the parser is proven lossless (117 = 55 + 62)
· 44 baselined hand-written local parses · dead `formatDisplayAmount`.

🔴 **P6.3 (cloud backup) is BUILT and blocked on 🎯's Apple portal** — container + capability, 5 minutes,
`docs/DEBT_ICLOUD_SETUP.md`. Until then **any build carrying it fails at SIGNING.** ⛔ And nothing about it
is proven off-device: web exercises only the *unavailable* branch, by construction.


Phases 0–3 · 3.5 · 3.7 · 4 · **3.8** are closed, and the **whole-app audit has RUN**:
7 lenses, **117 findings**, 12 refutations → [`docs/audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md`](docs/audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md).

✅ **[D37] SATISFIED 2026-08-19 — 55/55.** The exit was **not** "T1–T8 closed"; it was **all 55
blocker+major closed or explicitly refuted, each traceable to its finding id**, and that is now checked by
`lint:closure` on every push rather than by hand. ⚠️ Auditing
the plan against the findings showed **the ledger did not cover its own high+ set** — 8 majors sat
outside the gate → now **T3B**. Two more look already closed by T1 and were never recorded against their
ids; **an untraceable closure is indistinguishable from an open finding.**

⛔ **NOTHING IS PARKED** *(🎯 2026-08-18)*. **T9–T11 are SEQUENCED, not shelved** — the remaining
minor/polish findings stay live and are re-evaluated once T1–T8 lands, because several become cheaper or
moot by then. **A finding leaves this audit by being fixed or refuted on the record, never by aging out
of attention.**

⚠️ **Grep the plan's finding ids with the ranges EXPANDED.** It compresses them as `L1-5/6/7/14/19`, so a
literal search for `L1-6` matches nothing — the first pass reported ~30 unassigned high+ and the real
number was 4. ⭐ **`scripts/check-audit-closure.ts` does that expansion for you** — it is why the check is
code rather than a habit.

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

**205 e2e + 10 embed + 10 `test:stamp` + 83 lane checks, tsc clean on both trees**, zero
`error-context.md`. CI runs it on every push. ~15 min locally.

⚠️ **It ran no `tsc` at all until 2026-08-11**, and two commits shipped green with real type
errors before that was found. `packages/core` had been unchecked since `validate:release:legacy`
was retired 2026-07-24. Both typechecks now run FIRST so they fail fast.

⛔ **AND THE RULE APPLIES TO THE PROBE YOU JUST WROTE. Measured across T3: 7 of 7 first-cut instruments
were wrong in a way that would have PASSED.** A `TZ` that never changed (5 zones measured as 1) · a
mutation that matched two functions and died on a `ReferenceError` · a probe writing to a field that does
not exist · a fixture whose valid answer equalled the bug's answer · assertions that would pass a
"take the last item" implementation · a test poking `localStorage` the hydrated app never re-reads · a
message API that no-ops on web. **Every one was caught by asking *which failure would this catch?* —
so treat a fresh instrument as wrong until it has been shown to fail on the defect.**

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
- ⛔ **`TZ=… node …` through Git Bash is DROPPED here; assign `process.env.TZ` at RUNTIME instead.**
  Measured both ways 2026-08-18: the env-prefix form left the host zone in place (offset unchanged),
  while a runtime assignment took effect immediately. A timezone test written the natural way therefore
  runs every case in one zone and reports a pass per case. **Assert the zone actually changed before
  trusting anything measured in it** (`packages/core/utils/testLocalDate.ts` does). Restore the original
  `TZ` in a `finally` — `runRegressionTests` imports every suite into one process, so a leaked zone
  silently re-times the ones that follow.
- **Measure, don't derive.** Engine figures compose through `effectivePaycheckBuffer` and the
  §2.5 waterfall and are **not** predictable by reading. Two test fixtures this session were
  wrong on the first try from reasoning that looked sound. Write a probe, print the numbers,
  then write the assertion.
  ⛔ **But `tsx` does NOT typecheck, so a probe can write to a field that does not exist and print
  confident nonsense.** One assigned `store.expenses` — the field is `requiredExpenses` — and reported
  `totalRequired: 0` against a rent that was really being counted, which reads exactly like a finding.
  **A probe's output is evidence about the probe until its fixture is checked.** Print the fixture back,
  or run `tsc` over it.
- ⚡ **On an e2e failure, read `error-context.md` BEFORE touching the code.** Its page snapshot says what
  actually rendered. It has twice now shown the FIX working and the TEST wrong — without it the obvious
  next move is to debug working code. ⚠️ And prefer a container `testID` over a stat inside it for
  presence checks: `guardian-reserve-amount` renders in most Guardian states but **not** in `clear`,
  which is exactly the state a new user is in.
- ⛔ **A COPY RENAME IS NOT DONE WHEN THE APP COMPILES — sweep by RETIRED STRING, and in four places.**
  T4.4 renamed one vocabulary and needed **four** rounds to actually land, each caught by a different
  instrument after the previous one went green:
  1. `head -30` on the enumeration **hid half the class** — the reported blast radius was 5× too small.
  2. A **case-sensitive** spec grep missed `getByText(/Bills confirmed/)`.
  3. `lint:copy` caught the rename **creating** a new 3-file duplicate ("Everyday spending").
  4. The **Maestro** flow `06-tutorial-interactions.yaml` asserted copy no web test can see, and
     `route-smoke` pinned a screen title nothing else did.
  **The reliable sweep is: list every string you RETIRED, then grep each one, case-insensitively, with no
  `head`, across `apps/rn/tests` AND `apps/rn/.maestro` AND `packages/core/**/test*.ts`.** Term-by-term
  greps ("bill") miss the sites; retired-string greps do not. ⚠️ And the unit suites, `tsc` and 45 targeted
  e2e were **all green** while three of those four were still broken.
- ⛔ **A COPY-PIN ASSERTION USES `.includes()`, NEVER A REGEX — the escape does not survive the trip.** A
  `\b…\b` written through a heredoc → node → file chain landed in the spec as literal **backspace bytes**,
  so the pin read `/\x08flexible\x08/` and could never match. The suite stayed **green with the defect
  restored**. `cat -A` is how you see it (`^H`), and `.includes()` is how you avoid it — there is nothing to
  escape. **8th first-cut instrument here that was wrong in a way that PASSED.**
- ⚠️ **Line endings are PER FILE, and `cat -A` does not show you.** `planSelectors.ts` / `guardianSelectors.ts`
  are **CRLF**; `paywallLead.ts` is **LF**. Writing LF text into a CRLF file yields mixed endings and a diff
  that looks like whole-file churn. **Detect first** (`s.includes('\r\n')`), match the file, and confirm with a
  bare-LF count — not with `cat -A`, which showed clean `$` on a CRLF file here.
- ⚠️ **Node and Git Bash disagree about `/tmp`.** `node /tmp/x.mjs` runs, but `readFileSync('/tmp/x.md')`
  inside it resolves to `C:\tmp\…` and dies `ENOENT`. Pass absolute Windows paths to node, or keep scratch
  files where both agree.
- **Prove a test fails before trusting it.** Revert *only the source* — `git stash` takes the
  test with it and proves nothing. ⛔ **And read WHY it went red.** A mutation here reported
  `plant-applied=YES` and turned the suite red while proving nothing: the `sed` matched the same line in
  two functions and the run died on `ReferenceError`, a compile error rather than the defect.
  **Confirming a plant applied is not the same as confirming it applied ONLY where you meant.**
  ⛔ **And grep for something UNIQUE TO THE PLANT, never for text the file may already contain.** A
  plant check for `every payday, automatically` matched the module's own doc comment — which quotes the
  phrase while explaining why it is banned — so it reported `plant-applied=YES` on a file where nothing
  had been planted. Prefer a line-numbered edit (`sed -i '65c\…'`) over a pattern.
  ⚠️ These runners are throw-based and stop at the FIRST failure, so an assertion ordered behind another
  is only ever proven by that other one — put the assertion that matters most first.
- **e2e:** `webServer` spawns its own `serve` on :4319 and can reuse a STALE one, serving an
  outdated `dist`. Force a fresh `export:web` when adding a route. ⚠️ Run the RN suite through
  its own config (`npm run test:e2e:rn`) — a bare `npx playwright test` picks up the ROOT config,
  which builds the legacy Next tree and dies on a pre-existing type error.
- ⏱ **THE REBUILD IS THE COST, NOT THE TESTS — measured 2026-08-18.** Full suite **6.0m** for 184
  tests; a targeted two-spec run **2.3m** for 17. The tests in that second run take ~25s — the other
  two minutes is `export:web --clear` running again, so splitting the suite alone still pays the tax
  every time. ⛔ And do NOT hand-run `export:web` before `test:e2e:rn`: Playwright's `webServer`
  exports again, so you pay it **twice**.
  **The pattern:** export once after a source change, leave `serve` up on :4319, then run targeted
  specs against it — `reuseExistingServer` is on locally, so those runs skip the export entirely
  (~25s). ⚠️ The guardrail is the stale-`dist` trap above, and it fails SILENTLY: specs pass against
  the previous bundle. Re-export deliberately whenever `src/**` changes.
  **Stagger by blast radius, not by clock:** app-wide changes (root layout, store, navigation, theme,
  persistence) get the full suite; a single surface gets its own specs; the full suite runs at the
  item boundary before commit. ⛔ **Do not raise `workers` to buy speed** — 4 cores, and this repo has
  already spent three CI cycles on a timing-sensitive flake.
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

## ⛔ react-native-web silently drops native APIs — and this class has bitten THREE times

`accessibilityElementsHidden` (fences nothing) · `locateFile` (six hand-written copies) · and now
**`Alert.alert`, which is literally `static alert() {}` in `react-native-web@0.21`** — an empty function.
A message written with it ships on iOS and is **discarded on web**, and no Playwright assertion can tell
that apart from a message nobody wrote. It was found only because a new e2e failed against a fix that was
correct. **11 raw call sites existed, 8 of them in `paywall.tsx`** — behind the live public embed, where
a visitor taps Buy and nothing happens.

All three are now `no-restricted-syntax` rules in `apps/rn/eslint.config.mjs`; `notify` /
`confirmDelete` / `confirmDiscard` in `@/utils/confirm` are the owners.
⚡ **The general rule: the FIRST time an RN API is used, check what react-native-web does with it —
before trusting a green suite.** The web build is what every Playwright test runs against, so anything
RNW drops is invisible to the whole gate.

## Two rules the engine keeps re-teaching

- **One rule, one owner.** "Two places, one rule" produced three separate defects in Wave A
  alone — two debt shapes in one directory, one premium ternary on two screens, one claim in
  four strings. Agreeing copies are still copies; they just have not diverged *yet*.
- **Never claim an outcome you only sometimes deliver.** Two shapes of this shipped: an
  affordance gated on a **proxy** rather than the thing it promised, and one whose **resource
  was bounded** so a `Math.min` capped it short of its own claim. Both read as honest code.
