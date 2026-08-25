# Cluster F — the visual, copy and a11y surfaces

**Subject:** `git diff 8e4540a..3dc3c22` over the twelve cluster-F files.
**Method:** the seven questions of `BRIEF.md`, one verdict per hunk-group, every claim cited `path:line`.
**Rules honoured:** no sub-agents, no edits, no gate/suite runs. `DEBT_ELEVATION_PLAN.md` *BUILDING NOW* and
`DEBT_ELEVATION_LOG.md`'s `P6.8.9.7.*` entries were not read.

⚠️ **Two assigned paths do not exist.** `apps/rn/app-intents-swift/LogPaymentIntent.swift` and
`apps/rn/app-intents-swift/SiriQueryIntents.swift` return nothing from `git diff --stat` because the files
live at **`apps/rn/plugins/app-intents-swift/`**. At the real paths they **were** changed in this range
(1 and 4 lines) and are judged in **F10** — an accepted path, not an absent change.

Sections are appended as each hunk-group is finished.

---

## F1 — `progress.tsx`: the scroll-host registration — **DEFECT**

`apps/rn/src/app/(tabs)/progress.tsx:126-140` adds `scrollRef`/`offsetRef` and an effect that calls
`targets.registerScrollHost(fn)`, cleaning up on unmount.

**Q1 — prior properties.** Nothing at the site was removed; the hooks sit above the two early returns
(`progress.tsx:142`, `:161`), so hook order is stable across all three branches. ✅

**Q2/Q7 — the environment that breaks it: a mounted-but-blurred Progress tab.**
The cleanup is keyed on **unmount**, and the comment states the hazard it is meant to close:
> `progress.tsx:138` — *"⚠️ Deregister on unmount, or a backgrounded Progress keeps answering for whatever
> screen is up."*

⛔ **Tab screens in this app do not unmount on blur.** `apps/rn/src/app/(tabs)/_layout.tsx:57-92` sets no
`unmountOnBlur`/`popToTopOnBlur`, and the repo states the consequence in its own words at
`apps/rn/src/hooks/use-coach-mark.ts:42-43`: *"it was fixed by gating on focus — **because Today never
unmounts**."* So once the user has visited Progress, the host stays registered for the rest of the session.

The consequence is exactly what the comment says it must prevent:
- `apps/rn/src/store/tutorialTargets.tsx:179-183` — `requestReveal` returns `true` whenever *any* host is
  registered, and calls it.
- `apps/rn/src/components/plan/CoachMarkLayer.tsx:150-176` runs for **whatever mark is active**, on any
  screen. With Progress backgrounded and `debt-row-actions` (Money, `money.tsx:258`) or `payoff-schedule`
  (`DebtSheet.tsx:133`, a sheet) up, `requestReveal(needed)` **scrolls the invisible Progress list** and
  reports success.
- `CoachMarkLayer.tsx:152` latches `revealAskedFor.current = active`, so that mark never asks again.
- `tutorialTargets.tsx:84-85` documents the contract this breaks: *"Returns `false` when no host is
  registered (a sheet, a non-scrolling screen), so the caller keeps its existing placement"* — after this
  change a sheet's mark gets `true` from a screen two tabs away.

The user-visible effect: the Money/sheet callout is not repositioned (unchanged from before), and Progress
is silently scrolled to a position the user never chose, discovered when they next open the tab.

**The fix the repo already owns:** `useIsFocused()`, used for precisely this mount-≠-visible confusion at
`use-coach-mark.ts:60-65`. Registration should be focus-gated, not mount-gated.

**Q3 — library contract.** `Screen` supplies `scrollEventThrottle={16}` (`apps/rn/src/components/screen.tsx:98`),
so `offsetRef` genuinely tracks on iOS; without it RN's iOS default would fire `onScroll` once per gesture and
`scrollTo({ y: offsetRef.current + dy })` would compute from a stale origin. ✅ Verified, not assumed.

**Q4 — side effects.** In an effect, not the render body; `registerScrollHost` is a ref write
(`tutorialTargets.tsx:176-178`), honouring the file's *"nothing here may touch React state"* rule
(`tutorialTargets.tsx:87-88`). ✅

**Q5/Q6 — what would catch it.** `coach-mark-neighbour.spec.ts` exercises the Progress case only, with a
single screen visited. **No spec visits Progress and then asks for a mark on another screen**, so nothing in
the repo would notice this. No gate applies (this is behaviour, not a literal).

