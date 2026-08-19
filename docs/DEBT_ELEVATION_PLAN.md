# Debt Planner — The Elevation Plan

> **Mandate (Jason 2026-07-20):** do it RIGHT — Debt at or above the rest of the portfolio by the next
> version, or it's churn. v1.7 = **elevate Debt to best-in-class + acquisition-ready.**
>
> **This file is the LEAN DRIVER.** What is being built, what is next, what is blocked. Every "how it
> went" belongs in [`DEBT_ELEVATION_LOG.md`](DEBT_ELEVATION_LOG.md) — if an item here grows a story, cut it.

---

## ▶ BUILDING NOW — **Phase 5 · Data continuity + cutover** 🔒 ship-blocker

| | |
|---|---|
| **Where v1.7 is** | Phases 0–3 · **3.5** · **3.7** · **4** · **3.8** ✅, and the **whole-app audit gate T1–T8 + T3B ✅ CLOSED 2026-08-19** ([D37] 55/55, `lint:closure` in CI). Remaining: **Phase 5** ▶ → **Phase 5.5** → **Phase 6** |
| **Phase 5 state** | ✅ **5.1a · 5.1b · 5.2–5.6 · 5.8 DONE · 5.9 refuted · 5.7 MOVED to Phase 6** (🎯, still v1.7). ✅ **5.10 CLOSED.** ▶ **Next: 5.11 the cutover — 🎯 OWNS THIS.** ⚠️ **Device-owed and BATCHED into one dispatch:** 5.8.5's picker/share-sheet · **5.8.7's icon render** · 5.1b.3's probe job that restores the captured artifact |
| **Gate** | `validate:release:rn` — **196 e2e · 10 embed · 10 `test:stamp` · 83 lane checks**, tsc + lint clean, zero `error-context.md`. CI runs it on every push. ⭐ **+`lint:glossary` +`lint:money` +`lint:closure`** |
| **The audit** | ⭐ [`audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md`](audits/2026-08-17-v1.7-audit-gate/SYNTHESIS.md) — 117 findings, 7 lenses, 8 refutations. **CLOSED**; detail → log |
| **Device pass** | 52 rows + the 60 coverable-not-built + **[T3.2]'s owed row** (force a storage fault → the retry screen renders AND the retry recovers) — all Phase 6, human-ticked, non-gating. ⚠️ Read figures from [`audits/coverage-split.md`](audits/coverage-split.md), never from a doc quoting them |
| **Env** | `git -C /c/Users/Jason/debt-app-v1 …` (cwd drifts) · `npm --prefix apps/rn run export:web` · e2e `npm run test:e2e:rn` |

✅ **THE AUDIT GATE IS CLOSED (2026-08-19).** T1–T8 + T3B, **[D37] 55/55 high+ traceable**, three new lint
gates (`lint:glossary` · `lint:money` · `lint:closure`), e2e 184 → 195. ⛔ **The result that outlives it:
an audit finding's site list is where to START looking, never the class** — five consecutive items
undercounted in one direction — and **refutation earned its keep six times.** Detail + the phase-level
after-scan → log.

🎯 **2026-08-19: Phase 5 is GO, and it is the FULL bridge** — v1.6 has real users with populated data, so
the bridge is ship-blocking and the adversarial migration audit is a hard exit gate before cutover.

