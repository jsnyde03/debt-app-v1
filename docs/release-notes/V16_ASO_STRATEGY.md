# Debt Planner v1.6 "Differentiation Strike" — ASO Strategy & Execution

_Authored at v1.6 feature-lock (2026-07-06). Builds on the v1.5 ASO pass ([V15_ASO_STRATEGY.md](V15_ASO_STRATEGY.md)) — it does NOT restart it. v1.5 already repositioned the listing around the payday-allocation job; v1.6 **sharpens that wedge** with the two features that make it uncopyable: **Payday Autopilot** (one-tap payday capture) and the **Interest-Saved Ledger** (proof your extra payments are worth it). Every step Jason executes in App Store Connect is written below as a **field-by-field how-to** (per the executable-how-to rule) — exact nav path → field → exact value to paste._

> **The one-line v1.6 positioning shift:** v1.5 said _"payday tells you what to pay, and celebrates your journey."_ v1.6 says _"payday tells you what to pay, you confirm it in **one tap**, and it **proves** how much interest you're saving."_ The wedge moves from *guidance + motivation* to *guidance + frictionless capture + payoff proof* — the loop no calculator or budgeter can copy.

---

## 0. TL;DR — what actually changes for v1.6 (and what doesn't)

| Field | v1.5 (live) | v1.6 action | Risk / effort |
|---|---|---|---|
| **App Name** | Paycheck Debt Planner | **KEEP** (renaming resets keyword history) | — |
| **Subtitle** (30) | Snowball Budget & Bill Payoff | **KEEP** (freshly optimized 5 days ago; no v1.6 term beats it) | — |
| **Keywords** (100) | …loan,credit,card,expense,savings | **1 swap: drop `loan` → add `payday`** (the wedge; avoids the "payday loan" combo by removing `loan`) | low |
| **Promotional Text** (170) | v1.5 journey hook | **REWRITE** to the one-tap-capture + interest-saved hook (not indexed, rotate anytime, no build) | none |
| **Description** (4000) | v1.5 | **2 targeted edits** — add Payday Autopilot + Interest Saved to "WHAT YOU GET, FREE" (trim to stay under 4000) | low |
| **What's New** | v1.5 | **PASTE v1.6 copy** (already written → `docs/release-notes/v1.6.md`) | none |
| **Screenshots** | 10-shot v1.5 set | **CREATE 2 NEW** (Payday Autopilot sheet · Interest-Saved card); reuse the rest — see §3 | **the only real production work** |
| **In-App Event / CPPs** | (v1.5 backlog) | optional — see §5 | defer-ok |

**Bottom line:** the only new *creative production* is **2 screenshots**. Everything else is paste-in metadata Jason can do in ~20 minutes in ASC.

---

## 1. Metadata — exact values + the ASC how-to

### 1.1 Promotional Text (rotatable, NOT indexed — safe to change anytime, no new build)

**Paste this (161 chars):**
> Payday? One tap logs your plan — no bookkeeping. See exactly what to pay this paycheck, and the interest your extra payments save you. 100% private, no sign-up.

**Why:** leads with the v1.6 differentiator (one-tap capture) + the proof (interest saved), keeps the trust signal. Promo Text is the fastest high-value ASO lever — it's not search-indexed, so it carries zero keyword risk and can be swapped the moment the build is live (no review needed).

**How to update in App Store Connect:**
1. **App Store Connect → My Apps → Paycheck Debt Planner → (left sidebar) App Store → the v1.6 version** (or the live version for an immediate rotate).
2. Scroll to **Promotional Text**. Select all, delete, paste the text above.
3. **Save** (top-right). If done on the *live* version (not a pending build), it publishes within minutes with no review.

### 1.2 Keywords (100 chars — search-indexed; ONE swap)

**Current (live, 96 chars):**
`avalanche,calculator,biweekly,reminder,milestone,streak,tracker,loan,credit,card,expense,savings`

**Paste this (v1.6, 98 chars):**
`avalanche,calculator,biweekly,reminder,milestone,streak,tracker,payday,credit,card,expense,savings`