⚠️ **Could not determine:** whether Expo Router's `Tabs` in this exact version lazily *unmounts* on
memory pressure. The evidence above is the repo's own claim plus the absence of `unmountOnBlur`; I did not
run the app.

---

## F2 — `progress.tsx`: `Screen scrollRef` + `onScroll` → `invalidate` — **SOUND**

`progress.tsx:212-223`.

**Q1.** `title`, `right` and `maxWidth` are all preserved verbatim; only two props are added. ✅
**Q3.** `scrollRef`/`onScroll` are pre-existing props (`screen.tsx:26-27,43-46,95-98`); `screen.tsx` was
**not** touched in this range (`git diff --stat` returns nothing for it), so this is a use of an existing
seam, as the docstring claims.
**Q4.** `onScroll` writes a ref and calls `invalidate`, which is a ref write plus a listener walk
(`tutorialTargets.tsx:153-156`) — no `setState` on the layout path. ✅
**Q7 — the 60 Hz `invalidate`.** At `scrollEventThrottle={16}` this fires ~60×/s. It is bounded on both
sides: `CoachMarkLayer.tsx:60-63` only subscribes while `active` is set, and `CoachMarkLayer.tsx:99-108`
holds an `inFlight` latch so at most one `measure` is queued per frame. `useCoachMark`'s listener has its
own `asked` latch (`use-coach-mark.ts:73-79`). With no mark up the listener set is empty. ✅
⚠️ One residue: `invalidate('trajectory-scrub')` is called on scroll **unconditionally**, including while a
*different* mark is the active one. That is a no-op today (`CoachMarkLayer.tsx:103` filters on `id !== active`)
but it means the id is hard-coded in a handler that does not know which subject is being coached.

---

## F3 — `progress.tsx:242`: `testID="progress-hero-date"` — **SOUND**

Additive. `heroDateFit` (`progress.tsx:52-57`) carries no `testID`, so the spread cannot clobber it, and the
prop order puts `testID` first regardless. Consumed by `hero-date-fit.spec.ts:47` (see F12).
⚠️ The **other** hero variant at `progress.tsx:154` — the debt-free-with-history branch — shares `heroDateFit`
and its hazard but did **not** get the testID, so the new spec can never reach it. Its content
(`Every balance paid off`) is longer than any month-year and sits in the full card width, so the risk differs;
stating it because nothing measures that branch.

---

## F4 — `progress.tsx:265-285`: the `TutorialTarget` wrapper removed — **SOUND**

