# Phase-3 Closeout Re-Audit ROUND 2 — Lens 1: Correctness & Regression of the Fold

**VERDICT: FINDINGS: 3** (1 MINOR · 2 NIT — **all round-1 correctness fixes VERIFIED FIXED; no conservation/regression failures found.** Nothing rises to MAJOR; consensus-eligible once the one-line MINOR label tweak is decided.)

Audited fold commits `4ac17b4` (windfall C1/C3/C4) · `d5c7a15` (onDark B1) · `8c2a68a` (a11y A1–A4 incl. finale ScrollView) · `c3f2770` (share B2/B5/B6, 64-piece confetti). Every claim verified against the actual code, plus a **live adversarial probe of the real selectors** (temp script, deleted after run) and full suite runs.

**Suites run this round (all green):** `tsc --noEmit` ✅ · `npm run test:regression` ✅ · `npm run test:app` ✅ · `npm run test:scenarios` ✅ · windfall e2e **3/3** ✅ · celebration/finale e2e **8/8 both themes** ✅ (fresh web export each).

---

## ✅ Round-1 fixes VERIFIED (re-derived, not taken on faith)

### C1 — money conservation under the engine clamp — **FIXED, verified live**
`guardianSelectors.ts:366-391`. Ran the real `selectWindfallSplit` against the round-1 failure scenarios **plus a 400-run deterministic fuzz** (paycheck ∈ {0.01…5000} × living $0–1600 × missed-paycheck × paid-rent × free/premium × cent-precision windfalls $0.01–$3000):
- **Missed paycheck** (`missedArrivals` = cycle end, income planned $0): $500 → non-empty, sums $500 ✓ · $1,000 → sums $1,000 ✓ (round 1: `[]` and $200).
- **Paid rent $1,200 + $800 living > $1,500 income**: $1,000 → sums $1,000 ✓ (round 1: $500).
- Tight base (400 < 800), EF-funded, no-debts/idle, fractional amounts ($37.49, $333.33, $250.75, $300.50, $0.60): all sum EXACTLY to `Math.round(amount)`, all rows whole-dollar ≥ $1, **zero failures in 400 fuzz runs**, no empty split for any amount ≥ $1.
- **Negative `absorbed` (Σdeltas > amount)**: impossible beyond cent noise — deltas are monotone in `remaining` (round-1 verified; fuzz confirms), and the `absorbed > 0.005` guard means the bills bucket is only ever increased. No path to a negative bills row.

### C4/H3 — `roundBucketsToWhole` — **CORRECT, bounds proven**
`guardianSelectors.ts:347-356`. Analytic check + fuzz:
- **Cannot under-sum:** `remaining = target − Σfloors`; since Σraw = amount exactly after the C1 attribution (or ≥ amount − 0.005 without it) and each floor loses < 1 across 6 buckets, `remaining ≤ 6` — the loop always has enough buckets to distribute it. Rows sum to `target` exactly.
- **Cannot over-sum / negative `remaining`:** Σfloors ≤ Σraw ≤ amount + 0.03 (cent-rounding worst case) and `target = round(amount) ≥ amount − 0.5` → Σfloors > target is arithmetically impossible; when `remaining = 0` the loop is a no-op.
- **No phantom bucket:** `remaining ≤ floor(Σfracs + 0.5) ≤ ceil(Σfracs) ≤` count of positive-frac buckets, and `byFrac` sorts positive fracs first — a zero-delta bucket can never receive the +1. Equal-frac ties resolve arbitrarily but conservation holds either way.
- **No negative rows:** deltas are non-negative (monotone engine), so `Math.floor` never goes below 0.
- **Headline consistency:** the sheet's eyebrow uses `formatWhole(split.amount)` — Intl `maximumFractionDigits: 0` rounds half-expand, which agrees with the `Math.round(amount)` target for all positive amounts. Rows always visually sum to the headline.

### C3 — empty-split guard — **FIXED**
`WindfallSheet.tsx:56` `hasSplit = split != null && split.items.length > 0` gates the eyebrow, rows, footer, **and** the Confirm-vs-Add submit label (`:77`). The only empty case remaining is a sub-dollar windfall (target $0), which correctly renders no routing block.

### Tests genuinely LOCK the fixes — **not tautological**
`windfallSplit.test.ts` asserts `sum === 500` exactly + non-empty + a bills row for the tight case (`:59-63`), exact whole-dollar sums for the healthy/idle cases, and cash-landing (`:65-74`) — all of these **fail against the pre-fix code** (round 1 measured the tight-family cases summing short/empty). The windfall e2e (`windfall.spec.ts:35-39`) now clicks Confirm and asserts the sheet dismissed **and** the Plan hero shows "$1,000 extra this paycheck" — a no-op Confirm cannot pass (T2 locked).

