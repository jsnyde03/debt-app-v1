# Debt Planner v1.7 — On-Device QA Checklist (Phase 3 closeout + native block)

> **What THIS build contains:** all of v1.7 + the native block (Live Activity · widget · App Intents/Siri · context-menu · iPad) **+ the Phase-3 CLOSEOUT delight closeout** — the deepened debt-free **finale** with a **true AHAP Core-Haptics crescendo** (new `finale-haptics` module), an opt-in **chime** (`expo-audio`), and a **branded image Share card**, plus **Sentry** crash reporting. **➡️ Start with "BUILD 3 delta" below (the newest, never-device-tested work), then "BUILD 2 delta."**
>
> **How to use this:** work top-to-bottom on the phone. Each item has the **exact steps**, what a **✅ pass** looks like, and **⚠️** notes. Tick as you go; anything that fails, note it (screenshot + what you did) → I fix in-repo → you rebuild. **Priority = the NEW native (§4–§7)** — the v1.7 app surface (§3) already passed on the first device build, so §3 is a lighter re-sanity.
>
> ⚠️ **NUMBERING COLLISION — read this before assuming a "§3.5.3" reference means this file.** The `3.5.x`
> in this document is the **native block** (Live Activity · widget · App Intents). There is a *different*
> `§3.5.3` in `DEBT_ELEVATION_PLAN.md`: the **Guardian walkthrough** (the in-situ tutorial). They are
> unrelated, and the closing line of this checklist ("3.5.3/3.5.4 are device-verified") means the native
> block, **not** the walkthrough.
>
> 🎯 **THIS FILE IS THE ONE PLACE A DEVICE PASS IS RUN FROM (3.5.6.3, 2026-08-10).** Phase 3.5's device
> debt had accumulated across four documents, a spec docblock and several code comments; it is now all
> here — **§11** the walkthrough, **§12** the demo, **§13** the coach-marks. The plan's Phase-6 Device-QA
> ledger is the INDEX and points here; where the two disagree, this file is the runnable truth.
>
> ⚠️ **Two things this pass CANNOT settle, so do not read a clean run as covering them:**
> - **Round 10's native-lane review was lost** (ledger item L4 — the lens outputs were never written down
>   and are unrecoverable). **Do not assume the native surface was reviewed.** §11 and §13 are a fresh
>   derivation, not a re-run of it.
> - **Android** is v1.8 and is not in scope here. Two known Android-only risks are parked for that lane:
>   `measureInWindow` window coords vs. edge-to-edge insets can park the walkthrough's highlight high or
>   low, and `expo-blur` renders no real blur without `experimentalBlurMethod`, which silently reverts the
>   dock from a material to a flat overlay.
>
> **Also owed on this build, from elsewhere in the plan:** 3.7 **A0.4** — the payoff-schedule route
> re-verify **and** the iOS long-press "Payoff schedule" menu item (no web equivalent at all); ledger
> **L5** — that the "View payoff schedule" row sits above the fold on the largest iPhone at default text
> size, now pinned above the sticky actions but verified only structurally.
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

- [ ] **§11.3 — the coaching text NEVER rewrites itself** _(same device as §11.2.)_
  On steps 3 and 4, read the panel's paragraph, then **watch it for a slow count of ten without touching
  anything.** Do this at default text size and again at the largest accessibility size.
  **PASS:** the words are identical after ten seconds, the panel does not change height, and there is no
  repeated haptic tick. With VoiceOver on, the step is read once and finishes its sentence.
  **FAIL:** the paragraph swaps between two versions, the panel jumps, the tick repeats, or VoiceOver
  restarts the step mid-sentence. Video it — the flip can be as fast as one every 1–2 seconds.
  _(Replaces the old "a beat that can't find its control still reads honestly" check. Copy no longer
  varies at runtime at all: which control a beat can find is settled at build time by
  `guardianSubjects.test.ts`, so the case that check described is now unreachable by construction —
  and the mechanism that produced it is what made the text oscillate.)_

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

