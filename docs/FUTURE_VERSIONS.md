# Future Versions — Implementation Detail

_Long-horizon plan for v1.7 through v3.1. Part of the [Implementation Plan](IMPLEMENTATION_PLAN.md)._

_v1.4–v1.6 detail lives in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). UX polish items live in [UX_POLISH_BACKLOG.md](UX_POLISH_BACKLOG.md). Mobile polish lives in [MOBILE_POLISH_IMPLEMENTATION_PLAN.md](MOBILE_POLISH_IMPLEMENTATION_PLAN.md). Page orchestrator refactor lives in [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md)._

---

## v1.7 — Home Screen Widget + Live Activities/Dynamic Island + Custom App Icons

**Scope:** Native iOS features outside the Capacitor/JS layer entirely.

**Implementation steps:**

1. **Widget** — requires a new Widget Extension target in the Xcode project (SwiftUI `WidgetKit`):
   - An **App Group** (e.g., `group.com.jasonsnyder.debtplanner`) shared between the main app and the widget extension.
   - The main app writes a small summary blob (days to next paycheck, total debt remaining, debt-free date) to the shared App Group container — via a tiny Capacitor plugin call or `UserDefaults(suiteName:)` write triggered from JS on each relevant state change.
   - Widget reads that shared blob on its own WidgetKit refresh timeline.

2. **Live Activities / Dynamic Island** — built on the same App Group + summary-blob infrastructure as the widget:
   - `ActivityKit` (iOS 16.1+) integration in the widget extension target — a Live Activity is a special kind of widget, not a separate Xcode target.
   - Start/update/end the activity from the main app via the same small native plugin used for the App Group write.
   - Dynamic Island support comes largely for free once the Live Activity exists — iOS renders it in the Island automatically; the main design work is the compact/minimal/expanded view layouts.
   - Content: "Debt-free in 14 months" or "Payday in 3 days" — reuse the summary data already being computed for the widget.

3. **Custom icons** — iOS supports alternate app icons natively (`UIApplication.shared.setAlternateIconName`), but Capacitor has no built-in bridge. Either write a tiny custom Capacitor plugin or use a community plugin — evaluate at implementation time.

4. All three features are **Premium-gated in the JS layer** (show/hide entry points based on `hasFeatureAccess`). The underlying OS capability isn't truly lockable from JS — acceptable; matches how the rest of the app's premium gating works.

**Recommended ship order (increasing native complexity):** custom icons → widget → Live Activities.

**Files touched:** new Xcode target + Swift files (outside `lib/`/`components/`), a new small native plugin if going that route.

**Testing:** Manual on-device only — widgets, Live Activities, and alternate icons cannot be tested in CI/Playwright. Live Activities need a physical device with Dynamic Island hardware (iPhone 14 Pro+) to verify compact/expanded Island states.

**Risk:** Medium-high — this is the first version requiring native Swift work beyond Capacitor's JS bridge. Timebox exploration before committing; if App Group + widget plumbing proves heavier than expected, ship icons first, then widget, then Live Activities last rather than letting any one feature block the others.

**Business note:** Activation point for **Premium's annual pricing** ($39.99/yr) — a RevenueCat/App Store Connect task, not code, but sequence it alongside this version's launch since this is when Premium's feature set is stable enough to sell a year-long commitment.

**Also shipping in v1.7:**
- Page Orchestrator Phase 3 (Backup/Snapshot Hook) — see [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md)

---

## v1.8 — Multi-Scenario Planning + Probabilistic Payoff Projections

**Scope:** Two "run the existing engine multiple times and compare results" features shipped together — they share the same underlying math pattern and UI approach.

### Multi-Scenario Planning (Premium+)

**Current state:** `SnowballSection.tsx` already has a what-if simulator (`simulationExtraPayment`, `simulationStrategy` state, `projectDebtPayoff` calls) — but it's a single, unsaved, in-memory scenario that resets on navigation.

