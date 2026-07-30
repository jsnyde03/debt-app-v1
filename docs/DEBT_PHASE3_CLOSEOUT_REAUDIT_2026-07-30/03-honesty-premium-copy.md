# Lens 03 — Honesty · Premium bar · Copy/voice

**VERDICT: FINDINGS: 5** (1 high · 2 medium · 2 low). No dishonest premium *structure* found — the windfall gating itself is value-led and the free path is uncrippled — but one shipped grammar bug at the flagship share moment and one invite sentence that dresses baseline engine behavior as premium.

All strings quoted verbatim from current code on `v1.7-dev` (read 2026-07-30).

---

## Findings

### H1 · HIGH · grammar bug in the iOS share-sheet title
- **String:** `dialogTitle: "Share you're debt-free"` — `apps/rn/src/utils/share-card.ts:15`
- **Why it's off:** Reads as "Share you are debt-free" — a your/you're error on a native iOS share sheet, at the single most public, most screenshot-able premium moment (the debt-free finale's share action). One glance and the app reads indie-tech exactly where it's supposed to read triumphant.
- **Fix:** `dialogTitle: "Share your debt-free win"` — echoes the finale button "Share your win" (PaidOffFinale.tsx:117), direct-you voice, unambiguous grammar.

### H2 · MEDIUM-HIGH · free invite dresses baseline behavior as premium
- **String:** `` `Premium shows exactly where your ${formatWhole(n)} lands — cushion, debt, and savings — and routes it for you.` `` — `apps/rn/src/components/plan/WindfallSheet.tsx:111`
- **Why it's off:** Two honesty problems.
  1. **"and routes it for you"** — a free user's "Add" sends the windfall through the *same* allocation engine; the money lands across bills/debt/emergency/goals/cash identically either way. Premium's genuine delta is **seeing the itemized split before confirming** (plus the premium holdback buckets participating), not the routing itself. As written, the invite claims a premium-exclusive action that free already gets — a direct hit on the standing "never dress free as premium" rule.
  2. **"cushion"** names a bucket the split never shows — the actual row labels are "safety net" / "emergency fund" (BUCKET_META, WindfallSheet.tsx:19–26). A user who upgrades on this sentence looks for "cushion" and doesn't find it.
- **Fix:** `` `Premium shows exactly where your ${formatWhole(n)} lands — bills, debt, and savings — before you confirm.` ``

### H3 · MEDIUM · itemized split rows can fail to sum to the headline (false-precision papercut)
- **Strings/code:** eyebrow `HERE'S HOW THE APP WILL ROUTE {formatWhole(split.amount)}` (WindfallSheet.tsx:95) over rows rendered with `formatWhole(item.amount)` (line 101); amounts from `selectWindfallSplit` — `apps/rn/src/store/guardianSelectors.ts:356–359`.
- **Why it's off:** The engine's deltas sum *exactly* to the windfall (money conserved — genuinely honest math), but each row is then **independently rounded to whole dollars** by `formatWhole` (Intl, `maximumFractionDigits: 0`), and `.filter((it) => it.amount >= 0.5)` silently drops sub-50¢ buckets. Example: a $500 windfall splitting $120.50 + $379.50 displays $121 + $380 = **$501** under a headline that says **$500**. For a feature whose entire identity is "the honest marginal split," an itemization that doesn't add up is a self-inflicted credibility wound.
- **Fix:** apportion the *display* values with largest-remainder rounding (round the set so rows sum exactly to `Math.round(amount)`), either in `selectWindfallSplit` (preferred — testable) or at render. One small pure function + a unit test in `windfallSplit.test`.

### H4 · LOW · "the app routes it" — execution/custody overclaim (defer to wording audit)
- **Strings:** `HERE'S HOW THE APP WILL ROUTE $X` (WindfallSheet.tsx:95) · `Confirm and the app routes it automatically — your whole plan updates.` (WindfallSheet.tsx:104–106)
- **Why it's off:** Same lens as convergence-audit #12 ("plan voice, not action voice — nothing is literally moved"). The app never moves money; Confirm updates the *plan*. The trailing "your whole plan updates" partly self-corrects, which is why this is LOW, not MEDIUM.
- **Fix (when the whole-app wording audit runs):** eyebrow → `HERE'S WHERE YOUR $X WILL LAND`; hint → `Confirm and your whole plan updates — every dollar placed.` Keeps the automation identity without implying custody.

### H5 · LOW · notification title casing is inconsistent
- **Strings:** `'Paycheck Tomorrow'` (notifications.ts:113) and `'Upcoming Bill'` / `` `${count} Upcoming Bills` `` (notifications.ts:136) are Title Case; `"It's payday"` (line 120) and `'Before this paycheck lands'` (line 68) are sentence case.
- **Why it's off:** Mixed casing across four notifications from one app reads unedited. House style elsewhere (and iOS convention) is sentence case.
- **Fix:** `'Paycheck tomorrow'` · `'Upcoming bill'` / `` `${count} upcoming bills` ``.

---

## Special honesty checks (as tasked)

**1. Placeholder debt-free chime** (`assets/sounds/debt-free-chime.wav`, synthesized C-major arpeggio; `debtFreeSound.ts`). **Acceptable to ship through closeout — NOT a blocker — with one condition.** Mitigations that make it honest: opt-in, **default OFF**, never marketed, framed only as "Play a chime" (More → Preferences: "Debt-free sound / Play a chime when you clear your last debt." — an accurate description of exactly what it is). The swap is captured (code comment + ELEVATION_LOG VIS-6c: "swap for a mastered asset at Phase 6"). **Recommendation:** make the swap-or-consciously-keep decision an explicit line on the Phase-6 / pre-submit device checklist (listen on hardware; if it sounds premium, keeping it is a legitimate decision — synthesized ≠ dishonest, *unheard* is the risk). A tinny chime at the app's biggest emotional beat is the one way this asset breaks the premium bar.

**2. Windfall split precision.** The math itself is honest — a diff of two real allocation re-solves for THIS paycheck (not a multi-month projection), deltas provably conserving money. No false precision in substance. The only precision defect is presentational: the rounding-sum gap (H3).

**3. Windfall premium gating.** **Structurally CLEAN and a model of the reshape thesis:** free adds the windfall through the identical `setWindfall` path (uncrippled — free finishes the job); premium adds the itemized pre-confirm routing view (the app does the work, you confirm); the invite is a value-led `PremiumInvite` appearing only once a valid amount exists — no blur, no locked preview; the `PREMIUM_PURCHASABLE` kill-switch is respected. The only defect is the invite's *wording* (H2), not the gate.

**4. House voice.** No violations found. Adjudications:
- ShareCard headline **"I'm debt-free"** (ShareCard.tsx:27) and share fallback **"I'm debt-free — I paid off $X with Debt Planner."** (PaidOffFinale.tsx:75) — this "I" is the **user's own voice** on the user's own shareable post (ghost-written for them), not the app speaking. Does not breach "Guardian is the sole first-person I." Clean.
- Risk notification **"I'd give your plan a quick look before payday."** (notifications.ts:69) — the Guardian's "I," per the locked 3.1.4 decision, still neutral. Clean.
- Action buttons **"Run my plan" / "Review my plan" / "Check my plan"** (notifications.ts:31–33) — user-voice possessive on action labels, the standard iOS idiom; not an app "I." Clean.
- CushionFloorSheet trimmed subtitle **"The cash the Guardian keeps each paycheck before any extra debt payoff."** (CushionFloorSheet.tsx:23) — still accurate (the floor gates discretionary before snowball), and "keeps" matches the plan-voice phrasing convergence-audit #12 endorsed. Clean.
- Bucket labels (guardianSelectors keys + WindfallSheet BUCKET_META) — direct-you throughout; "safety net" correctly avoids Gig's "Set aside" brand. Clean.
- ShareCard brand footer **"Debt Planner · honest, on-device payoff"** — accurate, restrained. Clean.

---

## Recommended fold-in order
H1 (one-line, do now) → H2 (one-line, do now) → H3 (small function + test) → H5 (trivial) → H4 (park for the whole-app wording audit) → chime line onto the Phase-6/pre-submit checklist.
