# L0 — the scripted lens (deterministic findings)

Run by the orchestrator with grep/scripts rather than by a lens agent. Every item here is
**machine-decidable**, which means each one can become a permanent lint rule instead of a finding
that has to be re-discovered ([D31]: a finding that becomes a test is paid for once).

⚠️ Three of the plan's own carried-in figures were **wrong**, in the direction of under-reporting.

---

### L0-1 · 25 of 39 e2e specs seed a plan with NO bills
- **Severity:** major
- **Class:** coverage-narrowing
- **Where:** `apps/rn/tests/e2e/` — `affordability` `analytics-optout` `blur-glass` `bnpl` `celebration`
  `coach-marks` `cushion-forecast` `demo-containment` `earlyjourney` `greeting` `ipad-layouts`
  `on-plan-streak` `payoff-schedule` `paywall` `premium-entry` `probe-mark-ipad-rail`
  `probe-mark-route-push` `proofofwork` `scan` `sheet-polish` `sheet-remove` `swipe-delete`
  `trajectory-interactivity` `tutorial-invite` `windfall`
- **What:** they call `scenario()` without `requiredExpenses`, so every derived surface that depends on a
  recurring load (the Money hero, the allocation bar, "Spoken for", the required rows, the reserve) runs
  its EMPTY branch. The suite exercises the shape a real user never has.
- **Why it matters:** measured, not theorised. `route-smoke.spec.ts` — which exists verbatim for *"a blank
  route passes silently"* — passed **10/10** while Today rendered blank for every user with a bill,
  because its fixture hit exactly this. The defect class this fixture cannot reach is the one the guard
  was written for.
- **Confidence:** high (measured, then re-planted to confirm the fixed fixture reds)
- **Suggested fix:** make the shared `scenario()` helper seed a populated plan by default and require an
  explicit opt-out for the empty case; then `lint:coverage` asserts no spec silently audits an empty app.

### L0-2 · The date bug is ~2× larger than the plan records, and it is in the ROLLOVER
- **Severity:** major
- **Class:** correctness
- **Where:** **9 production sites**, not the "~5" the plan carries —
  core: `payCycle/getNextPaycheckDate.ts:16` · `recurrence/rolloverPayCycle.ts:8`
  rn: `components/money/BnplCalendarSection.tsx:17` · `components/onboarding/FirstDebtOrBillStep.tsx:22` ·
  `components/plan/SaveForItSheet.tsx:27` · `hooks/use-payday-capture.ts:17` ·
  `notifications/notifications.ts:124` · `store/demoRun.ts:60` · `store/guardianSelectors.ts:493`
  (plus 3 test helpers, lower priority)
- **What:** `toISOString().slice(0,10)` converts a LOCAL calendar date through UTC. East of UTC, local
  midnight is the previous day, so the returned date is off by one. The app stores calendar dates, not
  instants — this is a category error, not a rounding detail.
- **Why it matters:** ⚠️ **`rolloverPayCycle` is new information and it is the worst of the nine** — the
  rollover advances every bill and debt due date, so an off-by-one there shifts the whole plan every
  cycle, compounding. `getNextPaycheckDate` sets the cycle boundary itself. `use-payday-capture` and
  `notifications` decide *when* things fire.
- **Confidence:** high (the identical bug was found and fixed twice already — `todayLocalISO`, and
  `allocatePaycheck:236` during 3.8, where it silently reordered which bill a reserve paid)
- **Suggested fix:** one shared `localISODate()` in core; ban the pattern with a lint rule. The fix is
  mechanical; the risk is entirely in leaving it partly done, which is what has happened twice.

### L0-3 · `EXAMPLE_MONEY` — the bypass is real, but it is 2 sites and they are the load-bearing pair
- **Severity:** major
- **Class:** drift ("two places, one rule")
- **Where:** constant at `components/plan/ExampleCanvasMarker.tsx:14`. Bypassed by
  `components/plan/TutorialOverlay.tsx:427` (hardcodes the literal **twice** in one expression) and
  `store/tutorialPath.ts:242` (hardcodes it in the SPOKEN announcement).
- **What:** the plan says "THREE sites bypass it"; there are **two** in production. But they are the
  visible text and the spoken text — the exact pair `tutorialPath.ts:234`'s own comment says must stay in
  the same slot, and which [D6] requires to be said in exactly ONE place.
- **Why it matters:** an e2e test already asserts *"Example money is said exactly once"*. That test guards
  the *count*, not the *wording* — so a change to the constant silently desynchronises the seen and heard
  disclosure while the test stays green. A disclosure that the screen and VoiceOver disagree about is a
  compliance-shaped defect, not a polish one.
- **Confidence:** high (grepped, and the comment documents the intent it does not enforce)
- **Suggested fix:** import the constant at both sites; `lint:copy` bans the literal outside its owner.

### L0-4 · Two dead components confirmed at ZERO references
- **Severity:** minor
- **Class:** dead code (Wave C · C7)
- **Where:** `ProgressRing` — **0 refs**. `MilestonesRow` — **0 refs**.
- **What:** the plan lists these as suspected dead; they are confirmed unreferenced anywhere in
  `apps/rn/src` or `packages/core`.
- **Why it matters:** dead UI is ballast that every later sweep re-reads and every reader mistakes for
  live surface area. Cheap to remove, and it shrinks the audit surface permanently.
- **Confidence:** high
- **Suggested fix:** delete both. ⚠️ `guardianIntroSeen` (4 refs) and `FormSheet.headerAction` (2 refs)
  are NOT zero — they need a read before being called orphaned, so do not batch them with these two.

### L0-5 · The a11y guards cover 2 of 4 native-only props — and the gap is 11 files wide
- **Severity:** major
- **Class:** accessibility
- **Where:** guards ban `accessibilityElementsHidden` and `importantForAccessibility`. They do NOT ban
  `accessibilityState` (**11 files**) or `accessibilityValue` (**2 files**).
- **What:** react-native-web drops all four identically, so the two unguarded props are silently inert on
  the web build — which is the build the entire e2e suite and the public marketing embed run on.
- **Why it matters:** every a11y assertion in the web suite is blind to state and value. A control can
  report no checked state to a screen reader and the suite passes. The plan already records
  `CheckCircle` reporting no checked state on web — that is this bug, and it has 10 more homes.
- **Confidence:** high (counts match the plan's own figure exactly, which is a good sign for the estimate)
- **Suggested fix:** extend both the eslint rule and `check-native-a11y-props.ts` to all four props; the
  11 `accessibilityState` sites then need converting. **This is a real chunk of work, not a lint tweak.**

---

## Summary
**5 findings — 4 major, 1 minor.** All machine-decidable, so all 5 can become permanent gates.

⚠️ **Three of the plan's carried-in figures were wrong, all under-reporting:** the date bug is 9
production sites not ~5 (and includes the rollover), `EXAMPLE_MONEY` is 2 bypassers not 3 (but they are
the seen/heard pair), and the fixture-narrowing class is 25 of 39 specs — a scale nobody had measured.

⭐ **The one to look at first is L0-1.** The others are defects; L0-1 is a defect in the *instrument*, and
it decides how many of the rest any future gate can see.
