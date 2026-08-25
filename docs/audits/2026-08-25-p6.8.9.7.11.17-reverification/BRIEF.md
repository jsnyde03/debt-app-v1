# P6.8.9.7.11.17 — re-verify `.11.11`–`.11.15`, sweep again for major+, and RATE IT

**Target tree:** branch `v1.7-dev`, ships as `2.0.0`. HEAD = `c8d54fa`.
**The fix range under verification:** `6736a64..c8d54fa` — 93 source files, +4,114 / −409.
**The predecessor round:** `docs/audits/2026-08-25-p6.8.9.7.11.10-severity/` — its four
`{A,B,C,D}-*.md` files hold the finding text these fixes were written against. `SUMMARY.md`
there **under-counts** (it said "9 open majors" where the auditor files hold 14); the auditor
files are the ledger, the summary is only the map.

**Two jobs, in this order. Do not merge them; report them in separate sections.**

1. **Did each fix actually close its finding?** Read the code, not the claim, not the commit message.
2. **Is any other blocker- or major-severity defect present in your surface?** Not a diff read — a
   **sweep**, including code neither round changed.

⛔ **Every finding carries a SEVERITY, and the severity is the deliverable.** Jason decides what ships
from these ratings. An inflated one costs real time; a deflated one ships a defect. Rate the defect as it
would reach a user, not by how interesting it is to explain.

⛔ **NO FIXES. This round does not edit source.** Findings only. Implementation is a separate, reviewed step.

---

## The severity scale — use exactly these words

| severity | means |
|---|---|
| **blocker** | It ships broken. Data loss or corruption · a wrong number about the user's money · a crash or a permanently stuck screen · a statement to the user that is false about their own money or data · a once-ever moment lost forever. |
| **major** | A real user can hit it and the product is meaningfully worse: a feature that does not work, a screen that misleads, an irreversible action with no guard — **or a gate or test that cannot catch the class it exists for**, because that is how the next blocker ships. |
| **minor** | Correct behaviour, imperfect craft: prose, a stale `path:line`, a cosmetic misalignment, a comment that describes something slightly wrong. **No user-visible consequence and no instrument blinded.** |

- **A wrong comment is `minor`** — unless it is load-bearing for a future maintainer's safety decision, or
  it is a claim shown **to the user**, which makes it `major` or `blocker` by what it says.
- **A test that passes with its own defect present is `major`, not `minor`.**

⛔ **State the user-facing consequence in one sentence for every `blocker` and `major`.** If you cannot
write that sentence, the finding is `minor`. That test is the point of this brief.

---

## ⚡ Four reading rules the LAST round paid for. Not general advice — each names a miss.

1. ⛔ **Every finding's cost estimate was right about what it counted and silent about a dimension it
   never mentioned.** Four of five counts were correct; the misses were a `.web.ts` fork, a past-tense
   docstring, seven surfaces going bold, and a broken instrument. **Read what an estimate does not mention.**
2. ⛔ **A finding taken off the capture matrix is a claim about the WEB build.** `apps/rn` runs on iOS
   native **and** react-native-web and they diverge. **Check for a `.web.ts` / `.web.tsx` fork before
   trusting any craft or layout finding.**
3. ⛔ **A stated mechanism is a hypothesis even when it is hours old and written by the person fixing it.**
   [D63] reversed a recommendation Jason had already agreed to, because the test's own precondition
   refuted the mechanism. **When the claim is about a computed value, print the value.**
4. ⛔ **Three of six sub-steps last round reproduced the class they were closing — all three caught by an
   INSTRUMENT, none by review.** **Expect the fixer's own work to carry the defect it was closing.**
   The three shapes seen: a required field that gated nothing because the tool only transpiled; an
   unreachable guard clause whose test stayed green when the clause was deleted; four fixtures refused
   before the code under test ever ran.

⚠️ **And two more from the same cluster, about findings themselves:**
- **Two stale premises came from in-repo COMMENTS the findings quoted as evidence.** A quoted docblock is
  a carried premise, not a measurement.
- **The observation, the premise and the remedy fail independently.** `.11.12` measured four of fourteen
  findings' premises false. One `.11.13` row was already closed by an earlier step; another named one of
  three producers. Verify all three parts separately.

---

## Job 1 — verify the fixes

Your assignment section below names which `.11.x` sub-steps are yours. For each, three questions:

1. **Is the original finding's behaviour actually gone?** Read the code that produces it.
2. **Did the fix preserve what the site did right?** ⚡ **The worst defects in three consecutive rounds
   were over-matching fixes** — a repair that also destroyed correctly-read data; an attribution that also
   silenced a real loss; a clamp that kept a falsehood instead of suppressing it. **Ask what the change
   now does to inputs the finding never mentioned.**
3. **Would anything catch it un-fixing?** Name the test **and say whether it would fail on the ORIGINAL
   defect** — not merely whether it exists. ⛔ **A test whose earlier assertion reds first never exercises
   the later ones**, so a dead assertion rides along while every plant reports the suite sound. If a test
   has several assertions, say which one carries the finding and whether an earlier one would fire first.

**Verdicts for job 1:** `CLOSED` · `CLOSED-UNPINNED` · `PARTIAL` · `OPEN` · `WRONG-REMEDY` ·
`NOT-A-DEFECT` · `ALREADY-CLOSED-ELSEWHERE`.
Each `PARTIAL` / `OPEN` / `WRONG-REMEDY` also carries a **severity**.

