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

## ✅ Opening Audit — Results & Adjusted Plan (2026-07-05)

_The Comprehensive Sustainability Audit + per-app structural (keep-vs-pivot) audit ran as a 9-agent workflow (7 dimension inventories → synthesis → adversarial critique) against the real code. Full raw output archived; verdicts below. **The critique flagged 2 real defects in the synthesis's own plan — this section presents the ADJUSTED plan that fixes them.**_

### Verdict 1 — SPLIT = YES (spine → v1.6, Foundation infra → v1.7)
Confirmed by the inventories: Debt is the portfolio's most volatile app; the spine's shared **capture state** (actuals + payment history feeding Interest-Saved Ledger, Payday Autopilot, Drift Tracker) already pressures the **1245-line `page.tsx`** — piling Foundation infra (RevenueCat purchase-wiring, PostHog activation, schema-versioning, backups, full amort calendar) on top would blow the bounded-slice discipline. Capture-before-analytics is structural (analytics has no value until capture generates events; the `track()` no-op seam + `premium_plus` gating are already staged for a clean v1.7 lift). → **v1.6 = differentiation spine + a *tightly* bounded refactor slice; v1.7 = Foundation infra + the math-risk orchestrator phases.**

### Verdict 2 — KEEP across the board, zero pivots (the structural / keep-vs-pivot audit)
Every finding is hygiene/debt, not an approach problem. **KEEP + PROTECT:** the pure-TS engine (92 `.ts` files, zero react/capacitor/next imports — the single best decision in the app, what makes v1.6 features cheap; **any engine-adjacent change carries math-risk → reconciliation test in the SAME commit**) · Next 16 static-export + Capacitor 8 (iOS now, Android nearly free) · **bottom-tab + iPad-sidebar nav** (resolves the standing "nav vs command-bar" flag as KEEP — the hero reposition is IA/content on the existing Plan tab, not a nav restructure) · TypeScript structural types · the shared money utils · the two-layer test infra (Playwright e2e + tsx reconciliation) · class-scoped `.dark-theme` CSS (deliberate fix for the light-in-dark portal bug — do NOT migrate to CSS-modules). **The ONE pattern to *evolve* (not pivot):** the `page.tsx` orchestrator God-component — continue Phases 3-5 as bounded per-version slices, and **introduce ONE narrow purpose-built hook/context for the captured-actuals+history state at v1.6 *design* time** (it's cross-tab by construction — decide proactively, don't wait-and-see) — explicitly **NOT** a global store (Redux/Zustand). New cross-cutting capture state goes in the hook, **not** into `page.tsx`.

### ⚠️ Verdict 3 — the critique's two fixes (why the raw synthesis was ADJUSTED)
1. **Sequencing inversion — the #1 fix.** Payday Autopilot (the capture keystone) routes through `handleMarkRecommendedAction` (`app/page.tsx:465`) — verified as the **only** write path into `completedRecommendedActions`, and it mutates `goal.currentAmount` with clamp/floor math. It's the **one untested money-adjacent path in the orchestrator**, and the synthesis deferred its test to v1.7 while building the feature that exercises it in v1.6. **→ Pull the `handleMarkRecommendedAction` mark→unmark reconciliation test INTO v1.6 as a hard gate BEFORE Payday Autopilot** (the extraction can stay v1.7; the TEST cannot). **It MUST include a `targetAmount`-edited-while-marked case** — a *latent bug the audit found*: mark stores the clamped `safeActualAmount` but unmark subtracts the stored `actualAmount`, so if a goal's target is edited while an action is marked, unmark under/over-restores `currentAmount`.
2. **The "bounded slice" wasn't bounded.** The synthesis's slice was ~5 refactor workstreams stacked under 5 features ("cheap per item" ≠ "bounded scope" — the classic tell). **→ Cut the v1.6 refactor slice to the THREE items with a genuine spine dependency**, push the rest to v1.7. Plus: **every spine feature that computes money ships its OWN reconciliation test** (Drift Tracker computes new drift math — gate it too), and **the Windows Playwright worker-teardown hang** (poisons local exit codes → red can read green) must be pulled forward **or** local slice-verification must not trust the exit code.

