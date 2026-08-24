# P6.8.9.2 — cluster f, the ACCESSIBILITY half

> Independent verification of **A1-2 · A1-7 · A1-8 · A1-9 · A1-10**.
> The verifier did not build any of these fixes. Finding text: `slices/A1-voiceover.md`;
> adversarial read: `refutations/R5-a11y.md`; what shipped: `docs/DEBT_ELEVATION_LOG.md`.
> ⚠️ Verdicts are decided from the CURRENT tree, not from the log. Where they disagree the code wins.
> Fresh a11y trees read: `apps/rn/capture-ref/p6.8-a11y/*.txt` (re-shot 2026-08-24 at P6.8.9.1).
> Written incrementally, one id per section, appended as each is settled.

---

## A1-2 — the cushion bars announced the engine's token (`stable` / `pressure`)

**VERDICT: `CLOSED-UNPINNED`**

### 1. Is the observation closed?
**Yes.** `apps/rn/src/components/progress/CashFlowSection.tsx:148` now reads

```tsx
accessibilityLabel={`${shortDate(cycle.cycleStart)}: ${formatWhole(cycle.net)} of room, ${GUARDIAN_STATE_LABEL[cycle.guardianState]}`}
```

— the shipped vocabulary (`packages/core/copy/vocabulary.ts:150–154` → `Clear` / `Tight` / `Very tight`),
keyed off `guardianState`, not `cushionStatus`. The import is at `CashFlowSection.tsx:12`. `GuardianState`
is exactly `"clear" | "tight" | "at-risk"` (`packages/core/guardian/buildGuardianBrief.ts:19`) and
`GUARDIAN_STATE_LABEL` has all three keys, so the lookup cannot interpolate `undefined` — a real failure
mode for a fix of this shape, and it is not present.

**Class check, not just the named site.** Every remaining `cushionStatus` read in `apps/rn/src` is a
*visual* or *selector* use, never a label: `CashFlowSection.tsx:95,97` (caption branch), `:131`
(`barTone`), `TimelineLedger.tsx:69` (colour), `guardianSelectors.ts:599,663`, `planSelectors.ts:327,356`.
`TimelineLedger`'s two labels (`:77`, `:111`) carry no state word at all. No second site leaks the token.

**The log's [D17] comment rewrite is real:** `packages/core/timeline/buildMultiCycleTimeline.ts:29–33` no
longer calls `cushionStatus` the "display alias" (R5-N3's inversion) — it now says every word a user reads
or hears is keyed off `guardianState`. The comment that produced the defect is gone, not annotated.

### 2. What did the site ALSO do, and does it still do it?
Before the fix the bar (a) was **one grouped a11y element** (`accessible`), (b) spoke **date + amount**
ahead of the band, and (c) drew its **colour** from `cushionStatus` via `barTone`.
- (a) preserved — `accessible` still at `CashFlowSection.tsx:143`.
- (b) preserved — `shortDate(...)` and `formatWhole(cycle.net)` unchanged in the same template.
- (c) preserved — `barTone(cycle.cushionStatus, …)` at `:131` is untouched. ⚡ **The spoken band and the
  painted band cannot disagree**, because `toCushionStatus` (`buildMultiCycleTimeline.ts:18–20`) is a
  total bijection `clear→stable · tight→tight · at-risk→pressure`. The fix switched fields without
  switching *meaning*, which is the property most at risk here and it holds.

**Which test proves it?** **None.** No spec renders `CushionBar`; `grep -rn "of room" apps/rn/tests` is
empty, and `CashFlowSection` appears in no test file.

### 3. Was the implied remedy right?
Yes, and R5 improved it: the slice implied a mapping had to be added; the correct value was already on the
object. The shipped fix is exactly R5-A1-2's one-line `GUARDIAN_STATE_LABEL[cycle.guardianState]`, matching
the positive control `CashRunwayChart.tsx`.

### Why UNPINNED, precisely
`scripts/check-glossary.ts` cannot catch this class and would not have failed on the original defect:
its `RETIRED` list (`:35–46`) and `STATE_WORDS` (`:49`, `/\bcrunch\b/i`) ban specific *literal* words, and
the defect was an **interpolated identifier** (`${cycle.cushionStatus}`) — no banned word appears in the
source text at all. The log states this openly ("Nothing in the repo compares a spoken string against the
glossary … Filed to 2.1 rather than built"), and the code agrees. **Missing test:** a gate (or a render
assertion) that every `accessibilityLabel` band word comes from `GUARDIAN_STATE_LABEL`. Until then the
regression is a one-word edit away and nothing sees it.

⚠️ **Not evidence either way:** `apps/rn/capture-ref/p6.8-a11y/progress.txt:6` still reports
*"Guardian-band words present: 0"*. That is A1-6's instrument blindness (the label sits on a role-less
`div`, which Playwright's `ariaSnapshot` drops), **not** a sign A1-2 is open. It also means **no web
artifact in this repo can confirm A1-2 on either platform** — it stays a device row (§A1.2 / §R5).

---

## A1-7 — `ListRow`'s swipe-delete pane was permanently in the tree, announced BEFORE the row

**VERDICT: `CLOSED`** — and it is the only id in this cluster where all three properties are each pinned
by a *different* spec.

### 1. Is the observation closed?
**Yes, and it is confirmed twice — in source and in the fresh instrument.**
`apps/rn/src/components/ui/ListRow.tsx:234–245`, `SwipeDeleteAction`:

```tsx
<Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Delete ${title}`}
  tabIndex={-1} {...a11yHidden(true)} style={[styles.deleteAction, { backgroundColor: fill }]}>
