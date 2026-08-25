# P6.8.9.7.11.10 — verify the fixes, find what else is major+, and RATE IT

**Two jobs, in this order.** Do not merge them; they are reported separately.

1. **Did each fix actually close its finding?** The fixes in `4877d90..01fc7ec` were written to close
   defects found by an audit of `3dc3c22..4877d90`. Check the code, not the claim.
2. **Is any other blocker- or major-severity defect present in the surfaces this work touched?** Not a
   diff read — a **sweep of the surface**, including code neither round changed.

⛔ **Every finding carries a SEVERITY, and the severity is the deliverable.** 🎯 is deciding what ships
from these ratings, so an inflated one costs real time and a deflated one ships a defect. Rate the defect
as it would reach a user, not by how interesting it is to explain.

---

## The severity scale — use exactly these words

| severity | means |
|---|---|
| **blocker** | It ships broken. Data loss or corruption · a wrong number about the user's money · a crash or a permanently stuck screen · a statement to the user that is false about their own money or data · a once-ever moment lost forever. |
| **major** | A real user can hit it and the product is meaningfully worse: a feature that does not work, a screen that misleads, an irreversible action with no guard — **or a gate or test that cannot catch the class it exists for**, because that is how the next blocker ships. |
| **minor** | Correct behaviour, imperfect craft: prose, a stale `path:line`, a cosmetic misalignment, a comment that describes something slightly wrong. **No user-visible consequence and no instrument blinded.** |

⚠️ **Two calibrations, because the last two rounds got these wrong in opposite directions:**
- **A wrong comment is `minor`** — unless it is load-bearing for a future maintainer's safety decision, or
  it is a claim shown **to the user**, which makes it `major` or `blocker` by what it says.
- **A test that passes with its own defect present is `major`, not `minor`.** It is the reason a defect
  survives, and both prior rounds found blockers behind exactly that.

⛔ **State the user-facing consequence in one sentence for every `blocker` and `major`.** If you cannot
write that sentence, the finding is `minor` — that test is the point of this brief.

---

## Job 1 — verify the fixes

For each fix, three questions:
1. **Is the original finding's behaviour actually gone?** Read the code that produces it.
2. **Did the fix preserve what the site did right?** ⚡ **Both prior rounds' worst defects were
   over-matching fixes** — a repair that also destroyed correctly-read data, and an attribution that also
   silenced a real loss. **Ask what the change now does to inputs the finding never mentioned.**
3. **Would anything catch it un-fixing?** Name the test, and say whether it would fail on the *original*
   defect — not merely whether it exists.

Verdicts for job 1: `CLOSED` · `CLOSED-UNPINNED` · `PARTIAL` · `OPEN` · `WRONG-REMEDY` · `NOT-A-DEFECT`.
Each `PARTIAL`/`OPEN`/`WRONG-REMEDY` also carries a **severity**.

## Job 2 — the major+ sweep

**Look for defects nobody has filed**, in the surfaces this work touched — including code that neither
round changed. `minor` findings are **not wanted here**: report only `blocker` and `major`. If a sweep
turns up nothing at that bar, **say so plainly** — "no blocker or major found in <surface>" is a real and
valuable result, and padding it with `minor` items is what makes a report unreadable.

Ask, of each surface:
- What is the **worst thing** a user can end up believing or losing here?
- What input, timezone, locale, platform, or ordering has nobody tried? (Storefronts include **Sydney and
  Auckland, east of UTC**. `apps/rn` runs on iOS native **and** react-native-web, and they diverge.)
- What is **irreversible**, and what guards it?
- Which claim made to the user could be **false**?
- `QA_TOOLS` is flipped **false** at P6.17 and `__DEV__` is false in a production web export — what does
  that make unreachable?

---

## Rules

- ⛔ **Do not spawn sub-agents.** Do the reading yourself.
- ⛔ **Do not edit, run, or fix any source file.** Read-only shell is fine; do not execute gates or suites.
- ⛔ **Write your file incrementally** — append each finding as you finish it.
- ⛔ **Quote a path and a line for every claim, and verify the path exists before citing it.** A prior round
  produced a confident citation for a file that was not there.
- ⚠️ **Report what you could not determine.** "Only observable on device" is a real result.
- ⚠️ **Do not grade on effort, and do not inflate to seem thorough.** A report of two blockers and nothing
  else is more useful than twenty findings that need triage.

## Where things are

| | |
|---|---|
| **the fixes to verify** | `git diff 4877d90..01fc7ec -- <your files>` |
| **what they were fixing** | `docs/audits/2026-08-25-p6.8.9.7.11.9-reverification/` — the finding text only |
| **the app** | `apps/rn/src/`, `packages/core/` |
| **the gates** | `scripts/`, registered via root `package.json` (`lint:rn`) |
