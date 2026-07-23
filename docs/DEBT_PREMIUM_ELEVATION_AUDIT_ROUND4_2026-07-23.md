# Premium Elevation — Fourth Audit (round 4, full, against spec v3), synthesis (2026-07-23)

Six angles (red-team + confidence-layer stress · correctness · buildability · trust · completeness · tier-coherence) against **spec v3**. This was the **consensus round** (Jason's build gate): each angle called *converged* or *structural*.

## Convergence tally: **CONSENSUS reached on everything EXCEPT §2.0.**

| Angle | Verdict |
|---|---|
| Correctness (F1/F3/F4/F6/F7 corrections) | **Converged** — corrections sound; F7 reversal verified correct. Residual is §2.0/§2.5 *composition* (below), not the individual fixes. |
| Buildability | **Converged** on F1/F3/F4/positioning; **§2.0 core abstraction structural.** |
| Trust | Honesty micro-fixes **converged**; residual is the **§2.0 cold-start framing.** |
| Tier-coherence | **~90% converged**; residual is **§2.0 paywall/positioning** (one-sentence fix). |
| Red-team | **Structural, narrowly** — all in **§2.0** (invisible hold · missing category · staleness gate). |
| Completeness | **Structural** — the **§3 schema was never re-derived from §2.0.** |

**Six independent angles, and every structural finding traces to ONE section: §2.0, the confidence layer I added in v3 to fix round-3's red-team finding — without a full pass over its framing, mechanics, *or* data.** Everything else converged. That is the loop working: r1 broad bugs → r2 scope/substrate → r3 mechanics + a new layer → r4 a **single under-baked section.**

---

## What has CONVERGED (do NOT re-audit — these are settled/build-ready)
- **The engine corrections:** F1 running-balance smoothing (boundary formula), F3 partition split, F4 unified state machine, F6 low-N shrinkage — each sound in isolation; **F7 living-expense reversal verified correct** (the field is per-paycheck; leaving it is right).
- **Positioning:** retire the two decaying claims; lead with engine-grounded honesty + automated payday-cadence debt focus. (Clean — the only wrinkle is §2.0 re-importing "watch," below.)
- **Honesty micro-fixes** (hedge-budget implicature, 2.1↔2.3 boundary, neutral-banner cadence, own-the-miss): tone/polish, defensible as specced.
- **The tier + free/premium line + the deferred [DECISION]s** (Lifetime, Connected-as-convenience): coherent.
- **The build-time items** multiple lenses flagged (loop tie-break order, BAND/threshold values, ADP API existence, category→selector wiring, per-paycheck income-log granularity, notification-across-backgrounded-rollover): genuinely resolve faster **test-first in the build** than in another prose round.

---

## The residual: §2.0 needs ONE proper pass, across all THREE of its facets

### Facet 1 — FRAMING (red-team + trust + tier-coherence converged on the SAME fix)
v3 gates the *action* correctly but frames the gating as a liability, so the just-converted user meets a throttled/withholding flagship.
- **The held reserve is invisible → inert** (red-team): the discovery buffer holds ~40% silently while the voice is fully confident → the user spends the visible headroom themselves and overdrafts. **Make the hold a visible, named bar zone.**
- **Week-one value is back-loaded onto the *retired* "watch" axis** (all three): the paywall sells "watch-from-day-one" exactly when "acting" is gated off. **Lead with the confidence-INDEPENDENT floor auto-protection (2.4, already built) — real day-one acting; qualify "watch" as *private/on-device*.**
- **The degrade abandons the core user** (red-team + trust): "too variable to promise a floor" drops the gig earner to ~free at peak need + blames them. **Keep planning (wider band + higher shrinkage); reserve the hard degrade for genuinely floorless income; reword off user-blame.**
- **The unifying sentence** (tier-coherence crystallized it): reframe the whole layer from hedge into pitch — **"it acts on what it's sure of from day one (your floor), and does more as it learns you — it won't gamble your rent on a guess."** Adopt as the tier's headline promise; **lead annual/Lifetime pricing** so the buyer spans the learning window.

### Facet 2 — MECHANICS (buildability + correctness named the SAME core hole)
- **`readConfidence` is undefined AND zeroes out fixed-income users:** every gate keys off an *individual* signal via a hard threshold, so nothing consumes a combined scalar; and **lean-verification is N/A for fixed income → if scored 0, the majority sit permanently low-confidence and the buffers NEVER release.** **Decide: drop `readConfidence` and spec the independent gates directly, OR define the 0–1 map + combine op + per-income-type signal MASKING (drop N/A signals, don't zero them).**
- **The holdback composition is unspecified — four reducers on one deploy:** floor + pre-funded reserve + discovery buffer + cold-start conservatism all fire at once for a week-one variable user. **One rule: `deploy = max(0, discretionary − floor − combinedHoldback)`, `combinedHoldback` defined (not a sum of overlapping reserves).**
- **A real false-clear bug (correctness #1):** smoothing runs a *no-deploy* accumulation while the forecast *deploys* above the floor → `bal_0 = $700` masks a genuine cycle-1 crunch → **missed crunch.** **Cap the deploy by the smoothing horizon's `min_k(bal_k) − floor`; define `bal_0`'s source; resolve the pre-fund↔deploy fixed point (two-pass).**
- **Canonical bucket list:** F2/§2.0 add `prefunded_reserve`/`starter_emergency`/`discovery_holdback` → the "5-bucket" reconciliation is stale (really 7–8), and **`cushion` must = all *protected* buckets, not `cushion_buffer` alone**, or the overstatement lie re-emerges as inflated "put-to-work." **Pin the N-bucket list once; every selector + test derives from it.**
- **One canonical uncertainty taxonomy** shared by the action-gate and the voice/hedge-gate (they currently list different axes).

### Facet 3 — DATA SUBSTRATE (completeness: §3 was never re-derived from §2.0)
Close these **before 2.4.D** — they change the schema shape:
- **Bill-completeness proxy has no producer + is contaminated** (`cycleHistory.length` is pre-loaded 6 by demoSeed / backfilled by import → a seeded user skips the buffer). **Add a real onboarding stamp + a genuine-cycle counter [excludes seed/import/disturbed] + a surprise-outflow capture hook.**
- **The staleness signal keys off per-debt balance-verification, not read-freshness** (income/bills carry no timestamp), and `applyRollover` doesn't advance `lastVerifiedDate` → §2.0 would hedge/cut debts 2.3 treats as current (the 2.1↔2.3 contradiction, live in code). **Define a read-level freshness signal; reconcile.**
- **The prediction stamp omits confidence-context** → the scorecard re-inherits the "grades conservatism" flaw (a dampened read graded as confident). **Stamp `predictedReadConfidence`/provisional; scorecard weights/excludes low-confidence.**
- **`lastNotifiedRisk`/cap are on the wrong entity** (snapshots are historical; the notification fires for the current cycle with no snapshot yet). **Store-level carrier + a push-log.**
- **The stamp trigger is defined only for the rollover path** (onboarding-mid-cycle, import, demo-isolation unspecified; the "first Guardian compute" fallback is a forbidden selector side-effect). **An entry-path × stamp matrix; a non-selector cycle-detect on app-open.**
- **Graduation de-gates the substrate:** `selectPaydayGuardian` nulls at debt=$0 → stamping/calibration/learning stop exactly when §2.7 wants persist. **De-gate the substrate from debt-presence; define the debt-free stamp target (EF/goals headroom).**
- **Lean-learning re-projection vs the frozen Drift baseline** — a lean nudge re-anchoring drift resets "days ahead/behind" with no behavior change. **Decide: plan-change (re-anchor) or measurement-change (preserve baseline)?**

---

## Verdict & recommendation
**Consensus is met on everything except §2.0 — that's the build gate cleared for ~85% of the spec.** The residual isn't sprawl; it's **one section, under-baked on all three facets because I bolted it on in v3 to fix a round-3 finding without a full pass.** The honest move:

1. **Do ONE proper §2.0 pass** (a v4 scoped to §2.0) covering all three facets — the framing (the earn-trust narrative + visible hold + protect-from-day-one + non-abandoning degrade), the mechanics (readConfidence-or-gates + composition rule + deploy-cap/false-clear + canonical buckets + one taxonomy), and the data-substrate re-derivation (the six schema/producer fixes). Several of these **change the schema, so they must land before 2.4.D.**
2. **Then a FOCUSED re-check of §2.0 only** — the rest of the spec converged and does not need re-auditing.
3. **Then build**, with reconciliation tests as the ratchet for the flagged build-time items.

This is convergence, not spinning: four rounds took us from broad bugs to a single well-defined section. One more targeted pass on it, a confirming check, and we build against a spec the angles agree on.
