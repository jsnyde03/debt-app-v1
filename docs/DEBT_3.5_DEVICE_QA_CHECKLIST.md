# Debt Planner v1.7 — On-Device QA Checklist (Phase 3 closeout + native block)

> **What THIS build contains:** all of v1.7 + the native block (Live Activity · widget · App Intents/Siri · context-menu · iPad) **+ the Phase-3 CLOSEOUT delight closeout** — the deepened debt-free **finale** with a **true AHAP Core-Haptics crescendo** (new `finale-haptics` module), an opt-in **chime** (`expo-audio`), and a **branded image Share card**, plus **Sentry** crash reporting. **➡️ Start with "BUILD 3 delta" below (the newest, never-device-tested work), then "BUILD 2 delta."**
>
> **How to use this:** work top-to-bottom on the phone. Each item has the **exact steps**, what a **✅ pass** looks like, and **⚠️** notes. Tick as you go; anything that fails, note it (screenshot + what you did) → I fix in-repo → you rebuild. **Priority = the NEW native (§4–§7)** — the v1.7 app surface (§3) already passed on the first device build, so §3 is a lighter re-sanity.
>
> ⚠️ **NUMBERING COLLISION — read this before assuming a "§3.5.3" reference means this file.** The `3.5.x`
> in this document is the **native block** (Live Activity · widget · App Intents). There is a *different*
> `§3.5.3` in `DEBT_ELEVATION_PLAN.md`: the **Guardian walkthrough** (the in-situ tutorial). They are
> unrelated, and the closing line of this checklist ("3.5.3/3.5.4 are device-verified") means the native
> block, **not** the walkthrough. The walkthrough's device-owed items live in the **Phase-6 Device-QA
> ledger** under "§3.5.3 the Guardian WALKTHROUGH" — added 2026-08-04, when a round-4 audit found the
> whole set had been recorded nowhere durable.
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

---

## §11 — the Guardian WALKTHROUGH — ⚠️ device-only, from the round-7 audit

> ⚠️ **Numbering collision:** the plan calls this feature 3.5.3, and §6 above ALSO says "3.5.3" for the
> Live Activity in the native block. They are different work. §11 is the 7-step coaching overlay on Today.

_These cannot be settled on web: react-native-web has no VoiceOver, no haptics, no OS text scaling
(`PixelRatio.getFontScale()` is always 1), and no native gesture handling. Every item below is a real
audit finding whose verification the automated suite structurally cannot perform._

**Reach the walkthrough (all items):** launch → complete onboarding if prompted → **Today** tab → find the
card headed **PAYDAY GUARDIAN** → scroll to the quiet grey link near its bottom reading **"How this
works"** → tap it. The walkthrough starts at **Step 1 of 7**: a dark layer covers the screen with a bright
rectangle cut around one element, and a frosted panel sits at the bottom with **Next**, **Back**, **Skip**.
_If the Guardian card isn't there, use **More → How the Guardian works** instead._

**Set text size:** Settings → Accessibility → Display & Text Size → Larger Text → turn ON *Larger
Accessibility Sizes* → drag the slider fully **right** (= AX5; one notch in from the right = AX4).
**Set theme:** Settings → Display & Brightness → Light / Dark.

- [ ] **§11.1 — Skip must stay on screen at large text** _(a 375pt phone: iPhone SE 3rd-gen or 13 mini. Do
  NOT substitute a Pro Max — this is width-driven and a wide phone can pass while an SE fails.)_
  At **AX3**, then **AX5**, in **both themes**: enter the walkthrough and look at the bottom panel's button
  row on steps 1→6. (Step 7 shows **Finish** and has no Skip.)
  **PASS:** on every step, **Skip** is fully visible with its whole tap area inside the panel, **Back** is
  not truncated, and tapping Skip closes the walkthrough.
  **FAIL:** Skip is partly/entirely off the right edge, or Back is cut off, or a tap where Skip should be
  does nothing. Photograph each failing step and note the text size.

