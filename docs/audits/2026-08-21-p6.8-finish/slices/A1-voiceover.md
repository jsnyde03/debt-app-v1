# A1 — VoiceOver depth

> Lens A1 of the P6.8 pre-release sweep. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Written incrementally; findings are appended as they are established.

## Instrument, and what it can and cannot say

**Primary:** `apps/rn/capture-ref/p6.8-a11y/<surface>.txt` — nine web accessibility trees emitted as
ordered YAML by Playwright's `locator.ariaSnapshot()`. **Roles, accessible names, states and traversal
ORDER are real.** Spoken rendering, rotor navigation, focus under a live screen reader, and haptics are
**not in this instrument** and are routed to P6.14 rows at the end of this file.

**Cross-check:** the rendered frames at `apps/rn/capture-ref/p6.8/phone/light/<surface>.png`, used to tell
*"little is exposed"* apart from *"this seed rendered little"*.

**Source:** `apps/rn/src/**`, plus the three existing gates I calibrated against so findings are additive —
`scripts/check-native-a11y-props.ts`, `scripts/check-a11y-collapse.ts`, `apps/rn/tests/e2e/a11y-axe.spec.ts`.

### ⚠️ One artifact of the instrument that must be understood before reading any finding below

Playwright's `ariaSnapshot()` **merges contiguous un-grouped text into a single `- text:` node.** A long
run-on `- text:` line in these dumps therefore means the opposite of what it looks like: it means that
region has **no** `accessible`/`accessibilityLabel` grouping at all, so the snapshotter concatenated it.
It does **not** mean the app built one giant label. Deliberate groups from `groupLabel()` appear instead
as the **quoted accessible name** of a `button`/`heading` (e.g. `button "Card, $5,000 · 20% APR, verified,
$100/mo"`). Both patterns appear in these dumps and they are different defects, so each finding below
states which one it is.

---

## The ledger — 20 findings

| id | sev | surface | one line | device-owed |
|---|---|---|---|---|
| **A1-6** | ⛔ **blocker** *(instrument)* / major *(web)* | all | 22 of 24 grouped utterances carry no role, so the composed label is dropped on web — **these dumps under-report the whole app** | **yes, gating** |
| A1-2 | major | progress | the cushion bars announce the engine's internal words — `stable` / `pressure` — not `Clear` / `Tight` / `Very tight` | yes |
| A1-3 | major | progress | the seed puts every bar in one band, so the band is untestable on this surface — the fixture trap `glossary.test.ts` already recorded once | yes |
| A1-7 | major | money · bills | swipe-delete is permanently in the tree and announced **before** the row — the guard `RequiredActionsCard` documents was never applied to `ListRow` | yes |
| A1-8 | major | money | `groupLabel` drops `badges`, so **Focus** — which debt the plan is attacking — is announced to nobody, on **both** platforms | no |
| A1-9 | major | today | *Can I afford it?* renders its verdict with no live region and no announcement | yes |
| A1-10 | major | app-wide | the app's only live region is `@platform android`; **nothing in the shipping iOS app ever announces** | yes |
| A1-11 | major | paywall | `aria-selected` on `role="button"` — the trap `a11ySelected`'s own docstring predicts; the chosen plan has no state | yes |
| A1-18 | major *(matrix)* | onboarding | the `onboarding` tree **and frame** are Today — the surface has no evidence, and O1/M2 read this matrix too | no |
| A1-4 | minor | progress | on web the five bars degrade to five bare amounts, no date, no band | partly |
| A1-12 | minor | all | every heading is level 1; Today's two real sections are not headings at all | partly |
| A1-13 | minor | tabs | each tab's accessible name contains the icon's private-use glyph **twice**; 0 of 73 `AppIcon` sites are `decorative` | yes |
| A1-14 | minor | money ×2 · progress | three unnamed `radiogroup`s | no |
| A1-15 | minor | progress | the coach-mark alert is the **last** node, after the tab bar, and nothing announces it | yes |
| A1-16 | minor | sheets | every edit sheet's destructive control is a bare **"Delete"** with no object | no |
| A1-19 | minor *(scope)* | sheets | **zero** of the nine trees is a sheet — nothing in P6.8 has inspected sheet structure | partly |
| A1-1 · A1-5 · A1-20 | minor | money · history · living · cushion-forecast | **not defects** — recorded so they are not re-found: Money has no band to announce; the two small trees are seed artifacts; `cushion-forecast` is the positive control | no |
| A1-17 | polish | app-wide | `accessibilityHint` at 5 of ~183 pressable sites, 4 of them in one component | no |

⚠️ **Read A1-6 before any other finding in any lens that touches these trees.**

---

_(findings follow)_

---

## ⭐ The instrument's headline, resolved

The matrix flagged `progress`: 14 nodes / **0 band words**, `money`: 19 nodes / **0**, against
`cushion-forecast`: 7. **It splits three ways, and only one of the three is a real defect.**

