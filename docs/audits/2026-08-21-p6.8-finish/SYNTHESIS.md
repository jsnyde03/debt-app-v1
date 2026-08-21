# P6.8 — the pre-release FINISH sweep: SYNTHESIS

> **This file is the decision document.** Per-lens detail is in `slices/`, refutation in `refutations/`,
> and what the frames can and cannot prove is in `matrix/README.md`.
> **Target `2.0.0` at `dd80f70`.** 13 lenses · 6 adversarial refuters · 226 frames · 9 a11y trees.
> ⛔ **Nothing here was fixed.** This is an audit; P6.8.7 builds what 🎯 admits.

---

## ⭐ THE RESULT THAT OUTRANKS EVERY FINDING

**Observations survive. Explanations do not — and it is now measured four independent ways in one audit.**

| source | observations | mechanisms |
|---|---|---|
| **W2** (the three carried findings) | 3 of 3 held | **0 of 3** held — *"third consecutive audit"* |
| **R1** (data loss) | 5 of 6 survived | **3 of 6 wrong** |
| **R2** (public claims) | 6 of 6 survived | **3 of 6 wrong** |
| **R6** (onboarding/tier) | 6 of 6 survived in substance | **2 of 6 wrong**, 1 downgraded on a decision that already existed |
| **R3** (journey) | 6 of 6 survived | 1 of 6 wrong in a clause — *and it is the exception that proves the rule, see below* |
| **R5** (accessibility) | 7 of 7 survived | **1 of 7 wrong — and it refuted the audit's most alarming single sentence** |
| **R4** (visual) | 5 of 8 confirmed · 1 downgraded · **2 refuted** | 1 of 8 wrong — **and R4's own premise about the instrument was wrong too** |

⛔ **The pattern landed on a refuter, which is the strongest evidence for it.** R4 asserted the `state-*`
and `textscale-*` frames were never re-shot; file mtimes say otherwise (routes 12:00, states 12:07–12:08,
text-scale 12:09) — it read them **mid-re-shoot**. Its observations, which rest on reading pixels rather
than on that premise, all stand. **Nobody in this audit — lens, refuter, or me — got a mechanism right by
reasoning about it. Every correct one came from running something.**

⭐ **R3 is the informative exception: a "no caller anywhere" cluster where NOTHING refuted.** Its own
explanation of why is worth keeping — *every one of those paths is gated by a pure function of persisted
state, not by dynamic dispatch, a threaded prop, or a platform entry point, so there was nowhere for a
hidden caller to hide.* **That is the shape of claim you can trust; the ones that fail are the ones that
explain a symptom rather than trace a value.**

⛔ **And twice, the fix the lens proposed would not have closed the defect it found** (R1 on the iCloud
clobber; R1 on the v1.6 bridge retry). That is the whole argument for the refutation wave: without it,
two fixes ship, both green, neither working.

⚡ **W2 adds the corollary nobody had stated: a carried NUMBER decays exactly like a carried premise.**
Five of six figures quoted in the ledger and plan row were wrong — 16→**23** literals · "2 of 8"→**6 of
15** styles · 26→**32** pins · 73→**72** strings · "four primitives"→**4 done, 7 left**. Nothing
re-checks a number once it is written down.

---

## ⛔ THE INSTRUMENT WAS WRONG TWICE, AND IT COST MORE THAN ANY FINDING

Full account in `matrix/README.md`. In brief: **every `onboarding` frame was a photograph of Today** (ten
of them), and **every `today.png` was shot mid entrance-animation** with light and dark landing at
different points in the same fade.

The first defect took **three mechanisms** to diagnose. Two were wrong, and **the second was mine and was
re-shot on** before O1 measured it false in a fresh context. O1 named the hazard in advance:

> *"a re-shot matrix will produce Today again, this time carrying a fix's authority."*

⚡ **A re-shoot on a wrong fix is worse than the original bug.** The real cause was `runMigrations` →
`inferOnboarding`, which promotes `onboardingComplete: true` whenever a blob carries income **and** an
obligation — which the shared test `scenario()` always seeds.

