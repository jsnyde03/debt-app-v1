# Class 4 — re-audit **2**: the brief

> ⛔ **You are a FRESH auditor.** The session that wrote round 1's fixes is not writing this, because a
> fixer re-reads its own premises instead of the code. That is `[D79]` step **b**, and round 1 earned it
> outright: its blocker was **the fixer's own new guard**, which passed on 21% of calendar days and had
> `npm run test:app` five days from red.

## What you are auditing

**Round 1** — the commits from `24a444cc` (which recorded round 1's brief) to the head of `v1.7-dev`.
Round 1 closed the 8 findings `F1`–`F8` in [`CLASS4-REAUDIT.md`](CLASS4-REAUDIT.md), plus a **9th** the
fixer found by measurement and the audit did not name.

⛔ **DERIVE THE FIX SET FROM THE DIFF, NOT FROM THE FINDING LIST.**

```
git diff --stat 24a444cc..HEAD -- apps packages scripts
git log --oneline 24a444cc..HEAD
```

**Cumulative scope — `[D79]` step c.** Everything already closed stays under audit: **class 1's 95**
*(11 + `R`15 + `N-`11 + `T`14 + `U`16 + `V`12 + `W`15 + **`W9b`**)* + class 4's 11 + round 1's 8 = **114**.

⛔ **THAT NUMBER HAS NOW BEEN WRONG IN THREE CONSECUTIVE BRIEFS — 90, 105, 113 — and each correction failed
to survive into the next one.** `W9b` is why: it is a real finding with its own remedy and its own fix, and
it exists **nowhere in this directory**, only in `DEBT_ELEVATION_LOG.md`. **A file-driven enumeration of the
round files structurally cannot find it.** ⚠️ **Derive the count yourself, two ways, and treat a
disagreement as a finding.**

## The two questions, and nothing else

1. **Is each closed?** Not *"is there a fix"* — is the defect refused, **by planting**, red for the reason
   that names it.
2. **What did round 1's fixes break?** Interaction with anything already closed: a shared file, a shared
   import, a shared producer.

## ⛔ Two method rules round 1 paid for. They are not optional here.

- **A PLANT ONLY EXERCISES A SUITE UP TO ITS FIRST RED.** Four of ten proofs read `WRONG-reason` because a
  *different* assertion fired first. **When a plant reds, read WHICH assertion redded** — a red is not a
  verdict until it names your defect. Scope the run to the file that owns the assertion you are proving.
- **AN INSTRUMENT-REPAIR FINDING PROVES GREEN-BEFORE / RED-AFTER.** For a finding of the form *"this
  control is blind"*, the only honest proof is: with the defect planted, was the file **green on the
  pre-repair version** (`git show <base>:<file>`) and **red now**? Round 1's first plants for `A2-2` and
  `A3-14` were **red on the pre-repair file** — they tested a defect those files could always see, and
  would have recorded a ✅ over no evidence.

## Where round 1 is most likely to have gone wrong

⚠️ **Leads, not a checklist, and a stated mechanism is a hypothesis** — this project has measured 2 of 4
wrong while all four observations stood.

- ⛔ **THE FIXER'S OWN NEW CODE IS WHERE BOTH ROUNDS' WORST FINDINGS WERE.** Round 1's blocker and two of
  its majors were the fixer's own instruments. Weight `inWindowMinimum.test.ts`, `testCadenceIdentity.ts`
  and `testGuardianPartition.ts` over the production diff, not under it.
- ⛔ **`chargesInWindow` in `testCadenceIdentity.ts` is a hand-written date walker** that first shipped
  with a `setUTCMonth` overflow. It now uses `addMonthsISO` with an anchor day. **Attack it: month-end
  anchors, leap years, the half-open boundary, `one-time`, `quarterly`/`annually` in a ≤31-day window.**
  It is the expected value the whole 56-pair matrix is asserted against — **if it is wrong, the matrix
  agrees with it and reports green.**
- ⚠️ **`inWindowMinimum.test.ts` now drives its projection off a `biweekly` pay cycle** to make every
  window a constant 14 days. **Is it?** And does `debtFreeBand.test.ts`'s newly pinned
  `nextPaycheckDate: '2026-09-01'` hold for every assertion in that file?
- ⛔ **A 365-day walk found what three spot-checks did not.** Any fixture built from the clock is a
  candidate. `lint:fixture-dates` is blind to the class where **the fuse is the unpinned other end**, not
  a literal in the file.
- **`planSelectors.ts` and `recoverySelectors.ts` now call `effectiveMinimumInWindow`** where they read
  raw fields. Both are user-facing money. Check the paid/unpaid transition, a balance below one
  installment, and whether any *third* reader still disagrees.
- **`guardianSelectors.selectBnplBetweenPaycheck` widened past `isInstallmentNative` and now names the
  DEBT when there is no provider.** That is user-facing copy on a debt the user never called a BNPL.
  Is the sentence true for every shape it now admits?
- **Ten registry entries were added this round and several share one plant.** Re-run them
  (`npm run prove:guards -- --id=<ID>`); check each `expect` actually names *its* defect rather than a
  neighbour's.

## Method — non-negotiable

- ⛔ **A red baseline is a FAULT, not a verdict.** Run the gate clean before every plant.
- ⛔ **A plant must make an assertion FAIL, never THROW past it.**
- ⛔ **Verify every restore with `cmp`**, never `git diff`, and never `git checkout --`.
- ⚠️ **Plant in BYTE mode** (`'rb'`/`'wb'`) — this repo is CRLF and text mode rewrites line endings.
- ⚠️ **`scripts/finding-guards.json` has MIXED line endings and `proof.run` is an npm SCRIPT NAME** (the
  argv form is `proof.cmd`). **Edit it with a JSON serializer, never by hand** — a hand-assembled edit left
  it unparseable this round, and anchoring a `find` on a bare finding id matches *mentions inside other
  entries' prose*.
- ⚠️ **A guard token must be in CODE.** `lint:finding-guards` rejects one that appears only in a comment,
  and one anchored on the `$` of a template interpolation never matches (the scanner blanks those spans).
- ⚠️ **Check `git status` for `*.plant-backup` / `*.plant-owner` / `*.plant-hash` before you finish.**
- **Write findings incrementally to disk.** Three auditors have died mid-round.
- ⛔ **No sub-agents.** Quote the worst-case spend before starting anything long.

## Output

`CLASS4-REAUDIT-2.md` here, probes in `class4-reaudit2-probes/`. Per finding: **consequence · `file:line` ·
the measurement · mechanism (marked HYPOTHESIS) · remedy (marked UNVERIFIED)**, severity
`blocker`/`major`/`minor`.

⚠️ **Record what you measured and found NOT to be a defect**, too.

⛔ **Leave the tree clean.** `git status --short` at the end must show only this audit's own files.
