# R2 — REFUTATION: PUBLIC CLAIMS & STORE LISTING

> Refuter pass over **M1-1 · M1-2 · M1-5/M4-9 · M1-6 · M1-8 · M1-9**.
> Repo `debt-app-v1`, branch `v1.7-dev`, shipping as `2.0.0`.
> Standing instruction: **refute first, default to REFUTED when uncertain, attack the mechanism before
> the observation.** Written incrementally.

---

## ⚡ THE CRITICAL QUESTION, ANSWERED FIRST — and it splits the cluster in two

**Q: are `site/privacy.html` and `site/support.html` the URLs App Store Connect serves?**

**A: NO — and YES, in the way that matters most and that M1 got backwards.**

Three separate facts, each verified:

**1 · The URLs are live, in-app, and paywall-linked. This half of M1 is CONFIRMED.**
`apps/rn/src/premium/legal.ts:14,16` define
`PRIVACY_POLICY_URL = 'https://jsnyde03.github.io/debt-planner-site/privacy.html'` and
`SUPPORT_URL = '…/support.html'`. Both resolve — I fetched them, they render.
`paywall.tsx:378` renders the Privacy link as an `accessibilityRole="link"` `Pressable` **on the
purchase screen** (Guideline 3.1.2, alongside `TERMS_OF_USE_URL` at `:374`), and `more.tsx:37-43`
maps all four into the More tab's link rows. The file's own header states these are the ASC-registered
pages. **So these are genuine App Review claim surfaces.**

**2 · ⛔ But `site/` in THIS repo is NOT what is served. The live pages are a DIFFERENT repo, and they
have already diverged.**

| | repo `site/` | live at `jsnyde03.github.io/debt-planner-site/` |
|---|---|---|
| privacy.html stamp | **Version 1.5 · July 3, 2026** (`site/privacy.html:130`, `:207`) | **Version 1.7 · July 27, 2026** |
| support.html stamp | **Version 1.5** (`site/support.html:359`) | **Version 1.7** |
| last repo commit touching `site/` | `34c7c89`, **2026-07-05** | — |

The live privacy page contains a paragraph that **exists nowhere in this repo** — *"The only data that
ever leaves your device is what Apple and our billing provider (RevenueCat) need to process a Premium
purchase: an anonymous subscription identifier"* (`grep -c "billing provider" site/privacy.html` → **0**).
The rewrite is recorded as owed and was then done **outside this tree**:
`docs/DEBT_PREMIUM_FRAMEWORK_AUDIT_2026-07-27.md:52` — *"Content refresh of privacy.html v1.5→v1.7
**still owed** — §D, Jason."* It landed on the live site on 2026-07-27 and was never back-ported here.

**No workflow in this repo deploys `site/`.** `.github/workflows/embed-pages.yml` is the only Pages
workflow and it publishes the **`expo export` marketing embed** to *this* repo's Pages path
(`EXPO_PUBLIC_BASE_URL: /${{ github.event.repository.name }}` → `/debt-app-v1`), not `site/`. Grep
across `.github/workflows/` for `site/` returns that file only, and only for `_site` — the export
output directory, an unrelated name collision.

**3 · Consequence for the cluster.** Every finding whose evidence is a `site/*.html:<line>` citation is
**pointing at a stale local artifact that is not the shipping surface**. That does not automatically
clear the finding — the live page has to be read on its own terms — but it does mean:
- the **quoted strings in M1-1 and M1-2 are not the strings App Review will see**;
- **fixing `site/` in this repo fixes nothing** — the deploy path is manual, into another repo, and a
  PR here would produce a green tree and an unchanged public page;
- M1's framing that *"`docs/release-notes/app-store-listing.md` names `site/` as the source of truth"*
  is **falsified by the artifacts themselves** — the live pages are 22 days newer and carry text this
  repo has never contained. `site/` is a **stale mirror**, not a source.

⚠️ **This is the third consecutive audit hitting the same shape: the observation survives, the
mechanism does not.** Two of the six findings below change verdict entirely on this point.

---

## Findings

### R2-M1-1 — "not backed up to iCloud"
**Verdict:** **MECHANISM WRONG, OBSERVATION HOLDS** *(and the observation is weaker than filed)*

