# S1 — MONEY · GOALS · PLAN CARDS. **Pass 3.** The brief.

**Pin:** `96d1f11` · branch `v1.7-dev` · ships as `2.0.0`. **Do not push. Do not edit source.**
**Repo:** `git -C /c/Users/Jason/debt-app-v1 …` — ⚠️ **the cwd drifts between calls; always pass `-C`, and
never use a relative pathspec.** A `git log -- scripts/x.ts` run from a drifted cwd returns EMPTY and looks
exactly like *"this file has no history."* That has happened while writing four of these briefs.

⚠️ **The pin is `96d1f11`, NOT S1.9.8's `6f93846`.** The plan said the older one. Two commits landed after
S1.9.8 and one of them (`96d1f11`, [D74]) **changed source** — `scripts/surface-coverage.ts` and
`scripts/check-gate-freshness.ts`, both S0 instruments you are asked to re-verify. Corrected before hand-over.

**Where this sits.** Surfaces converge in order — **S0 instruments ✅ → S1 money ▶ → S2 dates → S3 import →
S4 discovery → cross-surface.** Pass 1 (`bc29dfe`) returned **5 blockers · 10 majors**; pass 2 (`4b58d75`)
returned **3 blockers · 6 majors · 12 minors**. All are fixed. **This is the third re-verification.**

⛔ **CONVERGENCE = 0 blockers / 0 majors. NO DEFERRALS.** A major exits by being **fixed**, or by being
**measured** never to have been one. **A re-rating is not a proof.** S1 exits on **two consecutive clean
passes**; pass 2 reset the count, so this is the first candidate — and a clean pass 3 still owes a pass 4.

⛔ **THERE IS NO CURRENT GATE RECORD.** `lint:gate-freshness` is RED at this pin: the last recorded green
describes `818f934`, and source has moved since. **Do not quote a green.** The last full pass is `818f934`.

---

## ⚡ The one number that has predicted this every time

**The surface is 470 files. 331 have never been examined by anybody.**

```
npm run lint:s1-coverage              # 470 files · 331 unswept
npm run lint:s1-coverage -- --report
```

⚠️ **THE SURFACE IS 2.5× THE ONE PASS 2 READ — 188 → 470 files, 116 → 331 unswept.** S1.9.5 admitted all of
`packages/core` *(18 directories, 102 files — `debt` alone is 53)* and all of `apps/rn/src` *(184 files that
sat under no root at all)*. ⛔ **A brief that reuses pass 2's routing hands you the old surface.** This one
does not; see the routing manifests below.

⚡ **Five root corrections so far**: 72 → 137 → 188 → 286 → **470**. **Every single one came from widening
roots, and every time the pre-correction number looked healthier.** 331 is the honest one.

⚠️ **This is not a hint that the unswept files are where the bugs are. It is a measurement of where nobody
has looked** — and it has predicted the outcome three times running. S0: the pass that swept never-swept
ground found 5 majors while the pass sweeping swept ground found 0. S1 pass 1: 14 of 72 files had ever been
examined, and **5 blockers plus 4 app-majors came out of the other 58.** S1 pass 2: **5 of its 9 blockers
and majors were against ground no prior pass had examined** — four `never` files plus `D2-1`, which was
against a file **on no surface at all**. ⛔ **The variable is not the tree. It is where the auditor points.**

⚠️ *An earlier draft of this line said "8 of 9". It was counted from memory instead of from pass 2's own
[D69] table, and the table says 4 churn · 4 coverage · 1 off-surface. Rule 5, in this brief, while writing
it — for the second brief running.*

⚠️ **Highest-value single file on the whole surface: `apps/rn/src/utils/format.ts`** *(auditor B)*. Every
dollar figure the user reads passes through it and **no pass has ever been pointed at it.**

---

## 🔨 YOUR ROUTE — read it from the manifest, never from a prose list

⛔ **Your file list is a manifest in this directory. Read the file. Do not re-derive it from a directory
name.** The manifests were generated mechanically from `scripts/surface-coverage.s1.json` and asserted:
**331 routed · 0 unrouted · 0 duplicated · 0 missing on disk.**

