# S1 — MONEY · GOALS · PLAN CARDS. **Pass 2.** The brief.

**Pin:** `<PIN-SHA>` · branch `v1.7-dev` · ships as `2.0.0`. **Do not push. Do not edit source.**
**Repo:** `git -C /c/Users/Jason/debt-app-v1 …` — ⚠️ **the cwd drifts between calls; always pass `-C`, and
never use a relative pathspec.** A `git log -- scripts/x.ts` run from a drifted cwd returns EMPTY and looks
exactly like *"this file has no history."* That has happened while writing three of these briefs.

**Where this sits.** The surfaces converge in order — **S0 instruments ✅ → S1 money ▶ → S2 dates → S3
import → S4 discovery → cross-surface.** Pass 1 ran on 2026-08-26 at `bc29dfe` and returned **5 blockers
and 10 majors**. All fifteen are fixed. **This is the re-verification.**

⛔ **CONVERGENCE = 0 blockers / 0 majors. NO DEFERRALS.** A major exits by being **fixed**, or by being
**measured** never to have been one. **A re-rating is not a proof.** S1 exits on **two consecutive clean
passes**; this is the first of them.

⛔ **This pass is LOAD-BEARING FOR S0 TOO.** S0 exited on *instruments-sound*, not a pass count, and there
is no fifth S0 pass. Job ① is the second and last verification S0's close-out will ever get.

---

## ⚡ The two most useful numbers in this brief

**1. The surface is 137 files. 65 have never been examined by anybody.**

```
npm run lint:s1-coverage              # 137 files · 65 unswept
npm run lint:s1-coverage -- --report
```

⚠️ Pass 1 ran against a **72-file** list that turned out to be an inclusion list wearing a directory's
clothes — `index.tsx`, 1,087 lines and where blocker B5 was wired, **was on no surface at all.** The roots
were widened to whole directories at S1.5.4 and 65 is the honest number.

⚠️ **This is not a hint that the unswept files are where the bugs are. It is a measurement of where nobody
has looked** — and it has now predicted the outcome twice. On S0, the pass that swept never-swept ground
found 5 majors while the pass sweeping swept ground found 0. On S1 pass 1, **14 of 72 files had ever been
examined, and 5 blockers plus 4 app-majors came out of the other 58.** ⛔ **The variable is not the tree.
It is where the auditor points.**

**2. 🔴 NO e2e SPEC IS ON ANY SURFACE — so this brief hands you the guard files by name.**

`grep -c "tests/e2e"` returns **0** against both `surface-coverage.s0.json` and `surface-coverage.s1.json`.
Co-located `*.test.ts` files under `src/` are on-surface; the whole of `apps/rn/tests/` is not. **Job ② is
where that gets corrected by hand.** Whether those roots should widen is an open `[DECISION]` and is **not
yours to settle** — read the files this brief names and report on them.

---

## The severity scale — use exactly these words

| severity | means |
|---|---|
| **blocker** | It ships broken. Data loss or corruption · a wrong number about the user's money · a crash or a permanently stuck screen · a statement to the user that is false about their own money or data · a once-ever moment lost forever. |
| **major** | A real user can hit it and the product is meaningfully worse: a feature that does not work, a screen that misleads, an irreversible action with no guard — **or a gate or test that cannot catch the class it exists for**, because that is how the next blocker ships. |
| **minor** | Correct behaviour, imperfect craft. **No user-visible consequence and no instrument blinded.** |

⛔ **State the user-facing consequence in one sentence for every `blocker` and `major`.** If you cannot
write that sentence, the finding is `minor`.
⛔ **A test that passes with its own defect present is `major`.**
⛔ **Do not inflate to seem thorough.** ⚡ **"No blocker or major in `<area>`" is a real and valuable
result** — say it, and say what you read. Pass 1's auditors recorded their clean sweeps by name and that
is what stops this pass re-litigating them.

---

## ⚡ Reading rules this project has paid for. Each names a specific miss.

1. ⛔ **A COMMENT IS A CARRIED PREMISE AND DECAYS LIKE A CARRIED NUMBER.** ⚡ **Pass 1's M3 was exactly
   this, and the fix range you are auditing is full of fresh ones.** `buildGuardianBrief` carried
   *"a shortfall drives `discretionary` to 0 → at-risk, so it needs no separate branch here"* — true of
   `selectDiscretionary`, false of what the caller actually passes. ⛔ **Do not cite a docblock as proof of
   behaviour, including the long ones added by these fixes.**
