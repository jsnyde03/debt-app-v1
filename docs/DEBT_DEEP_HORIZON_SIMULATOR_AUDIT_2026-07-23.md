# Audit — "Deep-Horizon Snowball vs. Avalanche Adversarial Simulator" (2026-07-23)

> **Purpose.** Run down Jason's future-feature idea and determine whether/how to bring it to the app as a differentiator. Commissioned 2026-07-23. Grounded in the engine (`projectDebtPayoff`, `buildPayoffTrajectory`, `computeInterestSaved`, `buildMultiCycleTimeline`, `cashflow/detectCrunches`+`waterFill`, `computeDrift`), the Skia viz (`TrajectorySkiaChart`), and the honesty/tier gates (`DEBT_PREMIUM_ELEVATION_SPEC` §2.0.d/§2.10, `DEBT_PREMIUM_STRATEGY`).

## Verdict (decisive)
**PARTIAL — ship a small honest slice, defer the spectacle, reject the framing.** One genuinely buildable on-device feature (a deterministic multi-scenario payoff stress-test + Skia fan-chart, mostly already built) is wrapped in three layers of over-claim ("adversarial agents," "agentic spending-psychology memory," "years of simulation = data gravity") that are either AI-theater over deterministic math or capabilities the app **structurally cannot have** (no transaction stream → it never observes actual spending). As pitched it is **off-moat, an info-toy on the wrong side of the paywall, and against the "AI-is-not-the-moat" roadmap rule.** Stripped to what's honest and made to **end in a Guardian action**, it's a real but **modest post-v1.7 candidate — not a North Star.**

## 1. Decomposition — four components
| # | Component | Reality | Where it lives |
|---|---|---|---|
| (i) | Multi-scenario "adversarial agents" sim | **Deterministic on-device** — a perturbation wrapper around the existing engine; no AI, no bank data | On-device now (`projectDebtPayoff` already runs 50 yrs; `computeInterestSaved` already runs it twice) |
| (ii) | Branching-probability Skia viz | **Buildable on-device** — a fan/band chart extends the existing single-line trajectory; perf ("instant thousands of 50-yr runs") solvable via downsample/discrete/worker | On-device now (`TrajectorySkiaChart` + platform-split canvas) |
| (iii) | Dynamic Snowball↔Avalanche recommendation | **Math already built** (dual-strategy `projectDebtPayoff` + `computeInterestSaved`); real-time switching = **trust hazard (thrash)** | Math on-device now; genuine coaching = Ava/v2.0 |
| (iv) | Agentic memory of spending psychology | **Structurally impossible on-device as stated** — no transaction stream; `livingExpenseReserve` is a user-set scalar, not observed spending | Not buildable as pitched; declared-preference + adherence memory only |

## 2. Honesty test (load-bearing)
On-device the app observes only money **planned** (entered) and **reported** (logged at reconcile) — **never money actually spent** (spec §2.0.d already enforces this: "a manual-entry app observes nothing, it waits for you to log").
- **"Adversarial micro-agents"** → over-claim; it's deterministic Monte-Carlo over user-dialed assumptions. Exactly the standing violation *"stop calling heuristics AI."* Honest name: **"payoff stress-test / scenario simulator."**
- **"Agentic memory of spending psychology"** → the biggest over-claim, **not fixable by wording** — the data doesn't exist. What's real is a **preferences-and-adherence memory** (declared floor / strategy / attestation + Drift adherence + logging cadence), NOT psychology. Selling "knows your spending habits" would be a demonstrable lie for a privacy-marketed app.
- **"Renders probability webs instantly" / "simulating decades of chaos"** → every shock is an **assumption the user typed**, not a prediction. Must be labeled **"modeled scenarios," never "what will happen."**

## 3. Moat — the "data gravity" claim is largely FALSE
- **A simulator is stateless.** The engine re-derives everything from *current* inputs each run — there's no accumulated "years of simulation" to lose; export the inputs and any engine reproduces it. **The claimed lock-in doesn't exist.**
- The **real** data gravity is the Guardian's substrate already being built (`genuineCycleCount`, income-actuals log, calibration record, frozen Drift baseline). The sim **rides on it, adds ~none.**
- **Removes-work test: ❌ FAIL as pitched** — a probability web is a **readout = info**; round-6 already demoted an *even simpler* readout to FREE (spec §2.10). It only crosses the paywall by **ending in an action.**
- Uncopyable: ⚠️ weak ("what if rates rise 2%?" is an LLM+calculator answer; only the private substrate is un-chattable — and that's the Guardian's, not the sim's). Alignment with "AI-not-the-moat": ❌ (the pitch tries to make an agentic engine *the* moat).

## 4. How to bring it in — phased path
- **Phase A — "Payoff Stress-Test" (deterministic, on-device, mostly built).** A bounded set of *named discrete scenarios* (rate hike · income drop N months · one-time emergency bill · minimum increase), each a single run showing how the debt-free date + total interest move, snowball vs avalanche. Start discrete, not a 10k-path Monte-Carlo. Reuses `projectDebtPayoff`/`buildPayoffTrajectory`/`computeInterestSaved`/`TrajectorySkiaChart`. ⚠️ **On its own = info → likely FREE** (extends the already-free What-If).
- **Phase A+ — the premium hook (the version worth roadmapping): make it END IN A GUARDIAN ACTION.** *"This rate hike breaks your plan in cycle 8 — prefund $X now / raise your floor / switch to avalanche for 3 months of cushion — apply."* Info → removed work; reuses `detectCrunches`+`waterFill` (`prefundedReserve`) + §2.4 auto-protect. **A modest Guardian sub-feature, not a headline.**
- **Phase B — distributional fan-chart** (deterministic band; only if Phase A proves demand; label "modeled, not predicted"; respect the calm-motion rule on a data-viz surface).
- **Phase C — Connected (~v1.8):** transaction-informed shock priors — the ONLY phase where "informed by your actual life" is an honest claim.
- **Phase D — Ava (v2.0+):** the conversational "which strategy fits how you actually behave" coach, substrate-grounded, still bounded by the no-transaction blindness.
- **On (iii):** a *one-time/occasional* "which strategy for you" (interest delta from `computeInterestSaved` + Drift adherence from `computeDrift`) is cheap, honest, mostly built. **Reject real-time switching** (thrash contradicts the app's own hysteresis philosophy).

## 5. Recommendation
File to the **Deferred backlog as a post-v1.7 / Connected-era candidate — explicitly re-labeled + de-scoped** (the honest "Payoff Stress-Test that ends in a Guardian action"), NOT opened now (it competes with the committed v1.7 Guardian build). **Do not adopt any of the pitch's language.** State the no-transaction blindness in the entry so the psychology ambition doesn't resurface with the same over-claim — that part is genuinely **Ava (v2.0+)** and permanently on-device-constrained.