| you are | manifest | files | lines | the shape of it |
|---|---|---|---|---|
| **A** | [`ROUTING-A.txt`](ROUTING-A.txt) | 75 | 7,177 | **The money engine.** `packages/core/{debt,cashflow,forecast,recovery,income,obligations,insights,history,timeline,constants,types}` — `debt` alone is 53 files. This is where a wrong number about the user's money is *computed*. |
| **B** | [`ROUTING-B.txt`](ROUTING-B.txt) | 81 | 6,669 | **How the number is spelled, dated and remembered.** `packages/core/{utils,payCycle,recurrence,storage}` · `apps/rn/src/{utils,store,storage,lib,analytics,config,types}`. Formatting, currency, local dates, the app store and persistence. |
| **C** | [`ROUTING-C.txt`](ROUTING-C.txt) | 66 | 7,297 | **The screens a user reads money off.** `apps/rn/src/app/**` · `apps/rn/src/components/**` *(except `ui/`)* · `apps/rn/src/hooks`. Where a true number becomes a false sentence. |
| **D** | [`ROUTING-D.txt`](ROUTING-D.txt) | 109 | 7,433 | **The instruments and the edges.** `apps/rn/tests/**` *(36 e2e specs, never swept)* · `components/ui` · `theme` · `motion` · `premium` · `liveActivity` · `widget` · `appIntents` · `notifications` · `keyCommands`. |

⚠️ **7,000 lines is more than a careful read of everything.** You are not asked to read every line. You are
asked to **point at the highest-risk part of your route and measure it**, and then to **say by path what you
swept and found clean** — that clean list is what stops pass 4 re-litigating your ground. ⛔ **A route you
did not reach must be named as not reached.** Silence reads as swept and is the one thing that corrupts the
ratchet.

⛔ **The enumerated route list in the plan named 118 of the 331** — it omitted `apps/rn/src/store` (24 files,
2,794 lines), the entire test tree, and five `packages/core` directories. That is the sixth instance of this
project's oldest failure. **It is why your route is a generated file and not a sentence.**

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

1. ⛔ **A COMMENT IS A CARRIED PREMISE AND DECAYS LIKE A CARRIED NUMBER.** Pass 1's M3 was exactly this.
   ⚡ **And pass 2's C2 was the inverse**: `trustSelectors`' docblock said `currentAmount` repairs on *both*
   sides of the comparison, the consumers narrowed it to one, and **the docblock was the accurate one.**
   ⛔ **Do not cite a docblock as proof of behaviour — in either direction. Print the value.**
2. ⛔ **A TEST THAT PICKS THE ONE MEMBER OF A CLASS THAT WORKS REPORTS ON THE MEMBER, NOT THE CLASS.**
   ⚡ **Pass 2's A1: every test written for `AS-3` used `topUp 200` against `shortfall 400`** — the single
   input shape where blanket-zero and netting agree exactly. **When you find a test, ask which member of its
   class it picked.**
3. ⛔ **A STATED MECHANISM IS A HYPOTHESIS, INCLUDING YOUR OWN.** In one round **4 findings had a sound
   observation and a wrong explanation, and for 3 of the 4 the proposed fix would not have closed the
   defect.** ⛔ **When the claim is about a computed value, PRINT the value.**
4. ⛔ **ENUMERATING SPELLINGS HAS FAILED SIX TIMES HERE**, most recently in this brief's own predecessor.
   **Judge the condition the consumer evaluates, never the example the finding cited.**
5. ⚠️ **SITE COUNTS UNDER-REPORT — six consecutive items, always short** (2→7 · 9→14 · 2→5 · 663→668 ·
   118→331). **Count the whole result, then show it.** Piping a search into `head` has caused this repeatedly.
6. ⛔ **A TEST WHOSE EARLIER ASSERTION REDS FIRST NEVER EXERCISES THE LATER ONES.** Say **which assertion
   carries the finding** and **whether an earlier one fires first**.
7. ⛔ **AN ABSENCE ASSERTION IS TRUE OF A PAGE THAT NEVER RENDERED.** `toHaveCount(0)` has shipped green
   over a planted bug twice here — pass 2's `D2-3` was the second. A positive assertion must precede it.
8. ⛔ **THE OBSERVATION, THE PREMISE AND THE REMEDY FAIL INDEPENDENTLY.** Verify all three separately.
9. ⚠️ **READ THE CODE AROUND THE SITE, NOT ONLY THE SITE.** A remedy once collided with a standing decision
   three lines above it and passed every test that existed.
10. ⛔ **AN ASSERTION CAN BE SATISFIED BY SOMETHING ELSE ON THE SAME SCREEN.** A card was asserted to contain
    `$400`, and the *defective* card contained `$400` too, from a neighbouring section.
