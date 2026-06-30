# Expedited Review Request — Notes for App Store Connect

_Paste the text below into the "Reason for expedited review" field on the App Store Connect expedited review request form._

---

## Suggested text for the expedited review request field

> This submission fixes the root cause behind our two prior rejections under Guideline 2.1.1 (App Completeness). Our previous response described a workaround (adding a debt before navigating to the Payoff tab) rather than fixing the underlying issue — which is why review with no data still failed. We've now fixed the actual bug:
>
> The Premium upgrade screen's only entry points previously required at least one debt to be entered, so a reviewer testing the app fresh (no data, as App Review does) had no way to reach the in-app purchase. We've added a "View Premium" button directly to the Payoff tab's empty state, so the purchase flow is now reachable with zero debts or financial data entered — no workaround or extra setup steps required. We've also fixed a second entry point in Settings that previously set internal state but never actually surfaced the purchase screen.
>
> Because this is a small, targeted fix for an issue Apple has already identified twice (not new functionality), we're requesting expedited review to avoid a third multi-day cycle for the same underlying issue. Happy to provide a screen recording of the corrected flow if helpful.

---

## Corrected reviewer walkthrough (no debt required)

1. Launch the app fresh — no account, no data entered.
2. Enter any paycheck amount and a future date, tap "Calculate plan."
3. Tap the "Payoff" tab in the bottom navigation. No debts have been added.
4. The "View Premium" button is immediately visible in the empty state.
5. Tap it to open the upgrade modal, then "Upgrade to Premium" to initiate the in-app purchase via the native App Store sheet.

In-App Purchases are managed through RevenueCat. The products Paycheck Debt Planner Premium Monthly and Paycheck Debt Planner Premium are configured in App Store Connect and RevenueCat and are available in the sandbox environment.

**Do not reuse the previous response's instruction to "add a debt first."** That described the bug, not a fix — it's what triggered this rejection in the first place.
