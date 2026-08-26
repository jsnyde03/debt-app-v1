# S0 re-verification — PASS 4. The brief.

**Pin:** `613adf2` · branch `v1.7-dev` · ships as `2.0.0`. **Do not push. Do not edit source.**
**Repo:** `git -C /c/Users/Jason/debt-app-v1 …` — ⚠️ **the cwd drifts between calls; always pass `-C`,
and never use a relative pathspec.** *(A `git log -- scripts/x.ts` run from a drifted cwd returns EMPTY
and looks exactly like "this file has no history." That happened while writing this brief.)*

**What pass 4 is.** S0 (the instruments) converges on **two consecutive clean passes** at the
blocker/major bar. **Pass 3 was the first.** This is the second. Pass 3's report is
`S0-REVERIFY-3.md` in this folder; passes 1 and 2 are beside it.

⛔ **A blocker or major on job ① or ② restarts the count.** Job ③ findings and `minor`s do **not** —
see the convergence rule below.

---

## The fix range — and it is deliberately tiny

`1782769..613adf2`. **Exactly one source file changed:** `scripts/check-audit-closure.ts`, one hunk, in
commit `b2a8aac`. Everything else in the range is `docs/` plus `gate-status.json`.

```
git -C /c/Users/Jason/debt-app-v1 diff 1782769..613adf2 -- scripts/check-audit-closure.ts
```

⚠️ **`npm run lint:gate-freshness` reports RED on this tree right now.** Measured at the pin, not
inferred. The recorded green is `1782769 · 2026-08-26T00:29:38Z · 789 files`, and that one hunk landed
after it. **Whether that is correct behaviour or a defect is yours to decide** — it is handed to you as
a reading, not as a conclusion.

⛔ **Never read `gate-status.json` out of a commit.** Pass 3 found `1782769`'s committed copy holding
`b03e0d3`'s fingerprint — commit → record → push leaves that window open by construction.

---

## The severity scale — use exactly these words

| severity | means |
|---|---|
| **blocker** | It ships broken. Data loss or corruption · a wrong number about the user's money · a crash or a permanently stuck screen · a statement to the user that is false about their own money or data · a once-ever moment lost forever. |
| **major** | A real user can hit it and the product is meaningfully worse: a feature that does not work, a screen that misleads, an irreversible action with no guard — **or a gate or test that cannot catch the class it exists for**, because that is how the next blocker ships. |
| **minor** | Correct behaviour, imperfect craft. **No user-visible consequence and no instrument blinded.** |

⛔ **State the user-facing consequence in one sentence for every `blocker` and `major`.** If you cannot
write that sentence, the finding is `minor`. **This surface is the instruments, so read the second half of
`major` carefully: for a gate, "the user-facing consequence" is the class it would let through.**

⛔ **A test that passes with its own defect present is `major`.** ⛔ **Do not inflate to seem thorough.**
Two blockers and nothing else beats twenty findings that need triage. **"No blocker or major in
`<surface>`" is a real and valuable result.**

---

## ⚡ Reading rules this cluster paid for. Each one names a specific miss.

1. ⛔ **A metric moving the right way is not evidence until you check it measures the DEFECT, not the FIX.**
   The same stripper was measured at **11,694 · 478,413 · 8,807** by three people in a row — all three
   counted its *output*, which is the thing it exists to change. Pass 3 counted **the gates' verdicts**
   instead: hit sets computed twice, old stripper and new. **Measure the consumer's verdict, never the
   instrument's intermediate output.**
2. ⛔ **The fixer's own write-up is inside the corpus the fixer is measuring.** Three instances, one root:
   the `[closes: …]` docs minted four fabricated closures; a gate's remediation text printed a live token;
   a self-referential grep matched its own docblock. **If you grep a file you are also documenting, you
   will find your documentation.**
3. ⛔ **A stated mechanism is a hypothesis even when it is hours old and written by the person fixing it.**
   **2 of 4 stated mechanisms measured false while all 4 recommendations were sound.** **When the claim is
   about a computed value, print the value.**
