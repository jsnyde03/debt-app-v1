# Class 1 — re-audit 5: the brief

> ⛔ **You are a FRESH auditor. The session that wrote round 5's fixes is not writing this audit**, because
> a fixer re-reads its own premises instead of the code. That rule is `[D79]` step **b** and it has earned
> its keep every round: rounds 2–4 each found defects in the previous round's fixes that the fixer had
> just certified.

## What you are auditing

**Round 5 of class 1** — commits from `72d644c2` through the head of `v1.7-dev`. Round 5 closed the 16
findings `U1`–`U16` from [`CLASS1-REAUDIT-4.md`](CLASS1-REAUDIT-4.md) plus three carried from earlier
rounds (`R5`, `T3`, `T13`).

**Cumulative scope — `[D79]` step c.** The prior findings under audit are all of:

| file | ids | n |
|---|---|---|
| `D1-findings.md`, `C1-findings.md`, `C2-findings.md` | the 11 originals | 11 |
| [`CLASS1-REAUDIT.md`](CLASS1-REAUDIT.md) | `R1`–`R15` | 15 |
| [`CLASS1-REAUDIT-2.md`](CLASS1-REAUDIT-2.md) | `N-1`–`N-11` | 11 |
| [`CLASS1-REAUDIT-3.md`](CLASS1-REAUDIT-3.md) | `T1`–`T14` | 14 |
| [`CLASS1-REAUDIT-4.md`](CLASS1-REAUDIT-4.md) | `U1`–`U16` | 16 |
| | **total** | **67** |

## The two questions, and nothing else

1. **Is each of the 67 actually closed?** Not *"is there a fix"* — is the defect refused, **by planting**,
   red for the reason that names it.
2. **What did round 5's fixes break?** Interaction with anything already closed: a shared file, a shared
   import, a shared producer.

⛔ **A finding you cannot close by planting is OPEN**, whatever the commit message says. `lint:finding-guards`
is a **deletion detector** — it proves a token string still exists. It is not a closure proof.

## Where round 5 is most likely to have gone wrong

⚠️ **These are leads, not a checklist. Do not stop at them, and do not assume they are right** — a finding's
stated mechanism is a hypothesis, and this cluster has measured **2 of 4** stated mechanisms wrong while all
four observations stood.

- **`lib/joinedCode.ts` is brand new and two consumers depend on it** — `check-finding-guards.ts` and
  `apps/rn/src/components/plan/unreadInputsCopy.test.ts`. It welds concatenation junctions and drops
  comments. ⚡ Its first cut cost **8 guards outright** (268 → 260) and its second ate real characters off
  every line after an emoji. **Ask what else it over-welds.** Over-joining is the noisy direction and
  `MAX_UNGUARDED` is capped at 1.
- **`stringLiterals()` in `lib/stripCode.ts` changed the shared scanner** that **eleven** gates read
  through. It takes an optional out-parameter on `scan()`. Check nothing else moved.
- **`check-glossary`'s JSX rule is bounded at 2 newlines** (`MAX_JSX_FRAGMENT_LINES`). That bound was
  chosen, not derived. **Is there real copy it now misses?** 134 of 2,023 JSX candidates are rejected on
  span — read some of them.
- **`clampedDay()` in `check-month-arithmetic`** exempts a `getDate()` that is an argument of a call. Find
  a spelling where that exempts a genuinely unclamped day.
- **`Recipe.edit` and `sameLine`** in `test-wrap-escapes.ts` are new plant kinds. The harness now runs each
  gate up to three times. **Do the recipes still discriminate?** `U5` is exactly this failure one round ago.
- **The `U8` pin counts occurrences of its own literals.** Two edits could satisfy it while breaking the
  composition. Try.
- **`lib/plantSafety.ts` installs process-wide signal handlers** and a pre-flight that **writes to tracked
  files**. It runs inside `prove:guards` and `test:wrap-escapes`. ⛔ **Ask what happens when it is wrong** —
  a pre-flight that restores the wrong bytes is strictly worse than the defect it replaced.
- **11 new registry entries.** Each claims an executed proof. Re-run them; `2 of 32` did not hold the last
  time anyone checked.

## Method — non-negotiable

- ⛔ **Plant BOTH spellings, wrapped and unwrapped, directly.** Class 1 may not lean on the gates it is
  repairing. Round 5 added same-line coverage to the harness; **verify it rather than trusting it.**
- ⛔ **A red baseline is a FAULT, not a verdict.** Run the gate clean before every plant. `R1` was filed
  because a harness scored `MATCHED` over runs where the gate was already red for an unrelated reason.
- ⛔ **Verify every restore with `cmp`, never `git diff`, and never `git checkout --`** — that throws away
  an uncommitted fix along with the plant.
- ⚠️ **Plant in BYTE mode.** This repo is CRLF; Python's text mode silently rewrites a whole file's line
  endings and `git diff` shows it as an ordinary change. `cmp` catches it at char 43.
- ⚠️ **Backslashes do not survive a shell heredoc here.** Write probes through a placeholder substituted
  for `chr(92)`. This corruption class is `U13` and it has now arrived in the audit's own tooling twice.
- ⚠️ **An interrupted plant harness now RESTORES ITSELF** — that is `U15`'s fix and it is one of the things
  you are auditing. Check `git status` after any kill anyway.
- **Write findings incrementally to disk.** Three auditors have died mid-round; the findings already on
  disk are what survived.
- ⛔ **No sub-agents.** Quote the worst-case spend before starting anything long.

## Output

`CLASS1-REAUDIT-5.md` in this directory, probes in `class1-reaudit5-probes/`. Per finding: **consequence ·
file:line · the measurement that produced it · mechanism (marked HYPOTHESIS) · remedy (marked UNVERIFIED)**.
Severity `blocker` / `major` / `minor`.

⚠️ **Record what you measured and found NOT to be a defect**, too. Three rounds have re-derived the same
non-defects. That section is part of the deliverable.

⛔ **Leave the tree clean.** `git status --short` at the end must show only this audit's own files.
