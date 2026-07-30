# R3-01 — A11y + Premium-Bar (ROUND 3, consensus-confirming pass)

Lens: verify the round-2 a11y fixes (`9a59f85`) genuinely resolve R2-A1/A2/A4/A5/A6/C1 + R2-W-01, and hunt NEW a11y/premium regressions from the round-2 changes. Verified against actual code on `v1.7-dev`, the `9a59f85` diff, and the FRESH screenshots (Jul 30 11:43) in `test-results/`.

## VERDICT: FINDINGS: 2

Both LOW. **All five round-2 verification targets are VERIFIED FIXED.** The two findings are residuals on the beat card — one is the un-applied half of the R2-A1 prescription (newly *exposed* by the fix, not caused by it), one pre-existing AX gap surfaced by this confirming pass. Neither blocks closeout; both are one-file, beat-local polish.

---

## Round-2 fixes VERIFIED (re-derived against code + pixels, not taken on faith)

### 1. R2-A1 (was HIGH) — beat backdrop `accessible={false}` — **FIXED, mechanism confirmed correct**
`VanquishedBeat.tsx:100`. In RN, descendant-collapsing is triggered by `accessible={true}` on a container (it becomes the accessibility element and suppresses children); `accessible={false}` removes the Pressable from the a11y tree entirely and **does NOT group descendants** — children are exposed individually. So the **Share** (`:128`) and **Keep going** (`:129`) Buttons (each `accessibilityRole="button"` via `Button.tsx:55`) are now individually VoiceOver-focusable, and VO users have a labeled dismiss path ("Keep going"). Touch dismiss intact: `accessible` never affects hit-testing — the backdrop keeps `onPress={onDismiss}`, and the card's `pointerEvents="box-none"` (`:101`) lets non-button card taps fall through to the backdrop, exactly the prior touch behavior. Card NOT unreadable: eyebrow / "Vanquished" / amount / cascade are ordinary Texts, each now individually reachable (see R3-A1 for the naturalness residual). The finale ring-center texts are not orphaned (their group carries "$0 balance"). On iOS (shipping surface) the gold check is `SymbolView` (`AppIcon.ios.tsx:21`) — a native image view, not an accessibility element, so no junk VO stop.

### 2. R2-A2 — Switch labels — **FIXED everywhere; zero nameless Switches remain**
`SwitchRow.tsx:15` now `accessibilityLabel={label}` → propagates to ALL six consumers: DebtSheet "Autopay" (`:240`), ExpenseSheet "Variable amount (estimate)"/"Free trial or intro price"/"Autopay" (`:101,102,109`), LivingExpenseSheet "Count toward my reserve" (`:59`), PaycheckSheet "This paycheck didn't arrive" (`:121`). Repo-wide grep for `<Switch`: the ONLY raw `<Switch>`es are the six in `more.tsx` — Notifications (`:163`), App Lock (`:169`), I have savings elsewhere (`:175`), Payday countdown (`:184`), Debt-free sound (`:192`), and the dev **Simulate Premium** (`:224`, R2-A4 fixed) — all carry `accessibilityLabel`s matching their row titles. No Switch anywhere is nameless.

### 3. R2-W-01 — `aria-hidden` on the off-screen ShareCard wrappers — **FIXED, all three, valid prop**
Present on all three capture wrappers: finale `PaidOffFinale.tsx:139`, beat `VanquishedBeat.tsx:140`, archive `VanquishedArchive.tsx:81`. `aria-hidden` is a documented cross-platform View prop since RN 0.71 (this app is RN **0.85.3**, `apps/rn/package.json:46`) — maps to `accessibilityElementsHidden` (iOS) / `importantForAccessibility` (Android) / `aria-hidden` (web); no native warning. The two platform props were kept alongside it — redundant but harmless (belt-and-braces). `tsc` green per the commit confirms the prop typechecks.

### 4. Finale a11y — **FIXED: no double-utterance; caps consistent; safe-area correct**
- Ring group label is now `"$0 balance"` (`PaidOffFinale.tsx:106`) — describes the ring's own content; the headline (`:115`) alone owns "You're debt-free". VO order: "$0 balance" → "You're debt-free" → "$4,200 vanquished" → … — no stutter. Ring-center Texts stay hidden (`:109`).
- FinaleStat caption now capped `maxFontSizeMultiplier={1.3}` (`:159`). R2-A6 suggested 1.4; 1.3 is *better* — it matches the stat value's own 1.3 cap, so the caption can never outgrow its value at ANY scale (hierarchy preserved by construction). All finale Texts capped: `$0` 1.3, "balance" 1.4, headline 1.3, stat values 1.3 (CountUp spreads `TextProps` → the cap genuinely lands, `CountUp.tsx:23,48`), stat labels 1.3. Button labels are uncapped but the finale scrolls (A3), so nothing becomes unreachable. ShareCard: all 11 Texts `allowFontScaling={false}` — the capture artifact is scale-immune.
- ScrollView safe-area: `paddingTop: insets.top + spacing.xl` / `paddingBottom: insets.bottom + spacing.xl` (`:101`), base style now `paddingHorizontal` only (`:207`) — closes R2's notch-overlap nit; on web insets are 0 → identical layout (fresh screenshots confirm centered, unregressed).
- **Visual (R2-A3 follow-through):** `celebration-finale-light.png` (11:43) now shows the **gold ring + mesh wash fully rendered** — the round-2 "ringless light capture" gap is closed; light and dark show the identical premium composition (outlined Share over filled Continue).