2. ⛔ **A TEST THAT PICKS THE ONE MEMBER OF A CLASS THAT WORKS REPORTS ON THE MEMBER, NOT THE CLASS.**
   `testBuildGuardianBrief.ts` pinned the shortfall case as `input({ shortfall: 180, discretionary: 0 })` —
   it handed the function the one input shape the false premise assumed, which is why nothing red when the
   class broke. **When you find a test, ask which member of its class it picked.**
3. ⛔ **A STATED MECHANISM IS A HYPOTHESIS, INCLUDING YOUR OWN.** In one round, **4 findings had a sound
   observation and a wrong explanation, and for 3 of the 4 the proposed fix would not have closed the
   defect.** ⛔ **When the claim is about a computed value, PRINT the value.**
4. ⛔ **ENUMERATING SPELLINGS HAS FAILED SIX TIMES HERE.** ⚡ **Pass 1's M1 was the render-side version:**
   a list built by `ORDER.map()` over a constant instead of partitioning its input, so a bill with an
   unrecognised category rendered nowhere. **Judge the condition the consumer evaluates, never the example
   the finding cited.**
5. ⚠️ **SITE COUNTS UNDER-REPORT — five consecutive items, always short** (2→7 · 9→14 · 2→5 · 663→668).
   **Count the whole result, then show it.** `grep | head` has caused this repeatedly.
6. ⛔ **A TEST WHOSE EARLIER ASSERTION REDS FIRST NEVER EXERCISES THE LATER ONES.** Say **which assertion
   carries the finding** and **whether an earlier one fires first**.
7. ⛔ **AN ABSENCE ASSERTION IS TRUE OF A PAGE THAT NEVER RENDERED.** `toHaveCount(0)` has shipped green
   over a planted bug twice here. A positive assertion must precede it.
8. ⛔ **THE OBSERVATION, THE PREMISE AND THE REMEDY FAIL INDEPENDENTLY.** Verify all three separately.
9. ⚠️ **READ THE CODE AROUND THE SITE, NOT ONLY THE SITE.** A remedy once collided with a standing decision
   three lines above it and passed every test that existed.
10. ⛔ **AN ASSERTION CAN BE SATISFIED BY SOMETHING ELSE ON THE SAME SCREEN.** ⚡ **Measured in this fix
    range, on a spec written for it:** a card was asserted to contain `$400`, and the *defective* card
    contained `$400` too — from a neighbouring section. **Ask what else on the page could satisfy it.**

---

## ⛔ THE RATCHET — do not re-report these. EXTEND them.

Pass 1's four auditor files are the ratchet, and each has a **"Swept and found clean — BY PATH"** section:

- [`../2026-08-26-s1-money/A-fixes.md`](../2026-08-26-s1-money/A-fixes.md)
- [`../2026-08-26-s1-money/B-guards-instruments.md`](../2026-08-26-s1-money/B-guards-instruments.md)
- [`../2026-08-26-s1-money/C-money-goals-store.md`](../2026-08-26-s1-money/C-money-goals-store.md)
- [`../2026-08-26-s1-money/D-plan-cards-guardian.md`](../2026-08-26-s1-money/D-plan-cards-guardian.md)
- [`../2026-08-26-s1-money/SUMMARY.md`](../2026-08-26-s1-money/SUMMARY.md) — the map, and the [D69] table

⛔ Each file also carries a **"Measured, and NOT a defect"** section. **Do not re-open those without
beating a measurement with a measurement** — not with a reading.

⚠️ **A clean verdict does not survive an edit.** Every file the fix range touched must be re-checked **at
the changed part**, even where the ratchet covers the file.

---

## The fix range you are verifying

```
git -C /c/Users/Jason/debt-app-v1 diff 78c6020..<PIN-SHA> -- apps packages scripts
```

Everything pass 1 found, in the order it was fixed. **The finding text is below; the verdict is yours.**