⚡ **The rule this produces: an instrument that fails LOUDLY beats one that fails accurately most of the
time.** The two sheet timeouts announced themselves and cost 2 frames; these failed silently and cost 14,
plus whatever six lenses concluded from them. Every surface now carries a `ready` assertion — a field
that existed on the interface and was used by nothing — so a frame that cannot find its subject fails
instead of lying.

---

## 🔴 SHIP-BLOCKERS — survived refutation

### 1 · The App Store listing sells a premium tier that does not exist *(M1-5 · R2 CONFIRMED, strengthened)*
R2 queried the **live listing** (`itunes.apple.com/lookup?id=6773201250`), not the repo: it still serves
the **v1.6 description with all six premium bullets verbatim** and "CSV import" as free. **Six for six
wrong** — Smart Insights and 3-Month Forecast were *scrapped 2026-07-22* by the app's own record; What-If,
Amortization and Pay Cycle History **ship free**. ⛔ *"P6.21 rewrites it"* is not a defence: **ASC carries
the description forward by default.** Pay Cycle History is listed as Premium **twice**.

### 2 · The paywall-linked privacy & support pages contradict 2.0 *(M1-1/2/6 · R2)*
⛔ **And the repo's `site/*.html` are a DECOY.** The URLs in `premium/legal.ts:14,16` point at a
**different repo**; no workflow deploys `site/`; the repo copies are v1.5 and the live pages are v1.7 and
have already diverged. **A PR "fixing" `site/` produces a green tree over an unchanged public page.**
The live `support.html` premium sentence is four-for-four wrong and its FAQ gives **step-by-step
instructions for a CSV import that does not exist**.

### 3 · ⚠️ The ASC privacy label must declare Diagnostics — and the plan does not say so *(R2, unfiled by any lens)*
`DEBT_SENTRY_SETUP.md:28` records the **DSN added to the Codemagic group 2026-08-20**, so crash reporting
**ships**. `DEBT_ELEVATION_PLAN.md:61` plans only *"declaring RevenueCat"*. A missing Diagnostics
declaration is a submission rejection.

### 4 · The celebration and the debt-free finale are unreachable for a free user *(M2-5 · R3 CONFIRMED, worsened)*
`PaidOffBeat`/`PaidOffFinale` render only from `celebration`, set only by `confirmPayoff()` ←
`PayoffInvitationCard` ← `selectProvisionalPayoffs`, which returns `[]` for free. Whole-repo grep
(including `node_modules`): **exactly two files touch `setCelebration`.** ⛔ And `store/payday.ts:128`
**deliberately excludes the 100 % crossing** (*"finale owns debt-free"*, pinned by `milestoneCross.test.ts:45`)
— the code consciously vacated the only other candidate watcher. **A free user can pay off every debt
they own and never see the beat or the finale.** `celebration.spec.ts` seeds premium in every case.

### 5 · `NaN <= 0` is `false`, so every amount guard admits garbage *(O1-9 · R6 CONFIRMED, scope corrected)*
`Number("1.2.3")` and `Number("1,200")` both → `NaN` → pass validation. No downstream layer catches it.
⛔ **Scope is 12 sites across 7 files, not the 4 across 2 the slice named** — including `DebtSheet`'s edit
path. ⚠️ **And the consequence is worse than filed:** `dataRepairs` is written at `migrations.ts:177` and
**read by nothing outside tests**, so there is no repair notice — a $12,000 card silently becomes **$0**,
filed under Money's **`PAID OFF`** header. `migrations.ts:36-42` calls that outcome *"the worst of the
three"* in writing. The correct expression already exists in-repo at `WindfallSheet.tsx:50`.

### 6 · Corrupt local store is a silent total wipe *(M3-1 · R1, held at major on reachability)*
`store.ts:263-275` quarantines the bytes, seeds defaults and overwrites, leaving `storageError` null. The
user lands in onboarding with their plan gone and **not one word**. The quarantined bytes are read by
**nothing** in the app. ⚠️ R1's correction: the wipe sets `onboardingComplete: false`, which *does* fire
the iCloud restore offer — so there is a narrow way back, if a backup exists (default-off). The
`read() === null` sibling path preserves **no** bytes at all.