1. New type: `Scenario = { id: string; name: string; extraPayment: number; strategy: "snowball" | "avalanche" | "recommended"; createdAt: string }`.
2. New `lib/hooks/useScenarios.ts` — CRUD over a `debtPlanner.scenarios` array, capped at 3 for Premium+.
3. New `components/Scenarios/ScenarioComparisonView.tsx` — runs `projectDebtPayoff` once per saved scenario against the same current debt state, renders a side-by-side comparison grid (reuse the visual pattern already in `SnowballSection`'s strategy-comparison card).
4. The existing single-scenario simulator in `SnowballSection` becomes the "create a new scenario" entry point — "Save This Scenario" persists the current simulation inputs as a named `Scenario`.

**Data model changes:** new `Scenario` type, new `debtPlanner.scenarios` storage key.

**Risk:** Low-medium. Mostly UI/state-management work layered on an already-correct calculation engine.

### Probabilistic Payoff Projections (Premium+)

Instead of one deterministic debt-free date, run the existing projection engine across a distribution of possible paycheck amounts and show a date range with confidence bands — for users with variable/gig income.

1. New income-variance input: let the user enter a range (min/typical/max). Keep this opt-in — fixed-income users see zero change.
2. New `lib/forecast/projectPayoffDistribution.ts` — runs `projectDebtPayoff` N times (200–500 simulated paycheck sequences sampled from the entered variance) and aggregates payoff dates into percentile bands (e.g. "50% chance debt-free by X, 90% chance by Y"). This is a sampling/aggregation layer on the existing engine, not new financial math.
   - **Mandatory reconciliation:** verify the distribution's median outcome matches the deterministic `projectDebtPayoff` result for the average income value — silent disagreement between these two would be trust-breaking in a finance app.
3. New `components/Payoff/ProjectionDistributionChart.tsx` — visualizes the range as a simple band chart (earliest/median/latest debt-free date). Reuse `SnowballSection`'s existing chart patterns.
4. Surface as a toggle within the existing Multi-Scenario comparison UI ("Fixed income" vs. "Variable income" mode) — not a separate screen.

**Data model changes:** new optional income-variance fields on paycheck settings (additive; fixed-income users unaffected).

**Risk:** Medium. Sampling/aggregation logic is new even though it's built on the existing engine. Presenting probability ranges without alarming users takes real UX care — "you might not be debt-free until 2 years later than expected" framing needs thoughtful handling.

**Also shipping in v1.8:**
- Page Orchestrator Phase 4 (Plan-Execution Hook) — see [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md)

---

## v1.9 — 3-Tier Subscription Infrastructure + Export/Backup Automation + External Payment Logging

**Scope:** Formalize the tier model that v1.5–v1.8 use loosely. Should conceptually start at v1.5 — every version from v1.5 onward should use `hasFeatureAccess` correctly to avoid retrofitting all call sites at v1.9.

**Current state (verified):** `lib/subscription/plans.ts` → `SubscriptionPlan = "free" | "premium"`. `lib/subscription/hasFeatureAccess.ts` → binary, `plan === "premium"` grants everything. RevenueCat integration (`lib/subscription/revenueCat.ts`) reads a single `"premium"` entitlement ID.

**Implementation steps:**

1. Expand `SubscriptionPlan` to `"free" | "premium" | "premium_plus" | "ultimate"`.
2. Expand `lib/subscription/features.ts`'s `PremiumFeature` union to include all Premium+/Ultimate features built in v1.5–v1.8, plus a `minimumTier` mapping per feature.
3. Rewrite `hasFeatureAccess(plan, feature)` as a tier-ordinal comparison (`free=0, premium=1, premium_plus=2, ultimate=3`) against each feature's `minimumTier`.
4. RevenueCat: configure 3 additional entitlement IDs (or one entitlement with tiered product IDs — decide based on what RevenueCat's dashboard supports cleanly) and update `getSubscriptionPlan()`/`purchasePremium()` to map products → the new 4-value type.
5. **Audit every existing `hasFeatureAccess` call site** — this is the actual risk of this version. Any call site using exact equality (`plan === "premium"`) instead of `hasFeatureAccess` also needs auditing.
6. Export/backup automation: extend `lib/storage/backup.ts` with a scheduled trigger on app foreground ("if last backup > 7 days ago, prompt to export"). Note: true automatic backup on iOS means writing to the Files app via the share sheet or iCloud Drive — verify iCloud Drive write access is feasible from the WKWebView/Capacitor sandbox before committing to this UX. If not feasible, scope down to "more prominent backup reminders."
7. External payment logging UI: add "Log Payment Made Outside the App" action in `DebtRow`/`ExpenseListItem` swipe actions, calling `onMarkRecommendedAction(..., paymentSource: "external")` — the handler already supports this parameter; this is purely a missing UI entry point.

**Data model changes:** `SubscriptionPlan` type widened (breaking at call sites using exact equality checks).

**Testing:** Highest-test-value version in the v1.x sequence — write a regression test matrix: every `PremiumFeature` × every tier → expected boolean. Re-run the full e2e suite with each of the 4 tiers mocked via `debtPlanner.mockSubscription`.

**Risk:** Medium-high. Not technically hard, but the call-site audit (step 5) is where "wrong tier got access" bugs hide if rushed.

**Business note:** Activation point for **Premium+'s annual pricing** ($79.99/yr) — once the 3-tier model is formalized and Premium+ is a real, distinct tier.

---

## v1.10 — BNPL Real Calculations + Schema Versioning

**Scope:** Two independent cleanup items bundled for efficiency.

### BNPL real calculations

**Current state (verified):** `Debt.remainingPayments`/`Debt.scheduledPaymentAmount` are populated by `lib/imports/debtCsv.ts` for `type === "bnpl"`, but `lib/engine/allocatePaycheck.ts` and `lib/debt/projectDebtPayoff.ts` treat every debt identically — BNPL is typically fixed, interest-free, fixed-count payments, fundamentally different math from a revolving credit card.

1. In `lib/debt/projectDebtPayoff.ts`, branch on `debt.type === "bnpl"`: decrement `remainingPayments` by 1 and reduce `balance` by `scheduledPaymentAmount` each cycle, with zero interest accrual. Payoff date = `currentDate + remainingPayments * cycle length`.
2. Same branch in `lib/engine/allocatePaycheck.ts`'s minimum-payment logic — a BNPL "minimum" IS the `scheduledPaymentAmount`.
3. **Exclude BNPL debts from snowball/avalanche extra-payment targeting** — most BNPL providers don't allow early payoff to reduce remaining installments; treating them as fixed-schedule is more realistic and less work.

### Schema versioning

1. Add a `version: number` field written alongside existing `debtPlanner.*` keys (or a single `debtPlanner.schemaVersion` key).
2. New `lib/storage/migrateState.ts` — a migration runner checking stored version against the current code's expected version, applying migration functions in sequence. **No migrations needed yet** — this step is purely about having the mechanism in place before the first schema-breaking change (likely v2.1's household model).
3. Change `loadStoredState`'s silent-fallback-on-parse-error to at least log/flag a corrupted-state event (ties into v1.11's analytics; if v1.11 ships first, instrument there; if this ships first, add a placeholder hook).