### A1-1
**Severity:** minor *(not a defect — recorded so it is not re-found)*
**Surface:** money · **Evidence file:** `apps/rn/capture-ref/p6.8-a11y/money.txt` (whole file, 19 nodes) + `apps/rn/capture-ref/p6.8/phone/light/money-debts.png`
**Finding:** Money's zero band words are **correct** — Money renders no Guardian band at all, so there is nothing to announce.
**Evidence:** the rendered frame shows Debts/Expenses/Goals, a `$5,000 remaining` total, the Snowball/Avalanche toggle and one debt row. No band chip, no band colour, nowhere. The tree matches the frame node-for-node.
**Device-owed?** no
**Confidence:** high

### A1-2
**Severity:** **major**
**Surface:** progress *(the cushion bars)* · **Evidence file:** `apps/rn/src/components/progress/CashFlowSection.tsx:127–131`, cross-read with `apps/rn/src/store/planSelectors.ts:327` and `packages/core/copy/vocabulary.ts` (`GUARDIAN_STATE_LABEL`)
**Finding:** the Progress cushion bars **do** carry a per-bar label, and it announces the app's **internal engine token** — `stable` / `tight` / `pressure` — a vocabulary that appears nowhere on screen and is not the Guardian's.
**Evidence:**
```tsx
// CashFlowSection.tsx — CushionBar
<View style={styles.col} accessible
  accessibilityLabel={`${shortDate(cycle.cycleStart)}: ${formatWhole(cycle.net)} of room, ${cycle.cushionStatus}`}>
```
`cushionStatus` is typed `'stable' | 'tight' | 'pressure'` (`planSelectors.ts:327`). The app's spoken
vocabulary is `GUARDIAN_STATE_LABEL` = **Clear / Tight / Very tight**, and `store/glossary.test.ts`
exists specifically to keep a fourth name out of it — it asserts `'crunch'`, `'short'` and `'at-risk'`
are gone from the labels. **That gate reads the constant, not the accessibility labels**, so two words
a sighted user never sees — `stable` and `pressure` — reach a screen-reader user as the state name.
A VoiceOver user on the worst cycle of their forecast hears *"Sep 4: $120 of room, **pressure**."*
⚠️ This is also why `progress.txt` shows zero band words while the label exists: RNW 0.21.2's
`createDOMProps` never reads `accessible`, so the bar renders as a `div` with `aria-label` and **no
role** — a `generic`, which ARIA forbids from carrying a name, so Playwright drops it. **The label is
lost on web and works on iOS**, which is why the vocabulary — not the absence — is the finding.
**Device-owed?** **yes** — P6.14 must confirm VoiceOver actually reaches each bar as its own element on iOS and read back what it says.
**Confidence:** high *(the string is literal in source; only the on-device rendering is inferred)*

### A1-3
**Severity:** **major**
**Surface:** progress · **Evidence file:** `apps/rn/capture-ref/p6.8/phone/light/progress.png` + `apps/rn/src/components/progress/CashFlowSection.tsx:88–92`
**Finding:** the default matrix seed puts **every** cushion bar in the same band, so neither this instrument nor the frames can test the band at all on Progress — the identical fixture-convenience trap `glossary.test.ts` already documented once.
**Evidence:** all five bars in `progress.png` render the neutral slate `barTone` (no glow, no colour), and the caption reads *"Comfortable across the next few paychecks."* — the `else` branch. The `tight` and `pressure` branches at `CashFlowSection.tsx:88–92` never ran. `glossary.test.ts` records the same failure verbatim: *"that spec's fixture has no under-the-line cycle … so no `at-risk` band ever renders and the assertion could not fail."*
**Evidence (the caption is the one thing that IS announced):**
```
- text: $1,550 $2,000 $1,550 $2,000 $2,000 your $200 line · room after each paycheck Comfortable across the next few paychecks.
```
**Device-owed?** **yes** — P6.14 needs a seed with a `pressure` cycle before the band can be judged on this surface at all.
**Confidence:** high

### A1-4
**Severity:** minor
**Surface:** progress *(cushion bars, non-band half)* · **Evidence file:** `apps/rn/capture-ref/p6.8-a11y/progress.txt:11`
**Finding:** on **web**, the five cushion bars degrade to five bare currency amounts with no date, no label and no band — the aggregate caption is the only surviving signal.
**Evidence:**
```
- text: $1,550 $2,000 $1,550 $2,000 $2,000 your $200 line · room after each paycheck Comfortable...
```
The dates row is explicitly `{...decorative}` (`CashFlowSection.tsx:100`) — correct, *because* the bar's own label was supposed to carry the date. When that label is dropped (A1-2), the date goes with it and nothing replaces it.
**Device-owed?** partially — the web loss is real and confirmed here; whether iOS is unaffected is the P6.14 row in A1-2.
**Confidence:** high *(for web)* · medium *(that iOS is clean)*

### A1-5
**Severity:** minor *(not a defect — the second question the matrix asked, answered)*
**Surface:** history · living-expenses · **Evidence file:** `p6.8-a11y/history.txt` (3 nodes) · `living-expenses.txt` (4 nodes) vs `p6.8/phone/light/history.png` · `living-expenses.png`
**Finding:** both small trees are **seed artifacts, not exposure failures** — both screens are genuinely empty under the default seed, and every visible element reaches the tree.
**Evidence:** `history.png` renders exactly a back chevron, an h1, a subtitle and one empty-state card; the tree has all four (subtitle and card body merged into one `text` node). `living-expenses.png` adds an "Add your first item" button — and the tree has it, named. The decorative empty-state icons (clock, shopping cart) correctly do **not** appear in either tree.
⚠️ **But nothing has ever inspected these two surfaces populated.** The history row, the spending-item row and its edit affordance have **no accessibility evidence of any kind** at `dd80f70`.
**Device-owed?** **yes** — a populated pass on both.
**Confidence:** high

