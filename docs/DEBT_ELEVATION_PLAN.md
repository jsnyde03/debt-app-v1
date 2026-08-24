# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — **Phase 6 · Launch-ready** *(Phase 5 ✅ CLOSED 2026-08-19)*

| | |
|---|---|
| **Where v1.7 is** | Phases 0–3 · **3.5** · **3.7** · **4** · **3.8** ✅ · the **whole-app audit gate** ✅ ([D37] 55/55, `lint:closure` in CI) · **Phase 5 ✅ CLOSED** — the migration is verified on a live device and the cutover is **conditionally approved**. **Phase 6 is everything that remains**, and it ends at ASC submission |
| **Ships as** | **`2.0.0`** ([D38]). The internal workstream keeps the name *"the v1.7 Elevation"* |
| **Gate** | `validate:release:rn` — **210 e2e · 10 embed · 10 `test:stamp` · 87 lane checks** + `lint:glossary` · `lint:money` · **`lint:apostrophes`** · `lint:closure` · **`lint:secrets`** *(the repo is PUBLIC — credentials live in the Codemagic env group, never the tree)*; tsc + lint clean, zero `error-context.md`. ~15 min locally. ⛔ **Record the run, never inherit it** — the gate was RED from `f4e5e11` (2026-08-19) to 2026-08-20 while three sessions carried a stale "last green" forward, and CI was failing on every push the whole time. ⭐ **THE GATE NOW RECORDS ITSELF ([D49], P6.7).** Its final link writes `gate-status.json` — SHA · UTC ·
a content fingerprint of 580 source files — **on success only**, and `npm run lint:gate-freshness` says in
under a second whether that pass still describes the tree. ⛔ **Do not type a gate result into this file
again; quote the record.** Last run 2026-08-21 at P6.7.6, exit 0, read directly: **212 e2e · 10 embed**. ⚠️ It took THREE red cycles to get there and every red was mine — an orphaned binding, a [D17] comment violation, and two specs pinning a retired string. **`apps/rn` lint now runs `--max-warnings=0`** (🎯: lint clean before launch), mutation-verified. |
| **Env** | `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` · e2e `npm run test:e2e:rn` |

⛔ **TWO LINES, NOT ONE ([D39]): FEATURE LOCK ≠ FREEZE.** ⚠️ **Both MOVED 2026-08-20 ([D52]).**
**FEATURE LOCK closes after P6.10** — the last gate that can *find* a structural gap. No new capability in
2.0 past it; a gap found after defaults to **2.1**. ⛔ **It was at P6.4 and that was incoherent:** P6.8 is
chartered to ask *"is anything missing"* and every answer would have auto-defaulted to 2.1, so the audit
could not act on its own charter. **CODE FREEZE closes after P6.18** — the last step that can *produce* a
change, so **P6.19's final build comes off a frozen tree**. ⚠️ **P6.20 is the one named way to break it**
(a visual problem in the assets costs another build); that residual is unavoidable and is why P6.18 must
be taken seriously. *"Frozen" is still not a milestone you schedule — P6.18 is where you converge to it.*

⚠️ **Numbering legend — two older labels are kept, not renamed.** `P6.n` is this decomposition's sequence.
**"6.C" (cloud backup) = P6.3** · **"6.5" (repo consolidation, was 5.5) = P6.11**, so a log entry or commit
naming `5.5.1` means **P6.11.1**. 🔒 = ship-blocker.

### ▶ Phase 6 — the steps *(🎯's own order, settled 2026-08-19)*

