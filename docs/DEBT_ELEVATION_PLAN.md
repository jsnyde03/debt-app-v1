# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — **3.8, the expense reserve**

| | |
|---|---|
| **Where v1.7 is** | Phases 0–3 · **3.5** · **3.7** · **4** all ✅. Remaining: **3.8** → the audit gate → **Phase 5** 🔒 → 5.5 → **Phase 6** |
| **Gate** | `validate:release:rn` — **179 e2e · 10 embed · 10 `test:stamp` · 83 lane checks**, tsc + lint clean, zero `error-context.md`. CI runs it on every push |
| **Device pass** | **52 rows** + the 60 coverable-not-built, all Phase 6, human-ticked, non-gating. ⚠️ Read the figures from [`audits/coverage-split.md`](audits/coverage-split.md), **never from a doc quoting them** — that has gone stale three times |
| **The embed** | live — https://jsnyde03.github.io/debt-app-v1/ |
| **Env** | `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` · e2e `npm run test:e2e:rn` · live embed `EMBED_LIVE_URL=… npm run test:e2e:embed` |

⚠️ **Read the SESSION CLOSE 2026-08-17 (night) log entry before building** — it carries what NOT to build
on, and its closing block points at the **three entries after it that change 3.8**.

### ▶ 3.8 — the expense reserve _(active, and the only decomposed item on this doc)_

🎯 **IN v1.7** *(2026-08-17: "3.8 is definitely in 1.7")*. ⛔ **The app coaches a habit it cannot record and
then plans as if you had not followed it.** The Expenses hero **smooths the WHOLE recurring load** — rent,
utilities, subscriptions, every one of them — into a per-paycheck figure and calls it *"reserved"*, while
`allocatePaycheck` funds **each expense in full in the cycle it actually falls**. So the smoothing is
advice the plan never takes. Found by 🎯 *using* the app; no coverage split models *"the app does the wrong
thing correctly."*

⚠️ **Rent is an EXAMPLE, not the case** *(🎯 2026-08-17)*. The pot is *"for expenses"* — one aggregate
across the whole section. Any wording, test or invariant phrased around a single bill is describing a
special case of a general defect, and will be wrong the first time two expenses fall in one cycle.

| # | Step | State |
|---|---|---|
| **.1** | **The pot, in the store** — ONE aggregate number, not per-bill envelopes. Keeps Phase 5's migration to *absent ⇒ today's behaviour* | |
| **.2** | **The draw-down in `allocatePaycheck`** — the pot is consumed by **whatever falls due**, across all categories. ⛔ **The invariant is the hard part**: money set aside in cycle 1 must be *gone* from cycle 1's spendable **and** reduce the cycle-2 demand. Honour only the second and the model invents money | |
| **.3** | **The recommended action**, never required. ⛔ **Offer only what this paycheck can spare** — promising $175 and reserving less is the capped-outcome shape [A3.6] exists for | |
| **.4** | **Re-point the Expenses hero at the REAL reserve** *(🎯 2026-08-17, replacing "remove it")* — `money.tsx:653–672` keeps saying *"reserved"*, and 3.8 is what makes the word true. ⛔ **It must read the POT, not `perPaycheckTotal`** | |
| **.5** | **The Guardian bar + the tap** — the set-aside joins the everyday segment; tapping splits living-expenses vs expenses. ⚠️ **[DECISION] the segment's new name** is 🎯's | |
| **.6** | **Coverage** — engine tests for the draw-down and conservation; e2e for the tick and the tap. ⚠️ The reserve must NOT land in the `safetyNet` windfall bucket unexamined | |

⚡ **[.4 — 🎯 2026-08-17, reversing "it must be removed"] THE NUMBER IS NOT THE LIE; THE VERB IS.**
`$350/month ÷ 2 paychecks = $175` is correct arithmetic. What the app cannot back is **"reserved"** —
nothing reserves it. **3.8 makes the word true**, so the hero survives and changes *source*:

| | today | after 3.8 |
|---|---|---|
| shows | `perPaycheckTotal` — the **recommendation**, always | the **pot** — what was actually set aside |
| range | always `$175` | `$0 … $175` |

⛔ **Which is why it moved from first to fourth.** A hero that reads the pot cannot precede the pot. And
reading `perPaycheckTotal` after 3.8 would still lie to everyone who ignored the nudge or reserved less —
*backable* and still wrong. ⚠️ One edit to that block instead of two; the intermediate state never ships
because v1.7 ships as ONE release. **If 3.8 is ever cut back mid-flight, strip the claim first.**

