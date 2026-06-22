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

**Known half-built things already in the code, worth closing before piling on new features:**
- BNPL debts store `remainingPayments`/`scheduledPaymentAmount` but the engine ignores them — BNPL is calculated exactly like a regular debt today.
- `paymentSource: "external"` / `isExternal` exist in the data model with no UI to actually log an external payment.
- Required-expense presets are all hardcoded to monthly despite the recurrence system supporting weekly/biweekly/quarterly/annual.
- Storage has no schema version or migration path (hardcoded `"debt-planner-v1"` key, parse errors silently wipe state).
- No Android target exists at all (`@capacitor/android` is installed but there's no `/android` directory).
- No analytics, no crash reporting, no accessibility audit — completely unmeasured and unaudited today.

## 2. Tier structure

| Tier | Price | Positioning |
|---|---|---|
| **Free** | $0 | Full manual debt/budget tracking — no caps on bills, debts, or goals. The hook is utility, not nagging. |
| **Premium** | $4.99/mo | Smart guidance layer: insights, forecasting, strategy comparison, simulation, notifications. |
| **Premium+** | $9.99/mo | Power-user layer: unlimited history, full amortization, multi-scenario planning, net worth, consolidation tools, reporting. |
| **Ultimate (AI)** | $14.99/mo | AI-driven layer: Claude-powered recommendations, conversational assistant, household support, and (pending a separate infra decision) bank-linked automation. |

### Free
- Unlimited bills, debts, goals
- Paycheck allocation + payoff order
- Timeline, swipe-to-pay, pull-to-refresh, dark mode
- CSV import, manual JSON backup/export
- Basic debt milestone badges (25/50/75/100% paid off) — no calendar, no push
- Windfall/bonus one-time allocator (small, fits the free engine as-is)

### Premium ($4.99)
- Smart Insights (already built)
- Strategy Comparison (already built)
- What-If Simulation (already built)
- 3-Month Forecast (already built)
- Local notifications (already built)
- Home screen widget (iOS WidgetKit — days to paycheck, debt remaining)
- Custom app icons
- Pay cycle history, capped at 6 cycles
- Lite amortization view (current debt only, no full calendar)

### Premium+ ($9.99)
- Everything in Premium, plus:
- Unlimited pay cycle history
- Full amortization calendar (every debt, every month, principal/interest split)
- Multi-scenario planning (save/compare named what-if scenarios, not just one ephemeral run)
- Net worth tracker (assets − debts over time — needs a lightweight "assets" input, new but small)
- Debt consolidation / balance-transfer calculator (compare current debts against a hypothetical consolidation loan or 0% transfer)
- Scheduled automatic backups + PDF/CSV reporting
- Apple Watch companion (glance: next paycheck, total debt, debt-free date)
- External-payment logging UI (closes the existing data-model gap — payments made outside the paycheck flow)

### Ultimate / AI ($14.99)
- AI Recommendations (Claude API) replacing/supercharging the rule-based Smart Insights, same card UI
- Conversational AI assistant ("Can I afford an extra $50 this month?")
- AI bill-negotiation script/letter generator
- Household / multi-income support (merge multiple paychecks into one plan, shared bills/debts, view-only vs. edit roles)
- Early access to new features
- **Bank linking (Plaid) — pending decision, see §5.** If pursued, this tier is where auto-import, subscription audit, and real anomaly detection would live, since they're only valuable with real transaction data.

## 3. Feature gap analysis (full list, by category)

This is the brainstorm with nothing filtered out. Items already slotted into the roadmap below are marked with their version; everything else is backlog.

**Debt & payoff**
- [v1.10] BNPL real calculations (use `remainingPayments`/`scheduledPaymentAmount` instead of treating as a regular debt)
- [v1.6] Amortization calendar (full schedule per debt)
- [v1.13] Debt consolidation / balance-transfer calculator
- [v1.6] Payoff milestones + celebrations
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
- Backlog: variable/irregular (freelance/gig) income support
- [Free, small] Windfall/bonus one-time allocator
- Backlog: pay-raise impact simulator

**Savings & goals**
- Backlog: additional goal types/templates (vacation, down payment, etc.)
- Backlog: round-up savings (needs bank linking)
- [v1.9] External-payment logging UI

**Insights & AI**
- [v2.0] AI Recommendations (Claude API)
- [v3.0] AI Chat assistant
- Backlog: AI bill-negotiation generator
- Backlog: predictive cash-flow warnings tuned to real history (needs pay-cycle history data, v1.5)

**Engagement & gamification**
- [v1.6] Streaks, milestone badges
- [v1.14] Shareable milestone cards (social export)
- Backlog: opt-in anonymized debt-free leaderboard
- [v1.7] Home screen widget
- [v1.9 / v3.x] Apple Watch app, Siri Shortcuts

**Data, sync & security**
- Backlog: cloud sync / multi-device (needs an account system — currently zero auth)
- [v1.10] Biometric app lock (Face ID/Touch ID)
- [v1.10] Schema versioning + migration path
- [v1.13] PDF/CSV reporting, scheduled automatic backups

**Platform & accessibility**
- [v1.3, in progress] iPad layout
- [v1.12] Android build
- [v1.12] Accessibility audit (VoiceOver/TalkBack)
- Backlog: localization / multi-currency (currently USD-only, hardcoded `$`)
- Backlog: Web/PWA desktop companion

**Monetization & growth infra**
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
| v1.3 | iPad Support *(in progress)* | All | Small |
| v1.4 | Onboarding flow | All | Small |
| v1.5 | Pay Cycle History | Premium (6 cycles) / Premium+ (unlimited) | Small |
| v1.6 | Debt Milestones + Amortization Calendar + streaks | Premium+ | Medium |
| v1.7 | Home Screen Widget + custom app icons | Premium | Small |
| v1.8 | Multi-Scenario Planning | Premium+ | Medium |
| v1.9 | 3-Tier subscription infra + Export/Backup automation + external-payment logging UI | Infra / Premium+ | Medium |
| v1.10 | BNPL real calculations + biometric app lock + storage schema versioning | Infra / cleanup | Medium |
| v1.11 | Analytics (Amplitude/PostHog) + crash reporting (Sentry) | Infra | Medium — **breaks small-release pattern, but needed before scaling further** |
| v1.12 | Android build + accessibility audit | Infra / Platform | Large — **breaks small-release pattern; treat as its own milestone, not a quick release** |
| v1.13 | Net worth tracker + debt consolidation/refinance calculator | Premium+ | Medium |
| v1.14 | Shareable milestone cards + opt-in leaderboard | Free hook / Premium+ depth | Small-Medium |
| v2.0 | AI Recommendations (Claude API, replaces rule engine) | Ultimate | Large |
| v2.1 | Household / Multi-Income support | Ultimate | Large |
| v2.2 | Bank linking evaluation (Plaid) → auto-import, subscription audit | Ultimate | Large, **strategic fork — see §5** |
| v3.0 | AI Chat / conversational interface | Ultimate | Large |
| v3.1 | Apple Watch app + Siri Shortcuts | Premium+/Ultimate | Medium |
| v3.x | Localization/multi-currency, Web/PWA companion | All | Backlog, unscheduled |

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