- [ ] **§11.11 — scrolling near the slider must not MOVE it** _(any iPhone. The counterpart to §11.10:
  that one proves the drag works, this one proves it doesn't fire when you didn't mean it.)_
  On **Step 3 of 7**, open **"Adjust your line →"**. Put your finger down **on the slider strip itself**
  and immediately **swipe UP or DOWN** as if scrolling the sheet.
  **PASS:** the sheet scrolls and the amount does not change.
  **FAIL:** the number jumps the instant you touch down, or the value changes while you are scrolling.
  _(The pan sets its value on touch-DOWN with no horizontal threshold, inside a vertical scroll view, so
  the two gestures race. There is no competing native scroll on the web, and the browser suite never
  drags — this is unobservable off-device.)_

- [ ] **§11.12 — the highlight must keep up, not just arrive** _(the OLDEST iPhone in the matrix AND a
  ProMotion one; both themes.)_
  Step 1 → 7 without pausing, watching the bright rectangle as it TRAVELS between steps.
  **PASS:** the movement is smooth on both phones.
  **FAIL:** visible stutter or a stepped/juddering slide. Note the phone and the steps.
  _(Four animations drive the highlight's top/height/left/width — layout properties, not transforms — so
  each frame costs a re-layout. Fine in principle; the question is whether it drops frames in practice,
  and a screenshot cannot show a frame rate.)_

- [ ] **§11.13 — beat 1's cushion bar must be PAINTED when the step arrives** _(any iPhone; do it from a
  cold launch, several times.)_
  Force-quit, launch, open the walkthrough, and look at the bar inside the card on **Step 1 of 7**.
  **PASS:** the bar is drawn the moment the step is readable.
  **FAIL:** the bar is blank/white for a beat and fills in late. Note how many launches out of how many.
  _⚠️ **Intermittent on web — it appeared in some captures and not others**, which is what a paint race
  looks like. Step 1 spotlights that exact card, so a late paint is the app's first impression. Count it;
  don't just answer yes/no._

- [ ] **§11.14 — the tab bar's press feedback, iOS** _(any iPhone.)_
  Press and hold each tab, watching the icon+label under your finger.
  **PASS:** it dims/responds while held, like every other control in the app.
  **FAIL:** nothing happens visually until you release. _(Android's ripple was restored explicitly; iOS's
  press opacity was not, so this may be dead on iOS only.)_

- [ ] **§11.15 — the highlight lands on its subject at iPad width** _(iPad, both orientations, both
  themes.)_ ⚠️ **Highest-value item added in 3.5.6.2 — this fix is currently guarded by NOTHING.**
  Step through all 7 and check WHICH element the bright rectangle is drawn around.
  **PASS:** every step rings the element its words are about — the Guardian card, its bar, "Adjust your
  line →", the bills line.
  **FAIL:** the rectangle sits over an unrelated card, especially one in the **other column**. Photograph
  it and note the step.
  _(On iPad the tab bar becomes a left sidebar, which puts window and local coordinates ~700pt apart; a
  regression draws every ring that far to the right, onto the wrong column. Measured 2026-08-10: removing
  the correction changes **nothing** on the web at any width, because the overlay's origin is 0 there — so
  no browser test can hold this fix, and this check is the only thing that can.)_

- [ ] **§11.16 — Step 5 on iPad LANDSCAPE** _(iPad, landscape, both themes.)_
  Go to **Step 5 of 7** ("When it won't stretch") and look at the bottom edge of the bright rectangle.
  **PASS:** the card reads as a complete, composed panel.
  **FAIL/JUDGE:** the rectangle's bottom border cuts through the small print under the "Defer it" button,
  with the card continuing below it into the dark. Known on web at 1194×834; **portrait is clean**. This
  is a composition call — say whether it reads as a deliberate crop or as a rendering fault.

---

## §13 — the feature-discovery COACH-MARKS (3.5.5) — ⚠️ nothing here is web-observable

_Three one-sentence hints, offered once ever, re-offerable from **More → Show feature tips again**. The
web suite can prove a mark is OFFERED and that only one exists; it cannot show WHERE any of them lands,
and one of the three cannot render on the web at all._

- [ ] **§13.1 — the payoff-schedule mark, inside a sheet** _(any iPhone. Reset first: More → Show feature
  tips again.)_ Money → tap a debt to open **Edit debt**.
  **PASS:** a small card reading **"See the whole payoff"** appears **over the sheet**, near the "View
  payoff schedule" row it names, with a **"Got it"** that dismisses it.
  **FAIL:** it appears BEHIND the sheet, off the bottom of the screen, or not at all.
  _⚠️ **This is the item the whole nested-host mechanism exists for**: a root-level overlay is a sibling
  of a presented Modal on iOS, so it renders behind it. Measured on web 2026-08-10: the callout lands
  **1266pt down an 874pt screen** — the browser puts it in normal document flow, so the web literally
  cannot answer where it goes._