⭐ **[.2 before-scan] THE DRAW-DOWN ORDER IS ALREADY DECIDED — do not invent one.** `allocatePaycheck`
builds `upcomingExpenses` from **every** expense due before the next paycheck, expands weekly/biweekly ones
into **separate occurrences with distinct ids**, and **sorts by due date** (`:224–244`). The pot draws down
in that same order, against **occurrences, not expenses** — a fortnightly bill is two draws, and
`isPaidThisCycle` is already keyed per occurrence for exactly this reason. ⚠️ Reusing the engine's existing
sort is what keeps the reserve and the funding from disagreeing about which bill got paid.

⛔ **[before-scan] AND THE ROW'S OWN PREMISE WAS WRONG — it is NOT "read by nothing".** Three readers:
`perPaycheckTotal` → `breakdownData` → **`BillBreakdownSheet`**, which prints it again as its headline ·
`categoryBreakdown[].perPaycheck` → `barTotal` → `segments` → **the `AllocationBar` inside the hero** ·
per-bill `perPaycheck` → **every row of the breakdown sheet**. The accurate statement is **nothing in the
ENGINE reads it** — it never becomes a plan input. A naive removal would have taken the bar and the receipt
sheet with it.

**Exit:** the number the app shows is the number the app honours, and a user who acts on it sees the plan
change. **Open:** the segment's name (.5), and whether the tap is a sheet or an inline expand.

⚡ **It also closes 🎯's SECOND report for free** — *"living expenses are hidden in More"*. Two doors exist
(More's settings row **and** a `LivingReserve` card on Money), so the report is not literally right and the
code is **worse** than it: ⛔ **the Money card is gated on `livingTotal > 0`**, so it appears only to users
who already found the feature. The Guardian tap is the unconditional door.
⚠️ **Independent of 3.8 and cheap: drop that gate, or give the card an empty state.**

⚡ **The engine already supports the hold** — `prefundedReserve` is an existing `allocatePaycheck` input.
The new part is a **persisted pot and its draw-down**, not a new capability. Full detail → log 2026-08-17.

---

## ⏸ Waiting on Jason

- **[D2]** `minimumPaidThisCycle` ownership — gates B4 · **[D3]** Money hero language — ⚡ **cheaper decided
  with 3.8**, which touches that hero · **[D1]** Control Center *(rec: stay deferred)*.
- **3.8's segment name** (.5 above) — the everyday segment stops being only "everyday".

## 🎯 Reported from the app — found by USING it, not by the lane

| | Report | State |
|---|---|---|
| **R1** | Money's edit sheets had no date **picker** | ✅ **DONE.** `DateField` at all 4 sites. ⛔ Folded in: `todayLocalISO()` returned **yesterday** east of UTC. The fields had **zero** coverage before, which is why it shipped |
| **R2** | The expense set-aside is uncoachable · living expenses undiscoverable | ▶ **= 3.8.** Both are the same fix |

⚡ **Neither was reachable by 4.1.** The lane checks that built behaviour keeps working; these are *design*
gaps. **No coverage split models "the app does the wrong thing correctly"** — the device pass is the only
instrument that finds them.

---

## ⚠️ Open threads — each has an owner

**Product defects, live:**
- ⛔ **The `trajectory-scrub` coach mark SURVIVES a route push** — reproduced on web 2026-08-13
  (`probe-mark-route-push.spec.ts`, a `test.fail()` that reds the day it is fixed). **Cross-platform, not an
  iPad artifact:** every user who opens More while a mark is up sees a hint about the Progress chart over
  their settings. ⚠️ **Mechanism NOT diagnosed** — `CoachMarkLayer` is where five were asserted and four
  refuted. → **the audit gate**, or sooner.
  - ⚠️ On the expanded iPad that mark is drawn in **window space**, so it lies across the sidebar rail while
    its subject sits in the content column — §11.15's coordinate-space failure in a component 4.1.5.2's
    audit does not cover.
  - ⚠️ **An undrawable mark stays `active` and blocks every other mark for the session.** Pre-existing; the
    only known cause was removed.
  - ⚠️ **`SectionList`'s `index` is per-SECTION, so `debt-row-actions` can register TWICE** (`money.tsx:377`
    — `index === 0` is also the first PAID OFF row). **Latent**; one-line scope: gate on the active section.
- ⚠️ **A transient `$790` on Today's arrival** during the demo — a half-rendered Guardian card for ~0.5s at
  beat 2. User-facing under [D21]. Settle before the App-Preview asset is cut.
