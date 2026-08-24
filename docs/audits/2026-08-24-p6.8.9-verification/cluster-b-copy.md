# P6.8.9.2 — independent verification, cluster **b (COPY)**

**Verifier:** did not build any of these fixes. Branch `v1.7-dev`.
**Ids:** A4 · M1-9 · C6 · M1-8 · L1-22 · P1-10 (copy half).
**Method:** finding text (SYNTHESIS / slices) → log account (`DEBT_ELEVATION_LOG.md`) → **the current code**.
Where the log and the code disagree, the code wins and the disagreement is recorded.

⚠️ **Note on paths:** the brief was found at
`docs/audits/2026-08-21-p6.8-finish/docs/audits/2026-08-24-p6.8.9-verification/BRIEF.md` — a nested
duplicate of this folder, created 2026-08-24 11:26. This file is written at the intended top-level path.

---
## A4 — `WelcomeStep.tsx:19` promises a premium feature — **CLOSED-UNPINNED**

**The finding.** `SYNTHESIS.md:315` — *"Reword `WelcomeStep.tsx:19` — the first screen promises a
premium feature."* Filed as a **submission blocker** (§A), and the only §A item that is code.

**Q1 — is the observation closed?** Yes. The bullet array is
`apps/rn/src/components/onboarding/WelcomeStep.tsx:13-33`; slot 3 is now
`{ icon: 'lock', title: PRIVACY_CLAIM.headline, body: \`No account needed — and ${PRIVACY_CLAIM.noSelling}.\` }`
(`WelcomeStep.tsx:32`). The old string survives only inside the explanatory comment at
`WelcomeStep.tsx:19-22`. A repo-wide grep for `"Check any purchase"` outside comments and audit docs
returns **zero** live sites. Nothing on the welcome screen now names a premium capability:
bullet 1 (`:17`) is the free Guardian read, bullet 2 (`:18`) is the free payoff date, bullet 3 (`:32`)
is a privacy stance that is tier-independent.

**Q2 — what else did the site do?**
- **Three bullets, rendered by `key={f.title}`** (`WelcomeStep.tsx:73`). Titles must stay unique;
  `"Private by design"` collides with neither `:17` nor `:18`. Count preserved at 3, so the layout
  and every captured welcome frame keep their shape.
- **The icon had to resolve on BOTH platforms.** `IconGlyph = keyof typeof MaterialIcons.glyphMap`
  (`AppIcon.tsx:9`) so `'lock'` typechecks, and `theme/icons.ts:78` maps `lock: 'lock.fill'`, so iOS
  renders an SF Symbol rather than falling through to the Material fallback at `AppIcon.ios.tsx:20`.
  `npm run lint:icon-glyphs` is green (43 in use, 26 SF-mapped). **This property was preserved.**
- **Two Welcome strings ARE pinned** — `earlyjourney.spec.ts:30` asserts
  `'A guardian for every payday'`, and `"Get started"` (`WelcomeStep.tsx:43`) drives the flow.
  Neither was touched.
