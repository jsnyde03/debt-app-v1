# Class 4 — the re-audit: the brief *(round 1 — see `CLASS4-REAUDIT-2-BRIEF.md` for round 2)*

> ⛔ **You are a FRESH auditor.** The session that wrote class 4's fixes is not writing this audit, because
> a fixer re-reads its own premises instead of the code. That is `[D79]` step **b**, and across class 1 it
> earned its keep every single round: rounds 2–6 each found defects in the previous round's fixes that the
> fixer had just certified.

## What you are auditing

**Class 4 — the double-scaled in-window minimum.** The commits from `bc336cfd` (which recorded class 1's
close and promoted class 4) to the head of `v1.7-dev`.

⛔ **DERIVE THE FIX SET FROM THE DIFF, NOT FROM THE FINDING LIST.**

```
git diff --stat bc336cfd..HEAD -- apps packages scripts
git log --oneline bc336cfd..HEAD
```

This is class 1's own sharpest result (`V1`): round 5's guards were scoped from a finding **list**, and the
most-recurring defect in the cluster ended up with **no guard at all** because it had already left that list.
Walk the diff, and for every behaviour it changes ask *what would notice if this line were reverted?*

## ⛔ AND RE-DERIVE THE CLASS'S MEMBERSHIP TWO INDEPENDENT WAYS

**This round cost a finding to exactly that.** The boundary was recorded as *"all 11 findings addressed."*
**Ten were.** `A3-7` was confirmed real in `.4.2`, had its stated reason corrected, and was then never
fixed — it appears in **no commit message in the range**. It was caught only because writing this brief
required quoting a membership count, which meant reading the class table.

So: build the list from `CLASSIFICATION.md` §CLASS 4, **and** independently from the `A2-`/`A3-` finding
files, **and** from the commit range — then check all three agree. ⚠️ Pass 6 measured a class whose
**count, severities, and "unrated" tally were all wrong**, and `A3-7` is recorded as `major` in the class
table while the log's severity ledger lists it `minor`. **Never schedule or dismiss off a label.**

**Cumulative scope — `[D79]` step c.** Class 1 is closed and stays under audit:

| file | ids | n |
|---|---|---|
| `CLASSIFICATION.md` §CLASS 4 + `A2-findings.md`, `A3-findings.md` | `A2-1` `A2-2` `A2-3` `A2-4` `A2-8` `A3-1` `A3-2` `A3-4` `A3-7` `A3-12` `A3-14` | 11 |
| class 1: `D1`/`C1`/`C2` originals + `CLASS1-REAUDIT{,-2,-3,-4,-5}.md` | **class 1's own 11** + `R1`–`R15` `N-1`–`N-11` `T1`–`T14` `U1`–`U16` `V1`–`V12` | 79 |
| class 1 round 6: `CLASS1-REAUDIT-6.md` | `W1`–`W15` | 15 |
| class 1 round 6, **recorded only in `DEBT_ELEVATION_LOG.md`** | `W9b` | 1 |
| | **total** | **106** |

⚠️ **That count is a claim to check, not a given — and it has now been wrong twice.** The first draft said
**90** (it stopped at `V*` and forgot round 6 existed); the second said **105**, folding `W9b` into a
range that already held 15 ids. ⛔ **`W9b` appears nowhere in this directory** — it is a distinct finding
with its own remedy and its own fix, and its only home is `DEBT_ELEVATION_LOG.md`. **A file-driven
enumeration of the round files cannot find it**, which is exactly why the count must be derived more than
one way. **If your own enumeration disagrees, yours is the one to trust, and the disagreement is itself a
finding.**

## The two questions, and nothing else

1. **Is each of the 90 actually closed?** Not *"is there a fix"* — is the defect refused, **by planting**,
   red for the reason that names it.
2. **What did class 4's fixes break?** Interaction with anything already closed: a shared file, a shared
   import, a shared producer.

⛔ **A finding you cannot close by planting is OPEN**, whatever the commit message says.
`lint:finding-guards` is a **deletion detector** — it proves a token string still exists. Not a proof.

## Where class 4 is most likely to have gone wrong

⚠️ **Leads, not a checklist. Do not stop at them, and do not assume they are right** — a stated mechanism
is a hypothesis, and this project has measured **2 of 4** wrong while all four observations stood.

- ⛔ **`selectors.ts` NO LONGER SCALES, and that is the largest blast radius in the diff.** Every consumer
  of the store's debt list now receives **raw** `minimumPayment`s where it used to receive in-window ones.
  The fix was justified by two readers (the allocator's reserve, `applyRolloverPayment`'s paydown).
  **Find a third.** Anything reading `debts` off that selector — cards, widgets, the Live Activity, the
  paywall lead, CSV/export, notifications — is a candidate for having silently lost its scaling.
- ⛔ **`buildMultiCycleTimeline` now maintains TWO debt lists in one function** — `projDebts` (raw, to the
  allocator) and `scaledProjDebts` (to `buildTimelineItems`). Cycle 0 scales separately again. **Three
  scalings in one file, by hand.** Which cycle gets which, and is cycle 0 consistent with cycle 1?