- ⚡ **A pref changed then force-quit within 500 ms is LOST** (`persistence.ts:14` debounces; `flushPendingSave`
  fires only on AppState *background*). Silent data loss on a setting the user watched confirm itself.
  **Measured, not theorised.** → **Phase 5**, which owns durability.

**a11y, owed to the premium sub-audit:**
- ⭐ **`hitRegion` = 2 real findings, on BOTH tiers** — two hit targets below the minimum, reproducible.
  Now *characterised* (`"Hit area is too small"`) and still *unlocated*: `compactDescription` does not name
  the element. The probe compiles, so `issue.element` can be added at low risk — ⛔ **not worth a dedicated
  ~50-min dispatch; the nightly answers it for free.**
- ⚠️ **§12.6.1's arrival announcement may not exist anywhere.** The row expects *"Example money. This is a
  demonstration with sample figures."*; `ExampleCanvasMarker` carries only `accessibilityRole="header"` and
  its text. Not a regression — that sentence was never in either component. → **the wording gate**, with
  [D6]'s "exactly one place" rule.

**Lane residuals — Phase 6 as known issues, none gating:**
- ⛔ **The iOS driver stall has happened TWICE and its retry does not clear it** — zero flows after paying a
  full build, indistinguishable from a real red in exit code and cost. **Check for that warning line before
  diagnosing any iPhone-tier failure.**
- ⚠️ The boot poll that replaced `sleep 25` **does not fire** · the XCUITest probe went **1 min → 11 min** on
  iPhone (suspect: `descendants(matching: .any).count` ×3) · the `tutorial-invite` intermittent has now red
  **twice** (both times the session had ENDED when the test expected it running).
- ⚠️ **Two of the 15 flow files MEASURE rather than cover** (`i01-ipad-boot`, `11-reduce-motion`) — any
  re-derivation that counts files overstates itself. **§12.0.7 is unclaimed** (the demo persona's Money-tab
  debt names were never established).
- ⚠️ **The Reduce-Motion probe's answer lives only in a PNG** — Maestro dumps a hierarchy on FAILURE only,
  so a passing flow captures no value. *A probe whose result a human must look at cannot gate anything.*
- ⚠️ **~5 more `toISOString().slice(0,10)` sites are the same off-by-one**, including
  `packages/core/payCycle/getNextPaycheckDate` — **the engine**. A wrong next-paycheck date shifts the whole
  plan. Filed, not swept.

**Pages, both → Phase 6:**
- ⚠️ **The deploy allow-list must flip at launch** — build from `release/v1`, drop `v1.7-dev`, or a dev
  branch can publish to a public marketing URL indefinitely.
- ⚠️ **Nothing checks that a deployed SHA is green.** The deploy is `workflow_dispatch`-only *deliberately*
  (a `push:` trigger would publish ungated states), but *"deployed"* and *"passed the gate"* are held
  together by discipline. The artifact assertion catches a blank site, not a regression that builds.

---

## Phases — status

| Phase | Scope | Status |
|---|---|---|
| 0–3 | Design foundation · surface · premium substance · delight + native | ✅ COMPLETE |
| 3.5 | Interactive tutorial + bounded demo + the marketing embed | ✅ **COMPLETE 2026-08-17** — embed live, verified against the deployed page; device pass folded into Phase 6 at [D35] |
| 3.7 | Fold-in block (ledger clearance) | ✅ COMPLETE 2026-08-11 (Waves A + B; C merged into the audit gate) |
| **4** | **Quality (test harness)** | ✅ **COMPLETE 2026-08-17** on a green `32051842661`. ⭐ **26 proven · device pass 52 · derived, not asserted.** CodeMagic build cut |
| **3.8** | **The expense reserve** | ▶ **ACTIVE** |
| — | Whole-app cohesion + best-in-class + wording audit gate | next |
| 5 | Data continuity + cutover | 🔒 ship-blocker |
| 5.5 | Repo consolidation | before the release gate |
| 6 | Launch-ready **+ the 60 coverable-not-built rows and 3.5's folded-in pass, as DEVICE-PASS work** | final |

⚡ **Phase 3.7's number, worth keeping:** a pre-authored ledger item is wrong about as often as it is right
— Wave A, of 14 items, **5 did not exist and 4 more were materially misdescribed** (one *inverted*); Wave B,
of 4, **1 refuted, 1 half-shipped, 1 wrong in 3 of its 4 premises, 1 clean.** The before-scan pays for itself.

### ⚠️ Standing constraints