## Job 2 — the major+ sweep

**Look for defects nobody has filed**, in your surface, including code neither round changed.
`minor` findings are **not wanted here** — report only `blocker` and `major`. If a sweep turns up nothing
at that bar, **say so plainly**: "no blocker or major found in `<surface>`" is a real and valuable result,
and padding it with `minor` items is what makes a report unreadable.

Ask, of each surface:
- What is the **worst thing** a user can end up believing or losing here?
- What input, timezone, locale, platform, or ordering has nobody tried? (Storefronts are **US · CA · AU ·
  NZ** — Sydney and Auckland are **east of UTC**.)
- What is **irreversible**, and what guards it?
- Which claim made to the user could be **false**?
- `QA_TOOLS` is flipped **false** at P6.17 and `__DEV__` is false in a production web export — what does
  that make unreachable?

### ⛔ RATCHET — this list was swept CLEAN last round. Do not re-report it; EXTEND it.

A coverage audit converges by extending what has been looked at, not by finding less. Last round's
auditors swept and found clean at the blocker/major bar:

> `coachMarks.ts` · `tutorialTargets.tsx` · the callout's touch model · `progress.tsx`'s scroll host ·
> `check-comment-convention` · `check-local-dates` *(every `toISOString`/`getUTC` site in `packages/core`
> and `apps/rn/src` re-checked — no calendar date routed through UTC, so the Sydney/Auckland class has no
> live site)* · `check-money-format` · `check-a11y-collapse` · `check-committed-secrets` ·
> `check-rn-style-divergence` · `check-copy-owners` · `check-icon-glyphs` · `gateSources` /
> `write-gate-status`.

⚠️ **Four of those were CHANGED by this fix range** — `coachMarks.ts`, `progress.tsx`,
`check-comment-convention.ts`, `check-local-dates.ts`. **A clean verdict does not survive an edit.**
Re-check exactly the changed part; do not re-sweep the whole file.

**End your report with your own "swept and found clean" list**, naming files and surfaces, so the next
round ratchets off yours.

---

## Rules

- ⛔ **Do not spawn sub-agents.** Do the reading yourself.
- ⛔ **Do not edit, create, move or delete ANY file under `apps/`, `packages/`, `scripts/`, `.github/` or
  `.maestro/`.** Your only writes are your own report file under this audit folder.
- ⛔ **Do not run the gates or the suites** (`validate:release:rn`, `lint:rn`, `test:e2e:*`, `test:app`,
  `test:regression`, `test:scenarios`). They take ~15 minutes and this round is read-only.
- ✅ **You MAY compute.** Rule 3 above requires printing values. Write a throwaway script into the
  **scratchpad** (`C:/Users/Jason/AppData/Local/Temp/claude/c--Users-Jason-Hearthlight/8f80e95e-af4d-4837-975e-1be7f2fa0395/scratchpad`)
  and run it with `npx tsx`, importing from the repo. **Never write a scratch file into the repo tree.**
  ⚠️ `node -e` with a regex or a quoted payload silently mangles under this shell — put it in a file.
- ⛔ **Write your file incrementally** — append each finding to disk as you finish it, so a death loses one
  finding and not the round.
- ⛔ **Quote a path and a line for every claim, and verify the path and the line exist before citing.**
  A prior round produced a confident citation for a file that was not there, and another cited line
  numbers that had moved.
- ⚠️ **Report what you could not determine.** "Only observable on device" is a real result.
- ⚠️ **Do not grade on effort, and do not inflate to seem thorough.** Two blockers and nothing else is
  more useful than twenty findings that need triage.
- ⚠️ **`git grep` / `grep` piped to `head` has under-reported a site count on five consecutive items.**
  Count the whole result, then show it.

## Where things are

| | |
|---|---|
| **the fixes to verify** | `git diff 6736a64..c8d54fa -- <your files>` |
| **what they were fixing** | `docs/audits/2026-08-25-p6.8.9.7.11.10-severity/{A,B,C,D}-*.md` — the finding text |
| **how the fixer says it went** | `docs/DEBT_ELEVATION_LOG.md` — search for your sub-step id. ⚠️ **This is a claim, not evidence.** |
| **the app** | `apps/rn/src/`, `packages/core/` |
| **the gates** | `scripts/`, registered in root `package.json` under `lint:*`, run by `scripts/run-gates.ts` |
| **the repo** | `git -C /c/Users/Jason/debt-app-v1 …` — the cwd drifts, always pass `-C` |

## Your report file

Write to `docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/<YOUR-LETTER>-<surface>.md`.
Structure it exactly:

```
# <letter> — <surface>

## Job 1 — the fixes, re-verified
### <finding id> — <verdict>[ · <severity>]
**Original finding:** …
**What the fix did:** … (path:line)
**Preserved?** …
**Pinned?** <test path:line> — would / would not red on the original defect, because …

## Job 2 — sweep for blocker + major
### <N>. <one-line title> — **<severity>**
**User-facing consequence:** <one sentence>
**Mechanism:** … (path:line)
**Confidence:** measured / read-only inference / needs device
**Would anything catch it?** …

## Swept and found clean
…

## Could not determine
…
```