---

## ⛔ The systemic finding — and every lens reading this matrix needs it

### A1-6
**Severity:** **blocker** *(for the instrument; **major** as a product defect on web)*
**Surface:** all nine · **Evidence file:** all nine trees, cross-read with 22 source sites
**Finding:** **every grouped screen-reader utterance in this app is invisible on web unless its wrapper also carries a role** — `react-native-web` 0.21.2 has no handling for `accessible` at all, so a grouping `<View accessible accessibilityLabel={…}>` renders a `div` with `aria-label` and **no role**, which ARIA forbids from carrying a name. The composed label vanishes and the raw fragments it was written to replace stay in the tree instead.

**Evidence — the instrument proves the mechanism itself, three ways:**

| pattern | site | in the tree? |
|---|---|---|
| label on a **Pressable** (role=button) | `ListRow.tsx:72` `groupLabel(...)` | OK — `button "Card, $5,000 · 20% APR, verified, $100/mo"` |
| label on a View **with** `accessibilityRole` | `CoachMarkLayer.tsx:153` (`alert`) · `Slider.tsx:88` (`adjustable`) | OK — `alert "Drag the curve. Scrub any month…"` |
| label on a View with **no** role | `PlanHero.tsx:148` · `progress.tsx:148` · `CashFlowSection.tsx:134` · `TrajectoryChart.tsx:294` · 18 more | ⛔ **absent** |

The cleanest single proof is Progress's ring. Its centre — the `0%` + `paid` — is correctly fenced
`{...decorative}` (`progress.tsx:167`) *because* `ringA11y` was supposed to speak for it:

```tsx
const ringA11y = groupLabel(`${pct}% paid`, …, `debt-free projected ${view.debtFreeDate}`);
…
<View style={styles.ringWrap} {...ringA11y}>
```

The fence worked — no `0%` anywhere in `progress.txt`. The replacement did not. **On the web build,
Progress's headline number is announced by nothing at all.**

```
- text: "DEBT-FREE October 2026 $5,000 to go Next milestone: 25% CASH FLOW · NEXT 5 PAY CYCLES"
```

**The 22 sites** (`accessible` + a label, no role): `PlanHero.tsx:148,214` · `progress.tsx:148` ·
`CashFlowSection.tsx:134` · `TrajectoryChart.tsx:294` · `PaydayGuardianCard.tsx:185` ·
`GuardianProofStrip.tsx:29` · `TimelineLedger.tsx:111` · `SpokenForSheet.tsx:153` ·
`WindfallSheet.tsx:105` · `PaidOffBeat.tsx:115` · `PaidOffFinale.tsx:108,154` · `ShareCard.tsx:83` ·
`PaidOffArchive.tsx:61` · `LeanSuggestionCard.tsx:31` · `MilestoneAckCard.tsx:40` ·
`TutorialInviteCard.tsx:26` · `DemoCaption.tsx:58` · `DemoDock.tsx:66`. Only **2** of the 24 grouping
sites in the app carry a role.

**⚠️ Two consequences, and the first is the one that matters most to P6.8:**

1. **The `p6.8-a11y` trees systematically under-report this app.** Every run-on `- text:` node in them
   is a group that *does* exist and *does* work on iOS. ⛔ **No lens may read a run-on in these dumps as
   "this row is one unreadable string"** — it is the opposite: the grouping is real and the *snapshot*
   lost it. This is the same class as the `accessibilityState` asymmetry `a11y.ts` documents at length,
   arriving from a direction no existing gate covers, because `accessible` and `accessibilityLabel` are
   both perfectly legal props.
2. **The two platforms present different content, so neither verifies the other.** On iOS the children
   collapse and only the composed label speaks. On web the label is dropped and the children stay. The
   public marketing embed ships the web build, so "web only" is not "nobody".

**Device-owed?** **yes, and it is the single most valuable P6.14 row in this lens** — confirm on iOS VoiceOver that each of these 22 groups really is one element speaking its composed label. If it is, the web loss is a fixable one-line-per-site defect. If it is not, ~22 of the app's most information-dense readings are broken on the primary platform and nothing has ever seen it.
**Confidence:** **high** that the labels are absent from the tree these dumps and Chromium's name computation produce; **medium** that no web screen reader recovers them by another path.

### A1-7
**Severity:** **major**
**Surface:** money · bills *(and everything else `ListRow` renders)* · **Evidence file:** `p6.8-a11y/money.txt:19–20` + `apps/rn/src/components/ui/ListRow.tsx:135–148` vs `apps/rn/src/components/plan/RequiredActionsCard.tsx:329–345`
**Finding:** `ListRow`'s swipe-to-delete action is **permanently in the accessibility tree and the tab order, announced BEFORE the row it destroys** — the exact defect `RequiredActionsCard` fixed for its own swipe pane and documented at length, never applied to the other swipe surface.
**Evidence:**