✅ **STANDING PERMISSION, PHASE 5** *(🎯 2026-08-19: "continue through Phase 5 until you need my input.
You have standing permission to commit, push and dispatch where needed.")* — includes **dispatching CI**.
⚠️ **Conditional on the scans**, as every prior grant has been: each step and sub-step gets its before-scan
(verify the premise against CURRENT code — this phase has already corrected the schema corpus, the key
count, the lockfile claim and my own `amount` flag) and its after-scan, captured atomically with the plan
edit. ⛔ **Still comes to Jason:** a product/content call, anything touching **5.5 / 6**, the **cutover**
itself, and any ruling that overturns a decision he already made.

### ⛔ The switch-in before-scan corrected the pre-authored scope (2026-08-19)

**Four of six premises were wrong or stale** — the same profile T1–T8 measured five consecutive times.

| premise, as written | measured against current code |
|---|---|
| "Every prior data shape: **v1–v6 schemas**" | ⛔ **Wrong on BOTH readings.** *Source* = `lib/storage/migrateState.ts`, `CURRENT_SCHEMA_VERSION = **2**`, one registered migration → blobs in the wild are **0 / 1 / 2**. *Destination* = `apps/rn/src/data/models.ts`, `CURRENT_STORE_VERSION = **7**`, unshipped. **The audit corpus was mis-specified.** |
| the migration bridge | ✅ **genuinely unbuilt** (three comments call it "the Phase-D data bridge"; no such file) · ⭐ **bundle ids MATCH** — `com.jasonsnyder.debtplanner` in both `apps/rn/app.json` and `capacitor.config.ts` → upgrade-in-place is valid |
| flush critical prefs immediately | ✅ **true and reproducible** — `SAVE_DEBOUNCE_MS = 500`, and `flushPendingSave` has exactly **one** caller (`_layout.tsx`, AppState `background`/`inactive`) |
| the two inert prefs | ✅ **zero production reads** for `isDemoMode` and `guardianIntroSeen` · ⚠️ `sandboxStore.ts:19` still *claims* `isDemoMode` is "read by real code", contradicting `use-payday-capture`'s own comment |
| paste-JSON import | ✅ `BackupSheets.tsx`, 106 lines, clipboard-only · `expo-sharing` is a dep, **document-picker is not** |
| E2EE iCloud template | ✅ Freedom's `src/storage/cloudBackup/` + `data/cloudBackup.ts` — **6 files, 339 lines, 2 test files** |

⛔ **The risk the plan never named, and it gates every other step: an RN binary has NO web context, and
`react-native-webview` is not a dependency.** Reading the Capacitor WKWebView `localStorage` after an
upgrade is an **unproven capability**, not an implementation detail. → **5.1 is a device-proven spike, and
nothing downstream is budgeted until it answers.**

⚡ **Source shape measured, not assumed:** a repo-root ripgrep sweep (no `head`, no directory list) found
**31 distinct `debtPlanner.*` keys**, including `schemaVersion`, `cycleHistory` and `resetSnapshot`.

### ▶ Phase 5 — the steps

| # | Step | State |
|---|---|---|
| **5.1a** | **The WebKit `localStorage` decode** — the half provable off-device | ✅ **Done 2026-08-19.** `webkitLocalStorage.ts`: encoding sniff, table decode, and the store picked **on contents, never on path** (WebKit's layout is private and has changed twice). **36 asserts** incl. a **real `node:sqlite` round-trip** through WebKit's own `ItemTable` shape; **4 plants, 4 reds**; typecheck + lint clean |
| **5.1b** | **[SPIKE] Prove the databases are findable and readable after a real upgrade.** Two lanes, two claims: the **mechanism** on a GH-Actions **simulator** (install v1.6 → use it → install RN over it, same bundle id, same container) — free and repeatable; the **acceptance** on 🎯's phone via one batched CodeMagic build, which is Phase 5's stated exit. Fallback if the read comes back empty: a native `WKURLSchemeHandler` + off-screen WKWebView | ▶ **ACTIVE.** ✅ **5.1b.1** the legacy build was ROTTED and is repaired · ✅ **5.1b.2** the walk — both WebKit layouts, breadth-first, **caps that REPORT** (`truncated`), **17 asserts** against a real temp tree, **4 plants / 4 reds**. ▶ **5.1b.3** — ✅ deps (`expo-sqlite` + `expo-file-system`, plugin registered) · ✅ native adapter + web split · ✅ the QA-gated `legacy-bridge-probe` readout on More, beside the other two probes. ⛔ **The source DB is COPIED before opening** — `SQLiteOpenOptions` has no read-only flag, so opening the user's own WebKit store would open it read-write. Verified: tsc clean · `lint:rn` 0 errors · **web export green with 0 occurrences of `expo-sqlite` in the bundle**. ⭐ **ANSWERED 2026-08-19, run `32271630276` GREEN — artifact `legacy-webkit-container` uploaded.** The v1.6 store is at **`Library/WebKit/<BUNDLE-ID>/WebsiteData/Default/<salt>/<salt>/LocalStorage/localstorage.sqlite3`** on **iOS 26.2** — a bundle-id segment *and* **two** salted directories, which vindicates identifying the database by CONTENTS. **22 `debtPlanner.*` keys recovered.** ⚠️ Run 1 failed on MY defects, not iOS (`inputs.*` is empty on a `push` trigger → wrong tree; nothing launched the app). ▶ Remaining: the probe job that restores the artifact |
| **5.2** | **The legacy → RN key mapping** | ✅ **Done 2026-08-19.** `mapLegacyStore.ts`: 28 v1.6 keys → a `LegacyPartialStore`, then **delegated to the EXISTING `runMigrations`** rather than re-implementing defaults. Theme's **three-way union** handled (`true`→dark, `false`→light, `null`→default). ⛔ **Nothing is silently discarded** — every key is mapped, dropped *with a reason*, unknown, or unparseable. Quarantine carried; `rnStore` excluded. **50 asserts · 6 plants / 6 reds**, incl. a case built from the **real captured container's 22 keys** |
| **5.3** | **The bridge** | ✅ **Done 2026-08-19.** `migrateFromLegacy.ts` + wired into `bootstrapPersistence` **before** hydrate. ⭐ **Idempotence is STRUCTURAL, not a flag** — it runs only when RN storage is empty, which alone gives one-shot **and** interruption-safety **and** never-overwrites. ⛔ **Non-destructive by construction:** nothing ever writes/deletes/opens the WebKit store, so v1.6 survives even a FAILED migration. Quarantine carried **before** the store write. **32 asserts · 4 plants / 4 reds** |
| **5.4** | **Mis-filed-obligation sweep over MIGRATED data** | ⛔ **The premise was WRONG: the bridge needs no wiring.** `money.tsx` renders the hint for **any** expense matching `looksLikeDebt`, ungated by origin — so a migrated user already sees it. ✅ Pinned against v1.6's real 15-preset corpus (**3 caught**). ✅ **CLOSED 2026-08-19 [🎯]** — both trust calls settled by MEASUREMENT, not instinct. **`car payment`/`vehicle payment` as a PHRASE, never the bare word** (bare `car` accused **8 of 19** realistic bill names incl. "Car insurance", "Car wash", "Car registration"; the phrase form accuses **2 of 19**). **The unmodified `"Rent / Mortgage"` preset is exempt** — it names both, so it carries no information; a *renamed* "Mortgage" is still caught. **39 asserts · 3 plants / 3 reds.** ⚠️ Knowingly missed: brand-named car debt ("Toyota payment") — a lender list is recall-chasing with a worse false-positive profile |
| **5.5** | **Durability: flush critical writes immediately** | ✅ **Done 2026-08-19.** Prefs now write IMMEDIATELY, bypassing the debounce; ordinary edits keep it. A pref is a single tap the user WATCHED confirm, and `flushPendingSave` only fires on AppState background — a force-quit from the foreground emits neither, so the window had nothing behind it. Plant-verified both directions |
| **5.6** | **Drop the two inert prefs** | ✅ **Done 2026-08-19.** Both removed from the type, the defaults AND — the part that matters — **STRIPPED by `runMigrations`**, since the prefs merge preserves any extra key an old blob holds, so a type-only deletion would leave them in the DATA forever. Folded into v7 (unshipped). `sandboxStore.ts`'s stale claim corrected. Plant-verified |
| **5.7** | ~~E2EE iCloud backup~~ | ⛔ **MOVED OUT OF PHASE 5 — 🎯 2026-08-19.** ⚠️ **Still ships in v1.7** ("*okay with moving it out of Phase 5 with the knowledge that it does need to still be folded into 1.7*") → **Phase 6**. Its title was refuted on measurement: **not E2EE, not a port** — see the block below |
| **5.8** | **File-based backup** — was *"replace the paste-JSON import with a file picker"* | ▶ **ACTIVE**, decomposed below. ⛔ **The before-scan DOUBLED it:** import accepts **any JSON object** and replaces the user's data (measured), and **v1.6 backup files exist in the wild** that it half-destroys silently. **5.8.1–5.8.4 are the ship-blocker**; the picker is 5.8.5 |
| **5.9** | ~~Regenerate `apps/rn/package-lock.json`~~ | ⛔ **REFUTED 2026-08-19, measured.** `npm ci --dry-run` exits **0** on the committed baseline in **both** `apps/rn` and root — the lockfile was already in sync. The claim in the backlog *and* the comments in `web-e2e.yml` / `embed-pages.yml` (*"`npm ci` works at the root and NOT in apps/rn, ~12 missing transitive entries"*) are **stale**. ▶ Residual: the lanes still install with `npm install`; switching them to `npm ci` is a real but SEPARATE improvement needing a CI run to confirm on Linux — **not** assumed from a Windows measurement |
| **5.10** | **[AUDIT GATE] Adversarial migration audit.** ⛔ NARROWED (🎯) to *can the migration lose or corrupt data?* | ✅ **GREEN 2026-08-19.** 5.10.1–5.10.4 done: 482 generated cases × 2 REAL doors × 8 invariants + the differential oracle + interruption/quarantine, **0 violations**, gating in `test:app`. Found and fixed **3 real defects**. ✅ **5.10.5** — 29 agent-generated hostile v1.6 states (multi-field · plausible-user · v1.6-only historical) pass **clean**: the agent bought CONFIRMATION, not discovery. Completeness critic **dropped** (🎯: Phase 6 runs completeness across the whole app). **5.10 CLOSED** |
| **5.11** | **Cutover** — the RN app becomes the shipping app | ⭐ **MIGRATION VERIFIED ON A LIVE DEVICE, 2026-08-19 (🎯)** — a real v1.6 install seeded from `docs/cutover/`, upgraded in place, **all expected fields populate**. The claim Phase 5 exists to make, now made on hardware. ✅ **Share-sheet export verified.** ⭐ **`legacy-bridge-probe` on device: `Found 1 · Opened 1 · Keys 22 · Dropped 0 · visited 16 · truncated=no`** — 22 matches the captured container exactly, by an independent route, and `truncated=no` with keys>0 is the unambiguous success case. ⛔ **One defect found by USING it:** importing a v1.6 backup FILE hid the restored portfolio behind onboarding (`buildBackupData()` never emitted `hasCompletedOnboarding`). **Fixed at the root in `runMigrations`** — the differential oracle caught the first fix for creating a door asymmetry. ▶ **Fixed, unit-covered, NOT device-verified → Phase 6 device pass** *(🎯: no new CM build for it)*. ⚠️ **The cutover DECISION is separate from "the migration works"** — 🎯's |

**Exit:** 5.1–5.11 closed (**5.7 → Phase 6**, **5.9 refuted**), **5.10 green**, full gate green, a real populated v1.6 device upgraded with zero
data loss, and every fix that CAN be a lint rule IS one ([D31]).

**5.7 → Phase 6 `6.C`, 2026-08-19 (🎯), still v1.7.** Measured: Freedom's template is **not E2EE** (sole
codec is an identity function) and **not a port** (portal step, no dep, device-only). Two coupled
decisions ride with it — **[a]** mechanism, **[b]** the replacement for *"never leaves your device"*,
which is **owed either way** since encryption changes *who can read it*, not *whether it left*.
Full evidence + my own bad argument → **log, `5.7 — the before-scan refuted the step's own TITLE`**.

✅ **5.8 CLOSED 2026-08-19** — envelope · detection · router + v1.6 adapter · confirm-before-replace · the
file doors · first-ever e2e · the icon. Per-step detail is in the rows above; full narrative → log.

### ▶ 5.10 — the adversarial migration audit. ⛔ NARROWED, because Phase 6 already owns the other half

🎯 **2026-08-19: gaps get caught at the FREEZE, not now.** The scope as written duplicated a later gate —
*"zero/negative income · date-boundary/leap-year/timezone · huge/partial portfolios"* is **Phase 6's money
lens, verbatim**, and the broad *"fan out for gaps and upgrades"* intent is Phase 6's **FINISH sweep**,
which absorbed T12 on 2026-08-18 with the reasoning that *polish decided against a moving app gets decided
twice.* The app is still moving through 5.11 and 5.5. ⚡ **5.10's own scope drifted exactly the way every
pre-authored item in this phase has** — it was written before Phase 6 absorbed its broad half, and nobody
updated it.

⚠️ **Correcting my own overstatement:** I argued urgency from irreversibility. **5.3 made the bridge
non-destructive by construction** — nothing ever writes to or deletes the WebKit store — so v1.6 data
survives even a FAILED migration, and a later release could re-run it. It is **not** a one-way door.

▶ **What actually can't move:** 5.11 is defined as *"proven on a real populated upgraded device"*, and that
proof is empty without knowing what the migration does to hostile data · everything downstream is built on
the migrated app · and the v1.6 tree is in the working directory only until **5.5.1**, so the corpus is
dramatically cheaper to derive now than from `origin/v1.6-dev` later.

**The four doors data enters through** — measured, not assumed:
`store.ts:248` hydrate · `migrateFromLegacy.ts:109` the WebKit door · `readBackup.ts:146` the import door
(×3 formats) · `store.ts:687` `importStore` re-migrating whatever it is handed.

| # | Sub-step |
|---|---|
| **5.10.1** | **The corpus GENERATOR** — combinatorial, not hand-enumerated (*the site-lists-undercount law applies to corpora too*). Axes: door × source version (v1.6 `schemaVersion` 0/1/2 **and** v1.7 `storeVersion` 1–7 — two independent axes; the old scope named one) × damage (absent · `null` · wrong type · empty-for-object · unknown extras · duplicate ids · `NaN`/`Infinity` · unparseable dates · unicode/long strings · truncated JSON) |
| **5.10.2** | **The INVARIANTS** — asserted on every generated case, so token cost is O(7) and coverage is O(N): never throws · nothing silently dropped (mapped \| dropped-with-reason \| unknown \| unparseable accounts for 100%) · money and dates keep their type · output always at `CURRENT_STORE_VERSION` · the source is never mutated · a refusal leaves ZERO partial state · idempotent |
| **5.10.3** | **DIFFERENTIAL oracles — no expected values to author at all.** The WebKit door and the file door translate the SAME v1.6 data → must agree. Export→import → identity. `runMigrations` twice = once |
| **5.10.4** | **Interruption + quarantine** — death between the quarantine carry and the store write; and whether the quarantined bytes survive when the quarantine write itself fails (`migrateFromLegacy` deliberately swallows that) |
| **5.10.5** | **Agents as INPUT generators only** *(3–4, no sub-agents, bounded output)* — hostile v1.6 blobs and a completeness critic. ⛔ **Not finding-declarers**: 3 of 4 agent-declared blockers did not survive refutation, and an input the harness judges cannot be wrong in the expensive way |
| **5.10.6** | **Report by CLASS, then GATE it** — N failures collapse to *k* invariant violations; whatever survives lands in `test:app` so 5.10 never needs re-running ([D31]) |

⛔ **Explicitly OUT of scope**, so it cannot sprawl: anything already pinned by 5.2 / 5.3 / 5.8 (168+ asserts
with plants) · UI and rendering · boundary money values, leap-year/timezone arithmetic and huge portfolios
→ **Phase 6's money lens, where they already live** · whether a user can *retrieve* quarantined bytes →
**a product question, 🎯's**.

**Exit:** every invariant holds across the generated corpus, the differential oracles agree, and the
surviving corpus is in `test:app`.

**Owed before launch, carried out of the audit gate:**
| | |
|---|---|
| **Device pass** | 52 rows + **[T3.2]'s owed row**. Two T3 surfaces ship on unit assertions with **no rendered proof** |
| **T9–T11** | the minor/polish set, deliberately out of [D37]'s scope. ⚠️ **Re-measure first** — T4–T8 collapsed many of their owners |
| **T10** | 44 baselined local parses · `formatDisplayAmount` (dead, L4-11 confirmed) |

⛔ **The sweep is over the REPO ROOT, ripgrep, no `head`, no directory list** — see CLAUDE.md. T5 proved an
enumerated corpus list wrong twice, once by red-gating on a file the sweep had just called clean.

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

✅ **The coach-mark defect, the transient Guardian card and §12.6.1 closed with the audit gate 2026-08-19** —
they were that gate's inputs, never separate threads.

**Product defects, live:**
- ⚡ **A pref changed then force-quit within 500 ms is LOST** (`persistence.ts` debounces at 500 ms;
  `flushPendingSave` has exactly ONE caller, AppState *background*/*inactive*). Silent data loss on a
  setting the user watched confirm itself. **Re-verified at Phase 5's switch-in.** → **5.5**, which owns it.

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
| **5** | **Data continuity + cutover** 🔒 | ▶ **ACTIVE 2026-08-19** — decomposed at the top. 🎯: **full bridge**, real v1.6 users |
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

▶ **ACTIVE — decomposed as 5.1–5.11 at the top of this doc.** Upgrade data loss is catastrophic AND
irreversible, so 5.10's adversarial audit is the exit gate and nothing cuts over until it is green.

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
  ⭐ **CHARTER WIDENED 2026-08-19 (🎯): it judges STRUCTURAL GAPS as well as polish — *"is anything
  missing"*, not only *"is anything wrong"*.** This is where **5.10's original fan-out intent now lives**;
  5.10 was narrowed to migration-correctness on the reasoning that *gaps get caught at the freeze*, when
  the thing being audited is the thing that ships. ⚠️ **Named because the two behave differently here:**
  polish is cheap against a frozen app — that is the whole design — while a structural gap (a missing
  screen, a field the model does not carry, a flow needing a store change) is a **build**, not a tweak.
  ⛔ **So anything structural it finds is a SCOPE CALL for 🎯** — build in v1.7 vs defer to 1.8 — never an
  automatic fix, or the sweep silently expands the freeze it exists to protect.
- **⛔ 6.C — Cloud backup (was 5.7), moved out of Phase 5 2026-08-19 · SHIPS IN v1.7 🎯 · NOT premium-gated.**
  Two coupled **[DECISION]**s first, and they gate the privacy audit below rather than being discovered by
  it: **[a]** plaintext-in-Apple-private-container (Freedom's *actual* design) vs. a real passphrase-AES
  codec + forgotten-passphrase recovery UX; **[b]** the replacement for *"financial data never leaves your
  device"* — **owed under either**, since encryption changes *who can read it*, not *whether it left*.
  ⚠️ Measured, not assumed: Freedom is **NOT E2EE** (sole codec is an identity function; the codec
  interface is an empty seam) and **NOT a drop-in port** (`react-native-cloud-storage` is not a Debt dep;
  needs an Apple-portal iCloud Container + capability + profile regen or **signing fails**; device-build
  verifiable only). ✅ Reusable: the provider platform-split, the service orchestration, the codec
  envelope. Full evidence in the Phase 5 block above.
- **⭐ [AUDIT GATE] Privacy / data-flow audit** — trace EVERY egress and prove "financial data never leaves
  your device" is literally true: network · RevenueCat · Sentry · iCloud · scan OCR · logs. ⚠️ **Consumes
  6.C's [a]+[b]** — do not start this until both are settled.
- **⭐ [AUDIT GATE] Pre-submit functional + FINANCIAL-correctness money lens** — boundary inputs across the
  engine: zero/negative income · date-boundary/leap-year/timezone · rounding drift · month-vs-cycle
  stepping · cross-cadence BNPL · huge/partial portfolios.
- **⚠️ DEVICE-PASS ROW, owed from Phase 5 (🎯 2026-08-19):** import a **v1.6 backup FILE** and confirm the
  restore does **not** land in onboarding. Fixed at the root in `runMigrations` and unit-covered, but
  **never seen on a device** — 🎯 declined a CM build for one route-guard flag, which is the right trade
  given this pass exists. ▶ Also here: the **document picker** (pick `v17-envelope.json` from **iCloud
  Drive**, not local — local would not exercise `copyToCacheDirectory`) and the **`v16-damaged` repair
  report** naming *Visa · balance* and *Electric · amount*.
- **⭐ SHIP-BLOCKER · set `apps/rn/app.json` version to `2.0.0` — [D38], 🎯 2026-08-19.** ⚠️ **Do this FIRST
  in Phase 6**, before the ASC listing, release notes, *"What's New"* and the App-Preview asset, because
  all of them quote the version and doing it late means writing them twice. The internal workstream keeps
  the name "v1.7 Elevation"; only the shipped number changes.
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

- ⛔ **The SPLASH SCREEN is unconfigured too — same class as the icon, found by the same sweep**
  *(2026-08-19)*. `expo-splash-screen` is registered with **no options** and there is no `expo.splash`
  block, so prebuild takes Expo's default. On a dark-themed app that is a white flash into a dark UI.
  ⚠️ **Deferred because it needs an ASSET DECISION, not a mechanical fix** — the obvious move (the app
  icon on the icon's own dark background) is a design/content call, which is 🎯's. **Phase 6**, with the
  App-Preview re-shoot, where the visual set is being decided anyway.
- ⚠️ **Show the backup's own date in the replace-confirm** *(5.8.4 after-scan, 2026-08-19)*. The summary
  says *what* is in the file but not *when* it was saved, and "am I about to overwrite three months of
  work with something stale" is the question a destructive confirm should answer. The envelope already
  carries `exportedAt` and a v1.6 file carries it too, so the data is there — it needs the `localDate`
  helper to render without tripping `lint:local-dates`. **Deferred, not dropped:** the confirm is already
  honest about *contents*, which is the correctness half; this is the judgement half.
- ⚠️ **Retire `raw-v17` import acceptance after the 5.11 cutover** *(5.8.2 after-scan, 2026-08-19)*. It is
  the **weakest of the three markers** — `storeVersion` + `paycheck` + `debts` and no format id — and it
  exists only because the pre-5.8 clipboard export has no envelope. ⚡ **The RN app has never shipped**, so
  the only people holding a raw-v17 export are **TestFlight testers**, who can simply re-export after
  updating. Once the envelope has been out for one release the branch is pure false-positive surface with
  no population behind it. **Not now** — dropping it mid-Phase-5 would break testers' existing files for
  no gain. Re-decide at Phase 6, with the tester window closed.

⛔ **[D37] EVERY high+ finding is remediated THIS round** *(🎯 2026-08-18: "We're fixing all in this
round")*. **Measured denominator: 117 findings, 55 blocker+major.** The gate is not "T1–T8 closed", it is
**all 55 high+ closed or explicitly refuted**, with each closure traceable to the finding id.

⛔ **NOTHING IS PARKED** *(🎯 2026-08-18)*. **T9–T11 are SEQUENCED, not shelved** — every remaining
minor/polish finding is still live and gets **re-evaluated once T1–T8 lands**, because several become
cheaper or moot by then. "Parked" was the wrong word for it and read as *dropped*. Detail → log.

**5.3's AFTER-scan (2026-08-19):**
- ⛔ **MY PLANT HARNESS WAS BROKEN, AND EVERY "RED" IT REPORTED WAS A LIE.** `npx tsx -e "…m=>m.default()"`
  — **bash parses `=>` as a redirect**, so the runs failed to *transform*, exited non-zero, and read as
  verified plants. Three of 5.3's were bogus. Caught only by the doctrine added at 5.1b.2: *when a plant
  reds, confirm it red the assertion you meant.* Redone with a real runner file — **4 plants, 4 reds, each
  with its assertion label printed.** ⚡ The harness now also distinguishes `Transform failed` from a real
  failure, so this cannot recur silently. → generalise into `verify-the-plant-applied`.
- ⛔ **A second scripted `perl -0pi` edit corrupted a file** (left a duplicated fragment mid-declaration),
  making it **two script mishaps in one day** against zero from `Edit`. The rule already exists and I
  went around it twice; the tell both times was a `grep` whose output looked *almost* right.
- ⚠️ **`LegacyMigrationOutcome.ran` was removed** — the test caught that it could never be usefully false,
  because `migrateFromLegacy` does not check RN storage (the CALLER gates that). A field whose value is
  constant reads like information and is not. Same class as L3-4's unread `isFocus`.
- ⚠️ **The native reader is now imported LAZILY** (`await import('./readLegacyStores')`), because a static
  import drags `expo-file-system` → `expo-sqlite` → `react-native` into the plain-Node test runner, which
  cannot transform it. Better regardless: the native modules now load only on the path that needs them.

**⛔⛔ THE WAL — a LIVE data-loss defect the real container found, and no synthetic test could (2026-08-19):**
- **WebKit runs localStorage in WAL mode and had NOT checkpointed.** In the captured iOS 26.2 container the
  main `localstorage.sqlite3` is **4 KB and does not contain `ItemTable` at all**; the `-wal` beside it is
  **28 KB and holds all 22 keys**. ⛔ **`readLegacyStores.ts` copied only the main file** — so on a real
  device it would have read **zero** keys and reported the user as having nothing to migrate. **A total,
  silent migration failure**, and every synthetic test passed while it was true, because a database written
  and closed cleanly by `node:sqlite` has no WAL. ✅ **Fixed** (copies `-wal`/`-shm` on the same basename).
- ⭐ **This is the whole argument for a real fixture, proven in one measurement.** It is the
  fixture-never-renders-the-real-state trap — and it caught me *while I was actively guarding against it*.
- ✅ **Pinned so it cannot return:** the container is committed at
  [`legacyBridge/__fixtures__/webkit-ios26/`](../apps/rn/src/data/legacyBridge/__fixtures__/README.md)
  (32 KB, real bytes, real depth) and `realContainer.test.ts` asserts **main-only throws** while
  **main+`-wal` reads 22 keys**. **17 asserts against real iOS output**, in `test:app` on every push.
- ⚠️ Verified `-shm` is NOT required (SQLite regenerates it), so the committed fixture is two files.

**5.2's AFTER-scan + the capture's result (2026-08-19):**
- ⛔ **MY OWN KEY SWEEP UNDERCOUNTED — the third time today, and the law now applies to my measurements
  as well as the audit's.** The captured container held **`debtPlanner.hasConfiguredPaycheck`**, which was
  **not** in my 28-key sweep of `v1.6-dev`. Traced: written only by `lib/testing/simSmokeSeed.ts`; the
  shipping app merely derives a local const of the same name. ⚡ **`mapLegacyStore`'s `unknown` channel
  caught it before the code shipped** — the design decision paid for itself immediately.
- ⚠️ **THE FIXTURE PROVES LOCATION AND SHAPE, NOT COVERAGE.** Its key set is the **SIM_SMOKE seeder's**,
  so it lacks `isDemoMode`, `resetSnapshot`, `rolloverCount`, `reviewRequested`, `lastHandledPaydayDate`
  and any `__corrupt__` bytes that a real user may carry. **Do not treat a green probe against it as
  proof the bridge handles a real portfolio.** → **5.10 builds the adversarial corpus by hand.**
- ⚠️ **`resetSnapshot` is a v1.6 reset-UNDO buffer** — real user data with no v1.7 surface that could
  restore it. Dropped *with the reason recorded*; if it is non-empty for real users that is a product
  question, not a mapping one. → flag at **5.10**.

**5.2's BEFORE-scan (2026-08-19) — measured against `origin/v1.6-dev`, not the drifted in-tree copy:**
- ⭐ **NO v1.6 FIELD HAS BEEN DROPPED — across ALL SIX persisted types.** `Debt` 17 shared / 3 new ·
  `RequiredExpense` 11/4 · `Goal` 5/2 · `PayCycleSnapshot` 7/3 · `CompletedRecommendedAction` 6/0 ·
  `RecommendationOverride` 3/0. **Every v1.6 type is a strict subset of its v1.7 counterpart**, so nothing
  is lost by shape — the migration risk is in KEY ASSEMBLY and TYPE COERCION, not in field loss.
- ⭐ **Design consequence: assemble a `Partial<DebtStore>` and delegate to the EXISTING `runMigrations`.**
  It already backfills `lastVerifiedDate` + `balanceAsOfDate` (v3/v4) and normalises installment BNPL (v6)
  — two of the three new `Debt` fields. **Do not reimplement the defaults**; a second copy of the backfill
  is the drift class T8 spent a day on.
- ⛔ **The corpus was wrong: 28 keys, not 31.** My earlier sweep ran over **v1.7-dev**, which mixes the
  drifted in-tree legacy copy with RN test seeds. Re-measured on `origin/v1.6-dev`.
- ⛔ **`debtPlanner.rnStore` is RN's OWN web-adapter key, in the SAME namespace** (0 files on v1.6-dev, 20
  on HEAD) — so **5.1a's `countLegacyKeys()` would count it as legacy**. Not live (native stores under the
  MMKV key `store`), but `pickLegacyStore` ranks on that count, so the exclusion is cheap and the semantics
  should say *v1.6 Capacitor keys*, not *anything in the `debtPlanner.` namespace*. → fold into 5.2.
- ⚠️ **`darkMode` is a THREE-WAY union** — `ThemePreference | boolean | null`. The boolean is the
  pre-`ThemePreference` shape still sitting in older installs. → `themeMode`: `true`→`dark`, `false`→`light`,
  `null`→`system`. A mapper that assumes the string form silently mis-themes the oldest users.
- ✅ **CORRECTED: `amount` is NOT a type hazard.** I flagged it as string→number; RN's `PaycheckConfig.amount`
  is **also a string** ("kept as a string to mirror the input model"). The flag was wrong.

**Surfaced by 5.1b.2's AFTER-scan (2026-08-19):**
- ⚡ **A PLANT THAT PASSES IS NOT AUTOMATICALLY A BLIND ASSERTION — diagnose which.** A plant reversing
  intra-level walk order passed, and this project's own standard ("a green assertion that cannot fail reads
  as coverage") argues for deleting such an assertion. **It was the PLANT that was wrong:** reversing
  siblings does not disturb breadth-first, which orders by DEPTH. A true BFS→DFS plant red it, on the exact
  assertion. ⛔ **New rule for the instrument record:** when a plant passes, first ask whether the mutation
  changed the behaviour the assertion is about. **Deleting a sound assertion on a bad plant's evidence is a
  new way to lose coverage**, and the existing "10 of 10 instruments passed while broken" result would have
  made that mistake feel justified. → the [D31] instrument doctrine.
- ⚠️ **`expo-file-system` is in `node_modules` transitively but is NOT a declared dependency** of
  `apps/rn`, and `expo-sqlite` is absent entirely. Both get declared at 5.1b.3 — which lands on the
  already-desynced lockfile. → sequence 5.1b.3 **before** 5.9, not after.
- ⚠️ **`Paths` exposes `cache` / `document` / `bundle` but NOT `library`**, so `Library/WebKit` is reachable
  only as `Paths.cache.parentDirectory`. Handled and pinned (`webkitRootFrom`), recorded because it is the
  kind of API fact a later refactor would "simplify" back into a hardcoded path.

**Surfaced by 5.1b.1's BEFORE-scan (2026-08-19) — the legacy build was already broken; all fixed, folded in:**
- ✅ ⛔ **`next build` was RED, so the v1.6 Capacitor app could not be built at all** — and Phase 5's upgrade
  probe needs it. Nothing caught it because **`validate:release:legacy` never runs `next build`**; the
  surface has not been compiled since the RN tree landed. **7 errors, 1 real.** Root `tsconfig.json` swept
  `apps/**` (whose `@/*` means `apps/rn/src`, not the repo root) and `scripts/**` (tsx conventions this
  config rejects) — both now excluded. Build verified green.
- ✅ ⚡ **The one real error was a live defect:** `ResultsSection.tsx` filtered allocations on
  `category === "leftover"`, a member `AllocationCategory` no longer has — core split the residual into
  `cushion_buffer` and `true_leftover`. **The filter has matched nothing, so `bufferTotal` was 0 regardless
  of the real buffer.** Restored to the category `allocatePaycheck` actually emits. *(Legacy surface only;
  5.5.1 deletes it — but it had to compile for the probe, and a silent 0 is a defect either way.)*
- ⚠️ **No further gate added, deliberately:** 5.1b.3's CI job builds the legacy app, so **the probe IS the
  gate** against this rotting again — and both die together at 5.5.1. A second check would outlive its subject.
- ✅ ⭐ **CORRECTED 2026-08-19 — the shipped v1.6 IS preserved: `origin/v1.6-dev`** (🎯; a pure Capacitor
  tree, no `apps/`, no `packages/`). My earlier note said the fixture would have to come from the current
  legacy tree. **It does not, and it must not** — that tree has drifted against shared `packages/core`
  (the dead `"leftover"` filter proves it). **The fixture builds from `v1.6-dev`, so it is authentic to
  what shipped.** ⚠️ Still true: there is no v1.6 **tag**, only `v1.0-submitted` + `app-preview-*`. Tag
  releases from here.
- ⭐ **[DECISION, 🎯 2026-08-19] CAPTURE THE CONTAINER ONCE — do not take a standing CI dependency on the
  legacy tree.** 🎯: *"why do we need the legacy branch on this phase? We have actively been
  decommissioning it."* Build v1.6 from `v1.6-dev` on a simulator **one time**, capture the resulting
  `Library/WebKit` tree as a CI **artifact**, and have the probe job restore that into a fresh container.
  ⛔ **Synthesising the fixture instead was REJECTED**: the unknown *is* where iOS puts the files, so
  writing one where we guessed and then finding it there proves nothing — the fixture-never-renders-the-
  real-state trap, at container scale. **After the capture the legacy tree owes CI nothing and 5.5.1 can
  delete it freely.** ⚠️ The capture is from one iOS version; contents-not-path identification absorbs
  that, and 🎯's phone remains the acceptance proof.

**Surfaced by 5.1a's AFTER-scan (2026-08-19) — all fold in, none deferred:**
- ⛔ **The v1.6 QUARANTINE is itself legacy data, and the plan never named it.** `safeStorage.ts` writes
  corrupt bytes to `debtPlanner.__corrupt__.<key>.<ISO>` — for a user who ever hit corruption that is **the
  only recoverable copy of their data**, and a bridge that migrates a known key list and stops would destroy
  it at 5.5.1. **The bridge carries the quarantine forward.** → **5.2 + 5.3, must-have.**
- ⚠️ **`decodeItemTable` drops unreadable rows, and a silent drop reads as a clean migration.** The bridge
  must **report** the dropped count, not just omit them. → **5.3's contract.**
- ⚡ **The obvious NUL-byte encoding sniff is WRONG, and the test proves it** — UTF-16LE CJK carries zero NUL
  bytes, so a byte-sniff would migrate a non-Latin debt name as mojibake, silently. What saves it is that
  **every v1.6 value went through `JSON.stringify`**, making "which decoding parses as JSON" a question about
  our own data rather than a guess about Apple's. ⚠️ **That discriminator dies if any legacy value was ever
  written un-stringified** — a case for **5.10**.

**Surfaced by PHASE 5's switch-in before-scan (2026-08-19) — all three FOLD IN, none deferred:**
- ⚠️ **`runMigrations` never reads `r.storeVersion`.** It merges every blob forward unconditionally, so v6's
  `normalizeBnplInstallment` re-runs on **every hydrate of an already-current blob**. Merge-forward is a
  defensible design, but its idempotence is **asserted, not measured**. → **5.2**, and a case in **5.10**.
- ⚠️ **`migrations.ts`'s docblock stops at v6 while `CURRENT_STORE_VERSION = 7`** — v7's three prefs are
  documented only in `models.ts`. One version, two owners: the exact drift class T8 spent a day on. → **5.2**.
- ⚠️ **`sandboxStore.ts:19` asserts `prefs.isDemoMode` is "read by real code (`use-payday-capture`)"** — false
  since 3.5.4.8, and `use-payday-capture`'s own comment says so. A stale comment defending a dead flag. → **5.6**.

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

### ⭐ The 62 findings [D37] did not cover — FILED TO PHASE 6 (🎯 2026-08-19)

⛔ **The complete list is [`audits/2026-08-17-v1.7-audit-gate/REMAINING.md`](audits/2026-08-17-v1.7-audit-gate/REMAINING.md)**,
**generated** from the findings files (`tsx scripts/check-audit-closure.ts --remaining`) — never hand-maintained.
**41 minor · 21 polish.** Owned by **Phase 6's FINISH sweep**, alongside T12.

⛔ **Why the generated list exists: 20 of the 62 were named in NO ledger at all** — not the plan, not the
log, not the refutations — because the T9–T11 lists below are *partial enumerations* and `lint:closure`
only ever gated blocker+major. **A sweep driven off T9–T11 would have silently dropped 20 findings**, 13 of
them L2 drift. `lint:closure` now REPORTS the low tier every run (never gates it — an untraced minor is the
expected state here, and a gate that reds on the expected state trains everyone to ignore it).

⚡ **Do NOT read it as 62 edits.** Measured: of the 61 cross-file copy duplicates, **24 are generic chrome**
(`Save`, `Cancel`, `Done`, `Add`, `Name`, `Back`) that repeat *by design* — "fixing" them is how L2-6's
suggested fix would have made five dead strings load-bearing — and **5 more involve `LiveActivityQA.tsx`,
which the `QA_TOOLS` flip deletes.** Several are already dead; more die with 5.5.1.

🎯 **2026-08-19: filed, not built.** *"I'm leaning toward fixing them all before we go live but I'm not
saying that for sure. We will evaluate where it stands prior to launch."* — so this is a **lean, not a
commitment**, and the call is made on the frozen build. Rationale for deferring: polish decided against a
moving app gets decided twice, and Phase 5 rewrites the data layer while 5.5.1 deletes a whole surface.

**⏳ T9–T11 — the PARTIAL enumerations, superseded by `REMAINING.md`** *(kept for their reasoning only)*.
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
- ⛔ ~~**`apps/rn/package-lock.json` is out of sync**~~ — **REFUTED 2026-08-19 by measurement**, see 5.9.
  `npm ci --dry-run` exits 0 on the committed baseline in both trees. ⚡ **The first test I ran "confirmed"
  it and was wrong** — it compared the OLD lockfile against my ALREADY-EDITED `package.json`, so the three
  missing entries it reported were mine. A premise measured against a contaminated baseline confirms itself.
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
- **[D38] ✅ (🎯 2026-08-19)** — **this ships as `2.0.0`, not `1.7.x`.** 🎯: *"a very very very large version
  and I fear that leaving it as a point release will lead to unrealistic expectations in the future."*
  ⚡ **The argument is about the FUTURE, not this release: the version number is the baseline every later
  release is measured against, and a wrong baseline is permanent.** Ship this as 1.7 and every normal
  release afterwards reads as a slowdown, forever, because of one decision. ⭐ It also stands on its own
  grounds — **Capacitor WebView → native RN is a platform change**, which is the textbook major bump even
  if the feature list were modest.
  - ⚠️ **The INTERNAL name stays "the v1.7 Elevation."** The plan, log, CLAUDE.md, audit folder names and
    a great many code comments are saturated with it; renaming is churn with real regression risk and zero
    user benefit. **Precedent in this portfolio:** Hearthlight ships as *"Hearthlight: Cozy Coloring"*
    while its repo, bundle id and home-screen name stay `Hearthlight` — a deliberate divergence.
  - ✅ **Measured: nothing user-facing carries "1.7"** — the only hits are internal comments. The shipped
    number is **one field**, `apps/rn/app.json` → `version`. ⚠️ Migration is unaffected: the bridge keys off
    the **bundle id** and RN storage being empty, never the version.
  - ▶ **Do it in Phase 6, BEFORE the ASC listing / release notes / "What's New" / App-Preview are written**
    — those all quote the version, and deciding partway through means writing them twice.
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