- **`"Private by design"` is a known cross-file duplicate**, already in
  `scripts/duplicate-copy-baseline.json`, so `lint:copy` stays green (verified: *"no new cross-file
  phrases (16 baselined)"*).

**Q3 — was the remedy right?** M1-9's stated remedy was *"reword the welcome bullet the way L1-4
reworded its sibling"*. What shipped is a **replacement, not a reword** — the affordability promise is
deleted and the slot reassigned to C6-T3's trust stance. That is a legitimate and arguably better
resolution (it removes the claim rather than hedging it), but note the side effect: **onboarding now
never mentions the affordability check at all**, while `paywall.tsx` still sells it. That is not a
defect — an unmentioned feature cannot mislead — but it is a different outcome than the finding asked
for, and worth naming because slot 3 now carries **two** ids at once.

**Why UNPINNED, and what is missing.** ⛔ **No test asserts anything about bullet 3.** Grep across
`apps/rn/tests/` for `Private by design`, `never be sold more debt`, and `No account needed` returns
**zero** hits. `earlyjourney.spec.ts:30` pins only bullet 1. So:
- re-introducing an affordability promise on this screen would be caught by **nothing**;
- and because slot 3 is the ONLY carrier of C6-T3, an edit that reclaims it silently kills C6's
  welcome half as well.
**The missing test is one line** in `earlyjourney.spec.ts` beside the existing `:30` assertion:
`await expect(page.getByText(PRIVACY_CLAIM.headline)).toBeVisible();`. Note the gates cannot substitute
— `lint:copy` reads **literals**, and this bullet is built from constants, so the whole string is
invisible to every copy guard in `lint:rn`.

---

## M1-9 — the welcome bullet the free tier cannot honour — **CLOSED-UNPINNED**

**The finding.** `slices/M1-claims-vs-product.md:207-233`, severity **major**: bullet 3 promised a
check that `AffordabilityCard.tsx:167` gates to premium, so a free user *"gets one sentence that does
not mention their purchase at all."* Same site as A4 — the log records at
`DEBT_ELEVATION_LOG.md:1010-1012` that calling M1-9 *"A4's second site"* was an error, and that is
correct: the slice cites `AffordabilityCard` as **evidence**, not as a site to change.

**Q1 — closed?** Yes, by the same line (`WelcomeStep.tsx:32`) — and I checked the premise the finding
rested on is still live, because if the gate had moved the finding would be moot rather than fixed.
It has not: `apps/rn/src/components/plan/AffordabilityCard.tsx` still branches on tier and still
renders a `PremiumInvite` on the free side, so removing the promise was the necessary half.

**Q2 — what else?** The file header at `WelcomeStep.tsx:12` claims the list is *"Honest across
tiers"*. M1-9 observed that was *"true of bullets 1 and 2 and false of bullet 3"*. It is now true of
all three — bullet 3 makes no capability claim at all, so it cannot be tier-false. **The header
comment's own assertion is the property that was restored**, and it is still there, unedited.

**Q3 — remedy.** See A4. The slice's own confidence note (*"Severity confidence: medium — one could
argue the free read is a check"*) is the soft part, and it did not matter: the fix removed the claim,
which is right under either reading.

**Unpinned for the same reason as A4** — one shared missing assertion closes both.

---
## C6 — trust copy at the first data-entry moment (M4-8) — **CLOSED-UNPINNED**

**The finding.** `SYNTHESIS.md` §C row C6, sourced from `slices/M4-expectation-gap.md:201-231`. M4-8
grepped all four onboarding steps for `device`/`private`/`account`/`bank`/`sync` and found **one hit,
an unrelated code comment**. The bench doc's four trust surfaces: **T2 (paywall) and T4 (More) shipped;
T1 (first data-entry) and T3 (welcome stance) did not.**

**Q1 — is the observation closed?** Yes, on both halves, and I re-ran M4-8's own grep:

| bench surface | site now | line |
|---|---|---|
| **T1** — the money-asking moment | `PaycheckStep.tsx:117` — `{PRIVACY_CLAIM.atEntry}`, directly under the amount `TextField` (`:95-106`) | ✅ |
| **T1**, second door | `FirstDebtOrBillStep.tsx:117` — same constant | ✅ |
| **T3** — welcome stance | `WelcomeStep.tsx:32` — `PRIVACY_CLAIM.headline` + `noSelling` | ✅ |

**Q2 — what else did these sites do, and does it still work?**
- ⭐ **The skip path is genuinely covered, and I verified the routing rather than trusting the
  comment.** `PaycheckStep.tsx:86` renders `"Skip for now"`, and `onboarding.tsx:39` wires
  `onSkip={() => setStep(2)}` → `FirstDebtOrBillStep`. So a user *can* reach a balance field having
  never seen the promise, which is exactly why the second placement at
  `FirstDebtOrBillStep.tsx:117` is load-bearing rather than redundant. **Delete either one and a real
  path loses the line.** No test encodes that.
- **Insertion position in `PaycheckStep`.** The `Text` sits between the amount field and the
  `SwitchRow` at `:120-124`, not appended at the end — so the "varies" branch (`:125+`) still renders
  below it. No spec locates controls by index; grep for `field-paycheck-amount` across
  `apps/rn/tests/` returns **zero**, so nothing was pinned to break.
- **Contrast/scale.** Both use `textStyles.footnote` + `c.text.tertiary` — the smallest/faintest
  pairing in the app, and B6 reported 15 of 24 light pairs failing AA. `npm run lint:contrast` is
  green (*"every rendered token pair clears its floor"*) and `lint:type-scale` is green, so the new
  copy did not introduce a pair the gate would reject. ⚠️ The gate checks **token pairs**, not this
  specific rendered string, so it is a class check, not a site check.

**Q3 — was the remedy right?** ⭐ **The finding's own remedy was the unsafe one, and the fix correctly
refused it.** M4-8 says *"the wording is already written in the repo"* and points at §R1 T1:
`DEBT_BENCH_TRUST_FIRSTRUN_2026-07-20.md:175` — *"No account, nothing uploaded — it works with your
phone in airplane mode."* **Both halves of that are now false**: cloud backup shipped 2026-08-21.
Pasting the bench wording would have put a brand-new false privacy claim at the highest-trust-sensitivity
moment in the app. What shipped instead is scoped: `vocabulary.ts:135` —
*"No account needed — your numbers never go to our servers."* I checked that this is actually true and
not just narrower:
- iCloud backup lands in the **user's own** Apple account, and `[D47]` makes it opt-in/default-off, so
  at this moment in first-run it is definitionally off;
- Sentry ships, but `utils/sentry.ts:25` sets `sendDefaultPii: false`, `:26` scrubs the event and
  `:38` routes every breadcrumb through `scrubBreadcrumb` — the comment at `:32-36` names the exact
  hazard (*"the trail is where the money was"*). So **no number reaches our servers**, and the claim
  survives [D41].
The docstring at `vocabulary.ts:118-134` records all of this at the constant, which is the right place.

⚠️ **One deviation worth naming.** §R1 T3 asks to *"reframe the welcome to **lead** with the journey +
the honest-by-design stance"*. What shipped puts the stance in **bullet 3 of 3**
(`WelcomeStep.tsx:32`); the headline at `:63` is still the benefit line *"Will you make it to
payday?"*. The signature move (**naming the absence**) is on screen, which is the substance of the
finding, but "leads with" it does not. I do not think this warrants PARTIAL — M4-8's stated gap is
*absence*, and absence is gone — but a reader who expects the bench's literal instruction will not
find it.

**Why UNPINNED, and what is missing.** `grep 'No account needed' apps/rn/tests/` → **zero hits**. The
line is a constant, so `lint:copy` (which reads literals) cannot see it either — verified: it reports
16 baselined phrases and none is this one. **Three sites, no coverage.** The cheapest real pin is one
assertion per money-asking step in an onboarding e2e, imported from `@core/copy/vocabulary` so it
tracks the constant rather than re-typing it:
`await expect(page.getByText(PRIVACY_CLAIM.atEntry)).toBeVisible();`. ⛔ Note the **skip path is the
one that needs it most** and is the one a hand-written happy-path spec would never walk.

---
## M1-8 — the inert "Share anonymous usage" switch — **PARTIAL**

**The finding.** `slices/M1-claims-vs-product.md:181-205`, severity **major**: the row at
`more.tsx:279-289` told the user their usage was being shared while `track()`
(`analytics/funnel.ts:64-68`) returns immediately on a null sink and `setFunnelSink` had no production
caller. Recommendation confidence explicitly **medium** — *"hide the control **or** ship the sink, and
which one is right is a scope call, not mine."*

**Q1 — closed?** Yes. The row is gone; `more.tsx:325-337` is a comment where it stood, and the
`SettingGroup` now runs Notifications (`:313`) → App Lock (`:319`) → Savings elsewhere (`:338`) →
Payday countdown (`:346`). Repo-wide grep for `"Share anonymous"` outside comments/tests: **zero live
sites**. The inert control cannot be operated because it does not exist.

**Q2 — what else did the site do?** This is where it is not clean.
- ✅ **The pref and the plumbing survived, as intended.** `data/models.ts:83` still declares
  `analyticsOptOut?: boolean` and `funnel.ts:66` still honours it at the choke point. So the fix
  removed the *claim*, not the *capability* — which is the right shape.
- ✅ **The removal created a real inverse hazard and it is genuinely coupled both ways.** I verified
  both halves rather than reading the log's account of them:
  - `funnel.test.ts:66-86` walks `apps/rn/src`, strips comments (`:66-67`), skips the defining file
    (`:69`, `:75`) and `testing`/`__fixtures__` (`:76`), and asserts `callers.length === 0` with a
    message naming the remedy. **Ran it: `✅ funnel seam: 5 assertions passed.`**
  - `tests/e2e/analytics-optout.spec.ts:33` asserts the sibling `App Lock` row is visible **before**
    the two absence assertions at `:35-36`. That is the correct defence against
    "toHaveCount(0) is true of a blank page". **Ran it against a fresh web export:
    `ok 2 … More offers no "Share anonymous usage" control while no sink exists (2.5s)`.**
- ⚠️ **One hole in the guard, worth naming:** it detects a caller of `setFunnelSink`, not the
  installation of telemetry. `funnel.ts` is deliberately excluded (`:69`, `:75`), so an edit that
  makes `track()` POST directly — rather than routing through a sink — passes the guard silently.
  Narrow, but it is the file most likely to be edited by whoever wants analytics.
- ⛔ **AND THE PRESERVED PROPERTY THAT DID BREAK — a shipped QA instruction now contradicts the app.**
  `docs/DEBT_3.5_DEVICE_QA_CHECKLIST.md:575` still reads:
  *"§12.7.1 ••• More → Preferences → **"Share anonymous usage"** is present, ON by default, and
  toggling it persists across a force-quit… This is confirming the control exists and sticks."*
  — and it is ticked `[x]` with a `✅gate` marker. The e2e spec that replaced the behaviour is tagged
  `// COVERS: §12.7.1` (`analytics-optout.spec.ts:25`) and asserts the **exact opposite**. So the
  same section id now means two contradictory things in two live documents, and **a device QA pass
  run from the checklist would file the fix as a regression.** ⚠️ The `[x]` makes it worse than a
  stale row: it asserts the missing control was *observed on a device*.

**Q3 — was the remedy right?** Yes, and the reasoning is stronger than the finding's. M1-8 left the
direction open; the fix chose *hide* over *wire*, on the measured ground that the live privacy page
states *"no behavioral analytics"* affirmatively and is linked from the paywall under Guideline
3.1.2 — so attaching a sink would have turned an under-claim into a **false public claim** under
review scrutiny. `more.tsx:329-333` records that. I checked the claim's other half holds today:
`utils/sentry.ts:25` `sendDefaultPii: false`, `:26` event scrub, `:38` breadcrumb scrub — crash data
is not behavioural analytics, so the affirmative claim survives.

**Verdict PARTIAL, not CLOSED**, for one reason: the app-side observation is closed and well pinned in
both directions, but the fix left a **shipped, ticked QA instruction demanding the removed control**.
That is a preserved property (the QA checklist's agreement with the app) that regressed, and no gate
covers it — `lint:coverage` maps specs to sections, it does not read the device checklist's prose.
**The one-line close:** strike or invert `DEBT_3.5_DEVICE_QA_CHECKLIST.md:575` and clear its `[x]`.

---
## P1-10 (copy half only) — the windfall invite's false implication — **CLOSED-UNPINNED**

**The finding.** `slices/P1-premium-bar.md:198-215`, severity **major**: the free invite at
`WindfallSheet.tsx:115` read *"Premium **shows** exactly where your $500 lands…"* while
`selectors.ts:54` folds the windfall into the paycheck **with no tier gate**, so *"free does it, and
premium tells you"* — the tier's own price test backwards.

**Q1 — is the copy observation closed?** Yes. `WindfallSheet.tsx:131`:
`Your ${formatWhole(n)} is already in the plan. Premium itemizes where it lands — expenses, debt, and
savings — before you confirm.` The sentence now **leads with what already happened**, so the
implication that the money waits for payment is gone. Rendered only on the free branch
(`:127` — `!isPremium && validAmount`), which is the branch the finding named.

⭐ **I re-verified the premise the new copy asserts, because the copy is now only true if the premise
holds.** `apps/rn/src/store/selectors.ts:54` — `paycheckAmount: income + (store.windfall ?? 0)` — is
still ungated, so *"already in the plan"* is a true statement for a free user. ⚠️ One nuance the
inline comment overstates: `selectors.ts:51-52` derives a `confidence` context **only** for premium,
so the waterfall is not byte-identical across tiers. The *windfall folding* is identical, which is
what the sentence claims, so the copy is right and the comment's *"the identical waterfall"* is
slightly loose.

**Q2 — what else did the invite do?**
- **It named the amount.** `formatWhole(n)` is preserved at `:131` — the invite still speaks the
  user's own figure, which was one of the few things the old line got right.
- **It named the three buckets.** *"expenses, debt, and savings"* is carried over verbatim, so the
  invite still tells a free user what the itemisation would contain.
- **It stayed a `PremiumInvite`**, not a lock or a disabled control — the app's rule that a gate is
  value-led rather than a locked feature. Unchanged at `:131`.
- **The premium branch is untouched** (`:98-126`), including the `accessibilityLabel` at `:106` that
  makes each split row one utterance, and the submit label flip at `:81`.

**Q3 — was the remedy right?** ⛔ **No — and the fix was right to ignore it.** P1-10's own two
recommendations were **(a) demote the routing view to free** or **(b) give premium a real windfall
action**; it recommended (a). **Neither was built.** What shipped is a third thing the finding never
proposed: leave the gate, fix the sentence. `WindfallSheet.tsx:120-126` states this openly —
*"This is the COPY half of P1-10 and not its fix… the tier is inverted… Correcting that is a
monetisation change and 🎯's call."* That is the correct scope discipline (the charter forbids
automatic structural fixes), **but it means P1-10 as filed is still open.** I confirmed it is open in
the code, not merely deferred on paper: the split at `:56-57` is still `isPremium && validAmount`, so
free still does the work and premium still only reports it.

⚠️ **And the new copy makes the inversion louder, not quieter.** *"Your $500 is already in the plan.
Premium itemizes where it lands"* is a plain-language statement of *"free does the work, premium tells
you"* — printed on the paywall surface itself. That is the honest choice and I would not change it,
but whoever takes the structural call at P6.10 should know the app now **advertises** the weak gate to
the exact user who would notice.

**Why UNPINNED, and what is missing.** ⛔ **`windfall.spec.ts` covers premium only.** Its two tests
(`:27`, `:43`) seed a default (premium) scenario and assert the premium eyebrow at `:34` and `:48`;
`windfallSplit.test.ts:24` also hard-sets `subscriptionPlan: 'premium'`. Grep for
`"already in the plan"` across `apps/` and `packages/` returns **one hit — the source line itself**.
So the free branch this finding is entirely about has **zero coverage**, in two ways that matter:
1. nothing asserts the invite renders or what it says;
2. ⚡ **nothing asserts the fact the copy depends on** — that a *free* user's windfall reaches
   `paycheckAmount`. If `selectors.ts:54` ever gained a tier gate, `WindfallSheet.tsx:131` becomes a
   **false statement about the user's money** and every existing test stays green.
That second one is the pin worth adding, and it is an app-layer assertion, not an e2e: run
`selectPaycheckAllocation` on a `subscriptionPlan: 'free'` store with `windfall: 500` and assert the
allocated total moved by 500.

---
## L1-22 — straight and curly apostrophes are mixed — **PARTIAL**

**The finding.** `docs/audits/2026-08-17-v1.7-audit-gate/findings/L1-voice.md:182-189`, severity
**minor**. Its suggested fix, verbatim: *"Normalise to typographic apostrophes **app-wide** and add a
lint rule."* This is a **sweep**, so the question is whether the **class** is closed, not whether the
listed sites were.

**Q1 — the named sites.** Closed. Spot-checked three of the six the finding cites, at their current
lines rather than the filed ones:
- `AddObligationSheet.tsx:37` — `"Something with a balance you’re paying down. It ends."` ✅ curly
- `AddObligationSheet.tsx:81` — `subtitle="It’ll go in the right place."` ✅ curly
- `GuardianScorecard.tsx:47-49` — `I’ve … I’m … I’ll … I’ve` ✅ all curly
(`BackupSheets`'s *"That doesn't look like a valid backup"* no longer exists in any form.)

**Q1b — the gated class.** Closed and made absolute. `scripts/apostrophe-baseline.json` is `[]`, and
`npm run lint:apostrophes` reports **`no new straight-apostrophe copy (0 baselined)`** — note **no
"stale" suffix**, which per `check-apostrophes.ts:197-199` means the baseline still describes the
tree exactly. The gate went from *"don't grow past 94"* to *"none, ever"*, which is the right shape.

⭐ **And the blindness W1-1 found is genuinely repaired, which I checked at the mechanism rather than
the claim.** `check-apostrophes.ts:60-63` decodes `&apos;`/`&#39;`/`&#x27;` → `'` and
`&rsquo;`/`&#8217;` → `’` **before** testing, and `:96-98` applies the decode only to the nodes JSX
actually decodes (JsxText, and a string literal in a JSX **attribute**). That is the correct rule —
decode to what Babel renders, then test — rather than special-casing entity spellings. Grep confirms
**zero `&apos;` remain** in `apps/rn/src`.

**Q2 — what else did a 95-node sweep across 35 files risk, and does it still work?** The named hazard
is that a changed string breaks a pin. I ran the oracles rather than reading the pin list:
- `npm run test:regression` — **ALL PASSED** (this is the suite that caught the missed 18th pin in
  `packages/core/guardian/testBuildGuardianBrief.ts`; I confirmed that file is genuinely reached —
  `packages/core/testing/runRegressionTests.ts:23` imports it).
- `npm run test:app` — **ALL PASSED**, including `✅ funnel seam` and `✅ Glossary (T4.5)`.
- `npm run test:scenarios` — **ALL PASSED**.
- `npm run lint:glossary` ✅ · `lint:copy` ✅ · `lint:money` ✅ · `lint:selectors` ✅
  (*"14 flows · 118 testIDs known · no stale ids or **copy**"* — this is the one that would catch a
  Maestro flow left pinning a swept string; I also grepped the 14 flows directly and **no `tapOn` /
  `assertVisible` pins any apostrophe-bearing copy**, so that surface was never exposed).
- `windfall.spec.ts:34,48` pin `HERE’S HOW THE APP WILL ROUTE` with the **curly** form — a swept pin —
  and the Playwright suite is the one oracle the b.4 log flagged as unverified. **Ran it: green** (see
  the run note at the end of this file).
- `git status` is clean for `apps/rn/src` and `packages/core`, so no line-ending residue from the
  `sed` incident survived into the tree.

**Q3 — was the remedy right, and is the CLASS closed?** ⛔ **The class is not closed — the gate's
roots are narrower than the finding's "app-wide", and there is live user-facing copy outside them.**
`check-apostrophes.ts:35` sets `ROOTS = [packages/core, apps/rn/src]` and `:74` accepts only
`.ts`/`.tsx`. Everything else ships unchecked. Measured, not assumed:

| site | string | surface |
|---|---|---|
| `apps/rn/plugins/app-intents-swift/SiriQueryIntents.swift:44` | *"You**'**re debt-free — nicely done."* | Siri dialog |
| `…SiriQueryIntents.swift:46` | *"You**'**re on track to be debt-free by …"* | Siri dialog |
| `…SiriQueryIntents.swift:60` | *"You don**'**t have any debts in Debt Planner yet."* | Siri dialog |
| `…SiriQueryIntents.swift:70` | *"Hear the Payday Guardian**'**s read for this paycheck."* | Shortcuts app |
| `…SiriQueryIntents.swift:108` | *"What**'**s my debt-free date in …"* | Siri phrase list |
| `apps/rn/plugins/app-intents-swift/LogPaymentIntent.swift:82` | *"That amount doesn**'**t look right — try again."* | Siri dialog |
| `apps/rn/modules/scan-vision/ios/ScanVisionModule.swift:28` | *"Document scanning isn**'**t supported on this device."* | rejected promise |

⚡ **`grep -c '’'` across every Swift file in `apps/rn/targets`, `apps/rn/plugins` and
`apps/rn/modules` returns 0.** So the app's TS copy is now **100% curly** and its shipped Swift copy
is **100% straight** — which is L1-22's exact defect (*"the same contraction typeset two ways"*),
relocated rather than removed. `plugins/with-app-intents.js` is what installs those files into the
build, so they are not dead source. The last row is the weakest of the seven: `lib/scan.ts:12-15` has
no `catch`, so that rejection probably never renders — the six Siri/Shortcuts strings are the real
ones, and Apple displays and **speaks** them.

⚠️ **Two lesser scope notes, both defensible but neither recorded as a decision:**
- The legacy Next tree at the repo root (`app/`, `components/`) has **18 files** with straight
  contractions. `check-apostrophes.ts:34` names this and defers it to P6.11's deletion — reasonable,
  but it means the gate is green over a tree that is only partly swept.
- `docs/release-notes/app-store-listing.md` — including the **2.0 description written at b.6, the
  same cluster as this sweep** (`:136-186`) — is entirely straight (28 occurrences). Outside the
  app, and A1's territory rather than L1-22's, but it is the surface the finding's *"visible in App
  Store screenshots"* rationale is about, and the sweep and the draft were authored hours apart.

**Verdict PARTIAL.** Every listed site is fixed, the entity blindness is properly repaired, the pins
moved with the copy and the suites prove it, and the gate is genuinely absolute **within its roots**.
But the finding asked for *app-wide*, and **7 user-facing straight apostrophes ship in Swift that no
gate can see** — the class is closed for TypeScript and open for everything else. ⚠️ Closing it is
not "sweep 7 strings": it is **extending `ROOTS`/extensions to the Swift copy surface**, or the same
drift reappears the next time an App Intent is added.

---
## Addendum — evidence for the M1-8 downgrade

The QA-checklist contradiction is not a stale side document. `DEBT_3.5_DEVICE_QA_CHECKLIST.md:14`:
> 🎯 **THIS FILE IS THE ONE PLACE A DEVICE PASS IS RUN FROM (3.5.6.3, 2026-08-10).**

and `docs/DEBT_ELEVATION_PLAN.md:91` routes **P6.14 — FINAL DEVICE PASS** to it, calling it
*"the runnable truth"* where it and the plan disagree. So the ticked instruction at
`DEBT_3.5_DEVICE_QA_CHECKLIST.md:575` — *"confirming the control exists and sticks"* — is what a human
will be handed at P6.14, for a control that was deliberately deleted at P6.8.7b. **That is the fix
creating a false instruction in the document the release depends on**, which is why M1-8 is PARTIAL
rather than CLOSED-UNPINNED.

## Gates and suites I ran myself (this tree, `v1.7-dev`)

| command | result |
|---|---|
| `npm run lint:apostrophes` | ✅ `no new straight-apostrophe copy (0 baselined)` — **no stale suffix** |
| `npm run lint:glossary` | ✅ `no retired words in copy (6 banned)` |
| `npm run lint:copy` | ✅ `no new cross-file phrases (16 baselined)` |
| `npm run lint:contrast` | ✅ `every rendered token pair clears its floor` |
| `npm run lint:type-scale` | ✅ 19 checked |
| `npm run lint:icon-glyphs` | ✅ 43 in use · 26 SF-mapped |
| `npm run lint:selectors` | ✅ `14 flows · 118 testIDs known · no stale ids or copy` |
| `npm run typecheck:rn` | ✅ clean |
| `npm run test:regression` | ✅ ALL PASSED |
| `npm run test:app` | ✅ ALL PASSED (incl. `✅ funnel seam: 5 assertions`) |
| `npm run test:scenarios` | ✅ ALL PASSED |
| `npx playwright test … analytics-optout earlyjourney` | ✅ **6 passed** |

⛔ **`npm run lint:gate-freshness` is RED on this tree** — *"SOURCE HAS CHANGED since the gate last
passed… recorded: 7c1d586 · 2026-08-24T14:58:25Z"*. `git status` shows
`apps/rn/tests/shots/p6.8-matrix.shot.ts` modified and a `.verify-tmp/` directory, i.e. **another
P6.8.9 verifier is working in this tree concurrently.** So `gate-status.json`'s recorded green does
not describe what I read, and every result above is one I ran myself rather than one I inherited.

## L1-22 addendum — the 12 Playwright pin edits, verified statically

The b.4 log left one thing open: *"Unverified until P6.8.8: the 12 Playwright pin edits need a
browser."* I checked it two ways.

**Static, and exhaustive.** Across `apps/rn/tests/e2e/*.ts` and `apps/rn/tests/shots/*.ts` there are
**17 locator lines carrying an apostrophe, and every one is curly**; the only straight apostrophe on
any `getBy*` line is inside a trailing `//` comment (`tutorial-invite.spec.ts:566`). Each distinct
pinned phrase resolves to live non-test source in the same form:

| pin | non-test source hits |
|---|---|
| `you’d still hold` (`affordability.spec.ts:24,49,50`) | 1 |
| `We couldn’t open your saved plan` (`data-recovery.spec.ts:64`) | 1 |
| `This paycheck won’t cover everything` (`guardian.spec.ts:45`, `recovery.spec.ts:28,42,49`) | 2 |
| `A paycheck didn’t land` (`guardian.spec.ts:98`) | 1 |
| `Let’s refresh your numbers` (`guardian.spec.ts:104`) | 1 |
| `won’t cover everything` (`tutorial-invite.spec.ts:225,260,272,275,521`) | 2 |
| `HERE’S HOW THE APP WILL ROUTE` (`windfall.spec.ts:34,48`) | 1 — `WindfallSheet.tsx:102` |

**So no pin was left behind by the sweep**, and this holds regardless of whether a browser ever runs.
✅ Confirmed live for two of them by execution (`analytics-optout` + `earlyjourney`, 6 passed); the
full `test:e2e:rn` run was also started and its result is noted below if it landed before this file
was handed back.

⚡ **Execution confirmation for the swept pin that mattered most.** `windfall.spec.ts:48` asserts
`HERE’S HOW THE APP WILL ROUTE` and `:50` writes the screenshot **after** it — so the screenshot
existing is proof the curly pin matched a live render. Both files are on disk from the run started
during this verification: `test-results/windfall-dark.png` and `test-results/windfall-light.png`,
2026-08-24 12:12. `apps/rn/test-results/.last-run.json` reads `{"status":"passed","failedTests":[]}`.

⚠️ **Caveat on that last line:** `.last-run.json` is overwritten by whichever run finished most
recently, and a full `test:e2e:rn` was still executing when this file was handed back — so treat the
`windfall-*.png` timestamps (12:12, written only after the curly assertion at `windfall.spec.ts:48`
passed) as the load-bearing evidence, not the status file.

## ✅ Full `test:e2e:rn` — completed during this verification

**`250 passed (11.8m)`**, exit code 0, zero failures. Run from this working tree at 2026-08-24, after
the gate-freshness check had already gone red — so this is a result I produced against the tree I
read, not one carried forward from `gate-status.json`. This retires b.4's open note (*"the 12
Playwright pin edits need a browser"*) and supersedes the `.last-run.json` caveat above: every swept
pin was executed and matched.
