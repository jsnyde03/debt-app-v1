# Premium-Framework Audit — Phase-2 close gate (2026-07-27)

> Flagship adversarial method: 7 independent lens-auditors examined the real code + strategy docs + live market, prompted to *break* the framework (the builder ran the audit, so the value is independent, skeptical review). Findings below are the builder-VERIFIED survivors (false positives refuted, load-bearing claims confirmed at file:line).

## VERDICT — **CONDITIONAL PASS.** The framework is sound and justifies its price; the *storefront, purchase wiring, and some copy* have a cluster of defects (several App-Review-grade) that MUST be fixed before the launch-flip.

**What PASSED (the framework itself is right):**
- **Automation identity is GENUINE** — the Guardian is a true actor (materially different math: $50 free buffer vs the user's ~$200 floor + premium-only holdbacks), not info-with-more-words; recovery / always-current / afford-apply all pass the effort/un-chattable test. Bundle coheres around "you just confirm."
- **Free/premium line is clean** — the core job (allocation · debt-free date · what-if · amortization · strategies · BNPL capture/calendar · manual entry) is fully FREE and un-paywalled; the free tier is generous and finishable; gating is value-led invitation (the Guardian split is a model).
- **Pricing structure sound** — Annual $29.99 / Lifetime $79.99 coherent + correctly ordered; Lifetime doesn't cannibalize (users graduate); no-trial call defensible (freemium = the proof window).
- **Projection-honesty is EXEMPLARY** — the highest-risk trust surface: hedged wording, stale-input hard cutoff, no phantom income, "cried wolf" reconcile, tight-cycle framed as covered-dip — holds fully.
- **"Never sells you more debt" upheld** end-to-end (afford-it offers save-for-it; BNPL planned-around; refi/insurance lead-gen was cut).
- **Apple 3.1.2 core** (price prominence · auto-renew disclosure · lifetime/sub disambiguation · restore · findable More entry) passes; restore correctly recovers existing v1.6 subscribers.

## A. MUST-FIX before the launch-flip (paywall goes purchasable)

**Purchase-path robustness (App Review 2.1 / revenue outage / correctness):**
- **A1 [D+E] Attached-but-empty/failed offering → unpurchasable static prices + "not available in preview" dead-end.** On a real device, if `offerings.current` is missing/empty or package types aren't exactly ANNUAL/MONTHLY/LIFETIME, the paywall shows real-looking prices but every Subscribe says "try it on your device" → a near-certain **2.1 rejection** + silent revenue outage. `paywall.tsx:96-102,126-129`, `purchasesClient.ts:46-47`. → Distinguish "no client (web/dev)" from "client attached, zero packages"; in the latter show error/retry + disable purchase (+ log). Verify the review build's offering actually loads.
- **A2 [E] Hydration race clobbers `premium`→`free`.** `store.ts:144` `set({ store: migrated })` wholesale-replaces the store (incl. `subscriptionPlan`) and runs independent of `useInitPremium`, so an early entitlement write can be stomped back to the persisted `free` (2nd+ launch, entitled-but-persisted-`free`; the common v1.6-first-launch case is safe). → Gate the entitlement apply on `isHydrated` / preserve `subscriptionPlan` through hydrate.
- **A3 [C+D+E] Already-premium re-purchase / Lifetime-on-active-sub double-charge.** The Subscribe button isn't disabled when premium (`paywall.tsx:237-247`); a monthly subscriber can buy Lifetime and keep getting billed. → When premium, hide/replace the CTA with Manage; warn on Lifetime-over-sub.

**Apple 3.1.2 / metadata:**
- **A4 [D] Privacy Policy link is a GitHub `/blob/` source view, not a rendered page** (`legal.ts:14`) → 3.1.2 rejection. **[needs Jason — host it.]**
- **A5 [D] Support URL broken** (extension-less `/blob/` with spaces, `legal.ts:17`). **[needs Jason — host it.]**

**Lifetime integrity:**
- **A6 [C] Lifetime "yours forever" never discloses the Connected/Ava exclusion** (`paywall.tsx:52`). The ladder plans to charge Lifetime holders more later → bait-and-switch risk. → Add a scope line before Lifetime sells.
- **A7 [C] Lifetime buyers are sent to "manage your subscription"** — an empty page for a non-consumable (`more.tsx:77-84`, indistinguishable from a sub). → Distinguish lifetime; show non-sub copy.

**Copy integrity:**
- **A8 [A] "BNPL-aware" sold as a PREMIUM benefit but BNPL is FREE/all-tiers** (`paywall.tsx:23` vs `guardianSelectors.ts:198` "All tiers", `selectors.ts:65` no gate). Free-as-premium — violates the standing hard rule. → Remove/reposition.
- **A9 [A+F] Guardian paywall headline sells INFO + asserts certainty** — "know if you'll make it" (`paywall.tsx:18`) contradicts effort-not-info AND the "never a false-precise verdict" rule. → Reframe to the action ("holds your cushion at your line every payday…") + soften "know".
- **A10 [F] Absolute privacy microcopy OVERCLAIMS** — "100% private / everything stays on your device" (`CompletionStep.tsx:11`) + "no uploads" (More TrustCard, `more.tsx:210`) are literally false given RevenueCat uploads subscription status (own policy `site/privacy.html:175`) + Sentry later. Trust-critical + a 5.1.1 privacy-label mismatch risk. → Scope to "your **financial data** never leaves your device."
- **A11 [C] The "$2.50/mo" per-month anchor is dropped on real devices** — present in the static fallback (`paywall.tsx:51`) but not the live path (`:61`), so the "Best value" badge is unsupported for every real user. → Compute per-month in `planFromPackage`.
- **A12 [F/M2] The moat/ethics story is ABSENT from the paywall** — the strongest incumbent-uncopyable reason-to-believe (on-device + never-sells-debt) doesn't appear at the point of conversion. → Add one honestly-scoped ethics line.

## B. Correctness — fix in v1.7 (free-tier headline)
- **B1 [G] `projectDebtPayoff` is cadence-blind** — pays each debt `minimumPayment` once per monthly loop with no `recurrence` scaling (`projectDebtPayoff.ts:96-138`), so a biweekly BNPL is rated at ~half its true monthly rate → wrong debt-free date (contradicts the cash forecast, which DOES scale). Feeds the free Plan headline + What-If. → Normalize installment-native BNPL minimums to a monthly-equivalent in the projection + budget; treat one-time as a lump. (Was partially in the backlog — confirmed real + broader.)

## C. Polish / Phase 3 / backlog
- Delete the unmounted `DriftCard` dead lock/"Premium+" code + `selectDrift` (B1) — do now (already backlogged). · Scrub stale "Premium+/lock" comments (`history.tsx:28`, `demoSeed.ts:16`). · Affordability invite copy leads with info not action → lead with the mutation. · Verify free "$200 · Your line" reads aspirational, not active (both themes). · Merge "Always-current" + "Scan" bullets (same job). · `isScanAvailable()` returns true unconditionally → gate `Platform.OS==='ios'` before Android (v1.8). · BNPL: add `weekly` to the capture dropdown / handle off-list CSV cadences; drop `quarterly`; soften "interest-free" for financed BNPL. · Silent legal-link-failure fallback. · premiumSync: guard the listener against a spurious empty-CustomerInfo downgrade; add an `else` for successful-but-not-entitled purchase.

## D. Needs Jason (hosting / content)
- **Host the Privacy Policy + Support pages** (GitHub Pages or any real host) so they render — replaces the `/blob/` links (A4, A5).
- **Refresh `site/privacy.html`** — it's stamped v1.5 / localStorage+Capacitor; update to v1.7 (RN, MMKV) and pre-stage the crash-reporting-disclosure flip for Sentry (Phase 6). Note: MMKV is currently **unencrypted at rest** while the moat aspires to "E2EE the floor" — no in-app copy claims encryption (fine), but reconcile the aspiration.

## E. Positioning (internalize; feed marketing / Phase 6)
- The moat is a **business-model/ethics wall** (incumbents structurally can't claim "nothing leaves your device / never sell you debt") + accumulating execution depth — **NOT** a technical wall (on-device is cloneable) and **NOT** a novel question (Rocket Money ships "Payday View" + "safe to spend"). Market the actor + ethics + on-device-day-1 + BNPL-aware *stack*, not the question. BNPL-cadence planning is a genuine incumbent gap — foreground it.

## FIX STATUS — 2.11.8 pass (2026-07-27) ✅ Section A + B1 landed
- **A1** ✅ paywall now shows an error+Retry (never static/unpurchasable prices) when the client is attached but the offering has no mappable packages. **A2** ✅ entitlement sync gated on `isHydrated` (no clobber). **A3** ✅ already-premium → Manage-subscription, no re-purchase CTA; + a successful-but-not-entitled guard.
- **A4/A5** ✅ legal URLs → the rendered GitHub Pages (`jsnyde03.github.io/debt-planner-site/{privacy,support}.html`); both verified 200/rendered. _(Content refresh of privacy.html v1.5→v1.7 still owed — §D, Jason.)_
- **A6** ✅ disclosure scopes Lifetime ("covers all current Premium; future add-on tiers sold separately") + subnote "all today's Premium, forever". **A7** ✅ Lifetime owners get a distinct non-sub row (transient `premiumIsLifetime` off the entitlement's `productIdentifier`; no migration).
- **A8** ✅ free "BNPL-aware" bullet removed. **A9** ✅ Guardian headline → the action it takes (no "know"). **A10** ✅ "100% private/everything/no uploads" → "your financial data stays on your device" (CompletionStep + TrustCard). **A11** ✅ per-month anchor computed in the live path. **A12** ✅ honestly-scoped moat/ethics line on the paywall.
- **B1** ✅ `projectDebtPayoff` cadence-normalizes BNPL minimums (+3 asserts: biweekly=2mo, monthly=4mo, one-time=1mo). **B-F1** ✅ dead `DriftCard` deleted.
- Verified: tsc · lint · core regression (+B1) · app · **e2e 28/28** · both themes screenshot-checked. Section C polish → backlog; §D (host-content refresh) + §E (positioning) → Jason / marketing.

## ROUND 2 (2026-07-27) — VERDICT: NOT yet consensus. In-app storefront/wiring/copy fixes HOLD; the B1 free-tier fix was INCOMPLETE (2 real correctness bugs) + off-device content is stale/contradictory.

5 verifiers vs the fixed code (commit 611a4fb). The premium-framework CLOSE is not blocked (identity/free-premium-line/pricing/moat all still hold post-fix); the blockers are correctness bugs in the B1 free-tier work + off-device content.

**MUST-FIX (round-2 caught these — the value of the gate):**
- **R2.1 [HIGH — B1 incomplete] `buildPayoffTrajectory` left cadence-blind.** The B1 fix went into `projectDebtPayoff` (the date) but NOT its twin `buildPayoffTrajectory.ts:16-22` (the CHART), rendered on the SAME Payoff/What-If screen → for any non-monthly BNPL the debt-free DATE and the payoff CHART's zero-crossing contradict (biweekly $400: date=2mo, chart=4mo). → share `bnplMonthlyEquivalentMinimum`, apply in `buildPayoffTrajectory`, add `recurrence` to its input type + a date-vs-chart parity assert.
- **R2.2 [MAJOR — B1 one-time bug] one-time BNPL injects a PHANTOM recurring minimum.** `bnplMonthlyEquivalentMinimum` returns the whole balance for one-time, which is summed into `monthlyBudget` once (`projectDebtPayoff.ts:124-128`) and then re-appears as "freed" extra every month after it clears → a multi-debt free debt-free date far too optimistic (the isolation-only test masked it). → treat one-time as a one-shot cost, not a recurring minimum; add a multi-debt (one-time BNPL + card) regression.

**SHOULD-FOLD (minor, cheap, mostly A7/cleanup family):**
- **R2.3** the More › About "Manage Subscription" row (`more.tsx:180`) AND the paywall's premium-branch "Manage subscription" button both still dead-end a Lifetime owner (unconditional) — mirror the `premiumIsLifetime` split there too. **R2.4** delete the now-orphaned `selectDrift` (DriftCard gone). **R2.5** the live per-month anchor hardcodes "$" (`paywall.tsx:67`) — derive the symbol / strip it (non-USD). **R2.6** plan-row a11y label omits badge+subnote; **R2.7** if the live offering has no ANNUAL, `selectedKey` stays 'annual' → no row highlighted (reset to `mapped[0].key`). **R2.8** the offline lifetime-mislabel LOW (transient `premiumIsLifetime` defaults false pre-resolve) → a `premiumResolved` gate.

**OFF-DEVICE → Jason (sharper than §D):**
- **R2.9 [MED] the HOSTED privacy.html contradicts itself** — "nothing shared with anyone including us / never leaves under any circumstances" (`site/privacy.html:138,147`) vs its own RevenueCat disclosure (`:175`). The exact A10 overclaim class, on the doc App Review reads. Scope the absolutes. **R2.10** privacy+support pages are stamped v1.5 / "browser's localStorage" for a v1.7 RN/MMKV app → refresh. **R2.11 [MED]** the App Store Connect privacy nutrition label MUST declare RevenueCat (Identifiers/Purchases) or 5.1.1 label-mismatch. **R2.12** "100% private" survives in store-listing/ASO marketing copy → align at submission.

**DEFER (backlog / round-1 C confirmed):** per-paycheck payCycle threading · weekly/quarterly BNPL capture · financed-BNPL "interest-free" mislabel · listener spurious-downgrade guard · error-path logging (moot until Sentry) · affordability info-led invite · stale "Premium+" comments · isScanAvailable Android gate (v1.8).

**No regressions confirmed:** non-BNPL debt-free dates byte-identical; payoff order intact; A2 hydration + A7 lifetime + premiumIsLifetime transient field all correct across hydrate/reset; A10 copy coherent across all 3 surfaces; free/premium line + identity + projection-honesty all still hold.

### ROUND-2 FIX STATUS — 2.11.10 cycle (2026-07-27) ✅
- **R2.1 ✅** shared `packages/core/debt/bnplPayoffPace.ts` applied to BOTH `projectDebtPayoff` + `buildPayoffTrajectory` — chart and date now agree (parity assert: biweekly BNPL zero-crossing = month 2 = the reported date).
- **R2.2 ✅** one-time BNPL excluded from the recurring budget in both engines (cleared month 1 only) — multi-debt regression proves a $2000 one-time no longer wipes a coexisting $1000 card early (stays 10 months).
- **R2.3 ✅** More About "Manage Subscription" row + paywall Manage button both gated to real subscribers (`plan==='premium' && !premiumIsLifetime`). **R2.4 ✅** orphaned `selectDrift` deleted. **R2.5 ✅** per-month anchor derives the currency symbol from `priceString`. **R2.6 ✅** plan-row a11y label includes badge+subnote. **R2.7 ✅** selection resets when the live offering lacks the preselected plan.
- **Deferred:** R2.8 (offline lifetime-mislabel flicker, LOW) → backlog. **Off-device R2.9–R2.12 → Jason** (hosted `site/privacy.html` self-contradiction + stale v1.5/localStorage content + ASC privacy label must declare RevenueCat + marketing "100% private").
- Verified: tsc · lint · core regression (+R2.1/R2.2 asserts) · app · scenarios · **e2e 28/28**, both themes. **Awaiting consensus signoff** (focused round-3 re-audit of R2.1/R2.2, or Jason's signoff) → Phase 2 closes.

## ROUND 3 (2026-07-27) — re-audit of the R2.1/R2.2 fixes. Caught ONE more real edge (the cadence working a 3rd time); fixed.
2 focused verifiers (correctness + regression sweep). R3-B: no regressions, all 6 minors clean, R2.2 core correct. But BOTH independently caught:
- **R3.F1 [fixed]** — the R2.2 budget-exclusion INTRODUCED a chart flatline: an all-one-time-BNPL plan with zero extra → `monthlyBudget=0` → the chart's `totalInterest >= monthlyBudget` break fired at `0>=0` before clearing the lump, so the chart flatlined while the date said month 1. → guarded the break on `monthlyBudget > 0` (the lumps still clear via their month-1 minimum). + solo-one-time chart-parity assert.
- **R3.F2 [fixed]** — R2.2's "no effect on a coexisting debt" only held at extra=0; with extra>0 the lump *decelerated* the card (debited against the extra pool). Decided the correct model: a one-time lump is an obligation paid month 1 from regular cash, so it's cleared but NOT counted in `minimumsPaidThisMonth` in either engine → it neither accelerates nor decelerates coexisting debts. + an extra>0 non-deceleration assert + weekly coverage.
- **Deferred (R3-B, non-blocking → backlog):** `selectDebtAmortization` still cadence-blind (per-debt sheet vs headline) · dead `DriftResult` re-export.
Verified: debt projection (+R3 asserts) · core regression · RN tsc/lint · e2e 28/28. **Consensus check pending** (a final focused re-verify of the round-3 fix).

## ROUND 4 (2026-07-27) — VERDICT: **CONSENSUS** ✅
1 focused verifier re-checked the round-3 fix across every one-time-BNPL scenario (solo · two lumps · coexisting at extra=0 AND extra>0 · 3-debt snowball/avalanche · lump>budget · un-amortizable boundary). Chart↔date AGREE in every case; they correctly co-report "never" on un-amortizable inputs (proven by algebra + boundary tests — no finite-date-vs-never-chart divergence); rollover integrity + non-termination confirmed. **Fix complete + correct, no new edge.** Closed the one flagged test gap (a chart-side coexisting-lump non-deceleration assert). Non-blocker → backlog: a pathological `minimum=0` non-lump plan renders the full 600-month flat chart (consistent with the date's "Unable to estimate", not a contradiction).

### ⭐ PREMIUM-FRAMEWORK AUDIT — CONSENSUS REACHED (round 4).
The framework justifies its price; the storefront/wiring/copy fixes hold; the free-tier BNPL payoff math is correct + regression-locked. **Phase-2 BUILD ready to close on Jason's signoff.** Off-device R2.9–R2.12 (hosted privacy content self-contradiction + stale v1.5 pages + the App Store Connect privacy-label RevenueCat declaration) remain Jason's, pre-submission.

## Method note
7 lens verdicts: Free/premium-line PASS · Automation-identity CONDITIONAL-PASS · Moat/honesty/competition CHANGES-REQUIRED(core passes) · Tier/pricing, Apple-compliance, Entitlement-correctness, BNPL-cadence each FAIL-with-majors. No lens found the *strategy* wrong — every failure is a fixable storefront/wiring/copy/correctness defect. Consensus: the tier justifies its price; fix Section A before the launch-flip.
