# S1 — MONEY · GOALS · PLAN CARDS. **Pass 4.** The brief.

**Pin:** `e65f9c7` · branch `v1.7-dev` · ships as `2.0.0`. **Do not push. Do not edit source.**
**Repo:** `git -C /c/Users/Jason/debt-app-v1 …` — ⚠️ **the cwd drifts between calls; always pass `-C`, and
never use a relative pathspec.** A `git log -- scripts/x.ts` run from a drifted cwd returns EMPTY and looks
exactly like *"this file has no history."* That has happened while writing five of these briefs.

⛔ **THIS BRIEF CARRIES NO VERDICT** ([D68]). Every finding below is pass 3's text, handed over so you can
judge it. Where it says *"fixed"*, that is what the fixing session **claimed** — it is the thing you are
asked to test, not a fact you may assume.

**Where this sits.** Surfaces converge in order — **S0 instruments ✅ → S1 money ▶ → S2 dates → S3 import →
S4 discovery → cross-surface.** Pass 1 (`bc29dfe`) **5 blockers · 10 majors** · pass 2 (`4b58d75`) **3 · 6 ·
12 minors** · pass 3 (`96d1f11`) **11 blockers · 9 majors · 14 minors** — the largest round yet, on a surface
2.5× the one pass 2 read. All are recorded fixed.

⛔ **CONVERGENCE = 0 blockers / 0 majors. NO DEFERRALS.** A major exits by being **fixed**, or by being
**measured** never to have been one. **A re-rating is not a proof.** S1 exits on **two consecutive clean
passes**. Pass 3 was not clean, so **this is the first candidate — and a clean pass 4 still owes a pass 5.**

⛔ **THERE IS NO CURRENT GATE RECORD, and mid-audit that is the expected state** ([D74]).
`npm run lint:gate-freshness` is RED at this pin: the last recorded green describes `818f934` · 807 files,
and the tree is now 821, 38 commits on. **Do not quote a green.** The last full pass is `818f934`.
⚠️ **`npm run x | tail` reports `tail`'s exit code, not the gate's** — eleven instances, the most recent
while writing this brief. **Redirect to a file and read the command's own `$?`, or read the gate's own
summary line.** Never the pipeline's status.

---

## ⭐ THIS ROUND HAS **TWO** DELIVERABLES, AND THE SECOND IS NEW

### ① Findings on your route — the usual job.

### ② ⛔ **A CLOSURE VERDICT ON EVERY ONE OF PASS 3'S FINDINGS THAT LANDS IN YOUR LANE.**

🎯 Jason, 2026-08-28: *"I also want the audit to verify if the fixes implemented are closed."*

**Pass 3 returned 34 findings and the fixing session recorded all 34 closed, with 53 entries added to
`scripts/finding-guards.json`.** Nobody independent has checked either claim. You are that check.

For each pass-3 id on your route, return one of:

| verdict | means |
|---|---|
| `CLOSED` | you reproduced the original defect's condition and the code now behaves correctly, **and** the registered guard REDS when you restore the defect |
| `PARTIAL` | the named instance is fixed and a sibling instance of the same class is not |
| `OPEN` | the defect is still reachable |
| `REGRESSED` | it was fixed and something later re-opened it |
| `GUARD-ONLY` | ⛔ the behaviour is fixed but the guard **survives its own un-fix** — the fix is real and unprotected |

⛔ **`npm run lint:finding-guards` IS NOT THE ANSWER TO THIS QUESTION.** It reports
*"150 of 151 findings carry a standing guard"* and all it proves is that a token string sits on a
non-comment line. ⚡ **Pass 2 measured 7 green entries that survived their own un-fix — three of them the
fixes to the checker itself.** ⛔ **Green ≠ guarded. Restore the defect and watch.**

⚠️ **The guard token can be right about the wrong line.** `D3-3` was exactly this: `S1P2-B1-REASON` named
the line that *computes* the check, not the line that *uses* it, so the entry was green with B-1's own
defect restored. **Ask what the token is pinned to, and whether deleting the CALL — not the helper — still
reds.**

