# W2 — THE THREE CARRIED FINDINGS

> Lens **W2** of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Scope is **exactly three** ids — `L1-20`, `L1-22`, `L4-13b` — the only ones P6.4 deferred out of
> the 62 it judged. ⛔ Not a re-run of "T12, ~40 polish items"; that row is stale and stays stale.
>
> Method, in this order: **ledger first, code second.** This project measured that a triage which
> greps the tree first was wrong 9 times in 62 — a fix that adds a *branch* leaves the finding's
> quoted string in place, so grep finds the healthy half of a fix and calls it unfixed.
>
> **Verdicts: `L1-22` BUILD 2.0 · `L1-20` DECISION *(defer the sweep)* · `L4-13b` DECISION *(answer
> "nowhere")* + BUILD 2.0 on a half-closed fix that rides along.**
>
> _Status: COMPLETE._

---

## Method note — what I did before opening a file

Read, in order: `README.md` (this audit) → `DEBT_ELEVATION_LOG.md` §P6.4 whole-item after-scan,
§P6.4.4 (`L1-22`), §P6.4.5 (`L4-13`'s first half), §P6.4.6 → the findings **as filed**
(`docs/audits/2026-08-17-v1.7-audit-gate/findings/L1-voice.md:166-183`,
`findings/L4-numbers-visual.md:128-162`) → `scripts/check-apostrophes.ts` and its baseline → then the
tree. Counting was done with **AST passes** (`typescript` `StringLiteral` / template spans / `JsxText`),
not line-greps, for the reason P6.4 measured: *a grep answers a question about TEXT, and every one of
these is a question about CODE.*

⚠️ **All three ledger figures for these items are LOW.** Recorded here up front because the pattern is
now on its **seventh** consecutive item:

| figure | ledger says | measured at `dd80f70` |
|---|---|---|
| `L1-20` literals | 16 | **23** literal-caps render sites (+2 more via `.toUpperCase()`) |
| `L1-20` styles | *"6 styles"* / *"2 of 8"* | **15** styles named `eyebrow` (**6** with `textTransform`); **34** uppercase-display styles in total |
| `L1-20` test pins | 26 | **32** exact-string pins (+1 case-insensitive that survives) |
| `L1-22` copy strings | 73 | **72** — one was removed by the `L1-25` fix at `022bcee`; the baseline file already says 72 |
| `L4-13` press sites | *token taken across "four primitives"* | token at **4** sites, **7 inline literals still live** at 5 values |

---

### W2-L1-20

**Verdict:** **DECISION** *(a visual-system call — and my recommendation inside it is **defer the string sweep**)*

**The finding as filed** (`docs/audits/2026-08-17-v1.7-audit-gate/findings/L1-voice.md:166-172`):

> **L1-20 · ALL-CAPS baked into strings rather than applied by style** — severity **minor**.
> *"Most eyebrow styles already apply `textTransform: 'uppercase'` (confirmed at `TrajectoryChart.tsx:483`,
> `PlanHero.tsx:231`, `CashRunwayChart.tsx:224`, **and 17 more**), yet the strings are also written in caps;
> `GuardianScorecard.tsx:92` has no `textTransform` and relies solely on the literal caps."*
> **Why it matters:** *"VoiceOver can spell out or alter intonation on literal all-caps text, so
> screen-reader users hear these differently from a styled equivalent — and the two mechanisms mean a
> future style change will only reach half the headers."* Confidence: **high (styles read in source)**.
> **Suggested fix:** *"Write every eyebrow in sentence case and let `textTransform` do the work."*

**Measured now:**

⛔ **There are THREE mechanisms, not two, and nobody has counted the third.**

| # | mechanism | sites |
|---|---|---|
| 1 | **literal caps in the string** | **23** render sites |
| 2 | **`textTransform: 'uppercase'` in the style** | **24** style definitions |
| 3 | ⚡ **`.toUpperCase()` in JS at render** | **2** — `plan/PaidOffBeat.tsx:116` and `plan/ShareCard.tsx:50`, both `{debtName.toUpperCase()}` |

