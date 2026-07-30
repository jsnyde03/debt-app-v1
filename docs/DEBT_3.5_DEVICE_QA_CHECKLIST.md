# Debt Planner v1.7 — On-Device QA Checklist (Phase 3 closeout + native block)

> **What THIS build contains:** all of v1.7 + the native block (Live Activity · widget · App Intents/Siri · context-menu · iPad) **+ the Phase-3 CLOSEOUT delight closeout** — the deepened debt-free **finale** with a **true AHAP Core-Haptics crescendo** (new `finale-haptics` module), an opt-in **chime** (`expo-audio`), and a **branded image Share card**, plus **Sentry** crash reporting. **➡️ Start with "BUILD 3 delta" below (the newest, never-device-tested work), then "BUILD 2 delta."**
>
> **How to use this:** work top-to-bottom on the phone. Each item has the **exact steps**, what a **✅ pass** looks like, and **⚠️** notes. Tick as you go; anything that fails, note it (screenshot + what you did) → I fix in-repo → you rebuild. **Priority = the NEW native (§4–§7)** — the v1.7 app surface (§3) already passed on the first device build, so §3 is a lighter re-sanity.
>
> **Legend:** ✅ = expected pass · ⚠️ = watch-out · 🅿️ = needs premium (turn on Simulate Premium, §2) · 📱 = 14 Pro/15 Pro/16 Pro only (Dynamic Island).

---

## ⭐⭐ BUILD 3 (fresh `v1.7-dev` build) — Phase 3 CLOSEOUT delta — do this FIRST

> **New since build 2 — real native pieces only a device can verify:** the debt-paid-off **celebration got deepened** (VIS-1/2/6) with a **true AHAP Core-Haptics crescendo** (new local module `finale-haptics`), an **opt-in debt-free chime** (`expo-audio`), and a **branded IMAGE Share card** (view-shot → native share sheet) on the finale, the per-debt beat, and the Progress "Vanquished" shelf. Plus **Sentry** crash reporting now initializes at launch.
>
> **⚠️ Build watch-out:** this is the **FIRST compile** of the `finale-haptics` native module + the `expo-audio` and `@sentry/react-native` plugins — watch the iOS build for an **autolink / CocoaPods** error, and §1 launch for a **New-Arch crash**. If the archive fails on Sentry (source-map upload), it's the `SENTRY_DISABLE_AUTO_UPLOAD` env — already set in `codemagic.yaml`.
>
> **How to trigger the celebration (no QA button — use real data):** on **Money → Debts**, add **two** small debts, then use **Log payment** (long-press a debt → Log payment) to **overpay one to $0** → the **per-debt "Vanquished" beat**; overpay the **last remaining** debt to $0 → the **full-screen finale**.

### 🎉 Debt-free FINALE (pay the LAST debt to $0)
- [ ] **Fires + feels premium** — the full-screen finale appears: two-wave confetti · gold bloom · the Skia **mesh-gradient** background · count-up stats. ✅ Smooth (~60fps), **no jank/stutter** on the confetti, no white flash.
- [ ] **⭐ AHAP haptic crescendo** — as it lands you feel a **building Core-Haptics crescendo** (not one buzz). ⚠️ Feel **nothing** → the `finale-haptics` module didn't autolink (or device Haptics/Silent is off); a **single tap** → it fell back to expo-haptics. Note which.
- [ ] **Safe-area + legibility** — the stats and the **"Share your win"** + dismiss buttons sit **inside** the notch / home-indicator insets (nothing clipped); the `onDark` buttons read clearly on the navy.
- [ ] **Share your win** — tap **"Share your win"** → ✅ the native **share sheet** opens with a **branded IMAGE** (not just text): "$X paid · N debts cleared · …". Save/AirDrop → the PNG is crisp, text not scaled or cut off.
- [ ] 🔊 **Chime (opt-in)** — More → Preferences → enable **Debt-free sound** (default **OFF**) → refire the finale → ✅ a short chime plays (respects the ringer/Silent switch). With it OFF → silent. _(Placeholder tone; a mastered asset swaps in at Phase 6.)_
- [ ] ♿ **Reduce Motion** — Settings → Accessibility → Motion → **Reduce Motion ON** → refire → ✅ it **snaps to the final state** (no big confetti sweep) yet still reads as a celebration; the haptic still fires.
- [ ] Dismiss → returns to **Today** cleanly.

