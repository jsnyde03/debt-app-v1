# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — **3.8, the expense reserve** _(decomposed below)_

⭐ **2026-08-17 closed TWO PHASES.** **Phase 4** exited on a green `32051842661`; **Phase 3.5** closed when
the embed went live. 🎯 cut the **CodeMagic build** and confirmed **3.8 is in v1.7**.

| | |
|---|---|
| **The lane's answer, derived** | **26 proven** (20 native-run · 5 push-gate · 1 human) · 19 half · 60 coverable-not-built · **the device pass is 52** of 131 real checks. ⚠️ Read it from `audits/coverage-split.md`, never from a doc quoting it |
| **The embed** | **live** — https://jsnyde03.github.io/debt-app-v1/ · **10/10 against the deployed page** |
| **Next** | **3.8** → the audit gate → **Phase 5** (ship-blocker) → 5.5 → **Phase 6** |

⚠️ **Read the SESSION CLOSE 2026-08-17 (night) log entry first** — it carries what NOT to build on.

✅ **3.7 CLOSED 2026-08-11.** Wave A (A0–A10) · Wave B (B.0–B.4) · Wave C merged into the audit gate.
Gate **167/167** + tsc clean, zero `error-context.md`. Wave B detail + its wave-level after-scan → log.

<details><summary>✅ <b>PHASE 4 — CLOSED 2026-08-17.</b> The Maestro/XCUITest coverage lane, item by item.</summary>

| # | Step | State |
|---|---|---|
| **4.1.3 – 4.1.5.1** | ✅ **CLOSED 2026-08-12/13.** The lane 0/8 → **8/8 on iPhone**: flow order made explicit · the `.app` cache (17m03s → 2s) · `lint:selectors` · ⭐ the coach-mark probe and the **three shipped defects** it found · the iPad boot at 1032pt. Detail + every scan → log | ✅ |
| **4.1.5** | **The iPad tier's REAL checks.** 4.1.5.1–4.1.5.4 and **4.1.5.5 all closed** — 🎯 §11.16 judged 2026-08-14, **both edges PASS**, evidence + reasoning → [`evidence/2026-08-14-p11.16-ipad-landscape/`](evidence/2026-08-14-p11.16-ipad-landscape/README.md). ⭐ **4.1.5.6 CLOSED 2026-08-14 — the iPad tier is 5/5 in run `31827409093`**, its first content ever: `01` · `i01` · `i02` · `i03` · `05` all pass. ⛔ The two prior "results" were **non-results** (`iOS driver not ready`, zero flows); the cause was a 240s timeout the iPhone step had already had raised to 420s. ⚡ **The raise alone sufficed** — the retry never fired. ⛔ The "nudge the scroll offset" fold-in was **refuted**: `TutorialOverlay` measures but never scrolls — see the open defect below | ✅ |
| **4.1.6a** | ✅ **CLOSED 2026-08-17.** `audit:coverage` + `lint:coverage` (.1–.6) and the XCUITest target (.7). Its standing guidance is kept below the active section | ✅ |
| **4.1.6** | **§12.0 explore** — `09-demo-explore.yaml` | ✅ **CLOSED 2026-08-17 — dispatched and GREEN** in run `32037021903`, its first execution. Covers §12.0.1 · .2 · .4 · .5 · .6 · .7. ⚠️ **.3 and .8 do NOT automate** — see below |
| **4.1.7** | **The THREE questions that still move the number** | ✅ **CLOSED 2026-08-17, run `32042253465` — all three answered, all favourably.** ① **Reduce Motion IS observable**: `reanimated=1 a11yInfo=1` after a `simctl` pref write + relaunch, so §B3.6/§11.7 stay `[M◐]` and the floor does **not** rise by 2. ② **`typeKey` WORKS**: `cmd-N opened=true`, `cmd-1/2/3 selected=true` on the iPad → §10.5 · §10.6 become `[X]`; ⛔ **§10.7 falls to `[D]`** (no XCUITest API for a HELD modifier), **+1**. ③ **anchor `rendered=true` on BOTH tiers** — the `09` reorder fixed it, so the audit numbers are trustworthy at last. Detail → log |
| **4.1.8** | **§11's remainder** — `10-walkthrough-edges.yaml` | ✅ **CLOSED 2026-08-17 — 10/10, third consecutive green.** The `repeat` tap+erase fix for §11.9's cleanup is stable, not a fluke |
| **4.1.9** | ✅ **[DECISION] SETTLED 2026-08-17 — XCUITest, and NO Appium.** The probe proved both capabilities Appium was wanted for a *subset* of: springboard reachable **and inspectable** (`elements=241`), and `performAccessibilityAudit` completing on all four needed types in **2.9s**. **10 rows re-verdicted `[D]`→`[X]`; the device pass drops 60 → 50.** ⛔ Appium adds a second driver, a second language and a server process to buy 3 checks a driver we now have can plausibly do. ⚠️ Those 3 stay `[A]`, NOT `[X]` — XCUITest's `typeKey` is unproven here, and re-verdicting them on expectation is the overstatement 4.1.9c exists to stop. Detail → log | ✅ |
| **4.1.9b** | ⭐ **CI wall-clock: the composite action AND the tier split, as ONE pass** *(🎯 approved 2026-08-14; repo is PUBLIC so macOS runners are free)*. ① The `.app` key hashes the whole of `native-e2e.yml`, so the **flow list** busts the binary — both of today's runs paid ~771s of compile for pure YAML edits. ② The two tiers run **sequentially in one job** (no `matrix`), so `device=both` pays iPhone **+** iPad (~650s + ~666s) instead of `max`. ⚡ They merge: the extracted composite is exactly what two parallel jobs must both call. Also folds in `app-preview.yml`'s duplicated recipe + its missing cache. **Together: ~22 min → ~12 on a cache hit.** ⚠️ Loosens a key 4.1.3a hardened — safe only because the composite holds every build flag and `maestro test` lines cannot affect a binary. ⛔ **[.7.4c after-scan] The split must keep the XCUITest probe step in the iPhone job** — it sits between the two tiers today, and a step that stops running looks exactly like a probe that found nothing. ⚠️ Cache the `.xctestrun` + `-Runner.app` beside the `.app` | ✅ **CLOSED 2026-08-17.** Composite action · tier split · results file · `lint:lane` (76→81 checks). ⚡ **Measured on the cache hit: build 19m42s → 11m15s (−43%)**, tiers start the same second. ⛔ **"~22 → ~12 total" is RETIRED** — the iPhone tier grew 24m49s → 35m09s from the probe regression, so wall-clock did not improve. Detail + every scan → log |