**Styles named `eyebrow`: 15 — six apply `textTransform`, nine do not.** Neither *"most already apply it…
and 17 more"* (the finding) nor *"2 of 8"* (the ledger's correction) describes the tree:

| ✅ has `textTransform` (6) | ❌ literal-caps only (9) |
|---|---|
| `app/(tabs)/progress.tsx:234` · `payoff/TrajectoryChart.tsx:491` · `plan/CashRunwayChart.tsx:233` · `plan/PlanHero.tsx:250` · `progress/CashFlowSection.tsx:147` · `progress/PaidOffArchive.tsx:95` | `plan/AffordabilityCard.tsx:235` · `plan/GraduationCards.tsx:64` · `plan/GuardianScorecard.tsx:101` · `plan/LeanSuggestionCard.tsx:48` · `plan/PaidOffBeat.tsx:172` · `plan/PaydayGuardianCard.tsx:533` · `plan/RecoveryPlanSection.tsx:143` · `plan/ShareCard.tsx:93` · `plan/WindfallSheet.tsx:127` |

⭐ **The split is not random — it is two authoring generations, and `letterSpacing` gives it away.** Every
❌ style is `letterSpacing: 0.8` (or `1` on the two share/finale cards) with no `fontWeight` convention;
every ✅ style is `0.4`/`0.5`/`0.6` **with** `fontWeight: '700'` (or `'600'`). The ❌ family is almost
entirely `components/plan/`. Widen past the *name* `eyebrow` and the same role is carried by `groupLabel` ·
`groupHeaderLabel` · `sectionLabel` · `sectionTitle` · `groupTitle` · `bucketLabel` · `statLabel` ·
`colMonth`/`colVal` · `month` · `header` · form-field `label` — **34 uppercase-display style definitions in
all, spanning five `letterSpacing` values (0.4 / 0.5 / 0.6 / 0.8 / 1.0) and three `fontWeight` states, with
no token anywhere.** ⚡ **That, not the caps, is the real system defect — and no filed finding names it.**

**The 23 literal-caps render sites**, AST-enumerated over `apps/rn/src` + `packages/core`, tests excluded
*(count it yourself — this is the seventh consecutive item on which a filed list came in short)*:

`app/(tabs)/money.tsx:330` "PAID OFF" · `app/(tabs)/progress.tsx:101,176` "DEBT-FREE" ×2 ·
`entities/AmortizationView.tsx:85,86` "MONTH" / "BALANCE" · `money/BnplCalendarSection.tsx:69` "UPCOMING
BNPL INSTALLMENTS" · `payday/PaydayCaptureSheet.tsx:383` "EXTRA PAYMENTS" · `payoff/TrajectoryChart.tsx:287`
"PAYOFF TRAJECTORY" · `plan/AffordabilityCard.tsx:112,136,155` "CAN I AFFORD IT?" ×3 ·
`plan/CashRunwayChart.tsx:136` "CUSHION BY PAYCHECK" · `plan/GraduationCards.tsx:46` "YOUR NEXT CHAPTER" ·
`plan/GuardianScorecard.tsx:33,66` "GUARDIAN ACCURACY" ×2 · `plan/LeanSuggestionCard.tsx:34` "INCOME FLOOR" ·
`plan/PaydayGuardianCard.tsx:217` "PAYDAY GUARDIAN" · `plan/PlanHero.tsx:143` "THIS PAYCHECK ·" ·
`plan/RecoveryPlanSection.tsx:60,76` "COVER NOW" / "CAN WAIT IN YOUR PLAN" · `plan/WindfallSheet.tsx:101`
"HERE'S HOW THE APP WILL ROUTE" · `progress/CashFlowSection.tsx:59` "CASH FLOW · NEXT" + "PAY CYCLES" *(two
nodes on one line)* · `progress/PaidOffArchive.tsx:48` "DEBTS PAID OFF ·".

