# P6.8.9.7.10 — mechanisms measured, not relayed

⚠️ **A verifier's observation is evidence; its explanation is a hypothesis.** This file records which
stated mechanisms were checked against the code, and what the check found. Appended as each cluster lands.

---

## C-2 — graded `WEAK-TEST`; measured, the FIX itself does not close B1's stated harm

**Verifier's claim.** `readMoney` repairs `'Infinity'` to `0`, both engine readers treat `0` as *no cap*,
so the repaired store allocates identically to the corrupt one — and the assertion was written to accept `0`.

**Measured: CONFIRMED, every link.**

| link | site | result |
|---|---|---|
| `'Infinity'` → `0` | `apps/rn/src/data/migrations.ts:47-52` | `Number('Infinity')` is `Infinity`; `Number.isFinite` is **false**, so the string branch does not return and it falls to `{ value: 0, repaired: true }` |
| `0` = no cap, allocation | `packages/core/engine/allocatePaycheck.ts:632` | `priorityPerPaycheck != null && > 0 ? pace : Infinity` — `0` takes the `Infinity` arm |
| `0` = no cap, recommendation | `packages/core/engine/recommendedActions.ts:80-83` | same `> 0` guard; falls through to `return remaining`, i.e. **the whole goal** |
| the assert accepts it | `apps/rn/src/store/persistenceLifecycle.test.ts:388-390` | `priorityPerPaycheck === 0 \|\| Number.isFinite(...)` — **`0` is admitted by name** |
| the sibling assert cannot fail | `apps/rn/src/store/persistenceLifecycle.test.ts:392-394` | guards `!== undefined`; `readMoney` returns `{ value: 0 }` on every unrecoverable input and **can never produce `undefined`** |

⛔ **Upgrade the verdict.** This is not only a weak test. The block's own comment (`:376-379`) states the
harm as *"a corrupt pace REMOVES the cap the user signed off on and funds the goal ahead of debt at full
speed"* — and `0` produces **exactly that**, in both readers. The repair moves the value and leaves the
behaviour. **A user who chose "$200 a paycheck toward this goal" has their whole remainder swept into the
goal instead of their debt, with every test green.**

⭐ **The shape:** the test was written against the *value* the finding named rather than the *behaviour* the
comment named, so it agrees with the fix for the wrong reason — and the fix inherited the same substitution.

---

## E-1 — the reveal scroll cannot use the measured height. **CONFIRMED, and the docblock asserts the opposite**

**Verifier's claim.** `calloutH` is `0` on the first run of the reveal effect, so `need` takes
`ESTIMATED_CALLOUT_H`; the one-shot latch then blocks the corrected re-run.

**Measured: CONFIRMED, and it is structural, not a timing accident.**

| link | site | result |
|---|---|---|
| `calloutH` starts at 0 | `CoachMarkLayer.tsx:49` | `useState(0)` |
| written from one place only | `CoachMarkLayer.tsx:273` | the card's `onLayout` |
| the card cannot lay out before `rect` | `CoachMarkLayer.tsx:180` | `if (!active || !rect) return null` — no render, no layout, no height |
| the reveal effect runs on that same commit | `CoachMarkLayer.tsx:152-153` | gated on `!active || !rect`, so it fires the instant `rect` lands — **the commit in which the card first renders**. `onLayout` state cannot exist yet |
| the fallback is taken | `CoachMarkLayer.tsx:164` | `(calloutH \|\| ESTIMATED_CALLOUT_H)` → **144**, a guess |
| the correction is latched out | `CoachMarkLayer.tsx:165` vs `:154`, dep at `:176` | the latch is written **before** `requestReveal`; the `calloutH` dep re-runs the effect and `:154` returns immediately |

⚡ **What makes this one worth the whole step:** the file has **two** consumers of `calloutH`, and they do
not behave alike. **Placement** (`:199-200`) *does* get the measured height, because placement is computed
in the render body and re-renders when the state lands. **The reveal** (`:164`) structurally cannot, because
it is a latched effect that fires one commit early. The docblock at `:156-163` — *"⛔ THE MEASURED HEIGHT,
NOT THE 140"* — is **true of the line 35 lines below it and false of the line it sits on.**

