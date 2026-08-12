# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — 4.1 · the Maestro coverage lane *(resumes; 3.7 is closed)*

✅ **3.7 CLOSED 2026-08-11.** Wave A (A0–A10) · Wave B (B.0–B.4) · Wave C merged into the audit gate.
Gate **167/167** + tsc clean, zero `error-context.md`. Wave B detail + its wave-level after-scan → log.

| # | Step | State |
|---|---|---|
| **4.1.3** | ✅ **DONE 2026-08-12** — the lane went **0/8 → 5/8**, and flow 01 (the seed everything depends on) is green. Both ledgered "known fixes" were refuted; the real causes were a **42.7 s first hierarchy snapshot** and a **sticky CTA stack covering the form fields**. Detail → log | ✅ |
| **4.1.3b** | **Flow ORDER is explicit** — the directory argument ran `01→05→02→06→03→08→07→04` (measured); Maestro specifies no ordering for a directory, so the suite was on unspecified behaviour and 04 ran after 07 wiped its seed | ✅ **DONE 2026-08-12.** Order held `01→…→08` across three runs; 04 green from this alone |
| **4.1.3a** | **Cache the built `.app`** — measured: prebuild + pods + compile = **17m03s of a 31m47s job**, and **648 of ~650 compiles are third-party pods** that change only with the lockfile. Skips all three when no app input changed, which is the whole 4.1.4→4.1.11 loop. ⛔ Guarded against the stale-binary hazard: exhaustive key · **no `restore-keys`** · provenance printed every run + into the artifact · tags and `rebuild:true` bypass it. Detail → log | ✅ **DONE + VERIFIED 2026-08-12** — run `31617084361` hit: restore 1s, verify 1s, prebuild/pods/build/save all SKIPPED. **17m03s → 2s.** Artifact also 364 MB → 17 MB |
| **4.1.4** | **`npm run lint:selectors`** — a flow is a claim about the app kept where the app never checks it. THREE enforced checks (ids exist · copy still exists · a typing flow must write-verify) + an advisory listing composed-label components whose text needs `.*`. In `lint:rn` → `validate:release:rn` | ✅ **DONE 2026-08-12.** All three proven to FAIL on planted defects before being trusted. ⚠️ Check ③ is weaker than its name suggested and was renamed to match; per-form scoping filed below. Scans → log |
| **4.1.4c′** | **Run `31626109780` produced NO reading — both failures were in the diagnostic, not the app.** ⛔ The probe was asserted **below the fold** (Developer/QA is More's last section; `scrollUntilVisible` was already proven in flows 02/05/06) and the **iPad tier was skipped** by an implicit `success()` on its own `if:`. ⚡ **A diagnostic run has to be authored for the world in which the thing it diagnoses is still broken.** Both fixed; re-dispatched | ⏳ **RUNNING** |
| **4.1.4c** | **The coach-mark PROBE** — five mechanisms asserted, four refuted, so this measures instead of fixing: a `qaEnabled()` readout of all five stages (`hook` · `layout` · `show`+guard · `measure` · `draw`), read by flow 08 **before** the assertion that aborts it. ⛔ **No fix rides it.** Folded in: `qaEnabled()` extracted — the guard was open-coded 3× and the Phase-6 flip is a `git grep` | ✅ **BUILT 2026-08-12**, gate 167/167. ⏳ Awaiting the run |
| **4.1.5.1** | **The iPad boot** — [D30]'s `device` workflow input (`iphone`/`ipad`/`both`) + the iPad-only `i01-ipad-boot.yaml`. Runs `01` (shared tier) then `i01` on the widest available iPad, `continue-on-error` because the deliverable is a hierarchy dump, not a verdict | ✅ **BUILT 2026-08-12.** ⏳ Awaiting the run |
| **4.1.5** | **The iPad boot, remainder** — §11.15 ⭐ · §11.16 · §10's two layout checks · §11.8's rotation half *(⚠️ rotation needs a probe first — unproven command)*. Design + evidence → log | |
| **4.1.6** | §12.0 explore (7 checks) | |
| **4.1.7** | **AX + theme conditions** — §11.1 · §11.5 · §8's half. ⚠️ Reduce Motion needs an app-side observable first | |
| **4.1.8** | §11's remainder — §11.9 · §11.13 · §11.11 | |
| **4.1.9** | **The Appium supplement** — §11.15 as numeric frame containment · §10's ⌘ keys · `autoAcceptAlerts` | |
| **4.1.10** | §12.1–§12.7 (15) — ⚠️ blocked on the deep-link door | |
| **4.1.11** | **Reconcile — the exit.** ⚠️ **[4.1.5.1 after-scan] the coverage split must NOT count measurement flows** — `lint:selectors` now reports **9 flows** because `i01-ipad-boot.yaml` is one, and it is explicitly not coverage (every assertion in it holds on both layouts by design). Any 68/127 re-derivation that counts files will overstate itself | |

⚠️ **[3.7.B.2] flow 07's onboarding walk now crosses one extra field** — `CompletionStep` gained the
optional name input above `"See My Plan  →"`. Nothing asserts it, but the CTA sits lower on a small sim;
if 07 regresses at that tap, this is why.

**Exit** *(🎯 "confident enough to move on")* — unchanged, → log.

---

## ✅ CLOSED — Phase 3.7, the fold-in block

✅ **Wave A** (A.0–A.10) and ✅ **Wave B** (B.0–B.4), both closed 2026-08-11. Wave C merged into the
audit gate. Detail + both wave-level after-scans → log.

⚡ **The number both waves produced, and the reason B.0 existed: a pre-authored ledger item is wrong
about as often as it is right.** Wave A — of 14 items, **5 did not exist and 4 more were materially
misdescribed** (one *inverted*). Wave B — of 4 items, **1 refuted outright, 1 half-shipped already, 1
wrong in 3 of its 4 stated premises, 1 clean.** The before-scan is now paid for twice.

⚠️ **A0.4** (payoff-schedule device re-verify) and **A8.4** (the Siri phrase work — incl. the
load-bearing `\(.applicationName)` check) stay device-owed → the checklist.

---

### ⏭ Then, in order

1. **3.5.7 — the marketing embed** *(🎯 needs hosting + the privacy stance)*
2. **The audit gate** — whole-app cohesion + best-in-class + wording/voice *(Wave C merges in here)*
3. **Phase 5** (data continuity, ship-blocker) → **5.5** (repo consolidation) → **Phase 6** (launch)

### ⏸ Waiting on Jason

- **Cut the CodeMagic build** — workflow *"Debt Planner RN — iOS TestFlight"*, branch `v1.7-dev`. ⚠️ The device build `c050173`/3.6.1 is **stale by a whole phase.** Then run `DEBT_3.5_DEVICE_QA_CHECKLIST.md` — **§11.15 first.**
- **3.5.7's hosting + privacy specifics** (the *when* is settled: after 3.7).
- **[D2]** `minimumPaidThisCycle` ownership — gates B4. · **[D3]** Money hero language. · **[D1]** Control Center (rec: stay deferred).

### ⚠️ Open defects

- **⛔ [4.1.3] The `debt-row-actions` coach mark never appears — STILL OPEN. Run `31621553581` REFUTED the subscription-race fix** *(still red at `.*Press and hold a debt.*`; the replay change was kept — a late subscriber SHOULD still learn, and 167/167 says it costs nothing)*. ⚡ **The race is now eliminated as a cause, which is clean information because the meaning of a red was written down before the run.** ▶ **NEXT SUSPECT, already located:** `CoachMarkLayer.tsx:68` returns null when `targets.measure()` resolves null, while `coachMarks.ts:92` records the mark as offered **before** any of that — so it would **burn itself without ever drawing**, which fits every observation including why no reset ever helped. **Check `measure()` on a list row first** (`tutorialTargets.tsx:88` bails when the node has no `measureInWindow`; there is also a timeout path that resolves null). ⚠️ **Five mechanisms have now been asserted here and four refuted — probe it, do not reason at it.** A **product** defect: flow 01's `smoke-seeded-portfolio` screenshot is a fresh install on Money with three debts, every `show()` guard clean, and **no mark**. ⚡ Identified by CONTRAST, not narrative: `trajectory-scrub` is offered unconditionally and renders (proven on web, `a11y-axe.spec.ts:137`); `debt-row-actions` is the only mark whose `ready` is **data-gated**, and the only one that never fires — so a late subscriber missed the row's single `onLayout`. `subscribe` now replays. **Class fix**: any future mark gated on loaded data had it. ⚠️ **If still red, the next suspect is `CoachMarkLayer:68`** — it renders nothing when `measure()` resolves null, while `show()` has already recorded the mark as offered at `:92`, so it would burn without drawing. Deliberately NOT fixed at the same time: two speculative fixes make a green run uninformative.
- **⚠️ [4.1.4c before-scan] `SectionList`'s `index` is per-SECTION, so `debt-row-actions` can register TWICE.** `money.tsx:377` wraps `index === 0`, which is also the first **PAID OFF** row — two `TutorialTarget`s sharing one registry key, and the Map keeps whichever laid out last. The comment at `:374-376` anticipated exactly this hazard for rows and missed sections. **Latent** (needs a paid-off debt; the failing flows have none), so **not** the mark's current defect and deliberately not fixed on the probe run. One-line scope: gate on the active section too.
- **⚡ [4.1.4c before-scan] This mark is unobservable to EVERY automated surface except an iOS sim run** — `Platform.OS === 'ios'` (`money.tsx:259`) puts it out of reach of the web e2e and the app-layer runner, and `phase35-themes.shot.ts:106` already records that. It is why the defect shipped, and it is the argument for instrumenting rather than guessing a sixth time.
- **⚡ [4.1.3] A pref changed and then force-quit within 500 ms is LOST.** `persistence.ts:14` debounces the autosave by 500 ms, and `flushPendingSave` (`_layout.tsx:103`) only fires on AppState *background* — a force-quit sends no such event. Narrow, but it is silent data loss on a setting the user watched confirm itself on screen. **Measured, not theorised:** it is what made flow 08's coach-mark reset evaporate across a `killApp`. Fix is to flush critical prefs immediately rather than on the debounce → **Phase 5** (data continuity), which owns durability.

- **A transient `$790` on Today's arrival** during the demo — a half-rendered Guardian card for ~0.5s at beat 2. Now **user-facing** under [D21], not just a store-video concern. Settle before the asset is cut.

**Gate:** `validate:release:rn` — **167/167 + tsc clean on BOTH trees** *(158 → 167 across Wave B)*, zero `error-context.md`. CI runs
it on every push. ⚠️ It gained `typecheck:core` + `typecheck:rn` on 2026-08-11; before that it ran no
`tsc` at all.
**Env:** `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` + `serve apps/rn/dist -l 4319 -s` · e2e `npm run test:e2e:rn`. ⚠️ Capture-pipeline and H.264-inspection recipes → log §"Working notes".

---

## Phases — status

| Phase | Scope | Status |
|---|---|---|
| 0–3 | Design foundation · surface · premium substance · delight + native | ✅ COMPLETE |
| 3.5 | Interactive tutorial + bounded demo | **BUILD COMPLETE**; 3.5.7 + the device pass remain (below) |
| 3.7 | Fold-in block (ledger clearance) | ✅ COMPLETE 2026-08-11 (Waves A + B; C merged into the audit gate) |
| — | Whole-app cohesion + best-in-class + wording audit gate | after 3.7 |
| **4** | **Quality (test harness)** | **▶ ACTIVE.** 4.1.3 · 3a · 3b · 4 done; lane at **7/8**. Next: **4.1.5** (iPad, [D30]) |
| 5 | Data continuity + cutover | 🔒 ship-blocker, upcoming |
| 5.5 | Repo consolidation | before the release gate |
| 6 | Launch-ready | final |

**Phase 0–3 detail → the log.** Canonical specs → Reference docs at the foot of this file.

### ⚠️ Standing constraints

- **Native version pins — do NOT bump:** `react-native-ios-context-menu@3.1.3` EXACT (3.2.x ships broken) · `react-native-ios-utilities ^5.2.0`.
- **v1.7 ships as ONE release.** Nothing launches until Phase 6 is done and Jason is satisfied.
- **`QA_TOOLS = true` ships in TestFlight and MUST be flipped false before submission** (`git grep QA_TOOLS`). It is what makes the demo reachable at all.
- **Never push to `release/v1`** — it is the default branch and is gated on a live, approved version.
- **House voice:** the Guardian is the sole first-person "I"; everything else is direct "you".

---

## Phase 3.5 — what is LEFT

The build is complete (tutorial · bounded demo · coach-marks · capture pipeline). **The phase is not
signed off, because its OUTPUT is not final:**

| | Item | State |
|---|---|---|
| 1 | **3.5.7 — web-embeddable marketing demo** | the only unbuilt build item. After 3.7. ⛔ Does **not** wait on the device pass — the embed is live code, the App Preview is a frozen video, and the device pass verifies native behaviour a browser does not have. It waits on the debt-free-date defect, hosting/privacy, and the web-only `Slider` a11y gap |
| 2 | **The device pass** | `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 walkthrough · §12 demo · §13 coach-marks, against the fresh build |
| 3 | **3.5.9 — reinstate the demo ✅ DONE 2026-08-10** | [D21] reverses [D19]. `isDemoReachable()` no longer rides `QA_TOOLS`; both doors restored and now **tested** — nothing covered them before, which is how they were pulled unnoticed. Log: 3.5.9 |
| 5 | **3.5.10 — the INTERACTIVE demo ✅ DONE 2026-08-11** | 🎯 **[D23]**: the demo is now two runs. **`explore`** (a user: live tabs, no script, exit on the marker row) · **`scripted`** (the App-Preview + 3.5.7's embed only). One artifact had been doing both jobs and the video's requirements won. ⚠️ `useInBoundedRun` was deliberately **not** forked — a separate `useNavigationHeld()` answers the other question. Gate 158/158. Log: 3.5.10 |
| 4 | **The App-Preview asset must be RE-SHOT** | the pipeline is proven and cycle 14 approved, but the submitted file is shot after the UI settles → Phase 6 |

**Division of labour, now settled:** demo = BEFORE you commit (Welcome + paywall, sandboxed, terminal
exits) · walkthrough = AFTER onboarding, on your own money.

**Restraint that still governs the tutorial/demo:** no Tier-3 spectacle, confetti or sound · no
gamification chrome · Recovery stays a glimpse · the in-app tutorial stays ≤7 beats.

---

## Phase 3.7 — the fold-in block ▶ ACTIVE

_Standing rule (Jason 2026-07-30): stop deferring — if an item needs no device pass and can land in v1.7,
fold it in. Runs after 3.5 and BEFORE the audit gate, so the audit reviews the final state._

✅ **Wave A — correctness / honesty. CLOSED 2026-08-11.** A0–A10: the payoff-schedule redesign, the two
undercounts, the seven-item Guardian honesty ledger, the BNPL seam, the offline Lifetime mislabel, drift
type hygiene, and the Siri phrases. Gate 158/158, tsc clean. **Detail + the wave-level after-scan → log.**

**Wave B — features that belong in v1.7** *(decomposed at the top of this file)*. ✅ B.0 before-scanned
it 2026-08-11: **B1 refuted · B2 half-shipped · B3 real but mis-sequenced · B4 real with 3 of 4 premises
wrong.** [D26]–[D29] are open on the survivors.

**Wave C — coherence sweeps, MERGED INTO the audit gate:** C1 cents-formatter · C2 gold usage · C3 Money
hero language [D3] · C4 paywall copy · C5 chart VO labels · C6 iPad More two-column · C7 dead code
(`ProgressRing`/`MilestonesRow`, orphaned `guardianIntroSeen`, `FormSheet.headerAction`) ⛔ *`computeStreak`
came OFF this list at B.3 — [D27] ported it, so it now has a live RN reader* · C8 web scan
entry · C9 `router.back()` cold-entry sweep · C10 doc disambiguation of the overloaded "3.5.3.x".

---

## Audit tooling — the instruments the gate runs ON _( [D31] )_

_Built during 4.1's CI waits, not instead of it. Each one turns an expensive read into a cheap lookup._

| | Instrument | State |
|---|---|---|
| **T1** | **`npm run audit:strings`** → `docs/audits/strings-inventory.md` — every user-facing string, by file, **plus the cross-file duplicate sweep**. The wording gate's input. | ✅ **DONE 2026-08-12.** 793 copy · 210 cross-file duplicates · 923 unclassified, listed not dropped. Detail + both scans → log |
| **T2** | **`npm run lint:copy`** — a NEW copy phrase of **20+ chars** in two files fails `validate:release:rn`. ⚡ **The first audit finding to become a GATE rather than a report** ([D31]: a finding that becomes a test is paid for once) | ✅ **DONE 2026-08-12.** 11 baselined via `-- --update-baseline`, following the `webkit-flex-controls-baseline` precedent. ⚠️ Threshold **measured** (74 dups at any length → 9 at ≥20), and **the gate was proven to FAIL** on a planted duplicate before being trusted. Scans → log |
| **T3** | **The proxy-gate sweep** — every ternary that selects between COPY, printed next to the condition that selects it. One question per row: *does the gate establish what the words assert, or merely correlate?* | ✅ **DONE 2026-08-12.** **77 of 179** gates carry copy. ⚡ **Validated by reproducing the defect it was built from** as one row: `DebtSheet.tsx:238 · prefill · "Add from scan" / "Add a debt"`. Folded into T1's script — a second walker would be "two places, one rule". Scans → log |
| **T4** | **`npm run audit:surfaces`** → `docs/audits/surface-inventory.md` — per screen, TRANSITIVELY, which `ui` primitives and which money formatter it reaches. The cohesion gate's input | ✅ **DONE 2026-08-12.** 15 surfaces · **4 reach BOTH `formatCurrency` and `formatWhole`** *(C1 as data, not a hunch)* · 6 single-use primitives *(C7)*. ⚠️ Reachability, not rendering. Scans → log |

⛔ **CORRECTED 2026-08-12 by W1's before-scan — "210 duplicates" overstated the wording gate's input by
~2×.** Measured from the JSON sidecar: **210 cross-file duplicates, of which 110 are copy-bearing and 100
are not copy at all** (`space-between`, `decimal-pad`, `chevron-right`, `/paywall`, `optional_goal`…).
⚡ The cause is a one-line inconsistency inside T1: the **T2 gate** filters `bucket === 'copy'`
(`strings-inventory.ts:317`), the **report section** does not (`:292`) — and the script's own comment at
`:389` already states the rule it breaks (*"reuses one classification instead of inventing a second
heuristic"*). The 928 unclassified still stand as a classification pass.

## ▶ INTERIM BUILD — W1 · the duplicate-copy triage _(while 4.1.4c's run `31626109780` is in flight)_

| # | Step | State |
|---|---|---|
| **W1.1** | Scope T1's duplicate section to copy-bearing duplicates + annotate buckets | ✅ **DONE 2026-08-12** — 110 of 210. T2's gate deliberately untouched (11 baselined, still green) |
| **W1.2** | Triage the 110 → [`2026-08-12-duplicate-copy-triage.md`](audits/2026-08-12-duplicate-copy-triage.md) | ✅ **DONE 2026-08-12.** 4 extract-clusters · 3 leave-groups · 11 to the gate. ⭐ **Found a live defect** *(cluster 2)* |
| **W1.3** | **[DECISION]** which extractions fold into v1.7 | ✅ **ALL FOUR CLUSTERS, 2026-08-12 (🎯 Jason).** `one-time` standardised on **"One-time"**; the choice itself is flagged to the wording gate |
| **W1.4** | Execute the extractions, re-run the gate | ✅ **DONE 2026-08-12.** Two authorities — `paycheckForm.ts` · `obligationForm.ts`. Copy duplicates **110 → 83**, copy sites **794 → 740**, T2 baseline **11 → 5**. Gate 167/167 |

⭐ **[W1.2] A SHIPPED wording defect, not a latent duplicate — `one-time` has two user-facing spellings.**
A user sets a bill to **"One time"** (`ExpenseSheet.tsx:19`) and Money files it under a heading called
**"One-time"** (`money.tsx:631`, matching `DebtSheet.tsx:46`). One object, two spellings, one screen apart.

⚠️ **[W1.2] T1 over-reports the `copy` bucket two ways** — `key:label` when the value is a **hex chart
tone** (`CashFlowSection.tsx:28`, 6 colours) and `return` when the function returns an **enum union**
(`computeState.ts:33/49/54`). Matters because 794 "copy" is the wording gate's scope claim → folds into
the 928-unclassified classification pass, which is the same lens pointed the other way.

⚡ **[W1.4 after-scan] The SHRINKING BASELINE is what caught my own misses.** Regenerating T2's baseline
after the extraction left 4 stale entries and 0 fresh — and two of them were strings I thought I had
de-duplicated: a **fifth** site for *"Enter an amount greater than 0."* (`WindfallSheet.tsx:61`, absent
from my triage list) and the lean-floor footnote still written twice. ⚡ **A gate whose baseline only ever
grows cannot do this.** Both fixed; baseline now 5, and every survivor is something the triage
deliberately left.

⚠️ **[W1.4 after-scan] A SECOND live divergence, kept on purpose and now stated** — the identical
"no amount entered" condition reads *"Enter your paycheck amount **to continue**."* in onboarding and
*"Enter your paycheck amount."* in the sheet. Defensible (a step in a flow may say "to continue"), so it
stays per-host with the reason written down → confirm at the wording gate.

⚠️ **[W1.4 after-scan] The repo is CRLF, and multi-line codemods must normalise.** My first rewrite pass
silently matched nothing on every multi-line pattern while single-line ones succeeded — a partial edit that
typechecked. Normalise to LF, replace, restore. → working notes.

**Exit:** ✅ the wording gate opens on a filtered, triaged list instead of a raw 210.

## Audit gate — whole-app _(after 3.7, before Phase 5)_

- [ ] **Cohesion** — the same adversarial rigor for the ENTIRE app (Phases 0–3.7), criterion: does every element work TOGETHER? Cross-surface voice · visual · motion · numbers.
  - ⚠️ **[3.7.A.3 after-scan] `selectWhatIf*` bypasses the debt-free-date funnel** — it calls `projectDebtPayoff` directly rather than going through `selectDebtFreeDate`. Correct today (a deliberate alternate scenario), and a trap: **if the funnel ever gains a guard, a floor or a rounding rule, What-If silently will not have it.** Nothing to fix yet — check it here.
- [ ] **Best-in-class enhancement pass** — aspirational, app-wide: is each surface genuinely top-of-class, and what makes it unforgettable? Benchmark vs category leaders; restraint, not fireworks.
  - ⚠️ **[4.1.3 after-scan] The onboarding debt step hides its own fields behind the keyboard.** With the pad up on a small screen, balance / minimum / APR are clipped out of `OnboardingLayout`'s ScrollView by the sticky CTA stack — the user must scroll, unprompted, on the app's **first data-entry screen**. The KAV's own comment shows only the CTA case was considered; the standard remedy (`automaticallyAdjustKeyboardInsets`, or scrolling the focused input into view) is absent. Measured on the sim, severity to be judged on device.
- [ ] **Wording / voice** — every user-facing string, both tiers, all states, against the house voice. Absorbs Wave C's copy items.
  - ⚠️ **[3.7.A3.1 after-scan] Sweep every Guardian affordance for a PROXY gate.** A3.1's defect class: an affordance that promises an **outcome** ("I'll hold a smaller safety net") was gated on a **proxy** (a cycle count), so it could promise and deliver zero. Check the siblings — `selectReserveRelease` · `selectReserveWalkback` · `selectRiskAcknowledgment` · `selectTrialConversion` · `selectGuardianProofOfWork` — for the same shape: **is each gated on the thing it claims, or on something that merely correlates with it?**
  - ⚡ **[3.7.A3.6 after-scan] …and for a CAPPED OUTCOME — the second shape of the same family.** Not a proxy gate: the gate is right, but the **resource is bounded**, so the affordance delivers less than it promised. `selectTightTopUp`/`coverFromSavings` claimed "holds your line" while `Math.min(gap, balance)` capped the draw short (fixed in A.6 via `holdsLine`). Sweep for the pattern: **any copy asserting a completed outcome over a value that is `Math.min`'d, clamped or floored.**
  - ⚡ **[Wave-A after-scan] "Two places, one rule" hit THREE times in one wave** — A6a (two debt shapes in one directory), A5 (the premium ternary on two screens), A3.6 (one claim in four strings). Each was fixed by extracting a single authority (`PayoffSimDebt`, `premiumKind`, `holdsLine`). Sweep for the shape: **a rule re-derived at each call site rather than owned once.** Agreeing copies are still copies — they just haven't diverged yet.
  - ⚠️ **[4.1.3 after-scan] The mis-file rescue's STRINGS are owed here.** The mechanism is fixed (the sheet no longer claims a scan on the convert path — it was gated on `prefill`, which A10 gave a second producer), but *"Moving this from Expenses. Add the balance so it counts toward your debt-free date."* is **my placeholder**, not house voice. Decide it here, with [D22d]'s "bills" vernacular.
  - ⚠️ **[3.7.B.2 after-scan] The greeting's STRINGS are owed here** *(per [D26])* — the three band words, the band boundaries as a product choice, the onboarding ask ("What should we call you? (optional)") and More's "Used to greet you on Today". Also decide whether the name belongs anywhere ELSE it is currently absent (notifications, the finale, the Guardian's address) — it is one pref and every surface can read it.
  - ⚠️ **[Wave-A after-scan] A STALE COMMENT GENERATED FALSE WORK.** `testClassifyDeferability`'s header described the opposite of its own assertions, and A3.7 was filed matching the header rather than the code — an inverted defect that would have made a discretionary purchase *less* cuttable. This is 3.5's defect class ③ ("two records of one thing, drifting") with a measured consequence. **Docs that disagree with adjacent code are not cosmetic; they manufacture defects.**

⚡ **Input from 3.5's phase after-scan — three defect classes to hunt at scale:** ① an assertion that
passes either way ② evidence cited but never committed ③ two records of one thing, drifting. All three are
**a claim kept somewhere other than where it is checked.**

⛔ **"All three audits fan out on Fable 5" is RETIRED — see [D31].** 🎯 Jason 2026-08-12: *"that's very
very expensive and eats up my session time within like 20 minutes."* The method is now: **scripted lenses
where the question is deterministic · a GENERATED artifact as the agent's input, never the raw codebase ·
cheap models for extraction, the expensive tier only for judgement on a pre-filtered set · run
out-of-session with incremental writes.** ✅ First instrument built 2026-08-12: **`npm run audit:strings`**
→ `docs/audits/strings-inventory.md`, the wording gate's input.

---

## Phase 4 — Quality

- **4.1 — the Maestro coverage lane ⏸ PAUSED at 4.1.3** *(🎯 3.7 finishes first)*. 68 of the device checklist's 127 real checks onto the free GH-Actions sim lane. ⚠️ **The native lane is RED until 4.1.3's repair is verified** — the suite had been broken since 2026-08-10 and green-by-never-running. Audit: [`2026-08-11-maestro-coverage/`](audits/2026-08-11-maestro-coverage/README.md); step-by-step + the exit criterion → log.
- ✅ Largely delivered by the RS baseline (tsx app-layer harness · core engine fuzz · RN-web e2e), green-gated by `validate:release:rn`.
- **Residual coverage:** `testEngineFuzz` → `holdbackComposition` · RN e2e for missed/stale/debt-free states + a mobile viewport · app-layer CRUD coverage.
- **e2e harness race:** `webServer` re-exports and spawns its own `serve` on :4319, racing a hand-started one. ⚠️ Corollary: `reuseExistingServer` reusing a STALE serve serves an OUTDATED `dist` — force a fresh `export:web` when adding a route.
- **⚠️ The intermittent RECURRED — twice now, and it is no longer "one":** `tutorial-invite › the tabs are held while a session is running`. 2026-08-10 in CI (1 red in 25, on a commit that changed a 4pt margin) and **2026-08-11 locally** during Wave B's close. Both times the session had ENDED when the test expected it running; both times a re-run of the spec alone passed (33/33), so it is timing, not state. Not the port-4319 hazard. **The question is what ends a session early** — and it now has two data points instead of one. → 4.1.11's reconcile, or sooner if it reds a third time.
- **Known web-e2e limits:** cannot reliably drive gestures, `SectionList` row taps, or stacked modals → prefer seed + deep-link; push gesture flows to Maestro/device.

## Phase 5 — Data continuity + cutover 🔒 ship-blocker

The migration bridge (WKWebView `localStorage` → RN storage), **proven on a real populated upgraded
device**, then cutover to the RN app as the shipping app.
- **⭐ [AUDIT GATE] Adversarial migration/upgrade audit — the EXIT gate, no cutover until green.** Every prior data shape: v1–v6 schemas · partial/corrupt/empty/huge portfolios · malformed dates & numbers · mid-migration interruption. Upgrade data-loss is catastrophic AND irreversible.
- **⭐ E2EE iCloud backup** — native iCloud/document-picker/share-sheet restore over the existing store serialization. NOT premium-gated ("never lose your data" is a baseline). ✅ Proven template: Freedom v1's `ICLOUD_BACKUP_SETUP.md` + `cloudBackup.ts`. ⚠️ Also **replace the paste-JSON import** with a real file picker (`BackupSheets.tsx` is text-only today, and its own comment calls the file flow the intended upgrade) — 🎯 Jason 2026-08-10 reported it and scoped it here.
- **⚠️ [3.7.A10.6] Run the mis-filed-obligation detector over MIGRATED data.** v1.6's Capacitor app offered **"Credit Card Payment"** and **"Loan Payment"** as one-tap BILL presets (`packages/core/constants/requiredExpensePresets.ts:10-59`, still wired into the legacy `AddExpenseModal`), so upgrading users arrive with debts already filed as expenses — and their debt-free date silently omits them. `looksLikeDebt()` + `convertExpenseToDebt()` already exist (3.7.A10.2); the bridge has to *use* them, because the Money-page hint only reaches someone who happens to open that list. **This is the largest affected population in the app.**
- **Drop two INERT persisted prefs with the migration** — `prefs.isDemoMode` and `prefs.guardianIntroSeen`.

## Phase 5.5 — Repo consolidation

- **5.5.1** remove the root Capacitor/Next surface (God-files · `ios/` Capacitor bits · `next.config` · WebView glue). Also retires `validate:release:legacy`, the root Next lint, the legacy `debtPlanner.isDemoMode` test references, and `tests/visual/*.cjs`.
- **5.5.2 [DECISION]** final repo structure — promote `apps/rn` to root vs keep the monorepo *(rec: keep it; `packages/core` is shared portfolio-wide)*.
- **5.5.3** tooling / CI / docs to the consolidated tree. Includes **splitting `DEBT_ELEVATION_LOG.md`** (~4k lines, past one-pass readability).
- ✅ **5.5.4 DONE EARLY** — `apps/rn` has its own `eslint-config-expo`.
- ⚠️ Verify scope against the CURRENT tree at switch-in — pre-authored cleanup drifts.

## Phase 6 — Launch-ready

Acquisition-grade store presence · cold-start excellence · the device-QA gate · submit.

- **⭐ [AUDIT GATE] Pre-Release Best-in-Class FINISH sweep — runs FIRST, on the FROZEN app.** Every screen · sheet · card · state · both themes · iPhone/iPad/Split-View · Dynamic Type. Lenses: truncation · copy · premium bar · theme parity · state completeness · cross-surface consistency · layout · tap targets · a11y · motion · honesty. Complements, not replaces, the after-3.7 gate.
- **⭐ [AUDIT GATE] Privacy / data-flow audit** — trace EVERY egress and prove "financial data never leaves your device" is literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs.
- **⭐ [AUDIT GATE] Pre-submit functional-correctness audit + FINANCIAL-CORRECTNESS money lens** — boundary inputs across the engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle stepping · cross-cadence BNPL · huge/partial portfolios.
- ✅ **SHIP-BLOCKER RETIRED 2026-08-11 (A.0)** — the Home-Screen name is **"Debt Planner"** via `ios.infoPlist.CFBundleDisplayName`. ⚠️ `expo.name` deliberately stays `"Debt Planner (RN)"`: it derives the Xcode project name, hardcoded 10× across three pipelines. ⛔ **The old wording said "Home Screen + App Store name" — the App Store name is set in App Store Connect and was never in this file.** ⏳ Confirm on the next build (checklist §1).
- **⚠️ SHIP-BLOCKER · flip `QA_TOOLS` to false** (see Standing constraints).
- **Sentry — scaffold done; Phase 6 = flip it on:** set `EXPO_PUBLIC_SENTRY_DSN`, CI source-map care, verify capture on a real build, add a `beforeBreadcrumb` PII scrub.
- **App-Preview asset** — re-shoot off the proven pipeline once the UI is frozen. Apple takes ONE 886×1920 file, 15–30s, ≤30fps.
- **AU/NZ availability + E2EE trust-claim verification** — verify the Apple ADP-status API exists, or fall back to honest "encrypted iCloud backup" wording.
- **App Review paywall-findability** (v1.1 was rejected repeatedly) — the ASC notes MUST say "Tap ••• More → Unlock Premium."
- **Owed off-device (Jason):** ASC privacy label declares RevenueCat · marketing "100% private" alignment · the launch-FLIP value gate.

**📋 Device-QA ledger — verify on real hardware; web cannot cover these:**
- **🎯 ALL of Phase 3.5's device debt → `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §11 · §12 · §13.** That file is the runnable truth; this is the index. Highest value: **§11.15**, the iPad ring-origin invariant, which nothing automated can hold.
- **⭐ [SUB-AUDIT] Premium-accessibility:** VoiceOver rotor + a full walk · Dynamic Type AX3/AX5 reflow · reduce-motion · contrast both themes · focus order · touch targets. WCAG 2.2 AA is the FLOOR.
  - ⚠️ **[3.7.B.4] `ListRow`'s swipe-to-delete announces a hidden Delete button on EVERY row.** Its action pane is mounted whether or not the row is open and carries `accessibilityRole="button"` + `Delete {title}` with no a11y guard — so VoiceOver offers a destructive control the user cannot see, once per row. B.4's swipe-to-mark-paid hit the same shape and fixed it (`a11yHidden` + `useInert`, released on open); `ListRow` predates that and was **not** touched. Same fix, but it is a live list of destructive actions → verify on device before changing.
  - ⚠️ **[3.7.B.4] `CheckCircle` reports no checked state on WEB.** It sets `accessibilityState={{ checked }}` and react-native-web does not render `aria-checked` — measured, and it is the exact prop-allowlist trap `utils/a11y.ts` documents. Native is **unverified**: `accessibilityState` is expected to work on iOS, so this may be web-only (like the `Slider` gap) or may not. **Check it with VoiceOver here** — a checkbox that never says whether it is checked is an AA failure, and it matters on web the moment 3.5.7's embed ships.
- **⭐ [SUB-AUDIT] Performance-feel:** 120fps ProMotion · Skia redraw cost · cold-start TTI · list jank · optimistic-UI feel. Includes the Today/cushion-forecast memoization check.
- **§3.1.2** SF Symbols on the min-iOS target (some are iOS-16+) · **§2.8** native scan (Vision autolink, OCR quality, camera permission) · **§2.11** RevenueCat real purchases + restore + offering marked current · **§3.3.1** the AHAP crescendo FEEL + celebration · **§VIS-2/B2** share on all three surfaces rasterizes fully · **§3.4** `expo-blur` real material + gesture touch + detent haptics · **§3.5** Live Activity / Dynamic Island / widgets / App Intents / App Group · **§3.6** iPad both orientations, Split View, Stage Manager, pointer/keyboard · **§VIS-6** sound + notification delivery.
- Native Skia render + draw-on motion on all surfaces · `boxShadow`+`overflow:hidden` native clip · `<Motion>`/`<CountUp>` native runtime.

---

## Deferred backlog

_Post-triage under the fold-don't-defer rule — only two carve-outs remain: **device-gated**, or **genuinely
a later version/tier**._

**Device-gated → the Phase-6 pass:** Today/cushion-forecast selector memoization *(conditional on a real
measured hotspot)* — ⚠️ **A3.1 added one extra allocation** on Today whenever the discovery hold is active
(the attestation counterfactual). Cheap, and the current store's allocation is already memoised, but it
belongs on this ledger · Dynamic-Type device QA.

**Engine structure:**
- **⚠️ [3.7.B.1] The core bulk paths still write pre-[D2] paid semantics.** `bulkMarkRequired.ts` sets
  `isPaidThisCycle: true` on a debt whose **minimum** was covered — which [D2] reserves for paid in full.
  **Inert today** (measured: no debt reader in either tree keys on that field alone; all fall back
  `minimumPaidThisCycle ?? isPaidThisCycle`), and pinned by `testMarksDebtMinimumsBothFlags`. It is a false
  assertion in **data Phase 5 migrates**, and unpinning it is an engine-semantics change → **the Phase-6
  financial-correctness gate.** *(`bulkMarkRequiredPaid` is legacy-only and dies at 5.5.1;
  `applyRequiredReconciliation` is the live one.)*
- **⚡ [3.7.A3.6 after-scan] `appliedTopUp` is a manual-opt-in invariant.** Cash moved from savings this
  cycle lives only in `store.cycleTopUp` — the allocation never sees it, so **every** cushion reader has to
  remember `+ appliedTopUp(store)`. Three readers exist; two had it, `selectAffordability` did not (A.6's
  double-count). The next reader will miss it too. Structural fix: fold the top-up into the allocation so
  it cannot be forgotten — **engine-wide blast radius, so not a Wave-A item.** → the Phase-6 financial-
  correctness audit gate. *(Checked and NOT a defect: `selectSaveForItOptions:482` omits it correctly — it
  paces a recurring per-paycheck save, which a one-cycle borrow must not inflate.)*

**Tooling / hygiene:**
- ⛔ **PROMOTED 2026-08-11 → the active build (4.1.8).** *(Was: a supplemental Appium lane, filed as triggered-not-scheduled with a "NO for now" recommendation. 🎯 Jason reversed it the same day — "the more that we can prove with Appium/Maestro the better" — and the amortisation argument carried it: the lane outlives v1.7.)* → `audits/2026-08-11-maestro-coverage/` §7.
- ⛔ **PROMOTED 2026-08-11 → the active build (4.1).** *(Was: "extend the Maestro lane to an iPad simulator — would take **four** items off the device's plate." Measured 2026-08-11: the iPad boot alone carries six, and the whole lane carries 68 of 127. The "four" was a guess, and it undersold the item by an order of magnitude.)*
- ✅ **CLOSED 2026-08-11 (Wave-A after-scan) — the gate now typechecks, both trees.** *(Was: nothing. `validate:release:rn` never ran `tsc` at all, and A.6/A.7 were both committed green carrying real type errors. `packages/core` was worse — excluded from apps/rn's tsconfig on the premise that "the Capacitor app typechecks it", a premise that expired when `validate:release:legacy` was retired 2026-07-24, leaving the money engine the least type-checked code in the repo.)* Measured at 14 errors, all legacy-tree coupling, zero in the engine. `typecheck:core` + `typecheck:rn` now run FIRST. ⚠️ `packages/core/tsconfig.json`'s `@/*` alias and the three `@/lib/*` importers go together at **5.5.1**.
- **⚠️ The gate still asserts the RETIRED demo-mode contract** — `runRegressionTests.ts:59` imports `testDemoModeSeed`, which asserts the Capacitor key `debtPlanner.isDemoMode` that `seedPlannerState.ts` writes. It passes (the legacy tree still exists) but it is a green test defending a feature the RN app no longer has, which reads as a live contract → delete with the Capacitor tree at **5.5.1**.
- **⚠️ `apps/rn/package-lock.json` is out of sync** — `npm ci` refuses it; both CI lanes work around it with `npm install`, so **installs are not reproducible.** Regenerate deliberately and re-run the full gate → before the Phase-5 cutover.
- **Simulator build recipe DUPLICATED** across `native-e2e.yml` and `app-preview.yml` (~60 lines of expensive native fixes) — extract a composite action → with the iPad lane. ⚡ **[4.1.3a] `app-preview.yml` does NOT have the `.app` cache** — fold it in with the extraction rather than copying it a second time.
- **⚡ [4.1.3a after-scan] Cache `~/.maestro`** — the Maestro install is a measured **1m29s** on every run and survives a `.app` cache hit. Next ~1m30s if turnaround still matters once 4.1.3a is proven; not promoted, because it is small next to the 17m03s already taken.
- **No local pre-flight for the capture path** — a flagged web export + ~40-line check would have caught several CI cycles' worth of defects → with the above.
- **TWO screenshot mechanisms** — `tests/visual/*.cjs` (root, by hand) and `apps/rn/tests/shots/` (config-driven). The root set's stale frames masked the sandbox theme defect → remove at 5.5.1.

**Genuinely a later version / tier:**
- **⚠️ `Slider` reports no value on WEB** — react-native-web drops `accessibilityValue`; `a11y-axe` does not flag it. Web-only, so it matters the moment **3.5.7's embed** ships.
- **`typicalAmount` still has no UI** — same shape as A9's defect but far smaller impact → the wording/cohesion gate.
- **The app never shows a debt-free date reflecting its own plan working** — on day one the starter EF absorbs the surplus, so every projected date is minimums-only. Honest per screen; the question is the app-wide effect → the cohesion audit, not a defect.
- **The demo's beat dwell may be too short for the runner** — decide from the 2fps contact sheet.
- **Apple Watch** → v1.8+ · **`@gorhom/bottom-sheet`** → v1.8 Android · **Behavioral mis-entry / persistent-cushion / bill-shock autopilot** → Connected/Plaid tier · **Holiday/promo free-trial** → a reversible later lever, launch is paywall-from-day-1 · **iOS-18 Control Center** [D1] *(rec: stay deferred)* · **web light-mode hover screenshots** *(a QA artifact, not product)*.

---

## Decisions

- **Re-scope to "The Elevation" ✅ (2026-07-20)** — design-first, best-in-class.
- **No paywall on the basic core job** — free finishes the job; premium is the flywheel.
- **Revenue spine ✅ (2026-07-25)** — Monthly $4.99 · Annual $29.99 · Lifetime $79.99 (excludes Connected/Ava). **NO free trial.** Reuses the existing RevenueCat project — v1.6 subs must restore.
- **Phase-3 scope ✅ (2026-07-27)** — pull EVERYTHING into v1.7 unless it genuinely can't ship. Analytics OUT of the core (privacy moat), but the 3.5 demo re-opened it → D-A wires a privacy-first funnel seam.
- **Executive "fix everything, no backlog" ✅ (2026-07-29/30)** — fold every audit finding now; only hardware verification waits for Phase 6.
- **[D23] ✅ (2026-08-11)** — **the demo is TWO runs.** `explore` ships to users (navigable, no script, one exit); `scripted` is the App-Preview + embed vehicle and leaves the user-facing doors. Resolves one artifact serving two jobs with different requirements.
- **[D22] ✅ (2026-08-10)** — **the debt/expense split is CORRECT and stays** (terminating vs perpetual); the defect is naming + entry. **[D22a]** the single-entry chooser fully replaces the per-section Adds · **[D22b]** the mis-file detector runs retroactively at rollout · **[D22c]** it surfaces, never silently re-files · **[D22d]** the Guardian's "bills" vernacular → the wording/voice gate. → 3.7.A10.
- **[D21] ✅ (2026-08-10)** — **the demo SHIPS to users again, reversing [D19].** Demo = before you commit (Welcome + paywall); walkthrough = after onboarding, on your own money. It no longer rides `QA_TOOLS`.
- **⛔ [D19] REVERSED (2026-08-06 → 2026-08-10)** — it pulled the demo's entries as a duplicate of the walkthrough, and the rebuild it ordered (3.5.4.11) repaired that premise the same day. Superseded by [D21].
- **[D20] capture pipeline ✅ (2026-08-06)** — Maestro drives · `simctl` records · ffmpeg conforms. `maestro record` rejected.
- **[E4] ✅ (2026-08-08)** — an upgrader is offered the FINALE alone, not a replay of the arc.
- **3.5.7 sequencing ✅ (2026-08-10)** — built after Phase 3.7. Hosting + privacy specifics still open.
- **Legacy gate RETIRED ✅ (2026-07-24)** — `validate:release` → the RN gate.

- **[D24] ✅ (2026-08-11)** — the tight top-up prefers a **discretionary savings goal; the EF is the fallback, not the first pick, and the copy names it when it IS the EF.** "Never" would make the one-tap vanish for anyone whose only savings is the EF. The dishonesty was drawing on it *silently and first*. → **A3.3**
- **[D25] ✅ (2026-08-11)** — an applied purchase **keeps** its deferrable behaviour (a discretionary buy *should* be first to cut in a shortfall) but gets an **explicit category**, so it is a stated rule rather than an uncategorized fallthrough. → **A3.7**
- **[D2] ✅ (2026-08-11)** — **`minimumPaidThisCycle` is the owner** ("minimum covered"); `isPaidThisCycle` means paid in full. ⚠️ **Corrected by B.0:** the fallback-less reader is `planSelectors.ts:`**`156`**, and Today's mark-paid writes through `handleMark` → `markDebtMinimumPaid`, **not** `bulkMarkRequired` (that is the payday path, and it violates this decision by also setting `isPaidThisCycle`). → **B.1**
- **[D3] ✅ (2026-08-11)** — the calm-micro-viz hero language **extends to Debts** (a paydown bar via the existing `HeroProgressBar`). Bare read as an omission next to Bills and Goals, on the page whose subject it is.
- **[D4] ✅ (2026-08-11)** — **rename NOW, before the next device build.** Every App Shortcut phrase contains `\(.applicationName)`, so A8's phrases cannot be finalised or device-tested until the name is final, and `app.json`'s "Debt Planner (RN)" is a Phase-6 ship blocker regardless. → new step **A.0**

- **[D1] ✅ (2026-08-11) — stays DEFERRED, on a new reason.** ⛔ The original reason (cost: the AppIntent machinery was unbuilt, ~4–5× the query-intent baseline) **has expired** — the widget extension, App Group, `DebtProvider` and an in-extension App Intent all exist now, so it is ~one Swift file plus an availability gate. It stays deferred because **there is no control-SHAPED job**: this app's actions are multi-step (log a payment needs a debt *and* an amount) or rare and dated (payday landed, already on the Live Activity), and a glance is a widget's job — which already ships. ⛔ **Trigger SPENT (B.0, 2026-08-11)** — B4 creates no new one-tap; `RequiredActionsCard.tsx:209`'s `CheckCircle` has been that one-tap since the card shipped. Deferral stands on its stated reason, with nothing pending.

- **[D26] ✅ (2026-08-11)** — B3's greeting **mechanism** ships in Wave B; its **strings are owned by the wording/voice gate**, which is where 2026-07-30 deferred it. Splitting the two honours both. → **B.2**
- **[D27] ✅ (2026-08-11)** — port the free on-plan streak **only** (milestone surfacing already ships). Calm house voice, **no flame**, and never rendered beside the premium "Held your line · N paychecks" — two streaks on one screen read as one feature stated twice. → **B.3**
- **[D28] ✅ (2026-08-11)** — B4's swipe **ships, as a pure accelerator** over the existing one-tap `CheckCircle`. The infra exists (`ListRow`'s `ReanimatedSwipeable`), the gesture is unused on required rows, and legacy carried pill **+** swipe too. → **B.4**
- **[D29] ✅ (2026-08-11)** — **B1 is CLOSED as refuted.** The delta between "drag the curve" and what ships is a gesture, and §3.4.1's scrub-to-read already owns it.

- **[D31] ✅ (2026-08-12)** — **the audits change METHOD, not just model.** 🎯 the Fable-5 fan-out costs a session in ~20 minutes. ⚡ The reframe that decided it: reading is the **expensive half and the weak half** — Hearthlight's 8 adversarial rounds produced *"one good cut, two tests worth keeping, and then recurrence"*, Law IV found **2 of 4** agent-stated mechanisms wrong while all 4 recommendations were sound, and today's live defect survived **two audit passes and three green web specs** before an 11-minute Maestro run caught it. So: deterministic lenses become **scripts**; agents get a **generated artifact** instead of the codebase (~10× less input, which dwarfs any model discount); cheap tier extracts, expensive tier judges a short list; runs go out-of-session with incremental writes. ⚡ **And every finding that becomes a TEST is paid for once** — audit spend as capital, not rent. → **audit tooling**, below.
- **[D30] ✅ (2026-08-12)** — **the iPad lane is THREE TIERS IN ONE DIRECTORY**, not a second flow set: shared (testID-driven, device-agnostic) · iPhone-only (where the compact presentation IS the subject) · iPad-only (the checks with no iPhone equivalent). Device is a **workflow input** with its own explicit flow list. ⚡ Forced by `use-layout.ts`: `isExpanded` is width-derived and branches in **seven** places, so on a wide iPad the debt sheet is **inline, not modal** — flow 02 would pass while testing nothing. ⛔ A duplicated set was rejected on this repo's own measured cost of parallel test surfaces (the two screenshot mechanisms; Wave A's "two places, one rule" ×3). → **4.1.5**

**Open:** 3.5.7 hosting + privacy *(the only one left)*.

---

## Reference docs

- **Premium:** `DEBT_PREMIUM_STRATEGY_2026-07-21.md` · `DEBT_PREMIUM_ELEVATION_SPEC_2026-07-23.md` (v6) · `DEBT_PREMIUM_FUTURE_FEATURES_AUDIT_2026-07-23.md`
- **Design:** `DEBT_PHASE0_DESIGN_SYNTHESIS_2026-07-20.md` · `DEBT_MOTION_SPEC_2026-07-20.md`
- **Audits:** Guardian `DEBT_GUARDIAN_*.md` · Phase 3 `DEBT_PHASE3_*` + `DEBT_PHASE3_CLOSEOUT_REAUDIT_2026-07-30/` · Phase 3.5 `DEBT_PHASE3.5_COVERAGE_AUDIT_2026-07-30/` · tutorial `DEBT_TUTORIAL_AUDIT_2026-08-02.md` · demo/capture `DEBT_DEMO_VS_WALKTHROUGH_AUDIT_2026-08-06.md`
- **Ops:** `REVENUE_SPINE_MANUAL_SETUP_2026-07-25.md` · `REGRESSION_BASELINE_2026-07-24.md` · `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` · **device QA:** `DEBT_3.5_DEVICE_QA_CHECKLIST.md`
- **Full build history:** [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md)