✅ **There is NO live rendering defect.** I read all 15 eyebrow consumers: every no-`textTransform` style is
fed literal caps or `.toUpperCase()`, and every `textTransform` style is fed caps (idempotent) or sentence
case. **Nothing renders in the wrong case anywhere on any surface.**

⭐ **The app already contains the pattern the finding asks for, in roughly 13 places.**
`components/screen.tsx:114` `<Section title="Data">` — used at `more.tsx:209,230,317,336` — is sentence
case plus `sectionTitle`'s `textTransform`; so are `TextField` / `Select` / `DateField` field labels and
`ShareCard` / `PaidOffFinale`'s `label="paid off"` stat captions. The fix is *converge on what already
exists*, not invent something.

**Premise held? NO — and it is the stated MECHANISM that fails, on the platform that actually ships.**

⛔ **`textTransform` does not protect VoiceOver on iOS.** React Native applies it by uppercasing the
`NSString` itself before it becomes the attributed string —
`apps/rn/node_modules/react-native/Libraries/Text/RCTTextAttributes.mm:303`:
`case RCTTextTransformUppercase: return [text uppercaseString];`, reached from `applyTextAttributesToText:`.
The native accessibility value is therefore **"PAYDAY GUARDIAN" either way**, and a screen-reader user
hears the identical string before and after the fix. The finding's "why it matters" has two clauses: the
**a11y clause is refuted**; the **drift clause survives and is real**.
⚡ Law IV, again — *a finding that arrives with a mechanism is a hypothesis, and the mechanism is the part
that fails.* Its confidence read "high (styles read in source)"; the styles were read, the platform was not.
*(Web is the opposite: RNW emits CSS `text-transform`, so the DOM text stays sentence-case. The two
platforms disagree — which is exactly where the sweep's cost lands.)*

**Cost to build:**

- **23 literal edits · 9 styles gain `textTransform`**, plus a call on the 2 `.toUpperCase()` sites (a
  *dynamic* value cannot be uppercased by a literal edit, so `debtName.toUpperCase()` is the one place
  mechanism 3 is legitimate — it should be deliberate, not residue).
- ⛔ **32 exact-string test pins must move IN THE SAME COMMIT, across 10 files.** Because RNW renders
  `textTransform` as CSS, sentence-casing a string changes the **DOM text** the web suite matches on:

  | pin | n | files |
  |---|---|---|
  | `'PAYDAY GUARDIAN'` | **18** | `e2e/guardian.spec.ts` ×7 · `e2e/tutorial-invite.spec.ts` ×8 · `e2e/trials.spec.ts` ×2 · `e2e/ipad-layouts.spec.ts` ×1 |
  | `'PAYOFF TRAJECTORY'` | 5 | `e2e/trajectory-interactivity.spec.ts` ×2 · `e2e/vis5-cone.spec.ts` ×2 · `shots/phase35-themes.shot.ts` ×1 |
  | `'CAN WAIT IN YOUR PLAN'` | 2 | `e2e/recovery.spec.ts:30,52` |
  | `/HERE'S HOW THE APP WILL ROUTE/` | 2 | `e2e/windfall.spec.ts:34,48` — a regex, but **case-sensitive** |
  | `'CAN I AFFORD IT?'` · `'CUSHION BY PAYCHECK'` *(`exact: true`)* · `'GUARDIAN ACCURACY'` · `'COVER NOW'` · `'UPCOMING BNPL INSTALLMENTS'` | 1 each | `affordability` · `cushion-forecast` ×2 · `recovery` · `bnpl` |

  ⚠️ **One pin is not a text matcher at all, and a "find the `getByText` calls" sweep will miss it** —
  `e2e/tutorial-invite.spec.ts:807` runs, inside `page.evaluate`,
  `[...document.querySelectorAll('div')].find((d) => d.textContent?.startsWith('PAYDAY GUARDIAN'))`, then
  measures geometry off that node. That is the one that fails in a way that does not read as a copy change.
  ✅ Exactly one pin **survives** untouched: `e2e/celebration.spec.ts:98` `getByText(/DEBTS PAID OFF ·/i)` —
  the `/i` was added for an unrelated reason and happens to make it case-agnostic.
- **Gates: none move.** `duplicate-copy-baseline.json` holds no all-caps entry, and `lint:selectors`' only
  `COVER NOW` hit — `.maestro/10-walkthrough-edges.yaml:159` — is inside a **comment**, not a selector.
- **Risk profile:** the rendered result is byte-identical on both platforms, so **the entire change is
  invisible to a user**. All of the risk sits in the 32 pins; all of the benefit accrues to the next person
  who edits an eyebrow.

**Recommendation:** **DECISION for 🎯 — and I recommend deferring the string sweep to 2.1**: it changes
nothing a user can see, its accessibility justification is refuted on iOS, and it costs 23 source edits
plus 32 test-pin moves on a tree two weeks from submission; ⭐ **if 🎯 wants the systemic half now, the
cheap and genuinely valuable slice is a single `eyebrow` text token in `theme/`** (one `letterSpacing`, one
`fontWeight`, one `textTransform`) adopted by the 34 style definitions — that fixes the drift the finding
actually predicts, touches **zero strings and zero tests**, and turns the string sweep into a no-op
whenever it happens.

**Confidence:** **high** on every count above and on the iOS refutation *(read in React Native's own
source, not inferred)*; **medium** that "34 uppercase-display styles" is complete — that class has no gate,
and I enumerated it by `textTransform` plus the `eyebrow`-name family, so a style that is uppercase by
convention under a third name could still sit outside it.

---

### W2-L1-22

**Verdict:** **BUILD for 2.0**

**The finding as filed** (`findings/L1-voice.md:180-184`):

> **L1-22 · Straight and curly apostrophes are mixed** — severity **minor**.
> *"The same contraction is typeset two ways across the app, sometimes for identical sentences ("An
> ongoing cost that doesn't end." appears straight in `AddObligationSheet` and `ExpenseSheet`,
> curly-adjacent elsewhere)."*
> **Why it matters:** *"Straight apostrophes look like unpolished developer output next to curly ones on
> the same scroll — **visible in App Store screenshots**."*
> **Suggested fix:** *"Normalise to typographic apostrophes app-wide and add a lint rule."*

