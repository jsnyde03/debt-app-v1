# Guardian Convergence Audit — ROUND 2 (verification) — 2026-07-24

> **Purpose:** round 1 (`DEBT_GUARDIAN_CONVERGENCE_AUDIT_2026-07-24.md`) found 8 major/blocker defects + minors; all were fixed (MF.1–MF.7). This round re-ran the **same 4 adversarial lenses against the FIXED code** to (a) verify each fix truly resolved its finding without regressing, (b) hunt for anything the fixes introduced, (c) reach a **consensus** verdict on premium-level. Jason's gate: don't leave Guardian until the synthesizer **and** the agents agree it's premium-level.

---

## ⚖️ CONSENSUS VERDICT — ✅ SHIP (premium-level)

| Lens | Round-2 verdict | Blocking items remaining |
|---|---|---|
| **Honesty / trust** | ✅ **YES** | none (2 copy-polish residuals, fixed) |
| **Premium value / tier line** | ✅ **YES / YES** | none |
| **UX coherence / wording** | ✅ **YES** | none (1 a11y-label + minor residuals, fixed) |
| **Correctness / substrate** | ✅ **YES** (was NO → MF.4 completed → **re-verified: RESOLVED**) | none |

**CONSENSUS: 4/4 lenses YES + synthesizer YES → the Guardian is premium & worth the price, honest, coherent, and correct. Ship-ready.** The correctness lens re-verified both MF.4-completion fixes ("no other projection consumer reads the dampened allocation… Consensus from this lens: ship."). Every round-1 and round-2 finding is either fixed-and-verified or triaged to Phase-3 / backlog (nothing dropped).

**Round-2 fixes applied (all verified: tsc · regression · app · scenarios · lint · e2e 18/18):** the 2 correctness MAJORs that completed MF.4, plus 5 cheap polish/a11y residuals. See below.

---

## Fix-verification (round-1 fixes, re-audited)

**RESOLVED (verified against code by the lenses):**
- **MF.1** recovery trustworthiness — autopay excluded from deferrable *before* classify (a `deferability:'deferrable'` override can't defer an autopay — the guard wins); `other`/uncategorized → essential; `setDeferability` no re-stamp; empty-deferrables branch correct. (correctness + honesty)
- **MF.2** a11y — interactive recovery/top-up/attestation controls now render as siblings *after* the `accessible` group, individually reachable; visual order/divider intact. (UX)
- **MF.3** free honest shortfall read — the shortfall branch now precedes the `!isPremium` return, so free gets "won't cover everything / about $X short"; only the built plan is premium; state-aware invite accurate. (all 3)
- **MF.4** — the Payoff tab's debt-free date now projects on the steady-state deploy; premium no longer reads later than free at cold-start. **BUT incomplete — see round-2 correctness below.**
- **MF.5** reserve-release honesty — `covered` capped at the reserve actually held (pre-rollover), `tapped` gated on a real draw, scoped to post-onboarding; copy hedged ("helped cover about $X"). (correctness + honesty)
- **MF.6** surface unification — the RequiredActions unfunded block is suppressed only when premium recovery is active (free always keeps it); recovery lists a superset, so nothing is hidden. (premium + UX)
- **MF.7** — `cycle→paycheck` sweep complete (all visible strings read "paycheck"); "Safety net" relabel matches the portfolio brand rule; trial "Not now" folded into one action row. (UX + honesty)

**Premium value is backed by a REAL allocation divergence, not narration** (verified): premium reserves the full `cushionFloor` ($200) vs free's $50 buffer + variable buffer + projected balances + prefunded/cold-start reserves + the interactive recovery/top-up/attestation. Every premium selector guards on `subscriptionPlan`; no capability leaks either way. No hollow ("just smart text") premium element found.

---

## Round-2 NEW findings + disposition

### Fixed now (2 MAJOR — completed MF.4; blocked correctness consensus)
- **NEW-1 (correctness, MAJOR)** — MF.4 migrated the Payoff tab but **missed the What-If simulator + amortization** (`analysisSelectors.ts derivePlanBasis.monthlyExtra` still read the dampened allocation), so at cold-start the What-If baseline date read *later* than the Payoff date on the same data — two premium screens disagreeing, violating the file's own invariant. **Fixed:** `monthlyExtra` now derives from `selectSteadyStateAllocation`; `perCycleExtra`/`projectedBuffer` (this-cycle figures) stay dampened. **Parity assert added** (`steadyStateProjection.test.ts`): What-If baseline === Payoff date at cold-start (Sep 2026 === Sep 2026).
- **NEW-2 (correctness, MAJOR)** — the MF.4 date change *introduced* a desync in the frozen **drift baseline**: `recordDriftBaseline` built `projectedPoints` from the dampened `monthlyExtra` while its headline `projectedDebtFreeDate` was now steady, so the curve bottomed out later than its own date → the user read artificially "ahead of plan"; and `shouldReAnchor` keyed off a dampened extra that drifts as the cold-start hold releases (spurious re-anchor). **Fixed:** `recordDriftBaseline` now uses the steady-state `monthlyExtra` too, so trajectory + extra + headline date all agree.

### Fixed now (cheap polish/a11y residuals)
- **UX NEW-1** (a11y, should-fix) — the card's narrated group *label* still recited the now-suppressed `safeMove` and double-spoke the `lookahead` in recovery mode. **Fixed:** both gated on `!recovery` in `groupLabel(...)`.
- **UX NEW-2** (coherence) — top-up + attestation could co-render at cold-start (only guarded vs recovery). **Fixed:** attestation gated behind `!topUp` (at most one of recovery/top-up/attestation renders).
- **Honesty F2** — free invite "what's *safe to move* to next paycheck" implied deferral options a common all-essential shortfall lacks. **Fixed:** "what to cover first, and what (if anything) can safely wait."
- **Honesty F1** — defer disclaimer "pay it late with the biller" imprecise for subscriptions. **Fixed:** "handle it with the biller (pay it late, or cancel it)."
- **UX NEW-3** — 2 stale "Short this cycle" *code comments*. **Fixed.**

### Deferred (triaged, non-blocking)
- **Correctness NEW-3 (minor)** — reserve-release scope widens to all-time when `onboardedAt` is unset (legacy/migrated), bounded by the `min(…, heldReserve)` cap. Low blast radius → backlog.
- **Correctness NEW-4 (minor, note)** — the permanent variable buffer is emitted under the `discovery_holdback` category (a latent trap for a future consumer assuming that bucket is temporary). Consider a distinct `variable_buffer` category later → backlog.
- **Premium/UX INFO** — recovery defer-checklist and RequiredActions mark-paid checklist list the same bills (different actions — pre-existing IA redundancy); free clear-title-over-under-line-bar (intended value-led invite, visually confirmed). → note.
- **Already Phase-3 (per round-1 triage):** hero "Free"→"Safe" label · ack-card density coordinator · "Keep essential" toggle+undo (+ its nested-Pressable device-check).

---

## Verified-correct (checked, no change)
- Stripping cold-start holdbacks but **keeping the floor** in steady-state is the right call — the floor is a permanent user-chosen reservation, so premium honestly projecting a slightly later date than free is correct, not a bug.
- `deployedToDebt` / hero framing correctly use the *dampened* (this-cycle) allocation. `combinedHoldback` clamp invariant holds. Substrate/migration backfill-safe. Notifications + calibration scorecard remain models of honest design.

## Round-2 verification gate
`tsc` clean · `test:regression` · `test:app` (incl. the What-If/Payoff parity assert) · `test:scenarios` · `lint:rn` · `test:e2e:rn` **18/18** — all green after the round-2 fixes.
