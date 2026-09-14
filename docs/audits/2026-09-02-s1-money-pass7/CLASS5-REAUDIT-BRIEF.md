# Class 5 — the re-audit: the brief *(round 1)*

> ⛔ **You are a FRESH auditor.** The session that built class 5's fixes is not writing this audit, and neither is
> the session that wrote this brief running it. That is `[D79]` step **b**: a fixer re-reads its own premises
> instead of the code. Across classes 1 and 4 it paid every round — **rounds 4 and 5 of class 4 found only
> defects the previous round's fixes had created**, one of them a blocker.

## What you are auditing

**Class 5 — *may a surface state a projected figure?*** — every commit from **`c7df99c2`** (which closed class 4
and promoted class 5) to the **pin**. ⚠️ **The pin is the commit that carries this brief** — a document cannot
name the commit it ships in. `git log --oneline -1 -- docs/audits/2026-09-02-s1-money-pass7/CLASS5-REAUDIT-BRIEF.md`.

⛔ **DERIVE THE FIX SET FROM THE DIFF, NOT FROM A FINDING LIST.**

```
git diff --stat c7df99c2..<pin> -- apps packages scripts
git log --oneline c7df99c2..<pin>
```

⚠️ **This range was mis-stated once already.** The handoff that opened this item gave `72bd6619..HEAD` — only the
last sub-step (`.5.7`): 14 of the class's 76 commits and 25 of its 70 code files. It was caught by walking the
commit log back to the class boundary, not by reading the handoff. **If your own derivation disagrees with this
brief, yours is the one to trust, and the disagreement is a finding.**

**Your lane's files are in [`CLASS5-REAUDIT-LANES.tsv`](CLASS5-REAUDIT-LANES.tsv)** — generated from git by rule,
asserted to assign every changed file exactly once. **72 files: 70 from class 5 · 3 from class 4's unaudited tail
(1 in both).**

| lane | subject | files | lines |
|---|---|---|---|
| **L1** | **the claims and the selectors** — the predicate, the projection claims, the projection record, `cushionLine`, the save-for-it pace, the reserve offer · *plus class 4's tail* (`payoffCelebration`) | 18 | 5.7k |
| **L2** | **the surfaces OUTSIDE the app** — Siri (TS + Swift), the Live Activity (sync, bridge, Swift), the widget snapshot, the queued-intent replay record in `store.ts` | 24 | 4.7k |
| **L3** | **the screens, the plan cards and the e2e specs** — ⛔ **the ONLY lane that runs Playwright** | 22 | 8.6k |
| **L4** | **the instruments** — `check-finding-guards`, `check-trust-claims`, `test-gate-plants`, `run-gates` (`--fast`), and the registry entries the range added · *plus class 4's tail* (`R5-1`'s registry rows) | 8 | 11.0k |

⚠️ **The manifest is where to START, never the boundary.** A defect is often visible only from a file that did NOT
change — a second producer of the fact a fix corrected, or a reader of a value whose meaning moved. Follow imports
and consumers out of your manifest whenever the question needs it.

### Class 4's unaudited tail — in scope, and why

Class 4 round 5 audited `bc2151ff..8ccae93f`. **The fix for its own finding `R5-1` (`2df9ece8`) was committed while
that auditor was still running**, and its report says *"Round 6 must audit `2df9ece8` as an unaudited fix."* 🎯
stopped class 4's loop there, so **no fresh auditor has read it.** `R5-2`'s fix (`55fcc88f`) landed inside class 5.
Both are yours — L1 the celebration, L4 the matcher.

## The questions, and nothing else

1. **Is each class-5 closure actually closed?** Not *"is there a fix"* — is the defect refused, **by planting**, red
   for the reason that names it. ⛔ **A closure you cannot make red by planting is OPEN**, whatever the commit says.
2. **What did class 5's fixes break?** Anything, anywhere — including in already-closed classes.
3. **Cumulative (`[D79]` step c), targeted — not a re-audit of every prior finding:**
   - **interaction** — an earlier closure sharing a file, an import or a producer with this range;
   - **guards whose pinned files moved** — any registry entry whose `proof.unfix[].at` is a path in the manifest.
     Re-execute it (`npm run prove:guards -- --id=<ID>`); do not read its token. `lint:finding-guards` is a
     **deletion detector**, not a proof.

## ⛔ ATTRIBUTION IS A MEASUREMENT, NOT A JUDGEMENT

The exit is **zero new defects attributable to class 5's fixes** — not zero findings. So **every finding you file
states whether it reproduces at `c7df99c2`**, measured in a second worktree at that commit:

- **reproduces at `c7df99c2`: NO** → **attributable** — class 5 (or class 4's tail) introduced it.
- **reproduces at `c7df99c2`: YES** → **reservoir** — it predates the class. File it; it routes to its own class.
- **cannot be measured there** *(the code did not exist)* → say so and argue the attribution from the diff.

⚠️ **Do not re-file what is already filed.** The open classes 6–12 are in [`CLASSIFICATION.md`](CLASSIFICATION.md);
the deferred rows are in [`DEBT_ELEVATION_BACKLOG.md`](../../DEBT_ELEVATION_BACKLOG.md). New evidence about a filed
row is worth recording *as new evidence on that row*, not as a new finding. Already filed and known: the Payday
Countdown Live Activity almost never starting (`currentDate`) · save-for-it's *"ready by"* date (→ P6.10) · `R5-3`
· the two stale route proofs `S1-ROUTE-STALE-READ` / `S1-ROUTE-EXIT-REACHABLE` · `native-e2e` has not yet compiled
`.5.7`'s Swift.

## Class 5's membership — derive it, do not take it from here

⛔ **The class's closure set is not one list, and it has never been counted two ways.** Sources that must agree:
`CLASSIFICATION.md` §CLASS 5 (its table has **13** rows) · the plan's `.12.6.5` rows in
[`DEBT_ELEVATION_PLAN.md`](../../DEBT_ELEVATION_PLAN.md) · the commit messages in the range · the registry entries
the range **added** to `scripts/finding-guards.json`. ⚠️ **They already disagree on sight:** the plan names ids
the table does not — pulled forward from other classes (`C1-2`, `B1-2`), swept inline (`C1-3`), a **pass-6** id
reopened (`C3-6`) — and `.5.7` closed defects that carry no pass-7 id at all. ⛔ **Pass-6 and pass-7 ids COLLIDE**
— a bare id means pass 7; say which when it does not. **Report your derived set and every disagreement.**

**Prior closed scope for the cumulative question:** class 1 (**95**, including `W9b`, which exists only in
`DEBT_ELEVATION_LOG.md`) and class 4 (**11** + round findings through `R5-3`) — **130** by round 5's own
derivation. A claim to check, as ever.

## 🎯 Decisions — these are the design, not defects

Attack whether each is **implemented** as decided. Do not file the decision itself.

- **`C3-13` is fixed AT THE PROJECTION**, not at each caller: `withProjectedBalances` records each projected debt's
  confirmed balance, and liveness reads it. Raw stores carry no record, by construction.
- **Exact claims per surface** — `'paycheck-plan'` was added and `'required-plan'` narrowed, each asker routed to
  the claim exact for what it renders. *(Rejected: one wide claim; the Guardian card only.)*
- **`C1-2` pulled forward into `.5.2`.**
- **A Lock Screen tap names its payday** — the roll applies only when the queued `paydayDateISO` equals
  `nextPaycheckDate`; undated entries fall back to *"the store clock has reached `nextPaycheckDate`"*.
- **The applied-intent record carries through every store replacement**, in the set wrapper — a class, not a list
  of doors — and is capped.
- *(standing)* backward-looking *"% paid"* stays on raw balances.

## Where class 5 is most likely to have gone wrong

⚠️ **Leads, not a checklist — and not verdicts.** A stated mechanism is a hypothesis: this project has measured
**2 of 4** wrong while every observation stood, and class 4's brief had its own highest-value lead refuted. **Do not
stop at these.**

**L1**
- `.5.3` built one predicate; `.5.4a` measured that it **over-suppressed** and replaced it with two projection
  claims. **Is anything still calling, exporting or documenting the retired shape?** Which asker sits on which
  claim, and is that population derived from code or typed?
- **The projection record.** On a store that did NOT pass through `withProjectedBalances`, does a reader treat
  *absent* as *confirmed* or as *unknown*? Is there a second producer of projected balances that does not stamp?
- **`cushionLine` became the one owner** of eight sites across two spellings (`|| 200` erases `0`, `?? 200` does
  not). Any literal floor or fallback left? Is `0` a legitimate line at every reader now?
- **The save-for-it pace** has one producer. Is the pace **written to the store** the same number the card
  **prints**, on every store — free, premium, reserve held, unread input?
- **Interaction:** pass 4's `partitionDebts` asserts *live + cleared + unreadBalance = all debts*. Does the
  projection record, or liveness reading the confirmed balance, disturb that total anywhere?
- **Class 4's tail:** `R5-1`'s celebration keyed on `recurrence`, with a population from `Record<Recurrence,
  number>`. Never read by an auditor.

**L2**
- **The applied-intent record.** What happens at the cap — does eviction re-open a replay? A restore from a
  backup older than the record? Each store-replacement door (`lint:restore-doors` derives them)?
- **The dated tap.** Weekly and semimonthly cadences · a tap drained after the next payday rolls · date string vs
  date equality · a timezone or DST edge · an undated entry from an older build's queue.
- **The Live Activity stamps only what landed.** What does the bridge answer on web, on a native failure, and on
  a JS bundle newer than the installed binary? Can a failed stamp loop, or never re-stamp?
- **Siri's `''` now means one thing.** Both Swift copies · the TS side · every intent in the file, not the ones
  the finding named (pass-6 `C3-1`'s fix reached 2 of 3).
- ⚠️ **Swift cannot be compiled here.** Read it; do not claim a compile result.

**L3**
- **Over-suppression.** `.5.4d` stated seven named over-suppressions. For a user whose data is FINE except one
  unrelated field (a lost APR, a lean paycheck), is any surface now blank that should not be?
- **`hero-date-fit`** sizes the date to its slot regardless of font. Long month names · large accessibility text on
  native (`fontScale` is always 1 on web) · `lint:type-scale`.
- **The three `.5.7` promise fixes** — the Cash Runway's held line, the save-for-it confirmation, the reserve offer
  as rendered. Does any screen print the old figure beside the new one?
- **The e2e specs the range added.** This project's measured traps: an absence assertion passes before render ·
  `seedStore` re-seeds on every navigation · an unscoped `getByText` is a strict-mode violation that exists only
  in the GREEN state. **Run each changed spec green, and re-run each plant with the assertion above it relaxed.**

**L4**
- **`lint:rn -- --fast` ([D81]).** Can a `--fast` result be mistaken for a full run anywhere — a chain, CI, the
  record? Does the full run really refuse to skip?
- **`--projected` staleness**, the claim lattice, the lost-field names, the two trust-claims ledgers. Are caps
  literals? Are populations derived? *(A cap computed from the list it caps is `n > n`.)*
- **The registry entries the range added.** Each red for its **named** reason · each token in code and stopping
  before any `${` · `proof.run` is an npm script name, `proof.cmd` the argv form.
- **`R5-2`'s word-boundary matcher** (class 4's tail). Fire-count anything you propose.
- **Orphans:** is every `*.test.ts` the range added registered in `runAppTests.ts`?
- ⚠️ `authored` is **9 of cap 9** — any new proof you propose re-enters the record deadlock. Say so.

## ⛔ Parallel lanes — the two rules that keep four of you from measuring each other

1. **Plant ONLY in your own worktree** — `C:/Users/Jason/audit-c5r1-<lane>`, detached at the pin, junctions
   already made. ⛔ **Nothing in `C:/Users/Jason/debt-app-v1` may be edited** except your own findings file and
   your own probes directory. For the `c7df99c2` attribution check, make a second worktree with the recipe in
   [`../2026-08-29-s1-money-pass5/RESUME-PROTOCOL.md`](../2026-08-29-s1-money-pass5/RESUME-PROTOCOL.md), named
   `audit-c5r1-<lane>-base`, and **tear it down the same way** — every junction removed with `rmdir` BEFORE
   `git worktree remove`.
2. **Port `:4319` belongs to L3 alone.** `apps/rn/playwright.config.ts` hard-codes it and reuses any listener, so a
   second web server would hand one lane another lane's planted bundle. ⛔ **L1, L2, L4: run no Playwright, and
   treat any of the 24 Playwright-backed registry proofs as L3's.** ⚠️ `prove:guards` refuses **every** proof —
   machine-wide — while anything listens on `:4319`. **If you see *"something is already listening on :4319"*,
   that is L3 working, not your proof.** Wait and re-run. ⛔ **Never kill that listener.** L3: kill every server
   in the step that starts it.

## Method — non-negotiable, and each line was paid for

- ⛔ **A red baseline is a FAULT, not a verdict.** Run the check clean before every plant.
- ⛔ **A plant must make an assertion FAIL, never THROW past it** — including failing to compile.
- ⛔ **When a plant reds, read WHICH assertion redded.** A plant exercises a suite only up to its first red.
- ⛔ **Plant BOTH directions** where a defect has two.
- ⛔ **Restore in a `finally` / `trap`, then verify with `cmp`** against a copy taken BEFORE the plant. Never
  `git diff`, never `git checkout --`.
- ⚠️ **Plant in BYTE mode** (`'rb'`/`'wb'`). Force UTF-8 on subprocess capture **and** on printing.
- ⚠️ **`cd` to an absolute path in EVERY shell call.** A command in the wrong directory returns empty output that
  reads as a real negative.
- ⚠️ **Heap 1536 MB. An OOM is a FINDING, never a retry.** No whole-monorepo typecheck.
- ⚠️ **Before reporting that a check did not catch something, prove it can SEE the subject** — plant an
  unmistakable error in the same file and confirm it reds.
- **Write findings to disk from your first few tool calls, and append as you go.** Three auditors have died
  mid-round.
- ⛔ **No sub-agents.** Quote your worst-case spend before anything long.

## Output

**`CLASS5-REAUDIT-L<n>.md`** in this directory; probes in **`class5-reaudit-probes/L<n>/`**. Per finding:
**consequence · `file:line` · the measurement · reproduces at `c7df99c2`? · mechanism (marked HYPOTHESIS) · remedy
(marked UNVERIFIED)** · severity `blocker`/`major`/`minor` · origin `attributable` / `reservoir` / `class4-tail`.

⛔ **A finding can be right while its remedy is wrong** — pass 4 measured five remedies that would have
*introduced* the defect they described. State remedies as UNVERIFIED.

**Also record:** what you measured and found **not** to be a defect, with its control · your derived class-5
membership and every disagreement · the files you actually opened.

⛔ **Leave the tree clean and commit nothing.** At the end: your worktrees removed (junctions first), and
`git -C C:/Users/Jason/debt-app-v1 status --short` showing only your own findings file and probes.