- **⛔ BATCH THE NATIVE LANE** — `workflow_dispatch` + tags + the **07:00 UTC nightly**, and it stays that
  way. 🎯 2026-08-13: *"we just need to not kick off the manual Maestro build every time."* Measured that
  day: ~12 dispatches for about three runs' worth of distinct information. Run it at a human-chosen batch
  boundary: the end of a numbered item, or a change only it can verify. ⚠️ **Iterate with `-f device=ipad`**
  — skips the ~10-min iPhone suite; flow-only edits hit the `.app` cache, any `src/**` change busts it.
- ⚠️ **A VERDICT IS A CLAIM ABOUT WHAT IS POSSIBLE, and this lane has been wrong about that repeatedly** —
  the ⌘-key correction, `~/.maestro`'s 1m29s that was 22s, "no hierarchy dump", ccache's two wrong
  mechanisms. **A `[D]` that is really an unproven `[M]` keeps a check on the manual pass forever**, and
  re-verdicting on expectation is the overstatement 4.1.9c exists to stop. Seeded verdicts are a
  **hypothesis per row**.
- ✅ **STANDING PERMISSION, 4.1 ONLY** *(🎯 2026-08-14 — spent; 4.1 is closed)*. Everything else — Phase 5,
  5.5, 6, the audit gate, and **any product/content call** — comes to Jason.
- **`QA_TOOLS = true` ships in TestFlight and MUST be flipped false before submission** (`git grep QA_TOOLS`).
  ⚠️ The **instruments** are `qaEnabled()`-gated — `probeCoachMark`, the `coach-probe` readout,
  `suppressorReasons`, `RING_AUDIT`, `rm-probe` — so the flip's `git grep` must confirm they vanish **and**
  nothing depends on them. ⛔ **Never let a coverage row ride a QA door** — the general rule 4.1.10 bought.
- **Never push to `release/v1`** without 🎯 — it is the default branch and gated on a live, approved version.
  *(Lifted once, 2026-08-17, for two CI-only single-file commits.)*
- **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT · `react-native-ios-utilities ^5.2.0`.
- **v1.7 ships as ONE release.** Nothing launches until Phase 6 is done and Jason is satisfied.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

---

## Audit gate — whole-app _(next, before Phase 5)_

**Instruments it runs ON** *([D31] — a finding that becomes a test is paid for once)*, all ✅ 2026-08-12/14:
`audit:strings` → the wording gate's input · `lint:copy` (the first finding to become a **gate**) · the
proxy-gate sweep (**77 of 179** gates carry copy) · `audit:surfaces` → the cohesion gate's input ·
`lint:a11y-collapse`, which **found a shipped defect on its first run**. W1 + W2 closed the triage and the
classification pass. Detail → log.

**Wave C's coherence sweeps land here:** C1 cents-formatter · C2 gold usage · C3 Money hero language [D3] ·
C4 paywall copy · C5 chart VO labels · C6 iPad More two-column · C7 dead code (`ProgressRing`/`MilestonesRow`,
orphaned `guardianIntroSeen`, `FormSheet.headerAction`) · C8 web scan entry · C9 `router.back()` cold-entry
sweep · C10 doc disambiguation of the overloaded "3.5.3.x".

- [ ] **Cohesion** — the same adversarial rigor for the ENTIRE app, criterion: does every element work
  TOGETHER? Cross-surface voice · visual · motion · numbers.
  - ⚠️ **`selectWhatIf*` bypasses the debt-free-date funnel** — correct today, and a trap: **if the funnel
    ever gains a guard, a floor or a rounding rule, What-If silently will not have it.**
- [ ] **Best-in-class enhancement pass** — is each surface genuinely top-of-class, and what makes it
  unforgettable? Benchmark vs category leaders; restraint, not fireworks.
  - ⚠️ **The onboarding debt step hides its own fields behind the keyboard** — balance / minimum / APR
    clipped by the sticky CTA stack on a small screen, on the app's **first data-entry screen**.
  - ⚠️ **[D33 residual]** beat 5's landscape crop splits *"$200 · Your line"* from the bar it labels. §11.16
    PASSES; this is polish. ⛔ The "nudge the scroll offset" fix was **refuted** — `TutorialOverlay` measures
    and never scrolls.
