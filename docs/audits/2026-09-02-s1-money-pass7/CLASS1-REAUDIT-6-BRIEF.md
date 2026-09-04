# Class 1 — re-audit 6: the brief

> ⛔ **You are a FRESH auditor.** The session that wrote round 6's fixes is not writing this audit, because
> a fixer re-reads its own premises instead of the code. That is `[D79]` step **b**, and it has earned its
> keep every single round: rounds 2–6 each found defects in the previous round's fixes that the fixer had
> just certified. **Round 6 found a BLOCKER in round 5's fix — a pre-flight that destroyed 83 bytes of
> uncommitted work in a tracked file.**

## What you are auditing

**Round 6** — the commits from `9ff5e87c` (which recorded re-audit 5) to the head of `v1.7-dev`. Round 6
closed the 12 findings `V1`–`V12` from [`CLASS1-REAUDIT-5.md`](CLASS1-REAUDIT-5.md).

⛔ **DERIVE THE FIX SET FROM THE DIFF, NOT FROM THE FINDING LIST.** This is round 6's own sharpest result
(`V1`) and it is now a rule of this brief:

```
git diff --stat 9ff5e87c..HEAD          # every file round 6 touched
git log --oneline 9ff5e87c..HEAD        # what each commit claims
```

`V1` exists because round 5's guards were scoped from re-audit 4's finding **list**, and `U1` had already
left that list by being fixed in the round's FIRST commit — which the previous brief's own commit range
excluded. **The most-recurring defect in the cluster ended up with no guard at all, by a bookkeeping
accident.** Do not inherit that: walk the diff, and for every behaviour it changes ask *what would notice
if this line were reverted?*

**Cumulative scope — `[D79]` step c.** All prior findings are under audit:

| file | ids | n |
|---|---|---|
| `D1-findings.md`, `C1-findings.md`, `C2-findings.md` | the 11 originals | 11 |
| [`CLASS1-REAUDIT.md`](CLASS1-REAUDIT.md) | `R1`–`R15` | 15 |
| [`CLASS1-REAUDIT-2.md`](CLASS1-REAUDIT-2.md) | `N-1`–`N-11` | 11 |
| [`CLASS1-REAUDIT-3.md`](CLASS1-REAUDIT-3.md) | `T1`–`T14` | 14 |
| [`CLASS1-REAUDIT-4.md`](CLASS1-REAUDIT-4.md) | `U1`–`U16` | 16 |
| [`CLASS1-REAUDIT-5.md`](CLASS1-REAUDIT-5.md) | `V1`–`V12` | 12 |
| | **total** | **79** |

## The two questions, and nothing else

1. **Is each of the 79 actually closed?** Not *"is there a fix"* — is the defect refused, **by planting**,
   red for the reason that names it.
2. **What did round 6's fixes break?** Interaction with anything already closed: a shared file, a shared
   import, a shared producer.

⛔ **A finding you cannot close by planting is OPEN**, whatever the commit message says.
`lint:finding-guards` is a **deletion detector** — it proves a token string still exists. Not a proof.

## Where round 6 is most likely to have gone wrong

⚠️ **Leads, not a checklist. Do not stop at them, and do not assume they are right** — a stated mechanism
is a hypothesis, and this cluster has measured **2 of 4** wrong while all four observations stood.

- ⛔ **`lib/plantSafety.ts` writes to tracked files and runs inside `lint:rn`.** It has now been wrong
  twice in opposite directions — once recovering nothing that mattered, once **destroying work**. The new
  rule needs the target DIRTY vs `HEAD` *and* its bytes to match a recorded plant hash. **Ask what happens
  when the hash is stale, when `HEAD` moves mid-run, when two harnesses arm the same file, and when the
  repo is mid-rebase or mid-merge.** A pre-flight that restores the wrong bytes is worse than the defect.
- **`PROVE_GUARDS_DRAINING` is an env-var exemption that downgrades two ceilings.** It is meant to be
  narrow. **Is it?** Can anything else set it? Does it leak to grandchildren that are not gates? Is either
  ceiling now unenforced somewhere a human reads a result?
- **`afterEnclosingGroups` (in `lib/logicalLines.ts`)** decides *grouping paren vs call paren* by the
  character before the `(`. Two money gates have no allow-list, so a false positive reds the tree. Find a
  spelling it gets wrong in either direction.
- **`check-glossary`'s JSX rule is now a punctuation test**, chosen because it kept 8 prose blocks the line
  bound rejected. **Prose contains parentheses.** What real copy does it now reject, and what code weld
  does it now admit?
- **`clampedDay`'s `CLAMPING_CALLEE`** accepts `Math.min` and anything matching `/clamp/i`. Both directions.
- **`joinedCode` now calls `stripCommentsOnly`** — the shared scanner, whose own header names constructs it
  does **not** model (JSX text, HTML comments in `.tsx`, `({a:1}/x/g)`). Does any of that matter to a guard
  token or to `unreadInputsCopy`'s copy sweep?
- **`debtPrefill`'s exemption is now the initialiser `editing ?? prefill`.** It has no scope model. Find a
  spelling that evades it, and one it now falsely accuses.
- **14 registry entries were added or repointed this round**, and several proofs were repointed *because
  their anchors moved*. Re-run them. `2 of 32` did not hold the last time anyone checked.
- **`PER_LINE_OK` is pinned at 13 and `MAX_UNREVIEWED` at 12.** Both are hand-maintained numbers.

## Method — non-negotiable

- ⛔ **Plant BOTH spellings, wrapped and unwrapped, directly.** Class 1 may not lean on the gates it is
  repairing.
- ⛔ **A red baseline is a FAULT, not a verdict.** Run the gate clean before every plant.
- ⛔ **A plant must make an assertion FAIL, never THROW past it.** Twice this cluster a plant crashed the
  harness and the verdict was about the crash (`U2`, `U15`). If a plant produces a stack trace, fix the
  plant.
- ⛔ **Verify every restore with `cmp`**, never `git diff`, and never `git checkout --`.
- ⚠️ **Plant in BYTE mode** (`'rb'`/`'wb'`). This repo is CRLF and text mode silently rewrites line endings.
- ⚠️ **Backslashes do not survive a shell heredoc here** — write probes through a `chr(92)` placeholder.
- ⚠️ **Check `git status` for `*.plant-backup` / `*.plant-owner` / `*.plant-hash` before you finish.**
  Fifteen of those were committed this round by a `git add -A`. `test:plant-safety` now reds on a tracked
  one; do not add one.
- **Write findings incrementally to disk.** Three auditors have died mid-round.
- ⛔ **No sub-agents.** Quote the worst-case spend before starting anything long.

## Output

`CLASS1-REAUDIT-6.md` here, probes in `class1-reaudit6-probes/`. Per finding: **consequence · file:line ·
the measurement · mechanism (marked HYPOTHESIS) · remedy (marked UNVERIFIED)**, severity
`blocker`/`major`/`minor`.

⚠️ **Record what you measured and found NOT to be a defect**, too — four rounds have re-derived the same
non-defects.

⛔ **Leave the tree clean.** `git status --short` at the end must show only this audit's own files.
