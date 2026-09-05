# Class 4 — re-audit **3**: the brief

> ⛔ **You are a FRESH auditor.** The session that wrote round 2's fixes is not writing this, because a
> fixer re-reads its own premises instead of the code. That is `[D79]` step **b**, and it has paid for
> itself in both rounds so far: round 1's blocker was the fixer's own new guard (`test:app` five days from
> red), and round 2's blocker was **a regression introduced by round 1's own fix**.

## What you are auditing

**Round 2** — the commits from `68c348f9` to the head of `v1.7-dev`. Round 2 closed the 6 findings
`R2-1`–`R2-6` in [`CLASS4-REAUDIT-2.md`](CLASS4-REAUDIT-2.md).

⛔ **DERIVE THE FIX SET FROM THE DIFF, NOT FROM THE FINDING LIST.**

```
git diff --stat 68c348f9..HEAD -- apps packages scripts
git log --oneline 68c348f9..HEAD
```

13 files, +559/−75. Two of them (`prove-guards.ts`, `check-finding-guards.ts`) are **the harness that
proves every other finding closed** — weight them accordingly.

**Cumulative scope — `[D79]` step c.** Everything already closed stays under audit: **class 1's 95**
*(11 + `R`15 + `N-`11 + `T`14 + `U`16 + `V`12 + `W`15 + **`W9b`**)* + class 4's 11 + round 1's 8 + round
2's 6 = **120**.

⛔ **THAT COUNT HAS BEEN WRONG IN THREE CONSECUTIVE BRIEFS — 90, 105, 113 — and every correction failed to
survive into the next one.** `W9b` is why: a real finding with its own remedy and its own fix, existing
**nowhere in this directory**, only in `DEBT_ELEVATION_LOG.md`. **A file-driven enumeration structurally
cannot find it.** Derive the count two ways and treat a disagreement as a finding.

## The two questions, and nothing else

1. **Is each closed?** Not *"is there a fix"* — is the defect refused, **by planting**, red for the reason
   that names it.
2. **What did round 2's fixes break?** Interaction with anything already closed: a shared file, a shared
   import, a shared producer.

## ⛔ Method rules the first two rounds paid for. Not optional.

- **A PLANT ONLY EXERCISES A SUITE UP TO ITS FIRST RED.** When a plant reds, **read WHICH assertion
  redded** — a red is not a verdict until it names your defect. Scope the run to the file that owns the
  assertion you are proving.
- **AN INSTRUMENT-REPAIR FINDING PROVES GREEN-BEFORE / RED-AFTER.** For *"this control is blind"*, the
  only honest proof is: with the defect planted, was the file **green on the pre-repair version**
  (`git show <base>:<file>`) and **red now**? Round 1's first plants for `A2-2`/`A3-14` were red on the
  pre-repair file — they tested a defect those files could always see.
- **A RED BASELINE IS A FAULT, NOT A VERDICT**, and so is a red **control**. Round 2 registered four
  guards whose `cmd` ran from the repo root with the wrong tsconfig: `@/` did not resolve, the process
  died before any assertion, and the harness reported *"it redded, but not for …"* — a verdict from a
  command that was red either way.
- **A GATE RESULT FROM BEFORE THE LAST COMMIT IS AN UNRUN GATE.** `R2-3`: `lint:rn` was **red at HEAD**
  while the fixer had recorded 52/52, because two later commits made seven proofs stale.

## Where round 2 is most likely to have gone wrong

⚠️ **Leads, not a checklist, and a stated mechanism is a hypothesis** — 2 of 4 have measured wrong here
while all four observations stood.

- ⛔ **`prove:guards`' `expect` NOW DEFAULTS TO THE ENTRY'S OWN `token`.** This is a change to the thing
  that certifies every other closure. **What does it do to the ~280 entries that still carry an explicit
  `expect`?** Is there an entry whose proof now passes for a different reason, or one that silently
  stopped being checked? Re-run a sample across passes 1–7, not just class 4's.
- ⛔ **`R2-1`'s fix derives a COUNT from a MONEY figure** — `Math.round(reserved / each)`. Attack the
  rounding: a balance that funds 2.5 charges, a `scheduledPaymentAmount` that does not divide the
  reserve, a final short installment, `each` larger than the balance.
- ⛔ **`R2-5` widened four sites to rate every debt by cadence.** The `apr` gate beside each stayed
  label-based **deliberately**. Check the pairing at all four: is there a debt shape where the payment is
  now cadence-rated and the interest treatment is wrong for it? Look hard at `one-time`, `per-paycheck`,
  and a debt with no `recurrence` at all.
- ⚠️ **`inWindowReaders.test.ts` is new and asserts against `effectiveMinimumInWindow` rather than
  literals.** That is deliberate — but a test that computes its own expectation from the producer agrees
  with the producer by construction. **Find the assertion that cannot fail.**
- **`A3-1`/`A3-2`/`A2-3`/`A2-4` are recorded as SHARING a sibling's red**, with a `proofNote` each. Verify
  the sharing is honest: does each entry's own assertion actually fail when reached? The fixer measured
  that it does — **re-measure it.**
- **`testCadenceIdentity`'s `chargesInWindow`** is the expected value the 56-pair matrix is asserted
  against, and it now also backs a projection identity. If it is wrong, the matrix agrees with it.

## Method — non-negotiable

- ⛔ **A plant must make an assertion FAIL, never THROW past it** — including failing to COMPILE. Round 2
  hit this: removing an unused import broke a plant that needed the symbol, so its unfix is two-part now.
- ⛔ **Verify every restore with `cmp`**, never `git diff`, and never `git checkout --`.
- ⚠️ **Plant in BYTE mode** (`'rb'`/`'wb'`) — this repo is CRLF.
- ⚠️ **`prove:guards` REFUSES to plant into a file with uncommitted changes.** Commit first; that
  pre-flight exists because an earlier round destroyed 83 bytes of real work.
- ⚠️ **Edit `finding-guards.json` with a JSON serializer, never by hand** — a hand-assembled edit left it
  unparseable, and anchoring on a bare finding id matches *mentions inside other entries' prose*.
- ⚠️ **A guard token must be in CODE and must stop before any `${`** — the shared scanner blanks
  interpolation spans, which cost three separate corrections across these rounds.
- ⚠️ **The staleness drain is TWO-PASS.** Three guards run `lint:finding-guards` as their own command, so
  while that gate is red their control is red and they measure nothing. Drain the others first.
- ⚠️ **Keep your probe files OUT of `apps/rn/`** — round 2's auditor put probes inside the RN tree and
  three of the red gates it saw were its own.
- **Write findings incrementally to disk.** Three auditors have died mid-round.
- ⛔ **No sub-agents.** Quote the worst-case spend before starting anything long.

## Output

`CLASS4-REAUDIT-3.md` here, probes in `class4-reaudit3-probes/`. Per finding: **consequence · `file:line` ·
the measurement · mechanism (marked HYPOTHESIS) · remedy (marked UNVERIFIED)**, severity
`blocker`/`major`/`minor`.

⚠️ **Record what you measured and found NOT to be a defect**, too — and note that a remedy can be wrong
even when the finding is right: round 2's `R2-6` proposed a gate that, implemented, fired on **90
legitimate entries**.

⛔ **Leave the tree clean.** `git status --short` at the end must show only this audit's own files.