⛔ **[4.1.9b, standing] Do NOT shard the iPhone tier.** The flows carry a real dependency chain — `01` seeds · `07` clears state · `08` depends on `07` · `10` must precede `09` · `09` is terminal. Splitting it is how the suite starts lying. The tier SPLIT is safe for the opposite reason: each tier already runs its own `01`.

⛔ **[4.1.9b, standing] The boot lap is 148s, not 529s — do not spend anything else there.** ⚠️ But the poll that replaced the `sleep 25` **is not firing** (`launched 119s → reported up 144s` is exactly the 25s ceiling): a fix believed to work that does not. Deliberately unfixed — inventing a log predicate instead of grepping the artifact already cost a cycle → **4.1.11**.

| **4.1.9c** | ⭐ **"Covered" must mean PROVEN, and proof ticks the checklist** *(🎯 2026-08-14)* | ✅ **CLOSED 2026-08-17.** Reader (2026-08-14) + **the WRITER**: `npm run stamp:coverage` turns a run's `native-lane-results-*.json` into stamps and **revokes them when a flow reds**; grammar shared with the reader via `coverage-model.ts`, proven inert byte-for-byte; **`npm run test:stamp` — 8 scenarios, every rule fired on a planted input, every plant `plant-applied=YES`**; in `validate:release:rn`. ⛔ **Its own premise was refuted first: it adds ZERO covered rows** — `claimed-but-unproven` was already 0, so the run applied 32 refreshes and the headline stayed **24**. Detail + every scan → log |
| **4.1.10** | §12.1–§12.7 (15) — the SCRIPTED run | ✅ **CLOSED 2026-08-17.** ⛔ **The blocker was the instrument, not the rows: `audit:coverage` could not SEE a Playwright-proven row**, so the morning's routing would have proven them and left them reading "never built" forever. Now reads claims from specs too, with a second proof mark **`✅gate`** (a push-gate holds it, which is stronger than naming one run of a batched lane). ⚡ **Most of §12 was already tested and merely undeclared** — 12 rows claimed, 6 new tests for the real gaps, 2 re-verdicted `[D]`. **26 proven · device pass 52.** Detail + every scan → log | ⛔ **No `qaEnabled()` door** — a QA door would manufacture a path the product does not have, prove the rows against it, then lose it at the Phase-6 flip. ⚡ **The scripted run is not user-reachable on iOS at all** ([D23]: users get `explore`); it exists for the capture and the embed, exactly as the checklist says. ▶ **§12.2 · §12.5 → the EMBED's Playwright gate** (3.5.7.5 boots it into `/demo?mode=scripted`). ⛔ **CORRECTED 2026-08-17 by 3.5.7.7's after-scan: §12.4.1/.3/.4 came OFF this list** — they are about *"Unlock Premium"* and *"Start my real plan"*, and the embed now has neither. **→ normal-app automation**, where `demo-containment.spec.ts` already clicks one of them. ▶ **§12.7.1 + §12.1.1 → normal-app automation — both are MIS-FILED** (§12.7.1 is the analytics opt-out, nothing to do with the demo; §12.1.1 tests the "See it in action" door, which yields *explore*). ▶ **§12.3.1 · §12.2.2 · §12.6.x · §12.4.2 stay device-owed.** Detail → log |
| **4.1.11** | **Reconcile — the exit** | ✅ **CLOSED 2026-08-17 on a green `32051842661`** (build · iPad · iPhone). The number re-derived, the stamps refreshed to it, the **nightly** landed, and the a11y probe now prints its findings. ⚠️ Two of the 15 flow files MEASURE rather than cover (`i01-ipad-boot`, `11-reduce-motion`) — a count of files overstates itself. Detail + every scan → log |

