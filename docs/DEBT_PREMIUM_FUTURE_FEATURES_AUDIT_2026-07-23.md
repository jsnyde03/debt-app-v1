# Debt Premium Audit — Future Feature Slate + Roadmap Gaps (2026-07-23)

> **Purpose.** Determine FUTURE premium features (intelligence / automation / do-it-for-you) and find gaps/enhancements in the already-planned post-Guardian premium work (2.5–2.11) to fold into v1.7. Commissioned by Jason 2026-07-23 during the 2.4.7 build. Produced by a comprehensive read of `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6), `DEBT_ELEVATION_PLAN.md` §2.4–2.11, `DEBT_PREMIUM_STRATEGY_2026-07-21.md`, the live engine (`allocatePaycheck.ts`, `cashflow/`, `guardian/`), and the portfolio `DIFFERENTIATION_STRATEGY.md` / `LLM_PROOF_FEATURES.md`.

**The moat every candidate respects:** premium identity = **automation** ("the app does the manual work, you confirm"); moat = **on-device / no-bank-connection / private**; uncopyable job = **payday-triggered allocation** + the **cushion Guardian**. Guiding test (from the strategy doc, verbatim): *"if removing it only removes information, it isn't premium enough"* — premium removes **work**, not info.

**Scoring bar (H/M/L):** (a) uncopyable / LLM-proof · (b) removes WORK not info · (c) truly-premium quality · (d) moat-aligned (on-device, no bank) · (e) anti-graduation retention · (f) added criteria: capture-friction reduction · honesty-fit (can't lie/mislead) · daily-open habit pull.

---

## Deliverable 1 — Future premium feature slate (ranked)

### ⭐ Top 3 — build next, in this order

1. **Can-I-Afford-This? (the inverse Guardian)** — the Guardian's own engine pointed at a *user-initiated* shock.
2. **Windfall Autopilot** — route found money in one confirm (highest value-to-cost; `store.windfall` exists but has no planner).
3. **Auto-Recovery / Catch-Up Planner** — the churn-moment rescue; do-it-for-you exactly when users quit.

**Why these three:** all three are the *same deterministic re-solve* the app already runs, pointed at a new trigger; each **removes decision-work** (not shows info); each is **structurally un-chattable** (needs the live private plan state); and all three **survive debt = $0** (afford-against-EF · windfall-to-wealth · recover-a-goal) — directly answering the graduation-churn paradox.

### The full ranked slate

| # | Candidate | (a) | (b) | (c) | (d) | (e) | Tier | Cost | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Can-I-Afford-This?** | H | H | H | H | H | Premium/on-device | M | **Build next** |
| 2 | **Windfall Autopilot** | H | H | H | H | H | Premium/on-device | M | **Build next** |
| 3 | **Auto-Recovery / Catch-Up** | H | H | H | H | H | Premium/on-device | M | **Build — fold into 2.6** |
| 4 | **Statement-Photo re-anchor (OCR keeps-current)** | M | H | H | H | M | Premium/on-device | L | Fast-follow — capture moat |
| 5 | **Life-Event Simulator** | M–H | M | H | H | H | Premium/on-device | M | Fold into Phase-3 What-If |
| 6 | **Strategy Auto-Advisor** | M | M | M | H | M | Premium/on-device | S | Low-priority enhancement |
| 7 | **Bill-shock autopilot** | L→H w/Plaid | H | — | — | — | **Connected ~v1.8** | — | Needs Plaid; not on-device |

**#1 — Can-I-Afford-This?** "Can I take a $900 vet bill this paycheck?" → the engine re-solves the cycle: does it breach the cushion floor, what to defer, the one-tap "protect it" plan, and the debt-free-date ripple. Reuses `allocatePaycheck` + `buildMultiCycleTimeline`; net-new = a transient injected-expense path + a result surface. **Risk:** the projection must hedge like the Guardian — a false "you can't afford it" is as trust-corrosive as a false shortfall alarm (reuse `buildGuardianBrief.about()`/risk-framing).

**#2 — Windfall Autopilot.** Refund/bonus/extra-shift arrives → compute the optimal split (cushion-topup → starter-EF → highest-leverage debt) and apply in one confirm, capturing the choice. The split logic IS the waterfall the engine already owns (`store.windfall` is already modeled + cleared at rollover). **Risk:** "highest-leverage" is a real finance tradeoff (liquidity vs APR) → must be **two-sided-with-a-why** per the §2.1 advice-boundary classifier, not a single decisive verdict.

**#3 — Auto-Recovery / Catch-Up Planner.** Missed payment / drift negative / short paycheck → auto-rebuild the path back (what to deprioritize, realistic new date, bounded catch-up schedule) — framed as rescue, never blame. Diffs *past engine-authored plans* vs actuals (the Drift moat, `computeDrift.ts` built) + re-solves; ties to paused-deploy (§2.3.1). **The strongest retention lever in the set** (the churn event IS "I fell behind"). **Risk:** tone — fires when the user feels worst. **Recommendation: fold into 2.6** (its "recovery recompute" seam is under-scoped — build the *actionable plan*, not just a recomputed date).

**#4 — Statement-Photo re-anchor (OCR keeps-current).** Snap a statement → Apple Vision OCR → one-tap balance re-anchor. The **premium "keeps-current"** half of the scan story and the **#1 retention bottleneck** per `LLM_PROOF_FEATURES.md` ("fund capture before analytics"). Heaviest (native Vision + correction UX); ship confirm-required, never silent. Natural extension of planned 2.7.

**#5 — Life-Event Simulator.** "What happens to my debt-free date + cushion if I have a baby / take a raise / lose my job 2 months?" Multi-variable re-solve (job-loss overlaps paused-deploy). **Risk:** drifts into "info toy" unless it ends in an *action*. Build as the sibling of the Phase-3 What-If explorer, not a separate v1.7 item.

**#6 — Strategy Auto-Advisor.** Continuously evaluate actual cash-flow and proactively recommend the snowball↔avalanche switch that most eases paychecks — as a **one-tap apply** (else it's the smart-text trap). Cheap (`selectStrategyComparison` numbers already computed). Low priority.

**#7 — Bill-shock autopilot.** Detect a changed recurring obligation → auto-reshape + re-forecast. Weak/impossible on manual data (no transaction stream) → **Connected-tier (~v1.8)**, not on-device.

### ⛔ Explicitly do NOT build
**Refi / insurance "shopping" / rate-drop lead-gen** — already **CUT** in `DEBT_PREMIUM_STRATEGY` (off-device, lead-gen in premium clothing, violates "we never sell you more debt"). Any proposal in this direction is a trust liability, not a feature.

---

## Deliverable 2 — Gaps & enhancements in the planned 2.5–2.11

### ⭐ Top 3 gaps to fix inside v1.7
1. **2.5's "smart" classifier is schema-starved** — the obligation model lacks the capture fields it needs to run on.
2. **"Watches every paycheck" is unbacked until 2.4.10 notification ships** — a sequencing gap (flagged as D4, unresolved in the build order).
3. **2.10's money-back guarantee may not be StoreKit-implementable** — Apple owns refunds; verify before marketing it.

| Planned item | Gap verdict |
|---|---|
| **2.5** smart-obligation | **Schema-starved + over-engineered.** `Expense` = `{name, amount, dueDate, recurrence, isAutopay}` — no category, no trial-start flag, no BNPL term/installments. Without them "smart detection" degrades to a name-string heuristic (the LLM commodity the reshape avoids). **Add the capture fields now** (cheap, fits the substrate pass). **Descope the Core ML model** — the strategy doc itself says the confirm-step gets ~90% of the benefit with no detector; ship (i) the schema fields + (ii) a lightweight on-device heuristic (finite-BNPL auto-expiry via term · trial-lapse via first-seen date · amount-variance), defer the ML to the cash-flow future. Cheaper AND more honest. *(Finite-BNPL auto-drop — the headline 2.5 promise — is impossible without a BNPL term field.)* |
| **2.6** close-the-loop | **Under-scoped.** Scoped as "recompute" (info); the **actionable catch-up PLAN (candidate #3) is the premium substance** — build it here (cheap; `computeDrift.ts` + paused-deploy exist). **Also surface the Interest-Saved counterfactual** — `computeInterestSaved.ts` already exists (real vs minimum-only over history), called "best ROI in the portfolio," but isn't called out in 2.6 or 2.8. |
| **2.7** scan-to-prefill | "premium **keeps-current**" (the OCR re-anchor, candidate #4) is undefined — scope it explicitly (defer, L) so the bullet isn't hollow. |
| **2.8** momentum | Correctly retention-not-headline. **Make the Interest-Saved Ledger the spine** (the one un-chattable, always-true number); demote generic streaks to support. Verify the "debts-vanquished archive" hooks the **confirmed-$0** signal (`verifyDebtBalance→0`), not a projected $0. |
| **2.9** widget/App Intents | **Add the Live Activity payoff countdown to the native batch** — top-tier anti-LLM native moat ("self-updating debt-free countdown no chatbot can render"), far cheaper batched while the native toolchain is open (respects the Codemagic-cadence rule). **Decompose the interactive-widget App Intents** (mark-paid / log-paycheck from the widget) so the premium interactive widget clears the removes-work bar vs the free glance widget. |
| **2.10** revenue | **⚠️ Verify the money-back guarantee is StoreKit-implementable BEFORE marketing it** — Apple mediates all refunds; you can't generally issue an in-app refund outside StoreKit. Options: StoreKit refund API · a manual goodwill mechanism · or reframe as "cancel anytime in month one, annual not charged until day 30." Lock at the [DECISION] gate the plan already places before any SKU. Selling a guarantee you can't honor is the exact trust-inversion the moat is built against. |
| **2.11** E2EE backup | The "E2EE" claim depends on an **ADP-status detection API that may not exist** — if iOS doesn't expose it, fall back to "encrypted iCloud backup" wording everywhere + reconcile the stale "E2EE-by-construction" line in the strategy doc. **Honesty-critical.** Also: backup ≠ **sync** (iPhone+iPad users expect sync); fine to defer, but name it so it's not mistaken for done. |

### Cross-cutting sequencing gap (most important)
**"It watches every paycheck" is structurally unbacked until 2.4.10 (notification) ships** — which sits near the *end* of the order (after 2.4.9). Flagged as D4 ("soften copy until a Guardian-state local notification ships = a REQUIRED backer") but unresolved in the sequence. **Recommendation: pull a minimal local Guardian-state notification forward to ship *with* the Guardian surface, or hold the "watches every paycheck" marketing claim until 2.4.10.** A monitoring feature that doesn't monitor between opens is the cried-wolf/hollow-promise risk the whole confidence layer exists to prevent.

---

## Recommended immediate actions (my read for Jason)
- **Fold into v1.7 now (cheap, high-leverage):** the **2.5 capture-field schema add** (+ descope the ML to a heuristic) · the **2.6 Interest-Saved surface** (engine exists) · **decide the 2.10 guarantee mechanism** early · **resolve the "watches every paycheck" sequencing** (pull a minimal notification forward or hold the claim).
- **Queue as the next premium features (post-Guardian):** #1 Can-I-Afford-This? and #2 Windfall Autopilot — both reuse the engine, both survive graduation, both clear the removes-work bar.
- **Confirm at build:** the 2.9 Live Activity batching + 2.11 E2EE-vs-encrypted wording.
