# Lens 04 — GTM showcase · honesty · instrumentation · localization (2026-07-30)

**VERDICT: GAPS — the honesty constraint is the best-specified part of (B), but the demo's actual GTM job is under-specified: no guaranteed pre-purchase reachability, no entry points or demo→paywall→real-plan funnel, no marketing-capture requirement, ZERO instrumentation (a decided position that now conflicts with "launch-critical for GTM/ASO"), a contradictory LEGACY sample-data demo that shows exactly the matured Guardian (B) forbids, and no localization consideration for a v1.7 that ships AU/NZ. 2 MAJOR + 5 significant gaps.**

Audited spec: `DEBT_ELEVATION_PLAN.md` §Phase 3.5 (A)/(B)/(C) + `▶ NOW`. Cross-checked against `GO_TO_MARKET.md`, `MASTER_PLAN.md`, `DEBT_PREMIUM_STRATEGY_2026-07-21.md`, `FinancialFreedom/docs/V1.1_PLAN.md`, and the shipped code (`demoSeed.ts` · `WelcomeStep.tsx` · `paywall.tsx` · `utils/format.ts`).

---

## G1 (MAJOR) — Pre-purchase reachability is unspecified; as written, the showcase's only defined trigger is premium-gated

The plan's bar ("first-run makes a cold user 'get it' in seconds") and the (B) tag ("launch-critical for GTM/ASO") make the demo an **acquisition** surface. But the only reach/entry spec in §3.5 belongs to the **tutorial**: *"fires on first premium Guardian view"* — i.e. after purchase (or Simulate Premium). **(B) has NO entry point specified at all.** Nothing states the bounded demo is reachable by a free, pre-purchase, pre-onboarding cold user. If it inherits the tutorial's trigger, the acquisition purpose is structurally defeated — the only people who ever see the showcase are people who already paid.

**Close it — spec must name the entry points explicitly:**
1. **Onboarding Welcome** — the existing "Try with Sample Data" slot (`WelcomeStep.tsx`) becomes the bounded demo's front door (see G2).
2. **Paywall** — a value-led "See it in action" row on `/paywall` (per [[feedback_premium_gating_value_led]]: a taste beats a locked preview). This is the demo→purchase seam AND gives App Review a live look at what premium does.
3. **Free-tier Guardian teaser** — the free shortfall-read card's upsell can open the demo instead of (or before) the paywall.
4. **Exit funnel** — every demo run ends on a two-CTA close: **"Start my real plan"** (→ onboarding, the primary conversion) and **"Unlock Premium"** (→ paywall). Plus a clean leave-demo/reset path (the `isDemoMode` flag exists; the *exit UX* for the new bounded demo is unspecified).

## G2 (MAJOR) — The legacy "Try with Sample Data" demo contradicts (B)'s honesty constraint and is unreconciled

`demoSeed.ts` deliberately seeds a **matured, established premium user**: `genuineCycleCount: 6` (past the §2.0 discovery window, "no cold-start holdback / 'getting to know your bills' hedge"), 6 cycles of track record, 39% paid down, staggered verification states, a 45-day drift baseline. Its own comment says the cold-start demo is 2.4.11's ("demo bounded to cold-start reality") — i.e. **the thing (B) now builds**. The 3.5 spec never says what happens to this seed. As written, v1.7 ships **two demo systems**: the new bounded-honest showcase AND a one-tap onboarding path that shows a cold user precisely the matured Guardian (B) exists to avoid over-promising. That's the honesty breach through the back door — and the seed is the state a reviewer or screenshotter will most likely capture.

**Close it:** an explicit spec line: the bounded demo **replaces or subsumes** `demoStore()` as the cold-user path. Either (a) rebuild the seed to the bounded day-one shape (reserves HELD, scorecard-as-preview, `genuineCycleCount: 0`), or (b) keep a matured state ONLY as an explicitly-labeled scripted scene *inside* the demo ("a few months in, it looks like this") — never the landing state. Decide, don't leave both.

## G3 — Cold-user "gets it in seconds": no first frame, no lead job, no measurable outcome

(B) lists the *contents* (floor auto-protect · tight one-tap · water-fill) but never defines: **what the cold user sees first**, that the opening beat is the ONE uncopyable job — *"will I make it this paycheck?"* (the differentiation thesis's whole wedge; the tutorial opens with it, the demo spec doesn't) — or **any measurable "got it" criterion**. "Gets it in seconds" is the bar with no test.

**Close it:** spec the demo's first frame = the Guardian answering the paycheck question on the sample plan within ~5 seconds of entry, before any feature tour. Define success criteria even if only qualitatively verifiable at first: demo completion, demo→"Start my real plan" tap-through, demo→paywall tap-through (measurement depends on G5).

## G4 — No "the demo is the App-Preview / screenshot capture path" requirement

Phase 6 owes acquisition-grade screenshots + an app-preview video; GO_TO_MARKET §3 calls the video high-leverage; Freedom's v1.1 treats it as a spine item. The 3.5 spec builds a **scriptable** sandbox substrate but never requires that marketing can drive it: no "demo doubles as the capture path," no deterministic/pinned states (the current seed derives from `currentDate` — good for freshness, bad for reproducible captures), no named-scene jump (Guardian clear/tight/shortfall · water-fill · recovery · celebration), no dark-mode capture note ([[feedback_dark_mode_screenshots]]). Retrofitting scriptability at Phase 6 is exactly the double-work 3.5 exists to avoid.

**Close it:** add to the substrate spec: (i) **named, deterministic demo scenes** addressable via the existing dev/QA panel pattern (the `QA_TOOLS` trigger panel from 3.5.3 is the precedent) or a deep-link param; (ii) a one-line requirement "each scene is screenshot/screen-record stable (pinned dates/amounts)"; (iii) the Phase-6 screenshot/video plan sources from these scenes; captures in dark mode. Cheap now — it's the same scripting the tutorial needs.

