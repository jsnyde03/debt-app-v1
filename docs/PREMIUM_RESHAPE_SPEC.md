# Premium Reshape — Working Spec

> **Status: LIVE / iterating (opened 2026-07-20).** The design of Debt Planner's reshaped Premium, from "a bundle of passive readouts" → "an active payoff partner." Reshapes the paused v1.7 **C.2 revenue spine**. Strategic basis: [`app-portfolio/DEBT_STRATEGY_EXPLORATION_2026-07-20.md`](../../app-portfolio/DEBT_STRATEGY_EXPLORATION_2026-07-20.md) + [`MONETIZATION_AUDIT_2026-07-20.md`](MONETIZATION_AUDIT_2026-07-20.md).
>
> **How to use this doc:** §8 is the open-decision tracker — the flood of "so many questions," each with a recommendation + status. As Jason decides, mark DECIDED and fold the answer into §4/§6. Nothing gets built until the pieces it depends on are DECIDED.

---

## 1. Why we're reshaping (the reset)

The monetization audit + strategic exploration found Premium is **inert "smart text"** — passive analytics you read once (Jason's diagnosis, the sharpest of the exercise). Combined with: the debt category monetizes cheap; the graduation wall; and the finding that the debt app's real job is to be the **portfolio's high-trust acquisition front-door**, not a standalone revenue engine. Conclusion: **fix premium's *substance* (active, not readouts) before its price**, collapse to one tier, and make Free generous (the funnel). This is the right moment — the app is maturing and these decisions calcify soon (RN rebuild + revenue spine in flight).

## 2. The principle (two tests resolve most questions)

- **Active test** — does it *do something recurring* (remind · verify · track · celebrate · share · auto-adjust)? → **Premium.** Is it a *readout consumed once* (a chart, a comparison, a projection)? → **Free.**
- **Placement test** — where is the user when they'd use it? Money/payment → **Plan**. Progress/accountability → **Payoff (reframed as Progress)**. Management → **More**.

## 3. The identity shift

- **Free = "here's your plan and the answers."** The generous front-door: the core payday engine + the readouts + the social share loop. Maximizes the top of the *portfolio* funnel.
- **Premium = "I'll do this with you every payday."** The active partner: reminds, verifies, tracks, celebrates, automates. It *acts*, recurring, which is what justifies a subscription for a debt-stressed user.

## 4. The feature set (proposal)

### PREMIUM — the active payoff partner (four pillars)

<details open><summary><b>① Payday Partner</b> — the recurring engine (why it's a subscription)</summary>

- Full per-bill payment reminders + calendar sync
- One-tap "mark as paid" tracking + **"did you actually pay?" verification** at payday
- Carry-forward of anything missed
</details>

<details open><summary><b>② Drift Tracker</b> — accountability (already built, C.4)</summary>

- Ahead or behind your plan, recomputed every cycle. Lives on the Payoff/Progress tab.
</details>

<details open><summary><b>③ Momentum</b> — the emotional + social layer (Payoff/Progress tab)</summary>

- Streaks + the full milestone system (per-debt payoffs · 25/50/75/100%)
- Momentum chart (interest-saved / debt-falling over time)
- "Debt remaining" home-screen widget *(placement of free-vs-premium: see D3)*
- Premium/custom shareable milestone-card designs *(basic card is free — see D2)*
</details>

<details open><summary><b>④ Living Plan & Records</b> — depth</summary>

- Auto-adjusting plan (rolls freed minimums forward · nudges the extra up · live re-compute)
- Full amortization calendar (all debts)
- Smart Insights reframed as **"your next move"** (one actionable rec, not a wall of text)
- Unlimited history (bundled silently, never headlined)
- PDF payoff plan + partner/spouse/CPA sharing
</details>

### FREE — the plan and the answers (the front-door)
Payday allocation engine (what to pay this paycheck) · unlimited debts/bills/goals · snowball + avalanche + **strategy comparison** · debt-free date · trajectory chart · interest-saved headline · **what-if scenarios** · Payday Autopilot capture · a payday-eve reminder · recent history · **basic milestone celebration + a shareable card** (fuels the social acquisition loop).

**Spine of confidence:** Payday Partner + Drift are the non-negotiable recurring core; Momentum is the retention/social layer; Living Plan is depth.

## 5. Charts & visuals

The weakness isn't visuals — it's *passive* ones. **A chart you study once is passive (free/cut); a visual you watch fill, glance at, or share is active (premium).**
- Free, analytical: the trajectory chart (as-is).
- Premium, emotional/active: milestone progress (a "debt thermometer" you fill), the momentum chart, the shareable card, the widget, Drift's ahead/behind.
- **Net: fewer analytical charts, more emotional ones.** Add a visual to celebrate or share, not to explain data.

## 5b. Visual & experiential bar (RN unlocks this — Jason 2026-07-20)

The Capacitor WebView was the visual ceiling; RN removes it. **"Next level visually" and "reshape premium" are the same project from two sides — one is the feel, one is the value.** The premium emotional layer (§4 pillar ③) is *where* the unlocked richness pays off.

- **Discipline ([[feedback_less_is_more_premium]] · [[feedback_premium_quality_bar]]):** for a debt-*stressed* user, next-level ≠ motion everywhere. It's **calm, premium competence on the daily surfaces** (Things/Linear-caliber restraint on Plan/Bills) **+ a few genuinely delightful emotional beats where they earn their place.** Gaudy reads cheap.
- **The beat that deserves everything RN can do = paying off a debt** (and hitting milestones). Real celebration, counting-down numbers, the generated "debt-free scream" share card. Build these *with* the Momentum pillar, not bolted on.
- **RN now enables:** spring-physics + gesture-driven interactions (reanimated) · haptics · animated counters/number transitions · progress that fills (thermometer/rings) · blur/depth · confetti/Lottie celebrations · beautiful generated share cards.
- **Verify by looking, both themes ([[feedback_visual_verify_ui_fixes]] · [[feedback_light_mode_equal_premium]]).** Home: the premium build + the **D.6 mobile-polish audit** (reanimated work already lives there).
- **D7 (open):** how far to push a deliberate **visual-identity / design-language reset** now vs. incrementally through D.6? (A focused design-direction pass is worth it, but its own effort — not to be crammed onto other work.)

## 6. IA / placement

Premium is a cross-cutting **entitlement**, NOT a walled-off "Premium tab" and NOT scattered at random. The active features surface where they're contextually right:
- **Plan tab** = the *doing* surface → the Payday Partner loop (reminders/verify/mark-paid) lives here.
- **Payoff tab → reframed as "Progress / Momentum"** = the *how-you're-doing* home → Drift + milestones + momentum chart + interest-saved + share consolidate here (it already holds Drift + trajectory). Gives Premium a coherent emotional home without a 5th tab.
- **More** = management (data/prefs/about) — unchanged.
- Upgrade entry points appear at each premium touch (Drift teaser · a locked reminder toggle · a milestone-share prompt) → all one Premium.
- **⚠️ Open:** does "Payoff" get renamed to "Progress"? (see D5).

## 7. Re-tiering ledger

| Feature | Today | Reshaped | Note |
|---|---|---|---|
| Strategy comparison | Premium | **→ Free** | one-and-done readout; strong free hook |
| What-if scenarios | Premium | **→ Free** | engagement hook; drives the aha |
| Basic forecasting | Premium | **→ Free** | projection readout |
| Smart Insights | Premium | **Premium (reframed → "next move")** | active if actionable |
| Amortization (lite) | Premium | **Premium (→ full calendar)** | depth artifact |
| Pay-cycle history (6-cap) | Premium | **Free (recent) + Premium (unlimited, silent)** | kill the depth-gate headline |
| Drift | premium_plus (placeholder) | **Premium** | fold down from the dropped tier |
| Premium+ tier | planned | **CUT** | no separable job; cannibalizes |
| Payday Partner loop | — | **NEW Premium** | the recurring engine |
| Milestones/streaks/widget | — | **NEW Premium** (basic celebration free) | |
| Shareable cards | — | **NEW: basic Free, custom Premium** | acquisition loop |
| Auto-adjusting plan | — | **NEW Premium** | |
| PDF / partner sharing | — | **NEW Premium** | |

## 8. Open decisions tracker

| # | Decision | Recommendation | Status |
|---|---|---|---|
| **D1** | Reminders line: Free = payday-eve nudge only; Premium = full per-bill reminder→pay→verify loop? | **Yes** — the loop is the recurring engine; free still gets a nudge so it's not punitive | ⏳ OPEN |
| **D2** | Sharing: basic milestone card Free (acquisition), richer/custom + full system Premium? | **Yes** — debt is social; don't wall off free-marketing | ⏳ OPEN |
| **D3** | Widget: Premium, or Free for engagement/home-screen presence? | **Premium** (active glanceable surface + upgrade hook) — but the one most worth considering free | ⏳ OPEN |
| **D4** | Smart Insights → Premium ("next move"); Forecasting → Free? | **Yes** — split on active-vs-readout | ⏳ OPEN |
| **D5** | Rename "Payoff" tab → "Progress"? | Lean **yes** (matches its new emotional role) — but a Phase-6 polish call, low-risk to defer | ⏳ OPEN |
| **D6** | Pricing/model (from the exploration): one Premium $4.99/mo + annual (data-gated) + Lifetime (~$60–80) + portfolio-sub as connective tissue? | **Adopt** per the exploration §4 | ⏳ OPEN (exploration decisions 1–4) |
| **D7** | How far to push a deliberate visual-identity / design-language reset now (RN unlocks it) vs. incrementally via D.6? | A focused design-direction pass is worth it; scope as its own effort | ⏳ OPEN (see §5b) |

_(Add rows as questions surface — "which milestones exactly," "what's on a shared card," "does verify need reconcile UI," etc.)_

## 9. Sequencing (build order)

- **v1.7:** collapse to one Premium tier in the spine (C.2); re-tier per §7 (move strategy/what-if/forecasting free; fold Drift to Premium); build the **Payday Partner loop** (highest ROI, native/cheap, fits the RN rebuild) as the first new active pillar; build the annual seam (launch data-gated).
- **v1.7–v1.8:** Momentum (milestones/streaks/widget/share) + the Lifetime unlock; reframe Payoff→Progress.
- **v1.8+:** auto-adjusting plan; full amortization calendar; PDF/partner; the portfolio-subscription seam.
- **v2.0:** the Ava coach (grounded in real numbers) becomes the genuinely-separable higher tier.

## 10. Impact on the paused C.2 revenue spine
C.2 rebuilds to: **one Premium tier** (not a two-tier ladder), gating driven by `hasFeatureAccess` over the §4 feature set, `PREMIUM_PLUS_AVAILABLE` removed/repurposed, + a period-aware selector seam (annual) + a Lifetime (non-consumable) product + a portfolio-subscription-ready entitlement shape. Detail folds into V17_PLAN C.2 once §8 decisions land.
