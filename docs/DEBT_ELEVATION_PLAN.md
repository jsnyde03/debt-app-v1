# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.
>
> ⛔ **EXACTLY ONE DECOMPOSED SECTION LIVES HERE — the ACTIVE item's.** Everything else is one terse row.
> Compacted 2026-08-24, 1,278 → this; the verbatim predecessor is
> [`archive/DEBT_ELEVATION_PLAN_2026-08-24-precompaction.md`](archive/DEBT_ELEVATION_PLAN_2026-08-24-precompaction.md).

---

## ▶ BUILDING NOW — **P6.8.7g · NEW SURFACES** *(the ACTIVE decomposition — 2026-08-24)*

⛔ **C8 FIRST, AND THE ORDER IS A DEADLINE, NOT A PREFERENCE.** Premises re-verified against the tree at
switch-in: `packages/core/imports/debtCsv.ts` exists and its **only** caller is `lib/hooks/useDebts.ts:6,188`
— **in the root tree P6.11 deletes.** After that commit the parser is unreachable and its behaviour has no
test to inherit. ⚠️ **C7's cited `TrajectoryChart.tsx:133` has DRIFTED** — the real discard is **`:147`**,
`const active = strategy === 'snowball' ? snowball : avalanche`.

⚠️ **Two obligations carried in from f, both earned by it:**
1. ⛔ **A finding names the property that is WRONG; the fix must preserve every property that was RIGHT.**
   Three of f's fixes needed a second attempt and every one failed on something its finding never mentioned.
   **Before each fix: what did this site do BEFORE that it must still do?**
2. **Write the gate, not the list.** All three of f's gates found something the slice had not.

| # | step | notes |
|---|---|---|
| ✅ **g.1** | **RESCUE `debtCsv.ts` — DONE 2026-08-24. The deadline is met.** | Parser is now pure (`parseDebtCsvText`: text in, ids injected — no DOM, no `crypto`) and money runs through the shared `amountField`, which **moved to `@core/utils`** with its test. New `testDebtCsv.ts` in `test:regression`: **61 asserts**, and **3 plants red by name** — including deleting the module, which is how P6.11 would take it. Detail → log |
| **g.2** ▶ | 🔴 **Wire the CSV import into `apps/rn`** | ⚠️ **A new surface → must clear P6.10 feature lock.** ⛔ `site/support.html` tells users *"in the Debts section, tap the import button"* and there is no CSV path in `apps/rn/src`, so this is also an M1-class claims fix. ⚠️ Either the entry point lands **in Debts** or the FAQ moves — decide at P6.21 against the shipped build |
| **g.3** | 🔴 **[DECISION] C7's shape → 🎯** | Both simulations already run every render and `:147` discards one. **Side-by-side is a new surface too** — present the shape before building it, the way R5's shape was settled |
| **g.4** | 🔴 **P1-3 — the trajectory's x-domain** *(**[D58]**, 2.0)* | The domain is set by the grey minimums curve, not the user's plan, so **success shrinks their own line to a sliver** and the default seed draws neither curve. ⛔ **Before C7, not beside it** — C7 adds a curve to this same domain. ⚠️ A defect fix on an existing card, so no P6.10 exposure, unlike g.2 |
| **g.5** | **C7 build** | Only after g.3 answers, and on top of g.4's domain |
| **g.6** | **Suites green** | ⛔ **Read the gate's own summary line and `gate-status.json`, never the wrapper's exit** — the harness reported a RED gate as *"exit code 0"* twice in f |

**Exit (g):** the parser survives P6.11 with a caller and a test, the CSV claim on the listing is true,
**P1-3's domain is driven by the user's own plan**, C7 carries 🎯's answer, and `validate:release:rn` is
green **quoted from its record**.

---

## Where v1.7 is

| | |
|---|---|
| **State** | Phases 0–3 · 3.5 · 3.7 · 4 · 3.8 ✅ · the whole-app audit gate ✅ ([D37] 55/55, `lint:closure` in CI) · **Phase 5 ✅ CLOSED**, cutover conditionally approved. **Phase 6 is everything that remains** and it ends at ASC submission |
| **Ships as** | **`2.0.0`** ([D38]). The internal workstream keeps the name *"the v1.7 Elevation"* |
| **Gate** | `validate:release:rn` — e2e + embed + `test:stamp` + lane checks, `lint:glossary` · `lint:money` · `lint:apostrophes` · `lint:closure` · `lint:secrets` · `lint:sandbox` · `lint:contrast` · `lint:type-scale`; tsc + lint clean (`apps/rn` at `--max-warnings=0`), zero `error-context.md`. ~15 min locally. ⛔ **[D49] — the gate RECORDS ITSELF. Never type a result into this file; quote `gate-status.json`.** `npm run lint:gate-freshness` says in under a second whether that pass still describes the tree. **Last: 2026-08-24 at P6.8.7f.5, exit 0 — 237 e2e · 10 embed · 648 source files.** ⚠️ Recorded on a **dirty** tree: the fingerprint identifies what was tested, the SHA does not |
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
| **P6.8** ▶ | **[AUDIT GATE] Pre-release best-in-class FINISH sweep** | ▶ **BUILDING — decomposed below.** Audit half CLOSED; the build is at cluster **g** |
| **R5** | 🔴 **The expense reserve belongs IN the plan** *(2.0 feature — **[D54]**)* | Shape settled 🎯 2026-08-21: a **recommended-action row that can be declined**. ⛔ Build **through the existing `expenseReserveHeld` setter** — a second writer is how three free display behaviours stop being free. ⚠️ The Plan surface is NEW → must clear **P6.10**. Two residuals open (per-cycle vs permanent decline · whether the transition cycle is stated). Not started; decomposed at switch-in. Detail → log |
| **P6.9** | ⭐ **[AUDIT GATE] Privacy / data-flow audit** | Trace EVERY egress and prove [D41]'s claim literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs. Owns retiring *"100% private"* and the ASC privacy label. 🔴 **P6.3 hands it a live counterexample** — `PRIVACY_CLAIM.body` still says *"stays on this device"* |
| **P6.10** | ⭐ **[AUDIT GATE] Pre-submit functional + FINANCIAL-correctness money lens** · 🔒 **FEATURE LOCK CLOSES HERE ([D52])** | ⛔ **Last gate that can FIND a structural gap.** Boundary inputs across the engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios. ⛔ **Owns two carried defects:** `bulkMarkRequired.ts` writes pre-[D2] paid semantics · `appliedTopUp` is a manual-opt-in invariant every cushion reader must remember. Its filed queue is in the backlog below |
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
| **P6.21** | **ASC submission** | Listing · release notes *(lead with the 2.0 rewrite)* · privacy label declaring RevenueCat **and Sentry crash data** · **availability = US · CA · AU · NZ** *(🎯 2026-08-20)*. ⛔ **`£`/`€` storefronts are OUT of 2.0** — see the backlog for what they cost · ⚠️ App Review paywall-findability: the notes MUST say *"Tap ••• More → Unlock Premium"* · the assets from P6.20 · the launch-FLIP value gate · ⚠️ **A2-5** — the ASC-registered Marketing URL index page (`jsnyde03.github.io/debt-planner-site/`) was audited by **NO lens** and almost certainly repeats the same premium block the listing carries → [`DEBT_SITE_COPY_2.0.md`](DEBT_SITE_COPY_2.0.md) |

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