### 7 · The iCloud toggle destroys the backup you just declined *(M3-3 / W1-2 · R1 CONFIRMED, mechanism replaced)*
Flipping "Back up to iCloud" ON calls `backupNow()` immediately — while the sheet is displaying
*"Last backed up &lt;date&gt;"* from the remote. ⛔ **Both lenses' proposed fix would not have worked.**
They diagnosed *"it bypasses `shouldAutoBackup`"* and recommended routing it through the guard; R1
evaluated the guard against the state that exists at that moment and **it returns `true` and permits the
clobber anyway.** The real mechanism: `shouldAutoBackup` reasons only about local state and has **no
clause about the remote at all**; `declinedRestore` is a `useRef` proxy the hook cannot see, and it only
holds when the Alert was actually shown.

### 8 · The v1.6 bridge's "retried next launch" guarantee is false *(W1-6 · R1 CONFIRMED, mechanism extended)*
`bootstrapPersistence` runs the bridge, then `hydrate`'s first-launch branch writes defaults **on the same
launch** — so storage is never null again and every skip reason is permanent. An upgrader's whole
portfolio is stranded, silently, and `outcome.reason` is discarded by its only production caller.
⛔ R1's correction: the lens enumerates three skip reasons and **misses the reachable fourth** — a genuine
v1.6 container whose databases are *found and refused* is tagged `'no v1.6 store in this container (a
fresh install)'`. **The lens's own fix would leave the likeliest failure tagged terminal.**

---

## 🟠 MAJOR — survived refutation

- **`dataRepairs` is rendered by nothing** *(M3-2 · R1, harm understated)* — a repaired `balance: null → 0`
  is filed under `PAID OFF`; if it hits every debt the hero renders *"Every balance cleared."*
- **"Delete all data" has no story for the remote** *(M3-8 · R1, promoted)* — the iCloud copy survives and
  **the next launch offers the previous owner's plan to whoever holds the phone.** `CloudBackupProvider`
  has no `delete`. Structural.
- **The absorb path has no user entry point** *(M2-6 · R3 CONFIRMED)* — `surpriseOutflow` and
  `actualIncome` are constructed only in the tutorial sandbox and tests, so the two safety-net acks Today
  is built to render can never fire, and `LeanSuggestionCard` is unreachable in production. ⚠️ R3's
  correction: `missed` **is** reachable via `declareMissedPaycheck()`.
- **`usePaydayCapture.open()` has no caller** *(M2-2 · R3 CONFIRMED)* — after "Skip this payday" there is
  no way back into the app's central recurring moment. A **two-generation** omission: legacy v1.6 ships
  the same dead `open()`.
- **A user away one cycle + 8 days is stranded** *(M2-1 · R3, one clause refuted)* — `PaycheckSheet`'s Save
  *does* advance the date. What survives is sharper: **the date can be advanced, the cycle cannot** — so
  the escape hatch makes the missed cycle unrecoverable *while making the app look correct*.
- **No "no-bills" branch** *(M2-9 · R3 CONFIRMED, worsened)* — `RequiredActionsCard.tsx:105-107` renders
  green **"You're caught up for this paycheck"** to a user who never told the app about rent.
- **Windfall Autopilot is inverted** *(P1-10 · R6 CONFIRMED)* — no tier gate at any of four paths; free
  money is routed identically while the premium invite says premium *"shows"* you where it lands. Fails
  the spec's own price test: *removing it must remove WORK, not just info.*
- **Six large money figures have no font clamp** *(V3-1 · R6 CONFIRMED, 6/6 reachability attacks failed)* —
  all free-tier, four one tap off a primary tab. `PlanHero.tsx:151-153`'s comment claiming the three tab
  heroes were the only unclamped figures is false.
