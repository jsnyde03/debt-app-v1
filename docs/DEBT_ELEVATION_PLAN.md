# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.
>
> ⛔ **EXACTLY ONE DECOMPOSED SECTION LIVES HERE — the ACTIVE item's.** Everything else is one terse row.
> Compacted [2026-08-24](archive/DEBT_ELEVATION_PLAN_2026-08-24-precompaction.md) *(1,278 lines)*,
> [2026-08-26](archive/DEBT_ELEVATION_PLAN_2026-08-26-precleanup.md), and again
> [2026-08-26](archive/DEBT_ELEVATION_PLAN_2026-08-26-precleanup2.md) *(1,434 → 641 lines)* — every
> predecessor verbatim in `archive/`.
>
> **How to read this file.** **§1 [RIGHT NOW](#-right-now--s110--pass-3)** — the one thing being
> built, decomposed · **§2 [OPEN, but NOT being built](#-open-but-not-being-built)** — the only other live
> queue · **everything after that is REFERENCE**: where v1.7 is · the Phase 6 order to submission · what is
> waiting on Jason · the decisions ledger.
>
> **The three files this one points at, and why each is not here** *(🎯 2026-08-26: "the document should be
> the source of truth and concise")*:
> [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — how every closed item went ·
> [`DEBT_ELEVATION_BACKLOG.md`](DEBT_ELEVATION_BACKLOG.md) — the 125 deferred items, grouped by where they
> land · [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md) — every row a human must
> execute on hardware, **§14 included**, which lived only on this page until now.

---

## ▶ RIGHT NOW — **S1.11 · pass 4 RECORDED, then FIXED BY CLASS**

**Surface S1 · money · goals · plan cards.** Passes 1–3 run and fully fixed. **Pass 4 run at `e65f9c7` by four fresh agents → 8 blockers · 19 majors · 7 minors across 217 files** ([`SYNTHESIS.md`](audits/2026-08-28-s1-money-pass4/SYNTHESIS.md)). ⛔ **S1 does NOT converge** — [D65] exits on 0/0 **twice consecutively**, so **pass 5 is the next first-candidate and a clean pass 5 still owes a pass 6.** ⛔ Everything below the ACTIVE block is **reference, not queue**. Detail → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

⛔ **PASS 4's RESULT IS NOT A DEFECT — IT IS THAT THE LEDGER CANNOT BE CASHED.** `lint:finding-guards` exited 0 over **every** un-fix auditor D performed. It is a **deletion detector** — it proves a token string still exists — and it has been read for three passes as a **closure proof**. **Eight registered guards were proven to survive their own un-fix** by four auditors independently, and **35 more entries in lanes A/B/C have never been tested by anyone.** ⚠️ **Until a guard is proven to red, `CLOSED` and `OPEN` are indistinguishable in the record** — which invalidates counts rather than adding to them.

⚡ **13 of the 34 findings are ONE class:** the fix reached the instance that was reported and left a sibling of the same class asserting on the same store. ⛔ **`C4-10` and `D4-6` are the two instruments built to prevent exactly that, and neither can fail** — `D4-6` is inside `test:gate-plants` itself, which prints `reason=WRONG` beside a green tick and then announces `✅ all 21 gates fail closed`, exit 0.

⚠️ **Carried from pass 3 and still governing:** of the 12 `GAP-*` rows, **9 were wrong about their own scope or remedy**; of the 14 minors, **6 had a remedy that was wrong, incomplete or unnecessary** — while the premises were almost always right. ⛔ **The ledger is reliable about WHERE and unreliable about WHAT TO DO.** Three remedies would have introduced the defect they described.

⛔ **THERE IS NO CURRENT GATE RECORD, AND MID-AUDIT THAT IS THE EXPECTED STATE** ([D74]). ⚠️ **Do not type the fingerprint or the file count here** — this block has carried a decayed one twice, which is why [D49] says quote `npm run lint:gate-freshness` and read `gate-status.json`. ⛔ **The harness reports exit 0 over a RED gate** — read the gate's own summary line, never the pipeline's status.

### ⏭ WHAT THE NEXT SESSION PICKS UP

✅ **`S1.11.1`, `S1.11.2` and `S1.11.3` are CLOSED.** Pass 4 recorded *(29 of 34 count, **all eight blockers**)*; all seven instruments repaired; and the guard ledger now carries **evidence rather than tokens** — 40 entries with executed proofs, ⛔ **119 still resting on a token alone.**
▶ **`S1.11.4` — CLASS 1, the 13 partial-fix members.** ⛔ **One assertion per class that ITERATES the class**, never one that names a member: fixing these one id at a time is what produced this round. Decomposed below.

⛔ **A finding's MECHANISM is a hypothesis; its site list is a floor.** Measured repeatedly here — in one cluster **4 of 4** stated mechanisms were wrong while all four observations stood, and **three of the proposed fixes would not have closed the defect.** Verify what a finding says to DO against the current code before writing anything.

⚠️ **The audit's own dispatch is half-blind and pass 5 depends on fixing it.** `audit-route.ts` routes files *changed* since the pin, so a two-producer disagreement is **half-routed by construction** — the fix touches one producer, the route sees one producer, and the disagreement is only visible from the side that moved. Three independent proofs: `buildPayoffTrajectory.ts` routed to nobody · a fifth bucket, **`unrouted`**, holding `(tabs)/progress.tsx` and `(tabs)/index.tsx` where **3 of C's 4 blockers live** · and the route emits `first-look` for S1 and **never S0** — **49 never-swept S0 files** against a surface declared CONVERGED.

⚠️ **The dispatch crashed once and the recovery is protocol now** ([`RESUME-PROTOCOL.md`](audits/2026-08-28-s1-money-pass4/RESUME-PROTOCOL.md)): heap capped at **1536 MB**, ⛔ **an OOM is a FINDING and never a retry** *(the retry with `--max-old-space-size=6144` on a 6 GB box was the kill)*, no whole-monorepo typecheck, kill servers you start, **verify every restore**. ⚡ **Incremental writing is what saved the round** — 11 findings were already on disk when three auditors died.

⛔ **Eleven defects went into the instruments across the two fixing sessions, and pass 4 found more.** **Every one was found by PLANTING, none by reading.** Report pass 5 split by origin, or a flat total hides both halves moving.

### 🔨 THE ACTIVE DECOMPOSITION — S1 *(the ONLY decomposed section on this doc)*

| # | sub-step | exit line |
|---|---|---|
| ✅ | **S1.1 – S1.8** — the surface opened, both passes run and pass 1 fixed | CLOSED 2026-08-26 · pass 1: **5 blockers · 10 majors**, every one fixed and guarded · **S1.6** the gate recorded at fingerprint `69c372a0` · **S1.7** [D73] put the TEST TREE on a surface · **S1.8** pass 2, four fresh auditors at `4b58d75` → **3 blockers · 6 majors · 12 minors** ([`SUMMARY.md`](audits/2026-08-26-s1-money-pass2/SUMMARY.md)). ⭐ **A issued 23 verdicts and 22 came back CLOSED.** Detail → log |
| ✅ | **S1.9 — pass 2 FIXED** | CLOSED 2026-08-26 · 3 blockers · 6 majors · 12 minors, **57 plants · 22 guards**. ⚡ **Three times the fix WAS the defect class**; the roots were wrong twice more *(1 dir → 18, then 184 invisible files)*; `lint:rn` 27 → **28 gates**. Detail → log |
| ✅ | **S1.10 — pass 3 FIXED, the route became a generator, pass 4 RUN** | CLOSED 2026-08-28 · 11 blockers · 9 majors · 14 minors all fixed, plus `G-1`…`G-6` and the `GAP-*` backlog *(`MAX_UNGUARDED` 16 → 1)*; NET green at `cec7edc3`; **[D75]** made the route a committed generator. ⚡ **9 of 12 `GAP-*` rows and 6 of 14 minor remedies did not survive contact.** Detail → log |
| ▶ | **S1.11 — pass 4 FIXED** *(decomposed below)* | **8 blockers · 19 majors · 7 minors.** ⛔ The result is that **the guard ledger cannot be cashed** — 8 guards proven dead, 35 never tested |

**Exit (S1):** the money surface at 0 blocker / 0 major, S0's fixes and guards re-confirmed, and the four
new instruments swept. ✅ **The instrument half is DONE** — pass 1 swept `check-finding-guards.ts`,
`test-gate-plants.ts`, `surface-coverage.ts` and `begin-gate-run.ts`, and S1.5.4 fixed the six majors it
found in them. ⚡ Every one was the S0 shape: *an instrument reporting green while doing less than it
claimed.*


#### S1.11's sub-steps — pass 4 RECORDED, then FIXED BY CLASS

⛔ **Grouped by class because the ids are not independent** — **13 of the 34** are one defect: *the fix
reached the instance that was reported and left a sibling of the same class asserting on the same store.*
Fixing those one id at a time is what produced this round.

⛔ **The instruments come FIRST and the money blockers wait behind them.** `C4-10` and `D4-6` are the two
gates built to prevent that class and **neither can fail**; fixing `A-F3` or `C4-9` before them buys a fix
nothing can prove stays fixed. ⚠️ Each sub-step is: **verify the finding's MECHANISM against current code**
→ reproduce with a control → fix → re-run the control → **plant the original defect and confirm the guard
reds FOR THE PLANTED REASON** → **plant the naive over-fix** → register the guard.

| # | sub-step | exit line |
|---|---|---|
| ✅ **S1.11.1** | **RECORDED & CLASSIFIED 2026-08-28** — `s1p4` registered in `SWEPT_CLAIMS`, claims written back to **both** files *(the route spans two surfaces)*. Coverage **S1 125→63 · S0 62→50** unswept, both gates green. ⚠️ **The route is 217, not the 216 this doc carried** — manifests and `ROUTING-ORIGINS.tsv` agree, 0 disjoint. ⛔ Coverage **not** credited by route membership: 130 evidenced-swept vs **87 named not-reached**, and three matching errors were caught by reading the matches. ⚡ **[D69]: 29 of 34 COUNT and all EIGHT blockers count** *(pass 3 was 9 of 20)*. [`CLASSIFICATION.md`](audits/2026-08-28-s1-money-pass4/CLASSIFICATION.md) | CLOSED |
| ✅ **S1.11.2** | **THE INSTRUMENTS ARE REPAIRED — 7 of 7, 2026-08-28.** `D4-6` `C4-10` `D4-3` `D4-9` `D4-5` `D4-8` `D4-2`, each proven by a **2×2 against the pre-fix code**, not by an exit code. Registry **151 → 159**, and two stale tokens re-pointed. ⛔ **Two self-inflicted defects caught in my own fix work** — a check placed after its own `process.exit(1)`, and a plant script that left a file planted. Detail → log | CLOSED |
| ✅ **S1.11.3** | **THE GUARD LEDGER IS EVIDENCE NOW — CLOSED 2026-08-28.** `npm run prove:guards` executes a finding's own defect and requires the named command to red **for the named reason**; `lint:finding-guards` separates *carries a proof* · *guard-only* · *never tested*, the last two downward-only. **All 8 proven-dead guards repaired · all 32 never-tested lane-A/B/C entries proven · 40 in all.** Three new instruments fell out of it, and ⛔ **119 entries still rest on a token alone** — printed every run. [`LEDGER-RESOLUTION.md`](audits/2026-08-28-s1-money-pass4/LEDGER-RESOLUTION.md) · detail → log | CLOSED |
| ✅ **S1.11.4** | **CLASS 1 CLOSED 2026-08-29 — 11 findings and 4 `PARTIAL`s, each by an assertion over its CLASS.** `F-B4` `C4-9` `C4-7` `C4-2` `C4-5` `C4-1` `C4-11` `A-F4` `A-F5` `F-B3` `D4-10`. Net green: **39/39 gates · 337 e2e** *(was 325)*; registry **163 → 172**, proofs **44 → 52**. ⛔ **6 of 11 stated remedies would not have closed the finding and 4 would have INTRODUCED one** — while every premise reproduced exactly. Detail → log | CLOSED |
| ▶ **S1.11.5** | **CLASS 2/3/5 — the rest.** `A-F3` *(blocker: `windowStartISO` accepted and never read — $1,200 against a true $300)* · `A-F1` `A-F2` `F-B1` `C4-3` `C4-6` `C4-4` `F-B2` `D4-1` `D4-4` `D4-7` · the 7 minors. ⛔ `C4-2` moved to `S1.11.4.2` and `C4-1` to `S1.11.4.4` — each is a `PARTIAL`'s open half and the plan carried it in both places | each carries **two plants** — the defect, and the laziest plausible repair |
| **S1.11.6** | ⛔ **RE-ROUTE FOR PASS 5.** `audit-route.ts` must emit **the CONSUMERS of every changed producer**, not only changed files, and must emit **S0**. Fold the memory protocol in permanently *(heap 1536 MB · an OOM is a finding, never a retry)* | the route reproduces `A-F4`'s unrouted producer and C's two unrouted money screens as **routed** |
| ✅ **S1.11.7** | **[DECISION] S0's convergence stands — [D76], 2026-08-28.** ⚠️ `D4-7` said 49; the measured number is **62** *(`lint:s0-coverage`: 109 classified · 62 unswept)*. ⛔ The gate printing them on the **green** path is deliberate and documented — **nearly filed as a defect and it is not one**; what is real is that `audit-route.ts` can never route them | CLOSED — the routing half moves to `S1.11.6` |
| **S1.11.8** | **THE NET** — full e2e + embed, read from each suite's own summary line, commit, push. ⛔ **No `gate:record`** — [D74] writes it at convergence and pass 4 did not converge | green and pushed; the hand-off names the last full pass |

##### S1.11.5's sub-steps — CLASS 2/3/5, grouped by what the fix has to reach

⛔ **Decomposed at switch-in, and every premise below is a HYPOTHESIS until it is verified against the
current code.** `S1.11.4` measured the rate: **6 of 11 stated remedies would not have closed their finding
and 4 would have introduced one**, while the premises reproduced exactly. ⚠️ `D4-10` was already closed by
`S1.11.2` and would have been "fixed" a second time if the report had been trusted.

| # | sub-step | exit line |
|---|---|---|
| ✅ **S1.11.5.1** | **`A-F3` CLOSED** — `windowStartISO` appeared nowhere in the body, so a plan a year behind required its **whole $1,200 balance** out of one $2,000 paycheck. 🎯 **honour the contract**; the arrears stay on the books and stop being billed to this cycle. The window rows are a **sweep over the four positions** now — every old row picked the far side of the class. ⚠️ The finding's remedy predicted **2** and it is **3** | the parameter is READ, and a test drives the window from both ends |
| ✅ **S1.11.5.2** | **`C4-6` CLOSED, and `C-7b` with it.** The confirm rendered **synchronously** with `preview = null` and a live button — byte-identical to the un-fixed state, for a whole network round-trip, on the screen where a second tap destroys data. The three-state slot and the commit gate are a **pure table** *(the `ready` branch is unreachable to every test)*; the third state was **silence** and now says so. ⛔ Four plants — the fourth is the sheet passing a **constant**, which typechecks and restores the defect in full | the confirm cannot be committed while the disclosure is unknown |
| ✅ **S1.11.5.3** | **BOTH LEDGERS CLOSED.** `C4-3`: `LIVENESS_RE` read **one spelling** of a two-sided condition — `balance <= 0`, which is how `C4-2`'s blocker was written — so **ten sites across six files were invisible**. Cap **12 → 22**, the one time it rises, because *the instrument widened and the tree did not*. `C4-4`: its named escape was **already closed by `D4-8`** *(plant 3 re-run verbatim — it reds)*; the real hole is that the ledger **counted its exceptions and never its population**, and neutering one identifier printed *"0 claim sites open"* over an empty read | the ledger's population is derived from the CONDITION, never from one spelling of it |
| ▶ **S1.11.5.4** | **THE REMAINING CLAIM SITES — `A-F1` `A-F2` `F-B1` `F-B2` `D4-1` `D4-4` `D4-7`** | each fixed at its class, not at the id |
| **S1.11.5.5** | **THE 7 MINORS**, incl. `C4-8`'s *"across 1 cycles"* | folded, each with its guard |
| **S1.11.5.6** | **THE NET** — `typecheck` · `lint:rn` · the unit suites · the e2e specs whose surface changed · commit | green; plan + log atomic |

**Exit (S1.11.5):** every remaining pass-4 finding closed by an assertion over its class, each carrying
**two plants** — the defect, and the laziest plausible repair — and a registered `proof` block.

**Exit (S1.11):** 0 blockers / 0 majors on pass 4's findings, every guard in the registry **proven to red on
its own defect**, and the route regenerated so pass 5 reads the surface pass 4 could not see. ⛔ **Pass 4
did not converge** — [D65] exits on 0/0 **twice consecutively**, so pass 5 is the next first-candidate and a
clean pass 5 still owes a pass 6.

---

⚡ **What pass 3 says, in two lines.** ⛔ **Three of four auditors independently found a GATE that reports
green while doing less than it claims** *(`B1` `A3` `C-1` `D3-3` `D3-4`)* — third consecutive pass, and one
of them was created by pass 2's own fix. ⛔ **And `B1`'s rule — never state a number the app could not read
— has been widened twice and missed a third direction each time**; this round it is **every claim site
outside the app**: the Home Screen, the Lock Screen, Siri and the Live Activity.

### ⛔ The rules that are LIVE while S1 builds

- **[D75] AN AUDIT ROUTE IS A GENERATED SET DIFFERENCE, AND ITS BUCKETS CARRY THE ORIGIN.**
  `npx tsx scripts/audit-route.ts --surface=<s> --since=<prev pin> --out=<dir>` — never a typed list.
  Four origins: **first-look** *(never swept)* · **fix-churn** *(swept, then changed — the pass read bytes
  that are gone)* · **instrument** *(on S0 and changed — what the fixing wrote)* · **off-surface**
  *(changed and on NO inventory)*. ⛔ It asserts **every changed tracked non-prose file is routed**, which
  is the only check that can see an undercount. ⚠️ `lint:surface-complete` proves a file is under a
  ROOT; it cannot prove an inventory contains it, and S2/S3/S4 have no claims file — see `S1.10.6.10`.
- **[D74] THE RECORD IS WRITTEN AT CONVERGENCE, NOT PER ROUND.** Per fix: `typecheck` · `lint:rn` · the
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

| | |
|---|---|
| **.11.1 – .11.17** | CLOSED 2026-08-24/25 — both blockers, all 14 majors, the `.11.9` tail, [D60]'s five, [D62]/[D63]'s high-water mark, and the fourth audit round *(5 auditors: 2 blockers · 17 majors)* |
| **S0.1 – S0.13** | CLOSED 2026-08-25/26 — 6 instrument findings, pass 1's 7, pass 2's 3, **pass 3 the first clean pass** *(0 / 0 / 6 minors)*, pass 4's 5 majors + the 37-finding guard inventory, then the close-out: 3 new gates + `gate:begin`, **25 gates on `lint:rn`**. ⚡ **10 of the first 16 were introduced by the fixing.** [`S0-REVERIFY-3.md`](audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-REVERIFY-3.md) · [`S0-REVERIFY-4.md`](audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-REVERIFY-4.md) · [`S0-GUARDS-4.md`](audits/2026-08-25-p6.8.9.7.11.17-reverification/S0-GUARDS-4.md) |
| 🎯 **S0 CONVERGED 2026-08-25** | ⛔ **[D70] rewrote the exit: instruments-sound, not a pass count — there is no pass 5.** Pass 4 returned **20 findings and 0 that counted**, and *a pass that cannot fail is not a measurement*. ⛔ **S0 was verified by S1's pass 1, not by an S0 pass** — and it passed: `REVERIFY4-1…-5` all `CLOSED`. Full reasoning → log, *"[D70]"* |

---

## Where v1.7 is

| | |
|---|---|
| **State** | Phases 0–3 · 3.5 · 3.7 · 4 · 3.8 ✅ · the whole-app audit gate ✅ ([D37] 55/55, `lint:closure` in CI) · **Phase 5 ✅ CLOSED**, cutover conditionally approved. **Phase 6 is everything that remains** and it ends at ASC submission |
| **Ships as** | **`2.0.0`** ([D38]). The internal workstream keeps the name *"the v1.7 Elevation"* |
| **Gate** | `validate:release:rn` — e2e + embed + `test:stamp` + lane checks, `lint:glossary` · `lint:money` · `lint:apostrophes` · `lint:closure` · `lint:secrets` · `lint:sandbox` · `lint:contrast` · `lint:type-scale` · **`lint:icon-glyphs`** · **`lint:month-arithmetic`** · **`lint:press-opacity`**; tsc + lint clean (`apps/rn` at `--max-warnings=0`), zero `error-context.md`. ~15 min locally. ⛔ **[D49] — the gate RECORDS ITSELF. Never type a result into this file; quote `gate-status.json`.** `npm run lint:gate-freshness` says in under a second whether that pass still describes the tree. ⛔ **NEVER TYPE A RESULT HERE — run `npm run lint:gate-freshness` and read `gate-status.json`.** It answers in under a second whether the recorded pass still describes the tree, and every hand-typed figure this row has ever carried decayed *(it once said "2026-08-24 · 663 files" while the record said `01fc7ec` · **668**)*. ⚠️ A record can be written on a **dirty** tree: the fingerprint identifies what was tested, the SHA does not. ⛔ **The harness reports exit 0 on a RED gate — nine instances**; read the gate's own summary line |
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
| **P6.9** | ⭐ **[AUDIT GATE] Privacy / data-flow audit** | Trace EVERY egress and prove [D41]'s claim literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs. Owns retiring *"100% private"* and the ASC privacy label. 🔴 **P6.3 hands it a live counterexample** — `PRIVACY_CLAIM.body` still says *"stays on this device"* |
| **P6.10** | ⭐ **[AUDIT GATE] Pre-submit functional + FINANCIAL-correctness money lens** · 🔒 **FEATURE LOCK CLOSES HERE ([D52])** | 🔴 **OWES C1's SECOND HALF** — `capturePayday`'s `opts.actualIncome` has **no production caller**, so `LeanSuggestionCard` is unreachable by construction and **nothing in the suite reds when this is forgotten** (absence is what no test reports). Marked at `substrateProducers.ts`. ⛔ **Last gate that can FIND a structural gap.** Boundary inputs across the engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios. ⛔ **Owns two carried defects:** `bulkMarkRequired.ts` writes pre-[D2] paid semantics · `appliedTopUp` is a manual-opt-in invariant every cushion reader must remember. Its filed queue is in the backlog below |
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

⛔ **This heading carried SIX rows all marked ✅ ANSWERED** *(cleaned 2026-08-26)*. A section called
*"Waiting on Jason → Open decisions"* listing nothing open reads as six answers owed. ⚡ **The rot is
one-directional and it is why this needs checking rather than reading: answering a decision updates the
Decisions section and leaves the row that was waiting on it.** ⚠️ **[D61] and [D62] were not in the
Decisions section at all** — their answers existed *only* here, under a heading that said they were
outstanding. Both are now recorded below where answers live.

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

✅ **Everything else in this section has been answered** — [D40]–[D48] · [D3] · [D53] *(no free trial in 2.0,
which also closes **L5-19**'s trial call)* · [D58]; the Apple portal for iCloud, the Sentry DSN and the
[D48] batched build are all done, and **[D59]** settled C7's shape. Reasoning → log. ⚠️ **This list decays one way** — closing a decision
updates the decisions ledger and nobody deletes the row that was waiting on it. Three rows claimed to be
waiting after 🎯 had answered; re-check before presenting anything here as open.

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

⚡ **None of these was reachable by 4.1.** The lane checks that built behaviour keeps working; these are
*design* gaps. **No coverage split models "the app does the wrong thing correctly"** — using it is the only
instrument that finds them. ⛔ **R3 makes the point twice over:** two `demo-containment` tests aim straight
at that path and **both pass while the exit is unusable** — they prove an exit is *present and reachable*,
never what it **says** to the person reading it.

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

✅ **Closed and verified, not assumed** — the coach-mark defect, the transient Guardian card and §12.6.1
closed with the audit gate 2026-08-19 · the `tutorial-invite` intermittent FIXED 2026-08-18 *(the cause was
the test: `click({force:true})` delivers to coordinates and hit `tutorial-scrim-blocker`)* · **both Pages
threads closed by P6.7** — read in `embed-pages.yml` 2026-08-24: there was never a deploy allow-list to flip
*(the exposure was `workflow_dispatch`'s ref dropdown, now guarded in the `guard` job)*, and [D44]'s
green-`web-e2e`-for-this-SHA assertion is built.

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

⚡ **Phase 3.7's number, worth keeping:** a pre-authored ledger item is wrong about as often as it is right —
Wave A, of 14 items, **5 did not exist and 4 more were materially misdescribed** (one *inverted*); Wave B, of
4, **1 refuted, 1 half-shipped, 1 wrong in 3 of its 4 premises, 1 clean.** The before-scan pays for itself.

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

⚡ **This is now a real index, and it was not before.** The header used to say *"THIS SECTION IS NOT AN
INDEX — IT IS THE ONLY COPY OF THE ROWS BELOW"* and name its own remedy; the remedy is done. The
highest-value row is unchanged and still decides a premium feature: **P6.8.7e.5 [C4]** — does the Live
Activity ever appear for a premium user with Payday Countdown ON who does not re-save the paycheck
sheet.


## Deferred backlog *(index)*

⛔ **The register itself is [`DEBT_ELEVATION_BACKLOG.md`](DEBT_ELEVATION_BACKLOG.md)** — 125 items,
grouped by where they land. It moved out of this page on 2026-08-26: a register is what you consult when
choosing the next build, and this page is the driver.

| lands in | items |
|---|---|
| P6.8.9 — the verification pass | 27 |
| P6.10 — feature lock + the money lens | 15 |
| P6.9 — the privacy / egress audit | 2 |
| P6.11 — delete with the tree | 6 |
| 2.1 | 18 |
| INTERNATIONAL — a workstream, not a line item | 0 |
| Tooling / hygiene | 10 |
| Genuinely a later version / tier | 5 |
| ✅ Closed since filing — recorded so they are not re-filed | 0 |
| ⚠️ **not yet routed** — from the S1 scans | 42 |

⚠️ **Not-yet-routed is a state, not a shelf.** Each destination's switch-in owes a pass over that
group; an item that is never routed is an item that never resurfaces.

## Decisions

⛔ **A ✅ here means the CALL is settled; it does **not** mean the work shipped.** [D44] sat in a queue row as
built for a day and a half while the step did not exist — same glyph, different meaning. Full reasoning for
every entry → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

⚠️ **That pointer was FALSE for three entries and nobody had checked it.** [D29], [D56] and [D64]
appeared **nowhere** in the log, so this page was their only copy — found by grepping the log for every
id rather than trusting the sentence above. The whole ledger is now mirrored there verbatim.

**Phase 6 — launch**

- **[D76]** ✅ 2026-08-28 *(🎯: "I approve your rec for S0")* — **S0'S CONVERGENCE STANDS; THE UNSWEPT
  REMAINDER IS A ROUTING BUG, NOT A REOPENING.** Pass 4's `D4-7` reported that `audit-route.ts` emits
  `first-look` for S1 and **never S0**, so S0's unswept files can never be routed to an auditor.
  ⚠️ **The finding's number was short — it said 49 and `lint:s0-coverage` measures 62** *(109 classified ·
  62 unswept)*, the eighth instance of the undercount class. ⛔ **Two premises were checked and only one
  survived:** the gate printing 62 holes on the **green** path is **deliberate and documented** — it proves
  every surface file is *classified*, not swept, and the unswept list is the backlog [D69] exempts findings
  against; **that is not a defect and was nearly filed as one.** What is real is that nothing can route
  those files. ⭐ **[D70] closed S0 on *instruments-sound*, not on a pass count**, and `surface-coverage.ts`
  already records that [D73] admitted files to S0 *after* it converged, calling it *"the honest consequence
  rather than an argument against it."* **Reopening S0 would substantially duplicate `S1.11.2` and `.3`,
  which re-prove that whole instrument layer.** ▶ The routing half is fixed in **`S1.11.6`**; if `.2`/`.3`
  find instrument defects among those 62, that is the signal to reopen S0 properly.

- **[D74]** ✅ 2026-08-26 *(🎯: "Do we need to always run a full release scan during audits? Or when
  they're all fixed we kick off the audit and run the release gate at convergence?")* — **THE RECORD IS
  WRITTEN AT CONVERGENCE, NOT PER ROUND.** `validate:release:rn` + `gate:record` run at [D65] convergence
  and before a release build; **not** at the end of every fix cluster.

  ⛔ **The gate bundles two different jobs and only one of them belongs on a per-fix cadence.** The
  *regression net* answers *"did my fix break something else"* — that stays at full frequency, because
  `converge-per-surface-not-per-round` measured that batching fixes cost seven self-inflicted defects, and
  S1.9 added three more. The *record* answers *"is this tree releasable"*, and **writing that mid-audit
  asserts something the audit itself denies.** A surface with open findings is not releasable, so the
  record gets more honest by being rarer.

  ⚡ **Measured, which is why this is a decision and not a preference:** the full e2e ran three times
  during S1.9 and caught **one** thing — a spec directly about the code just changed. And a **one-line fix
  to a GATE SCRIPT** invalidated the fingerprint and demanded a 25-minute re-run of 310 e2e specs that
  cannot import it.

  **The cadence:** per fix → `typecheck` · `lint:rn` · the unit suites · the e2e specs whose surface
  changed. Per round, once its findings are all fixed → full e2e + embed, **no record**. At convergence →
  the whole chain, recorded, pushed.

  ⛔ **A `--partial` record state was designed for this and DELETED rather than shipped** — it was an
  instrument built around a cadence we were abandoning, and a change to the record itself is the highest-risk
  instrument change there is.

  ⚠️ **Mid-audit there is therefore NO current record.** The hand-off must say *"no current record; last
  full pass was `<fingerprint>`; the tree has moved N commits since"* — never quote a stale one as if fresh.
  `npm run lint:gate-freshness` prints exactly that and sits outside every chain, so nothing goes red.

⛔ **[D61]–[D63] and [D65]–[D66] were MISSING from this section entirely** *(found in the 2026-08-26
cleanup)*. [D61] and [D62] lived only under *"⏸ Waiting on Jason → Open decisions"*, marked ✅ — i.e. the
answer was filed in the list of things still owed. **Answering a decision updates one place and leaves the
other**, in both directions. Reasoning for each → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

- **[D73]** ✅ 2026-08-26 *(🎯: "We should have e2e coverage on audits. I agree with your reasoning")* —
  **THE TEST TREE IS ON AN AUDIT SURFACE.** No e2e spec was on any surface: `grep -c "tests/e2e"` returned
  **0** against both claims files, so the guards for most registered findings sat in files no auditor was
  ever pointed at, while the standing rule requires every surface audit to re-verify the previous surfaces'
  guards. ⛔ **`lint:finding-guards` cannot substitute** — it proves a token sits on a non-comment line,
  never that the assertion behind it can fail; a **vacuous assertion measured in S1.5.5's own range** would
  have counted as guarded indefinitely. ⚠️ **This raises the unswept counts and that is the honest number**,
  exactly as M9's root-widening did *(72 → 137)*. Full reasoning → log, *"[D73]"*.
- **[D72]** ✅ 2026-08-26 — **`lint:secrets` GETS A CONTENT-HASHED EXEMPTION LEDGER**, not a redacted
  report and not a `docs/` carve-out. An exemption is keyed on a **hash of the flagged value**, so editing
  or rotating the credential invalidates it; the count is downward-only and stale entries are reported.
  ⛔ **Why not redact the report:** the gate's claim — *"4 credentials are in a PUBLIC repository"* — is
  **false**, so editing the evidence to make it green is GAP-17's anti-pattern. ⛔ **Why not exempt
  `docs/`:** that is where pasted terminal output actually lives, i.e. the gate's most likely real hit.
  → **S1.1**.
- **[D71]** ✅ 2026-08-26 — **`GoalSheet` DOES NOT OFFER A SECOND EMERGENCY FUND.** When a primary EF
  exists and is not this goal, the Type control renders read-only as *"Savings"* with a one-line why;
  ⛔ **stored `type` is never rewritten** *(normalising it would leave a store with NO emergency fund the
  moment the primary is deleted, where today goal #2 inherits the role)*. Completes [D66] — the third of
  the three screens. Reuses `paceGoverns`'s rule six lines above: **hidden entirely rather than disabled,
  because a disabled control still says "this is a thing you could set."** → **S1.1**.
- **[D67]** ✅ 2026-08-26 — **A CLOSED FINDING NEEDS A STANDING GUARD, OR IT IS NOT CLOSED** (🎯: *"I
  agree"*). ⛔ **The gap it fixes:** each convergence pass verified only the **immediately prior** pass's
  findings, so pass 3 never re-checked pass 1's seven — while S0.10 edited **nine gates**, exactly the
  change that could regress one. ⚠️ Re-reading every prior finding each pass grows quadratically and rests
  on an agent not tiring. ⭐ **So the durable protection is a permanent guard, not a re-read.** Some
  findings already have one *(invariant ⑨ fires in the suite · `HOSTILE_FLOOR` gates · `selfCheck` reds on
  a disarm · the caps ratchet)*; others have **nothing** *("`stripMarkdownCode` covers four spellings",
  "each of the nine gates uses the right variant")* — verified by a plant that ran once and was deleted.
  ⛔ **Every closed finding now needs (a) a test or gate that fails if it regresses, or (b) a written
  reason it cannot have one.** Job 1 then shrinks to *"do the guards still exist and still fail"* —
  mechanical and constant-cost. **A finding with neither is NOT converged.** Applies to S0–S4 and the
  cross-surface pass. *(Same rule as `tested-helper-is-not-a-used-helper` and "a green plant is a result,
  not a formality.")*
- **[D66]** ✅ 2026-08-25 — **a second emergency fund is called "Savings"** on all three screens, the word
  the Money row already uses and the only one of the three that stays true when a user has two. → **S1**.
- **[D65]** ✅ 2026-08-25 — **a balance corrected DOWNWARD asks at the moment of the edit** *("did you pay
  this down, or was the old figure wrong?")*. The app cannot tell a typo from a payment and only the user
  knows; any silent rule is wrong half the time, on the field the Progress ring is computed from. → **S2**.
- **[D63]** ✅ 2026-08-25 — **NO BNPL carve-out for the high-water mark.** ⛔ I recommended one, 🎯 agreed,
  and the test's own precondition then **refuted the mechanism**: `bnplPaymentsTotal` is
  `max(remaining, basis / scheduled)`, so a stamp can only RAISE the total, and an installment plan's
  `balance` **is** `scheduled × remaining` — the total rises only when the plan itself gets longer.
  ⚡ A stamp is neutral-to-better, never worse. *(A stated mechanism is a hypothesis even when it is hours
  old and yours.)*
- **[D62]** ✅ 2026-08-25 — **`originalBalance` becomes a HIGH-WATER MARK** (🎯: *"agree with your rec"*).
  ⚡ **The deciding case is the CORRECTION, not the setback** — enter `$500` by mistake, fix it to `$5,000`,
  and the ring read 0% for the next $4,500 of real repayment, permanently. ⛔ **The name will lie** — it
  means *the most you ever owed*; kept for 2.0 because renaming a persisted field is a migration for no
  user-visible gain. Built at `.11.15`. ⚠️ **The DOWNWARD direction was never reasoned** and became a
  blocker at `.11.17` → [D65].
- **[D61]** ✅ 2026-08-25 — **a SECOND `emergency` goal is FUNDED, through the savings rungs.** It matched
  no rung at all, so it drew `$0` every paycheck under a live progress bar. ⚡ **v1.6 carries the identical
  defect**, so migrating users can already be in this state — which is why refusing to create one in
  `GoalSheet` lost: it prevents new cases and strands every existing one. Built at `.11.12.3`; one owner
  (`@core/engine/emergencyFund`), three disagreeing consumers fixed.
- **[D64]** ✅ 2026-08-25 — **THE MARKETING PAGE THAT HOLDS THE EMBED IS PART OF 2.0's ASC PREP**
  (🎯). ⚡ **It closes a live loop:** the embed has been deployed and running since 3.5 with **no referrer
  anywhere** — `site/` holds two files and no `iframe`, so a hosted demo nobody links to has been carrying a
  build flag, a second export, three gate specs, a deploy workflow and a `guard` job. → **P6.21**.
  - ⛔ **CROSS-REPO, AND THIS REPO CANNOT DO IT.** The pages App Review loads live in
    **`jsnyde03/debt-planner-site`**; this repo's `site/` is **v1.5, stale, and deployed by nothing**
    (`embed-pages.yml` publishes the embed only). ⚠️ That mismatch already cost **three findings filed
    against `site/*.html` line numbers no reviewer ever sees**, two of which changed verdict once the live
    page was fetched. **Read the live page, not `site/`** — [`DEBT_SITE_COPY_2.0.md`](DEBT_SITE_COPY_2.0.md).
  - 🔴 **It promotes the URL question from backlog to LIVE.** An `iframe src` makes
    `jsnyde03.github.io/debt-app-v1/` user-visible, so *"the embed's public URL names the repo"* becomes a
    brand call **with a DNS dependency**, needed before submission rather than *"whenever the page exists"*.
  - ⚠️ **Two separate Pages origins** — the page on `debt-planner-site`, the embed on `debt-app-v1`. Whether
    that stays a cross-origin iframe or the embed moves is an unanswered structural question.
  - ⭐ **What survives even if the embed were dropped**, so it is not re-litigated: `zero-egress.spec.ts` is
    the machine proof behind [D41] and **P6.9 leans on it**, and the `scripted` demo is also **P6.20's
    App-Preview vehicle** ([D23]).
- **[D60]** ✅ 2026-08-25 — **THE OPEN DECISIONS, CLOSED AS A BATCH** (🎯: *"Let's fold it all in"*, on my
  recommendations). Seven calls, and the two largest are both **do not build**:
  - 🔴 **L1-20 eyebrows — DEFER the sweep, take the token.** ⛔ Its mechanism is **false on iOS**: RN
    uppercases the `NSString`, so VoiceOver reads "PAYDAY GUARDIAN" either way. **23 edits + 32 test pins
    for a change no user can perceive.** The single `eyebrow` token is the valuable slice and rides a later
    visual pass.
  - 🔴 **L4-13b `PressableScale` — NOWHERE, plus the token cleanup.** ⛔ The finding says two press
    vocabularies; **there are three and the majority is the third** — of 69 tap targets **1 springs, 11 dim,
    57 have none**. "App-wide" is a new design on ~45 targets inside a freeze, untested. **Build instead:**
    the 7 live inline opacities, and the two Money cards that disagree with each other.
  - ✅ **P1-4 and P1-5 — BUILD BOTH.** P1-4 is a 23-name run-on on the one screen that speaks to someone
    **short this paycheck**, and the idiom already exists at `invariants.ts:100`. P1-5's **button hierarchy
    is the sharper half**: `Done` is the filled primary while `Copy to clipboard` — the only action that
    backs anything up — is secondary, so a user can press the most prominent button and back up nothing.
  - ✅ **P1-1 — shoot the payoff finale and the band-milestone beat before P6.10.** Instrument work, and
    P1-1's own bar is that a surface missing from the matrix is one four lenses are blind to at once.
  - ✅ **D-2 the coach mark over the trajectory footer — ACCEPT.** Measured, not theorised. It does not
    cover its subject, and `.11.5` left those controls operable; first-visit-only behind a dismissible hint.
    **The price of not covering the subject.**
  - ✅ **The goal pace becomes editable in `GoalSheet`.** Today `priorityPerPaycheck` is written **only at
    creation**, so a user who chose "$200 a paycheck" can never revise or remove it — which is why
    `.11.3`'s repair notice had to name a workaround instead of an action. One optional field closes the
    product gap and the copy together.
  - 🔴 **CSV `MM/DD/YYYY` — DEFER.** `.11.4` made the in-app caption honest, which is the floor. How much
    of a real bank export the importer promises to read is a product call, not a 2.0 blocker.
  - ⏭ **P1-10's Windfall tier gate → 2.1.** The copy half shipped and `selectors.ts:54` is pinned, so
    nothing is wrong today; a future tier change is what would turn that line into a false statement about
    the user's money with every test green. Monetisation inside a converging freeze.
  - ⚠️ **The v1.6 silent loop stays with P6.14 to ANSWER, not to guess.** ⛔ `.11.10` sharpened it: if a
    WebKit container can produce a **total** decode failure, `isConfirmedFreshInstall` consults neither
    `droppedRows` nor `opened[].rows` — so the container is called terminal, the retry is consumed, and the
    **entire v1.6 portfolio is stranded while the app says "fresh install."** The one thing most worth
    measuring on device before ship.
- **[D59]** ✅ 2026-08-24 — **C7 COMPARES THE CLEAR ORDER, NOT THE CURVE** (🎯, on my recommendation).
  ⛔ **Measured before recommending, and it undercut the finding's own implied fix:** the two
  total-balance curves separate by **≤2.8% of chart height and usually <0.1%**, and the debt-free date is
  **identical in 5 of 6** portfolios — avalanche's best win was **2 months out of 53**. ⚡ **What differs
  is which debt clears when, and it is large:** first cleared debt at **month 1 under snowball vs month 20
  under avalanche** on the same portfolio, and a reshuffled order on another. So the side-by-side is built
  from the **waypoints**, not a second line — which also keeps a 6th element off a card **P1-3 already
  reports as unreadable**. ⚠️ **Total interest was NOT measured** and is avalanche's whole case; if the
  comparison ever states a dollar advantage, that figure has to be measured first.
  → [`evidence/2026-08-24-c7-strategy-divergence/`](evidence/2026-08-24-c7-strategy-divergence/).
- **[D58]** ✅ 2026-08-24 — **P1-3 is in 2.0**, built at **g.4 BEFORE C7** (C7 draws into the same
  x-domain). ⚠️ P1-1 · P1-2 · P1-4 · P1-5 are **not** decided by it → P6.8.9.
- **[D57]** ✅ 2026-08-22 — **one surface for "could not read it"**: migration losses report through c.2's
  `pendingDataRepairs` card, and **c.3/c.4 swap** because W1-6 *produces* the outcome M3-20 reports.
- **[D56]** ✅ 2026-08-22 — the two silent data events each get a surface and **one of them blocks**: a
  corrupt-store reset renders a **blocking screen before onboarding**; a repaired amount is held in a
  persisted `pendingDataRepairs` until acknowledged. ⛔ Not a preference — `repairsAreNotRepeated` guarantees
  the per-read list is empty next pass, so a live-only card would be the same silence the finding is about.
- **[D55]** ✅ 2026-08-22 — **a money field READS separators, it does not refuse them.** `"1,200"` and
  `"$1,200"` parse as 1200; anything not resolving to a finite positive number is refused. An OPTIONAL field
  treats **blank and unreadable as different answers**. ⚠️ Safe only because US · CA · AU · NZ are all
  period-decimal — a comma-decimal storefront **cannot be added without revisiting `store/amountField.ts`**.
- **[D54]** ✅ 2026-08-21 — **R5 (the expense reserve in the plan) is a 2.0 feature.** Reverses 3.8's *"the
  offer is NEVER required"* premise. ⛔ A new capability, so it **must clear P6.10**.
- **[D53]** ✅ 2026-08-21 — **2.0 ships with NO free trial** (🎯: *"I already have a demo and
  try-before-you-buy in the app"*). ⭐ **It retired MY argument, not his:** eligibility is consumed only by
  TAKING the offer, so every decliner stays eligible indefinitely and 2.1 reaches exactly the cohort that
  bounced. What is gained is a **clean conversion signal** from day one. ⚠️ If ever taken: **30 days floor,
  annual only** — premium's value fires on PAYDAY, and Apple grants the offer once per Apple Account per
  subscription **group**.
- **[D52]** ✅ 2026-08-20 — **both lines move: feature lock → after P6.10, code freeze → after P6.18.**
  ⛔ Lock moved because of a **contradiction**: with lock at P6.4 every structural gap P6.8 is chartered to
  find auto-defaulted to 2.1, so the audit could not act on its own charter. ⛔ [D39]'s two-line structure
  **survives** — P6.11 alone deletes an app surface after lock.
- **[D51]** ✅ 2026-08-20 — **the splash ships a LIGHT and a DARK variant, both showing the MARK.** ⚡ Possible
  because the icon has real SVG source, so the square-on-light problem was an **artwork** limitation, not a
  design conclusion. ⛔ Supersedes the dark-only half of [D43]; **needs the NEXT build.**
- **[D50]** ✅ 2026-08-20 — P6.6 + P6.5 run **before** P6.4, then the batched build; P6.4 runs while it is in
  flight. Neither is a feature, so landing them before lock costs nothing.
- **[D49]** ✅ 2026-08-20, **BUILT** 2026-08-21 — **a green gate is RECORDED BY THE GATE, never typed into a
  document.** ⛔ A doc rule cannot fix this — a doc rule is what failed. ⚠️ Two corrections the building
  forced: freshness turns on a **content fingerprint**, not a git diff; and `lint:gate-freshness` is **not**
  in `lint:rn` — a freshness check inside the thing that establishes freshness is a **deadlock**.
- **[D48]** ✅ — **ONE batched device build** carries P6.3 + P6.5 + P6.6. ⚠️ A signing failure then has three
  suspects — mitigated by introspecting the entitlements before the build is spent.
- **[D47]** ✅ — **iCloud backup is OPT-IN, default OFF, offered once in-line.** [D41]'s claim says
  *"**Optional**"*, and P6.9 has to prove it. A fresh install still detects an existing blob and offers to
  restore.
- **[D46]** ✅ — **the QA door is resolved by ORDERING:** P6.13 → P6.14 → P6.17. The probe rows get **no**
  non-QA path. ⚠️ Residual named: the shipping binary is not the device-passed binary.
- **[D45]** ✅ — **the monorepo stays**; `apps/rn` is not promoted to root. → P6.11.2 closed.
- **[D44]** ✅ decided · ✅ **BUILT** 2026-08-21 — a Pages deploy asserts its SHA has a green `web-e2e` run.
- **[D43]** ✅ — the splash is the app icon on its own dark background, no wordmark. *(Dark half superseded by
  [D51].)*
- **[D42]** ✅ — **P6.4 commits to a BAR, not a COUNT.** All 62 judged; what gets fixed is every defect and
  every finding on a shipping surface.
- **[D41]** ✅ — the privacy claim is ***"Your data never goes to our servers. Optional iCloud backup keeps it
  in your own Apple account."*** ⛔ **Never** *"end-to-end encrypted"* (false under [D40]) and never *"100%
  private"* again.
- **[D40]** ✅ — cloud backup uses the app's **private iCloud container, no passphrase**. A passphrase adds a
  *permanent* unrecoverable-backup failure mode against a threat this product is not sold against.
- **[D39]** ✅ 2026-08-19 — **FEATURE LOCK ≠ FREEZE.** The STRUCTURE stands; both positions superseded by
  [D52]. ⚡ What it buys: the sweep's structural-gap charter gets a **default answer**.
- **[D38]** ✅ 2026-08-19 — **ships as `2.0.0`, not `1.7.x`.** ⚡ The argument is about the FUTURE: the version
  number is the baseline every later release is measured against, and a wrong baseline is permanent. The
  internal name stays *"the v1.7 Elevation."*
- **[D37]** ✅ 2026-08-18 — **every high+ finding is remediated this round**: all 55 of 117 blocker+major
  closed or explicitly refuted, each traceable to its id, enforced by `lint:closure`. ⛔ Nothing is parked.
- **[D36]** ✅ 2026-08-17 — the reserve ships to **BOTH TIERS**; the Guardian segment is **"Spoken for"**.
- **[D35]** ✅ 2026-08-17 — **3.5's device pass FOLDS INTO Phase 6's.** One sitting, no row run twice.

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
