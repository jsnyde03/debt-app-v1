# V4 — STATE COVERAGE

> Lens V4 of the P6.8 pre-release audit. Target `2.0.0`, branch `v1.7-dev`, commit `dd80f70`.
> Reads `apps/rn/capture-ref/p6.8/phone/<theme>/state-<surface>-<state>.png`, then goes past the
> frames into the source for states the matrix could not seed.
>
> **Status: IN PROGRESS** — appended incrementally as frames are read.

## Method

1. Read every `state-*` frame in both themes (32 frames), light/dark paired.
2. Compare each state against its default-seed sibling (`today.png`, `money-debts.png`, …) to
   tell "this state has no design" from "this surface looks like that anyway".
3. Then read source: `EmptyState.tsx` and every call site, `StorageErrorScreen`, loading/error
   paths, subscription states — asking which states have **no rendering path at all**.

---

## Findings

### V4-1
**Severity:** major
**Surface/State:** Today · many (12 debts / 14 bills) · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-many.png`, `apps/rn/capture-ref/p6.8/phone/dark/state-today-many.png`
**Finding:** The Payday Guardian **"COVER NOW"** block has no `many` design — it renders every item as one uncapped middot-joined run-on string, 23 names long in this seed, with no count, no truncation and no "+N more".
**Evidence:** The light frame reads literally: `Bill 1 · Bill 2 · Bill 3 · Bill 4 · Bill 5 · Bill 6 · Bill 7 · Bill 8 · Bill 9 · Bill 10 · Bill 11 · Bill 12 · Creditor 1 · Creditor 2 · Creditor 3 · Creditor 4 · Creditor 5 · Creditor 6 · Creditor 7 · Creditor 8 · Creditor 9 · Creditor 10 · Creditor 11 — $2,658` — four wrapped lines of a single grey paragraph, in the app's most load-bearing card, on the screen a shortfall user lands on. At `single` the same block does not appear at all, so this is the **only** rendering the list has and it was designed for a handful of names. With real creditor names (see V4-4) each entry is 3–5× longer, so the same block becomes a full screen of text. ⚠️ This is also the "grouped rows collapse into one unreadable string" case A1 is hunting, but it is visible without a screen reader.
**Confidence:** high

### V4-2
**Severity:** minor
**Surface/State:** Today · many · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-many.png`
**Finding:** In the shortfall (`many`) state the hero progress bar is rendered **100% full and green** directly above amber "Short this paycheck" and a red Guardian "This paycheck won't cover everything".
**Evidence:** Three signals stacked vertically disagree: a completely-filled green bar, then `⚠ Short this paycheck · debt-free by April 2034` in amber, then a red shield and `Cushion $0`. Green-full is the app's success colour everywhere else; here it appears to mean "required has consumed the whole paycheck", which is the worst outcome rendered in the best colour. Compare `single`, where the same bar is a thin green sliver on an "On track" paycheck — the bar therefore means the opposite thing in the two states.
**Confidence:** medium *(the bar's semantics are not labelled in the frame; refuter should read the hero-bar component to confirm it is fill-of-required rather than a Guardian signal)*

### V4-3
**Severity:** minor
**Surface/State:** Today · huge · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-huge.png`
**Finding:** Two adjacent cards give opposite verdicts in the same state — the hero says `⚠ Overdue payments need attention` (red) and the Payday Guardian card immediately below says `Looks clear this paycheck` (shield, calm).
**Evidence:** Light `huge` frame, cards 1 and 2, no scroll between them. Guardian's band is computed from cushion-vs-flexible and evidently does not consider overdue items at all, so the app's central signal reports "clear" over the top of an explicit red alert. The `huge` seed sets only `paycheck` and `debts`, so the default scenario's expenses persist and are what turn overdue — the contradiction is nonetheless a real rendering of a reachable state.
**Confidence:** medium *(seed-derived overdue; the contradiction is real but the refuter should confirm Guardian's band ignores overdue in the band calculator rather than in this seed only)*

### V4-4
**Severity:** minor
**Surface/State:** Money → Debts · long-names · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-money-debts-long-names.png`, `dark/state-money-debts-long-names.png`
**Finding:** Debt rows truncate to a single line at ~28 characters, cutting exactly the qualifier that disambiguates two otherwise identical accounts.
**Evidence:** `Chase Sapphire Preferred C…` and `Navient Federal Consolidat…`. The seeded names are `Chase Sapphire Preferred Card — Authorized User` and `Navient Federal Consolidation Loan Group B`; the dropped tails (`— Authorized User`, `Group B`) are the whole point of the name. A user with both their own card and an authorized-user card sees two rows reading `Chase Sapphire Preferred C…`, distinguishable only by balance. The row has vertical room — the amount sits on its own baseline and the `Focus` pill already wraps to a second line here — so this is a 1-line clamp, not a space shortage.
**Confidence:** high

### V4-5
**Severity:** minor
**Surface/State:** Today · long-names · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-long-names.png`
**Finding:** The Guardian's advice sentence interpolates the full, unbounded debt name inline, so a long name reflows the app's primary recommendation into a 3-line paragraph — while the hero line 20 px above truncates the *same* name.
**Evidence:** `Apply the spare $955 toward Chase Sapphire Preferred Card — Authorized User when you're ready — your $200 cushion stays protected either way.` versus, in the hero, `Suggested · $955 · Extra payment to Chase Sapphire Pre…`. Same name, two policies, on one screen. The sentence has no truncation at all, so name length maps 1:1 onto card height.
**Confidence:** high

### V4-6
**Severity:** minor
**Surface/State:** Money → Debts · many · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-money-debts-many.png`
**Finding:** At 12 debts the only add-affordance on the screen (`+ Add`, which sits *below* the list) is pushed off-screen — the header carries no `+`, so adding a 13th debt requires scrolling past all twelve first.
**Evidence:** At `single` and `huge` the `+ Add` and `Scan a statement` buttons are visible at rest below the one row. At `many` the viewport ends mid-`Creditor 5` behind the tab bar, and the header shows only `•••`. The affordance is not lost, but it moves from "always visible" to "seven rows of scrolling away" precisely as the list gets long enough that you would want it.
**Confidence:** high

### V4-7
**Severity:** major
**Surface/State:** Progress · huge (and any payoff month with a long name) · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-progress-huge.png`, `dark/state-progress-huge.png`
**Finding:** The Progress hero's debt-free date — the single headline of the screen — **truncates its year away**: `November 2…`.
**Evidence:** Both themes, identical. `huge` renders `DEBT-FREE / November 2…`, while `many` renders `April 2034` intact and `single` renders `September 2…`. So the clamp is on **string length, not on the state** — it is ~11 characters, and it bites *four* of twelve month names at a 4-digit year (`September 2028`, `November 2028`, `December 2028`, `February 2028` all exceed it; `single`'s `September 2…` proves it independently of the `huge` seed). A third of all users lose the year on the number the whole screen exists to deliver, and there is no smaller-font fallback — the `many` frame shows the same type size, so nothing is auto-shrinking.
**Confidence:** high

### V4-8
**Severity:** major
**Surface/State:** Progress (all states) · **loading** — the state the matrix seeded by accident · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-progress-huge.png`, `light/state-progress-single.png`, `light/progress.png` vs `dark/state-progress-huge.png`, `dark/state-progress-single.png`
**Finding:** While CanvasKit loads on web, every Skia chart falls back to `ChartSkeleton` — but its **surrounding labels, axis ticks and milestone pill render at full fidelity on top of it**, so the loading state does not read as "loading", it reads as **a chart that failed**.
**Evidence:** Four of eight light Progress frames caught this. `light/state-progress-huge.png` shows a complete y-axis (`$900k … $0`), both year ticks (`2027`, `2028`) and the gold `Nov 2028` milestone pill — over **four evenly-spaced generic lines and no curve at all**. The four lines are `ChartSkeleton`'s literal `{[0,1,2,3].map(...)}` (`apps/rn/src/components/ui/ChartSkeleton.tsx:24`), not the chart's own gridlines: the real chart in `dark/state-progress-huge.png` draws ten gridlines aligned to its ten labels plus a full blue curve. `TrajectoryChart.tsx:307` gates the labels/ticks/pill on `w > 0 && activePath` — which is already true while the 8 MB wasm is still downloading (`TrajectoryCanvas.web.tsx`), so the labelled frame and the empty canvas are shown together by construction. `ChartSkeleton`'s own doc-comment says it exists *"so a chart card never flashes empty"*; it flashes **labelled-and-empty**, which is worse. ⚠️ Native compiles Skia in, so this is a **web-surface** defect — but web is the marketing embed and the Pages build, both shipped.
**Confidence:** high

### V4-9
**Severity:** major
**Surface/State:** Progress · loading, **light theme only** · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-progress-single.png`, `light/progress.png` (compare `dark/state-progress-single.png`)
**Finding:** The journey-ring loading skeleton is **completely invisible in light theme** — `0% paid` floats in an empty navy void with no ring, no placeholder, nothing.
**Evidence:** `ChartSkeleton shape="ring"` paints `borderColor: c.border.subtle` (`ChartSkeleton.tsx:19,24`), and light `border.subtle` is `rgba(16,38,84,0.06)` (`apps/rn/src/theme/colors.ts:69`) — 6% navy. The Progress hero card is **dark navy in both themes**, so in light mode the skeleton is 6% navy on navy: zero contrast. Dark's `rgba(255,255,255,0.08)` is faintly visible on the same card, which is why only the light frames show the void. The skeleton takes its tint from the *app* theme while the surface it sits on ignores the app theme — the two disagree by construction, and only one direction fails. ⭐ **This is a state × theme interaction, which is why it sits here and not in V1: it is unreachable in any resting frame.**
**Confidence:** high

### V4-10
**Severity:** minor
**Surface/State:** Progress · huge · **Frames:** `apps/rn/capture-ref/p6.8/phone/dark/state-progress-huge.png`
**Finding:** The trajectory chart's y-axis tick generator produces **ten labels** at a six-figure balance, stacked ~10 px apart and touching.
**Evidence:** `$900k · $800k · $700k · $600k · $500k · $400k · $300k · $200k · $100k · $0` down a 175 px plot. Compare `many` ($40k / $20k / $0 — three) and `single` ($2k / $1k / $0). `niceStep(rawMax)` evidently caps the step rather than the label count, so the denser the money the denser the axis. Nothing overlaps *illegibly* at default type, but at any text scale it will, and the gridlines behind them are already a solid grey wash.
**Confidence:** high

### V4-11
**Severity:** major
**Surface/State:** Today · loading (all seeds) · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-today-huge.png`, `light/state-today-many.png`, `light/state-today-empty.png` (compare the dark twin of each)
**Finding:** The same CanvasKit fallback lands on **Today's Payday Guardian allocation bar**, where four stray hairlines sit directly under the app's central verdict and read as a rendering artifact, not as loading.
**Evidence:** Cropped side-by-side at `y≈440`: dark renders a proper blue/grey split bar with the line marker; light renders **four evenly-spaced 1 px rules stacked ~4 px apart**, which is `ChartSkeleton`'s rect shape at a bar's height. In both frames the legend beneath (`▬ Cushion  ▬ To debt`, `$200`, `$13,738`, `$200 · Your line`) is fully painted, so the card asserts a split it is not drawing. ⚠️ At a bar-height container the skeleton's `justifyContent: 'space-between'` collapses its four lines into what any reader would call a mistake — the shape it "evokes at rest" is a divider stack, not a bar. Affects `CushionBarCanvas`, `AllocationBarCanvas`, `CashRunwayCanvas` identically (all four `.web.tsx` canvases share the fallback).
**Confidence:** high

### V4-12
**Severity:** minor
**Surface/State:** Today · empty (brand-new user) · **Frames:** `apps/rn/capture-ref/p6.8/phone/dark/state-today-empty.png` (light twin is a cold-start artifact — see *What I could not judge*)
**Finding:** For a user with **no debts, no bills and no goals**, Today has no empty design at all — it renders the full production layout and reports `Looks clear this paycheck` with a `$2,000` cushion, with nothing on screen inviting the user to add anything.
**Evidence:** The dark `empty` frame is layout-identical to `single` and `long-names`: paycheck hero (`$958`, `0 Flexible / $2,000`, `✓ On track`), then Payday Guardian (`Looks clear this paycheck`, `Cushion $2,000`, `Adjust your line →`, `How this works`, `See your forecast →`). The only affordance is `⊕ Add extra income` — there is no "add a debt", no "add a bill". Every *other* surface has a real first-run design (Money: *Start your debt-free plan* + `Add`; Progress: *Your payoff journey starts here* + `Add a debt`; Living: *No spending items yet*; History: a correct no-action message), which makes Today the outlier rather than the convention. ⚠️ The Guardian's "clear" verdict is technically true and structurally misleading: it is clear because nothing has been entered.
**Confidence:** medium *(the frame is cut at the fold; a third card begins at the bottom edge and could carry a setup prompt. A refuter should scroll Today under the `empty` seed before this is treated as settled — but nothing above the fold prompts entry, and the fold is what a first-run user judges.)*

### V4-13
**Severity:** minor
**Surface/State:** Money → Debts · **all debts cleared** — ⛔ **not in the matrix** · **Frames:** none exist
**Finding:** The app's terminal success state puts a **21-character sentence into a hero slot that is `numberOfLines={1}` at 34 pt/800** — `Every balance cleared` will clip on a narrow phone and clips on every phone at raised type.
**Evidence:** `apps/rn/src/app/(tabs)/money.tsx:347` renders `<MoneyHero value="Every balance cleared" …>`; `MoneyHero` (`:997`) is `<Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.heroNum}>`, and `heroNum` is `{ fontSize: 34, fontWeight: '800', letterSpacing: -0.5, fontVariant: ['tabular-nums'] }` (`:1033`). Measured against the frames: `$847,363` (8 tabular glyphs) spans ~150 px of the 362 px content width in `state-money-debts-huge.png`, so the slot comfortably holds ~8–9 wide glyphs; 21 mixed-case characters lands at roughly 340 px — inside 402 pt, **outside** the 320 pt `phone-small` width the matrix shoots every route at, and outside both at `maxFontSizeMultiplier: 1.3`. ⚠️ This is the payoff moment the whole product is aimed at, it is the one hero that carries prose rather than a number, and **no frame of it exists in the matrix** — `STATES` has no `cleared` entry (`p6.8-matrix.shot.ts`), and the `empty` seed cannot reach it because `allCleared` requires `debts` to be non-empty with `balance <= 0` (`money.tsx:343`).
**Confidence:** medium *(inferred from source + measured glyph widths in an adjacent frame, not from a frame of this state — which is itself the finding. A refuter should seed one cleared debt and shoot it.)*

### V4-14
**Severity:** minor
**Surface/State:** History · empty · **Frames:** `apps/rn/capture-ref/p6.8/phone/light/state-history-empty.png`, `dark/state-history-empty.png`
**Finding:** `EmptyState` makes `title`, `cta` and `onCta` **required**, so the one surface with nothing for the user to do forked its own copy — and History's empty card is the only one in the app with **no title**.
**Evidence:** `apps/rn/src/components/ui/EmptyState.tsx:11–23` — all three props non-optional. `apps/rn/src/app/history.tsx:59` defines a private `EmptyHistory()` that re-implements the same `Card` + 64 px tinted icon tile + centred text, minus the title and the button. The frame shows the result: Money, Progress and Living all lead with a bold title (`Start your debt-free plan`, `Your payoff journey starts here`, `No spending items yet`), while History opens with a grey `subhead` paragraph and no heading at all. The design-system component cannot express "empty, and correctly nothing to do", so the one place that needs it is off-system.
**Confidence:** high

### V4-15
**Severity:** minor
**Surface/State:** app-wide · **lapsed subscription** — ⛔ **no rendering path at all** · **Frames:** none possible
**Finding:** `SubscriptionPlan` is `'free' | 'premium'` with **no expired / grace / billing-retry member**, so an expiring subscription silently flips the store to `free` mid-session and premium surfaces swap to upsell cards with **no notice that anything ended**.
**Evidence:** `apps/rn/src/data/models.ts:47` — `export type SubscriptionPlan = 'free' | 'premium';`. `apps/rn/src/premium/premiumSync.ts:53` registers `client.addListener((info) => apply(info))`, and `apply` calls `setSubscriptionPlan(isPremiumActive(info) ? 'premium' : 'free')` — its own comment names expiry as one of the events it handles. Nothing anywhere renders the transition: grepping the tree for `expired`/`lapsed`/`grace`/`billingRetry` returns only comments. The *degradation* is handled well — `cushion-forecast.tsx:50` deliberately renders a premium `EmptyState` rather than a dead screen, and its comment even names "a lapsed or unresolved entitlement" as the case — so the gap is precisely the **explanation**, not the layout: a paying user watching the screen sees their forecast become a sales pitch with no sentence saying why.
**Confidence:** high *(the absence is verifiable by grep; the severity call is a scope question for 🎯, and M3 owns the recovery path)*

### V4-16
**Severity:** polish
**Surface/State:** app-wide · **hydrate**, on web · **Frames:** none
**Finding:** `if (!isHydrated) return null;` renders the entire app as a blank page until the store resolves — covered by the splash on native, covered by **nothing** on web.
**Evidence:** `apps/rn/src/app/_layout.tsx:234`, whose own comment scopes the mitigation: *"On native the splash still covers this."* The Pages build and the marketing embed have no splash, so a slow hydrate is an untimed blank screen — and V4-8/V4-11 show that web's other boot cost (8 MB of CanvasKit) is already slow enough to be caught in 4 of 8 light captures at a 700 ms settle.
**Confidence:** medium *(no frame — the matrix's own 700 ms settle is longer than hydrate takes locally; the exposure is real but its duration on a cold CDN fetch is unmeasured)*

### V4-17
**Severity:** minor
**Surface/State:** the matrix itself · **Frames:** `apps/rn/capture-ref/p6.8/phone/{light,dark}/state-*.png` (16 per theme)
**Finding:** ⚠️ **`matrix/README.md` overstates the state grid to the four lenses that read it.** It says *"empty · single · many · huge · long-names, on Today/Money/Progress/History/Living"* — which reads as 25 combinations — while the shot spec seeds **16**, and the count column (`32`) is the only place the shortfall is visible.
**Evidence:** `p6.8-matrix.shot.ts` → `SURFACES`: Today and Money get all five states; **Progress gets four (no `long-names`)**; **History and Living-expenses get `empty` only**. So `state-progress-long-names`, `state-history-{single,many,huge,long-names}` and `state-living-expenses-{single,many,huge,long-names}` do not exist and never failed — they were never requested, so the spec's own `⛔ UNREACHED` guard, which exists precisely so the matrix reports its holes, **cannot see them**. The instrument's honesty mechanism covers reachability, not intent. ⭐ Progress's missing `long-names` is the costly one: the trajectory chart paints debt **names** onto the plot (`TrajectoryChart.tsx:355`, `numberOfLines={1}`, positioned `left: wp.x - 40` with a 48 px collision skip), so long creditor names on the chart are the exact case nothing has ever rendered.
**Confidence:** high

---

## What I could not judge

- **`light/state-today-empty.png` is unusable — a cold-start artifact, not a design.** It caught Today's entrance animation mid-fade (the paycheck card at ~15% opacity) with nothing below it mounted, at ~21 KB against its dark twin's ~92 KB. It is the **first** seed+goto in the `states (light)` test, so it paid the cold-start cost. ⛔ Any lens reading it will report a blank Today; it is not one. V4-12 is judged from the dark twin instead.
- **Everything below the fold.** `shot()` passes `fullPage: false`, so every state frame stops at 874 px. On Today a third card begins at the bottom edge in every seed and is never seen; on Money `many` the list is cut at row 5 of 12. Findings here are about **the fold**, which is defensible for a first-impression lens and useless for "does the last row clear the tab bar" — I answered that from source instead (`contentContainerStyle: { paddingBottom: insets.bottom + spacing.huge }`, `money.tsx:378`, so it does).
- **Whether the CanvasKit fallback (V4-8/9/11) is ever visible on a real iPhone.** Native compiles Skia in, so the `.web.tsx` canvases are not on the device path at all. The defect is real on the Pages build and the marketing embed; **its severity on iOS is zero and I am not claiming otherwise.** A refuter should not "disprove" it by pointing at the device.
- **Whether Today's `empty` state has a setup prompt below the fold** (V4-12's stated caveat).
- **Seed drift between the two themes.** The same state renders different money in light and dark — Today `empty` is `$959` vs `$958`, `many` is `$1,809` vs `$2,000`. Something in the seed is clock-dependent across a multi-minute run. It did not affect any finding here, but it means **light and dark state frames are not strictly comparable**, which matters more to V1 than to me.
- **`huge`'s overdue condition** (V4-3) — the seed leaves the default expenses in place, so I cannot separate "Guardian ignores overdue" from "this seed happened to make old bills overdue" without reading the band calculator, which is A1/W1 territory.

---

## States that exist in code but were not in the matrix

⭐ **This list is itself the deliverable.** Each row is a state with a rendering path in the tree and **zero frames** in any theme, viewport or seed.

**Whole surfaces never seeded at all**

| state | where it lives | why it matters |
|---|---|---|
| **Money → Expenses tab**, every state | `money.tsx:659` (`EmptyState`) + the reserve hero, `LivingReserve`, the breakdown sheet | `/money` always lands on **Debts**, so *two of three Money tabs have no state frames in the matrix* — not empty, not many, not long-names, in either theme |
| **Money → Goals tab**, every state | `money.tsx:924` + the goals list, `HeroProgressBar`, per-goal progress | same cause; includes the funded / over-target case |
| **Money → Debts · all cleared** | `money.tsx:343` `allCleared` + the `PAID OFF` section | the product's **terminal success state**. See V4-13 |
| **History with rows** | `history.tsx:73` `HistoryRowCard` | only `empty` was seeded; the populated screen — and `many` cycles — has never been shot |
| **Living expenses with items** | `living-expenses.tsx:45` | only `empty` was seeded |
| **Progress · long-names** | `TrajectoryChart.tsx:355` waypoint labels, `PaidOffArchive` | see V4-17 — debt names are *painted onto the chart* and no frame has ever carried a long one |
| **`/demo` · `/tutorial` · `/schedule/[id]`** | `apps/rn/src/app/` | three real routes absent from `SURFACES` entirely — no theme sweep, no size class, no state |

**Non-data states — the ones a seed cannot reach**

| state | rendering path | status |
|---|---|---|
| **Storage read-failed** | `StorageErrorScreen.tsx` (`_layout.tsx:219`) | ✅ has a design, ⛔ **never framed** — and its own comment calls it *"the one screen whose absence is invisible in every test"* |
| **Save-failed** | `SaveFailedBanner.tsx` (`_layout.tsx:305`) | ✅ has a design, ⛔ never framed |
| **App lock — locked / authing** | `AppLockGate.tsx` `LockOverlay` | ✅ has a design, ⛔ never framed |
| **App lock — unlock FAILED** | — | ⛔ **no rendering path.** `use-app-lock.ts:22` does `.then((ok) => { if (ok) setIsLocked(false); })` — a `false` result is silently discarded and the overlay reverts to `Unlock` with no message. (No `.catch` either; `.finally` still clears `authing`, so it does not hang.) |
| **CanvasKit loading (web)** | `ChartSkeleton.tsx` via 5 `*Canvas.web.tsx` | ✅ has a path, ⛔ never framed **deliberately** — 4 light frames caught it by accident, which is how V4-8/9/11 were found at all |
| **Hydrating** | `_layout.tsx:234` → `return null` | ⛔ **no design.** Splash covers it on native; nothing covers it on web |
| **Lapsed / expired subscription** | — | ⛔ **no state in the type.** See V4-15 |
| **Restore-from-iCloud offer** | `_layout.tsx:196` `notify(...)` | a native **Alert** — outside what Playwright can frame at all, and it fires on exactly the first-launch path O1 owns |
| **Cloud backup: `unavailable` / `loading` / `busy` / restore-confirm** | `CloudBackupSheet.tsx:64,78,87,111` | ✅ four distinct designs, ⛔ only the resting sheet was framed |
| **Paywall: already-premium · `purchasing` · `Restoring…`** | `paywall.tsx:114,135,170,368` | ⛔ only `free`-at-rest was framed |
| **Onboarding past step 1** | `onboarding.tsx` | one frame, one step |
| **Guardian band `tight`** | `guardianSelectors.ts:397` | the frames carry `clear` and the shortfall band only; the middle band — the one the whole three-band vocabulary hinges on — was never seeded |
| **`RecoveryPlanSection` with a long `safeToDefer` list** | `RecoveryPlanSection.tsx:78` — an **uncapped `.map`** of checkbox rows | the `many` seed produced `safeToDefer.length === 0`, so the list has never rendered at scale. Same uncapped shape as the `COVER NOW` string in V4-1, and it renders *rows*, not text |
| **`log-payment` · `living-expense-sheet`** | — | declared `⛔ UNREACHED` by the matrix itself; see `matrix/README.md` hole 1 |

---

**V4 complete.** 17 findings: 0 blocker · 5 major · 11 minor · 1 polish.

The three nobody was assigned to look for: **V4-8/9/11** — the loading state, found only because half the light captures were slower than the 700 ms settle; **V4-7** — a headline date that loses its year for a third of all months, identical in both themes and reproduced in two independent seeds; **V4-1** — an uncapped name list in the app's central card.