⚡ **The prior on this is not neutral.** Across the last two sub-steps of the fixing, **26 pre-authored rows
were worked and 15 were wrong about their own scope or REMEDY** while their premises were almost always
right. **Three remedies would have introduced the defect they described:** `GAP-7`'s equality assertion is
forbidden by the code six lines below it, `A5`'s `??` makes a debt paid IN FULL display its full balance,
and `D3-8`'s regex accepts the `$0.00` it was written to catch. ⛔ **The ledger is reliable about WHERE and
unreliable about WHAT WAS DONE.**

---

## 🔨 YOUR ROUTE — read it from the manifest, never from a prose list

⛔ **Your file list is a manifest in this directory. Read the file.** Do not re-derive it from a directory
name and do not trust this table's summary over the file's contents.

⚡ **New this round: the route is a committed generator** — `scripts/audit-route.ts`, [D75]. It is a set
difference, never a list, and it asserts **every changed tracked non-prose file is routed**. Pass 3's route
was derived by hand; the step before it, `S1.10.1`, hand-listed **118 of 331**.

```
npx tsx scripts/audit-route.ts --surface=s1 --since=96d1f11 --check
→ 217 routed · 0 unrouted · 0 duplicated · 0 missing on disk
```

| you are | manifest | files | lines | the shape of it |
|---|---|---|---|---|
| **A** | [`ROUTING-A.txt`](ROUTING-A.txt) | 60 | 7,351 | **The money engine, and the specs that claim to guard it.** `packages/core/**` + `apps/rn/tests/**`. ⚡ **Paired deliberately:** pass 2's `A1` — *every test written for `AS-3` used `topUp 200` against `shortfall 400`, the one input shape where blanket-zero and netting agree* — is invisible to a reader who does not know what the engine does with the other shapes. |
| **B** | [`ROUTING-B.txt`](ROUTING-B.txt) | 45 | 8,003 | **How the number is spelled, dated, stored and remembered.** `apps/rn/src/{store,storage,utils,data,analytics,lib,config,types}`. The app store, persistence, formatting, migrations. |
| **C** | [`ROUTING-C.txt`](ROUTING-C.txt) | 72 | 10,638 | **The screens a user reads money off** — where a true number becomes a false sentence. `apps/rn/src/{app,components,hooks,theme,motion,keyCommands,widget,liveActivity}`. |
| **D** | [`ROUTING-D.txt`](ROUTING-D.txt) | 40 | 10,629 | ⛔ **The instruments — the checking code the fixing itself wrote.** All of `scripts/`, plus the repo-root config no surface owns. **This is the round's headline subject; see below.** |

[`ROUTING-ORIGINS.tsv`](ROUTING-ORIGINS.tsv) gives every routed path its **lane** and its **origin**. Read
it. Your origin split is a required output and it is a lookup, not your judgement.

⚠️ **7,000–10,000 lines is more than a careful read of everything.** You are not asked to read every line.
You are asked to **point at the highest-risk part of your route and measure it**, and then to **say by path
what you swept and found clean.** ⛔ **A route you did not reach must be named as not reached.** Silence
reads as swept and is the one thing that corrupts the ratchet.

---

## ⚡ THE FOUR ORIGINS — and **report your findings split by them**

⛔ **A flat total hides both halves moving.** The app's defect count fell across the last two sessions while
**eleven defects went into the instruments**. One number would have read as progress.

| origin | what it means | count |
|---|---|---|
| **first-look** | on the surface, never swept by any pass | **125** |
| **fix-churn** | ⭐ swept by a prior pass, then **CHANGED** since its pin | **48** |
| **instrument** | on S0's inventory and changed since the pin — **what the fixing wrote** | **33** |
| **off-surface** | ⭐ changed, and on **NO** surface inventory at all | **11** |

⭐ **`fix-churn` is a bucket no prior pass had a name for, and it is the one to take seriously.**
`scripts/surface-coverage.s1.json` still records these 48 files as swept by `s1p3` — because a sweep is
recorded against a **path**, not against **bytes**. Pass 3 read a version of each of them that no longer
exists. ⛔ **The coverage instrument has been structurally blind to this for the entire audit.** *A clean
verdict does not survive an edit.*