### 🏅 Per-debt "Vanquished" beat (pay ONE of several to $0)
- [ ] Overpay one debt while others remain → ✅ the **contained beat** shows (check-cascade · "freed $X/mo" · the next-debt line).
- [ ] **Share** on the beat → the branded image share sheet opens (same as the finale).
- [ ] ♿ **VoiceOver** — turn VoiceOver on → the beat text reads as **one utterance** AND the **Share** button is focusable + activatable (the backdrop must not swallow it — the B2 fix).

### 🗂️ Progress "Vanquished" shelf share
- [ ] Progress → the **Vanquished** archive (needs ≥1 paid-off debt) → tap **Share** → ✅ the branded trophy-shelf **image** opens in the share sheet (text is the fallback only if capture fails).

### 🛡️ Sentry (crash reporting)
- [ ] **Launch is clean** — the app opens past the splash with Sentry initialized, **no new launch crash** from the wrapper. _(No DSN is set yet → it's a no-op init; this just confirms the plugin didn't break the New-Arch build/launch.)_

---

## ⭐ BUILD 2 (prior CM build) — the delta to re-check + newly test

> Everything here is **new or fixed since your last device pass**. Do this section first; §1–§9 below are unchanged and only need a re-walk if you want. Install the new TestFlight build first (§0). Premium items need **Simulate Premium ON** (More → Developer / QA). _(Widget signing is already proven from the last build — no signing watch-out this time.)_

### 🔧 Re-verify the 2 fixes you flagged
- [ ] **"View Payoff Schedule" now opens** — Money → tap a debt (edit sheet) → tap **"View Payoff Schedule"** in the header → ✅ the payoff schedule appears. _(Was a modal-over-modal that silently failed on device; now renders in-place.)_
- [ ] **Long-press blur is back** — long-press a debt row → ✅ the background **dims/blurs** behind the Edit/Delete menu. ⚠️ **Best-effort fix** — if there's *still* no blur, it's likely a library/New-Arch limitation (not a config miss) → tell me and I'll look at alternatives.

### 🆕 In-app "Log payment" (3.5.5)
- [ ] **The menu action** — long-press a **debt** row → the context menu now has **"Log payment"** (first, above Edit/Delete) → tap → an **amount sheet** opens ("Log a payment · {debt} · ${balance} owed").
- [ ] **Logging works** — enter an amount → **Log payment** → ✅ the balance drops by that amount + a **"Payment logged — Undo / Keep"** card appears on **Today** → tap **Undo** → the balance restores.
- [ ] **Overpay clamps** — enter more than the balance → the field notes it'll clear to $0 → confirm the debt goes to **$0** (never negative).

### 🆕 Siri / Shortcuts (3.5.5)
> Prereq: Settings → **Siri & Search** → Siri on. Shortcuts auto-register after first launch (give it a minute).
- [ ] **Free glances** — *"Hey Siri, what's my debt-free date?"* → speaks your date · *"Hey Siri, how much debt is left?"* → speaks the amount. (No app launch.)
- [ ] 🅿️ **Guardian read** — *"Hey Siri, am I okay this paycheck?"* → **premium** speaks the paycheck read; **free** (Simulate Premium off) → the upsell line.
- [ ] 🅿️ **Voice log-a-payment** — *"Hey Siri, log a payment in Debt Planner"* → Siri asks the **amount** + **which debt** → confirm → ✅ open the app → the balance updated + the Undo card on Today. (Free → an upsell instead.)
- [ ] **Discoverable** — the **Shortcuts** app (and Settings → Siri & Search → Debt Planner) lists all four: debt-free date · remaining · this paycheck · log a payment.
- [ ] ⚠️ **Siri caveat:** first registration can lag, and phrasing varies — if "in Debt Planner" isn't caught, try the exact phrase or run it from the Shortcuts app. A miss here is usually Siri phrasing, not the intent.

