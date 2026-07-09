# App Review Information — Notes (v1.6 "Differentiation Strike")

_Paste the block below into App Store Connect → App Review Information → **Notes**. Verified against v1.6 code 2026-07-08. Carries forward the v1.5 3.1.2 / on-device / App-Lock disclosures (unchanged) and adds the v1.6 features: Payday Autopilot (one-tap capture of the whole paycheck — required bills, minimums, AND extras), full autopay handling, and the free Interest-Saved card. IAP is unchanged from v1.5 (single Premium Monthly, monthly-only)._

---

## Paste into ASC Notes field

```
Paycheck Debt Planner tells you exactly which bills and debts to pay each payday. All data is stored ON-DEVICE only — there is no account, no login, and no server, so no demo account is needed or possible.

FASTEST WAY TO REVIEW THE FULL APP
On the welcome screen, tap "Try with Sample Data" to instantly load a realistic plan (bills, debts, goals) and explore every screen without entering anything.

NEW IN v1.6 — PAYDAY AUTOPILOT
On payday the app surfaces the plan for that paycheck — required bills, minimums, AND extra payments — and lets you confirm it all in one tap. To see it during review: open Plan Settings, set a paycheck whose next payday is today (or 1-3 days ago), tap Calculate, then relaunch — the "It's payday" sheet auto-opens. Tap "I followed the plan" to confirm the whole plan at once, or "Adjust" to reconcile individual bills (mark paid / didn't pay / a different amount). A "Start Next Pay Cycle" prompt then advances the plan. This is a free feature.

NEW IN v1.6 — AUTOPAY
Mark any bill or debt minimum as "autopay" in its add/edit form. On the Plan tab, autopay items show an "Autopay" (or "Auto-paid," once due) status instead of a Mark-Paid button and are never flagged overdue. In the payday "Adjust" view you can report that an autopay didn't run — it then becomes an "Overdue" item you can pay manually from the plan, and returns to autopay the next cycle. Free.

NEW IN v1.6 — INTEREST SAVED (free)
On the Payoff tab, the card near the top shows how much interest your extra payments save versus paying only minimums, and how much sooner you'll be debt-free. No purchase required.

IN-APP PURCHASE (Guideline 3.1.2)
There is one auto-renewable subscription: Premium Monthly — $4.99/month (USD; may vary by region), auto-renews until cancelled. Unchanged from prior versions.
To view the subscription screen: from any populated plan (or Sample Data), tap a Premium feature — e.g. the Payoff tab's "View Premium" button, or the Amortization "View Schedule" / Pay Cycle History. The upgrade screen displays, on-screen:
 - Subscription title ("Premium Monthly") and length (billed monthly, auto-renews until cancelled)
 - The price as the single most prominent element ($4.99/month, large bold accent text)
 - A functional Terms of Use (Apple Standard EULA) link
 - A functional Privacy Policy link
 - A Restore Purchases control
Purchasable/testable through the standard StoreKit sandbox. Premium unlocks account-wide (tied to the Apple ID), so it persists across Sample Data and a real plan.

APP LOCK (optional, OFF by default)
Settings offers an optional App Lock using Face ID / Touch ID / device passcode, handled entirely by iOS — the app never receives biometric data, only a yes/no. It is off by default; no action needed to review the app.

LINKS
 - Terms of Use (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/
 - Privacy Policy: https://jsnyde03.github.io/debt-planner-site/privacy.html
 - Support: https://jsnyde03.github.io/debt-planner-site/support.html

Questions during review: debtplanner224@gmail.com
```

---

## Why these notes (context, not for pasting)
- **Payday Autopilot needs a trigger.** It only appears when the device date reaches the user's next payday, so a reviewer with fresh Sample Data won't see it by default — the notes give the exact 3-step trigger (set a recent payday → Calculate → relaunch). Without this, the headline v1.6 feature is invisible during review.
- **Autopay called out** so a reviewer who marks a bill autopay understands why it shows a status instead of a Mark-Paid button (and isn't mistaken for a bug), plus how to reach the report-failed path.
- **Preempts the v1.1 3.1.2(c) rejection** (price not the most-prominent element / missing in-app disclosures): the notes state plainly where the paywall is and that title/price/period/EULA/Privacy/Restore are all on-screen, verifiable in one tap. IAP is unchanged from v1.5.
- **Monthly only.** Verified in `lib/subscription/revenueCat.ts` — the purchase flow uses `currentOffering.monthly` exclusively; there is no annual product. Do not mention an annual tier until one exists.
- **"No account needed or possible"** heads off the "provide a demo account" request — there is no backend.
- **App Lock note** prevents a reviewer accidentally enabling it and thinking they're locked out.
