# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — **audit-gate remediation, T1–T8**

| | |
|---|---|
| **Where v1.7 is** | Phases 0–3 · **3.5** · **3.7** · **4** · **3.8** ✅, and the **audit itself is ✅ RUN**. Remaining: **T1–T8** → **Phase 5** 🔒 → 5.5 → **Phase 6** |
| **Gate** | `validate:release:rn` — **196 e2e · 10 embed · 10 `test:stamp` · 83 lane checks**, tsc + lint clean, zero `error-context.md`. CI runs it on every push. ⭐ **+`lint:glossary`** (6 retired strings) **+`lint:money`** (two formatters only) **+`lint:closure`** ([D37] traceability) |
| **The audit** | ⭐ [`audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md`](audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md) — **117 findings, 7 lenses, 8 refutations.** `findings/` per lens · `slices/` the verbatim input each lens got |
| **Device pass** | **52 rows** + the 60 coverable-not-built, all Phase 6, human-ticked, non-gating. ⚠️ Read figures from [`audits/coverage-split.md`](audits/coverage-split.md), never from a doc quoting them. ⚠️ **[T3.2] +1 owed row:** force a storage fault → the retry screen renders AND the retry recovers. MMKV cannot be failed on web, so both new surfaces ship on unit assertions with no rendered proof |
| **Env** | `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` · e2e `npm run test:e2e:rn` |

🎯 **2026-08-18: T1–T8 + T3B now. ⛔ [D37] every high+ closes this round; T9–T11 are SEQUENCED, not shelved.**
✅ **T1 · T2 · T3 · T3B CLOSED 2026-08-18**, full gate green (187 e2e · 10 embed · 0 error-context).
✅ **T4 CLOSED 2026-08-18** — 11 findings. ⛔ **5 of its 11 needed material correction; 3 would have shipped a WORSE app as written.**
✅ **T5 CLOSED 2026-08-18** — 11 more, gate green at 193 e2e. ⛔ **The same profile held: L1-12 was 2 of 9 sites, half of L3-7 was refuted, and L1-13's suggested wording would have undone T4.**
✅ **T6 CLOSED 2026-08-19** — 11 findings, **gate green at 195 e2e**, `lint:money` added. ⛔ **Three enumerations of the formatter class each undercounted; the GATE found the rest on its first run.**
✅ **T7 CLOSED 2026-08-19** — 4 fixed, **L1-16 refuted as unreachable**.
⭐ **T8 CLOSED 2026-08-19 — and with it the whole audit gate. [D37] EXIT CHECK PASSES: 55/55 high+ traceable**, enforced by `lint:closure` in CI. ▶ **Phase 5 is next.** 

⛔ **2 of 3 agent-declared blockers did NOT survive refutation, and the tally is now 3 of 4** — L1-1
downgraded, L3-5's mechanism wrong (severity right), L1-4 downgraded (free DOES get a Guardian). Plus
L6-7 and L6-3 closed as not-defects. ⚡ **The lenses' self-reported CONFIDENCE has been reliable; their
SEVERITY has not.** **No finding becomes work un-refuted** — `findings/L9-refutations.md` records the 12
claims actually re-checked; anything not in it carries only its own lens's confidence.

### ▶ T1–T8 — the remediation _(the step table; the ACTIVE step is decomposed below)_

⚠️ **The order is prerequisite, not preference.** T1 first or every later count is measured through a
narrowed instrument; T4 before T5/T7/T8 or the glossary decides words those passes would edit twice.