- [ ] **Wording / voice** — every user-facing string, both tiers, all states. Absorbs Wave C's copy items.
  - ⚠️ **Guardian first-person voice is UNCLASSIFIED, so this gate's own input cannot see it** — the house
    rule is exactly what is checked here.
  - ⚠️ **`EXAMPLE_MONEY` is an exported constant and THREE sites bypass it.** All four agree today; the
    clean fix is a layering change, not cheap polish.
  - ⚠️ The **mis-file rescue's** strings and the **greeting's** strings are placeholders, not house voice
    *(per [D26])* · `paywall.tsx`'s `"one time"` · [D22d]'s "bills" vernacular.
  - ⚠️ **Sweep every Guardian affordance for a PROXY gate** — an affordance promising an **outcome** gated on
    something that merely correlates (`selectReserveRelease` · `selectReserveWalkback` ·
    `selectRiskAcknowledgment` · `selectTrialConversion` · `selectGuardianProofOfWork`).
  - ⚡ **…and for a CAPPED OUTCOME** — the gate is right but the resource is bounded, so the affordance
    delivers less than it promised. **Any copy asserting a completed outcome over a `Math.min`'d value.**
  - ⚡ **"Two places, one rule" hit THREE times in one wave** — sweep for a rule re-derived at each call site
    rather than owned once. **Agreeing copies are still copies; they just haven't diverged yet.**
  - ⚠️ **A STALE COMMENT GENERATED FALSE WORK** — a header describing the opposite of its own assertions
    produced an inverted defect. **Docs that disagree with adjacent code manufacture defects.**