- **The charts fail by arithmetic** *(V3-5/6 · R6 CONFIRMED, understated)* — `endPillW = 20 + chars * 6.5`,
  fixed-width absolutely-positioned labels in a hard-height plot. **Only 2 labels carry `numberOfLines`,
  and neither is an axis label — so they wrap and overflow rather than truncate.**
- **The first screen promises a premium feature** *(M1-9 · R2 CONFIRMED, worse than filed)* — *"Check any
  purchase against your plan before you buy"*, and the free branch **repeats the user's own figure back
  solely to withhold the answer** (`AffordabilityCard.tsx:170`).
- **`lint:apostrophes` is blind to `&apos;`** *(W1-1)* — 23 rendered straight apostrophes outside the
  72-site baseline, and the gate cannot stop that growing.
- **`web-e2e.yml` omits `test:stamp` and `test:e2e:embed`** *(W1-3)* — so [D44]'s new Pages guard gates the
  marketing embed on a run that never exercises the embed.

### ⚡ Found while refuting, filed by no lens
**The Payday Countdown Live Activity can never start** *(R3, bonus)*. `shouldRunPaydayActivity` gates on
`wholeDaysBetween(currentDate, nextPaycheckDate) <= 3` — **verified myself** at
`paydayActivityContent.ts:103-107` with `PAYDAY_ACTIVITY_WINDOW_DAYS = 3`. `currentDate` is the *cycle
anchor*: every writer sets the pair a full cycle apart and nothing advances it day by day, so the gap is
never under 7. The Lock-Screen surface, its "Payday landed" button (**the only second rollover door**) and
the More toggle are all dead. `paydayActivityContent.test.ts:39-40` is green because it hand-builds a
2-day gap production never produces. ⚠️ Source-only — **owed a device check**.

---

## ✅ REFUTED / DOWNGRADED — do not build these

- **P1-12 the money-back guarantee** → **DOWNGRADED.** A decision already exists
  (`DEBT_ELEVATION_LOG.md:5215`, 2.11.1 `[DECISION] ✅`): the proof-window role was explicitly reassigned —
  *"the generous free tier is the proof window."* Work is one stale spec line.
- **P1-9 the finale's confetti** → **MECHANISM WRONG.** Nothing was reversed: confetti shipped in v1.5 and
  feature-locked **2026-07-02**; *"Never confetti"* was first committed **2026-07-20**. **The rule is
  younger than the behaviour**, three documents say it not four, and the benchmark beneath them permits
  particles *"sparingly, if at all, only atop the real win"* — which a once-ever finale satisfies.
  **Cutting it is the wrong option to offer.**
- **M1-8 the analytics contradiction** → **half refuted.** The switch is genuinely inert, but the live
  privacy page's "no behavioral analytics" is **TRUE**, so there is no two-claim contradiction. ⚡ This
  *forces* the fix direction: **shipping a sink would falsify the paywall-linked policy.** Hide the row.
- **L1-20 eyebrow treatment** → **DECISION, recommend deferring** *(W2)*. Its mechanism is **false on iOS**:
  RN uppercases the `NSString` itself, so VoiceOver reads "PAYDAY GUARDIAN" either way. 23 edits + **32
  test pins** for a change **invisible to users**. The valuable slice is a single `eyebrow` token.
- **L4-13b `PressableScale` app-wide** → **DECISION, recommend "nowhere"** *(W2)*. The finding says two
  press vocabularies; there are **three**, and the majority is the third: of 69 tap targets, 1 springs,
  11 dim, **57 have none**. "App-wide" is a new design on ~45 targets inside a freeze, with zero test
  coverage.
- **V1-0 / the mid-animation frames** — every finding sourced from an unsettled frame. V1 marked its own.

---

## 🔵 ACCESSIBILITY — R5, and the best-verified work in the audit

R5 settled its cluster by dumping the accessibility tree from **both Playwright and the installed
Chromium** and comparing them — the only way to tell a tool artifact from a product defect. Probes pinned
and regenerable in `refutations/evidence/`.