| # | Step | Items | State |
|---|---|---|---|
| **T1** | **The instruments** | ✅ **Done 2026-08-18.** Strings gate: rule ② now consults the origin sets **and** the `key:`/`prop:` alias (358→333 unclassified, **+10 strings into the gate's view**, 2 new duplicates with them); TECHNICAL decided per-VALUE so MIXED props keep their copy visible; `calleeLabel` given ONE owner (there were two) + a **self-check that reds on a denormalised label**, mutation-verified. `DUP_MIN_LEN` 20→**14** — the gate saw 3 duplicates, now 12, and all 9 it had missed were found by hand in the same audit; baseline 5→16. Surface inventory now finds **hand-rolled** formatters: **7**, and Today reaches **8 money renderers**. Fixture seeds a bill: 178/184 passed, 5 specs pinned their own state, 1 assertion **strengthened** (it passed either way) | 
| **T2** | **App Store / legal exposure** | ✅ **Done 2026-08-18.** L6-2 fixed: the shipped web sample named **Chase Freedom Unlimited** with fabricated balance/APR, in the bundle behind the public embed → fictional issuer; parser still prefills correctly (probed). 🎯-approved rewrites landed for **L1-2** (paywall sold "autopilot" the product disclaims twice elsewhere), **L1-3** (an unconditional cushion promise the next-but-one bullet contradicts) and **L1-4**. ⛔ **3 of 5 items closed as NOT defects** — L6-7 (public RC key, by design), L6-3 (`QA_TOOLS` deliberate, already a Phase-6 step), L1-4 downgraded (free DOES get a Guardian) |
| **T3** | **Correctness** — concrete repro each | ✅ **Done 2026-08-18**, all 7 (L0-2/L5-9 · L5-2 · L5-1 · L3-3 · L5-5 · L5-6 · L5-14), **full gate green: 187 e2e** (+3), 29 new unit asserts, **every fix mutation-verified**, 2 new lint rules. ⛔ **Found while building: `Alert.alert` is a NO-OP in react-native-web** — 11 raw sites incl. the paywall behind the live embed. ⚡ **7 of 7 first-cut instruments were wrong in a way that would have PASSED** — detail → log |
| **T4** | **The glossary** | L1-5/6/7/14/19/26/34 · L2-6/7/16 | ✅ **Done 2026-08-18.** `@core/copy/vocabulary` owns 7 nouns + the disjointness rule; `lint:glossary` bans 5 retired words in CI. **L1-6 reversed · L1-14 misclassified · L1-26 refuted · L2-6's mechanism false · L1-7 partly refuted.** +1 correctness defect found (T4.1b) |
| **T5** | **Truth of claims** | ✅ **Done 2026-08-18.** All 11 (L3-1/2/4/6/7 · L1-12/13/15/17/18 · 🎯's `tutorialPath` call), **full gate green: 193 e2e** (+6), 5 unit asserts, every fix mutation-verified, +1 `lint:glossary` rule. ⛔ **L1-12 was 2 of 9 sites** and **half of L3-7 was refuted** — building it as written would have reported every autopay FAILED. **L1-13's suggested wording would have undone T4/L1-14.** ⚠️ **The sweep rule itself was wrong twice** (missed the root-level legacy tree; omitted `apps/rn/src/**/*.test.ts`, which red the gate) → now root-scoped, no list. Detail → log |
| **T6** | **Numbers cohesion** | ✅ **Done 2026-08-19.** All 10 + L4-2, **full gate green: 195 e2e · 10 embed**, new `lint:money` gate. ⛔ **The formatter count went 6 → 7 → 9 → 12 and only the GATE found the last four** — three prior enumerations each undercounted. **L4-1 was two defects**, one a conservation break (hero segments summed to $400 of a $300 paycheck). **L4-8 declined on the record** (its fix re-adds noise the App Preview sweep removed); **L4-10 closed as recorded**. ⛔ **[T4.1b] refuted: Guardian band flips 0 / 1,820** — 🎯 keeps `selectDiscretionary`. Detail → log |
| **T7** | **Voice & persona** | ✅ **Done 2026-08-19.** L1-8/9/10/11 fixed; ⛔ **L1-16 REFUTED on reachability** — both files it rewrites have one non-test consumer, the legacy tree 5.5.1 deletes. **L1-9 had a site the finding missed**; the sweep found **34** more, incl. **9 assertions in the live suite, 3 Maestro flows, and the `lint:copy` baseline**. Classes enumerated closed, not assumed. Detail → log |
| **T8** | **Drift / one-owner** | ✅ **Done 2026-08-19.** ⛔ **3 of the 8 majors were ALREADY CLOSED by T4** and untraceable (L2-2 · L2-6 refuted · L2-7). Five owners built (L2-1/3/4/5 · L2-9=L0-3). **Two lists had already diverged on screen** (`/2wks` vs `/2 wks`; a curly vs straight apostrophe). ⚠️ **L2-5 was 3 files not 2, L2-3 was 4 ways not 3.** T8.4 **baselined, not swept** — 44 correct-but-hand-rolled parses. +`lint:closure`. Detail → log |



| **T3B** | **The high+ sweep [D37] added** | ✅ **Done 2026-08-18.** 8 majors that sat outside the gate: **7 built · 2 verified already-closed by T1 (not re-fixed) · L4-2 → T6.** ⛔ **L0-5 is the FOURTH member of the RNW-drops-it class** — `accessibilityState`/`accessibilityValue` object forms are dropped; 11 sites, 9 files, both guards widened 2→4 props. **L5-12's own suggested copy was a claim this screen had already retired twice** — built from a measured differentiator instead, with a test pinning the dead claims out. Detail → log |

**Exit:** T1–T8 **and T3B** closed, **all 55 high+ traceable to a closure or a recorded refutation**,
full gate green, and every fix that CAN be a lint rule IS one ([D31] — a finding that becomes a test is
paid for once).

### ▶ NEXT — **Phase 5 · Data continuity + cutover** 🔒 _(ACTIVE at next switch-in)_

⛔ **T1–T8 + T3B are CLOSED and the [D37] exit check PASSES: 55/55 high+ traceable** (`lint:closure`, now
in CI). The audit-gate item is done; the build order resumes at **Phase 5 → 5.5 → Phase 6**.

⚠️ **Do the switch-in properly — Phase 5 is a pre-authored item and this phase measured, five times, that
pre-authored scope is wrong in the same direction.** Its steps are below Phase 5's own heading in this
doc; decompose them at switch-in, after verifying each premise against current code.

**Owed before launch, carried forward from this phase:**
| | |
|---|---|
| **Device pass** | 52 rows + **[T3.2]'s owed row** (force a storage fault → retry renders AND recovers). Two T3 surfaces ship on unit assertions with **no rendered proof** |
| **T9–T11** | the minor/polish set, deliberately out of [D37]'s scope. ⚠️ **Re-measure first** — T4–T8 collapsed many of their owners |
| **T10** | 44 baselined local parses · `formatDisplayAmount` (dead, L4-11 confirmed) |

⛔ **The sweep is over the REPO ROOT, ripgrep, no `head`, no directory list** — see CLAUDE.md. T5 proved an
enumerated corpus list wrong twice, once by red-gating on a file the sweep had just called clean.

⚠️ **Re-measure T8 at its own switch-in.** T3 collapsed several of its owners (`localDate`,
`paydayFieldError`, `pickTopUpGoal`, `notify`) and **T4 collapsed four more into `@core/copy/vocabulary`**
(L2-6/7/8/16), so the "23 L2 items" figure is stale twice over. Do not budget from it.


---

## ⏸ Waiting on Jason

- **[D2]** `minimumPaidThisCycle` ownership — gates B4 · **[D3]** Money hero language — ⚡ **cheaper decided
  with 3.8**, which touches that hero · **[D1]** Control Center *(rec: stay deferred)*.

## 🎯 Reported from the app — found by USING it, not by the lane

| | Report | State |
|---|---|---|
| **R1** | Money's edit sheets had no date **picker** | ✅ **DONE.** `DateField` at all 4 sites. ⛔ Folded in: `todayLocalISO()` returned **yesterday** east of UTC. The fields had **zero** coverage before, which is why it shipped |
| **R2** | The expense set-aside is uncoachable · living expenses undiscoverable | ✅ **DONE = 3.8.** Both were the same fix. ⛔ The second half was **worse than reported**: the Money door existed but was gated on `livingTotal > 0`, so it showed only to users who had already found the feature |

⚡ **Neither was reachable by 4.1.** The lane checks that built behaviour keeps working; these are *design*
gaps. **No coverage split models "the app does the wrong thing correctly"** — the device pass is the only
instrument that finds them.

---

## ⚠️ Open threads — each has an owner

⚠️ **The coach-mark defect, the transient Guardian card and §12.6.1 now live on the ACTIVE audit-gate item
above** — they are that gate's inputs, not separate threads. Listed here once would be a second record of one
thing, which is the drift class the gate itself hunts.

**Product defects, live:**
- ⚡ **A pref changed then force-quit within 500 ms is LOST** (`persistence.ts:14` debounces; `flushPendingSave`
  fires only on AppState *background*). Silent data loss on a setting the user watched confirm itself.
  **Measured, not theorised.** → **Phase 5**, which owns durability.

**a11y, owed to the premium sub-audit:**
- ⭐ **`hitRegion` = 2 real findings, on BOTH tiers** — two hit targets below the minimum, reproducible.
  Now *characterised* (`"Hit area is too small"`) and still *unlocated*: `compactDescription` does not name
  the element. The probe compiles, so `issue.element` can be added at low risk — ⛔ **not worth a dedicated
  ~50-min dispatch; the nightly answers it for free.**

**Lane residuals — Phase 6 as known issues, none gating:**
- ⛔ **The iOS driver stall has happened TWICE and its retry does not clear it** — zero flows after paying a
  full build, indistinguishable from a real red in exit code and cost. **Check for that warning line before
  diagnosing any iPhone-tier failure.**
- ✅ **The `tutorial-invite` intermittent is FIXED 2026-08-18** — three sightings (CI 08-10 · local 08-11 ·
  local 08-18, the last one red a full release gate). ⛔ **Cause: the test, not the app.**
  `click({ force: true })` skips actionability but still clicks **coordinates**, does not wait for the
  element to stop moving, and delivers to whatever is topmost — measured: `tutorial-scrim-blocker`. So a
  test whose stated subject is *the tab-press LISTENER* was really asserting on the scrim's layout.
  Replaced with `dispatchEvent('click')`, which fires on the element: no coordinates, no stability
  requirement, no topmost-node dependency. ⚠️ **Mutation-verified** — deleting `holdTabs` reds it, which
  the previous version famously did **not** do. ⚠️ The failure MECHANISM was never reproduced (an
  instrumented full-suite run came back green and healthy); what is proven is that the line depended on
  layout it never meant to test. Suspects if it recurs are recorded at the call site.
- ⚠️ The boot poll that replaced `sleep 25` **does not fire** · the XCUITest probe went **1 min → 11 min** on
  iPhone (suspect: `descendants(matching: .any).count` ×3) · the `tutorial-invite` intermittent (see above) had red
  **twice** (both times the session had ENDED when the test expected it running).
- ⚠️ **Two of the 15 flow files MEASURE rather than cover** (`i01-ipad-boot`, `11-reduce-motion`) — any
  re-derivation that counts files overstates itself. **§12.0.7 is unclaimed** (the demo persona's Money-tab
  debt names were never established).
- ⚠️ **The Reduce-Motion probe's answer lives only in a PNG** — Maestro dumps a hierarchy on FAILURE only,
  so a passing flow captures no value. *A probe whose result a human must look at cannot gate anything.*
- ⛔ **The `toISOString().slice(0,10)` off-by-one is now OWNED BY T3** — and the audit measured it at **9
  production sites, not ~4**, including `recurrence/rolloverPayCycle` (the rollover advances every due date,
  so the error compounds every cycle) and `payCycle/getNextPaycheckDate`. L0-2 · L5-9, corroborated by two
  independent lenses plus two historical fixes of the same pattern.

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
| **3.8** | **The expense reserve** | ✅ **COMPLETE 2026-08-17** — both tiers [D36]. Pot · draw-down · capped offer · "Spoken for" · honest hero. **5 defects found while building**, +5 e2e (184) |
| **—** | **Whole-app cohesion + best-in-class + wording audit gate** | ▶ **ACTIVE** — decomposed at the top; ⛔ needs 🎯's go |
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
- ✅ **STANDING PERMISSION, THE AUDIT GATE** *(🎯 2026-08-18: "You have standing permission to continue
  honestly through T4, T5, and onward until you need me. As long as you don't forget the before and after
  scans.")* — runs through **T4 → T5 → T6 → T7 → T8**. ⚠️ **Conditional on the scans**: every step and
  sub-step gets its before-scan (verify the finding against the CURRENT code — measured this session at
  **4 of 6 findings materially wrong in their specifics**) and its after-scan, captured atomically with the
  plan edit. ⛔ **Still comes to Jason:** a new product/content call, anything touching Phase 5/5.5/6, and
  any ruling that overturns a decision he already made.
- ✅ **STANDING PERMISSION, 3.8** *(🎯 2026-08-17: "continue through 3.8 until you need my input")*. The tap's
  shape (.5) is inside it; a **new** product/content call is not. *(4.1's grant is spent — 4.1 is closed.)*
  Everything else — Phase 5, 5.5, 6, the audit gate — comes to Jason.
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

- **⭐ [AUDIT GATE] Pre-Release Best-in-Class FINISH sweep — runs FIRST, on the FROZEN app.**
  ⭐ **ABSORBS audit-gate T12** *(🎯 2026-08-18)* — ~40 polish items from the 2026-08-17 audit: L5-10/12/17–21
  · L1-20…35 · L2's polish tier · L4-12…16. They belong here rather than in v1.7 because this sweep already
  re-walks every screen on the frozen build, and polish decided against a moving app gets decided twice.
  ⭐ **The single best one: L5-12** — the paywall never mentions the user's own money, though the selectors
  to say *"this paycheck you're $180 short"* already exist. Every screen ·
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

⛔ **[D37] EVERY high+ finding is remediated THIS round** *(🎯 2026-08-18: "We're fixing all in this
round")*. **Measured denominator: 117 findings, 55 blocker+major.** The gate is not "T1–T8 closed", it is
**all 55 high+ closed or explicitly refuted**, with each closure traceable to the finding id.

⛔ **NOTHING IS PARKED** *(🎯 2026-08-18)*. **T9–T11 are SEQUENCED, not shelved** — every remaining
minor/polish finding is still live and gets **re-evaluated once T1–T8 lands**, because several become
cheaper or moot by then. "Parked" was the wrong word for it and read as *dropped*. Detail → log.

**Surfaced by T6's PER-SUB-ITEM after-scan (2026-08-19) — both folded in, not deferred:**
- ✅ **`affordability.test.ts` modelled `PlanHero` with `everydayReserve` after T6.3 moved the component to
  `everydayHeld`** — a stale model whose comment claimed to mirror the component, passing only because the
  fixture's request fits. Fixed.
- ✅ **T6.5/6.6/6.7 changed 5 rendered figures with ZERO assertions** — the gate went green because nothing
  would have failed. Reconciliation test added, plant-verified, both directions.

**Surfaced by T6 (2026-08-19):**
- ⚠️ **`buildGuardianBrief.ts:124` declares `function money(n): number`** — a ROUNDER sharing the
  formatter's name, in core. Not a defect and `lint:money` correctly ignores it (it builds no string), but
  the name collides with the thing 12 sites were just collapsed onto. → **T8** (one-owner naming)
- ⚠️ **`selectDiscretionary` has 2 consumers beyond T4.1b's four** — `expenseReserveSelectors.ts:112`
  (the offer) and `guardianSelectors.ts:550`. Neither was in the ledger; both read the partition total.
  Measured as band-neutral, but they inherit whatever the `holdsLine` decision settles. → **T8**
- ⚠️ **`formatWhole` lives in the RN tree while `formatCurrency` lives in core**, so the two halves of one
  rule sit in two packages. Not worth 23 import rewrites now (measured at T6.2) — but if core ever needs a
  whole-dollar figure, move it then rather than adding a third. → **T8 / Phase 6**

**Surfaced by T5 (2026-08-18):**
- ⛔ **`DebtAmortization.isFocus` is now read by NOTHING** — L3-4 moved its one consumer to `monthlyExtra`.
  An unread field sitting beside the must-read one is the exact trap that produced L3-4. → **T8**
- ⚠️ **`testFullAppRegression.ts:63`'s conservation assert holds only when the reserve FITS** — with an
  over-sized everyday reserve, `paycheckAmount − livingExpenseReserve` goes negative while the allocation
  sum floors at 0. Not exercised today; `livingExpenseHeld` is the honest term. → **T6**
- ⚠️ **`AmortizationView` calls a BNPL's `bnplMonthlyEquivalentMinimum` "the minimum"** — it is a monthly
  *equivalent* of an installment minimum. Precision, not a lie. → **T6**
- ⚠️ **T7 must re-check `buildSmartInsights` reachability before spending on L1-16** — L3-5 measured its
  only non-test consumer as the legacy web app, which 5.5.1 deletes.

**Surfaced by T4.3 (2026-08-18) — untested surfaces, both found by renaming them:**
- ✅ **`GuardianScorecard`'s day-one state — CLOSED in T5.3, not deferred.** T4.3 renamed that copy
  unverified and T5.3 was about to be the *second* unverified rename of the state every new user is in.
  Now pinned in `cushion-forecast.spec.ts`, plant-verified, with both retired claims asserted absent.
- ⚠️ **The timeline's cushion row label is unasserted** — `buildTimelineItems` pushes it and
  `TimelineLedger` renders it, but no spec reads it, so the T4.3 rename there is **unverified by the gate**.
  → fold a single assertion into **T4.9**

**Surfaced by T4's switch-in + T4.0/T4.1b after-scans (2026-08-18):**
- ⚠️ **The paywall lead has NO e2e coverage** — it sits behind the **live public embed** and is pinned only
  by `paywallLead.test.ts`. No Playwright spec asserts any branch of it. → **Phase 6** *(or T4.9 if a spec
  is cheap once the glossary settles the words).*
- ⚡ **Write copy-pin assertions with `.includes()`, never a regex.** A `…` written through a
  heredoc→node→file chain landed as literal **backspace** characters (`/flexible/`), so the pin
  could never match and **would have passed forever**. Caught only by mutation-verifying it. That is the
  **8th** first-cut instrument in this project that was wrong in a way that PASSED. → **T4.8** owns making
  this a rule.

**⏳ T9–T11 — re-evaluate after T1–T8** *(high+ already pulled into the gate by [D37])*.
- **T9 · a11y** — ⚠️ **L0-5 and L5-7 are MAJOR → in the gate now** (L1-8 was already T7's).
- **T10 · dead code** — L0-4 (`ProgressRing`, `MilestonesRow`, **0 refs**) · L3-5 · L4-11
  (`formatDisplayAmount`) · L6-4/5 (`projectForecast`, `buildSmartInsights` — unsurfaced, and feeding 8
  off-voice strings into the wording gate's input).
- **T11 · states & robustness** — L5-13/15/16. ⚠️ **L5-3/4/8 are MAJOR → in the gate now**, incl.
  `/schedule/[id]`'s up-to-**600 unvirtualized rows**.
⚠️ **T10 interacts with T1:** deleting dead code shrinks the surface every later instrument reads, so if T1
surfaces more of it, fold it rather than re-entering.

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
- **[D36] ✅ (2026-08-17)** — the reserve ships to **BOTH TIERS** (the lie is tier-blind, and `prefundedReserve`
  is premium-only, so it needed deciding rather than inheriting) · the Guardian segment is **"Spoken for"**.
  ⛔ *"Set aside"* is a portfolio name; *"Reserved"* would name a **different number** than the Money hero's.

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

**Open:** [D2]'s B4 gate · [D3]'s Money hero language.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Generated, always current:** [`audits/coverage-split.md`](audits/coverage-split.md) · `audits/strings-inventory.md` · `audits/surface-inventory.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
