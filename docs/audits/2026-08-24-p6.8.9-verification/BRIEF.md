# P6.8.9.2 — the verification brief

**What this is.** Every fix built in P6.8.7 clusters **a–g** was written by the same author that read the
finding. This step re-checks them **independently**: the verifier did not build the fix and does not
inherit the belief that it worked.

⛔ **This brief is the ONLY framing a verifier gets. It deliberately does not say what was built** — a
verifier told the answer is checking a claim, not the code.

---

## The three questions, in this order

### 1. Is the finding's OBSERVATION actually closed in the current tree?
Not *"is there a commit"*, not *"does the log say so"* — read the code the finding names and decide
whether the described behaviour still happens. If the finding names a user-visible behaviour, name the
line that now produces the correct one.

### 2. What did the site ALSO do, and does it still do it?
⛔ **This is the question the whole step exists for.** A finding names the property that is **wrong**. A
fix must preserve every property that was **right**, and no lens enumerates those — so they are found only
by looking at the site.

Measured in cluster f, three times:
- **V1-5** named theme parity; the binding case was a control **on a card**, where the fill *is* the ground.
- **A1-7** named *"it is in the a11y tree"*; the first fix broke **operability**, the second broke
  **focusability**. Three properties, one named.
- **V2-6** named a constant; the test asserted against a **proxy** and passed with the defect planted.

For each id: state what the site did before, which of those properties the fix could have broken, and
**which test proves it did not.** *"No test proves it"* is a valid and important answer.

### 3. Was the finding's implied REMEDY right?
⛔ **A finding can be right about the defect and wrong about the fix.** Six measured so far —
**B3 · B2 · M3-5 · C5 · C7 · P1-3.** C7's *"so show both"* would have drawn two lines separated by <0.1%
of chart height. P1-3's *"neither curve draws"* was the right defect with the wrong description.

⭐ **A lens usually knows which of its own claims is soft, and says so. Read that part of the slice.**

---

## Verdicts — use exactly these

| verdict | meaning |
|---|---|
| `CLOSED` | observation gone, preserved properties intact, and a test pins it |
| `CLOSED-UNPINNED` | observation gone, but **nothing would catch a regression**. Say what test is missing |
| `PARTIAL` | the named property is fixed and another property regressed, or only some sites were reached |
| `OPEN` | the observation still reproduces |
| `WRONG-REMEDY` | the defect is real, the fix addressed something else — say what would actually close it |
| `NOT-A-DEFECT` | the finding's premise is false against the current code |

## Rules

- ⛔ **Do not spawn sub-agents.** Do the reading yourself.
- ⛔ **Write your file incrementally — append each id as you finish it**, never in one final write. A
  verifier that dies at id 6 of 8 must leave 5 usable verdicts behind.
- ⛔ **Quote a line and a path for every claim.** `file.ts:120` — a verdict with no citation is an opinion.
- ⛔ **Do not edit any source file.** You are reading. If a fix is wrong, say so; do not fix it.
- ⚠️ **A green test is not proof.** Ask *"would this test have failed on the original defect?"* A proxy for
  the subject is not the subject.
- ⚠️ If the log's account and the code disagree, **the code wins** and that disagreement is itself a finding.

## Where things are

| | |
|---|---|
| **B\* / C\* / A4 finding text** | `docs/audits/2026-08-21-p6.8-finish/SYNTHESIS.md` (the decision document) |
| **lens findings** (`M*` `V*` `A1-*` `P1-*` `W1-*` `O1-*` `L1-*`) | `docs/audits/2026-08-21-p6.8-finish/slices/` |
| **refutations** | `docs/audits/2026-08-21-p6.8-finish/refutations/` |
| **what was built** | `docs/DEBT_ELEVATION_LOG.md` (19k lines — grep by id) |
| **the app** | `apps/rn/src/`, `packages/core/` |
| **the frames** | `apps/rn/capture-ref/p6.8/<viewport>/<theme>/` — ⚠️ **re-shot 2026-08-24 at P6.8.9.1**; a11y trees in `capture-ref/p6.8-a11y/` |