**Risk:** Low-medium per item. Keep the two items strictly independent in implementation so one slipping doesn't block the other.

**Also shipping in v1.10:**
- Page Orchestrator Phase 5 (Rollover Engine — final phase) — see [PAGE_ORCHESTRATOR_PLAN.md](PAGE_ORCHESTRATOR_PLAN.md). **Highest-risk phase of the orchestrator refactor; mandatory reconciliation test before shipping.**

---

## v1.11 — Analytics + Crash Reporting

**Scope:** Zero instrumentation exists today. This version doesn't ship user-facing features — it makes every future version measurable.

**Recommendation:** **PostHog** for product analytics (generous free tier, strong privacy controls, self-host option — matters for a personal-finance app) and **Sentry** for crash reporting (industry standard, good Capacitor support).

**Implementation steps:**

1. New `lib/analytics/track.ts` — thin wrapper (`track(event, properties)`) so the codebase never imports PostHog directly; makes swapping providers later a one-file change.
2. Instrument key funnels: onboarding step completion, paywall view → purchase conversion, feature-gate hit (free user taps a locked feature), rollover completion, backup export/import.
3. Sentry: initialize in `app/layout.tsx` for web-rendered errors, plus native-side initialization in the Xcode project for crashes outside the WebView.
4. **Hard privacy rule:** Never send debt amounts, balances, names, or any financial figures as event properties — track *that* an action happened, never *what the numbers were*. Write this constraint in `lib/analytics/track.ts` as a comment so future work doesn't accidentally leak financial data.

