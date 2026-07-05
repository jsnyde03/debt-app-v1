# App Review Information — Notes (v1.5)

_Paste the block below into App Store Connect → App Review Information → **Notes**. Verified against v1.5 code 2026-07-03: single IAP is Premium Monthly (no annual purchase path exists yet); paywall reached via "View Premium" / any Premium feature; App Lock off by default; all data on-device._

---

## Paste into ASC Notes field

```
Paycheck Debt Planner tells you exactly which bills and debts to pay each payday. All data is stored ON-DEVICE only — there is no account, no login, and no server, so no demo account is needed or possible.

FASTEST WAY TO REVIEW THE FULL APP
On the welcome screen, tap "Try with Sample Data" to instantly load a realistic plan (bills, debts, goals) and explore every screen without entering anything.

IN-APP PURCHASE (Guideline 3.1.2)
There is one auto-renewable subscription: Premium Monthly — $4.99/month (USD; may vary by region), auto-renews until cancelled.
To view the subscription screen: from any populated plan (or Sample Data), tap a Premium feature — e.g. the Payoff tab's "View Premium" button, or Smart Insights / Forecast / Pay Cycle History. The upgrade screen displays, on-screen:
 - Subscription title ("Premium Monthly") and length (billed monthly, auto-renews until cancelled)
 - The price as the single most prominent element ($4.99/month, large bold accent text)
 - A functional Terms of Use (Apple Standard EULA) link
 - A functional Privacy Policy link
 - A Restore Purchases control
The subscription is purchasable/testable through the standard StoreKit sandbox. Premium unlocks account-wide (tied to the Apple ID), so it persists across Sample Data and a real plan.

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
- **Preempts the v1.1 3.1.2(c) rejection.** That rejection was about the billed price not being the most prominent element and missing in-app subscription disclosures. The notes state plainly where the paywall is and that title/price/period/EULA/Privacy/Restore are all on-screen — so the reviewer can verify in one tap. (Fix history: `archive/release-notes/v1.1-rejection-3.1.2c-fix.md`.)
- **"No account is needed or possible"** heads off the common "provide a demo account" request for apps with gated content — there is no backend to log into.
- **Sample Data** is the reviewer's fast path to the whole app; called out first.
- **Monthly only.** Verified in `lib/subscription/revenueCat.ts` — the purchase flow uses `currentOffering.monthly` exclusively; there is no annual product. Do not mention an annual tier until one is actually created (annual pricing decision still open).
- **App Lock note** prevents a reviewer accidentally enabling it and thinking they're locked out.