4. ⛔ **Enumerating spellings has failed SIX times** — month arithmetic (5), `importStore` call shapes (4),
   `announceForAccessibility?.()`, uncapped pace values (2), markdown code (4), and the scanner's own
   constructs. **Judge the condition the consumer evaluates, never the example the finding cited.**
5. ⛔ **Expect the fixer's own work to carry the defect it was closing.** In one round, three of six
   sub-steps reproduced the class they were closing — **all three caught by an instrument, none by review.**
6. ⛔ **A quoted docblock is a carried premise, not a measurement.** Two stale premises came from in-repo
   comments that findings quoted as evidence. **Do not cite a comment as proof of behaviour.**
7. ⛔ **A test whose earlier assertion reds first never exercises the later ones.** When a test carries
   several assertions, say **which one carries the finding** and **whether an earlier one fires first.**
8. ⛔ **The observation, the premise and the remedy fail independently.** Verify all three separately.
9. ⚠️ **`grep` piped to `head` has under-reported a site count on five consecutive items.** Count the
   whole result, then show it.

---

## ⛔ THE RATCHET — swept clean by passes 1–3. Do NOT re-report. EXTEND.

A coverage audit converges by extending what has been looked at, not by finding less. **The full
carried-forward list is `S0-REVERIFY-3.md` → "Swept and found clean".** Read it; it is the ratchet, and it
is long. Headline entries:

> the ten strip-using gates' hit sets (0 lost / 0 gained under both strippers) · `lib/stripCode.ts`'s
> regex/division/JSX/ASI modelling (568 of 570 literals) · `stripCommentsOnly` (0 plain-code chars lost
> over 626 files) · all nine gates delegating, each variant verified by swapping it · `check-month-arithmetic`
> byte-behaviour-identical across the diff · the Swift half of `check-apostrophes` · `check-audit-closure`'s
> fence pairing vs. a CommonMark state machine over 24,110 lines · `gateSources.ts`'s 789 files ·
> `run-gates.ts`'s 23-gate registry · the `migrationAudit` layer (`doors.ts`, `invariants.ts`, `corpus.ts`,
> `HOSTILE_FLOOR`, `selfCheck`).

⛔ **Also do not re-open pass 3's "Measured, and NOT a defect" list** (`S0-REVERIFY-3.md` → that heading).
It records six things that were measured and found *not* to be majors, with the measurement attached.
**If you disagree with one, you must beat its measurement with a measurement** — not with a reading.

⚠️ **A clean verdict does not survive an edit.** The one file the range edited is
`scripts/check-audit-closure.ts`. **Re-check exactly the changed part.** Do not re-sweep the whole file.

---

# Your assignment

Two auditors. **You are one of them — your section is named in your dispatch.** Do not do the other's job.

## AUDITOR A — jobs ① and ②. This is the pass convergence depends on.

### Job ① — verify the fix

The one hunk in `scripts/check-audit-closure.ts`. It was written against **pass 3's attack point 5**
(`S0-REVERIFY-3.md:140-146`) — read that passage for the finding text, and **note that pass 3 rated the
consequence inert.** Three questions:

1. **Is the original behaviour actually gone?** Read the code that produces it.
2. **Did the fix preserve what the site did right?** ⚡ **The worst defects in three consecutive rounds
   were over-matching fixes.** Ask what the change now does to inputs the finding never mentioned.
3. **Would anything catch it un-fixing?** Name the test and say **whether it would fail on the ORIGINAL
   defect** — not merely whether it exists. If the honest answer is "nothing would," say so; that is a
   job-③ finding, not a job-①/② one, and it does not restart the count.

**Verdicts:** `CLOSED` · `CLOSED-UNPINNED` · `PARTIAL` · `OPEN` · `WRONG-REMEDY` · `NOT-A-DEFECT` ·
`ALREADY-CLOSED-ELSEWHERE`. Each `PARTIAL`/`OPEN`/`WRONG-REMEDY` carries a severity.

### Job ② — sweep for blocker + major. **This is where your time goes.**

The fix range is one hunk, so job ① is thin **by construction**. Job ② is the pass.

