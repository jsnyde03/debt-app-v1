# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — **Phase 6 · Launch-ready** *(Phase 5 ✅ CLOSED 2026-08-19)*

| | |
|---|---|
| **Where v1.7 is** | Phases 0–3 · **3.5** · **3.7** · **4** · **3.8** ✅ · the **whole-app audit gate** ✅ ([D37] 55/55, `lint:closure` in CI) · **Phase 5 ✅ CLOSED** — the migration is verified on a live device and the cutover is **conditionally approved**. **Phase 6 is everything that remains**, and it ends at ASC submission |
| **Ships as** | **`2.0.0`** ([D38]). The internal workstream keeps the name *"the v1.7 Elevation"* |
| **Gate** | `validate:release:rn` — **207 e2e · 10 embed · 10 `test:stamp` · 87 lane checks** + `lint:glossary` · `lint:money` · `lint:closure` · **`lint:secrets`** *(the repo is PUBLIC — credentials live in the Codemagic env group, never the tree)*; tsc + lint clean, zero `error-context.md`. ~15 min locally. ⛔ **Record the run, never inherit it** — the gate was RED from `f4e5e11` (2026-08-19) to 2026-08-20 while three sessions carried a stale "last green" forward, and CI was failing on every push the whole time. **Last RUN 2026-08-20 — locally on this tree (exit 0, read directly) and CI `32384250379` on `8653107`, the first green since the break.** |
| **Env** | `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` · e2e `npm run test:e2e:rn` |

⛔ **TWO LINES, NOT ONE ([D39]): FEATURE LOCK ≠ FREEZE.** Feature lock lands the moment **P6.4** closes — no
new capability in 2.0 past it, and a structural gap found after it defaults to **2.1**. Freeze is later and
stricter: every planned change landed. *"Frozen" is not a milestone you schedule; it is a state you converge to.*

⚠️ **Numbering legend — two older labels are kept, not renamed.** `P6.n` is this decomposition's sequence.
**"6.C" (cloud backup) = P6.3** · **"6.5" (repo consolidation, was 5.5) = P6.11**, so a log entry or commit
naming `5.5.1` means **P6.11.1**. 🔒 = ship-blocker.

### ▶ Phase 6 — the steps *(🎯's own order, settled 2026-08-19)*