⛔ **A1-6 — MECHANISM WRONG, and it refutes the audit's most alarming single sentence.** The RNW half is
confirmed three files deep (`accessible` is in neither forwarded-props list, so a role-less
`<div aria-label>` is exactly what ships). But *"ARIA forbids a generic from being named"* describes the
**spec and Playwright**, not the browser: Playwright's `elementProhibitsNaming` hard-sets the name to `""`
before reading `aria-label`, while **Chromium exposes it** —
`generic name="0% paid, no milestones reached yet, next milestone 25%"`. So *"Progress's headline is
announced by nothing at all"* is **refuted**. iOS is clean (`RCTViewComponentView.mm:350`).
⚡ What replaces it is subtler and was missed by the lens: **web exposes the composed label AND the child
fragments**, so web *duplicates* rather than loses — **adding a role alone would not fix ~19 of 20 sites.**
Count corrected: 20 role-less of 23, not 22 of 24.

**Survivors, all confirmed:**
- **A1-2** *(both platforms)* — Progress's bars announce the **engine's internal vocabulary**
  (`stable`/`tight`/`pressure`) instead of the shipped words (`Clear`/`Tight`/`Very tight`). A user on
  their worst cycle hears *"$120 of room, **pressure**."* **Fix is one line** — `TimelineCycle` already
  carries `guardianState` beside `cushionStatus`. `glossary.test.ts` reads the constant, not the label.
- **A1-11** *(web)* — **undercounted 1 → 6 sites**, and three are `role="radio"` + `aria-selected`, where
  Chromium supplies `checked="false"`: ⛔ **the chosen option is announced as unchosen.** Worse than
  silence — and none of the three is the paywall.
- **A1-8** *(both)* — `groupLabel` never takes `badges`, so **Focus** is announced to nobody.
  **Undercounted**: the BNPL provider name is a third dropped badge, and `money.tsx:473` records dropping
  it as a deliberate decision.
- **A1-7** *(web; iOS undecidable)* — `ListRow`'s swipe-delete is announced **before** the row it deletes.
  ⚠️ **One clause is wrong and it blocks the obvious fix:** `RequiredActionsCard`'s comment records that
  gating on open/closed **was measured to break the swipe gesture** — so copying its pattern into
  `ListRow` inherits a documented-as-broken approach.
- **A1-9 / A1-10** — `AffordabilityCard` has zero a11y props; and the missing half the lens did not find:
  `announceForAccessibility` is a **literal empty function in RNW**. ⚡ **No primitive in this codebase
  announces on both platforms** — `aria-live` is web-only, `announce()` is iOS-only.

⭐ **The cheapest item in the entire audit:** adding `aria-allowed-attr` to `a11y-axe.spec.ts:19` gates
**all six** `a11ySelected` sites. R5 verified it by running the installed axe-core over its own probe —
that rule flags both shapes, and `aria-valid-attr-value` (which *is* in the list) flags neither.
⛔ **Gate coverage across all seven a11y findings is currently zero.**

---

## 🎨 VISUAL — R4, and the refuter fell into the audit's own trap

⛔ **R4's premise about the instrument is WRONG, and I verified it by file mtime rather than accepting
it.** It reports that *"only the route frames were re-shot; the 32 `state-*` and all `textscale-*` frames
are still the 700 ms instrument."* They were re-shot: routes landed **12:00**, `state-today-empty.png`
**12:07** (now 91,738 bytes against the 21 KB cold-start artifact V4 reported), `state-progress-huge.png`
**12:08**, `textscale-2x-*` **12:09**. R4 read them **mid-re-shoot** and generalised from what it saw.

⚡ **Its observations still hold, and that is the point** — this is the audit's own headline pattern
landing on a refuter: *the observation survives, the premise fails.* Its refutations of V4-9 and V4-11
rest on **reading the pixels** (a fully rendered ring in 8/8 Progress frames, 122 gold px each, both
themes), not on the re-shoot claim, so they stand.