**How I tried to break it:** (a) checked whether the cited file is the shipping artifact; (b) fetched the
live page and compared the actual sentence; (c) attacked "auto-backs-up on backgrounding" as
unconditional; (d) checked whether the backup is opt-in and what its default is; (e) checked whether the
restore path reads iCloud without consent.

**What I found:**

⛔ **The quoted claim does not exist on the shipping page.** `site/privacy.html:147` — *"Is not backed up
to iCloud (the app uses localStorage, not iCloud-synced storage)"* — is **v1.5 text in a stale mirror**.
The live page (v1.7) says, in a rewritten bullet list:
> *"Is not synced or backed up to iCloud"*

The `localStorage` parenthetical — which M1 called "false twice over" — **is already gone**, as is the
"Nothing is uploaded, synced to a server, or shared with anyone" sentence M1 quoted. The live lead now
reads *"…The only data that ever leaves your device is what Apple and our billing provider (RevenueCat)
need to process a Premium purchase: an anonymous subscription identifier."* **Two of M1-1's three cited
falsehoods were fixed on 2026-07-27 and the auditor did not know**, because the fix landed in the
`debt-planner-site` repo and never came back to `site/`.

⛔ **"Auto-backs-up on backgrounding" is materially overstated.** `_layout.tsx:160` does not call
`backupToCloud` on background — it calls it **only if `shouldAutoBackup(current, …)` returns true**, and
that guard is **default-OFF**: `service.test.ts:178` asserts *"default OFF: an absent key means off"*
against `cloudBackupEnabled` ([D47]). It additionally refuses a not-yet-onboarded store and a session
where the restore offer was declined (`_layout.tsx:154-159`). So the shipping default is **no iCloud
write ever**, until a user opens More → iCloud backup (`more.tsx:216-221`) and turns it on.

✅ **What survives, and it is enough.** The bullet *"Is not synced or backed up to iCloud"* is a flat
statement of what the app does, in a section titled *"What data the app stores"*. The app ships an iCloud
backup feature that, once enabled, writes the entire store to the user's iCloud container on every
backgrounding. The sentence is false for any user who turns it on, and it is false as a description of
the product regardless. **A privacy policy that denies a shipped feature by name is a defect even when
the feature is opt-in** — arguably *especially* then, because the policy is what a user consults to
decide whether to enable it.

⚠️ **One thing M1 missed that is sharper than what it filed:** `_layout.tsx:183-199` calls
`restoreFromCloud` on **every fresh install, before any consent**, to decide whether to offer a restore.
That is an unconditional **read** of the user's iCloud container by an app whose policy says nothing about
iCloud except that it isn't used. The write is opt-in; the read is not.

**App Review exposure?** **Yes** — Guideline 5.1.1(i) (privacy policy must accurately describe data
handling) and the ASC **Privacy Policy URL** is linked from the paywall per 3.1.2, so a reviewer reaches
it in one tap. Note the *App Privacy* nutrition label is a separate surface I did not check.

**Residual doubt:** low that the sentence is false; **high that the filed fix is wrong.** Editing
`site/privacy.html` in this repo changes nothing a reviewer will ever load — the deploy is manual into
another repo. Also unverified: whether the live page has changed again since my fetch, and whether the
iCloud container is the app's own private container (it is `NSUbiquitousKeyValueStore`/iCloud Drive via
`createCloudBackupProvider.ios.ts`, which I did not open).

---

### R2-M1-2 — "no analytics or crash reporting"
**Verdict:** **DOWNGRADED** *(blocker → major)* — **the mechanism is CORRECT and I resolved its one open
uncertainty against the app, but the quoted sentence is not the shipping sentence and the live wording is
far softer.**

**How I tried to break it:** (a) fetched the live Analytics section; (b) tried to prove the release build
carries **no** DSN, which would have made the claim true; (c) traced `initErrorReporting`'s guard;
(d) checked whether `codemagic.yaml`'s "ships DISABLED" comment is current.

**What I found:**