**Measured now:**

- `npm run lint:apostrophes` at `dd80f70` → `✅ apostrophes: no new straight-apostrophe copy (**72**
  baselined)`, **0 stale**. So the number is **72, not 73** — `022bcee` (the `L1-25` notification fix)
  removed *"I'd give your plan a quick look before payday."* and re-recorded. The ledger and the plan row
  both still say 73. *(The gate itself has always been right; only the prose is stale.)*
- ⭐ **The measurement nobody has taken: the app is currently 72 straight to 28 curly.** I ran the same AST
  rule for `’` and got **28 curly copy strings across 14 files** — 10 of them in `paywall.tsx` alone, then
  `money.tsx` ×4, `FirstDebtOrBillStep` ×2, `StorageErrorScreen` ×2, and singles elsewhere.
  ⚡ **So "normalise app-wide" is not a symmetric choice**: converging on **curly costs 72 edits**,
  converging on **straight costs 28**. The finding asked for the more expensive direction without knowing
  it was the minority one.
- **Is the harm live?** Yes, and on the app's primary surface. Three files mix both typographies *within
  one file*: `app/(tabs)/index.tsx` (3 straight / 1 curly) · `onboarding/FirstDebtOrBillStep.tsx` (1 / 2) ·
  `plan/SpokenForSheet.tsx` (4 / 1). And **Today is worse than its own file suggests** — it composes
  `PaydayGuardianCard` (3 straight), `AffordabilityCard` (4), `RecoveryPlanSection` (1) and
  `buildGuardianBrief` (18) beside its own curly string. **`paywall.tsx` is fully curly (10/10)** — the one
  screen most likely to be screenshotted is already correct and therefore sets the standard the rest misses.
