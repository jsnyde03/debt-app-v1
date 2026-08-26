# S1 — MONEY · GOALS · PLAN CARDS. The brief.

**Pin:** `bc29dfe` · branch `v1.7-dev` · ships as `2.0.0`. **Do not push. Do not edit source.**
**Repo:** `git -C /c/Users/Jason/debt-app-v1 …` — ⚠️ **the cwd drifts between calls; always pass `-C`,
and never use a relative pathspec.** A `git log -- scripts/x.ts` run from a drifted cwd returns EMPTY and
looks exactly like *"this file has no history."* That has happened while writing two of these briefs.

**What S1 is.** The surfaces are being converged in order — **S0 instruments → S1 money → S2 dates →
S3 import → S4 discovery → cross-surface**. S0 converged on 2026-08-25. **S1 is the money surface, and
this is its first pass.**

⛔ **CONVERGENCE = 0 blockers / 0 majors. NO DEFERRALS.** A major exits by being **fixed**, or by being
**measured** never to have been one. **A re-rating is not a proof.**

⛔ **This pass is LOAD-BEARING FOR S0 as well as for S1.** S0 exited on *instruments-sound*, not on a pass
count, and there is no fifth S0 pass — so **jobs ① and ② below are the only verification S0's close-out
will ever get.**

---

## ⚡ The single most useful number in this brief

**The S1 surface is 72 files. 58 of them have never been examined by anybody.**

Two prior rounds audited "money" — `.11.10` and `.11.17` — and between them they opened **14 files**.
The inventory is generated, not asserted:

```
npm run lint:s1-coverage            # 72 files · 58 unswept
npm run lint:s1-coverage -- --report
```
→ [`S1-SURFACE-INVENTORY.md`](S1-SURFACE-INVENTORY.md) in this folder.

⚠️ **This is not a hint that the unswept files are where the bugs are. It is a measurement of where nobody
has looked**, and the last time it was taken — on S0, at pass 4 — the pass that swept never-swept ground
found **5 majors** while the pass sweeping already-swept ground found **0**. ⛔ **The variable was not the
tree. It was where the auditor pointed.**

⚠️ **`partial` counts as UNSWEPT and there are ten of them.** `.11.17`'s auditor read nine plan cards **as
a diff** — *"token-only changes, no behaviour"* — and `store.ts` only at its *"goal / paycheck / repairs
seams."* ⚡ *"Swept clean" is a claim about a SUBJECT; coverage is a property of a FILE.*

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
⛔ **Do not inflate to seem thorough.** Two blockers and nothing else beats twenty findings that need
triage. **"No blocker or major in `<area>`" is a real and valuable result** — say it, and say what you read.

---

## ⚡ Reading rules this project has paid for. Each names a specific miss.

1. ⛔ **A COMMENT IS A CARRIED PREMISE AND DECAYS LIKE A CARRIED NUMBER.** Measured **three times**, most
   recently last night: `readBackup.test.ts`'s fixture said it was *"field-for-field from `origin/v1.6-dev`'s
   `buildBackupData()`"* and used a goal key **v1.6 never wrote**. ⛔ **Do not cite a docblock as proof of
   behaviour.** ⚠️ `origin/v1.6-dev` is a real branch in this repo — `git show origin/v1.6-dev:app/page.tsx`
   — so claims about v1.6 are checkable rather than arguable.
2. ⛔ **A TEST THAT PICKS THE ONE MEMBER OF A CLASS THAT WORKS REPORTS ON THE MEMBER, NOT THE CLASS.**
   Measured twice **on this surface**, hours ago: every unreadable-money fixture in the tree seeded
   `balance: null`, and with the blocker planted back **10 of 11 `data-recovery` tests stayed green.** The
   repo's only two-emergency-goal fixture asserts the *controls* and never the *labels*, and three screens
   disagreed for a release. **When you find a test, ask which member of its class it picked.**
3. ⛔ **A STATED MECHANISM IS A HYPOTHESIS, INCLUDING YOUR OWN.** In one round, **4 findings had a sound
   observation and a wrong explanation, and in 3 of the 4 building the proposed fix would not have closed
   the defect.** ⛔ **When the claim is about a computed value, PRINT the value.**