⚡ **Six S0 files have never been swept by ANY pass** — verified by grepping all three pass reports and
`.11.17`'s `E-gates-instruments.md` for each filename. **This is your fresh surface:**

| file | gate | lines | why it is worth your time |
|---|---|---|---|
| `scripts/check-gate-freshness.ts` | `lint:gate-freshness` | 69 | ⚡ **The instrument that decides whether every other instrument's green describes this tree.** If it can report green over a changed tree, every recorded green in this project is unverified. **It has never been audited.** |
| `scripts/check-contrast.ts` | `lint:contrast` | 457 | Named in plan row `.9.3` as a gated class **never re-checked** |
| `scripts/check-type-scale.ts` | `lint:type-scale` | 144 | Same row, same reason |
| `scripts/preflight-native-lane.ts` | `lint:lane` | 537 | The largest never-swept gate in the tree |
| `scripts/check-a11y-collapse.ts` | `lint:a11y-collapse` | 134 | On an older round's clean list; **not re-verified since** |
| `scripts/check-committed-secrets.ts` | `lint:secrets` | 101 | Same. ⚠️ A secrets gate that cannot catch its class is a `major` by the second half of the definition |

**And a class, not a file:** `scripts/apostrophe-baseline.json` · `scripts/duplicate-copy-baseline.json` ·
`scripts/webkit-flex-controls-baseline.json`. **A baseline is a cap.** `MAX_UNTOKENISED` in
`check-audit-closure.ts` carries an explicit *"downward only — raising it to make a gate pass is the defect
this gate exists to catch."* **Do these? Read each consumer and answer whether anything stops a baseline
being regenerated wider to make a red gate green.**

Ask, of every surface you touch:
- What is the **worst thing** this instrument could let through while reporting green?
- What input, encoding, ordering, path shape or platform has nobody tried? *(CRLF, a symlink, a file with
  no trailing newline, a path with a space, an empty corpus, zero matches, a renamed file.)*
- **`QA_TOOLS` is flipped `false` at P6.17 and `__DEV__` is `false` in a production web export — what does
  that make unreachable?**
- Which claim printed **to a human** by one of these gates could be **false**?
- ⚠️ `apps/rn` runs on iOS native **and** react-native-web and they diverge. **Check for a `.web.ts` /
  `.web.tsx` fork before trusting any finding that touches app code.**

⛔ **`minor` findings are not wanted in job ②** — except where you are recording that something measured is
*not* a major, so pass 5 does not re-open it. Pass 3 used that device well; copy it.

## AUDITOR B — job ③. Inventory the guards. ([D67])

⛔ **This job does not gate convergence** *(🎯 2026-08-26)*. **A job-③ finding is not a defect** — the code
was measured *correct*; the gap is that **nothing would catch it regressing**. Applying a new bar for the
first time always yields a backlog, and that backlog is not evidence the surface is still producing bugs.
**Your output is a build list for S0.13, not a verdict on S0.**

**[D67], in one line: a closed finding needs a standing GUARD, or it is not closed.**

**Why it exists:** coverage ratchets forward in this project; **findings did not.** A pass only ever
re-checked *the pass before it* — while one intervening commit edited **nine gates**. Several S0 closures
were proven by **a plant that ran once and was deleted**, which leaves nothing behind.

**Your job:** for **every** finding closed on the S0 surface, name the **standing guard** — a named test or
a registered gate that exists today and **would fail if the finding regressed** — or record a **GAP**.

**Where the findings are.** ⚠️ **Do not trust any one summary; this project's summaries have under-counted
on five consecutive items. Budget the enumeration, not the list.**
- `S0-REVERIFY-1.md`, `S0-REVERIFY-2.md`, `S0-REVERIFY-3.md` in this folder — passes 1–3.
- `docs/DEBT_ELEVATION_LOG.md` — search `S0.1` … `S0.13`, and `P6.8.9.7.11.18`. ⚠️ **This is the fixer's
  claim, not evidence.**
- `E-gates-instruments.md` and `C-import-bridge-backup.md` in this folder — the `.11.17` round's S0-surface
  findings.

