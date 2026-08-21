# M1 — PUBLIC CLAIMS vs PRODUCT

> **Lens M1** of the P6.8 pre-release audit. Repo `debt-app-v1`, branch `v1.7-dev`,
> commit `dd80f70`, shipping as `2.0.0`.
>
> **The question is narrow: is what we SAY true?** Not "is it good" — P1 owns that.
> Every public-facing claim is traced to the code that would have to exist for the
> claim to be honest, and that code is checked.
>
> A claim is a finding when the mechanism behind it **does not exist**, **is inert**,
> **is conditional in a way the claim does not admit**, or **is contradicted elsewhere
> in the shipping surface**.

**Status: COMPLETE** — 2026-08-21.

---

## Findings

### M1-1
**Severity:** blocker
**Claim:** *"Your financial data never leaves your device. Paycheck Debt Planner stores everything locally using your phone's built-in storage. Nothing is uploaded, synced to a server, or shared with anyone — including us."* and the bullet *"Is not backed up to iCloud (the app uses localStorage, not iCloud-synced storage)"*
· **Where:** `site/privacy.html:138` and `site/privacy.html:147-148`

**Would have to be true:** the app writes only to local device storage, with no iCloud container and no
network egress of plan data. This page is not an internal doc — it is the **`PRIVACY_POLICY_URL`
(`apps/rn/src/premium/legal.ts:14`) linked from the paywall itself** (Guideline 3.1.2) and from More, and
`docs/release-notes/app-store-listing.md` names `debt-app-v1/site/` as the **source of truth** for the
live GitHub Pages copy that ASC points at.

**Actually:** P6.3 shipped iCloud backup. `apps/rn/src/storage/cloudBackup/` + `service.ts` exist;
`apps/rn/src/app/_layout.tsx:150-161` **auto-backs-up to iCloud on backgrounding**, and `:183-199` offers a
one-shot iCloud restore on a fresh install. `more.tsx:218` renders the toggle. So the policy's bullet
denies, by name, a feature that ships and runs automatically. Two of the three sentences in the lead
paragraph are false as written ("nothing is uploaded, synced to a server"), and the storage-mechanism
sentence is false twice over — RN does not use `localStorage`.

**Confidence:** high

---

### M1-2
**Severity:** blocker
**Claim:** *"The current version of the app does not include analytics or crash reporting. No behavioral data or usage statistics are collected or transmitted."*
· **Where:** `site/privacy.html:181-182`

**Would have to be true:** no crash/error SDK in the shipping bundle, or one that never initializes.

**Actually:** Sentry is wired and **live**. `apps/rn/src/app/_layout.tsx:25` imports
`initErrorReporting`/`wrapRoot`; `_layout.tsx:334` wraps the root for **Sentry auto-instrumentation
(navigation + touch breadcrumbs)**. The record shows it receiving real events —
`ExpenseSheet.tsx:28` *"found by Sentry from TestFlight"*, and `more.tsx:364` ships a **"Send a test error
to Sentry"** control whose success copy reads *"Check sentry.io → debt-planner → Issues"*. P6.5 built
`scrubBreadcrumb.ts` precisely because Sentry was carrying money-bearing accessibility labels off-device.

⚠️ **Conditional in a way the claim does not admit, in the direction that makes it worse:** `sentry.ts:20`
no-ops when `EXPO_PUBLIC_SENTRY_DSN` is unset, so "does it transmit" is a **build-env** question. The
policy states it as a settled property of "the current version". Whichever way the release build is
configured, the sentence cannot be true of both, and there is no gate asserting which one ships.

**Confidence:** high on the mechanism being present and wired; medium on whether the 2.0.0 release build
carries a DSN — I could not find a committed release env or a gate that pins it.

---

### M1-3
**Severity:** major
**Claim:** *"your financial data stays on this device"* — `PRIVACY_CLAIM.body`
· **Where:** `packages/core/copy/vocabulary.ts:113`, rendered at `apps/rn/src/app/more.tsx:406-409` (TrustCard), `apps/rn/src/app/paywall.tsx:~270` (the trust line under the benefits), and `apps/rn/src/components/onboarding/CompletionStep.tsx`

**Would have to be true:** the same as M1-1.