- **Concentration:** `packages/core/guardian/buildGuardianBrief.ts` alone holds **18 of the 72** — a quarter
  of the whole sweep sits in one file, and it is the Guardian's voice, the copy that appears on Today.

**Premise held? YES on the substance, NO on two numbers.** The mixed typesetting is real, live, and on the
primary surface. But the count is **72 not 73**, and the finding's implicit assumption that curly is the
house style is backwards — straight is currently the 72% majority.

**Cost to build:**

- **72 string edits** across **26 files**. A find-and-replace is safe *only* because the gate reads the AST:
  re-running `tsx scripts/check-apostrophes.ts --baseline` must land the baseline at **0**, and any number
  other than 0 means a site was missed. ⭐ **That is the strongest property of this item — it is the one of
  the three whose completion is machine-checkable.**
- ⛔ **7 test assertions must move in the SAME commit** *(the ledger's warning is right; the figure is
  small and I counted it by parsing every test-corpus string literal, not by grepping)*:

  | file | lines | pinned string |
  |---|---|---|
  | `apps/rn/tests/e2e/guardian.spec.ts` | **45** | `getByText("This paycheck won't cover everything")` |
  | | **98** | `getByText("A paycheck didn't land")` |
  | | **104** | `getByText("Let's refresh your numbers")` |
  | `apps/rn/tests/e2e/recovery.spec.ts` | **28, 42, 49** | `getByText("This paycheck won't cover everything")` ×3 |
  | `packages/core/guardian/testBuildGuardianBrief.ts` | **64** | `assertEqual(freeShort.title, "This paycheck won't cover everything", …)` |

  **All seven pin `buildGuardianBrief` output** — the same file that holds 18 of the 72 strings. Plus **5
  cosmetic test *titles*** that would read stale but cannot go red (`guardian.spec.ts:42,95,101` ·
  `testBuildGuardianBrief.ts:105,177`).
- ⛔ **A second baseline moves, and missing it reds `lint:copy`:** `scripts/duplicate-copy-baseline.json`
  contains **`"An ongoing cost that doesn't end."`** — one of the 72. Change the string without
  re-recording that file and the duplicate-copy gate fails. *(This is precisely the coupling that the
  `lint:copy`-red-on-`L1-21` episode already taught once.)*
- ✅ **Zero Maestro exposure.** No flow asserts any of the 72; `07-money-add-and-rescue.yaml:88` records
  that its clauses were *"matched on apostrophe-free fragments deliberately"*. The one lane that cannot be
  re-run cheaply is the one lane that cannot break.
- ✅ **`apps/rn/core/` is a red herring.** It appears to hold a duplicate `buildGuardianBrief.ts` with all
  18 strings, but `.gitignore:56-57` records it as *"an auto-created link to `../../packages/core` (see
  `apps/rn/metro.config.js`) — never commit it."* One tree, not two.
- ⚠️ **Out of scope, and say so in the commit:** `tests/e2e/onboarding-flow.spec.ts:43,86,112` pins
  `"You're all set"` three times — a string `onboardingFinish.ts:7` documents as **already retired**. That
  is the legacy root Next tree, which dies at **P6.11**; it is not evidence about the RN app.

**Recommendation:** **BUILD it for 2.0, converging on the typographic `’`** — the harm is live on Today and
in exactly the App-Store-screenshot surface the finding named, `paywall.tsx` already sets the standard at
10/10 curly, the completion criterion is machine-checkable to zero, and the total blast radius is **7
assertions + 1 baseline**, which is small and fully enumerated above; do it as **one commit** (72 strings +
7 assertions + both baselines re-recorded) so the gate can never see a half-swept tree.

**Confidence:** **high** — the 72 is the gate's own AST count, not mine; the 7 pins come from parsing every
string literal in all 200 test-corpus files rather than grepping; and the `duplicate-copy-baseline.json`
coupling was checked by reading the file. **Medium** only on the claim that no *screenshot* asset embeds one
of the 72 — `docs/` marketing copy and the App Preview conform script were outside my three-item scope.