### Finale ScrollView (A3) — **centering + layers intact**
`PaidOffFinale.tsx:97-123`. `styles.fill` → `{flex:1}`; centering moved to `scrollContent` (`flexGrow: 1` + center) — content stays centered at normal sizes (celebration e2e 8/8 both themes confirms the finale renders + asserts pass post-ScrollView). Mesh + confetti are `pointerEvents="none"` absolute **siblings outside** the ScrollView — they stay fixed (don't scroll with content) and can't intercept touches; the off-screen ShareCard is also outside. Reduce-motion path intact: confetti + Bloom skipped, `enter=1` snap, CountUp → static text, finale haptic kept. `CountUp` spreads `TextProps` (`CountUp.tsx:23`), so the `maxFontSizeMultiplier={1.3}` caps genuinely reach the Text.

### Button `onDark` (B1) — **shim complete**
`Button.tsx:32-39`. The render body reads exactly 7 token paths — `accent.brand`, `accent.danger`, `background.secondary`, `text.onAccent`, `text.primary`, `text.secondary`, `border.default` — and the shim provides **all 7** from the `.dark` set (token shape `{light, dark}` confirmed in `theme/colors.ts`). Focus ring = `c.accent.brand` = `#5b9dff` on the navy takeover — visible and correct on dark. Both `onDark` consumers (finale, VanquishedBeat) are genuinely theme-constant navy surfaces (`heroTop/heroBottom` identical light/dark). `tsc` green — no union-narrowing hole.

---

## Findings

### R2-C1 — MINOR (honesty/label) — absorbed living-reserve dollars display as "Covers your bills first" even when the store has ZERO bills
- **File:** `apps/rn/src/store/guardianSelectors.ts:380-384` + `apps/rn/src/components/plan/WindfallSheet.tsx:20` (`BUCKET_META.bills.label`)
- **Defect:** the C1 fix attributes ALL absorbed dollars to the `bills` bucket, but the absorbed pool is `paidRequiredTotal + livingExpenseReserve` — and the living reserve can be the whole of it. Round 1's own fix note flagged this ("living reserve is arguably not 'bills'"); the fold chose `bills` without adjusting the label.
- **Concrete failure (verified live):** missed paycheck, **no debts, no required expenses**, $800 living reserve → $500 windfall renders exactly one row: **"Covers your bills first · $500"** — the user has no bills; the money is covering groceries/living costs. On the feature whose identity is "an honest 'here's where your extra lands'", that's a mislabel in precisely the crisis case C1 was fixed for.
- **Fix (one line):** broaden the bucket label — `bills: { label: 'Covers your bills & essentials first', … }` — which stays true in every case (the bucket already mixes expenses + minimums + the absorbed reserve). Splitting absorbed by composition would need the selector to expose `paidRequiredTotal`/`livingExpenseReserve` separately — not worth it.

### R2-T1 — NIT (test gap) — the committed C1 lock exercises the tight-base clamp but not the actual MISSED-PAYCHECK path
- **File:** `apps/rn/src/store/windfallSplit.test.ts:56-63`
- **Defect:** the C1 test uses paycheck $400 < $800 living. Round 1's headline repro was the **missed paycheck** (`missedArrivals` → `buildAllocation` plans income $0 — `selectors.ts:46-48`). The engine clamp path is shared (my probe confirms missed+$500/$1,000/$37.49 all conserve today), but a future regression in the missed-paycheck→selector wiring specifically (e.g. `selectAllocation` returning null for a missed cycle) would re-empty the premium sheet and the suite would stay green.
- **Fix (3 lines):** add `const missed = { ...s, missedArrivals: [s.paycheck.nextPaycheckDate] }` + the same non-empty/exact-sum asserts.

### R2-A1 — NIT (AX-only) — finale ScrollView has no safe-area top inset under `statusBarTranslucent`
- **File:** `apps/rn/src/components/plan/PaidOffFinale.tsx:97, 199`
- **Defect:** the ScrollView is `absoluteFill` and `scrollContent` pads only `spacing.xl`; the Modal is `statusBarTranslucent`. At normal sizes content is centered — unaffected. But in exactly the AX Dynamic-Type case A3 exists for (content taller than the screen, scrolled to top), the first content sits ~24px from the physical top — under the Dynamic Island/notch on device.
- **Fix:** add `paddingTop: Math.max(spacing.xl, insets.top)` via `useSafeAreaInsets` (or `contentInsetAdjustmentBehavior="automatic"`). Device-QA sized; fold or park on the Phase-6 device ledger with the other finale device checks.

---

## New-bug hunt — checked and CLEAN
- 64-piece confetti (`c3f2770`): pure constant bump + wider spread; per-piece animation unchanged; still `!reduce`-gated; opacity fades before edges. No new lifecycle/perf hazard beyond the device-feel QA already owed.
- `ShareCard` variant refactor: finale call site passes the full `kind:'finale'` payload; `tsc` confirms the discriminated union everywhere; off-screen card still hidden from a11y + `pointerEvents="none"`; celebration e2e rescoped assertions pass 8/8.
- Windfall sheet memoization (`engineStore` off `[store, isPremium]`, split off `[…, n]`) unchanged and correct; `submit()` still uses the raw `n` (the split is display-only) — conservation of the actual `setWindfall` is unaffected by rounding.
- Bills-first sort comparator (`guardianSelectors.ts:389`): only one `bills` entry can exist, so the non-strict comparator is safe.
- No suite regressions: core regression, app-layer, scenarios, typecheck, windfall e2e, celebration e2e — all green this round.