**Risk:** Low technically. The privacy constraint is the one thing that must not be gotten wrong — leaking even aggregate balance data to a third-party analytics vendor is a real trust/legal exposure.

---

## v1.12 — Android Build + Accessibility Audit

**Scope:** Two unrelated large efforts bundled as "platform parity" work.

### Android

**Current state (verified):** `@capacitor/android` is an installed dependency but no `/android` directory exists — Android has never been built.

1. `npx cap add android` to generate the project.
2. Android-specific plugin config: the existing `capacitor.config.ts` already has Android-flavored `LocalNotifications` icon config — verify it resolves correctly once the Android project exists.
3. RevenueCat: configure Google Play product IDs (separate from App Store product IDs) — RevenueCat dashboard + Google Play Console task.
4. In-app review: `@capacitor-community/in-app-review` supports both platforms — verify `lib/review/requestAppReview.ts` works unmodified on Android. Google Play's review API has stricter quota/eligibility rules than Apple's — test on a real device.
5. Test back-button behavior (Android hardware/gesture back, no iOS equivalent) — verify it doesn't unexpectedly exit the app from a modal.

### Accessibility audit

1. Systematic pass over every interactive element for `aria-label`/accessible names — icon-only buttons across `DebtRow`, `ExpenseListItem`, swipe actions are the most likely gaps.
2. VoiceOver (iOS) and TalkBack (Android) manual pass through every tab and modal.
3. Color contrast check for both themes — status pills (`overdue`, `warning`, etc.) use color as the primary signal; verify they also convey status via text/icon, not color alone.
4. **Dynamic Type support (verified gap):** `app/page.css` has 826 `px`-based size declarations vs. 250 `rem`-based. iOS's text-size accessibility setting likely doesn't scale most of the UI. Audit and convert `font-size` (and ideally spacing) declarations to `rem`; test at the largest Dynamic Type sizes.
5. **`prefers-reduced-motion` audit:** Confirm every animation added across the whole app — not just those explicitly flagged in v1.3/v1.6 — has a `prefers-reduced-motion` fallback, including swipe-action and pull-to-refresh gesture animations that predate this rule.

**Risk:** High relative to estimate — first-time Android builds reliably surface platform-specific surprises. Treat the ROADMAP.md size estimate ("Large") as a floor.

---

## v1.13 — Net Worth Tracker + Debt Consolidation/Refinance Calculator + PDF/CSV Reporting

_Note: scheduled automatic backup automation shipped in v1.9 (step 6). Only PDF/CSV reporting remains here._

### Net Worth Tracker (Premium+)

1. New minimal `Asset = { id: string; name: string; value: number }` type — deliberately simple, no asset categories/appreciation modeling.
2. New `lib/hooks/useAssets.ts`, new `debtPlanner.assets` storage key.
3. Net worth = `sum(assets) - sum(debt.balance)`, computed fresh each render.
4. History chart reuses v1.5's `cycleHistory` — extend `PayCycleSnapshot` with a `netWorth` field going forward. Existing snapshots won't have it; render with a gap rather than backfilling.