⛔ **This is the same class the item exists to close, for the third time**: `132`, then `140`, and now a
measurement that is read but never reached. RNW pins `fontScale` to 1, so no web spec can see it.

## E-3 — `cancelled` is dead. **CONFIRMED**

`CoachMarkLayer.tsx:101` declares `let cancelled = false`, read at `:103` and `:107`, and **assigned
nowhere**. The effect returns `targets.subscribe(...)`'s own unsubscribe (`:102`), so cleanup stops future
notifications but never trips the flag — and an in-flight `targets.measure()` from the previous mark still
calls the shared `setRect` (`:107`). The effect immediately above it does this correctly (`:79-81`), which
is how the shape reads as done.

---

## ⭐ CONVERGENCE — two blind verifiers, two directions, ONE defect

**B and C never saw each other's files or verdicts.** C reached `priorityPerPaycheck → 0` from the
persistence test; **B reached the identical defect from the user-facing repairs card.** Two independent
routes to the same line is the strongest result in this pass, and it is the one thing here that touches a
user's money.

## B-1 — the repairs card is false AND unfollowable for a goal pace. **CONFIRMED, with one citation corrected**

The card reads *"They are showing as $0, so your plan is leaving them out. Open each one and enter the real
amount."* (`DataRepairsCard.tsx:65-67`). **Both halves are false of a repaired goal pace:**

- **"your plan is leaving it out"** — the exact opposite. `0` takes the `Infinity` arm at
  `allocatePaycheck.ts:632`, so the goal funds **uncapped and ahead of debt**. The card tells the user the
  benign version of the harm.
- **"Open it and enter the real amount"** — ⛔ **there is no such field.** `priorityPerPaycheck` appears in
  exactly **one** `.tsx` in the app: `SaveForItSheet.tsx:109`, written at **creation**. That sheet is
  reachable only from `AffordabilityCard.tsx:245` as the *"can I afford this?"* flow, taking `amount` and
  `name` as props — it is not an editor for an existing goal.

⚠️ **The verifier cited `apps/rn/src/components/plan/GoalSheet.tsx:49,73-80`, which does not exist —
but the file does, at `apps/rn/src/components/entities/GoalSheet.tsx`, and the substance is correct.**
Checked at `.11.3`: that sheet edits `name`, `targetAmount`, `currentAmount` and `type`, and never touches
`priority` or `priorityPerPaycheck` (`GoalSheet.tsx:50`). ⛔ **Correction to this file's first version,
which said only "that file does not exist"** — that was true of the path and misleading about the finding.
The lesson is narrower than "invented": **a wrong `path:line` does not make an observation wrong, and
checking the claim rather than the citation is what tells you which you have.**

## B-2 — an APR cell of `"%"` now imports as 0%. **CONFIRMED**

| link | site | result |
|---|---|---|
| `%` stripped before parsing | `debtCsv.ts:253` | `rawApr.replace(/%/g, "")` — `"%"` becomes `""` |
| blank means zero | `amountField.ts:55` | `if (cleaned === '') return 0` — **not** `null` |
| so the refusal is gone | `debtCsv.ts:254` | `apr === null` is false; `0 > 100` is false. The row imports at **0% APR** |

Before the change `normalize` did not strip `%`, so `Number('%')` was `NaN` → `null` → **refused with an
error**. ⛔ **The fix converted a refusal into a silent zero** — the outcome `debtCsv.ts:28-30` and `:237-239`
each forbid in their own words. Same mechanism admits `"1%2"` as **12%**. The `19.99%` half of the fix is
correct and pinned; this is its blast radius.

---

## A-1 — `/history` — **CONFIRMED, and the code writes the false guarantee down**

The merge is `{ ...s.seedOver, ...STATES[stateName] }` (`p6.8-matrix.shot.ts:452`). `STATES.empty`
(`:73`) is `{ debts: [], requiredExpenses: [], goals: [], livingExpenses: [] }` — **it has no
`cycleHistory` key**, so it cannot override the five snapshots `seedOver` supplies (`:154-162`).
`history.tsx:54` branches on `rows.length === 0`, so `state-history-empty` renders the **populated**
screen and `<EmptyHistory>` (`history.tsx:59`) appears in **no frame in the matrix**.