| # | the defect as pass 1 stated it | where the fix is |
|---|---|---|
| **B1** | *"Every balance is cleared"* shipped on Today AND Progress over debts the app could not read; the whole app had two trust guards and both were in `money.tsx` | `store/trustSelectors.ts` — one owner |
| **B2** | Today's *"Undo"* reverted the WHOLE store to a session-old snapshot; four unrelated edits destroyed and persisted | `store/store.ts` — `intentRollback` invalidated as a class in the `set` wrapper |
| **B3** | Two one-tap money moves shared ONE `cycleTopUp` record with ONE `goalId`; $70 teleported between goals, or $50 was created from nothing | `cycleTopUp` gains per-source `entries`; `amount` derived |
| **B4** | Money's `converting` flag was set once and never cleared, so the next debt added silently deleted an unrelated bill | `convertingExpenseId` moved into the sheet's own state |
| **B5** | Premium + a shortfall → *"You're caught up for this paycheck."* in success green over unpaid bills | `countOutstandingRequired` — one owner |
| **M5–M10** | the six instrument majors | `scripts/` — `run-gates.ts`, `check-finding-guards.ts`, `surface-coverage.ts`, `check-committed-secrets.ts` |
| **M1** | the grouped Expenses list and the *"where it goes"* receipt ENUMERATED `BILL_CATEGORY_ORDER` instead of partitioning, so a bill with an absent or unrecognised `category` rendered nowhere — uneditable, invisible to search — **while still being reserved from every paycheck** | `store/obligationForm.ts` `resolveBillCategory`, called from `money.tsx` ×2 and `ExpenseSheet.tsx` |
| **M2** | an over-funded goal's row printed `targetAmount` under the label `saved` — *"$1,000 saved"* over a pot holding $5,000 | `money.tsx`, the goals `ListRow` |
| **M3** | an applied top-up kept lifting `discretionary` past a shortfall, so the band left `at-risk` and the card dropped the only sentence naming the amount short | `packages/core/guardian/buildGuardianBrief.ts`; `guardianSelectors.ts` `selectAffordability` |
| **M4** | `PlanHero`'s paycheck split stopped conserving in a shortfall — *"Required $1,400 · Spoken for $300"* under a **$1,000** headline | `components/plan/PlanHero.tsx` |

### ⚠️ Three fixes were NOT in pass 1's findings — they were found by the fixes' own after-scans

⛔ **Press these hardest. They have had exactly one pair of eyes on them, and it was mine.**

| # | what it is |
|---|---|
| **AS-1** | `ExpenseSheet` seeded its category picker from `editing?.category ?? 'other'`, which catches an ABSENT category and not an UNRECOGNISED one — so saving an untouched form round-tripped the unreadable value back. **Reachable only because M1 gave the bill a row to tap.** |
| **AS-2** | a goal whose `targetAmount` could not be read rendered *"$0 left"* — the badge guard from `.11.4` suppressed the **Funded** pill and let the row fall through to the remainder branch, where `Math.max(0, 0 − currentAmount)` is `$0` |
| **AS-3** | `selectAffordability` called a $150 purchase `tight` (cushion after: $50) while the cycle was **$400 short**, because `selectSpendable` is 0 on a shortfall and `+ appliedTopUp` was the whole figure |

---

# Your assignment

**Four auditors. You are one of them — your section is named in your dispatch. Do not do the others' jobs.**
**No auditor edits a source file.** Write only your own report in this folder.

## AUDITOR A — job ①: S0's five, and pass 1's fifteen

**Job ①a — S0's fixes.** `REVERIFY4-1` … `REVERIFY4-5` in `scripts/finding-guards.json`; the reports are
`../2026-08-25-p6.8.9.7.11.17-reverification/S0-REVERIFY-4.md` and `S0-GUARDS-4.md`. Pass 1 found all five
`CLOSED`. ⚠️ **Two carried caveats that must not read as clean:** `REVERIFY4-2` is `CLOSED-UNPINNED`, and
`REVERIFY4-3`'s guard **prints, it does not red**. Confirm both are still true.

**Job ①b — pass 1's fifteen, plus AS-1/2/3.** For each, four questions:

1. **Is the original behaviour actually gone?** Read the code that produces it. **Print values.**
2. **Did the fix preserve what the site did right?** ⚡ **The worst defects in five consecutive rounds were
   over-matching fixes**, and **10 of S0's first 16 findings were introduced by the fixing.**
   ⚠️ Press hardest on: **M3's `selectAffordability`**, which now returns a blanket `0` while the cycle is
   short — *what did that seam do correctly for a shortfall before?* · **M4's `required`**, which now shows
   what the paycheck FUNDED while `PAYCHECK_SEGMENT.required`'s own docstring still defines the word as
   what is OWED · **M1's `resolveBillCategory`**, which silently reclassifies an unrecognised value.
3. **Would anything catch it un-fixing?** Name the test **and say whether it would fail on the ORIGINAL
   defect**, not merely that it exists.