```
- button "Delete Card": Delete
- button "Card, $5,000 · 20% APR, verified, $100/mo": Card Focus $5,000 · 20% APR verified $100/mo
```

`RequiredActionsCard`'s equivalent pane is wrapped in `SwipeMarkAction`, which carries `useInert(ref, !open)`
plus `{...a11yHidden(!open)}`, and whose comment states the rule: *"left unguarded it puts a SECOND control
for the same action in the accessibility tree of every row at all times: VoiceOver announces each bill
twice and offers a control nobody can see."* `ListRow.renderRightActions` (`:139–147`) has **neither**
guard. Every debt, bill, goal and spending item therefore leads with a destructive control.
⚠️ `a11y-axe` cannot see it — the element is not `aria-hidden`, so `aria-hidden-focus` has nothing to
fire on, and that spec's two `/money` scans pass with the Delete button present.
⚠️ Mitigations, stated so the severity is honest: the action **is** named (`Delete Card`, not a bare
"Delete"), and `confirmDelete` gates the write. This is a bad reading order and a stray tab stop, not
silent data loss.
**Device-owed?** **yes** — whether iOS VoiceOver reaches an off-screen swipe pane clipped by `overflow: hidden` is genuinely uncertain and must be checked, not reasoned about. On web it is confirmed present.
**Confidence:** high *(web)* · medium *(iOS)*

### A1-8
**Severity:** **major**
**Surface:** money *(debts + bills)* · **Evidence file:** `p6.8-a11y/money.txt:20` + `apps/rn/src/components/ui/ListRow.tsx:72` + `apps/rn/src/app/(tabs)/money.tsx:485–486, 763`
**Finding:** `groupLabel` in `ListRow` composes `title + meta + amount` and **never the badges** — so **Focus**, the marker for which debt the whole plan is attacking, is announced to nobody.
**Evidence:** accessible name vs visible content, from the same tree line:

```
name:    "Card, $5,000 · 20% APR, verified, $100/mo"
content:  Card Focus $5,000 · 20% APR verified $100/mo
```

`const a11y = groupLabel(title, [meta, caption]…, amount…)` — `badges` is a `ReactNode` and is not a
parameter. Because the wrapper is `accessible`, the badge text is **collapsed away on iOS too**, so
unlike A1-6 this one is broken on **both** platforms. The dropped set is `Focus` and `Autopay`
(`money.tsx:485–486`) plus `Autopay` on bills (`money.tsx:763`).
⚠️ **Refuted for the other two callers, and that is why the finding is narrow:** Goals' `Funded` badge is
redundant with `amountSuffix={' saved'}` (`money.tsx:961`), and Living-expenses' `Off` badge is redundant
with `meta={item.enabled ? 'Counts toward reserve' : 'Not counted'}` (`living-expenses.tsx:69`). Both
already say it in words. **Only the debt and bill rows lose state.**
**Device-owed?** no — decidable from source, and it holds on both platforms.
**Confidence:** high

### A1-9
**Severity:** **major**
**Surface:** today *(Can I Afford It?)* · **Evidence file:** `apps/rn/src/components/plan/AffordabilityCard.tsx` — the whole file; `grep accessib` returns **nothing**
**Finding:** the app's flagship premium interaction produces its verdict with **no live region and no announcement**, so a screen-reader user types an amount and hears silence.
**Evidence:** the card renders `Not this paycheck — you'd come up about $X short.` / `Yes, but tight — you'd dip to about $X, below your $200 line.` into the tree beneath the input as the amount changes. The file contains no `accessibilityLiveRegion`, no `aria-live`, no `announce()`, no `accessibilityRole`. The captured tree holds only the pre-verdict state:

```
- text: Enter an amount to see if it fits this paycheck.
```

**Device-owed?** **yes** — P6.14 must confirm VoiceOver says nothing when the verdict appears. It also cannot be a web-only fix; see A1-10.
**Confidence:** high

### A1-10
**Severity:** **major**
**Surface:** app-wide · **Evidence file:** `apps/rn/src/components/SaveFailedBanner.tsx:30–31` + `apps/rn/node_modules/react-native/Libraries/Components/View/ViewAccessibility.d.ts:220, 238–245`
**Finding:** the app has **exactly one** live region and it is **Android-only** — on iOS, the primary platform, nothing in the shipping app ever announces itself.
**Evidence:** the only `accessibilityLiveRegion` in `apps/rn/src`:

```tsx
<View accessibilityRole="alert" accessibilityLiveRegion="polite" testID="save-failed-banner">
```

`accessibilityLiveRegion` and `aria-live` are declared inside `interface AccessibilityPropsAndroid`
(`ViewAccessibility.d.ts:220`), documented `@platform android` · *"Works for Android API >= 19 only."*
`accessibilityRole="alert"` does not auto-announce under iOS VoiceOver either. **So "your last change
didn't save" appears silently on iOS.**
⚠️ **Refuting my own first hypothesis, because it was wrong:** I expected react-native-web to drop this
prop the way it drops `accessibilityState`. It does not — `createDOMProps/index.js:460–463` maps it to
`aria-live`. **Web is the platform where this banner works.**
The six `announce()` callsites are all in the **tutorial / demo / sandbox** paths (`index.tsx:867,972`,
`TutorialOverlay.tsx:57`, `demo.tsx:76`) or are screen-title announcements (`cushion-forecast.tsx:33`,
`schedule/[id].tsx:26`). **Zero fire in the ordinary app.** Marking a bill paid, applying an extra
payment, crossing a milestone, a Guardian band flipping, a backup succeeding or failing — all silent.
**Device-owed?** **yes** — the whole class. See the P6.14 rows.
**Confidence:** high