### The ADJUSTED v1.6 build order (authoritative — supersedes §A's raw ordering)
> Refactor prerequisites first, then spine (capture-before-analytics). Only the **3 spine-dependent** refactors are in v1.6; the rest → v1.7 (§D + SUSTAINABILITY_REFACTOR).

1. **[refactor] Keep-green CI gate** — add `lint` + `test:regression` (the tsx reconciliation suite — the math backstop) to `web-e2e.yml` before playwright; today CI runs *only* playwright, so the math suite is ungated. Fix the silent false-green no-op `.toBeVisible;` at `planner-data-entry.spec.ts:35`; rename `planner-herdening`→`planner-hardening`. **Address the Windows local-exit-code trap here.** _(Prerequisite for every slice — a broken-math refactor wouldn't turn CI red without it.)_
2. **[refactor] `getPortalTarget()` theme-safety** — add a `main.app`-scoped portal helper + route the SnowballSection portal (and any new sheet) through it; fix the `.dark-them` typo (`03-nav-results-modals.css:465`); single-source theming (drop `globals.css`'s conflicting `prefers-color-scheme` block). **Must precede any new overlay** (payday overlay / Live Activity) or they re-break light-in-dark. Visual-verify BOTH themes.
3. **[refactor] `CompletedRecommendedAction` canonicalization** — one canonical (storage's exported def), delete the local copies; **nail the exact set first** (inventories disagree 4×/6×/+demo — incl. `ResultsSection`/`SnowballSection` redeclares + `DemoCompletedRecommendedAction`). Do BEFORE capture writes richer actuals into the shape.
4. **[test-gate] `handleMarkRecommendedAction` mark→unmark reconciliation test** (incl. target-edited-while-marked) — HARD GATE before step 5.
5. **[positioning] Hero reposition** → payday-allocation engine + radical-trust (IA/content on the existing Plan tab; no nav restructure).
6. **[feature] Payday Autopilot** (capture keystone; on the canonicalized types + theme-safe overlay; local-notifications already wired). _Wire capture into the new narrow hook, not page.tsx._
7. **[feature] Interest-Saved Momentum Ledger** (S; reads captured actuals; ships its own reconciliation test).
8. **[feature] Plan-vs-Actual Drift Tracker** (needs #6's capture; new money math → own reconciliation test).
9. **[refactor] release gate + after-scan** — full `validate:release` green, visual-verify all theme changes, correct SUSTAINABILITY_REFACTOR inventory, log to MASTER_PLAN.

**🚫 DEFERRED from v1.6 (DECIDED 2026-07-05, Jason):** ~~Payoff Live Activity~~ — it's the one native-Swift workstream (a Widget/ActivityKit Xcode target + App Group plumbing + Dynamic-Island device testing + the Codemagic native-module gotchas). **v1.6 stays the fast, pure-JS/Capacitor strike;** the payoff Live Activity ships **batched with the Home-Screen Widget in the native-surfaces version** (the renumbered v1.9 — cheaper to build the App Group plumbing once, and it aligns with the roadmap's native-features batching). Still a top anti-LLM moat — just not mid-strike native risk. _(Also part of the 2026-07-05 roadmap renumber: v1.6 Differentiation → v1.7 Foundation infra → v1.8 Android → v1.9 native surfaces → rest +1.)_

### ✅ Decisions — RATIFIED 2026-07-05 (Jason approved ALL 8 per recommendation)
_Locked: ① SPLIT (spine=v1.6, infra=v1.7) · ② bounded 3-item refactor slice only (defer orchestrator 3-5) · ③ pull the `handleMarkRecommendedAction` reconciliation test into v1.6 · ④ canonical types onto storage exports now · ⑤ defer `components/` folder migration to v1.7 · ⑥ KEEP bottom-tab + iPad sidebar nav · ⑦ drop Tailwind v1.7 · ⑧ keep `tests/visual` manual + wire `clampMoney` at v1.7. Plus the earlier calls: defer payoff Live Activity to the native-surfaces batch; roadmap renumbered. **v1.6 scope is fully locked — build unblocked from step 1.1.**_
- [ ] **Split the release?** → **REC: YES** (spine=v1.6, infra=v1.7). _(Or ship both together as one large v1.6.)_
- [ ] **Refactor depth?** → **REC: bounded 3-item slice only** (CI gate · getPortalTarget · CompletedRecommendedAction) + the reconciliation test; defer orchestrator Phases 3-5 to v1.7. _(Or start orchestrator extraction now.)_
- [ ] **Pull the `handleMarkRecommendedAction` reconciliation test into v1.6 (before Payday Autopilot)?** → **REC: YES** — this is the single most important call; it guards a verified latent balance-drift path.
- [ ] **Canonical type home?** → **REC: consolidate onto existing storage exports now**; defer the `lib/types/` neutral-layer relocation to a later structural slice.
- [ ] **`components/` folder-structure migration?** → **REC: defer to v1.7** (one section per commit; high churn, zero user payoff).
- [ ] **Standing nav re-eval?** → **REC: KEEP bottom-tab + iPad sidebar** (record it so it stops recurring).
- [ ] **Tailwind v4 pipeline?** → **REC: drop in v1.7** (app is 100% hand-written global CSS; Tailwind pays build cost for ~zero use).
- [ ] **`tests/visual/` + `clampMoney`?** → **REC: keep tests/visual manual for now** (unify all 3 seed systems + re-baseline screenshots in v1.7); **wire `clampMoney` into the forecast/insights formatters in v1.7** (adds the missing NaN-guard) rather than delete.

---

## A. The differentiation spine — the new lead (build order)

> Ordered. **Capture before analytics** (the feature audit's key rule — every "tracks your progress" feature is vaporware if the user stops logging). Tiering follows [[feedback_no_paywall_basic_functionality]]: the core allocation + capture stay **free**; premium sits on depth.

1. **Reposition the hero → the payday-allocation engine.** Lead the whole product with *"what do I pay with THIS paycheck?"* (the cycle-aware allocation waterfall), demote snowball/avalanche from headline to a mechanism. Positioning/IA/onboarding/store-listing change — the engine already exists. Cheapest, highest-impact single move. **Free** (it's the basic job).
2. **Payday Autopilot — the capture keystone.** The night before payday, proactively push the fully-computed allocation; user confirms or nudges in one tap; **record the actuals.** This is the capture mechanism every analytics feature depends on, and it converts Debt from "a calculator you visit" to "a payday ritual that runs itself." _Absorbs/replaces the planned "External-payment logging UI" (ROADMAP) — that's a component of this._ **Free** (core workflow + it's what makes the data accrue).
3. **Interest-Saved Momentum Ledger.** A running *"you've saved $2,140 in interest and 14 months vs. minimums"* counter from real payment history via the tested amortization engine. Best value-to-cost in the audit (S), runs on data already owned. _Extends the planned "Lifetime total paid since you started" stat._ Free headline number; **premium** for the per-debt breakdown + history chart.
4. **~~Live Activity + lock-screen payoff countdown~~ → 🚫 DEFERRED from v1.6** (decided 2026-07-05) to the native-surfaces version (renumbered v1.9), batched with the Home-Screen Widget — it's native-Swift/ActivityKit + App Group work, and v1.6 stays the fast JS strike. Still a top anti-LLM moat.
5. **Plan-vs-Actual Drift Tracker** _(the 4th and last spine feature in v1.6)_ — diffs each cycle's actuals against the plan the engine generated for it; "you're 11 days behind because 3 of 8 cycles underfunded the extra by ~$140." The **deepest, least-copyable moat**, but it **depends on Payday Autopilot's captured actuals**, so it can only ship once capture is real. **Premium** (depth analytics).

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
- **⚠️ EXECUTION DETAIL REQUIRED (Jason 2026-07-05): the ASO deliverables must be step-by-step HOW-TO checklists, NOT strategy bullets.** Jason has not set up In-App Events, Custom Product Pages, keyword fields, promotional text, etc. before — so *"create an In-App Event"* is **not actionable**. Every execution item needs: the **exact App Store Connect navigation path** (e.g. _App Store Connect → My Apps → Debt Planner → [section] → [button]_), **field-by-field instructions** (what each field is, character limits, image specs), the **exact copy/values to paste**, prerequisites, and gotchas. **Assume zero prior knowledge of the ASC/dashboard mechanics.** Same standard applies to every external-dashboard task in this app (RevenueCat 3-tier setup, Codemagic UI signing, App Store Connect submission). See [[feedback_executable_howto_for_unfamiliar_tools]].

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
