# Device-checklist coverage split

> ⚙️ **GENERATED — do not edit.** `npm run audit:coverage`. Source of truth is
> [`DEBT_3.5_DEVICE_QA_CHECKLIST.md`](../DEBT_3.5_DEVICE_QA_CHECKLIST.md) (ids + verdicts) and the
> `COVERS:`/`PARTIAL:` declarations in `apps/rn/.maestro/*.yaml` (status).

## The answer

🎯 **2026-08-14: *"Nothing should be marked covered unless it's proven to be."*** So the headline is
**25**, not 33. The difference is the row below it, and it is the honest gap.

| | checks | |
|---|---:|---|
| **✅ Covered — PROVEN** | **25** | a flow claims it **and** the row is ticked: 24 machine-earned `✅auto·<runId>` · 1 human-earned `[x]` |
| **⚠️ Claimed but UNPROVEN** | **8** | a flow declares it; no run has ever passed it. **These were counted as covered before 4.1.9c** |
| **▶ Coverable, not yet built** | **64** | verdict permits automation, nothing claims it — **this is 4.1's remaining work** |
| **🎯 Permanently device-owed** | **34** | `[D]` — no lane will ever carry it |
| | | |
| **🎯 The device pass** | **60** | `[D]` **+** the human half of every `[M◐]` (26) |
| Real checks | 131 | 9 further rows are `[—]` — install steps and report-back prompts |

⛔ **A declaration is an author's claim, not a result.** `COVERS:` says what a flow is *meant* to test;
it cannot say whether the flow has ever executed, let alone passed. The 8 unproven rows are all
claimed by flows that have never gone green — and each one used to be indistinguishable, in this
report, from a check that passes on every run.

**Machine-earned rows by run:** `31812114150` 24

⚠️ **Every machine-earned row traces to a single run.** One run is one sample: it proves those flows passed once, on one runner, at one commit — not that they are stable. A regression is only visible once a second run disagrees.


**Verdict spread:** `[M]` 68 · `[M◐]` 26 · `[A]` 3 · `[D]` 34

⚠️ **`[M◐]` rows appear in BOTH the coverage columns and the device pass.** That is not double-counting —
a partial is automated in one half and manual in the other, and reporting only `[D]` would overstate
what comes off the device pass.

---

## ▶ Coverable, not yet built — the remaining work (64)