⛔ **The quoted text is stale.** `site/privacy.html:181-182` (*"The current version of the app does not
include analytics or crash reporting. No behavioral data or usage statistics are collected or
transmitted."*) is v1.5. The **live v1.7** section reads:
> *"Paycheck Debt Planner does not use behavioral analytics — no usage statistics or tracking of any kind
> are collected or transmitted. **If a future update adds crash reporting** to help us diagnose and fix
> bugs, it will collect only anonymous technical crash diagnostics (such as device model, OS version, and
> the error itself) — never your financial data or anything you've entered — and we will update this page
> to reflect it."*

This splits the claim in two, and **the halves land differently**:
- *"does not use behavioral analytics"* → ✅ **TRUE.** `funnel.ts:64-68` — `track()` returns when `sink`
  is null, and `setFunnelSink` is called **only** in `funnel.test.ts:27,32,46` (grep across
  `apps/rn/src` + `packages`). Nothing is transmitted. See R2-M1-8.
- *"**if** a future update adds crash reporting"* → ⛔ **FALSE.** Crash reporting is in **this** update.

⚡ **I tried to save the claim by proving no DSN ships, and the opposite is documented.**
`docs/DEBT_SENTRY_SETUP.md:28` — *"✅ **Done 2026-08-20:** DSN received, `EXPO_PUBLIC_SENTRY_DSN` added to
the Codemagic `AppleConnect` group (🎯), project slug `debt-planner`, project id `4511944380907520`."*
`codemagic.yaml:38-39` pulls `groups: [AppleConnect]` into every release archive, so `process.env
.EXPO_PUBLIC_SENTRY_DSN` is set at Metro transform time and `sentry.ts:19-20` does **not** hard-return.
**M1's "medium confidence" on this is resolvable and resolves against the app: Sentry ships live in
2.0.0.** `codemagic.yaml:33`'s *"Sentry ships DISABLED (no DSN) until Phase 6"* is a **stale comment** —
Phase 6 is now, and the DSN was added — not evidence of the build's state.

⚠️ **Why this is major and not a blocker.** The live sentence does not assert the absolute M1 quoted. It
pre-describes the exact practice, promises to update the page, and understates rather than overstates
collection (`sentry.ts:26-29` deletes `user`, `request` and `contexts.device`, so **device model is not in
fact collected** — the page offers more than the app takes). The defect is a **tense**: *"if a future
update adds"* must become *"this version includes"*. That is a one-sentence copy fix.

⚠️ **The bigger exposure is a surface no lens has looked at.** Shipping Sentry means ASC's **App Privacy
nutrition label** must declare a **Diagnostics → Crash Data** collection type. If the label was filed for
the "no analytics, no crash reporting" era, **that** is the 5.1.1 mismatch that matters, and it is not
checkable from this tree. **Flagging it because M1 did not, and it outranks the HTML.**

**App Review exposure?** **Yes** — Guideline 5.1.1(i)/(ii) via the paywall-linked Privacy Policy URL, and
**more seriously via the App Privacy label**, which is checked mechanically.

**Residual doubt:** low on the DSN (documented as delivered, though I cannot read the Codemagic group
myself — if 🎯 removed it, the live sentence becomes true and this finding evaporates). Unknown: the
current state of the ASC privacy label.

---

### R2-M1-5 / R2-M4-9 — the store listing's PREMIUM block
**Verdict:** **CONFIRMED** — and **strengthened**. This is the one finding in the cluster whose weakest
link (*"is the repo artifact the live listing?"*) I was able to close **against** the app.

**How I tried to break it:** (a) the obvious refutation — *the repo file is a stale local copy and P6.21
rewrites it anyway, so it's a doc, not a claim*; (b) re-checked each of the six features' gating from the
entry point, not just the selector; (c) looked for a premium gate on Amortization somewhere other than the
screen file; (d) checked whether P6.21's scope already covers it.

**What I found:**

⚡ **The refutation fails at the first step: I read the LIVE App Store listing and it carries the block
verbatim.** `itunes.apple.com/lookup?id=6773201250` returns **version 1.6** and a served description
containing, word for word:

| live phrase (verified present in the served description) | shipping reality | evidence |
|---|---|---|
| *"Smart Insights — Adaptive recommendations based on your actual cash pressure…"* | **does not exist** | `analysisSelectors.ts:139-141` — *"Smart Insights: intentionally NOT surfaced (2.2.5 scrapped, Jason 2026-07-22)"* |
| *"3-Month Forecast — Projected cushion, debt balance, and risk level three cycles out"* | **does not exist** | `analysisSelectors.ts:146-148` — *"Forecast: intentionally NOT surfaced either (2.2.3, Jason 2026-07-22)"* |
| *"Strategy Comparison — Snowball vs. avalanche, **side-by-side**…"* | a toggle, no comparison | `money.tsx:356-370` |
| *"What-If Simulation"* — sold as Premium | **FREE** | `progress.tsx:80-81` runs `selectWhatIf` unconditionally; `WhatIfControls.tsx:34` says so in its own header — *"A free tool (the pull readout)"* |
| *"Amortization Schedule"* — sold as Premium | **FREE** | zero `premium` hits in `apps/rn/src/app/schedule/[id].tsx`, and both entry points are ungated (`money.tsx:277`, `index.tsx:681`) |
| *"Pay Cycle History **(Premium)**"* | **FREE** | `history.tsx:28` — *"Ships unlocked"* |
| *"Also free: … full backup + **CSV import**"* | absent | `detectBackupFormat.ts:27` — three JSON shapes, no CSV path in `apps/rn/src` |

**Six for six, plus the free-tier CSV line — on the page a buyer is reading right now.** Two of the six are
recorded in the app's own source as deliberately killed, on the same day, by name.

⛔ **"P6.21 will rewrite it anyway" is not a refutation — it is the finding's own remedy, and P6.21's
scope as written does not reach it.** The plan row (`DEBT_ELEVATION_PLAN.md:61`) reads *"Listing · release
notes (lead with the rewrite — a 2.0 with **1.7-shaped notes** re-creates the expectation problem)"* — it
frames the job as staleness of the **What's New**, and names *"privacy label declaring RevenueCat"*
without mentioning the **description** at all. ⚠️ **ASC carries the previous version's description forward
by default**; nobody has to do anything for 2.0.0 to ship under the v1.6 text. The finding is precisely
that this must not be allowed to happen by default.

⚠️ **Two things the listing says that M1 did not catch, and both are worse than a stale bullet:**
1. *"**BUILT FOR PRIVACY** — Everything stays on your device — no accounts, **no cloud**, no bank
   connections, no trackers."* The app ships **iCloud backup** (a cloud) and **Sentry** (a tracker, in the
   ordinary reading). Same defect as R2-M1-1 and R2-M1-2, on the **store page**, in an absolute form
   neither HTML page still uses.