4. **What did the fix's own comment claim, and is that claim true?** ⛔ These fixes added long docblocks
   asserting measured results. **Re-measure at least three of them.**

**Verdicts:** `CLOSED` · `CLOSED-UNPINNED` · `PARTIAL` · `OPEN` · `WRONG-REMEDY` · `NOT-A-DEFECT` ·
`ALREADY-CLOSED-ELSEWHERE`. Each `PARTIAL`/`OPEN`/`WRONG-REMEDY` carries a severity.

## AUDITOR B — job ②: the guards, and the gate that cannot see them

`scripts/finding-guards.json` holds **73 findings · 57 guarded · 16 unguarded**. `npm run
lint:finding-guards` checks each guard's **token** is present on a non-comment line. ⛔ **That is a presence
check, not a proof.** Your job is the half the gate cannot do:

> For each guarded entry: open the file, find the assertion, and say **whether it would still red on the
> ORIGINAL defect.**

⛔ **"The token is there" is not an answer.** ⛔ **"A test file exists" is not a guard.**
⚠️ The 16 `unguarded` entries are a known backlog, **not your finding** — confirm the count and move on.

⛔ **THESE FILES ARE ON NO SURFACE. Nobody has ever audited them.** The thirteen newest:

```
apps/rn/tests/e2e/bill-category-partition.spec.ts     (M1, AS-1)
apps/rn/tests/e2e/goal-row-saved.spec.ts              (M2, AS-2)
apps/rn/tests/e2e/guardian-shortfall-topup.spec.ts    (M3 render gate)
apps/rn/tests/e2e/plan-hero-conserves.spec.ts         (M4)
apps/rn/src/store/guardianSelectors.test.ts           (M3, AS-3)
packages/core/guardian/testBuildGuardianBrief.ts      (M3, core)
apps/rn/tests/e2e/no-bills-branch.spec.ts             (B5 ×4)
apps/rn/tests/e2e/intent-undo.spec.ts                 (B2)
apps/rn/tests/e2e/misfiled-expense.spec.ts            (B4 ×3)
apps/rn/src/store/storeActions.test.ts                (B2, B3, B4)
apps/rn/src/store/trustSelectors.test.ts              (B1)
apps/rn/tests/e2e/progress-hero-journey.spec.ts       (B1)
apps/rn/tests/e2e/recovery.spec.ts                    (B5's rescoped proxy)
```

⚡ **One vacuous assertion is already known to have been written in this range and caught by a plant, not
by a gate**: a card asserted to contain `$400` while the *defective* card contained `$400` from a
neighbouring section. **Assume there are others. Rule 10 is your job.**

## AUDITOR C — job ③: `money.tsx`, goals, the store, and the 65 unswept

Pass 1's auditor C found 4 of the 5 blockers here. **Three of the churn-five were in `money.tsx`, a file
two rounds had already swept.**

⛔ **Point at the unswept 65 first** — `npm run lint:s1-coverage -- --report`. Then the changed parts of
the swept files. ⚠️ **`partial` counts as UNSWEPT.**

## AUDITOR D — job ④: the plan cards, the Guardian engine, and `index.tsx`

Pass 1's auditor D found B5 and two app-majors here. ⛔ **`(tabs)/index.tsx` — 1,087 lines, importing 19
plan modules — was on NO surface during pass 1** and is where B5 was wired. **It is the single largest
unread file on this surface.**

⚠️ **The Guardian's band now has a branch that did not exist during pass 1** (`shortfall > 0 → at-risk`).
`computeState` is the ONE state machine and three producers derive from it — `buildGuardianBrief`,
`selectPlanSummary`, `buildMultiCycleTimeline`. **Check that they still agree**, and check the FORECAST in
particular: it was checked at fix time and found not to share the seam, **which is a claim you should
verify rather than inherit.**

---

## What to write

One file in this folder, named in your dispatch. Structure:

1. **Result** — counts by severity, in one table, and the one sentence you would say to 🎯.
2. **Sweep — blocker + major.** Each finding: user-facing consequence · mechanism with file:line ·
   **measured** evidence (print the values) · confidence · **would anything catch it?**
3. **Measured, and NOT a defect** — so the next pass does not re-open it.
4. **Could not determine** — with what would settle it.
5. **Swept and found clean — BY PATH.** ⛔ **Every path you opened.** This becomes the next pass's ratchet,
   and a file you read but did not list is a file that gets re-read instead of extended.