4. ⛔ **ENUMERATING SPELLINGS HAS FAILED SIX TIMES HERE** — month arithmetic (5), `importStore` call shapes
   (4), `announceForAccessibility?.()`, uncapped pace values (2), markdown code (4), the scanner's own
   constructs. **Judge the condition the consumer evaluates, never the example the finding cited.**
5. ⚠️ **SITE COUNTS UNDER-REPORT — five consecutive items, always short** (2→7 · 9→14 · 2→5 · 663→668).
   **Count the whole result, then show it.** `grep | head` has caused this repeatedly.
6. ⛔ **A TEST WHOSE EARLIER ASSERTION REDS FIRST NEVER EXERCISES THE LATER ONES.** When a test carries
   several assertions, say **which one carries the finding** and **whether an earlier one fires first**.
7. ⛔ **AN ABSENCE ASSERTION IS TRUE OF A PAGE THAT NEVER RENDERED.** `toHaveCount(0)` has shipped green
   over a planted bug twice in this repo. A positive assertion must precede it.
8. ⛔ **THE OBSERVATION, THE PREMISE AND THE REMEDY FAIL INDEPENDENTLY.** Verify all three separately.
9. ⚠️ **READ THE CODE AROUND THE SITE, NOT ONLY THE SITE.** A remedy once collided with a standing decision
   sitting three lines above it and passed every test that existed.

---

## ⛔ THE RATCHET — do not re-report these. EXTEND them.

**Two prior rounds' reports are the ratchet, and both are on disk:**

- [`../2026-08-25-p6.8.9.7.11.17-reverification/A-money-goals-plan.md`](../2026-08-25-p6.8.9.7.11.17-reverification/A-money-goals-plan.md)
  — its **"Swept and found clean"** section is long and specific. Read it.
- [`../2026-08-25-p6.8.9.7.11.10-severity/A-money.md`](../2026-08-25-p6.8.9.7.11.10-severity/A-money.md)
  — the earlier round.

Headline entries already swept and measured clean, at the blocker/major bar:

> `allocatePaycheck.ts`'s five goal rungs across the whole boundary set — **measured**: zero/negative
> income, a `0` target, a target exceeded, a negative target, a negative `currentAmount`, no debts, all
> debts cleared, an entirely-reserved paycheck, an over-reserved paycheck, a pace above the target, a
> negative pace, the same goal object twice, two goals sharing an `id` · `emergencyFund.ts` both exports ·
> `journeySelectors.ts` + its ten-case matrix · `guardianSelectors`' `selectTightTopUp`,
> `selectAffordability`'s `coverFromSavings`, `pickTopUpGoal`, `selectSaveForItOptions` ·
> `GoalSheet`'s pace route · `dataRepairsCopy` + its test · `DataRepairsCard`'s three-way icon ·
> `models.ts`'s `kind` / `acknowledged` backfill · `SaveForItSheet`'s `priorityPerPaycheck` writer.

⛔ **Also do not re-open `A-money-goals-plan.md`'s "Could not determine" list** without beating its
measurement with a measurement — not with a reading.

⚠️ **A clean verdict does not survive an edit.** The files S1.1 changed (job ⓪ below) must be re-checked
**at the changed part**, even where the ratchet covers the file.

---

## The fix range you are verifying