**The one change: `loan` → `payday`.**
- **Why add `payday`:** it's the app's core wedge and it is **not** in the Name ("Paycheck" ≠ "payday" for Apple's matching) or Subtitle. It combines with existing terms into high-intent phrases — "payday budget," "payday planner," "payday tracker" — that competitors (payoff *calculators* / generic *budgeters*) don't target.
- **Why drop `loan` (not something else):** `payday` + `loan` would auto-combine into **"payday loan"** — the predatory-lender category, wrong-intent traffic. Removing `loan` kills that combo. `loan` alone was generic/saturated ("loan calculator" is a crowded head term); `calculator` already carries the calculator intent.
- **No spaces, no repeats, singular** — Apple auto-combines. (Unchanged rule from v1.5.)

**How to update:** same screen as §1.1 → **Keywords** field (only editable on a version that hasn't been submitted yet, i.e. the v1.6 version before you hit Submit). Replace the string. **Save.**

### 1.3 Subtitle (30 chars) — **KEEP "Snowball Budget & Bill Payoff"**

**Recommendation: do not change it.** It was re-optimized 5 days ago (v1.5) and indexes snowball + budget + bill + payoff. No v1.6 term is worth burning that fresh keyword history — and "payday" is better captured via the keyword field (§1.2) without a Subtitle churn. _(If a future test shows "payday" belongs in the Subtitle, that's a deliberate v1.7 experiment, not a v1.6 side-effect.)_

### 1.4 Description — 2 targeted edits (stay under the 4000-char cap)

The live description is ~3,927 / 4,000 chars, so adding two free-feature bullets requires trimming ~230 chars first. Do these three edits in `docs/release-notes/app-store-listing.md` **and** paste the result into ASC.

**EDIT A — intro paragraph, add the capture loop.** In the opening paragraph (after "…how much cushion you'll have left."), append:
> On payday, confirm the whole plan in one tap — your progress stays accurate with zero bookkeeping.

**EDIT B — "WHAT YOU GET, FREE", add two bullets** (both features are FREE — no paywall on the core loop):
> - **Payday Autopilot** — On payday, the app surfaces the plan you set and captures it in one tap. Paid a little differently, or from savings? Adjust the amount or mark it paid elsewhere.
> - **Interest Saved** — See exactly how much interest your extra payments save you — and how much sooner you're debt-free — versus paying minimums only.

**EDIT C — trim to fit.** Remove the standalone "Since Last Cycle" free bullet under **TRACK YOUR JOURNEY** (it's already implied by streaks/history and is the weakest standalone line), and tighten the v1.1-era "Timeline View" bullet. That reclaims ~230 chars for Edits A+B. Verify the final count is ≤ 4000 before pasting.

**How to update:** ASC → App Store → v1.6 version → **Description** → paste the edited full text. (Description is not indexed on iOS, so this is pure conversion copy — no keyword impact.)

### 1.5 What's New — paste the v1.6 copy

Already written → **`docs/release-notes/v1.6.md` → "App Store 'What's New' copy"**. Paste into ASC → App Store → v1.6 version → **What's New in This Version**. (Leads with Payday Autopilot, then Interest Saved.)

---

## 2. Apple guideline check (do before Submit)

- **No paywall regression (Guideline 3.1.2):** Payday Autopilot and Interest-Saved are **free**. Nothing that was free became gated; the only paywalls remain Amortization + Pay Cycle History (unchanged). The listing must NOT imply these two v1.6 features are Premium.
- **Reviewer note:** the v1.6 review note (in `docs/release-notes/v1.6.md`) already tells the reviewer **how to trigger the payday sheet** (set a paycheck dated today, relaunch) — paste it into ASC → App Review Information → Notes. Without it a reviewer may never see the headline feature.

---

## 3. Screenshots — the v1.6 delta (⭐ Jason's ask: ONLY the new ones)

**You need to create exactly TWO new screenshots for v1.6. Everything else in the v1.5 set carries over unchanged.**

### 3.1 Carry-over vs. new (compare/contrast with the v1.5 10-shot set)

| # | v1.5 shot | v1.6 status |
|---|---|---|
| 1 | Plan Overview / hero — "Payday? Here's exactly what to pay" | ♻️ **Reuse.** (In-app hero subtitle copy changed slightly, but the shot's value + headline overlay are unchanged. Optional light re-shoot only if you're recapturing the set anyway.) |
| 2 | Milestone Celebration ⭐ | ♻️ Reuse |
| 3 | Smart Insights (Premium) | ♻️ Reuse |
| 4 | Streaks & Progress | ♻️ Reuse |
| 5 | Timeline | ♻️ Reuse |
| 6 | Strategy Comparison (Premium) | ♻️ Reuse |
| 7 | Amortization (Premium) | ♻️ Reuse |
| 8 | App Lock & Privacy | ♻️ Reuse |
| 9 | Pay Cycle History (Premium) | ♻️ Reuse |
| 10 | Swipe to Pay | ♻️ Reuse |
| — | — | 🆕 **NEW A: Payday Autopilot capture sheet** |
| — | — | 🆕 **NEW B: Interest-Saved Ledger card** |
| Paywall 1–2, Demo | | ♻️ Reuse |

> There are now **12 strong shots for 10 slots** — a good problem. §3.3 gives the recommended order (the two new shots lead early, in-search; Timeline + Swipe-to-Pay drop to alternates / a Custom Product Page).

### 3.2 The two NEW shot briefs

**Capture setup (same as v1.5):** iOS Simulator (iPhone 15 Pro Max / 6.7", 1290×2796), in-app **"Try with Sample Data"**, **dark theme** (the premium look — per the dark-mode-screenshots rule). Shoot both in the same session as any re-shoots so the sample data matches across frames.

#### 🆕 SCREENSHOT A — Payday Autopilot _(the v1.6 hero shot — this is the uncopyable moment)_
**What to show:** the **payday capture sheet** open over the Plan tab — the "It's payday" header, 2–3 recommended plan rows with amounts (a debt extra payment + an emergency-fund contribution), the **"I followed the plan"** one-tap button prominent, and the "Adjust" affordance visible.
**How to reach the state:** in Plan Settings set the paycheck's **Next Paycheck Date to today** (or 1–2 days ago), Calculate, then **relaunch** the app — the sheet auto-opens. (Same trigger as the reviewer note.)
**Headline:** One tap on payday. Plan captured. _(OCR keyword: "payday")_
**Subhead:** Followed the plan? Tap once. Paid differently? Adjust — no bookkeeping, ever.
**Theme:** Dark

#### 🆕 SCREENSHOT B — Interest Saved _(free value proof)_
**What to show:** the **Payoff tab** with the **Interest-Saved card** big-number-first — "Paying extra saves you **$X** in interest" and "**Y years** sooner than minimums" — above the debt-free-date rows. (Use the sample data; it produces a meaty figure, e.g. ~$2,000+ / several years.)
**Headline:** See what your extra payments are worth. _(OCR keyword: "interest")_
**Subhead:** Exactly how much interest you save — and how much sooner you're debt-free — vs. minimums. Free.
**Theme:** Dark

### 3.3 Recommended v1.6 App Store order (10 slots — the 2 new shots lead in-search)

Apple shows the first 2–3 shots in search results before a tap, so the new differentiators go early:

1. **Plan Overview (hero)** — "Payday? Here's exactly what to pay" _(the core job)_
2. 🆕 **Payday Autopilot** — "One tap on payday" _(THE v1.6 wedge; no competitor has it)_
3. **Milestone Celebration** ⭐ _(emotional scroll-stopper)_
4. 🆕 **Interest Saved** — "what your extra payments are worth" _(free value proof)_
5. **Smart Insights (Premium)** _(strongest premium pitch)_
6. **Strategy Comparison (Premium)**
7. **Streaks & Progress**
8. **Amortization (Premium)**
9. **App Lock & Privacy** _(trust signal)_
10. **Pay Cycle History (Premium)**

**Dropped from the main 10 → alternates / CPP:** Timeline, Swipe-to-Pay. (Both still useful — see §5 CPP idea.)

**How to update screenshots in ASC:** App Store Connect → v1.6 version → **App Previews and Screenshots → 6.7" Display** → drag to add the 2 new PNGs, then drag to reorder to the sequence above. (Uploading a new set for the 6.7" size is enough; ASC down-scales for smaller devices unless you've set device-specific sets.)

---

## 4. Execution checklist (paste-order for the ~20-min ASC session)

Do these in the v1.6 App Store version in ASC, in order:

- [ ] **Keywords** → swap `loan`→`payday` (§1.2). _(Editable only pre-Submit.)_
- [ ] **Promotional Text** → paste the v1.6 hook (§1.1).
- [ ] **Description** → apply Edits A/B/C, confirm ≤4000, paste (§1.4).
- [ ] **What's New** → paste from `v1.6.md` (§1.5).
- [ ] **Screenshots** → create the 2 new shots (§3.2), upload, reorder to §3.3.
- [ ] **App Review Information → Notes** → paste the v1.6 reviewer note (§2).
- [ ] **Subtitle** → confirm UNCHANGED (§1.3).
- [ ] Guideline 3.1.2 self-check (§2), then **Submit for Review** (or Save if the build is still uploading).

---

## 5. Deferred / optional (do NOT block v1.6 submit)

- **In-App Event — "Payday Autopilot is live":** an ASC In-App Event could spotlight the new capture loop (extra search surface + a card on the product page). Deferred — it's a separate ASC workflow; file for a post-launch ASO follow-on with its own how-to.
- **Custom Product Pages (2):** the v1.5 doc already recommended two CPPs (one paycheck-budget-led, one debt-payoff-led). v1.6 adds a natural third angle — a **capture/automation-led** CPP leading with Payday Autopilot for "automatic/one-tap" searchers. Deferred to the post-launch ASO batch.
- **Reuse-set housekeeping:** if you re-shoot the whole set for consistency, refresh Shot 1's visible hero subtitle to the new "Here's exactly what to pay this paycheck —" copy. Otherwise the old shot is fine.
