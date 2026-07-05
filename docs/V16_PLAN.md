# Debt Planner v1.6 — Plan

_Rewritten 2026-07-05 after the portfolio audits (differentiation × 2 + greenfield + LLM-proof features). Supersedes the scattered v1.6 notes in `ROADMAP.md`, `SUSTAINABILITY_REFACTOR.md §Scheduled`, and MASTER_PLAN §9. **Not the active build yet** — this is the decomposed plan for when Debt reopens; the opening planning session (below) ratifies scope + order._

---

## The reframe — what changed

**Before the audits, v1.6 was an inward-facing "Foundation + housekeeping" version:** 3-tier subscription infra, analytics/crash reporting, schema versioning, backups, the full amortization calendar, the Sustainability Audit + a refactor slice, test-hardening, and the v1.5 deferred bug-fixes. All necessary — none of it moves the *competitive* needle.

**The audits found Debt is sitting on the sharpest, cheapest differentiation in the whole portfolio and not using it.** So v1.6's center of gravity shifts: it becomes **the version that turns Debt's un-copyable advantages into its identity + moat** — on an app that's *already live and earning* — with the Foundation/housekeeping work still done, but no longer the point.

Why Debt, why now (all four audits agree):
- Debt's **payday-allocation engine** is the portfolio's single most-ownable wedge (competitors output a debt-free *date*, never a per-payday *action*) — and it's currently **buried** as "the plan" alongside contested snowball/avalanche.
- The **cheapest, highest-ROI LLM-proof features in the entire portfolio** sit on Debt (Interest-Saved Ledger = S-cost on data already owned; Payday Autopilot = the capture keystone).
- Landing this on a live earner **banks differentiation before the market audit reads conversion data.**

---

## ⚠️ First decision (opening planning session): scope — is v1.6 too big?

v1.6 now carries **three** heavy agendas: (A) the differentiation spine, (B) the Foundation monetization/infra, (C) the Sustainability Audit + refactor. That's likely too much for one version. The opening session must decide:

- **Recommended: split.** Ship the **differentiation spine as v1.6** (cheap, high-ROI, fast, gets the moat live), and move the heavy **Foundation infra to v1.7** (3-tier subs, analytics, schema versioning, backups — real but slower, and Premium+ isn't contested right now). The Sustainability Audit runs first regardless and sequences its refactor slice across both.
- _Alternative:_ keep v1.6 whole (one big version) — but that delays the cheap differentiation behind heavy infra, which is the opposite of what the audits advise.

_(The v1.5 "keep whole" decision does NOT bind here — v1.6's split was always flagged as an in-session call. Governed by [[project_debt_app_roadmap_philosophy]] scope-discipline.)_

**This plan assumes the split** and describes the **differentiation-spine v1.6**; the Foundation infra is captured in §D as the v1.7 candidate.

---

## Opening planning session (unchanged trigger, widened remit)
The **Comprehensive Sustainability Audit** still opens v1.6 (a planning session, not a build) — but its remit widens from "sequence the refactor" to **"sequence the whole version, differentiation spine included."** It also satisfies the scheduled **per-app structural audit** (audit-cadence #4). Agenda = the split decision above, then the existing 9-point refactor agenda (`SUSTAINABILITY_REFACTOR.md §Scheduled`), then ratify the build order below.

---

## A. The differentiation spine — the new lead (build order)

> Ordered. **Capture before analytics** (the feature audit's key rule — every "tracks your progress" feature is vaporware if the user stops logging). Tiering follows [[feedback_no_paywall_basic_functionality]]: the core allocation + capture stay **free**; premium sits on depth.

1. **Reposition the hero → the payday-allocation engine.** Lead the whole product with *"what do I pay with THIS paycheck?"* (the cycle-aware allocation waterfall), demote snowball/avalanche from headline to a mechanism. Positioning/IA/onboarding/store-listing change — the engine already exists. Cheapest, highest-impact single move. **Free** (it's the basic job).
2. **Payday Autopilot — the capture keystone.** The night before payday, proactively push the fully-computed allocation; user confirms or nudges in one tap; **record the actuals.** This is the capture mechanism every analytics feature depends on, and it converts Debt from "a calculator you visit" to "a payday ritual that runs itself." _Absorbs/replaces the planned "External-payment logging UI" (ROADMAP) — that's a component of this._ **Free** (core workflow + it's what makes the data accrue).
3. **Interest-Saved Momentum Ledger.** A running *"you've saved $2,140 in interest and 14 months vs. minimums"* counter from real payment history via the tested amortization engine. Best value-to-cost in the audit (S), runs on data already owned. _Extends the planned "Lifetime total paid since you started" stat._ Free headline number; **premium** for the per-debt breakdown + history chart.
4. **Live Activity + lock-screen payoff countdown.** Self-updating debt-free countdown in the Dynamic Island / lock screen (native surface = the most durable anti-LLM moat + a daily re-engagement hook). **Free** (cheap, sticky, brand-defining) — confirm at build.
5. **Plan-vs-Actual Drift Tracker** _(v1.6 stretch or v1.7)_ — diffs each cycle's actuals against the plan the engine generated for it; "you're 11 days behind because 3 of 8 cycles underfunded the extra by ~$140." The **deepest, least-copyable moat**, but it **depends on Payday Autopilot's captured actuals**, so it can only ship once capture is real. **Premium** (depth analytics).

### Positioning fixes (fold into item 1)
- Package **on-device / no-account / no-bank-login / honest-cancel** as one **"radical trust"** brand pillar.
- **DROP** the planned *"market leader computes APR wrong"* attack — the competitor defect **did not survive verification** (credibility landmine).
- Stop calling the heuristic "Smart Insights" **AI** (invites a comparison to real AI you'd lose). Keep transparent amortization as a **quiet** trust signal.

---

## B. Retained from the original v1.6 (still done, no longer the point)
- **Sustainability refactor — a bounded slice** (never all at once): `roundMoney`×12 + `clampMoney` → shared `lib/utils/money`; `CompletedRecommendedAction` type consolidation (4 defs); `livingExpenses` preset-default dup; orchestrator Phases 3–5 (math-risk, reconciliation-test-gated); file-structure orientation. Living inventory → `SUSTAINABILITY_REFACTOR.md`.
- **Test/build-hardening bundle** — shared-seed-helper migration (`empty-state` + 3 CI-ignored screenshot specs, re-baseline) · DRY positional selectors + fix the no-op `…toBeVisible;` · Due-Date `<label>`→input a11y · multiple-lockfiles warning · expand CI gate to full `validate:release` · onboarding ipad-landscape flake · Playwright worker-teardown hang. **Reconcile `tests/visual/` with the screenshot specs** (CI-gated suite vs. manual script — don't drift into two visual systems).
- **v1.5 pre-submit bug deferrals** (`V15_FUNCTIONAL_AUDIT.md`) — **Q1** timezone/UTC off-by-one (prereq for any non-US launch) · **Q4** Timeline per-cycle payment accuracy · **Q2** Reset-to-Today due-date roll · **Q5** cascade overpaid-snowball excess (+boundary test) · **Q9** clamp per-debt progress 0–100 · minors **M2/M3/M4/M7**.
- **Layout-audit premium polish** (`V15_LAYOUT_AUDIT.md §Enhancements`) — Plan-hero progress ring · Bills category pills · Debts all-debts payoff bar · Payoff-chart axis+tooltip · amortization alignment · Pay-Cycle-History lifetime header · Bills iPad two-column.
- **Small journey enhancements** — milestone-linked progress-bar pulse · share-the-celebration · best-streak record + 5/10/25-cycle milestones · amortization milestone markers + CSV/PDF export · bills overdue urgency · batch "mark all paid" · paywall previews the gated output.

## C. Market / ASO — rebuilt around v1.6's repositioning
**Because v1.6 ships quickly after v1.5, the marketing effort focuses on v1.6, not a standalone v1.5 ASO push (Jason 2026-07-05).** The hero reposition (§A.1) *is* a positioning change, so the store presence gets **rebuilt around the new identity** rather than executing v1.5's "Track Your Journey" plan:
- **Rebuild the store listing + keyword field + screenshots around the payday-allocation wedge** ("what to pay with THIS paycheck") + **radical-trust** (on-device, no bank login, honest cancel) + the new anti-LLM features (Interest-Saved counter, payoff Live Activity). This is where the audits' **discovery = make-or-break** gets addressed head-on: the payday-allocation engine is the sharpest differentiator but the *least searchable* today — the ASO job is to make that wedge findable (and to test-and-learn which framing converts).
- **Carry the still-good v1.5 ASO mechanics forward, repurposed for the new hero:** two Custom Product Pages (paycheck-budget vs. debt-payoff searchers), an In-App Event, competitor watch on "Debt Free – Pay Off your Debt" (contesting the journey wedge). _Source mechanics in `release-notes/V15_ASO_STRATEGY.md`, but **re-authored** around v1.6 positioning — don't just ship the v1.5 copy._
- **Author `V16_ASO_STRATEGY.md` at v1.6 feature-lock** (mirroring how V15's was authored at lock), informed by the **market audit** (armed, pending v1.5 conversion data — which now doubles as the read on whether the repositioning is landing). Promotion is first-class work ([[feedback_promotion_first_class_work]]) — treat the v1.6 ASO rebuild with the same rigor as a build feature.

## D. Foundation infra — the v1.7 candidate (if split)
The heavy monetization/infra that *was* v1.6's core, now recommended to follow the differentiation spine:
- **3-tier subscription infrastructure** (`hasFeatureAccess()` is free/premium-only today) → makes **Premium+ purchasable**.
- **Full amortization calendar** (all debts, Premium+ — deferred from v1.5, gated on Premium+ being purchasable).
- **Storage schema versioning + migration path.**
- **Product analytics (PostHog) + crash reporting (Sentry)** — currently zero instrumentation. _(Note: PostHog also lets the **market audit** read real conversion data — a reason not to defer it too far.)_
- **Scheduled automatic backups.**
- **Android prep** (Play Console signup, Maestro harness, RevenueCat per-platform key, notification icon) — see `ANDROID_READINESS.md`.

---

## Anti-LLM caveats to honor (from `app-portfolio/LLM_PROOF_FEATURES.md`)
- **Capture before analytics** — Payday Autopilot (item 2) is the prerequisite for items 3 & 5, not a peer.
- **Manual-entry retention decay is the #1 risk** — which is *why* Payday Autopilot (one-tap capture) is the keystone, not optional.
- **Don't pitch "the LLM can't do the math"** — with a code interpreter it can. The moat is the **live-data binding + tested engine + native surface**, not hallucination.
- Native surfaces (item 4) are the **most durable** anti-LLM moat — a chat can never own the lock screen.

## Cross-refs
`app-portfolio/DIFFERENTIATION_STRATEGY.md` (hero reposition, radical-trust, dropped attack) · `app-portfolio/LLM_PROOF_FEATURES.md` (the feature set + ordering) · `SUSTAINABILITY_REFACTOR.md` (refactor inventory) · `V15_FUNCTIONAL_AUDIT.md` (bug deferrals) · MASTER_PLAN §9 (portfolio sequence).