## ▶ P6.8 — the FINISH sweep

| # | Step | State |
|---|---|---|
| ✅ | **P6.8.1–.6** the matrix, the surface census, **13 lenses**, **6 refuters**, the synthesis file, the structural-gap list | DONE 2026-08-21 — 226 frames · 9 a11y trees. [`audits/2026-08-21-p6.8-finish/SYNTHESIS.md`](audits/2026-08-21-p6.8-finish/SYNTHESIS.md) is the decision document. ⛔ **33 of 34 observations survived; 11 of 34 mechanisms were wrong** |
| **P6.8.7** ▶ | 🔴 **BUILD EVERYTHING EXCEPT THE REFUTED** | Clusters **a–g**, sequenced so the GUARDS land first. **a–f CLOSED; g is ACTIVE** *(decomposed at the top of this file)* |
| **P6.8.8** | **`validate:release:rn` green** | *(it records itself — do not type the result)* |
| **P6.8.9** | 🔴 **[AUDIT GATE] THE VERIFICATION PASS** | Re-audit the RESULTS: *(a)* every fix actually fixed its finding, and *(b)* **no other major+ issue remains**. ⛔ **Fixes are changes, and changes are unaudited.** Its filed queue is the largest block in the backlog below |

### P6.8.7 — the clusters

| # | cluster | state |
|---|---|---|
| **a** | ⭐ **GATES FIRST** | ✅ DONE 2026-08-21 — all six mutation-verified, plus **[a-1]** `typecheck:scripts` *(the guards now have a compiler; third time this hole has been found)* |
| **b** | **COPY** | ✅ DONE 2026-08-21 — A4/M1-9 · C6 · M1-8 · **L1-22 apostrophes 94 → 0, the gate is now absolute** · P1-10's copy half · A1/A2/A3 drafted. ⛔ Four premises were wrong |
| **c** | **DATA INTEGRITY** | ✅ CLOSED 2026-08-22 — B1 · B4 · W1-6 · M3-20 |
| **d** | **CLOUD / DESTRUCTIVE** | ✅ CLOSED 2026-08-22 — B3 · C9 · M3-5 |
| **e** | **THE CORE LOOP** | ✅ CLOSED 2026-08-23 — B2 · C1 · C2 · C5. C4 verified + filed as a device row; C3 → 2.1 |
| **f** | **VISUAL + A11Y** | ✅ CLOSED 2026-08-24 — B6/V1-2 · V1-5 · V2-1 · V2-6 · V3-1 · V3-5/6 · V4-8 · A1-2 · A1-7 · A1-8 · A1-9 · A1-10. ⭐ Added **`lint:contrast`** and **`lint:type-scale`**, both of which out-found the slice they served |
| **g** ▶ | 🔴 **NEW SURFACES** | ▶ **BUILDING — decomposed at the top.** C8 the CSV parser rescue *(the earliest deadline in the audit)* · P1-3 · C7 |

⛔ **Two results from a–f govern g and P6.8.9.** *(1)* **A finding names the property that is WRONG; a fix
must preserve every property that was RIGHT — and no lens enumerates those, so they are found only by
building.** *(2)* **c, d and e closed LISTS; f gated CLASSES, and the difference is measurable** — all three
of f's gates found something its slice had not. Detail → log.

**Exit (P6.8):** every non-refuted finding carries a fix or a recorded reason, the structural-gap list has
been **answered by 🎯** rather than silently absorbed, `validate:release:rn` green, and **P6.8.9 confirms it
independently** rather than on my word.

---

## ⏸ Waiting on Jason

▶ **The actionable list is [`DEBT_2.0_YOUR_STEPS.md`](DEBT_2.0_YOUR_STEPS.md)** — every step needing a human,
an Apple login, a device or a decision, in the order it is worth doing. This section is the **reasoning**;
that file is the **checklist**.

**Open decisions**

- 🔴 **[DECISION] g.3 — C7's side-by-side shape.** Present before building, the way R5's shape was settled.
- 🔴 **[DECISION] P1-1 · P1-2 · P1-4 · P1-5 — four majors in no ledger.** [D58] answered **P1-3 only**; these
  four were never judged either way — **missing, not declined** — and are now visible to the gate. → **P6.8.9**.
  *(The instrument was the cause: `check-audit-closure.ts` anchored `**Severity:**` at line start and
  `P1-premium-bar.md` writes it mid-line, so the whole lens was invisible. Fixed — 80 → **87** high+.)*
