# Guardian Convergence Audit — 2026-07-24

> **Gate:** the Payday Cushion Guardian is functionally complete through 2.6 (Recovery Plan). This is the flagship adversarial audit before the Guardian ships — the question it answers: **is it premium, worth the price, honest, and coherent?**
>
> **Method:** 4 independent adversarial lenses (correctness/substrate · honesty/trust · premium-value/tier-line · UX-coherence/wording) reviewed the real code + the flagged after-scan ledger (2.4/2.5/2.6). Every load-bearing finding was re-verified against `file:line` by the synthesizer — reviewers can be wrong too; consensus is the gate. The lenses both **confirmed** real defects and **refuted** several ledger items.

---

## ⚖️ VERDICT

**The engine is sound and premium is genuinely worth paying for — but the Guardian is NOT ship-ready as-is.** The correctness lens verified the recovery defer→shortfall math, the holdback composition, and the substrate/migration as correct and backfill-safe; the premium mechanic is a real allocation divergence, not dressed-up text. There is **no fundamental redesign needed.**

What blocks ship is a tight cluster of **honesty, accessibility, and coherence defects concentrated at the two newest/most-fragile seams**: the **Recovery flow** (built this session) and the **free crisis read**. Three of the four lenses independently converged on the free-shortfall-read defect; two independently converged on the autopay-defer defect — that convergence is the consensus signal.

**9 must-fix-before-ship items** (below), most small and well-scoped. Fix them and the Guardian clears the bar.

