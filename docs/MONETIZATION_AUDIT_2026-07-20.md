# Debt Planner — Monetization Audit (adversarial)

_2026-07-20. Commissioned before building the v1.7 revenue spine, to answer bluntly: **are our current + planned tiers worth their price, how do we elevate them, and when (which version) should each tier + annual roll out?** Two independent scouts — an external market/WTP pass and an internal code-level tier audit — plus synthesis. They converged, which is why the conclusions below are stated with confidence. Source citations are inline in §5._

---

## 0. Executive verdict (blunt)

1. **Premium+ at $9.99 is the wrong *next* move, and as-coded it's indefensible.** In shipped code, Premium+ differs from Premium by **exactly one feature — `unlimited_history`**. Flipping it live today would sell "+$5/mo to see pay cycles past #6." The intended bundle (Drift · full amortization · momentum chart) **isn't even gated as premium_plus features yet** (`features.ts:17-19`; the RN Drift card uses a placeholder `subscriptionPlan==='premium_plus'` check).
2. **Cannibalization is real and structural, not cosmetic.** Premium's strongest *recurring* hooks — Smart Insights + Forecasting — already live in tier 1. So at the $9.99 gate the honest user question is "what's left to pay more for?" Today's answer: history depth. Even after the v1.7 plan: "Drift + more detail." A ~$5 step asks for **2×**, which only converts on a **distinct, non-substitutable job** — not "Premium with more."
3. **The single biggest threat isn't pricing — it's the graduation paradox.** A pure debt tracker's success event (debt = $0) **is** the cancel event. You're renting against ~88.6% year-one monthly churn with no structural offset. This is unfixable with price; only **scope** (net-worth / "next goal") or an inherently recurring job fixes it.
4. **The highest-ROI lever the evidence supports is ANNUAL — not a second tier.** Annual renews ~83% vs ~40% monthly and yields ~2× revenue-per-install. But annual **should follow real monthly-retention data**, not precede it ("annual can mask a broken product").
5. **Seriously weigh a one-time / lifetime unlock.** The "calculator as a subscription" revolt is documented and rating-destroying — and this audience (people actively trying to spend less) is the least receptive on earth to a recurring charge for math. Lifetime also monetizes the exact graduating user you otherwise lose.
6. **Your existing instincts are validated.** Generous free tier, premium-on-the-complexity/foresight-axis, no-paywall-on-basics — the market evidence backs all of it. The free tier is correctly generous; keep it.