- ⛔ **`buildTimelineItems:109` reads `debt.minimumPayment` RAW** and is correct only because both
  production callers pre-scale. That contract is written nowhere the caller can see. Find a path that
  reaches it unscaled, or a test that does.
- **`allocatePaycheck:546` now uses `minimumDueInWindow` capped at `remainingDebtBalance`.** Interactions
  worth attacking: a partially-paid debt (`paidTowardDebt`), a balance smaller than one installment,
  `affordableUnpaidRequiredCount`, and the **`unfundedAmount`/shortfall copy** — the required figure grew,
  so a user who previously saw no shortfall may now see one. Is that surfaced honestly, or does some
  screen still print the old number beside the new one?
- **`deriveRequiredActionView`'s `type === "bnpl"` gate is gone**, so every debt is now multipliable in the
  caption. What copy did that change, and is there a debt shape where the caption is now wrong or absurd?
- **`bnplInstallmentAmount` was made public** to stop a second copy of the rule drifting. New public
  surface — check nothing else already had its own copy.
- ⚠️ **`inWindowMinimum.test.ts` computes its fixtures from the CLOCK** (`day(0)`, `day(28)`, `day(3)`).
  That removes a dated fuse and introduces a date-dependence: **what does it do on the 29th–31st of a
  month, across a DST boundary, or when `day(28)` crosses a year?** A guard that reds one day a month is
  worse than the fuse it replaced.
- **`testGuardianPartition`'s new block asserts `50 * charges` with `charges` hand-written per cadence
  (5 / 3 / 1) against a fixed 30-day window.** Those are three hard-coded numbers in a file whose whole
  subject is hard-coded numbers going stale. Are they right, and do they stay right?

## Method — non-negotiable

- ⛔ **A red baseline is a FAULT, not a verdict.** Run the gate clean before every plant.
- ⛔ **A plant must make an assertion FAIL, never THROW past it.** Twice in class 1 a plant crashed the
  harness and the verdict was about the crash. If a plant produces a stack trace, fix the plant.
- ⛔ **Plant BOTH directions.** A two-class defect needs a plant per class: this class's instruments catch
  a **deleted** scaling and its new one catches a **doubled** one, and neither covers the other. A fixture
  proving one direction leaves the other vacuous.
- ⛔ **A PLANT ONLY EXERCISES A SUITE UP TO ITS FIRST RED — and this round proved it costs a proof.**
  Class 4 added an assertion upstream of `S1P3-A4`'s in the same suite, and `A4`'s plant thereafter tripped
  `[A2/A3-1] Expected $200, received $50` instead: **`reason=WRONG`, no code changed, no guard deleted,
  `lint:finding-guards` green throughout.** ⚠️ **When a plant reds, read WHICH assertion redded** — a red
  is not a verdict until it names your defect. If it names a different one, scope the run to the file that
  owns the assertion you are proving. **Adding an assertion can void an existing proof.**
- ⚠️ **`proof.run` in `finding-guards.json` is an npm SCRIPT NAME**, not a command line — it is executed as
  `npm run <it>`. A command string there is red unconditionally and reads as *"the control redded too, so
  this run measured nothing."* The argv form is **`proof.cmd`**. ⚠️ That file also has **mixed line
  endings** (CRLF at the head, LF in later entries): a byte-anchored edit must match its own block. And
  anchor on `"<id>": {`, never the bare id — a `find` on the id matches **mentions inside other entries'
  prose** first, which this round put a note on the wrong entry.
- ⛔ **Verify every restore with `cmp`**, never `git diff`, and never `git checkout --`.
- ⚠️ **Plant in BYTE mode** (`'rb'`/`'wb'`). This repo is CRLF and text mode silently rewrites line endings.
- ⚠️ **Backslashes do not survive a shell heredoc here** — write probes through a `chr(92)` placeholder.
- ⚠️ **A mechanical rewrite of a whole file is a defect risk**, measured twice in this project (489 lines
  deleted once, a 1,052-line plan truncated to 0). Edit surgically; re-read what you wrote.
- ⚠️ **Check `git status` for `*.plant-backup` / `*.plant-owner` / `*.plant-hash` before you finish.**
  `test:plant-safety` reds on a tracked one; do not add one.
- **Write findings incrementally to disk.** Three auditors have died mid-round.
- ⛔ **No sub-agents.** Quote the worst-case spend before starting anything long.

## Output

`CLASS4-REAUDIT.md` in this directory, probes in `class4-reaudit-probes/`. Per finding: **consequence ·
`file:line` · the measurement · mechanism (marked HYPOTHESIS) · remedy (marked UNVERIFIED)**, severity
`blocker`/`major`/`minor`.

⚠️ **Record what you measured and found NOT to be a defect**, too — prior rounds have re-derived the same
non-defects four times over.

⛔ **Leave the tree clean.** `git status --short` at the end must show only this audit's own files.