`74f2064..bc29dfe` — **two commits**, `87655e9` (S1.1's fixes) and `bc29dfe` (the coverage instrument).

```
git -C /c/Users/Jason/debt-app-v1 diff 74f2064..bc29dfe -- apps packages scripts
```

⚠️ **`scripts/s0-surface-coverage.ts` was RENAMED to `scripts/surface-coverage.ts`** in the second commit.
`git diff` renders it as a delete plus an add; use `git log --follow` if you need its history.

---

# Your assignment

**Four auditors. You are one of them — your section is named in your dispatch. Do not do the others' jobs.**

## AUDITOR A — jobs ⓪ and ①: the two fix sets

### Job ⓪ — S1.1's five fixes, re-verified

All five landed in `87655e9`. **The finding text is below; the verdict is yours.**

| # | the original defect | where the fix is |
|---|---|---|
| **⓪-1** | `Number('')` is `0`, not `NaN`, so `''`, `'   '`, `','` and `', ,'` were classified `recovered` by `readMoney`. `money.tsx`'s celebration guard had been narrowed to `r.kind !== 'recovered'`, so a restore of a backup whose balances were blank rendered **"Every balance cleared"** over debts still owed, permanently | `apps/rn/src/data/migrations.ts`, `readMoney` |
| **⓪-2** | *(M17a)* `readMoney`'s docblock asserted *"the string parses or it does not"* — the premise the guard-narrowing was justified by, and false for `''` | same file, the docblock above `readMoney` |
| **⓪-3** | `repairMoneyFields` skipped **every** `undefined`. Correct for three schema-optional money fields, wrong for six required ones: a debt row with no `balance` key reached the store as `undefined`, **no repair recorded**, in neither the active nor the paid-off list, every total `NaN` | same file, `repairMoneyFields` + its four call sites |
| **⓪-4** | *(M9)* a second `emergency`-typed goal was called three different things on three screens. `money.tsx` said Savings, `GoalSheet` said Emergency fund, the Guardian said *"your emergency fund"* | `guardianSelectors.ts` `isEmergencyFund`; `GoalSheet.tsx`; `Select.tsx` gained a `readOnly` mode |
| **⓪-5** | `lint:secrets` fired 4 times on the audit report that documents its own plant, so `lint:rn` was **red on every committed tree** from `74f2064` | `scripts/check-committed-secrets.ts` + `scripts/secrets-exemptions.json` |

For each, four questions:

1. **Is the original behaviour actually gone?** Read the code that produces it. **Print values.**
2. **Did the fix preserve what the site did right?** ⚡ **The worst defects in four consecutive rounds were
   over-matching fixes.** Ask what the change now does to inputs the finding never mentioned.
   ⚠️ **⓪-3 is the one to press hardest**: it changed a function four call sites share, and it makes the app
   *report* things it previously stayed silent about. **Who now sees a repairs card that did not before?**
   ⚠️ **⓪-4 changed a control's availability.** `type` is deliberately never rewritten — **find out what that
   leaves inconsistent.**
3. **Would anything catch it un-fixing?** Name the test **and say whether it would fail on the ORIGINAL
   defect**, not merely that it exists. ⚠️ Four fixtures were corrected in this range because they carried a
   goal shape v1.6 never wrote — **check that the corrections are right**, not just that they changed.
4. ⛔ **⓪-5 has an exemption ledger, which is a standing permission to carry a credential-shaped string in a
   public repo.** Read `secrets-exemptions.json` and answer: **can it be widened to hide a real secret?**
   Verify the two exempted values are what their `why` says by opening the lines they name.

### Job ① — S0's five fixes, and this is S0's only verification

Registered in `scripts/finding-guards.json` as `REVERIFY4-1` … `REVERIFY4-5`; each entry names its file and
the token that is supposed to guard it. The reports are
[`../2026-08-25-p6.8.9.7.11.17-reverification/S0-REVERIFY-4.md`](../2026-08-25-p6.8.9.7.11.17-reverification/S0-REVERIFY-4.md)
(the findings) and `S0-GUARDS-4.md` (the guard inventory) beside it.

**Same four questions.** ⛔ **There is no fifth S0 pass. If a fix has quietly come undone, this is where it
is found or it is not found at all.**

**Verdicts:** `CLOSED` · `CLOSED-UNPINNED` · `PARTIAL` · `OPEN` · `WRONG-REMEDY` · `NOT-A-DEFECT` ·
`ALREADY-CLOSED-ELSEWHERE`. Each `PARTIAL`/`OPEN`/`WRONG-REMEDY` carries a severity.

---

## AUDITOR B — jobs ② and ③: the guards, and the instruments nobody has audited

### Job ② — does every registered guard still exist, and does it still FAIL?

`scripts/finding-guards.json` holds **34 findings · 18 guarded · 16 unguarded**. `npm run
lint:finding-guards` checks that each guard's **token** is still present in its file. ⛔ **That is a
presence check, not a proof.** Your job is the half the gate cannot do:

> For each of the 18 guarded entries: open the file, find the assertion, and say **whether it would still
> red on the ORIGINAL defect.**

⛔ **"The token is there" is not an answer.** ⛔ **"A test file exists" is not a guard.** ⚠️ Where you can
cheaply *demonstrate* it — a unit assertion you can reason to a definite value — do, and print it.
⚠️ **The 16 `unguarded` entries are a known backlog, not your finding.** Confirm the count and move on.

### Job ③ — sweep the four instruments S0's convergence now rests on

⛔ **These were built during S0's close-out and NO PASS HAS EVER READ THEM.** ⚡ One failed open on its own
core case while being written — `check-finding-guards.ts` used `text.includes(token)`, so renaming
`MIN_SCENARIOS` → `MIN_SCENARIOS_RENAMED` removed the guard **and the gate passed.**

| file | gate | why it is worth your time |
|---|---|---|
| `scripts/check-finding-guards.ts` | `lint:finding-guards` | the registry job ② depends on. Already failed open once |
| `scripts/test-gate-plants.ts` | `test:gate-plants` | **the only thing in the tree asserting any gate fails CLOSED.** If it can pass while a gate is blind, S0's central claim is unbacked |
| `scripts/surface-coverage.ts` | `lint:s0-coverage`, `lint:s1-coverage` | **[D69]'s lookup.** ⚠️ **Rewritten in this very range** to serve every surface — read it as new code, not as a re-check |
| `scripts/begin-gate-run.ts` | `gate:begin` | captures the tree at the START of `validate:release:rn` so a mid-run edit cannot be recorded as tested |

Ask of each:
- **What is the worst thing this instrument could let through while reporting green?**
- What input, encoding, ordering, path shape or platform has nobody tried? *(CRLF, a symlink, no trailing
  newline, a path with a space, an empty corpus, zero matches, a renamed file, a NUL byte.)*
  ⚠️ **A NUL byte in a source file made `git diff` call it binary and `grep` refuse it — in this range.**
- ⛔ **Which claim printed to a human by one of these could be FALSE?**
- ⚠️ **`surface-coverage.ts` decides which findings are exempt from convergence.** If its file list can
  silently under- or over-count, [D69] is unverifiable in both directions.

---

## AUDITOR C — sweep: the money screen, goals, and the store/selector layer

**Your files** *(all on the inventory; the never-swept ones are marked)*:

```
apps/rn/src/app/(tabs)/money.tsx                    apps/rn/src/store/store.ts            (partial)
apps/rn/src/store/planSelectors.ts        (never)   apps/rn/src/store/guardianSelectors.ts
apps/rn/src/store/guardianSelectors.test.ts (never) apps/rn/src/store/journeySelectors.ts
apps/rn/src/components/entities/*.tsx  (8 files · 7 unswept — 6 NEVER: DebtSheet, ExpenseSheet,
                                        LivingExpenseSheet, LogPaymentSheet, ImportDebtsSheet,
                                        AmortizationView · AddObligationSheet is `partial` · GoalSheet swept)
packages/core/engine/recommendedActions.ts (never)  packages/core/engine/testExpenseReserve.ts (never)
```

⚠️ **`store.ts` is `partial` and it is the largest file on the surface.** `.11.17` read its goal, paycheck
and repairs seams only. **Everything else in it is a first look.**

⚠️ **Known and already routed — do not re-report, but you may follow it where it leads:**
`pickTopUpGoal` (`guardianSelectors.ts:295`) passes `['savings','emergency']` and the type test is
`goal.type`, not the one owner — so a **second** emergency-typed pot is protected as if it were the safety
net. That is filed as behaviour, outside M9's naming fix. **If it has consequences beyond top-up ordering,
those are yours.**

## AUDITOR D — sweep: the plan cards and the guardian engine

**Your files — 49 of the surface's 72, and 45 of them are unswept: 36 have NEVER been examined.**
*(⚠️ I first wrote "31" here from a mental tally and the generated inventory said 36. **Site counts in this
project under-report on every single attempt** — including in the brief telling you that. Take every number
I give you as a floor and re-derive it.)*

```
apps/rn/src/components/plan/   — every file except DataRepairsCard, dataRepairsCopy(+test), SaveForItSheet
                                 (swept) and the coach-mark / tutorial / demo files (S4's, excluded)
packages/core/guardian/        — all 12 files, NONE ever swept
```

⚠️ The `partial` cards — `AffordabilityCard`, `GraduationCards`, `GuardianScorecard`, `LeanSuggestionCard`,
`PaidOffBeat`, `PaydayGuardianCard`, `PlanHero`, `ShareCard`, `WindfallSheet` — were reviewed **as a diff**,
so their behaviour is unread even though their names appear in an earlier report's clean list.

Ask, of every card:
- **Does any figure on it disagree with the same figure elsewhere?** ⚡ Cross-screen disagreement about one
  number is how both of this cluster's blockers presented, and how M9 presented.
- **What does it render when the value is `0`, absent, negative, `NaN`, or larger than its own maximum?**
- ⚠️ `apps/rn` runs on iOS native **and** react-native-web and they diverge. **Check for a `.web.tsx` fork
  before trusting any finding** — several exist in your directory.
- **`QA_TOOLS` is flipped `false` at P6.17 and `__DEV__` is `false` in a production web export — what does
  that make unreachable?**

---

## Rules — all four auditors

- ⛔ **Do not spawn sub-agents.** Do the reading yourself.
- ⛔ **Do not edit, create, move or delete ANY file under `apps/`, `packages/`, `scripts/`, `.github/`,
  `.maestro/` or `docs/` — except your own report file. NO FIXES. This round does not edit source.**
- ⛔ **Do not run the long suites**: `validate:release:rn`, `test:e2e:*`, `test:regression`,
  `test:scenarios`. ~15 minutes each and this round is read-only.
- ✅ **You MAY run an individual `lint:*` gate** — each takes seconds. ✅ **`npm run test:app` is permitted.**
- ✅ **You MAY and SHOULD compute.** Rule 3 requires printing values. **Write throwaway scripts into your
  scratchpad and run them with `node` / `npx tsx`, importing from the repo. NEVER write a scratch file into
  the repo tree.**
  ⚠️ **`node -e` with a regex or a quoted payload silently mangles under this shell — put it in a file.**
  Measured twice in the last session: it returned **empty output** on a probe that looked like it ran.
  ⚠️ **`sed -i` reports "binary file matches" and no-ops on some files here.** Use a file-based script.
  ⚠️ To import from `apps/rn`, run `npx tsx` **with the cwd inside `apps/rn`** — the `@core/*` and `@/*`
  aliases resolve from that tsconfig and from nowhere else.
- ⛔ **Write your report file incrementally** — append each finding to disk as you finish it, so a death
  loses one finding and not the round.
- ⛔ **Quote a path and a line for every claim, and verify the path and the line exist before citing.** A
  prior round produced a confident citation for a file that was not there.
- ⚠️ **Report what you could not determine.** *"Only observable on device"* is a real result.
- ⚠️ **End your report with your own "Swept and found clean" list, naming FILES** — it becomes the next
  pass's ratchet **and** the coverage claims for `surface-coverage.s1.json`. ⛔ **Name paths, not subjects.**

## Your report file

**Auditor A →** `docs/audits/2026-08-26-s1-money/A-fixes.md`
**Auditor B →** `docs/audits/2026-08-26-s1-money/B-guards-instruments.md`
**Auditor C →** `docs/audits/2026-08-26-s1-money/C-money-goals-store.md`
**Auditor D →** `docs/audits/2026-08-26-s1-money/D-plan-cards-guardian.md`

Structure:

```
# <title>
**Pinned:** bc29dfe, branch v1.7-dev.  **Surface:** …  **Bar:** blocker + major.

## Result
<n> blockers · <n> majors  (one line, up front)

## Job <n> — <the fix / the guards>            [A and B only]
### <finding> — <verdict>[ · <severity>]
**Original finding:** …
**What the fix did:** … (path:line)
**Preserved?** …
**Pinned?** <test path:line> — would / would not red on the original defect, because …

## Sweep — blocker + major
### <N>. <one-line title> — **<severity>**
**User-facing consequence:** <one sentence>
**Mechanism:** … (path:line)
**Confidence:** measured / read-only inference / needs device
**Would anything catch it?** …

## Measured, and NOT a defect — recorded so the next pass does not re-open them
## Swept and found clean — BY PATH
## Could not determine
```
