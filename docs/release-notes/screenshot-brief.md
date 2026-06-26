# Screenshot Brief — Paycheck Debt Planner
# App Store (6.7" iPhone) + Subscription Paywall

_Revised for v1.2 — reordered for stronger search-results conversion (Apple shows your first 2-3 screenshots in search results before a user even taps into the listing, so the strongest premium-value and trust signals now lead instead of waiting until slot 3-5), and updated to reflect what's actually shipped: the icon refresh (no more emoji glyphs), redesigned sliding toggles, App Lock, and Demo Mode._

Apple requires: up to 10 screenshots, 6.7" display (1290 × 2796px).
Recommended: 6–8 screenshots, portrait orientation.
Frame each in a device mockup with a headline overlay above or below.

---

## SETUP BEFORE CAPTURING

You no longer need the dev-only seed button — **use the in-app "Try with Sample Data" button** on first launch (it's a real, production feature now, not dev-only). It populates:
- Paycheck: $1,950 (bi-weekly)
- 4 required expenses (Cell Phone $330.41, CapCut $20, Electric $145.32, Internet $89.99)
- 4 debts (PayPal $600 @ 24.99%, Klarna BNPL $56.09, Capital One $1,420 @ 29.99%, Affirm BNPL $315.44)
- 2 goals (Emergency Fund $325/$1,000, Car Repair Buffer $100/$750)

This is realistic but slightly cluttered for hero shots — feel free to trim a debt or expense via the UI after seeding if a cleaner frame reads better, especially for Screenshot 1.

- Dark theme for most shots (higher contrast, premium feel, and this app's dark mode is genuinely polished — gradient depth, not just inverted colors)
- Light theme for 1–2 shots to show both themes exist
- Capture with a Premium-subscribed sandbox account (via `debtPlanner.mockSubscription` in dev, or a real sandbox purchase) for every screenshot marked **Premium**

---

## SCREENSHOT 1 — Hero / Plan Overview
**What to show:** "This Paycheck" section with the execution summary strip visible
(Required / Extra Payoff / Remaining Cushion / Status) and 3–4 required action cards below it, one showing "Overdue" for visual tension. Icons throughout should be the current lucide icon set, not emoji.

**Headline:** Know exactly where every dollar goes.
**Subhead:** See required payments, extra payoff, and safe cash — the moment you get paid.
**Theme:** Dark

---

## SCREENSHOT 2 — Smart Insights (Premium)
**What to show:** Smart Insights section expanded with 2–3 insight cards visible — a stable-buffer card, a near-payoff opportunity card, a progress card. The gold "Premium" pill badge visible on the section header.

_Moved to slot 2 (was slot 3) — this is the single strongest premium-conversion screenshot in the set and Apple surfaces the first 2-3 shots directly in search results, before anyone has tapped into the full listing. Don't bury your best subscription pitch on page two of the listing._

**Headline:** Smart guidance, every pay cycle.
**Subhead:** Adaptive insights based on your actual cash pressure and payoff momentum.
**Theme:** Dark
**Note:** Capture with Premium unlocked

---

## SCREENSHOT 3 — Timeline View
**What to show:** Timeline section expanded, showing 6–8 items with running balance on the right: paycheck received, rent/bills due, debt minimums, extra payoff, emergency contribution. The "Recommended" pill visible on the extra payment and emergency fund items.

**Headline:** See your full paycheck, step by step.
**Subhead:** A live timeline of every payment — with your safe-cash balance at every stage.
**Theme:** Dark

---

## SCREENSHOT 4 — Forecasting (Premium)
**What to show:** Forecast section expanded showing 3 monthly forecast cards with trend direction, plus the 3-month summary strip at top (cushion trend, debt reduction).

**Headline:** See pressure coming before it hits.
**Subhead:** A 3-month outlook with projected cushion, debt balance, and recommended actions.
**Theme:** Dark
**Note:** Capture with Premium unlocked

---

## SCREENSHOT 5 — Debt Payoff & Strategy
**What to show:** Payoff section with the focus-debt strip, strategy toggle (Snowball/Avalanche), payoff summary dates, and the Strategy Comparison section showing both strategies side-by-side with a "Winner" badge.

**Headline:** Pick your strategy. See the difference.
**Subhead:** Snowball vs. avalanche — side-by-side with your real payoff dates and interest.
**Theme:** Dark or light — this one reads well in either
**Note:** Capture with Premium unlocked

---

## SCREENSHOT 6 — App Lock & Privacy
**What to show:** The App Lock screen (Face ID/Touch ID prompt) or the App Lock toggle row in Plan Settings, showing the compact redesigned sliding switch in the "on" state.

_New screenshot — App Lock didn't exist when this brief was last written. For a finance app specifically, a visible security/trust signal in the first half of the screenshot set measurably helps conversion — cautious users decide whether to trust an app with debt numbers before they decide whether to subscribe._

**Headline:** Your numbers, locked to your device.
**Subhead:** Face ID, Touch ID, or your passcode — free for everyone, on whenever you want it.
**Theme:** Dark

---

## SCREENSHOT 7 — Swipe to Pay
**What to show:** A required action card mid-swipe (swipe right revealing the green "Mark Paid" action), or a completed card showing the faded/strikethrough "completed" style if mid-swipe is hard to capture.

**Headline:** Mark bills paid with a swipe.
**Subhead:** Swipe to mark paid, swipe back to undo — the plan stays current all cycle long.
**Theme:** Light (the green action reveal shows better on light)

---

## SCREENSHOT 8 — Goals
**What to show:** Goals section with 2 goals visible and progress bars, plus the goal summary strip (total saved / total goal / overall %).

**Headline:** Build your safety net alongside debt payoff.
**Subhead:** Emergency funds and savings goals tracked with every paycheck plan.
**Theme:** Light

---

## OPTIONAL — Demo Mode Callout
If you want a 9th shot: the first-run screen showing the "Try with Sample Data" button, framed as a zero-friction/try-before-you-commit message.

**Headline:** See it in action before you type a single number.
**Subhead:** Explore a full sample plan instantly — no sign-up, no bank connection.
**Theme:** Light

---

## SUBSCRIPTION PAYWALL SCREENSHOTS
Used inside the app's upgrade modal and/or for the App Store's in-app purchase promotional image. The paywall now displays the real subscription price prominently (large, bold, above the feature list) per App Review's disclosure requirements — make sure that's visible in the frame, not cropped out.

### Paywall Shot 1 — Full upgrade modal
**What to show:** The full UpgradeSection modal: "Unlock Smart Forecasting" heading, the large price block ($4.99/month) directly below it, the feature bullets, "Upgrade to Premium" button, and the Privacy Policy / Terms of Use / Support / Manage Subscription links at the bottom.
**Theme:** Dark (premium modal has dark gradient treatment)

### Paywall Shot 2 — A locked premium feature (teaser)
**What to show:** A premium section collapsed showing the gold "Premium" pill badge on the header, then the locked-preview state below it with a "View Premium" button.
**Theme:** Dark

---

## TIPS FOR CAPTURE

1. Use the iOS Simulator (iPhone 15 Pro Max or newer for 6.7" screenshots)
2. Run `npm run build && npx cap sync && npx cap open ios` then build to simulator
3. Use the in-app "Try with Sample Data" button to seed realistic data — no dev build required anymore
4. For Premium screenshots, mock a Premium subscription state for the simulator session
5. For mid-swipe shots: start a slow swipe in the simulator and use Cmd+S (screenshot) at the right moment
6. Shoot all screenshots in the same session so the data is consistent across frames
7. Add device frames and headline overlays in Figma, Sketch, or a tool like AppScreenshot.net or Previewed.app

---

## RECOMMENDED SCREENSHOT ORDER FOR APP STORE

1. Plan Overview (hero)
2. Smart Insights (Premium) — strongest conversion shot, shown in search results
3. Timeline
4. Forecasting (Premium)
5. Strategy Comparison (Premium)
6. App Lock & Privacy — trust signal
7. Swipe to Pay
8. Goals
9. (Optional) Demo Mode callout
