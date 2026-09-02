# S1 · money · **PASS 7** — the brief

**Surface:** S1 (money, goals, plan cards) + S0's instruments, per the LOOP rule.
**Pin:** `4c0f7689` (pass 6's own tree) → HEAD.
**Route:** generated, never typed — `scripts/audit-route.ts`. **640 files · 0 unrouted · 0 owed.**
**Split:** `scripts/audit-sublanes.ts` — **12 sub-lanes · 106.0k lines**, asserted total against the four
parent manifests. **All 457 exit-bearing files are in a sub-lane.**

Your manifest is **`ROUTING-<your lane>.txt`** in this directory. Every file's origin is in
`ROUTING-ORIGINS.tsv`. **Read `RESUME-PROTOCOL.md` before you start.**

---

## ⛔ WHY THERE IS A PASS 7 AT ALL

[D65] exits on **0 blockers / 0 majors twice consecutively**. Pass 6 was **123 findings**. Pass 7 is the
next first-candidate, and a clean pass 7 still owes a pass 8.

⚠️ **You are auditing a tree that was heavily REPAIRED since pass 6** — twelve triage classes, two new
lint gates, 14 new guards, and two repairs to the proof harness itself. **Every prior round found the
previous round's fixes defective.** That is the most likely place for your findings to be, and it is why
`fix-churn` and `instrument` are origins you should weight rather than skim.

---

## ⛔ YOU ARE MEASURED ON WHAT YOU READ

Pass 6 read **446 of 446** money-bearing files — the first pass that ever hit its own exit — because
twelve lanes were handed ~8k lines each instead of four handed ~16k. Passes 4 and 5 read **103** and
**86**. You are handed ~8k. **Do not let that number regress.**

Append every file you actually open to **`READ-<your lane>.txt`**, one repo-relative path per line,
forward slashes, no other text. **Write it incrementally, not at the end** — pass 4 lost three auditors
mid-round and kept 11 findings only because they were already on disk.

⚠️ **"Read" means you read it, not that you grepped it.** [D69] — which exempts a *first-look* finding
from the convergence count — is a lookup against exactly these claims. **A short honest list is worth more
than a long one.** A path git does not track is a hard refusal, and the error names your lane.

---

## What the pass-6 TRIAGE measured about its OWN work — read this before writing a finding

⛔ **A CLASS'S OWN LABEL IS UNRELIABLE — ITS COUNT, ITS SEVERITIES, AND EVEN "UNRATED".** `S1.13.7.10.1`
caught a class whose **count** was wrong. `S1.13.7.11` re-enumerated a class recorded as *"35 findings ·
3 blockers · 5 majors · 7 unrated"* and measured **40 · 5 blockers · 8 majors · 27 minors** — **all four
numbers wrong**, and `CLASSIFICATION.md`'s own header said a fifth number (43). ⚡ **Nothing was unrated:
all 40 stated a severity in THREE different formats and the first pattern read only one.** Never schedule
or dismiss off a label; derive membership two independent ways and check they agree.

⛔ **A GUARD IS ONLY AS CURRENT AS THE LAST COMMIT THAT TOUCHED ITS FILE.** One fix built on another
**voided both of its guards one commit after they were proven**, and staleness recurred three more times
in the same class. If a registered guard is your subject, run `npm run prove:guards -- --id=<ID>` — do not
read its token. `lint:finding-guards` is a **deletion detector**, not a closure proof.

⛔ **EVERY DEFECT IN THE FIXER'S OWN WORK WAS FOUND BY AN INSTRUMENT, NEVER BY READING.** A new gate failed
open on its own first plant; `lint:copy` caught a sentence being duplicated *while a duplication finding
was being fixed*; `lint:fixture-dates` caught a fuse the day it was written. **Reading has never once
found this class. Planting has found it every time.**

⚡ **SEVERITY DOES NOT PREDICT BLAST RADIUS.** All **51** CI e2e failures had one cause, found by
`git bisect`: `C1-18`, a **minor** about a literal declared twice, whose remedy made a Skia-importing
module the owner — putting CanvasKit in Today's import graph so Today rendered an empty body. **A minor's
remedy took down the suite.**

⚡ **A LIVE MONEY DEFECT WAS FOUND WHILE FIXING A TEST.** `A3-4` measured **RESERVE $50 against PAYDOWN
$200** on one weekly debt. An earlier finding had argued its widening was safe because *"the allocator's
RESERVE and the PAYDOWN both read `effectiveMinimumInWindow`"* — **the allocator did not read it.** The
Guardian called a paycheck clear having held $50 while the rollover took $200.

⛔ **A HARNESS FAULT WEARS A FINDING'S FACE.** Measured 2026-09-02: a Playwright web server killed *before
any assertion ran* scored `reason=WRONG` — *"it redded, but not for your defect"* — about a run in which
**nothing redded at all**, at roughly **1 invocation in 3**. Four candidate causes were measured and
refuted before it was called environmental. ⚠️ **Before reporting that a check did not catch something,
prove your checker can SEE the subject** — plant an unmistakable error in the same file and confirm it
reds.

⛔ **AN ARTIFACT THAT EXISTS IS NOT AN ARTIFACT THAT IS READ.** `S1.13.7.12.1` created S2/S3/S4's claims
files; `audit-route.ts` kept asking the old question and reported **87** files owned by no claims file.
Pointing it at the new files took that to **26**. *A tested helper is not a used helper* — check the call
site, not the definition.

⛔ **A REMEDY IS A HYPOTHESIS. A PREMISE IS NOT.** Measured in every round: premises reproduce, remedies do
not survive contact. Pass 5's fixing found **five remedies that would have introduced the defect they
described**. Pass 6's triage found **more than half of pre-authored remedies did not survive contact**, and
**four findings named defects a later sub-step had already closed.** ⚠️ **This applies to same-session
claims too** — five pre-authored claims were checked on 2026-09-02 and **four were wrong about their own
mechanism while right that something was there.** **Write what you measured. Mark every remedy unverified.**

⛔ **ITERATE THE CLASS, NEVER THE MEMBER YOU FOUND.** **13 of pass 4's 34 findings were one class:** the fix
reached the reported instance and left a sibling asserting on the same store. Pass 6's `S1.13.7.8` found a
site its report never named — the Restore button was `disabled={status !== 'ready'}`, so fixing what was
named would have left the door **visible and dead**.

⛔ **A CHECK THAT CANNOT FAIL READS EXACTLY LIKE A CHECK.** Found in every pass, including inside the
instruments written to prevent it — caps derived from the lists they cap, a harness printing
`reason=WRONG` beside a green tick and then announcing all gates fail closed. **And a plant cannot see the
green state:** run a changed spec GREEN and read its output, not its exit code.

⚠️ **A COMMENT IS A CARRIED PREMISE AND DECAYS LIKE A CARRIED NUMBER.** Measured again this round: a
docblock in `prove-guards.ts` stated that a drained ratchet reds `lint:finding-guards`. It does not — that
counter is a **ceiling**, deliberately, and the gate stays green. Quote a comment only after checking it.

---

## ⚠️ Origins — what each means for your report

`ROUTING-ORIGINS.tsv` gives every file one. **Report your findings SPLIT BY ORIGIN**, or a flat total
hides the app improving while the instruments regress.

| origin | n | what it means |
|---|---|---|
| **`stale-read`** | **350** | money-bearing and **not read by pass 6**. The largest bucket. |
| **`fix-churn`** | 99 | swept, then rewritten. The recorded sweep describes bytes that are gone. **This round's repairs live here.** |
| **`neighbour`** | 77 | did not change, but imports or shares a consumer with something that did. **Where a two-producer disagreement is visible from the side that did not move** — pass 5's largest bucket carried 4 of 9 blockers. |
| **`instrument`** | 46 | the checking code the fixing itself wrote. |
| **`off-surface`** | 31 | changed and on no inventory at all. |
| **`s0-first-look`** | 26 | never swept by any pass, S0. |
| **`first-look`** | 11 | never swept by any pass. [D69] exempts these from the convergence count. ⚠️ **Exempt from the count is NOT exempt from the fix.** |

⛔ **Known blind spot, stated so you do not have to rediscover it:** **9 files** sit in the import
neighbourhood of a never-swept file and reached no lane — the neighbourhood is seeded from *changed* only
([D5-8]). **26 more** are owned by no claims file at all; they are listed in `UNSEEN-NEIGHBOURS.txt`.

---

## Severity

- **`blocker`** — the app states something false about the user's money, or destroys/misrecords it.
- **`major`** — an instrument reports green while doing less than it claims; or a guard survives its own un-fix.
- **`minor`** — true but imprecise; a stale premise; grammar on a line every user meets.

**Every finding needs: the user-facing consequence · the file and line · the measurement (printed values,
one store, one variable) · the mechanism, stated as a hypothesis · a remedy, marked verified or not.**

⚠️ **State your severity ONCE, in the `##` heading, in this exact form** — three formats cost the last
round a re-enumeration and four wrong numbers:

```
## A1-1 — `blocker` · one-line summary
```

Write findings to **`<your lane>-findings.md`** in this directory, **as you go**. A round that reports at
the end reports nothing when it dies.

---

## ⛔ Constraints — these are measured, not stylistic

| | |
|---|---|
| **No sub-agents.** | You are one reader. Do not spawn any. |
| **Heap 1536 MB.** | `--max-old-space-size=1536`. **An OOM is a FINDING, never a retry** — the retry at 6144 on a 6 GB box is what killed pass 4's dispatch. |
| **No whole-monorepo typecheck**, no `npm run lint:rn`, no Playwright. | Twelve lanes share one box. Typecheck the one project you touched, if you must. |
| **Do not fix anything.** | Pass 7 reads and reports. Triage is a separate step, and it fixes **by class**. |
| **Kill any server you start**, in the step that starts it. | Two `serve` processes were once found listening weeks stale. |
| **Verify every restore.** | `git checkout --` on an uncommitted change throws it away with the plant. Restore from a copy taken AFTER, and `cmp` it. |
| **Read a command's own `$?`.** | A pipeline reports the LAST stage: `\| tail` has reported exit 0 over a failed run **ten times** in this project. |
| **Prefer a runner FILE over `node -e` / `tsx -e`.** | Shell metacharacters in JS are a standing hazard: a zero-byte file literally named `m.default())` was created by `m=>m.default()` and **committed three separate times**, most recently this round. |
| **Leave the tree clean.** | Anything you write belongs in this directory. |

---

## ⚠️ `D3` only — the legacy root has a REDUCED mandate

`D3` is the legacy Next surface at the repo root (`app/`, `components/`, `lib/`, `tests/`). **`P6.11`
deletes it**, it is not the shipping app (`apps/rn` is), and **none of its 12 files are in the coverage
exit's 457.** 🎯 `S1.12.6`: *"Coverage is what I want. Not unneeded files."*

**So do not audit it line-for-line.** Read it for exactly two things:

1. **A defect that MIGRATES** — a money claim, formatter, or rule the RN app inherited or shares.
2. **Evidence it is still live** — anything suggesting this surface ships, is built, or is reachable by a
   user, which would make its deletion in `P6.11` a bigger change than the plan assumes.

⚠️ **Precedent:** `S1.12.11` found six tracked files here carrying **merge-conflict markers for 177
commits**, un-parseable, while **42 gates read green over them** — because none of them looks at `app/`.
Report anything of that shape; skim the rest.
