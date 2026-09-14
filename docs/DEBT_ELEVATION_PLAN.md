# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.
>
> ⛔ **EXACTLY ONE DECOMPOSED SECTION LIVES HERE — the ACTIVE item's.** Everything else is one terse row.
> Compacted [2026-08-24](archive/DEBT_ELEVATION_PLAN_2026-08-24-precompaction.md) *(1,278 lines)*,
> [2026-08-26](archive/DEBT_ELEVATION_PLAN_2026-08-26-precleanup.md),
> [2026-08-26](archive/DEBT_ELEVATION_PLAN_2026-08-26-precleanup2.md) *(1,434 → 641)* and
> [2026-09-14](archive/DEBT_ELEVATION_PLAN_2026-09-14-precleanup.md) *(1,194 → 540)* — every
> predecessor verbatim in `archive/`.
>
> **How to read this file.** **§1 ▶ RIGHT NOW** — the one thing being built, decomposed · **§2 ⏸ OPEN, but
> NOT being built** — the only other live queue · **everything after that is REFERENCE**: where v1.7 is · the
> Phase 6 order to submission · what is waiting on Jason · the decisions ledger.
>
> **The three files this one points at, and why each is not here** *(🎯 2026-08-26: "the document should be
> the source of truth and concise")*:
> [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — how every closed item went, and the full text of every
> decision · [`DEBT_ELEVATION_BACKLOG.md`](DEBT_ELEVATION_BACKLOG.md) — the deferred items, grouped by where
> they land · [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md) — every row a human must
> execute on hardware, **§14 included**.

---

## ▶ RIGHT NOW — **S1.13.7.12.6 · TRIAGE PASS 7 TO 0/0, BY CLASS.**

> ### ▶ START HERE, COLD
> **[`CLASS5-START-HERE.md`](audits/2026-09-02-s1-money-pass7/CLASS5-START-HERE.md)** — the active class's
> switch-in: the verify-first commands, the traps, and what is next. The triage's driver is
> **[`CLASSIFICATION.md`](audits/2026-09-02-s1-money-pass7/CLASSIFICATION.md)** — **137 findings · 34 blocker ·
> 55 major · 48 minor** in 12 classes. ⛔ **Pass-6 and pass-7 ids COLLIDE** — a bare id means pass 7.
> ⚠️ **Verify before acting**, and read each command's OWN summary line: the harness reports exit 0 over a red gate.

**Surface S1 · money · goals · plan cards.** ✅ `S1.1`–`S1.13.7.11` and `S1.13.7.12.1`–`.12.5` *(pass 7 itself)*
are CLOSED. ⛔ **S1 does not yet converge** — pass 6 found 123 and pass 7 found 137, and every round's
highest-yield ground has been the previous round's fixes. Detail → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

⛔ **No current gate record mid-audit ([D74])** — quote `npm run lint:gate-freshness` and CI's `conclusion`
field, never a number typed here ([D49]).

### 📋 THE 12 CLASSES OF `S1.13.7.12.6` — the fixing ORDER, one terse row each

⛔ **The instruments are repaired BEFORE anything is proven with them** — proving money fixes with instruments
already measured blind is the lesson `S1.12.5` paid for. ⚠️ Class membership is a HYPOTHESIS: re-derive it
against the code at switch-in.

| # | class | n | exit line |
|---|---|---|---|
| ✅ **.12.6.1** | **A MATCHER LOCKED TO A LINE** — CLOSED 2026-09-04 after four rounds; 3 `W*` routed to `.12.6.9`. Detail → log | 11 | the escape closed in the shared helper, one assertion iterating every gate that imports it |
| **.12.6.2** | **THE PROOF HARNESS AND THE LEDGER** — `D2-1` · `D2-4` · `D2-8`. ✅ `S5-DEADLOCK` closed 2026-09-04 | 10 | no entry counts as evidence unless its proof re-runs and MATCHES at the current sha, and a drain is possible from any state |
| **.12.6.3** | **THE AUDIT'S OWN POPULATIONS** — `D1-12` · `D2-7` · `D1-19` | 7 | one population, derived once, shared by route and exit — fixed before pass 8 is routed |
| ✅ **.12.6.4** | **THE DOUBLE-SCALED IN-WINDOW MINIMUM** — CLOSED 2026-09-06 after five `[D79]` rounds; 🎯 stopped the loop. Detail → log | 11 | one owner of the in-window minimum, asserted over cadence × debt-type on non-zero fixtures |
| ▶ **.12.6.5** | **MAY A SURFACE STATE A PROJECTED FIGURE?** — ACTIVE since 2026-09-06, decomposed below | 13 | one predicate, called by every surface, asserted by iterating the surfaces |
| **.12.6.6** | **MONEY WRITTEN OR DESTROYED** — `B2-1` · `B2-3` · `B3-2` *(`B1-2`, a blocker, closed early at `.5.7` ④b)* | 12 | every money write through one normaliser, asserted over the actions |
| **.12.6.7** | **THE SUB-CYCLE CADENCE CLASS** — `A3-6` | 5 | the reserve bounded, and the ledger rows adding up to the totals beside them |
| **.12.6.8** | **THE FIX REACHED THE MEMBER, NOT THE CLASS** — incl. `C3-7` | 12 | one assertion per class that ITERATES it |
| **.12.6.9** | **A CHECK THAT CANNOT FAIL** — incl. `W8` `W10` `W13` from class 1 · `S1-ROUTE-STALE-READ` + `S1-ROUTE-EXIT-REACHABLE` *(unfalsifiable on a swept tree — re-measure at pass 8 switch-in)* · the narrowed `prove:guards` deadlock · `R5-2`'s registry row · `R5-3`. Fixed LAST among the instruments | 21 | every assertion reachable and falsifiable, proven by planting |
| **.12.6.10** | **THE MINORS THAT REACH THE USER** *([D80])* — `A2-3` `A2-5` `A3-11` `A3-15` `C1-7` `C2-2` `C2-4` `C2-6` `C2-8` `C3-15` + a11y `C2-5` `C2-11` *(`C1-3` and `C3-14` closed in class 5)* | 16 | swept inline when a class has the file open |
| **.12.6.11** | **SEVERITY RE-CHECK, THEN FILE OR FIX** — `B2-6` · `B3-10` · `B2-4` | 3 | rated on measurement, then filed or fixed |
| **.12.6.12** | **THE LEGACY ROOT** → routes to **`P6.11`**. `D3-1`: 7 files · 12 edges · 351 lines, both written enumerations short | 4 | filed to `P6.11`'s scope, not fixed here |

### ⭐ EVERY CLASS RUNS THE SAME FOUR-STEP LOOP — **[D79]**

| | step | ⛔ non-negotiable |
|---|---|---|
| **a** | **FIX the class** — one owner of the value, and an assertion whose population is **derived from the code**, never hand-enumerated | ⛔ **iterate the class, never the member you found**. This class of miss has recurred **four consecutive rounds** |
| **b** | **A FRESH AGENT RE-AUDITS** — never the fixer, which re-reads its own premises instead of the code | it answers exactly two questions: **is each finding actually closed**, and **what did the fix break?** |
| **c** | **CUMULATIVE: the audit also covers every class already closed** | **interaction** *(shared file / import / producer with an earlier closure)* · **targeted guard re-execution** *(only guards whose pinned files moved since they were proven)* · **closure by PLANTING** *(red for the named reason — `lint:finding-guards` is a deletion detector, not a proof)* |
| **d** | **REPEAT until zero new defects ATTRIBUTABLE TO THIS CLASS'S FIXES** | ⛔ **not "zero findings"** — reservoir defects the audit passes through are filed to their own class or the backlog, or class 1 never closes |

⚠️ **Run the full gate + test suites at every class boundary** — a class-scoped audit is structurally blind to
blast radius (`C1-18`: a minor whose remedy took down all 51 CI e2e tests). ⚠️ Class 1 plants both spellings
directly rather than leaning on the gates it is repairing.

⛔ **[D80] — MINORS ARE BACKLOGGED BY DEFAULT**, kept only where they break or hinder the user *(a11y hindrance
counts)*. Classes 10 and 11 are what survives that cut.

### 🔨 `.12.6.5` — MAY A SURFACE STATE A PROJECTED FIGURE? *(the ONLY decomposed section on this doc)*

✅ **`.5.1`–`.5.6` CLOSED 2026-09-06 → 2026-09-13**, each closure planted red for its own reason. `.5.1`
re-derived all 13 *(five corrections)* · `.5.2` `C1-1` `C1-6` `C1-2` `C1-3` behind one `cushionLine` owner ·
`.5.3` `mayStateProjectedFigure` beside the projection · `.5.4` + `.5.4a`–`h` every surface routed through the
claim it states — `C3-9` `C3-8` `C3-11` `C3-13` `C1-5` `C3-5` `C3-6` *(pass 7)* `C3-1` `C3-2` `D2-12` · `.5.5`
`B1-1` · `.5.6` `C3-14`. 🎯 decisions: `C1-2` pulled forward into `.5.2` · `C3-13` fixed at the PROJECTION ·
exact claims per surface (`'paycheck-plan'`). Detail → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

| # | step | exit line |
|---|---|---|
| ▶ **.5.7** | **BOUNDARY + LEDGER DRAIN** — 13 open backlog rows routed here *(15, 2 resolved; enumerated by script)*. ✅ **Done:** ① native flows 03/08 + Siri `isPremium` — `native-e2e` iPhone tier green · ② instruments — `finding-guards --projected`, the debt-spread ledger, the claim lattice + vacuous-conjunct scan, lost fields under their names; 4 proofs registered and proven · ③ render proofs — the free `C3-8` twin, the widget's stated direction, affordability + windfall refusals; 4 plants, proofs not yet registered · ⑥ docs — the plan's quoted backlog counts dropped *(2026-09-14 cleanup)* · ④a.2 a replayed intent *(failed clear · Undo · restore · reset)* applies once — `appliedIntents.ts`, ids in the mutation's own write, carried through every store replacement; 7 plants MATCHED, proof not yet registered · ④a.3 pass-6 `C3-6` closed — the tap names its payday, and `lastHandledPaydayDate` no longer refuses the roll *(🎯 2026-09-14)*; 8 plants MATCHED, Swift compiles only at `native-e2e` · ④b census of promised future amounts, 42 files by query — three surfaces measured stating money the engine will not hold, all fixed *(🎯)*: the reserve offer asks the engine *(`B1-2`, from class 6)*, the Cash Runway's hold line reads the allocation row, the custom-pace confirmation states the funded pace; 3 plants MATCHED; the ready-by date → P6.10 · ⑤ `hero-date-fit` — the host-dependent red was a real clip *(Segoe UI put September and November on a third line)*; on web the date now sizes to its slot so every month name fits whole, and the spec asserts all twelve at the applied size *(🎯 2026-09-14)*; 2 plants MATCHED. **Remaining:** ⚠️ the countdown almost never starts → own backlog row · ⑦ **one registration batch** *(🎯 2026-09-14: ③'s four + a.2's two + a.3's three + whatever ④b/⑤ add — one `MIN_ENTRIES` raise, one reader drain)*, then boundary gates: `lint:rn` from its own line, both suites, typecheck, stale drained, pushed | every routed row closed, filed onward with a reason, or measured as not a defect |
| **.5.8** | **`[D79]` RE-AUDIT** — fresh agent, cumulative | 0 new defects attributable to class 5's fixes |

⛔ **Then `.12.7` — PASS 8**, the next first-candidate, and **`S1.13.7.13`** — the re-run that a second
consecutive clean pass needs.

⚠️ **CLASS X is a PLAN correction that blocks `P6.11`, not a triage class** *(pass-5 `D3-1` `A3-8` `D3-2` `A2-9`
`D2-9` `D2-14`)* — **the legacy root is LIVE**: `packages/core` imports out of it, and `typecheck:core` and
`test:regression` compile and execute it. Pass 7's `D3-1` measured it at 7 files · 12 edges · 351 lines.
**Re-derive it mechanically at `P6.11` switch-in; trust no written list.**

⚠️ **Two 🔴 items want a human** *(backlog)*: **`A2-7`** — what the per-debt schedule should DRAW for a
non-focus debt · the a11y warning **`A1-8`**'s repair now fires — Today and Progress report zero Guardian-band
words in the accessible tree.

### ⛔ The rules that are LIVE while S1 builds

- **[D75] AN AUDIT ROUTE IS A GENERATED SET DIFFERENCE, AND ITS BUCKETS CARRY THE ORIGIN.**
  `npx tsx scripts/audit-route.ts --surface=<s> --since=<prev pin> --out=<dir>` — never a typed list.
  Four origins: **first-look** *(never swept)* · **fix-churn** *(swept, then changed — the pass read bytes
  that are gone)* · **instrument** *(on S0 and changed — what the fixing wrote)* · **off-surface**
  *(changed and on NO inventory)*. ⛔ It asserts **every changed tracked non-prose file is routed**, which
  is the only check that can see an undercount. ⚠️ `lint:surface-complete` proves a file is under a
  ROOT; it cannot prove an inventory contains it, and S2/S3/S4 have no claims file — see `S1.10.6.10`.
- **[D74] THE RECORD IS WRITTEN AT CONVERGENCE, NOT PER ROUND.** Per fix: `typecheck` · `lint:rn -- --fast` *([D81])* · the
  unit suites · the e2e specs whose surface changed. Per round: full e2e + embed, **no record**. ⛔ Writing
  *"the gate is green"* on a surface with open findings claims releasable on a tree the audit says is not.
  ⚠️ **Mid-audit there is no current record** — say so, and name the last full pass; never quote a stale one.
- **[D65] CONVERGENCE = 0 blockers / 0 majors. NO DEFERRALS.** A major exits by being **fixed**, or by being
  **measured** never to have been one — a re-rating is not a proof.
- **[D68] EVERY AUDIT PASS IS RUN BY FRESH AGENTS.** The driving session writes the brief and records the
  result; **it never performs the pass itself.** ⛔ **No verdict in the brief** — hand over the finding text,
  the fix range, the ratchet and the attack points. ⛔ The dispatch is part of the audit: every path and id in
  a brief is verified before hand-over.
- **[D69] A FIRST-LOOK FINDING DOES NOT RESTART THE COUNT.** A blocker/major against a file no prior pass
  examined is a **coverage** result; the count only ever measured churn. It carries into the next surface
  run's standing re-check. ⛔ **Exempt from the count is NOT exempt from the fix.** ⚠️ Mechanical, from the
  surface inventory — never the auditor's judgement.
- **THE LOOP:** fix a surface → re-verify it in the background against a **PINNED SHA** → repeat until **TWO
  CONSECUTIVE CLEAN PASSES.** Order **S0 instruments ✅ → S1 money ▶ → S2 dates → S3 import → S4 discovery →
  cross-surface.** ⛔ Per-surface convergence is not sufficient — blocker 1 spans two surfaces.
- **[D77] `lint:finding-guards` RUNS AFTER EVERY FIX — the DETECTION half, not the re-proving.** 24s, and
  its staleness check is static *(a recorded sha against the file's last-touching commit)*. ⛔ **Re-proving
  stays BATCHED at the class boundary**: one file touched five times needs ONE re-proof, so per-fix is
  strictly more plants and each executes `test:app`. ⚡ `S1.13.7.11` voided two guards **one commit** after
  proving them and went stale three more times — the gate caught all four, so what this buys is finding out
  while the file is still open, not preventing an escape.
- **EVERY SURFACE AUDIT RE-VERIFIES THE PREVIOUS SURFACES' GUARDS** *(🎯 2026-08-26)* — that is what makes
  findings ratchet the way coverage already does. A guard nobody re-checks is a guard nobody has confirmed exists.
- **EVERY FIX IS PLANT-VERIFIED**, the plant confirmed to have **LANDED**, and re-run with the earlier
  assertion relaxed — a plant that reds early never exercises the later ones. ⛔ **State the direction each
  fix's justification runs in and why the opposite does not apply**; both blockers came from skipping that.
  ⛔ **A metric moving the right way is not evidence until you check it measures the DEFECT, not the FIX.**
- ⛔ **DO NOT EDIT SOURCE WHILE `validate:release:rn` IS RUNNING.** The record is written at the END and
  fingerprints the tree *then*, so a mid-run edit records a green over code the suites never saw — [D49]'s
  own failure mode wearing a new face. The fingerprint covers `apps/rn` · `packages/core` · `scripts` · the
  workflows · `.maestro` and four root files; **`docs/` is excluded**, so prose is safe to edit mid-run.

### The residue — mechanically tracked · ⛔ read it from the gate, never from this table

⛔ **THIS TABLE NO LONGER CARRIES NUMBERS, BY DESIGN.** It decayed **three times** — *"34 · 18"* against an
instrument saying **36 · 20**, then *"73 findings · 57 guarded"* against **95 · 79** and *"91 · 48"* against
**97 · 50** *(both caught 2026-08-26 while writing the pass-3 brief)*. ⚡ **A number typed here has never once
survived to be read.** Run the command. What the table keeps is the part a command cannot tell you.

| ledger | where it lives | command | what the command will not tell you |
|---|---|---|---|
| unguarded findings, **both floors strict equality** *(M8)* | `scripts/finding-guards.json` | `npm run lint:finding-guards` | ⛔ **Green ≠ guarded.** It proves a token sits on a non-comment line; pass 2 measured **7 green entries that survived their own un-fix**, three of them the fixes to the checker itself. ⚠️ Adding a guard is a two-line edit — the entry **and** `MIN_ENTRIES` |
| S0 files never swept | `scripts/surface-coverage.s0.json` | `npm run lint:s0-coverage` | **The test RUNNERS and the shot recipes joined S0 after it had converged.** [D70] closed S0 on *instruments-sound*, and a runner nobody read is an unaudited instrument |
| S1 files never swept | `scripts/surface-coverage.s1.json` | `npm run lint:s1-coverage` | ⚡ **Five root corrections**: 72 → 137 (M9) → 188 ([D73]) → 286 (`packages/core`) → 470 (`apps/rn/src` entire). **Every one came from widening roots, and every time the pre-correction number looked healthier.** ⛔ The class is closed by `lint:surface-complete`, not by this row |
| ⚡ **files invisible to EVERY surface** | `scripts/surface-coverage.ts` *(`NOT_SOURCE`)* | `npm run lint:surface-complete` | Cap is **downward-only** and sourced from `git ls-files`, so build output and symlinks cannot appear and a new file cannot widen it. ⚠️ The legacy-tree skips **expire**: a skip naming a deleted directory reds |
| secrets exemptions, `MAX_EXEMPT` **self-ratcheting** *(reds above AND below — a stale entry reds)* | `scripts/secrets-exemptions.json` | `npm run lint:secrets` | ⚠️ Writing an audit report? Run **`npm run lint:secrets:authoring`** before committing it *(M10)* |

---

## ⏸ OPEN, but NOT being built

| # | item | notes |
|---|---|---|
| **.11.19** | 🔴 **THE CLOSURE LEDGER** — drive both `MAX_UNTOKENISED` caps to 0, then flip `lint:closure` to gating | ⚠️ Scope re-measured at S0.1: **not "the 51" but 142** — `[D37]` 55/55 + P6.8 48/48 untokenised, plus 39 in no ledger at all. ⛔ A cap only ever goes **DOWN** |
| **.9.3** | **Re-check the GATED CLASSES** | `lint:contrast` · `lint:type-scale` · `lint:icon-glyphs` · `lint:apostrophes` · native-a11y-props. ⛔ **The classes c/d/e closed as LISTS were never gated at all** — that is where the residue is |
| **.9.5** | **Work the filed queue** | **27 items** routed across the cluster, in the backlog below. ⚠️ Triage first — several are sweeps whose scope is the real question |
| **.9.6** | **The mechanical exit criterion** | `lint:closure` clean on blocker+major. ⛔ It reads clean for the wrong reason if an instrument is blind — how P1's seven majors stayed invisible; `.11.10` measured **12 of 87** traceable only because their id appears in a SYNTHESIS heading |

**Exit (P6.8.9):** every finding passes **pinned** — a test that would fail on its original defect, or an
explicit device row saying why no test can reach it; the gated classes re-checked; `lint:closure` clean
**for a reason, not by construction**.

### ✅ Closed on the way here — detail → log

✅ **`.11.1`–`.11.17`** CLOSED 2026-08-24/25 · **`S0.1`–`S0.13`** CLOSED 2026-08-25/26 · 🎯 **S0 CONVERGED
2026-08-25** on [D70]'s *instruments-sound* exit, verified by S1's pass 1.

---

## Where v1.7 is

| | |
|---|---|
| **State** | Phases 0–3 · 3.5 · 3.7 · 4 · 3.8 ✅ · the whole-app audit gate ✅ ([D37] 55/55, `lint:closure` in CI) · **Phase 5 ✅ CLOSED**, cutover conditionally approved. **Phase 6 is everything that remains** and it ends at ASC submission |
| **Ships as** | **`2.0.0`** ([D38]). The internal workstream keeps the name *"the v1.7 Elevation"* |
| **Gate** | `validate:release:rn` — e2e + embed + `test:stamp` + lane checks, `lint:glossary` · `lint:money` · `lint:apostrophes` · `lint:closure` · `lint:secrets` · `lint:sandbox` · `lint:contrast` · `lint:type-scale` · **`lint:icon-glyphs`** · **`lint:month-arithmetic`** · **`lint:press-opacity`**; tsc + lint clean (`apps/rn` at `--max-warnings=0`), zero `error-context.md`. ~15 min locally. ⛔ **[D49] — the gate RECORDS ITSELF. Never type a result here**: `npm run lint:gate-freshness` answers in under a second whether `gate-status.json` still describes the tree. ⚠️ A record can be written on a **dirty** tree: the fingerprint identifies what was tested, the SHA does not. ⛔ **The harness reports exit 0 on a RED gate**; read the gate's own summary line |
| **Env** | `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` · e2e `npm run test:e2e:rn` |

⛔ **TWO LINES, NOT ONE ([D39]/[D52]): FEATURE LOCK ≠ FREEZE.** **FEATURE LOCK closes after P6.10** — the
last gate that can *find* a structural gap; past it a gap defaults to **2.1**. **CODE FREEZE closes after
P6.18** — the last step that can *produce* a change, so **P6.19's final build comes off a frozen tree**.
⚠️ **P6.20 is the one named way to break it** (a visual problem in the assets costs another build); that
residual is unavoidable and is why P6.18 must be taken seriously.

⚠️ **Numbering legend — two older labels are kept, not renamed.** `P6.n` is this decomposition's sequence.
**"6.C" (cloud backup) = P6.3** · **"6.5" (repo consolidation, was 5.5) = P6.11**, so a log entry or commit
naming `5.5.1` means **P6.11.1**. 🔒 = ship-blocker.

---

## ▶ Phase 6 — the order to submission *(🎯's own order, settled 2026-08-19)*

| # | Step | State |
|---|---|---|
| ✅ | **P6.1** version → `2.0.0` | CLOSED 2026-08-20 |
| ✅ | **P6.2** feature-lock boundary = the **62** in [`REMAINING.md`](audits/2026-08-17-v1.7-audit-gate/REMAINING.md) | CLOSED 2026-08-20 ([D39]); parser verified lossless, T9–T11 retired as drivers |
| ✅ | **P6.3** cloud backup *(= "6.C")* | CLOSED 2026-08-21 — ships, **not** premium-gated, **verified on hardware by 🎯** incl. the clobber guard. ⛔ P6.9 still owes [D41]'s `PRIVACY_CLAIM.body` rewrite |
| ✅ | **P6.4** the 62 filed findings | CLOSED 2026-08-20, [D42] satisfied. **29 of 62 were not work** |
| ✅ | **P6.5** Sentry | Scrub BUILT + DSN DELIVERED 2026-08-20 → Sentry **ships live in 2.0.0** ([`DEBT_SENTRY_SETUP.md`](DEBT_SENTRY_SETUP.md)). ⛔ Source-map upload stays **OFF** — a missing `SENTRY_AUTH_TOKEN` hard-fails the ARCHIVE. ⚠️ Owes: the ASC privacy label must declare Diagnostics → Crash Data (→ P6.9/P6.21) |
| ✅ | **P6.6** splash screen | DONE 2026-08-20, row 1 passed on the badge version. ⚠️ **[D51] supersedes it with a light/dark pair** — splash re-runs on the next device build |
| ✅ | **R4** the demo wrote to the real store 🔒 | CLOSED 2026-08-21 — refused **by construction** (`createDebtStore` `opts.refuse`), 15 sites, `lint:sandbox` |
| ✅ | **P6.7** CI / Pages ops | CLOSED 2026-08-21 — tag trigger retired · the Pages deploy `guard` job (`release/v1` **and** [D44]'s green-`web-e2e`-for-this-SHA) · [D49] `gate-status.json` + `lint:gate-freshness`, mutation-verified |
| **P6.8** ▶ | **[AUDIT GATE] Pre-release best-in-class FINISH sweep** | ▶ **The audit half and the whole BUILD (a–g) are CLOSED.** What remains is **P6.8.9** — decomposed at the top of this file. ⚠️ **This is the only WHOLE-APP audit gate**; P6.9 (egress) and P6.10 (money) are narrower lenses, so a low finding count means something different in each |
| **R5** | 🔴 **The expense reserve belongs IN the plan** *(2.0 feature — **[D54]**)* | Shape settled 🎯 2026-08-21: a **recommended-action row that can be declined**. ⛔ Build **through the existing `expenseReserveHeld` setter** — a second writer is how three free display behaviours stop being free. ⚠️ The Plan surface is NEW → must clear **P6.10**. Two residuals open (per-cycle vs permanent decline · whether the transition cycle is stated). Not started; decomposed at switch-in. Detail → log |
| **P6.9** | ⭐ **[AUDIT GATE] Privacy / data-flow audit** | Trace EVERY egress and prove [D41]'s claim literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs. Owns retiring *"100% private"* and the ASC privacy label. 🔴 **P6.3 hands it a live counterexample** — `PRIVACY_CLAIM.body` still says *"stays on this device"*. ✅ **Scope re-verified 2026-09-02 against the surface program — SURVIVES WHOLE:** egress is not one of S0–S4, and the payload is deliverables no lane produces, incl. the cross-repo marketing page **A2-5** measured as audited by NO lens. Detail → log |
| **P6.10** | ⭐ **[AUDIT GATE] Pre-submit functional + FINANCIAL-correctness money lens** · 🔒 **FEATURE LOCK CLOSES HERE ([D52])** | 🔴 **OWES C1's SECOND HALF** — `capturePayday`'s `opts.actualIncome` has **no production caller**, so `LeanSuggestionCard` is unreachable by construction and **nothing in the suite reds when this is forgotten** (absence is what no test reports). Marked at `substrateProducers.ts`. ⛔ **Last gate that can FIND a structural gap.** Boundary inputs across the engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios. ⛔ **Owns two carried defects:** `bulkMarkRequired.ts` writes pre-[D2] paid semantics · `appliedTopUp` is a manual-opt-in invariant every cushion reader must remember. Its filed queue is in the backlog below. ⚠️ **Scope re-verified 2026-09-02: the SWEEP half is absorbed by S1+S2+S3, the GATE is not.** ⛔ **Re-derive any residual sweep at switch-in from `audit:read-coverage`, never from this row** — its boundary-input list is those three surfaces almost line for line, so re-running it as written is a pass that cannot fail. Survives regardless: the feature-lock **line** *(governance, not an audit)* · the filed queue's open money-semantics **decisions** · the classes no instrument can see *(WebKit flex-controls, device-only)*. Detail → log |
| **P6.11** | **Repo consolidation** *(= "6.5")* — **delete the legacy tree** | ⛔ **Last possible moment, by design** (🎯: *"I do not want to take any chances at all of us deleting something from legacy that is still needed but missed"*). ⚠️ **Must be FINISHED before the final build**, and its scope re-verified against the CURRENT tree at switch-in. ✅ **P6.11.2 settled — the monorepo stays** ([D45]) · ✅ P6.11.4 done early. **Remaining:** remove the root Capacitor/Next surface *(retires `validate:release:legacy`, the root Next lint, the legacy demo-mode test references, `tests/visual/*.cjs`, one of the two screenshot mechanisms)* · move tooling/CI/docs to the consolidated tree · **split `DEBT_ELEVATION_LOG.md`** (18.4k lines). 🔴 **Carries P6.4.6's delete-with-the-tree obligation** — see the backlog |
| **P6.12** | **`validate:release:rn` GREEN after the deletion** | ⛔ The guard the move created. Removing an entire surface is exactly the change that breaks the remaining one |
| **P6.13** | **CM build cut** | ⛔ **`QA_TOOLS` STAYS ON.** The device pass rides `qaEnabled()` instruments; flipping it *"to be safe"* deletes the instruments the pass needs |
| **P6.14** | **FINAL DEVICE PASS** — on the post-deletion binary | 🔒 Human-ticked, non-gating. Ledger below; the runnable truth is [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md) |
| **P6.15** | **Defect fix** | Whatever P6.14 turns up |
| **P6.16** | ⭐ **[AUDIT GATE] The final audit** *(🎯: "final final final")* | ⚡ **Because fixes are changes, and changes are unaudited** — every straight-line plan ships the last round of fixes unexamined |
| **P6.17** | **Fixes + flip `QA_TOOLS` to false** | 🔒 Deliberately **last and smallest**: `git grep QA_TOOLS` must show the instruments gone **and** nothing depending on them. Takes its own `validate:release:rn` |
| **P6.18** | ⚠️ **TARGETED device re-check** · 🔒 **CODE FREEZE CLOSES HERE ([D52])** | Only the rows touching what P6.15/P6.17 changed. ⛔ Anything native has **no off-device proof at all**. Collapses to nothing if the fixes were pure logic or copy |
| **P6.19** | **FINAL BUILD** | |
| **P6.20** | ⭐ **Screenshots + App Preview FROM that build** | ⚡ A frozen UI is not a **binary** — the assets come after the build. ONE 886×1920 file, 15–30 s, off the proven capture pipeline |
| **P6.21** | **ASC submission** | Listing · release notes *(lead with the 2.0 rewrite)* · privacy label declaring RevenueCat **and Sentry crash data** · **availability = US · CA · AU · NZ** *(🎯 2026-08-20)*. ⛔ **`£`/`€` storefronts are OUT of 2.0** — see the backlog for what they cost · ⚠️ App Review paywall-findability: the notes MUST say *"Tap ••• More → Unlock Premium"* · the assets from P6.20 · the launch-FLIP value gate · ⚠️ **A2-5** — the ASC-registered Marketing URL index page (`jsnyde03.github.io/debt-planner-site/`) was audited by **NO lens** and almost certainly repeats the same premium block the listing carries → [`DEBT_SITE_COPY_2.0.md`](DEBT_SITE_COPY_2.0.md) · 🔴 **[D64] — the marketing page that HOLDS THE EMBED ships with 2.0.** ⛔ Cross-repo (`jsnyde03/debt-planner-site`), by hand, and it makes the embed's repo-named URL user-visible in an `iframe src` — **a brand call with a DNS dependency, now needed BEFORE submission** |

**Exit:** `2.0.0` submitted to App Review off a build that passed P6.18, with `validate:release:rn` green on
the shipping configuration and `QA_TOOLS` off.

### ⚠️ Why this is an ORDER and not a list

⚡ **P6.8 → P6.15 → P6.16 is a convergence LOOP**, and it is 🎯's addition rather than mine: a device pass
produces fixes, fixes are unaudited changes, so the audit runs *again* after them. ⛔ **Getting P6.8 early**
buys a second sweep; ⛔ **getting P6.9 early** turns a settled decision into a discovery mid-audit.
⚠️ **Residual, named rather than hidden:** the binary that ships is not byte-identical to the one
device-passed, because the `QA_TOOLS` flip comes after — which is why the flip is last, minimal and
separately gated ([D46]). Full reasoning → log, *"THE ORDER TO SUBMISSION"*.

---

## ⏸ Waiting on Jason

▶ **The actionable list is [`DEBT_2.0_YOUR_STEPS.md`](DEBT_2.0_YOUR_STEPS.md)** — every step needing a human,
an Apple login, a device or a decision, in the order it is worth doing. This section is the **reasoning**;
that file is the **checklist**.

**Open decisions — none.**


**Still genuinely open, and it is not a decision — it is a MEASUREMENT:**

- ⚠️ **[D60] — the v1.6 SILENT LOOP stays with P6.14 to ANSWER, not to guess.** 2.0 if the device pass
  shows a real skip, otherwise 2.1; Sentry reports every inconclusive skip, so the pass produces the
  evidence. ⛔ **`.11.10` sharpened what to look for, and `.11.17` MEASURED it still live:** if a WebKit
  container can produce a **total** decode failure, `isConfirmedFreshInstall` consults neither
  `droppedRows` nor `opened[].rows` — the container is called terminal, the retry is consumed, and the
  **entire v1.6 portfolio is stranded while the app says "fresh install."** ⚡ **One log line on the
  existing device probe decides whether this is a major or a blocker.** → **P6.10 / S3**.


**Owed by 🎯, not decisions**

- The ASC privacy label declaring **RevenueCat** and **Sentry → Diagnostics → Crash Data** *(→ P6.9/P6.21)*
  · AU/NZ availability · the App Review note naming the paywall path · the launch-FLIP value gate *(→ P6.21)*.
- ⏭ **What the NEXT device build owes** *(later, not blocking)*: **[D51]**'s light/dark splash *(supersedes
  the badge version row 1 passed)* · **Sentry capture** *(the QA test-event button rides this build — there is
  no user-triggerable `reportError` path, so a missing event would read as "Sentry is broken")* · **R3's demo
  exit**, twice-fixed · rows **1 and 7** of [`DEBT_DEVICE_PASS_2026-08-20.md`](DEBT_DEVICE_PASS_2026-08-20.md).
  Fixes → **P6.15**.

⚠️ **Nothing about the splash, Sentry capture or R3 is proven off-device** — the web suite exercises the
*unavailable* branch by construction. **Cloud backup is the one that is now genuinely proven.**
⛔ **NOTHING IS BLOCKED ON A DEVICE** (🎯 2026-08-21).

✅ **Everything else in this section is answered** — answers live in the Decisions ledger below. ⚠️ This list
decays one way: re-check before presenting anything here as open.


---

## 🎯 Reported from the app — found by USING it, not by the lane

⚠️ **`R#` means two different things in this file.** In THIS table it is a 🎯 report from using the app. In
the P6.8 rows it is one of the audit's six **refuters** (`audits/2026-08-21-p6.8-finish/refutations/`). The
series overlap and neither is renamed; read the section, not the number.

| | Report | State |
|---|---|---|
| **R5** | **The expense reserve is advice the plan then ignores** — $349 recommended to hold out, appearing nowhere on Today | ✅ **SCHEDULED — [D54], a 2.0 feature**, own Phase-6 row above. ⛔ My first filing was wrong and 🎯's model was right: the action, the hold and the projection effect **all exist and work**. Wrong is the **PLACEMENT** and the **DEFAULT** |
| **R4** | **The demo MUTATES THE REAL STORE** 🔒 | ✅ CLOSED 2026-08-21. ⛔ **Reported by Sentry from TestFlight** — the first time telemetry out-performed both the suite and the lane. `demo-containment.spec.ts`'s 14 tests assert navigation containment; **none asserted write containment** |
| **R3** | **The demo strands an EXISTING user** | ✅ CLOSED in TWO passes — and the first only half-fixed it. ⛔ **A relabel answers "what does this mean now I've found it", never "can I find it"**; the exit stayed `caption`-sized until P6.4.4 made it a `Pill` |
| **R2** | The expense set-aside is uncoachable · living expenses undiscoverable | ✅ DONE = 3.8. The Money door existed but was gated on `livingTotal > 0` — visible only to users who had already found the feature |
| **R1** | Money's edit sheets had no date **picker** | ✅ DONE. `DateField` at all 4 sites; folded in a `todayLocalISO()` that returned **yesterday** east of UTC |


---

## ⚠️ Open threads — each has an owner

**Lane residuals — Phase 6 as known issues, none gating:**
- ⛔ **The iOS driver stall has happened TWICE and its retry does not clear it** — zero flows after paying a
  full build, indistinguishable from a real red in exit code and cost. **Check for that warning line before
  diagnosing any iPhone-tier failure.**
- ⚠️ The boot poll that replaced `sleep 25` **does not fire** · the XCUITest probe went **1 min → 11 min** on
  iPhone *(suspect: `descendants(matching: .any).count` ×3)*.
- ⚠️ **Two of the 15 flow files MEASURE rather than cover** (`i01-ipad-boot`, `11-reduce-motion`) — any
  re-derivation that counts files overstates itself. **§12.0.7 is unclaimed.**
- ⚠️ **The Reduce-Motion probe's answer lives only in a PNG** — Maestro dumps a hierarchy on FAILURE only.
  *A probe whose result a human must look at cannot gate anything.*
- ⛔ **The `toISOString().slice(0,10)` off-by-one is OWNED BY T3** — measured at **9 production sites, not
  ~4**, including `recurrence/rolloverPayCycle` *(the error compounds every cycle)* and
  `payCycle/getNextPaycheckDate`. L0-2 · L5-9.

**a11y, owed to the premium sub-audit:**
- ⭐ **`hitRegion` = 2 real findings, on BOTH tiers** — two hit targets below the minimum, reproducible,
  *characterised* (`"Hit area is too small"`) and still **unlocated**: `compactDescription` does not name the
  element. `issue.element` can be added at low risk — ⛔ **the nightly answers it for free**, so it is not
  worth a dedicated ~50-min dispatch.


---

## Phases — status

| Phase | Scope | Status |
|---|---|---|
| 0–3 | Design foundation · surface · premium substance · delight + native | ✅ COMPLETE |
| 3.5 | Interactive tutorial + bounded demo + the marketing embed | ✅ COMPLETE 2026-08-17 — embed live; device pass folded into Phase 6 at [D35] |
| 3.7 | Fold-in block (ledger clearance) | ✅ COMPLETE 2026-08-11 |
| **4** | **Quality (test harness)** | ✅ COMPLETE 2026-08-17 on a green `32051842661` |
| **3.8** | **The expense reserve** | ✅ COMPLETE 2026-08-17 — both tiers [D36]. **5 defects found while building** |
| **—** | **Whole-app cohesion + best-in-class + wording audit gate** | ✅ COMPLETE 2026-08-19 — [D37] 55/55 high+ traceable, 3 new lint gates |
| **5** | **Data continuity + cutover** 🔒 | ✅ COMPLETE 2026-08-19 — migration **verified on a live device**, cutover **conditionally approved** |
| **6** | **Launch-ready** | ▶ **ACTIVE** — P6.1–P6.21 above |
| 6.5 | Repo consolidation | inside Phase 6 as **P6.11** — deliberately last, finished before the final build |


### ⚠️ Standing constraints

- **⛔ BATCH THE NATIVE LANE** — `workflow_dispatch` + tags + the **07:00 UTC nightly**. 🎯 2026-08-13: *"we
  just need to not kick off the manual Maestro build every time."* Run it at a human-chosen batch boundary.
  ⚠️ Iterate with `-f device=ipad` — skips the ~10-min iPhone suite.
- ⚠️ **A VERDICT IS A CLAIM ABOUT WHAT IS POSSIBLE, and this lane has been wrong about that repeatedly.**
  **A `[D]` that is really an unproven `[M]` keeps a check on the manual pass forever.** Seeded verdicts are
  a **hypothesis per row**.
- **`QA_TOOLS = true` ships in TestFlight and MUST be flipped false before submission** (`git grep QA_TOOLS`).
  The instruments are `qaEnabled()`-gated, so the flip must confirm they vanish **and** nothing depends on
  them. ⛔ **Never let a coverage row ride a QA door.**
- **Never push to `release/v1`** without 🎯 — it is the default branch and gated on a live, approved version.
  **v1.6 lives on `origin/v1.6-dev`.**
- **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT · `react-native-ios-utilities ^5.2.0`.
- **v1.7 ships as ONE release.** Nothing launches until Phase 6 is done and Jason is satisfied.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

**Test-harness traps, each of which cost a real cycle:**
- ⛔ **The e2e suite has produced a broad red that was mostly noise THREE times** (203 · 64 · 3 false
  failures) with three different causes — a SIGTERMed webServer · no stray process at all · the machine
  sleeping mid-run. ⭐ **Re-run failures in isolation before believing any broad red — never INSTEAD of
  reading them.** That same red also carried 2 real defects that reproduced in 3.6 min.
- ⛔ **`cmd; echo EXIT=$?` reports the ECHO** — and the harness's own *"completed (exit code 0)"* reported
  that echo twice while the gate had exited 1. **Read the gate's summary line and `gate-status.json`.**
- ⛔ **`seedStore` re-seeds on EVERY navigation** (`addInitScript`) — use a `seedOnce`.
- **`page.goto` is a full reload and autosave is debounced 500 ms** — poll the persisted store.
- **Coach marks intercept pointer events** — seed `prefs.coachMarksSeen`.
- **A debt's minimum is a REQUIRED row**, so `outstanding > 0` for any plan with a debt — seed `debts: []` to
  reach a zero-state.
- ⛔ **`adjustsFontSizeToFit` is a no-op** and `announceForAccessibility` is an **empty function body** in
  react-native-web; `CLOUD_BACKUP_SUPPORTED` is false there. All three are P6.14 rows **by construction**.

---

## 📋 P6.14 — the device-QA ledger *(index)*

Verify on real hardware; web cannot cover these. ⛔ **The rows themselves live in**
[`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md) — §11 · §12 · §13, the 60
coverable-not-built rows, 3.5's folded-in pass ([D35]), and **§14**, which is where this page's own
ledger moved on 2026-08-26. ⚠️ Read figures from [`audits/coverage-split.md`](audits/coverage-split.md),
never from a doc quoting them.

⚠️ **The highest-value row still decides a premium feature: P6.8.7e.5 [C4]** — does the Live Activity ever
appear for a premium user with Payday Countdown ON who does not re-save the paycheck sheet. *(`.5.7.4a`
measured why it almost never would: the countdown counts from `currentDate` — backlog.)*

## Deferred backlog *(index)*

⛔ **The register is [`DEBT_ELEVATION_BACKLOG.md`](DEBT_ELEVATION_BACKLOG.md)**, grouped by where each item lands
— P6.8.9 · P6.10 · P6.9 · P6.11 · 2.1 · INTERNATIONAL · tooling · a later tier · not yet routed. Counts are read
from the register, never typed here. ⚠️ **Not-yet-routed is a state, not a shelf** — each destination's
switch-in owes a pass over that group.

## Decisions

⛔ **A ✅ means the CALL is settled, not that the work shipped.** One line per ruling; the full text of every
entry — reasoning, measurements, 🎯's words — is in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) under
*"Plan cleanup · 2026-09-14"*. ⚠️ **`[D65]` names two rulings** — the convergence rule under *the rules that are
LIVE* and the downward-balance ruling below; neither is renamed.

**Phase 6 — launch**

- **[D81]** ✅ 2026-09-14 *(🎯: "Running the full lint:rn after each fix seems like overkill")* — **per fix,
  `npm run lint:rn -- --fast`**: every static gate, with the five gate SELF-TESTS skipped and named in the
  summary. **Full `lint:rn` at each sub-step's close, and whenever a gate script, `scripts/lib/` or the proof/plant
  harness changed**; CI unchanged. Amends
  [D74]'s per-fix cadence.
- **[D79]** ✅ 2026-09-02 — **convergence goes PER CLASS**, each class re-audited by a fresh agent, cumulatively,
  until zero new defects come from its own fixes; a final full pass is still owed. Supersedes [D65]'s shape.
- **[D80]** ✅ 2026-09-02 — **a minor is backlogged by default**, fixed only if it breaks or hinders the user
  *(a11y counts)*; a money-shaped minor gets a severity re-check before filing.
- **[D78]** ✅ 2026-09-02 — [D74]'s never-retry rule narrowed: **retry only where the measurement provably did not
  happen** *(a web server killed before any assertion)*, cap 6, every retry printed.
- **[D77]** ✅ 2026-09-02 — **re-proving guards stays batched** at the class boundary; staleness detection
  (`lint:finding-guards`) runs per fix.
- **[D76]** ✅ 2026-08-28 — **S0's convergence stands**; its unswept remainder is a routing bug fixed in
  `S1.11.6`, not a reopening.
- **[D74]** ✅ 2026-08-26 — **the gate record is written at convergence, not per round.** Per fix: typecheck ·
  `lint:rn -- --fast` *([D81])* · the unit suites · the e2e specs whose surface changed.
- **[D73]** ✅ 2026-08-26 — **the test tree is on an audit surface.**
- **[D72]** ✅ 2026-08-26 — **`lint:secrets` gets a content-hashed exemption ledger**, not a redacted report or a
  `docs/` carve-out.
- **[D71]** ✅ 2026-08-26 — **`GoalSheet` does not offer a second emergency fund**; stored `type` is never rewritten.
- **[D67]** ✅ 2026-08-26 — **a closed finding needs a standing guard**, or a written reason it cannot have one, or
  it is not closed.
- **[D66]** ✅ 2026-08-25 — a second emergency fund is called **"Savings"** on all three screens.
- **[D65]** ✅ 2026-08-25 — **a balance corrected DOWNWARD asks at the edit** whether it was paid down or wrong. → S2.
- **[D63]** ✅ 2026-08-25 — **no BNPL carve-out for the high-water mark**; a stamp can only raise the total.
- **[D62]** ✅ 2026-08-25 — **`originalBalance` is a HIGH-WATER MARK**; the name is kept for 2.0.
- **[D61]** ✅ 2026-08-25 — **a second `emergency` goal is funded**, through the savings rungs.
- **[D64]** ✅ 2026-08-25 — **the marketing page that holds the embed is part of 2.0's ASC prep** — cross-repo
  (`jsnyde03/debt-planner-site`), and it makes the embed URL a brand call with a DNS dependency. → **P6.21**.
- **[D60]** ✅ 2026-08-25 — **seven open calls closed as a batch:** defer `L1-20`'s sweep, take the token ·
  `L4-13b` no `PressableScale`, fix the 7 inline opacities · build `P1-4` + `P1-5` · shoot `P1-1`'s finale before
  P6.10 · accept `D-2` · the goal pace editable in `GoalSheet` · defer CSV `MM/DD/YYYY` · `P1-10` → 2.1 · the
  v1.6 silent loop → P6.14 to answer.
- **[D59]** ✅ 2026-08-24 — **C7 compares the CLEAR ORDER, not the curve**; total interest was not measured.
- **[D58]** ✅ 2026-08-24 — **`P1-3` is in 2.0**, built at g.4 before C7.
- **[D57]** ✅ 2026-08-22 — **one surface for "could not read it"**: `pendingDataRepairs`.
- **[D56]** ✅ 2026-08-22 — **a corrupt-store reset blocks before onboarding; a repaired amount persists until
  acknowledged.**
- **[D55]** ✅ 2026-08-22 — **a money field READS separators**; blank and unreadable are different answers.
  Period-decimal storefronts only.
- **[D54]** ✅ 2026-08-21 — **R5 (the expense reserve in the plan) is a 2.0 feature**; it must clear P6.10.
- **[D53]** ✅ 2026-08-21 — **2.0 ships with NO free trial.**
- **[D52]** ✅ 2026-08-20 — **feature lock after P6.10, code freeze after P6.18.**
- **[D51]** ✅ 2026-08-20 — **the splash ships LIGHT and DARK variants showing the mark**; needs the next build.
- **[D50]** ✅ 2026-08-20 — P6.6 + P6.5 before P6.4, then the batched build.
- **[D49]** ✅ 2026-08-20, built 2026-08-21 — **a green gate is RECORDED BY THE GATE**, never typed into a document.
- **[D48]** ✅ — **one batched device build** carries P6.3 + P6.5 + P6.6.
- **[D47]** ✅ — **iCloud backup is OPT-IN**, default off, offered once in-line.
- **[D46]** ✅ — **the QA door is resolved by ORDERING**: P6.13 → P6.14 → P6.17.
- **[D45]** ✅ — **the monorepo stays.**
- **[D44]** ✅ decided · ✅ built 2026-08-21 — a Pages deploy asserts its SHA has a green `web-e2e` run.
- **[D43]** ✅ — the splash is the app icon on its own background, no wordmark *(dark half superseded by [D51])*.
- **[D42]** ✅ — **P6.4 commits to a BAR, not a COUNT.**
- **[D41]** ✅ — the privacy claim is ***"Your data never goes to our servers. Optional iCloud backup keeps it in
  your own Apple account."*** Never *"end-to-end encrypted"*, never *"100% private"*.
- **[D40]** ✅ — **cloud backup uses the private iCloud container, no passphrase.**
- **[D39]** ✅ 2026-08-19 — **FEATURE LOCK ≠ FREEZE**; both positions superseded by [D52].
- **[D38]** ✅ 2026-08-19 — **ships as `2.0.0`.**
- **[D37]** ✅ 2026-08-18 — **every high+ finding is remediated or refuted**, traceable, enforced by `lint:closure`.
- **[D36]** ✅ 2026-08-17 — **the reserve ships to BOTH TIERS**; the Guardian segment is "Spoken for".
- **[D35]** ✅ 2026-08-17 — **3.5's device pass folds into Phase 6's.**

**Scope + revenue**

- **Re-scope to "The Elevation"** ✅ 2026-07-20 — design-first, best-in-class. **v1.7 ships as ONE release.**
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel.
- **Revenue spine** ✅ 2026-07-25 — Monthly $4.99 · Annual $29.99 · Lifetime $79.99. **NO free trial.** Reuses
  the existing RevenueCat project — v1.6 subs must restore.
- **Phase-3 scope** ✅ 2026-07-27 — pull EVERYTHING into v1.7 unless it genuinely can't ship. Analytics OUT of
  the core (privacy moat); the 3.5 demo re-opened it → a privacy-first funnel seam.
- **Executive "fix everything, no backlog"** ✅ 2026-07-29/30 · **Legacy gate RETIRED** ✅ 2026-07-24 ·
  **3.8 is in v1.7** ✅ 2026-08-17.

**The demo + the embed**

- **[D21]** ✅ the demo SHIPS to users again, reversing [D19]. Demo = before you commit; walkthrough = after
  onboarding, on your own money. It no longer rides `QA_TOOLS`.
- **[D23]** ✅ the demo is **TWO runs** — `explore` ships; `scripted` is the App-Preview + embed vehicle.
- **[D20]** ✅ capture pipeline — Maestro drives · `simctl` records · ffmpeg conforms.
- **[D32]** ✅ 3.5.7 hosts on **GitHub Pages** and its privacy claim is a **GATE** — static-only *by
  construction*. No analytics in the embed build (a **build flag**, not a toggle) · `sessionStorage` only ·
  **zero network requests after asset load**, held by a spec that fails `validate:release:rn`. ⚠️ Every host
  logs IPs, so *"financial data never leaves your device"* stays literally true while *"100% private"* would
  overclaim.
- **[D34]** ✅ 2026-08-17 — the embed CTA names the **destination**: *"Get it on the App Store."* App id
  `6773201250`.

**Product + engine**

- **[D22]** ✅ the debt/expense split is CORRECT and stays (terminating vs perpetual); the defect is **naming
  + entry**. [D22a] one chooser replaces the per-section Adds · [D22b] the detector runs retroactively ·
  [D22c] it surfaces, never silently re-files · [D22d] "bills" vernacular → the wording gate.
- **[D2]** ✅ `minimumPaidThisCycle` is the owner ("minimum covered"); `isPaidThisCycle` means paid in full.
  ⚠️ Corrected by B.0: the fallback-less reader is `planSelectors.ts:156`.
- **[D24]** ✅ the tight top-up prefers a **discretionary goal; the EF is the fallback**, and the copy names it
  when it IS the EF. The dishonesty was drawing on it *silently and first*.
- **[D25]** ✅ an applied purchase **keeps** its deferrable behaviour but gets an **explicit category**.
- **[D3]** ✅ the calm-micro-viz hero language extends to Debts · **[D26]** ✅ the greeting's mechanism ships,
  its **strings** belong to the wording gate · **[D27]** ✅ port the free on-plan streak only, **no flame** ·
  **[D28]** ✅ B4's swipe ships as a pure accelerator · **[D29]** ✅ B1 CLOSED as refuted.
- **[D4]** ✅ rename before the next device build — every App Shortcut phrase contains `\(.applicationName)`.
- **[D1]** ✅ stays DEFERRED **on a NEW reason** — the original cost argument **expired**. It stays deferred
  because **there is no control-SHAPED job**: this app's actions are multi-step or rare and dated, and a
  glance is a widget's job, which already ships.

**The lane**

- **[D30]** ✅ the iPad lane is **three tiers in one directory**, not a second flow set. Forced by
  `use-layout.ts`: on a wide iPad the debt sheet is **inline, not modal**, so flow 02 would pass while testing
  nothing.
- **[D31]** ✅ the audits change **METHOD, not just model** — scripted lenses where the question is
  deterministic · a **generated artifact** as the agent's input, never the raw codebase · cheap tier extracts,
  expensive tier judges a short list. ⚡ **Every finding that becomes a TEST is paid for once** — audit spend
  as capital, not rent.
- **[D33]** ✅ §11.16 PASSES on both edges; beat 5's landscape crop is **deliberate**.
- **4.1.9** ✅ 2026-08-17 — **XCUITest, and NO Appium.** Appium buys 3 checks for a second driver, language and
  server process.

**Open:** none.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** the live one is [`audits/2026-08-21-p6.8-finish/SYNTHESIS.md`](audits/2026-08-21-p6.8-finish/SYNTHESIS.md) · Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Generated, always current:** [`audits/coverage-split.md`](audits/coverage-split.md) · `audits/strings-inventory.md` · `audits/surface-inventory.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md` · **Sentry:** `DEBT_SENTRY_SETUP.md`
- **Human checklist:** [`DEBT_2.0_YOUR_STEPS.md`](DEBT_2.0_YOUR_STEPS.md) · **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
