# Premium Elevation — Full round-6 audit (against spec v5), synthesis (2026-07-23)

Six angles on the WHOLE premium tier, each answering **ready-to-build: yes/no**. This was the full-convergence gate.

## Tally

| Lens | Ready-to-build | Residual |
|---|---|---|
| **Buildability** | **YES — converged** | 2 trivial §7 one-liners (seasonality *detection method*, holdback decay *shape*) |
| **Tier-coherence** | **YES** | the pricing seam, correctly quarantined to the late 2.10/2.4.11 surfaces; "the last question is empirical, not analytical" |
| **Data/completeness** | **YES** | one scoped producer gap (income-actuals writer) — folds into the same 2.4.D `applyCapture` work as B5 |
| **Trust/framing** | substrate **YES**, spine **NO** | 3 holes, all in late surfaces (§2.10/§2.3/§3.5) |
| **Correctness** | **NO** | 2 scoped engine holes + 1 stale substrate note |
| **Fresh-eyes** | **NO** (bounded) | cross-section interactions + un-owned gaps |

**The unanimous meta-verdict — every one of the six, independently:** the architecture has converged and is buildable today; the residual is a **bounded set of NAMED fixes** (not an open design void); the build should **start at 2.4.D**; and **no lens recommends a round 7.** Three "NO/structural" verdicts are each about *specific named fixes* that fold on paper or ratchet through the build's reconciliation tests — plus two genuine product decisions. This is the convergence point: not zero issues, but the point where what remains is mechanical folds, your decisions, and one question only code can answer.

**The decisive reframe (tier-coherence):** the last open question — "is the confidence-independent month-one proof demonstrably impressive?" — is **empirical**. It's answered by *building the demo* (2.4.11, which the spec already gates the pricing behind), not by a seventh prose round. Continuing to audit prose is the diminishing-returns loop.

---

## The findings UNIFY into three clusters + a fold-set

### Cluster 1 — the engine (correctness F1/F2 + fresh-eyes #1 + data #1): the reserves' shared-dollar accounting
The single-cycle composition and the multi-cycle water-fill both let the *same above-floor dollars* be claimed twice. → **v6 fold:**
- **Composition clamp (correctness F1):** `combinedHoldback_realized = min(prefundedReserve + max(discovery, coldStart), discretionary − floor)`; pin the collision priority (rec: `prefundedReserve` wins as a real dated need, uncertainty buffer takes the remainder). Add the `floor < D < floor + combinedHoldback` reconciliation case. (Fixes the §2.2 `sum === discretionary` break my v5 realized-buckets edit introduced.)
- **Water-fill net-of-consumption (correctness F2):** sparable surplus is a **shared mutable pool decremented as consumed**, crunches processed chronologically, nearest-first (provably optimal on this staircase) → total structural deficit deterministic. Add the multi-crunch-shared-source case to the suite.
- **Cross-cycle sharing (fresh-eyes #1):** define whether the water-fill may source a cycle whose discovery/coldStart reserve is still active — (a) exclude it (shrinks sources, risks a cold-start false-alarm) or (b) allow-and-down-qualify the pre-fund promise during cold-start. **Pick one** (rec: (b) — qualify, since (a) reintroduces F1 for the cold-start segment).
- **Stale substrate note (correctness F3):** rewrite §2.5's "un-clamp line 159" → "**introduce cross-cycle un-clamped carryover in `buildMultiCycleTimeline` (today absent — each cycle restarts from its own paycheck)**"; note `net_k` excludes the per-cycle buffer today's `endingBalance` subtracts.
- **Income-actuals writer (data #1):** add `actualIncome` to `applyCapture` + a variable-income reconcile affordance, defaulting `actual = Number(paycheck.amount)` for fixed income (no false variance), excluding windfall (B3) — the symmetric twin of B5's outflow affordance.

### Cluster 2 — the pricing/cold-start seam (trust #1 + fresh-eyes #2 + tier-coherence R1): THREE lenses, one seam
The month-one proof is thin exactly where the no-trial pricing bites hardest (the tight/cold-start buyer), and the demo showcases a *matured* Guardian the month-one buyer structurally can't be. → **v6 fold + one DECISION:**
- **FOLD — smallest-move becomes a one-tap ACTION, not a readout (tier-coherence R1):** apply the closing move in one confirm (defer an optional goal / shrink snowball to minimums / shift a bill *within* obligations-never-cut). Removes real work → earns its premium slot → closes the "premium removes work not info" price-test failure. **[BUILD] spec the exact levers + prove obligations-safe (fresh-eyes #4).**
- **FOLD — bound the demo (fresh-eyes #2):** §3.6 may show only the confidence-independent day-one value; the scorecard/smoothing are represented as *"what I'll show once I've learned your income,"* never an already-earned record. (Honesty-enforced §5.2.)
- **DECISION for Jason — the tight-buyer safety valve** (below).

### Cluster 3 — the framing folds (trust polish + fresh-eyes lifecycle)
Straight v6 folds: seasonality **self-declaration** capture (framing #2 — detection can't fire year-one; extend the §2.3 varies-toggle); the tight-day-one **un-closeable-gap branch** (framing #3); reserve **insurance-tapped variant** + attestation **walk-back** wired to the surprise-outflow log; cold-start "put more to work" **non-monotonic** reword; state the intent for **passive-hold / churn-mid-hold / premium-gating of the substrate / mixed-income single-stream / fixed-income-scorecard content** (one line each); the buildability §7 one-liners; B2 commit to source-threading only (drop the un-buildable alternative); pin `importStore` callers pre-migrate.

---

## Two genuine DECISIONS for Jason (everything else folds)

**A. The missing income-arrival axis (fresh-eyes #3).** Nothing measures *whether* a paycheck arrives — a missed check (layoff/furlough/gig dry spell) makes the forecast project phantom income → a structural false-clear the confidence layer can't hedge, and the outlier-guard *suppresses* the real $0. Hits the variable/irregular earner, a first-class v1.7 target.
- *Rec:* **build a lightweight paused-deploy / income-interruption state in v1.7** — it's a genuine false-clear for a first-class target user (category-1), and far cheaper now than as a retrofit.

**B. The tight-buyer pricing safety valve (Cluster 2's decision half).** With smallest-move-as-action + the demo bounded (both folded), is that enough, or also segment the paywall?
- *Rec:* **also segment — tight converters get monthly-first; reserve the annual/Lifetime lead for the surplus/normal converter** (whose month-one proof — above-floor deploy + visible water-fill smoothing — is genuinely strong). Cheap, precisely targets the one weak segment, keeps no-trial. (The alternative, revisiting toward a proof-window guarantee, is the option already weighed and set aside.)

*(Known deferred, lands at 2.10 not now: the Lifetime-vs-portfolio-sub [DECISION] — resolve toward Debt-only-scope + a graduate path BEFORE any Lifetime SKU is created (lock strategy before irreversible setup). Plus doc-hygiene: pin the annual/Lifetime numbers; reconcile the stale Momentum-as-premium tier-table row.)*

---

## Verdict
**This is the convergence point.** Fold v6 (Clusters 1+3 + Cluster 2's two folds + the data writer), resolve decisions A & B, then **start the structure-first build at 2.4.D** — the engine fixes ratchet through reconciliation tests, and the month-one-proof question answers itself in the demo. All six lenses said stop auditing and build; the honest, strict reading agrees.