### Consolidation/Refinance Calculator (Premium+)

1. New `lib/debt/calculateConsolidation.ts` — given the current debt list and a hypothetical `{ apr, termMonths }` consolidation loan, compute the new loan's total interest/monthly payment via the same amortization math already in `lib/debt/applyDebtPaymentProjection.ts` (reuse, don't reinvent), and compare against the current debts' projected `totalInterestPaid` from `projectDebtPayoff`.
2. New `components/ConsolidationCalculator.tsx` — input the hypothetical loan terms, side-by-side comparison (same visual pattern as Strategy Comparison in `SnowballSection`).
3. **Does not initiate any real loan** — a what-if calculator only. Keep copy clear that this is illustrative, not an offer, to avoid any implication of operating as a loan originator/broker.

### PDF/CSV Reporting (Premium+)

1. New `lib/storage/exportReport.ts` — builds a structured report (current debts, payoff projections, pay cycle history, net worth) into CSV first (simplest, no new dependency — same shape as the existing JSON backup, just flattened).
2. PDF: evaluate a lightweight client-side PDF library at implementation time. Prefer a "print to PDF" via the system share sheet/native print API if it gets the same result with zero new dependencies.
3. Entry point: "Export Report" action in Plan Settings, alongside the existing Export/Import Backup actions.
4. This is a different artifact from the JSON backup (`lib/storage/backup.ts`) — JSON backup restores app state; this report is for reading/sharing outside the app. Keep code paths separate.

**Risk:** Low-medium for net worth. Low for the calculator, but **the regulatory copy point is a hard requirement** — a finance app suggesting specific loan terms without the right disclaimers is a real compliance risk. Reporting: low risk, read-only, no data model changes.

---

## v1.14 — Shareable Milestone Cards + Animated Year in Review + Opt-In Leaderboard (deferred)

_The leaderboard half of this version does not ship at v1.14 — it requires a backend that doesn't exist until v2.0._

### Shareable Milestone Cards (ships at v1.14)

1. Add `@capacitor/share` (not currently installed) for the native share sheet.
2. New `components/ShareableMilestoneCard.tsx` — renders a styled summary (debt-free date, % paid off, current streak) to an offscreen DOM node, captured to an image via a DOM-to-image library (evaluate options — keep dependency footprint small) or a dedicated share-preview screen screenshot.
3. Trigger from the existing milestone-badge moment (v1.6) — "Share this milestone" action.

### Animated "Year in Review" Recap (ships at v1.14)

1. New `components/YearInReview/YearInReviewFlow.tsx` — full-screen, multi-slide animated recap (Spotify Wrapped-style: total paid off, debt-free progress, best month, streak, milestones hit). Built from `cycleHistory` data already collected by v1.5 — no new data collection.
2. Free tier: a single teaser slide (e.g., total paid off this year). Premium+: full multi-slide animated recap.
3. Reuse the shareable-card infrastructure — each slide is independently shareable. This doubles as organic marketing, which is the strategic point.
4. Trigger once per year (or per N completed pay cycles for users without a full year of history yet).
5. **`prefers-reduced-motion` is mandatory here** — this is the most animation-heavy feature in the whole app.

**Data model changes:** None — pure presentation over v1.5's existing `cycleHistory`.

**Testing:** Manual visual check across a range of history lengths (1 cycle, a few months, a full year+) to confirm graceful degradation with partial data.

### Leaderboard (deferred until v2.0 backend exists)

Needs: an account/anonymous-ID system, a server endpoint, and real thought about what's worth comparing without being discouraging or privacy-invasive. Revisit scope entirely once the v2.0 backend exists — don't pre-build against assumptions made today.

---

## v2.0 — AI Recommendations (Claude API) + Statement Auto-Import

**Scope:** The biggest architectural shift in the roadmap — first version requiring a server.

