# Class 4 — re-audit **4**: the brief

> ⛔ **You are a FRESH auditor.** The session that wrote round 3's fixes is not writing this, because a
> fixer re-reads its own premises instead of the code. That is `[D79]` step **b**, and it has paid for
> itself in all three rounds: round 1's blocker was the fixer's own new guard, round 2's was a regression
> round 1's fix introduced, and round 3's fixer put **three defects into its own work plus two collateral
> faults in the ledger** — every one caught by an instrument, none by reading.

## What you are auditing

**Round 3** — the commits from `1cebd764` to the head of `v1.7-dev`. Round 3 closed `R3-1`–`R3-4` in
[`CLASS4-REAUDIT-3.md`](CLASS4-REAUDIT-3.md).

⛔ **DERIVE THE FIX SET FROM THE DIFF, NOT FROM THE FINDING LIST.**

```
git diff --stat 1cebd764..HEAD -- apps packages scripts
git log --oneline 1cebd764..HEAD
```

**11 files, +452/−66**, over 14 commits. Three of them — `check-finding-guards.ts`, `prove-guards.ts`,
`test-gate-plants.ts` — are **the harness that certifies every other finding closed**. Weight accordingly.

**Cumulative scope — `[D79]` step c.** Everything already closed stays under audit: class 1's **95**
*(11 + `R`15 + `N-`11 + `T`14 + `U`16 + `V`12 + `W`15 + **`W9b`**)* + class 4's 11 + round 1's 8 + round
2's 6 + round 3's 4 = **124**.

⚠️ **Derive that count two ways and treat a disagreement as a finding.** Round 3 did, and reported the
agreement was **weaker than it looked**: both derivations depend on the out-of-band fact that `W9b` exists
only in `DEBT_ELEVATION_LOG.md`, and a file-driven enumeration of this directory returns **119** and
reports no error. ⛔ **A heading-shaped enumeration returns ZERO for four of the class-1 rounds**, which
head their findings differently, and fails silently.

## The two questions, and nothing else

1. **Is each closed?** Not *"is there a fix"* — is the defect refused, **by planting**, red for the reason
   that names it.
2. **What did round 3's fixes break?** Interaction with anything already closed: a shared file, a shared
   import, a shared producer.

## ⛔ Method rules the first three rounds paid for. Not optional.

- **A PLANT ONLY EXERCISES A SUITE UP TO ITS FIRST RED.** Read *which* assertion redded; a red is not a
  verdict until it names your defect. ⭐ Round 3's technique for this, and it is worth reusing: replace the
  suite's `assert` throw with a non-throwing `WOULD-FAIL` log so **every** row is evaluated, then restore.
  It is how round 3 measured that 8 rows red where the old file had 0.
- **A RED BASELINE IS A FAULT, NOT A VERDICT**, and so is a red **control**.
- **A GATE RESULT FROM BEFORE THE LAST COMMIT IS AN UNRUN GATE.** Round 3 committed this failure by hand:
  it ran `test:app` after adding a guard block, never re-ran typecheck, and the boundary caught an
  unnarrowed union access.
- ⛔ **VERIFY WITH THE INSTRUMENT THAT GATES, NOT ONE THAT MERELY AGREES WITH YOU.** Round 3 checked a
  guard token with `grep -F` and it passed; `lint:finding-guards` could not find that token at all, because
  **the shared scanner blanks interpolation spans and `grep` does not**. The token had been broken since
  registration.

## Where round 3 is most likely to have gone wrong

⚠️ **Leads, not a checklist, and a stated mechanism is a hypothesis** — measured wrong repeatedly here.

- ⛔ **`formatWhole(best.reserved)` STATES A TOTAL THAT MAY NOT BE THE RESERVE.** The heads-up now reads
  *"N payments totalling about $X"*, and every fixture round 3 used is a **whole-dollar** balance. What does
  the sentence say when the reserve is `$75.49`, or when `effectiveMinimumInWindow`'s `roundMoney` leaves
  cents? **The claim it makes is now an exact-money claim, and it is formatted by a WHOLE-dollar
  formatter.** This is the highest-value lead in this brief.