⭐ **`off-surface` — 11 changed files that are on nobody's list.** `lint:surface-complete` proves every
tracked source file sits under *a* surface ROOT. It cannot prove any inventory CONTAINS it, because
`excluded` routes files onward to S2, S3 and S4 — **and those three surfaces have no claims file at all.**
⚡ **S1's own fixing edited three S3 files** — `apps/rn/src/data/readBackup.ts`, its test, and
`apps/rn/tests/e2e/data-recovery.spec.ts`, the `C-7`/`C-7b` restore doors — and nothing was going to read
them. Also here: the **repo-root `package.json`** *(not `apps/rn/package.json` — the basename is
ambiguous and this dispatch check caught it)*, which wires all 38 gates and no surface owns, and
**`scripts/__fixtures__/crlf-source.ts.txt`**, the sole input to the CRLF gate, invisible because
`SOURCE_EXT` has no `.txt`.

⚠️ **This is not a hint that the unswept files are where the bugs are. It is a measurement of where nobody
has looked** — and it has predicted the outcome **four** times running. S1 pass 3: **11 of its 20 blockers
and majors were first-look**, concentrated in exactly the directories the previous round's root-widening
had just admitted. ⛔ **The variable is not the tree. It is where the auditor points.**

---

## ⛔ AUDITOR D — READ THIS. The instruments are this round's subject.

**`scripts/` gained 13 files and 20 modifications since pass 3's pin: +2,654 / −332.** Eight new gates —
`lint:trust-claims` (313 lines) · `lint:ci-chain` · `lint:gate-sources` · `lint:scan-floors` ·
`lint:line-endings` · `lint:closure-stripper` · `lint:control-chars` · `lint:strip-code` — plus three test
modules and 21 plant scenarios.

⛔ **ELEVEN DEFECTS WENT INTO THIS CODE ACROSS THE TWO FIXING SESSIONS, AND NOT ONE WAS VISIBLE BY READING.**
Every one was found by planting. The eleven, named, because the shapes recur:

- a word-boundary regex escape mangled into a **literal backspace byte**
- an edit pre-flight that **never landed**
- three verifier errors that each produced **a confident verdict about nothing**
- an exemption ledger keyed so it **could never excuse the case it existed for**
- a CRLF guard that **normalised away the thing under test**
- a scope check that could not tell a MENTION from a USE, and **red on its own write-up**
- a NUL gate **blind to untracked files**
- a consumer detector **blind to the `.ts` import spelling**
- an escaping fix that **wrote a raw NUL into the file doing the fixing**

⛔ **AND THE CLASS ABOVE ALL OF THOSE: A CHECK THAT CANNOT FAIL.** `lint:trust-claims`' `MAX_EXEMPT` and
`MAX_OPEN` were `Object.keys(X).length` — caps derived from the lists they cap, so both "downward-only
ratchets" were **no-ops**, one commit after the file's own docblock warned about exactly that. ⚡ **And it
happened again while building your route:** `audit-route.ts` resolved a surface overlap by precedence and
then checked for the collision the precedence had already prevented — the `die()` was unreachable, and the
planted run went **green**. It is fixed and plant-verified; **`scripts/audit-route.ts` is on your route and
you should assume there is another one.**

⛔ **Three of four auditors independently found a gate reporting green while doing less than it claims, in
each of the last three passes.** `B1` `A3` `C-1` `D3-3` `D3-4` were pass 3's, and one of them was created
by pass 2's own fix. **Assume the fourth consecutive instance exists and go find it.**

**How to test a gate: un-fix what it guards and watch it.** Reading it has failed every time.

---

## The severity scale — use exactly these words

| severity | means |
|---|---|
| **blocker** | It ships broken. Data loss or corruption · a wrong number about the user's money · a crash or a permanently stuck screen · a statement to the user that is false about their own money or data · a once-ever moment lost forever. |
| **major** | A real user can hit it and the product is meaningfully worse: a feature that does not work, a screen that misleads, an irreversible action with no guard — **or a gate or test that cannot catch the class it exists for**, because that is how the next blocker ships. |
| **minor** | Correct behaviour, imperfect craft. **No user-visible consequence and no instrument blinded.** |

⛔ **State the user-facing consequence in one sentence for every `blocker` and `major`.** If you cannot
write that sentence, the finding is `minor`.
⛔ **A test that passes with its own defect present is `major`.**
⛔ **Do not inflate to seem thorough.** ⚡ **"No blocker or major in `<area>`" is a real and valuable
result** — say it, and say what you read.

---

## ⚡ Reading rules this project has paid for. Each names a specific miss.

