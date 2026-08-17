# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — TWO LIVE TRACKS: **4.1** (precedence) · **3.5.7** (fills its waits)

🎯 2026-08-17: *"4.1 is still the precedent… 3.5.7 continues during waits."*

✅ **Nothing is in flight. Last four runs all GREEN**, tree clean, everything pushed.

⭐ **4.1.9b VERIFIED IN RUN `32037021903` — the split works and the lane is 15/15.** `build` 19m42s →
**both tiers started at the same instant**, iPad 18m02s ‖ iPhone 24m49s; **44m39s wall for ~62m of job
time.** iPhone **10/10** · iPad **5/5** · the XCUITest probe **ran on the tier** (the .3 fix) ·
`native-lane-results-*.json` resolved **every** flow to its filename, 0 unresolved · the 9.6 MB diagnosis
bundle carries the hidden `.maestro/tests/` hierarchy the `include-hidden-files` fix rescued, against a
122 MB full artifact.

⛔ **THE PLAN'S "~22 min → ~12 on a cache hit" IS RETIRED — it was never derived, and it is wrong in both
terms.** Measured: the iPhone tier ALONE is 24m49s, so no arrangement of these jobs reaches 12. A
cache-hit `device=both` should land near **~30m** (a ~5m build job + `max(25, 18)`), against ~45–60m
sequential. **The saving is real and it is the tier overlap, not the build.** ⚠️ Unmeasured until the
next dispatch actually hits the cache.

⭐ **The state that matters:** iPhone suite **10/10** · iPad tier **5/5** · the XCUITest probe **runs**,
springboard reach proven · coverage reads **24 proven · 9 automatable-half · 74 coverable-not-built ·
24 device-owed**, the device pass **50** · ⚡ **flow-only iteration is ~21 min, not ~43** — the `.app`
cache and `hermesc` both worked for the first time in `31835736974`.