```

`a11yHidden(true)` → `{'aria-hidden': true}` (`apps/rn/src/utils/a11y.ts:44–46`).
`apps/rn/capture-ref/p6.8-a11y/money.txt` (re-shot today) has **no `button "Delete Card"` node at all** —
compare the finding's quoted `money.txt:19–20`, where it was the node *before* the row. The mount path is
otherwise unchanged (`ListRow.tsx:157` `renderRightActions`, `:171` passed unconditionally), so the node's
disappearance is the fence, not a changed render.

### 2. What did the site ALSO do, and does it still do it? — THE THREE PROPERTIES
The pane before the fix was **(i)** in the a11y tree *(the defect)*, **(ii)** operable by the finger that
revealed it, **(iii)** a tab stop. The intent is *hidden · operable · not a tab stop*, and the log records
two shipped attempts that each held only two of the three. **All three now hold, and I verified each from
installed source rather than from the log:**

| property | mechanism, verified | pinned by |
|---|---|---|
| **hidden** | `aria-hidden:true` → `createDOMProps/index.js:409–411` emits `aria-hidden` on web; on native `View.js:69–74` expands it to `accessibilityElementsHidden` + `importantForAccessibility:'no-hide-descendants'` | `apps/rn/tests/e2e/a11y-row-labels.spec.ts:32` — `getByRole('button', { name: 'Delete Card' })` → `toHaveCount(0)` |
| **operable** | `tabIndex` touches neither the press handler nor pointer events; `onPress` is still wired at `ListRow.tsx:237` → `handleDelete` (`:152–156`) | `apps/rn/tests/e2e/swipe-delete.spec.ts:49–56` — a real CDP **touch** on the revealed Delete, then `expect(page.getByText('Visa')).toHaveCount(0)` |
| **not a tab stop** | `tabIndex={-1}` **does** reach the DOM: `react-native-web/src/exports/Pressable/index.js:193–195` — `if (tabIndex !== undefined) _tabIndex = tabIndex;` — the caller's value wins over the computed `disabled ? -1 : 0`, and `createDOMProps/index.js:826–832` writes it through | `apps/rn/tests/e2e/a11y-axe.spec.ts:35` (`aria-hidden-focus`), scanning `/money` at `:223–227` |

⚡ **This is the exact inverse of the `focusable={false}` attempt, and the asymmetry is real, not folklore.**
`focusable` is consumed only in `createDOMProps`' `else` branch (`:834–871`) — i.e. only when `tabIndex` is
undefined — and `Pressable` always defines it. `tabIndex` is read *before* that branch. The current fix sits
on the live path; the previous one sat on dead code. **Measured in the installed package, not assumed.**

⚡ **The tab-order half is genuinely pinned, not pinned-by-luck.** Remove `tabIndex={-1}` and `Pressable`
recomputes `0` → `tabindex="0"` on an `aria-hidden="true"` element → `aria-hidden-focus`. `violations()`
(`a11y-axe.spec.ts:63–65`) returns `[...res.violations, ...res.incomplete]`, so the full-screen `isModalOpen`
escape does not swallow it. And the scan reaches this element: `violations()` excludes only `[inert]`, no
`useInert` call sites exist on Money (`grep useInert` → `index.tsx:1029`, `RequiredActionsCard.tsx:255`,
`TutorialFence.tsx:34`, `tutorialTargets.tsx:211`), and RNW's `Modal` applies neither `inert` nor
`aria-hidden` to the background (no such string anywhere in `react-native-web/src/exports/Modal/`).

**A fourth property the finding never named, and I checked it because the fence removes a path:** *Delete
must stay reachable.* It does, and not by assertion — all four `ListRow` call sites that pass `onDelete`
also pass `onPress` to an edit sheet (`money.tsx:522–523`, `:787–788`, `:988–989`,
`living-expenses.tsx:71–72`), and every one of those sheets renders `FormSheet`'s remove control
(`DebtSheet.tsx:259`, `ExpenseSheet.tsx:99`, `GoalSheet.tsx:70`, `LivingExpenseSheet.tsx:57` →
`FormSheet.tsx:106–107, 172–173`). iOS additionally keeps the long-press `RowContextMenu` Delete
(`ListRow.tsx:165`). **Nothing became unreachable.**

**iOS carries no new risk from `tabIndex`.** `View.js:80–82` turns `tabIndex={-1}` into `focusable:false`,
and `focusable` exists **only** in the Android host props
(`ReactCommon/react/renderer/components/view/platform/android/.../HostPlatformViewProps.h`) — it is not
parsed on iOS at all, so operability there is untouched.

### 3. Was the implied remedy right?
**No — and the shipped fix correctly declined it.** The slice's remedy was *"apply the guard
`RequiredActionsCard` documents"* (`useInert(ref,!open)` + `a11yHidden(!open)`). R5-N1/R5-N2 showed that
guard is half web-only and rests on a comment (`RequiredActionsCard.tsx:369`) claiming the state-gated
version was **measured** to reset the pan — while the shipped code does exactly that. `ListRow` fences
permanently instead, which sidesteps the contradiction entirely. `useInert` was in fact tried and broke
operability. **The finding was right about the defect and wrong about the fix.**

### Residual — stated, not swept
- ⚠️ **The iOS half of the fence is not provable here.** `accessibilityElementsHidden` is set on
  `self.accessibilityElement` (`RCTViewComponentView.mm:376`) alongside `isAccessibilityElement` (`:350`);
  no artifact in this repo observes iOS VoiceOver. Device row §A1.4 / §R5 still owes it. *(One thing that
  is settled: the pane's text cannot leak into a parent's composed label —
  `RCTRecursiveAccessibilityLabel` skips subviews with `accessibilityElementsHidden`, `:1381–1383`.)*
- ⚠️ **R5-N1 is still open in the tree**, exactly as the log says it filed it: `RequiredActionsCard.tsx:255`
  `useInert(ref, !open)` + `:257` `a11yHidden(!open)` with `:283` `useState(false)` and `:390`
  `onSwipeableWillOpen` — the design its own comment at `:366–370` records as measured-to-break. Out of A1-7's scope; **not fixed, and someone still owes it.**

---

## A1-8 — `groupLabel` dropped `badges`, so **Focus** was announced to nobody

**VERDICT: `CLOSED`** *(pinned at one of four sites; the other three are held by the type system, not by a
test — see below)*

### 1. Is the observation closed?
**Yes, and by a structural change rather than a patch.** `badges` is no longer a `ReactNode`; it is data:
`apps/rn/src/components/ui/ListRow.tsx:61` — `badges?: { label: string; tone?: PillTone; key?: string }[]`.
The label reads it at `:80–87`:

```tsx
const a11y = groupLabel(
  title,
  badges?.map((b) => b.label).join(', ') || undefined,
  [meta, caption].filter(Boolean).join(', ') || undefined,
  amount ? `${amount}${amountSuffix ?? ''}` : undefined,
);
```

The fresh tree confirms it end-to-end: `apps/rn/capture-ref/p6.8-a11y/money.txt:19` now reads
`button "Card, Focus, $5,000 · 20% APR, verified, $100/mo"` — against the finding's quoted
`"Card, $5,000 · 20% APR, verified, $100/mo"`. The badge word is in the **name**, which is what both
platform mechanisms (iOS subtree non-recursion, web name-over-children) required.

**All four call sites converted, and R5's undercount is closed too:** `money.tsx:502–509` builds the debt
chips as objects — including the BNPL branch `{ key: 'b', label: debt.bnplProvider || 'BNPL' }` at `:504`,
the third dropped badge R5 found and the slice missed; `money.tsx:786` (bills · Autopay), `money.tsx:986`
(goals · Funded), `living-expenses.tsx:70` (Off). `grep -rn "badges" apps/rn/src` returns exactly these
four plus the component — no site was missed.

### 2. What did the site ALSO do, and does it still do it?
The `badges` prop's other job was **to render**. It still does, from the *same* array:
`ListRow.tsx:113` — `{badges?.map((b, i) => <Pill key={b.key ?? b.label ?? i} label={b.label} tone={b.tone} />)}`.
- **Visual parity:** tones are carried per-object and are unchanged at every caller (`'action'`,
  `'autopay'`, `'neutral'`, `'paid'`) — I compared each against the finding's and R5's quoted originals.
- **React keys:** the debt chips kept their explicit `key: 'f'` / `'b'` / `'a'` (`money.tsx:503–507`), and
  the fallback chain `b.key ?? b.label ?? i` covers the three callers that pass none. A key regression
  (reconciliation churn on a list) was a live risk in this refactor and it did not land.
- ⚡ **The divergence risk was designed out, not merely avoided.** A `badgeLabels` prop beside a `badges`
  node would have been two copies of the same words; one array feeding both the pill and the label makes
  them structurally incapable of disagreeing. That is a stronger guarantee than any test here.

**Which test proves it?** `apps/rn/tests/e2e/a11y-row-labels.spec.ts:28–29` —
`page.getByRole('button', { name: /^Card, Focus,/ })`. **Would it have failed on the original defect?
Yes** — the original computed name began `"Card, $5,000"`, and as the spec's own comment notes, `Focus`
appears in no other field of that row, so a name containing it cannot have come from anywhere else.
⚠️ **It pins one badge on one surface.** Autopay-on-bills, the BNPL provider name, `Funded` and `Off` have
no assertion. What holds them is the **type**: `badges` is now a typed array, so re-introducing the defect
means changing the prop's type and breaking `groupLabel`'s input at the same time — `typecheck` catches it.
That is real coverage, but it is a *shape* guarantee, not a *content* one: a caller could still pass
`badges` and have the label silently stop reading it if `:82` were edited, and only the Focus row would go
red.

### 3. Was the implied remedy right?
Yes, and the build went **wider than the finding**, deliberately — which is worth stating because it is a
behaviour change nobody asked for. The slice explicitly refuted two of the four callers: Goals' `Funded` is
redundant with `amountSuffix={' saved'}` (`money.tsx:985–986`) and Living-expenses' `Off` is redundant with
`meta={item.enabled ? 'Counts toward reserve' : 'Not counted'}` (`living-expenses.tsx:68,70`). Those two
rows now say their state **twice** — *"…, Funded, Savings, $500 saved"*. **Not a defect** (a redundant word
is not a lost one) and converting all four is what makes the prop's type uniform, but it is the one place
the shipped fix does something the finding and its refutation both argued against, and it went unrecorded.

### Class check, since the finding was narrow by construction
Every other `<Pill>` in the app sits **outside** an `accessible` wrapper, so no second instance of this
defect exists: `RequiredActionsCard.tsx:109, 304, 306, 326` render pills in a row whose only
`accessibilityLabel`s are the bucket header (`:202`) and the check control (`:262`) — the row body itself
is a plain `View` (`:312–316`), so its pill text stays independently reachable.
`PaydayCaptureSheet.tsx:307, 379, 396, 446` and `ExampleCanvasMarker.tsx:104` likewise. **A1-8 was a
`ListRow` defect only, and `ListRow` is fixed.**

---

## A1-9 — *Can I afford it?* produced its verdict with no live region and no announcement

**VERDICT: `CLOSED`** *(the web half is pinned by a test that assails the right subject; the iOS half is
unpinnable in this repo **by construction** — see below)*

### 1. Is the observation closed?
**Yes.** The finding's evidence was `grep accessib` on the file returning nothing. It now returns three:
`AffordabilityCard.tsx:20` (import), `:124` `const liveProps = useLiveAnnouncement(verdictLine);`, and
`:186` `<View {...liveProps}>` wrapping every state of the read.
`useLiveAnnouncement` (`apps/rn/src/utils/a11y.ts:167–175`) returns
`{ accessibilityLiveRegion: 'polite', 'aria-live': 'polite' }` **and** fires `announce()` in an effect
guarded on the message having actually changed — the two halves R5-A1-10 proved no single primitive had.

⭐ **The one design choice here that is right and easy to get wrong:** the live region is the **stable
wrapper**, not the verdict. `:186`'s `<View>` is present in all three inner branches (`!result`,
`!isPremium`, and the two verdict branches), so the region exists *before* the content it announces
changes. A region that mounts together with its own content announces nothing, and that is the failure
mode most fixes of this shape ship with.

### 2. What did the site ALSO do, and does it still do it?
The site had **no** a11y properties, so nothing a11y could regress. What could regress is **the drawn
card**, and two things were at risk: the copy and the layout. I checked both against the pre-fix file
(`git show 2d448d9 -- …/AffordabilityCard.tsx`):
- **Copy — byte-identical.** All three sentences moved from two inline ternaries (`:178–180`, `:190–192`
  before) into `verdictLine` (`:116–123`) unchanged, including the curly apostrophes. ⭐ The verdict is now
  derived once and both drawn (`:199`, `:209`) and spoken from the same string, so drawn and spoken cannot
  drift — a stronger property than the finding asked for.
- **Layout — safe, and not by luck.** The new wrapper `<View>` at `:186` carries no style. `Card` spaces
  its children with **margins on the children** (`styles.hint` `marginTop`, `styles.read`
  `marginTop: spacing.md`, `:255–256`) and has **no `gap`** of its own (`Card.tsx:44–45`), so inserting an
  unstyled column container changes nothing: Yoga has no margin collapsing, and the inner margins still
  apply inside the wrapper. Had `Card` used `gap`, this insertion would have silently re-spaced the card.

**Which test proves it?** `apps/rn/tests/e2e/affordability.spec.ts:67–79`, and it is a well-built one:
it asserts the `[aria-live="polite"]` node contains **"Enter an amount"** *before* typing and the verdict
*after* — i.e. it pins the **stable-wrapper** property, not merely the attribute's presence. **Would it
have failed on the original defect? Yes** — there was no `aria-live` node in the card at all, so the first
assertion fails at `toHaveCount(1)`. ⭐ It is also not a V2-6-style proxy: the subject is the region and
the assertion is on the region.

### 3. Was the implied remedy right?
The finding's implied remedy — *"add a live region"* — **would have been half a fix**, and the build
correctly refused it. The slice itself flagged this (*"It also cannot be a web-only fix; see A1-10"*), and
R5 measured why: `aria-live` is `@platform android`, so a live region alone is silence on iOS.

### ⚠️ What is NOT closed here, stated rather than implied
1. **The iOS half cannot be pinned by anything in this repo.** It rests entirely on
   `announce()` → `AccessibilityInfo.announceForAccessibility`, whose react-native-web implementation is
   `announceForAccessibility: function (announcement: string): void {}` — an **empty body**
   (`apps/rn/node_modules/react-native-web/src/exports/AccessibilityInfo/index.js:101`). Every web test in
   this suite is blind to it. **This is a device row by construction**, not by omission — §A1.3(b).
2. ⚡ **The two halves of the hook cover different content, and for a free user they disagree.**
   `verdictLine` is `null` unless `result && isPremium` (`:117`), so on **iOS** the non-premium read
   *"You have about $X spare this paycheck."* (`:192`) announces **nothing**, while on **web** the
   `aria-live` wrapper announces it because the region's content changed. The web region speaks whatever
   lands inside it; the iOS path speaks only the string handed to the hook. **Not caught by the spec**
   (which seeds `PREMIUM`), not named in the log, and a real behavioural asymmetry inside the fix.
3. **The card's other two states are still silent.** `applied` (`:127–146`) and `saved` (`:151–168`) return
   **before** the wrapper and carry no `liveProps` — so *"Added New couch to this paycheck — your plan
   updated below."* announces on neither platform. That is A1-10's class, and it is the §A1.3(c) row.

---

## A1-10 — the app's only live region is `@platform android`, so nothing on iOS ever announces

**VERDICT: `PARTIAL`** — the missing **primitive** was built and is correct; the finding's **own evidence
site is untouched**, and the class it named is still silent on both platforms.

### 1. Is the observation closed?
**The capability claim: yes. The site claim: no.**

⭐ **What is genuinely closed** is R5's sharpened version of the finding — *"there is no primitive in this
codebase that announces on both platforms."* `apps/rn/src/utils/a11y.ts:167–175` is now that primitive, and
it is built correctly: the region props for web (`aria-live` → `createDOMProps/index.js:489–491`) **and**
`announce()` for iOS, fired only when the message changes (`:169–173`) so a keystroke-by-keystroke verdict
does not re-announce.

⛔ **What is not closed is the finding's literal observation.** `apps/rn/src/components/SaveFailedBanner.tsx:30–31`
is **byte-for-byte the line the finding quoted**:

```tsx
<View … accessibilityRole="alert" accessibilityLiveRegion="polite" testID="save-failed-banner">
```

`git log -- apps/rn/src/components/SaveFailedBanner.tsx` returns a single commit, `fb9a821` (T3) — the file
was **not touched by cluster f at all**. `accessibilityLiveRegion` is declared in
`interface AccessibilityPropsAndroid` (`react-native/Libraries/Components/View/ViewAccessibility.d.ts:245`,
inside the interface that opens at `:220`,
`@platform android`), so *"Couldn't save your last change to this device"* still appears **silently on
iOS** — the exact sentence the finding is about. ⚠️ It also has **no test of any kind**: `save-failed-banner`
appears nowhere outside its own `testID` (`grep -rn save-failed-banner apps/rn/tests` → nothing).

**The rest of the class is unchanged too.** `useLiveAnnouncement` has exactly **one** call site
(`AffordabilityCard.tsx:124`). `announce()` still fires at six places and **all six are still tutorial /
demo / screen-title**, which I re-enumerated rather than inheriting: `app/(tabs)/index.tsx:958` and `:1063`
are both inside the tutorial sandbox subtree (they read `useStore(sandbox, …)` and render under
`<StoreProvider store={sandbox}>`), plus `TutorialOverlay.tsx:57`, `demo.tsx:76`,
`cushion-forecast.tsx:33`, `schedule/[id].tsx:26`. **Zero fire in the ordinary app.** Marking a bill paid,
applying an extra payment, crossing a milestone, a Guardian band flipping, a backup succeeding or failing —
every one of the finding's examples is still silent, on both platforms.

### 2. What did the site ALSO do, and does it still do it?
`SaveFailedBanner` is unmodified, so nothing there could regress. The property worth checking is on the new
primitive, and it holds: `useLiveAnnouncement` returns **both** spellings, and neither harms the platform
that ignores it — on native `View.js:64–67` folds `aria-live` into `accessibilityLiveRegion` (Android-only,
therefore inert on iOS), and on web `createDOMProps` prefers `aria-live`. No double-announcement on either.

⚠️ **One property the primitive does NOT have, and it is not written down anywhere:** the region and the
announcement **cover different content**. On web anything that changes inside the wrapper is announced; on
iOS only the string passed to the hook is. A caller that puts changing content inside the region without
routing it through the argument gets web-only speech — which is already happening in
`AffordabilityCard`'s free-tier branch (see A1-9, residual 2).

### 3. Was the implied remedy right?
The slice's remedy was *"iOS is silent — add announcements"*; R5 corrected it to *"neither primitive works
alone, so add a cross-platform one."* **R5 was right and the build followed R5**, which is the correct
call. What the build did not do is *apply* it — and the log is candid that only `AffordabilityCard` was
wired, so **the code and the log do not disagree here; the finding and the closure do.**

### What is missing, named precisely
1. **`SaveFailedBanner` should use `useLiveAnnouncement`.** One line, the site the finding is written
   about, and it was skipped.
2. ⛔ **No gate stops the next occurrence.** `scripts/check-native-a11y-props.ts`'s `BANNED` list
   (`:37–49`) is `accessibilityElementsHidden · importantForAccessibility · accessibilityState ·
   accessibilityValue · accessibilityActions · onAccessibilityAction · accessibilityViewIsModal` —
   **`accessibilityLiveRegion` is still not on it.** R5 and the log both identified this as "the same class
   the script exists to catch, arriving from the opposite side"; it remains uncaught. A one-entry addition
   (banning bare `accessibilityLiveRegion` outside `a11y.ts`) would have flagged `SaveFailedBanner`
   mechanically and would have failed on the original defect.
3. **The four §A1.3 events** — checkbox tick, verdict, extra payment applied, save failure — remain the
   device rows the slice wrote, with only (b) now expected to pass.

---

## Cluster f · accessibility — the five verdicts

| id | verdict | the one sentence |
|---|---|---|
| **A1-2** | `CLOSED-UNPINNED` | The bar speaks `GUARDIAN_STATE_LABEL[cycle.guardianState]` (`CashFlowSection.tsx:148`) and the comment that caused it was rewritten — but **no test or gate reads a label's contents**, and `check-glossary.ts` structurally cannot, because the defect was an interpolated identifier and not a banned word. |
| **A1-7** | `CLOSED` | All **three** properties hold and each is pinned by a *different* spec — hidden (`a11y-row-labels`), operable (`swipe-delete`), not-a-tab-stop (`a11y-axe`) — and `tabIndex={-1}` is on `Pressable`'s live path (`react-native-web/src/exports/Pressable/index.js:193–195`) where `focusable={false}` was dead code. |
| **A1-8** | `CLOSED` | `badges` became typed data so the pill and the label read the same array (`ListRow.tsx:61, 80–87, 113`) and `money.txt:19` now names `Focus`; one of four sites is test-pinned, the other three are held only by the type. |
| **A1-9** | `CLOSED` | The live region is the **stable wrapper** and the verdict is derived once and both drawn and spoken (`AffordabilityCard.tsx:116–124, 186`), pinned on the right subject by `affordability.spec.ts:67–79` — with the iOS `announce()` half unpinnable here **by construction**. |
| **A1-10** | `PARTIAL` | The cross-platform primitive was built and is correct, but **`SaveFailedBanner.tsx:30–31` — the finding's own evidence line — was never touched**, only one site adopted the hook, and `check-native-a11y-props.ts` still does not ban bare `accessibilityLiveRegion`. |

### Two things that are true across the cluster

⚡ **Every fix here that a web artifact can see, a web artifact confirms** — `money.txt` shows both A1-7
and A1-8 closed in the same two lines it once showed them open. **Every fix that depends on iOS speech is
unconfirmable in this repo, and always will be:** `announceForAccessibility` is an empty function body in
react-native-web (`AccessibilityInfo/index.js:101`), so A1-2's spoken words, A1-9's announcement and
A1-10's whole class are **device rows by construction, not by omission.** A green suite is not evidence
about any of them.

⛔ **The log's own after-scan is right that f's tests assert intent** — but A1-7 is the counter-example and
worth keeping: it is safe *because* two specs that were never written for it (`swipe-delete`, `a11y-axe`)
happen to cover its adjacent properties. **That was luck, not design.** A1-2 has no such neighbour and is
therefore the id in this cluster most likely to silently regress.