| # | Step | State / notes |
|---|---|---|
| ✅ | **P6.1 DONE 2026-08-20** — the shipped version is `2.0.0` ([D38]). All three premises held; folded in the two stale `1.7.0` quotes in `codemagic.yaml` and two tracked zero-byte junk files. Detail → log |
| ✅ | **P6.2 DONE 2026-08-20** — the feature-lock boundary is the **62** in [`REMAINING.md`](audits/2026-08-17-v1.7-audit-gate/REMAINING.md) ([D39]). Parser verified lossless (117 headings = 117 severities = 55 + 62); T9–T11 retired as drivers, carrying no id the generated list lacks. Detail → log |
| ✅ | **P6.3 CLOSED 2026-08-21** — cloud backup ships, **not** premium-gated. **Verified on hardware by 🎯**: iCloud rows 2–6 including the clobber guard, which was the cutover's approval condition. **The app is no longer frozen on it.** ⛔ **P6.9 still owes [D41]'s rewrite** — `PRIVACY_CLAIM.body` says *"stays on this device"*, which the iCloud toggle makes false. Detail → log |
| ✅ | **P6.4 CLOSED 2026-08-20** — all 62 judged, [D42] satisfied. ⛔ **29 of 62 were not work.** `validate:release:rn` green: 210 e2e · 10 embed. Detail → log |
| **P6.5** | **Sentry** | ✅ **`beforeBreadcrumb` scrub BUILT 2026-08-20** — Sentry's touch integration records a11y labels and Debt builds those from the user's balances, so this is the difference between [D41] being true and a crash shipping real money off-device (21 asserts, both plants red). ✅ **DSN DELIVERED 2026-08-20** (🎯) — in the Codemagic `AppleConnect` group, so Sentry **ships live in 2.0.0** → [`DEBT_SENTRY_SETUP.md`](DEBT_SENTRY_SETUP.md). ⛔ **This row said "needs the DSN from 🎯" for a day after it had been given** — the `waiting-lists-decay-one-way` shape, third instance this session. ⚠️ **Two consequences the row did not carry:** `codemagic.yaml:33`'s *"Sentry ships DISABLED (no DSN)"* is now a **stale comment**, and shipping Sentry means the **ASC privacy label must declare Diagnostics → Crash Data** (`[A3]`). ⛔ **Source-map upload stays OFF for the batched build** — a missing `SENTRY_AUTH_TOKEN` hard-fails the ARCHIVE, and that would kill the build before any of its three device checks ran |
| **P6.6** | **Splash screen** | ✅ **DONE 2026-08-20** — plugin configured (`icon.png` · `imageWidth: 220` · `#0a051c` · contain), verified reaching the plugin via `expo config --type introspect`. ⚡ **[D43] was right and my instinct was wrong, decided by LOOKING** at three rendered candidates: on the icon's own surround the badge *dissolves*; on the app's navy it reads as a pasted-on square → [`evidence/2026-08-20-p6.6-splash/`](evidence/2026-08-20-p6.6-splash/). ⛔ **Dark in both themes** — `icon.png` is a SQUARE with no alpha, so on a light field the square shows and reads as a bug. ⚠️ Residual for 🎯: a light-mode user gets dark splash → light UI. **The rendered result is a device row** — `expo prebuild` cannot run on Windows |
| ✅ | **R4 CLOSED 2026-08-21** *(ship-blocker, inserted ahead of P6.7)* — the demo's writes are refused **by construction**, not reported after the fact. 15 sites converted · 4 background writers declared · `lint:sandbox` added. Detail → log |
| ✅ | **P6.7 CLOSED 2026-08-21** — tag trigger retired · the Pages deploy gained a `guard` job (`release/v1` only, **and** [D44]'s green-`web-e2e`-for-this-SHA assertion, which was recorded ✅ and had never been built) · **[D49]** `gate-status.json` + `lint:gate-freshness`, mutation-verified. Detail → log |
| **P6.8** | ▶ **BUILDING NOW — [AUDIT GATE] Pre-Release Best-in-Class FINISH sweep** *(decomposed above)* | ⛔ **"Absorbs T12, ~40 polish items" is STALE — corrected 2026-08-21.** P6.4 judged all 62 of those ids and deferred exactly **three**: **L1-20** *(eyebrow treatment — a visual-system call)* · **L1-22** *(73 apostrophes, gated meanwhile)* · **L4-13b** *(`PressableScale` app-wide or nowhere)*. ⚡ **So this is ~90% a FRESH audit, not a ledger sweep** — and the unaudited surface is larger than the row implied: **everything shipped since 2026-08-17 has never been through an audit gate** (the Phase-5 cutover · P6.3 cloud backup · P6.6 splash · R4's veto · P6.7's CI). Every screen · sheet · card · state · both themes · iPhone/iPad/Split-View · Dynamic Type. ⭐ **Charter includes STRUCTURAL GAPS** — *"is anything missing"*, not only *"is anything wrong"*; this is where 5.10's original fan-out intent now lives. ⛔ **Anything structural is a SCOPE CALL for 🎯**, never an automatic fix, or the sweep expands the freeze it exists to protect. Best single item: **L5-12**, the paywall never mentions the user's own money |
| **R5** | 🔴 **The expense reserve belongs IN the plan** *(2.0 feature — **[D54]**, after P6.8, ahead of P6.9)* | ✅ **SHAPE SETTLED 🎯 2026-08-21:** a **recommended-action row that can be declined**; declined → the next recommendation grows by the balance; accepted → the hero bar shows it reserved. ⭐ **Every display consequence is already free** — the plan bar, the next recommendation **and the Money Expenses hero** *(🎯 2026-08-21; `expenseReserve.test.ts:62` already pins it)* all move off one number, `expenseReserveHeld`. R5 changes the **default and the presentation**, not the waterfall. 🔴 **Build:** default the contribution · the action row *(new surface → must clear **P6.10**)* · the decline control. ⛔ **Through the EXISTING setter** — a second writer is how those three free behaviours stop being free, and it would diverge on the clamp or the cycle key while still looking right. ⚠️ **Two residuals open** *(per-cycle vs permanent decline · whether the transition cycle is stated out loud)* — recommendations in the log. Decomposed at switch-in |
| **P6.9** | ⭐ **[AUDIT GATE] Privacy / data-flow audit** | Trace EVERY egress and prove *"financial data never leaves your device"* is literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs. ✅ **Unblocked — it consumes [D40] + [D41]**, both settled 2026-08-20, so its job is to prove the new claim *literally true* rather than to discover one. ⛔ **The claim it verifies:** *"Your data never goes to our servers. Optional iCloud backup keeps it in your own Apple account."* Also owns retiring the marketing *"100% private"* line and the ASC privacy label declaring RevenueCat. 🔴 **P6.3 hands it a live counterexample: `PRIVACY_CLAIM.body` still says *"your financial data stays on this device"*, which the iCloud toggle makes false. P6.3 must not SHIP without [D41]'s rewrite landing here** |
| **P6.10** | ⭐ **[AUDIT GATE] Pre-submit functional + FINANCIAL-correctness money lens** · 🔒 **FEATURE LOCK CLOSES HERE ([D52])** | ⛔ **Last gate that can FIND a structural gap** — P6.8's *"is anything missing"* and P6.9's egress trace both land before it, so their scope calls still have somewhere to go. Past this line a gap defaults to **2.1**. Boundary inputs across the engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios. ⛔ **Owns two carried defects:** `bulkMarkRequired.ts` writes pre-[D2] paid semantics — inert today, but a false assertion in **data Phase 5 migrates** · `appliedTopUp` is a manual-opt-in invariant every cushion reader must remember (three readers exist; two had it) |
| **P6.11** | **Repo consolidation** *(= "6.5", was 5.5)* — **delete the legacy tree** | ⛔ **Last possible moment, by design** (🎯: *"I do not want to take any chances at all of us deleting something from legacy that is still needed but missed"*). ⚠️ **Must be FINISHED before the final build.** Decomposed below |
| **P6.12** | **`validate:release:rn` GREEN after the deletion** | ⛔ The guard the move created. Removing an entire surface is exactly the change that breaks the remaining one, and P6.11 now lands after everything else — nothing else would catch it |
| **P6.13** | **CM build cut** | ⛔ **`QA_TOOLS` STAYS ON.** The device pass rides `qaEnabled()` instruments — `legacy-bridge-probe` is literally how the migration was verified. Flipping it *"to be safe"* here **deletes the instruments the pass needs** |
| **P6.14** | **FINAL DEVICE PASS** — on the post-deletion binary, the configuration that actually ships | 🔒 Human-ticked, non-gating. **52 rows + the 60 coverable-not-built + 3.5's folded-in pass** ([D35]) **+ [T3.2]'s storage-fault row** *(two T3 surfaces ship on unit assertions with no rendered proof)* **+ the three rows Phase 5 owes + A0.4 · A8.4 + the two sub-audits**. Reference block below; the runnable truth is [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md) |
| **P6.15** | **Defect fix** | Whatever P6.14 turns up |
| **P6.16** | ⭐ **[AUDIT GATE] The final audit** *(🎯: "final final final")* | ⚡ **Because fixes are changes, and changes are unaudited.** The loop closing, not a formality — every straight-line plan ships the last round of fixes unexamined, and those are the ones written closest to submission |
| **P6.17** | **Fixes + flip `QA_TOOLS` to false** | 🔒 Deliberately **last and smallest**: `git grep QA_TOOLS` must show the instruments gone **and** nothing depending on them. Takes its own `validate:release:rn` |
| **P6.18** | ⚠️ **TARGETED device re-check** · 🔒 **CODE FREEZE CLOSES HERE ([D52])** | ⛔ **The last step that can PRODUCE a change**, which is why the freeze sits behind it rather than behind P6.17 — P6.19's final build then comes off a frozen tree. **Only the rows touching what P6.15 and P6.17 changed** — not a second 52-row pass. ⛔ **The device loop has to close too:** fixes born on a device are the likeliest to need one, and anything native (share sheet · picker · Live Activity · widgets · notifications · the bridge) has **no off-device proof at all**. Collapses to nothing if the fixes were pure logic or copy |
| **P6.19** | **FINAL BUILD** | |
| **P6.20** | ⭐ **Capture screenshots + the App Preview FROM that build** | 🎯: *"we will not have anything to grab screenshots OR the app preview from until the final build is pushed."* ⚡ A frozen UI is not a **binary** — the assets come after the build, not before it. ONE 886×1920 file, 15–30 s, off the proven capture pipeline. ⛔ A visual problem found here costs another build; that risk is real and unavoidable, so **look hard at P6.18** |
| **P6.21** | **ASC submission** | Listing · release notes *(lead with the rewrite — a 2.0 with 1.7-shaped notes re-creates the expectation problem)* · privacy label declaring RevenueCat · **availability = US · CA · AU · NZ** *(🎯 2026-08-20 — **Canada added**: en-CA is `$`, period-decimal and English, so it is a checkbox with no code behind it)*. ⛔ **`£`/`€` storefronts are OUT of 2.0** — see the Deferred backlog for what they cost · ⚠️ **App Review paywall-findability** — v1.1 was rejected repeatedly, so the notes MUST say *"Tap ••• More → Unlock Premium"* · the assets from P6.20 · the launch-FLIP value gate |

**Exit:** `2.0.0` submitted to App Review off a build that passed P6.18, with `validate:release:rn` green on
the shipping configuration and `QA_TOOLS` off.

### ✅ P6.3 — cloud backup *(= "6.C") — CLOSED 2026-08-21*

✅ **[D40] · [D41] settled · P6.3.3.1–.7 built 2026-08-20 · P6.3.3.8 VERIFIED ON HARDWARE by 🎯** — iCloud
rows 2–6, including **the clobber guard** (decline the restore, onboard fresh, background, remote still
holds the OLD backup), which was the cutover's approval condition. **Cloud backup ships, and the app is no
longer frozen on it.** Detail → log.

⚠️ **This row sat in "Remaining" after the pass had already run** — the `waiting-lists-decay-one-way`
shape: closing the thing updates the decision and nobody deletes the row that was waiting on it. Corrected
2026-08-21 when 🎯 said so out loud.

### ✅ R4 — THE DEMO WROTE TO THE REAL STORE *(SHIP-BLOCKER — CLOSED 2026-08-21)*

✅ **A demo cannot write the user's plan BY CONSTRUCTION.** `createDebtStore` now takes a **veto**
(`opts.refuse`, on the same `set` seam as `opts.bound`) that DROPS a forbidden write before it lands — the
old guard fired from a `subscribe`, i.e. after. **15 sites converted across 6 files**; 4 legitimate
background writers newly **declared** (`allowRealStoreWrite`), because refusal turns an undeclared one
from a false alarm into a dropped write. Two mutating e2e + 20 asserts + **`lint:sandbox`**, a 23-file
allow-list for importing the singleton. `validate:release:rn` green — **212 e2e · 10 embed**.

⛔ **Three results worth carrying, all measured:** the site table was **4 of 6** *(`LivingExpenseSheet` ·
`LogPaymentSheet` missed — sixth consecutive item short)* · sandbox ids **do not** collide, so the damage
was `stampInputsFresh` rather than values — and a version of the e2e checking ids and amounts **passed
with the defect planted back** · the first plant **lied** (a dangling `store_` crashed the component, so
both tests went red for the wrong reason). ⭐ With the veto in and `ExpenseSheet` still leaking, both
tests PASS — the defence in depth is demonstrated, not claimed. Detail → log.

### ✅ P6.7 — CI / Pages ops *(CLOSED 2026-08-21)*

✅ **All six built; `validate:release:rn` exit 0 — 212 e2e · 10 embed — and the gate wrote its own record
as its final link.** Tag trigger retired · `embed-pages.yml` gained a `guard` job that `build` needs
(ref must be `release/v1`; the SHA must have a green `web-e2e`) · `gate-status.json` + `lint:gate-freshness`,
mutation-verified four ways (source edit → red · **doc edit → stays green**, which is [D49]'s own wording ·
file added → red · file deleted → red).

⛔ **The headline is the switch-in audit, not the build: 2 of 5 premises were wrong and a third item the
queue rendered ✅ had never been written.** [D44] was *decided*, not built. There was no deploy allow-list
to flip. And three things only the building surfaced — `lint:gate-freshness` **cannot** live in `lint:rn`
(it would deadlock the gate that refreshes it), I **forged a green** while testing the writer (now gated
on a `--from-gate` flag only the gate passes), and the first [D44] check fell **open** without `jq`.
Detail → log.

### ▶ P6.8 — [AUDIT GATE] Pre-release best-in-class FINISH sweep *(the ACTIVE decomposition — 2026-08-21)*

⭐ **Recommended pick, and it is simply next in 🎯's settled order** — P6.3/P6.4/P6.6/P6.7 and R4 are
closed, nothing is blocked on a device, and P6.8 is the widest net still upstream of **feature lock
(P6.10)**, so anything structural it finds still has somewhere to go.

⚠️ **Its charter is TWO questions, and the second is the one that gets dropped:** *is anything wrong*, and
*is anything missing*. ⛔ **Anything structural is a SCOPE CALL for 🎯**, never an automatic fix, or the
sweep expands the freeze it exists to protect.

| # | Sub-step |
|---|---|
| **P6.8.1** | 🔴 **BUILD THE VISUAL MATRIX FIRST (🎯 2026-08-21)** — extend `playwright.shots.config.ts` to sweep every surface × light/dark × iPhone/iPad/Split-View × default/XXL Dynamic Type, plus the untested states *(empty · 1 · 40 · huge numbers · long names · offline · error)*. ⛔ **Before any agent runs.** The 2026-08-17 gate's own #1 finding was that its instruments under-reported, and four visual lenses read this matrix — **a surface missing from it is a surface four agents are blind to at once** |
| **P6.8.2** | **Verify `audit:surfaces` against the tree** *(15 surfaces today)* — six consecutive items have had short site lists; the matrix is only as good as this enumeration |
| **P6.8.3** | ⭐ **THE FAN-OUT — 13 lenses, wave 1** *(🎯 approved the scale + roster 2026-08-21)*. **Visual, on the matrix:** V1 theme parity · V2 size class · V3 Dynamic Type XXL · V4 state coverage. **Wrong:** W1 the **unaudited delta** *(everything since 2026-08-17 — Phase-5 cutover · P6.3 · P6.6 · R4 · P6.7)* · W2 the three carried items *(L1-20 · L1-22 · L4-13b)*. **Missing, each with an external reference:** M1 public claims vs product · M2 journey completion · M3 recovery + dead ends · M4 expectation gap *(outside-in)*. **Plus:** **A1** VoiceOver depth *(order · announcement · focus-after-dismiss — beyond the 3 mechanical gates)* · **O1** onboarding + first-run · **P1** the **premium bar**, judged against the bench/motion/IA docs **and** the spec's price test *("removing it must remove WORK, not just info")*. ⛔ **No sub-agents · incremental slice writes to `docs/audits/2026-08-21-p6.8-finish/slices/`** |
| **P6.8.4** | ⭐ **WAVE 2 — ~6 REFUTERS, mandatory.** One per blocker/major cluster, each prompted to REFUTE and to default to refuted when uncertain. ⛔ **2 of 3 agent-declared blockers did not survive last time**, and 2 of 4 stated *mechanisms* were wrong while all 4 recommendations were sound. **No finding becomes work un-refuted** |
| **P6.8.5** | ⭐ **THE SYNTHESIS IS A FILE (🎯 2026-08-21)** — `SYNTHESIS.md` in the audit folder, not a chat message, and it is the decision document. ⛔ **Every agent writes its own slice file too**; nothing about this audit exists only in a transcript. Same rule the 2026-08-17 gate followed, made explicit because it is the thing that makes the audit re-readable after the session ends |
| **P6.8.6** | ⭐ **[DECISION] The structural-gap list → 🎯** — *"is anything missing"*, as scope calls with a recommendation each. Best candidate on the record: **L5-12, the paywall never mentions the user's own money** |
| ✅ | **P6.8.1–.6 DONE 2026-08-21** — 13 lenses · 6 refuters · 226 frames · 9 a11y trees. `SYNTHESIS.md` is the decision document. ⛔ **33 of 34 observations survived; 11 of 34 mechanisms were wrong**, and twice the lens's own fix would not have closed its defect |
| **P6.8.7** | 🔴 **BUILD EVERYTHING EXCEPT THE REFUTED (🎯 2026-08-21)** — A + B + C, decomposed **P6.8.7a–g** below. ▶ **NEXT SESSION STARTS AT `P6.8.7d.1`** *(7a, 7b and **the whole of 7c** are CLOSED; d is decomposed below and d.1 is B3, the iCloud clobber)*. ⚠️ **🎯 overruled my 2.1 recommendation on C7 and C8**; both are new surfaces, so P6.8 is now a BUILD phase and must still clear **P6.10** feature lock. ⛔ **The earliest deadline in the whole audit is C8's parser rescue — `core/imports/debtCsv.ts`'s only caller dies at P6.11** |
| **P6.8.8** | **`validate:release:rn` green** *(it records itself — do not type the result)* |
| **P6.8.9** | 🔴 **[AUDIT GATE] THE VERIFICATION PASS (🎯 2026-08-21)** — re-audit the RESULTS: *(a)* every fix actually fixed its finding, and *(b)* **no other major+ issue remains**. ⛔ **Fixes are changes, and changes are unaudited** — this is P6.16's logic applied one gate earlier, and it exists because *this* audit measured that a fix aimed at a wrong mechanism looks identical to one that worked |

### ▶ P6.8.7 — the build, in dependency order

⛔ **Sequenced so the GUARDS land first.** Every later fix is then protected from regressing while the
rest of the work happens — the [D31] move, applied to a 30-item build rather than a single finding.

| # | cluster | contents |
|---|---|---|
| **P6.8.7a** | ⭐ **GATES FIRST** | ✅ **DONE 2026-08-21 — all six, every one mutation-verified.** (i) `aria-allowed-attr` + `a11ySelected` retired, 6 sites re-roled to `a11yChecked` · **W1-10** native-prop guard **4 → 7**, exemptions now per-**prop** not per-file · **W1-1** `lint:apostrophes` decodes JSX entities, baseline **72 → 94** *(the 22 were invisible, so 7b's sweep would have normalised 72 and shipped these)* · **W1-4 + W1-12** the fingerprint is now an **exclusion** list — **582 → 628 files**, `.github/workflows` · `.github/actions` · `.maestro` in, the `docs/` residue **stated rather than closed** · **W1-3** `web-e2e.yml` gained `test:stamp`, `test:e2e:embed` and the core typecheck. Detail → log |
| **[P6.8.7a-1]** | ✅ **DONE 2026-08-21 — the guards now have a compiler** *(🎯 approved)* | `scripts/tsconfig.json` + `typecheck:scripts`, chained into `typecheck` so it rides the gate's existing first link and `web-e2e.yml`'s step with it. 3 errors fixed, **both shapes type-only, neither in gate logic** — a hoisted `function` was the one rung of the lane parser a null-check could not reach. Planted type error reds the chain by name. ⛔ **Third time this hole has been found** — `apps/rn`, then `packages/core` *("the LEAST type-checked code in the repo")*, now `scripts/` |
| ✅ | **Junk file removed 2026-08-21** — `apps/rn/m.default())`: 0 bytes, tracked, unreferenced, born in `ab7daf3`. ⚠️ **P6.1's sweep of this class was short by one.** It is now the only one, verified by walking **every tracked file for zero length** rather than by grepping names |
| **P6.8.7b** | ✅ **COPY — DONE 2026-08-21** | **A4/M1-9** the first screen no longer promises a premium feature · **C6** `PRIVACY_CLAIM.atEntry` on both money-asking steps · **M1-8** the inert analytics row gone, **coupled both ways** so it cannot stay gone if a sink appears · **L1-22** baseline **94 → 0**, the gate is now absolute · **P1-10** the windfall invite's false implication · **A1/A2/A3** drafted. ⛔ **Four premises were wrong**, incl. C6's pre-written wording being **unsafe** *(it denies the iCloud backup P6.3 shipped)* and one error of mine. Detail → log |
| **P6.8.7c** | ✅ **DATA INTEGRITY — CLOSED 2026-08-22** | **B1** *(14 sites/7 files, one shared money parser)* · **B4** *(the reset screen + `pendingDataRepairs`)* · **W1-6** *(a refused database is no longer "a fresh install", and an inconclusive bridge no longer seeds)* · **M3-20** *(losses reported through B4's card)*. **220 e2e · 10 embed · lint exit 0.** ⛔ **Three results outlive the cluster:** an absence assertion passes before the app renders *(two specs stayed green with the defect planted)* · `lint:rn` green ≠ purity-clean · **M3-20 was scheduled as work and never refuted.** Detail → log |
| **P6.8.7d** | ✅ **CLOUD / DESTRUCTIVE — CLOSED 2026-08-22** | **B3** *(the app now reasons about the REMOTE — `cloudBackupRemoteAt` + a guarded backup)* · **C9** *(`provider.delete()`, `clearQuarantine` finally called, and a failed remote delete blocks the local wipe)* · **M3-5** *(the diagnosis reaches the screen)*. **222 e2e · 10 embed · lint exit 0 · 9 plants red by name.** ⛔ **Three results outlive it:** M3-5 was scheduled as work and **appears in no refutation at all** *(the second instance — check the ids the BUILD schedules, not the slice's owed-list)* · the repo had already tagged the bare-`router.back()` defect `[C9]` **twice** while the destructive screen still had it · **"Delete all data" had zero e2e and no lens reported it.** Detail → log |
| **P6.8.7e** | ✅ **THE CORE LOOP — CLOSED 2026-08-23** | **B2** *(the celebration fires from the payoff, not from the premium estimator noticing one)* · **C1** *(the absorb path has an entry point)* · **C2** *(a way back into payday capture)* · **C5** *(both halves — the missing prompt AND the false "caught up")*. **C4 verified + filed as a device row; C3 → 2.1.** **234 e2e · 10 embed · lint exit 0.** ⛔ **C5's stated harm was false — the fourth mechanism wrong in two clusters.** Detail → log |
| **P6.8.7f** ▶ | 🔴 **VISUAL + A11Y — BUILDING NOW** *(decomposed below)* | **B6/V1-2** light contrast *(15 of 24 distinct pairs)* · **V1-5** borders *(⚠️ all four boundaries fail 1.4.11 — dark too)* · **V2-6** the coach mark covering its subject · **V2-1** the truncating debt-free date · **V3-1** six missing font clamps · **V3-5/6** the chart's hardcoded per-character width · **V4-8** split-view chart · **A1-2** Guardian vocabulary *(1 line)* · **A1-7/8/9/10/11** — ⚠️ **A1-7's obvious fix is documented-as-broken; A1-11 is 6 sites not 1** |
| **P6.8.7g** | **NEW SURFACES** *(🎯's call, against my rec)* | **C8** ⚠️ **RESCUE `core/imports/debtCsv.ts` FIRST — its only caller dies at P6.11, the earliest deadline in this audit** — then wire the import · **C7** snowball-vs-avalanche side by side *(both simulations already run; `TrajectoryChart.tsx:133` discards one)* |

#### ▶ P6.8.7f — VISUAL + A11Y *(the ACTIVE decomposition — 2026-08-23)*

⛔ **Sequenced shared-primitive first**, the same move c/d/e used: the colour tokens and the type clamps are
touched by every screen below them, so fixing a surface before its primitive means fixing it twice.

⚠️ **Two switch-in obligations, both earned in d and e:**
1. **Check each id against the REFUTATIONS, not its slice's owed-list.** M3-20 and M3-5 were both scheduled
   as work un-refuted and only opening the step caught it. Assume the next one is un-refuted until seen.
2. ⛔ **Re-read the finding's stated MECHANISM against the code before building it.** Four of the last
   seven — B3 · B2 · M3-5 · C5 — had a sound observation and a wrong explanation, and in three of them the
   proposed fix would not have closed the defect. **The site count is also a floor, never the class.**

| # | step | notes |
|---|---|---|
| ✅ **f.1** | **CONTRAST — DONE 2026-08-23** | **B6/V1-2** the light ramp is re-solved against `background.tertiary`, the darkest ground the app paints text on · **V1-5** a new `border.control` token clears SC 1.4.11 in **both** themes, on 23 sites. ⭐ **`lint:contrast` is the instrument** — the grid, the exemptions (machine-verified), the hero panel and token-value copies — 4 plants red by name. ⛔ **Four defects only the building found**, incl. an unchecked checkbox at 1.43:1 and a file that had copied the token hexes. Detail → log |
| ✅ **f.2** | **DYNAMIC TYPE — DONE 2026-08-23** | **V3-1** all six clamped and the false `PlanHero` comment deleted · **V3-5/6** the pill width now scales by the user's **real** `fontScale`, and the labels carry one shared ceiling. ⭐ **`lint:type-scale` is the class** — the refuter's own prescription, and it found 5 sites the audit missed, **none of which should be fixed** *(28pt headings; clamping prose overrules Dynamic Type)*. ⛔ **P1-3 is NOT closed by this** — see the decision below. Detail → log |
| ✅ **f.3** | **LAYOUT + STATE — DONE 2026-08-23** | **V2-1** both hero variants share one fitting rule *(the second was never filed)* · **V2-6** the hardcoded `132` replaced by the **measured** callout height, **and pinned by an e2e that fails at 581 > 569** · **V4-8** `useSkiaReady` gates every RN label on the canvas it belongs to. ⛔ **The first version of the V2-6 test PASSED with the defect planted** — it asserted against a heading inside the subject rather than the subject. Detail → log |
| ✅ **f.4** | **VOICEOVER — DONE 2026-08-23** | **A1-2** the cushion bars speak the glossary, and the inverted core comment that produced it is rewritten · **A1-7** the swipe pane is fenced **permanently**, which sidesteps the documented-as-broken fix · **A1-8** `badges` is DATA now, so the spoken name cannot drop it · **A1-9 + A1-10** `useLiveAnnouncement` — the only primitive that speaks on both platforms. **A1-11 was already closed at 7a.** 4 plants red, each isolated. Detail → log |
| **f.5** | **Suites green** | The full gate, backgrounded with the real exit code captured — see the e.6 note on false failures |

**Exit (f):** every f-id carries a plant-verified fix or a recorded reason, contrast is checked against the
**measured pairs** rather than by eye, and anything only provable on hardware is a filed P6.14 row.

#### ✅ P6.8.7e — THE CORE LOOP *(CLOSED 2026-08-23)*

✅ **All six steps done, every fix plant-verified red AND green.** B2 · C1 · C2 · C5 built, C4 verified and
filed as a device row, C3 deferred to 2.1 on SYNTHESIS's own terms. **234 e2e · 10 embed · `lint:rn` exit
0.** ⛔ **Two results outlive the cluster:** **C5's stated harm was false** *(the debt-first user never sees
the "caught up" line — `minimum_debt` is a required row)*, making it the **fourth** finding in two clusters
whose observation held and whose explanation did not; and **the full e2e suite died mid-run twice**,
reporting 203 and 64 false failures that all passed in isolation. Detail → log.

#### ✅ P6.8.7d — CLOUD / DESTRUCTIVE *(CLOSED 2026-08-22)*

✅ **All four steps done, every fix plant-verified red AND green.** B3 · C9 · M3-5, plus three defects that
only surfaced while building *(a bare `router.back()` that made "Delete everything" **silently do nothing**
on cold entry; a platform check without which delete would have been blocked outright on web/Android; a
"newer version, update the app" message shown for a **damaged** file)*. **222 e2e · 10 embed · `lint:rn`
exit 0 · 9 plants.** ⛔ **Three results are on the cluster row above and in the backlog.** Detail → log.

#### ✅ P6.8.7c — DATA INTEGRITY *(CLOSED 2026-08-22)*

✅ **All five steps done, every fix plant-verified red AND green.** B1 · B4 · W1-6 · M3-20, plus two
defects that only surfaced while converting sites *(a `parseFloat` money field that logged **$1** for
`"1,200"`; a cleared payday balance confirming a debt at **$0**)*. **220 e2e · 10 embed · `lint:rn` exit
0.** ⛔ **The exit condition was met on every id, and the three results worth carrying are on the plan row
above and in the backlog.** Detail → log.

⛔ **Filed by 7b's after-scan, NOT absorbed:**

| id | finding | disposition |
|---|---|---|
| **P1-10 (tier)** | Windfall Autopilot has **no tier gate on any of four paths** — free does the WORK, premium reports it, which is the premium spec's price test upside down | 🔴 **[DECISION] open for 🎯.** The **copy** half shipped at b.5; the tier change is a monetisation call inside a freeze-converging phase and **must clear P6.10** if taken |
| **A2-5** | ⚠️ **The Marketing URL index page (`jsnyde03.github.io/debt-planner-site/`) was audited by NO lens.** It is ASC-registered and almost certainly repeats the same premium block the listing and both other pages carry | **P6.21**, with A1/A2. Recorded in [`DEBT_SITE_COPY_2.0.md`](DEBT_SITE_COPY_2.0.md) |

**Exit:** every non-refuted finding carries a fix or a recorded reason, `validate:release:rn` green, and
**P6.8.9 confirms it independently** rather than on my word.

**Exit:** every surface has been looked at in both themes and both size classes, all ~40 polish findings
carry a verdict traceable to an id, and the structural-gap list has been **answered by 🎯** rather than
silently absorbed or silently dropped.

### ✅ P6.4 — the 62 filed findings *(CLOSED 2026-08-20)*

✅ **All 62 carry a verdict traceable to its id, [D42] satisfied.** ⛔ **29 of 62 were NOT WORK (47%)** —
25 at triage, and 4 more dissolved on contact *(L1-20 premise inverted · L1-22 → P6.8 + a gate · L1-23
refuted · L1-30 moot)*. **`validate:release:rn` exit 0 — 210 e2e · 10 embed.** ⚡ **The result that
outranks the count: the audit gate had already fixed or refuted 18 of these, none of it traceable to the
low-tier id**, because [D37] gates blocker+major only — so two of five planned clusters were empty. Full
ledger, the 9 corrected verdicts, the half-closed class and three false inherited premises → **log**.

⏭ **Carried out of P6.4:** L1-20 · L1-22 · L4-13's second half → **P6.8** · L2-14 · L2-22 · L5-15 →
**2.1** · four dead-code ids → **P6.11** *(delete the modules WITH the tree)* · 🔴 **L5-19's trial call is
🎯's, wanted before P6.10.**


### ▶ P6.11 — repo consolidation *(= "6.5")*

⚠️ **Verify scope against the CURRENT tree at switch-in** — pre-authored cleanup drifts.

🔴 **P6.4.6 HANDED THIS STEP AN OBLIGATION (2026-08-20).** Four dead-code findings resolve to *"delete the
consumer, then re-check"*: **L4-11** `formatDisplayAmount` *(3 live sites in `components/ResultsSection.tsx`)*
· **L6-4/5** `projectForecast` *(`components/SnowballSection.tsx:290`)* · **L3-5** `buildSmartInsights`
*(`components/SnowballSection.tsx:245`)*. ⛔ **After the root tree goes, all four are genuinely dead and
must be deleted with it** — otherwise P6.11 leaves four unreachable modules that every later sweep re-reads.
⚠️ **L3-5 additionally carries a latent defect** (a capped promise, "Hold back $X to restore a safer $200
cushion"), so it must be **deleted, not revived**.
⭐ **What deleting last buys beyond the safety:** T10's dead-code verdicts must be re-checked against the
ROOT tree (`formatDisplayAmount` was called dead and has **three live legacy call sites**), and that tree
now survives long enough to check against; every Phase 6 audit also runs while the old surface is still
readable, so *"what did v1.6 do here"* stays answerable.

| # | Sub-step |
|---|---|
| **P6.11.1** | Remove the root Capacitor/Next surface. Also retires `validate:release:legacy`, the root Next lint, the legacy `debtPlanner.isDemoMode` test references, `tests/visual/*.cjs`, the gate's assertions on the **retired demo-mode contract**, and one of the **two screenshot mechanisms** |
| ✅ | **P6.11.2 SETTLED 2026-08-20 — the monorepo stays** ([D45]). `packages/core` is shared portfolio-wide, and a root promotion is churn with regression risk for nothing a user sees |
| **P6.11.3** | Tooling / CI / docs to the consolidated tree. Includes **splitting `DEBT_ELEVATION_LOG.md`** (~15k lines, well past one-pass readability) |
| ✅ | **P6.11.4 done early** — `apps/rn` has its own `eslint-config-expo` |

### ⚠️ Why this is an ORDER and not a list

⚡ **P6.8 → P6.15 → P6.16 is a convergence LOOP**, and it is 🎯's addition rather than mine: a device pass
produces fixes, fixes are unaudited changes, so the audit runs *again* after them. ⛔ **Getting P6.8 early**
buys a second sweep and re-decides everything it touched; ⛔ **getting P6.9 early** turns a settled decision
into a discovery mid-audit. ⚠️ **Residual, named rather than hidden:** the binary that ships is not
byte-identical to the one device-passed, because the `QA_TOOLS` flip comes after. That is unavoidable — the
pass needs the instruments and the ship must not have them — which is why the flip is last, minimal and
separately gated. Full reasoning → log, *"THE ORDER TO SUBMISSION"*.

⛔ **The QA-door conflict is resolved by ORDERING, not by rework** ✅ **[D46], 2026-08-20** — and it was
always latent: the standing constraint says *"never let a coverage row ride a QA door"*, and the
`legacy-bridge-probe` row does exactly that. **P6.13 → P6.14 → P6.17 stands, and the probe rows do NOT get
a non-QA path** — that would ship a debug readout to real users, which is worse than a known,
last-and-smallest flip carrying its own green gate.

---

## ⏸ Waiting on Jason

🔴 **[DECISION] THE CLOSURE GATE CANNOT SEE THE P1 LENS, AND FIVE OF ITS MAJORS REACHED NO LEDGER —
surfaced by f.2's before-scan, 2026-08-23.**

⛔ **The instrument first.** `check-audit-closure.ts` matches `^-?\s*\*\*Severity:\*\*` — **anchored at line
start** — and `P1-premium-bar.md` writes `**Part:** A-craft · **Severity:** major` **mid-line**. So the
whole P1 slice is invisible to it: the gate's `80 high+ findings` is short by P1's **seven majors**, and
**P6.8.9's mechanical exit criterion would have read zero with P1 never examined.** ⚡ This is the audit's
own #1 finding — *the instrument under-reports* — landing on the gate built to prevent it.

⛔ **Then the findings.** `P1-1 · P1-2 · P1-3 · P1-4 · P1-5` are filed **major** and appear nowhere in
`SYNTHESIS.md` — not in the major list, not in A/B/C, not among the refuted. R6 attacked only P1-9/10/12,
so these were never judged either way: **missing, not declined.** *(Third instance of the shape in three
clusters — d and e each shipped an id no refutation covered; this is its mirror.)*

⭐ **Recommendation: fix the regex now, take P1-3 into 2.0, and route the rest through P6.8.9's re-run.**
P1-3 is the one f.2 just built around — the Payoff Trajectory renders **nine empty years, a stranded date
pill and a legend describing two lines that are not on screen** on the default seed, across three viewports
— and R6 warned that fixing V3-5's font arithmetic **without** it credits the cheap fix with the wrong
outcome. ⚠️ **Whatever the widened gate then names is P6.8.9's list, not f's.**

▶ **The actionable list is [`DEBT_2.0_YOUR_STEPS.md`](DEBT_2.0_YOUR_STEPS.md)** — every step needing a
human, an Apple login, a device or a decision, in the order it is worth doing. This section stays as the
**reasoning**; that file is the **checklist**. ⚠️ It also carries a *"already done, do not do twice"*
section, because three rows this session still claimed to be waiting on 🎯 after he had answered.

✅ **[D53] 2026-08-21 — 2.0 ships with NO free trial.** 🎯: *"I already have a demo and try-before-you-buy
in the app."* ⭐ **And that retired MY argument, not his:** I had recommended a trial on an error-asymmetry
claim — *"ship without and the people who bounced are gone"* — which is **false**. Eligibility is consumed
only by TAKING the offer, so every decliner stays eligible indefinitely and **2.1 can add a trial and reach
exactly the cohort that bounced.** Nothing is forfeited. ⚡ What is gained: a **clean conversion signal**
against a simple paywall from day one *(a 30-day trial reveals no revenue for a month and cannot separate
"the paywall works" from "the trial works")*, and four items + a device row leave the pre-lock window.
⏭ **The trial is the LEVER for 2.1** if conversion disappoints — by then you know whether it is the paywall
or the price. ⚠️ **If it is ever taken, 30 days is the floor, annual only:** premium's value fires on
PAYDAY, and `PayCycle` includes `monthly` — a 7-day trial shows a monthly-paid user **zero** paydays of the
thing they are buying. Annual-only because Apple grants the offer **once per Apple Account per subscription
GROUP**, so a trial burned on monthly is gone for the plan you want them on.

✅ **Otherwise nothing is blocked on a DECISION** — the Phase 6 queue cleared 2026-08-20, **[D40]–[D48]** plus [D3].

✅ **The Apple portal for iCloud is DONE (🎯, 2026-08-20)** — signing is unblocked.

✅ **Sentry is wired too (🎯, 2026-08-20)** — DSN in the Codemagic `AppleConnect` group, project
`debt-planner` / `4511944380907520`, org `jason-snyder`, auth token already held from another app.

✅ **THE [D48] BUILD RAN AND ITS PASS IS DONE (🎯).** iCloud rows 2–6 green including the clobber guard →
**P6.3 CLOSED**; splash row 1 passed on the badge version. ⛔ **NOTHING IS BLOCKED ON A DEVICE** — 🎯,
2026-08-21. P6.7 and everything after it proceed on the desk.

⏭ **What the NEXT device build still owes — later, not blocking:** **[D51]**'s light/dark splash *(it
supersedes the badge version row 1 passed, so splash re-runs)* · **Sentry capture** *(untestable last time —
there is **no user-triggerable `reportError` path**, so a missing event would have read as "Sentry is
broken"; the QA test-event button rides this build)* · **R3's demo exit**, now twice-fixed *(P6.4 found the
label fix had left it `caption`-sized)* · and rows **1 and 7** of
[`DEBT_DEVICE_PASS_2026-08-20.md`](DEBT_DEVICE_PASS_2026-08-20.md). Fixes → **P6.15**.

⚠️ **Nothing about the splash, Sentry capture or R3 is proven off-device** — the web suite exercises the
*unavailable* branch by construction. **Cloud backup is the one that is now genuinely proven.**
⛔ **Source-map upload stays OFF for this one** ([`DEBT_SENTRY_SETUP.md`](DEBT_SENTRY_SETUP.md)): the upload
phase hard-fails the ARCHIVE, and worst-case-off is minified frames while worst-case-on is losing all three
verifications and another ~45-min cycle. ⏸ Owed only when it is switched on: the **org slug**.

**Owed off-device (yours, not decisions):** the ASC privacy label declaring RevenueCat *(→ P6.9)* · AU/NZ
availability · the App Review note naming the paywall path · the launch-FLIP value gate *(→ P6.21)*.

## 🎯 Reported from the app — found by USING it, not by the lane

⚡ **R3 and R4 were both found in the DEMO, and R4 was found by SENTRY rather than by looking.** The
instrument that caught it is the one 🎯 thought was merely "working" — a crash report from TestFlight,
which is the first time telemetry has out-performed both the suite and the lane on this project.

⚠️ **`R#` means two different things in this file.** In THIS table it is a 🎯 report from using the app.
In the P6.8 rows it is one of the audit's six **refuters** (`audits/2026-08-21-p6.8-finish/refutations/`).
The series overlap and neither is renamed; read the section, not the number.

| | Report | State |
|---|---|---|
| **R5** | 🔴 **2026-08-21 — the expense reserve is advice the plan then ignores.** $349 recommended to hold out on 🎯's live seed; it appears **nowhere on Today**, and the plan routes the whole paycheck to the snowball/avalanche focus | ✅ **SCHEDULED — [D54]: a 2.0 feature.** Own Phase-6 row after P6.8, must clear P6.10. **Not started; decomposed at switch-in.** ⛔ **My first filing was wrong and 🎯's model of the feature was right:** the action, the hold and the projection effect **all exist and work** — apply the offer and the Skia trajectory genuinely moves. **Wrong is the PLACEMENT and the DEFAULT.** The action sits in the *"Spoken for"* sheet behind the **Today** hero legend, two taps from the recommendation it changes; untapped, the contribution is `0` and Plan shows no trace of the reserve. ⚡ **Third hidden door 🎯 has found by USING the app** — R2, R3, now this. Fix = default the contribution + surface it on Plan *(the second half is a NEW surface → must clear **P6.10**)*. Detail + recommendation → log |
| **R4** | 🔴 **2026-08-21 — the demo MUTATES THE REAL STORE.** Edit an expense inside the demo and the write lands on the user's actual plan | ✅ **CLOSED 2026-08-21** — refused **by construction** via `createDebtStore`'s `opts.refuse` veto, not reported after the fact. 15 sites · 4 declared background writers · `lint:sandbox`. ⛔ **Reported by Sentry from TestFlight**, not by a test — the first time telemetry out-performed both the suite and the lane. `demo-containment.spec.ts`'s 14 tests assert navigation containment and none asserted write containment. ✅ 🎯's store was test data — luck, not a property of the defect. Detail → log |
| **R1** | Money's edit sheets had no date **picker** | ✅ **DONE.** `DateField` at all 4 sites. ⛔ Folded in: `todayLocalISO()` returned **yesterday** east of UTC. The fields had **zero** coverage before, which is why it shipped |
| **R3** | 🔴 **2026-08-20 — the demo strands an EXISTING user.** More → *Unlock Premium* → *"See it in action"* takes over with no clear way back to their own plan | ✅ **CLOSED, in TWO passes — and the first one only half-fixed it.** ⚡ **🎯 2026-08-20, on review: the report was that an exit *"was not obvious"*, and R3 changed only what it SAID.** The exit was still `textStyles.caption` — the app's smallest text style — while the scripted run carries a full-width Button. **P6.4.4 made it a `Pill`** *(same position, reach, labels, testID)*. ⛔ **A relabel answers "what does this mean now I've found it", never "can I find it"** — and the site's own reasoning was entirely about REACH, never visibility. Detail → log. Original diagnosis below | ⚡ **Mechanism, read not guessed — and my first reading was WRONG.** The paywall pushes `/demo?from=paywall`, which is the **explore** run, and explore has **no dock**; its only exit is `ExampleCanvasMarker`'s row. So an exit *does* exist on every screen. ⛔ **The defect is what it SAYS:** a caption-sized link reading **"Start my real plan"** → `exitDemo('/onboarding')`. To an onboarded user — **the paywall CTA's main audience** — that reads as *discard what I have and start over*, so the one way out looks destructive and nobody sane taps it. *(It is in fact safe: the route guard bounces an onboarded user straight to the tabs. The user cannot know that.)* ⚠️ Same shape as **R2**: the door exists and is built for the wrong audience. ✅ **FIXED 2026-08-20 (🎯: *"'Back to my plan' is more clear"*)** — the exit is labelled for who is reading it, and ⛔ **`tsc` then showed the defect ran deeper than the label**: `exitDemo` hard-routed **every** exit through `/onboarding` on the stated premise that *"a demo viewer has no plan yet"*. True of the Welcome door, false of the paywall door. `DemoExit` gained `'/'`, the returning user goes straight to their tabs, and `back_to_plan` is now its own funnel reason — a return is not a conversion. +2 e2e, plant-verified |
| **R2** | The expense set-aside is uncoachable · living expenses undiscoverable | ✅ **DONE = 3.8.** Both were the same fix. ⛔ The second half was **worse than reported**: the Money door existed but was gated on `livingTotal > 0`, so it showed only to users who had already found the feature |

⚡ **None of these was reachable by 4.1.** The lane checks that built behaviour keeps working; these are
*design* gaps. **No coverage split models "the app does the wrong thing correctly"** — using it is the only
instrument that finds them.

⛔ **R3 makes the point twice over.** `demo-containment.spec.ts` has **14 tests**, two of them aimed straight
at this path — *"the PAYWALL door — 'See it in action' reaches the demo"* and *"the EXPLORE run carries its
own way out, on whatever screen you wandered to"* — and **both pass while the exit is unusable.** They prove
an exit is *present and reachable*; neither asks what it **says** to the person reading it. ⚡ **A suite can
be exhaustive about the question it chose and silent about the one that matters** — and here the chosen
question ("is there a way out?") and the real one ("does it look like a way out, to me?") differ by one word.

---

## ⚠️ Open threads — each has an owner

✅ **The coach-mark defect, the transient Guardian card and §12.6.1 closed with the audit gate 2026-08-19** —
they were that gate's inputs, never separate threads.

**a11y, owed to the premium sub-audit:**
- ⭐ **`hitRegion` = 2 real findings, on BOTH tiers** — two hit targets below the minimum, reproducible.
  Now *characterised* (`"Hit area is too small"`) and still *unlocated*: `compactDescription` does not name
  the element. The probe compiles, so `issue.element` can be added at low risk — ⛔ **not worth a dedicated
  ~50-min dispatch; the nightly answers it for free.**

**Lane residuals — Phase 6 as known issues, none gating:**
- ⛔ **The iOS driver stall has happened TWICE and its retry does not clear it** — zero flows after paying a
  full build, indistinguishable from a real red in exit code and cost. **Check for that warning line before
  diagnosing any iPhone-tier failure.**
- ✅ **The `tutorial-invite` intermittent is FIXED 2026-08-18** — three sightings (CI 08-10 · local 08-11 ·
  local 08-18, the last one red a full release gate). ⛔ **Cause: the test, not the app.**
  `click({ force: true })` skips actionability but still clicks **coordinates**, does not wait for the
  element to stop moving, and delivers to whatever is topmost — measured: `tutorial-scrim-blocker`. So a
  test whose stated subject is *the tab-press LISTENER* was really asserting on the scrim's layout.
  Replaced with `dispatchEvent('click')`, which fires on the element: no coordinates, no stability
  requirement, no topmost-node dependency. ⚠️ **Mutation-verified** — deleting `holdTabs` reds it, which
  the previous version famously did **not** do. ⚠️ The failure MECHANISM was never reproduced (an
  instrumented full-suite run came back green and healthy); what is proven is that the line depended on
  layout it never meant to test. Suspects if it recurs are recorded at the call site.
- ⚠️ The boot poll that replaced `sleep 25` **does not fire** · the XCUITest probe went **1 min → 11 min** on
  iPhone (suspect: `descendants(matching: .any).count` ×3) · the `tutorial-invite` intermittent (see above) had red
  **twice** (both times the session had ENDED when the test expected it running).
- ⚠️ **Two of the 15 flow files MEASURE rather than cover** (`i01-ipad-boot`, `11-reduce-motion`) — any
  re-derivation that counts files overstates itself. **§12.0.7 is unclaimed** (the demo persona's Money-tab
  debt names were never established).
- ⚠️ **The Reduce-Motion probe's answer lives only in a PNG** — Maestro dumps a hierarchy on FAILURE only,
  so a passing flow captures no value. *A probe whose result a human must look at cannot gate anything.*
- ⛔ **The `toISOString().slice(0,10)` off-by-one is now OWNED BY T3** — and the audit measured it at **9
  production sites, not ~4**, including `recurrence/rolloverPayCycle` (the rollover advances every due date,
  so the error compounds every cycle) and `payCycle/getNextPaycheckDate`. L0-2 · L5-9, corroborated by two
  independent lenses plus two historical fixes of the same pattern.

**Pages, both → Phase 6:**
- ⚠️ **The deploy allow-list must flip at launch** — build from `release/v1`, drop `v1.7-dev`, or a dev
  branch can publish to a public marketing URL indefinitely.
- ⚠️ **Nothing checks that a deployed SHA is green.** The deploy is `workflow_dispatch`-only *deliberately*
  (a `push:` trigger would publish ungated states), but *"deployed"* and *"passed the gate"* are held
  together by discipline. The artifact assertion catches a blank site, not a regression that builds.

---

## Phases — status

| Phase | Scope | Status |
|---|---|---|
| 0–3 | Design foundation · surface · premium substance · delight + native | ✅ COMPLETE |
| 3.5 | Interactive tutorial + bounded demo + the marketing embed | ✅ **COMPLETE 2026-08-17** — embed live, verified against the deployed page; device pass folded into Phase 6 at [D35] |
| 3.7 | Fold-in block (ledger clearance) | ✅ COMPLETE 2026-08-11 (Waves A + B; C merged into the audit gate) |
| **4** | **Quality (test harness)** | ✅ **COMPLETE 2026-08-17** on a green `32051842661`. ⭐ **26 proven · device pass 52 · derived, not asserted.** CodeMagic build cut |
| **3.8** | **The expense reserve** | ✅ **COMPLETE 2026-08-17** — both tiers [D36]. Pot · draw-down · capped offer · "Spoken for" · honest hero. **5 defects found while building**, +5 e2e (184) |
| **—** | **Whole-app cohesion + best-in-class + wording audit gate** | ✅ **COMPLETE 2026-08-19** — T1–T8 + T3B, [D37] 55/55 high+ traceable, 3 new lint gates, e2e 184 → 195. Detail → log |
| **5** | **Data continuity + cutover** 🔒 | ✅ **COMPLETE 2026-08-19** — the full v1.6 bridge, 5.10 green, the migration **verified on a live device**, the cutover **conditionally approved**. Detail → log |
| **6** | **Launch-ready** — the 62 → three audit gates *(**feature lock** closes on the last)* → delete legacy → device pass → *(**code freeze**)* → submit | ▶ **ACTIVE** — decomposed as **P6.1–P6.21** at the top. Carries the 60 coverable-not-built rows and 3.5's folded-in pass as device-pass work |
| 6.5 | Repo consolidation *(was 5.5)* | inside Phase 6 as **P6.11** — deliberately last, and finished before the final build |

⚡ **Phase 3.7's number, worth keeping:** a pre-authored ledger item is wrong about as often as it is right
— Wave A, of 14 items, **5 did not exist and 4 more were materially misdescribed** (one *inverted*); Wave B,
of 4, **1 refuted, 1 half-shipped, 1 wrong in 3 of its 4 premises, 1 clean.** The before-scan pays for itself.

### ⚠️ Standing constraints

- **⛔ BATCH THE NATIVE LANE** — `workflow_dispatch` + tags + the **07:00 UTC nightly**, and it stays that
  way. 🎯 2026-08-13: *"we just need to not kick off the manual Maestro build every time."* Measured that
  day: ~12 dispatches for about three runs' worth of distinct information. Run it at a human-chosen batch
  boundary: the end of a numbered item, or a change only it can verify. ⚠️ **Iterate with `-f device=ipad`**
  — skips the ~10-min iPhone suite; flow-only edits hit the `.app` cache, any `src/**` change busts it.
- ⚠️ **A VERDICT IS A CLAIM ABOUT WHAT IS POSSIBLE, and this lane has been wrong about that repeatedly** —
  the ⌘-key correction, `~/.maestro`'s 1m29s that was 22s, "no hierarchy dump", ccache's two wrong
  mechanisms. **A `[D]` that is really an unproven `[M]` keeps a check on the manual pass forever**, and
  re-verdicting on expectation is the overstatement 4.1.9c exists to stop. Seeded verdicts are a
  **hypothesis per row**.
- **`QA_TOOLS = true` ships in TestFlight and MUST be flipped false before submission** (`git grep QA_TOOLS`).
  ⚠️ The **instruments** are `qaEnabled()`-gated — `probeCoachMark`, the `coach-probe` readout,
  `suppressorReasons`, `RING_AUDIT`, `rm-probe` — so the flip's `git grep` must confirm they vanish **and**
  nothing depends on them. ⛔ **Never let a coverage row ride a QA door** — the general rule 4.1.10 bought.
- **Never push to `release/v1`** without 🎯 — it is the default branch and gated on a live, approved version.
  *(Lifted once, 2026-08-17, for two CI-only single-file commits.)*
- **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT · `react-native-ios-utilities ^5.2.0`.
- **v1.7 ships as ONE release.** Nothing launches until Phase 6 is done and Jason is satisfied.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

---

## 📋 P6.14 reference — the device-QA ledger

Verify on real hardware; web cannot cover these. **🎯 The runnable truth is
[`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md)** — §11 · §12 · §13, plus the 60
coverable-not-built rows and 3.5's folded-in pass ([D35]). This is the index, not the list. ⚠️ Read figures
from [`audits/coverage-split.md`](audits/coverage-split.md), never from a doc quoting them.

**Owed from Phase 5 — fixed and unit-covered, never seen on a device** *(🎯 declined a CM build for them,
which is the right trade given this pass exists)*:
- Import a **v1.6 backup FILE** and confirm the restore does **not** land in onboarding *(`buildBackupData()`
  never emitted `hasCompletedOnboarding`; fixed at the root in `runMigrations`)*.
- The **document picker** — pick `v17-envelope.json` from **iCloud Drive**, not local; local would not
  exercise `copyToCacheDirectory`.
- The **`v16-damaged` repair report** naming *Visa · balance* and *Electric · amount*.

**Owed from P6.8.7d.1 [B3] — the clobber guard, none of it provable off-device:**
- Flip **Back up to iCloud ON** on a device whose container already holds a backup this install never
  restored. **The declined copy must still be there**, and the sheet must offer the fork rather than say
  *"Last backed up …"*.
- Take **"Replace it with this device"**, then **background the app twice**: the second auto-backup must go
  through *(it proves the write re-stamped `cloudBackupRemoteAt`; if it did not, the guard blocks forever)*.
- **Restore** from iCloud, then background: the same must hold *(the blob's own copy of the stamp is always
  one generation stale)*.
- ⚠️ **Kill the app immediately after backgrounding** — the stamp rides `flushPendingSave()` and a
  suspension inside that window costs it. Expected worst case is a **false conflict**, never a loss.

**🔴 Owed from P6.8.7e.5 [C4] — THE ROW THAT SETTLES A PREMIUM FEATURE, and it is the highest-value row here:**
- On a **premium** device with **Payday Countdown ON**, sit inside the last 3 days of a real pay cycle
  **without re-saving the paycheck sheet**, and record whether the Live Activity ever appears.
- ⛔ **Expected from source: it does not.** The gate is
  `wholeDaysBetween(paycheck.currentDate, nextPaycheckDate) <= 3`, and `currentDate` is a **cycle anchor**
  that only moves at rollover — so it measures the cycle's LENGTH, which is ~14 or ~30, and never counts
  down as real days pass.
- ⚠️ **Then the second run: re-save the paycheck sheet inside that window** *(`paycheckForm` writes
  `currentDate: todayLocalISO()`)* and confirm it DOES appear. That is the mechanism refinement — the
  feature is not dead, it is **contingent on an unrelated user action**, which is why one row cannot be
  "does it work" but must be **both** runs.
- ⭐ **If confirmed it is 2.0 by default** (🎯's standing call: you cannot sell a feature and ship it dead),
  and it also restores the only second rollover door.

**Owed from P6.8.7d.2 [C9] — the delete, whose refusal branch web cannot reach:**
- **Delete all data with a backup in iCloud.** The file must be **gone** from the container, and the next
  launch must NOT offer a restore.
- **Delete all data signed OUT of iCloud.** Nothing may be deleted; the blocked message must render and
  **"Delete on this device only"** must wipe locally and leave the remote alone.
- **Delete all data with iCloud reachable but the unlink failing** *(airplane mode mid-tap)* — the `error`
  wording, and **Try again** succeeding once connectivity returns.

**Carried from the audit gate:** **[T3.2]'s storage-fault row** — force a storage fault, confirm the retry
screen renders **and** the retry recovers. Two T3 surfaces ship on unit assertions with no rendered proof.

**Also owed:** **A0.4** (payoff-schedule device re-verify) · **A8.4** (the Siri phrases, incl. the
load-bearing `\(.applicationName)` check) · **§3.1.2** SF Symbols on the min-iOS target · **§2.8** native
scan · **§2.11** RevenueCat real purchases + restore · **§3.3.1** the AHAP crescendo FEEL · **§VIS-2/B2**
share rasterizes fully · **§3.4** `expo-blur` real material · **§3.5** Live Activity / Island / widgets /
App Intents · **§3.6** iPad both orientations, Split View, Stage Manager, pointer/keyboard · **§VIS-6**
sound + notification delivery. Highest value single row: **§11.15**, the iPad ring-origin invariant.

⛔ **Five rows stay `[D]` for stated reasons, and they are forward guidance.** **§5.4 StandBy is
PERMANENT** — *"put the phone on a charger"* is physical state a simulator has no concept of. **§5.1**
(widget gallery) · **§5.3** (Lock-Screen Customize) · **§6a.2** (Island long-press, needs a 15/16 Pro sim) ·
**§10.3** (Stage Manager drag) each need their own probe first. ⚠️ The three `[A]` ⌘-key rows stay `[A]`.

- **⭐ [SUB-AUDIT] Premium-accessibility:** VoiceOver rotor + a full walk · Dynamic Type AX3/AX5 reflow ·
  reduce-motion · contrast both themes · focus order · touch targets. **WCAG 2.2 AA is the FLOOR.**
  - ⛔ **BOTH GUARDS COVER 2 OF THE 4 NATIVE-ONLY PROPS, AND THE MISSING TWO KEEP BITING.** eslint and
    `check-native-a11y-props.ts` ban `accessibilityElementsHidden|importantForAccessibility` but **not**
    `accessibilityValue` or `accessibilityState` — yet react-native-web drops all four identically. ⚡ **The
    guard written for one instance of the class does not cover the class.** ▶ Extend both; `accessibilityState`
    appears in **11 files**, so the conversion is this sub-audit's work.
  - ⚠️ **`CheckCircle` reports no checked state on WEB** · **`ListRow`'s swipe-to-delete announces a hidden
    Delete button on EVERY row** (a destructive control the user cannot see, once per row).
  - ⭐ **`hitRegion` = 2 real findings, on BOTH tiers** — two hit targets below the minimum, reproducible,
    *characterised* (`"Hit area is too small"`) and still *unlocated*: `compactDescription` does not name the
    element. `issue.element` can be added at low risk — ⛔ but the nightly answers it for free, so it is not
    worth a dedicated ~50-min dispatch.
- **⭐ [SUB-AUDIT] Performance-feel:** 120fps ProMotion · Skia redraw cost · cold-start TTI · list jank ·
  optimistic-UI feel. Includes the Today/cushion-forecast memoization check *(conditional on a real measured
  hotspot)* and Dynamic-Type device QA.

---

## Deferred backlog

**→ SURFACED BY P6.8.7f.5 (2026-08-23) — the gate earned its run**

- ⛔ **THE A11Y FENCE TOOK THE POINTER PATH WITH IT, AND MY OWN NEW TEST WAS BLIND TO IT.** `useInert`
  applies `inert`, which removes a subtree from the tab order **and makes it non-interactive** — so
  `SwipeDeleteAction` stopped responding to the tap it exists for and **swipe-to-delete silently stopped
  working on web.** `a11y-row-labels.spec.ts`, written in the same step to prove the fence, passed happily:
  it asks whether the control is in the tree, and the regression was that the control no longer *works*.
  **Only the full suite caught it** (`swipe-delete.spec.ts`, 1 failed / 236 passed). Fixed with
  `focusable={false}`, which removes the tab stop and touches nothing else. ⚡ **The lesson is not "run the
  full suite" — it is that a test written to prove a fix is scoped to the fix's INTENT, and a regression
  lives in what the fix also did.** → **P6.8.9**.
- ⛔ **`cmd > log; echo EXIT=$?` REPORTED THE ECHO, AND THE HARNESS BELIEVED IT.** The backgrounded gate was
  announced as *"completed (exit code 0)"* while `validate:release:rn` had exited **1**. The real result was
  in the log. ⚠️ Already a standing constraint in this repo and it still landed — **read the gate's own
  summary line, never the wrapper's.** → **the gate docs**.

**→ SURFACED BY P6.8.7f.4's AFTER-scan (2026-08-23)**

- 🔴 **R5-N1 IS RESOLVED BY NOT COPYING THE PATTERN, and the contradiction it names is still open.**
  `RequiredActionsCard`'s comment says gating a swipe pane on React state was **measured** to reset
  `ReanimatedSwipeable`'s pan — the row snaps shut as it opens — and the shipped code in that same file does
  exactly that. One of the two is wrong. `ListRow` fences its pane **permanently** instead, so it inherits
  neither, but ⛔ **`RequiredActionsCard` still carries whichever of the two is the defect.** → **P6.8.9**.
- ⚠️ **`announce()` is verified on web by being ABSENT.** `announceForAccessibility` is an empty function
  body in react-native-web, so `useLiveAnnouncement`'s spoken half is unprovable in the harness by
  construction; the e2e pins the `aria-live` half, which is the half web actually has. → **P6.14** *(turn
  VoiceOver on, type an amount into Can-I-Afford-It, and confirm the verdict is spoken)*.
- **Nothing compares a spoken string against the shipped glossary**, which is how A1-2 lived. `lint:glossary`
  pins the constant and no gate reads an `accessibilityLabel`'s contents. ⭐ **The decidable version is
  narrow and worth having:** flag an `accessibilityLabel` template that interpolates a raw engine status
  field. → **2.1** *(not a ship-blocker now that the one site is fixed, and a new gate this close to a
  freeze is the kind of scope the sweep exists to protect)*.

**→ SURFACED BY P6.8.7f.3's AFTER-scan (2026-08-23)**

- ⛔ **AN ASSERTION AGAINST A PROXY FOR THE SUBJECT IS NOT AN ASSERTION ABOUT THE SUBJECT.** The V2-6 test
  first compared the callout to the `PAYOFF TRAJECTORY` label; the label is inset by the card's padding, so
  a callout sitting **12 px inside the card** still cleared it and the test **passed with the defect planted
  back**. Re-pointed at `tutorial-target-trajectory-scrub` — the rect the layer itself measures — it fails
  at 581 > 569. ⚠️ Sibling of *"an absence assertion passes before the app renders"*: both are tests that
  agree with the fix for a reason unrelated to it. → **P6.8.9** *(re-check what each new test asserts
  AGAINST, not only that it goes red)*.
- ⚠️ **`adjustsFontSizeToFit` is a no-op in react-native-web.** The Progress hero's 320 pt guarantee is
  therefore an **iOS-only** claim that the harness structurally cannot check — on web the two-line wrap does
  all the work. → **P6.14** *(read the hero on a small device at a wide month: September, November,
  December)*.
- ⚠️ **`insets.bottom` is 0 on web and ~34 pt on a device**, which makes `roomBelow` **less** often true and
  pushes more viewports into the above-branch — the branch that was broken. The device can only widen this
  finding, never narrow it. → **P6.14**.

**→ SURFACED BY P6.8.7f.2's AFTER-scan (2026-08-23)**

- ⛔ **A FIFTH stated mechanism wrong.** R6's `numberOfLines` census reports `TrajectoryChart.tsx:360`
  `waypointLabel` as unbounded; **it carries `numberOfLines={1}`** and did before f.2 touched it. So the
  unbounded set is `yLabel · xLabel · endPillText` — **three, not four** — inside a refutation whose whole
  point was that the lens had miscounted the same census in the other direction. → **P6.8.9**.
- ⭐ **`lint:type-scale` found five sites the audit did not, and the right answer on all five is DO NOTHING.**
  They are 28pt `title1` headings — prose, which Dynamic Type exists to scale. **A count-driven sweep would
  have "fixed" them and made the app less accessible.** The gate's floor is 30 for that reason, stated in
  the file. Recorded because the next sweep will find them again. → **no action**.

**→ SURFACED BY P6.8.7f.1's AFTER-scan (2026-08-23)**

- **`progressColor()` in `apps/rn/src/theme/colors.ts` has no callers.** Exported through `theme/index.ts`,
  so it reads as public API; the only thing named `progressColor` in a component is an unrelated prop. It
  was left in place and made to DERIVE its rgb from the token rather than repeat it, so it cannot diverge
  while it waits. → **P6.11** *(delete with the other dead modules, after the tree goes)*.
- ⚠️ **The light-theme frames in `capture-ref/p6.8/` no longer describe the app.** Every light token moved.
  Nothing depends on them today, but **P6.8.9 re-audits the results** and would be reading a photograph of
  the defect. → **P6.8.9** *(re-shoot the light half of the matrix before the verification pass reads it)*.
- **Left un-fixed on purpose, with numbers rather than a shrug:** the dashed `AddRow` and the OFF track of
  every `Switch` sit at **1.41–1.90:1** on `border.strong`. Both are identifiable by other means — `AddRow`
  carries its own label and icon, a `Switch` is a platform control whose own default off-track is no better
  — so 1.4.11 is not violated by either. ⛔ **Recorded so the next sweep re-decides it rather than
  re-discovers it.** → **P6.14** *(the felt severity of a hairline is a device question; DPR 1 flatters it)*.

**→ SURFACED BY P6.8.7e.6's AFTER-scan (2026-08-23)**

- ⛔ **THE FULL E2E SUITE DIES MID-RUN AND THE CORPSES LOOK LIKE REGRESSIONS. Twice in one session.** Once
  at test 24 *(203 false failures)*, once at test 171 *(64)*. Both times the failures were **contiguous from
  the death point to the end**, spanned specs the change could not touch (`/history`, `/living-expenses`),
  and **every one passed on an isolated re-run** — 14/14 and 52/52. ⚠️ **The first instance had a cause
  (a SIGTERMed run left a live webServer); the second had NO stray process at all**, so the mechanism is
  not yet known and "it's the stale server" is now an explanation of first resort rather than a diagnosis.
  ⭐ **The discipline that works: re-run the failures in isolation before believing any broad failure.**
  → **P6.8.9** *(and it belongs in the gate docs — a CI run that dies this way reports a red release)*.

**→ SURFACED BY P6.8.7e.4 + e.5's AFTER-scan (2026-08-23)**

- **⛔ A FOURTH mechanism wrong in two clusters — and this one was caught by a TEST, not by reading.** C5's
  stated harm ("the debt-first user is told they're caught up") is false: `minimum_debt` is a required
  category, so `outstanding > 0` and no zero-branch renders. **The e2e failed before the code did.** ⚡ The
  running tally for d+e is **B3 · B2 · M3-5 · C5 — four findings whose observation held and whose
  explanation did not.** → **P6.8.9** *(the verification audit should re-read every fix against its
  finding's stated mechanism, not just against its id)*.
- **⚠️ `PlanState` still has no `'no-bills'` member.** e.4 branches on `store.requiredExpenses.length === 0`
  at two call sites rather than adding one to the union, because the union drives routing and a new member
  would touch every consumer inside a converging freeze. ⭐ **The type is the right home** — it is what made
  the asymmetry invisible in the first place. → 2.1.
- **⚠️ An unmapped icon glyph renders FINE on iOS and looks foreign.** `AppIcon.ios` falls back to
  MaterialIcons, so nothing breaks and nothing warns. e.4 mapped `receipt-long` → `doc.plaintext`. ⭐ **A
  gate could assert every glyph used in `apps/rn/src` is in `appIconSF`** — the file's own header warns
  about this class and nothing enforces it. → **P6.8.9**.

**→ SURFACED BY P6.8.7e.3's AFTER-scan (2026-08-23)**

- ⏭ **C3 — a user away one cycle + 8 days — DEFERRED TO 2.1, on SYNTHESIS's own terms.** The row reads
  *"fold into C2 … if it doesn't fall out of C2, defer to 2.1."* **It does not fall out.** C2's door
  re-opens capture for the CURRENT cycle; C3 is a cycle already stepped past by a date advance, and
  re-opening cannot reach it. R3 had already killed half the finding (`PaycheckSheet` Save *does* advance
  the date); what survives is that **the cycle can never be reconciled, and the escape hatch destroys it
  silently**. Recording it here rather than letting "folded" quietly mean "done". → **2.1**.
- **⚠️ A plant red me for the wrong reason, and the test would have lied later.** The copy assertion used
  `payday-reopen` as its render marker — the very control the other plant removes — so deleting the button
  turned it red and it would have reported a copy regression that never happened. **A marker must survive
  the change the test is not about.** ⭐ This is the sibling of the absence-assertion rule from 7c: that one
  is *"wait for something to render"*, this one is *"wait for something the plant does not touch."*
  → **P6.8.9** *(worth one sweep of the specs added this phase)*.
- **`completeCapture` and `dismiss` are indistinguishable after the fact** — both only stamp
  `lastHandledPaydayDate`. That is why the card's copy had to become neutral rather than accurate: the app
  genuinely cannot tell whether the user captured or skipped. **A one-bit distinction would let both the
  card and `cycleHistory` be honest about a plan-shaped cycle.** Not built — it is a store-shape change for
  a copy problem already solved. → 2.1.

**→ SURFACED BY P6.8.7e.2's AFTER-scan (2026-08-23)**

- ⛔ **A KILLED `test:e2e:rn` POISONS THE NEXT RUN, AND THE WRAPPER STILL REPORTS EXIT 0.** The suite takes
  **>10 min**, so running it on a 10-minute foreground timeout SIGTERMs it and leaves a half-alive
  webServer. The next run attached to it, hung on test 24 for 1.1 min, and **failed 203 of 227** — a dying
  server, not a regression. ⚠️ **And `cmd > log; echo EXIT=$?` reports the ECHO's status**, so the harness
  said exit 0 over a 203-failure run: the [[remembered-gate-result-is-unrun]] hazard with a fresh face.
  ⭐ **Run it with `run_in_background` and capture the REAL exit code**, then confirm the pass count *and*
  zero `error-context.md`. Re-run after killing strays was **227 passed, exit 0, 0 contexts**.
  → **P6.8.9** *(worth a line in the gate docs — this is the third distinct way this suite has lied)*.

- 🔴 **[DECISION → P6.10] `actualIncome` capture for variable-income users — DEFERRED BY 🎯 (2026-08-23),
  not dropped.** C1's fix took the surprise-outflow half only. The other half stands measured:
  `substrateProducers.ts:60` returns the store unchanged when `incomeVaries` and no `actualIncome` is
  supplied, so **`incomeActualsLog` never grows for exactly the users it exists for.** ⚠️ Consequences that
  ship without it: **`LeanSuggestionCard` stays unreachable** *(`selectLeanSuggestion` reads that log)*, and
  `guardianPredictionCore`'s confidence count stays thin for variable-income users. ⭐ **The field is one
  conditional input in a sheet that now has the shape for it** — the expensive part (threading actuals
  through `onCapture` → `capturePayday`) is already built and shipped by e.2. → **P6.10**.

**→ SURFACED BY P6.8.7e.2's BEFORE-scan (2026-08-22)**

- **✅ C1's premise verified exactly.** `index.tsx:656` calls `capturePayday(items, decisions)` — **with no
  `actuals` argument at all.** The only two callers that supply one are `sandboxBeats.ts:79` and a test
  scenario. `PaydayCaptureSheet` has no surprise-outflow field and no actual-income field; its steps are
  adjust-required → verify-balances → extras → confirm.
- **⚡ AND THE FINDING UNDERSTATES IT: variable income is starved by the same gap.**
  `substrateProducers.ts:60` — `if (store.paycheck.incomeVaries && opts?.actualIncome === undefined) return
  store;` — so for a variable-income user **`incomeActualsLog` never grows**. That is *why* `LeanSuggestionCard`
  is unreachable (`selectLeanSuggestion` reads that log), and it also thins `guardianPredictionCore`'s
  confidence count. **C1 is one missing question with two starved consumers, not one.**
- 🔴 **[DECISION] the SHAPE of the entry point is 🎯's** — see the queue note on e.2.

**→ SURFACED BY P6.8.7e.1's AFTER-scan (2026-08-22)**

- **⚠️ `DebtSheet` REFUSES a balance edited to $0** — `minimumN > balanceN` → *"Minimum payment can't exceed
  the balance"*, which is true of **every** debt at the moment it is paid off. The rule is right for a live
  debt and wrong at the one crossing that matters. ⛔ **Not a ship-blocker: "Log a payment" is the intended
  affordance and it works** *(it even says "More than the balance — this will clear it to $0")*. But a user
  who paid a debt off elsewhere and goes to correct the balance hits a wall with no hint about the other
  door. **Recommendation: 2.1** — exempting `balanceN === 0` is one clause, but validation on the money path
  inside a converging phase is not where to spend the risk. → 2.1.
- **⛔ `seedStore` RE-SEEDS ON EVERY NAVIGATION, and it silently undoes what a test just did.** It uses
  `addInitScript`, which re-runs on each page load — so any spec that mutates and then `goto`s is asserting
  against the original fixture. It cost this item a full debugging cycle: the payment logged, the store was
  correct, and Today showed the debt un-paid. ⚠️ **`coach-marks.spec.ts` already carries a comment about
  this exact mechanism**, so it is the second time it has been paid for. ⭐ **A `seedOnce` (seed only when
  the key is absent) belongs in `helpers/seed.ts`**, not local to one spec — and the specs that mutate then
  navigate should be swept for it. → **P6.8.9**.
- **Two of three surviving e2e gaps in this phase were found by CHANGING the code, not by reading it** —
  "Delete all data" at d.2, the free-user celebration here. Both were invisible to 13 lenses. **The
  question worth gating is "what irreversible or once-ever moment has no test?"** → **P6.8.9**.

**→ SURFACED BY P6.8.7d.3's AFTER-scan (2026-08-22)**

- **⚡ `_layout`'s launch restore offer and `DataResetScreen` drop the SAME diagnosis, and more of it.** Both
  do `if (!result.ok) return` — the whole failure, silently. d.3 fixed the sheet, which is its scope; these
  two are **M3-7**, already on the record, and the measurement is that M3-5's site list was **1 of 3**.
  ⚠️ On the launch offer the silence is arguably right *(an Alert about a corrupt backup, before onboarding,
  to someone who may not know they had one)*; on `DataResetScreen` it is not — that user is **already** in a
  recovery flow and is being offered iCloud as the way out. → **M3-7, at P6.8.9's sweep**.
- **The whole `ready` branch of `CloudBackupSheet` is untestable by construction** — the web provider is the
  unavailable stub, so Playwright can only ever reach the dead end. d.3 answered it by moving the branching
  into a pure module; **the toggle, the conflict fork and both buttons remain source-only.** ⭐ **A fake
  provider behind an `EXPO_PUBLIC_` flag would make the entire feature e2e-testable** — the same shape
  `demoSession` already uses. **Recommendation: 2.1**, unless P6.14 finds a defect here. → 2.1.

**→ SURFACED BY P6.8.7d.2's AFTER-scan (2026-08-22)**

- **⛔ THE CODEBASE HAD ALREADY WRITTEN THE DEFECT DOWN — TWICE — AND THE DESTRUCTIVE SCREEN STILL HAD IT.**
  `paywall.tsx` tags the bare-`router.back()` no-op `[C9]`; `schedule/[id].tsx` fixed the same shape at
  3.7.A0. `more.tsx` — the one screen carrying an irreversible control — still called it bare, and because
  the wipe is sequenced *after* the pop, **"Delete everything" silently did nothing on cold entry.** Fixed
  and plant-verified in d.2. ⚡ **The lesson is the search, not the fix:** a repo-wide grep for
  `router.back()` against `canGoBack()` is a five-minute gate-shaped question nobody has asked. → **P6.8.9**.
- **⚠️ The `deleteBlocked` branch is unreachable off-device** — `CLOUD_BACKUP_SUPPORTED` is false on web, so
  the refusal path, both its messages and the device-only escape, ships on **source only**. → **P6.14 rows,
  filed below.**
- **A destructive flow with no e2e was NOT on any lens's list.** 13 lenses and 6 refuters read this app and
  none reported that "Delete all data" had zero coverage — it took *changing* the flow to notice. **Ask of
  every irreversible control whether anything exercises it.** → **P6.8.9**.

**→ SURFACED BY P6.8.7d.1's AFTER-scan (2026-08-22)**

- **⛔ M3-5 IS SCHEDULED AS WORK (d.3) AND WAS NEVER REFUTED — the second instance, and the rule now has
  a measured base rate.** It is a **major** in `M3-recovery.md`, but the slice's owed-list names only its
  four blockers, so no refuter was ever assigned and **`M3-5` appears in no refutation and in
  `SYNTHESIS.md` not at all.** ⚠️ c.3 found the same shape on M3-20 and the fix was "check the owed-list";
  **that check would have passed here** — the finding is not missing from a list, it was never on one.
  **The real rule is: check every id the BUILD schedules, against the refutations, not against the
  slice.** Refutation supplied at d.3's switch-in. → **P6.8.9**.
- **Two `stat()` round-trips per sheet refresh** — `getCloudBackupStatus` and `inspectRemote` each call it.
  Correct but wasteful on a native path; one call could serve both. **Polish, not a ship-blocker.** → 2.1.
- **⚠️ The `flushPendingSave()` after an auto-backup is best-effort by construction.** If the process is
  suspended inside that window the claim is lost and the next launch reports a **false conflict** on the
  user's own backup. Safe direction, and one tap to resolve, but it is a real rough edge — **filed to
  P6.14 as a device row** rather than engineered around now. → 2.1 if the device pass sees it.

**→ SURFACED BY P6.8.7c.3 + c.4's AFTER-scan (2026-08-22)**

- 🔴 **[DECISION] A v1.6 bridge that keeps failing is now a SILENT LOOP rather than a silent strand, and
  neither says anything.** c.3 fixed the permanent part — an inconclusive bridge no longer seeds, so it
  retries every launch instead of concluding "fresh install" once and forever. ⛔ **It did not make it
  speak.** A user whose database never becomes readable opens a setup wizard every time, with their v1.6
  portfolio on disk and no word about any of it. **Deliberately not built**, because saying it needs both
  a new surface *and* a persisted attempt count — and c.3's whole result was that the retry works
  precisely because it has **no** persisted flag to lose. ⚠️ c.4's card cannot cover this: it renders on
  Today, and this user never reaches Today. **Recommendation: 2.0 if the device pass shows any real skip;
  otherwise 2.1** — Sentry now reports every inconclusive skip (added in c.3), so **P6.14 will produce the
  evidence this decision needs** rather than it being guessed now. → **P6.10** *(feature lock; it is a new
  surface)*.

**→ SURFACED BY P6.8.7c.3's BEFORE-scan (2026-08-22)**

- **⛔ M3-20 IS SCHEDULED AS WORK AND WAS NEVER REFUTED.** `M3-recovery.md` states *"Wave-2 refutation
  owed on M3-1, M3-2, M3-3, M3-20"*; R1 delivered five findings and **M3-20 is absent from its verdict
  table.** P6.8.4's rule is *"no finding becomes work un-refuted"*, so c.3 supplied the missing pass at
  switch-in. ⚠️ **The gap is the process finding, not the finding:** nothing in the audit folder flags an
  owed refutation that never arrived, so this was invisible until someone opened the step. **Check the
  other clusters' owed-lists against their refuters before building them.** → **P6.8.9** *(the
  verification audit is the right place to sweep it)*.

- **⚡ M3-20's implied fix is WRONG about half its own evidence.** It cites `LegacyMapReport.dropped` and
  `.unknown` together as *"exactly what did not come across"*. Measured: **`dropped` is entirely
  deliberate** — every entry carries a documented reason and none is user data (`isDemoMode`,
  `mockSubscription`, `schemaVersion`, a v1.6 QA hook, superseded counters). Surfacing it would tell every
  upgrader the app "dropped" things they cannot act on and never wanted. **The real losses are `unknown`,
  `unparseable` and `quarantineFailed`.** Folded into c.3's scope rather than deferred.

**→ SURFACED BY P6.8.7c.2's AFTER-scan (2026-08-22)**

- **⛔ AN ABSENCE ASSERTION PASSES BEFORE THE APP RENDERS, and it has now bitten on two consecutive
  items.** `expect(x).toHaveCount(0)` is satisfied by a blank page, so a spec that navigates and
  immediately asserts something is *not* there proves nothing. Measured both times by a plant, never by
  review: c.1's null-balance spec and c.2's *"Money does not celebrate"* spec **both stayed green with
  the defect planted back**. The fix is one line — wait for a marker that renders in *both* branches
  first — but the class is repo-wide and unmeasured. ⚠️ **`lint:selectors` cannot see this**; it is about
  selector shape, not ordering. → **P6.10** *(a sweep of every `toHaveCount(0)` / `not.toBeVisible` in
  the suite, each checked for a preceding render barrier)*.

**→ SURFACED BY P6.8.7c.2's BEFORE-scan (2026-08-22)**

- **`clearQuarantine` has FOUR definitions, one test and ZERO call sites** — and `storage/adapter.ts:16`
  documents it as *"called from 'reset all data'"*, which is false. So a user who resets keeps every
  quarantined copy of their old plan in MMKV indefinitely. ⚠️ **Same shape as C9** (*"Delete all data"
  leaves the iCloud copy*) one layer down, and it should be fixed **with** C9 in **P6.8.7d** rather than
  separately — one honest answer to *"is my data gone"*, not two half ones. → **P6.8.7d**.

- **⛔ The `read() === null` path cannot be told apart from a genuine first launch — for a LOST MMKV FILE.**
  R1's mechanism correction: a file lost or truncated to nothing lands in the first-launch branch,
  producing a byte-identical outcome to the quarantine path — onboarding, no words, no `storageError` —
  but with **no preserved bytes**. ⚠️ **Any marker durable enough to survive that (Keychain) also survives
  a genuine delete-and-reinstall**, so it would tell a returning user their data was lost when they erased
  it themselves. Stated in the code rather than papered over. → **P6.14** *(which branch an induced MMKV
  fault produces is device-owed)*.
  ⚡ **CORRECTED 2026-08-22 by c.3's before-scan — this was filed too broadly.** A *second, different*
  cause lands in the same silent branch and **is** detectable: a v1.6 database that was **found and
  refused**. `readLegacyStores` records it in `report.opened[].error`, and `migrateFromLegacy` never reads
  that field — so it reports **"a fresh install"**. That half is **c.4's (W1-6) fix**, not an unfixable
  limit, and closing it is what would let this branch speak for the upgrade case.

**→ SURFACED BY P6.8.7c.1's after-scan (2026-08-22)**

- **⛔ A GREEN `lint:rn` DOES NOT MEAN THE TREE IS PURITY-CLEAN.** `react-hooks/purity` reports a
  component's `Date.now()`-in-render violations only while the React Compiler can still analyse that
  component; introduce one call it cannot analyse and the **pre-existing** violations surface at once.
  Measured in c.1: `DebtSheet` linted clean at baseline and produced **2 errors** the moment a parser call
  entered render scope, with the `Date.now()` calls **untouched**. ⚠️ So the lint is a *sampling* of this
  class, not a gate on it — and `FirstDebtOrBillStep` carries the same `Date.now()` id shape today,
  currently unreported. → **P6.10** *(a masked lint class is a structural gap, and this is the last gate
  that can find one)*.

- **`localId` / `nextGoalId` can hand out a DUPLICATE id across a relaunch.** Both are module counters
  reset to `0` on launch, namespaced by a cycle date that does not move within a cycle — so two purchases
  (`AffordabilityCard.tsx:24`) or two save-for-it goals (`SaveForItSheet.tsx:32`) created either side of a
  restart on the same cycle date collide. ⚠️ **`AffordabilityCard`'s own comment asserts the opposite**
  (*"Namespaced by the cycle date so it can't collide across restarts"*). c.1 deliberately did **not**
  copy this pattern into `DebtSheet` — `newDebtId` derives uniqueness from the ids that exist. → **P6.10**
  *(correctness; scope call, since the fix is the same three-line shape in two more files)*.

- **An unpolled `readStore` in an e2e passes vacuously** — it reads before the write flushes and then
  asserts over the seed alone. ⛔ **Found by a plant, not by review:** c.1's third spec **PASSED with the
  defect planted back** while the other two went red. **12 `readStore` calls exist across the suite and
  one visibly polls first**; the rest need checking individually, not a blanket edit. → **P6.10**.

**→ SURFACED BY P6.7's after-scan (2026-08-21)**

- **⛔ AUDIT THE PLAN FOR OTHER ✅ THAT MEAN "DECIDED" RATHER THAN "BUILT".** [D44] sat in the P6.7 queue
  row as *"✅ the deploy job asserts …"* for a day and a half and the step did not exist. The decisions
  ledger marks ✅ when a call is **settled**; a queue row marks ✅ when work is **shipped** — same glyph,
  one line apart, and the queue row is the one a reader trusts. ⚠️ **Not a code change — a sweep**, and
  it is cheap: every `[Dnn] ✅` referenced from an OPEN item, checked against the tree. → **P6.10**
  *(the last gate that can find a structural gap; a decision believed-built is exactly that)*.

- **`npm ci` does not work in `apps/rn`** — that lockfile is out of sync with its `package.json` (~12
  missing transitive entries), so `web-e2e`, the native lane and the Pages deploy all use
  `npm install --prefer-offline` there. ⚠️ **Already noted in two workflow comments as "filed separately"
  and it was never actually filed** — this is that filing. An unusable lockfile means installs are not
  reproducible, which is worth correcting deliberately rather than as a side effect. → **2.1**
  *(not a ship-blocker: the installs work, they are just not pinned)*.

**→ SURFACED BY R4's after-scan (2026-08-21)**

- **⛔ ASK THE SAME QUESTION OF EVERY OTHER GUARD IN THE REPO: does it PREVENT, or only DESCRIBE?**
  `useNoRealWritesGuard` was written at 3.5.3.0.5, survived a 117-finding audit across 7 lenses, and its
  entire contribution to the ship-blocker was an accurate description of the corruption while it happened.
  ⚠️ **Not a code change — a lens.** The `3.5.0.6` sync-seam guards are named in its own docstring as "the
  same move", so they are the first place to look. → **P6.9** *(it already traces every egress; "and can
  it be stopped" is one column wider)*.

- **A device row for R4.** ⛔ Write-containment is proven **on web only**, and R4 was found **on a device,
  by Sentry, on a surface 210 web tests had walked past.** One row: enter the demo as an onboarded user,
  edit a bill, exit, confirm the real plan is unchanged. → **P6.14** *(the next device build already owes
  the splash, the Sentry QA button and R3's exit)*.

- **`api.setState` is the one seam the veto does not cover**, by design — the actions route through the
  wrapped `set` and `setState` does not. Today it is used only for `isHydrated` / `storageError`, neither
  of which is in the `store` blob, so there is nothing to leak; the `StoreProvider` reporter now watches
  exactly this. ⚠️ **File, do not fix:** wrapping it would put the veto in front of `hydrate`, and refusing
  a hydrate shows the user an empty plan. Revisit only if a plan-bearing `setState` ever appears. → **2.1**.

**→ P6.8, from the P6.4.4 triage — ✅ 🎯 agreed 2026-08-20**
- ⏭ **THE FREE TRIAL — the 2.1 lever ([D53]).** 30 days minimum, **annual only**; the reasoning is on the
  decision, not repeated here. ⛔ **The code is wired and DELIBERATELY INERT:** `introPrefix(pkg,
  eligibility)` renders only on `'eligible'`, and every caller passes `'unknown'` today. **Turning the
  trial on is a config change PLUS a code change, enforced by the compiler** — the eligibility argument
  cannot be forgotten, only answered. ⚠️ **Thread `checkTrialOrIntroductoryPriceEligibility` before
  flipping anything in ASC**, or the paywall promises "30 days free" to a returning subscriber Apple will
  charge in full. 8 asserts pin both directions; the real determination is StoreKit's and needs a **device
  row with a sandbox account that has already consumed its trial**.

- **L1-22 — straight and curly apostrophes are mixed.** ⛔ **The real figure is 73 user-facing copy
  strings** — ⚠️ **I first quoted 152 and 🎯 agreed on that number; a line-grep had counted the comments,
  which is T4's measured failure ("comments about a word outnumber uses of it").** `lint:apostrophes`
  reads the AST, so only `StringLiteral` / template spans / `JsxText` count. Each still needs classifying
  and **every test pin must move in the SAME commit** — the L1-32 fix in this very step proved it, with
  **two Maestro flows holding the retired string in place**. → **P6.8**, the sweep on the frozen app.
  ✅ **The finding's other half is BUILT: `lint:apostrophes`**, baselined at 73 and mutation-verified
  (a new straight apostrophe in copy → exit 1 naming the string), wired into `lint:rn`. The count cannot
  grow between here and P6.8 ([D31] — a finding that becomes a gate is paid for once).

**→ COVERAGE, surfaced by P6.4.2 (2026-08-20)**
- ⛔ **`WhatIfControls` has NO e2e spec at all** — and it is the surface the `Slider` VoiceOver defect
  actually lived on *(its slider runs to `sliderMax`, up to $5,000; the only slider spec is
  `tutorial-invite`'s, whose control caps at $500 and therefore cannot produce a separator)*. ⚡ **The
  existing `aria-valuetext` assertion was `/^\$\d+$/` — a regex that REJECTS the correct answer**, green
  only because it was pinned to the surface that cannot exhibit the bug. Widened, but the untested screen
  is still untested. ⚠️ **Not gating: `lint:money` now catches the CLASS permanently** ([D31] — paid for
  once), so what is missing is a pin on the rendered a11y string, not on the defect. → **P6.8**, which
  sweeps every screen and would reach this one anyway.

**→ INTERNATIONAL — a workstream, not a line item (scoped 2026-08-20)**

⛔ **The EU is blocked by a HARD INPUT DEFECT, and it is not L5-15.** Every amount field is a
`decimal-pad` keyboard parsed with `Number(...)` / `Number.parseFloat(...)` — `DebtSheet` ×6,
`ExpenseSheet` ×4, `GoalSheet` ×2, `LivingExpenseSheet`, `LogPaymentSheet`, and the onboarding step.
On a German / French / Spanish / Italian device **`decimal-pad` renders a COMMA**, and
**`Number("2400,50")` is `NaN`** — so the user cannot enter their balance at all, and the
`Number(apr) || 0` paths coerce that `NaN` to **0** silently. ⚡ **Shipping to a comma-decimal storefront
today is WORSE than not shipping there**: the wall is at onboarding, on the first number they type.
⚠️ **Also owed, and neither is code:** **DSA trader status** (Apple requires a verifiable trading name +
address, **published on the listing**, for any EU distribution) and a decision on English-only.
⭐ **Re-scoped, honestly:** the *product* fits — `PayCycle` already carries `"monthly"`, so a
monthly-paid European is served by the model. What is US-shaped is the **vocabulary** ("paycheck",
"BNPL"), which is a rewrite, not a blocker. **The order is: input parsing → trader status → L5-15 →
vocabulary.** Currency is the cosmetic layer on top of a real defect.

**→ 2.1, from the P6.4.1 triage (2026-08-20):**
- **L5-15 — currency is pinned to `en-US`/USD** while the paywall renders the store's real
  `priceString`, so a UK user reads their whole plan in `$` and the one screen asking for money in `£`.
  Real; a `useCurrency()` threaded through the formatters is a **feature**, and feature lock closes at
  P6.10 ([D52]). ⚠️ **Owed either way: a release-note line** — shipping it silent is the worse half.
  ✅ **Safe to defer — verified, not assumed: no currency code is persisted anywhere** (`git grep currency`
  over `data/` + `types/` returns nothing; amounts are plain numbers), so 2.1 adds the hook with **zero
  migration**, and the paywall already shows the store's real localized price, so there is no 3.1.2
  exposure. ⛔ **But the deferral is CONDITIONAL on P6.21's availability call** — AUD and NZD both render
  `$`, so at US/CA/AU/NZ the only visible seam is the paywall's `A$29.99`. **Open a `£`/`€` storefront and
  this becomes the app reading in the wrong currency on every screen.**
  ⛔ **MEASURED 2026-08-20, and it refutes my own "three formatters" estimate.** The formatter half is
  small — **2 sanctioned + 3 hand-rolled live + 3 dead**, and `paywall.tsx:85` already extracts the real
  symbol from RevenueCat, so the substitution has a source. **The cost is the SWEEP:** `111` literal `$`
  in non-comment source lines, unseparated into copy-vs-comment, and **every user-facing one is a place
  the app says `$` while the formatter says `£`** — plus the whole test corpus asserting on `$`.
  ⚡ **So this stays deferred on COST, not on the lock date** — which makes the deferral survive feature
  lock moving. An unbounded string sweep is the exact shape of change you do not take late.
- **L2-14 (“Autopay”, six surfaces) · L2-22 (“BNPL” pill fallback vs the domain token)** — domain nouns a
  rename would touch deliberately. A shared constant buys indirection and no safety. Revisit only if
  either term is ever renamed.

**Product, re-decided in Phase 6:**
- ⚠️ **Show the backup's own date in the replace-confirm** *(5.8.4 after-scan)*. The summary says *what* is
  in the file but not *when* it was saved, and *"am I about to overwrite three months of work with something
  stale"* is the question a destructive confirm should answer. The envelope already carries `exportedAt` and
  a v1.6 file carries it too — it needs the `localDate` helper to render without tripping `lint:local-dates`.
  **Deferred, not dropped:** the confirm is already honest about *contents*, which is the correctness half.
  ⚠️ **P6.3 gave it a SECOND site** *(P6.3 after-scan)*: the iCloud restore confirm has the same gap, and the
  sheet already renders the file's mtime one line above it — so the value is in hand there and merely not
  carried into the warning. Fix both together or neither.
- ⚠️ **Retire `raw-v17` import acceptance** *(5.8.2 after-scan)* — the weakest of the three markers
  (`storeVersion` + `paycheck` + `debts`, no format id), and it exists only because the pre-5.8 clipboard
  export has no envelope. ⚡ The RN app has never shipped, so the only holders of a raw-v17 export are
  **TestFlight testers**, who can re-export after updating. **Re-decide at P6.4, with the tester window
  closed** — dropping it earlier would break testers' files for no gain.
- **📋 Real-device cloud testing — as DEVICE-MATRIX coverage, not a way to shrink the manual pass.** ⛔ It
  moves only **3–6** of the `[D]` rows. ⭐ The real gap it closes is that everything runs on **ONE sim
  config** — §11.1 says outright *"a wide phone can pass while an SE fails"*. ⚡ Maestro Cloud is the
  zero-rewrite path. **Triggers:** Android at v1.8, or the first width-driven bug that reaches a user.

**Tooling / hygiene:**
- ⚠️ **The APP ICON disagrees with its documented source** *(P6.6/[D51] measurement, 2026-08-20)*. Rasterising
  `render-icon2.html` and sampling the shipped `apps/rn/assets/icon.png`: the icon is **globally darker**
  (corners `#3b2d7e` → `#0a051c`, bars `#34d390` → `#1cad96`) and its **corner and 40px inset are identical**
  — the signature of a **baked-in squircle with a dark surround**. ⛔ That contradicts the icons README
  (*"full-bleed, no alpha, iOS masks the squircle"*), and a pre-masked icon gets masked **again** by iOS, so
  any inset shows as a **dark rim on the home screen**. **One second to check — look at a home screen** — and
  it is an App-Store-facing asset, so it wants an answer before submission rather than after.
- ⛔ **`scripts/*.ts` is typechecked by NOTHING** *(P6.2 after-scan)* — `typecheck` is core + rn, and the root
  tsconfig **excludes** `scripts` outright. Every `lint:*` gate and audit instrument — the code that decides
  whether the release gate passes — runs unchecked, and `tsx` does not typecheck. Needs its own tsconfig
  (the `.ts`-import-extension convention is why it was excluded). **Deferred:** tooling, not launch work;
  edits here get a hand `tsc` in the meantime.
- ⚠️ **Two `maestro test` calls write no JUnit**, so their verdicts never reach the durable record
  (`11-reduce-motion`, the iPad's dark re-run of `i02`). Harmless today — both are measurement runs — and
  the same hazard `maestro-results.mjs`'s header documents for flow `09`: **the next flow added in its own
  invocation disappears silently.** ⚠️ `lint:lane` is where this becomes a check.
- ⚠️ **The embed's public URL names the repo** — `jsnyde03.github.io/debt-app-v1/`. Fine for an iframe; a
  custom domain or a repo rename removes it. **A brand call with a DNS dependency** → 🎯 whenever the
  marketing page exists.
- ⚠️ **Maestro is unpinned** — `get.maestro.mobile.dev` fetches latest, and 4.1.1 spent three cycles
  establishing which commands this build supports. A silent upgrade can retire one. *(Caching `~/.maestro`
  was refuted — 22s, not the filed 1m29s.)*
- **No local pre-flight for the capture path** — a flagged web export + ~40-line check would have caught
  several CI cycles' worth of defects.
- ⛔ **REFUSED WITH MEASUREMENTS, do not resurface:** **ccache** (`0/648 cacheable` twice; both stated
  mechanisms wrong, and modules-off cost 888s vs a 771s baseline — the only remaining avenue is prebuilt pod
  binaries, a dependency-packaging change) · **DerivedData caching** (~70% of the boot step is simulator boot
  + install, which it cannot touch, against multi-GB in a 10GB cap where LRU could evict the `.app` cache
  saving 17 minutes — *the optimisation eating the optimisation*).

**Carried out of T4–T8 with NO recorded closure** — each was routed to a step that has since closed, and
none shows a closure in the log. ⛔ *An untraceable closure is indistinguishable from an open finding*, so
they are re-filed rather than assumed done:
- ⚠️ **`testFullAppRegression.ts:63`'s conservation assert holds only when the reserve FITS** — with an
  over-sized everyday reserve, `paycheckAmount − livingExpenseReserve` goes negative while the allocation
  sum floors at 0. Not exercised today → **P6.10**.
- ⚠️ **`AmortizationView` calls a BNPL's `bnplMonthlyEquivalentMinimum` "the minimum"** — it is a monthly
  *equivalent* of an installment minimum. Precision, not a lie → **P6.8**.
- ⚠️ **The timeline's cushion row label is unasserted** — `buildTimelineItems` pushes it and
  `TimelineLedger` renders it, but no spec reads it, so T4.3's rename there is unverified by the gate →
  **P6.4**.

**Genuinely a later version / tier:**
- **`typicalAmount` still has no UI** → the wording/cohesion gate.
- **The app never shows a debt-free date reflecting its own plan working** — on day one the starter EF
  absorbs the surplus, so every projected date is minimums-only. Honest per screen; the question is the
  app-wide effect → the cohesion audit, **not a defect**.
- **The paywall lead has NO e2e coverage** — it sits behind the live public embed and is pinned only by
  `paywallLead.test.ts`; no Playwright spec asserts any branch of it. → **P6.4**.
- **The demo's beat dwell may be too short for the runner** — decide from the 2fps contact sheet.
- **Apple Watch** → v1.8+ · **`@gorhom/bottom-sheet`** → v1.8 Android · **Behavioral mis-entry /
  persistent-cushion / bill-shock autopilot** → Connected/Plaid tier · **Holiday/promo free-trial** → a
  reversible later lever; launch is paywall-from-day-1 · **iOS-18 Control Center** [D1] · **web light-mode
  hover screenshots** *(a QA artifact, not product)*.

### ⭐ The 62 findings [D37] did not cover — FILED TO PHASE 6 (🎯 2026-08-19)

⛔ **The complete list is [`audits/2026-08-17-v1.7-audit-gate/REMAINING.md`](audits/2026-08-17-v1.7-audit-gate/REMAINING.md)**,
**generated** from the findings files (`tsx scripts/check-audit-closure.ts --remaining`) — never hand-maintained.
**41 minor · 21 polish.** Owned by **P6.4**, which is where the call on them is made; T12's ~40 polish
items belong to **P6.8**, the sweep.

⛔ **Why the generated list exists: 20 of the 62 were named in NO ledger at all** — not the plan, not the
log, not the refutations — because the T9–T11 lists below are *partial enumerations* and `lint:closure`
only ever gated blocker+major. **A sweep driven off T9–T11 would have silently dropped 20 findings**, 13 of
them L2 drift. `lint:closure` now REPORTS the low tier every run (never gates it — an untraced minor is the
expected state here, and a gate that reds on the expected state trains everyone to ignore it).

⚡ **Do NOT read it as 62 edits.** Measured: of the 61 cross-file copy duplicates, **24 are generic chrome**
(`Save`, `Cancel`, `Done`, `Add`, `Name`, `Back`) that repeat *by design* — "fixing" them is how L2-6's
suggested fix would have made five dead strings load-bearing — and **5 more involve `LiveActivityQA.tsx`,
which the `QA_TOOLS` flip deletes.** Several are already dead; more die with 5.5.1.

✅ **[D42], 2026-08-20 — the commitment is a BAR, not a COUNT.** All 62 get **judged** at **P6.4**; what
gets **fixed** is every defect and every finding on a surface that ships. ⛔ **Do not convert this back into
"clear all 62"** — 29 are known non-work, and L2-6 is the precedent for a "fix" that made five dead engine
strings load-bearing.

✅ **T9–T11 RETIRED as drivers, 2026-08-20 (P6.2)** — verified id by id: their 8 low-tier ids are all in
`REMAINING.md` and the 6 they called MAJOR are genuinely major, so they carry nothing it lacks. Their text
and reasoning → log. ⭐ **T10's dead-code verdicts still owe a re-check against the ROOT tree** → P6.11.

_Post-triage under the fold-don't-defer rule — only two carve-outs remain: **device-gated**, or **genuinely
a later version/tier**._

---

## Decisions

- **[D57] ✅ 2026-08-22 — ONE SURFACE FOR "COULD NOT READ IT", AND W1-6 GOES FIRST** (🎯, on my
  recommendation). Migration losses report through **c.2's existing `pendingDataRepairs` card** — a
  `migration` member on `DataRepair.entity` — rather than a second field and a second ack competing for
  the same slot; the user's question is identical in both cases. And **c.3/c.4 are SWAPPED**: W1-6 is a
  correctness bug that *produces* the outcome M3-20 reports, so building the report first would ship a
  surface whose most important input R1 measured as wrong. Detail → log.
- **[D56] ✅ 2026-08-22 — THE TWO SILENT DATA EVENTS EACH GET A SURFACE, AND ONE OF THEM BLOCKS** (🎯, on
  my recommendation). A corrupt-store reset renders a **blocking screen before onboarding** that owns the
  ways back, rather than a dismissible banner over the setup form. And a repaired amount is held in a new
  persisted **`pendingDataRepairs`** until the user acknowledges it, rather than rendered live from
  `dataRepairs`. ⛔ **The second half is not a preference:** `repairsAreNotRepeated` is a shipped
  invariant guaranteeing the per-read list is empty on the next pass, so a live-only card would be visible
  for one session and only to a user who happened to open Today — the same silence the finding is about.
  ⚠️ **Accepted cost:** one new persisted field, defaulted and merged in `runMigrations`. Detail → log.
- **[D55] ✅ 2026-08-22 — A MONEY FIELD READS SEPARATORS, IT DOES NOT REFUSE THEM** (🎯, on my
  recommendation). `"1,200"` and `"$1,200"` parse as **1200**; anything that does not resolve to a finite
  positive number is refused. ⛔ **The alternative — strict rejection, matching `WindfallSheet` — was the
  smaller diff and the wrong call:** it leaves a dead end (the field reads `1,200`, the error reads
  *"Enter the current balance."*) and it would have put the input boundary **at odds with the repair
  path**, since `data/migrations.ts` already repairs stored values by stripping commas. ⚠️ **Safe because
  of where 2.0 ships** — US · CA · AU · NZ are all period-decimal; a comma-decimal storefront makes
  `"1,50"` mean one-fifty and **cannot be added without revisiting `store/amountField.ts`**, which says so
  in its own header. Also settled: an OPTIONAL field (APR, a goal's starting balance) treats **blank and
  unreadable as different answers** — blank is `0`, unreadable stops the form. Detail → log.
- **[D54] ✅ 2026-08-21 — R5 (the expense reserve in the plan) IS A 2.0 FEATURE** (🎯). Reverses 3.8's
  *"the offer … is NEVER required"* premise. ⛔ **It is a new capability, so it MUST clear P6.10 feature
  lock** — which is exactly why [D52] moved that line to P6.10. Scheduled as its own Phase-6 row after
  P6.8 and before P6.9, so **P6.10's money lens audits it** rather than it arriving after the last gate
  that could. ⚠️ Decomposed at switch-in, not now — the active decomposition is P6.8.7. Detail → log.
- **[D52] ✅ 2026-08-20 — BOTH LINES MOVE: feature lock → after P6.10, code freeze → after P6.18** (🎯).
  ⛔ **The reason lock moved is a contradiction, not a preference:** P6.8's charter includes *"is anything
  **missing**"* and hands structural gaps to 🎯 as scope calls — with lock at P6.4 every one of those
  auto-defaulted to 2.1, so the audit could not act on its own charter. P6.10 is the **last gate that can
  find** a gap. ⭐ **Freeze at P6.18 is 🎯's improvement on my P6.17 recommendation** — P6.18 is the last
  step that can **produce** a change, so the final build is cut from a frozen tree rather than one still
  absorbing a re-check. ⛔ **[D39]'s two-line structure SURVIVES** — I proposed collapsing them and was
  wrong: P6.11 alone deletes an entire app surface after lock, so a freeze declared at P6.10 would have
  been false the day it was written. Only the positions moved. ⚠️ **Known break:** P6.20 can still force a
  build if the assets show a visual problem — named, not designed away.

**Phase 6 — the launch decisions, all settled 2026-08-20 (🎯: *"Agree with your recs"*)**
- **[D47] ✅** — **iCloud backup is OPT-IN, default OFF, and offered once in-line.** [D41]'s claim is literally
  *"**Optional** iCloud backup"*, and **P6.9 has to prove that claim true** — an on-by-default copy of someone's
  finances leaving the device makes the privacy audit defend a position it does not have to hold. ⚠️ The cost is
  real and named: a backup nobody enables protects nobody, which is what the single prominent offer pays back.
  A fresh install still detects an existing blob and offers to restore. → **P6.3.3.6**.
- **[D48] ✅** — **ONE batched device build carries P6.3 + P6.5 + P6.6.** All three are device-only verifiable
  (signing/iCloud · Sentry capture on a real build · the splash), all three sit before P6.8, and a macOS cycle
  costs the same whether it verifies one or three. ⚠️ Residual: a signing failure has three suspects instead of
  one — mitigated by P6.3.3.1 introspecting the entitlements before the build is spent.
- **[D40] ✅** — **cloud backup uses the app's PRIVATE iCloud container, no passphrase.** A passphrase adds a
  *permanent* unrecoverable-backup failure mode to defend against a threat this product is not sold against;
  the container is already encrypted at rest and readable only by this app under this Apple ID. → **P6.3.3**.
- **[D41] ✅** — the privacy claim becomes ***"Your data never goes to our servers. Optional iCloud backup
  keeps it in your own Apple account."*** ⛔ **Never** *"end-to-end encrypted"* (false under [D40]) and never
  *"100% private"* again. → **P6.9** proves it literally.
- **[D42] ✅** — **P6.4 commits to a BAR, not a COUNT.** All 62 get judged; what gets fixed is every defect
  and every finding on a shipping surface. ⚡ A count would spend the pre-lock window on the 24 generic-chrome
  duplicates that repeat by design and the 5 rows the `QA_TOOLS` flip deletes.
- **[D43] ✅** — **the splash is the app icon on the icon's own dark background, no wordmark.** → **P6.6**.
- **[D44] ✅ decided · ✅ BUILT 2026-08-21 (P6.7.3)** — a Pages deploy asserts its SHA has a green
  `web-e2e` run and fails otherwise. ⚠️ **The two ticks are not the same tick, and conflating them cost
  this decision a day and a half of looking done:** a decisions ledger marks ✅ when a call is *settled*,
  a queue row marks ✅ when work is *shipped*. Both states are now stated explicitly here.
- **[D51] ✅ (🎯 2026-08-20)** — **the splash ships a LIGHT and a DARK variant, both showing the MARK rather
  than the app-icon badge.** 🎯: *"a light variant and dark variant would be more professional."* ⚡ **What
  made it possible: the icon has real SVG source**, so the mark renders *without* its background — the
  square-on-light problem that forced dark-only was an **artwork** limitation, not a design conclusion.
  ⚠️ Light inverts the trend line and check badge to the icon's own `#1A1442` and deepens the bar gradient,
  because the originals are invisible on `#e6ebf3`; both values come from the icon's palette. ⛔ **Supersedes
  the dark-only half of [D43]**, which is what the current build carries — **this needs the NEXT build**, and
  splash becomes a row on that pass. → P6.6.
- **[D50] ✅ (🎯 2026-08-20)** — **P6.6 + P6.5 run BEFORE P6.4**, out of the settled order, then the batched
  build; P6.4 runs while the build and device pass are in flight. ⚡ **Why:** the device pass is the
  longest-lead and least-provable thing left, P6.4 is in-app judgement that changes nothing about signing,
  splash or crash capture, and a signing failure surfaces now instead of after a day of P6.4. ⚠️ Neither is
  a feature, so landing them before feature lock costs nothing.
- **[D49] ✅ (2026-08-20)** — **a green gate is RECORDED BY THE GATE, never typed into a document.**
  `validate:release:rn` writes `gate-status.json` (SHA + UTC date) on success only; `lint:gate-freshness`
  reds when source files have changed since that SHA. ⚡ **The failure it kills:** the gate was red from
  `f4e5e11` to 2026-08-20 and three sessions recorded it green, each correctly reasoning *"no source touched
  **this session**"* over a tree where source HAD moved. ⛔ **A doc rule cannot fix this — a doc rule is what
  failed**; the record has to be unforgeable, which means written by the thing it describes. Same [D31] move
  as `lint:closure`: turn the class into a gate. ⚠️ Deliberately scoped to **source**, so a docs-only commit
  does not red. ✅ **BUILT 2026-08-21 (P6.7.4/.5).** ⚠️ **Two corrections the building forced:** freshness
  turns on a **content fingerprint**, not a git diff — the original failure ran on a tree with committed
  *and* uncommitted movement, and hashing bytes covers both. And `lint:gate-freshness` is **NOT** in
  `lint:rn` as this decision assumed: `lint:rn` runs inside the gate, so a stale record would abort the
  run that refreshes it — **a freshness check inside the thing that establishes freshness is a deadlock.**
  It is a top-level script, and its consumer is whoever is about to *claim* green.
- **[D45] ✅** — **the monorepo stays**; `apps/rn` is not promoted to root. → **P6.11.2 closed.**
- **[D46] ✅** — **the QA door is resolved by ORDERING:** `P6.13` (build, `QA_TOOLS` on) → `P6.14` (device
  pass) → `P6.17` (flip, own green gate). ⛔ The probe rows get **no** non-QA path — that ships a debug
  readout to users. ⚠️ Residual named: the shipping binary is not the device-passed binary.

**Scope + revenue**
- **Re-scope to "The Elevation" ✅ (2026-07-20)** — design-first, best-in-class. **v1.7 ships as ONE release.**
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel.
- **Revenue spine ✅ (2026-07-25)** — Monthly $4.99 · Annual $29.99 · Lifetime $79.99. **NO free trial.**
  Reuses the existing RevenueCat project — v1.6 subs must restore.
- **Phase-3 scope ✅ (2026-07-27)** — pull EVERYTHING into v1.7 unless it genuinely can't ship. Analytics OUT
  of the core (privacy moat); the 3.5 demo re-opened it → a privacy-first funnel seam.
- **Executive "fix everything, no backlog" ✅ (2026-07-29/30)** — fold every audit finding now; only hardware
  verification waits for Phase 6. · **Legacy gate RETIRED ✅ (2026-07-24)**.
- **3.8 is in v1.7 ✅ (2026-08-17)** — 🎯: *"definitely in 1.7."* The app contradicts its own number.
- **[D39] ✅ (🎯 2026-08-19)** — **FEATURE LOCK ≠ FREEZE, and they happen at different times.**
  ⚠️ **The STRUCTURE stands; both POSITIONS were superseded by [D52] 2026-08-20** — lock is now after
  **P6.10**, freeze after **P6.18**. Read [D52] for where they sit; read this for why there are two of
  them. *(Historic: lock landed after "the 3.5 remainder" = T9–T11, one set not two.)* Freeze is later and stricter, every
  planned change landed. ⚡ **What it buys:** the FINISH sweep's structural-gap charter gets a **default
  answer** — after lock a structural gap defers to **2.1**, and only a defect or the completeness/polish of
  something already built is admitted. ⛔ **The boundary is a set that has not been re-measured** →
  **P6.2** regenerates it. Detail → log.
- **[D38] ✅ (🎯 2026-08-19)** — **this ships as `2.0.0`, not `1.7.x`.** ⚡ The argument is about the FUTURE:
  the version number is the baseline every later release is measured against, and a wrong baseline is
  permanent. ⚠️ **The internal name stays "the v1.7 Elevation."** Measured: nothing user-facing carries
  "1.7" and the shipped number is one field, `apps/rn/app.json` → `version`. → **P6.1**. Detail → log.
- **[D37] ✅ (🎯 2026-08-18)** — **every high+ finding is remediated this round**: all **55 of 117**
  blocker+major closed or explicitly refuted, each traceable to its finding id, and now enforced by
  `lint:closure` rather than by memory. ⛔ **Nothing is parked** — the minor/polish tier is SEQUENCED, not
  shelved → **P6.4**.
- **[D36] ✅ (2026-08-17)** — the reserve ships to **BOTH TIERS** (the lie is tier-blind, and `prefundedReserve`
  is premium-only, so it needed deciding rather than inheriting) · the Guardian segment is **"Spoken for"**.
  ⛔ *"Set aside"* is a portfolio name; *"Reserved"* would name a **different number** than the Money hero's.

**The demo + the embed**
- **[D21] ✅** the demo SHIPS to users again, reversing **[D19]**. Demo = before you commit; walkthrough =
  after onboarding, on your own money. It no longer rides `QA_TOOLS`.
- **[D23] ✅** the demo is **TWO runs** — `explore` ships to users; `scripted` is the App-Preview + embed
  vehicle. One artifact had been doing two jobs and the video's requirements won.
- **[D20] ✅** capture pipeline — Maestro drives · `simctl` records · ffmpeg conforms.
- **[D32] ✅** 3.5.7 hosts on **GitHub Pages** and its privacy claim is a **GATE** — static-only *by
  construction*, which is the property being asserted. No analytics in the embed build (a **build flag**, not
  a toggle) · `sessionStorage` only · **zero network requests after asset load** · all held by a spec that
  fails `validate:release:rn`. ⚠️ Every host logs IPs, so *"financial data never leaves your device"* stays
  literally true while *"100% private"* would overclaim.
- **[D34] ✅ (2026-08-17)** — the embed CTA names the **destination**: *"Get it on the App Store."* The
  listing is "Paycheck Debt Planner" and the app calls itself "Debt Planner"; naming the store means neither
  has to move. App id `6773201250`.

**Product + engine**
- **[D22] ✅** the debt/expense split is CORRECT and stays (terminating vs perpetual); the defect is **naming
  + entry**. [D22a] one chooser replaces the per-section Adds · [D22b] the detector runs retroactively ·
  [D22c] it surfaces, never silently re-files · [D22d] "bills" vernacular → the wording gate.
- **[D2] ✅** `minimumPaidThisCycle` is the owner ("minimum covered"); `isPaidThisCycle` means paid in full.
  ⚠️ Corrected by B.0: the fallback-less reader is `planSelectors.ts:156`.
- **[D24] ✅** the tight top-up prefers a **discretionary goal; the EF is the fallback**, and the copy names
  it when it IS the EF. The dishonesty was drawing on it *silently and first*.
- **[D25] ✅** an applied purchase **keeps** its deferrable behaviour but gets an **explicit category**.
- **[D3] ✅** the calm-micro-viz hero language **extends to Debts** · **[D26] ✅** the greeting's mechanism
  ships, its **strings** belong to the wording gate · **[D27] ✅** port the free on-plan streak only, **no
  flame** · **[D28] ✅** B4's swipe ships as a pure accelerator · **[D29] ✅** B1 CLOSED as refuted.
- **[D4] ✅** rename before the next device build — every App Shortcut phrase contains `\(.applicationName)`.
- **[D1] ✅ stays DEFERRED, on a NEW reason** — the original cost argument **expired** (the machinery exists
  now). It stays deferred because **there is no control-SHAPED job**: this app's actions are multi-step or
  rare and dated, and a glance is a widget's job, which already ships.

**The lane**
- **[D30] ✅** the iPad lane is **three tiers in one directory**, not a second flow set. Forced by
  `use-layout.ts`: on a wide iPad the debt sheet is **inline, not modal**, so flow 02 would pass while
  testing nothing.
- **[D31] ✅** the audits change **METHOD, not just model** — reading is the expensive half *and* the weak
  half. Scripted lenses where the question is deterministic · a **generated artifact** as the agent's input,
  never the raw codebase · cheap tier extracts, expensive tier judges a short list. ⚡ **Every finding that
  becomes a TEST is paid for once** — audit spend as capital, not rent.
- **[D33] ✅** §11.16 PASSES on both edges; beat 5's landscape crop is **deliberate** — cropping to reveal a
  headline the user already met would hide what the beat exists to show.
- **4.1.9 ✅ (2026-08-17)** — **XCUITest, and NO Appium.** The probe proved both capabilities Appium was
  wanted for a subset of. Appium buys 3 checks for a second driver, language and server process.
- **[D35] ✅ (2026-08-17)** — **3.5's device pass FOLDS INTO Phase 6's.** They overlapped the moment the
  coverable-not-built rows went to Phase 6. One sitting, no row run twice.

**Open:** none. **[D3] closed 2026-08-20** — the Money hero residual was answered by [D36] / 3.8.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Generated, always current:** [`audits/coverage-split.md`](audits/coverage-split.md) · `audits/strings-inventory.md` · `audits/surface-inventory.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