11. ⚡ **THE FIX IS THE MOST LIKELY PLACE FOR THE NEXT DEFECT.** Measured on S0: **10 of the first 16
    findings were introduced by the fixing.** Pass 2 found a regression (`D2-2`) that a pass-1 fix created,
    and an over-match (`A1`) that a pass-1 fix created. **The range below is the highest-prior ground you
    have.**

---

## ⛔ THE RATCHET — do not re-report these. EXTEND them.

Two prior passes' auditor files, each with a **"Swept and found clean — BY PATH"** section and a
**"Measured, and NOT a defect"** section:

- pass 1 — [`../2026-08-26-s1-money/`](../2026-08-26-s1-money/) `{A,B,C,D}-*.md` + [`SUMMARY.md`](../2026-08-26-s1-money/SUMMARY.md)
- pass 2 — [`../2026-08-26-s1-money-pass2/`](../2026-08-26-s1-money-pass2/) `{A,B,C,D}-*.md` + [`SUMMARY.md`](../2026-08-26-s1-money-pass2/SUMMARY.md)

⛔ **Do not re-open a "Measured, and NOT a defect" entry without beating a measurement with a measurement**
— not with a reading.
⚠️ **A clean verdict does not survive an edit.** Every file the fix range touched must be re-checked **at
the changed part**, even where the ratchet covers the file.

---

## The fix range you are verifying — pass 2's nine, and the S0 instrument changes

```
git -C /c/Users/Jason/debt-app-v1 diff 4b58d75..96d1f11 -- apps packages scripts
```

**36 files · +3,333 / −368.** The finding text is below. **The verdict is yours** — the brief carries none.

### 🔴 Pass 2's blockers — all three were ONE SHAPE

⚡ **B1's rule — *never state a number about money the app could not read* — was wired to a SUBSET of claim
sites and a SUBSET of fields.** That was the round's most useful sentence. **Ask whether it is now wired to
all of both**, and whether the subset it was widened to is itself complete.

- **`C2`** — a goal whose `currentAmount` could not be read printed *"$1,000.00 left"* with no caption, under
  a hero saying *"33% funded"*. Both `money.tsx` goal consumers had narrowed the guard to
  `targetAmount === 0`. Fix in `money.tsx`, `trustSelectors.ts`.
- **`C3`** — the full-screen debt-free **finale** was gated on `celebration?.kind === 'finale'` and nothing
  else, so it printed *"$12,400 paid off · 2 debts"* over a $12,000 card the app could not read, while the
  banner correctly refused. Fix in `celebrationSelectors.ts`, `payoffCelebration.ts`.
- **`C4`** — a debt whose `minimumPayment` repaired to `0` vanished from the plan, so
  `countOutstandingRequired` honestly returned 0 and Today printed *"You're caught up for this paycheck."* in
  success green over an unpaid $5,000 card. Same class measured for expense `amount` and for `apr`. Fix in
  `migrations.ts`, `models.ts`, `planSelectors.ts`, `data-recovery.spec.ts`.

### 🟠 Pass 2's majors

- **`A1`** — `AS-3`'s remedy **over-matched and named a false dollar figure**: a user who moved $200 at the
  Guardian's suggestion and then went $1 short was told a $20 purchase would leave them *"$20 short"*, in the
  same card saying the $200 *"holds your line"*, with $199 unspent. Fix in `guardianSelectors.ts`.
- **`B-1`** — **7 of the then-57 "guarded" entries stayed GREEN with the defect restored**, three of them the
  fixes to `check-finding-guards.ts` itself. Sharpest: deleting the *call* to `presentInCode` left the
  helper, the token and the green. Fix in `check-finding-guards.ts`, `finding-guards.json`.
- **`C1`** — **the trust guard had no RESET path**: `pendingDataRepairs` was never emptied, so the graduation
  banner, Money's cleared hero and the Progress trophy were permanently withheld from a user who did exactly
  what the repairs card asked. Fix in `trustSelectors.ts`.
- **`D2-1`** — the ONE state machine's three producers disagreed on the app's own designed path: after taking
  the card's own `{gap:50, topUp:50}`, the Guardian said `clear` while `selectPlanSummary` and forecast cycle
  0 said `tight`, and "See forecast" opened on the gap the user had just closed. Fix in
  `buildMultiCycleTimeline.ts`, `forecastCycles.ts`.
- **`D2-2`** — a **regression a pass-1 fix introduced**: `undoTightTopUp('affordability')` removed the
  source's whole accumulated entry while the card's message came from `useState` — $50 cover → relaunch →
  $30 cover → Undo returned **$80**. Fix in `topUpSelectors.ts`, `store.ts`, `topup-sources.spec.ts`.