---

## §0 — Get the build on your phone
- [ ] **Trigger the build:** Codemagic → **debt-app-v1 → Start new build** → branch **`v1.7-dev`** → workflow **"Debt Planner RN — iOS TestFlight"** → **Start build**. (~20–30 min; you get a success/failure email.)
  - ⚠️ This is the **first build with the widget extension**, so watch for a **signing** error on `…debtplanner.widget`. It *should* sign (I added the dual-bundle `fetch-signing-files`; you set up the App ID + CM). If it fails on signing, send me the error.
- [ ] **Install:** once the email says success + App Store Connect finishes processing (a few min), open **TestFlight** on the phone → **Debt Planner → Update/Install**.
- [ ] **Note your model** here: __________ (Dynamic Island = 14 Pro / 15 Pro / 16 Pro+; the Lock-Screen Live Activity works on **any** iOS 16.1+).
- [ ] **Device settings prereq:** Settings → **Debt Planner** → confirm **Live Activities = ON** (and Notifications allowed). Also Settings → Face ID & Passcode → **Allow Access When Locked → Live Activities = ON** if present.

---

## §1 — Launch & foundation
- [ ] **App launches** past the splash — **no white screen, no crash** (this is the New-Architecture + all-native-modules runtime; a crash here = an autolink/New-Arch problem).
- [ ] Lands on **Today** (if you have data) or **onboarding** (fresh install). If onboarding, either complete it or tap **"Try with Sample Data"** to get a populated app fast.
- [ ] **Both themes render:** More → Preferences → Appearance → toggle **Light / Dark** → the app recolors cleanly, no unreadable text, no white flashes.

---