### A1-11
**Severity:** **major**
**Surface:** paywall · **Evidence file:** `p6.8-a11y/paywall.txt:12–14` + `apps/rn/src/app/paywall.tsx:313–315`
**Finding:** which plan is selected is conveyed by a border colour and a check glyph with **no state in the accessibility tree** — the code walked into the exact trap `a11ySelected`'s own docstring predicts.
**Evidence:**

```
- button "Annual, Best value, $29.99 per year. Billed yearly · $2.50/mo": …
- button "Lifetime, Pay once, $79.99 one time. …": …
- button "Monthly, $4.99 per month. Billed monthly": …
```

No `[selected]` on any of the three, while the radios two files away render `[checked]` correctly. Source:

```tsx
<Pressable accessibilityRole="button" {...a11ySelected(isSel)} accessibilityLabel={…}>
```

and `a11y.ts` on `a11ySelected`: *"`aria-selected` is only valid on a handful of roles (`tab`, `option`,
`row`, `gridcell`, `treeitem`). On a plain `role="button"` it is ignored by assistive tech … This helper
does not choose for the caller."* `SegmentedToggle` solved the identical problem by changing the **role**
to `radiogroup`/`radio` and documents the reasoning in a 20-line comment; the paywall never got it.
⚠️ **Mitigations:** the CTA below restates the choice (`Start Premium — $29.99 per year`), and on **iOS**
RN aliases `aria-selected` onto native `accessibilityState.selected`, which VoiceOver *does* announce on
a button — so this is very likely **web-only**. It stays major because the web build is the public
marketing embed and this is the purchase decision.
**Device-owed?** **yes** — confirm iOS announces "selected" on the chosen plan row.
**Confidence:** high *(web)* · medium *(that iOS is clean)*

---

## Structure, order and naming

### A1-12
**Severity:** minor
**Surface:** all nine · **Evidence file:** every tree; `apps/rn/src/components/screen.tsx:82, 122` + `apps/rn/src/utils/a11y.ts:10`
**Finding:** **every heading in the app is level 1** — the screen title and every section title render the same rank, so rotor-by-heading gives a flat list with no structure; and on Today and Money there are almost no section headings at all.
**Evidence:** `more.txt` has four sibling `[level=1]` headings — `More`, `Data`, `Preferences`, `About`. `today.txt` has two — `Good morning` and `Overdue, 2 items, $450`. The cause is one line: `headerProps()` returns `{ accessibilityRole: 'header' }` with no level, and `Screen`'s title (`screen.tsx:82`) and `Section`'s title (`screen.tsx:122`) both hard-code `accessibilityRole="header"` with none either. RNW's `propsToAccessibilityComponent` (`:44–50`) falls back to `'h1'` whenever no level is supplied.
⚠️ On **Today**, `Required actions` and `Recommended` — the screen's two real sections — are not headings at all; they are plain text inside a merged run:
```
- text: Enter an amount to see if it fits this paycheck. Required actions Bills and minimums due this paycheck. 2
```
So rotor-by-heading on the app's home screen offers exactly two stops, one of which is the greeting.
⚠️ **Half-refuted for iOS, deliberately:** RN does not surface a heading *level* to iOS at all, so a flat rotor list is the platform's behaviour there, not this app's defect. The `<h1>` pile-up is a **web** structural defect, and the web build is the public embed. The *missing* section headings on Today are a defect on both.
**Device-owed?** partially — the Today/Money heading gap is worth hearing under the rotor on device.
**Confidence:** high

### A1-13
**Severity:** minor
**Surface:** today · progress · money · onboarding · **Evidence file:** measured across all nine trees
**Finding:** each tab's accessible name contains the icon font's **private-use glyph, twice** — the only place in the app where an icon leaks into a computed name.
**Evidence:** `cat -A` on `today.txt:36–38`:
```
- tab "M-nM-^ZM-1 M-nM-^ZM-1 Today" [selected]   →  U+E6B1 " " U+E6B1 " Today"
- tab "M-nM-#M-% M-nM-#M-% Progress"             →  U+E8E5 " " U+E8E5 " Progress"
- tab "M-nM-!M-^P M-nM-!M-^P Money"              →  U+E850 " " U+E850 " Money"
```
Measured counts of PUA characters appearing **inside an accessible name**, per surface: `money` 3 · `today` 3 · `progress` 3 · `onboarding` 3 · **all others 0**. The other 31 PUA characters on `more.txt` sit in *visible content* only, harmlessly, because every row there carries an explicit `accessibilityLabel`.
The root cause is broader than the symptom: `AppIcon` (`components/ui/AppIcon.tsx`) renders `MaterialIcons` with **no `aria-hidden`**, and **0 of the 73 `<AppIcon` sites** pass `decorative`. It stays invisible almost everywhere only because an explicit label happens to override the computed name. The tab bar is react-navigation's, so nothing in `src` labels it.
⚠️ **iOS is a different build and probably clean** — `TabBarIcon` branches to `SymbolView` (SF Symbols) on iOS, not to a glyph font, so the duplicate-PUA symptom is web-specific.
**Device-owed?** **yes** — confirm iOS announces "Today, tab, 1 of 3" with no stray character.
**Confidence:** high *(web)*