2. The listing contradicts **itself**: *"Pay Cycle History **(Premium)**"* appears under
   **TRACK YOUR JOURNEY** *and* again under **PREMIUM**, for a feature `history.tsx:28` ships unlocked.

✅ **One thing M1 got right and it is the sharpest half:** the four things the paywall actually sells
(`paywall.tsx:28-42` — Payday Guardian · Can I Afford It? · Recovery Plan · projected balances) appear
**nowhere** in the live description. The store sells six things that are free or fictional and does not
mention the four that are real.

**App Review exposure?** **Yes — the strongest in the cluster.** Guideline **2.3.1** (accurate metadata;
descriptions must not include features the app does not contain) and **3.1.2 / 2.3.2** for describing
subscription content the subscription does not unlock. A reviewer who taps Premium and finds What-If
already free is looking at the violation directly.

**Residual doubt:** the lookup API returns the **currently-served** US description, which is v1.6 — the
version being replaced. It is possible a 2.0.0 description is already staged in ASC, and staged metadata
is not served. **That is the only way this finding is wrong, and it is checkable in thirty seconds by
someone with ASC access.** Promotional Text is not in the lookup payload, so M1-4's *"100% private"* line
stays unverifiable from here — though *"100% private"* is **ABSENT** from the served description, so it
survives only in Promo Text if at all.

---

### R2-M1-6 — `support.html` describes premium as four features
**Verdict:** **CONFIRMED** — the citation is stale, the **live page carries the identical sentence**, and
the "worse than the listing" argument survives.

**How I tried to break it:** (a) the file-is-stale attack that broke R2-M1-1 and R2-M1-2 — fetched the
live support page expecting the v1.7 refresh to have fixed it; (b) checked `SUPPORT_URL` is reachable
in-app; (c) re-checked the tier omission.

**What I found:**

⚡ **The stale-file attack fails here.** The live page is stamped **Version 1.7** — it *was* refreshed —
and the Premium answer came through that refresh **untouched, identical to the repo's v1.5 copy**:
> *"Premium ($4.99/month) unlocks Smart Insights, Forecast, Strategy Comparison, and What-If Scenarios —
> the analytical tools that go beyond a single paycheck and project your trajectory forward."*

**Four for four wrong, on the served page**: Smart Insights and Forecast do not exist
(`analysisSelectors.ts:139,146`), Strategy Comparison has no comparison surface (`money.tsx:356-370`),
What-If is free (`WhatIfControls.tsx:34`).