| id | verdict | check | claimed by | proof |
|---|---|---|---|---|
| §B3.1 | `[M◐]` | Fires + feels premium — the full-screen finale appears: two-wave confetti · gold bloom · the Ski | — | ⚠️ **none** |
| §B3.3 | `[M◐]` | Safe-area + legibility — the stats and the "Share your win" + dismiss buttons sit inside the not | — | *human* `[x]` |
| §B3.4 | `[M◐]` | Share your win — tap "Share your win" → ✅ the native share sheet opens with a branded IMAGE (not | — | *human* `[x]` |
| §B3.6 | `[M◐]` | ♿ Reduce Motion — Settings → Accessibility → Motion → Reduce Motion ON → refire → ✅ it snaps to  | — | ⚠️ **none** |
| §B3.7 | `[M]` | Dismiss → returns to Today cleanly. | — | ⚠️ **none** |
| §B3.8 | `[M]` | Overpay one debt while others remain → ✅ the contained beat shows (check-cascade · "freed $X/mo" | — | *human* `[x]` |
| §B3.9 | `[M]` | Share on the beat → the branded image share sheet opens (same as the finale). | — | *human* `[x]` |
| §B3.10 | `[M]` | ♿ VoiceOver — turn VoiceOver on → the beat text reads as one utterance AND the Share button is f | — | *human* `[x]` |
| §B3.11 | `[M]` | Progress → the Vanquished archive (needs ≥1 paid-off debt) → tap Share → ✅ the branded trophy-sh | — | *human* `[x]` |
| §B3.12 | `[M]` | Launch is clean — the app opens past the splash with Sentry initialized, no new launch crash fro | — | *human* `[x]` |
| §B2.2 | `[M◐]` | Long-press blur is back — long-press a debt row → ✅ the background dims/blurs behind the Edit/De | — | ⚠️ **none** |
| §B2.4 | `[M]` | Logging works — enter an amount → Log payment → ✅ the balance drops by that amount + a "Payment  | — | ⚠️ **none** |
| §B2.5 | `[M]` | Overpay clamps — enter more than the balance → the field notes it'll clear to $0 → confirm the d | — | ⚠️ **none** |
| §B2.11 | `[M]` | ⭐ \(.applicationName) renders "Debt Planner", NOT "Debt Planner (RN)". ⚠️ The load-bearing check | — | ⚠️ **none** |
| §B2.12 | `[M◐]` | A8.2 short forms are caught — *"Hey Siri, Debt Planner debt-free date"* · *"…Debt Planner balanc | — | ⚠️ **none** |
| §B2.13 | `[M]` | A8.1 alternative names — *"Hey Siri, Debt Plan balance"* and *"…My Debt Planner balance"* (INAlt | — | ⚠️ **none** |
| §B2.14 | `[M]` | Log-a-payment has no short form, on purpose — it is the one ACTION intent and people reach for a | — | ⚠️ **none** |
| §1.3 | `[M]` | Both themes render: More → Preferences → Appearance → toggle Light / Dark → the app recolors cle | — | ⚠️ **none** |
| §2.1 | `[M]` | More → Developer / QA section is present (it only shows because QA tooling is on for this build) | — | ⚠️ **none** |
| §2.2 | `[M]` | Simulate Premium → ON. ✅ Premium surfaces unlock (e.g. the Guardian shows the full read on Today | — | ⚠️ **none** |
| §2.3 | `[M]` | Confirm the "Live Activity QA" card is visible in that section (four state buttons + End + Simul | — | ⚠️ **none** |
| §3.2 | `[M◐]` | Sheet gestures: open any add/edit sheet → swipe it down → it dismisses. The grabber shows. Keybo | — | ⚠️ **none** |
| §3.3 | `[M]` | Swipe-to-delete: on a debt row, swipe left → a red Delete appears → tap → confirm → row removed. | — | ⚠️ **none** |
| §4.2 | `[M]` | Tap Edit → the debt editor opens. | — | ⚠️ **none** |
| §4.3 | `[M]` | Long-press again → tap Delete → the confirm → the row is removed. | — | ⚠️ **none** |
| §4.4 | `[M]` | Tap (not long-press) a row → still opens the editor (long-press didn't break the tap). | — | ⚠️ **none** |
| §4.5 | `[M]` | Swipe-to-delete still works alongside the long-press (both gestures coexist). | — | ⚠️ **none** |
| §4.6 | `[M]` | Repeat the long-press on a Bill row and a Goal row (Money → Bills / Goals) — same menu. | — | ⚠️ **none** |
| §6a.7 | `[M◐]` | Tap the "Payday landed" button (on the Live Activity itself) → open the app → ✅ the cycle has ro | — | ⚠️ **none** |
| §6a.9 | `[M]` | "Simulate 'Payday landed'" (the last QA button) → an alert confirms → Today shows the Undo / Kee | — | ⚠️ **none** |
| §6b.1 | `[M]` | With Simulate Premium ON, set your next paycheck to ~2 days out: on Today, tap the "THIS PAYCHEC | — | ⚠️ **none** |
| §6b.2 | `[M◐]` | Background the app, then reopen it → ✅ the Live Activity auto-starts (premium + within ~3 days). | — | ⚠️ **none** |
| §6b.4 | `[M◐]` | Toggle off: More → Preferences → Payday countdown → OFF → reopen → ✅ the activity doesn't start  | — | ⚠️ **none** |
| §6b.5 | `[M◐]` | ⚠️ Note: on a free account (Simulate Premium OFF) the auto-start should not happen (premium-only | — | ⚠️ **none** |
| §7.1 | `[M]` | 🅿️ More → Preferences → "Payday countdown" row is present only when premium (turn Simulate Prem | — | ⚠️ **none** |
| §8.1 | `[M◐]` | In Light and Dark (More → Preferences → Appearance): re-check the Live Activity card, the widget | — | ⚠️ **none** |
| §10.5 | `[A]` | ⌘N → ✅ opens the add-debt sheet (navigates to Money first if you're elsewhere). | — | ⚠️ **none** |
| §10.6 | `[A]` | ⌘1 / ⌘2 / ⌘3 → ✅ switch to Today / Progress / Money. ⚠️ Watch for a blank screen on a tab switch | — | ⚠️ **none** |
| §10.7 | `[A]` | Hold ⌘ → ✅ the iPad shortcut HUD lists New debt · Today · Progress · Money. ⚠️ If nothing happen | — | ⚠️ **none** |
| §11.1 | `[M]` | Skip must stay on screen at large text (a 375pt phone: iPhone SE 3rd-gen or 13 mini. Do | — | ⚠️ **none** |
| §11.3 | `[M◐]` | the coaching text NEVER rewrites itself (same device as §11.2.) | — | ⚠️ **none** |
| §11.4 | `[M◐]` | VoiceOver, end to end (Settings → Accessibility → VoiceOver: ON.) | — | ⚠️ **none** |
| §11.5 | `[M]` | the header must not eat the highlight at AX5 (any iPhone, AX5, both themes.) | — | ⚠️ **none** |
| §12.0.3 | `[M◐]` | exactly ONE marker on screen. ⏳ Web cannot answer this (its tab navigator leaves the | — | ⚠️ **none** |
| §12.0.7 | `[M]` | poke at it. Open a debt row, scrub the trajectory, try Can-I-Afford-This. | — | ⚠️ **none** |
| §12.0.8 | `[M◐]` | VoiceOver. Turn it on and enter the demo. | — | ⚠️ **none** |
| §12.1.1 | `[M]` | From a fresh install with no data, "See it in action" lands on Today showing a $2,000 | — | ⚠️ **none** |
| §12.1.2 | `[M]` | Force-quit mid-demo and relaunch → you land on onboarding, with no demo running and no | — | ⚠️ **none** |
| §12.2.1 | `[M]` | During the demo there is no tab bar at all — no Today/Progress/Money strip, and no empty band | — | ⚠️ **none** |
| §12.2.2 | `[M]` | Check for a dead gap between the end of the content and the dock. Screen pads the scroll by | — | ⚠️ **none** |
| §12.2.3 | `[M]` | Start the walkthrough (More → How the Guardian works). Its tab bar is still visible — that | — | ⚠️ **none** |
| §12.3.1 | `[M]` | Expect this to PASS now. It was known-bad on the c050173 build: "Unlock Premium" sat too low, | — | ⚠️ **none** |
| §12.4.1 | `[M]` | "Unlock Premium" → the paywall presents as a modal, and the "Example money" line at the top | — | ⚠️ **none** |
| §12.4.3 | `[M]` | Swipe the modal down / go back → you do not return to a demo. No example figures, no dock. | — | ⚠️ **none** |
| §12.4.4 | `[M]` | "Start my real plan" → onboarding, no demo running, and your own plan is untouched — | — | ⚠️ **none** |
| §12.5.1 | `[M]` | "Example money" is visible at the top of the screen, under the "Today" title, on every stage. | — | ⚠️ **none** |
| §12.5.2 | `[M]` | Scroll the content hard. The marker does not move — it sits above the scroller. | — | ⚠️ **none** |
| §12.5.3 | `[M]` | It is said once in the dock too? No — it must appear in exactly ONE place. Two is a defect. | — | ⚠️ **none** |
| §12.5.4 | `[M]` | The scripted run is 5 beats and it MOVES BETWEEN SCREENS by itself: Money → Today → Today → | — | ⚠️ **none** |
| §12.6.1 | `[M◐]` | Turn VoiceOver on, then enter the demo. You hear "Example money. This is a demonstration with | — | ⚠️ **none** |
| §12.6.2 | `[M]` | Rotor → Headings: "Example money" is listed as a heading, reachable without swiping to it. | — | ⚠️ **none** |
| §12.6.3 | `[M]` | Swipe through the whole screen: you can reach the dock's two exits, and you cannot reach a tab | — | ⚠️ **none** |
| §12.6.4 | `[M]` | The dock reads as one utterance — "Example money. Demonstration, 1 of 5." — not as fragments. | — | ⚠️ **none** |
| §12.7.1 | `[M]` | ••• More → Preferences → "Share anonymous usage" is present, ON by default, and toggling it | — | ⚠️ **none** |

---

## ⚠️ Claimed but UNPROVEN — declared by a flow, never passed (8)

**Read this list before quoting a coverage number.** Each row has a flow that says it covers it and no
run that has ever passed it. Until one does, it is a plan, not coverage.

| id | verdict | check | claimed by | proof |
|---|---|---|---|---|
| §11.9 | `[M◐]` | long debt names inside the scripted shortfall (any iPhone, AX3, both themes.) | `10-walkthrough-edges` *(partial)* | ⚠️ **none** |
| §11.11 | `[M◐]` | scrolling near the slider must not MOVE it (any iPhone. The counterpart to §11.10: | `10-walkthrough-edges` *(partial)* | ⚠️ **none** |
| §11.13 | `[M◐]` | beat 1's cushion bar must be PAINTED when the step arrives (any iPhone; do it from a | `10-walkthrough-edges` *(partial)* | ⚠️ **none** |
| §12.0.1 | `[M]` | you can walk around. The tab bar is visible, and Today / Progress / Money all | `09-demo-explore` | ⚠️ **none** |
| §12.0.2 | `[M]` | the disclosure follows you. On every screen you land on, "Example money" is at | `09-demo-explore` | ⚠️ **none** |
| §12.0.4 | `[M]` | the way out is wherever you are. "Start my real plan" sits beside the marker on | `09-demo-explore` | ⚠️ **none** |
| §12.0.5 | `[M]` | settings stay shut. The ••• More button is greyed and unresponsive on every | `09-demo-explore` | ⚠️ **none** |
| §12.0.6 | `[M]` | your real plan is untouched. Exit, then force-quit and reopen. | `09-demo-explore` | ⚠️ **none** |

---

## ✅ Covered — PROVEN (25)

| id | verdict | check | claimed by | proof |
|---|---|---|---|---|
| §B2.1 | `[M]` | "View Payoff Schedule" now opens — Money → tap a debt (edit sheet) → tap "View Payoff Schedule"  | `04-payoff-schedule` | `✅auto·31812114150` |
| §B2.3 | `[M◐]` | The menu action — long-press a debt row → the context menu now has "Log payment" (first, above E | `03-row-context-menu` *(partial)* | `✅auto·31812114150` |
| §1.1 | `[M]` | App launches past the splash — no white screen, no crash (this is the New-Architecture + all-nat | `01-launch-smoke` *(partial)* | `✅auto·31812114150` |
| §1.2 | `[M]` | Lands on Today (if you have data) or onboarding (fresh install). If onboarding, either complete  | `01-launch-smoke` | `✅auto·31812114150` |
| §3.1 | `[M]` | ⭐ FormSheet header buttons (the owed re-verify): open Add debt (Money → Debts → Add debt) → tap  | `02-sheet-native-tap` *(partial)* | `✅auto·31812114150` |
| §4.1 | `[M◐]` | Long-press a debt row (press and hold ~0.5s) → a native UIMenu pops with Edit and Delete. ✅ Dele | `03-row-context-menu` *(partial)* | `✅auto·31812114150` |
| §10.1 | `[M]` | Landscape / full-screen (expanded): Money → Debts shows the list on the left + the edit form INL | `i01-ipad-boot` | `✅auto·31812114150` |
| §10.2 | `[M]` | Portrait / narrow: everything stacks into the single centered column with the bottom tab bar (sa | `02-sheet-native-tap` *(partial)* | `✅auto·31812114150` |
| §11.7 | `[M◐]` | Reduce Motion, and interruption mid-story (any iPhone, dark theme.) | `06-tutorial-interactions` *(partial)* | `✅auto·31812114150` |
| §11.8 | `[M◐]` | rotation and Split View mid-step (iPad, any.) | `i03-ipad-rotate-midstep` *(partial)* | `✅auto·31812114150` |
| §11.10 | `[M]` | the walkthrough's one required gesture (any iPhone.) | `06-tutorial-interactions` | `✅auto·31812114150` |
| §11.15 | `[M]` | the highlight lands on its subject at iPad width — ✅ AUTOMATED 2026-08-13 (4.1.5.2). | `05-tutorial-walkthrough` | *human* `[x]` |
| §11.16 | `[M◐]` | Step 5 on iPad LANDSCAPE (iPad, landscape, both themes.) | `i02-ipad-step5-landscape` *(partial)* | `✅auto·31812114150` |
| §14.1 | `[M]` | one Add, from all three sections. Money → Add from Debts, then from | `07-money-add-and-rescue` | `✅auto·31812114150` |
| §14.2 | `[M]` | the answer lands where it says. Standing in Expenses, tap Add → "A debt". | `07-money-add-and-rescue` | `✅auto·31812114150` |
| §14.3 | `[M]` | the first-run fork (fresh install / Reset, so onboarding runs). ⏳ Web e2e cannot | `07-money-add-and-rescue` | `✅auto·31812114150` |
| §14.4 | `[M]` | the mis-file rescue (add an expense named "Mortgage" and one named "Rent", | `07-money-add-and-rescue` | `✅auto·31812114150` |
| §14.5 | `[M]` | Move to Debts. Tap it on the Mortgage. | `07-money-add-and-rescue` | `✅auto·31812114150` |
| §14.6 | `[M]` | "Not a debt" stays gone. Tap it on the Mortgage, force-quit, reopen. | `07-money-add-and-rescue` | `✅auto·31812114150` |
| §13.1 | `[M]` | the payoff-schedule mark, inside a sheet (any iPhone. Reset first: More → Show feature | `08-coach-marks` | `✅auto·31812114150` |
| §13.2 | `[M]` | "Got it" actually dismisses, and stays gone (any iPhone.) | `08-coach-marks` | `✅auto·31812114150` |
| §13.3 | `[M]` | the iOS-ONLY row long-press mark (iPhone/iPad only; it cannot exist anywhere else.) | `01-launch-smoke` *(partial)* · `08-coach-marks` | `✅auto·31812114150` |
| §13.4 | `[M◐]` | the trajectory mark does not bury a different chart (any iPhone, both themes.) | `08-coach-marks` *(partial)* | `✅auto·31812114150` |
| §13.5 | `[M]` | a mark is a hint, not a modal (any iPhone.) | `08-coach-marks` | `✅auto·31812114150` |
| §13.6 | `[M]` | VoiceOver hears each hint ONCE (VoiceOver ON.) | `08-coach-marks` | `✅auto·31812114150` |

---

## 🎯 Permanently device-owed (34)

| id | verdict | check | claimed by | proof |
|---|---|---|---|---|
| §B3.2 | `[D]` | ⭐ AHAP haptic crescendo — as it lands you feel a building Core-Haptics crescendo (not one buzz). | — | ⚠️ **none** |
| §B3.5 | `[D]` | 🔊 Chime (opt-in) — More → Preferences → enable Debt-free sound (default OFF) → refire the final | — | ⚠️ **none** |
| §B2.6 | `[D]` | Free glances — *"Hey Siri, what's my debt-free date?"* → speaks your date · *"Hey Siri, how much | — | ⚠️ **none** |
| §B2.7 | `[D]` | 🅿️ Guardian read — *"Hey Siri, am I okay this paycheck?"* → premium speaks the paycheck read; f | — | ⚠️ **none** |
| §B2.8 | `[D]` | 🅿️ Voice log-a-payment — *"Hey Siri, log a payment in Debt Planner"* → Siri asks the amount + w | — | ⚠️ **none** |
| §B2.9 | `[D]` | Discoverable — the Shortcuts app (and Settings → Siri & Search → Debt Planner) lists all four: d | — | ⚠️ **none** |
| §3.4 | `[D]` | Blur: the tab bar + a sheet backdrop show real UIKit blur (richer than web). | — | ⚠️ **none** |
| §3.5 | `[D]` | Charts: Progress → scrub the trajectory line → the readout follows + you feel haptic detents. (C | — | ⚠️ **none** |
| §3.6 | `[D]` | Haptics fire on chart scrub / payday capture. | — | ⚠️ **none** |
| §3.7 | `[D]` | 🅿️ RevenueCat paywall (only if testing IAP): open the paywall → the three plans render with rea | — | ⚠️ **none** |
| §3.8 | `[D]` | Scanner: Money → Debts → Scan a statement → the camera/document scanner opens (permission prompt | — | ⚠️ **none** |
| §5.1 | `[D]` | Add to Home Screen: long-press an empty Home area → + (top-left) → search "Debt Planner" → the " | — | ⚠️ **none** |
| §5.2 | `[D]` | ✅ Each widget shows real data — your debt-free date, the payoff ring / % paid, and remaining bal | — | ⚠️ **none** |
| §5.3 | `[D]` | Add to Lock Screen: long-press the Lock Screen → Customize → Lock Screen → add a widget → pick a | — | ⚠️ **none** |
| §5.4 | `[D]` | StandBy: put the phone on a charger, landscape → the widget appears in StandBy. | — | ⚠️ **none** |
| §5.5 | `[D]` | Live update: in the app, pay down / edit a debt → within a minute (WidgetKit budget) the widget' | — | ⚠️ **none** |
| §5.6 | `[D]` | ✅ Read-only: the widget has no buttons (by design — the interactive action lives on the Live Act | — | ⚠️ **none** |
| §5.7 | `[D]` | Tap the widget → it opens the app. | — | ⚠️ **none** |
| §6a.1 | `[D]` | "Clear · 2 days" → Lock Screen shows: a checkered-flag header ("PAYDAY IN 2 DAYS"), a green stat | — | ⚠️ **none** |
| §6a.2 | `[D]` | 📱 Dynamic Island: the same activity shows compact (dot + "in 2 days"); long-press it → expanded | — | ⚠️ **none** |
| §6a.3 | `[D]` | "Tight · tomorrow" → amber/gold dot, "A little tight this paycheck", "Move $200 from savings to  | — | ⚠️ **none** |
| §6a.4 | `[D]` | "At-risk · today" → red dot, "Very tight this paycheck", "$180 short of your obligations", "Toda | — | ⚠️ **none** |
| §6a.5 | `[D]` | ✅ The state dot is the only thing that changes color across the three — the rest stays calm navy | — | ⚠️ **none** |
| §6a.6 | `[D]` | "Payday day (button)" → on the Lock Screen card, a "Payday landed" button appears (📱 iOS 17+ on | — | ⚠️ **none** |
| §6a.8 | `[D]` | "End activity" → the Live Activity disappears from the Lock Screen. | — | ⚠️ **none** |
| §6b.3 | `[D]` | Deep link: tap the Live Activity (Lock Screen or Island) → ✅ it opens the app to Today. | — | ⚠️ **none** |
| §10.3 | `[D]` | Split View + Stage Manager: drag the app narrow → it becomes the compact (bottom-bar) layout · w | — | ⚠️ **none** |
| §10.4 | `[D]` | Move the pointer over a debt/bill row and a button → ✅ a subtle highlight (row raises to a light | — | ⚠️ **none** |
| §10.8 | `[D]` | Both Light + Dark: the hover highlight + focus ring read on-brand, legible. | — | ⚠️ **none** |
| §11.2 | `[D]` | no beat is silently skipped on slow hardware (the OLDEST iPhone in the support matrix — | — | ⚠️ **none** |
| §11.6 | `[D]` | haptics (any iPhone, silent switch OFF, held in hand.) | — | ⚠️ **none** |
| §11.12 | `[D]` | the highlight must keep up, not just arrive (the OLDEST iPhone in the matrix AND a | — | ⚠️ **none** |
| §11.14 | `[D]` | the tab bar's press feedback, iOS (any iPhone.) | — | ⚠️ **none** |
| §12.4.2 | `[D]` | The paywall shows real prices from the App Store (not $4.99/$29.99/$79.99 exactly — those are | — | ⚠️ **none** |

---

## ◐ Partials — automated in one half, yours in the other (26)

- **§B3.1** — Fires + feels premium — the full-screen finale appears: two-wave confetti · gold bloom · the Ski
  ⚠️ *no flow claims even the automatable half yet*
- **§B3.3** — Safe-area + legibility — the stats and the "Share your win" + dismiss buttons sit inside the not
  ⚠️ *no flow claims even the automatable half yet*
- **§B3.4** — Share your win — tap "Share your win" → ✅ the native share sheet opens with a branded IMAGE (not
  ⚠️ *no flow claims even the automatable half yet*
- **§B3.6** — ♿ Reduce Motion — Settings → Accessibility → Motion → Reduce Motion ON → refire → ✅ it snaps to 
  ⚠️ *no flow claims even the automatable half yet*
- **§B2.2** — Long-press blur is back — long-press a debt row → ✅ the background dims/blurs behind the Edit/De
  ⚠️ *no flow claims even the automatable half yet*
- **§B2.3** — The menu action — long-press a debt row → the context menu now has "Log payment" (first, above E
  03-row-context-menu: "Log payment" is present in the menu and opens the amount sheet; its POSITION ("first,
- **§B2.12** — A8.2 short forms are caught — *"Hey Siri, Debt Planner debt-free date"* · *"…Debt Planner balanc
  ⚠️ *no flow claims even the automatable half yet*
- **§3.2** — Sheet gestures: open any add/edit sheet → swipe it down → it dismisses. The grabber shows. Keybo
  ⚠️ *no flow claims even the automatable half yet*
- **§4.1** — Long-press a debt row (press and hold ~0.5s) → a native UIMenu pops with Edit and Delete. ✅ Dele
  03-row-context-menu: the native UIMenu opens with Edit + Delete; "red/destructive", the system blur and the haptic
- **§6a.7** — Tap the "Payday landed" button (on the Live Activity itself) → open the app → ✅ the cycle has ro
  ⚠️ *no flow claims even the automatable half yet*
- **§6b.2** — Background the app, then reopen it → ✅ the Live Activity auto-starts (premium + within ~3 days).
  ⚠️ *no flow claims even the automatable half yet*
- **§6b.4** — Toggle off: More → Preferences → Payday countdown → OFF → reopen → ✅ the activity doesn't start 
  ⚠️ *no flow claims even the automatable half yet*
- **§6b.5** — ⚠️ Note: on a free account (Simulate Premium OFF) the auto-start should not happen (premium-only
  ⚠️ *no flow claims even the automatable half yet*
- **§8.1** — In Light and Dark (More → Preferences → Appearance): re-check the Live Activity card, the widget
  ⚠️ *no flow claims even the automatable half yet*
- **§11.3** — the coaching text NEVER rewrites itself (same device as §11.2.)
  ⚠️ *no flow claims even the automatable half yet*
- **§11.4** — VoiceOver, end to end (Settings → Accessibility → VoiceOver: ON.)
  ⚠️ *no flow claims even the automatable half yet*
- **§11.7** — Reduce Motion, and interruption mid-story (any iPhone, dark theme.)
  06-tutorial-interactions: the INTERRUPTION half — backgrounding mid-story returns to step 3 intact. Reduce Motion is
- **§11.8** — rotation and Split View mid-step (iPad, any.)
  i03-ipad-rotate-midstep: the ROTATION half of (a): the ring re-finds its subject after a mid-step rotate, and
- **§11.9** — long debt names inside the scripted shortfall (any iPhone, AX3, both themes.)
  10-walkthrough-edges: a 60+ character debt name reaches beat 5 with the "Example" marker still on screen;
- **§11.11** — scrolling near the slider must not MOVE it (any iPhone. The counterpart to §11.10:
  10-walkthrough-edges: a vertical swipe starting ON the slider strip leaves the sheet open and the floor
- **§11.13** — beat 1's cushion bar must be PAINTED when the step arrives (any iPhone; do it from a
  10-walkthrough-edges: cold-launch frames of beat 1 are captured; whether the cushion bar is PAINTED is a
- **§11.16** — Step 5 on iPad LANDSCAPE (iPad, landscape, both themes.)
  i02-ipad-step5-landscape: the landscape frame is captured and the ring invariant holds on the clamp-free axis; the
- **§13.4** — the trajectory mark does not bury a different chart (any iPhone, both themes.)
  08-coach-marks: the trajectory mark is asserted not to occlude the chart; whether it READS as buried is a
- **§12.0.3** — exactly ONE marker on screen. ⏳ Web cannot answer this (its tab navigator leaves the
  ⚠️ *no flow claims even the automatable half yet*
- **§12.0.8** — VoiceOver. Turn it on and enter the demo.
  ⚠️ *no flow claims even the automatable half yet*
- **§12.6.1** — Turn VoiceOver on, then enter the demo. You hear "Example money. This is a demonstration with
  ⚠️ *no flow claims even the automatable half yet*