| finding | verdict |
|---|---|
| **V1-2** light AA grid | ✅ **CONFIRMED — strengthened** |
| **V2-6** coach mark covers its own subject | ✅ **CONFIRMED to the pixel** |
| **V1-5** `border.default` invisible in light | ✅ **CONFIRMED, reframed** |
| **V1-1** Guardian chip | ✅ **CONFIRMED** (`clear`; other two computed) |
| **V2-1 / V4-7** date truncation | ⚠️ **MECHANISM WRONG, OBSERVATION HOLDS** |
| **V4-8** labelled empty chart | 🟡 **DOWNGRADED** |
| **V4-9** invisible skeleton ring · **V4-11** stray hairlines | ⛔ **REFUTED** |

**V1-2 survives independent re-derivation and gets worse.** R4 reproduced all 64 cells: light floor
**2.63**, dark floor **4.75**, **17/32 vs 0/32**. ⛔ **The large-text 3:1 attack — the one most likely to
collapse it — reaches only 2 of 10 named sites, and both still fail even that floor** (`accent.success`
at 30/800 on `#e6ebf3` = **2.81**). Two honest corrections *against* the lens: light's `secondary` and
`elevated` are the same hex, so the real figure is **15 of light's 24 distinct pairs (62.5 %)**; and
`accent.gold` is used as a text colour **zero times**, so its cells are 1.4.11 icon cells and the 2.63
floor is a grid minimum rather than a rendered one.

**V1-5 reframed, and the reframe matters:** the byte-walk reproduces exactly (light border `#e7e9ee`,
ΔL\* **0.56**; dark `#313d57`, ΔL\* **20.88**) — but by SC 1.4.11 **all four boundaries fail 3:1, dark
included** (border 1.75, fill 1.21). ⚡ **Dark is perceptually fine and formally non-conformant**, so the
lens's light-vs-dark parity framing understates the problem while pointing at the right pixels.

**V2-6 measured, not argued:** trajectory card top `y=569`; `569 − 132 = 437`; observed callout top
**437**. And the callout's real height is **144 px** at 402 pt versus 122–123 at wider widths — so
`rect.y − 132` puts its bottom **12 px inside the subject**, breaking the fallback's own documented
invariant.

**V2-1's numbers are wrong and its point is under-claimed:** `October 2026` is 12 chars using 165 of
186 pt — "~11 characters" is off, and 2 months truncate rather than 4. ⚠️ But the truncating seed is **a
single $1,200 debt**, not the exotic one — so it is likelier than the lens claimed.

⭐ **And the instrument bug's real cost is the opposite of what it looked like.** R4: *"V4-9, V4-11 and 3
of V4-8's 4 citations were killed by the lens, not the instrument."* V1-0 supplied a ready-made
*"it looks unfinished"* explanation that got **reached for on frames it never touched**. Meanwhile V4-8
**does** reproduce — in `split-view/{light,dark}/progress.png`, in **both** themes, which nobody read.
⚡ *A known instrument defect is itself a hazard: it becomes the explanation of first resort.*

---

# ⭐ P6.8.6 — WHAT NEEDS A DECISION FROM 🎯

⛔ **Nothing below is built.** The charter is explicit: *anything structural is a SCOPE CALL, never an
automatic fix, or the sweep expands the freeze it exists to protect.* Feature lock closes at **P6.10**, so
these still have somewhere to go — that is the only reason this gate sits here.

## A · SUBMISSION BLOCKERS — not scope calls, they must be done

These are not optional and most are **copy, not code**, so they do not threaten the freeze.

| # | what | cost |
|---|---|---|
| **A1** | Rewrite the **live ASC description** from `paywall.tsx:28-42` — it currently sells six premium features that don't exist or ship free | copy, ASC only |
| **A2** | Fix the **live** `privacy.html` + `support.html` *(in the OTHER repo — `site/` here is a decoy)*: the iCloud bullet, the crash-reporting tense, the four-wrong premium sentence, and the FAQ's instructions for a CSV import that doesn't exist | copy, other repo |
| **A3** | **Declare Diagnostics/Crash Data on the ASC privacy label** — Sentry's DSN ships and the plan says only "RevenueCat" | ASC checkbox |
| **A4** | Reword `WelcomeStep.tsx:19` — the first screen promises a premium feature | ⚠️ **code — must beat the P6.19 freeze** |