- [ ] **§13.2 — "Got it" actually dismisses, and stays gone** _(any iPhone.)_
  Tap **Got it** on the mark from §13.1. Force-quit and reopen the same debt.
  **PASS:** it closes on tap, and does NOT come back on the second visit.
  **FAIL:** the tap misses (nothing happens), or the mark returns. _(Web e2e can never click this button —
  same flow-layout reason as §13.1 — so the dismiss is unverified off-device.)_

- [ ] **§13.3 — the iOS-ONLY row long-press mark** _(iPhone/iPad only; it cannot exist anywhere else.)_
  With tips reset, open **Money** and wait on the debts list without touching it.
  **PASS:** a hint about long-pressing a row appears, and long-pressing a debt row does open a context menu.
  **FAIL:** no hint appears, or the hint appears and the long-press does nothing.
  _(Gated on `Platform.OS === 'ios'`, so neither the web suite nor an Android run can see it.)_

- [ ] **§13.4 — the trajectory mark does not bury a different chart** _(any iPhone, both themes.)_
  With tips reset, open **Progress**.
  **PASS:** the **"Drag the curve"** hint is readable and the payoff trajectory it names is still visible.
  **FAIL/JUDGE:** it covers the cash-flow chart above so completely that the screen reads as broken. It is
  placed ABOVE its subject deliberately (a hint must not cover the thing it explains); the judgement is
  whether obscuring the neighbouring chart is an acceptable price. Say which.

- [ ] **§13.5 — a mark is a hint, not a modal** _(any iPhone.)_
  While any mark is showing, use the screen underneath — scroll it, tap a field.
  **PASS:** everything behind stays fully usable; the mark does not block touches.
  **FAIL:** taps land on nothing, or the screen is frozen until you dismiss.

- [ ] **§13.6 — VoiceOver hears each hint ONCE** _(VoiceOver ON.)_
  Reset tips, then open Edit debt (§13.1) and Progress (§13.4).
  **PASS:** the hint is announced as **one** sentence, once.
  **FAIL:** you hear it **twice** — that means both the root layer and the sheet's own copy are live, which
  is a screen-reader defect long before it is a visual one.

---

## §12 — the bounded DEMO (3.5.4) — ⚠️ device-only, and one KNOWN defect

_Everything in 3.5.4 was verified on web (129/129) and both themes were checked by looking. What follows
is only the part a browser structurally cannot judge: safe-area insets, RN layout for a hidden tab bar,
native modal presentation, VoiceOver, and real StoreKit prices._

> ⚠️ **One item below is ALREADY KNOWN BAD in this build and is fixed in the repo** — §12.3. It is listed
> so you can confirm the symptom rather than waste time reporting it. Everything else is a genuine check.

**Reach it (two doors, test both):**
- **Fresh install / not onboarded:** first screen → **"Try with Sample Data"**.
- **Any state:** ••• More → **Unlock Premium** → scroll to **"See it in action"** below the buy button.

### §12.1 — the route guard (the one most likely to be wrong)
- [ ] From a **fresh install with no data**, "Try with Sample Data" lands on **Today showing a $2,000
      paycheck and MAR 16** — *not* on onboarding, and not on a blank screen.
- [ ] Force-quit mid-demo and relaunch → you land on **onboarding**, with **no demo running** and no
      example figures anywhere.

### §12.2 — the tab bar is HIDDEN, not just fenced
- [ ] During the demo there is **no tab bar at all** — no Today/Progress/Money strip, and no empty band
      where it used to be.
- [ ] **Check for a dead gap** between the end of the content and the dock. `Screen` pads the scroll by
      `insets.bottom + 64` to clear a tab bar that is no longer there, so a large blank space at the
      bottom of the scroll is the expected shape of that bug. Report it if you see it.
- [ ] Start the **walkthrough** (More → How the Guardian works). Its tab bar **is still visible** — that
      difference is deliberate, and this confirms the demo-only change did not leak into it.

