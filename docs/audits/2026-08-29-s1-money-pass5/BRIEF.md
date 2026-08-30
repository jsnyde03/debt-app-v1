# S1 · money · **PASS 5** — the brief

**Surface:** S1 (money, goals, plan cards) + S0's instruments, per the LOOP rule.
**Pin:** `e65f9c7` (pass 4's own tree) → HEAD.
**Route:** generated, not typed — `scripts/audit-route.ts`. **393 files · 0 unrouted · 0 owed.**

| lane | files | what it holds |
|---|---|---|
| **A** | 108 | the money engine, and the specs that claim to guard it |
| **B** | 113 | store, storage, formatting — how the number is spelled, dated and remembered |
| **C** | 122 | the screens a user reads money off — where a true number becomes a false sentence |
| **D** | 50 | the instruments — the checking code the fixing itself wrote |

Your manifest is `ROUTING-<lane>.txt`. Every file's origin is in `ROUTING-ORIGINS.tsv`.
**Read `RESUME-PROTOCOL.md` in this directory before you start.**

---

## ⛔ What is different about this round

**207 `neighbour` and 49 `s0-first-look` files are in a lane for the FIRST TIME.** Until this round the
route was built entirely from predicates on *changed*, so:

- a file that did not move could not be routed at all — which is how a **two-producer disagreement** stayed
  invisible: the fix corrects one producer, the route emits one producer, and nothing puts the other in
  front of a reader. `A-F4` is that, measured: `buildPayoffTrajectory.ts` routed to nobody while its pair
  was being corrected.
- S0's never-swept files were emitted by no round at all.

⚠️ **So expect most of what you find to be `first-look` or `neighbour`.** Under [D69] those do **not**
restart the convergence count — **and exempt from the count is NOT exempt from the fix.**

---

## The five reading rules, and every one was paid for

1. ⛔ **A REMEDY IS A HYPOTHESIS. A PREMISE IS NOT.** Measured across pass 4's fixing: **more than half the
   stated remedies would not have closed their finding, and five would have INTRODUCED one** — while
   essentially every premise reproduced exactly. `C4-2`'s remedy deleted a debt from the screen; `F-B3`'s
   failed **open**; `C4-5`'s kept the caption inside the offer, which *is* the defect. **Write what you
   measured. If you propose a remedy, say it is unverified.**

2. ⛔ **JUDGE THE CONDITION THE CONSUMER EVALUATES, NEVER THE EXAMPLE YOU CITED.** `C4-3`: a ledger built to
   make every liveness re-derivation visible read `balance > 0` and was blind to `balance <= 0` — the
   spelling the blocker beside it was written in. Ten sites were invisible. **An enumeration of spellings
   has failed in this repo six times.**

3. ⛔ **ASK WHICH MEMBER OF ITS CLASS A TEST PICKED.** `C4-5`: the fixture was *"a $800 pot beside a $25
   pot"* — the one arity where a fallback exists, so the offer object exists, so the caption has something
   to be a field of. The member with no fallback was never run and is the member that fails. `A-F2`: *"no
   surviving string parses to NaN"* asserted about **one** string.

4. ⛔ **A CHECK THAT CANNOT FAIL READS EXACTLY LIKE A CHECK.** Found in every pass so far, including inside
   the instruments written to prevent it: caps derived from the lists they cap; three of five set-identity
   assertions that no tree state can reach; a `die()` precedence made unreachable. **Reading has never once
   found this class. Planting has found it every time.**

5. ⛔ **AND A PLANT CANNOT SEE THE GREEN STATE.** New this round, measured three times: an over-broad
   locator that only becomes a strict-mode violation **when the fix works**, and an absence assertion that
   was **vacuous by timing** — the read raced the write and passed. ⚡ Every prior lesson said planting
   finds what reading cannot; **this is the converse.** Run a changed spec GREEN, and re-run each plant
   with the assertion above it relaxed.

---

## ⚠️ Rules about your own report

- **Count the ids, never the list.** `F-B5` was a real pass-4 finding that appeared in **no** sub-step list
  on the plan; it surfaced by enumerating headings. Site counts in this project have come in short on
  **eight consecutive items** — treat any count you write as a **lower bound**, and prefer *"what would
  make completeness checkable?"* over *"is this list complete?"*
- **Report split by ORIGIN.** A flat total hides the app improving while the instruments regress — eleven
  instrument defects went in across two fixing sessions while the app's count fell.
- **A comment is a carried premise and decays like a carried number.** Quote it only after checking it.
  Pass 4 found a docblock stating a mechanism the code did not have (`F-B1`) and one saying *"REQUIRED"*
  beside a `?` in the type (`A-F1`).
- **A red is not evidence until you know which claim produced it.** And read a command's own `$?` — a
  pipeline reports the last stage, which has lied about a failed run **ten times** here.

---

## What "already closed" looks like, because four of pass 4's findings were

`D4-10` `D4-1` `D4-4` `C4-4` each named a defect that a later sub-step had already fixed; two would have
been "fixed" a second time. **Before writing a finding, check whether the code still does what you think
it does** — and if a registered guard is your subject, run `npm run prove:guards -- --id=<ID>` rather than
reading its token.

## Severity

- `blocker` — the app states something false about the user's money, or destroys/misrecords it.
- `major` — an instrument reports green while doing less than it claims; or a guard survives its own un-fix.
- `minor` — true but imprecise; a stale premise; grammar on a line every user meets.

**Every finding needs: the user-facing consequence · the file and line · the measurement (printed values,
one store, one variable) · the mechanism, stated as a hypothesis · a remedy, marked verified or not.**
