# Lens 5 — Accessibility (WCAG 2.2 AA, code-level) + Performance-feel (code-level)

**VERDICT: FINDINGS: 9** (0 high · 3 medium · 6 low). No blocker. The session's a11y *culture* held — GuardianProofStrip ships the one-utterance group pattern correctly, the off-screen ShareCard and the ring-centre are properly a11y-hidden, confetti/mesh/bloom are Reduce-Motion-gated and expose no focusable elements, notification action titles are clear verb-led phrases, and the finale's contrast on navy is excellent in BOTH themes (heroSub 7.7–8.6:1 · gold 10.6–11.9:1). The misses are concentrated: an unnamed Switch, one light-mode contrast fail, and uncapped Dynamic-Type text inside the finale's fixed geometry. Performance is structurally sound (UI-thread animations, memoized windfall projection, static mesh); both perf findings are one-line micro-fixes.

Contrast verified numerically (WCAG relative-luminance script) + against `test-results/celebration-finale-*`, `guardian-proof-*`, `windfall-*`, `more-sound-*` screenshots. Device Dynamic-Type/VoiceOver behavior remains Phase-6; everything below is code-verifiable now.

## Findings

### A1 · MEDIUM · `apps/rn/src/app/more.tsx:192` — the "Debt-free sound" Switch has no accessible name
The `Switch` gets `value`/`onValueChange`/`trackColor` only; `SettingRow` (more/SettingRow.tsx:42-57) renders the label Text as a *sibling* and only groups when `onPress` is set. VoiceOver lands on the control and announces just "off, switch" — no name (WCAG 4.1.2). Same defect on the sibling switches (notifications, savings-elsewhere, payday-countdown rows), but this session shipped this one.
**Affected:** VoiceOver users toggling the new setting blind.
**Fix:** `accessibilityLabel="Debt-free sound"` on the Switch — better, have `SettingRow` clone/require a label on control rows so the pattern can't recur.

### A2 · MEDIUM · `apps/rn/src/components/plan/GuardianProofStrip.tsx:33-34` — chip text fails AA in light mode
Chip = `textStyles.caption` (12pt) in `c.text.secondary` (#5a6b82) on `c.background.tertiary` (#dce4f0) → **4.25:1**, below the 4.5:1 AA floor for normal text (dark mode passes at 8.83:1). The `text.secondary`-on-`background.tertiary` pairing was never contrast-audited (the colors.ts:40 audit note covers tertiary-on-card only).
**Affected:** low-vision users in light mode — on the premium proof-of-work surface.
**Fix:** chip text → `c.text.primary` (visually still subordinate at 12pt), or darken the chip's text to a token pair that clears 4.5. Screen-reader users are unaffected (the group label carries the content).

### A3 · MEDIUM · `apps/rn/src/components/plan/PaidOffFinale.tsx:101,106,199-200` — uncapped Dynamic Type inside fixed finale geometry
`styles.zero` ($0, 44pt) and the "balance" caption sit inside the fixed 208px ring; the 30pt headline and both sit in a non-scrolling Modal fill. None has `maxFontSizeMultiplier` — while the stat trio right beside them caps at 1.3 (line 143/145). At AX sizes (~3.1×) the $0 renders ~135pt, blowing out of the ring, and the stacked content (fixed ring + scaled headline/trio/buttons) can push "Continue" off-screen with no scroll.
**Affected:** large-Dynamic-Type users at the once-ever flagship moment.
**Fix:** `maxFontSizeMultiplier={1.2}` on the ring-centre pair + `{1.3}` on the headline (matching the trio), and let `styles.content` live in a ScrollView (or `flexShrink` the ring) so AX sizes degrade to scroll, not clipping. Confirm at AX5 in the Phase-6 device pass.

### A4 · LOW · `apps/rn/src/components/plan/WindfallSheet.tsx:97-103` — split rows aren't one-utterance groups
Each routing row is icon + label Text + amount Text as three sibling elements — VoiceOver reads "Extra to your debt", then separately "$310", association by swipe-order only, ~12 stops for a 6-row split. The codebase's own pattern groups such rows (TimelineLedger.tsx:102, PlanHero.tsx:127, GuardianProofStrip:29).
**Affected:** VoiceOver users on the premium autopilot beat — the exact surface that must feel effortless.
**Fix:** on each row View: `accessible accessibilityLabel={`${BUCKET_META[item.key].label}, ${formatWhole(item.amount)}`}` — the icon collapses into the group (decorative) for free.

### A5 · LOW · `apps/rn/src/components/plan/ShareCard.tsx` — the captured share PNG inherits the user's font scale
Fixed W=360 card, but no text disables font scaling — `captureRef` rasterizes whatever RN laid out, so at large Dynamic Type the 32pt headline and stat trio scale up, wrap, and crowd the fixed card. The one organic-growth artifact degrades precisely for large-text users.
**Affected:** large-Dynamic-Type users sharing their win (visual artifact only — the card is correctly a11y-hidden).
**Fix:** `allowFontScaling={false}` on the card's Texts (it's a branded image, not UI — fixed metrics are correct here).