✅ **Reachability holds.** `SUPPORT_URL` (`legal.ts:16`) → the More link map (`more.tsx:37-43`), and it is
the ASC **Support URL**, which App Review opens as a matter of routine.

✅ **The tier omission holds and is worse than when it was written.** The live page still names only
**$4.99/month**. `paywall.tsx:69-73` sells **Annual $29.99** (preselected, badged "Best value") and
**Lifetime $79.99**. Git confirms the omission was deliberate for a state the app has since left —
`34c7c89 docs(site): remove 'or annual' from support — annual tier not live (slated later)`.

⚠️ **The live support page carries a defect neither M1-6 nor M1-7 filed.** Under *"Can I import debts from
a CSV file?"* it answers:
> *"**Yes.** In the Debts section, tap the import button to load a CSV file. The CSV should have columns
> for name, balance, minimum payment, APR, and due date. Any rows with missing required fields will be
> skipped with a count shown after import."*

**Step-by-step instructions for a feature that does not exist in the RN app** (`detectBackupFormat.ts:27`
accepts three JSON shapes and is written to refuse when unsure). This is more damaging than the listing's
one-word *"CSV import"* — it is the support page generating the support email it exists to prevent, and it
is the same regression M4-2/M4-9 traced (the parser survives only in the tree **P6.11 deletes**).

**App Review exposure?** **Yes** — 2.3.1 (the Support URL is metadata) and 3.1.2 by proximity, since the
reviewer arrives from the paywall. Lower probability than R2-M1-5 (a reviewer may not read the FAQ), same
class.

**Residual doubt:** none on the text — I read the served page. The doubt is **who can change it**: the fix
lives in the `jsnyde03/debt-planner-site` repo, and I have not verified push access to it.

---

### R2-M1-8 — the inert "Share anonymous usage" switch
**Verdict:** **CONFIRMED (mechanism)** · **DOWNGRADED (the contradiction half is REFUTED)**

**How I tried to break it:** (a) re-ran the grep myself across `apps/rn/src` **and** `packages`;
(b) checked whether `track()` has real call sites (a seam with no callers would make the switch merely
premature rather than lying); (c) checked whether the switch is QA-gated and therefore not shipped;
(d) attacked the "two public statements contradict each other" framing against the **live** page.

**What I found:**

✅ **The mechanism is exactly right and I could not dent it.** `funnel.ts:53` `let sink: FunnelSink | null
= null`; `funnel.ts:64-68` `track()` returns immediately when `sink` is null. `setFunnelSink` appears at
**exactly four sites, all of them `funnel.test.ts:1,27,32,46`** — zero in app code, in `apps/rn/src` or
`packages`. The module's own header states it: *"It sends nothing… `track` forwards to a sink that is null
until something installs one, and nothing does yet"* (`funnel.ts:16-17`), and *"a no-op when nothing is
listening — which is every build today"* (`funnel.ts:62-63`).

✅ **It is not a dead seam — there are seven live `track()` calls** (`demo.tsx:71`, `demoExit.ts:35`,
`demoSession.ts:114,117`, `tutorialSession.ts:178,261,262`). So events genuinely fire and are genuinely
discarded. The switch is not premature scaffolding; it is a control over a pipe with an open inlet and no
outlet.

✅ **It ships.** `more.tsx:277-289` sits in the **Preferences** section, outside the `qaEnabled()` fence at
`:335`. Default is ON — `value={!prefs.analyticsOptOut}`, and `analyticsOptOut` is optional/absent by
default.