- ⛔ **`Math.ceil(reserved / each)` — attack the edges the round-3 table did not sample.** A fractional
  `each`; a `reserved` that is a hair over a multiple (floating point: `150.00000000000003 / 50`); `each`
  larger than the balance; a **one-time** BNPL, where `isOneTimeBnplLump` short-circuits elsewhere.
- ⛔ **THE BORROW REFUSAL IS A NEW GATE OVER 300 ENTRIES.** It reds when an `expect` is not in its own
  token **and is in another entry's**. Ask what it CANNOT see: a borrow where the sibling's token was
  *edited* after the borrow was written; a `proofNote` that is present but says nothing about borrowing
  (the exemption checks only that it is non-empty); an `expect` that is a substring of **many** entries by
  accident because it is short. **Round 2's remedy for this fired on 90 legitimate entries and round 3's
  first two candidate forms on 84 and 30 — measure the fire-count of anything you propose.**
- ⚠️ **The `token`/`expect` refusal was NARROWED mid-round after it broke the selftest, and the narrowed
  form is UNGUARDED** — round 3 says so out loud. Is the narrowed invariant actually the right one? Is
  there still a reachable path where `verdict()` runs with no reason check?
- ⚠️ **`cyclesPerMonth` is threaded from `payCyclesPerMonth(next.paycheck.payCycle)` at ONE production
  site, and all 18 test call sites pass a literal `1`.** A test suite that passes the same constant
  everywhere agrees with a monthly assumption by construction. **Is the production value correct at that
  seam, and is any of it asserted anywhere but the four rows round 3 added?**
- ⚠️ **`inWindowReaders.test.ts`'s literal anchors are argued clock-safe from arithmetic** — `[D, D+28]`
  with the charge at `D+3` giving four charges on every day of the year. **Walk a year and check**, and
  note that `day()` calls `new Date()` three separate times.
- ⚠️ **`R2-1-CAP`'s un-fix was re-derived by the fixer and re-run.** Verify the re-derived plant restores
  the *original* defect and not a neighbouring one.

## Method — non-negotiable

- ⛔ **A plant must make an assertion FAIL, never THROW past it** — including failing to COMPILE.
- ⛔ **Verify every restore with `cmp`**, never `git diff`, and never `git checkout --`.
- ⚠️ **Plant in BYTE mode** (`'rb'`/`'wb'`) — this repo is CRLF.
- ⚠️ **`prove:guards` REFUSES to plant into a file with uncommitted changes.** Commit first.
- ⚠️ **Edit `finding-guards.json` with a JSON serializer, never by hand.** A `json.dumps(indent=2,
  ensure_ascii=False)` round-trip is **byte-identical** on this file — round 3 measured it.
- ⚠️ **A guard token must be in CODE and must stop before any `${`.** Four corrections so far.
- ⚠️ **THE STALENESS DRAIN IS TWO-PASS, and round 3 hit the harder form.** Proofs whose `run` reads the
  ledger have a red control while the ledger is red; drain the others first. ⛔ And `prove:guards`' drain
  exemption **cannot see** a control one harness removed (`test:gate-plants`), so a proof that runs it
  needs the ledger genuinely green. Filed to `.12.6.9`; do not "fix" it here.
- ⚠️ **Keep your probe files OUT of `apps/rn/`.** Use `class4-reaudit4-probes/`.
- **Write findings incrementally to disk.** Several auditors have died mid-round.
- ⛔ **No sub-agents.** Quote the worst-case spend before starting anything long.

## Output

`CLASS4-REAUDIT-4.md` here, probes in `class4-reaudit4-probes/`. Per finding: **consequence · `file:line` ·
the measurement · mechanism (marked HYPOTHESIS) · remedy (marked UNVERIFIED)**, severity
`blocker`/`major`/`minor`.

⚠️ **Record what you measured and found NOT to be a defect**, too. ⛔ **And be careful with remedies: TWO
of round 3's four would have introduced a defect** — `R3-2`'s proposed `Math.floor` was **strictly worse
than the bug**, going silent over a real reserve. A finding can be right while its fix is wrong.

⛔ **Leave the tree clean.** `git status --short` at the end must show only this audit's own files.