</details>

### ▶ 3.8 — the expense reserve _(active)_

🎯 **IN v1.7** *(2026-08-17: "3.8 is definitely in 1.7")*. ⛔ **The app coaches a habit it cannot record
and then plans as if you had not followed it:** Money's Expenses hero says *"$175 reserved per paycheck"*
— computed inside `money.tsx` for that hero alone, read by nothing — while `allocatePaycheck` demands the
**full $350** in the cycle rent is due. Found by 🎯 using the app; no coverage split models *"the app does
the wrong thing correctly."*

| # | Step | State |
|---|---|---|
| **.1** | **Remove the misleading hero.** ⚠️ Check what else that block feeds first (`categoryBreakdown`, `barTotal`, `segments`) — the per-category `perPaycheck` figures drive the category bar | |
| **.2** | **The pot, in the store** — ONE aggregate number, not per-bill envelopes. Keeps Phase 5's migration to *absent ⇒ today's behaviour* | |
| **.3** | **The draw-down in `allocatePaycheck`** — ⛔ **the invariant is the hard part**: money set aside in cycle 1 must be *gone* from cycle 1's spendable **and** reduce rent in cycle 2. Honour only the second and the model invents $175 | |
| **.4** | **The recommended action**, never required. ⛔ **Offer only what this paycheck can spare** — promising $175 and reserving less is the capped-outcome shape [A3.6] exists for | |
| **.5** | **The Guardian bar + the tap** — the set-aside joins the everyday segment; tapping splits living-expenses vs expenses. ⚠️ **[DECISION] the segment's new name** is 🎯's | |
| **.6** | **Coverage** — engine tests for the draw-down and conservation; e2e for the tick and the tap. ⚠️ The reserve must NOT land in the `safetyNet` windfall bucket unexamined | |

**Exit:** the number the app shows is the number the app honours, and a user who acts on it sees the plan
change. **Open:** the segment's name (.5), and whether the tap is a sheet or an inline expand.

