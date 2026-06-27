# Paycheck Debt Planner — Product Roadmap

_Last updated: 2026-06-22. This document is the living source of truth for tiering and feature sequencing. Update it whenever scope changes._

## 1. Where the app stands today

A feature-complete MVP for a **single-income, iOS-only** debt payoff planner:

- Paycheck allocation engine: expenses → debt minimums → living-expense reserve → emergency fund → snowball/avalanche extra payment → optional goals → leftover, with autopay and shortfall handling
- Debt payoff projections (snowball/avalanche), interest tracking, payoff dates, strategy comparison
- 3-month cash-flow forecast with risk drivers and recovery messaging
- What-if extra-payment simulator
- Rule-based Smart Insights engine
- Goals (emergency fund / savings) with progress bars
- Required expenses (15 presets) + living expenses (7 presets)
- Timeline view of paycheck flow with running cash balance
- CSV debt import, JSON backup/export/import
- Dark mode, swipe gestures, pull-to-refresh
- Local notifications (paycheck-eve + bills-due), App Store review prompt
- 2-tier (Free/Premium) RevenueCat subscription gate
- App Lock (Face ID/Touch ID + device passcode fallback) — added to v1.2 before launch, see note in §4

**Known half-built things already in the code, worth closing before piling on new features:**
- BNPL debts store `remainingPayments`/`scheduledPaymentAmount` but the engine ignores them — BNPL is calculated exactly like a regular debt today.
- `paymentSource: "external"` / `isExternal` exist in the data model with no UI to actually log an external payment.
- Required-expense presets are all hardcoded to monthly despite the recurrence system supporting weekly/biweekly/quarterly/annual.
- Storage has no schema version or migration path (hardcoded `"debt-planner-v1"` key, parse errors silently wipe state).
- No Android target exists at all (`@capacitor/android` is installed but there's no `/android` directory).
- No analytics, no crash reporting, no accessibility audit — completely unmeasured and unaudited today.

## 2. Tier structure

| Tier | Monthly | Annual | Positioning |
|---|---|---|---|
| **Free** | $0 | — | Full manual debt/budget tracking — no caps on bills, debts, or goals. The hook is utility, not nagging. |
| **Premium** | $4.99/mo | $39.99/yr (33% off, ~$3.33/mo equivalent) | Smart guidance layer: insights, forecasting, strategy comparison, simulation. |
| **Premium+** | $9.99/mo | $79.99/yr (33% off, ~$6.67/mo equivalent) | Power-user layer: unlimited history, full amortization, multi-scenario planning, net worth, consolidation tools, reporting. |
| **Ultimate (AI)** | $14.99/mo | $119.99/yr (33% off, ~$10/mo equivalent) | AI-driven layer: Claude-powered recommendations, conversational assistant, household support, and (pending a separate infra decision) bank-linked automation. |

**Annual pricing activation timing — don't launch all three at once:**
- **Premium annual ($39.99/yr): activate at v1.7.** By then Premium's core value prop (Smart Insights, Forecasting, Strategy Comparison, Simulation, widget, Live Activities, custom icons) is feature-complete and won't shift dramatically right after — the worst time to sell an annual commitment is right before the thing someone's committing to changes shape. Locking in annual pricing on a stable, complete tier reduces refund/chargeback risk and gives a real year of value to point to.
- **Premium+ annual ($79.99/yr): activate at v1.9**, once the 3-tier infrastructure formalizes Premium+ as a real, distinct tier (not just "Premium with extra stuff loosely bolted on") and the bulk of its differentiating features (v1.5-v1.8: history, amortization, multi-scenario, probabilistic projections) already exist. v1.13's later additions (net worth, consolidation, reporting) become "more value added to an existing subscription" rather than something worth delaying annual pricing for.
- **Ultimate annual ($119.99/yr): do not activate — or even sell *any* Ultimate plan, monthly or annual — until v2.0 ships.** Per the tier-value note above, Ultimate has zero deliverable value until AI Recommendations exists. Annual pricing on an empty tier compounds that risk: a year-long commitment to nothing is a much worse trust problem than a month-long one. Activate Ultimate (monthly first, annual shortly after once a few weeks of monthly retention data exists) only once v2.0's AI Recommendations has actually shipped.

**Why 33% off (not a different discount depth):** matches the most common App Store convention for "X months free" framing (33% off ≈ 4 months free on a 12-month term) and lands each annual price on a clean, appealing number ($39.99/$79.99/$119.99) rather than an oddly-precise discount percentage. Revisit only with real conversion data once annual options are live — don't tune this number further on guesswork.

### Free
- Unlimited bills, debts, goals
- Paycheck allocation + payoff order
- Timeline, swipe-to-pay, pull-to-refresh, dark mode
- CSV import, manual JSON backup/export
- Basic debt milestone badges (25/50/75/100% paid off) — no calendar, no push
- Windfall/bonus one-time allocator (small, fits the free engine as-is)
- **App Lock (Face ID/Touch ID with device passcode fallback)** — shipping in v1.2, before the app has even launched. Security is table stakes for a finance app, not a monetization lever — every tier gets this.
- **"Try with Sample Data" demo mode** — shipping in v1.2. Lets a brand-new user (or App Review) preview the app populated with realistic debts/bills/goals before entering their own numbers, with a clear "Demo Mode" banner and one-tap exit to start fresh. Doesn't unlock Premium — real subscription state still applies, so the upgrade flow is experienced honestly, not faked.
- **Local notifications (paycheck-eve + bills-due)** — shipping free in v1.2. Reminders are a retention/engagement feature, not an analytical insight, so they stay free at every tier; customizable lead time / per-bill targeting remains a real candidate for a future premium tier once that customization actually exists.

### Premium ($4.99)
- Smart Insights (already built)
- Strategy Comparison (already built)
- What-If Simulation (already built)
- 3-Month Forecast (already built)
- Home screen widget (iOS WidgetKit — days to paycheck, debt remaining)
- **Live Activities / Dynamic Island** — "Debt-free in 14 months" or "Payday in 3 days" surfaced live on the lock screen/Dynamic Island, reusing the same App Group plumbing as the widget. Ships alongside the widget at v1.7 since both need identical native infra — building it as a separate effort later would mean redoing that plumbing twice.
- Custom app icons
- Pay cycle history, capped at 6 cycles
- Lite amortization view (current debt only, no full calendar)

### Premium+ ($9.99)
- Everything in Premium, plus:
- Unlimited pay cycle history
- Full amortization calendar (every debt, every month, principal/interest split)
- Multi-scenario planning (save/compare named what-if scenarios, not just one ephemeral run)
- **Probabilistic payoff projections** — instead of one deterministic debt-free date, run a Monte Carlo-style distribution across variable/gig income, showing a date *range* with confidence bands rather than a single point estimate. Ships alongside Multi-Scenario Planning at v1.8 since it's the same projection engine, just fed an income distribution instead of a fixed paycheck amount. The single most mathematically sophisticated thing in the app — most competitors don't attempt this.
- Net worth tracker (assets − debts over time — needs a lightweight "assets" input, new but small)
- Debt consolidation / balance-transfer calculator (compare current debts against a hypothetical consolidation loan or 0% transfer)
- **Statement auto-import (OCR + AI extraction)** — snap a photo of a credit card/loan statement; AI extracts name, balance, APR, minimum payment, and due date automatically instead of manual entry. The single biggest friction-killer in the whole app, but needs the v2.0 backend (image upload + AI parsing can't run client-side) — ships as Phase 2 of v2.0, right after AI Recommendations. Tier-flagged Premium+ to match the rest of this tier's "power tool" theme, but note the per-scan AI/OCR cost is real — revisit whether this needs its own rate limit or Ultimate-only gating once usage data exists.
- Scheduled automatic backups + PDF/CSV reporting
- Apple Watch companion (glance: next paycheck, total debt, debt-free date)
- External-payment logging UI (closes the existing data-model gap — payments made outside the paycheck flow)

### Ultimate / AI ($14.99)
- AI Recommendations (Claude API) replacing/supercharging the rule-based Smart Insights, same card UI
- Conversational AI assistant ("Can I afford an extra $50 this month?")
- **AI negotiation coach** — elevated from a one-line backlog idea ("bill-negotiation script/letter generator") into a real flagship feature: AI drafts both a phone script and a written letter, then walks the user through the actual call turn-by-turn, almost like a live coach, using the same multi-turn conversational infrastructure as the AI Chat assistant. Ships at v3.0 alongside AI Chat rather than as its own version, since it's fundamentally the same conversational surface pointed at a different task.
- Household / multi-income support (merge multiple paychecks into one plan, shared bills/debts, view-only vs. edit roles)
- Early access to new features
- **Bank linking (Plaid) — pending decision, see §5.** If pursued, this tier is where auto-import, subscription audit, and real anomaly detection would live, since they're only valuable with real transaction data.

**Tier-value note (see §2.5 below): do not market or sell this tier until v2.0 actually ships.** Every single bullet above is gated behind the v2.0 backend foundation, which is itself gated behind v1.5-v1.10 shipping first — selling a tier with zero deliverable value for a long stretch is a trust risk, not just an underwhelming launch.

## 2.5. Tier-value audit (added 2026-06-23)

**Premium ($4.99):** Justified, possibly even generous for the price — Smart Insights + Forecasting + Strategy Comparison + Simulation + widget is a meaningfully bigger jump from Free than $4.99 implies. (Notifications moved to Free in v1.2 — a retention feature, not an analytical insight — so it no longer counts toward this tier's value stack.) No changes recommended; if anything, slight underpricing here is fine since premium *conversion volume* matters more than per-user extraction at this entry tier.

**Premium+ ($9.99):** Justified, and gets meaningfully stronger with this round's additions (Statement Auto-Import, Probabilistic Projections) on top of the already-substantial existing bundle (full amortization, multi-scenario, net worth, consolidation calculator). The $5 jump over Premium now buys clearly power-user-tier depth, not just "more of the same."

**Ultimate ($14.99):** The *eventual* value is real and the negotiation-coach addition strengthens it further, but the **near-term sequencing is the actual risk**, not the feature list. Every Ultimate-tier feature depends on the v2.0 backend, which doesn't exist until v1.5-v1.10 ship first — meaning this tier could sit empty (or simply not exist as a purchasable option) for a long stretch of the v1.x cycle. **Recommendation: don't expose Ultimate as a purchasable tier in RevenueCat/App Store Connect until v2.0 has actually shipped at least the AI Recommendations feature.** Selling a tier ahead of its real value, even unintentionally, is the same category of trust problem as the App Store rejection this app already worked through once.

**Open question, not urgent:** Household/multi-income is tier-placed at Ultimate mostly because of *when* it ships (v2.1, after the backend exists), not because it's inherently AI-related — it's arguably closer to a Premium+-style power feature. Worth revisiting before v2.1 actually ships, but not a decision that needs to be made now.

## 3. Feature gap analysis (full list, by category)

This is the brainstorm with nothing filtered out. Items already slotted into the roadmap below are marked with their version; everything else is backlog.

**Debt & payoff**
- [v1.10] BNPL real calculations (use `remainingPayments`/`scheduledPaymentAmount` instead of treating as a regular debt)
- [v1.6] Amortization calendar (full schedule per debt)
- [v1.13] Debt consolidation / balance-transfer calculator
- [v1.6] Payoff milestones + celebrations
- [v1.8] Probabilistic payoff projections (Monte Carlo-style date range/confidence bands for variable income, ships alongside Multi-Scenario Planning)
- Backlog: custom user-defined payoff order (drag-to-reorder, beyond snowball/avalanche)
- Backlog: lifetime-interest-paid tracker

**Budgeting & spending**
- Backlog: bank account linking (Plaid) — auto-import transactions/balances
- Backlog: spending categorization vs. forecast
- Backlog: subscription/recurring-charge audit (needs bank data to be worth building)
- Backlog: spending alerts ("over budget in Dining")
- [v1.13] Net worth tracker

**Income & cash flow**
- [v2.1] Multiple income sources / household merge
- [v1.8] Variable/irregular (freelance/gig) income support — the actual input feeding the new Probabilistic Payoff Projections (see Debt & payoff above); was backlog, now has a concrete consumer
- [v1.5, Free] Windfall/bonus one-time allocator
- Backlog: pay-raise impact simulator

**Savings & goals**
- Backlog: additional goal types/templates (vacation, down payment, etc.)
- Backlog: round-up savings (needs bank linking)
- [v1.9] External-payment logging UI

**Insights & AI**
- [v2.0] AI Recommendations (Claude API)
- [v2.0] Statement auto-import (OCR + AI extraction) — Phase 2, right after AI Recommendations
- [v3.0] AI Chat assistant
- [v3.0] AI negotiation coach (elevated from "bill-negotiation generator" — see §2 Ultimate tier)
- Backlog: predictive cash-flow warnings tuned to real history (needs pay-cycle history data, v1.5)

**Engagement & gamification**
- [v1.6] Streaks, milestone badges
- [v1.14] Shareable milestone cards (social export)
- [v1.14] Animated "Year in Review" recap (Spotify-Wrapped-style annual/monthly summary, same data source as the shareable cards — sharing it doubles as organic marketing)
- Backlog: opt-in anonymized debt-free leaderboard
- [v1.7] Home screen widget
- [v1.7] Live Activities / Dynamic Island
- [v3.1] Apple Watch app, Siri Shortcuts

**Data, sync & security**
- Backlog: cloud sync / multi-device (needs an account system — currently zero auth)
- [v1.2] App Lock — Face ID/Touch ID with device passcode fallback (Free, all tiers — see §4 note)
- [v1.10] Schema versioning + migration path
- [v1.9] Scheduled automatic backups / [v1.13] PDF/CSV reporting

**Platform & accessibility**
- [v1.3, done] iPad layout
- [v1.12] Android build
- [v1.12] Accessibility audit (VoiceOver/TalkBack, Dynamic Type, `prefers-reduced-motion`)
- Backlog: localization / multi-currency (currently USD-only, hardcoded `$`)
- Backlog: Web/PWA desktop companion

**Monetization & growth infra**
- [v1.2] Manage Subscription + Terms of Use links — verified gap, currently zero entry points for either; closing preemptively given the App Review history
- [v1.9] 3-tier subscription infrastructure (`hasFeatureAccess()` is free/premium-only today)
- [v1.11] Product analytics (Amplitude/PostHog) + crash reporting (Sentry) — currently zero instrumentation
- Backlog: free trial flow, promo codes, Family Sharing support
- Backlog: paywall A/B testing

**Household / multi-user**
- [v2.1] Multi-income merge, shared bills/debts, permission roles

**Education / content**
- Backlog: in-app financial literacy content, APR/strategy glossary, standalone calculators hub

## 4. Sequenced version roadmap

Per the established cadence philosophy: **v1.x stays quick-turnaround** (days/weeks, no big bets). A few v1.x slots below are platform/infra investments that break that pattern by necessity (Android, analytics, accessibility) — they're flagged explicitly. **v2.0+ is where the big, longer-runway bets live.**

| Version | Focus | Tier | Size |
|---|---|---|---|
| v1.2 | Local Notifications + App Store review prompt + **App Lock** *(not yet launched — see note below)* | Notifications/Lock: Free; review prompt: all tiers | Small |
| v1.3 | iPad Support + iPad Native Polish — sidebar nav, two-column Bills, centered modals *(done)* | All | Small |
| v1.4 | Onboarding flow | All | Small |
| v1.5 | Pay Cycle History + Windfall/Bonus Allocator | Premium (6 cycles) / Premium+ (unlimited); Windfall: Free | Small |
| v1.6 | Debt Milestones + Amortization Calendar + streaks | Premium+ | Medium |
| v1.7 | Home Screen Widget + Live Activities/Dynamic Island + custom app icons | Premium | Small |
| v1.8 | Multi-Scenario Planning + Probabilistic Payoff Projections (variable income) | Premium+ | Medium |
| v1.9 | 3-Tier subscription infra + Export/Backup automation + external-payment logging UI | Infra / Premium+ | Medium |
| v1.10 | BNPL real calculations + storage schema versioning | Infra / cleanup | Medium |
| v1.11 | Analytics (Amplitude/PostHog) + crash reporting (Sentry) | Infra | Medium — **breaks small-release pattern, but needed before scaling further** |
| v1.12 | Android build + accessibility audit | Infra / Platform | Large — **breaks small-release pattern; treat as its own milestone, not a quick release** |
| v1.13 | Net worth tracker + debt consolidation/refinance calculator + PDF/CSV reporting | Premium+ | Medium |
| v1.14 | Shareable milestone cards + animated Year in Review recap + opt-in leaderboard | Free hook / Premium+ depth | Small-Medium |
| v2.0 | AI Recommendations (Claude API, replaces rule engine) + Statement Auto-Import (OCR+AI) | Ultimate / Premium+ — **do not sell Ultimate until this ships, see §2.5** | Large |
| v2.1 | Household / Multi-Income support | Ultimate | Large |
| v2.2 | Bank linking evaluation (Plaid) → auto-import, subscription audit | Ultimate | Large, **strategic fork — see §5** |
| v3.0 | AI Chat / conversational interface + AI negotiation coach | Ultimate | Large |
| v3.1 | Apple Watch app + Siri Shortcuts | Premium+/Ultimate | Medium |
| v3.x | Localization/multi-currency, Web/PWA companion | All | Backlog, unscheduled |

**Why App Lock is going into v1.2 instead of its own version:** v1.2 (notifications + review prompt) is locked but hasn't launched yet — no users depend on its current exact scope. App Lock has zero dependencies on anything else in this roadmap, is quick to build, and fits the same "trust/engagement" theme as what's already there. Free for all tiers — see §2. Implement on `v1.2-dev` and merge/rebase forward into `v1.3-dev`, which already branched off v1.2.

## 5. The one decision that reshapes everything downstream

**Is Ultimate "AI on data the user types in" or "AI on real bank data"?**

Bank linking (Plaid) is the single highest-leverage and highest-risk item in this whole roadmap. It unlocks the best version of subscription audits, anomaly detection, and auto-import — but it's a multi-month build with ongoing per-connection cost and a much bigger trust ask (handing over bank credentials vs. typing in numbers).

Recommendation carried over from earlier planning: **don't gate v2.0/v2.1/v3.0 on it.** Ship AI Recommendations, Household, and AI Chat against manually-entered + tracked history data first. Treat bank linking as a v2.2+ evaluation gate once Ultimate has proven it can sell on AI insight alone — not a prerequisite.

## 6. Key architecture notes carried forward

- Engine is single-paycheck today — Household (v2.1) needs a multi-income merge in `lib/engine/allocatePaycheck.ts`.
- `hasFeatureAccess()` is free/premium-only — needs the 3-tier rework in v1.9 before Premium+ features can be gated correctly.
- AI Recommendations (v2.0) replace/supercharge the rule-based Smart Insights engine behind the same card UI — not a new surface.
- v2.0's AI needs pay-cycle history (v1.5) to have something to reason about — don't skip v1.5.
- No account/auth system exists at all today. Cloud sync and multi-device are blocked on this — not currently scheduled, would need its own infra version if prioritized.
- `IMPLEMENTATION_PLAN.md`'s v2.0 section specifies a "Phase 0: backend foundation" (server, anonymous device ID, server-side API key handling) that doesn't appear as its own line item here — it's the technical prerequisite for v1.14's leaderboard half, v2.0's AI calls, v2.1's household sync, and v2.2's bank-token storage, all of which *are* listed above. Treat it as shared infrastructure underlying those four items, not a separate feature.