### §12.3 — the dock and the home indicator — ⚠️ **this is the build where the fix arrives**
- [ ] **Expect this to PASS now.** It was known-bad on the `c050173` build: "Unlock Premium" sat too low,
      overlapping the home-indicator swipe zone, because the dock was missing `insets.bottom` — the same
      omission audit finding [B4] caught in the walkthrough's dock. The fix is in the repo
      (`DemoDock.tsx:47`, `paddingBottom: insets.bottom + spacing.base`) and this build is the first to
      carry it.
      **PASS:** the two dock buttons sit clear of the home-indicator strip, and a swipe-up to leave the app
      does not fight the button.
      **FAIL:** still overlapping — which would mean the fix does not address the real symptom, so say so
      rather than re-reporting it as known.

### §12.4 — the exits are terminal
- [ ] **"Unlock Premium"** → the paywall presents **as a modal**, and the "Example money" line at the top
      of the screen is **gone** the moment it appears.
- [ ] The paywall shows **real prices from the App Store** (not $4.99/$29.99/$79.99 exactly — those are
      the web fallback). If you see the fallback prices on a device, the offering is not marked current.
- [ ] **Swipe the modal down / go back** → you do **not** return to a demo. No example figures, no dock.
- [ ] **"Start my real plan"** → onboarding, no demo running, and your own plan is **untouched** —
      no debts, bills or paycheck invented by the demo.

### §12.5 — the disclosure, on the surface that matters
- [ ] **"Example money"** is visible at the top of the screen, under the "Today" title, on **every** stage.
- [ ] **Scroll the content hard.** The marker **does not move** — it sits above the scroller.
- [ ] It is said **once** in the dock too? **No** — it must appear in exactly ONE place. Two is a defect.
- [ ] The scripted run is **5 beats and it MOVES BETWEEN SCREENS by itself**: Money → Today → Today →
      Progress → Today, at roughly 0s · 4s · 9s · 14s · 20s. The states go clear → clear → **tight** →
      clear → clear, and the run ends on a debt one tap from zero.
      **PASS:** each navigation lands on the right screen with its content painted before the next beat
      fires. **FAIL:** a beat arrives on a half-painted screen, or the run never leaves Today.
      _⚠️ Watch the Skia cushion bar and the Progress ring/curve **repaint** rather than blanking on
      arrival — a late paint here is the same class as §11.13, and beat 4 is entirely about the curve._

### §12.6 — VoiceOver (the demo's audience includes screen-reader users evaluating the app)
- [ ] Turn VoiceOver on, then enter the demo. You hear **"Example money. This is a demonstration with
      sample figures."** on arrival.
- [ ] Rotor → **Headings**: "Example money" is listed as a heading, reachable without swiping to it.
- [ ] Swipe through the whole screen: you can reach the dock's two exits, and you **cannot** reach a tab
      bar or the ••• More button.
- [ ] The dock reads as **one** utterance — **"Example money. Demonstration, 1 of 5."** — not as fragments.
      _(Five, not three: 3.5.4.11 rebuilt the run as a 5-beat multi-screen arc. A dock still saying "of 3"
      is a real defect, not a stale instruction.)_

### §12.7 — the opt-out control
- [ ] ••• More → Preferences → **"Share anonymous usage"** is present, ON by default, and toggling it
      persists across a force-quit. (Nothing is transmitted in this build either way — there is no sink
      attached. This is confirming the control exists and sticks.)

---

## §9 — Report back
- [ ] Jot anything that failed (which §, what you did, a screenshot). I fix in-repo → you rebuild → re-run only the failed items.
- [ ] **§11 · §12 · §13 clean = Phase 3.5 is device-verified**, which is the last thing standing between
      3.5 and its sign-off. The native block (§4–§7) is the separate, earlier claim.
- [ ] **Priority order if you only have one sitting:** **§11.15** (the iPad highlight — the only check that
      can hold that fix), then **§13.1** (the mark the nested-host mechanism exists for), then **§11.9**
      (the missing "Example" marker, the highest-severity failure in this file), then the rest.

---

_Companion to `DEBT_NATIVE_BLOCK_MANUAL_STEPS.md` (the portal/ASC steps — all done). Canonical plan: `DEBT_ELEVATION_PLAN.md` §3.5._