## B · DEFECTS I WOULD BUILD IN 2.0 — my recommendation, your call

| # | what | why now |
|---|---|---|
| **B1** | **`NaN <= 0` amount guards** — 12 sites, 7 files. `"1,200"` silently becomes **$0 filed under `PAID OFF`** | data corruption from a plausible keystroke; the correct expression already exists at `WindfallSheet.tsx:50` |
| **B2** | **Free users can never see the celebration or finale** | the product's emotional payoff, absent for the majority tier |
| **B3** | **The iCloud toggle destroys the declined backup** — ⚠️ and the obvious fix does NOT work; `shouldAutoBackup` has no clause about the remote | the only finding here that **destroys otherwise-recoverable data** |
| **B4** | **Corrupt store = silent wipe** + **`dataRepairs` rendered by nothing** | one of these turns a loud failure into a silent one |
| **B5** | **`aria-allowed-attr` in the axe spec** (1 line) + the Guardian vocabulary label (1 line) | cheapest real wins in the audit; a11y gate coverage is currently **zero** |
| **B6** | **Light-theme contrast** — 15 of 24 distinct pairs fail AA; dark fails **0** | the whole light theme is below a standard the app already meets in dark |

## C · 🔴 THE SCOPE CALLS — these genuinely add capability

| # | the gap | verdict I'd give |
|---|---|---|
| **C1** | **The absorb path has no user entry point** — `surpriseOutflow`/`actualIncome` exist only in the tutorial. Two safety-net acks Today is built to render can never fire | **2.0** — it makes built UI dead |
| **C2** | **`usePaydayCapture.open()` has no caller** — after "Skip this payday" there is no way back into the app's central recurring moment | **2.0** — small, and it strands the core loop |
| **C3** | **A user away one cycle + 8 days is stranded** — the date can be advanced, the cycle cannot | **2.0 if cheap**, else 2.1 |
| **C4** | ⚡ **The Payday Countdown Live Activity can never start** — `currentDate` is a cycle anchor and the gate needs ≤ 3 days. A whole premium feature, plus the only second rollover door | **needs a device check first** — source-only |
| **C5** | **No "no-bills" branch** — the app tells a user who never entered rent *"You're caught up for this paycheck"* | **2.0** — it is a false statement about money |
| **C6** | **Trust copy at the first data-entry moment** *(M4-8)* — the wording already exists in `DEBT_BENCH_TRUST_FIRSTRUN` §R1; T2/T4 shipped, T1/T3 didn't, and the doc calls that pair *"the single highest-leverage trust change"* | **2.0** — copy, best ratio in the audit |
| **C7** | **Snowball vs avalanche side by side** — both simulations already run on every render; `TrajectoryChart.tsx:133` discards one | **2.1** — real work, and the listing sold it |
| **C8** | **CSV import** — `core/imports/debtCsv.ts` exists and its only caller is the tree **P6.11 deletes**. The live listing advertises it as free | **decide before P6.11**, or it leaves with the old surface |
| **C9** | **"Delete all data" leaves the iCloud copy** — the next launch offers the previous owner's plan to whoever holds the phone. `CloudBackupProvider` has no `delete` | **2.0** — privacy, and it is a one-method gap |
| **C10** | **Money-back guarantee** *(P1-12)* — ⛔ **already decided**: the proof window was reassigned to the free tier. Listed only so it is not re-raised | **no action** |

## D · DO NOT BUILD — refuted, with reasons on the record

**The finale's confetti** (the rule is younger than the behaviour; the benchmark permits it) ·
**the eyebrow sweep** (mechanism false on iOS — 32 test pins for a change invisible to users) ·
**`PressableScale` app-wide** (57 of 69 targets have no press feedback; "app-wide" is a new design inside
a freeze) · **the invisible skeleton ring and Today's stray hairlines** (refuted on the pixels) ·
**"Progress's headline is announced by nothing"** (Chromium exposes it).
