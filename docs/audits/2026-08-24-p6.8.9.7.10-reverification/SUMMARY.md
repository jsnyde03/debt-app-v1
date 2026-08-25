# P6.8.9.7.10 — the independent re-verification of the `.7` build

**Method.** Six verifiers, one per cluster of the `8e4540a..3dc3c22` diff (42 files, 1,708 insertions).
None built the code it read. **None was told what had been built, which changes the author was confident
about, or where they were unsure** — [`BRIEF.md`](BRIEF.md)'s seven questions were the only framing, and
they name *classes* (timezone/locale/platform/theme · library contracts · documented traps · proxy tests ·
gate reach · what the change newly makes possible), never sites. Read-only, no sub-agents, incremental
appends, `path:line` on every claim. Per-cluster detail is in the `A`–`F` files beside this one; the
mechanisms I re-measured myself are in [`MEASURED.md`](MEASURED.md).

## The result

| verdict | n |
|---|---|
| `SOUND` | 23 |
| `SOUND-UNPINNED` | 12 |
| **`DEFECT`** | **13** |
| `WEAK-TEST` | 5 |
| `REGRESSION` | 3 *(1 behavioural, 2 documentation)* |
| `DEAD` / `UNREACHABLE-GATE` | 0 |

⚡ **The headline.** P6.8.9.2 audited the same team's fixes against the *findings* and returned **zero
`OPEN`** — every remedy was aimed at something true. Auditing the same work as **code** returns **13
defects**. The fixes were well-aimed and defectively built, and those are separate properties that a
finding-shaped verification structurally cannot separate.

⛔ **Six defects were caught by instruments during the build. Thirteen more were not.** The step exists
because a fix is a change and changes are unaudited; the ratio is the argument.

## ⭐ Two convergences — the strongest signal in the pass

Blind verifiers reaching one defect from opposite directions is worth more than any single verdict.

1. **The goal pace, found twice.** **C** reached `priorityPerPaycheck → 0` from the persistence test;
   **B** reached the identical line from the user-facing repairs card. **It is the only finding here that
   touches a user's money.**
2. **The reveal seam, found twice.** **E** found the stood-down root layer still calling `requestReveal`;
   **F** found the backgrounded Progress screen still answering as the registered host. One global scroller
   slot plus tabs that never unmount — either alone reads as a detail, together they are the defect.

## What the six questions actually caught

| question | what it found |
|---|---|
| **1 · preserved properties** | the `/history` regression — the fix inverted the gap instead of closing it |
| **2 · shipping environments** | the production-web sink; `fontScale` pinned on RNW; `__DEV__` false |
| **3 · library contracts** | *(clean — the sequential `LoadSkiaWeb` → `getComponent()` order was verified against the installed library, not the comment)* |
| **4 · documented traps** | ⭐ **the richest** — three changes walked back into a trap the repo had written down, once in the very file the fix belongs to |
| **5 · would the test have failed** | 5 `WEAK-TEST`, including one that admits by name the value that reproduces the harm |
| **6 · gate reach** | 4 of the 5 gates touched cannot fully reach the class they police |
| **7 · newly possible** | the tap-eating card, the invisible scroll, the once-per-launch announcement |

## ⛔ The result to carry

⚡ **A fix's comment is the least reliable line in the diff.** Six times a docblock asserted the property
the code beside it does not deliver — *"THE MEASURED HEIGHT, NOT THE 140"* over a line that reads the
guess; *"Deregister on unmount"* in a tab that never unmounts; *"`states: ['empty']` still pins the empty
branch"* fifteen lines above a spread that cannot; *"REPORTED rather than swallowed"* over a dev-only sink.
**The author writes the intent down at the moment of greatest conviction, and that is precisely when the
control flow is least checked.** A comment stating a guarantee is a claim to verify, not evidence.

⚠️ **And a verifier's citation is a claim too.** `GoalSheet.tsx:49` does not exist; *"`inPhrases = true`
forever"* is bounded by the next `]`; the Swift latch is **latent**, not live. Three of the mechanisms I
re-measured were overstated while their observations held — [[measure-agent-mechanisms]], for the sixth and
seventh time in this project.
