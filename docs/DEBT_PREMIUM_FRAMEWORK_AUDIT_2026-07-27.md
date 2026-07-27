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

## Method note
7 lens verdicts: Free/premium-line PASS · Automation-identity CONDITIONAL-PASS · Moat/honesty/competition CHANGES-REQUIRED(core passes) · Tier/pricing, Apple-compliance, Entitlement-correctness, BNPL-cadence each FAIL-with-majors. No lens found the *strategy* wrong — every failure is a fixable storefront/wiring/copy/correctness defect. Consensus: the tier justifies its price; fix Section A before the launch-flip.