- **`D2-3`** — the only test of the no-paycheck Today was one bare `toHaveCount(0)` while its comment claimed
  *"no crash, no empty shell"*. Fix in `guardian.spec.ts`.

### The standing re-checks — S0's guards, and pass 1's

⛔ **EVERY SURFACE AUDIT RE-VERIFIES THE PREVIOUS SURFACES' GUARDS.** *A guard nobody re-checks is a guard
nobody has confirmed exists.* Pass 2's auditor A issued 23 such verdicts and 22 came back `CLOSED`; the one
that did not was `AS-3` → `A1`. **The ids are in pass 1's and pass 2's `A-*.md`.** Two S0 caveats were open
at the end of pass 2 and must be re-stated, not assumed: `REVERIFY4-3`'s guard **prints, it does not red**,
and `REVERIFY4-2` is **unpinned** *(narrowed by M7, which A measured rather than assumed)*.

⚠️ **Both of these matter to auditor D and to auditor B**: the instruments changed inside the fix range.

---

## The instruments — quote them, never type their results

```
npm run lint:s1-coverage        # 470 files · 331 unswept
npm run lint:s0-coverage        #  97 files ·  50 unswept
npm run lint:finding-guards     #  95 findings · 79 guarded · 16 unguarded (cap 16, downward-only)
npm run lint:surface-complete   #  every tracked source file under a surface root (1,207 tracked)
npm run lint:secrets            #  2 exemptions of cap 2
npm run lint:gate-freshness     #  RED at this pin — the recorded green describes 818f934
```

⚠️ **The plan's own residue table decayed for the third time while this brief was being written** — it said
*"73 findings · 57 guarded"* against an instrument reading **95 · 79**, and *"91 files · 48 unswept"* for S0
against **97 · 50**. ⛔ **Quote the instrument. Never type the result.** That is [D49], and it is the single
most-repeated defect in this project's history.

⛔ **`lint:finding-guards` is not a substitute for a plant and cannot be made into one.** It proves a token
still sits on a non-comment line. It cannot prove the assertion behind it can still fail. **Pass 2 measured
7 green entries that survived their own un-fix.** Assume there are others.

---

## How to work — and the three hard constraints

1. ⛔ **DO NOT EDIT ANY SOURCE FILE.** Not a fix, not a typo, not a comment. `git status` at the end must
   show **only your own report file**. You are measuring a pinned tree; an edit invalidates the pin for the
   other three auditors as well as yourself.
2. ⛔ **DO NOT SPAWN SUB-AGENTS.** Do the work yourself.
3. ⛔ **WRITE INCREMENTALLY.** Create your report file early and append to it as you go — do not hold
   findings in your head and write once at the end. A run that dies at 80% must still leave 80% on disk.

**Running things is allowed and encouraged** — `npx tsx`, `npx vitest run <path>`, `node -e`, and the e2e
specs. ⚡ **A printed value beats a read every time**, and three of this project's most expensive wrong
findings were confident readings of code that did something else.

**Your report file:**

| you are | write to |
|---|---|
| A | `docs/audits/2026-08-26-s1-money-pass3/A-engine.md` |
| B | `docs/audits/2026-08-26-s1-money-pass3/B-format-store-storage.md` |
| C | `docs/audits/2026-08-26-s1-money-pass3/C-screens.md` |
| D | `docs/audits/2026-08-26-s1-money-pass3/D-tests-ui-native.md` |

**Every report carries these four sections, in this order:**

1. **FINDINGS** — one block each: `severity` · `file:line` · **the user-facing consequence in one sentence**
   · what you measured *(the command and its output, not a paraphrase)* · the remedy you propose · ⛔ **the
   direction the justification runs in, and why the opposite does not apply.**
2. **STANDING RE-CHECKS** — every prior-pass id you re-verified, with `CLOSED` / `PARTIAL` / `OPEN` and the
   measurement behind it. ⛔ A re-read is not a re-verification.
3. **SWEPT AND FOUND CLEAN — BY PATH** — the paths you actually read, so pass 4 does not re-litigate them.
   ⛔ **And, separately, the paths in your manifest you did NOT reach.**
4. **MEASURED, AND NOT A DEFECT** — things that looked wrong and were not, with the measurement. This
   section is worth as much as the first one; it is what stops the next pass spending a day on the same
   suspicion.

⛔ **Return your final text as the report's own summary line only** — the file on disk is the deliverable.