⛔ **But M1-8's second half — *"two public statements now contradict each other"* — is REFUTED on the
shipping surface.** M1 quotes `site/privacy.html:182` (*"No behavioral data or usage statistics are
collected or transmitted"*) and calls it a collision. The **live** page says *"Paycheck Debt Planner does
not use behavioral analytics — no usage statistics or tracking of any kind are collected or
transmitted."* **That statement is TRUE** — verified above, nothing is transmitted. There is no
contradiction between two public claims; there is **one** false surface, the switch, and the privacy page
is the accurate one.

⚡ **That inverts the fix, and it is the useful output of this refutation.** M1 called the remedy a scope
call between *"hide the control"* and *"ship the sink."* It is not a free choice: **shipping a sink would
falsify the live privacy policy**, which currently states the absolute in the present tense and is
paywall-linked under 3.1.2. Attaching a sink before submission would convert a cosmetic defect into a
5.1.1 privacy-policy inaccuracy *and* require a Data Collection entry on the App Privacy label. **The only
cheap-and-correct move before the freeze is to hide the row.** (`more.tsx:271-276`'s own comment argues
the control exists so *"opt-out"* means something — but an opt-out from nothing is not an opt-out either.)

**App Review exposure?** **No.** The direction of harm is **under**-claiming collection: the app says it
takes data it does not take. Nothing in 5.1.1 or 2.3.1 is violated by promising less privacy than you
deliver, and it induces no purchase. This is a **trust/coherence** defect, not a review risk — which is
why it should not compete for freeze budget with R2-M1-5.

**Residual doubt:** low on the code. One unchecked path: I did not verify that no **native** module or
config plugin installs a sink at startup outside JS (`app.json` plugins), though `funnel.ts`'s sink is a
module-local JS closure and unreachable from native, so this is close to impossible.

---

### R2-M1-9 — "Check any purchase against your plan before you buy" on the first screen
**Verdict:** **CONFIRMED** — and the gating is worse than filed, in a way that removes M1's own hedge.

**How I tried to break it:** (a) checked whether `WelcomeStep` is genuinely first, or preceded by a route
guard/splash; (b) checked whether `AffordabilityCard` is even **rendered** for a free user (if it were
premium-only-visible the promise would be broken differently); (c) tested M1's own stated doubt —
*"one could argue the free read is **a** check"*; (d) looked for any other free surface that checks a
purchase against the plan.

**What I found:**

✅ **It is the first screen, unambiguously.** `onboarding.tsx:18-22` — `step` initialises to `0` and
`step === 0` renders `WelcomeStep`. Nothing precedes it. The bullet is `WelcomeStep.tsx:19`, third of
three: `{ icon: 'shopping-cart', title: 'Spend without the guilt', body: 'Check any purchase against your
plan before you buy.' }`. Matches the rendered frame `capture-ref/p6.8/phone/light/onboarding.png`.

✅ **The card IS rendered to free users, so the promise is tested rather than merely absent.**
`index.tsx:415` gates on `guardian`, and `selectPaydayGuardian` (`guardianSelectors.ts:588-596`) is
**data**-gated (needs an allocation and a cash timeline), not tier-gated. A free user with a paycheck and
one debt sees "CAN I AFFORD IT? · Thinking about a purchase?" with both fields live.

⛔ **The gate.** `AffordabilityCard.tsx:167-171` — for `!isPremium`, the entire result branch collapses to:
> *"You have about $X spare this paycheck."* + `PremiumInvite`

The verdict (`comfortable` / `tight` / `short`), `AffordabilityImpactBar`, the *"About $N less goes to debt
this paycheck"* line, **Apply**, and **Save for it** are all in the `isPremium` branches (`:172-200`). The
file's own header says so: *"Free gets the honest spare-cash taste + a value-led invite"* (`:33`).

⚡ **M1's hedge does not survive contact with the actual string, and the correction makes it worse.** M1
wrote that a free user gets *"one sentence that does not mention their purchase at all"* and conceded
*"one could argue the free read is **a** check."* Wrong on both counts: there are **two** lines, and the
second **does** name the amount —
`` `Premium tells you if ${formatWhole(result.amount)} fits — applies it to your plan, or plans how to save
for it.` `` (`:170`). **The app takes the user's purchase, repeats its exact figure back to them, and uses
it only to say that answering would cost $4.99.** That is not "arguably a check"; it is the promise being
displayed and withheld in the same view. The free "spare cash" figure is `discretionaryNow` — a number the
user could read off Today without typing anything, so entering the purchase buys them nothing.

✅ **No other free surface closes it.** What-If (free) models an extra **debt payment**, not a purchase.
The Timeline shows running safe-cash but never takes an amount. There is no free path from "I'm thinking of
spending $400" to an answer.

⚡ **And the project already wrote the correction, one screen later.** `CompletionStep.tsx:24` carries the
L1-4 fix note — *"'core features never require a subscription' left 'core' undefined while the Guardian's
ACTING half is paid — read as a promise, then felt like a bait."* `WelcomeStep.tsx:12`'s header still
asserts the list is *"Honest across tiers: the free read genuinely tells you what's safe; premium
automates the moves."* That defence is true of bullets 1 and 2 (a *read* is what they promise) and **false
of bullet 3**, whose verb is "Check" and whose object is "any purchase" — the exact thing the free read
declines to do. **The sweep that fixed the sibling missed this one.**

**App Review exposure?** **No — this is not a metadata surface.** It is in-app copy, and App Review does
not adjudicate tier-honesty in onboarding. ⚠️ The real cost is **conversion quality**: the promise is set
before any paywall and charged for after, which is the bait shape the project explicitly named and fixed
once already. Severity holds at **major**, and I would raise it above M1-8.

**Residual doubt:** low. One thing I did not test: whether a **first-run** free user reaches the
Affordability card at all before hitting the paywall — `guardian` requires an allocation, so a user who
skips the paycheck step never sees the card, and the promise is then simply unfulfilled rather than
visibly withheld. Either way the bullet is not honest.

---

## Verdict summary

| finding | verdict | severity after refutation |
|---|---|---|
| **R2-M1-1** iCloud denial | MECHANISM WRONG, OBSERVATION HOLDS | blocker → **major** *(opt-in, and the worst wording is already gone from the live page)* |
| **R2-M1-2** crash reporting | DOWNGRADED *(mechanism confirmed, quote stale)* | blocker → **major** on the HTML · ⚠️ **the ASC privacy label is the real one** |
| **R2-M1-5 / M4-9** listing PREMIUM block | **CONFIRMED, strengthened** — verified on the **served** listing | **blocker** |
| **R2-M1-6** support.html premium | **CONFIRMED** — verified on the **served** page, + a CSV FAQ nobody filed | **blocker** |
| **R2-M1-8** inert usage switch | mechanism CONFIRMED · **contradiction REFUTED** | major → **minor**, no review risk |
| **R2-M1-9** WelcomeStep bullet 3 | **CONFIRMED**, worse than filed | **major** |

⚡ **The pattern held for the third audit running: every observation survived in substance, and three of
six mechanisms were wrong.** Two findings cited text that no user can reach; one asserted a contradiction
between two public claims when only one of them was false; one described a conditional auto-backup as
unconditional; one under-described the gate it was complaining about. **Not one of the six was clean, and
not one was cleanly right.**

---

## ⛔ The structural finding, which outranks all six

**`site/` in this repo is a stale mirror of a public surface it cannot deploy to.** The live pages live in
`jsnyde03/debt-planner-site`, they are **v1.7** while this repo holds **v1.5**, and the live privacy page
contains a paragraph that has never existed here. No workflow in `.github/workflows/` publishes `site/`.

Consequences that must be recorded somewhere durable:
1. **A PR that edits `site/*.html` fixes nothing** and produces a green tree over an unchanged public page.
   Any remediation of M1-1/M1-2/M1-6 must name the **other repo**.
2. **The reverse is also true and is the more dangerous half:** an edit made directly to the live site
   never comes back here, so this repo's copy is a **decoy** for every future audit. It has already
   misled one.
3. `docs/release-notes/app-store-listing.md`'s claim — *"source of truth: `debt-app-v1/site/`"* — is
   **false as of 2026-07-27** and should be corrected or the mirror deleted. A mirror that lies about
   being canonical is worse than no mirror.

---

## What must change before submission

Survivors only. **copy-only** = an edit to a hosted page or an ASC field, no build, lands any time before
or after the freeze. **code** = a string inside the binary, so it must land **before P6.19's final
build** or it waits for 2.0.1.

### Must — App Review exposure

1. ⛔ **Rewrite the App Store Description's PREMIUM block from `paywall.tsx:28-42`, not from v1.6.**
   *(copy-only — ASC field)* · **R2-M1-5**. Verified live: six premium bullets that are free, absent or
   scrapped, plus *"CSV import"* under free and *"no cloud"* under BUILT FOR PRIVACY. ⚠️ **This will not
   happen by itself — ASC carries the prior description forward by default**, and P6.21's row is worded
   for the *release notes*. Highest-probability rejection in the cluster (2.3.1).
2. ⛔ **Fix the Premium sentence and the CSV FAQ on the live `support.html`.** *(copy-only — the
   `debt-planner-site` repo)* · **R2-M1-6**. Four-for-four wrong, plus step-by-step instructions for a
   CSV import that does not exist, plus a page that names only the $4.99 tier while the paywall sells
   three. Reachable from the paywall and it is the ASC Support URL.
3. ⛔ **Fix the iCloud bullet and the crash-reporting tense on the live `privacy.html`.** *(copy-only —
   same repo)* · **R2-M1-1 + R2-M1-2**. *"Is not synced or backed up to iCloud"* → describe the opt-in
   backup and the pre-consent restore **read**. *"If a future update adds crash reporting"* → *"this
   version includes"*. Use [D41]'s wording, and per M1's note B, **do not simplify *our servers* back to
   *anywhere***.
4. ⛔ **Declare Diagnostics → Crash Data on the ASC App Privacy label.** *(copy-only — ASC)* ·
   **R2-M1-2**. `docs/DEBT_SENTRY_SETUP.md:28` confirms the DSN is in the Codemagic `AppleConnect` group,
   so **Sentry ships live in 2.0.0**. `DEBT_ELEVATION_PLAN.md:61` currently plans only *"privacy label
   declaring RevenueCat"*. **A label that omits a shipped SDK's collection is checked mechanically and is
   a harder rejection to argue than any sentence on a webpage.**

### Must — before the build freeze, or it waits

5. ⚠️ **Reword `WelcomeStep.tsx:19`.** *(**code** — string in the binary, needs P6.19's build)* ·
   **R2-M1-9**. *"Check any purchase against your plan before you buy"* promises, on the first screen a
   cold user reads, the thing `AffordabilityCard.tsx:167-171` charges for — and the free branch names
   their amount back to them only to withhold the answer. The correction pattern is already written at
   `CompletionStep.tsx:24` (L1-4). ⛔ **This is the only item on the list that a freeze can lock out.**

### Should — cheap, no review risk

6. **Hide the "Share anonymous usage" row** (`more.tsx:277-289`). *(**code** — same build)* ·
   **R2-M1-8**. An on-by-default switch claiming a collection that never happens. ⚠️ **Do not "fix" it by
   attaching a sink**: the live privacy policy states the no-analytics absolute in the present tense and
   is paywall-linked, so shipping a sink would turn a cosmetic defect into a 5.1.1 inaccuracy plus another
   App Privacy label entry. Hiding is the only cheap-and-correct direction.
7. **Correct or delete the `site/` mirror**, and fix `app-store-listing.md`'s "source of truth" line.
   *(copy-only — this repo)*. It has already cost one audit three wrong citations.

### Explicitly NOT on this list

- **Editing `site/privacy.html` or `site/support.html` in this repo as the remedy for 1–3.** It changes
  nothing a reviewer or user will ever load. Do it *as well*, for the mirror; never *instead*.
- **M1-8's "ship the sink" option** — see 6.
- **M4-9's build-it options** (Strategy Comparison, CSV import, since-last-cycle delta). **Unsaying costs
  nothing and is item 1;** building any of them is a 2.1 scope call, not a submission blocker.

---

## What I could not check

1. **Whether a 2.0.0 description is already staged in ASC.** The lookup API serves only the live v1.6
   metadata. Staged metadata is invisible from outside. **This is the single check that would confirm or
   kill item 1, and it takes thirty seconds with ASC access.**
2. **The current App Privacy label.** Not exposed by the lookup API in a form I could read against the
   Sentry/RevenueCat question.
3. **Promotional Text** (M1-4's *"100% private, no sign-up"*). Not in the lookup payload. Worth noting
   that *"100% private"* is **absent from the served description**, so if it survives anywhere it is
   there.
4. **Push access to `jsnyde03/debt-planner-site`**, which items 2 and 3 assume.
5. **Whether the Codemagic `AppleConnect` group still holds `EXPO_PUBLIC_SENTRY_DSN`.** Documented as
   added 2026-08-20; if it were removed, item 4 and half of item 3 evaporate.
6. **Screenshots and the App Preview.** Assets built against v1.5/v1.6 UI; a screenshot showing a scrapped
   feature is a 2.3.3 rejection, and no lens in the roster is pointed at them. Not mine, and still nobody's.

_R2 complete. **6 refuted-or-confirmed · 1 structural finding above them all · 3 new defects surfaced that
no lens had filed** (the live "no cloud"/"no trackers" listing line, the live support page's CSV
instructions, and the pre-consent iCloud read at `_layout.tsx:183-199`)._