1. ⛔ **A COMMENT IS A CARRIED PREMISE AND DECAYS LIKE A CARRIED NUMBER.** Pass 1's `M3` was this. ⚡ **And
   pass 2's `C2` was the inverse**: `trustSelectors`' docblock said `currentAmount` repairs on *both* sides
   of the comparison, the consumers narrowed it to one, and **the docblock was the accurate one.**
   ⛔ **Do not cite a docblock as proof of behaviour — in either direction. Print the value.**
2. ⛔ **A TEST THAT PICKS THE ONE MEMBER OF A CLASS THAT WORKS REPORTS ON THE MEMBER, NOT THE CLASS.**
   Pass 2's `A1`. **When you find a test, ask which member of its class it picked.**
3. ⛔ **A STATED MECHANISM IS A HYPOTHESIS, INCLUDING YOUR OWN.** In one round **4 findings had a sound
   observation and a wrong explanation, and for 3 of the 4 the proposed fix would not have closed the
   defect.** ⛔ **When the claim is about a computed value, PRINT the value.**
4. ⛔ **ENUMERATING SPELLINGS HAS FAILED SIX TIMES HERE.** **Judge the condition the consumer evaluates,
   never the example the finding cited.**
5. ⚠️ **SITE COUNTS UNDER-REPORT — seven consecutive items, always short** (2→7 · 9→14 · 2→5 · 663→668 ·
   118→331 · **and this round, "six new gates" → 8**). **Count the whole result, then show it.** Piping a
   search into `head` has caused this repeatedly.
6. ⛔ **A TEST WHOSE EARLIER ASSERTION REDS FIRST NEVER EXERCISES THE LATER ONES.** Say **which assertion
   carries the finding** and **whether an earlier one fires first**. ⚠️ A plant reading `MISSED` is usually
   not a miss — four times last session the plant red on an *earlier* assertion in the same block.
   **Relax the earlier assertion and re-run before believing the verdict.**
7. ⛔ **AN ABSENCE ASSERTION IS TRUE OF A PAGE THAT NEVER RENDERED.** `toHaveCount(0)` has shipped green
   over a planted bug twice here. A positive assertion must precede it.
8. ⛔ **THE OBSERVATION, THE PREMISE AND THE REMEDY FAIL INDEPENDENTLY.** Verify all three separately.
9. ⚠️ **READ THE CODE AROUND THE SITE, NOT ONLY THE SITE.** A remedy once collided with a standing decision
   three lines above it and passed every test that existed.
10. ⛔ **AN ASSERTION CAN BE SATISFIED BY SOMETHING ELSE ON THE SAME SCREEN.** A card was asserted to contain
    `$400`, and the *defective* card contained `$400` too, from a neighbouring section.
11. ⚡ **THE FIX IS THE MOST LIKELY PLACE FOR THE NEXT DEFECT.** Measured on S0: **10 of the first 16
    findings were introduced by the fixing.** ⛔ **Three times in S1.9 the fix WAS the defect class it was
    closing**, and none was visible by re-reading the diff. **`fix-churn` and `instrument` are 81 of your
    217 files and they are the highest-prior ground you have.**
12. ⚡ **ASK WHAT A RETURNED VALUE DOES DOWNSTREAM, NOT WHAT THE LINE SAYS.** `B3`'s own stated remedy —
    *"return `null` rather than an epoch date or a throw"* — **would have been the defect**: `null` is what
    `inspectRemote` reads as `none`, *"there is no copy to lose"*, which the guard **permits**.
13. ⛔ **TWO PRODUCERS OF ONE FACT IS THIS REPO'S MOST-REPEATED SHAPE.** All three of pass 3's engine
    blockers were a pair of functions computing the same number differently. **Correcting the losing copy
    leaves two producers and buys the next round's recurrence** — that is literally how `D3-3` came out of
    pass 2's `B-1` fix. **When you find a disagreement, count the producers.**

---

## ⛔ THE RATCHET — do not re-report these. EXTEND them.

Three prior passes' auditor files, each with a **"Swept and found clean — BY PATH"** section and a
**"Measured, and NOT a defect"** section:

- pass 1 — [`../2026-08-26-s1-money/`](../2026-08-26-s1-money/) `{A,B,C,D}-*.md` + [`SUMMARY.md`](../2026-08-26-s1-money/SUMMARY.md)
- pass 2 — [`../2026-08-26-s1-money-pass2/`](../2026-08-26-s1-money-pass2/) `{A,B,C,D}-*.md` + [`SUMMARY.md`](../2026-08-26-s1-money-pass2/SUMMARY.md)
- pass 3 — [`../2026-08-26-s1-money-pass3/`](../2026-08-26-s1-money-pass3/) `{A,B,C,D3}-*.md` + [`SUMMARY.md`](../2026-08-26-s1-money-pass3/SUMMARY.md)

⛔ **Do not re-open a "Measured, and NOT a defect" entry without beating a measurement with a measurement**
— not with a reading.
⚠️ **A clean verdict does not survive an edit** — which is what the `fix-churn` bucket is telling you. Every
one of those 48 files carries a prior clean verdict against bytes that are gone.

**Also standing, and to be re-stated rather than assumed:** two S0 caveats — `REVERIFY4-3`'s guard **prints,
it does not red**, and `REVERIFY4-2` was **unpinned** *(pass 3's `D3-4`; recorded fixed — verify it)*.

---

## The fix range you are verifying

```
git -C /c/Users/Jason/debt-app-v1 diff 96d1f11..e65f9c7 -- apps packages scripts
```

**102 files · +5,901 / −557.** Pass 3's finding text follows. ⛔ **The verdict is yours; the brief carries
none.** Every entry is marked with the lane its files sit in, and **your closure verdicts are deliverable ②**.

### 🔴 Pass 3's 11 blockers

| id | lane | the finding, as pass 3 wrote it |
|---|---|---|
| **A1** | A | `cannotAmortize` re-checks against the **shrinking** active-minimum sum, not the constant budget the loop spends. An ordinary car-loan-plus-credit-card plan reports *"Unable to estimate"* — Progress hero prints `—` — while the chart beneath draws that same plan clearing in **30 months**. ⚡ The sibling `buildPayoffTrajectory.ts:91` already had the correct form: **two producers of one fact** |
| **A2** | A | `buildCycleSnapshot` sums the **unscaled** BNPL minimum — History prints *"$100.00 paid"* for a cycle in which the plan asked $200 and the balance fell $200 |
| **A4** | A | `bnplMonthlyEquivalentMinimum` is gated on `type === 'bnpl'` while every per-cycle seam is gated on `isInstallmentNative` — a CSV-imported biweekly BNPL is charted at 6 months and paid down at 12 |
| **B3** | B | An `unknown` remote is let through the clobber guard **and the guard writes over it** — another install's iCloud backup destroyed, the sheet says *"Backed up"*, and the install records its own clock as the file's identity so **every later backup is refused forever**. ⛔ `npm run test:app` was green with the defect present |
| **C-1** | C | The trust table's `'row-figures'` route had **zero production consumers** — a restored backup prints *"Groceries · Counts toward reserve · $0"*, *"0% APR"* on a card charging 22%, *"$0.00/mo"* on one demanding $150 |
| **C-2** | C | The **sum** sites on the expense screens had no guard either — a total missing an unknown addend stated as a total, and one is a **recommendation** (*"of $55 recommended each paycheck"* against $1,400 of rent) |
| **C-3** | C | History's headline calls a **deleted** debt money the user *"paid down"* — *"$2,923 paid down"* in success green while the same store says they paid $0 |
| **C-4** | C | The trophy shelf asks the OLD guard while the finale asks the new one — a cleared debt whose `originalBalance` could not be read is filed as **"$0 paid off"**, and offered for sharing that way |
| **C-5** | C | The paywall states a personalised dollar fact with no trust guard — it names a **$100** shortfall on a cycle that is **$500** short |
| **D3-1** | C | The **Home-Screen and Lock-Screen widget** says *"Debt-free · 100% · $0"* over balances the app itself returns `debt-free-unverified` about |
| **D3-2** | C | **Siri and the Live Activity** say *"looks clear — $1,080 free to put toward debt"* when the obligation netted out is one the app could not read |

### 🟠 Pass 3's 9 majors

| id | lane | the finding, as pass 3 wrote it |
|---|---|---|
| **A3** | D | `test:gate-plants`' `lint:secrets` scenario plants an **untracked** file, so the modified-tracked half **added in that very fix range** stays green when un-fixed |
| **B1** | D | **`lint:money`'s two `Intl` patterns cannot fire on any real call** — `[^)]*\)` consumes through the formatter's own closing paren — and it was green over two live hand-rolled formatters carrying `$NaN` / `$0.00`-clamp drift |
| **B2** | C | The RN add/edit-debt form was the **only** APR path with no `0–100` bound — `2599` → 2599% APR, **$10,829.17/mo** interest on a $5,000 card |
| **B4** | B | The web storage adapter reads unparseable bytes as *"first launch"* instead of quarantining, and the sole e2e for that class seeds **valid** JSON |
| **B7** | B | The Sentry breadcrumb scrub redacts amounts and **passes creditor names**, with its own test pinning that as correct |
| **C-6** | C | A BNPL plan whose installment amount could not be read is listed as **one** upcoming payment instead of four, with no sign the list is short |
| **C-7** / **C-7b** | B / C | The *"Replace your data?"* confirm is **byte-identical** for an intact backup and one the reader has just recorded three losses on — **at both restore doors** |
| **D3-3** | D | The registry entry guarding **B-1's own fix** is green with that fix's defect restored — the token names the line that *computes* the check, not the line that *uses* it |
| **D3-4** | D | **`REVERIFY4-2` still unpinned** — the un-fix leaves `lint:secrets`, `lint:finding-guards` **and** `test:gate-plants` green, and the green sentence still says *"index+HEAD"* |

### The 14 minors, also recorded closed

`A5` · `B5` `B6` · `C m1`–`m7` · `D3-5` `D3-6` `D3-7` `D3-8`. ⚠️ **6 of the 14 had a remedy that was wrong,
incomplete or unnecessary** while the premises were almost always right — one **accepted the defect it
existed to catch**, one **reds a real test**, one **narrowed nothing**, two had an unnamed second half.
`m5` was refuted by `C-3`; `m3` was deferred (out of 2.0's storefronts) — ⛔ **`m3` is the one deferral, and
[D65] permits none, so say whether you agree it is out of scope.**

### `G-1`…`G-6` — found by enumeration, not by any auditor

The claim sites still on `lint:trust-claims`' `OPEN` ledger at the end of `.6.2`. ⛔ **The row named two
sites and the file held five**, one of them **blocker `B1` unfixed**; a sixth (`G-6`) was **a RED release
gate** found while verifying. `MAX_OPEN` was driven to **0**. **Verify that 0 is real and that the ledger
cannot silently regrow.**

### The 53 guard entries

`scripts/finding-guards.json` gained **53 `S1P3-*` entries**. List them with:

```
node -e "const d=require('./scripts/finding-guards.json');console.log(Object.keys(d).filter(k=>k.startsWith('S1P3')).join('\n'))"
```

⛔ **A guard entry is a claim, and this project has measured that claim false 7 times.** For every entry in
your lane: **restore the defect it names and confirm the gate REDS for the planted reason** — not for a
different reason, which has also happened.

---

## What to hand back

One file, `<YOUR-LETTER>-<area>.md`, in this directory. It must contain:

1. **Findings**, each with: severity · the user-facing consequence in one sentence · the file and line ·
   **the measurement** (a printed value, a run, a plant — not a reading) · your proposed remedy, stated as a
   hypothesis · and the **origin** of the file it is in, looked up in `ROUTING-ORIGINS.tsv`.
2. ⭐ **Closure verdicts** — a table of every pass-3 id and every `S1P3-*` guard entry in your lane, with
   `CLOSED` / `PARTIAL` / `OPEN` / `REGRESSED` / `GUARD-ONLY` and the measurement behind it.
3. **A findings tally split by origin** — `first-look` / `fix-churn` / `instrument` / `off-surface`.
4. **"Swept and found clean — BY PATH"** — this is what stops pass 5 re-litigating your ground.
5. **"Measured, and NOT a defect"** — with the measurement.
6. ⛔ **"Not reached"** — by path. Silence reads as swept.

⛔ **Do not edit source. Do not commit. Do not push.** Run plants in an isolated worktree at the pin and
say so. Pass 3's auditor D did exactly this and `git diff 96d1f11 -- apps packages scripts` came back empty,
which is how the round could be trusted.