### 5. dialogTitle — **FIXED, correct per-context, on-voice**
`shareDebtCard(ref, fallbackText, dialogTitle = 'Share your debt-free win')` (`share-card.ts:12`); web variant accepts the param (`share-card.web.ts:7`). All three call sites verified: beat passes **'Share your win'** (`VanquishedBeat.tsx:88`), archive **'Share your progress'** (`VanquishedArchive.tsx:38`), finale passes nothing → the debt-free default (`PaidOffFinale.tsx:77`) — exactly the R2-C1 prescription. No "debt-free" claim before the user is; all three match the honest-numbers share voice.

### Premium-bar — **HOLDS**
Looked at `celebration-beat-light.png` / `-dark.png` (fresh): the two-button beat reads premium in BOTH themes — gold check pop, uppercase eyebrow, "Vanquished", gold $4,200, cascade line, outlined Share above filled Keep going, dimmed backdrop framing the compact navy card identically over light and dark content. `accessible={false}` is a11y-tree-only — zero visual/touch change (screenshots confirm). Finale spectacle intact in both themes. WindfallSheet's relabel ("Covers your bills & essentials first") stays honest and grouped-utterance clean. No free-dressed-as-premium introduced anywhere in the diff.

---

## FINDINGS

### R3-A1 · LOW · `apps/rn/src/components/plan/VanquishedBeat.tsx:107-119`
**Defect:** The R2-A1 fix applied only the `accessible={false}` half of the prescription; the "group the eyebrow/Vanquished/amount into one utterance via `groupLabel(...)`" half was not done. Consequences now that the card's children are individually exposed: (a) VO reads three choppy stops ("CHASE FREEDOM" → "Vanquished" → "$4,200") instead of one grouped utterance — off the app's own idiom (FinaleStat and the archive tombstones both group); (b) the eyebrow's text is `debtName.toUpperCase()` **in the string** (not a style transform), so acronym-ish debt names risk letter-by-letter VO spelling; (c) the amount `CountUp` (`:111`) is exposed BARE mid-roll — `utils/a11y.ts:17`'s own doctrine says "count-ups pass the FINAL value, never mid-roll", and pre-fix the collapsed backdrop masked this; the fix newly exposes it. FinaleStat solves the same problem with a parent group label carrying the final value; the beat doesn't.
**Scenario:** VO user clears a debt, swipes into the card during the count-up → hears "CHASE FREEDOM" (possibly spelled), "Vanquished", then a mid-roll number like "$2,731" for their $4,200 win.
**Fix (small):** wrap the eyebrow+headline+amount block in a View with `{...groupLabel(debtName, 'vanquished', amountVanquished != null ? formatWhole(amountVanquished) : 'paid off')}` — one utterance, proper-case name, final value; visual markup unchanged (uppercase stays in the string or moves to `textTransform`).

### R3-A2 · LOW · `apps/rn/src/components/plan/VanquishedBeat.tsx:107,122,128-129` (pre-existing, surfaced by this pass)
**Defect:** The beat card has no ScrollView and several uncapped texts: eyebrow (footnote), "Vanquished" (26pt), cascade (subhead), and both Button labels (`Button.tsx:67`, bodyMedium, uncapped). Only the amount is capped (1.4). At full AX Dynamic Type (~3.1×), "Vanquished" grows to ~81pt (towering over the 56pt-capped amount — the same hierarchy inversion R2-A6 fixed on the finale) and the total card height (~640–680pt) exceeds a 4.7"/SE viewport minus padding (~635pt) — the "Keep going" button can be pushed past the bottom edge with **no scroll path** (the exact failure class A3's ScrollView fixed on the finale). Not introduced by `9a59f85` (the card's composition predates it) — but the finale got the treatment and its sibling surface didn't.
**Scenario:** AX5 user on an SE clears a debt → the dismiss/Share buttons sit partially or fully off-screen; backdrop-tap still rescues touch users, but the buttons are the only labeled VO path.
**Fix:** cap the beat texts to match the finale's discipline (eyebrow 1.4, "Vanquished" 1.3, cascade ~1.6) — the card is a glanceable celebratory beat, caps are the honest fix; optionally cap Button's label (a one-line `maxFontSizeMultiplier` in the shared Button benefits every non-scrolling surface).

---

## Observations (no finding)

- **Light-finale confetti absent in the fresh capture:** the R2-A3 canvas-wait fixed the ring race (ring/mesh now verified in BOTH themes), but the light frame landed after the ~4.7s confetti life ended (dark shows it mid-burst). Code is theme-constant and confetti IS verified in dark; purely capture-frame variance. Not worth hardening further.
- **Beat comment says "Modal escape gesture"** (`VanquishedBeat.tsx:99`): RN Modal's iOS escape-gesture behavior is version-inconsistent — harmless either way since "Keep going" is a labeled dismiss, but don't rely on the comment's claim in QA scripts; the device pass should confirm VO dismiss via the button.
- **Android/web check glyph:** the Material-icons fallback renders a glyph Text that TalkBack could focus silently now that the backdrop no longer collapses the card; iOS uses SymbolView (skipped). Shipping surface is iOS; fold into any future Android a11y pass.

---

**Consensus read:** the round-2 fold is genuine — every R2 a11y finding verified resolved in code and pixels, no premium regression, no new HIGH/MEDIUM. The two LOW residuals are beat-local polish (one file, ~6 lines total) — fold-now cheap, or park on the device-QA ledger; they do not reopen the round-2 findings.