- [ ] **§11.2 — no beat is silently skipped on slow hardware** _(the OLDEST iPhone in the support matrix —
  not the simulator, which runs on desktop-class CPU and cannot reproduce this.)_
  Default text size. Run the walkthrough **10 times end to end**, pressing **Next** as soon as each step's
  text appears (don't linger). Note the **"Step N of 7"** number at every press. Force-quit between runs.
  **PASS:** all 10 runs show 1,2,3,4,5,6,7 in order. Step 3 asks you to open and move a line; step 4 asks
  you to confirm your bills — **both must appear**.
  **FAIL:** any run where the number jumps (2→4, 2→5) or where step 3 and/or 4 never appears. Record the
  count and which numbers. **Any non-zero count is a fail** — the count sizes the fix.

- [ ] **§11.3 — a beat that can't find its control still reads honestly** _(same device as §11.2.)_
  If §11.2 produced a run where a step's bright rectangle never appeared, read that step's text.
  **PASS:** the text does NOT tell you to open, drag, move or confirm anything — it describes what the
  Guardian does. The step count still advances one at a time and **Back** returns to the previous step and
  **stays** there.
  **FAIL:** the text asks you to operate a control you cannot see; or pressing Back moves the number down
  and it jumps forward again on its own within a second or two. Video the Back behaviour if it happens.

- [ ] **§11.4 — VoiceOver, end to end** _(Settings → Accessibility → VoiceOver: ON.)_
  Swipe through the whole walkthrough on every step, both themes.
  **PASS:** each step announces its number, the words **"Example money"**, the title and the body. On the
  five scripted steps you cannot reach any control on the card behind the panel. On steps 3 and 4 you CAN
  reach the one control the step is about (**"Adjust your line"**, then the bills confirmation) and **not**
  "See your forecast" or the other one. Nothing on the card behind can be double-tapped into.
  **FAIL:** silence on any step; or you can double-tap something behind the panel on a scripted step; or
  step 3/4's own control cannot be reached.

- [ ] **§11.5 — the header must not eat the highlight at AX5** _(any iPhone, AX5, both themes.)_
  Step through all 7 and look at the bright rectangle and its thin coloured outline.
  **PASS:** the outline is complete on all four sides and no part of the highlighted element hides behind
  the large word **"Today"** at the top.
  **FAIL:** the outline's top edge disappears under the header. Photograph, note the step.

- [ ] **§11.6 — haptics** _(any iPhone, silent switch OFF, held in hand.)_
  **PASS:** a light tick as each step lands; a distinctly STRONGER tap at exactly two moments — when you
  save a new line (step 3) and when you confirm your bills (step 4).
  **FAIL:** no haptics at all; the same strength everywhere; or a strong tap on a step where you did
  nothing. (Neither web nor the simulator can feel these — this is the only way to check.)

- [ ] **§11.7 — Reduce Motion, and interruption mid-story** _(any iPhone, dark theme.)_
  **(a)** Settings → Accessibility → Motion → **Reduce Motion: ON**. Press Next through all 7.
  **PASS:** transitions are instant. **FAIL:** on any step the whole screen goes uniformly dark with
  nothing highlighted, holds for about a third of a second, then snaps open. Note the steps.
  **(b)** Reduce Motion OFF. Go to **Step 4 of 7** and tap the highlighted line reading *"All your regular
  bills entered? I'll hold a smaller safety net."* A sequence plays by itself over ~3 seconds. **Within one
  second of tapping**, swipe up to the home screen. Count to 30. Reopen from the app switcher.
  **PASS:** you return to step 4, intact and legible; nothing plays out in a burst.
  **FAIL:** several changes fire at once in one jump, or a message about a safety net is on screen that you
  never saw arrive.
  **(c)** Turn **App Lock** on (More → App Lock) and **VoiceOver** on, then repeat (b).
  **FAIL:** the phone speaks a sentence about a safety net **while the locked screen is showing**.

- [ ] **§11.8 — rotation and Split View mid-step** _(iPad, any.)_
  Go to **Step 3 of 7**; the row **"Adjust your line →"** is highlighted.
  **(a)** Rotate 90°, then **within one second** tap once in the middle of the screen, away from that row.
  **(b)** Rotate back, open Split View, and drag the divider narrower then wider while step 3 shows.
  **PASS:** after each change the bright rectangle settles back onto **"Adjust your line →"** within about
  a second, and the tap in (a) does nothing at all.
  **FAIL:** the rectangle sits over an unrelated part of the screen for a noticeable moment; or the tap in
  (a) opens a panel, ticks something, or changes any number. Note exactly what it hit.

- [ ] **§11.9 — long debt names inside the scripted shortfall** _(any iPhone, AX3, both themes.)_
  **Setup:** Money tab → rename one debt to 60+ characters, e.g.
  `Chase Sapphire Preferred Visa Signature Card ending 4429 (joint)`. Save.
  Go to **Step 5 of 7** ("When it won't stretch") and read the whole card.
  **PASS:** the long name wraps or truncates with "…", no text overlaps, every amount is readable, **and
  the word "Example" is visible on screen** (in the panel's "Step 5 of 7 · Example money" line and/or on
  the card).
  **FAIL:** the name collides with a number, any amount is clipped, **or the "Example" marker is not
  visible anywhere on this step.** ⚠️ **Treat a missing marker here as the highest-severity result in this
  entire checklist** — step 5 deliberately shows a made-up shortfall using your REAL debt names, and the
  marker is the only thing stopping it reading as a genuine warning about your money.
  **Cleanup:** rename the debt back.

- [ ] **§11.10 — the walkthrough's one required gesture** _(any iPhone.)_
  On **Step 3 of 7**, tap **"Adjust your line →"**, then **drag** the slider in the sheet and press Save.
  **PASS:** the slider follows your finger, the sheet closes, and a short bar animates in the bottom panel
  showing what changed.
  **FAIL:** the slider doesn't respond to a drag (it is a gesture-handler control, which the browser suite
  cannot exercise at all), or nothing animates after Save.

---

## §9 — Report back
- [ ] Jot anything that failed (which §, what you did, a screenshot). I fix in-repo → you rebuild → re-run only the failed items.
- [ ] When this is clean, 3.5.3/3.5.4 are **device-verified**; next I build **3.5.5 (App Intents / Siri)**, which reuses the payday-landed bridge you just tested — then one more signed build closes the block.

---

_Companion to `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` (the portal/ASC steps — all done). Canonical plan: `DEBT_ELEVATION_PLAN.md` §3.5._