### Disposition (Jason 2026-07-24)
- **Fixing NOW** (before Guardian ships): every **major/severe/blocker** (MF.1–MF.6) **plus the Tier-1/Tier-2 minors** folded in (MF.7 polish: `cycle`→`paycheck`, variable-buffer label, trial "Not now"; and the Tier-1 items — state-aware invite, `keepEssential` freshness, "starting today" copy — folded into MF.1/MF.3). See `DEBT_ELEVATION_PLAN.md` Active Queue (MF.1–MF.7).
- **Committed to Phase 3 — NOT dropped:** the remaining Tier-3 findings (hero "Free"→"Safe" label · ack-card density coordinator · "Keep essential" toggle+undo) are scheduled into Phase 3 (filed in the plan's Phase-3 section), where they get the design attention they need. The "future/watch" items likewise remain on record.
- **Gate:** a **round-2 convergence audit** (same 4 lenses/criteria) re-runs against the fixed code — Guardian is not called done until synthesizer + agents reach **consensus** it's premium-level.

---

## 🔴 MUST-FIX BEFORE SHIP

| # | Finding | Lenses | Where | Fix |
|---|---|---|---|---|
| 1 | **"Defer" gives false coverage on autopay.** `deferExpense` only re-dates the bill in the app's projection; it cannot stop a real charge. Autopay subscriptions/utilities land in "SAFE TO DEFER" (nothing filters `isAutopay`), get pre-checked, and the user reads "Deferring covers your $X gap" → taps Apply → the bank still auto-debits → overdraft. **The single most harmful defect — the opposite of the trust moat.** | Honesty (BLOCKER) + Correctness | `recoverySelectors.ts:34-38` · `store.ts:285` · `RecoveryPlanSection.tsx:107` | Exclude `isAutopay` from deferrable candidates (surface them as "can't defer — on autopay"); add an honest line that deferring reschedules *your plan*, not the biller's charge. |
| 2 | **Recovery controls are unreachable to VoiceOver.** The interactive block (defer checkboxes, Apply, "Keep essential") — plus the tight-case top-up and the bills-attestation toggle — sit inside the Guardian card's `accessible` group, which collapses descendants into one element on iOS. The flagship premium feature is inoperable to screen-reader users. (The author knew the trap — "Adjust your line" was deliberately placed outside it.) | UX (BLOCKER) | `PaydayGuardianCard.tsx:108-231` vs the outside-group pattern at `:233` | Move the interactive block (recovery / topUp / attestation) OUTSIDE the `groupLabel` View, exactly as "Adjust your line" already is. One fix clears all three. |
| 3 | **Uncategorized/`other` bills default to deferrable AND get pre-checked** — so "Rent" left at the `ExpenseSheet` default category is pre-suggested as top "safe to defer." Migrated pre-category bills (no category) are all deferrable too. Pre-check + one-tap Apply = effectively auto-deferring a bill we can't classify. | Correctness + Honesty | `classifyDeferability.ts:15-19` · `ExpenseSheet.tsx:38` · `onboarding/FirstDebtOrBillStep.tsx:77` | Treat unknown/`other` as **essential** for deferral (don't call a bill you can't classify "safe"), OR never pre-CHECK an uncategorized bill (offer unchecked only). |
| 4 | **Free's shortfall read is softened — the honest "you're short" statement is accidentally premium-gated.** The `!isPremium` branch returns *before* the shortfall branch, so a free user who genuinely can't cover sees "Tight this paycheck — $0 after everything required, a bit tight this one" and is **never told they're short $X** — while the tier-agnostic hero directly above says "Short this cycle." A paywall on basic honesty + a free-completeness violation (3.1.2-adjacent). **Triple-confirmed** (premium-value, honesty, UX). | Premium-value + Honesty + UX | `buildGuardianBrief.ts:224-237` (free) vs `:240-251` (premium) | Give free an honest shortfall read (title "This paycheck won't cover everything" + "you're about $X short"); keep only the **built plan** (classify/defer/apply) premium. Line becomes: *free sees you're short → premium builds the plan.* |
| 5 | **Cold-start holdback extrapolated as PERMANENT → premium debt-free date reads LATER than free.** `selectDebtFreeDate` / trajectories / interest-saved extrapolate `selectExtraToDebt(allocation)` across the whole multi-year payoff, but that allocation is temporarily dampened during cold-start (40% discovery hold + full floor). Premium deploys ~$60/cycle (held) vs free ~$350 → premium's projected freedom lands months/years later on a headline surface; downgrading shows an *earlier* date. | Correctness | `payoffSelectors.ts:62` · `planSelectors.ts:62-72` · `selectors.ts:62-64` | Project the payoff on the **steady-state** deploy — strip the temporary discovery/cold-start holdback fractions from the allocation used for long-horizon extrapolation. |
| 6 | **Reserve-release ack overstates.** "Your safety net did its job — it covered a $X surprise" uses the **uncapped** full `surpriseOutflowLog` sum, and `tapped` flips on *any* logged surprise — even when the held reserve was never actually drawn, and when the sum exceeds the small reserve held. Fabricates a flattering causal claim. (Confirms 2.4d.) | Honesty | `index.tsx:212-213` · `payday.ts:165-167` | Cap `covered` at the reserve actually held; set `tapped` only when the confirmed cushion fell into the reserve band; scope the sum to the hold window; else use the neutral "you didn't need it" branch. |
| 7 | **Three competing shortfall surfaces.** On a shortfall Today, the plan-hero ("Short this cycle"), the Guardian Recovery Plan, AND the `RequiredActionsCard`'s own un-gated "Short this cycle — cover these…" unfunded block all render — duplicating the same bills across up to four lists. The "one Recovery entry" vision (2.6a) is not met. | UX + (Premium-value) | `RequiredActionsCard.tsx:118-132` · `index.tsx:172` | When `isPremium && recovery`, suppress the `RequiredActionsCard` unfunded block and let Recovery own the shortfall; route all "you're short" language through one voice. |
| 8 | **Recovery dead-end copy.** When every due bill is essential (`safeToDefer` empty) but `gap > 0`, the line reads "Still $X short — **pick more to defer**, or add income" with nothing to pick. (More common after fix #3.) | UX + Correctness | `RecoveryPlanSection.tsx:105-110` | Add a `safeToDefer.length === 0` branch → income-only guidance ("Nothing here can safely wait this paycheck — adding income is the surest fix, or cover from savings"). |
| 9 | **First-run copy seam.** "Your floor is protected from today" parses as "protected *against* today." Cheap, high-visibility. | UX | `PaydayGuardianCard.tsx:94` | "Your floor is protected, **starting today**." |

---

## 🟡 PHASE-3 (fold into the delight/interactivity + wording passes)

- **Hero "Free" vs Guardian "Cushion" label contradiction** — the same dollars are labeled "Free" (hero) and protected "Cushion / Your line" (Guardian). The *numbers reconcile* (Free = Cushion + To debt — honesty lens verified, so **2.4b refuted as a contradiction**), but the *labels* send opposite messages. Design-shaped → bring options (rename hero "Free" → "Safe"/"Flexible"). `PlanHero.tsx:80`.
- **Ack-card density has no coordinator** — reserveRelease/walkback/trial/lean/riskCleared + hero + Guardian(+recovery) + RequiredActions can stack 5–6 deep. Add a single ack-slot / priority cap. (2.4c/2.6c.) `index.tsx:187-260`.
- **Variable-bill buffer mislabeled "Settling-in reserve"** — it's structural/permanent (premium-gated, not cold-start), yet folds into the `discovery_holdback` ("Settling-in reserve") bucket + "you didn't need it" release copy. Give it its own label/branch. (2.5.3b.) `allocatePaycheck.ts:389-417`.
- **`keepEssential` resets read-freshness** — `updateExpense(…{deferability})` runs `stampInputsFresh`, so a classification toggle makes a stale read look fresh. Skip the stamp for a deferability-only change. `store.ts:239-245`.
- **"Keep essential" is one-directional + mis-tap-prone** — permanent, no inverse from the card, nested in the checkbox tap target. Make it a toggle / add undo / move the tap target. (2.6d.) `RecoveryPlanSection.tsx:89-95`.
- **`cycle` vs `paycheck` drift** — standardize user-facing on "paycheck" (hero + recovery mix both). `PlanHero.tsx:95`, `RecoveryPlanSection.tsx:109`.
- **Trial ack card stacks 3 loose affordances** — Keep/Cancelled row + a third full-width "Not now". Demote dismissal to an inline "×"/"Later". (2.5g.) `index.tsx:242-249`.
- **State-aware free invite** — pitch the recovery value (not "cushion at your line") in a shortfall. (The honesty lens split this from #4: the read is must-fix, the *invite wording* is Phase-3.) `PaydayGuardianCard.tsx:227`.
- **Attestation variable-income hint** — for a variable earner the reserve reduction is capped by cold-start; copy gives no hint income-variance is now the binding reason. Minor. (2.4c residual.)

## 🟢 FUTURE / WATCH

- **Variable buffer never widens future cycles or the band** — it shapes cycle-0 held-reserve display only; a variable bill can push a *future* cycle tight with no reservation shown. Projections use typed amounts by nature. (2.5e confirmed.) `selectors.ts:68` · `buildMultiCycleTimeline.ts`.
- **Moat copy forward-risk** — "Private · on your device", "all on your device", "never sells you more debt" are honest **today** (no network/Plaid path in code); revisit the moment a Connected/bank-link tier lands. `index.tsx:265`.
- **`selectTightTopUp` can offer the emergency fund as a top-up source** — draining the EF to make an ordinary paycheck is questionable UX (no same-cycle fund-then-drain contradiction though — 2.4d "starter-EF overstates cushion" **refuted**: the floor is reserved before the EF is funded). `guardianSelectors.ts:179`.
- **Clear-case `safeMove` is thin** — close to a restatement of the hero's suggested row. Low priority. `buildGuardianBrief.ts:290`.
- **Leftover-numbers bridge** — an optional one-line tie ("of your $400 free, $300 held as cushion, $100 to debt") to pre-empt a glancing misread.

---

## ✅ REFUTED / DE-ESCALATED (the adversarial process working both ways)

- **2.4(a) "premium reads later than free" as a *positioning* risk → REFUTED as an in-app issue** (no surface shows both tiers side by side; the late-erring date is the conservative/honest direction). **BUT** it exposed a real *correctness* bug underneath → must-fix #5. Watch any future paywall comparison table.
- **2.4(b) "conflicting numbers on Today" → REFUTED as a contradiction** — hero Free = Guardian Cushion + To debt; they reconcile. Downgraded to a Phase-3 *labeling* polish.
- **2.4(c) attestation over-promises → largely REFUTED** — discovery/cold-start compose by `max` (not sum), so "smaller safety net" is literally true. Minor variable-income copy hint only.
- **2.4(d) starter-EF deploy overstates cushion → REFUTED** — the floor is reserved as `cushion_buffer` before the starter EF funds; no fund-then-breach. (The `selectTightTopUp`-offers-EF part survives as a minor UX note.)
- **Substrate / migration → CONFIRMED SAFE** — all new optional fields (`isTrial`/`fullAmount`/`fullChargeDate`/`expenseType`/`category`/`deferability`) are backfill-safe; no un-backfilled reader; `genuineCycleCount` gate correct at cycle 0/1/2.
- **Recovery core mechanic → CONFIRMED SOUND** — `deferExpense` drops the bill dollar-for-dollar on the strict `<` boundary; rollover carries an unpaid deferred bill correctly; `buildRecoveryPlan` ranking/`EPS`/suggested-set math verified, no off-by-one.
- **Notifications + calibration scorecard → models of honest design** — risk-only pushes, false-clear/false-tight reported separately, no hollow pre-proof number.

---

## Per-lens verdicts (one line each)

- **Correctness/substrate:** engine + substrate correct; the defer→shortfall math is sound — but two classification holes (autopay, uncategorized-defaults-deferrable) + the cold-start projection extrapolation must be fixed. *Top fix: #5.*
- **Honesty/trust:** core voice is honest (hedges projections, owns its miss direction) — but three claims overstate at the moments trust is most fragile (defer, reserve-release, free shortfall). *Top fix: #1.*
- **Premium-value/tier-line:** premium is genuinely worth paying for; the tier line is right on *what's* premium, mis-drawn on *how free's crisis read is written*. *Top fix: #4.*
- **UX-coherence/wording:** the read surfaces cohere and copy is largely premium — but it doesn't yet cohere as "one Recovery entry" and has an a11y ship-blocker. *Top fix: #2.*

## The "depth vs. legibility" question (Jason 2026-07-24)

The Guardian looks modest but packs enormous machinery — the premium ideal (calm surface, deep engine). The audit's read: the depth is **real and worth paying for** (verified), and the value is **legible enough** *except* where the free/crisis read under-tells it (#4) and where recovery's honesty seams undercut trust (#1, #3). Making the depth *felt* — progressive disclosure (the bar zones, the drill-down, the recovery expansion) — is the Phase-3 interactivity + 3.5 tutorial's job, not a must-fix. We have not packed *too much*; we need the free read honest and the recovery seams trustworthy.
