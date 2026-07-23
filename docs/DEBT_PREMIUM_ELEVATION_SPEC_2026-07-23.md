# Debt Premium Elevation — Full Spec **v3** (2026-07-23)

> **v3 changelog** (folds in every round-3 design finding, `DEBT_PREMIUM_ELEVATION_AUDIT_ROUND3_2026-07-23.md`): a new **§2.0 Confidence-Governance layer** (the round-3 unifier — input-confidence gates both the *acting* and the *voice*); **corrected** floor-aware smoothing (F1, running-balance, reserve floor once), the **partition** (F3, split the buffer/leftover categories so the "all held as cushion" lie can't survive), and **reversed** the living-expense "cadence" fix (F7, it would have divided every user's amount by 2–4×); the **state-machine unified** across all *three* producers (F4); positioning **retires two decaying moat claims** and the honesty micro-fixes land. Concrete defaults are given for every mechanic; the genuinely **build-time** details are tagged **[BUILD]** so round 4 doesn't re-flag them as omissions. This is the artifact **round 4 (full, all angles)** audits.

IDs: **D…** = review decisions · **C…/F…** = round-2/round-3 findings.

---

## 1. Premium identity, positioning & the ladder

- **Identity = "it watches + acts so you don't have to."** Monitoring + automation of effort; free is a real companion, premium removes the work.
- **Positioning (v3, round-3 competitor):** **retire the two decaying claims** — "un-chattable" and "watches so you don't have to" (frontier assistants now have memory + scheduled tasks; synced rivals literally watch your bank). **Lead with the two that hold:** **(a) engine-grounded honesty** — it can't fabricate your numbers; **(b) automated, payday-cadence, debt-payoff-first planning** — zero YNAB-style hand-budgeting, aimed at the empty lane no incumbent occupies (debt-first × payday-cadence × fully-automated × on-device). Manual entry is the deliberate privacy tradeoff, not a hidden weakness.
- **The price test** (run on every feature 2.3–2.11): *removing it must remove WORK, not just info.*
- **Four-tier ladder:** Free · **Premium ~$4.99** (automation, on-device) · **Premium Connected +$5** (opt-in Plaid, ~v1.8 — **convenience, never accuracy**; retention claims scoped to *our* backend, Plaid named) · **Ava AI** (future).
- **Privacy = "private by default."** The **"E2EE" word is used only if verified true (F-trust #8): [BUILD] confirm iOS exposes an ADP-status API; if not, say "encrypted iCloud backup" everywhere and frame ADP as user-controlled education without claiming detection.** Reconcile the stale "E2EE-by-construction" line in the capstone strategy doc.
- **One free/premium line:** *"free tells you; premium does it."*
- **Distribution:** the differentiated Guardian **is** the marketing lever → a **demo-safe premium showcase (§3.6) is launch-critical**; GTM/ASO is first-class.

---

## 2. The Payday Cushion Guardian

### 2.0 Confidence-Governance layer (NEW in v3 — the round-3 unifier, Theme A)
The Guardian's read is only as trustworthy as its inputs. A single **confidence model** measures how much to trust this cycle's read, and **gates both the acting and the voice** so the app never presents a decisive action or a confident sentence on inputs it can't stand behind. *The boundary is enforced, not just stated.*

- **Input-confidence signals** (each 0–1, combined to an overall `readConfidence`):
  1. **Bill-completeness** — has the user demonstrated their obligation set is complete? Proxy: cycles since onboarding + whether reconciliations have surfaced un-modeled outflows (from §3.2). Low for a brand-new user.
  2. **Lean-verification depth** — for variable income, how many *actual* paychecks have confirmed the lean floor *from the low side* (§2.3). Low at cold-start.
  3. **Estimate-staleness** — `EstimateConfidence.staleness` (already computed): fresh/aging/stale.
  4. **Income-modelability** — is income representable by a lean scalar, or is it high-variance/seasonal (§2.3)?
- **Action gating:**
  - **Discovery buffer:** while bill-completeness is low (first **N=3** cycles, [BUILD] tunable), the Guardian **does not deploy 100% of headroom above the floor** — it holds a fraction (default **40%** of above-floor headroom) as an un-modeled-surprise reserve, decaying to 0 as completeness is demonstrated.
  - **Cold-start lean:** do **not** issue a confident "deploy the spare / you're covered" state until **≥N=4** actuals have confirmed the lean held from the low side; until then, deploy conservatively and frame reads as provisional.
  - **Hard staleness cutoff:** beyond **staleness = "stale"** (`ESTIMATE_STALE_DAYS`), the Guardian **stops naming deploy amounts and drops the "covered → deploy" state entirely** → degrades to *"I can't see far enough to plan — verify your balances to re-enable this."* Behavioral, not tonal.
- **Voice gating — the hedge budget:** **at most ONE hedge surfaces per read**, chosen by the *dominant* uncertainty (staleness > lean-unverified > unproven-accuracy > observation-caution); the others adjust `readConfidence` **silently** (they do not appear in copy). This kills the round-3 hedge-stacking.
- **Reconcile 2.1 ↔ 2.3:** auto-maintenance keeps balances current, so **staleness below the "aging" threshold does NOT trigger a voice hedge** — the auto-maintained-and-recent case stays fully decisive (no contradiction with "always current").
- **Cold-start = a VALUE state, not an apology:** the "watches" half works on day one before any accuracy is proven → *"I'm watching every paycheck from today; I'll show my track record after a few cycles."* Paywall copy (§2.10, §4/2.10) advertises **watch-from-day-one**, never proven precision.

### 2.1 The promise & the voice
- **Promise (D1.1):** *"will I make it this paycheck?"* + boundary *"based on what you've entered — not your bank"*; strength = **"private by default."**
- **Voice (D2.1):** active **plan-shaping** ("I've set this paycheck to…"), never custody; completed-action words only for real executions. Subject to the **hedge budget (§2.0)**.
- **False-reassurance guard (D2.2):** clear state is an **observation** ("Looks clear this paycheck") — and, per §2.0, the *deploy* it implies is **dampened by the discovery buffer**, not just hedged in copy.
- **Advice boundary (F-trust #7):** a one-time *"guidance from your numbers, not financial advice"* at first premium use **+ a persistent light "your call" affordance on the decisive per-cycle plan** (rides the existing mark-when-ready). **Classifier:** allocation calls with a genuine finance tradeoff (liquidity-vs-APR, EF-vs-debt) are always **two-sided-with-a-why**; only mechanical no-tradeoff moves get the single decisive voice.

### 2.2 The data model (the honest core)
- **Exhaustive partition — CORRECTED (F3, the lie that survived).** The engine today emits **"Keep cash buffer"** and **"Leftover cash"** under one `leftover` category, so `selectLiquidCushion` sums both → "$700 cushion" when only $200 is protected. **Fix: split into distinct categories** — `cushion_buffer` (the reserved floor) vs `true_leftover` (residual) — plus `emergency`, `snowball` (debt), `optional_goal`. **`cushion` = `cushion_buffer` ONLY.** The partition = **Cushion · Emergency fund · Debt · Goals · true Leftover**, and the two-zone bar's "put to work" zone = `discretionary − cushion` (so true-leftover-not-put-to-work is representable). Reconciliation test asserts `sum(all 5 buckets) === discretionary` to **±$0.01 per allocation line** (N = allocation-item count), with the **shortfall case** (`discretionary` clamped to 0) explicitly asserted. **[BUILD] the category→bucket table + all four category-summing selector updates land together in 2.4.6.1.**
- **One metric, one state machine — ACROSS ALL THREE PRODUCERS (F4).** Code has *three* state producers: the card (`buildGuardianBrief`), the forecast (`toCushionStatus(endingBalance)`), and `selectPlanSummary` (its own `paycheckAmount*0.1` threshold). **Fix: one shared `computeState(discretionary, floor, priorBand)`; migrate all three call sites; `TimelineCycle` gains per-cycle `discretionary`; the lookahead reads floor-relative headroom, never `endingBalance`.**
- **Hysteresis — concrete (F4).** `computeState` takes the **prior band**; **enter-tight at `discretionary < floor`, exit-tight only at `discretionary > floor + BAND`** with **`BAND = $50`** ([BUILD] tunable, Phase 6). The **at-risk** boundary is **floor-relative** (`discretionary < floor × 0.5`, replacing the hardcoded `<100`), with its own hysteresis. Shortfall dead-band: ignore `shortfall < $5`. The prior band is **persisted** and **reloaded across rollover**; **[BUILD] define the missed-rollover case** (a stale "tight" prior must not suppress a legitimate "clear").
- **Living-expense reserve — LEAVE AS IS (F7, reversing round 2).** The field is **already per-paycheck by design** (UI: "set aside each paycheck"); the engine summing it raw per cycle is correct. **Do NOT add a "cadence" migration** — it would re-read every existing amount as monthly and divide by 2–4× (a false-clear for the install base). If a cadence field is ever added, it defaults to **per-paycheck** and preserves amounts verbatim.
- **Card (D1.2 → two-zone, hard-capped):** state line · two-zone bar (cushion + floor line vs put-to-work) · one read sentence · ≤3 plan steps · one control. The hero's Required/Everyday/Free bar and the Guardian bar are a **zoom-in** (obligation split → discretionary sub-split), not two peer bars. Scorecard → drill-down.

### 2.3 Variable / irregular income (v1.7)
- **Plan for the valley (D3.1);** projected cycles allocate on **`lean`** (the valley reaches the forecast, F3-r2/correctness #3).
- **Income-modelability gate (round-3 red-team #4):** if the actuals show **high variance / seasonality** (coefficient of variation over a threshold, or a month-of-year signal), the Guardian **honestly degrades** rather than lying with a scalar lean: *"Your income's too variable for me to promise a floor — here's this paycheck only, no forward valley."* A degraded honest state beats a scalar that's wrong in both directions. Feeds `readConfidence` (§2.0).
- **Capture (D3.2):** varies-toggle surfaced **after a logged paycheck differs** from entered (not first-run); lean (required, *"the floor you can count on"*) + typical (optional). Relate the two floors: **lean income feeds the plan; the cushion line is protected within it** (different numbers, copy says so). **[BUILD] toggle-transition re-anchors drift + re-projects (§3.3).**
- **Learning — CORRECTED low-N (F6).** Below **N=12** actuals, lean = a **shrinkage blend toward `typical`** (a fixed haircut, [BUILD] default 15% under typical), NOT a percentile (a 10–15th percentile of 4–6 points ≈ the raw min it's meant to avoid). At **N≥12**, transition to a defined **low quantile (12th percentile, linear interpolation)**. The **up-nudge** ("you've reliably cleared $X — trust more?") is a **separate explicit rule** with precedence over the down-path; **outlier-guard** the actuals (a single wild entry can't move lean; a large lean shift requires confirm — round-3 red-team #8). Suggest-and-confirm, never silent.
- **Debt-free date — one engine, TWO runs, a BAND (cross-cutting F).** Reconcile the *three* current producers (state-threaded forecast, `selectDebtFreeDate`'s `projectDebtPayoff`, aspirational typical) into **one projection engine run twice** — on **lean** and on **typical**. Show **the typical (motivational) date as the headline**, lean as the "safe-floor" secondary — not a bare symmetric range (which invites anchoring on the rosy end and inverts intuitively). The **interest-cost-of-caution is rounded/qualitative** (*"somewhat more interest"* or a rounded band), never a false-precise `$X`, until the state-threaded forecast is proven (round-3 trust #6).

### 2.4 The acting — auto-protect the cushion floor (built, 2.4.6)
- Premium reserves the **cushion floor** (default $200, adjustable) as the paycheck buffer; only discretionary money moves; obligations never cut; spending user-executed. **Deploy above the floor is now governed by §2.0** (discovery buffer / cold-start / staleness). **Floor set below a data-derived safe minimum → a one-time honest warning (not a lock); toggling varies→fixed for a demonstrably-variable earner surfaces the ranged-income caution** (round-3 red-team #5).

### 2.5 The cash-flow brain (2.4.7)
- **State-threaded forecast (C5).** `applyRolloverPayment` **exists**; the projection loop must, per cycle, **allocate (on lean for variable income) → apply minimum+snowball to reduce each debt's balance → advance each goal's `currentAmount` → roll due dates → filter**. A retired debt frees its minimum into the next cycle's `discretionary` (verified sound). **[BUILD] the exact per-iteration order + which allocation-order version the projection uses is pinned in 2.4.D with reconciliation tests.**
- **Recovery / smoothing — CORRECTED (F1, was over-conservative).** Model a **running balance with carryover**, not per-cycle floor subtraction: `bal_0 = current cushion; bal_k = bal_{k−1} + net_k` (net = income − required − living). The **crunch boundary = the first cycle where `bal_k < floor`**; moveable surplus = the running balance *above the floor*, reserving the floor **once**, not `k×`. (The old `max(0, net−floor)` invented crunches.) Timing-vs-structural: a crunch is smoothable iff earlier running-balance headroom covers it; else describe the **gap** honestly (no faked set-aside, no blamed guessed cost).
- **Surplus waterfall — re-architecture with categories, and pre-fund as an INPUT not a rung (F2).** Order: **floor → [pre-funded reserve, injected as an *input* to the per-cycle allocator from the multi-cycle smoothing layer — NOT a rung inside single-cycle `allocatePaycheck`] → starter EF (gated) → highest-priority debt → fuller EF/goals → accelerate → wealth.** New categories: `prefunded_reserve`, `starter_emergency` (vs existing `emergency` for fuller). **"Highest-priority debt" follows the user's strategy** (snowball = smallest balance, avalanche = highest APR) — *not* a hardcoded "high-APR" (which contradicts snowball mode). **[BUILD] the starter-vs-fuller-EF split value + the D5.3 gate's stored answer + selector updates land in 2.4.7 with reconciliation.**
- **Deploy-amount safety:** the named deploy target/amount is derived from the **actual** snowball allocation (not a re-rank), guarded so min-only-projected balances can't name/overstate a debt.
- **Posture:** auto-apply protective; create-goal/deploy = one-tap confirm; obligations never cut.

### 2.6 Surfaces
- **Card:** §2.2 (hard-capped, calm register — one quiet fill, no count-up/haptic).
- **Drill-down (D5.2) — a route with mechanics:** deep-link into the elevated Progress cushion view with params forcing `segment=Cushion`, scroll-to + focus, a **Guardian-sourced header** the standalone visitor doesn't get, and an **announced** context switch; **a pushed-modal route is preferred over a silent tab-jump** (preserves "came from Today" + back). Forecast draws the **floor line across it** (shared token set + line treatment with the card — F-UX #4), crunch highlighted, per-cycle "why" (reuse `TimelineLedger`), calm motion matching the card.
- **Accessibility — a contract for EVERY new piece:** the adjust-line control, the plan-step summary, and the scorecard render **outside** the narrated `groupLabel` (the collapse recurs otherwise); the bar has a real `accessibilityValue`; `announce()` on floor change; forecast authored as readable per-cycle text; plan steps styled **non-interactive**; state redundant (icon + title, not color only); high-contrast verified.

### 2.7 Graduation — debt-free (D4.1)
- The Guardian **persists** past debt-free + re-tops (debt drops → EF → goals → wealth); celebration; earned Freedom invite (**convenience, not "the accurate version"**). **Fix (F8): `selectPaydayGuardian` ≠ null at $0, AND a debt-free-aware copy branch** — deploy target = EF/goals/wealth, never mislabeled "cushion"; the scorecard + income-learning have a defined persists-past-debt state.

### 2.8 Proactive notification (v1.7)
- **A neutral prompt, not a verdict (F-trust #4).** The banner **under-claims relative to any reconciled state** — *"Time to check this paycheck"* (neutral), never *"looks tight"* (a verdict a reconcile-to-clear turns into cried-wolf). Any risk word is reserved for states **stable across the provisional→reconciled delta** (a confirmed structural deficit, not a projection blip). On open-after-reconcile-to-clear, **acknowledge it** ("good news — this one looks clear after all"). The hedged number appears **only in-app**; deep-links into the drill-down.
- **Fires on RISK with chronic-risk suppression + a frequency cap.** Escalate on **change** (new/worse crunch), AND a hard **max of N=2 risk pushes per rolling month** regardless of change (round-3 red-team #6 — a volatile-bad user's every-cycle "change" would otherwise fire weekly). User cadence control ("only shortfalls I can't cover" / "monthly digest").
- **Mechanism (F-completeness #3, resolved): schedule-time compute + provisional-schedule-then-reconcile**, with the honest acknowledgment that a **never-opened user gets the provisional read** (so the banner's neutrality matters most for them). Requires a **`lastNotifiedRisk`/`lastNotifiedCycle`** field (§3.1) to detect change. **[BUILD] verify reliability across rollover-while-backgrounded.** Built with the native batch (2.9); honest interim copy until it ships.

### 2.9 Calibration + scorecard (v1.7, reworked)
- **Internal (silent) calibration first;** confidence scales with proven accuracy → feeds `readConfidence` (§2.0). Unproven → the **cold-start VALUE state (§2.0)**, never an apology or a number.
- **Honest visible scorecard:** measures *"how often my read matched what you confirmed,"* with a plain **"what this proves"** line (so it's read as neither "kept you safe" nor "agreed with itself"); **false-clear and false-tight reported separately**; the **warn threshold is decoupled** from the displayed number. **Bad-record copy branches on the dominant error (F-trust #2):** a false-tight-heavy record → "I've been over-cautious, recalibrating"; a **false-clear-heavy record OWNS the miss** → *"I've under-warned — I've tightened my read"* (never softened to "over-cautious," the one direction we can't spin). **Fixed-income users** (no lean–typical band) score **obligation-timing / discretionary-headroom prediction vs. confirmed outcome**, not "cushion held" (which holds by construction) — F-trust #5. Gated **N≥4**, homed in the drill-down. **[BUILD] disturbed-cycle exclusion (§3.2).**

### 2.10 Free vs premium (value-led, D2.3)
- Free **always helps** — honest read + universal safe guidance when tight + the invitation; the personalized multi-cycle plan is the premium line. Paywall advertises **watch-from-day-one**, not proven precision.

### 2.11 Hardening (2.4.6.1, before 2.4.7)
- Partition split + categories + reconciliation test (§2.2) · `computeState` unified across all three producers + concrete hysteresis · at-risk floor-relative · focus from the actual allocation · no "$0" nonzero · windfall not repeated · VoiceOver-reachable adjust-line · hide adjust-in-shortfall · animate-once · framing reshapes · the §2.0 confidence-governance action/voice gates.

---

## 3. The Data Substrate (structure-first, v1.7 — `2.4.D`, first)

- **3.1 Schema (v4→v5).** `PaycheckConfig` += `incomeVaries`, `leanAmount`, `typicalAmount`. `PayCycleSnapshot` += prediction stamp (`predictedCushion`, `predictedState`, `predictedShortfall`) + outcome (`actualIncome`, `actualCushionHeld`, `outcomeConfirmed`, **`disturbed`**) + **`lastNotifiedRisk`/`lastNotifiedCycle`**. Income-actuals log. Persisted **prior band** (for §2.2 hysteresis). Migration backfills to safe defaults (fixed income, empty history, no hedge).
- **3.2 Two-touchpoint capture — with a DEFINED trigger + re-stamp policy (F5, fresh-eyes #8).** The prediction is stamped **once per cycle by a defined event — the rollover that creates the cycle (or the first Guardian compute after it), via an explicit store mutation, NOT inside the pure selector**. On a material mid-cycle change (`shouldReAnchor` transition), **re-stamp AND flag the cycle `disturbed`**; **disturbed cycles are excluded from the N≥4 calibration count** so neither the record nor the honesty claim is contaminated. Actual reconciled at rollover (via `applyCapture`, which today logs neither). One pipeline feeds both learning + calibration.
- **3.3 `shouldReAnchor` learns income** — add the varies-toggle + a material lean change to the re-anchor set; define the fixed↔varies transition (re-anchor drift, re-project).
- **3.4 Forecast state-threading** — the §2.5 loop; the C5 blocker; reconciliation-tested.
- **3.5 Cold-start contract** — every learning/calibration surface has a defined empty/low-data state + min-N (learning shrinkage < N=12; scorecard number < N=4; hedge-hard confidence until then); ties to §2.0. Cold-start is 100% of week-one users.
- **3.6 Demo/showcase substrate (launch-critical)** — a scripted premium demo state (tight cycle + flush cycle + income-varies + populated actuals/scorecard), separate from the free explore-seed (which disables Autopilot). Decide: second seed vs. a demo "preview premium" toggle.
- Reconciliation-tested throughout.

---

## 4. The rest of the premium tier
- **2.3 auto-maintenance (BUILT).** *v3:* the Guardian's staleness handling is the §2.0 gate, not a per-sentence hedge; reconciled with "always current."
- **2.5 smart-obligation — must ACT + bias to INCLUSION.** Auto-holds pending confirm (not a passive flag); classifier only ever cautions toward *inclusion* (never silently excludes → a dropped bill = a false-clear). **Ships with/before the Guardian, or interim Guardian copy is non-alarming on thin data** (min-only balances + a miscounted obligation both push toward false alarms in the launch window).
- **2.6 close-the-loop — sell the RECONCILE, not the nag.** Homes the Drift→Guardian contract + anchor unification + the calibration loop.
- **2.7 scan-to-prefill** — reduces entry (a partial answer to the manual-entry retention exposure the competitor teardown flagged). Fast-follow.
- **2.8 momentum — RETENTION, free layer; only custom share-art premium.** Never in the price justification.
- **2.9 widget + App Intents + notifications** — includes the §2.8 notification.
- **2.10 revenue spine** — RevenueCat + paywall (inherits the in-app hedging + watch-from-day-one framing; **no "always-watching precision"**) + Lifetime + portfolio-sub + analytics/Sentry; launch-flip gated on value. **[DECISION] Lifetime-vs-portfolio-sub cannibalization** — define Lifetime's scope publicly + the graduate path.
- **2.11 E2EE iCloud + AU/NZ** — "E2EE" wording gated per §1.
- **~v1.8 Connected** — Plaid; convenience-not-accuracy; retention claims scoped to our backend, Plaid named. **Future: Ava.**

## 5. Cross-cutting principles
1. Private by default; "E2EE" only where verified true.
2. Honesty over polish — and **the honesty is enforced (§2.0), not just stated**: action + voice are gated by input-confidence.
3. One free/premium line ("free tells you, premium does it").
4. Auto-apply protective; confirm to spend/create; obligations never cut.
5. Confidence scales with proven accuracy — earn trust, don't assert it; **cold-start is a value state, not an apology.**
6. Removes work, not just info.
7. Watches + acts so you don't have to (the identity) — **positioned on the two durable claims** (engine-grounded honesty + automated payday-debt focus), the two decaying ones retired.
8. Distribution is the job too — ship the differentiated feature *visible*.

## 6. Build order
**2.4.D data substrate (schema + §3.2 capture + §3.4 state-threading)** → **2.4.6.1 hardening (partition split + `computeState` + confidence-gates)** → **2.4.7 cash-flow brain (running-balance smoothing + waterfall re-arch + valley-into-forecast + learning)** → **2.4.8 graduation** → **2.4.9 calibration + scorecard** → **2.4.10 notification** → **2.4.11 reshapes + demo showcase** → rest of the tier (2.5 with/before Guardian → 2.6 → 2.7 → 2.8 → 2.9 → 2.10 → 2.11). Connected ~v1.8; Ava future.

## 7. What is deliberately **[BUILD]-time** (so round 4 doesn't re-flag as omission)
These are pinned to **defaults** here but finalized in the structure-first build with reconciliation tests as the ratchet (a prose spec can't be as precise as code+tests): the exact projection **loop order**; the category→bucket selector wiring; the hysteresis `BAND`, discovery-buffer fraction, staleness cutoff, and CoV/seasonality thresholds (all real-use-tunable, Phase 6); the ADP-detection API's existence; notification reliability across backgrounded rollover. Everything **design-level** (the §2.0 layer, the F1/F3/F7 corrections, the state-machine unification, positioning, the honesty policies) is settled here for round 4 to verify.
