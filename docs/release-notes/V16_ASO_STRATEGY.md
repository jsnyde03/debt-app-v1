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

## 5. Custom Product Pages & In-App Events — step-by-step how-to

**Timing:** both are **post-launch optimizations** — they do NOT block the v1.6 submit and need no new build. Do them once v1.6 is live (a CPP can point Apple Search Ads / marketing links at a tailored page, and now also **surfaces in organic search** for its own keyword selection; an In-App Event gets you an extra card on the product page + a browse/search surface for ~2 weeks). Jason executes these; the exact steps are below. _(Specs verified against Apple's ASC Help, 2026 — the ASC field labels show the live limit next to each field; trust that over any number here.)_

### 5A. Custom Product Pages (CPPs)

**What a CPP is:** an alternate version of your product page with its **own screenshots, app previews, promotional text, and keyword selection** (keywords are chosen from your app's already-approved keyword set — a CPP can't invent new ones). Up to **70 per app**, each localizable, each with an **auto-generated unique URL**. A CPP must be **submitted to App Review** before it's visible. Required ASC role: Account Holder / Admin / App Manager / Marketing.

**Nav path:** App Store Connect → **Apps** → Paycheck Debt Planner → left sidebar → **Custom Product Pages** → **Create Custom Product Page** (or **+**).

**Create-a-CPP steps (repeat per page below):**
1. **Reference Name** — internal only (shows in App Analytics). Use the names in the table below.
2. **Start from:** choose **Copy from** your live App Store version (fastest — it clones the full v1.6 screenshot set + promo text; you then reorder/swap). Click **Create**. The **unique URL is generated immediately** — copy it (this is what you put in Apple Search Ads / social links).
3. **Screenshots (6.7"):** reorder to the CPP's lead shots (below). You're mostly *reordering existing shots* + dropping in the 2 new v1.6 shots — minimal new production.
4. **Promotional Text:** paste the per-CPP copy below.
5. **Keywords section:** select the subset (from your approved keyword field) that matches this CPP's audience, per localization. **Publish** the keyword selection.
6. **Submit to App Review** (top-right). Approved → it publishes automatically; while under review you can't edit its shots/promo/keywords.

**Recommended CPPs for Debt (start with #1 — it's the v1.6 wedge):**

| # | Reference Name | Lead shots (order) | Promotional Text (≤170) | Keyword subset to assign |
|---|---|---|---|---|
| 1 | `v16-payday-autopilot` | 🆕 Payday Autopilot → 🆕 Interest Saved → Plan Overview → Milestone | One tap on payday logs your whole plan — no bookkeeping. See exactly what to pay this paycheck, and the interest your extra payments save. | `payday, biweekly, reminder, calculator` |
| 2 | `v16-debt-payoff` | Milestone → Strategy Comparison → Amortization → Streaks | Snowball or avalanche — see your real payoff date and how much interest you save, then feel every milestone to debt-free. | `avalanche, calculator, milestone, streak` |
| 3 _(optional)_ | `v16-paycheck-budget` | Plan Overview → Timeline → 🆕 Payday Autopilot | Payday? See exactly which bill and which debt to hit, with your safe-cash cushion at every step. 100% private. | `biweekly, expense, savings, tracker` |

_CPP #1 is the only one needing the 2 new shots up front; #2 and #3 are pure reorders of the reused v1.5 set. Point your first Apple Search Ads campaign (or a social post) at CPP #1's URL to A/B it against the default page in App Analytics → Product Page views/conversion._

### 5B. In-App Event — "Payday Autopilot is here"

**What it is:** a time-boxed event card on your product page (and in search/browse for up to ~2 weeks before + during) — a legitimate way to spotlight the v1.6 capture feature at launch. Must be submitted for review.

**Nav path:** App Store Connect → **Apps** → Paycheck Debt Planner → left sidebar → **In-App Events** → **+**.

**Field-by-field (exact copy to paste; ASC shows each limit inline):**
- **Reference Name** (internal): `v16-payday-autopilot-launch`
- **Event Badge** (dropdown — pick one): **Major Update** _(fits a headline new feature; alternatives are Special Event / Challenge / Competition / Live Event / New Season / Premiere)._
- **Event Name** (≤30): `Payday Autopilot is here`
- **Short Description** (≤50, shown on the card): `Confirm your payday plan in one tap.`
- **Long Description** (≤120, details page): `New: on payday, log your whole plan with one tap — and see the interest your extra payments save vs. minimums.`
- **Event Deep Link:** a **universal link** (recommended over a custom URL scheme for security). If you don't have a universal-link domain wired, use the app's App Store link so Open launches the app; the app opens to the Plan tab where the sheet surfaces on payday.
- **Event Card Image** (landscape, **16:9, min 1920×1080**, max 3840×2160, .jpg/.png): a framed shot of the **Payday Autopilot sheet** with a "One tap on payday" caption. _(Reuse the new Screenshot A composition, re-laid-out landscape.)_
- **Event Details Image** (portrait, **9:16, min 1080×1920**): the portrait Payday Autopilot shot.
- **Time Zone / Start & End:** a ~2-week window opening on your v1.6 public-release day; you may **publish the event up to 2 weeks before** it starts to get the pre-event search/browse surface.
- **Availability / Regions:** all (matches app availability — US-only today).
- **Submit for Review** (events review separately from the app version).

### 5C. Reuse-set housekeeping
If you re-shoot the whole screenshot set for consistency, refresh Screenshot 1's *visible* hero subtitle to the new "Here's exactly what to pay this paycheck —" copy. Otherwise the existing shot is fine (its headline overlay is unchanged).

**Sources:** [Configure multiple product page versions — ASC Help](https://developer.apple.com/help/app-store-connect/create-custom-product-pages/configure-multiple-product-page-versions/) · [Custom Product Pages — Apple Developer](https://developer.apple.com/app-store/custom-product-pages/) · [Offer In-App Events — ASC Help](https://developer.apple.com/help/app-store-connect/offer-in-app-events/offer-in-app-events/) · [In-App Event media & audio specifications — ASC Help](https://developer.apple.com/help/app-store-connect/reference/in-app-events/in-app-event-media-and-audio-specifications/)