**Actually:** ⭐ **the text [D41] flagged is unchanged** — confirmed verbatim at `vocabulary.ts:113`. The
sharpest instance is `more.tsx`: the TrustCard renders *"Your financial data stays on this device"* as
**the first thing on the screen** (`more.tsx:117-118`), and **the iCloud backup row sits 100 lines below it
in the same scroll** (`more.tsx:218`, subtitle *"Keep a copy in your own iCloud account."*). The claim and
its counterexample are on one screen, and the user reaches the counterexample by scrolling.

⚠️ Note the **paywall** instance is the one that induces a purchase: the trust line is placed
deliberately at the point of conversion (`paywall.tsx`, comment "A12 — the moat at the point of
conversion"), so this is a claim made to close a sale.

**Confidence:** high (the string), high (the contradiction). P6.9 owns the egress proof; this finding is
only about the wording being currently false on its face.

---

### M1-4
**Severity:** major
**Claim:** *"100% private, no sign-up."* (Promotional Text) and *"100% private on your phone"* (Positioning)
· **Where:** `docs/release-notes/app-store-listing.md` — Promotional Text block and the Positioning line

**Would have to be true:** the absolute. [D32] already ruled it an overclaim (every host logs IPs), and
the plan schedules its retirement at P6.9.

**Actually:** ⭐ **it is still in the repo's App Store listing source of truth, unretired.** The in-app
surfaces did the work — `DemoDock.tsx:105` explicitly notes it *"deliberately avoids [D32]'s absolute"* —
but the **listing was never swept**, and Promotional Text is the field that appears above the fold on the
product page. So the line the app refuses to say is the line the store page leads with.

⚠️ **Scope honesty:** this is a repo artifact. Whether the live ASC field still carries it is not
checkable from here — see *What I could not judge*.

**Confidence:** high that the string is in the repo and unretired; low on the live ASC state.

---

### M1-5
**Severity:** blocker
**Claim:** the entire **PREMIUM — SMART FORECASTING** block: *"Smart Insights · Strategy Comparison · What-If Simulation · 3-Month Forecast · Amortization Schedule · Pay Cycle History"*
· **Where:** `docs/release-notes/app-store-listing.md` → Description → "PREMIUM — SMART FORECASTING"

**Would have to be true:** those six features exist and are gated behind the purchase.

**Actually:** ⚡ **not one of the six is a premium feature in the shipping app, and two of them do not exist at all.**

| listed as Premium | shipping reality | evidence |
|---|---|---|
| Smart Insights | **does not exist** — deliberately scrapped | `store/analysisSelectors.ts:139` — *"Smart Insights: intentionally NOT surfaced (2.2.5 scrapped, Jason 2026-07-22)"* |
| 3-Month Forecast | **does not exist** — deliberately scrapped | `store/analysisSelectors.ts:145` — *"Forecast: intentionally NOT surfaced either (2.2.3, Jason 2026-07-22)"* |
| Strategy Comparison | **no side-by-side surface**; only a free snowball/avalanche toggle on Money | `app/(tabs)/money.tsx:361`; no comparison component found |
| What-If Simulation | exists and is **FREE** | `app/(tabs)/progress.tsx:80-81` — `selectWhatIf` runs unconditionally, no `isPremium` gate |
| Amortization Schedule | exists and is **FREE** | `app/schedule/[id].tsx` contains **no premium check at all** |
| Pay Cycle History | exists and is **FREE** | `app/history.tsx:28` — *"Ships unlocked"* |

⚠️ And the inverse is just as bad: **the four things the paywall actually sells** — Payday Guardian ·
Can I Afford It? · Recovery Plan · projected balances (`paywall.tsx:28-42`) — **appear nowhere on the
store page.** A buyer arriving from the listing is sold six things they already have (or that don't
exist) and is not told about the four they'd be paying for.

⭐ This is a **purchase-inducement** claim: it is the block a reader converts on, and `analysisSelectors`
is the app's own written record that two of the six were killed. Severity is blocker on two counts —
false claims that induce a purchase, and App Review 2.3.1 ("accurate metadata" / features described that
the app does not contain).

**Confidence:** high on each row. Medium on whether the **live ASC** description still carries this block
(see *What I could not judge*) — but the repo names itself the source of truth and was last touched for v1.6.

---

### M1-6
**Severity:** blocker
**Claim:** *"Premium ($4.99/month) unlocks Smart Insights, Forecast, Strategy Comparison, and What-If Scenarios — the analytical tools that go beyond a single paycheck and project your trajectory forward."*
· **Where:** `site/support.html:295`

**Would have to be true:** same as M1-5.

**Actually:** same as M1-5 — **four for four wrong**: two don't exist, one has no surface, one is free.

⚠️ **This one is worse than the listing, because it is reachable from inside the app.**
`SUPPORT_URL` (`apps/rn/src/premium/legal.ts:16`) is rendered on the More tab (`more.tsx:321`), and it is
the ASC **Support URL** — the page App Review opens. A reviewer following it from the paywall reads a
premium description that the build contradicts.

⚠️ It also names **only** the $4.99 monthly tier. The app sells **Annual ($29.99)** and **Lifetime
($79.99)** as well (`paywall.tsx:69-73`, with Annual **preselected** and badged "Best value"). The same
omission is in the listing's Subscription Details block. Git history shows this was a **deliberate**
edit — `34c7c89 docs(site): remove 'or annual' from support — annual tier not live (slated later)` — so
the page is correct for a state the app has since left.

**Confidence:** high

---

### M1-7
**Severity:** major
**Claim:** *"Also free: autopay flags, Auto/Light/Dark themes, undo-on-delete, and full backup + **CSV import**."*
· **Where:** `docs/release-notes/app-store-listing.md` → Description, closing line of "WHAT YOU GET, FREE"

**Would have to be true:** an importer that accepts a CSV.

**Actually:** the importer recognises exactly **three** formats, all JSON, all self-identifying —
`envelope` · `v16-file` · `raw-v17` (`apps/rn/src/data/detectBackupFormat.ts:27`). There is **no CSV path
anywhere in `apps/rn/src`** (zero hits for `csv`/`CSV`), and `detectBackupFormat` is explicitly written to
**refuse whenever unsure**, so a CSV is not merely unsupported — it is actively rejected.

**Confidence:** high

---

### M1-8
**Severity:** major
**Claim:** the **"Share anonymous usage"** toggle — *"Which screens get used — never your balances, debts, or amounts."*, **default ON**
· **Where:** `apps/rn/src/app/more.tsx:279-289`

**Would have to be true:** something receives those events.

**Actually:** ⚡ **the switch is inert.** `track()` (`analytics/funnel.ts:64-68`) returns immediately when
`sink` is null, and **`setFunnelSink` is never called outside `funnel.test.ts`** — verified by grep across
`apps/rn/src`. The module's own header says so: *"It sends nothing… `track` forwards to a sink that is
null until something installs one, and nothing does yet."*

So the app renders an **on-by-default switch** (`value={!prefs.analyticsOptOut}`, and `analyticsOptOut` is
an optional field that defaults to absent/false) that tells the user their usage is being shared. It is not.

⚠️ **Two public statements now contradict each other:** this screen says usage data is being shared;
`site/privacy.html:182` says *"No behavioral data or usage statistics are collected or transmitted."*
Whichever is true, one of them is a false public claim, and they are two taps apart.

**Mechanism confidence:** high (the null-sink is verified by grep, and the module documents it).
**Recommendation confidence:** medium — the fix could be *hide the control* or *ship the sink*, and which
one is right is a scope call, not mine. Note the direction of harm is **under**-claiming privacy, which
does not induce a purchase; severity is major rather than blocker for that reason.

---

### M1-9
**Severity:** major
**Claim:** *"Spend without the guilt — Check any purchase against your plan before you buy."*
· **Where:** `apps/rn/src/components/onboarding/WelcomeStep.tsx:19`

**Would have to be true:** a free user, after onboarding, can check a purchase against their plan.

**Actually:** they cannot. "Can I Afford It?" is premium-gated at `AffordabilityCard.tsx:167` — a free user
who enters an amount gets **one sentence that does not mention their purchase at all** (*"You have about
$X spare this paycheck"*) plus a `PremiumInvite`. The verdict (fits / tight / short), the impact bar, the
debt cost, Apply, and Save-for-it are **all** behind the purchase.

⚠️ **This is the same defect the project already fixed one screen later.** `CompletionStep.tsx:24` carries
the fix comment for **L1-4**: *"'core features never require a subscription' left 'core' undefined while
the Guardian's ACTING half is paid — read as a promise, then felt like a bait."* The welcome screen's
third bullet does exactly that, for exactly this feature, and was not swept. Note the file's own header
claims the list is *"Honest across tiers"* (`WelcomeStep.tsx:12`) — which is true of bullets 1 and 2 and
false of bullet 3.

⭐ It is the **first screen a user reads**, before any paywall, so it sets the expectation the paywall
later charges for.

**Mechanism confidence:** high. **Severity confidence:** medium — one could argue the free read is *a*
check; I do not think a sentence that never names the amount qualifies, but a refuter may.

---

### M1-10
**Severity:** minor
**Claim:** *"Can I Afford It? — **apply any purchase** to your plan in one tap, or build a plan to save for it."*
· **Where:** `apps/rn/src/app/paywall.tsx:38`

**Would have to be true:** every purchase can be applied.

**Actually:** the `short` verdict renders **no Apply control at all** (`AffordabilityCard.tsx:169-183`) —
only *"Save for it →"*. The "or" arguably carries it, which is why this is minor rather than major, but
"any" is a quantifier the code contradicts in the one case a worried user is most likely to test.

**Confidence:** high on the code path; low that a reader is misled. Filed for completeness, not for work.

---

### M1-11 — ✅ CONFIRMED CLEAN, recorded because the record predicted otherwise
**Claim:** the paywall promises no free trial. **[D53]: 2.0 ships with NO trial.**

**Checked and clean.** `introPrefix(pkg, 'unknown')` at `paywall.tsx:79` — every call site passes the
literal `'unknown'`, `introPrefix` returns `''` for anything but `'eligible'` (`introOffer.ts:35`), so no
prefix can render. I swept every user-facing string in `apps/rn/src`, `packages`, `site/` and
`docs/release-notes/` for *free trial · days free · try free · risk-free · money-back*: **zero hits in
purchase copy.** The only "free trial" strings in the app belong to the user's **own bills**
(`ExpenseSheet.tsx:52,99,105` — "Amount now (0 for a free trial)"), which is a different subject.

⭐ **No blocker here.** The eligibility argument is doing its job as designed.

**Confidence:** high

---

### M1-12 — ✅ CONFIRMED FIXED, and the record is stale on it
**Claim:** **L5-12 — "the paywall never mentions the user's own money"** — filed as the best open candidate.

**It has been built.** `apps/rn/src/store/paywallLead.ts` exists and is wired at `paywall.tsx:128`,
rendering above the abstract benefits (`paywall.tsx:~250`, `testID="paywall-lead"`). Three states, all
in the reader's own figures: shortfall → *"This paycheck comes up $X short."*; `from=cushion-forecast` →
the forecast answer; default → *"You have $X cushion this paycheck. Your plan protects a flat $50 of it.
Premium protects the line you choose instead."*

I checked the load-bearing half — that the *offer* is true:
- **"Premium protects the line you choose instead"** — `effectivePaycheckBuffer` (`selectors.ts:24`)
  returns `cushionFloor` for premium vs `BASE_PAYCHECK_BUFFER = 50` for free, and the floor **is**
  user-settable (`setCushionFloor`, `store.ts:571`; `CushionFloorSheet`, reached from `index.tsx:369`),
  with the adjust control premium-gated. ✅ literally true, both halves.
- **"plots it across your next six paydays"** — `RUNWAY_CYCLES = 6` (`cushion-forecast.tsx:16`). ✅
- **"marks where it dips below your line"** — `CashRunwayChart` takes `floor`. ✅

⭐ **The record should be corrected: L5-12 is closed, not open.**

**Confidence:** high

---

### M1-13 — ✅ CONFIRMED CLEAN
**Claim:** the marketing embed — *"Get it on the App Store"* + *"Your money stays on your device."*

**Both hold, and the second is the one claim in this audit that is enforced rather than asserted.**
`zero-egress.spec.ts` fails the build if the embed reaches **any** foreign host or writes **any**
persistent storage, and it exercises the page (scroll + 1.5 s) rather than only booting it. The CTA is a
real `<a>` to `apps.apple.com/us/app/paycheck-debt-planner/id6773201250` with `target=_blank` and
`rel=noopener`, asserted at the element level (`cta.spec.ts:29-35`).

⚠️ One note, not a finding: the embed **discards** what the viewer types (sessionStorage-only), which the
line does not say. "Stays on your device" remains literally true, so I am not filing it.

**Confidence:** high

---

### M1-14 — ✅ CONFIRMED CLEAN
**Claim:** *"Scan a statement or bill to prefill your debt details — the scan stays on your device."* — the iOS camera permission string, `apps/rn/app.json:25`. This is a public claim: iOS renders it verbatim in the system dialog.

`ScanVisionModule.swift` presents `VNDocumentCameraViewController` and runs `VNRecognizeTextRequest`
locally; the recognized text is resolved straight into the pure JS parser. **No network, no vendor SDK,
no image persisted.** ✅

⚠️ Unverified on hardware (`scan.ts:10` and the Swift header both say device-QA is owed at Phase 6), so
the *claim* is honest by construction while the *feature* is undemonstrated. That belongs to P6.14, not here.

**Confidence:** high on the claim; the "in seconds" half of the paywall bullet (`paywall.tsx:42`) is a
performance assertion nobody has measured on a device.

---

## Two adjacent observations — not numbered, because they are not my lens

**A · `QA_TOOLS = true` still ships a "Simulate Premium" switch.** `apps/rn/src/config/qa.ts:9` carries its
own warning — *"FLIP TO `false` BEFORE THE APP STORE SUBMISSION"* — and `more.tsx:340` renders a switch
that sets `subscriptionPlan` to `'premium'` with no purchase. It touches M1 only in that *"Unlock
Premium — $29.99 per year"* asserts payment is what unlocks Premium, which a shipped toggle makes false.
**Owned by P6.17** (`git grep QA_TOOLS`), flagged here only so it is on one more list.

**B · [D41]'s replacement claim is careful in a way worth preserving.** *"Your data never goes to **our**
servers. Optional iCloud backup keeps it in your own Apple account."* The word *our* is load-bearing —
RevenueCat and Sentry are third-party servers that do receive data. The claim survives that; *"never
leaves your device"* does not. ⛔ **Whoever lands the rewrite must not "simplify" `our servers` back to
`anywhere`.**

---

## Ownership — where each of these already has a home, and where it does not

I checked `docs/DEBT_ELEVATION_PLAN.md` for each finding so severity reads against the real schedule.

| finding | already owned? | by whom |
|---|---|---|
| M1-3 `PRIVACY_CLAIM.body` | ✅ **yes**, named explicitly | **P6.9** — the row calls it *"a live counterexample"* |
| M1-4 "100% private" | ✅ yes | **P6.9** — *"owns retiring the marketing '100% private' line"* |
| M1-5 listing / release notes | ⚠️ **partly** | **P6.21** owns *"Listing · release notes"*, but as a **staleness** job (*"a 2.0 with 1.7-shaped notes"*). It does **not** record that the Premium block is **false**, nor that two of its six features were deliberately scrapped |
| M1-1 / M1-2 `site/privacy.html` | ⛔ **NO** | **`site/` is not mentioned anywhere in `DEBT_ELEVATION_PLAN.md`** — zero hits for `privacy.html`, `support.html`, or `site/` |
| M1-6 `site/support.html` | ⛔ **NO** | same |
| M1-7 CSV | ⛔ no | falls inside the listing, unrecorded |
| M1-8 analytics toggle | ⛔ no | P6.9 traces egress; an **inert** control is the opposite problem and no row covers it |
| M1-9 WelcomeStep bullet | ⛔ no | L1-4 fixed the sibling string; this one was not swept |

⭐ **The single most useful thing this lens produced:** `site/privacy.html` and `site/support.html` are
**public, in-app-linked, ASC-registered claim surfaces that no phase owns.** They were last stamped for
v1.5/v1.6, they are linked from the paywall by Guideline 3.1.2, and they currently state — in the
affirmative — three things the 2.0.0 build contradicts (no iCloud, no crash reporting, a Premium tier
made of four features that are free or nonexistent).

---

## Mechanisms, stated separately from recommendations

Per the standing lesson (*2 of 4 stated mechanisms were wrong while all 4 recommendations were sound*):

| # | MECHANISM I claim | conf | RECOMMENDATION | conf |
|---|---|---|---|---|
| M1-1 | `_layout.tsx` auto-backs-up to iCloud on background; the policy denies iCloud by name | **high** | rewrite `site/privacy.html` to [D41]'s wording before submission | **high** |
| M1-2 | Sentry initialises when `EXPO_PUBLIC_SENTRY_DSN` is set; the DSN lives in a Codemagic group I cannot read, and the record shows TestFlight events arriving | **medium** (the DSN's release-build state is inferred, not read) | the policy must describe crash reporting regardless of which way the flag lands, and a gate should pin which | **high** |
| M1-5 | two of six listed premium features were deliberately scrapped; three ship free | **high** (each row has a file:line) | rewrite the Description's premium block from `paywall.tsx`'s `PREMIUM_BENEFITS`, not from v1.6 | **high** |
| M1-6 | `support.html` is the ASC Support URL and is linked from More | **high** | same rewrite, same source | **high** |
| M1-8 | `setFunnelSink` is never called in app code → `track()` always no-ops | **high** (grep-verified, and the module says so) | hide the switch **or** attach a sink — a scope call for 🎯, not mine | **medium** |
| M1-9 | free "Can I Afford It?" returns a spare-cash sentence that never names the amount | **high** | reword the welcome bullet the way L1-4 reworded its sibling | **medium** |

⚠️ **The one I would bet against myself on is M1-2's release-build DSN state.** Everything else in this
slice was read directly out of the tree.

---

## What I could not judge

1. ⛔ **The LIVE App Store Connect fields.** Everything in M1-4 · M1-5 · M1-7 is read from
   `docs/release-notes/app-store-listing.md`, which *declares itself* the source of truth but was last
   committed for v1.6 (`af767d2`). If the ASC fields were edited directly in the web console, the repo and
   the store have already diverged and I cannot see which way. **Someone with ASC access has to read the
   live Description, Promotional Text and Subscription Details.** Same for the live GitHub Pages copies of
   `privacy.html` / `support.html` — I compared against `site/`, not against what is served.

2. ⛔ **Whether the 2.0.0 release build carries a Sentry DSN.** It comes from a Codemagic env group, not
   the repo. `codemagic.yaml:33` still asserts *"Sentry ships DISABLED (no DSN) until Phase 6"* while
   `more.tsx:351` documents a **2026-08-20 device pass** verifying Sentry on hardware — those two cannot
   both be current, and the resolution is outside the tree.

3. ⛔ **Whether the RevenueCat product identifiers in ASC match the three plans the paywall renders**, and
   whether the ASC prices match the `STATIC_PLANS` fallback ($29.99 / $79.99 / $4.99). On device the
   strings come from RevenueCat, so a mismatch is invisible from here — but the static prices are what
   web previews and screenshots show, so a divergence would be a false price in the marketing assets.

4. ⛔ **Whether any intro offer is configured in ASC.** M1-11 proves the *app* cannot render a trial
   promise. It cannot prove the *store* is not configured with one — which would be the mirror failure
   (Apple grants a trial the paywall never mentions). `introOffer.ts:26` flags exactly this coupling.

5. ⚠️ **Screenshots and the App Preview video.** `docs/release-notes/screenshot-brief.md`,
   `v15-reference-shots/` and `V16_APP_PREVIEW_BRIEF.md` describe assets built against the v1.5/v1.6 UI.
   Whether the *shipped* screenshots show surfaces that still exist is a **visual** judgment against the
   P6.8 matrix — V1–V4's instrument, not mine. **Flagging it because no lens in the roster is pointed at
   store assets**, and a screenshot showing a scrapped feature is an App Review 2.3.3 rejection.

6. ⚠️ **Tone/quality of the honest claims.** M1-12's lead copy is *true*; whether it is *persuasive* is P1.

---

_M1 complete. **14 entries: 4 blocker · 5 major · 1 minor · 3 confirmed-clean · 1 record-correction (L5-12 is closed).**_