### A1-14
**Severity:** minor
**Surface:** money *(×2)* · progress · **Evidence file:** `p6.8-a11y/money.txt:4, 9` · `progress.txt:5` + `apps/rn/src/components/ui/SegmentedToggle.tsx:59–61`
**Finding:** every `SegmentedToggle` sets `accessibilityRole="radiogroup"` and **no name**, so a screen-reader user entering the group is told "radio group" and nothing about what it switches — and Money stacks two unnamed ones a few lines apart.
**Evidence:**
```
- radiogroup:
  - radio "Debts" [checked]
  - radio "Expenses"
  - radio "Goals"
…
- radiogroup:
  - radio "Snowball" [checked]
  - radio "Avalanche"
```
⚠️ **Mitigated, which is why this is minor not major:** all three current groups have self-describing options, and `a11y-axe.spec.ts` already pins the `[checked]` state that was the real defect here. This is the remaining half — the group's *purpose*.
**Device-owed?** no
**Confidence:** high

### A1-15
**Severity:** minor
**Surface:** progress *(the coach-mark)* · **Evidence file:** `p6.8-a11y/progress.txt:12–13` + `apps/rn/src/components/plan/CoachMarkLayer.tsx:153, 163`
**Finding:** the coach-mark is the **last two nodes on the screen, after the tab bar**, and nothing announces it — so a hint about the payoff chart arrives at the very end of a linear swipe, past everything it was explaining.
**Evidence:**
```
- button "What if you paid extra?": What if you paid extra?
- tablist:
  - tab "  Today"
  - tab "  Progress" [selected]
  - tab "  Money"
- alert "Drag the curve. Scrub any month to see what you owe and when you land.": …
- button "Got it"
```
`accessibilityRole="alert"` does not auto-announce under iOS VoiceOver, and `CoachMarkLayer` carries no `announce()`. The layer deliberately does **not** fence the screen (*"a hint is not a modal"*, asserted in `a11y-axe.spec.ts`) — correct, and it is what leaves the mark stranded at the end of the order.
⚠️ Already covered elsewhere, so I am not re-finding it: `DEBT_3.5_DEVICE_QA_CHECKLIST.md` §13.6 checks each hint is heard **once**. It does not check *when*, or whether it is heard at all on appearance.
**Device-owed?** **yes**
**Confidence:** high *(order)* · medium *(that iOS never announces the alert)*

### A1-16
**Severity:** minor
**Surface:** every edit sheet · **Evidence file:** `apps/rn/src/components/ui/FormSheet.tsx:107, 173`
**Finding:** the destructive control on every edit sheet announces as a bare **"Delete"** with no object, while the equivalent row action names its target.
**Evidence:**
```tsx
<Pressable onPress={onRemove} accessibilityRole="button" style={styles.remove}>
  <Text style={[textStyles.bodyMedium, { color: c.accent.danger }]}>Delete</Text>
</Pressable>
```
No `accessibilityLabel`, so the name is the child text. `ListRow.tsx:143` does the opposite — `accessibilityLabel={\`Delete ${title}\`}` — for the same action on the same objects. `confirmDelete` then asks `Delete Card?`, so nothing is lost silently; it is an inconsistency and a moment of ambiguity, not a trap.
**Device-owed?** no
**Confidence:** high

### A1-17
**Severity:** polish
**Surface:** app-wide · **Evidence file:** `grep -rn accessibilityHint apps/rn/src --include=*.tsx` → **5 hits, all but one in `PaydayGuardianCard`**
**Finding:** `accessibilityHint` is used at **5 sites against ~183 pressable sites**, and 4 of the 5 are in one component — so the "what will happen if I activate this" channel is essentially unused outside the Guardian card.
**Evidence:** `PaydayGuardianCard.tsx:404, 436, 451, 475` and `ListRow.tsx:77` (`'Opens the editor'`). Nothing on the paywall's plan rows, the backup/restore/delete-all rows on More, the tab bar, or the Today action checkboxes.
⚠️ Deliberately **polish**: over-hinting is its own defect, and most of these buttons have self-describing labels. Recorded as a pattern, not a work item.
**Device-owed?** no
**Confidence:** high

---

## Holes in my own instrument, found while using it

