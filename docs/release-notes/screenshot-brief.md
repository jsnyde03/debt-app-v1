# Screenshot Brief — Paycheck Debt Planner
# App Store (6.7" iPhone) + Subscription Paywall

Apple requires: up to 10 screenshots, 6.7" display (1290 × 2796px).
Recommended: 5–7 screenshots, portrait orientation.
Frame each in a device mockup with a headline overlay above or below.

---

## SETUP BEFORE CAPTURING

Use demo data that makes the plan feel real but not overwhelming:
- Paycheck: $2,400 (bi-weekly)
- 3–4 required expenses (rent $850, electric $95, phone $65, car insurance $140)
- 2–3 debts (credit card $3,200 @ 22% APR, car loan $8,500 @ 6.9%, medical $620 @ 0%)
- 1 emergency goal ($1,000 target, $250 saved)
- Dark theme preferred for most shots (higher contrast, premium feel)
  Use light theme for 1–2 shots to show both themes exist

---

## SCREENSHOT 1 — Hero / Plan Overview
**What to show:** "This Paycheck" section with the execution summary strip visible
(Required: $1,150 | Extra Payoff: $280 | Remaining Cushion: $220 | Status: On Track)
and 3–4 required action cards below it, one showing "Overdue" for visual tension.

**Headline:** Know exactly where every dollar goes.
**Subhead:** See required payments, extra payoff, and safe cash — the moment you get paid.
**Theme:** Dark

---

## SCREENSHOT 2 — Timeline View
**What to show:** Timeline section expanded, showing 6–8 items:
- 💵 Paycheck received (+$2,400)
- 📌 Rent due (−$850) — Balance $1,550
- 💡 Electric (−$95) — Balance $1,455
- ⚡ Phone autopay (−$65) — Balance $1,390
- 💳 Credit card minimum (−$75) — Balance $1,315
- 💳 Extra → Credit card (−$180) — Balance $1,135
- 📞 Emergency fund (−$100) — Balance $1,035

Each item should show the running balance on the right. The "Recommended" pill should be visible on the extra payment and emergency fund items.

**Headline:** See your full paycheck, step by step.
**Subhead:** A live timeline of every payment — with your safe-cash balance at every stage.
**Theme:** Dark

---

## SCREENSHOT 3 — Smart Insights (Premium)
**What to show:** Smart Insights section expanded with 2–3 insight cards visible:
- A green "Buffer looks stable" card with a checkmark icon
- A blue "Near Payoff Opportunity" card highlighting the medical bill
- The "Progress Still Continues" card at the bottom

The Premium pill badge should be visible on the section header.

**Headline:** Smart guidance, every pay cycle.
**Subhead:** Adaptive insights based on your actual cash pressure and payoff momentum.
**Theme:** Dark
**Note:** Capture with a Premium-subscribed account so the insights are fully unlocked

---

## SCREENSHOT 4 — Forecasting (Premium)
**What to show:** Forecast section expanded showing 3 monthly forecast cards:
- Month 1: "Healthy Outlook" (green) with cushion trending up
- Month 2: "Healthy Outlook" (green) with debt balance shown
- The 3-month summary strip at top: "+$85 Cushion Trend | −$840 Debt Reduction"

**Headline:** See pressure coming before it hits.
**Subhead:** A 3-month outlook with projected cushion, debt balance, and recommended actions.
**Theme:** Dark
**Note:** Capture with Premium unlocked

---

## SCREENSHOT 5 — Debt Payoff & Strategy
**What to show:** Payoff section with:
- Focus debt strip: "Credit Card — $3,200 remaining"
- Strategy toggle on "Avalanche"
- Payoff summary: "Debt Free: Mar 2027 | With current recommendation: Nov 2026"
- Strategy Comparison section showing snowball vs. avalanche side-by-side with "Winner" badge on Avalanche

**Headline:** Pick your strategy. See the difference.
**Subhead:** Snowball vs. avalanche — side-by-side with your real payoff dates and interest.
**Theme:** Dark (or light — this screenshot works well in light)
**Note:** Capture with Premium unlocked

---

## SCREENSHOT 6 — Swipe to Pay
**What to show:** A required action card mid-swipe (swipe right revealing the green "Mark Paid" action).
Show the card tilted/translated with the green reveal behind it.
If mid-swipe is hard to capture, show the "Mark Paid" button and a completed card below it with the strikethrough/faded "completed" style.

**Headline:** Mark bills paid with a swipe.
**Subhead:** Swipe to mark paid, swipe back to undo — the plan stays current all cycle long.
**Theme:** Light (green action shows better on light)

---

## SCREENSHOT 7 — Goals
**What to show:** Goals section with 2 goals visible:
- Emergency Fund: $250 of $1,000 — progress bar at 25%
- Vacation Fund: $800 of $2,000 — progress bar at 40% — "Funded" chip NOT visible (still in progress)
The goal summary strip at top: "Total Saved: $1,050 | Total Goal: $3,000 | Overall: 35%"

**Headline:** Build your safety net alongside debt payoff.
**Subhead:** Emergency funds and savings goals tracked with every paycheck plan.
**Theme:** Light

---

## SUBSCRIPTION PAYWALL SCREENSHOTS
These are used inside the app's upgrade modal and/or for the App Store's in-app purchase promotional image.

### Paywall Shot 1 — Full upgrade modal
**What to show:** The full UpgradeSection modal open, showing:
- "Unlock Smart Forecasting" heading
- The 5 feature bullets (Smart Forecasting, Payoff Guidance, Interest Reduction Insights, What Changes If..., Adaptive Recommendations)
- "Upgrade to Premium" button visible
- Privacy Policy + Support links at the bottom
**Theme:** Dark (premium modal has dark gradient treatment)

### Paywall Shot 2 — A locked premium feature (teaser)
**What to show:** The Strategy Comparison section collapsed, showing the "Premium" gold pill badge on the header.
Then the locked-preview state below it: "Unlock strategy comparison. Premium will compare snowball and avalanche side-by-side..." with the "View Premium" button.
**Theme:** Dark

---

## TIPS FOR CAPTURE

1. Use the iOS Simulator (iPhone 15 Pro Max for 6.7" screenshots)
2. Run `npm run build && npx cap sync && npx cap open ios` then build to simulator
3. Use the dev "Populate Demo Data" button (visible in development mode) to fill the app with realistic data, then adjust amounts
4. Hide the dev button before final screenshots (it's behind `process.env.NODE_ENV === "development"` so it won't appear in production builds)
5. For mid-swipe shots: start a slow swipe in the simulator and use Cmd+S (screenshot) at the right moment
6. Shoot all screenshots in the same session so the data is consistent across frames
7. Add device frames and headline overlays in Figma, Sketch, or a tool like AppScreenshot.net or Previewed.app

---

## RECOMMENDED SCREENSHOT ORDER FOR APP STORE

1. Plan Overview (hero — most important, shown in search results)
2. Timeline
3. Smart Insights
4. Forecasting
5. Strategy Comparison
6. Swipe to Pay
7. Goals