▶ **BUILDING — 4.1.9b** (composite action · tier split · the caches that make both safe), **decomposed
below**. Then **4.1.7** (the three questions that still move the number — one dispatch) → **4.1.9c's
writer** → **4.1.10** (§12's scripted run, 15 rows, unblocked 2026-08-17) → **4.1.11** the exit.
▶ **In parallel — 3.5.7.5** (embed entry) → **.6** (Pages deploy) → **.7** (🎯's wording call).

⚠️ **Read the SESSION CLOSE 2026-08-17 log entry first** — it carries what NOT to build on.


✅ **3.7 CLOSED 2026-08-11.** Wave A (A0–A10) · Wave B (B.0–B.4) · Wave C merged into the audit gate.
Gate **167/167** + tsc clean, zero `error-context.md`. Wave B detail + its wave-level after-scan → log.

| # | Step | State |
|---|---|---|
| **4.1.3 – 4.1.5.1** | ✅ **CLOSED 2026-08-12/13.** The lane 0/8 → **8/8 on iPhone**: flow order made explicit · the `.app` cache (17m03s → 2s) · `lint:selectors` · ⭐ the coach-mark probe and the **three shipped defects** it found · the iPad boot at 1032pt. Detail + every scan → log | ✅ |
| **4.1.5** | **The iPad tier's REAL checks.** 4.1.5.1–4.1.5.4 and **4.1.5.5 all closed** — 🎯 §11.16 judged 2026-08-14, **both edges PASS**, evidence + reasoning → [`evidence/2026-08-14-p11.16-ipad-landscape/`](evidence/2026-08-14-p11.16-ipad-landscape/README.md). ⭐ **4.1.5.6 CLOSED 2026-08-14 — the iPad tier is 5/5 in run `31827409093`**, its first content ever: `01` · `i01` · `i02` · `i03` · `05` all pass. ⛔ The two prior "results" were **non-results** (`iOS driver not ready`, zero flows); the cause was a 240s timeout the iPhone step had already had raised to 420s. ⚡ **The raise alone sufficed** — the retry never fired. ⛔ The "nudge the scroll offset" fold-in was **refuted**: `TutorialOverlay` measures but never scrolls — see the open defect below | ✅ |
| **4.1.6a** | ✅ **CLOSED 2026-08-17.** `audit:coverage` + `lint:coverage` (.1–.6) and the XCUITest target (.7). Its standing guidance is kept below the active section | ✅ |
| **4.1.6** | **§12.0 explore** — `09-demo-explore.yaml` | ✅ **CLOSED 2026-08-17 — dispatched and GREEN** in run `32037021903`, its first execution. Covers §12.0.1 · .2 · .4 · .5 · .6 · .7. ⚠️ **.3 and .8 do NOT automate** — see below |
| **4.1.7** | **The THREE questions that still move the number** — ① Reduce-Motion observability (§B3.6 · §11.7 fall to `[D]`, **+2**, if not) · ② a `typeKey` probe for the three `[A]` ⌘-key rows (**+3** if it fails) · ③ the a11y anchor's `rendered=false` | ✅ **BUILT 2026-08-17** — `ReduceMotionProbeReadout` (reports **both** sources) + `11-reduce-motion.yaml` · the ⌘-key probe **on the iPad tier** · the anchor now dumps what IS on screen. ⛔ **③ is diagnosed, and flow `09`'s own header predicted it** — see below. ▶ **Awaiting one `device=both` dispatch** |
| **4.1.8** | **§11's remainder** — `10-walkthrough-edges.yaml` | ✅ **CLOSED 2026-08-17 — 10/10, third consecutive green.** The `repeat` tap+erase fix for §11.9's cleanup is stable, not a fluke |
| **4.1.9** | ✅ **[DECISION] SETTLED 2026-08-17 — XCUITest, and NO Appium.** The probe proved both capabilities Appium was wanted for a *subset* of: springboard reachable **and inspectable** (`elements=241`), and `performAccessibilityAudit` completing on all four needed types in **2.9s**. **10 rows re-verdicted `[D]`→`[X]`; the device pass drops 60 → 50.** ⛔ Appium adds a second driver, a second language and a server process to buy 3 checks a driver we now have can plausibly do. ⚠️ Those 3 stay `[A]`, NOT `[X]` — XCUITest's `typeKey` is unproven here, and re-verdicting them on expectation is the overstatement 4.1.9c exists to stop. Detail → log | ✅ |
| **4.1.9b** | ⭐ **CI wall-clock: the composite action AND the tier split, as ONE pass** *(🎯 approved 2026-08-14; repo is PUBLIC so macOS runners are free)*. ① The `.app` key hashes the whole of `native-e2e.yml`, so the **flow list** busts the binary — both of today's runs paid ~771s of compile for pure YAML edits. ② The two tiers run **sequentially in one job** (no `matrix`), so `device=both` pays iPhone **+** iPad (~650s + ~666s) instead of `max`. ⚡ They merge: the extracted composite is exactly what two parallel jobs must both call. Also folds in `app-preview.yml`'s duplicated recipe + its missing cache. **Together: ~22 min → ~12 on a cache hit.** ⚠️ Loosens a key 4.1.3a hardened — safe only because the composite holds every build flag and `maestro test` lines cannot affect a binary. ⛔ **[.7.4c after-scan] The split must keep the XCUITest probe step in the iPhone job** — it sits between the two tiers today, and a step that stops running looks exactly like a probe that found nothing. ⚠️ Cache the `.xctestrun` + `-Runner.app` beside the `.app`, or the probe keeps skipping on every hit | ▶ **ACTIVE — decomposed below** |

⛔ **[4.1.9b scan] THE PLAN'S "529s / 40% COST CENTRE" IS STALE — measured 148s.** The laps landed in run `31808439691` and nobody had read them, though the note said to: `boot returned 10s · bootstatus 62s · installed 79s · launched 119s · reported-up 144s · complete 148s`. The instrumentation and the `sleep 25` → poll fix **worked**; the 529s predates them. ⛔ Do not spend anything else here.

⚠️ **[4.1.9b scan] …but the poll that replaced the sleep is not firing.** `launched 119s → reported up 144s` is **exactly** the 25s ceiling, so it never detected the app's own log signal and fell through to the timeout — functionally the `sleep 25` it was written to replace. Worth ~20s, and more importantly it is a fix believed to work that does not.

⛔ **[4.1.9b scan] Do NOT shard the iPhone tier.** The flows carry a real, documented dependency chain — `01` seeds · `07` clears state · `08` depends on `07` · `10` must precede `09` · `09` is terminal. Splitting it is how the suite starts lying. The tier SPLIT is safe for the opposite reason: each tier already runs its own `01`.

| **4.1.9c** | ⭐ **"Covered" must mean PROVEN, and proof ticks the checklist** *(🎯 2026-08-14: "Nothing should be marked covered unless it's proven to be. And as items are proven, they should be checked off")*. ✅ **READER DONE 2026-08-14** — the report now splits **PROVEN 25** (24 `✅auto·` · 1 human) from **claimed-but-unproven 8**; 3 new stamp-integrity gates, each proven on a planted defect. ⛔ **Two of this row's own premises were REFUTED by measuring:** the number was 33 claimed, not 34 (34 is *claims*, not checks), and **flow 08 PASSED** in the run the stamps came from — `~23` was near-right for a wrong reason. ▶ **Remaining: the WRITER**, which needs a durable per-flow results file → lands with **4.1.9b**. ⚠️ Provenance preserved: automation manages only rows carrying its own stamp, never a bare `[x]`. Detail → log | ◐ |
| **4.1.10** | §12.1–§12.7 (15) — the SCRIPTED run | ⭐ **UNBLOCKED 2026-08-17, and it STAYS in 4.1** *(🎯 hesitated at pushing it to Phase 6; the hesitation was right)*. ⛔ Its blocker was the checklist's *"on a device build you cannot pass `?mode=scripted`"* — **false since 3.5.7.5**: `DemoAutoEntry` enters the scripted run from a **build flag, no URL**, proven in the capture lane and the embed gate. ▶ Cheapest door is a `qaEnabled()`-gated control in More — no second binary, and it vanishes with the Phase-6 flip. ⚡ **And §12 now guards a PUBLIC surface**: the demo is the marketing embed's own screen, so these 15 rows protect a web page, not just an app screen |
| **4.1.11** | **Reconcile — the exit.** ⚠️ **[4.1.5.1 after-scan] the coverage split must NOT count measurement flows** — `lint:selectors` now reports **9 flows** because `i01-ipad-boot.yaml` is one, and it is explicitly not coverage (every assertion in it holds on both layouts by design). Any 68/127 re-derivation that counts files will overstate itself | |

### ▶ 4.1.9b — the composite action, the tier split, and the caches that make both safe _(active)_

✅ **.1–.8 ALL BUILT 2026-08-17.** Composite `rn-ios-sim-build` (recipe owned once) · the key hashes the
ACTION not the workflow, plus the Xcode tag and a per-lane namespace · the XCUITest products cached and
shipped as a **tar** · `build → iphone ‖ ipad` · `native-lane-results-<tier>.json` (90-day artifact) ·
the small diagnosis bundle · `app-preview.yml` adopted · ⭐ **`npm run lint:lane` — 76 static checks,
proven on 9 planted defects, in `lint:rn`.** Detail + every scan → log.

▶ **REMAINING: one `device=both` dispatch.** ⛔ **It WILL miss the `.app` cache and pay a full build** —
the key changed shape three ways, so every entry is unreachable by construction. That is the change
working. **The run AFTER it is the one that demonstrates the saving.**

**Exit:** that dispatch green, with `~22 min → ~12` on the following (cache-hit) run and the probe
running on that hit.

⛔ **[.1 before-scan] The "keep the two in sync" note ALREADY FAILED.** `app-preview.yml` is missing
`DEBUG_INFORMATION_FORMAT=dwarf` and `COMPILER_INDEX_STORE_ENABLE=NO` (added to the other recipe at
4.1.3a, 2026-08-12), `cache: npm`, and `fetch-depth: 0`. Measured, not assumed — the duplication drifted
inside five days, which is the argument for .7 rather than another sync note.

⛔ **[.3 before-scan] A cross-job split CANNOT ship the `.app` through the cache.** The re-bundled binary
is never saved (`cache/save` is gated on the rebuild path), so a tier job restoring by key would test the
JavaScript from whenever the binary was compiled — rule ②'s stale-binary hazard with a job boundary
standing in for a partial key. ⚠️ And `upload-artifact` **does not preserve the executable bit**, so the
products move as a **tar**, never as a raw directory.

⚡ **[.4 before-scan] The split makes the tier jobs cheaper than the plan claimed.** They need no npm
install, no pods, no Xcode select and no `tsc` — only the tarball, `simctl` and Maestro. ⚠️ Two jobs
cannot upload one artifact name: it becomes `maestro-report-iphone` / `maestro-report-ipad`, and anything
quoting `maestro-report` goes stale. ⚡ `!cancelled()` on the iPad step becomes **structural** — as its own
job it cannot inherit the iPhone tier's failure at all.

⛔ **[.6 after-scan] `lint:lane` FOUND A LIVE DEFECT ON ITS FIRST RUN** — the diagnosis bundle keeps
Maestro's `.maestro/tests/…` layout, a **hidden** path, and `upload-artifact` v4 drops those silently. The
72 KB bundle would have shipped without the one file it exists for. Fixed; the rule was then widened from
"paths mentioning `maestro-debug`" to **any recursive glob**, which is the general form.

⚡ **[.8 after-scan] A PLANT THAT DOES NOT LAND LOOKS EXACTLY LIKE A GATE THAT IS BLIND** — and it fails
in the *safe-looking* direction. Three of the first eight plants reported "gate missed it" while the
files were byte-identical to their backups. Planting now prints `plant-applied=YES|NO` beside the verdict.
⚠️ Two of my own checks were also wrong first time, **both reddening correct code** — a verifier whose
SCOPE is wider than the rule it enforces. Both now read parsed structure, not raw text.

⛔⛔ **[item after-scan] THE WEB E2E SUITE WAS TESTING THE EMBED BUILD — ~60 specs red, and the cause was
already written down in the sibling file.** 3.5.7.4 MEASURED that Metro's transform cache does not
invalidate on an `EXPO_PUBLIC_*` change (`flag=0, no --clear → sessionStorage`) and applied `--clear` to
`playwright.embed.config.ts` — **one of the two configs that needed it.** `playwright.config.ts` had
none, so after `test:e2e:embed` runs once on a machine, every later `export:web` reuses the embed's
transforms: `dist/` and `dist-embed/` came out with the **same content hash**, and `dist/`'s storage was
inlined as `()=>globalThis.sessionStorage`. The suite seeds through localStorage → the app boots empty.
⚡ **Proven by grepping the artifact, then fixed and re-measured: `dist` sessionStorage 0 / localStorage 1,
`dist-embed` 1 / 0.** ⚠️ **CI was green only by ORDERING** — `test:e2e:rn` runs before `test:e2e:embed`
on a cold cache — so it was broken from the **second local run onward**, the run a human does. Identical
shape to the iPad 240s→420s parity bug: *the fix applied to one of the two places that needed it.*

⛔ **[item after-scan] A SHIPPED DEFECT, found because it blocked this item's own gate: `lint:rn` was
broken locally, 7,578 errors.** 3.5.7.4 added `apps/rn/dist-embed/` to `.gitignore` and **not** to
eslint's `globalIgnores`. CI never saw it — `lint:rn` runs *before* `test:e2e:embed`, so a clean checkout
has no such directory — so the gate was only broken from the **second local run onward**, which is the run
a human does. Fixed here.

⚠️ **[item after-scan] Filed, not fixed:** the split doubles *concurrent* macOS minutes (free while the
repo is public; the sum-vs-max trade reverses if it ever goes private) · the boot step's poll still does
not fire, and stays unfixed **deliberately** — inventing a log predicate instead of grepping the artifact
already cost a cycle → **4.1.11** · `app-preview.yml`'s new cache will usually miss (it runs rarely,
entries evict in a week), kept for symmetry at zero added risk.

### 📌 4.1.6a — `audit:coverage`, the definitive checklist _(closed 2026-08-17; standing guidance)_

🎯 **Why it exists** *(Jason 2026-08-14)*: *"I'm not cutting the CodeMagic build until we have a
definitive checklist that covers everything that Maestro and Appium can verify"* — and *"the point of 4.1
is to see how much of the 3.5 checklist I currently have for the device build will be covered."*

⭐ **Delivered:** [`audits/coverage-split.md`](audits/coverage-split.md), regenerated by `npm run
audit:coverage` and gated by `lint:coverage`. A split by *proven* · *automatable half proven* · *coverable,
not yet built* (= 4.1's remaining work) · *permanently device-owed* (= the pass Jason runs).
**2026-08-17: 24 · 9 · 74 · 24 — the device pass is 50 rows.** ⚠️ Read the figures from the generated file,
never from a doc quoting them: this line alone has been stale twice. ⚡ **The headline has gone DOWN twice
and that is the instrument working** — 4.1.9c stopped counting declarations as passes, and .7.5's
re-verdict moved 10 rows out of the device pass without adding one to *covered*. Rationale + scans → log.

✅ **.1–.6 (2026-08-14)** the instrument · ✅ **.7 (2026-08-17)** the XCUITest target, springboard reach
proven and the a11y audit mapped. Detail + every scan → log.

**Exit:** `coverage-split.md` answers 🎯's question as a derived number — how much of the device checklist
the lane will carry, how much it carries today, and the residual that is permanently a human with a phone.

⛔ **[.7.5] FIVE ROWS STAY `[D]`, and the reasons are forward guidance.** Reach was proven; these need
capabilities that were **never probed**. **§5.4 StandBy is PERMANENT** — *"put the phone **on a charger**"*
is physical state a simulator has no concept of. **§5.1** (widget gallery) · **§5.3** (Lock-Screen
Customize) · **§6a.2** (Island long-press, needs a 15/16 Pro sim) · **§10.3** (Stage Manager drag) each
need their own probe first. ⚠️ **The three `[A]` rows also stay `[A]`** — `typeKey` is unproven here, and
with Appium declined that letter is now a placeholder for a ⌘-key probe, not a plan.

⚠️ **[.7.1 risk note] The app target does NOT depend on the test bundle** (the direction was inverted on
the first pass and the pre-flight caught it), so `xcodebuild build` is unaffected — only `xcodebuild test`
reaches the new target. That is what keeps .7.4 from being able to red the whole lane.

⚠️ **The verdict column is a CLAIM ABOUT WHAT IS POSSIBLE, and this lane has been wrong about that
repeatedly** — the audit's own ⌘-key correction, `~/.maestro`'s 1m29s that was 22s, "no hierarchy dump",
ccache's two wrong mechanisms. A `[D]` that is really an unproven `[M]` silently keeps a check on the
manual pass forever. Seeded verdicts are a **hypothesis per row**, not a settled split.

⚠️ **[4.1.6a.2 after-scan] Two verdicts are CONDITIONAL on an item that is not built.** `§B3.6` and
`§11.7` are `[M◐]` only if RN's `AccessibilityInfo` observes the `simctl` Reduce-Motion write — the source
audit's own "least certain" probe item. **If 4.1.7 finds it does not, both fall back to `[D]`** and the
floor rises by two.

**Iterate with `-f device=ipad`** — skips the ~10-minute iPhone suite; flow-only edits hit the `.app`
cache. [D30]'s input already does it, no workflow change. ⚠️ Any `src/**` change busts that cache — one
~17-min rebuild each way. 4.1.5.2's and 4.1.5.3's before-scans (four refuted premises, incl. "More's
two-column" which was never specified) → log.

⚠️ **[4.1.4c + 4.1.5.2 after-scan] The instruments stay in the app, and must be verified to LEAVE.**
`probeCoachMark`, the `coach-probe` readout, `suppressorReasons` and **4.1.5.2's `RING_AUDIT`** are all
`qaEnabled()`-gated, so they vanish with the Phase-6 `QA_TOOLS` flip — **confirm that in the flip's `git
grep`, or a diagnostic ships.** ⚠️ The ring readout is deliberately **not** a11y-hidden (Maestro reads the
accessibility tree), so until the flip a QA build speaks one extra line during §11's VoiceOver pass.

⚠️ **[4.1.4c after-scan] Flow 01 now asserts a coach mark**, so the seed flow every other flow depends on
is coupled to the discovery layer: if the mark regresses, 01 reds and takes the suite with it. Accepted —
`optional:` / `runFlow when:` are unproven here, and unconditional is honest since the mark is
deterministic. A probed `runFlow when:` would decouple it → 4.1.11.

⚠️ **[4.1.4c after-scan] An undrawable mark stays `active` and blocks every other mark for the session**
(`show()` refuses while anything is active). Pre-existing, and fix ③ removed the only known cause → the
cohesion gate.

⚠️ **[3.7.B.2] flow 07's onboarding walk now crosses one extra field** — `CompletionStep` gained the
optional name input above `"See My Plan  →"`. Nothing asserts it, but the CTA sits lower on a small sim;
if 07 regresses at that tap, this is why.

**Exit** *(🎯 "confident enough to move on")* — unchanged, → log.

---

## ✅ CLOSED — Phase 3.7, the fold-in block

✅ **Wave A** (A.0–A.10) and ✅ **Wave B** (B.0–B.4), both closed 2026-08-11. Wave C merged into the
audit gate. Detail + both wave-level after-scans → log.

⚡ **The number both waves produced, and the reason B.0 existed: a pre-authored ledger item is wrong
about as often as it is right.** Wave A — of 14 items, **5 did not exist and 4 more were materially
misdescribed** (one *inverted*). Wave B — of 4 items, **1 refuted outright, 1 half-shipped already, 1
wrong in 3 of its 4 stated premises, 1 clean.** The before-scan is now paid for twice.

⚠️ **A0.4** (payoff-schedule device re-verify) and **A8.4** (the Siri phrase work — incl. the
load-bearing `\(.applicationName)` check) stay device-owed → the checklist.

---

### ⏭ Then, in order

1. **3.5.7 — the marketing embed** *(🎯 needs hosting + the privacy stance)*
2. **The audit gate** — whole-app cohesion + best-in-class + wording/voice *(Wave C merges in here)*
3. **Phase 5** (data continuity, ship-blocker) → **5.5** (repo consolidation) → **Phase 6** (launch)

### ⏸ Waiting on Jason

- 🎯 **2026-08-17 — "COVERABLE, NOT YET BUILT" MOVES TO PHASE 6, AND THE LABEL WAS HIDING TWO JOBS.** Of
  the 74, **~67 have never been verified by anyone** — no automation stamp, no human tick. So it was never
  automation debt over work a human already does; it was **verification debt**. ① *verify the check at all*
  is a launch obligation → Phase 6's device pass. ② *automate it so it stays verified* is an investment
  whose payoff is v1.8 onward. Calling all 74 "4.1's remaining work" asserted that ② must precede ①, and
  that is what kept the CodeMagic build blocked. ⛔ **In Phase 6 they are rows a human TICKS — automating
  any of them is optional and NON-GATING**; arriving there as automation work would delay submission for a
  payoff that lands after it. ⚠️ Cost, stated: the v1.7 human pass grows **50 → ~105** (derived, not
  measured — `audit:coverage` can produce it exactly). ⛔ **4.1.10's 15 rows are the EXCEPTION and stay in
  4.1** — see its row.
- ⛔ **The CodeMagic build is BLOCKED ON 4.1, deliberately** — 🎯 Jason 2026-08-14: *"I'm not cutting the CodeMagic build until we have a definitive checklist that covers everything that Maestro and Appium can verify. That's the whole point of 4.1."* Cutting it early spends a device pass on rows the lane is meant to absorb, then needs a second pass. **Phase 3.5's device pass is downstream of 4.1's exit, not parallel to it.**
- **[D2]** `minimumPaidThisCycle` ownership — gates B4. · **[D3]** Money hero language. · **[D1]** Control Center (rec: stay deferred).

### ⚠️ Open defects

- **⛔ [4.1.7 after-scan] THE DRIVER-TIMEOUT FIX HAD BEEN APPLIED PIECEMEAL **FOUR** TIMES — now a gate.**
  Raised 240→420s on the iPhone suite (run 31646289268), the iPad tier kept 240s and paid the identical
  cost a day later (31822453981), **the 4.1.1 probe lane still held 240s**, and 4.1.7's own Reduce-Motion
  step shipped with **none at all** — I nearly repeated the exact pattern I logged as a lesson this
  morning. All four aligned; `lint:lane` now fails if any `maestro test` step diverges. ⚡ *When a fix is
  written into one step of a symmetric set, the SET is the unit of the fix.*

- **⚠️ [4.1.7 after-scan] The ⌘-key probe will also run on the IPHONE tier, and its output there is not
  evidence for §10.** Both tiers run the same bundle, so `cmdKey` lines appear twice. iPhone tells you
  whether `typeKey` *delivers*; only the iPad's lines may move §10.5/§10.6. Reading the iPhone copy as
  coverage is the "reach is not coverage" trap in its newest costume.

- **⚠️ [4.1.7 after-scan] Wall-clock headroom shrank.** The iPad tier gains a probe (~1–2 min) and the
  iPhone tier gains two extra driver starts (~40s each, for `09` and the Reduce-Motion flow). iPad was
  18m02s against iPhone's 24m49s, so `device=both` should still cost `max` — but the margin is now ~5
  min, not ~7. If the iPad tier ever overtakes, the split stops being free.

- **⚠️ [4.1.7 after-scan] `11-reduce-motion.yaml` is a MEASUREMENT flow, like `i01`** — it declares no
  `COVERS:` and must not be counted at 4.1.11's re-derivation. `lint:selectors`' flow count is now 15
  files, of which two measure rather than cover.

- **⭐ [4.1.7 before-scan] THE ANCHOR DEFECT IS DIAGNOSED, AND FLOW `09`'s OWN HEADER PREDICTED IT.** It
  reads: *"RUNS LAST AND CLEARS STATE… **anything added after this must re-seed.**"* The XCUITest probe
  was added after it and does not re-seed, so `app.launch()` met a fresh install with no tab bar — the
  `rendered=false` exactly. ▶ Fixed by ORDERING, not by a new capability: `09` moved into its own final
  invocation, and everything needing an onboarded app (the probe, the Reduce-Motion readout in More) now
  runs before it. ⚠️ Costs one extra driver start (~40s); the chain is unchanged because `09` opens
  `clearState: true` and was always self-contained. **`lint:lane` now encodes the rule** so the next
  addition cannot repeat it. ⚡ The iPad probe A/Bs it for free — that tier never ran `09`.

- **⛔ [run 32037021903] THE A11Y AUDIT'S `findings=0` IS NOT A CLEAN BILL — the anchor guard fired on its
  first ever execution.** `PROBE a11yAnchor id=tab-today rendered=false elements=58`, then four
  `findings=0`. The guard shipped at .7.4h *specifically* so a zero could be told apart from an audit of
  an empty screen, and the first run that could exercise it says **the app was not showing Today.**
  ⚡ Springboard reach re-confirmed in the same run (`reachable=true elements=215`), so this is not a
  broken probe. ⚠️ **Hypothesis, NOT a diagnosis** *(Law IV — a mechanism that arrives with a finding still
  needs measuring)*: the probe runs after the suite, and flow `09` is terminal and **clears state**, so the
  app it relaunches may have no tab bar to find. 58 elements says *a* screen rendered. ▶ Cheapest next
  step: have the probe print the frontmost screen's identifiers before auditing, or run it before `09`.
  ⛔ **Until then no a11y row may be marked covered from this probe** — that is exactly the overstatement
  4.1.9c exists to stop.

- **⚠️ [run 31812114150] Two selectors are UNESTABLISHED, and both are filed rather than guessed.** ① **Which marker component renders at walkthrough beat 5** — the flow asserted `guardian-example-marker` (`PaydayGuardianCard.tsx:225`) and it was absent, while the `.*Example money.*` TEXT assertion passed; the other candidate is `example-canvas-marker` (`ExampleCanvasMarker.tsx:61`). §11.9 is satisfied by the text either way. ② **The demo persona's Money-tab debt names** — `.*Visa.*` came from a screenshot of the demo's TODAY tab and does not match Money, so **§12.0.7 is unclaimed**. Both are answerable from one frame each; `09` now captures `demo-explore-03-money-tab` for exactly that.


- **⚠️ [T5 after-scan, 2026-08-14] §12.6.1's arrival announcement may not exist anywhere.** The row expects VoiceOver to say *"Example money. This is a demonstration with sample figures."* on entering the demo. `ExampleCanvasMarker` carries **only** `accessibilityRole="header"` and its visible text — **no `accessibilityLabel`** — and the dock's label just lost its *"Example money."* prefix as a §12.5.3 duplication fix. So the disclosure now has one owner visually and possibly **no owner in the accessibility tree**. ⚠️ Not a regression from that fix — the sentence §12.6.1 quotes was never in either component. → **the wording/voice gate**, with [D6]'s "exactly one place" rule, since it is a question of which surface says it rather than a bug to patch.

- **⚠️ [D33 residual, 2026-08-14] Beat 5's landscape crop splits *"$200 · Your line"* from the bar it labels.** ⛔ **My "nudge the scroll offset" fix was refuted before it was built** — `TutorialOverlay` measures (`measureInWindow`) and never scrolls, so no offset exists to nudge. The ring is drawn where the subject *is*, and the subject is a card taller than the ~834pt landscape viewport, so the crop is simply the viewport edge. Moving it means **scrolling the Today page to a different position at that beat** — a different change, a different owner, and a composition call rather than a defect. §11.16 already PASSES ([D33]); this is polish → **the audit gate's best-in-class pass**, with the dark-theme frame from 4.1.5.6 as its second data point.

- **⛔ [2026-08-14] The iOS driver stall has now happened TWICE, and the built-in retry does not clear it.** Run `31740873224`: *"iOS driver failed to start and NO flow ran — retrying the suite once"*, and the retry failed too — **zero iPhone flows ran**, after paying the full build. First seen at run `31646289268`. ⚡ **Not the app**: the iPad tier ran **4/4 in the same job**, including `01`'s full onboarding and `05`'s walkthrough. ⚠️ It is indistinguishable from a real red in exit code and identical in cost, so it can burn a whole batch — **check for that warning line before diagnosing any iPhone-tier failure.** → 4.1.11.

- **⛔ [4.1.5.3 before-scan] The `trajectory-scrub` coach mark SURVIVES a route push — ⚡ REPRODUCED ON WEB 2026-08-13, locally, no CI cycle.** Seen first on the iPad (`ipad-04` → `ipad-05`, the card lying across the More settings list); `probe-mark-route-push.spec.ts` then reproduced it in Chrome. **Cross-platform product defect, not an iPad artifact** — every user who opens More while a mark is up sees a hint about the Progress chart over their settings. ⚡ Reproducible at all because `trajectory-scrub` is offered **unconditionally** (`progress.tsx:73`), unlike `debt-row-actions`, whose iOS-only gate cost five CI cycles. ⚠️ **Mechanism still NOT diagnosed** — `CoachMarkLayer` is where five were asserted and four refuted. The reproduction is `test.fail()`, so it reds the day it is fixed. **→ recommended as the next active build.**
- **⚠️ [4.1.5.3 before-scan] That mark is drawn in WINDOW space on the expanded iPad**, so it starts at the window's left edge and lies **across the sidebar rail**, while its subject (the payoff-trajectory chart) is entirely inside the content column. That is §11.15's coordinate-space failure in a **different component** — `CoachMarkLayer`, which 4.1.5.2's audit does not cover. ⚠️ Whether a full-window callout is *wrong* here is a composition call; that it sits outside its subject's column is not.

- **⚠️ [4.1.4c before-scan] `SectionList`'s `index` is per-SECTION, so `debt-row-actions` can register TWICE.** `money.tsx:377` wraps `index === 0`, which is also the first **PAID OFF** row — two `TutorialTarget`s sharing one registry key, and the Map keeps whichever laid out last. The comment at `:374-376` anticipated exactly this hazard for rows and missed sections. **Latent** (needs a paid-off debt; the failing flows have none), so **not** the mark's current defect and deliberately not fixed on the probe run. One-line scope: gate on the active section too.
- **⚡ [4.1.4c before-scan] This mark is unobservable to EVERY automated surface except an iOS sim run** — `Platform.OS === 'ios'` (`money.tsx:259`) puts it out of reach of the web e2e and the app-layer runner, and `phase35-themes.shot.ts:106` already records that. It is why the defect shipped, and it is the argument for instrumenting rather than guessing a sixth time.
- **⚡ [4.1.3] A pref changed and then force-quit within 500 ms is LOST.** `persistence.ts:14` debounces the autosave by 500 ms, and `flushPendingSave` (`_layout.tsx:103`) only fires on AppState *background* — a force-quit sends no such event. Narrow, but it is silent data loss on a setting the user watched confirm itself on screen. **Measured, not theorised:** it is what made flow 08's coach-mark reset evaporate across a `killApp`. Fix is to flush critical prefs immediately rather than on the debounce → **Phase 5** (data continuity), which owns durability.

- **A transient `$790` on Today's arrival** during the demo — a half-rendered Guardian card for ~0.5s at beat 2. Now **user-facing** under [D21], not just a store-video concern. Settle before the asset is cut.

**Gate:** `validate:release:rn` — **167/167 + tsc clean on BOTH trees** *(158 → 167 across Wave B)*, zero `error-context.md`. CI runs
it on every push. ⚠️ It gained `typecheck:core` + `typecheck:rn` on 2026-08-11; before that it ran no
`tsc` at all.
**Env:** `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` + `serve apps/rn/dist -l 4319 -s` · e2e `npm run test:e2e:rn`. ⚠️ Capture-pipeline and H.264-inspection recipes → log §"Working notes".

---

## Phases — status

| Phase | Scope | Status |
|---|---|---|
| 0–3 | Design foundation · surface · premium substance · delight + native | ✅ COMPLETE |
| 3.5 | Interactive tutorial + bounded demo | **BUILD COMPLETE**; 3.5.7 + the device pass remain (below) |
| 3.7 | Fold-in block (ledger clearance) | ✅ COMPLETE 2026-08-11 (Waves A + B; C merged into the audit gate) |
| — | Whole-app cohesion + best-in-class + wording audit gate | after 3.7 |
| **4** | **Quality (test harness)** | **▶ ACTIVE.** ⭐ iPhone lane **8/8** 2026-08-13. Next: **4.1.5** (the iPad tier's real checks) |
| 5 | Data continuity + cutover | 🔒 ship-blocker, upcoming |
| 5.5 | Repo consolidation | before the release gate |
| 6 | Launch-ready **+ the ~59 coverable-not-built rows, as DEVICE-PASS work** *(🎯 2026-08-17)* | final |

**Phase 0–3 detail → the log.** Canonical specs → Reference docs at the foot of this file.

### ⚠️ Standing constraints

- **⛔ BATCH THE NATIVE LANE — it is `workflow_dispatch` + tags ONLY, and stays that way.** 🎯 Jason
  2026-08-13: *"It feels like we're waiting more than designing"* · *"e2e running on push is fine. We just
  need to not kick off the manual Maestro build every time."* Measured that day: **~12 native dispatches,
  several cancelled, for about three runs' worth of distinct information.** `web-e2e` on push is the right
  fast gate; `validate:release:rn` is **168/168 in ~6 min locally** and catches nearly everything. The
  native lane is ~22 min and its unique value is device-specific — **batchable by nature.** Run it at a
  batch boundary chosen by a human: the end of a numbered item, or a change only it can verify
  (`.maestro/**`, the workflow, native config). ⛔ **A branch-push "rot guard" was added and reverted the
  same day** — it was mine, it spawned a macOS job per commit, and its `paths:` filter also silently broke
  the release-tag trigger. ⚠️ The rot risk it existed for is real and now unguarded → **a nightly at
  4.1.11**, which does not tax a working afternoon and also catches out-of-repo rot a path filter never
  could.

- ✅ **STANDING PERMISSION, 4.1 ONLY (🎯 Jason 2026-08-14):** *"You have standing permission to continue without requiring my input on every step for 4.1 only… The same goes for standing permission to push and dispatch when it makes sense."* ⚠️ **The boundary is real** — Phase 3.5, 5, 5.5, 6, the audit gate, and any product/content call (e.g. [D33]'s crop, beat subjects, copy) still come to Jason. Batching judgement still applies to dispatches; the permission removes the ask, not the discipline.

- **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT (3.2.x ships broken) · `react-native-ios-utilities ^5.2.0`.
- **v1.7 ships as ONE release.** Nothing launches until Phase 6 is done and Jason is satisfied.
- **`QA_TOOLS = true` ships in TestFlight and MUST be flipped false before submission** (`git grep QA_TOOLS`). It is what makes the demo reachable at all.
- **Never push to `release/v1`** — it is the default branch and is gated on a live, approved version.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

---

## Phase 3.5 — what is LEFT

The build is complete (tutorial · bounded demo · coach-marks · capture pipeline). **The phase is not
signed off, because its OUTPUT is not final:**

| | Item | State |
|---|---|---|
| 1 | **3.5.7 — web-embeddable marketing demo** | ▶ **ACTIVE 2026-08-14 as the parallel track** (4.1 keeps precedence; this fills the waits). ✅ [D32] settles hosting + privacy. ⛔ **The "debt-free-date defect" blocker is STALE** — no live defect exists; the only match is filed *"the cohesion audit, not a defect"* and its two relatives are closed. Decomposed below |
| 2 | **The device pass** | `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 walkthrough · §12 demo · §13 coach-marks, against the fresh build. ⛔ Downstream of 4.1's exit, not parallel to it. ⚠️ **[OPEN, raised 2026-08-17] Is this still a SEPARATE pass from Phase 6's?** Today's call sent the 74 coverable-not-built rows to Phase 6 as human-ticked work, and they span §11/§12 among others — so the two passes now overlap and nobody has said whether 3.5's simply becomes part of Phase 6's. Deciding it late means running some rows twice |
| 3 | **3.5.9 — reinstate the demo ✅ DONE 2026-08-10** | [D21] reverses [D19]. `isDemoReachable()` no longer rides `QA_TOOLS`; both doors restored and now **tested** — nothing covered them before, which is how they were pulled unnoticed. Log: 3.5.9 |
| 5 | **3.5.10 — the INTERACTIVE demo ✅ DONE 2026-08-11** | 🎯 **[D23]**: the demo is now two runs. **`explore`** (a user: live tabs, no script, exit on the marker row) · **`scripted`** (the App-Preview + 3.5.7's embed only). One artifact had been doing both jobs and the video's requirements won. ⚠️ `useInBoundedRun` was deliberately **not** forked — a separate `useNavigationHeld()` answers the other question. Gate 158/158. Log: 3.5.10 |
| 4 | **The App-Preview asset must be RE-SHOT** | the pipeline is proven and cycle 14 approved, but the submitted file is shot after the UI settles → Phase 6 |

**Division of labour, now settled:** demo = BEFORE you commit (Welcome + paywall, sandboxed, terminal
exits) · walkthrough = AFTER onboarding, on your own money.

#### ▶ 3.5.7 — the embed _(the PARALLEL track; 4.1 has precedence and this fills its waits)_

⚠️ **This is the one decomposed section on the doc.** 4.1.6a.7's closed 2026-08-17 and collapsed; 4.1's
remaining steps are single rows in its table. 🎯 set the precedence on 2026-08-14: 4.1 first, this fills
its waits.

| # | Step | State |
|---|---|---|
| **.1** | **`Slider` reports its value on web** — the WCAG AA blocker | ✅ **DONE 2026-08-14.** `a11yAdjustableValue` in `utils/a11y.ts`; `aria-value*` is the form RN expands to BOTH platforms, so it is one rule in one place. Explicit e2e assertions — `a11y-axe` cannot see this class |
| **.2** | ~~The embed build FLAG that omits analytics~~ | ⛔ **COLLAPSED 2026-08-14 — nothing to omit.** Verified across 7 surfaces: the funnel has **no sink and no SDK** (closed literal union), Sentry is `.web.ts` no-op, RevenueCat is stubbed, `expo-updates` absent, CanvasKit `locateFile`s to the local wasm, no CDN host in `dist/`, and the only absolute URLs are two *link targets*. A flag would add a second mechanism where a stronger one already holds |
| **.3** | ⭐ **Storage discipline** — `sessionStorage` only | ✅ **DONE 2026-08-14.** One backing binding, four call sites, gated on the bundler-inlined `EXPO_PUBLIC_EMBED` so no switch survives in the artifact. Read lazily inside the existing guards — an eager `sessionStorage` touch throws in private mode and sandboxed iframes, which is exactly where an embed lives. Both modes proven; app default unchanged |
| **.4** | ⭐ **The zero-egress Playwright gate** — all three [D32] claims, in `validate:release:rn` | ✅ **DONE 2026-08-14.** Own config + own build (`EXPO_PUBLIC_EMBED` is inlined, so a spec in the main suite would test the artifact that does **not** ship). ⛔ **`--clear` is load-bearing: Metro's cache does NOT bust on an `EXPO_PUBLIC_*` change** — measured, and without it the flag is advisory. **Non-vacuity proven**: the plant reds test 2 only. ⏱ 1.9m cold |
| **.5** | **Embed entry** — the `scripted` run as the default route | ✅ **DONE 2026-08-17.** `EMBED_DEMO` in `qa.ts` → `DemoAutoEntry` (the renamed `CaptureAutoStart`, now serving BOTH self-entering builds — a second starter would have been a second definition of "entering the demo"). Two new specs in the embed gate, **non-vacuity proven** on a planted regression: they red, zero-egress stays green. App e2e 169/169 unaffected |
| **.6** | **The a11y state fix** — the two controls in the embed's surface | ✅ **DONE 2026-08-17.** `a11yChecked`/`a11ySelected` in `utils/a11y.ts`; `CheckCircle` → `aria-checked`, `SegmentedToggle` → **`radiogroup`/`radio`** (the role is load-bearing — see below). Two explicit e2e assertions, **non-vacuity proven** on a planted revert; a11y-axe 10/10 |
| **.7** | **The embed's exits → ONE App Store CTA** *(🎯 approved 2026-08-17)* | ▶ **NEXT.** Both dock exits collapse to a single outbound link; the terminal beat says so. ⚠️ Its WORDS are owed to .9, and ⛔ **there is no Debt Planner App Store URL in the repo** (only Freedom's, in `ecosystem.ts`) — the link target is a real prerequisite, not a copy detail |
| **.8** | **GitHub Pages deploy** of `dist` | ⛔ blocked on .7 |
| **.9** | **[DECISION] the privacy wording** — 🎯's call, and now the CTA's words with it | ⚠️ *"financial data never leaves your device"* is literally true; *"100% private"* overclaims if read as "no server logs anywhere" |

**Exit:** a public embed whose privacy claim is enforced by a test that runs on every push, not asserted
in prose.

⛔ **[.5 after-scan] THE EMBED'S TWO EXITS BOTH LEAD SOMEWHERE WRONG — 🎯 SETTLED 2026-08-17, now .7, and
it blocks the deploy at .8.**
The dock's exits are `exitDemo('/onboarding')` *("Start my real plan")* and `exitDemo('/paywall')`
*("Unlock Premium")* — approved 2026-08-06 **for the app**, where both are right. In a public embed:
① onboarding is a **financial data-entry form inside a marketing iframe that discards what is typed**
(sessionStorage only, by .3's own design) — inviting it is worse than offering no exit at all;
② the paywall's purchase path is **stubbed on web** (verified at .2), so it cannot transact.
▶ **Rec: in an embed both collapse to ONE outbound CTA to the App Store**, and the demo's terminal beat
says so. ⚠️ Wording is 🎯's and belongs with **.7**, so these settle together.

⚠️ **[.5 after-scan] The deferred [.1] a11y question is now ANSWERED, and 2 of the 3 controls are in the
embed's public surface.** The scripted arc is `/money` → `/` → `/progress`: **`SegmentedToggle`** (Money
×2, Progress's `CashFlowSection` ×1) and **`CheckCircle`** (Today's Required/Recommended action cards)
both render there; **`RadioGroup` does not** (onboarding + a sheet). ✅ **Both fixed at .7 → now .6** —
.1's own argument was "a public WCAG failure", and the deploy is the moment it becomes public.

⚡ **[.5 after-scan] MEASURED — a build flag is only dead-code-ELIMINATED when it is read in the SAME
module.** `EXPO_PUBLIC` appears **0** times in either built bundle (Metro inlines it), and the storage
adapter's same-module ternary is gone outright (`dist` 0 × `sessionStorage`, `dist-embed` 0 ×
`localStorage`) — but `qa.ts`'s cross-module `CAPTURE_DEMO` **survives 6×** as a constant-false check.
Both are unreachable at runtime; only one is absent from the artifact. ⛔ So `createAdapter.web.ts`
**keeps its own local `EMBED` constant** rather than importing `EMBED_DEMO` — the tidy-looking merge
would have quietly broken 3.5.7.4's proven *"no switch survives in the artifact"*. An agreeing copy is
usually a defect; this one is a measurement.

⛔ **[.6 after-scan] THE CLASS IS 13 SITES IN 11 FILES, NOT "three more controls" — and 11 remain.**
Measured: `selected` ×7 (`paywall`, `PaydayCaptureSheet` ×2, `SaveForItSheet` ×2, `RadioGroup`,
`SegmentedToggle`) · `checked` ×2 (`RecoveryPlanSection`, `CheckCircle`) · ⚠️ **`expanded` ×4**
(`money.tsx`, `TrajectoryChart`, `RequiredActionsCard`, `TimelineLedger`) — a state key .1 never
mentioned, and every disclosure carrying it announces nothing about being open. **Only the 2 in the
embed's surface are fixed.** ▶ The remaining 11 → the audit gate, with [3.7.B.4]. ⛔ **The `lint:rn`
rule that would close the class is deliberately NOT added yet** — extending `no-restricted-syntax` to
`accessibilityState` reds all 11 at once, so it lands WITH the sweep, exactly as the existing rule's own
comment prescribes (*"a rule, not a convention, because the convention failed"*).

⚡ **[.6 after-scan] ADDING `aria-selected` WOULD HAVE LOOKED LIKE A FIX AND CHANGED NOTHING.** It is only
honoured on `tab`/`option`/`row`/`gridcell`/`treeitem`; on the `button` role `SegmentedToggle` used, it is
ignored — so the control would have carried a correct-looking attribute and still announced no state.
⛔ And `aria-pressed`, the right web attribute for a toggle button, is **not in RN's aria vocabulary**
(measured against RN 0.85's `ViewAccessibility.d.ts`: checked/selected/expanded/busy/disabled — no
pressed), so it would be web-only and re-open the asymmetry from the other side. **The role had to change
too**: a 2–3 option single-choice set is a `radiogroup`. ⚠️ `tab` was rejected — true of the two view
switchers, false of the Snowball/Avalanche strategy picker, and one primitive cannot hold two semantics.

⚠️ **[.1 before-scan] The same defect class is UNFIXED on three more controls.** `CheckCircle`
(`accessibilityState={{ checked }}` → no `aria-checked`, already filed as [3.7.B.4]), plus `RadioGroup`
and `SegmentedToggle` (both `accessibilityState={{ selected }}`). ⚡ **The argument that made the Slider a
3.5.7 blocker applies to any of them that appear in the embed's surface** — a public WCAG failure. Not
folded in: the Slider is the stated blocker and the rest belong to the audit gate, which already owns
[3.7.B.4]. **Re-check at .5 once the embed's actual surface is known.**

**Restraint that still governs the tutorial/demo:** no Tier-3 spectacle, confetti or sound · no
gamification chrome · Recovery stays a glimpse · the in-app tutorial stays ≤7 beats.

---

## Audit tooling — the instruments the gate runs ON _( [D31] )_

_Built during 4.1's CI waits, not instead of it. Each one turns an expensive read into a cheap lookup._

| | Instrument | State |
|---|---|---|
| **T1** | **`npm run audit:strings`** → `docs/audits/strings-inventory.md` — every user-facing string, by file, **plus the cross-file duplicate sweep**. The wording gate's input. | ✅ **DONE 2026-08-12.** 793 copy · 210 cross-file duplicates · 923 unclassified, listed not dropped. Detail + both scans → log |
| **T2** | **`npm run lint:copy`** — a NEW copy phrase of **20+ chars** in two files fails `validate:release:rn`. ⚡ **The first audit finding to become a GATE rather than a report** ([D31]: a finding that becomes a test is paid for once) | ✅ **DONE 2026-08-12.** 11 baselined via `-- --update-baseline`, following the `webkit-flex-controls-baseline` precedent. ⚠️ Threshold **measured** (74 dups at any length → 9 at ≥20), and **the gate was proven to FAIL** on a planted duplicate before being trusted. Scans → log |
| **T3** | **The proxy-gate sweep** — every ternary that selects between COPY, printed next to the condition that selects it. One question per row: *does the gate establish what the words assert, or merely correlate?* | ✅ **DONE 2026-08-12.** **77 of 179** gates carry copy. ⚡ **Validated by reproducing the defect it was built from** as one row: `DebtSheet.tsx:238 · prefill · "Add from scan" / "Add a debt"`. Folded into T1's script — a second walker would be "two places, one rule". Scans → log |
| **T5** | ✅ **DONE 2026-08-14 — `npm run lint:a11y-collapse`, in `lint:rn`.** ⭐ **It found a SHIPPED defect on its first run:** `DemoDock`'s `accessible` wrapper collapsed **both dock exits** out of existence for VoiceOver, so the app satisfied §12.6.4 ("one utterance") by breaking §12.6.3 ("you can reach the dock's two exits"). ⚡ **The rows were never in conflict** — the grouping only ever needed to cover the TEXT. Fixed by moving `accessible` down; the label's duplicated *"Example money."* prefix dropped with it (§12.5.3). Proven both ways before trusting, per T2. Detail → log |
| **T4** | **`npm run audit:surfaces`** → `docs/audits/surface-inventory.md` — per screen, TRANSITIVELY, which `ui` primitives and which money formatter it reaches. The cohesion gate's input | ✅ **DONE 2026-08-12.** 15 surfaces · **4 reach BOTH `formatCurrency` and `formatWhole`** *(C1 as data, not a hunch)* · 6 single-use primitives *(C7)*. ⚠️ Reachability, not rendering. Scans → log |

⛔ **CORRECTED 2026-08-12 by W1's before-scan — "210 duplicates" overstated the wording gate's input by
~2×.** Measured from the JSON sidecar: **210 cross-file duplicates, of which 110 are copy-bearing and 100
are not copy at all** (`space-between`, `decimal-pad`, `chevron-right`, `/paywall`, `optional_goal`…).
⚡ The cause is a one-line inconsistency inside T1: the **T2 gate** filters `bucket === 'copy'`
(`strings-inventory.ts:317`), the **report section** does not (`:292`) — and the script's own comment at
`:389` already states the rule it breaks (*"reuses one classification instead of inventing a second
heuristic"*). The 928 unclassified still stand as a classification pass.

✅ **W1 — the duplicate-copy triage. CLOSED 2026-08-12.** Report scoped to copy (110 of 210) · triaged
→ [`2026-08-12-duplicate-copy-triage.md`](audits/2026-08-12-duplicate-copy-triage.md) · 🎯 all four
clusters extracted into `paycheckForm.ts` + `obligationForm.ts`. Fixed a **shipped** defect (`one-time`
had two user-facing spellings). Copy dups **110 → 83**, copy sites **794 → 740**, T2 baseline **11 → 5**.
Detail + both scans → log.

✅ **W2 — the classification pass. CLOSED 2026-08-12.** The `copy` bucket is now a defensible scope claim:
unclassified **946 → 346**, copy **740 → 826**, T3 gates **77/184 → 90/139**, every exclusion a stated rule
and every promotion read at its site. ⚡ Verifying by **diffing both directions** caught two false negatives
the counts hid. Detail + both scans → log.

## Audit gate — whole-app _(after 3.7, before Phase 5)_

**Wave C's coherence sweeps land here:** C1 cents-formatter · C2 gold usage · C3 Money hero language [D3] ·
C4 paywall copy · C5 chart VO labels · C6 iPad More two-column · C7 dead code (`ProgressRing`/
`MilestonesRow`, orphaned `guardianIntroSeen`, `FormSheet.headerAction`) ⛔ *`computeStreak` came OFF this
list at B.3 — [D27] ported it, so it now has a live RN reader* · C8 web scan entry · C9 `router.back()`
cold-entry sweep · C10 doc disambiguation of the overloaded "3.5.3.x".

- [ ] **Cohesion** — the same adversarial rigor for the ENTIRE app (Phases 0–3.7), criterion: does every element work TOGETHER? Cross-surface voice · visual · motion · numbers.
  - ⚠️ **[3.7.A.3 after-scan] `selectWhatIf*` bypasses the debt-free-date funnel** — it calls `projectDebtPayoff` directly rather than going through `selectDebtFreeDate`. Correct today (a deliberate alternate scenario), and a trap: **if the funnel ever gains a guard, a floor or a rounding rule, What-If silently will not have it.** Nothing to fix yet — check it here.
- [ ] **Best-in-class enhancement pass** — aspirational, app-wide: is each surface genuinely top-of-class, and what makes it unforgettable? Benchmark vs category leaders; restraint, not fireworks.
  - ⚠️ **[4.1.3 after-scan] The onboarding debt step hides its own fields behind the keyboard.** With the pad up on a small screen, balance / minimum / APR are clipped out of `OnboardingLayout`'s ScrollView by the sticky CTA stack — the user must scroll, unprompted, on the app's **first data-entry screen**. The KAV's own comment shows only the CTA case was considered; the standard remedy (`automaticallyAdjustKeyboardInsets`, or scrolling the focused input into view) is absent. Measured on the sim, severity to be judged on device.
- [ ] **Wording / voice** — every user-facing string, both tiers, all states, against the house voice. Absorbs Wave C's copy items.
  - ⚠️ **[W2] Guardian first-person voice is UNCLASSIFIED, so this gate's own input cannot see it** — *"Payment logged — I updated your balance."* and *"Payday landed — I rolled your plan forward…"* sit in `other`. The house rule (the Guardian is the sole first-person "I") is exactly what is checked here.
  - ⚠️ **[W2] `paywall.tsx:59/75`'s `"one time"`** — price prose vs. the recurrence option label. A judgement, not an obvious defect; it never reached W1's duplicate list.
  - ⚠️ **[W2.5] `EXAMPLE_MONEY` exists as an exported constant and THREE sites bypass it** (`TutorialOverlay.tsx`, `DemoDock.tsx:57`, `tutorialPath.ts:242`; `ExampleCanvasMarker.tsx:14` owns it). All four agree today. The clean fix moves the constant to an RN-free module — `tutorialPath.ts` runs under `tsx` and cannot import a component — so it is a layering change, not cheap polish.
  - ⚠️ **[3.7.A3.1 after-scan] Sweep every Guardian affordance for a PROXY gate.** A3.1's defect class: an affordance that promises an **outcome** ("I'll hold a smaller safety net") was gated on a **proxy** (a cycle count), so it could promise and deliver zero. Check the siblings — `selectReserveRelease` · `selectReserveWalkback` · `selectRiskAcknowledgment` · `selectTrialConversion` · `selectGuardianProofOfWork` — for the same shape: **is each gated on the thing it claims, or on something that merely correlates with it?**
  - ⚡ **[3.7.A3.6 after-scan] …and for a CAPPED OUTCOME — the second shape of the same family.** Not a proxy gate: the gate is right, but the **resource is bounded**, so the affordance delivers less than it promised. `selectTightTopUp`/`coverFromSavings` claimed "holds your line" while `Math.min(gap, balance)` capped the draw short (fixed in A.6 via `holdsLine`). Sweep for the pattern: **any copy asserting a completed outcome over a value that is `Math.min`'d, clamped or floored.**
  - ⚡ **[Wave-A after-scan] "Two places, one rule" hit THREE times in one wave** — A6a (two debt shapes in one directory), A5 (the premium ternary on two screens), A3.6 (one claim in four strings). Each was fixed by extracting a single authority (`PayoffSimDebt`, `premiumKind`, `holdsLine`). Sweep for the shape: **a rule re-derived at each call site rather than owned once.** Agreeing copies are still copies — they just haven't diverged yet.
  - ⚠️ **[4.1.3 after-scan] The mis-file rescue's STRINGS are owed here.** The mechanism is fixed (the sheet no longer claims a scan on the convert path — it was gated on `prefill`, which A10 gave a second producer), but *"Moving this from Expenses. Add the balance so it counts toward your debt-free date."* is **my placeholder**, not house voice. Decide it here, with [D22d]'s "bills" vernacular.
  - ⚠️ **[3.7.B.2 after-scan] The greeting's STRINGS are owed here** *(per [D26])* — the three band words, the band boundaries as a product choice, the onboarding ask ("What should we call you? (optional)") and More's "Used to greet you on Today". Also decide whether the name belongs anywhere ELSE it is currently absent (notifications, the finale, the Guardian's address) — it is one pref and every surface can read it.
  - ⚠️ **[Wave-A after-scan] A STALE COMMENT GENERATED FALSE WORK.** `testClassifyDeferability`'s header described the opposite of its own assertions, and A3.7 was filed matching the header rather than the code — an inverted defect that would have made a discretionary purchase *less* cuttable. This is 3.5's defect class ③ ("two records of one thing, drifting") with a measured consequence. **Docs that disagree with adjacent code are not cosmetic; they manufacture defects.**

⚡ **Input from 3.5's phase after-scan — three defect classes to hunt at scale:** ① an assertion that
passes either way ② evidence cited but never committed ③ two records of one thing, drifting. All three are
**a claim kept somewhere other than where it is checked.**

⛔ **"All three audits fan out on Fable 5" is RETIRED — see [D31].** 🎯 Jason 2026-08-12: *"that's very
very expensive and eats up my session time within like 20 minutes."* The method is now: **scripted lenses
where the question is deterministic · a GENERATED artifact as the agent's input, never the raw codebase ·
cheap models for extraction, the expensive tier only for judgement on a pre-filtered set · run
out-of-session with incremental writes.** ✅ First instrument built 2026-08-12: **`npm run audit:strings`**
→ `docs/audits/strings-inventory.md`, the wording gate's input.

---

## Phase 4 — Quality

- **4.1 — the Maestro coverage lane ⏸ PAUSED at 4.1.3** *(🎯 3.7 finishes first)*. 68 of the device checklist's 127 real checks onto the free GH-Actions sim lane. ⚠️ **The native lane is RED until 4.1.3's repair is verified** — the suite had been broken since 2026-08-10 and green-by-never-running. Audit: [`2026-08-11-maestro-coverage/`](audits/2026-08-11-maestro-coverage/README.md); step-by-step + the exit criterion → log.
- ✅ Largely delivered by the RS baseline (tsx app-layer harness · core engine fuzz · RN-web e2e), green-gated by `validate:release:rn`.
- **Residual coverage:** `testEngineFuzz` → `holdbackComposition` · RN e2e for missed/stale/debt-free states + a mobile viewport · app-layer CRUD coverage.
- **e2e harness race:** `webServer` re-exports and spawns its own `serve` on :4319, racing a hand-started one. ⚠️ Corollary: `reuseExistingServer` reusing a STALE serve serves an OUTDATED `dist` — force a fresh `export:web` when adding a route.
- **⚠️ The intermittent RECURRED — twice now, and it is no longer "one":** `tutorial-invite › the tabs are held while a session is running`. 2026-08-10 in CI (1 red in 25, on a commit that changed a 4pt margin) and **2026-08-11 locally** during Wave B's close. Both times the session had ENDED when the test expected it running; both times a re-run of the spec alone passed (33/33), so it is timing, not state. Not the port-4319 hazard. **The question is what ends a session early** — and it now has two data points instead of one. → 4.1.11's reconcile, or sooner if it reds a third time.
- **Known web-e2e limits:** cannot reliably drive gestures, `SectionList` row taps, or stacked modals → prefer seed + deep-link; push gesture flows to Maestro/device.

## Phase 5 — Data continuity + cutover 🔒 ship-blocker

The migration bridge (WKWebView `localStorage` → RN storage), **proven on a real populated upgraded
device**, then cutover to the RN app as the shipping app.
- **⭐ [AUDIT GATE] Adversarial migration/upgrade audit — the EXIT gate, no cutover until green.** Every prior data shape: v1–v6 schemas · partial/corrupt/empty/huge portfolios · malformed dates & numbers · mid-migration interruption. Upgrade data-loss is catastrophic AND irreversible.
- **⭐ E2EE iCloud backup** — native iCloud/document-picker/share-sheet restore over the existing store serialization. NOT premium-gated ("never lose your data" is a baseline). ✅ Proven template: Freedom v1's `ICLOUD_BACKUP_SETUP.md` + `cloudBackup.ts`. ⚠️ Also **replace the paste-JSON import** with a real file picker (`BackupSheets.tsx` is text-only today, and its own comment calls the file flow the intended upgrade) — 🎯 Jason 2026-08-10 reported it and scoped it here.
- **⚠️ [3.7.A10.6] Run the mis-filed-obligation detector over MIGRATED data.** v1.6's Capacitor app offered **"Credit Card Payment"** and **"Loan Payment"** as one-tap BILL presets (`packages/core/constants/requiredExpensePresets.ts:10-59`, still wired into the legacy `AddExpenseModal`), so upgrading users arrive with debts already filed as expenses — and their debt-free date silently omits them. `looksLikeDebt()` + `convertExpenseToDebt()` already exist (3.7.A10.2); the bridge has to *use* them, because the Money-page hint only reaches someone who happens to open that list. **This is the largest affected population in the app.**
- **Drop two INERT persisted prefs with the migration** — `prefs.isDemoMode` and `prefs.guardianIntroSeen`.

## Phase 5.5 — Repo consolidation

- **5.5.1** remove the root Capacitor/Next surface (God-files · `ios/` Capacitor bits · `next.config` · WebView glue). Also retires `validate:release:legacy`, the root Next lint, the legacy `debtPlanner.isDemoMode` test references, and `tests/visual/*.cjs`.
- **5.5.2 [DECISION]** final repo structure — promote `apps/rn` to root vs keep the monorepo *(rec: keep it; `packages/core` is shared portfolio-wide)*.
- **5.5.3** tooling / CI / docs to the consolidated tree. Includes **splitting `DEBT_ELEVATION_LOG.md`** (~4k lines, past one-pass readability).
- ✅ **5.5.4 DONE EARLY** — `apps/rn` has its own `eslint-config-expo`.
- ⚠️ Verify scope against the CURRENT tree at switch-in — pre-authored cleanup drifts.

## Phase 6 — Launch-ready

Acquisition-grade store presence · cold-start excellence · the device-QA gate · submit.

- **⭐ [AUDIT GATE] Pre-Release Best-in-Class FINISH sweep — runs FIRST, on the FROZEN app.** Every screen · sheet · card · state · both themes · iPhone/iPad/Split-View · Dynamic Type. Lenses: truncation · copy · premium bar · theme parity · state completeness · cross-surface consistency · layout · tap targets · a11y · motion · honesty. Complements, not replaces, the after-3.7 gate.
- **⭐ [AUDIT GATE] Privacy / data-flow audit** — trace EVERY egress and prove "financial data never leaves your device" is literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs.
- **⭐ [AUDIT GATE] Pre-submit functional-correctness audit + FINANCIAL-CORRECTNESS money lens** — boundary inputs across the engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios.
- ✅ **SHIP-BLOCKER RETIRED 2026-08-11 (A.0)** — the Home-Screen name is **"Debt Planner"** via `ios.infoPlist.CFBundleDisplayName`. ⚠️ `expo.name` deliberately stays `"Debt Planner (RN)"`: it derives the Xcode project name, hardcoded 10× across three pipelines. ⛔ **The old wording said "Home Screen + App Store name" — the App Store name is set in App Store Connect and was never in this file.** ⏳ Confirm on the next build (checklist §1).
- **⚠️ SHIP-BLOCKER · flip `QA_TOOLS` to false** (see Standing constraints).
- **Sentry — scaffold done; Phase 6 = flip it on:** set `EXPO_PUBLIC_SENTRY_DSN`, CI source-map care, verify capture on a real build, add a `beforeBreadcrumb` PII scrub.
- **📋 [FILED 2026-08-14, 🎯 "revisit in Phase 6"] Real-device cloud testing — as DEVICE-MATRIX coverage, not as a way to shrink the manual pass.** ⛔ Against this checklist it moves only **3–6** of the 34 `[D]` rows (old-hardware perf §11.2/§11.12 · camera image injection §3.8 · Split View §10.3); haptics, sandbox StoreKit, pointer and Siri stay human on a farm too. ⭐ **The real gap it closes is that everything runs on ONE sim config** — §11.1 says outright *"a wide phone can pass while an SE fails"*, and iPad mini's 744pt phone-layout boundary is untested. ⚡ **Maestro Cloud is the zero-rewrite path** (13 flows already exist); every other farm needs the suite written again in its framework first. ⚠️ Verify pricing and that the cloud tier supports `setOrientation` — it cost three cycles to establish locally. **Triggers:** Android at v1.8, or the first width-driven bug that reaches a user. Detail → log.
- **App-Preview asset** — re-shoot off the proven pipeline once the UI is frozen. Apple takes ONE 886×1920 file, 15–30s, ≤30fps.
- **AU/NZ availability + E2EE trust-claim verification** — verify the Apple ADP-status API exists, or fall back to honest "encrypted iCloud backup" wording.
- **App Review paywall-findability** (v1.1 was rejected repeatedly) — the ASC notes MUST say "Tap ••• More → Unlock Premium."
- **Owed off-device (Jason):** ASC privacy label declares RevenueCat · marketing "100% private" alignment · the launch-FLIP value gate.

**📋 Device-QA ledger — verify on real hardware; web cannot cover these:**
- **🎯 ALL of Phase 3.5's device debt → `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 · §12 · §13.** That file is the runnable truth; this is the index. Highest value: **§11.15**, the iPad ring-origin invariant, which nothing automated can hold.
- **⭐ [SUB-AUDIT] Premium-accessibility:** VoiceOver rotor + a full walk · Dynamic Type AX3/AX5 reflow · reduce-motion · contrast both themes · focus order · touch targets. WCAG 2.2 AA is the FLOOR.
  - 📋 **[FILED 2026-08-13] Automate half of this with `XCUIApplication.performAccessibilityAudit()`** — Apple's own audit (XCTest, Xcode 15+) covers **contrast · hit-target size · text clipped at AX3/AX5 · missing or wrong traits**, i.e. four of the six bullets above, on the simulator this lane already boots. ⚠️ **Needs an Expo config plugin:** `apps/rn/ios` is not committed (`expo prebuild` regenerates it), so a hand-added XCUITest target is destroyed every run — pbxproj surgery, hence its own item rather than an add-on. ⚡ Arguably a better use of 4.1.9's slot than the Appium supplement. 🎯 Jason: VoiceOver is *"hard for me to test — it pretty much locks down my phone"*, so this is the gap with the least current visibility. ⛔ Accessibility Inspector itself is **macOS-only** and unavailable on this workstation.
  - ⚠️ **[3.7.B.4] `ListRow`'s swipe-to-delete announces a hidden Delete button on EVERY row.** Its action pane is mounted whether or not the row is open and carries `accessibilityRole="button"` + `Delete {title}` with no a11y guard — so VoiceOver offers a destructive control the user cannot see, once per row. B.4's swipe-to-mark-paid hit the same shape and fixed it (`a11yHidden` + `useInert`, released on open); `ListRow` predates that and was **not** touched. Same fix, but it is a live list of destructive actions → verify on device before changing.
  - ⛔ **[3.5.7.1 after-scan] BOTH GUARDS COVER 2 OF THE 4 NATIVE-ONLY PROPS, AND THE MISSING TWO ARE THE ONES THAT KEEP BITING.** `eslint`'s `no-restricted-syntax` and `check-native-a11y-props.ts` both ban exactly `accessibilityElementsHidden|importantForAccessibility`. They do **not** ban `accessibilityValue` (which caused 3.5.7.1) or `accessibilityState` (which causes the `CheckCircle` row below) — yet react-native-web drops all four identically. ⚡ **The guard written for one instance of the class does not cover the class**, which is why the same defect has now been found three times by hand. ▶ Extend both to the four props, with helpers to point at (`a11yAdjustableValue` exists; state needs one). ⚠️ **Deliberately NOT done now:** `accessibilityState` appears in **11 files**, so turning the guard on reds the gate until they are converted — that conversion is this sub-audit's work, not 3.5.7's.
  - ⚠️ **[3.7.B.4] `CheckCircle` reports no checked state on WEB.** It sets `accessibilityState={{ checked }}` and react-native-web does not render `aria-checked` — measured, and it is the exact prop-allowlist trap `utils/a11y.ts` documents. Native is **unverified**: `accessibilityState` is expected to work on iOS, so this may be web-only (like the `Slider` gap) or may not. **Check it with VoiceOver here** — a checkbox that never says whether it is checked is an AA failure, and it matters on web the moment 3.5.7's embed ships.
- **⭐ [SUB-AUDIT] Performance-feel:** 120fps ProMotion · Skia redraw cost · cold-start TTI · list jank · optimistic-UI feel. Includes the Today/cushion-forecast memoization check.
- **§3.1.2** SF Symbols on the min-iOS target (some are iOS-16+) · **§2.8** native scan (Vision autolink, OCR quality, camera permission) · **§2.11** RevenueCat real purchases + restore + offering marked current · **§3.3.1** the AHAP crescendo FEEL + celebration · **§VIS-2/B2** share on all three surfaces rasterizes fully · **§3.4** `expo-blur` real material + gesture touch + detent haptics · **§3.5** Live Activity / Dynamic Island / widgets / App Intents / App Group · **§3.6** iPad both orientations, Split View, Stage Manager, pointer/keyboard · **§VIS-6** sound + notification delivery.
- Native Skia render + draw-on motion on all surfaces · `boxShadow`+`overflow:hidden` native clip · `<Motion>`/`<CountUp>` native runtime.

---

## Deferred backlog

_Post-triage under the fold-don't-defer rule — only two carve-outs remain: **device-gated**, or **genuinely
a later version/tier**._

**[4.1.8 after-scan, 2026-08-14] Upload the failure hierarchy as its OWN small artifact.** Diagnosing
flow 10 twice today required pulling `maestro-report` — **48 MB compressed, 122 MB extracted, ~5 minutes**
— to read a single string. The deciding file (`screen-hierarchy/*.json`) is **72 KB**; `commands.json` is
44 KB. The screenshots and os-log are what make the artifact large and neither answered anything. A second
`upload-artifact` step scoped to `**/screen-hierarchy/**` + `**/commands.json` would turn "why did that
flow fail" into a ten-second question. ⚠️ Fold into **4.1.9b**'s workflow pass so the file is touched once.

**Device-gated → the Phase-6 pass:** Today/cushion-forecast selector memoization *(conditional on a real
measured hotspot)* — ⚠️ **A3.1 added one extra allocation** on Today whenever the discovery hold is active
(the attestation counterfactual). Cheap, and the current store's allocation is already memoised, but it
belongs on this ledger · Dynamic-Type device QA.

**Engine structure:**
- **⚠️ [3.7.B.1] The core bulk paths still write pre-[D2] paid semantics.** `bulkMarkRequired.ts` sets
  `isPaidThisCycle: true` on a debt whose **minimum** was covered — which [D2] reserves for paid in full.
  **Inert today** (measured: no debt reader in either tree keys on that field alone; all fall back
  `minimumPaidThisCycle ?? isPaidThisCycle`), and pinned by `testMarksDebtMinimumsBothFlags`. It is a false
  assertion in **data Phase 5 migrates**, and unpinning it is an engine-semantics change → **the Phase-6
  financial-correctness gate.** *(`bulkMarkRequiredPaid` is legacy-only and dies at 5.5.1;
  `applyRequiredReconciliation` is the live one.)*
- **⚡ [3.7.A3.6 after-scan] `appliedTopUp` is a manual-opt-in invariant.** Cash moved from savings this
  cycle lives only in `store.cycleTopUp` — the allocation never sees it, so **every** cushion reader has to
  remember `+ appliedTopUp(store)`. Three readers exist; two had it, `selectAffordability` did not (A.6's
  double-count). The next reader will miss it too. Structural fix: fold the top-up into the allocation so
  it cannot be forgotten — **engine-wide blast radius, so not a Wave-A item.** → the Phase-6 financial-
  correctness audit gate. *(Checked and NOT a defect: `selectSaveForItOptions:482` omits it correctly — it
  paces a recurring per-paycheck save, which a one-cycle borrow must not inflate.)*

**Tooling / hygiene:**
- ⛔ **PROMOTED 2026-08-11 → the active build (4.1.8).** *(Was: a supplemental Appium lane, filed as triggered-not-scheduled with a "NO for now" recommendation. 🎯 Jason reversed it the same day — "the more that we can prove with Appium/Maestro the better" — and the amortisation argument carried it: the lane outlives v1.7.)* → `audits/2026-08-11-maestro-coverage/` §7.
- ⛔ **PROMOTED 2026-08-11 → the active build (4.1).** *(Was: "extend the Maestro lane to an iPad simulator — would take **four** items off the device's plate." Measured 2026-08-11: the iPad boot alone carries six, and the whole lane carries 68 of 127. The "four" was a guess, and it undersold the item by an order of magnitude.)*
- ✅ **CLOSED 2026-08-11 (Wave-A after-scan) — the gate now typechecks, both trees.** *(Was: nothing. `validate:release:rn` never ran `tsc` at all, and A.6/A.7 were both committed green carrying real type errors. `packages/core` was worse — excluded from apps/rn's tsconfig on the premise that "the Capacitor app typechecks it", a premise that expired when `validate:release:legacy` was retired 2026-07-24, leaving the money engine the least type-checked code in the repo.)* Measured at 14 errors, all legacy-tree coupling, zero in the engine. `typecheck:core` + `typecheck:rn` now run FIRST. ⚠️ `packages/core/tsconfig.json`'s `@/*` alias and the three `@/lib/*` importers go together at **5.5.1**.
- **⚠️ The gate still asserts the RETIRED demo-mode contract** — `runRegressionTests.ts:59` imports `testDemoModeSeed`, which asserts the Capacitor key `debtPlanner.isDemoMode` that `seedPlannerState.ts` writes. It passes (the legacy tree still exists) but it is a green test defending a feature the RN app no longer has, which reads as a live contract → delete with the Capacitor tree at **5.5.1**.
- **⚠️ `apps/rn/package-lock.json` is out of sync** — `npm ci` refuses it; both CI lanes work around it with `npm install`, so **installs are not reproducible.** Regenerate deliberately and re-run the full gate → before the Phase-5 cutover.
- **Simulator build recipe DUPLICATED** across `native-e2e.yml` and `app-preview.yml` (~60 lines of expensive native fixes) — extract a composite action → with the iPad lane. ⚡ **[4.1.3a] `app-preview.yml` does NOT have the `.app` cache** — fold it in with the extraction rather than copying it a second time.
- ⛔ **Cache `~/.maestro` — REFUTED 2026-08-13, do not build it.** *(Was: "a measured **1m29s** on every run".)* Re-measured on the green run `31709717569`: the install is **22s**. It would also silently **pin the Maestro version** — `get.maestro.mobile.dev` fetches latest — which is a decision worth making deliberately with the version in the key, not as the side effect of a 22-second speed tweak. **Pinning on its own is worth revisiting** *(4.1.1 spent three cycles establishing which commands this build supports; a silent Maestro upgrade can retire one)* → 4.1.11.
- ⚠️ **[2026-08-13] The rot guard duplicates work during ACTIVE development, and it did so on its first firing.** Run `31720458919` (`push`) started automatically on the very commit whose fix needed a `device=both` dispatch — and a push supplies no inputs, so it was an iPhone-only run of the thing about to be run properly. Cancelled by hand. **The guard is right for quiet weeks and a tax on busy ones**; options are a `[skip native]` commit-message convention or leaving it manual until 4.1 closes → **4.1.11**.
- ⛔ **ccache — CLOSED BY MEASUREMENT 2026-08-13. It cannot cache this build at all.** Two runs on `perf/ccache-pods` (left unmerged as the record): **`0/648 cacheable` both times**, and `-sv` named it — *"Could not use modules: 647/648 (99.85%)"*. ⚡ **Both stated mechanisms were wrong.** The July removal note blamed *explicit* modules; turning `CLANG_ENABLE_EXPLICIT_MODULES=NO` changed nothing and cost **888s vs a 771s baseline**. RN's pods use **implicit** `CLANG_ENABLE_MODULES`, ccache declines those by design, and RN's Obj-C needs them. ⛔ `sloppiness=modules` refused — it stops hashing module contents, which is rule ②'s stale-binary hazard. **771s is the floor.** The only remaining avenue is **prebuilt pod binaries** (RN already does this for its core via `RCT_USE_PREBUILT_RNCORE=1`) — a dependency-packaging change, not a CI tweak → filed, not scheduled.
- ⛔ **The DerivedData cache tier — REFUSED 2026-08-13 (🎯 agreed), do not resurface it.** Two laps readings settle it: **~70% of the boot step is simulator boot + install, which DerivedData cannot touch** — it helps only the *compile*, and the compile is already covered by the `.app` cache for flow-only iteration (17m03s → 2s), which is what 4.1.5's remaining items all are. Against that: multi-GB in a **10GB per-repo cap** where LRU eviction could take out the 17MB `.app` cache that is saving the 17 minutes. **The optimisation eating the optimisation, for a benefit measured small and aimed at the wrong half.**
- ⚡ **[2026-08-13] The lane's real cost centre is `Boot, install, launch, capture the app log` — 529s of a 1326s job (40%)**, second only to Maestro's 650s and **6.5× the whole filed caching batch combined**. Nothing had costed it; the batch was authored against the two small numbers because those were the ones written down. Caching cannot touch it. **Instrumented 2026-08-13** (per-phase `⏱` laps + `bootstatus -b`, and the flat `sleep 25` replaced by a poll on the app's own log signal) — **read the next run's laps before optimising anything here.**
- **No local pre-flight for the capture path** — a flagged web export + ~40-line check would have caught several CI cycles' worth of defects → with the above.
- **TWO screenshot mechanisms** — `tests/visual/*.cjs` (root, by hand) and `apps/rn/tests/shots/` (config-driven). The root set's stale frames masked the sandbox theme defect → remove at 5.5.1.

**Genuinely a later version / tier:**
- **⚠️ `Slider` reports no value on WEB** — react-native-web drops `accessibilityValue`; `a11y-axe` does not flag it. Web-only, so it matters the moment **3.5.7's embed** ships.
- **`typicalAmount` still has no UI** — same shape as A9's defect but far smaller impact → the wording/cohesion gate.
- **The app never shows a debt-free date reflecting its own plan working** — on day one the starter EF absorbs the surplus, so every projected date is minimums-only. Honest per screen; the question is the app-wide effect → the cohesion audit, not a defect.
- **The demo's beat dwell may be too short for the runner** — decide from the 2fps contact sheet.
- **Apple Watch** → v1.8+ · **`@gorhom/bottom-sheet`** → v1.8 Android · **Behavioral mis-entry / persistent-cushion / bill-shock autopilot** → Connected/Plaid tier · **Holiday/promo free-trial** → a reversible later lever, launch is paywall-from-day-1 · **iOS-18 Control Center** [D1] *(rec: stay deferred)* · **web light-mode hover screenshots** *(a QA artifact, not product)*.

---

## Decisions

- **Re-scope to "The Elevation" ✅ (2026-07-20)** — design-first, best-in-class.
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel.
- **Revenue spine ✅ (2026-07-25)** — Monthly $4.99 · Annual $29.99 · Lifetime $79.99 (excludes Connected/Ava). **NO free trial.** Reuses the existing RevenueCat project — v1.6 subs must restore.
- **Phase-3 scope ✅ (2026-07-27)** — pull EVERYTHING into v1.7 unless it genuinely can't ship. Analytics OUT of the core (privacy moat), but the 3.5 demo re-opened it → D-A wires a privacy-first funnel seam.
- **Executive "fix everything, no backlog" ✅ (2026-07-29/30)** — fold every audit finding now; only hardware verification waits for Phase 6.
- **[D23] ✅ (2026-08-11)** — **the demo is TWO runs.** `explore` ships to users (navigable, no script, one exit); `scripted` is the App-Preview + embed vehicle and leaves the user-facing doors. Resolves one artifact serving two jobs with different requirements.
- **[D22] ✅ (2026-08-10)** — **the debt/expense split is CORRECT and stays** (terminating vs perpetual); the defect is naming + entry. **[D22a]** the single-entry chooser fully replaces the per-section Adds · **[D22b]** the mis-file detector runs retroactively at rollout · **[D22c]** it surfaces, never silently re-files · **[D22d]** the Guardian's "bills" vernacular → the wording/voice gate. → 3.7.A10.
- **[D21] ✅ (2026-08-10)** — **the demo SHIPS to users again, reversing [D19].** Demo = before you commit (Welcome + paywall); walkthrough = after onboarding, on your own money. It no longer rides `QA_TOOLS`.
- **⛔ [D19] REVERSED (2026-08-06 → 2026-08-10)** — it pulled the demo's entries as a duplicate of the walkthrough, and the rebuild it ordered (3.5.4.11) repaired that premise the same day. Superseded by [D21].
- **[D20] capture pipeline ✅ (2026-08-06)** — Maestro drives · `simctl` records · ffmpeg conforms. `maestro record` rejected.
- **[E4] ✅ (2026-08-08)** — an upgrader is offered the FINALE alone, not a replay of the arc.
- **3.5.7 sequencing ✅ (2026-08-10)** — built after Phase 3.7. Hosting + privacy specifics still open.
- **Legacy gate RETIRED ✅ (2026-07-24)** — `validate:release` → the RN gate.

- **[D24] ✅ (2026-08-11)** — the tight top-up prefers a **discretionary savings goal; the EF is the fallback, not the first pick, and the copy names it when it IS the EF.** "Never" would make the one-tap vanish for anyone whose only savings is the EF. The dishonesty was drawing on it *silently and first*. → **A3.3**
- **[D25] ✅ (2026-08-11)** — an applied purchase **keeps** its deferrable behaviour (a discretionary buy *should* be first to cut in a shortfall) but gets an **explicit category**, so it is a stated rule rather than an uncategorized fallthrough. → **A3.7**
- **[D2] ✅ (2026-08-11)** — **`minimumPaidThisCycle` is the owner** ("minimum covered"); `isPaidThisCycle` means paid in full. ⚠️ **Corrected by B.0:** the fallback-less reader is `planSelectors.ts:`**`156`**, and Today's mark-paid writes through `handleMark` → `markDebtMinimumPaid`, **not** `bulkMarkRequired` (that is the payday path, and it violates this decision by also setting `isPaidThisCycle`). → **B.1**
- **[D3] ✅ (2026-08-11)** — the calm-micro-viz hero language **extends to Debts** (a paydown bar via the existing `HeroProgressBar`). Bare read as an omission next to Bills and Goals, on the page whose subject it is.
- **[D4] ✅ (2026-08-11)** — **rename NOW, before the next device build.** Every App Shortcut phrase contains `\(.applicationName)`, so A8's phrases cannot be finalised or device-tested until the name is final, and `app.json`'s "Debt Planner (RN)" is a Phase-6 ship blocker regardless. → new step **A.0**

- **[D1] ✅ (2026-08-11) — stays DEFERRED, on a new reason.** ⛔ The original reason (cost: the AppIntent machinery was unbuilt, ~4–5× the query-intent baseline) **has expired** — the widget extension, App Group, `DebtProvider` and an in-extension App Intent all exist now, so it is ~one Swift file plus an availability gate. It stays deferred because **there is no control-SHAPED job**: this app's actions are multi-step (log a payment needs a debt *and* an amount) or rare and dated (payday landed, already on the Live Activity), and a glance is a widget's job — which already ships. ⛔ **Trigger SPENT (B.0, 2026-08-11)** — B4 creates no new one-tap; `RequiredActionsCard.tsx:209`'s `CheckCircle` has been that one-tap since the card shipped. Deferral stands on its stated reason, with nothing pending.

- **[D26] ✅ (2026-08-11)** — B3's greeting **mechanism** ships in Wave B; its **strings are owned by the wording/voice gate**, which is where 2026-07-30 deferred it. Splitting the two honours both. → **B.2**
- **[D27] ✅ (2026-08-11)** — port the free on-plan streak **only** (milestone surfacing already ships). Calm house voice, **no flame**, and never rendered beside the premium "Held your line · N paychecks" — two streaks on one screen read as one feature stated twice. → **B.3**
- **[D28] ✅ (2026-08-11)** — B4's swipe **ships, as a pure accelerator** over the existing one-tap `CheckCircle`. The infra exists (`ListRow`'s `ReanimatedSwipeable`), the gesture is unused on required rows, and legacy carried pill **+** swipe too. → **B.4**
- **[D29] ✅ (2026-08-11)** — **B1 is CLOSED as refuted.** The delta between "drag the curve" and what ships is a gesture, and §3.4.1's scrub-to-read already owns it.

- **[D31] ✅ (2026-08-12)** — **the audits change METHOD, not just model.** 🎯 the Fable-5 fan-out costs a session in ~20 minutes. ⚡ The reframe that decided it: reading is the **expensive half and the weak half** — Hearthlight's 8 adversarial rounds produced *"one good cut, two tests worth keeping, and then recurrence"*, Law IV found **2 of 4** agent-stated mechanisms wrong while all 4 recommendations were sound, and today's live defect survived **two audit passes and three green web specs** before an 11-minute Maestro run caught it. So: deterministic lenses become **scripts**; agents get a **generated artifact** instead of the codebase (~10× less input, which dwarfs any model discount); cheap tier extracts, expensive tier judges a short list; runs go out-of-session with incremental writes. ⚡ **And every finding that becomes a TEST is paid for once** — audit spend as capital, not rent. → **audit tooling**, below.
- **[D30] ✅ (2026-08-12)** — **the iPad lane is THREE TIERS IN ONE DIRECTORY**, not a second flow set: shared (testID-driven, device-agnostic) · iPhone-only (where the compact presentation IS the subject) · iPad-only (the checks with no iPhone equivalent). Device is a **workflow input** with its own explicit flow list. ⚡ Forced by `use-layout.ts`: `isExpanded` is width-derived and branches in **seven** places, so on a wide iPad the debt sheet is **inline, not modal** — flow 02 would pass while testing nothing. ⛔ A duplicated set was rejected on this repo's own measured cost of parallel test surfaces (the two screenshot mechanisms; Wave A's "two places, one rule" ×3). → **4.1.5**

- **[D32] ✅ (2026-08-14) — 3.5.7 hosts on GitHub Pages, and its privacy claim is a GATE.** No new vendor, CI already emits `dist` from `expo export --platform web`, and it is **static-only by construction** — it cannot run server code, which is the property being asserted. Vercel/Cloudflare buy a CDN and an analytics surface a marketing demo needs neither of, and each adds an ASC privacy-label entry. **The stance, enforced not promised:** no analytics in the embed build (a **build flag**, not a runtime toggle — a toggle can be flipped) · no `localStorage`/`IndexedDB`, `sessionStorage` only and cleared on exit · **zero network requests after asset load** · all of it held by a Playwright spec that fails `validate:release:rn`. Per [D31], a finding that becomes a test is paid for once. ⚠️ **Wording caution:** every host logs IPs, so *"financial data never leaves your device"* stays literally true while *"100% private"* would overclaim — → the wording/voice gate.

- **[D33] ✅ (2026-08-14) — §11.16 PASSES on both edges; beat 5's landscape crop is DELIBERATE.** ⛔ The "what should beat 5's subject be" question was **mine and it was wrong** — the iPad *portrait* frame (`ring 384,363 subj 388,367`) encloses the whole Guardian card, header included, so the subject was never in doubt. In landscape the card exceeds the ~834pt viewport and **must** be cropped; the anchoring favours the card's bottom, which is correct because the beat teaches *"what has to be covered now, and what can safely wait"* — the COVER NOW / SAFE TO DEFER / Defer block. Cropping those to reveal a headline the user already met would hide what the beat exists to show. → the offset nudge and the dark-theme frame fold into **4.1.5.6**.

**Open:** none.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