⚡ **Three defect classes to hunt at scale** *(from 3.5's phase after-scan)*: ① an assertion that passes
either way ② evidence cited but never committed ③ two records of one thing, drifting. All three are
**a claim kept somewhere other than where it is checked.**

---

## Phase 5 — Data continuity + cutover 🔒 ship-blocker

The migration bridge (WKWebView `localStorage` → RN storage), **proven on a real populated upgraded
device**, then cutover to the RN app as the shipping app.
- **⭐ [AUDIT GATE] Adversarial migration/upgrade audit — the EXIT gate, no cutover until green.** Every
  prior data shape: v1–v6 schemas · partial/corrupt/empty/huge portfolios · malformed dates & numbers ·
  mid-migration interruption. Upgrade data-loss is catastrophic AND irreversible.
- **⭐ E2EE iCloud backup** — NOT premium-gated ("never lose your data" is a baseline). ✅ Proven template:
  Freedom v1's `cloudBackup.ts`. ⚠️ Also **replace the paste-JSON import** with a real file picker.
- **⚠️ Run the mis-filed-obligation detector over MIGRATED data.** v1.6 offered **"Credit Card Payment"** and
  **"Loan Payment"** as one-tap BILL presets, so upgrading users arrive with debts filed as expenses — and
  their debt-free date silently omits them. `looksLikeDebt()` + `convertExpenseToDebt()` exist; the bridge
  has to *use* them. **This is the largest affected population in the app.**
- **Flush critical prefs immediately** rather than on the 500 ms debounce (see Open threads).
- **Drop two INERT persisted prefs with the migration** — `prefs.isDemoMode` and `prefs.guardianIntroSeen`.

## Phase 5.5 — Repo consolidation

- **5.5.1** remove the root Capacitor/Next surface. Also retires `validate:release:legacy`, the root Next
  lint, the legacy `debtPlanner.isDemoMode` test references, and `tests/visual/*.cjs`.
- **5.5.2 [DECISION]** final repo structure — promote `apps/rn` to root vs keep the monorepo *(rec: keep it;
  `packages/core` is shared portfolio-wide)*.
- **5.5.3** tooling / CI / docs to the consolidated tree. Includes **splitting `DEBT_ELEVATION_LOG.md`**
  (>11k lines, well past one-pass readability).
- ✅ **5.5.4 DONE EARLY** — `apps/rn` has its own `eslint-config-expo`.
- ⚠️ Verify scope against the CURRENT tree at switch-in — pre-authored cleanup drifts.

## Phase 6 — Launch-ready

Acquisition-grade store presence · cold-start excellence · the device-QA gate · submit.

- **⭐ [AUDIT GATE] Pre-Release Best-in-Class FINISH sweep — runs FIRST, on the FROZEN app.** Every screen ·
  sheet · card · state · both themes · iPhone/iPad/Split-View · Dynamic Type. Complements, not replaces,
  the audit gate above.
- **⭐ [AUDIT GATE] Privacy / data-flow audit** — trace EVERY egress and prove "financial data never leaves
  your device" is literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs.
- **⭐ [AUDIT GATE] Pre-submit functional + FINANCIAL-correctness money lens** — boundary inputs across the
  engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle
  stepping · cross-cadence BNPL · huge/partial portfolios.
- **⚠️ SHIP-BLOCKER · flip `QA_TOOLS` to false** (see Standing constraints).
- **Sentry** — scaffold done; set `EXPO_PUBLIC_SENTRY_DSN`, CI source-map care, verify capture on a real
  build, add a `beforeBreadcrumb` PII scrub.
- **The two Pages threads** — flip the deploy allow-list to `release/v1`; decide whether a deploy must
  require a green gate on its SHA (see Open threads).
- **App-Preview asset** — re-shoot off the proven pipeline once the UI is frozen. ONE 886×1920 file, 15–30s.
- **AU/NZ availability + E2EE trust-claim verification** · **App Review paywall-findability** (v1.1 was
  rejected repeatedly — the ASC notes MUST say "Tap ••• More → Unlock Premium").
- **Owed off-device (Jason):** ASC privacy label declares RevenueCat · marketing "100% private" alignment ·
  the launch-FLIP value gate.
- **📋 Real-device cloud testing — as DEVICE-MATRIX coverage, not a way to shrink the manual pass.** ⛔ It
  moves only **3–6** of the `[D]` rows. ⭐ The real gap it closes is that everything runs on **ONE sim
  config** — §11.1 says outright *"a wide phone can pass while an SE fails"*. ⚡ Maestro Cloud is the
  zero-rewrite path. **Triggers:** Android at v1.8, or the first width-driven bug that reaches a user.

**📋 Device-QA ledger — verify on real hardware; web cannot cover these:**
- **🎯 The runnable truth is [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md)** — §11 ·
  §12 · §13, plus the 60 coverable-not-built rows and 3.5's folded-in pass ([D35]). This is the index.
  Highest value: **§11.15**, the iPad ring-origin invariant.
- ⛔ **Five rows stay `[D]` for stated reasons, and they are forward guidance.** **§5.4 StandBy is
  PERMANENT** — *"put the phone on a charger"* is physical state a simulator has no concept of. **§5.1**
  (widget gallery) · **§5.3** (Lock-Screen Customize) · **§6a.2** (Island long-press, needs a 15/16 Pro sim)
  · **§10.3** (Stage Manager drag) each need their own probe first. ⚠️ The three `[A]` ⌘-key rows stay `[A]`.
- **⚠️ A0.4** (payoff-schedule device re-verify) and **A8.4** (the Siri phrases, incl. the load-bearing
  `\(.applicationName)` check) are device-owed.
- **⭐ [SUB-AUDIT] Premium-accessibility:** VoiceOver rotor + a full walk · Dynamic Type AX3/AX5 reflow ·
  reduce-motion · contrast both themes · focus order · touch targets. **WCAG 2.2 AA is the FLOOR.**
  - ⛔ **BOTH GUARDS COVER 2 OF THE 4 NATIVE-ONLY PROPS, AND THE MISSING TWO KEEP BITING.** eslint and
    `check-native-a11y-props.ts` ban `accessibilityElementsHidden|importantForAccessibility` but **not**
    `accessibilityValue` or `accessibilityState` — yet react-native-web drops all four identically. ⚡ **The
    guard written for one instance of the class does not cover the class.** ▶ Extend both; `accessibilityState`
    appears in **11 files**, so the conversion is this sub-audit's work.
  - ⚠️ **`CheckCircle` reports no checked state on WEB** · **`ListRow`'s swipe-to-delete announces a hidden
    Delete button on EVERY row** (a destructive control the user cannot see, once per row).
- **⭐ [SUB-AUDIT] Performance-feel:** 120fps ProMotion · Skia redraw cost · cold-start TTI · list jank ·
  optimistic-UI feel. Includes the Today/cushion-forecast memoization check.
- **§3.1.2** SF Symbols on the min-iOS target · **§2.8** native scan · **§2.11** RevenueCat real purchases +
  restore · **§3.3.1** the AHAP crescendo FEEL · **§VIS-2/B2** share rasterizes fully · **§3.4** `expo-blur`
  real material · **§3.5** Live Activity / Island / widgets / App Intents · **§3.6** iPad both orientations,
  Split View, Stage Manager, pointer/keyboard · **§VIS-6** sound + notification delivery.

---

## Deferred backlog

_Post-triage under the fold-don't-defer rule — only two carve-outs remain: **device-gated**, or **genuinely
a later version/tier**._

**Tooling / hygiene:**
- ⚠️ **`apps/rn/package-lock.json` is out of sync** — `npm ci` refuses it and all three CI lanes work around
  it with `npm install`, so **installs are not reproducible.** Regenerate deliberately and re-run the full
  gate → before the Phase-5 cutover.
- ⚠️ **Two `maestro test` calls write no JUnit**, so their verdicts never reach the durable record
  (`11-reduce-motion`, the iPad's dark re-run of `i02`). Harmless today — both are measurement runs — and
  the same hazard `maestro-results.mjs`'s header documents for flow `09`: **the next flow added in its own
  invocation disappears silently.** ⚠️ `lint:lane` is where this becomes a check.
- ⚠️ **The embed's public URL names the repo** — `jsnyde03.github.io/debt-app-v1/`. Fine for an iframe; a
  custom domain or a repo rename removes it. **A brand call with a DNS dependency** → 🎯 whenever the
  marketing page exists.
- ⚠️ **The gate still asserts the RETIRED demo-mode contract** — a green test defending a feature the RN app
  no longer has → delete with the Capacitor tree at **5.5.1**. · **TWO screenshot mechanisms** → 5.5.1.
- ⚠️ **Maestro is unpinned** — `get.maestro.mobile.dev` fetches latest, and 4.1.1 spent three cycles
  establishing which commands this build supports. A silent upgrade can retire one. *(Caching `~/.maestro`
  was refuted — 22s, not the filed 1m29s.)*
- **No local pre-flight for the capture path** — a flagged web export + ~40-line check would have caught
  several CI cycles' worth of defects.
- ⛔ **REFUSED WITH MEASUREMENTS, do not resurface:** **ccache** (`0/648 cacheable` twice; both stated
  mechanisms wrong, and modules-off cost 888s vs a 771s baseline — the only remaining avenue is prebuilt pod
  binaries, a dependency-packaging change) · **DerivedData caching** (~70% of the boot step is simulator boot
  + install, which it cannot touch, against multi-GB in a 10GB cap where LRU could evict the `.app` cache
  saving 17 minutes — *the optimisation eating the optimisation*).

**Engine structure:**
- **⚠️ The core bulk paths still write pre-[D2] paid semantics.** `bulkMarkRequired.ts` sets
  `isPaidThisCycle: true` on a debt whose **minimum** was covered. **Inert today** (measured), and pinned by
  a test — but it is a false assertion in **data Phase 5 migrates** → the Phase-6 financial-correctness gate.
- **⚡ `appliedTopUp` is a manual-opt-in invariant.** Cash moved from savings lives only in `store.cycleTopUp`,
  so **every** cushion reader must remember `+ appliedTopUp(store)`. Three readers exist; two had it. **The
  next reader will miss it too.** Structural fix: fold it into the allocation — engine-wide blast radius →
  the Phase-6 financial-correctness gate.

**Device-gated → the Phase-6 pass:** Today/cushion-forecast selector memoization *(conditional on a real
measured hotspot)* · Dynamic-Type device QA.

**Genuinely a later version / tier:**
- **`typicalAmount` still has no UI** → the wording/cohesion gate.
- **The app never shows a debt-free date reflecting its own plan working** — on day one the starter EF
  absorbs the surplus, so every projected date is minimums-only. Honest per screen; the question is the
  app-wide effect → the cohesion audit, **not a defect**.
- **The demo's beat dwell may be too short for the runner** — decide from the 2fps contact sheet.
- **Apple Watch** → v1.8+ · **`@gorhom/bottom-sheet`** → v1.8 Android · **Behavioral mis-entry /
  persistent-cushion / bill-shock autopilot** → Connected/Plaid tier · **Holiday/promo free-trial** → a
  reversible later lever; launch is paywall-from-day-1 · **iOS-18 Control Center** [D1] · **web light-mode
  hover screenshots** *(a QA artifact, not product)*.

---

## Decisions

**Scope + revenue**
- **Re-scope to "The Elevation" ✅ (2026-07-20)** — design-first, best-in-class. **v1.7 ships as ONE release.**
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel.
- **Revenue spine ✅ (2026-07-25)** — Monthly $4.99 · Annual $29.99 · Lifetime $79.99. **NO free trial.**
  Reuses the existing RevenueCat project — v1.6 subs must restore.
- **Phase-3 scope ✅ (2026-07-27)** — pull EVERYTHING into v1.7 unless it genuinely can't ship. Analytics OUT
  of the core (privacy moat); the 3.5 demo re-opened it → a privacy-first funnel seam.
- **Executive "fix everything, no backlog" ✅ (2026-07-29/30)** — fold every audit finding now; only hardware
  verification waits for Phase 6. · **Legacy gate RETIRED ✅ (2026-07-24)**.
- **3.8 is in v1.7 ✅ (2026-08-17)** — 🎯: *"definitely in 1.7."* The app contradicts its own number.

**The demo + the embed**
- **[D21] ✅** the demo SHIPS to users again, reversing **[D19]**. Demo = before you commit; walkthrough =
  after onboarding, on your own money. It no longer rides `QA_TOOLS`.
- **[D23] ✅** the demo is **TWO runs** — `explore` ships to users; `scripted` is the App-Preview + embed
  vehicle. One artifact had been doing two jobs and the video's requirements won.
- **[D20] ✅** capture pipeline — Maestro drives · `simctl` records · ffmpeg conforms.
- **[D32] ✅** 3.5.7 hosts on **GitHub Pages** and its privacy claim is a **GATE** — static-only *by
  construction*, which is the property being asserted. No analytics in the embed build (a **build flag**, not
  a toggle) · `sessionStorage` only · **zero network requests after asset load** · all held by a spec that
  fails `validate:release:rn`. ⚠️ Every host logs IPs, so *"financial data never leaves your device"* stays
  literally true while *"100% private"* would overclaim.
- **[D34] ✅ (2026-08-17)** — the embed CTA names the **destination**: *"Get it on the App Store."* The
  listing is "Paycheck Debt Planner" and the app calls itself "Debt Planner"; naming the store means neither
  has to move. App id `6773201250`.

**Product + engine**
- **[D22] ✅** the debt/expense split is CORRECT and stays (terminating vs perpetual); the defect is **naming
  + entry**. [D22a] one chooser replaces the per-section Adds · [D22b] the detector runs retroactively ·
  [D22c] it surfaces, never silently re-files · [D22d] "bills" vernacular → the wording gate.
- **[D2] ✅** `minimumPaidThisCycle` is the owner ("minimum covered"); `isPaidThisCycle` means paid in full.
  ⚠️ Corrected by B.0: the fallback-less reader is `planSelectors.ts:156`.
- **[D24] ✅** the tight top-up prefers a **discretionary goal; the EF is the fallback**, and the copy names
  it when it IS the EF. The dishonesty was drawing on it *silently and first*.
- **[D25] ✅** an applied purchase **keeps** its deferrable behaviour but gets an **explicit category**.
- **[D3] ✅** the calm-micro-viz hero language **extends to Debts** · **[D26] ✅** the greeting's mechanism
  ships, its **strings** belong to the wording gate · **[D27] ✅** port the free on-plan streak only, **no
  flame** · **[D28] ✅** B4's swipe ships as a pure accelerator · **[D29] ✅** B1 CLOSED as refuted.
- **[D4] ✅** rename before the next device build — every App Shortcut phrase contains `\(.applicationName)`.
- **[D1] ✅ stays DEFERRED, on a NEW reason** — the original cost argument **expired** (the machinery exists
  now). It stays deferred because **there is no control-SHAPED job**: this app's actions are multi-step or
  rare and dated, and a glance is a widget's job, which already ships.

**The lane**
- **[D30] ✅** the iPad lane is **three tiers in one directory**, not a second flow set. Forced by
  `use-layout.ts`: on a wide iPad the debt sheet is **inline, not modal**, so flow 02 would pass while
  testing nothing.
- **[D31] ✅** the audits change **METHOD, not just model** — reading is the expensive half *and* the weak
  half. Scripted lenses where the question is deterministic · a **generated artifact** as the agent's input,
  never the raw codebase · cheap tier extracts, expensive tier judges a short list. ⚡ **Every finding that
  becomes a TEST is paid for once** — audit spend as capital, not rent.
- **[D33] ✅** §11.16 PASSES on both edges; beat 5's landscape crop is **deliberate** — cropping to reveal a
  headline the user already met would hide what the beat exists to show.
- **4.1.9 ✅ (2026-08-17)** — **XCUITest, and NO Appium.** The probe proved both capabilities Appium was
  wanted for a subset of. Appium buys 3 checks for a second driver, language and server process.
- **[D35] ✅ (2026-08-17)** — **3.5's device pass FOLDS INTO Phase 6's.** They overlapped the moment the
  coverable-not-built rows went to Phase 6. One sitting, no row run twice.

**Open:** [D2]'s B4 gate · [D3]'s Money hero language · 3.8's segment name.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Generated, always current:** [`audits/coverage-split.md`](audits/coverage-split.md) · `audits/strings-inventory.md` · `audits/surface-inventory.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