**Net:** don't flip Premium+ at v1.7. Build the spine + gate the real features, keep the flag **off**, fix Premium's under-selling, build (but don't necessarily launch) the annual seam, and make the two strategic calls below — the **churn-paradox fix** (Net Worth as the "next goal") and the **lifetime option** — before Premium+ has a reason to exist.

---

## 1. The two structural threats

### 1a. Cannibalization (why Premium+ can't currently justify +$5)
The gating logic (`hasFeatureAccess.ts:13-23`) gives Premium **everything except `premiumPlusOnlyFeatures`**, and that set is a single entry: `["unlimited_history"]` (`features.ts:17-19`). The recurring, re-earn-every-cycle value (Smart Insights, Forecasting) is in **Premium**. A second tier needs a *separable job*, not more of tier 1. Right now there is no separable job above Premium except "see older history."

### 1b. The graduation paradox (why a subscription barely fits at all)
The "graduation effect" is named and documented: users improve, feel done, churn. A debt app is the **acute** case — the exit trigger is a concrete, celebrated, one-time event. The only proven escapes: **expand scope into a never-ending wellness journey** (cash flow → EF → debt → **net worth** → investing), the **"next goal" pivot (debt → net worth)** (PocketGuard's explicit play), or an **inherently recurring job** (Rocket Money's perpetual bill surveillance). Streaks/polish help only at the margin and don't fix finite scope. **This makes Net Worth / next-goal a retention necessity, not a nice-to-have — and it doubles as the missing Premium+ job.**

---

## 2. Verified current tier → feature → price map

**Prices:** Free · Premium **$4.99/mo, monthly-only, LIVE** (`V16_REVIEWER_NOTES.md:25,51`) · Premium+ **$9.99/mo, NOT sold** (`plans.ts:13` `PREMIUM_PLUS_AVAILABLE=false`) · Ultimate $14.99/mo planned v2.0/AI (`FUTURE_VERSIONS.md:289`).

| Feature | Free | Premium $4.99 | Premium+ $9.99 |
|---|:-:|:-:|:-:|
| Payday-allocation engine · set-aside · debts/bills/goals · payoff order · focus debt · trajectory chart · strategy toggle · **Payday Autopilot** · Interest-Saved card | ✅ | ✅ | ✅ |
| Smart Forecasting (`forecasting`) | — | ✅ | ✅ |
| Payoff Guidance (`strategy_comparison`) | — | ✅ | ✅ |
| What-If (`what_if_scenarios`) | — | ✅ | ✅ |
| Adaptive Recs (`smart_insights`) | — | ✅ | ✅ |
| Amortization — focus-debt "lite," one debt (`amortization_schedule`) | — | ✅ | ✅ |
| Pay-cycle history — **6-cycle cap** (`pay_cycle_history`) | — | ✅ (last 6) | ✅ |
| **`unlimited_history`** | — | — | ✅ **(the only premium_plus-exclusive feature)** |

**Drift · full amortization calendar · momentum chart** = intended Premium+ bundle but **not yet `PremiumFeature`s** — must be added to the enum + `premiumPlusOnlyFeatures` before any flip. Two code drifts to fix: `usePayCycleHistory.ts:26` comment wrongly says history is "(Premium+)"; `premiumMarketingHighlights` (`features.ts:38-44`) omits history + amortization, so **the paywall undersells Premium.**

---

## 3. Per-tier verdict

<details><summary><b>Free — correctly generous (keep). Converts by design, not by accident.</b></summary>

The uncopyable moat (payday engine, set-aside, Payday Autopilot, payoff date, Interest-Saved) is all free — a deliberate, *correct* differentiation choice validated by market evidence (gating snowball/avalanche or the payoff date is a documented rating-killer). Adversarial caveat: because free fully answers the stressed user's core question, everything paid sits on the weaker *foresight/analytics* axis. Accept that premium is a foresight/tax-time/accountability play, not an "unlock the core" play. Don't try to fix conversion by clawing back free value.
</details>

<details><summary><b>Premium ($4.99) — defensible but recurring-thin and self-undersold.</b></summary>

Content: 5 gated features + 6-cycle history + focus-debt amortization. Problem: **half is one-and-done** (Strategy Comparison, What-If = run once, learn, never reopen). The recurring justification rests on **Smart Insights + Forecasting** (genuinely re-earn value each cycle). At $4.99 that's OK-not-strong — and the paywall makes it worse by not listing history/amortization. **Fixes:** add history + amortization to the marketing highlights; keep Smart Insights as Premium's permanent recurring anchor.
</details>

<details><summary><b>Premium+ ($9.99) — NOT worth it as coded; borderline even as planned. The core problem.</b></summary>

As shipped: +$5 for unlimited history = insulting. As planned (Drift + full calendar + momentum + unlimited history): only **Drift** is differentiated + recurring; the rest is "more detail/more history" of what Premium already shows. Combined with the cannibalization in §1a, this tier converts in the low single digits unless (a) the three planned features are actually gated premium_plus, (b) Drift becomes the tier's whole identity, and (c) at least one more *recurring, separable* feature joins it (see §4).
</details>

---

## 4. Elevation recommendations

**Premium**
- Add `pay_cycle_history` + `amortization_schedule` to `premiumMarketingHighlights` — you already give them; sell them.
- Keep Smart Insights as the always-fresh recurring anchor (never promote it up a tier).

**Premium+ — it needs a *spine*, not a history-cap**
- **Code prerequisite before any flip:** make Drift, full amortization calendar, and momentum chart real gated `PremiumFeature`s in `premiumPlusOnlyFeatures`. Until then the tier literally sells "unlimited history."
- **Make Drift Tracker the entire identity** ("know if you're ahead or behind your plan, every cycle") — it's the only recurring, differentiated, emotionally-resonant hook. History/calendar/momentum are supporting detail, never headliners.
- **Give it a second separable job.** Best candidate on your own roadmap: **Net Worth Tracker** (currently v1.11, `FUTURE_VERSIONS.md:201`) — it is simultaneously (i) the graduation-paradox fix (§1b), (ii) a genuinely separable Premium+ job ("track assets, not just debt"), and (iii) the "next goal" that retains the debt-free user. Multi-Scenario Planning (`:110`) is the runner-up.
- **Kill standalone "unlimited history" framing** — depth-gating past cycle 6 reads as nickel-and-diming. Bundle it silently.

**Model-level: put a one-time / lifetime option on the table.** Lifetime is now mainstream (6.4%→10.3% of plans; PocketGuard sells it) and it directly monetizes the graduating user + hedges the subscription-fatigue revolt for a spend-less audience. Candidate shapes: a lifetime unlock of Premium, and/or reserve *recurring* billing for the genuinely-ongoing tier. **This is a strategic fork for Jason — not a default.**

---

## 5. Market reality (condensed, cited)

- **Comps:** upper-tier finance pricing runs $12.99–$17.99 (YNAB/Monarch $14.99, EveryDollar $17.99, PocketGuard $12.99, Cleo $14.99) — **$9.99 as a number is fine.** Cheap debt-specific tools anchor low (Undebt.it ~$10/yr; Debt Payoff Planner $6.99/mo, $27.99/yr). ([WalletHub](https://wallethub.com/answers/b/best-budget-app-for-paying-off-debt-2140886088/), [YNAB](https://www.ynab.com/pricing), [PocketGuard](https://pocketguard.com/pricing/), [Undebt.it](https://undebt.it/plus-info.php))
- **Tally** (automated payoff, a16z, $172M) **shut down Aug 2024** out of cash — but that's the *lending* model's balance-sheet risk, which a planning tool doesn't carry. ([TechCrunch](https://techcrunch.com/2024/08/12/a16z-backed-fintech-tally-which-raised-172m-in-funding-is-shutting-down-after-running-out-of-cash/))
- **Conversion:** anchor to **~2%** freemium download→paid (not 5–8%; no finance-specific benchmark exists — don't borrow the 9.8% "Business" figure). Hard paywalls ~10–12% but wrong for a debt app. Win on surfacing the **aha number** (payoff date / interest saved) at the moment of intent; longer trials (17–32 days) convert ~42% vs ~25% for ≤4 days. ([RevenueCat](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/), [Adapty](https://adapty.io/state-of-in-app-subscriptions/))
- **Annual timing:** first tier → **prove monthly retention** → *then* annual → tiers last, at scale. Annual ~83% renewal / ~2× RPI, but premature annual masks a broken product; price the discount off *your own* retention. ~38% annual mix overall, finance skews lower. ([RevenueCat](https://www.revenuecat.com/blog/growth/monthly-subscriptions-when-to-offer), [state-of-subscription-apps](https://www.revenuecat.com/state-of-subscription-apps))
- **Two-tier forfeits the decoy lift** (good-better-best raises AOV ~15–25% by anchoring on the middle; two tiers get none of it). ([getMonetizely](https://www.getmonetizely.com/articles/the-decoy-effect-how-strategic-pricing-tiers-can-maximize-revenue))
- **Lifetime/one-time** growing 6.4%→10.3%; "calculator = subscription" complaints "cluster and hit ratings hard… the fix is rarely engineering." ([Adapty](https://adapty.io/blog/9-subscription-trends-dominating-2025/), [Enterpret](https://www.enterpret.com/guides/the-6-types-of-complaints-that-drive-low-app-store-ratings))
- **WTP for debt users:** auto-sync (Plaid) is **overrated** for debt (you track balances, not coffee); scenario strategies **must be free**; the honest paid signals are **human accountability** and **friction/ad-removal via one-time purchase**. Tax-feature WTP is unvalidated for debt (that's Gig knowledge). ([FinCompareLab/EveryDollar](https://www.fincomparelab.com/guides/everydollar-pricing/), [LendEDU](https://lendedu.com/blog/best-debt-payoff-app/))

_Caveats: RevenueCat sells subscription infra (bias), but Adapty independently corroborates magnitudes; no public "Finance" conversion benchmark exists; review sentiment came largely via aggregators. Treat decimals as approximate._

---

## 6. Recommended version-sequenced rollout roadmap

_The core deliverable. "Build" = code exists (possibly gated off); "Launch" = sold to users._

| Version | Tiers / levers | Action | Why this version |
|---|---|---|---|
| **v1.7 (current)** | Premium (live) · Premium+ (build, **flag OFF**) · annual seam | Build the full spine + gate Drift/amort-calendar/momentum as real premium_plus features. **Fix Premium's paywall** (list history+amortization). Build the period-aware annual selector (seam only). **Do NOT flip `PREMIUM_PLUS_AVAILABLE`.** | Spine + gating is stack-work that belongs in the RN build; but Premium+ has no separable job yet, and there's no retention data for annual. Ship value, not the flip. |
| **v1.7–v1.8 window** | **Premium Annual** | **Launch** once Premium has a few months of real monthly-retention/conversion data (the Gig-ASA-style read). Price the discount off *our* retention, not comps. | Highest-ROI lever, but only after data — premature annual masks a broken product. Seam already built, so launch is a config step. |
| **v1.8** | (Android) | No monetization change; Android parity. | Distribution, not pricing. |
| **v1.9** | **Premium+ launch candidate** | Pull **Net Worth Tracker** forward to here (from v1.11) as Premium+'s second separable job + the graduation fix. **Flip Premium+ live only when the bundle = Drift + Net Worth + amortization calendar + momentum** clearly justifies $9.99 (Jason's value-gate). | This is when Premium+ finally has a *distinct job* (assets, not just debt) + the retention story. Reconcile the v1.9-vs-v1.10 annual doc-drift here. |
| **v1.9–v1.10** | **Premium+ Annual** + **[DECISION] lifetime/one-time** | Add Premium+ annual alongside launch. Decide the lifetime-unlock question (monetize the graduating user; hedge sub-fatigue). | Annual across both tiers once each has monthly data; lifetime is the graduation-paradox hedge. |
| **v2.0** | **Ultimate $14.99 + AI** | Introduce Ultimate only when AI ships — restores the 3-tier decoy lift ($4.99/$9.99/$14.99). | Correctly timed; a permanent empty ASC product now = calcification (lock-before-setup). |

**Two blunt sequencing corrections vs. the old plan:** (1) **Premium+ does NOT launch at v1.7** — it launches when it has a separable job (Net Worth pulled forward), likely v1.9. (2) **Annual is not deferred to v1.10** — the *seam* is v1.7, the *launch* is data-gated (v1.7–v1.8 window), because annual is the biggest lever and shouldn't wait years.

---

## 7. Risks
- **Churn/graduation (highest):** finite scope forfeits subscription stickiness → address with Net Worth/next-goal, not price.
- **Cannibalization:** re-slicing $4.99 value into two tiers can down-sell current buyers + confuse new ones → Premium+ must be a *new job*.
- **Rating revolt:** "sub for a calculator" 1-stars, worst for a spend-less audience → keep the core free, consider lifetime.
- **Premature annual:** masks a broken product / false PMF → gate launch on retention data.
- **App Store 3.1.2:** the paywall must show price-as-hero + auto-renew disclosure + Terms/Privacy + restore (Gig's is compliant; copy it).
- **Involuntary churn** >23% of cancellations → dunning/grace when the spine lands.

---

## 8. Impact on the paused C.2 revenue-spine build
The spine work is **still worth building now** — none of the above changes the *code* needed (facade, tier-aware context, paywall, gating, subscription→core). What changes is **scope + the flip**:
1. **Add** Drift/amortization-calendar/momentum to the `PremiumFeature` enum + `premiumPlusOnlyFeatures`, and swap the Drift card's placeholder gate for `hasFeatureAccess`.
2. **Fix** `premiumMarketingHighlights` (Premium undersell) + the `usePayCycleHistory.ts:26` comment.
3. **Build** the period-aware annual selector seam.
4. **Keep** `PREMIUM_PLUS_AVAILABLE=false` — the flip is now explicitly a **v1.9 value-gate** (Drift + Net Worth), not a v1.7 step.
5. **Do NOT create permanent ASC products** for Premium+ / annual until their launch versions.

**Open decisions for Jason (see chat):** (D-M1) hold the Premium+ flip to ~v1.9 + pull Net Worth forward as its second job? (D-M2) pursue a lifetime/one-time unlock? (D-M3) launch Premium Annual on a data-gate in the v1.7–v1.8 window?