## G5 — Instrumentation: none exists, none is specced, and the decided position predates the demo's GTM role

Grep confirms **zero analytics** in the RN app (no PostHog, no seam). That's decided, twice: Phase-3 "analytics OUT (privacy moat)" and 2.11 "analytics skipped (RevenueCat dashboard covers the funnel)." But RevenueCat sees *purchases*, not *attribution* — it cannot answer tutorial start/complete/skip, demo engagement/replay, demo→paywall→purchase, or whether the free at-risk showcase converts or repels. Freedom's V1.1 lesson applies verbatim: *"without instrumentation the market audit is blind"* — Debt's post-launch market audit and any v1.7.x iteration on 3.5 will have no signal on whether the launch-critical feature works. The "analytics OUT" call was made for the privacy moat before the demo's acquisition role existed; it deserves re-confirmation against this new surface, not silent inheritance.

**Close it — add a `[DECISION]` gate to the 3.5 spec (Jason's call, options + rec):**
- **(a) Recommended:** a Freedom-pattern **privacy-first opt-in/out event seam** (PostHog, mirroring `FinancialFreedom/src/analytics/`), scoped to a tiny funnel event set — `tutorial_started/step/completed/skipped/replayed`, `demo_entered{source}`, `demo_scene_completed`, `demo_exit{to_onboarding|to_paywall|abandoned}`, `paywall_viewed{source:demo}` — **never any financial data**. Tension to resolve explicitly: the "100% private / on-device" store claim must be worded to survive it (Freedom makes privacy claims and runs this seam with opt-out; the Phase-6 privacy/data-flow audit would cover it as an egress).
- **(b)** Accept blindness knowingly: proxy via ASC page-view→download and RevenueCat conversion only; write that acceptance into the plan so the market audit's limits are on record.
- Either way, the current silent "no measurement of 3.5" state is the miss.

## G6 — Honesty: (B) is strong; three residual holes

The core constraint is well-specified (scorecard = "what I'll show once I learn your income" · reserves HELD not deployed · day-one value only · isolation from `genuineCycleCount`). Residuals:
1. **The tutorial isn't bound to the same rules.** (A) demos "tap 'once I've learned you' → watch it release" — matured behavior shown to a real month-one buyer. Fine as *teaching*, but the spec should state the tutorial sandbox carries (B)'s honesty framing: future states explicitly future-tense ("after a few paychecks, I'll…"), never presented as tomorrow's behavior.
2. **The free at-risk showcase has no dark-pattern guardrail.** Spec should require: the at-risk state shows only what the free tier truthfully surfaces (free keeps the shortfall *read* per 2.6), the sample scenario is plausible-neutral (not engineered dread), and the upsell is the value-led built-plan invitation — no fear copy, no countdowns.
3. **Demo copy inherits the no-false-precision rule — restate it.** Marketing will screenshot these exact strings; the Guardian's "risk + safe move, never a false-precise $ verdict" rule and rounded interest-costs must be named as applying to all demo/tutorial copy, since these are the strings most likely to end up in the store listing (Apple 2.3.1 accurate-metadata also requires the video to show reproducible day-one behavior — which the bounded demo, done right, guarantees by construction).

## G7 — Localization / AU-NZ: zero mention, and the new copy is the cheap place to get it right

v1.7 enables AU/NZ availability at Phase 6, but the app hardcodes `en-US`/`USD` (`utils/format.ts` + ~15 components with inline `toLocaleString('en-US')`; date formatting is inconsistently split between device-locale `undefined` and pinned `'en-US'`). Symbol-wise AUD/NZD/USD all render "$" so nothing breaks — but "**biweekly**" is US dialect (AU/NZ: **fortnightly**), pinned `en-US` dates render US month-day order, and the tutorial/demo will add the largest single batch of new user-facing copy in 3.5.

**Close it (bounded, not full i18n):** (i) 3.5 copy written locale-neutral — no US idioms, prefer "each payday/paycheck" phrasing, and flag the biweekly/fortnightly wording call to the whole-app wording/voice audit (@after-3.5); (ii) hard rule for NEW 3.5 code: currency/dates only via the shared `formatCurrency`/date helpers — **no new inline `'en-US'` literals** — so a later locale pass is a one-file change; (iii) file the app-wide `'en-US'`-literal sweep to the Phase-6 AU/NZ item (where the store-availability work already lives).

---

## Recommended spec additions (summary)

1. **(B) entry + funnel block** (G1/G3): named entry points (Welcome · paywall "See it in action" · free-Guardian teaser), first-frame = the paycheck question answered in ~5s, exit = "Start my real plan" + "Unlock Premium", clean demo-exit/reset.
2. **Legacy-seed reconciliation line** (G2): `demoStore()` replaced/subsumed by the bounded demo; no cold path lands on a matured Guardian.
3. **Marketing-capture requirement on the substrate** (G4): named deterministic scenes, jumpable, screenshot/record-stable, dark-mode; Phase-6 store assets source from them.
4. **`[DECISION]` — 3.5 funnel instrumentation** (G5): opt-out privacy-first event seam (rec) vs documented blindness; re-confirm "analytics OUT" against the demo's GTM role.
5. **Honesty riders** (G6): tutorial bound to (B)'s framing rules; at-risk-showcase dark-pattern guardrail; no-false-precision restated for demo/tutorial copy.
6. **Localization riders** (G7): locale-neutral 3.5 copy · shared-formatter-only rule for new code · en-US sweep filed to Phase 6 AU/NZ.