### A1-18
**Severity:** **major** *(a matrix defect, not a product defect)*
**Surface:** onboarding · **Evidence file:** `diff p6.8-a11y/today.txt p6.8-a11y/onboarding.txt` → **2 lines differ, one of them the header**
**Finding:** **the `onboarding` capture is Today.** One of the nine trees is a duplicate, so onboarding has no accessibility evidence at all at `dd80f70` — and neither does its frame.
**Evidence:** the only content difference between the two files is the hero figure:
```
today.txt:11       - text: $1,313 Suggested · $1,350 · Extra payment to Card …
onboarding.txt:11  - text: $1,937 Suggested · $1,350 · Extra payment to Card …
```
`onboarding.txt` carries `heading "Good morning"`, `button "Edit paycheck"`, the Payday Guardian card, and a `tablist` with **Today selected**. `apps/rn/capture-ref/p6.8/phone/light/onboarding.png` shows the same thing: the Today screen. `/onboarding` redirected under this seed and nothing in the capture noticed.
⛔ **This is not only A1's problem.** O1 (onboarding & first run) and M2 (journey completion) are both pointed at this matrix, and the surface they most need is a copy of Today in both the tree set and the frame set.
**Device-owed?** no — a matrix re-shoot with a pre-onboarding seed.
**Confidence:** high

### A1-19
**Severity:** minor *(scope statement)*
**Surface:** all 14 sheets · **Evidence file:** `ls apps/rn/capture-ref/p6.8-a11y/` — nine files, **zero of them a sheet**
**Finding:** the matrix has 14 sheet *frames* and **no sheet accessibility tree**, so nothing in P6.8 has inspected a sheet's structure — including the two the matrix README already flags as unreached (`log-payment`, `living-expense-sheet`).
**Evidence:** the nine trees are all routes (`/`, `/progress`, `/money`, `/more`, `/paywall`, `/history`, `/living-expenses`, `/cushion-forecast`, and the duplicate `/onboarding`). Every finding in this slice about sheets (A1-16) comes from source, not from the instrument. The premium cushion **Slider** — the one control in the app with an `adjustable` role and a `aria-valuetext`, and the subject of a prior WCAG AA failure — lives in a sheet and has therefore never appeared in any tree here.
**Device-owed?** partly — sheet *structure* is a web-capturable gap; focus-after-dismiss is genuinely device-owed.
**Confidence:** high

### A1-20
**Severity:** minor *(a positive control — recorded so the bar is visible)*
**Surface:** cushion-forecast · **Evidence file:** `p6.8-a11y/cushion-forecast.txt:8–16`
**Finding:** `cushion-forecast` is the surface that does this **right**, and it is the reason the Progress findings are defects rather than platform limits.
**Evidence:**
```
- button "Aug 21, Clear"
- button "Sep 4, Clear"
- button "Sep 18, Clear"
…
```
Seven Guardian-band words in a 10-node tree. The difference from Progress's identical-looking chart is one thing only: **these bars are `Pressable`, so they have a role, so their label survives** (A1-6) — and they use the shipped `GUARDIAN_STATE_LABEL` vocabulary rather than the engine token (A1-2). Both Progress defects are one-line deltas from this file's behaviour.
**Device-owed?** no
**Confidence:** high

---

## What I could not judge

Bounded honestly. None of this is a green; it is unmeasured.