### Phase 0: Backend Foundation (do this first)

1. Stand up a minimal backend. **The current app is statically exported** (`capacitor.config.ts: webDir: 'out'`), meaning API routes need a server runtime that static export doesn't provide.
   - **Recommended approach:** a separate thin backend service (lightweight Node/Express or serverless functions) rather than restructuring the Next.js app's build/deploy story. Lower risk, smaller blast radius on a working app.
2. Anonymous device-bound ID for rate-limiting/abuse prevention (no full accounts yet — that's v2.1). Store locally, send with requests.
3. Anthropic API key **server-side only** — never shipped in the client bundle.

This backend also unblocks v1.14's leaderboard, v2.1's household sharing, and v2.2's Plaid integration.

### Phase 1: AI Insights (Ultimate tier)

1. New `lib/ai/buildAIInsights.ts` (client-side) — assembles a structured snapshot of the user's plan (same shape fed into the existing rule-based `buildSmartInsights`) and sends it to the backend endpoint.
2. New backend endpoint — receives the snapshot, builds a prompt instructing Claude to return insights in the **exact same shape** as the existing `SmartInsight` type (`title`, `message`, `severity`, `action`), so zero rendering code changes.
3. **Fallback:** if the AI call fails/times out, fall back silently to the existing rule-based `buildSmartInsights` — never show an error state for this. The rule-based engine is a perfectly good degraded experience.
4. **Data sent to backend:** explicitly enumerate in code review — paycheck amount, debt balances/APRs/names, bill amounts/names, goal progress. This is real financial data leaving the device for the first time; needs a clear privacy policy update and explicit user consent surfaced before first use.

**Testing:** Mock the backend response shape in regression tests to verify the rendering layer handles both AI-sourced and rule-based `SmartInsight[]` identically. Chaos test: backend returns malformed/empty response → fallback triggers correctly.

### Phase 2: Statement Auto-Import (Premium+)

Let a user photograph or upload a credit card/loan statement and have AI extract the debt's name, balance, APR, minimum payment, and due date automatically.

1. Capacitor Camera plugin (`@capacitor/camera`, not currently installed) for photo capture, or a standard file input for uploading an image/PDF.
2. New backend endpoint — receives the image, sends it to Claude with a prompt requesting structured extraction in the exact shape of the `Debt` type's input fields. Reuses Phase 0's backend service.
3. New `components/ImportFromStatement/StatementScanFlow.tsx` — capture/upload → loading state → pre-filled review form. **Always show extracted values for user confirmation/correction before saving — never auto-save unreviewed AI output.** A misread APR or balance is a real-money mistake.
4. On confirm, route through the existing `handleAddDebt` validation path unchanged — extracted data is just pre-filled form input.
5. **Do not log or retain the raw image server-side beyond the request lifecycle** — the statement image may contain account numbers, full name, address. Process and discard.

**Cost/tier note:** Each scan is a real Claude API cost. Tier-gated Premium+ initially. Watch usage after launch — if cost-per-scan is meaningfully higher than the rest of Premium+ justifies, add a rate limit or move to Ultimate-only. Don't pre-build a quota system speculatively.

**Risk:** High. First server, first time financial data leaves the device, first AI dependency with real latency/cost/failure modes. Most carefully-tested version on the whole roadmap. The mandatory review-before-save step in Phase 2 is a hard requirement — do not weaken it.

**Business note:** This is the activation point for **Ultimate** as a sellable tier ($14.99/mo). Introduce **Ultimate annual** ($119.99/yr) a few weeks after monthly launch, once some retention data exists. Do not expose Ultimate as purchasable until Phase 1 (AI Recommendations) has actually shipped.

---

## v2.1 — Household / Multi-Income Support

**Scope:** Upgrade v2.0's anonymous device ID to real accounts so two people's devices can reference the same household.

**Implementation steps:**

1. Real authentication — **recommend Sign in with Apple** given the app is iOS-first; requires zero password infrastructure.
2. New household data model on the backend: a household has members, each member can have their own paycheck schedule; bills/debts/goals belong to the household, optionally attributed to a member.
3. **Engine change (the hard part):** `lib/engine/allocatePaycheck.ts` currently takes one `paycheckAmount` + one `nextPaycheckDate`. Multi-income requires either:
   - **(Recommended)** Pre-merge multiple paychecks into one combined cash-flow timeline before calling the existing engine once — keeps the blast radius on well-tested engine code minimal.
   - Deeper rework of the engine to natively understand multiple income events — higher risk.
4. Permission roles (view-only vs. edit) enforced server-side, not just hidden in the UI.
5. **Architecture inversion:** household data now lives on the backend as source of truth; local storage becomes a cache/offline-fallback layer. This touches almost everything — budget real time, don't treat it as "just add a sync call."

**Risk:** High. Both product-complexity risk (shared finances is sensitive) and technical risk (local-storage-as-truth → backend-as-truth inversion).

---

## v2.2 — Bank Linking (Plaid) — Evaluation Gate, Not a Commitment

This is a **decision point**, not a guaranteed build. If pursued:

1. Plaid Link SDK — Capacitor has no official Plaid plugin; recommend a WebView-based Plaid Link flow (Plaid supports a hosted flow that works in a webview) rather than a custom native plugin.
2. Plaid access tokens exchanged and stored **on the backend only** (built in v2.0/v2.1) — never on the client.
3. A transaction sync job (backend, scheduled) pulls new transactions periodically.
4. Transaction-audit and spending-categorization features (currently backlog) only become worth building once real transaction data exists — they were deliberately deferred.

**Recommend:** treat v2.2 as a standalone "spike" — timeboxed technical evaluation (Plaid sandbox integration, cost modeling at expected user volume, compliance review) before committing a full version's worth of roadmap time.

---

## v3.0 — AI Chat / Conversational Interface + AI Negotiation Coach

Builds directly on v2.0's backend + Claude integration.

### AI Chat

1. New backend endpoint supporting multi-turn conversation — message history maintained server-side per session, not trusted to the client.
2. Tool use: give Claude function-calling access to query the user's actual current plan data server-side (debt list, next paycheck, goals), not relying on the user to describe their situation in chat.
3. New `components/AIChat/` — chat UI, likely a new tab or modal accessible from the Payoff tab.
4. **Fallback:** if AI is unavailable, say so clearly — a chat interface with no AI behind it has no meaningful non-AI fallback, so honest unavailability messaging is required (unlike v2.0's insights, which degrade gracefully to the rule engine).

### AI Negotiation Coach

Reuses the exact same multi-turn conversation infrastructure as AI Chat — this is a second **use case** for that surface, not a second conversational AI system.

Two output modes:
1. **Generated artifact** — a written negotiation letter and phone-call script, grounded in the user's actual debt data (APR, balance, payment history) via the same tool-use access as AI Chat.
2. **Interactive coaching mode** — the user reports how the call is going turn-by-turn ("they offered 18%, what do I say?") and the AI responds with the next thing to say.

Entry point: "Negotiate this rate" from each debt's detail/edit view — surfaces letter/script generation immediately; live-coaching mode as a secondary action.

**Risk:** Medium-high, but lower than v2.0 since the hard architectural problems were solved there. The negotiation coach's main risk is content quality — a bad negotiation script damages user trust in a way a mediocre insight card doesn't. Budget real review time for prompt quality, not just functional testing.

---

## v3.1 — Apple Watch + Siri Shortcuts

1. New Watch App target in Xcode, sharing the same App Group set up in v1.7 for the widget — reuse that plumbing.
2. SiriKit/App Intents for shortcuts like "what's my debt-free date" — read-only queries against the shared App Group data, no new backend dependency.

**Risk:** Medium. Native-only work, but builds on v1.7's already-solved data-sharing pattern.