- 🔴 **[DECISION] P1-10's Windfall tier gate** — free does the WORK, premium reports it, which is the premium
  spec's price test upside down. The **copy** half shipped at 7b; the tier change is a monetisation call
  inside a converging freeze and **must clear P6.10** if taken. → **P6.10**.
- 🔴 **[DECISION] the v1.6 bridge that keeps failing is a SILENT LOOP.** Recommendation: **2.0 if the device
  pass shows any real skip, otherwise 2.1** — Sentry now reports every inconclusive skip, so **P6.14 produces
  the evidence** rather than it being guessed now. → **P6.10** *(new surface)*.
- 🔴 **[DECISION] L1-20 — the eyebrow treatment. Recommendation: DEFER the sweep.** ⛔ Its mechanism is
  **false on iOS** — RN uppercases the `NSString` itself, so VoiceOver reads "PAYDAY GUARDIAN" either way.
  **23 edits + 32 test pins for a change users cannot see.** ⭐ The valuable slice is a single `eyebrow`
  token, which is cheap and can ride any later visual pass. *(P6.4 → P6.8 W2)*
- 🔴 **[DECISION] L4-13b — `PressableScale` app-wide or nowhere. Recommendation: "NOWHERE", plus a small
  2.0 build.** ⛔ The finding says two press vocabularies; **there are three, and the majority is the
  third** — of 69 tap targets **1 springs, 11 dim, 57 have none**. So "app-wide" is a **new design on ~45
  targets inside a freeze**, with zero test coverage. ⭐ **What is worth building either way:** the
  half-closed token — 7 inline opacities are still live and two cards on Money disagree with each other.
  *(P6.4 → P6.8 W2)*

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
[D48] batched build are all done. Reasoning → log. ⚠️ **This list decays one way** — closing a decision
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

## 📋 P6.14 reference — the device-QA ledger