---

### W2-L4-13b

**Verdict:** **DECISION** *(system call — my recommendation is **"nowhere" for 2.0**)* — ⚠️ **and a
separate, non-taste defect rides along that is BUILD 2.0**: L4-13's *first* half is **half-closed**.

**The finding as filed** (`findings/L4-numbers-visual.md:128-135`):

> **L4-13 · Two press-feedback vocabularies and six pressed-opacity constants, none of them tokens**
> — severity **minor**, verified *yes-read-the-source*, confidence **high**.
> *"`PressableScale`'s docstring claims the house rule for 'tappable cards/rows' — a spring press-scale.
> Exactly one component adopts it (More's `SettingRow`). Every other tappable card/row **dims** instead, at
> six different values… Concretely: the More tab's rows spring under a finger; Money's tappable hero card
> (same target class, same size) dims to 0.8; the Living reserve card right above it dims to 0.85. This is
> not a fork of `PressableScale` — I grepped for hand-rolled `onPressIn` scale animations and found none —
> it is a shared primitive that never got adopted."*
> **Suggested fix:** *"put the pressed opacity in `theme/` as one token, and **decide whether card-sized
> targets use `PressableScale` app-wide or nowhere**."* *(The second clause is the carried half.)*

**Measured now:** I classified **every** tap target in `apps/rn/src` by AST — `Pressable`,
`AnimatedPressable`, `PressableScale`, `Touchable*` — rather than grepping for `pressed`:

| press feedback | count |
|---|---|
| **spring press-scale** (`PressableScale`) | **1** — `more/SettingRow.tsx:71`, reached only from `more.tsx` |
| **opacity dim** | **11** |
| ⚡ **none at all, with a live `onPress`** | **57** |
| **total tap targets** | **69** |

⛔ **The finding says "two press-feedback vocabularies." There are three, and the third is the majority.**
`PremiumInvite.tsx:20` · `PlanHero.tsx:136,203,227` · `PaydayGuardianCard.tsx:400,432,446,470` ·
`RequiredActionsCard.tsx:167,228` · `SpokenForSheet.tsx:95,108,145` · `SaveForItSheet.tsx:114,138` ·
`TimelineLedger.tsx:73` · `more-button.tsx:35` · `paywall.tsx:310,358,367,374,378` ·
`PaydayCaptureSheet.tsx:233,241,250,298,339,397,414` — ordinary buttons and rows, all with **no press
state whatsoever**. *(A minority of the 57 are legitimately feedback-free: scrims and backdrops —
`SheetBackdrop:32`, `AnimatedSheet:78`, `SheetBackdrop`-alikes in `FormSheet`, `CoachMarkLayer:157`,
`TutorialOverlay:459` — and primitives whose feedback is a state change rather than a press effect:
`SegmentedToggle` (sliding thumb + haptic, §3.3.5), `RadioGroup`, `Select`, `CheckCircle`.)*

⚡ **That inverts the question.** *"App-wide or nowhere"* was written as a choice between two treatments.
The app's actual dominant treatment is **no treatment**, so **"app-wide" is not a convergence — it is a new
design applied to ~45 targets across every screen**, and "nowhere" is a one-line retreat to the status quo.

**Premise held? Partly — the observation is exact, the framing is not.**
- ✅ **`PressableScale` is reached by exactly one surface.** Confirmed: the only importer is
  `more/SettingRow.tsx:6`, and `SettingRow`'s only consumer is `app/more.tsx`. The surface inventory is right.
- ✅ **The concrete example is still live and still wrong.** On Money, `LivingReserve` (`money.tsx:885`,
  style at `:893`) dims to **0.85** and the tappable hero (`money.tsx:1008`, style at `:1012`) dims to
  **0.8** — two card-sized targets, one screen, visibly different dims, **today, at `dd80f70`**.
- ❌ **"Every other tappable card/row dims instead" is false** — most do nothing.
- ❌ ⛔ **L4-13's FIRST half is HALF-CLOSED, and its own docstring overstates the fix.**
  `theme/spacing.ts:49` `pressedOpacity = 0.8` exists and is consumed by **4** primitives (`ui/AddRow.tsx:33`
  · `ui/CheckCircle.tsx:70` · `ui/ListRow.tsx:87` · `ui/Pill.tsx:45`). **Seven inline literals at five values
  are still live**, none of them touched:

  | site | value |
  |---|---|
  | `app/(tabs)/money.tsx:858` (group header) | **0.6** |
  | `app/(tabs)/money.tsx:893` (Living reserve card) | **0.85** |
  | `app/(tabs)/money.tsx:1012` (tappable hero card) | **0.8** |
  | `entities/AddObligationSheet.tsx:95` | **0.7** |
  | `entities/DebtSheet.tsx:277` · `:289` | **0.7** ×2 |
  | `ui/Button.tsx:68` | **0.85** pressed · 0.9 hover · 0.5 disabled |

  The token's docstring (`theme/spacing.ts:37-48`) says, in the past tense, *"every one an inline literal
  with no token, so two cards of the same size on the same screen dimmed by visibly different amounts."*
  **Those two cards still do.** ⚡ This is the exact class the ledger names — *a fix that lands on the
  primitives leaves the screen-level and sheet-level halves standing, and the file that documents the fix
  is the last place that would tell you.*

**Cost to build:**
- **The token half (recommended, small):** 7 sites → `pressedOpacity`. ⚠️ It is **not** a blind
  find-and-replace: `money.tsx:858`'s 0.6 is a *group header*, not a card, and `Button.tsx:68`'s three-way
  ladder (disabled/pressed/hovered) needs a decision about whether hover and disabled get tokens too — so
  it is 7 judgements, not 7 edits. Blast radius otherwise **zero**.
- **The `PressableScale` half:**
  - *"nowhere"* = **1 edit** — `SettingRow` swaps `PressableScale` for the `pressedOpacity` dim `ListRow`
    already uses, and More's rows stop being the odd one out. `PressableScale.tsx` then has no consumer
    (a **new** single-use/dead-primitive entry, which is `L4-16`'s question reopened one turn later).
  - *"app-wide"* = adopt on every card-sized target. Genuinely: **3 sites** if "card-sized" means only what
    the finding named (`SettingRow` + Money's two cards); **~45** if it means "everything a finger presses
    that has no feedback today." The finding never resolves which, and that ambiguity is most of the risk.
- ⛔ **ZERO test coverage either way — I checked, and this is the load-bearing risk.** No test anywhere in
  the 200-file corpus asserts `opacity`, `scale`, `PressableScale` or `scaleTo`. **Nothing goes red if this
  is done wrong**, and nothing goes red today while it is wrong. The README already routes motion *quality*
  to **P6.14** as device-owed with *"stills cannot judge it"* — so a press-feel change made now is
  unverifiable until then, in either direction.

**Recommendation:** **DECISION for 🎯 — I recommend answering "nowhere" for 2.0 and BUILDING the token
half now.** A press-scale is a system property this app does **not** have: 1 surface out of 69 targets, on
the least-used tab, with no test able to see it and no instrument able to judge it before P6.14; making it
app-wide is a whole-app design change inside a freeze. The honest close is to normalise More's rows to the
same dim every other row uses, take the 7 remaining literals into `pressedOpacity` in the same commit
(which is a real, currently-visible defect on Money, not taste), and re-file *"should the app have a
press-scale affordance at all"* as a **2.1 design item** where it can be decided on a device with the
motion spec in hand — ⚠️ **and correct `theme/spacing.ts`'s docstring in that commit**, because right now
it reads as though the drift it describes is gone.

**Confidence:** **high** on every count (AST over the whole `apps/rn/src` tree, plus the importer and
consumer chains read by hand) and on the zero-test-coverage claim. **Medium** on the "~45 targets" figure
for the *app-wide* option — that number depends on where "card-sized" is drawn, and drawing it is exactly
the decision being asked for, not something I can measure.

---

## Summary — the three verdicts

| id | verdict | one line |
|---|---|---|
| **L1-20** | **DECISION** *(defer the sweep)* | No user-visible change, a11y mechanism **refuted** on iOS, 23 edits + **32** test pins. Take the `theme/` eyebrow token instead — 0 strings, 0 tests |
| **L1-22** | **BUILD 2.0** | Live on Today, `paywall.tsx` already sets the standard at 10/10 curly, completion is machine-checkable to zero, blast radius **7 assertions + 1 baseline** |
| **L4-13b** | **DECISION** *(answer "nowhere")* + **BUILD 2.0** on the half-closed token | 1 of 69 tap targets springs; **57 have no press feedback at all**, so "app-wide" is a new design, not a convergence. Meanwhile 7 inline opacities are still live and two cards on Money still disagree |

⭐ **The cross-item pattern:** all three are *system-coherence* findings, and in all three the filed
mechanism was weaker than the filed observation — L1-20's a11y rationale is false on iOS, L1-22 asked for
the more expensive of two directions without knowing which was the majority, L4-13 counted two press
vocabularies where there are three. ⚡ **Every observation held; not one explanation did.** That is Law IV
holding for a **third** consecutive audit, and it is now a strong enough regularity to be a rule: *when a
finding is carried forward, re-derive its "why", never its "what".*

⚠️ **And a fourth enumeration lesson, this time about my own predecessors' lists rather than an agent's:**
five of the six numbers the ledger and plan row quote for these three items are wrong — 16→**23**
literals, "2 of 8"→**6 of 15** styles, 26→**32** pins, 73→**72** strings, "four primitives"→**4 done, 7
left**. Each was measured once, correctly, at a moment; none was re-measured when it was carried. **A
carried figure decays exactly like a carried premise, and nothing in the process re-checks it.**

---

## What I could not judge

1. ⛔ **Whether the L1-22 sweep changes any shipped marketing or store asset.** I confirmed the 72 strings
   and their code pins, but App Store screenshots, the App Preview conform script
   (`scripts/conform-app-preview.sh`), the marketing embed's own copy and the ASC listing text were outside
   my three-item scope. **M1 owns the public-claims surface** — if any of the 72 is baked into a shipped
   screenshot, the sweep has an asset-regeneration cost I have not priced.
2. **Whether `PressableScale`'s spring is actually better than the dim.** This is the heart of L4-13b and
   it is unanswerable here by construction: press feel is motion, the README routes motion quality to
   **P6.14** as device-owed, and *"stills cannot judge it."* I measured the asymmetry; I cannot tell you
   which side of it is right. **A single side-by-side on a device settles it in ten seconds and nothing
   else will.**
3. **Whether Playwright's text engine would match through CSS `text-transform` on web.** My L1-20 pin count
   assumes it matches DOM text, not painted glyphs — which is why sentence-casing would break the 32 pins.
   The assumption is strongly supported *(`tutorial-invite.spec.ts:807` reads `textContent` directly, and
   `cushion-forecast.spec.ts:27` uses `{ exact: true }` against a caps literal)*, but **I did not run the
   suite to prove it**, and it is the single fact the L1-20 cost estimate rests on. **A one-line probe on
   any existing `textTransform` surface settles it before the sweep is scoped.**
4. **Whether the 34 uppercase-display styles are the complete class.** No gate covers it; I enumerated by
   `textTransform` plus the `eyebrow`-name family, so a style that is uppercase purely by the strings it is
   fed, under a name I did not think of, would be invisible to me. ⚠️ This is the same shape as the
   `lint:money` hole *(green over five hand-rolled sites)* — **the durable answer is a gate, not a longer
   list**, and if 🎯 takes the eyebrow token, that gate becomes trivial to write.
5. **The visual matrix.** W2 is a source-reading lens and I judged from the tree, not from `matrix/`. If a
   rendered frame shows an eyebrow or a press state behaving differently from what the source says, **V1–V4
   see it and I do not.**

