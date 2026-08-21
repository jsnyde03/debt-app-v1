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

## 📋 STILL OPEN AT TIME OF WRITING

**R4 (visual/contrast)** and **R5 (accessibility)** are still running. The two headline claims awaiting
their verdict:
- **V1-2** — 17 of 32 light-theme token pairs fail WCAG AA; 0 of 32 dark. *"Dark is the theme that was
  designed; light is dark's tokens inverted and never re-measured against its own ground."* ⚠️ R4 is
  instructed to **re-derive it** rather than trust it, and to check whether the **large-text 3:1 floor**
  applies at each site — that alone may downgrade several.
- **A1-6** — 22 of 24 grouped screen-reader utterances invisible **on web** because RNW gives a role-less
  `div` an `aria-label` that ARIA forbids it to use. **Severity depends entirely on whether iOS shares
  it**, and on iOS this is the canonical grouping idiom.

_This section is replaced when they land._