Verify on real hardware; web cannot cover these. **🎯 The runnable truth is
[`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md)** — §11 · §12 · §13, plus the 60
coverable-not-built rows and 3.5's folded-in pass ([D35]). This is the index, not the list. ⚠️ Read figures
from [`audits/coverage-split.md`](audits/coverage-split.md), never from a doc quoting them.

**🔴 Highest-value row — P6.8.7e.5 [C4], and it settles a premium feature:**
- On a **premium** device with **Payday Countdown ON**, sit inside the last 3 days of a real pay cycle
  **without re-saving the paycheck sheet**, and record whether the Live Activity ever appears.
- ⛔ **Expected from source: it does not.** The gate is `wholeDaysBetween(paycheck.currentDate,
  nextPaycheckDate) <= 3`, and `currentDate` is a **cycle anchor** that only moves at rollover — so it
  measures the cycle's LENGTH (~14 or ~30) and never counts down as real days pass.
- ⚠️ **Then the second run: re-save the paycheck sheet inside that window** (`paycheckForm` writes
  `currentDate: todayLocalISO()`) and confirm it DOES appear. The feature is not dead, it is **contingent on
  an unrelated user action** — which is why one row cannot be "does it work" but must be **both** runs.
- ⭐ **If confirmed it is 2.0 by default** (🎯's standing call: you cannot sell a feature and ship it dead).

**Owed from Phase 5** — fixed and unit-covered, never seen on a device:
- Import a **v1.6 backup FILE** and confirm the restore does **not** land in onboarding.
- The **document picker** — pick `v17-envelope.json` from **iCloud Drive**, not local *(local would not
  exercise `copyToCacheDirectory`)*.
- The **`v16-damaged` repair report** naming *Visa · balance* and *Electric · amount*.

**Owed from 7d.1 [B3] — the clobber guard, none of it provable off-device:**
- Flip **Back up to iCloud ON** where the container already holds a backup this install never restored. The
  declined copy must still be there, and the sheet must offer **the fork** rather than *"Last backed up …"*.
- Take **"Replace it with this device"**, then background **twice**: the second auto-backup must go through
  *(it proves the write re-stamped `cloudBackupRemoteAt`; if not, the guard blocks forever)*.
- **Restore** from iCloud, then background: same *(the blob's own copy of the stamp is always one stale)*.
- ⚠️ **Kill the app immediately after backgrounding** — the stamp rides `flushPendingSave()`. Expected worst
  case is a **false conflict**, never a loss.

**Owed from 7d.2 [C9] — the delete, whose refusal branch web cannot reach:**
- **Delete all data with a backup in iCloud** — the file must be **gone** and the next launch must not offer
  a restore.
- **Delete all data signed OUT of iCloud** — nothing may be deleted; the blocked message must render and
  **"Delete on this device only"** must wipe locally and leave the remote alone.
- **Delete all data with iCloud reachable but the unlink failing** (airplane mode mid-tap) — the `error`
  wording, and **Try again** succeeding once connectivity returns.

**Owed from f, all three structural to react-native-web:**
- **VoiceOver on, type an amount into Can-I-Afford-It** — confirm the verdict is **spoken**
  (`announceForAccessibility` is an empty body on web, so the spoken half is unprovable in the harness).
- **Read the Progress hero on a small device at a wide month** — September, November, December
  (`adjustsFontSizeToFit` is a no-op on web; the 320 pt guarantee is an iOS-only claim).
- **The dashed `AddRow` and every `Switch` OFF track sit at 1.41–1.90:1** on `border.strong`, left un-fixed
  on purpose *(both are identifiable by other means, so 1.4.11 is not violated)*. ⛔ Recorded so the next
  sweep **re-decides** it rather than re-discovering it — the felt severity of a hairline is a device
  question and DPR 1 flatters it.
- ⚠️ `insets.bottom` is 0 on web and ~34 pt on a device, which pushes **more** viewports into f.3's broken
  branch. The device can only widen that finding, never narrow it.

**Also owed:** a row for **R4** *(enter the demo as an onboarded user, edit a bill, exit, confirm the real
plan is unchanged — write containment is proven on web only, and R4 was found on a device)* · which branch an
induced **MMKV fault** produces · the `deleteBlocked` refusal path · **[T3.2]**'s storage-fault row ·
**A0.4** · **A8.4** *(the Siri phrases, incl. the load-bearing `\(.applicationName)` check)* · **§3.1.2** SF
Symbols on the min-iOS target · **§2.8** native scan · **§2.11** RevenueCat real purchases + restore ·
**§3.3.1** the AHAP crescendo FEEL · **§VIS-2/B2** share rasterizes fully · **§3.4** `expo-blur` real
material · **§3.5** Live Activity / Island / widgets / App Intents · **§3.6** iPad both orientations, Split
View, Stage Manager, pointer/keyboard · **§VIS-6** sound + notification delivery. Highest-value single legacy
row: **§11.15**, the iPad ring-origin invariant.

⛔ **Five rows stay `[D]` for stated reasons, and they are forward guidance.** **§5.4 StandBy is PERMANENT**
— *"put the phone on a charger"* is physical state a simulator has no concept of. **§5.1** · **§5.3** ·
**§6a.2** *(needs a 15/16 Pro sim)* · **§10.3** each need their own probe first. The three `[A]` ⌘-key rows
stay `[A]`.

**⭐ [SUB-AUDIT] Premium-accessibility** — VoiceOver rotor + a full walk · Dynamic Type AX3/AX5 reflow ·
reduce-motion · contrast both themes · focus order · touch targets. **WCAG 2.2 AA is the FLOOR.**
- ⛔ **BOTH GUARDS COVER 2 OF THE 4 NATIVE-ONLY PROPS.** eslint and `check-native-a11y-props.ts` ban
  `accessibilityElementsHidden|importantForAccessibility` but **not** `accessibilityValue` or
  `accessibilityState` — yet react-native-web drops all four identically. ⚡ **The guard written for one
  instance of the class does not cover the class.** ▶ Extend both; `accessibilityState` appears in **11 files**.
- ⚠️ **`CheckCircle` reports no checked state on WEB** · **`ListRow`'s swipe-to-delete announces a hidden
  Delete button on EVERY row.**

**⭐ [SUB-AUDIT] Performance-feel** — 120fps ProMotion · Skia redraw cost · cold-start TTI · list jank ·
optimistic-UI feel. Includes the Today/cushion-forecast memoization check *(conditional on a real measured
hotspot)* and Dynamic-Type device QA.

---

## Deferred backlog

⛔ **Grouped by WHERE IT LANDS, because that is how it gets read.** The `(x.y)` tag is the item whose scan
surfaced it — its full reasoning is in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) under that item.

### → P6.8.9 — the verification pass

- ⭐ **EVERY FIX IN f THAT NEEDED A SECOND ATTEMPT FAILED ON A PROPERTY ITS FINDING NEVER MENTIONED.** For
  each built fix, ask **what the site did BEFORE that it must still do**. *(f, whole-cluster)*
- ⭐ **c, d and e closed LISTS; f gated CLASSES, three for three.** Re-check those classes, **not** those ids.
  *(f, whole-cluster)*
- ⚠️ **f's own tests inherit f's own lesson** — `a11y-row-labels`, `coach-marks` and the affordability live
  region all assert the fix's **INTENT**, so none would catch the next fix breaking an adjacent property.
  That is exactly how A1-7 got through twice. *(f)*
- ⛔ **A test written to prove a fix is scoped to the fix's INTENT; the regression lives in what the fix ALSO
  did.** `useInert` removed the tab stop **and** made `SwipeDeleteAction` non-interactive — swipe-to-delete
  silently stopped working on web while the new spec passed. Only the full suite caught it. *(f.5)*
- ⛔ **AN ASSERTION AGAINST A PROXY FOR THE SUBJECT IS NOT AN ASSERTION ABOUT THE SUBJECT.** V2-6's test
  passed with the defect planted back. **Re-check what each new spec asserts AGAINST, not only that it goes
  red.** *(f.3)*
- ⛔ **A plant must red for the RIGHT reason, and a marker must survive the change the test is not about.**
  A copy assertion used `payday-reopen` — the control the other plant removes — and would have reported a
  copy regression that never happened. Worth one sweep of the specs added this phase. *(e.3)*
- 🔴 **`RequiredActionsCard` carries a contradiction and one half of it is a defect.** Its comment says
  gating a swipe pane on React state was **measured** to reset `ReanimatedSwipeable`'s pan; the shipped code
  in that same file does exactly that. `ListRow` fences its pane permanently and inherits neither. *(f.4)*
- ⚠️ **The light-theme frames in `capture-ref/p6.8/` no longer describe the app** — every light token moved.
  **Re-shoot the light half of the matrix before this pass reads it**, or it audits a photograph of the
  defect. *(f.1)*
- ⛔ **A FIFTH stated mechanism wrong.** R6's `numberOfLines` census reports `TrajectoryChart.tsx:360` as
  unbounded; it carries `numberOfLines={1}` and did before f.2 touched it — the unbounded set is **three, not
  four**, inside a refutation whose whole point was a miscount the other way. *(f.2)*
- ⛔ **A FOURTH mechanism wrong in two clusters, caught by a TEST rather than by reading.** C5's stated harm
  is false — `minimum_debt` is a required category, so no zero-branch renders. Running tally **B3 · B2 · M3-5
  · C5**. **Re-read every fix against its finding's stated mechanism, not just against its id.** *(e.4/e.5)*
- ⛔ **CHECK EVERY ID THE BUILD SCHEDULES AGAINST THE REFUTATIONS, not against the slice's owed-list.** M3-20
  and M3-5 were both scheduled as work and never refuted; the owed-list check would have passed on M3-5,
  because it was never on one. Nothing in the audit folder flags a refutation that never arrived. *(c.3, d.1)*
- ⛔ **M3-7 — `_layout`'s launch restore offer and `DataResetScreen` drop the SAME diagnosis.** M3-5's site
  list was **1 of 3**. On the launch offer the silence is arguably right; on `DataResetScreen` it is not —
  that user is already in a recovery flow being offered iCloud as the way out. *(d.3)*
- ⛔ **Repo-wide grep for `router.back()` against `canGoBack()`** — a five-minute gate-shaped question nobody
  has asked. The repo had already tagged this defect `[C9]` **twice** while the destructive screen still had
  it, and *"Delete everything" silently did nothing on cold entry*. *(d.2)*
- ⛔ **ASK OF EVERY IRREVERSIBLE CONTROL WHETHER ANYTHING EXERCISES IT.** 13 lenses and 6 refuters read this
  app and none reported that "Delete all data" had **zero** coverage. Two of three surviving e2e gaps this
  phase were found by **changing** the code, not by reading it. *(d.2, e.1)*
- ⛔ **`seedStore` re-seeds on every navigation and silently undoes what a test just did.** A `seedOnce`
  belongs in `helpers/seed.ts`, and the specs that mutate-then-navigate need sweeping. `coach-marks.spec.ts`
  already carries a comment about this exact mechanism — second time it has been paid for. *(e.1)*
- ⭐ **A gate could assert every glyph used in `apps/rn/src` is in `appIconSF`.** An unmapped glyph falls back
  to MaterialIcons on iOS: nothing breaks, nothing warns, and it looks foreign. The file's own header warns
  about this class and nothing enforces it. *(e.4)*
- ⚠️ **`AmortizationView` calls a BNPL's `bnplMonthlyEquivalentMinimum` "the minimum"** — it is a monthly
  *equivalent* of an installment minimum. Precision, not a lie. *(T4–T8; was routed to P6.8, whose sweep has
  since run without confirming it)*
- ⚠️ **The timeline's cushion row label is unasserted** — `buildTimelineItems` pushes it and `TimelineLedger`
  renders it, but no spec reads it, so T4.3's rename there is unverified by the gate. *(T4–T8; was routed to
  P6.4, which closed)*
- ⛔ **`WhatIfControls` has NO e2e spec at all** — and it is the surface the `Slider` VoiceOver defect
  actually lived on. The existing `aria-valuetext` assertion was `/^\$\d+$/`, **a regex that REJECTS the
  correct answer**, green only because it was pinned to a surface that cannot exhibit the bug. Not gating —
  `lint:money` catches the class permanently; what is missing is a pin on the rendered a11y string. *(P6.4.2)*
- ⚠️ **MOVING A FILE INTO `packages/core` SILENTLY DROPS IT FROM `lint:comments`, AND NOTHING FLAGS THAT.**
  Measured rather than assumed: `lint:money`, `lint:apostrophes`, `lint:glossary` and `strings-inventory`
  all scan **core + `apps/rn/src`**, so copy stayed gated when `amountField.ts` moved — but
  `check-comment-convention.ts`'s roots are `apps/rn/src` and `apps/rn/tests` **only**. ⭐ The decidable
  version is a gate on the gates: assert every copy/convention scanner covers the same root set, so a move
  cannot quietly reduce coverage. **The "gate the class" shape, one level up.** *(g.1)*
- **Gate docs owe two lines** — the suite's three ways of lying *(broad red that is noise)*, and
  `cmd; echo EXIT=$?` reporting the echo.

### → P6.10 — feature lock + the money lens *(last gate that can FIND a structural gap)*

- 🔴 **[DECISION] `actualIncome` capture for variable-income users — DEFERRED BY 🎯, not dropped.**
  `substrateProducers.ts:60` returns the store unchanged when `incomeVaries` and no `actualIncome` is
  supplied, so **`incomeActualsLog` never grows for exactly the users it exists for**. Consequences that ship
  without it: **`LeanSuggestionCard` stays unreachable** and `guardianPredictionCore`'s confidence stays thin.
  ⭐ The expensive half — threading actuals through `onCapture` → `capturePayday` — is already shipped by e.2.
  *(e.2)*
- 🔴 **[DECISION] the v1.6 bridge that keeps failing is a SILENT LOOP** — see *Waiting on Jason*. *(c.3)*
- 🔴 **[DECISION] P1-10's Windfall tier gate** — see *Waiting on Jason*. *(7b)*
- ⛔ **AN ABSENCE ASSERTION PASSES BEFORE THE APP RENDERS, and it bit on two consecutive items.**
  `expect(x).toHaveCount(0)` is satisfied by a blank page. Both times measured by a **plant**, never by
  review. ▶ Sweep every `toHaveCount(0)` / `not.toBeVisible` for a preceding render barrier. `lint:selectors`
  cannot see this — it is about selector shape, not ordering. *(c.2)*
- ⛔ **A GREEN `lint:rn` DOES NOT MEAN THE TREE IS PURITY-CLEAN.** `react-hooks/purity` reports a component's
  `Date.now()`-in-render violations only while the React Compiler can still analyse it — `DebtSheet` linted
  clean and produced 2 errors the moment an unanalysable call entered render scope, with the `Date.now()`
  calls **untouched**. So the lint samples this class rather than gating it, and `FirstDebtOrBillStep`
  carries the same shape today, unreported. **A masked lint class is a structural gap.** *(c.1)*
- **`localId` / `nextGoalId` can hand out a DUPLICATE id across a relaunch** — module counters reset to `0`,
  namespaced by a cycle date that does not move within a cycle. ⚠️ `AffordabilityCard`'s own comment asserts
  the opposite. c.1 deliberately did not copy the pattern into `DebtSheet`. *(c.1)*
- **An unpolled `readStore` in an e2e passes vacuously** — it reads before the write flushes and asserts over
  the seed alone. Found by a plant: one spec **passed with the defect planted back**. 12 `readStore` calls
  exist and one visibly polls; the rest need checking individually, not a blanket edit. *(c.1)*
- ⛔ **AUDIT THE PLAN FOR OTHER ✅ THAT MEAN "DECIDED" RATHER THAN "BUILT".** [D44] sat in a queue row as
  shipped for a day and a half and the step did not exist. A decisions ledger marks ✅ when a call is
  **settled**; a queue row marks ✅ when work is **shipped** — same glyph, and the queue row is the one a
  reader trusts. Cheap: every `[Dnn] ✅` referenced from an OPEN item, checked against the tree. *(P6.7)*
- ⚠️ **`testFullAppRegression.ts:63`'s conservation assert holds only when the reserve FITS** — with an
  over-sized everyday reserve, `paycheckAmount − livingExpenseReserve` goes negative while the allocation sum
  floors at 0. Not exercised today. *(T4–T8)*

### → P6.9 — the privacy / egress audit

- ⛔ **ASK THE SAME QUESTION OF EVERY OTHER GUARD IN THE REPO: does it PREVENT, or only DESCRIBE?**
  `useNoRealWritesGuard` survived a 117-finding audit and its entire contribution to the ship-blocker was an
  accurate description of the corruption **while it happened**. ⚠️ Not a code change — a lens. The `3.5.0.6`
  sync-seam guards are named in its own docstring as *"the same move"*, so they are the first place to look.
  *(R4)*
- **[D41]'s rewrite of `PRIVACY_CLAIM.body`** — it still says *"stays on this device"*, which the iCloud
  toggle makes false. ⛔ **P6.3 must not SHIP without it landing here.**

### → P6.11 — delete with the tree

- 🔴 **P6.4.6's obligation.** Four dead-code findings resolve to *"delete the consumer, then re-check"*:
  **L4-11** `formatDisplayAmount` *(3 live sites in `components/ResultsSection.tsx`)* · **L6-4/5**
  `projectForecast` *(`components/SnowballSection.tsx:290`)* · **L3-5** `buildSmartInsights`
  *(`SnowballSection.tsx:245`)*. After the root tree goes all four are genuinely dead and must go **with** it,
  or P6.11 leaves four unreachable modules every later sweep re-reads. ⚠️ **L3-5 carries a latent defect**
  (a capped promise, *"Hold back $X to restore a safer $200 cushion"*) — **delete it, do not revive it.**
- **`progressColor()` in `apps/rn/src/theme/colors.ts` has no callers**, but is exported through
  `theme/index.ts` so it reads as public API. Left in place and made to **derive** its rgb from the token so
  it cannot diverge while it waits. *(f.1)*
- **T10's dead-code verdicts owe a re-check against the ROOT tree** — `formatDisplayAmount` was called dead
  and has three live legacy call sites. ⭐ Deleting last is what keeps that tree readable long enough to check.
- 🔴 **`debtCsv` WAS NOT THE ONLY MODULE ON THIS DEADLINE, and the rest fail the other way round.** ⛔ **Core
  imports FROM the dying tree in four places** — `history/selectVisibleHistory.ts` *(production code, and it
  has **zero callers in `apps/rn`**, so it is dead core code)* plus `testSafeStorage`,
  `testSubscriptionGating` and `runRegressionTests`'s `@/lib/storage/testMigrateOriginalBalance`. They rest
  on **five root modules totalling 293 lines** (`lib/subscription/{plans,hasFeatureAccess,features}` ·
  `lib/storage/{safeStorage,migrateState}`). ⚡ **Different failure shape from C8:** the parser would have
  gone *silent*; these break `test:regression` **loudly** — which is why they need moving, not rescuing.
  ⚠️ `packages/core/tsconfig.json`'s own `@/*` alias comment already routes them here; **the P6.11 row lists
  what to REMOVE and never what must MOVE FIRST.** *(g.1)*
- **Split `DEBT_ELEVATION_LOG.md`** (18.4k lines, well past one-pass readability). ⚠️ Its ordering is mixed —
  newest-first at the top, but f.1–f.5 and [D58] appended at the **end**; the split should settle one order.

### → 2.1

- 🔴 **`lint:contrast` IS BLIND TO A CONTROL WITH NO BORDER AT ALL.** It holds `border.control` to 3:1, which
  answers *"is the boundary visible"* and not *"is there one."* A `Slider`, a bare `TextInput`, a pressable
  row bounded only by spacing — none fail it, and none were in V1-5's scope either. A real gap, not a
  ship-blocker; naming it beats a gate written in a freeze. *(f)*
- ⭐ **Nothing compares a spoken string against the shipped glossary** — `lint:glossary` pins the constant and
  no gate reads an `accessibilityLabel`'s **contents**, which is how A1-2 lived. The decidable version is
  narrow and worth having: flag a label template that interpolates a **raw engine status field**. *(f.4)*
- ⏭ **C3 — a user away one cycle + 8 days.** SYNTHESIS said *"fold into C2 … if it doesn't fall out, defer."*
  **It does not fall out:** C2 re-opens capture for the CURRENT cycle; C3 is a cycle already stepped past.
  What survives is that **the cycle can never be reconciled and the escape hatch destroys it silently.**
  Recorded here rather than letting "folded" quietly mean "done". *(e.3)*
- ⚠️ **`DebtSheet` REFUSES a balance edited to $0** — `minimumN > balanceN` is true of **every** debt at the
  moment it is paid off. Not a ship-blocker *("Log a payment" is the intended affordance and it works)*, but
  a user who paid off elsewhere hits a wall with no hint about the other door. Exempting `balanceN === 0` is
  one clause; validation on the money path inside a converging phase is not where to spend the risk. *(e.1)*
- ⚠️ **`PlanState` has no `'no-bills'` member** — e.4 branches on `requiredExpenses.length === 0` at two call
  sites because the union drives routing. ⭐ **The type is the right home** — it is what made the asymmetry
  invisible in the first place. *(e.4)*
- **`completeCapture` and `dismiss` are indistinguishable after the fact** — both only stamp
  `lastHandledPaydayDate`, which is why the card's copy had to become neutral rather than accurate. A one-bit
  distinction would let both the card and `cycleHistory` be honest. *(e.3)*
- ⭐ **A fake cloud provider behind an `EXPO_PUBLIC_` flag would make the whole feature e2e-testable** — the
  same shape `demoSession` already uses. The `ready` branch of `CloudBackupSheet` is untestable by
  construction today; the toggle, the conflict fork and both buttons are **source-only**. *(d.3)*
- **Two `stat()` round-trips per sheet refresh** — `getCloudBackupStatus` and `inspectRemote` each call it.
  Correct but wasteful on a native path. *(d.1)*
- **`api.setState` is the one seam R4's veto does not cover**, by design — actions route through the wrapped
  `set`. Today it carries only `isHydrated`/`storageError`, neither in the `store` blob. ⚠️ **File, do not
  fix:** wrapping it would put the veto in front of `hydrate`, and refusing a hydrate shows an empty plan.
  Revisit only if a plan-bearing `setState` ever appears. *(R4)*
- **`npm ci` does not work in `apps/rn`** — that lockfile is out of sync with its `package.json` (~12 missing
  transitive entries), so three workflows use `npm install --prefer-offline`. ⚠️ Noted in two workflow
  comments as *"filed separately"* and never actually filed — **this is that filing.** *(P6.7)*
- **L5-15 — currency is pinned to `en-US`/USD** while the paywall renders the store's real `priceString`.
  ✅ **Safe to defer, verified not assumed: no currency code is persisted anywhere**, so 2.1 adds the hook
  with **zero migration**. ⛔ **Deferred on COST, not on the lock date** — the formatter half is small (2
  sanctioned + 3 hand-rolled live + 3 dead, and `paywall.tsx:85` already extracts the real symbol) but there
  are **111 literal `$` in non-comment source lines** plus the whole test corpus. An unbounded string sweep
  is the exact shape of change you do not take late. ⚠️ **Conditional on P6.21's availability call** — AUD and
  NZD both render `$`; open a `£`/`€` storefront and this becomes the app reading in the wrong currency on
  every screen. **Owed either way: a release-note line.**
- **L2-14 ("Autopay", six surfaces) · L2-22 ("BNPL" pill fallback)** — domain nouns a rename would touch
  deliberately. A shared constant buys indirection and no safety. Revisit only if either term is renamed.
- ⚠️ **Show the backup's own date in the replace-confirm** — the summary says *what* is in the file but not
  *when* it was saved, and *"am I about to overwrite three months of work with something stale"* is the
  question a destructive confirm should answer. The envelope already carries `exportedAt`. ⚠️ **Two sites**
  *(the iCloud restore confirm has the same gap and already renders the file's mtime one line above it)* —
  fix both together or neither. *(5.8.4, P6.3)*
- ⚠️ **Retire `raw-v17` import acceptance** — the weakest of the three markers, existing only because the
  pre-5.8 clipboard export has no envelope. The RN app has never shipped, so the only holders are TestFlight
  testers, who can re-export. **Re-decide with the tester window closed.** *(5.8.2)*
- ⏭ **THE FREE TRIAL — the 2.1 lever ([D53]).** 30 days minimum, **annual only**. ⛔ **The code is wired and
  DELIBERATELY INERT:** `introPrefix(pkg, eligibility)` renders only on `'eligible'` and every caller passes
  `'unknown'`, so turning it on is a config change **plus** a code change, enforced by the compiler. ⚠️
  **Thread `checkTrialOrIntroductoryPriceEligibility` before flipping anything in ASC**, or the paywall
  promises "30 days free" to a returning subscriber Apple will charge in full. Needs a device row with a
  sandbox account that has already consumed its trial.

### → INTERNATIONAL — a workstream, not a line item *(scoped 2026-08-20)*

⛔ **The EU is blocked by a HARD INPUT DEFECT, and it is not L5-15.** Every amount field is a `decimal-pad`
keyboard parsed with `Number(...)` — `DebtSheet` ×6, `ExpenseSheet` ×4, `GoalSheet` ×2, `LivingExpenseSheet`,
`LogPaymentSheet`, the onboarding step. On a German/French/Spanish/Italian device **`decimal-pad` renders a
COMMA**, and **`Number("2400,50")` is `NaN`** — so the user cannot enter their balance at all, and the
`Number(apr) || 0` paths coerce that `NaN` to **0** silently. ⚡ **Shipping to a comma-decimal storefront
today is WORSE than not shipping there**: the wall is at onboarding, on the first number they type.
⚠️ **Also owed, neither is code:** **DSA trader status** *(Apple requires a verifiable trading name +
address, published on the listing, for any EU distribution)* and a decision on English-only.
⭐ **Re-scoped honestly:** the *product* fits — `PayCycle` already carries `"monthly"`. What is US-shaped is
the **vocabulary** ("paycheck", "BNPL"), which is a rewrite, not a blocker. **The order is: input parsing →
trader status → L5-15 → vocabulary.** Currency is the cosmetic layer on top of a real defect.

### → Tooling / hygiene

- ⚠️ **The APP ICON disagrees with its documented source.** Rasterising `render-icon2.html` against the
  shipped `apps/rn/assets/icon.png`: the icon is **globally darker** (corners `#3b2d7e` → `#0a051c`, bars
  `#34d390` → `#1cad96`) and its corner and 40px inset are **identical** — the signature of a **baked-in
  squircle with a dark surround**. ⛔ That contradicts the icons README (*"full-bleed, no alpha, iOS masks the
  squircle"*), and a pre-masked icon gets masked **again**, so any inset shows as a dark rim on the home
  screen. **One second to check — look at a home screen** — and it is App-Store-facing, so it wants an answer
  **before** submission. *(P6.6/[D51])*
- ⚠️ **Two `maestro test` calls write no JUnit** (`11-reduce-motion`, the iPad's dark re-run of `i02`), so
  their verdicts never reach the durable record. Harmless today — both are measurement runs — and it is the
  same hazard `maestro-results.mjs`'s header documents for flow `09`: **the next flow added in its own
  invocation disappears silently.** ⚠️ `lint:lane` is where this becomes a check.
- ⚠️ **The embed's public URL names the repo** — `jsnyde03.github.io/debt-app-v1/`. Fine for an iframe; a
  custom domain or a repo rename removes it. **A brand call with a DNS dependency** → 🎯 whenever the
  marketing page exists.
- ⚠️ **Maestro is unpinned** — `get.maestro.mobile.dev` fetches latest, and 4.1.1 spent three cycles
  establishing which commands this build supports. A silent upgrade can retire one.
- **No local pre-flight for the capture path** — a flagged web export + ~40-line check would have caught
  several CI cycles' worth of defects.
- 📋 **Real-device cloud testing — as DEVICE-MATRIX coverage, not a way to shrink the manual pass.** ⛔ It
  moves only **3–6** `[D]` rows. ⭐ The real gap it closes is that everything runs on **ONE sim config** —
  §11.1 says outright *"a wide phone can pass while an SE fails"*. Maestro Cloud is the zero-rewrite path.
  **Triggers:** Android at v1.8, or the first width-driven bug that reaches a user.
- ⛔ **REFUSED WITH MEASUREMENTS, do not resurface:** **ccache** *(`0/648 cacheable` twice; both stated
  mechanisms wrong, and modules-off cost 888s vs a 771s baseline — the only remaining avenue is prebuilt pod
  binaries)* · **DerivedData caching** *(~70% of the boot step is simulator boot + install, which it cannot
  touch, against multi-GB in a 10GB cap where LRU could evict the `.app` cache saving 17 minutes — the
  optimisation eating the optimisation)*.

### → Genuinely a later version / tier

- **`typicalAmount` still has no UI** → the wording/cohesion gate.
- **The app never shows a debt-free date reflecting its own plan working** — on day one the starter EF absorbs
  the surplus, so every projected date is minimums-only. Honest per screen; the question is the app-wide
  effect → the cohesion audit, **not a defect**.
- **The paywall lead has NO e2e coverage** — pinned only by `paywallLead.test.ts`; no Playwright spec asserts
  any branch. *(was routed to P6.4, which closed)* → 2.1.
- **The demo's beat dwell may be too short for the runner** — decide from the 2fps contact sheet.
- **Apple Watch** → v1.8+ · **`@gorhom/bottom-sheet`** → v1.8 Android · **Behavioral mis-entry /
  persistent-cushion / bill-shock autopilot** → Connected/Plaid tier · **Holiday/promo free-trial** → a
  reversible later lever · **iOS-18 Control Center** [D1] · **web light-mode hover screenshots** *(a QA
  artifact, not product)*.

### ✅ Closed since filing — recorded so they are not re-filed

**L1-22** apostrophes *(7b took the baseline to 0; the gate is absolute)* · **`scripts/*.ts` typechecked by
nothing** *(built at 7a-1 as `typecheck:scripts`)* · **`clearQuarantine` had zero call sites** *(fixed with
C9 at 7d.2)* · **both Pages threads** *(P6.7's `guard` job; verified in the workflow 2026-08-24)* ·
**L5-19's trial call** *(answered by [D53])* · **the e.2 entry-point shape** *(built at e.2)* · **A1-11**
*(closed at 7a)* · **W1-1 · W1-3 · W1-4 · W1-10 · W1-12** *(all closed at 7a)* · **L1-23** *(refuted at
P6.4)* · **L1-30** *(moot at P6.4)*.

⛔ **L5-12 — "the paywall never mentions the user's own money" — IS CLOSED, and the plan carried it as the
best open structural-gap candidate in two places until 2026-08-24.** M1's lens measured it and asked for
exactly this correction: *"the record should be corrected: L5-12 is closed, not open."* ⚡ **A finding the
plan advertises as its best remaining opportunity is the one nobody re-checks** — the same
`waiting-lists-decay-one-way` shape, in the backlog rather than the decision queue.

---

## The 62 findings [D37] did not cover

⛔ **The complete list is [`audits/2026-08-17-v1.7-audit-gate/REMAINING.md`](audits/2026-08-17-v1.7-audit-gate/REMAINING.md)**,
**generated** (`tsx scripts/check-audit-closure.ts --remaining`) — never hand-maintained. **41 minor · 21
polish.** ✅ **All 62 judged at P6.4 ([D42]: a BAR, not a COUNT); 29 were not work.**

⛔ **Why the generated list exists: 20 of the 62 were named in NO ledger at all**, because T9–T11 were
*partial enumerations* and `lint:closure` only ever gated blocker+major. `lint:closure` now REPORTS the low
tier every run — never gates it, because an untraced minor is the expected state here and a gate that reds on
the expected state trains everyone to ignore it. ⚡ **Do NOT read it as 62 edits:** of the 61 cross-file copy
duplicates, **24 are generic chrome** that repeat by design and **5 involve `LiveActivityQA.tsx`, which the
`QA_TOOLS` flip deletes**. **L2-6 is the precedent for a "fix" that made five dead engine strings
load-bearing.** ⭐ **T10's dead-code verdicts still owe a re-check against the ROOT tree** → P6.11.

---

## Decisions

⛔ **A ✅ here means the CALL is settled; it does **not** mean the work shipped.** [D44] sat in a queue row as
built for a day and a half while the step did not exist — same glyph, different meaning. Full reasoning for
every entry → [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md).

**Phase 6 — launch**

- **[D58]** ✅ 2026-08-24 — **P1-3 is in 2.0**, built at **g.4 BEFORE C7** (C7 adds a curve to the same
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