### A6 · LOW · `apps/rn/src/components/plan/WindfallSheet.tsx:95` — eyebrow is hard-caps in source
`HERE&apos;S HOW THE APP WILL ROUTE …` is literal all-caps; screen readers can spell out short caps words as initialisms. House pattern is sentence case + `textTransform: 'uppercase'` (PaidOffFinale/GuardianProofStrip `statLabel`, styles.eyebrow elsewhere).
**Fix:** author "Here's how the app will route …" + add `textTransform: 'uppercase'` to `styles.eyebrow`.

### A7 · LOW · `apps/rn/src/components/plan/PaidOffFinale.tsx:108-114,138-150` — stat trio: partial count-up values + ungrouped stats
`FinaleStat`'s value and label are separate VO elements (same class as A4), and `CountUp` exposes its rolling display text with no `accessibilityLabel` — VO focus during the 900ms roll reads a partial number ("$2,731…"). Also the ringWrap label "You're debt-free." (line 97) duplicates the headline text one swipe later — read twice.
**Fix:** make each stat `accessible` with `accessibilityLabel={`${fmt(value)} ${label}`}` (final value, one utterance — CountUp spreads TextProps so the group label wins); reword the ring label to carry the $0 fact it hides, e.g. "Balance zero — you're debt-free", killing the duplicate.

### P1 · LOW · `apps/rn/src/app/(tabs)/index.tsx:297` — finale subtree re-renders with every Today render
`stats={selectCelebrationStats(store)}` builds a fresh object inline and `PaidOffFinale` isn't memoized — any Today re-render while the finale is up (store writes, ack changes) re-renders the whole spectacle subtree: 44 `ConfettiPiece`s (worklet-style re-creation), the Skia mesh Canvas, and the off-screen ShareCard. Animations themselves are UI-thread SharedValues (correct) and Today re-renders are event-driven, so this is bounded — but it's the heaviest subtree in the app at its most emotional moment.
**Affected:** low-end devices during the finale.
**Fix:** `useMemo(() => selectCelebrationStats(store), [store])` + `memo(PaidOffFinale)` (or memo `ConfettiPiece`). One line each.

### P2 · LOW · `apps/rn/src/store/guardianSelectors.ts:354` (via `WindfallSheet.tsx:51-54`) — half the per-keystroke split work is amount-invariant
The memoization the closeout asked about is **correctly in place**: `engineStore` memoizes `withProjectedBalances` on `[store, isPremium]` so typing never re-projects balances, and the split legitimately recomputes per keystroke (it depends on `n`). But inside `selectWindfallSplit`, `withoutAlloc = selectAllocation({...store, windfall: 0})` doesn't depend on the amount at all — it's recomputed identically on every keystroke, doubling the per-key work. `selectAllocation` is a cheap single waterfall, so this is felt only on large plans.
**Fix:** hoist the zero-windfall allocation to its own `useMemo` on `[engineStore]` (add an optional `baseAlloc` param to `selectWindfallSplit`), halving per-keystroke cost.

## Verified healthy (positive)
- **GuardianProofStrip grouping** — `accessible` + full-sentence label joining the chips (line 29): exactly the one-utterance pattern; icon correctly collapses into the group. Chip `numberOfLines={1}` truncation at large DT is safe because the group label carries full text.
- **Finale decoration hygiene** — confetti layer, mesh Canvas, and bloom expose zero accessible elements (plain Views/Skia Canvas, `pointerEvents="none"`); ring centre and off-screen ShareCard explicitly `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`. (Nit, not a finding: an explicit `accessibilityElementsHidden` on the confetti/mesh wrappers would match the money.tsx/PaydayGuardianCard belt-and-braces convention.)
- **Reduce Motion** — confetti + bloom fully gated; entry snaps; CountUp shows final value (reanimated `useReducedMotion`); the finale haptic is intentionally kept (a11y channel, per house rule).
- **Contrast on the navy takeover** — identical in both themes by design: heroSub 7.66/8.62:1, gold 10.59/11.92:1, heroText 14.72:1, goldPillInk-on-gold 11.92:1 — all comfortably AA (most AAA). Windfall eyebrow `text.tertiary` = 4.66 (light) / 5.19 (dark) — passes.
- **Notification actions** (`notifications.ts:30-34`) — "Run my plan" / "Review my plan" / "Check my plan": short, verb-led, self-describing for VoiceOver; all `opensAppToForeground`.
- **Mesh performance** — `MeshGradientChart` is static (three radial fills, no animation loop), mounted once per finale, keyed stably; `useWindowDimensions` only changes on rotation. Not re-mounting.
- **Buttons/FormSheet** — finale buttons are the shared `Button` (role=button, 52pt target); WindfallSheet rides FormSheet (labeled Close, scrolling content, keyboard-avoided submit).

## Phase-6 device-owed (from this lens)
AX-size finale reflow after the A3 fix · VoiceOver swipe-order through the finale (ring → headline → trio → buttons) · Switch announcement after A1 · finale frame-feel on the oldest supported hardware (P1).
