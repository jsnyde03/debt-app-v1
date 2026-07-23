# Premium Elevation — §2.0 focused re-check (round 5, against spec v4), synthesis (2026-07-23)

Four lenses scoped to the **only** section round 4 left structural — §2.0 (the confidence layer), reworked in v4 across framing/mechanics/data. The rest of the spec reached consensus in round 4 and was not re-audited.

## Convergence tally

| Lens | Verdict | Residual |
|---|---|---|
| **Buildability** | **CONVERGED** | 2 pinnable leaves — `coldStartHoldback` has no magnitude; §2.9 "calibration-maturity" leaks a 5th signal name |
| **Data / completeness** | **CONVERGED** | build-time B1–B7; 2 code-contradicted seams to fix in 2.4.D (`inputsAsOf` def, `shouldReAnchor` signature) |
| **Mechanics / correctness** | **STRUCTURAL (1, scoped)** | the §2.5 two-pass trades the false-clear for a **false-alarm**; findings 2–5 converged |
| **Framing / trust** | **STRUCTURAL (4 + 1 decision)** | trajectory/outcome promises invert for seasonal/tight/confident buyers; a pricing tension |

**The two "structural" verdicts are both SCOPED to named fixes, not open design voids.** All four lenses independently confirmed the round-4 holes are closed: the `readConfidence` scalar is gone (per-signal gates + masking verified — no mainstream income type stuck), the holdback-composition formula is safe (`deploy` can't go negative or exceed cash), the 8-bucket partition sums by construction, and the two-pass is a closed-form (converges in one correction, can't oscillate). What's left is **one real engine bug with a named fix** + **framing copy/design fixes + one pricing decision**.

---

## The fold-list for v5 (every item is a NAMED fix — none needs another audit to *decide*)

### A. The one structural engine fix — §2.5 smoothing (mechanics F1)
The aggressive-deploy pass-1 strips every prior cycle's surplus, and pass-2 pre-funds from cycle 0 only → an intermediate **flush cycle can't smooth a later crunch**, manufacturing a false "un-smoothable deficit" (→ a cried-wolf risk push, the exact thing §2.0 exists to prevent). Shape: flush cycle then a lumpy bill (common). **Fix (named by the lens):** replace aggressive-detect + cycle-0-only pre-fund with a **whole-horizon fixed point** + a **backward water-filling** pre-fund (source each crunch's reserve from the *nearest preceding surplus cycle*) and a **per-crunch-segment** deploy cap (not a single global `min_k(bal_k) − floor`). Substrate dependency: the forecast must **preserve un-clamped negative carryover** (today `buildTimelineItems.ts:159` clamps `max(0,·)`, losing crunch magnitude) — add to the §2.5 reconciliation test. *(Note: this is the 3rd smoothing re-spec — strong evidence the multi-cycle smoothing is proven better by reconciliation tests in-build than on paper.)*

### B. Build-time pins (fold as pinned defaults / one-line reconciles)
- **`coldStartHoldback` magnitude** (buildability #1): pin a conservative fraction of above-floor headroom, `[BUILD]` default, mirroring the 40% discovery fraction; add to the §7 [BUILD] list.
- **`calibration-maturity` ≡ `lean-verification`** (buildability #2): one-line reconcile in §2.9 (or delete the term) so the "one canonical taxonomy" holds.
- **`cushion_buffer` = realized `min(floor, discretionary)`**, not the constant floor (mechanics F2) — else the partition fails the tight/shortfall cases the test asserts.
- **`true_leftover` folds into the protected/kept side** (mechanics F3) — matches today's `selectLiquidCushion`; keeps the two bar zones summing to discretionary.
- **`inputsAsOf` = store-level stamp on genuine edits, NOT `applyRollover`** (data B1) — the derived-max reading is unbuildable (fields carry no edit timestamp).
- **Thread `source: 'learning' | 'user'` into `shouldReAnchor`** (data B2) — else a learning nudge re-anchors Drift (the "days ahead/behind resets with no behavior change" bug).
- **Exclude windfall from `actualIncome`** learning (data B3); **migration defaults + version bump** (data B4); **surprise-outflow capture surface** (data B5); **field types** for lean/typical/planned amounts (data B7).
- **State the floorless-income coldStart intent** (mechanics F5) — permanent coldStart on genuinely-floorless income is a *deliberate protection state*, not stuck-low-confidence.

### C. Framing fixes (fold the clearly-right ones; ONE is a Jason decision)
- **Seasonality-aware branch** (framing #1): when the seasonality signal fires (not just high CoV), commit to the detected pattern — *"I can see your income is seasonal — I'll hold steady through your lean months and deploy hard when your big months land"* — instead of the generic "too variable, watching for a stable pattern" (which promises a convergence that never arrives + discards the signal).
- **Priority-not-outcome paywall wording** (framing #2): *"your floor is always first in line before a dollar moves"* — not "you'll have your $200 from day one" (an outcome a tight converter can't get). Design the tight day-one as its own proof ("here's the single smallest move that closes the gap").
- **Reserve as insurance-that-paid-off + a confident-user attestation** (framing #3): on release, *"your settling-in reserve is free — you didn't need it, and it's now going to work"*; let a "my bills are complete" attestation **reduce** (not skip) the discovery holdback so caution is actionable; keep the reserve visually on the protected side.
- **Cold-start wording** (framing #5): *"planning from the low side while I learn your floor"* — not a flat "planning cautiously" that over-claims safety the first-four-paycheck math hasn't earned.
- **Retire the observation metaphor** (framing #6): *"as you log each paycheck, I learn your floor"* — a manual-entry app observes nothing; "watching for a pattern" over-claims.
- **⚠️ DECISION — the pricing tension** (framing #4): lead annual/Lifetime + no trial + a deliberately throttled month one stakes the biggest commitment on the segments (seasonal, tight) the learning window serves *worst*, in the window engineered to look worst. Options to resolve: (a) keep leading annual + a **proof-window money-back guarantee** matching the earn-trust narrative; (b) add a **real trial**; (c) lean on a **confidence-independent month-one proof of value** strong enough to impress before the commitment. This is a strategy call for Jason.

---

## Verdict & recommendation
**The architecture has converged.** After four full rounds + this focused re-check, no lens reports an open design void — the two structural verdicts are one named engine fix (§2.5 water-filling) and framing copy/design fixes + one pricing decision. That is the build gate cleared for the structure.

Recommended path:
1. **Write v5** folding the entire fold-list (A + B + C's clearly-right items).
2. **Resolve the pricing decision** (framing #4) — recommend (a) proof-window money-back guarantee (keeps the annual lead + matches "earn trust").
3. **Start the structure-first build at 2.4.D** — the data substrate + hardening (2.4.6.1) are the converged layers and come first; the §2.5 smoothing correction (2.4.7) is **proven by its reconciliation tests when it's built**, which — given it's now the 3rd smoothing re-spec — is where its correctness is actually established, not in a 6th prose round. Do **not** run another full audit round; that's the diminishing-returns loop we flagged.
- *Strict alternative:* a single focused re-check of ONLY the rewritten §2.5 water-filling algorithm before 2.4.7 (not a full round), since the smoothing has been wrong 3×. Reasonable if we want the one repeatedly-wrong mechanism confirmed on paper before it's load-bearing.