## §2 — Turn on QA mode (needed for premium + Live Activity tests)
- [ ] **More → Developer / QA** section is present (it only shows because QA tooling is on for this build).
- [ ] **Simulate Premium → ON.** ✅ Premium surfaces unlock (e.g. the Guardian shows the full read on Today; the paywall's "Unlock Premium" changes to manage-sub). Leave it ON for the 🅿️ items below.
- [ ] Confirm the **"Live Activity QA"** card is visible in that section (four state buttons + End + Simulate).

---

## §3 — v1.7 app surface — quick re-sanity (already passed on build #1)
_Just confirm nothing regressed with all the new native modules added since build #1._
- [ ] **⭐ FormSheet header buttons (the owed re-verify):** open **Add debt** (Money → Debts → Add debt) → tap the **✕** (top-right circle) → the sheet closes. Open a debt → tap **"View Payoff Schedule"** in the sheet header → it opens. _(This is the header-tap fix from build #1 — confirm both header buttons are tappable and NOT swallowed by the swipe gesture.)_ - DOES NOT WORK
- [ ] **Sheet gestures:** open any add/edit sheet → **swipe it down** → it dismisses. The grabber shows. Keyboard doesn't cover the Save button.
- [ ] **Swipe-to-delete:** on a debt row, **swipe left** → a red **Delete** appears → tap → confirm → row removed.
- [ ] **Blur:** the tab bar + a sheet backdrop show real UIKit blur (richer than web).
- [ ] **Charts:** Progress → scrub the **trajectory** line → the readout follows + you feel **haptic** detents. (Cash-Runway drag-select too if premium.)
- [ ] **Haptics** fire on chart scrub / payday capture.
- [ ] 🅿️ **RevenueCat paywall** (only if testing IAP): open the paywall → the three plans render with real prices. _(A real sandbox purchase is optional here — cover it in the Phase-6 pre-submit; Simulate Premium already unlocks the features.)_
- [ ] **Scanner:** Money → Debts → **Scan a statement** → the camera/document scanner opens (permission prompt shows your copy). Scanning a real statement prefills fields.

---

## §4 — 3.5.2 iOS context menu (long-press)
- [ ] **Long-press a debt row** (press and hold ~0.5s) → a **native UIMenu** pops with **Edit** and **Delete**. ✅ Delete is **red / destructive**, with a system blur behind the menu + a subtle haptic. - NO SYSTEM BLUR
- [ ] Tap **Edit** → the debt editor opens.
- [ ] Long-press again → tap **Delete** → the confirm → the row is removed.
- [ ] **Tap (not long-press)** a row → still opens the editor (long-press didn't break the tap).
- [ ] **Swipe-to-delete** still works alongside the long-press (both gestures coexist).
- [ ] Repeat the long-press on a **Bill** row and a **Goal** row (Money → Bills / Goals) — same menu.
- [ ] ⚠️ If a long-press does nothing, note which row/tab.

---

## §5 — 3.5.1 + 3.5.4 Widget (proves the App-Group data bridge)
- [ ] **Add to Home Screen:** long-press an empty Home area → **+** (top-left) → search **"Debt Planner"** → the **"Debt-Free Date"** widget → add the **small**, then **medium**, then **large**.
- [ ] ✅ Each widget shows **real data** — your **debt-free date**, the **payoff ring / % paid**, and **remaining balance** — and they **match what the app shows**. _(This is the whole App-Group test: if the widget shows an empty/"open the app" state or zeros while the app has data, the shared container isn't wired — tell me.)_
- [ ] **Add to Lock Screen:** long-press the Lock Screen → **Customize → Lock Screen** → add a widget → pick a Debt Planner **accessory** (circular / rectangular / inline).
- [ ] **StandBy:** put the phone **on a charger, landscape** → the widget appears in StandBy.
- [ ] **Live update:** in the app, pay down / edit a debt → within a minute (WidgetKit budget) the widget's numbers update.
- [ ] ✅ **Read-only:** the widget has **no buttons** (by design — the interactive action lives on the Live Activity).
- [ ] **Tap the widget** → it opens the app.

---

## §6 — 3.5.3 Live Activity + Dynamic Island (the big one)

### 6a — via the QA trigger (fastest; no premium/date tuning)
Go to **More → Developer / QA → Live Activity QA**. For each button, then **lock the phone** / pull down the Lock Screen to see the card:
- [ ] **"Clear · 2 days"** → Lock Screen shows: a **checkered-flag** header ("PAYDAY IN 2 DAYS"), a **green** state dot, the title **"Looks clear this paycheck"**, the line **"Cushion safe · $420 free to deploy"**, and a **gold progress bar**.
- [ ] 📱 **Dynamic Island:** the same activity shows **compact** (dot + "in 2 days"); **long-press** it → **expanded** (dot · countdown · title · line); the **minimal** state (dot) when another activity shares the Island.
- [ ] **"Tight · tomorrow"** → **amber/gold** dot, "A little tight this paycheck", "Move $200 from savings to hold your line", "Tomorrow".
- [ ] **"At-risk · today"** → **red** dot, "Very tight this paycheck", "$180 short of your obligations", "Today".
- [ ] ✅ **The state dot is the only thing that changes color** across the three — the rest stays calm navy/gold. That's the intended "calm data-viz."
- [ ] **"Payday day (button)"** → on the Lock Screen card, a **"Payday landed"** button appears (📱 iOS 17+ only). 
- [ ] **Tap the "Payday landed" button** (on the Live Activity itself) → open the app → ✅ the cycle has **rolled forward** and a **"Payday landed — Undo / Keep"** card is on **Today**. Tap **Undo** → it reverts. _(This is the AppIntent → App-Group queue → app-drains-on-foreground path — the machinery 3.5.5 will reuse.)_
- [ ] **"End activity"** → the Live Activity **disappears** from the Lock Screen.
- [ ] **"Simulate 'Payday landed'"** (the last QA button) → an alert confirms → **Today** shows the **Undo / Keep** card → test **Undo** (reverts the roll) and, on a fresh sim, **Keep** (dismisses, roll stays).

### 6b — via the real auto-start flow 🅿️
- [ ] With **Simulate Premium ON**, set your **next paycheck to ~2 days out**: on **Today**, tap the **"THIS PAYCHECK · <date> ✎"** row → set the next paycheck date 2 days from today → save.
- [ ] **Background the app, then reopen it** → ✅ the Live Activity **auto-starts** (premium + within ~3 days). 
- [ ] **Deep link:** tap the Live Activity (Lock Screen or Island) → ✅ it opens the app to **Today**.
- [ ] **Toggle off:** More → **Preferences → Payday countdown → OFF** → reopen → ✅ the activity **doesn't start** (and ends if running). Toggle back ON.
- [ ] ⚠️ Note: on a **free** account (Simulate Premium OFF) the auto-start should **not** happen (premium-only) — the always-on widget is the free surface.

---

## §7 — Settings / preferences
- [ ] 🅿️ **More → Preferences → "Payday countdown"** row is present **only when premium** (turn Simulate Premium off → the row disappears; on → it returns) and its toggle drives §6b.

---

## §8 — Both-theme spot check
- [ ] In **Light** and **Dark** (More → Preferences → Appearance): re-check the **Live Activity** card, the **widget**, the **context menu**, and **Today** — all legible, on-brand, no clipped/again unreadable text.

---

## §10 — 3.6 iPad (adaptive layout + pointer/keyboard) — ⚠️ needs an iPad AND a 3.6-inclusive build
_The 3.6 native-iPad work is web-verified (layout + hover render in both themes); these are the checks only a real iPad can settle. Skip if you're testing on iPhone only — nothing here regresses the phone._
> ⚠️ **This needs a NEW build cut AFTER the 3.6 commits** — the current 3.5 CM build predates 3.6, and it's the **first compile of the new local `KeyCommands` native module** (structured identically to the working `live-activity`/`scan-vision` modules, so low CI risk, but watch the first iOS build). The ⌘-shortcut checks below only apply to that 3.6-inclusive build.

**Adaptive layout (rotate the iPad to hit each):**
- [ ] **Landscape / full-screen (expanded):** **Money → Debts** shows the **list on the left + the edit form INLINE in a right pane** (tap a row → it fills the pane, the row highlights; no bottom-sheet). **Today** = two columns (Guardian/payday left · action lists right). **Progress** = one **wide** centered column (ring + charts using the room). **More** = a wider centered settings column. A left **sidebar rail** replaces the bottom tab bar.
- [ ] **Portrait / narrow:** everything **stacks** into the single centered column with the **bottom tab bar** (same as iPhone). **Rotate back and forth** → layouts reflow cleanly, no clipped/stranded content.
- [ ] **Split View + Stage Manager:** drag the app **narrow** → it becomes the compact (bottom-bar) layout · **wide** → the sidebar + expanded panes return. No blank/frozen frame at the breakpoint.

**Pointer (trackpad / mouse):**
- [ ] Move the pointer over a **debt/bill row** and a **button** → ✅ a **subtle highlight** (row raises to a lighter surface; button lifts). Inert without a pointer — that's expected.

**Keyboard (hardware keyboard on iPad):**
- [ ] **⌘N** → ✅ opens the **add-debt sheet** (navigates to Money first if you're elsewhere).
- [ ] **⌘1 / ⌘2 / ⌘3** → ✅ switch to **Today / Progress / Money**. ⚠️ **Watch for a blank screen** on a tab switch — if it happens, note it (it means the shortcut needs the tab-navigator jumpTo, not a root navigate — an easy fix).
- [ ] **Hold ⌘** → ✅ the iPad shortcut HUD lists **New debt · Today · Progress · Money**. ⚠️ If **nothing** happens on any ⌘-key, the invisible listener didn't hold **first responder** — note it (the known device-only risk for this feature).
- [ ] Both **Light + Dark**: the hover highlight + focus ring read on-brand, legible.

---

## §9 — Report back
- [ ] Jot anything that failed (which §, what you did, a screenshot). I fix in-repo → you rebuild → re-run only the failed items.
- [ ] When this is clean, 3.5.3/3.5.4 are **device-verified**; next I build **3.5.5 (App Intents / Siri)**, which reuses the payday-landed bridge you just tested — then one more signed build closes the block.

---

_Companion to `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` (the portal/ASC steps — all done). Canonical plan: `DEBT_ELEVATION_PLAN.md` §3.5._