⚡ **It also closes 🎯's SECOND report for free** — *"living expenses are hidden in More"*. Two doors exist
(More's settings row **and** a `LivingReserve` card on Money), so the report is not literally right and
the code is **worse** than it: ⛔ **the Money card is gated on `livingTotal > 0`**, so it appears only to
users who already found the feature. The Guardian tap is the unconditional door.
⚠️ **Independent of 3.8 and cheap: drop that gate, or give the card an empty state.** A feature whose only
unconditional door is a settings row is undiscovered by construction.

⚡ **The engine already supports the hold** — `prefundedReserve` is an existing `allocatePaycheck` input
(`min(reserve, remaining)`, its own allocation row). The new part is a **persisted pot and its
draw-down**, not a new capability. Full pre-authored detail → log, 2026-08-17.

### 🎯 THE ANSWER — what the lane carries, and what it never will

*From `coverage-split.md`, regenerated. ⚠️ Read it there, never from a doc quoting it: this line has gone
stale twice.*

| | rows | |
|---|---:|---|
| **✅ Proven** | **26** | 20 by a native run · **5 by a push-gate spec** · 1 human. Every one ticked, every tick carrying its provenance |
| **◐ Half proven** | 19 | the lane's half is green; the other half is a human's |
| **▶ Coverable, not built** | 60 | 🎯 2026-08-17 → **Phase 6, ticked by a human. Automating any of it is optional and NON-GATING** |
| **🎯 Permanently device-owed** | 26 | haptics · real VoiceOver · StandBy · Stage Manager · real App Store prices |
| **🎯 THE DEVICE PASS** | **52** | `[D]` + the human half of every `[M◐]` |
| Real checks | 131 | 9 further rows are `[—]` |

⚡ **The headline went DOWN twice on the way here and that is the instrument working** — 4.1.9c stopped
counting declarations as passes, 4.1.10 stopped counting a `PARTIAL:` claim as a whole row. It went up
once, when the Playwright suites became visible to it at all. **Nothing was marked covered to make a
number look better, and three separate mechanisms now exist to take a row back out.**

⛔ **[4.1.10 after-scan] THE GATE AND THE WRITER DISAGREED ABOUT "PARTIAL" ON THE FIRST RUN — five rows
rejected that the writer had just written CORRECTLY.** The writer learned that a partial-only claim
withholds the tick while `lint:coverage` still exempted only `[M◐]`. Both now call one `isPartialRow`
in the model. ⚡ *Three callers asking the same question is three chances to answer it differently*, and
this is the third time in two items that extracting the shared authority was the fix.

⛔ **[4.1.10 after-scan] THE CONSOLE SUMMARY WAS RECOMPUTING EVERY FIGURE, and it silently disagreed the
moment the report's rules changed** — `build()` had stopped counting partial-only claims as proven while
the line a human reads still said **24**. It now comes from `build()`'s own tally: one definition, two
renderings. ⚠️ That console line is the number that gets quoted into docs.

⚡ **[4.1.10 after-scan] THE HEADLINE MOVED 24 → 21 → 26, and every step of that is the instrument getting
more honest.** −3 when partial-only claims stopped counting as fully proven; +5 when the Playwright suites
became visible to it at all. ⚠️ **The device pass went 50 → 52**, because two rows were re-verdicted `[D]`.

⚠️ **[4.1.10 after-scan] §12.6.x were NOT re-verdicted, deliberately.** The routing calls them device-owed
and they are unclaimed, so they already sit in Phase 6's human pass — but `[D]` asserts *no lane will
ever carry this*, and nobody has probed whether Maestro can read those utterances. **.7.5's warning cuts
both ways:** a `[D]` that is really an unproven `[M]` keeps a check on the manual pass forever.

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

### 🎯 Reported from the app, 2026-08-17 — found by USING it, not by the lane

| | Report | State |
|---|---|---|
| **R1** | **Money's edit sheets had no date PICKER** — the field asked the user to type `YYYY-MM-DD` | ✅ **DONE.** `DateField` (native `@react-native-community/datetimepicker` + a `.web.tsx` `<input type="date">`, because the embed and all 171 specs run in a browser) at all 4 sites. ⛔ **Folded in: `todayLocalISO()` returned YESTERDAY east of UTC** — it built local midnight then `toISOString()`'d it. 3 new specs; the fields had **zero** coverage before, which is why it shipped |
| **R2** | **The expense set-aside is uncoachable** — and **living expenses are undiscoverable** | ▶ **= 3.8 below.** Both are the same fix |

⚡ **Neither was reachable by 4.1.** The lane checks that built behaviour keeps working; these are *design*
gaps — a control that never existed, a number the plan contradicts, a door gated on already knowing. No
coverage split models "the app does the wrong thing correctly", and the device pass is the only instrument
that can find it.

### ⏭ Then, in order

1. **3.5.7 — the marketing embed** *(🎯 needs hosting + the privacy stance)*
2. **3.8 — the expense reserve** ✅ **IN v1.7 — 🎯 2026-08-17: *"3.8 is definitely in 1.7."*** Settles it against [2.7]: the app contradicts its own number, and shipping that is worse than shipping late. ⛔ **The app coaches a habit it cannot record and then plans as if you had not followed it**: Money's Expenses hero says *"$175 reserved per paycheck"* (a display-only average, read by nothing) while `allocatePaycheck` demands the **full $350** in the cycle rent is due. 🎯's design: **remove that number**, and make the set-aside a **recommended (never required) action** whose reserve joins the Guardian's `PlanHero` bar beside the everyday reserve, with the segment **tappable to split living-expenses vs expenses**. Opt-in and additive — no tick, no stored reserve, behaviour byte-identical to today. ⚡ **`prefundedReserve` is ALREADY an engine input**, so the hold is supported; the new part is a persisted pot and its **draw-down**. ⭐ **It also closes 🎯's second report — "living expenses are hidden in More"**: two doors exist (More + a Money card), but ⛔ **the Money card is gated on `livingTotal > 0`, so it shows only to users who already found the feature.** The Guardian tap is the unconditional door. Decomposed → log *(one-section rule: 4.1.7 holds the active slot)*
3. **The audit gate** — whole-app cohesion + best-in-class + wording/voice *(Wave C merges in here)*
4. **Phase 5** (data continuity, ship-blocker) → **5.5** (repo consolidation) → **Phase 6** (launch)

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
- ✅ **THE CODEMAGIC BUILD IS CUT — 🎯 kicked it off 2026-08-17**, on 4.1's green exit. The definitive checklist that gated it is **derived**, not asserted: `npm run audit:coverage`. ▶ It feeds **Phase 6's single device pass** — 52 device-owed rows **+** the 60 coverable-not-built, human-ticked and non-gating ([D35] folded 3.5's pass in).
- ✅ **[D35] 3.5's device pass FOLDS INTO Phase 6's** *(🎯 2026-08-17)* — they overlapped the moment the 74 went to Phase 6. One sitting, no row run twice.
- **[D34] The embed CTA's wording, and which NAME it says.** 🎯 gave the link 2026-08-17; the listing is **"Paycheck Debt Planner"** and the app calls itself something else in every string this repo owns. A CTA that names the store listing is findable; one that names the in-app product is consistent. Blocks nothing — .7 ships behind a single constant. *(Rec: the listing name, since the CTA's only job is getting someone to that page.)*
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

- **⭐ [run 32042253465] THE A11Y AUDIT'S FIRST TRUSTWORTHY RESULT IS NOT ALL ZEROS: `hitRegion` = 2
  findings, on BOTH tiers.** With `rendered=true` the numbers finally mean something, and the very first
  honest reading turns up **two hit-targets below the minimum** (contrast 0 · textClipped 0 · trait 0).
  ⚠️ Unlocated — the probe counts findings, it does not print them. ▶ Next step is one line: log each
  finding's element instead of only incrementing. **This is the premium-a11y sub-audit paying for itself
  on its first run**, and it is a real defect, not an instrument artefact.

- **⚠️ [4.1.7 after-scan] THE PROBE'S OWN OUTPUT WAS NOT MACHINE-READABLE ON THE SUCCESS PATH.** The
  Reduce-Motion answer existed only inside a **PNG**: the flow asserts the readout is *visible*, and
  Maestro dumps a view hierarchy only on FAILURE — so a passing flow captured no value, and reading one
  integer meant pulling a 122 MB artifact and looking at a screenshot. ⛔ Also `rm-probe-readout.png` does
  not match the collector's `tut-*`/`probe-*` glob, so it survived only by living under `--debug-output`.
  ▶ Fix: assert the VALUE (`assertVisible: text: "reanimated=1 a11yInfo=1"`) or echo it into the step log.
  ⚡ *A probe whose result a human must look at is a probe that cannot gate anything.*

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
| 3.5 | Interactive tutorial + bounded demo | ✅ **COMPLETE 2026-08-17.** The embed is **live** and verified against the deployed page; the device pass folded into Phase 6 at [D35] |
| 3.7 | Fold-in block (ledger clearance) | ✅ COMPLETE 2026-08-11 (Waves A + B; C merged into the audit gate) |
| — | Whole-app cohesion + best-in-class + wording audit gate | after 3.7 |
| **4** | **Quality (test harness)** | ✅ **COMPLETE 2026-08-17**, on a green `32051842661`. ⭐ **26 proven · the device pass is 52 · derived, not asserted.** The CodeMagic build is cut |
| 5 | Data continuity + cutover | 🔒 ship-blocker, upcoming |
| 5.5 | Repo consolidation | before the release gate |
| 6 | Launch-ready **+ the 60 coverable-not-built rows AND 3.5's folded-in pass, as DEVICE-PASS work** *(🎯 2026-08-17, [D35])* | final |

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
  - ⚠️ **[raised 2026-08-17] THE FLIP INVALIDATES ANY LANE COVERAGE THAT RIDES A QA DOOR.** Phase 6's device pass runs against the **flipped** build while the lane runs unflipped, so such a row is green in the lane and unreachable in the artifact that ships. ✅ **4.1.10 was the one item about to depend on this, and its routing decision removed the dependency** — no §12 row rides a QA door. ⚠️ Still live for the *instruments*: `probeCoachMark`, the `coach-probe` readout, `suppressorReasons`, `RING_AUDIT` and `rm-probe` are all `qaEnabled()`-gated, so the flip's `git grep` must confirm they vanish **and** nothing has come to depend on them. ⛔ **Never let a coverage row ride a QA door again** — that is the general rule this near-miss bought.
- **Never push to `release/v1`** — it is the default branch and is gated on a live, approved version.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

---

## Phase 3.5 — what is LEFT

The build is complete (tutorial · bounded demo · coach-marks · capture pipeline). **The phase is not
signed off, because its OUTPUT is not final:**

| | Item | State |
|---|---|---|
| 1 | **3.5.7 — web-embeddable marketing demo** | ▶ **ACTIVE 2026-08-14 as the parallel track** (4.1 keeps precedence; this fills the waits). ✅ [D32] settles hosting + privacy. ⛔ **The "debt-free-date defect" blocker is STALE** — no live defect exists; the only match is filed *"the cohesion audit, not a defect"* and its two relatives are closed. Decomposed below |
| 2 | ~~The device pass~~ | ✅ **[D35] FOLDED INTO PHASE 6's, 🎯 2026-08-17.** The two overlapped the moment the 74 coverable-not-built rows went to Phase 6, and they span §11/§12 — exactly what this pass covered. One sitting, one checklist, no row run twice. ⚡ **3.5 now closes on its BUILD being done**, which it is |
| 3 | **3.5.9 — reinstate the demo ✅ DONE 2026-08-10** | [D21] reverses [D19]. `isDemoReachable()` no longer rides `QA_TOOLS`; both doors restored and now **tested** — nothing covered them before, which is how they were pulled unnoticed. Log: 3.5.9 |
| 5 | **3.5.10 — the INTERACTIVE demo ✅ DONE 2026-08-11** | 🎯 **[D23]**: the demo is now two runs. **`explore`** (a user: live tabs, no script, exit on the marker row) · **`scripted`** (the App-Preview + 3.5.7's embed only). One artifact had been doing both jobs and the video's requirements won. ⚠️ `useInBoundedRun` was deliberately **not** forked — a separate `useNavigationHeld()` answers the other question. Gate 158/158. Log: 3.5.10 |
| 4 | **The App-Preview asset must be RE-SHOT** | the pipeline is proven and cycle 14 approved, but the submitted file is shot after the UI settles → Phase 6 |

**Division of labour, now settled:** demo = BEFORE you commit (Welcome + paywall, sandboxed, terminal
exits) · walkthrough = AFTER onboarding, on your own money.

#### ✅ 3.5.7 — the embed _(CLOSED 2026-08-17 — **live at https://jsnyde03.github.io/debt-app-v1/**)_

✅ **.1–.7 and .9 DONE 2026-08-14/17.** `Slider` a11y · the analytics flag COLLAPSED (nothing to omit) ·
`sessionStorage`-only storage · the **zero-egress Playwright gate** in `validate:release:rn` · the embed
entry · the a11y state fix · ⭐ **the two exits → ONE App Store CTA**, a real `<a>`, gated on `EMBED_DEMO` ·
the privacy line **settled and rendered**. Detail + every scan → log.

### ▶ 3.5.7.8 — the GitHub Pages deploy _(active)_

⚠️ This is the moment the privacy claim becomes public, which is why .4's gate had to exist first.

| # | Step | State |
|---|---|---|
| **.1** | **`app.config.js` overlay** — `experiments.baseUrl` from `EXPO_PUBLIC_BASE_URL`, byte-inert when unset | ✅ |
| **.2** | **CanvasKit's `locateFile` base-aware and owned ONCE** | ✅ **SIX sites, not three** — `canvasKitOpts` + a `no-restricted-syntax` rule, proven on a plant |
| **.3** | **The embed gate serves from the BASE PATH** | ✅ build → `dist-embed/debt-app-v1`, served without `-s`, **10/10** · a new spec fails on ANY response ≥ 400 |
| **.4** | **The Pages workflow** | ✅ `embed-pages.yml` — base URL derived from the repo name, and it **asserts its own artifact** before publishing |
| **.5** | **Enable Pages, verify the live URL** | ✅ **LIVE 2026-08-17 — https://jsnyde03.github.io/debt-app-v1/** · **10/10 against the DEPLOYED page**, via `EMBED_LIVE_URL=… npm run test:e2e:embed` |

⭐ **[.5] LIVE, AND VERIFIED WHERE IT IS SERVED.** 🎯 authorised the two prerequisites 2026-08-17 (the
`release/v1` rule is his to lift): `embed-pages.yml` landed there as a **single-file, 88-line** commit —
a `workflow_dispatch`-only workflow triggers nothing by existing — and Pages was enabled with
`build_type=workflow`. ⚡ **`EMBED_LIVE_URL` points the whole gate at the deployed page**, so the ten
specs — boot, the five-beat arc, no-404s, the CTA, all three [D32] privacy claims — ran against
*jsnyde03.github.io*, not a local rebuild of it. A green deploy proves the bytes landed; this proves the
page.

⛔ **[.5 after-scan] THREE FAILURES BEFORE GREEN, AND ONLY THE FIRST WAS A CODE FAULT.**
① **`npm ci` at the root leaves `apps/rn` with no `node_modules`** — no workspaces here — and
`web-e2e.yml` **already documents this in a comment**, including that `npm ci` does *not* work in
`apps/rn` (its lockfile is out of sync). *The codebase already said it*, and a new workflow was written
without reading the one solving the same problem.
② **The `github-pages` environment carried a custom branch policy allowing only `release/v1`**, so the
deploy job was blocked while the build was perfectly green. ⚠️ Logs had already expired (`BlobNotFound`),
so it was found by **reading the environment's policy**, not the run. `v1.7-dev` added.
③ ⚠️ **THAT POLICY MUST BE REVISITED AT LAUNCH.** The embed's truth is `v1.7-dev` today; once v1.7 ships
it should build from `release/v1` and **`v1.7-dev` should come back off the list**, or a dev branch can
publish to a public marketing URL indefinitely. → **Phase 6.**

⚠️ **[.5 after-scan] "DEPLOYED" AND "PASSED THE GATE" ARE TWO FACTS HELD TOGETHER BY DISCIPLINE.** The
deploy is `workflow_dispatch`-only *deliberately* — a `push:` trigger would publish states no gate had
passed — but nothing checks that the dispatched SHA is green. The artifact assertion catches a blank site;
it cannot catch a regression that builds. → **Phase 6**, with the branch-policy flip.

**Exit:** a public embed whose privacy claim is enforced by a test that runs on every push, not asserted
in prose — and which is verified against the path it is actually served from.

⛔ **[before-scan] DEPLOYING AS-IS WOULD SHIP A BLANK PAGE — measured, not feared.** The embed's assets are
absolute from ROOT (`src="/_expo/static/js/web/…"`) and a GitHub Pages **project** site serves under
`/debt-app-v1/`, so every one of them 404s. That is this repo's nastiest regression class — the one
`route-smoke.spec.ts` exists for — arriving by deployment rather than by code. ⚡ **The fix is measured
too:** `experiments.baseUrl` via an `app.config.js` overlay rewrites them to `/debt-app-v1/_expo/…`.

⛔ **[before-scan] AND CANVASKIT WOULD STILL BREAK, because `locateFile` is hardcoded to root in THREE
FILES** — `AllocationBarCanvas.web.tsx`, `TrajectoryCanvas.web.tsx`, `CashRunwayCanvas.web.tsx`, each
carrying its own `(file) => \`/${file}\``. Under a base path the wasm 404s and **every Skia chart on the
embed's arc fails**, including beat 4, which is entirely about the curve. ⚡ It is already *three places,
one rule* — the shape this repo has been bitten by repeatedly — so .2 extracts it rather than editing it
three times.

⛔ **[before-scan] THE GATE PROVES THE EMBED WORKS AT ROOT; PAGES SERVES IT AT A SUBPATH.** The one
configuration that ships is the one nothing tests — `feedback_check_the_shipped_artifact` exactly, and the
reason .3 exists rather than being optional polish.

⛔⛔ **[.2 after-scan] THE CLASS WAS SIX SITES, NOT THREE — AND MY OWN `grep … | head -5` IS WHAT HID THE
OTHER THREE.** Fixing the three I could see produced an embed where **Money and Progress drew and Today
did not**: `CushionBarCanvas` was in the half nobody looked at. ⚡ Caught by a probe printing
`HTTP 404 /canvaskit.wasm` while the document sat happily on the base path — *not* by re-reading the code.
**Now a `no-restricted-syntax` rule**, proven on a planted seventh copy. ⚠️ *A truncated search reads
exactly like a complete one.*

⛔ **[.1 after-scan] MY OWN STATED MECHANISM WAS WRONG, AND THE ARTIFACT SAID SO.** The file claimed
`EXPO_BASE_URL` is *"inlined by the bundler, exactly like `EXPO_PUBLIC_EMBED`"*. **Metro inlines only
`EXPO_PUBLIC_*`** — so the HTML came out perfectly base-pathed while the browser read `undefined` and the
wasm 404'd at root. Renamed to **`EXPO_PUBLIC_BASE_URL`: one variable, two consumers** (`app.config.js` in
Node, the bundle in the browser). *A stated mechanism is a hypothesis until an artifact agrees with it.*

⚠️ **[.3 after-scan] `serve -s` WAS DROPPED DELIBERATELY, and dropping it is the assertion.** SPA rewriting
answers a missing `/debt-app-v1/_expo/…js` with **index.html and a 200**, making the local gate strictly
more forgiving than Pages, which does no rewriting at all. ⚠️ Also: `goto('/')` resolves **above** a
baseURL subpath (`new URL('/', base)`), so the specs use `goto('./')` — which is base-agnostic and repeats
the segment nowhere.

⚠️ **[before-scan] Git Bash mangles a leading-slash env value into a Windows path** — `EXPO_BASE_URL=/debt-app-v1`
became `C:/Program Files/Git/debt-app-v1` in the emitted HTML. Measured on the first probe. CI is Linux and
unaffected; a local Windows build needs `MSYS_NO_PATHCONV=1`, and without it the artifact looks plausible
and is wrong.

⛔ **[.7 after-scan, STANDING] The embed's dock is NOT the app's dock.** Any checklist row that names
*"Unlock Premium"* or *"Start my real plan"* is unprovable on the embed — see 4.1.10, whose routing this
corrected the same day.

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

**[4.1.9c before-scan, 2026-08-17] Two `maestro test` calls write no JUnit, so their verdicts never reach
the durable record** — `11-reduce-motion.yaml` and the iPad's dark re-run of `i02`. Both are measurement
runs today (no `COVERS:`; `i02`'s light run *is* recorded), so nothing is currently mis-stated. It is the
same hazard `maestro-results.mjs`'s header documents for flow `09`: **the next flow added in its own
invocation disappears from the record silently.** ⚠️ `lint:lane` is where this becomes a check —
*every `maestro test` call either writes a JUnit or declares itself a measurement.*

**[3.5.7.8 before-scan, 2026-08-17] The embed's public URL names the repo — `jsnyde03.github.io/debt-app-v1/`.**
Fine for an iframe, whose src nobody reads, and slightly off for anything a person lands on directly. A
custom domain (or a repo rename) removes it. **Not a blocker and deliberately not folded in** — it is a
brand call with a DNS dependency, and the deploy works either way. → 🎯 whenever the marketing page exists.

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