| # | Step | State / notes |
|---|---|---|
| ✅ | **P6.1 DONE 2026-08-20** — the shipped version is `2.0.0` ([D38]). All three premises held; folded in the two stale `1.7.0` quotes in `codemagic.yaml` and two tracked zero-byte junk files. Detail → log |
| ✅ | **P6.2 DONE 2026-08-20** — the feature-lock boundary is the **62** in [`REMAINING.md`](audits/2026-08-17-v1.7-audit-gate/REMAINING.md) ([D39]). Parser verified lossless (117 headings = 117 severities = 55 + 62); T9–T11 retired as drivers, carrying no id the generated list lacks. Detail → log |
| **P6.3** | **Cloud backup** *(= "6.C", was 5.7)* — ships in v1.7 🎯, **not** premium-gated | 🔒 The cutover's approval condition, so **the app is not frozen until this lands**. ✅ **Built 2026-08-20 (.1–.7)**, portal + profile done. ⏳ **Only P6.3.3.8 remains — the device verify, on the [D48] build 🎯 is cutting now.** Below |
| **P6.4** | ▶ **BUILDING NOW — the 62 filed findings** | Decomposed below. [D42]: all 62 **judged**, fixed = every defect + every finding on a shipping surface. ⛔ **FEATURE LOCK closes with this step** |
| **P6.5** | **Sentry** | ✅ **`beforeBreadcrumb` scrub BUILT 2026-08-20** — Sentry's touch integration records a11y labels and Debt builds those from the user's balances, so this is the difference between [D41] being true and a crash shipping real money off-device (21 asserts, both plants red). 🔴 **Needs the DSN from 🎯** → [`DEBT_SENTRY_SETUP.md`](DEBT_SENTRY_SETUP.md). ⛔ **Source-map upload stays OFF for the batched build** — a missing `SENTRY_AUTH_TOKEN` hard-fails the ARCHIVE, and that would kill the build before any of its three device checks ran |
| **P6.6** | **Splash screen** | ✅ **DONE 2026-08-20** — plugin configured (`icon.png` · `imageWidth: 220` · `#0a051c` · contain), verified reaching the plugin via `expo config --type introspect`. ⚡ **[D43] was right and my instinct was wrong, decided by LOOKING** at three rendered candidates: on the icon's own surround the badge *dissolves*; on the app's navy it reads as a pasted-on square → [`evidence/2026-08-20-p6.6-splash/`](evidence/2026-08-20-p6.6-splash/). ⛔ **Dark in both themes** — `icon.png` is a SQUARE with no alpha, so on a light field the square shows and reads as a bug. ⚠️ Residual for 🎯: a light-mode user gets dark splash → light UI. **The rendered result is a device row** — `expo prebuild` cannot run on Windows |
| **P6.7** | **CI / Pages ops** | ⚠️ Retire the `legacy-capture-*` tag trigger **now, independently of P6.11** — its deferral said *"with the legacy tree"* and that tree just moved a whole phase; any push of such a tag spends ~45 min of macOS runner. · Flip the deploy allow-list to `release/v1`, or a dev branch can publish to a public marketing URL indefinitely. · ✅ **[D44]:** the deploy job **asserts its SHA has a green `web-e2e` run** and fails otherwise — *"deployed"* and *"passed the gate"* stop being held together by discipline · 🔴 **[D49] — a green gate must be RECORDED BY THE GATE, never typed.** `validate:release:rn` writes `gate-status.json` (SHA + UTC date) on success only; `lint:gate-freshness` reds when **source** has changed since that SHA. ⛔ [D44] stops a red SHA *deploying* but tells nobody the gate is red — which is the hole the 2026-08-19→20 red slipped through for three sessions while CI failed every push |
| **P6.8** | ⭐ **[AUDIT GATE] Pre-Release Best-in-Class FINISH sweep — on the FROZEN app** | Absorbs **T12** (~40 polish items: L5-10/12/17–21 · L1-20…35 · L2's polish tier · L4-12…16). Every screen · sheet · card · state · both themes · iPhone/iPad/Split-View · Dynamic Type. ⭐ **Charter includes STRUCTURAL GAPS** — *"is anything missing"*, not only *"is anything wrong"*; this is where 5.10's original fan-out intent now lives. ⛔ **Anything structural is a SCOPE CALL for 🎯**, never an automatic fix, or the sweep expands the freeze it exists to protect. Best single item: **L5-12**, the paywall never mentions the user's own money |
| **P6.9** | ⭐ **[AUDIT GATE] Privacy / data-flow audit** | Trace EVERY egress and prove *"financial data never leaves your device"* is literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs. ✅ **Unblocked — it consumes [D40] + [D41]**, both settled 2026-08-20, so its job is to prove the new claim *literally true* rather than to discover one. ⛔ **The claim it verifies:** *"Your data never goes to our servers. Optional iCloud backup keeps it in your own Apple account."* Also owns retiring the marketing *"100% private"* line and the ASC privacy label declaring RevenueCat. 🔴 **P6.3 hands it a live counterexample: `PRIVACY_CLAIM.body` still says *"your financial data stays on this device"*, which the iCloud toggle makes false. P6.3 must not SHIP without [D41]'s rewrite landing here** |
| **P6.10** | ⭐ **[AUDIT GATE] Pre-submit functional + FINANCIAL-correctness money lens** | Boundary inputs across the engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios. ⛔ **Owns two carried defects:** `bulkMarkRequired.ts` writes pre-[D2] paid semantics — inert today, but a false assertion in **data Phase 5 migrates** · `appliedTopUp` is a manual-opt-in invariant every cushion reader must remember (three readers exist; two had it) |
| **P6.11** | **Repo consolidation** *(= "6.5", was 5.5)* — **delete the legacy tree** | ⛔ **Last possible moment, by design** (🎯: *"I do not want to take any chances at all of us deleting something from legacy that is still needed but missed"*). ⚠️ **Must be FINISHED before the final build.** Decomposed below |
| **P6.12** | **`validate:release:rn` GREEN after the deletion** | ⛔ The guard the move created. Removing an entire surface is exactly the change that breaks the remaining one, and P6.11 now lands after everything else — nothing else would catch it |
| **P6.13** | **CM build cut** | ⛔ **`QA_TOOLS` STAYS ON.** The device pass rides `qaEnabled()` instruments — `legacy-bridge-probe` is literally how the migration was verified. Flipping it *"to be safe"* here **deletes the instruments the pass needs** |
| **P6.14** | **FINAL DEVICE PASS** — on the post-deletion binary, the configuration that actually ships | 🔒 Human-ticked, non-gating. **52 rows + the 60 coverable-not-built + 3.5's folded-in pass** ([D35]) **+ [T3.2]'s storage-fault row** *(two T3 surfaces ship on unit assertions with no rendered proof)* **+ the three rows Phase 5 owes + A0.4 · A8.4 + the two sub-audits**. Reference block below; the runnable truth is [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md) |
| **P6.15** | **Defect fix** | Whatever P6.14 turns up |
| **P6.16** | ⭐ **[AUDIT GATE] The final audit** *(🎯: "final final final")* | ⚡ **Because fixes are changes, and changes are unaudited.** The loop closing, not a formality — every straight-line plan ships the last round of fixes unexamined, and those are the ones written closest to submission |
| **P6.17** | **Fixes + flip `QA_TOOLS` to false** | 🔒 Deliberately **last and smallest**: `git grep QA_TOOLS` must show the instruments gone **and** nothing depending on them. Takes its own `validate:release:rn` |
| **P6.18** | ⚠️ **TARGETED device re-check** | **Only the rows touching what P6.15 and P6.17 changed** — not a second 52-row pass. ⛔ **The device loop has to close too:** fixes born on a device are the likeliest to need one, and anything native (share sheet · picker · Live Activity · widgets · notifications · the bridge) has **no off-device proof at all**. Collapses to nothing if the fixes were pure logic or copy |
| **P6.19** | **FINAL BUILD** | |
| **P6.20** | ⭐ **Capture screenshots + the App Preview FROM that build** | 🎯: *"we will not have anything to grab screenshots OR the app preview from until the final build is pushed."* ⚡ A frozen UI is not a **binary** — the assets come after the build, not before it. ONE 886×1920 file, 15–30 s, off the proven capture pipeline. ⛔ A visual problem found here costs another build; that risk is real and unavoidable, so **look hard at P6.18** |
| **P6.21** | **ASC submission** | Listing · release notes *(lead with the rewrite — a 2.0 with 1.7-shaped notes re-creates the expectation problem)* · privacy label declaring RevenueCat · **AU/NZ availability** · ⚠️ **App Review paywall-findability** — v1.1 was rejected repeatedly, so the notes MUST say *"Tap ••• More → Unlock Premium"* · the assets from P6.20 · the launch-FLIP value gate |

**Exit:** `2.0.0` submitted to App Review off a build that passed P6.18, with `validate:release:rn` green on
the shipping configuration and `QA_TOOLS` off.

### ▶ P6.3 — cloud backup *(= "6.C")*

✅ **P6.3.1–.2 settled ([D40] private container, no passphrase · [D41] the claim) · P6.3.3.1–.7 BUILT
2026-08-20** — codec, provider seam, service + clobber guard, the sheet (**closes L1-29**), the auto-trigger
and its coverage. Off Freedom's device LESSONS, not its code. ✅ 🎯 did the Apple portal + refreshed the main
profile (a capability change invalidates it). Detail → log.

| # | Remaining |
|---|---|
| **P6.3.3.8** | **Device verify** — on the [D48] batched build (P6.3 + P6.5 + P6.6). ⛔ **Web proves only the *unavailable* branch**; the entitlement, the container, the fresh-install download-poll, the restore offer and the toggle path have **no off-device proof at all**. ⭐ **The row that matters is the clobber guard** — [`DEBT_ICLOUD_SETUP.md`](DEBT_ICLOUD_SETUP.md) Step D.5: decline the restore, onboard fresh, background, and confirm the remote is still the OLD backup |

### ▶ P6.4 — the 62 filed findings *(the ACTIVE decomposition)*

⛔ **[D42] is a BAR, not a count:** all 62 **judged**; **fixed** = every defect + every finding on a surface
that ships. ⚠️ **Not 62 edits** — 24 of the 61 copy duplicates are generic chrome that repeats *by design*,
5 more die with the `QA_TOOLS` flip, and several are already dead. ⭐ **1 is already closed: L1-29**, the
"coming soon" row, by P6.3.3.5.

⚠️ **Two the triage must not get wrong, both already read:** **L6-7** is a *publishable* RevenueCat key
(`appl_…`, not `sk_`) — the finding says so itself and the fix is a comment, and it is consistent with
`lint:secrets`, which flags only secret keys. **L5-21** records that "no loading state on native" is
**correct** — it exists so nobody re-opens it, and "fixing" it would be the defect.

| # | Sub-step |
|---|---|
| **P6.4.1** | **Triage all 62 against the CURRENT code**, one recorded verdict per id: FIX · already-closed · refuted · dies-with-`QA_TOOLS`/P6.11 · defer-to-2.1. ⛔ **Each verdict names its id** or `lint:closure` cannot trace it, and an untraceable closure is indistinguishable from an open finding |
| **P6.4.2** | **The CLAIMS cluster — L3-5/6/7.** Highest value in the set: capped promises stated as fact, on money. L3-7's *"Autopay · ran"* is a presumption presented as an event. ⚠️ Half of L3-7's own suggested fix would have reported **every autopay FAILED** — refuted once already |
| **P6.4.3** | **Number formatting — L4-5/7/8/9/10.** Whole-vs-cents disagreeing on one card, and `tabular-nums` defeated by `minimumFractionDigits: 0`. `lint:money` territory |
| **P6.4.4** | **Copy + duplicates — L1-20…35 · L2-8…23 · L6-6.** ⛔ **The T4.4 rule applies in full:** sweep by **RETIRED STRING**, case-insensitively, no `head`, across `apps/rn/tests` AND `apps/rn/.maestro` AND `packages/core/**/test*.ts`. That rename needed **four** rounds, each caught by a different instrument after the previous went green |
| **P6.4.5** | **States + rows — L5-13/14/16/17/18/19/20 · L6-8/9/10 · L4-12/13.** ⚠️ **18/19/20 were missing from this list's first draft** and only surfaced because `lint:closure` still called them untraced — the site-list undercount, on a list written minutes earlier. They overlap T12/P6.8; [D42] judges them here. L5-14 is the real defect here: a cleared semimonthly/monthly payday field silently produces a **biweekly** date |
| **P6.4.6** | **Dead code — L0-4 · L4-11 · L6-4/5.** ⛔ **Verdicts inherit their lens's slice** — every lens saw `apps/rn` + `packages/core` only, and `formatDisplayAmount` was called dead with **three live legacy call sites**. Re-check against the ROOT tree, which is why P6.11 deletes last |
| **P6.4.7** | **`validate:release:rn` + `lint:closure` green, FEATURE LOCK closes.** After it, a structural gap defaults to **2.1** ([D39]) |

**Exit:** every one of the 62 carries a recorded verdict traceable to its id, the fix set is green on the
gate, and feature lock is declared.

### ▶ P6.11 — repo consolidation *(= "6.5")*

⚠️ **Verify scope against the CURRENT tree at switch-in** — pre-authored cleanup drifts.
⭐ **What deleting last buys beyond the safety:** T10's dead-code verdicts must be re-checked against the
ROOT tree (`formatDisplayAmount` was called dead and has **three live legacy call sites**), and that tree
now survives long enough to check against; every Phase 6 audit also runs while the old surface is still
readable, so *"what did v1.6 do here"* stays answerable.

| # | Sub-step |
|---|---|
| **P6.11.1** | Remove the root Capacitor/Next surface. Also retires `validate:release:legacy`, the root Next lint, the legacy `debtPlanner.isDemoMode` test references, `tests/visual/*.cjs`, the gate's assertions on the **retired demo-mode contract**, and one of the **two screenshot mechanisms** |
| ✅ | **P6.11.2 SETTLED 2026-08-20 — the monorepo stays** ([D45]). `packages/core` is shared portfolio-wide, and a root promotion is churn with regression risk for nothing a user sees |
| **P6.11.3** | Tooling / CI / docs to the consolidated tree. Includes **splitting `DEBT_ELEVATION_LOG.md`** (~15k lines, well past one-pass readability) |
| ✅ | **P6.11.4 done early** — `apps/rn` has its own `eslint-config-expo` |

### ⚠️ Why this is an ORDER and not a list

⚡ **P6.8 → P6.15 → P6.16 is a convergence LOOP**, and it is 🎯's addition rather than mine: a device pass
produces fixes, fixes are unaudited changes, so the audit runs *again* after them. ⛔ **Getting P6.8 early**
buys a second sweep and re-decides everything it touched; ⛔ **getting P6.9 early** turns a settled decision
into a discovery mid-audit. ⚠️ **Residual, named rather than hidden:** the binary that ships is not
byte-identical to the one device-passed, because the `QA_TOOLS` flip comes after. That is unavoidable — the
pass needs the instruments and the ship must not have them — which is why the flip is last, minimal and
separately gated. Full reasoning → log, *"THE ORDER TO SUBMISSION"*.

⛔ **The QA-door conflict is resolved by ORDERING, not by rework** ✅ **[D46], 2026-08-20** — and it was
always latent: the standing constraint says *"never let a coverage row ride a QA door"*, and the
`legacy-bridge-probe` row does exactly that. **P6.13 → P6.14 → P6.17 stands, and the probe rows do NOT get
a non-QA path** — that would ship a debug readout to real users, which is worse than a known,
last-and-smallest flip carrying its own green gate.

---

## ⏸ Waiting on Jason

✅ **Nothing is blocked on a DECISION** — the Phase 6 queue cleared 2026-08-20, **[D40]–[D48]** plus [D3].

✅ **The Apple portal for iCloud is DONE (🎯, 2026-08-20)** — signing is unblocked.

✅ **Sentry is wired too (🎯, 2026-08-20)** — DSN in the Codemagic `AppleConnect` group, project
`debt-planner` / `4511944380907520`, org `jason-snyder`, auth token already held from another app.

⏳ **IN FLIGHT: the [D48] batched build — signing PASSED.** 🎯 runs the device pass off
[`DEBT_DEVICE_PASS_2026-08-20.md`](DEBT_DEVICE_PASS_2026-08-20.md) (~20 min, 8 rows). ⭐ **Row 4 is the one
that matters** — decline the restore, onboard fresh, background, and confirm the remote is still the OLD
backup. Fixes → **P6.15**.

🔴 **Nothing is blocked. The next action is 🎯 triggering the [D48] batched Codemagic build** — it carries
P6.3 (iCloud) + P6.5 (Sentry capture) + P6.6 (the splash), and **all three are provable only on a device.**
⛔ **Source-map upload stays OFF for this one** ([`DEBT_SENTRY_SETUP.md`](DEBT_SENTRY_SETUP.md)): the upload
phase hard-fails the ARCHIVE, and worst-case-off is minified frames while worst-case-on is losing all three
verifications and another ~45-min cycle. ⏸ Owed only when it is switched on: the **org slug**.

**Owed off-device (yours, not decisions):** the ASC privacy label declaring RevenueCat *(→ P6.9)* · AU/NZ
availability · the App Review note naming the paywall path · the launch-FLIP value gate *(→ P6.21)*.

## 🎯 Reported from the app — found by USING it, not by the lane

| | Report | State |
|---|---|---|
| **R1** | Money's edit sheets had no date **picker** | ✅ **DONE.** `DateField` at all 4 sites. ⛔ Folded in: `todayLocalISO()` returned **yesterday** east of UTC. The fields had **zero** coverage before, which is why it shipped |
| **R3** | 🔴 **NEW 2026-08-20 — the demo strands an EXISTING user.** More → *Unlock Premium* → *"See it in action"* takes over with no clear way back to their own plan | **OPEN.** ⚡ **Mechanism, read not guessed — and my first reading was WRONG.** The paywall pushes `/demo?from=paywall`, which is the **explore** run, and explore has **no dock**; its only exit is `ExampleCanvasMarker`'s row. So an exit *does* exist on every screen. ⛔ **The defect is what it SAYS:** a caption-sized link reading **"Start my real plan"** → `exitDemo('/onboarding')`. To an onboarded user — **the paywall CTA's main audience** — that reads as *discard what I have and start over*, so the one way out looks destructive and nobody sane taps it. *(It is in fact safe: the route guard bounces an onboarded user straight to the tabs. The user cannot know that.)* ⚠️ Same shape as **R2**: the door exists and is built for the wrong audience. ✅ **FIXED 2026-08-20 (🎯: *"'Back to my plan' is more clear"*)** — the exit is labelled for who is reading it, and ⛔ **`tsc` then showed the defect ran deeper than the label**: `exitDemo` hard-routed **every** exit through `/onboarding` on the stated premise that *"a demo viewer has no plan yet"*. True of the Welcome door, false of the paywall door. `DemoExit` gained `'/'`, the returning user goes straight to their tabs, and `back_to_plan` is now its own funnel reason — a return is not a conversion. +2 e2e, plant-verified |
| **R2** | The expense set-aside is uncoachable · living expenses undiscoverable | ✅ **DONE = 3.8.** Both were the same fix. ⛔ The second half was **worse than reported**: the Money door existed but was gated on `livingTotal > 0`, so it showed only to users who had already found the feature |

⚡ **None of these was reachable by 4.1.** The lane checks that built behaviour keeps working; these are
*design* gaps. **No coverage split models "the app does the wrong thing correctly"** — using it is the only
instrument that finds them.

⛔ **R3 makes the point twice over.** `demo-containment.spec.ts` has **14 tests**, two of them aimed straight
at this path — *"the PAYWALL door — 'See it in action' reaches the demo"* and *"the EXPLORE run carries its
own way out, on whatever screen you wandered to"* — and **both pass while the exit is unusable.** They prove
an exit is *present and reachable*; neither asks what it **says** to the person reading it. ⚡ **A suite can
be exhaustive about the question it chose and silent about the one that matters** — and here the chosen
question ("is there a way out?") and the real one ("does it look like a way out, to me?") differ by one word.

---

## ⚠️ Open threads — each has an owner

✅ **The coach-mark defect, the transient Guardian card and §12.6.1 closed with the audit gate 2026-08-19** —
they were that gate's inputs, never separate threads.

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
| **—** | **Whole-app cohesion + best-in-class + wording audit gate** | ✅ **COMPLETE 2026-08-19** — T1–T8 + T3B, [D37] 55/55 high+ traceable, 3 new lint gates, e2e 184 → 195. Detail → log |
| **5** | **Data continuity + cutover** 🔒 | ✅ **COMPLETE 2026-08-19** — the full v1.6 bridge, 5.10 green, the migration **verified on a live device**, the cutover **conditionally approved**. Detail → log |
| **6** | **Launch-ready** — feature lock → three audit gates → delete legacy → device pass → submit | ▶ **ACTIVE** — decomposed as **P6.1–P6.21** at the top. Carries the 60 coverable-not-built rows and 3.5's folded-in pass as device-pass work |
| 6.5 | Repo consolidation *(was 5.5)* | inside Phase 6 as **P6.11** — deliberately last, and finished before the final build |

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

## 📋 P6.14 reference — the device-QA ledger

Verify on real hardware; web cannot cover these. **🎯 The runnable truth is
[`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](DEBT_3.5_DEVICE_QA_CHECKLIST.md)** — §11 · §12 · §13, plus the 60
coverable-not-built rows and 3.5's folded-in pass ([D35]). This is the index, not the list. ⚠️ Read figures
from [`audits/coverage-split.md`](audits/coverage-split.md), never from a doc quoting them.

**Owed from Phase 5 — fixed and unit-covered, never seen on a device** *(🎯 declined a CM build for them,
which is the right trade given this pass exists)*:
- Import a **v1.6 backup FILE** and confirm the restore does **not** land in onboarding *(`buildBackupData()`
  never emitted `hasCompletedOnboarding`; fixed at the root in `runMigrations`)*.
- The **document picker** — pick `v17-envelope.json` from **iCloud Drive**, not local; local would not
  exercise `copyToCacheDirectory`.
- The **`v16-damaged` repair report** naming *Visa · balance* and *Electric · amount*.

**Carried from the audit gate:** **[T3.2]'s storage-fault row** — force a storage fault, confirm the retry
screen renders **and** the retry recovers. Two T3 surfaces ship on unit assertions with no rendered proof.

**Also owed:** **A0.4** (payoff-schedule device re-verify) · **A8.4** (the Siri phrases, incl. the
load-bearing `\(.applicationName)` check) · **§3.1.2** SF Symbols on the min-iOS target · **§2.8** native
scan · **§2.11** RevenueCat real purchases + restore · **§3.3.1** the AHAP crescendo FEEL · **§VIS-2/B2**
share rasterizes fully · **§3.4** `expo-blur` real material · **§3.5** Live Activity / Island / widgets /
App Intents · **§3.6** iPad both orientations, Split View, Stage Manager, pointer/keyboard · **§VIS-6**
sound + notification delivery. Highest value single row: **§11.15**, the iPad ring-origin invariant.

⛔ **Five rows stay `[D]` for stated reasons, and they are forward guidance.** **§5.4 StandBy is
PERMANENT** — *"put the phone on a charger"* is physical state a simulator has no concept of. **§5.1**
(widget gallery) · **§5.3** (Lock-Screen Customize) · **§6a.2** (Island long-press, needs a 15/16 Pro sim) ·
**§10.3** (Stage Manager drag) each need their own probe first. ⚠️ The three `[A]` ⌘-key rows stay `[A]`.

- **⭐ [SUB-AUDIT] Premium-accessibility:** VoiceOver rotor + a full walk · Dynamic Type AX3/AX5 reflow ·
  reduce-motion · contrast both themes · focus order · touch targets. **WCAG 2.2 AA is the FLOOR.**
  - ⛔ **BOTH GUARDS COVER 2 OF THE 4 NATIVE-ONLY PROPS, AND THE MISSING TWO KEEP BITING.** eslint and
    `check-native-a11y-props.ts` ban `accessibilityElementsHidden|importantForAccessibility` but **not**
    `accessibilityValue` or `accessibilityState` — yet react-native-web drops all four identically. ⚡ **The
    guard written for one instance of the class does not cover the class.** ▶ Extend both; `accessibilityState`
    appears in **11 files**, so the conversion is this sub-audit's work.
  - ⚠️ **`CheckCircle` reports no checked state on WEB** · **`ListRow`'s swipe-to-delete announces a hidden
    Delete button on EVERY row** (a destructive control the user cannot see, once per row).
  - ⭐ **`hitRegion` = 2 real findings, on BOTH tiers** — two hit targets below the minimum, reproducible,
    *characterised* (`"Hit area is too small"`) and still *unlocated*: `compactDescription` does not name the
    element. `issue.element` can be added at low risk — ⛔ but the nightly answers it for free, so it is not
    worth a dedicated ~50-min dispatch.
- **⭐ [SUB-AUDIT] Performance-feel:** 120fps ProMotion · Skia redraw cost · cold-start TTI · list jank ·
  optimistic-UI feel. Includes the Today/cushion-forecast memoization check *(conditional on a real measured
  hotspot)* and Dynamic-Type device QA.

---

## Deferred backlog

**Product, re-decided in Phase 6:**
- ⚠️ **Show the backup's own date in the replace-confirm** *(5.8.4 after-scan)*. The summary says *what* is
  in the file but not *when* it was saved, and *"am I about to overwrite three months of work with something
  stale"* is the question a destructive confirm should answer. The envelope already carries `exportedAt` and
  a v1.6 file carries it too — it needs the `localDate` helper to render without tripping `lint:local-dates`.
  **Deferred, not dropped:** the confirm is already honest about *contents*, which is the correctness half.
  ⚠️ **P6.3 gave it a SECOND site** *(P6.3 after-scan)*: the iCloud restore confirm has the same gap, and the
  sheet already renders the file's mtime one line above it — so the value is in hand there and merely not
  carried into the warning. Fix both together or neither.
- ⚠️ **Retire `raw-v17` import acceptance** *(5.8.2 after-scan)* — the weakest of the three markers
  (`storeVersion` + `paycheck` + `debts`, no format id), and it exists only because the pre-5.8 clipboard
  export has no envelope. ⚡ The RN app has never shipped, so the only holders of a raw-v17 export are
  **TestFlight testers**, who can re-export after updating. **Re-decide at P6.4, with the tester window
  closed** — dropping it earlier would break testers' files for no gain.
- **📋 Real-device cloud testing — as DEVICE-MATRIX coverage, not a way to shrink the manual pass.** ⛔ It
  moves only **3–6** of the `[D]` rows. ⭐ The real gap it closes is that everything runs on **ONE sim
  config** — §11.1 says outright *"a wide phone can pass while an SE fails"*. ⚡ Maestro Cloud is the
  zero-rewrite path. **Triggers:** Android at v1.8, or the first width-driven bug that reaches a user.

**Tooling / hygiene:**
- ⚠️ **The APP ICON disagrees with its documented source** *(P6.6/[D51] measurement, 2026-08-20)*. Rasterising
  `render-icon2.html` and sampling the shipped `apps/rn/assets/icon.png`: the icon is **globally darker**
  (corners `#3b2d7e` → `#0a051c`, bars `#34d390` → `#1cad96`) and its **corner and 40px inset are identical**
  — the signature of a **baked-in squircle with a dark surround**. ⛔ That contradicts the icons README
  (*"full-bleed, no alpha, iOS masks the squircle"*), and a pre-masked icon gets masked **again** by iOS, so
  any inset shows as a **dark rim on the home screen**. **One second to check — look at a home screen** — and
  it is an App-Store-facing asset, so it wants an answer before submission rather than after.
- ⛔ **`scripts/*.ts` is typechecked by NOTHING** *(P6.2 after-scan)* — `typecheck` is core + rn, and the root
  tsconfig **excludes** `scripts` outright. Every `lint:*` gate and audit instrument — the code that decides
  whether the release gate passes — runs unchecked, and `tsx` does not typecheck. Needs its own tsconfig
  (the `.ts`-import-extension convention is why it was excluded). **Deferred:** tooling, not launch work;
  edits here get a hand `tsc` in the meantime.
- ⚠️ **Two `maestro test` calls write no JUnit**, so their verdicts never reach the durable record
  (`11-reduce-motion`, the iPad's dark re-run of `i02`). Harmless today — both are measurement runs — and
  the same hazard `maestro-results.mjs`'s header documents for flow `09`: **the next flow added in its own
  invocation disappears silently.** ⚠️ `lint:lane` is where this becomes a check.
- ⚠️ **The embed's public URL names the repo** — `jsnyde03.github.io/debt-app-v1/`. Fine for an iframe; a
  custom domain or a repo rename removes it. **A brand call with a DNS dependency** → 🎯 whenever the
  marketing page exists.
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

**Carried out of T4–T8 with NO recorded closure** — each was routed to a step that has since closed, and
none shows a closure in the log. ⛔ *An untraceable closure is indistinguishable from an open finding*, so
they are re-filed rather than assumed done:
- ⚠️ **`testFullAppRegression.ts:63`'s conservation assert holds only when the reserve FITS** — with an
  over-sized everyday reserve, `paycheckAmount − livingExpenseReserve` goes negative while the allocation
  sum floors at 0. Not exercised today → **P6.10**.
- ⚠️ **`AmortizationView` calls a BNPL's `bnplMonthlyEquivalentMinimum` "the minimum"** — it is a monthly
  *equivalent* of an installment minimum. Precision, not a lie → **P6.8**.
- ⚠️ **The timeline's cushion row label is unasserted** — `buildTimelineItems` pushes it and
  `TimelineLedger` renders it, but no spec reads it, so T4.3's rename there is unverified by the gate →
  **P6.4**.

**Genuinely a later version / tier:**
- **`typicalAmount` still has no UI** → the wording/cohesion gate.
- **The app never shows a debt-free date reflecting its own plan working** — on day one the starter EF
  absorbs the surplus, so every projected date is minimums-only. Honest per screen; the question is the
  app-wide effect → the cohesion audit, **not a defect**.
- **The paywall lead has NO e2e coverage** — it sits behind the live public embed and is pinned only by
  `paywallLead.test.ts`; no Playwright spec asserts any branch of it. → **P6.4**.
- **The demo's beat dwell may be too short for the runner** — decide from the 2fps contact sheet.
- **Apple Watch** → v1.8+ · **`@gorhom/bottom-sheet`** → v1.8 Android · **Behavioral mis-entry /
  persistent-cushion / bill-shock autopilot** → Connected/Plaid tier · **Holiday/promo free-trial** → a
  reversible later lever; launch is paywall-from-day-1 · **iOS-18 Control Center** [D1] · **web light-mode
  hover screenshots** *(a QA artifact, not product)*.

### ⭐ The 62 findings [D37] did not cover — FILED TO PHASE 6 (🎯 2026-08-19)

⛔ **The complete list is [`audits/2026-08-17-v1.7-audit-gate/REMAINING.md`](audits/2026-08-17-v1.7-audit-gate/REMAINING.md)**,
**generated** from the findings files (`tsx scripts/check-audit-closure.ts --remaining`) — never hand-maintained.
**41 minor · 21 polish.** Owned by **P6.4**, which is where the call on them is made; T12's ~40 polish
items belong to **P6.8**, the sweep.

⛔ **Why the generated list exists: 20 of the 62 were named in NO ledger at all** — not the plan, not the
log, not the refutations — because the T9–T11 lists below are *partial enumerations* and `lint:closure`
only ever gated blocker+major. **A sweep driven off T9–T11 would have silently dropped 20 findings**, 13 of
them L2 drift. `lint:closure` now REPORTS the low tier every run (never gates it — an untraced minor is the
expected state here, and a gate that reds on the expected state trains everyone to ignore it).

⚡ **Do NOT read it as 62 edits.** Measured: of the 61 cross-file copy duplicates, **24 are generic chrome**
(`Save`, `Cancel`, `Done`, `Add`, `Name`, `Back`) that repeat *by design* — "fixing" them is how L2-6's
suggested fix would have made five dead strings load-bearing — and **5 more involve `LiveActivityQA.tsx`,
which the `QA_TOOLS` flip deletes.** Several are already dead; more die with 5.5.1.

✅ **[D42], 2026-08-20 — the commitment is a BAR, not a COUNT.** All 62 get **judged** at **P6.4**; what
gets **fixed** is every defect and every finding on a surface that ships. ⛔ **Do not convert this back into
"clear all 62"** — 29 are known non-work, and L2-6 is the precedent for a "fix" that made five dead engine
strings load-bearing.

✅ **T9–T11 RETIRED as drivers, 2026-08-20 (P6.2)** — verified id by id: their 8 low-tier ids are all in
`REMAINING.md` and the 6 they called MAJOR are genuinely major, so they carry nothing it lacks. Their text
and reasoning → log. ⭐ **T10's dead-code verdicts still owe a re-check against the ROOT tree** → P6.11.

_Post-triage under the fold-don't-defer rule — only two carve-outs remain: **device-gated**, or **genuinely
a later version/tier**._

---

## Decisions

**Phase 6 — the launch decisions, all settled 2026-08-20 (🎯: *"Agree with your recs"*)**
- **[D47] ✅** — **iCloud backup is OPT-IN, default OFF, and offered once in-line.** [D41]'s claim is literally
  *"**Optional** iCloud backup"*, and **P6.9 has to prove that claim true** — an on-by-default copy of someone's
  finances leaving the device makes the privacy audit defend a position it does not have to hold. ⚠️ The cost is
  real and named: a backup nobody enables protects nobody, which is what the single prominent offer pays back.
  A fresh install still detects an existing blob and offers to restore. → **P6.3.3.6**.
- **[D48] ✅** — **ONE batched device build carries P6.3 + P6.5 + P6.6.** All three are device-only verifiable
  (signing/iCloud · Sentry capture on a real build · the splash), all three sit before P6.8, and a macOS cycle
  costs the same whether it verifies one or three. ⚠️ Residual: a signing failure has three suspects instead of
  one — mitigated by P6.3.3.1 introspecting the entitlements before the build is spent.
- **[D40] ✅** — **cloud backup uses the app's PRIVATE iCloud container, no passphrase.** A passphrase adds a
  *permanent* unrecoverable-backup failure mode to defend against a threat this product is not sold against;
  the container is already encrypted at rest and readable only by this app under this Apple ID. → **P6.3.3**.
- **[D41] ✅** — the privacy claim becomes ***"Your data never goes to our servers. Optional iCloud backup
  keeps it in your own Apple account."*** ⛔ **Never** *"end-to-end encrypted"* (false under [D40]) and never
  *"100% private"* again. → **P6.9** proves it literally.
- **[D42] ✅** — **P6.4 commits to a BAR, not a COUNT.** All 62 get judged; what gets fixed is every defect
  and every finding on a shipping surface. ⚡ A count would spend the pre-lock window on the 24 generic-chrome
  duplicates that repeat by design and the 5 rows the `QA_TOOLS` flip deletes.
- **[D43] ✅** — **the splash is the app icon on the icon's own dark background, no wordmark.** → **P6.6**.
- **[D44] ✅** — **a Pages deploy must assert its SHA has a green `web-e2e` run** and fail otherwise. → **P6.7**.
- **[D51] ✅ (🎯 2026-08-20)** — **the splash ships a LIGHT and a DARK variant, both showing the MARK rather
  than the app-icon badge.** 🎯: *"a light variant and dark variant would be more professional."* ⚡ **What
  made it possible: the icon has real SVG source**, so the mark renders *without* its background — the
  square-on-light problem that forced dark-only was an **artwork** limitation, not a design conclusion.
  ⚠️ Light inverts the trend line and check badge to the icon's own `#1A1442` and deepens the bar gradient,
  because the originals are invisible on `#e6ebf3`; both values come from the icon's palette. ⛔ **Supersedes
  the dark-only half of [D43]**, which is what the current build carries — **this needs the NEXT build**, and
  splash becomes a row on that pass. → P6.6.
- **[D50] ✅ (🎯 2026-08-20)** — **P6.6 + P6.5 run BEFORE P6.4**, out of the settled order, then the batched
  build; P6.4 runs while the build and device pass are in flight. ⚡ **Why:** the device pass is the
  longest-lead and least-provable thing left, P6.4 is in-app judgement that changes nothing about signing,
  splash or crash capture, and a signing failure surfaces now instead of after a day of P6.4. ⚠️ Neither is
  a feature, so landing them before feature lock costs nothing.
- **[D49] ✅ (2026-08-20)** — **a green gate is RECORDED BY THE GATE, never typed into a document.**
  `validate:release:rn` writes `gate-status.json` (SHA + UTC date) on success only; `lint:gate-freshness`
  reds when source files have changed since that SHA. ⚡ **The failure it kills:** the gate was red from
  `f4e5e11` to 2026-08-20 and three sessions recorded it green, each correctly reasoning *"no source touched
  **this session**"* over a tree where source HAD moved. ⛔ **A doc rule cannot fix this — a doc rule is what
  failed**; the record has to be unforgeable, which means written by the thing it describes. Same [D31] move
  as `lint:closure`: turn the class into a gate. ⚠️ Deliberately scoped to **source**, so a docs-only commit
  does not red. → **P6.7**.
- **[D45] ✅** — **the monorepo stays**; `apps/rn` is not promoted to root. → **P6.11.2 closed.**
- **[D46] ✅** — **the QA door is resolved by ORDERING:** `P6.13` (build, `QA_TOOLS` on) → `P6.14` (device
  pass) → `P6.17` (flip, own green gate). ⛔ The probe rows get **no** non-QA path — that ships a debug
  readout to users. ⚠️ Residual named: the shipping binary is not the device-passed binary.

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
- **[D39] ✅ (🎯 2026-08-19)** — **FEATURE LOCK ≠ FREEZE, and they happen at different times.** Lock lands
  after **"the 3.5 remainder" = T9–T11** (🎯 — one set, not two); freeze is later and stricter, every
  planned change landed. ⚡ **What it buys:** the FINISH sweep's structural-gap charter gets a **default
  answer** — after lock a structural gap defers to **2.1**, and only a defect or the completeness/polish of
  something already built is admitted. ⛔ **The boundary is a set that has not been re-measured** →
  **P6.2** regenerates it. Detail → log.
- **[D38] ✅ (🎯 2026-08-19)** — **this ships as `2.0.0`, not `1.7.x`.** ⚡ The argument is about the FUTURE:
  the version number is the baseline every later release is measured against, and a wrong baseline is
  permanent. ⚠️ **The internal name stays "the v1.7 Elevation."** Measured: nothing user-facing carries
  "1.7" and the shipped number is one field, `apps/rn/app.json` → `version`. → **P6.1**. Detail → log.
- **[D37] ✅ (🎯 2026-08-18)** — **every high+ finding is remediated this round**: all **55 of 117**
  blocker+major closed or explicitly refuted, each traceable to its finding id, and now enforced by
  `lint:closure` rather than by memory. ⛔ **Nothing is parked** — the minor/polish tier is SEQUENCED, not
  shelved → **P6.4**.
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

**Open:** none. **[D3] closed 2026-08-20** — the Money hero residual was answered by [D36] / 3.8.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Generated, always current:** [`audits/coverage-split.md`](audits/coverage-split.md) · `audits/strings-inventory.md` · `audits/surface-inventory.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
