# Debt Planner — Best-in-Class Benchmark: Premium Substance + Monetization Model

_Phase 0.3 of the Elevation. 2026-07-20. External, cited teardowns of what first-in-class debt/budget/finance and adjacent journey apps actually **gate, charge for, and model** — feeding the reshape-spec's open decisions (D1–D7, D-M1–3). Read-only research; no code changed. Every load-bearing claim is grounded in a real app or a real monetization source (linked inline). Pairs with `MONETIZATION_AUDIT_2026-07-20.md` (strategy) + `PREMIUM_RESHAPE_SPEC.md` (the intended set)._

> **How to read this:** §1 = per-app teardowns (what they gate + price + model). §2 = the patterns that repeat. §3 = the reshape pillars ranked by willingness-to-pay (WTP) evidence. §4 = the free/premium line. §5 = the model (one tier + Lifetime + portfolio seam) with precedent + the churn answer. §6 = paywall presentation. §7 = **Applied recommendations** — a position on every open decision.

---

## 1. Per-app teardowns (what they actually gate + charge for)

### Debt / budget / PFM apps

<details open><summary><b>YNAB — one plan, no tiers, no upsells. The "generous-single-price" archetype.</b></summary>

- **Model:** ONE subscription, **$14.99/mo or $109/yr**, identical features monthly vs annual. No free tier, no feature paywalls, no tiered upsells — every subscriber gets the whole product. 34-day free trial, no card. Students get 12 months free; one sub covers a household of up to 6. ([YNAB pricing](https://www.ynab.com/pricing), [FinCompareLab](https://www.fincomparelab.com/guides/ynab-pricing/))
- **What people pay for:** the *method* (zero-based budgeting) + the tooling around it, not a locked feature list. YNAB never plays good-better-best.
- **Lesson for us:** validates **one clean tier** and a **generous trial**; but YNAB charges for the whole app (no free tier) — the opposite of our "generous free front-door." We take YNAB's *tier simplicity*, not its no-free-tier stance.
</details>

<details open><summary><b>Monarch Money — went to TWO tiers in 2026, gating "model your future," not the core.</b></summary>

- **Model:** **Core $99.99/yr** (unlimited sync, AI assistant, shared household/couples). New **Plus $199/yr** adds **long-term forecasting + scenario planning, deeper investment analysis, business/rental income, equity-comp tracking** — explicitly for "power users who want to model their entire financial future." ([x1wealth compare](https://x1wealth.com/compare/copilot-vs-monarch), [envelopebudgeting](https://envelopebudgeting.com/articles/monarch-money-review))
- **What the +$99 tier gates:** *complexity and foresight* (scenario planning, business/rental, equity comp) — never the daily tracking. Exactly the "premium sits on the complexity/foresight axis" thesis.
- **Lesson for us:** if a second tier ever exists, it must gate a **separable complexity job** (scenarios / assets), which is precisely what the audit says Premium+ lacks today.
</details>

<details open><summary><b>Copilot Money — Apple-only, AI + polish as the paid pitch; couples pay twice.</b></summary>

- **Model:** ~**$95/yr**, Apple-only, one tier. Bets on AI categorization + Apple-ecosystem design polish. Couples each need a separate sub (~$190/yr combined) — a friction Monarch beats with one household sub. ([x1wealth](https://x1wealth.com/compare/copilot-vs-monarch), [FinCompareLab review](https://www.fincomparelab.com/reviews/copilot-money-review/))
- **Lesson for us:** *design polish itself is a paid differentiator* in this category (Copilot's whole pitch) — supports the reshape's "premium feel is part of premium value." And "couples pay twice" is a cautionary note for our **partner/CPA-sharing** feature: sharing a plan should not require the recipient to pay.
</details>

<details open><summary><b>Rocket Money — the recurring-job archetype: perpetual bill surveillance + concierge.</b></summary>

- **Model:** "pay-what's-fair" **$7–$14/mo**, 7-day trial. **Free** already includes subscription tracking, bill-negotiation access, bill/credit tracking, basic budgeting (2 custom categories). **Premium** adds unlimited categories, the **cancellation concierge**, automation, smart savings. **Bill negotiation is performance-priced (35–60% of first-year savings), available to everyone.** ([Rocket Money pricing](https://www.rocketmoney.com/learn/personal-finance/how-much-does-rocket-money-cost), [FinCompareLab](https://www.fincomparelab.com/guides/rocket-money-pricing/))
- **Why it beats the graduation paradox:** its core job (watching subscriptions/bills forever) *never finishes* — the anti-pattern to our debt→0 problem. It monetizes an **inherently recurring surveillance job**, plus success-fee revenue that isn't a subscription at all.
- **Lesson for us:** our recurring job must be the **payday loop** (remind→verify→track every cycle) — the only part of a debt app that recurs like Rocket's bill-watch. Everything one-and-done (a payoff projection) can't carry a subscription.
</details>

<details open><summary><b>PocketGuard — sells the debt-payoff plan as Plus, AND ships a Lifetime unlock.</b></summary>

- **Model:** Free (capped) → **Plus** monthly/annual → **Lifetime $149.99 one-time** (seen promo'd at **$79.99**). Plus removes caps and gates the **debt-payoff plan**, unlimited accounts/categories, bill-due push, in-app cancellation. ([PocketGuard pricing](https://pocketguard.com/pricing/), [CheckThat](https://checkthat.ai/brands/pocketguard/pricing), [NerdWallet](https://www.nerdwallet.com/finance/learn/pocketguard-app-review))
- **Why it matters most to us:** PocketGuard is the closest strategic mirror — it (a) sells a **lifetime unlock** in a debt/budget context, and (b) uses the **"next goal" pivot** (debt → net worth) the audit flagged as the graduation-fix. Their lifetime exists precisely to capture the user who won't rent forever.
- **Lesson for us:** Lifetime at **~$79–150** is *category-normal here*, not exotic. Anchor our Lifetime to PocketGuard's **$79.99** promo, not to generic 5×-annual math.
</details>

<details open><summary><b>Undebt.it+ — the near-exact analog of our reshape spec, at $10–12/yr.</b></summary>

- **Model:** free core (unlimited debts, all snowball/avalanche/custom strategies, payment calendar) → **Undebt.it+ ~$10–12/yr** (non-recurring). ([Undebt.it+ page](https://undebt.it/plus-info.php), [Spendify](https://spendify.money/blog/best-debt-payoff-apps/))
- **What + gates (and it maps almost 1:1 onto our reshape's Premium pillars):**
  - **SMS/text payment reminders** on custom schedules + **autopay** (apply planned payment on due date) → *our Payday Partner loop.*
  - **Calendar sync** (Google/iCloud/Outlook) + full calendar planner + per-account **amortization table** → *our reminders/calendar + full amortization pillar.*
  - **"Debt Payoff Snapshot Stories"** (auto-generated monthly), **"Debt Payoff Journey Infographic"** (progress %), **"Printable Payoff Table w/ Thermometer"** → *our milestones/momentum/shareable-card/"thermometer you fill" pillar — already a paid feature elsewhere.*
  - Monthly email summary, Excel/PDF export, ad-free.
- **Two lessons:** (1) The **active loop (reminders + autopay + calendar) and the emotional/shareable layer (stories, journey infographic, thermometer) are exactly what a real debt app already charges for** — strong confirmation the reshape is gating the right things. (2) Undebt.it+ prices it at **~$10/yr as a one-time-feel annual** — the debt audience anchors *cheap*, reinforcing lifetime/low-price sensitivity.
</details>

### Adjacent habit / journey / accountability apps (where the emotional pillars come from)

<details open><summary><b>Duolingo Super — the streak/loss-aversion monetization engine (8.9% conversion).</b></summary>

- **Model:** free with friction (energy/hearts limits, ads) → **Super** removes limits + ads, adds offline, personalized practice, and **streak repair**. **Reverse trial**: 14 days of Super *first*, then drop to free — losing premium feels worse than never having it. ([AlphaStreet](https://news.alphastreet.com/duolingo-duol-has-a-subscription-and-ai-monetization-engine-bigger-than-a-free-language-app/), [Relaunch teardown](https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html))
- **The number:** Duolingo converts **~8.9% of MAU** to paid where **2% is average and 4% is "elite"** — driven overwhelmingly by **streaks exploiting loss aversion** ("Streak Freeze" is a direct monetized upgrade).
- **Lesson for us:** **streaks + milestone loss-aversion are the highest-proven WTP mechanic in journey apps.** Our Momentum pillar (streaks, milestones) is not decoration — it is the retention engine that, done right, is *the* conversion lever. But note: Duolingo's streak is protecting *effort already invested*; our streak must protect *payoff progress* to carry the same weight.
</details>

<details open><summary><b>Strava — social/competition + deeper analysis are the paid draws; base sharing stays free.</b></summary>

- **Model:** ~**$9.99/mo / $79.99/yr**, one tier. Paid draws: **segment leaderboards + live segments** (competition), **route builder + training dashboard** (deeper analysis), and — since 2024 — **creating segments** is paid. But *basic activity sharing to the feed stays free* (it's their acquisition loop). ([Strava features](https://support.strava.com/hc/en-us/articles/216917657-Strava-Subscription-Features), [Running Genie](https://therunninggenie.com/blog/strava-free-vs-premium-worth-it))
- **Lesson for us:** the **social/comparison/accountability layer is a proven paid draw**, but the app keeps the *basic share* free because it fuels growth. Directly supports "basic milestone card = free (acquisition), richer/custom = premium."
</details>

<details open><summary><b>Finch — a cautionary tale: gating cosmetics on a free core converts weakly.</b></summary>

- **Model:** free tier gives the **full** self-care + pet core; **Finch Plus (~$9.99/mo, ~$69.99/yr)** adds cosmetics, customization, more content. Reviewers repeatedly say **"no strong reason to upgrade unless you want to personalize your bird."** ([WhistleOut](https://www.whistleout.com/CellPhones/Apps/finch-self-care-app-review), [Autonomous review](https://www.autonomous.ai/ourblog/finch-self-care-app-review-full-breakdown))
- **Lesson for us (the anti-pattern):** if Premium is mostly **cosmetic/customization** (e.g. "custom card designs" as the headline), WTP is thin. Custom card art can *ride along*, but it must never be the spine — the spine has to be an **active recurring job.** This is the same "smart text" trap the audit named, in a different costume.
</details>

<details open><summary><b>Fabulous — gates the guided programs (active coaching content), not the tracker.</b></summary>

- **Model:** **$39.99/yr**, 7-day trial. Premium unlocks **all Journeys/Challenges + daily/focus/nightly coaching + unlimited habits/routines + community**. The free tracker works; the **coached, structured programs** are the paid product. ([Fabulous Help](https://help.thefabulous.co/en/support/solutions/articles/101000406370-what-are-the-benefits-of-premium-), [ChoosingTherapy](https://www.choosingtherapy.com/fabulous-app-review/))
- **Lesson for us:** "the app does the guiding *with* you" (coached journeys) is a real paid job — the closest journey-app analog to our **"I'll do this with you every payday"** identity. Premium = the *active partner*, not the tracker.
</details>

---

## 2. Patterns synthesis (what repeats across all of them)

1. **What converts = an active, recurring, or loss-averse job — never a one-and-done readout.** Rocket (perpetual bill-watch), Duolingo (streak you'll pay to not lose), Fabulous (coached journeys), Undebt.it+ (recurring reminders/autopay). Every strong paywall sits on something that *acts again next cycle*. This is the single most important finding, and it is exactly the reshape's "active vs. passive" test — the market confirms it.
2. **Table-stakes-free vs. genuinely-premium is remarkably consistent.** Free across best-in-class debt tools = the core strategies (snowball/avalanche/custom), unlimited debts, the payoff date, a basic calendar/tracker, and *basic sharing*. Gating those is a documented rating-killer. Premium = **automation (reminders/autopay/verify), foresight/complexity (scenarios, full amortization, forecasting-as-action), the emotional/social layer (streaks, milestones, custom shares), and depth (unlimited history, PDF/partner)**.
3. **Loss aversion + streaks are the highest-WTP emotional mechanic in journey apps** (Duolingo's 8.9%). For a debt app, the analog is *protecting payoff momentum* — the Momentum pillar is a revenue lever, not polish.
4. **Basic social sharing stays free everywhere it exists** (Strava feed, Duolingo) because it *is* the acquisition loop; richer/custom social is where they charge.
5. **Cosmetic-only premium underperforms** (Finch) — a warning against leading with "custom card designs."
6. **One clean tier is the norm for focused apps** (YNAB, Copilot, Strava, Rocket, Fabulous). Two tiers appear only when there's a *separable complexity job* (Monarch Plus = model-your-future; PocketGuard Plus = remove-caps-and-debt-plan). This validates collapsing to **one Premium tier** now and reserving a second tier for a genuinely separable job (net-worth / Ava) later.
7. **Lifetime is mainstream and category-normal in debt/budget** (PocketGuard $79.99–149.99), and the market is shifting toward it: one-time/lifetime grew **6.4%→10.3%** of plan share 2023–25, **35% of apps** now mix models, and offering a one-time option alongside a sub **lifts total conversion 15–25%** (RevenueCat A/B). Avg US consumer carries **6.7 subscriptions** — sub-fatigue is real, and worst for a spend-less audience. ([RevenueCat lifetime guide](https://www.revenuecat.com/blog/growth/lifetime-subscriptions), [Adapty trends](https://adapty.io/blog/9-subscription-trends-dominating-2025/), [Influencers-Time](https://www.influencers-time.com/subscription-fatigue-rising-why-one-time-purchases-rebound/))
8. **Cross-app subscription bundles are technically native to Apple; lifetime unlocks are NOT.** A single auto-renewable subscription can unlock entitlements across multiple apps from the same developer (Apple ID–based, via a shared subscription group / server validation); **non-consumable one-time purchases do not share across apps.** ([Apple: subscription across multiple apps](https://developer.apple.com/documentation/storekit/offering-a-subscription-across-multiple-apps)) Consumer precedents for "one sub, many apps": Apple One, Adobe Creative Cloud, Microsoft 365, Setapp.

---

## 3. Reshape pillars ranked by willingness-to-pay evidence

| Rank | Pillar | WTP evidence | Verdict |
|---|---|---|---|
| **1** | **Payday Partner loop** (reminders → mark-paid → **verify** → carry-forward) | Undebt.it+ gates SMS reminders + autopay; Rocket gates automation/concierge; Fabulous = "do it with you." The only *inherently recurring* debt job. | **Premium spine. Highest-confidence charge.** |
| **2** | **Momentum: streaks + milestone system** | Duolingo's **8.9%** conversion is *built on* streak loss-aversion; Undebt.it+ sells "Journey Infographic" + "Payoff Thermometer." | **Premium retention engine.** Directly fights graduation churn. |
| **3** | **Drift (ahead/behind, recomputed each cycle)** | The audit's own finding: the only *recurring, differentiated, emotionally-resonant* hook. Accountability = a proven paid job (Strava's comparison layer). | **Premium. Fold in (Drift no longer a separate tier).** |
| **4** | **Auto-adjusting plan** (rolls freed minimums, nudges the extra, live re-compute) | "Active vs. readout" test: it *acts* every cycle. No direct comp, but it's automation, which converts. | **Premium (depth).** Real, but ships later. |
| **5** | **Custom/richer shareable cards** | Strava/Duolingo charge for *richer* social; **basic** sharing is always free. Finch warns: cosmetic-only is thin. | **Premium *rides along* — never the headline.** Basic card free. |
| **6** | **Full amortization calendar + PDF/partner sharing + unlimited history** | Undebt.it+, Monarch, PocketGuard all gate depth/export. Real, but one-and-done "depth artifacts." | **Premium (silent depth).** Bundle, never headline. |
| **—** | **"Next move" (Smart Insights reframed)** | Only premium *if actionable* (an act), free if it's a readout. | **Premium only as a single actionable rec.** |

**Table-stakes-FREE (gating these is a documented rating-killer):** snowball/avalanche/custom strategies, strategy comparison, what-if scenarios, debt-free date, trajectory chart, interest-saved headline, unlimited debts/bills/goals, a payday-eve nudge, recent history, and a **basic** milestone celebration + shareable card. ([LendEDU](https://lendedu.com/blog/best-debt-payoff-app/), audit §5)

---

## 4. The free/premium line (best practice)

**The rule the market draws:** *Free finishes the job; Premium does the job WITH you, every cycle, and carries the emotion + depth + automation.*

- **Free = "here's your plan and the answers"** — the complete analytical core a debt-stressed user needs to *understand and act once*: strategies + comparison, the payoff date, the trajectory, what-ifs, unlimited debts, a payday-eve nudge, recent history, and a basic celebration/share. This is generous by design — it is the **portfolio front-door**, and (per the audit) the debt app's real job is funnel + trust, not standalone ARPU.
- **Premium = "I'll do this with you every payday"** — the recurring loop (remind/verify/track), the emotional retention layer (streaks/milestones/momentum/Drift), automation (auto-adjust), and silent depth (full amortization, unlimited history, PDF/partner). It sits entirely on the **automation / foresight / accountability / emotion** axes — never on the core math, never by geography ([[feedback_no_paywall_basic_functionality]]).
- **Best-practice free tier = feature-complete for its job but never maintenance-done** (matches [[project_free_tier_finishes_premium_flywheel]]). Rocket/Undebt.it both keep the *core answer* free and charge for the *ongoing doing*.

---

## 5. The model: one tier + Lifetime + portfolio seam (with precedent + the churn answer)

**Recommendation: adopt the locked direction — ONE Premium tier, a Lifetime unlock, and a portfolio-subscription seam. The evidence backs all three.**

### 5a. One tier now (not two)
- Focused best-in-class apps run **one tier** (YNAB, Copilot, Strava, Rocket, Fabulous); two tiers appear only with a **separable complexity job** (Monarch Plus, PocketGuard Plus). The audit proved Premium+ has *no separable job today* (it differs by exactly `unlimited_history`). **Collapse to one Premium tier; reserve a future second tier for net-worth/assets or the Ava coach — a genuinely different job (Monarch's model).**
- **Price:** ~**$4.99/mo** is correct for this audience (Undebt.it anchors at ~$10/yr; debt users anchor cheap). Build the **annual seam now, launch it data-gated** (annual renews ~83% vs ~40% monthly, ~2× RPI — but premature annual masks a broken product; price the discount off *our* retention). ([RevenueCat monthly-vs-annual](https://www.revenuecat.com/blog/growth/monthly-subscriptions-when-to-offer))

### 5b. Lifetime unlock — the sub-fatigue + graduation hedge
- **Precedent:** PocketGuard ships Lifetime at **$149.99 (promo $79.99)** in the exact debt/budget context; Calm sells lifetime; one-time/lifetime is **6.4%→10.3%** and rising, and adding a one-time option alongside a sub **lifts total conversion 15–25%**. ([RevenueCat](https://www.revenuecat.com/blog/growth/lifetime-subscriptions), [Adapty](https://adapty.io/blog/9-subscription-trends-dominating-2025/))
- **What it solves for us specifically:** (1) **sub-fatigue** for the least sub-receptive audience on earth (people actively trying to spend less — the "sub for a calculator" 1-star revolt); (2) it **monetizes the graduating user** — you capture their money *before* debt→0 makes them cancel.
- **Price:** recommend **~$79–99 one-time**, anchored to PocketGuard's **$79.99**, i.e. roughly 2–2.5× a ~$40 annual. This deliberately sits *below* RevenueCat's generic "5×-annual sweet spot" because for a debt-spend-less audience the Lifetime's job is **capture-the-graduate + hedge-fatigue, not per-unit maximization.** Present it as a **second offer shown after the sub is declined** (RevenueCat's documented pattern), not as a co-equal headline that cannibalizes MRR.

### 5c. Portfolio-subscription seam — the elegant churn answer
- **The technical fact:** an auto-renewable subscription **can** span multiple apps from one developer via a shared subscription group / Apple-ID entitlement; a **non-consumable (Lifetime) cannot** span apps. ([Apple docs](https://developer.apple.com/documentation/storekit/offering-a-subscription-across-multiple-apps)) So: **the recurring sub is the portfolio's connective tissue; Lifetime stays app-scoped to Debt.** This is the correct division and matches the locked direction. Precedents for one-sub-many-apps: Apple One, Adobe CC, Microsoft 365, Setapp.
- **This is the answer to "success = churn."** A standalone debt app's success event (debt = $0) *is* the cancel event, against ~88.6% year-one monthly churn (audit §1b). The best-in-class fixes are: (a) **an inherently recurring job** (Rocket's bill-watch) — we approximate this with the **Payday Partner loop + Drift**, the only parts that recur; (b) **the "next-goal" pivot** (PocketGuard: debt → net worth) — but instead of bloating the debt app with net-worth, **the portfolio seam graduates the user INTO the ecosystem**: when Debt hits $0, the *same portfolio subscription* carries them to the next app (Freedom / net-worth / the next financial goal). **Success stops being churn and becomes graduation into the funnel.** This is the debt app's real strategic role (front-door, per the audit) expressed as a monetization mechanic.
- **Retention mechanics soften the pre-payoff curve:** streaks/milestones/momentum/community-share (Duolingo/Strava) + the celebration beat keep the user engaged *while* paying down — but they don't fix finite scope; only the recurring job + the portfolio graduation do. ([Userpilot retention](https://userpilot.com/blog/mobile-app-retention/))

---

## 6. Acquisition-readiness: how first-in-class present premium

- **Lead with the outcome, not the feature list.** "Hit your debt-free date sooner" / "Never miss a payday move" beats "unlock 6 features." Surface the **aha number** (payoff date / interest saved) at the moment of intent. ([RevenueCat paywall redesigns](https://www.revenuecat.com/blog/growth/paywall-redesigns-case-studies/), [Adapty 2026 paywall](https://adapty.io/blog/high-performing-paywall-2026/))
- **A scannable Free-vs-Premium comparison table** removes the "what do I actually get?" objection without leaving the paywall — a consistent top-app pattern.
- **Trust-forward monetization is our moat, and it belongs on the paywall.** Social proof (ratings/testimonials) + transparency (privacy assurance, "on-device," "we never sell you more debt," clear pricing, restore, Terms/Privacy). For *this* app the trust line is a conversion asset, not boilerplate — put "honest, on-device, never sells you more debt" *on the paywall itself*.
- **Reverse-trial is worth testing** (Duolingo): let the user feel the payday loop + a celebration, then drop to free — loss aversion converts. Longer trials (17–32 days) convert ~42% vs ~25% for ≤4 days (audit §5). **Note (2026):** Apple now rejects free-trial *toggle* UIs — use a compliant layout. ([RevenueCat trends](https://www.revenuecat.com/blog/growth/subscription-app-trends-benchmarks-2026/), [Adapty](https://adapty.io/blog/high-performing-paywall-2026/))
- **Compliance (3.1.2):** price-as-hero, auto-renew disclosure, Terms/Privacy, restore — copy Gig's compliant paywall (audit §7).

---

## 7. Applied recommendations — a position on every open decision

**Headline set (the recommended active Premium feature set, ranked by pay-evidence):** **Payday Partner loop (verify) → Momentum (streaks/milestones) → Drift → auto-adjusting plan → silent depth (full amortization / unlimited history / PDF-partner)**, with **custom share art riding along, never headlined.**

| # | Decision | Position (recommendation + one-line why) |
|---|---|---|
| **D1** | Free = payday-eve nudge only; Premium = full per-bill remind→pay→**verify** loop? | **YES — decisively.** The loop is the #1 pay-evidence pillar (Undebt.it+ gates reminders+autopay; Rocket gates automation); free still gets a nudge so it's not punitive. |
| **D2** | Basic milestone card Free; richer/custom + full system Premium? | **YES.** Every social app keeps *basic* sharing free (it's the acquisition loop — Strava/Duolingo) and charges for *richer/custom*. **Guard:** custom art must ride along, never be the premium headline (Finch's cosmetic-only trap). |
| **D3** | Widget: Premium or Free? | **Split — basic "debt remaining" widget FREE, enriched (momentum/Drift ahead-behind/multi-debt) widget Premium.** A home-screen glance is a **retention + ambient-acquisition** asset that fights graduation churn and keeps front-door presence; gating a passive glance converts weakly (Finch). Charge for the *active/emotional* widget richness, not the presence. |
| **D4** | Smart Insights → Premium ("next move"); Forecasting → Free? | **YES.** Clean active-vs-readout split: a single *actionable* "next move" is an act (Premium); a forecast projection is a readout (Free). |
| **D5** | Rename "Payoff" → "Progress"? | **Lean YES** (matches its new emotional/Momentum role) — but low-risk, defer to the Phase-6 polish call. |
| **D6** | Model: one Premium ~$4.99/mo + annual (data-gated) + Lifetime + portfolio-sub seam? | **ADOPT.** One tier (market norm for focused apps; audit proved no separable 2nd job yet). **Lifetime ~$79–99** anchored to PocketGuard's $79.99 (below generic 5×-annual on purpose — this audience's Lifetime job is capture-the-graduate + hedge-fatigue), shown as a **second offer** after the sub is declined. Annual seam built now, **launched data-gated**. |
| **D7** | Push a visual-identity reset now vs. incrementally? | **Do the focused design-direction pass** (out of monetization scope, but: Copilot proves *polish itself is a paid differentiator* in this category, and the emotional beats — celebration, thermometer-fill, momentum, share card — are where the RN-unlocked richness converts). Scope it as its own effort. |
| **D-M1** | Hold any 2nd-tier flip; pull net-worth forward as its job? | **Endorsed, but reframed:** under one-tier, there's no Premium+ to flip. The "next-goal/net-worth" job is **better served by the portfolio seam** (graduate into Freedom/net-worth) than by bloating Debt — the portfolio *is* the next-goal pivot. |
| **D-M2** | Pursue Lifetime? | **YES.** Category-normal (PocketGuard), fixes sub-fatigue for the least-receptive audience, and monetizes the graduating user — the churn-paradox hedge. |
| **D-M3** | Launch Premium Annual on a data-gate in the v1.7–v1.8 window? | **YES** — build the seam in the spine now; launch once real monthly-retention data exists (annual masks a broken product otherwise). |

**The one-line thesis:** Charge for the **doing** (the recurring payday loop + accountability + the loss-averse momentum layer), give away the **answers** (the whole analytical core) as a generous portfolio front-door, sell a **Lifetime** to the graduate who won't rent math forever, and let the **portfolio subscription** turn "debt = $0" from a cancellation into a graduation into the ecosystem.

---

## Sources
- YNAB: [pricing](https://www.ynab.com/pricing) · [FinCompareLab](https://www.fincomparelab.com/guides/ynab-pricing/)
- Monarch/Copilot: [x1wealth compare](https://x1wealth.com/compare/copilot-vs-monarch) · [envelopebudgeting](https://envelopebudgeting.com/articles/monarch-money-review) · [FinCompareLab Copilot](https://www.fincomparelab.com/reviews/copilot-money-review/)
- Rocket Money: [pricing](https://www.rocketmoney.com/learn/personal-finance/how-much-does-rocket-money-cost) · [FinCompareLab](https://www.fincomparelab.com/guides/rocket-money-pricing/)
- PocketGuard: [pricing](https://pocketguard.com/pricing/) · [CheckThat](https://checkthat.ai/brands/pocketguard/pricing) · [NerdWallet](https://www.nerdwallet.com/finance/learn/pocketguard-app-review)
- Undebt.it+: [features page](https://undebt.it/plus-info.php) · [Spendify](https://spendify.money/blog/best-debt-payoff-apps/) · [LendEDU](https://lendedu.com/blog/best-debt-payoff-app/)
- Duolingo: [AlphaStreet](https://news.alphastreet.com/duolingo-duol-has-a-subscription-and-ai-monetization-engine-bigger-than-a-free-language-app/) · [Relaunch teardown](https://relaunch.ai/blog/duolingo-onboarding-teardown-7-b-tests-behind-their-9-conver.html)
- Strava: [features](https://support.strava.com/hc/en-us/articles/216917657-Strava-Subscription-Features) · [Running Genie](https://therunninggenie.com/blog/strava-free-vs-premium-worth-it)
- Finch: [WhistleOut](https://www.whistleout.com/CellPhones/Apps/finch-self-care-app-review) · [Autonomous](https://www.autonomous.ai/ourblog/finch-self-care-app-review-full-breakdown)
- Fabulous: [Help Center](https://help.thefabulous.co/en/support/solutions/articles/101000406370-what-are-the-benefits-of-premium-) · [ChoosingTherapy](https://www.choosingtherapy.com/fabulous-app-review/)
- Lifetime/sub-fatigue: [RevenueCat lifetime](https://www.revenuecat.com/blog/growth/lifetime-subscriptions) · [Adapty trends](https://adapty.io/blog/9-subscription-trends-dominating-2025/) · [Influencers-Time](https://www.influencers-time.com/subscription-fatigue-rising-why-one-time-purchases-rebound/)
- Apple StoreKit cross-app: [Offering a subscription across multiple apps](https://developer.apple.com/documentation/storekit/offering-a-subscription-across-multiple-apps)
- Paywall/retention: [RevenueCat redesigns](https://www.revenuecat.com/blog/growth/paywall-redesigns-case-studies/) · [Adapty 2026 paywall](https://adapty.io/blog/high-performing-paywall-2026/) · [RevenueCat monthly-vs-annual](https://www.revenuecat.com/blog/growth/monthly-subscriptions-when-to-offer) · [Userpilot retention](https://userpilot.com/blog/mobile-app-retention/)
</content>
</invoke>
