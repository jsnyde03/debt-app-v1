# S1 · money · **PASS 6** — the brief

**Surface:** S1 (money, goals, plan cards) + S0's instruments, per the LOOP rule.
**Pin:** `65566a09` (pass 5's own tree) → HEAD `53a64d07`.
**Route:** generated, never typed — `scripts/audit-route.ts`. **620 files · 0 unrouted · 0 owed.**
**Split:** `scripts/audit-sublanes.ts` — **12 sub-lanes**, asserted total against the four parent manifests.

Your manifest is **`ROUTING-<your lane>.txt`** in this directory. Every file's origin is in
`ROUTING-ORIGINS.tsv`. **Read `RESUME-PROTOCOL.md` before you start.**

---

## ⛔ THE ONE THING THAT IS DIFFERENT THIS ROUND: YOU ARE MEASURED ON WHAT YOU READ

Pass 5 found 39 findings and did not converge. **It was not a sweep that missed things — it was a
sample.** Measured afterwards by `npm run audit:read-coverage`:

| pass | money-bearing files read | of 446 |
|---|---|---|
| s1p5 | 86 | **19%** |
| s1p4 | 103 | 23% |

Four lanes were handed ~16k lines each and read about a third. **You are handed ~8k.** That is the whole
reason there are twelve of you.

### Your read-list is a deliverable, and it is written AS YOU GO

Append every file you actually open to **`READ-<your lane>.txt`** in this directory — one repo-relative
path per line, forward slashes, no other text. **Write it incrementally, not at the end.** Pass 4 lost
three auditors mid-round and kept 11 findings only because they were already on disk.

⚠️ **"Read" means you read it, not that you grepped it.** This is a claim, and `[D69]` — the decision that
exempts a *first-look* finding from the convergence count — is a lookup against exactly these claims. An
inflated read-list makes that exemption unverifiable in both directions. **A short honest list is worth
more than a long one, and the second wave exists precisely so that being honest costs you nothing.**

⛔ **A path that is not tracked by git is a hard refusal**, and the error names your lane —
`npm run audit:record-reads` merges these files into `scripts/surface-coverage.s1.json`, and it will not
skip a line it cannot resolve.

---

## What pass 5 measured about its OWN findings — read this before writing one

⛔ **A REMEDY IS A HYPOTHESIS. A PREMISE IS NOT.** Measured again in pass 5's fixing, as in pass 4's: the
premises reproduced almost every time and the remedies did not survive contact. **Five would have
introduced the defect they described.** `C4-2`'s *"apply the same exclusion"* would have deleted a debt
from the user's list entirely. **Write what you measured. If you propose a remedy, mark it unverified.**

⛔ **ITERATE THE CLASS, NEVER THE MEMBER YOU FOUND.** Pass 5's `S1.12.5.3` went looking for the reported
formatter and found **`formatDisplayAmount` rendering `"NaN.N"` with no guard at all** — a fifth formatter
nobody had named. **13 of pass 4's 34 findings were one class: the fix reached the reported instance and
left a sibling asserting on the same store.**

⛔ **JUDGE THE CONDITION THE CONSUMER EVALUATES, NOT THE EXAMPLE YOU CITED.** `F-B4`: a liveness predicate
matched `field === 'balance'` while the function twenty lines below handled the parenthesised losses — so
**the loudest loss read `debt-free`.** An enumeration of spellings has failed in this repo **six times**.

⛔ **ASK WHICH MEMBER OF ITS CLASS A TEST PICKED.** `C4-5`'s fixture was *"a $800 pot beside a $25 pot"* —
the one arity where a fallback exists, so the object exists, so the caption has something to be a field
of. The member with no fallback was never run, and is the member that fails.

⛔ **A CHECK THAT CANNOT FAIL READS EXACTLY LIKE A CHECK.** Found in every pass so far, including inside
the instruments written to prevent it: caps derived from the lists they cap, set identities no tree state
can reach, a `die()` made unreachable by the precedence above it. ⚡ **This brief's own dispatch produced
one**: the first cut of `audit-route.ts`'s new exit assertion tested the very set the loop three lines
above had just assigned. **Reading has never once found this class. Planting has found it every time.**

⛔ **AND A PLANT CANNOT SEE THE GREEN STATE.** An over-broad locator becomes a strict-mode violation *only
when the fix works*; an absence assertion can be **vacuous by timing**. Every prior lesson said planting
finds what reading cannot; this is the converse. **Run a changed spec GREEN and read its output, not its
exit code.**

⚠️ **A shared fixture can discriminate one surface and be a NO-OP for another on the same claim.** At one
report's $1,500 a paywall row read *"You have $0 cushion this paycheck."* on **both** stores — a row that
could not fail, caught by reading the first green run's output.

⚠️ **A comment is a carried premise and decays like a carried number.** Pass 4 found a docblock stating a
mechanism the code did not have, and one saying *"REQUIRED"* beside a `?` in the type. Quote it only after
checking it.

⚠️ **Check whether it is already fixed.** Four of pass 4's findings named defects a later sub-step had
already closed. If a registered guard is your subject, run `npm run prove:guards -- --id=<ID>` rather than
reading its token.

---

## ⚠️ Origins — what each means for your report

`ROUTING-ORIGINS.tsv` gives every file one. **Report your findings SPLIT BY ORIGIN**, or a flat total
hides the app improving while the instruments regress — eleven instrument defects went in across two
fixing sessions while the app's own count fell.

- **`stale-read`** *(338 files — the largest bucket, and new since pass 6)* — money-bearing and **not read
  by the pass being dispatched**. Until `S1.13.3` the route retired a file the moment *any* pass had read
  it once, so a file pass 2 read against a different brief was accounted for forever. **131 money files
  pass 5 never read reached no lane at all** — including one that mints a debt id from `Date.now()`.
- **`first-look` / `s0-first-look`** — never swept by any pass. `[D69]` exempts these from the convergence
  count. ⚠️ **Exempt from the count is NOT exempt from the fix.**
- **`fix-churn`** — swept, then rewritten. The recorded sweep describes bytes that are gone.
- **`neighbour`** — did not change, but imports or shares a consumer with something that did. **This is
  where a two-producer disagreement is visible from the side that did not move.**
- **`instrument`** — the checking code the fixing itself wrote.
- **`off-surface`** — changed and on no inventory at all.

---

## Severity

- **`blocker`** — the app states something false about the user's money, or destroys/misrecords it.
- **`major`** — an instrument reports green while doing less than it claims; or a guard survives its own
  un-fix.
- **`minor`** — true but imprecise; a stale premise; grammar on a line every user meets.

**Every finding needs: the user-facing consequence · the file and line · the measurement (printed values,
one store, one variable) · the mechanism, stated as a hypothesis · a remedy, marked verified or not.**

Write findings to **`<your lane>-findings.md`** in this directory, **as you go**, one `##` heading per
finding with an id like `A1-1`. A round that reports at the end reports nothing when it dies.

---

## ⛔ Constraints — these are measured, not stylistic

| | |
|---|---|
| **No sub-agents.** | You are one reader. Do not spawn any. |
| **Heap 1536 MB.** | `--max-old-space-size=1536`. **An OOM is a FINDING, never a retry** — the retry at 6144 on a 6 GB box is what killed pass 4's dispatch. Verified this session: **6.0 GB visible, 0.5 GB free.** |
| **No whole-monorepo typecheck**, no `npm run lint:rn`, no Playwright. | Twelve lanes share one 6 GB box. Typecheck the one project you touched, if you must. |
| **Do not fix anything.** | Pass 6 reads and reports. Triage is `S1.13.7`, and it fixes **by class**. |
| **Kill any server you start**, in the step that starts it. | Two `serve` processes were once found listening weeks stale. |
| **Verify every restore.** | `git checkout --` on an uncommitted change throws it away with the plant. Restore from a copy taken AFTER, and `cmp` it. |
| **Read a command's own `$?`.** | A pipeline reports the LAST stage: `\| tail` has reported exit 0 over a failed run **ten times** in this project. |
| **Leave the tree clean.** | Anything you write belongs in this directory. |

---

## ⚠️ `D3` only — the legacy root has a REDUCED mandate

`D3` is the legacy Next surface at the repo root (`app/`, `components/`, `lib/`, `tests/`). **`P6.11`
deletes it**, it is not the shipping app (`apps/rn` is), and **none of its 26 files are in the coverage
exit's 446.** 🎯 `S1.12.6`: *"Coverage is what I want. Not unneeded files."*

**So do not audit it line-for-line.** Read it for exactly two things:

1. **A defect that MIGRATES** — a money claim, formatter, or rule the RN app inherited or shares.
2. **Evidence it is still live** — anything suggesting this surface ships, is built, or is reachable by a
   user, which would make its deletion in `P6.11` a bigger change than the plan assumes.

⚠️ **Precedent:** `S1.12.11` found six tracked files here carrying **merge-conflict markers for 177
commits**, un-parseable, while **42 gates read green over them** — because none of them looks at `app/`.
Report anything of that shape; skim the rest.