**Q1 — did the layout survive?** `Screen`'s content container is `{ paddingHorizontal, gap: spacing.lg }`
(`screen.tsx:144-147`). Before: 4 direct children (hero, cash-flow card, `TutorialTarget` View, archive).
After: 4 direct children (hero, cash-flow card, `TrajectoryChart`'s `Card`, archive). Same child count, same
gap count, and the removed `TutorialTarget` rendered an **unstyled** `View`
(`tutorialTargets.tsx:245-272`), so it contributed no box of its own. ✅ No visual change.

**Q1 — did the subject survive?** Yes, and it moved: `TrajectoryChart.tsx:364` now declares
`<TutorialTarget id="trajectory-scrub">` around the scrub-responder View. Verified it is the **only**
declaration in the tree (`grep`: one site) and that `TrajectoryChart` has exactly **one** consumer
(`progress.tsx:270`), so there is no second registration racing for the same Map key.

**Q7 — what the move changed that nothing in this file checks.** `testID="tutorial-target-trajectory-scrub"`
still resolves, but its **box is now much smaller** (the chart's `height: H` responder, not the whole card).
Four specs take geometry from that testID and are now measuring a different rect:
`coach-marks.spec.ts:127`, `probe-mark-ipad-rail.spec.ts:32`, `probe-mark-route-push.spec.ts:31`,
`phase35-themes.shot.ts:123-127`. `coach-marks.spec.ts:135-150` was rewritten in the same range to a
non-overlap assertion, which survives the resize; the two probes and the shot script report numbers rather
than assert, so they will print different values with no signal that the reference changed.

**Q7 — the a11y consequence.** `TutorialTarget`'s `control` fence and its `a11yHidden` wrapper now sit
**inside** the chart's `groupLabel` group (`TrajectoryChart.tsx:364-380`). `control` is not passed here, so
`fenced` is always false (`tutorialTargets.tsx:240`) and nothing changes today — but a future `control`
on this target would now hide a node nested inside an `accessible` group rather than the group itself.

---

## F5 — `CashFlowSection.tsx:68`: `<Card testID="cash-flow-section">` — **SOUND**

`Card` already accepted and forwarded `testID` before this range — `git show 8e4540a:.../Card.tsx` has it at
lines 15/22/30, and two other consumers use it (`DataRepairsCard.tsx:57`, `PaydayGuardianCard.tsx:183`). So
no prop was widened and nothing else on `Card` changed.
**Q1.** Purely additive; no style, tone or padding prop touched. ✅
**Q5.** Consumed by `coach-mark-neighbour.spec.ts:36,50` (the geometric non-overlap assertion) and
`spoken-state.spec.ts:47` (the render control). A regression that dropped the testID reds both. ✅

---

## F6 — `ListRow.tsx`: `ink` prop on `SwipeDeleteAction` — **SOUND**

`ListRow.tsx:157` (`ink={c.text.onAccent}`), `:205` (literal removed from the stylesheet),
`:234-263` (prop threaded, applied at `:260`).

**Q1 — prior properties.** `styles.deleteText` keeps `fontWeight: '700', fontSize: 15`; the only removed
declaration is `color`, and it is re-supplied inline at `:260`. `styles.deleteText` has exactly one consumer
(module-local, `:260`), so nothing else lost its colour. The pane's a11y fence
(`tabIndex={-1}` + `a11yHidden(true)`, `:257-258`) and `backgroundColor: fill` are untouched. ✅

**Q2 — theme, both shipping states.** Verified the arithmetic independently against
`apps/rn/src/theme/colors.ts:46,58`:
| | ground `accent.danger` | ink | ratio |
|---|---|---|---|
| light | `#c52222` | `text.onAccent` = `#ffffff` | **5.79:1** — *identical to what shipped* |
| dark | `#fb7185` | `text.onAccent` = `#08111f` | **≈7.4:1** (was `#ffffff` ≈ **2.6:1**) |
Light rendering is byte-identical to before; only dark moves. ✅

**Q6 — would a revert go red?** Yes. `scripts/check-contrast.ts:339` scans
`/\bcolor:\s*'(#[0-9a-fA-F]{3,8}|white|black)'/` over every `.ts`/`.tsx` under `apps/rn/src`
(`check-contrast.ts:36,141-149,174`), so restoring `deleteText: { color: '#ffffff' }` fails
`lint:contrast`, which is registered in `lint:rn` (`package.json:38,42`). ✅
⚠️ The regex is single-quote-only; `color: "#fff"` would slip past it.
⚠️ The pair `text.onAccent on accent.danger` is **not** in `EXTRA_PAIRS`
(`check-contrast.ts:214-221` lists `accent.brand` and the hero/gold pairs only). So the gate catches
*"someone re-typed a literal"* but would not catch *"someone re-tuned `accent.danger`"*.

**Q7 — is the class closed?** The only other swipe pane in the app,
`RequiredActionsCard.tsx:265`, already uses `c.text.onAccent`. No third site.

---

## F7 — `AddRow.tsx:43`: `border.strong` → `border.control` — **SOUND-UNPINNED**

**Q1.** `pressedOpacity`, `styles.row` (dashed, `borderWidth: 1`), the icon and label colours are all
unchanged; only `borderColor` moves. ✅
**Consumers — all eight checked**, since this is a shared primitive: `money.tsx:317, 320, 408, 410, 413,
802, 994` and `living-expenses.tsx:80`. Every one is the same unfilled dashed affordance; none passes a
style override, and `AddRow` exposes no style prop (`AddRow.tsx:13-25`), so the change lands identically on
all eight and cannot be locally overridden. ✅

**The docstring's enumeration is accurate.** I re-counted `border.strong`'s consumers independently:
`more.tsx:317, 323, 343, 352, 360, 396` + `CloudBackupSheet.tsx:86` + `SwitchRow.tsx:15` = **eight Switch
off-tracks**; `OnboardingLayout.tsx:32` = **one step dot**; `AddRow` was the tenth. ✅

**Q2 — visual cost, both themes.** `border.strong` is `rgba(16,38,84,0.18)` light /
`rgba(255,255,255,0.20)` dark; `border.control` is `rgba(16,38,84,0.58)` / `rgba(255,255,255,0.40)`
(`colors.ts:87-88`). That is a 3.2× alpha increase in light. The component's own docstring describes it as
*"a dashed affordance that reads as the last item in a list, not a bolted-on button"* (`AddRow.tsx:9-11`) —
the row is now materially heavier than that sentence describes. This is the intended a11y trade, not a
defect, but the design comment above it now overstates how quiet the row is.

**Q6 — ⚠️ the gate cited in the docstring does not model this site.** `check-contrast.ts:407-410` computes
the control boundary as `composite(border.control, background.secondary)` — i.e. **it assumes the control
has a `background.secondary` fill**. `AddRow` has **no fill at all** (`AddRow.tsx:50-60` sets no
`backgroundColor`), which is the very property the docstring at `AddRow.tsx:34-35` uses to justify the
change. Worse, `check-contrast.ts:413` takes `best = Math.max(border, fillOnly)` — a pass can be carried
entirely by a **fill AddRow does not have**. I computed AddRow's real pixel by hand: the stroke composited
over `background.primary` light (`#e6ebf3`) reads ≈**3.7:1** against that same ground, so the row does clear
3:1 today — but by arithmetic the gate never performed.

**Q5/Q6 — nothing would catch a revert.** `border.strong` is *explicitly excluded* from
`check-contrast.ts` (`:388`, and the exclusion is re-argued at `:392-406`), and the ink-literal check is
scoped to `color:`. Reverting `AddRow.tsx:43` to `c.border.strong` reds **no gate and no test**. The missing
instrument is an assertion that `AddRow`'s rendered border resolves to `border.control` — or a
`check-contrast` case that models a **fill-less** control boundary.

---

## F8 — `SpokenForSheet.tsx:100,166`: `'#fff'` → `text.onAccent` — **SOUND**

**Q1.** `styles.ctaText` keeps `fontWeight: '700'`; `textStyles.body` and the `styles.cta` box are
untouched; `c` is already in scope on the same line (`:99` reads `c.accent.primary`). The `accessibilityLabel`
at `:97` and the `onReserve` handler at `:95` are unchanged. ✅
**Q2 — theme.** Ground is `accent.primary` (`colors.ts:53`), not `accent.brand`. Computed:
light `#ffffff` on `#2b5dd4` = **5.80:1**, and `text.onAccent` light **is** `#ffffff` — so light rendering is
unchanged. Dark `#08111f` on `#5b9dff` = **≈7.0:1**, up from `#fff`'s ≈2.6:1. ✅
**Q6 — pinned?** Yes for the literal: `check-contrast.ts:339` allows 3-digit hex, so a revert to
`color: '#fff'` reds `lint:contrast`. ⚠️ The **pair** `text.onAccent on accent.primary` is not in
`EXTRA_PAIRS` (`check-contrast.ts:214-221` names `accent.brand`), so the ratio itself is unmeasured by the
grid — only "is it a literal" is.

---

## F9 — `SaveFailedBanner.tsx:26-50`: `useLiveAnnouncement` — **DEFECT**

**Q1 — prior properties.** The old `accessibilityLiveRegion="polite"` is not lost: the hook returns both
`accessibilityLiveRegion: 'polite'` and `'aria-live': 'polite'` (`apps/rn/src/utils/a11y.ts:174`). The spread
at `SaveFailedBanner.tsx:50` sits **after** `accessibilityRole="alert"` (`:49`) and contains no `role`, so
nothing is clobbered. `testID`, style and copy unchanged. ✅
**Q4 — hooks order.** `useLiveAnnouncement` is called at `:43`, above `if (!failed) return null` at `:44`.
Correct, and the `failed ? … : null` argument is the primitive's stated contract
(`a11y.ts:164-165`). ✅

**⛔ Q2/Q7 — the defect: on iOS the banner is announced at most ONCE PER APP LAUNCH.**
`useLiveAnnouncement` de-dupes on a ref that is **only ever set, never cleared**:
```
a11y.ts:168-173   const spoken = useRef<string | null>(null);
                  if (!message || message === spoken.current) return;
                  spoken.current = message;  // ← never reset when message goes null
```
`SAVE_FAILED_SPOKEN` is a module constant (`SaveFailedBanner.tsx:26`), and the banner is mounted **once, at
the root, for the app's lifetime** (`apps/rn/src/app/_layout.tsx:345` — outside the `read-failed`/`data-reset`
branches at `:248`/`:262`). The condition it reports is explicitly **transient and recurring**:
`persistenceLifecycle.test.ts:350-354` proves `storageError` goes `'save-failed'` → `null` on the next
successful write. So the sequence *fail → recover → fail again* announces the **first** occurrence only.

On iOS that is total silence for every recurrence, because `accessibilityLiveRegion` is dropped there — the
exact asymmetry this change exists to fix, as `a11y.ts:151-157` and `check-native-a11y-props.ts:115-122`
both state. On web `aria-live` re-announces on DOM re-insertion, so the platform that was already working
stays working and the platform that was broken is fixed only for the first event.

**Q5 — no test.** `grep` finds no reference to `save-failed-banner` anywhere under `apps/rn/tests`. Nothing
exercises the banner at all, let alone a second occurrence.
**Q6 — a revert IS caught, the defect is not.** `scripts/check-native-a11y-props.ts:125-149` reds if any file
other than `apps/rn/src/utils/a11y.ts` writes `accessibilityLiveRegion` by hand, walking
`apps/rn/src` + `apps/rn/tests` (`:22`), registered via `lint:a11y-props` in `lint:rn`
(`package.json:42`). ✅ It is a textual ownership check and cannot see re-announcement behaviour.

---

## F10 — the Swift apostrophe sweep — **SOUND**

⚠️ **Path correction:** the assignment names `apps/rn/app-intents-swift/…`; the files are actually at
`apps/rn/plugins/app-intents-swift/…`. They **were** changed in this range —
`git diff --stat` shows `LogPaymentIntent.swift` (1 line) and `SiriQueryIntents.swift` (4 lines) — so the
"no diff" note in this file's header applies only to the mis-spelled paths.

Changed: `ScanVisionModule.swift:28`, `LogPaymentIntent.swift:82`, `SiriQueryIntents.swift:44,46,60,70`.
All six are `'` → `’` in display/spoken copy.

**Q1.** No control flow, no identifiers, no `phrases:` entry touched. ✅
**Q3/Q7 — the invocation phrases were correctly left alone.** `SiriQueryIntents.swift:108`
(`"What's my debt-free date in \(.applicationName)"`) keeps its straight apostrophe, which matches
`check-apostrophes.ts:198` exempting anything inside a `phrases: [` block on the stated grounds that those
are matched against *speech*, not displayed. I verified all four `phrases:` arrays (`:105, :115, :125, :137`)
are multi-line with the `]` on its own line, so the scan's `inPhrases` state machine
(`check-apostrophes.ts:218-220`) opens and closes correctly rather than latching open for the rest of the file.
**Q6 — does the gate reach these files?** Yes, and this is the interesting half.
`check-apostrophes.ts:35` (`ROOTS`) is TypeScript-only and walks only `.ts`/`.tsx` (`:74`), so it sees **zero**
Swift. The separate `SWIFT_ROOTS` scan (`:186-190`) covers `apps/rn/plugins`, `apps/rn/targets`,
`apps/rn/modules` — which contains all three changed files — walks `.swift` (`:206`) and **exits 1** with no
baseline (`:230-235`). So this class is genuinely red-able now. ✅
⚠️ `apps/rn/ios/App/` is deliberately excluded (`:182-183`), and any future Swift outside those three roots
would be invisible.

**Q7 — the ScanVision string reaches nobody.** `promise.reject("E_UNSUPPORTED", …)` surfaces through
`apps/rn/src/lib/scan.ts:12-15`, whose two callers — `money.tsx:299` and `DebtSheet.tsx:153` — `await
scanStatement()` with **no `try`/`catch`**. A rejection there is an unhandled promise rejection, invisible in
a release build. The copy is correct; it is developer-facing in practice. (Pre-existing, not caused by this
diff, but it means the fix changes nothing a user can perceive.)

---

## F11 — `earlyjourney.spec.ts:32-47`: the third welcome bullet — **WEAK-TEST**

Three new assertions inside `§3.3.6.3 Welcome leads with the Guardian job`, run for both themes.

**What passes.** `earlyjourney.spec.ts:45-46` assert `'Private by design'` and `/never be sold more debt/`
are visible. Both resolve: `WelcomeStep.tsx:32` renders `title={PRIVACY_CLAIM.headline}` and a body built
from `PRIVACY_CLAIM.noSelling`, whose constants are `"Private by design"` and
`"you’ll never be sold more debt"` (`packages/core/copy/vocabulary.ts:111,115`). The render-control concern
is genuinely handled — the two pre-existing `toBeVisible()` assertions at `:29-30` prove the screen is up
before any absence is claimed, which is the correct answer to the *"absence passes before render"* trap. ✅

**⛔ What it claims vs. what it measures.** The docstring at `:41-42` says it *"Asserts the REPLACEMENT is
present AND **the retired promise is absent**."* The second half is not true. The retired promise is quoted
in the source it was removed from:

> `WelcomeStep.tsx:20` — *"This slot used to promise **"Check any purchase against your plan before you
> buy"** — the affordability check, which is PREMIUM"*

The absence assertion is `earlyjourney.spec.ts:47`:

    await expect(page.getByText(/Smart Insights|Forecast|What-If|Strategy Comparison/i)).toHaveCount(0);

**None of those four strings appears in the retired promise.** Restore a fourth `FEATURES` entry whose body
is `Check any purchase against your plan before you buy` and all three new assertions pass: the privacy
bullet is still visible, and the regex matches nothing. The spec measures *"no premium feature is
name-dropped"* — a proxy — where it claims to measure *"this specific premium promise did not come back."*

**The assertion it should make:** `expect(page.getByText(/Check any purchase/i)).toHaveCount(0)`, or an
assertion on the **count** of `FEATURES` rows (3, not 4). `WelcomeStep.tsx:73` keys the rows on `f.title`,
so a row count is reachable through the list container.

⚠️ Also unpinned by construction: `getByText` with an `/i` regex over the whole page would match a header or
tab label if one ever used those words. Harmless on the onboarding route today; stated because the four
terms were chosen without reference to what else renders.

---

## F12 — `hero-date-fit.spec.ts` (new, 80 lines) — **WEAK-TEST**

**Q5 — name the assertion and state what it measures.** `hero-date-fit.spec.ts:70-79` asserts
`scrollHeight <= clientHeight` and `scrollWidth <= clientWidth` on `[data-testid="progress-hero-date"]`, at
402 pt and 320 pt. The control at `:57-58` (`toMatch(/\w+\s+\d{4}/)`) correctly rules out the `—`
placeholder, which would satisfy any overflow check trivially — a real and well-chosen guard. ✅

**What it genuinely catches.** I verified the mechanism the plant relies on in RNW's own source:
`numberOfLines === 1` applies `textOneLine` = `{ whiteSpace: 'nowrap', wordWrap: 'normal', overflow: hidden }`
(`apps/rn/node_modules/react-native-web/dist/exports/Text/index.js:167-172`), so a regression to a single
line produces `scrollWidth > clientWidth` and reds. The docstring's reported plant result is consistent with
that. ✅

**⛔ What it cannot see.** `heroDateFit` is two mechanisms doing two jobs (`progress.tsx:52-57`), and the
harness observes only one:

- `numberOfLines: 2` → RNW emits `-webkit-line-clamp` **plus the base `wordWrap: 'break-word'`**
  (`Text/index.js:158`). On web `September` is broken **mid-word** to fit 104 pt. That is why the unplanted
  320 pt case passes — not because the fix works, but because the browser breaks a word iOS never would.
- `adjustsFontSizeToFit` / `minimumFontScale: 0.7` — the half that actually delivers the 320 pt guarantee on
  device — appear **nowhere** in RNW's forwarded-props list or its `Text` implementation. I grepped both
  files for `adjustsFontSizeToFit`, `minimumFontScale` and `maxFontSizeMultiplier`: **zero hits**. They are
  dropped silently.

So: **delete `adjustsFontSizeToFit` and `minimumFontScale` from `heroDateFit` and this spec stays green in
both cases, while iOS at 320 pt truncates `September` exactly as V2-1 described.** The file's own comment
concedes the gap — `progress.tsx:49-50`: *"adjustsFontSizeToFit is a no-op in react-native-web … the 320 pt
guarantee is an iOS one and is filed as a P6.14 row"* — but the spec's title (*"the hero debt-free date fits
its box at 320pt"*) and its failure message (*"the app's headline number is cut off"*) both read as if the
device guarantee were being held.

⚠️ **The vertical assertion has no demonstrated plant.** The quoted plant output is the *horizontal* message.
`textMultiLine` sets `overflow: 'clip'` (`Text/index.js:177-183`), not `hidden`, and I could not determine by
reading alone whether Chromium reports `scrollHeight > clientHeight` under `overflow: clip` +
`-webkit-line-clamp`. If it does not, `:70-75` is an assertion that can never fail. Running it was out of
scope for this pass.

**Q2 — fixture correctness.** `day()` (`helpers/seed.ts:70-79`) builds local calendar dates rather than a UTC
slice, with the east-of-UTC rationale written out; nothing in this spec round-trips a date through UTC. ✅
The spec asserts a *property*, not a date string, so it does not rot with the calendar. ✅

⚠️ `test.use({ viewport: 402x874 })` at `:33` is immediately overridden by `page.setViewportSize` at `:50` in
both iterations, so the module-level `test.use` is dead configuration.

---

## F14 — `spoken-state.spec.ts` (new, 68 lines) — **SOUND**

**Q5 — would it have failed on its defect?** The defect was the cushion column speaking `cushionStatus`. The
label is built at `CashFlowSection.tsx:151` as
`"{date}: {net} of room, GUARDIAN_STATE_LABEL[cycle.guardianState]"`, and `GUARDIAN_STATE_LABEL` is
`{ clear: "Clear", tight: "Tight", "at-risk": "Very tight" }` (`packages/core/copy/vocabulary.ts:150-154`).
Against the regressed form:

- `cushionStatus === 'stable'` → `ENGINE_TOKENS` (`spoken-state.spec.ts:29`) contains `'stable'` → red. ✅
- `'pressure'` → in `ENGINE_TOKENS` → red. ✅
- `'tight'` → **not** in `ENGINE_TOKENS`; caught instead by the positive half at `:59-62`, because
  `'…, tight'` contains neither `'Tight'` nor `'Very tight'` nor `'Clear'`. **Case-sensitivity is the only
  thing catching this branch** — load-bearing and undeclared.

The seeded fixture (`:31-40`: 2000/month, the helper's default `DEBT` 5000 and `BILL` 350, `cushionFloor: 200`)
exercises one state, so the run leans on the `'stable'`/`ENGINE_TOKENS` path. It would still have failed on
the shipped defect. ✅

**Q5 — the controls are real.** `:47` proves the card rendered before any absence is asserted, and `:52`
(`labels.length > 0`) proves the columns carry labels at all — without it, iterating an empty array makes
every inner assertion vacuous. Both are the right guards. ✅

**Q2 — asserts on the rendered `aria-label`**, via `page.locator('[aria-label]').evaluateAll` (`:49-51`),
which is what RNW emits for `accessibilityLabel`. It tests the node, not the source. ✅
⚠️ It is therefore a **web-only** proof; the same `accessibilityLabel` on iOS is not exercised. The string is
computed identically on both platforms, so this is a reasonable proxy — stated, not counted against it.

**Q2 — no timezone hazard.** `shortDate` (`CashFlowSection.tsx:49-51`) parses `` `${iso}T00:00:00` `` with no
`Z`, i.e. as a **local** date — correct east of UTC. Nothing in the label round-trips through UTC. ✅

**Q7 — the filter is `l.includes('of room')`** (`:50`). That couples the spec to three literal words inside a
label it does not otherwise assert. If the copy becomes `"$420 of headroom"`, `labels` goes empty and `:52`
reds loudly rather than passing silently — the correct failure direction. ✅ Checked for collisions: the
legend at `CashFlowSection.tsx:122` reads *"room after each paycheck"*, is a `Text` not an `aria-label`, and
does not contain the substring.

**Unpinned residue:** the spec hand-copies `SPOKEN_LABELS` (`:32`) instead of importing
`GUARDIAN_STATE_LABEL`. A fourth guardian state would not red this spec; it would go unnoticed until a cycle
actually landed in it. The two lists can drift — which is the same class the gate it replaces was built for.

---

## Tally

| verdict | count | hunk-groups |
|---|---|---|
| `SOUND` | 8 | F2, F3, F4, F5, F6, F8, F10, F14 |
| `SOUND-UNPINNED` | 1 | F7 |
| `DEFECT` | 2 | F1, F9 |
| `WEAK-TEST` | 2 | F11, F12 |
| `REGRESSION` | 0 | — |
| `DEAD` | 0 | — |
| `UNREACHABLE-GATE` | 0 | — |

Thirteen hunk-groups over ten changed files. (Section numbering runs F1–F14 with no F13 — F13 was folded
into F12 while writing; no hunk-group is missing.)

## In severity order

1. **F1 · `DEFECT` · `progress.tsx:129-140`** — the scroll host deregisters on **unmount**, but tab screens
   never unmount (`use-coach-mark.ts:42-43`, no `unmountOnBlur` in `(tabs)/_layout.tsx`). A backgrounded
   Progress stays the registered host, so a coach mark on Money or in a sheet gets `true` from
   `requestReveal` (`tutorialTargets.tsx:179-183`), silently scrolls the invisible Progress list, and latches
   `revealAskedFor` (`CoachMarkLayer.tsx:152`). This is the exact hazard the change's own comment at
   `progress.tsx:138` claims to close. Fix: `useIsFocused()`, the pattern already used at
   `use-coach-mark.ts:60-65`. Nothing in the repo would notice.
2. **F9 · `DEFECT` · `SaveFailedBanner.tsx:43` + `utils/a11y.ts:168-173`** — `useLiveAnnouncement` de-dupes on
   a ref that is set and never cleared, and the banner is mounted for the app's lifetime
   (`_layout.tsx:345`). `storageError` is proven transient and recurring
   (`persistenceLifecycle.test.ts:350-354`), so **only the first save failure per launch is announced**. On
   iOS every later one is silent, which is the platform this change exists to fix. No test touches the
   banner at all.
3. **F11 · `WEAK-TEST` · `earlyjourney.spec.ts:47`** — claims to assert the retired premium promise is
   absent; the regex `/Smart Insights|Forecast|What-If|Strategy Comparison/i` does not contain any word of
   `"Check any purchase against your plan before you buy"` (`WelcomeStep.tsx:20`). Re-adding that bullet
   passes all three new assertions.
4. **F12 · `WEAK-TEST` · `hero-date-fit.spec.ts:70-79`** — reds on `numberOfLines: 1`, but the 320 pt
   guarantee it names belongs to `adjustsFontSizeToFit`/`minimumFontScale`, which react-native-web drops
   entirely (grepped: zero hits in `forwardedProps` and `Text`). Removing both leaves the spec green while
   iOS truncates. Its vertical assertion has no demonstrated plant and may be unfailable under
   `overflow: clip`.
5. **F7 · `SOUND-UNPINNED` · `AddRow.tsx:43`** — correct change, but nothing reds on a revert:
   `border.strong` is explicitly excluded from `check-contrast.ts:388`, and the ink-literal check is scoped
   to `color:`. Separately, `check-contrast.ts:407-413` models the control boundary as
   `border.control` over a `background.secondary` **fill** and takes `max(border, fillOnly)` — a model
   `AddRow` does not fit, since it has no fill. Hand-computed, the real pixel clears 3:1 (≈3.7:1 in light),
   but by arithmetic the gate never performed.
6. **F4 (residue)** — moving `TutorialTarget` inside `TrajectoryChart` shrank the box behind
   `testID="tutorial-target-trajectory-scrub"` from the whole card to the scrub surface. Four consumers read
   geometry from it: `coach-marks.spec.ts:127` (rewritten in the same range, survives),
   `probe-mark-ipad-rail.spec.ts:32`, `probe-mark-route-push.spec.ts:31`, `phase35-themes.shot.ts:123-127`.
   The last three report rather than assert, so they print different numbers with no signal.
7. **F10 (residue)** — `ScanVisionModule.swift:28`'s corrected string is unreachable in practice: both
   callers of `scanStatement()` (`money.tsx:299`, `DebtSheet.tsx:153`) await it with no `try`/`catch`, so an
   `E_UNSUPPORTED` rejection is an unhandled promise rejection. Pre-existing, not introduced here.
8. **F2 (residue)** — `progress.tsx:222` hard-codes `invalidate('trajectory-scrub')` in a scroll handler that
   has no idea which subject is being coached. A no-op today; a coupling for later.

## Assignment corrections

- `apps/rn/app-intents-swift/LogPaymentIntent.swift` and `.../SiriQueryIntents.swift` do not exist at those
  paths. The real files are `apps/rn/plugins/app-intents-swift/…` and **were** changed in this range
  (1 and 4 lines). Judged in F10.
