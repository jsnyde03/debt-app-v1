# Debt Premium Elevation — Full Spec **v2** (2026-07-23)

> **v2 changelog:** every round-2 audit fix is folded in (`DEBT_PREMIUM_ELEVATION_AUDIT_ROUND2_2026-07-23.md` §Resolution). Decision: **ship the full v1.7, nothing half-hardened** — the audit findings are the quality bar, not a cut list. New in v2: a first-class **§3 Data Substrate**, the **identity reframe** (watches + acts), the **scorecard rework**, the **state-threaded forecast**, **floor-aware smoothing**, **real hysteresis**, the **valley-into-forecast** wiring, and the honesty/marketing reshapes. This is the artifact **round 3** audits.

Decision IDs (**D1.1**…) → `DEBT_GUARDIAN_REVIEW_DECISIONS_2026-07-23.md`. Round-2 tags (**C1**…) → the round-2 synthesis.

---

## 1. Premium identity & the ladder

- **Identity = "it watches + acts so you don't have to."** (v2 reframe, C7.) Not "intelligence" — **effort removal**: the app monitors your cash-flow every cycle and acts (protects the cushion, shapes the plan) so you don't have to do the math or the deciding. Monitoring itself is part of the value (the "watches" half legitimizes the notification + calibration; the "acts" half is the auto-protect + waterfall). Free is a real companion; premium removes the work.
- **The price test, applied to every feature:** *removing it must remove WORK, not just information.* (v2: run it honestly on all of 2.3–2.11; momentum is retention, never in the price justification.)
- **Four-tier ladder:** Free (on-device front door) · **Premium ~$4.99** (automation, on-device) · **Premium Connected +$5** (opt-in Plaid, ~v1.8; positioned as **convenience, never accuracy**, C-tier #6) · **Ava AI** (future).
- **Privacy = "private by default" (D1.1).** Not an absolute "never touch your bank" (breaks at Connected). The **"E2EE" word is used only where it's true** (C-trust #4): iCloud Advanced Data Protection is off by default → standard CloudKit is Apple-key-escrowed, so the backup is "encrypted iCloud backup" unless ADP is detected on, with a one-tap "turn on ADP for full E2EE" education step.
- **Free / premium line (D6.2, C-tier #5 — one line, not four):** the *single* principle is **"free tells you; premium does it."** Free = the honest read every cycle + universal safe guidance when tight (a real taste). Premium = the acting + planning (auto-protect · recovery plan · surplus waterfall · income learning · calibration · drill-down). Every gate is checked against this one line.
- **Distribution (Jason): the bottleneck is distribution — and the differentiated Guardian IS the distribution lever.** A me-too planner has no ASO/review/word-of-mouth story; the Guardian is the story. So a **demo-safe premium showcase** (below, §3.6) is **launch-critical**, and GTM/ASO is first-class alongside the build.

---

## 2. The Payday Cushion Guardian (flagship)

### 2.1 The promise & the voice
- **Promise (D1.1):** the visceral *"will I make it this paycheck?"* hook + the factual boundary *"based on what you've entered — not your bank"*; privacy strength = **"private by default."**
- **Voice (D2.1):** active **plan-shaping** — *"I've set this paycheck to keep $200 as your cushion and put the spare to work — $400 to your emergency fund, $60 to debt. Mark them when you're ready."* Real agency (it shaped the plan), **never custody** ("holding/sent/moved"). Completed-action words only for real executions.
- **Voice rides estimates → voice carries the hedge (C-trust #3, new).** The Guardian's plan is computed off *projected* balances (2.3, min-only). When the driving estimates are aging/stale (the `EstimateConfidence.staleness` the code already exposes), the voice softens proportionally (*"based on your last verified balances…"*) — the certainty of the sentence tracks the certainty of its inputs.
- **False-reassurance guard (D2.2):** the clear state is an **observation, not a guarantee** — *"Looks clear this paycheck"*; any deploy-the-spare nudge carries *"…if nothing unexpected's coming up."*
- **Advice boundary (C-trust #8, new):** a light one-time *"this is guidance from your numbers, not financial advice"* at first premium use; genuine finance-disagreement calls (EF-vs-APR) stay a two-sided **choice with a why**, never a single verdict dressed as a choice.

### 2.2 The data model (the honest core)
- **Exhaustive partition — THREADED, not just declared (C4, the round-1 lie that survived).** `GuardianInput/GuardianBrief` and the bar carry the **full** partition: **Cushion · Emergency fund · Debt · Goals · true Leftover**. The "put to work" copy branches on **all non-cushion buckets ≠ 0** (not just snowball), and the bar's "put to work" zone = `discretionary − cushion`. A **reconciliation test asserts `sum(buckets) === discretionary`** to a defined **±$0.01·N tolerance** (rounding across sequential `roundMoney` steps).
- **One metric everywhere (D1.3):** band, lookahead, AND the Progress cash-flow bars all read floor-relative **headroom** (per-cycle `discretionary` vs floor) — never post-buffer `endingBalance`/fixed-thresholds.
- **One canonical vocabulary + one state enum (D2.4, C-UX #3):** the partition names are the only money words on Today; **"cushion" = the liquid floor-protected safety only.** **One three-state enum** shared by card and forecast (the current `clear/tight/at-risk` vs `stable/tight/pressure` split is collapsed) + **one shared token set** (Progress bars stop using hardcoded hex).
- **Real hysteresis — SPEC'd, not just named (C4/correctness #5):** `buildGuardianBrief` takes the **prior band** as input; **enter-tight at `discretionary < floor`, exit-tight only at `discretionary > floor + band`** (separate enter/exit thresholds); shortfall gets its own small dead-band (ignore `< ~$5`). The prior band is persisted; the notification + calibration read the **hysteretic** band (documented, so surfaces can't disagree).
- **Living-expense cadence (correctness #8):** `livingExpenseReserve` is normalized to the pay cycle — a monthly rent entered against a weekly paycheck must not reserve the full amount every week (it 3–4× under-counts `discretionary`, the metric everything routes through). Confirm the capture cadence; prorate or add a `cadence` field.
- **Card representation (D1.2 → (a), C-UX #1):** a calm **two-zone bar** — cushion (with the floor line) vs money put to work — with copy naming the top buckets; the full itemization is in the drill-down. The card is **hard-capped** (state line · bar · one read sentence · ≤3 plan steps · one control) and the **hero's Required/Everyday/Free bar and the Guardian bar are related as a zoom-in** (obligation split → discretionary sub-split), never two peer bars answering the same question. The scorecard lives in the **drill-down**, not the card.

### 2.3 Variable / irregular income (v1.7, mainstream)
- **Plan for the valley (D3.1):** build on the **conservative (lean) end**; anything above is a **bonus** into the waterfall.
- **Valley threaded INTO the forecast (C4/correctness #3, new).** Projected cycles (i ≥ 1) for a variable-income user allocate on **`lean`**, not this paycheck's actual — so crunch detection, the prefix-sum boundary, and the lookahead are conservative; the current cycle keeps the actual paycheck (bonus flows this cycle only).
- **Capture (D3.2, C-UX #6):** a "my income varies" toggle → **lean** (required — coached as *the floor you can count on, not your average*) + **typical** (optional). **Data-driven placement:** surface the toggle **after a logged paycheck differs from what was entered** (not inside first-run setup, the abandonment-prone moment). **Relate the two floors** in copy — the **lean income floor** feeds the plan; the **cushion line** is what's protected within it (they are different numbers; the copy says so).
- **Learning (D3.3, robust — correctness #6):** record each **actual** paycheck; set/refine lean from a **robust low percentile (~10–15th / IQR-trimmed), not the raw sample min** (the min ratchets down forever and one unpaid-leave check wrecks it); the suggestion can nudge lean **up** as well as down (*"you've reliably cleared $2,100 for six cycles — trust more of it?"*). Suggest-and-confirm, never silent.
- **One canonical debt-free date as a BAND (C-trust #2, correctness #7):** not two silent numbers (Guardian-on-lean vs app-on-typical). Show *"debt-free ~{lean date} – {typical date}"*; the aspirational trajectory uses **typical** recurring extra (not lean × min-only, which compounds into a demotivating date); **name the interest cost of caution** (*"planning lean is safe, but ~$X more interest than planning typical — your call"*).

### 2.4 The acting — auto-protect the cushion floor (built, 2.4.6)
- Premium reserves the **cushion floor** (default $200, adjustable) as the paycheck buffer; the whole plan auto-protects the cushion before extra payoff. **Only discretionary money moves; obligations are never cut.** Spending stays user-executed (mark-paid).

### 2.5 The cash-flow brain (2.4.7)
- **The multi-cycle forecast is STATE-THREADED (C5, the biggest correctness blocker).** Across projected cycles, each debt's balance is **reduced** by minimum+snowball (via `applyRolloverPayment`) and each goal's `currentAmount` **advanced** by that cycle's EF/goal allocations before the next `allocatePaycheck` — so debts retire and the EF stops re-funding forever. The drill-down forecast, the waterfall, and the prefix-sum net are unsafe until this holds.
- **Recovery / smoothing (D5.1) — FLOOR-AWARE (correctness #4).** Timing-vs-structural is a running **prefix-sum**, but "surplus" available to move forward is **`max(0, net − floor)`** (headroom above the cushion, not raw net) — so pre-funding never raids the cushion it protects. `cumulative_surplus(1..k−1) ≥ cumulative_deficit(1..k)`; the first cycle it fails is the boundary. Structural deficit → describe the **gap** (never a faked set-aside, never blaming a guessed cost).
- **Surplus waterfall — allocation-order RE-ARCHITECTURE (correctness secondary).** The engine currently funds the EF to full *before* any snowball and can't express "starter-vs-fuller EF" or the EF gate. 2.4.7 re-architects `allocatePaycheck`'s order to: **floor → pre-fund crunches → starter EF (gated) → high-APR debt → fuller EF/goals → accelerate → wealth**. EF rung gated on *"already have savings elsewhere?"* (D5.3); ordering offered as a **choice with a why**.
- **Deploy-amount safety (correctness secondary).** The named deploy target/amount is derived from the **actual** snowball allocation, and guarded so min-only-projected balances can't name/overstate a debt the user can't actually pay into.
- **Posture:** auto-apply protective; **create-goal / deploy = one-tap confirm** (never auto-spend/create).

### 2.6 Surfaces
- **The card (Today):** state + read + two-zone bar (floor line) + a **1–3 step "path back" / "best use"**, hard-capped (§2.2). **Calm register** (one quiet fill, no count-up/haptic).
- **The drill-down (D5.2) — a ROUTE with real mechanics (C-UX #4).** Deep-links into the **elevated Progress cushion view** with params that force `segment=Cushion`, scroll-to + focus the section, render a **Guardian-sourced header** ("Your cushion plan — from the Guardian") the standalone Progress visitor doesn't get, and **announce** the context switch; a **pushed-modal route is preferred over a silent tab-jump** so the "came from Today" thread + back button survive. The forecast draws the **floor line across it**, crunch highlighted, per-cycle "why" (reuse `TimelineLedger`). Clear = a clean bill of health.
- **Floor-line motif unified (C-UX #4):** the Guardian bar (Skia) and the Progress forecast bars (currently RN gradient + hardcoded hex, no floor line) share **one token set + one floor-line treatment**, so the motif doesn't break at the exact card→drill-down handoff. Motion coherence: the forecast in the "one destination" matches the card's calm register.
- **Accessibility — a contract for EVERY new piece (C-UX #5).** The "Adjust your line" control, the **plan-step summary**, and the **scorecard** are rendered as siblings **outside** the narrated `groupLabel` container (the round-1 collapse recurs otherwise). The bar has a real **`accessibilityValue`/text equivalent** (cushion vs floor vs deployed); `announce()` on a floor change; the drill-down forecast authored as **readable per-cycle text**; plan steps styled clearly **non-interactive** (no chevron/checkbox) so they don't mimic the actionable Required/Recommended rows; state carried redundantly (icon + title, not color only); high-contrast / reduce-transparency verified.

### 2.7 Graduation — debt-free (D4.1)
- The Guardian **persists past debt-free** (cushion/cash-flow matters forever — the churn answer); the waterfall **re-tops** (debt drops → surplus flows EF → goals → wealth). The debt-free **moment** = the Phase-3 celebration. The **Freedom handoff = an earned, honest invitation** at the top — light nudge, never a redirect; Connected/Freedom positioned as **convenience, not "the accurate version."** **Fix:** `selectPaydayGuardian` must not return null at `liveDebts=0`; the scorecard + income-learning have a defined persists-past-debt state.

### 2.8 Proactive notification (v1.7, C6)
- A payday-window **local** notification that is a **prompt to look, never a figure** — *"This paycheck looks tight — open to see your plan"* (the hedged number only ever appears in-app; a banner can't carry the caveats). **Fires only on RISK**, with **chronic-risk suppression** — escalate only on **change** (a new/worse crunch), not steady-state bad news each cycle (else the structural-deficit user learns to mute it). Allow **earned past-tense positives** (*"last paycheck's cushion held"* — safe because it's confirmed history) so the channel isn't purely aversive. **Deep-links into the drill-down.**
- **Mechanism (C-completeness #3, decided):** **schedule-time compute** — recompute the Guardian read at each app-open/rollover and bake the risk read into the payday-window date-notification; "fire only on risk" via **provisional-schedule-then-reconcile** (schedule provisionally, cancel/rewrite on next open). No dependence on unreliable iOS background execution. Built with the native batch (2.9); honest interim copy ("checks every payday") until it ships.

### 2.9 Calibration + scorecard (v1.7, REWORKED — C1, the 4-lens convergence)
- **Internal (silent) calibration first:** capture **predicted-vs-actual** each cycle; **confidence scales with proven accuracy for this user** — unproven → hedges harder (*"still learning your pattern"*, never a number).
- **The visible scorecard is the honest version, or it doesn't ship:** it measures *"how often my read **matched what you confirmed**"* (model-match, not "kept you safe"); reports **false-clear and false-tight separately** (never one blended tally — a false-clear is the more harmful error); the **warn threshold is hard-decoupled from the displayed number** (kills the under-warn-to-protect-the-record incentive); it also **scores the bonus-side prediction** (did income land in lean–typical?) so it measures the forecast, not the valley's built-in conservatism; **gated behind N≥4 cycles** with a **non-punishing low-data / bad-record state** (a poor record reads *"I've been over-cautious — recalibrating to your actual paychecks,"* never "right 2 of 6"). Homed in the **drill-down**, differentiated from momentum's payoff/streak archive.

### 2.10 Free vs premium presentation (value-led, D2.3)
- Free **always helps** — the honest read + a universal safe-move when tight + the invitation to the *personalized* plan. Never alarm-then-upsell. The personalized multi-cycle plan is the premium line; sound generic guidance is never withheld.

### 2.11 Hardening (2.4.6.1, before 2.4.7)
- Partition threaded (§2.2) + reconciliation test/tolerance · one-metric + unified state enum/tokens · at-risk floor-relative · focus from the actual allocation · no "$0" nonzero · windfall not repeated across cycles · **VoiceOver-reachable** adjust-line · hide adjust-in-shortfall · animate-once · floor-aware smoothing · real hysteresis · living-expense cadence · the framing reshapes (§2.1).

---

## 3. The Data Substrate (structure-first, v1.7 — NEW in v2, C3)

The features above depend on **new persisted structures + migrations** that must be designed **once, first**, like 2.3 did for balances — not retrofitted per feature. **`2.4.D` builds this before the cash-flow brain.**

- **3.1 Schema (v4→v5 migration).** `PaycheckConfig` gains `incomeVaries: boolean`, `leanAmount`, `typicalAmount`. `PayCycleSnapshot` gains the **prediction stamp** (`predictedCushion`, `predictedState`, `predictedShortfall`) + the **actual outcome** (`actualIncome`, `actualCushionHeld`, `outcomeConfirmed`). A dedicated **income-actuals log** (per-cycle received amount). Migration backfills existing users to a safe default (fixed income, empty history).
- **3.2 The two-touchpoint capture pipeline.** Stamp the **prediction at Guardian-compute time (cycle start)**; reconcile the **actual at rollover** (via `applyCapture`, which today logs neither income nor prediction). One pipeline feeds **both** income-learning (D3.3) and calibration (2.9) — capture-early / render-late, so features don't ship cold.
- **3.3 `shouldReAnchor` learns income.** Add income (varies-toggle, a material lean change) to the drift re-anchor set — today it keys only on `debtCount/extraPayment/strategy`, so a fixed→varies toggle silently leaves drift measuring against a stale baseline. Define the toggle-transition (re-anchor drift, re-project).
- **3.4 Forecast state-threading (§2.5) lives here** — the projection loop advances debt balances + goal progress (the C5 blocker), the substrate every multi-cycle claim reads.
- **3.5 Cold-start contract (C-completeness #4).** Every learning/calibration surface has a defined **empty/low-data state** + **min-N threshold** (≥4–6 paychecks before a range-refinement is suggested; hedge-hard confidence until then). Cold-start is the default for 100% of week-one users, not an edge case.
- **3.6 The demo/showcase substrate (C-tier #3 — launch-critical).** A **scripted premium demo state** — a tight cycle + a flush cycle + income-varies on + a populated actuals/scorecard history — separate from the free explore-seed (which ships free + disables Autopilot). Without it, the store screenshots, app-preview, and first-run can't show the paid value — a direct distribution blocker. Decide: second seed vs. a demo "preview premium" toggle.
- Reconciliation-tested throughout.

---

## 4. The rest of the premium tier (built + remaining)

- **2.3 Projection auto-maintenance (BUILT).** Always-current balances; honest "estimated · verified {date}" labeling. *v2 note:* the Guardian voice inherits its staleness hedge (§2.1).
- **2.5 Smart-obligation quality layer — must ACT + bias toward inclusion (C-trust #5, C-completeness #5).** A confirm-time flag is smart-text unless it **acts** (auto-holds pending confirm). Bias the classifier **one-way — only ever caution toward *inclusion***; never silently exclude (a dropped real bill understates `totalRequired` → a **false-clear**, the harmful error). **Ships with (or before) the Guardian**, or the interim Guardian copy is explicitly non-alarming on thin data (*"may be tight"* until an obligation's been confirmed once) — because min-only balances **and** a miscounted obligation push the *same* way, toward false alarms, in the launch window.
- **2.6 Close-the-loop verification — sell the RECONCILE, not the nag.** Escalating unconfirmed-payment loop + recovery recompute; the value is the auto-reconcile, escalation minimal. Homes the Drift→Guardian contract + anchor unification (2.4.2) and the calibration loop.
- **2.7 Scan-to-prefill.** Vision OCR → pre-fill → confirm; free initial scan / premium keeps-current. Fast-follow.
- **2.8 Momentum — RETENTION, not the price line (C-tier #8).** $-streak + debts-vanquished archive + partner sharing (recipient never pays). **Free retention layer; only custom share-art is premium.** Never listed in the price justification; basic sharing stays free.
- **2.9 Widget + App Intents + notifications** — includes the Guardian-state notification (§2.8), batched into one native build.
- **2.10 Revenue spine** — RevenueCat + paywall + Lifetime + portfolio-sub + analytics/Sentry; launch-flip gated on value. **Paywall + store screenshots inherit the in-app hedging** (advertise only shipped capability — no "always-watching precision" the product walked back). **[DECISION] Lifetime-vs-portfolio-sub cannibalization** (the Lifetime buyer is the graduate you wanted in the ecosystem): define Lifetime's scope publicly + the graduate path — resolve in this workstream.
- **2.11 E2EE iCloud backup + AU/NZ** — "E2EE" wording gated on ADP (§1).
- **Later (~v1.8): Premium Connected** — opt-in Plaid; **retention claims scoped to *our* backend, Plaid named** ("we never store your transactions; Plaid operates under its own policy"); positioned as **convenience, never accuracy**; never gates the on-device tier. **Future: Ava.**

---

## 5. Cross-cutting principles
1. **Private by default; "E2EE" only where true.**
2. **Honesty over polish** — no false precision, no false reassurance, no fake plans; the voice's certainty tracks its inputs'; the boundary is stated.
3. **One free/premium line** — "free tells you, premium does it."
4. **Auto-apply protective; confirm to spend or create; obligations never cut.**
5. **Confidence scales with proven accuracy** — earn trust, don't assert it.
6. **Removes work, not just info** — the price test, run on every feature.
7. **It watches + acts so you don't have to** — the identity, and why monitoring is value.
8. **Distribution is the job too** — the differentiated feature is the marketing lever; ship it visible.

## 6. Build order
**2.4.D data substrate (structure-first)** → **2.4.6.1 hardening** → **2.4.7 cash-flow brain** → **2.4.8 graduation** → **2.4.9 calibration + scorecard** → **2.4.10 notification** → **2.4.11 honesty/marketing reshapes** → the rest of the tier (2.5 with/before Guardian for accuracy → 2.6 → 2.7 → 2.8 → 2.9 → 2.10 → 2.11). Connected ~v1.8, Ava future.

## 7. Open questions for round 3
- Does the state-threaded forecast reconcile end-to-end (does a debt that retires in cycle 2 correctly free its minimum into the waterfall in cycle 3)?
- Is `max(0, net − floor)` the right smoothing-surplus when the floor itself is being pre-funded for a *future* crunch (does the cushion double-count)?
- Does the allocation-order re-architecture (starter-vs-fuller EF) break any existing 2.3/2.4 reconciliation test?
- Is "schedule-time compute + provisional reconcile" for the notification actually reliable across rollover-while-backgrounded?
- Does the honest scorecard (separate false-clear/tight, N≥4, non-punishing) still read as *motivating* to a real user, or just complicated?
- With everything folded in, is the card genuinely calm — or has the hard-cap been violated by the plan-steps + boundary line + read + bar?