⛔ **The comment 15 lines above the merge asserts the opposite**: *"`states: ['empty']` still pins the
empty branch explicitly, so nothing…"* (`:167-168`). The author wrote the guarantee down; the spread order
does not provide it.

⚡ **The defect inverted rather than closed.** Before: twelve frames of the empty design and none of the
populated one. After: twelve of the populated and none of the empty. **Coverage of the two branches is
1 of 2 either way.** `/living-expenses` escapes only because `STATES.empty` happens to name
`livingExpenses: []` — an accident of that one key, not a mechanism.

## A-3 — the Swift latch — **CONFIRMED as a defect, but LATENT. The verifier overstated it twice**

| claim | measured |
|---|---|
| the `else if` skips the close-test on a single-line declaration | ✅ **true** (`check-apostrophes.ts:218-219`) |
| *"sets `inPhrases = true` **forever**"* | ❌ **overstated** — it persists only until the next line containing `]`, which in Swift is often near. It is unbounded only where no `]` follows |
| the exempt test runs on the raw line, before comments are stripped | ✅ **true** — `:218` tests `line`, `:222` strips to `code`. A `///` comment writing `phrases: [` opens the latch |
| it is disabling a scan today | ❌ **no** — all four real sites (`SiriQueryIntents.swift:105,115,125,137`) are **multi-line**, where the latch works as designed, and no doc comment in the roots matches `/phrases:\s*\[/` |

⚠️ **So it is a trap, not a live hole**: it fires the day someone writes a short `phrases: ["…"]` on one
line — the natural way to write a short one — and the gate goes green while skipping the rest of the file.
Worth closing, **not** worth treating as "the Swift half is unscanned today."

⛔ Separately confirmed and real: `swiftHits` exits at `:230-237`, **before** the TS baseline check at
`:246`, so a Swift failure reports without ever running the class the gate originally existed for.

---

## ⭐ SECOND CONVERGENCE — E and F, blind to each other, on ONE seam

**E-2** found the stood-down root layer still calling `requestReveal`; **F-1** found the backgrounded
Progress screen still answering as the registered host. Different files, different verifiers, **the same
seam**: one global scroller slot (`tutorialTargets.tsx:175`) plus tabs that never unmount. Either one alone
reads as a detail; together they are the reveal machinery's actual defect.

## F-1 — the scroll host deregisters on unmount, and tabs never unmount. **CONFIRMED**

`progress.tsx:129-139` registers the host in an effect whose cleanup is `registerScrollHost(null)`, and its
own comment states the intent: *"⚠️ Deregister on unmount, or a backgrounded Progress keeps answering for
whatever screen is up."* **That cleanup never runs.**

⛔ **The repo had already written this down, three directories away.** `use-coach-mark.ts:42-45`:
*"That one was a suppressor held by a MOUNTED tab, and it was fixed by gating on focus — **because Today
never unmounts.** The offer was left on mount semantics, so the identical confusion (mount ≠ visible)
survived."* The corrected pattern is in that same file at `:1` / `:31` — `useIsFocused()`.

⚡ **So this is the mount≠visible confusion for the third recorded time, and the fix for it was sitting in
the file that describes it.** [[the-codebase-already-said-it]]

## D-1 — the Skia rejection reaches nobody in a production web build. **CONFIRMED**

`skia-ready.web.ts:52-58` claims the failure is *"REPORTED rather than swallowed."* On web it is swallowed:

| link | site | result |
|---|---|---|
| default sink is dev-only | `reportError.ts:16-19` | `if (dev) console.warn(...)` — **nothing when `__DEV__` is false** |
| web never registers a real one | `sentry.web.ts:7-9` | `initErrorReporting` is a **no-op**, and its own docstring says it *"keeps the default `reportError` console sink"* |
| `.web.ts` is the only build this file runs in | Metro platform resolution | so the production path is always the dev-only sink |

⚠️ **Scope it honestly: the *behaviour* is right and only the *claim* is wrong.** Failing closed is correct;
what does not happen is the reporting. It bites exactly where `canvaskit.ts:15-20` documents a real wasm
404 — the marketing embed. **Observability, not a user-facing defect** — unlike the goal-pace finding.
