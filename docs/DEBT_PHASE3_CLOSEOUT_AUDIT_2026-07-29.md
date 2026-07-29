# Debt Planner v1.7 — Phase-3 Closeout Audit (2026-07-29)

> **Gate:** adversarial audit measuring the DELIVERED Phase 3 (Waves A/B/C + native block + native iPad) against the 3.0 Best-in-Class Enhancement audit's intent + the 12 closeout criteria, BEFORE the interactive-tutorial/demo phase builds on these surfaces. **Method:** 4 rotated Fable-5 lenses (vision · coherence/regression · honesty/premium-bar/a11y · engineering-integrity), verified vs the actual code + a both-theme screenshot pack. **Synthesis + all load-bearing verification on the session model (Opus).** Detail here; the plan carries a terse roll-up.

## Verdict
Phase 3 substantially **delivered the vision, not a checkbox version** — the per-debt beat, milestone pulse, proof strip, affordability impact-viz, Guardian-led first-run, and Wave-C chart interactivity all land their 3.0 intent with genuine honesty discipline; the native block is category-uncopyable (pending hardware proof). It falls short in a few concentrated places: two **3.0-CONFIRMED items never shipped** (ack-density coordinator — actively worsened by new acks; variable-income band), the **flagship finale is a ~2s interim-haptic moment** where a spectacle was spec'd, a **Guardian-number seam** contradicts itself across two premium cards, and **adopted scope silently fell off the queue**. Engineering is sound (platform-split discipline independently verified clean); the real gaps are in test coverage, not product code. No Phase-0/1/2 regression found. Dark-theme parity **confirmed** (the screenshot "empty canvas" was a CanvasKit capture-timing artifact — re-verified rendering fully).

## Load-bearing findings — VERIFIED against code (Opus)
- **COH-1 (real):** the Today Guardian lookahead surfaces `endingBalance` (clamped) as its number while Progress cash-flow plots `net` (unclamped) for the SAME cycle — different figures on two premium cards. `buildMultiCycleTimeline.ts:29-40` explicitly says the status is "driven by `net`, NOT `endingBalance`," so the lookahead's own number contradicts its status basis. (`guardianSelectors.ts:433` · `CashFlowSection.tsx:135`)
- **COH-2 (real):** the Guardian legend shows Safety-net + Cushion as disjoint stats, but `buildGuardianBrief.ts:32-33` states heldReserve is "WITHIN the cushion (≤ `cushion`)" — so the three stats sum ABOVE the hero's "Free" ($444 vs $415 in the shot). (`PaydayGuardianCard.tsx:180-181` · `planSelectors.ts:43-59`)
- **VIS-4 (real):** the ack-density coordinator (Guardian Tier-3, a 3.0-CONFIRMED Phase-3 item) does not exist — Today renders SIX independent `{cond ? <Card/> : null}` ack blocks with no slot arbitration, and Phase 3/3.5 ADDED two of them (`pendingMilestone`, `intentRollback`). (`index.tsx:276-337`)

## Triage

### 🔴 MUST-FIX before the tutorial phase
- **VIS-4 — Ack-density coordinator.** The tutorial fires on the Today/Guardian surface; building it atop an uncoordinated 6-ack stack compounds rework. Pairs with the still-open Guardian Tier-3 decisions (hero "Free"→"Safe/Flexible" label · keep-essential toggle). **A real build initiative + a product-language decision — Jason's call.**

<details><summary>🟠 SHOULD-FIX this version (before the ship gate)</summary>

