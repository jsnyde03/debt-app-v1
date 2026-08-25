# P6.8.9.7.10 — the re-verification brief

**What this is.** P6.8.9.7 built fixes for 33 audit findings. **A fix is a change, and changes are
unaudited — including the fixer's.** This step audits the *diff itself*: not "did it close the finding"
(P6.8.9.2 asked that), but **"is this code correct, and what did it break on the way in?"**

⛔ **This brief is the ONLY framing you get, and it deliberately does not tell you what was built, which
changes the author was confident about, or which ones worried them.** A verifier handed a worry-list stops
reading and starts confirming. The last verification pass's entire value was that nobody was told.

⛔ **DO NOT read as evidence:** `docs/DEBT_ELEVATION_PLAN.md`'s *▶ BUILDING NOW* section, or
`docs/DEBT_ELEVATION_LOG.md`'s `P6.8.9.7.*` entries. Those are the author's own account of the work you are
checking. **If you consult them anyway and the prose disagrees with the code, the code wins and the
disagreement is itself a finding.**

⚠️ **Why this is not ceremony.** In the session that produced this diff, six defects were introduced by the
fixes. Every one was caught by an instrument that already existed. **None was caught by re-reading the
diff.** Reading harder is not the method — the questions below are.

---

## Your subject

Run this and read every hunk:

```bash
git -C /c/Users/Jason/debt-app-v1 diff 8e4540a..3dc3c22 -- <your files>
```

Then **read the surrounding code**, not just the hunk. A change is judged in its site, not in isolation:
the hunk cannot show you what the function did before, what its callers assume, or what the file's own
comments already said about this exact problem.

---

## The seven questions, in this order

### 1. Does the change preserve what the site did BEFORE?
A change fixes the property that was wrong. It must preserve every property that was **right**, and nothing
enumerates those — they are found only by reading the site. For each hunk: **what else was this code doing,
and does it still do it?**

### 2. Is it correct in the environments this app actually ships to?
Not "does it work on my machine." The binding cases, all of which have bitten this repo:
- **Timezone** — the storefronts include Sydney and Auckland, **east of UTC**. Any UTC round-trip on a
  local date is wrong there. There is a gate for this class; ask whether it reaches this code.
- **Locale / number format** — thousands separators, `19.99%`, decimal commas.
- **Platform** — `apps/rn` runs on **iOS native and react-native-web**, and they diverge (props RNW drops,
  `fontScale` pinned to 1, `announceForAccessibility`). A change proven on one is unproven on the other.
- **Theme** — light and dark are both shipping states.
- **Shipping build vs QA build** — `QA_TOOLS` is flipped **false** at P6.17. Code reachable only from a
  `qaEnabled()` probe reaches **nobody** in the shipped app.

### 3. Does it honour the contract of every library and helper it calls?
Read the API's own requirements, not the shape of the call. Sequential-vs-parallel, ordering guarantees,
what a rejection does, whether a returned handle must be awaited or released. **A wrapper that swallows a
rejection in a `catch` turns a hard failure into a silent hang.**

### 4. Does it put a side effect where this file says side effects don't go?
⭐ **Grep the file's own comments before deciding a pattern is fine.** This codebase repeatedly writes down
the reason a thing was moved, forbidden, or shaped a particular way — and the fastest defects to find are
the ones where a change walks straight back into a documented trap. Render bodies, effects, module scope.

### 5. Would each NEW test have failed on the defect it claims to pin?
A green test is not proof. **Name the assertion and state what it measures.** A proxy for the subject is
not the subject — measuring text *content* through a line clamp, or *placement* as a stand-in for
*overlap*, passes with the defect present. `"No test proves it"` is a valid and important answer.

### 6. Does each NEW or CHANGED gate actually reach its class?
- What exactly does it scan — string literals? AST nodes? file extensions? **Name the files it walks and
  the ones it silently cannot.** A TS AST walker sees zero Swift files.
- **Would it go red?** If it only prints a hole, it is not a gate.
- Is it registered in the aggregate run, or does it only fire when invoked by hand?

### 7. What did this change make POSSIBLE that nothing checks?
The residual question. New overlays intercept touches. New scroll or reveal behaviour moves controls under
a finger. A new field widens a type that something else switches on. **State the newly-possible situation
and whether anything in the repo would notice it.**

---

## Verdicts — use exactly these, one per hunk-group

| verdict | meaning |
|---|---|
| `SOUND` | correct, prior properties preserved, and something would catch a regression |
| `SOUND-UNPINNED` | correct, but **nothing would catch a regression**. Say what test is missing |
| `DEFECT` | the change is wrong. **State the input or environment that breaks it** |
| `REGRESSION` | something the site did before is now gone |
| `WEAK-TEST` | the new test would pass with its own defect present. Say what it measures vs. what it claims |
| `DEAD` | the change reaches nobody in a shipping build |
| `UNREACHABLE-GATE` | a gate that cannot walk the files it exists to police, or cannot go red |

## Rules

- ⛔ **Do not spawn sub-agents.** Do the reading yourself.
- ⛔ **Do not edit, run, or fix any source file.** You are reading. If something is wrong, say so.
- ⛔ **Write your file incrementally — append each hunk-group as you finish it**, never in one final write.
  A verifier that dies partway must leave usable verdicts behind.
- ⛔ **Quote a path and a line for every claim.** `file.ts:120`. A verdict with no citation is an opinion.
- ⚠️ **Report what you could not determine.** "I could not tell whether X, because Y is only observable on
  device" is a real result and belongs in the file.
- ⚠️ **Do not grade on effort or intent.** A thoughtful change with a timezone bug is a `DEFECT`.

## Where things are

| | |
|---|---|
| **the app** | `apps/rn/src/`, `packages/core/` |
| **the gates** | `scripts/`, registered via `apps/rn/package.json` / root `package.json` scripts |
| **finding text** (what the change was aimed at) | `docs/audits/2026-08-21-p6.8-finish/SYNTHESIS.md` and `slices/` |
| **the previous verification** | `docs/audits/2026-08-24-p6.8.9-verification/` — ⚠️ read the *findings*, not its verdicts on fixes you are now auditing |
| **the frames** | `apps/rn/capture-ref/p6.8/<viewport>/<theme>/`, a11y trees in `capture-ref/p6.8-a11y/` |