1. **Anything spoken.** How VoiceOver renders `$5,000`, `20% APR`, `$2.50/mo`, `−$450`, `~$5,722`, `Sep 4` and `2 of 4 · interest-free`. `a11y.ts` already records one case where a bare number was meaningless (the slider's `aria-valuetext`); the same question is unasked everywhere else.
2. **Whether the 22 role-less groups work on iOS** (A1-6). Everything downstream of that answer — whether the app's grouping strategy is sound-but-web-broken, or broken everywhere — turns on a check nothing here can run.
3. **Rotor navigation** in every form: headings, controls, landmarks, and **custom actions**. The app defines **no** `accessibilityActions` anywhere, so every swipe action (delete, mark-paid, the iOS long-press menu) is reachable only as a stray element or not at all. Whether that is acceptable is a device judgement.
4. **Focus after a sheet dismisses**, after a `confirmDelete` alert resolves, after a tab change, and after the coach-mark's "Got it". `react-native-web`'s `Modal` has a focus trap; iOS's `Modal` fences natively; **which element focus lands on afterwards is unmeasured on both.**
5. **Every sheet's structure** (A1-19), and **history / living-expenses populated** (A1-5).
6. **The two unreached recipes** — `log-payment` and `living-expense-sheet`. The matrix README asks whether that is a bad locator or a genuinely unreachable control; I cannot settle it from a tree that does not exist, but note that `LogPaymentSheet`'s other entry (`RowContextMenu`) is iOS-only, so the a11y question and the reachability question are the same question.
7. **Haptics as an accessibility channel.** `a11y.ts` states they are *"accessibility channels, not decoration"* and retained under Reduce Motion. Nothing on web can confirm they fire.
8. **The iPad rail.** At regular width the tab bar becomes a left rail with a different traversal position. No tree was captured at iPad width.
9. **Contrast of state colours.** Out of my lens (V1's), but noted: `barTone`'s comment claims *"label text ≥AA (bars stay decorative)"* — an assertion no instrument in this matrix checks.

---

## Proposed P6.14 device rows

Written in `DEBT_3.5_DEVICE_QA_CHECKLIST.md`'s format so they can be pasted in. `[M]` = manual only.
**§A1.1 is the one that gates the others** — if it fails, several findings above change severity.

- [ ] `[M]` **§A1.1 — do the app's grouped readings exist at all?** _(iPhone, VoiceOver ON, Today + Progress.)_
  Swipe right through Today from the top, then Progress from the top. Count the stops on the **big navy
  paycheck card** and on the **Progress ring**.
  **PASS:** the paycheck card is **ONE** stop reading *"This paycheck $2,000. Required $450, Spoken for …,
  Flexible $1,550. Suggested: …. Overdue payments need attention · debt-free by October 2026."* The ring
  is **ONE** stop reading *"0% paid, no milestones reached yet, next milestone 25%, debt-free projected
  October 2026."*
  **FAIL:** either is several stops of loose fragments, **or** you hear the bare number `$2,000` / `0%`
  with no sentence, **or** the ring is skipped entirely. ⛔ Report which — the three failures mean three
  different things. This decides **A1-6** for 22 sites at once.

- [ ] `[M]` **§A1.2 — the Progress cushion bars: reachable, and in whose words?** _(iPhone, VoiceOver ON, Progress. ⚠️ Requires a seed with at least one cycle below the line — the default seed has none, see A1-3.)_
  Swipe onto the five cushion bars under **CASH FLOW**.
  **PASS:** each bar is its own stop, reading a date, an amount and a band in the app's own words —
  **"Clear" / "Tight" / "Very tight"**.
  **FAIL:** you hear the words **"stable"** or **"pressure"** (A1-2 — the engine's internal vocabulary),
  or the bars are one stop, or they are unreachable. Note the exact words spoken.

- [ ] `[M]` **§A1.3 — nothing announces itself in the ordinary app** _(iPhone, VoiceOver ON, Today.)_
  Do four things in a row and listen after each: **(a)** tick a Required action's checkbox; **(b)** type
  `400` into **Can I afford it?**; **(c)** apply an extra payment; **(d)** with Airplane Mode on, force a
  save failure if reachable.
  **PASS:** each produces a spoken confirmation of what changed.
  **FAIL:** silence on any of them. ⚠️ **Expected to FAIL on all four** — A1-9 and A1-10 predict it. The
  row exists to confirm the prediction and to pin (d), the save-failure banner, which is `@platform
  android` and should be inaudible on iOS.

- [ ] `[M]` **§A1.4 — the swipe-delete pane must not be reachable while the row is shut** _(iPhone, VoiceOver ON, Money → Debts, and Money → Expenses.)_
  Swipe right through the debt list without opening any row.
  **PASS:** you reach each row once, as one utterance, and never hear **"Delete <name>"** unless you have
  opened that row's swipe action.
  **FAIL:** every row is preceded by a **"Delete …"** button (A1-7). Compare against a Today required-row,
  which is guarded and must **not** offer a hidden "Mark paid" button.

- [ ] `[M]` **§A1.5 — which debt is the Focus?** _(iPhone, VoiceOver ON, Money → Debts, ≥2 debts with one in Focus.)_
  Swipe through the rows without looking.
  **PASS:** exactly one row says **"Focus"**; an autopay bill says **"Autopay"**.
  **FAIL:** no row says either (A1-8 — expected to fail on **both** platforms).

- [ ] `[M]` **§A1.6 — the paywall says which plan is chosen** _(iPhone, VoiceOver ON, Premium.)_
  Swipe onto each of the three plan rows.
  **PASS:** the highlighted plan announces **"selected"**; the other two do not.
  **FAIL:** all three read identically (A1-11). Then repeat in Safari on the published web embed, where
  this is expected to fail regardless.

- [ ] `[M]` **§A1.7 — the tab bar** _(iPhone, VoiceOver ON.)_
  Swipe onto each tab.
  **PASS:** *"Today, tab, 1 of 3, selected"* — no stray or unknown character before the word.
  **FAIL:** anything is spoken before the tab's name (A1-13). Repeat on the web embed, where the icon
  glyph is in the name twice.

- [ ] `[M]` **§A1.8 — focus after a sheet closes** _(iPhone, VoiceOver ON, Money.)_
  Open a debt row's edit sheet, then dismiss it three ways: the ✕, the backdrop, and a swipe-down.
  **PASS:** focus returns to the row that opened it, each time.
  **FAIL:** focus lands at the top of the screen, on the tab bar, or nowhere. Repeat for the
  **confirm-delete alert** and for the coach-mark's **"Got it"**.

- [ ] `[M]` **§A1.9 — the rotor, on a screen nobody has heard** _(iPhone, VoiceOver ON, Money and More.)_
  Rotor → **Headings**, then rotor → **Actions**, on both screens.
  **PASS:** headings give a usable outline; a debt row offers **Delete** (and **Log payment**) as rotor
  *actions*.
  **FAIL:** headings are a flat undifferentiated list (A1-12), or the Actions rotor is empty — the app
  defines no `accessibilityActions` anywhere, so this is expected to be empty and the row exists to
  record it.

- [ ] `[M]` **§A1.10 — the surfaces with no evidence** _(iPhone, VoiceOver ON.)_
  Swipe through, populated: **Pay cycle history** (≥1 finished cycle), **Everyday spending** (≥2 items,
  one disabled), the **cushion Slider** inside its sheet, and **Log a payment**.
  **PASS:** every row is one sensible utterance; the disabled spending item says so; the slider reports a
  money value, not a bare number; Log a payment is reachable **without** a long-press.
  **FAIL:** any of them. ⛔ None of these four has ever appeared in any accessibility tree (A1-5, A1-19,
  and the matrix README's hole 1).