- **COH-1** — feed the lookahead `net` (the figure its status is based on) or reword to "ends near $0"; one quantity, one name. [verified]
- **COH-2** — legend shows `cushion − heldReserve` when Safety-net is present (or label "Cushion incl. safety net"); makes Today's two cards reconcile to the dollar. [verified]
- **COH-3** — one product name: UI teaches "Payday Guardian"; the paywall says "The Payday Cushion Guardian." Pick one, sweep paywall/Live-Activity/widget/Siri strings. (Decide before tutorial copy.)
- **VIS-1** — the debt-free FINALE is thinner than spec'd: 24 Reanimated rects, ~2s, a placeholder `success()` haptic. The bespoke Core Haptics AHAP is an **unbuilt BUILD item mis-parked as "device-QA."** Deepen the particle layer (let it breathe 4–6s) + re-home the AHAP as an explicit build task. [craft decision]
- **VIS-5** — the **variable-income debt-free BAND** (design-LOCKED, zero-scaffolding, meant to build WITH Wave C) never shipped; variable-income users still see one false-certain date. A pure derivation, web-verifiable. [build decision]
- **VIS-6** — **scope-ledger drift:** interactive notifications (3.0's #5 highest-ROI), Sentry scaffold (was gated on a native build that has since happened), opt-in debt-free sound, mesh-gradient — all adopted into v1.7 scope, none has code or a queue slot; Windfall revisit unresolved. **Explicit re-triage owed — Jason's call.**
- **HON-1** — Progress hero shows cents (`$5,600.00`) via `formatCurrency` while every other surface uses `formatWhole`. Two-token fix on the most-photographed figure. [verified visually]
- **A11Y-1** — trajectory chart has no one-utterance VoiceOver summary + isn't grouped (the ring + cash-flow already got this pattern). `TrajectoryChart.tsx`.
- **A11Y-2** — `TextField` visible label not programmatically associated (no `accessibilityLabel` on the input) — WCAG 4.1.2; one line, propagates everywhere. `TextField.tsx:26-31`.
- **A11Y-3** — light-mode `accent.warning` `#d97706` ≈ 3.2:1, below AA 4.5:1 (cash-flow warn captions). Darken to ~`#b45309`; align the CashFlowSection hardcode to the token. `colors.ts:52`.
- **ENG-2** — `widgetStorage.native.ts:1` imports `@bacons/apple-targets` at module top level (the last top-level native import; construction is already lazy). Same latent-leak class as this session's two crashes — defer via `require` inside `getStorage()`. [verified]
- **DEF-1** — three Deferred-backlog entries are already resolved in shipped code (DriftCard deleted · paywall trust claim shipped · safety-net "covered" capped). Strike them. [verified]
- **TEST-1** — add a `route-smoke.spec.ts` (seed → `goto` every route → assert one text each). `/history` + `/living-expenses` have zero e2e; the enh-audit spec asserts nothing. Locks the project's nastiest known regression class (blank routes).
- **TEST-2** — add `ipad-layouts.spec.ts` at ~1194px: Today two-column · Money list+detail · a `.hover()` flips a row's bg. The entire 3.6 adaptive block is currently regression-unprotected on web where it IS testable.

</details>

<details><summary>🟡 LATER / backlog</summary>

- **VIS-2** render the vanquished/finale to a branded share-CARD image (`react-native-view-shot`) — the one organic-growth artifact; pairs with promotion work.
- **VIS-3** proof-of-work strip renders as a tertiary prose footnote vs the spec'd "visual strip" — re-evaluate weight at the cohesion audit with seeded history.
- **VIS-7** on web, RN overlays composite on the CanvasKit ghost during the ~1s wasm load → reads broken; gate overlays until the canvas resolves (fold into the web-prewarm backlog item). iOS unaffected.
- **HON-2** trajectory "less interest" is an unhedged multi-year projection vs the Guardian's hedged-dollar voice → wording/voice audit.
- **A11Y-5** `MilestoneAckCard` + `VanquishedArchive` miss the one-utterance grouping → wording audit.
- **COH-4** More casing mix + stale "coming with Premium" subtitle → wording audit.
- **COH-5** trajectory waypoints put "✓" (=done) on FUTURE projected clear-months → drop the check.
- **COH-6** Phase-3 mount animations hardcode durations vs the motion tokens → one tokenization sweep.
- **NEW-1** the Focus debt with no `originalBalance` is the only row without a momentum bar → backfill `originalBalance` at creation.
- **DEF-2** delete dead `ProgressRing.tsx` (trigger fired; zero consumers). **DEF-3** update the "chart alt-labels" deferral to name only the trajectory residual.
- **TEST-3** unit-test the `keyCommandBus` latch. **TEST-4** e2e the What-If extra-payment UI path.
- **PERF-1** Today recomputes ~15 selectors unmemoized (Progress memoizes) — wrap `engineStore`+cluster in `useMemo([store,isPremium])`. **PERF-2** hoist the invariant baseline sim out of `selectWhatIf` (re-runs per keystroke).
- **ENG-3** `scan.ts isScanAvailable()` returns `true` unconditionally (contradicts its docstring) — gate `Platform.OS==='ios'` → Android-readiness track.

</details>

<details><summary>🔵 DEVICE-QA-OWED (→ the consolidated Phase-6 pass) · ✅ health confirmations</summary>

**Device-owed:** VIS-8 (native best-in-class is provisional until the hardware pass) · REG-2 (row-swipe-vs-scroll, context-menu-tap, sheet-drag, iPad hover/⌘) · A11Y-4 (Dynamic-Type reflow/truncation at AX sizes — 2 named points).

**Verified healthy (positive):** HON-3 (every paywall bullet maps to correctly-gated shipped code; premium value-led, free complete) · HON-4 (no fabricated interest-saved; "covered" capped; proof strip factual) · ENG-1 (platform-split discipline clean: no `.native.tsx` components, all native lookups lazy, full base-fallback parity) · REG-2 (no phone regression from the late-touched shared components) · dark-theme parity re-verified (renders fully).

</details>

## The four decisions for Jason
1. **VIS-4 ack coordinator** (must-fix-before-tutorial) + the paired Guardian Tier-3 hero-label decision — build now as the active initiative?
2. **VIS-5 variable-income band** — build this version (it's the honesty item for the target audience + enriches the tutorial), or defer?
3. **VIS-6 scope re-triage** — interactive notifications IN? Sentry scaffold now? sound/mesh-gradient → backlog? Windfall → decision slot?
4. **VIS-1 finale** — invest in deepening the emotional peak + re-home the Core Haptics AHAP as a build task this version?

The ~10 cheap SHOULD-FIX correctness/a11y fixes (COH-1/2, HON-1, A11Y-1/2/3, ENG-2, DEF-1, TEST-1/2) batch-fold cleanly on a green light.