**For each finding, one row:**

| finding | closed at | the guard | would it red on the ORIGINAL defect? | verdict |
|---|---|---|---|---|

- **`GUARDED`** — a named `path:line` test or a registered `lint:*` gate, and you can say **which
  assertion** carries it. ⛔ **"A test file exists" is not a guard.** ⛔ **"It was plant-verified once" is
  not a guard** — that is precisely the shape [D67] exists to catch.
- **`GAP`** — nothing standing would catch it. Say in one line **what the guard would have to assert.**
  That line is what S0.13 builds from, so make it buildable.
- **`N/A`** — the finding was `NOT-A-DEFECT` or was closed by deletion, so there is nothing to regress.
  Say which.

⚠️ **[D67] already names two expected GAPs** — *"`stripMarkdownCode` covers four spellings"* and *"each of
the nine gates uses the right variant."* **They are named so you do not report them as your discovery;
confirm or refute them, and find the rest.** ⚠️ It also names four expected `GUARDED`s — invariant ⑨,
`HOSTILE_FLOOR`, `selfCheck`, and the caps. **Verify those four rather than inheriting them:** for each,
open the test and say which assertion carries it and whether an earlier assertion reds first.

**End with a count**: `N findings · G guarded · X gaps · Y n/a`, and the gaps ordered by what they protect.

---

## Rules — both auditors

- ⛔ **Do not spawn sub-agents.** Do the reading yourself.
- ⛔ **Do not edit, create, move or delete ANY file under `apps/`, `packages/`, `scripts/`, `.github/`,
  `.maestro/` or `docs/` — except your own report file.** **NO FIXES. This round does not edit source.**
- ⛔ **Do not run the long suites**: `validate:release:rn`, `test:e2e:*`, `test:regression`,
  `test:scenarios`. ~15 minutes each and this round is read-only.
- ✅ **You MAY run an individual `lint:*` gate** — each is seconds, and pass 3 ran twelve. ✅ **`npm run
  test:app` is permitted** (pass 3 ran it).
- ✅ **You MAY and SHOULD compute.** Rule 3 requires printing values. **Write throwaway scripts into your
  scratchpad and run them with `node` / `npx tsx`, importing from the repo. NEVER write a scratch file
  into the repo tree.**
  ⚠️ **`node -e` with a regex or a quoted payload silently mangles under this shell — put it in a file.**
  ⚠️ **`sed -i` with an escaped pattern silently no-ops here.** Use the Edit tool on scratch files.
- ⛔ **Write your report file incrementally** — append each finding to disk as you finish it, so a death
  loses one finding and not the round.
- ⛔ **Quote a path and a line for every claim, and verify the path and the line exist before citing.** A
  prior round produced a confident citation for a file that was not there, and another cited line numbers
  that had moved.
- ⚠️ **Report what you could not determine.** "Only observable on device" is a real result.
- ⚠️ **End your report with your own "swept and found clean" list**, naming files and surfaces, so pass 5
  ratchets off yours.

## Your report file

**Auditor A →** `docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-REVERIFY-4.md`
**Auditor B →** `docs/audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-GUARDS-4.md`

Structure (A uses all of it; B replaces jobs ①/② with the guard table):

```
# <title>
**Pinned:** 613adf2, branch v1.7-dev.  **Surface:** …  **Bar:** blocker + major.

## Result
<n> blockers · <n> majors  (one line, up front)

## Job 1 — the fix, re-verified
### <finding> — <verdict>[ · <severity>]
**Original finding:** …
**What the fix did:** … (path:line)
**Preserved?** …
**Pinned?** <test path:line> — would / would not red on the original defect, because …

## Job 2 — sweep for blocker + major
### <N>. <one-line title> — **<severity>**
**User-facing consequence:** <one sentence>
**Mechanism:** … (path:line)
**Confidence:** measured / read-only inference / needs device
**Would anything catch it?** …

## Measured, and NOT a defect — recorded so pass 5 does not re-open them
## Swept and found clean
## Could not determine
```
