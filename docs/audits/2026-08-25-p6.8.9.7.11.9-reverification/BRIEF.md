# P6.8.9.7.11.9 — the second re-verification brief

**What this is.** P6.8.9.7.11 fixed the 13 defects that P6.8.9.7.10 found in the P6.8.9.7 build. **That
makes this diff a fix of a fix**, written by the same author both times. `.7.10` measured the rate at
**13 defects per 1,708 lines**, every one introduced by work that was itself correcting something real.

⛔ **This brief is the ONLY framing you get. It does not tell you what was built, which changes the author
was confident about, or which ones worried them.** A verifier handed a worry-list stops reading and starts
confirming.

⛔ **DO NOT read as evidence:** `docs/DEBT_ELEVATION_PLAN.md`'s *▶ BUILDING NOW* section, or
`docs/DEBT_ELEVATION_LOG.md`'s `P6.8.9.7.11.*` entries. Those are the author's own account of the work you
are checking. **If the prose disagrees with the code, the code wins and the disagreement is a finding.**

⚠️ **The single most productive question in the last pass**, which found more than any other: *does the
comment beside this line actually describe what the line does?* Six docblocks asserted a property the code
beside them did not deliver. **A comment stating a guarantee is a claim to verify, never evidence.**

---

## Your subject

```bash
git -C /c/Users/Jason/debt-app-v1 diff <BASE>..HEAD -- <your files>
```

The base commit is in your task prompt. Read the **surrounding code**, not just the hunk: a change is
judged in its site, and the hunk cannot show you what the function did before or what its callers assume.

---

## The seven questions, in this order

### 1. Does the change preserve what the site did BEFORE?
A change fixes what was wrong and must preserve everything that was **right** — and nothing enumerates
those. For each hunk: **what else was this code doing, and does it still do it?** A guard that over-matches
looks identical to one that matches correctly, in every green run.

### 2. Is it correct in the environments this app actually ships to?
- **Timezone** — the storefronts include Sydney and Auckland, **east of UTC**. Any UTC round-trip on a
  local date is wrong there.
- **Locale / number format** — thousands separators, percent signs, decimal commas.
- **Platform** — `apps/rn` runs on **iOS native and react-native-web**, and they diverge (props RNW drops,
  `fontScale` pinned to 1, `announceForAccessibility` an empty body, `pointer-events` compiled differently).
  A change proven on one is unproven on the other.
- **Theme** — light and dark are both shipping states.
- **Shipping build vs QA build** — `QA_TOOLS` is flipped **false** at P6.17, and `__DEV__` is false in a
  production web export. Code reachable only from a dev-guarded sink reaches **nobody**.

### 3. Does it honour the contract of every library and helper it calls?
Read the API's own requirements. Sequential-vs-parallel, what a rejection does, what a matcher actually
asserts. ⚠️ **`toBeVisible()` is not "on screen"** and **`elementFromPoint` returns `null` outside the
viewport** — both bit this diff.

### 4. Does it put a side effect where this file says side effects don't go?
⭐ **Grep the file's own comments before deciding a pattern is fine.** This codebase repeatedly writes down
why a thing was moved, forbidden or shaped a particular way, and the fastest defects to find are where a
change walks back into a documented trap. In the last pass a fix used mount semantics in a tab that never
unmounts — three directories from the file explaining that exact confusion.

### 5. Would each NEW or CHANGED assertion fail on the defect it claims to pin?
**Name the assertion and state what it measures.**
- ⛔ **Is it VACUOUS?** An absence assertion can be true because the thing is absent *for an unrelated
  reason* — off-viewport, not yet rendered, a selector that matches nothing. **Does a positive control
  prove the subject was reachable at all?**
- Is it a **proxy**? Measuring placement as a stand-in for overlap, or a value as a stand-in for a
  behaviour, passes with the defect present.
- Would the **naive over-fix** also pass it — the obvious minimal change someone would make instead?

### 6. Does each NEW or CHANGED gate actually reach its class?
Name the files it walks and the ones it silently cannot. **Would it go red?** Is it registered in the
aggregate run? A gate that only prints is not a gate — and a gate that tells the reader to do something it
does not honour is worse than one that says nothing.

### 7. What did this change make POSSIBLE that nothing checks?
New guards suppress states. New effects fire in new orders. A field made optional stops being demanded.
**State the newly-possible situation and whether anything in the repo would notice it.**

---

## Verdicts — use exactly these, one per hunk-group

| verdict | meaning |
|---|---|
| `SOUND` | correct, prior properties preserved, and something would catch a regression |
| `SOUND-UNPINNED` | correct, but **nothing would catch a regression**. Say what test is missing |
| `DEFECT` | the change is wrong. **State the input or environment that breaks it** |
| `REGRESSION` | something the site did before is now gone |
| `WEAK-TEST` | the new assertion would pass with its own defect present, or passes vacuously |
| `DEAD` | the change reaches nobody in a shipping build |
| `UNREACHABLE-GATE` | a gate that cannot walk the files it polices, or cannot go red |

## Rules

- ⛔ **Do not spawn sub-agents.** Do the reading yourself.
- ⛔ **Do not edit, run, or fix any source file.** Read-only shell (git diff, grep, cat) is fine; do not
  execute gates or suites.
- ⛔ **Write your file incrementally — append each hunk-group as you finish it**, never in one final write.
- ⛔ **Quote a path and a line for every claim.** ⚠️ **Verify the path exists before citing it** — the last
  pass produced a confident `path:line` for a file that was not there, while its observation was correct.
- ⚠️ **Report what you could not determine.** *"Only observable on device"* is a real result.
- ⚠️ **Do not grade on effort.** A careful change with a timezone bug is a `DEFECT`.

## Where things are

| | |
|---|---|
| **the app** | `apps/rn/src/`, `packages/core/` |
| **the gates** | `scripts/`, registered via root `package.json` (`lint:rn`) |
| **the first re-verification** | `docs/audits/2026-08-24-p6.8.9.7.10-reverification/` — ⚠️ read `BRIEF.md` for method; its verdicts are about the code you are now re-checking |
| **the frames** | `apps/rn/capture-ref/p6.8/<viewport>/<theme>/`, a11y trees in `capture-ref/p6.8-a11y/` |
